App.i18n.content({
  'lab-thread-002': {
    title: 'Flash sale 00:00 — HikariPool exhausted, 41 threads waiting for getConnection',
    scenario: `**Context:** **PayVN Checkout** is a Spring Boot 3.4 (Java 21, Hibernate 6) service processing payments. Configuration: Tomcat {{max-threads=200}}, Hikari {{maximum-pool-size=20}}, {{connection-timeout=30000}}ms, PostgreSQL 15. On the night of **Oct 22, 2026**, a 00:00 flash sale occurred; order volume increased 12x within 90 seconds.

**Symptoms:** From **00:03**, HTTP 500 errors spiked, logs filled with {{Connection is not available, request timed out after 30000ms}}. Pod CPU ~35%, RAM normal, PostgreSQL CPU ~20% with no significant lock wait. Actuator metrics at 00:03:10: {{hikaricp.connections.active=20}}, {{idle=0}}, {{pending=41}}. The banking partner just deployed a new version, and their transfer notification API was abnormally slow (p99 increased from 300ms to 28–30 seconds).

**Collected Data:** Thread dump at 00:03:17 and partial pod JSON logs ({{leak-detection-threshold=20000}} enabled temporarily for investigation).`,
    questions: [
      'Why do 41–52 threads have to wait for {{getConnection}} even though PostgreSQL is using only ~20% CPU? Identify which thread is holding the connection and provide evidence.',
      'Does increasing {{maximum-pool-size}} from 20 to 100 resolve this issue? Calculate using Little\'s law with the current p99.',
      'Redesign the payment confirmation flow to ensure DB connections are never held during an external HTTP call. Include how to handle partner timeouts.'
    ],
    hints: [
      'Which thread in the dump is RUNNABLE at {{sun.nio.ch.Net.poll}} / {{NioSocketImpl.timedRead}} (waiting to read socket)? Is it inside a transaction — look at the stack below {{confirmAndNotify}} and compare with leak detection.',
      'Hikari {{active=20, idle=0, waiting=41}} means all 20 connections are currently borrowed, not that the pool is "broken". Who borrowed them and how long are they holding them?',
      'Partner p99 = 28–30s, connection-timeout = 30s. If connections are held for the entire 30s, how many connections are needed for 500 TPS? Is that number feasible?'
    ],
    answer: `**Summary:** It is not that PostgreSQL is slow, nor that the pool is "too small". Three threads like {{http-nio-8080-exec-42/44/46}} are holding connections **while waiting for the HTTP call to the bank partner** (28–30 seconds/call) because the call is placed inside a transaction. With 20 connections and the holding time amplified to ~30 seconds, the queue grows linearly; 41–52 threads are stuck at {{HikariPool.getConnection}}. The root fix is **shortening the connection holding time**, not increasing the pool size.

### Root Cause

In {{PaymentService.confirmAndNotify}} (proxy {{@Transactional}} opens transaction and borrows connection **before** entering the method; line 131 calls partner):

~~~java
@Transactional                                  // starts transaction + borrows connection immediately
public void confirmAndNotify(long orderId) {
    Payment p = repo.find(orderId);             // uses connection
    p.markConfirmed();
    repo.save(p);                               // UPDATE, not yet committed
    bankClient.notifyTransfer(p);               // line 131: HTTP 28-30s — CONNECTION STILL HELD
}                                               // commits + releases connection
~~~

Spring borrows the connection at {{JpaTransactionManager.doBegin}} and only releases it when the transaction commits/rolls back. Therefore, throughout the 30 seconds of socket waiting, the connection remains marked as {{active}}. The partner deployed a new version, increasing p99 from 300ms to ~29s, so the connection holding time increased nearly 100x — exactly when the flash sale increased load by 12x.

This is a classic **"wide transaction"** error + lack of timeout/bulkhead for external dependencies. It doesn't appear in CPU because threads are waiting for IO; it doesn't appear in DB because the DB is truly idle; it only appears in pool {{pending}} metrics and API latency.

### Evidence

- {{HikariPool-1 stats total=20 active=20 idle=0 waiting=41}} at 00:03:10, increasing to {{waiting=47}} then {{52}} — the queue expands over time, a sign of connections held too long, not insufficient configuration.
- The dump has at least 3 threads in {{TIMED_WAITING (parking)}} at {{SynchronousQueue.poll}} ← {{ConcurrentBag.borrow}} ← {{HikariPool.getConnection}} ← {{JpaTransactionManager.doBegin}} ← proxy {{PaymentService.hold}}. They are waiting for a connection to be returned to the pool (up to {{connection-timeout}} 30s, then throwing {{SQLTransientConnectionException}}), not waiting for the DB.

### How to Fix

**Short-term (first hour):**
1. Lower the partner notification timeout to 2–3 seconds (connect 500ms, read 2000ms) to release connections faster; enable a circuit breaker to stop calls when the partner is failing.
2. Temporarily disable synchronous notification (feature flag), record the state as {{PENDING_NOTIFY}}, and let a background job retry later. Prioritize not losing orders.
3. **Do not** just increase the pool: 20 → 100 just shifts the load to PostgreSQL, 100 connections × 30s will still exhaust if TPS is high enough, and PostgreSQL suffers more from connection storms.
4. Enable {{leak-detection-threshold}} at 20s to get evidence and alerts; restart to flush stuck threads after blocking the source of the jam.

**Long-term:** move network calls outside the transaction. Record in DB first, call partner later (or outbox + worker):

~~~java
@Transactional
public void confirm(long orderId) {
    Payment p = repo.find(orderId);
    p.markConfirmed();
    outbox.save(OutboxEvent.of("BANK_NOTIFY", p));  // within transaction, only DB write
}                                                   // commits + RELEASES connection immediately

// Separate worker, does not hold connection when making HTTP calls
@Scheduled(fixedDelay = 500)
public void flushOutbox() {
    for (OutboxEvent e : outbox.lockBatch(50)) {
        bankClient.notifyTransfer(e);               // timeout 2s + idempotent retry
        outbox.markSent(e);
    }
}
~~~

Mandatory accompanying points: **idempotency key** sent to the partner (already has {{idem=9f2c...}} in logs — keep and use during retry), **retry with backoff + dead-letter**, **bulkhead** to limit concurrent calls (Resilience4j {{Bulkhead}}), and **timeouts at every layer** (Apache HttpClient {{RequestConfig}}, not just Spring's).

Why not just increase the pool — calculated by Little's law:

| Metric | Before incident | During incident |
|---|---|---|
| Request TPS (holding connection) | ~40 | ~500 |
| Connection holding time | ~0.35s (DB ~50ms + HTTP ~300ms) | ~29.3s (waiting for HTTP) |
| Connections needed = TPS × hold | ~14 | ~14 650 |

The figure of 14,650 shows increasing the pool is unfeasible (100 connections can only serve 100 / 29.3 ≈ 3.4 confirms/second). Conversely, moving HTTP outside the transaction reduces hold time to ~30ms: 500 × 0.03 = 15 connections, pool 20 remains sufficient.

### Prevention

- Alert on {{hikaricp.connections.pending}} > 5 for 30s and {{connections.active / maximumPoolSize}} > 0.9 sustained, instead of waiting for HTTP 500.
- Set **specific SLOs for dependencies** (partner p99) and alert when p99 > 1s; this incident originated from the bank side, our system was just a victim.
- Review checklist: no {{@Transactional}} surrounding HTTP/Kafka/S3/SMTP calls; enable {{spring.jpa.open-in-view=false}} to avoid holding EntityManager throughout the request.
- Perform load testing with simulated slow dependencies (Toxiproxy) to observe pool exhaustion before reaching production.

### Interview notes:
When seeing {{active == maximumPoolSize}} and {{waiting}} increasing steadily, the first question is not "how big is the pool?" but "who is holding it?". Quickly identify using {{jcmd <pid> Thread.print}}, then count threads at {{ConcurrentBag.borrow}} and check RUNNABLE threads at {{NioSocketImpl.timedRead}} / {{Net.poll}} with {{TransactionInterceptor}} below. Another common mistake is enabling leak detection and panicking due to "leak" logs — Hikari only reports connections held over the threshold; it doesn't distinguish real leaks from excessively long transactions; read the stack before concluding.`,
    rubric: [
      'Identify connection held during HTTP call to partner inside @Transactional (stack confirmAndNotify → BankClient.notifyTransfer line 131) and cite leak detection log + pool stats active=20, idle=0, waiting increasing.',
      'Explain why increasing maximum-pool-size does not resolve it (Little\'s law: thousands of connections needed when hold ~30s), and why CPU/DB are both idle.',
      'Propose shortening the transaction: commit first then call partner asynchronously/outbox, short timeout + circuit breaker + bulkhead, idempotency when retrying.',
      'Mention correct monitoring/alerting (pending connections, active/pool ratio, dependency p99) and prevention measures during code review.'
    ]
  }
});
