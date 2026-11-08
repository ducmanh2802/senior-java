/*
 * English translation of js/data/labs-sql.js — task T1009. Format: js/core/i18n.js (content overlay).
 * ids: lab-sql-011 lab-sql-012 lab-sql-013 lab-sql-014
 */
App.i18n.content({
  'lab-sql-011': {
    title: 'Deploying an added NOT NULL column hangs all APIs: AccessExclusiveLock and the lock queue',
    scenario: `**Context.** The FlashSale e-commerce platform runs {{order-service}} (Spring Boot 3.3, Hibernate 6.4, HikariCP 40 connections, PostgreSQL 15.6 on RDS, 8 vCPU / 64 GB). The {{orders}} table has **18.4 million** rows and is the hottest table in the system: every read/write order API goes through it, around 1,200 transactions/second during peak hours.

**Symptoms (15/03/2026, 14:02).** Deploying version v2.14.0 included the Flyway migration {{V47__add_payment_method_to_orders.sql}}. Within 90 seconds, **all** endpoints returned 504, RDS CPU stayed at 12% (not a CPU issue), the connection pool was exhausted, and application logs were flooded with {{HikariPool-1 - Connection is not available, request timed out after 30000ms}}. The DBA killed the migration and the system recovered within 30 seconds. The same migration was re-run at 02:00 with the same SQL, took **4 minutes**, and succeeded. No code changed between the two runs.

**What you have.** The Flyway log, a pg_stat_activity and pg_locks snapshot at 14:02:30, and the migration configuration. Find the root cause and a way to run the migration safely.`,
    questions: [
      'Why did the migration request an AccessExclusiveLock and get blocked, and why were 385 application queries that only needed an AccessShareLock also hung even though that lock was being granted?',
      'Why did the same SQL succeed in 4 minutes at 02:00, while at 14:00 it hung the entire system?',
      'How would you run this migration without blocking the system, and what guardrails would you add to prevent recurrence?',
    ],
    hints: [
      'PostgreSQL lock queues are FIFO: an AccessExclusiveLock that is waiting will block every new lock on the same relation, even weaker locks.',
      'ALTER TABLE ... ADD COLUMN ... NOT NULL DEFAULT in PostgreSQL 11+ does not rewrite the table (it only writes metadata), so it is fast by itself; the problem is acquiring the lock.',
      'Transaction 41121 is idle in transaction while holding a RowExclusiveLock: that is the lock holder.',
    ],
    answer: `**Summary:** The migration {{ALTER TABLE orders ADD COLUMN ... NOT NULL DEFAULT}} requires an **AccessExclusiveLock** on the {{orders}} table. An application transaction (41121) was {{idle in transaction}} while holding a **RowExclusiveLock** → the migration had to wait. PostgreSQL queues locks in **FIFO** order: every application query requesting an AccessShareLock after the migration is queued behind the waiting AccessExclusiveLock, so even weaker locks are blocked → the entire system hangs. Fix immediately with a short lock_timeout and retries; long term: split migrations into small steps, run outside peak hours, and monitor idle in transaction and statement_timeout.

### Background: table-level locks
PostgreSQL has several lock levels on a relation (table):
- **AccessShareLock**: SELECT (the weakest).
- **RowExclusiveLock**: INSERT/UPDATE/DELETE.
- **AccessExclusiveLock**: ALTER TABLE, DROP TABLE, VACUUM FULL (the strongest, not compatible with any other lock).

Two locks are compatible if both can be granted; AccessExclusiveLock is **not compatible** with any other lock → it needs the table to be free of locks.

### Root cause, step by step
1. At 14:00:00 the migration starts and requests an AccessExclusiveLock on {{orders}}.
2. Transaction 41121 ({{BEGIN; SELECT ... FOR UPDATE}}) is holding a RowExclusiveLock and is in the {{idle in transaction}} state (the application did not commit/rollback, e.g. a connection leak or waiting for user input).
3. The migration must wait for the RowExclusiveLock to be released → the AccessExclusiveLock remains {{granted = f}}.
4. PostgreSQL's lock queue is **FIFO**: application queries arriving after the migration that request an AccessShareLock must wait behind the pending AccessExclusiveLock, even though AccessShareLock is compatible with RowExclusiveLock.
5. As a result, **385 application queries** are blocked, the connection pool is exhausted, and all APIs hang. CPU is low because nothing is actually running.

### Evidence
- pg_locks: AccessExclusiveLock {{granted = f}} for the migration; RowExclusiveLock {{granted = t}} for transaction 41121; 385 AccessShareLocks {{granted = t}} but in the active/waiting state (queued).
- pg_stat_activity: 41121 {{idle in transaction}}, ClientRead.
- Flyway: "Unable to obtain exclusive lock on table orders".

### Why it succeeded at 02:00
Outside peak hours, no transaction was holding a lock, so the migration acquired the AccessExclusiveLock immediately. PostgreSQL 11+ implements {{ADD COLUMN ... NOT NULL DEFAULT}} by writing metadata only (no table rewrite), so it took only a few seconds. The problem was not the SQL itself but the **timing** and the **lock being held**.

### Fix
**Short term:**
- Set a {{lock_timeout}} for the migration role (e.g. 5 s): the migration fails fast instead of waiting forever; retry after the lock is released.
- Find and terminate the lock-holding transaction: {{SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' AND ...}}; or fix the code so it commits/rolls back promptly.
- Run migrations outside peak hours; do not deploy heavy migrations during peak hours.

**Long term:**
- Split the migration: add a nullable column first (metadata, fast), backfill in batches, then set NOT NULL + default afterward. Avoid {{ALTER TABLE ... ADD COLUMN ... NOT NULL DEFAULT}} on large hot tables during peak hours even though it does not rewrite.
- Use {{CREATE INDEX CONCURRENTLY}} (already present in the migration) and do not wrap it in a transaction (Flyway runs each migration in a transaction by default → CONCURRENTLY will fail; configure {{spring.flyway...}} or split the migration).
- Add {{statement_timeout}} and {{lock_timeout}} for the application role; monitor {{pg_stat_activity}} for {{idle in transaction}} state and connection leaks.
- Monitor the number of waiting locks: alert when {{pg_locks}} contains an AccessExclusiveLock with granted=f.

### Common mistakes
- Thinking the migration is slow because of a table rewrite: PostgreSQL 11+ ADD COLUMN DEFAULT does not rewrite.
- Killing the migration and re-running it immediately during peak hours: it will hang again.
- Wrapping CREATE INDEX CONCURRENTLY in a transaction: error "CREATE INDEX CONCURRENTLY cannot run inside a transaction block".

### 1-minute interview answer
"The migration ALTER TABLE needs an AccessExclusiveLock. An application transaction that was idle in transaction held a RowExclusiveLock, so the migration waited. The FIFO lock queue caused every AccessShareLock query arriving after it to be blocked as well, even though it is a weaker lock, so the entire system hung. Outside peak hours no transaction held the lock, so the migration was fast. I would set a short lock_timeout, split the migration (add nullable column → backfill → NOT NULL), run CONCURRENTLY outside a transaction, and monitor idle in transaction."

> Senior tip: On PostgreSQL, **a single waiting AccessExclusiveLock is a bottleneck that blocks everything**, including SELECT. Therefore DDL migrations on hot tables must always have a {{lock_timeout}} and run when the table holds the fewest locks. And {{idle in transaction}} is the number one enemy: a single connection leak can bring the whole system to a halt.`,
    rubric: [
      'Recognized that the migration needs an AccessExclusiveLock blocked by a RowExclusiveLock from an idle in transaction transaction',
      'Explained the FIFO lock queue mechanism that also blocks AccessShareLock queries',
      'Explained why it succeeded outside peak hours (no lock held) and why ADD COLUMN DEFAULT does not rewrite the table (PG 11+)',
      'Proposed fixes: lock_timeout, split migration, CREATE INDEX CONCURRENTLY outside a transaction, monitor idle in transaction',
    ],
  },

  'lab-sql-012': {
    title: 'Monthly report for a large department 100x slower: generic plan and stale statistics',
    scenario: `**Context.** FinBank's HRIS system runs {{payroll-report}} (Spring Boot 3.3, Spring Data JPA, pgjdbc, PostgreSQL 15.6). The {{salary_payment}} table has **24 million** rows with a highly skewed distribution by department: the "Retail" department (department_id = 3) accounts for **62%** (14.9 million rows), while the remaining 80 departments are each under 2% (about 115 thousand rows on average).

The "Monthly salary report" screen calls this parameterized SQL:
~~~sql
SELECT department_id, sum(amount) FROM salary_payment
WHERE department_id = $1 AND pay_month = $2
GROUP BY department_id;
~~~

**Symptoms.** After each pod restart, every department is fast (under 200 ms). About 5 minutes later, **only the Retail department** slows to 12–18 seconds, while other departments remain under 200 ms. The DBA copied the SQL into psql with department_id = 3: **180 ms**, cannot reproduce. Restarting the pod helps for 5 minutes, then it repeats.

**What you have.** The auto_explain log, psql experiment results, table statistics, and time-series metrics.`,
    questions: [
      'Why is production 14.8 seconds while psql is only 179 ms for the same department_id = 3? Explain custom plan / generic plan.',
      'Why was the generic plan chosen even though it Seq Scans the entire table, and why does the issue only appear a few minutes after restart?',
      'Propose short-term and long-term fixes; compare at least 3 options.',
    ],
    hints: [
      'Compare the production plan (Seq Scan, department_id = $1) with the psql literal (Index Scan on idx_salary_dept_month): the plan differs because the parameter was not substituted.',
      'The generic plan estimates the average: 24,000,000 / 81 ≈ 296,000 rows per department, while department 3 has 14.9 million.',
      'PostgreSQL switches to the generic plan after 5 EXECUTEs on each connection when the generic cost is not higher than the average custom plan cost.',
    ],
    answer: `**Summary:** Production runs the query as a prepared statement; after a few executions on each connection, PostgreSQL switches to a **generic plan** (a single plan shared across all {{$1}} values), optimized for the "average" department of ~296 thousand rows: a Seq Scan of the entire table. For the Retail department (14.9 million rows), this plan reads 496 thousand pages and takes 14.8 seconds. psql uses a literal, so it always gets a **custom plan** that sees the value 3 and chooses the {{idx_salary_dept_month}} index, 179 ms. Fix at the root with a partial index or the right index order so a single plan works well for every department; short term you can set {{plan_cache_mode = force_custom_plan}} for the application role.

### Background: prepared statements and the two plan types
Every SQL query goes through parse → rewrite → **plan** → execute. Planning takes time, so a prepared statement allows planning once and executing many times.

PostgreSQL has two plan types:
| | Custom plan | Generic plan |
|---|---|---|
| When | each EXECUTE, **knows** the parameter values | once, **does not know** the values |
| Estimate | uses MCVs: department 3 → 62% of the table | uses the average: 1 / n_distinct |
| Planning cost | every time | cached, nearly 0 |
| Risk | consumes planner CPU | badly wrong when data is skewed |

Default algorithm ({{plan_cache_mode = auto}}): the **first 5 EXECUTEs** always use a custom plan. From the 6th EXECUTE onward, PostgreSQL builds a generic plan and compares its estimated cost with the average cost of the 5 custom plans. If the generic plan is not meaningfully more expensive, it uses the generic plan forever for that prepared statement on that connection.

pgjdbc defaults {{prepareThreshold=5}}: the first 4 runs of a PreparedStatement execute as unnamed statements (always replanned like custom), and from the 5th run it creates a server-side named prepared statement.

### Root cause, step by step
1. After restart, 120 fresh connections, every query gets a custom plan → department 3 uses the {{idx_salary_dept_month}} index: reads only the department+month rows, fast.
2. Most calls are for small departments. A small-department custom plan: index scan of a few thousand rows, low cost.
3. After ~10 executions on a connection, PostgreSQL tries the generic plan: {{department_id = $1}} is estimated at **24,000,000 / 81 ≈ 296,000** rows (matching rows=9600 after multiplying by the pay_month selectivity). Cost 412, close to the average custom-plan cost of small departments → PostgreSQL chooses generic.
4. The next request for the Retail department lands on that connection: the generic plan Seq Scans the entire table, reads 14.9 million rows, filters pay_month, and takes 14.8 seconds.
5. Because each connection flips to generic on its own schedule, after ~5 minutes most of the 120 connections have "flipped", so the Retail department is slow for almost every request. A restart clears the plan cache → fast again, then it repeats.

### Evidence
- auto_explain: **"Filter: ((department_id = $1) AND ...)"** → the parameter was not substituted at plan time → generic plan. Estimate **rows=9600** vs actual **rows=14882312** (off by ~1500x).
- **"Buffers: shared hit=184220 read=312440"**, **"duration: 14821.309 ms"**.
- psql (1): literal 3 → **Index Scan using idx_salary_dept_month**, **178.91 ms**. psql (2): {{force_generic_plan}} reproduces **exactly** the production plan (cost 412.80, Seq Scan), while {{force_custom_plan}} restores the fast plan.
- Statistics: department 3 has freq **0.6201** in MCVs, n_distinct **81**; 24,000,000 / 81 = 296,296.
- Metrics: 09:05 restart, p99 for department 3 is 0.18 s; 09:10 jumps to 8.2 s; other departments unchanged.

### Fix
| Option | Pros | Cons |
|---|---|---|
| Index {{(department_id, pay_month)}} (already exists) + partial index {{WHERE department_id = 3}} | Good plan for the large department | Separate index for a large tenant, must manage |
| {{ALTER ROLE payroll SET plan_cache_mode = force_custom_plan}} | No deploy, effective for new connections | Every query pays planning cost each time, CPU rises |
| pgjdbc {{prepareThreshold=0}} | Never creates a named statement | Loses prepared-statement benefits for all queries |
| Partition data for the large department (partition by department) | Isolates the noisy neighbor | Large change, architectural shift |

**Short term (today):** set {{plan_cache_mode = force_custom_plan}} for the application role then rotate connections (Hikari softEvict or rolling restart) to apply it. At the same time add {{CREATE INDEX CONCURRENTLY idx_salary_large_dept_month ON salary_payment (pay_month) WHERE department_id = 3;}} so the large department gets its own small index.

**Long term:** index design rule for skewed data: **the leading column is the equality filter, followed by the range/sort column**; for large departments, consider a partial index. Monitor p99 by department (not just the system-wide average). Test performance with skewed data.

### Prevention
- auto_explain with {{log_parameter_max_length}} (PostgreSQL 16+) to see parameters; a sign of a generic plan is {{$1}} in the Index Cond.
- When reproducing in psql, **always also try PREPARE + force_generic_plan**, not just literals.
- A p99-by-department dashboard: the system-wide average hides department 3 being 14.8 seconds slow.

### Common mistakes
- "psql is fast but the app is slow → network/app issue": in reality the plans differ.
- Restarting to fix it: this only resets the plan cache; the problem returns after a few minutes.
- Thinking Hibernate "inlines" parameters: Hibernate always binds via PreparedStatement.

### 1-minute interview answer
"Production uses prepared statements. After about 10 executions on each connection, PostgreSQL switches to a generic plan because its estimated cost is comparable to the custom plan cost for small departments. The generic plan does not know department_id, so it estimates 296 thousand rows and does a Seq Scan of the entire table. For the Retail department with 14.9 million rows, that plan reads 496 thousand pages and takes 14.8 seconds. psql uses a literal, so it gets a custom plan that uses the index and is fast. I confirmed it with PREPARE and force_generic_plan. The root fix is a partial index for the large department; as a temporary measure, force_custom_plan for the application role."

> Senior tip: In systems with skewed data, **the "average" does not represent the largest group**, and the largest group is often the most important one (big customers, big departments). I always check {{most_common_freqs}} of the filter column; if any value is > 5% of the table, every query on that column must be designed so the plan **does not depend** on knowing the parameter value.`,
    rubric: [
      'Recognized that the production plan is a generic plan (department_id = $1) while psql with a literal is a custom plan; explained the mechanism of 5 custom plans then cost comparison, and pgjdbc prepareThreshold=5',
      'Calculated the estimate 24,000,000/81 ≈ 296,000 rows vs the actual 14,882,312 for department 3 (62% skew), citing Seq Scan, buffers, 14.8 s',
      'Explained why only the large department is affected and why the issue returns a few minutes after restart (plan cache per connection)',
      'Proposed a root fix with a partial index or a suitable index, plus the temporary force_custom_plan option and a trade-off assessment',
      'Described the correct reproduction method (PREPARE + plan_cache_mode) and monitoring by department',
    ],
  },

  'lab-sql-013': {
    title: 'Table bloat and queries slowing down because a long-running transaction blocks vacuum',
    scenario: `**Context.** The {{order-service}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 on RDS, 8 vCPU / 32 GB RAM) stores orders in the {{orders}} table. After 18 months the table has **12.4 million rows** (~3.2 GB heap, 1.1 GB indexes). Since the start of the week, p95 of SELECTs by {{order_id}} increased from 4 ms to **90 ms**, RDS CPU climbed from 20% to 65%, and disk usage grew by 400 MB/day with no new traffic. The DBA suspected "missing index" and started creating a new index, but p95 did not drop.

**Symptoms.** EXPLAIN shows the same plan and the same index, but the number of pages read doubled. {{pg_stat_user_tables}} reports {{n_dead_tup}} increasing continuously. There is an {{idle in transaction}} session that has been open for 6 hours.

**What you have.** The three artifacts below were taken from production. Point out why autovacuum cannot clean up dead tuples, why that bloats the table and slows queries, and propose a fix.`,
    questions: [
      'Why can autovacuum not remove dead tuples even though it is enabled and running continuously? Cite evidence from the artifacts.',
      'Why does table bloat slow queries even when the plan does not change?',
      'How would you handle this during the day and design a long-term solution to prevent recurrence?',
    ],
    hints: [
      'Find the "idle in transaction" session in pg_stat_activity: it holds xmin, blocking vacuum because dead tuples are still needed for that session\'s snapshot.',
      'n_dead_tup increasing + vacuum skipped because of lock conflict = autovacuum is being blocked.',
      'Xid age increasing → risk of wraparound; a vacuum freeze is needed.',
    ],
    answer: `**Summary:** An {{idle in transaction}} session holds an old snapshot, so autovacuum cannot remove dead tuples (they are still needed for that snapshot). Dead tuples accumulate and bloat the table → more pages → queries read more pages → they slow down over time. The increasing xid age also signals a risk of transaction ID wraparound.

### Root cause
1. An application session opened a transaction at 08:14 but has not COMMITted (state {{idle in transaction}}). It holds an {{xmin}} snapshot, so every dead tuple created after that is still "needed" for this session.
2. Autovacuum runs but is skipped due to lock conflicts (confirmed by logs). Dead tuples accumulate: n_dead_tup = 3,870,000 (31% of live rows).
3. The table bloats: the heap grows from ~2.2 GB to 3.2 GB. Queries read more pages → p95 rises even though the plan does not change.

### Evidence
- Artifact 1: n_dead_tup = 3,870,000, n_live_tup = 12,400,000, last_autovacuum = 03/04 (7 days earlier).
- Artifact 2: pid 18421 state idle in transaction, xact_start 08:14, xid age 42.1M.
- Artifact 3: vacuum skipped because of lock conflict; xid age warning.

### Short-term fix
- Terminate the idle in transaction session ({{pg_terminate_backend(18421)}}) after confirming it is no longer needed.
- Run VACUUM (FULL if necessary) outside peak hours to reclaim space.
- Enable {{idle_in_transaction_session_timeout}} (e.g. 5 minutes) to automatically kill stuck sessions.

### Long-term fix
- Fix the code: do not keep a transaction open across HTTP calls; use short {{@Transactional}} scopes, or split transactions.
- Enable monitoring: alert when n_dead_tup / n_live_tup > 20%, when idle in transaction > 5 minutes, when xid age > 1 billion.
- Tune autovacuum: lower autovacuum_vacuum_scale_factor for large tables, increase autovacuum_max_workers.

> Senior tip: dead tuples are not garbage immediately — they are needed for snapshots of running sessions. Therefore a transaction that "forgets to COMMIT" is vacuum's number one enemy. Always set idle_in_transaction_session_timeout and monitor pg_stat_activity.state = 'idle in transaction'.`,
    rubric: [
      'Correctly identified the root cause: an idle in transaction session holds a snapshot, blocking autovacuum from removing dead tuples',
      'Cited correct evidence: n_dead_tup 3.87M, vacuum skipped lock conflict, idle in transaction pid, xid age',
      'Correctly explained why bloat slows queries (more pages, same plan)',
      'Proposed correct fixes: terminate the session, VACUUM, idle_in_transaction_session_timeout, tune autovacuum',
      'Included monitoring/prevention: alert on n_dead_tup ratio, idle in transaction, xid age',
    ],
  },

  'lab-sql-014': {
    title: 'N+1 revealed in pg_stat_statements: SELECT by id runs 2 million times/hour',
    scenario: `**Context.** The {{product-catalog}} service (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6) serves the API GET /api/v1/products/{id} and the list GET /api/v1/categories/{id}/products. pg_stat_statements shows a {{SELECT ... FROM category WHERE id = $1}} query running **2,100,000 times/hour** even though actual traffic is only ~30,000 requests/hour. RDS CPU is 70%, p95 is 180 ms.

**What you have.** Three artifacts: top pg_stat_statements, Hibernate log, and entity code. Find the N+1 cause and propose a fix.`,
    questions: [
      'Why does a SELECT by id run 2 million times/hour even though traffic is only 30k requests/hour? Cite evidence.',
      'Why does increasing the connection pool not help and CPU remains high?',
      'In what ways would you fix the code and what guardrails would you add to detect N+1?',
    ],
    hints: [
      'Count the number of SELECT-by-id queries in the log for a single request that lists 50 products.',
      'Lazy loading inside a stream map: each p.getCategory() triggers a SELECT by id.',
      'Solutions: fetch join, @EntityGraph, @BatchSize, or DTO projection.',
    ],
    answer: `**Summary:** This is an N+1 caused by lazy loading: the list of 50 products is fetched with 1 query, then for each product {{p.getCategory().getName()}} is called inside the stream map, triggering 50 SELECT category by id queries. 30,000 requests/hour × 50 = 1.5M extra queries, consistent with 2.1M calls/hour. No single query is slow (0.2 ms) but total DB time increases and CPU is high.

### Root cause
The {{Product}} entity has {{@ManyToOne(fetch = FetchType.LAZY) private Category category}}. The service maps to DTOs and accesses {{p.getCategory().getName()}} inside the stream → Hibernate lazy-loads Category for each product. OSIV keeps the session open, so lazy loading works in the controller.

### Evidence
- Artifact 1: calls = 2,100,000/hour, digest SELECT category WHERE id=$1, mean 0.2 ms, all cache hits.
- Artifact 2: the log shows that after the product list query, there are 50 SELECT category WHERE id=? queries (one per product), totaling 51 queries for a single request returning 50 products.
- Artifact 3: the CategoryService.listByCategory code calls p.getCategory().getName() inside the stream map.

### Fix
1. Fetch join: {{SELECT p FROM Product p JOIN FETCH p.category WHERE p.category.id = :id}}.
2. @EntityGraph(attributePaths = "category") on the repository method.
3. @BatchSize(size = 50) on the association to batch into 1 IN (...) query instead of 50.
4. DTO projection: query directly into a record/DTO, without loading entities.

### Prevention
- Enable hibernate.generate_statistics and track statements per request.
- Use spring.jpa.open-in-view=false to detect lazy loading outside a transaction (it will throw LazyInitializationException).
- Code review: do not access lazy associations in stream/map operations outside a transaction.

> Senior tip: N+1 is hard to spot because each query is very fast; only pg_stat_statements reveals the total calls. Rule: always check the number of SQL statements per request by enabling show_sql or using datasource-proxy, and disable OSIV in production.`,
    rubric: [
      'Correctly identified the root cause: lazy loading inside a stream map causing N+1',
      'Cited correct evidence: calls 2.1M/hour, log showing 50 SELECT-by-id queries, code calling p.getCategory().getName()',
      'Proposed correct fixes: fetch join, @EntityGraph, @BatchSize, DTO projection',
      'Understood the impact of OSIV and how to disable it to detect the issue',
      'Included monitoring/guardrails: statistics, datasource-proxy, code review',
    ],
  },
});