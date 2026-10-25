/*
 * English translation of js/data/q-sql.js — task T182. Format: js/core/i18n.js (content overlay).
 * ids: sql-001 sql-002 sql-003 sql-004 sql-005 sql-006 sql-007 sql-008
 */
App.i18n.content({
  'sql-001': {
    q: 'Table employee(id, full_name, dept_id, salary): find the person with the second-highest salary in each department (if multiple people share the same salary, take all). How do you write the SQL? How do DENSE_RANK, RANK, and ROW_NUMBER differ?',
    a: `**Summary:** Use a window function {{DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC)}} then filter {{rank = 2}} in the **outer layer**. {{DENSE_RANK}} ranks by **value** so people with the same salary still share the same rank — exactly what "second-highest salary" means. {{RANK}} skips numbers (1, 1, 3) so if two people share the top salary, **there is no rank 2**. {{ROW_NUMBER}} always assigns 1, 2, 3… with no duplicates, so it returns exactly one person per department.

### Why filter must be in the outer layer
Window functions are **not** allowed in {{WHERE}} (PostgreSQL reports "window functions are not allowed in WHERE", MySQL reports "Invalid use of window function"). The logical execution order of SELECT is: FROM → WHERE → GROUP BY → HAVING → **window functions** → SELECT → DISTINCT → ORDER BY → LIMIT. Because window functions run *after* WHERE, to filter by their result you must wrap them in a subquery or CTE and filter on the outside.

### Comparing the three ranking functions
Example Accounting (KT) department data:
| id | salary | DENSE_RANK | RANK | ROW_NUMBER |
|---|---|---|---|---|
| 1 | 50 | 1 | 1 | 1 |
| 2 | 50 | 1 | 1 | 2 |
| 3 | 40 | 2 | 3 | 3 |
| 4 | 40 | 2 | 3 | 4 |
| 5 | 30 | 3 | 5 | 5 |

- {{DENSE_RANK = 2}} → ids 3, 4: correct "second-highest salary", two people share the rank.
- {{RANK = 2}} → **no one**: rank 2 is skipped, a classic trap.
- {{ROW_NUMBER <= 2}} → ids 1, 2: the two top-paid people, **not** "second-highest salary".

Selection rule: business says "**salary rank**" (same rank allowed, no skipped numbers) → DENSE_RANK; need exactly N **people** → ROW_NUMBER; need ranking like a tournament (same rank then **skip**: 1, 1, 3) → RANK.

### SQL example
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
    WHERE e.salary IS NOT NULL      -- exclude people without salary
)
SELECT r.* FROM ranked r WHERE r.salary_rank = 2;
~~~

### NULL and monetary values
- PostgreSQL treats NULL as **greater than any other value**, so {{ORDER BY salary DESC}} pushes NULL-salary rows to the **top** ⇒ rank 1 is a person with no salary. Always specify {{NULLS LAST}} (MySQL defaults NULL to the end with DESC).
- Salary must be {{DECIMAL}}/{{NUMERIC}}, absolutely never {{FLOAT}} — comparing {{0.1 + 0.2}} with {{0.3}} will be wrong.

### Performance
Window functions force the DB to **sort by (dept_id, salary)**. Create an index {{(dept_id, salary DESC)}} so the sort avoids I/O; if the table only needs a few columns, an index-only scan may be possible. For data retrieved in Java, use a native query with projection interface to avoid manual mapping.

### Production pitfalls
- Choosing the wrong {{RANK}} when the business means "second salary" → the report comes back **empty** with no error, very easy to miss. Always test with duplicate salaries.
- This query scans the entire employee table every time a report is opened: cache by day or pre-compute into a summary table.
- Without a tie-break, {{ROW_NUMBER}} results can change between runs on the same data ⇒ always add an increasing key column: {{ORDER BY salary DESC, id}}.

> Senior tip: in an interview, answer in order: "I use a window function, filter in the outer layer because WHERE cannot see window function results; DENSE_RANK because the business asks by **salary level** not by **person order**." Being able to distinguish DENSE_RANK from RANK shows you really understand window functions, not just syntax. In a real project, prefer a simpler solution: if the employee table only has a few thousand rows, a correlated subquery is sufficient and more readable for colleagues who are not SQL experts.`,
    follow: [
      'Why does {{RANK}} never return rank 2 when two people share the highest salary?',
      'How do you get the "second-highest salary" person while keeping exactly one person per department?'
    ],
  },
  'sql-002': {
    q: 'Table transaction_import has duplicates from repeated imports (same external_id). You need to find and delete duplicates, keeping only one record (the one with the smallest id). How to do this safely on PostgreSQL and Oracle?',
    a: `**Summary:** Use {{ROW_NUMBER() OVER (PARTITION BY external_id ORDER BY id)}} to mark the "keep" record (rn = 1), then delete records with {{rn > 1}}. PostgreSQL uses {{DELETE FROM t USING (...)}}; Oracle and MySQL 8 use {{DELETE FROM t WHERE id IN (SELECT id FROM (…ROW_NUMBER…))}} — MySQL requires an extra derived-table layer or it throws error **1093** ("You can't specify target table for update in FROM clause").

### Why not DISTINCT or GROUP BY
- {{SELECT DISTINCT *}} does not solve it: two records that are "logically" duplicates often differ in a timestamp or auto-generated sequence column ⇒ DISTINCT keeps both.
- {{GROUP BY external_id HAVING COUNT(*) > 1}} only **detects** duplicate groups, it does not identify **which rows** to delete ⇒ must combine with a window function.
- Choose {{ROW_NUMBER}} (not RANK/DENSE_RANK) because we need a strict 1, 2, 3… sequence with no gaps ⇒ deleting {{rn > 1}} always leaves exactly one record per key.

### SQL example (PostgreSQL)
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
    ) t WHERE t.rn > 1   -- MySQL requires alias for derived table; Oracle accepts it
);
~~~

### Batch delete, not all at once
Deleting millions of rows in a **single** transaction holds locks for a long time, creates many dead tuples in PostgreSQL (table bloat, heavy vacuum, queries slow down), and expands undo logs and binlogs in MySQL. Delete in batches of 1,000–10,000 rows, each batch a separate transaction, divided by {{id}} range ⇒ multiple jobs can run in parallel without collision.

In PostgreSQL you can delete by {{ctid}} (physical address) to avoid needing an index, but {{ctid}} **changes after every UPDATE or VACUUM FULL** ⇒ do not use it as a long-term identifier. Oracle has a similar {{ROWID}} (also changes when a row moves).

### Prevention is more important than cleanup
- Add a **unique constraint** on the business key: the only way to guarantee no duplicates is {{ALTER TABLE transaction_import ADD CONSTRAINT uk_ext_id UNIQUE (external_id);}}
- If using soft delete ({{deleted_at}} column), the unique index must be **partial**: {{CREATE UNIQUE INDEX uk_ext_active ON transaction_import (external_id) WHERE deleted_at IS NULL;}} (PostgreSQL) — otherwise a later import still violates it.
- Make imports **idempotent** using upsert ({{INSERT … ON CONFLICT}}) instead of deleting then inserting again.
- If duplicate records are referenced by other tables (FK), delete/update the child table first, or migrate the FK to the kept record.

### Production pitfalls
- Running {{DELETE}} when the key column has no index ⇒ full scan, holding row locks on many rows for a long time (MySQL InnoDB also locks every scanned row — almost a table lock), killing the service at peak load.
- Forgetting a range condition (e.g., only delete records from today's import batch) ⇒ accidentally deleting valid data.
- In Oracle, {{DELETE}} generates redo/undo ⇒ consider batching and monitor {{UNDO}} to avoid {{ORA-01555}}.
- Always test on a **staging copy** with production-like data and verify the number of deleted rows before committing.

> Senior tip: the question "how do you delete duplicates?" is often a trap — the interviewer wants to hear you talk about **unique constraint + idempotent upsert**, not DELETE syntax. A strong answer is: "I will delete using ROW_NUMBER to clean current data, but the root fix is to add a unique constraint on external_id and change the import flow to upsert, because if we only delete, the next import will duplicate again." That is the mindset of a 4–8 year engineer: fix the cause, not just the symptom.`,
    follow: [
      'Why does MySQL 8 throw error 1093 when deleting from the same table being read in a subquery?',
      'When should you use soft delete instead of hard delete, and what are the risks?'
    ],
  },
  'sql-003': {
    q: 'Find customers who have never had a transaction. Do you write the query with NOT EXISTS, NOT IN, or LEFT JOIN ... IS NULL? When is each correct, and what is the NULL trap?',
    a: `**Summary:** Use {{NOT EXISTS}} for anti-join: safe with NULL, clear intent, and the optimizer usually converts it to an indexed anti-join. {{NOT IN}} is a trap: if the subquery result set contains **even one** NULL value, **no rows** are returned. {{LEFT JOIN … IS NULL}} gives the same result but easily causes "row explosion" when joining multiple child tables and is harder to read.

### The three approaches
| Approach | Subquery contains NULL | Note |
|---|---|---|
| {{NOT EXISTS}} | Not affected | Default choice for anti-join |
| {{NOT IN}} | Returns **0 rows** | Only safe when the value set is guaranteed non-NULL |
| {{LEFT JOIN … IS NULL}} | Not affected | Equivalent result, but prone to row multiplication |

### The NULL trap of NOT IN — three-valued logic explained
SQL uses **three-valued logic**: TRUE, FALSE, and **UNKNOWN**. NULL means "unknown value", so any comparison with NULL yields UNKNOWN:
- {{c.id = NULL}} → UNKNOWN (never TRUE) ⇒ no row matches.
- {{c.id <> NULL}} → UNKNOWN ⇒ all rows lost.
- {{c.id NOT IN (1, NULL)}}: for a row with id = 5, SQL checks 5 = 1 (FALSE) then 5 = NULL (UNKNOWN) ⇒ result UNKNOWN ⇒ **the row is discarded**.
- Just **one** NULL in the result set is enough to make the whole query return empty.
- In WHERE only rows with TRUE are kept ⇒ UNKNOWN is silently discarded.

~~~sql
-- Trap: if orders has a record with customer_id NULL, this query returns 0 rows
SELECT c.id, c.full_name
FROM customers c
WHERE c.id NOT IN (SELECT o.customer_id FROM orders o);
~~~

### Correct query
~~~sql
-- Customers with no transactions since 01/01/2026 (Vietnam time)
SELECT c.id, c.full_name
FROM customers c
WHERE NOT EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.customer_id = c.id
      AND o.created_at >= TIMESTAMPTZ '2026-01-01 00:00:00+07'
);
~~~
{{NOT EXISTS}} is an **anti-join** ({{EXISTS}} is a semi-join): the subquery only needs to answer "yes/no", stopping at the first matching row ⇒ an index {{(customer_id, created_at)}} is sufficient, no DISTINCT needed, and NULL comparisons are not an issue.

### LEFT JOIN … IS NULL
~~~sql
SELECT c.id, c.full_name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.customer_id IS NULL;
~~~
- Gives the **same result** as NOT EXISTS for a single child table if the join key is not NULL.
- But joining **two** child tables at once (orders and cards): a customer with 3 orders and 2 cards produces **6 rows**; {{COUNT(*)}} returns 6 instead of 3. With NOT EXISTS, each condition is an independent subquery, so rows are not multiplied.
- The NULL-check column must be correct; if it is nullable in the parent table, the condition is wrong.
- Any additional filter conditions other than the join must be in the {{ON}} clause, not {{WHERE}} — putting them in WHERE turns LEFT JOIN into INNER JOIN.

### Performance
- NOT EXISTS with an index on the join column ⇒ plan uses "Anti Join" (Nested Loop Anti Join or Hash Anti Join).
- Without an index, the subquery may run once per outer row ⇒ expensive. Check with {{EXPLAIN (ANALYZE)}}.
- PostgreSQL does **not** convert {{NOT IN (subquery)}} to anti-join (because NULL semantics differ) ⇒ the plan uses a "hashed SubPlan"; if the sub-plan does not fit in {{work_mem}} it becomes a sub-plan executed for each row ⇒ very slow. Another reason to prefer NOT EXISTS.

### Production pitfalls
- Placing the time condition **outside** the subquery (e.g., in {{WHERE o.created_at >= ...}}) loses the very customers we want to find — the time filter must be **inside** the NOT EXISTS subquery.
- {{NOT IN}} with an ID list from another table that has a nullable column (e.g., a blacklist) ⇒ silently loses results with **no error**. When a query unexpectedly returns 0 rows, check for NULL first.
- Large blocklists (thousands of IDs) ⇒ put them in a temporary table and JOIN instead of using {{NOT IN}}.
- In JPA, inspect the actual SQL generated for {{@Query}} to confirm it uses {{EXISTS}}; for complex anti-join logic, native queries are easier to control.

> Senior tip: "NOT IN or NOT EXISTS" is a classic knock-out question. A high-scoring answer: "I use NOT EXISTS because NOT IN is not safe with NULL — a single NULL in the subquery result empties the entire result; NOT EXISTS is converted by the optimizer to an anti-join, stops early, and uses the index well." If the interviewer asks "what about LEFT JOIN IS NULL?", continue with the row-multiplication risk when joining multiple child tables — that is exactly where average candidates answer incorrectly.`,
    follow: [
      'Explain three-valued logic in detail and why NULL in NOT IN makes the whole query return empty.',
      'For an anti-join query, how do you know whether the optimizer chooses Nested Loop Anti Join or Hash Anti Join?'
    ],
  },
  'sql-004': {
    q: 'How do WHERE and HAVING differ, what is the logical execution order of a SELECT statement? What common GROUP BY mistakes have you fixed for your team?',
    a: `**Summary:** {{WHERE}} filters **rows** before grouping; {{HAVING}} filters **groups** after aggregation. Logical order: FROM → WHERE → GROUP BY → HAVING → window functions → SELECT → DISTINCT → ORDER BY → LIMIT. Rule to remember: **any condition on a source-table column belongs in WHERE** — putting it in HAVING makes the DB aggregate everything then discard, which is both logically wrong and slower.

### Classic example: March revenue
~~~sql
-- WRONG: sums the whole year then filters
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
The wrong query also triggers errors like "column must appear in GROUP BY clause" (PostgreSQL) or **ONLY_FULL_GROUP_BY** (MySQL 5.7+ default). If you "fix" it by adding {{created_at}} to GROUP BY, each transaction becomes its own group ⇒ HAVING returns every single transaction over 1 million instead of the total per customer.

### Common mistakes
1. Aggregate in WHERE: {{WHERE SUM(amount) > 100}} ⇒ "aggregate functions are not allowed in WHERE". Use HAVING.
2. Non-aggregate column in SELECT not in GROUP BY: PostgreSQL errors immediately. Fix: add to GROUP BY, wrap with {{MAX()/MIN()}}, or use window functions instead of GROUP BY.
3. Wrong COUNT with LEFT JOIN: {{COUNT(*)}} counts **including** NULL rows from the join, while {{COUNT(o.id)}} only counts real orders — the same query gives two different results. A classic "zero statistics" bug.
4. SELECT alias in WHERE: no DB allows it (WHERE runs before SELECT). In HAVING: MySQL allows it (its own extension), PostgreSQL reports "column does not exist" ⇒ rewrite the expression or use a subquery/CTE. (Aliases are allowed in ORDER BY.)
5. {{HAVING status = 'X'}} when status is not in GROUP BY ⇒ error; this condition belongs in WHERE.
6. Confusing {{HAVING COUNT(*) > 0}} with {{WHERE EXISTS}}: both give the same result but different plans (semi-join vs group + filter).

### Why WHERE is faster
WHERE reduces the number of rows entering the grouping step (hash aggregate / sort) ⇒ less I/O and memory. HAVING filters **after** grouping, so it uses more CPU. If {{EXPLAIN (ANALYZE)}} shows HashAggregate processing millions of rows, ask yourself: should that condition be in WHERE?

### Aggregates and NULL
- {{COUNT(*)}}, {{COUNT(col)}}, {{COUNT(DISTINCT col)}} are clearly different.
- {{SUM}} ignores NULL and returns NULL (not 0) if all rows are NULL ⇒ wrap with {{COALESCE(SUM(x), 0)}}.
- In HAVING, comparing with NULL yields UNKNOWN ⇒ the row is removed. Do not write {{HAVING SUM(x) = NULL}} to mean "empty".

### Logical vs physical order
- The list above is the **logical** order you must respect when writing queries. The optimizer is free to reorder (push simple conditions closer to the source, change join order) — never rely on the physical order.
- Easy mistake: {{DISTINCT}} is applied **before** {{ORDER BY}} ⇒ {{SELECT DISTINCT a, b FROM t ORDER BY c}} is an error because c is not in the selected list (PostgreSQL errors; MySQL 5.7+ reports error 3065 when ONLY_FULL_GROUP_BY is enabled — the default).

### Production pitfalls
- GROUP BY on a column with NULL: **every** NULL is grouped into **one** group (GROUP BY treats NULLs as "not distinguishable", even though {{NULL = NULL}} is UNKNOWN) ⇒ use {{COALESCE(col, 'NOT CLASSIFIED')}} to label the group clearly.
- GROUP BY on a column with **many values** (e.g., {{transaction_id}}) is meaningless and memory-heavy ⇒ that is when you should switch to a window function.
- Index on the GROUP BY column helps the DB use an index scan instead of sort + hash ⇒ aggregate reports by category should have an index.
- Periodic reports (cron) should write results into a summary table instead of computing them every time a user opens the page.

> Senior tip: always remember "**WHERE filters rows, HAVING filters groups**" to decide where a condition belongs. When asked about SQL performance in an interview, the high-scoring answer is: "conditions on source columns always go in WHERE to reduce rows entering the aggregate step; HAVING is only for conditions depending on aggregate results." Pair it with a real example from a system you fixed — that turns the answer from "knows theory" to "has solved it."`,
    follow: [
      'Why do {{COUNT(*)}} and {{COUNT(o.id)}} give different results when using LEFT JOIN?',
      'When is GROUP BY the wrong approach and should be replaced by a window function?'
    ],
  },
  'sql-005': {
    q: 'Table transaction(id, customer_id, amount, created_at): get the top 3 largest transactions for each customer. Write the query. If a customer has only 2 transactions, return 2 rows without error.',
    a: `**Summary:** Use window function {{ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY amount DESC, id)}} then filter {{rn <= 3}} in the outer layer. {{ROW_NUMBER}} guarantees each row has a unique sequence number, so filtering {{rn <= 3}} returns exactly 3 rows (or fewer if the customer has fewer transactions). Do not use {{RANK}} or {{DENSE_RANK}} because they can return more than 3 rows when amounts are tied.

### Why ROW_NUMBER is the right choice
- Business requirement: "top 3 transactions" — counted by **row order**, not by "amount level" ⇒ {{ROW_NUMBER}} gives a strict 1, 2, 3… sequence with no gaps.
- If using {{DENSE_RANK}} and the top 3 transactions share the same amount, {{DENSE_RANK}} = 1 for all 3 ⇒ filtering {{<= 3}} returns **all** 3 (correct), but if there are 4 with the same amount it still returns 4 ⇒ **wrong**.
- {{RANK}} behaves the same at the boundary: amounts 100, 90, 80, 80 ⇒ ranks 1, 2, 3, 3 ⇒ filtering {{<= 3}} returns 4 rows.

### SQL example
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
Always include a key column {{id}} (or a unique {{created_at}}) in the {{ORDER BY}}: {{ORDER BY amount DESC, id}}. Without it, two rows with the same amount may swap positions between runs ⇒ the assigned {{rn = 1, 2, 3}} is unstable, causing flickering reports.

### Performance
- Composite index {{(customer_id, amount DESC, id)}} enables index-only scans and avoids sorting. PostgreSQL 11+ supports covering indexes ⇒ you can {{INCLUDE (created_at)}} to return extra columns without sorting.
- When only the top 3 for a small customer set is needed, {{CROSS JOIN LATERAL (SELECT … WHERE t.customer_id = c.id ORDER BY amount DESC, id LIMIT 3)}} reads exactly 3 index entries per customer instead of sorting the whole table.
- For very large tables (tens of millions of transactions), this query still scans the full table. Improvements:
  - Only run for the needed customer set (add {{WHERE customer_id IN (…)}} or join with an active-customer table).
  - Or pre-aggregate into a daily/customer summary table (materialized view) and refresh periodically.

### Production pitfalls
- Forgetting {{NULLS LAST}} ⇒ a row with {{amount NULL}} is ranked first (PostgreSQL) or last (MySQL) ⇒ top 3 is wrong. Always specify it.
- Using {{RANK}} or {{DENSE_RANK}} for "top N rows" ⇒ silent wrong results, no error thrown.
- Not wrapping {{ORDER BY}} inside the window function ⇒ non-deterministic results that vary between runs.
- In JPA/Hibernate, use native queries for window functions (Hibernate 6 supports them but still generates suboptimal SQL).

> Senior tip: this is often asked as "how to get top N per group". A high-scoring answer: "ROW_NUMBER + outer filter, always with a tie-break, with the right composite index". With a real team: "If the table is very large, I would not run this directly on production on every click — I would pre-aggregate into a summary table by day and only query the summary."`,
    follow: [
      'Why not use DENSE_RANK for "top N rows"?',
      'How to optimize this query if the transaction table has 100 million rows?'
    ],
  },
  'sql-006': {
    q: 'Write an account statement query: each transaction shows opening balance, debit/credit amount, closing balance, and running balance. Table transaction(id, account_id, type IN/OUT, amount, created_at). Opening balance is the balance after the previous transaction (0 for the first transaction).',
    a: `**Summary:** Use window function {{SUM() OVER (PARTITION BY account_id ORDER BY created_at, id ROWS UNBOUNDED PRECEDING)}} to compute the running balance. The closing balance of the previous row **is** the opening balance of the next row ⇒ derive it with {{LAG(running_balance) OVER (...)}} or compute {{SUM(...) OVER (...) - amount * sign}} depending on column organization.

### Running balance concept
Running balance (cumulative balance) = running total of previous transactions including the current one.
- If type = 'IN' (deposit, income): + amount
- If type = 'OUT' (withdrawal, expense): - amount
Opening balance = running balance of the previous transaction = {{LAG(running_balance) OVER (PARTITION BY account_id ORDER BY created_at, id)}}.

### SQL example
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
       -- Opening balance = running balance - delta
       r.running_balance - r.delta AS opening_balance,
       CASE WHEN r.type = 'IN'  THEN r.amount ELSE 0 END AS credit,
       CASE WHEN r.type = 'OUT' THEN r.amount ELSE 0 END AS debit,
       r.running_balance AS closing_balance,
       r.running_balance AS running_balance_final
FROM running r
ORDER BY r.account_id, r.created_at, r.id;
~~~

### ROWS UNBOUNDED PRECEDING vs RANGE
- {{ROWS UNBOUNDED PRECEDING}}: the window frame is the **physical rows** from the start up to the current row. Good performance, deterministic.
- {{RANGE UNBOUNDED PRECEDING}}: the frame is by **value** of the ORDER BY — all rows with the same ORDER BY value (peer rows) are included. If you order only by {{created_at}} and two transactions share the same timestamp, both show the **same** running balance (already including both) ⇒ the statement is wrong.
- **Default trap**: with ORDER BY but no explicit frame, the default is {{RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW}}, not ROWS.
- Always specify {{ROWS}} and include a unique key at the end of ORDER BY ({{id}}); when ORDER BY is unique, ROWS and RANGE give the same result, but ROWS is clearer and usually faster.

### First transaction opening balance = 0
{{LAG(running_balance) OVER (PARTITION BY account_id ORDER BY created_at, id)}} returns NULL for the first row ⇒ wrap with {{COALESCE(..., 0)}}.
With the query above, {{opening_balance = running_balance - delta}} handles it automatically: the first transaction has running_balance = delta ⇒ opening_balance = 0.

### Performance and index
Composite index: {{(account_id, created_at, id)}}. The {{ROWS UNBOUNDED PRECEDING}} frame allows the DB to scan the index sequentially, compute the running sum as a streaming aggregate ⇒ very fast.

### Production pitfalls
- No {{id}} in ORDER BY ⇒ transactions with the same second have unstable order ⇒ running balance "jumps" on rerun. Always include {{id}}.
- Monetary type: {{amount}} must be {{DECIMAL}}/{{NUMERIC}}, never {{FLOAT}}/{{DOUBLE}}. A running sum of floats accumulates errors.
- If the system has "adjustment" records that modify past transactions ⇒ running balance from that point onward is wrong. Solution: add a {{version}} or {{effective_from}} column, or recalculate from the modified transaction onward (or use event sourcing).
- Statement by period (e.g., March): if you filter {{created_at}} inside the CTE before the window function, the running sum resets to 0 ⇒ wrong balance. You must compute on the full history then filter by period in the outer query, or add the period-opening balance (snapshot) first.
- Distinguish "available balance" (available balance, excluding pending transactions) from "ledger balance". Available balance must subtract pending transactions ⇒ need a {{status}} column.

> Senior tip: in an interview, draw a quick illustration: "Transaction 1: deposit 100 → running 100; Transaction 2: withdraw 30 → running 70; Transaction 3: deposit 50 → running 120." Then say: "I use SUM OVER ROWS UNBOUNDED PRECEDING because it streams, avoids self-join, and the index (account_id, created_at, id) gives the optimal plan." A senior interviewer will nod because you mentioned streaming aggregate and tie-break.`,
    follow: [
      'Why must you use ROWS UNBOUNDED PRECEDING instead of RANGE?',
      'If an old transaction is adjusted, how do you update the running balance without locking the entire table?'
    ],
  },
  'sql-007': {
    q: 'Table login_history(user_id, login_date): find the longest consecutive login streak for each user (streak). Example: user A logs in 1/1, 2/1, 3/1, 5/1 → longest streak is 3 days (1/1–3/1). Write the query using the Gaps and Islands technique.',
    a: `**Summary:** The **Gaps and Islands** technique: use {{ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date)}} and subtract it from {{login_date}} (or a date difference) to create a **grouping key** — consecutive days yield the **same value**, non-consecutive days yield different values. Then {{GROUP BY user_id, grouping_key}} and count with {{COUNT(*)}} to get the maximum.

### Why subtracting row_number works
Assume login dates: 1, 2, 3, 5, 6, 9. Row numbers: 1, 2, 3, 4, 5, 6.
Compute {{login_date - row_number}} (PostgreSQL: {{login_date - INTERVAL '1 day' * rn}}, MySQL: {{DATE_SUB(login_date, INTERVAL rn DAY)}}):
| login_date | rn | login_date - rn |
|---|---|---|
| 1/1 | 1 | 31/12 (previous year) |
| 2/1 | 2 | 31/12 |
| 3/1 | 3 | 31/12 |
| 5/1 | 4 | 1/1 |
| 6/1 | 5 | 1/1 |
| 9/1 | 6 | 3/1 |

**Consecutive** days share the **same value** (31/12, 1/1) ⇒ that is the **island**. Non-consecutive days (gap) produce different values.

### SQL example (PostgreSQL)
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
           -- grouping key: date minus row_number (interval 1 day)
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
    SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY length DESC) AS rn
    FROM streaks
) s
WHERE s.rn = 1;
~~~

### MySQL / SQL Server
MySQL: {{DATE_SUB(login_date, INTERVAL rn DAY)}} or {{login_date - INTERVAL rn DAY}}.
SQL Server: {{DATEADD(day, -rn, login_date)}}.

### Note on duplicate dates
If a user logs in **multiple times in one day**, {{ROW_NUMBER}} counts each record ⇒ the grouping key breaks. Must **deduplicate dates first**:
~~~sql
SELECT DISTINCT user_id, login_date::date AS login_date FROM login_history
~~~
Only then apply the window function.

### Broader applications
This technique applies to every "consecutive sequence" problem:
- Consecutive transactions (fraud detection: 5 transactions in 5 minutes)
- IoT sensor events (signal loss duration)
- User behavior (consecutive days using the app)

### Production pitfalls
- Forgetting {{DISTINCT}} for the date ⇒ multiple logins per day break the streak.
- Not handling time zones: {{login_date}} stored in UTC, user in +07 ⇒ streak computed by UTC may differ from the user's perspective. Always convert to the user's time zone before computing.
- Using {{RANGE}} instead of {{ROWS}} (not applicable here since we do not use aggregate window functions, but remember {{ROWS}} if using SUM OVER).
- Large tables: need index {{(user_id, login_date)}}.

> Senior tip: this is a "do you know the pattern?" question. The quick answer: "Gaps and Islands — subtract row_number from the date to create a grouping key, then group by that key." If the interviewer asks "what if there are multiple logins per day?", answer immediately: "deduplicate dates before the window function." That shows you have actually solved this in production.`,
    follow: [
      'Why does {{login_date - row_number}} give the same value for consecutive days?',
      'How to find a "streak of at least 1 login per day for 7 days" (allowing one missed day)?'
    ],
  },
  'sql-008': {
    q: 'Table sales(sale_date, product_id, amount): pivot monthly revenue into columns (Jan, Feb... Dec) and compare year-over-year (YoY). Write a dynamic query that does not hard-code 12 columns.',
    a: `**Summary:** Pivot with {{SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = m THEN amount ELSE 0 END)}} for each month. A **dynamic pivot** (without hard-coding 12 columns) **is impossible in pure SQL** because SQL requires a fixed column list at compile time. Solutions: (1) write 12 explicit columns — sufficient for fixed reports, (2) use the {{crosstab}} extension (PostgreSQL) or dynamic SQL in a stored procedure, (3) best: pivot in the **application layer** (Java) after querying in long format.

### Explicit pivot (fixed 12 columns) — most common approach
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
Add the year to GROUP BY, then self-join or use a window function {{LAG}} on the year column:
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
Requires extension {{tablefunc}}: {{CREATE EXTENSION tablefunc;}}
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
-- product_id must be declared with the correct column type; list m1..m12 fully
~~~
- First query: data (row header, category, value).
- Second query: category list (1..12) — ensures all 12 columns exist even for months with no data.
- Drawback: the return type must be declared ({{AS ct(...)}}), so it is still not fully dynamic.

### Dynamic SQL in stored procedure
Build the SELECT string in PL/pgSQL then execute with {{EXECUTE}}. Only use when the client must receive a dynamic column schema (rare).

### The practical approach: pivot in Java
Query SQL only returns long-format data (product_id, year, month, amount) — compact, index-friendly, no hard-coding:
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
In Java: use {{Map<Integer, Map<Integer, BigDecimal>>}} or stream {{Collectors.groupingBy}} to pivot into a matrix, compute YoY, and fill 0 for missing months. Flexible, testable, independent of DB vendor.

### Production pitfalls
- Hard-coding 12 columns in SQL ⇒ every new year requires editing SQL, migration hassle.
- {{CASE WHEN}} without {{ELSE 0}}: SUM skips NULL so months with data are correct, but months with **no transactions** return NULL instead of 0 ⇒ later calculations (YoY %) become NULL. Always use {{ELSE 0}} or {{COALESCE}}.
- YoY comparison: a new product this year has no previous-year row ⇒ INNER JOIN drops the product; use LEFT JOIN and handle NULL previous values. For the current year not yet finished, future months = 0 — do not display "down 100%".
- Time zone: {{sale_date}} stored as UTC, extracting month by UTC can differ from the local month ⇒ convert time zone before extracting.

> Senior tip: when asked "how to do a dynamic pivot", the strong answer is: "SQL does not truly support dynamic pivot; I query in long format and pivot in Java. If forced to SQL, I use the crosstab extension or 12 explicit CASE WHEN columns." This shows you understand SQL limits and know how to separate responsibilities properly.`,
    follow: [
      'Why does SQL not support a truly dynamic pivot (columns unknown at compile time)?',
      'When should you use crosstab extension vs. pivoting in the application layer?'
    ],
  }
});
