/*
 * English translation of js/data/q-spring-data.js — task T960. Format: js/core/i18n.js (content overlay).
 * ids: db-050 db-051 db-052 db-053 db-054 db-055
 */
App.i18n.content({
  'db-050': {
    q: 'A report query runs 40 minutes and a forgotten transaction holds locks all night, slowing down the whole system. What timeout "guardrails" do you set in PostgreSQL and in the application so this does not happen again?',
    a: `**Summary:** Set limits at **multiple layers** so no statement or transaction hogs resources indefinitely: {{statement_timeout}} (max time for one statement), {{lock_timeout}} (max time waiting for a lock), {{idle_in_transaction_session_timeout}} (terminate sessions that opened a transaction and abandoned it); PostgreSQL 17 adds {{transaction_timeout}}. Set per **role** for each application type (short API, longer reports), plus timeout at the **pool** and **HTTP client** on the application side, and alert on long transactions.

### What each timeout prevents
| Parameter | Prevents | Suggestion |
|---|---|---|
| statement_timeout | Statement running too long (full table scan, heavy report on primary DB) | API: 2–5 seconds; report: a few minutes on replica |
| lock_timeout | Waiting for a lock indefinitely, especially DDL queued and blocking every query after it | 2–5 seconds for migration; short for API |
| idle_in_transaction_session_timeout | Application opens a transaction and forgets (code bug, debugging) — holds locks, blocks vacuum | 30–60 seconds |
| transaction_timeout (PG17+) | Total time of one transaction | As needed |

### Where to set
~~~sql
ALTER ROLE api_user    SET statement_timeout = '3s';
ALTER ROLE api_user    SET idle_in_transaction_session_timeout = '30s';
ALTER ROLE report_user SET statement_timeout = '10min';   -- runs on replica
-- migration: set in the script itself
SET lock_timeout = '3s';
~~~
Set per role instead of globally so legitimate long-running jobs are not cut off by mistake. In Spring you can additionally set {{@Transactional(timeout = 5)}} or JPA query hint timeout per query.

### Application side
- HikariCP {{connectionTimeout}} (waiting to get a connection), {{maxLifetime}}.
- HTTP client timeout: do not call an external service while holding a transaction.
- When a statement is cancelled due to timeout, the application gets a clear error (SQLState 57014) → return a controlled error instead of hanging.

### Monitoring
~~~sql
SELECT pid, state, now() - xact_start AS xact_age, left(query, 60)
FROM pg_stat_activity
WHERE xact_start < now() - interval '5 minutes' ORDER BY xact_age DESC;
~~~
Alert when a transaction is longer than 5 minutes or a session is "idle in transaction".

### Real-world example
A developer runs a report query on the primary DB with the application account at 9 AM: scans 200 million rows, 40 minutes, DB CPU 100%. Same week, a code bug leaves a transaction open when a rare exception branch is hit — the "idle in transaction" session holds locks on the orders table all night, autovacuum cannot clean up, and the next morning migration queues behind it and blocks every query for 6 minutes. After that: separate role for API (statement_timeout 3s, idle_in_transaction 30s), report role connects only to replica, migration always has lock_timeout + retry, alert on long transactions. Neither type of incident recurred.

### Sample interview answer
"I set guardrails at multiple layers. In PostgreSQL: statement_timeout limits the time for one statement, lock_timeout limits the waiting time for a lock — especially important for migrations because queued DDL can block every query behind it — and idle_in_transaction_session_timeout terminates sessions that opened a transaction and forgot about it, which hold locks and block vacuum; PostgreSQL 17 adds transaction_timeout. I set per role for each application type: short API, longer reports running on replica. The application side has pool timeout, transaction timeout, and HTTP client timeout, and does not call external services inside a transaction. Finally, alert when a transaction lasts more than a few minutes."

> Senior tip: separate **DB accounts by purpose** (API, job, report, migration, person) from the start. This allows different timeouts and permissions, and when an incident occurs, looking at pg_stat_activity tells you right away who is doing what.`,
    follow: [
      'Why is lock_timeout especially important for migrations?',
      'How does an idle in transaction session affect autovacuum?',
      'How do you handle errors cancelled by statement_timeout in Spring?'
    ],
  },
  'db-051': {
    q: 'What query rewrite patterns do you commonly use to speed up without changing results? Explain NOT IN and NOT EXISTS, OR and UNION ALL, correlated subquery and JOIN/LATERAL, CTE and COUNT(*) on large tables.',
    a: `**Summary:** Many slow queries do not need a new index but need to be **rewritten** so the planner chooses a better plan or reads less data. Common patterns: {{NOT EXISTS}} instead of {{NOT IN}} (also fixes the NULL bug), {{UNION ALL}} instead of {{OR}} between columns with different indexes, {{JOIN}}/{{LATERAL}} instead of a subquery re-run per row, control whether CTE is "materialized" or not, and avoid exact {{COUNT(*)}} on huge tables when only an estimate is needed. Always verify with {{EXPLAIN ANALYZE}} and compare results before and after.

### NOT IN and NOT EXISTS
~~~sql
-- Wrong when subquery has NULL: NOT IN returns completely empty
SELECT * FROM customers c WHERE c.id NOT IN (SELECT o.customer_id FROM orders o);
-- Correct and usually faster (anti-join)
SELECT * FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
~~~
{{x NOT IN (1, 2, NULL)}} gives UNKNOWN for every x → no rows returned. {{NOT EXISTS}} has no such trap and the planner converts it to an efficient anti-join.

### OR between different columns
{{WHERE email = $1 OR phone = $2}} with two separate indexes: PostgreSQL can use BitmapOr, but usually worse than splitting:
~~~sql
SELECT * FROM users WHERE email = $1
UNION ALL
SELECT * FROM users WHERE phone = $2 AND email IS DISTINCT FROM $1;   -- avoid duplicate rows
~~~

### Correlated subquery → JOIN / LATERAL
A subquery in {{SELECT}} is re-run for each row. For "latest order per customer":
~~~sql
SELECT c.id, o.*
FROM customers c
CROSS JOIN LATERAL (
  SELECT * FROM orders o WHERE o.customer_id = c.id
  ORDER BY o.created_at DESC LIMIT 1                     -- uses index (customer_id, created_at DESC)
) o;
~~~
Or PostgreSQL's {{DISTINCT ON (customer_id)}}, or a window function — choose based on number of groups and available indexes.

### CTE
From PostgreSQL 12, a non-recursive CTE with no side effects used only once is **inlined into** the main query (planner optimizes through it). You can force with {{WITH x AS MATERIALIZED (...)}} (compute once, use many times) or {{NOT MATERIALIZED}}. Before PG12, CTE is always an "optimization barrier" — old queries written with CTE can be slow for this reason.

### COUNT(*) on large tables
Because of MVCC, PostgreSQL must check each row for visibility to the current transaction, so {{COUNT(*)}} on 500 million rows is expensive. Options:
- Show "about 2.3 million" from an estimate ({{SELECT reltuples FROM pg_class WHERE relname = 'orders'}}) or from {{EXPLAIN}}.
- Conditional count using a small index (index-only scan if visibility map is good).
- Separate counter table (updated by event) for numbers that need to be accurate.
- Pagination UI does not need the total (keyset + "next page").

### Real-world example
A CRM screen "customers who have never purchased" uses {{NOT IN}} — after the orders table has a few rows with NULL {{customer_id}} (bad import data), the screen returns **empty** and the marketing team sends the wrong campaign; switching to {{NOT EXISTS}} is both correct and 6x faster. In the same project, the list page shows "Total: 48,213,004 records" running {{COUNT(*)}} 9 seconds every time it opens; switching to estimate and keyset, the page opens in 80ms.

### Sample interview answer
"I have a few rewrite patterns I commonly use, always verifying with EXPLAIN ANALYZE and comparing results before and after. For NOT IN with a subquery I switch to NOT EXISTS, avoiding the NULL trap that returns empty results and letting the planner do an anti-join. OR between columns with different indexes I split into UNION ALL, handling duplicates carefully. A correlated subquery in SELECT I switch to JOIN, or LATERAL with LIMIT for the latest-record-per-group problem, based on a properly ordered index. For CTEs, from PostgreSQL 12 they are usually inlined into the main query, and can be forced MATERIALIZED when I need to compute once. And I avoid exact COUNT on very large tables when the UI only needs an estimate, because MVCC forces checking every row."

> Senior tip: keep a team file of "common query patterns" (top-N per group, anti-join, upsert, keyset pagination) with required indexes. Most slow queries in code review are variants of a few of these patterns written the slow way.`,
    follow: [
      'Why does NOT IN with NULL return empty — explain with three-valued logic?',
      'DISTINCT ON, window function, and LATERAL: which to choose for top-1 per group?',
      'When do you deliberately use CTE MATERIALIZED?'
    ],
  },
  'db-052': {
    q: 'Like counts, product stock of a hot item, or a row "today\'s total revenue" hit by thousands of update requests at once, causing lock waits and deadlocks. How do you handle "hot rows"?',
    a: `**Summary:** Every {{UPDATE}} locks the row until the transaction ends, so a row updated thousands of times per second becomes a **serialization point** for the whole system. Handling by level: **shorten the transaction** holding the hot-row lock (put the hot-row update at the end of the transaction), **shard the counter** into N child rows (sharded counter) and sum when reading, **append instead of update** (append-only + periodic rollup), or **move the counter to Redis** ({{INCRBY}}) and sync to DB in batches — depending on how much real-time accuracy is needed.

### Why hot rows bottleneck
Transaction A {{UPDATE stats SET total = total + 1 WHERE day = today}} holds the row lock until commit. If A keeps doing other work for 50ms afterward, every other transaction updating the same row must **queue**: at most about 20 times/second for that row, no matter how powerful the DB. More hot rows updated in different orders → deadlock.

### Handling options
| Approach | Idea | Trade-off |
|---|---|---|
| Update hot row at end of transaction | Hold lock for the shortest time | Still serial, just better |
| Sharded counter | N rows {{(key, shard)}}, each request adds to a random shard; read = SUM | Reads cost a bit more |
| Append-only | INSERT per event, job rolls up every minute | Total has latency |
| Redis INCRBY | Atomic counter in memory, sync to DB in batches | Can lose a few seconds of data if Redis fails (enable AOF, reconcile) |
| Inventory split into buckets | Split inventory into multiple rows (e.g. 10 rows × 100 products) | Logic to choose a row with stock |

~~~sql
-- Sharded counter: 16 child rows per post
INSERT INTO post_likes_counter (post_id, shard, cnt) VALUES ($1, floor(random() * 16), 1)
ON CONFLICT (post_id, shard) DO UPDATE SET cnt = post_likes_counter.cnt + 1;
-- Read
SELECT sum(cnt) FROM post_likes_counter WHERE post_id = $1;
~~~

### Choose by accuracy requirement
- **Money, sellable inventory** need accuracy at decision time: use conditional update on DB, split into buckets if too hot, keep transaction extremely short.
- **Likes, views, statistics**: tolerate a few seconds of delay → Redis or append-only + rollup.

### Real-world example
Table {{daily_revenue}} has one row per day updated by every payment transaction in the same transaction as writing the payment. Peak hour 1,500 transactions/second: payment p99 rises to 2.4 seconds, deadlock appears when combined with balance updates. Switch to append-only: each transaction INSERTs its own revenue row (no contention), a job every minute rolls up into {{daily_revenue}}; dashboard delays at most 1 minute (business accepts). Payment p99 drops to 140ms, deadlocks disappear.

### Sample interview answer
"A continuously updated row becomes a serialization point because each UPDATE holds the row lock until the transaction ends; that row's throughput is limited by transaction length, not DB power. I handle it depending on the accuracy requirement. For money or inventory that must be correct at decision time, I keep conditional updates on the DB, put them at the end of the transaction, and keep the transaction extremely short; if it is still too hot, I split inventory into multiple rows. For counters and statistics that tolerate a few seconds of delay, I use a sharded counter, multiple child rows summed on read, or append-only with periodic rollup, or Redis INCRBY synced to DB in batches."

> Senior tip: find hot rows with {{pg_locks}} and {{pg_stat_activity}} under heavy load — many sessions waiting for a lock on the same row is the clearest sign. A "summary statistics" table updated inside a business transaction is a more common cause than you think.`,
    follow: [
      'How to read a sharded counter quickly when there are millions of keys?',
      'How do you sync the counter from Redis to DB without losing or double-counting?',
      'Why does putting the hot-row update at the end of the transaction help reduce contention?'
    ],
  },
  'db-053': {
    q: 'A dashboard aggregating revenue by day and by store runs a GROUP BY query on hundreds of millions of rows every time it opens. How do you use a materialized view or an incremental summary table?',
    a: `**Summary:** Instead of recomputing from raw data on every read, **precompute** the aggregation result. A **materialized view** stores a query result as a table, refreshed with {{REFRESH MATERIALIZED VIEW}} (recomputes everything; {{CONCURRENTLY}} so readers are not blocked, requires a unique index). When data is large and fresher data is needed, use an **incremental summary table**: only add new data since the last run (by time or id), upsert into the summary table.

### Materialized view
~~~sql
CREATE MATERIALIZED VIEW daily_store_revenue AS
SELECT date_trunc('day', paid_at) AS day, store_id, sum(amount) AS revenue, count(*) AS orders
FROM payments GROUP BY 1, 2;
CREATE UNIQUE INDEX ON daily_store_revenue (day, store_id);     -- required for CONCURRENTLY
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_store_revenue;      -- readers not blocked
~~~
Pros: simple, declared in SQL. Cons: every refresh recomputes **everything** — with years of data it gets slower and slower; PostgreSQL has no built-in incremental refresh.

### Incremental summary table
~~~sql
-- Run every 5 minutes: only process days affected by new data
INSERT INTO daily_store_revenue_t (day, store_id, revenue, orders)
SELECT date_trunc('day', paid_at), store_id, sum(amount), count(*)
FROM payments
WHERE paid_at >= date_trunc('day', now()) - interval '1 day'   -- recompute yesterday and today
GROUP BY 1, 2
ON CONFLICT (day, store_id) DO UPDATE
  SET revenue = EXCLUDED.revenue, orders = EXCLUDED.orders;
~~~
Recomputing the recent window (today, yesterday) catches late-arriving data; unchanged old days are not recomputed. If old data can be corrected (refunds), you need a mechanism to flag affected days for recomputation.

### Comparison
| | Materialized view | Incremental summary table | Analytics warehouse (Redshift, ClickHouse) |
|---|---|---|---|
| Freshness | By refresh schedule | A few minutes | Seconds–minutes (via CDC) |
| Cost per update | Recompute everything | Only the new part | Separate infrastructure |
| Complexity | Low | Medium | High |
| Fits | Medium data, dashboard refreshed hourly/daily | Large data, needs fresher data | Many sources, ad-hoc queries |

### Real-world example
An operations dashboard of a retail chain runs GROUP BY on 320 million payment rows: 25 seconds per open, 40 people opening at 8 AM overload the primary DB. Step 1: materialized view refreshed hourly — dashboard opens in 50ms but refresh takes 6 minutes and keeps getting slower. Step 2: switch to an incremental summary table running every 5 minutes (recomputing the 2 most recent days, about 8 seconds), plus an "affected days" table to recompute when there are refunds on old days. Dashboard data delays at most 5 minutes, primary DB no longer overloaded in the morning.

### Sample interview answer
"For a dashboard aggregating over very large data, I precompute results instead of GROUP BY on every open. The simple approach is a materialized view, refreshed with REFRESH CONCURRENTLY with a unique index so readers are not blocked; the downside is every refresh recomputes everything, so it gets slower as data grows. When data is large or fresher data is needed, I use an incremental summary table: a periodic job only recomputes the recent window like today and yesterday, then upserts, with a mechanism to recompute old days when old data is corrected such as refunds. If the need is multi-dimensional analysis across many sources, I send data to an analytics warehouse via CDC instead of working on the transactional DB."

> Senior tip: clearly mark on the dashboard **"data updated at …"**. Just that one sentence prevents most "wrong data" arguments when users compare with the real-time transactional system.`,
    follow: [
      'Why does REFRESH CONCURRENTLY require a unique index?',
      'How do you handle late-arriving data in the summary table?',
      'When should you switch from a summary table to a separate analytics warehouse?'
    ],
  },
  'db-054': {
    q: 'The orders table is continuously status-updated: size grows 3x compared to actual data and queries get slower even with no new rows. How do you diagnose bloat and tune autovacuum, fillfactor, HOT updates?',
    a: `**Summary:** In PostgreSQL, every {{UPDATE}} creates a **new row version**, the old version becomes a "dead tuple" waiting for **VACUUM** to clean. A heavily updated table where autovacuum cannot keep up (default threshold by **20%** of rows — too sparse for large tables) becomes **bloated**: more pages to read, indexes also bloat. Handling: **tune autovacuum per table** (lower thresholds, run faster), leverage **HOT updates** with {{fillfactor}} and avoid updating indexed columns unnecessarily, remove **long transactions** blocking vacuum, and reclaim bloated space with **pg_repack** (no long lock) when needed.

### Why tables bloat
1. {{UPDATE orders SET status = 'SHIPPED'}} writes a new row, old row marked dead.
2. Autovacuum only runs when dead rows exceed {{autovacuum_vacuum_threshold + autovacuum_vacuum_scale_factor × number of rows}} — default 50 + 20%. A 100-million-row table needs 20 million dead rows before cleanup.
3. VACUUM cannot clean versions that an **older transaction can still see** — a long transaction (or a forgotten replication slot, replica with hot_standby_feedback) blocks cleanup across the whole DB.
4. VACUUM usually marks space for reuse, **does not return disk space** to the operating system.

### Diagnosis
~~~sql
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum, n_tup_upd, n_tup_hot_upd
FROM pg_stat_user_tables ORDER BY n_dead_tup DESC LIMIT 10;
~~~
- High dead/live ratio, {{last_autovacuum}} a long time ago → autovacuum not keeping up.
- {{n_tup_hot_upd}} low compared to {{n_tup_upd}} → few HOT updates.
- Estimate bloat with extension {{pgstattuple}} or popular estimation queries.
- Check for long transactions and inactive replication slots.

### Handling
~~~sql
-- Per-table tuning for heavily updated table
ALTER TABLE orders SET (autovacuum_vacuum_scale_factor = 0.01,   -- 1% instead of 20%
                        autovacuum_vacuum_threshold = 10000,
                        fillfactor = 85);                          -- leave 15% of pages for HOT update
~~~
- **HOT update** (Heap-Only Tuple): when updating **no indexed column** and the page has space, PostgreSQL writes the new version on the same page without **updating indexes** → fewer writes, less index bloat. {{fillfactor}} below 100 leaves space for this (fillfactor only applies to data written after the change).
- Avoid redundant indexes on frequently changed columns (e.g., an index on {{updated_at}} makes every update lose HOT).
- Increase global autovacuum resources if many tables need it ({{autovacuum_vacuum_cost_limit}}, number of workers).
- Reclaim bloated space with **pg_repack** (rebuilds table online, short lock) instead of {{VACUUM FULL}} (exclusive lock for the whole process).

### Real-world example
Table {{orders}} with 60 million rows, each order changes status 6–8 times. Size 180GB while actual data is about 55GB; order list queries slow from 40ms to 400ms. Diagnosis: 41 million dead tuples, last autovacuum 9 days ago (20% threshold too sparse), HOT update only 12% because of an index on {{updated_at}}. Handling: scale_factor 0.01, fillfactor 85, drop index on {{updated_at}} (replace with an index on a column actually filtered), run pg_repack once off-peak. Size down to 68GB, HOT update up to 78%, queries back to 35ms.

### Sample interview answer
"In PostgreSQL each UPDATE creates a new row version, the old version waits for VACUUM to clean. For a large table updated continuously, the default autovacuum threshold is about 20% of rows, too sparse, dead tuples accumulate, table and indexes bloat, queries must read more pages. I diagnose with pg_stat_user_tables: number of dead tuples, last autovacuum time, HOT update ratio, and check for long transactions or forgotten replication slots because they block cleanup. Handling includes: setting per-table autovacuum with a small scale factor like 1%; lowering fillfactor to leave room for HOT updates and dropping indexes on frequently changed columns that nobody filters; removing long transactions. Bloated space is reclaimed with pg_repack so the table is not locked long like VACUUM FULL."

> Senior tip: alert on **age of the oldest transaction** and **inactive replication slots**. Most severe bloat incidents (and transaction ID wraparound) stem from a single thing blocking vacuum that nobody noticed.`,
    follow: [
      'How do HOT updates work and when do they not happen?',
      'Why is VACUUM FULL dangerous on production and how is pg_repack different?',
      'How is transaction ID wraparound related to autovacuum?'
    ],
  },
  'db-055': {
    q: '(Roadmap) Database and query optimization: what are the approaches, in what order, and when is each applied? (Summary question, leads to detailed questions in the bank)',
    a: `**Summary:** DB optimization has **8 layers**, from cheap and safe to expensive and complex: (1) query rewrite, (2) indexes, (3) statistics and planner, (4) application and ORM layer, (5) connections, timeouts, server config, (6) cache and read-load splitting, (7) data design, (8) architecture when one DB is no longer enough. Principle: **measure first** (find queries consuming the most total time), fix at the cheapest layer that solves it, **measure again**. Each section below lists detailed question codes in the bank — type the code into the search box to open.

### 0. Measure before fixing
- Find the culprit: pg_stat_statements, slow log, auto_explain, APM → {{db-048}}
- Read execution plans → {{db-003}}, {{sql-033}}; three join algorithms and work_mem → {{db-015}}, {{sql-032}}

### 1. Query rewrite
- NOT EXISTS instead of NOT IN, OR → UNION ALL, LATERAL, CTE, large COUNT(*) → {{db-051}}
- Conditions that lose indexes (functions on columns, type casts, LIKE '%x') → {{db-023}}, {{sql-036}}
- Keyset pagination instead of OFFSET → {{db-005}}, {{sql-034}}; window functions → {{db-017}}
- Upsert and batched writes → {{db-038}}

### 2. Indexes
- B-tree internals, composite, covering → {{db-001}}, {{db-040}}, {{sql-035}}
- Partial, expression, GIN, BRIN, GiST → {{db-013}}; index-only scan → {{db-046}}
- Clustered vs non-clustered (InnoDB) → {{db-022}}, {{db-042}}; UUID primary key → {{db-032}}
- Creating indexes without blocking writes → {{scenario-003}}

### 3. Statistics and planner
- Selectivity, histograms, CREATE STATISTICS → {{sql-031}}
- Execution plans on Oracle → {{db-029}}

### 4. Application and ORM
- N+1 and how to fix → {{jpa-001}}; N+1 bug-fix exercise in the "Fix real bugs" section
- Persistence context, flush, batch processing → {{jpa-002}}; lost update and locks → {{jpa-004}}, {{scenario-119}}
- Export/stream large data → {{db-039}}, {{scenario-010}}

### 5. Connections, timeouts, configuration
- HikariCP sizing → {{db-007}}, {{db-043}}; pool exhaustion → {{scenario-006}}
- PgBouncer / RDS Proxy → {{db-049}}
- statement_timeout, lock_timeout, idle in transaction → {{db-050}}
- MVCC, VACUUM, bloat, HOT update → {{db-012}}, {{db-054}}; wraparound → {{db-047}}

### 6. Cache and read-load splitting
- Read replicas and read-your-writes → {{db-016}}, {{db-044}}
- Cache stampede, Redis → {{scenario-018}}, {{db-024}}
- Materialized views, summary tables → {{db-053}}; split reporting off the primary DB → {{scenario-004}}

### 7. Data design
- Normalization and intentional denormalization → {{db-021}}
- Time-based partitioning → {{db-014}}, {{db-045}}; purging old data → {{scenario-007}}
- Hot rows and hot counters → {{db-052}}
- Multi-tenancy → {{sql-037}}

### 8. Architecture
- Replication, partitioning, sharding → {{db-006}}
- SQL vs NoSQL, choosing the right store → {{db-009}}
- CDC to analytics warehouse → {{aws-059}}

### Order when encountering a slow query
~~~text
Measure (top by total time) → read EXPLAIN (ANALYZE, BUFFERS)
→ estimate off?              → fix statistics (layer 3)
→ excess scan / large sort?  → rewrite query, add/change index (layers 1–2)
→ called too many times?     → fix N+1, cache (layers 4, 6)
→ waiting for lock / pool?   → short transaction, timeout, pooler (layer 5)
→ data too large?            → partition, pre-aggregate, split warehouse (layers 7–8)
~~~

### Real-world example
A payment system has API p99 of 1.9 seconds. Measurement: 3 queries take 70% of DB time. Query 1 (N+1 in transaction list, 400 queries per request) — fixed with a single combined query; query 2 filters {{DATE(created_at)}} losing the index — rewrite by time range; query 3 updates the "today's total" row in every transaction (hot row) — switch to append-only + per-minute rollup. No added hardware, p99 down to 180ms. Partitioning and analytics warehouse split planned for next year based on data growth rate.

### Sample interview answer
"I optimize from cheap to expensive and always measure first. First find the queries consuming the most total time with pg_stat_statements and APM, read EXPLAIN ANALYZE with BUFFERS to know whether the issue is bad estimates, excess scans, large sorts, too many calls, or lock waits. Then fix at the cheapest layer that solves it: rewrite queries to proper patterns, add or change composite indexes, fix statistics; at the application layer fix N+1, batch processing, short transactions. Next connections and timeouts: right-sized pool, PgBouncer, statement and lock timeouts. When read load is high: cache, read replicas, summary tables. Only when data truly exceeds one DB's capacity do we move to partitioning, analytics warehouse split, or sharding. After each change I measure again against the original metrics."

> Senior tip: most systems do not need layers 7–8. Before proposing sharding or changing databases, prove with data that layers 1–6 are all done — in most cases, the top three queries are the whole problem.`,
    follow: [
      'What data do you show management to justify partitioning or sharding?',
      'When a new index slows writes, what do you consider?',
      'Which layer do you check first when p99 spikes right after deploy?'
    ],
  },
});
