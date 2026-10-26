/*
 * English translation of js/data/labs-sql.js — task T256. Format: js/core/i18n.js (content overlay).
 * ids: lab-sql-003
 */
App.i18n.content({
  'lab-sql-003': {
    title: 'Wallet transaction history: 101 SQL statements per request',
    scenario: `**Context.** The PayVN digital wallet operates the {{wallet-ledger}} service (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 on RDS, HikariCP 20 connections, {{spring.jpa.open-in-view=true}} default). The mobile app calls GET /api/v1/wallets/{walletId}/statements?limit=50 to draw the "Wallet transaction history" screen: each transaction must show the beneficiary's name and the cash-office name.

**Symptoms (14/03/2026, 08:00–09:00).** The endpoint p95 jumped from 340 ms to **2.4 seconds**, the 200 Tomcat threads ran dry, and the gateway returned 504 for ~8% of requests. The notable point: **none of the SQL queries are slow** — every query is under 25 ms — while RDS CPU climbed from 25% to 78%.

**Attempts that failed.** Raising the Hikari pool from 20 to 60 connections made things worse (more DB contention), turning on the Hibernate query cache (the 2nd-level cache that was off), and bumping the gateway timeout (it only hid the symptoms).

**What you have.** Three artifacts below: the Hibernate SQL log at 08:41, the {{pg_stat_statements}} figures summed over peak hours (OPS reset at 08:00 to start clean), and actuator metrics. Find the root cause and propose the fix.`,
    questions: [
      'What is happening with the SQL queries in the Hibernate log? Prove it using the specific line and the data ratio in artifacts 2 and 3.',
      'Why did increasing the connection pool and enabling the query cache not save the system?',
      'How will you fix it at the code layer, including the least effort approach, and what metrics/guardrails will you add so you detect N+1 next time?'
    ],
    hints: [
      'Count the number of SQL statements on the same HTTP thread http-nio-8080-exec-28 and compare it with the count on other threads.',
      'Compute the ratio: 13,878,612 statements / 137,412 query executions = 101 SQL statements per JPQL query; and 6,870,600 / 137,412 = 50 times per digest.',
      'This is N+1 due to lazy loading: Hibernate loads 50 transactions in one query, then for each transaction reloads beneficiary and cash_office. Solution: fetch join, @EntityGraph, @BatchSize or DTO projection.'
    ],
    answer: `**Summary:** This is an N+1 query bug caused by lazy loading: Hibernate loads 50 transactions in one query, then for each transaction reloads another 2 queries (beneficiary + cash_office) → **101 SQL statements per request**. None of the queries are slow (each under 25 ms), yet 137,412 requests/hour became 13.8 million SQL statements/hour; additionally, OSIV keeps the session open, so connections are held across the whole request: by Little's law, ~38 requests/second × ~1.8 seconds ≈ 69 requests needing a connection simultaneously while only 20 are available → requests queue for a connection, threads in Tomcat are held and run dry.

### Root cause
Entity {{WalletTransaction}} has two relationships {{@ManyToOne(fetch = FetchType.LAZY)}} to {{Beneficiary}} and {{CashOffice}} (the default of @ManyToOne is EAGER; the team correctly set LAZY per best practice but never defined an intentional fetch plan). The view returns JSON with the beneficiary name and cash-office name, so accessing those properties triggers lazy loading **inside the render loop** — each element of {{List<WalletTransaction>}} is a separate query.

Loop: **1 query gets the list + 50 × (1 query beneficiary + 1 query cash_office) = 101 queries**. This is the classic N+1 pattern: the number of queries grows linearly with the number of returned rows, and each query is very fast, so nobody notices it in the slow query log.

### Proof
- Artifact 1: on the **same thread {{http-nio-8080-exec-28}}**, after the query {{select ... from wallet_transaction ...}} there are repeated pairs of queries {{select b1_0... from beneficiary b1_0 where b1_0.id=?}} and {{select c1_0... from cash_office c1_0 where c1_0.id=?}}. Queries from {{exec-19}}, {{exec-31}}, {{exec-24}}, {{exec-7}} interleaved are **noise from other requests** — must filter by thread to see the loop. The last line of the request: **"-> 200 in 1812 ms (101 statements)"**.
- Artifact 2: the {{beneficiary}} digest has **calls = 6,870,600**, the {{cash_office}} digest **calls = 6,870,600**, while {{wallet_transaction}} has only **calls = 137,412**. The correct ratio is **50 : 50 : 1** — quantitative proof of N+1.
- Artifact 2: {{mean_exec_time}} of the two N+1 digests is only **0.332 ms** and **0.328 ms** (PK lookup), while the list-getting query is **21.578 ms**. None are slow → the problem is **not slow queries but too many queries**.
- Artifact 3: **hibernate.statements COUNT = 13,878,612** while **hibernate.query.executions COUNT = 137,412** → **101 SQL statements per JPQL query**; **hibernate.entities.loads = 20,611,800** ≈ 150 entities per request.
- Total execution time of the three digests in 1 hour: 2,281,153 + 2,255,957 + 2,964,901 = 7,502,011 ms, i.e. about **7,502 seconds of DB CPU** just to serve one endpoint. Note: {{mean_exec_time}} does **not** include parse/plan time — each query also costs ~0.1–0.2 ms CPU at the DB layer, so real CPU usage is higher than this figure.

### Why symptomatic fixes don't work
- **Increase pool Hikari to 60**: keeping more connections doesn't help because each request still sends 101 queries → total query volume stays the same, the DB burns hotter; with {{open-in-view=true}} connections are still held across the entire request lifecycle, so pressure only rises.
- **Enable Hibernate query cache**: the query cache stores result sets (list of IDs) for HQL/JPQL queries with the same query + parameters; the 100 lazy-load queries keyed on the main entity bypass the query cache and reach the entity cache (second-level cache), which is off. Moreover, the query cache returns IDs then still has to load every entity — without an L2 entity cache it's even worse.
- **Increase gateway timeout**: it only pushes the consequences (504) forward; the DB is still starved.

### Code-layer fixes
1. **Fetch join in JPQL** (you must list the associations to fetch inside {{JOIN FETCH}}):
~~~java
@Query("select t from WalletTransaction t " +
       "left join fetch t.beneficiary b " +     // left join: do not drop transactions missing the association
       "left join fetch t.cashOffice c " +      // cash_office_id may be null
       "where t.wallet.id = :walletId " +
       "order by t.createdAt desc")
List<WalletTransaction> findStatement(UUID walletId, Pageable pageable);
~~~
→ 1 SQL statement. Use **left** join fetch: an inner join would silently drop transactions with {{cash_office_id}} null. Add index {{(wallet_id, created_at desc)}} so the list query isn't sorted (mean 21.6 ms and ~230 buffers per call for 50 rows, suggesting this index is missing).
2. **{{@EntityGraph}}** if you want to keep {{findBy}}:
~~~java
@EntityGraph(attributePaths = { "beneficiary", "cashOffice" })
List<WalletTransaction> findByWalletId(UUID walletId, Pageable pageable);
~~~
3. **DTO projection** — select only the columns needed, no entity hydration, reduces bandwidth and memory:
~~~java
@Query("select new com.payvn.wallet.api.StatementRow(t.id, t.amount, t.createdAt, b.fullName, c.branchName) " +
       "from WalletTransaction t left join t.beneficiary b left join t.cashOffice c " +
       "where t.wallet.id = :walletId order by t.createdAt desc")
List<StatementRow> findStatementRows(UUID walletId, Pageable pageable);
~~~
4. **Batch fetching** when you don't want to touch the query: set {{hibernate.default_batch_fetch_size=50}} (global), or {{@BatchSize(size = 50)}} on the **class** {{Beneficiary}} and {{CashOffice}} (for to-one relations, @BatchSize goes on the entity, not the @ManyToOne field) → Hibernate merges unloaded proxies into {{where id in (...)}}: 3 queries instead of 101. This is the least effort approach but still 3 round-trips. ({{@Fetch(FetchMode.SUBSELECT)}} applies to collections only, not @ManyToOne.)
5. **Second-level cache** (Caffeine/Ehcache) for {{Beneficiary}}, {{CashOffice}} — reference data, rarely written; remember to configure invalidation.
6. **Disable OSIV**: {{spring.jpa.open-in-view=false}}, every query runs within {{@Transactional(readOnly = true)}} → connection returns to the pool sooner, no more "lazy load outside transaction" phenomenon, and avoids holding the connection across the whole request.
7. **Keyset pagination** instead of {{OFFSET}} for deep pages.

### Pitfall warnings
- {{JOIN FETCH}} combined with pagination is safe only when the relation is {{@ManyToOne}}/{{@OneToOne}}. If it's {{@OneToMany}}/{{@ManyToMany}}, Hibernate warns and paginates **in-memory** (Hibernate 5: HHH000104; Hibernate 6: HHH90003004 — read all results before cutting in memory) — in that case use batch fetch, {{@Fetch(SUBSELECT)}} or split into 2 queries (query 1 gets IDs by page, query 2 fetches by ID list).
- To-one fetch does not multiply row count (each transaction is still one row). It's only when fetching **collection** that SQL row count multiplies; Hibernate 6 deduplicates the root entities itself (no need for {{DISTINCT}} like Hibernate 5), though the data volume returned still grows.

### Prevention and monitoring
- Enable {{hibernate.generate_statistics=true}} + actuator metrics; **alert when the ratio hibernate.statements / hibernate.query.executions > 5** (this threshold catches N+1 before it reaches production).
- Enable {{logging.level.org.hibernate.SQL=DEBUG}} **only in staging/debug profile**, paired with {{generate_statistics}} to count.
- Use a proxy to count statements/requests ({{datasource-proxy}}, {{p6spy}}) in tests and staging.
- Regression test with {{@DataJpaTest}} + {{Statistics}}: assert that the number of statements per query never exceeds a constant, to block N+1 in CI.
- Review rule: every returned DTO with a relation must declare the clear fetch plan; don't default {{@OneToMany}} to {{LAZY}} and then call {{getXxx()}} in a loop.

> Senior tip: when investigating performance, remember the two axes: **"which query is slow"** and **"how many queries"**. Here none are slow, so looking at {{pg_stat_statements}} by {{calls}} shows culprits immediately. The ratio hibernate.statements / hibernate.query.executions = 101 is the simplest and most effective way to detect N+1 in CI — going from 1 query to 101 is a reliable sign, no need to read code. Lessons learned: don't optimize the query before counting it; 90% of ORM performance incidents are due to **number** of round-trips, not the latency of any single query.`,
    rubric: [
      'Correctly identified the N+1 bug: 1 query gets a list of 50 transactions + 50 lazy-loads of beneficiary + 50 lazy-loads of cash_office = 101 SQL statements per request',
      'Correct proof with data: the calls ratio 6,870,600 : 6,870,600 : 137,412 (50:50:1) in pg_stat_statements and hibernate.statements 13,878,612 / hibernate.query.executions 137,412 = 101',
      'Points out amplification factors: open-in-view holds session/connection, the real effect of mean_exec_time excludes parse/plan, and why increasing pool/enabling query cache doesn\'t solve it',
      'Proposed correct code-layer fixes: join fetch / @EntityGraph / DTO projection (and mention @BatchSize, @Fetch SUBSELECT, second-level cache as complementary options), disabling open-in-view, keyset pagination',
      'Has specific guardrails: alert on the hibernate.statements/hibernate.query.executions ratio, assert statement count in regression tests, review rule for fetch plan, and mention the HHH000104 risk when join fetch combines with collection pagination'
    ]
  }
});
