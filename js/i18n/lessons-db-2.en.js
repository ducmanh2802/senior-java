/*
 * English translation of js/data/lessons-db.js — task T455. Format: js/core/i18n.js (content overlay).
 * ids: lesson-db-002 lesson-db-003 lesson-db-004 lesson-db-005
 */
App.i18n.content({
  'lesson-db-002': {
    title: 'Optimistic locking: version check and bounded retry',
    goals: ['Simulate compare-and-set with a version', 'Handle conflicts without overwriting newer updates', 'Design safe transaction retries'],
    body: `**Summary:** Optimistic locking lets many readers work concurrently and only accepts a write if the version has not changed. Conflicts are detected at write time and must be handled explicitly, usually by re-reading and retrying the business operation.

### The version is the UPDATE condition
A row has a (value, version) pair. A transaction reads (10, 4), computes the new value, and then sends an update only if the version is still 4. On success it writes the value and increments the version to 5. If another transaction has already updated the row, the condition does not match, the number of updated rows is 0, and the transaction knows it was working with stale data.

~~~java
if (row.version == expectedVersion) {
    row.value = newValue;
    row.version++;
    return true;
}
return false; // caller must reload and decide whether to retry
~~~

In SQL this corresponds to {{UPDATE account SET balance=?, version=version+1 WHERE id=? AND version=?}}. Not checking the row count is a serious bug: the request may report success even though the update never happened. ORMs such as Hibernate support {{@Version}} and typically throw an optimistic lock exception when the update does not match.

### A retry must recompute
A correct retry means starting a new transaction, reading the new state, recomputing the change from the business input, and trying again. You should not just resend the same SQL with the old absolute value; that can repeat a stale write. Bound the number of retries, add jitter when contention is high, and return a conflict to the client when reconciliation is impossible.

### PostgreSQL MVCC
MVCC lets readers avoid blocking writers in many cases, but it does not by itself prevent lost updates in read-compute-write applications at READ COMMITTED. The version predicate turns integrity into an atomic write condition. A single atomic UPDATE on a column may also be a better fit for a simple increment. For multi-row invariants, a single row version is not enough; consider constraints, locking, or SERIALIZABLE.

| Approach | Fits | Trade-off |
|---|---|---|
| Version check | few conflicts, updates from an object already read | retry/conflict handling in the application |
| Atomic SQL update | simple transformations inside the DB | logic must be expressible in SQL |
| Pessimistic row lock | high contention, serialization required | lock waits, deadlocks, low throughput |

### Production pitfalls
Do not perform side effects outside the DB (sending email, calling a payment API) before commit, because every retry repeats them; write an event to an outbox within the same transaction and let a relay send it after commit. Unbounded retries amplify load when the system is already hot. Distinguish business conflicts (the user must choose) from transient errors that can be retried automatically.

### Interview notes
Mention the SQL with a version predicate, explain a row count of 0, then describe the retry loop that starts a new transaction and recomputes. Hibernate {{@Version}} is convenient but does not replace exception handling at the boundary.

> Senior tip: track the optimistic conflict rate per entity type; if it is routinely high, consider an atomic update or locking instead of useless retries.
`,
    exercises: [{
      title: 'Update only if the version still matches',
      prompt: `Implement {{VersionedCounter}}. {{update(expected, delta)}}: if {{expected}} equals the current version, add delta to value, increment the version by 1 and return {{true}}; if it does not match, return {{false}} and keep both value and version unchanged.`,
      hints: ['Check the version before touching value.', 'A conflict must leave both value and version unchanged.'],
      explain: `The version predicate acts as a compare-and-set: only an updater with the current expectedVersion can succeed. If it returns false, the caller must re-read and decide whether to recompute the change; it must not treat that as success. In a database, check the row count of the UPDATE. This single-threaded simulation expresses the conditional logic; the real transaction/atomicity is handled by the database.`
    }],
    check: [
      {q:'An UPDATE with a version predicate returns a row count of 0. What does that usually indicate?',options:['The update committed twice','The data has changed or the row does not exist','The database lost MVCC','The connection pool is full'],answer:1,explain:'The version condition did not match or the id does not exist; the application must distinguish between them by business rules if needed.'},
      {q:'What should a retry of an optimistic conflict do?',options:['Resend the same value computed from the old snapshot','Re-read and recompute in a new transaction','Skip the version check','Retry forever'],answer:1,explain:'The underlying data has already changed; the new transaction must read the new state and recompute.'}
    ]
  },
  'lesson-db-003': {
    title: 'B-tree indexes and full scans: counting comparisons, understanding selectivity',
    goals: ['Compare linear search with lookup in an ordered tree', 'Count comparisons instead of measuring noisy time', 'Understand that an index scan is not always faster than a sequential scan'],
    body: `**Summary:** An index stores an auxiliary structure to find row locations faster than scanning the whole table, at the cost of storage and write overhead. The benefit depends on selectivity, data size and I/O, not just Big O.

### Simulating an ordered index
In the simulation, a full scan checks each key in turn until it matches, so it needs at most N comparisons (a real Seq Scan without LIMIT still reads the whole table because there may be other matching rows). A balanced search tree navigates by comparing at each node, on the order of log2(N) steps (a red-black tree is at most about 2·log2(N) levels high). Java {{TreeMap}} uses a red-black tree and is suitable for simulating ordered lookup operations; this is not a simulation of PostgreSQL's physical layout.

~~~java
int checks = 0;
for (int key : rows) {      // full scan: may examine all N rows
    checks++;
    if (key == target) break;
}
Integer value = tree.get(target); // the tree navigates itself using the comparator
~~~

Counting how many times the comparator is called makes the exercise deterministic. Do not use wall-clock time for small examples because JIT, caches, GC and machine load make the results fluctuate.

### B-trees in PostgreSQL
PostgreSQL uses page-based B-tree indexes, where each page holds many keys and pointers, keeping the tree shallow and reducing page reads compared with a binary tree that has one node per level. An index can support equality, range and ordering. But an index is a separate structure: every INSERT and every non-HOT UPDATE must add an entry to every index on the table, increasing WAL and storage; entries pointing to deleted/updated rows are cleaned up by VACUUM later.

When inserting a new key, PostgreSQL finds the appropriate leaf page and may have to split the page if it is full. Page splits increase write amplification; lowering the index fillfactor (B-tree default 90) leaves free space and reduces splits when inserting in the middle of the key range, at the cost of a larger index. The table fillfactor (default 100) is a different parameter: lowering it leaves room on heap pages for HOT updates. A HOT update only avoids updating indexes when no indexed column changes and there is still room on the heap page; do not assume every UPDATE is equally cheap. Index decisions therefore need to consider both the read/write ratio and the size of the page cache.

The planner estimates cost from statistics and chooses a sequential scan when most of the table needs to be read or the table is small. An index scan can cause many random heap fetches; a bitmap heap scan collects locations to read more efficiently. A covering index with {{INCLUDE}} can enable an index-only scan when the visibility map allows it, but there is no guarantee the heap is always avoided.

| Query | Consideration |
|---|---|
| unique key, large table | a B-tree is usually useful |
| returns a large fraction of rows | a sequential scan may be cheaper |
| ordered range | a B-tree may avoid a sort |
| continuously written column | consider the cost of maintaining the index |

### Production pitfalls
An index on a low-cardinality column is neither automatically useless nor automatically useful; what matters is the number of matching rows and the query pattern. Use {{EXPLAIN (ANALYZE, BUFFERS)}} on a representative workload, and remember ANALYZE to refresh statistics. A query returning a few percent of the table can change plans when the data distribution is skewed.

### Interview notes
Explain how the structure reduces candidate rows, then mention write amplification and the planner's cost-based decision. Do not promise that "an index is always faster"; benchmark numbers must come from the same data, cache and real queries.

> Senior tip: watch buffer hit/read and actual rows versus estimated rows; statistics drift is often more important than Big O arguments.
`,
    exercises: [{
      title: 'Compare the number of checks in a full scan and a TreeMap',
      prompt: `Implement {{SearchCounts}}. {{linear(values, target)}} simulates a full scan: iterate the array and return the number of elements compared (stop when the key is found; if it is not found, return the array length). {{tree(values, target)}} loads all values into a {{TreeMap}} created with a counting comparator, resets the counter after loading, calls {{get(target)}} and returns how many times the comparator was called (an empty array returns 0).`,
      hints: ['Iterate the array and increment the counter before comparing each row.', 'The TreeMap comparator can increment an int[] counter; reset it after loading the data.'],
      explain: `A full scan returns N when nothing is found; lookup in a red-black tree performs a number of comparisons that grows with log N. The comparator is also called during inserts, so it must be reset before the lookup. This only counts comparisons inside a Java structure; it does not represent page I/O or PostgreSQL cost. A PostgreSQL B-tree is a multi-way tree optimized for pages; the planner may still choose a sequential scan when reading many rows.`
    }],
    check: [
      {q:'Why does PostgreSQL sometimes choose a sequential scan even when an index exists?',options:['The index is randomly ignored','Reading a large fraction of the table may be cheaper than many scattered heap fetches','B-trees only support strings','MVCC forbids index scans'],answer:1,explain:'The planner chooses the plan with the lower estimated total cost; I/O and the number of returned rows matter.'},
      {q:'What cost does an index usually increase?',options:['INSERT/UPDATE and storage','Only SELECT','VACUUM is forbidden','Transaction isolation degrades automatically'],answer:0,explain:'Every relevant change must maintain the index, write WAL and use storage.'}
    ]
  },
  'lesson-db-004': {
    title: 'Connection pools: resource limits and timeouts when the pool runs dry',
    goals: ['Model a pool with a finite capacity', 'Distinguish waiting to acquire a connection from holding one for a long time', 'Estimate the impact of long transactions'],
    body: `**Summary:** A connection pool reuses a finite number of physical connections to the database. When every slot is borrowed, a new request must wait or time out; blindly increasing the pool can overload the database even more.

### The pool as a semaphore
With capacity P, each borrower takes one slot and must return it on every path using finally/try-with-resources. If P requests hold connections at the same time, request P+1 waits. A connection should be borrowed only when database access is needed; do not hold it while calling an HTTP service or waiting for the user.

~~~java
try (Connection c = dataSource.getConnection()) {
    // the connection should be held only around the DB work that needs it
    update(c);
}
~~~

A deterministic simulation needs no real threads: a list of slots in use plus a number of waiters, and a timeout is represented by a failure result instead of sleep. The goal is to understand capacity, not to rebuild HikariCP's scheduling or timeout clock.

### PostgreSQL and connection limits
An application-side pool protects latency by limiting database concurrency. PostgreSQL has a connection limit ({{max_connections}}, often 100 by default) and each connection is a separate backend process consuming memory; an oversized pool across many instances multiplies the total connection count very quickly. Sum the pools of all replicas plus background jobs, admin and headroom. PgBouncer can multiplex some workloads using transaction pooling, but session state and prepared statements need to be considered per mode.

Little's Law gives intuition: concurrency is approximately throughput times residence time. If a query becomes twice as slow while throughput stays the same, the number of occupied connections can double. Look for the cause in the query, locks, network or transaction duration before merely raising the max pool size.

| Symptom | Check |
|---|---|
| pool active reaches max | acquire time, leaks, transaction duration |
| DB has many idle connections | total pool across replicas, service configuration |
| acquire timeout rises | query latency, lock waits, DB load |

### Production pitfalls
Forgetting to close a connection leaks it; holding a connection across a remote call exhausts the pool even when the database is idle. A pool timeout does not mean a query timeout. Set separate timeouts for acquire, statement and transaction; enable leak detection at a diagnostic level. With HikariCP: {{maximumPoolSize}} defaults to 10; {{connectionTimeout}} (the maximum time to wait for a connection) defaults to 30000 ms, and when it expires {{getConnection()}} throws {{SQLTransientConnectionException}}; {{leakDetectionThreshold}} defaults to 0 (disabled). Statement timeouts are configured in the DB/driver, for example PostgreSQL's {{statement_timeout}}. In Spring, a wide transaction boundary can hold a connection through processing that does not need it.

### Interview notes
Compute the maximum total connections across replicas, explain why the pool is backpressure, then propose measuring active/idle/pending/acquire time and DB wait events before tuning.

> Senior tip: size the pool according to what the DB can handle and to a workload benchmark; a small stable pool is often better than many backends contending for CPU and I/O.
`,
    exercises: [{
      title: 'A finite pool with acquire/release',
      prompt: `Implement {{TinyPool}} with {{capacity}} slots numbered from 0 to capacity - 1. {{acquire()}} marks and returns the smallest free slot id, or {{-1}} when all slots are taken (simulating a timeout). {{release(id)}} frees the slot and returns {{true}} if the id is valid and the slot is borrowed; an out-of-range id or a slot that is already free (including a second release) returns {{false}}. Do not use sleep or threads.`,
      hints: ['A boolean array represents the borrowed slots.', 'Acquire picks the first free slot; release must reject out-of-range ids and slots that are not borrowed.'],
      explain: `The pool holds at most capacity slots. When no slot is free, the simulation returns -1 like a timeout; a real implementation usually waits for a bounded amount of time. Release must be idempotent per the chosen contract; here the second release returns false. A real application must always close connections with try-with-resources so the slot returns to the pool even when an exception is thrown.`
    }],
    check: [
      {q:'Pool active has hit max and pending is rising. What should you look at first?',options:['Immediately raise max to a very large value','Acquire time, query/lock latency and how long transactions are held','Drop the indexes','Turn timeouts off'],answer:1,explain:'You need to find the source of the connection usage and check DB load; raising the pool can push total concurrency beyond what the DB can handle.'},
      {q:'What can a remote HTTP call inside a DB transaction cause?',options:['A shorter connection hold time','Holding a connection while waiting on the network, exhausting the pool','Automatic SQL retries','Disabling MVCC'],answer:1,explain:'A connection is usually held until the transaction ends; latency outside the DB lengthens the time a slot is occupied.'}
    ]
  },
  'lesson-db-005': {
    title: 'Offset and keyset pagination: the cost of skipping rows',
    goals: ['Count the rows that must be skipped with offset pagination', 'Implement keyset pagination with a stable cursor', 'Choose an index and sort order that fit'],
    body: `**Summary:** Offset pagination is convenient for an arbitrary page number, but the database usually has to find and skip the rows before the offset. Keyset pagination uses the last key of the previous page as a cursor and is usually more efficient when walking sequentially through large data sets.

### Offset skips from the beginning
The query {{LIMIT 20 OFFSET 100000}} still has to read and discard the first 100000 rows in order before returning 20 rows. An index may avoid a sort, but it does not make the work of walking past the skipped entries disappear. Inserts/deletes between requests can also shift row positions: users see duplicate or missing results across pages.

### Keyset uses the sort key
With a stable order {{ORDER BY created_at, id}}, the cursor contains the last pair (created_at, id). The next page uses a lexicographic condition greater than that pair plus a LIMIT. In PostgreSQL you can use a row comparison matching the data types: {{WHERE (created_at, id) > (?, ?)}}. A composite index should follow the same column order to support a range scan.

~~~sql
SELECT id, created_at
FROM orders
WHERE (created_at, id) > (:last_time, :last_id)
ORDER BY created_at, id
LIMIT 50;
~~~

Adding id as a tie-breaker is necessary if timestamps can repeat; a cursor with only a timestamp will skip or duplicate rows. The cursor columns should be immutable during the traversal if a consistent experience is needed.

| Property | Offset | Keyset |
|---|---|---|
| Jump to page N | easy | needs a cursor/continue |
| Deep sequential traversal | skip cost grows | seek from the cursor |
| Data changes between pages | positions easily drift | more stable with a suitable key |

### Snapshots and UX
Keyset does not by itself create a snapshot across multiple HTTP requests. New data can appear before the cursor and will not be seen during the browsing session; deleted data also changes the result set. If you need a consistent snapshot across pages, you must design an explicit transaction/export snapshot or a business watermark; keeping a transaction open for a long time across HTTP is usually a bad idea because it holds the snapshot and the connection.

A cursor must include all sort keys and encode their types correctly, including null ordering if a column is nullable. For descending sorts, the comparison operator and predicate must also flip accordingly (a row comparison can only be used when all columns sort in the same direction; mixed ASC/DESC must be written as separate OR conditions per column); the text collation must be consistent with the index. An opaque cursor can be signed so clients cannot edit the boundary themselves, but you still need to validate the cursor version and the filter it is tied to. If the filter changes while an old cursor is reused, the results will be confusing even though the SQL is valid.

The PostgreSQL planner may still choose a different scan depending on the predicate, statistics and selectivity. Confirm with {{EXPLAIN (ANALYZE, BUFFERS)}} and an index that matches the filter + order. The API should encode cursors in a validated/opaque form so clients cannot edit them arbitrarily.

### Interview notes
State the workload clearly: an admin that needs to jump between pages can use offset on a moderate data set; feeds/infinite scroll usually suit keyset. Ensure a total order, a cursor tie-breaker, a composite index, and clear semantics when data changes.

> Senior tip: measure deep pages, not just the first page; OFFSET usually shows up as tail latency as the offset grows.
`,
    exercises: [{
      title: 'Count skipped rows in offset and keyset pagination',
      prompt: `Implement {{PagingCost}}. Model: a table of n rows has unique keys 1..n sorted ascending. {{offsetCost(n, offset, limit)}} returns the number of rows that must be walked through from the start to return the page: skipped rows plus returned rows, capped at n. {{keysetCost(n, after, limit)}} assumes the index seeks directly to the cursor {{after}} (the last key of the previous page), so it only counts the rows of the next page: keys greater than after, at most limit rows.`,
      hints: ['An offset scan starts from the beginning and passes both skipped rows and returned rows.', 'With a valid cursor after the element at position after, only min(limit, n-after) following elements are visited.'],
      explain: `In the already-sorted model, offset must pass offset + limit rows, capped by the total n. Keyset assumes an index seek to the cursor, so it only counts the rows of the next page. This is a logical row-cost model; a real DB also has page I/O, visibility checks, filters and caching. A composite B-tree over the filter/order columns helps seek to the right region. OFFSET is still appropriate for shallow pages or when jumping to a specific page number.`
    }],
    check: [
      {q:'Why does keyset pagination usually need a tie-breaker such as id?',options:['To force PostgreSQL to use a hash join','To make the order a total order when the sort key repeats','To bypass MVCC','To make offset faster'],answer:1,explain:'If many rows share the same timestamp, a timestamp-only cursor does not uniquely locate the page boundary.'},
      {q:'Does keyset pagination guarantee a consistent snapshot across multiple requests?',options:['Yes, always','No; a cursor does not replace a transaction snapshot','Only when there is no index','Yes if LIMIT is an even number'],answer:1,explain:'Keyset determines the next position; data can still change between HTTP requests.'}
    ]
  }
});
