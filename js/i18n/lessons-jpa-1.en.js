/*
 * English translation of js/data/lessons-jpa.js — task T274. Format: js/core/i18n.js (content overlay).
 * ids: lesson-jpa-001 lesson-jpa-002 lesson-jpa-003 lesson-jpa-004 lesson-jpa-005
 */
App.i18n.content({
  'lesson-jpa-001': {
    title: 'Persistence context and dirty checking',
    goals: [
      'Understand the identity map and the snapshot',
      'Detect the fields that changed at flush time',
    ],
    body: `### Persistence context is the working set
The persistence context attaches a Java entity to a data row for a period of time. When {{find}} looks up an id that has already been loaded, the first-level cache returns the same managed object instead of making a copy or asking the database again. The identity map usually identifies an entity by its type and primary key. Thanks to that, a transaction cannot accidentally hold two different versions of the same row.

When an entity is loaded, Hibernate keeps a snapshot of the initial state. A setter only changes the object in memory. At flush time, the provider compares the current state with the snapshot; if they differ it builds an UPDATE. Flush can happen before commit and it does not mean the transaction has committed: the transaction can still roll back.

~~~java
Account a = em.find(Account.class, 7L); // managed and snapshotted
a.setName("Mai");                      // only changes in-memory state
em.flush();                            // detects the change, sends SQL
~~~

### Dirty checking and SQL
Hibernate 6 usually compares snapshots at flush time. Bytecode enhancement can help track changed fields, but do not assume every project enables it. The default UPDATE may contain many mapped columns; {{@DynamicUpdate}} can narrow the columns to what changed but produces more SQL shapes, which affects the statement cache. Choose it only after measuring.

| State | Result |
|---|---|
| Managed in the context | field changes are detected at flush |
| Detached | setters do not write to the database by themselves |
| New/transient | needs persist or a suitable cascade |

The exercise simulates the identity map and the snapshot: one object per id, and the snapshot is a copy of the values, not the same mutable object. Flush returns the changed fields in a stable order and then updates the snapshot so the next flush does not repeat the UPDATE. An entity that was never loaded must not be written silently.

### Merge does not attach the input object
With Spring Data JPA, saving a detached entity usually leads to merge. Merge copies the state onto a managed instance and returns that instance; the input object does not become managed because of it. Use the returned value when you need to keep working inside the context. Do not keep entities in an application cache across transactions.

### Production pitfalls
A long transaction can hold thousands of managed entities, so snapshots consume heap and flush takes time. For large imports, persist in chunks, flush then clear; flush before clear so unsubmitted changes are not lost. After the clear, the old references are detached. Field changes on a detached entity are not detected by dirty checking. Bulk JPQL can also leave the persistence context holding stale state.


### Flush versus commit boundaries
Flush synchronizes managed changes with the database inside the current transaction; commit is the decision to end the transaction. Therefore SQL that ran at flush can still be rolled back. Hibernate usually flushes before commit, and depending on the flush mode it may also flush before certain queries so that query results reflect pending changes. Do not use flush as a signal that the data is durable or visible from another transaction.

In batch processing, flush then clear per chunk keeps the number of tracked entities and snapshots bounded. Clear does not undo already-flushed SQL but it detaches the objects; any later change on the old reference is no longer tracked by the persistence context. Check both the number of managed entities and the flush time when choosing a chunk size.
### Interview relevance
Explain the identity map, the snapshot, how flush differs from commit and why a detached object is not written back by itself. Mention how to measure real SQL before choosing dynamic update or bytecode enhancement.`,
    exercises: [
      {
        title: 'Identity map and dirty fields',
        prompt: `Implement {{UnitOfWork}}: loading the same id returns the same object; flush returns a map id to changed fields in the order name,email and updates the snapshot.`,
        hints: [
          'A map of id to object forms the identity map.',
          'The snapshot must be independent of the object and replaced after each flush.',
        ],
        explain: `Flush compares the new state with the copy. If the snapshot kept the very same object, the setter would change both and nothing would be detected.`,
      },
    ],
    check: [
      {
        q: 'When does dirty checking usually run?',
        options: ['Inside the setter', 'At flush time', 'When the JVM stops', 'Inside the getter'],
        explain: `Flush compares the managed state with the snapshot; commit usually flushes but is not synonymous with commit.`,
      },
      {
        q: 'Is a detached entity dirty-checked on its own?',
        options: ['Yes, setters send SQL by themselves', 'No, it needs a suitable merge or persist', 'Only when a getter is called', 'Only when EAGER is enabled'],
        explain: 'Dirty checking only tracks managed entities; merge copies the state onto a managed instance.',
      },
    ],
  },

  'lesson-jpa-002': {
    title: 'N+1 queries and batch-loading associations',
    goals: [
      'Recognize the 1+N round-trips',
      'Load parents and children with two queries',
    ],
    body: `### N+1 is the number of database trips growing with the parents
One query fetching N orders is the first query. If you read the lines of each order and every access fires a SELECT, the total becomes 1+N. With 80 orders, 81 database trips make network latency repeat even though the data is small. That is N+1, and it is usually missed in tests that only have one parent.

{{LAZY}} defers loading until first access; it does not automatically fold those accesses into one query. {{EAGER}} does not commit to a single JOIN either. The provider may fire secondary queries; joining many collections can duplicate rows or create a Cartesian product.

### Pick the fetch plan per use case
Fetch join fits to-one associations or small collections when no complex pagination is needed. EntityGraph describes the associations that must be loaded. Batch fetching groups the lazy keys that need loading into batches. DTO projection selects exactly the columns the screen needs, avoiding materializing surplus entities. You can also fetch the orders first, then fetch all the lines with one IN query by order ids and group them in memory.

~~~text
orders = queryOrders()                 // query 1
lines = queryLinesByOrderIds(ids)      // query 2
group lines by orderId                 // no query inside the loop
~~~

| Option | Benefit | Pitfall |
|---|---|---|
| Fetch join | few queries | collection + pagination duplicates rows |
| Batched ids | bounded query count | results need grouping, bind parameter limits |
| DTO projection | loads exactly the data needed | the query is tied to the use case |

Hibernate 6 supports fetch join, batch size and entity graphs; inspect the SQL that gets emitted. Fetch joining a collection together with pagination can paginate in memory or warn/fail depending on configuration. The fail_on_pagination_over_collection_fetch setting surfaces the mistake early. Do not turn every association into EAGER to cure N+1.

### Production
Measure the query count across many parents and watch slow queries/APM. An oversized batch can exceed bind parameter limits. A bounded page size plus an explicit fetch plan is usually better than loading the whole graph. Query count is not the only goal: look at row counts, payload, database time and heap too.


### Measure the fetch plan properly
A test with a single order cannot expose N+1; build a fixture with many parents and assert the query count does not grow linearly with the number of parents. With batch fetching, Hibernate can fold the unloaded keys into one IN query per batch size, but the query count still depends on the number of keys, the batch size, the dialect and the bind parameter limit. This is batching optimization, not a promise of always exactly two queries.

Paginating a collection needs special care: the JOIN returns one row per parent-child combination, so a SQL LIMIT can cut through the middle of a collection. The safe route is usually to paginate the parents first, then load the associations for the ids of that page. Check both the returned row count and the query count to avoid trading many small queries for one giant result.
### Interview relevance
Name the 1+N problem and pick a strategy by cardinality and pagination. Prove it with SQL or a query counter instead of just flipping LAZY to EAGER.`,
    exercises: [
      {
        title: 'Bring N+1 down to two queries',
        prompt: `The repository counts queries. Load every order and its lines by the set of order ids using only two queries, keeping empty orders.`,
        hints: [
          'Create an entry for each parent before attaching children.',
          'Call the repository lines only once and skip it when the ids are empty.',
        ],
        explain: `One query loads the parents, the second loads all the children; grouping by key keeps parents without children. In practice you need to split into batches when the IN list hits database limits.`,
      },
    ],
    check: [
      {
        q: 'Does LAZY remove N+1 by itself?',
        options: ['Yes, always a single JOIN', 'No, touching each proxy can still be N+1', 'Yes, via a mandatory second-level cache', 'It cannot be used with collections'],
        explain: `LAZY only postpones loading; a fetch plan or batching is needed to bound the queries.`,
      },
      {
        q: 'What is the risk of collection fetch join with pagination?',
        options: ['It always produces exactly one row per parent', 'The SQL limit can cut the collection or force in-memory pagination', 'It turns off the persistence context', 'LAZY becomes unusable'],
        explain: 'The JOIN multiplies rows per child; the usual route is to paginate parents first and then load children by ids.',
      },
    ],
  },

  'lesson-jpa-003': {
    title: 'Optimistic locking with @Version',
    goals: [
      'Understand the version condition in the UPDATE',
      'Retry in a new transaction with fresh state',
    ],
    body: `### Lost update
A and B read the same row at version 4. Both compute a new value. If the UPDATE filters by id only, the later write can silently overwrite the earlier result. {{@Version}} makes the update conceptually look like: {{UPDATE ... SET value=?, version=5 WHERE id=? AND version=4}}. A updates successfully; B sees zero rows updated and the provider reports an optimistic locking conflict.

Hibernate manages the version field and bumps it when the entity is updated. The application should not increment the version itself. This mechanism fits rare conflicts, especially read-heavy flows with few writes; it avoids holding a database lock for the entire computation.

### Retry carries business meaning
A retry cannot resend the old update with the old version. It needs a new transaction, freshly read data and a reapplication of the intent, such as adding another 10. Limit the number of retries; you can add backoff under high load. Never blindly retry side effects outside the database such as sending money or email. An idempotency key/outbox makes side effects safe to handle.

~~~text
A reads v4 → update where v4 succeeds → v5
B reads v4 → update where v4 affects 0 rows → conflict
B new transaction reads v5 → reapplies intent → update
~~~

| Strategy | Choose when | The cost |
|---|---|---|
| Optimistic | conflicts are rare | retry or return a conflict |
| Pessimistic | high contention, short sections | locks, timeouts, deadlocks |

### Spring and the transaction boundary
Catching the error inside the same transaction and continuing is usually invalid because the transaction may already be rollback-only. Place the retry outside the transactional method so each attempt opens a new transaction. Bulk JPQL/native SQL can bypass automatic versioning; you must manage the version yourself and refresh the persistence context. A specific exception type can be translated by Spring through its exception abstraction layer.

### Production pitfalls
Unbounded retries make the load grow while the database is contended. Measure the conflict rate and cap the attempts. The decision between retrying and returning an HTTP conflict depends on semantics: the user may need to confirm again if fresh data changes the decision. The version only protects the row being updated; multi-row invariants may need other constraints/locking.


### Transaction boundary and conflicts
The version check only means something in the atomic UPDATE statement itself at the database; checking the version in Java and writing afterwards creates a race between the two operations. If the update affects zero rows because the version changed or the row was deleted, Hibernate detects the optimistic conflict. Application code should handle the exception at the transaction boundary, because the current transaction is usually already marked rollback-only.

A retry is safe only when the operation can be reapplied on the freshly read state and side effects are not repeated. For example an increment can be reapplied onto the new value; an approval decision based on a quota may need a conflict returned so the user confirms again. Keep the limit small, record conflict/retry metrics and do not treat @Version as protection for invariants spanning several rows.
### Interview relevance
Describe the WHERE version condition, the writer wins, and the new transaction when retrying. Mention bulk updates, side effects and retry limits.`,
    exercises: [
      {
        title: 'Version check and retry',
        prompt: `update succeeds only when the expected version matches, then bumps the version. addWithRetry reads the current version and tries at most three times.`,
        hints: [
          'A mismatch must return false without changing any state.',
          'Take the latest version for each attempt; stop after three tries.',
        ],
        explain: `The version condition simulates compare-and-set inside the UPDATE. A real application relies on the database to apply the update atomically and places each retry in a new transaction.`,
      },
    ],
    check: [
      {
        q: 'What should a retry of an optimistic conflict do?',
        options: ['Resend the UPDATE with the old version', 'Read fresh state in a new transaction and reapply the intent', 'Turn versioning off', 'Retry forever in the same transaction'],
        explain: `The old version will keep conflicting; the new transaction must load fresh state and retries must be bounded.`,
      },
      {
        q: 'Does a bulk JPQL update apply @Version the way an entity update does?',
        options: ['Yes, it always bumps the version', 'Not necessarily; the version and the context must be managed explicitly', 'Only on PostgreSQL', 'Only with endless retries'],
        explain: 'Bulk DML bypasses managed state; the version and the context update need explicit handling.',
      },
    ],
  },

  'lesson-jpa-004': {
    title: 'LAZY/EAGER fetching and LazyInitializationException',
    goals: [
      'Understand proxies loading on access',
      'Return a DTO with the needed data before the session closes',
    ],
    body: `### Proxies defer the query
A LAZY association may be represented by a proxy or a persistent collection wrapper. When the entity is loaded, the association does not need to be read yet. When the getter/iterator is called, the wrapper asks the persistence context to run the query and then keeps the result. If the session/entity manager is closed and the data was not loaded, Hibernate has no connection/context to run the query, so it throws {{LazyInitializationException}}.

EAGER requires the association to be ready when the entity is loaded, but it does not mean the SQL necessarily uses a JOIN. The provider may run a secondary query. So a global EAGER easily causes over-fetching and can still hit many queries.

### The right boundary
The service should define the data the use case needs via fetch join, EntityGraph or projection, then map to a DTO before returning to the web layer. That way JSON serialization does not accidentally call lazy getters. {{Hibernate.initialize}} is only useful while the context is still open and does not replace a fetch plan. Open Session in View keeps the session until render and can hide queries surfacing in the presentation layer.

~~~java
@Transactional(readOnly = true)
OrderDto detail(long id) {
  Order order = repo.findDetail(id); // fetch the needed associations
  return mapper.toDto(order);       // no proxy leaks to the web
}
~~~

| Fetch | Meaning | Risk |
|---|---|---|
| LAZY | loads on access | N+1 or a closed session |
| EAGER | ready per the mapping | surplus data, secondary queries |
| DTO query | exactly the data the screen needs | one query per use case |

Serialization usually calls getters, so it can trigger N+1 or an exception. Calling toString on an entity can also touch associations if it is written that way. With Hibernate 6, bytecode enhancement changes some field-loading details but does not remove the persistence context rules. Pagination combined with a collection fetch join can multiply rows and ruin performance.

### Production
Turning OSIV off makes the error appear at the service boundary, where it is easier to fix. Do not keep a transaction open so a template can read entities. Test with the transaction closed and then serialize the DTO; count queries on list pages. Initialize only the data actually needed, bound the page size and look at the SQL.


### The loading boundary and the presentation layer
LazyInitializationException is a sign that data was not initialized while the persistence context can no longer load it. Keeping the session open longer may make the error disappear but it moves queries to render or serialize time, where N+1 and latency are hard to control. A transactional service should load the right graph for the use case and build the DTO while the context is still open.

When several associations are needed, avoid fetch joining many large collections at the same time because the row multiplication makes the transferred data balloon. Use a projection or split it into queries per key set; keep the mapping logic in the service. An integration test should close the transaction before checking the DTO to make sure the response does not depend on living proxies.
### Interview relevance
Separate fetch timing from SQL shape. Explain why lazy access outside the session fails and propose a DTO/query plan per endpoint.`,
    exercises: [
      {
        title: 'Lazy proxy and the session',
        prompt: `LazyLines loads from the supplier once, when get is called while the session is open. If it was not loaded yet and the session is closed, it throws IllegalStateException; already cached data remains readable.`,
        hints: [
          'Check the cache before checking the open flag.',
          'The supplier is called only while there is no cache yet.',
        ],
        explain: `A proxy defers the query, it does not remove it. Unloaded data needs the session; data already cached can be read after closing. A DTO is the right boundary for the web.`,
      },
    ],
    check: [
      {
        q: 'Does EAGER guarantee a single JOIN?',
        options: ['Yes', 'No, it only guarantees the association is ready per the mapping', 'Yes, for collections', 'It cannot emit SQL'],
        explain: `Fetch timing is separate from the SQL strategy; the provider may fire secondary queries.`,
      },
      {
        q: 'How do you stop web serialization from triggering lazy queries?',
        options: ['Return entities as they are', 'Build the DTO in the service while the fetch plan has loaded the data', 'Switch every association to EAGER', 'Keep the transaction open forever'],
        explain: 'A DTO draws a clear data boundary and avoids lazy getters in the web layer.',
      },
    ],
  },

  'lesson-jpa-005': {
    title: 'Batch inserts, IDENTITY and pooled SEQUENCE',
    goals: [
      'Compare when the id is allocated',
      'Simulate allocationSize and round-trips',
    ],
    body: `### JDBC batching
Hibernate can group several INSERT statements into a JDBC batch when the driver, dialect and mapping support it. A batch sends many statements with fewer exchanges; it does not necessarily become one single SQL statement. {{hibernate.jdbc.batch_size}} needs to be configured and measured. For a large import, persist in chunks, flush then clear, to ship statements and drop managed entities out of the persistence context.

### IDENTITY and SEQUENCE
With {{GenerationType.IDENTITY}}, the id only exists after the INSERT because the database generates the value. Hibernate usually has to execute the insert early to receive the generated key, which makes deferring inserts and batching harder. Details still depend on the dialect/driver, so do not treat IDENTITY as if it were a sequence.

SEQUENCE can allocate the id before the INSERT. The pooled optimizer takes one value/block and then hands out several ids inside the application. {{allocationSize}} defines the block per the mapping/optimizer and must be configured consistently with the sequence increment. Knowing many ids in advance helps the ORM group inserts. If the process dies in the middle of a block, unused ids leave a gap; the primary key is not a continuous invoice number.

| Strategy | When the id exists | Impact |
|---|---|---|
| IDENTITY | after insert | usually limits grouping inserts |
| SEQUENCE pooled | before insert, per block | favorable for batching |

~~~text
allocationSize 5: request the block once → use 5 ids in memory
only when the block is exhausted is another round-trip needed
~~~

### Flush, clear and ordering
Flush sends pending statements but the entity remains managed. Clear detaches all entities; doing it before flush can drop changes that were never sent. Foreign keys, cascades and insert ordering affect whether a batch is possible. Spring Data {{saveAll}} merely loops save; it does not by itself guarantee the driver is batching.

### Production
Check the SQL and metrics on the real database/driver. An oversized batch holds the transaction/heap longer and raises rollback cost; an undersized one does not reduce round-trips. A mismatched sequence increment can cause problems depending on the optimizer/schema. A pooled sequence shared by several instances still allocates non-overlapping values, but id order does not reflect commit order. Never use the id as a timestamp.


### Verify real batching
Batch size is the number of JDBC statements grouped together when the driver and Hibernate can batch them; it does not mean the database receives exactly one SQL statement. One batch can only group statements that are compatible in SQL shape and order. The generated key of IDENTITY usually forces the insert to run early to fetch the id, so it tends to hinder insert batching; the detailed behavior depends on the dialect and driver.

SEQUENCE allows keys to be allocated before the insert, while the pooled optimizer reduces how often the sequence is hit by granting a range of ids per block. allocationSize and the sequence configuration must be compatible with the optimizer in use. Verify with real SQL logs/metrics, because the mapping or the insert order can prevent batches from forming even though batch size is configured.
### Interview relevance
Point out that a sequence provides the id before the insert so batching is easier, while identity needs the insert result. Discuss allocationSize, gaps, flush/clear and how to verify actual batching.`,
    exercises: [
      {
        title: 'Sequence id pool',
        prompt: `IdPool takes a positive allocationSize; nextId returns increasing ids and only bumps roundTrips each time a new block starts.`,
        hints: [
          'When remaining reaches 0, request a block and increment the counter.',
          'Each id handed out decrements remaining and increments next.',
        ],
        explain: `The model separates the round-trip that fetches a block from handing out ids in memory. A real pooled sequence can leave a gap if the process dies; a gap does not make the primary key wrong.`,
      },
    ],
    check: [
      {
        q: 'Why does SEQUENCE usually support batch inserts better?',
        options: ['No id is needed', 'The id can be obtained before the insert', 'There are no round-trips', 'It guarantees continuous ids'],
        explain: `Knowing the id in advance allows deferring and grouping inserts; there is still a round-trip to the sequence and gaps are possible.`,
      },
      {
        q: 'What does the Hibernate batch size mean?',
        options: ['One single SQL for every entity', 'The number of JDBC statements that can be grouped into one compatible batch', 'The number of sequences to create', 'The number of concurrent transactions'],
        explain: 'A batch groups compatible JDBC statements; verify the driver, the SQL shape and the real logs.',
      },
    ],
  },
});
