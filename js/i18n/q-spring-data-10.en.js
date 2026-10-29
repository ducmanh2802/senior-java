/*
 * English translation of js/data/q-spring-data.js — task T375. Format: js/core/i18n.js (content overlay).
 * ids: spring-034 spring-035 spring-036 spring-037 spring-038 jpa-028 jpa-029 db-031
 */
App.i18n.content({
  "spring-034": {
    q: "The service failed to boot during the latest deployment: logs stopped at Flyway, one instance reported \"Flyway validate failed\", and the remaining pods did not become ready. How does Flyway acquire the schema lock when two instances boot simultaneously, why does a heavy migration block the entire rollout, and how would you handle it?",
    a: `**Summary:** Flyway requires an exclusive schema lock before migrating/validating: the first instance acquires the lock, while others wait for the configured number of retries before failing, causing pods to fail to boot. Heavy migrations (e.g., CREATE INDEX on a large table) hold the lock for a long time, stalling the rollout. Short-term fix: increase lock retries; long-term: perform migration in a separate step before the new app receives traffic.

### Flyway schema lock
Flyway doesn't just read the {{flyway_schema_history}} table and run SQL. Before migrating, it must ensure that only one instance interacts with the database, thus requiring a schema lock (mechanism varies by DB: metadata lock, separate lock table, or advisory lock). The second instance must wait for the lock; the parameter {{lockRetryCount}} - configured via {{spring.flyway.lock-retry-count}} in Boot 3 - defines the number of attempts before failing. The default is usually too low, causing waiting instances to fail before the migration completes. Logs often show "could not acquire schema lock" or "Flyway validate failed" depending on which step failed.

### Why heavy migrations stall rollout
1. Pod boots: Flyway runs before the web server accepts requests and before readiness is signaled.
2. Heavy migration (index on table with tens of millions of rows, backfill) holds the lock long enough.
3. Other pods boot simultaneously, wait for the lock, exhaust retries, and fail to boot.
4. Orchestrator terminates old pods per rollout policy; old pods die before new ones are ready, creating a period with no ready pods.

Conclusion: the place and time for running migrations must be designed; don't rely on default behavior.

### Configuration and organization
~~~yaml
spring:
  flyway:
    enabled: true
    validate-on-migrate: true      # schema mismatch -> boot fail fast, easy to detect
    lock-retry-count: 10           # wait for other instances to finish migration
    baseline-on-migrate: false     # only enable at specific time to adopt old schema
~~~

- Cluster with multiple instances: run migration as a separate step (Job/init container or pipeline before app deployment), or keep it in the app but define that only one instance migrates before scaling out.
- Use a dedicated DB user for Flyway with minimum privileges (necessary DDL/DML), not the app's runtime user.
- Keep migrations small and compatible with both old and new code (expand/contract) so that application version rollback still works with the new schema.

### Production pitfall
- Enabling {{baseline-on-migrate}} to "get past" on every env makes Flyway treat the old schema as valid, masking real mismatches where each env differs.
- On PostgreSQL, migration waits for metadata lock when old pod queries are still running; monitor with {{pg_stat_activity}} to distinguish "waiting for lock" from "it is slow itself".
- Orchestrator kills pod mid-migration if grace period is too short; whether it completes migration properly depends on DB's transactional DDL (PostgreSQL has it; MySQL DDL auto-commits so a later step is needed).

> Senior tip: measure migration duration via {{installed_on}} column in history table and alert when it exceeds 60 seconds; before release, test on staging data of actual size to know which migration is heavy; don't let prod be the first test.`,
    follow: ["Why does CREATE INDEX CONCURRENTLY not run in a transaction that Flyway opens by default?", "When is baseline-on-migrate reasonable and what are its risks?"]
  },
  "spring-035": {
    q: "How does Flyway distinguish between versioned (V__) and repeatable (R__) migrations? What is the purpose of the checksum in the history table, how do you handle \"checksum mismatch\" errors, and is it ever allowed to modify an already executed migration file?",
    a: `**Summary:** Versioned (V__) migrations run exactly once in version order; repeatable (R__) migrations run whenever content changes and always after remaining versioned migrations. The checksum is recorded in the {{flyway_schema_history}} table; a \"checksum mismatch\" error means the file changed after it was executed - the standard way to handle it is **to add a new migration**, not to modify the old file; {{repair}} is only used when intentional and reviewed.

### Two types and checksum
- **Versioned** {{V1__create_order.sql}}, {{V1.2__add_outbox.sql}}: each version runs at most once, marked in history; schema state is summarized in a single version - "DB is at Vx" is sufficient for the whole team to understand.
- **Repeatable** {{R__refresh_views.sql}}: run again when content changes and always after all versioned migrations, sorted by description; used for objects dependent on many others: views, functions/triggers, seed reference data that rarely changes. The description (part after {{__}}) is its name, renaming the file renames the object according to Flyway.

Checksum is the **file content hash**, recorded when the migration runs. Validate compares the file on disk with the history line: this mechanism ensures the content starting up is exactly what was reviewed and executed previously. Mismatch error means someone modified the file - this is a protection mechanism, not Flyway being unreasonably pedantic.

### Handling based on situation
| Situation | Handling |
|---|---|
| V__ already executed in prod | Add new V to fix; never touch old file |
| File not in prod yet, small fix before release | Allowed, but every env that ran the old file will have a mismatch -> must baseline those envs |
| History mismatch due to manual DB restore/copy | {{repair}} to align checksum/pending, accompanied by review and backup |
| Feature branch merge late after V12 | Enable {{out-of-order}} to supplement V11 after V12, with clear policy |

### Semantics to remember
- Flyway runs each migration in a separate transaction on DBs supporting it (PostgreSQL); MySQL DDL auto-commits, so migrations with multiple steps may fail midway, leaving schema in a "half-done" state - you must know this and have a follow-up migration.
- {{out-of-order}} should only be enabled with policy: used for branches merged late in staging, clearly documenting which migration adds what before which; enabling it unconsciously in prod makes order between branches hard to reproduce.
- Repeatable does not replace versioned for table structure changes: every DDL change should be versioned for a consistent history story on every env.

### Production pitfall
- Modifying a file that already ran just to clean comments/formatting: prod doesn't change immediately, but the next boot blows up checksum - usually during peak hours.
- Making it a habit to call repair whenever validate fails causes checksum to lose its role as a warning; repair must be a reviewed decision, not a spray-and-pray.
- Merging migrations from multiple services in a shared schema: version numbers could collide; define version ranges per service or separate location folders per service.

> Senior tip: enforce policy with CI: periodically run {{flyway validate}} on a DB built from scratch from V1 to the latest version and on a staging snapshot; any file drifting from those two paths will be revealed before reaching prod.`,
    follow: ["What does Flyway repair do and when is it safe to use?", "Why should multi-step migrations on MySQL remember the implicit commit of DDL?"]
  },
  "spring-036": {
    q: "You added a new field to a DTO, but the JSON response does not contain that field; another endpoint reports \"Java 8 date/time type not supported by default\". What Jackson traps cause JSON to be silently incorrect, and how do you correctly configure ObjectMapper with Spring Boot?",
    a: `**Summary:** Jackson defaults to serializing via public getters/properties: private fields without getters are ignored, without any reported exceptions. Date/time via java.time requires JSR-310 module - only the ObjectMapper auto-configured by Boot is pre-loaded; a self-crafted {{new ObjectMapper()}} is completely devoid of configuration. Correct approach: let Boot manage ObjectMapper ({{spring.jackson.*}}) or explicitly define a JsonMapper bean, combined with a few fail-loud flags to make errors visible early.

### Visibility: what gets serialized
~~~java
public record OrderFee(String code, BigDecimal amount) {}   // record: automatically gets accessors

public class OrderDto {
    private String orderId;                    // no getter  -> NOT in JSON
    private boolean paid;
    public boolean isPaid() { return paid; }   // -> property "paid" (isX for boolean)
}
~~~

Since getters determine everything, many strange behaviors stem from method names: typo-typed getter {{getSatus}} produces key {{satus}} sent to client; adding a new field but forgetting to add a getter; or the client waiting for a new field but JSON remains unchanged - no exceptions reported, just silently missing. Directions for prevention: {{@JsonProperty}} to fix property names, use records for new DTOs so accessors are clearly defined, and have tests to assert key existence.

### Java time: obvious errors and silent drift
- ObjectMapper **without** {{JavaTimeModule}}: Jackson 2 throws {{InvalidDefinitionException}} (Java 8 date/time type not supported by default) - obvious error, easy to troubleshoot.
- Has module but still default: {{WRITE_DATES_AS_TIMESTAMPS}} not disabled -> {{LocalDate}} returns as array like [2026,5,1], {{Instant}} returns as epoch seconds; JSON appears valid but differs from ISO-8601 - client-side drift, silent on server-side.

Boot auto-configuration for ObjectMapper includes {{JavaTimeModule}} and disables {{WRITE_DATES_AS_TIMESTAMPS}}. Thus rule: every ObjectMapper in the app originates from a common configuration source and is injected; {{new ObjectMapper()}} scattered around is the most common source of drift. When upgrading to Jackson 3 (Boot 4): package changes to tools.jackson, java.time support is already integrated in databind - read release notes, don't copy configuration out of Jackson 2 habit.

### Correct manual configuration
~~~java
@Bean
JsonMapper jsonMapper() {
  return JsonMapper.builder()
      .addModule(new JavaTimeModule())
      .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
      .enable(SerializationFeature.FAIL_ON_EMPTY_BEANS)   // DTO without properties -> exception, don't return {}
      .build();
}
~~~
No need for a separate bean, just adjust yaml: {{spring.jackson.serialization.*}}, {{spring.jackson.default-property-inclusion}}. ObjectMapper after configuration is **thread-safe**: create it once in the app lifecycle.

### Production pitfall
- {{@JsonInclude(NON_NULL)}} makes fields with null values disappear entirely from JSON; client distinguishes \"key does not exist\" from \"key = null\", so changing this configuration is a change to the API contract.
- Disabling {{FAIL_ON_EMPTY_BEANS}} for quietness will mask DTO classes entirely missing getters, output becomes empty {{}}. Check the current ObjectMapper configuration before deciding to disable it.
- A static util {{new ObjectMapper()}} flowing from an old service to many call paths: in the same app, one area returns ISO, another returns timestamp - two ObjectMappers, two configurations.
- Creating a new ObjectMapper per request is wasteful and easily drifts; configure it once or via a single bean.

> Senior tip: light contract test: use the app's own ObjectMapper to serialize representative DTOs (full java.time, null, empty lists) then assert keys and format; a few minutes per DTO but catches visibility, date drift, and getter renaming.`,
    follow: ["Why does a self-newed ObjectMapper lose the JavaTimeModule configuration?", "How does NON_NULL change the API contract with the client?"]
  },
  "spring-037": {
    q: "Serializing a Hibernate entity to JSON: one endpoint returns a response with extra \"hibernateLazyInitializer\", another endpoint reports StackOverflowError due to bidirectional relations. How do Hibernate proxies interact with Jackson, what safe class configuration is needed, and why are DTO projections still a more durable choice?",
    a: `**Summary:** LAZY relations not yet fetched are Hibernate proxies (subclasses generated at runtime); Jackson serializes via getters so it calls onto the proxy: either triggers lazy load when session is still open (N+1 right at serialization), throws {{LazyInitializationException}} when session is closed, or exposes internal property {{hibernateLazyInitializer}}/{{handler}} because Jackson probes every public getter on the proxy. Bidirectional relations without cutting one side create infinite recursion - StackOverflowError. JSON should be described by DTOs; annotations on entity are just a safety net.

### How proxies meet Jackson
Hibernate returns proxies only bearing the ID; actual fetch happens on the first call to a getter if the persistence context is still open. Serialization usually runs after service transaction closes (in Controller, in HTTP message writer), so ending produces three results:
- proxy not initialized + session closed -> {{LazyInitializationException}};
- proxy initialized -> JSON adds unintended data, and several N+1 queries occur right at serialization step;
- proxy runtime property not hidden -> output includes {{hibernateLazyInitializer}} and {{handler}} because Jackson probes all public getters on the proxy.

### Defense line when forced to return entities
~~~java
@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})   // hide proxy runtime property
class Order {
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JsonIgnore                        // cut ONE side of the bidirectional cycle
  private Customer customer;

  @OneToMany(mappedBy = "order")
  private List<OrderLine> lines;     // lines side is serialized, Line.order side is cut
}
~~~
Infinite recursion on old entities could use {{@JsonManagedReference}}/{{@JsonBackReference}} to mark parent/child, but only fits true one-way relations and still ties API to model - complex relations are cleaner with DTOs. Alternatively, add {{jackson-datatype-hibernate6}} module (select artifact matching Hibernate 6 currently running) so uninitialized proxies only serialize the ID, without needing annotations on every entity.

### Why DTO projections are more durable
- API contract not tied to storage model: changing schema doesn't break clients.
- Fetch plan clearly chosen for each use case (JOIN FETCH, {{@EntityGraph}}, constructor expression), serialization never randomly triggers lazy loading.
- Not exposed to internal proxy properties, no inherent infinite recursion: a mapper (MapStruct or record constructor) suffices, no need for annotation layers on every entity.

### Production pitfall
- {{@JsonIgnore}} placed on a relation to save one endpoint, then a new endpoint needs exactly that field -> data is cut silently; {{@JsonView}} can divide layers but needs clear rules in the team.
- Serialization runs after commit: queries during serialization are not in the business transaction of the endpoint; without monitoring query count, this type of N+1 is invisible.
- Bytecode enhancement for entities makes generated proxy classes differ according to configuration; when lazy fetch configuration differs between dev and prod, serialization behavior verified in dev drifts in prod - keep the same configuration in all environments.

> Senior tip: pragmatic rule: JSON always via DTO; on entity only keep hidden {{hibernateLazyInitializer}} configuration as a general safety net, do not consider it a main strategy; monitor query count per endpoint to see N+1 issues occurring right at serialization.`,
    follow: ["How do {{@JsonManagedReference}}/{{@JsonBackReference}} resolve infinite recursion, and when are they not enough?", "Why is N+1 during serialization harder to detect than N+1 in the service?"]
  },
  "spring-038": {
    q: "The service runs stably locally but in prod, the next boot blows up with \"Migration checksum mismatch\", while a few infrequently used routes report \"column does not exist\". The prod schema has drifted from migration files: how does drift form, how do you handle it when it reveals itself, and what policy prevents it from recurring?",
    a: `**Summary:** Schema drift is when an environment's real DB differs from what migration files describe: an ALTER run manually to fix an incident, another service's script, late merges, or old restores. It reveals itself in two faces: boot failure at validation (checksum mismatch) or runtime error \"column does not exist\" on rarely visited API paths. I handle it with a process of so-diff - forward-fix - repair with review, and prevent recurrence with a policy of \"schema only goes through migrations\" combined with flyway validation in CI.

### How drift forms
1. **Off-hours incident**: DBA ALTERs prod for speed (add index, change type, add column) without a corresponding migration - prod runs immediately, every other env lacks it.
2. **Schema shared by multiple services**: another service adds its own columns/tables in the same database.
3. **Long-lived branches**: V file edited after it ran in some env, or late merge causes chaotic version order - combined with checksum mismatch at boot.
4. **Restore/snapshot**: schema restored to old state, Flyway history table follows old state or desynchronizes.

Prod \"running fine at that moment\" is why drift hides for so long - error explodes on the next boot, or only on rarely called API paths after several days.

### Handling process when drift reveals itself
1. **Freeze schema changes** until a plan is in place; stop pending deployments.
2. **Diff**: dump prod schema (pg_dump --schema-only) and build a clean schema from V1 to the latest version, then diff every table, column, index, constraint; list every drifted object and its source.
3. **Forward-fix**: changes that must be kept are normalized into new migrations; residual fragments are cleaned up via migrations - absolutely do not ALTER manually \"for speed\" ever again.
4. **Repair with review** if checksums mismatched because files were edited: after deciding step 3, use repair to re-stamp the history, with backup. Do not use repair to \"restore synchronization\" without knowing how much is drifted.
5. **Return to convention**: from then on, every env uses the same migration chain; if any environment must hold special schema, that difference must be described by a separate migration, not left out of the system.

### Preventing recurrence
- **Policy**: every schema change must be via PR containing migration files; DBA users or \"operators\" do not have free DDL rights, ALTER requests must be via ticket and lead to a migration.
- **Two-way CI**: flyway validate on a DB built from scratch from V1 (catches broken files, order, conflicts), and periodic validation (nightly) on staging/prod snapshots to catch drift outside of code.
- **History monitoring**: new lines in {{flyway_schema_history}} not from the deploy pipeline is a red flag; set alert for that event.

### Production pitfall
- Two teams with shared schema but not partitioning version/folders: someone edits another team's file, checksum blows up unexpectedly.
- Repair used as bleach whenever it blows: checksum mechanism loses its role as a warning that \"something changed outside the process\".
- Enabling {{baseline-on-migrate}} to suppress errors: each env is deemed valid with different real schemas - drift is not fixed but listed as official state.

> Senior tip: do not measure drift in \"how many columns drifted\" - measure it by time from drift appearance to CI alert. With nightly validation policy on snapshots, an off-hours manual ALTER is seen the next morning; without it, drift can live for weeks and explode at the moment of a major release.`,
    follow: ["What does {{flyway repair}} fix in the history table?", "What tool do you use to build schema diff between prod and migration code?"]
  },
  "jpa-028": {
    q: "You added a data.sql file to seed data but the app does not load it; another time the script runs before Flyway, causing errors because tables do not exist. When do Boot's SQL init scripts (schema.sql/data.sql, {{spring.sql.init.mode}}) run, what does {{spring.jpa.defer-datasource-initialization}} resolve, and why should systems choose only one path for schema?",
    a: `**Summary:** Boot has three overlapping mechanisms for schema/seed setup: Hibernate {{ddl-auto}}, init scripts ({{schema.sql}}/{{data.sql}}), and migration tools (Flyway). Mixing all three is a classic source of ordering errors. Two key points: {{spring.sql.init.mode}} defaults to embedded, so on real DBs data.sql is ignored unless {{always}} is enabled; while {{spring.jpa.defer-datasource-initialization}} pushes script execution after Hibernate schema ({{ddl-auto}}) instead of before. When Flyway is present, schema and seed should consistently belong to migrations.

### When each mechanism runs
- {{spring.sql.init.mode}} defaults to **embedded**: scripts only run automatically on embedded DBs (H2/HSQL). On real PostgreSQL, unless {{always}} is set, data.sql is ignored completely - the most common cause of \"added seed but see nothing\", and it happens silently without error.
- {{spring.jpa.defer-datasource-initialization=true}}: defers init scripts to run **after** Hibernate creates schema ({{ddl-auto}}) instead of before; fits the flow of Hibernate schema creation then seeding with raw SQL. But with Flyway present, Hibernate should not be the one creating schema (set {{ddl-auto}} to none/validate), so deferring becomes redundant unless mixed intentionally.
- Relative order between init scripts and Flyway/Liquibase changed between Boot versions; if both mechanisms must coexist, verify with integration tests on the exact Boot version running.

### Choosing one path
| Path | Pros | Cons |
|---|---|---|
| Flyway only (schema + seed are migrations) | every env is same, has checksum and audit | large seeds require migration writing |
| {{ddl-auto}} + data.sql | demo/test quickly | prod not controlled, schema drift |
| Extra script.sql alongside Flyway | convenient for quick loading when needed | adds another source of ordering to maintain |

### Production pitfall
- Scripts running before migrations -> INSERT into non-existent table, boot blows up; or conversely, silently ignored in prod (embedded mode) while H2 test still runs: data \"lives\" in dev, \"dies\" in prod without any exceptions.
- Leaving {{ddl-auto=update}} in prod because schema drifts from migration: Hibernate auto-adds columns making schema drift from Flyway, and validation only scrutinizes migration files - this type of drift lies outside the radar.
- Seeding reference data (categories, roles, configs) via data.sql: prod needs the same identifier but the script is not guaranteed to run; IDs drift between envs causing FKs to break. Put seed in migrations - versioned for one-time, repeatable for idempotent content.

> Senior tip: remember the rule of three: schema only comes from migrations, init scripts attach to dev/test profiles via {{spring.sql.init.mode}}, all cross-env seeds reside in Flyway; and integration tests run real PostgreSQL (testcontainers) instead of leaving H2 to mask real ordering.`,
    follow: ["Why does {{spring.sql.init.mode}} default to embedded on real DBs?", "Why should reference data seeding be via migration instead of init scripts?"]
  },
  "jpa-029": {
    q: "The table has a JSONB column storing flexible product attributes. How do you map the JSON column with Hibernate 6 using {{@JdbcTypeCode(SqlTypes.JSON)}}, compared to the old AttributeConverter path, and what are the traps regarding snapshots and querying into JSON?",
    a: `**Summary:** Hibernate 6 maps JSON columns to Java types (record/POJO or Map) thanks to {{@JdbcTypeCode(SqlTypes.JSON)}}, usually accompanied by {{@Column(columnDefinition = "jsonb")}} on PostgreSQL; serialization/deserialization relies on the JSON mapper on the classpath (Jackson by default). The old path using {{AttributeConverter}} converted to String: must manual cast when querying with jsonb, and snapshots compared by strings. Memorable traps: snapshot/comparison cost increases with payload size, and querying by JSON key must go through native queries with jsonb operators.

### Mapping in Hibernate 6
~~~java
@Entity
public class Product {
    @Id Long id;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private ProductAttributes attributes;   // record/POJO; or Map<String,Object>
}
~~~
- Hibernate chooses JSON mapper from the classpath; missing dependencies results in runtime errors when binding.
- {{columnDefinition}} takes effect on Hibernate's DDL path; with Flyway, jsonb column is defined in migrations and declaration on entity must match type.
- Choose {{jsonb}} instead of PostgreSQL's {{json}}: jsonb parses structure and supports operators/indices, json only stores literally.

### Snapshot and cost
Hibernate treats JSON attributes as mutable: it copies the value when entity loads and compares on flush, so editing deep inside ({{attributes.tags.add(...)}}) is detected and issues an UPDATE at the right time. Price to pay: every flush must serialize/compare the entire document - an object of several hundred KB on thousands of hot rows makes flush noticeably slow. Keep payloads small; put heavy content elsewhere.

Keeping immutable types (records + copy-on-write) isn't required but helps every write path occur only via intentional methods, easier to test than silent mutation.

### Query by JSON key
JPQL does not understand JSON structure; when condition by key is needed, use native query with jsonb operators:
~~~java
@Query(value = "select p.* from product p where p.attributes ->> 'brand' = :brand", nativeQuery = true)
List<Product> findByBrand(@Param("brand") String brand);
~~~
GIN index created in migration for truly necessary query patterns; each GIN makes every INSERT/UPDATE heavier, so create only based on measured query frequency, not \"just in case\".

### Trade-off
| Criteria | JSONB column | Relational subtable |
|---|---|---|
| Schema flexibility | high, add attributes without DDL change | each new type requires migration |
| Query by condition | needs jsonb operators + GIN | natural b-tree index |
| Data constraint | weak, self-validate at app | FK/CHECK available |
| When to choose | customizable attributes per type | core data frequently queried |

### Production pitfall
- No constraint inside jsonb: adding \"required\" field then silently let old records lack it; validate shape when decoding or backfill via migration.
- UPDATE on jsonb column re-issues entire value (MVCC writes new row): large payloads on hot rows cause bloat, adding work for vacuum.
- GIN index \"just in case\": measure {{pg_stat_user_indexes}}; indices no one uses only waste write and storage.

> Senior tip: jsonb is for data with \"changing shapes\"; when a key starts being queried hotly or business constraints tighten, move it to a real column (or generated column) and keep jsonb for the truly extensible parts.`,
    follow: ["How does snapshot cost of JSON column increase with payload size?", "When should a JSON key be moved into a real column or subtable?"]
  },
  "db-031": {
    q: "A job runs every 5 minutes on 3 pods and must run exactly on one instance. The team plans to use file locks on a shared volume; you propose Postgres advisory locks: how does {{pg_try_advisory_lock}} differ from {{pg_advisory_xact_lock}}, what are the risks with connection pools, and compared to SKIP LOCKED queue or ShedLock, when should you choose which?",
    a: `**Summary:** Advisory locks are locks not attached to any table, Postgres grants by 64-bit key you define (e.g., job name hash). Session-level ({{pg_advisory_lock}}/{{pg_try_advisory_lock}}) holds until unlocked or connection closes; transaction-level ({{pg_advisory_xact_lock}}) automatically releases upon COMMIT/ROLLBACK. With connection pools, the biggest risk is acquiring and releasing locks on two different connections - wrapping work in a single transaction is the way to dodge both. File locks on shared volumes are unreliable for multi-pod environments.

### Quick understanding
Advisory lock is like **a meeting room key hanging at the reception** (PostgreSQL): three employees (3 pods) all want to use the room at 9 o'clock, whoever reaches the reception first takes the key, the other two see the hook empty and turn back - no job runs this round. The key isn't attached to anything in the room (not attached to a table), just a number everyone agrees on the meaning. **Session-level** type means you must return the key yourself; **transaction-level** type means the key automatically returns to the hook when you finish the meeting (commit/rollback). If the key holder faints (connection closes), the receptionist automatically reclaims the key.

### Terminology
- **Advisory lock**: \"consultative\" lock with meaning defined by the application, PostgreSQL only manages who holds which key.
- **Session-level / transaction-level**: lock belongs to the connection (held until unlock/close) / belongs to the transaction (released upon commit/rollback).
- **pg_try_***: variant that does not wait - returns true/false immediately.
- **Connection pool**: pool of reused connections; two consecutive statements outside a transaction might pass through two different connections.
- **ShedLock**: Java library locking {{@Scheduled}} jobs using a lock table (or Redis, Mongo...) with duration {{lockAtMostFor}}.
- **Leader election**: select one instance to be the \"runner\" in the cluster.
- **pg_locks**: system view listing held/waiting locks.

### A job run on 3 pods, step-by-step
~~~text
09:00:00.000  pod-A: BEGIN; SELECT pg_try_advisory_xact_lock(71801) -> true
09:00:00.002  pod-B: BEGIN; SELECT pg_try_advisory_xact_lock(71801) -> false -> ROLLBACK, skip round
09:00:00.003  pod-C: ... -> false -> skip round
09:00:00 - 09:00:40  pod-A runs job in transaction (holds 1 connection, 1 lock)
09:00:40.010  pod-A: COMMIT -> lock 71801 auto-releases
If pod-A is killed at 09:00:20 -> TCP closes -> backend ends -> lock released
(if network \"hangs\" instead of closing, only released upon TCP keepalive/timeout detection)
~~~
1. **Open transaction and try to take non-waiting lock**. Why try: rule is \"exactly one\", no need to queue; losing pod skips this round.
2. **Work in same transaction**. Why: Spring binds one connection for the transaction, lock and work go along the same session.
3. **Commit/rollback auto-releases lock**. Why safe: no path forgets to unlock, even during exceptions.
4. **Process death loses lock per connection**. Why better than file lock: no \"zombie lock\" needing manual cleanup.
5. **Trade-off**: transaction held throughout job - 40-minute job holds connection and old snapshot (blocks VACUUM). For long jobs, consider acquiring lock on separate connection held outside pool, or ShedLock with {{lockAtMostFor}}.

### Comparison and choosing
| Mechanism | Scenario | Note |
|---|---|---|
| Advisory Lock | Short, DB-centric jobs | No extra table, fast |
| SKIP LOCKED | Queue processing, high throughput | Needs table, handles contention |
| ShedLock | Generic {{@Scheduled}}, cross-DB | Needs table/Redis/Mongo, explicit timeout |

> Senior tip: advisory lock is simplest when the app is already Postgres-coupled; use transaction-level for safety. If jobs take > 1 minute, use ShedLock or external leader election, do not hold DB transaction open for long durations.`,
    follow: ["Does {{pg_advisory_xact_lock}} block VACUUM if held too long?", "In what case is ShedLock better than PostgreSQL advisory locks?"]
  }
});

