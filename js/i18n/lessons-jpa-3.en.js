/*
 * English translation of js/data/lessons-jpa.js — task T1017.
 * Format: js/core/i18n.js (content overlay).
 * ids: lesson-jpa-008 lesson-jpa-009
 */
App.i18n.content({
  'lesson-jpa-008': {
    title: 'Dirty checking: snapshot, @DynamicUpdate, and the cost',
    goals: [
      'Explain how dirty checking compares each field against the snapshot and why a setter sends no SQL',
      'Compare the default UPDATE of all columns with @DynamicUpdate and bytecode enhancement',
      'Recognize the cost of dirty checking in large transactions and how to reduce it with read-only, clear, and batching',
    ],
    body: `### Quick idea
Dirty checking was introduced in the Persistence context lesson: Hibernate saves a snapshot when it loads an entity and, at flush, compares each field. This lesson goes deeper into **the cost and the variations** so you can answer "when should dirty checking be optimized?"

### Default UPDATE: every column
By default, Hibernate generates an UPDATE that contains **all** columns of the entity, including columns that did not change:
~~~sql
UPDATE account SET name = ?, email = ?, status = ?, version = ? WHERE id = ? AND version = ?
~~~
Benefit: the SQL is fixed, so the prepared statement (a precompiled SQL statement that the database/JDBC can cache and reuse) can be reused through the statement cache. Cost: more parameters are sent, and the database must write columns that did not change (which can also trigger trigger execution and index updates).

### @DynamicUpdate: only the changed columns
~~~java
@Entity
@DynamicUpdate
class Account { ... }
~~~
Hibernate generates an UPDATE that includes only the columns that actually changed. This helps with tables that have a very large number of columns or large columns (TEXT, JSON). The price: every combination of changed columns becomes a different SQL statement, so JDBC and the database have fewer chances to reuse a prepared statement from the statement cache. Hibernate still has to compare against the snapshot to know which columns changed (dirty checking does not disappear). Enable it only after measuring (for example, turn on {{hibernate.generate_statistics}} or use a profiler).

### Bytecode enhancement
By default, dirty checking runs at flush time: Hibernate walks the managed entities and compares every field against the snapshot. With large entities and many entities, this cost becomes significant. Bytecode enhancement (enabled explicitly in the build, for example with Hibernate ORM's {{hibernate-enhance-maven-plugin}}) injects code into setters/getters to **mark a field dirty at the moment it is assigned** (dirty tracking). At flush, Hibernate only needs to read the list of changed fields instead of comparing everything. It must be enabled explicitly in the build; do not assume a project has it. It can affect interaction with other tools that use bytecode (AOP, JaCoCo), so test carefully; consider it only after profiling.

### Flush mode
- AUTO (default): flush before commit and before a query that could be affected by pending changes, so the query sees the latest data.
- COMMIT: flush only before commit; queries do not trigger a flush automatically, which is faster but a query may see stale data within the same transaction.
- MANUAL: flush only when {{flush()}} is called.

### Cost in large transactions
Every managed entity costs RAM for the object and the snapshot; every flush walks all of them. Importing one million rows in a single transaction can easily run out of memory (OOM) or flush very slowly. The approach: process in chunks (for example 500 entities), and for each chunk call {{flush()}} then {{clear()}}. You must flush before clear; otherwise, changes that were never sent are lost.

### Read-only
{{@Transactional(readOnly = true)}} lets Hibernate skip keeping snapshots and skip dirty checking for the entities it reads, saving RAM and CPU. Use it for read-only endpoints.

### Production pitfalls
- Dirty checking runs on **every** managed entity, including entities that are only read in a long transaction. A large import transaction that keeps hundreds of thousands of entities in the persistence context will make flush slow and consume a lot of RAM.
- {{@DynamicUpdate}} is not enabled automatically; it must be declared explicitly and measured with statistics.
- Bytecode enhancement changes bytecode at build time; you must verify compatibility with other agents/proxies (Spring AOP, JaCoCo).
- Flush mode COMMIT can make queries inside the transaction see stale data; use it only when you are certain.

### Interview relevance
"How much does dirty checking cost and how do you optimize it?" Mention: a snapshot per entity, a full scan on every flush, the default UPDATE of all columns; @DynamicUpdate, bytecode enhancement, read-only, and chunk + clear. Emphasize measuring before optimizing.`,
    exercises: [
      {
        title: 'Count changed columns for a dynamic UPDATE',
        prompt: `Simulate dirty checking that returns the list of changed fields in the order {{name}}, {{email}}, {{status}}. Implement {{DirtyTracker}}:
- The constructor takes the initial snapshot (name, email, status).
- {{current(n, e, s)}} updates the current state.
- {{dirty()}} returns the list of changed field names in the order name, email, status; if nothing changed, return an empty list.
- {{flush()}} updates the snapshot with the current state and returns {{dirty()}} as it was **before** the update.`,
        hints: [
          'Keep the snapshot (sn, se, ss) and the current state (cn, ce, cs) separate.',
          'dirty() compares each field in the order name, email, status.',
          'flush() updates the snapshot with the current state if there were changes.',
        ],
        explain: `Dirty checking compares values; it does not count how many times a setter was called. Common mistakes: updating the snapshot inside every {{dirty()}} call instead of on {{flush()}}, or not updating the snapshot after flush, which makes the next flush report the same UPDATE again.`,
      },
    ],
    check: [
      {
        q: 'When is @DynamicUpdate beneficial?',
        options: [
          'For tables with very few columns',
          'For tables with very many columns or large columns, and only after measuring a benefit',
          'For every entity',
          'When using bytecode enhancement',
        ],
        answer: 1,
        explain: `@DynamicUpdate sends only the changed columns, which helps with tables that have many or large columns. With tables that have few columns, the default UPDATE of all columns reuses the prepared statement better. Bytecode enhancement is a different optimization (reducing the cost of snapshot comparison); it does not have to be used together.`,
      },
      {
        q: 'What does @Transactional(readOnly = true) help with?',
        options: [
          'It makes commits faster automatically',
          'Hibernate skips keeping snapshots and skips dirty checking for the entities it reads',
          'It turns off SQL completely',
          'It allows writes inside the transaction',
        ],
        answer: 1,
        explain: `Read-only tells Hibernate that it does not need to track changes, so it does not keep snapshots, saving RAM and CPU spent on dirty checking. It does not turn off SQL (SELECTs still run) and it does not allow writes; writing inside a read-only transaction may cause an error or be ignored depending on the provider.`,
      },
    ],
  },

  'lesson-jpa-009': {
    title: 'Flush order and the ActionQueue',
    goals: [
      'Explain that Hibernate flushes in the order insert → update → delete',
      'Understand why deleting and then inserting the same unique key still fails and how to fix it with an intermediate flush',
      'Simulate an ActionQueue with a table that has a unique constraint',
    ],
    body: `### Quick idea: the ActionQueue
At flush time, Hibernate does not send SQL in the order you called {{persist}}/{{remove}}. It places the operations into an **ActionQueue** and flushes them in a fixed order: **insert → update → delete** (and within the same type, in registration order). The reason: to respect foreign keys and constraints — insert the parent before the child, delete the child before the parent.

### Why "delete then insert the same unique key" still fails
Suppose a table has a unique constraint on email. Inside one transaction:
1. Delete the user with email a@x.com.
2. Insert a new user that also has email a@x.com.

You think the unique value is no longer taken. But flush sends DELETE after INSERT (because insert → delete): the INSERT runs first, sees that a@x.com is still there (not deleted yet) → unique violation. The error happens even though your logic is correct.

### How to fix it
- Call {{em.flush()}} between the two operations: the first flush sends the DELETE down to the database, and after that the new INSERT is not blocked.
- Or use an UPDATE instead of delete+insert.
- Or handle it at the database level (a deferred constraint), but Hibernate does not do that automatically.

### Order and foreign keys
Hibernate tries to arrange inserts/deletes to respect foreign key constraints (FK, foreign key — a column that points to the id of another table): insert the parent before the child, delete the child before the parent (by analyzing relationships and cascade/orphan). But this cannot always "save" every complex case (circular relationships, self-managed mappings). If you create a clear conflict, the database will reject the FK.

### ActionQueue and entity state
Hibernate tracks entity state (new/transient, managed, removed/detached) and only generates SQL for changes. When you call {{remove()}} on a managed entity, it moves to the removed state and the ActionQueue adds a delete action. When you {{persist()}} a new entity (transient — not yet in the database/context), it adds an insert action. Flush executes all actions in the order insert → update → delete.

### Why not send in call order
If Hibernate sent in call order, persisting a child before the parent would violate the FK; removing the parent before the child would also violate it. The ActionQueue reorders for safety. This is why the SQL log often does not match your Java code.

### Production pitfalls
- A unique constraint on a column that is frequently "changed" via delete+insert will fail if there is no intermediate flush.
- Bulk delete + insert of the same unique key: prefer an UPDATE or an explicit flush.
- Inserts happen in registration order: if you persist a child before the parent without a cascade, the FK fails.
- A deferred constraint (PostgreSQL) can allow insert/delete inside the transaction and check at commit, but Hibernate does not enable it automatically; you must configure the database.
- When debugging, enable {{hibernate.show_sql}} and {{format_sql}} to see the actual order; compare it with the code to understand the ActionQueue.

### Interview relevance
"Why does deleting and then inserting the same unique key still fail?" Answer: Hibernate flushes insert before delete, so the INSERT runs while the old row has not been deleted yet. Fix: flush in between, or use an UPDATE. Also mention the insert/update/delete order and the reason (foreign keys, constraints).`,
    exercises: [
      {
        title: 'ActionQueue flush in order',
        prompt: `Simulate the ActionQueue. {{Queue}} has:
- {{insert(id)}}: register an insert.
- {{update(id)}}: register an update.
- {{delete(id)}}: register a delete.
- {{flush()}}: return the list of ids in this order: all inserts (in registration order), then all updates, then all deletes. After flush, the queue is empty.
- The table has a unique constraint on id: if the same id is both deleted and inserted in the same flush, the insert runs before the delete → violation. Implement {{violatesUnique()}} to return true if any id is both deleted and inserted in the current queue.`,
        hints: [
          'Keep three separate lists for insert/update/delete.',
          'flush() merges in the order insert, update, delete and then clears.',
          'violatesUnique() checks the intersection between the delete set and the insert set.',
        ],
        explain: `The ActionQueue enforces the order insert → update → delete to respect foreign keys and constraints. A common mistake: thinking "delete then insert" is safe in the same transaction; in reality the INSERT runs before the DELETE, so the unique constraint is still blocked. Production fix: flush in between, or use an UPDATE.`,
      },
    ],
    check: [
      {
        q: 'In what order does Hibernate flush?',
        options: [
          'In the order you called persist/remove',
          'insert → update → delete',
          'delete → update → insert',
          'Randomly',
        ],
        answer: 1,
        explain: `The ActionQueue orders inserts first, updates in the middle, and deletes last so that parents are inserted before children and children are deleted before parents, respecting foreign keys and constraints.`,
      },
      {
        q: 'In one transaction you delete a user with email a@x.com and then insert a new user with the same email. What happens at flush?',
        options: [
          'Hibernate automatically orders delete before insert',
          'The INSERT runs before the DELETE → unique violation',
          'No SQL is executed',
          'Hibernate throws a compile error',
        ],
        answer: 1,
        explain: `Hibernate flushes insert before delete, so the INSERT runs while the old row has not been deleted yet → the unique constraint is violated. Fix: call flush() between the two operations, or use an UPDATE.`,
      },
    ],
  },
});
