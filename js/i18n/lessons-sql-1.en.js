/*
 * English translation of js/data/lessons-sql.js — task T458. Format: js/core/i18n.js (content overlay).
 * ids: lesson-sql-001 lesson-sql-002
 */
App.i18n.content({
  'lesson-sql-001': {
    title: 'Joins from the inside: nested loop, hash join, merge join, and counting comparisons',
    goals: [
      'Describe step by step how the DB executes nested loop join, hash join, and merge join',
      'Compute the number of comparisons for each algorithm and explain why hash join wins on large data',
      'Read the signs of a badly chosen join in {{EXPLAIN ANALYZE}} (high loops, Batches > 1, wrong row estimates) and know how to fix them',
    ],
    body: `### A join is not magic: the DB has to pick an algorithm
When you write {{SELECT ... FROM orders o JOIN customer c ON o.customer_id = c.id}}, SQL only states **what you want**, never **how to do it**. The database optimizer (the "planner") estimates how many rows each side has, then picks one of three join algorithms: **nested loop**, **hash join**, **merge join**. A join is usually the most expensive part of a multi-table query, and choosing the wrong algorithm is a common reason a query goes from 10 ms to 10 s.

Naming convention: the table driven in the outer loop is called the **outer** side; the table looked up in the inner loop is called the **inner** side.

### Nested loop join: simple, cheap when the outer side has few rows
The most natural approach: take each row of the outer side, then find the matching rows in the inner side.

~~~java
// Nested loop WITHOUT an index: each outer row scans the whole inner side
for (Row o : outer) {
    for (Row i : inner) {
        if (o.id == i.id) {          // one key comparison
            result.add(pair(o, i));
        }
    }
}
~~~

With {{n}} outer rows and {{m}} inner rows, the number of comparisons is **n × m**. Two tables of 10,000 rows mean **100 million** comparisons. But if the inner side **has an index** (a B-tree) on the join column, the inner loop no longer scans everything: it descends the tree, about {{log2(m)}} steps per outer row, so roughly **n × log m** in total. For example, 100 outer rows against 10 million indexed inner rows: 100 × 24 ≈ 2,400 steps, faster than any other algorithm because it never reads all 10 million rows.

The DB picks nested loop when:
- The outer side has **very few rows** (after WHERE filtering) and the inner side has an index on the join key. This is the best case, very common in OLTP ("fetch 20 orders of customer X together with the product names").
- The join condition is **not an equality** ({{a.ts BETWEEN b.start AND b.end}}, {{a.x > b.y}}): hash join and merge join simply do not apply.

### Hash join: build, then probe
A hash join runs in two phases:
1. **Build**: read the **smaller** side (by estimate) and insert each row into an in-memory hash table keyed by the join column.
2. **Probe**: read the larger side row by row, hash the key and look it up in the hash table: **O(1)** per lookup on average, without comparing against every row.

Total cost is about **O(n + m)**: each side is read exactly once. The conditions: the join uses {{=}} (equi-join), and the hash table should fit in memory. On PostgreSQL the limit is {{work_mem}} × {{hash_mem_multiplier}} (default 2.0 since PG 15). Beyond that limit PG splits the data into several **batches** and spills them to disk; in {{EXPLAIN ANALYZE}} the {{Hash}} node shows {{Batches: 1}} when it fits in RAM, while {{Batches: 8}} means it has spilled to disk and is much slower. MySQL only supports hash join from 8.0.18; older versions only have nested loop (with block nested loop).

### Merge join: when both sides are sorted, walk the keys side by side
If both sides are **already sorted by the join key** (thanks to an index or to a sort step), the DB uses two pointers advancing in parallel, exactly like merging two sorted lists in merge sort: whichever key is smaller advances its pointer. The cost is O(n + m) when the order is already available, plus O(n log n) if a sort is needed. PostgreSQL has merge join; MySQL does not.

| Algorithm | Steps (approx.) | Extra memory | Good when |
|---|---|---|---|
| Nested loop, inner without index | n × m | almost none | inner has only a few rows |
| Nested loop, inner with index | n × log m | negligible | outer has few rows, large indexed inner |
| Hash join | n + m | hash table the size of the smaller side | both sides large, equality join {{=}} |
| Merge join | n + m (+ sort) | little, if already ordered | both sides already sorted by the key |

### Reading the signs in EXPLAIN ANALYZE
PostgreSQL does not print a "number of comparisons", but it prints enough for you to deduce it:

~~~text
Nested Loop  (cost=... rows=12 ...) (actual time=0.05..8123.4 rows=48210 loops=1)
  ->  Seq Scan on orders o  (... rows=12 ...) (actual ... rows=48210 loops=1)
        Filter: (status = 'NEW')
  ->  Seq Scan on customer c  (... rows=1 ...) (actual ... rows=1 loops=48210)
        Filter: (id = o.customer_id)
~~~

Line by line:
- The planner **estimates** the outer side at only {{rows=12}}, so nested loop looks cheap. In reality ({{actual rows}}) it is 48,210 rows: the estimate is off by a factor of 4,000, usually because the statistics are stale (the table was just bulk loaded and never {{ANALYZE}}d).
- The inner side is a {{Seq Scan}} with {{loops=48210}}: the {{customer}} table is **fully scanned 48,210 times**. That is exactly the n × m from the table above.
- Fixes, in order: run {{ANALYZE orders}} so the planner estimates correctly (it then switches to hash join by itself); check whether {{customer.id}} has an index (a primary key always does); if the filtered columns are correlated and the estimate is still wrong, use {{CREATE STATISTICS}} (extended statistics).

> Real-world pitfall: a query runs in 20 ms for months, then one night after a big import it suddenly takes 8 s. The code did not change, the indexes did not change; what changed is the **statistics**. The planner still believes the table is small, so it picks nested loop. Autovacuum runs {{ANALYZE}} based on a percentage-of-changes threshold, so on a large table it can run late; after a big batch import, call {{ANALYZE}} yourself.

> Senior tip: when reading a plan, compare **estimated rows with actual rows** first. Being off by more than 10× is the root cause of most bad plans. For hash join, look at {{Batches}}: if it is greater than 1, raise {{work_mem}} **for that session/query only** ({{SET LOCAL work_mem = '256MB'}} inside the transaction); do not raise it globally, because every sort/hash node of every connection may then use that much and you can exhaust RAM.

### Interview notes
A common question: "The plan shows a Nested Loop with loops = 200,000. What do you do?" The weak answer is "add an index". The senior answer: (1) compare estimated rows with actual rows to see whether the planner misunderstands the data, (2) check whether the inner side is a Seq Scan or an Index Scan, (3) refresh statistics or add an index on the join key, (4) re-measure with {{EXPLAIN (ANALYZE, BUFFERS)}} and compare the buffer counts before and after. Being able to explain n × m, n × log m, and n + m is a big plus, because it shows you understand **why** a plan is fast or slow.`,
    exercises: [
      {
        title: 'Write nested loop join and hash join yourself, counting the steps',
        prompt: `Write a class {{JoinEngine}} that simulates two join algorithms on the {{id}} key (equi-join {{left.id = right.id}}).

{{Row}} is provided: field {{id}} (int) and {{value}} (String). Each result pair is a two-element {{String[]}} holding {{left.value}} then {{right.value}}, **always left first, then right**, no matter which side the hash table was built from. The order of the pairs inside the result list does not matter. Keys may repeat on both sides (just like a real join: one left row matching two right rows yields two pairs).

- {{nestedLoopJoin(left, right)}}: two nested loops. {{getNestedCount()}} returns the **number of key comparisons** performed, i.e. exactly {{left.size() * right.size()}}.
- {{hashJoin(left, right)}}: build a {{HashMap}} from the side with **fewer rows** (if the sizes are equal, pick {{left}}), then iterate the remaining side and probe the map. {{getHashCount()}} returns the **number of hash table probes** in the probe phase, i.e. the number of rows on the probe side (the build phase does not count).
- Every call must **reset** the corresponding counter to 0 before counting.`,
        hints: [
          'Nested loop: two nested {{for}} loops, increment the counter for **every** pair, including the pairs that do not match.',
          'Hash join: because keys can repeat, the map must be {{Map<Integer, List<Row>>}}; use {{computeIfAbsent(id, k -> new ArrayList<>())}} while building.',
          'Remember to keep a "was the build side left or right" flag so that, when emitting pairs, you can still place the left value first.',
        ],
        explain: `### Why the solution is correct
- Nested loop counts on **every** pair, so it always yields exactly n × m: that is the real cost of a join without an index, even when no pair matches.
- Hash join reads the small side once to build, and the large side once to probe. Each probe row looks up the map **once** (O(1) on average), so the total is n + m. In the large test: nested loop needs 100,000 comparisons while hash join needs only 1,000 map lookups (plus 100 insertions during build), and both produce the same 500 pairs.

### Common mistakes
- Using {{Map<Integer, Row>}} instead of {{Map<Integer, List<Row>>}}: duplicate keys overwrite each other and pairs are lost. A real join must always handle duplicate keys (a one-to-many relationship).
- When building from the right side, emitting pairs in (probe row, build row) order swaps left and right. The "pairs stay left|right" test catches this bug.
- Forgetting to reset the counters, so the second call adds on top of the previous one.

### Relation to a real database
This is exactly why the planner wants to build from the **smaller** side: a small hash table fits in {{work_mem}}. If the estimate is wrong (it mistakes the large side for the small one), the hash table grows, spills to disk in several batches, and the hash join becomes much slower.`,
      },
    ],
    check: [
      {
        q: 'How many key comparisons does a nested loop join **without an index** need for two tables of 1,000 and 2,000 rows?',
        options: ['1,000', '2,000', '2,000,000', '3,000'],
        explain: `**2,000,000 is correct**: each of the 1,000 outer rows must be compared with all 2,000 inner rows, i.e. 1,000 × 2,000. **1,000** and **2,000** are wrong because they count only one side, as if each row were compared just once. **3,000** is n + m, the approximate cost of **hash join** (each side read once), not nested loop.`,
      },
      {
        q: 'In which situation is hash join usually the best choice?',
        options: ['The outer side has only a few rows and the inner side has an index on the join key', 'Both tables have fewer than 100 rows', 'Both sides are large, the join is an equality, and the hash table fits in memory', 'The join condition is {{a.id > b.id}}'],
        explain: `**Option 3 is correct**: with two large sides, both n × m and n × log m are expensive, while hash join reads each side only once (n + m), as long as the join is an equality and the hash table does not spill to disk. **Option 1** is wrong: that is the best case for **indexed nested loop** (only a few B-tree descents, no need to read the whole large table to build). **Option 2** is wrong: with tiny data every algorithm is fast, so the cost of building the hash table is not worth it. **Option 4** is wrong: a hash can only probe for equality, so a {{>}} condition forces the DB to use nested loop.`,
      },
      {
        q: 'Production: a join shows {{loops=500000}} on the inner side and its runtime suddenly jumped after a large import. What should you do first?',
        options: ['Add RAM to the DB server right away', 'Run EXPLAIN ANALYZE, compare estimated rows with actual rows, and check whether the inner side is a Seq Scan or an Index Scan', 'Drop the index on the inner table', 'Split the query into two subqueries to make it easier to read'],
        explain: `**Option 2 is correct**: you have to know **why** the planner chose nested loop. The most common reason is stale statistics that make the planner believe the outer side has only a few rows; re-running {{ANALYZE}} on the table fixes it. If the inner side is a Seq Scan with high loops, the join key lacks an index. **Adding RAM** is wrong because nested loop is not limited by memory; it is slow because it repeats many times. **Dropping the index** makes things worse: the inner side will be fully scanned on every iteration. **Splitting into subqueries** only changes how the query is written; the planner usually flattens it back into the same plan, so it does not address the root cause.`,
      },
    ],
  },
  'lesson-sql-002': {
    title: 'Offset and keyset pagination: why deeper pages get slower',
    goals: [
      'Explain why a large {{OFFSET}} keeps getting slower even though only 20 rows are returned',
      'Write keyset pagination correctly when the sort key is not unique (add {{id}} as a tie-breaker)',
      'Simulate both approaches with {{TreeMap}} and count how many rows each one has to read',
    ],
    body: `### Offset pagination: easy to write, progressively slower
The most familiar approach (and what Spring Data's {{Pageable}} does by default):

~~~sql
SELECT * FROM orders
ORDER BY created_at DESC, id DESC
LIMIT 20 OFFSET 100000;     -- page 5,001, 20 rows per page
~~~

The DB **cannot jump straight** to row 100,000: it has no way to know which row that is without counting from the beginning. Therefore:
- With an index on {{(created_at, id)}}: the DB walks the index, reads **100,020** entries (plus table accesses for {{SELECT *}}), then **throws away the first 100,000** rows and returns the last 20.
- Without an index: the DB must read the whole table and sort it (a top-N sort keeping the best 100,020 rows), which is even more expensive.

The cost grows **linearly with the offset**: page 1 reads 20 rows, page 5,001 reads 100,020 rows, page 500,001 reads 10 million rows. On a large table, a deep page can take seconds while the first page takes milliseconds.

Offset also has a **correctness** problem, not just a performance one: if a new row is inserted at the top while the user is viewing page 1, then when they move to page 2 every row shifts down by one position and the user **sees again** a row they already saw. Deleting a row does the opposite: one row gets **skipped**.

> Real-world pitfall: Spring Data's {{Page<T>}} also runs an extra {{SELECT COUNT(*)}} for every request to compute {{totalPages}}. On a table with tens of millions of rows this count query can be slower than the data query itself. If you do not need the total number of pages, return {{Slice<T>}} (no count); and crawler bots walking deep pages are a classic way to overload the database.

### Keyset pagination: remember the position, do not recount
The idea: instead of saying "skip 100,000 rows", the client sends back the **key of the last row of the previous page** (called a cursor), and the DB fetches the rows **after** that key:

~~~sql
-- last row of the previous page: created_at = '2024-05-01 10:00:00', id = 99999
SELECT * FROM orders
WHERE (created_at, id) < ('2024-05-01 10:00:00', 99999)
ORDER BY created_at DESC, id DESC
LIMIT 20;
~~~

With a B-tree index on {{(created_at, id)}}, the DB **descends the tree** to exactly the cursor position (O(log n), a few index pages), then reads the next 20 entries. Page 1 and page 5,001 cost the same.

Three details decide correctness:
- **The sort key must be unique.** Many orders share the same {{created_at}}; if you only filter {{created_at < ?}}, the rows that share the timestamp of the last row of the page will be **skipped**. Always add {{id}} as a tie-breaker, both inside {{ORDER BY}} and inside the condition.
- **Row-value comparison** {{(a, b) < (x, y)}} means {{a < x OR (a = x AND b < y)}}. PostgreSQL uses an index very well with this syntax. MySQL understands the syntax but in some versions optimizes it poorly; in that case write the explicit form {{created_at < ? OR (created_at = ? AND id < ?)}} and verify with {{EXPLAIN}}.
- **The comparison direction must match the sort direction**: {{ORDER BY ... DESC}} goes with {{<}}, {{ASC}} goes with {{>}}.

Spring Data 3.1+ supports this out of the box via {{ScrollPosition.keyset()}} and the {{Window<T>}} return type.

| | Offset | Keyset |
|---|---|---|
| Rows that must be read for a deep page | offset + limit, growing linearly | log n to find the position + limit, essentially constant |
| Jump straight to page 50 | possible | not possible (only previous and next) |
| Data changing between two pages | duplicated or skipped rows | stable |
| Implementation difficulty | very easy | needs the right index and a cursor |

### Simulating it with TreeMap
A database B-tree index is an **ordered** structure: finding the position of a key costs O(log n), and from there you read the following keys sequentially. In Java, {{TreeMap}} (a red-black tree) offers exactly those two abilities: {{tailMap(key, false)}} jumps to the keys greater than {{key}} in O(log n) and then iterates them in order. Simulating offset, on the other hand, leaves only one option: iterate from the beginning and count, exactly as the DB must. The exercise below shows you that difference in numbers.

> Senior tip: do not expose a raw {{id}} as the cursor in a public URL. Encode the (created_at, id) pair into an opaque Base64 string, so that later you can change the sort column without breaking clients, and return {{hasMore}} instead of {{totalPages}}. Large public APIs such as Stripe ({{starting_after}}) and GitHub (GraphQL cursors) all work this way.

### Interview notes
A common question: "A transactions table with 80 million rows; the history API is slow on deep pages. How do you fix it?" A good answer: explain that offset has to read and then discard {{offset}} rows; switch to keyset with an index {{(account_id, created_at, id)}} that matches the WHERE and the ORDER BY exactly; handle the tie-breaker; state the trade-off (you lose the ability to jump to an arbitrary page) and the mitigations (cap the maximum page number for offset on admin screens, or allow filtering by date range so users can get close to the position they want).`,
    exercises: [
      {
        title: 'Simulate offset and keyset pagination with TreeMap, counting the rows read',
        prompt: `Write a class {{PaginationSim}} that simulates a table with an index on {{id}} (sorted **ascending**):

- Constructor {{PaginationSim(List<Row> data)}}: put the data into a {{TreeMap<Long, Row>}} keyed by {{row.id}}. On a duplicate {{id}} the later row overwrites the earlier one (exactly like {{TreeMap.put}}).
- {{getPageWithOffset(int offset, int limit)}}: return at most {{limit}} rows starting at position {{offset}} (counted from 0) in ascending {{id}} order. {{getTraversedOffset()}} returns the **number of entries walked** during this call, including the rows that were skipped, i.e. {{min(offset + limit, number of rows)}}.
- {{getPageWithKeyset(Long lastId, int limit)}}: {{lastId == null}} means the first page; otherwise return at most {{limit}} rows with {{id > lastId}} ({{lastId}} may not exist in the table). {{getTraversedKeyset()}} returns the **number of entries read after jumping to the starting position**, i.e. the number of rows returned (the O(log n) jump of the tree does not count).

You must not copy the data into an {{ArrayList}} and then use {{subList}}: the whole point is to see the real traversal cost.`,
        hints: [
          '{{tree.values()}} returns the values in ascending key order; iterating it with a for-each loop is exactly "walking the index".',
          'Offset: keep a position variable, increment the counter for every entry you pass, only add to the page when the position is ≥ offset, and stop once the page holds {{limit}} rows.',
          'Keyset: {{tree.tailMap(lastId, false)}} returns the part of the map whose keys are **strictly greater** than {{lastId}}, even when {{lastId}} does not exist in the map.',
        ],
        explain: `### The numbers say it all
In the last test, walking all 1,000 rows with keyset (20 pages × 50 rows) reads **1,000** entries in total: every row exactly once. Yet with offset, the last page alone ({{offset = 950}}) already reads **1,000** entries. Walking all 20 pages with offset would read 50 + 100 + ... + 1,000 = **10,500** entries: a quadratic cost in the number of pages.

### Common mistakes
- Counting offset as only the rows returned: wrong, because the real cost lies in the rows **skipped**.
- Using {{tailMap(lastId)}} (a single argument) makes the key {{lastId}} inclusive, so the last row of the previous page is repeated on the next page.
- Using {{tree.get(lastId)}} to find the position: it breaks when that row has just been deleted. A correct keyset compares "greater than" and does not need that row to still exist.

### Difference from a real database
TreeMap has unique keys, so it does not need a tie-breaker; in SQL a column such as {{created_at}} can repeat, so the cursor must be the {{(created_at, id)}} pair.`,
      },
    ],
    check: [
      {
        q: 'An API runs {{ORDER BY id LIMIT 20 OFFSET 500000}} on a 10-million-row table with an index on {{id}}. What is the main cost?',
        options: ['It reads exactly 20 rows thanks to the index', 'It reads 500,020 rows in order and then throws away the first 500,000 rows', 'It computes a hash for 500,000 rows', 'It creates a temporary table holding 10 million rows'],
        explain: `**Option 2 is correct**: the index provides the order but does not tell the DB "which row is number 500,000", so the DB has to walk 500,020 entries and discard 500,000. **Option 1** is wrong: only keyset can jump straight to a position. **Option 3** is wrong: offset has nothing to do with hashing. **Option 4** is wrong: with a correctly ordered index the DB reads sequentially along the index and needs no full temporary table.`,
      },
      {
        q: 'Why does keyset pagination not support jumping straight from page 1 to page 100 well?',
        options: ['Because a B-tree does not support range searches', 'Because it needs the key of the last row of page 99, and to know that key you have to walk from the beginning', 'Because the cost of each keyset page grows with the page number', 'Because the DB does not allow ORDER BY on several columns'],
        explain: `**Option 2 is correct**: the cursor is the key of the last row of the previous page; knowing only the page number does not let you derive that key without counting from the beginning, which is offset cost again. **Option 1** is wrong: range search is exactly the strength of a B-tree and the very thing keyset relies on. **Option 3** is wrong: the cost of each keyset page is essentially constant. **Option 4** is wrong: ORDER BY on several columns is perfectly legal, and keyset needs it to have a tie-breaker.`,
      },
      {
        q: 'A table has an index on {{(created_at, id)}} and many rows share the same {{created_at}}. Which statement is **correct** keyset pagination for the next page (newest first)?',
        options: [
          'SELECT * FROM t ORDER BY created_at DESC, id DESC LIMIT 20 OFFSET 1000',
          'SELECT * FROM t WHERE created_at < ? ORDER BY created_at DESC, id DESC LIMIT 20',
          'SELECT * FROM t WHERE (created_at, id) < (?, ?) ORDER BY created_at DESC, id DESC LIMIT 20',
          'SELECT * FROM t WHERE (created_at, id) > (?, ?) ORDER BY created_at DESC, id DESC LIMIT 20',
        ],
        explain: `**Option 3 is correct**: it compares the {{(created_at, id)}} pair with the last row of the previous page, in the right direction ({{<}} for DESC), with an ORDER BY that matches the index. **Option 1** is offset, not keyset. **Option 2** looks almost right but **skips** the rows that share {{created_at}} with the last row of the page and have not been shown yet, because it lacks the {{id}} tie-breaker. **Option 4** has the wrong direction: with DESC, {{>}} fetches the **newer** rows, i.e. data from the previous pages.`,
      },
    ],
  },
});
