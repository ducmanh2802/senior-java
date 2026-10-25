/*
 * English translation of js/data/q-spring-data.js — task T179. Format: js/core/i18n.js (content overlay).
 * ids: db-016 db-017 db-018 db-019 spring-022 spring-023 spring-024 spring-025 spring-026
 */
App.i18n.content({
  'db-016': {
    q: `You added a read replica to offload reads, but customers report "I just transferred money but don't see the transaction." How do you measure replication lag, what causes it, and how do you solve read-your-writes in Spring?`,
    a: `**Summary:** A read replica only receives changes after they **commit** on the primary and must **replay** the WAL to reflect them. The time gap between commit on primary and data visibility on the replica is **replication lag** – it is the root cause of "can't read what I just wrote." In PostgreSQL, lag is measured by the {{replay_lsn}} column in {{pg_stat_replication}} compared to {{pg_current_wal_lsn()}}. Read-your-writes solutions: **read from primary after write**, **wait for replica to catch up** (by LSN), **read from the cache** you just wrote, or **check the row version** on read.
 
 ### How to measure replica lag
 ~~~sql
 -- Measure byte lag between primary and replica
 SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn, replay_lsn,
        pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS replay_lag_bytes,
        write_lag, flush_lag, replay_lag
 FROM pg_stat_replication;
 ~~~
 - **Byte lag** (WAL bytes not yet replayed) is the most reliable metric because it does not depend on clocks.
 - **Time lag** ({{replay_lag}}) is easily misinterpreted: it measures time on the **primary** from when WAL was locally flushed until the standby reported it replayed – not the estimated time to drain the remaining lag. When the primary has no new writes, this value may stay constant or become NULL. On the replica you can also check {{now() - pg_last_xact_replay_timestamp()}} (depends on both machines' clocks).
 
 ### Why replicas lag
 1. **Primary writes too much**: every transaction generates WAL; replica must receive and replay via I/O.
 2. **Replica is weaker than primary**: CPU/I/O on replica cannot keep up with replay.
 3. **Network**: bandwidth or latency between regions.
 4. **Replay blocked by long-running queries on replica**: when a long {{SELECT}} reads an old page, WAL replay for that page is delayed to preserve snapshot isolation.
 5. **Heavy operations on primary** ({{VACUUM}}, {{REINDEX}}, {{CREATE INDEX}}, bulk update) generate WAL bursts the replica must replay (replica does not run its own {{VACUUM}}/{{REINDEX}}).
 6. **Large tables, index bloat** slow down WAL apply.
 
 ### Four ways to solve read-your-writes
 1. **Read from primary after write** (sticky read): simplest. Systems handling sensitive data (balance, transaction status) should almost **always** read from primary.
 2. **Wait for replica to catch up**: after write, poll replica state until lag is below a threshold (e.g., 100ms), then read. Suitable when latency is acceptable and you need to read "large" data.
 3. **Read from the cache you just wrote**: write the result to Redis/Caffeine with short TTL, prefer cache on read. Works for **idempotent, stable** data (catalogs).
 4. **Write the version**: add a {{version}} column, read from replica with {{WHERE version >= version_just_written}}, retry until visible.
 
 ### Routing reads/writes in Spring
 Spring has no built-in read-replica routing; you must build it with {{AbstractRoutingDataSource}} (technical details covered in the {{readOnly}} question):
 - {{determineCurrentLookupKey()}} checks {{TransactionSynchronizationManager.isCurrentTransactionReadOnly()}}: true → replica, false → primary.
 - Must wrap with {{LazyConnectionDataSourceProxy}} so the connection is opened **after** routing is decided.
 - Need **separate pools** for primary and replica – they are two different systems.
 - If a single transaction both reads and writes and you switch routing mid-transaction, you end up with two different connections in the same transaction.
 - With JPA, every query must run inside a transaction for the read-only flag to take effect.
 
 ### Why banking systems must limit replica reads
 - Balance, limits, and transaction status are decision-critical data – reading a stale version could allow spending over the limit.
 - Stale reads from replica can violate reconciliation, financial reporting, and regulatory retention requirements.
 - Practical rule: **only reference data** (catalogs, fee parameters) reads from replica; anything involving financial decisions reads from primary.
 
 ### Pitfall production
 - **Failover can lose data**: promoting a replica to primary loses transactions that committed but had not yet replicated ⇒ RPO != 0.
 - **App cache populated from replica** will hold stale data ⇒ must account for this when designing TTL and invalidation.
 - **Two connection pools** ⇒ total app connections increase; replica has its own {{max_connections}} (and for hot standby it must not be smaller than primary); recalculate sizing for both.
 - **Reports running on replica** can generate heavy load that increases lag, indirectly affecting user reads as well.
 
 > Senior tip: treat **replication lag as an SLO with alerting**. The threshold should follow business impact: if the business accepts data up to 1 second old, alert when lag exceeds 1 second. Have an **automatic fallback to primary**, because a system that reads from a replica without a safety net will manifest incidents as "customer can't see their transaction" – which is very hard to diagnose.`,
    follow: [
      'Why can WAL replay on the replica be blocked by a long-running SELECT?',
      'How do you reliably measure replication lag when the clocks of the two machines differ?'
    ],
  },
  'db-017': {
    q: `You need a report showing running balance and top-3 largest transactions per customer. How do window functions solve this, and what traps cause incorrect results?`,
    a: `**Summary:** Window functions compute a value **over a set of rows** (partition) **without collapsing them**, so each original row is preserved. Three common uses: **running balance** using {{SUM(...) OVER (PARTITION BY ... ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)}}, **ranking** with {{RANK}}/{{DENSE_RANK}}/{{ROW_NUMBER}}, and **top-N per group** using {{ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)}} then filtering in an outer query. The biggest traps: choosing the wrong **frame** and forgetting a **tie-breaker** in {{ORDER BY}}.
 
 ### Running balance
 ~~~sql
 SELECT t.account_id,
        t.created_at,
        t.amount,
        SUM(t.amount) OVER (
            PARTITION BY t.account_id
            ORDER BY t.created_at, t.id          -- id as tie-breaker
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS running_balance
 FROM transaction t
 WHERE t.created_at >= '2026-01-01'
 ORDER BY t.account_id, t.created_at, t.id;
 ~~~
 - {{PARTITION BY}} splits data into independent groups: each customer gets their own running balance.
 - {{ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW}} means "sum from the start of the partition up to the current row."
 
 ### Why {{ROWS}} not {{RANGE}}
 - With {{ROWS}}, each row is a distinct unit. If two rows share the same {{created_at}}, they are still accumulated sequentially.
 - With {{RANGE}}, rows with **identical ORDER BY values** are grouped and all receive the **same** running total.
 - The **default** frame when {{ORDER BY}} is present but no frame is specified is {{RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW}}.
 
 ### Ranking
 | Function | Result for values 100, 100, 80 |
 |---|---|
 | {{ROW_NUMBER()}} | 1, 2, 3 (always sequential, ignores ties) |
 | {{RANK()}} | 1, 1, 3 (skips numbers on ties) |
 | {{DENSE_RANK()}} | 1, 1, 2 (no gaps) |
 | {{NTILE(4)}} | divides partition into 4 roughly equal buckets, used for value-based segmentation |
 
 ### Top-N per group
 ~~~sql
 WITH ranked AS (
     SELECT t.*,
            ROW_NUMBER() OVER (PARTITION BY t.account_id ORDER BY t.amount DESC, t.id) AS rn
     FROM transaction t
     WHERE t.created_at >= '2026-01-01'
 )
 SELECT * FROM ranked WHERE rn <= 3 ORDER BY account_id, amount DESC;
 ~~~
 - **Must wrap in a CTE/subquery** before filtering, because window functions **cannot** be used in the {{WHERE}} clause of the same query level.
 - PostgreSQL also has {{DISTINCT ON}}, often faster but **only returns top-1** per group, and the {{DISTINCT ON}} expressions must match the leading columns of {{ORDER BY}}.
 - If you need "3 largest transactions **and ties at the boundary**" use {{RANK()}} instead of {{ROW_NUMBER()}} – two transactions with the same amount could consume all 3 slots.
 
 ### Other useful functions
 - {{LAG(amount) OVER (ORDER BY created_at)}} and {{LEAD}}: compare with the immediately preceding/following transaction (growth vs. prior period).
 - {{FIRST_VALUE}}/{{LAST_VALUE}}: note {{LAST_VALUE}} defaults to the current frame's value, so you must declare {{ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING}} to get the true last value.
 - {{EXCLUDE CURRENT ROW}} (PostgreSQL 11+), {{EXCLUDE GROUP}}, {{EXCLUDE TIES}}: exclude the current row from the frame – very handy for "compare with the immediately previous transaction."
 
 ### Pitfall production
 - **Window functions cannot be used in {{WHERE}} at the same level** – must use a subquery. This is the most common syntax error.
 - **Missing tie-breaker** ⇒ results are non-deterministic across runs, and running balance may compute incorrectly.
 - **Performance**: window functions require data sorted by {{PARTITION BY}} + {{ORDER BY}}; without a suitable index, the whole set must be sorted ⇒ memory and I/O cost (spill when exceeding {{work_mem}}).
 - **Filter first, compute later**: {{WHERE}} runs before the window function, so {{WHERE created_at >= ...}} means only qualifying rows participate ⇒ the running balance in the example **misses the opening balance**. You must add the opening balance, or compute over the full history then filter in the outer query.
 
 > Senior tip: when writing reports with window functions, always add a **tie-breaker** to {{ORDER BY}} and **explicitly choose the frame** ({{ROWS ...}} instead of the default).`,
    follow: [
      'Why does {{SUM(x) OVER (ORDER BY y)}} compute a running total while {{SUM(x) OVER ()}} gives the table-wide total?',
      'When should you use {{RANK()}} instead of {{ROW_NUMBER()}} in a top-N report?'
    ],
  },
  'db-018': {
    q: `Another team proposes putting interest calculation and fee logic into database stored procedures. How do you evaluate the trade-offs, and when should logic move to the Java layer instead of staying in the DB?`,
    a: `**Summary:** Stored procedures run **inside the DB**, access data directly, and reduce network round-trips – efficient for bulk operations. But the cost is **testability, versioning, code review, and operations** all become significantly worse. Practical rule for banking systems: **keep business logic in Java**, reserve procedures for **bulk data operations** that don't need unit testing (aggregations, purging old data, recomputing totals).
 
 ### Pros
 - **Batch performance**: a single call processes millions of rows without shipping data to the application.
 - **Fewer round-trips**: multi-step logic runs inside the DB instead of each step being a network round-trip.
 - **Centralized rules**: rules live near the data, easy to enforce for all access paths.
 - **Security**: can grant {{EXECUTE}} on the procedure without granting direct table write permissions.
 
 ### Cons
 - **Hard to test**: frameworks like pgTAP (PostgreSQL) or utPLSQL (Oracle) exist but few teams use them; hard to mock, must run against a real DB.
 - **Hard to review**: SQL procedure diffs are harder to read than Java code; changes are harder to trace for impact.
 - **Hard to version**: must manage via Flyway/Liquibase; multiple environments drift easily.
 - **DB lock-in**: PL/pgSQL and PL/SQL differ; migrating between PostgreSQL and Oracle means rewriting.
 - **Logic hidden from the app**: Java code readers don't see the business rules executing.
 - **Does not scale**: logic running in the DB cannot scale out when you shard, and cannot be reused for other channels.
 - **Security**: concatenating parameters in procedures is a SQL injection vector.
 
 ### When to keep logic in the DB
 | Situation | Keep in DB |
 |---|---|
 | Purge tens of millions of old rows | Yes |
 | Re-aggregate data from multiple tables | Yes |
 | Business rules that change per product/customization | **No** |
 | Logic needing unit tests and high coverage | **No** |
 | Logic reused across channels (API, batch, worker) | **No** |
 
 ### Example of a well-written procedure
 ~~~sql
 CREATE OR REPLACE FUNCTION recalc_daily_balance(p_account bigint, p_day date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY INVOKER            -- default: runs with caller's privileges
 SET search_path = public, pg_temp
 AS $fn$
 BEGIN
     UPDATE account_balance
        SET balance = sub.total
       FROM (SELECT account_id, sum(amount) AS total
               FROM transaction_entry
              WHERE account_id = p_account
                AND posted_on <= p_day
              GROUP BY account_id) AS sub
      WHERE account_balance.account_id = p_account;
 END;
 $fn$;
 ~~~
 Noteworthy safety point: always set {{SET search_path}} explicitly. When {{search_path}} includes a user-writable schema, an attacker could create a function with the same name that gets called instead – with {{SECURITY DEFINER}} this risk is even more severe.
 
 ### When to move logic to Java
 1. **Business rules** (fees, interest rates by product, approval conditions) – change frequently, need tests, need audit trail of who changed what and when.
 2. **Need to integrate with other systems** (call payment gateway, send notifications) – DB cannot do this.
 3. **Need reuse** across multiple processing channels (sync API, batch job, message consumer).
 4. **Need scale** when splitting DB into multiple shards – DB logic does not shard with it.
 5. **Need observability**: metrics, traces, logs with context.
 
 Recommended process if you must use procedures:
 - Manage via **Flyway/Liquibase** alongside other migrations – never edit manually on production.
 - **Test against a real DB** (use transaction + rollback for each test case).
 - Document clearly at the top of the procedure: purpose, parameters, side effects, owner.
 - **Version by name**: create a new function (e.g., {{recalc_daily_balance_v2}}) and make the old one call the new one, so you have a rollback path.
 - Limit privileges: grant {{EXECUTE}} to the app role, not table write access.
 - **Timeout and resource limits** for long-running procedures.
 
 ### Pitfall production
 - **Procedure calling procedure** creates dependency chains that are hard to trace and test.
 - **No explicit transaction boundaries** between steps in a procedure makes retry semantics ambiguous – must define whether the procedure is idempotent.
 - **Logic hidden in DB** doesn't appear in code review ⇒ a single wrong change can affect millions of rows without anyone noticing.
 - **{{EXECUTE}} grants** on procedures can be overly broad; apply the principle of least privilege.
 - **When migrating from 1 DB to many**, DB logic does not scale ⇒ must rewrite. This is a strong reason to put logic in Java from the start.
 
 > Senior tip: the question to ask yourself is: "**If this logic lives in the DB, who will write its tests, and will those tests run in the application team's CI?**" If the answer is "no," that's a strong signal the procedure will become "ghost logic" – no one dares touch it, no one understands it, and incidents will be blamed on "a stored procedure bug" while the real cause is lack of tests and ownership.`,
    follow: [
      'When does moving logic to the Java layer actually make the system slower?',
      'How do you manage versioning and rollback for stored procedures in production?'
    ],
  },
  'db-019': {
    q: `You need to recover data to the exact moment before a wrong DELETE ran. How does PITR work, what role does WAL archiving play, and how do you choose RPO/RTO for a transactional system?`,
    a: `**Summary:** **PITR** (Point-In-Time Recovery) is the ability to restore a database to **any arbitrary point in the past**, not just to the time of a backup. Mechanism: **base backup** + **continuous WAL archive** (every change after the backup). On restore, PostgreSQL reads the base backup then replays archived WAL files until {{recovery_target_time}} is reached, then stops. **RPO** determines WAL archival frequency; **RTO** determines HA architecture. The non-negotiable rule: **a backup that has never been restored is not a backup**.
 
 ### Backup types
 | Type | Content | Pros | Cons |
 |---|---|---|---|
 | Physical ({{pg_basebackup}}, disk snapshot) | File-level copy at a point in time | Fast restore, foundation for PITR | Restores whole cluster only, same major version |
 | Physical + WAL archive | Base backup + all WAL after | **Enables PITR** | Must manage WAL storage, monitor archiving |
 | Logical ({{pg_dump}}) | Data as SQL statements | Readable, inspectable, table-selective | Slow for large DBs, no PITR |
 
 With PostgreSQL, {{pg_basebackup}} creates a **physical backup** suitable for PITR, runs online without downtime.
 
 ### WAL archiving
 ~~~sql
 -- primary: continuously ship WAL to archive storage
 ALTER SYSTEM SET archive_mode = on;           -- requires RESTART to take effect
 ALTER SYSTEM SET archive_command = 'aws s3 cp %p s3://my-backup/wal/%f';
 ALTER SYSTEM SET archive_timeout = '60s';     -- force WAL segment switch at most every 60s
 SELECT pg_reload_conf();                      -- applies archive_command/archive_timeout
 ~~~
 On production, use a dedicated tool (pgBackRest, WAL-G, Barman) instead of a custom copy command: they handle retries, compression, integrity checks, and retention.
 - Every committed change goes to WAL. If WAL is archived **continuously**, you can recover to any point where the WAL file still exists.
 - **RPO = maximum time a committed transaction might not yet be archived**. Archive lag of 5 minutes ⇒ max RPO of 5 minutes. Note a WAL segment (default 16MB) is only archived when full, so during low write volume you must set {{archive_timeout}} to bound RPO.
 - The archive store must be **separate, with versioning/object lock** to prevent accidental deletion or ransomware encryption.
 - If you lose the archive ⇒ you cannot recover to points around that gap. So you must **monitor** archive lag and **alert** when it exceeds the threshold.
 
 ### Restoring to a point in time
 ~~~bash
 # 1. Place base backup into data directory
 # 2. Create recovery.signal file
 touch $PGDATA/recovery.signal
 
 # 3. Configure in postgresql.conf
 restore_command = 'aws s3 cp s3://my-backup/wal/%f %p'
 recovery_target_time = '2026-03-15 09:20:00+07'
 recovery_target_action = 'promote'      # pause (default) | shutdown | promote
 ~~~
 - Target parameters: {{recovery_target_time}} (by timestamp), {{recovery_target_xid}} (by transaction id), {{recovery_target_lsn}} (by WAL byte position), {{recovery_target_name}} (by a restore point you created).
 - {{recovery_target_action = 'promote'}} makes the server accept read-write after reaching the target; {{'shutdown'}} stops it so you can inspect before putting it into service.
 - You can also set a **restore point** with {{pg_create_restore_point('name')}} before a risky operation, to later recover exactly to that moment.
 
 ### Choosing RPO and RTO
 | Requirement | RPO | RTO | Required architecture |
 |---|---|---|---|
 | Lose ≤1 hour data, recover in 8 hours | 1 hour | 8 hours | Nightly backup + WAL archive |
 | Lose ≤5 minutes, recover in 1 hour | 5 minutes | 1 hour | Continuous WAL archive + standby |
 | Lose ≈0, recover in 15 minutes | ≈0 | 15 minutes | **Synchronous replication** to another region + automated failover |
 
 - Low RPO ⇒ continuous WAL shipping (higher bandwidth, I/O, storage costs).
 - Low RTO ⇒ need a **ready-to-go replica** (warm standby) to fail over in minutes, plus automation (e.g., Patroni for PostgreSQL) and regular failover drills.
 - On AWS RDS: automated backup with PITR (max 35-day retention), read replicas, Multi-AZ are built in. RDS manages WAL so you cannot configure {{archive_command}} – instead rely on RDS PITR, AWS Backup, and cross-region/account snapshot copies.
 
 ### Testing restores
 This is the most skipped step and also the most dangerous:
 - **Periodically** (at least quarterly) restore a backup to an isolated environment, measure **actual restore time**, and update your committed RTO.
 - Verify the backup is **not corrupted** and can be **decrypted** (if encrypted) using the exact offline key.
 - Record metrics: backup size, backup duration, restore duration, measured RPO.
 
 ### Pitfall production
 - **Backup in the same account/region as the DB** ⇒ an infrastructure incident deletes both.
 - **Never test restore** ⇒ you only discover the backup is broken when you need it most.
 - **Backup and WAL version mismatch**: after a major version upgrade, an old base backup cannot replay new WAL ⇒ must create a fresh base backup immediately after upgrade.
 - **Delete permissions on the backup store**: insider risk or ransomware. Use **object lock (WORM)**, versioning, and a separate access key not used by the application.
 - **Only backing up the DB without WAL archive** ⇒ no PITR, only "restore to last night."
 - **Losing the backup encryption key** (or storing it only on the same system that failed) ⇒ cannot restore.
 
 > Senior tip: communicate with stakeholders in **numbers**, not jargon: "If the disk dies at 10:05, we lose at most 5 minutes of transactions and need 20 minutes to rebuild from the latest backup." Many orgs claim "zero data loss" RPO while actually doing nightly backups with no WAL archive – that's not PITR, that's losing a day of data.`,
    follow: [
      'How do RPO and RTO differ, and which one drives the HA architecture?',
      'How do you design a periodic backup restore test process?'
    ],
  },
  'spring-022': {
    q: `What is the difference between {{@Component}}, {{@Service}}, {{@Repository}}, {{@Controller}}? What extra capability does {{@Repository}} add for exceptions?`,
    a: `**Summary:** All four are **stereotype annotations** for Spring component scan to discover beans; technically they are **aliases** of {{@Component}} and behave identically. The difference is purely **semantic**: {{@Component}} generic, {{@Service}} business layer, {{@Repository}} data layer, {{@Controller}} web layer. The key point: {{@Repository}} enables **exception translation** – Hibernate/JPA exceptions (unchecked) are wrapped into Spring's {{DataAccessException}} hierarchy so upper layers can catch them without depending on JPA.
 
 ### Comparison
 | Annotation | Layer | Use case |
 |---|---|---|
 | {{@Component}} | Generic | Utility, config, shared bean |
 | {{@Service}} | Business logic | Orchestration, transaction boundary |
 | {{@Repository}} | Data access | JPA repo, custom DAO, **exception translation** |
 | {{@Controller}} | Web MVC | {{@RequestMapping}}, returns view (Thymeleaf) |
 | {{@RestController}} | Web REST | {{@Controller}} + {{@ResponseBody}} |
 
 ### Exception translation by {{@Repository}}
 When a bean is annotated with {{@Repository}}, Spring registers a {{PersistenceExceptionTranslationPostProcessor}} that automatically wraps JPA/Hibernate exceptions ({{NoResultException}}, {{OptimisticLockException}}, Hibernate's {{ConstraintViolationException}}…) into subclasses of {{DataAccessException}} ({{EmptyResultDataAccessException}}, {{OptimisticLockingFailureException}}, {{DataIntegrityViolationException}}…). Spring Boot auto-registers this post-processor; plain Spring requires manual bean declaration. This lets services catch {{DataAccessException}} instead of importing JPA exceptions.
 
 ~~~java
 @Repository
 public class JpaOrderRepository implements OrderRepository {
     // getSingleResult() throws NoResultException -> Spring translates to EmptyResultDataAccessException
 }
 
 @Service
 public class OrderService {
     public Order get(Long id) {
         try { return repo.findById(id).orElseThrow(() -> new OrderNotFoundException(id)); }
         catch (DataAccessException ex) { throw new RepositoryException("DB error", ex); }
     }
 }
 ~~~
 
 ### Pitfall production
 - Using {{@Component}} for everything loses architectural meaning – reviewers can't tell which bean is a service, repo, or controller.
 - Forgetting {{@Repository}} on a custom DAO ⇒ JPA exceptions leak into the service layer, coupling it to JPA.
 - {{@Controller}} used for REST API returns a view name instead of JSON – must use {{@RestController}} or add {{@ResponseBody}}.
 
 > Senior tip: simple review rule: **any bean that touches the DB must have {{@Repository}}**. If the team uses Spring Data JPA interfaces, those are already proxied with {{@Repository}} implicitly, but custom DAO classes must add it manually.`,
    follow: [
      "Why doesn't Spring merge {{@Service}} and {{@Repository}} into a single annotation?",
      "How do you enable exception translation for a bean that doesn't use {{@Repository}}?"
    ],
  },
  'spring-023': {
    q: `How do {{@Bean}} and {{@Component}} differ? What does {{@Configuration}}'s {{proxyBeanMethods}} do, and when should you turn it off?`,
    a: `**Summary:** {{@Component}} uses **component scan** for Spring to auto-discover and register the bean; {{@Bean}} is used inside a {{@Configuration}} class to **manually declare a bean** – typically for third-party libraries, objects you don't own, or when creation logic is complex. {{@Configuration(proxyBeanMethods = true)}} (default) creates a CGLIB proxy for the config class so that calling a {{@Bean}} method multiple times still returns the **same instance** (singleton scope). Turn off {{proxyBeanMethods = false}} when the config class **does not call other {{@Bean}} methods** – this reduces proxy overhead and allows the class to be final.
 
 ### Comparison
 | Aspect | {{@Component}} | {{@Bean}} |
 |---|---|---|
 | Registration | Component scan (auto) | Explicit declaration in {{@Configuration}} |
 | Use for | Classes you write and control | Third-party libs, complex creation logic, multiple instances |
 | Scope | Singleton by default, change via {{@Scope}} | Singleton by default, change via {{@Scope}} on method |
 | Multiple instances | Hard (needs {{@Qualifier}}) | Easy: write multiple {{@Bean}} methods with different names |
 
 ### What is {{proxyBeanMethods}}
 When a {{@Configuration}} class has a {{@Bean}} method A calling another {{@Bean}} method B:
 ~~~java
 @Configuration
 public class AppConfig {
     @Bean
     DataSource dataSource() { return new HikariDataSource(); }
 
     @Bean
     JdbcTemplate jdbcTemplate() { return new JdbcTemplate(dataSource()); } // calls dataSource()
 }
 ~~~
 If {{proxyBeanMethods = true}} (default), Spring wraps the class in a CGLIB proxy. When {{dataSource()}} is called, the proxy checks the context: is there already a {{DataSource}} bean? If yes, return that bean instead of running the method body again ⇒ **singleton is preserved**. If {{false}}, {{dataSource()}} executes its body ⇒ creates a **new** {{DataSource}} every call ⇒ violates singleton.
 
 ### When to turn it off
 - Config class **does not** call other {{@Bean}} methods (no cross-method calls).
 - You want the config class to be final (CGLIB cannot proxy a final class).
 - Slightly faster startup (no proxy creation).
 
 ~~~java
 @Configuration(proxyBeanMethods = false)  // "lite" mode
 public class LiteConfig {
     @Bean DataSource dataSource() { ... }  // does not call other beans
     @Bean JdbcTemplate jdbcTemplate(DataSource ds) { return new JdbcTemplate(ds); } // inject via parameter
 }
 ~~~
 Spring Boot 3.x encourages **lite mode** ({{proxyBeanMethods = false}}) with parameter injection instead of calling other bean methods.
 
 ### Pitfall production
 - Turning off {{proxyBeanMethods}} while still calling other {{@Bean}} methods ⇒ duplicate instances, broken singleton, connection pool doubled.
 - Using {{@Bean}} for a class you own that could use {{@Component}} ⇒ more verbose, component scan won't see it, easy to forget to declare.
 
 > Senior tip: default to {{@Component}} for your own classes; only use {{@Bean}} when forced (library, complex instantiation). With {{@Configuration}}, use {{proxyBeanMethods = false}} and inject via parameters – that's the modern Spring Boot 3 style.`,
    follow: [
      'Why does Spring Boot 3 recommend {{proxyBeanMethods = false}}?',
      'If a class has {{@Configuration(proxyBeanMethods = false)}} but still calls another {{@Bean}} method, what happens?'
    ],
  },
  'spring-024': {
    q: `When multiple beans share the same type, how does {{@Autowired}} resolve them? How do {{@Qualifier}}, {{@Primary}}, and injecting {{List}}/{{Map}} work?`,
    a: `**Summary:** When multiple beans of the same type exist, Spring defaults to **throwing** {{NoUniqueBeanDefinitionException}}. Three ways to resolve: (1) {{@Primary}} on the preferred bean – auto-selected when no qualifier is present; (2) {{@Qualifier("beanName")}} at the injection point – explicitly picks a specific bean; (3) inject **{{List<Type>}}** or **{{Map<String, Type>}}** – receives **all** beans of that type (including non-primary ones), map key is the bean name. {{@Qualifier}} has higher priority than {{@Primary}}.
 
 ### Resolution mechanics
 1. If **exactly one** bean of type T exists → inject it.
 2. If multiple beans of type T exist:
    - Injection point has {{@Qualifier}} → use matching bean.
    - No qualifier, but a {{@Primary}} bean exists → use primary (then highest {{@Priority}} if multiple).
    - Still ambiguous → Spring tries to match **parameter/field name to bean name** (Spring Boot compiles with {{-parameters}}).
    - Nothing matches → **error** {{NoUniqueBeanDefinitionException}} at startup.
 
 ### {{@Primary}} vs {{@Qualifier}}
 ~~~java
 @Configuration
 public class PaymentConfig {
     @Bean @Primary
     PaymentGateway vnpayGateway() { return new VNPayGateway(); }
 
     @Bean
     PaymentGateway momoGateway() { return new MoMoGateway(); }
 }
 
 @Service
 public class PaymentService {
     private final PaymentGateway gateway;           // auto-injects vnpayGateway (primary)
     private final PaymentGateway momoGateway;       // gets momoGateway via @Qualifier
 
     public PaymentService(PaymentGateway gateway,
                           @Qualifier("momoGateway") PaymentGateway momo) {
         this.gateway = gateway;
         this.momoGateway = momo;
     }
 }
 ~~~
 
 ### Injecting List and Map
 ~~~java
 @Service
 public class NotificationDispatcher {
     private final List<Notifier> notifiers;                    // all beans implementing Notifier
     private final Map<String, Notifier> notifierByName;        // key = bean name
 
     public NotificationDispatcher(List<Notifier> notifiers, Map<String, Notifier> byName) {
         this.notifiers = notifiers;
         this.notifierByName = byName;
     }
 
     public void sendAll(String msg) {
         notifiers.forEach(n -> n.notify(msg));
     }
 }
 ~~~
 - {{List}} ordered by {{@Order}}/{{Ordered}}/{{@Priority}}, then registration order if none; {{Map}} key is bean name (class name with lowercase first letter, or {{@Bean}} method name).
 - {{@Primary}} bean **is still included in List/Map** – not excluded.
 - This pattern is used for **strategy pattern** or **chain of responsibility** (e.g., list of validators, processors).
 
 ### Pitfall production
 - Using {{@Qualifier}} with hardcoded strings is typo-prone – define constants or put {{@Qualifier}} on the bean definition.
 - Forgetting {{@Primary}} when adding a second implementation for an existing interface ⇒ all injection points for that interface break with {{NoUniqueBeanDefinitionException}} at startup (not a compile error).
 - Injecting {{Map}} but forgetting key is bean name (not qualifier) ⇒ lookup fails.
 
 > Senior tip: in review, if an interface has 2+ implementations, ask: "Which bean is the default (primary)?" If there's no primary and no qualifier at every injection point, the code will break when a new implementation is added.`,
    follow: [
      "Why doesn't Spring just pick the first bean alphabetically instead of throwing an ambiguity error?",
      "When injecting {{Map<String, T>}}, what key does the {{@Primary}} bean have?"
    ],
  },
  'spring-025': {
    q: `What annotations does {{@SpringBootApplication}} combine? What is a Spring Boot starter, and how does it differ from plain Spring?`,
    a: `**Summary:** {{@SpringBootApplication}} combines 3 core annotations: {{@SpringBootConfiguration}} (marks config class, enables {{@Bean}}), {{@EnableAutoConfiguration}} (activates auto-configuration – Boot's "magic"), and {{@ComponentScan}} (scans components from the main class's package). A **starter** is a Maven/Gradle dependency that bundles a curated set of libraries for a task (web, data-jpa, security…) plus auto-configuration – the difference from plain Spring is **no manual bean declarations, version management, or transitive dependency wiring**.
 
 ### Three annotations in {{@SpringBootApplication}}
 | Annotation | Role |
 |---|---|
 | {{@SpringBootConfiguration}} | Like {{@Configuration}}, allows {{@Bean}}; Boot uses it to find the main class |
 | {{@EnableAutoConfiguration}} | Reads {{META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports}}, loads auto-configs conditionally |
 | {{@ComponentScan}} | Scans {{@Component}}, {{@Service}}, {{@Repository}}, {{@Controller}} from the main class's package downward |
 
 Can be used separately:
 ~~~java
 @SpringBootConfiguration
 @EnableAutoConfiguration
 @ComponentScan("com.acme")
 public class MyApp { }
 ~~~
 
 ### Spring Boot Starter
 A starter is a **dependency descriptor** (mostly just a POM) that bundles the libraries needed for a task; versions are managed by the {{spring-boot-dependencies}} BOM, and auto-configuration lives in {{spring-boot-autoconfigure}} activated by classpath conditions:
 - **spring-boot-starter-web**: Tomcat, Spring MVC, Jackson (validation requires separate {{spring-boot-starter-validation}} from Boot 2.3).
 - **spring-boot-starter-data-jpa**: Hibernate, Spring Data JPA, HikariCP, transaction.
 - **spring-boot-starter-security**: Spring Security (OAuth2 resource server is a separate starter {{spring-boot-starter-oauth2-resource-server}}).
 
 Library versions are managed by Boot's BOM and tested for compatibility – reduces version conflicts.
 
 ### Difference from plain Spring
 | Aspect | Plain Spring (XML/Java config) | Spring Boot |
 |---|---|---|
 | Bean declarations | Write {{@Bean}}, {{@ComponentScan}}, {{@EnableTransactionManagement}}... | Auto-configuration does it |
 | Dependency versions | Manage {{{<version>}} in pom manually | Starter + BOM manage versions |
 | Run | Deploy WAR to Tomcat/JBoss | **Fat JAR** with embedded Tomcat/Jetty/Undertow, run {{java -jar}} |
 | Config | {{web.xml}}, {{applicationContext.xml}}, property files | {{application.yml}}, externalized config, profiles |
 | Health/Metrics | Build yourself | Actuator ready |
 
 ### Pitfall production
 - **Over-scanning**: {{@ComponentScan}} without a base package scans from the declaring class's package down; if the main class sits in a too-broad package (e.g., {{com}}) or the default package, it scans libraries too ⇒ slow startup, junk beans. Place the main class in your app's root package.
 - **Disable unneeded auto-config**: {{@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)}} when no DB is used.
 - **Starter pulling unwanted deps**: having both {{starter-web}} and {{starter-webflux}} makes Boot pick Spring MVC (servlet), WebFlux only remains as a client – for fully reactive, drop {{starter-web}}. Check dependency tree: {{mvn dependency:tree}}.
 
 > Senior tip: treat {{@SpringBootApplication}} as the **application entry point** – its package defines the component scan boundary. In multi-module projects, keep the main class in the root module scanning only that module; sub-modules use their own {{@ComponentScan}} or export beans via {{@Bean}}.`,
    follow: [
      'Why does Spring Boot use a fat JAR instead of a WAR deployed to an external server?',
      'How do you find out which dependencies a starter pulls and what versions they are?'
    ],
  },
  'spring-026': {
    q: `{{@Transactional}}: default rollback only on unchecked exceptions. How do you use {{rollbackFor}}, and how does a try-catch that "swallows" the exception break the transaction?`,
    a: `**Summary:** By default {{@Transactional}} only rolls back on **unchecked exceptions** ({{RuntimeException}}, {{Error}}). Checked exceptions ({{IOException}}, {{SQLException}}, custom checked exceptions) will **commit** the transaction unless you declare {{rollbackFor}}. The most dangerous trap: **catching the exception and not rethrowing** (swallowing) – the transaction commits normally even though business logic failed.
 
 ### Rollback rules
 | Exception type | Default | To rollback, declare |
 |---|---|---|
 | {{RuntimeException}}, {{Error}} | Rollback | — |
 | Checked exception | **Commit** | {{@Transactional(rollbackFor = Exception.class)}} |
 | {{SQLException}} | **Commit** (checked) – but often translated by Spring to {{DataAccessException}} (unchecked) | {{rollbackFor}} if you rethrow it yourself |
  | JPA {{PersistenceException}}, {{DataAccessException}} | Rollback (unchecked) | — |
 
 ~~~java
 @Transactional(rollbackFor = Exception.class)
 public void importFile(InputStream in) throws IOException {
     // IOException is checked -> needs rollbackFor to rollback
     parseAndSave(in);
 }
 ~~~
 
 ### Try-catch that swallows the exception
 ~~~java
 @Transactional
 public void transfer(Account from, Account to, BigDecimal amount) {
     try {
         from.debit(amount);
         to.credit(amount);
     } catch (InsufficientFundsException e) {
         log.warn("Insufficient funds");  // SWALLOWS EXCEPTION - NO rethrow
         // Transaction STILL COMMITS because no exception escaped!
     }
 }
 ~~~
 Fix: **rethrow** or wrap in a {{RuntimeException}}:
 ~~~java
 catch (InsufficientFundsException e) {
     throw new TransferFailedException(e);  // unchecked -> rollback
 }
 ~~~
 
 ### Pitfall production
 - **Checked exception without {{rollbackFor}}** ⇒ partial data commits (e.g., file import fails halfway but first half is saved).
 - **Catch, log, and don't throw** is the most common bug – code review must catch this: every {{catch}} inside a {{@Transactional}} method must {{throw}}.
 - Conversely: if an exception is thrown from a **different bean's** {{@Transactional}} method (REQUIRED, joined transaction) and caught in the outer method, the transaction is already marked rollback-only ⇒ commit throws {{UnexpectedRollbackException}}. Swallowing the exception does not "save" the transaction.
 - {{@Transactional}} on {{private}}, {{final}}, {{static}} methods **has no effect** (not proxyable) – Spring silently ignores it.
 - Place {{@Transactional}} at the **service layer**, not controller or repository.
 
 > Senior tip: mandatory code review rule: **a method with {{@Transactional}} must not have a try-catch that doesn't rethrow**. If you catch to handle, wrap in an unchecked exception and throw again. Also, enable DEBUG logging for {{org.springframework.transaction}} when debugging transactions.`,
    follow: [
      'Why does Spring default to not rolling back on checked exceptions?',
      'How do you spot a {{@Transactional}} method that swallows an exception during code review?'
    ],
  },
});