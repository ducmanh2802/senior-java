/*
 * English translation of js/data/q-scenario.js — task T202. Format: js/core/i18n.js (content overlay).
 * ids: scenario-001 scenario-002 scenario-003 scenario-004 scenario-005 scenario-006 scenario-007 scenario-008 scenario-009 scenario-010 scenario-011 scenario-012 scenario-013 scenario-014
 */
App.i18n.content({
  'scenario-001': {
    q: 'Your API list is running at 5 seconds. A trace shows the cause is a slow query on a 50-million-row table. How do you handle it, step by step?',
    a: `**Summary:** measure before fixing — run {{EXPLAIN (ANALYZE)}} on the real plan to identify the slow step type (Seq Scan on 50 million rows, Sort spill to disk, nested loop multiplying rows), then fix the root cause; many cases are solved by the right index or query rewrite, but confirm with the plan and real workload.

### Clarify requirements
- What endpoint and filter/sort columns? Which filter combination is used most? Is a total count needed for pagination?
- What is the target SLA (p95 under 300ms)? Which DB (PostgreSQL/MySQL/Oracle) and can an index be created online?
- Is it slow for all filter combinations or only some? Any recent changes (new deploy, data growth, stale statistics, DB upgrade)?

### Investigate / Analyze
- Enable {{pg_stat_statements}} / slow query log to identify the exact query, frequency, and time distribution; check APM trace to confirm time is in DB, not in the Java layer (mapping, N+1).
- Run {{EXPLAIN (ANALYZE, BUFFERS)}} on production-like data: see which plan step is expensive — {{Seq Scan}} with large {{Rows Removed by Filter}} means the index does not match the condition; {{Sort}} node consuming much memory/disk means losing the index sort benefit.
- Check if statistics have been {{ANALYZE}} recently (stale stats cause the planner to choose the wrong plan), cache hit ratio, I/O wait.

### Solution
- **Fastest, most correct:** create the right composite index — equality filter columns first, sort column after:
~~~sql
-- SELECT ... WHERE tenant_id = ? AND status = 'ACTIVE' ORDER BY created_at DESC LIMIT 20
CREATE INDEX CONCURRENTLY idx_txn_tenant_status_time
  ON transactions (tenant_id, status, created_at DESC);
~~~
- Rewrite query: drop {{SELECT *}}, avoid wrapping functions around columns in WHERE ({{WHERE DATE(created_at) = ...}} makes the index useless), replace nested subqueries with JOIN.
- Only add cache (Redis with short TTL) after the query is optimized — cache hides symptoms but does not cure the disease.
- More sustainable: partition by time for fast-growing data, point read replicas for heavy lists.

### Trade-off & pitfall
- Each index slows writes and increases size; do not index every filter combination users think of — choose the 3–5 dominant traffic combinations.
- Wrong column order in a composite index makes it useless for this query even with the same columns.
- Plan on test environments differs from production (data shape, statistics); always verify with the slow query log after deploy.

> Senior tip: I once reduced a transaction list API from 8s to 120ms on a 60-million-row table with just one index (tenant_id, status, created_at DESC); before that the whole team had discussed switching to Elasticsearch. The right index is still the cheapest and safest solution — consider cache/replica only after the index is optimized.`,
    follow: [
      'How does creating an online index on this table affect write throughput and how do you measure it?',
      'If the query is still 2s after optimization because the table has grown to 500 million rows, what is your next direction?',
      'How do you detect a slow query early before users complain?'
    ],
  },
  'scenario-002': {
    q: 'Page 10,000 loads very slowly, each request uses {{OFFSET}} 300,000 rows. How do you handle it?',
    a: `**Summary:** large {{OFFSET}} forces the DB to read and discard all previous rows, so it gets slower toward the end — switch to keyset pagination ({{WHERE id < :last_id ORDER BY id DESC LIMIT 20}}), with a matching index, so each page needs O(log n + pageSize) instead of O(offset + pageSize).

### Clarify requirements
- Does the user need to jump to any page, or mainly scroll next (infinite scroll / Next button)?
- Which column is sorted? Is it guaranteed unique (many rows with the same created_at — what then)?
- What is the maximum total row count per filter?

### Investigate / Analyze
- Test {{OFFSET 300000 LIMIT 20}} with {{EXPLAIN (ANALYZE)}}: see the DB return 300,020 rows then discard — cost grows linearly with page number.
- If the query is also sorting the full set ({{Sort}} node), both ends suffer at once.
- Measure {{Rows Removed}} / scanned rows to quantify the OFFSET damage.

### Solution
- Switch to keyset pagination, using a unique key + stable sort:
~~~sql
-- first page: SELECT id, ... FROM t ORDER BY id DESC LIMIT 20
-- next page: WHERE id < :last_id ORDER BY id DESC LIMIT 20
-- sort by (created_at, id): WHERE (created_at, id) < (:last_ts, :last_id)
CREATE INDEX idx_t_order ON t (created_at DESC, id DESC);
~~~
- If showing total page count is mandatory: count once per filter and cache with a short TTL, accepting a small error instead of {{COUNT(*)}} on every request.
- For old UI (numbered pages): show only a nearby page window, replace far-jump buttons with additional filter buttons.

### Trade-off & pitfall
- Keyset does not allow arbitrary page jumps (only Next/Prev) — decide UX before changing.
- The key column must be unique; otherwise rows may be lost or duplicated when sort is unstable.
- Data inserted between two page fetches may cause duplication or omissions — acceptable in timeline-style feeds.

> Senior tip: all modern feeds (Twitter, Facebook News Feed) use cursors, not OFFSET. On a 200-million-row table, I reduced the last page from 4s to 15ms just by switching to a cursor — and it is a very cheap change, worth doing before thinking about cache.`,
    follow: [
      'How do you design a cursor for keyset pagination when sorting by a non-unique column like created_at?',
      'How do you return an accurate total count without running COUNT(*) on the full table every time?'
    ],
  },
  'scenario-003': {
    q: 'You need to add a column and an index to a 200-million-row production table. How do you do it with zero downtime?',
    a: `**Summary:** classify DDL first — metadata-only changes (instant) vs table-rebuild changes (hours, long locks). PostgreSQL: {{ADD COLUMN}} with a constant default is metadata-only, index uses {{CREATE INDEX CONCURRENTLY}}; MySQL 8: {{ALGORITHM=INSTANT/INPLACE}}; always backfill data in small batches with checkpoints so it can be rerun.

### Clarify requirements
- Specific DDL: add nullable column, NOT NULL with default, or unique index? One-time migration or for a new feature?
- DB engine and version (determines safe command list), write QPS on the table, when is the low-traffic window?
- Are {{gh-ost}} / {{pt-online-schema-change}} available, tested on staging?

### Investigate / Analyze
- PostgreSQL 11+: {{ADD COLUMN}} with a constant (non-volatile) default is instant metadata-only; a volatile default forces a full table rewrite. Adding {{NOT NULL}} to an existing column: PG 12+ allows {{CHECK (col IS NOT NULL) NOT VALID}} then {{VALIDATE CONSTRAINT}} (light lock) before {{SET NOT NULL}}.
- MySQL 8.0: {{ADD COLUMN}} supports {{ALGORITHM=INSTANT}}, {{ADD INDEX}} is {{INPLACE}} (allows concurrent DML but uses heavy I/O); before 5.6 must rebuild or use gh-ost.
- Classic pitfall: DDL must wait for long-running queries to release the Metadata lock; while waiting it blocks all queries behind — a 300ms query can freeze the whole table for minutes.

### Solution
- Step 1: set a short {{lock_timeout}} and retry loop, so DDL does not sit holding a lock:
~~~sql
SET lock_timeout = '3s';
ALTER TABLE orders ADD COLUMN source varchar(16);   -- metadata-only on PG 11+
CREATE INDEX CONCURRENTLY idx_orders_source ON orders (source);
~~~
- Step 2 (older MySQL or heavy rebuild): gh-ost / pt-online-schema-change — copy in chunks, catch up via binlog, atomic swap at the end.
- Step 3: backfill column values (if needed) with a job of 1,000–10,000 rows per run, sleep between batches so replication lag does not spike; save a checkpoint by PK so reruns do not overlap.
- Step 4: unique index — check for duplicates first; if {{CREATE INDEX CONCURRENTLY}} fails, drop the INVALID index and recreate it.

### Trade-off & pitfall
- {{CREATE INDEX CONCURRENTLY}} cannot run inside a transaction; interrupted mid-run it leaves an INVALID index — check {{pg_index.indisvalid}}.
- Large UPDATE backfill inflates WAL/binlog and increases replication lag — monitor lag and pause when it exceeds the threshold.
- With tables that have many FKs or child tables, locks may propagate — evaluate parent tables first.

> Senior tip: my rule before any DDL on a large table is short {{SET lock_timeout}} + retry loop; just one 300ms query is enough to make DDL wait, and DDL waiting will freeze the whole queue behind it. I once saw {{ALTER TABLE ADD COLUMN}} at peak time (missing lock_timeout) freeze the system for minutes.`,
    follow: [
      'List the steps to add a NOT NULL constraint to an existing column on a 200-million-row PostgreSQL table?',
      'How does gh-ost work and when do you choose it over MySQL online DDL?'
    ],
  },
  'scenario-004': {
    q: 'End-of-day reports run on the main DB and slow down transaction APIs. How do you handle it?',
    a: `**Summary:** separate workloads — OLTP and reports on one DB always contend for CPU, buffer cache, and I/O. Short term: point reports to a read replica. Medium term: pre-aggregate with materialized views. Long term: CDC to a data warehouse / OLAP, keeping OLTP pure.

### Clarify requirements
- How long does the report run each time, how many rows does it scan, is there a fixed time window? Does the user choose filters freely (ad-hoc)?
- How stale can the report data be (15 minutes, 1 hour, 1 day)? What is the API SLA being affected?
- Does the budget allow adding a replica/warehouse?

### Investigate / Analyze
- Identify the pattern: which tables does the report scan, how many JOINs, large GROUP BY, any ORDER BY?
- Measure during the report window: CPU, I/O, buffer cache hit drops (seq scan on a 10GB table pushes out hot cache), replication lag.
- Check whether the report can overlap (multiple instances trigger at once).

### Solution
- **Quick:** point report queries to a read replica; set {{statement_timeout}} (e.g., 60s) to avoid zombie queries consuming resources.
- **Medium term:** pre-aggregate with a materialized view on a schedule, report queries read from the summary table:
~~~sql
CREATE MATERIALIZED VIEW daily_revenue AS
  SELECT date_trunc('day', paid_at) AS d, sum(amount) AS amt, count(*) AS n
  FROM payments GROUP BY 1;
CREATE UNIQUE INDEX ON daily_revenue (d);   -- required for REFRESH CONCURRENTLY
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_revenue;
~~~
- **Long term:** CDC (Debezium) → Kafka → warehouse (Snowflake/BigQuery/Redshift), or export Parquet to S3 + Athena; BI/report points there, OLTP stays pure.
- If multi-dimensional filtering needs low latency: consider ClickHouse / StarRocks as a more affordable option than a large warehouse.

### Trade-off & pitfall
- A read replica in the same cluster still shares hardware — load reduction is smaller than expected; use an independent replica and monitor lag.
- {{REFRESH ... CONCURRENTLY}} requires a unique index; refreshing a large table is itself heavy — schedule during low-traffic hours.
- A warehouse is additional complex infrastructure — open it only when the report is a confirmed bottleneck, not as a precaution.

> Senior tip: the "report slows API" symptom is usually buffer cache eviction — a 10GB seq scan pushes out hot cache. A 50-row materialized view (daily revenue) is enough for reports under 100ms, without an expensive warehouse.`,
    follow: [
      'How do you ensure no data loss between the legacy DB and the warehouse when using CDC?',
      'How often should a revenue report materialized view be refreshed?'
    ],
  },
  'scenario-005': {
    q: 'Deadlock errors appear at peak hours a few times every hour. How do you investigate and fix it?',
    a: `**Summary:** read the deadlock log before fixing — it prints both queries and the locked resources; the common cause is two flows updating the same rows in opposite order, or a transaction holding a lock while calling an HTTP service slowly. Fix the root cause with: synchronized lock order, shorter transactions, matching indexes, and app-level retry.

### Clarify requirements
- Which DB, which business flow (order, payment, inventory)? Is it confused with lock wait timeout (different)?
- Did the error appear after a specific deploy, or existed before and grew with traffic?
- Are there any transactions that call HTTP/Kafka while holding a lock?

### Investigate / Analyze
- Read the deadlock graph in the log: identify the two transactions, which queries, which locks held, which lines they are waiting on — often shows the signature "two tables updated in opposite order".
- Check indexes: missing index makes {{SELECT FOR UPDATE}} lock more rows than needed (gap lock / next-key lock with MySQL REPEATABLE READ).
- Observe {{innodb_lock_waits}} / {{pg_stat_activity}} to see which longest-running flow is holding locks.

### Solution
- Synchronize lock order: every flow always locks in the same order (e.g., always inventory before payment).
- Shorten transactions: compute and call outside where locks are not needed:
~~~sql
BEGIN;
  UPDATE inventory SET qty = qty - :take
    WHERE id = :id AND qty >= :take;   -- atomic, check rowsAffected
  UPDATE payment SET status = 'PAID' WHERE id = :pid AND status = 'PENDING';
COMMIT;
~~~
- Index that matches conditions so the lock hits the right rows; for consumer queues use {{SELECT ... FOR UPDATE SKIP LOCKED}}.
- App retries for deadlock (MySQL error 1213 / SQLSTATE 40001) 2–3 times, backoff 100–500ms + jitter.
- MySQL: consider {{READ COMMITTED}} instead of {{REPEATABLE READ}} to shrink the lock range.

### Trade-off & pitfall
- SKIP LOCKED speeds up but another consumer must handle skipped rows — design so no row is lost.
- Infinite retry on very hot conflicts increases CPU — set max attempts + alert.
- Do not rush to Serializable: it reduces concurrency heavily; fix lock order in code first.

> Senior tip: if the deadlock log shows a transaction holding a lock while calling HTTP, move the network call outside the transaction or use an outbox; add limited retry with backoff and jitter for retryable deadlock errors.`,
    follow: [
      'How do you distinguish deadlock from lock wait timeout and handle them differently?',
      'When do you choose Serializable isolation instead of fixing lock order with a higher cost?'
    ],
  },
  'scenario-006': {
    q: 'The API returns {{Connection is not available, request timed out after 30000ms}} at peak hours. What is the cause and how do you handle it?',
    a: `**Summary:** this HikariCP error means the pool is out of connections and the request had to wait until timeout — typical 4 causes: connection leak, transaction too long (calling HTTP inside the transaction), pool too small for the thread count, or a slow query blocking. Measure before increasing pool size.

### Clarify requirements
- Does the error appear gradually over time or spike with traffic?
- Any recent code/config changes (new endpoint, more threads, changed pool size)?
- Current pool size, max threads, does the DB have a connection limit?

### Investigate / Analyze
- Check Hikari metrics: {{active}}, {{idle}}, {{pending}}, {{connection-time}}, {{usage-time}}. Large {{pending}} → pool is the bottleneck.
- Enable {{leakDetectionThreshold = 60000}} to log the stack trace when a connection is not returned within 60s — distinguish leak from overload.
- Check {{pg_stat_activity}} / {{SHOW PROCESSLIST}} during peak: which query occupies the connection, how long each query runs.
- Code review {{@Transactional}} annotations: find transactions that wrap HTTP/Kafka/file IO — abnormally long connection hold times.

### Solution
- Fix leaks: try-with-resources, do not manually hold a connection without closing it, native queries return the connection correctly; every leak detection alert must fix the root cause.
- Shorten transactions: move HTTP/Kafka calls outside; write the outbox table inside the transaction, then send via a worker later.
- HikariCP suggests a starting heuristic {{connections = (core_count * 2) + effective_spindle_count}}; it is not a universal sizing formula — measure DB limits and connection hold time before finalizing the pool.
- Separate pools for batch/report vs OLTP so one source does not kill the others.
- Reduce {{connectionTimeout}} to 3–5s for fast fail, so the upper layer retries or queues instead of holding for 30s.

### Trade-off & pitfall
- Increasing pool size without reason overloads the DB and increases lock contention — more connections does not mean faster.
- {{maxLifetime}} must be shorter than the DB/proxy {{wait_timeout}} and LB/proxy idle timeout, otherwise dead pool connections cause strange errors.
- Not collecting Hikari metrics is flying blind — this kind of incident usually shows small warning signals for a week before.

> Senior tip: when the pool is drained, find where connections are: use pg_stat_activity to see the query and run time, then thread dump / APM to connect the connection to the application thread. Distinguish slow queries, long-held connections, and leaks before changing pool size.`,
    follow: [
      'What is a HikariCP apparent connection leak report, and which configuration helps detect it?',
      'When should you separate a connection pool for batch consumers vs online APIs?'
    ],
  },
  'scenario-007': {
    q: 'You need to delete / archive 300 million old rows from a running production table without crashing the DB. How do you do it?',
    a: `**Summary:** never run a large DELETE — split into small batches (1,000–10,000 rows) with checkpoints, sleep between batches so replication/undo does not clog; if the table is partitioned by time, DROP PARTITION is instant. Archive to a cold table / S3 Parquet first, and remember {{VACUUM}} (Postgres) after large deletions.

### Clarify requirements
- What is the deletion criteria (by date, status)? How long is data legally required to be kept (State Bank usually 5 years)?
- Is the table time-partitioned, are there FKs pointing to it?
- Can there be a downtime window or must it run online with traffic? Is there an external warehouse to dump data?

### Investigate / Analyze
- Estimate rows by condition ({{SELECT count(*)}} on a subset) — if deleting 80% of the table, consider rebuilding instead of DELETE.
- Check index matching the DELETE condition; if DELETE forces a full table scan, every batch is expensive.
- Calculate replication/undo impact: large DELETE writes a lot of WAL/binlog, increases lag and disk usage.

### Solution
- Batch delete with checkpoint:
~~~sql
-- PostgreSQL: select by PK each time, avoid large OFFSET
DELETE FROM logs WHERE id IN (
  SELECT id FROM logs WHERE created_at < now() - interval '24 months'
  ORDER BY id LIMIT 5000

);
-- MySQL: DELETE ... LIMIT 5000; loop until 0 rows, sleep 200ms per loop
~~~
- Archive first: INSERT INTO logs_archive SELECT ... in batches, or export Parquet to S3 + Athena for future queries.
- If the table is partitioned by month: DROP PARTITION — instant, no dead tuples.
- After large deletion in PostgreSQL: {{VACUUM ANALYZE}} (at low-traffic time) to clean dead tuples and update statistics.
- If deleting 80% of the table: CREATE NEW TABLE AS SELECT (the kept part) + rename — faster overall than batch DELETE.

### Trade-off & pitfall
- Small batches but an unindexed WHERE still scans the table — measure the rows removed per loop to confirm it stays fast.
- Large DELETE without {{VACUUM}} creates dead tuples that bloat the table and slow all subsequent queries.
- The archive table also needs schema/index design from the start to serve future audit queries.

> Senior tip: the retention period depends on the document type and applicable regulations; agree on retention with legal/compliance before deleting. You can tier hot, archive, and object storage, but must keep query access, access control, and integrity evidence as required.`,
    follow: [
      'Compare batch DELETE vs CREATE TABLE AS SELECT + rename on a 300-million-row table?',
      'If the table is not partitioned, how do you migrate it to monthly partitioning without downtime?'
    ],
  },
  'scenario-008': {
    q: 'Two users update the balance / inventory at the same time, and one update is lost (lost update). How do you fix it?',
    a: `**Summary:** lost update happens when read → compute → write is not serialized. Change to an atomic UPDATE with a condition ({{UPDATE accounts SET balance = balance - :amt WHERE id = :id AND balance >= :amt}} and check rowsAffected), or optimistic lock {{@Version}} + retry, or {{SELECT FOR UPDATE}} for high contention.

### Clarify requirements
- Scope: which flows change the balance (wallet top-up, withdrawal, flash sale inventory)? Are there flows that create records and update multiple tables?
- What layer is the code written in (JPA, MyBatis, raw JDBC) — this determines the standard fix.
- How frequent is the contention on the same SKU / account (hot key)?

### Investigate / Analyze
- Reproduce the conflict: send the same PK request in parallel with k6/JMeter; verify the final value is not missing an update.
- Check service code: read-then-write missing a lock is the most common pattern.
- If using JPA: check whether the entity has {{@Version}}.

### Solution
- Method 1 — atomic SQL:
~~~sql
UPDATE inventory SET qty = qty - :take
WHERE sku = :sku AND qty >= :take;
-- rowsAffected = 0 -> out of stock, no SELECT needed first
~~~
  Similar for balance: {{UPDATE accounts SET balance = balance - :amt WHERE id = :id AND balance >= :amt}}.
- Method 2 — optimistic lock: entity has {{@Version}}; retry on OptimisticLockException with max attempts.
- Method 3 — pessimistic lock: {{SELECT ... FOR UPDATE}} for short transactions with heavy contention.
- UI layer: clear out-of-stock message, disable the button first, avoid users pressing multiple times.

### Trade-off & pitfall
- Optimistic lock with hot keys (hot-sale SKU) causes many retries / user errors; for hot keys use atomic SQL or a queue by SKU.
- Do not forget {{qty >= :take}} in WHERE — if missing, two simultaneous updates will produce a negative result.
- Atomic update only solves one step; if a flow touches multiple tables, it needs a transaction + internal business check.

> Senior tip: my principle is "combine any computable update into one atomic SQL when possible" — this greatly reduces race logic in the app and eliminates lost updates at the root. For flash sales, a queue by SKU is also a good friend.`,
    follow: [
      'What happens inside the DB engine when two atomic UPDATE statements hit the same row?',
      'Compare optimistic lock vs pessimistic lock — cost, when to use each?'
    ],
  },
  'scenario-009': {
    q: 'You must import a 1-million-row CSV/Excel file into the system. How do you design the process to be fast, correct, and rerunnable?',
    a: `**Summary:** three principles: streaming parse row by row (do not load the whole file into RAM), batch insert (500–1,000 rows/chunk, prefer COPY), run async via a queue with progress reporting; validate each row and output errors by row number; idempotent with file hash as job key + unique key, rerunning does not duplicate.

### Clarify requirements
- Format: CSV or Excel (.xlsx)? Encoding, header, how many columns, does the structure change between uploads?
- Error policy: skip bad rows and import the rest, or all-or-nothing?
- How long is acceptable? Does the user need real-time progress?

### Investigate / Analyze
- The current code often loads the entire file into a List and saves each row — OOM and slow; measure with a real file to get a baseline.
- Which DB (PostgreSQL has {{COPY}}), do you have write access to a staging table and enough disk for a temp file?

### Solution
- Streaming parse + JDBC batch:
~~~java
try (Reader r = new BufferedReader(new InputStreamReader(in, UTF_8), 1 << 16)) {
  CSVParser parser = CSVFormat.DEFAULT.builder().setHeader()
      .setSkipHeaderRecord(true).build().parse(r);
  var buf = new ArrayList<Object[]>(1000);
  for (CSVRecord rec : parser) {
    buf.add(map(rec));
    if (buf.size() == 1000) { jdbc.batchUpdate(INSERT_SQL, buf); buf.clear(); }
  }
  if (!buf.isEmpty()) jdbc.batchUpdate(INSERT_SQL, buf);
}
~~~
- Speed: PostgreSQL {{COPY}}, MySQL {{LOAD DATA INFILE}} are much faster than batch insert; Hibernate needs {{jdbc.batch_size=500}} and ID via SEQUENCE (IDENTITY disables JDBC batching).
- Validate each row: record error with row number + reason, output file/JSON report; choose skip-bad-rows or fail-all based on requirements.
- Async: upload file to S3 → push job to SQS → worker processes → progress saved in Redis (imported/total) → client polls or SSE.
- Idempotent: {{SHA-256}} of file content as job key; unique key (job_key, row_no) with INSERT ON CONFLICT DO NOTHING — rerunning the same file does not duplicate; if the job already succeeded, return the previous result immediately.

### Trade-off & pitfall
- A transaction covering 1 million rows bloats undo/WAL and holds locks for a long time — commit per chunk; if the business requires all-or-nothing, load chunks into a staging table, validate, then merge/swap to the real table in one final step.
- Reading large .xlsx requires a streaming event API ({{XSSFReader}} + SAX) or a library like excel-streaming-reader/FastExcel instead of {{XSSFWorkbook}} (loads the whole file); {{SXSSF}} is only for **writing** streaming, it cannot read.
- Hibernate with IDENTITY disables JDBC batching — a common mistake that makes imports 50 times slower.

> Senior tip: on PostgreSQL, COPY of 1 million rows runs in 8–12 seconds while JPA save per row takes over 10 minutes; staging + COPY is the minimum package for large imports. The detail often forgotten: reject duplicate file hash right at the endpoint before the backend worker wastes resources.`,
    follow: [
      'If the business requires all-or-nothing on 1 million rows, how do you design rollback?',
      'How do workers report progress reliably when multiple nodes are involved?'
    ],
  },
  'scenario-010': {
    q: 'The user needs to export 5 million rows to CSV for download. How do you avoid OOM and not make the user wait?',
    a: `**Summary:** do not build a 5-million-row List in RAM — use an async job: query by keyset/cursor, stream write each chunk to a file (temp then S3), return a presigned URL; sync option only for under ~50k rows with StreamingResponseBody, because 5 million rows exceeds typical proxy/gateway timeouts.

### Clarify requirements
- How long does the user accept waiting: download immediately (sync) or receive a link by email when done (async)?
- Format: plain CSV or .xlsx? Need to split into parts when exceeding 1,048,576 rows for Excel?
- Who uses it: internal admin (can wait) or end user?

### Investigate / Analyze
- The common approach is: query into a List, concatenate strings with StringBuilder or write ByteArrayOutputStream in memory → OOM immediately with a few million rows.
- Size: 5 million CSV rows is about 1–2 GB — exceeds many proxy/gateway body limits and default connection timeouts.

### Solution
- Standard async job: request → create PENDING job record → push to queue (SQS) → worker streams query writes to temp file → uploads to S3 → sends presigned URL:
~~~java
// PG: autoCommit=false + fetchSize=1000 for streaming; MySQL: useCursorFetch=true
try (var rs = stmt.executeQuery()) {
  try (var w = new BufferedWriter(new FileWriter(tmpFile), 1 << 16)) {
    w.write("id,name,amount\n");
    while (rs.next()) {
      w.write(rs.getLong(1) + "," + csvEscape(rs.getString(2)) + ","
            + rs.getBigDecimal(3) + "\n");
    }
  }
}
s3.putObject(req, RequestBody.fromFile(tmpFile)); // SDK v2, upload from file: RAM does not hold content
~~~
- JPA loads the whole list into RAM easily dies — use JdbcTemplate {{fetchSize}} + keyset pagination ({{WHERE id > :lastId ORDER BY id LIMIT 50000}}) looping through multiple queries, not holding a cursor for long.
- When finished: return a presigned URL (1-hour lifetime) via callback/webhook/email.
- Sync for small cases: StreamingResponseBody + {{Content-Disposition}}; flush every few thousand rows and enable {{X-Accel-Buffering: no}} to avoid proxy buffering.

### Trade-off & pitfall
- HTTP sync cannot handle 5 million rows — proxy timeout, user retries many times multiplying load.
- CSV injection: values starting with {{= + - @}} can run Excel formulas — prefix with a single quote.
- Excel has a hard max of 1,048,576 rows — split into 500k-row parts and compress to .zip for combined download.

> Senior tip: my rule: any export estimated over 100k rows becomes an async job + presigned URL; HTTP sync only handles small loads. Large exports are a classic Java OOM — I have seen systems OOM many times just because a user pressed export on an 8-million-row revenue table.`,
    follow: [
      'How do you limit concurrent export jobs to prevent users from spamming the export button?',
      'How do you ensure the exported file reflects consistent data at the creation time?'
    ],
  },
  'scenario-011': {
    q: 'The user needs to upload a 2 GB file to the system. How do you design the upload flow for stability and resumable retries?',
    a: `**Summary:** do not send a 2 GB file through the JVM (multipart consumes RAM/disk, easily cut by timeout) — client uploads directly to S3 via presigned URL with multipart upload; choose part size and concurrency by S3 limits, throughput, and retry capability; concurrent uploads with limits, retry each part individually (resumable); after complete, use an S3 event to scan the virus (Lambda + ClamAV) before the file enters the clean bucket.

### Clarify requirements
- Max size, file type, user network (office 4G)? Is resumable needed when interrupted?
- Who scans viruses, target bucket is S3 or an internal system? SLA for file availability after upload?
- Is a per-part progress bar needed?

### Investigate / Analyze
- Current approach: Spring Multipart keeps temp files in the JVM, Tomcat has max-post-size; LB idle timeout cuts the data stream; JVM heap/disk at peak.
- Over 2 GB, most requests fail due to proxy timeout; if retrying from the beginning, users usually give up.

### Solution
- Standard flow:
  1. Client calls {{POST /uploads/init}} — backend creates a multipart upload (CreateMultipartUpload), returns uploadId and a list of presigned URLs for each part.
  2. Client uploads parts in parallel; failed parts retry individually; saves state (uploadId, completed parts) to resume.
  3. Complete: client calls {{/uploads/complete}} — S3 assembles the file; an S3 event triggers Lambda running ClamAV; clean files move to the clean bucket, suspicious ones stay in quarantine.
- Backend receives no bytes — only signs URLs (a few ms of CPU) and stores metadata (owner, per-part md5) for reconciliation.
- Validation does not rely on file name or MIME header; reads magic bytes to confirm real file type; limits a whitelist of extensions.

### Trade-off & pitfall
- Presigned URLs expire (max 7 days, recommend 24h); resume requires requesting new URLs for unfinished parts.
- CORS must be configured for presigned upload; test with a real browser, not just Postman/curl.
- Separate three buckets: upload-raw / quarantine / clean; only the clean bucket is read by the app — fail-safe when scanning fails.

> Senior tip: uploading straight to S3 reduces service CPU/RAM by up to 90% when handling large files. Choose part size/concurrency based on measurement of the target client and network; limit concurrent parts so you do not exhaust the device's bandwidth/connections. Per-part retry lets the upload continue without sending the entire file again.`,
    follow: [
      'If the client loses network after uploading 5 of 12 parts, how is the resume flow designed?',
      'How do you use S3 ListParts to know which parts the client has finished and where to start retrying?'
    ],
  },
  'scenario-012': {
    q: 'A nightly batch job runs twice and crashes lose progress, forcing a restart from scratch. How do you handle it?',
    a: `**Summary:** separate the two problems — (1) anti-duplicate: distributed lock with ShedLock or K8s CronJob with concurrencyPolicy: Forbid; (2) safe rerun: checkpoint (Spring Batch jobExecutionContext / progress table) + every write idempotent (UPSERT by business key) so restart does not duplicate or lose.

### Clarify requirements
- Where is the cron triggered (each pod has a scheduler, or a separate K8s CronJob)? Can there be overlap if the job runs longer than the interval?
- How long does the job run, when can a crash occur, is losing partial data serious?
- Is Spring Batch already used, or a custom scheduler?

### Investigate / Analyze
- Log the run time of each instance; compare runtime to interval to see overlap.
- Check if the job already has a distributed lock (Redis SETNX, DB lock table); does the lock expire correctly?
- Check data when interrupted: half written, half not — missing a clear checkpoint mechanism.

### Solution
- ShedLock (Spring):
~~~java
@Scheduled(cron = "0 0 2 * * *")
@SchedulerLock(name = "eod-batch", lockAtMostFor = "PT3H", lockAtLeastFor = "PT30M")
public void run() { ... }
~~~
  {{lockAtMostFor}} must be larger than the max runtime so another instance does not take the lock before the first dies; backend uses DB or Redis.
- K8s CronJob: {{concurrencyPolicy: Forbid}} + {{activeDeadlineSeconds}}; if the pod crashes, the next cron must rely on idempotency.
- Checkpoint: Spring Batch stores jobExecutionContext in JobRepository so {{JobOperator.restart}} resumes from the unfinished part; if custom-built, write a job_run table (run_id, step, last_key, status) per chunk.
- Every write idempotent: INSERT ... ON CONFLICT DO NOTHING with a business key (date + entity) — rerunning any number of times produces the same result as running once.
- Monitor: alert when runtime approaches lockAtMostFor; alert when processed rows are zero (job runs but does nothing).

### Trade-off & pitfall
- ShedLock only solves duplicate runs, not crash mid-run — still need checkpoint + idempotency.
- {{lockAtLeastFor}} is important: avoids multiple pods grabbing the lock at the same second when system clocks shift.
- Do not use an in-process lock (local mutex) — useless with multiple pods.

> Senior tip: two layers of safety: lock solves duplicate runs, idempotency solves reruns. Every job I write has INSERT ON CONFLICT DO NOTHING with a business unique key — a third restart is still correct as the first, with no double writes.`,
    follow: [
      'ShedLock vs leader election (K8s Lease): when to choose which?',
      'How to design a checkpoint for a custom job (not Spring Batch) so it resumes from the last chunk?'
    ],
  },
  'scenario-013': {
    q: 'You need to send emails/notifications to 1 million users. How do you design it so it does not overload the system and does not get your ESP account locked?',
    a: `**Summary:** do not run a for loop in a web request — split recipients into small jobs (~10k users per job), push into a queue (SQS), workers send according to the ESP rate limit quota (SES/SendGrid) with backoff + jitter; key (campaign_id, user_id) prevents duplicate sends on retry; collect bounce/complaint webhooks to update the suppression list; save progress in Redis.

### Clarify requirements
- Campaign type: marketing (common template) or operational (personalized per user)?
- Which ESP, current send rate quota? Is bounce/open tracking and unsubscribe needed?
- Is spreading over a few hours acceptable, or must it be done within 10 minutes?

### Investigate / Analyze
- The common approach loads all 1 million users into memory or calls the ESP API one by one in the request — OOM / timeout / hits rate limit.
- Confirm ESP quota and average send time per email to calculate job size.

### Solution
- Architecture:
  1. Admin creates campaign → scheduler splits recipients into multiple jobs (each ~10k users) pushed to SQS.
  2. Workers consume the queue, control rate (e.g., SES default ~14/s, request more quota if needed); batch multiple recipients per request when ESP supports it (SendGrid {{/v3/mail/send}} supports up to 1,000 personalizations/request; SES has {{SendBulkEmail}} by template).
  3. Save batch status in Redis/DB + total progress (sent/failed/total).
  4. Bounce/complaint webhooks → update suppression list immediately (no further sends).
- Template rendering in the worker; idempotent with a unique key (campaign_id, user_id) — queue redelivery does not send again.
- Log only metadata (campaignId, userId, status) in app logs — do not log content or email addresses to avoid PII.

### Trade-off & pitfall
- Exceeding ESP rate limits causes throttle/temporary block — every send must respect 429 with exponential backoff + jitter.
- Sending again to unsubscribed emails violates CAN-SPAM/GDPR — suppression list must be read before sending, cached by the worker.
- Large campaigns should be tested internally first (~100 users) to catch template errors before thousands of bad emails go out.

> Senior tip: email campaigns of millions are not a throughput problem but a quota problem: I always schedule large campaigns during low-traffic hours and send slowly at 10k emails/minute — a 2-hour delay is acceptable, being blocked for one night is not; always have an emergency stop button to halt the entire campaign when a wrong template is found.`,
    follow: [
      'Backoff strategy design for retry when SES returns a quota error?',
      'How do multiple campaigns share resources fairly: split evenly or by weight?'
    ],
  },
  'scenario-014': {
    q: 'The p99 API jumps from 200ms to 2s right after a deploy. What is the investigation process and when do you roll back?',
    a: `**Summary:** restore first, then investigate — the recent deploy is suspect #1: if p99 exceeds SLA or error rate increases, roll back or disable the feature flag within the first minutes; then compare before/after traces, check GC/pool/dependencies, and hotfix at the right place.

### Clarify requirements
- Did p99 jump immediately after deploy or gradually hours later? Only one group of APIs or all?
- Did error rate increase together (500, timeout)? Is traffic different from before (launch, marketing)?
- Were there other changes in the same window (config, DNS, TLS cert, library upgrade)?

### Investigate / Analyze
- Align deploy timeline with latency/error charts; eliminate variables one by one to identify the suspect.
- APM: compare p99 traces before/after; which span is longest — new slow SQL, increased HTTP out, heavier serialization.
- JVM: GC pause increased? More heap usage? Connection or thread pool drained? Container CPU throttled?
- Code and library diff: find new N+1 query, new regex (ReDoS), new serialization format, reduced cache hits.
- Reproduce with load test on staging with traffic similar to production.

### Solution
- Roll back immediately when p99/error exceeds the threshold: revert to the previous version or disable the feature flag so the new feature does not run; "return to stability" is always the first step.
- Deep investigation: continuous profiling (async-profiler) to see the flame graph and find the heaviest point; if a new query is slow → optimize index or rewrite the query.
- Temporary hotfix while waiting: temporarily increase pool size if drained; set a timeout for the new HTTP client; scale horizontally with more replicas.
- Prevention: canary deployment + SLO gate that blocks full rollout; require load testing before large releases.

### Trade-off & pitfall
- Comparing latency before/after must be under the same traffic conditions — use HDR histograms, not averages that are skewed.
- Avoid coordinated omission making p99 falsely low — measure as real clients send requests, not by server schedule.
- Delayed rollback because you keep debugging on production is a classic mistake — keep the rule: restore first, find the cause later.

> Senior tip: my on-call process: minutes 1–5 rollback or disable feature flag; minutes 5–30 investigate the flame graph on the rolled-back version. The first time I was on-call I delayed rollback 30 minutes because I tried to debug directly on production — from then on I follow the rule: restore first, find the cause later.`,
    follow: [
      'If canary deployment is available, how does the gradual rollout procedure ensure regression is detected before full rollout?'
    ],
  },
});
