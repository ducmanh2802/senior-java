/*
 * English translation of js/data/q-sql.js — task T182, retranslated for T551. Format: js/core/i18n.js (content overlay).
 * ids: sql-001 sql-002 sql-003 sql-004 sql-005 sql-006 sql-007 sql-008
 */
App.i18n.content({
  'sql-001': {
    q: 'Table employee(id, full_name, dept_id, salary): find the person with the second-highest salary in each department (if several people share that salary, return all of them). How would you write the SQL? How do DENSE_RANK, RANK and ROW_NUMBER differ?',
    a: `**Summary:** Use the window function {{DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC)}} and filter {{rank = 2}} in the **outer query**. {{DENSE_RANK}} ranks **by value**, so two people on the same salary keep the same rank — exactly what "second-highest salary" means. {{RANK}} skips numbers (1, 1, 3), so if two people tie for the top salary, **rank 2 does not exist**. {{ROW_NUMBER}} always gives 1, 2, 3… with no ties, so it returns exactly one person per department.

### Quick intuition
Think of each department as a classroom and the teacher ranking students by score, highest first. A window function is like the teacher **adding a "rank" column to the grade book** without **merging** the students into one row (unlike GROUP BY, which collapses the whole class into a single row). {{PARTITION BY dept_id}} means "rank each class separately", {{ORDER BY salary DESC}} means "highest score first". When two students both score 9, "tied first, and the 8-point student is second" is DENSE_RANK; "tied first, and the 8-point student is third" is RANK; "everyone must get a different number" is ROW_NUMBER.

### Glossary
- **Window function**: a function computed over a "window" of related rows while still keeping every row in the result.
- **PARTITION BY**: splits the data into independent groups; ranking restarts at 1 in each group.
- **CTE (WITH … AS)**: a "named temporary table" that lives only inside one query, letting you split a query into readable steps.
- **Tie-break**: an extra column in ORDER BY that decides the order when the main value is equal.
- **NULLS LAST**: an instruction to place NULL rows at the end when sorting.
- **Index-only scan**: the database answers the query by reading only the index, without touching the table.

### Why the filter must be in the outer query
Window functions are **not** allowed inside {{WHERE}} (PostgreSQL reports "window functions are not allowed in WHERE", MySQL reports "Invalid use of window function"). The logical processing order of a SELECT is: FROM → WHERE → GROUP BY → HAVING → **window functions** → SELECT → DISTINCT → ORDER BY → LIMIT. Because window functions run *after* WHERE, filtering on their result requires wrapping them in a subquery/CTE and filtering outside.

Step by step when the database runs the sample query below:
1. **Read and filter rows (FROM + WHERE)**: keep employees whose salary is not NULL. Why first: fewer rows to sort in the next step.
2. **Split into departments (PARTITION BY)**: the DB sorts (or reads an index) by {{dept_id, salary DESC}} so rows of the same department sit next to each other. Why: rank only makes sense inside a department.
3. **Assign ranks (DENSE_RANK)**: walk each group; every time a **new salary value** appears the rank increases by 1, an equal salary keeps the same rank. Why DENSE_RANK: the rank counts **values**, not people.
4. **Filter rank 2 in the outer query**: by now {{salary_rank}} is an ordinary column of the CTE, so the outer WHERE can use it.

~~~text
Accounting dept (after sorting salary DESC)
salary : 50   50   40   40   30
DENSE  :  1    1    2    2    3   <- filter = 2 gives the two 40-salary people
RANK   :  1    1    3    3    5   <- no rank 2 at all!
ROW_NUM:  1    2    3    4    5
~~~

### Comparing the three ranking functions
Example data for the Accounting (KT) department:
| id | salary | DENSE_RANK | RANK | ROW_NUMBER |
|---|---|---|---|---|
| 1 | 50 | 1 | 1 | 1 |
| 2 | 50 | 1 | 1 | 2 |
| 3 | 40 | 2 | 3 | 3 |
| 4 | 40 | 2 | 3 | 4 |
| 5 | 30 | 3 | 5 | 5 |

- {{DENSE_RANK = 2}} → ids 3, 4: the correct "second-highest salary", two people share the rank.
- {{RANK = 2}} → **nobody**: rank 2 is skipped, the classic trap.
- {{ROW_NUMBER <= 2}} → ids 1, 2: the two top earners, **not** the "second-highest salary".

Selection rule: the business says "**salary level**" (ties allowed, no skipped numbers) → DENSE_RANK; you need exactly N **people** → ROW_NUMBER; you need tournament-style ranking (tied then **skipped**: 1, 1, 3) → RANK.

### Sample SQL
~~~sql
WITH ranked AS (
    SELECT e.id,
           e.full_name,
           e.dept_id,
           e.salary,
           DENSE_RANK() OVER (
               PARTITION BY e.dept_id
               ORDER BY e.salary DESC NULLS LAST
           ) AS salary_rank
    FROM employee e
    WHERE e.salary IS NOT NULL      -- drop people without a salary
)
SELECT r.* FROM ranked r WHERE r.salary_rank = 2;
~~~

### NULL and money
- PostgreSQL treats NULL as **greater than any other value**, so {{ORDER BY salary DESC}} pushes NULL-salary rows to the **top** ⇒ rank 1 is a person with no salary. Always write {{NULLS LAST}} explicitly (MySQL puts NULL last for DESC by default, but MySQL **does not support** the {{NULLS LAST}} syntax; there use {{ORDER BY salary IS NULL, salary DESC}} or filter {{salary IS NOT NULL}} as in the sample).
- Salary must be {{DECIMAL}}/{{NUMERIC}}, never {{FLOAT}} — comparing {{0.1 + 0.2}} with {{0.3}} gives a wrong answer.

### Performance
Window functions force the DB to **sort by (dept_id, salary)**. Create an index {{(dept_id, salary DESC)}} so the sort does not cost extra I/O; if the query needs only a few columns, an index-only scan may be possible. For data consumed from Java, use a native query with a projection interface to avoid manual mapping.

### Common mistakes
1. **Choosing RANK when the business means "second salary"**. Symptom: the report is **empty** exactly for departments with two top earners, with no error at all, so it is very easy to miss. Fix: read the business rule carefully ("level" vs "person") and always test with duplicate salaries.
2. **Writing DENSE_RANK() in WHERE**. Symptom: "window functions are not allowed in WHERE". Fix: wrap it in a CTE/subquery and filter in the outer query.
3. **Forgetting NULL**. Symptom: on PostgreSQL a person without a salary becomes "rank 1", so "rank 2" is actually the top earner. Fix: {{WHERE salary IS NOT NULL}} or {{NULLS LAST}}.
4. **No tie-break with ROW_NUMBER**. Symptom: ROW_NUMBER results change between two runs on the same data. Fix: always add an increasing key column, {{ORDER BY salary DESC, id}}.

In addition, this query scans the whole employee table every time the report is opened: cache it per day or precompute it into a summary table.

### One-minute spoken answer
"To get the second-highest salary per department I use the window function DENSE_RANK, partitioned by dept_id and ordered by salary descending. Because window functions are computed after WHERE, I wrap it in a CTE and filter rank = 2 in the outer query. I pick DENSE_RANK because it ranks by value: two people on the top salary both get rank 1 and the next person gets rank 2. RANK would jump from 1 to 3 and could produce an empty report, while ROW_NUMBER only fits when you need exactly N people and must have a tie-break. I also exclude NULL salaries and add an index on (dept_id, salary) to avoid a big sort. In practice I have seen a report silently come back empty because someone used RANK, so now I always test with duplicate values."

> Senior tip: in an interview, answer in this order: "I use a window function, filter in the outer query because WHERE cannot see window function results; DENSE_RANK because the business asks by **salary level**, not by **person order**". Being able to distinguish DENSE_RANK from RANK shows you really understand window functions, not just the syntax. In a real project, prefer the simpler solution: if the employee table only has a few thousand rows, a correlated subquery is enough and easier for colleagues who are not SQL experts to read.`,
    follow: [
      'Why does {{RANK}} never return rank 2 when two people share the highest salary?',
      'How do you get the "second-highest salary" while keeping exactly one person per department?'
    ],
  },
  'sql-002': {
    q: 'Table transaction_import has duplicates from repeated imports (same external_id). You need to find and delete the duplicate records, keeping only one (the one with the smallest id). How do you do this safely on PostgreSQL and Oracle?',
    a: `**Summary:** Use {{ROW_NUMBER() OVER (PARTITION BY external_id ORDER BY id)}} to mark the record to "keep" (rn = 1), then delete the records with {{rn > 1}}. PostgreSQL uses {{DELETE FROM t USING (...)}}; Oracle and MySQL 8 use {{DELETE FROM t WHERE id IN (SELECT id FROM (…ROW_NUMBER…))}} — MySQL requires an extra derived-table layer, otherwise it throws error **1093** ("You can't specify target table for update in FROM clause").

### Quick intuition
Like a phone contact list that was synced twice, so one person now appears three times. You do not delete randomly: you **line up the duplicate copies of each person**, number them 1, 2, 3 in creation order (smallest id first), keep number 1 and delete 2 and 3. {{ROW_NUMBER}} is that numbering machine, and {{PARTITION BY external_id}} means "one queue per person". After cleaning, you lock the contact list with the rule "one entry per phone number" — that is a unique constraint.

### Glossary
- **external_id / business key**: an identifier assigned by the source system (a bank transaction code), different from the table's auto-increment {{id}}.
- **Derived table**: a subquery placed in FROM that the database treats like a temporary table.
- **Dead tuple**: the old version of a row that PostgreSQL keeps after DELETE/UPDATE until VACUUM cleans it.
- **VACUUM**: the PostgreSQL process that reclaims space taken by dead tuples.
- **Undo log / binlog**: MySQL logs used for rollback and for replicas to copy changes; deleting more rows makes them grow.
- **ctid / ROWID**: the physical address of a row (page + position) in PostgreSQL / Oracle.
- **Upsert**: one statement meaning "insert if absent, update or skip if present".
- **Idempotent**: running an operation once or ten times produces the same result.

### Step-by-step mechanism
1. **Measure first**: count the rows that will be deleted (the first SELECT below). Why: compare against what the business expects; if the number is far off, stop before losing data.
2. **Number the rows inside each duplicate group**: {{ROW_NUMBER() OVER (PARTITION BY external_id ORDER BY id)}}. Why ORDER BY id: the convention "keep the oldest copy" must be deterministic so reruns give the same result.
3. **Select rows with rn > 1 and delete by id**: the DB joins the numbering result back to the table on {{id}} (primary key, indexed), so finding the rows to delete is fast.
4. **Delete in batches and commit each batch**: why: short transactions mean short locks, small logs, and replicas that do not fall behind.
5. **Add a unique constraint**: why: only a database constraint can stop duplicates created by two imports running in parallel.

~~~text
external_id | id  | rn  | action
EXT-1       | 10  | 1   | keep
EXT-1       | 57  | 2   | delete
EXT-1       | 91  | 3   | delete
EXT-2       | 11  | 1   | keep   (no duplicate, untouched)
~~~

### Why not DISTINCT or GROUP BY
- {{SELECT DISTINCT *}} does not solve it: two *logically* duplicate rows often differ in a timestamp column or an auto-generated sequence ⇒ DISTINCT keeps both.
- {{GROUP BY external_id HAVING COUNT(*) > 1}} only **detects** duplicate groups; it does not tell you **which rows** to delete ⇒ you still need a window function.
- Choose {{ROW_NUMBER}} (not RANK/DENSE_RANK) because you need a strict 1, 2, 3… sequence with no gaps ⇒ deleting {{rn > 1}} always leaves exactly one record per key.

### Sample SQL (PostgreSQL)
~~~sql
-- Step 1: preview how many rows will be deleted (run on staging first)
SELECT count(*) AS rows_to_delete FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY external_id ORDER BY id) AS rn
    FROM transaction_import
) t WHERE t.rn > 1;

-- Step 2: delete, keeping the record with the smallest id
WITH dup AS (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY external_id ORDER BY id) AS rn
        FROM transaction_import
    ) t WHERE t.rn > 1
)
DELETE FROM transaction_import ti
USING dup d
WHERE ti.id = d.id;
~~~

### Oracle and MySQL 8
~~~sql
-- Oracle: wrap in an inline view
DELETE FROM transaction_import ti
WHERE ti.id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY external_id ORDER BY id) AS rn
        FROM transaction_import
    ) t WHERE t.rn > 1   -- MySQL requires an alias for the derived table; Oracle accepts it
);
~~~

### Delete in batches, not all at once
Deleting millions of rows in **one** transaction holds locks for a long time, creates a lot of dead tuples in PostgreSQL (the table bloats, vacuum becomes heavy, queries get slower over time), and makes the undo log and binlog grow in MySQL. Delete in batches of 1,000–10,000 rows, each batch in its own transaction, split by {{id}} range ⇒ several jobs can run in parallel without colliding.

On PostgreSQL you can delete by {{ctid}} (physical address) so no index is needed, but {{ctid}} **changes after every UPDATE or VACUUM FULL** ⇒ do not use it as a long-term identifier. Oracle has a similar {{ROWID}} (it also changes when a row moves).

### Preventing recurrence (more important than cleaning up)
- Add a **unique constraint** on the business key — the only way to guarantee no duplicates: {{ALTER TABLE transaction_import ADD CONSTRAINT uk_ext_id UNIQUE (external_id);}}
- If you use soft delete (a {{deleted_at}} column), the unique index must be **partial**: {{CREATE UNIQUE INDEX uk_ext_active ON transaction_import (external_id) WHERE deleted_at IS NULL;}} (PostgreSQL) — otherwise the next import still violates it. MySQL has no partial index; the alternative is a unique index on a generated column (for example, a column equal to {{external_id}} while not deleted and NULL once deleted, since a unique index allows many NULLs).
- Make imports **idempotent** with an upsert ({{INSERT … ON CONFLICT}}) instead of deleting and inserting again.
- If the duplicate rows are referenced by other tables (FK), soft-delete or delete the child rows first, or migrate the FK to the record you keep.

### Common mistakes
1. **DELETE when the key column has no index**. Symptom: full scan, row locks held on many rows for a long time (MySQL InnoDB also locks every row it scans — effectively a table lock), API timeouts at peak traffic. Fix: check the plan with EXPLAIN, delete by {{id}} (primary key), and split into batches.
2. **Forgetting the scope condition** (for example, only delete rows created by today's import batch). Symptom: valid data gets deleted by mistake. Fix: count first, try it on a **staging copy** with production-like data, compare the deleted row count before committing, and back up the doomed rows into a backup table.
3. **One huge DELETE on Oracle**. Symptom: {{DELETE}} writes both redo and undo, the undo tablespace runs out and other queries hit {{ORA-01555}} ("snapshot too old"). Fix: batch and monitor {{UNDO}}.
4. **Only cleaning, never blocking the cause**. Symptom: duplicates are back next week. Fix: unique constraint plus upsert.

### One-minute spoken answer
"I handle duplicates in two parts: clean the current data and stop it from coming back. For the cleanup I use ROW_NUMBER partitioned by external_id and ordered by id, so in each duplicate group the row with rn = 1 is the oldest; I delete rows with rn greater than 1. On PostgreSQL I use DELETE USING; on MySQL I have to wrap it in one more derived table to avoid error 1093. I always count first, run on staging, then delete in batches of a few thousand rows per transaction so locks are short and dead tuples or undo do not explode. Most importantly, I add a unique constraint on external_id and switch the import flow to an upsert, because otherwise the next import will duplicate again."

> Senior tip: the question "how would you delete duplicates?" is usually a trap — the interviewer wants to hear you talk about **unique constraints + idempotent upsert**, not DELETE syntax. A strong answer is: "I will delete with ROW_NUMBER to clean the current data, but the real fix is to add a unique constraint on external_id and change the import flow to an upsert, because if we only delete, the next import will duplicate again." That is the mindset of a 4–8 year engineer: fix the cause, not just the symptom.`,
    follow: [
      'Why does MySQL 8 throw error 1093 when you delete from the same table that a subquery is reading?',
      'When should you soft-delete instead of hard-delete, and what are the risks?'
    ],
  },
  'sql-003': {
    q: 'Find customers who have never had a transaction. Would you use NOT EXISTS, NOT IN, or LEFT JOIN ... IS NULL? When is each one correct, and what is the NULL trap?',
    a: `**Summary:** Use {{NOT EXISTS}} for the anti-join: safe with NULL, clear intent, and the optimizer usually turns it into an indexed anti-join. {{NOT IN}} is the trap: if the subquery result contains **even one** NULL value, **no rows at all** are returned. {{LEFT JOIN … IS NULL}} gives an equivalent result but easily causes "row explosion" when joining several child tables, and is harder to read.

### Quick intuition
You manage a coffee shop, hold the member list and want to know who has **never bought anything**. NOT EXISTS means: for each member, flip through the sales book asking "is there any receipt with this person's name?" — one receipt and you stop, move to the next person. NOT IN means you copy out a list of "names on every receipt" and compare; but if one receipt has a **smudged name** (NULL), you can no longer say for sure that someone is "definitely not on the list", so SQL returns nobody at all. LEFT JOIN is like pinning every receipt onto a member card and keeping the cards with no receipt attached.

### Glossary
- **Anti-join**: a join that keeps rows from the left side that have **no** matching row on the right.
- **Semi-join**: a join that keeps left rows with **at least one** match, each left row appearing once ({{EXISTS}}).
- **Three-valued logic**: SQL's TRUE / FALSE / UNKNOWN logic, produced when comparing with NULL.
- **Row explosion**: a one-to-many join that repeats one parent row many times.
- **Hashed SubPlan**: a PostgreSQL plan that loads the subquery result into an in-memory hash table for lookups.
- **work_mem**: the RAM PostgreSQL allows one sort/hash operation before spilling to disk.
- **Nested Loop / Hash Anti Join**: two join algorithms; nested loop looks up the index per row, hash builds a hash table once.

### How NOT EXISTS works, step by step
1. The DB reads each customer in {{customers}} in turn. Why: this is the set we want to filter.
2. For each customer it looks up the index {{orders(customer_id, created_at)}} for **one** matching order. Why only one: EXISTS only needs yes/no, so it stops at the first row.
3. If nothing is found, NOT EXISTS is TRUE and the customer is kept. EXISTS returns only TRUE/FALSE, **never UNKNOWN**, so NULL cannot break the result.
4. On large tables the optimizer may switch to a Hash Anti Join: hash all of {{orders.customer_id}} once, then probe. Why: cheaper when most customers must be checked.

~~~text
customers        orders.customer_id = {1, 2, NULL}
id=1  -> NOT EXISTS? has orders       -> discard
id=3  -> NOT EXISTS? no orders        -> KEEP
NOT IN for id=3: 3<>1 TRUE, 3<>2 TRUE, 3<>NULL UNKNOWN
               -> TRUE AND TRUE AND UNKNOWN = UNKNOWN -> discard (wrong!)
~~~

### The three approaches
| Approach | Subquery contains NULL | Note |
|---|---|---|
| {{NOT EXISTS}} | Not affected | Default choice for an anti-join |
| {{NOT IN}} | Returns **0 rows** | Only safe when the value set is guaranteed non-NULL |
| {{LEFT JOIN … IS NULL}} | Not affected | Same result, but prone to row multiplication |

### The NULL trap of NOT IN — three-valued logic explained
SQL uses **three logical values**: TRUE, FALSE and **UNKNOWN**. NULL means "not known", so every comparison with NULL yields UNKNOWN:
- {{c.id = NULL}} → UNKNOWN (never TRUE) ⇒ no row matches.
- {{c.id <> NULL}} → UNKNOWN ⇒ all rows are lost.
- {{c.id NOT IN (1, NULL)}}: for a row with id = 5, SQL checks 5 = 1 (FALSE) then 5 = NULL (UNKNOWN) ⇒ the result is UNKNOWN ⇒ **no row is returned**.
- Just **one** NULL in the result set is enough to make the whole query empty.
- WHERE keeps only rows whose result is TRUE ⇒ UNKNOWN is silently discarded.

~~~sql
-- Trap: if orders has one row with customer_id NULL, this query returns 0 rows
SELECT c.id, c.full_name
FROM customers c
WHERE c.id NOT IN (SELECT o.customer_id FROM orders o);
~~~

### The correct way
~~~sql
-- Customers with no transaction since 2026-01-01 (Vietnam time)
SELECT c.id, c.full_name
FROM customers c
WHERE NOT EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.id
      AND o.created_at >= TIMESTAMPTZ '2026-01-01 00:00:00+07'
);
~~~
{{NOT EXISTS}} is an **anti-join** ({{EXISTS}} is the semi-join): the subquery only has to answer yes/no and stops at the first match ⇒ an index on {{(customer_id, created_at)}} is enough, no DISTINCT, no NULL comparisons.

### LEFT JOIN … IS NULL
~~~sql
SELECT c.id, c.full_name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.customer_id IS NULL;
~~~
- Gives the **same result** as NOT EXISTS when joining a single child table and the join key is not NULL.
- But when joining **two** child tables at once (orders and cards), a customer with 3 orders and 2 cards produces **6 rows**; {{COUNT(*)}} returns 6 instead of 3. With NOT EXISTS each condition is an independent subquery, so rows are not multiplied.
- You must pick the right column to check for NULL; if that column is nullable in the right-hand table, the condition is wrong.
- Any extra filter that is **not** a join condition must go in {{ON}}, not {{WHERE}} — putting it in WHERE turns the LEFT JOIN into an INNER JOIN.

### Performance
- NOT EXISTS with an index on the join column ⇒ the plan shows "Anti Join" (Nested Loop Anti Join or Hash Anti Join).
- Without an index, the subquery may run again for every outer row ⇒ expensive. Check with {{EXPLAIN (ANALYZE)}}.
- PostgreSQL does **not** convert {{NOT IN (subquery)}} into an anti-join (NULL semantics differ) ⇒ the plan is a "hashed SubPlan"; if that sub-plan does not fit in {{work_mem}} it becomes a sub-plan re-run for every row ⇒ extremely slow. One more reason to prefer NOT EXISTS.

### Common mistakes
1. **Putting the time condition in the wrong place**. Symptom: with LEFT JOIN, writing {{WHERE o.created_at >= ...}} outside loses exactly the customers we are looking for (the NULL rows are filtered out). Fix: the time condition must be **inside** the NOT EXISTS subquery, or in the {{ON}} clause of the LEFT JOIN.
2. **NOT IN against a nullable column**. Symptom: {{NOT IN}} with an id list taken from another table that has a nullable column (for example a blacklist) ⇒ silently loses all results with **no error**, very hard to notice. Fix: use NOT EXISTS; when a query returns 0 rows unexpectedly, check for NULL first.
3. **NOT IN with a very large list**. Symptom: a blocklist of thousands of ids passed from Java makes a huge SQL string and a slow plan. Fix: load them into a temporary table and anti-join (NOT EXISTS) instead of using {{NOT IN}}.
4. **Assuming JPA generates good SQL**. Symptom: a slow query even though you wrote EXISTS in JPQL. Fix: enable SQL logging and check the SQL actually generated for the {{@Query}} to confirm {{EXISTS}} is used; for complex anti-join logic a native query is easier to control.

### One-minute spoken answer
"To find customers without transactions I default to NOT EXISTS. It is an anti-join: for each customer the DB only needs to know whether one matching order exists, so it stops at the first row and can use the index on customer_id. NOT IN is dangerous because of three-valued logic: as soon as the subquery returns one NULL, the comparison with NULL becomes UNKNOWN and the whole query returns nothing, with no error at all. On PostgreSQL NOT IN is not even converted into an anti-join, so it tends to be slow. LEFT JOIN IS NULL gives the same result but can multiply rows when joining several child tables, and a misplaced filter turns it into an inner join. I once saw an empty report because of NOT IN against a blacklist table that contained NULL, and since then I review every NOT IN with a subquery."

> Senior tip: "NOT IN or NOT EXISTS" is a classic knock-out question. The strong answer is: "I use NOT EXISTS because NOT IN is not safe with NULL — one NULL in the result set makes the entire query return nothing; on top of that, the optimizer turns NOT EXISTS into an anti-join, so it stops early and uses the index better." If the interviewer follows up with "what about LEFT JOIN IS NULL?", continue with the row-multiplication risk when joining several child tables — that is exactly where average candidates answer incorrectly.`,
    follow: [
      'Explain three-valued logic in detail and why a NULL in NOT IN makes the whole query return nothing.',
      'For an anti-join query, how do you know whether the optimizer chose Nested Loop Anti Join or Hash Anti Join?'
    ],
  },
  'sql-004': {
    q: 'How do WHERE and HAVING differ, and what is the logical execution order of a SELECT statement? Which GROUP BY mistakes have you had to fix for your team?',
    a: `**Summary:** {{WHERE}} filters **rows** before grouping; {{HAVING}} filters **groups** after the aggregates are computed. Logical order: FROM → WHERE → GROUP BY → HAVING → window functions → SELECT → DISTINCT → ORDER BY → LIMIT. Rule to remember: **any condition on a column of a source table belongs in WHERE** — putting it in HAVING is both logically wrong and makes the DB aggregate everything before discarding rows.

### Quick intuition
Imagine taking stock of a whole year of invoices. **WHERE** is dropping the invoices that are not from March into the bin **before** sorting them into baskets per customer. **GROUP BY** is sorting the invoices into baskets, one per customer, and summing each basket. **HAVING** is looking at the **total written on each basket** and discarding baskets under 1 million. You cannot ask "what is the total of this basket" while still sorting individual invoices (that is why an aggregate cannot live in WHERE), and it is also a waste to sort the whole year into baskets before throwing away the non-March invoices.

### Glossary
- **Aggregate function**: a function that folds many rows into one value ({{SUM}}, {{COUNT}}, {{AVG}}, {{MIN}}, {{MAX}}).
- **Logical order**: the order the SQL standard defines for understanding a statement, which differs from the order the DB actually executes.
- **ONLY_FULL_GROUP_BY**: a MySQL mode requiring every SELECT column to be in GROUP BY or aggregated.
- **HashAggregate**: a grouping algorithm using an in-memory hash table (PostgreSQL).
- **Semi-join**: a join that only checks "a matching row exists" ({{EXISTS}}).
- **Predicate pushdown**: the optimizer moving a filter as close to the data source as possible.

### Step by step (logical order)
1. **FROM / JOIN**: build the source row set. Why first: every later step works on this set.
2. **WHERE**: filter individual rows; there are no groups yet, so aggregates are not available.
3. **GROUP BY**: split rows into groups; from here on each group is one representative row.
4. **HAVING**: filter groups using aggregates. Why after GROUP BY: a total only exists once the group is complete.
5. **Window functions**, then **SELECT** (compute expressions, assign aliases). Why an alias cannot be used in WHERE: aliases are created in this step, after WHERE.
6. **DISTINCT → ORDER BY → LIMIT**: shape the final result; ORDER BY runs after SELECT so it can use aliases.

~~~text
1,000,000 orders for the whole year
   | WHERE month = March      -> 85,000 rows left
   v
GROUP BY customer_id     -> 12,000 groups (SUM per group)
   | HAVING SUM > 1 million  -> 900 groups left
   v
SELECT / ORDER BY        -> 900 result rows
(if the month filter were in HAVING: all 1,000,000 rows pass through grouping)
~~~

### Classic example: March revenue
~~~sql
-- WRONG: sums the whole year, then filters
SELECT customer_id, SUM(amount) AS total
FROM orders
GROUP BY customer_id
HAVING EXTRACT(MONTH FROM created_at) = 3;

-- CORRECT: filter rows before grouping
SELECT customer_id, SUM(amount) AS total
FROM orders
WHERE created_at >= DATE '2026-03-01'
  AND created_at <  DATE '2026-04-01'
GROUP BY customer_id
HAVING SUM(amount) > 1000000;
~~~
The WRONG query also triggers "column must appear in the GROUP BY clause" (PostgreSQL) or the **ONLY_FULL_GROUP_BY** error (MySQL enables it by default since 5.7). If you "fix" it by adding {{created_at}} to GROUP BY, every transaction becomes its own group ⇒ HAVING then returns every single order above 1 million instead of the total per customer.

### Common mistakes
Mistakes I have had to fix for my team; each one comes with a symptom (an error message or a wrong number) and a fix:
1. Aggregate in WHERE: {{WHERE SUM(amount) > 100}} ⇒ the error "aggregate functions are not allowed in WHERE". To filter on a total you must use HAVING.
2. Non-aggregated column in SELECT: PostgreSQL errors immediately. Fix: add the column to GROUP BY, fold it with {{MAX()/MIN()}}, or use a window function instead of GROUP BY.
3. Wrong count with LEFT JOIN: {{COUNT(*)}} counts **including** the NULL rows created by the join, while {{COUNT(o.id)}} counts only real orders — the same query, two different numbers. This is the classic "statistics are all zero" bug in summary reports.
4. Using a SELECT alias in WHERE: no DB allows it (WHERE runs before SELECT). In HAVING: MySQL allows it (its own extension), PostgreSQL reports "column does not exist" ⇒ rewrite the expression or wrap it in a subquery/CTE. (Aliases are allowed in ORDER BY.)
5. {{HAVING status = 'X'}} when status is not in GROUP BY ⇒ error; this condition belongs in WHERE.
6. Confusing {{HAVING COUNT(*) > 0}} with {{WHERE EXISTS}}: both return the same rows but with different plans (semi-join vs group + filter).

### Why filtering in WHERE is faster
WHERE reduces the number of rows entering the grouping step (hash aggregate / sort) ⇒ less I/O and less memory. HAVING filters **after** grouping, so it burns more CPU. If {{EXPLAIN (ANALYZE)}} shows HashAggregate processing millions of rows, ask yourself: should that condition be in WHERE?

### Aggregates and NULL
- {{COUNT(*)}}, {{COUNT(col)}} and {{COUNT(DISTINCT col)}} are clearly different.
- {{SUM}} skips NULL and returns NULL (not 0) when every row is NULL ⇒ wrap it as {{COALESCE(SUM(x), 0)}}.
- In HAVING, comparing with NULL yields UNKNOWN ⇒ the row is removed. Do not write {{HAVING SUM(x) = NULL}} to mean "empty".

### Logical order vs physical order
- The list above is the **logical** order you must respect when writing queries. The optimizer is free to reorder (push simple conditions closer to the source, change the join order), so **never** rely on the physical order.
- Easy mistake: {{DISTINCT}} is applied **before** {{ORDER BY}} ⇒ {{SELECT DISTINCT a, b FROM t ORDER BY c}} is an error because c is not in the select list (PostgreSQL reports "for SELECT DISTINCT, ORDER BY expressions must appear in select list"; MySQL 5.7+ also reports error 3065).

### Production pitfalls (reporting and performance)
- GROUP BY on a nullable column: **every** NULL row is grouped into **one** group (GROUP BY treats NULLs as "not distinguishable", even though {{NULL = NULL}} is UNKNOWN) ⇒ use {{COALESCE(col, 'NOT CLASSIFIED')}} to give that group a readable label.
- GROUP BY on a column with **very many values** (for example {{transaction_id}}) is pointless and memory-hungry ⇒ that is when you should use a window function.
- An index on the GROUP BY column lets the DB use an index scan instead of sort + hash ⇒ summary reports grouped by a category column should have one.
- Periodic reports (cron) should write results into a summary table instead of recomputing every time a user opens the page.

### One-minute spoken answer
"WHERE filters individual rows before grouping, while HAVING filters groups after aggregates are computed. The logical order is FROM, WHERE, GROUP BY, HAVING, then window functions, SELECT, DISTINCT, ORDER BY and LIMIT; that is why WHERE cannot use SUM or a SELECT alias. My rule is: any condition on a source column goes in WHERE, because it reduces the rows entering the hash aggregate or sort step, and HAVING is only for conditions on the totals. The mistakes I fix most often for my team are filtering the month in HAVING, counting with COUNT(*) after a LEFT JOIN so customers with no orders still show 1, and SUM returning NULL instead of 0. I always check with EXPLAIN ANALYZE how many rows the aggregate step receives."

> Senior tip: remember the sentence "**WHERE filters rows, HAVING filters groups**" and use it to decide where a condition belongs. In a SQL performance interview the high-scoring answer is: "conditions on source columns always go in WHERE to reduce the rows entering the aggregate step; HAVING is only for conditions that depend on an aggregate result." Pair it with a real example from a system you fixed — that is what turns the answer from "knows the theory" into "has hit it and fixed it".`,
    follow: [
      'Why do {{COUNT(*)}} and {{COUNT(o.id)}} give different results when using LEFT JOIN?',
      'When is GROUP BY the wrong tool, so you should switch to a window function?'
    ],
  },
  'sql-005': {
    q: 'Table transaction(id, customer_id, amount, created_at): get the 3 largest transactions for **each** customer. How do you write the query? If a customer has only 2 transactions, return 2 rows without an error.',
    a: `**Summary:** Use the window function {{ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY amount DESC, id)}} and filter {{rn <= 3}} in the outer query. {{ROW_NUMBER}} guarantees a unique sequence number per row, so filtering {{rn <= 3}} returns exactly 3 rows (or fewer when the customer has fewer transactions). Do not use {{RANK}} or {{DENSE_RANK}}, because with tied amounts they can return more than 3 rows.

### Quick intuition
Like a "top 3 most beautiful goals of each player" board: each player has their own list (PARTITION BY customer_id), sorted from best down (ORDER BY amount DESC), numbered 1, 2, 3, 4… and only numbers 1 to 3 are kept. A player who scored only 2 goals simply has a list with numbers 1 and 2 — nothing wrong, no error. If two goals are "equally beautiful", we still need a fixed rule for who comes first (for example the earlier one) — that is the tie-break.

### Glossary
- **Top-N per group**: the problem of taking the first N rows of each group, a very common SQL interview question.
- **ROW_NUMBER**: assigns consecutive numbers 1, 2, 3… with no ties inside each partition.
- **Tie-break**: an extra column (usually the primary key) that decides the order when the main value is equal.
- **Composite index**: an index over several columns in the declared order.
- **Covering index ({{INCLUDE}})**: an index that also stores extra columns so the DB can answer without reading the table.
- **LATERAL**: lets a subquery in FROM reference columns of the table before it, like a nested for loop.
- **Materialized view**: a query result stored as a table, refreshed periodically.

### Step-by-step mechanism
1. **Partition by customer**: the DB sorts (or reads an index) by {{customer_id, amount DESC, id}}. Why: the transactions of one customer must sit together and already be ordered.
2. **Number the rows**: walk each partition; the first row is 1, each next row adds 1, and a new customer restarts at 1. Why ROW_NUMBER: numbers never repeat, so {{rn <= 3}} yields at most 3 rows.
3. **Filter in the outer query**: window functions run after WHERE, so {{rn <= 3}} must be filtered in the outer CTE.
4. **Customers with few transactions**: a partition with only 2 rows has rn 1 and 2 ⇒ 2 rows come back, no special handling needed.

~~~text
customer 7: amount 500, 300, 300, 200, 100
ROW_NUMBER : 1,   2,   3,   4,   5   -> rn<=3 : 3 rows (correct)
RANK       : 1,   2,   2,   4,   5   -> <=3   : 3 rows (lucky)
DENSE_RANK : 1,   2,   2,   3,   4   -> <=3   : 4 rows (wrong)
customer 9: amount 80, 50            -> rn<=3 : 2 rows
~~~

### Why ROW_NUMBER is the right choice
- Business rule: "3 largest transactions" — counted by **row order**, not by "amount level" ⇒ {{ROW_NUMBER}} gives a 1, 2, 3… sequence with no gaps.
- {{DENSE_RANK <= 3}} keeps every row belonging to the **3 highest amount levels**, not 3 rows: one tie and you get more than 3 (for example 4 transactions on the top amount ⇒ at least 4 rows) ⇒ **wrong**.
- {{RANK}} behaves the same at the **boundary**: amounts 100, 90, 80, 80 ⇒ ranks 1, 2, 3, 3 ⇒ filtering {{<= 3}} returns 4 rows.

### Sample SQL
~~~sql
WITH ranked AS (
    SELECT t.*,
           ROW_NUMBER() OVER (
               PARTITION BY t.customer_id
               ORDER BY t.amount DESC NULLS LAST, t.id
           ) AS rn
    FROM transaction t
)
SELECT r.id, r.customer_id, r.amount, r.created_at
FROM ranked r
WHERE r.rn <= 3
ORDER BY r.customer_id, r.rn;
~~~

### Tie-break is mandatory
Always add a key column {{id}} (or {{created_at}} if it is unique) to {{ORDER BY}}: {{ORDER BY amount DESC, id}}. Otherwise two rows with the same amount can swap places between runs ⇒ the assigned {{rn = 1, 2, 3}} is unstable and the report flickers.

### Performance
- You want an index {{(customer_id, amount DESC, id)}} so the rows are already read in the right order, avoiding a sort (an index-only scan is only reachable when every SELECT column is in the index, so selecting explicit columns instead of {{t.*}} as the sample does helps). PostgreSQL 11+ supports covering indexes ⇒ you can {{INCLUDE (created_at)}} to return an extra column without sorting.
- When you only need the top 3 for a small set of customers, {{CROSS JOIN LATERAL (SELECT … WHERE t.customer_id = c.id ORDER BY amount DESC, id LIMIT 3)}} reads exactly 3 index entries per customer instead of sorting the whole table.
- For very large tables (tens of millions of transactions) this query still scans the whole table. So:
  - Run it only for the needed customer set (add {{WHERE customer_id IN (…)}} or join with an active-customer table).
  - Or precompute into a summary table per day/customer (a materialized view) and refresh it periodically.

### Common mistakes
1. **Forgetting NULLS LAST**. Symptom: rows with {{amount NULL}} are ranked first (PostgreSQL) or last (MySQL) ⇒ the top 3 is wrong. Fix: always write it explicitly (MySQL has no NULLS LAST syntax; use {{ORDER BY amount IS NULL, amount DESC}}).
2. **Using RANK or DENSE_RANK for "top N rows"**. Symptom: extra rows, silently wrong, no error. Fix: ROW_NUMBER plus tests with tied amounts.
3. **No ORDER BY / tie-break inside the window function**. Symptom: non-deterministic results that differ between runs. Fix: {{ORDER BY amount DESC, id}}.
4. **Trying to write it in JPQL**. Symptom: an unreadable query that is hard to optimize. Fix: in JPA/Hibernate use a native query instead of forcing JPQL for window functions (Hibernate 6 supports window functions in HQL, but native SQL is still easier to control at the plan level).

### One-minute spoken answer
"This is the top-N per group problem. I use ROW_NUMBER partitioned by customer_id, ordered by amount descending and by id as a tie-break, then filter rn less than or equal to 3 in the outer query because window functions run after WHERE. A customer with only 2 transactions has a partition with rn 1 and 2, so 2 rows come back naturally. I avoid RANK and DENSE_RANK because with ties they return more than 3 rows. For performance I create an index on (customer_id, amount DESC, id) to avoid the sort; if I only need a few customers I use LATERAL with LIMIT 3 to read exactly 3 index entries each. For a table with hundreds of millions of rows I precompute into a summary table instead of running this on every click."

> Senior tip: this is usually asked as "how do you get the top N per group". The high-scoring answer: "ROW_NUMBER plus an outer filter, always with a tie-break, backed by a composite index in the right order". With a real team, add: "If the table is huge, I would not run this query on production on every click — I would pre-aggregate into a daily summary table and query only that table."`,
    follow: [
      'Why not use DENSE_RANK for "top N rows"?',
      'How would you optimize this query if the transaction table has 100 million rows?'
    ],
  },
  'sql-006': {
    q: 'Write an account statement query: each transaction shows the opening balance, the debit/credit movement, the closing balance and the running balance. Table transaction(id, account_id, type IN/OUT, amount, created_at). The opening balance is the balance after the previous transaction (or 0 for the first transaction).',
    a: `**Summary:** Use the window function {{SUM() OVER (PARTITION BY account_id ORDER BY created_at, id ROWS UNBOUNDED PRECEDING)}} to compute the running balance. The closing balance of the previous row **is** the opening balance of the next row ⇒ derive it with {{LAG(running_balance) OVER (...)}} or compute {{SUM(...) OVER (...) - amount * sign}} depending on how the columns are organized.

### Quick intuition
Think of your personal spending notebook: each line records money in or out, and the last column says "how much is left" after that line. To fill in "how much is left" you take the remaining amount of the line **directly above** and add or subtract the current entry. {{SUM() OVER (... ROWS UNBOUNDED PRECEDING)}} does exactly that: it accumulates from the first row to the current row, in time order, separately for each account. The opening balance of a row is simply the "remaining" value of the row above it.

### Glossary
- **Running balance / running total**: a total accumulated from the start up to the current row.
- **Window frame**: the set of rows an aggregate window function is allowed to "see" when computing the current row.
- **ROWS vs RANGE**: whether the frame counts physical rows or values of the ORDER BY column.
- **Peer rows**: rows sharing the same ORDER BY value as the current row.
- **LAG()**: a function that returns the value of the preceding row in the same partition.
- **Streaming aggregate**: computing incrementally over an already sorted stream without holding everything in memory.
- **Ledger / available balance**: the booked balance and the spendable balance (after subtracting pending items).

### Step-by-step mechanism
1. **Fix the sign (signed CTE)**: IN becomes +amount, OUT becomes -amount. Why: so every transaction can be added with a single SUM.
2. **Order inside each account**: by {{created_at, id}}. Why add id: two transactions in the same second still get a fixed order.
3. **Accumulate (SUM OVER ROWS UNBOUNDED PRECEDING)**: each row takes the total of itself and all rows above it. Why ROWS: count exactly the preceding rows, without pulling in rows that share the same timestamp.
4. **Derive the opening balance**: {{closing - delta}} (equivalent to {{LAG(closing)}}, which gives 0 for the first row).

~~~text
id | type | amount | delta | opening | closing (running)
1  | IN   | 100    | +100  |   0     | 100
2  | OUT  |  30    |  -30  | 100     |  70
3  | IN   |  50    |  +50  |  70     | 120
4  | OUT  |  20    |  -20  | 120     | 100
opening(n) = closing(n-1) ; closing(n) = opening(n) + delta(n)
~~~

### The running balance concept
Running balance = the accumulated total of all previous transactions including the current one.
- If type = 'IN' (deposit, income): + amount
- If type = 'OUT' (withdrawal, expense): - amount
Opening balance = the running balance of the previous transaction = {{LAG(running_balance) OVER (PARTITION BY account_id ORDER BY created_at, id)}}.

### Sample SQL
~~~sql
WITH signed AS (
    SELECT t.*,
           CASE
               WHEN t.type = 'IN'  THEN t.amount
               WHEN t.type = 'OUT' THEN -t.amount
               ELSE 0
           END AS delta
    FROM transaction t
),
running AS (
    SELECT s.*,
           SUM(s.delta) OVER (
               PARTITION BY s.account_id
               ORDER BY s.created_at, s.id
               ROWS UNBOUNDED PRECEDING
           ) AS running_balance
    FROM signed s
)
SELECT r.id,
       r.account_id,
       r.type,
       r.amount,
       r.created_at,
       -- Opening balance = running_balance - delta
       r.running_balance - r.delta AS opening_balance,
       CASE WHEN r.type = 'IN'  THEN r.amount ELSE 0 END AS credit,
       CASE WHEN r.type = 'OUT' THEN r.amount ELSE 0 END AS debit,
       r.running_balance AS closing_balance,
       r.running_balance AS running_balance_final
FROM running r
ORDER BY r.account_id, r.created_at, r.id;
~~~

### ROWS UNBOUNDED PRECEDING vs RANGE
- {{ROWS UNBOUNDED PRECEDING}}: the frame is the **physical rows** from the start up to the current row. Good performance, deterministic.
- {{RANGE UNBOUNDED PRECEDING}}: the frame is defined by the **value** of ORDER BY — every **peer** row (same ORDER BY value) is included. If you order only by {{created_at}} and two transactions share a timestamp, both show the **same** running balance (already including both) ⇒ the statement is wrong.
- **Default trap**: with ORDER BY but no explicit frame, the default is {{RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW}}, not ROWS.
- Always write {{ROWS}} explicitly and put a unique key at the end of ORDER BY ({{id}}); when ORDER BY is already unique, ROWS and RANGE give the same result, but ROWS is clearer and usually cheaper.

### First transaction has opening balance 0
{{LAG(running_balance) OVER (PARTITION BY account_id ORDER BY created_at, id)}} returns NULL for the first row ⇒ wrap it in {{COALESCE(..., 0)}}.
With the query above, {{opening_balance = running_balance - delta}} handles it automatically: the first transaction has running_balance = delta ⇒ opening_balance = 0.

### Performance and index
Composite index: {{(account_id, created_at, id)}}. The {{ROWS UNBOUNDED PRECEDING}} frame lets the DB walk the index sequentially and compute the running sum as a streaming aggregate ⇒ very fast.

### Common mistakes
1. **No id in ORDER BY**. Symptom: transactions in the same second (same {{created_at}}) have no stable order ⇒ the running balance "jumps" on rerun; with the default RANGE frame two rows in the same second even show the same balance. Fix: always add {{id}} and write {{ROWS}} explicitly.
2. **Wrong money type**. Symptom: the balance is off by a few cents after thousands of transactions. Fix: {{amount}} must be {{DECIMAL}}/{{NUMERIC}}, never {{FLOAT}}/{{DOUBLE}}; a float running sum accumulates errors. In Java use {{BigDecimal}}.
3. **Filtering the period before accumulating**. Symptom: a March statement starts from balance 0. Fix: see the "Other production pitfalls" section below.

### Other production pitfalls
- If the system has "adjustments" that change old transactions ⇒ the running balance from that point onward is wrong. Solutions: a {{version}} or {{effective_from}} column, recomputing the running balance from the adjusted transaction onward (or using event sourcing).
- Statement by period (for example March): if you filter {{created_at}} in the WHERE **inside** the CTE before the window function, the running sum starts at 0 ⇒ wrong balance. You must add the opening balance of the period (a snapshot of the previous period end, or the sum of transactions before the period) and then accumulate, or compute the window over the full history and filter the period in the outer query.
- Distinguish "available balance" from "ledger balance". The available balance subtracts pending transactions ⇒ you need a {{status}} column.

### One-minute spoken answer
"The running balance is the accumulated total of transactions up to the current row. I normalize the sign first, IN adds and OUT subtracts, then use SUM OVER partitioned by account_id, ordered by created_at and id, with the frame ROWS UNBOUNDED PRECEDING. The closing balance is that accumulated value, and the opening balance is the closing balance minus delta, equivalent to LAG of the previous row, which gives 0 for the first row. I write ROWS explicitly because the default is RANGE, and with two transactions sharing a timestamp both would show the same balance. With an index on (account_id, created_at, id) the DB reads in order and accumulates as a stream, no self-join needed. My experience is that a statement by period must add the opening balance, otherwise every month starts from 0."

> Senior tip: in an interview, draw a quick illustration: "Transaction 1: deposit 100 → running 100; transaction 2: withdraw 30 → running 70; transaction 3: deposit 50 → running 120". Then say: "I use SUM OVER ROWS UNBOUNDED PRECEDING because it streams, needs no self-join, and the index (account_id, created_at, id) gives the optimal plan". A senior interviewer will nod, because you mentioned streaming aggregate and tie-break.`,
    follow: [
      'Why must you use ROWS UNBOUNDED PRECEDING instead of RANGE?',
      'If an old transaction is adjusted, how do you update the running balance without locking the whole table?'
    ],
  },
  'sql-007': {
    q: 'Table login_history(user_id, login_date): find each user\'s longest run of consecutive login days (streak). Example: user A logs in on 1/1, 2/1, 3/1, 5/1 → the longest streak is 3 days (1–3/1). Write the query using the Gaps and Islands technique.',
    a: `**Summary:** The **Gaps and Islands** technique: use {{ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date)}} and subtract it from {{login_date}} (or use a date difference) to build a **grouping key** — consecutive days get the **same value**, days with a gap get a different value. Then {{GROUP BY user_id, grouping_key}} and take the maximum {{COUNT(*)}}.

### Quick intuition
Picture a queue of people buying tickets; each holds a ticket printed with their login day (1, 2, 3, 5, 6, 9) and is also given a position in the queue (1, 2, 3, 4, 5, 6). When days are consecutive, **both numbers increase by 1 each step**, so "day minus position" stays the same. As soon as a day is missing (a gap), the day jumps by 2 while the position only grows by 1, so the difference changes — a new "island" starts. Grouping by that difference yields each consecutive run, and counting the rows gives the streak length.

### Glossary
- **Gaps and Islands**: a family of problems finding consecutive runs (islands) and missing stretches (gaps) in ordered data.
- **Island**: an unbroken run of consecutive values (for example 1/1–3/1).
- **Gap**: the missing stretch between two islands (for example day 4/1).
- **Grouping key**: a computed value that gives every row of one island the same key, used for GROUP BY.
- **Interval**: PostgreSQL's duration type (for example {{INTERVAL '3 days'}}).
- **Streak**: a run of consecutive active days for a user.

### Step-by-step mechanism
1. **Deduplicate days**: keep one row per user per day. Why: two logins on the same day increase row_number without increasing the day ⇒ the key breaks.
2. **Number rows by date** ({{ROW_NUMBER}} partitioned by user). Why: creates an evenly increasing 1, 2, 3… reference sequence.
3. **Compute key = day − rn**. Why: inside one island both grow at the same rate, so the difference is constant.
4. **GROUP BY user_id, key**: each group is one streak; {{MIN}} is the start day, {{MAX}} the end day, {{COUNT}} the length.
5. **Pick the longest streak** with ROW_NUMBER ordered by length descending.

~~~text
day  : 1  2  3  _  5  6  _  _  9
rn   : 1  2  3     4  5        6
day-rn: 0  0  0     1  1        3
        +--island A-+ +-B--+    +C+
        length 3     length 2   length 1  -> longest streak = 3
~~~

### Why subtracting row_number produces islands
Suppose the login dates are 1, 2, 3, 5, 6, 9. Row numbers: 1, 2, 3, 4, 5, 6.
Compute {{login_date - row_number}} (PostgreSQL: {{login_date - INTERVAL '1 day' * rn}}, MySQL: {{DATE_SUB(login_date, INTERVAL rn DAY)}}):
| login_date | rn | login_date - rn |
|---|---|---|
| 1/1 | 1 | 31/12 (previous year) |
| 2/1 | 2 | 31/12 |
| 3/1 | 3 | 31/12 |
| 5/1 | 4 | 1/1 |
| 6/1 | 5 | 1/1 |
| 9/1 | 6 | 3/1 |

**Consecutive** days produce the **same value** (31/12, 1/1) ⇒ that is an **island**. Days with a gap produce a different value.

### Sample SQL (PostgreSQL)
~~~sql
WITH numbered AS (
    SELECT lh.user_id,
           lh.login_date,
           ROW_NUMBER() OVER (PARTITION BY lh.user_id ORDER BY lh.login_date) AS rn
    FROM login_history lh
),
grouped AS (
    SELECT n.user_id,
           n.login_date,
           -- grouping key: date minus row_number (1-day interval)
           n.login_date - (n.rn || ' days')::interval AS grp
    FROM numbered n
)
SELECT g.user_id,
       MIN(g.login_date) AS streak_start,
       MAX(g.login_date) AS streak_end,
       COUNT(*) AS streak_length
FROM grouped g
GROUP BY g.user_id, g.grp
ORDER BY g.user_id, streak_length DESC;
~~~

### Getting the longest streak per user
~~~sql
WITH streaks AS (
    -- CTE grouped as above
    SELECT g.user_id,
           MIN(g.login_date) AS start_date,
           MAX(g.login_date) AS end_date,
           COUNT(*) AS length
    FROM grouped g
    GROUP BY g.user_id, g.grp
)
SELECT s.user_id, s.start_date, s.end_date, s.length
FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY length DESC, start_date DESC) AS rn
    FROM streaks
) s
WHERE s.rn = 1;
~~~

Note: on PostgreSQL {{date - interval}} returns a {{timestamp}}; it still groups fine, but {{n.login_date - n.rn::int}} is cleaner (date minus an integer gives a date). In the "longest streak" query, {{start_date DESC}} is the tie-break: when two streaks are equally long, take the most recent one.

### MySQL / SQL Server
MySQL: {{DATE_SUB(login_date, INTERVAL rn DAY)}} or {{login_date - INTERVAL rn DAY}}.
SQL Server: {{DATEADD(day, -rn, login_date)}}.

### A note on duplicate dates
If a user logs in **several times in one day**, {{ROW_NUMBER}} counts every row ⇒ the grouping key breaks. You must **distinct the dates first**:
~~~sql
SELECT DISTINCT user_id, login_date::date AS login_date FROM login_history
~~~
Only then apply the window function.

### Broader applications
This technique solves every "consecutive run" problem:
- Consecutive transactions (fraud detection: 5 transactions within 5 minutes)
- IoT sensor events (how long the signal was lost)
- User behavior (consecutive days using the app)

### Common mistakes
1. **Forgetting DISTINCT on the date**. Symptom: several logins per day break the streak (it is chopped up, or the length counts logins instead of days). Fix: deduplicate {{(user_id, day)}} before numbering; if you do count rows, use {{COUNT(DISTINCT login_date)}}.
2. **Ignoring the time zone**. Symptom: {{login_date}} stored in UTC and a +07 user logging in at 6 a.m. is counted on the previous day ⇒ the UTC-based streak is wrong from the user's point of view. Fix: always convert to the user's time zone before truncating to a day.
3. **Using RANGE instead of ROWS** (not applicable here because no window aggregate is used, but if a variant uses SUM OVER, remember ROWS).
4. **Missing index**. Symptom: the query takes minutes on a large table. Fix: you need an index {{(user_id, login_date)}}; in a large app, update the streak incrementally each day into a separate table instead of recomputing the full history.

### One-minute spoken answer
"This is the Gaps and Islands problem. First I deduplicate so each user has at most one row per day. Then I assign ROW_NUMBER by date within each user and subtract that number from the date. Inside a consecutive run both grow by 1, so the difference stays constant; when a day is missing, the difference jumps to a new value. I group by user and that difference to get each streak with its start day, end day and length, then pick the longest with ROW_NUMBER. This needs only one sort and runs well with an index on (user_id, login_date). The two mistakes I have actually hit are forgetting to deduplicate days and computing the day in UTC instead of the user's time zone."

> Senior tip: this is a "do you know the pattern?" question. The quick answer: "Gaps and Islands — subtract row_number from the date to build a grouping key, then group by that key." If the interviewer asks "what if there are several logins in one day?", answer immediately: "deduplicate the dates before the window function". That is the sign you have actually solved this problem in production.`,
    follow: [
      'Why does {{login_date - row_number}} give the same value for consecutive days?',
      'How would you find a streak of "at least one login per day for 7 days" (allowing one missed day)?'
    ],
  },
  'sql-008': {
    q: 'Table sales(sale_date, product_id, amount): pivot monthly revenue into columns (Month 1, Month 2... Month 12) and also compare year over year (YoY). Write a dynamic query that does not hard-code 12 columns.',
    a: `**Summary:** Pivot with {{SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = m THEN amount ELSE 0 END)}} for each month. A **dynamic pivot** (without hard-coding 12 columns) **cannot be done in pure SQL**, because SQL requires a fixed column list at compile time. Solutions: (1) write the 12 columns explicitly — enough for a fixed report, (2) use the {{crosstab}} extension (PostgreSQL) or dynamic SQL inside a stored procedure, (3) best: pivot in the **application layer** (Java) after querying compact data.

### Quick intuition
The sales data in the DB is like a notebook with one line per "date – product – amount" (a **vertical** layout). Your boss wants an Excel table in a **horizontal** layout: one row per product, one column per month. Pivoting is "rotating" the vertical notebook into a horizontal table. In SQL each month column is a "basket" {{SUM(CASE WHEN month = m ...)}}: go through the rows and drop each amount into the basket of its month. The problem is that SQL must know **in advance** how many baskets (columns) there are before it runs — like having to draw the table frame before you can fill in numbers.

### Glossary
- **Pivot**: rotating data from a row layout (long) to a column layout (wide).
- **Long format / wide format**: the vertical layout (one key–value pair per row) and the horizontal layout (one column per value).
- **Conditional aggregation**: an aggregate with a condition inside it, for example {{SUM(CASE WHEN … THEN amount ELSE 0 END)}}.
- **YoY (Year over Year)**: comparing one period with the same period of the previous year.
- **crosstab / tablefunc**: the pivot function from the {{tablefunc}} extension in PostgreSQL.
- **Dynamic SQL**: a SQL statement assembled as a string at runtime and executed afterwards.
- **Compile time (of a SQL statement)**: the moment the DB parses the statement and must know the exact result columns and their types.

### Step by step (conditional aggregation)
1. **Filter the date range** with conditions of the form {{>= start of year AND < start of next year}}. Why: this can use an index on {{sale_date}} (wrapping the column in EXTRACT in WHERE loses the index).
2. **GROUP BY product_id**: one group per product.
3. **For each row in the group**, all 12 CASE expressions are evaluated; only the one matching that row's month returns {{amount}}, the other 11 return 0.
4. **SUM each column**: the basket of a month collects that month's amounts. Why ELSE 0: a month without transactions yields 0 instead of NULL.
5. **YoY**: repeat for the previous year, then LEFT JOIN on product_id and {{yr = yr - 1}}.

~~~text
long format                    wide format
prod | month | amount          prod | m1  | m2  | m3
A    | 1     | 100     -->     A    | 100 | 0   | 70
A    | 3     | 70              B    | 0   | 50  | 0
B    | 2     | 50
YoY% = (m1_2026 - m1_2025) / NULLIF(m1_2025, 0) * 100
~~~

### Explicit pivot (fixed 12 columns) — the most common approach
~~~sql
SELECT s.product_id,
       SUM(CASE WHEN EXTRACT(MONTH FROM s.sale_date) = 1  THEN s.amount ELSE 0 END) AS m1,
       SUM(CASE WHEN EXTRACT(MONTH FROM s.sale_date) = 2  THEN s.amount ELSE 0 END) AS m2,
       SUM(CASE WHEN EXTRACT(MONTH FROM s.sale_date) = 3  THEN s.amount ELSE 0 END) AS m3,
       -- ... up to m12
       SUM(CASE WHEN EXTRACT(MONTH FROM s.sale_date) = 12 THEN s.amount ELSE 0 END) AS m12,
       SUM(s.amount) AS total_year
FROM sales s
WHERE s.sale_date >= DATE '2026-01-01'
  AND s.sale_date <  DATE '2027-01-01'
GROUP BY s.product_id
ORDER BY s.product_id;
~~~

### YoY comparison (Year over Year)
Add the year to GROUP BY, then self-join or use the window function {{LAG}} on the year column:
~~~sql
WITH yearly AS (
    SELECT EXTRACT(YEAR FROM s.sale_date)::int AS yr,
           EXTRACT(MONTH FROM s.sale_date)::int AS mo,
           s.product_id,
           SUM(s.amount) AS amount
    FROM sales s
    WHERE s.sale_date >= DATE '2025-01-01'
      AND s.sale_date <  DATE '2027-01-01'
    GROUP BY yr, mo, s.product_id
),
pivoted AS (
    SELECT product_id,
           yr,
           SUM(CASE WHEN mo = 1  THEN amount ELSE 0 END) AS m1,
           -- ... m12
           SUM(CASE WHEN mo = 12 THEN amount ELSE 0 END) AS m12
    FROM yearly
    GROUP BY product_id, yr
)
SELECT cur.product_id,
       cur.m1  AS m1_2026,  prv.m1  AS m1_2025,
       cur.m2  AS m2_2026,  prv.m2  AS m2_2025,
       -- ...
       cur.m12 AS m12_2026, prv.m12 AS m12_2025
FROM pivoted cur
LEFT JOIN pivoted prv ON prv.product_id = cur.product_id AND prv.yr = cur.yr - 1
WHERE cur.yr = 2026;
~~~

### Dynamic pivot with crosstab (PostgreSQL)
Requires the {{tablefunc}} extension: {{CREATE EXTENSION tablefunc;}}
~~~sql
SELECT * FROM crosstab(
    $$
    SELECT product_id,
           EXTRACT(MONTH FROM sale_date)::int AS month,
           SUM(amount)
    FROM sales
    WHERE sale_date >= '2026-01-01' AND sale_date < '2027-01-01'
    GROUP BY product_id, month
    ORDER BY product_id, month
    $$,
    $$ SELECT generate_series(1,12) $$
) AS ct(product_id bigint, m1 numeric, m2 numeric, /* ... */ m12 numeric);
-- product_id must be declared with the source column type; list m1..m12 fully
~~~
- First query: the data (row header, category, value).
- Second query: the category list (1..12) — guarantees all 12 columns exist even for months without data.
- Drawback: the return type must still be declared ({{AS ct(...)}}), so it is not truly dynamic.

### Dynamic SQL inside a stored procedure
Write PL/pgSQL that builds the SELECT string and then {{EXECUTE}} it. Use it only when the client **must** receive a dynamic column schema (rare).

### The practical approach: pivot in Java
The SQL query returns only **long format** data (product_id, year, month, amount) — very compact, index-friendly, no hard-coding:
~~~sql
SELECT product_id,
       EXTRACT(YEAR FROM sale_date)::int AS yr,
       EXTRACT(MONTH FROM sale_date)::int AS mo,
       SUM(amount) AS amount
FROM sales
WHERE sale_date >= DATE '2025-01-01'
  AND sale_date <  DATE '2027-01-01'
GROUP BY product_id, yr, mo
ORDER BY product_id, yr, mo;
~~~
In Java: use {{Map<Integer, Map<Integer, BigDecimal>>}} or stream {{Collectors.groupingBy}} to pivot into a matrix, compute YoY, and fill 0 for missing months. Flexible, testable, independent of the DB vendor.

### Common mistakes
- **Dividing by zero when computing YoY %**. Symptom: a "division by zero" error when the previous year's month is 0. Fix: {{NULLIF(prev, 0)}} and show "new" instead of a percentage.
- **Wrapping the column in a function in WHERE** ({{WHERE EXTRACT(YEAR FROM sale_date) = 2026}}). Symptom: a full scan even though there is an index on {{sale_date}}. Fix: use the range {{>= DATE '2026-01-01' AND < DATE '2027-01-01'}}.
- Hard-coding 12 columns in SQL ⇒ every new year needs a SQL change, an annoying migration.
- {{CASE WHEN}} without {{ELSE 0}}: SUM skips NULL, so months with data are still correct, but months with **no** transactions yield NULL instead of 0 ⇒ later steps (YoY %) become NULL. Use {{ELSE 0}} or {{COALESCE}}.
- YoY comparison: a product that is new this year has no previous-year row ⇒ an INNER JOIN **drops** it; use LEFT JOIN and handle the NULL {{prv}} values. When the current year is not finished, future months are 0 — do not display that as "down 100%".
- Time zone: {{sale_date}} stored in UTC, extracting the month in UTC can differ from the local month ⇒ convert the time zone before extracting.

### One-minute spoken answer
"A pivot in SQL is usually done with conditional aggregation: group by product, one SUM CASE WHEN per month that takes the amount when the month matches and 0 otherwise. For YoY I compute the pivot for both years and LEFT JOIN the current year to the previous one so new products are not lost, and I use NULLIF when computing percentages. A truly dynamic pivot is not possible in SQL, because the column list and data types must be known when the statement is parsed; PostgreSQL's crosstab still requires declaring the columns, and dynamic SQL is hard to maintain and prone to injection. So in projects I let SQL return compact vertical data, use the index on sale_date, and pivot plus fill missing months in Java with groupingBy. That is testable and vendor-independent."

> Senior tip: when the interviewer asks "how would you do a dynamic pivot?", the strong answer is: "SQL cannot do a truly dynamic pivot; I query long format and pivot in Java. If I must stay in SQL, I use the crosstab extension or 12 explicit CASE WHEN columns." That shows you understand the limits of SQL and know where to draw the responsibility boundary.`,
    follow: [
      'Why does SQL not support a truly dynamic pivot (columns unknown at compile time)?',
      'When should you use the crosstab extension and when should you pivot in the application?'
    ],
  }
});
