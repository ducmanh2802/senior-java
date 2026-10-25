/*
 * English translation of js/data/q-sql.js — task T183. Format: js/core/i18n.js (content overlay).
 * ids: sql-009 sql-010 sql-011 sql-012 sql-013 sql-014 sql-015 sql-016
 */
App.i18n.content({
  'sql-009': {
    q: 'Table category(id, name, parent_id): unlimited-depth category tree. Find all descendant categories (all levels) of a given category. Write the query using Recursive CTE. What if the tree has a cycle?',
    a: `**Summary:** Use **Recursive CTE** ({{WITH RECURSIVE}}): the **anchor** selects the root node, the **recursive** part joins back on {{parent_id = id}} to traverse downward. PostgreSQL/MySQL 8+ use {{WITH RECURSIVE}}; Oracle 11gR2+ and SQL Server use {{WITH}} (without the RECURSIVE keyword). Guard against cycles with the {{CYCLE}} clause (PostgreSQL 14+) or a {{path}} column checking if {{id}} has already appeared.`,
    follow: [
      'Why use UNION ALL instead of UNION in a Recursive CTE?',
      'How to find the "shortest path" between two nodes in a tree (not just find all descendants)?'
    ]
  },
  'sql-010': {
    q: 'Upsert (INSERT if not exists, UPDATE if exists) a record into table account_balance(account_id, currency, balance, updated_at) with unique key (account_id, currency). Write the statement for PostgreSQL (ON CONFLICT) and Oracle (MERGE). Explain the race condition when manually writing SELECT → INSERT/UPDATE.',
    a: `**Summary:** Upsert with a single statement at the DB: PostgreSQL {{INSERT … ON CONFLICT (account_id, currency) DO UPDATE …}}, Oracle {{MERGE INTO … USING … ON (…) WHEN MATCHED THEN UPDATE … WHEN NOT MATCHED THEN INSERT …}}. Writing {{SELECT}} to check existence then {{INSERT}}/{{UPDATE}} **has a race condition**: two threads both see "not exists" → both INSERT → unique violation or data inconsistency.`,
    follow: [
      'Why does ON CONFLICT require a unique index/constraint and not accept just a CHECK constraint?',
      'When should you use "INSERT … ON CONFLICT DO NOTHING" instead of DO UPDATE?'
    ]
  },
  'sql-011': {
    q: 'In SQL, NULL does not equal NULL. Explain COUNT(*) vs COUNT(col) vs COUNT(DISTINCT col) when the column has NULL. Why does SUM(col) return NULL instead of 0 when all values are NULL? Where does ORDER BY … ASC/DESC place NULL?',
    a: `**Summary:** NULL = "unknown/no value" – not equal to any value, including NULL. {{COUNT(*)}} counts **all rows**; {{COUNT(col)}} counts only rows where **col IS NOT NULL**; {{COUNT(DISTINCT col)}} counts **distinct** values (excluding NULL). {{SUM}}/{{AVG}} skip NULL but return **NULL** if **all** rows are NULL (no value to compute). PostgreSQL/Oracle treat NULL as **largest** ({{ASC}} → NULL last, {{DESC}} → NULL first); MySQL/SQL Server treat NULL as **smallest** ({{ASC}} → NULL first, {{DESC}} → NULL last) – always specify {{NULLS FIRST/LAST}} on DBs that support it.`,
    follow: [
      'Why is SUM of an empty set NULL instead of 0?',
      'How to index for WHERE col IS NULL queries on PostgreSQL?'
    ]
  },
  'sql-012': {
    q: 'Compare DELETE vs TRUNCATE vs DROP. When to use which? View vs Materialized View: how do they differ, how to refresh, and what are the trade-offs?',
    a: `**Summary:** {{DELETE}}: removes rows, supports WHERE, writes WAL/redo, triggers fire, can rollback, slow. {{TRUNCATE}}: removes **entire** table, no WHERE, minimal WAL, no triggers, **cannot rollback** (except PostgreSQL inside a transaction), fast. {{DROP}}: removes table **structure** (schema, indexes, constraints, grants), data gone. {{View}}: virtual query, executes real-time, stores no data. {{Materialized View}}: stores snapshot, needs {{REFRESH}}, fast reads but data may be stale.`,
    follow: [
      'Does TRUNCATE reset identity/sequence on PostgreSQL, MySQL, and Oracle?',
      'How to incrementally refresh a Materialized View on PostgreSQL?'
    ]
  },
  'sql-013': {
    q: 'Detect anomalous transactions: amount greater than 3× the 30-day rolling average of **that specific customer**. Table transaction(id, customer_id, amount, created_at). Write the query using CTE + window function.',
    a: `**Summary:** Use a CTE to compute {{avg_30d}} per transaction: window {{AVG(amount) OVER (PARTITION BY customer_id ORDER BY created_at RANGE BETWEEN INTERVAL '30 days' PRECEDING AND INTERVAL '1 day' PRECEDING)}}. Then filter {{amount > 3 * avg_30d}}. Note: {{RANGE}} with offset requires exactly one ORDER BY column of numeric/date/timestamp type; PostgreSQL supports {{INTERVAL}} offset in frame from version 11.`,
    follow: [
      'Why use RANGE INTERVAL instead of ROWS 30 PRECEDING?',
      'How to compute z-score instead of a simple ratio?'
    ]
  },
  'sql-014': {
    q: 'Write a query to filter transactions for March 2026 correctly. Explain why not to use WHERE MONTH(created_at) = 3, why not BETWEEN, and why you must use "half-open" (>= start AND < end). How does timezone affect this?',
    a: `**Summary:** Correct way: {{WHERE created_at >= TIMESTAMPTZ '2026-03-01 00:00:00+07' AND created_at < TIMESTAMPTZ '2026-04-01 00:00:00+07'}}. **Do not** use {{MONTH(created_at) = 3}} (cannot use index, wrong timezone), **do not** use {{BETWEEN}} (inclusive upper bound misses/overlaps milliseconds). **Half-open** [start, end) is standard: includes start, excludes end. Timezone: {{created_at}} stored as UTC, convert to user timezone ({{AT TIME ZONE}}) **before** comparing, or use literal {{TIMESTAMPTZ}} with offset.`,
    follow: [
      "Why does BETWEEN '2026-03-01' AND '2026-03-31' lose data?",
      'How to create a functional index for WHERE DATE(created_at) = ? on PostgreSQL?'
    ]
  },
  'sql-015': {
    q: 'You run {{EXPLAIN (ANALYZE, BUFFERS)}} on an order-filtering query and get plan showing {{Seq Scan on orders}} with line {{Rows Removed by Filter: 19980000}}, while elsewhere you see {{Index Only Scan}}. Explain the plan: what each line tells, when {{Seq Scan}} is the right choice, and how {{Index Only Scan}} differs from {{Index Scan}}.',
    a: `**Summary:** {{EXPLAIN}} prints a **tree of nodes**, executed bottom-up; each node has two lines: cost/rows/width (planner estimate) and actual time/rows (measured at runtime). {{Seq Scan}} reads entire table sequentially; {{Index Scan}} seeks via index then fetches row from heap; {{Index Only Scan}} reads only the index. Line {{Rows Removed by Filter: X}} = rows **read then discarded** ⇒ large X means "read almost the whole table to return a few rows".`,
    follow: [
      'Why can Index Only Scan still read the heap ({{Heap Fetches}} > 0)?',
      'When would you decide **not** to add an index even though the plan shows {{Seq Scan}}?'
    ]
  },
  'sql-016': {
    q: 'Two systems export orders into {{staging_order_a}} and {{staging_order_b}} with the same key {{order_id}}. You need to reconcile and split into exactly 4 groups: matched, only in A, only in B, present in both but **amount differs**. How to write the query, why is {{FULL OUTER JOIN}} more convenient than two anti-joins, and when to use {{EXCEPT}}?',
    a: `**Summary:** {{FULL OUTER JOIN}} both tables on the key, {{COALESCE}} the two keys back together (missing side becomes NULL) then classify with {{CASE}} – all **4 groups in a single scan**. Two anti-joins only give the two "missing" groups; to compare values you'd need another join.`,
    follow: [
      'How is {{FULL OUTER JOIN}} executed (hash join) on large data?',
      'If staging has hundreds of millions of rows, how to reconcile in batches?'
    ]
  }
});