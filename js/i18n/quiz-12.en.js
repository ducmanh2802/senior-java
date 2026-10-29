/*
 * English translation of js/data/quiz.js — task T409. Format: js/core/i18n.js (content overlay).
 * ids: qz-spring-002 qz-spring-003 qz-spring-004 qz-spring-005 qz-spring-006 qz-jpa-001 qz-jpa-002 qz-jpa-003 qz-jpa-004 qz-jpa-005 qz-jpa-006 qz-db-001 qz-db-002 qz-db-003 qz-db-004
 */
App.i18n.content({
  'qz-spring-002': {
    q: 'A bean with {{@Scope("prototype")}} is injected into a singleton bean. What happens to the prototype bean lifecycle?',
    options: [
      'Every time the singleton calls a method on the prototype field, Spring automatically supplies a new prototype instance',
      'Spring throws IllegalStateException because a prototype bean cannot be injected into a singleton bean',
      'Only one prototype instance is created when the singleton is initialized and retained for the singleton lifetime; subsequent calls share that instance',
      'The prototype instance is destroyed as soon as the request ends, so it cannot be used'
    ],
    explain: `**Correct answer: Only one prototype instance is created when the singleton is initialized and retained for the singleton lifetime; subsequent calls share that instance.**

### Why this is correct
When the container creates the singleton bean, it must supply its dependencies — and resolving a prototype bean at that point creates **one** instance and injects it. The singleton holds a reference to that instance for its entire lifetime, so it technically behaves like a singleton: every request shares one object, which can cause state to leak (for example, one request sees data from a previous request).

The container does **not** manage the prototype bean lifecycle (it does not call {{@PreDestroy}}).

### Why the other options are incorrect
- **A new instance for every method call**: this is the most common misconception. The field is injected only once; to obtain a new instance each time, you must request one from the container again ({{ObjectProvider}}, {{@Lookup}}) or use a scoped proxy ({{proxyMode = ScopedProxyMode.TARGET_CLASS}}).
- **Spring throws an error**: Spring silently allows a prototype to be injected into a singleton, with no error or warning — which is exactly why this trap is so difficult to detect.
- **Destroyed when the request ends**: incorrect; within the singleton context, the container has no concept of "request end". It only knows the singleton lifecycle.

### How to get a truly new prototype each time
~~~java
@Service
class OrderService {
    private final ObjectProvider<AuditLog> auditLogProvider;   // provider, not the bean

    void handle() {
        AuditLog log = auditLogProvider.getObject();   // each call returns a new instance
        // ...
    }
}
~~~

> Senior tip: an easy rule to remember: **a shorter-lived bean (prototype, request, session) should not be injected directly into a longer-lived bean (singleton)**. If necessary, use {{ObjectProvider}}, {{@Lookup}}, or a scoped proxy (Spring automatically uses a proxy for request/session-scoped beans when {{proxyMode}} is declared) to obtain the correct instance when needed. Also remember to manage prototype resources yourself because the container will not clean them up for you.`
  },
  'qz-spring-003': {
    q: 'An {{@Async}} method with a {{void}} return type throws an exception while processing. How is that exception handled?',
    options: [
      'The exception is sent to AsyncUncaughtExceptionHandler (a logger by default), while the caller receives nothing and treats the call as successful',
      'The exception is rethrown on the caller thread and breaks the request being processed',
      'The exception causes the caller transaction to roll back',
      'The exception is swallowed completely, with no trace recorded anywhere'
    ],
    explain: `**Correct answer: The exception is sent to AsyncUncaughtExceptionHandler (a logger by default), while the caller receives nothing and treats the call as successful.**

### Why this is correct
The {{@Async}} method returns {{void}}, so the caller has no Future from which to retrieve the exception. Spring passes an exception thrown inside the method to {{AsyncUncaughtExceptionHandler}}, which by default is a handler that only logs it. With a {{CompletableFuture}} or {{Future}} return type, you can handle the failure directly in the {{exceptionally}} or {{handle}} chain — this is the better approach.

The danger is that an async task runs on a different thread and therefore does **not participate** in the caller transaction (a transaction is bound to a thread). If you call {{@Async}} inside a {{@Transactional}} method, the task may run before, during, or after the caller commits; the caller may commit successfully while the async task fails — leaving inconsistent state. The task may even be unable to read data the caller just wrote because the caller has not committed yet (when necessary, trigger the task after commit using {{@TransactionalEventListener(phase = AFTER_COMMIT)}}).

### Why the other options are incorrect
- **Rethrown on the caller thread**: incorrect; the async method runs on another thread, and the failure is not propagated back.
- **Rolls back the caller transaction**: incorrect, and this is precisely the trap: the async task is not in the caller transaction, so its failure cannot roll back that transaction.
- **Swallowed completely**: incorrect; it is still logged by default. However, a custom handler could swallow the error — deliberately log it in the handler.

### The correct approach
~~~java
@Async("reportExecutor")                         // run on an explicitly named executor
public CompletableFuture<String> doWork() {
    return CompletableFuture.completedFuture(heavyWork());
    // if heavyWork() throws an exception, Spring completes this future exceptionally
}

// caller side:
service.doWork().exceptionally(ex -> {
    log.error("async failed", ex);                   // the error reaches the caller through the future
    return null;
});
~~~

Note: do not call {{CompletableFuture.supplyAsync}} inside an {{@Async}} method — that makes the work asynchronous twice, and the actual work runs on the {{commonPool}} instead of your configured executor. Regarding executors: plain Spring Framework (with no executor bean) uses {{SimpleAsyncTaskExecutor}} — creating a new thread for **every** task; Spring Boot auto-configures a {{ThreadPoolTaskExecutor}} (8 core threads, unbounded queue) — you should still declare your own executor with explicit queue capacity and thread names.

> Senior tip: use {{@Async}} only for work that is **not critical to the main business flow** (sending email, writing logs, updating statistics). If the work must succeed, put it on a durable queue (Kafka, RabbitMQ, SQS) so you have retries and monitoring.`
  },
  'qz-spring-004': {
    q: 'A configuration contains many related properties and must be validated at startup. Which option is best?',
    options: [
      'Use @Value for each property and validate manually in @PostConstruct',
      'Use @Value and reread the value on every use to prevent it from being cached',
      'Use @ConfigurationProperties and catch configuration errors in a controller to return them to the client',
      'Use @ConfigurationProperties with @Validated and constraints such as @NotBlank on fields, so configuration errors surface at startup'
    ],
    explain: `**Correct answer: Use @ConfigurationProperties with @Validated and constraints such as @NotBlank on fields, so configuration errors surface at startup.**

### Why this is correct
{{@ConfigurationProperties}} groups an entire set of properties into a strongly typed object, supports **constructor binding** (immutable, without cumbersome {{@Value}} usage), and, most importantly, supports **validation**: with {{@Validated}} and constraints such as {{@NotBlank}}, {{@Min}}, and {{@Max}}, the application **fails fast at startup** if the configuration is invalid. This is an important principle: invalid configuration should fail during deployment rather than being discovered at 3 a.m. under real traffic.

### Why the other options are incorrect
- **@Value + manual validation in @PostConstruct**: possible but cumbersome, not type-safe, easy to forget checks, and errors still only surface at runtime.
- **@Value and rereading on every use**: {{@Value}} is injected **once** when the bean is created; rereading it does not change the value. To change values over time, you must use {{@RefreshScope}} (Spring Cloud) — and then handle thread-safety.
- **Catch errors in a controller**: entirely the wrong approach. A configuration error is a system error, not a business error from a request; failing at startup is much better.

### Example
~~~java
@Validated
@ConfigurationProperties(prefix = "app.payment")
public record PaymentProperties(
        @NotBlank String provider,
        @Min(1) @Max(100) int timeoutSeconds,
        @NotNull Duration retryDelay) {
}
~~~

> Senior tip: always allow **profiles** and **environment variables** to override files inside the JAR so the same artifact can run in every environment. And do not put secrets in {{application.yml}}: Spring Boot 3 supports references to environment variables or Vault; use that mechanism instead of embedding values directly.`
  },
  'qz-spring-005': {
    q: 'When upgrading from Spring Boot 2 to Spring Boot 3, which statement is correct?',
    options: [
      'Move to Jakarta EE (the jakarta.* namespace), Java 17 or later is required, and every library using javax.* must be upgraded',
      'There are no significant changes; Spring Boot 3 is just a version upgrade',
      'Spring Boot 3 drops support for Spring MVC and only supports WebFlux',
      'Configuration must be migrated from properties files to yaml files'
    ],
    explain: `**Correct answer: Move to Jakarta EE (the jakarta.* namespace), Java 17 or later is required, and every library using javax.* must be upgraded.**

### Why this is correct
The three biggest changes in Spring Boot 3 are:
1. **Jakarta EE 10** (Spring Framework 6 requires at least Jakarta EE 9): all APIs move from {{javax.*}} to {{jakarta.*}} — {{javax.persistence}} → {{jakarta.persistence}}, {{javax.servlet}} → {{jakarta.servlet}}, {{javax.validation}} → {{jakarta.validation}}.
2. **Java 17 is the minimum**: Spring Framework 6 and Hibernate 6 require Java 17, so Java 8 is no longer supported.
3. **Hibernate 6**: a stricter new HQL parser (SQM), changed type mappings, and some API/annotation changes (for example, {{@Where}} is replaced by {{@SQLRestriction}} from 6.3).

There are also: Spring Security 6 removes {{WebSecurityConfigurerAdapter}} in favor of {{SecurityFilterChain}} beans; Spring MVC 6 disables trailing slash matching by default; many properties are renamed (for example, {{spring.redis.*}} becomes {{spring.data.redis.*}}); observability moves to Micrometer Observation/Tracing instead of Spring Cloud Sleuth.

### Why the other options are incorrect
- **Just a version upgrade**: incorrect; this is the upgrade with the largest breaking changes since 2.x.
- **Drops Spring MVC support**: incorrect; Spring MVC remains the most common web model, while WebFlux is still an option for reactive workloads.
- **Yaml is mandatory**: incorrect; Spring Boot supports both {{.properties}} and {{.yml}}.

### A practical migration path
1. Upgrade the JDK to 17.
2. Upgrade dependencies: Spring Boot 3.x, the corresponding Spring Cloud version, and Hibernate 6.
3. Change the {{javax.*}} namespace to {{jakarta.*}} (most IDEs support automated refactoring).
4. Review configuration: renamed properties, security, and actuator.
5. Run the entire test suite, especially database integration tests.

> Senior tip: do not upgrade Spring Boot and change the architecture at the same time. Separate "upgrade dependencies + change namespaces" into its own PR for easier review, then make architectural changes. With Hibernate 6, carefully check HQL queries because the parser is stricter — many queries that "worked" in Hibernate 5 will fail in version 6.`
  },
  'qz-spring-006': {
    q: 'With Spring Boot 3, what is the standard way to return errors from a REST API to the client?',
    options: [
      'Return ResponseEntity with an arbitrary body in each controller, with no centralized handling',
      'Use @RestControllerAdvice with @ExceptionHandler and return ProblemDetail according to RFC 9457 so clients receive a consistent error structure',
      'Catch every exception at the filter layer and return an HTML error page',
      'Use @ControllerAdvice only for logging, and return responses with just a simple HTTP status code'
    ],
    explain: `**Correct answer: Use @RestControllerAdvice with @ExceptionHandler and return ProblemDetail according to RFC 9457 so clients receive a consistent error structure.**

### Why this is correct
Spring Framework 6 provides built-in support for {{ProblemDetail}} according to RFC 7807, now **RFC 9457** (the replacement for RFC 7807, with the same format). This is not the default format for every error: you return {{ProblemDetail}} yourself in a handler, or enable {{spring.mvc.problemdetails.enabled=true}} so Spring Boot uses it for standard Spring MVC exceptions. Combined with {{@RestControllerAdvice}} and {{@ExceptionHandler}}, you have a single place to map exceptions to HTTP status codes and structured error payloads instead of scattering {{try/catch}} blocks across controllers.

~~~java
@RestControllerAdvice
class ApiExceptionHandler {

    @ExceptionHandler(OrderNotFoundException.class)
    ProblemDetail handleNotFound(OrderNotFoundException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setTitle("Order not found");
        pd.setProperty("orderId", ex.getId());
        return pd;
    }
}
~~~

### Why the other options are incorrect
- **Arbitrary bodies in each controller**: easily leads to inconsistent payloads across endpoints and missed unexpected exceptions (the client then receives the default Spring error page).
- **Catch at the filter layer and return HTML**: wrong in both architecture (a filter only sees an exception that escaped DispatcherServlet, by which point the handler context is lost and MVC resolvers have usually already handled it) and format (an API needs JSON, not HTML).
- **Only for logging**: completely loses the benefit of centralized handling, and the client must infer the error from the HTTP status code.

### Important notes
- **Unhandled exceptions** return a 500 error with the default Spring error structure — add {{@ExceptionHandler(Exception.class)}} to return a safe message without exposing internal details.
- **Validation** with {{@Valid}} also goes through {{@RestControllerAdvice}} via {{MethodArgumentNotValidException}}.
- **Do not expose stack traces**: keep {{server.error.include-stacktrace=never}} (the default; do not enable it in production) and always log details on the server.

> Senior tip: design errors to be **machine-readable** from the start: stable business error codes, clear Vietnamese/English messages, and a list of invalid fields for validation failures. The client (mobile app) should display messages based on the error code rather than the message string — then you can change message wording later without breaking the app.`
  },
  'qz-jpa-001': {
    q: 'An endpoint returns a list of {{Order}} objects with {{order.getItems()}}. Hibernate logs show one query for orders followed by N queries for items. What is the cause and the correct fix?',
    options: [
      'The problem is a transaction that lasts too long; simply shortening the transaction will fix it',
      'The missing @Transactional annotation prevents Hibernate from combining the queries',
      'The foreign key column lacks an index; adding an index is sufficient',
      'This is the N+1 select problem: the lazy collection is loaded for each entity, so join fetch, EntityGraph, or @BatchSize is needed'
    ],
    explain: `**Correct answer: This is the N+1 select problem: the lazy collection is loaded for each entity, so join fetch, EntityGraph, or @BatchSize is needed.**

### Why this is correct
By JPA default, {{@OneToMany}}/{{@ManyToMany}} associations are **lazy**, while {{@ManyToOne}}/{{@OneToOne}} associations are **eager** (eager fetching can also cause N+1 when loading with JPQL, so best practice is to declare every association LAZY and fetch deliberately). When you iterate over 100 orders and access {{order.getItems()}}, Hibernate must issue 100 separate SELECT statements — 101 statements in total for one API call. This is the number-one cause of slow endpoints in Spring Boot applications.

The three main solutions are:
- **{{join fetch}}** in the query: one SQL statement retrieves both tables. With Hibernate 6, root entities duplicated by a collection fetch are automatically deduplicated; {{distinct}} is not needed as it was in Hibernate 5.
- **{{@EntityGraph}}**: declare the fetch graph alongside the repository method without writing JPQL.
- **{{@BatchSize}}** (Hibernate): combines N SELECT statements into one with {{IN}}, at the cost of loading extra data for entities that are not used.

### Why the other options are incorrect
- **Long transaction**: shortening the transaction does not reduce the query count; on the contrary, a long transaction holds the connection longer.
- **Missing index**: an index affects the speed of *one* query, not the *number* of queries. A missing index and N+1 are two independent problems that often coexist.
- **Missing @Transactional**: adding or removing a transaction does not change the query count; when the session is closed (and OSIV is disabled), accessing a lazy association causes {{LazyInitializationException}}, not N+1.

### Detecting N+1
~~~text
# application.properties: count statements per session
spring.jpa.properties.hibernate.generate_statistics=true
# print SQL statements (enable only in dev/staging)
logging.level.org.hibernate.SQL=DEBUG
# or use datasource-proxy / p6spy to count queries per request
~~~

In tests, assert the query count to prevent N+1 regressions.

> Senior tip: do not use {{join fetch}} for everything — fetching a collection with a join increases the amount of data loaded and can break pagination (in-memory pagination). Rule of thumb: use {{join fetch}} for {{@ManyToOne}} and {{@OneToOne}}; for a large {{@OneToMany}}, consider separate batched queries or changing the data model.`
  },
  'qz-jpa-002': {
    q: 'In Spring Boot, {{spring.jpa.open-in-view}} defaults to {{true}}. What is the consequence?',
    options: [
      'The session stays open for the entire request, so LazyInitializationException is rare; in exchange, the connection is held longer and queries may occur outside a transaction',
      'The session closes immediately after the repository method returns, so every lazy association throws LazyInitializationException',
      'Disabling OSIV is mandatory because Spring Boot does not support lazy loading in controllers',
      'OSIV only affects transactions and does not affect the session lifecycle'
    ],
    explain: `**Correct answer: The session stays open for the entire request, so LazyInitializationException is rare; in exchange, the connection is held longer and queries may occur outside a transaction.**

### Why this is correct
Open Session In View keeps the {{EntityManager}} open from the beginning to the end of the request. This keeps lazy associations accessible in the controller (so there are fewer {{LazyInitializationException}} errors), but in exchange:
- **The JDBC connection is held longer**: if you call an external API that takes 2 seconds while rendering the response, the connection remains checked out of the pool → the pool can be exhausted under high load.
- **Queries outside a transaction**: lazy loads triggered after commit still execute, violating the assumption that "all data operations occur within a transaction".

### Why the other options are incorrect
- **Session closes immediately after the repository method**: that is the behavior when OSIV is **disabled** — and precisely why you must use {{join fetch}} or a DTO projection when disabling it.
- **Disabling OSIV is mandatory because Spring does not support lazy loading in controllers**: a misunderstanding. Spring supports it well; you simply need to load data deliberately in the service layer.
- **OSIV only affects transactions**: incorrect; it directly affects the session lifecycle and connection hold time.

### Recommended approach
~~~yaml
spring:
  jpa:
    open-in-view: false      # disable OSIV
~~~

Then, in the service layer, preload the required data with {{join fetch}} or switch to a **DTO projection** — this avoids N+1, reduces database load, and decouples the model from the API contract.

> Senior tip: OSIV is a common cause of "running out of connections at peak times" even with a very small pool configuration. Enable {{open-in-view=false}} early and accept that queries must be written more explicitly — in return, you control exactly what is loaded. Combine it with {{hibernate.query.fail_on_pagination_over_collection_fetch=true}} to prevent silent pagination errors when fetching collections.`
  },
  'qz-jpa-003': {
    q: 'Why does {{@GeneratedValue(strategy = GenerationType.IDENTITY)}} prevent batching when inserting many entities?',
    options: [
      'Because Hibernate must run an additional SELECT to retrieve the id for every insert',
      'Because the database generates the id with a trigger, so Hibernate cannot know the id in advance',
      'Because Hibernate needs the id as soon as persist() is called, it must execute INSERT immediately to obtain the generated key and cannot defer it until flush to form a batch',
      'Because hibernate.jdbc.batch_size only applies to UPDATE and DELETE statements and never to INSERT'
    ],
    explain: `**Correct answer: Because Hibernate needs the id as soon as persist() is called, it must execute INSERT immediately to obtain the generated key and cannot defer it until flush to form a batch.**

### Why this is correct
With {{IDENTITY}}, the database generates the primary key itself (auto-increment/identity column), and the value is available only **after** INSERT executes. The persistence context needs the id to manage the entity (as the first-level cache key), so Hibernate must execute INSERT immediately during {{persist()}} and read back the generated key — instead of queueing INSERT statements until flush. This breaks **batching** (Hibernate disables JDBC batch inserts for entities using IDENTITY).

By contrast, with a {{SEQUENCE}} or {{TABLE}} generator, Hibernate obtains a block of ids in advance (according to {{allocationSize}}) and assigns them to objects **before** insertion. INSERT statements can therefore be grouped into batches, providing much better performance for bulk data imports.

### Why the other options are incorrect
- **An additional SELECT to retrieve the id**: incorrect; that is the behavior of an old-style generator based on {{SELECT max(id)}} — and precisely why that generator was removed.
- **Trigger-generated id**: if a trigger generated the id, Hibernate would have even more difficulty obtaining it, and this is not how {{IDENTITY}} works.
- **batch_size does not apply to INSERT**: incorrect; {{hibernate.jdbc.batch_size}} applies to INSERT as well. With SEQUENCE, INSERT statements batch very effectively (with {{order_inserts=true}}).

### Optimizing bulk imports
~~~java
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "order_seq")
@SequenceGenerator(name = "order_seq", sequenceName = "order_seq", allocationSize = 50)
private Long id;
~~~

~~~text
spring.jpa.properties.hibernate.jdbc.batch_size=50
spring.jpa.properties.hibernate.order_inserts=true
~~~

> Senior tip: {{IDENTITY}} is simple and works well for individual inserts; for bulk imports through JPA, use {{SEQUENCE}} (or bypass JPA and use JDBC batch/{{COPY}}). Note that {{allocationSize}} must match the database sequence {{INCREMENT BY}}: Hibernate 6 checks this by default and reports a startup error if they differ; if you disable the check while they differ, instances may allocate duplicate ids and cause duplicate-key errors.`
  },
  'qz-jpa-004': {
    q: 'Two requests modify the same entity with {{@Version}}. What result does the second request receive?',
    options: [
      'The second request overwrites the first request data because Hibernate updates every field',
      'Hibernate throws OptimisticLockException (usually wrapped as ObjectOptimisticLockingFailureException) because the versions do not match',
      'Nothing happens because Hibernate uses a timestamp instead of a version to detect conflicts',
      'Hibernate automatically creates a new record and merges the two changes'
    ],
    explain: `**Correct answer: Hibernate throws OptimisticLockException (usually wrapped as ObjectOptimisticLockingFailureException) because the versions do not match.**

### Why this is correct
{{@Version}} creates a version column in the table. When Hibernate updates the entity, the UPDATE always includes {{WHERE id = ? AND version = ?}} and increments the version at the same time. Both requests read the entity at version = 0; the first request commits and the version increases to 1. The second request UPDATE still has the condition {{version = 0}}, so it matches nothing → 0 rows affected → Hibernate throws {{OptimisticLockException}}.

In Spring, this exception is usually wrapped as {{ObjectOptimisticLockingFailureException}} and can be mapped to HTTP 409 Conflict. This is the mechanism that allows you to **retry** the operation.

### Why the other options are incorrect
- **Overwrites the data**: that is "last write wins" — the undesirable behavior {{@Version}} is designed to prevent.
- **Uses a timestamp instead of a version**: this is not the Hibernate default, and timestamps can collide, making them less reliable than a version counter.
- **Automatically creates a new record and merges**: that is behavior of an audit/versioning mechanism you must implement yourself, not {{@Version}}.

### Handling it in code
~~~java
@Retryable(retryFor = ObjectOptimisticLockingFailureException.class, maxAttempts = 3)
@Transactional
public void updateStock(Long id, int qty) {
    Product p = productRepo.findById(id).orElseThrow();
    p.setStock(p.getStock() - qty);
    productRepo.save(p);          // UPDATE with a version condition
}
~~~

> Senior tip: optimistic locking suits situations with a low expected conflict rate (UI forms, order status updates). For highly contended operations such as deducting inventory during a flash sale, use a pessimistic lock or a conditional SQL update directly to avoid constant retries.`
  },
  'qz-jpa-005': {
    q: 'You run a bulk update using {{@Modifying @Query}} to change the status of many orders. What problem can occur?',
    options: [
      'Bulk updates must use native SQL, so Hibernate HQL syntax cannot be used',
      'Bulk updates are incompatible with @Transactional and will be ignored',
      'A bulk update bypasses the persistence context, so entities already loaded in the same session retain stale values and may overwrite the updated data',
      'A bulk update locks the entire table, so it cannot run concurrently with other queries'
    ],
    explain: `**Correct answer: A bulk update bypasses the persistence context, so entities already loaded in the same session retain stale values and may overwrite the updated data.**

### Why this is correct
Hibernate sends a bulk operation (JPQL {{UPDATE}} / {{DELETE}}) directly to the database, **bypassing** the persistence context. Objects already loaded in the same session therefore retain stale in-memory values. Worse, if such an entity is subsequently modified in another field and flushed (dirty checking, which by default UPDATEs every column), Hibernate writes the stale value back and **overwrites** the data just changed by the bulk update — silently losing an update.

The standard solution is to add {{flushAutomatically = true}} to flush pending changes **before** the bulk operation, and {{clearAutomatically = true}} to clear the persistence context **after** it, forcing subsequent reads to fetch fresh data from the database.

~~~java
@Modifying(clearAutomatically = true, flushAutomatically = true)
@Query("update Order o set o.status = :status where o.id in :ids")
int bulkUpdateStatus(@Param("ids") List<Long> ids, @Param("status") OrderStatus status);
~~~

### Why the other options are incorrect
- **Native SQL is mandatory**: incorrect; using JPQL/HQL syntax for bulk updates is entirely normal.
- **Incompatible with @Transactional**: incorrect; a bulk update **needs** a transaction for atomicity.
- **Locks the entire table**: this can largely happen if you update without a {{WHERE}} clause backed by an index, but it is not an inherent characteristic of Hibernate bulk updates.

### Remember
- A bulk update **does not return entities**, only the number of affected rows.
- {{@Modifying}} without {{@Transactional}} throws {{TransactionRequiredException}}.
- If you need to read the updated data within the same transaction, call {{entityManager.flush()}} and then {{entityManager.clear()}} before querying.

> Senior tip: a bulk update is a double-edged sword — very fast for mass updates, but prone to "reverted data" bugs if you forget to clear the context. My personal rule: use bulk updates when truly needed (thousands of rows); for a few dozen rows, load them and modify them through setters for safety and readability.`
  },
  'qz-jpa-006': {
    q: 'What risks does using Lombok {{@Data}} on a JPA entity create?',
    options: [
      'Lombok @Data generates setters for every field, so it still works normally',
      'Lombok @Data makes the entity final, so it cannot be used with JPA',
      'There is no risk because the framework always manages entity equals and hashCode',
      'Lombok @Data generates equals and hashCode from all fields, including associations; with lazy loading and entities changing after being loaded, using an entity as a Map key or putting it in a HashSet can cause errors'
    ],
    explain: `**Correct answer: Lombok @Data generates equals and hashCode from all fields, including associations; with lazy loading and entities changing after being loaded, using an entity as a Map key or putting it in a HashSet can cause errors.**

### Why this is correct
{{@Data}} generates {{equals}} and {{hashCode}} based on **all** non-static fields. For an entity, this creates three problems:
1. **Association fields**: {{@Data}} calls {{getItems()}} during comparison → triggering lazy loading and potentially causing {{LazyInitializationException}} or N+1 queries during comparison.
2. **Entity changes after loading**: {{hashCode}} changes with the fields → an object already in a {{HashMap}} can no longer be found.
3. **Bidirectional associations**: {{@OneToMany(mappedBy)}} and {{@ManyToOne}} reference each other → {{equals}} can recurse indefinitely (StackOverflow) if they use {{Objects.equals}} on each other.

The safe approach is to annotate the entity with {{@EqualsAndHashCode(onlyExplicitlyIncluded = true)}} and include only a stable **business key** (for example, {{orderCode}}), and use {{@Getter}} and {{@Setter}} instead of {{@Data}}.

### Why the other options are incorrect
- **Still works normally**: incorrect; it compiles, but its behavior is a source of bugs.
- **Makes the entity final**: {{@Data}} does not add {{final}} to fields or the class.
- **The framework always manages equals/hashCode**: JPA defines entity identity by id, but that is the persistence provider concept of identity, not the {{equals}} Java uses when you put an object in a collection.

> Senior tip: the principle is **business identity rather than technical identity**. An entity with an auto-generated {{Long}} id has a {{null}} id before persist and receives a value only afterward, so an id-based hashCode will change midway if the entity is already in a HashSet. If you need to compare entities in code, compare business keys or use {{equals}} on DTOs instead of entities.`
  },
  'qz-db-001': {
    q: 'A table has a composite index on two columns, {{tenant_id}} and {{created_at}}. Which query CANNOT take advantage of this index?',
    options: [
      'SELECT ... WHERE tenant_id = 5 ORDER BY created_at',
      'SELECT ... WHERE tenant_id = 5 AND created_at > now()',
      'SELECT ... WHERE created_at > now()',
      'SELECT ... WHERE tenant_id = 5 AND status = 3'
    ],
    explain: `**Correct answer: SELECT ... WHERE created_at > now()**

### Why this is correct
A composite B-tree index works according to the **leftmost prefix** principle: an index on {{(tenant_id, created_at)}} is sorted by {{tenant_id}} first, then by {{created_at}} within each tenant. It can therefore serve queries filtering by {{tenant_id}}, or by {{tenant_id}} with a condition/ordering on {{created_at}}. If the first column is missing, entries with matching {{created_at}} values are scattered across every tenant, so a contiguous B-tree range cannot be isolated; PostgreSQL 15 usually chooses a Seq Scan (at best, it scans the whole index without narrowing the range). Note: PostgreSQL 18 adds skip scan for cases where the first column has few distinct values, but PostgreSQL 15 does not have it.

A query filtering only by {{created_at}} therefore cannot take advantage of this index, while the other three can (the query filtering by {{tenant_id}} and {{status}} can use the {{tenant_id}} prefix; it just is not a covering index).

### Why the other options are incorrect
- **tenant_id = 5 ORDER BY created_at**: uses the index for both filtering and sort order, which is highly efficient.
- **tenant_id = 5 AND created_at > now()**: uses the entire index; this is the query the index was designed for.
- **tenant_id = 5 AND status = 3**: the index filters by {{tenant_id}}; {{status}} is then applied as an additional filter.

### Index design lessons
- The column order in a composite index must depend on the **query pattern**, not on which order you think is more important.
- If you need to filter independently by {{created_at}}, create a separate index on {{created_at}} — but every index adds write overhead and slows INSERT/UPDATE, so measure first.

> Senior tip: use {{EXPLAIN (ANALYZE, BUFFERS)}} on PostgreSQL or {{EXPLAIN ANALYZE}} on MySQL to confirm that the index is actually selected, and remember that the optimizer only uses an index when the **estimated row count** makes it cheaper than a table scan. For a small table, a sequential scan is faster than an index scan — that is not an error.`
  },
  'qz-db-002': {
    q: 'At the {{READ COMMITTED}} isolation level, which phenomenon can still occur?',
    options: [
      'Dirty read: reading uncommitted data from another transaction',
      'It only occurs when the table lacks a suitable index',
      'No phenomena can occur because READ COMMITTED uses MVCC and is therefore always consistent',
      'Non-repeatable read: reading the same row twice within one transaction returns two different values'
    ],
    explain: `**Correct answer: Non-repeatable read: reading the same row twice within one transaction returns two different values.**

### Why this is correct
Each isolation level prevents different phenomena:
- {{READ COMMITTED}} prevents **dirty reads** — uncommitted data cannot be read.
- But it does **not** prevent **non-repeatable reads** or **phantom reads**: each statement in the transaction sees a snapshot of the data at the time that statement executes. If another transaction commits a change to the row between your two reads, you see two different values.
- You must use {{REPEATABLE READ}} (the default for MySQL InnoDB; PostgreSQL defaults to READ COMMITTED) or {{SERIALIZABLE}} to prevent non-repeatable reads.

Summary table:

| Isolation | Dirty read | Non-repeatable read | Phantom |
|---|---|---|---|
| READ UNCOMMITTED | possible | possible | possible |
| READ COMMITTED | no | possible | possible |
| REPEATABLE READ | no | no | possible under the SQL standard (PostgreSQL: no) |
| SERIALIZABLE | no | no | no |

### Why the other options are incorrect
- **Dirty read**: READ COMMITTED does prevent this.
- **MVCC means no phenomena**: incorrect; MVCC prevents reads from being blocked, not data from differing between two reads.
- **Only occurs without an index**: entirely unrelated to indexes.

> Senior tip: on PostgreSQL, {{REPEATABLE READ}} uses one snapshot for the entire transaction, preventing phantom reads as well (but write skew is still possible, and conflicting updates produce serialization errors). MySQL InnoDB at REPEATABLE READ uses a consistent snapshot for ordinary SELECT statements, and next-key/gap locks for locking reads ({{SELECT ... FOR UPDATE}}); mixing these two read types can still produce phantoms. If the business requires absolute consistency, use {{SERIALIZABLE}} for that transaction or lock explicitly with {{SELECT ... FOR UPDATE}} — and always consider the added latency.`
  },
  'qz-db-003': {
    q: `A node in an {{EXPLAIN ANALYZE}} result (PostgreSQL) looks like this. What does it suggest?
~~~text
->  Index Scan using idx_orders_created_at on orders  (cost=0.43..48211.90 rows=1102 width=64) (actual time=0.051..412.330 rows=1000 loops=1)
      Index Cond: (created_at >= '2026-03-01 00:00:00+07'::timestamp with time zone)
      Filter: (status = 'FAILED'::text)
      Rows Removed by Filter: 999000
~~~`,
    options: [
      'The query is well optimized because the first row was returned after only 0.051 ms',
      'The filter removed nearly 1 million rows, so the current index is ineffective and another index or a rewritten filter condition should be considered',
      'The table is too small to need an index',
      'The execution plan is broken; rerun the statement with the ANALYZE directive'
    ],
    explain: `**Correct answer: The filter removed nearly 1 million rows, so the current index is ineffective and another index or a rewritten filter condition should be considered.**

### Why this is correct
{{Rows Removed by Filter}} is the number of rows the node read (through Index Cond) and then discarded because they did not match the {{Filter}} condition. Here the index only narrows rows by {{created_at}} (1 million rows), while {{status = 'FAILED'}} must be checked on each heap row: reading 1,000,000 rows to retain 1,000 — 99.9% of the work is discarded, and the total node time is **412 ms**.

In {{actual time=0.051..412.330}}, the first number is when the **first row** is returned (startup), and the second is when the **last row** is returned (total) — averaged per loop. Looking only at the first number is a classic trap.

The solution is to put the filter column into the index in the correct order, for example {{(status, created_at)}}, or use a partial index {{WHERE status = 'FAILED'}} if this rare status is frequently queried; Index Cond then narrows the scan to exactly 1,000 rows.

### Why the other options are incorrect
- **Well optimized because of 0.051 ms**: incorrect; 0.051 ms is only startup time. The node takes 412 ms and reads nearly 1 million unnecessary rows.
- **The table is too small**: on the contrary, 1 million removed rows indicates a large table.
- **The execution plan is broken; rerun with ANALYZE**: this is already {{EXPLAIN ANALYZE}} (it actually executes the statement and provides actual figures); the estimated rows=1102 is also very close to the actual 1000, so nothing is "broken".

### A standard query optimization process
1. Examine the plan and look for {{Seq Scan}} on large tables.
2. Check {{Rows Removed by Filter}}, {{Rows Removed by Join Filter}}, and {{Rows Removed by Index Recheck}} — large numbers indicate poor selectivity.
3. Use {{EXPLAIN (ANALYZE, BUFFERS)}} to check for disk reads (shared read).
4. Add an appropriate index, rerun to compare, and verify that the index is actually used.

> Senior tip: always check {{EXPLAIN}} with **the same production data in a staging environment** — optimizer statistics on an empty table lead to incorrect plans. After optimizing, set an alert if {{rows removed by filter}} exceeds a threshold in the pipeline, because this kind of performance problem recurs silently.`
  },
  'qz-db-004': {
    q: 'A table has 50 million rows. Pagination with {{LIMIT 20 OFFSET 1000000}} becomes slower on later pages. What is the cause and the correct fix?',
    options: [
      'A large offset forces the database to read and then discard millions of rows; switch to keyset pagination with an id greater than the last seen value',
      'LIMIT 20 is already too large, so reduce it to 10 rows to reduce database load',
      'Add an index on the id column and a unique index for this column',
      'This is a PostgreSQL bug; migrate the entire system to MySQL'
    ],
    explain: `**Correct answer: A large offset forces the database to read and then discard millions of rows; switch to keyset pagination with an id greater than the last seen value.**

### Why this is correct
With {{OFFSET}}, the database must still **read and discard** the first N rows before returning the next 20. On page 50,000, the database reads 1,000,000 rows and discards almost all of them — cost grows linearly with page depth even though you retrieve only 20 rows. This is why offset pagination works poorly for large tables.

**Keyset (seek) pagination** replaces "skip N rows" with "start after the last value seen":

~~~sql
-- Page 1
SELECT id, name FROM products ORDER BY id LIMIT 20;
-- Page 2, lastId = 999999
SELECT id, name FROM products WHERE id > 999999 ORDER BY id LIMIT 20;
~~~

The query always reads exactly 20 rows, and its speed does not change with page depth.

### Why the other options are incorrect
- **Reduce LIMIT**: changing 20 to 10 does not address the offset cost; 1 million rows still must be skipped.
- **Add an index on id**: a primary-key index almost always already exists, and the issue is the *number of rows read*, not the speed of locating each row.
- **A PostgreSQL bug**: this is standard behavior across relational databases.

### Keyset pagination trade-offs
- **Cannot jump to an arbitrary page**: only forward/backward navigation is possible — if the UI needs "go to page 100", reconsider the requirement.
- **Requires a stable, unique ordering column**: usually a primary key or a composite key column.

> Senior tip: combine the two techniques: use **seek pagination for scrollable pages** and limit offset **to the first few pages** for "go to page N" navigation. For a table that grows over time, consider a composite index on the filter column followed by the id column to optimize both filtering and pagination.`
  }
});
