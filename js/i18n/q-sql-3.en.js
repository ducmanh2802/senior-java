/*
 * English translation of js/data/q-sql.js — task T184. Format: js/core/i18n.js (content overlay).
 * ids: sql-017 sql-018 sql-019 sql-020 sql-021 sql-022
 */
App.i18n.content({
  'sql-017': {
    q: "Your plan shows {{rows=12000000}} but {{actual rows=20000}} – the planner is off by 600x and picked the wrong plan, even though you have already run {{ANALYZE}}. Explain which statistics the PostgreSQL planner uses to estimate row counts ({{pg_stats}}), which situations make estimates drift even with fresh statistics, and how you fix it?",
    a: `**Summary:** The planner estimates the **selectivity** of each WHERE predicate from the statistics produced by {{ANALYZE}} ({{most_common_vals}}, {{histogram_bounds}}, {{n_distinct}}, {{null_frac}}, {{correlation}} in {{pg_stats}}), **multiplies the ratios together**, then multiplies by the table's {{reltuples}}. Large drift usually comes from **correlated** columns (breaking the independence assumption), a **strongly skewed** distribution (the value you look for sits outside the top values), statistics going stale between two data loads, and a **generic plan** with {{PreparedStatement}}.

### How the planner computes it
For {{WHERE status = 'PAID' AND amount > 1000000}} on a table with {{reltuples}} = 20 million:
1. {{status = 'PAID'}}: if 'PAID' is among most common values, take the exact ratio (e.g. 30%); if not, estimate it from the histogram, and factor in {{null_frac}} and {{n_distinct}}.
2. {{amount > 1000000}}: find the bucket in the histogram and take the share of that interval.
3. Multiply the two ratios: {{20,000,000 x 0.3 x 0.01 = 60,000}} – assuming the **two columns are independent**. If 90% of PAID orders have amount > 1,000,000, the true number is 5,400,000, i.e. the estimate of 60,000 is **90x lower than reality**.

### Situations that drift even with fresh statistics
| Situation | Why the estimate is wrong | How to fix |
|---|---|---|
| Two **correlated** columns (PAID always comes with a large amount) | independent multiplication ⇒ errors accumulate | {{CREATE STATISTICS st_pair (dependencies) ON status, amount FROM sales;}} then {{ANALYZE sales;}} |
| Skewed distribution: 99% of rows carry the common value, the value you look for is outside the top MCVs | a value outside the MCVs can only be estimated with the average histogram | raise {{default_statistics_target}} for the hot table then {{ANALYZE}} |
| Bulk load / changed pattern between two {{ANALYZE}} runs | statistics describe the past | {{ANALYZE}} after ETL; check {{pg_stats}} per child table of the partition |
| {{PreparedStatement}} becomes a **generic plan** | the planner does not know the parameter values | {{SET plan_cache_mode = force_custom_plan;}} for the critical statement, or rewrite with literals/JOIN |
| Condition wrapped in a function / cast ({{lower(email) = ...}}) | there are no statistics for that expression | rewrite the query SARGable, or create a dedicated expression index on {{lower(email)}} |
| Joins across many tables | errors **compound** through each step | statistics for join columns, rewrite the query, change the join order |

- Raise {{default_statistics_target}} (100 → 500) for tables queried in many shapes: a denser histogram, but a longer {{ANALYZE}} and a bigger catalog – do it only for a few hot tables.
- {{CREATE STATISTICS st_pair (dependencies, ndistinct) ON status, amount FROM sales;}} (the kinds available are {{dependencies}} and {{ndistinct}} since PostgreSQL 10, {{mcv}} since PostgreSQL 12) for column combinations that often appear together, then {{ANALYZE sales;}} so the planner picks it up.
- Quick look at the statistics: {{SELECT attname, n_distinct, most_common_vals FROM pg_stats WHERE tablename = 'sales';}}

### Does a bad estimate always mean a bad plan?
Not necessarily. Cost is computed on the very same estimates, so the planner still picks "the best plan **according to its own model**". The problem is that a large drift ⇒ a plan good for hypothetical data, and it collapses when the real data changes. Act only when you see both: a strong drift at a key node **and** a high actual runtime.

### Production pitfalls
- Running {{ANALYZE}} in the middle of a bulk insert ⇒ half-finished statistics, and a "half-finished" plan follows.
- Raising the statistics target for the entire database ⇒ a bloated catalog and planning time growing for nothing.
- After changing an index or adding a trigger, the plan can change even though the SQL did not – re-measure after every infrastructure change.

> Senior tip: I diagnose in this order: (1) compare the estimated {{rows}} with {{actual}} at the top node; (2) open {{pg_stats}} for the WHERE columns – are there MCVs, what is {{n_distinct}}, what is the correlation; (3) try {{CREATE STATISTICS}} for the pair that goes together, then {{ANALYZE}}. About 70% of the big drift cases I have seen came from correlated columns or rare values, not "stale statistics".`,
    follow: [
      'How does {{CREATE STATISTICS}} change the plan the planner produces after {{ANALYZE}}?',
      'How do a generic plan and a custom plan differ, and which parameter tunes that?'
    ]
  },

  'sql-018': {
    q: "The {{message(id, thread_id, recipient_id, is_read, created_at, preview)}} table has hundreds of millions of rows with two hot queries: a user's inbox that only shows **unread** messages, and a per-thread report that only needs {{thread_id}} + {{created_at}}. Which indexes do you design, how do {{partial index}} and {{covering index (INCLUDE)}} work, why can a bind-parameter query not use the partial index, and how do you verify it?",
    a: `**Summary:** Query (1) touches only ~1% of unread messages ⇒ a **partial index** (an index holding only rows matching {{WHERE is_read = false}}) is small and exactly on target. Query (2) needs only two columns ⇒ a **covering index** with {{INCLUDE (created_at)}} so it runs an {{Index Only Scan}} and never touches the table.

### Proposed indexes
~~~sql
-- (1) a user's unread inbox
CREATE INDEX CONCURRENTLY idx_msg_unread
  ON message (recipient_id, created_at DESC)
  WHERE is_read = false;

-- (2) per-thread report, only thread_id + created_at needed
CREATE INDEX CONCURRENTLY idx_msg_thread_cover
  ON message (thread_id) INCLUDE (created_at);
~~~

### How the partial index works
- The index only stores rows matching the predicate **at build time** (matching rows inserted later are added too). If 98% of messages are read, the index is only 2–5% the size of the table ⇒ less RAM, fewer page reads, and cheaper writes than a full index.
- The planner uses it only when the query's WHERE **implies the index predicate**:
  - {{WHERE recipient_id = $1 AND is_read = false}} → right, it can be used.
  - {{WHERE recipient_id = $1 AND is_read = $2}} with {{is_read = false}} as designed: under a **generic plan** the planner knows nothing about the value of {{is_read}} ⇒ it cannot prove it ⇒ **skips the index**; a custom plan (the first few runs with concrete values) can use it.
  - In practice: keep the predicate a **constant inside the SQL** (write {{is_read = false}} directly) even though the rest still binds parameters.
- {{is_read}} sits in the predicate, so it does not need to be a key column; the first key column must be {{recipient_id}} because almost every query is per user.

### Covering index and Index Only Scan
- {{INCLUDE (created_at)}} appends a **non-key** column to the index leaves: it does not take part in seeking (does not change the key-selection arithmetic) but lets the query be answered entirely from the index.
- The remaining condition is the **visibility map**; the planner is only sure it can skip the heap when every involved page has been marked visible by {{VACUUM}} ⇒ watch {{Heap Fetches}} in the plan.
- Do not cover large columns like {{preview}} or a {{jsonb}} column holding long JSON – a bloated index drags down every {{INSERT}}/{{UPDATE}} on the hot table.

### Verifying
~~~sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT thread_id, created_at FROM message
WHERE thread_id = 42 ORDER BY created_at DESC LIMIT 50;
-- expected: Index Only Scan using idx_msg_thread_cover ... Heap Fetches: 0
~~~
- Per-index usage: {{SELECT relname, idx_scan FROM pg_stat_user_indexes WHERE relname = 'message';}} – an {{idx_scan}} stuck at 0 for a long time means that index should be dropped.
- Before/after: compare {{actual time}}, {{Buffers}} of the read query **and** write latency (INSERT/UPDATE) on the write-heavy table.

### Production pitfalls
- A partial index gets skipped when the query's WHERE cannot **imply** the index predicate: {{WHERE is_read = false OR recipient_id = $1}}, {{WHERE COALESCE(is_read, false) = false}}… the planner cannot prove it ⇒ a full scan it is.
- No {{ANALYZE}} after creating the partial index ⇒ the planner mis-estimates the number of rows inside the index and still picks a seq scan.
- Plain {{CREATE INDEX}} locks writes; a live table must use {{CONCURRENTLY}} (runs in the background, no lock) – in exchange, an interruption leaves an INVALID index behind that you must drop and redo.
- A covering index can replace {{SELECT *}} for the covered columns, **not** for filter/orderBy columns missing from the index.

> Senior tip: "a user's unread inbox is slow" is a classic question. A strong answer has two parts: the partial index on {{(recipient_id, created_at)}} {{WHERE is_read = false}} – a few dozen times smaller; and being able to explain **why a bind-parameter query cannot use the partial index**. That second detail is what separates people who have used indexes from people who have debugged plans.`,
    follow: [
      'How does {{INCLUDE}} differ from a regular column in a composite index, and when do you pick which?',
      'When the partial index predicate is a value the user chooses (e.g. per tenant), how do you handle it?'
    ]
  },

  'sql-019': {
    q: "The {{app_session(user_id, start_ts, end_ts)}} table records app sessions; sessions **can overlap** (multiple devices, a client sending them out of order). You need to merge overlapping intervals into unified sessions per user ({{MIN(start_ts)}}, {{MAX(end_ts)}}) and then compute total online time. How do you write the query, and how does it differ from gaps-and-islands for consecutive-day streaks?",
    a: `**Summary:** With **overlapping** intervals the {{date - row_number}} trick does not work. Instead, use an **island marker from a running max**: a new island opens when the current row's {{start_ts}} exceeds the {{MAX(end_ts)}} of **all preceding rows**, otherwise the row merges into the open island. Cumulatively sum the flag with {{SUM}} into an island number ({{grp}}), and finally {{GROUP BY user_id, grp}}.

### The query (PostgreSQL)
~~~sql
WITH seq AS (
  SELECT s.user_id, s.start_ts, s.end_ts,
         -- max end_ts of ALL preceding rows (frame excludes the current row)
         MAX(s.end_ts) OVER (
           PARTITION BY s.user_id
           ORDER BY s.start_ts, s.end_ts
           ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
         ) AS prev_max_end
  FROM app_session s
),
flagged AS (
  SELECT f.*,
         CASE WHEN f.prev_max_end IS NULL
                   OR f.start_ts > f.prev_max_end
              THEN 1 ELSE 0 END AS new_island
  FROM seq f
),
islands AS (
  SELECT g.*,
         SUM(g.new_island) OVER (
           PARTITION BY g.user_id ORDER BY g.start_ts, g.end_ts
           ROWS UNBOUNDED PRECEDING) AS grp
  FROM flagged g
)
SELECT user_id, grp,
       MIN(start_ts) AS session_start,
       MAX(end_ts)   AS session_end,
       -- merged-island duration = width of the half-open [min start, max end)
       -- (do NOT sum per-row durations – overlap would be double counted)
       EXTRACT(EPOCH FROM (MAX(end_ts) - MIN(start_ts))) AS online_seconds
FROM islands
GROUP BY user_id, grp
ORDER BY user_id, session_start;
~~~

### Why the marker is correct
Say three sessions overlap and then a separate one: [1,10], [2,3], [5,6], [11,12].
| start | prev_max_end | start > prev_max_end | island |
|---|---|---|---|
| 1 | NULL | – | 1 (open) |
| 2 | 10 | no | 1 (merge) |
| 5 | 10 | no | 1 (merge) |
| 11 | 10 | yes | 2 (open) |

{{prev_max_end}} is the max over **every preceding row**, so when an interval starts after that value it cannot overlap any interval seen so far ⇒ a new island begins. The frame {{ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING}} is the crux: it **excludes the current row** from the max, otherwise every row would "match" itself.

### Versus gaps-and-islands for consecutive-day streaks
| | Consecutive-day streak (sql-007) | Overlapping intervals |
|---|---|---|
| Input | discrete day markers, no overlaps | intervals that may overlap |
| Grouping key | {{date - row_number}} | flag {{start > prior max(end)}} |
| Why that trick | every island sits exactly 1 unit apart | lengths and gaps are arbitrary |
| Key window function | {{ROW_NUMBER}} | {{MAX(end_ts)}} with frame {{... AND 1 PRECEDING}} |

### Edge cases
- {{end_ts IS NULL}} (a session still open): normalise **before** running the window ({{COALESCE(end_ts, now())}} or drop the row), because PostgreSQL's {{MAX}} ignores NULLs and would make {{prev_max_end}} wrongly low.
- A client sends {{start_ts > end_ts}}: filter {{WHERE end_ts >= start_ts}} and report the source-data error.
- Exact duplicate rows: {{SELECT DISTINCT}} or a unique index {{(user_id, start_ts)}}.
- **Summing per-row durations is wrong** because the overlap gets counted twice – merge first, then sum (as the query above does).
- To merge per device, add {{device_id}} to {{PARTITION BY}}.

### Performance
- An index on {{(user_id, start_ts, end_ts)}} both serves the window sort (skipping the sort) and covers all columns for an {{Index Only Scan}}.
- The window forces a sort by {{PARTITION BY}} + {{ORDER BY}}; with hundreds of millions of sessions, aggregate per day and then merge, or pre-compute the merged sessions into a separate table.

> Senior tip: the key question with any "consecutive streak" problem is **do the intervals overlap**. If they do, every {{date - row_number}} formula is wrong. I always draw three intervals on the whiteboard and walk through the running {{max(end)}} so the interviewer sees I grasp the essence: the island marker means "the new interval's start has passed beyond the widest end I have seen so far".`,
    follow: [
      'If {{end_ts}} can be NULL, how do you change the query?',
      'How do you compute online time **per day** when a session spans midnight?'
    ]
  },

  'sql-020': {
    q: 'On the {{sales(region, product, sale_date, amount)}} table, the sales team needs a report with totals by {{(region, product)}}, totals by {{region}}, totals by {{product}} and a grand total – all in a **single** pass instead of four {{UNION ALL}} statements. How do you write it, what does {{GROUPING()}} do, and how does {{ROLLUP}} differ from {{GROUPING SETS}}/{{CUBE}}?',
    a: `**Summary:** Use {{GROUP BY GROUPING SETS (...)}}, {{ROLLUP}} or {{CUBE}} – the planner gathers **several aggregation levels into a single read of the data** instead of scanning four times. Whichever column is aggregated comes back as NULL ⇒ distinguish a "total" NULL from a real NULL with {{GROUPING(col)}}.

### The query
~~~sql
SELECT CASE WHEN GROUPING(region)  = 1 THEN 'All' ELSE region  END AS region_label,
       CASE WHEN GROUPING(product) = 1 THEN 'All' ELSE product END AS product_label,
       GROUPING(region)  AS g_region,
       GROUPING(product) AS g_product,
       SUM(amount) AS amount
FROM sales
WHERE sale_date >= DATE '2026-01-01'
GROUP BY GROUPING SETS (
  (region, product),   -- detail
  (region),            -- total by region
  (product),           -- total by product
  ()                   -- grand total
)
ORDER BY region_label, product_label;
~~~
Four metric levels in **one** statement, with the {{sale_date}} filter written once. The old way is 4 {{UNION ALL}} statements: the condition repeats 4 times, the code is long, and the planner also has to read/aggregate several passes.

### ROLLUP, CUBE and GROUPING SETS
| Syntax | Levels produced | Number of groups with n columns |
|---|---|---|
| {{GROUPING SETS ((a,b),(a),())}} | exactly the list you enumerate | per the list |
| {{ROLLUP(a, b)}} | {{((a,b), (a), ())}} – **hierarchical** totals from left to right | n + 1 |
| {{CUBE(a, b)}} | every combination: {{(a,b), (a), (b), ()}} | 2^n |
- {{ROLLUP(region, product)}} has the {{(region)}} level but **not** the {{(product)}} level – that is the biggest difference from {{CUBE}}.
- {{GROUPING(region, product)}} returns a bitmask of the columns that **were** aggregated, with the lowest bit for the **last** column of the list ({{product}}): 0 = both present (a detail row), 1 = {{product}} aggregated (a total row by {{region}}), 2 = {{region}} aggregated (a total row by {{product}}), 3 = both aggregated (grand total).
- Support: PostgreSQL/Oracle have all three; MySQL 8 has {{WITH ROLLUP}} and {{GROUPING()}} but **not** {{CUBE}}/{{GROUPING SETS}}.

### Performance and limits
- Look in {{EXPLAIN}}: the data is read **once** and feeds the aggregate levels (the planner can run {{GroupAggregate}} several times over the same sort order, or use {{HashAggregate}}), not four table scans like four {{UNION ALL}} statements.
- Big data and reports during peak hours: {{GROUPING SETS}} saves code and one scan, **not** I/O if every day needs to scan 500 million rows ⇒ pre-aggregate per day into a summary table / materialized view and union from the small table.
- {{CUBE}} over 6 columns produces **64** grouping sets ({{2^n}}) – use it only when you truly need every dimension.

### Production pitfalls
- **Real NULL vs total NULL**: without {{GROUPING()}} you cannot tell "a customer with no region" apart from "the total row of the whole region" – a classic reporting bug when exporting JSON straight to the frontend.
- {{ORDER BY}} after {{GROUP BY}}: use the {{GROUPING(...)}} columns to put detail groups before total rows; do not sort by the label if the label has been replaced by "All".
- Assuming a two-dimensional {{ROLLUP}}: to get a separate {{product}} total you must write {{GROUPING SETS}} or {{CUBE}}; {{ROLLUP(region, product)}} does not produce it.
- A report query without a date {{WHERE}} on the history table ⇒ everything gets scanned, however good the planner's aggregation is.

> Senior tip: when the requester says "give me the total by region and the grand total in one statement", I immediately write {{GROUPING SETS}} with {{CASE WHEN GROUPING(x) = 1}} and then state its limits: "this saves code and one scan; with a 500-million-row-per-day table I would build a summary table". Senior/lead interviewers like hearing you name the **limits** of a solution, not just the syntax.`,
    follow: [
      '{{CUBE}} over 6 columns produces how many groups – should you use it?',
      'How do you tell a real NULL apart from a NULL produced by {{ROLLUP}} when returning JSON to the frontend?'
    ]
  },

  'sql-021': {
    q: "You write a query with several {{WITH}} clauses (CTEs) and it is much slower than the subquery formulation; in another case the CTE version is the faster one. Explain how PostgreSQL's planner treats {{WITH}} – the optimization fence, inlining since version 12, {{MATERIALIZED}}/{{NOT MATERIALIZED}} – and when you deliberately force it or not, especially for a CTE referenced twice or holding a heavy aggregate.",
    a: `**Summary:** Before PostgreSQL 12, **every CTE was an optimization fence**: the planner could not look inside, executed it exactly once, stored the result (materialized) and reused it. Since PostgreSQL 12 the planner is **allowed to inline** the CTE into the subquery (as if written nested) when it is referenced once and is a plain SELECT ⇒ the outer query's filters get pushed into it, and the planner is free to choose the join order. {{MATERIALIZED}} / {{NOT MATERIALIZED}} is the switch that forces the planner to obey.

### Inline rules since PostgreSQL 12
A CTE is inlined when **all** the following hold:
1. It is not {{WITH RECURSIVE}}.
2. It is referenced **exactly once** by the parent query (twice and the planner materializes it to avoid recomputing).
3. **No side effects**: it is a SELECT without volatile functions, and it holds no data-modifying statement ({{WITH x AS (INSERT ... RETURNING ...)}} is always executed separately, exactly once).
4. You did not write {{MATERIALIZED}}.

### When to keep the CTE materialized
- The CTE is referenced **twice** (joined against both arms): the planner materializes it, computes once and reuses – that is the CTE's "real" purpose, and before PostgreSQL 12 every CTE behaved that way.
- Force {{MATERIALIZED}} when you want to **pin the behaviour**: the CTE holds expensive computation ({{DISTINCT}}, an aggregate, a window over a large set) and you do not want an upgrade or a statistics change to nest it or recompute it – the goal is a plan that stays **stable**, not a faster one.
- One honest point: a once-referenced CTE that is mostly a filtering layer usually gets **slower** when materialized, because the planner cannot push the outer predicates into it.

### When to let the planner inline
- The CTE is just a **naming layer** over complex filtering/sorting, and the outer query adds more predicates ⇒ inline so the planner can merge conditions and choose a better join order.
- Write {{NOT MATERIALIZED}} to force inlining even when the CTE is referenced twice: the planner can push predicates to each usage site (e.g. a CTE joined with itself) – in exchange it may compute the CTE several times, so do it only after measuring a benefit.
- Do not assume a CTE is "faster than a subquery" by default: both are just **code constructs**; the real difference lies in the fence and inlining.

### Verifying
~~~sql
EXPLAIN (ANALYZE, BUFFERS) WITH x AS (...) SELECT ...;
-- CTE Scan on x        -> materialized (computed once, stored)
-- the inner node appears directly (e.g. a Seq Scan) and the outer
--   predicate was pushed in, with no CTE Scan  -> inlined
~~~
- Run both formulations and compare the nodes, the CTE's {{actual rows}}, plus {{Planning Time}} – deeply nested CTEs plan more slowly.
- With ORMs (Hibernate/JPA) that emit {{WITH}} referenced twice ⇒ always materialized; do not assume it will inline.

### Production pitfalls
- **Upgrading to PostgreSQL 12+ changes plans**: an old query can get faster or slower even though the SQL is unchanged. Re-measure the critical queries after the upgrade.
- Forcing {{MATERIALIZED}} in the wrong place: the planner must compute the whole subset although the outer query needs 1% ⇒ wasted CPU and RAM (a materialized CTE sits in work_mem; a large one spills to disk).
- A CTE referenced twice + a large result set: multiplies memory consumption; consider rewriting it as a join over the filtered set.
- An unstable plan can also come from generic/custom plans and statistics – rule each cause out before blaming the CTE.

> Senior tip: my rule is "a CTE is a **readability** tool, not an optimization tool". I write CTEs for clarity and then measure with {{EXPLAIN (ANALYZE)}}; when the plan flips after an upgrade or the estimates drift, I pin the behaviour with {{MATERIALIZED}}/{{NOT MATERIALIZED}} and note the **why** right in the SQL. Talking to the interviewer, the impressive answer is: "since PostgreSQL 12 a CTE is no longer a fence by default, so I always look for a {{CTE Scan}} or {{Subquery Scan}} node in the plan before concluding".`,
    follow: [
      'How do you check whether your CTE has been inlined?',
      'Why does a CTE referenced twice make the planner materialize it?'
    ]
  },

  'sql-022': {
    q: 'Your report over a 400-million-row table always runs on a single worker even though the machine has many idle cores. Explain how PostgreSQL decides to go parallel (the cost model, the {{Gather}} node), which conditions make the planner unable to parallelize, what you tune – and when you should **not** force parallelism.',
    a: `**Summary:** Parallel query is **cost-based**, not an on/off switch: the planner prices the divide-the-work option ({{parallel_setup_cost}} + {{parallel_tuple_cost}} + the benefit of splitting the scan) and compares it with the serial option. Choosing parallel yields a {{Gather}} node in the plan (or {{Gather Merge}} when results must be merged in order). Idle cores do **not by themselves** make the plan parallel – if you see a single worker, either the cost does not justify it or some condition forbids parallelism.

### What a parallel plan looks like
~~~sql
Gather  (cost=1000.00..412000.00 rows=3800000 width=48)
             (actual time=84.2..1210.5 rows=3760000 loops=1)
  Workers Planned: 2
  Workers Launched: 2
  -> Parallel Seq Scan on sales (cost=0.00..411000.00 rows=...)
~~~
- {{Workers Planned}} / {{Workers Launched}}: the planned number of workers versus the number **actually launched**.
- {{Gather Merge}}: merges output from several workers while keeping the order, used when an {{ORDER BY}}/{{LIMIT}} sits above it.
- A worker is a separate process reading from a shared snapshot; spawning and communicating cost something, so small queries are always cheaper serial.

### Conditions and parameters that decide
| Factor | Details |
|---|---|
| Costs | {{parallel_setup_cost}} (default 1000), {{parallel_tuple_cost}} (0.1); the table must exceed {{min_parallel_table_scan_size}} (8MB) |
| Nodes in the parallel portion | {{Parallel Seq Scan}}, {{Parallel Bitmap Heap Scan}}, {{Parallel Index Scan}} (btree only), {{Parallel Hash Join}}; an aggregate splits into {{Partial Aggregate}} then {{Finalize Aggregate}} on the leader |
| GUCs | {{max_parallel_workers_per_gather}} = 2, {{max_parallel_workers}} = 8, {{max_worker_processes}} = 8 (shared by every backend) |
| Custom functions | {{PARALLEL UNSAFE}} by default ⇒ the planner must run serially; mark {{PARALLEL SAFE}} only when you are sure it is safe |
| Data-modifying statements or row locks | {{UPDATE}}/{{DELETE}}, statements with {{FOR UPDATE}}/{{FOR SHARE}}, or a CTE holding a data-modifying statement ⇒ no parallel plan |
| Aggregates with {{DISTINCT}}/{{ORDER BY}}, ordered-set aggregates, {{GROUPING SETS}} | the aggregate step cannot be split (no partial aggregate), although the scan portion may still parallelize |
| Small tables / {{LIMIT 5}} | worker setup costs more than the benefit gained |

- A plan can be parallel yet **fail to obtain workers** at runtime ({{max_worker_processes}}/{{max_parallel_workers}} exhausted), and then the leader runs everything below {{Gather}} itself: the result stays correct while you gain nothing.
- Override per table once you **have measured**: {{ALTER TABLE sales SET (parallel_workers = 4);}}.
- Nudge the planner toward parallelism by lowering costs ({{SET parallel_setup_cost = 250;}}) – but that is an intervention and must come with measurement evidence.

### When you should **not** force parallelism
- A query returning a few thousand rows and already running under ~100ms: spawn + {{Gather}} overhead can eat the whole benefit.
- Slow disks or limited IOPS: many workers reading at once create **I/O contention**, and total time gets worse.
- **Oversubscription**: 32 connections each spawning 4 workers on 8 cores ⇒ hundreds of processes fighting over CPU/disk, and p99 climbs. This is the disaster I have seen most when a team "turns parallel on for everything".

### Workflow
1. {{EXPLAIN (ANALYZE, BUFFERS)}}: is there a {{Gather}} node, how many {{Workers Launched}}, how long does the top node take.
2. A controlled trial: {{SET max_parallel_workers_per_gather = 4;}} then compare {{actual time}}; if it is not better, return to the defaults, and use {{pg_stat_activity}} to see how many workers actually run in parallel.
3. If the query is slow because it scans **too many rows**, parallelism only divides the misery – the right direction is to shrink the data: a tighter filter, partition pruning, indexes, pre-aggregation.

> Senior tip: "plenty of idle cores" has never been a reason to force parallelism. I once watched an infra team set the parallel costs to 0 on a system of 32 connections over 8 cores ⇒ every statement burst out workers, the total process count exceeded the machine, and p99 doubled. My rule: measure with {{EXPLAIN (ANALYZE)}}, track how many workers run concurrently, and remember that parallel query is a **work-splitting algorithm**, not a guaranteed speedup lever.`,
    follow: [
      'When do {{Gather}} and {{Gather Merge}} differ, and why is the merge variant needed?',
      'When is marking a function {{PARALLEL SAFE}} a mistake?'
    ]
  }
});
