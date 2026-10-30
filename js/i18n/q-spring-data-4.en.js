/*
 * English translation of js/data/q-spring-data.js — task T176. Format: js/core/i18n.js (content overlay).
 * ids: db-010 db-011 spring-016 spring-017 spring-018 spring-019 spring-020 spring-021
 */
App.i18n.content({
  'db-010': {
    q: 'How do you build a job queue in the database with {{SELECT ... FOR UPDATE SKIP LOCKED}}, and what points need attention?',
    a: `**Summary:** {{FOR UPDATE SKIP LOCKED}} lets multiple workers **claim different jobs in parallel** without waiting for each other: worker A locks job row 1, worker B sees that the row is locked so it **skips** it and takes the next one. This is a simple way to build a job queue without a broker, and it leverages the database's own transaction to guarantee consistency.

### Quick intuition
Imagine a **chore board pinned to the wall** and 5 employees. Each person walks up, looks for a slip nobody has taken yet, writes their name on it and carries it away. With plain {{FOR UPDATE}}, when two people aim at the first slip at the same time, the second one has to **stand and wait** until the other has finished writing their name. With {{SKIP LOCKED}}, the second person sees that slip is already "held by someone" and **takes the next one instead** – nobody waits for anybody. Once the name is written (commit) you walk away from the board immediately to do the work; you do not stand there hugging the board.

### Terms
- **Row lock ({{FOR UPDATE}})**: lock the row so that nobody else can update or lock it until the transaction ends. Like putting a "reserved" sign on a chair.
- **{{SKIP LOCKED}}**: when a row is already locked, skip it instead of waiting. The result is deliberately inconsistent (you may see a different sub-set of rows on every call), which is only acceptable for a queue.
- **CTE ({{WITH ... AS}})**: a named sub-query that you can use like a temporary table inside a statement.
- **Lease**: a "rental contract" with an expiry – the job belongs to the worker until {{locked_at + timeout}}; past that moment someone else may take it back.
- **At-least-once**: every job is guaranteed to be processed at least once, possibly more than once.
- **Idempotent**: running it many times gives the same result as running it once – like pressing an elevator button twice, the elevator still comes once.
- **Dead tuple**: an old version of a row inside PostgreSQL waiting for VACUUM to clean it up; a jobs table that updates constantly produces a huge number of them.
- **Dead-letter**: a place that holds jobs which failed more times than the retry limit, so a human can look at them.

### Lifecycle of one job
~~~text
PENDING --(worker claims + commits)--> RUNNING --(finished)--> DONE
   ^                                     |  |
   |  (error, attempts < 5, run_at = now() + backoff)
   +-------------------------------------+  +--(attempts >= 5)--> FAILED (dead-letter)
   ^
   +--(reaper: RUNNING whose locked_at < now() - 10 minutes)
Worker A: claims jobs 1..10   Worker B: skips 1..10 (locked) -> claims 11..20
~~~
The key point: the row lock only lives for the **few milliseconds** of the claiming transaction; after the commit, "ownership" of the job is expressed by the {{RUNNING}} status + {{locked_at}} stored in the row, so if a worker dies the reaper can still recognise it.

### SQL to pick up jobs
~~~sql
WITH picked AS (
    SELECT id
    FROM jobs
    WHERE status = 'PENDING' AND run_at <= now()
    ORDER BY run_at
    LIMIT 10
    FOR UPDATE SKIP LOCKED
)
UPDATE jobs
SET status = 'RUNNING', locked_at = now(), attempts = attempts + 1
WHERE id IN (SELECT id FROM picked)
RETURNING id, payload;
~~~
How it runs:
1. Open a transaction, run the statement above (it locks the selected rows).
2. **Commit right away** to release the locks – do not keep the transaction open while processing the job.
3. Process the job **outside** the transaction.
4. Update the status to {{DONE}} (or {{FAILED}} + retry) in a separate transaction.

### Why you must commit immediately
With {{SKIP LOCKED}}, other workers are not blocked; they simply skip the locked rows. The problem with keeping the transaction open while you process the job (for example calling an external API) is: each worker holds a DB connection for the whole processing time (the pool drains), a long transaction prevents VACUUM from cleaning dead tuples (the jobs table bloats and the job-picking query gets slower and slower), and any command that needs to lock that row (cancel job, admin update) has to wait. The rule: **short locks, process outside the transaction** – the {{RUNNING}} status plus {{locked_at}} act as a "lease".

### Points you must pay attention to
- **At-least-once, not exactly-once**: a worker can die after committing the job claim but before finishing the processing ⇒ the job must be **idempotent**.
- **Reclaiming dead jobs**: the {{locked_at}} column + a scheduled job that scans for {{RUNNING}} jobs past their deadline, resetting them to {{PENDING}}.
- **The right index is required**: {{(status, run_at)}} so picking up jobs never scans the whole table.
- **Limit the number of jobs per claim** (for example 10–50) so you don't hold too many locks and the transaction doesn't stretch.
- **Competitive claiming**: {{FOR UPDATE SKIP LOCKED}} requires database support (PostgreSQL 9.5+, MySQL 8.0+, Oracle; SQL Server has no such syntax and instead uses the hint {{WITH (READPAST, UPDLOCK, ROWLOCK)}}). The sample SQL above is PostgreSQL syntax ({{UPDATE ... RETURNING}} does not exist on MySQL). Plain {{FOR UPDATE}} (without {{SKIP LOCKED}}) makes the second worker **wait** → throughput drops.

### When to use it and when not to
| Use | Don't use |
|---|---|
| Moderate traffic, need transactional guarantees with the DB | Very high load, need low latency and wide distribution |
| Want to reduce infrastructure (no extra broker) | Need complex retries, dead-letter, key-based routing |
| Jobs tied to a business transaction | Long-running jobs (hours) |

Under heavy load, move to Kafka/RabbitMQ/SQS: lower latency, with retry and dead-letter mechanisms built in.

### Production pitfalls
- Forgetting the job reclaim mechanism ⇒ after an incident, jobs stuck in {{RUNNING}} **forever**.
- A worker "dying" mid-way happens in every queue system; design jobs to be idempotent with a timeout.
- Keeping the transaction open while processing the job ⇒ lower throughput and more deadlocks.
- The job-picking query must use a proper **index**, otherwise it scans the whole table on every poll.

### Common mistakes
- **No index for the claim condition**: the jobs table holds 10 million DONE rows and every poll scans all of them. Symptom: DB CPU is high even though only a handful of jobs are PENDING. How to avoid it: a partial index {{CREATE INDEX ON jobs (run_at) WHERE status = 'PENDING'}} (PostgreSQL), plus moving or deleting old DONE jobs periodically.
- **Polling too hard from too many workers**: 50 workers polling every 100ms = 500 queries/s just to ask "is there any work?". How to avoid it: poll with backoff when the queue is empty, or use PostgreSQL's {{LISTEN/NOTIFY}} to wake workers up.
- **The reaper's timeout is shorter than the real processing time**: a job that is still running is reset to PENDING and a second worker runs it too. How to avoid it: leave headroom above the p99, let the worker renew {{locked_at}} (heartbeat) for long jobs, and keep jobs idempotent.
- **Writing the result without checking ownership**: the old worker (already reclaimed by the reaper) still writes DONE on top of the other worker's work. How to avoid it: {{UPDATE ... WHERE id = ? AND locked_by = ? AND status = 'RUNNING'}} and check how many rows were updated.

### One-minute spoken answer
"FOR UPDATE SKIP LOCKED lets several workers claim jobs from one table without waiting for each other: any row another worker has locked is skipped and the next one is taken instead. I claim a small batch, flip the status to RUNNING with a locked_at, commit right away, process the job outside the transaction, and write DONE or FAILED in a separate transaction. Because it is at-least-once, jobs must be idempotent, and I need a reaper that returns overdue RUNNING jobs to PENDING. The trade-off: simple, no extra broker, and the job row can be written in the same transaction as the business data – but it does not suit very high load or complex routing. I have used it for sending emails and syncing partners at a few hundred jobs per second, stable thanks to a partial index on PENDING jobs."

> Senior tip: {{SKIP LOCKED}} is a beautiful example of "using the right principle of the database engine instead of standing up extra infrastructure". Before choosing it, ask: is the job volume big enough to justify a broker, and is the team willing to operate an extra RabbitMQ/Kafka? If the answer is "not yet needed", start with the DB – and design the API so you can later switch to a broker without rewriting the business logic.`,
    follow: [
      'Why must you commit right after claiming the job instead of processing the job in the same transaction?',
      'How do you reclaim jobs stuck because a worker died?'
    ]
  },
  'db-011': {
    q: 'Compare Oracle and PostgreSQL: which differences does a Java dev need to know, especially when working with systems built on Oracle (very common in Vietnamese banks)?',
    a: `**Summary:** Both are strong RDBMSes with solid transactions, partitioning and optimizers. The most important differences for a Java dev: **sequences and how ids are generated**, **how empty strings and NULL are handled**, **pagination syntax and date functions**, **drivers and how to read the execution plan**. Many Vietnamese banking systems run Oracle, so knowing these differences makes reading legacy code and debugging much faster.

### Quick intuition
Oracle and PostgreSQL are like two luxury car makers in the same class: both have a steering wheel, brakes and airbags (transactions, indexes, MVCC), but the **buttons sit in different places** – if you are used to one car, switching to the other you easily hit the wipers instead of the indicator. For a Java dev the "buttons" are: how ids are generated, how empty strings are treated, pagination syntax, date-time types, and the tool used to read the plan. Pure JPA code is barely affected, but native queries, stored procedures and existing data are hit directly. Understanding the differences lets you read a bank's legacy code and avoid the "works fine on local PostgreSQL, breaks on Oracle" bug.

### Terms
- **Sequence**: an object that generates increasing numbers independently of any table; {{CACHE n}} pre-allocates n numbers in memory, so it is fast but may jump (leave gaps) when the instance restarts.
- **VARCHAR2**: Oracle's main string type; an empty string stored into it becomes NULL.
- **ROWNUM**: the row number Oracle assigns while returning a result, used for pagination on old versions.
- **PL/SQL / PL/pgSQL**: the procedural language running inside the DB (stored procedures, triggers) for Oracle / PostgreSQL.
- **Undo segment**: where Oracle stores the old data for rollback and for consistent reads (similar to InnoDB's undo log).
- **RAC / Data Guard**: Oracle's cluster of several nodes sharing one storage / a standby replica at another site.
- **DBMS_XPLAN**: an Oracle package that displays the execution plan.
- **allocationSize**: the JPA parameter of {{@SequenceGenerator}} – how many ids Hibernate takes from the sequence per call (50 by default).

### Generating ids with a sequence in JPA, step by step
~~~text
DB:  CREATE SEQUENCE order_seq START WITH 1 INCREMENT BY 50 CACHE 20;
JPA: @SequenceGenerator(name="ord", sequenceName="order_seq", allocationSize=50)
 Call 1: Hibernate calls nextval -> 1   => it hands out ids 1..50 from memory
 Call 2: calls nextval -> 51            => hands out 51..100
~~~
1. **Hibernate calls the sequence once for a whole batch of ids**. Why: fewer round-trips, so bulk inserts are far faster than with identity.
2. **The sequence's INCREMENT BY must equal allocationSize**. Why: Hibernate 6 reads the sequence metadata at startup and by default reports an error when they disagree (configurable with {{hibernate.id.sequence.increment_size_mismatch_strategy}}); if you switch the check off and leave them mismatched, two instances can produce duplicate ids or huge jumps.
3. **Gaps are normal**: restarting the app throws away the unused part of the id range, and Oracle's {{CACHE}} throws away cached numbers when the instance shuts down. Why it does not matter: ids only need to be unique, not continuous; if you need gap-free document numbers, generate them with a different mechanism.
4. **On Oracle RAC**, {{NOORDER}} + {{CACHE}} means ids coming from different nodes do not increase in time order. Why it matters: never sort "by creation time" using the id.

### Comparison table
| Criterion | Oracle | PostgreSQL |
|---|---|---|
| Sequence | Separate object with {{CACHE}}, {{NOORDER}}/{{CYCLE}}; {{IDENTITY}} since 12c | The sequence is also a separate object (can be {{OWNED BY}} a column), has {{CACHE}}; {{serial}}/{{identity}} |
| Empty string | **{{''}} is treated as NULL** | Distinguishes {{''}} from NULL |
| Pagination | {{OFFSET ... FETCH NEXT}} (12c+), {{ROWNUM}} for older versions | {{LIMIT/OFFSET}}, keyset cursor |
| Date types | {{DATE}} includes the time of day; {{TIMESTAMP}} | {{TIMESTAMP}}, {{TIMESTAMPTZ}} |
| Numeric types | {{NUMBER}} | {{NUMERIC}}, {{BIGINT}}, {{SERIAL}} |
| JSON | {{JSON}} (12c+) | {{JSONB}} – very powerful, indexable |
| UUID | {{RAW(16)}} / {{SYS_GUID()}} | Native {{UUID}}, {{gen_random_uuid()}} |
| Reading the execution plan | {{DBMS_XPLAN}}, adaptive plan (12c), SQL Plan Baselines | {{EXPLAIN (ANALYZE, BUFFERS)}}, {{auto_explain}} |
| PL/SQL | PL/SQL (its own, powerful) | PL/pgSQL |
| Read consistency | MVCC based on undo; READ COMMITTED by default (statement-level snapshot), has SERIALIZABLE; no dirty reads | MVCC by row versioning ({{xmin}}/{{xmax}}); READ COMMITTED by default, has REPEATABLE READ/SERIALIZABLE |
| JDBC driver | {{ojdbc11}} (JDK 11+), {{ojdbc17}} for JDK 17 | {{org.postgresql:postgresql}} |
| Partitioning | Range/list/hash, partition exchange, reference partitioning | Declarative partitioning; sharding via the Citus extension |

### Differences that "cause bugs" if you don't know them
1. **Empty string**: on Oracle, inserting {{''}} into a {{VARCHAR2}} column becomes NULL. Java code comparing with {{"".equals(value)}} behaves differently between the two DBs.
2. **Pagination**: {{LIMIT 20 OFFSET 100}} is PostgreSQL/MySQL syntax; Oracle uses {{OFFSET 100 ROWS FETCH NEXT 20 ROWS ONLY}}. The same native query cannot run on both.
3. **Dates**: Oracle {{SYSDATE}} returns the system time in the server's timezone; PostgreSQL should use {{now()}} (in the session's timezone). With {{TIMESTAMPTZ}}, PostgreSQL stores UTC and displays it in the session's timezone – the closest Oracle equivalent is {{TIMESTAMP WITH LOCAL TIME ZONE}}, while Oracle's {{DATE}}/{{TIMESTAMP}} do not store a timezone at all, just like PostgreSQL's {{timestamp}} (without time zone).
4. **NULL comparisons**: both use {{IS NULL}}; a {{NOT IN}} with a NULL value in the result set returns **no rows at all** (both DBs behave this way – a classic bug).
5. **Identifiers**: unquoted names are case-insensitive, but Oracle folds them to **UPPERCASE** while PostgreSQL folds them to **lowercase**; a name created inside double quotes ({{"OrderId"}}) must be quoted exactly the same way every time it is used.
6. **Date arithmetic**: Oracle {{date + 1}} = add 1 day; PostgreSQL needs {{date + interval '1 day'}}.
7. **String concatenation with NULL**: Oracle's {{||}} skips NULL ({{'abc' || NULL}} = {{'abc'}}), while PostgreSQL's {{'abc' || NULL}} = NULL – to skip NULL on PostgreSQL use {{concat()}} or {{coalesce}}. Queries ported from Oracle often surprise you with an unexpected NULL here.

### Operations and cost
- **Oracle** has a strong enterprise ecosystem (RAC, Data Guard, GoldenGate), but **license costs are high** and operations are complex; many features require a separate license.
- **PostgreSQL** is free, open source, HA usually with Patroni + streaming replication; JSONB, declarative partitioning and extensions (PostGIS, pgvector) are big advantages.
- Many organizations choose PostgreSQL for cost and flexibility, and keep Oracle for the core business systems they have run for years.

### Production pitfalls
- The same SQL written for one DB breaks when you move to another → keep the SQL in **dialect-specific migration files** and run integration tests on both if the system needs portability.
- Migrating a schema from Oracle to PostgreSQL: you need to map data types, sequences, indexes, and **Oracle-specific constraints** (virtual columns, function-based indexes).
- Reading execution plans: Oracle uses {{V$SQL}} + {{DBMS_XPLAN}}; PostgreSQL uses {{pg_stat_statements}} – two completely different toolsets.
- Be careful with Oracle {{NUMBER}} without scale: comparing monetary amounts as floats can drift at boundaries.

### Common mistakes
- **Validating empty strings in the DB**: on Oracle a {{NOT NULL}} column that receives {{''}} raises ORA-01400, because {{''}} becomes NULL. Symptom: a form with an optional field works on PostgreSQL and fails on Oracle. How to avoid it: normalise in the Java layer (empty string → null, or make the field required) and test against a real Oracle (Testcontainers ships an Oracle Free image).
- **Using {{java.util.Date}} / {{LocalDateTime}} with an Oracle {{DATE}} column and forgetting the timezone**: data ends up 7 hours off when the server runs UTC. How to avoid it: agree to store UTC, use {{Instant}}/{{OffsetDateTime}} and set {{hibernate.jdbc.time_zone}}.
- **An {{IN}} expression that is too long**: Oracle caps the list inside {{IN}} at 1000 elements (ORA-01795). Symptom: a large batch fails out of nowhere. How to avoid it: split into batches, or use a temporary table / join.
- **allocationSize not matching INCREMENT BY**: duplicate ids or a startup error after switching DB. How to avoid it: declare both explicitly and check them in the migration.

### One-minute spoken answer
"Oracle and PostgreSQL are both full RDBMSes with MVCC and READ COMMITTED by default, so transaction logic is nearly the same. The differences that cause the most bugs in my experience: Oracle treats an empty string as NULL, pagination syntax differs – ROWNUM or FETCH NEXT versus LIMIT OFFSET –, string concatenation with NULL gives different results, and Oracle's DATE type includes the time. For ids, both use sequences; I always keep INCREMENT BY aligned with Hibernate's allocationSize and accept the gaps. Trade-off when choosing: Oracle is strong in the enterprise ecosystem with RAC and Data Guard but its licence is expensive; PostgreSQL is free and its JSONB and extensions are very powerful. On banking systems I keep native queries per dialect and run integration tests against the exact DB type used in production."

> Senior tip: in Vietnamese banking environments, the question "have you worked with Oracle before, and how does it differ from PostgreSQL?" comes up very often. A good answer mentions 2–3 differences with **real impact** (empty strings treated as NULL, pagination syntax, sequence-based id generation where {{CACHE}} causes gaps in ids) and explains how you handled it in code. Remember to check the legacy system's SQL: a lot of statements use {{NVL}}, {{SYSDATE}}, {{ROWNUM}} – a clear telltale sign of Oracle.`,
    follow: [
      'Why does the empty string being treated as NULL on Oracle cause bugs, and how does it affect Java code?',
      'When moving a system from Oracle to PostgreSQL, what needs to be checked?'
    ]
  },
  'spring-016': {
    q: 'After an order is committed, the system needs to send a confirmation email and award loyalty points. How do {{@EventListener}} and {{@TransactionalEventListener}} differ? Why can events be lost when the service crashes, and when is the outbox pattern mandatory?',
    a: `**Summary:** Spring events are an **in-process, synchronous, non-durable** mechanism. {{@EventListener}} runs **before the commit**, so a side effect may already have happened when the transaction later rolls back; {{@TransactionalEventListener(phase = AFTER_COMMIT)}} is registered as a transaction callback and only runs **after a successful commit**, being skipped on rollback. Neither one is **durable** – if the process dies mid-way the event is lost, so side effects with monetary consequences need a **transactional outbox**.

### Comparing the two listener types
| Criterion | {{@EventListener}} | {{@TransactionalEventListener}} |
|---|---|---|
| When it runs | Right at publish time, inside the current transaction | By phase: BEFORE_COMMIT, AFTER_COMMIT, AFTER_ROLLBACK, AFTER_COMPLETION |
| Transaction | Shares the transaction that is open | BEFORE_COMMIT is still inside the transaction; for AFTER_* the transaction has already committed, so any DB write needs a new transaction ({{REQUIRES_NEW}}) |
| When tx rolls back | Already ran, side effect is wrong | **Does not run** for the AFTER_COMMIT phase |
| Published outside a transaction | Runs normally | **Does not run** unless you enable {{fallbackExecution = true}} |

### Why events get lost on crash
1. **No persistence**: the event only exists in the RAM of one instance. A pod being killed, an OOM, or a deployment mid-way loses it permanently.
2. **The listener runs synchronously in the request thread**: heavy work stretches the request, and if the process dies at that moment the event is lost.
3. **Deliberate rollback**: the AFTER_COMMIT phase skips the event when the transaction rolls back.
4. **No broadcast**: in a multi-instance system, the event is only handled by the instance that received the request.

The internal mechanism: {{@TransactionalEventListener}} does not register a global listener. When an event is published while a transaction is running, Spring creates a {{TransactionSynchronization}} and registers it with the {{TransactionSynchronizationManager}}; once the commit completes, the framework calls {{afterCommit()}} and only then does the listener run.

### The outbox pattern: when it is mandatory
Write the event into an **outbox table in the same transaction** as the business data, so "if the data is there, the event is guaranteed to be there". A job reads the outbox (usually with {{FOR UPDATE SKIP LOCKED}}) and publishes to Kafka or RabbitMQ.

~~~java
@Component
@RequiredArgsConstructor
public class OrderMailListener {

    private final MailSender mail;
    private final OrderRepository orderRepo;

    // runs only after the transaction commits successfully
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW) // its own transaction to read the DB
    public void on(OrderCreated event) {
        // pass the id through the event and reload, to avoid a possibly stale entity
        Order order = orderRepo.findById(event.orderId()).orElseThrow();
        mail.send(order.getEmail(), "Order confirmation " + order.getId());
    }
}
~~~

### Production pitfalls
- {{fallbackExecution}} defaults to {{false}}. Publishing an event outside a transaction (for example from a {{@Scheduled}} job) leaves the listener **unrun and un-warned** – a silent failure that is very easy to hit.
- With AFTER_COMMIT, the original transaction **has committed** but the resource is still bound to the thread ⇒ reading from the DB still works, but a **DB write will not be committed** (silently dropped) unless you use {{REQUIRES_NEW}}. From Spring 6.1 on, putting a default {{@Transactional}} (REQUIRED) on this listener even fails at startup.
- Don't pass an entity inside the event: after the commit it may already be detached or carry stale data. Pass the **id** and reload.
- Multiple listeners handle the same event: the order is decided by {{@Order}}, and listeners should not depend on each other's order.

> Senior tip: the team rule – events are for side effects that **do not decide the business outcome**; the outbox is for side effects with **customer-facing or monetary consequences**. Once you use the outbox, measure the end-to-end delay (from the write to the consumer finishing) and treat it as an SLO, because without visibility the outbox is just a table silently piling up.`,
    follow: [
      'Why does {{@TransactionalEventListener}} by default not run when the event is published outside a transaction?',
      'How do you design idempotency for an outbox consumer when a message may be delivered more than once?'
    ]
  },
  'spring-017': {
    q: 'You use {{@Cacheable}} to cache the product catalog and fee parameters. How do you handle the cache key, TTL with Redis, caching null values, self-invocation, and cache stampede?',
    a: `**Summary:** {{@Cacheable}} is an **AOP advice** that only works when the method is called **through the proxy** – self-invocation is not cached. The default cache key combines the method parameters; the TTL is configured via {{RedisCacheConfiguration}}; whether null values are cached depends on the cache manager configuration; a stampede needs a lock or jitter because {{sync = true}} only locks within one JVM.

### Why the call has to go through the proxy
{{@Cacheable}} is an AOP advice, so it only runs when the call goes through the proxy. A method called by **another method in the same bean** (self-invocation) never passes through the proxy ⇒ no caching, just as no transaction or async.

### The cache key
- Default: the key is made of the method parameters. For a method with no parameters, {{SimpleKey.EMPTY}} is used.
- Override it with SpEL: {{key = "#id"}}, {{key = "#p0"}}, {{key = "#root.args[0]"}}.
- **Key principle**: the key must reflect **every** condition that affects the result. If {{findByCustomerId(customerId)}} is called from multiple modules with the same customerId but a different tenant, the key must include the tenant too, otherwise a user of tenant B reads tenant A's cache – a **tenant data leak**, not a performance bug.
- Use **a separate cache name for each type of data** to avoid key collisions when two methods with the same id share a cache name.

### TTL with Redis
~~~java
@Bean
RedisCacheManager cacheManager(RedisConnectionFactory cf) {
    RedisCacheConfiguration cfg = RedisCacheConfiguration.defaultCacheConfig()
        .entryTtl(Duration.ofMinutes(10))   // fixed TTL for every key
        .disableCachingNullValues();        // defaultCacheConfig() ALLOWS caching null by default
    return RedisCacheManager.builder(cf).cacheDefaults(cfg).build();
}
~~~
- The problem with a fixed TTL: hot keys and cold keys all live 10 minutes. For a per-entry TTL, since Spring Data Redis 3.2 you can pass a {{RedisCacheWriter.TtlFunction}} into {{entryTtl(...)}} to compute the TTL per key/value.

### Caching null (cache penetration)
If the method returns {{null}} and the cache **does not allow null** (for example {{disableCachingNullValues()}} was called, or you use {{unless = "#result == null"}}), Spring Cache **writes nothing** to the cache. Consequence: a nonexistent key is called repeatedly and every call goes down to the DB – exactly the cache penetration attack pattern.
- With Redis: keep the default that allows null (stored as a {{NullValue}}) and set a shorter TTL for these keys;
- With Caffeine: {{CaffeineCacheManager.setAllowNullValues(true)}} (true by default).
- Note for {{Optional<T>}}: Spring unwraps Optional automatically, and {{Optional.empty()}} is stored as null – so you still need a cache manager that allows null.

### Cache stampede
A very hot key expires, 500 requests arrive within 200ms, all miss and all query the DB. How to handle it:
1. **TTL jitter**: randomize the TTL within a range so keys expire at different times (requires per-entry TTL support).
2. **Distributed lock**: only one thread calls the DB while the others wait or serve the old value. The lock must be in Redis, not {{synchronized}}, because the app runs on multiple instances.
3. **{{@Cacheable(sync = true)}}**: Spring uses {{Cache.get(key, Callable)}} with a lock **local to the JVM**, so it only prevents stampede within one instance; with Redis and N instances you still get up to N DB queries for the same key.

### Production pitfalls
- **Evicting the cache at the wrong moment**: {{@CacheEvict}} does not guarantee it runs after the commit.
- **Caching entities with lazy relations**: the cache stores the proxy too, and reading it back can fail. Cache **DTOs**.
- **Keys without tenant/user** when authorization is per user – a **data leak**, not a cache miss.
- Redis is single-threaded: several large keys add latency. Never use the KEYS command on production (it blocks the server), use SCAN.
- You need metrics: cache hit ratio, number of DB calls caused by misses, cache build time.

> Senior tip: before turning on a cache, be able to answer three questions: **(1) does another system write this data? (2) how stale can it be before it is unacceptable? (3) when an incident happens, who invalidates it and how?** If you cannot answer question 3, don't turn the cache on – a data incident is far more expensive than a few slow milliseconds.`,
    follow: [
      'Why does {{@Cacheable(sync = true)}} fail to solve cache stampede when using Redis?',
      'How do you design the cache key so that tenant data cannot leak between tenants?'
    ]
  },
  'spring-018': {
    q: 'Your service needs to call 5 external APIs (payment gateway, addresses, notifications). With Spring Boot 3, how do you choose between {{RestClient}}, {{WebClient}} and an HTTP interface ({{@HttpExchange}})? How do you configure timeouts and the connection pool so requests never hang?',
    a: `**Summary:** Spring Boot 3 gives you three options: {{RestClient}} (synchronous, fluent, the new direction replacing {{RestTemplate}}), {{WebClient}} (non-blocking, returns {{Mono}}/{{Flux}}), and the **HTTP interface** – you declare the client as an interface annotated with {{@HttpExchange}}, {{@GetExchange}}, {{@PostExchange}} and Spring generates a proxy implementation.

### The three options
| Criterion | {{RestClient}} | {{WebClient}} | HTTP interface |
|---|---|---|---|
| Model | Synchronous, blocking | Reactive, non-blocking | Depends on the adapter |
| Returns | {{T}} | {{Mono<T>}}/{{Flux<T>}} | {{T}} or {{Mono<T>}} depending on the adapter |
| Fit with MVC + JPA | Very good | Poor, calling {{block()}} loses the advantage | Good |
| Configuration | Shares a factory | Shares a {{ConnectionProvider}} | Concise, easy to test with a mock server |

### The HTTP interface
~~~java
public interface PaymentGatewayClient {

    @PostExchange("/api/v1/payments")
    PaymentResponse create(@RequestBody PaymentRequest request);

    @GetExchange("/api/v1/payments/{id}")
    PaymentResponse get(@PathVariable("id") String id);
}
~~~
You build it with {{HttpServiceProxyFactory}} and the matching adapter ({{WebClientAdapter}} for reactive, {{RestClientAdapter}} or {{RestTemplateAdapter}} for synchronous clients). The HTTP interface ({{@HttpExchange}}) exists since Spring Framework 6.0; {{RestClientAdapter}} was added in 6.1.

### Timeouts: four layers you must configure
1. **Connect timeout**: the maximum time to establish a connection to the target host. Without it, a hung host keeps a thread indefinitely.
2. **Response/read timeout**: the maximum time waiting for data. The most important timeout when calling a slow API.
3. **Pool acquire timeout**: how long to wait for a connection to become available in the pool.
4. **Timeout at the call layer**: circuit breaker, bulkhead, the parent request's deadline propagated down.

~~~java
@Bean
RestClient restClient(RestClient.Builder builder) {
    var factory = new JdkClientHttpRequestFactory(
        HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build());
    factory.setReadTimeout(Duration.ofSeconds(5));   // read timeout
    return builder
        .baseUrl("https://api.vn")
        .requestFactory(factory)
        .defaultStatusHandler(HttpStatusCode::isError, (req, res) -> {
            throw new PaymentApiException(res.getStatusCode());  // DO NOT swallow errors
        })
        .build();
}
~~~
With Spring Boot 3.4+ you can use the built-in properties {{spring.http.client.connect-timeout}} and {{spring.http.client.read-timeout}}; on older versions use a {{RestClientCustomizer}}.

### Connection pool
- {{SimpleClientHttpRequestFactory}} uses {{HttpURLConnection}}: **no pool**, each request creates a new connection with no keep-alive reuse. Only use it for prototypes.
- {{JdkClientHttpRequestFactory}} uses the JDK 11+ {{java.net.http.HttpClient}}: it has an internal pool and supports HTTP/2, but does **not** allow configuring the pool parameters directly.
- {{HttpComponentsClientHttpRequestFactory}} uses Apache HttpClient 5: full control over {{maxTotal}}, {{maxPerRoute}}, and connection time to live.
- {{WebClient}} uses Reactor Netty with a {{ConnectionProvider}}: you need to set {{maxConnections}}, {{pendingAcquireMaxCount}}, {{pendingAcquireTimeout}}, {{maxIdleTime}}.

### Production pitfalls
- **Not setting a timeout** is the number-one cause of "the API hangs" incidents: threads get held, connections get held, the pool drains and the failure spreads. Always set both the connect timeout and the read timeout.
- **Creating a new client on every call**: each instance has its own connection pool, so creating one in a loop leaks sockets. Always declare a singleton bean.
- **Circuit breaker and bulkhead**: you need isolation so one dead external API does not take down the whole system (Resilience4j).
- With **virtual threads**, the connection pool is still a finite resource: set {{maxConnections}} far below the number of threads.

> Senior tip: give each external client a **"timeout budget"** matched to your endpoint's SLO: if the partner API must respond within 300ms, a 1-second read timeout is far too loose; and if you set 30 seconds, one hung partner holds your threads for 30 seconds.`,
    follow: [
      'When would you choose {{WebClient}} instead of {{RestClient}} in an application using JPA?',
      'How do you configure retries for calls to the payment gateway so you never create duplicate transactions?'
    ]
  },
  'spring-019': {
    q: 'Bean Validation in Spring: how do {{@Valid}} and {{@Validated}} differ, what are validation groups for, and at which layer do you validate in an application that has both a REST API and internal jobs?',
    a: `**Summary:** Both trigger validation under the Jakarta Bean Validation standard, but their roles differ: {{@Valid}} is the **flag that enables cascading validation** (validating the nested fields/collections) and does not support groups; {{@Validated}} is a Spring annotation, used at the **class level** to enable **method validation** and to declare **groups**. On layers: the controller validates the **shape** of the input to fail early; the **service/domain layer** enforces business rules and must also work when called from an internal job, not just over HTTP.

### Comparing {{@Valid}} and {{@Validated}}
| Criterion | {{@Valid}} | {{@Validated}} |
|---|---|---|
| Package | {{jakarta.validation.Valid}} | {{org.springframework.validation.annotation.Validated}} |
| Where it is used | Method parameter, field | Mostly at **class level** |
| Cascading validation | Yes – triggers validation for a child field marked {{@Valid}} | Does not trigger it |
| Method validation | No | **Yes** – thanks to {{MethodValidationPostProcessor}} |
| Group support | No | Yes: {{groups = X.class}} |
| Error raised | {{MethodArgumentNotValidException}} | {{ConstraintViolationException}} (method) |

The most confusing point: {{@Valid}} does **not** automatically validate the child fields. For cascading validation, the child field itself must have {{@Valid}} (or use a type-use declaration such as {{List<@Valid OrderItemDto> items}}).

### Validation groups
Groups are **marker interfaces** used to split the rule set by usage context.
~~~java
public interface OnCreate {}
public interface OnUpdate {}

public record CreateUserRequest(
    @NotNull(groups = OnCreate.class)   // required when creating
    @NotBlank @Size(max = 64)           // no group declared -> belongs to the Default group
    String username,
    @NotBlank String displayName) { }
~~~
A few important rules:
- Once you declare a specific group (for example {{groups = OnCreate.class}}), constraints **without** a declared group are **not** validated.

### Custom constraints
~~~java
@Documented
@Constraint(validatedBy = ValidCardNumberValidator.class)
@Target({ FIELD, PARAMETER })
@Retention(RUNTIME)
public @interface ValidCardNumber {
    String message() default "Invalid card number";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class ValidCardNumberValidator implements ConstraintValidator<ValidCardNumber, String> {
    @Override
    public boolean isValid(String value, ConstraintValidatorContext ctx) {
        if (value == null || value.isBlank()) return true;   // let @NotNull handle emptiness
        return value.matches("[0-9]{12,19}");
    }
}
~~~
Don't reinvent what already exists: {{@NotNull}}, {{@NotEmpty}}, {{@NotBlank}}, {{@Size}}, {{@Pattern}}, {{@Email}}, {{@AssertTrue}}.

### Which layer to validate at
1. **Controller (the boundary)**: validate the shape of the input – null, length, format, valid enum. Return a 400 right away without spending business-processing resources.
2. **Service (the internal API contract)**: use {{@Validated}} at class level with groups, so that calls into the service from **internal jobs too** are validated.
3. **Domain (business rules)**: conditions like "an order must have at least one line item" or "the transfer amount must be under the limit" belong in the **domain model** and should raise business exceptions, not Bean Validation.

### Production pitfalls
- Bean Validation does **not stop the flow by itself**: without an {{@ExceptionHandler}} handling {{MethodArgumentNotValidException}} or {{ConstraintViolationException}}, the client receives a 500 instead of a 400.
- DB-level constraints (unique, foreign key, check) remain the last line of defense: two parallel requests can both pass application-level validation.
- {{@Validated}} on a service class activates a proxy; if a method is called by another method in the same bean (self-invocation), validation is silently skipped.
- The wrong group creates the feeling of "validation exists but catches nothing" – write tests for each group.

> Senior tip: draw the team's boundary with one simple sentence: **"validate structure at the boundary, validate business rules in the domain"**.`,
    follow: [
      'Why does {{@Valid}} on a {{@RequestBody}} not automatically validate nested objects?',
      'When should you use validation groups instead of creating two different DTOs?'
    ]
  },
  'spring-020': {
    q: 'You build a Spring Batch job to import 50 million records from a legacy system, it runs on multiple instances and must restart safely after a failure. How does chunk-oriented processing work, how is skip/retry configured, and when should you use partitioning?',
    a: `**Summary:** Spring Batch processes jobs with the **chunk-oriented** model: read {{chunkSize}} items, process the whole chunk in **one transaction**, write the checkpoint to the {{JobRepository}}, then commit. This is what makes the job **restartable**: after a crash, the batch resumes from the most recently committed chunk. Failures are handled with {{faultTolerant()}}: **retry** for transient errors (deadlock, timeout) and **skip** for garbage data, with limits and backoff. When the job is too big for one instance, **partitioning** splits the data in a manager/worker model to run in parallel.

### Chunk-oriented: the transaction is the checkpoint
~~~java
@Bean
Job importJob(JobRepository repo, Step importStep) {
    return new JobBuilder("importJob", repo).start(importStep).build();
}

@Bean
Step importStep(JobRepository repo, PlatformTransactionManager tx,
                ItemReader<Row> reader,
                ItemProcessor<Row, Staging> processor,
                ItemWriter<Staging> writer) {
    return new StepBuilder("importStep", repo)
        .<Row, Staging>chunk(1000, tx)     // 1 transaction per 1000 items
        .reader(reader)
        .processor(processor)
        .writer(writer)
        .faultTolerant()
            .skipLimit(100)                            // skip at most 100 bad rows
            .skip(DataIntegrityViolationException.class)
            .retry(TransientDataAccessException.class)  // only retry transient errors
            .retryLimit(3)
            .backOffPolicy(exponentialBackOff())        // ExponentialBackOffPolicy 1s x2, max 10s
        .build();
}
~~~
Three things to remember:
- **The chunk is both the transaction and the checkpoint unit**. A small chunk (10) means many transactions and high overhead; a big chunk (10000) holds locks longer, one error rolls back the whole chunk, and a restart loses much more work.
- **Item processing should not open its own transaction**: {{@Transactional}} (REQUIRED) on a processor/writer only joins the chunk's transaction, so it is meaningless; while {{REQUIRES_NEW}} commits independently, so when the chunk rolls back that part does not roll back with it – it breaks the checkpoint.
- **Restart is only safe at chunk level**: a committed chunk never runs again; the chunk being processed at the moment of the crash runs again **from the start** → so every operation must be **idempotent** (upsert instead of insert, or a status column to tell them apart).

### Restartability
- Job state is stored in the {{JobRepository}} (the {{BATCH_*}} tables with JDBC). Each set of identifying job parameters maps to one **JobInstance**; each run (including a restart) creates a new **JobExecution** belonging to that JobInstance.
- The step's {{ExecutionContext}} stores the reader's state (for example {{<readerName>.read.count}} for readers extending {{AbstractItemCountingItemStreamItemReader}}), letting the batch know how far it has read when restarting.

### Skip and retry
- **Retry** only pays off for **transient** errors: deadlock, timeout, network failure. Retrying a logic error (a constraint violation caused by bad data) only stretches the job endlessly.
- When **both retry and skip** are configured for the same exception, Spring Batch applies **retry first**; only when the retries are exhausted is the item skipped.
- **Skips must have visibility**: use a {{SkipListener}} to record the skipped rows into a file or table, so data is not lost in silence.

### Partitioning for large-scale jobs
~~~java
@Bean
Step managerStep(JobRepository repo, Step workerStep, TaskExecutor batchExecutor) {
    return new StepBuilder("managerStep", repo)
        .partitioner("workerStep", new IdRangePartitioner())
        .step(workerStep)
        .gridSize(8)                 // 8 partitions
        .taskExecutor(batchExecutor) // run in parallel with a thread pool
        .build();
}

@Bean
Step workerStep(JobRepository repo, PlatformTransactionManager tx,
                ItemReader<Row> reader, ItemWriter<Staging> writer) {
    return new StepBuilder("workerStep", repo)
        .<Row, Staging>chunk(500, tx)
        .reader(reader).writer(writer)
        .build();
}
~~~
- A {{Partitioner}} splits the data by a key (usually the {{id}} range): partition 0 takes ids 1–1,000,000, partition 1 takes 1,000,001–2,000,000...
- Each partition is its own **StepExecution** → independently restartable; one partition failing does not damage the partitions that finished.

### Production pitfalls
- **The chunk transaction contains the heavy work** (calling APIs, generating large files): the transaction stays open too long, holds locks, drains the connection pool and raises the chance of deadlock.
- **Enabling skip for data errors without recording the list of bad rows**: data disappears and nobody knows.
- **Missing observability listeners**: without {{JobExecutionListener}} and {{StepExecutionListener}}, when the job fails in the middle of the night you have no idea which partition, which chunk, which row it failed on.

> Senior tip: for a large data import job, treat **idempotency and checkpointing as the primary design**; the processing code is only the easy part.`,
    follow: [
      'Why does Spring Batch apply retry before skip, and what are the consequences of configuring them wrong?',
      'What criteria would you use to partition a 200-million-row transactions table?'
    ]
  },
  'spring-021': {
    q: 'A React SPA (storing the access token in memory) calls a banking API through Spring Security. How do you organize authorization with {{@PreAuthorize}}, OAuth2 resource server authentication, and how do you handle CORS and CSRF?',
    a: `**Summary:** Split authorization into three layers: **the filter chain** authorizes at URL level (coarse), **method security** with {{@PreAuthorize}} authorizes at **use case** level (fine), and authorization at the data level (row-level, per tenant). CORS and CSRF are **two different mechanisms**: CORS is the permission for the **browser** to read a response from another origin, while CSRF defends against another page **automatically** sending requests with the user's cookies. A SPA that keeps the token in memory and sends it via the {{Authorization}} header has almost no CSRF attack surface, so CSRF can be disabled – but **only if** you are certain that no cookie is used for authentication.

### The three authorization layers
1. **URL security** in the filter chain: {{requestMatchers("/api/admin/**").hasRole("ADMIN")}} – very coarse, easy to miss endpoints.
2. **Method security**: the permission is attached to the **business action**, independent of the URL. This is the layer that should be the source of truth for business permissions.
3. **Row-level**: queries must always filter by the principal's tenant/customer – never rely on the layers above.

### Method security
~~~java
// @EnableMethodSecurity on a @Configuration class is required (Spring Boot does NOT turn it on automatically)
@Service
public class TransferService {

    @PreAuthorize("hasAuthority('SCOPE_transfer.write')")
    public Transfer transfer(String accountId, BigDecimal amount) { ... }

    // SpEL calls a method on another bean: the decision is based on business data
    @PreAuthorize("@accountAccess.canAccess(#accountId, authentication)")
    public Statement getStatement(String accountId) { ... }
}
~~~
- {{hasRole('ADMIN')}} is equivalent to {{hasAuthority('ROLE_ADMIN')}}; OAuth2 scopes are renamed by Spring to {{SCOPE_xxx}}.

### CORS for a SPA
A SPA at {{https://app.vn}} calling an API at {{https://api.vn}} is **a different origin** → the browser sends a preflight {{OPTIONS}} request before the real call.
- CORS is **not a security mechanism**: it only decides whether the browser may read the response. The request may still have reached the server if it was a "simple request".
- Configuration:
~~~java
@Bean
CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of("https://app.vn"));   // never use "*" with allowCredentials
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-XSRF-TOKEN"));
    cfg.setAllowCredentials(true);
    cfg.setMaxAge(3600L);                              // cache the preflight for 1 hour
    UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
    src.registerCorsConfiguration("/api/**", cfg);
    return src;
}
~~~

### CSRF for a SPA
- A **CSRF attack** relies on the browser **automatically** sending the domain's cookies (the session cookie, or a cookie holding the access token) when you visit another page.
- If the access token lives in the SPA's **memory** and is sent via the {{Authorization}} header → the browser does **not** send this header automatically → there is no CSRF attack path → you can **disable CSRF**.
- If the token is in a **cookie** (even httpOnly) → you need a CSRF token using the double-submit cookie pattern:
~~~java
@Bean
SecurityFilterChain apiChain(HttpSecurity http, CorsConfigurationSource cors) throws Exception {
    CookieCsrfTokenRepository repo = CookieCsrfTokenRepository.withHttpOnlyFalse();
    repo.setCookieCustomizer(c -> c.sameSite("Strict").secure(true).path("/"));
    return http
        .cors(c -> c.configurationSource(cors))
        .csrf(c -> c.csrfTokenRepository(repo)
                    .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
        .build();
}
~~~
The SPA reads the {{XSRF-TOKEN}} cookie and sends it back in the {{X-XSRF-TOKEN}} header for every request that changes data.

### Production pitfalls
- {{allowedOrigins("*")}} together with {{allowCredentials(true)}} is **invalid**: Spring throws {{IllegalArgumentException}} when handling a CORS request (use {{allowedOriginPatterns}} if you truly need a wildcard).
- **Disabling CSRF while still using cookies/sessions** is a classic vulnerability. Before disabling, make sure no cookie carries authentication information.
- Storing the token in {{localStorage}}: every XSS bug can steal it. If you are forced to use it, you need strict CSP and sanitized input.
- Mis-mapped authorities (the scope is not converted to {{SCOPE_}}) → mass 403s with no obvious cause.

> Senior tip: when reviewing the security of a SPA, go in this order: **(1) where does the token live?** In a cookie you need CSRF; in memory you need tight CSP. **(2) is the preflight answered correctly?** **(3) do sensitive endpoints have method security?** **(4) is multi-tenant data filtered at the query layer?** Most security incidents are not about encryption or tokens, but about **trusting that the filter chain is enough**.`,
    follow: [
      'Why does {{hasRole("ADMIN")}} not work with the scopes of an OAuth2 token?',
      'When are you forced to use cookies and re-enable CSRF for a SPA application?'
    ]
  }
});
