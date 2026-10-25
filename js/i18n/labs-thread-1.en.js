/*
 * English translation of js/data/labs-thread.js — task T247. Format: js/core/i18n.js (content overlay).
 * ids: lab-thread-001
 */
App.i18n.content({
  'lab-thread-001': {
    title: `Deadlock AB-BA during intra-wallet fund transfer, jstack reports it`,
    scenario: `**Context:** Digital wallet **PayVN** runs four pods on Kubernetes with Java 21. Each pod processes internal fund-transfer jobs between two wallets using an 8-thread pool; wallet balances are cached in memory (object {{Wallet}}) and locked with {{synchronized}} to avoid negative balances.

**Symptoms:** On **21/10/2026 at 14:07**, alerts fired: six fund-transfer jobs stalled for over 30 seconds, HTTP 504 from the reconciliation API, pod CPU only ~12%. No exceptions in the logs; HikariPool still has idle connections; GC normal. Restarting the pod clears it, but within ~2 hours it recurs, each time with a different wallet pair.

**Data collected:** Run {{jcmd 1 Thread.print -l}} on the stuck pod (PID 1 inside the container) and grab the raw dump of one portion. Operations also collected the list of six stuck transfers: three W1002 → W2077 and three W2077 → W1002, emerging almost simultaneously from two reconciliation batches in opposite directions.`,
    questions: [
      'What is the root cause of the stall? Give specific evidence from the artifact: thread names, lock addresses, line numbers.',
      'Why is CPU low and the connection pool idle yet the API still times out? What does that say about relying only on resource metrics?',
      'How will you fix it in 30 minutes so no transaction is lost, and what will you change in the sprint ahead to prevent recurrence?'
    ],
    hints: [
      'Read the two threads in BLOCKED state (on object monitor): what lock is each holding and waiting for? Do the two addresses <0x...> swap symmetrically?',
      'jstack prints a single section "Found one Java-level deadlock" — but prove it yourself using the four lines - waiting to lock / - locked, do not just criticize the tool\'s conclusion.',
      'If the two batches run in opposite directions (A→B and B→A) simultaneously, the lock order depends on the input parameter. How can the lock order depend only on data, not on the direction of the transfer?'
    ],
    answer: `**Summary:** This is the classic AB-BA deadlock. Thread {{wallet-transfer-3}} holds the monitor of wallet W1002 (0x000000076ab2d0a0) and waits for the monitor of wallet W2077 (0x000000076ab2d8f8); thread {{wallet-transfer-7}} holds the correct lock W2077 and waits for the correct lock W1002. Two threads waiting forever means every transfer touching that wallet pair hangs, while CPU and the connection pool stay "normal" — because a deadlock is waiting, not spinning.

### Root cause

{{WalletService.transfer}} locks both objects {{Wallet}} in the correct order of the parameters passed in:

~~~java
// WalletService.java — buggy version
public void transfer(Wallet from, Wallet to, long amount) {
    synchronized (from) {              // line 86: lock source wallet
        synchronized (to) {            // line 88: lock target wallet
            if (from.balance < amount) throw new InsufficientFunds();
            from.balance -= amount;
            to.balance   += amount;
        }
    }
}
~~~

For W1002 → W2077 the lock order is (W1002, W2077). For W2077 → W1002 it is (W2077, W1002). When both commands run concurrently and each enters the outer {{synchronized}}, each thread holds one lock and waits for the other. The JVM has no built-in deadlock breaker: monitors have no timeout, so the two threads sit there until the process dies.

The quiet root is that the reconciliation batch runs in both directions: the refund batch (W2077 → W1002) and the collecting batch (W1002 → W2077) overlap in window. Even two jobs hitting the same wallet pair is enough. That is why restarting fixes it but recurs 2 hours later at a different pair.

### Evidence

- {"wallet-transfer-3" ... waiting for monitor entry ... BLOCKED (on object monitor)} — BLOCKED means standing in line for the monitor, not waiting for IO.
- Line {{waiting to lock <0x000000076ab2d8f8>}} + {{locked <0x000000076ab2d0a0>}} of thread 3.
- Line {{waiting to lock <0x000000076ab2d0a0>}} + {{locked <0x000000076ab2d8f8>}} of thread 7 — they swapped the two addresses.
- Section {{Found one Java-level deadlock}} lists exactly the two threads and the two monitors {{0x00007f2c64004b00}} / {{0x00007f2c64004a80}}.
- The other threads ({{http-nio-8080-exec-9}}, {{HikariPool-1 housekeeper}}, {{GC Thread#0}}) are all WAITING/TIMED_WAITING or idle — that is "noise", not related.

Why CPU is low, pool idle, yet still timeout: BLOCKED threads consume no CPU (they park in the JVM monitor-wait queue), and each job only opens a transaction after having both locks, so it never holds a connection. Resource metrics therefore look fine; only latency and the count of BLOCKED threads are bad. If you alert only on CPU/RAM/connection, the outage disappears.

### Fix

**Short term (within 30 minutes):**
1. Do not kill threads (Java does not safely support it); save the dump as evidence, then rolling-restart the stalled pod to release its monitors. Before restarting you must stop the two-way reconciliation batch to avoid immediate recurrence.
2. Verify account consistency: the two commands may have deducted from one wallet without crediting the other if the code wrote them step by step, so run the reconciliation job and credit pending transactions for all affected transfers. Best practice is to write both debit and credit in one database transaction or use an outbox so they can be replayed later.
3. If a feature flag exists, disable the intra-batch transfer between the two wallets and switch to sequential processing per wallet pair.

**Long term (this sprint):** normalize the lock order to a single total-order lock, for instance by {{walletId}} ascending:

~~~java
public void transfer(long fromId, long toId, long amount) {
    Wallet first  = repo.get(Math.min(fromId, toId));   // always lock the smaller id first
    Wallet second = repo.get(Math.max(fromId, toId));
    synchronized (first) {
        synchronized (second) {
            Wallet from = first.id == fromId ? first : second;
            Wallet to   = first.id == toId   ? first : second;
            doTransfer(from, to, amount);
        }
    }
}
~~~

This turns the wait graph into a DAG so a cycle is impossible. Other options, architecturally considered:

| Approach | Pros | Cons |
|---|---|---|
| Lock by id order | Simple, no library | Still JVM locks, no multi-pod protection |
| A single lock for all wallets | No deadlock | Throughput drops, pinch point |
| DB lock: {{SELECT ... FOR UPDATE}} by id order | Correct when many instances | Overload DB, needs index and short transactions |
| Optimistic locking (version column) + retry | Locks held briefly, scales well | Needs idempotent retry, may starve under contention |
| Distributed lock (Redisson) on pre-paired ids | Correct across pods | Adds Redis to the path to deadline, needs lock expiry handling |

For a wallet system the most sustainable direction is **DB-level locking ordered by id** and keeping transactions truly short; the memory cache is only for reads. JVM locking works only when each wallet is handled by exactly one pod (shard by wallet), otherwise it is luck when scaling out.

### Prevention

- Enable periodic deadlock detection via {{ThreadMXBean.findDeadlockedThreads()}} and logging/alerting; alternatively schedule {{jcmd <pid> Thread.print -l}} periodically and grep {{Found .* deadlock}}.
- Alert on the number of BLOCKED threads rather than CPU alone. With Micrometer/Prometheus the metric is {{jvm_threads_states_threads}} with tag {{state=blocked}}.
- Load-test with intentional two-way traffic on the same wallet pair (k6/JMH) in the CI for performance; deadlock usually shows up only at the right time order.
- Code review: wherever two nested {{synchronized}} or two different-type locks exist, add a comment stating the lock order explicitly.

> Senior tip: In wallet / payment systems, never let the lock order depend on the business operation parameter (who transfers to whom). A practical trick: write a helper {{lockPair(long a, long b)}} returning the sorted array and forbid any other site from locking two objects itself. Also, a JVM deadlock often coincides with a database deadlock (two transactions locking two rows in opposite order) — if you see row-lock wait in {{pg_stat_activity}} at the same time as a jstack deadlock, that is one design flaw, not two incidents.`,
    rubric: [
      'Identify the correct AB-BA deadlock between wallet-transfer-3 and wallet-transfer-7, cite the correct two lock addresses <0x000000076ab2d0a0> and <0x000000076ab2d8f8> in the same hold/wait direction.',
      'Explain why CPU is low and the connection pool is idle yet the API still times out (BLOCKED threads consume no CPU, do not hold connections).',
      'Propose the fix using a consistent lock ordering (by id) or DB-level locking, together with handling of PENDING data and reconciliation after restart.',
      'State prevention measures: detect deadlocks via ThreadMXBean/jcmd, alert on the number of BLOCKED threads, and load-test both directions.'
    ]
  }
});
