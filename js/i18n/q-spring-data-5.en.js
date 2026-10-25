/*
 * English translation of js/data/q-spring-data.js — task T177. Format: js/core/i18n.js (content overlay).
 * ids: jpa-010 jpa-011 jpa-012 jpa-013 jpa-014 jpa-015 jpa-016 jpa-017
 */
App.i18n.content({
  'jpa-010': {
    q: 'An API returns an order with its product list and payment history. Which fetch strategy do you choose: {{JOIN FETCH}}, {{@EntityGraph}}, or {{@BatchSize}}? Why does fetching two {{List}} collections at once cause {{MultipleBagFetchException}}, and how do you handle it?',
    a: `**Summary:** The three fetch strategies differ in **timing** and **how SQL is generated**. {{JOIN FETCH}} and {{@EntityGraph}} both produce a **single** SQL with {{LEFT JOIN}}, so Hibernate knows the child data upfront and emits no extra queries – but the SQL becomes wide and **cannot** be used together with pagination. {{@BatchSize}} keeps the relationships lazy, but when the collection is accessed it groups multiple loads into {{IN}} queries by batch (N collections need roughly N / batch size queries instead of N). {{MultipleBagFetchException}} occurs because joining **two** {{List}} collections (bags) produces a **Cartesian product** – an order with 3 products and 2 payments becomes 6 rows – and Hibernate cannot map those 6 rows back to two separate {{List}} collections simultaneously.

### Three Strategies
| Criteria | {{JOIN FETCH}} | {{@EntityGraph}} | {{@BatchSize}} |
|---|---|---|---|
| SQL count | 1 (with {{LEFT JOIN}}) | 1 (equivalent to join fetch) | 1 per {{IN}} batch group |
| Works with {{Pageable}} | **No** (in-memory limit) | No | Yes |
| Collections loaded together | Can load multiple | Can load multiple | Loaded by batch on access |
| SQL width | Wide, duplicates likely | Wide | Narrow, no join needed |
| Prefer when | Child data definitely needed | Multiple relations, avoid writing JPQL | Many small collections, unknown which needed |

### Why fetching 2 {{List}} collections fails
Actual SQL:
~~~sql
select o.id, i.id, pay.id
from orders o
left join order_item i on i.order_id = o.id
left join payment pay on pay.order_id = o.id
~~~
An order with 3 items and 2 payments yields 6 rows. If only one collection is fetched, Hibernate groups duplicate parent rows and populates the collection – normal behavior. With **two bags** ({{List}} without {{@OrderColumn}}), Hibernate cannot distinguish Cartesian duplicates from legitimate duplicate List elements, so it refuses at query-build time with {{MultipleBagFetchException}} rather than return incorrect collections.

### Handling approaches
1. **Split into 2 queries**: one query fetches the order (with 1 collection), another fetches the remaining collection by the list of ids. Default choice, easy to control.
2. **Use {{Set}}** instead of {{List}} if collection semantics allow (usually children, no duplicates). Still watch for Cartesian product.
3. **Use {{@BatchSize}}** or {{default_batch_fetch_size}}: keep lazy, load whichever collection is accessed via {{IN}} query. Solves pagination too.
4. **Fetch second collection via separate query** with subquery: {{select o from Order o where o.id in (select ...)}} then {{em.createQuery("select i from OrderItem i where i.order.id in :ids", OrderItem.class)}}.
5. **DTO projection**: if API only needs a few fields of the collection, return DTO – no need to load the collection at all.

### Choosing for the scenario
- Order list (paginated): **do not** fetch collections in the main query.
- Single order detail: use {{@EntityGraph}} with both {{items}} and {{payments}} if wide SQL is acceptable, or split into 2 queries for control.
- Aggregated reports: **DTO projection** – don't load entities.

### Pitfall production
- Spring Data's {{@EntityGraph}} defaults to {{type = EntityGraphType.FETCH}}: attributes not specified are treated as LAZY; but {{LOAD}} keeps the mapping's fetch type, so {{@ManyToOne}} (default EAGER) still gets pulled in. Adding collections to a paginated query's graph breaks pagination.
- Fetch join produces **duplicate data at SQL level**: Hibernate 5 needed {{distinct}} to avoid returning the same order multiple times; Hibernate 6 auto-deduplicates the root entity, but if you select DTO/scalar from the join you still get row multiplication.
- {{@BatchSize}} only helps when the number of collections to load fits within the batch size. For very large collections (thousands of elements), the {{IN}} query becomes heavy.

> Senior tip: treat fetch strategy selection as a **cost analysis**, not a "right/wrong" choice. A single SQL joining 3 collections returning 100 rows for 10 orders may be faster than 3 separate queries when data is small; but when collections grow large, that very SQL becomes the cause of OOM.`,
    follow: [
      'Why can\'t Hibernate merge the join results of two {{List}} collections at once?',
      'When do you choose {{@BatchSize}} over {{@EntityGraph}} for a list API?'
    ]
  },
  'jpa-011': {
    q: 'A paginated order API uses {{@EntityGraph}} to fetch products. Beyond 10,000 pages, the service errors and SQL returns hundreds of thousands of rows. What is warning {{HHH90003004}} and how do you fix it?',
    a: `**Summary:** Warning {{HHH90003004}} (Hibernate 6; Hibernate 5 used {{HHH000104}}) states "firstResult/maxResults specified with collection fetch; applying in memory". Root cause: when SQL has a {{LEFT JOIN}} to a collection, the result set multiplies, so {{LIMIT}}/{{OFFSET}} applied to **SQL rows** would cut at wrong order boundaries ⇒ Hibernate is forced to load the **entire** result set into memory then slice. Fix: **split into 2 queries** – query 1 fetches {{id}}s by page, query 2 fetches collections by those ids.

### Why LIMIT on SQL is wrong
~~~sql
-- What Hibernate generates (conceptually):
select o.*, i.* from orders o left join order_item i on i.order_id = o.id
order by o.created_at desc
limit 20 offset 1000;
~~~
On page 1, those 20 SQL rows might contain only **2 orders** (each with 10 items). Hibernate sees "must fetch 20 orders" so it cannot use SQL LIMIT ⇒ drops LIMIT, loads everything, then groups and slices in memory. With 1M orders, this causes OOM.

### Fix: 2 queries
~~~java
public class OrderRepositoryImpl implements OrderRepositoryCustom {

    @PersistenceContext private EntityManager em;

    @Override
    public Page<Order> findPageWithItems(Specification<Order> spec, Pageable pageable) {
        // Query 1: only fetch IDs by page, NO collection join
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Long> cq = cb.createQuery(Long.class);
        Root<Order> root = cq.from(Order.class);
        cq.select(root.get("id"));
        cq.where(spec.toPredicate(root, cq, cb));
        cq.orderBy(cb.desc(root.get("createdAt")), cb.desc(root.get("id")));
        List<Long> ids = em.createQuery(cq)
            .setFirstResult((int) pageable.getOffset())
            .setMaxResults(pageable.getPageSize())
            .getResultList();

        if (ids.isEmpty()) return new PageImpl<>(List.of(), pageable, 0);

        // Query 2: fetch collections by the ids just retrieved
        List<Order> orders = em.createQuery(
                "select distinct o from Order o left join fetch o.items where o.id in :ids", Order.class)
            .setParameter("ids", ids)
            .getResultList();

        // Re-sort to match pagination order
        Map<Long, Order> byId = orders.stream()
            .collect(Collectors.toMap(Order::getId, Function.identity()));
        List<Order> ordered = ids.stream().map(byId::get).filter(Objects::nonNull).toList();

        // Query 3: count total – NO collection join
        // (simplified; real code must apply same spec as query 1)
        long total = em.createQuery("select count(o) from Order o", Long.class).getSingleResult();
        return new PageImpl<>(ordered, pageable, total);
    }
}
~~~
Three key points:
1. **Query 1 only selects id**, with stable {{ORDER BY}} (add {{id}} as tie-breaker) so pagination doesn't duplicate/lose rows across calls.
2. **Query 2 must re-sort by the fetched id order**: the order returned by query 2 is not guaranteed to match pagination order.
3. **Count query must be separate**, no collection join – same Cartesian product reason.

### Alternatives
- {{@EntityGraph}} + {{Pageable}}: still hits the error, because collection fetch + offset pagination is fundamentally incompatible.
- Use **subquery** to filter ids by collection: {{select o.id from Order o where o.id in (select i.order.id from OrderItem i where ...)}}.
- **DTO projection** for list API: if only product name and quantity needed, return DTO with {{@Query}} constructor expression – no collection load, no 2 queries.
- **Keyset pagination** instead of offset: see pagination question – faster and avoids most offset issues.

### Pitfall production
- {{hibernate.query.fail_on_pagination_over_collection_fetch}} defaults to **false** (only logs warning). Should enable **true** in all environments so the error surfaces early instead of silent OOM in production.
- Upgrading Hibernate or Spring Data doesn't fix this: collection fetch + offset pagination fundamentally requires in-memory pagination.
- **Counting total rows** on large tables is expensive. If UI doesn't need "page 5 / 120 pages", use {{Slice}} or return {{hasNext}} to skip the count query.

> Senior tip: warning {{HHH90003004}} is actually a **valuable signal**: it reveals the app is silently loading the entire table into memory. In production, just 5M orders can consume several GB of heap.`,
    follow: [
      'Why can\'t Hibernate apply SQL LIMIT when a collection fetch is present?',
      'How do you handle ordering between the id-fetch query and the collection-fetch query?'
    ]
  },
  'jpa-012': {
    q: 'You need to bulk-expire 500,000 overdue orders with a single {{@Modifying}} query. Why does data in the persistence context become stale, and how do {{clearAutomatically}} and {{flushAutomatically}} differ?',
    a: `**Summary:** A {{@Modifying}} JPQL bulk ({{update}}/{{delete}}) executes directly against the DB, **bypassing** the persistence context ⇒ managed entities are **not** updated and are **not** marked dirty. The gravest consequence is **dirty checking overwrites**: modifying an already-loaded entity in the same transaction will generate an {{UPDATE}} with stale values at commit. {{flushAutomatically}} forces a flush *before* the bulk query; {{clearAutomatically}} evicts the persistence context *after* – the price is losing the identity map.

### Mechanism
When a {{@Modifying}} method is invoked, Spring Data executes the update/delete and **does not** sync back to the context. Hibernate evicts the **entire second-level cache region** for the affected entity (correct but blunt), while Spring Cache ({{@Cacheable}}) remains completely unaware.

~~~java
@Modifying(flushAutomatically = true, clearAutomatically = true)
@Query("update Order o set o.status = 'EXPIRED', o.updatedAt = :now " +
       "where o.status = 'PENDING' and o.createdAt < :cutoff")
int expireOldOrders(@Param("cutoff") Instant cutoff, @Param("now") Instant now);
~~~

### Three flags, three consequences
| Flag | Effect | When to enable |
|---|---|---|
| {{flushAutomatically}} | Flushes pending changes to DB **before** running bulk query | Always enable when transaction has unflushed changes |
| {{clearAutomatically}} | Clears persistence context **after** bulk query | Enable if no entities in this transaction are needed afterwards; **expensive** – loses identity map |
| {{@Query}} with {{@Modifying}} | Mandatory; otherwise Spring Data treats method as select | Mandatory |

Defaults are both {{false}}, so enable explicitly when needed.

### Why this is a dangerous bug
Classic scenario:
1. Transaction starts.
2. You load Order A (status {{PENDING}}).
3. You call bulk update to expire all {{PENDING}} orders → in DB, A is now {{EXPIRED}}, but context snapshot still shows {{PENDING}}.
4. Later you modify another field of A (e.g., {{note}}). At commit, dirty checking generates {{UPDATE}} for **all columns** (default without {{@DynamicUpdate}}) → {{status='PENDING'}} gets written back → **overwrites** the bulk update result.

Additionally, entity A in context still reads {{PENDING}} while DB has {{EXPIRED}}, so subsequent code processes incorrectly.

### Safe approaches
1. **Separate transactions**: run bulk update in its own transaction, then process entities. Cleanest separation.
2. **Use {{@Modifying(clearAutomatically = true)}}** then **reload** needed entities. Accept identity map loss (avoid if transaction holds many entities).
3. **Rewrite as conditional update** ({{where o.status = 'PENDING'}}) and verify affected row count.
4. **Don't use bulk update** for data still managed by other entities in the same transaction.

### Bulk delete
~~~java
@Modifying
@Query("delete from AuditLog a where a.createdAt < :cutoff")
int deleteOldAuditLogs(@Param("cutoff") Instant cutoff);
~~~
- Bulk delete **ignores** {{cascade = REMOVE}} and {{orphanRemoval}}, and **does not** delete child entities (only DB-level {{ON DELETE CASCADE}}, including {{@OnDelete}}, still runs). If child table has FK without ON DELETE, the delete violates constraint.
- Bulk delete on large tables generates massive dead tuples and bloat – consider batch deletes, time-based partitioning with partition drop, or {{TRUNCATE}} when deleting entire table (PostgreSQL {{TRUNCATE}} is transactional but needs {{ACCESS EXCLUSIVE}} lock; MySQL/Oracle {{TRUNCATE}} is DDL, auto-commits).

### Pitfall production
- **Spring Cache not invalidated**: bulk update doesn't evict {{@Cacheable}}/Redis entries (Hibernate L2 cache evicts whole region). Must evict manually, or serve stale data.
- **Ignores {{@Version}}**: bulk JPQL usually doesn't increment version ⇒ concurrent holder with old version can still overwrite. Increment manually in query ({{set o.version = o.version + 1}}) or use HQL {{update versioned}}.
- **Triggers and entity listeners**: DB triggers still fire (good), but {{@PreUpdate}} and Spring Data auditing **do not** run.
- **Audit trail**: bulk update loses "who changed it" info; financial data needs separate history table.

> Senior tip: simple, practical rule – "**bulk update is an independent SQL statement, keep it independent**": run at transaction start or in a separate transaction, and **always verify affected row count**. A bulk query with wrong condition can expire tens of thousands of unpaid orders, and detecting that is far harder than writing the update correctly.`,
    follow: [
      'Why can bulk update be overwritten by dirty checking, and how to prove it?',
      'When should you use bulk update instead of deleting entities in bulk?'
    ]
  },
  'jpa-013': {
    q: 'You must import 1 million transaction history rows from a CSV file. With Hibernate, which bulk-write strategy do you choose: {{jdbc.batch_size}}, {{StatelessSession}}, or skip JPA entirely? What configurations and pitfalls are essential?',
    a: `**Summary:** For 1M rows, the goal is **minimize round-trips** and **prevent persistence context bloat**. Mandatory config: {{hibernate.jdbc.batch_size}}, {{hibernate.order_inserts}}, {{hibernate.jdbc.batch_versioned_data}} (if entity has {{@Version}}), plus periodic {{flush()}} + {{clear()}}. At this scale, {{StatelessSession}} is a strong choice: it **skips the persistence context**, no dirty-check, no cascade. If data must be read back for validation, use {{JdbcTemplate}} or PostgreSQL COPY.

### Comparison
| Approach | Speed | Bypasses persistence context | Notes |
|---|---|---|---|
| {{save()}} + flush/clear | Medium | No | Still pays dirty-check overhead |
| {{StatelessSession}} | Fast | **Yes** | No cascade, no dirty check, no L1 cache |
| {{JdbcTemplate.batchUpdate}} | Very fast | N/A | Bypasses Hibernate entirely |
| PostgreSQL COPY | Fastest | – | Needs privileges, special handling |
| Spring Batch chunk | Varies | Configurable | Has checkpoint, restartable |

### Batch config
~~~yaml
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 100
          batch_versioned_data: true
        order_inserts: true
        order_updates: true
~~~
- {{batch_size}} only works when **many identical statements** are batched together. That's why {{order_inserts}} matters: if you insert {{Transaction}} and {{TransactionItem}} alternating, without {{order_inserts}} Hibernate sends statements interleaved and batching is nearly useless.
- **Generate ids upfront** to enable batching: {{IDENTITY}} forces Hibernate to fetch generated key after each insert ⇒ loses batching.
- {{batch_size}} isn't magic: ramp up and measure. 50–500 is common starting point; too large holds many statements in memory.

### StatelessSession
~~~java
StatelessSession session = sessionFactory.openStatelessSession();
Transaction tx = session.beginTransaction();
try (BufferedReader reader = Files.newBufferedReader(path)) {
    reader.readLine();                 // skip header
    String line;
    while ((line = reader.readLine()) != null) {   // stream line by line, no full RAM load
        TxHistory row = mapper.toEntity(line);
        session.insert(row);           // direct insert, no context
        // no persistence context ⇒ no periodic flush/clear needed
    }
    tx.commit();
} catch (Exception e) {
    tx.rollback();
    throw e;
} finally {
    session.close();
}
~~~
Key {{StatelessSession}} traits:
- **No persistence context**: {{session.get(...)}} always hits DB, no identity map, no dirty checking.
- **No cascade support**: must insert child entities manually in order.
- **No lazy loading**: everything must be set manually.
- **Hibernate 6 supports JDBC batching** for StatelessSession (via {{hibernate.jdbc.batch_size}} or {{setJdbcBatchSize()}}) – enable SQL/JDBC logging to confirm batching actually happens on your version.

### Pitfall production
- **Reading entire file into RAM** then writing: 1M rows causes OOM. Stream line by line with {{BufferedReader}} or streaming CSV parser.
- **Overly long transaction**: holding 1M rows in one transaction bloats undo log/WAL, blocks vacuum, prolongs commit.
- **Non-idempotent retry**: if job fails mid-way and restarts, duplicate rows are created. Use upsert by business key, or staging table + status flag.
- **Indexes on target table**: every index adds per-row cost. For one-time load into new table, drop secondary indexes and recreate after load; but keep unique indexes needed for upsert/deduplication.

> Senior tip: with 1M rows, the most important question isn't "which library" but **"does this data need to be read back during the write?"**.`,
    follow: [
      'Why does {{@GeneratedValue(strategy = GenerationType.IDENTITY)}} break JDBC batching effectiveness?',
      'How does {{StatelessSession}} differ from a regular {{EntityManager}} and what are the consequences?'
    ]
  },
  'jpa-014': {
    q: 'When should you return DTO instead of entity for an API, and how do interface projection, DTO record with {{@Query}} constructor expression differ?',
    a: `**Summary:** Entity is the **storage and domain model**, not the API contract. Returning entity directly to an API has three consequences: triggers lazy loading during Jackson serialization (easy N+1 or {{LazyInitializationException}}), risk of **leaking sensitive fields** (e.g., {{passwordHash}}) when someone adds a new field, and couples API to table schema (schema change breaks API). Spring Data JPA offers three ways to fetch DTO: **constructor expression** in {{@Query}} (SQL selects only needed columns), **interface projection**, and **native query**.

### Three DTO approaches
~~~java
// 1. Constructor expression: SQL selects only needed columns
@Query("select new com.acme.dto.OrderRow(o.id, o.code, o.status, o.totalAmount, o.createdAt) " +
       "from Order o where o.customerId = :cid")
List<OrderRow> findRows(@Param("cid") Long customerId);

// 2. Interface projection (closed): Spring creates proxy
interface OrderView {
    Long getId();
    String getCode();
    String getStatus();
    BigDecimal getTotalAmount();
}
List<OrderView> findByCustomerId(Long customerId);

// 3. Native query + interface projection
@Query(value = "select id, code, status, total_amount as totalAmount from orders where customer_id = :cid",
       nativeQuery = true)
List<OrderView> findNative(@Param("cid") Long customerId);
~~~

### Comparison
| Criteria | Constructor expression | Interface projection | Native + interface |
|---|---|---|---|
| SQL selects only needed columns | **Yes** | Yes for closed projection; open projection ({{@Value}} SpEL) loads full entity | Yes |
| Must match parameter types exactly | Yes, must match precisely | No | No |
| Complex queries | Limited (JPQL only) | Limited | Best |
| Schema change risk | Low | Low | High (aliases must match) |

Important note on **constructor expression**: parameter types must match **exactly** the DTO constructor types.

### When to replace entity with DTO
- **Use DTO**: read APIs (list, detail, reports), list screens not needing all fields, sensitive data, endpoints needing computation or aggregation.
- **Use entity**: in service layer when domain logic and full relations needed, when doing update/merge, as input for internal APIs between modules.

### Example requiring care
~~~java
@Query("select new com.acme.dto.OrderRow(o.id, o.code, o.status, size(o.items)) " +
       "from Order o where o.customerId = :cid")
List<OrderRow> countItems(@Param("cid") Long customerId);
~~~
- {{size(o.items)}} generates a subquery count, **does not** load collection ⇒ no N+1.
- But it's a **correlated subquery**, runs per result row; for large sets, consider {{left join o.items i ... group by}} with {{count(i)}}, and check the plan.
- {{size()}} returns 0 for empty collections (not null); DTO constructor parameter type must match what Hibernate returns for {{size()}}.

### Pitfall production
- **Interface projection can still cause N+1**: with open projection (getter with {{@Value}} using SpEL on {{target}}) or nested projection on collections, Spring loads entity then reads getter; if getter touches collection, that collection is lazy-loaded.
- **Renaming column in native query** without fixing alias → result is silently null, no error.
- **DTO missing new field**: when domain adds a new status, DTO must be updated – that's the **price of separation**, and it's a price **worth paying**.
- **Returning entity with {{@JsonIgnore}}** then adding everything needed is the easiest mistake: every new entity field automatically leaks to API.

> Senior tip: treat DTO as the **API contract** and write tests asserting that contract (snapshot test or field list check).`,
    follow: [
      'When does interface projection still load the full entity instead of selecting only needed columns?',
      'How do you handle a new entity field when the API already uses DTO?'
    ]
  },
  'jpa-015': {
    q: 'The data model has {{Customer}} as {{Individual}} or {{Company}}. Which JPA inheritance strategy do you choose – {{SINGLE_TABLE}}, {{JOINED}}, or {{TABLE_PER_CLASS}} – and what are the trade-offs?',
    a: `**Summary:** JPA has three inheritance strategies, each producing a different physical layout. {{SINGLE_TABLE}}: **one** table holds columns from both parent and children, distinguished by a **discriminator** column – fastest, simplest queries but wide table with many nullable columns. {{JOINED}}: **each class gets its own table**, child has FK to parent – well normalized, per-branch constraints, but reads require joins and writes insert into multiple tables. {{TABLE_PER_CLASS}}: **each class a standalone table**, no parent table – polymorphic queries need {{UNION ALL}}, so very slow and pagination nearly unusable. For most business systems, {{SINGLE_TABLE}} is the default; switch to {{JOINED}} when branches have many unique attributes or need separate constraints.

### Three Strategies
| Criteria | {{SINGLE_TABLE}} | {{JOINED}} | {{TABLE_PER_CLASS}} |
|---|---|---|---|
| Table count | 1 | 1 + child classes | 1 per class |
| Read query | 1 table, fast | Join parent–child (polymorphic: outer join all children) | {{UNION ALL}} across tables |
| Write | 1 {{INSERT}} | {{INSERT}} to parent + child | {{INSERT}} to 1 table |
| Per-branch constraints | Hard (applies to whole table) | Easy (each table own constraints) | Easy |
| Wide table / nullables | Wide, many nulls | Narrow, normalized | Narrow, duplicate columns |
| Polymorphic pagination | Easy | Supported, many joins | Nearly unusable |
| Polymorphic query | Easy (filter discriminator) | Slower (outer join all children) | Must union |

### Example
~~~java
@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "customer_type")
@Table(name = "customer")
public abstract class Customer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private String fullName;
}

@Entity
public class Individual extends Customer {
    @Column private String idNumber;        // only for individuals
    private LocalDate birthDate;
}

@Entity
public class Company extends Customer {
    @Column private String taxCode;
    private Instant registeredAt;
}
~~~
With {{SINGLE_TABLE}}, table {{customer}} has {{customer_type}} plus {{id_number}}, {{birth_date}}, {{tax_code}}, {{registered_at}}. Inserting an {{Individual}} leaves {{Company}} columns NULL.

Note: {{@DiscriminatorValue}} allows custom discriminator codes (e.g., {{"INDIVIDUAL"}} instead of class name) – use short, **stable** codes, because changing discriminator after data exists breaks existing data.

### Polymorphic query
~~~java
// JPQL has no "instanceof"; use type()
List<Customer> all = em.createQuery("select c from Customer c", Customer.class).getResultList();

List<Customer> companies = em.createQuery(
    "select c from Customer c where type(c) = Company.class", Customer.class).getResultList();
~~~

### When to choose what
- {{SINGLE_TABLE}}: **shallow** inheritance, total columns across branches small (under a few dozen), read-heavy write-light. Default choice.
- {{JOINED}}: each branch has **many unique attributes** and needs separate constraints (e.g., {{Company.taxCode}} must be NOT NULL and unique), or need per-branch partitioning/access control.
- {{TABLE_PER_CLASS}}: rarely used. Only sensible when child classes are **almost unrelated** and **polymorphic queries almost never happen**. Note: this strategy cannot use {{GenerationType.IDENTITY}} (id must be unique across all tables, use sequence).
- {{@MappedSuperclass}}: not true inheritance – used to pull common fields (address, audit info) into a base class **without** creating a table.

### Pitfall production
- {{SINGLE_TABLE}} with many branches creates a "sparse table" with many NULL columns. When inheritance tree grows, consider splitting.
- Adding a column to a child class affects **all** other classes in the same table. On large tables, adding NOT NULL with default requires care (see schema migration question).
- Constraints on parent class apply to **all** children: declaring {{@NotNull}} on a parent field means every branch must have it.
- With {{JOINED}}, reading an object joins 2-3 tables; missing indexes on FKs costs I/O. Ensure indexes on all FK columns.

> Senior tip: deciding between {{SINGLE_TABLE}} and {{JOINED}} should hinge on "**which branch has a constraint I need the DB to enforce?**".`,
    follow: [
      'Why is {{@MappedSuperclass}} not considered table inheritance in JPA?',
      'When must you migrate from {{SINGLE_TABLE}} to {{JOINED}} and what does it cost?'
    ]
  },
  'jpa-016': {
    q: 'What does {{@Transactional(readOnly = true)}} actually do with Hibernate and with the connection? If you want reads to go to a read replica, how does Spring\'s routing mechanism work?',
    a: `**Summary:** {{readOnly = true}} is a **hint to two different layers**. With Hibernate, it sets the session to {{FlushMode.MANUAL}} ⇒ **disables dirty checking**, no extra {{UPDATE}}s – this is the main benefit. With JDBC, it calls {{Connection.setReadOnly(true)}}; whether the server honors it depends on the system, so verify via server SQL logs. {{readOnly = true}} does **not** automatically route to a read replica – that must be built separately using {{AbstractRoutingDataSource}}.

### What Hibernate does
1. Sets {{FlushMode.MANUAL}}: Hibernate **does not** auto-flush. Direct consequence: no {{UPDATE}} from dirty checking ⇒ saves CPU and write traffic.
2. Skips pre-query flush ⇒ but also means **in-memory changes won't be pushed to DB**.
3. Other optimizations: skips snapshot creation for dirty checking, and with PostgreSQL driver may map to server-level read-only transaction.

### What JDBC does
- {{Connection.setReadOnly(true)}} is a **hint**. With PostgreSQL, the driver may translate it to a read-only transaction; with MySQL Connector/J it may also push {{SET SESSION TRANSACTION READ ONLY}} depending on driver config.
- Real benefit when server enforces read-only: write queries are **rejected** ⇒ acts as a "safety net" catching bugs, not a performance optimization.

### What Spring Data JPA does automatically
{{SimpleJpaRepository}} marks read methods as read-only and write methods as read-write. Problem: placing {{@Transactional}} (defaults to read-write) at the service layer **overrides** the repository's read-only flag ⇒ loses the benefit entirely.

### Biggest trap: MANUAL flush swallows changes
Because {{FlushMode.MANUAL}}, if someone calls {{save()}} inside a read-only transaction, the change is **not flushed** ⇒ commit succeeds but data remains old, **with no error**. This is a terrifying silent bug.
- Team convention: read-only methods **never** write.
- Use {{@Transactional(readOnly = true)}} with a test: if DB enforces read-only, the error surfaces immediately.
- Don't enable read-only on shared repository (has both read/write methods); only enable on **service** methods or read-only repositories.

### Routing to read replica
~~~java
public class RoutingDataSource extends AbstractRoutingDataSource {
    @Override
    protected Object determineCurrentLookupKey() {
        // read inside read-only transaction -> route to replica
        return TransactionSynchronizationManager.isCurrentTransactionReadOnly() ? "replica" : "primary";
    }
}

@Bean
DataSource dataSource() {
    Map<Object, Object> targets = Map.of(
        "primary",  primaryDataSource,
        "replica", replicaDataSource);
    RoutingDataSource routing = new RoutingDataSource();
    routing.setTargetDataSources(targets);
    routing.setDefaultTargetDataSource(primaryDataSource);
    // LazyConnectionDataSourceProxy: so actual connection opens AFTER routing decision
    return new LazyConnectionDataSourceProxy(routing);
}
~~~
Three technical points:
- Must wrap with {{LazyConnectionDataSourceProxy}}, otherwise connection opens too early (at transaction start) before read-only flag is determined.
- {{determineCurrentLookupKey()}} is called **every time** a connection is borrowed.
- With **JPA**, every operation must be inside a transaction for the read-only flag to take effect.
- Hibernate may open its own connections for some operations (e.g., reading metadata at startup, {{TableGenerator}} generating id in separate transaction) – verify those go to primary.
- Need **separate pools** for primary and replica: they are different systems, sharing one pool is wrong.

### Pitfall production
- **Reading from replica after write** won't see the new data (replication lag). For financial data (balances, transaction status), always read from primary.
- **Offload heavy reads** (reports, exports) to replica, but **don't** make core business flows depend on replica.
- If app-level cache is populated from replica, data will be staler – account for this in TTL design.
- Enabling read-only on **all** read methods can break read-then-write in same transaction (e.g., read to validate then update). Only enable on truly read-only methods.

> Senior tip: separate two decisions: **"does this query need to write?"** (use {{readOnly}} to save CPU) and **"is stale data acceptable?"** (decides replica routing). In banking, balances, limits, and transaction statuses must always read from primary.`,
    follow: [
      'Why can {{@Transactional(readOnly = true)}} lose data changes without throwing an error?',
      'How do you handle reading from replica right after a write to guarantee read-your-writes?'
    ]
  },
  'jpa-017': {
    q: 'You need to audit who modified customer data, and records must never be hard-deleted. How do Spring Data auditing, Hibernate Envers, and soft delete with {{@SQLDelete}}/{{@SQLRestriction}} differ, and which do you choose for a banking system?',
    a: `**Summary:** These are three distinct needs often conflated. **Spring Data JPA auditing** writes to the main table ({{createdDate}}, {{lastModifiedBy}}) – stores only **current state**, very lightweight. **Hibernate Envers** writes to separate audit tables, storing **full history** on every insert/update/delete – heavier but what auditors need. **Soft delete** doesn't physically delete but marks status, using {{@SQLDelete}} to turn {{DELETE}} into {{UPDATE}} and {{@SQLRestriction}} to exclude deleted records from all queries.

### 1. Spring Data JPA auditing
~~~java
@Entity
@EntityListeners(AuditingEntityListener.class)
public class Customer {
    @CreatedDate @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate @Column(nullable = false)
    private Instant updatedAt;

    @CreatedBy @Column(updatable = false, length = 64)
    private String createdBy;

    @LastModifiedBy
    private String updatedBy;
}
~~~
- Enable with {{@EnableJpaAuditing}} and provide {{AuditorAware}} bean so Spring knows "who is the current user" (typically reads from {{SecurityContextHolder}}).
- Runs via JPA lifecycle callbacks ({{@PrePersist}}/{{@PreUpdate}}), so works with repositories, {{entityManager.persist()}}, dirty checking; but raw SQL, native queries, and JPQL bulk updates are **not** captured.
- **No history**: updating 10 times leaves only the last modification trace.
- Multi-tenant apps: add {{tenant_id}} to audit columns instead of just user id.

### 2. Hibernate Envers
~~~java
@Entity
@Audited(withModifiedFlag = true)
@Table(name = "customer")
public class Customer { ... }
~~~
- Enable by adding {{hibernate-envers}} dependency and annotating {{@Audited}}; audit tables default to {{_AUD}} suffix (change via {{hibernate.envers.audit_table_suffix}}) plus {{REVINFO}}, created via migration.
- Every insert/update/delete creates a **revision** in audit table, storing snapshot of audited fields.
- Query history via Envers {{AuditReader}}, or native query against audit tables.
- Useful options: {{@Audited(withModifiedFlag = true)}} to know which fields changed; {{@NotAudited}} to exclude sensitive fields (e.g., {{passwordHash}}) from audit.
- **Cost**: every update = 1 audit table write; audit tables grow fast and need separate retention policy.
- With entity **relationships**, target entity must also be {{@Audited}}, or declare {{targetAuditMode = RelationTargetAuditMode.NOT_AUDITED}} – otherwise Envers errors at startup.

### 3. Soft delete
~~~java
@Entity
@SQLDelete(sql = "UPDATE customer SET deleted = true, deleted_at = now() " +
                 "WHERE id = ? AND deleted = false")
@SQLRestriction("deleted = false")     // Hibernate 6.3+ replaces deprecated @Where
@Table(name = "customer")
public class Customer {
    @Id private Long id;
    private boolean deleted;
    private Instant deletedAt;
}
~~~
- {{@SQLDelete}}: when {{entityManager.remove()}} is called, Hibernate issues **UPDATE** instead of {{DELETE}}.
- {{@SQLRestriction}}: all JPQL/Criteria queries for this entity **automatically** get {{deleted = false}} condition.
- **Dangerous trap**: JPQL bulk delete (see bulk update question) **does not** use {{@SQLDelete}} ⇒ it truly deletes, while regular delete only hides.
- **Unique constraint still blocks**: deleted customer's email still prevents re-registration. Fix: partial unique index on PostgreSQL: {{CREATE UNIQUE INDEX ux_customer_email ON customer(email) WHERE deleted = false}}.
- Data accumulates: table only grows, needs archive policy and periodic move to history tables.
- For runtime conditions (e.g., "only show branch X data"), use {{@Filter}} and {{@FilterDef}} to enable/disable filters with parameters.

### Three layers should be combined
| Layer | Tool | Retains | Used for |
|---|---|---|---|
| Main table | Spring Data auditing | Current state | Who modified last, filter by date |
| Audit table | Hibernate Envers | Full history | Reconciliation, audit, traceability |
| Main table | Soft delete | "Deleted" records still exist | Regulatory no-hard-delete |

### Pitfall production
- **Auditing enabled but missing {{AuditorAware}}** ⇒ {{createdBy}} always null.
- Combined with Envers: {{updatedAt}}/{{updatedBy}} also appear in each revision (usually helpful); also use custom revision entity ({{@RevisionEntity}}) to store user in {{REVINFO}}.
- **Envers + soft delete** don't mix naturally: soft delete is an {{UPDATE}}, so Envers logs an UPDATE revision, not DELETE ⇒ history doesn't record "was deleted".
- **Soft delete breaks FK semantics**: "deleted" row still exists and is referenced. If business treats deleted as non-existent, handle at application layer.

> Senior tip: start from **"who needs to re-read this history, when, and for what?"**. Only need last update? Spring Data auditing is enough. Need to reconstruct state at time T? Need Envers. Data must not be deleted by regulation? Need soft delete. Common mistake: enable all three "to be safe", then discover audit tables explode and slow down the system.`,
    follow: [
      'Why doesn\'t JPQL bulk delete use {{@SQLDelete}} and what is the consequence?',
      'How do you allow a customer to re-register an email that was soft-deleted while keeping unique constraint?'
    ]
  }
});