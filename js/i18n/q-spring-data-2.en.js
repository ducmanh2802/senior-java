/*
 * English translation of js/data/q-spring-data.js — task T174. Format: js/core/i18n.js (content overlay).
 * ids: spring-012 spring-013 spring-014 spring-015 jpa-001 jpa-002 jpa-003 jpa-004 jpa-005 jpa-006 jpa-007
 */
App.i18n.content({
  'spring-012': {
    q: 'How do Spring MVC and Spring WebFlux differ, when should you choose WebFlux, and does Java 21 virtual threads change this choice?',
    a: `**Summary:** Spring MVC is a **blocking** model — each request takes a thread for the whole duration of processing. WebFlux is a **reactive non-blocking** model — the event loop handles thousands of requests simultaneously thanks to backpressure. With a JDBC/JPA-based system, WebFlux doesn't help much, and the current mainstream choice is **MVC + virtual threads (Java 21)**.

### Comparison
| Criteria | Spring MVC | Spring WebFlux |
|---|---|---|
| Thread model | Thread-per-request (blocking) | Event loop + non-blocking |
| Concurrency limit | Limited by container threads | Very high, but only when I/O truly non-blocking |
| DB driver | JDBC/JPA (blocking) | R2DBC (non-blocking) |
| Blocking code | Normal | **Blocking event loop → very dangerous** |
| Backpressure | None (depend on thread count) | Has, limits producer speed |
| Streaming/SSE/WebSocket | Yes (not optimal) | Excellent |

### Why WebFlux "isn't faster" with JPA
WebFlux only excels when the **entire** I/O chain doesn't block: R2DBC, WebClient, Kafka reactive, SSE. If you still use JPA/Hibernate in handlers, the blocking queries will keep the event loop → losing the exact advantage of WebFlux, plus added complexity. Combining "WebFlux + JPA" is a sign of wrong design.

### How virtual threads change the picture
Java 21 (JEP 444) allows creating millions of lightweight threads. Spring Boot 3.2+ supports:
~~~yaml
spring:
  threads:
    virtual:
      enabled: true
~~~
When enabled, Tomcat processes each request by a single virtual thread: **code blocking stays written like MVC normally**, but no longer limited by "number of threads = number of concurrent requests". This is a very reasonable default choice for CRUD systems using JPA.

### Production pitfall
- **Thread pinning**: on Java 21, virtual threads can pin a carrier when blocking in some regions {{synchronized}} or native methods. Avoid holding monitors across long blocking I/O operations; don't replace every {{synchronized}} with {{ReentrantLock}}. JEP 491 (Java 24) eliminates pinning due to monitors in such cases.
- ThreadLocal still works in virtual threads but memory depends on number of live threads → avoid storing large data in ThreadLocal.
- With virtual threads, **connection pool must shrink** (pool is a limited resource of the DB), not grow.
- Testing: MVC uses {{MockMvc}}, WebFlux uses {{WebTestClient}} — getting the test type wrong is a common source of bugs.

### Interview question worth remembering
"When do you **not** choose WebFlux?" — A good answer: when all I/O is blocking (JPA/JDBC), when the system needs low latency for simple requests, or when the team doesn't yet have enough reactive experience — in that case MVC + virtual threads gives better performance than with lower development cost.

> Senior tip: don't pick WebFlux just because you heard "reactive is the trend". Evaluate: if the system gets stuck because threads are blocked on I/O (DB, HTTP client), switching to virtual threads is a small change with high payoff. Switching to WebFlux means rewriting the entire I/O layer — high cost, only worth doing when you truly need backpressure and streaming.`,
    follow: [
      'Why is WebFlux + JPA an anti-pattern?',
      'How does virtual thread affect connection pool sizing?'
    ]
  },
  'spring-013': {
    q: 'How do you centralize exception handling in Spring Boot? What role does {{@ControllerAdvice}} and {{ProblemDetail}} (RFC 7807/9457) play, and what traps must be avoided?',
    a: `**Summary:** Centralized error handling uses {{@RestControllerAdvice}} + {{@ExceptionHandler}}. Since Spring Framework 6, Spring supports **{{ProblemDetail}}** per RFC 9457 (formerly RFC 7807): returning {{ProblemDetail}} causes the framework to generate response {{application/problem+json}} with {{type}}, {{title}}, {{status}}, {{detail}} and other extension properties.

### Structure of an advice
~~~java
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(OrderNotFoundException.class)
    ProblemDetail handleNotFound(OrderNotFoundException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setTitle("Order not found");
        pd.setProperty("code", "ORDER_NOT_FOUND");
        pd.setProperty("timestamp", Instant.now());
        return pd;
    }

    // For validation errors, override handleMethodArgumentNotValid if needed.
}
~~~

### When to inherit ResponseEntityExceptionHandler
This class handles many errors Spring MVC throws, like 400, 405 and 415. If you extend, override the corresponding hooks instead of declaring a {{@ExceptionHandler}} duplicating an already-mapped exception. Not all 404s go through the advice; handling depends on resource/dispatcher configuration.

### Standard response format
~~~json
{
  "type": "https://errors.acme.com/order-not-found",
  "title": "Order not found",
  "status": 404,
  "detail": "Order 123 does not exist",
  "code": "ORDER_NOT_FOUND",
  "timestamp": "2026-01-20T02:15:00Z"
}
~~~

### Pitfalls to avoid
1. **Silent catch-all**: {{@ExceptionHandler(Exception.class)}} returning 500 with {{ex.getMessage()}} leaks internal details (SQL, file paths). Must log the root cause server-side and return neutral messages to the client.
2. **Lost stack trace in logs**: returning only ProblemDetail without logging makes production issues very hard to trace.
3. **Catch too broadly**: catching {{Exception.class}} swallows serious system errors, hiding bugs.
4. **Exceptions outside dispatcher**: exceptions in filters, interceptors, or async tasks don't go through {{@ControllerAdvice}} — must handle separately.
5. **No correlation id**: client reports an error without an identifier for tracing logs.

### Production pitfall
- Consider role-based access: clients can see detailed error messages; others see only error codes.
- ProblemDetail content can be cached by CDN/proxy — remember to add cache-busting headers for error responses.
- Don't expose internal info in {{detail}} when the error is user-caused; put detailed info in logs with {{traceId}}.

> Senior tip: standardize error codes across the entire system using **business error codes ({{code}})** instead of English message strings — the client displays by code, while you change the message in code without breaking the client. Also always return {{traceId}} for log tracing within 30 seconds when users report errors.`,
    follow: [
      'What is the difference between {{@ExceptionHandler}} and {{@ResponseStatus}}?',
      'Why don\'t exceptions occurring in filters get handled by {{@ControllerAdvice}}?'
    ]
  },
  'spring-014': {
    q: 'How do you manage config in Spring Boot: {{@ConfigurationProperties}}, profile, externalized config and secrets?',
    a: `**Summary:** Use {{@ConfigurationProperties}} for type-safe configuration binding with validation, **profile** to split config per environment, and externalize the config out of the app (environment variables, JVM args, command line, config server) so you deploy **the same artifact** to every environment. Secrets never live in the repo or the image — pulled from a secret manager (Vault, AWS Secrets Manager) and injected only at runtime.

### Type-safe constraints
~~~java
@ConfigurationProperties("payment")
@Validated
public record PaymentProperties(
        @NotBlank String provider,
        @Min(1) @Max(60) int timeoutSeconds,
        @NotNull Duration retryDelay,
        @DefaultValue("https://api.sandbox.vn") URI endpoint) { }
~~~

- Use **record** + constructor binding (Spring Boot 3 auto-wires, no need for {{@ConstructorBinding}}).
- Time/size types: {{Duration}}, {{DataSize}}, {{Period}} — write {{30s}}, {{512KB}} very clearly.
- Enable scanning: {{@ConfigurationPropertiesScan}} on the main class, or {{@EnableConfigurationProperties(PaymentProperties.class)}}.
- Validation required: {{@Validated}} + {{@NotNull/@Min/...}} → app **fails at startup** if config is wrong, rather than runtime error.

### Profiles
~~~yaml
# application.yml
spring:
  profiles:
    active: dev
---
# application-prod.yml
payment:
  provider: vnpay
  timeout-seconds: 15
~~~

- Profile activation by {{SPRING_PROFILES_ACTIVE}}, {{--spring.profiles.active=prod}}; also {{spring.config.activate.on-profile}} to attach a block of config to a profile (not to activate the profile itself).
- Precedence order (simplified, high → low): command line args → system properties → OS environment variables → profile files (application-*.yml) → {{application.yml}} → {{@PropertySource}} → default properties.

### Externalized config
- Environment variables via **relaxed binding**: {{payment.provider}} ↔ {{PAYMENT_PROVIDER}}.
- Config Server: {{spring.config.import=optional:configserver:}} to fetch central config, with per-profile directory and per-version label.
- Files outside: {{spring.config.import=optional:file:/etc/app/}}.

### Managing secrets
- Never commit secrets; use environment variables, file mounts (Kubernetes Secret), or secret managers.
- Rotate periodically and support 2 versions for seamless deploys.
- Actuator must **sanitize** sensitive values: {{management.endpoint.env.show-values=NEVER}} (this is the Boot 3 default — hides all values; Boot 2 only hides keys like {{password}}, {{secret}}, {{key}}, {{token}}). Don't switch to {{ALWAYS}} in production.

### Production pitfall
- Renaming a property without updating its usages → app starts with default values, runtime error. Always have {{@Validated}} + **never set defaults for required properties**.
- A profile "active" set wrongly in a real environment is a very common source of config issues.
- Secrets in startup logs (e.g., printing config) are a common vulnerability — inspect real-environment logs.

> Senior tip: treat config as a **contract between the app and the environment**: every property should have a clear type, validation, and safe defaults. A good trick: put all config in a dedicated package and write tests asserting the app **starts successfully** with each profile — catching config errors early in CI rather than at deploy time.`,
    follow: [
      'Relaxed binding defines how environment variable names map to properties — explain.',
      'Why use a record for {{@ConfigurationProperties}} instead of a class with setters?'
    ]
  },
  'spring-015': {
    q: 'How do you configure observability and ops for a Spring Boot service: Actuator, Micrometer, distributed tracing and graceful shutdown?',
    a: `**Summary:** The three ops trio is **Actuator** (admin endpoints: health, metrics, env), **Micrometer** (measurement layer, exported to Prometheus/CloudWatch) and **Micrometer Tracing + OpenTelemetry** (distributed tracing, passing {{traceparent}} per W3C spec). **Graceful shutdown** ensures when a pod receives SIGTERM, it stops accepting new requests, finishes processing existing requests, then closes the pool and connections.

### Suggested configuration
~~~yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      probes:
        enabled: true
      show-details: when-authorized
  tracing:
    sampling:
      probability: 0.1          # 10% of requests traced
server:
  shutdown: graceful
spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s
~~~

### Endpoints for what
| Endpoint | Used for |
|---|---|
| {{/actuator/health}} | Liveness check; separate {{liveness}} and {{readiness}} for Kubernetes |
| {{/actuator/prometheus}} | Scrape metrics |
| {{/actuator/metrics}} | View detailed metric at the moment of failure |
| {{/actuator/env}}, {{/actuator/configprops}} | Debug config |
| {{/actuator/threaddump}}, {{/actuator/heapdump}} | Diagnosis when app hangs |

### Metrics to watch
- **RED**: Rate, Error, Duration of HTTP requests — Micrometer auto-records for web servers ({{http.server.requests}}).
- **Business metrics**: orders/day, failed tasks, queue latency.
- **HikariCP**: {{hikaricp.connections.pending}}, {{hikaricp.connections.usage}} → detect pool depletion early.
- Alert based on **SLO** (e.g., p95 latency > 500ms in 10 minutes) rather than per-threshold alerts.

### Distributed tracing
- Micrometer Tracing wraps OpenTelemetry; automatically adds trace id into logs (pattern has {{traceId}}) and passes header {{traceparent}} through the HTTP client.
- Choose sample ratio: 100% on errors (using tail-based sampling), 1–10% on normal traffic to reduce cost.
- Always record **correlation id** into logs to join across services.

### Graceful shutdown
When enabling {{server.shutdown=graceful}}, the process receiving SIGTERM is: server stops accepting new connections → waits for currently-running requests (max {{timeout-per-shutdown-phase}}) → closes {{@PreDestroy}}, closes connection pool. Kubernetes must configure {{terminationGracePeriodSeconds}} larger than the app's shutdown time, and should have a {{preStop}} hook (sleep 5–10s) because Kubernetes removes pods from endpoints **simultaneously** with sending SIGTERM — without preStop, some requests still route to the shutting pod. Boot switches readiness to {{REFUSING_TRAFFIC}} when starting shutdown.

### Production pitfall
- Exposing actuator publicly is a vulnerability (you can leak config, and {{heapdump}} contains all data in memory) → only open internally, with authentication.
- {{show-details: always}} leaks DB connection details → always keep {{when-authorized}}.
- Metrics with **high cardinality** (binding {{userId}}, {{path}} dynamically) will crash Prometheus → only tag with bounded values.
- Deep health checks (checking DB) serve **readiness**; using them for **liveness** makes slow DB cause Kubernetes to restart the whole pod.

> Senior tip: treat Actuator as the **official operations interface** of your service. Before going to production, check the list of endpoints opened, enable authentication for them, and build a "golden" dashboard: request rate, error rate, p95 latency, queue length, failure ratio of infra jobs. First 5 minutes of an incident decide 80% of outcomes, and the dashboard decides whether you have enough information to react or not.`,
    follow: [
      'Differentiate liveness probe and readiness probe; which endpoint goes to which?',
      'Why do metrics with high cardinality cause problems for Prometheus?'
    ]
  },
  'jpa-001': {
    q: 'What is N+1 query, how to detect and fix it? How will you handle a query returning a list with a collection child?',
    a: `**Summary:** N+1 occurs when the main query returns N rows, and each row generates **one** extra query (due to lazy loading inside the loop) → total queries = 1 + N. Symptoms: response time increases linearly with record count, SQL logs repeat hundreds of times. Best handling: **fetch join**, then **{{@EntityGraph}}**, **batch fetching**, and **DTO projection**.

### How it happens
~~~java
List<Order> orders = orderRepo.findAll();      // 1 query
for (Order o : orders) {
    System.out.println(o.getItems().size());    // each order: 1 extra query
}
// total: 1 + N queries
~~~

### Detection
1. Enable log SQL: {{spring.jpa.show-sql=true}} and {{spring.jpa.properties.hibernate.format_sql=true}} → see query repetition.
2. Enable Hibernate statistics: {{spring.jpa.properties.hibernate.generate_statistics=true}} → count queries per request.
3. Use proxy to count queries per request (datasource-proxy, p6spy) or tracing with a span per SQL.
4. Enable {{spring.jpa.open-in-view=false}}: rather than hiding errors, it makes {{LazyInitializationException}} appear earlier — then you find immediately where lazy access happens outside transaction.
5. Read the code: accessing {{getXxx()}} of a collection inside a loop is a sign.

### Handling
| Method | When to use |
|---|---|
| {{join fetch}} in JPQL | Query needs child data, moderate number of rows |
| {{@EntityGraph(attributePaths = ...)}} | Need to fetch relations without writing JPQL |
| {{@BatchSize}} / {{default_batch_fetch_size}} | Many small collections, gather N queries into 1 query {{IN}} |
| DTO projection | Just a few columns — reduces load and removes the problem entirely |
| Use subquery instead of loading collection | Need count/stats of children but not the child objects |

~~~java
@Query("select o from Order o join fetch o.items where o.customerId = :cid")
List<Order> findWithItems(@Param("cid") Long customerId);

@EntityGraph(attributePaths = {"items", "items.product"})
List<Order> findByCustomerId(Long customerId);
~~~

~~~java
// DTO projection: no entity created, no lazy involved
interface OrderSummary { Long getId(); String getStatus(); int getItemCount(); }
@Query("select new com.acme.dto.OrderRow(o.id, o.status, size(o.items)) from Order o")
List<OrderRow> summary();
~~~

### Production pitfall
- **Fetch join + pagination** → Hibernate warns {{HHH000104}}: {{firstResult/maxResults}} executed in memory. Fix: first query the page by listing IDs, then query second time fetch by ID (with {{@BatchSize}}).
- Fetch 2 collections of type {{List}} at once → {{MultipleBagFetchException}}. Use {{Set}} or split into queries.
- {{FetchType.EAGER}} is the default for {{@ManyToOne}} and {{@OneToOne}} (while {{@OneToMany}}/{{@ManyToMany}} default LAZY) → very easy to create hidden N+1; declare {{fetch = FetchType.LAZY}} explicitly.
- Enabling {{hibernate.default_batch_fetch_size}} (e.g., 50) is a cheap safety net efficient for most lazy collections.

> Senior tip: when you spot N+1, don't instantly fix everything with {{join fetch}} — joining multiple collections makes SQL bloated and fragile. Better process: (1) measure query count before/after, (2) prioritize **DTO projection** for list screens since nobody needs the full entity children, (3) set {{default_batch_fetch_size}} as the safety net, (4) only use fetch join when you truly need child data to render.`,
    follow: [
      'Why does {{join fetch}} combined with {{Pageable}} trigger the warning {{HHH000104}}?',
      'What is the difference between {{@BatchSize}} and {{default_batch_fetch_size}}?'
    ]
  },
  'jpa-002': {
    q: 'How does the persistence context work? What are the entity states, and how do dirty checking and flush mode affect writing data?',
    a: `**Summary:** Persistence context (i.e., {{EntityManager}}/Session of Hibernate) is the **L1 cache** and **identity map** of Hibernate: within one transaction, each entity is loaded as **only one** Java object, and every change on that object is compared against its snapshot by Hibernate at flush to generate {{UPDATE}} — this is **dirty checking**. Four entity states: transient, persistent (managed), detached, removed.

### The four entity states
| State | Meaning | Changeable fields written? |
|---|---|---|
| Transient | New {{new}}, not yet attached to context | No |
| Persistent / Managed | Loaded or persisted in context | **Yes** — dirty checking |
| Detached | {{detach}}ed or session closed | No (need {{merge}}) |
| Removed | Marked for deletion | Deleted at flush |

### Dirty checking
~~~java
@Transactional
public void rename(Long id, String name) {
    Customer c = customerRepo.findById(id).orElseThrow();  // persistent
    c.setName(name);   // no update needed, no save() required
    // on commit -> Hibernate compares snapshot -> UPDATE
}
~~~
Two conditions for dirty checking to run correctly:
1. Entity must be managed (managed) in the context.
2. Field must **not** be {{final}} — Hibernate can't assign final fields through reflection.

### What is flush
Flush = push changes in context down to DB (write {{INSERT}}/{{UPDATE}}/{{DELETE}} and {{flush}} dirty). Hibernate flush:
- before **commit** transaction;
- before running one **JPQL query** related to the table being changed (auto-flush) — so the query sees the latest data.

Flush modes:
| FlushMode | Behavior |
|---|---|
| {{AUTO}} (default) | Flush when needed (as above) |
| {{COMMIT}} | Flush only at commit → queries within the **same** transaction can read **stale** data (changes not yet flushed) |
| {{MANUAL}} | Never auto-flush, must call {{session.flush()}} |

### Production pitfall
- **Entity "dirty" after rollback**: DB transaction rollback, but objects in context still hold changes. If reusing context (e.g., in a long stream), call {{clear}} after handling errors.
- Using {{merge}} on detached entity creates **a copy** managed; if you keep a reference to the original, later changes won't be written.
- {{equals}}/{{hashCode}} based on {{getId()}}: before persist, {{getId()}} is {{null}} → entity can be "lost" in {{HashSet}}.
- Don't use entities as API return types: activates hidden lazy loading, leaks sensitive fields, and easily generates N+1 when serialized.

> Senior tip: remember the rule "**managed = changes auto-saved**". When debugging, if changing a field doesn't update the DB, check immediately: is the object still managed (session still open, not {{detach}}ed), is the field {{final}}, did the transaction really commit?`,
    follow: [
      'Why can {{merge}} on a detached entity create a copy and cause confusion?',
      'When does auto-flush occur and how does it affect query results?'
    ]
  },
  'jpa-003': {
    q: 'When does {{LazyInitializationException}} throw? Should Open Session In View be on or off, and why?',
    a: `**Summary:** Lazy loading only creates a **proxy**; the real query runs when you access the proxy's field. If that access happens **after the session is closed** (transaction ends), Hibernate has no connection left to query → {{LazyInitializationException}}. Open Session In View (OSIV) keeps the session open the entire HTTP request lifecycle so it masks this error, but keeps the DB connection longer and makes N+1 explosions obvious. **Recommendation: disable OSIV.**

### When LazyInitializationException throws
~~~text
service.getOrder(id)   -> @Transactional: load order, session closes when method ends
controller returns DTO -> calls order.getItems() to map -> no session left -> boom
~~~

Three common causes:
1. Access lazy collection **outside** transaction.
2. Access lazy in view/template layer after transaction ended.
3. Serialize entity to JSON via Jackson **outside** transaction → Jackson calls getter → touches lazy.

### What is OSIV
{{spring.jpa.open-in-view}} defaults to **true** in Spring Boot: Spring opens an {{EntityManager}} before processing requests and closes it after rendering is done. Through this, lazy errors in the view layer "vanish".

### Why disable
| Problem | Explanation |
|---|---|
| Keeps connection longer | Session open throughout request ⇒ connection held even when not used |
| Hides errors | N+1 bug, mapping error hidden until production |
| Hidden dependency | Methods without {{@Transactional}} "work" in dev, but fail when deployed with different config |
| Transaction semantics | No transaction wrapping → lost consistency |

### Correct approach
~~~yaml
spring:
  jpa:
    open-in-view: false
~~~
Then fix the code correctly:
1. Use **DTO projection** for APIs (only take what's needed) — no lazy at all.
2. Use **fetch join / {{@EntityGraph}}** in repository when child data is genuinely needed.
3. Place {{@Transactional}} at the service layer and **map to DTO inside** the transaction.
4. Enable {{spring.jpa.properties.hibernate.default_batch_fetch_size}} to reduce N+1.

### Production pitfall
- Disabling OSIV is a **behavior** change, not just config: many places accessing lazy outside transactions will break at runtime. Turn this flag on in test environments before going to production.
- With view templates (JPA + Thymeleaf), the clean approach is: fetch enough data in the query, then render — don't let the template activate lazy.
- For entities with lazy {{@ManyToMany}}, {{toString}}/{{equals}} may also touch proxies and cause errors or weird queries.

> Senior tip: enable {{spring.jpa.open-in-view=false}} from project start, then add integration tests for core APIs. If the team isn't ready, turn this flag on for the {{test}} profile so errors surface early. This is one of the highest ROI configuration changes in a Spring Boot project: holds connection less, errors clearer, performance stable.`,
    follow: [
      'Why does {{@Transactional}} at the service layer sometimes not suffice to avoid {{LazyInitializationException}}?',
      'What effect does disabling OSIV have on Thymeleaf templates?'
    ]
  },
  'jpa-004': {
    q: 'How do optimistic locking ({{@Version}}) and pessimistic locking differ? How do you handle {{OptimisticLockException}} in practice?',
    a: `**Summary:** **Optimistic** assumes conflicts are rare: add a {{version}} column, each {{UPDATE}} includes condition {{WHERE version = ?}}; if no row is updated, Hibernate throws {{OptimisticLockException}}. **Pessimistic** locks rows directly in the DB via {{SELECT ... FOR UPDATE}}, holding the lock until the end of the transaction — no conflict for sure but lower throughput and risk of deadlock.

### Comparison
| Criteria | Optimistic ({{@Version}}) | Pessimistic ({{@Lock}}) |
|---|---|---|
| Mechanism | Compare version at update | Row lock in DB |
| Conflict | Detected **after** write | Blocked **before** write |
| Performance | Good for many reads, few writes | Worse under contention |
| Deadlock | None | Yes |
| Use for | Profile, balances, config, counters | Producer, inventory, bank account |

### Optimistic locking
~~~java
@Entity
public class Account {
    @Id private Long id;
    @Version private Long version;     // Hibernate auto-increments version on each update
    private BigDecimal balance;
}
~~~
The generated SQL becomes:
~~~sql
UPDATE account SET balance = ?, version = ? WHERE id = ? AND version = ?
~~~
If {{version}} in the DB has changed (someone else updated), number of updated rows = 0 → Hibernate throws {{OptimisticLockException}}. Spring Data JPA wraps it as {{ObjectOptimisticLockingFailureException}}.

### Conflict handling
1. **Retry with backoff**: re-read state, recalculate, retry (limited attempts, with jitter).
2. **Return 409 Conflict** to client if the business doesn't accept retry.
3. **Use optimistic + idempotency key** concurrently to avoid duplicate transactions.

~~~java
@Retryable(retryFor = ObjectOptimisticLockingFailureException.class,
           maxAttempts = 3, backoff = @Backoff(delay = 50, multiplier = 2))
@Transactional
public void transfer(Long from, Long to, BigDecimal amount) { /* ... */ }
~~~

### Pessimistic locking
~~~java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select a from Account a where a.id = :id")
Optional<Account> findForUpdate(@Param("id") Long id);
~~~

### Production pitfall
- **Retry must run in a fresh transaction**: after {{OptimisticLockException}}, the transaction is marked rollback; retry inside the same transaction eats nothing.
- Pessimistic lock holds the lock even while calling another HTTP service in the transaction → holds lock longer, increases deadlock. Keep transactions short and no external I/O.
- For many tables, standardize lock order to avoid deadlock.
- Don't use pessimistic locks for read-only queries — use {{LockModeType.PESSIMISTIC_READ}} or snapshot.

> Senior tip: pick optimistic first, because it's cheaper and causes less bottleneck. Only switch to pessimistic when the business **requires** serialization (e.g., transferring money in legacy payment systems where the business key is the amount per balance, not the version). For banks, rule is: read with care (optimistic), write with contention on balance consider pessimistic or queue by account key.`,
    follow: [
      'Why must retry on {{OptimisticLockException}} use a new transaction?',
      'How to avoid deadlock when using pessimistic locks across multiple tables?'
    ]
  },
  'jpa-005': {
    q: 'Why does {{GenerationType.IDENTITY}} disable JDBC batching? What is the effective way to generate ids for batch insert and batch update?',
    a: `**Summary:** With {{GenerationType.IDENTITY}}, the database generates the id (identity/auto-increment), and **Hibernate must grab the generated key right after each insert** to place it in the entity → cannot batch commands, each row is one round-trip. To achieve effective batching, you must **generate ids in the application** first: use {{SEQUENCE}} with **pooled optimizer** (PostgreSQL) or {{TABLE}} generator (MySQL).

### Why IDENTITY disables batching
Hibernate flow: call {{INSERT}} immediately per entity to grab {{@GeneratedValue}} → driver must return the key → must do round-trip. Batching requires gathering many {{INSERT}}s into one send, but Hibernate doesn't know the id before insert ⇒ cannot gather.

### Batching config
~~~yaml
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 50
          batch_versioned_data: true
        order_inserts: true
        order_updates: true
~~~

### Generate ids ahead via sequence
~~~java
@Entity
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "order_seq")
    @SequenceGenerator(name = "order_seq", sequenceName = "order_id_seq", allocationSize = 50)
    private Long id;
}
~~~
With {{allocationSize = 50}}, Hibernate grabs **one batch of 50 values** from the sequence then allocates in memory (pooled optimizer) → almost no round-trip for the sequence. Hibernate 6 uses pooled optimizer for {{@SequenceGenerator}} when {{allocationSize > 1}}; select variant ({{pooled}}/{{pooled-lo}}) via {{hibernate.id.optimizer.pooled.preferred}}. Note the DB sequence's {{INCREMENT BY}} must equal {{allocationSize}}.

### Selection by database
| Database | Recommended |
|---|---|
| PostgreSQL | {{SEQUENCE}} + pooled optimizer (sequence short, no locks) |
| MySQL | No sequence → {{TABLE}} generator (has contention) or {{IDENTITY}} (accept no batch) |
| Need many distributed nodes | {{UUID}} — but random id fragments index |

### Batch update and {{@Version}}
The {{UPDATE}} with {{@Version}} is also split if Hibernate doesn't know version in advance → enable {{hibernate.jdbc.batch_versioned_data=true}} to gather the {{UPDATE}}s of the same entity into one batch.

### Production pitfall
- Batching only matters if **same type statement** gathered consecutively → enable {{order_inserts}} and {{order_updates}} so Hibernate sorts by type.
- With large batches, call {{flush()}} + {{clear()}} periodically (e.g., every 50–100 entities) so persistence context doesn't bloat and transaction tree doesn't hold too much memory.
- Measure before/after: round-trip reduction from N to N/50 is a very large improvement in network-latency environments.
- Using {{@GeneratedValue(strategy = GenerationType.AUTO)}}: Hibernate chooses sequence for PostgreSQL but may choose identity for MySQL — specify strategy explicitly to avoid unexpected behavior.

> Senior tip: batching is among the forgotten bottlenecks of performance when importing large datasets. If you insert 100k rows and see linear time increase, check immediately: is {{batch_size}} on, is the id using {{IDENTITY}}, and are {{flush/clear}} called periodically? All three usually resolve 90% of the problem.`,
    follow: [
      'Why can {{@GeneratedValue(strategy = GenerationType.AUTO)}} produce different behavior between PostgreSQL and MySQL?',
      'Why must {{flush}} and {{clear}} be called periodically during batch insert with large quantity?'
    ]
  },
  'jpa-006': {
    q: 'In JPA mapping, how do owning side and inverse side differ? When should you use {{orphanRemoval}} and {{cascade}}, and what risks exist?',
    a: `**Summary:** Both 1-N and N-N relationships have an **owning side** (the side holding the foreign key table or join table) and an **inverse side** (the side {{mappedBy}}). Changes on the owning side are what Hibernate recognizes and generates SQL from. {{orphanRemoval = true}} is used to delete children when removed from the collection; {{cascade}} determines which actions are propagated to the related entity — and {{cascade = REMOVE}} is the classic source of data loss.

### Owning side and inverse side
~~~java
@Entity
public class Order {                       // inverse side (has mappedBy)
    @Id private Long id;
    @OneToMany(mappedBy = "order", cascade = CascadeType.PERSIST)
    private List<Item> items = new ArrayList<>();
}

@Entity
public class Item {                        // owning side: holds order_id
    @Id private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;
}
~~~

- Changing {{item.setOrder(order)}} (owning side) → Hibernate writes {{order_id}} of item ({{INSERT}}/{{UPDATE item SET order_id = ?}}).
- Only {{order.getItems().add(item)}} (inverse side) without setting {{item.order}} → **foreign key not written**, Hibernate ignores changes from the inverse side. Therefore, write a helper {{addItem()}} updating **both sides**.
- For N-N relationships, the default creates a join table; if you need relation attributes (quantity, price at time of placement), use an **join entity** with business meaning instead of a plain join table.

### orphanRemoval
~~~java
@OneToMany(mappedBy = "order", orphanRemoval = true)
private List<Item> items;
~~~
When {{order.getItems().remove(item)}}, Hibernate calls {{DELETE}} for {{item}}. Declare on the parent ({{@OneToMany}} — typically the {{mappedBy}} side) or {{@OneToOne}}; **not** for {{@ManyToMany}}.

### Cascade
| Cascade | Meaning | Risk |
|---|---|---|
| {{PERSIST}} | Save parent saves children | Fine for aggregate root |
| {{REMOVE}} | Delete parent deletes children | **Dangerous**: mass deletion = data loss |
| {{MERGE}}, {{REFRESH}}, {{DETACH}} | Sync state | Usually safe |
| {{ALL}} | Combine all | Not recommended by default |

### Production pitfall
- {{cascade = REMOVE}} combined with deleting the parent entity in a "delete order" business will **also delete child records referencing it in other modules** if the relationship is mapped. Many real-world data loss incidents come from this.
- Enabling {{cascade = ALL}} on {{@ManyToMany}} can cause {{StackOverflow}} when objects reference each other circularly.
- Deleting with {{entityManager.remove()}} deletes children by cascade; if you only want "unlink", use {{orphanRemoval}} and remove from collection.
- Recursive parent-child self-referencing relationships with cascade can cause errors on deletion of the branch.

> Senior tip: use **aggregate root** as the consistent boundary: child objects are only created/modified/deleted through the parent. Then {{cascade = PERSIST}} on the parent is reasonable; {{REMOVE}} should be replaced with {{orphanRemoval}} alongside a clear business rule. If an entity is referenced from many places, it **should not** sit in the cascade graph of any bean.`,
    follow: [
      'When should you use {{orphanRemoval}} instead of {{cascade = REMOVE}}?',
      'Why use a join entity instead of {{@ManyToMany}}?'
    ]
  },
  'jpa-007': {
    q: 'How do first-level and second-level caches of Hibernate differ? When should you enable second-level cache?',
    a: `**Summary:** **First-level cache** IS the persistence context — exists within scope of one transaction/session, always on, unconfigured. **Second-level cache** is Hibernate's cache at SessionFactory scope (whole application, shareable across instances), must be configured and tied to each entity. Plus there is **Spring Cache** ({{@Cacheable}}) at the service layer — a different abstraction, often easier to use than L2.

### Comparison
| Characteristic | L1 | L2 |
|---|---|---|
| Scope | 1 session / transaction | SessionFactory (whole app, shareable across cluster) |
| On by default | Yes | No — must configure |
| Config | – | {{hibernate.cache.use_second_level_cache}} + region factory |
| Tied to entity | Automatically | {{@Cacheable}} on entity class |
| Auto invalidate | On entity update within same session | On entity update via same SessionFactory |
| Good with data written from many places | – | **No** — easy to read stale data |

### Enabling L2
~~~yaml
spring:
  jpa:
    properties:
      hibernate:
        cache:
          use_second_level_cache: true
          region:
            factory_class: jcache     # hibernate-jcache + provider JCache (Ehcache 3, Caffeine jcache...)
        javax:
          cache:
            provider: org.ehcache.jsr107.EhcacheCachingProvider
~~~

~~~java
@Entity
@Cacheable
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Table(name = "products")
public class Product { /* ... */ }
~~~

### Spring Cache — more practical choice often used more
~~~java
@EnableCaching
@Service
public class ProductService {
    @Cacheable(value = "products", key = "#id")
    public Product findById(Long id) { return repo.findById(id).orElseThrow(); }

    @CacheEvict(value = "products", key = "#product.id")
    @Transactional
    public void update(Product product) { repo.save(product); }
}
~~~
Advantages: cache at service layer, can cache **both result DTOs**, easy control of TTL and key, and compatible with many backends (Caffeine, Redis).

### When to enable L2
- Data **read often, written little**, rarely changed (catalog, config, params).
- Many instances reading the same data and can share cache (Redis/Hazelcast) to offload DB.
- Tables long-lived, not sensitive (no personal data).

### When **not** to enable
- Data written from **other systems** (ETL, script SQL, other services not using Hibernate) → cache serves stale data.
- Sensitive data, continuously changing (balances, order status).
- Team can't control invalidation lifecycle → errors hard to trace.

### Production pitfall
- L2 used together for many entities → cache lacks distinct keys; always use region per entity.
- {{@Cacheable}} on method returning entity with **lazy relation** → cache stores proxy, re-reading may error or leak session. Cache DTO instead.
- Cache doesn't auto expire by time in L2 default → data may "freeze" for hours. Configure TTL for Spring Cache.

> Senior tip: before enabling any caching layer, answer these three questions: **(1) can this data be written by another system? (2) how stale is stale data acceptable? (3) who invalidates and by what method?** If you can't answer #3, don't enable cache — you'll create data consistency incidents much harder than just adding a few milliseconds of delay.`,
    follow: [
      'How is L2 cache invalidated when entity is updated?',
      'When should you use Spring Cache instead of Hibernate second-level cache?'
    ]
  }
});
