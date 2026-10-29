/*
 * English translation of js/data/lessons-jpa.js — task T274, retranslated by T497.
 * Format: js/core/i18n.js (content overlay).
 * ids: lesson-jpa-001 lesson-jpa-002 lesson-jpa-003 lesson-jpa-004 lesson-jpa-005
 */
App.i18n.content({
  'lesson-jpa-001': {
    title: 'Persistence context and dirty checking',
    goals: [
      'Explain the identity map (first-level cache) and why finding the same id twice returns the same object',
      'Understand the snapshot and dirty checking: why a changed managed entity needs no save call',
      'Tell flush apart from commit, and know the new/managed/detached/removed states',
    ],
    body: `### Quick idea: the persistence context is Hibernate's desk
Every {{EntityManager}} (called a {{Session}} in Hibernate) has a **persistence context**: a memory area holding the entities it currently **manages**. In Spring, one transaction ({{@Transactional}}) normally uses one persistence context. Picture it as a desk: any entity lying on the desk is watched by Hibernate, and when it is time to **flush**, the changes on it are written to the database automatically.

### Identity map (first-level cache)
Inside the persistence context there is a map: the key is (entity type, id) and the value is the object. When you call {{em.find(Account.class, 7L)}}:
1. Hibernate looks in the map first. If the entry exists it returns **that very object** and runs no SQL.
2. If it does not exist, Hibernate runs a SELECT, creates the object, puts it in the map and returns it.

So inside one transaction, {{find}} with the same id twice gives the same instance ({{a1 == a2}} is true). Because of that, two different objects can never represent the same row and overwrite each other. This cache lives only inside one persistence context; another transaction has its own map. A JPQL query always runs SQL, but a row whose id is already in the map is returned as the existing managed object (your changes that are not flushed yet are not overwritten).

### Snapshot and dirty checking
When an entity is loaded, Hibernate also keeps a **snapshot**: a copy of the column values at read time. A setter only changes the Java object in RAM and runs no SQL. At flush time Hibernate walks the managed entities and compares each field with the snapshot; any entity with a different field produces an UPDATE. That is **dirty checking**: for a managed entity you **do not need** to call {{save}}.

~~~java
@Transactional
public void rename(long id) {
    Account a = em.find(Account.class, id); // SELECT; a is managed, snapshot = {name: "Lan"}
    a.setName("Mai");                       // only the object in RAM changes, no SQL yet
}                                           // commit → flush: compare with the snapshot, name differs → UPDATE
~~~

By default Hibernate emits an UPDATE containing **every column** of the entity: the statement is fixed, so the prepared statement can be reused. {{@DynamicUpdate}} puts only the changed columns into the UPDATE: useful for tables with a huge number of columns, but every combination of columns is a different SQL statement, so the statement cache becomes less effective. Bytecode enhancement can record the changed fields right inside the setter, so the whole snapshot does not have to be compared, but it must be enabled in the build; do not assume a project has it. Change settings like these only after measuring.

### Flush is not commit
**Flush** = send the SQL statements that are waiting down to the database, **inside** the current transaction. **Commit** = end the transaction: the changes become durable and other transactions can see them. Flush happens:
- automatically before commit;
- before a JPQL/HQL query that could be affected by pending changes (FlushMode AUTO), so the query sees the latest data;
- when you call {{em.flush()}}.

After a flush the transaction can still roll back, and every flushed SQL statement is undone. So a flush is not a signal that "the data is saved".

| State | Meaning | What happens when a field changes? |
|---|---|---|
| New/transient | object just created with {{new}}, not persisted | nobody tracks it; it needs {{persist}} or a cascade |
| Managed | inside the persistence context | detected at flush, UPDATE issued automatically |
| Detached | used to be managed, but the context was closed, cleared or the entity detached | not tracked, not written automatically |
| Removed | {{remove}} was called | DELETE at flush |

### Merge does not make the input object managed
{{em.merge(detached)}} finds (or loads) the managed instance with the same id, **copies the state** from your object into that instance, and returns the managed instance. The object you passed in **stays detached**. Spring Data {{save()}} calls merge when the entity is not "new" (id is not null), so use the returned value: {{account = repo.save(account)}}.

### Common production bugs
- **Long transaction, big import**: every managed entity costs RAM for the object and the snapshot, and every flush compares all of them. Importing one million rows in a single transaction easily runs out of memory or flushes very slowly. Do it in chunks (for example 500 entities), calling {{flush()}} then {{clear()}} per chunk. You must flush **before** clearing, otherwise changes that were never sent are lost.
- **Changing an entity after clear**: the old reference is detached now, and the setter has no effect.
- **Bulk JPQL** ({{UPDATE Account a SET a.status = ...}}) runs straight against the database and bypasses the persistence context: managed entities keep the old value. Use {{@Modifying(clearAutomatically = true)}} or clear yourself.
- **Read-only work**: {{@Transactional(readOnly = true)}} lets Hibernate skip keeping snapshots and skip dirty checking for the entities it reads, saving RAM and CPU.

> The exercise simulates the identity map and the snapshot in plain Java. The snapshot must be a **copy of the values**: if it held the same object, a setter would change both and no change would ever be detected. After each flush the snapshot must be updated so the next flush does not repeat the UPDATE.

### Interview relevance
A common question: "Why does changing an entity produce an UPDATE without calling save?" Answer: the entity is managed, it has a snapshot, and dirty checking runs at flush. Then mention that flush is not commit, that a detached object is not tracked, that merge returns a different instance, and how to handle big batches by flushing and clearing per chunk.`,
    exercises: [
      {
        title: 'Identity map and dirty fields',
        prompt: `Implement {{UnitOfWork}}, which simulates the persistence context:
- {{load(id, name, email)}}: if the id was already loaded, return **the same object** as before (ignore the name/email passed in); otherwise create an {{Account}}, store it in the identity map and store a snapshot (a copy of the name and email values).
- {{flush()}}: for every loaded entity (in load order), compare the current fields with the snapshot and return a map id → list of changed field names in the order {{"name"}}, {{"email"}}. An entity with no change is not in the map. After the flush, update the snapshot of every entity that changed.`,
        hints: [
          'A Map of id to Account is the identity map; a LinkedHashMap keeps the load order.',
          'The snapshot must be a copy of the values (for example List.of(name, email)), never a reference to the Account itself.',
          'After detecting a change, overwrite the snapshot with the current values.',
        ],
        explain: `Flush compares the current state with the snapshot. Two mistakes are common:
- **The snapshot points at the same object**: a setter changes the object and the "snapshot" changes with it, so no change is ever detected. Hibernate stores the snapshot as a copied array of values.
- **Forgetting to update the snapshot after flush**: the next flush reports the change again, which is the same as Hibernate sending the UPDATE twice.

The last test shows that dirty checking compares **values** and does not count setter calls: change a field and change it back and there is no UPDATE.`,
      },
    ],
    check: [
      {
        q: 'When does Hibernate dirty checking usually run?',
        options: ['Right inside the setter, on every field assignment', 'When the JVM shuts down', 'At flush time (before commit, before an affected query, or when flush() is called)', 'Inside the getter'],
        answer: 2,
        explain: `Hibernate compares the current state with the snapshot at **flush**; a commit triggers a flush first. A setter on an entity is usually plain Java code and sends no SQL (unless bytecode enhancement is enabled, and even then the setter only **marks** the field dirty while the SQL still waits for flush). Getters have nothing to do with dirty checking. Shutting down the JVM does not flush anything; a transaction that never commits loses its changes.`,
      },
      {
        q: 'You call {{em.clear()}} and then change a field on an entity you loaded earlier. What happens at commit?',
        options: ['No UPDATE, because the entity is detached', 'Hibernate updates it automatically because the snapshot is still there', 'A LazyInitializationException is thrown as soon as the setter runs', 'Hibernate merges the entity back automatically'],
        answer: 0,
        explain: `clear() detaches every entity and drops the snapshots, so changes made afterwards are not tracked. The snapshot went away together with the persistence context. A setter on an ordinary field does not throw LazyInitializationException (only touching a lazy association that is not loaded does). Hibernate never merges on its own; you must call {{merge}} and use the instance it returns.`,
      },
      {
        q: '{{Account saved = em.merge(detached);}} Which statement is correct?',
        options: ['detached becomes managed', 'saved and detached are always the same object', 'saved is the managed instance; detached stays detached', 'merge runs the UPDATE immediately'],
        answer: 2,
        explain: `merge copies the state into the managed instance (loading it from the database when needed) and returns that instance; the input object does not change state, so they are two different objects. The UPDATE is only sent at flush if the state differs from the snapshot, not the moment merge is called.`,
      },
    ],
  },

  'lesson-jpa-002': {
    title: 'N+1 queries and batch-loading associations',
    goals: [
      'Recognise N+1 and be able to measure the query count',
      'Choose between fetch join, EntityGraph, batch fetching and DTO projection',
      'Understand the pagination trap when fetch joining a collection',
      'Load parents and children with exactly two queries',
    ],
    body: `### Quick idea
You load 80 orders with one query, then inside a loop you call {{order.getLines()}}. Every call makes Hibernate fire one more SELECT for the lines of that order. The total is 1 + 80 = 81 queries. That is **N+1**: 1 query for the parent list and N queries for the children. Each query may cost only 1 ms in the database, but once you add the network round-trip and the connection checkout, 81 queries can turn a 10 ms API into 150 ms; with 1,000 parents it becomes seconds.

~~~java
List<Order> orders = orderRepo.findAll();   // query 1: SELECT ... FROM orders
for (Order o : orders) {
    total += o.getLines().size();           // every iteration: SELECT ... FROM order_line WHERE order_id = ?
}
~~~

A test with a single order only shows 2 queries, which is why N+1 often slips through review. To catch it, the test needs many parents and must check that the query count **does not grow with** the number of parents.

### Neither LAZY nor EAGER cures N+1 by itself
- {{LAZY}} only **postpones** loading until the association is touched. Touching it inside a loop means one query per iteration.
- {{EAGER}} means "must be ready when the entity is loaded", **not** "uses a JOIN". With {{em.find}} Hibernate can JOIN; but with the JPQL {{SELECT o FROM Order o}} the SQL only reads the orders table, and then Hibernate has to run an **extra** query for the EAGER association of every order: still N+1, and it now happens everywhere an Order is loaded, even where that data is not needed.
- Per the JPA spec, {{@ManyToOne}} and {{@OneToOne}} default to EAGER. So write {{fetch = FetchType.LAZY}} explicitly and choose the fetch plan per use case.

### Ways to fix it
1. **Fetch join**: {{SELECT o FROM Order o JOIN FETCH o.lines WHERE o.status = :s}} returns parents and children in one query. Since Hibernate 6 the result deduplicates parents automatically (no DISTINCT needed as in Hibernate 5).
2. **EntityGraph**: {{@EntityGraph(attributePaths = "lines")}} on the repository method declares the association that use case needs; Hibernate generates the JOIN.
3. **Batch fetching**: {{@BatchSize(size = 50)}} on the collection, or the {{hibernate.default_batch_fetch_size}} setting. When you touch the lines of the first order, Hibernate loads the lines of up to 50 pending orders at once with {{WHERE order_id IN (...)}}. For 80 orders: 1 + 2 queries instead of 81, without touching the query.
4. **DTO projection**: select only the columns the screen needs ({{SELECT new com.shop.OrderRow(o.id, o.total) FROM Order o}}); no entity is created and there is no lazy state.
5. **Two queries written by hand**: fetch the orders, collect the ids, fetch all the lines with {{IN (:ids)}}, then group them in RAM. This is the exercise below.

~~~text
orders = queryOrders()                 // query 1
lines  = queryLinesByOrderIds(ids)     // query 2: WHERE order_id IN (1, 2, 3)
group lines by orderId                 // joined in RAM, no query inside the loop
~~~

| Option | Benefit | Pitfall |
|---|---|---|
| Fetch join / EntityGraph | 1 query | row multiplication; paginating a fetched collection is unsafe |
| Batch fetching | little code change, query count around N / batch size | still many queries when N is huge |
| DTO projection | the lightest | one query per screen |
| Two queries + IN | full control | a very long IN hits limits (Oracle 1,000 elements, SQL Server about 2,100 parameters), so you must split it into batches |

### The classic trap: fetch joining a collection plus pagination
A JOIN returns one row per (order, line) pair: an order with 3 lines occupies 3 rows. If you put {{LIMIT 20}} into that SQL you may receive 20 rows belonging to 7 orders, and the last order loses some of its lines. Hibernate knows this, so when a {{JOIN FETCH}} of a collection is combined with {{setMaxResults}} (or {{Pageable}}), it does **not** push the LIMIT into SQL: it loads the **whole** result and paginates in RAM, only printing warning HHH90003004. A one-million-row order table will run out of memory. Turn on {{hibernate.query.fail_on_pagination_over_collection_fetch=true}} to turn that warning into an exception in tests.

The right way: paginate **on the parents only** (query 1 fetches 20 orders), then load the lines for those 20 ids (a fetch join with {{WHERE o.id IN :ids}}, or batch fetching).

### Production
- Turn on SQL logging in dev/test (logger {{org.hibernate.SQL}}) and count the queries; you can also use {{hibernate.generate_statistics}} or a DataSource proxy library to assert the query count in integration tests.
- Fetch joining two {{List}} collections at the same time throws {{MultipleBagFetchException}}; switching to {{Set}} removes the exception, but the row count becomes the **product** of the two collection sizes (a Cartesian product). Load each collection with its own query.
- The query count is not the only goal: one query returning two million rows is worse than three small queries. Look at the row count, the payload, the database time and the heap as well.

### Interview relevance
"How do you find and fix N+1?" Name the symptom (the query count grows with the number of parents), how you measure it (SQL log, statistics, APM), then pick a solution per use case: fetch join or EntityGraph for a detail page, batch fetching or two queries for a list, DTO projection for a read-only screen. Also explain the pagination trap with a collection fetch. Do not answer "switch to EAGER".`,
    exercises: [
      {
        title: 'Bring N+1 down to two queries',
        prompt: `{{Repo}} counts the calls: {{a}} for {{orders()}}, {{b}} for {{lines(ids)}}. Implement {{Service.load()}} to return a map orderId → list of skus, in the order the orders were returned:
- Call {{orders()}} **once** and {{lines(ids)}} **once** with the set of all order ids (never inside a loop).
- An order without lines is still present in the map with an empty list.
- If there are no orders at all, do **not** call {{lines}} and return an empty map.`,
        hints: [
          'Create an entry (an empty list) for every order before attaching the lines.',
          'Collect the ids into one Set and call lines(ids) exactly once, outside the loop.',
          'Check the empty case before calling lines.',
        ],
        explain: `Query 1 loads the parents, query 2 loads every child by the id set, then you group by {{orderId}} in RAM. Creating the entries first keeps orders without lines in the result (like a LEFT JOIN). Skipping query 2 when the id set is empty matters because an empty {{IN ()}} is invalid SQL on many databases.

A common mistake: calling {{lines(Set.of(o.id()))}} inside the loop, which is exactly N+1. In production you also have to split the id set into batches (for example 500 ids) when the list is large, so you do not exceed the database parameter limit. That is also what Hibernate batch fetching does underneath.`,
      },
    ],
    check: [
      {
        q: 'Does switching an association to {{FetchType.LAZY}} remove N+1 by itself?',
        options: ['Yes, LAZY always generates a JOIN', 'Yes, because LAZY forces the second-level cache', 'No, touching the association of each parent in a loop still fires one query per iteration', 'LAZY cannot be used with collections'],
        answer: 2,
        explain: `LAZY only postpones the moment of loading; touching it in a loop is still N queries. You need a fetch join, EntityGraph, batch fetching or a projection. LAZY does not generate a JOIN (that is the job of a fetch join), it has nothing to do with the second-level cache, and collections are LAZY by default anyway.`,
      },
      {
        q: 'A query has {{JOIN FETCH o.lines}} with pagination of 20 orders per page. How does Hibernate 6 handle it?',
        options: ['It loads the whole result and slices the page in RAM, only printing a warning (unless fail_on_pagination_over_collection_fetch is on)', 'It pushes LIMIT 20 into SQL and always returns 20 orders with complete lines', 'It splits into two queries by itself: paginate orders, then load lines', 'It throws a JPQL compile error'],
        answer: 0,
        explain: `The JOIN multiplies rows by the number of lines, so a SQL LIMIT would cut through the middle of a collection. Hibernate therefore paginates in RAM and warns HHH90003004, which is very dangerous on big tables. It does not split into two queries by itself (that is your job), and the JPQL is still valid so there is no compile error.`,
      },
      {
        q: 'With {{hibernate.default_batch_fetch_size=50}} you load 120 orders and then walk the lines of each order. About how many queries?',
        options: ['1', '121', '2', 'About 4: 1 order query plus about 3 IN queries for the lines'],
        answer: 3,
        explain: `Batch fetching groups at most 50 keys at a time: 120 orders need about 3 IN queries for the lines, plus 1 query for the orders. The exact number can differ slightly depending on how Hibernate splits the batches, but it no longer grows per order. 121 is N+1 without batching; 1 or 2 queries is only achieved with a fetch join or a hand-written IN query that is not split.`,
      },
    ],
  },

  'lesson-jpa-003': {
    title: 'Optimistic locking with @Version',
    goals: [
      'Explain lost update and the version condition inside the UPDATE statement',
      'Know which exception is thrown and where to catch it in Spring',
      'Retry correctly: a new transaction, fresh state, the intent reapplied, a bounded number of attempts',
    ],
    body: `### Lost update: why locking is needed
Two employees open the same product with a stock of 10. A sells 3 units, so computes 7; B adds 5 units, so computes 15. A saves first (7), then B saves (15). The result 15 is wrong, it should be 12: the change made by A was **silently overwritten**. That is a **lost update**. The default transaction isolation (READ COMMITTED) cannot prevent it because both UPDATE statements are perfectly valid.

### How @Version works
Add a version column to the entity:

~~~java
@Entity
class Product {
    @Id Long id;
    int stock;
    @Version int version;   // Hibernate manages it, the application does not bump it
}
~~~

When Hibernate flushes a change it produces:

~~~sql
UPDATE product SET stock = ?, version = 5 WHERE id = ? AND version = 4
~~~

The UPDATE only matches the row if the version in the database **is still 4**, meaning nobody has modified it since you read it. The database performs the check and the write in **one atomic statement**, so there is no gap between "check" and "write". If the affected row count is 0 (someone already bumped the version, or the row was deleted), Hibernate throws {{StaleObjectStateException}}, which JPA wraps into {{OptimisticLockException}} and Spring translates into {{ObjectOptimisticLockingFailureException}}.

~~~text
A reads v4 → UPDATE ... WHERE version=4 → 1 row → v5, success
B reads v4 → UPDATE ... WHERE version=4 → 0 rows → exception
B opens a new transaction → reads v5 → reapplies "add 5" → UPDATE ... WHERE version=5 → success
~~~

It is called "optimistic" because no lock is held while the user thinks or while the code computes; a conflict is only detected at write time. @Version is also checked when {{merge}} is called with a detached entity: if the version in the object is older than the one in the database, the merge is rejected too, which is very useful for web forms that stay open a long time.

### Retrying correctly
You cannot resend the UPDATE with the old version; it would fail forever. A proper retry means:
1. Open a **new transaction** (the old one is marked rollback-only and cannot be reused).
2. Read the new state (the new version).
3. Reapply the **intent** ("add 5"), not the **result** you computed (15).
4. Bound the number of attempts (for example 3), with a small backoff under high load.

That is why the retry must sit **outside** the {{@Transactional}} method: for example another method that calls the transactional service through the proxy, or Spring Retry's {{@Retryable}} on the outer layer. Catching the exception inside the same transaction and trying again is wrong.

Do not retry blindly when the operation has side effects outside the database (sending email, calling a payment gateway): use an idempotency key or an outbox. And not every conflict should be retried: if the user's decision was based on data that has changed since (a new price, a new quota), return HTTP 409 so they can look again.

| Strategy | Choose when | The cost |
|---|---|---|
| Optimistic (@Version) | conflicts are rare, read-heavy and write-light, long operations | you must retry or return 409 |
| Pessimistic ({{PESSIMISTIC_WRITE}}, SELECT ... FOR UPDATE) | high contention on a few hot rows, short processing sections | holds locks, waits, timeouts, deadlocks |

### Production traps
- **Bulk JPQL** ({{UPDATE Product p SET p.stock = 0}}) does not bump the version by itself, so other transactions never detect a conflict. Bump it yourself ({{SET p.version = p.version + 1}}; HQL has the {{UPDATE VERSIONED}} syntax) and clear the persistence context.
- **Unbounded retries** raise the load exactly when the database is already contended. Measure the conflict rate and cap the number of attempts.
- **@Version only protects a single row.** An invariant spanning several rows (for example at least two people on a shift) needs a unique/check constraint or another kind of lock.
- **Hot rows** (one counter that every request updates) conflict constantly; optimistic locking does not fit, consider an atomic {{SET stock = stock - 1 WHERE stock > 0}} or a pessimistic lock.

### Interview relevance
Describe the lost update, the conditional version UPDATE, the exception that gets thrown, then the retry recipe: outside the transaction, read again, reapply the intent, bounded. Also say when pessimistic locking wins, and mention the bulk update trap.`,
    exercises: [
      {
        title: 'Version check and retry',
        prompt: `Simulate a row with {{value}} and {{version}} (both start at 0):
- {{update(expectedVersion, delta)}}: if the current {{version}} differs from {{expectedVersion}}, return {{false}} and change **nothing**; if they match, add {{delta}} to value, bump version by 1 and return {{true}} (the same as UPDATE ... WHERE version = ?).
- {{add(delta)}}: try at most **3 times**; each attempt **reads the current version** and then calls {{update}}. Stop when it succeeds. After 3 failed attempts throw {{IllegalStateException}}.`,
        hints: [
          'update: compare the version first; on a mismatch return false immediately without touching value.',
          'add: read the version **inside** the loop, not once before it.',
          'After 3 failed attempts throw new IllegalStateException(...).',
        ],
        explain: `{{update}} simulates the compare-and-set that the database performs in one UPDATE with a version condition. The most common mistake is reading the version **once before the loop**: after a conflict every later attempt reuses the old version and fails again. The {{flaky}} test catches exactly that bug.

In a real application each attempt is a new transaction (the entity is read again from the database) and the retry loop lives outside the @Transactional method. Limiting it to 3 attempts stops the load from multiplying when contention is high.`,
      },
    ],
    check: [
      {
        q: 'What should a retry after an {{OptimisticLockException}} do?',
        options: ['Resend the UPDATE with the old version', 'Read fresh state in a new transaction and reapply the intent, with a bounded number of attempts', 'Delete the version column to stop the error', 'Catch the exception and continue in the same transaction, retrying until it succeeds'],
        answer: 1,
        explain: `The old version will certainly keep failing. The current transaction is marked rollback-only, so you cannot continue inside it, and unbounded retries multiply the load. Deleting the version goes back to lost updates. The correct way is a new transaction, a fresh read, the intent reapplied, with a limit.`,
      },
      {
        q: 'Does {{@Query("UPDATE Product p SET p.stock = 0") @Modifying}} bump {{@Version}} on its own?',
        options: ['Yes, Hibernate always bumps the version', 'Only on PostgreSQL', 'Yes, when you retry', 'No; bulk JPQL bypasses entities, so you must set version = version + 1 yourself (or use UPDATE VERSIONED in HQL) and clear the context'],
        answer: 3,
        explain: `Bulk DML runs straight against the database and never passes through a managed entity, so the automatic versioning does not apply. The behaviour does not depend on the database type, and retrying has nothing to do with it. If you do not bump the version yourself, transactions holding the old version will overwrite the row without anyone noticing.`,
      },
      {
        q: 'When is pessimistic locking ({{SELECT ... FOR UPDATE}}) a better fit than @Version?',
        options: ['When a few rows are updated by many requests at once and the processing section is short', 'When the user keeps an edit form open for 10 minutes', 'When conflicts are extremely rare', 'When you want to avoid deadlocks completely'],
        answer: 0,
        explain: `High contention on hot rows makes optimistic locking fail again and again, so retries pile up; a short lock is more effective there. Holding a database lock while a form stays open for 10 minutes blocks everyone else for that whole time, so optimistic locking fits better. Rare conflicts are also the home ground of optimistic locking. Pessimistic locking can still cause deadlocks; it does not avoid them.`,
      },
    ],
  },

  'lesson-jpa-004': {
    title: 'LAZY/EAGER fetching and LazyInitializationException',
    goals: [
      'Understand how a proxy and a persistent collection load data when they are accessed',
      'Explain why LazyInitializationException happens',
      'Build a DTO in the service while the persistence context is open; know the risks of Open Session in View',
    ],
    body: `### How lazy loading works
When an association is {{LAZY}}, Hibernate does not read it while loading the entity. Instead:
- for a to-one ({{@ManyToOne Customer customer}}): the field holds a **proxy**, a subclass of {{Customer}} generated by Hibernate at runtime that only knows the id;
- for a collection ({{@OneToMany List<Line> lines}}): the field holds a **persistent collection** (for example {{PersistentBag}}) that has no elements yet.

The first time you call {{customer.getName()}} or {{lines.size()}}, the proxy or collection asks the **Session attached to it** to run the SELECT, and then keeps the result. Later reads come from memory.

If the Session is already closed at that moment (the transaction has ended) and the data has not been loaded, the proxy has no connection or persistence context to run the query, so Hibernate throws:

~~~text
org.hibernate.LazyInitializationException: failed to lazily initialize a collection
of role: com.shop.Order.lines: could not initialize proxy - no Session
~~~

Note: calling {{getId()}} on a to-one proxy usually does **not** trigger a query, because the proxy already knows the id.

### Typical failure scenario
~~~java
@Transactional(readOnly = true)
public Order find(long id) { return repo.findById(id).orElseThrow(); } // the transaction closes on return

// Controller: Jackson serializes Order → calls getLines() → no Session left → LazyInitializationException
~~~

The controller returns the entity directly, Jackson calls every getter, and it touches the lazy collection after the transaction has closed.

### EAGER is not the answer
{{EAGER}} requires the association to be ready when the entity is loaded, but it does **not** guarantee a single JOIN: with JPQL, Hibernate usually runs an extra query per entity (N+1). EAGER also applies **everywhere**, including screens that do not need that data, and it cannot be switched off for one query. So keep every association LAZY and declare what to load per use case.

### The right boundary: the service loads enough, then returns a DTO
~~~java
@Transactional(readOnly = true)
public OrderDto detail(long id) {
    Order order = repo.findWithLines(id);      // JOIN FETCH o.lines: loads exactly what is needed
    return OrderDto.from(order);               // map to a DTO while the Session is still open
}                                              // the web layer only sees the DTO, no proxy leaks out
~~~

Ways to declare the data to load: a fetch join in JPQL, {{@EntityGraph}}, or a DTO projection (no entity, so no lazy state). {{Hibernate.initialize(order.getLines())}} forces one association to load while the Session is still open; it works, but it usually costs an extra query and does not replace a fetch plan.

| Option | Meaning | Risk |
|---|---|---|
| LAZY | loads on access | N+1, or an error once the Session is closed |
| EAGER | always loaded per the mapping | surplus data, secondary queries everywhere |
| Fetch join / EntityGraph | loads exactly the associations the use case needs | row multiplication when fetching a collection |
| DTO projection | exactly the columns the screen needs | one query per use case |

### Open Session in View (OSIV)
Spring Boot **enables OSIV by default** ({{spring.jpa.open-in-view=true}}) and logs a warning at startup. OSIV keeps the EntityManager open until the response has been rendered, so lazy loading in the controller/Jackson "just works". The price:
- queries fire silently in the web layer, hard to see and easy to turn into N+1;
- a database connection is held for the whole request (including outbound API calls and serialization), draining the connection pool under load.

Many teams set {{spring.jpa.open-in-view=false}} so the error shows up early at the service boundary. In the same spirit, do not enable {{hibernate.enable_lazy_load_no_trans}}: it opens a temporary Session for **every** lazy load, hiding the bug and causing silent N+1.

### Other traps
- {{toString()}}, {{equals}}/{{hashCode}} (or Lombok {{@Data}}) touching a lazy association triggers a query or a LazyInitializationException somewhere unexpected, such as inside a log statement.
- Fetch joining several large collections at once multiplies the rows; split it into several queries.
- An integration test that runs inside one enclosing {{@Transactional}} can hide the bug because the Session never closes; add a test that calls the service and checks the DTO **after** the transaction has ended.

### Interview relevance
Explain that a proxy needs a Session to load, why the error appears after the transaction closes, and why EAGER and OSIV only hide the symptom. Propose: every association LAZY, a fetch plan per use case, map to a DTO inside the service, turn OSIV off.`,
    exercises: [
      {
        title: 'Lazy proxy and the session',
        prompt: `Simulate a lazy persistent collection. {{LazyLines}} receives a {{Supplier}} that plays the role of the SELECT:
- {{get()}}: if the data was loaded before, return the kept data and do **not** call the supplier again (even after the session is closed).
- If it is not loaded yet and the session is still open: call the supplier **exactly once**, keep a copy of the result, then return it.
- If it is not loaded yet and the session is closed ({{close()}} was called): throw {{IllegalStateException}} and do **not** call the supplier.`,
        hints: [
          'Add a cache field; null means not loaded yet.',
          'Check the cache before checking the open flag.',
          'Only call source.get() when the cache is still null and the session is open.',
        ],
        explain: `The order of the checks is the point: data that is **already loaded** stays readable after the session closes (like a collection that was fetch joined or touched inside the transaction), while data that is **not loaded** needs the session. If you check {{open}} first, the test "loaded data readable after close" fails.

In real Hibernate, the way to avoid the error is not to keep the session open longer; it is to load the right data in the service (fetch join, EntityGraph) and map to a DTO before the transaction closes.`,
      },
    ],
    check: [
      {
        q: 'Does {{FetchType.EAGER}} guarantee that Hibernate uses a single JOIN?',
        options: ['Yes, always', 'Yes, but only for collections', 'No; it only guarantees the data is ready, and Hibernate may run an extra query (for example with JPQL)', 'EAGER never emits SQL'],
        answer: 2,
        explain: `EAGER is about **when** (ready immediately), not about **how** the data is fetched (the SQL shape). With JPQL the main query only reads the root table, so Hibernate must run a secondary query for the EAGER association, usually producing N+1. There is no "collections only" exception, and of course EAGER still has to emit SQL to get the data.`,
      },
      {
        q: 'Which approach stops the web layer (Jackson) from causing lazy queries or LazyInitializationException?',
        options: ['Return entities as they are and turn OSIV on', 'In the service, load the associations the use case needs (fetch join/EntityGraph) and map to a DTO before the transaction closes', 'Switch every association to EAGER', 'Enable hibernate.enable_lazy_load_no_trans'],
        answer: 1,
        explain: `A DTO draws a clear data boundary: the web layer never sees a proxy. OSIV makes the error "disappear" but moves the queries into the web layer and holds the connection longer. EAGER loads surplus data everywhere and can still cause N+1. enable_lazy_load_no_trans opens a temporary session for every lazy load, hides the bug and creates silent N+1.`,
      },
    ],
  },

  'lesson-jpa-005': {
    title: 'Batch inserts, IDENTITY and pooled SEQUENCE',
    goals: [
      'Understand JDBC batching and the hibernate.jdbc.batch_size setting',
      'Explain why IDENTITY kills insert batching while SEQUENCE does not',
      'Simulate the allocationSize of the pooled optimizer and count the round-trips',
    ],
    body: `### What a JDBC batch is
Without batching, 10,000 INSERTs are 10,000 commands sent to the database and 10,000 waits for the reply (round-trips). If each round-trip costs 0.5 ms, the network time alone is 5 seconds. A **JDBC batch** groups many commands with the same SQL shape ({{addBatch()}}) and sends them once ({{executeBatch()}}): 10,000 INSERTs with a batch size of 50 need only about 200 round-trips.

Hibernate does **not** batch by default. You have to configure it:
- {{hibernate.jdbc.batch_size=50}} (in Spring Boot: {{spring.jpa.properties.hibernate.jdbc.batch_size}});
- {{hibernate.order_inserts=true}} so INSERTs into the same table sit next to each other (a batch can only group **consecutive** statements with the same SQL);
- depending on the driver: PostgreSQL {{reWriteBatchedInserts=true}}, MySQL {{rewriteBatchedStatements=true}}, so the driver merges the statements into a multi-row INSERT.

A batch does not turn 50 statements into "one SQL statement" (unless the driver rewrites them); it reduces the number of network exchanges.

### Why IDENTITY breaks batching
With {{GenerationType.IDENTITY}} (an auto-increment column) the **database** generates the id during the INSERT. But Hibernate needs the id as soon as {{persist()}} runs, to put the entity into the identity map (the key is the id). So it must run the INSERT **immediately**, one statement at a time, to receive the generated key. The Hibernate documentation states it clearly: with IDENTITY, Hibernate **disables JDBC batching for INSERT** on that entity.

### SEQUENCE and the pooled optimizer
With {{GenerationType.SEQUENCE}} Hibernate gets the id from the sequence **before** the INSERT, so it can hold the INSERTs back and send them as a batch at flush time.

If every id cost one {{nextval}} call there would still be a round-trip each time. The **pooled optimizer** solves that: the sequence is created with {{INCREMENT BY 50}}, and each {{nextval}} call returns one number from which Hibernate derives a block of 50 ids to hand out in RAM. The {{allocationSize}} in {{@SequenceGenerator}} (default **50**) must match the INCREMENT of the sequence; by default Hibernate checks this at startup and reports an error when they differ (setting {{hibernate.id.sequence.increment_size_mismatch_strategy}}).

~~~java
@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "order_seq")
@SequenceGenerator(name = "order_seq", sequenceName = "order_seq", allocationSize = 50)
private Long id;   // one nextval round-trip for every 50 ids
~~~

~~~text
allocationSize = 3:
nextId() → 1  (round-trip #1: ask for block 1..3)
nextId() → 2  (from RAM)
nextId() → 3  (from RAM)
nextId() → 4  (round-trip #2: ask for block 4..6)
~~~

| Strategy | When the id exists | Batch insert |
|---|---|---|
| IDENTITY | after the INSERT has run | Hibernate disables insert batching |
| SEQUENCE (pooled) | before the INSERT, in blocks of allocationSize | batching works |
| TABLE | before the INSERT but uses a table plus a lock | slow, avoid it |

**Gaps are normal**: if the process stops in the middle of a block, the unused ids are skipped; a rollback does not return ids either. Several instances sharing one sequence receive different blocks, so ids never collide, but the id order does not reflect the order in time. Never use the id as a continuous invoice number or as a timestamp.

### Flush, clear and chunks
Big import: persist in chunks of exactly the batch size, and on each chunk call {{flush()}} (sends the batch) then {{clear()}} (frees the entities from the persistence context so they cost no RAM and do not slow down dirty checking). Clearing before flushing would drop INSERTs that were never sent.

~~~java
for (int i = 0; i < rows.size(); i++) {
    em.persist(toEntity(rows.get(i)));
    if ((i + 1) % 50 == 0) { em.flush(); em.clear(); } // 50 = hibernate.jdbc.batch_size
}
~~~

Spring Data {{saveAll()}} merely loops over {{save()}}; it does **not** enable batching by itself. Whether a batch happens is still decided by the settings above and by the generator.

### Production
- Verify that batching really happens: enable {{hibernate.generate_statistics}} (it prints a line such as "executing N JDBC batches") or look at the driver / DataSource proxy logs. Mappings, cascades or INSERTs interleaved across several tables can prevent batches from forming even though the setting is on.
- A batch that is too large holds the transaction longer, costs heap and makes rollback expensive; one that is too small does not reduce round-trips enough. 20-100 is a common starting point, then measure.
- For very large bulk loads consider skipping the ORM: {{JdbcTemplate.batchUpdate}} or the {{COPY}} command in PostgreSQL.

### Interview relevance
Say: SEQUENCE produces the id before the INSERT so batching works; IDENTITY needs the INSERT result so Hibernate disables insert batching. Explain allocationSize (a block of ids, fewer round-trips, it must match INCREMENT), that gaps are acceptable, flush/clear per chunk, and how to verify batching with statistics.`,
    exercises: [
      {
        title: 'Sequence id pool',
        prompt: `Simulate the pooled optimizer. {{IdPool(allocationSize)}}:
- {{allocationSize}} must be positive, otherwise throw {{IllegalArgumentException}}.
- {{nextId()}} returns increasing ids starting at 1. When the current block is exhausted (or on the very first call), "ask" for a new block: raise the round-trip counter by 1.
- {{roundTrips()}} returns how many times a block has been requested.`,
        hints: [
          'Keep remaining = the number of ids left in the block; it starts at 0, so the first call requests a block.',
          'When remaining is 0: set remaining = size and increment roundTrips.',
          'For every id handed out: decrement remaining, return next, then increment next.',
        ],
        explain: `The model separates two things: **requesting a block** (costs a round-trip to the database) and **handing out ids** (only in RAM). With allocationSize 50, 120 ids need only 3 round-trips instead of 120.

Common mistakes: incrementing roundTrips on every call, or initialising remaining = size in the constructor and forgetting to count the first round-trip. In the real world, if the process stops while a block still has ids left, those ids are skipped (a gap); that does not make the primary key wrong, it only makes the id sequence non-contiguous.`,
      },
    ],
    check: [
      {
        q: 'Why does SEQUENCE support batch inserts better than IDENTITY?',
        options: ['SEQUENCE does not need an id', 'SEQUENCE guarantees contiguous ids with no gaps', 'SEQUENCE needs no round-trip at all', 'The id exists before the INSERT, so Hibernate can defer and group the INSERTs'],
        answer: 3,
        explain: `Knowing the id in advance lets Hibernate put the entity into the persistence context without inserting it, and send the INSERTs as a batch at flush time. The entity still needs an id. SEQUENCE still has a round-trip to request a block (reduced by allocationSize) and still leaves gaps when the process stops or a transaction rolls back.`,
      },
      {
        q: 'What does {{hibernate.jdbc.batch_size=50}} mean?',
        options: ['Group at most 50 consecutive JDBC statements of the same SQL shape into one send', 'Every entity is written with exactly one SQL statement', 'Create 50 sequences', 'Allow 50 concurrent transactions'],
        answer: 0,
        explain: `A batch groups JDBC statements with the same SQL (which is why order_inserts matters when several tables are interleaved) to reduce round-trips; it is still many statements, unless the driver rewrites them into a multi-row INSERT. It has nothing to do with the number of sequences or concurrent transactions.`,
      },
      {
        q: 'An entity uses {{GenerationType.IDENTITY}}, batch_size=50 is configured, and saveAll is called with 1,000 entities. What happens?',
        options: ['10 batch INSERTs, 100 rows each', '20 batch INSERTs, 50 rows each', 'About 1,000 INSERTs sent one by one, because Hibernate disables insert batching with IDENTITY', 'A startup error because IDENTITY is not compatible with batch_size'],
        answer: 2,
        explain: `Hibernate needs the id as soon as persist runs, so it has to execute each INSERT separately to receive the generated key; insert batching is silently turned off, with no startup error. To get 20 batches of 50 rows you have to switch to SEQUENCE. The figure of 100 rows per batch matches no setting.`,
      },
    ],
  },
});
