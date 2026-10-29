/*
 * English translation of js/data/labs-sql.js — task T448. Format: js/core/i18n.js (content overlay).
 * ids: lab-sql-009 lab-sql-010
 */
App.i18n.content({
  'lab-sql-009': {
    title: 'Nightly sync job takes 6.5 minutes, a manual morning run only 3.5 seconds: stale statistics after a bulk load',
    scenario: `**Context.** The delivery company **ShipNhanh** runs {{shipment-sync}} (Spring Boot 3.3, JdbcTemplate) on PostgreSQL **16.4** (RDS, 8 vCPU / 64 GB). Every night at 01:00, an ETL job uses {{COPY}} to load the partner's new waybills into the {{shipment}} table with {{status = 'PENDING_SYNC'}} and {{batch_id = yyyymmdd}}. As soon as the ETL commits, {{shipment-sync}} runs a SELECT that joins the rate table {{carrier_rate}} (2,140 rows, only a primary key on {{id}}) to compute the shipping fee and then pushes it to the partner system. SLA: it must finish before **01:30**.

**Symptoms (night of October 28, 2026).** The SELECT ran for **389 seconds**, the job finished at 01:31, missed the SLA, and RDS CPU sat at 100% on one core for 6 minutes. At 08:12 in the morning the DBA reran exactly that query with the same parameters: **3.5 seconds**. Nobody changed code or indexes. Two nights last week were the same; on the other nights the job finishes in 20 seconds. One colleague suggested "raise {{work_mem}}", another suggested "add {{pg_hint_plan}} to force a Hash Join".

**What you have.** The PostgreSQL log (with {{auto_explain}} and {{log_analyze = on}}, {{log_buffers = on}}), the plan from the morning rerun, and the statistics tables. Find the root cause and explain why "rerunning it is fast".`,
    questions: [
      'Why did the planner choose a Nested Loop for 2.4 million rows? Point out the misestimated number in the plan and explain where it comes from (based on the statistics snapshot).',
      'Why is the 08:12 rerun fast? Why, even after ANALYZE, is the estimate still off by 7.5 times?',
      'How would you fix it so every night is stable? Evaluate the two suggestions of raising work_mem and using pg_hint_plan.'
    ],
    hints: [
      'Compare rows=1 (estimated) with rows=2398114 (actual) at the Index Scan on shipment node. Then look at loops=2398114 at Seq Scan on carrier_rate.',
      'In snapshot (A): n_mod_since_analyze, last_autoanalyze, and does the most_common_vals of status contain PENDING_SYNC? What time did autoanalyze run, what time did the SELECT start?',
      'The planner multiplies the selectivity of each condition as if they were independent. Are the new batch_id and status PENDING_SYNC independent? Look into CREATE STATISTICS ... (dependencies).'
    ],
    answer: `**Summary:** The ETL had just loaded 2.4 million new rows, but the SELECT started only 4 seconds after the commit, while the statistics were still 3 days old: in those statistics, {{status = 'PENDING_SYNC'}} almost does not exist and {{batch_id = 20261028}} lies outside the histogram, so the planner estimated **1 row** and chose a Nested Loop with a Seq Scan of the rate table on the inner side. In reality there were 2,398,114 rows, so the rate table was rescanned 2.4 million times (5.1 billion comparisons). By morning autoanalyze had run, so the plan switched to a Hash Join. Fix: run {{ANALYZE shipment}} right inside the ETL before commit/signalling, add extended statistics for the correlated column pair, and add an index on {{(carrier_id, zone_code)}} for the rate table as a safety net.

### Background: how the planner "guesses" row counts
PostgreSQL does not count the data before running. It uses a **cost-based optimizer**: for each possible plan (Nested Loop, Hash Join, Merge Join…), it estimates the cost from the **expected row count** of each step, then picks the cheapest one. Expected row counts come from the statistics tables {{pg_statistic}} (viewed through the {{pg_stats}} view), which the {{ANALYZE}} command produces by **sampling** 300 × {{default_statistics_target}} = 30,000 rows.

It is like grocery shopping: you remember "last week four people were eating at home" so you buy 1 kg of meat. Today 30 guests show up but you do not update your information, so you still buy 1 kg. A plan is the same: correct for old data, a disaster for new data.

The main statistics:
| Statistic | Meaning | Used when |
|---|---|---|
| {{reltuples}} | estimated total row count | every estimate |
| {{most_common_vals/freqs}} (MCV) | the common values and their frequencies | {{=}} conditions |
| {{histogram_bounds}} | distribution of the remaining values | {{<}}, {{>}}, BETWEEN conditions |
| {{n_distinct}} | number of distinct values | {{=}} on a value outside the MCV, GROUP BY |

### Root cause, step by step
1. **01:18:37** the ETL commits 2,398,114 new rows, all with {{status = 'PENDING_SYNC'}}, {{batch_id = 20261028}}.
2. **01:18:41** (4 seconds later) the job runs the SELECT. The statistics at this moment are still from the autoanalyze of **October 25**: the MCV of {{status}} only holds {{SYNCED, DELIVERED, CANCELLED, RETURNED}} with frequencies summing to 1.0. According to the statistics there is no room left for any other value, so the selectivity of {{PENDING_SYNC}} ≈ 0. {{batch_id = 20261028}} is also greater than the upper bound of the histogram (20261024), so it too is guessed to be very small. Multiply two small selectivities → the estimate is clamped to the minimum **rows=1**.
3. With "1 row" on the outer side, a Nested Loop is the cheapest: "scan the 2,140-row rate table once, compare, done". No hash table to build. The estimated cost of the whole query is only **59.68**.
4. In reality the outer side returns 2,398,114 rows, so the inner side (Seq Scan carrier_rate) runs **2,398,114 times**, each time reading 2,140 rows and discarding 2,139: 2,398,114 × 2,139 = **5,129,565,846** rows removed by the Join Filter. There is no index on {{(carrier_id, zone_code)}}, so every iteration is a full table scan.
5. **01:21:07** the new autoanalyze finally runs (the 3 workers were busy vacuuming two other large tables). But the plan of the running query was locked in at 01:18:41: **a plan does not change mid-flight**, so the query keeps running until 01:25:10.
6. **08:12** rerun: the statistics are fresh, the estimate is 319,412 rows → the planner chooses a Hash Join: read the rate table **once**, build a 133 kB hash table, then every shipment row only does an O(1) hash lookup. 3.5 seconds.

~~~text
Nested Loop (stale statistics)                Hash Join (fresh statistics)
for s in shipment(2,398,114 rows):            h = hash(carrier_rate)   -- once, 2,140 rows
   for r in carrier_rate(2,140 rows):         for s in shipment(2,398,114 rows):
      if match: emit                             r = h.get(s.carrier_id, s.zone_code)
=> 5.13 billion comparisons, 389 s           => 2.4 million hash lookups, 3.5 s
~~~

**Why do the other nights not go wrong?** It is a race: if autoanalyze happens to run before the job starts (an idle worker), the plan is right. On the night of October 28 all 3 autovacuum workers were busy, so analyze was nearly 3 minutes late. The auto-analyze threshold is 50 + 0.1 × 15,604,220 = 1,560,472 changes, so 2.4 million new rows **do** exceed it; the point is that autovacuum runs **asynchronously** and does not guarantee "right after commit".

### Why it is still off by 7.5 times after ANALYZE
The planner assumes the conditions are **independent** and multiplies selectivities: sel(batch_id = 20261028) ≈ 2.4/18.0 = 0.133 and sel(status = PENDING_SYNC) ≈ 0.133 → 0.133 × 0.133 × 18,002,334 ≈ **319 thousand**. But the two columns are **perfectly correlated**: every row of a new batch is PENDING_SYNC. The truth is 2.4 million. Tonight's 7.5× miss still landed on the correct Hash Join, but with a larger table or a smaller batch the plan can flip again. The way to tell the planner:
~~~sql
-- Multi-column statistics: the planner learns "if you know batch_id you almost know status"
CREATE STATISTICS shipment_batch_status_dep (dependencies)
  ON batch_id, status FROM shipment;
ANALYZE shipment;   -- extended statistics only have data after ANALYZE
~~~

### Evidence
- Log 01:25:10: **"Nested Loop (cost=0.56..59.68 rows=1 ...) (actual ... rows=2398114 loops=1)"**: estimate 1, actual 2.4 million.
- **"Seq Scan on carrier_rate r ... loops=2398114"** and **"Rows Removed by Join Filter: 5129565846"**: the rate table was rescanned 2.4 million times. **"Buffers: shared hit=43166052"** = 18 pages × 2,398,114 iterations: everything from RAM, so the problem is CPU, not I/O (consistent with 100% CPU on one core).
- Timeline: COMMIT **01:18:37.415**, SELECT starts **01:18:41.006**, autoanalyze **01:21:07**, the query ends **01:25:10** (01:18:41 + 389.6 s).
- Snapshot (A): {{n_mod_since_analyze = 2398114}}, {{last_autoanalyze = 2026-10-25}}, {{reltuples = 15604220}} while {{n_live_tup = 18002334}}; the status MCV has no PENDING_SYNC; the batch_id histogram stops at 20261024.
- 08:12 plan: **Hash Join**, Seq Scan carrier_rate **loops=1**, Execution Time **3498 ms**; estimated rows 319412 vs actual 2398114.

### The fix
**Short term (tonight):**
- Add the step {{ANALYZE shipment;}} at the end of the ETL, **before** telling {{shipment-sync}} to run. ANALYZE only samples 30,000 rows and the log shows it takes about 5 seconds: far cheaper than the 6 minutes of risk.
- Add an index on the rate table: {{CREATE INDEX CONCURRENTLY idx_carrier_rate_carrier_zone ON carrier_rate (carrier_id, zone_code);}}. Even if the planner guesses wrong again and picks a Nested Loop, the inner side becomes an Index Scan (a few microseconds per iteration) instead of scanning 2,140 rows. This is "damage control when the guess is wrong".

**Long term:**
- {{CREATE STATISTICS ... (dependencies)}} for {{(batch_id, status)}} as above.
- Separate a staging table: COPY into {{shipment_staging}} (or partition by {{batch_id}}/day), ANALYZE that small table separately, and merge after processing. With daily partitioning, a brand-new partition always needs an ANALYZE right after loading (autovacuum does not automatically analyze a partitioned parent).
- Tune autovacuum for this table: {{ALTER TABLE shipment SET (autovacuum_analyze_scale_factor = 0.02);}} and raise {{autovacuum_max_workers}} if IO allows. But do not rely on autovacuum for the "load then run immediately" flow, because it is always asynchronous.

**About the two suggestions:**
- **Raising work_mem:** useless. The bad plan is not due to a lack of memory (the Hash needs only 133 kB, no spill). The problem is a wrong estimate.
- **pg_hint_plan forcing a Hash Join:** treats the symptom and hard-codes the plan. When the data changes (a very small batch), a Hash Join can again be the worse choice, and the extension has to be installed and maintained. Fixing the root (correct statistics) is better.

### Prevention and monitoring
- Enable {{auto_explain}} with a sensible {{log_min_duration}} (as here — thanks to it we have last night's plan). In particular, look for **actual rows / estimated rows > 10x** at every node.
- Alert when {{n_mod_since_analyze / reltuples}} > 10% on a hot table.
- {{statement_timeout}} for the job role (say 120 s) so a bad plan cannot occupy the DB for 6 minutes; the job retries after the ANALYZE.

### Common mistakes
- Assuming "we have autovacuum so statistics are always fresh": autovacuum has latency (naptime, worker count, other large tables).
- Rerunning, seeing it fast, and concluding "the DB was just busy then": in fact the plan was different. Always compare plans, not times.
- Indexing only the large table, forgetting the small table on the inner side of the Nested Loop.
- Creating CREATE STATISTICS but forgetting ANALYZE, so it has no effect.

### One-minute spoken answer
"The plan last night was a Nested Loop estimating 1 row but returning 2.4 million, so the rate table was rescanned 2.4 million times, 5 billion comparisons. The estimate was wrong because the job ran 4 seconds after the ETL finished loading while the statistics were still 3 days old: PENDING_SYNC is not in the MCV and the new batch_id is outside the histogram. Autoanalyze ran at 01:21, after the plan was already fixed, so rerunning in the morning used a Hash Join, 3.5 seconds. I would ANALYZE right inside the ETL, add extended statistics for the batch_id/status pair because they are correlated, add an index (carrier_id, zone_code) on the rate table so a wrong guess is not a disaster either, and monitor the actual/estimated rows ratio with auto_explain."

> Senior tip: The pattern "a batch job that runs right after a bulk load is slow, rerunning it is fast" shows up all over data pipelines. My rule: **every large data load (> 10% of the table) must end with an explicit ANALYZE**, just like flushing a cache. And when reading EXPLAIN ANALYZE, the first thing is not to look for a Seq Scan but to find the node whose **estimated rows are off from the actual by orders of magnitude**: almost every bad plan starts there.`,
    rubric: [
      'Point out the rows=1 estimate versus the actual 2,398,114 that made the planner choose a Nested Loop, with the inner Seq Scan on carrier_rate running 2,398,114 times (Rows Removed by Join Filter 5.1 billion)',
      'Explain the stale statistics: autoanalyze last ran on October 25, PENDING_SYNC is not in the MCV, batch_id is outside the histogram; the SELECT ran 4 seconds after commit, autoanalyze at 01:21 after the plan was already fixed',
      'Explain why the rerun is fast (fresh statistics → Hash Join) and why it is still off by 7.5 times (independence assumption, correlated columns → CREATE STATISTICS dependencies)',
      'Propose fixes: explicit ANALYZE in the ETL, extended statistics, index (carrier_id, zone_code) as a safety net, statement_timeout',
      'Correctly rebut work_mem and pg_hint_plan; mention auto_explain monitoring / estimate vs actual ratio'
    ]
  },
  'lab-sql-010': {
    title: 'Only the largest customer is slow at 11 seconds, rerunning in psql takes 40 ms: the prepared statement generic plan',
    scenario: `**Context.** The e-invoicing SaaS **EInvoice** (multi-tenant, one shared database) runs {{invoice-api}} on 12 Spring Boot 3.3 pods, Spring Data JPA (Hibernate 6.4), pgjdbc driver 42.7 (default {{prepareThreshold=5}}), HikariCP 30 connections per pod, PostgreSQL **16.3**. The {{invoice}} table has **60 million** rows across about 4,200 tenants. The data **is heavily skewed**: tenant 7 (the **MegaMart** supermarket chain) accounts for **35%** of the table (21 million rows); 90% of tenants have fewer than 10 thousand invoices.

The "Unpaid invoices" screen calls:
~~~sql
SELECT id, number, amount, due_date FROM invoice
WHERE tenant_id = ? AND status = 'OPEN'
ORDER BY due_date LIMIT 50;
~~~

**Symptoms.** After every deploy or restart, every tenant is fast. About 5–10 minutes later, **only MegaMart** is slow at 9–12 seconds (gateway timeout 10 s), while the other tenants stay under 50 ms. The DBA copies the SQL into psql with {{tenant_id = 7}}: **38 ms**, cannot reproduce it. The team tried restarting pods: that helps for 10 minutes, then it is slow again.

**What you have.** The auto_explain log from production, the results of the DBA's experiment in psql, table statistics, and time-series metrics.`,
    questions: [
      'Why does the same SQL with parameter 7 take 11.8 seconds in production but only 38 ms in psql? Explain the custom plan / generic plan mechanism and the role of the pgjdbc prepareThreshold.',
      'Why was the generic plan chosen even though it is terrible for tenant 7, and why does the problem only appear 5–10 minutes after a restart?',
      'Propose fixes (short term and long term) so every tenant, large or small, is fast. Compare at least 3 options.'
    ],
    hints: [
      'Compare the plan in auto_explain with the DBA\'s plan (1): is the condition "tenant_id = $1" or "tenant_id = 7"? Which index is used?',
      'A generic plan does not know the value of $1, so it has to use an "average" estimate: 60,004,118 / n_distinct 4200 ≈ 14,286 rows. Tenant 7 actually has 21 million.',
      'PostgreSQL builds a custom plan for the first 5 EXECUTEs, then compares the generic cost with the average custom cost. pgjdbc only uses a server-side prepared statement from the 5th execution on the same connection. An index on (tenant_id, status, due_date) makes both kinds of plan good.'
    ],
    answer: `**Summary:** In production the query runs as a **prepared statement**; after a few executions on each connection, PostgreSQL switches to a **generic plan** (one plan shared by every value of {{$1}}), optimized for the "average" tenant of ~14 thousand rows: fetch all of the tenant's invoices then sort. For MegaMart (21 million rows) that plan reads 1 million pages and takes 11.8 seconds. psql uses a literal, so it always gets a **custom plan** that sees the value 7 and chooses to follow the {{due_date}} index, 38 ms. The real fix is an index on {{(tenant_id, status, due_date)}} (or a partial index {{WHERE status = 'OPEN'}}) so that a single plan is good for every tenant; short term you can set {{plan_cache_mode = force_custom_plan}} for the application role.

### Background: prepared statements, custom plans and generic plans
Every SQL statement goes through: parse → rewrite → **plan** (choose how to run it) → execute. Planning takes time (usually 0.1–5 ms), so a prepared statement allows **plan once, execute many times**.

PostgreSQL has two kinds of plan for prepared statements:
| | Custom plan | Generic plan |
|---|---|---|
| Built when | every EXECUTE, **knowing** the parameter values | once, **without knowing** the values |
| Estimate | uses the MCV: tenant 7 → 35% of the table | uses the average: 1 / n_distinct |
| Planning cost | every time | cached, almost 0 |
| Risk | burns planner CPU | badly wrong when the data is skewed |

The default algorithm ({{plan_cache_mode = auto}}): the **first 5 EXECUTEs** always use a custom plan. From the 6th on, PostgreSQL builds a generic plan and compares its **estimated cost** with the **average cost of the 5 custom plans** (plus the planning cost). If the generic is not significantly more expensive, it uses the generic **forever** for that prepared statement on that connection.

The second layer is the driver: pgjdbc defaults to {{prepareThreshold=5}}: for the first 4 executions a PreparedStatement runs as an unnamed statement (always replanned like a custom plan), and only from the 5th execution on does it create a **server-side named prepared statement**. Combining the two layers: on each connection, from roughly the 10th execution onward this query may switch to a generic plan.

### Root cause, step by step
1. After a restart there are 360 fresh connections and every query is a custom plan → tenant 7 uses the {{due_date}} index: walk in due-date order, filter tenant 7 + OPEN, and because tenant 7 is 35% of the table it only needs to read ~4,177 rows to get 50. Fast.
2. Most calls are from small tenants. A small tenant's custom plan: bitmap on {{idx_invoice_tenant}} then sort a few thousand rows, low cost (~a few thousand).
3. After ~10 executions on a connection, PostgreSQL tries the generic plan: {{tenant_id = $1}} is estimated at **60,004,118 / 4200 ≈ 14,286** rows (matching {{rows=14286}} in the Bitmap Index Scan), times 0.12 for OPEN → **1,716** rows. Cost 6,874, close to the average custom plan of small tenants → PostgreSQL picks generic.
4. The next request from tenant 7 lands on that connection: the generic plan pulls all **21,004,377** of tenant 7's entries from the index, the bitmap exceeds {{work_mem = 4MB}} so it becomes **lossy** (812,677 lossy blocks, 6,120,488 rows needing recheck), reads ~1 million pages (hit 402,118 + read 611,904), filters out 18,482,260 non-OPEN rows, keeps 2,522,117 then sorts and takes 50. 11.8 seconds.
5. Because each connection flips to generic on its own schedule, after 5–10 minutes most of the 360 connections have "flipped", so MegaMart is slow on nearly every request. A restart clears the plan cache → fast again, then the cycle repeats.

~~~text
Generic plan for tenant 7:
idx_invoice_tenant ──> 21,004,377 TIDs ──> bitmap (lossy, work_mem 4MB)
   ──> read ~1,000,000 heap pages ──> filter OPEN ──> 2,522,117 rows ──> top-N sort ──> 50
Custom plan for tenant 7:
idx_invoice_due_date (already ordered) ──> read 4,177 rows, filter ──> stop once 50 rows are found (thanks to LIMIT)
~~~

### Evidence
- auto_explain: **"Recheck Cond: (tenant_id = $1)"** and **"Index Cond: (tenant_id = $1)"**: the parameter was not substituted at planning time → generic plan. Estimate **rows=14286** vs actual **rows=21004377** (off by 1,470 times).
- **"Heap Blocks: exact=183301 lossy=812677"**, **"Rows Removed by Filter: 18482260"**, **"Buffers: shared hit=402118 read=611904"**, **"duration: 11842.309 ms"**.
- psql (1): literal 7 → **Index Scan using idx_invoice_due_date**, **Rows Removed by Filter: 4127**, **37.751 ms**. psql (2): {{force_generic_plan}} reproduces the production plan **exactly** (cost 6874.21, rows=1716), while {{force_custom_plan}} gives back the fast plan: proving the cause is the plan type, not load or cache.
- Statistics: tenant 7 has frequency **0.3501** in the MCV, n_distinct **4200**; 60,004,118 / 4200 = 14,286.
- Metrics: restart at 10:02, tenant 7 p99 is 41 ms; at 10:07 it jumps to 6.9 s; the other tenants do not change.

### The fix
| Option | Pros | Cons |
|---|---|---|
| Index {{(tenant_id, status, due_date)}} | One good plan for every tenant, even generic: Index Scan in the right order, reads exactly 50 rows | Uses space, slightly slower writes |
| Partial index {{(tenant_id, due_date) WHERE status = 'OPEN'}} | Much smaller (only 12% of the rows) | Only serves queries with a literal {{status = 'OPEN'}} |
| {{ALTER ROLE invoice_app SET plan_cache_mode = force_custom_plan}} | No deploy needed, applies to new connections | Every query pays planning every time, CPU rises; hides the missing index |
| pgjdbc {{prepareThreshold=0}} | Never uses named statements | Loses the prepared benefit for every query; easy to forget why |
| Split out the large tenant (partition by tenant, separate DB) | Isolates the noisy neighbour | Large, architectural change |

**Short term (today):** {{CREATE INDEX CONCURRENTLY idx_invoice_tenant_open_due ON invoice (tenant_id, due_date) WHERE status = 'OPEN';}} (no write lock). While the index builds, set {{plan_cache_mode = force_custom_plan}} for the application role then rotate the connections (Hikari {{softEvictConnections}} via JMX, or a rolling restart) so it takes effect.

**Long term:** the multi-tenant index design rule: **the first column is always tenant_id, then the equality-filter columns, and finally the ORDER BY column**. With a LIMIT query, an index in the right order lets the scan stop early instead of sorting millions of rows. Track large tenants with tenant-labelled metrics (top-N tenants), and performance-test with skewed data.

### Prevention
- auto_explain with {{log_parameter_max_length}} (PostgreSQL 16+) to see the parameters; the tell-tale sign of a generic plan is {{$1}} inside the Index Cond.
- When reproducing in psql, **always also try PREPARE + force_generic_plan**, not just the literal.
- p99 per tenant dashboard: the system-wide average (8 ms) hides one tenant at 11 seconds.

### Common mistakes
- "psql is fast but the app is slow → it is the network/app": in fact the plans are different.
- Restarting as a cure: it only resets the plan cache, and the problem comes back after a few minutes.
- Raising {{work_mem}}: fewer lossy blocks, a bit faster, but it still reads 21 million rows.
- Thinking Hibernate "inlines" parameters: Hibernate always binds parameters through a PreparedStatement.

### One-minute spoken answer
"Production uses prepared statements. After about 10 executions on each connection, PostgreSQL switches to a generic plan because its estimated cost is comparable to the custom plans of small tenants. The generic plan does not know tenant_id so it guesses 14 thousand rows, chooses a bitmap by tenant then sorts. For MegaMart with 21 million rows that plan reads 1 million pages, 11.8 seconds. psql uses a literal so it gets a custom plan that follows the due_date index and stops early after 50 rows. I confirmed it with PREPARE and force_generic_plan, reproducing the exact plan. The real fix is an index on tenant_id, due_date where status OPEN so every plan is good; temporarily force_custom_plan for the application role."

> Senior tip: In multi-tenant systems, **data skew + prepared statements** is a classic dangerous combination: the "average" does not represent the biggest customer, and the biggest customer is usually the one paying the most. I always check the {{most_common_freqs}} of the tenant_id column; if any tenant is > 5% of the table, every per-tenant query must have its index designed so that the plan **does not depend** on knowing the parameter value.`,
    rubric: [
      'Recognize that the production plan is a generic plan (tenant_id = $1) while psql with a literal is a custom plan; explain the mechanism of 5 custom plans then cost comparison, and pgjdbc prepareThreshold=5',
      'Compute the estimate 60,004,118/4200 ≈ 14,286 rows versus the actual 21,004,377 for tenant 7 (35% skew), citing lossy blocks, Rows Removed by Filter, buffers, 11.8 s',
      'Explain why only the large tenant is affected and why the problem comes back 5–10 minutes after a restart (per-connection plan cache)',
      'Propose the real fix with an index on (tenant_id, status/due_date) or a partial index, plus the temporary force_custom_plan option and a trade-off evaluation',
      'Explain how to reproduce it correctly (PREPARE + plan_cache_mode) and how to monitor per tenant / with auto_explain'
    ]
  }
});
