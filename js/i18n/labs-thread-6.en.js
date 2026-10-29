/*
 * English translation of js/data/labs-thread.js — task T441. Format: js/core/i18n.js (content overlay).
 * ids: lab-thread-002
 */
App.i18n.content({
  'lab-thread-002': {
    title: `Flash sale at 00:00 — HikariPool exhausted, 41 threads waiting on getConnection`,
    scenario: `**Context:** **PayVN Checkout** is a Spring Boot 3.4 service (Java 21, Hibernate 6) handling payments. Config: Tomcat {{max-threads=200}}, Hikari {{maximum-pool-size=20}}, {{connection-timeout=30000}}ms, PostgreSQL 15. On the night of **22/10/2026**, a flash sale started at 00:00; order volume spiked 12x within 90 seconds.

**Symptoms:** Starting **00:03**, the HTTP 500 rate spiked, logs flooded with {{Connection is not available, request timed out after 30000ms}}. Pod CPU ~35%, RAM normal, PostgreSQL only ~20% CPU and no significant lock wait. Actuator metrics at 00:03:10: {{hikaricp.connections.active=20}}, {{idle=0}}, {{pending=41}}. The banking partner had just deployed a new version and their transfer-confirmation API became unusually slow (p99 went from 300ms to 28–30 seconds).

**Data collected:** Thread dump at 00:03:17 and JSON log excerpt from the pod (with {{leak-detection-threshold=20000}} temporarily enabled for investigation).`,
    questions: [
      'Why did 41–52 threads wait on {{getConnection}} even though PostgreSQL used only ~20% CPU? Identify which thread holds the connection and provide evidence.',
      'Would increasing {{maximum-pool-size}} from 20 to 100 solve this incident? Calculate using Little\'s law with the current p99.',
      'Redesign the payment confirmation flow so it never holds a DB connection across an outbound HTTP call. Also describe how to handle partner timeouts.'
    ],
    hints: [
      'Which thread in the dump is RUNNABLE at {{sun.nio.ch.Net.poll}} / {{NioSocketImpl.timedRead}} (waiting to read a socket)? Is it inside a transaction — look at the stack below {{confirmAndNotify}} and cross-reference with leak detection.',
      'Hikari {{active=20, idle=0, waiting=41}} means all 20 connections are borrowed, not that the pool is "broken". Who borrowed them and for how long?',
      'Partner p99 = 28–30s, connection-timeout = 30s. If a connection is held for 30s, how many connections are needed for 500 TPS? Is that number feasible?'
    ],
    answer: `**Summary:** It is not that PostgreSQL is slow, nor that the pool is "too small". Three threads like {{http-nio-8080-exec-42/44/46}} are holding connections **while waiting for HTTP calls to the banking partner** (28–30 seconds per call) because the call sits inside the transaction. With 20 connections and hold time inflated to ~30 seconds, the queue grows linearly; 41–52 threads stuck at {{HikariPool.getConnection}}. The root fix is to **shorten the connection hold time**, not to increase the pool.

### Root cause

In {{PaymentService.confirmAndNotify}} (a {{@Transactional}} proxy that opens a transaction and borrows a connection **before** entering the method; line 131 calls the partner):

~~~java
@Transactional                                  // opens transaction + borrows connection immediately
public void confirmAndNotify(long orderId) {
    Payment p = repo.find(orderId);             // uses connection
    p.markConfirmed();
    repo.save(p);                               // UPDATE, not yet committed
    bankClient.notifyTransfer(p);               // line 131: HTTP 28-30s — CONNECTION STILL HELD
}                                               // commit + return connection
~~~

Spring borrows the connection at {{JpaTransactionManager.doBegin}} and only returns it when the transaction commits or rolls back. Therefore, for the full 30 seconds of socket wait, the connection remains marked {{active}}. The partner's new deployment pushed p99 from 300ms to ~29s, so connection hold time increased nearly 100x — right when the flash sale spiked load 12x.

This is the classic **"wide transaction"** + **missing timeout/bulkhead for an external dependency**. It does not show up in CPU because threads wait on IO; it does not show up in the DB because the DB is actually idle; it only appears in the pool's {{pending}} and API latency.

### Evidence

- {{HikariPool-1 stats total=20 active=20 idle=0 waiting=41}} at 00:03:10, rising to {{waiting=47}} then {{52}} — the queue inflates over time, a signature of holding connections too long, not misconfiguration.
- The dump shows at least 3 threads {{TIMED_WAITING (parking)}} at {{SynchronousQueue.poll}} ← {{ConcurrentBag.borrow}} ← {{HikariPool.getConnection}} ← {{JpaTransactionManager.doBegin}} ← proxy {{PaymentService.hold}}. They wait for a connection to be returned to the pool (max {{connection-timeout}} 30s, then {{SQLTransientConnectionException}}), not for the DB.
- Three threads {{RUNNABLE}} at {{sun.nio.ch.Net.poll}} ← {{NioSocketImpl.timedRead}} (waiting to read a socket with timeout — thread state is still RUNNABLE even though it burns no CPU) with stack {{BankClient.notifyTransfer(BankClient.java:88)}} ← {{PaymentService.confirmAndNotify(PaymentService.java:131)}} ← {{PaymentController.confirm}}. Below that sits {{TransactionInterceptor.invoke}} ← {{PaymentService$$SpringCGLIB$$0.confirmAndNotify}}: the HTTP call is **inside** the transaction. These are the threads **holding** connections while waiting on the network.
- Leak detection points directly: {{Connection leak detection triggered ... on thread http-nio-8080-exec-42}} with the borrow stack through {{JpaTransactionManager.doBegin}} ← {{PaymentService$$SpringCGLIB$$0.confirmAndNotify}} ← {{PaymentController.confirm}}; afterward that same thread logs {{elapsed=21607ms}} for the HTTP call — the connection was held for at least 21.6s.
- {{HikariPool-1 - Thread starvation or clock leap detected (housekeeper delta=48s913ms)}} shows the housekeeper was also delayed, but the primary cause remains 20/20 connections borrowed.

### Fix

**Short term (first hour):**
1. Lower the partner call timeout to 2–3 seconds (connect 500ms, read 2000ms) to release connections fast; enable a circuit breaker to stop calling when the partner is down.
2. Temporarily disable the synchronous notify step (feature flag), just write {{PENDING_NOTIFY}} state and let a background job retry. Priority: don't lose orders.
3. **Do not** just increase the pool: 20 → 100 only shifts load to PostgreSQL; 100 connections × 30s still exhausts at high TPS, and a PostgreSQL connection storm is worse.
4. Enable {{leak-detection-threshold}} at 20s for evidence and alerting; restart to release stuck threads after the source of contention is blocked.

**Long term:** move the network call out of the transaction. Write to the DB first, call the partner afterward (or use an outbox + worker):

~~~java
@Transactional
public void confirm(long orderId) {
    Payment p = repo.find(orderId);
    p.markConfirmed();
    outbox.save(OutboxEvent.of("BANK_NOTIFY", p));  // same transaction, DB write only
}                                                   // commit + RETURN connection immediately

// Separate worker, no connection held during HTTP
@Scheduled(fixedDelay = 500)
public void flushOutbox() {
    for (OutboxEvent e : outbox.lockBatch(50)) {
        bankClient.notifyTransfer(e);               // timeout 2s + idempotent retry
        outbox.markSent(e);
    }
}
~~~

Required extras: **idempotency key** sent to the partner (already present as {{idem=9f2c...}} in the log — keep and reuse on retry), **retry with backoff + dead-letter**, **bulkhead** limiting concurrent outbound calls (Resilience4j {{Bulkhead}}), and **timeouts at every layer** (Apache HttpClient {{RequestConfig}}, not just Spring's).

Why not just increase the pool — Little's law calculation:

| Parameter | Before incident | During incident |
|---|---|---|
| TPS of confirm (holds connection) | ~40 | ~500 |
| Connection hold time | ~0.35s (DB ~50ms + HTTP ~300ms) | ~29.3s (waiting HTTP) |
| Connections needed = TPS × hold | ~14 | ~14,650 |

The figure 14,650 proves increasing the pool is infeasible (100 connections serves only 100 / 29.3 ≈ 3.4 confirm/sec). Conversely, moving HTTP out of the transaction cuts hold time to ~30ms: 500 × 0.03 = 15 connections, and the pool of 20 is plenty.

### Prevention

- Alert on {{hikaricp.connections.pending}} > 5 for 30s and {{connections.active / maximumPoolSize}} > 0.9 sustained, instead of waiting for HTTP 500.
- Set a **dedicated SLO for the dependency** (partner p99) and alert when p99 > 1s; this incident originated at the bank, our system was just the victim.
- Review checklist: no {{@Transactional}} wrapping HTTP/Kafka/S3/SMTP; enable {{spring.jpa.open-in-view=false}} to avoid holding the EntityManager for the entire request.
- Load-test with a simulated slow dependency (Toxiproxy) to see the pool exhaust before it hits production.

> Senior tip: When you see {{active == maximumPoolSize}} and {{waiting}} climbing steadily, the first question is not "how big should the pool be?" but "who's holding it long?". You can find the culprit quickly with {{jcmd <pid> Thread.print}} then count threads at {{ConcurrentBag.borrow}} and inspect RUNNABLE threads at {{NioSocketImpl.timedRead}} / {{Net.poll}} that have {{TransactionInterceptor}} below them. Another common mistake is enabling leak detection and panicking at "leak" logs — Hikari only reports connections held past a threshold; it cannot distinguish a true leak from an over-long transaction; read the stack before concluding.`,
    rubric: [
      'Identify that the connection is held while calling the partner HTTP inside @Transactional (stack confirmAndNotify → BankClient.notifyTransfer line 131), citing leak detection log and pool stats active=20, idle=0, waiting growing.',
      'Explain why increasing maximum-pool-size does not help (Little\'s law: thousands of connections needed when hold ~30s), and why CPU/DB are both idle.',
      'Propose shortening the transaction: commit first, then call partner asynchronously/outbox, with short timeout + circuit breaker + bulkhead, and idempotency on retry.',
      'State the correct monitoring/alerts (pending connections, active/pool ratio, partner p99) and prevention steps for code review.'
    ]
  }
});