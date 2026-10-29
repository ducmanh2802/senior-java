/*
 * English translation of js/data/quiz-spring.js — task T424. Format: js/core/i18n.js (content overlay).
 * ids: qz-jpa-013 qz-jpa-014 qz-jpa-015 qz-jpa-016 qz-jpa-017 qz-jpa-018 qz-jpa-019 qz-jpa-020 qz-db-007 qz-db-008 qz-db-009 qz-db-010 qz-db-011 qz-db-012 qz-db-013 qz-db-014 qz-db-015 qz-db-016 qz-db-017 qz-db-018 qz-db-019
 */
App.i18n.content({
  "qz-jpa-013": {
    "q": `{{Order}} has {{@OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true) List<OrderItem> items}}. Inside the transaction the code calls {{order.getItems().remove(item)}} and then commits. What happens to the corresponding order_item row?`,
    "options": [
      `Nothing happens, because itemRepo.delete is not called`,
      `The order_id column of that row is set to NULL`,
      `It throws an exception, because the collection of a managed entity must not be modified`,
      `Hibernate issues a DELETE for that order_item row on flush`
    ],
    "explain": `**Correct answer: Hibernate DELETEs the order_item row on flush.**

### Why it is correct
{{orphanRemoval = true}} means: a child removed from the parent's collection becomes an "orphan" and must be deleted. On flush, Hibernate compares the collection with its snapshot, sees the item has disappeared and schedules a DELETE for it.

Comparison:
| Configuration | remove from collection | delete parent |
|---|---|---|
| cascade REMOVE (no orphanRemoval) | does nothing | deletes the children too |
| orphanRemoval = true | DELETE the child | deletes the children too |

### Why the other options are wrong
- **Nothing happens**: true only if there is **no** orphanRemoval, because the owning side is {{OrderItem.order}}; changing only the mappedBy-side collection makes Hibernate update nothing.
- **Set order_id = NULL**: that is the behaviour of a **unidirectional** @OneToMany with a join column (no mappedBy, no orphanRemoval), not this case.
- **Throws an exception**: modifying the collection of a managed entity is perfectly legal. (You only get an error when you **assign** a new collection via setItems(new ArrayList()) with orphanRemoval: Hibernate reports "A collection with cascade=all-delete-orphan was no longer referenced".)

> Senior tip: use orphanRemoval only for a true **composition** relationship (the item does not exist outside the order). Do not use it for a relationship where the child can move to another parent, e.g. an employee changing departments, because "removing them from the old department" would delete the employee too.`
  },
  "qz-jpa-014": {
    "q": `Bidirectional relationship: {{Order.items}} is {{@OneToMany(mappedBy = "order", cascade = CascadeType.ALL)}} and {{OrderItem.order}} is {{@ManyToOne}}. What does the code below store in the order_item.order_id column?
~~~java
Order order = new Order();
OrderItem item = new OrderItem("SKU-1");
order.getItems().add(item);   // item.setOrder(order) is not called
orderRepo.save(order);
~~~`,
    "options": [
      `NULL (or a constraint error if the column is NOT NULL), because OrderItem.order is the owning side and that field is never assigned`,
      `The order id, because Hibernate synchronises both sides of the relationship`,
      `The item is not saved, because cascade only applies when itemRepo.save is called`,
      `Hibernate throws an exception because the two sides of the relationship disagree`
    ],
    "explain": `**Correct answer: order_id is NULL (or a constraint error if it is NOT NULL).**

### Why it is correct
In a bidirectional relationship only the **owning side** (the side without mappedBy, here {{OrderItem.order}}) decides the foreign key value. The {{mappedBy}} side is just a "mirror" used for reading. Cascade ALL causes the item to be persisted together with the order, but when writing the order_id column Hibernate reads {{item.getOrder()}}, sees null and writes NULL.

### Why the other options are wrong
- **Synchronises both sides**: Hibernate does not do that (unless bytecode enhancement with association management is enabled, which is rare). Synchronisation is the code's responsibility.
- **Item is not saved**: cascade ALL from order to items still persists the item.
- **Throws an exception because they disagree**: Hibernate does not check two-sided consistency.

### The right way: a helper method
~~~java
public void addItem(OrderItem item) {
    items.add(item);
    item.setOrder(this);   // update the owning side
}
~~~

> Senior tip: always declare order_id NOT NULL in the DB (Flyway/Liquibase migration) so this kind of bug blows up in tests instead of silently producing orphan rows in production.`
  },
  "qz-jpa-015": {
    "q": `A job imports 1 million CSV rows into the {{product}} table with Spring Data JPA; it runs very slowly and finally fails with OutOfMemoryError. Which changes actually fix the problem? (Choose 3)`,
    "options": [
      `Enable hibernate.jdbc.batch_size (e.g. 50) and hibernate.order_inserts=true`,
      `Call saveAndFlush() for each entity to release memory immediately`,
      `Every batch, call em.flush() and then em.clear() so the persistence context does not grow`,
      `Use id GenerationType.SEQUENCE (with a suitable allocationSize) instead of IDENTITY`,
      `Change every association to FetchType.EAGER to reduce the number of queries`
    ],
    "explain": `**Correct answer: enable JDBC batching; flush + clear per batch; use SEQUENCE instead of IDENTITY.**

### Why they are correct
- **OOM**: the persistence context keeps every persisted entity (with its snapshot) until the end of the transaction. One million entities sit in the heap, and dirty checking walks all of them on every flush. Calling {{flush()}} + {{clear()}} every 50–1000 rows keeps memory flat.
- **Slow**: without batching every INSERT is a separate round trip. {{batch_size}} groups several INSERTs into one send; {{order_inserts}} reorders them so INSERTs for the same table sit next to each other, making the batch more effective.
- **IDENTITY defeats batching**: Hibernate has to INSERT immediately to obtain the id. SEQUENCE with the pooled optimizer ({{allocationSize = 50}}) fetches 50 ids with a single sequence call.

~~~java
for (int i = 0; i < rows.size(); i++) {
    em.persist(toEntity(rows.get(i)));
    if (i % 50 == 49) { em.flush(); em.clear(); } // matches batch_size
}
~~~

### Why the other options are wrong
- **saveAndFlush per entity**: flushing every row kills batching (one INSERT per call) and never clears, so the entities stay in memory.
- **EAGER**: only increases the data that gets loaded, has nothing to do with inserts, and makes the situation worse.

> Senior tip: on PostgreSQL add {{reWriteBatchedInserts=true}} to the JDBC URL so the driver merges the batches into multi-VALUES INSERTs, which is usually another 2–3 times faster. For tens of millions of rows, drop JPA entirely and use {{JdbcTemplate.batchUpdate}} or {{COPY}}: an order of magnitude faster.`
  },
  "qz-jpa-016": {
    "q": `Entity {{Product}} has a hand-assigned {{Long}} id (no generation) and no {{@Version}}. The code below runs in one transaction. Is the {{p.setName("B")}} line saved?
~~~java
Product p = new Product();
p.setId(5L);          // row id 5 already exists in the DB
p.setName("A");
productRepo.save(p);
p.setName("B");
~~~`,
    "options": [
      `Yes, because p became managed after save`,
      `No: save() sees a non-null id and calls merge(), which returns a DIFFERENT managed instance; p stays detached, so the later change is ignored (the DB stores "A")`,
      `No, because save() throws EntityExistsException since id 5 already exists`,
      `Yes, because Spring Data synchronises the object you pass in with the object it returns`
    ],
    "explain": `**Correct answer: no; merge returns a different instance, so p stays detached.**

### Why it is correct
{{SimpleJpaRepository.save}} decides via {{isNew}}: for a wrapper id type and no @Version, an entity is considered new when its id is null. Here the id is 5, so it calls {{em.merge(p)}}. Merge **loads** row 5 (SELECT), copies the state of {{p}} onto that managed instance and **returns the managed instance**. {{p}} is never attached to the persistence context. On flush only the managed instance (name = "A") is updated.

~~~java
Product saved = productRepo.save(p); // always use the return value
saved.setName("B");                  // persisted
~~~

### Why the other options are wrong
- **p becomes managed**: only true when save calls persist (a new entity). With merge it does not.
- **EntityExistsException**: that is what persist does with a duplicate id; save chooses merge, so nothing is thrown.
- **Spring Data synchronises it for you**: no such mechanism exists.

> Senior tip: entities with hand-assigned ids (UUIDs, business codes) make every save cost an extra SELECT because of merge. Fixes: implement {{Persistable<ID>}} with {{isNew()}} backed by a transient flag, or add {{@Version}} (a null version means new).`
  },
  "qz-jpa-017": {
    "q": `On PostgreSQL a repository declares {{@Lock(LockModeType.PESSIMISTIC_WRITE) Optional<Account> findById(Long id)}}. Two transactions call this method with id = 7 at almost the same time. What happens?`,
    "options": [
      `Both read immediately; the transaction that commits second gets an OptimisticLockException`,
      `The second transaction fails immediately because the row is locked`,
      `Hibernate issues SELECT ... FOR UPDATE; the second transaction blocks on that SELECT until the first transaction commits or rolls back (or until the lock timeout, if one is configured)`,
      `Hibernate locks the whole account table with LOCK TABLE`
    ],
    "explain": `**Correct answer: SELECT ... FOR UPDATE; the second transaction waits until the lock is released.**

### Why it is correct
{{PESSIMISTIC_WRITE}} is translated by Hibernate into {{SELECT ... FOR UPDATE}} on PostgreSQL. The lock is held at **row** level until the end of the transaction. The second transaction running the same statement **waits**. When T1 commits, T2 receives the row with the latest data. This is how a read-modify-write operation is serialised, for example debiting a balance.

The wait can be bounded:
~~~java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))
Optional<Account> findById(Long id);
~~~

### Why the other options are wrong
- **OptimisticLockException**: that belongs to optimistic locking ({{@Version}}), not pessimistic.
- **Fails immediately**: only with NOWAIT (lock timeout = 0); by default it waits.
- **Locks the whole table**: FOR UPDATE only locks the rows the SELECT returns.

> Senior tip: a pessimistic lock must be paired with a short transaction. Never call an external API while holding it. Always lock in the **same order** (e.g. ascending id when transferring money between two accounts) to avoid deadlocks, and set a lock timeout so requests fail fast instead of parking the whole thread pool.`
  },
  "qz-jpa-018": {
    "q": `A list screen only needs the {{id}} and {{status}} of 10,000 orders, while the {{Order}} entity has 40 columns. Which approaches SELECT only the columns needed and keep entities out of the persistence context? (Choose 2)`,
    "options": [
      `findAll() then stream().map(o -> new OrderRow(o.getId(), o.getStatus()))`,
      `A closed interface projection: interface OrderRow { Long getId(); String getStatus(); } as the return type of a query method`,
      `JPQL constructor expression: select new com.shop.OrderRow(o.id, o.status) from Order o`,
      `Add @Transactional(readOnly = true) to findAll()`,
      `Mark the remaining 38 columns as @Basic(fetch = FetchType.LAZY)`
    ],
    "explain": `**Correct answer: a closed interface projection and a JPQL constructor expression (DTO).**

### Why they are correct
- **Closed interface projection** (only getters that map straight to properties): Spring Data generates a query that selects just those columns and returns a proxy or a tuple, not a managed entity.
- **Constructor expression**: {{select new ...}} builds the DTO directly from the result; Hibernate does not manage the DTO, keeps no snapshot and does no dirty checking. With a Java record it is even leaner.

### Why the other options are wrong
- **findAll then map**: still SELECTs all 40 columns and loads 10,000 managed entities into the persistence context; the mapping only happens afterwards.
- **readOnly = true**: cuts some dirty checking but still SELECTs all 40 columns and still creates entities.
- **@Basic(fetch = LAZY)**: in Hibernate, lazy loading of a basic column only takes effect with bytecode enhancement; otherwise it is silently ignored. And even when it works, entities are still created and managed.

> Senior tip: a practical rule: **use projections/DTOs for reads that feed a screen, entities for writes**. On wide tables with large TEXT/JSONB columns, moving a list screen to a projection often cuts both query time and heap usage several-fold.`
  },
  "qz-jpa-019": {
    "q": `An entity declares {{@Enumerated private OrderStatus status;}} (no type specified). The enum is currently {{NEW, PAID, SHIPPED}}. A developer inserts {{CANCELLED}} in the middle, making it {{NEW, CANCELLED, PAID, SHIPPED}}. What happens to the existing data?`,
    "options": [
      `Nothing, because Hibernate stores the enum name`,
      `Hibernate migrates the data automatically at startup with ddl-auto=update`,
      `The application cannot start because the enum does not match the DB`,
      `Existing data is misread: the default is EnumType.ORDINAL, so rows that stored 1 (PAID) are now read as CANCELLED and rows that stored 2 (SHIPPED) are read as PAID`
    ],
    "explain": `**Correct answer: existing data is misread, because the default is ORDINAL.**

### Why it is correct
Per the JPA spec, a bare {{@Enumerated}} (or an enum field with no annotation) uses {{EnumType.ORDINAL}}: it stores the position 0, 1, 2. Inserting a constant in the middle shifts the position of every constant after it. The data in the DB does not change, but its meaning does: an order that was paid (1) is now read as cancelled. No error is raised — the most dangerous kind of silent bug.

### Why the other options are wrong
- **Stores the enum name**: only with {{@Enumerated(EnumType.STRING)}}.
- **ddl-auto migrates**: ddl-auto only changes the schema, it never rewrites data; and {{update}} should not be used in production anyway.
- **The application cannot start**: Hibernate does not inspect data contents at startup; ORDINAL 1 is still valid.

### The safe way
~~~java
@Enumerated(EnumType.STRING)
@Column(length = 20)
private OrderStatus status;
~~~
Or use an {{AttributeConverter}} that maps to a fixed code, so renaming an enum constant in code does not affect the DB.

> Senior tip: add an ArchUnit rule or a review-checklist item "bare @Enumerated without STRING is forbidden". On large tables STRING costs a few extra bytes per row, which is a tiny price compared with a payment-state incident.`
  },
  "qz-jpa-020": {
    "q": `Flash sale: a "hot" product receives about 3,000 stock-decrement requests per second, all hitting the same {{stock}} row. The current code loads the entity (which has {{@Version}}), decrements {{quantity}}, saves and retries on conflict. The error rate and latency are very high. Which database-level approach is most appropriate?`,
    "options": [
      `An atomic conditional UPDATE: update stock set quantity = quantity - 1 where product_id = ? and quantity >= 1, checking the number of affected rows (1 means success, 0 means sold out)`,
      `Raise the optimistic retry count to 50`,
      `Use SERIALIZABLE isolation for the stock-decrement transaction`,
      `Load the entity with PESSIMISTIC_WRITE and then call the payment API while holding the lock`
    ],
    "explain": `**Correct answer: a single atomic conditional UPDATE, checking the number of affected rows.**

### Why it is correct
The UPDATE merges the read, the check and the write into **one** statement executed inside the DB. The DB locks the row only for the duration of that statement (plus the rest of the transaction if you keep it short): no read-modify-write over the network and no version conflict to retry. The {{quantity >= 1}} predicate prevents overselling.
~~~java
@Modifying
@Query("update Stock s set s.quantity = s.quantity - 1 where s.productId = :id and s.quantity >= 1")
int decrement(@Param("id") Long id);   // 0 means sold out
~~~

### Why the other options are wrong
- **More retries**: with 3,000 requests fighting over one version most of them lose; more retries only multiply the load on the DB (retry storm).
- **SERIALIZABLE**: on PostgreSQL this produces a stream of serialization failures that must be retried — the same problem as optimistic locking.
- **PESSIMISTIC_WRITE + payment API call**: holding the lock during a slow network call makes every other request queue up and throughput collapses.

> Senior tip: at 3,000 rps on a single row even the atomic UPDATE hits the limit of row locking. Real systems move the "reservation" to Redis ({{DECR}} or a Lua script), or shard the stock into buckets (10 rows, each holding a tenth of the quantity) and write orders through a queue. Note that a bulk update via @Modifying bypasses the persistence context, so do not read a stale Stock entity afterwards.`
  },
  "qz-db-007": {
    "q": `The {{users}} table (PostgreSQL, 5 million rows) has a B-tree index on {{email}}. The query {{SELECT * FROM users WHERE lower(email) = lower(?)}} still does a Seq Scan. What is the correct fix?`,
    "options": [
      `Run ANALYZE so the planner notices the index`,
      `Create an expression index: CREATE INDEX ON users (lower(email))`,
      `Add a USE INDEX hint to the query`,
      `Switch the index to HASH because a hash index supports functions`
    ],
    "explain": `**Correct answer: create an expression index on lower(email).**

### Why it is correct
The index on {{email}} stores the original values in order. The predicate {{lower(email) = ...}} compares **the result of a function**, and the index does not contain those values, so the planner cannot use it and must read every row, compute lower() and compare. An expression index stores {{lower(email)}} itself, so the predicate matches the index contents exactly:
~~~sql
CREATE INDEX CONCURRENTLY idx_users_email_lower ON users (lower(email));
~~~
The query must use **exactly the indexed expression** for the planner to use it.

### Why the other options are wrong
- **ANALYZE**: refreshes statistics, but an index on email simply cannot serve a predicate on lower(email), no matter how good the statistics are.
- **USE INDEX hint**: that is MySQL syntax; PostgreSQL has no standard hints (only via the pg_hint_plan extension), and even forcing it would not help with an index that does not match the expression.
- **HASH index**: a hash index only serves equality on the exact indexed value, it does not understand functions; the problem stays the same.

> Senior tip: alternatives are the {{citext}} type, or normalising the email to lowercase on write (and putting a UNIQUE constraint on the normalised column). MySQL 8.0.13+ also has functional indexes with the double-parenthesis syntax: {{CREATE INDEX idx ON users ((lower(email)))}}. General rule: **do not wrap an indexed column in a function** in the WHERE clause.`
  },
  "qz-db-008": {
    "q": `MySQL: the {{phone VARCHAR(20)}} column is indexed. The query {{SELECT * FROM customers WHERE phone = 912345678}} (compared with a number, no quotes) does a full scan and even returns the row {{"0912345678"}}. Why?`,
    "options": [
      `Because an index on VARCHAR cannot be used for equality comparisons`,
      `Because MySQL automatically adds a leading zero when comparing`,
      `Comparing a string with a number makes MySQL convert the column value to a number for every row (implicit conversion), so the string index cannot be used, and "0912345678" turns into 912345678 so it matches`,
      `Because the table has not been ANALYZEd, so the planner chooses wrong`
    ],
    "explain": `**Correct answer: implicit type conversion turns the string column into a number for every row.**

### Why it is correct
When comparing a string with a number, MySQL converts both sides to numbers (floating point). That means it has to compute {{CAST(phone AS number)}} for **every row**, just like wrapping the column in a function, so the index (ordered by string comparison) is useless. Many different strings collapse to the same number: "0912345678", "912345678", " 912345678" all become 912345678, so the result is also **wrong for the business**.

~~~sql
SELECT * FROM customers WHERE phone = '0912345678'; -- can use the index
~~~

### Why the other options are wrong
- **VARCHAR indexes do not work for equality**: wrong, a string-to-string comparison uses the index normally.
- **Adds a leading zero**: there is no such mechanism; on the contrary, the leading zero is lost when the string is converted to a number.
- **The table was not ANALYZEd**: statistics cannot fix the fact that the index does not apply to a converted expression.

> Senior tip: this bug usually comes from an ORM/JDBC binding the wrong type (setLong for a VARCHAR column), or from joining two tables whose columns mean the same thing but have different types/collations. The clue in MySQL's EXPLAIN is {{type: ALL}} despite the index, together with "Cannot use ref access on index due to type or collation conversion" in SHOW WARNINGS.`
  },
  "qz-db-009": {
    "q": `PostgreSQL: the {{sessions}} table is updated constantly. For a week its size has grown five-fold while the row count is unchanged, and queries get slower. {{pg_stat_activity}} shows a connection in state {{idle in transaction}} since 6 days ago. What is the root cause?`,
    "options": [
      `Autovacuum is disabled by default on PostgreSQL`,
      `The index is corrupted, so a REINDEX is needed`,
      `The table has no primary key, so PostgreSQL cannot overwrite old rows`,
      `The long-open transaction pins an old snapshot, so VACUUM cannot remove the dead tuples that snapshot may still see, and the table bloats`
    ],
    "explain": `**Correct answer: a long-open transaction blocks VACUUM from cleaning up dead tuples, causing bloat.**

### Why it is correct
PostgreSQL uses MVCC: an UPDATE does not overwrite, it creates a **new row version**, and the old one becomes a dead tuple. VACUUM may only remove a dead tuple when **no transaction** still has a snapshot that can see it. A transaction opened 6 days ago pins the "xmin horizon" at that point, so every older version created afterwards cannot be cleaned up. The table and its indexes bloat and queries must read more pages.

~~~sql
SELECT pid, state, xact_start, query
FROM pg_stat_activity
WHERE state = 'idle in transaction' ORDER BY xact_start;
~~~

### Why the other options are wrong
- **Autovacuum is off by default**: wrong, autovacuum is on by default; it still runs but cannot clean up.
- **Broken index**: REINDEX only compacts the index temporarily; the table keeps bloating as long as that transaction stays open.
- **Missing primary key**: MVCC creates a new version for every table, with or without a PK.

### How to handle it
- Terminate that session ({{pg_terminate_backend(pid)}}) and fix the code that forgot to commit/rollback.
- Set {{idle_in_transaction_session_timeout}} (e.g. 5 minutes) to stop it at the source.

> Senior tip: common sources of "stuck transactions": code calling an external API in the middle of a transaction, a debugger paused on a breakpoint in a shared environment, a replication slot nobody reads, or a standby with hot_standby_feedback enabled. Set an alert when the age of the oldest transaction exceeds a few minutes.`
  },
  "qz-db-010": {
    "q": `Compare the REPEATABLE READ isolation level on PostgreSQL and MySQL InnoDB. Which statements are correct? (Choose 2)`,
    "options": [
      `PostgreSQL REPEATABLE READ: if a transaction tries to UPDATE a row that another transaction modified and committed after the snapshot was taken, it gets "could not serialize access due to concurrent update" and must retry`,
      `MySQL defaults to READ COMMITTED, like PostgreSQL`,
      `PostgreSQL REPEATABLE READ still allows phantom reads, as the SQL standard permits`,
      `InnoDB REPEATABLE READ: a plain SELECT reads a snapshot, but UPDATE/DELETE and SELECT ... FOR UPDATE read the latest committed version (current read)`,
      `PostgreSQL SERIALIZABLE is implemented by locking the whole table`
    ],
    "explain": `**Correct answer: PostgreSQL RR raises a serialization failure when updating a row that was modified; InnoDB RR reads a snapshot for SELECT but performs a current read for UPDATE and locking reads.**

### Why they are correct
- **PostgreSQL RR** is true snapshot isolation: every statement sees the same snapshot. If the row you are about to UPDATE was modified and committed by another transaction after your snapshot, PostgreSQL refuses to overwrite it and raises SQLSTATE 40001. That blocks the lost update, at the cost of the application having to retry.
- **InnoDB RR**: a plain SELECT uses a consistent read (a snapshot taken at the first read). But UPDATE/DELETE/SELECT ... FOR UPDATE are **current reads**: they read the latest committed version and take locks. So InnoDB raises no error, and the pattern "SELECT, compute, UPDATE an absolute value" can still lose updates.

### Why the other options are wrong
- **MySQL defaults to READ COMMITTED**: wrong, InnoDB defaults to REPEATABLE READ; PostgreSQL defaults to READ COMMITTED.
- **PostgreSQL RR allows phantoms**: the SQL standard allows it, but PostgreSQL's implementation at RR does not produce phantoms (the snapshot is fixed).
- **SERIALIZABLE locks the whole table**: PostgreSQL uses SSI (Serializable Snapshot Isolation), tracking read-write dependencies with lightweight predicate locks, no table locks; conflicts are reported as error 40001.

> Senior tip: the same piece of code can behave differently under concurrency on two databases. When using RR or SERIALIZABLE on PostgreSQL you must have retry logic for SQLSTATE 40001 (Spring Retry around the {{@Transactional}} method, not inside it).`
  },
  "qz-db-011": {
    "q": `A very frequent query: {{SELECT status FROM orders WHERE customer_id = ?}}. The table has 40 columns. Which index lets PostgreSQL answer with an Index Only Scan (without reading table rows, once the visibility map is up to date)?`,
    "options": [
      `CREATE INDEX ON orders (customer_id) INCLUDE (status)`,
      `CREATE INDEX ON orders (status)`,
      `Two separate indexes: (customer_id) and (status)`,
      `CREATE INDEX ON orders (customer_id) WHERE status IS NOT NULL`
    ],
    "explain": `**Correct answer: index (customer_id) INCLUDE (status), a covering index.**

### Why it is correct
An Index Only Scan is possible only when **every column** the query needs (both WHERE and SELECT) is inside the index. {{customer_id}} is the key used to search, {{status}} lives in the INCLUDE part (stored in the leaf pages, not part of the ordering). PostgreSQL can answer from the index alone and only has to visit the table for pages not yet marked all-visible in the visibility map (which is why regular VACUUM matters). An index on {{(customer_id, status)}} also works.

### Why the other options are wrong
- **Index on status**: does not support searching by customer_id.
- **Two separate indexes**: the planner can combine them with BitmapAnd, but it still has to read the table; and a status index has very low selectivity, so it is nearly useless.
- **Partial index on customer_id**: fast lookup, but the index does not contain the status value, so the table must still be read (Index Scan, not Index Only Scan).

> Senior tip: verify with {{EXPLAIN (ANALYZE, BUFFERS)}}: the "Heap Fetches" line tells you how often the table still had to be read. High Heap Fetches means the visibility map is lagging, so tune autovacuum for that table. Do not INCLUDE too many columns: the index gets bigger and every INSERT/UPDATE costs extra I/O.`
  },
  "qz-db-012": {
    "q": `The {{jobs}} table is a work queue in PostgreSQL, and 10 workers pick jobs from it. Today each worker runs {{SELECT ... WHERE status = 'NEW' ORDER BY id LIMIT 1 FOR UPDATE}} and the workers queue up behind each other. How do you change it so that workers pick different jobs in parallel?`,
    "options": [
      `Drop FOR UPDATE so there is no locking`,
      `Add SKIP LOCKED: SELECT ... FOR UPDATE SKIP LOCKED, so rows already locked by another worker are skipped`,
      `Use FOR UPDATE NOWAIT so workers get an error and retry immediately`,
      `Change the isolation level to SERIALIZABLE`
    ],
    "explain": `**Correct answer: FOR UPDATE SKIP LOCKED.**

### Why it is correct
Without SKIP LOCKED all 10 workers aim at the job with the smallest id: the first one locks it and the other 9 **wait** on that same row, so the system processes jobs serially. With SKIP LOCKED the second worker skips the locked row and takes the next one, so the 10 workers grab 10 different jobs immediately.
~~~sql
UPDATE jobs SET status = 'RUNNING', worker = :w
WHERE id = (
  SELECT id FROM jobs WHERE status = 'NEW'
  ORDER BY id LIMIT 1
  FOR UPDATE SKIP LOCKED
)
RETURNING id, payload;
~~~

### Why the other options are wrong
- **Drop FOR UPDATE**: two workers can read the same job and process it twice (e.g. send an email twice).
- **NOWAIT**: the worker gets an error instead of waiting, but they still fight over the same first row; an error-and-retry loop burns resources without improving throughput.
- **SERIALIZABLE**: adds serialization failures without solving the fact that every worker targets the same row.

> Senior tip: SKIP LOCKED (available in PostgreSQL 9.5+ and MySQL 8.0+) is enough for a queue of a few hundred jobs per second. You need a suitable index (partial index {{WHERE status = 'NEW'}}), periodic cleanup of finished jobs to avoid bloat, and a way to reclaim jobs stuck in RUNNING (a worker dying halfway).`
  },
  "qz-db-013": {
    "q": `MySQL InnoDB, default isolation. Transaction T1 runs {{SELECT * FROM orders WHERE id BETWEEN 10 AND 20 FOR UPDATE}} (id is the primary key and only ids 10, 12, 20 exist) and has not committed yet. T2 runs {{INSERT INTO orders (id, ...) VALUES (15, ...)}}. What happens to T2?`,
    "options": [
      `T2 inserts successfully right away because row 15 does not exist yet and is not locked`,
      `T2 gets a duplicate key error`,
      `T2 blocks and waits, because T1 holds a next-key lock (record lock + gap lock) over the range 10..20, preventing inserts into that gap until T1 ends`,
      `T2 succeeds but T1 gets an error at commit`
    ],
    "explain": `**Correct answer: T2 blocks because of T1's next-key lock / gap lock.**

### Why it is correct
At REPEATABLE READ a range locking read on InnoDB locks not only the existing rows (10, 12, 20) but also the **gaps** between them (gap lock). A record lock plus the gap lock before it is called a next-key lock. The purpose is to prevent phantoms, so that if T1 re-runs the same SELECT it still sees the same set of rows. An INSERT of id 15 falls into the gap (12, 20) and must wait for an insert intention lock until T1 commits/rolls back (or until {{innodb_lock_wait_timeout}}, 50 seconds by default).

### Why the other options are wrong
- **Insert succeeds because the row does not exist**: true, there is no record lock on 15, but the gap lock exists precisely to block this case.
- **Duplicate key**: id 15 does not exist yet, so there is no duplicate.
- **T1 fails at commit**: InnoDB blocks up front with locks; it does not detect conflicts at commit time like optimistic locking.

> Senior tip: gap locks are a common source of "mysterious" deadlocks on MySQL, especially with the pattern "SELECT ... FOR UPDATE to check that a row does not exist, then INSERT" running concurrently: two transactions both hold gap locks and then wait for each other when inserting. Read the LATEST DETECTED DEADLOCK section in {{SHOW ENGINE INNODB STATUS}}. Switching to READ COMMITTED disables most gap locks (except for foreign key and duplicate key checks).`
  },
  "qz-db-014": {
    "q": `You need a migration on the {{orders}} table with 200 million rows (PostgreSQL 15) without downtime, while old and new app versions run side by side during a rolling deploy. Which operations are safe? (Choose 2)`,
    "options": [
      `CREATE INDEX CONCURRENTLY idx_orders_created ON orders (created_at), run outside a transaction block`,
      `ALTER TABLE orders ALTER COLUMN amount TYPE bigint, because changing int to bigint is instantaneous`,
      `ALTER TABLE orders ADD COLUMN source text DEFAULT 'web', because since PostgreSQL 11 a constant default is only written to the metadata and does not rewrite the table`,
      `ALTER TABLE orders RENAME COLUMN note TO remark, because a rename only changes metadata so the old app is unaffected`,
      `Add the FOREIGN KEY directly, because foreign key validation does not lock the table`
    ],
    "explain": `**Correct answer: CREATE INDEX CONCURRENTLY; ADD COLUMN with a constant default.**

### Why they are correct
- **CREATE INDEX CONCURRENTLY**: builds the index over several passes without holding a lock that blocks writes, so INSERT/UPDATE keep running. The trade-offs: it is slower, cannot run inside a transaction block (you must disable the migration tool's transaction for this step), and if it fails it leaves an INVALID index that must be dropped and rebuilt.
- **ADD COLUMN ... DEFAULT constant**: since PostgreSQL 11 a non-volatile default is stored in the catalog and old rows carry the value "virtually", so 200 million rows are not rewritten. It still needs a brief ACCESS EXCLUSIVE lock, so set a short {{lock_timeout}} to avoid queueing behind a long query.

### Why the other options are wrong
- **int to bigint**: rewrites the whole table under an ACCESS EXCLUSIVE lock, potentially locking it for hours. The safe path: add a new column, backfill in batches, sync with a trigger, then swap.
- **RENAME COLUMN**: fast for the DB, but an old app version still querying the {{note}} column breaks immediately. Use expand/contract: add the new column, write both, move reads over, then drop the old one.
- **Plain FOREIGN KEY**: has to scan the whole table to validate while holding a write-blocking lock. The safe path: {{ADD CONSTRAINT ... NOT VALID}} and then {{VALIDATE CONSTRAINT}} as a separate step (validation needs a weaker lock).

> Senior tip: always {{SET lock_timeout = '3s'}} for migrations on hot tables. A waiting ALTER blocks every query that arrives after it, so a migration that "only takes 1 ms" can take the system down if it queues behind a 10-minute reporting query.`
  },
  "qz-db-015": {
    "q": `The {{customers}} table has 10 rows: 3 rows have {{email}} NULL and the other 7 have an email, 2 of which are identical. What is the result of {{SELECT COUNT(*), COUNT(email), COUNT(DISTINCT email) FROM customers}}?`,
    "options": [
      `10, 10, 9`,
      `7, 7, 6`,
      `10, 7, 7`,
      `10, 7, 6`
    ],
    "explain": `**Correct answer: 10, 7, 6.**

### Why it is correct
- {{COUNT(*)}} counts **rows**, ignoring column values: 10.
- {{COUNT(email)}} counts values that are **not NULL**: 10 - 3 = 7.
- {{COUNT(DISTINCT email)}} counts distinct non-NULL values: 7 values where one duplicate merges, so 6.

### Why the other options are wrong
- **10, 10, 9**: treats NULL as a value that gets counted, which is wrong for every aggregate except COUNT(*).
- **7, 7, 6**: COUNT(*) does not skip rows containing NULL.
- **10, 7, 7**: forgets that DISTINCT merges the two identical emails.

### Related
Every aggregate ({{SUM}}, {{AVG}}, {{MIN}}, {{MAX}}) ignores NULL. {{AVG(score)}} on a column that has NULLs is the average of the values present, not the sum divided by the row count. To treat NULL as 0, use {{AVG(COALESCE(score, 0))}}.

> Senior tip: in PostgreSQL, {{COUNT(*)}} on a large table still has to scan (because of MVCC there is no built-in counter). For a dashboard that only needs an estimate, use {{reltuples}} from {{pg_class}}; for pagination, consider dropping "total page count" altogether.`
  },
  "qz-db-016": {
    "q": `You want the customers who have never placed an order: {{SELECT * FROM customers WHERE id NOT IN (SELECT customer_id FROM orders)}}. The orders table has a few rows with {{customer_id}} NULL (guest orders). What does the query return?`,
    "options": [
      `No rows at all, because when NOT IN meets a NULL in the list, every comparison yields UNKNOWN`,
      `Exactly the list of customers without orders, NULL is skipped`,
      `An error, because the subquery returns NULL`,
      `All customers`
    ],
    "explain": `**Correct answer: no rows at all.**

### Why it is correct
{{x NOT IN (a, b, NULL)}} is equivalent to {{x <> a AND x <> b AND x <> NULL}}. Under SQL three-valued logic {{x <> NULL}} is always UNKNOWN. TRUE AND UNKNOWN is UNKNOWN, and WHERE keeps only rows that are TRUE, so **every row is filtered out**. No error, no warning: the query silently returns an empty set.

### Why the other options are wrong
- **NULL is skipped**: that is what the author expected, but NOT IN does not behave that way (IN is not affected in this way).
- **Raises an error**: a subquery returning NULL is perfectly legal.
- **Returns all customers**: the predicate is never TRUE, so the result is the exact opposite.

### The correct way
~~~sql
SELECT c.* FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
~~~
NOT EXISTS is unaffected by NULL, and PostgreSQL/MySQL usually optimise it into an efficient anti-join.

> Senior tip: add to your SQL review checklist: "NOT IN with a subquery is a red flag". This bug usually only shows up once real data first contains a NULL, long after go-live, so tests with clean data never catch it.`
  },
  "qz-db-017": {
    "q": `PostgreSQL runs on an 8 vCPU machine. The service has 20 pods, each with HikariCP {{maximumPoolSize = 50}}. Under high load the DB CPU sits at 100%, latency explodes and sometimes "too many clients already" errors appear. Which approach is the most correct?`,
    "options": [
      `Raise PostgreSQL max_connections to 2000 and each pod's pool to 100`,
      `Shrink each pod's pool (e.g. 5–10) so the total number of connections actually running in parallel is close to what the DB can handle, and consider PgBouncer in transaction pooling mode`,
      `Disable the connection pool so every request opens its own connection`,
      `Enable autoscaling to add more pods under load`
    ],
    "explain": `**Correct answer: shrink each pod's pool and consider PgBouncer.**

### Why it is correct
20 x 50 = 1,000 connections to an 8 vCPU database. Each PostgreSQL connection is a separate **process**, consuming RAM and causing context switches. Only a few dozen queries can really run in parallel effectively on 8 cores; the rest fight for CPU and locks and make **every** query slower. HikariCP's rule of thumb is {{connections = core_count * 2 + effective_spindle_count}}, roughly 20 for the whole DB. Shrinking the pool makes requests wait in the app-side pool (cheap) instead of inside the DB (expensive); throughput usually **increases** and latency drops.

### Why the other options are wrong
- **Raise max_connections and the pool**: pouring fuel on the fire, more processes competing for CPU, possibly running out of RAM.
- **Disable the pool**: each PostgreSQL connection takes a few ms to establish (forking a process, TLS, auth), and with no limit the DB gets overwhelmed even faster.
- **Autoscale more pods**: every new pod adds 50 connections and makes the DB worse. The bottleneck is the DB, not the app.

> Senior tip: with PgBouncer transaction mode, note that server-side prepared statements (need PgBouncer 1.21+ or must be disabled in the driver), session-level SET and advisory locks no longer have the expected semantics. Monitor {{hikaricp_connections_pending}}: a high pending count while the DB is idle is the signal to grow the pool.`
  },
  "qz-db-018": {
    "q": `You move the {{events}} table (PostgreSQL) to declarative RANGE partitioning on {{created_at}} (one partition per month). Which statement is correct?`,
    "options": [
      `Every query is faster because the data is split into smaller pieces`,
      `You can keep PRIMARY KEY (id) on the parent table as before without changing anything`,
      `A primary key or unique constraint on a partitioned table must include the partition key, e.g. PRIMARY KEY (id, created_at); and a query that does not filter on created_at has to scan every partition`,
      `Partitioning automatically distributes data across multiple servers`
    ],
    "explain": `**Correct answer: the PK/unique constraint must include the partition key; a query that does not filter on the partition key scans every partition.**

### Why it is correct
PostgreSQL has no global index for a partitioned table; every partition has its own index. To guarantee uniqueness using only local indexes, the constraint must include the partition key (then two rows with a duplicate key are guaranteed to land in the same partition). So {{PRIMARY KEY (id)}} is rejected and it must be {{(id, created_at)}}.

Partition pruning only works when the WHERE clause filters on {{created_at}}. A query {{WHERE user_id = ?}} without created_at has to scan the index of **every** partition (36 partitions means 36 index scans).

### Why the other options are wrong
- **Every query is faster**: only queries that benefit from pruning are; queries that do not filter on the partition key can be slower than on a regular table.
- **Keep PK (id)**: rejected by PostgreSQL as explained above.
- **Distributes data across servers**: partitioning lives inside one instance; distributing is sharding (Citus, the application layer).

> Senior tip: the biggest win of time-based partitioning is usually **data lifecycle**: remove old data with {{DETACH PARTITION}} then {{DROP TABLE}} in a few milliseconds, instead of a DELETE over hundreds of millions of rows that causes bloat. Use pg_partman or a job that pre-creates the partitions for the coming months, otherwise INSERT fails when no partition matches (or everything lands in the DEFAULT partition).`
  },
  "qz-db-019": {
    "q": `The {{documents}} table has 20 million rows and an {{is_deleted boolean}} column; 99.5% of the rows are false. A frequent query is {{SELECT ... WHERE is_deleted = true AND deleted_at < now() - interval '30 days'}} (a cleanup job). Which index is most appropriate?`,
    "options": [
      `B-tree on is_deleted, because a column in the WHERE clause should have an index`,
      `No index is needed because a boolean column cannot be indexed`,
      `Hash index on is_deleted`,
      `Partial index: CREATE INDEX ON documents (deleted_at) WHERE is_deleted = true`
    ],
    "explain": `**Correct answer: a partial index containing only the rows where is_deleted = true.**

### Why it is correct
A partial index only stores the rows that match its WHERE clause: about 100,000 rows instead of 20 million. The index is small, fits in RAM, and writes of is_deleted = false rows (99.5% of operations) pay nothing for index maintenance. The query's {{is_deleted = true}} predicate matches the index predicate so the planner can use it, then filters further on {{deleted_at}}.

### Why the other options are wrong
- **B-tree on is_deleted**: a 20-million-entry index with just 2 distinct values. The planner can use it for the rare value (true), but the index is huge relative to the benefit, every INSERT/UPDATE must maintain it, and it does not help with the deleted_at predicate.
- **Boolean cannot be indexed**: wrong, PostgreSQL allows an index on any column with a suitable operator class, and boolean has one.
- **Hash index**: also holds all 20 million entries and cannot support range comparisons on deleted_at.

> Senior tip: a partial index suits the "rare status" pattern very well: {{WHERE status = 'PENDING'}}, {{WHERE processed_at IS NULL}}. Note that the query must contain a predicate the planner can prove implies the index predicate, and a bind parameter like {{is_deleted = ?}} can stop a generic plan from using the partial index.`
  }
});
