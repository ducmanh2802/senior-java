/*
 * English translation of js/data/lessons-sql.js — task T695. Format: js/core/i18n.js (content overlay).
 * ids: lesson-sql-004 lesson-sql-005
 */
App.i18n.content({
  'lesson-sql-004': {
    title: 'Window functions from the ground up: ROW_NUMBER, RANK, DENSE_RANK, LAG and running totals',
    goals: [
      'Explain PARTITION BY and ORDER BY inside OVER, and tell ROW_NUMBER, RANK and DENSE_RANK apart when values are equal (a tie)',
      'Simulate a running total (SUM OVER ORDER BY) and LAG in plain Java, and understand the default frame: RANGE vs ROWS',
      'Solve a real problem: the top-3 largest transactions per customer and the cumulative balance per day, implementing rank/runningTotal yourself with correct SQL semantics',
    ],
    body: `### What a window function is and why you need one
A window function computes a value **over a set of related rows** while still **keeping every row** (it does not collapse them the way GROUP BY does). GROUP BY turns the 1,000 transactions of 10 customers into 10 rows; a window function keeps all 1,000 rows and adds columns such as "the rank of this transaction within its customer" or "the cumulative total up to this point".

~~~sql
-- Top-3 largest transactions per customer
SELECT * FROM (
  SELECT customer_id, tx_id, amount,
         RANK() OVER (PARTITION BY customer_id ORDER BY amount DESC) AS rk
  FROM transaction
) t WHERE rk <= 3;

-- Cumulative balance per day (a bank statement)
SELECT customer_id, tx_date, amount,
       SUM(amount) OVER (PARTITION BY customer_id ORDER BY tx_date, tx_id
                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS balance
FROM transaction;
~~~

The {{OVER(...)}} clause has three parts:
- **PARTITION BY**: splits the data into independent groups (one window per customer). Same grouping idea as GROUP BY, but no rows are collapsed. Leave it out and the whole table is one single group.
- **ORDER BY**: the order of the rows **inside** each group. It decides who stands before whom when ranking or accumulating.
- **Frame**: for aggregate functions such as SUM/AVG, the frame says "which rows are counted relative to the current row". Ranking functions (ROW_NUMBER, RANK, DENSE_RANK) and LAG/LEAD ignore the frame.

### ROW_NUMBER, RANK, DENSE_RANK: they differ on a tie (equal values)
A tie is when two rows have the same ORDER BY value. Example: the top transactions of one customer by descending amount — 500, 500, 300.

| amount | ROW_NUMBER | RANK | DENSE_RANK |
|---|---|---|---|
| 500 | 1 | 1 | 1 |
| 500 | 2 | 1 | 1 |
| 300 | 3 | 3 | 2 |

- {{ROW_NUMBER()}}: always 1, 2, 3..., never duplicated, even on a tie. Which tied row gets 1 and which gets 2 is **undefined** when ORDER BY does not discriminate enough; add a unique column ({{tx_id}}) to make the result stable.
- {{RANK()}}: tied rows share a rank; the following rank **jumps** by exactly the number of tied rows. Two people tied at rank 1 means the next one is rank 3 (rank 2 is skipped). This is how sports standings work.
- {{DENSE_RANK()}}: tied rows share a rank; the following rank **does not jump**, it always increases by 1. Tied at rank 1 means the next one is rank 2. Use it for "the second-highest price" (take DENSE_RANK = 2).

The problem "top-3 largest transactions per customer": whether you want {{RANK}} or {{DENSE_RANK}} depends on the requirement. If five transactions all share the top value, {{WHERE rk <= 3}} with RANK returns all five (they are all rank 1 <= 3); that is usually the wanted behaviour ("the three highest levels" means every row belonging to those three levels).

### Running totals and the default frame (the RANGE trap)
A running total (cumulative sum) adds up from the start of the group through the current row; it is what a balance statement needs. The safe form spells out the frame:

~~~sql
SUM(amount) OVER (PARTITION BY customer_id ORDER BY tx_date, tx_id
                  ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
~~~

**The trap**: with an ORDER BY and **no frame written**, the SQL standard defaults to {{RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW}}. RANGE treats rows with the **same ORDER BY value** as peers (equal-ranked) and adds all of them at once. Two transactions on the same day, 100 and 200: with RANGE both rows show 300; with ROWS the first row shows 100 and the second shows 300 (one row at a time). A statement needs ROWS plus a tie-breaker ({{tx_id}}) so that the order is fully determined.

With no ORDER BY inside OVER, the frame is **the whole partition**: {{SUM(amount) OVER (PARTITION BY customer_id)}} returns that customer's grand total on every one of the customer's rows.

### LAG: look back at the previous row
{{LAG(expr, offset, default) OVER (PARTITION BY ... ORDER BY ...)}} returns the {{expr}} value of the row {{offset}} positions earlier in the same partition (offset defaults to 1). The first row of a partition has no previous row, so it gets {{default}} (NULL if you do not write one). Use it for the change versus the previous transaction: {{amount - LAG(amount) OVER (...)}}. {{LEAD}} is the mirror image: it looks at the following row.

~~~sql
-- Change versus the previous transaction of the same customer
SELECT customer_id, tx_id, amount,
       amount - LAG(amount, 1, 0) OVER (PARTITION BY customer_id ORDER BY tx_date, tx_id) AS delta
FROM transaction;
~~~

### How the DB computes it (so you understand the cost)
PostgreSQL shows a {{WindowAgg}} node in EXPLAIN, usually sitting on top of a {{Sort}} by (PARTITION BY, ORDER BY). Once the rows are sorted, WindowAgg **makes a single pass**, keeping a small amount of state (the sequence number, the current rank, the running sum, the previous row's value) and resetting it when it enters a new partition. The dominant cost is the sort, O(n log n); an index {{(customer_id, tx_date, tx_id)}} can remove the sort step entirely. Implementing it yourself in Java (the exercise) does exactly the same thing: sort indices, then make one pass.

| Function | Tie (equal values) | Rank jump | Use when |
|---|---|---|---|
| ROW_NUMBER | never duplicates, assigned arbitrarily | no | you need exactly N rows, stable pagination (add a tie-breaker) |
| RANK | shared rank | yes (skips) | sports-style standings, "top-N levels" |
| DENSE_RANK | shared rank | no | "the K-th highest level", contiguous ranks |

> Real-world pitfall: using {{ROW_NUMBER}} to take "top-3 per group" and then hitting a tie — you cut one tied row and keep the other at random, which causes data disputes in reviews and reports. If the meaning is "the three highest levels", use RANK/DENSE_RANK. Another pitfall: forgetting to reset state when a new partition starts (customer B's total/rank inherits customer A's) — a test with interleaved partitions catches this.

> Senior tip: before PostgreSQL 15, "top-N per group" forced you to compute the rank for every row and filter in an outer query. PG 15+ recognises the {{rk <= N}} condition and stops early within each group ({{Run Condition}}). For a very large table with few groups, {{CROSS JOIN LATERAL (SELECT ... WHERE customer_id = c.id ORDER BY amount DESC LIMIT 3) t}} exploits the index {{(customer_id, amount DESC)}} and is usually faster. Do not push a {{LIMIT}} into the subquery that defines ROW_NUMBER to "optimise" it — that is top-N over the whole table, not per group.

### Interview relevance
Typical questions: "Tell me ROW_NUMBER, RANK and DENSE_RANK apart", "Compute the cumulative balance / get the second largest transaction per customer", "What is the default frame of SUM OVER ORDER BY?". A good answer states the behaviour on ties (jump or no jump), mentions the RANGE vs ROWS trap for running totals, adds a tie-breaker for determinism, and says the DB does it with a sort plus a single pass (WindowAgg). If the environment has no window functions (old MySQL 5.x), you can use user variables or a self-join, but you must state the trade-off in correctness and performance.`,
    exercises: [
      {
        title: 'Implement RANK, DENSE_RANK and a running total with correct SQL semantics',
        prompt: `{{Row}} is given: {{group}} (String, the partition key) and {{amount}} (int, the value to rank/accumulate). Write a {{Window}} class that simulates the SQL semantics:

~~~sql
RANK()       OVER (PARTITION BY group ORDER BY amount DESC)
DENSE_RANK() OVER (PARTITION BY group ORDER BY amount DESC)
SUM(amount)  OVER (PARTITION BY group ORDER BY amount DESC
                   ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
~~~

- {{rank(rows, dense)}}: {{dense=false}} returns RANK, {{dense=true}} returns DENSE_RANK. Return a {{List<Integer>}} aligned with the input: element {{i}} is the rank of {{rows.get(i)}}.
- {{runningTotal(rows)}}: return a {{List<Long>}} aligned with the input, accumulating in **descending {{amount}}** order inside each group (ROWS frame: add one row at a time). Use {{long}}.
- Within a partition, sort by {{amount}} **descending**. Tie (same group, same amount): tied rows get **the same rank**; when walking the list to accumulate (ROWS), the row that appears first in the input list is processed first (stable sort).
- RANK skips: after {{k}} rows sharing rank {{r}}, the next rank is {{r + k}}. DENSE_RANK does not skip: {{r + 1}}.
- The input may be unordered, with interleaved partitions. You **must not modify** the input list.`,
        hints: [
          'Sort a list of **indices** by {{(group, amount descending)}}; use {{Comparator.reverseOrder()}} for amount. {{List.sort}} is stable, so tied rows keep their input order.',
          'RANK: when a new value appears (or at the first row of a partition), set {{curRank = seen}} (the number of rows seen so far, this one included) — that is where the "jump" comes from. DENSE_RANK: set {{curRank = curRank + 1}}. On a tie, keep {{curRank}} unchanged.',
          'Always reset (group, rank, seen, sum) when {{group}} changes. Write the result into {{out[i]}} where {{i}} is the original index, so the output lines up with the input.',
        ],
        explain: `### Why RANK uses {{seen}} while DENSE_RANK uses {{+1}}
{{seen}} counts the rows already walked in the partition (1,2,3...). When a new value appears after a block of ties, its RANK is exactly the {{seen}} position — so after three rows at rank 1, the next row's {{seen}} is 4 and the rank jumps straight to 4. DENSE_RANK only cares about "which distinct value number is this", so it increments by 1 no matter how big the previous tie block was.

### Common mistakes
- **RANK that does not jump**: assigning {{curRank = curRank + 1}} in both modes — you produce DENSE_RANK values while the caller asked for RANK. The "skip accumulates" test catches this.
- **Forgetting to reset {{seen}}/sum on a new partition**: group B's ranks/totals are polluted by group A. The interleaved test catches it.
- **Sorting {{rows}} in place**: breaks with {{List.of}} and corrupts the caller's data.
- **Returning results in sorted order** instead of by original index: the values are right but attached to the wrong rows.
- **Comparing the group String with {{==}}**: you must use {{equals}} (or a null-safe check). Here group comes from data, so use {{equals}}.

### What about LAG?
This exercise focuses on rank/running total. LAG follows the same pattern: inside the walk over the sorted order, keep the {{prevValue}} of the previous row in the partition (reset on partition change) and write {{prevValue}} (or the default at the start of a partition) for the current row. Since everything is a single pass after the sort, every window function costs O(n log n) for the sort plus O(n) for the walk.`,
      },
    ],
    check: [
      {
        q: 'In one partition, amount descending is 90, 90, 90, 70. What are the {{RANK}} and {{DENSE_RANK}} of the 70 row, respectively?',
        options: ['2 and 2', '3 and 2', '4 and 2', '4 and 4'],
        explain: `**4 and 2 is correct**: the three 90 rows share rank 1. RANK jumps over 2 and 3, so the 70 row is rank 4. DENSE_RANK does not jump, so the 70 row is rank 2. **2 and 2** is wrong because RANK must jump. **3 and 2** is wrong because it jumps only one step (confused with "skip one rank"); RANK jumps by exactly the number of tied rows (3 rows). **4 and 4** is wrong because DENSE_RANK never jumps.`,
      },
      {
        q: 'Why is {{SUM(amount) OVER (ORDER BY tx_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)}} safer than writing no frame, in a statement that can have several transactions on the same day?',
        options: ['ROWS runs faster than RANGE', 'ROWS adds one row at a time, so two transactions with the same tx_date are not merged into one total the way the default RANGE does', 'RANGE is not supported by SUM', 'ROWS automatically adds a tie-breaker on id'],
        explain: `**Option 2 is correct**: the default (ORDER BY present, no frame written) is RANGE, which treats rows with the same ORDER BY value as peers and adds all of them at once — two transactions on the same day get the same cumulative balance, which is wrong for a statement. ROWS adds one row at a time in the physical order inside the window. **Option 1** is often true about cost but is not the correctness argument. **Option 3** is wrong, RANGE works with SUM. **Option 4** is wrong: ROWS does not add a column for you; you must put {{id}} into the ORDER BY yourself so that tied rows have a defined order.`,
      },
      {
        q: 'You need "the 3 largest transactions per customer" and several transactions may share the largest amount. Which approach matches the meaning "the three highest levels" and does not cut at random?',
        options: ['WHERE ROW_NUMBER() ... <= 3', 'WHERE RANK() ... <= 3 (or DENSE_RANK() <= 3 depending on how you define a level)', 'LIMIT 3 in the subquery that defines the window', 'GROUP BY customer_id HAVING COUNT(*) <= 3'],
        explain: `**Option 2 is correct**: RANK/DENSE_RANK assign the same rank to tied rows, so {{rk <= 3}} keeps every row belonging to the three highest levels (possibly more than three rows) without cutting anything at random. **Option 1** is wrong for this requirement: ROW_NUMBER assigns unique numbers, so it drops one tied row arbitrarily. **Option 3** is seriously wrong: a LIMIT inside the window subquery takes the top-3 of the **whole table** before partitioning, not per customer. **Option 4** misses the meaning completely (it counts transactions, it does not rank them by amount).`,
      },
    ],
  },
  'lesson-sql-005': {
    title: 'The JOIN algorithms a database uses: nested loop, hash join, merge join, and reading EXPLAIN',
    goals: [
      'Describe how nested loop, hash join and merge join work and when the optimizer picks each one',
      'Explain why a JOIN without an index turns into a slow nested loop (n × m), and why a null key never matches in an equi-join',
      'Read EXPLAIN (PostgreSQL) well enough to recognise Hash Join / Nested Loop / Merge Join / Seq Scan and know the first step to take',
    ],
    body: `### A SQL JOIN only says "what you want"; the DB picks "how"
When you write {{SELECT ... FROM orders o JOIN customer c ON o.customer_id = c.id}}, you describe the result you want. The **optimizer** (the part of the DB that decides the execution plan) estimates the data sizes and chooses a join algorithm. The three main ones are nested loop, hash join and merge join. Understanding them lets you read EXPLAIN and know why a JOIN query suddenly became slow.

Convention: the table scanned on the outside is the **outer/build/probe** side depending on context, the table looked up on the inside is the **inner** side.

### Nested loop join
The simplest one: for every outer row, find the matching rows in inner.

~~~java
// basic nested loop (no index on the inner side)
for (Row o : outer) {
    for (Row i : inner) {            // scan the WHOLE inner side for EVERY outer row
        if (eq(o.key, i.key)) emit(o, i);
    }
}
~~~

- No index on inner: **n × m** comparisons (n outer rows, m inner rows). Two tables of 10,000 rows = 100 million comparisons.
- Inner has a (B-tree) index on the join key: the inner loop walks the tree in about {{log2(m)}} steps, total **n × log m**. 100 outer rows and 10 million indexed inner rows: about 2,400 steps.
- The DB picks it when: the outer side is very small (after the WHERE filter) and inner has an index; or the join is **not an equality** ({{a.ts BETWEEN b.start AND b.end}}) — hash and merge cannot be used for a condition that is not {{=}}.

### Hash join
Runs in two phases and only works for **equi-joins** (equality {{=}}):
1. **Build**: read the **smaller** side and put each row into a hash table (a lookup structure keyed by value, average O(1) per lookup) under its join key.
2. **Probe**: read the larger side, hash its key and look it up in the hash table to find matching rows.

Total about **O(n + m)**: each side is read once. The memory needed is roughly the size of the build side; PostgreSQL caps it with {{work_mem}}. When it spills, the join is split into batches written to temporary files (slow). The DB chooses hash join when both sides are large and the join uses {{=}}.

### Merge join
If **both sides are already sorted** on the join key (thanks to an index or to an explicit sort), two cursors move in parallel like the merge phase of merge sort: whichever side holds the smaller key, advance that cursor. About **O(n + m)** when the order already exists, plus O(n log n) when a sort is needed. Requires a {{=}} join. Less common than hash join on data with no natural order, but excellent when an index already provides that order.

| Algorithm | Approximate cost | Memory | Join condition | When the optimizer picks it |
|---|---|---|---|---|
| Nested loop (no index) | n × m | very little | any | inner is very small; rarely good for large tables |
| Nested loop (index) | n × log m | little | any | outer small, inner large with an index (typical OLTP) |
| Hash join | n + m | hash table the size of the smaller side | only {{=}} | both sides large, equi-join, enough RAM |
| Merge join | n+m (+ sort) | little if already sorted | only {{=}} | both sides already ordered by the key / after a sort |

### Why a missing index makes a JOIN slow
The usual story: {{orders JOIN customer ON orders.customer_id = customer.id}}. {{customer.id}} is the primary key, so it has an index; but if {{orders}} yields 50,000 rows and {{customer}} gets scanned the other way round (the planner picks nested loop with a Seq Scan on a large table as the inner side) while **the join key on the inner side has no index**, the inner loop becomes a repeated full table scan. 50,000 × (full scan) = billions of reads. Adding an index on the join column (or letting the planner choose hash join) brings it back to n log m or n+m.

### A null key never matches in an equi-join (SQL semantics)
In SQL, {{NULL = NULL}} evaluates to **UNKNOWN** (not TRUE), so a row whose join key is NULL **matches nothing**, not even another row that is also NULL. This is mandatory behaviour for an equi-join. A Java simulation of the join must keep it (the exercise checks exactly this).

### Reading EXPLAIN (PostgreSQL) well enough to spot the algorithm
{{EXPLAIN ANALYZE}} really executes the statement and prints the plan. You need to recognise:

~~~text
Hash Join  (actual time=1.2..45.6 rows=4820 loops=1)
  Hash Cond: (o.customer_id = c.id)
  ->  Seq Scan on orders o  (actual ... rows=50000 loops=1)
  ->  Hash  (actual ... rows=12000 loops=1)
        ->  Seq Scan on customer c  (actual ... rows=12000 loops=1)
~~~

~~~text
Nested Loop  (actual time=0.1..8200.0 rows=4820 loops=1)
  ->  Seq Scan on orders o  (actual ... rows=50000 loops=1)
  ->  Seq Scan on customer c  (actual ... rows=1 loops=50000)
        Filter: (c.id = o.customer_id)
~~~

How to read it:
- {{Hash Join}} / {{Hash Cond}}: a hash join. Two {{Seq Scan}}s plus a {{Hash}} node is normal for medium/large tables.
- {{Nested Loop}} whose inner side is a {{Seq Scan}} with a big {{loops}} (50,000): the inner table is re-scanned 50,000 times — the classic sign of a missing index on the join key or of a wrong estimate.
- {{Merge Join}} / {{Merge Cond}}: a merge join, usually together with {{Index Scan}} (the order is already there) or with {{Sort}}.
- {{Seq Scan}} (a sequential read of the whole table) is not absolutely bad; it is bad when it repeats many times (large {{loops}}) or on a very large table when you only need a few rows and a suitable index exists.

> Real-world pitfall: trusting the planner blindly. The planner chooses from **estimates**; stale statistics (no {{ANALYZE}} run after a big import) make it think the outer side is small, so it picks nested loop while the outer side is really large and the query grinds to a halt. First step when a join is slow: run {{EXPLAIN (ANALYZE, BUFFERS)}} and compare estimated {{rows}} with {{actual rows}} — a gap of more than 10× is a major clue. Fix it with {{ANALYZE}}, the right index, or (carefully) forcing a plan for diagnosis only.

> Senior tip: on PostgreSQL, {{enable_nestloop = off}} (set for the session only) is a fast diagnostic: if disabling nested loop makes the query fast again, the problem is the planner picking nested loop wrongly (usually a bad estimate or a missing index) — never leave this flag off permanently in production. Hash join consumes {{work_mem}}; if EXPLAIN shows {{Batches > 1}} on the Hash node, the hash table spilled to disk, so consider raising {{work_mem}} for that session/query (do not raise it globally at random).

### Interview relevance
Typical questions: "How does a DB join two tables?", "A join query is slow, what do you do?", "Hash join vs nested loop — what is the difference?". A good answer names the three algorithms with their costs (n×m, n×log m, n+m) and conditions ({{=}} required for hash/merge), says the optimizer decides from estimates/sizes/indexes, and gives a procedure: EXPLAIN ANALYZE → identify the algorithm, loops and row mis-estimates → check the index on the join key → refresh statistics with ANALYZE. Mentioning that a null key never matches is a bonus that shows you really understand SQL semantics.`,
    exercises: [
      {
        title: 'Nested loop, hash join, merge join: same result, different number of comparisons',
        prompt: `{{Row}} is given: {{key}} ({{Integer}}, may be {{null}}) and {{val}} (String). Write a {{Joins}} class implementing the three equi-join algorithms on {{key}} ({{left.key = right.key}}). Each result pair is a String array of 2 elements: {{left.val}} then {{right.val}} (left first, right second). The order of the pairs in the result does not matter.

Rules (same as SQL): a **{{null}} key matches nothing**, not even another {{null}} key. Repeated keys: one left row matching two right rows → 2 pairs.

- {{nestedLoop(left, right)}}: consider every pair. Each check of one pair {{(l, r)}} (even when a null key makes a match impossible) counts as **1 comparison**. Expose the count through {{getComparisons()}} (reset to 0 at each call).
- {{hashJoin(left, right)}}: build the hash table from the **smaller** side (equal sizes → choose {{left}}), probe the other side. Each lookup/match check for one probe row counts as **1 comparison** (count the probe rows considered for lookup; skip probe rows whose key is null, they are not looked up). {{getComparisons()}} resets to 0 at each call.
- {{mergeJoin(left, right)}}: assume the input is **not** sorted; copy and sort both sides by {{key}} ascending ({{null}} last), then merge with two cursors. Each time you compare two keys to decide which cursor advances (or to detect a match) counts as **1 comparison**. Handle repeated keys correctly (a group of rows sharing the same key on each side). {{getComparisons()}} resets to 0 at each call.

The three functions must return **the same set of pairs** (ignoring order) on the same data.`,
        hints: [
          'Null key: in {{keyEq}} return false as soon as either side is null. Hash join: never insert a null key into the hash table and never probe with a null key. Merge join: sort nulls to the end and walk only the non-null prefix.',
          'Hash join builds from the smaller side: choose {{build/probe}} by size, and keep a flag so the emitted pairs still follow the order {{left.val, right.val}}. Use {{Map<Integer, List<Row>>}} because keys can repeat.',
          'Merge join with repeated keys: when the two cursors meet equal keys, emit all pairs of the group (every left row in the group × every right row in the group), then jump both cursors past that whole group. Only the key comparisons used to decide which cursor advances count as comparisons.',
        ],
        explain: `### Why the three algorithms produce the same result
All three perform the same equi-join {{left.key = right.key}} with the same semantics (nulls never match, repeated keys generate many pairs). They differ only in **how they find** the matching pairs: nested loop tries every pair, hash join uses a hash table lookup, merge join exploits sorted order. That is exactly why the optimizer treats them as alternative plans for one and the same SQL statement.

### What the comparison count reflects
- Nested loop: always {{n*m}} (the test: 30×40 = 1200) — worst when both sides are large, which is what a nested Seq Scan with a big {{loops}} looks like in EXPLAIN.
- Hash join: about the number of probe rows (after dropping nulls), since each row does one O(1) hash lookup — corresponding to reading each side once.
- Merge join: the key comparisons that advance the two cursors over sorted data grow roughly linearly with n+m (plus the sort cost, which you are not counting here). When the data already arrives ordered (from an index), merge join is very cheap.

### Common mistakes
- **Treating {{null == null}} as a match**: wrong SQL semantics; use {{equals}} after excluding nulls, or return false from the null check.
- **Hash join forgetting repeated keys**: a {{Map<Integer, Row>}} overwrites entries → pairs get lost.
- **Hash join flipping left/right** when the build side is the right one: the returned pairs come back in the wrong order.
- **Merge join not grouping repeated keys**: emitting one pair and advancing one cursor → the rest of the group is lost.
- **Counting comparisons off a different convention**: it does not break the result but makes you read the cost wrong; stick to the statement (nested loop: one per pair; hash: one per probe lookup).

### Relation to EXPLAIN
The 1200 comparisons of nested loop in this exercise mirror a {{Nested Loop}} node with a big {{loops}} and a repeated inner scan. Hash join's "read each side once" mirrors the {{Hash Join}} node ({{Hash}} built once, probe scanned once). Merge join mirrors a {{Merge Join}} over already ordered {{Index Scan}}s. When you see {{Nested Loop}} + {{Seq Scan}} + a big {{loops}}, the first question is: "is there an index on the join key, and are the statistics up to date?"`,
      },
    ],
    check: [
      {
        q: 'In a SQL equi-join {{A JOIN B ON A.k = B.k}}, do two rows with {{A.k = NULL}} and {{B.k = NULL}} match each other?',
        options: ['Yes, because both are NULL', 'No, because {{NULL = NULL}} evaluates to UNKNOWN, so the pair does not match in a join', 'Yes, if a hash join is used', 'They match only when {{IS NOT DISTINCT FROM}} is applied implicitly'],
        explain: `**Option 2 is correct**: SQL has three truth values (TRUE/FALSE/UNKNOWN), {{NULL = NULL}} is UNKNOWN, and a join condition only accepts TRUE, so a NULL-NULL pair is never emitted. **Option 1** is wrong because it assumes two-valued logic. **Option 3** is wrong: the algorithm (hash/nested/merge) never changes SQL semantics. **Option 4** is wrong: an ordinary join uses {{=}} and does not silently use {{IS NOT DISTINCT FROM}} (an operator that treats two NULLs as equal; PostgreSQL supports it, but you have to write it explicitly).`,
      },
      {
        q: 'EXPLAIN ANALYZE shows {{Nested Loop}}; the inner node is a {{Seq Scan on customer}} with {{loops=50000}}. What does this sign usually mean, and what is the first thing to do?',
        options: ['Hash join was disabled; re-enable it and the slowness goes away', 'The inner table is scanned in full 50,000 times, usually because of a missing index on the join key or a wrong estimate; check the index and {{ANALYZE}}/compare estimated rows with actual rows', 'The customer table is too small, so a Seq Scan is optimal', 'Merge join will automatically replace it on the next run'],
        explain: `**Option 2 is correct**: {{Seq Scan}} + a big {{loops}} = the whole table re-scanned on every iteration (nested loop without an index, cost n×m). Check for an index on the inner join column, and compare estimated {{rows}} with {{actual rows}}, because wrong statistics make the planner pick nested loop by mistake. **Option 1** is wrong: toggling a flag does not address the root cause (missing index / wrong estimate). **Option 3** contradicts itself: a small fixed table would not show {{loops=50000}} like that, and 50,000 repeated Seq Scans stay expensive anyway. **Option 4** is wrong: the planner does not "learn" between runs like that; it relies on statistics.`,
      },
      {
        q: 'When does the optimizer usually pick hash join instead of nested loop (with an index)?',
        options: ['When the outer side is very small after filtering and the inner side has a good index', 'When the join is not an equality ({{<}}, {{BETWEEN}})', 'When both sides are large, the join is an equi-join ({{=}}), and the hash table fits in memory', 'When both sides already come out ordered by the join key from an index'],
        explain: `**Option 3 is correct**: when both sides are large, n×log m (indexed nested loop) stays expensive because n is large; hash join is about n+m for an equi-join, reading each side once, as long as the hash table fits in RAM. **Option 1** is the case where indexed nested loop wins. **Option 2** rules hash/merge out (they support only {{=}}) and usually forces nested loop. **Option 4** favours merge join (it exploits the existing order and needs no hash table).`,
      },
    ],
  },
});
