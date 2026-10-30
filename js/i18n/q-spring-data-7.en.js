/*
 * English translation of js/data/q-spring-data.js — task T179; entries db-016…db-019 re-translated in T548.
 * Format: js/core/i18n.js (content overlay).
 * ids: db-016 db-017 db-018 db-019 spring-022 spring-023 spring-024 spring-025 spring-026
 */
App.i18n.content({
  'db-016': {
    q: `You added a read replica to offload reads, but customers report "I just transferred money and don't see the transaction". How do you measure replication lag, what causes it, and how do you solve read-your-writes in Spring?`,
    a: `**Summary:** A read replica only receives changes that are already **committed** on the primary, and it must **replay** the WAL to hold the matching data. The gap between the commit on the primary and the moment the replica has that data is called **replication lag** – it is exactly what produces "I cannot read what I just wrote". In PostgreSQL, lag is measured with the {{replay_lsn}} column of {{pg_stat_replication}} compared against {{pg_current_wal_lsn()}}. Read-your-writes solutions: **read from the primary after writing**, **wait for the replica to catch up** (by LSN), **read from the cache you just wrote**, or **check the version** of the row you read.

### Quick intuition
The primary is like the **head office** where every contract is signed; the replica is a **branch office that receives photocopies** of contracts by mail. The photocopy always arrives a little after the original – a few milliseconds normally, seconds or minutes when the mail is jammed. A customer who has just signed at the head office and runs over to the branch asking "where is my contract?" hears "not here yet". Read-your-writes is the rule "whoever just signed should keep asking the head office for the next few minutes", or the branch must wait for the photocopy before answering.

### Key terms
- **WAL (Write-Ahead Log)**: a journal of every change; a replica receives the WAL via streaming and applies it again (replay).
- **LSN (Log Sequence Number)**: a byte position inside the WAL that only grows – used to compare how far a replica has caught up.
- **Replication lag**: the distance (in bytes or in time) between primary and replica.
- **Hot standby**: a replica that still serves read queries while replaying.
- **Asynchronous / synchronous replication**: the primary returns the commit without waiting / after waiting for the replica to acknowledge.
- **Read-your-writes**: the guarantee that a user always sees data they wrote themselves.
- **AbstractRoutingDataSource**: a Spring DataSource that picks the target DataSource from a key each time a connection is requested.
- **RPO**: the maximum amount of data you accept losing in an incident.

### Path of a money transfer
~~~text
t=0ms   App -> PRIMARY: INSERT transfer; COMMIT (LSN 0/5A00010)
t=1ms   App returns 200 OK, client switches screen
t=3ms   Client GET /transactions -> REPLICA (replay_lsn = 0/59FFF00 < 0/5A00010)
        => transaction NOT found
t=40ms  REPLICA replays up to 0/5A00010 -> only now visible
Under heavy load / a large VACUUM: lag 40ms -> 8s => the bug becomes "frequent"
~~~
1. **Commit on the primary** writes the WAL and flushes it; with async replication the primary answers OK immediately. Why: it does not wait on the network, which keeps write latency low.
2. **The WAL sender ships WAL** to the replica, which stores it and replays it. Why lag exists: network + I/O + single-threaded replay.
3. **A read query reaches the replica** before that transaction's LSN has been replayed → the data is missing.
4. **Read-after-write solution**: remember the LSN (or timestamp) of the last write in the session; for the next N seconds, or while the replica's {{pg_last_wal_replay_lsn()}} is still below that LSN, route reads to the primary.

### How to measure replica lag
~~~sql
-- Measure byte lag between primary and replica
SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn, replay_lsn,
       pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS replay_lag_bytes,
       write_lag, flush_lag, replay_lag
FROM pg_stat_replication;
~~~
- **Byte lag** (WAL bytes not yet replayed) is the most trustworthy number because it does not depend on clocks.
- **Time lag** ({{replay_lag}}) is easy to misread: it is the time measured **on the primary** from when the WAL was flushed locally until the standby reported it replayed – not the estimated time needed to drain what is still outstanding. When the primary has no new writes, this value may stay constant or become NULL. On the replica you can also look at {{now() - pg_last_xact_replay_timestamp()}} (this one depends on both machines' clocks).

### Why replicas lag
1. **The primary writes too much**: every transaction produces WAL that the replica must receive and replay through I/O.
2. **The replica is weaker than the primary**: its CPU/I/O cannot keep up with replay.
3. **Network**: bandwidth or latency between the two regions.
4. **Replay blocked by a long query running on the replica**: when WAL is about to remove row versions that a long {{SELECT}} on the replica still needs (for example because VACUUM on the primary reclaimed dead tuples), replay is delayed for at most {{max_standby_streaming_delay}} (default 30s) and then PostgreSQL **cancels that query** ("canceling statement due to conflict with recovery"). Enabling {{hot_standby_feedback}} reduces the cancellations but causes bloat on the primary instead.
5. **Heavy operations on the primary** (a large {{VACUUM}}, {{REINDEX}}, {{CREATE INDEX}}, a bulk update) generate WAL bursts the replica must replay (the replica does not run its own VACUUM/REINDEX).
6. **Large tables, index bloat** make applying WAL slower.

### Four ways to solve read-your-writes
1. **Read from the primary after writing** (sticky read): the simplest option. Systems serving sensitive business data (balance, transaction status) should almost **always** read from the primary.
2. **Wait for the replica to catch up**: after the write, poll the replica until lag is below a threshold (for example 100ms), then read. Suitable when some latency is acceptable and you need to read "large" data.
3. **Read from the cache you just wrote**: put the result into Redis/Caffeine with a short TTL and prefer the cache on read. Works for **idempotent, unchanging** data (catalogs).
4. **Write the version**: add a {{version}} column, read from the replica with {{WHERE version >= version_just_written}} and retry until it is visible.

### Routing reads/writes in Spring
Spring has no built-in read-replica mechanism; you have to build it with {{AbstractRoutingDataSource}} (the technical details are in the question about {{readOnly}}):
- {{determineCurrentLookupKey()}} checks {{TransactionSynchronizationManager.isCurrentTransactionReadOnly()}}: true → replica, false → primary.
- It must be wrapped in {{LazyConnectionDataSourceProxy}} so the connection is opened **after** the routing decision.
- You need **separate pools** for primary and replica – they are two different systems.
- If one transaction both reads and writes and you switch routing halfway through, you end up with two different connections inside the same transaction.
- With JPA, every query must run inside a transaction for the read-only flag to take effect.

### Why banking systems must limit replica reads
- Balance, credit limits and transaction status are decision-critical data – reading a stale copy could allow spending beyond the limit.
- Stale data read from a replica can violate reconciliation, financial reporting and record-retention requirements.
- Practical rule: **only reference data** (catalogs, fee parameters) may be read from the replica; anything that drives a financial decision reads from the primary.

### Pitfall production
- **Failover can lose data**: when a replica is promoted to primary, transactions that committed but had not replicated yet are lost ⇒ RPO is not zero.
- **An application cache** filled from the replica will hold stale data ⇒ you must account for that when designing TTL and invalidation.
- **Two connection pools** ⇒ the application's total connection count goes up; the replica has its own {{max_connections}} (and for hot standby it must not be smaller than the primary), so redo the sizing for both.
- **Reports running on the replica** can create heavy load that increases lag, indirectly hurting user reads as well.

### Common mistakes
- **{{@Transactional(readOnly = true)}} on a service called from inside a write transaction**: the outer transaction already holds the primary connection, so routing does not change – that is correct behaviour, but the developer believes they read from the replica. Conversely, calling a readOnly method **right after** a write method (two separate transactions) does hit the replica and does get bitten by lag. How to avoid: mark explicitly which screens need read-your-writes and let them read the primary.
- **No lag limit**: a replica that is 10 minutes behind still receives queries. Symptom – wrong report numbers, customer complaints. How to avoid: a health check that removes a replica from the pool when lag crosses the threshold.
- **Reporting queries cancelled on the replica** with a conflict with recovery error. How to avoid: a dedicated reporting replica with a higher {{max_standby_streaming_delay}}, accepting lag on that replica.

### One-minute spoken answer
"A replica only sees data after it has received and replayed the WAL from the primary, so there is always replication lag – that is why a customer transfers money and then does not see the transaction. I measure lag in bytes through pg_stat_replication, comparing LSN with pg_current_wal_lsn, which is more trustworthy than measuring by time. Lag grows when the primary writes in bursts, the replica is weaker, the network is slow, or replay is blocked by a long query on the replica. In Spring I use AbstractRoutingDataSource wrapped in LazyConnectionDataSourceProxy, readOnly goes to the replica and writes go to the primary, and for sensitive data such as balances or a just-created transaction I always read the primary, or read the primary for a few seconds after that user's own write. Lesson: treat lag as an SLO with alerting and automatically pull a replica out of routing when lag crosses the threshold."

> Senior tip: treat **replication lag as an SLO with alerting**. The threshold should follow business impact: if the business accepts data up to 1 second old, alert when lag exceeds 1 second. Have an **automatic fallback to the primary**, because a system that reads from a replica without a safety net shows incidents as "the customer cannot see their transaction" – which is very hard to diagnose.`,
    follow: [
      'Why can WAL replay on the replica be blocked by a long-running SELECT?',
      'How do you reliably measure replication lag when the clocks of the two machines differ?'
    ],
  },
  'db-017': {
    q: `You need a report showing running balance and top-3 largest transactions per customer. How do window functions solve this, and what traps cause incorrect results?`,
    a: `**Summary:** A window function computes a value **over a set of rows** (a partition) **without collapsing them**, so every row of the original table is preserved. Three common uses: **running balance** with {{SUM(...) OVER (PARTITION BY ... ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)}}, **ranking** with {{RANK}}/{{DENSE_RANK}}/{{ROW_NUMBER}}, and **top-N per group** with {{ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)}} filtered in an outer query. The biggest traps: choosing the wrong **frame** and forgetting a **tie-breaker** in {{ORDER BY}}.

### Quick intuition
GROUP BY is like **closing the books at month end**: each customer is left with a single total row. A window function is like **writing an extra column in the margin** of the detailed ledger: every transaction row stays exactly where it was, but next to it you get "the balance up to this row" or "this customer's rank for this transaction". The "window" is the set of rows the calculation is allowed to look at: {{PARTITION BY}} decides the group (one group per customer), {{ORDER BY}} decides the order, and the **frame** decides from where to where it looks (from the start of the group up to the current row).

### Key terms
- **Window function**: a function computed over a set of rows related to the current row without merging those rows.
- **PARTITION BY**: splits rows into independent groups for the calculation (not the same thing as a table partition).
- **Frame**: the range of rows inside the partition used for the calculation at the current row.
- **ROWS vs RANGE**: the frame counts physical rows / counts by ORDER BY value (rows with the same value are "peers" and enter the frame together).
- **Peer rows**: rows that share the same ORDER BY value inside a partition.
- **Tie-breaker**: an extra unique column in ORDER BY so the order is deterministic.
- **CTE**: a named subquery written with {{WITH}}.

### The order SQL actually runs in
~~~text
FROM/JOIN -> WHERE -> GROUP BY -> HAVING -> WINDOW -> SELECT -> DISTINCT -> ORDER BY -> LIMIT
Example account 7 (ORDER BY created_at, id):
 created_at  id  amount | ROWS running | RANGE (no tie-breaker) running
 09:00       11   +500  |   500        |   500
 10:00       12   -200  |   300        |   400   <- 12 and 13 share 10:00, they are peers
 10:00       13   +100  |   400        |   400      so both get the total of the whole group
~~~
1. **WHERE filters first**: the window only sees the rows left after WHERE. Why this matters: filtering for January throws away the opening balance.
2. **Partition and sort** by PARTITION BY + ORDER BY. Why it costs: without a matching index the whole data set must be sorted.
3. **Compute the function over each row's frame.** Why ROWS: each transaction is its own balance step, peers are not merged.
4. **SELECT receives the window value** – so filtering on {{rn <= 3}} requires wrapping another query level around it.

### Running balance
~~~sql
SELECT t.account_id,
       t.created_at,
       t.amount,
       SUM(t.amount) OVER (
           PARTITION BY t.account_id
           ORDER BY t.created_at, t.id          -- id is the tie-breaker
           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_balance
FROM transaction t
WHERE t.created_at >= '2026-01-01'
ORDER BY t.account_id, t.created_at, t.id;
~~~
- {{PARTITION BY}} splits the data into independent groups: each customer gets their own running balance.
- {{ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW}} means "sum from the start of the partition up to the current row".

### Why {{ROWS}} and not {{RANGE}}
- With {{ROWS}}, each row is its own unit. If two rows share the same {{created_at}}, they are still accumulated one after the other.
- With {{RANGE}}, rows with **the same ORDER BY value** are grouped together and all receive **the same** total.
- The **default** frame when {{ORDER BY}} is present but no frame is declared is {{RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW}}.

### Ranking
| Function | Result for values 100, 100, 80 |
|---|---|
| {{ROW_NUMBER()}} | 1, 2, 3 (always sequential, ignores ties) |
| {{RANK()}} | 1, 1, 3 (skips a number on a tie) |
| {{DENSE_RANK()}} | 1, 1, 2 (no gaps) |
| {{NTILE(4)}} | divides the partition into 4 roughly equal buckets, used for value-based segmentation |

### Top-N per group
~~~sql
WITH ranked AS (
    SELECT t.*,
           ROW_NUMBER() OVER (PARTITION BY t.account_id ORDER BY t.amount DESC, t.id) AS rn
    FROM transaction t
    WHERE t.created_at >= '2026-01-01'
)
SELECT * FROM ranked WHERE rn <= 3 ORDER BY account_id, amount DESC;
~~~
- **You must wrap it in a CTE/subquery** before filtering, because a window function **cannot** be used in the {{WHERE}} clause of the same query level.
- PostgreSQL also has {{DISTINCT ON}}, often faster, but it **only returns the top-1** per group, and the {{DISTINCT ON}} expressions must match the leading columns of {{ORDER BY}}.
- If you need "the 3 largest transactions **and all transactions tying with them**", use {{RANK()}} instead of {{ROW_NUMBER()}} – two transactions with the same amount could otherwise eat all 3 slots.

### Other functions you will use
- {{LAG(amount) OVER (ORDER BY created_at)}} and {{LEAD}}: compare with the immediately previous/next transaction (growth versus the previous period).
- {{FIRST_VALUE}}/{{LAST_VALUE}}: note that {{LAST_VALUE}} defaults to the value of the current frame, so you must declare the frame {{ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING}} to get the true last value.
- {{EXCLUDE CURRENT ROW}} (PostgreSQL 11+), {{EXCLUDE GROUP}}, {{EXCLUDE TIES}}: remove the current row from the frame – very handy for "compare with the immediately previous transaction".

### Pitfall production
- **A window function cannot be used in {{WHERE}}** at the same level – you need a subquery. This is the most common syntax error.
- **Missing tie-breaker** ⇒ results are unstable between two runs, and the running balance can be computed incorrectly.
- **Performance**: window functions need data sorted by {{PARTITION BY}} + {{ORDER BY}}; without a suitable index the entire set must be sorted ⇒ memory and I/O cost (spilling when it exceeds {{work_mem}}).
- **Filter first, compute later**: {{WHERE}} runs before the window function, so {{WHERE created_at >= ...}} means only the qualifying rows take part ⇒ the running balance in the example above **misses the opening balance**. You must add the opening balance, or compute over the full history and filter in the outer query.

### Common mistakes
- **Leaving the default frame (RANGE) for a running balance**: two transactions in the same second show the same balance. Symptom – the customer sees a statement that "jumps". How to avoid: declare {{ROWS BETWEEN ...}} explicitly plus an {{id}} tie-breaker.
- **Using {{ROW_NUMBER}} and expecting "top 3 including ties"**: transactions with equal amounts get cut arbitrarily. How to avoid: choose {{RANK}}/{{DENSE_RANK}} to match the business requirement and write it explicitly in the spec.
- **Computing over a billion-row table with no index**: the sort spills tens of GB to disk. How to avoid: an index on {{(account_id, created_at, id)}}, filter to the customer's range first, or store the opening balance as a daily snapshot and compute only the new part.

### One-minute spoken answer
"A window function computes over a group of related rows without collapsing them like GROUP BY, so every transaction stays intact and gains an extra computed column. For a running balance I write SUM of amount OVER PARTITION BY account ORDER BY created_at, id with a ROWS frame from the start up to the current row. For the top 3 per customer I use ROW_NUMBER inside a CTE and filter rn less than or equal to 3 in the outer layer, because a window function cannot appear in WHERE. The main traps: the default frame is RANGE so rows with the same timestamp get merged, a missing tie-breaker makes results unstable, and WHERE runs first so the opening balance must be added. On large data I always have an index matching the partition and order to avoid an on-disk sort."

> Senior tip: when writing reports with window functions, always add a **tie-breaker** to {{ORDER BY}} and **choose the frame explicitly** ({{ROWS ...}} instead of relying on the default).`,
    follow: [
      'Why does {{SUM(x) OVER (ORDER BY y)}} compute a running total while {{SUM(x) OVER ()}} gives the table-wide total?',
      'When should you use {{RANK()}} instead of {{ROW_NUMBER()}} in a top-N report?'
    ],
  },
  'db-018': {
    q: `Another team proposes putting interest calculation and fee logic into database stored procedures. How do you evaluate the trade-offs, and when should logic move to the Java layer instead of staying in the DB?`,
    a: `**Summary:** A stored procedure runs **inside the DB**, touches the data directly and reduces network round-trips – efficient for bulk operations. But the price is that **testability, versioning, code review and operations** all become significantly worse. The practical rule for banking systems: **keep business logic in the Java layer** and reserve procedures for **bulk data operations** that need no unit tests (aggregating, purging old data, recomputing totals).

### Quick intuition
Putting fee logic into a stored procedure is like **handing the recipe to the warehouse keeper**: they cook right there in the warehouse, so nobody has to carry ingredients to the kitchen (fewer round-trips), and it is very fast in large quantities. But once the recipe lives in the warehouse, the head chef (the Java team) cannot see it, cannot test it with familiar tools, every change has to go through the warehouse keeper, and moving to a different warehouse (Oracle → PostgreSQL) means rewriting it. So the usual rule is: **bulk hauling** belongs to the warehouse, **business recipes** belong to the main kitchen.

### Key terms
- **Stored procedure / function**: a program stored and executed inside the DB; PostgreSQL 11+ has {{CREATE PROCEDURE}} (it can commit midway) alongside {{FUNCTION}}.
- **PL/pgSQL / PL/SQL**: the procedural languages of PostgreSQL / Oracle.
- **Round-trip**: one request from the app to the DB plus the result coming back, usually 0.2–1ms inside the same data center.
- **SECURITY DEFINER / INVOKER**: the function runs with the privileges of its creator / of its caller.
- **search_path**: the ordered list of PostgreSQL schemas searched when a name is used without a schema.
- **pgTAP / utPLSQL**: unit-testing frameworks for PostgreSQL / Oracle.
- **Set-based**: processing a whole set of rows with one SQL statement instead of looping row by row.

### Evaluating the proposal, step by step
~~~text
Batch interest run for 2 million accounts:
 Java reads account by account : 2,000,000 round-trips x 0.5ms ≈ 17 minutes of network alone
 Java set-based in batches     : 2,000 batches x 1,000 rows, 1 SELECT + 1 batch UPDATE each ≈ a few minutes
 Procedure set-based           : one statement UPDATE ... FROM (...)  ≈ 1-2 minutes
~~~
1. **Classify the logic**: is it a business rule or a bulk data transformation? Why: only the second kind clearly benefits from running inside the DB.
2. **Measure the real round-trip cost**: often the slowness comes from Java code processing row by row, not from being in the Java layer. Why: switching to batch/set-based processing in Java is usually fast enough.
3. **Ask about the life cycle**: who writes the tests, does CI run them, how are versions and rollbacks handled? Why: the biggest cost of a procedure is maintaining it for years.
4. **Decide on a hybrid**: the interest/fee formula stays in Java (one place, unit tested), while the "apply in bulk" part is a single set-based SQL statement called from Java, or a thin procedure that contains no rules.

### Pros
- **Batch performance**: one call processes millions of rows without shipping the data back to the application.
- **Fewer round-trips**: multi-step logic runs inside the DB instead of each step paying a network hop.
- **Centralized rules**: rules sit next to the data and are easy to enforce for every access path.
- **Security**: you can grant {{EXECUTE}} on the procedure without granting direct table write permission.

### Cons
- **Hard to test**: frameworks such as pgTAP (PostgreSQL) or utPLSQL (Oracle) exist, but few teams use them; hard to mock, must run against a real DB.
- **Hard to review**: a diff of SQL procedure code is harder to read than Java; the impact of a change is harder to spot.
- **Hard to version**: must be managed through Flyway/Liquibase; multiple environments drift easily.
- **DB lock-in**: PL/pgSQL and PL/SQL differ, so moving between PostgreSQL and Oracle means a rewrite.
- **Logic hidden from the application**: people reading the Java code cannot see the business rules that are actually executing.
- **Does not scale**: logic living in the DB does not scale out when you shard the DB, and cannot be reused by other channels.
- **Security**: concatenating parameters inside a procedure is an easy SQL injection vector.

### When to keep logic in the DB
| Situation | Keep it in the DB |
|---|---|
| Purging tens of millions of old rows | Yes |
| Re-aggregating data from several tables | Yes |
| Business rules that vary per product/customization | **No** |
| Logic that needs unit tests and high coverage | **No** |
| Logic reused across channels (API, batch, worker) | **No** |

### Example of a well-written procedure
~~~sql
CREATE OR REPLACE FUNCTION recalc_daily_balance(p_account bigint, p_day date)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER            -- default: runs with the caller's privileges
SET search_path = public, pg_temp
AS $fn$
BEGIN
    UPDATE account_balance
       SET balance = sub.total
      FROM (SELECT account_id, sum(amount) AS total
              FROM transaction_entry
             WHERE account_id = p_account
               AND posted_on <= p_day
             GROUP BY account_id) AS sub
     WHERE account_balance.account_id = p_account;
END;
$fn$;
~~~
A safety point worth remembering: always set {{SET search_path}} explicitly. When {{search_path}} contains a schema that users can write to, an attacker could create a function with the same name that then gets called instead – and with {{SECURITY DEFINER}} this risk is far more serious.

### When to move logic to Java
1. **Business rules** (fee schedules, interest rates per product, approval conditions) – they change constantly, need tests, and need an audit trail of who changed what and when.
2. **Integration with other systems** (calling a payment gateway, sending notifications) – the DB cannot do this.
3. **Reuse** across several processing channels (sync API, batch job, message consumer).
4. **Scale** when the DB is split into shards – DB logic does not split with it.
5. **Observability**: metrics, traces and logs with context.

Recommended process when you still have to use procedures:
- Manage them with **Flyway/Liquibase** alongside the other migrations – never edit by hand in production.
- **Test for real** against the DB (use a transaction plus rollback for each test case).
- Document clearly in a **comment** at the top of the procedure: purpose, parameters, side effects, owner.
- **Version by name**: create a new function (for example {{recalc_daily_balance_v2}}) and make the old one call the new one, so you have a rollback path.
- Limit privileges: grant {{EXECUTE}} to the application role, not table write access.
- Set **timeouts and resource limits** for long-running procedures.

### Pitfall production
- **Procedure calling procedure** creates dependency chains that are hard to trace and hard to test.
- **No explicit transaction boundary** between the steps inside a procedure makes retry semantics ambiguous – you must state clearly whether the procedure is idempotent.
- **Logic hidden in the DB** never shows up in code review ⇒ one wrong change can affect millions of rows without anyone noticing.
- **{{EXECUTE}} grants** on procedures are often too broad; follow the principle of least privilege.
- **When you go from 1 DB to many DBs**, DB logic does not scale with you ⇒ it must be rewritten. That is a strong reason to put the logic in Java from the start.

### Common mistakes
- **A procedure that loops row by row (cursor loop)** instead of working set-based: it throws away the only performance advantage it had. How to avoid: write it as a single UPDATE/INSERT ... SELECT.
- **The same fee formula exists in both Java and a procedure**: the two drift apart after a few changes. Symptom – the fee shown on screen differs from the fee actually charged. How to avoid: a single source of truth.
- **Calling a long procedure from a Java {{@Transactional}} method**: the transaction stays open for 20 minutes, holding locks and a connection. How to avoid: split it into batches, one transaction per batch, with a resume point when something fails.

### One-minute spoken answer
"A stored procedure runs next to the data, so it is very fast for bulk work and cuts round-trips, and it lets you grant EXECUTE instead of table write permission. But it is hard to unit test, hard to review, hard to version, hides logic from the Java team and locks you to one database vendor. For interest and fee calculation – business rules that vary per product, need auditing and tests – I keep them in the Java layer. I only use procedures for set-based data operations such as purging or aggregating, and then I manage them with Flyway and run real DB tests in CI. Lesson: most of what looks like 'Java is slow' is row-by-row processing; switching to batched processing is usually fast enough while keeping the logic where it is easy to maintain."

> Senior tip: the question to ask yourself is: "**If this logic lives in the DB, who will write its tests, and will those tests run in the application team's CI?**" If the answer is "no", that is a strong signal the procedure will become "ghost logic" – nobody dares touch it, nobody understands it, and incidents get blamed on "a stored procedure bug" while the real cause is missing tests and missing ownership.`,
    follow: [
      'When does moving logic to the Java layer actually make the system slower?',
      'How do you manage versioning and rollback for stored procedures in production?'
    ],
  },
  'db-019': {
    q: `You need to recover data to the exact moment before a wrong {{DELETE}} ran. How does PITR work, what role does WAL archiving play, and how do you choose RPO/RTO for a transactional system?`,
    a: `**Summary:** **PITR** is the ability to restore a database to **any point in the past**, not only to the time of a backup. The mechanism: a **base backup** plus a **continuous WAL archive** (every change after that backup). On restore, PostgreSQL loads the base backup and then replays the archived WAL files until it reaches {{recovery_target_time}}, then stops. **RPO** decides how often WAL is archived; **RTO** decides the HA architecture. The one point you cannot skip: **a backup that has never been restored is not a backup**.

### Quick intuition
A base backup is like **a photo of the whole house** taken at midnight; the WAL archive is like **a security camera recording every change** after that. To bring the house back to exactly 09:19 in the morning – right before someone accidentally threw things away (the wrong DELETE) – you rebuild from the midnight photo and then **fast-forward the camera tape** to 09:19 and stop. Without the tape you can only go back to midnight. **RPO** is "how many minutes of footage you may lose at most", **RTO** is "how long it takes to rebuild the house".

### Key terms
- **PITR (Point-In-Time Recovery)**: restoring the DB to any moment still covered by the available WAL.
- **Base backup**: a physical copy of the entire data directory, taken online.
- **WAL segment**: a WAL file, 16MB by default, archived when it fills up or when {{archive_timeout}} forces a switch.
- **archive_command / restore_command**: the command that copies WAL out to storage / fetches WAL back during a restore.
- **Restore point**: a named marker in the WAL you can recover exactly to.
- **RPO (Recovery Point Objective)**: the maximum amount of data you are allowed to lose, measured in time.
- **RTO (Recovery Time Objective)**: the maximum time until the system is serving again.
- **Object lock (WORM)**: a storage mode that forbids modification or deletion for a set period.

### Recovering from a wrong DELETE, step by step
~~~text
00:00  base backup (pg_basebackup)  ---> S3
00:00 - 09:20  WAL 000..0A3 archived continuously ---> S3
09:20:13  DELETE FROM payment WHERE ... (missing condition) -- xid 8812345
Restore: base 00:00 + replay WAL up to 09:20:00 (or recovery_target_xid = 8812345 with recovery_target_inclusive = false)
~~~
1. **Pin down the time/xid of the bad statement** from the application log, the audit log or {{pg_waldump}}. Why: recovering too late includes the bad statement; recovering too early loses valid transactions.
2. **Build a new instance** from the most recent base backup taken **before** that moment – never overwrite production. Why: production still holds newer data you need to keep.
3. **Configure restore_command + recovery_target** and start the server; PostgreSQL fetches and replays the WAL in order. Why it takes time: replay is limited by I/O, roughly a few hundred MB to a few GB of WAL per minute depending on hardware.
4. **Stop at the target with {{recovery_target_action = 'pause'}}** and check the data. Why: you can still rewind or move forward if you picked the wrong point.
5. **Extract the deleted rows** from the restored instance and re-insert them into production (via {{pg_dump}} of that table or a small script). Why not replace the whole DB: this keeps the valid transactions that happened after 09:20.

### Backup types
| Type | Content | Pros | Cons |
|---|---|---|---|
| Physical ({{pg_basebackup}}, disk snapshot) | File-level copy at a point in time | Fast restore, foundation for PITR | Restores the whole cluster only, same major version |
| Physical + WAL archive | Base backup + every WAL after it | **Enables PITR** | Must manage WAL storage and monitor archiving |
| Logical ({{pg_dump}}) | Data as SQL statements | Readable, inspectable, per-table selection | Slow for large DBs, no PITR |

In PostgreSQL, {{pg_basebackup}} produces a **physical backup** usable for PITR and runs online without downtime.

### WAL archiving
~~~sql
-- primary: continuously ship WAL to archive storage
ALTER SYSTEM SET archive_mode = on;           -- requires a server RESTART to take effect
ALTER SYSTEM SET archive_command = 'aws s3 cp %p s3://my-backup/wal/%f';
ALTER SYSTEM SET archive_timeout = '60s';     -- force a WAL segment switch at most every 60s
SELECT pg_reload_conf();                      -- enough for archive_command/archive_timeout
~~~
In production use a dedicated tool (pgBackRest, WAL-G, Barman) instead of a hand-written copy command: they handle retries, compression, integrity checks and retention.
- Every committed change is written to the WAL. If the WAL is archived **continuously**, you can recover to any moment for which the WAL file still exists.
- **RPO = the maximum time a committed transaction may still be unarchived**. Archiving that is 5 minutes behind ⇒ an RPO of at most 5 minutes. Note that a WAL segment (16MB by default) is only archived when it is full, so at low write volume you must set {{archive_timeout}} to bound the RPO.
- The backup store must be **separate and have versioning/object lock** to protect against accidental deletion or ransomware encryption.
- If you lose the archive ⇒ you cannot recover to points around that gap. So you must **monitor** archive lag and **alert** when it crosses the threshold.

### Restoring to a point in time
~~~bash
# 1. Put the base backup into the data directory
# 2. Create the recovery.signal file
touch $PGDATA/recovery.signal

# 3. Configure postgresql.conf
restore_command = 'aws s3 cp s3://my-backup/wal/%f %p'
recovery_target_time = '2026-03-15 09:20:00+07'
recovery_target_action = 'promote'      # pause (default) | shutdown | promote
~~~
- Target parameters: {{recovery_target_time}} (by timestamp), {{recovery_target_xid}} (by transaction id), {{recovery_target_lsn}} (by WAL byte position), {{recovery_target_name}} (by a restore point you created).
- {{recovery_target_action = 'promote'}} makes the server accept read-write after reaching the target; {{'shutdown'}} stops it so you can inspect before putting it into service.
- You can also create a **restore point** with {{pg_create_restore_point('name')}} before a risky operation, so you can later recover to exactly that moment.

### Choosing RPO and RTO
| Requirement | RPO | RTO | Required architecture |
|---|---|---|---|
| Lose at most 1 hour of data, recover in 8 hours | 1 hour | 8 hours | Nightly backup + WAL archive |
| Lose at most 5 minutes, recover in 1 hour | 5 minutes | 1 hour | Continuous WAL archive + standby |
| Lose almost nothing, recover in 15 minutes | ≈ 0 | 15 minutes | **Synchronous replication** to another region + automated failover |

- A small RPO ⇒ the WAL must ship continuously (more bandwidth, I/O and storage cost).
- A small RTO ⇒ you need a replica that is **already standing by** (warm standby) so failover takes minutes, plus automation (for example Patroni for PostgreSQL) and regular failover drills.
- On AWS RDS: automated backups with PITR (retention up to 35 days), read replicas and Multi-AZ are built in. RDS manages the WAL for you, so you cannot configure {{archive_command}} – instead rely on RDS PITR, AWS Backup, and copying snapshots to another region/account.

### Testing restores
This is the most skipped step and also the most dangerous one:
- **Periodically** (at least quarterly) restore a backup into an isolated environment, measure the **actual restore time**, and update your committed RTO.
- Verify that the backup is **not corrupted** and can be **decrypted** (if encrypted) with the exact offline key.
- Record the numbers: backup size, backup duration, restore duration, measured RPO.

### Pitfall production
- **Backup in the same account/region as the database** ⇒ one infrastructure incident deletes both.
- **Never testing a restore** ⇒ you only find out the backup is broken when you need it most.
- **Backup and WAL version mismatch**: after a major version upgrade, an old base backup cannot replay the new WAL ⇒ create a fresh base backup immediately after the upgrade.
- **Delete permission on the backup store**: insider risk or ransomware. Use **object lock (WORM)**, versioning, and a separate access key that the application never uses.
- **Backing up only the database without a WAL archive** ⇒ no PITR, only "restore to last night".
- **Losing the backup encryption key** (or storing it only on the same system that failed) ⇒ you cannot restore.

### Common mistakes
- **archive_command failing silently**: WAL cannot be shipped and piles up in {{pg_wal}} until the disk fills. Symptom – {{pg_stat_archiver.failed_count}} climbs, the disk fills and the DB stops. How to avoid: alert on {{last_failed_time}} and on the age of the oldest unarchived WAL.
- **Restoring over production** instead of into a separate instance: you lose the valid data written after the recovery target. How to avoid: always restore elsewhere and then extract only the data you need.
- **Relying only on a replica** to undo a mistake: the replica replays the DELETE almost instantly, so it is gone there too. How to avoid: replicas are for HA, PITR is for logical mistakes; you can also add a delayed replica ({{recovery_min_apply_delay}}).

### One-minute spoken answer
"PITR restores to any point in time, using a base backup plus a continuous WAL archive. When someone runs a wrong DELETE, I build a separate instance from an earlier base backup, set restore_command and recovery_target_time just before the bad statement, let PostgreSQL replay the WAL and pause, check the data, then extract the deleted rows and put them back into production. RPO depends on how quickly the WAL gets archived – archive_timeout, or synchronous replication if it must be close to zero; RTO depends on the backup size, how much WAL must be replayed and whether a standby is already standing. The trade-off is that smaller RPO and RTO cost more. My most important lesson: a backup that has never been test-restored is not a backup, so I drill restores regularly and measure the real time."

> Senior tip: talk to stakeholders in **numbers**, not jargon: "If the disk dies at 10:05, we lose at most 5 minutes of transactions and need 20 minutes to rebuild from the latest backup". Many organisations claim a "zero data loss" RPO while actually running nightly backups with no WAL archive – that is not PITR, that is losing a day of data.`,
    follow: [
      'How do RPO and RTO differ, and which one drives the HA architecture?',
      'How do you design a periodic backup restore test process?'
    ],
  },
  'spring-022': {
    q: `What is the difference between {{@Component}}, {{@Service}}, {{@Repository}}, {{@Controller}}? What extra capability does {{@Repository}} add for exceptions?`,
    a: `**Summary:** All four are **stereotype annotations** for Spring component scan to discover beans; technically they are **aliases** of {{@Component}} and behave identically. The difference is purely **semantic**: {{@Component}} generic, {{@Service}} business layer, {{@Repository}} data layer, {{@Controller}} web layer. The key point: {{@Repository}} enables **exception translation** – Hibernate/JPA exceptions (unchecked) are wrapped into Spring's {{DataAccessException}} hierarchy so upper layers can catch them without depending on JPA.
 
 ### Comparison
 | Annotation | Layer | Use case |
 |---|---|---|
 | {{@Component}} | Generic | Utility, config, shared bean |
 | {{@Service}} | Business logic | Orchestration, transaction boundary |
 | {{@Repository}} | Data access | JPA repo, custom DAO, **exception translation** |
 | {{@Controller}} | Web MVC | {{@RequestMapping}}, returns view (Thymeleaf) |
 | {{@RestController}} | Web REST | {{@Controller}} + {{@ResponseBody}} |
 
 ### Exception translation by {{@Repository}}
 When a bean is annotated with {{@Repository}}, Spring registers a {{PersistenceExceptionTranslationPostProcessor}} that automatically wraps JPA/Hibernate exceptions ({{NoResultException}}, {{OptimisticLockException}}, Hibernate's {{ConstraintViolationException}}…) into subclasses of {{DataAccessException}} ({{EmptyResultDataAccessException}}, {{OptimisticLockingFailureException}}, {{DataIntegrityViolationException}}…). Spring Boot auto-registers this post-processor; plain Spring requires manual bean declaration. This lets services catch {{DataAccessException}} instead of importing JPA exceptions.
 
 ~~~java
 @Repository
 public class JpaOrderRepository implements OrderRepository {
     // getSingleResult() throws NoResultException -> Spring translates to EmptyResultDataAccessException
 }
 
 @Service
 public class OrderService {
     public Order get(Long id) {
         try { return repo.findById(id).orElseThrow(() -> new OrderNotFoundException(id)); }
         catch (DataAccessException ex) { throw new RepositoryException("DB error", ex); }
     }
 }
 ~~~
 
 ### Pitfall production
 - Using {{@Component}} for everything loses architectural meaning – reviewers can't tell which bean is a service, repo, or controller.
 - Forgetting {{@Repository}} on a custom DAO ⇒ JPA exceptions leak into the service layer, coupling it to JPA.
 - {{@Controller}} used for REST API returns a view name instead of JSON – must use {{@RestController}} or add {{@ResponseBody}}.
 
 > Senior tip: simple review rule: **any bean that touches the DB must have {{@Repository}}**. If the team uses Spring Data JPA interfaces, those are already proxied with {{@Repository}} implicitly, but custom DAO classes must add it manually.`,
    follow: [
      "Why doesn't Spring merge {{@Service}} and {{@Repository}} into a single annotation?",
      "How do you enable exception translation for a bean that doesn't use {{@Repository}}?"
    ],
  },
  'spring-023': {
    q: `How do {{@Bean}} and {{@Component}} differ? What does {{@Configuration}}'s {{proxyBeanMethods}} do, and when should you turn it off?`,
    a: `**Summary:** {{@Component}} uses **component scan** for Spring to auto-discover and register the bean; {{@Bean}} is used inside a {{@Configuration}} class to **manually declare a bean** – typically for third-party libraries, objects you don't own, or when creation logic is complex. {{@Configuration(proxyBeanMethods = true)}} (default) creates a CGLIB proxy for the config class so that calling a {{@Bean}} method multiple times still returns the **same instance** (singleton scope). Turn off {{proxyBeanMethods = false}} when the config class **does not call other {{@Bean}} methods** – this reduces proxy overhead and allows the class to be final.
 
 ### Comparison
 | Aspect | {{@Component}} | {{@Bean}} |
 |---|---|---|
 | Registration | Component scan (auto) | Explicit declaration in {{@Configuration}} |
 | Use for | Classes you write and control | Third-party libs, complex creation logic, multiple instances |
 | Scope | Singleton by default, change via {{@Scope}} | Singleton by default, change via {{@Scope}} on method |
 | Multiple instances | Hard (needs {{@Qualifier}}) | Easy: write multiple {{@Bean}} methods with different names |
 
 ### What is {{proxyBeanMethods}}
 When a {{@Configuration}} class has a {{@Bean}} method A calling another {{@Bean}} method B:
 ~~~java
 @Configuration
 public class AppConfig {
     @Bean
     DataSource dataSource() { return new HikariDataSource(); }
 
     @Bean
     JdbcTemplate jdbcTemplate() { return new JdbcTemplate(dataSource()); } // calls dataSource()
 }
 ~~~
 If {{proxyBeanMethods = true}} (default), Spring wraps the class in a CGLIB proxy. When {{dataSource()}} is called, the proxy checks the context: is there already a {{DataSource}} bean? If yes, return that bean instead of running the method body again ⇒ **singleton is preserved**. If {{false}}, {{dataSource()}} executes its body ⇒ creates a **new** {{DataSource}} every call ⇒ violates singleton.
 
 ### When to turn it off
 - Config class **does not** call other {{@Bean}} methods (no cross-method calls).
 - You want the config class to be final (CGLIB cannot proxy a final class).
 - Slightly faster startup (no proxy creation).
 
 ~~~java
 @Configuration(proxyBeanMethods = false)  // "lite" mode
 public class LiteConfig {
     @Bean DataSource dataSource() { ... }  // does not call other beans
     @Bean JdbcTemplate jdbcTemplate(DataSource ds) { return new JdbcTemplate(ds); } // inject via parameter
 }
 ~~~
 Spring Boot 3.x encourages **lite mode** ({{proxyBeanMethods = false}}) with parameter injection instead of calling other bean methods.
 
 ### Pitfall production
 - Turning off {{proxyBeanMethods}} while still calling other {{@Bean}} methods ⇒ duplicate instances, broken singleton, connection pool doubled.
 - Using {{@Bean}} for a class you own that could use {{@Component}} ⇒ more verbose, component scan won't see it, easy to forget to declare.
 
 > Senior tip: default to {{@Component}} for your own classes; only use {{@Bean}} when forced (library, complex instantiation). With {{@Configuration}}, use {{proxyBeanMethods = false}} and inject via parameters – that's the modern Spring Boot 3 style.`,
    follow: [
      'Why does Spring Boot 3 recommend {{proxyBeanMethods = false}}?',
      'If a class has {{@Configuration(proxyBeanMethods = false)}} but still calls another {{@Bean}} method, what happens?'
    ],
  },
  'spring-024': {
    q: `When multiple beans share the same type, how does {{@Autowired}} resolve them? How do {{@Qualifier}}, {{@Primary}}, and injecting {{List}}/{{Map}} work?`,
    a: `**Summary:** When multiple beans of the same type exist, Spring defaults to **throwing** {{NoUniqueBeanDefinitionException}}. Three ways to resolve: (1) {{@Primary}} on the preferred bean – auto-selected when no qualifier is present; (2) {{@Qualifier("beanName")}} at the injection point – explicitly picks a specific bean; (3) inject **{{List<Type>}}** or **{{Map<String, Type>}}** – receives **all** beans of that type (including non-primary ones), map key is the bean name. {{@Qualifier}} has higher priority than {{@Primary}}.
 
 ### Resolution mechanics
 1. If **exactly one** bean of type T exists → inject it.
 2. If multiple beans of type T exist:
    - Injection point has {{@Qualifier}} → use matching bean.
    - No qualifier, but a {{@Primary}} bean exists → use primary (then highest {{@Priority}} if multiple).
    - Still ambiguous → Spring tries to match **parameter/field name to bean name** (Spring Boot compiles with {{-parameters}}).
    - Nothing matches → **error** {{NoUniqueBeanDefinitionException}} at startup.
 
 ### {{@Primary}} vs {{@Qualifier}}
 ~~~java
 @Configuration
 public class PaymentConfig {
     @Bean @Primary
     PaymentGateway vnpayGateway() { return new VNPayGateway(); }
 
     @Bean
     PaymentGateway momoGateway() { return new MoMoGateway(); }
 }
 
 @Service
 public class PaymentService {
     private final PaymentGateway gateway;           // auto-injects vnpayGateway (primary)
     private final PaymentGateway momoGateway;       // gets momoGateway via @Qualifier
 
     public PaymentService(PaymentGateway gateway,
                           @Qualifier("momoGateway") PaymentGateway momo) {
         this.gateway = gateway;
         this.momoGateway = momo;
     }
 }
 ~~~
 
 ### Injecting List and Map
 ~~~java
 @Service
 public class NotificationDispatcher {
     private final List<Notifier> notifiers;                    // all beans implementing Notifier
     private final Map<String, Notifier> notifierByName;        // key = bean name
 
     public NotificationDispatcher(List<Notifier> notifiers, Map<String, Notifier> byName) {
         this.notifiers = notifiers;
         this.notifierByName = byName;
     }
 
     public void sendAll(String msg) {
         notifiers.forEach(n -> n.notify(msg));
     }
 }
 ~~~
 - {{List}} ordered by {{@Order}}/{{Ordered}}/{{@Priority}}, then registration order if none; {{Map}} key is bean name (class name with lowercase first letter, or {{@Bean}} method name).
 - {{@Primary}} bean **is still included in List/Map** – not excluded.
 - This pattern is used for **strategy pattern** or **chain of responsibility** (e.g., list of validators, processors).
 
 ### Pitfall production
 - Using {{@Qualifier}} with hardcoded strings is typo-prone – define constants or put {{@Qualifier}} on the bean definition.
 - Forgetting {{@Primary}} when adding a second implementation for an existing interface ⇒ all injection points for that interface break with {{NoUniqueBeanDefinitionException}} at startup (not a compile error).
 - Injecting {{Map}} but forgetting key is bean name (not qualifier) ⇒ lookup fails.
 
 > Senior tip: in review, if an interface has 2+ implementations, ask: "Which bean is the default (primary)?" If there's no primary and no qualifier at every injection point, the code will break when a new implementation is added.`,
    follow: [
      "Why doesn't Spring just pick the first bean alphabetically instead of throwing an ambiguity error?",
      "When injecting {{Map<String, T>}}, what key does the {{@Primary}} bean have?"
    ],
  },
  'spring-025': {
    q: `What annotations does {{@SpringBootApplication}} combine? What is a Spring Boot starter, and how does it differ from plain Spring?`,
    a: `**Summary:** {{@SpringBootApplication}} combines 3 core annotations: {{@SpringBootConfiguration}} (marks config class, enables {{@Bean}}), {{@EnableAutoConfiguration}} (activates auto-configuration – Boot's "magic"), and {{@ComponentScan}} (scans components from the main class's package). A **starter** is a Maven/Gradle dependency that bundles a curated set of libraries for a task (web, data-jpa, security…) plus auto-configuration – the difference from plain Spring is **no manual bean declarations, version management, or transitive dependency wiring**.
 
 ### Three annotations in {{@SpringBootApplication}}
 | Annotation | Role |
 |---|---|
 | {{@SpringBootConfiguration}} | Like {{@Configuration}}, allows {{@Bean}}; Boot uses it to find the main class |
 | {{@EnableAutoConfiguration}} | Reads {{META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports}}, loads auto-configs conditionally |
 | {{@ComponentScan}} | Scans {{@Component}}, {{@Service}}, {{@Repository}}, {{@Controller}} from the main class's package downward |
 
 Can be used separately:
 ~~~java
 @SpringBootConfiguration
 @EnableAutoConfiguration
 @ComponentScan("com.acme")
 public class MyApp { }
 ~~~
 
 ### Spring Boot Starter
 A starter is a **dependency descriptor** (mostly just a POM) that bundles the libraries needed for a task; versions are managed by the {{spring-boot-dependencies}} BOM, and auto-configuration lives in {{spring-boot-autoconfigure}} activated by classpath conditions:
 - **spring-boot-starter-web**: Tomcat, Spring MVC, Jackson (validation requires separate {{spring-boot-starter-validation}} from Boot 2.3).
 - **spring-boot-starter-data-jpa**: Hibernate, Spring Data JPA, HikariCP, transaction.
 - **spring-boot-starter-security**: Spring Security (OAuth2 resource server is a separate starter {{spring-boot-starter-oauth2-resource-server}}).
 
 Library versions are managed by Boot's BOM and tested for compatibility – reduces version conflicts.
 
 ### Difference from plain Spring
 | Aspect | Plain Spring (XML/Java config) | Spring Boot |
 |---|---|---|
 | Bean declarations | Write {{@Bean}}, {{@ComponentScan}}, {{@EnableTransactionManagement}}... | Auto-configuration does it |
 | Dependency versions | Manage {{{<version>}} in pom manually | Starter + BOM manage versions |
 | Run | Deploy WAR to Tomcat/JBoss | **Fat JAR** with embedded Tomcat/Jetty/Undertow, run {{java -jar}} |
 | Config | {{web.xml}}, {{applicationContext.xml}}, property files | {{application.yml}}, externalized config, profiles |
 | Health/Metrics | Build yourself | Actuator ready |
 
 ### Pitfall production
 - **Over-scanning**: {{@ComponentScan}} without a base package scans from the declaring class's package down; if the main class sits in a too-broad package (e.g., {{com}}) or the default package, it scans libraries too ⇒ slow startup, junk beans. Place the main class in your app's root package.
 - **Disable unneeded auto-config**: {{@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)}} when no DB is used.
 - **Starter pulling unwanted deps**: having both {{starter-web}} and {{starter-webflux}} makes Boot pick Spring MVC (servlet), WebFlux only remains as a client – for fully reactive, drop {{starter-web}}. Check dependency tree: {{mvn dependency:tree}}.
 
 > Senior tip: treat {{@SpringBootApplication}} as the **application entry point** – its package defines the component scan boundary. In multi-module projects, keep the main class in the root module scanning only that module; sub-modules use their own {{@ComponentScan}} or export beans via {{@Bean}}.`,
    follow: [
      'Why does Spring Boot use a fat JAR instead of a WAR deployed to an external server?',
      'How do you find out which dependencies a starter pulls and what versions they are?'
    ],
  },
  'spring-026': {
    q: `{{@Transactional}}: default rollback only on unchecked exceptions. How do you use {{rollbackFor}}, and how does a try-catch that "swallows" the exception break the transaction?`,
    a: `**Summary:** By default {{@Transactional}} only rolls back on **unchecked exceptions** ({{RuntimeException}}, {{Error}}). Checked exceptions ({{IOException}}, {{SQLException}}, custom checked exceptions) will **commit** the transaction unless you declare {{rollbackFor}}. The most dangerous trap: **catching the exception and not rethrowing** (swallowing) – the transaction commits normally even though business logic failed.
 
 ### Rollback rules
 | Exception type | Default | To rollback, declare |
 |---|---|---|
 | {{RuntimeException}}, {{Error}} | Rollback | — |
 | Checked exception | **Commit** | {{@Transactional(rollbackFor = Exception.class)}} |
 | {{SQLException}} | **Commit** (checked) – but often translated by Spring to {{DataAccessException}} (unchecked) | {{rollbackFor}} if you rethrow it yourself |
  | JPA {{PersistenceException}}, {{DataAccessException}} | Rollback (unchecked) | — |
 
 ~~~java
 @Transactional(rollbackFor = Exception.class)
 public void importFile(InputStream in) throws IOException {
     // IOException is checked -> needs rollbackFor to rollback
     parseAndSave(in);
 }
 ~~~
 
 ### Try-catch that swallows the exception
 ~~~java
 @Transactional
 public void transfer(Account from, Account to, BigDecimal amount) {
     try {
         from.debit(amount);
         to.credit(amount);
     } catch (InsufficientFundsException e) {
         log.warn("Insufficient funds");  // SWALLOWS EXCEPTION - NO rethrow
         // Transaction STILL COMMITS because no exception escaped!
     }
 }
 ~~~
 Fix: **rethrow** or wrap in a {{RuntimeException}}:
 ~~~java
 catch (InsufficientFundsException e) {
     throw new TransferFailedException(e);  // unchecked -> rollback
 }
 ~~~
 
 ### Pitfall production
 - **Checked exception without {{rollbackFor}}** ⇒ partial data commits (e.g., file import fails halfway but first half is saved).
 - **Catch, log, and don't throw** is the most common bug – code review must catch this: every {{catch}} inside a {{@Transactional}} method must {{throw}}.
 - Conversely: if an exception is thrown from a **different bean's** {{@Transactional}} method (REQUIRED, joined transaction) and caught in the outer method, the transaction is already marked rollback-only ⇒ commit throws {{UnexpectedRollbackException}}. Swallowing the exception does not "save" the transaction.
 - {{@Transactional}} on {{private}}, {{final}}, {{static}} methods **has no effect** (not proxyable) – Spring silently ignores it.
 - Place {{@Transactional}} at the **service layer**, not controller or repository.
 
 > Senior tip: mandatory code review rule: **a method with {{@Transactional}} must not have a try-catch that doesn't rethrow**. If you catch to handle, wrap in an unchecked exception and throw again. Also, enable DEBUG logging for {{org.springframework.transaction}} when debugging transactions.`,
    follow: [
      'Why does Spring default to not rolling back on checked exceptions?',
      'How do you spot a {{@Transactional}} method that swallows an exception during code review?'
    ],
  },
});
