/*
 * English translation of js/data/q-spring-data.js — task T958. Format: js/core/i18n.js (content overlay).
 * ids: jpa-045 jpa-046 jpa-047 jpa-048 jpa-040 db-040 db-041
 */
App.i18n.content({
  'jpa-045': {
    q: 'How do Hibernate second-level cache (L2) and query cache work, why can they hurt more than help in a cluster, and how do you design invalidation?',
    a: `**Summary:** L2 cache stores entity state by id (or disassembled data) to avoid repeated DB reads; query cache stores the id/key list of a query result (usually needs L2 entity regions to be useful). With multiple nodes, an update on node A leaves node B's cache stale unless synchronized; query cache is also sensitive to any change in related tables -> noisy invalidation, low hit rate. In practice many systems prefer application-level cache (Redis/Caffeine) with clear business keys, TTL/event invalidation, and use L2 only for reference data read very often and near-immutable.

### Step 1: Terms
- **L1 cache**: persistence context — automatic, per session/transaction.
- **L2 cache**: attached to SessionFactory, can use a provider (Ehcache, Infinispan, etc.) — shared across sessions in the same JVM; cluster needs replication/distributed.
- **Query cache**: caches mapping (query + params + region) -> result; Hibernate must invalidate the region when an entity in the table space changes — high cost.
- **Stale read**: reading an old value even though DB changed.

### Step 2: Mechanism (simplified)
1. em.find(Entity, id): check L1 -> check entity L2 region -> on miss read DB -> put into L2/L1.
2. Updating entity through Hibernate in a transaction: on commit/flush as appropriate, Hibernate updates/invalidates the corresponding L2 entry (depending on concurrency strategy).
3. Query cache: first run of a cacheable query stores the result (usually id list) in the query region; next time returns ids and hydrates entities from L2/L1/DB.
4. **Bulk JPQL update/delete (@Modifying)** goes straight to DB: Hibernate usually invalidates the related region (possibly coarsely) — but changes outside Hibernate (SQL scripts, other services) are **not** known.

~~~java
@Entity
@Cacheable
@org.hibernate.annotations.Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class Country { @Id Long id; String code; }
~~~

~~~yaml
spring:
  jpa:
    properties:
      hibernate:
        cache:
          use_second_level_cache: true
          use_query_cache: false   # consider carefully
          region:
            factory_class: jcache
~~~
(Exact config depends on provider; check Hibernate 6 + your Spring Boot version docs.)

### Step 3: Why cluster usually hurts more than helps
- **Coherence**: node B keeps stale copy; need synchronous replication (slow) or async (stale window) or invalidation messages.
- **Invalidation storm**: frequently written tables -> query cache/regions evicted continuously -> low hit rate, overhead higher than no cache.
- **"Cache for wrongly timed data" effect**: entities with LAZY relations, time-sensitive data (price, stock, limits) -> stale causes serious business errors.
- **Operational complexity**: debugging "works locally but wrong in prod" is hard.

| Data | L2/query cache? | Suggestion |
|---|---|---|
| Country catalog, rarely changed config | Possible (READ_ONLY/NONSTRICT if suitable) | Long TTL, invalidate on deploy/config change |
| Cart, balance, in-flight orders | Usually **no** | Source of truth = DB, cache deliberately if needed |
| Heavy repeated reports | Query cache usually **no** | Cache result DTOs at app layer + clear keys |

### Invalidation in cluster — practical
1. **Limit scope**: cache only entity reference data; disable query cache globally unless measured benefit.
2. **Concurrency strategy**: READ_ONLY for immutable data; READ_WRITE/NONSTRICT trade off locks/staleness — choose per provider.
3. **Invalidation channel**: if using distributed cache (Infinispan, Redis-backed) use pub/sub invalidate; after bulk update run evict/evictAll region or version keys.
4. **Writes outside Hibernate**: every write path (batch job, manual SQL) must emit invalidation event or accept short TTL.
5. **Measure**: hit/miss, p95 latency, stale incident rate; disable cache when hit rate low.

### In production
- **Symptoms**: user sees stale data after admin edit; nodes A/B return different results; DB spike when cache is evicted; cache memory grows.
- **Measure**: provider metrics (hits, misses, evictions), Hibernate statistics SecondLevelCacheHitCount, region logs.
- **Config flags (verify version)**: hibernate.cache.use_second_level_cache, hibernate.cache.use_query_cache, hibernate.cache.region.factory_class (jcache), jakarta.persistence.sharedCache.mode; @Cache, @Cacheable (JPA).

> Senior tip: In a lead interview, a strong answer is: "I default to disabling query cache and consider L2 only for reference data with a clear owner and clear invalidation path; money/stock use DB + optimistic locking + short TTL app cache if needed."`,
    follow: ['Why does query cache depend on L2 entity cache and when does it become useless?', 'How does a bulk JPQL update affect L2 cache and how do you handle it after a batch job?', 'Compare Hibernate L2 cache with Spring @Cacheable + Redis for shared reference data across services?']
  },
  'jpa-046': {
    q: 'How does Hibernate 6 process queries via SQM (Semantic Query Model) and query plan cache? What problem does hibernate.query.in_clause_parameter_padding solve and what should you watch when enabling it?',
    a: `**Summary:** Since Hibernate 6, HQL/Criteria are parsed into **SQM** (a semantic tree tied to the entity model), then converted to **SQL AST** and final SQL; the compilation plan can be **cached** to avoid repeated parse/translate. Practical issue: an IN (:ids) with varying number of parameters produces **many different SQL texts** -> many plan/statement cache entries (in Hibernate and/or DB) -> memory cost, lower efficiency. hibernate.query.in_clause_parameter_padding (default may be on depending on version/config) **pads** the number of IN parameters up to "bucket" sizes (power-of-two or padding levels) to reuse SQL/plan.

### Step 1: Terms
- **SQM (Semantic Query Model)**: query representation at "meaning" level (entity, attribute, join) rather than raw SQL string — helps Hibernate 6 understand and optimize better.
- **Query plan cache**: cache of compiled query plan in Hibernate (different from result cache). If same query shape, Hibernate can skip heavy plan building.
- **Parameter padding**: add padding parameters (usually repeated value or neutral value per Hibernate handling) to stabilize the number of ? placeholders.
- **Prepared statement cache (DB/driver)**: DB also caches plan by SQL text; constantly changing SQL text -> cache miss.

### Step 2: IN explosion example
~~~java
// ids with 3 elements: IN (?, ?, ?)
// ids with 4 elements: IN (?, ?, ?, ?)
// ids with 100 elements: IN (...100 ?...)
repo.findAllByIdIn(ids);
~~~
Each size produces different SQL text -> Hibernate may create different plans; DB may re-parse/plan. With APIs accepting flexible id lists, number of variants is huge.

Enable padding (Spring Boot application.yml, verify property name for your Hibernate 6.x):
~~~yaml
spring:
  jpa:
    properties:
      hibernate:
        query:
          in_clause_parameter_padding: true
~~~
When enabled, Hibernate may expand the parameter list to a padded bucket (e.g. 3 -> 4, 5 -> 8...) to reuse the same SQL shape. (Exact padding mechanism is Hibernate implementation detail; verify via SQL logs.)

### Step 3: Why SQM/plan cache design
- **Correct semantics**: SQM tied to metamodel, supports new features and better validation.
- **Performance**: plan cache reduces parse CPU for repeated queries. Trade-off: plan cache also costs RAM; overly diverse query shapes make cache ineffective.

### Risks and notes when enabling padding
- **Very large IN**: padding does not solve DB limits (Oracle limits IN elements in some contexts; SQL Server limits parameters) — still chunk (e.g. 500-1000 ids per query).
- **DB plan**: same SQL shape but different value distributions may still need different plans; padding helps cache, not absolute optimal plan.
- **Compatibility**: check actual SQL logs after enabling; special queries need confirmation of unchanged semantics.
- **Security**: still use parameter binding (Hibernate does it), never concatenate ids.

| Issue | Symptom | Handling |
|---|---|---|
| IN varies a lot | Plan cache RAM grows, parse CPU high | Enable in_clause_parameter_padding, chunk ids |
| Different query strings | L2 statement cache miss | Normalize queries, avoid arbitrary dynamic JPQL |
| Plan cache too large | GC/metaspace pressure | Tune cache size (Hibernate property, check docs), review query shapes |

### In production
- **Symptoms**: throughput drops when traffic has many IN filter variants; DB sees many hard parses/plans; heap/metaspace grows.
- **Measure**: Hibernate statistics (query plan cache metrics if exposed), log org.hibernate.orm.query, DB view (pg_stat_statements counting queryid/plan), APM.
- **Config (verify version)**: hibernate.query.in_clause_parameter_padding=true; Hibernate 6 query plan cache config (property names may be under hibernate.query.* — check ORM 6.x docs); limit IN batch size at repository layer.

> Senior tip: When an API accepts an id array from client, I always have "max ids per query" (e.g. 500) + chunking + padding. That trio protects DB, protects plan cache, and keeps latency stable.`,
    follow: ['How do you verify padding is working (SQL logs, number of ?) and whether query results change?', 'What is the difference between Hibernate query plan cache and PostgreSQL/driver prepared statement/plan cache?', 'When should you use temp tables or unnest(array) instead of very large IN?']
  },
  'jpa-047': {
    q: 'Batch insert in Hibernate 6: why does IDENTITY id generation break batching, how do SEQUENCE + pooled/pooled-lo optimizer work, and how do you verify/tune in production with parent-child relations and constraints?',
    a: `**Summary:** JDBC batching is only efficient when Hibernate can send many statements of the same type consecutively. With GenerationType.IDENTITY, DB generates id **after INSERT**, so Hibernate must insert each row to get generated key -> **cannot batch** as desired. With SEQUENCE, Hibernate gets id **before** (calls sequence), can assign id to entity and batch many INSERTs; **pooled optimizer** (@SequenceGenerator with allocationSize > 1, Hibernate uses pooled strategy appropriately) requests a "pool" of values (increment step) from DB and allocates in memory, reducing nextval round-trips. In production measure round-trips, insert order (order_inserts), parent-child cascade, and keep allocationSize consistent with sequence INCREMENT BY.

### Step 1: Terms
- **JDBC batch**: groups many addBatch() then executeBatch() — reduces round-trips between app and DB.
- **IDENTITY**: AUTO_INCREMENT/IDENTITY column — id decided by DB at write time.
- **SEQUENCE**: DB object generating increasing numbers; Hibernate can call nextval.
- **Pooled optimizer**: id allocation algorithm: DB increments sequence by allocationSize step; Hibernate treats it as buying wholesale a range, allocates locally in JVM -> fewer select nextval.

### Step 2: Internal flow
**IDENTITY (problem):**
1. persist(child) -> Hibernate needs id for context/cascade/FK -> must INSERT immediately.
2. DB returns generated key -> entity has id.
3. Row 2 -> INSERT immediately again -> no longer "many inserts waiting to be batched".

**SEQUENCE + pooled:**
1. allocationSize=50 and DB sequence INCREMENT BY 50.
2. Hibernate calls nextval (or equivalent) to get pool boundary, computes locally allocatable id range.
3. persist 1000 entities: Hibernate assigns ids from pool (occasionally requests new pool) -> can batch INSERTs per hibernate.jdbc.batch_size.

~~~java
@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "order_seq")
@SequenceGenerator(name = "order_seq", sequenceName = "order_id_seq",
  allocationSize = 50) // must match INCREMENT BY of DB sequence
private Long id;
~~~

~~~yaml
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 50
          batch_versioned_data: true
        order_inserts: true
        order_updates: true
~~~

### Step 3: Why designed this way (trade-off)
IDENTITY is simple for DB but locks order "must insert to know id". SEQUENCE separates id allocation from insert, at cost of managing sequence and syncing allocationSize. Pooled reduces contention/round-trips but has "id gaps" if JVM crashes (pool requested but not fully used) — acceptable for surrogate keys.

### Parent-child and batch pitfalls
- **Order**: insert parent before child; order_inserts=true helps Hibernate group by entity type — but complex graphs still need verification.
- **@Version**: versioned updates need hibernate.jdbc.batch_versioned_data=true for more effective batch updates.
- **IDENTITY on MySQL**: if IDENTITY is mandatory, accept no batching or change strategy (TABLE generator has lock cost; usually worse than SEQUENCE on Postgres) — decide by DB.
- **merge()** in large batch: may cause extra selects; prefer persist() for new objects.

| Item | IDENTITY | SEQUENCE + pooled |
|---|---|---|
| Batch insert | Heavily limited | Good if configured right |
| Round-trips for id | Tied to insert | Fewer thanks to pool |
| Id gaps | Few due to pool style | Possible gaps on crash/restart |
| Portability | Every DB supports identity | Needs sequence (Postgres/Oracle good) |

### In production
- **Symptoms**: importing 100k rows slow, p95 DB time high, one insert per row; or duplicate key/sequence errors during migration.
- **Measure**: datasource-proxy counts statements and actual batch size; generate_statistics; compare time with/without batching.
- **Tuning/config (real)**: hibernate.jdbc.batch_size, hibernate.order_inserts, hibernate.order_updates, hibernate.jdbc.batch_versioned_data; allocationSize matches DDL CREATE SEQUENCE ... INCREMENT BY 50; chunk persist/flush/clear every 50-200 rows; use reWriteBatchedInserts (PostgreSQL JDBC driver) when suitable — check driver.

> Senior tip: When someone says "Hibernate is slow", I ask immediately: "What's the id strategy, what's batch_size, and did you measure how many statements executeBatch actually grouped?" Those three answers usually find the root cause.`,
    follow: ['How do you check whether DB sequence INCREMENT BY matches allocationSize, and what happens if they mismatch?', 'How do pooled and pooled-lo differ and when does Hibernate choose? (describe general behavior and advise checking version docs)', 'With batch insert of @OneToMany(cascade=PERSIST), how do you control SQL order and avoid hidden N+1/select?']
  },
  'jpa-048': {
    q: 'Hibernate flushes actions in insert→update→delete order via ActionQueue: beyond remove()+persist() on the same unique key, what deep edge cases cause unique/FK violations (orphanRemoval collection replacement, natural key change, soft delete with partial unique index, DEFERRABLE constraints on PostgreSQL), and how do you handle them correctly?',
    a: `**Summary:** Hibernate collects managed changes then flushes via **ActionQueue** (groups insert, update, collection, delete... by internal rules for FK safety and optimization). Actual execution order **does not follow** your Java method call order; a famous consequence is **INSERT may run before DELETE**, so "delete then re-add" the same **unique constraint** value can fail in the same transaction. Deep edge cases: (1) orphanRemoval collection replacing an element with same business key, (2) changing a **natural key** (business key like code/email) while references exist, (3) soft delete (@SQLDelete/flag deleted_at) turns "DELETE SQL" into UPDATE but unique often still applies to soft-deleted rows if index designed wrong, (4) PostgreSQL DEFERRABLE INITIALLY DEFERRED defers unique check to transaction end (helps rare cases) but changes error timing and increases complexity. Standard handling: explicit flush() at right points, prefer UPDATE/merge by stable id, design partial unique index for soft delete, and write integration tests on real DB.

### Step 1: Terms (from basics)
- **ActionQueue**: like an internal "todo list" — Hibernate orders add/update/delete into groups to send to DB efficiently. Everyday analogy: post office groups letters into batches rather than sending each as you write it.
- **Unique constraint**: rule "no duplicates" (email, document number). DB checks on INSERT/UPDATE (or at commit if DEFERRABLE).
- **Natural key vs surrogate key**: natural key has business meaning (invoice_no); surrogate key is technical id (BIGINT). Mixing "replace by natural key" strategy with id-based entity management easily causes ActionQueue errors.
- **orphanRemoval**: removing an element from parent collection -> Hibernate considers child orphaned and deletes child row on flush.

### Step 2: ActionQueue mechanism (core) and why insert→delete
Hibernate prioritizes **INSERT** to ensure new entities have rows in DB before later steps need references (reduces FK errors in many graphs). **DELETE** usually runs late. This optimizes common case but breaks reuse of unique key.

~~~text
Unit of Work: remove(old: email=a) ; persist(new: email=a)
Code order:   [remove, persist]
Flush order:  (may) [INSERT new(a)] -> FAIL unique -> [DELETE old] not yet run
~~~

### Step 3: Deep edge cases

**(A) orphanRemoval collection — replacing element with same business code**
~~~java
@Entity class Contract {
  @OneToMany(mappedBy="contract", orphanRemoval=true, cascade=CascadeType.ALL)
  private Set<ContractLine> lines = new HashSet<>();
}
// replace: lines.clear(); lines.add(newLine with same lineNo)
~~~
clear() creates orphan removes, add() creates inserts. With UNIQUE(contract_id, line_no), flush may insert new line before deleting old -> duplicate key. Handling: update existing line entity by id/lineNo instead of replace; or flush() after clear; or merge by business key.

**(B) Changing natural key "by replace"**
Creating a new entity with same natural key instead of setNaturalKey() on managed entity confuses identity and ActionQueue. If natural key **must** change, prefer UPDATE on same row (check target unique value not in use).

**(C) Soft delete + unique index**
@SQLDelete(sql="update users set deleted_at=now() where id=?") (Hibernate annotation — check module/version) makes remove() emit UPDATE, not DELETE. But UNIQUE(email) on whole table still blocks re-creating email even though old row is "soft-deleted". Correct direction (DB-specific): PostgreSQL partial unique index:
~~~sql
CREATE UNIQUE INDEX uq_users_email_active
  ON users(email) WHERE deleted_at IS NULL;
~~~
Then duplicate email is blocked only when both rows are "active".

**(D) PostgreSQL DEFERRABLE INITIALLY DEFERRED**
~~~sql
ALTER TABLE users
  ADD CONSTRAINT uq_users_email UNIQUE (email) DEFERRABLE INITIALLY DEFERRED;
~~~
Unique check deferred to **end of transaction** (or SET CONSTRAINTS). Can allow insert-before-delete pattern in same transaction if final state valid. Trade-off: errors detected late, hard to know which statement caused; not all DBs support similarly (MySQL differs); careful migrations.

| Variant | Mechanism causing failure | Handling |
|---|---|---|
| remove+persist same unique | INSERT before DELETE | flush() between, or UPDATE |
| orphanRemoval replace | orphan delete vs insert | update element, flush() after clear |
| Soft delete + normal unique | unique still blocks soft-deleted row | partial unique index (WHERE deleted_at IS NULL) |
| Want to defer check | DB checks early | DEFERRABLE (only if accept trade-off) |

### In production
- **Symptoms**: ConstraintViolationException (SQLState 23505 Postgres, 1062 MySQL) random by timing; only in "change code/change email" flows; H2 tests pass but Postgres fails.
- **Measure**: log org.hibernate.SQL to see DML order; integration test with Testcontainers (real Postgres) reproducing clear+add or remove+persist; check DDL index/constraints.
- **Tuning/config**: hibernate.order_inserts/order_updates **do not** solve insert-vs-delete unique; use intentional em.flush(); for soft delete use partial index (Postgres) — check DB compatibility.

> Senior tip: When code review sees "delete old element then add new element with same business code", I treat it as potential bug until there is (1) phase-separating flush(), (2) update-in-place strategy, or (3) proof constraint/index designed correctly for soft delete. Don't trust Java method order.`,
    follow: ['How do you write a Testcontainers test that deterministically reproduces ActionQueue+unique error instead of flaky (forcing flush/transaction boundary)?', 'How does partial unique index for soft delete interact with @Where/@SQLRestriction (Hibernate 6) and native queries?', 'How do DEFERRABLE constraints affect debugging and transaction retry (error thrown at commit)?']
  },
  'jpa-040': {
    q: 'When fetching relations in JPA/Hibernate, what is MultipleBagFetchException, why does it occur, and how do you compare query counts between @BatchSize/hibernate.default_batch_fetch_size, SUBSELECT fetch, and EntityGraph?',
    a: `**Summary:** A **Bag** in Hibernate is an unordered collection without uniqueness constraint on elements (usually a List without @OrderColumn). When fetch joining **two bags** at once, SQL creates Cartesian product (each child row multiplied) and Hibernate cannot correctly deduplicate both Lists -> throws MultipleBagFetchException. To avoid N+1 (1 parent query + N child queries), three main approaches: @BatchSize/batch_fetch_size (groups ids into IN, ~1 + ceil(N/batch) queries), SUBSELECT (1 child query using subselect of parent ids), EntityGraph/fetch join (usually 1 query but careful with row explosion and pagination).

### Step 1: Terms (from basics)
- **N+1 problem**: fetch 100 Orders (1 query) then touch order.getItems() per order -> 100 more queries. Everyday analogy: go to market once for 100 items, then return 100 times for each.
- **Fetch join** (JPQL join fetch o.items): forces Hibernate to load relation in same SQL.
- **EntityGraph** (entity graph): declaration "for this query also load these attributes" - Hibernate builds corresponding fetch plan.
- **Bag vs Set**: Set removes duplicates by equals/hashCode; List bag allows duplicates and is hard to split rows when two bags cross-multiply.

### Step 2: Why MultipleBagFetchException occurs
~~~java
@Entity class Order {
  @OneToMany(mappedBy="order") List<OrderItem> items;   // bag 1
  @OneToMany(mappedBy="order") List<Payment> payments;  // bag 2
}
// JPQL: select o from Order o join fetch o.items join fetch o.payments
// -> Hibernate throws: MultipleBagFetchException
~~~
1. 1 order has 3 items and 2 payments -> LEFT JOIN creates 3 * 2 = **6 rows**.
2. Hibernate must collapse 6 rows into 1 Order with 3 items and 2 payments.
3. With **two bags** in parallel, Hibernate cannot distinguish "duplicate due to Cartesian product" from "legitimately duplicate element" -> refuses to preserve correctness.
4. **Handling:** change one (or both) to Set if business allows (correct equals/hashCode); or split into 2 queries in same persistence context (Hibernate merges via L1 cache); or use @BatchSize/SUBSELECT.

### Step 3: Query count comparison (concrete example)
Assume loading **100 Orders**; @BatchSize(size=25) or hibernate.default_batch_fetch_size=25:
- **N+1:** 1 + 100 = **101 queries**.
- **@BatchSize(size=25):** 1 + ceil(100/25)=4 = **5 queries**.
- **SUBSELECT:** 1 + 1 child query where order_id in (select o.id from orders ... original subquery) = **2 queries**. Risk: heavy subquery.
- **JOIN FETCH 1 collection:** usually **1 query**. Join collection + pagination may cause HHH000104 (in-memory pagination).

| Strategy | Queries (100 parents) | DB-safe pagination? | Row explosion | Notes |
|---|---|---|---|---|
| N+1 | 101 | Yes (parent query) | No | Avoid |
| @BatchSize=25 | 5 | Yes | No | Safety net |
| SUBSELECT | 2 | Usually OK | No | Heavy subquery |
| JOIN FETCH 1 collection | 1 | **Risk** | Yes | Not with paging |
| EntityGraph | 1 or per plan | Depends | Yes if join | Flexible |

### In production
- **Symptoms**: endpoint slows as record count grows; logs full of select ... where id=?; HHH000104.
- **Measure**: hibernate.generate_statistics=true to see PrepareStatementCount; datasource-proxy/p6spy.
- **Config**: hibernate.default_batch_fetch_size: 50 (start 16-100, measure); for paged lists use DTO/projection or 2-step (get page ids -> fetch join by ids).

> Senior tip: For paged list APIs, I use DTO/projection or 2-step, avoiding direct collection join fetch with paging. Enabling default_batch_fetch_size is a safety net, but still measure.`,
    follow: ['Why changing List to Set can fix MultipleBagFetchException but introduces business risk (equals/hashCode, ordering)?', 'How do you handle loading Order + Items with correct DB-level pagination (not in-memory pagination)?', 'What is the difference between fixed FetchType.EAGER and per-query EntityGraph for long-term maintenance?']
  },
  'db-040': {
    q: 'How does B-tree index work internally: page, fan-out, tree height, index-only scan, and PostgreSQL visibility map? Why does random UUID v4 primary key bloat and slow index compared to UUID v7 or increasing keys?',
    a: `**Summary:** B-tree index (modern variant usually B+tree) is a balanced tree where each node is a data page — 8KB in PostgreSQL, 16KB in InnoDB/MySQL. Each page holds hundreds of keys, so tree is only 3-4 levels for hundreds of millions of rows, and finding a row costs a few page reads instead of scanning table. Leaf nodes linked into a list, so range queries (BETWEEN) and sorting also leverage index. Composite index follows "leftmost prefix": index (a,b,c) helps filtering by a, or a and b, but usually not by b alone. Covering index contains all columns query needs, so DB returns result from index only, no table read (index-only scan). PostgreSQL uses visibility map (marks heap pages where all rows are visible) to know whether an index page can answer without touching heap. UUID v4 random writes hit pages all over -> page splits, index bloats, cache efficiency drops; UUID v7 is time-ordered and increasing BIGINT writes contiguous at right edge -> compact, fast writes.

### Page, fan-out, tree height
- **Page**: smallest disk read/write unit of DB; one B-tree node is a page. PostgreSQL 8KB, InnoDB 16KB.
- **Fan-out**: number of child branches per node. 8-16KB page holds hundreds of keys, so each node has hundreds of branches.
- **Height**: thanks to large fan-out, 3 levels hold ~500×500×500 ≈ 125 million keys, 4 levels hold tens of billions. Root is almost always in buffer cache, so search starts in RAM.
- **B+tree**: data/pointers only in leaf nodes; leaves linked in key order -> range scan and ORDER BY don't revisit root.

Numeric example: 100 million row table, full table seq scan reads ~1-2 million pages; index lookup reads only 4-5 pages (root -> branch -> leaf, then scan adjacent leaves for range).

### PostgreSQL: heap, TID, secondary index
PostgreSQL stores table as heap (unordered data). Index stores key plus TID (page number and tuple position in page) to find row. So secondary index usually costs two reads: one into index, one into heap to fetch row. InnoDB differs: main table is clustered index by primary key, leaf contains entire row; secondary index stores key plus primary key value, so reading via secondary index also needs one more lookup into clustered index.

### Index-only scan and visibility map
Index-only scan happens when selected columns are all in index, so DB doesn't need heap read step. In PostgreSQL, this also depends on visibility map: each data page has a bit marking "all rows on this page are visible to all transactions". VACUUM updates this bit. If bit not updated (long-running transaction blocking vacuum, or page recently heavily updated), index-only scan still touches heap to check visibility -> Heap Fetches column in EXPLAIN (ANALYZE) high instead of 0.

### UUID v4 vs UUID v7 and increasing keys
| Key type | Write order | Pages affected | Index size | Suitable |
|---|---|---|---|---|
| BIGINT sequence/identity | Increasing | Right edge (contiguous) | Compact | Common primary key |
| UUID v7 | Time-ordered | Grouped by time | Compact | Distributed systems needing order |
| UUID v4 | Random | All over tree | Bloated (page split) | Avoid as primary key |

Example: inserting 10 million UUID v4 rows into InnoDB primary key. Each new row lands in random page; when page full, InnoDB splits, leaving about half page empty -> index can be ~2x larger than increasing key, buffer pool holds fewer pages, reads touch more pages. Recommend UUID v7 (RFC 9562 standard, time info for sorting) or increasing BIGINT; document numbers should be generated separately, not reuse primary key.

### In production
- **Bloat symptoms**: inserts gradually slower, buffer pool hit rate drops, index much larger than table.
- **Measure**: pg_stat_user_indexes (idx_scan = 0 for long time -> unused index, drop it), pgstattuple extension for bloat, EXPLAIN for high Heap Fetches on index-only scan.
- **Fix**: change primary key to UUID v7 or increasing key (needs data migration), or lower fillfactor (e.g. 80) to leave room in page for random writes (PostgreSQL only). REINDEX CONCURRENTLY to compact bloated index without blocking read/write.

> Senior tip: When complaint is "inserts gradually slower but schema unchanged", measure index size and page fill ratio before blaming hardware or app code. An unused index (idx_scan = 0 for long time) both occupies disk and slows every write — drop it.`,
    follow: ['Why are indexes on low-cardinality columns often not used?', 'How does stale visibility map affect index-only scan, and what is VACUUM role?', 'How does UUID v7 differ from UUID v1, and why is UUID v7 more suitable as primary key than UUID v4?']
  },
  'db-041': {
    q: 'How is a database commit made durable: WAL, fsync, and checkpoint? What do synchronous_commit and full_page_writes mean, and why do many writes cause checkpoint spikes?',
    a: `**Summary:** When app issues COMMIT, DB does not return success before the change log (WAL — Write-Ahead Log, or redo log in MySQL) is written to disk via fsync; actual data pages are written later by background processes. This is why commit is durable: power loss after success notification, data safe in WAL and replayable on startup. synchronous_commit decides how far commit waits: on (wait for fsync on primary, safest, slower), remote_write (wait for replica to receive WAL), remote_apply (wait for replica to apply, slowest but replica read right after commit not stale), off (don't wait, fastest but may lose just-committed transaction on power loss). full_page_writes writes whole page snapshot into WAL the first time page is modified after each checkpoint, to protect against torn page when system crashes mid-write of 8KB page. Checkpoint spikes: many modified pages pushed to disk in short time -> disk pressured, query latency jumps.

### WAL and fsync, step by step
1. App sends COMMIT.
2. DB writes WAL record containing all changes of transaction.
3. Calls fsync to force OS to write WAL from cache to disk and wait for acknowledgment.
4. Only then returns success to app. Why: if power loss at this point, WAL still safe on disk.
5. Data pages written to data files later by background writer and checkpoint, not immediately at commit.

### synchronous_commit: 4 levels
| Value | Waits for | Data loss on failure | Commit latency |
|---|---|---|---|
| on (PostgreSQL default) | fsync WAL on primary | Transaction not yet fsynced | Medium |
| remote_write | Replica received WAL | Both primary and replica fail | Higher |
| remote_apply | Replica applied WAL | Both primary and replica fail | Highest |
| off | No wait | Just-committed transaction not fsynced | Lowest |

MySQL InnoDB equivalent: innodb_flush_log_at_trx_commit = 1 (fsync every commit, safe), 2 (write to OS cache, fsync every second), 0 (no wait, fastest, may lose 1 second of data on power loss).

### full_page_writes and torn page
When writing an 8KB page, system may write half new half old if power lost mid-write (torn page), corrupting index. PostgreSQL reduces risk by, first time a page is modified after each checkpoint, writing whole page snapshot into WAL (full_page_writes = on). Cost: WAL much larger under heavy writes. Can disable if filesystem guarantees whole-page writes (e.g. ZFS), but for typical systems keep on and don't disable without thorough testing.

### Checkpoint and why spike
Checkpoint pushes modified pages from buffer cache to data files, then writes checkpoint location (start of WAL replay) so crash recovery only replays WAL from that point. Controlled by checkpoint_timeout (default 5 min, periodic checkpoint), max_wal_size (default 1GB, too much WAL forces early checkpoint), checkpoint_completion_target (default 0.5, spreads checkpoint over 50% of interval). Under heavy writes: modified pages accumulate fast -> checkpoint must flush large amount in short time -> disk pressured, read/write queries wait -> latency spikes (checkpoint spike). WAL also grows until checkpoint completes; if replication slot stuck, WAL not removed -> pg_wal directory fills (related to WAL/slot CDC question).

### In production
- **Monitor**: pg_stat_bgwriter (checkpoints_timed = periodic, checkpoints_req = WAL-full forced — many checkpoints_req means writes too heavy), pg_wal size, buffers_checkpoint (pages written per checkpoint).
- **If spikes**: split write batches, avoid updating same large rows concurrently, consider increasing max_wal_size (more WAL space, fewer checkpoints) and higher checkpoint_completion_target (e.g. 0.9) to spread writes.
- Never disable fsync (PostgreSQL fsync = off) in production: commit reported success before data hits disk, power loss can corrupt data, not just lose recent transactions.

> Senior tip: Durable commit costs money (each commit waits for disk, usually few to tens of ms). Group many operations into one transaction instead of committing per row, and set synchronous_commit = off only for features that can tolerate losing a few recent transactions (e.g. click tracking, logs) — never for money data.`,
    follow: ['Why can a not-yet-fsynced commit lose data on power loss, and how is fsync = off more dangerous?', 'How much does full_page_writes grow WAL, and when can it be safely disabled?', 'What does continuously high checkpoints_req indicate, and how do you handle it?']
  }
});
