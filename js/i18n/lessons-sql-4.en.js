/*
 * English translation of js/data/lessons-sql.js — task T1025. Format: js/core/i18n.js (content overlay).
 * ids: lesson-sql-006 lesson-sql-007
 */
App.i18n.content({
  'lesson-sql-006': {
    title: 'MVCC and transaction isolation: snapshots, phantom reads, and deadlocks',
    goals: [
      'Explain what MVCC (Multi-Version Concurrency Control) is and why readers do not block writers',
      'Distinguish READ COMMITTED and REPEATABLE READ in PostgreSQL and know what anomalies appear',
      'Recognize deadlocks and how the database handles them (aborting a transaction)',
    ],
    body: `### What is a transaction (and why isolation matters)
A **transaction** is a group of database statements executed as a single unit: either everything succeeds (commit, confirming the save), or everything fails and is rolled back (rollback, undo). For example, transferring money: debiting account A and crediting account B must both succeed; if only A is debited but B is not credited, money "disappears."

When multiple transactions run **concurrently** (at the same time), the database must decide: can this transaction see data that another transaction is currently modifying? That decision is called the **isolation level**. The stricter the isolation level, the more "consistent" reads become, but it usually costs more (or makes aborts and retries more likely). PostgreSQL 15 uses MVCC to balance correctness and performance.

### What is MVCC
**MVCC** (Multi-Version Concurrency Control) is a mechanism where the database keeps **multiple versions** of the same row. When you {{UPDATE}}, the database typically does **not overwrite** the old version in place immediately; instead it creates a **new version** of the row. The old version remains so that transactions reading an older "snapshot" can keep using it.

- **Reader** (a {{SELECT}} statement reading data): reads according to its own **snapshot** (a view of the data visible at a point in time).
- **Writer** ({{INSERT/UPDATE/DELETE}}): creates a new version or marks the old version as no longer visible to later snapshots.

Because readers read their own snapshots, readers typically **do not block writers**, and writers also **do not block readers**. This is a major benefit of MVCC compared to approaches that rely only on locks (row locks) for every operation.

Everyday analogy: like a document's version history — someone reading the version at 10:00 still sees that complete version even if someone else saves a new version at 10:01. They only see the new version when they "reload" at a later point in time.

> Terminology note: PostgreSQL records version visibility using internal fields (often discussed as {{xmin}}/{{xmax}} in the tuple header). You do not need to memorize bit-level details for junior/mid interviews, but you should understand the idea: each version carries traces of "who created it, who deleted it" so the database can decide which snapshots can see it.

### Snapshots and isolation levels (PostgreSQL 15)
The **isolation level** is set per transaction (for example {{BEGIN ISOLATION LEVEL REPEATABLE READ;}}) or falls back to the database default.

- **READ COMMITTED** (PostgreSQL default): each {{SELECT}} statement takes a **new** snapshot at the time that statement runs. Within the same transaction, the second SELECT can see data committed by another transaction after the first SELECT. This phenomenon is called a **non-repeatable read** (reading again under the same condition but getting a different result).
- **REPEATABLE READ** (PostgreSQL): the snapshot is fixed from the transaction's first statement; every later {{SELECT}} in that transaction sees the **same** set of versions (except changes made by the transaction itself). Therefore it avoids non-repeatable reads. In PostgreSQL, you also do not see a **phantom read** (a new row "appearing" like a ghost) in the snapshot sense: you do not see rows newly committed after the snapshot. However, a **serialization anomaly** can still occur (for example, write skew: two transactions both read a valid state and then write in a way that makes the overall outcome invalid). PostgreSQL reports this at the SERIALIZABLE level, while at REPEATABLE READ this kind of anomaly may not be prevented the way SERIALIZABLE does.
- **SERIALIZABLE**: the strictest level. PostgreSQL uses conflict detection (SSI, Serializable Snapshot Isolation) to ensure results are as if transactions ran sequentially. When it detects a risk of an anomaly, the database **aborts** the transaction with a {{serialization_failure}} error (SQLSTATE {{40001}}). The application must **retry** (run the transaction again).

### Quick comparison (PostgreSQL 15)
| Isolation | Non-repeatable read | Phantom read (PG snapshot sense) | Performance / application notes |
|---|---|---|---|
| READ COMMITTED | possible | possible | default; fits many OLTP (short transaction processing) APIs |
| REPEATABLE READ | no | no | fixed snapshot; be careful with concurrent write logic (write skew) |
| SERIALIZABLE | no | no | safest for serializability; may abort with {{40001}}, must retry |

### Why readers do not block writers (and the cost)
Because readers read from snapshots, they do not need to take read locks on individual business rows the way many traditional lock-based systems do. Writers create new versions; old versions are cleaned up only when no transaction/snapshot still needs them.

The costs:
- **More storage**: multiple versions exist temporarily.
- **Cleanup required**: PostgreSQL uses {{VACUUM}} (and autovacuum) to reclaim space from dead tuples. Heavy {{UPDATE/DELETE}} workloads where autovacuum cannot keep up can cause **bloat** (tables/indexes grow larger, performance degrades).

### What is a deadlock and how does the database handle it
A **deadlock** occurs when two (or more) transactions wait for each other in a cycle: T1 holds a lock on A and waits for a lock on B; T2 holds a lock on B and waits for a lock on A. Nobody yields, so the system stalls.

The database maintains a wait structure (often described as a **wait-for graph**) and periodically detects a **cycle**. When it finds a deadlock, it chooses one transaction as the **victim** (usually considering cost/progress) and **aborts** it, returning a {{deadlock_detected}} error (SQLSTATE {{40P01}} in PostgreSQL). The remaining transaction can continue.

The application **must** catch {{40P01}} (and often {{40001}} with SERIALIZABLE) and then **retry** the entire transaction with backoff (a short wait, possibly increasing). Do not blindly retry every SQL error — only retry appropriate transient errors.

~~~java
// Retry idea (illustrative): only retry transient error codes
for (int attempt = 1; attempt <= 3; attempt++) {
    try {
        runBusinessTransaction();
        break; // success
    } catch (SQLException e) {
        String sqlState = e.getSQLState();
        boolean transientErr = "40001".equals(sqlState) || "40P01".equals(sqlState);
        if (!transientErr || attempt == 3) throw e;
        Thread.sleep(50L * attempt); // simple backoff
    }
}
~~~

### Interview notes
When asked "What is transaction isolation, and which level do you choose?":
1. Give a short explanation: isolation controls how much data one transaction sees while others run concurrently; PostgreSQL uses MVCC (snapshots).
2. State that READ COMMITTED is the default and fits typical OLTP (short transaction) workloads.
3. Mention REPEATABLE READ when you need consistent reads across a transaction (for example, a multi-step report) and note the trade-offs/anomalies.
4. Mention SERIALIZABLE when you need true serial behavior, accepting {{40001}} retries.
5. Mention that deadlocks ({{40P01}}) are normal in concurrent systems; the application must retry safely.

> Senior tip: the isolation level does not replace business design. For sensitive read-then-write operations (deducting inventory, reserving a slot), combine the right strategies: {{SELECT ... FOR UPDATE}} (intentional locking), unique/check constraints, optimistic locking (a version column), or SERIALIZABLE + retry — depending on contention and correctness requirements.`,
    exercises: [
      {
        title: 'Simulate snapshot reads and detect deadlocks',
        prompt: `Write a {{Mvcc}} class that simulates things in a **very simplified** way (not a full PostgreSQL implementation, just to understand snapshot intent):
- The {{commits}} list describes committed versions in time order: {{commits.get(i)}} is the committed value at time point {{i}} (0-based). A {{null}} value means "no visible commit" at that point. Larger indices mean later in time.
- {{readCommitted(List<Integer> commits, int statementIndex)}}: simulates **READ COMMITTED** — each {{SELECT}} statement takes a snapshot at the time that statement runs, so {{statementIndex}} is the "current statement's time point." Return the **most recent (latest)** committed value among indices {{<= statementIndex}} that is not null. If there is none, return {{null}}. Calling it multiple times with different {{statementIndex}} values simulates different SELECT statements seeing newer commits.
- {{repeatableRead(List<Integer> commits, int snapshotIndex)}}: simulates **REPEATABLE READ** — the snapshot is fixed at {{snapshotIndex}} (usually the time point of the transaction's first statement). Return the most recent committed value among indices {{<= snapshotIndex}} that is not null. Calling it again with the same {{snapshotIndex}} must return the same result, even if conceptually "later commits" would exist (in this exercise we do not mutate the list, but the semantics are a fixed snapshot).
- {{detectDeadlock(Map<String,String> waits)}}: {{waits}} maps {{tx -> the tx it is waiting for}} (for example, T1 waits for T2). Return {{true}} if there is a wait **cycle** (deadlock), otherwise {{false}}.

The starter compiles; fill in the TODOs.`,
        hints: [
          'Both read methods find the **nearest non-null** value allowed by the given point by walking backward from {{idx}} to 0.',
          'The difference is semantics: READ COMMITTED takes a statement point (which can change across calls); REPEATABLE READ takes a fixed snapshot. The tests demonstrate this.',
          'Deadlock: from each starting node, follow {{waits}} and track {{seen}}; if you reach a node already seen or return to {{start}}, there is a cycle.',
        ],
        explain: `### Why this simulation is simplified
Real PostgreSQL uses visibility rules (xmin/xmax, snapshot transaction IDs) and many other details. Here we only simulate the core idea: "see commits only up to a certain point," and distinguish READ COMMITTED (a statement point that can change) from REPEATABLE READ (a fixed snapshot).

### Common mistakes
- Forgetting to return {{null}} when {{statementIndex < 0}} or when no commits exist.
- Deadlock: checking only an A-B pair and missing a 3-node cycle (T1->T2->T3->T1).
- Walking forward instead of backward: you need the **most recent** commit (largest index) within the allowed range.

### Interview notes
You do not need to implement MVCC, but you should be able to say: READ COMMITTED takes a snapshot per statement; REPEATABLE READ keeps a snapshot; on a deadlock the database aborts a transaction ({{40P01}} in PostgreSQL) and the application must retry.`,
      },
    ],
    check: [
      {
        q: 'What does MVCC allow readers and writers to do?',
        options: ['Readers must wait for writers to commit', 'Writers must wait for readers to finish', 'Readers read an old version via a snapshot, writers create a new version, without blocking each other', 'Both lock every row'],
        answer: 2,
        explain: `**Option 3 is correct**: MVCC keeps multiple versions so readers read an old snapshot while writers create a new version; they do not block each other. The other options describe pessimistic locking, not MVCC.`,
      },
      {
        q: 'How does a database handle a deadlock?',
        options: ['It waits forever until a timeout', 'It detects a wait cycle and aborts one transaction; the application retries', 'It automatically serializes all transactions', 'It ignores locks'],
        answer: 1,
        explain: `**Option 2 is correct**: the database detects a cycle in the wait-for graph and chooses a victim to abort; the application must retry the aborted transaction.`,
      },
    ],
  },
  'lesson-sql-007': {
    title: 'B-tree indexes and covering indexes: why indexes are fast and when they do not help',
    goals: [
      'Explain what a B-tree index is and why lookups are O(log n)',
      'Understand covering indexes and index-only scans',
      'Know when an index is not used (low selectivity, functions on columns, data types)',
    ],
    body: `### What is an index
An **index** is an auxiliary data structure the database creates to find rows faster. Without a suitable index, the database often has to do a **Seq Scan** (sequential scan) — reading every row in the table to check the {{WHERE}} condition. The larger the table, the more time and I/O (disk/memory reads) a Seq Scan costs.

Everyday analogy: the index at the back of a book. To find the chapter about "deadlock," you look it up in the index instead of reading from page 1.

### What is a B-tree index
The most common index type in PostgreSQL 15 is the **B-tree** (balanced tree). Each node in the tree holds many keys in sorted order; a search walks from the root down to a leaf by comparing keys. Because the tree is balanced and each node holds many keys (a large **fanout**), the tree is usually very "shallow": a table with millions of rows still needs only a few levels.

The cost of looking up a key is typically about **O(log n)** (logarithmic in the data size), because each level eliminates most irrelevant branches.

### From index to real data (why it can still be slow)
With a regular index, a leaf contains the key and a pointer to the row's location in the table (in PostgreSQL this is often discussed as the **TID/ctid** — a tuple location identifier). After finding matching rows in the index, the database may still need to read the **heap** (the part storing table data) to fetch other columns. This step can cause **random I/O** (scattered reads) if many rows match.

If you {{SELECT *}} over a large result set, the heap-fetch cost can be significant. The planner (the query optimizer component) sometimes chooses a Seq Scan instead of an index scan when it estimates it would have to fetch too many rows.

### Covering indexes and index-only scans
A **covering index** is an index that contains **enough** of every column the query needs (columns in {{SELECT}}, {{WHERE}}, {{JOIN}}, {{ORDER BY}}, depending on the case) so the database can return results **from the index alone**, without reading the heap. PostgreSQL calls this capability an **index-only scan**.

PostgreSQL supports {{INCLUDE}} to add "payload columns" to an index without making them part of the main sort key — useful for building a covering index.

~~~sql
-- Illustrative example: a frequently run query
-- SELECT status, total FROM orders WHERE user_id = ? ORDER BY created_at DESC;
-- A possible index to consider (depending on workload): (user_id, created_at DESC) INCLUDE (status, total)
~~~

> Practical condition: an index-only scan works best when the **visibility map** confirms tuples are "all visible" without checking the heap. {{VACUUM}} updates the visibility map; heavily updated tables may benefit less from index-only scans.

### When an index does not help (or helps little)
- **Low selectivity**: a column with few distinct values (for example, a boolean or a status with only a handful of values) — the index often cannot eliminate many rows, and the planner may choose a Seq Scan. This is a **rule of thumb**, not an absolute constant (skewed data distributions can behave differently).
- **A function/expression on the column**: {{WHERE UPPER(email) = 'A@B.COM'}} usually cannot use a regular index on {{email}}. You need a suitable **expression/functional index**, for example {{CREATE INDEX ... ON users (UPPER(email));}} and a query written to match the expression.
- **Mismatched data types/casts**: comparing different types can trigger an implicit cast, making the index hard to use.
- **Small tables**: reading a few pages directly can be cheaper than walking the index and then fetching the heap.
- **Write-heavy workloads**: every extra index adds cost to {{INSERT/UPDATE/DELETE}} (the index structure must be maintained). Too many indexes slow writes and consume space.

### B-tree and other index types (PostgreSQL 15)
- **B-tree**: the default; good for {{=}}, {{<}}, {{>}}, ranges, {{ORDER BY}}, and many common patterns.
- **Hash**: mainly optimized for equality comparisons {{=}} (it does not support ordering/ranges like B-tree). Less commonly used than B-tree in most OLTP schemas.
- **GiN**: suitable for full-text search, {{jsonb}}, arrays, and containment operators.
- **GiST**: suitable for geometric data, range types, and some nearest-neighbor queries depending on the operator class.
- **BRIN**: very small; suitable for large tables **appended in physical order** correlated with values (for example, time-series data inserted by time), not suitable for randomly ordered data.

### Interview notes
A common question: "When should you add an index, and when should you not?"
Give a structured answer:
1. Start from real **query patterns** ({{WHERE/JOIN/ORDER BY}}), not guesswork.
2. Verify with {{EXPLAIN (ANALYZE, BUFFERS)}} before/after to confirm the planner uses the index and that time/I-O improve.
3. Weigh **selectivity**, **covering/index-only scans**, and the cost to writes and maintenance.
4. Note that an index is not magic: it can be ignored because of a function on the column, data types, or because the planner estimates a Seq Scan is cheaper.

> Senior tip: Do not just look at "has an index or not." Look at **estimated vs actual cardinality** in {{EXPLAIN ANALYZE}}, the number of buffers read ({{BUFFERS}}), and the impact on writes. An index that is "right" on staging can be useless in production if the data distribution differs. Drop unused indexes (check usage stats such as {{pg_stat_user_indexes}}) to reduce write overhead.`,
    exercises: [
      {
        title: 'Simulate B-tree depth, covering indexes, and a selectivity heuristic',
        prompt: `Write an {{Idx}} class (a conceptual simulation, not PostgreSQL code):
- {{btreeSteps(int n)}}: estimate the number of "steps/levels" for a lookup in an ideal B-tree with **fanout 100** (each node fans out to ~100 children). Use the formula: if {{n <= 0}} return {{0}}; otherwise return {{floor(log100(n)) + 1}}. (Examples: n=50 -> 1; n=1,000,000 -> 4.)
- {{isCovering(List<String> queryCols, List<String> indexCols)}}: return {{true}} if **every** column in {{queryCols}} is present in {{indexCols}} (the index conceptually holds all columns the query needs). Otherwise {{false}}. If {{queryCols}} is empty, treat it as covering (return {{true}}) for simplicity.
- {{shouldUseIndex(int distinct, int total)}}: a simple heuristic: return {{true}} if the ratio {{distinct/total > 0.05}} (selectivity > 5%). If {{total <= 0}} return {{false}}.

This is only an **illustrative rule**; a real planner uses statistics and cost estimates, not a hard 5% threshold.`,
        hints: [
          '{{btreeSteps}}: use {{Math.log(n)/Math.log(100)}}; remember to return 0 when {{n <= 0}}.',
          '{{isCovering}}: put {{indexCols}} into a {{HashSet}} and then check each query column.',
          'The 5% heuristic is only for illustration — in real PostgreSQL the decision to use an index comes from the planner based on {{pg_stats}}, random page cost, correlation, and so on.',
        ],
        explain: `### Common mistakes
- {{btreeSteps}} returns 0 for small {{n}}: the tests require n=50 -> 1.
- {{isCovering}} forgets the case where {{queryCols}} is empty or forgets to check **every** query column.
- Mistaking the 5% heuristic for an absolute rule: in real PostgreSQL, the index decision is made by the planner using {{pg_stats}}, I/O cost, correlation, and more.

### Interview notes
When talking about indexes, emphasize: "measure with EXPLAIN (ANALYZE, BUFFERS) on real data," because the same query may use an index in one environment but a Seq Scan in another if the data distribution differs.`,
      },
    ],
    check: [
      {
        q: 'When does a database typically NOT use a B-tree index?',
        options: ['A query has a WHERE on an indexed column with high selectivity', 'The table is small or the column has low selectivity (few distinct values)', 'ORDER BY matches the index order', 'A covering index contains all needed columns'],
        answer: 1,
        explain: `**Option 2 is correct**: on a small table a Seq Scan is cheaper; low selectivity means the index cannot filter out many rows. The other options are cases where an index is likely to be used.`,
      },
      {
        q: 'What does a covering index help with?',
        options: ['Speeding up INSERTs', 'Allowing an index-only scan without fetching the heap', 'Reducing table size', 'Replacing the primary key'],
        answer: 1,
        explain: `**Option 2 is correct**: if the index contains all columns the query needs, the database can return results from the index alone (an index-only scan), reducing I/O.`,
      },
    ],
  },
});
