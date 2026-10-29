/*
 * English translation of js/data/lessons-sql.js — task T459. Format: js/core/i18n.js (content overlay).
 * ids: lesson-sql-003
 */
App.i18n.content({
  'lesson-sql-003': {
    title: 'Window functions: ROW_NUMBER, RANK and running totals, implemented yourself in Java',
    goals: [
      'Explain the three parts of a window: {{PARTITION BY}}, {{ORDER BY}}, the frame, and what the default frame is',
      'Tell {{ROW_NUMBER}}, {{RANK}} and {{DENSE_RANK}} apart when values are equal',
      'Implement {{ROW_NUMBER}} and a running total yourself in Java (sort + single pass) and avoid leaking state between groups',
    ],
    body: `### How a window function differs from GROUP BY
{{GROUP BY}} **collapses** many rows into one: 1,000 transactions of 10 customers become 10 total rows. A window function **keeps every row** and attaches one extra value computed over a "window" of related rows: each transaction still exists, together with its sequence number within the customer's history, or the cumulative balance up to that point.

~~~sql
SELECT customer_id, created_at, amount,
       ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at) AS seq,
       SUM(amount)  OVER (PARTITION BY customer_id ORDER BY created_at, id
                          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM transaction;
~~~

The three parts inside {{OVER (...)}}:
- **PARTITION BY**: splits the data into independent groups (one group per customer). Without it, the whole table is a single group.
- **ORDER BY**: the order of the rows **inside** each group.
- **Frame**: for aggregate functions such as {{SUM}}, {{AVG}}, the frame says which rows are added relative to the current row. Ranking functions ({{ROW_NUMBER}}, {{RANK}}) **ignore the frame**.

PostgreSQL has had window functions for a long time; MySQL has them from 8.0. Window functions are computed **after** WHERE, GROUP BY, HAVING and **before** the final ORDER BY and LIMIT. Consequence: you cannot write {{WHERE rn <= 3}} at the same level where {{rn}} is defined; you must wrap it in a subquery or a CTE.

### ROW_NUMBER, RANK, DENSE_RANK: how they differ on ties
Example salaries in one department (sorted descending): 100, 100, 90, 80.

| salary | ROW_NUMBER | RANK | DENSE_RANK |
|---|---|---|---|
| 100 | 1 | 1 | 1 |
| 100 | 2 | 1 | 1 |
| 90 | 3 | 3 | 2 |
| 80 | 4 | 4 | 3 |

- {{ROW_NUMBER}}: always 1, 2, 3, … with no repeats. When two rows tie, which one gets the smaller number is **undefined** if ORDER BY is not discriminating enough; add a unique column ({{id}}) to ORDER BY if you need a stable result.
- {{RANK}}: tied rows share a rank, and the next rank **skips ahead** (1, 1, 3).
- {{DENSE_RANK}}: tied rows share a rank, with **no skip** (1, 1, 2). "Second highest salary" usually needs DENSE_RANK = 2.

### The default frame: the trap in running totals
When there is an ORDER BY but no frame is written, the SQL standard uses the default {{RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW}}. **RANGE** treats rows with the same ORDER BY value as "peers" and adds **all of them** at once.

~~~text
date        amount   SUM default (RANGE)   SUM with ROWS
2024-05-01  100      300                    100
2024-05-01  200      300                    300
2024-05-02  50       350                    350
~~~

Two transactions on the same day both get a running balance of 300 under the default, which makes the statement look wrong. To add **one row at a time**, write out {{ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW}} and add {{id}} to ORDER BY so the order is deterministic. With no ORDER BY inside OVER, the frame is the **whole group**: {{SUM(amount) OVER (PARTITION BY customer_id)}} returns the customer's total on every row.

### How the DB computes a window function
In a PostgreSQL plan you will see a {{WindowAgg}} node sitting on top of a {{Sort}} node (sorted by PARTITION BY then ORDER BY), or on top of an {{Index Scan}} if an index already provides that order. Once the order exists, WindowAgg only has to **make a single pass**, keeping a little state (the current sequence number, the current sum) and resetting it when it moves to a new group. The main cost is the sort step, O(n log n); an index on {{(customer_id, created_at)}} removes this step.

The exercise below does exactly that in Java: sort, then make one pass.

> Real-world pitfall: computing a running total in Java by, for each row, re-walking the list from the start and adding up the rows before it. That is O(n²): 10,000 rows take a few tens of milliseconds, 500,000 rows take several minutes. The right way is to sort once and accumulate: O(n log n) for the sort, O(n) for the accumulation.

> Senior tip: the "top-N per group" problem ({{WHERE rn <= 3}} outside a subquery) used to force PostgreSQL to compute ROW_NUMBER for **every** row before filtering. Since PG 15, the planner recognizes the {{rn <= 3}} condition and stops early within each group (the plan shows {{Run Condition}}). With few groups and a very large table, an even faster approach is {{CROSS JOIN LATERAL (... ORDER BY ... LIMIT 3)}} per group, exploiting an index on {{(group_id, sort_col)}}. Note: never put {{LIMIT}} inside the subquery that contains ROW_NUMBER to "optimize", because then you take the top-N of the **whole table**, not per group.

### Interview notes
Common questions: "Get the second largest transaction of each customer", "compute a running balance for a bank statement", "the difference between RANK and DENSE_RANK". A good answer states: which ranking function to choose when there are ties, that the default frame is RANGE and why a statement should use ROWS, that you add a tie-breaker for a stable result, and which index removes the sort step. If you are asked how to do it without window functions (MySQL 5.7), you can mention a self-join or a correlated subquery, but you must say clearly that they are O(n²) per group.`,
    exercises: [
      {
        title: 'Implement ROW_NUMBER and a running total yourself',
        prompt: `{{Row}} is provided: {{group}} (String) and {{value}} (int). Write a {{WindowEngine}} class that simulates:

~~~sql
ROW_NUMBER() OVER (PARTITION BY grp ORDER BY value)
SUM(value)   OVER (PARTITION BY grp ORDER BY value ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
~~~

- {{rowNumber(rows)}} returns {{List<Integer>}}, {{runningTotal(rows)}} returns {{List<Long>}}.
- Just like SQL, the result is attached to **each input row**: element {{i}} of the result is the value for {{rows.get(i)}}. The input order may be shuffled and groups may be interleaved.
- Within a group, sort by {{value}} ascending. For two rows in **the same group with the same value**, the one that appears earlier in the input list comes first (this is the ROWS semantics: add one row at a time).
- **Do not modify** the input list (it may be an immutable list such as {{List.of}}).
- Use {{long}} for the total because it can exceed {{Integer.MAX_VALUE}}.`,
        hints: [
          'Do not sort the {{rows}} list itself; sort a list of **indices** {{0..n-1}} by {{(group, value)}}. That way you neither modify the input nor lose track of where to write each result in the original positions.',
          "Java's {{List.sort}} is a stable sort: equal elements keep their original order, which is exactly what the tie requirement needs.",
          'Walk in sorted order; when {{group}} differs from the previous group, reset the counter/sum to 0, then write {{out[i]}} where {{i}} is the original index.',
        ],
        explain: `### Idea
This is exactly what {{WindowAgg}} does: **sort by (PARTITION BY, ORDER BY), then make a single pass** with a small amount of state. The trick is to sort **indices** instead of rows: the input list is never touched, and once we compute the value for the row at index {{i}}, we write it straight into {{out[i]}}. The result therefore lines up with the input, just like SQL returning one extra column for every row.

### Common mistakes
- **Forgetting to reset on a new group**: group B's total carries over from group A. The test with interleaved groups catches this.
- **Returning the result in sorted order** instead of input order: the numbers are right but attached to the wrong rows.
- **Calling {{rows.sort(...)}} directly**: it mutates the caller's data and throws {{UnsupportedOperationException}} if the input is {{List.of(...)}}.
- **Using {{int}} for the total**: 3,000 × 1,000,000 exceeds {{Integer.MAX_VALUE}} (about 2.1 billion) and silently overflows to a negative number.
- **O(n²) running total**: re-adding all the preceding rows for every row. Correct but disastrously slow on large data.

### Relation to SQL
Two tied rows ({{G 10}}, {{G 10}}) yield 10 then 20 because this exercise uses **ROWS** semantics. If you write {{SUM(value) OVER (PARTITION BY grp ORDER BY value)}} without a frame, SQL uses **RANGE** and both rows receive 20. In production, if the data already sits in the database, let the DB compute the window function (close to the data, with indexes); implementing it yourself in Java only makes sense when the data comes from another source such as a file or a Kafka stream.`,
      },
    ],
    check: [
      {
        q: 'Salaries in one department (descending): 100, 100, 90. What does {{RANK() OVER (ORDER BY salary DESC)}} return for the 90 row?',
        options: ['2', '3', '1', 'NULL'],
        explain: `**3 is correct**: RANK gives both 100 rows rank 1, then **skips** rank 2, so the 90 row is rank 3. **2** is the {{DENSE_RANK}} result (no skip); {{ROW_NUMBER}} also yields 3, but only because it numbers continuously 1, 2, 3. **1** is wrong because 90 is lower than 100, so it cannot share the rank. **NULL** is wrong because ranking functions always return a number for every row.`,
      },
      {
        q: 'When you write a running total with a loop over data that has several groups, what is the most common mistake?',
        options: ['Forgetting to sort the list with a stream instead of a loop', 'Forgetting to reset the total to 0 when a new group starts', 'Using ArrayList instead of LinkedList', 'Not using ConcurrentHashMap'],
        explain: `**Option 2 is correct**: without a reset, the next group's total also accumulates the previous group, and this bug is hard to spot when the test has only one group. **Option 1** is wrong: sorting with a stream or with {{List.sort}} produces the same order; what matters is that you **do** sort. **Option 3** is wrong: the type of list does not affect correctness. **Option 4** is wrong: the problem runs on a single thread; ConcurrentHashMap does not help, and a running total is inherently order-dependent, so it cannot be summed in parallel arbitrarily.`,
      },
      {
        q: 'Two transactions on the same day, 100 and 200. What does {{SUM(amount) OVER (ORDER BY tx_date)}} (no frame written) return for those two rows, if the total before that day was 0?',
        options: ['100 and 300', '300 and 300', '100 and 200', 'The whole-table total for every row'],
        explain: `**300 and 300 is correct**: with an ORDER BY and no frame, the default is {{RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW}}; two rows with the same {{tx_date}} are peers and are added at the same time. **100 and 300** is the result of a {{ROWS}} frame (one row at a time); for that you must write ROWS explicitly. **100 and 200** are just the per-row values, not a cumulative total. **The whole-table total** is the behavior when there is **no** ORDER BY inside OVER (the frame is the whole group).`,
      },
    ],
  },
});
