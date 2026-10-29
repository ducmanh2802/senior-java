/*
 * English translation of js/data/q-spring-data.js — task T376. Format: js/core/i18n.js (content overlay).
 * ids: db-032 db-033 db-034 db-035 db-036 db-037 db-038
 */
App.i18n.content({
  'db-032': {
    q: 'The {{orders}} table in MySQL InnoDB uses a {{CHAR(36)}} UUIDv4 as its PRIMARY KEY. As it scales to 200 million rows, insertions slow down and the buffer pool hit rate drops. Why does the ID type affect write performance in this way, and how would you choose between auto-increment, UUIDv4, UUIDv7/ULID, and Snowflake?',
    a: `**Summary:** In InnoDB, the PRIMARY KEY is the clustered index: data rows are stored in the leaf nodes of the B+tree, ordered by the PK. Sequential IDs cause inserts to append to the last page (sequential write, pages fill ~15/16). Random UUIDv4s cause inserts to land on arbitrary pages, leading to page splits, pages only filling between 1/2 and 15/16, and the need to keep all indexes in RAM. Furthermore, secondary indexes contain the PK, making them bloated by 36-byte PKs. Choose time-ordered IDs (BIGINT, UUIDv7, Snowflake) and store them in binary format.

### Step 1: How Clustered Indexes store data
InnoDB stores tables in **pages** (default {{innodb_page_size}} = 16KB). Pages are organized into a B+tree ordered by the PK:
~~~text
                [root: 1..5000 | 5001..10000 | ...]
               /                |                 \\
   [leaf: id 1..120]   [leaf: id 121..240]  ...  [leaf: id 9881..10000]  <- leaf nodes contain the full row
~~~
Each leaf node contains complete rows, ordered by PK, and has a pointer to the next leaf node. Secondary indexes (e.g., {{idx_customer}}) have leaf nodes containing {{(customer_id, PK)}}; to retrieve the full row, the DB uses the PK to look up the clustered index.

### Step 2: Sequential vs. Random inserts
- **Sequential IDs (AUTO_INCREMENT, UUIDv7, Snowflake):** Every new row has the largest key, so it always appends to the rightmost leaf. When the page is full, InnoDB opens a new leaf without moving old data. MySQL documentation indicates sequential inserts fill pages to ~15/16. Only a few "hot" pages need to stay in the buffer pool.
- **UUIDv4:** Random keys force new rows into arbitrary pages. When a page is full, a **page split** occurs: a new page is allocated, about half the rows are moved, and the parent page is updated. Result: pages are only 1/2 to 15/16 full, consuming more disk space; every insert touches a random leaf, so when indexes exceed the buffer pool size, almost every insert triggers a disk read.

For 200 million rows at 200 bytes per row, the clustered index is about 40GB. With a 16GB buffer pool: sequential IDs mean most inserts hit RAM; UUIDv4s mean random I/O for most inserts.

### Step 3: Secondary index size
Each secondary index entry contains a copy of the PK:
| PK Type | Bytes/entry for PK | 5 secondary indexes x 200 million rows |
|---|---|---|
| BIGINT | 8 | ~8GB |
| BINARY(16) (binary UUID) | 16 | ~16GB |
| CHAR(36) utf8mb4 | ≥ 36 | ≥ 36GB |

Larger indexes fit less into RAM, and queries require more page reads.

### Step 4: Comparison
| Type | Ordering | Size | Origin | Weakness |
|---|---|---|---|---|
| AUTO_INCREMENT BIGINT | sequential | 8B | DB | exposes ID count/guessable, hard to merge across DBs, can't get ID before insert |
| UUIDv4 | random | 16B | app | page split, random I/O as above |
| UUIDv7 (RFC 9562) / ULID | time-ordered | 16B | app | reveals creation time; still double BIGINT size |
| Snowflake (41 bit ms + 10 bit machine + 12 bit sequence) | time-ordered | 8B | app | requires unique worker ID, depends on system clock |

Recommendation: For a single DB, use BIGINT AUTO_INCREMENT or a sequence, and add a separate public ID column if necessary. If IDs must be generated in the app/multiple services, or for offline synchronization, use UUIDv7. For 64-bit and high throughput, use Snowflake.

~~~sql
-- MySQL: store UUID as 16 bytes instead of CHAR(36)
CREATE TABLE orders (
  id BINARY(16) PRIMARY KEY,          -- UUIDv7 generated from app
  customer_id BIGINT NOT NULL,
  KEY idx_customer (customer_id)
);
SELECT BIN_TO_UUID(id) FROM orders LIMIT 1;  -- convert back to string when debugging
~~~

### PostgreSQL note
PostgreSQL stores tables as heaps (rows not ordered by PK), so UUIDv4 only harms the **PK index**: random B-tree leaves, frequent page splits, and after every checkpoint, the first modification of a page requires writing the entire page to WAL (full-page write), significantly increasing WAL size. PostgreSQL has a native {{uuid}} (16 byte) type; from PostgreSQL 18, it has a native {{uuidv7()}} function.

### Pitfall production
- Changing CHAR(36) to BINARY(16) but forgetting foreign key columns in other tables: joining different types prevents index usage.
- Snowflake IDs > 2^53: return as string in JSON to avoid JavaScript precision issues.
- Using {{UUID_TO_BIN(uuid, 1)}} to "fix" UUIDv4: this flag only swaps the time parts of UUIDv1, UUIDv4 remains random.

> Senior tip: before concluding "UUID is slow", measure {{Innodb_buffer_pool_reads}} (disk reads due to misses) versus {{Innodb_buffer_pool_read_requests}} before and after a high-write period. I once saw a log table that reduced its index size by more than half just by switching from UUIDv4 to UUIDv7—no hardware upgrade needed.`,
    follow: ['Why can UUIDv7 still cause contention on the last page at very high write rates, and how does InnoDB handle this hotspot?', 'If you already have billions of UUIDv4 rows, how do you migrate to a new key without downtime?', 'How should public IDs (for external use) and internal PKs be designed?']
  },
  'db-033': {
    q: 'On MySQL InnoDB (REPEATABLE READ), two requests place an order for the same seat: {{SELECT ... WHERE seat_id = 15 FOR UPDATE}}, none found, then {{INSERT}}. Occasionally, one request fails with a 1213 Deadlock. Explain how gap locks / next-key locks cause this deadlock, how to read {{SHOW ENGINE INNODB STATUS}}, and how to fix it.',
    a: `**Summary:** In REPEATABLE READ, when a locking read looks for a non-existent key, InnoDB locks the **gap** around that position to prevent phantoms. Gap locks from two transactions do not conflict, so both can hold them; but INSERTs require an **insert intention lock**, which conflicts with the gap/next-key locks held by the other side. If both sides wait for each other, a deadlock occurs. Fix by inserting directly and catching the duplicate key error (based on the unique index), using READ COMMITTED, and always retrying.

### Step 1: InnoDB lock types
| Lock | Locks what | Meaning |
|---|---|---|
| Record lock | a single record in the index | locks existing row |
| Gap lock | space between two records | prevents insertion into that gap |
| Next-key lock | record + gap immediately before it | default for locking read/UPDATE/DELETE in RR |
| Insert intention | special gap lock requested by INSERT | conflicts with others' gap/next-key locks |

Gap locks "only prevent": two transactions can hold gap locks on the same interval. This is the crux.

### Step 2: Reproducing deadlock
Table {{booking}} has a unique index {{seat_id}}, with values 10 and 20.
~~~text
T1: SELECT * FROM booking WHERE seat_id = 15 FOR UPDATE;  -- 15 missing -> gap lock (10, 20)
T2: SELECT * FROM booking WHERE seat_id = 15 FOR UPDATE;  -- gap lock (10, 20), NOT blocked
T1: INSERT INTO booking(seat_id, ...) VALUES (15, ...);    -- requests insert intention, waits for T2's gap lock
T2: INSERT INTO booking(seat_id, ...) VALUES (15, ...);    -- waits for T1's gap lock -> circular wait
InnoDB detects the cycle and rolls back one side: ERROR 1213 (40001): Deadlock found ...
~~~
The "check if exists then insert" pattern is very common in Java and only reveals itself under concurrent load.

### Step 3: Reading SHOW ENGINE INNODB STATUS
Part of {{LATEST DETECTED DEADLOCK}} (simplified):
~~~text
*** (1) TRANSACTION:
TRANSACTION 5021, ACTIVE 3 sec inserting
*** (1) HOLDS THE LOCK(S):
RECORD LOCKS ... index uk_seat of table shop.booking trx id 5021 lock_mode X locks gap before rec
*** (1) WAITING FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS ... index uk_seat of table shop.booking trx id 5021 lock_mode X locks gap before rec insert intention waiting
*** (2) TRANSACTION:
TRANSACTION 5022, ACTIVE 2 sec inserting
*** (2) HOLDS THE LOCK(S):
... lock_mode X locks gap before rec
*** (2) WAITING FOR THIS LOCK TO BE GRANTED:
... lock_mode X locks gap before rec insert intention waiting
*** WE ROLL BACK TRANSACTION (2)
~~~
Interpretation: {{lock_mode X}} = next-key lock; {{locks rec but not gap}} = record lock; {{locks gap before rec}} = gap lock; {{insert intention waiting}} = INSERT waiting. Both sides hold gaps and wait for insert intentions: circular wait confirmed. This only shows the last deadlock; turn on {{innodb_print_all_deadlocks = ON}} to log all deadlocks. Current locks: {{performance_schema.data_locks}} (MySQL 8.0).

### Step 4: Solutions
1. **Let the unique index work:** remove SELECT FOR UPDATE, just INSERT; catch the duplicate key error (Spring translates this to {{DuplicateKeyException}}) and return "seat already booked".
2. **INSERT ... ON DUPLICATE KEY UPDATE / INSERT IGNORE** if the business logic is upsert.
3. **READ COMMITTED:** InnoDB disables gap locks for searches and index scans (still used for foreign key and duplicate key checks). Changing isolation requires re-verifying code relying on RR.
4. **Lock a parent record:** e.g., {{SELECT ... FROM show_time WHERE id = ? FOR UPDATE}} to serialize by showtime.
5. **Always retry** error 1213 (SQLSTATE 40001) a few times with backoff, outside the transaction.

### Pitfall production
- Range queries on columns without an index ({{UPDATE ... WHERE status = 'NEW'}}) in RR: InnoDB scans and locks next-key for **all scanned rows**, effectively locking the table.
- Locks on the final gap (after the largest value) are recorded as locks on "supremum": all inserts with IDs greater are blocked, common with auto-incrementing tables.
- Increasing {{innodb_lock_wait_timeout}} does not fix deadlocks: deadlocks are detected immediately, timeout only applies to normal lock waiting (error 1205).

> Interview notes: when reviewing code with "SELECT FOR UPDATE then INSERT if missing", I immediately ask "which unique index is protecting this?". In most cases, removing the SELECT and letting the constraint handle it fixes the deadlock and saves a round-trip.`,
    follow: ['Why does PostgreSQL not encounter this exact deadlock with the same code?', 'If switching to READ COMMITTED, what should the binlog format be?', 'When do next-key locks on a unique index collapse into record locks?']
  },
  'db-034': {
    q: 'On PostgreSQL default READ COMMITTED, Java code reads a balance, calculates in the app, then {{UPDATE account SET balance = :newBalance}}, and occasionally money is lost. When two transactions update the same row, how does PostgreSQL behave in READ COMMITTED, REPEATABLE READ, and SERIALIZABLE? How do you fix and retry this?',
    a: `**Summary:** In READ COMMITTED, an UPDATE encountering a row being modified by another transaction will **wait**, and after the other side commits, it **re-evaluates the WHERE condition on the new version** and continues updating. It does not re-check the value you previously read in the app, resulting in lost updates. Fix using atomic UPDATES ({{balance = balance - 100}}), row locking ({{FOR UPDATE}}), optimistic versioning, or higher isolation levels; the two higher levels report SQLSTATE 40001 and **require retrying the entire transaction**.

### Step 1: How lost update occurs
~~~text
T1: SELECT balance FROM account WHERE id = 1;   -- 1000
T2: SELECT balance FROM account WHERE id = 1;   -- 1000
T1: UPDATE account SET balance = 900 WHERE id = 1;   -- app calculated 1000 - 100
T2: UPDATE account SET balance = 700 WHERE id = 1;   -- waits for T1 (row lock)
T1: COMMIT
T2: continues, writes 700 -> COMMIT                       -- should have been 600
~~~
Row locking works: T2 indeed waits for T1. But the value 700 was calculated from the old 1000 in Java's RAM, so the DB cannot know.

### Step 2: How READ COMMITTED re-evaluates
According to PostgreSQL documentation, for UPDATE/DELETE/SELECT FOR UPDATE in READ COMMITTED:
1. Find rows satisfying WHERE according to the command's snapshot.
2. If a row is being modified by another transaction, wait for it to finish.
3. If rolled back: use old row. If committed: take the **latest version** of the row, re-run WHERE on it (PostgreSQL calls this EvalPlanQual). If it still satisfies, update based on the latest version; if not, or the row is deleted, skip it.

Therefore, this is safe even with concurrent execution:
~~~sql
-- atomic reduction: calculation based on the latest version
UPDATE account SET balance = balance - 100
WHERE id = 1 AND balance >= 100;   -- returning 0 rows means insufficient funds
~~~
Or lock before reading: {{SELECT balance FROM account WHERE id = 1 FOR UPDATE}} (T2 waits immediately at the read step and reads 900).

### Step 3: REPEATABLE READ and SERIALIZABLE
| Level | Two sides updating same row | Catch write skew (two sides updating two rows based on same read data)? |
|---|---|---|
| READ COMMITTED | waits, re-evaluates, no error | no |
| REPEATABLE READ | later one errors {{could not serialize access due to concurrent update}} | no |
| SERIALIZABLE (SSI) | same as RR | yes: errors {{could not serialize access due to read/write dependencies among transactions}} |

SERIALIZABLE in PostgreSQL uses **SSI**: records what was read (SIRead locks, which don't block), detects dangerous read/write dependencies between concurrent transactions, and cancels one side. Example: the classic write skew: "at least 1 doctor on call"; two doctors both read "currently 2 on call", both request time off, updating two different rows, so RR doesn't detect it. SSI does. Trade-off: might report "extra" errors (false positives) and requires more retries.

### Step 4: Correct retrying in Spring
All SQLSTATE 40001 (and 40P01 deadlocks) must retry the **entire transaction** from the beginning, including SELECTs, because previous data is stale.
~~~java
// retry is OUTSIDE @Transactional: each attempt is a new transaction
public void transfer(long from, long to, BigDecimal amt) {
    for (int attempt = 1; ; attempt++) {
        try {
            txService.transferInTx(from, to, amt); // @Transactional(isolation = SERIALIZABLE)
            return;
        } catch (ConcurrencyFailureException e) {   // Spring translates 40001/40P01 to this group
            if (attempt == 3) throw e;
            sleepWithJitter(attempt);               // random backoff to avoid re-collision
        }
    }
}
~~~

### Pitfall production
- Retrying **inside** a {{@Transactional}} method: the transaction is already marked for rollback, so retry is useless.
- Sending emails/external APIs in a retryable transaction: retry sends it twice. Move side effects after commit (outbox).
- Enabling SERIALIZABLE for the entire app: long transactions increase error rates; use only for business logic needing complex invariants, and keep transactions short.

> Interview notes: for money-related business logic, I prefer "UPDATE with condition + checking affected rows" because it works at all isolation levels and requires no retries. SERIALIZABLE is reserved for invariants spanning multiple rows; when enabled, monitor the 40001 error rate over total transactions and alert if it exceeds a few percent.`,
    follow: ['How is optimistic locking with a version column different from UPDATE with condition?', 'Why can a read-only transaction use SERIALIZABLE READ ONLY DEFERRABLE without ever being cancelled?', 'How does MySQL InnoDB in REPEATABLE READ handle this same scenario?']
  },
  'db-035': {
    q: 'PostgreSQL primary disk is filling up even though data is not growing; the {{pg_wal}} directory takes 400GB. The team used Debezium (CDC) but shut the connector down last week. How does WAL work, why do replication slots keep WAL, and how do you handle and prevent this?',
    a: `**Summary:** All changes are written to WAL before the data file; after a checkpoint, old WAL segments are deleted/reused, **unless** someone still needs them. A replication slot is a promise to "keep WAL until the consumer confirms reading it". If the consumer dies (Debezium shut down, replica removed) but the slot remains, WAL accumulates indefinitely until the disk fills and the primary shuts down. Fix: find inactive slots and drop them; prevent: set {{max_slot_wal_keep_size}} and alert based on retained WAL size.

### Step 1: What is WAL and why is it needed
~~~text
UPDATE -> (1) write record to WAL buffer -> (2) COMMIT: flush WAL to disk (fsync)
       -> (3) modified data page in shared_buffers, written to file later
       -> (4) CHECKPOINT: push all dirty pages to disk
       -> WAL before checkpoint is no longer needed for crash recovery -> segment (16MB) reused/deleted
~~~
Thanks to WAL, commit only needs sequential writes to one log file instead of random writes to multiple pages; on crash, replay WAL from the last checkpoint. Replica (streaming replication) and CDC (logical decoding) are just "WAL readers".

### Step 2: How replication slots hold WAL
Without a slot, primary deletes WAL based on age/size, so a slow replica might lose required WAL and need rebuilding. Slots fix this: primary remembers the {{restart_lsn}} position of each consumer and **does not delete WAL after that position**. Price: if the consumer disappears, the slot keeps the WAL. Example: system generates 60GB WAL/day, connector down for 7 days, ~400GB WAL held.

### Step 3: Diagnosis
~~~sql
SELECT slot_name, slot_type, active, wal_status,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained_wal
FROM pg_replication_slots
ORDER BY pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) DESC;
-- slot active = false and large retained_wal is the culprit
~~~
Other causes of WAL retention, check these too:
| Cause | Signs |
|---|---|
| Inactive slot / slow consumer | {{pg_replication_slots}} above |
| {{archive_command}} failing | {{pg_stat_archiver.failed_count}} increasing, {{.ready}} files piling up in {{pg_wal/archive_status}} |
| {{wal_keep_size}} set too high | configuration |
| Very heavy writing between checkpoints | {{max_wal_size}} is only a soft limit |

### Step 4: Resolution
1. Confirm the slot is no longer needed (Debezium really gone? Any live replica?).
2. {{SELECT pg_drop_replication_slot('debezium_orders');}} WAL will be cleaned at the next checkpoint.
3. If CDC is still needed: rebuild the connector, accept re-snapshotting data because WAL was lost.
4. **Never** manually delete files in {{pg_wal}}: it corrupts the cluster.

### Prevention
- {{max_slot_wal_keep_size}} (PostgreSQL 13+, default -1 i.e., unlimited): if exceeded, slot is marked {{wal_status = 'lost'}}; CDC/replica lost but primary survives. Choose a threshold smaller than free disk space with a safety margin.
- Alerts on {{retained_wal}} and {{active = false}} duration. On Amazon RDS: {{OldestReplicationSlotLag}} and {{TransactionLogsDiskUsage}} metrics.
- Deleting CDC/replica procedures must include a step to drop the slot.
- Logical slots hold {{catalog_xmin}}: VACUUM cannot clean system tables; physical slots with {{hot_standby_feedback = on}} hold xmin causing user table bloat. Forgotten slots fill disk and cause bloat.

### Connection to replica lag
Replica using a slot won't lose WAL, but high replica lag means primary holds more WAL. Monitor {{pg_stat_replication}} ({{write_lag}}, {{flush_lag}}, {{replay_lag}}) alongside held WAL size.

> Interview notes: I treat "retained WAL > 20% free space" as a page alert, not email. Incidents with full disks due to forgotten slots are very common after CDC PoCs; the cheapest fix is setting {{max_slot_wal_keep_size}} the moment you create the cluster.`,
    follow: ['What is the trade-off of setting max_slot_wal_keep_size for Debezium?', 'How do synchronous_commit and synchronous_standby_names affect commit latency?', 'Why can long queries on hot standby be cancelled, and what does hot_standby_feedback solve in exchange?']
  },
  'db-036': {
    q: 'You run {{ALTER TABLE orders ADD COLUMN note VARCHAR(255)}} (online DDL, ALGORITHM=INSTANT) on MySQL 8 at 10 AM. The command hangs, and within seconds all {{orders}} table read/write APIs hang, connection pool exhausted. What happened, how to save the situation, and what timeout should you set to prevent recurrence?',
    a: `**Summary:** A long-running transaction (often a "Sleep" session that forgot to commit) is holding a shared **metadata lock (MDL)** on the table. ALTER TABLE, even INSTANT, requires an exclusive MDL for a moment, so it waits; and because the exclusive request is queued, **all new statements on the table queue behind it**. Save: find and KILL the session holding the transaction (or cancel ALTER). Prevent: short {{lock_wait_timeout}} for DDL sessions, alert long transactions, timeouts at app and DB layers.

### Step 1: What is a metadata lock
MDLs protect the table **structure** (not data). All statements touching a table, even simple SELECTs, take shared MDLs; crucially, MDLs are held **until the transaction ends**, not just until the statement finishes. DDLs need exclusive MDLs.
~~~text
10:00:00  session 41: BEGIN; SELECT * FROM orders WHERE id = 1;   -- holds shared MDL, then "Sleep" not committed
10:00:05  session 77: ALTER TABLE orders ...                        -- waits for exclusive MDL
10:00:06  session 80..300 (API): SELECT/INSERT orders               -- queues AFTER exclusive request
          -> SHOW PROCESSLIST: "Waiting for table metadata lock" hundreds of lines, Hikari reports timeout
~~~
The queue lock is fair in order: it does not allow new shared locks to "jump" ahead of a queued exclusive request (to prevent DDL starvation). Thus, one uncommitted transaction + one DDL is enough to hang the table.

### Step 2: Saving the situation
1. Fastest: cancel ALTER ({{KILL 77}}), queue clears immediately, APIs live.
2. Find the session holding the lock:
~~~sql
-- MySQL 8: sys schema shows blocking/blocked
SELECT waiting_pid, blocking_pid, sql_kill_blocking_connection
FROM sys.schema_table_lock_waits WHERE object_name = 'orders';
-- longest running transaction
SELECT trx_mysql_thread_id, trx_started, trx_state
FROM information_schema.innodb_trx ORDER BY trx_started LIMIT 5;
~~~
3. {{KILL QUERY 41}} is useless here: it only cancels the **currently running statement**, but session 41 is Sleep, no statement running. Must {{KILL 41}} (i.e., KILL CONNECTION): closes connection and rolls back the transaction, releasing all locks.
4. Large rolled-back transactions can take minutes (status killed/rolling back): don't restart MySQL to "speed it up", recovery on startup rolls back just the same.

| Command | MySQL | PostgreSQL |
|---|---|---|
| Cancel statement, keep session | {{KILL QUERY id}} | {{pg_cancel_backend(pid)}} |
| Close session, rollback transaction | {{KILL id}} | {{pg_terminate_backend(pid)}} |

### Step 3: What else do long transactions cause
- InnoDB cannot purge undo logs older than the oldest open read view: {{History list length}} in {{SHOW ENGINE INNODB STATUS}} increases, queries slow down traversing more versions.
- PostgreSQL: VACUUM cannot clean dead tuples, table bloat; ALTER TABLE takes ACCESS EXCLUSIVE and causes the same queuing phenomenon as MySQL.
- Holding row locks: other requests wait until {{innodb_lock_wait_timeout}} (default 50 seconds).

Common Java sources: {{@Transactional}} wrapping slow HTTP calls; connection leaked from pool; user opened SQL tool in manual commit mode then went to a meeting.

### Step 4: Recommended timeouts
| Where | Parameter | Suggestion |
|---|---|---|
| DDL Session (MySQL) | {{SET SESSION lock_wait_timeout = 5}} | default is 31536000 seconds (1 year) |
| DDL Session (PostgreSQL) | {{SET lock_timeout = '3s'}} | fail fast and retry instead of blocking table |
| PostgreSQL Global | {{idle_in_transaction_session_timeout}}, {{statement_timeout}}, {{transaction_timeout}} (PG 17+) | e.g., 60s / 30s for app user |
| MySQL | {{max_execution_time}} (SELECT only, ms), {{wait_timeout}} for idle sessions | |
| App | Hikari {{leakDetectionThreshold}}, Spring transaction timeout | detect code holding connections too long |

~~~sql
-- safe DDL workflow: wait max 5s for lock, fail then retry
SET SESSION lock_wait_timeout = 5;
ALTER TABLE orders ADD COLUMN note VARCHAR(255), ALGORITHM=INSTANT;
~~~

### Pitfall production
- Believing "INSTANT/online DDL means no locking": copy/rebuild doesn't lock, but start and end still need exclusive MDL.
- Blindly killing batch job sessions: rollback is slow and might cause business logic errors; always check {{trx_started}}, {{trx_rows_modified}} before killing.
- Setting DB timeout without retry in migration scripts: random deployment failures. DDL scripts must have a retry loop with backoff.

> Interview notes: my checklist before every DDL on production: (1) check {{information_schema.innodb_trx}} for transactions open longer than 60s, (2) set {{lock_wait_timeout}}/{{lock_timeout}} to a few seconds, (3) run off-peak with someone on call. These three steps take 2 minutes and have saved my team from many "1-second DDL killed APIs for 10 minutes" incidents.`,
    follow: ['At what level does gh-ost avoid the MDL problem, and what lock does its cut-over step still need?', 'How to automatically detect long-running transactions and alert before an incident?', 'In PostgreSQL, does adding a column with DEFAULT rewrite the table, and when does it?']
  },
  'db-037': {
    q: 'The "recent orders" screen runs {{SELECT ... FROM orders WHERE customer_id = ? AND status = ? ORDER BY created_at DESC LIMIT 20}} taking 800ms despite an index on {{customer_id}}. How do you design the index for queries with ORDER BY + LIMIT, how does column order matter, and how to verify using EXPLAIN?',
    a: `**Summary:** An index on only {{customer_id}} helps find the correct customer, but the DB still has to read **all** orders for that customer, filter by status, then **sort** to get the top 20. A composite index {{(customer_id, status, created_at)}} puts equality columns first, sorting column last, so the DB goes straight to the correct segment already ordered, reads 20 entries, and stops. Rule: **equal (=) first, sort last, range last**.

### Step 1: Why a single-column index is not enough
Assume a VIP customer has 50,000 orders. With index {{(customer_id)}}:
~~~text
1. Search in index: 50,000 entries for customer 42
2. For each entry, read row from table to check status   -> 50,000 random I/O reads
3. 12,000 rows match status -> SORT by created_at
4. Take top 20 rows
~~~
Steps 2 and 3 are where the 800ms is lost. LIMIT 20 doesn't help because sort must finish to know which 20 are newest.

### Step 2: Composite index, B-tree ordered by multiple columns
Index {{(customer_id, status, created_at)}} orders by customer_id, within customer by status, then by created_at:
~~~text
(42, 'NEW',  2024-01-01) (42, 'NEW', 2024-03-05) ... (42, 'PAID', 2023-12-30) (42, 'PAID', 2024-02-11) ...
                                                     |<------- segment customer=42, status=PAID: already ordered by created_at ------->|
~~~
The first two columns are equality comparisons, so the matching segment is contiguous, and within that segment created_at **is already ordered**. The DB jumps to the end of the segment, reads 20 entries backwards, and is done. No sorting step; cost is almost independent of how many orders the customer has. B-tree can be read backwards, so DESC is not strictly needed in the index definition for single-direction sorting.

### Step 3: Leftmost prefix and column order
Index {{(a, b, c)}} is effective for conditions on {{a}}, {{a, b}}, {{a, b, c}}; conditions only on {{b}} are usually not effective (MySQL 8.0.13+ and PostgreSQL 18 have skip scan, but only beneficial when the first column has low cardinality).
| Query | Best Index | Reason |
|---|---|---|
| {{customer_id = ? AND status = ? ORDER BY created_at}} | {{(customer_id, status, created_at)}} | equal, equal, sort |
| {{customer_id = ? AND created_at > ? ORDER BY created_at}} | {{(customer_id, created_at)}} | range matches sort column: still ordered |
| {{customer_id IN (...) ORDER BY created_at}} | hard to avoid sort | multiple segments, each with its own order |
| {{created_at > ? AND customer_id = ?}} | {{(customer_id, created_at)}} | equal column must precede range column |

Placing the range column before the sort column (e.g., {{(customer_id, total, created_at)}} with {{total > 100}}) loses ordering after the range, and the DB must sort again.

### Step 4: Verify with EXPLAIN
PostgreSQL, before and after:
~~~text
-- before
Limit -> Sort (Sort Method: top-N heapsort) -> Bitmap Heap Scan on orders
           Recheck Cond: (customer_id = 42)  Filter: (status = 'PAID')  Rows Removed by Filter: 38000
-- after
Limit (actual rows=20) -> Index Scan Backward using idx_cust_status_created on orders
~~~
MySQL: before had {{Using filesort}} in the Extra column; after is {{Backward index scan}}, no more filesort. If the index also covers all columns SELECT needs (covering index, or {{INCLUDE}} in PostgreSQL) then Extra shows {{Using index}} / plan is Index Only Scan, no table read.

### Pitfall production
- **LIMIT trap with ordered indexes:** query {{WHERE status = 'FRAUD' ORDER BY created_at DESC LIMIT 20}} only has index {{(created_at)}}. Planner thinks "read backwards by time, will soon find 20 FRAUD rows", but FRAUD is rare so it scans millions of entries. Fix with index {{(status, created_at)}} or partial index.
- Adding a new composite index while forgetting the old {{(customer_id)}} index is now redundant (a prefix of the new index): wasted write/RAM overhead.
- Mixed-direction ORDER BY ({{a ASC, b DESC}}) requires index definition matching direction (MySQL 8 and PostgreSQL support DESC indexes).

> Interview notes: when I receive a slow query, I write down the three groups of columns: equality comparison, sort, and range, then build the index in that order, and only then look at EXPLAIN. With a list screen using LIMIT, the goal is a plan with no Sort node and the number of rows read roughly equal to LIMIT.`,
    follow: ['Does the index still help for page 500 of this screen?', 'How does Index Only Scan depend on the visibility map?', 'When should partial indexes be used instead of adding status to the index?']
  },
  'db-038': {
    q: 'A sync job needs to write 2 million product price updates each night (update existing rows if they exist) and is taking 3 hours using a loop with {{save()}} for each row. How do you speed this up at the JDBC/SQL level: batch, multi-row insert, COPY, upsert {{ON CONFLICT}} / {{ON DUPLICATE KEY UPDATE}}, and what pitfalls should you know?',
    a: `**Summary:** Most time is lost to **network round-trips and committing each row**, not in the writing itself. Group into batches (JDBC {{addBatch}}), enable driver rewriting to multi-row insert ({{reWriteBatchedInserts}} for PostgreSQL, {{rewriteBatchedStatements}} for MySQL), commit in batches of a few thousand, and use upserts one command at a time instead of "SELECT then INSERT/UPDATE". For massive raw loading, {{COPY}} (PostgreSQL) is fastest.

### Step 1: Where does time go
Each {{save()}} in a loop usually involves: SELECT check-existence, then INSERT or UPDATE, each statement a round-trip; if each row is one transaction, fsyncing WAL/redo log per commit.
~~~text
2,000,000 rows x 2 statements x 1ms round-trip  = 4,000 seconds (~67 minutes) just waiting on network
+ 2,000,000 commits x ~1-2ms fsync        = another 30-60 minutes
~~~
Same data, batch 1,000 rows/round-trip and commit every 5,000 rows reduces network waiting and fsyncing thousands of times; the remainder is mostly data write/index update cost.

### Step 2: JDBC batch + let driver rewrite
~~~java
String sql = "INSERT INTO product_price(sku, price, updated_at) VALUES (?, ?, now()) "
           + "ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price, updated_at = now() "
           + "WHERE product_price.price IS DISTINCT FROM EXCLUDED.price"; // skip unchanged
try (PreparedStatement ps = conn.prepareStatement(sql)) {
    conn.setAutoCommit(false);
    int n = 0;
    for (PriceRow r : rows) {
        ps.setString(1, r.sku()); ps.setBigDecimal(2, r.price());
        ps.addBatch();
        if (++n % 1000 == 0) ps.executeBatch();   // 1 round-trip for 1000 rows
        if (n % 5000 == 0) conn.commit();         // transaction reasonable, don't hold locks too long
    }
    ps.executeBatch(); conn.commit();
}
~~~
JDBC URL: PostgreSQL add {{reWriteBatchedInserts=true}}, MySQL Connector/J add {{rewriteBatchedStatements=true}}. Without this flag, the driver still sends each INSERT separately (even if inside one execution); with it, it merges into {{INSERT ... VALUES (...), (...), ...}}, the server parses/executes fewer commands. If using Hibernate: ID {{IDENTITY}} turns off batch insert, so use sequence (see question on JPA batching).

### Step 3: Upsert differences between DBs
| | PostgreSQL {{ON CONFLICT}} | MySQL {{ON DUPLICATE KEY UPDATE}} |
|---|---|---|
| Identify duplicates | explicit column/constraint | any unique key (multiple unique keys make it unpredictable which row is modified) |
| Reference new value | {{EXCLUDED.col}} | row alias: {{VALUES (...) AS new ... col = new.col}} (8.0.19+); {{VALUES(col)}} deprecated |
| Result count | number of rows inserted + updated | 1 = insert, 2 = update, 0 = no change |
| Pitfall | one command cannot modify same row twice: error {{ON CONFLICT DO UPDATE command cannot affect row a second time}} | duplicates still "consume" an AUTO_INCREMENT value, ID gaps |

PostgreSQL pitfall above occurs when a multi-row insert contains two rows with the same SKU: deduplicate in the batch before sending.

### Step 4: COPY for raw loading
~~~java
// PostgreSQL JDBC: stream CSV directly into temp table, then one upsert from temp table
CopyManager copy = conn.unwrap(PGConnection.class).getCopyAPI();
copy.copyIn("COPY price_staging (sku, price) FROM STDIN WITH (FORMAT csv)", csvReader);
// then: INSERT INTO product_price SELECT ... FROM price_staging ON CONFLICT (sku) DO UPDATE ...
~~~
COPY bypasses almost all per-statement costs. The MySQL equivalent is {{LOAD DATA LOCAL INFILE}} (server must enable {{local_infile}}, driver must enable {{allowLoadLocalInfile}}, consider security).

### Pitfall production
- Committing a 2 million row batch: huge transaction, holds locks, WAL/undo bloat, error on last row rolls back all night. Use batch of a few thousand + checkpoint to resume.
- Parallel bulk upsert from multiple workers with different lock order causes deadlock: sort rows by key (SKU) in each batch.
- Initial load into empty table with many indexes: creating indexes **after** loading is much faster than updating indexes per row.
- UPDATE of unchanged row still creates a new row version in PostgreSQL: filter with {{IS DISTINCT FROM}} as in example to reduce bloat and WAL.

> Interview notes: before optimizing, I print two numbers: round-trips and commits per 1,000 rows. The sync job of a retail system I handled dropped from several hours to under 10 minutes just by batching + rewriting + upserting, no architecture changes needed.`,
    follow: ['When batch fails midway, how to know which row failed and run the rest?', 'How to split data for parallel bulk upsert from multiple workers to avoid deadlock?', 'Why does GenerationType.IDENTITY disable Hibernate batch insert?']
  }
});

