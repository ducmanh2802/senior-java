/*
 * English translation of js/data/quiz-gaps.js — task T566. Format: js/core/i18n.js (content overlay).
 * ids: qz-sql-009 qz-sql-010 qz-sql-011 qz-sql-012 qz-sql-013 qz-sql-014 qz-sql-015 qz-sql-016 qz-sql-017 qz-sql-018 qz-sql-019 qz-sql-020 qz-testing-009 qz-testing-010 qz-testing-011 qz-testing-012 qz-testing-013 qz-testing-014 qz-testing-015 qz-testing-016 qz-testing-017 qz-testing-018 qz-testing-019
 */
App.i18n.content({
  'qz-sql-009': {
    q: `The {{users}} table has 5 million rows and the index {{CREATE INDEX ix_users_email ON users(email)}}. The login query below takes 900 ms. Why, and how do you fix it?
~~~sql
SELECT id FROM users WHERE lower(email) = 'an@example.com';
~~~`,
    options: [
      'A B-tree index does not support equality comparison on a text column, so it has to be replaced with a Hash index',
      'The planner makes the wrong choice because statistics are missing; running ANALYZE users is enough for the query to use ix_users_email',
      'The index on email cannot be used for the expression lower(email); you need an expression index ON users (lower(email)) or the citext type',
      'The lower() function is slow on every row; switching to upper() will let the index be used'
    ],
    explain: `**Correct answer: you need an expression index.**

### Why this is correct
The {{ix_users_email}} index stores the **original** value of {{email}}. The filter condition is the result of the {{lower(email)}} function, a completely different value, so the planner cannot traverse the B-tree and must do a Seq Scan, computing {{lower()}} for all 5 million rows. The fix:
~~~sql
CREATE INDEX ix_users_email_lower ON users (lower(email));
-- or store email as citext (extension) so the comparison ignores case
~~~
The query must use **exactly the same expression** {{lower(email)}} as when the index was created.

### Why the other options are incorrect
- **Hash index**: B-tree handles the {{=}} operator on text perfectly well; the problem is the expression, not the index type.
- **ANALYZE**: statistics cannot make an index match an expression it does not contain.
- **upper()**: that is also a function wrapped around the column, so it hits exactly the same problem as {{lower()}}.

> Senior tip: the rule "never wrap an indexed column in a function" also applies to {{date(created_at)}}, {{CAST}} and arithmetic. Rewriting it as a range ({{created_at >= ? AND created_at < ?}}) is usually better than creating another expression index.`
  },
  'qz-sql-010': {
    q: `The withdrawal service does the following inside one transaction (PostgreSQL, READ COMMITTED): read {{SELECT balance FROM accounts WHERE id = 1}}, compute the new balance in Java, then {{UPDATE accounts SET balance = :newBalance WHERE id = 1}}. Two concurrent requests lose one debit (lost update). Which approaches prevent this bug? (Choose 3)`,
    options: [
      'Read with SELECT ... FOR UPDATE inside the same transaction before doing the calculation',
      'Add an index on the balance column',
      'Write it as a single atomic statement: UPDATE accounts SET balance = balance - 100 WHERE id = 1 AND balance >= 100',
      'Optimistic locking: add a version column, UPDATE ... WHERE id = ? AND version = ?, then check the number of affected rows',
      'Wrap both statements in @Transactional and keep READ COMMITTED'
    ],
    explain: `**Correct answer: FOR UPDATE, the atomic UPDATE statement, optimistic locking.**

### Why the lost update happens
T1 and T2 both read balance = 500, both compute 400, both write 400. The correct result should have been 300. READ COMMITTED only guarantees that you do not read uncommitted data; it does **not** prevent read-modify-write at the application layer.

### Why the three correct options work
- **FOR UPDATE**: locks the row as it is read; T2 must wait for T1 to commit and then re-read the new value (pessimistic).
- **Atomic UPDATE**: the subtraction is performed inside the database against the latest version of the row; the condition {{balance >= 100}} prevents a negative balance. Simplest and fastest.
- **Version column**: T2 writes using the old version, so 0 rows are affected and the application reports a conflict or retries. This is exactly the mechanism behind JPA's {{@Version}}.

### Why the other options are incorrect
- **Index on balance**: it only helps lookups, has nothing to do with synchronization, and makes UPDATE slower.
- **@Transactional + READ COMMITTED**: that is precisely the broken scenario; having a transaction does not mean having a lock.

> Senior tip: for a hot wallet (many requests on the same account), optimistic locking causes a storm of retries; an atomic UPDATE statement or FOR UPDATE is usually more stable.`
  },
  'qz-sql-011': {
    q: `Two transactions run concurrently on PostgreSQL with the default configuration:
~~~text
T1: UPDATE accounts SET balance = balance - 10 WHERE id = 1;
T2: UPDATE accounts SET balance = balance - 10 WHERE id = 2;
T1: UPDATE accounts SET balance = balance + 10 WHERE id = 2;   -- waits for T2
T2: UPDATE accounts SET balance = balance + 10 WHERE id = 1;   -- waits for T1
~~~
What happens?`,
    options: [
      'After roughly deadlock_timeout (1 s by default), PostgreSQL detects the deadlock, aborts one transaction with a "deadlock detected" error (SQLSTATE 40P01); the other transaction keeps running',
      'Both wait forever until the client times out, because PostgreSQL does not detect deadlocks by itself',
      'PostgreSQL reorders the locks automatically, so both transactions succeed',
      'Both transactions are rolled back to keep things fair'
    ],
    explain: `**Correct answer: one transaction is aborted with "deadlock detected".**

### The mechanism
T1 holds the lock on row 1 and waits for row 2; T2 holds row 2 and waits for row 1, forming a wait cycle. When a backend has been waiting for a lock longer than {{deadlock_timeout}} (1 s by default), PostgreSQL runs the deadlock detector over the wait graph. If it finds a cycle, it aborts **one** transaction (error {{40P01}}), releases its locks, and the other transaction carries on and can commit.

### Why the other options are incorrect
- **Wait forever**: PostgreSQL does have a deadlock detector. {{lock_timeout}} is a different mechanism and defaults to 0 (disabled); it caps how long any lock wait may take.
- **Reorders locks automatically**: the database cannot change the order of statements the application already sent.
- **Aborts both**: aborting one is enough to break the cycle.

### How to prevent it
- Always take locks in a fixed order, for example by ascending id: {{SELECT ... WHERE id IN (1,2) ORDER BY id FOR UPDATE}}.
- Retry in the application when you get {{40P01}} (Spring translates it into {{DeadlockLoserDataAccessException}} / {{PessimisticLockingFailureException}}).

> Senior tip: turn on {{log_lock_waits = on}} so the log records waits longer than deadlock_timeout; that is the best clue when you investigate.`
  },
  'qz-sql-012': {
    q: `A feed API is keyset-paginated: the next page uses {{WHERE created_at < :lastCreatedAt ORDER BY created_at DESC LIMIT 20}}. Users report posts **going missing** occasionally while scrolling. What is the cause and what is the correct fix?`,
    options: [
      'Keyset pagination is inherently unstable, so you have to go back to OFFSET',
      'There is no index on created_at, so PostgreSQL returns rows in random order',
      'It is caused by READ COMMITTED isolation; the query must run under SERIALIZABLE',
      'Many posts share the same created_at; the last row of the page and the remaining rows with that timestamp are skipped. You need a tie-breaker: WHERE (created_at, id) < (:lastCreatedAt, :lastId) ORDER BY created_at DESC, id DESC, with an index on (created_at, id)'
    ],
    explain: `**Correct answer: the missing tie-breaker means the ordering is not unique.**

### Why posts go missing
Suppose 3 posts share {{created_at = 10:00:00}} and page 1 ends on the first of them. Page 2 filters on {{created_at < 10:00:00}}, so it **skips** the other two entirely. Conversely, using {{<=}} would repeat rows instead.

### The fix
~~~sql
SELECT id, created_at, title FROM posts
WHERE (created_at, id) < (:lastCreatedAt, :lastId)  -- row comparison
ORDER BY created_at DESC, id DESC
LIMIT 20;
-- index: CREATE INDEX ON posts (created_at, id);  B-tree can scan backwards
~~~
The pair (created_at, id) is unique, so the cursor always points to exactly the right position.

### Why the other options are incorrect
- **Back to OFFSET**: {{OFFSET 100000}} still has to read and discard 100k rows, which is very slow; it also shifts the page window when new posts are inserted.
- **Missing index**: with ORDER BY, the order between distinct values is always correct; only rows with equal values have an undefined order.
- **SERIALIZABLE**: this is a logic bug in the query, not a concurrency bug.

> Senior tip: return an opaque cursor to the client (base64 of created_at + id) instead of letting the client send the two parameters itself; that way changing the sort key later does not break the API.`
  },
  'qz-sql-013': {
    q: `After a bulk import of 500 thousand rows into {{order_items}}, a report that took 200 ms now takes 40 s. {{EXPLAIN ANALYZE}} shows:
~~~text
Nested Loop  (cost=0.85..16.90 rows=1 width=48) (actual time=0.05..39812.3 rows=480211 loops=1)
  ->  Index Scan using ix_items_order on order_items  (rows=1) (actual rows=480211 loops=1)
~~~
What is the most sensible first action?`,
    options: [
      'Raise work_mem to 1GB for the whole cluster',
      'Run ANALYZE order_items because the statistics are stale: the planner estimated 1 row but there are really 480 thousand, which is why it picked Nested Loop',
      'Drop the ix_items_order index to force PostgreSQL into a Seq Scan',
      'Run VACUUM FULL to reclaim space'
    ],
    explain: `**Correct answer: run ANALYZE.**

### Reading the plan
The most important signal in EXPLAIN ANALYZE is the **gap between the estimated {{rows=}} and {{actual rows}}**. Here the planner thinks there is 1 row, so Nested Loop looks cheapest, but there are really 480 thousand rows: the nested loop runs 480 thousand times. Estimates are based on the statistics in {{pg_statistic}}; right after an import, autovacuum has not had time to ANALYZE yet (it runs once the number of changed rows crosses a threshold, and it lags behind).
~~~sql
ANALYZE order_items;   -- fast, only samples rows
~~~
After that the planner usually switches to a Hash Join.

### Why the other options are incorrect
- **work_mem 1GB for the whole cluster**: every sort/hash in every connection can use that much, which easily exhausts RAM; and it does not fix a wrong estimate.
- **Dropping the index**: it breaks other queries that rely on the index; the root cause is the statistics.
- **VACUUM FULL**: it takes an exclusive lock on the table and rewrites it entirely; it has nothing to do with estimates (VACUUM FULL does not update planner statistics the way ANALYZE does).

> Senior tip: put {{ANALYZE}} at the end of every ETL/bulk load job. For correlated columns (city, district), use {{CREATE STATISTICS}} so the planner stops misestimating.`
  },
  'qz-sql-014': {
    q: `The {{users}} table uses soft delete (column {{deleted_at}}) and has {{UNIQUE (email)}}. A user deletes their account and then signs up again with the same email, and gets a duplicate key error. What is the best solution on PostgreSQL?`,
    options: [
      'Drop the unique constraint entirely and check for duplicate email with a SELECT in Java before INSERT',
      'Set the email to NULL when soft deleting',
      'Replace UNIQUE with a partial unique index: CREATE UNIQUE INDEX ux_users_email_active ON users(email) WHERE deleted_at IS NULL',
      'Add deleted_at to the unique key: UNIQUE (email, deleted_at)'
    ],
    explain: `**Correct answer: a partial unique index.**

### Why this is correct
A partial index only contains rows that satisfy the {{WHERE}} condition. Soft-deleted rows are not in the index, so they no longer block that email; among **active** accounts the email is still unique, and the constraint is still enforced by the database. The index is also smaller because it skips deleted rows.

### Why the other options are incorrect
- **Check in Java**: two concurrent requests both SELECT and see "not present", then both INSERT, causing a race condition. Only a database constraint can prevent that.
- **Set the email to NULL**: you lose data needed for auditing / restoring the account.
- **UNIQUE (email, deleted_at)**: active accounts have {{deleted_at = NULL}}, and NULL is treated as distinct in a unique constraint, so **two active accounts with the same email can still be inserted**. This is the classic trap.

> Senior tip: with JPA, declare this index in a migration (Flyway/Liquibase), do not rely on {{@Table(uniqueConstraints)}}, because that annotation cannot express a WHERE condition.`
  },
  'qz-sql-015': {
    q: `On PostgreSQL 15, what happens with the two INSERT statements below?
~~~sql
CREATE TABLE users (id int PRIMARY KEY, email text UNIQUE);
INSERT INTO users VALUES (1, NULL), (2, NULL), (3, 'a@x.com');  -- statement 1
INSERT INTO users VALUES (4, 'a@x.com');                       -- statement 2
~~~`,
    options: [
      'Statement 1 succeeds (two rows with a NULL email coexist); statement 2 fails with a unique violation',
      'Statement 1 fails because two NULL values are duplicates in a UNIQUE column',
      'Both statements succeed because UNIQUE is only checked at commit time',
      'Statement 1 fails because a UNIQUE column is implicitly NOT NULL'
    ],
    explain: `**Correct answer: statement 1 succeeds, statement 2 fails.**

### Why this is correct
In the SQL standard, NULL means "unknown", so two NULLs are **not considered equal**. The default UNIQUE constraint (NULLS DISTINCT) allows many NULL rows. Statement 2 inserts {{a@x.com}} again, so it violates the constraint (SQLSTATE 23505).

PostgreSQL 15 added syntax to treat NULLs as duplicates:
~~~sql
CREATE TABLE users (id int PRIMARY KEY, email text UNIQUE NULLS NOT DISTINCT);
~~~

### Why the other options are incorrect
- **Statement 1 fails because of the two NULLs**: only true when declared {{NULLS NOT DISTINCT}}.
- **Checked at commit**: by default a unique constraint is checked immediately (NOT DEFERRABLE); only a {{DEFERRABLE INITIALLY DEFERRED}} declaration defers it to commit.
- **UNIQUE is implicitly NOT NULL**: that is PRIMARY KEY, not UNIQUE.

> Senior tip: for columns that are "optional, but unique when present" (national ID number, referral code), UNIQUE is usually exactly what you want. If you want at most one NULL row, use NULLS NOT DISTINCT; MySQL/Oracle handle NULLs in unique constraints differently, so be careful when migrating.`
  },
  'qz-sql-016': {
    q: `The following upsert runs **3 times**, then the final statement runs. What does {{SELECT v FROM counters WHERE k = 'a'}} return?
~~~sql
CREATE TABLE counters (k text PRIMARY KEY, v int NOT NULL);

INSERT INTO counters VALUES ('a', 1)
ON CONFLICT (k) DO UPDATE SET v = counters.v + EXCLUDED.v;   -- runs 3 times

INSERT INTO counters VALUES ('a', 5) ON CONFLICT (k) DO NOTHING;
~~~`,
    options: [
      '1',
      '8',
      'A duplicate key error on the second upsert',
      '3'
    ],
    explain: `**Correct answer: 3.**

### Step by step
1. Run 1: key 'a' does not exist yet, so a new row is inserted, v = 1.
2. Run 2: primary key conflict, so the DO UPDATE branch runs. {{counters.v}} is the **existing** value (1) and {{EXCLUDED.v}} is the **incoming** value (1), so v = 2.
3. Run 3: v = 2 + 1 = 3.
4. The final statement is {{DO NOTHING}}: on conflict it skips, leaving v = 3.

### Why the other options are incorrect
- **1**: assumes ON CONFLICT always keeps the old row (that is DO NOTHING).
- **8**: assumes DO NOTHING still adds 5.
- **Duplicate key error**: ON CONFLICT is exactly what catches that error and turns it into an UPDATE.

### Frequently asked points
- {{INSERT ... ON CONFLICT DO UPDATE}} is **atomic** even when several sessions insert concurrently, unlike the "SELECT then INSERT/UPDATE" pattern in application code.
- You need a unique index/constraint that matches {{(k)}} exactly, otherwise the statement fails.
- One statement cannot update the same row twice: if VALUES contains two rows with the same key 'a', you get "ON CONFLICT DO UPDATE command cannot affect row a second time".

> Senior tip: counting views/likes at high frequency on a single row still causes row lock contention; batching (buffering in Redis/memory and flushing periodically) reduces the load considerably.`
  },
  'qz-sql-017': {
    q: 'On PostgreSQL, which anomalies does the **REPEATABLE READ** isolation level prevent? (Choose 3)',
    options: [
      'Dirty read',
      'Write skew (two transactions read the same data and then write to different rows, breaking a shared constraint)',
      'Non-repeatable read',
      'Phantom read',
      'Every serialization anomaly (the result is always equivalent to running serially)'
    ],
    explain: `**Correct answer: dirty read, non-repeatable read, phantom read.**

### Why this is correct
PostgreSQL's REPEATABLE READ is really **snapshot isolation**: a transaction sees a snapshot taken at its first statement and keeps it until the end.
- It never sees uncommitted data, so there is no dirty read (in fact PostgreSQL never has dirty reads, even at READ UNCOMMITTED).
- Reading the same row again always returns the same value, so there is no non-repeatable read.
- Rows inserted by another transaction do not appear in the snapshot, so there is no phantom. This is **stronger than the SQL standard** (the standard allows phantoms at this level).
- If two transactions update the same row, the later one gets {{could not serialize access due to concurrent update}} and must retry.

### Why the other options are incorrect
- **Write skew**: for example the constraint "at least 1 doctor must be on call". Two doctors both see 2 people on call and both ask for leave, each updating their own row; there is no write conflict, so both commit. Only SERIALIZABLE (SSI) detects it.
- **Every serialization anomaly**: that is the definition of SERIALIZABLE.

> Senior tip: with SERIALIZABLE you must have retries for SQLSTATE {{40001}}. Alternatively lock explicitly with {{SELECT ... FOR UPDATE}} on the row that represents the constraint.`
  },
  'qz-sql-018': {
    q: 'The {{orders}} table has the B-tree index {{(customer_id, created_at)}}. Which statements are **correct**? (Choose 2)',
    options: [
      'The index serves WHERE customer_id = ? AND created_at > ? well',
      'The index serves WHERE created_at > ? equally well when there is no customer_id condition',
      "The WHERE condition note LIKE '%abc' can use a B-tree index on the note column",
      'Every added index makes INSERT/UPDATE slower and costs extra disk space and WAL'
    ],
    explain: `**Correct answer: options 1 and 4.**

### Why this is correct
- A composite index is sorted by {{customer_id}} first, and within the same customer by {{created_at}}. With {{customer_id = ?}} the B-tree jumps straight to that customer's group, and {{created_at > ?}} is then a contiguous range inside the group. This is the ideal case: **equality columns first, range columns after**.
- Every row write has to update every related index, generate extra WAL and consume cache RAM. Redundant indexes can also prevent HOT updates (updates that touch no index) when the updated column is part of an index.

### Why the other options are incorrect
- **Filtering on created_at only**: without the leading column (leftmost prefix), created_at values are scattered across every customer group. The planner usually chooses a Seq Scan or has to scan the whole index, which is not as efficient as the case with customer_id.
- **LIKE '%abc'**: B-tree only supports a fixed prefix ({{LIKE 'abc%'}}, with the C collation or the text_pattern_ops opclass). Suffix/substring search needs a trigram index ({{pg_trgm}} + GIN).

> Senior tip: periodically check {{pg_stat_user_indexes}} (column {{idx_scan = 0}}) for unused indexes; dropping them often improves write speed noticeably.`
  },
  'qz-sql-019': {
    q: `On PostgreSQL 15, the {{orders}} table has primary key {{id}}. Does the following query use the primary key index?
~~~sql
WITH recent AS (
  SELECT * FROM orders WHERE status = 'PAID'
)
SELECT * FROM recent WHERE id = 42;
~~~`,
    options: [
      'No. A CTE is always an optimization fence: PostgreSQL computes all of recent and only then filters id = 42',
      'Yes. Since PostgreSQL 12, a non-recursive CTE with no side effects that is referenced only once is inlined, so the id = 42 condition is pushed down and the index is used',
      'It only uses the index if written as WITH recent AS MATERIALIZED (...)',
      'No, because SELECT * inside the CTE always forces a Seq Scan'
    ],
    explain: `**Correct answer: yes, the CTE is inlined.**

### Why this is correct
Before PostgreSQL 12, every CTE was **materialized**: the whole result was computed first, so it acted as an "optimization fence" that outer conditions could not get through. Since PG 12, if a CTE:
- is not recursive,
- has no side effects (it is not INSERT/UPDATE/DELETE ... RETURNING and uses no volatile function),
- is referenced only **once**,

then the planner folds it into the main query like a subquery. {{id = 42 AND status = 'PAID'}} are then considered together and the primary key index is used.

### Why the other options are incorrect
- **Always a fence**: true for PG 11 and earlier, and many older articles still say so.
- **MATERIALIZED**: the opposite; this keyword **forces** materialization, i.e. puts the fence back. Use it when you want an expensive expression computed exactly once.
- **SELECT with every column**: the number of columns does not decide whether an index is used.

> Senior tip: a CTE referenced twice is materialized by default; if things get slow after an upgrade or a refactor, try {{NOT MATERIALIZED}} and compare with EXPLAIN ANALYZE.`
  },
  'qz-sql-020': {
    q: `What does the following query return?
~~~sql
CREATE TABLE orders (id int, customer_id int, created_at date, amount int);
INSERT INTO orders VALUES
  (1, 1, '2024-01-01', 100),
  (2, 1, '2024-01-05', 200),
  (3, 2, '2024-01-03', 50),
  (4, 2, '2024-01-02', 70);

SELECT DISTINCT ON (customer_id) customer_id, amount
FROM orders
ORDER BY customer_id, created_at DESC;
~~~`,
    options: [
      '(1, 100), (2, 70)',
      '(1, 200), (2, 50)',
      '(1, 300), (2, 120)',
      'Error: amount must appear in GROUP BY'
    ],
    explain: `**Correct answer: (1, 200), (2, 50).**

### The mechanism
{{DISTINCT ON (customer_id)}} is PostgreSQL-specific syntax: for each customer_id value it keeps the **first row** according to the ORDER BY ordering. Here the sort is {{created_at DESC}}, so the first row is the **newest** order:
- customer 1: 2024-01-05, amount 200
- customer 2: 2024-01-03, amount 50

The rule: the expressions in DISTINCT ON must come first in ORDER BY; the columns after that decide which row is kept.

### Why the other options are incorrect
- **(1, 100), (2, 70)**: these are the **oldest** orders, the result of sorting ASC.
- **(1, 300), (2, 120)**: that is SUM per group; DISTINCT ON does not aggregate.
- **GROUP BY error**: there is no GROUP BY, so that rule does not apply.

### The equivalent SQL-standard form
~~~sql
SELECT customer_id, amount FROM (
  SELECT *, row_number() OVER (PARTITION BY customer_id ORDER BY created_at DESC) AS rn
  FROM orders) t
WHERE rn = 1;
~~~

> Senior tip: the "latest record per group" problem comes up a lot. An index on {{(customer_id, created_at DESC)}} makes both forms fast; when there are few groups with many rows each, LATERAL + LIMIT 1 is often fastest.`
  },
  'qz-testing-009': {
    q: `At which line does the following Mockito test throw, and why?
~~~java
List<String> list = Mockito.spy(new ArrayList<>());
Mockito.when(list.get(0)).thenReturn("x");   // line A
assertEquals("x", list.get(0));             // line B
~~~`,
    options: [
      'Line A throws IndexOutOfBoundsException, because with a spy, list.get(0) inside when() calls the real method on an empty list',
      'Line B throws IndexOutOfBoundsException, because a spy always calls the real method and ignores stubs',
      'There is no exception, the test passes',
      'Line A throws UnfinishedStubbingException because a spy does not support stubbing'
    ],
    explain: `**Correct answer: line A throws IndexOutOfBoundsException.**

### The mechanism
Java evaluates arguments before calling the method. Inside {{when(list.get(0))}}, the expression {{list.get(0)}} runs first. With a **mock**, that call is merely recorded and returns a default value. But a **spy** wraps a real object and forwards calls to the real method by default, and an empty {{ArrayList}} throws before Mockito gets a chance to register the stub.

The correct form for a spy is doReturn, which does not call the real method:
~~~java
Mockito.doReturn("x").when(list).get(0);
~~~

### Why the other options are incorrect
- **Line B**: execution never reaches line B; and if the stub had succeeded, the spy **would** use it.
- **Test passes**: only true for a mock.
- **UnfinishedStubbingException**: a spy can be stubbed fine, you just need the right syntax.

> Senior tip: needing a spy is usually a sign that the class does too much. Extract the part you need to fake into its own dependency and mock it; that gives clearer tests than a partial mock.`
  },
  'qz-testing-010': {
    q: 'A test class uses {{@SpringBootTest(webEnvironment = RANDOM_PORT)}} and {{@Transactional}}. The test saves a user through the repository and then calls {{GET /users/42}} with {{TestRestTemplate}}, which returns 404. Why?',
    options: [
      'TestRestTemplate cannot send requests to a random port',
      'The repository has not flushed; calling flush() is enough for the controller to see the user',
      'The HTTP request is handled on a different server thread with its own transaction and connection; the user was saved in the test transaction and never committed, so the server cannot see it. For the same reason, data written by the server will not be rolled back after the test',
      '@Transactional on the test makes the controller run in read-only mode'
    ],
    explain: `**Correct answer: two different transactions on two threads.**

### The mechanism
{{@Transactional}} on the test opens a transaction bound to the **thread running the test** and rolls it back when the test ends. With RANDOM_PORT, a real server (Tomcat) runs on its own port; the request from TestRestTemplate travels over a socket and is handled by a **Tomcat thread**, where the controller opens a new transaction on a different connection. Under READ COMMITTED isolation, that transaction cannot see the test's uncommitted data, so it returns 404.

The flip side: data written by the server is really committed, and the test rollback cannot undo it, leaving garbage for later tests.

### Why the other options are incorrect
- **Random port**: TestRestTemplate is configured by Spring with the correct port.
- **flush()**: flush only sends the SQL to the database but does **not commit**; other transactions still cannot see it.
- **Read-only**: there is no such mechanism.

### The right way
- Full-stack tests: do not use @Transactional; clean up with {{@Sql}} or by truncating tables in {{@AfterEach}}.
- Or use MockMvc (same thread), where the test rollback does work.

> Senior tip: this bug also hides real bugs: the test passes because lazy loading works inside the test transaction, while production throws LazyInitializationException.`
  },
  'qz-testing-011': {
    q: 'Which statements are **correct** about {{@DataJpaTest}} in Spring Boot 3? (Choose 2)',
    options: [
      'It only loads JPA components (entities, repositories, EntityManager, DataSource); ordinary @Service beans are not in the context',
      'It starts an embedded Tomcat so controllers can be tested too',
      'Each test runs in a transaction by default and rolls back when it finishes',
      'Each save() is flushed and committed to the database immediately, so constraint violations always surface right at the save() line'
    ],
    explain: `**Correct answer: options 1 and 3.**

### Why this is correct
- {{@DataJpaTest}} is a **test slice**: it only enables the auto-configuration related to JPA. Autowiring a {{@Service}} fails with {{NoSuchBeanDefinitionException}}; to have one, {{@Import}} it explicitly.
- The annotation already includes {{@Transactional}}, so each test rolls back by itself and tests do not pollute each other's data.

### Why the other options are incorrect
- **Embedded Tomcat**: this slice does not load the web layer; test controllers with {{@WebMvcTest}}.
- **Flush and commit immediately**: the opposite. {{save()}} only puts the entity into the persistence context; the SQL may not have run yet, and the transaction rolls back at the end so it never commits. As a result, unique/not-null violations can **stay hidden**:
~~~java
repo.save(new User("dup@x.com"));
repo.save(new User("dup@x.com"));
em.flush();   // TestEntityManager: force the SQL out so constraints are checked
~~~

> Senior tip: combine @DataJpaTest with Testcontainers PostgreSQL ({{@AutoConfigureTestDatabase(replace = NONE)}} or {{@ServiceConnection}}) to test the real dialect, constraints and native queries instead of an embedded database.`
  },
  'qz-testing-012': {
    q: 'A {{@WebMvcTest(OrderController.class)}} test fails while starting the context: {{NoSuchBeanDefinitionException: OrderService}}. The controller receives OrderService through its constructor. What is the correct fix (Spring Boot 3.4+)?',
    options: [
      'Switch to @SpringBootTest so every bean is loaded',
      'Declare a field @MockitoBean OrderService orderService in the test (older Boot versions use @MockBean, which is now deprecated)',
      'Add @ComponentScan("com.shop") to the test class',
      'Use a plain Mockito @Mock OrderService with @ExtendWith(MockitoExtension.class)'
    ],
    explain: `**Correct answer: @MockitoBean.**

### Why this is correct
{{@WebMvcTest}} only loads the web layer: the specified controller, {{@ControllerAdvice}}, converters, filters, MockMvc. Services and repositories are **deliberately** excluded to keep tests fast and isolated. So you must supply OrderService as a mock **registered as a bean** in the ApplicationContext:
~~~java
@WebMvcTest(OrderController.class)
class OrderControllerTest {
  @Autowired MockMvc mvc;
  @MockitoBean OrderService orderService;   // fake bean inside the context

  @Test void returns404() throws Exception {
    when(orderService.find(1L)).thenReturn(Optional.empty());
    mvc.perform(get("/orders/1")).andExpect(status().isNotFound());
  }
}
~~~

### Why the other options are incorrect
- **@SpringBootTest**: it works but loads the whole application (DB, Kafka…), which is slow and loses the isolation of the slice.
- **@ComponentScan**: it pulls in the real service and its dependencies, breaking the slice, and usually fails next because the repository is missing.
- **Plain @Mock**: it creates a mock but does **not** put it into the Spring context, so the context still fails.

> Senior tip: Spring Framework 6.2 / Boot 3.4 introduced {{@MockitoBean}} and {{@MockitoSpyBean}} to replace {{@MockBean}}/{{@SpyBean}}. New code should use the new names so it does not need changing on upgrade.`
  },
  'qz-testing-013': {
    q: `JUnit 5 with default configuration. What does the following test print?
~~~java
class CounterTest {
  private int count = 0;

  @Test void a() { count++; System.out.println("a=" + count); }
  @Test void b() { count++; System.out.println("b=" + count); }
}
~~~`,
    options: [
      'a=1 and b=2',
      'Error: a field shared between tests must be static',
      'a=1, b=2 or b=1, a=2 depending on execution order',
      'Both print 1 (a=1 and b=1)'
    ],
    explain: `**Correct answer: both print 1.**

### The mechanism
By default JUnit 5 uses {{@TestInstance(Lifecycle.PER_METHOD)}}: it creates **a new instance of the test class for every test method**. Each test has its own {{count}} starting at 0, so it always prints 1 regardless of the order. This design keeps tests independent and prevents state from leaking between them.

Consequence: {{@BeforeAll}}/{{@AfterAll}} must be **static** methods (because they run before any instance exists), unless you switch to {{PER_CLASS}}.

### Why the other options are incorrect
- **a=1 and b=2**: true with {{@TestInstance(PER_CLASS)}}, when one instance is shared by the whole class.
- **Must be static**: not required; on the contrary, it is a static field that gets shared and creates order dependence.
- **Depends on order**: the execution order of methods is indeed not guaranteed (unless you use {{@TestMethodOrder}}), but the result here does not depend on it.

> Senior tip: PER_CLASS is handy when setup is expensive (it allows a non-static @BeforeAll, and is common in Kotlin), but you must reset state in @BeforeEach, otherwise you end up with tests that only pass in the right order.`
  },
  'qz-testing-014': {
    q: 'The CI pipeline has a few tests that flicker between green and red although the code has not changed. Which of the following **commonly cause flaky tests**? (Choose 3)',
    options: [
      'A test using LocalDate.now() to check the logic "is today the last day of the month"',
      'Using @ParameterizedTest with fixed data from @CsvSource',
      'Several tests writing to a shared static Map without cleaning up',
      'Asserting containsExactly("a", "b", "c") on a result obtained from a HashSet',
      'Using assertThrows to check an exception'
    ],
    explain: `**Correct answer: real time, shared state, undefined ordering.**

### Why these are correct
- **LocalDate.now()**: the result depends on the day it runs and on the CI machine's time zone (usually UTC). The test only goes red on the 31st, or between 00:00 and 07:00 Vietnam time. Fix: inject a {{Clock}} and use {{Clock.fixed(...)}} in the test.
- **Shared static state**: the outcome depends on which test ran before; parallel execution ({{junit.jupiter.execution.parallel.enabled}}) also causes races. Fix: each test creates its own data and resets it in {{@BeforeEach}}.
- **HashSet + containsExactly**: the iteration order of a HashSet depends on hashes and capacity and can change when you upgrade the JDK or add elements. Fix: {{containsExactlyInAnyOrder}}, or return a List/LinkedHashSet if ordering is a business requirement.

### Why the other options are incorrect
- **Fixed @CsvSource**: the data is deterministic, so it behaves the same no matter how many times it runs.
- **assertThrows**: the standard, deterministic way to check exceptions in JUnit 5.

> Senior tip: do not let the CI "retry until green" forever. Quarantine flaky tests into a watched list with an owner; flaky tests train the team to ignore red, and one day that means ignoring a real bug.`
  },
  'qz-testing-015': {
    q: 'A project has 40 integration test classes, each declaring {{@Container PostgreSQLContainer<?> db = new PostgreSQLContainer<>("postgres:16")}} (a **non-static** field). The whole suite takes 25 minutes. What is the best improvement?',
    options: [
      'Declare the container as static and share it: a base class starts the container once (static) for the whole suite, configuring the connection with @ServiceConnection (Boot 3.1+) or @DynamicPropertySource',
      'Switch to H2 so Docker is not needed',
      'Give Docker Desktop more RAM and keep the field declaration as it is',
      'Run each test class in its own JVM to parallelize'
    ],
    explain: `**Correct answer: a static, shared container.**

### The mechanism
With the {{@Testcontainers}} extension, a **non-static** {{@Container}} field is started and stopped **for every test method**; a static field is started once per class. 40 classes times several methods means hundreds of PostgreSQL startups, each taking a few seconds. On top of that, different connection URLs make the Spring context cache miss and force the context to be rebuilt.

The common pattern (singleton container):
~~~java
abstract class IntegrationTest {
  @ServiceConnection   // Boot 3.1+: configures spring.datasource.* automatically
  static final PostgreSQLContainer<?> DB = new PostgreSQLContainer<>("postgres:16");
  static { DB.start(); }   // once per JVM; Ryuk cleans up when the JVM exits
}
~~~

### Why the other options are incorrect
- **H2**: fast, but a different dialect and different lock/constraint behaviour; that is exactly why Testcontainers was chosen.
- **More RAM**: it does not reduce the number of container startups.
- **One JVM per class**: each JVM starts its own container and Spring context again, which costs even more.

> Senior tip: when several test classes share one database, you need a data isolation strategy (transaction rollback, table truncation, or a separate id/tenant per test), otherwise you get flaky tests caused by data bleeding between tests.`
  },
  'qz-testing-016': {
    q: `The {{PriceService}} interface has a method {{int discount(int percent)}}. What happens at the following stub line (Mockito 5)?
~~~java
PriceService svc = Mockito.mock(PriceService.class);
Mockito.when(svc.discount(ArgumentMatchers.any())).thenReturn(10);
~~~`,
    options: [
      'The stub works: discount(any number) returns 10',
      'Compile error because any() cannot be used for an int parameter',
      'NullPointerException right at the stub line: any() returns null, and null is unboxed into an int',
      'InvalidUseOfMatchersException when the test calls svc.discount(5)'
    ],
    explain: `**Correct answer: NullPointerException at the stub line.**

### The mechanism
A Mockito argument matcher does two things: it records a matcher on an internal stack, and it **returns a fake value** so the code compiles. {{any()}} is the generic {{<T> T any()}} and returns {{null}}. The compiler infers T as {{Integer}} and then **unboxes** it to {{int}} to pass it to {{discount(int)}}. Unboxing null throws an NPE before Mockito gets a chance to process anything.

The correct way: use the matcher for the primitive type, which returns 0:
~~~java
when(svc.discount(anyInt())).thenReturn(10);
~~~

### Why the other options are incorrect
- **The stub works**: execution never gets past the stub line.
- **Compile error**: generics + autoboxing let the code compile; the failure only appears at runtime, which is exactly why this trap is dangerous.
- **InvalidUseOfMatchersException**: that error happens when you mix matchers with plain values (for example {{foo(anyInt(), 5)}}); the fix there is to wrap the value with {{eq(5)}}.

> Senior tip: quick rule to remember: for primitive parameters use {{anyInt()/anyLong()/anyBoolean()}}; once you use a matcher, **every** parameter must be a matcher.`
  },
  'qz-testing-017': {
    q: `JUnit 5: what does running test {{t}} in the nested class print?
~~~java
class OrderTest {
  @BeforeEach void outer() { System.out.print("O "); }

  @Nested class WhenPaid {
    @BeforeEach void inner() { System.out.print("I "); }
    @Test void t() { System.out.print("T"); }
  }
}
~~~`,
    options: [
      'I O T',
      'O I T',
      'O T',
      'I T'
    ],
    explain: `**Correct answer: O I T.**

### The mechanism
The {{@Nested}} class is an inner class (non-static), so each of its instances is attached to an instance of the outer class. Before each test in the nested class, JUnit 5 runs the {{@BeforeEach}} callbacks **from the outside in**: OrderTest's first, then WhenPaid's, and only then the test itself. {{@AfterEach}} runs in the opposite direction: inner first, outer last.

This lets you build the context layer by layer:
~~~text
OrderTest        @BeforeEach: create a new order
  WhenPaid       @BeforeEach: pay the order
    t()          check behaviour once paid
~~~

### Why the other options are incorrect
- **I O T**: the order is reversed; the outer class always sets up first.
- **O T** and **I T**: both callbacks run, neither is skipped or replaced.

### Notes
- A {{@Nested}} class must be **non-static**; a static nested class is not treated as a nested test class.
- Naming classes after the scenario ({{WhenPaid}}, {{GivenExpiredCard}}) makes the test report read like a specification.

> Senior tip: do not nest more than 2–3 levels; when you have to scroll three screens to know what setup has run, the test is harder to read than the real code.`
  },
  'qz-testing-018': {
    q: 'A Spring Boot test suite rebuilds the ApplicationContext up to 30 times instead of reusing it from the cache. Which factors **cause a new context** (a cache miss)? (Choose 3)',
    options: [
      'Each test class declares a different combination of @MockitoBean',
      'The test methods have different names',
      'A test class is marked @DirtiesContext',
      'Different @ActiveProfiles between test classes',
      'A test class is marked @Transactional'
    ],
    explain: `**Correct answer: different @MockitoBean, @DirtiesContext, different profiles.**

### How the context cache works
Spring TestContext keeps contexts in a cache (within the same JVM) keyed by **configuration**: configuration classes, profile, properties ({{@TestPropertySource}}, {{properties=}}), initializers, context customizers… Two test classes with exactly the same key share one context.
- **@MockitoBean/@MockBean**: each distinct combination of mock beans is a different customizer, hence a different key, so a new context is built.
- **@DirtiesContext**: marks the context dirty, closes it and evicts it from the cache; the next test must rebuild it.
- **Different @ActiveProfiles**: the profile is part of the key.

### Why the other options are incorrect
- **Method names**: they are not part of the context configuration.
- **@Transactional**: it only controls per-test rollback, it does not change the context.

### How to fix it
Collect the mocks into one shared base class, standardize the profile, and remove unnecessary @DirtiesContext. Turn on {{logging.level.org.springframework.test.context.cache=DEBUG}} to see hit/miss statistics.

> Senior tip: the cache keeps at most 32 contexts by default ({{spring.test.context.cache.maxSize}}); each context holds its own thread pool and connection pool, so too many contexts can also exhaust the test database connections.`
  },
  'qz-testing-019': {
    q: 'A client calls a partner API with a 1 s read timeout and 3 retries. You want to test for certain that, when the partner is slow, the client tries exactly 3 times and then returns the fallback. Which approach is best?',
    options: [
      'Mock the RestClient with Mockito and have it throw SocketTimeoutException',
      'Call the real partner sandbox and wait for it to be slow',
      'Add Thread.sleep(3000) to production code when the test profile is active',
      'Use WireMock: stub the endpoint with withFixedDelay(3000), call the client, assert the fallback result, then verify(3, getRequestedFor(urlEqualTo(...)))'
    ],
    explain: `**Correct answer: WireMock with a simulated delay.**

### Why this is correct
WireMock is a fake HTTP server that really runs on a port, so the test goes through the client's **entire HTTP stack**: connection pool, timeout configuration, serializer, retry interceptor.
~~~java
stubFor(get(urlEqualTo("/rates"))
    .willReturn(aResponse().withStatus(200).withFixedDelay(3000)));  // slower than the 1 s timeout

Rate r = client.getRates();              // must return the fallback
assertThat(r.source()).isEqualTo("CACHE");
verify(3, getRequestedFor(urlEqualTo("/rates")));  // exactly 3 times, no more
~~~

### Why the other options are incorrect
- **Mock RestClient**: you decide which exception is thrown yourself, so you never verify that the timeout is **configured correctly**; you may also skip the retry interceptor that lives in the HTTP layer.
- **Real sandbox**: you cannot control the delay, and it is slow and flaky.
- **Sleep in production code**: it puts test logic into real code, which is very dangerous if the profile is ever enabled by mistake.

> Senior tip: WireMock can also simulate {{Fault.CONNECTION_RESET_BY_PEER}} or garbage data; test 5xx errors, 429 with Retry-After and malformed bodies too, because production incidents often come from there.`
  }
});
