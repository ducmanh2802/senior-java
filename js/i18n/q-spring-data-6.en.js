/*
 * English translation of js/data/q-spring-data.js — task T178. Format: js/core/i18n.js (content overlay).
 * ids: jpa-018 jpa-019 jpa-020 jpa-021 db-012 db-013 db-014 db-015
 */
App.i18n.content({
  'jpa-018': {
    q: 'JPA, Hibernate and Spring Data JPA: what is the relationship between the three, and what is each one responsible for?',
    a: `**Summary:** The three are **three different layers**. **JPA (Jakarta Persistence)** is the **specification (interface)** – it defines the API ({{EntityManager}}, {{Entity}}, {{@Entity}}, {{@Table}}, JPQL, Criteria API). **Hibernate** is the most widely used JPA **provider (implementation)** – it fully implements JPA and adds its own features ({{@Filter}}, {{@BatchSize}}, Envers, custom type, L2 cache). **Spring Data JPA** is the **layer above** – it generates repository interfaces, derived query methods, {{@Query}}, paging, auditing – and it **uses Hibernate as the default provider**.

### The relationship
~~~text
Spring Data JPA (Repository abstraction)
       │
       ▼
Hibernate (JPA Provider + extensions)
       │
       ▼
JPA Spec (Jakarta Persistence API)
~~~

### Who does what
| Layer | Responsibility | Example |
|---|---|---|
| **JPA Spec** | Defines annotations, interfaces, JPQL | {{@Entity}}, {{EntityManager}}, {{@NamedQuery}} |
| **Hibernate** | Implements JPA, manages session, cache, SQL generation | {{Session}}, {{HibernateCriteriaBuilder}}, {{@BatchSize}}, Envers |
| **Spring Data JPA** | Removes boilerplate, repository interface, query derivation | {{JpaRepository}}, {{findByNameLike}}, {{@Query}}, {{Pageable}} |

### When to use which
- **JPA API directly** ({{EntityManager}}): you need fine-grained control (flush, clear, lock mode, complex native queries).
- **Hibernate API** ({{Session}}, {{StatelessSession}}): you need Hibernate-only features ({{@Filter}}, {{@Formula}}, Envers, custom type).
- **Spring Data JPA** ({{JpaRepository}}): 90% of cases are CRUD and ordinary queries – shorter code, easier tests.

### Production pitfalls
- Calling {{entityManager.unwrap(Session.class)}} to reach the Hibernate API – this ties the code tightly to Hibernate and makes switching provider later hard.
- Using Spring Data JPA without understanding what SQL JPQL/Hibernate generates ⇒ N+1, slow queries, wrong fetch plans.
- Spring Data JPA does **not** replace Hibernate – it is a wrapper. Only by understanding Hibernate can you debug performance incidents.

> Senior tip: in an interview, a good answer is: "JPA is the interface, Hibernate is the implementation, Spring Data JPA is the repository abstraction that uses Hibernate. I mostly write Spring Data JPA, but when I need to tune performance I use {{EntityManager}} or the Hibernate {{Session}} directly, and I always read the generated SQL with {{show-sql}} or {{p6spy}}."`,
    follow: [
      'Can Spring Data JPA run on a provider other than Hibernate (e.g. EclipseLink)?',
      'Why is Spring Data JPA called an "abstraction" rather than an "implementation"?'
    ]
  },
  'jpa-019': {
    q: 'How do {{save}}, {{saveAndFlush}}, {{persist}} and {{merge}} differ? What is the difference between {{findById}} and {{getReferenceById}}?',
    a: `**Summary:** These are the five methods that confuse many developers. {{save}} (Spring Data) = {{persist}} when the entity is new (null id) or {{merge}} when it already has an id – **it always returns a managed entity**. {{saveAndFlush}} = {{save}} + {{flush}} immediately. {{persist}} (JPA) is only for **new (transient)** entities and throws an exception if the id already exists. {{merge}} (JPA) copies the state from a detached entity onto a managed instance – **returns the copy**, while the original entity stays detached. {{findById}} returns an {{Optional}} and **loads immediately** (SELECT). {{getReferenceById}} returns a **proxy** (no DB query) – use it when you only need to set the FK and do not need the entity data.

### Detailed comparison
| Method | Origin | New entity (transient) | Entity already having an id (detached) | Returns | Flush |
|---|---|---|---|---|---|
| {{save}} | Spring Data | persist | merge | Managed entity | No (transaction-dependent) |
| {{saveAndFlush}} | Spring Data | persist + flush | merge + flush | Managed entity | **Yes** (immediately) |
| {{persist}} | JPA | **OK** | **Error** (EntityExistsException) | void | No |
| {{merge}} | JPA | persist (treated as new) | **Copies state -> managed copy** | **Managed copy** | No |

### {{findById}} vs {{getReferenceById}}
~~~java
// findById: SELECT * FROM ... WHERE id = ? -> returns Optional<Entity>
Optional<Order> opt = orderRepo.findById(id);  // loads immediately, may return Optional.empty()

// getReferenceById: NO DB query, returns a proxy (id only)
Order ref = orderRepo.getReferenceById(id);    // throws EntityNotFoundException when the proxy is USED (a method is called)
~~~
- Use {{getReferenceById}} when you **only need to set a foreign key** (e.g. {{item.setOrder(orderRepo.getReferenceById(orderId))}}) – it saves one SELECT query.
- The proxy only queries the DB (and throws an exception if the row does not exist) **when it is initialized** – that is when a getter other than {{getId()}} is called, not when the proxy is returned.

### Production pitfalls
- **{{save}} on a detached entity that has an id** -> calls {{merge}} -> creates a copy -> the original entity is no longer updated -> the "saved but the changes never show up" bug.
- **{{merge}} returns a copy** – if you keep a reference to the original entity and keep editing it, those changes will **not** be saved.
- **{{getReferenceById}} used in the wrong place** (when the data must actually be read) -> throws an exception while rendering the view / serializing JSON.
- {{saveAndFlush}} is used to obtain a generated id right away (e.g. IDENTITY) – but with IDENTITY {{save}} already executes the INSERT to fetch the id (even without flushing the other changes).

> Senior tip: simple rule: **use {{save}} by default** (Spring Data). Only use {{saveAndFlush}} when you need the generated id immediately or need to see constraint violations right away. Do not use {{persist}}/{{merge}} directly unless you are writing a custom repository. For FKs, use {{getReferenceById}} to avoid a redundant SELECT.`,
    follow: [
      'Why does {{merge}} return a copy instead of updating the original entity?',
      'When does {{getReferenceById}} throw an exception, and what type of exception is it?'
    ]
  },
  'jpa-020': {
    q: 'The CascadeType variants (PERSIST, MERGE, REMOVE, REFRESH, DETACH, ALL) and the REMOVE trap on ManyToMany. What are the default FetchType values of @OneToMany, @ManyToOne, @OneToOne and @ManyToMany?',
    a: `**Summary:** {{CascadeType}} decides which operation on a parent entity is **propagated** down to child entities. {{FetchType}} decides whether a relationship is loaded **EAGER** (immediately) or **LAZY** (on access). Defaults: {{@ManyToOne}} and {{@OneToOne}} are **EAGER**; {{@OneToMany}} and {{@ManyToMany}} are **LAZY**. The biggest trap: {{cascade = REMOVE}} on {{@ManyToMany}} deletes child entities that are referenced by many parents – data loss.

### CascadeType
| Cascade | When the parent is persisted/merged/removed/refreshed/detached, the child... |
|---|---|
| {{PERSIST}} | Is persisted too |
| {{MERGE}} | Is merged too |
| {{REMOVE}} | **Is deleted too** (dangerous!) |
| {{REFRESH}} | Is refreshed too |
| {{DETACH}} | Is detached too |
| {{ALL}} | All of the above |

### Default FetchType
| Relationship | Default | Recommended |
|---|---|---|
| {{@ManyToOne}} | **EAGER** | Always set {{fetch = FetchType.LAZY}} explicitly |
| {{@OneToOne}} | **EAGER** | Set LAZY on the owning side (the one holding the FK); on the {{mappedBy}} side LAZY usually has no effect – use {{@MapsId}} or map only one direction |
| {{@OneToMany}} | **LAZY** | Keep LAZY, use {{@BatchSize}} |
| {{@ManyToMany}} | **LAZY** | Keep LAZY |

### The REMOVE trap on ManyToMany
~~~java
@Entity
public class Student {
    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.REMOVE})  // WRONG!
    @JoinTable(name = "student_course",
        joinColumns = @JoinColumn(name = "student_id"),
        inverseJoinColumns = @JoinColumn(name = "course_id"))
    private Set<Course> courses = new HashSet<>();
}
~~~
When you delete a {{Student}}, Hibernate will **try to delete the {{Course}} entities in the collection as well** – even though the {{Course}} is still referenced by other {{Student}}s: at best you get an FK violation on the join table, at worst you lose shared data (if the FK has ON DELETE CASCADE)! The correct behavior is to delete only the relationship (remove rows from the join table), not the child entities.

### The right way
- **Never** use {{CascadeType.REMOVE}} on {{@ManyToMany}}.
- To delete a relationship: call {{student.getCourses().clear()}} on the **owning side** – Hibernate deletes the join table rows itself ({{@ManyToMany}} does not support {{orphanRemoval}}).
- With {{@OneToMany}} (parent owns its children): {{orphanRemoval = true}} is safe because a child belongs to exactly one parent.

### Production pitfalls
- The default EAGER of {{@ManyToOne}}/{{@OneToOne}} is the number one cause of "hidden" N+1 – always override it to LAZY.
- {{cascade = ALL}} on a relationship with many parents (ManyToMany, or ManyToOne sharing the same child entity) causes cascading deletes or duplicate merges.
- {{@OneToOne}} LAZY works fine on the **owning side** (the FK value tells you whether it is null or not). On the **{{mappedBy}} side** the table has no FK, so Hibernate must query to know whether a row exists ⇒ it still loads immediately; solutions: {{@MapsId}} (shared PK), bytecode enhancement, or map only one direction.

> Senior tip: during review, scrutinize every {{@ManyToOne}} and {{@OneToOne}}: if there is no {{fetch = FetchType.LAZY}} it is a latent bug. With {{cascade}}, use only {{PERSIST}} and {{MERGE}} for aggregate roots; use {{REMOVE}} only for true ownership relationships (OneToMany with orphanRemoval).`,
    follow: [
      'Why does the default EAGER of @OneToOne cause more N+1 than @ManyToOne?',
      'When should CascadeType.DETACH be used?'
    ]
  },
  'jpa-021': {
    q: 'Derived query method, {{@Query}} JPQL vs native SQL, and paging with {{Pageable}} – how is the count query generated?',
    a: `**Summary:** Spring Data JPA offers three ways to write queries: **derived method** (conventional method name -> JPQL), **{{@Query}} JPQL** (type-safe, DTO projection), **native SQL** (to exploit DB-specific features). With {{Pageable}}, Spring Data generates **two queries**: a data query (with LIMIT/OFFSET) and a **count** query ({{SELECT count(*)}}) – the count query has **no** ORDER BY but **keeps WHERE/JOIN**.

### Three ways to write queries
| Approach | Example | Pros | Cons |
|---|---|---|---|
| Derived method | {{List<Order> findByCustomerIdAndStatus(Long customerId, OrderStatus status);}} | No JPQL to write, validated at startup (a wrong field name means the app does not start) | Long method names, hard to read when complex |
| {{@Query}} JPQL | {{@Query("select o from Order o where o.customer.id = :cid and o.status = :st")}} | DTO projection, join fetch, flexible | Standard JPQL is limited; Hibernate 6's HQL already has window functions and CTEs but still does not cover all of SQL |
| Native SQL | {{@Query(value = "select * from orders where customer_id = ?1", nativeQuery = true)}} | Full SQL power, DB-specific hints | Loses type-safety, locked to a dialect |

### Derived method – common keywords
| Keyword | Generated JPQL |
|---|---|
| {{findBy...}} | {{WHERE ... = ?}} |
| {{findBy...Like}} | {{WHERE ... LIKE ?}} |
| {{findBy...Between}} | {{WHERE ... BETWEEN ? AND ?}} |
| {{findBy...In}} | {{WHERE ... IN ?}} |
| {{findBy...IsNull / IsNotNull}} | {{WHERE ... IS NULL}} |
| {{findTop10By...}} | {{LIMIT 10}} |
| {{findFirstBy...}} | {{LIMIT 1}} |

### Pageable and the count query
~~~java
Page<Order> findByCustomerId(Long customerId, Pageable pageable);
~~~
When you call {{repo.findByCustomerId(1L, PageRequest.of(0, 20))}}, Spring Data generates:
1. **Data query**: {{SELECT * FROM orders WHERE customer_id = 1 LIMIT 20 OFFSET 0}} (ORDER BY only appears when the {{Pageable}} carries a {{Sort}} – without a sort, row order across pages is not guaranteed)
2. **Count query**: {{SELECT count(*) FROM orders WHERE customer_id = 1}} (no ORDER BY, no LIMIT)

### Optimizing the count query
- On large tables the count query is slow. Ways to reduce the load:
  - Use {{Slice}} instead of {{Page}}: it only returns {{hasNext}} and **does not run the count query**.
  - {{@Query(value = "...", countQuery = "select count(o) from Order o where o.customerId = :cid")}}: customize the count query so it is leaner (dropping join/fetch does not change the row count). The filter conditions must be **identical** to those of the data query, otherwise the total number of pages will be wrong.
  - Cache the count in Redis (short TTL) for reports that do not need to be real-time.

### Production pitfalls
- Derived method names become too long -> hard to maintain; refactoring the entity breaks the method names.
- {{@Query}} JPQL with {{LEFT JOIN FETCH}} + {{Pageable}} -> in-memory pagination error (see warning HHH90003004).
- Native query + {{Pageable}}: Spring Data still adds LIMIT/OFFSET, but deriving a count query from complex SQL is error-prone – declare {{countQuery}} explicitly; the {{Sort}} must use the real column names.
- The count query inherits JOINs from the data query -> if the data query joins many tables, so does the count query -> slow. Write a custom countQuery when needed.

> Senior tip: for paginated list APIs, **use {{Slice}} by default** (returns hasNext, no count) – noticeably faster on large tables. Only use {{Page}} when the UI genuinely needs "page 5/120".`,
    follow: [
      'Why does the count query have no ORDER BY?',
      'When should you write a custom countQuery for @Query?'
    ]
  },
  'db-012': {
    q: 'PostgreSQL uses MVCC: when an {{UPDATE}} creates a new row version, what happens to the old data? How are VACUUM, bloat and transaction ID wraparound related to each other, and how do long transactions cause harm?',
    a: `**Summary:** In PostgreSQL's MVCC every row carries {{xmin}} (the transaction id that created it) and {{xmax}} (the transaction id that deleted/updated it). Each {{UPDATE}} creates **a new tuple** and marks the old tuple with {{xmax}} – the old data is **not deleted right away**, it becomes a **dead tuple** and is only cleaned up when {{VACUUM}} runs. Accumulating dead tuples produce **bloat**. Meanwhile, transaction ids are 32-bit (~4.3 billion); if the cycle is about to run out while old tuples are still not "frozen", **wraparound** happens and PostgreSQL can **refuse to accept writes**. **Long transactions are the culprit behind both**.

### How tuple versioning works
~~~sql
-- Initial state
BEGIN;                        -- xid = 100
UPDATE account SET balance = 200 WHERE id = 1;
-- result: new tuple (xmin=100, xmax=0), old tuple (xmin=90, xmax=100)

-- Another transaction reads
BEGIN;                        -- its snapshot will not see the old tuple
SELECT balance FROM account WHERE id = 1;   -- 200
COMMIT;

~~~
The version chain is linked by {{xmin}}/{{xmax}}. Reads do not block writes and writes do not block reads – that is MVCC's great advantage. The price is **dead tuples** and **bloat**.

### What VACUUM does
| Command | Effect | Risk |
|---|---|---|
| {{VACUUM}} | Cleans dead tuples, updates the free space map, freezes old enough tuples | Does not return space to the OS; cheap |
| {{VACUUM FULL}} | Rewrites the whole table into a new file, shrinks the file | Takes an **ACCESS EXCLUSIVE** lock, blocks every query |
| {{ANALYZE}} | Updates statistics for the optimizer | Very cheap, should run often |

- Regular {{VACUUM}} (not FULL) does **not** release disk space to the operating system; it only marks free space so the next write can reuse it.
- {{VACUUM}} does delete dead entries from indexes, but it does **not** merge pages or shrink indexes ⇒ a bloated index stays large; you need {{REINDEX CONCURRENTLY}} for severely bloated indexes.

### Bloat and autovacuum
Autovacuum kicks in when the dead tuple count exceeds {{autovacuum_vacuum_threshold}} (default 50) plus {{autovacuum_vacuum_scale_factor}} (default 0.2) times the number of rows in the table.
- For a table with **1 billion rows** the threshold is 200 million dead tuples before autovacuum runs ⇒ enormous bloat and queries getting slower over weeks.
- The standard fix: set the parameters **per table** for large tables:
~~~sql
ALTER TABLE transaction_log SET (
    autovacuum_vacuum_scale_factor = 0.02,
    autovacuum_vacuum_threshold  = 1000,
    autovacuum_analyze_scale_factor = 0.01

);
~~~
- Measuring bloat: {{pg_stat_user_tables.n_dead_tup}} (an estimate), or the {{pgstattuple}} extension; a running vacuum process can be seen in {{pg_stat_progress_vacuum}}.

### Transaction ID wraparound
- Transaction ids are 32-bit (~4.29 billion values) and compared circularly, so at any point in time only ~2.1 billion xids count as "in the past". On a write-heavy system you can hit the limit in weeks to months if nothing gets frozen.
- That is why VACUUM **freezes** old enough tuples: it marks the tuple as frozen (a flag in the tuple header) so it counts as "older than every transaction" and {{xmin}} no longer needs to be compared.
- The parameter {{autovacuum_freeze_max_age}} (default 200 million) decides when freezing becomes mandatory, guaranteeing headroom before wraparound.
- **Danger**: if a transaction still holds an old {{xmin}}, old tuples cannot be frozen, wraparound creeps closer, and PostgreSQL may refuse every write to avoid data loss.

### How long transactions cause harm
1. **Hold an old snapshot** ⇒ dead tuples cannot be cleaned ⇒ bloat accumulates fastest during heavy update/delete workloads.
2. **Hold an old xmin** ⇒ blocks freezing ⇒ pushes wraparound closer ⇒ risk of the DB refusing writes.
3. **Hold locks** ⇒ block all DDL on that table; worse, a DDL waiting for the lock blocks every query queued behind it.
4. **Consume connections** in the application pool ⇒ lower throughput across the whole system.
5. The most common culprit is **{{idle in transaction}}** – the connection has already returned its result but the transaction has not committed.

How to prevent it:
~~~sql
-- Set at the session/app level
SET idle_in_transaction_session_timeout = '60s';
SET statement_timeout = '30s';
SET lock_timeout = '5s';
~~~
({{transaction_timeout}} appeared in PostgreSQL 17 to cap the duration of the whole transaction.)

### Production pitfalls
- **Turning autovacuum off** to "avoid disruption" is a very common mistake: the table bloats badly, and the final anti-wraparound vacuum will still be forced in at the worst possible moment.
- **Index bloat** is not shrunk by {{VACUUM}}; you must {{REINDEX CONCURRENTLY}} (runs outside a transaction) on a schedule.
- **Fast-growing tables**: for append-only tables, partition by time so old data is removed by {{DROP TABLE}} of a partition (or DETACH then DROP) instead of {{DELETE}}-ing millions of rows.
- **Temp tables**: autovacuum cannot handle temp tables; with a connection pool sessions almost never end, so temp tables never get dropped, accumulate dead tuples and hold on to XID age – always drop them (or use {{ON COMMIT DROP}}).

> Senior tip: track the **dead tuple ratio and transaction age** as two daily metrics. In practice, most "mysteriously slow database" incidents can be traced back to one or more sessions stuck {{idle in transaction}}. A simple monitoring query – {{SELECT count(*) FROM pg_stat_activity WHERE state = 'idle in transaction'}} – can save you from a serious incident.`,
    follow: [
      'Why doesn\'t {{VACUUM}} release disk space to the operating system?',
      'What consequences can a transaction running for 3 hours have for the whole system?'
    ]
  },
  'db-013': {
    q: 'PostgreSQL has many index types: B-tree, partial, expression, GIN, BRIN. What problem does each one solve, when can the optimizer not use them, and which would you choose for a huge transactional log table?',
    a: `**Summary:** B-tree is the default and handles equality, range and {{ORDER BY}} well. The other index types do things B-tree cannot: a **partial index** indexes only part of the data (small, cheap, fits a "pending" state); an **expression index** indexes an **expression**, so the query must be written with **exactly that expression**; **GIN** is an inverted index for JSONB, arrays and full-text; **BRIN** is a tiny index based on **physical correlation**, meant for append-only tables that grow over time. The key point to remember: **the optimizer can only use an index when it can prove the query condition implies the index condition**.

### Index types
| Type | Used for | Notes |
|---|---|---|
| B-tree | Equality, range, {{ORDER BY}}, prefix | Default, general purpose |
| Partial | Queries with a fixed condition | Small and cheap, but the condition must match |
| Expression | Function/expression over a column | The query must use the exact expression |
| GIN | JSONB, array, full-text | Writes (insert/update) noticeably slower |
| BRIN | Data increasing over time | Extremely small, but needs high correlation |
| GiST / SP-GiST | Geometry, range type, nearest neighbour | For PostGIS, {{pg_trgm}}, {{cube}} |

### Partial index
~~~sql
CREATE INDEX idx_orders_pending ON orders (created_at)
WHERE status = 'PENDING';
~~~
- The index only holds rows with {{status = 'PENDING'}} ⇒ much smaller, cheaper to update, and the index scan returns far fewer useless rows.
- **The planner must be able to derive the index condition from the query.** With {{WHERE status = 'PENDING'}} it works; with {{WHERE status = ?}} the planner may be unable to prove it and will **not use** the index.
- Partial indexes also solve the unique constraint problem under soft delete: {{CREATE UNIQUE INDEX uq_customer_email ON customer (email) WHERE deleted_at IS NULL}}.

### Expression index
~~~sql
CREATE INDEX idx_cust_lower_email ON customers (lower(email));
CREATE INDEX idx_order_day ON orders (date_trunc('day', created_at));
CREATE INDEX idx_payload_order ON orders ((payload->>'orderId'));
~~~
- The query **must use the exact expression** for the index to be chosen: {{WHERE lower(email) = ?}}. Written as {{WHERE email = lower(?)}} the index is not used.
- Very useful when a JSONB column needs frequent lookups on one specific key – much faster than a GIN index over the whole document.

### GIN
~~~sql
CREATE INDEX idx_order_payload ON orders USING gin (payload jsonb_path_ops);
CREATE INDEX idx_doc_fts ON documents USING gin (to_tsvector('simple', body));
~~~
- For JSONB the {{jsonb_path_ops}} variant is smaller and faster for the {{@>}} operator, but it does **not** support the key-existence operator.
- Full-text: it is usually better to maintain a separate {{tsvector}} column (generated column or trigger) rather than indexing the expression directly – the query does not have to repeat the exact expression, and recheck does not have to recompute {{to_tsvector}}.
- **Trade-off**: GIN (with {{fastupdate}} enabled, the default) has a **pending list** – new entries go into a waiting list and are only merged into the main index when {{VACUUM}}/autoanalyze runs, when the list exceeds {{gin_pending_list_limit}} (default 4MB), or when {{gin_clean_pending_list()}} is called.

### BRIN – the choice for huge log tables
~~~sql
CREATE INDEX idx_log_created_brin ON transaction_log USING brin (created_at)
    WITH (pages_per_range = 32);
~~~
- BRIN stores a **min/max summary per page range** (128 pages by default, i.e. about 1MB) instead of storing every value ⇒ the index is only a few KB even for a table with millions of rows.
- The prerequisite: values must be **correlated with physical row order**. An append-only table with increasing {{created_at}} is the ideal case; randomly written data makes BRIN **unusable**.

### When the optimizer does **not** use an index
1. The query condition does not imply the partial index's condition.
2. The query uses a different expression from the one in the expression index.
3. Small table: a seq scan is cheaper.
4. The column has **low selectivity** (only 2-3 distinct values).
5. **Stale statistics** → wrong row estimates ⇒ the planner picks the wrong plan. Run {{ANALYZE}}.
6. The index is **bloated**, so the planner estimates its cost as too high.

### Production pitfalls
- **Redundant indexes slow writes down**: every index must be maintained on {{INSERT}}/{{UPDATE}}/{{DELETE}}. With GIN over JSONB the cost is far higher.
- Finding unused indexes: {{SELECT relname, indexrelname, idx_scan FROM pg_stat_user_indexes WHERE idx_scan = 0;}} – but be careful, an index may only get used when an incident happens.
- A **single index on a low-cardinality column** (low cardinality, e.g. a boolean) is nearly useless – unless you use a partial index for the rare value.
- With a **random UUID** as primary key, the B-tree gets fragmented ⇒ write latency grows. Use UUIDv7 or an incrementing key.
- **GIN index + missed vacuum** ⇒ the pending list grows ⇒ queries get gradually slower with no clear warning. Monitor {{pgstatginindex}} and tune autovacuum for those tables.

> Senior tip: when picking an index type, start from **the shape of the data and the actual query**. Three commonly overlooked findings: huge log tables often do **not** need B-tree – BRIN is enough and hundreds of times cheaper; JSONB lookups on **one specific key** are usually served better by an expression index; a partial index on a business status saves a lot of I/O.`,
    follow: [
      'Why is a partial index often not used when the query uses a parameter instead of a literal value?',
      'When is BRIN a better choice than B-tree for a transactional table?'
    ]
  },
  'db-014': {
    q: 'Your transaction table has 800 million rows and you want to split it by month, deleting old data by dropping partitions. How does partition pruning work, how do you manage partitions day to day, and which PostgreSQL constraints might force you to redesign your primary key?',
    a: `**Summary:** Partitioning by time range is the classic answer for a large transactional table: data is split by {{RANGE}} on a time column, each partition being a child table. When a query has a condition on the partition column, the planner **prunes** – it drops the unrelated partitions entirely. The biggest benefit is not read speed but **deleting old data almost instantly** with {{DROP TABLE partition}} instead of {{DELETE}}-ing tens of millions of rows. The price: every **unique constraint** must **contain the partition column**.

### Declaration
~~~sql
CREATE TABLE transaction_log (
    id          bigint      NOT NULL,
    created_at  timestamptz NOT NULL,
    account_id  bigint      NOT NULL,
    amount      numeric(18,2) NOT NULL,
    PRIMARY KEY (id, created_at)      -- mandatory: must contain the partition column
) PARTITION BY RANGE (created_at);

CREATE TABLE transaction_log_2026_01 PARTITION OF transaction_log
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- default partition: a safety net in case you forget to create one
CREATE TABLE transaction_log_default PARTITION OF transaction_log DEFAULT;
~~~

### Partition pruning
~~~sql
-- Reads only partition 2026_01
SELECT sum(amount) FROM transaction_log
WHERE created_at >= '2026-01-01' AND created_at < '2026-02-01';
~~~
For pruning to work, the condition on the partition column must be **inside the query**. Verify with {{EXPLAIN}} – the plan will only list the relevant partitions.
- With a **prepared statement**, the planner may switch to a "generic plan" after several executions; pruning then cannot happen at plan time, but PostgreSQL 11+ still prunes at execution time (runtime pruning – the plan shows {{Subplans Removed}}). A condition using a function such as {{now()}} can likewise only be pruned at execution time.

### Day-to-day partition management
- **Pre-create**: always create next month's partition from a cron job. If no partition holds the new data and there is no {{DEFAULT}} partition, every {{INSERT}} will **fail**.
- **Detach/attach partitions** (PostgreSQL 14+):
~~~sql
-- detach a partition in order to process old data (fast, no long lock)
ALTER TABLE transaction_log DETACH PARTITION transaction_log_2025_01 CONCURRENTLY;

-- re-attach the partition once it has been processed
ALTER TABLE transaction_log ATTACH PARTITION transaction_log_2025_01
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
~~~
Note: {{DETACH ... CONCURRENTLY}} cannot run inside a transaction block and **cannot be used when the table has a DEFAULT partition**. {{ATTACH PARTITION}} (PG 12+) only takes {{SHARE UPDATE EXCLUSIVE}} on the parent, but the attached table is locked and scanned to verify constraints (the DEFAULT partition is scanned as well if one exists). Tip: pre-create a {{CHECK}} constraint matching the value range so PostgreSQL can skip that scan.
- **Delete old data**: {{DROP TABLE transaction_log_2024_01;}} – almost instant, because it only unlinks files instead of writing millions of rows.
- **Patch wrongly dated data**: you can {{ATTACH}} a table that already contains data into the matching partition (note it must have an index with the same structure, and the command will lock).

### Important constraints
1. **The unique constraint must contain the partition column**. This is the most painful part:
   - If the original table uses {{PRIMARY KEY (id)}}, you **cannot** partition by {{created_at}}.
   - Common fix: change it to {{PRIMARY KEY (id, created_at)}}. But then the application cannot find a row by {{id}} alone without knowing {{created_at}} ⇒ the entire access path must be redesigned.
   - Alternative: partition by a **hash** of {{id}} instead of by time – uniqueness on {{id}} is kept, but the benefit of dropping by time is lost.
2. **Foreign keys to partitioned tables**: supported since PostgreSQL 12+, but check your actual version.
3. **Index**: creating an index on the partitioned table automatically creates an index on **every** partition. With many partitions the number of small indexes grows quickly and write overhead rises accordingly.
4. **DEFAULT partition**: dangerous, because data that lands there makes it bloat, many queries end up reading it, and each time a new partition is created PostgreSQL must scan DEFAULT to make sure no row belongs to the new range (duplicates make the create command fail). Alert when the default partition holds data.

### How MySQL differs from PostgreSQL
- MySQL 8 supports {{PARTITION BY RANGE}} and {{RANGE COLUMNS}} and also has partition pruning.
- Stricter rules: **every** unique key (including the primary key) must contain **all** the partition key columns, and partitioned tables do **not** support foreign keys.
- MySQL has no {{DETACH}}/{{ATTACH}} like PostgreSQL; instead it uses {{ALTER TABLE ... EXCHANGE PARTITION}} or {{DROP PARTITION}}, both DDL that need a metadata lock.
- MySQL 8 only supports partitioning with InnoDB (native partitioning); each partition is still its own {{.ibd}} tablespace file.

### Production pitfalls
- **Forgetting to create a partition** ⇒ every write to the table fails. Have an alert when next month's partition does not exist yet.
- **Queries without a partition key condition** read all partitions ⇒ worse performance than a plain table. For log tables, always require a time range in the API.
- **Bloated partition (skew)**: if data is not evenly distributed across months (e.g. a promotion campaign), that partition becomes very large.
- **Partitioned tables carry overhead**: every statement has to go through the partitions' "append node" ⇒ a small cost compared to a normal table. For small tables partitioning can make things slower.

> Senior tip: before partitioning, answer three questions: **(1) how often do I delete old data?** (this is the real reason to partition) **(2) can the unique constraint contain the partition column?** If not, you have to change the key design – that change is very expensive, so decide early. **(3) how many partitions will there be after 3 years?**`,
    follow: [
      'Why must a unique constraint contain the partition column, and how does that affect the primary key?',
      'How do you handle data for a month whose partition has not been created, without taking the system down?'
    ]
  },
  'db-015': {
    q: 'How do the three join algorithms of PostgreSQL (nested loop, hash join, merge join) differ? What does it take to read an execution plan and work out why the optimizer picked the wrong algorithm?',
    a: `**Summary:** There are three main join algorithms. **Nested loop**: take each row of the outer table and find matching rows in the inner table using an index – cheap when the outer table is small, expensive if the inner table has no index. **Hash join**: build a hash table from the smaller table then scan the larger one – good for large joins without an index, but it needs **memory** (it spills to disk once {{work_mem}} is exceeded). **Merge join**: both tables are already sorted, then walk the two lists in parallel – good when both are large and an index provides the right order. The optimizer picks the wrong plan mostly **not because of the algorithm** but because of **wrong statistics**.

### Comparison
| Algorithm | Mechanism | Good when | Bad when |
|---|---|---|---|
| Nested Loop | Loop, index lookup on the inner table | Outer table very small, index on the inner table | Inner table has no index, outer table large |
| Hash Join | Build hash table then probe | Both tables large, no index | Build side too large ⇒ spills; out of memory |
| Merge Join | Merge two sorted lists | Both large, index in join order, sorted output needed | No sort order ⇒ expensive sort required |

### Reading the plan
~~~sql
EXPLAIN (ANALYZE, BUFFERS) SELECT ...;
~~~
Signs worth paying attention to:
| Sign in the plan | Meaning |
|---|---|
| Large {{Rows Removed by Join Filter}} | Join condition in the wrong place, or missing index on the inner side |
| {{Hash Cond}} with {{Batches}} > 1 | Hash join **spills** to disk – very slow |
| {{Sort Method: external merge}} | Sort exceeded {{work_mem}} and spilled to disk |
| Estimated row count far off the actual row count | **Wrong statistics** – the root cause of most wrong-plan cases |
| High {{Heap Fetches}} on an index-only scan | Visibility map not updated yet (VACUUM has not caught up) ⇒ the heap still has to be read |

### Why the optimizer picks the wrong plan
1. **Stale statistics**: after a large bulk insert the statistics are not refreshed ⇒ wrong estimates. Run {{ANALYZE}}.
2. **Low resolution**: {{default_statistics_target}} is 100 by default. For a column with a complex distribution (many popular values), raise it: {{ALTER TABLE t ALTER COLUMN c SET STATISTICS 1000;}} then {{ANALYZE t;}}.
3. **Correlation between columns**: the optimizer does not know that columns {{country}} and {{city}} are correlated. Use **extended statistics**: {{CREATE STATISTICS st_c (dependencies, ndistinct) ON country, city FROM customers;}}
4. **{{work_mem}} too small** makes the planner avoid hash join.
5. **Prepared statements using a generic plan**: the plan is cached for generic parameters, so it loses the benefit of a specialized plan. For important queries: {{SET LOCAL plan_cache_mode = force_custom_plan;}}
6. **Data skew**: new data lands at the tail of the index while the optimizer relies on old distribution history.

### The workflow
1. Run {{ANALYZE}} and review the plan.
2. If it is still off, raise {{default_statistics_target}} for the relevant column or add extended statistics.
3. Check the index on the inner side of the join.
4. Raise {{work_mem}} for the session if you see {{Batches}} > 1.
5. Temporary check: {{SET LOCAL enable_hashjoin = off;}} then see how the plan changes – if it gets better, that is a clue.
6. If you have tuned everything and it is still slow, consider a **materialized view** or an **index on the materialized view** for the reports you run repeatedly.

### Production pitfalls
- Running {{EXPLAIN ANALYZE}} on a real {{UPDATE}}/{{DELETE}} executes the change – wrap it in {{BEGIN}} + {{ROLLBACK}}.
- A prepared statement's **generic plan** may be fine when data is evenly distributed and terrible when it is skewed ⇒ do not just tune the literal statement and then put it into code with parameters.
- Raising {{work_mem}} **globally** can bring the server down when many sessions use it at once. Set it per session/role, and remember it is charged for **every** node of the plan.
- Tuning for a **plan that looks pretty** instead of for real measurements is a common mistake: a strange-looking plan can still be faster.

> Senior tip: store {{EXPLAIN (ANALYZE)}} output of your important queries in CI or keep it over time so you can detect **plan regressions** before they reach production.`,
    follow: [
      'When does a hash join spill to disk, and how does that affect performance?',
      'What problem do extended statistics solve that single-column statistics cannot?'
    ]
  }
});
