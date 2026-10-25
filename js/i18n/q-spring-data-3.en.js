/*
 * English translation of js/data/q-spring-data.js — task T175. Format: js/core/i18n.js (content overlay).
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

### B-tree structure
Leaf nodes hold keys + pointers to rows, and are linked into a **doubly linked list** ordered by key. That is why **range** queries ({{WHERE ts BETWEEN ...}}) are efficient too. A B-tree keeps all leaves at the same depth, optimized for disk (few block reads) – this is why MySQL/InnoDB uses a B+tree rather than the "plain" B-tree.

### Composite index and leftmost prefix
With index {{(a, b, c)}}:
| Query | Can use the index? |
|---|---|
| {{WHERE a = 1}} | Yes (uses column a) |
| {{WHERE a = 1 AND b = 2}} | Yes (uses a, b) |
| {{WHERE b = 2}} | **Usually not** – column a is missing (exception: skip scan in MySQL 8.0.13+ / PostgreSQL 18 when a has few distinct values) |
| {{WHERE a = 1 AND c = 3}} | Seek on a; c is only filtered within the index (cannot seek because b is missing) |
| {{ORDER BY a, b}} | Yes, no sort needed |

Design principle: the leading column should be the one **most frequently filtered on** and with **high selectivity**; the following columns are filters/sort keys ordered to match the query.

### Covering index
The index contains all columns the query needs ⇒ the DB reads only the index, not the table (index-only scan). On PostgreSQL 11+ use {{INCLUDE (col)}}; on MySQL/InnoDB an index that also carries extra columns becomes covering (a secondary index already contains the PK).

~~~sql
CREATE INDEX idx_order_cust_date ON orders (customer_id, created_at) INCLUDE (amount);
-- SELECT customer_id, created_at, amount ... -> answered from the index
~~~

### When an index is **not** used
1. **Function wrapped around the column**: {{WHERE DATE(created_at) = '2026-01-01'}} → the index on {{created_at}} cannot be used; fix by rewriting as a range ({{created_at >= '2026-01-01' AND created_at < '2026-01-02'}}) or by creating an index on the expression.
2. **Leading wildcard**: {{WHERE name LIKE '%abc'}} → the B-tree cannot be used.
3. **{{OR}} without an index covering** every branch.
4. **Low selectivity**: a column with 2–3 values (e.g. {{status}}) → few index values, the optimizer usually prefers a seq scan.
5. **Wrong data type**: comparing a {{varchar}} column to a number → the index is skipped (implicit cast).
6. **Stale statistics** → the optimizer mis-estimates and picks the wrong plan; run {{ANALYZE}}.
7. **Low-distinction column at the head of a composite index** → the leftmost prefix is not satisfied.
8. **Small table** (a few thousand rows) → a seq scan is cheaper.

### Pitfall production
- **Too many indexes slow down writes**: every {{INSERT}}/{{UPDATE}} must update every index of the table. Redundant indexes also grow backups and vacuum time.
- An index on a **low-cardinality** column in the leading position is almost useless.
- Indexes still used by no running query keep costing resources → review and drop them regularly.
- With UUID as PK, random write order fragments pages; use UUIDv7 or an increasing key.

> Senior tip: before adding an index, **measure** with {{EXPLAIN (ANALYZE, BUFFERS)}} against production-like data. A redundant index costs more than disk: it measurably slows {{UPDATE}} on a large transactional table. Principle: indexes are a trade-off, and every index needs a measurable reason.`,
    follow: [
      'Why is an index on a {{status}} column (just a few values) usually ignored by the optimizer?',
      'How does a covering index work on MySQL/InnoDB compared to PostgreSQL?'
    ],
  },
  'db-002': {
    q: `Which anomalies do SQL isolation levels prevent (dirty read, non-repeatable read, phantom)? How do MVCC in PostgreSQL and MySQL InnoDB differ?`,
    a: `**Summary:** Four standard isolation levels, increasingly strict: {{READ UNCOMMITTED}} → {{READ COMMITTED}} → {{REPEATABLE READ}} → {{SERIALIZABLE}}. Each level blocks one more anomaly. **PostgreSQL** defaults to {{READ COMMITTED}} with "statement-level" MVCC; **MySQL InnoDB** defaults to {{REPEATABLE READ}} with "transaction-level" MVCC (the read view is kept for the whole transaction).

### Isolation levels and anomalies
| Level | Dirty read | Non-repeatable read | Phantom read |
|---|---|---|---|
| READ UNCOMMITTED | Yes | Yes | Yes |
| READ COMMITTED | No | Yes | Yes |
| REPEATABLE READ | No | No | Yes (per SQL standard) |
| SERIALIZABLE | No | No | No |

- **Dirty read**: reading uncommitted data written by another transaction.
- **Non-repeatable read**: reading the same row twice in one transaction yields different values (someone else committed a change in between).
- **Phantom read**: one {{SELECT}} sees 5 rows, the next one sees 6 (new rows matching the predicate appeared).

### What is MVCC
Instead of locking the table while reading, MVCC keeps **multiple versions** of each row. Each transaction sees a consistent snapshot → reads do not block writes, writes do not block reads. Mechanism: version chain + {{xmin}}/{{xmax}} (PostgreSQL) or the undo log (InnoDB).

### PostgreSQL
- Default **READ COMMITTED**: each **statement** takes a fresh snapshot ⇒ two {{SELECT}} runs of the same query in one transaction can see different data.
- **REPEATABLE READ** in PostgreSQL = snapshot isolation fixed for the whole transaction: it prevents dirty reads, non-repeatable reads **and phantom reads** (stricter than the SQL standard requires). What it does **not** prevent is **write skew** (serialization anomaly) – only SERIALIZABLE does. If you write to a row that another transaction modified and committed, PostgreSQL reports {{could not serialize access due to concurrent update}}.
- At SERIALIZABLE, PostgreSQL uses SSI (serializable snapshot isolation) and may report {{could not serialize access}} → the client must retry.

### MySQL InnoDB
- Default **REPEATABLE READ**: the read view is created at the first statement and kept until the transaction ends ⇒ the same {{SELECT}} inside the transaction always returns the same result.
- At RR, InnoDB blocks phantoms for {{UPDATE}}/{{DELETE}} using **gap locks** and next-key locks – a frequent source of deadlocks.

### Pitfall production
- On PostgreSQL READ COMMITTED, {{UPDATE ... WHERE status = 'PENDING'}} may **update zero rows** if another party changed the status first (read-modify-write is not safe). Add the status predicate to the {{WHERE}} clause and check the number of updated rows.
- Reading a balance and then subtracting at READ COMMITTED is the classic race condition → use {{SELECT ... FOR UPDATE}} or optimistic locking.
- Higher isolation levels cost performance (more locks, more conflicts) and more deadlocks.
- Choosing isolation does not fix logic bugs: always design constraints at the database level (unique, check, foreign key) as the last line of defense.

> Senior tip: always set the **isolation level explicitly** in the application configuration instead of relying on DB defaults, because defaults differ between PostgreSQL and MySQL – the same code runs on both but behaves differently. Also prepare a **retry with backoff + jitter** mechanism for serialization/deadlock errors: it is the standard remedy for rare contention in PostgreSQL as well as CockroachDB.`,
    follow: [
      'Why does PostgreSQL REPEATABLE READ have no phantoms but still allows write skew?',
      'How does write skew happen and how do you handle it?'
    ],
  },
  'db-003': {
    q: `How do you read {{EXPLAIN ANALYZE}} and optimize a slow query step by step? Which signs in the execution plan point to the root cause?`,
    a: `**Summary:** {{EXPLAIN}} shows the **estimated** plan; {{EXPLAIN ANALYZE}} actually runs the query and returns the **actual** plan with per-node timings. The right optimization loop is: **measure baseline → read the plan → find the costly node → explain it with indexes/statistics/data → fix → measure again**, and repeat. The most important sign: **estimated row counts that diverge strongly from actual rows**.

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
2. **Locate the cost**: walk down from the root node, find the node with the largest time, do not stop at the first node.
3. **Find the cause**: missing index? stale stats? wrong join? skewed data distribution? badly written query?
4. **Fix**: add the right index, rewrite the query, change the table structure, reduce the scanned data.
5. **Measure again** and compare; repeat if the target is not met.

### Pitfall production
- Running {{EXPLAIN ANALYZE}} on a real {{UPDATE}}/{{DELETE}} actually executes the change → wrap it in {{BEGIN}} + {{ROLLBACK}}.
- Optimize based on **actual numbers**, not on how "pretty" the plan looks; an odd-looking plan can still be faster.
- An index that is added but never used still slows down writes.
- Check for **parameter sniffing**: a plan good for one parameter set can be terrible for another (PostgreSQL switches to a generic plan after 5 runs; MySQL has {{optimizer_switch}}).
- For scheduled queries, keep plan history over time to detect **plan regression** after a deploy.

> Senior tip: store {{EXPLAIN ANALYZE}} output of important queries in CI or monitor with {{pg_stat_statements}} / {{auto_explain}} to **catch plan regression before production**. A tiny change in an index or in statistics can make a query 100x slower without a single line of code changing.`,
    follow: [
      'What does the difference between the estimated and the actual plan tell you?',
      'Why is {{EXPLAIN ANALYZE}} on an {{UPDATE}} very dangerous?'
    ],
  },
  'db-004': {
    q: `What causes database deadlocks and how do you handle them? What would you do when a deadlock error appears in production?`,
    a: `**Summary:** A deadlock happens when two transactions each hold a lock the other needs, forming a wait cycle. The database detects the cycle (InnoDB checks as soon as a lock has to wait if {{innodb_deadlock_detect=ON}}; PostgreSQL checks after {{deadlock_timeout}}, 1s by default) and **rolls one transaction back** (the victim) to release resources; the other transaction proceeds. The client gets the error and **must retry** – this is normal behaviour, not a system incident.

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

- **Retry with backoff + jitter**: after a deadlock the transaction has rolled back → you must **start a new transaction** and run again. Use Spring Retry or a {{try-catch}} loop with randomized backoff.
- **Transactions must be short**: no external HTTP/SDK calls, no file processing inside the transaction.
- **Always have indexes** for every filter involved in locking ⇒ fewer locked rows.
- **Agree on a lock order** across all writers (e.g. always by ascending id).
- For job queues: {{SELECT ... FOR UPDATE SKIP LOCKED}} so workers do not wait on each other.

### Recognizing it in logs
- PostgreSQL: error {{deadlock detected}} with SQLSTATE **40P01**.
- MySQL: error **1213** ({{Deadlock found when trying to get lock}}).
- Both belong to SQLSTATE class **40** (transaction rollback): PostgreSQL deadlock is **40P01**, serialization failure ({{REPEATABLE READ}}/{{SERIALIZABLE}}) is **40001**; MySQL 1213 returns SQLSTATE **40001**. Retry logic therefore usually catches the whole class 40 (Spring translates them into {{PessimisticLockingFailureException}}/{{CannotAcquireLockException}}).

### Pitfall production
- **Wrong retry**: retrying within the same rolled-back transaction is meaningless – a new transaction is required.
- Retries without **jitter** make many clients retry at the same moment and recreate the deadlock.
- A deadlock caused by one "bad" piece of code keeps repeating: alert on **rate**, not just on logs, and investigate when the rate grows.
- PostgreSQL writes deadlock details to the server log ({{pg_stat_database.deadlocks}} is only a counter); MySQL: check {{SHOW ENGINE INNODB STATUS}} (section LATEST DETECTED DEADLOCK) or enable {{innodb_print_all_deadlocks}} to find which query caused it.

> Senior tip: a deadlock is **not a database bug** – it is the consequence of multiple transactions contending for resources in different orders. Treat it as a signal about your transaction design: your transaction is doing too much, locking in an unstable order, or scanning a table without an index. The goal is to reduce the deadlock **frequency**, not merely to "catch and retry".`,
    follow: [
      'Why must you retry using a new transaction after a deadlock?',
      'How do you avoid deadlocks when updating several related tables?'
    ],
  },
  'db-005': {
    q: `How do offset pagination and keyset (seek) pagination differ? With a table of tens of millions of rows, which one do you pick?`,
    a: `**Summary:** {{OFFSET n}} forces the DB to **read and skip n rows** first ⇒ the deeper the page, the slower (O(n²) total cost if the user scrolls through all pages). **Keyset (seek) pagination** uses a predicate on the sort columns: {{WHERE (created_at, id) < (:lastCreatedAt, :lastId)}} plus {{LIMIT}} ⇒ an index range scan with time that stays nearly **constant** regardless of page depth.

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
2. You need a perfect **tie-breaker** column like {{id}} – without it, rows with identical {{created_at}} can be skipped or repeated.
3. The cursor ({{created_at}} + {{id}} of the last row) must travel to the client as an encrypted token.
4. The query must be **order-stable** – add {{id}} to the {{ORDER BY}} to be sure.

### Keyset trade-offs
- No "jump to page 50" support – you must walk cursor by cursor.
- Counting total rows ({{COUNT}}) is also costly on large tables; cache the count or drop it entirely.
- When users want to sort by a different column, the cursor breaks ⇒ usually restrict the supported sort modes.

### When offset is still fine
- Small tables, a few thousand rows (offset costs little).
- Random "page N" access, or a total page count must be displayed.
- Batch exports run on a fixed schedule outside peak hours.

> Senior tip: for "load more" lists (infinite scroll) – feeds, order lists – keyset is the default choice, because users in practice only reach the first few pages, exactly where offset is most expensive. On tables with hundreds of millions of rows, switching from offset to keyset typically turns a multi-second response into under 50ms, provided an index matches the sort columns + tie-breaker.`,
    follow: [
      'Why is a tie-breaker column like {{id}} required for keyset pagination?',
      'How do you store the cursor safely when the client may tamper with its values?'
    ],
  },
  'db-006': {
    q: `How do replication, partitioning and sharding differ? How do you choose a shard key, and what problems will arise?`,
    a: `**Summary:** **Replication** copies data for read scaling / availability (one primary writes, replicas serve reads) – it solves read load, **not** write load. **Partitioning** splits one large table into partitions **within the same** instance – it improves manageability and maintenance, not horizontal scale. **Sharding** distributes data across independent **instances** – it scales writes too, at the price of operational complexity.

### Comparison
| Criterion | Replication | Partitioning | Sharding |
|---|---|---|---|
| Scope | Several copies of the data | Several partitions in 1 DB | Several independent DBs |
| Solves | Read load, HA | Managing big tables, fast vacuum/drop | Write and read load, capacity growth |
| Cross-unit queries | Easy (read from replica) | Easy if the partition key is present | Hard (scatter-gather) |
| Transactions | Native unit | Native unit | Needs Saga/2PC |
| Joins | Native unit | Native unit | Hard, usually requires denormalization |

### Partitioning
PostgreSQL supports declarative partitioning (range/list/hash) – queries filtering on the partition column get **partition pruning** (only relevant partitions are scanned). The biggest win: a huge history table split by month ⇒ old data is removed via {{DROP PARTITION}} instead of deleting millions of rows. MySQL 8 also has RANGE/LIST/HASH/KEY partitioning and pruning, but with tighter constraints: every unique key (including the PK) must contain the partition column, and partitioned tables do not support foreign keys. (PostgreSQL also requires unique constraints to contain the partition key.)

### Choosing the shard key
Criteria, in priority order:
1. **The vast majority of queries must include the shard key** – avoid far-reaching scatter-gather.
2. **Balanced load**: row counts and write frequency must be even across shards.
3. **Even growth** – sharding by time creates an "empty new shard" and skew over time.
4. **Avoid hot shards**: one huge customer or one viral product easily creates a hot spot.

A real-world example: shard by {{tenant_id}} or {{customer_id}} for multi-tenant systems; shard by {{order_id}} (hash range) for a transaction table with no customer-based queries.

### Problems you must solve when sharding
- **Cross-shard consistency**: use a Saga (compensating actions chain) instead of 2PC; accept eventual consistency.
- **Global queries**: feed data into a search engine/OLAP store, or design reads from a read-only copy.
- **Resharding**: needs double-write, backfill, then a traffic cutover.
- **Globally unique IDs**: snowflake, UUIDv7, or allocating id ranges from a central service.
- **Total count queries** are very expensive because they must fan out.

### Pitfall production
- Picking a shard key because it is "easy to split" while ignoring the real queries is the most common reason sharded systems get rewritten.
- **Resharding** during peak traffic is a standalone project: it needs a plan and tooling (double-write + backfill + cutover).
- A read replica has **replication lag**: a read right after a write may not see the data ⇒ implement "read-your-writes" by reading the primary or using sticky routing.
- Sharding does not magically improve performance if every query must fan out.

> Senior tip: before sharding, walk this ladder: **optimize indexes and queries → read from replicas → partition → cache → and only then shard**. Sharding is an almost irreversible decision: it affects every query, every transaction and even the organization. In banking systems, sharding by **branch/tenant** often matches the business boundary and also satisfies data-residency requirements.`,
    follow: [
      'Why does replication lag cause the "read does not see the just-written data" problem?',
      'Compare Saga and 2PC for transactions spanning multiple shards?'
    ],
  },
  'db-007': {
    q: `HikariCP connection pool: how do you size it, what are the important timeouts, and how do you detect leaking connections (leak detection)?`,
    a: `**Summary:** HikariCP is the default pool in Spring Boot. Sizing principle: **an application's connections must never exceed what the DB can serve**; the total connections across the whole system must stay below the DB's {{max_connections}}. Practical rule: a pool of about **10–20** per instance, and **much smaller** with virtual threads.

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

> Senior tip: the most important pool metrics are **wait time** and **pending connections**. If pending > 0 regularly, do not raise the pool size right away – find the slow query holding transactions open, because enlarging the pool only moves the bottleneck from the app down to the DB. Only if DB CPU stays under 50% while still slow does it become reasonable to raise the pool.`,
    follow: [
      'How do you detect connection leaks in production?',
      'Why should virtual threads not be paired with a large connection pool?'
    ],
  },
  'db-008': {
    q: `How do you change the schema of a table with hundreds of millions of rows without downtime? Compare expand/contract with Flyway and Liquibase.`,
    a: `**Summary:** The principle is **expand/contract** (widen first, narrow later) so every running version of the application keeps working throughout the deployment. Steps: (1) **Expand** – add the new column as **nullable** or with a cheap default; (2) **Backfill** data in small batches; (3) **Migrate** – the code reads/writes both old and new columns; (4) **Contract** – drop the old column in a later release, once no old version is running anymore.

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
- **PostgreSQL 11+**: {{ADD COLUMN ... DEFAULT}} no longer rewrites the whole table (it stores the default in metadata and materializes it lazily on read) – a safe default is possible.
- **Creating an index**: {{CREATE INDEX CONCURRENTLY}} (PostgreSQL) takes longer but **does not lock writes**; it must run outside a transaction. MySQL 8 uses online DDL: {{ALTER TABLE ... ALGORITHM=INPLACE, LOCK=NONE}}.
- **Batched backfill** + rate limiting so you do not saturate I/O and do not inflate replication lag.
- **Do not add {{NOT NULL}} immediately** on a big table: add nullable, backfill, then set NOT NULL (this also requires a table scan – check its cost first).

### Flyway vs Liquibase
| Criterion | Flyway | Liquibase |
|---|---|---|
| Format | Plain SQL files in resources | XML/YAML/JSON/SQL |
| Control | Versioned patch scripts | Snapshot/changelog with checksums |
| Rollback | Manual rollback scripts | Declares declarative rollback |
| Fits | A clear SQL review process | Many environments, many schema variants |
| Strength | Simple, easy to review, easy diff | Handles complex environment management |

Both run **before the app starts** (or via a separate init container / migration job in production).

### Pitfall production
- **Rolling deploy of several instances**: old and new apps exist **at the same time** ⇒ the schema must support both. That is why you cannot drop a column in the first release.
- Adding a {{NOT NULL}} column with a default on older MySQL **copies the whole table** and locks it for a long time.
- Temporary triggers syncing 2 columns can noticeably slow writes – remember to drop the trigger at the contract step.
- For extremely large tables consider specialized tooling: {{gh-ost}}, {{pt-online-schema-change}}, Vitess.

> Senior tip: treat the **migration script as code** and review it like code: never run it straight on production; it must be rehearsed on a dataset identical to production and measured. On tables with hundreds of millions of rows, the gap between "2 minutes on a 1-million-row staging" and "6 hours on production" is an everyday story. Also always prepare a **rollback** plan built on the old code still working with the new schema.`,
    follow: [
      'Why can ADD COLUMN NOT NULL DEFAULT lock the table for a long time on MySQL?',
      'When do you need {{CREATE INDEX CONCURRENTLY}} and what are its risks?'
    ],
  },
  'db-009': {
    q: `How do you choose between SQL and NoSQL? For Redis, MongoDB, Cassandra and Elasticsearch, which problem does each fit?`,
    a: `**Summary:** SQL (PostgreSQL/MySQL/Oracle) wins on **consistency, transactions, joins and a clear schema**; NoSQL wins on **horizontal scale, flexible schemas and low latency** for specific access patterns. The right question is not "SQL or NoSQL" but: **what data model, what query model and what consistency requirement does the problem have?**

### When to choose SQL
- Data with clear relations, needing multi-table transactions (money transfer, order + inventory).
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

> Senior tip: never answer "we use PostgreSQL because it is powerful". A strong answer is: "we chose PostgreSQL because the business needs cross-table transactions and joins; full-text search is split into Elasticsearch so we do not hurt write latency; Redis only caches what we can afford to lose and rebuild". Every choice maps to a concrete constraint – that is the mindset of an engineer with 4–8 years of experience.`,
    follow: [
      'Why should Elasticsearch not be the source of truth?',
      'When is NoSQL actually better than SQL for a multi-tenant system?'
    ],
  },
});
