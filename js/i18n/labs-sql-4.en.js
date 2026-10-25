/*
 * English translation of js/data/labs-sql.js — task T258. Format: js/core/i18n.js (content overlay).
 * ids: lab-sql-005 lab-sql-006 lab-sql-007 lab-sql-008
 */
App.i18n.content({
  'lab-sql-005': {
    title: 'Flash sale hangs because one transaction "idle in transaction" holds a lock',
    scenario: `**Context.** MiniShop runs the "Mega Sale 12:00" flash sale on October 15, 2026 on **3,200 orders/second** for the first 3 minutes. Service {{inventory-service}} (Spring Boot 3.3, HikariCP 20 connections, PostgreSQL 15.6) manages inventory reservation: each order runs a transaction that does {{INSERT orders}}, {{INSERT order_item}}, {{UPDATE inventory}} (decrement stock), then calls HTTP to {{risk-scoring-service}} to score risk before confirming the order.

**Symptoms.** From **12:00:31** until about 12:02:10 (DBA killed the hanging session at 12:01:55 and the queue drained ~15 seconds), every order with the hot SKU {{IPH15-256GB}} froze: p99 jumped to 30 seconds then timed out, and {{HikariPool-1}} ran out of connections. The oddest observation: **CPU on RDS was only 5%** — the database was nearly idle yet everything remained hung, i.e., this is a **blocking** symptom, not overload.

**What was tried, didn't help.** Increasing {{max_connections}} to 500 (worse: adding pointless sessions waiting), increasing Hikari pool to 60, restarting pod {{inventory-service}} (10.0.31.9) — did nothing, because the hanging session holds the lock belongs to a different pod and the lock queue remains unchanged at the DB.

**Your task.** Four artifacts below were collected: snapshot of {{pg_stat_activity}}, the lock chain detail ({{pg_locks}} + {{pg_blocking_pids}}), instance timeout configuration, and application logs. Find the hanging session, build the lock chain, and propose immediate handling plus root-cause elimination.`,
    questions: [
      'Which session is causing the hang and why does it keep the lock? Cite evidence from pg_stat_activity and pg_locks.',
      'Build the lock chain: who waits for whom, and why does the system hang even though CPU on the DB is only 5%?',
      'How do you handle it immediately at 12:02, and what change prevents this hang from recurring during future flash sales?'
    ],
    hints: [
      'Find the session with state = "idle in transaction": it isn\\\'t waiting for a lock (wait_event_type = Client, wait_event = ClientRead) but the server is waiting for the application to send the next command — the transaction is open, the last query finished running, but COMMIT/ROLLBACK hasn\\\'t arrived. The row lock created by UPDATE is hidden inside the tuple header (xmax = transaction 884120917 of 24117), so it does not appear directly in pg_locks; the proof is 24831 having {{ShareLock}} granted = f on transactionid 884120917, i.e., the row lock of the hot SKU is still held by 24117.',
      'Read pg_blocking_pids: 24831 (waiting transactionid) is blocked by 24117; the other sessions wait for the tuple lock held by 24831 and queue behind it — that is a single-row lock queue.',
      'Check pg_settings: idle_in_transaction_session_timeout = 0 means PostgreSQL never auto-closes a hanging session in idle-in-transaction state; and the app log shows a 30-second HTTP call sitting inside @Transactional.'
    ],
    answer: `**Summary:** One transaction of {{inventory-service}} opened an {{@Transactional}} wrapping the whole workflow, including a 30-second (×3 retries) HTTP call to {{risk-scoring-service}}. While waiting for HTTP, the connection stayed in the transaction in the state **idle in transaction** and **kept the row lock** on {{inventory}} of the flash-sale SKU → 46 other sessions queued behind the same row. Because {{idle_in_transaction_session_timeout = 0}}, PostgreSQL **never auto-closes** the hanging session.

### The hanging session and the lock it holds
- {{pid 24117}}, {{application_name = inventory-service}}, {{client_addr = 10.0.31.8}}, {{state = idle in transaction}}, {{xact_start = 12:00:31.204}}, {{xact_age = 00:01:18.402}}.
- {{wait_event_type = Client}}, {{wait_event = ClientRead}}: this is **not** waiting for a lock, but the server is waiting for the **application** to send the next command — the transaction is open, the last query has finished executing, but no COMMIT/ROLLBACK yet. {{idle_for = 00:01:18.398}} shows it was almost silent throughout the transaction.
- Last statement: {{UPDATE inventory SET available = available - 1 … WHERE sku_id = 'IPH15-256GB' AND available >= 1}}. The row lock it created sits inside the header tuple (xmax = transaction 884120917 of 24117) so it does **not** show up directly in {{pg_locks}}; the proof is 24831 holding {{ShareLock}} granted = f on transactionid **884120917** → **the row lock of the hot SKU is still held by 24117**.
- Why it hangs here: the app log shows after the query {{UPDATE inventory}}, the service called {{POST /v1/score}} to {{risk-scoring-service}}, a 30-second read timeout, 3 retries → **78 seconds sitting silent inside the transaction**, while still holding the lock.

### Lock chain
- {{24831}} is the first session queued: took the tuple lock on 8821/44 and is waiting {{ShareLock}} on the transaction of **24117** ({{wait_event = transactionid}}, {{blocked_by = 24117}}).
- {{24832}}, {{24833}}, {{24834}}, {{24835}}, {{24841}}… wait for the **tuple lock** held by 24831 ({{wait_event = tuple}}); pg_blocking_pids of each session lists 24831 plus earlier sessions behind it ({{24833}} → 24831, 24832; {{24834}} → 24831, 24832, 24833…).
- Total {{46}} sessions have {{wait_event_type = 'Lock'}}, all running one UPDATE on the same SKU {{IPH15-256GB}}. One idle session leads the queue → the entire hot SKU gets stuck, and because each queued session occupies one Hikari connection, the pods\\' pools also exhaust.
- **Why CPU is only 5%?** Because all queued sessions are **waiting**, not consuming CPU; the database is idle but cannot progress. This is a blocking symptom, not overload — adding connections or CPU both useless.

### Root cause
Three layers nested:
1. **Transaction too wide:** {{@Transactional}} wraps the whole workflow, including the external HTTP call. Any slow external call turns into time holding the row lock.
2. **No timeout at the DB layer:** {{idle_in_transaction_session_timeout = 0}}, {{statement_timeout = 0}}, {{lock_timeout = 0}}, {{log_lock_waits = off}}. PostgreSQL won\\'t auto-kill hanging sessions; {{max_connections = 200}} doesn\\'t save either because 46 waiting sessions still occupy space.
3. **No fail-fast mechanism:** {{risk-scoring}} retries ×3 ×30 seconds means up to **90 seconds holding the lock** (at snapshot time it was already 78 seconds); {{HikariCP}} timeout 3 seconds makes requests of other threads fail, but **never** releases any lock.

### Immediate handling (12:02)
- {{SELECT pg_terminate_backend(24117);}} — ending the hanging session; its transaction gets rolled back, the lock is released, and the queue continues (artifact 3: DBA did it at 12:01:55, releasing t). ({{pg_cancel_backend}} cancels the running statement, useless against an idle session.) The order ORD-…00091233 of that session gets rolled back — the app log at 12:02:02 confirms.
- Temporarily suspend selling the SKU {{IPH15-256GB}} or put it in a queue to stop more sessions queuing.
- Turn on immediately (no restart): change {{idle_in_transaction_session_timeout = 30s}} in the RDS parameter group (dynamic parameter), or {{ALTER ROLE inventory_svc SET lock_timeout = '3s'}} — applies to new connections of that role, so the pool needs recycling. A {{SET}} issued in psql only affects the psql session.
- After clearing, run the reconcile job for orders reserved but not confirmed (log shows **4.182 orders** in that state) and refund / restore stock for the hanging orders.

### Long-term fix
1. **Separate the transaction from I/O.** Correct model: (a) short transaction writes inventory and creates the order in status {{PENDING_RISK}}; (b) **outside the transaction** calls {{risk-scoring}}; (c) second transaction confirms the order / restores stock. If strict consistency is needed, use outbox + consumer or saga instead of holding the lock while waiting on the network.
2. **Timeout every external call:** short connect + read timeouts (2–3 seconds), **no retry while holding the lock**, use a circuit breaker (Resilience4j) to fail fast.
3. **Set DB timeouts by role**, not just at instance level:
   ~~~sql
   ALTER ROLE inventory_svc SET idle_in_transaction_session_timeout = '30s';
   ALTER ROLE inventory_svc SET statement_timeout = '15s';
   ALTER ROLE inventory_svc SET lock_timeout = '3s';
   -- log_lock_waits = on: RDS doesn't allow ALTER SYSTEM, change in DB parameter group
   ~~~
4. **Reduce lock holding time:** one atomic {{UPDATE}} for stock, placed at the **end** of a short transaction, no read-then-write; for workflows "fail fast when out of stock", use {{SELECT … FOR UPDATE SKIP LOCKED}} or {{NOWAIT}} so **no queue forms** — each order tries the lock once, loses → returns "out of stock" immediately instead of queueing 30 seconds.
5. **Protect against overload before hitting the DB:** place flash-sale stock in Redis / atomic counter to reject immediately at the app layer, reducing load hundreds of times; cap concurrent waiting sessions per SKU with rate-limit.
6. **Auto-clean hanging sessions:** a system job scans {{pg_stat_activity}} every 15–30 seconds, {{terminate}}s sessions {{idle in transaction}} longer than 60 seconds, and sends alerts.
7. **If using MySQL:** the equivalent is {{SHOW ENGINE INNODB STATUS}} (section {{TRANSACTIONS}} and {{LATEST DETECTED DEADLOCK}}), {{performance_schema.data_lock_waits}} + {{data_locks}}, {{information_schema.innodb_trx}}, and {{innodb_lock_wait_timeout}} (default 50 seconds). MySQL has **no** separate parameter for an idle-in-transaction session ({{wait_timeout}} applies to every idle connection, default 8 hours — too long), so you must block at the app layer (transaction timeout, no I/O in transaction) plus a short {{innodb_lock_wait_timeout}} for the waiting side.

### Prevention and monitoring
- Alert: {{SELECT count(*) FROM pg_stat_activity WHERE state = 'idle in transaction'}} > 0 (or > 5 sessions); alert based on {{xact_age > 60s}}.
- Alert: number of sessions {{wait_event_type = 'Lock'}} > 20; presence of {{wait_event = 'transactionid'}} is a sign of the lock chain.
- Alert app layer: {{hikaricp.connections.pending}} > 0, {{hikaricp.connections.acquire}} p95 rising, latency of {{risk-scoring}}.
- Dashboard: chart number of sessions by {{state}} and sessions waiting for locks by SKU; enable {{log_lock_waits = on}} for postmortem evidence.
- Review rule: **transactions must not contain network calls**; every client outside must have a timeout; transactions must have a bounded duration.
- Run a flash-sale drill with low connection limits to catch this hang pattern early (if the system can handle 3.200 orders/second, the DB must too).

> Senior tip: the state **"idle in transaction"** is the most dangerous state in PostgreSQL because it **does not consume CPU** — the DB is idle at 5% yet the service hangs, tricking teams into looking for the wrong problem (add CPU, add connections, restart service). Rule to remember: **CPU low + high latency = blocking**; look at {{pg_stat_activity}} and {{pg_blocking_pids}} before touching performance config. And the biggest lesson for Java teams: **transactions should only contain SQL** — every HTTP, message broker or file I/O call must sit outside the transaction. One setting worth investing most in is {{idle_in_transaction_session_timeout}}: it turns a hang lasting 30 minutes into an auto-healing incident within 30 seconds.`,
    rubric: [
      'Correctly identify the hanging session (pid 24117, idle in transaction, wait_event ClientRead, xact_age 78 seconds) and explain why it keeps the inventory row lock (query ran, but transaction not committed).',
      'Build the correct lock queue: 24831 waits for the transactionid of 24117, other sessions wait for the tuple lock held by 24831 (pg_blocking_pids lists 24831 and preceding sessions), total 46 Lock sessions; explain why CPU 5% yet system hangs (blocking, not overload).',
      'Identify the root cause at the design level: @Transactional wraps the workflow including the 30s HTTP call to risk-scoring ×3 retries, plus idle_in_transaction_session_timeout = 0 so PostgreSQL never auto-closes the hanging session.',
      'Have the immediate fix plan: pg_terminate_backend(24117), enable idle_in_transaction_session_timeout/lock_timeout, stop selling SKU IPH15-256GB, reconcile 4.182 hanging orders.',
      'Propose the long-term fix correctly: separate transaction from the HTTP call (2 transactions + outbox/saga), timeout + circuit breaker for external clients, role-based PostgreSQL timeout, reduce lock holding time, protect against overload with Redis/rate-limit, and note MySQL equivalents (SHOW ENGINE INNODB STATUS, performance_schema.data_lock_waits, innodb_lock_wait_timeout).',
      'Have specific monitoring: alert on number of idle-in-transaction sessions, number of Lock sessions, xact_age, hikaricp.connections.pending, log_lock_waits, and the review rule that transactions must not contain I/O.'
    ]
  },
  'lab-sql-006': {
    title: 'PostgreSQL drops the index due to cast and function applied to the column',
    scenario: `PostgreSQL 15\\'s orders table has 8 million rows and a B-tree index on customer_id (bigint). The API receives customer_id as a string; the query casts the column to text, latency rises to 4 seconds.`,
    questions: [
      'Why is the index unused and how to fix it?',
      'When is a functional index appropriate?'
    ],
    hints: [
      'Predicate applies a function/cast to the column.',
      'Cast the input to bigint instead of transforming the column.'
    ],
    answer: `**Summary:** Predicate {{customer_id::text}} transforms the column value so the B-tree on bigint doesn\\'t match the expression; the planner falls back to a sequential scan of all 8 million rows. Moving the input to bigint and comparing directly keeps the predicate sargable.

### Evidence and fix
EXPLAIN shows a Seq Scan, nearly 8 million rows removed, over 51.800 buffer reads and 3.9 seconds. Parse / validate the input as bigint at the application and bind BIGINT for the predicate {{customer_id = $1}}. If the business genuinely searches by an expression, an expression index must use the exact expression in the query; every function in the index expression must be IMMUTABLE. Confirm with EXPLAIN ANALYZE.
Do not create a spurious index before fixing the predicate; the function must be immutable to be usable in an index. Compare cardinality, statistics and buffers before and after.

> Senior tip: Read the actual predicate being executed and the bind type from plan / logs, not just glance at the existing index.`,
    rubric: [
      'Recognize that the cast on the column misaligns the index key.',
      'Cite Seq Scan / rows removed / buffers / time.',
      'Propose binding the param as bigint and the direct predicate.',
      'State functional indexes only when needed, correct expression / immutable.',
      'Confirm with EXPLAIN ANALYZE.'
    ]
  },
  'lab-sql-007': {
    title: 'Deadlock from updating two rows in opposite order',
    scenario: `Two requests transfer stock between SKU A and B in PostgreSQL 15. Transaction T1 locks A then B; T2 locks B then A. One transaction is aborted by PostgreSQL.`,
    questions: [
      'Build the wait-for cycle from the log.',
      'How to fix the lock order and handle the aborted transaction?'
    ],
    hints: [
      'T1 holds A, waits for B; T2 holds B, waits for A.',
      'PostgreSQL picks the victim; retry the whole transaction with backoff.'
    ],
    answer: `**Summary:** T1 holds A and waits for B; T2 holds B and waits for A, creating the deadlock cycle. PostgreSQL detects it after deadlock_timeout and aborts one transaction (SQLSTATE 40P01).

### Evidence
Log shows pid 18422 waiting for transaction 99011 of 18439, and 18439 waiting for 99012 of 18422; the UPDATE statements show two opposite resources.

### Remediation
- Every multi-SKU update locks in a stable order (e.g., increasing sku), within one transaction.
- Catch the deadlock error and retry the whole transaction with a bounded number of attempts and backoff / jitter; don\\'t retry individual statements mid-transaction after it was aborted.
- Keep transactions short, index the update conditions, monitor log_lock_waits / deadlock rate. Deadlocks can happen even with correct application code; you need safe / idempotent retry.

> Senior tip: The global lock order is a contract; a single code path flipping the order is enough to trigger a rare but hard-to-reproduce deadlock.`,
    rubric: [
      'Build the correct 18422↔18439 cycle by transaction IDs.',
      'Name that the deadlock detector aborts the transaction with 40P01.',
      'Propose a stable lock order.',
      'Retry the whole transaction with bounded attempts and idempotent.',
      'Mention monitoring and reducing transaction duration.'
    ]
  },
  'lab-sql-008': {
    title: 'Orders table bloats because autovacuum cannot keep up',
    scenario: `PostgreSQL 15\\'s orders table receives 2,000 updates/second during processing. Autovacuum runs but n_dead_tup keeps climbing, indexes and table grow, and queries slow down.`,
    questions: [
      'Name the likely root cause and investigate further.',
      'Plan a safe fix for the bloat without losing data.'
    ],
    hints: [
      '8.4M dead tuples; investigate long transactions and catalog_xmin of logical slot.',
      'restart_lsn lag holds WAL; only xmin / catalog_xmin horizon directly hold dead tuples.'
    ],
    answer: `**Summary:** The table has 8.4 million dead tuples and vacuum is possibly blocked by a long snapshot or catalog_xmin of a logical replication slot. restart_lsn lag 96GB indicates WAL is retained, but it alone doesn\\'t prove tuples are retained; check the xmin horizon.

### Read the numbers
pg_stat_user_tables reports 12M live, 8.4M dead; autovacuum still active waiting for IO. Transaction xmin age 6.4M xid and logical slot catalog_xmin age 6.2M xid are two candidates holding the horizon to verify. restart_lsn lag 96GB is WAL retention in its own right, not synonymous with retaining dead tuples. VACUUM usually reclaims space reused inside the relation, not by default returning files to the OS.

### Fix
- Find long transactions and slots with catalog_xmin; confirm owner then safely end the transaction or fix the consumer. Handle restart_lsn / WAL lag separately; avoid dropping slots casually because the consumer may need a large resync.
- Reduce write amplification, avoid indexed columns that aren\\'t needed for the update, batch updates; make sure autovacuum has sufficient IO and worker configuration.
- Tune per-table vacuum / analyze scale factor and cost limit according to churn rate; check n_dead_tup, vacuum progress, bloat and wraparound age.
- VACUUM rarely needs an exclusive lock but doesn\\'t compact the file; consider pg_repack / maintenance window for reclaim, with sizing tests and replicas.

> Senior tip: Before tuning autovacuum, check the xmin horizon and catalog_xmin of logical slots; restart_lsn lag mostly retains WAL, it doesn\\'t itself prove vacuum cleanup is blocked.`,
    rubric: [
      'Cite 8.4M dead tuples, active autovacuum / IO and table / index size.',
      'Name that long xmin and catalog_xmin of the slot logical may retain dead tuples; distinguish restart_lsn retaining WAL.',
      'Investigate pg_stat_activity / slots before acting.',
      'Tune per-table according to churn, analyze, IO and reduce update amplification.',
      'Distinguish vacuum reuse with reclaim OS; mention pg_repack / maintenance carefully.'
    ]
  }
});
