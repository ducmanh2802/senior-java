/*
 * English translation of js/data/labs-sql.js — task T257. Format: js/core/i18n.js (content overlay).
 * ids: lab-sql-004
 */
App.i18n.content({
  'lab-sql-004': {
    title: 'Deadlock when releasing escrow for cross-purchase orders',
    scenario: `**Context.** The MiniShop e-commerce platform has a "Cross-purchase" feature (buy goods from others): if buyer A places an order for goods from seller B, buyer A's funds are **held in escrow** in A's wallet. Once the order is confirmed, the funds are transferred from A's wallet to B's wallet. The {{wallet-transfer}} service (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6) handles escrow release in a single transaction, updating the {{wallet_ledger.wallet_balance}} table (one row per wallet) and recording {{escrow_order}}.

**Symptoms (14/03/2026, 10:22).** During peak hour at 10:22, two cross-purchase orders were confirmed almost simultaneously:
- Order {{ORD-2026-03-14-88213}}: A (wallet {{9f3c1a44-…}}) buys goods from B (wallet {{b7f3c9e2-…}}) → debit wallet A, credit wallet B.
- Order {{ORD-2026-03-14-88214}}: B (wallet {{b7f3c9e2-…}}) buys goods from A (wallet {{9f3c1a44-…}}) → debit wallet B, credit wallet A.

One of the two transactions was **aborted by PostgreSQL due to a deadlock**, and the order got stuck in {{ESCROW_PENDING}} status. Since the feature was launched (6 weeks ago), **312 orders** have accumulated in such a stuck state, each requiring manual intervention by operations staff. Notably: the deadlock rate is very low (~50 times/week out of over 1 million escrow release commands), so it was not considered a system incident — but each occurrence is a real money error.

**Artifacts you have.** Three artifacts: PostgreSQL server log at 10:22, a snapshot of {{pg_locks}} at 10:22:29.200 (before the deadlock detector ran), and application log. Reconstruct the wait cycle, identify the root cause at the design level, and propose how to fix it both short-term (unstick the orders) and long-term (eliminate deadlocks or ensure self-recovery).`,
    questions: [
      'Reconstruct the wait cycle between the two sessions (PID 24117 and 24118): what lock does each hold and what lock are they waiting for? Evidence from the artifacts.',
      'Why did the deadlock occur exactly at 10:22 with these two specific orders? Is the issue at the SQL level or the business design level?',
      'How would you handle the 312 stuck orders today, and how would you redesign the system to eliminate deadlocks (or self-recover if deadlocks occur)?',
    ],
    hints: [
      'Look at wait_event_type = Lock, wait_event = transactionid in both pids, along with the ShareLock granted = f in pg_locks: the xid each side is waiting for is the xid of the other side.',
      'The two orders are cross-purchases (A buys from B and B buys from A), so the order of updating the two wallet_balance rows is reversed — draw the wait-for graph.',
      'Deadlock is a normal error and should only be handled by: fixed locking order + retry with backoff/jitter + idempotency key so retry does not create duplicate transactions.',
    ],
    answer: `**Summary:** Two transactions update **two rows** of {{wallet_balance}} in **reversed order** (cross-purchase orders), creating a cycle in the wait-for graph → PostgreSQL detects the deadlock after {{deadlock_timeout}} (1 second) and aborts one side. Two layers of fixes are needed: (1) **fixed locking order** to ensure no wait cycles can occur, (2) **retry with backoff + jitter + idempotency key** so that if a deadlock still occurs, it self-recovers instead of getting stuck.

### Reconstructing the wait cycle
- {{TX1}} (PID 24117, xid 918244731, order ORD-…88213, A buys from B): {{UPDATE}} debit 150,000 VND from wallet A ({{9f3c1a44-…}}) at 10:22:28.470 → **holds row lock on wallet A** (tuple 8821/44). Then it needs to credit 150,000 VND to wallet B ({{b7f3c9e2-…}}) → gets blocked.
- {{TX2}} (PID 24118, xid 918244735, order ORD-…88214, B buys from A): {{UPDATE}} debit 150,000 VND from wallet B at 10:22:28.481 → **holds row lock on wallet B** (tuple 41233/7). Then it needs to credit 150,000 VND to wallet A → gets blocked.
- Wait cycle: **TX1 waits for TX2** (needs wallet B lock) and **TX2 waits for TX1** (needs wallet A lock). Neither side releases its lock → once a session has waited longer than {{deadlock_timeout}} (1,000 ms), that session itself runs the deadlock check; TX1 started waiting first, so it checks first, detects the cycle, and self-aborts (the session detecting the deadlock is the victim).

### Evidence
- Artifact 1 (server log): **"ERROR: deadlock detected"** for PID 24117, with DETAIL **"Process 24117 waits for ShareLock on transaction 918244735; blocked by process 24118."** and **"Process 24118 waits for ShareLock on transaction 918244731; blocked by process 24117."** — these are **the two sides of the wait cycle** directly in the log. The line **"process 24117 detected deadlock while waiting for ShareLock on transaction 918244735 after 1000.884 ms"** matches {{deadlock_timeout = 1s}}. **"CONTEXT: while updating tuple (41233,7) in relation wallet_balance"** identifies the correctly contended row (wallet B). Immediately after, TX2 finishes the UPDATE it was waiting for (**"duration: 997.214 ms"**, wallet A parameters) then COMMITs.
- Artifact 2 (pg_locks snapshot at 10:22:29.200, **before** detector ran): both pids have {{wait_event_type = Lock}}, {{wait_event = transactionid}}. In {{pg_locks}}, 24117 has {{ShareLock}} **granted = f** on transactionid **918244735** (of 24118) and 24118 has {{ShareLock}} **granted = f** on transactionid **918244731** (of 24117) — each side is waiting for the other's transaction. The tuple lock {{granted = t}} (24117 on 41233/7, 24118 on 8821/44) is just a queue position for the row each side is **waiting** for; the actual row lock is in the tuple header, so it doesn't appear in pg_locks. {{pg_blocking_pids(24117)}} returns 24118 and {{pg_blocking_pids(24118)}} returns 24117 — a 2-node wait cycle.
- Artifact 3 (app log): {{"Caused by: org.postgresql.util.PSQLException: ERROR: deadlock detected"}} at {{EscrowService.releaseEscrow(EscrowService.java:184)}}; the line {{"no retry for this failure (retry only on OptimisticLockingFailureException)"}} shows the deadlock error **is not retried** so the order remains {{ESCROW_PENDING}}; the other order (88214, PID 24118) succeeds after waiting ~1 second because it is **not** the victim: when 24117 rolls back, the wallet A lock is released and 24118 continues to COMMIT.

### Root Cause
At the business logic layer, the code updates the two wallets **in the business-logical order** (debit purchaser first, credit seller second). With the cross-purchase feature, two concurrent requests have reversed orders on **the same pair of wallets** → wait cycle. This is not a PostgreSQL error: PostgreSQL detects deadlocks as early as possible and aborts to protect data integrity. The issue lies in **the lock ordering design** and in **treating deadlocks as errors that should not happen**.

### Short-term fix (clear 312 stuck orders)
- Run reconciliation job for {{ESCROW_PENDING}} orders: re-read balance of both wallets from ledger, mark orders that failed rollback then call {{releaseEscrow}} with **idempotency key** = {{orderId}} to avoid double-crediting.
- Temporarily **serialize** escrow release commands by wallet pair (e.g., using Redis distributed lock on {{min(walletA,walletB)}}) to stop recurrence while fixing code.
- Keep {{log_lock_waits = on}} so all lock waits exceeding {{deadlock_timeout}} are logged; no need to reduce {{deadlock_timeout}} (too low increases CPU for deadlock checks). Set {{log_min_duration_statement}} to about 200–500 ms instead of 0 to see waited queries without flooding logs.

### Long-term fix at code layer
1. **Fixed locking order.** Direction of funds (who debits, who credits) stays the same, but **lock acquisition order** must be fixed: lock both rows by {{ORDER BY wallet_id}} before updating, then debit/credit as per business logic:
~~~sql
SELECT wallet_id, balance FROM wallet_ledger.wallet_balance
WHERE wallet_id IN (:walletA, :walletB) AND currency = 'VND'
ORDER BY wallet_id
FOR UPDATE;
~~~
Since all transactions lock in the same order (LockRows is after Sort, so rows are locked in sorted order), a wait cycle cannot occur between transactions following this rule.
2. **Proper Retry.** Deadlock is a *temporary* error, must be retried with control: catch errors with SQLState **40P01** (deadlock_detected, Spring maps to {{CannotAcquireLockException}} as artifact 3) or **40001** (serialization_failure, to {{CannotSerializeTransactionException}}) — both are {{PessimisticLockingFailureException}} — then retry **the entire transaction** (retry must wrap outside @Transactional) with **exponential backoff + full jitter** (50 ms → 100 → 200, max 3–5 times). Use {{@Retryable}} from Spring Retry and **always include idempotency key** so retry doesn't create duplicate transactions.
3. **Shorten Transactions.** Transaction should only consist of: locking rows, updating balance, recording ledger, updating order status. Do not call HTTP, do not write to Redis/queue, do not send notifications inside the transaction; do not open transactions at the service layer wrapping the entire flow.
4. **Atomic Updates, no read-modify-write.** {{UPDATE … SET balance = balance - :amount WHERE wallet_id = :w AND currency = 'VND' AND balance >= :amount}} — avoids read-modify-write, ensures no negative balance, and shortens lock holding time.
5. **Advisory lock** if locking order cannot be rearranged: get {{pg_advisory_xact_lock}} for **each wallet** by increasing id order (e.g., lock by {{hashtextextended(wallet_id::text, 0)}} of the smaller wallet first, larger wallet second) at the start of the transaction. A common lock for "wallet pair" only serializes that specific pair, doesn't prevent wait cycles between multiple pairs (A→B, B→C, C→A).
6. **Ledger append-only + optimistic locking.** {{wallet_ledger}} only appends transactions, {{wallet_balance}} is a projection updated with {{version}} (optimistic locking) so contention is handled by retry, not long locks; also easier for audit/reconciliation — this is also the direction VN banks/fintech often require.
7. **If business allows retrying later:** {{SELECT … FOR UPDATE NOWAIT}} or {{SET LOCAL lock_timeout = '2s'}} to avoid long waits, then put order into queue for re-processing. ({{SKIP LOCKED}} is not suitable here as we need two *specific* wallet rows, not "any available row".)

### Prevention and monitoring
- {{pg_stat_database.deadlocks}} (available since PostgreSQL 9.2) counts deadlocks per database: alert when {{deadlocks}} increases per hour (and log with {{log_lock_waits}}, {{log_min_duration_statement}}).
- Monitor {{pg_stat_activity}} with {{wait_event_type = 'Lock'}} and {{pg_locks.granted = false}}; alert when sessions wait for lock for more than 1 second.
- Alert on transactions living longer than 60 seconds (together with {{idle in transaction}} alerts) because long-lived transactions increase deadlock probability and hold locks longer.
- Business dashboard: {{ESCROW_PENDING}} orders > 0 must trigger alerts; reconciliation job runs automatically every 5 minutes and retries stuck orders.
- Review rule: all transactions updating more than one row must have unified lock order and include retry + idempotency.

> Senior tip: **deadlock is not a bug, it's a data protection mechanism**. Your goal is not to "make deadlocks vanish" (that's impossible in distributed systems), but to make them **cheap and self-recovering**: fixed locking order to avoid cycles, retry with backoff + jitter so you win next time, idempotency key so retry doesn't lose money, and alerts on {{deadlocks > 0}} to know if the system is entering a contention zone. Practical experience: a few dozen deadlocks/week over millions of transactions is **acceptable if self-retry is enabled**; deadlock count increasing with load is an **architectural sign**; and orders stuck without auto-retry are operation incidents. And remember: if you add retry without an idempotency key, you are swapping a deadlock error for a money loss error — that's a much worse bug.`,
    rubric: [
      'Reconstructed wait-for graph correctly: TX1 (24117, xid 918244731) holds wallet A row lock waiting for wallet B, TX2 (24118, xid 918244735) holds wallet B row lock waiting for wallet A, supported by specific evidence (wait_event = transactionid, ShareLock granted = f on the other side\'s xid, pg_blocking_pids returns cross-references); 24117 is the victim',
      'Correctly identified root cause at the design level: two cross-purchase orders update two wallet_balance rows in reversed order due to code locking in request order',
      'Knows that deadlock is a consequence of non-fixed locking order and must be fixed by locking with ORDER BY wallet_id / fixed order / advisory lock, along with retry of SQLState 40P01 with backoff + jitter and idempotency key',
      'Has a short-term plan for 312 stuck orders (reconciliation job, re-run with idempotency key, temporary serialization) and knows why existing retry didn\'t catch deadlocks',
      'Has specific monitoring/prevention: pg_stat_database.deadlocks, log_lock_waits, alert on session lock wait, alert on stuck ESCROW_PENDING orders, review rule for lock order and shortening transactions',
    ],
  }
});
