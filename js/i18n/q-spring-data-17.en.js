/*
 * English translation of js/data/q-spring-data.js — task T959. Format: js/core/i18n.js (content overlay).
 * ids: db-042 db-043 db-044 db-045 db-046 db-047 db-048 db-049
 */
App.i18n.content({
  'db-042': {
    q: 'In MySQL InnoDB, why does a secondary index always point back to the clustered index, and why do gap locks / next-key locks at REPEATABLE READ cause deadlocks when multiple requests insert concurrently? How do you read SHOW ENGINE INNODB STATUS to find the root cause, and how do you fix it?',
    a: `**Summary:** InnoDB stores a table as a clustered index: the leaf nodes of the primary-key index contain the full row data, so a lookup by primary key traverses a single tree. A secondary index stores its indexed keys plus the primary-key value, so reading through a secondary index takes two steps: find the primary key in the secondary index, then look up the clustered index to fetch the full row. At REPEATABLE READ (the MySQL default), InnoDB uses a gap lock to block new rows from being inserted into a range that was already read, and a next-key lock (gap plus record) to block the current record too. When two transactions insert the same unique-key value, each takes an insert-intention lock on the same gap and then waits for the other to read the other's uncommitted record -> deadlock. MySQL picks a victim transaction, rolls it back, and returns error 1213 (SQLSTATE 40001); the application must catch the error and retry with a new transaction.

### Clustered index and secondary index
- Clustered index: based on the primary key (if none is declared, InnoDB creates a hidden 6-byte key). A leaf contains every column of the row. Reading by primary key = one traversal from root to leaf.
- Secondary index: for example an index on the customer_id column. A leaf contains customer_id plus the id (primary-key) value. Reading a customer's orders through this index: step 1 finds customer_id in the secondary index to get id; step 2 looks up the clustered index by id to fetch the full row. Therefore the primary key should be compact (an increasing BIGINT) and you should avoid long UUIDs (a long primary key makes every secondary index larger) - see the B-tree index question for details.
- Numbers: a query through a secondary index typically costs about twice as many page reads as a direct primary-key query.

### Gap lock and next-key lock
InnoDB takes row locks on records that are read/modified and holds them until commit. At REPEATABLE READ, to block phantoms (new rows inserted into a range already read), InnoDB adds:
- Gap lock: locks the empty gap between two key values in an index, blocking new rows from being inserted into that gap.
- Next-key lock: the gap plus the first record after the gap.
- Insert intention lock: a special lock type taken on insert. Insert intention locks do not conflict with each other in the same gap, but when checking for a duplicate unique key each transaction must take a lock on the record being inserted by the other.

Deadlock example (two requests placing the same order code):
~~~
T1: INSERT INTO orders (code, ...) VALUES ('ORD-100', ...)
    -- 1. takes an insert intention lock on the gap containing 'ORD-100'
T2: INSERT INTO orders (code, ...) VALUES ('ORD-100', ...)
    -- 2. takes an insert intention lock on the same gap (no conflict)
T1: -- 3. scans the unique index, sees T2's uncommitted 'ORD-100' -> waits for T2 (X lock on record)
T2: -- 4. scans the index, sees T1's uncommitted 'ORD-100' -> waits for T1   => CYCLE
MySQL: detects the cycle, rolls back T2 (victim), returns error 1213, T1 proceeds
~~~

### Reading SHOW ENGINE INNODB STATUS
Run SHOW ENGINE INNODB STATUS and look at the LATEST DETECTED DEADLOCK section. In it:
- TRANSACTION ... ACTIVE ... sec for each side, with mysql tables in use 1, 2 lock struct(s).
- Each side lists LOCK WAIT (which lock it is waiting for) and LOCK (which locks it holds), with the running SQL statement.
- WE ROLL BACK TRANSACTION (2) tells you which transaction was the victim.
From the two SQL statements and the two related indexes, you know which lock order caused the deadlock (for example two INSERTs of the same unique code) and fix it in the right place.

### How to fix it
1. Catch the error and retry: a deadlock is normal in a contended system. Catch error 1213 / SQLSTATE 40001 (Spring translates it to PessimisticLockingFailureException or CannotAcquireLockException), retry the whole transaction with backoff + jitter, at most 3-5 times.
2. Avoid inserting duplicate unique keys: generate unique codes from a sequence/central counter instead of randomly, or check existence before inserting (always keep the retry because of races).
3. Short transactions: do not call other APIs or do heavy processing inside the transaction.
4. Many rows: sort by key before batch inserts so the lock order is stable.

### In production
- Symptoms: bursts of error 1213 when many users place orders or register the same unique code at once.
- Monitoring: SHOW ENGINE INNODB STATUS when you need detail; information_schema.innodb_trx to see long-running transactions.
- Do not fix this by turning off gap locks broadly (setting isolation to READ COMMITTED): you will lose phantom consistency; only change it when the business accepts the consequences and you understand them.

> Senior tip: a deadlock is not a database bug, it is a signal that two transactions are contending for resources in an unstable order. The goal is not "never deadlock" (impossible with concurrent writes), but to reduce frequency and make sure the application knows how to catch the error and retry correctly.`,
    follow: [
      'Why does an InnoDB secondary index always contain the primary-key value, and how does that affect primary-key choice?',
      'When can a gap lock cause a deadlock that an insert intention lock alone is not enough to prevent?',
      'How do you distinguish a deadlock (1213) from a lock wait timeout (1205) in MySQL logs?'
    ]
  },
  'db-043': {
    q: 'What formula should you use to size a HikariCP connection pool, and why is a larger pool slower? How should maxLifetime relate to database and load balancer timeouts?',
    a: `**Summary:** Pool size should be based on real work, not on the number of application threads. By Little's Law, the average number of busy connections = requests per second * average time a connection is held (seconds). For example 400 requests/second * 0.02 seconds = ~8 connections busy at once; a pool of 15 per instance is enough for peak load, a pool of 100 only adds contention at the database. HikariCP's reference formula: pool ~= (database CPU cores * 2) + effective spindle count, start at 10-20 per instance, and the total pool across all instances (including at peak autoscaling) must be smaller than the database's max_connections (leave about 20% for admin, replication, and tools). A larger pool is slower because of queuing: as utilization approaches 100%, wait time spikes (M/M/c system); at the same time too many concurrent queries increase context switching, lock contention at the database, and thrash the buffer pool because each query evicts another query's pages. maxLifetime must be shorter than the silent connection-drop timeout of the firewall/database (for example 30 minutes vs 60 minutes) so Hikari retires connections before they are cut silently; otherwise the application sees random "connection reset" errors after off-peak hours.

### Reference formulas
1. Check the database's max_connections and the instance count: maximum-pool-size * instance count (including the maximum number of pods at peak autoscaling) must be less than max_connections.
2. Based on database CPU cores: reference pool ~= (core count * 2) + effective spindle count.
3. Start with 10-20, then measure: connection acquisition wait time, timeout rate, and database throughput.
Example numbers: 400 requests/second, each request holds a connection for 20 ms -> you need ~8 busy connections on average (400 * 0.02).

### Why a larger pool is slower
- Queuing: as utilization nears 100%, wait time grows non-linearly, not linearly.
- Context switching: the database handles each connection with a thread/process (PostgreSQL uses one process per connection); too many switching constantly wastes CPU.
- Lock and buffer-pool contention: many queries running at once evict each other's pages in the buffer pool, so disk-read miss rates rise.
- Memory: each PostgreSQL connection consumes several megabytes of RAM even when idle.

### Important timeouts
| Parameter | Meaning | Suggestion |
|---|---|---|
| connection-timeout | Maximum time to wait for a connection from the pool | Short, 2-5 seconds, fail fast |
| max-lifetime | Maximum lifetime of a connection before it is closed and replaced | Shorter than firewall/DB limits, e.g. 30 minutes vs 60 minutes |
| idle-timeout | How long an idle connection can sit before being closed (minimum 10 seconds) | 10 minutes |
| leak-detection-threshold | Log the borrow stack trace when a connection is held too long | Enabled, e.g. 60 seconds |

maxLifetime is randomized slightly (Hikari does this) to avoid dozens of instances recycling connections at the same moment (thundering herd). maxLifetime must also be shorter than MySQL's wait_timeout (default 28,800 seconds) and PostgreSQL's idle_in_transaction_session_timeout if used, so you do not hold dead connections.

### Measuring in production
Watch HikariCP metrics: hikaricp.connections.pending (threads waiting for a connection), connections.usage (utilization), connections.acquire (acquisition time). If pending > 0 frequently, do not increase the pool right away - find the transactions holding connections for a long time (Open Session In View, calling another API inside @Transactional), because increasing the pool only moves the bottleneck from the application down to the database.

### In production
- With virtual threads (Java 21+): the thread count can be very large but database connections are still finite -> set a small pool (often 5-10), watch pending; when many instances share one database, consider PgBouncer or RDS Proxy instead of a pool per instance.
- spring.jpa.open-in-view = true (the default) holds a connection for the whole time JSON is rendered -> the pool runs out even when queries are fast. Set it to false and load all needed data inside the service.

> Senior tip: the most important connection-pool metrics are wait time and the number of waiting threads, not the current number of connections. A larger pool does not make the database faster; it only spreads the database's CPU time across more requests. When you see connection waits, the first step is to find the queries that hold transactions for a long time.`,
    follow: [
      'By Little\'s Law, how many connections on average do you need for 200 requests/second holding a connection for 50 ms?',
      'Why must maxLifetime be shorter than the DB wait_timeout and the load balancer idle timeout?',
      'Should virtual threads lead to a larger connection pool?'
    ]
  },
  'db-044': {
    q: 'What is replication lag, and why can an application read a replica right after a write and not see the data it just wrote? How do you measure lag, and how do you guarantee read-your-writes in Spring?',
    a: `**Summary:** Replication lag is the time between when a transaction commits on the primary (the write node) and when that data is written to a replica (a read-only node). Because of it, a user who just transferred money can refresh the screen and not see the transaction - the record has not yet propagated from the primary to the replica. Physical replication (streaming replication, the PostgreSQL/MySQL default) works asynchronously: the primary writes the WAL/redo log, then ships the WAL records over the network for the replica to replay. So a commit on the primary returns success immediately without waiting for the replica; lag can be a few milliseconds to several minutes depending on load and the replica's disk speed. You guarantee read-your-writes in three ways: read from the primary right after that user's own write, use sticky routing for a short time after a write, or wait for the replica to replay up to the WAL position (LSN) that was written before allowing reads from the replica. Financial data (balances, order status) should always be read from the primary.

### Replication step by step
1. The application commits on the primary.
2. The primary writes the changes to WAL and fsyncs, then returns success to the application.
3. The WAL sender on the primary ships the WAL records over the network to the WAL receiver on the replica.
4. The replica writes the received WAL to its own disk (flush), then replays it into the data (data pages are updated).
5. The time between step 2 and step 4 is the replication lag.

### How to measure lag
PostgreSQL: inspect the write_lsn, flush_lsn, and replay_lsn columns in the pg_stat_replication view, compared with pg_current_wal_lsn() on the primary (the current WAL position). The byte distance (or pg_last_wal_replay_lsn() on the replica compared with the written LSN) tells you the lag. MySQL: run SHOW REPLICA STATUS; on the replica, check Seconds_Behind_Master (seconds behind the primary) and compare Read_Master_Log_Pos with Exec_Master_Log_Pos.

### Three ways to guarantee read-your-writes
1. Read from the primary after a write: for a user's own data (profile, balance), always read from the primary for a few seconds after the write. Simplest and safest.
2. Sticky routing: after the user writes, pin that user's session to the primary for a period of time (for example 30 seconds-5 minutes); reads from that session go to the primary, and only then return to replicas.
3. LSN gate: after a commit on the primary, the application stores the written LSN (pg_current_wal_lsn()). Later reads are routed to a replica only when pg_last_wal_replay_lsn() on that replica is greater than or equal to the stored LSN; if not, read from the primary. Implement in Spring with AbstractRoutingDataSource: pick the primary for write @Transactional and follow-up reads, replicas for @Transactional(readOnly = true) when the LSN gate is open.

### When to use synchronous replication
synchronous_standby_names + synchronous_commit = remote_apply makes a commit wait for the replica to apply it, so a replica read right after commit is not stale. The cost: higher commit latency (waiting for a network round trip), and if no synchronous replica is available, commits can block.

### In production
- Lag symptoms: complaints of "I just updated it but I do not see it", or a new record on the primary missing on a replica when a report runs on replicas.
- Lag causes: a replica that replays slowly (weaker CPU/disk), the network, large transactions holding WAL, long queries on the replica cancelled due to recovery conflicts (canceling statement due to conflict with recovery), a stuck replication slot preventing WAL removal (pg_wal directory grows, related to the WAL/CDC slot question).
- Fixes: upgrade the replica, split large transactions, enable hot_standby_feedback = on if you accept a slower replica to protect long queries, monitor pg_replication_slots and drop unused slots.

> Senior tip: do not route every read to a replica with a blanket "a few seconds of staleness is fine" without asking stakeholders. Financial data and a user's own actions right after a write must read from the primary; analytics, reports, and internal dashboards can read replicas with a "data may be a few minutes stale" notice. In Spring, declare the data source explicitly with AbstractRoutingDataSource instead of letting each service guess.`,
    follow: [
      'Why does a commit on the primary return success immediately even though the replica does not yet have the data, and what problem does that create?',
      'What do pg_last_wal_replay_lsn() and pg_current_wal_lsn() do when measuring lag?',
      'When should you choose synchronous replication (synchronous_commit = remote_apply) instead of asynchronous?'
    ]
  },
  'db-045': {
    q: 'What does time-based range partitioning help with and when does it not help? Discuss partition pruning, purging old data, and the constraints on primary/unique indexes.',
    a: `**Summary:** Partitioning splits a large table into smaller partitions, each holding a range of data (for example an 800-million-row orders table with one partition per month by created_at). When a query has a condition on the partition column, the planner performs partition pruning: it drops partitions that definitely cannot contain matching data and scans only the relevant ones. The biggest benefit is purging old data with DROP or DETACH PARTITION (milliseconds, no WAL for millions of rows, no table bloat) instead of DELETE of millions of rows. Each partition is smaller, so its indexes fit in the buffer cache and vacuum finishes sooner. Partitioning does not help when a query lacks the partition column (it must scan all partitions, often worse than a normal table), when there are too many small partitions (planning time and memory grow), or when the DEFAULT partition becomes a catch-all. Key constraint: primary keys and unique indexes must include the partition column, so the primary key becomes (id, created_at), and any access by id alone must know the time or scan all partitions.

### Partitioning and partition pruning
Example of an orders table partitioned by month:
~~~
orders_2026_01  orders_2026_02  ...  orders_2026_06
(created_at 01/2026) (02/2026) ... (06/2026)
~~~
The query SELECT * FROM orders WHERE created_at >= '2026-05-01' AND created_at < '2026-06-01' scans only the May and June partitions (PostgreSQL also has runtime pruning when parameters are known at execution). A query without a time condition, for example WHERE customer_id = ?, must scan all partitions.

### When partitioning helps
- Purging old data: DETACH PARTITION then DROP TABLE takes a few milliseconds for hundreds of millions of rows, generates no WAL for millions of rows, and does not lag replicas; the equivalent DELETE can take hours, generate huge WAL, and leave bloat.
- Indexes fit in memory: each partition's index is small and more likely to stay in the buffer pool -> faster queries.
- Smaller vacuum and maintenance: per partition, without holding a long lock on the whole table.
- Partition-wise join/aggregate (PostgreSQL 11+): joining two tables partitioned on the same key can run per partition pair.

### When partitioning does not help (and can hurt)
| Situation | Why |
|---|---|
| Query without the partition column | Scans all partitions, plus the overhead of opening each partition |
| Too many small partitions (thousands) | Planning time grows, memory use grows, plans get worse |
| DEFAULT partition receives the overflow | Any non-matching value falls into DEFAULT, and that table grows out of control |
| Access by primary key without time | The primary key must include the partition column -> a single-id lookup scans many partitions |
| Join a partitioned table with a non-partitioned table | Weaker optimization, may not use partition-wise |

### Operational practices
- Create partitions ahead of time for the next month with a scheduled job; do not wait for new data to create a partition at write time (it causes schema-lock waits).
- Monitor the row count in the DEFAULT partition; if it is large, the partition column design is wrong or there are unexpected values.
- Before DROP, DETACH and keep the detached table for a while so you can roll back if needed.
- MySQL 8 native partitioning: each partition is a separate tablespace file, unique/primary keys must also include the partition column, and partitioned tables do not support foreign keys.

### In production
- Symptom of bad partitioning: a query by customer_id on an 800-million-row table is slower after partitioning (because it scans 72 partitions).
- How to verify: EXPLAIN (ANALYZE, BUFFERS) shows whether the plan has an Append node with few partitions (good) or scans all of them (bad).
- When not to partition: tables under a few tens of millions of rows, queries mostly by random keys, or a team not ready to operate extra partitions.

> Senior tip: partitioning is more of an operational tool (purging old data, splitting indexes) than a query-speed tool. Partition only when the table is large enough that a monthly DELETE lags replicas or vacuum cannot keep up, and when most hot queries filter on the time column. If you are unsure, start with good indexes and move historical storage into a separate partitioned table later.`,
    follow: [
      'Why must the primary key of a partitioned table include the partition column, and what is the consequence?',
      'Does partition pruning run at planning time or at query execution time, and how do they differ?',
      'What is a DEFAULT partition, and why can it become a performance trap?'
    ]
  },
  'db-046': {
    q: 'What is an index-only scan, and why does EXPLAIN sometimes still show heap reads (high Heap Fetches)? How are the visibility map and VACUUM related, and how do you handle index bloat?',
    a: `**Summary:** An index-only scan returns results directly from the index without reading the data table (the heap). It happens only when two conditions hold: (1) every column the statement needs is in the index (a covering index; PostgreSQL 11+ uses INCLUDE, and an InnoDB secondary index already contains the primary key), and (2) in PostgreSQL, all rows on the heap page are marked "visible to every transaction" in the visibility map (VM). VACUUM updates the VM; a long transaction blocks VACUUM -> a stale VM -> the index-only scan still has to visit the heap to check visibility (the Heap Fetches column in EXPLAIN ANALYZE is high instead of 0). Index bloat: old row versions not yet cleaned up make the index larger than necessary, so scans are slower and use more RAM. Fixes: tune autovacuum, VACUUM FULL (takes a table lock, needs downtime), pg_repack (online), REINDEX CONCURRENTLY (for the index), and fillfactor to leave room in pages for updates (HOT updates do not touch the index).

### What an index-only scan is
Instead of index -> heap -> return row, the database reads only the index and returns immediately. For example an index (customer_id, created_at) INCLUDE (amount) can answer SELECT customer_id, created_at, amount FROM orders WHERE customer_id = ? entirely from the index. In MySQL/InnoDB, a secondary index already contains the primary-key value, so if a query selects only columns in the secondary index plus the primary key, it can also be an index-only scan.

### Visibility map (PostgreSQL)
Each heap page has a bit in the visibility map marking "all rows on this page are visible to every current and future transaction". VACUUM sets this bit once it determines the dead versions on the page are old enough (no transaction still running needs to see them).
- If the VM is up to date: the index-only scan skips the heap, Heap Fetches = 0.
- If the VM is stale (the page was just updated, or a long transaction blocks VACUUM from cleaning the page): the index-only scan still reads the heap to check whether each row is visible -> high Heap Fetches.
Example numbers: a 50-million-row table, an ideal index-only scan reads 2,000 index pages; if the VM is stale, the system reads an extra 2,000 heap pages -> latency doubles.

### Index bloat and VACUUM
PostgreSQL does not overwrite an old row on update: it inserts a new version and marks the old one dead (a dead tuple). Dead versions in the index are still scanned until VACUUM cleans them. Index bloat happens when:
- A long transaction holds an old snapshot -> VACUUM cannot clean the related dead versions.
- Updates touch indexed columns -> a new index entry is created and the old one must wait to be cleaned.
- The n_dead_tup column in pg_stat_user_tables shows how many dead versions are waiting to be cleaned.

### Handling in production
- VACUUM (no read/write lock): cleans dead versions and can reuse space inside the file, but does not shrink the file.
- VACUUM FULL: rewrites the whole table and shrinks the file, but requires an exclusive lock (no reads/writes during that time) -> usually run in off-peak hours.
- pg_repack: rewrites the table and indexes online without a long lock, but needs extra disk space equal to the table size.
- REINDEX CONCURRENTLY: rebuilds a bloated index without blocking reads/writes on the index (PostgreSQL only), needs a lot of CPU/I/O while it builds.
- fillfactor: set below 100 (for example 80) on frequently updated tables to leave room in pages; an update that does not change indexed columns can use HOT (Heap-Only Tuple) and avoid updating the index -> less bloat.

### In production
- Bloat symptoms: a 50 GB table with only 30 GB of real data; slow index scans; high Heap Fetches on index-only scans.
- How to measure: pg_stat_user_tables (n_dead_tup, last_vacuum, last_autovacuum), the pgstattuple extension for precise bloat.
- Prevention: tune autovacuum_vacuum_scale_factor (lower it to 0.02-0.05 for heavily updated tables) and autovacuum_vacuum_insert_scale_factor for insert-only tables.

> Senior tip: an index-only scan is fast but not magically free - it depends on VACUUM keeping up. When you see "index-only scan still reads the heap a lot", check for long transactions (pg_stat_activity, xact_start) blocking vacuum before blaming the index.`,
    follow: [
      'Why can an index-only scan still read the heap even when the index contains every needed column?',
      'How do VACUUM FULL and pg_repack differ, and when do you use each?',
      'What is a HOT (Heap-Only Tuple) update and how does it reduce index bloat?'
    ]
  },
  'db-047': {
    q: 'What is transaction ID wraparound, and why can PostgreSQL force a database into read-only mode if vacuum cannot keep up? Does MySQL have a similar problem, and how do you prevent it?',
    a: `**Summary:** PostgreSQL uses a 32-bit transaction ID (XID, about 2 billion values) to mark each row version (hidden columns xmin, xmax). Before the XID counter wraps around to the beginning, every old row version must be "frozen" with a special XID; otherwise the database cannot tell which versions are old and which are new, and to protect data it forces the entire database into read-only mode until vacuum finishes - a severe incident. VACUUM and autovacuum freeze are the prevention mechanism, but a long transaction holds an old XID and stalls freeze progress. MySQL does not have the XID wraparound problem; instead, old versions live in the undo log and are cleaned by the purge thread, so a long transaction makes the purge history (History list length) grow and can throttle writes (innodb_max_purge_lag). Common prevention: keep transactions short, set idle connection timeouts, and monitor oldest_xid (PostgreSQL) and History list length (MySQL).

### XID and why 2 billion is a dangerous threshold
Each row version in PostgreSQL stores xmin (the creating transaction) and xmax (the deleting/replacing transaction). An XID is a 32-bit number, about 2 billion transactions. When the system has run through 2 billion transactions, the XID wraps back to the start. If versions are not frozen, the system cannot distinguish old from new versions -> data can be misinterpreted. Therefore PostgreSQL must freeze (set xmin/xmax to a special "frozen" XID) old-enough versions well before wraparound.

### Vacuum freeze and the read-only incident
VACUUM scans tables, freezes old versions, and updates the database's datfrozenxid (the oldest unfrozen XID). Important thresholds:
- autovacuum_freeze_max_age (default 200 million transactions): triggers aggressive autovacuum freeze.
- When oldest_xid passes roughly 1.5 billion transactions (and especially approaches 2 billion): PostgreSQL forces the database read-only until freezing completes - no writes are allowed and application writes will fail.
- A long transaction (for example @Transactional left open for hours, or a SQL tool left in manual-commit mode) holds an old xmin -> VACUUM cannot freeze the versions it needs -> oldest_xid stalls and moves toward the wraparound threshold.

### The MySQL path: purge lag
MySQL InnoDB does not use a 32-bit XID for row versions in that way, so it has no wraparound-driven read-only mode. Instead:
- Old versions live in the undo log; the purge thread cleans the undo log when no transaction still needs it.
- A long transaction -> purge cannot keep up -> History list length in SHOW ENGINE INNODB STATUS grows (the number of undo records waiting to be purged).
- If it gets too high, InnoDB throttles writes (innodb_max_purge_lag, default 0 = no throttling), and read queries must walk through more undo versions -> they slow down gradually.

### Prevention and monitoring
PostgreSQL:
- Keep transactions short; avoid wrapping slow HTTP calls inside @Transactional.
- Set idle_in_transaction_session_timeout (for example 60 seconds) to kill sessions that forgot to commit.
- Monitor SELECT datname, age(datfrozenxid) FROM pg_database; and use pg_stat_activity to find long-running transactions.
- Vacuum frequently on heavily updated tables; you can lower autovacuum_vacuum_scale_factor to 0.02-0.05.

MySQL:
- Keep transactions short; use information_schema.innodb_trx to see long-running transactions.
- Monitor the History list length section in SHOW ENGINE INNODB STATUS; if it stays high, review innodb_max_purge_lag and optimize long queries.

### In production
- PostgreSQL symptom: the error "database is not accepting commands to avoid wraparound data loss", and application writes are rejected.
- Recovery: run VACUUM (or VACUUM FREEZE) on the stuck tables; after the incident, fix the long transaction that was the root cause.
- MySQL symptom: History list length climbs into the thousands, write throughput drops, and reads slow down gradually.

> Senior tip: wraparound does not happen because data is too large, it happens because "a transaction ran too long". A SQL tool session left open in code and forgotten can stall oldest_xid for thousands of transactions and push the whole system toward read-only mode. The golden rule: every application transaction must be short, and you should have automatic alerts when a transaction stays open for more than 60 seconds.`,
    follow: [
      'Why must PostgreSQL freeze old row versions before the XID wraps around?',
      'How does a long transaction (@Transactional left open for hours) affect oldest_xid and vacuum?',
      'MySQL has no wraparound, but what problems can a long transaction still cause in InnoDB?'
    ]
  },
  'db-048': {
    q: 'The database is slow but no one knows which query to optimize first. How do you use pg_stat_statements, the slow query log, auto_explain, and APM to find the real culprit?',
    a: `**Summary:** Do not optimize by guesswork. I find the queries that consume the most **total DB time** (not the slowest single query) with **pg_stat_statements**, get the **actual plan** of the slow statement with **auto_explain** or {{EXPLAIN (ANALYZE, BUFFERS)}} on a replica, connect it to an **APM trace** to learn which API calls it and how many times per request, then prioritize by **impact** (time * frequency * API criticality).

### Why "total time" matters more than "slowest"
| Query | Time per run | Runs/hour | Total/hour |
|---|---|---|---|
| Monthly report | 4 seconds | 6 | 24 seconds |
| Cart count | 3 ms | 2,000,000 | 6,000 seconds |
The second query is "fast" but consumes 250x more DB time. Optimizing it (cache, index) has the biggest impact.

### Tools and how to use them
- **pg_stat_statements** (extension, loaded via {{shared_preload_libraries}}): aggregates stats by normalized statement (parameters normalized to $1, $2).
~~~sql
SELECT left(query, 80) AS q, calls,
       round(total_exec_time) AS total_ms, round(mean_exec_time, 1) AS mean_ms,
       rows, shared_blks_read                     -- blocks read from disk
FROM pg_stat_statements
ORDER BY total_exec_time DESC LIMIT 20;
~~~
Snapshot periodically (or {{pg_stat_statements_reset()}} at the start of a period) to compare before/after a release.
- **Slow query log**: {{log_min_duration_statement = 500}} logs statements slower than 500 ms with real parameters - for reproduction.
- **auto_explain**: also logs the **execution plan** of slow statements ({{auto_explain.log_min_duration}}, be careful with {{log_analyze}} because it adds cost) - valuable because the production plan can differ from staging.
- **APM / tracing**: shows which API issues the query, how many times per request (reveals N+1), and what share of request time the query takes.
- **pg_stat_activity, pg_locks**: during an incident - who is running, who is waiting for a lock, which transaction is stuck.
- For MySQL: Performance Schema / sys schema, slow query log + pt-query-digest. AWS RDS: Performance Insights shows the "DB load" picture by statement and wait type.

### Process
1. Get the top 10-20 by total time.
2. For each: who calls it (APM), how many times, the actual plan, estimated vs actual rows.
3. Classify the cause: missing index / condition that defeats the index / stale statistics / N+1 / reading excess data / locks.
4. Fix, measure again with the same metric; record the result.

### In production
A marketplace DB ran at 85% CPU during peak hours; the team planned to upgrade the instance (about $2,000/month more). Top pg_stat_statements: a cart-count query took 3 ms but ran 1.8 million times/hour (37% of total DB time) - APM showed every page header called it; the second was an order-list query with a Seq Scan. Caching the cart count for 30 seconds in Redis and adding a composite index for the second query brought peak CPU down to 40%, with no upgrade needed.

### Interview answer
"I do not guess which query is slow, I measure. I use pg_stat_statements to get the top statements by total DB time, because a query that takes a few milliseconds but runs millions of times often costs more than a query that takes a few seconds but runs rarely. For the top ones, I get the actual plan with auto_explain on production or EXPLAIN ANALYZE with BUFFERS on a replica, and I use APM traces to learn which API calls it and how many times per request, because that is how you reveal N+1. The slow query log gives me real parameters to reproduce. Then I classify the cause, fix it, and measure again with the same metric. I snapshot the top pg_stat_statements periodically to compare before and after each release and catch queries that just got worse."

> Senior tip: add a release checklist item: compare the top 20 pg_stat_statements before and one day after deploy. It is the cheapest way to catch a new ORM query that accidentally scans a whole table before it becomes an incident.`,
    follow: [
      'Why can a query that is fast on staging be slow on production?',
      'What performance impact does auto_explain with log_analyze enabled have?',
      'What extra information does Performance Insights on RDS give you?'
    ]
  },
  'db-049': {
    q: 'You have 60 Spring Boot pods, each with a pool of 20 connections, but PostgreSQL can only handle about 300 connections. How do you use PgBouncer or RDS Proxy, and which features are affected in transaction pooling mode?',
    a: `**Summary:** 60 * 20 = 1,200 potential connections while each PostgreSQL connection is **a process** that consumes RAM and context-switch CPU. Put a **connection pooler** (PgBouncer, RDS Proxy) between the application and the DB: the application opens many "cheap" connections to the pooler, and the pooler uses **few real connections** to the DB. In **transaction pooling** mode, a DB connection belongs to a client for only **one transaction**, so features tied to the **session** are affected: {{SET}} without LOCAL, session-level advisory locks, {{LISTEN/NOTIFY}}, temp tables across multiple transactions, and prepared statements (depending on the pooler version).

### The three PgBouncer modes
| Mode | A DB connection is bound to the client for | Savings | Compatibility |
|---|---|---|---|
| session | The whole session | Low | Full |
| transaction | One transaction | High | Loses session-level features |
| statement | One statement | Highest | Cannot run multi-statement transactions |
In practice almost everyone uses **transaction**.

### What to change in a Java application
- Session-level {{SET search_path}}, {{SET statement_timeout}} -> use {{SET LOCAL}} inside a transaction, or set them at the role/database level ({{ALTER ROLE app SET statement_timeout = '5s'}}).
- Session-level advisory locks ({{pg_advisory_lock}}) -> use the transaction-level form ({{pg_advisory_xact_lock}}).
- Server-side prepared statements: the pgjdbc driver switches to server-side prepared after a few executions ({{prepareThreshold}}, default 5); with old PgBouncer you need {{prepareThreshold=0}}. PgBouncer 1.21+ supports prepared statements in transaction mode ({{max_prepared_statements}}) - check the version you run.
- Keep the application-side pool (HikariCP) but make it smaller; set {{maxLifetime}} shorter than the pooler's timeout.

### RDS Proxy
An AWS managed service: it pools connections, preserves connections across failover (reducing the time the application loses connectivity), and integrates with IAM/Secrets Manager - especially useful for **Lambda** (each invocation opens a connection). When a client uses session-level features, RDS Proxy **pins** the connection to that client -> you lose the pooling benefit; monitor the pinning metric.

### Sizing
- Real connections to the DB: start around **(core count * 2) + spindle count** from PostgreSQL community experience, then measure. More connections do not mean faster - past the saturation point latency rises.
- Leave {{max_connections}} room for admin, replication, and jobs.

### In production
After scaling to 60 pods for a promotion, PostgreSQL reported "too many connections" and RAM spiked (each backend uses a few MB, plus work_mem during queries). They added PgBouncer in transaction mode with 120 real connections and Hikari at 10 per pod. Two bugs surfaced during the switch: a job used {{pg_advisory_lock}} (session-level) and the lock "leaked" to another client - switched to {{pg_advisory_xact_lock}}; a service set {{SET statement_timeout}} when borrowing a connection - switched to role-level configuration. Result: p99 dropped 30% because the DB was no longer overloaded with processes, and there were no more connection errors during scale-up.

### Interview answer
"Each PostgreSQL connection is a process, so 60 pods times 20 connections is far beyond what the DB can handle. I put a connection pooler such as PgBouncer or RDS Proxy in between: the application opens connections to the pooler, and the pooler uses a small number of real connections to the DB, sized by measuring near the saturation point. I use transaction pooling, which means a real connection belongs to a client for only one transaction, so I must drop session-level features: replace plain SET with SET LOCAL or role-level config, switch session advisory locks to transaction-level, keep LISTEN/NOTIFY on a separate path, and configure prepared statements according to the PgBouncer and driver versions. For Lambda or when I need fast failover on AWS, RDS Proxy is the natural choice, but I monitor pinning."

> Senior tip: before enabling transaction pooling, grep the whole codebase for {{SET }}, {{pg_advisory_lock}}, {{LISTEN}}, and {{TEMP TABLE}}. Every hit is a bug that will show up randomly after the switch - fixing them first is far cheaper.`,
    follow: [
      'Why is increasing max_connections not the solution?',
      'What is RDS Proxy pinning and how do you reduce it?',
      'How do you size the HikariCP pool when PgBouncer sits behind it?'
    ]
  }
});
