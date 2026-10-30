/*
 * English translation of js/data/q-spring-data.js — task T175, re-translated for T545. Format: js/core/i18n.js (content overlay).
 * ids: jpa-008 jpa-009 db-001 db-002 db-003 db-004 db-005 db-006 db-007 db-008 db-009
 */
App.i18n.content({
  'jpa-008': {
    q: `When should you move away from JPA to use JdbcTemplate, jOOQ or native queries? What are the risks of mixing JPA and hand-written SQL?`,
    a: `**Summary:** JPA wins on domain-model CRUD and on avoiding hand-written SQL, but is weak on complex queries (multi-level aggregation, window functions, recursive CTEs) and on absolute performance control. When you need fully controlled SQL, use **jOOQ** (type-safe, code generated from the schema) for complex queries and **JdbcTemplate** for batch/streaming, while keeping JPA for the CRUD part.

### When to leave JPA
| Situation | Tool to use |
|---|---|
| Reports, dashboards aggregating many tables | jOOQ or JDBC template |
| Analytical queries, window functions, recursive CTEs | jOOQ (Hibernate 6 supports them but the API is clunky) |
| Importing/inserting millions of rows | JDBC template + batch |
| Streaming a large dataset row by row | JDBC template + {{ResultSet}} fetchSize |
| Simple queries, standard CRUD | JPA remains a good choice |

### jOOQ – suggested usage
~~~java
// SQL is generated from the schema (code-gen), no hand-written SQL strings
List<CustomerDTO> rows = ctx.select(
        CUSTOMER.ID, CUSTOMER.NAME, ORDER.AMOUNT.sum())
    .from(CUSTOMER)
    .leftJoin(ORDER).on(ORDER.CUSTOMER_ID.eq(CUSTOMER.ID))
    .groupBy(CUSTOMER.ID, CUSTOMER.NAME)
    .fetchInto(CustomerDTO.class);
~~~
jOOQ gives type safety (column names checked at compile time), good support for window functions/CTEs, and still runs on plain JDBC.

### JdbcTemplate for bulk work
~~~java
jdbcTemplate.batchUpdate(
    "insert into order_item(order_id, sku, qty) values (?, ?, ?)",
    items, 1000, (ps, it) -> {
        ps.setLong(1, it.orderId());
        ps.setString(2, it.sku());
        ps.setInt(3, it.qty());
    });
~~~

### Risks of mixing JPA and hand-written SQL
1. **Auto-flush is not always triggered**: Hibernate flushes before JPQL queries, but for a **native query / JDBC** there is no guarantee of a flush ⇒ you may read stale data inside the same transaction. Call {{entityManager.flush()}} when you need to see data you just modified.
2. **Two mapping sources for the same table**: the entity and a hand-written DTO will drift apart over time.
3. **The transaction boundary must be shared**: use Spring's {{@Transactional}} for both, otherwise you lose consistency.
4. **Hibernate may overwrite your changes**: if you modify data through a native query and Hibernate then flushes the old entity at commit → data loss.
5. **Locks and deadlocks become hard to control** when mixing two access styles in the same transaction.

### Pitfall production
- Do not use a native {{select *}} query mapped manually into an entity – map to a DTO instead.
- With large batches, split into chunks and commit per chunk to avoid overly long transactions and a bloated undo log.
- Measure before/after with {{EXPLAIN ANALYZE}}; do not guess.

> Senior tip: a good interview question is: "Have you ever had to move away from JPA in your project – and why?". A good answer shows you know precisely where the **boundary** is: JPA for aggregates and CRUD, SQL/jOOQ for complex read queries, and you have already controlled the flush problem when mixing the two worlds. Blind mixing is where the hardest "read stale data" bugs come from.`,
    follow: [
      'Why does Hibernate not flush automatically before running a native query?',
      'How does jOOQ differ from the JPA Criteria API in terms of compile-time safety?'
    ],
  },
  'jpa-009': {
    q: `How should a JPA entity implement {{equals}} and {{hashCode}}? Why is using Lombok {{@Data}} on an entity risky?`,
    a: `**Summary:** Entities often end up inside {{HashSet}}/{{HashMap}} (relationship collections, hand-written caches) → they need {{equals}}/{{hashCode}} that is **stable over the whole lifecycle**. Using {{getId()}} is risky because the id is {{null}} before persist and can change; prefer a **business key** (an immutable business code) or a class-based constant. Lombok {{@Data}} generates {{equals}} from **every** field, including lazy collections → causing N+1, infinite recursion and logic errors.

### Why you must be careful
- Before persist, the {{id}} is {{null}} ⇒ an entity can be "lost" from a {{HashSet}} after persist (the id gets assigned) → {{contains()}} returns false and {{remove()}} stops working.
- If the {{id}} is reassigned (e.g. merging from a DTO), the hash code changes ⇒ lookups in maps break.
- {{equals}} based on collections triggers **lazy loading** on every comparison: it costs queries and can throw {{LazyInitializationException}}.

### The right way
~~~java
@Entity
public class Customer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_code", nullable = false, unique = true)
    private String code;          // business key, immutable

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Customer other)) return false;
        return code != null && code.equals(other.code);
    }

    @Override public int hashCode() { return Objects.hash(code); }
}
~~~

### With Lombok
~~~java
@Entity
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(of = "code")     // compare only the business key
@ToString(exclude = {"items"})       // avoid parent <-> child recursion
public class Customer { /* ... */ }
~~~
- Even better: let Lombok **not** generate {{equals}}/{{hashCode}} for the entity, or use {{@Entity}} + record? (A record is not the default choice for an entity, because entities need to be mutable and proxyable.)
- Always make sure the **identity attribute is {{@Id}}** and is not final.

### Pitfall production
- Lombok's default {{@ToString}} prints every field, including collections and back references (parent – child – parent…) ⇒ **stack overflow** when logging, or a gigantic log that fires queries on its own.
- {{@Data}} also generates {{@RequiredArgsConstructor}} and {{@Getter/@Setter}} for every field – for JPA, a no-arg constructor is mandatory, so prefer {{@NoArgsConstructor}} + {{@AllArgsConstructor(access = AccessLevel.PROTECTED)}} instead of {{@Data}}.
- If you use {{@Data}} on an entity with {{@OneToMany}}, {{equals}} calls {{List.equals}} → compares element by element → triggers lazy loading → very bad.

> Senior tip: a simple team rule: **entities use {{@Getter}} + {{@Setter}}, never {{@Data}}**; base {{equals}}/{{hashCode}} on the business key when there is one, otherwise let Hibernate manage identity, and never put entities into a {{HashSet}} relying on arbitrary {{equals}}. Also always keep {{@ToString}} printing only the id and a few safe fields.`,
    follow: [
      'Why does Hibernate recommend not overriding {{equals}}/{{hashCode}} based on relationships?',
      'What does Lombok {{@Data}} generate that can break a JPA entity?'
    ],
  },
  'db-001': {
    q: `How does a B-tree index work? How do composite and covering indexes differ, and in which cases is an index not used?`,
    a: `**Summary:** A B-tree index is a balanced structure that finds matching rows in O(log n) instead of a full scan O(n), at the price of updating the tree on every {{INSERT}}/{{UPDATE}}/{{DELETE}}. A **composite index** can only be used following the **leftmost prefix** (the first column must appear in the filter), and a **covering index** allows reading from the index alone (index-only scan) so the table is never touched.

### Quick intuition
Imagine a 1,000-page book with no table of contents: to find the word "deadlock" you would have to flip through every page (a full scan). An index is like the **index at the back of the book**: the words are sorted alphabetically and each entry gives a page number, so a few flips take you to the right page. A B-tree is a **multi-level** index: the top level only says "A–F in volume 1, G–M in volume 2…", and the lower levels hold the details. A composite index is like a phone book sorted by **surname, then first name**: searching by surname is fast, but if you only know the first name you have to flip through the whole book. A covering index is when the index already carries the content you need, so you never have to open the page itself.

### Terms
- **Page**: the unit the DB reads from / writes to disk, 8KB in PostgreSQL and 16KB in InnoDB; every tree node is one page.
- **B+tree**: a B-tree variant where data/pointers live only in the leaves, and the leaves are linked to each other so ranges can be scanned sequentially.
- **Fan-out**: the number of children of a node; an 8–16KB page holds hundreds of keys, so the tree stays very "short".
- **Clustered index**: an index whose leaves contain the row itself (in InnoDB: ordered by PK); PostgreSQL has none – its table is a separate heap.
- **Selectivity / cardinality**: the share of rows a condition keeps / the number of distinct values in a column; high selectivity means the filter keeps only a few rows.
- **Index-only scan**: returning the result from the index alone, without reading the table (heap).
- **Seq scan**: a sequential scan over the whole table.
- **Page split**: when you insert into a full page the DB splits it in two – extra I/O, and both halves end up half empty.

### Finding a row through a B-tree, step by step
~~~text
                [ root: ... | 5000 | 9000 | ... ]          <- level 1 (always in RAM)
                 /              |
      [ ... 4100 | 4500 ... ]  [ 5000 | 6200 ... ]          <- level 2 (branch)
              |                      |
  [4500 4501 4502 ...] <-> [4600 4601 ...] <-> ...           <- leaves: key + TID/PK, doubly linked
~~~
1. **Read the root**: compare the key you are looking for (say 4501) with the separator values in the root to know which branch to descend into. Why it is fast: the root is almost always already sitting in the buffer cache.
2. **Walk down the branches**: repeat the comparison at each level. Why there are so few levels: each page holds a few hundred separators, so 3 levels already cover roughly 500 × 500 × 500 ≈ 125 million keys, and 4 levels cover tens of billions.
3. **Reach the leaf**: read the TID (PostgreSQL) or the PK (InnoDB secondary index). For a range ({{BETWEEN}}), the DB walks on to the neighbouring leaf through the linked list instead of returning to the root.
4. **Read the actual row**: PostgreSQL jumps into the heap using the TID; InnoDB looks the row up in the clustered index using the PK. Why a covering index pays off: it skips exactly this step.
5. **On writes**: an {{INSERT}} must put the key into the correct leaf of **every** index; a full leaf causes a page split. That is the price you pay for fast reads.

A comparison in numbers: on a 100-million-row table, a full scan reads roughly 1–2 million pages, while an index lookup reads only 4–5 pages.

### B-tree structure
Leaf nodes hold the key plus a "path" to the row and are linked into a **linked list** ordered by key. Concretely: in **PostgreSQL** the leaf holds the key + **TID** (heap page number and position inside the page); in **InnoDB** the main table *is* the **clustered index** (its leaves hold **the whole row**, sorted by PK), while a **secondary index** holds the key + **PK value** – reading the full row needs one more lookup in the clustered index. Because of this, **range** queries ({{WHERE ts BETWEEN ...}}) are efficient too. A B-tree keeps all leaves at the same depth, optimised for disk (few block reads) – this is why MySQL/InnoDB uses a B+tree rather than the "plain" B-tree.

### Composite index and leftmost prefix
With index {{(a, b, c)}}:
| Query | Can use the index? |
|---|---|
| {{WHERE a = 1}} | Yes (uses column a) |
| {{WHERE a = 1 AND b = 2}} | Yes (uses a, b) |
| {{WHERE b = 2}} | **Usually not** – column a is missing (exception: skip scan in MySQL 8.0.13+ / PostgreSQL 18 when a has few distinct values) |
| {{WHERE a = 1 AND c = 3}} | Seek on a; c is only filtered within the index (cannot seek because b is missing) |
| {{ORDER BY a, b}} | Yes, no sort needed |

Design principle: the leading column should be the one **most often used as a filter** and with **high selectivity**; the following columns are filter/sort columns ordered to match the query.

### Covering index
The index contains every column the query needs ⇒ the DB reads only the index, not the table (index-only scan). On PostgreSQL 11+ use {{INCLUDE (col)}}; on MySQL/InnoDB, an index that also carries the extra column becomes covering (a secondary index already contains the PK).

~~~sql
CREATE INDEX idx_order_cust_date ON orders (customer_id, created_at) INCLUDE (amount);
-- SELECT customer_id, created_at, amount ... -> answered from the index
~~~

### When an index is **not** used
1. **Function wrapped around the column**: {{WHERE DATE(created_at) = '2026-01-01'}} → the index on {{created_at}} cannot be used; fix it by rewriting as a range ({{created_at >= '2026-01-01' AND created_at < '2026-01-02'}}) or by creating an index on the expression.
2. **Leading wildcard**: {{WHERE name LIKE '%abc'}} → the B-tree cannot be used.
3. **{{OR}} without an index covering** every branch.
4. **Low selectivity**: a column with 2–3 values (e.g. {{status}}) → few index values, so the optimizer usually prefers a seq scan.
5. **Wrong data type**: comparing a {{varchar}} column to a number → the index is skipped (the comparison is implicitly cast).
6. **Stale statistics** → the optimizer mis-estimates and picks the wrong plan; run {{ANALYZE}}.
7. **Low-distinction column at the head of a composite index** → the leftmost prefix is not satisfied.
8. **Small table** (a few thousand rows) → a seq scan is cheaper.

### Pitfall production
- **Too many indexes slow down writes**: every {{INSERT}}/{{UPDATE}} must update every index of the table. Redundant indexes also grow backups and vacuum time.
- An index on a **low-cardinality** column in the leading position is almost useless.
- Indexes that no running query uses still cost resources → review and drop them regularly.
- With UUID as PK, random write order fragments pages; use UUIDv7 or an increasing key.

### Common mistakes
- **Index (b, a) while the query filters on a**: symptom – EXPLAIN still shows Seq Scan even though "there is an index". Prevention: put equality (=) filter columns first, range/sort columns after, and verify with EXPLAIN.
- **Wrapping the column in a function or relying on implicit casts**: {{WHERE lower(email) = ?}}, or comparing a {{varchar}} to a number. Symptom – the query becomes slow right after "just a small change". Prevention: rewrite the predicate on the raw column, or create an expression index ({{CREATE INDEX ... ON users (lower(email))}}).
- **Adding an index on every column "to be safe"**: symptom – INSERT/UPDATE get slower and slower, and the indexes grow bigger than the table. Prevention: use {{pg_stat_user_indexes}} ({{idx_scan}} = 0) or MySQL's {{sys.schema_unused_indexes}} to find and drop unused indexes.
- **Random UUIDv4 as PK on InnoDB**: symptom – slow writes, many page splits, the buffer pool fills up quickly. Prevention: use an increasing key (BIGINT sequence) or a time-ordered UUIDv7.

### One-minute spoken answer
"A B-tree index is like a multi-level book index: the keys are sorted, each node is a page, so the tree is only 3–4 levels deep and finding one row among hundreds of millions costs a few page reads instead of scanning the whole table. The leaves are linked, so range queries and ORDER BY benefit too. A composite index follows the leftmost prefix: an index on (a, b, c) works well for conditions on a or on a and b, but filtering only on b usually cannot use it. A covering index contains every column the query needs, so the DB never has to go back to the table. The price is slower writes and more disk, so I only add an index when EXPLAIN proves it is used. The mistake I run into most often is wrapping the column in a function, for example DATE(created_at), which makes the index unusable – rewriting it as a range fixes it."

> Senior tip: before adding an index, **measure** with {{EXPLAIN (ANALYZE, BUFFERS)}} against production-like data. A redundant index costs more than disk: it measurably slows {{UPDATE}} on a large transactional table. Principle: indexes are a trade-off, and every index needs a measurable reason.`,
    follow: [
      'Why is an index on a {{status}} column (just a few values) usually ignored by the optimizer?',
      'How does a covering index work on MySQL/InnoDB compared to PostgreSQL?'
    ],
  },
  'db-002': {
    q: `Which anomalies do SQL isolation levels prevent (dirty read, non-repeatable read, phantom)? How do MVCC in PostgreSQL and MySQL InnoDB differ?`,
    a: `**Summary:** Four standard isolation levels, increasingly strict: {{READ UNCOMMITTED}} → {{READ COMMITTED}} → {{REPEATABLE READ}} → {{SERIALIZABLE}}. Each level blocks one more anomaly. **PostgreSQL** defaults to {{READ COMMITTED}} with "statement-level" MVCC; **MySQL InnoDB** defaults to {{REPEATABLE READ}} with "transaction-level" MVCC (the read view is kept for the whole transaction).

### Quick intuition
Imagine one Excel spreadsheet shared by the whole team. A **dirty read** is seeing a number a colleague is still typing, and then watching them press Undo. A **non-repeatable read** is reading cell A1 twice while somebody edits and saves it in between, so you see two different values. A **phantom** is counting "the rows with status NEW" and getting 5, then counting again a moment later and getting 6 because somebody inserted a row. An isolation level is the "law" that decides which changes you are allowed to see. MVCC is how the DB enforces that law without making everybody queue: each person gets a **snapshot** of the spreadsheet taken at one point in time.

### Terms
- **Transaction**: a group of operations that either all succeed (commit) or all are undone (rollback).
- **Isolation level**: how much a transaction is "shielded" from changes made by other transactions running in parallel.
- **MVCC (Multi-Version Concurrency Control)**: keeping several versions of a row so readers see a consistent old version while a writer creates a new one.
- **Snapshot / read view**: the list of "which transactions had committed at the moment the snapshot was taken", used to decide which version is visible.
- **xmin / xmax**: two hidden columns on every PostgreSQL row – the id of the transaction that created it and the id of the transaction that deleted/replaced that version.
- **Undo log**: where InnoDB stores the old values of a row, to roll back and to rebuild old versions for readers.
- **Gap lock / next-key lock**: an InnoDB lock placed on the "gap" between index keys, blocking inserts of new rows into that gap.
- **Write skew**: two transactions read the same data, each updates a different row, and together they violate a business rule.

### How MVCC works, step by step
~~~text
Time ->       t1              t2                     t3
Tx A:         BEGIN; SELECT balance (=100)           SELECT balance (= ?)
Tx B:                         UPDATE balance=50; COMMIT
READ COMMITTED      : the 2nd read sees 50  (a new snapshot per statement)
REPEATABLE READ     : the 2nd read sees 100 (the snapshot from the first statement is kept)
~~~
1. **Writes create a new version, never overwrite**: PostgreSQL inserts a new tuple (xmin = Tx B id) and marks the old tuple xmax = Tx B id; InnoDB overwrites the row in the page but pushes the old value into the undo log, and the new row carries a {{DB_TRX_ID}} plus a pointer to the old version. Why: readers who started earlier still need to see the previous version.
2. **Reads take a snapshot**: the transaction records the list of transactions running at that moment. Why: any change made by a transaction not yet committed at snapshot time must be invisible.
3. **Pick the visible version**: the DB walks the version chain (PostgreSQL: compares xmin/xmax against the snapshot; InnoDB: walks backwards through the undo log) to the newest version the snapshot allows.
4. **Garbage collection**: versions nobody needs any more are cleaned up – PostgreSQL with **VACUUM**, InnoDB with a **purge thread** that deletes undo. Why long transactions are dangerous: they pin an old snapshot, so garbage cannot be cleaned and the table/undo log keeps growing.

### The four isolation levels and the anomalies
| Level | Dirty read | Non-repeatable read | Phantom read |
|---|---|---|---|
| READ UNCOMMITTED | Yes | Yes | Yes |
| READ COMMITTED | No | Yes | Yes |
| REPEATABLE READ | No | No | Yes (per the SQL standard) |
| SERIALIZABLE | No | No | No |

- **Dirty read**: reading data written by another transaction that has not committed.
- **Non-repeatable read**: reading the same row twice inside one transaction yields different values (someone else committed a change in between).
- **Phantom read**: one {{SELECT}} sees 5 rows, the next one sees 6 (new rows matching the predicate appeared).

### What MVCC is
Instead of locking the table while reading, MVCC keeps **multiple versions** of each row. Each transaction sees a consistent snapshot → reads do not block writes and writes do not block reads. Mechanism: version chain + {{xmin}}/{{xmax}} (PostgreSQL) or the undo log (InnoDB).

### PostgreSQL
- Default **READ COMMITTED**: each **statement** takes a fresh snapshot ⇒ two {{SELECT}} runs of the same query in one transaction can see different data.
- **REPEATABLE READ** in PostgreSQL = snapshot isolation fixed for the whole transaction: it prevents dirty reads, non-repeatable reads **and phantom reads** (stricter than the SQL standard requires). What it does **not** prevent is **write skew** (a serialization anomaly) – only SERIALIZABLE does. If you write to a row that another transaction modified and committed, PostgreSQL reports {{could not serialize access due to concurrent update}}.
- At SERIALIZABLE, PostgreSQL uses SSI (serializable snapshot isolation) and may report {{could not serialize access}} → the client must retry.

### MySQL InnoDB
- Default **REPEATABLE READ**: the read view is created at the first statement and kept until the transaction ends ⇒ the same {{SELECT}} inside the transaction always returns the same result.
- At RR, InnoDB blocks phantoms for {{UPDATE}}/{{DELETE}} using **gap locks** and next-key locks – a frequent source of deadlocks.

### Pitfall production
- On PostgreSQL READ COMMITTED, {{UPDATE ... WHERE status = 'PENDING'}} may **update zero rows** if another party changed the status first (read-modify-write is not safe). Add the status predicate to the {{WHERE}} clause and check the number of updated rows.
- Reading a balance and then subtracting at READ COMMITTED is the classic race condition → use {{SELECT ... FOR UPDATE}} or optimistic locking.
- Higher isolation levels cost performance (more locks, more conflicts) and more deadlocks.
- Choosing an isolation level does not fix logic bugs: always design constraints at the database level (unique, check, foreign key) as the last line of defense.

### Common mistakes
- **Believing InnoDB's REPEATABLE READ protects read-modify-write**: a plain {{SELECT}} reads the old snapshot, but {{UPDATE}}/{{SELECT ... FOR UPDATE}} are **current reads** – they read the latest committed version and lock it. Symptom – a balance computed from the old value overwrites the new one (lost update). Prevention: {{UPDATE ... SET balance = balance - ?}} atomically, or {{FOR UPDATE}} from the first read, or optimistic locking with a {{version}} column.
- **Writing code that assumes PostgreSQL REPEATABLE READ behaves like MySQL**: PostgreSQL throws {{40001}} when two transactions modify the same row, while InnoDB waits for the lock and then continues. Symptom – "strange" serialization errors after switching databases. Prevention: have a retry for SQLSTATE class 40.
- **Write skew in the "at least one doctor on call" problem**: two transactions both see 2 doctors on call, each takes one off duty, and the result is 0. Prevention: SERIALIZABLE, or explicitly lock the relevant rows with {{FOR UPDATE}}, or enforce the rule with a database constraint.
- **Transactions left open for hours (forgotten commit, long batches)**: symptom – PostgreSQL bloat, InnoDB "History list length" soaring, queries getting slower. Prevention: set {{idle_in_transaction_session_timeout}}, split into small batches.

### One-minute spoken answer
"The SQL standard has four isolation levels, each blocking one more anomaly: READ COMMITTED blocks dirty reads, REPEATABLE READ also blocks non-repeatable reads, SERIALIZABLE blocks phantoms and other anomalies too. Both PostgreSQL and InnoDB use MVCC: a write creates a new version and readers look at a snapshot, so reads do not block writes. The main differences are that PostgreSQL defaults to READ COMMITTED with a new snapshot per statement, and its REPEATABLE READ also blocks phantoms but still allows write skew; InnoDB defaults to REPEATABLE READ, keeps the read view for the whole transaction, and blocks phantoms on writes with gap locks, so deadlocks are more likely. The trade-off is that higher levels mean more conflicts and retries. In practice I set the isolation level explicitly, use atomic updates or locks for read-modify-write, and always have a retry for serialization errors."

> Senior tip: always set the **isolation level explicitly** in the application configuration instead of relying on DB defaults, because defaults differ between PostgreSQL and MySQL – the same code runs on both but behaves differently. Also prepare a **retry with backoff + jitter** mechanism for serialization/deadlock errors: it is the standard remedy for rare contention in PostgreSQL as well as CockroachDB.`,
    follow: [
      'Why does PostgreSQL REPEATABLE READ have no phantoms but still allows write skew?',
      'How does write skew happen and how do you handle it?'
    ],
  },
  'db-003': {
    q: `How do you read {{EXPLAIN ANALYZE}} and optimize a slow query step by step? Which signs in the execution plan point to the root cause?`,
    a: `**Summary:** {{EXPLAIN}} shows the **estimated** plan; {{EXPLAIN ANALYZE}} actually runs the query and returns the **actual** plan with per-node timings. The right optimization loop is: **measure baseline → read the plan → find the costly node → explain it with indexes/statistics/data → fix → measure again**, and repeat. The most important sign: **estimated row counts that diverge strongly from actual rows**.

### Quick intuition
An execution plan is like the **route Google Maps draws** before you drive: take the motorway (index) or the country lanes (table scan), turn where (join), and do you have to queue (sort). {{EXPLAIN}} only shows the planned route; {{EXPLAIN ANALYZE}} actually drives it and records how long each leg took. If Maps says "this leg takes 2 minutes" but it really takes 40, the map (the statistics) is out of date – that is exactly the "estimated rows far from actual rows" sign. Optimizing a query means finding the most congested leg and fixing that spot.

### Terms
- **Execution plan**: the tree of steps (nodes) the DB uses to run the SQL; child nodes run first and feed their rows to the parent.
- **Optimizer (planner)**: the component that picks the cheapest plan based on the estimated **cost**.
- **Statistics**: sampled numbers about a table (row count, value distribution) the optimizer uses for estimates; refreshed with {{ANALYZE}}.
- **Seq Scan / Index Scan / Bitmap Heap Scan**: scan the whole table / walk the index fetching rows one by one / collect positions from the index and then read the table in batches.
- **Nested Loop / Hash Join / Merge Join**: the three join strategies – loop inside a loop, build a hash table, merge two sorted sequences.
- **Buffers shared hit / read**: pages served from cache / pages that had to be read from disk (or the OS cache).
- **work_mem**: the memory each sort/hash operation may use before it has to spill to disk.
- **Plan regression**: a query that used to be fast suddenly becomes slow because the optimizer switched to a worse plan.

### Reading a concrete plan
~~~text
Nested Loop  (cost=0.43..9120.5 rows=12 width=48) (actual time=0.05..842.1 rows=48210 loops=1)
  -> Seq Scan on orders o  (rows=12) (actual rows=48210 loops=1)
       Filter: (status = 'NEW')   Rows Removed by Filter: 1951790
  -> Index Scan using customers_pkey on customers c (actual time=0.01..0.01 rows=1 loops=48210)
Buffers: shared hit=150321 read=22012
~~~
1. **Read from the innermost node outwards, from the bottom up**: the most deeply indented node runs first. Why: a parent only receives the rows its children return.
2. **Compare estimated with actual**: 12 rows estimated, 48,210 actual – off by 4,000x. Why it matters: because it assumed only 12 rows, the optimizer chose Nested Loop; with 48 thousand rows, Hash Join would make sense.
3. **Multiply the time by loops**: the inner index scan costs 0.01 ms but runs 48,210 times ≈ 480 ms. Why: the "actual time" figure is **per iteration**.
4. **Look at Rows Removed by Filter**: 1.95 million rows discarded to keep 48 thousand – an index on {{status}} is missing (or a suitable composite index).
5. **Look at Buffers**: {{read=22012}} pages ≈ 172 MB read from disk – this explains why the first run is slower than the later ones.
6. **Fix and measure again**: run {{ANALYZE orders}}, add the right index, then compare the time before and after.

### Commands to read the plan
~~~sql
-- PostgreSQL
EXPLAIN (ANALYZE, BUFFERS, VERBOSE) SELECT ...;

-- MySQL 8.0.18+
EXPLAIN ANALYZE SELECT ...;
EXPLAIN FORMAT=JSON SELECT ...;
~~~

### Signs worth watching
| Sign | Typical cause |
|---|---|
| Seq Scan on a large table | Missing index, or low selectivity |
| Large Rows Removed by Filter | Filtering out too many rows – the index does not fit |
| Estimated rows off by 10x from actual | **Stale statistics** → run {{ANALYZE}} |
| Nested Loop with the inner side scanned many times | Missing index on the inner side, or wrong join order |
| Sort: external merge (disk) | No index matching the {{ORDER BY}}, or {{work_mem}} too small |
| Rows Removed by Join Filter | Filter placed at the wrong point of the join |
| High buffer reads | The query scans many pages, missing index or non-covering index |

### The optimization process
1. **Measure first**: actual duration, returned row count, call frequency, {{EXPLAIN (ANALYZE)}}.
2. **Locate the cost**: walk down from the root node and find the node with the largest time; do not stop at the first node.
3. **Find the cause**: missing index? stale statistics? wrong join? skewed data distribution? badly written query?
4. **Fix**: add the right index, rewrite the query, change the table structure, reduce the amount of data scanned.
5. **Measure again** and compare; repeat if the target is not met.

### Pitfall production
- Running {{EXPLAIN ANALYZE}} on a real {{UPDATE}}/{{DELETE}} actually executes the change → wrap it in {{BEGIN}} + {{ROLLBACK}}.
- Optimize based on **actual numbers**, not on how "pretty" the plan looks; an odd-looking plan can still be faster.
- An index that is added but never used still slows down writes.
- Check for **parameter sniffing**: a plan that is good for one parameter set can be terrible for another. On PostgreSQL, prepared statements build a **custom plan** from the actual values for the first 5 runs, and from the 6th run may switch to a **generic plan** if it estimates that is not more expensive – control this with {{plan_cache_mode}}. MySQL does not cache plans that way (it re-optimises on every run), but the plan still changes with the parameter values and the statistics.
- For scheduled queries, keep a history of plans over time to detect **plan regression** after a deploy.

### Common mistakes
- **Running EXPLAIN without ANALYZE**: symptom – the plan looks fine but the query is still slow, because you only saw estimates. Prevention: use {{EXPLAIN (ANALYZE, BUFFERS)}} on an environment whose data resembles production.
- **Measuring on 1,000 rows of dev data**: the optimizer picks a completely different plan than on 50 million production rows. Prevention: test on an anonymised copy of the data, or at least on the same distribution.
- **Measuring once and concluding**: the first run reads from disk (cold cache), the next ones from RAM. Prevention: run it a few times and compare both the Buffer hit and read numbers.
- **Adding an index while the query still wraps the column in a function**: the index is not used. Prevention: re-read the plan after the fix; do not assume.

### One-minute spoken answer
"EXPLAIN gives me the planned route, while EXPLAIN ANALYZE actually runs the query and reports the real time and row counts for each node. My process is: measure a baseline, read the plan from the innermost node outwards, find the node that costs the most – remembering to multiply by the number of loops – and then explain why it is slow: missing index, stale statistics, wrong join type, or a sort spilling to disk. The most important sign is estimated rows far from actual rows, because that is when the optimizer picks the wrong join algorithm. After fixing it I measure again to be sure. One practical note: EXPLAIN ANALYZE on an UPDATE really writes data, so wrap it in BEGIN and ROLLBACK, and I use pg_stat_statements to find the most expensive queries overall, not just the slowest single run."

> Senior tip: store {{EXPLAIN ANALYZE}} output of important queries in CI or monitor with {{pg_stat_statements}} / {{auto_explain}} to **catch plan regression before production**. A tiny change in an index or in statistics can make a query 100x slower without a single line of code changing.`,
    follow: [
      'What does the difference between the estimated and the actual plan tell you?',
      'Why is {{EXPLAIN ANALYZE}} on an {{UPDATE}} very dangerous?'
    ],
  },
  'db-004': {
    q: `What causes database deadlocks and how do you handle them? What would you do when a deadlock error appears in production?`,
    a: `**Summary:** A deadlock happens when two transactions each hold a lock the other needs, forming a wait cycle. The database detects the cycle (InnoDB checks as soon as a lock has to wait, when {{innodb_deadlock_detect=ON}}; PostgreSQL checks after {{deadlock_timeout}}, 1s by default) and **rolls one transaction back** (the victim) to release resources; the other transaction proceeds. The client gets the error and **must retry** – this is normal behaviour, not a system incident.

### Quick intuition
Two cars meet on a narrow single-lane bridge: car A is already halfway in from the left and waits for B to back up, while B is halfway in from the right and waits for A to back up – nobody can move. That is a deadlock. The DB plays traffic cop: it spots that the two cars are waiting for each other in a cycle, then makes one car (the victim) turn around (rollback) so the other can drive on. The car that was sent back only needs to start over to get across. The best prevention is the rule "everybody drives in the same direction" – in other words, lock resources in the same order.

### Terms
- **Row lock**: a lock on one row; {{UPDATE}}/{{DELETE}}/{{SELECT ... FOR UPDATE}} take it automatically and hold it until commit/rollback.
- **Wait-for graph**: a graph of "which transaction is waiting for which transaction"; a cycle means a deadlock.
- **Victim**: the transaction the DB picks to roll back (InnoDB picks the "smaller" one – fewer rows modified/locked).
- **deadlock_timeout**: (PostgreSQL) how long a lock wait lasts before the deadlock check runs, 1s by default.
- **innodb_lock_wait_timeout**: (MySQL) the maximum time to wait for one row lock, 50s by default – this is not the same thing as a deadlock.
- **SQLSTATE**: the standard 5-character error code; class {{40}} means the transaction was rolled back.
- **Jitter**: adding a random delay to the retry wait so that many clients do not retry at the same instant.

### How a deadlock unfolds, step by step
~~~text
Tx1: UPDATE account SET .. WHERE id=1   -- holds the lock on row 1
Tx2: UPDATE account SET .. WHERE id=2   -- holds the lock on row 2
Tx1: UPDATE account SET .. WHERE id=2   -- WAITS for Tx2
Tx2: UPDATE account SET .. WHERE id=1   -- WAITS for Tx1  => a cycle
      Tx1 ---waits---> Tx2
       ^                |
       +-----waits------+
DB: picks Tx2 as the victim -> ROLLBACK Tx2 (error 40P01 / 1213), Tx1 carries on
~~~
1. **Each transaction takes locks gradually** while it runs; it does not take them all up front. Why: the DB cannot know in advance which rows you will touch.
2. **Locks are held until the end of the transaction**. Why: so it can be rolled back, and so others cannot see or modify half-finished data.
3. **When it has to wait**, the DB records an edge in the wait-for graph. InnoDB checks for a cycle immediately; PostgreSQL waits {{deadlock_timeout}} first (because most waits end by themselves, and checking immediately would burn CPU).
4. **A cycle is detected** → pick a victim, roll back that whole transaction, return the error to the client. Why roll back the whole transaction: all of its locks must be released to break the cycle.
5. **The client retries** with a new transaction; by then Tx1 has finished, so the retry usually succeeds.

In the money-transfer example: if both flows always lock the smaller id first (as in the code below), Tx2 waits at the very first lock on row 1 – it only waits, there is no cycle.

### When deadlocks occur
1. **Different lock order**: transaction A locks table 1 then table 2, transaction B locks table 2 then table 1.
2. **Missing index**: {{WHERE status = 'X'}} has no index ⇒ the DB scans and locks more rows than necessary ⇒ overlapping lock ranges.
3. **Long-held transactions**: calling an HTTP service, reading files, or heavy processing **inside** the transaction.
4. **Low isolation level + many transactions** contending for the same set of rows.
5. **Large tables, bulk updates in an unspecified order**.

### Handling in code
~~~java
@Transactional
public void transfer(Long from, Long to, BigDecimal amount) {
    // always lock in the same order (by id) to avoid the wait cycle
    Account a = accountRepo.findByIdForUpdate(min(from, to)).orElseThrow();
    Account b = accountRepo.findByIdForUpdate(max(from, to)).orElseThrow();
    a.debit(amount);
    b.credit(amount);
}
~~~

- **Retry with backoff + jitter**: after a deadlock the transaction has rolled back → you must **start a new transaction** and run it again. Use Spring Retry or a {{try-catch}} loop with randomised backoff.
- **Transactions must be short**: no external HTTP/SDK calls, no file processing inside the transaction.
- **Always have indexes** for every filter involved in locking ⇒ fewer locked rows.
- **Agree on a lock order** across all writers (e.g. always by ascending id).
- For job queues: {{SELECT ... FOR UPDATE SKIP LOCKED}} so workers do not wait on each other.

### Recognising it in logs
- PostgreSQL: error {{deadlock detected}} with SQLSTATE **40P01**.
- MySQL: error **1213** ({{Deadlock found when trying to get lock}}).
- Both belong to SQLSTATE class **40** (transaction rollback): a PostgreSQL deadlock is **40P01**, a serialization failure ({{REPEATABLE READ}}/{{SERIALIZABLE}}) is **40001**, and MySQL 1213 returns SQLSTATE **40001**. That is why retry logic usually catches the whole class 40 (Spring translates them into {{PessimisticLockingFailureException}}/{{CannotAcquireLockException}}).

### Pitfall production
- **Wrong retry**: retrying inside the same rolled-back transaction is meaningless – a new transaction is required.
- Retries without **jitter** make many clients retry at the same moment and recreate the deadlock.
- A deadlock caused by one "bad" piece of code keeps repeating: alert on the **rate**, not just on logs, and investigate when the rate grows.
- PostgreSQL writes deadlock details to the server log ({{pg_stat_database.deadlocks}} is only a counter); MySQL: check {{SHOW ENGINE INNODB STATUS}} (section LATEST DETECTED DEADLOCK) or enable {{innodb_print_all_deadlocks}} to find which query caused it.

### Common mistakes
- **Putting {{@Retryable}} on the same method as {{@Transactional}} with the wrong proxy order**: the retry runs **inside** the already-broken transaction. Symptom – the retry always fails. Prevention: put the retry on the calling layer (a different bean) so each attempt opens a new transaction.
- **Confusing lock wait timeout with a deadlock**: MySQL error 1205 (waited more than 50s) is not a deadlock – it means some transaction is holding a lock for too long. Prevention: find the long transaction in {{information_schema.innodb_trx}} / {{pg_stat_activity}}.
- **Foreign key without an index**: deleting a parent row makes the DB scan and lock a wider range of the child table than necessary. Prevention: always index FK columns (PostgreSQL does not create that index for you).
- **Unordered batch update**: two jobs update the same list of ids in different orders. Prevention: sort the ids before updating.

### One-minute spoken answer
"A deadlock is when two transactions each hold a lock the other needs, forming a wait cycle. The DB detects the cycle – InnoDB immediately, PostgreSQL after a one-second deadlock_timeout – and rolls back one transaction as the victim, so the client gets error 40P01 or MySQL 1213. I handle it on two levels: prevention by locking in a fixed order, keeping transactions short and having an index for every write predicate; and tolerance through retries in a new transaction with backoff and jitter. In production I read the PostgreSQL server log or SHOW ENGINE INNODB STATUS to see which two statements were involved, then fix the lock order. I also watch the deadlock rate over time: a sudden spike after a deploy usually points at a code change."

> Senior tip: a deadlock is **not a database bug** – it is the consequence of multiple transactions contending for resources in different orders. Treat it as a signal about your transaction design: your transaction is doing too much, locking in an unstable order, or scanning a table without an index. The goal is to reduce the deadlock **frequency**, not merely to "catch and retry".`,
    follow: [
      'Why must you retry using a new transaction after a deadlock?',
      'How do you avoid deadlocks when updating several related tables?'
    ],
  },
  'db-005': {
    q: `How do offset pagination and keyset (seek) pagination differ? With a table of tens of millions of rows, which one do you pick?`,
    a: `**Summary:** {{OFFSET n}} forces the DB to **read and skip n rows** first ⇒ the deeper the page, the slower (O(n²) total cost if the user scrolls through every page). **Keyset (seek) pagination** uses a predicate on the sort columns: {{WHERE (created_at, id) < (:lastCreatedAt, :lastId)}} plus {{LIMIT}} ⇒ an index range scan whose time stays nearly **constant** no matter how deep the page is.

### Quick intuition
Reading a book with OFFSET is like having to **flip from page 1 and count** every time you want page 500 – the further in, the more tiring. Keyset is a **bookmark**: next time you open the book you go straight to the bookmark and keep reading. The "bookmark" here is the value of the sort column on the last row of the previous page (for example {{created_at}} + {{id}}). Because the index is already sorted, the DB jumps straight to the bookmark and reads the next 20 rows.

### Terms
- **OFFSET / LIMIT**: skip the first n rows / return at most k rows.
- **Keyset (seek) pagination**: filter for "the rows that come after the last row you saw" in sort order, instead of counting positions.
- **Cursor**: the value marking a position (e.g. {{created_at}} + {{id}} of the last row), usually base64-encoded and sent to the client.
- **Tie-breaker**: a unique column appended to ORDER BY so the order is always deterministic when sort values are duplicated.
- **Row value comparison**: comparing a tuple {{(a, b) < (x, y)}} in dictionary order; both PostgreSQL and MySQL 8 support this syntax.
- **Index range scan**: start at one point in the index and read the following leaves sequentially.

### Why OFFSET gets slower, step by step
~~~text
OFFSET 100000 LIMIT 20:
index: [1][2][3]......[100000][100001..100020]
        ^---- read then DISCARD 100000 rows ----^  ^-- return 20 rows
Keyset WHERE id < 100000 LIMIT 20 (sort id desc):
index:                     [99999..99980]
                            ^-- jump straight here through the B-tree, read 20 rows
~~~
1. **OFFSET has no "address"**: the DB does not know where row number 100,000 lives, so it has to count from the start. Why: a B-tree knows positions by **key value**, not by row sequence number.
2. **Every skipped row still costs work**: read the page, check the condition, (usually) fetch the whole row from the table. Typical numbers: page 1 takes 2 ms, page 5000 takes 1–3 seconds.
3. **Keyset turns the problem into a value lookup**: {{WHERE (created_at, id) < (:t, :id)}} is a predicate the B-tree answers with one trip from root to leaf (a few pages).
4. **Read the next 20 leaves** through the linked list and stop thanks to {{LIMIT}}. Why the time is nearly constant: the number of pages read does not depend on which page you are on.
5. **Bonus on correctness**: with OFFSET, if rows are inserted at the top while the user is paging, the next page repeats rows; keyset does not, because it follows values.

### Comparison
| Style | Query | Page depth | Notes |
|---|---|---|---|
| Offset | {{LIMIT 20 OFFSET 100000}} | Slows down | The DB reads 100020 rows and discards 100000 |
| Keyset | {{WHERE id < :lastId ORDER BY id LIMIT 20}} | Constant | Reads only the index range it needs |

### How keyset pagination is done
~~~java
// Spring Data JPA repository
@Query("select o from Order o " +
       "where o.createdAt < :t or (o.createdAt = :t and o.id < :id) " +
       "order by o.createdAt desc, o.id desc")
List<Order> findNext(@Param("t") Instant lastCreatedAt,
                     @Param("id") Long lastId,
                     Pageable page);   // call with PageRequest.of(0, 20): LIMIT only, no OFFSET

// an index matching the sort order is required: (created_at DESC, id DESC)
~~~

### Important conditions
1. The sort columns must be **indexed**, and the index order must match the sort order.
2. You need a perfect **tie-breaker** column such as {{id}} – without it, rows with identical {{created_at}} can be skipped or repeated.
3. The cursor ({{created_at}} + {{id}} of the last row) must travel to the client as an encoded token.
4. The query must be **order-stable** – add {{id}} to the {{ORDER BY}} to be sure.

### Keyset trade-offs
- No "jump to page 50" support – you must walk cursor by cursor.
- Counting total rows ({{COUNT}}) is also costly on large tables; cache the count or drop it entirely.
- When users want to sort by a different column, the cursor breaks ⇒ usually restrict the supported sort modes.

### When offset is still fine
- Small tables, a few thousand rows (offset costs little).
- Random "page N" access, or a total page count must be displayed.
- Batch exports run on a fixed schedule outside peak hours.

### Common mistakes
- **No tie-breaker**: many orders share the same {{created_at}} (batch imports). Symptom – users see duplicated or missing rows at page boundaries. Prevention: always {{ORDER BY created_at DESC, id DESC}} and include both in the cursor.
- **Index not matching the sort direction, or missing the id column**: symptom – the plan gains a Sort node and slows down as the table grows. Prevention: an index on {{(created_at, id)}} (a B-tree can be read backwards, so DESC/DESC still uses it; you only need a separate index when you mix ASC and DESC directions).
- **Returning {{Page}} in Spring Data for keyset**: {{Page}} also runs a {{COUNT(*)}} query every time – on a large table that costs as much as the main query. Prevention: return {{Slice}} or {{List}}; Spring Data 3.1+ also has {{Window}} + {{ScrollPosition}} with built-in keyset support.
- **A NULLable sort column**: comparisons with NULL are never true, so NULL rows silently disappear. Prevention: make the sort column NOT NULL, or handle NULLS FIRST/LAST explicitly.

### One-minute spoken answer
"OFFSET forces the DB to read and discard n rows, so the deeper the page the slower it gets; keyset keeps the sort value of the last row and asks 'the rows after this value', so the DB goes straight there through the index and the time barely changes. For a table with millions of rows I choose keyset, with ORDER BY created_at, id using id as the tie-breaker, a matching index, and an encoded cursor returned to the client. The trade-off is that you cannot jump to page N and arbitrary sort changes are hard, so for a small admin screen that needs page numbers I still use OFFSET. In practice, moving a transaction-list API to keyset and dropping COUNT(*) cut p99 from seconds to tens of milliseconds."

> Senior tip: for "load more" lists (infinite scroll) – feeds, order lists – keyset is the default choice, because users in practice only reach the first few pages, exactly where offset is most expensive. On tables with hundreds of millions of rows, switching from offset to keyset typically turns a multi-second response into under 50 ms, provided an index matches the sort columns + tie-breaker.`,
    follow: [
      'Why is a tie-breaker column like {{id}} required for keyset pagination?',
      'How do you store the cursor safely when the client may tamper with its values?'
    ],
  },
  'db-006': {
    q: `How do replication, partitioning and sharding differ? How do you choose a shard key, and what problems will arise?`,
    a: `**Summary:** **Replication** copies data for read scaling / availability (one primary writes, replicas serve reads) – it solves read load, **not** write load. **Partitioning** splits one large table into partitions **within the same** instance – it improves manageability and maintenance, not horizontal scale. **Sharding** distributes data across independent **instances** – it scales writes too, at the price of operational complexity.

### Quick intuition
Think of a library. **Replication** is photocopying the whole book collection into several reading rooms: many people can read at once, but new books are only received at one main desk and then shipped to the other rooms. **Partitioning** is arranging the shelves in **one** room by publication year: to find a 2025 book you only go to the 2025 shelf, and to clear old stock you carry that whole shelf away. **Sharding** is opening several **library branches**, each holding part of the collection (say by the author's surname): total capacity and the number of intake desks goes up, but to find "every book about Java" you have to ask every branch.

### Terms
- **Primary / replica**: the node that accepts writes / a read-only copy that receives changes from the primary.
- **Replication lag**: the delay between a commit on the primary and the moment a replica sees the change.
- **Partition pruning**: the optimizer rules out the partitions that certainly contain no matching rows.
- **Shard key**: the column that decides which shard a row lives on.
- **Scatter-gather (fan-out)**: send the query to every shard and merge the results – slow and expensive.
- **Hot shard**: one shard that takes far more load than the others.
- **Resharding**: redistributing data when shards are added or removed.
- **Saga / 2PC**: a chain of steps with compensating steps on failure / a two-phase commit protocol that blocks every party until all agree.

### Three techniques in one picture
~~~text
Replication            Partitioning (1 instance)      Sharding (several instances)
 [Primary] --WAL-->     orders                         router: hash(customer_id) % 3
   |   |   [Replica]     |- orders_2026_01             [DB0] cust 0,3,6..
 write |                |- orders_2026_02             [DB1] cust 1,4,7..
       +--> [Replica]    |- orders_2026_03             [DB2] cust 2,5,8..
~~~
### One request through a sharded system, step by step
1. **The application determines the shard key** in the request (e.g. {{customer_id = 42}}). Why: without a key you do not know where to send it and must fan out.
2. **The router computes the shard**: a hash or a lookup table (directory) maps key → shard. Why a directory/consistent hashing is often used instead of a simple {{% N}}: when N changes, nearly every key has to move.
3. **The query runs on one shard** like an ordinary DB – indexes, transactions and joins all stay intact **inside** the shard.
4. **Operations that touch several shards** (a transfer between two customers on different shards) need a Saga or an outbox, because there is no longer one shared transaction.
5. **Global reports** read from a derived store (data warehouse, Elasticsearch) fed through CDC, instead of fanning out to the shards serving online traffic.

### Comparison
| Criterion | Replication | Partitioning | Sharding |
|---|---|---|---|
| Scope | Several copies of the data | Several partitions in 1 DB | Several independent DBs |
| Solves | Read load, HA | Managing big tables, fast vacuum/drop | Write and read load, capacity growth |
| Cross-unit queries | Easy (read from replica) | Easy if the partition key is present | Hard (scatter-gather) |
| Transactions | Native unit | Native unit | Needs Saga/2PC |
| Joins | Native unit | Native unit | Hard, usually requires denormalization |

### Partitioning
PostgreSQL supports declarative partitioning (range/list/hash) – a query that filters on the partition column gets **partition pruning** (only the relevant partitions are scanned). The biggest win: a huge history table split by month ⇒ old data is removed with {{DROP PARTITION}} instead of {{DELETE}} of millions of rows. MySQL 8 also has RANGE/LIST/HASH/KEY partitioning and pruning, but with tighter constraints: every unique key (including the PK) must contain the partition column, and partitioned tables do not support foreign keys. (PostgreSQL also requires unique constraints to contain the partition key.)

### Choosing the shard key
Criteria, in priority order:
1. **The vast majority of queries must include the shard key** – avoid far-reaching scatter-gather.
2. **Balanced load**: row counts and write frequency must be even across shards.
3. **Even growth** – sharding by time creates an "empty newest shard" and skew over time.
4. **Avoid hot shards**: one huge customer or one viral product easily creates a hot spot.

A real-world example: shard by {{tenant_id}} or {{customer_id}} for multi-tenant systems; shard by {{order_id}} (hash range) for a transaction table that has no customer-based queries.

### Problems you must solve when sharding
- **Cross-shard consistency**: use a Saga (a chain of compensating actions) instead of 2PC; accept eventual consistency.
- **Global queries**: feed data into a search engine/OLAP store, or design reads from a read-only copy.
- **Resharding**: needs double-write, backfill, then a traffic cutover.
- **Globally unique IDs**: snowflake, UUIDv7, or allocating id ranges from a central service.
- **Total count queries** are very expensive because they must fan out.

### Pitfall production
- Picking a shard key because it is "easy to split" while ignoring the real queries is the most common reason sharded systems get rewritten.
- **Resharding** during peak traffic is a standalone project: it needs a plan and tooling (double-write + backfill + cutover).
- A read replica has **replication lag**: a read right after a write may not see the data ⇒ implement "read-your-writes" by reading the primary or using sticky routing.
- Sharding does not magically improve performance if every query must fan out.

### Common mistakes
- **Reading from a replica right after a write**: the user has just renamed something, hits refresh, and sees the old name. Prevention: read the primary for that user's own data for a few seconds after a write, or route by transaction type ({{@Transactional(readOnly = true)}} → replica, everything else → primary), carefully.
- **Partitioning by a column the queries do not filter on**: symptom – the query scans **every** partition and is slower than a normal table. Prevention: every hot query must filter on the partition key; verify pruning with EXPLAIN.
- **Sharding by time**: all of today's writes pile onto the newest shard (a hot shard). Prevention: shard by an evenly distributed key (tenant, customer) and only partition by time **inside** each shard.
- **Too many small partitions**: thousands of partitions slow planning down and consume memory. Prevention: keep a moderate number (tens to a few hundred) and choose monthly instead of daily granularity when that is enough.

### One-minute spoken answer
"The three concepts solve three different problems. Replication creates copies to scale reads and for HA, but every write still goes through one primary and there is replication lag. Partitioning splits one big table into parts inside the same instance; the main benefits are partition pruning and dropping old data with a partition drop. Sharding spreads data across independent DBs, so it scales writes too, at the cost of losing cross-shard transactions and joins. I choose the shard key from the real queries: most queries must include it, the distribution must be even, and it must not create a hot shard – usually the tenant or the customer id. My experience is to work through query tuning, replicas, partitioning and caching before sharding, because sharding is nearly impossible to undo."

> Senior tip: before sharding, walk this ladder: **optimize indexes and queries → read from replicas → partition → cache → and only then shard**. Sharding is an almost irreversible decision: it affects every query, every transaction and even the organization. In banking systems, sharding by **branch/tenant** often matches the business boundary and also satisfies data-residency requirements.`,
    follow: [
      'Why does replication lag cause the "read does not see the just-written data" problem?',
      'Compare Saga and 2PC for transactions spanning multiple shards?'
    ],
  },
  'db-007': {
    q: `HikariCP connection pool: how do you size it, what are the important timeouts, and how do you detect leaking connections (leak detection)?`,
    a: `**Summary:** HikariCP is the default pool in Spring Boot. Sizing principle: **an application's connections must never exceed what the DB can serve**; the total connections across the whole system must stay below the DB's {{max_connections}}. Practical rule: a pool of about **10–20** per instance, and **much smaller** with virtual threads.

### Quick intuition
A connection pool is like a **taxi rank outside an airport**: instead of every passenger hailing a brand-new car (opening a connection costs 20–100 ms: TCP, TLS, authentication), 15 cars are already parked and waiting; a passenger takes one and brings it back when done. If all 15 are out driving, the next passenger has to **queue** – and gives up (gets an error) after waiting longer than {{connection-timeout}}. It sounds like more cars would always help, but the road into the city (the DB's CPU and disks) only has a few lanes: 200 cars at once just create a traffic jam. Leak detection is the camera that records "which car has been gone for more than 60 seconds, and who took it".

### Terms
- **Connection pool**: a set of database connections opened in advance and reused across requests.
- **HikariCP**: the JDBC pool library Spring Boot uses by default; known for being fast and lean.
- **max_connections**: (PostgreSQL) the maximum number of connections the server accepts; each connection is a process costing a few MB of RAM.
- **Pending threads**: how many threads are waiting to get a connection – a sign the pool is too small or connections are held too long.
- **Connection leak**: taking a connection and not returning it to the pool (or holding it for a very long time).
- **Little's Law**: work in progress = arrival rate × time in system; it helps estimate how many connections you need.
- **PgBouncer**: a proxy in front of PostgreSQL that funnels many client connections into a few real ones.

### The life of a connection, step by step
~~~text
request -> getConnection() --available--> use ~5ms -> close() = RETURN TO POOL
                 |
                 +--none left--> wait (pending) ... past 3000ms -> SQLTransientConnectionException
Hikari housekeeping: connection alive > max-lifetime -> close and create a new one
                     borrowed > leak-detection-threshold -> WARN log with a stack trace
~~~
1. **Startup**: Hikari opens {{minimum-idle}} connections. Why: the first request should not pay the cost of opening one.
2. **Borrow**: {{getConnection()}} takes a free connection; Spring does this when entering {{@Transactional}} or when a repository runs a query.
3. **Return**: calling {{close()}} on a pooled connection does **not close the socket** – it returns the connection to the pool. Why forgetting to return means a leak: the pool still believes it is in use.
4. **Waiting when drained**: the thread blocks until {{connection-timeout}}. Why keep it short (2–5s): failing fast beats hanging a request for 30s and dragging the whole system down.
5. **Periodic replacement**: once past {{max-lifetime}} a connection is closed while idle and replaced. Why: firewalls/NAT/the DB can silently drop connections; Hikari recommends setting this a few tens of seconds below that limit.

**An example with Little's Law**: 400 requests/s, each holding a connection for 20 ms on average ⇒ 400 × 0.02 = **8 connections** busy at the same time. A pool of 15 is plenty for the peak; a pool of 100 only adds contention at the DB.

### Reference configuration
~~~yaml
spring:
  datasource:
    hikari:
      pool-name: app-pool
      maximum-pool-size: 15
      minimum-idle: 5
      connection-timeout: 3000      # ms - how long to wait at most for a connection
      max-lifetime: 1800000         # 30 minutes - retire connections before the DB cuts them off
      idle-timeout: 600000
      leak-detection-threshold: 60000
      validation-timeout: 5000
~~~

### What each parameter means
- {{maximum-pool-size}}: ceiling of concurrently open connections. Too high ⇒ the DB fights over CPU/I/O and latency rises; too small ⇒ requests wait.
- {{connection-timeout}}: how long to wait for a connection. **Too long** ⇒ requests hang (holding downstream connections too); **too short** ⇒ mass failures of "Connection is not available, request timed out".
- {{max-lifetime}}: should be shorter than the idle timeout of the DB/firewall, to avoid using connections the server already closed.
- {{leak-detection-threshold}}: if a connection is held for **too long** (e.g. > 60s), Hikari logs the stack trace of the code that took it. This is the most important **leak detection** tool.

### How to size
1. Check the DB's {{max_connections}} and the number of app instances: {{maximum-pool-size × instances}} (counting peak rolling deploy/autoscale) must stay below {{max_connections}} (usually leave ~20% for admin, replication, tooling).
2. Size by the **DB's CPU core count**: the DB truly runs in parallel roughly at core count; the HikariCP reference formula: pool ~ (DB cores × 2) + effective spindles.
3. Start with 10–20 and then **measure**: wait time (pool wait), timeout rate, DB throughput.

### Pitfall production
- **Connection leaks**: holding a connection long while calling external HTTP services inside a transaction, or forgetting to close a stream/ResultSet. Enable {{leak-detection-threshold}} in production (many apps turn it off because the log is noisy – that is the wrong trade-off).
- **A transaction holds the connection for the whole processing time** ⇒ the pool drains as load grows. Shorten transactions and push non-DB work outside.
- **An oversized pool makes the DB slower**: many concurrent connections only add contention, not throughput.
- With **virtual threads**, thread counts can be huge but connections remain a finite resource ⇒ keep the pool small (often 5–10) and watch {{hikaricp.connections.pending}}.
- Several small apps sharing one DB ⇒ consider **PgBouncer** (transaction pooling) instead of growing pools.

### Common mistakes
- **Leaving {{spring.jpa.open-in-view}} enabled (true by default)**: the connection is held while the JSON/view is rendered. Symptom – the pool drains even though queries are fast. Prevention: set {{spring.jpa.open-in-view=false}} and load everything you need inside the service.
- **Calling an external API inside {{@Transactional}}**: if the API takes 5s, the connection is held for 5s too. Symptom – "Connection is not available, request timed out after 3000ms" when the partner is slow. Prevention: call the API before or after the transaction.
- **{{max-lifetime}} longer than the firewall/DB timeout**: symptom – random "connection reset" errors after quiet hours. Prevention: set max-lifetime below the infrastructure limit (e.g. 30 minutes against a 60-minute limit).
- **Autoscaling to 50 pods × pool 20 = 1000 connections** into PostgreSQL with {{max_connections=500}}: symptom – "too many clients already" while scaling. Prevention: compute for the maximum number of pods and use PgBouncer/RDS Proxy.

### One-minute spoken answer
"HikariCP keeps a set of connections ready because opening a new one is expensive. I size by what the DB can serve, not by the number of app threads: the sum of all instance pools must stay below max_connections, each instance usually gets 10–20, and I use Little's Law – requests per second times connection hold time – to check. The key timeouts are a short connection-timeout of a few seconds so we fail fast, a max-lifetime shorter than the firewall limit, and leak-detection-threshold to log the stack trace where a connection was borrowed for too long. The trade-off is that a bigger pool does not make the DB faster, it only adds contention. When pending goes up, the first thing I do is find the transaction holding the connection – usually open-in-view or an external API call inside the transaction – instead of raising the pool."

> Senior tip: the most important pool metrics are **wait time** and **pending connections**. If pending > 0 regularly, do not raise the pool size right away – find the slow query holding transactions open, because enlarging the pool only moves the bottleneck from the app down to the DB. Only if DB CPU stays under 50% while still slow does it become reasonable to raise the pool.`,
    follow: [
      'How do you detect connection leaks in production?',
      'Why should virtual threads not be paired with a large connection pool?'
    ],
  },
  'db-008': {
    q: `How do you change the schema of a table with hundreds of millions of rows without downtime? Compare expand/contract with Flyway and Liquibase.`,
    a: `**Summary:** The principle is **expand/contract** (widen first, narrow later) so every running version of the application keeps working throughout the deployment. Steps: (1) **Expand** – add the new column as **nullable** or with a cheap default; (2) **Backfill** data in small batches; (3) **Migrate** – the code reads/writes both old and new columns; (4) **Contract** – drop the old column in a later release, once no old version is running anymore.

### Quick intuition
Changing the schema of a big table is like **repairing a road while the cars keep driving**: you cannot close the whole road (that would be downtime), so you build a new lane next to it first (expand), let cars use both lanes during the transition (dual-write, backfill), and only tear the old lane down once you are sure nobody uses it (contract). Why you must do it this way: during a rolling deploy the old and the new app versions **run at the same time** for minutes or hours, and both must understand the schema. Flyway and Liquibase are the "construction logbook": they record which step already ran on which database, so every environment follows the same route.

### Terms
- **DDL**: a statement that changes the structure ({{CREATE}}, {{ALTER}}, {{DROP}}).
- **Table rewrite**: the DB copies the whole table into a new file on ALTER – holding a strong lock for the whole copy.
- **ACCESS EXCLUSIVE lock**: PostgreSQL's strongest lock, blocking reads and writes alike; most {{ALTER TABLE}} statements need it, even if only for an instant.
- **Online DDL**: DDL that allows concurrent reads/writes (MySQL {{ALGORITHM=INPLACE/INSTANT, LOCK=NONE}}).
- **Backfill**: filling the new column for existing rows, in batches.
- **Dual-write**: during the transition the app writes to both the old and the new column.
- **Rolling deploy**: replace one instance at a time, so for a while two app versions run side by side.
- **lock_timeout**: (PostgreSQL) how long a statement may wait to acquire a lock before giving up.

### Timeline of one column rename
~~~text
Release N   : schema has status + order_status(null) | app writes BOTH, reads status
Backfill    : UPDATE in batches of 5000 rows, sleep 100ms, watch replication lag
Release N+1 : app writes BOTH, reads order_status    (app N still works)
Release N+2 : app uses order_status only
Release N+3 : DROP COLUMN status                   (nobody reads it any more)
~~~
1. **Expand with a cheap operation**: adding a nullable column only changes metadata. Why: it avoids a rewrite and avoids a long lock.
2. **Dual-write before the backfill**: so rows created while the backfill is running are not missed.
3. **Backfill in batches with an {{IS NULL}} condition**: it can be re-run if interrupted; small batches keep each transaction short, hold locks briefly and do not lag the replicas. Example: 200 million rows at 5,000 rows per batch (~50 ms each) is about 40 thousand batches, a few hours running in the background.
4. **Switch reads to the new column** in a later release, once the backfill is done and you have verified that zero rows are NULL.
5. **Contract** only when you are sure no instance of the old release is left (including a rollback deployment).

### Example: renaming column {{status}} to {{order_status}}
~~~sql
-- 1. Expand: add the new column, WITHOUT NOT NULL (to avoid a table rewrite)
ALTER TABLE orders ADD COLUMN order_status varchar(32);

-- 2. Backfill in batches of a few thousand rows, with a condition so re-runs are safe
UPDATE orders SET order_status = status
WHERE id BETWEEN :from AND :to AND order_status IS NULL;

-- 3. Keep in sync: trigger or dual-write in the app during the transition
-- 4. Contract (a later release, once the old app version is gone):
ALTER TABLE orders DROP COLUMN status;
~~~

### Tips to avoid long locks on big tables
- **PostgreSQL 11+**: {{ADD COLUMN ... DEFAULT}} with a **non-volatile** default (a constant, not {{random()}}/{{clock_timestamp()}}) no longer rewrites the whole table (the default is stored in the catalog and old rows return it when read) – a safe default is possible.
- **MySQL 8.0.12+**: {{ALTER TABLE ... ADD COLUMN ..., ALGORITHM=INSTANT}} only changes metadata and finishes almost immediately (since 8.0.29 you can add the column at any position).
- **Creating an index**: {{CREATE INDEX CONCURRENTLY}} (PostgreSQL) takes longer but **does not lock writes**; it must run outside a transaction. MySQL 8 uses online DDL: {{ALTER TABLE ... ALGORITHM=INPLACE, LOCK=NONE}}.
- **Batched backfill** + rate limiting so you do not saturate I/O and do not inflate replication lag.
- **Do not add {{NOT NULL}} immediately** on a big table: add it nullable, backfill, then set NOT NULL (which also scans the table – check its cost first). A PostgreSQL 12+ trick: add {{CHECK (order_status IS NOT NULL) NOT VALID}}, run {{VALIDATE CONSTRAINT}} (a light lock that does not block writes), and then {{SET NOT NULL}} can reuse the validated CHECK without scanning the table again.

### Flyway vs Liquibase
| Criterion | Flyway | Liquibase |
|---|---|---|
| Format | Plain SQL files in resources | XML/YAML/JSON/SQL |
| Control | Versioned migration scripts (V1, V2…), checksums stored in {{flyway_schema_history}} | Changesets (id + author) in a changelog, checksums stored in {{DATABASECHANGELOG}} |
| Rollback | Free edition: write a "forward" migration to fix things; undo migrations are paid only | A rollback block inside the changeset (some commands can generate their rollback) |
| Fits | A clear SQL review process | Many environments, many schema variants |
| Strength | Simple, easy to review, easy to diff | Handles complex environment management |

Both run **before the app starts** (or via a separate init container / migration job in production).

### Pitfall production
- **Rolling deploy of several instances**: old and new apps exist **at the same time** ⇒ the schema must support both. That is why you cannot drop a column in the first release.
- Adding a {{NOT NULL}} column with a default on older MySQL **copies the whole table** and locks it for a long time.
- Temporary triggers syncing two columns can noticeably slow writes – remember to drop the trigger at the contract step.
- For extremely large tables consider specialised tooling: {{gh-ost}}, {{pt-online-schema-change}}, Vitess.

### Common mistakes
- **ALTER queued behind a long transaction**: the ALTER waits for ACCESS EXCLUSIVE, and **every SELECT that arrives afterwards queues behind the ALTER**. Symptom – the whole table "freezes" even though the ALTER itself is fast. Prevention: {{SET lock_timeout = '3s'}} before DDL and retry, and check that no long transactions are running.
- **{{CREATE INDEX CONCURRENTLY}} failing halfway**: it leaves an INVALID index that still slows writes. Prevention: check {{pg_index.indisvalid}}, drop and recreate; remember Flyway has to run this statement outside a transaction.
- **Merging expand and contract into one release**: symptom – "column does not exist" errors on old pods during the rollout. Prevention: split into at least two releases.
- **Editing a migration that already ran**: the checksum no longer matches and Flyway/Liquibase refuses to start. Prevention: never edit an applied migration; always add a new one.

### One-minute spoken answer
"I use expand/contract: add the new structure in a way that does not lock the table, let the app write both old and new, backfill in small batches, switch reads to the new column, and only drop the old column in a later release. The reason is that during a rolling deploy the old and new apps run at the same time, so the schema has to work for both. Mechanically, I avoid any table rewrite, use CREATE INDEX CONCURRENTLY or MySQL online DDL, and set lock_timeout so an ALTER does not block the whole table. Flyway is simple, plain SQL and easy to review; Liquibase is stronger when you need many databases and declarative rollback. My rule is to always rehearse the migration on a copy of real data and measure the time before production."

> Senior tip: treat the **migration script as code** and review it like code: never run it straight on production; it must be rehearsed on a dataset identical to production and measured. On tables with hundreds of millions of rows, the gap between "2 minutes on a 1-million-row staging" and "6 hours on production" is an everyday story. Also always prepare a **rollback** plan built on the old code still working with the new schema.`,
    follow: [
      'Why can ADD COLUMN NOT NULL DEFAULT lock the table for a long time on MySQL?',
      'When do you need {{CREATE INDEX CONCURRENTLY}} and what are its risks?'
    ],
  },
  'db-009': {
    q: `How do you choose between SQL and NoSQL? For Redis, MongoDB, Cassandra and Elasticsearch, which problem does each fit?`,
    a: `**Summary:** SQL (PostgreSQL/MySQL/Oracle) wins on **consistency, transactions, joins and a clear schema**; NoSQL wins on **horizontal scale, flexible schemas and low latency** for specific access patterns. The right question is not "SQL or NoSQL" but: **what data model, what query model and what consistency requirement does the problem have?**

### Quick intuition
Choosing a database is like **choosing a vehicle to move goods**. SQL is a truck with a compartmentalised bed and an accounting ledger: it carries anything, counts strictly (transactions, constraints) and answers any question you ask (joins, reports). Redis is a **delivery motorbike**: extremely fast for small items, but it carries little and is not a warehouse. MongoDB is a **carton packed per order**: each order is sealed in one box, and taking it out gives you everything. Cassandra is a **network of regional warehouses**: intake is extremely fast, but you can only look things up by warehouse code. Elasticsearch is a **keyword directory**: finding "red coat" takes an instant, but it is not where the goods are kept.

### Terms
- **ACID**: Atomicity, Consistency, Isolation, Durability – the four guarantees of a transaction.
- **Horizontal scale**: adding machines to increase capacity, instead of upgrading one machine (vertical scale).
- **Eventual consistency**: the copies will agree "after a while", not immediately.
- **Partition key** (Cassandra): the key that decides which node the data lives on; every efficient query must include it.
- **Tunable consistency**: Cassandra lets you choose, per query, how many replicas must acknowledge ({{ONE}}, {{QUORUM}}, {{ALL}}).
- **Inverted index**: a lookup table "word → list of documents containing it", the foundation of full-text search.
- **System of record**: the place that holds the "official" copy of the data; every other system is derived from it.
- **CDC (Change Data Capture)**: reading the DB change log (WAL/binlog) to push changes into another system, for example through Debezium.

### A typical architecture
~~~text
             writes          CDC (Debezium) / outbox
 App ----> [PostgreSQL] ----------> [Kafka] ----> [Elasticsearch]  (search, ~1-5s behind)
  |  many reads  ^                          +---> [Data warehouse] (reporting)
  +---> [Redis cache] (miss -> read PostgreSQL, TTL 5 minutes)
~~~
### How to decide, step by step
1. **List the main queries** before picking a database (e.g. "get an order by id", "a customer's orders in the last 30 days", "find products by keyword"). Why: NoSQL is designed around queries, and picking wrong means rewriting.
2. **Determine the consistency requirement**: money and stock need ACID → SQL; view counts and recommendations can tolerate delay → NoSQL is fine.
3. **Estimate the load**: 2,000 writes/s is something a well-tuned PostgreSQL can take; 200 thousand writes/s continuously across many regions is when you really need Cassandra.
4. **Pick the system of record** (usually SQL); the other systems are derived and receive data through CDC/outbox. Why: one single source of truth lets you rebuild a derived system when it breaks.
5. **Count the operational cost**: every added system means another backup, monitoring, upgrade path and on-call rotation.

### When to choose SQL
- Data with clear relations that needs multi-table transactions (money transfer, order + inventory).
- Ad-hoc queries, aggregate reporting, multi-table joins.
- ACID requirements are mandatory.
- Scale fits one instance (plus replicas).

### Each NoSQL type
| System | Model | Best for | Watch out |
|---|---|---|---|
| **Redis** | In-memory key-value | Cache, session, rate limiting, queues, distributed locks | Data lives in RAM, needs an eviction policy; should not be the only data source |
| **MongoDB** | JSON documents | Hierarchical data, catalogs, event logs, ever-changing schemas | Documents max 16MB; deep embedding bloats data |
| **Cassandra** | Wide-column, partition key | Write-heavy, multi-region, always available, time-series data | Queries must include the partition key; no ad-hoc queries; tunable consistency |
| **Elasticsearch** | Inverted index | Full-text search, suggestions, near-real-time search, aggregations | It is a **derived** system from the DB (near-real-time, duplicated data) |

### The common real-world pattern
Systems usually **combine**: PostgreSQL as the source of truth, Redis caching hot reads, Elasticsearch serving search, Kafka syncing and absorbing write load. Every copy step adds latency and the possibility of drift – make that explicit to stakeholders.

### How to answer in an interview
Start from **measurable constraints**:
1. Consistency requirement: are multi-table transactions needed?
2. Query model: by key, by range, or full-text?
3. Scale and write speed: how many reads/s and writes/s?
4. Legal requirements: where must data live, is erasure/anonymization needed (GDPR)?
5. Operations: who owns backup, failover, monitoring?

### Pitfall production
- Using Redis as the only source of truth without configuring persistence ⇒ data loss on restart.
- Querying Cassandra without the partition key ⇒ full table scans, extremely expensive.
- Elasticsearch synced via CDC lags by seconds – never make it the decision source.
- Feeding data into multiple systems without a sync process is the classic root of data inconsistency.
- "NoSQL only" is a form of fanaticism: most successful systems use both, each in its role.

### Common mistakes
- **Choosing MongoDB "because you do not need a schema"** and later needing joins and multi-document transactions. Symptom – the app does the joins itself and the data drifts. Prevention: if the data is strongly relational, use SQL; PostgreSQL {{JSONB}} already covers the flexible part.
- **A Redis cache with no TTL and no invalidation strategy**: symptom – users see yesterday's price for hours. Prevention: TTL + delete the key on write (cache-aside), and accept and document the delay.
- **Designing Cassandra tables the SQL way**: symptom – you end up using {{ALLOW FILTERING}}, queries are slow and they hammer the cluster. Prevention: one table per query, denormalize around the partition key.
- **Writing to the DB and Elasticsearch in the same request (dual-write)**: if one side fails, they stay out of sync forever. Prevention: write the DB, sync to ES through CDC/outbox, and keep a reindex job.

### One-minute spoken answer
"I do not choose by 'SQL or NoSQL' but by query model and consistency needs. For relational data that needs transactions, like money and orders, I pick PostgreSQL as the primary source of truth. I use Redis for cache, session and rate limiting – things we can afford to lose and rebuild. MongoDB suits self-contained documents read as a whole. Cassandra is for very high write volume, multiple regions, and queries that always go by partition key. Elasticsearch is for full-text search and is a derived copy synced through CDC. The trade-off is that each added system increases sync delay and operational cost. In my experience a well-tuned PostgreSQL carries more than most people expect, so I only add a new system when the numbers prove it is needed."

> Senior tip: never answer "we use PostgreSQL because it is powerful". A strong answer is: "we chose PostgreSQL because the business needs cross-table transactions and joins; full-text search is split into Elasticsearch so we do not hurt write latency; Redis only caches what we can afford to lose and rebuild". Every choice maps to a concrete constraint – that is the mindset of an engineer with 4–8 years of experience.`,
    follow: [
      'Why should Elasticsearch not be the source of truth?',
      'When is NoSQL actually better than SQL for a multi-tenant system?'
    ],
  },
});
