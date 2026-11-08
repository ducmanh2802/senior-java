/*
 * English translation of js/data/q-spring-data.js — task T174. Format: js/core/i18n.js (content overlay).
 * ids: spring-012 spring-013 spring-014 spring-015 jpa-001 jpa-002 jpa-003 jpa-004 jpa-005 jpa-006 jpa-007
 */
App.i18n.content({
    'spring-012': {
    q: "How do Spring MVC and Spring WebFlux differ? When should you choose WebFlux, and do Java 21 virtual threads change this choice?",
    a: `**Summary:** Spring MVC uses a **blocking** model - each request occupies a thread for the entire processing duration. WebFlux uses a **reactive non-blocking** model - an event loop handles thousands of concurrent requests via backpressure. For systems using JDBC/JPA (blocking), WebFlux provides no benefit; the modern choice is **MVC + virtual threads (Java 21)**.

### Comparison
| Criteria | Spring MVC | Spring WebFlux |
|---|---|---|
| Thread model | Thread-per-request (blocking) | Event loop + non-blocking |
| Concurrency ceiling | Limited by container thread count | Very high, but only when all I/O is truly non-blocking |
| DB driver | JDBC/JPA (blocking) | R2DBC (non-blocking) |
| Blocking code | Normal | **Blocks the event loop -> very dangerous** |
| Backpressure | None (relies on thread count) | Yes, throttles the producer |
| Streaming/SSE/WebSocket | Supported (not optimal) | Excellent |

### Why WebFlux is "not faster" with JPA
WebFlux shines only when the **entire** I/O chain is non-blocking: R2DBC, WebClient, reactive Kafka, SSE. If you still use JPA/Hibernate in the handler, blocking queries hold the event loop -> you lose WebFlux's advantage and add complexity. Combining "WebFlux + JPA" is a sign of a flawed design.

### How virtual threads change the picture
Java 21 (JEP 444) allows creating millions of lightweight threads. Spring Boot 3.2+ supports:
~~~yaml
spring:
  threads:
    virtual:
      enabled: true
~~~
With this, Tomcat handles each request on a virtual thread: **blocking code stays written like normal MVC**, but you are no longer limited by "thread count = concurrent request count". This is a very reasonable default for CRUD systems using JPA.

### Production pitfalls
- **Thread pinning**: on Java 21, a virtual thread can pin its carrier when blocking inside certain {{synchronized}} regions or native methods. Avoid holding a monitor across long blocking I/O; you do not need to replace every {{synchronized}} with {{ReentrantLock}}. JEP 491 (Java 24) removes monitor-induced pinning in these cases.
- {{ThreadLocal}} still works with virtual threads, but memory usage scales with the number of live threads -> avoid storing large objects in {{ThreadLocal}}.
- With virtual threads, the **connection pool must shrink** (the pool is a limited DB resource), not grow.
- Testing: MVC uses {{MockMvc}}, WebFlux uses {{WebTestClient}} - using the wrong test type is a common source of bugs.

### Interview question worth remembering
"When would you **not** choose WebFlux?" - A good answer: when all I/O is blocking (JPA/JDBC), when the system needs low latency for simple requests, or when the team lacks reactive experience - in that case MVC + virtual threads delivers better performance at much lower development cost.

### Real-world example
A team migrated an internal API gateway to WebFlux because it was "faster", but the downstream services still used JPA. They wrapped repository calls in {{Mono.fromCallable(...)}} but forgot {{subscribeOn(Schedulers.boundedElastic())}} -> JDBC blocking calls ran directly on the **event loop** (only a few threads, equal to CPU cores) -> under moderate load, p99 jumped to 4 seconds and every other request stalled. BlockHound (a tool that detects blocking calls on reactive threads) caught 23 spots. The team eventually moved back to Spring MVC + virtual threads ({{spring.threads.virtual.enabled=true}}, Java 21): the code became simple again, throughput matched the fixed WebFlux version, and p99 stabilized at 180 ms. WebFlux was kept for one SSE streaming service with tens of thousands of long-lived open connections - where it truly shines.

### Sample interview answer
"Spring MVC runs each request on a thread with familiar blocking code; WebFlux uses a non-blocking model on a small number of event-loop threads, which is strong when most time is spent waiting on I/O and the entire path is non-blocking. WebFlux does not make an individual request faster; it helps serve many concurrent connections with few threads. If the backend is still blocking JDBC or JPA, the benefit largely disappears, and accidentally running a blocking call on the event loop is worse than MVC. Java 21 virtual threads change the picture: Spring MVC with virtual threads can serve very high concurrency while keeping blocking code easy to read and debug. So I now default to MVC plus virtual threads, and choose WebFlux only for streaming, very many long-lived open connections, or when I need end-to-end backpressure with a reactive driver like R2DBC."

> Senior tip: do not pick WebFlux just because you heard "reactive is the trend". Measure first: if the system is bottlenecked by threads blocked on I/O (DB, HTTP client), switching to virtual threads is a small change with high payoff. Switching to WebFlux means rewriting the entire I/O layer - high cost, only worth it when you truly need backpressure and streaming.`,
    follow: [
      "Why is WebFlux + JPA an anti-pattern?",
      "How do virtual threads affect connection pool sizing?"
    ]
  },
  'spring-013': {
    q: 'How do you handle exceptions centrally in Spring Boot? How are {{@ControllerAdvice}} and {{ProblemDetail}} (RFC 7807/9457) used, and what traps should you avoid?',
    a: `**Summary:** Centralized error handling uses {{@RestControllerAdvice}} + {{@ExceptionHandler}}. Since Spring Framework 6, Spring supports **{{ProblemDetail}}** per RFC 9457 (formerly RFC 7807): you only return a {{ProblemDetail}} and the framework generates an {{application/problem+json}} response with {{type}}, {{title}}, {{status}}, {{detail}} and any extension properties.

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

    // For validation errors, override handleMethodArgumentNotValid if you need a custom format.
}
~~~

### When to extend ResponseEntityExceptionHandler
This class handles many errors raised by Spring MVC, such as 400, 405 and 415. If you extend it, override the corresponding hooks (for example {{handleMethodArgumentNotValid}}) instead of declaring an {{@ExceptionHandler}} that duplicates an exception the parent class has already mapped. On 404: since Spring Framework 6.1 (Boot 3.2), a URL that matches no handler falls through to the static resource handler and throws {{NoResourceFoundException}}; the parent class already maps it to a 404 ProblemDetail, so your advice handles it (override {{handleNoResourceFoundException}} if you need a custom format). In older versions, a 404 by default goes straight to Boot's error page ({{/error}}) and never passes through the advice.

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

### Traps to avoid
1. **Silent catch-all**: {{@ExceptionHandler(Exception.class)}} returning 500 with {{ex.getMessage()}} leaks internal details (SQL statements, file paths) to the outside. You must log the root cause on the server and return a neutral message to the client.
2. **Lost stack trace in logs**: if you only return the ProblemDetail without logging, production incidents become very hard to trace.
3. **Catching too broadly**: catching {{Exception.class}} swallows serious system errors and hides bugs.
4. **Errors outside the dispatcher**: exceptions thrown in filters, interceptors, or async tasks do not go through {{@ControllerAdvice}} — you have to handle them separately.
5. **No correlation id**: the client reports an error but there is no identifier to search the logs with.

### Production pitfall
- Consider role-based access: clients entitled to see details get the detailed message, other clients only see the error code.
- {{ProblemDetail}} content can be cached by a CDN/proxy — remember to set no-cache headers on error responses.
- Do not put internal information in {{detail}} when the error is user-caused; put the details in the log together with {{traceId}}.

> Senior tip: standardize the errors of the whole system around **business error codes** ({{code}}) instead of English message strings — the client renders by code, and you can change the message in code without breaking the client. Alongside that, always return a {{traceId}} so you can find the log within 30 seconds when a user calls to report an error.`,
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
    q: "How does the persistence context work? How do entity states, dirty checking, and flush mode affect data writes?",
    a: `**Summary:** The persistence context (Hibernate's {{EntityManager}}/Session) is a **first-level cache** and **identity map**: within one transaction, each loaded entity exists as a **single** Java object, and any changes to that object are compared by Hibernate against a snapshot taken at load time during flush to generate {{UPDATE}} statements - this is **dirty checking**. The four entity states are: transient, persistent (managed), detached, and removed.

### The four states
| State | Meaning | Are field changes written? |
|---|---|---|
| Transient | Newly {{new}}ed, not attached to the context | No |
| Persistent / Managed | Loaded or persisted in the context | **Yes** - dirty checking |
| Detached | {{detach}}ed or the session was closed | No (must {{merge}}) |
| Removed | Marked for deletion | Deleted on flush |

### Dirty checking
~~~java
@Transactional
public void rename(Long id, String name) {
    Customer c = customerRepo.findById(id).orElseThrow();  // persistent
    c.setName(name);   // no explicit update, no save() needed
    // on commit -> Hibernate compares snapshot -> UPDATE
}
~~~
Two conditions for dirty checking to work correctly:
1. The entity must be managed in the context.
2. The field must **not** be {{final}} - Hibernate cannot assign final fields via reflection.

### What is flush
Flush = push the changes in the context down to the DB (issue {{INSERT}}/{{UPDATE}}/{{DELETE}}). Hibernate flushes:
- before the transaction **commits**;
- before running a **JPQL query** that touches a table being modified (auto-flush) - so the query sees the latest data.

Flush modes:
| FlushMode | Behavior |
|---|---|
| {{AUTO}} (default) | Flush when needed (as above) |
| {{COMMIT}} | Flush only on commit -> a query inside the **same** transaction may read **stale** data (changes not yet flushed) |
| {{MANUAL}} | Never auto-flush, you must call {{session.flush()}} |

### Production pitfalls
- **Entity "dirtied" after rollback**: the DB transaction rolls back, but the object in the context still holds the changes. If the context is reused (e.g. in a long-running flow), call {{clear()}} after handling the error.
- Using {{merge}} on a detached entity creates a **managed copy**; if you keep a reference to the original, later changes to it will not be written.
- {{equals}}/{{hashCode}} based on {{getId()}}: before persist, {{getId()}} is {{null}} -> the entity can be "lost" inside a {{HashSet}}.
- Do not use entities as API DTOs: this triggers hidden lazy loading, leaks sensitive fields, and easily causes N+1 during serialization.

### Real-world example
A job updated prices for 300,000 products inside **one** transaction: {{findAll()}} then modified each entity. The persistence context held all 300,000 entities **plus their snapshots** for dirty checking -> heap grew to 3.5 GB, and at flush Hibernate compared every entity to its snapshot -> it took 11 minutes with constant full GCs. Fix: process in batches of 1,000 entities, and after each batch {{flush()}} then {{clear()}} to release the persistence context, and enable JDBC batching ({{hibernate.jdbc.batch_size=50}}, {{order_updates=true}}); for a bulk update that applies the same formula to many rows, use a bulk {{UPDATE}} statement (note: bulk update bypasses the persistence context, so you must clear it). Time dropped to 40 seconds, peak heap to ~300 MB. Another bug in the same job: reading an entity under {{@Transactional(readOnly = true)}} then calling a setter to "normalize for display" - with readOnly, Hibernate (Spring 5.1+) sets flush mode to MANUAL so it does not write; but earlier, in a non-readOnly method, the same action had silently written to the DB.

### Sample interview answer
"The persistence context is a first-level cache tied to the EntityManager, usually one transaction. An entity has four states: transient means a new object not yet associated; managed means the context is tracking it; detached means it left the context, for example after the transaction ended; removed means marked for deletion. For a managed entity, Hibernate keeps a snapshot from load time and compares on flush to generate UPDATE automatically, which is dirty checking, so calling a setter is enough without save. The default flush mode is AUTO, which happens before commit and before a query that could be affected. Practical consequences: processing hundreds of thousands of entities in one transaction bloats memory and slows flush, so I batch, flush and clear after each batch, and enable JDBC batching; and I am careful with setters on managed entities because they will be written to the DB."

> Senior tip: remember the rule "**managed = changes are auto-saved**". When debugging, if a field change is not reflected in the DB, check immediately: is the object still managed (is the session still open, was it {{detach}}ed), is the field {{final}}, and did the transaction actually commit?`,
    follow: [
      "Why can {{merge}} on a detached entity create a copy and cause confusion?",
      "In which cases does auto-flush occur and how does it affect query results?"
    ]
  },
    'jpa-003': {
    q: "When does {{LazyInitializationException}} occur? Should Open Session In View be enabled or disabled, and why?",
    a: `**Summary:** Lazy loading only creates a **proxy**; the real query runs when you access a field on that proxy. If that access happens **after the session is closed** (the transaction ended), Hibernate has no connection to run the query -> {{LazyInitializationException}}. Open Session In View (OSIV) keeps the session open for the whole HTTP request, so it hides this error, but it holds the DB connection longer and lets N+1 explode. **Recommendation: disable OSIV.**

### When it is thrown
~~~text
service.getOrder(id)   -> @Transactional: load order, session closes when method returns
controller returns DTO -> calls order.getItems() to map -> NO session left -> boom
~~~

Three common causes:
1. Accessing a lazy collection **outside** a transaction.
2. Accessing lazy data in the view/template layer (Thymeleaf) after the transaction closed.
3. Serializing an entity to JSON with Jackson **outside** a transaction -> Jackson calls getters -> touches lazy proxies.

### What OSIV is
{{spring.jpa.open-in-view}} defaults to **true** in Spring Boot: Spring opens an {{EntityManager}} before handling the request and closes it after rendering finishes. As a result, lazy errors in the view layer "disappear".

### Why it should be disabled
| Problem | Explanation |
|---|---|
| Holds connection longer | Session stays open for the whole request -> the connection is held even when no query runs |
| Hides errors | N+1 bugs and mapping issues stay hidden until production |
| Hidden dependency | A method without {{@Transactional}} "works" in dev but fails under a different deployment config |
| Transaction semantics | No wrapping transaction -> lost consistency guarantees |

### The right approach
~~~yaml
spring:
  jpa:
    open-in-view: false
~~~
Then fix the code properly:
1. Use **DTO projections** for APIs (fetch only what is needed) - no lazy involved.
2. Use **fetch join / {{@EntityGraph}}** in the repository when child data is genuinely needed.
3. Put {{@Transactional}} on the service layer and **map to DTO inside** the transaction.
4. Enable {{spring.jpa.properties.hibernate.default_batch_fetch_size}} to reduce N+1.

### Production pitfalls
- Disabling OSIV is a **behavior** change, not just a config tweak: many places that access lazy data outside transactions will blow up at runtime. Enable this flag in the test environment before production.
- With view templates (JPA + Thymeleaf), the clean approach is: fetch all required data in the query, then render - do not let the template trigger lazy loading.
- For entities with a lazy {{@ManyToMany}}, default {{toString}}/{{equals}} can also touch proxies and cause errors or strange queries.

### Real-world example
An API returning a list of orders worked fine while Open Session In View was enabled (Spring Boot's default, with a startup warning). But every request kept the session open from start until JSON serialization finished: Jackson traversed {{order.items}}, {{order.customer}} -> **lazy loading** fired hundreds of queries during rendering, and the connection was held for the whole request, including a 2-second external API call. Under load, the 30-connection pool was exhausted. Disabling OSIV ({{spring.jpa.open-in-view=false}}) exposed {{LazyInitializationException}} across 17 endpoints - exactly 17 places that had been silently running N+1. Each endpoint was fixed with a DTO projection or an {{@EntityGraph}} in the service; the list API's query count dropped from about 210 to 3, and average connection hold time per request fell from 1.4 seconds to 35 ms.

### Sample interview answer
"LazyInitializationException happens when you access an unloaded lazy association after the persistence context has closed, typically when an entity is returned from a service and the controller or Jackson touches that association. Open Session In View keeps the session open until the request ends so the exception disappears, and Spring Boot enables it by default. I turn it off because it hides problems: lazy loading scatters during JSON rendering and causes hard-to-see N+1, and the connection is held for the whole request, even while calling external APIs, so the pool can be exhausted under load. The right approach is for the service to decide exactly what data is needed: return a DTO or projection, use JOIN FETCH or an EntityGraph for required associations, and never return entities directly to the controller. When disabling OSIV on an existing system, every exception it reveals is an N+1 spot that needs fixing."

> Senior tip: enable {{spring.jpa.open-in-view=false}} from the start of a project, then add integration tests for the main APIs. If the team is not ready, turn this flag on in the {{test}} profile to surface errors early. This is one of the highest-ROI configuration changes in a Spring Boot project: fewer held connections, clearer errors, and more stable performance.`,
    follow: [
      "Why is {{@Transactional}} on the service layer sometimes not enough to avoid {{LazyInitializationException}}?",
      "How does disabling OSIV affect Thymeleaf templates?"
    ]
  },
    'jpa-004': {
    q: "How do optimistic locking ({{@Version}}) and pessimistic locking differ? How do you handle {{OptimisticLockException}} in practice?",
    a: `**Summary:** **Optimistic** locking assumes conflicts are rare: add a {{version}} column, and every {{UPDATE}} includes {{WHERE version = ?}}; if no row is updated, Hibernate throws {{OptimisticLockException}}. **Pessimistic** locking locks the row in the DB immediately via {{SELECT ... FOR UPDATE}}, holding the lock until the transaction ends - it guarantees no conflict but reduces throughput and risks deadlocks.

### Comparison
| Criteria | Optimistic ({{@Version}}) | Pessimistic ({{@Lock}}) |
|---|---|---|
| Mechanism | Compare version on update | Lock the row in the DB |
| Conflict | Detected **after** the write | Blocked **before** the write |
| Performance | Good for read-heavy, write-light | Degrades under contention |
| Deadlock | No | Yes |
| Use for | Profile, balance, config, counter | Stock, inventory, bank account |

### Optimistic locking
~~~java
@Entity
public class Account {
    @Id private Long id;
    @Version private Long version;     // Hibernate auto-increments on each update
    private BigDecimal balance;
}
~~~
The generated SQL looks like:
~~~sql
UPDATE account SET balance = ?, version = ? WHERE id = ? AND version = ?
~~~
If the {{version}} in the DB has changed (someone else just updated it), the update affects 0 rows -> Hibernate throws {{OptimisticLockException}}. Spring Data JPA wraps it as {{ObjectOptimisticLockingFailureException}}.

### Handling conflicts
1. **Retry with backoff**: re-read state, recompute, try again (limit attempts, add jitter).
2. **Return 409 Conflict** to the client if the business does not accept retries.
3. **Combine optimistic locking with an idempotency key** to avoid creating duplicate transactions.

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

### Production pitfalls
- **Retry must run in a new transaction**: after {{OptimisticLockException}}, the transaction is marked rollback-only; retrying inside the same transaction will not work.
- Pessimistic lock is held even while you call an external HTTP service inside the transaction -> the lock is held longer, increasing deadlock risk. Keep transactions short and avoid external I/O.
- With multiple tables, standardize lock order to avoid deadlocks.
- Do not use pessimistic locks for read-only queries - use {{LockModeType.PESSIMISTIC_READ}} or a snapshot instead.

### Real-world example
An inventory management screen let multiple staff edit the same product. With no locking: staff A changed the price, staff B (whose form had been open earlier) changed the description and saved -> it **overwrote** A's new price with the old one; 46 products sold at the wrong price during a promotion. Adding {{@Version}}: the second save got {{ObjectOptimisticLockingFailureException}} -> the API returned 409, the UI showed "This product was updated by someone else, please reload." For the order flow deducting stock (hundreds of requests/second on the same hot SKU), optimistic locking caused constant retries, so the team used a conditional atomic UPDATE ({{qty = qty - :n WHERE qty >= :n}}) for that part. Rule of thumb: user edit forms -> optimistic + 409; hot quantity counters -> atomic statement; short flows that need strict ordering -> {{PESSIMISTIC_WRITE}} with a timeout.

### Sample interview answer
"Optimistic locking assumes conflicts are rare: the entity has a version column, UPDATE includes a condition on the version that was read and increments it; if no row is updated it means someone else modified it, Hibernate throws OptimisticLockException and Spring translates it to ObjectOptimisticLockingFailureException. Nothing is locked in the DB so reads are not blocked. Pessimistic locking locks the row on read with SELECT FOR UPDATE, forcing others to wait; it fits frequent conflicts and short operations, and needs a lock timeout and a consistent lock order to avoid deadlocks. Handling OptimisticLockException depends on context: for a user form, return 409 and ask to reload, sending the version down to the client; for automated processing, re-read and retry a few times with backoff. For incrementing or decrementing very hot counters, I use an atomic UPDATE instead of either approach."

> Senior tip: choose optimistic first, because it is cheaper and does not create bottlenecks. Only switch to pessimistic when the business **must** serialize (for example, debiting money in a legacy payment system where the business key is the amount against the balance, not a version). For banking, the rule is: read with optimistic in mind; for contended writes on balances, consider pessimistic locking or a queue keyed by account.`,
    follow: [
      "Why must a retry on {{OptimisticLockException}} run in a new transaction?",
      "How do you avoid deadlocks when using pessimistic locks across multiple tables?"
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
    q: "In JPA relationship mapping, how do the owning side and inverse side differ? When should you use {{orphanRemoval}} and {{cascade}}, and how dangerous are they?",
    a: `**Summary:** Both 1-N and N-N relationships have an **owning side** (the side that holds the foreign key or join table) and an **inverse side** (the side with {{mappedBy}}). Only changes on the owning side are recognized by Hibernate and turned into SQL. {{orphanRemoval = true}} deletes a child when it is removed from the collection; {{cascade}} decides which operations propagate to associated entities - and {{cascade = REMOVE}} is a classic source of data loss.

### Owning side and inverse side
~~~java
@Entity
public class Order {                       // inverse side (has mappedBy)
    @Id private Long id;
    @OneToMany(mappedBy = "order", cascade = CascadeType.PERSIST)
    private List<Item> items = new ArrayList<>();
}

@Entity
public class Item {                        // owning side: holds the foreign key order_id
    @Id private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;
}
~~~
- Updating {{item.setOrder(order)}} (owning side) -> Hibernate writes the item's {{order_id}} ({{INSERT}}/{{UPDATE item SET order_id = ?}}).
- Only calling {{order.getItems().add(item)}} (inverse side) without setting {{item.order}} -> the **foreign key is not written**, Hibernate ignores the change from the inverse side. Therefore, write a helper {{addItem()}} that updates **both sides**.
- N-N relationships create a join table by default; when you need attributes on the relationship itself (quantity, price at order time), use a **join entity** with business meaning instead of a plain join table.

### orphanRemoval
~~~java
@OneToMany(mappedBy = "order", orphanRemoval = true)
private List<Item> items;
~~~
When {{order.getItems().remove(item)}}, Hibernate issues {{DELETE}} for {{item}}. Declare it on the parent side ({{@OneToMany}} - typically the {{mappedBy}} side) or {{@OneToOne}}; there is **no** {{orphanRemoval}} for {{@ManyToMany}}.

### Cascade
| Cascade | Meaning | Risk |
|---|---|---|
| {{PERSIST}} | Persisting the parent persists children | Good fit for an aggregate root |
| {{REMOVE}} | Removing the parent removes children | **Dangerous**: bulk deletion means data loss |
| {{MERGE}}, {{REFRESH}}, {{DETACH}} | State synchronization | Usually safe |
| {{ALL}} | All of the above | Should not be the default |

### Production pitfalls
- {{cascade = REMOVE}} combined with deleting the parent in a "cancel order" flow will **also delete child records referenced by other modules** if the relationship is mapped. Many real-world data loss incidents come from this.
- Enabling {{cascade = ALL}} on {{@ManyToMany}} can cause {{StackOverflowError}} when objects reference each other.
- Deleting via {{entityManager.remove()}} deletes children per cascade; if you only want to "unlink", use {{orphanRemoval}} and remove from the collection.
- A self-referencing parent-child relationship with cascade can cause errors when deleting a whole branch.

### Under the hood: Hibernate only looks at the owning side
On flush, Hibernate generates the foreign key SQL **based on the owning side** (the side with {{@JoinColumn}}, usually {{@ManyToOne}}). The {{mappedBy}} side ({{@OneToMany(mappedBy = "order")}}) is only a "mirror" for convenience: adding an element to {{order.getItems()}} without setting {{item.setOrder(order)}} leaves the foreign key **unwritten** (the order_id column stays NULL or keeps its old value). That is why you need a helper method that synchronizes both sides ({{order.addItem(item)}} sets both). {{orphanRemoval = true}}: an element removed from the collection is **DELETE**d; {{cascade = REMOVE}}: deleting the parent deletes the children. {{CascadeType.ALL}} on {{@ManyToOne}} (child -> parent) is a trap: deleting a single child row can delete the parent and every other child.

### Real-world example
An order edit screen submitted a new list of line items; the code did {{order.setItems(newItems)}} (replacing the whole collection) on a relationship with {{orphanRemoval = true}}. Hibernate threw "A collection with cascade=all-delete-orphan was no longer referenced" on some requests; in an earlier quick fix, a dev removed orphanRemoval -> line items removed from the order stayed in the DB with the old order_id, and revenue reports included those deleted lines (about 1.5% overstatement over 2 weeks). Correct fix: keep orphanRemoval, update **the existing collection in place** ({{items.clear(); items.addAll(...)}} or reconcile by id), use a helper that syncs both sides; add a test that checks the row count in the DB after editing an order.

### Sample interview answer
"In a bidirectional relationship, the owning side is the one that holds the foreign key, usually the ManyToOne with JoinColumn; the inverse side is the one with mappedBy. Hibernate only uses the owning side to write the foreign key, so adding to the inverse side's collection without setting the other side writes nothing. I always write a helper method that synchronizes both sides. Cascade propagates operations like persist or remove from parent to child and fits a composition such as order and line items; orphanRemoval deletes a child when it is removed from the collection. The danger is putting cascade ALL or REMOVE on the wrong side, for example on a ManyToOne from child up to parent, which can delete shared data; and replacing the whole collection with a setter on an orphanRemoval relationship causes errors - you must modify the existing collection in place."

> Senior tip: use an **aggregate root** as the consistency boundary: child objects are only created/modified/deleted through the parent. Then {{cascade = PERSIST}} on the parent is reasonable, while {{REMOVE}} should be replaced by {{orphanRemoval}} with a clear business rule. If an entity is referenced from many places, it **should not** sit inside the cascade graph of any entity.`,
    follow: [
      "When should you use {{orphanRemoval}} instead of {{cascade = REMOVE}}?",
      "Why use a join entity instead of a plain {{@ManyToMany}}?"
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
