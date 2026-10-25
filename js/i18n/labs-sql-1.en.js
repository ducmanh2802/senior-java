/*
 * English translation of js/data/labs-sql.js — task T255. Format: js/core/i18n.js (content overlay).
 * ids: lab-sql-001 lab-sql-002
 */
App.i18n.content({
  'lab-sql-001': {
    title: 'Transaction report scans 42 million rows despite index',
    scenario: `**Context.** VBank's digital banking platform operates the {{payment-core}} service (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 on RDS, 8 vCPU / 64 GB RAM, storage gp3 500 GB). The {{payment_transaction}} table stores all payment transactions for retail and SME customers: after 3 years, it has reached **42,318,904 rows** (~9.3 GB including indexes, heap ~4.6 GB — fits entirely in RAM), averaging about 38,000 transactions per day.

**Symptoms (14/03/2026).** Starting at 09:40, the "Daily revenue" screen for the Retail segment calling {{GET /api/v1/reports/payment?date=2026-03-14}} began **timing out (30 seconds)**, resulting in approximately 400 504 errors per minute. RDS reported {{CPUUtilization = 98%}} while {{ReadIOPS}} remained nearly constant — the resource exhaustion was CPU-based, not I/O-based. {{pg_stat_activity}} showed dozens of identical queries scanning the same table.

**Attempts that failed.** Increasing {{work_mem}} to 256 MB, increasing {{max_connections}}, creating a read-replica for reporting — runtime **did not decrease**. On staging (a table with only 3.2 million rows), the query took 1.9 seconds, so it still passed performance tests; no one noticed.

**What you have.** The three artifacts below were taken from production between 09:41–09:47 on 14/03. Find the root cause, prove it with specific lines in the artifacts, then propose a short-term fix (for the day) and a long-term fix (for the next quarter).`,
    questions: [
      'Why does query (1) in the first artifact have to scan 42 million rows even though the table has the idx_payment_transaction_created_at index? Point it out using the specific line in the plan.',
      'What error did the contract_ref lookup encounter before, and why did the "patch" using a cast make the plan worse than the original?',
      'How would you handle this situation on 14/03 (immediate mitigation), and how would you redesign it to prevent recurrence next quarter (indexes, partitioning, reports, monitoring)?'
    ],
    hints: [
      'Read the "Filter:" line of all three EXPLAIN outputs carefully: which filters are pure constants, and which wrap functions or casts around columns?',
      'Compare the "Execution Time" of query (1) and query (2): same table, same index, only the condition syntax differs — how many times is the difference?',
      'The "sargable" principle: an index can only be used when the comparison side is a raw column against a constant. For timestamptz columns, date_trunc also depends on TimeZone, so it is not IMMUTABLE, meaning a functional index cannot be created in the standard way.'
    ],
    answer: `**Summary:** Both endpoints violate the "sargable" principle — the column in the condition is wrapped in a function ({{date_trunc('day', p.created_at)}}) or cast ({{contract_ref::bigint}}) — so PostgreSQL ignores the index and performs a sequential scan of all 42,318,904 rows. Each report call consumes ~38 seconds of CPU; dozens of concurrent calls (plus retries on timeout) burned through 8 RDS vCPUs. Fix immediately by using a half-open time range on the raw column and removing the cast on the column; fix long-term with partitioning by month, summary tables for reports, and data type normalization.

### Root cause
1. **Report query.** The condition {{date_trunc('day', p.created_at) = ...}} wraps a function around the column. The planner can only use an index when the right side is a constant and the left side is a raw column; a wrapped function is an expression, not equivalent to {{created_at}}, so the index is unusable → Seq Scan of the entire table.
2. **Contract lookup query.** The {{contract_ref}} column is {{varchar(32)}} but Java passes a {{Long}} parameter. Initially, PostgreSQL threw an "operator does not exist: character varying = bigint" error; the dev "patched" it by casting on the **column side**: {{p.contract_ref::bigint = 8845123}}. Placing the cast on the column side breaks the index (the index is built on the varchar value of {{contract_ref}}, not on {{contract_ref::bigint}}), turning it into a Seq Scan — previously the query failed immediately, now it "runs" but scans the whole table (12 seconds) for a point lookup. Additional risk: if just one row contains non-numeric characters, the cast will throw {{invalid input syntax for type bigint}} for every lookup.
3. **Amplification factor.** The report endpoint lacks caching and rate-limiting; client timeouts (30s) trigger retries while the old query continues running on the DB, causing the number of concurrent queries to increase (12 queries simultaneously as recorded in the artifact). Each scan reads 42 million rows even if only 9,876 rows match. 98% CPU usage is a result of wasteful scanning, not actual load.

### Proof
- Artifact 1, query (1): the line **"Filter: (date_trunc('day'::text, created_at) = '2026-03-14 00:00:00+07'::timestamp with time zone)"** shows the condition is an expression, not a raw column; the line **"Seq Scan on payment_transaction p"** confirms the index is not used; **"Rows Removed by Filter: 42309028"** means 42,309,028 rows were read then discarded (total 42,318,904 − 9,876 matching rows); **"Buffers: shared hit=598934 read=6178"** — reads all ~605k pages of the heap, mostly from RAM (consistent with constant ReadIOPS, 98% CPU); **"Execution Time: 38745.208 ms"**. Estimated {{rows=211595}} compared to the actual 9,876 is also a sign the planner lacks statistics for the {{date_trunc(...)}} expression and uses a default selectivity of 0.5%.
- Artifact 1, query (2): same table, same question, only changing the condition to a time range → **"Index Scan using idx_payment_transaction_created_at"**, **"Buffers: shared hit=171 read=12"**, **"Execution Time: 6.598 ms"**. The difference is 38745/6.6 ≈ **5,900 times** just due to the condition syntax. The index already existed and worked well — the issue is not "missing an index".
- Artifact 2: **"Filter: ((contract_ref)::bigint = 8845123)"**, **"Rows Removed by Filter: 42318904"**, result **rows=0** — 12.19 seconds of CPU time to return an empty list.
- Artifact 3: index {{idx_payment_transaction_created_at}} (btree on {{created_at}}) and {{idx_payment_transaction_contract_ref}} (btree on {{contract_ref}}) **both exist**; statistics show {{idx_payment_transaction_created_at}} has idx_scan = 91,884 (correct queries) while {{idx_payment_transaction_contract_ref}} is only 41 — a sign that casted queries are scanning the table.

### Short-term fix (on 14/03)
- Fix report query to use a half-open time range on the raw column, always bind parameters, and **fix the business TimeZone once** at the application layer then pass down as UTC timestamptz.
- Fix contract lookup query: pass parameter as String ({{String.valueOf(contractRef)}}) to compare directly with the {{varchar}} column — or if Long must be kept, cast on the **parameter side**: {{WHERE p.contract_ref = CAST(:ref AS varchar)}}; index {{idx_payment_transaction_contract_ref}} is used again immediately.
- Stop saturation: temporarily disable report endpoint, set rate-limits, or return cached results for 5 minutes; set {{statement_timeout}} for the reporting role (e.g., 30 seconds, matching client timeout) so orphaned queries don't keep running on the DB.
- Clean up running queries: use {{pg_cancel_backend}} for pids currently scanning the table, do not let them run until the 30s timeout.

### Long-term fix
- **Normalize data types:** change {{contract_ref}} to {{bigint}} (since it only contains digits) and update code to pass Long. For a 42-million-row table, follow the expand/contract model: add a new column, backfill in batches, dual-write, update index, then drop the old column — never {{ALTER TABLE ... TYPE}} directly on a large table.
- **Partitioning by month** on {{created_at}}: daily reports scan only the correct partition, vacuuming and indexing are much smaller, and old data can be dropped by {{ALTER TABLE ... DETACH PARTITION}} then {{DROP TABLE}} that partition instead of {{DELETE}}ing millions of rows. (Migrating a 42M row table to partitioned requires a separate migration: create a new partitioned table then migrate data in batches.)
- **Reporting does not read the raw transaction table:** build a daily summary table ({{daily_payment_summary}}, updated by batch job/CDC) and have the dashboard read this table; this is the change with the highest ROI.
- **Index suited for append-only tables:** consider BRIN on {{created_at}} (only a few hundred KB, suitable for sequentially ordered data, sufficient for time-range queries) instead of btree ~1 GB; if a specific timezone day is needed, an expression index on {{date_trunc('day', created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')}} is valid because this expression is IMMUTABLE.

### Prevention and monitoring
- Enable {{pg_stat_statements}} and a dashboard tracking {{total_exec_time}} by queryid; alert when a query has {{mean_exec_time}} > 1 second or {{calls}} increases suddenly.
- Enable {{auto_explain}} with {{auto_explain.log_min_duration = 500}} (on RDS: add to {{shared_preload_libraries}} via parameter group) to log plans of slow queries; alert when a plan changes from "Index Scan" to "Seq Scan" on large tables.
- Monitor **rows examined / rows returned** (PostgreSQL: {{Rows Removed by Filter}}); this is the KPI to detect "query scans the whole table but returns a few dozen rows".
- Monitor {{pg_stat_user_indexes.idx_scan = 0}} — an unused index is a signal that queries have deviated from the pattern.
- Mandatory PR review rules: no function/cast in {{WHERE}} around columns; all report queries must include {{EXPLAIN (ANALYZE, BUFFERS)}} in PR; add performance tests with production-scale data in CI.

> Senior tip: the sign "query fast on staging, slow on production" is almost always **linear deviation based on row count**, i.e., the plan has switched from Index Scan to Seq Scan. Here staging had 3.2M rows so scanning took 1.9s and still passed; at 42.3M rows that same scan is ~25s, and 38s with high load. If measured by {{EXPLAIN}} on real data (without using {{LIMIT 100}} to "fake" the plan), you'll see the bad spot immediately. Lesson learned: never let a dashboard scan the raw transaction table — separate the summary table from the start, the cost is much smaller than fire-fighting data.`,
    rubric: [
      'Identified the root cause correctly: the WHERE condition wraps a function/cast around the column causing the index to be unusable (non-sargable), PostgreSQL switches to Seq Scan of the entire table',
      'Cited correct data points from the artifact: Seq Scan + date_trunc in Filter + Rows Removed by Filter 42,309,028 + Execution Time 38745 ms, and compared with the range-based query (Index Scan, 6.6 ms)',
      'Explained correctly why the contract_ref query lost index usage (cast placed on column side, index built on contract_ref) and why this is a consequence of the operator does not exist error',
      'Proposed correct fixes: half-open time range on raw column, remove cast on column side / normalize contract_ref data type, safe expand-contract migration',
      'Has a long-term strategy and specific monitoring: partitioning by month or summary table for reporting, BRIN/expression index, pg_stat_statements + auto_explain + alert based on rows examined'
    ]
  },
  'lab-sql-002': {
    title: 'Seller console orders slow even though optimizer used index',
    scenario: `**Context.** The MiniShop e-commerce platform runs MySQL 8.0.36 on RDS (8 vCPU / 32 GB RAM, storage gp3 1 TB, has 1 read-replica for reporting). The {{orders}} table stores orders for all sellers on the platform: **28,412,905 rows** (~4.1 GB data + 2.8 GB indexes, write speed ~900 rows/sec during peak 12:00).

**Symptoms (14/03/2026, 12:00–13:30).** The "Orders to process" screen in the seller console calls {{GET /api/v2/seller/orders?shopId=42&status=PENDING,CONFIRMED&from=2026-03-13&to=2026-03-14}}. Before 11:45 the API returned in **180 ms**; from 12:00, p95 jumped to **1.9 seconds**, p99 to **4.1 seconds** and started returning 504. RDS CPU hit 90–97% while system-wide QPS only increased by 40%.

**Attempts that failed.** Moved reporting endpoint to read-replica, increased {{innodb_buffer_pool_size}} to 24 GB, increased service connection pool — p95 still 1.8 seconds. DBA suspected "missing index" so they created an additional index {{orders(shop_id)}} — p95 still didn't decrease.

**What you have.** The three artifacts below were taken from primary between 12:04–12:11 on 14/03. Point out why the optimizer **chose an index** but the query is still slow, and propose the correct index along with the correct query.`,
    questions: [
      'EXPLAIN shows the optimizer used the idx_orders_created_at index. Why does the query still scan 318,204 rows? Cite proof from the artifact.',
      'Why didn\'t the shop_id index just created by the DBA help? What rule determines the order of columns in a composite index?',
      'Propose a specific index and query to lower p95 to under 100 ms, along with how to create the index on a 28-million-row table without blocking writes.'
    ],
    hints: [
      'Look at the "filtered" column in EXPLAIN (0.06) and compare "Rows_examined: 318204" with "Rows_sent: 187" in the slow query log.',
      'Apply the "equality first, range/sort last" rule: the current index only has created_at, so shop_id and status are only filtered after reading (table lookup) each row within the entire time range.',
      'With the condition shop_id = 42 AND status IN (...) AND created_at within a range, an index on {{(shop_id, status, created_at)}} allows "jumping" straight to the required data region.'
    ],
    answer: `**Summary:** The optimizer uses an index, but **the index does not contain the most selective filtering columns**. The index {{idx_orders_created_at}} only has the {{created_at}} column, so MySQL only narrows down the time range for the **entire platform** (318,204 orders on 13/03), then for each entry, it must perform a backward lookup (clustered index lookup) to filter {{shop_id}}/{{status}}: 318,204 rows read to return 187. The correct index is {{(shop_id, status, created_at)}} — equality columns first, range/sort column last — optionally including covering columns to avoid table lookups.

### Root cause
MySQL can only exploit the **leftmost prefix** of an index to narrow down a scan. With index {{(created_at)}}:
- the condition on {{created_at}} is a **range**, so it is used to narrow down the range — but that range contains orders for all shops;
- {{shop_id}} and {{status}} are not in the index, so for **each** entry, InnoDB must read the full record in the clustered index (random lookup) then filter "Using where";
- because of {{LIMIT 200}} but shop 42 only has 187 matching orders, MySQL never collects enough 200 rows to stop early → scans **the entire** time range (backward scan from the end of the day to the beginning).

Index design rule: **equality filtering columns first, range/sort columns last**. Index {{(shop_id, status, created_at)}} directs MySQL straight to the correct set of rows for shop 42 with the specific statuses, then narrows down the time range right on the index.

### Proof
- Artifact 1, EXPLAIN: **"type = range"**, **"key = idx_orders_created_at"**, **"rows = 312988"** (estimated number of entries in the *time range*, before filtering shop/status), **"filtered = 0.06"** (only ~0.06% of those are expected to match, i.e., ~188 rows) and **"Backward index scan"** for ORDER BY DESC. No "Using filesort" because the order is already retrieved from the index.
- Artifact 1, EXPLAIN ANALYZE: **"Index range scan on orders using idx_orders_created_at ... (reverse) ... rows=318204"** then **"Filter: ((orders.shop_id = 42) and ...) ... rows=187"** — read 318,204 rows, keep 187; Limit node also indicates **rows=187** even though LIMIT is 200. This is proof of "used index but still scanned trash".
- Artifact 1, handler status: **Handler_read_prev = 318204** (number of entries read backward on index, each involving a lookup into the table), **Sort_rows = 0** — cost is in reading, not sorting.
- Artifact 3, slow query log: **"Query_time: 1.196417 ... Rows_sent: 187 Rows_examined: 318204"** — rows examined / rows sent ratio ≈ 1,700 : 1, a classic sign of excessive scanning. The two records at 05:06:12Z and 05:06:58Z (i.e., 12:06 VN time) show this is a recurring behavior, not an isolated incident.
- Artifact 2, SHOW INDEX: {{idx_orders_created_at}} only has **created_at**; {{idx_orders_shop}} only has **shop_id**; no index combines **shop_id + status + created_at**. The newly created index {{idx_orders_shop}} is not chosen because shop 42 is a large shop: using it would require reading all historical orders of the shop then filtering by time — the optimizer estimates that to be even more expensive.

### Fix
Create a new index in the correct order, and **do not delete** the old one ({{(created_at)}} still serves reports filtering only by time):

~~~sql
ALTER TABLE orders ADD INDEX idx_orders_shop_status_created (shop_id, status, created_at),
  ALGORITHM=INPLACE, LOCK=NONE;
~~~

Expect new plan: {{key = idx_orders_shop_status_created}}, {{rows}} only a few hundred. To have a **covering index** to avoid reading the table (Extra has "Using index"), include SELECT columns at the end (order_id is primary key so it's already in every InnoDB secondary index):

~~~sql
ALTER TABLE orders ADD INDEX idx_orders_shop_status_created_cov (shop_id, status, created_at, customer_id, total_amount),
  ALGORITHM=INPLACE, LOCK=NONE;
~~~

Points to know:
- {{status IN ('PENDING','CONFIRMED')}} creates **2 ranges** on the index (each status a {{created_at}} segment). Each segment is ordered by {{created_at}}, but merging two segments loses overall ordering → MySQL must **filesort** the matched rows. With a few hundred rows, filesort is negligible; if a shop has tens of thousands of matching orders, consider index {{(shop_id, created_at)}} + filter status, or split into 2 queries (each status a query {{ORDER BY created_at DESC LIMIT 200}}) then merge in the application.
- For pagination, use **keyset pagination** ({{WHERE (created_at, order_id) < (:lastCreatedAt, :lastId) ORDER BY created_at DESC, order_id DESC}}) instead of {{OFFSET}}, because OFFSET must read and then discard the skipped rows.

### Creating indexes on 28 million rows without blocking writes
- MySQL 8.0 supports online DDL for ADD INDEX ({{ALGORITHM=INPLACE, LOCK=NONE}}): writes keep running during build, only short metadata lock at start/end (beware of long transactions holding metadata locks, causing DDL to wait and block subsequent queries). Changes during build are recorded in the online alter log: set {{innodb_online_alter_log_max_size}} large enough for the amount of writes during build time, if it overflows, DDL is rolled back. Run outside peak hours because of heavy I/O, and read-replica will lag when replaying DDL.
- Safer for very "hot" tables: **gh-ost** or **pt-online-schema-change** (copies table with throttling based on replica lag then swaps).
- After creation: {{idx_orders_shop}} becomes redundant (is a prefix of the new index) — can be dropped after verification; while {{idx_orders_created_at}} is still needed for daily reports.

### Prevention and monitoring
- Enable {{slow_query_log}} with {{long_query_time=0.5}} (and {{log_queries_not_using_indexes=ON}} if log volume allows); alert when **Rows_examined / Rows_sent > 100**.
- Use {{performance_schema.events_statements_summary_by_digest}} ({{SUM_ROWS_EXAMINED}}, {{SUM_ROWS_SENT}}) to track the seller console digest and compare before/after adding index.
- Mandatory in PR review: include {{EXPLAIN}} when adding queries/indexes, check {{rows}} and {{filtered}}, remember the **equality → range → sort** rule.
- Use **invisible index** (MySQL 8.0) to try removing an old index: {{ALTER TABLE orders ALTER INDEX idx_orders_shop INVISIBLE;}} then check if the digest increases {{Rows_examined}} — safer than dropping straight on a 28M row table, as enabling it back is just a metadata operation.

> Senior tip: when EXPLAIN says {{type = range}} but the query is still slow, remember **"rows" is the estimated number of rows before filtering**, and **"filtered"** is the expected percentage remaining after remaining conditions. Here rows = 312,988 and filtered = 0.06% is the typical picture of an index missing columns. Practical tip: when designing composite index, write down the sample query, mark equality columns (=, and IN with few values — can be used as prefix but breaks sort order), range columns (>, <, BETWEEN) and sort columns, then order the index by equality → range/sort.`,
    rubric: [
      'Identified the root cause: idx_orders_created_at index only has created_at so it only narrows down time range for the whole platform, shop_id/status must be filtered after each row lookup; mentioned equality first, range/sort last rule',
      'Cited correct data points: rows 312988 / filtered 0.06 in EXPLAIN, Index range scan rows=318204 and Filter rows=187 in EXPLAIN ANALYZE, Handler_read_prev 318204, Rows_examined 318204 compared to Rows_sent 187 in slow log',
      'Proposed index (shop_id, status, created_at) including covering index capability, understood IN on status requires small filesort, and explained why idx_orders_created_at is not deleted',
      'Mentioned safe index creation on 28M row table (online DDL INPLACE/LOCK=NONE, metadata lock, innodb_online_alter_log_max_size, off-peak, gh-ost/pt-osc) and keyset pagination over OFFSET',
      'Has specific monitoring/prevention: slow query log, performance_schema digest, alert based on Rows_examined/Rows_sent, invisible index to verify'
    ]
  }
});

