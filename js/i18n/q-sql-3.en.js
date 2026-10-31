/*
 * English translation of js/data/q-sql.js — task T553 (redo after the Vietnamese content changed). Format: js/core/i18n.js (content overlay).
 * ids: sql-017 sql-018 sql-019 sql-020 sql-021 sql-022
 */
App.i18n.content({
  'sql-017': {
    q: "Your plan shows {{rows=12000000}} but {{actual rows=20000}} – the planner is off by 600x and picked the wrong plan, even though you have already run {{ANALYZE}}. Explain which statistics the PostgreSQL planner uses to estimate row counts ({{pg_stats}}), which situations make estimates drift even with fresh statistics, and how you fix it?",
    a: `**Summary:** The planner estimates the **selectivity** of every WHERE condition from the statistics that {{ANALYZE}} writes into {{pg_stats}} ({{most_common_vals}}, {{histogram_bounds}}, {{n_distinct}}, {{null_frac}}, {{correlation}}), **multiplies those ratios together**, and multiplies the result by the table's {{reltuples}}. A large drift usually comes from **correlated** columns (the independence assumption breaks), a **strongly skewed** distribution (the value you look for sits outside the top values), statistics going stale between two data loads, and a **generic plan** with {{PreparedStatement}}.

### Quick understanding
The planner is like a delivery dispatcher who only has **summary statistics** and never sees the individual parcels. Ask "how many orders are in Hanoi **and** delivered by motorbike?" and the dispatcher takes "30% of orders are in Hanoi" times "10% of orders go by motorbike" = 3%, because they **assume the two facts are unrelated**. In reality 80% of Hanoi orders go by motorbike, so the true share is 24% – 8 times higher. A wrong row count leads to the wrong vehicle: believing there are few parcels, the dispatcher sends motorbikes (a **nested loop join**, which walks the index once per outer row and is only cheap when there are few rows); in truth there are many parcels, and a **hash join** (build a hash table over the large side once, then probe it for every row of the other side) would have been several times faster. {{ANALYZE}} only refreshes the numbers; it never teaches the planner that two columns are related – that is what {{CREATE STATISTICS}} is for.

### Terms
- **Selectivity**: the fraction of rows that satisfy one condition, between 0 and 1.
- **reltuples**: the estimated row count of a table, stored in {{pg_class}}, refreshed by ANALYZE/VACUUM.
- **MCV (most common values)**: the list of the most frequent values of a column together with their frequencies.
- **Histogram bounds**: cut points that split the remaining values (outside the MCVs) into buckets holding roughly the same number of rows.
- **n_distinct / null_frac**: the estimated number of distinct values / the fraction of NULLs in a column.
- **Extended statistics**: multi-column statistics ({{CREATE STATISTICS}}) that describe the relationship between columns.
- **Generic plan / custom plan**: one plan shared by every parameter value / a plan built for one concrete value (explained below).
- **default_statistics_target**: how many MCV entries and histogram buckets ANALYZE collects per column (default 100).

### Estimation model
~~~text
estimate = reltuples x sel(status='REFUNDED') x sel(refund_state='DONE')   (independence)
         = 20,000,000 x 0.02 x 0.018 = 7,200
reality  = every row with refund_state='DONE' is also REFUNDED
         = 20,000,000 x 0.018 = 360,000                -> 50x off
consequence: the planner believes 7 thousand rows -> picks Nested Loop + Index Scan
             reality is 360 thousand rows -> 360 thousand random index lookups,
             many times slower than one hash join
~~~

### How the planner computes it
For {{WHERE status = 'REFUNDED' AND refund_state = 'DONE'}} on a table with {{reltuples}} = 20 million:
1. **Equality** ({{status = 'REFUNDED'}}): if the value is in {{most_common_vals}}, take the recorded frequency (say 2%). If it is not an MCV, the planner does **not** read the histogram; it spreads the leftovers evenly: (1 − total MCV frequency − {{null_frac}}) / (number of remaining distinct values).
2. **Range** (for example {{amount > 1000000}}): find the matching cut points in {{histogram_bounds}} and interpolate the fraction of rows inside the interval (adding the MCV rows that also satisfy it).
3. Multiply: {{20,000,000 x 0.02 x 0.018 = 7,200}} – assuming the **two columns are independent**. In reality {{refund_state}} only carries a value on refunded orders, so {{refund_state = 'DONE'}} **implies** {{status = 'REFUNDED'}} ⇒ the true number is 360,000 and the estimate is **50x too low**.
4. Multiply by {{reltuples}} to get the node's row estimate; that number then flows up into the join/aggregate nodes above. Why the error is dangerous: every join level multiplies in one more estimate, so errors **compound**.

### Situations that drift even with fresh statistics
| Situation | Why the estimate is wrong | How to fix |
|---|---|---|
| Two **correlated** columns ({{refund_state}} only exists on REFUNDED orders) | independence multiplication ⇒ errors pile up | {{CREATE STATISTICS st_pair (dependencies, mcv) ON status, refund_state FROM sales;}} then {{ANALYZE sales;}} (see the note below on which condition kinds each kind helps) |
| Skewed distribution: 99% of rows carry the common value, the value you look for is outside the top MCVs | values outside the MCVs are estimated as "leftovers split evenly" over every rare value, far from the true one | raise {{default_statistics_target}} for the hot table then {{ANALYZE}} |
| Bulk load / a changed pattern between two {{ANALYZE}} runs | statistics describe the past | {{ANALYZE}} after ETL; check {{pg_stats}} for each child table of the partition |
| {{PreparedStatement}} becomes a **generic plan** | the planner does not know the parameter values | {{SET plan_cache_mode = force_custom_plan;}} for the critical statement, or rewrite with literals/JOIN |
| Condition wrapped in a function / cast ({{lower(email) = ...}}) | there are no statistics for that expression | rewrite the query SARGable, or create a dedicated expression index on {{lower(email)}} (ANALYZE then collects statistics for the index expression); PostgreSQL 14+ also allows {{CREATE STATISTICS}} on expressions |
| Joins across many tables | errors **compound** at every step | statistics on the join columns, rewrite the query to join fewer rows, change the join order |

- Raise {{default_statistics_target}} (100 → 500) for tables queried in many shapes: a denser histogram, but a slower {{ANALYZE}} and a bigger catalog – do it only for a few hot tables.
- {{CREATE STATISTICS st_pair (dependencies, ndistinct) ON status, refund_state FROM sales;}} (the kinds are {{dependencies}} and {{ndistinct}} since PostgreSQL 10, {{mcv}} since PostgreSQL 12) for column combinations that often appear together, then {{ANALYZE sales;}} so the planner picks them up.
- Important: the planner only uses {{dependencies}} statistics for **equality** conditions ({{=}}, and {{IN}} since PostgreSQL 13); for a range condition such as {{status = 'PAID' AND amount > 1000000}} they do not help. There the {{mcv}} kind (PostgreSQL 12+) can help when the value combinations repeat often enough; on a continuous column such as an amount the benefit is limited ⇒ consider a categorised column (for example {{amount_bucket}}), a partial index for the frequent combination, or a rewrite.
- Quick look at the statistics: {{SELECT attname, n_distinct, most_common_vals FROM pg_stats WHERE tablename = 'sales';}}

### Does a bad estimate always mean a bad plan?
Not necessarily. Cost is computed on the very same estimates, so the planner still picks "the best plan **according to its own model**". The problem is that a large drift ⇒ a plan that is good for hypothetical data, and it collapses once the real data changes. Act only when you see both at the same time: a strong drift at a key node **and** a high actual runtime.

### Common mistakes
1. **Running ANALYZE in the middle of a bulk insert**. Symptom: half-finished statistics, and a "half-finished" plan follows; the query is mysteriously slow the morning after the ETL. Prevention: run ANALYZE right **after** the load finishes, inside the ETL job itself.
2. **Raising the statistics target for the whole database**. Symptom: a bloated catalog, a slow ANALYZE, needless planning time. Prevention: raise it only for hot columns: {{ALTER TABLE sales ALTER COLUMN status SET STATISTICS 500;}}.
3. **Treating ANALYZE as a cure for every bad estimate**. Symptom: you run ANALYZE and the estimate is exactly as wrong as before. Prevention: work through the causes in the table above (correlated columns, rare values, generic plan, expressions).
4. **Forgetting that plans change with the infrastructure**. Symptom: after an index change or a new trigger the plan changes although the SQL did not. Prevention: re-measure after every infrastructure change; enable {{auto_explain}} for slow queries.

### 1-minute verbal answer
"The planner estimates row counts from the statistics ANALYZE collects into pg_stats: the list of most common values, a histogram, n_distinct and the NULL fraction. For each condition it computes a selectivity, then multiplies the selectivities together and by the table's row count – which assumes the columns are independent. That is why estimates still drift with fresh statistics: correlated columns, a rare value outside the common list, a condition wrapped in a function, a prepared statement that switched to a generic plan, or many join levels. I fix it with CREATE STATISTICS for related column pairs, a higher statistics target on the right hot column, SARGable predicates, and forcing a custom plan for the critical statement. I only intervene when the big drift sits on a node that really costs time."

> Senior tip: I diagnose in this order: (1) compare the estimated {{rows}} with {{actual}} at the top node; (2) open {{pg_stats}} for the WHERE columns – are there MCVs, what is {{n_distinct}}, what is the correlation; (3) try {{CREATE STATISTICS}} for the pair that goes together, then {{ANALYZE}}. About 70% of the big drift cases I have seen came from correlated columns or rare values, not "stale statistics".`,
    follow: [
      "How does {{CREATE STATISTICS}} change the plan the planner produces after {{ANALYZE}}?",
      "How do a generic plan and a custom plan differ, and which parameter tunes that?"
    ]
  },

  'sql-018': {
    q: "The {{message(id, thread_id, recipient_id, is_read, created_at, preview)}} table has hundreds of millions of rows with two hot queries: a user's inbox that only shows **unread** messages, and a per-thread report that only needs {{thread_id}} + {{created_at}}. Which indexes do you design, how do {{partial index}} and {{covering index (INCLUDE)}} work, why can a bind-parameter query not use the partial index, and how do you verify it?",
    a: `**Summary:** Query (1) touches only about 1% of the rows (the unread messages) ⇒ a **partial index** (an index that only holds rows matching {{WHERE is_read = false}}) is both small and exactly on target. Query (2) needs only two columns ⇒ a **covering index** with {{INCLUDE (created_at)}} so it runs an {{Index Only Scan}} and never has to touch the table.

### Quick understanding
A partial index is like a **separate notebook that lists only unread letters** at the post office: instead of flipping through a ledger of hundreds of millions of letters, the clerk opens the small notebook and looks the letter up by recipient. A letter that gets read is struck out of the notebook, so the notebook always stays thin. A covering index is like a **table of contents that also prints the publication date** next to every chapter: if you only need the chapter and the date, reading the table of contents is enough and you never turn to the page. The trap: the small notebook can only be used when the question explicitly says "letters **not yet read**"; if the question is "letters whose status = (a value supplied later)", the clerk cannot prove the notebook is complete and does not dare use it.

### Terms
- **Partial index**: an index that only contains the rows satisfying a WHERE condition declared when the index is created.
- **Predicate (of an index)**: the WHERE condition attached to a partial index.
- **Covering index / INCLUDE**: an index that additionally stores "passenger" columns in its leaves so a query can be answered without reading the table; INCLUDE columns take no part in ordering.
- **Index Only Scan**: a scan that reads only the index and not the heap (except on pages the visibility map has not confirmed).
- **Bind parameter ($1, ?)**: a value passed in after the SQL text has already been prepared.
- **Generic plan**: a plan built once for every parameter value, so the planner never sees the concrete values.
- **CREATE INDEX CONCURRENTLY**: builds an index without blocking writes; in exchange it runs longer and can leave an INVALID index behind if it fails.
- **pg_stat_user_indexes**: a statistics view with the number of times each index was used ({{idx_scan}}).

### How it works, step by step
1. **On write**: on every INSERT/UPDATE, PostgreSQL evaluates the predicate {{is_read = false}}; a matching row gets an entry in {{idx_msg_unread}}, a non-matching row is skipped. Why it is cheap: the many already-read messages never cost anything in this index.
2. **At planning time**: the planner checks whether the query's WHERE **implies** the index predicate. Why this is mandatory: using an index that is missing rows (rows outside the predicate) for a query that needs those rows would return a **wrong** result.
3. **Running the inbox query**: it seeks by {{recipient_id}}; the entries are already stored in {{created_at DESC}} order, so it takes the 50 newest messages and stops.
4. **With the covering index**: the index leaves already hold {{created_at}}, so the planner picks an Index Only Scan; for heap pages that are not yet all-visible it still has to visit the heap to check visibility.

~~~text
message table: 300 million rows, 1% unread
full index (recipient_id, created_at)        ~ 9 GB
partial ... WHERE is_read = false            ~ 90 MB  -> fits in RAM
query: WHERE recipient_id=$1 AND is_read=false  -> uses the partial index  OK
query: WHERE recipient_id=$1 AND is_read=$2     -> generic plan: skipped    NO
~~~

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
- The index only holds rows that satisfy the predicate. Every {{INSERT}}/{{UPDATE}} is checked against the predicate: a new row with {{is_read = false}} is added to the index; when a message is marked as read, the new row version no longer satisfies it so it is not indexed (the old entry, which points at a dead row version, is removed by {{VACUUM}}). If 98% of messages are read, the index is only 2–5% the size of the table ⇒ less RAM, fewer page reads, and cheaper writes than a full index.
- The planner can only use it when the **query's WHERE implies the index predicate**:
  - {{WHERE recipient_id = $1 AND is_read = false}} → yes, it can be used.
  - {{WHERE recipient_id = $1 AND is_read = $2}} with {{is_read = false}}: under a **generic plan** the planner does not know the value of {{is_read}} ⇒ it cannot prove the implication ⇒ it **skips the index**; a custom plan (the first few runs with concrete values) may still use it.
  - In practice: keep the predicate a **constant inside the SQL** (write {{is_read = false}} directly) even though the rest of the query still binds parameters.
- {{is_read}} sits in the predicate, so it does not need to be a key column; the first key column must be {{recipient_id}} because almost every query is per user.

### Covering index and Index Only Scan
- {{INCLUDE (created_at)}} puts a **non-key** column into the index leaves: it does not take part in seeking (it does not change the key-selection arithmetic) but it lets the query be answered entirely from the index.
- The remaining condition is the **visibility map**: the planner is only sure it can skip the heap when every involved page has been marked visible by {{VACUUM}} ⇒ watch {{Heap Fetches}} in the plan.
- Do not cover large columns such as {{preview}} or a {{jsonb}} column holding long JSON – a bloated index drags down every {{INSERT}}/{{UPDATE}} on the hot table.

### Verifying
~~~sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT thread_id, created_at FROM message
WHERE thread_id = 42 ORDER BY created_at DESC LIMIT 50;
-- expected: Index Only Scan using idx_msg_thread_cover ... Heap Fetches: 0
-- (there is also a Sort node above, because INCLUDE columns are not ordered)
~~~
- Note: columns inside {{INCLUDE}} have **no order** in the index, so {{ORDER BY created_at}} still needs a Sort. If the report always sorts by {{created_at}} or filters a range on it, make it a **key column** instead: {{ON message (thread_id, created_at DESC)}} – that covers the query and removes the Sort. INCLUDE suits columns that are only **returned**, never filtered or sorted on.
- Per-index usage: {{SELECT relname, idx_scan FROM pg_stat_user_indexes WHERE relname = 'message';}} – an {{idx_scan}} stuck at 0 for a long time means that index should be dropped.
- Before/after: compare {{actual time}}, {{Buffers}} of the read query **and** write latency (INSERT/UPDATE) on the write-heavy table.

### Common mistakes
1. **The query predicate does not imply the index predicate**. Symptom: the partial index is skipped when the query's WHERE is {{WHERE is_read = false OR recipient_id = $1}}, {{WHERE COALESCE(is_read, false) = false}}… the planner cannot prove the implication ⇒ so it does a full scan. Prevention: write the condition exactly like the index predicate, in constant form.
2. **Binding a parameter for the predicate column** (for example Spring Data {{findByRecipientIdAndIsRead(id, false)}} generates {{is_read = ?}}). Symptom: the first few runs are fast (custom plan), but once the planner switches to a generic plan (or someone sets {{plan_cache_mode = force_generic_plan}}) it becomes much slower, and it is very hard to reproduce by hand in a test. Prevention: a dedicated method/{{@Query}} with {{is_read = false}} hard-coded in the SQL.
3. **No ANALYZE after creating the index**, or creating it without CONCURRENTLY. Symptom: the planner mis-estimates the row count and still picks a seq scan; or a plain {{CREATE INDEX}} locks writes and the API hangs. Prevention: a live table must use {{CONCURRENTLY}} (runs in the background, no write lock) – in exchange, an interruption leaves an INVALID index that you must drop and redo; then run ANALYZE.
4. **Wrong expectations about a covering index**. Symptom: a covering index can replace {{SELECT *}} for the covered columns, **not** for filter/orderBy columns missing from the index key; the plan still shows Sort/Filter. Prevention: put filter and sort columns in the key part and only returned columns in INCLUDE.

### 1-minute verbal answer
"For the unread inbox I create a partial index on (recipient_id, created_at DESC) with WHERE is_read = false: only about 1% of rows enter the index, so it is small, fits in RAM and is cheap to write. The planner only uses a partial index when it can prove the query's WHERE implies the index predicate, so if is_read is a bind parameter, under a generic plan it does not know the value and skips the index; that is why I hard-code is_read = false in the SQL. For the per-thread report I use a covering index: thread_id as the key and created_at in INCLUDE, or as a key column when sorting is needed, so it runs an Index Only Scan without touching the heap, provided autovacuum keeps the visibility map healthy. I verify with EXPLAIN ANALYZE BUFFERS, looking at Heap Fetches and at idx_scan in pg_stat_user_indexes."

> Senior tip: "a user's unread inbox is slow" is a classic question. A strong answer has two parts: a partial index on {{(recipient_id, created_at)}} {{WHERE is_read = false}} – a few dozen times smaller; and being able to explain **why a bind-parameter query cannot use the partial index**. That second detail is what separates people who have used indexes from people who have debugged plans.`,
    follow: [
      "How does {{INCLUDE}} differ from a regular column in a composite index, and when do you pick which?",
      "When the partial index predicate is a value the user chooses (e.g. per tenant), how do you handle it?"
    ]
  },

  'sql-019': {
    q: "The {{app_session(user_id, start_ts, end_ts)}} table records app sessions; sessions **can overlap** (multiple devices, a client sending them out of order). You need to merge overlapping intervals into unified sessions per user ({{MIN(start_ts)}}, {{MAX(end_ts)}}) and then compute total online time. How do you write the query, and how does it differ from gaps-and-islands for consecutive-day streaks?",
    a: `**Summary:** With **overlapping** intervals the {{date - row_number}} trick does not work. Instead, use an **island marker from a running max**: a new island opens when the current row's {{start_ts}} exceeds the {{MAX(end_ts)}} of **all preceding rows**, otherwise the row merges into the open island. Sum the flags cumulatively with {{SUM}} into an island number ({{grp}}), and finally {{GROUP BY user_id, grp}}.

### Quick understanding
Picture colouring the time spans on a ruler: the phone is online 9–10, the laptop 9:30–11, the tablet 13–14. The overlapping part is counted **once**, so the real online time is 9–11 plus 13–14, three hours in total – not 1 + 1.5 + 1 = 3.5 hours. The method: sort the spans by start time and, while walking, remember "the farthest point the ink has reached". A new span that starts **after** that farthest point leaves a gap ⇒ open a new stripe; a span that starts at or before it is glued onto the stripe being painted.

### Terms
- **Interval**: a span of time with a start and an end.
- **Overlapping intervals**: spans that share some part.
- **Sessionization**: merging discrete events or spans into meaningful work sessions.
- **Island marker**: a 0/1 column marking the row that starts a new group.
- **Running max / running sum**: the maximum, or the total, accumulated in order using a window function with a frame.
- **Frame ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING**: every earlier row, **not** including the current one.
- **EXTRACT(EPOCH FROM interval)**: turns a PostgreSQL interval into a number of seconds.

### How it works, step by step
1. **Sort by start_ts (then end_ts) inside each user**. Why: only when walking in start order does "has passed the farthest point" mean there is a gap.
2. **Compute prev_max_end** = the max end_ts over all preceding rows. Why max and not the end of the row just before: one long session in front (1–10) can "cover" several short sessions behind it (2–3, 5–6).
3. **Flag new_island** = 1 when it is the first row or {{start_ts > prev_max_end}}. Why the strict {{>}}: a session that starts exactly when the previous one ends counts as continuous and is merged.
4. **Accumulate the flags** into {{grp}}: every time a 1 appears the island number grows by one, and merged rows keep the current number.
5. **GROUP BY user_id, grp**: MIN(start) and MAX(end) give the merged session; for total online time per user add {{SUM(online_seconds)}} as one more layer.

~~~text
time     : 1    2    3    4    5    6 ...  10   11   12
[1,10]   : ██████████████████████████████████
[2,3]    :      █████
[5,6]    :                     █████
[11,12]  :                                       █████
island   : └──────────── island 1: [1,10] ────────┘ └─ island 2 ─┘
online   = (10-1) + (12-11) = 10   (summing rows = 9+1+1+1 = 12, wrong)
~~~

### The query (PostgreSQL)
~~~sql
WITH seq AS (
  SELECT s.user_id, s.start_ts, s.end_ts,
         -- max end_ts over ALL preceding rows (the frame excludes the current row)
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
       -- (do NOT sum per-row durations – the overlap would be counted twice)
       EXTRACT(EPOCH FROM (MAX(end_ts) - MIN(start_ts))) AS online_seconds
FROM islands
GROUP BY user_id, grp
ORDER BY user_id, session_start;
~~~

### Why the marker is correct
Say three sessions overlap and then a separate one arrives: [1,10], [2,3], [5,6], [11,12].
| start | prev_max_end | start > prev_max_end | island |
|---|---|---|---|
| 1 | NULL | – | 1 (open) |
| 2 | 10 | no | 1 (merge) |
| 5 | 10 | no | 1 (merge) |
| 11 | 10 | yes | 2 (open) |

{{prev_max_end}} is the max over **every preceding row**, so when an interval starts after that value it cannot overlap anything seen so far ⇒ a new island begins. The frame {{ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING}} is the crux: it **excludes the current row** from the max, otherwise every row would "match" itself.

### Versus gaps-and-islands for consecutive-day streaks
| | Consecutive-day streak (sql-007) | Overlapping intervals |
|---|---|---|
| Input | discrete day markers, no overlaps | intervals that may overlap |
| Grouping key | {{date - row_number}} | flag {{start > prior max(end)}} |
| Why that trick | every island sits exactly 1 unit apart | lengths and gaps are arbitrary |
| Key window function | {{ROW_NUMBER}} | {{MAX(end_ts)}} with frame {{... AND 1 PRECEDING}} |

### Edge cases
- {{end_ts IS NULL}} (a session that is still open): normalise it **before** running the window ({{COALESCE(end_ts, now())}} or drop the row), because PostgreSQL's {{MAX}} ignores NULLs, which would make {{prev_max_end}} wrongly small.
- A client sends {{start_ts > end_ts}}: filter {{WHERE end_ts >= start_ts}} and report the source-data error.
- Exact duplicate rows: {{SELECT DISTINCT}} or a unique index on {{(user_id, start_ts)}}.
- **Summing per-row durations is wrong** because the overlap gets counted twice – merge first, then sum (as the query above does).
- To merge per device, add {{device_id}} to {{PARTITION BY}}.

### Performance
- An index on {{(user_id, start_ts, end_ts)}} both serves the window sort (removing a Sort node) and covers all columns for an {{Index Only Scan}}.
- The window forces a sort by {{PARTITION BY}} + {{ORDER BY}}; with hundreds of millions of sessions, aggregate per day and then merge, or pre-compute the merged sessions into a separate table.

### Common mistakes
1. **Using date minus row_number on overlapping intervals**. Symptom: overlapping sessions are split into many islands and the total time is wrong. Prevention: use the {{start > previous max(end)}} flag instead.
2. **Comparing against the end_ts of the immediately preceding row (LAG) instead of the running max**. Symptom: with [1,10], [2,3], [5,6], the [5,6] row compares against end = 3 and opens a new island although it still lies inside [1,10]. Prevention: {{MAX(end_ts) OVER (... ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING)}}.
3. **A frame that includes the current row**. Symptom: {{prev_max_end}} is always at least the row's own end, so a new island never opens and all of a user's sessions stick together into one. Prevention: end the frame at {{1 PRECEDING}}.
4. **Summing per-row durations**. Symptom: total online time exceeds 24 hours per day for users on several devices. Prevention: merge first, then sum.

### 1-minute verbal answer
"For time spans that can overlap, the date-minus-row_number trick does not work because the spans are not evenly spaced. I sort the sessions by start_ts inside each user and compute the max end_ts of all preceding rows with a window MAX whose frame runs from the start up to the row just before, excluding the current row. If the current row's start_ts is greater than that max there is a gap, so I flag a new island; after that I take the running SUM of the flags to get the island number and group by user and island to get MIN start and MAX end. Online time is the width of each merged island added up, not the sum of individual sessions, because the overlap would be counted twice. Before running it I normalise NULL end_ts, drop sessions whose end is before their start, and add an index on (user_id, start_ts, end_ts) to avoid the sort."

> Senior tip: the key question with any "consecutive streak" problem is **do the intervals overlap**. If they do, every {{date - row_number}} formula is wrong. I always draw three intervals on the whiteboard and walk through the running {{max(end)}} so the interviewer sees I grasp the essence: the island marker means "the new interval's start has passed beyond the widest end I have seen so far".`,
    follow: [
      "If {{end_ts}} can be NULL, how do you change the query?",
      "How do you compute online time **per day** when a session spans midnight?"
    ]
  },

  'sql-020': {
    q: "On the {{sales(region, product, sale_date, amount)}} table, the sales team needs a report with totals by {{(region, product)}}, totals by {{region}}, totals by {{product}} and a grand total – all in a **single** pass instead of four {{UNION ALL}} statements. How do you write it, what does {{GROUPING()}} do, and how does {{ROLLUP}} differ from {{GROUPING SETS}}/{{CUBE}}?",
    a: `**Summary:** Use {{GROUP BY GROUPING SETS (...)}}, {{ROLLUP}} or {{CUBE}} – the planner gathers **several aggregation levels in a single read of the data** instead of scanning four times. Whichever column is aggregated comes back as NULL ⇒ tell a "total" NULL apart from a real NULL with {{GROUPING(col)}}.

### Quick understanding
Think of an Excel PivotTable with "Subtotal" and "Grand Total" rows: the detail numbers per region–product, then a total row per region, a total column per product, and the grand total in the corner. Writing four SQL statements and UNION ALL-ing them is like printing the invoice four times and adding it up by hand four times. GROUPING SETS tells the DB once: "read the data a single time and add it up these four ways for me". On total rows the "region" or "product" cell is left empty (NULL) – and {{GROUPING()}} is the little label saying "this cell is empty because it is a total row", so you never confuse it with data that is genuinely missing a region.

### Terms
- **Grouping set**: one way of grouping (a list of columns) among several that are computed at the same time.
- **ROLLUP**: produces hierarchical totals from the detail up to the grand total, dropping columns from right to left.
- **CUBE**: produces every possible combination of the columns (2^n levels).
- **GROUPING(col)**: returns 1 when the column was aggregated (a total row) and 0 when it holds a real value.
- **Bitmask**: one integer in which each bit represents the on/off state of one column.
- **Subtotal / grand total**: the total along one dimension / the total over everything.
- **Pre-aggregate**: compute daily totals into a small table in advance so reports can read it quickly.

### How it works, step by step
1. **Read and filter the data once** (WHERE {{sale_date}}). Why: the filter is written once, and every aggregation level shares the same set of rows.
2. **The planner builds an aggregation plan per grouping set**: sort once and run GroupAggregate for the levels that share that order (ROLLUP, for example), or use HashAggregate/MixedAggregate for the remaining levels.
3. **Each data row is added to several "buckets"**: the (HN, Shirt) bucket, the (HN) bucket, the (Shirt) bucket and the grand-total bucket. Why it is still fast: the disk is read only once; the extra additions are CPU work.
4. **Output**: columns that are not part of a row's grouping set are filled with NULL, and {{GROUPING()}} returns 1 for those columns.

~~~text
region | product | amount | GROUPING(region,product)
HN     | Shirt   | 100    | 0  (detail)
HN     | Pants   |  50    | 0
HCM    | Shirt   |  70    | 0
HN     | NULL    | 150    | 1  (HN total)
HCM    | NULL    |  70    | 1  (HCM total)
NULL   | Shirt   | 170    | 2  (Shirt total)
NULL   | Pants   |  50    | 2  (Pants total)
NULL   | NULL    | 220    | 3  (grand total)
~~~

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
Four metric levels in **one** statement, with the {{sale_date}} filter written once. The old way is four {{UNION ALL}} statements: the condition repeats four times, the code is long, and the planner also has to read/aggregate in several passes.

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
- Look in {{EXPLAIN}}: the data is read **once** and feeds the aggregation levels (the planner can run {{GroupAggregate}} several times over the same sort order, or use {{HashAggregate}}), not four table scans like four {{UNION ALL}} statements.
- Big data and reports during peak hours: {{GROUPING SETS}} saves code and one scan, **not** I/O if every day needs to scan 500 million rows ⇒ pre-aggregate per day into a summary table / materialized view and union from the small table.
- {{CUBE}} over 6 columns produces **64** grouping sets ({{2^n}}) – use it only when you truly need every dimension.

### Common mistakes
Each item comes with its symptom and its prevention:
- **Real NULL vs total NULL**: without {{GROUPING()}} you cannot tell "a customer with no region" apart from "the total row of the whole region" – the classic reporting bug when exporting JSON straight to the frontend.
- {{ORDER BY}} after {{GROUP BY}}: use the {{GROUPING(...)}} columns to put detail groups before total rows; do not sort by the label if the label has been replaced by "All".
- **Mistaking ROLLUP for two-dimensional**: to get a separate {{product}} total you must write {{GROUPING SETS}} or {{CUBE}}; {{ROLLUP(region, product)}} does not produce it.
- A report query without a date {{WHERE}} on the history table ⇒ everything gets scanned, however good the planner's aggregation is.
- **Re-summing the amount column in the frontend**: the symptom is a grand total that is doubled or quadrupled because the frontend adds the detail rows and the total rows together. Prevention: return the {{GROUPING(...)}} column (or split the result into separate detail and total arrays) and agree that "the frontend never sums by itself".

### 1-minute verbal answer
"To get totals by region and product, totals by region, totals by product and a grand total in one statement, I use GROUP BY GROUPING SETS with those four groups. The DB reads the data once and adds every row into several total levels, instead of four UNION ALL statements that scan four times and repeat the filter. On total rows the aggregated column is NULL, so I use GROUPING(col) to tell it apart from a real NULL and to label it 'All'. ROLLUP(a, b) only produces the hierarchical levels (a,b), (a) and the grand total, with no level by b; CUBE produces every combination, 2 to the power of n levels, so it explodes with many columns. MySQL only has WITH ROLLUP. For a very large table I still pre-aggregate per day, because GROUPING SETS saves the number of scans, not the amount of data that has to be read."

> Senior tip: when the requester says "give me the total by region and the grand total in one statement", I immediately write {{GROUPING SETS}} with {{CASE WHEN GROUPING(x) = 1}} and then state its limits: "this saves code and one scan; with a 500-million-row-per-day table I would build a summary table". Senior/lead interviewers like hearing you name the **limits** of a solution, not just the syntax.`,
    follow: [
      "{{CUBE}} over 6 columns produces how many groups – should you use it?",
      "How do you tell a real NULL apart from a NULL produced by {{ROLLUP}} when returning JSON to the frontend?"
    ]
  },

  'sql-021': {
    q: "You write a query with several {{WITH}} clauses (CTEs) and it is much slower than the subquery formulation; in another case the CTE version is the faster one. Explain how the PostgreSQL planner treats {{WITH}} – the optimization fence, inlining since version 12, {{MATERIALIZED}}/{{NOT MATERIALIZED}} – and when you deliberately force it or not, especially for a CTE referenced twice or holding a heavy aggregate.",
    a: `**Summary:** Before PostgreSQL 12, **every CTE was an optimization fence**: the planner could not look inside, executed it exactly once, stored the result (materialized) and reused it. Since PostgreSQL 12 the planner is **allowed to inline** the CTE into the subquery (as if written nested) when it is referenced once and is a plain SELECT ⇒ the outer query's filters get pushed into it, and the planner is free to choose the join order. {{MATERIALIZED}} / {{NOT MATERIALIZED}} is the switch that forces the planner to obey.

### Quick understanding
A CTE is like **cooking a whole pot of stock** (materializing) and ladling it out for several dishes. If the whole meal needs a single cup of stock, cooking the whole pot is wasted work – better to cook exactly what the dish needs inside that dish (inline). Before PostgreSQL 12 the kitchen always cooked the whole pot, even when the final dish needed one spoonful (which is why an outer filter could not "sneak" inside). From version 12 on, the head chef (the planner) decides: used once, cook it inside the dish; used twice, cook the shared pot. {{MATERIALIZED}} / {{NOT MATERIALIZED}} is you giving the head chef a direct order.

### Terms
- **CTE (Common Table Expression)**: a named subquery declared with {{WITH}}.
- **Optimization fence**: a boundary the planner cannot optimize across; whatever is inside is computed independently.
- **Inline**: replace the CTE with its own subquery so the planner optimizes it together with the outer query.
- **Materialize**: compute the CTE once, keep the result in a temporary store (a tuplestore) and read it back through a {{CTE Scan}} node.
- **Predicate pushdown**: pushing the outer query's WHERE conditions down to the data source inside.
- **Volatile function**: a function that may return a different result on every call ({{random()}}, {{clock_timestamp()}}) or has side effects.
- **Planning time**: the time the planner spends building the plan, separate from execution time.

### How it works, step by step
1. **The parser reads the WITH clause** and counts how many places reference each CTE.
2. **It decides whether to inline** by the rules below. Why the rules exist: inlining a CTE used twice could make it be computed twice; inlining a CTE with side effects would change the meaning of the query.
3. **If inlined**: the CTE becomes a subquery; the planner pushes outer conditions inside, uses indexes on the base tables and picks the join order freely.
4. **If materialized**: the CTE is computed in full once into memory (spilling to disk when it exceeds {{work_mem}}); the outer query reads the result through {{CTE Scan}}, and there is **no index** on it.

~~~text
WITH o AS (SELECT * FROM orders)          -- orders: 50 million rows
SELECT * FROM o WHERE customer_id = 42;   -- needs ~200 rows
PG 11 (fence)     : computes 50 million rows -> CTE Scan filters -> ~200   (seconds/minutes)
PG 12+ (inline)   : Index Scan orders(customer_id=42) -> ~200   (milliseconds)
WITH o AS MATERIALIZED (...) on PG 12+ : back to the PG 11 behaviour
~~~

### Inline rules since PostgreSQL 12
A CTE is inlined when **all** of the following hold:
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
- If the ORM or query builder (Hibernate 6 supports CTEs in HQL, jOOQ, QueryDSL…) emits {{WITH}} referenced twice ⇒ materialized by default; do not assume it will inline, look at the real SQL in the log.

### Common mistakes
Each item with its symptom and prevention:
- **Upgrading to PostgreSQL 12+ changes plans**: an old query can get faster or slower even though the SQL is unchanged. Re-measure the critical queries after the upgrade; any query that **deliberately** used a CTE as a fence should get {{MATERIALIZED}} before the upgrade.
- Forcing {{MATERIALIZED}} in the wrong place: the planner must compute the whole subset although the outer query needs 1% ⇒ wasted CPU and RAM (a materialized CTE sits in work_mem; a large one spills to disk).
- A CTE referenced twice + a large result set: multiplies memory consumption; consider rewriting it as a join over the filtered set.
- An unstable plan can also come from generic/custom plans and statistics – rule each cause out before blaming the CTE.
- **Rewriting MySQL CTEs out of PostgreSQL habit**: MySQL 8 can also merge a CTE into the outer query or materialize it into a temporary table (the optimizer decides, with the {{MERGE}}/{{NO_MERGE}} hints) and has no {{MATERIALIZED}} syntax – always check with that DB's own EXPLAIN.

### 1-minute verbal answer
"Before PostgreSQL 12 every CTE was an optimization fence: the planner computed it once, stored the result temporarily and the outer query read it through CTE Scan, so outer filters could not be pushed inside and the base table's index could not be used. From version 12, a CTE that is not recursive, has no side effects and is referenced only once is inlined like a subquery, so the planner optimizes it together with the outer query. Referenced twice, it is still materialized by default to avoid recomputing. I force MATERIALIZED when the CTE holds an expensive aggregate reused several times or when I want a stable plan, and NOT MATERIALIZED when I have measured that pushing conditions into each usage site is better. I treat a CTE as a tool for readability, and I always confirm the optimization with EXPLAIN ANALYZE, especially after an upgrade."

> Senior tip: my rule is "a CTE is a **readability** tool, not an optimization tool". I write CTEs for clarity and then measure with {{EXPLAIN (ANALYZE)}}; when the plan flips after an upgrade or the estimates drift, I pin the behaviour with {{MATERIALIZED}}/{{NOT MATERIALIZED}} and note the **why** right in the SQL. Talking to the interviewer, the impressive answer is: "since PostgreSQL 12 a CTE is no longer a fence by default, so I always look for a {{CTE Scan}} or {{Subquery Scan}} node in the plan before concluding".`,
    follow: [
      "How do you check whether your CTE has been inlined?",
      "Why does a CTE referenced twice make the planner materialize it?"
    ]
  },

  'sql-022': {
    q: "Your report over a 400-million-row table always runs on a single worker even though the machine has many idle cores. Explain how PostgreSQL decides to go parallel (the cost model, the {{Gather}} node), which conditions make the planner unable to parallelize, what you tune – and when you should **not** force parallelism.",
    a: `**Summary:** Parallel query is **cost-based**, not an on/off switch: the planner prices the divide-the-work option ({{parallel_setup_cost}} + {{parallel_tuple_cost}} + the benefit of splitting the scan) and compares it with the serial option. Choosing parallel yields a {{Gather}} node in the plan (or {{Gather Merge}} when results must be merged in order). Idle cores do **not by themselves** make the plan parallel – if you see a single worker, either the cost does not justify it or some condition forbids parallelism.

### Quick understanding
You have to check 400 crates. Hiring three helpers is faster, but **hiring people also costs work**: phoning them, explaining the job, splitting the crates, then gathering each helper's results. For 5 crates, doing it yourself is faster than hiring. The PostgreSQL planner does exactly that arithmetic: the cost of "hiring" workers ({{parallel_setup_cost}}), the cost of "bringing each result back" ({{parallel_tuple_cost}}), against the time saved by splitting the scan. Some jobs **cannot be handed out** (writing data, locking rows, unsafe functions) – then no matter how many helpers are idle, you do it yourself.

### Terms
- **Leader**: the backend process that receives the query; it starts the workers and does part of the work itself.
- **Parallel worker**: a background process the leader borrows to process a slice of the data.
- **Gather / Gather Merge**: the node that collects results from the workers back to the leader; the Merge variant keeps the sorted order.
- **Partial / Finalize Aggregate**: every worker computes a partial total over its own slice, and the leader adds the partial totals together.
- **GUC**: a PostgreSQL configuration parameter (set in postgresql.conf or with SET).
- **PARALLEL SAFE / RESTRICTED / UNSAFE**: a label saying whether a function may run inside a worker.
- **Oversubscription**: more processes demanding CPU/IO than the machine really has, which slows everything down.
- **p99**: the latency that 99% of requests are faster than – the measure of the system's slow tail.

### How it works, step by step
1. **The planner builds both plans**: serial and parallel (with the number of workers derived from table size, capped by {{max_parallel_workers_per_gather}}). Why both: only comparing costs tells you which is cheaper.
2. **It checks the forbidden conditions**: a PARALLEL UNSAFE function, a data-modifying statement, FOR UPDATE… and the parallel option is discarded.
3. **It picks the cheaper plan**; if parallel, it puts a {{Gather}} node on top of the parallel portion.
4. **At run time**: the leader asks for workers from the {{max_parallel_workers}} pool; the workers split the table's blocks between them (Parallel Seq Scan) and each computes a Partial Aggregate.
5. **Collecting the results**: Gather receives the rows/partial totals and the leader runs Finalize Aggregate. If workers are missing, the leader does the remaining work itself.

~~~text
Serial        : [leader] scans 400 million rows ───────────────── 60 s
Parallel 4+1  : [leader ] scans ~80M ─┐
                [worker1] scans ~80M ─┤
                [worker2] scans ~80M ─┼─► Gather → Finalize ── ~14 s
                [worker3] scans ~80M ─┤   (does not reach 60/5 = 12 s because of
                [worker4] scans ~80M ─┘    gathering cost + I/O contention)
~~~

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

### Common mistakes
1. **A user-defined function without PARALLEL SAFE**. Symptom: a query calling your own format/convert function always runs on a single worker even on a huge table. Prevention: check {{proparallel}} in {{pg_proc}}; only run {{ALTER FUNCTION ... PARALLEL SAFE}} when the function writes no data and uses no session variables or temp tables.
2. **Workers Launched smaller than Workers Planned**. Symptom: a beautiful plan on staging, but slow in production at peak hours because the worker pool is exhausted. Prevention: monitor how many workers actually run, and balance {{max_parallel_workers}} against the number of cores and connections.
3. **Forcing parallelism system-wide** (setting the costs to 0, raising workers_per_gather for every session). Symptom: CPU at 100%, and the OLTP API's p99 doubles. Prevention: enable higher levels only for the reporting session/role: {{ALTER ROLE report_user SET max_parallel_workers_per_gather = 4;}}.
4. **Reading a report through a JDBC cursor/stream**. Symptom: the plan is not parallel although the same query run by hand is. Prevention: know that a query executed through a cursor (for example JDBC fetchSize with autocommit off) may not use parallelism; check with {{auto_explain}} on the application's exact code path.

### 1-minute verbal answer
"Parallel query in PostgreSQL is a cost-based decision: the planner compares the serial plan with a plan that splits the work across workers, charging the cost of starting workers and of sending each row back to the leader through the Gather node; a table smaller than min_parallel_table_scan_size, or a query returning few rows, is cheaper serial. Some things forbid parallelism: data-modifying statements, FOR UPDATE, functions marked PARALLEL UNSAFE – which is the default for your own functions – and some aggregates that cannot be split. When I see a single worker I check whether the plan has a Gather node, how many Workers Launched, which functions are unsafe, then try raising max_parallel_workers_per_gather for the reporting session only and measure again. I do not force parallelism on an OLTP system with many connections, because oversubscription makes p99 worse, and I prefer to reduce the amount of data that has to be scanned first."

> Senior tip: "plenty of idle cores" has never been a reason to force parallelism. I once watched an infra team set the parallel costs to 0 on a system of 32 connections over 8 cores ⇒ every statement burst out workers, the total process count exceeded the machine, and p99 doubled. My rule: measure with {{EXPLAIN (ANALYZE)}}, track how many workers run concurrently, and remember that parallel query is a **work-splitting algorithm**, not a guaranteed speedup lever.`,
    follow: [
      "When do {{Gather}} and {{Gather Merge}} differ, and why is the merge variant needed?",
      "When is marking a function {{PARALLEL SAFE}} a mistake?"
    ]
  }
});
