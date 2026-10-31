/*
 * English translation of js/data/q-sql.js — task T552 (redo after the Vietnamese content changed). Format: js/core/i18n.js (content overlay).
 * ids: sql-009 sql-010 sql-011 sql-012 sql-013 sql-014 sql-015 sql-016
 */
App.i18n.content({
  'sql-009': {
    q: 'Table category(id, name, parent_id): a multi-level category tree of unlimited depth. You need to find all descendant categories (all levels) of a given category. Write the query with a Recursive CTE. What if the tree has a cycle?',
    a: `**Summary:** Use a **Recursive CTE** ({{WITH RECURSIVE}}): the **anchor** selects the root node, and the **recursive** part joins back on {{parent_id = id}} to walk downward. PostgreSQL/MySQL 8+ use {{WITH RECURSIVE}}; Oracle 11gR2+ and SQL Server use {{WITH}} (without the RECURSIVE keyword). Guard against cycles with the {{cycle}} clause (PostgreSQL 14+) or a {{path}} column that checks whether {{id}} has already appeared.

### Quick understanding
Think of listing every descendant in a family tree: you start from the founding ancestor (the anchor), ask "who are this person's children?", and get the generation-2 list; then for **each person** in generation 2 you ask "who are this person's children?" and get generation 3, and so on. You repeat until nobody has children any more, then stop. A Recursive CTE runs exactly that loop inside the database. If the family tree was recorded wrongly as "A is B's parent and B is A's parent", the questions would loop forever, so we carry a "notebook" of the people already visited (a path) and never go back to one of them.

### Terms
- **Adjacency list**: storing a tree with a {{parent_id}} column pointing to the parent — the most common way to model a tree in a relational DB.
- **Anchor member**: the SELECT that runs once at the start and produces the seed rows.
- **Recursive member**: the SELECT that references the CTE itself and runs repeatedly over the rows produced by the previous round.
- **Working table**: the set of new rows from the latest round; the next round joins only against this set.
- **Cycle**: dirty data where a node ends up being its own ancestor.
- **CONNECT BY**: Oracle's own hierarchical-query syntax, which predates the standard recursive CTE.
- **BOM (Bill of Materials)**: a tree describing a product built from parts and sub-parts.

### Rounds illustrated
~~~text
5 (Electronics)                  round 0 (anchor): {5}             path {5}
|-- 12 (Phones)                  round 1: children of {5}   -> {12, 13}
|   \\-- 40 (Phone case)         round 2: children of {12,13} -> {40, 41}
\\-- 13 (Laptops)                round 3: children of {40,41} -> {} -> STOP
    \\-- 41 (Laptop bag)         path of 40 = {5,12,40}
~~~

### Basic Recursive CTE
~~~sql
WITH RECURSIVE subcats AS (
    -- Anchor: the root node
    SELECT c.id, c.name, c.parent_id, 1 AS level, ARRAY[c.id] AS path
    FROM category c
    WHERE c.id = 5  -- root category whose descendants we want

    UNION ALL

    -- Recursive: find children of the nodes we already found
    SELECT c.id, c.name, c.parent_id, s.level + 1, s.path || c.id
    FROM category c
    JOIN subcats s ON c.parent_id = s.id
    -- Cycle guard: never enter a node already present in path
    WHERE c.id <> ALL (s.path)
)
SELECT id, name, parent_id, level
FROM subcats
WHERE level > 1  -- drop the root node if you only want descendants
ORDER BY level, path;
~~~

### Explaining each part
1. **Anchor**: runs once and selects the root node. Column {{level}} = 1, {{path}} = an array holding the root id (used for cycle detection and sorting). Use an **array**, not a concatenated string checked with {{LIKE}}: the text path '5>12' would falsely match {{LIKE '%1%'}} and wrongly block node id 1.
2. **UNION ALL**: do not use {{UNION}} (which removes duplicates) because by design a tree has no duplicate rows; {{UNION ALL}} is faster.
3. **Recursive term**: join {{c.parent_id = s.id}} — walk from parent to child. {{level}} increases by 1, and {{path}} appends the child id.
4. **WHERE {{c.id <> ALL (s.path)}}**: the cycle guard. If the data is dirty (A is the parent of B, and B is the parent of A), the path will contain a repeated id, so this condition stops the infinite recursion.
5. **Termination**: when the recursive term returns no rows, the CTE stops. Why it is guaranteed to stop: each round joins only against the **new** rows of the previous round (the working table), and the path prevents revisiting a node on the same branch, so the number of rounds is at most the depth of the tree.

Note: array types ({{ARRAY}}, {{<> ALL}}) are PostgreSQL-specific. MySQL 8 has no arrays; the usual trick is a delimited string path, e.g. {{CONCAT(s.path, c.id, ',')}} with the initial path {{CONCAT(',', id, ',')}}, then test {{FIND_IN_SET(c.id, s.path) = 0}} or {{s.path NOT LIKE CONCAT('%,', c.id, ',%')}} (commas on both sides prevent false matches). Declare a large enough length for the path column in the anchor ({{CAST(... AS CHAR(1000))}}), because MySQL takes the column type from the anchor part.

### PostgreSQL 14+: the CYCLE clause (SQL standard)
~~~sql
WITH RECURSIVE subcats AS (
    SELECT id, name, parent_id, 1 AS level
    FROM category WHERE id = 5
    UNION ALL
    SELECT c.id, c.name, c.parent_id, s.level + 1
    FROM category c JOIN subcats s ON c.parent_id = s.id
)
CYCLE id SET is_cycle USING path
SELECT * FROM subcats WHERE NOT is_cycle;
~~~
- {{CYCLE id SET is_cycle USING path}}: detects cycles automatically, sets {{is_cycle = true}} on the row that closes the cycle, and stores the path already visited. It is very compact and is standard SQL (available since SQL:1999); Oracle 11gR2+ has it too ({{CYCLE id SET is_cycle TO 'Y' DEFAULT 'N'}}).

### Oracle: CONNECT BY (older syntax, still widely used)
~~~sql
SELECT id, name, parent_id, LEVEL,
       CONNECT_BY_ISCYCLE AS is_cycle   -- only valid together with NOCYCLE
FROM category
START WITH id = 5
CONNECT BY NOCYCLE PRIOR id = parent_id;
~~~
- Without {{NOCYCLE}}, Oracle raises {{ORA-01436: CONNECT BY loop in user data}} when it hits a cycle. {{NOCYCLE}} stops the branch at the repeat point, and {{CONNECT_BY_ISCYCLE}} = 1 marks a row whose child points back to an ancestor.
- Oracle 11gR2+ also supports the standard recursive {{WITH}} (no RECURSIVE keyword, and you must list the CTE columns explicitly).

### Performance and indexes
- An index on {{parent_id}} (the foreign-key index) is **mandatory**. Without it, every recursive step full-scans the category table.
- With a large tree (hundreds of thousands of nodes), a Recursive CTE is still fast because each node is visited only once.
- Depth limit: add {{WHERE s.level < 100}} to the recursive term for safety (SQL Server has {{OPTION (MAXRECURSION n)}}, default 100; MySQL has the {{cte_max_recursion_depth}} variable, default 1000).

### Other uses
- Find all ancestors: flip the join to {{c.id = s.parent_id}}.
- Bill of materials: product -> components -> sub-components.
- Shortest path between two nodes: needs BFS; a Recursive CTE is not optimal for it.

### Common mistakes
1. **No cycle guard**. Symptom: the query runs forever, CPU sits at 100%, temp files grow until it is cancelled ({{pg_cancel_backend}}). Prevention: path/CYCLE clause, a level limit, and always set {{statement_timeout}} on queries like this; add a constraint/trigger that blocks creating a cycle on write.
2. **Using UNION instead of UNION ALL**. Symptom: sort/unique work on every round, many times slower. Prevention: {{UNION ALL}} plus a path.
3. **SELECT * in the recursive term**. Symptom: dragging along unneeded columns and wasting memory. Prevention: select only the columns you need.
4. **A text path checked with LIKE and no delimiters**. Symptom: a text {{path}} is memory-hungry and matches by accident (id 1 matches inside "12"), so it wrongly blocks a node. Prevention: use an array ({{ARRAY[id]}} and the {{||}} operator) as in the example above, or put delimiters on both ends on MySQL.

### 1-minute verbal answer
"With a tree stored through parent_id I use a recursive CTE. The anchor picks the root category, the recursive part joins category against the CTE itself on parent_id = id to descend one level per round, combined with UNION ALL; the loop stops when a round produces no new rows. To guard against dirty data with cycles I carry a path array of visited ids and block ids already in the path, or use the CYCLE clause on PostgreSQL 14 and later; Oracle has CONNECT BY NOCYCLE. An index on parent_id is mandatory, otherwise every level is a full scan. I also set statement_timeout and a depth limit, because I have seen a recursive query run forever and fill the temp disk on production."

> Senior tip: in an interview, write the Recursive CTE on paper/whiteboard without worrying about exact syntax — the interviewer cares that you know the **anchor**, the **recursive term**, the **termination condition**, and **cycle detection**. Say clearly: "I use UNION ALL, I carry a path to detect cycles, and an index on parent_id is mandatory." That is the answer of someone who has actually deployed recursive queries to production.`,
    follow: [
      'Why use UNION ALL instead of UNION in a Recursive CTE?',
      'How do you find the "shortest path" between two nodes in a tree (not just all descendants)?'
    ]
  },
  'sql-010': {
    q: 'You need to upsert (INSERT if it does not exist, UPDATE if it does) a record into account_balance(account_id, currency, balance, updated_at) with unique key (account_id, currency). Write the statement for PostgreSQL (ON CONFLICT) and Oracle (MERGE). Explain the race condition when you write SELECT → INSERT/UPDATE yourself.',
    a: `**Summary:** Upsert with a single statement in the DB: PostgreSQL {{INSERT … ON CONFLICT (account_id, currency) DO UPDATE …}}, Oracle {{MERGE INTO … USING … ON (…) WHEN MATCHED THEN UPDATE … WHEN NOT MATCHED THEN INSERT …}}. Writing {{SELECT}} to check for existence and then {{INSERT}}/{{UPDATE}} **has a race condition**: two threads both see "does not exist" → both INSERT → unique violation or wrong data.

### Quick understanding
Imagine a parking-ticket desk: the clerk wants "if the car has no ticket yet, issue a new one; if it has one, update the time". If two clerks look at the ledger at the same moment, both see "no ticket", and both issue one — the car ends up with two tickets. That is the race condition of the "check, then act" style. An upsert in the DB is like **a single ticket machine with a lock**: asking and issuing are one indivisible action, and the second person touching the machine automatically goes down the "update" branch. The unique index is the lock of that machine.

### Terms
- **Upsert**: INSERT if the row is absent, UPDATE (or skip) if it is present, in one statement.
- **Race condition**: the outcome depends on the random interleaving of concurrent threads.
- **Check-then-act**: a code pattern that reads some state and then acts on it; unsafe without locking.
- **Conflict target**: the list of columns (or the constraint name) that ON CONFLICT uses to recognize a duplicate row.
- **EXCLUDED**: a virtual table in PostgreSQL holding the row that was about to be inserted but conflicted.
- **Optimistic / pessimistic locking**: detecting conflicts at write time with a version column / locking the row as it is read.
- **Gap lock**: an InnoDB lock placed on the "gap" between index values to block INSERTs into that range.
- **Idempotency key**: a key generated by the client so the server can recognize a repeated request.

### How ON CONFLICT works, step by step
1. PostgreSQL tries to insert the new row and checks the unique index {{(account_id, currency)}}. Why the index is needed: it is the only place where the DB can be sure "this row exists or not", including rows from other transactions that have not committed yet.
2. If there is no duplicate, the INSERT is done.
3. If it duplicates a row **another transaction is still writing**, the statement **waits** for that transaction to finish and then checks again. Why: so that two rows with the same key can never exist.
4. If it duplicates a committed row, that row is locked and the {{DO UPDATE}} branch runs. Under READ COMMITTED, PostgreSQL guarantees the result is always either an insert **or** an update, never a duplicate-key error.

~~~text
No upsert (SELECT then INSERT):          With ON CONFLICT:
A: SELECT -> not found                   A: INSERT ... -> inserts, keeps the index lock
B: SELECT -> not found                   B: INSERT ... -> sees A writing -> WAITS
A: INSERT -> OK                          A: COMMIT
B: INSERT -> duplicate key!              B: checks again -> DO UPDATE -> OK
~~~

### PostgreSQL: INSERT … ON CONFLICT (UPSERT)
~~~sql
INSERT INTO account_balance (account_id, currency, balance, updated_at)
VALUES ('ACC123', 'VND', 1000000, NOW())
ON CONFLICT (account_id, currency) DO UPDATE
SET balance = EXCLUDED.balance,
    updated_at = EXCLUDED.updated_at;
~~~
- {{ON CONFLICT (account_id, currency)}}: names the **unique constraint/index** used as the conflict condition. A unique index on (account_id, currency) must exist.
- {{EXCLUDED}}: a pseudo-table holding the {{VALUES}} you wanted to insert. Use {{EXCLUDED.balance}} to read the new value.
- You can add a {{WHERE}} after {{DO UPDATE}} so the update only happens when a condition holds (for example, only update if the new balance is larger).

### Oracle: MERGE
~~~sql
MERGE INTO account_balance ab
USING (SELECT 'ACC123' AS account_id, 'VND' AS currency, 1000000 AS balance, SYSTIMESTAMP AS updated_at FROM dual) src
ON (ab.account_id = src.account_id AND ab.currency = src.currency)
WHEN MATCHED THEN
    UPDATE SET ab.balance = src.balance, ab.updated_at = src.updated_at
WHEN NOT MATCHED THEN
    INSERT (account_id, currency, balance, updated_at)
    VALUES (src.account_id, src.currency, src.balance, src.updated_at);
~~~
- {{USING}} can be a subquery, a temp table, or {{dual}} for a single row.
- MERGE exists since Oracle 9i; 10g allows a single WHEN branch and adds {{DELETE WHERE}}. Oracle has **no** ON CONFLICT syntax.
- **Concurrency note**: MERGE does not "lock in advance" a row that does not exist yet. Two sessions merging the same new key can both fall into the NOT MATCHED branch, so the later session hits {{ORA-00001}} (unique violation) and must catch the error and retry. PostgreSQL {{ON CONFLICT}} guarantees an atomic insert-or-update even when running concurrently (PostgreSQL 15 also has MERGE, but PostgreSQL's MERGE can likewise throw a unique violation when run concurrently).

### Race condition of the SELECT-then-INSERT/UPDATE pattern (anti-pattern)
~~~java
// WRONG: race condition
Optional<AccountBalance> existing = repo.findByAccountIdAndCurrency(id, ccy);
if (existing.isPresent()) {
    existing.get().setBalance(newBal);
    repo.save(existing.get());
} else {
    repo.save(new AccountBalance(id, ccy, newBal));
}
~~~
**Failure timeline:**
1. Thread A: {{SELECT}} → sees no record.
2. Thread B: {{SELECT}} → sees no record (A has not committed).
3. Thread A: {{INSERT}} → succeeds.
4. Thread B: {{INSERT}} → **unique constraint violation** (or, if the exception is caught, a retry — but atomicity is already lost).

**Result:** either an exception (PostgreSQL: {{ERROR: duplicate key value violates unique constraint}}), or (with MySQL {{INSERT IGNORE}}) thread B silently skips the update, so the data stays stale.

### Correct solutions at the application layer
1. **Use a native upsert query** (JPA {{@Query(nativeQuery = true)}} or JdbcTemplate) — atomic inside the DB.
2. **Optimistic locking**: a {{version}} column, {{WHERE version = ?}} on update. If the {{UPDATE}} affects 0 rows, retry the whole logic. You still need an upsert for the INSERT.
3. **Pessimistic locking**: {{SELECT … FOR UPDATE}} only locks rows that **already exist** — for a row that does not exist yet, PostgreSQL/Oracle lock nothing, so it cannot stop two concurrent INSERTs (MySQL InnoDB under REPEATABLE READ has gap locks, but they often cause deadlocks). It costs locks and is not recommended for high throughput.
4. **Idempotency key**: the client generates {{idempotency_key}}, and the server does {{INSERT … ON CONFLICT (idempotency_key) DO NOTHING}} — used for payments and webhooks.

### MySQL: INSERT … ON DUPLICATE KEY UPDATE
~~~sql
INSERT INTO account_balance (account_id, currency, balance, updated_at)
VALUES ('ACC123', 'VND', 1000000, NOW())
ON DUPLICATE KEY UPDATE
    balance = VALUES(balance),
    updated_at = VALUES(updated_at);
~~~
- Requires a unique key on (account_id, currency).
- The {{VALUES(col)}} function inside ON DUPLICATE KEY UPDATE was deprecated in MySQL 8.0.20; the new syntax uses a row alias: {{VALUES (...) AS new ON DUPLICATE KEY UPDATE balance = new.balance}}.

### Common mistakes
1. **Missing the unique index for the conflict target**. Symptom: PostgreSQL says "there is no unique or exclusion constraint matching the ON CONFLICT specification"; MySQL says nothing and just inserts duplicate rows. Prevention: create the unique constraint first and check it in migrations.
2. **One multi-row upsert with two rows sharing a key**. Symptom: PostgreSQL says "ON CONFLICT DO UPDATE command cannot affect row a second time" (Oracle MERGE similarly raises ORA-30926). Prevention: merge/deduplicate the source data by key before sending the batch.
3. **Overwriting instead of accumulating**. Symptom: the balance is replaced by the transaction amount. Prevention: {{SET balance = account_balance.balance + EXCLUDED.balance}} when the business rule is additive.
4. **Using JPA save() and assuming it is an upsert**. Symptom: occasional {{DataIntegrityViolationException}} under high load. Prevention: a native upsert, or catch and retry.

### Other production pitfalls
- No unique index on the upsert key ⇒ ON CONFLICT cannot tell which columns conflict ⇒ error or duplicate inserts.
- PostgreSQL: the conflict target must match **exactly** one unique constraint/index (the PK is a unique constraint too). If the PK is a surrogate {{id}}, then {{ON CONFLICT (account_id, currency)}} needs its own unique index on that pair; with a partial unique index you must repeat the index WHERE condition inside ON CONFLICT.
- {{DO UPDATE SET col = EXCLUDED.col}} overwrites **every** column in the SET list. If you only want to "accumulate balance": {{SET balance = account_balance.balance + EXCLUDED.balance}}.
- Oracle MERGE: if {{USING}} returns several rows matching the same target row → {{ORA-30926}} ("unable to get a stable set of rows"). Always make the source unique on the join key.
- In Hibernate: use {{@Query(nativeQuery = true)}} for upsert; {{save()}}/{{saveAndFlush()}} is not an upsert.

### 1-minute verbal answer
"An upsert inserts if the row is absent and updates if it is present, and I always let the DB do it in a single statement. On PostgreSQL I use INSERT ON CONFLICT with the conflict target being the unique index (account_id, currency), taking the new values through EXCLUDED; under READ COMMITTED it guarantees the result is either an insert or an update, even when running concurrently. Oracle uses MERGE, but two sessions merging the same new key can still hit ORA-00001, so I catch the error and retry; MySQL uses ON DUPLICATE KEY UPDATE. If I write SELECT and then INSERT or UPDATE myself there is a race condition: two requests both see nothing, both insert, and the later one fails with duplicate key. In Java I write a native query or use JdbcTemplate, not JPA save, and I have fixed exactly this bug in a top-up flow."

> Senior tip: the "how do you upsert" question is really checking "do you understand race conditions". A high-scoring answer: "I use INSERT ON CONFLICT (PostgreSQL) — atomic in the DB; with Oracle MERGE I still catch ORA-00001 and retry, because concurrent MERGE on a new key can hit the unique constraint. Hand-written SELECT-INSERT/UPDATE has a race condition: two requests both see nothing → both INSERT → unique violation or a lost update. In Java I use a native query or JdbcTemplate, not JPA save, because save is not atomic."`,
    follow: [
      'Why does ON CONFLICT require a unique index/constraint and not accept just a CHECK constraint?',
      'When should you use "INSERT … ON CONFLICT DO NOTHING" instead of DO UPDATE?'
    ]
  },
  'sql-011': {
    q: 'In SQL, NULL does not equal NULL. Explain COUNT(*) vs COUNT(col) vs COUNT(DISTINCT col) when the column contains NULL. Why does SUM(col) return NULL instead of 0 when all values are NULL? Where does ORDER BY … ASC/DESC place NULL?',
    a: `**Summary:** NULL means "unknown / no value" — it is not equal to any value, including NULL. {{COUNT(*)}} counts **all rows**; {{COUNT(col)}} counts only rows where **col IS NOT NULL**; {{COUNT(DISTINCT col)}} counts **distinct** values (excluding NULL). {{SUM}}/{{AVG}} skip NULL but return **NULL** if **all** rows are NULL (there is no value to compute). PostgreSQL/Oracle treat NULL as **largest** ({{ASC}} → NULL last, {{DESC}} → NULL first); MySQL/SQL Server treat NULL as **smallest** ({{ASC}} → NULL first, {{DESC}} → NULL last) — always specify {{NULLS FIRST/LAST}} on DBs that support it.

### Quick understanding
NULL is like a **blank survey answer**: the person did not answer, which is not the same as answering "0". Two blank answers do not mean two people gave the same answer — we only know we **do not know**. That is why {{NULL = NULL}} is not TRUE but UNKNOWN. When counting: {{COUNT(*)}} counts the survey forms; {{COUNT(col)}} counts the forms where that question was filled in; {{COUNT(DISTINCT col)}} counts how many different answers exist. And "the total money of the people who did not fill it in" is not 0 but "no data" — that is why SUM returns NULL.

### Terms
- **NULL**: a marker for "no value / unknown", not the number 0 and not an empty string.
- **Three-valued logic**: the logic of TRUE, FALSE, UNKNOWN; WHERE keeps only rows that are TRUE.
- **Aggregate function**: a function that folds many rows into one value, such as {{SUM}}, {{AVG}}, {{COUNT}}.
- **COALESCE(a, b)**: returns the first non-NULL value in the list.
- **NULLS FIRST / NULLS LAST**: the SQL-standard clause that decides where NULLs go when sorting.
- **Partial index**: a PostgreSQL index containing only the rows that satisfy a WHERE condition.
- **IS DISTINCT FROM**: the SQL-standard comparison that treats two NULLs as equal (PostgreSQL supports it; MySQL uses the {{<=>}} operator).

### Step by step when the DB computes an aggregate
1. **COUNT(*)**: every row that passes increments the counter by 1; the column value is never inspected. Why it is never NULL: the counter starts at 0.
2. **COUNT(col), SUM, AVG, MIN, MAX**: for each row, if {{col}} is NULL it is **skipped**; otherwise it enters the calculation. Why: NULL has no value to add.
3. **AVG** = sum of the non-NULL values / **number of non-NULL values** (not divided by the total row count).
4. **Finish**: if no value entered the calculation, SUM/AVG/MIN/MAX return NULL (the SQL standard), while COUNT returns 0.

~~~text
amount: 100, NULL, 200, 200, NULL
COUNT(*)              = 5
COUNT(amount)         = 3      (2 NULLs skipped)
COUNT(DISTINCT amount)= 2      {100, 200}
SUM(amount)           = 500
AVG(amount)           = 500/3 = 166.67   (not 500/5 = 100)
SUM over an all-NULL set = NULL -> COALESCE(SUM(amount), 0) = 0
~~~

### The three kinds of COUNT — worked example
Table {{orders(customer_id, amount)}}:
| customer_id | amount |
|---|---|
| 1 | 100 |
| 1 | NULL |
| 2 | 200 |
| 2 | 200 |
| 3 | NULL |

~~~sql
SELECT
    COUNT(*)           AS cnt_all,        -- 5 (all rows)
    COUNT(amount)      AS cnt_amt,        -- 3 (only rows with amount NOT NULL)
    COUNT(DISTINCT amount) AS cnt_dist,   -- 2 (100, 200; NULL not counted)
    SUM(amount)        AS sum_amt,        -- 500 (NULL skipped)
    AVG(amount)        AS avg_amt         -- 166.67 (500/3, not divided by 5)
FROM orders;
~~~

### NULL in aggregates
- {{SUM}}, {{AVG}}, {{MIN}}, {{MAX}} **skip** NULL in the calculation.
- But if **no row is non-NULL** (all NULL, or no rows at all) the result is **NULL** (not 0).
- {{COUNT}} never returns NULL — it returns 0 when there are no rows.

**Why does SUM return NULL?** SQL follows the standard: the aggregate of an empty set is NULL. This distinguishes "a total of 0" (there is data and it sums to 0) from "there is no data". Always use {{COALESCE(SUM(col), 0)}} when you need 0.

### NULL in ORDER BY
| DB | Default ASC | Default DESC | Standard syntax |
|---|---|---|---|
| PostgreSQL | NULLS LAST | NULLS FIRST | {{ORDER BY col ASC NULLS LAST}} |
| MySQL | NULLS FIRST | NULLS LAST | Does not support NULLS FIRST/LAST (not even 8.x) — use {{ORDER BY col IS NULL, col}} |
| Oracle | NULLS LAST | NULLS FIRST | {{ORDER BY col ASC NULLS LAST}} |
| SQL Server | NULLS FIRST | NULLS LAST | Does not support NULLS FIRST/LAST (use {{CASE WHEN col IS NULL THEN 1 ELSE 0 END}}) |

**Always state the NULL order explicitly** (NULLS FIRST/LAST or a CASE expression) so you do not depend on the DB default.

### Comparing with NULL
- {{col = NULL}} → always UNKNOWN (never TRUE). Use {{col IS NULL}}.
- {{col <> NULL}} → always UNKNOWN. Use {{col IS NOT NULL}}.
- {{col IN (1, 2, NULL)}}: if col = 3 → UNKNOWN (because 3 = NULL is UNKNOWN) ⇒ no match; turning it into {{NOT IN}} is still UNKNOWN ⇒ also no match. This is the {{NOT IN}} trap.
- {{NULL = NULL}} → UNKNOWN. {{NULL IS NULL}} → TRUE.

### NOT IN vs NOT EXISTS (reminder)
{{NOT IN (subquery)}}: if the subquery returns **one** NULL, the whole statement returns **0 rows**. This is why {{NOT EXISTS}} is safer.

### Common mistakes
1. **WHERE col = NULL**. Symptom: no error, just 0 rows — a silent "missing data" bug. Prevention: {{IS NULL}} / {{IS NOT NULL}}; to compare two nullable columns use {{IS NOT DISTINCT FROM}} (PostgreSQL) or {{<=>}} (MySQL).
2. **Misunderstanding AVG**. Symptom: the average looks "unusually high" because people who did not take the test (NULL) are not in the denominator. Prevention: decide the business rule explicitly; if NULL means 0, use {{AVG(COALESCE(col, 0))}}.
3. **SUM returning NULL and leaking into Java**. Symptom: {{NullPointerException}} when unboxing {{BigDecimal}}/{{Long}}, or a blank value on screen. Prevention: {{COALESCE(SUM(col), 0)}}.
4. **Adding strings/numbers to NULL**. Symptom: {{price + NULL}} or {{'a' || NULL}} (PostgreSQL) makes the entire expression NULL. Prevention: COALESCE each operand.

### Other production pitfalls
- {{GROUP BY col}}: all NULLs are grouped into **one group** (unlike the {{=}} comparison, GROUP BY/DISTINCT treat NULLs as "not distinguishable"). If you want a readable label: {{GROUP BY COALESCE(col, 'UNKNOWN')}}.
- {{COUNT(DISTINCT col)}} on a column that is **entirely** NULL returns 0, not 1.
- Indexes and NULL: a PostgreSQL B-tree **does** store NULLs and can serve {{IS NULL}}; MySQL InnoDB does too. An Oracle B-tree stores **no** entry when every column of the key is NULL, so {{WHERE col IS NULL}} cannot use a single-column index (trick: index {{(col, 0)}}). For a column that is mostly NULL on PG, a partial index {{WHERE col IS NOT NULL}} keeps the index smaller.

### 1-minute verbal answer
"NULL means unknown or no value, so any comparison with NULL yields UNKNOWN, including NULL equals NULL, and WHERE keeps only TRUE rows; to test for it you must use IS NULL. COUNT star counts every row, COUNT of a column counts rows that have a value, COUNT DISTINCT counts distinct values and also skips NULL. SUM, AVG, MIN, MAX skip NULL; if no value remains they return NULL rather than 0, to distinguish 'a total of 0' from 'no data', which is why I always wrap them in COALESCE. For ordering, PostgreSQL and Oracle treat NULL as largest, MySQL and SQL Server treat it as smallest, so I always write NULLS LAST explicitly or use an IS NULL expression. The mistake I see most is WHERE col = NULL returning empty without any error."

> Senior tip: "NULL does not equal NULL" is the core idea. In an interview, demo it quickly: {{SELECT NULL = NULL}} → UNKNOWN, {{SELECT NULL IS NULL}} → TRUE. And remember: {{COUNT(*)}} counts rows, {{COUNT(col)}} counts non-NULL values — this is a very common screening question for junior/mid candidates.`,
    follow: [
      'Why is SUM of an empty set NULL instead of 0?',
      'How do you index for WHERE col IS NULL queries on PostgreSQL?'
    ]
  },
  'sql-012': {
    q: 'Compare DELETE vs TRUNCATE vs DROP. When do you use which? View vs Materialized View: how do they differ, how do you refresh them, and what are the trade-offs?',
    a: `**Summary:** {{DELETE}}: removes rows, supports WHERE, writes WAL/redo, fires triggers, can roll back, slow. {{TRUNCATE}}: removes the **entire** table, no WHERE, minimal WAL, no triggers, **cannot roll back** (except PostgreSQL inside a transaction), fast. {{DROP}}: removes the table **structure** (schema, indexes, constraints, grants), and the data is gone. {{View}}: a virtual query, runs in real time, stores no data. {{Materialized View}}: stores a data snapshot, needs {{REFRESH}}, fast reads but the data may be stale.

### Quick understanding
Think of a notebook. **DELETE** is taking a pen and striking out the lines you choose — slow, but it can be "undone" and everyone watching (triggers) knows. **TRUNCATE** is tearing out all the pages while keeping the cover and the ruled lines — very fast, but nobody is told row by row. **DROP** is throwing the whole notebook away, cover and table of contents included (indexes, permissions). About views: a **View** is like a **recipe** — every time someone asks, it cooks again from fresh ingredients; a **Materialized View** is like a **meal already cooked and kept in the fridge** — take it and eat immediately, but it may have gone cold since the morning; to make it fresh you must cook again (REFRESH).

### Terms
- **DML / DDL**: data-manipulation statements (INSERT, UPDATE, DELETE) / structure-changing statements (CREATE, ALTER, DROP, TRUNCATE).
- **Implicit commit**: in Oracle/MySQL, running a DDL statement automatically commits the open transaction, so it cannot be rolled back.
- **WAL / redo log**: the write-ahead log of every change, used for crash recovery and for replicas to copy.
- **AccessExclusive lock**: PostgreSQL's strongest lock; it blocks even SELECT on the table.
- **MVCC**: the mechanism that keeps multiple row versions so readers are not blocked by writers.
- **Snapshot**: the "photograph" of the data at one point in time that a transaction sees.
- **Stale data**: data older than the source table.
- **Incremental refresh**: updating only the changed part instead of recomputing everything.

### Step by step mechanism
1. **DELETE**: for each row matching WHERE, the DB marks the row as deleted (PostgreSQL writes {{xmax}} and the row becomes a dead tuple waiting for VACUUM; InnoDB writes undo log), writes WAL/redo, checks FKs, and fires triggers. Why slow: the work is proportional to the number of rows.
2. **TRUNCATE**: the DB does not touch rows one by one; it allocates a new, empty data file for the table (PostgreSQL) or drops and recreates the table (InnoDB), writing only metadata. Why fast: almost independent of the row count; the price is a whole-table lock and no per-row triggers.
3. **DROP**: deletes the definition from the system catalog together with the data files, indexes, constraints and grants.
4. **View**: the DB stores the SELECT statement; when you query the view, that statement is "pasted" into your query and optimized as a whole.
5. **Materialized view**: the DB runs the SELECT once and writes the result as a real table on disk; REFRESH runs it again and replaces the whole result.

~~~text
Deleting 10 million rows (rough estimates, hardware dependent):
DELETE   : minutes -> tens of minutes, several GB of WAL, table bloated with dead tuples
TRUNCATE : < 1 second, tiny WAL, whole-table lock for a moment
View     : every read = re-runs the join/aggregate (e.g. 3 s)
MatView  : every read ~ 5 ms; nightly REFRESH takes 3 s, data up to 24 h old
~~~

### DELETE vs TRUNCATE vs DROP

| Feature | DELETE | TRUNCATE | DROP |
|---|---|---|---|
| What is removed | Rows (with WHERE) | The whole table | The table (structure + data) |
| WHERE | Yes | No | No |
| WAL/Redo log | Per row | Metadata only (deallocate pages) | Metadata |
| Triggers | {{BEFORE/AFTER DELETE}} fire | **Do not fire** | N/A |
| Rollback | Yes (inside a transaction) | PostgreSQL: yes inside a TX; Oracle/MySQL: **no** (DDL implicit commit) | No (DDL) |
| Identity/Sequence | Not reset | MySQL: **resets** AUTO_INCREMENT; PostgreSQL: resets only with {{TRUNCATE … RESTART IDENTITY}} (default is CONTINUE IDENTITY); Oracle: not reset | Attached sequence is lost |
| Speed | Slow (proportional to rows) | Very fast (O(1) metadata) | Fast |
| Lock | Row locks (SQL Server may escalate to a table lock) | AccessExclusive lock (PG) / Table lock | AccessExclusive lock |
| Foreign keys | FK checked per row | Must disable FKs or use {{TRUNCATE … CASCADE}} | Fails if other tables still reference it; need {{DROP TABLE … CASCADE}} (PG) / {{CASCADE CONSTRAINTS}} (Oracle) |

### When to use which
- **DELETE**: removing some rows, needs triggers/audit, needs rollback, has a WHERE.
- **TRUNCATE**: clearing a whole table (staging, logs, temp), no triggers needed, large data (add RESTART IDENTITY on PG when you need to reset the identity).
- **DROP**: removing a table you no longer use, migrations dropping a column/type.

### View vs Materialized View

| | View | Materialized View |
|---|---|---|
| Stores data | **No** | **Yes** (a snapshot) |
| Reads | Runs the defining query in real time | Reads the stored data — **very fast** |
| Writes | {{INSERT/UPDATE/DELETE}} on the view (if simple) or an {{INSTEAD OF trigger}} | **No direct writes** (need a refresh) |
| Freshness | Always current | Depends on the refresh schedule (may be stale) |
| Size | 0 | The size of the result |
| Indexes | None (uses the base-table indexes) | **Can create indexes** on the MV |
| Refresh | N/A | {{REFRESH MATERIALIZED VIEW name}} (full) or {{CONCURRENTLY}} (PG 9.4+) |

### Refreshing a Materialized View
- **Full refresh**: {{REFRESH MATERIALIZED VIEW mv_name}} — takes an exclusive lock and blocks reads during the refresh.
- **Concurrently** (PostgreSQL): {{REFRESH MATERIALIZED VIEW CONCURRENTLY mv_name}} — requires a **unique index** on the MV, does not block reads, is slower, and uses temporary space.
- **Incremental**: PostgreSQL does not support it out of the box; write your own summary table updated by triggers/jobs, or use the {{pg_ivm}} extension (Incremental View Maintenance); {{pg_cron}} only **schedules** REFRESH, it does not make it incremental. Oracle has {{FAST REFRESH}} with materialized view logs.
- **MySQL**: no materialized views; usually a summary table plus the event scheduler or a job to refresh it.

### Trade-offs when choosing an MV
- **Use an MV when**: the query is complex (many-way joins, big aggregates), runs often, and data a few minutes/hours old is acceptable.
- **Do not use an MV when**: data must be real-time (account balances, stock prices), the source table is small, or the query is simple.

### Common mistakes
1. **DELETE without WHERE to "clean a log table" of tens of millions of rows**. Symptom: runs for a very long time, WAL/binlog balloons, replicas lag, and the PostgreSQL table still occupies the same disk space. Prevention: TRUNCATE if you remove everything; if removing by time, delete in batches or partition by month and drop old partitions.
2. **TRUNCATE by mistake, assuming it can be rolled back**. Symptom: on MySQL/Oracle the data is gone because of the implicit commit. Prevention: restrict permissions so TRUNCATE is only allowed on staging schemas; back up first.
3. **Reading an MV and forgetting the refresh schedule**. Symptom: the dashboard disagrees with the real numbers; users complain "I already paid but do not see it". Prevention: show "updated at …" in the UI and monitor refresh lag.
4. **Frequent REFRESH (not CONCURRENTLY) during peak hours**. Symptom: every SELECT on the MV hangs during the refresh. Prevention: use CONCURRENTLY plus a unique index, or refresh outside business hours.

### Other production pitfalls
- {{TRUNCATE}} on a table with FKs: PostgreSQL requires {{TRUNCATE parent CASCADE}} or disabling the FKs first. Oracle: {{TRUNCATE TABLE … CASCADE}} (12c+).
- {{TRUNCATE}} inside a long transaction: it holds the {{AccessExclusive}} lock for a long time, blocking **all** access including {{SELECT}} until the transaction ends. TRUNCATE is also **not MVCC-safe**: after it commits, other transactions still using an old snapshot will see an empty table.
- MV {{REFRESH CONCURRENTLY}} without a unique index fails. The unique index on an MV is usually the primary key of the result.
- MV stale data means wrong reports. Always monitor: {{last_refresh_time}}, {{lag_seconds}}.

### 1-minute verbal answer
"DELETE is DML: it removes rows one by one according to WHERE, logs every row, fires triggers, checks FKs, and can roll back, but it is slow in proportion to the row count. TRUNCATE removes the whole table by reallocating its storage, almost instantly, without triggers, and locks the entire table; PostgreSQL can roll it back inside a transaction, while MySQL and Oracle cannot because DDL commits implicitly. DROP removes the table structure, indexes and permissions as well. A View is just a stored query, always current but recomputed on every read; a materialized view stores the result on disk, so reads are very fast and you can index it, but data is stale until the next REFRESH. I use MVs for scheduled aggregate reports refreshed with CONCURRENTLY, and never for balances that must be real-time."

> Senior tip: when the interviewer asks "can TRUNCATE be rolled back?", the reference answer is: "PostgreSQL can roll it back inside a transaction (MVCC); Oracle/MySQL cannot (DDL implicit commit)". For MVs: "I use an MV for a daily aggregate report refreshed once a night, not for real-time balances." Being able to state the trade-off is what makes you sound senior.`,
    follow: [
      'Does TRUNCATE reset identity/sequence on PostgreSQL, MySQL, and Oracle?',
      'How do you incrementally refresh a Materialized View on PostgreSQL?'
    ]
  },
  'sql-013': {
    q: 'You need to detect anomalous transactions: a transaction whose amount is more than 3 times the 30-day average of **that same customer**. Table transaction(id, customer_id, amount, created_at). Write the query with a CTE + window function.',
    a: `**Summary:** Use a CTE to compute {{avg_30d}} for each transaction: window {{AVG(amount) OVER (PARTITION BY customer_id ORDER BY created_at RANGE BETWEEN INTERVAL '30 days' PRECEDING AND INTERVAL '1 day' PRECEDING)}}. Then filter {{amount > 3 * avg_30d}}. Note: {{RANGE}} with an offset requires exactly one ORDER BY column of a numeric/date/timestamp type; PostgreSQL supports an {{INTERVAL}} offset in the frame from version 11.

### Quick understanding
Think of a bank calling to verify when you suddenly swipe 30 million while you normally spend a few million: "normal" here means **your own** normal, measured over a **recent window**. For each transaction we look back at a 30-day sliding window for the same customer, compute the average, and compare: more than 3 times gets flagged. The sliding window is like a 30-day ruler placed backwards at each transaction — for the next transaction the ruler slides along.

### Terms
- **Moving / rolling average**: the average over a window that slides with time or with rows.
- **Window frame**: the set of rows inside the partition that the AVG function can see when computing for the current row.
- **RANGE with offset**: a frame defined by a range of **values** (for example 30 days), not by a number of rows.
- **EXCLUDE CURRENT ROW**: removes the current row itself from the frame.
- **NULLIF(x, 0)**: returns NULL if x equals 0, used to avoid divide-by-zero.
- **Z-score**: how many standard deviations a value lies away from the mean.
- **False positive**: a false alarm — a normal transaction flagged as anomalous.
- **Stream processing**: processing data continuously as events arrive (Flink, Kafka Streams) instead of querying in batches.

### Step by step mechanism
1. **Partition by customer and sort by created_at**. Why: "that customer's own average" needs the customer, and a time window needs chronological order.
2. **For each transaction at time t**, determine the frame [t − 30 days, t − 1 day] by the **created_at value**. Why RANGE: the number of transactions per day is uneven, so "the previous 30 rows" does not mean "the previous 30 days".
3. **AVG the amounts in the frame**: an empty frame gives AVG = NULL.
4. **Filter in the outer layer**: {{amount > 3 * avg_30d}}, dropping rows where avg is NULL. Why the outer layer: window functions run after WHERE.

~~~text
Customer 42, transaction at 2026-03-31 10:00, amount = 9,000,000
frame = [2026-03-01 10:00, 2026-03-30 10:00]
  03-05: 1,000,000   03-12: 2,000,000   03-20: 1,500,000   03-29: 1,500,000
  avg_30d = 6,000,000 / 4 = 1,500,000
  9,000,000 > 3 * 1,500,000 = 4,500,000  -> ANOMALY (ratio = 6.0)
  (the 03-30 15:00 transaction falls in the last 24 h, so it is outside the frame)
~~~

### Window frame RANGE vs ROWS
- {{ROWS BETWEEN 30 PRECEDING AND 1 PRECEDING}}: takes the **previous 30 rows** (a count of rows), which does not fit because the number of transactions per day is uneven.
- {{RANGE BETWEEN INTERVAL '30 days' PRECEDING AND INTERVAL '1 day' PRECEDING}}: takes the rows whose {{created_at}} lies between **30 days ago and 1 day ago** (based on the timestamp value). This is the right meaning of "the 30-day average before".
- {{INTERVAL '1 day' PRECEDING}} is measured by **point in time**, not by calendar day: it excludes the current transaction and every transaction in the 24 hours immediately before it; the window is [t - 30 days, t - 1 day].

### Sample SQL (PostgreSQL)
~~~sql
WITH txn_with_avg AS (
    SELECT t.*,
           AVG(t.amount) OVER (
               PARTITION BY t.customer_id
               ORDER BY t.created_at
               RANGE BETWEEN INTERVAL '30 days' PRECEDING
                         AND INTERVAL '1 day' PRECEDING
           ) AS avg_30d
    FROM transaction t
)
SELECT t.id,
       t.customer_id,
       t.amount,
       t.created_at,
       t.avg_30d,
       t.amount / NULLIF(t.avg_30d, 0) AS ratio
FROM txn_with_avg t
WHERE t.avg_30d IS NOT NULL
  AND t.amount > 3 * t.avg_30d
ORDER BY t.customer_id, t.created_at;
~~~

### Edge cases
- {{NULLIF(avg_30d, 0)}}: avoid dividing by 0 when the average is 0.
- {{avg_30d IS NOT NULL}}: drop transactions that have no transactions in the window (new customer, or one who has been inactive). An AVG based on only 1–2 transactions is very noisy, so usually add {{COUNT(*) OVER (same frame)}} and require a minimum of N transactions.
- To take the full 30 days right up to the current transaction but exclude the transaction itself: {{RANGE BETWEEN INTERVAL '30 days' PRECEDING AND CURRENT ROW EXCLUDE CURRENT ROW}} (PG 11+). Do not just use {{AND CURRENT ROW}}: a large transaction would drag its own average up.

### MySQL 8 / SQL Server
MySQL 8.0+ supports {{RANGE}} with an interval offset (syntax {{INTERVAL 30 DAY PRECEDING}}).
SQL Server does not support {{RANGE INTERVAL}}; use {{ROWS}} combined with a subquery, or {{DATEADD}} in a join.
Alternative: a self-join or a correlated subquery (the syntax below is MySQL; on PostgreSQL write {{t.created_at - INTERVAL '30 days'}}):
~~~sql
SELECT t.*
FROM transaction t
WHERE t.amount > 3 * (
    SELECT AVG(t2.amount)
    FROM transaction t2
    WHERE t2.customer_id = t.customer_id
      AND t2.created_at >= DATE_SUB(t.created_at, INTERVAL 30 DAY)
      AND t2.created_at < DATE_SUB(t.created_at, INTERVAL 1 DAY)
);
~~~
This is usually slower than a window function, but the idea works on any DB.

### Performance and indexes
Composite index: {{(customer_id, created_at, amount)}}.
- A window function with {{RANGE}} forces a sort by {{created_at}} within each partition. An index on {{(customer_id, created_at)}} allows an index scan without sorting.
- Including {{amount}} in the index (INCLUDE or as the last column) enables an index-only scan.

### Extensions: isolation forest / z-score
The "3 times the average" rule is simple but produces many false positives (large periodic transactions). Production usually uses:
- **Z-score**: {{(amount - avg) / stddev}} > 3. Needs the {{STDDEV}} window function.
- **Percentile**: {{PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY amount)}} per customer — PostgreSQL does not allow an ordered-set aggregate as a window function, so you must GROUP BY and join back (Oracle does allow {{OVER (PARTITION BY …)}}).
- **Isolation Forest / ML**: offline training, online scoring.

### Common mistakes
1. **Using ROWS 30 PRECEDING**. Symptom: a customer making 50 transactions a day gets an "average of 30 rows" that covers only a few hours; a customer making one transaction a month gets an average covering a whole year ⇒ meaningless alerts. Prevention: RANGE with an INTERVAL offset.
2. **A frame that ends at CURRENT ROW**. Symptom: a large transaction drags its own average up, so it slips through. Prevention: end at {{1 day PRECEDING}} or use {{EXCLUDE CURRENT ROW}} (PostgreSQL; MySQL does not support EXCLUDE).
3. **An average over too few samples**. Symptom: a new customer with one 100k transaction gets the next 400k transaction flagged ⇒ many false positives. Prevention: add {{COUNT(*) OVER}} on the same frame and require a minimum of N transactions.
4. **Running over the whole history every time**. Symptom: the query takes minutes. Prevention: only score new transactions (for example the last day) while still reading the previous 30 days as context — filter in the outer layer, not before the window (filtering first would cut the frame).

### Other production pitfalls
- An {{INTERVAL}} offset only works with {{TIMESTAMP}}/{{DATE}} columns; for a numeric column (epoch seconds) the offset must be a number ({{RANGE BETWEEN 2592000 PRECEDING AND 86400 PRECEDING}}) or the column cast to a timestamp.
- PostgreSQL: a {{RANGE}} frame requires exactly **one** ORDER BY column whose data type supports interval arithmetic.
- Without an index on {{(customer_id, created_at)}} you get a full scan plus a sort of all data by (customer_id, created_at) ⇒ very slow, and work_mem spills to disk on tables of tens of millions of rows.
- Running this in real time on the transaction stream: use a materialized view refreshed every 5 minutes, or stream processing (Flink, Kafka Streams), instead of an ad-hoc query.

### 1-minute verbal answer
"I use a CTE that computes a moving average per transaction: AVG of amount OVER partition by customer_id, ordered by created_at, with a RANGE frame from 30 days before to 1 day before. I choose RANGE because the window must be measured in time, not in rows, and the number of transactions per day differs a lot between customers; and I exclude the current transaction from the frame so it cannot drag its own average up. The outer layer filters amounts above 3 times the average, drops the case with no history, and uses NULLIF when computing the ratio. An index on (customer_id, created_at) avoids a big sort. In practice the 3-times rule creates many false positives, so I add a minimum sample count, consider z-score, and run it in batches or as a stream rather than per request."

> Senior tip: "I use a window AVG with RANGE INTERVAL '30 days' PRECEDING because it averages over real time, not over a number of rows. The index on (customer_id, created_at) is mandatory. In production I would not run this query per request — I would pre-compute into an anomaly_score table refreshed every 5 minutes, or push it into Flink stream processing."`,
    follow: [
      'Why use RANGE INTERVAL instead of ROWS 30 PRECEDING?',
      'How do you compute a z-score instead of a simple ratio?'
    ]
  },
  'sql-014': {
    q: 'Write a query that filters March 2026 transactions correctly. Explain why not to use WHERE MONTH(created_at) = 3, why not BETWEEN, and why you must use a "half-open" condition (>= start AND < end). How does the time zone affect this?',
    a: `**Summary:** Correct way: {{WHERE created_at >= TIMESTAMPTZ '2026-03-01 00:00:00+07' AND created_at < TIMESTAMPTZ '2026-04-01 00:00:00+07'}}. **Do not** use {{MONTH(created_at) = 3}} (cannot use an index, wrong time zone), **do not** use {{BETWEEN}} (the inclusive upper bound misses or overlaps milliseconds). **Half-open** [start, end) is the standard: it includes the start and excludes the end. Time zone: {{created_at}} is stored as UTC, so convert to the user's time zone ({{AT TIME ZONE}}) **before** comparing, or use a {{TIMESTAMPTZ}} literal with an offset.

### Quick understanding
An index on {{created_at}} is like a **phone book sorted by time**. Ask "from 1 March until before 1 April" and you flip straight to the 1 March page and read until you hit 1 April, then stop. Ask "the rows whose MONTH(...) is 3" and the book is not sorted by "month of the day", so you must read **every page** to compute the month. About boundaries: "from 1 March to **before** 1 April" is a statement that cannot be wrong — you do not need to know whether the month has 30 or 31 days, or how many fractional digits the seconds have. Time zones are like "midnight in Hanoi is 5 p.m. the previous day in London": the same instant belongs to two different days.

### Terms
- **Half-open interval [start, end)**: an interval that includes the start point and excludes the end point.
- **SARGable**: a condition written so the DB can use an index to find the range — usually a "bare column" compared to a constant.
- **Index range scan**: reading a consecutive stretch of the index from the first key to the last key.
- **TIMESTAMPTZ**: the PostgreSQL type that stores an absolute instant (normalized to UTC) and displays it in the session time zone.
- **Session TimeZone**: the default time zone of the connection, used to interpret a literal that has no offset.
- **Expression / functional index**: an index on the result of an expression, e.g. {{((created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)}}; for a TIMESTAMPTZ column PostgreSQL does not allow indexing {{date(created_at)}} directly because the result depends on the session TimeZone (the function is not IMMUTABLE).
- **Partition pruning**: the DB skips partitions that certainly contain no matching data.
- **Instant / OffsetDateTime**: the Java types representing an absolute instant / an instant with an offset.

### Step by step when the DB runs a half-open condition
1. **Compute the two bounds**: {{2026-03-01 00:00+07}} = {{2026-02-28 17:00 UTC}}, {{2026-04-01 00:00+07}} = {{2026-03-31 17:00 UTC}}. Why: the TIMESTAMPTZ column stores UTC, so the comparison happens in one frame of reference.
2. **Seek into the B-tree** to the first key {{>= start}}. Why fast: the index is sorted, so it can be found in a few page reads (O(log n)).
3. **Read sequentially** to the right until the first key {{>= end}}, then stop. Why {{<}}: the end point belongs to the next month, so excluding it means two consecutive months can never overlap.
4. With {{MONTH(created_at) = 3}}, the DB must compute the function for **every** row (it cannot know which rows match before computing) ⇒ full scan.

~~~text
UTC  : ...02-28 17:00 --------- March in VN time --------- 03-31 17:00...
        ^ start (included)                         end (excluded) ^
March [-------------------------------------------------)
April                                                     [---------)
-> the two months touch exactly: no overlap, no gap
BETWEEN '03-01' AND '03-31' : stops at 03-31 00:00:00 -> loses almost all of 31 March
~~~

### Common mistakes

| How people write it | Problem |
|---|---|
| {{WHERE MONTH(created_at) = 3}} (MySQL; PostgreSQL writes {{EXTRACT(MONTH FROM created_at) = 3}}) | Wrapping a function around the column makes the index **unusable** (full scan). It also returns March of **every year** if you forget the year condition. Time zone is wrong too: {{created_at}} is UTC, {{MONTH()}} takes the UTC month, so a user at +07 sees a different month. |
| {{WHERE created_at BETWEEN '2026-03-01' AND '2026-03-31'}} | {{BETWEEN}} includes both ends. {{'2026-03-31'}} = {{'2026-03-31 00:00:00'}} → **loses almost the whole of 31 March** (everything after 00:00:00). If you write {{'2026-03-31 23:59:59'}} → **loses the fractional seconds** 23:59:59.000001–.999999 (PostgreSQL stores up to microseconds). |
| {{WHERE DATE(created_at) BETWEEN …}} | Still wraps a function → loses the index. |
| {{WHERE created_at >= '2026-03-01' AND created_at <= '2026-03-31 23:59:59'}} | An attempt to fix BETWEEN, but it still misses milliseconds, and it is brittle (February, leap years). |

### The right way: half-open interval
~~~sql
-- March 2026 in Vietnam time (+07)
SELECT *
FROM transaction
WHERE created_at >= TIMESTAMPTZ '2026-03-01 00:00:00+07'
  AND created_at <  TIMESTAMPTZ '2026-04-01 00:00:00+07';
~~~
- {{>= start}}: includes exactly 00:00:00.000 on 1 March.
- {{< end}}: excludes 00:00:00.000 on 1 April → **covers all of 31 March up to 23:59:59.999999**.
- Automatically correct for months of 28/29/30/31 days and for leap years.

### Time zone — the easiest thing to get wrong
- {{created_at}} should be stored in **UTC** ({{TIMESTAMPTZ}} / UTC {{DATETIME}}).
- A user at +07: the user's "March" is {{2026-03-01 00:00:00+07}} through {{2026-04-01 00:00:00+07}}.
- Option 1 (recommended): use {{TIMESTAMPTZ}} literals with an offset as above. The DB converts them to UTC for the comparison automatically.
- Option 2: convert the column (loses the index unless there is a functional index):
  {{WHERE (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') >= '2026-03-01' ...}}.
- Option 3 (application): Java computes the start/end bounds in the user's time zone and binds them as parameters — **the best** option, because the DB sees plain UTC values and uses the index optimally.

### Index and SARGable
- {{WHERE created_at >= ? AND created_at < ?}} is **SARGable** (Search ARGument ABLE) — the optimizer can use an index range scan.
- Any function on the column ({{MONTH()}}, {{DATE()}}, {{YEAR()}}, {{TRUNC()}}, {{CAST()}}) makes the condition **not SARGable** → full scan (unless there is a functional/expression index).
- Composite index {{(customer_id, created_at)}}: the condition {{customer_id = ? AND created_at >= ? AND created_at < ?}} allows an index range scan on the partition key.

### Java/Spring: binding parameters correctly
~~~java
// Good: compute the Instant in Java and bind parameters
ZoneId vn = ZoneId.of("Asia/Ho_Chi_Minh");
OffsetDateTime start = LocalDate.of(2026, 3, 1).atStartOfDay(vn).toOffsetDateTime();
OffsetDateTime end   = LocalDate.of(2026, 4, 1).atStartOfDay(vn).toOffsetDateTime();

List<Txn> txns = jdbc.query(
    "SELECT * FROM transaction WHERE created_at >= ? AND created_at < ?",
    rowMapper,
    start, end  // OffsetDateTime -> TIMESTAMPTZ (PgJDBC)
);
~~~
- Do not concatenate strings into SQL → avoids SQL injection and lets the plan cache hit.
- PgJDBC supports {{OffsetDateTime}} for {{TIMESTAMPTZ}} through setObject; for {{Instant}}, let Hibernate 6/JPA map it, or convert to a UTC {{OffsetDateTime}} when using plain JDBC.

### Common mistakes
1. **BETWEEN with the last day of the month**. Symptom: March revenue is missing almost all of 31 March, and reconciliation with accounting is off. Prevention: half-open {{>= start AND < end}}.
2. **Wrapping a function around the column**. Symptom: the report query gets slower as the table grows, and the plan is a Seq Scan. Prevention: move the computation to the constant side (compute the bounds in Java), or create an expression index if you must keep the function.
3. **Time-zone drift**. Symptom: a transaction at 6 a.m. on 1 April Vietnam time (23:00 on 31 March UTC) is counted in March. Prevention: always give timestamps an explicit offset/zone, and keep the JVM and the DB agreed on UTC.
4. **Using LocalDateTime in Java for a TIMESTAMPTZ column**. Symptom: results change when the server is moved to another time zone. Prevention: use {{Instant}}/{{OffsetDateTime}}.

### Other production pitfalls
- A literal without an offset such as {{created_at >= '2026-03-01'}} is interpreted against the {{TIMESTAMPTZ}} column using the **session** {{TimeZone}} ⇒ if the server/session is UTC, it is 7 hours off from a Vietnamese user's month. Always write the offset or bind the value from Java.
- "This week" reports: compute {{startOfWeek}} (Monday or Sunday depending on locale) in Java and bind parameters.
- Tables partitioned by month: a half-open {{created_at}} condition gives automatic **partition pruning**.
- CDC / replication: {{wal2json}}, {{Debezium}} emit events by commit time — still use half-open ranges when querying the data back for consistency.

### 1-minute verbal answer
"I filter March with a half-open range: created_at greater than or equal to midnight on 1 March and less than midnight on 1 April, in the user's time zone. Written that way the column stays bare, so the DB uses an index range scan, it is correct for any month length, and two consecutive months neither overlap nor leave a gap. I avoid MONTH(created_at) because wrapping a function around the column loses the index and takes the month in UTC; I avoid BETWEEN because it includes the end point — writing 31 March takes only midnight on the 31st, and writing 23:59:59 still misses fractional seconds. For time zones I store UTC in TIMESTAMPTZ, compute the two bounds in Java with ZoneId Asia/Ho_Chi_Minh, and bind them as parameters. I once fixed a revenue report that was off by exactly 7 hours because a literal had no offset."

> Senior tip: this is the "have you ever debugged a report that was wrong because of time zones" question. The strong answer: "I always use the half-open interval [start, end), bind the timestamps from Java (no DB functions on the column), and index created_at. BETWEEN and MONTH() are two traps I never use." Mentioning "SARGable", "partition pruning" and "plan cache" is a big plus.`,
    follow: [
      "Why does BETWEEN '2026-03-01' AND '2026-03-31' lose data?",
      'How do you create a functional index for WHERE DATE(created_at) = ? on PostgreSQL?'
    ]
  },
  'sql-015': {
    q: 'You run {{EXPLAIN (ANALYZE, BUFFERS)}} on an order-filtering query and the plan prints {{Seq Scan on orders}} with the line {{Rows Removed by Filter: 19980000}}, while somewhere else you see {{Index Only Scan}}. Read the plan for me: what each line says, when {{Seq Scan}} is actually the right choice, and how {{Index Only Scan}} differs from {{Index Scan}}?',
    a: `**Summary:** {{EXPLAIN}} prints a **tree of nodes**, executed from the leaves up to the root; each node has two rows: cost/rows/width (estimated before running) and actual time/rows (measured while running). {{Seq Scan}} reads the whole table sequentially, {{Index Scan}} seeks through the index and then fetches rows from the heap, {{Index Only Scan}} reads only the index. The line {{Rows Removed by Filter: X}} is the number of rows **read and then thrown away** ⇒ a huge X means "we read almost the whole table to return a few tens of thousands of rows".

### Quick understanding
EXPLAIN is like the **Google Maps route** the DB plans before driving: which road it will take (index or full table scan) and how long it expects to take. {{EXPLAIN ANALYZE}} is **actually driving** and recording the real trip, so you can compare "20 minutes expected" with "2 hours actual". A Seq Scan is like reading a whole book from page 1 to find one sentence; an Index Scan is like checking the table of contents and then flipping to each page; an Index Only Scan is when the answer **sits right in the table of contents**, so you never flip the book at all. Reading the whole book is not always bad: if you need half the pages, reading straight through is faster than flipping back and forth.

### Terms
- **Plan node**: one processing step in the plan (scan, join, sort…); child nodes run first and push rows up to the parent.
- **Cost**: the planner's relative unit of estimated work, not milliseconds.
- **Heap**: the area in PostgreSQL that stores the table's real row data, kept separate from indexes.
- **Selectivity**: the fraction of rows that satisfy a condition; the smaller it is, the more an index helps.
- **Buffers shared hit / read**: the number of 8 KB pages found in shared buffers / fetched from the operating system (which may serve them from its own page cache or from disk).
- **Visibility map**: a map marking which heap pages have "all rows visible to every transaction", maintained by VACUUM.
- **Heap Fetches**: how many times an Index Only Scan still had to touch the heap to check visibility.
- **random_page_cost**: the planner setting that says how many times more expensive a random read is than a sequential one.

### Step by step when reading a plan
1. **Read the root node (the top line)**: its actual time is the total query time. Why: you immediately know whether the query really is slow.
2. **Find the child node that costs the most** (remember to multiply by {{loops}}). Why: optimizing anything else is wasted effort.
3. **Compare estimated rows with actual rows**: a difference of 10x or more means the statistics are wrong ⇒ the planner picked the wrong strategy. Why it matters: every planner decision is based on this estimate.
4. **Look at Rows Removed by Filter and Buffers**: they tell you how much was read for nothing and how much real I/O happened.
5. **Propose a fix and measure again** under the same conditions (equally warm or cold cache).

~~~text
Seq Scan   : reads 319,000 pages -> keeps 20,000 rows, discards 19,980,000   (15.2 s)
Index Scan : seeks the index (~4 pages) -> 20,000 jumps into the heap       (~0.2 s if the rows are close together)
Index Only : seeks the index -> reads leaf pages in a row, Heap Fetches: 0  (~0.05 s)
Rows needed ratio:  0.1% -> index wins | 30% -> seq scan usually wins
~~~

### Reading a concrete plan
~~~sql
Seq Scan on orders (cost=0.00..486320.00 rows=19980000 width=64)
                (actual time=0.42..15230.8 rows=20000 loops=1)
  Filter: ((status = 'PAID'::text) AND (created_at >= '2026-01-01'::date))
  Rows Removed by Filter: 19980000
  Buffers: shared hit=121000 read=198000
~~~
| Plan line | Meaning |
|---|---|
| {{cost=0.00..486320 rows=19980000}} | estimated cost and **estimated row count** |
| {{actual time=.. rows=20000 loops=1}} | real time (ms) and **real row count** |
| {{loops=1}} | how many times this node ran; a nested-loop child with a large {{loops}} reports actual {{rows}} as an average per loop ⇒ total = {{rows}} x {{loops}} |
| {{Rows Removed by Filter}} | rows read and then discarded – only shown on nodes that have a Filter (Seq Scan / Index Scan / Bitmap Heap Scan) |
| {{Buffers: shared hit / read}} | read from RAM / read from disk – the real I/O meter |

In the example above the planner **estimated about 20 million rows returned but only 20,000 actually came back** ⇒ the real selectivity is only ~0.1% ⇒ an index on the right column has a reason to exist. But the final verdict still has to come from {{actual time}} and {{Buffers}} before and after, not from the node's name.

### How Index Scan and Index Only Scan differ
- **Index Scan**: seek in the B-tree by the condition, then for every matching row read a record from the **heap** (random I/O) ⇒ good when returning few rows from a wide table.
- **Index Only Scan**: every column the query needs is already inside the index (via {{INCLUDE}} or the right column order) ⇒ the heap is skipped. But PostgreSQL still has to check that the row is "visible" to the current snapshot, using the **visibility map**: any heap page modified since the last VACUUM (and therefore not marked all-visible) must be read ⇒ the {{Heap Fetches}} counter is greater than 0, and then index-only is only "half index-only". A write-heavy table needs autovacuum running often enough for Index Only Scan to pay off.
- Cost: for random reads PostgreSQL treats one as about 4x a sequential read ({{random_page_cost}} defaults to 4) ⇒ a seek plus random reads can be more expensive than one continuous scan.

### When Seq Scan is the right choice
1. The query needs most of the table's rows (planner estimates more than a few percent of the total): reading continuously is cheaper than hunting randomly.
2. The table is small (a few MB): the overhead of managing an index is not worth it.
3. The index does not cover the needed columns ⇒ the heap is touched anyway, and sometimes a seq scan is faster.
4. {{Buffers}} shows most pages are {{hit}} (already in RAM) ⇒ a seq scan costs only CPU, no disk.

### How to verify
- Compare the **root node** (total time) and {{Buffers}} before and after adding an index; never optimize by gut feeling.
- A gigantic {{Rows Removed by Filter}} ⇒ consider putting the filter column into the index or using a covering index so rows are eliminated inside the index.
- A child node with large {{loops}} ⇒ the inner side of a nested loop is missing an index.

### Common mistakes
1. **EXPLAIN ANALYZE on a write statement in production**. Symptom: {{EXPLAIN ANALYZE}} on an {{UPDATE}}/{{DELETE}} really **executes it** ⇒ data is actually modified. How to avoid: always wrap it in {{BEGIN}} then {{ROLLBACK}}.
2. **Measuring on staging and concluding for production**. Symptom: the staging plan differs from production (statistics, data distribution), the index "works well" on staging but production stays slow. How to avoid: always measure on real data or a copy of similar size; use {{auto_explain}} to capture real plans.
3. **Adding an index because you hate Seq Scan**. Symptom: seeing the words {{Seq Scan}} is not a bug; adding an index only because "I don't like seq scans" needlessly slows writes, and the planner may still choose the seq scan. How to avoid: check selectivity and real time first.
4. **Stale statistics**. Symptom: estimated rows are off by hundreds of times after a big import. How to avoid: run {{ANALYZE orders}} after loading bulk data, and check autovacuum/autoanalyze.

### 1-minute verbal answer
"EXPLAIN gives me the planner's plan tree, while EXPLAIN ANALYZE BUFFERS actually runs the query and records real time, real row counts and pages read. I read the root node to get total time, find the most expensive child multiplied by loops, then compare estimated rows with actual rows. In this plan the Seq Scan read twenty million rows to keep twenty thousand, Rows Removed by Filter is huge, so selectivity is only about 0.1 percent, which means an index on the filter column makes sense. A Seq Scan is still correct when you need most of the table, when the table is small, or when the data is already in RAM, because reading sequentially is several times cheaper than random reads. Index Scan seeks the index then goes into the heap for the row; Index Only Scan gets every column from the index and only touches the heap when the visibility map has not confirmed the page. I always measure before and after on real data."

> Senior tip: my plan-reading rule: look at the root node first (total time), find the most expensive child, then compare estimated rows with actual rows. The words "Seq Scan" are not the bug; the real bug is "Rows Removed by Filter: 19980000" plus 15 seconds when the application only needs 20,000 rows.`,
    follow: [
      'Why can Index Only Scan still read the heap ({{Heap Fetches}} > 0)?',
      'When would you decide **not** to add an index even though the plan shows {{Seq Scan}}?'
    ]
  },
  'sql-016': {
    q: 'Two systems export orders into {{staging_order_a}} and {{staging_order_b}} with the same key {{order_id}}. You need to reconcile them and split into exactly 4 groups: matched, only in A, only in B, and present in both but with a **different amount**. How do you write the query, why is {{FULL OUTER JOIN}} more convenient than two anti-joins, and when do you use {{EXCEPT}}?',
    a: `**Summary:** {{FULL OUTER JOIN}} the two tables on the key, {{COALESCE}} the two keys back together (a row missing on one side has a NULL key there) and classify with {{CASE}} – all **4 groups come out in a single pass**. Two anti-joins only give the two "missing" groups; to compare values you would need yet another join.

### Quick understanding
Think of reconciling your own cash book with the bank statement at the end of the month. You put the two sheets side by side and walk down the transaction IDs: present in both with the same amount (matched), only in your book (the bank has not recorded it), only in the statement (you forgot to write it down), present in both but with a different amount (mismatch). {{FULL OUTER JOIN}} is exactly "put the two sheets side by side and keep every row from both sides": whichever side is missing leaves that cell blank (NULL). Looking at the blank cells and comparing amounts is enough to sort each row into exactly one of the 4 groups.

### Terms
- **Reconciliation**: comparing two data sources to find the differences.
- **FULL OUTER JOIN**: a join that keeps every row from both tables and fills NULL on the side that has no match.
- **Anti-join**: getting the rows of one side that have **no** matching row on the other side ({{NOT EXISTS}}).
- **EXCEPT / INTERSECT**: set difference / set intersection of two result sets; they compare whole rows and remove duplicates automatically.
- **IS DISTINCT FROM**: a comparison that treats two NULLs as equal and NULL versus a value as different.
- **COALESCE**: returns the first non-NULL value, used here to take the key from whichever side has data.
- **Hash join**: build a hash table from one table, then probe it with the other.
- **Minor units**: storing money as an integer of the smallest unit (dong, cent) to avoid rounding errors.

### Step by step
1. **Join the two tables on order_id, keeping every row from both sides**. Why FULL: LEFT JOIN loses the "only B" group, RIGHT JOIN loses the "only A" group.
2. **Take the shared key** with {{COALESCE(a.order_id, b.order_id)}}. Why: on a row that exists only in B, {{a.order_id}} is NULL.
3. **Classify with an ordered CASE**: missing A first, missing B second, and only then compare amounts. Why this order: when one side is NULL the amount comparison is meaningless.
4. **Compare amounts with IS DISTINCT FROM**. Why not {{<>}}: {{100 <> NULL}} is UNKNOWN, so a row that differs between "has money" and "no money" would be wrongly sorted into MATCHED.

~~~text
A: 1->100, 2->200, 3->300          B: 2->200, 3->350, 4->400
order | amount_a | amount_b | status
1     | 100      | NULL     | ONLY_A
2     | 200      | 200      | MATCHED
3     | 300      | 350      | MISMATCH
4     | NULL     | 400      | ONLY_B
~~~

### Query
~~~sql
SELECT COALESCE(a.order_id, b.order_id) AS order_id,
       CASE
         WHEN a.order_id IS NULL THEN 'ONLY_B'
         WHEN b.order_id IS NULL THEN 'ONLY_A'
         WHEN a.amount IS DISTINCT FROM b.amount THEN 'MISMATCH'
         ELSE 'MATCHED'
       END AS status,
       a.amount AS amount_a,
       b.amount AS amount_b
FROM staging_order_a a
FULL OUTER JOIN staging_order_b b
  ON b.order_id = a.order_id;
~~~
- {{FULL OUTER JOIN}} = {{LEFT JOIN}} (keep every A row even without a match) **combined with** {{RIGHT JOIN}} (keep every B row).
- {{IS DISTINCT FROM}} compares without caring about NULL: {{NULL}} versus {{NULL}} is **equal**, {{100}} versus {{NULL}} is **different**. MySQL has the equivalent operator {{a <=> b}}; on a DB without it, write the inverse: {{NOT (a = b OR (a IS NULL AND b IS NULL))}}.
- Count the 4 groups with a CTE and {{GROUP BY status}}:
~~~sql
WITH diff AS ( /* the reconciliation query above */ )
SELECT status, COUNT(*) AS orders FROM diff GROUP BY status ORDER BY orders DESC;
~~~

### Compared with anti-joins and EXCEPT
| Approach | What it returns | Limitation |
|---|---|---|
| Two-way {{NOT EXISTS}} | the only-A group, the only-B group | two scans, cannot compare individual column values |
| {{FULL OUTER JOIN}} | all 4 groups, with values from both sides | you must be sure the key is unique on each side |
| {{EXCEPT}} / {{INTERSECT}} | the list of missing keys / the common part | does not carry the other side's columns for comparison |

{{EXCEPT}} is handy when you only need the **list of IDs** (EXCEPT removes duplicates by itself):
~~~sql
SELECT order_id FROM staging_order_a
EXCEPT
SELECT order_id FROM staging_order_b;   -- only in A
~~~
Oracle uses {{MINUS}} (EXCEPT is also available from 21c); MySQL supports {{EXCEPT}}/{{INTERSECT}} from 8.0.31.

**MySQL has no FULL OUTER JOIN**: emulate it with {{LEFT JOIN}} (A with B) {{UNION ALL}} the "only B" part obtained by {{RIGHT JOIN … WHERE a.order_id IS NULL}} (or a NOT EXISTS anti-join). Use UNION ALL plus the condition that drops the common part rather than UNION, because UNION would merge legitimately identical rows and costs an extra sort.

### Performance
- A hash join **needs no index**: PostgreSQL usually picks {{Hash Full Join}} – scan the smaller table to build a hash table in {{work_mem}}, scan the other table to probe it, then emit the unmatched rows from both sides. If the smaller table exceeds {{work_mem}} the hash is split into batches and written to disk temporarily. If both sides already have an index or a sort on {{order_id}}, the planner may choose {{Merge Full Join}}. What you really need is a **unique constraint** on {{order_id}} in each source so rows are not multiplied.
- Staging with millions of rows: count by group first, or compare **daily totals** ({{SUM(amount)}} {{GROUP BY}} day) to spot the drift before reconciling in detail.
- Narrow the date range before joining to reduce the scan; for a read-only pass add {{WHERE}} on both sides.

### Common mistakes
1. **Duplicated keys in staging**. Symptom: {{order_id}} was imported twice into staging ⇒ the join **doubles** rows, reports fake mismatches, and totals are twice the truth. How to avoid: dedupe or create a unique index first; check {{GROUP BY order_id HAVING COUNT(*) > 1}} on each source.
2. **Mismatched data types on the two sides** ({{BIGINT}} versus {{VARCHAR}}). Symptom: no row matches, or '00123' does not match 123. How to avoid: normalize while loading staging; if you must {{CAST}} to the same type, remember the cast can lose the other side's index.
3. **Comparing money with floating point**. Symptom: thousands of MISMATCH rows off by 0.0000001. How to avoid: use {{NUMERIC}} or integer minor units, never {{double}} – floating-point arithmetic creates fake differences.
4. **Comparing strings while ignoring collation and trailing spaces**. Symptom: the code "ABC " does not match "ABC". How to avoid: {{TRIM}} when the source is a legacy system, and agree on collation and upper/lower case.

### 1-minute verbal answer
"For a reconciliation I always split into 4 groups: matched, only in A, only in B, and in both but with a different amount. I use FULL OUTER JOIN on order_id to keep every row from both sides, take the key with COALESCE, then a CASE: A is NULL means only B, B is NULL means only A, otherwise compare amounts with IS DISTINCT FROM so NULL cannot break the comparison. That gives all 4 groups with both amounts in a single pass, usually one hash join, while two anti-joins only give the two missing groups. EXCEPT is right when I only need the list of IDs. On MySQL, which has no FULL JOIN, I combine a LEFT JOIN with the only-B part. The first thing I check is always whether the key is unique, because a repeated import fills the report with fake mismatches."

> Senior tip: when asked "how do you reconcile two sources", I say right away "I split into 4 groups: matched, missing left, missing right, value mismatch" and only then write SQL – the interviewer sees you think in **business results** first and syntax second. I also ask back: "is the key unique, does the source import duplicates?" – that is the question that decides whether the reconciliation report is correct.`,
    follow: [
      'How is {{FULL OUTER JOIN}} executed (hash join) on large data?',
      'If staging has hundreds of millions of rows, how do you reconcile in batches?'
    ]
  }
});