/*
 * English translation of js/data/q-kotlin.js — task T373. Format: js/core/i18n.js (content overlay).
 * ids: kotlin-011 kotlin-012 kotlin-013 kotlin-014 kotlin-015 kotlin-016 kotlin-017 kotlin-018
 */
App.i18n.content({
  'kotlin-011': {
    q: 'When receiving JSON into a Kotlin DTO, does the compiler\'s null-safety protect you? How do you configure Jackson and validation to avoid turning data errors into NPEs in your service?',
    a: `**Summary:** Kotlin null-safety is only a compile-time constraint; JSON processed via Jackson uses reflection, so nulls can still slip through if configuration is missing or DTOs are declared incorrectly. Use {{jackson-module-kotlin}}, clearly distinguish between "missing field" and "null", validate at the boundary, and map to non-nullable domain types.

### Why null-safety is not automatic via JSON
The JVM doesn't carry full non-null information in bytecode that Jackson can use by default. For data classes without a no-arg constructor, Jackson lacks an initialization mechanism and often throws {{InvalidDefinitionException}} without the Kotlin module. With the module, Jackson uses Kotlin reflection to invoke the primary constructor and verify the nullability of each parameter.

This differs from frameworks using reflection/field access: Hibernate, certain mappers, or code using {{Unsafe}} can assign nulls to non-nullable Kotlin fields. Therefore, do not rely on null-safety as a runtime protection layer at every boundary.

~~~kotlin
data class CreateUserRequest(
    val email: String,              // required: missing or null both error
    val age: Int?,                  // allowed to be missing -> null
    val newsletter: Boolean = false // missing -> use default
)
~~~

### Behaviors to verify
- Missing {{email}} or sending {{"email": null}} causes jackson-module-kotlin to throw {{MissingKotlinParameterException}} (a subclass of {{MismatchedInputException}}). Spring MVC wraps this as {{HttpMessageNotReadableException}} and defaults to returning a 400; your job is to return a clear error message with the field name (via {{@RestControllerAdvice}}), without exposing the stack trace.
- {{age}} being absent and {{age: null}} both become {{null}}: Kotlin cannot distinguish if only {{Int?}} is used. For PATCH, you need a wrapper like {{JsonNullable}}, {{Optional}}, or a {{FieldUpdate}} type with a missing state.
- {{newsletter}} being absent receives the default; explicitly sending null remains an error because the type is non-nullable.
- Spring Boot auto-registers {{jackson-module-kotlin}} when on the classpath, but if you create an {{ObjectMapper}} manually, you must register it yourself.

### Validation and DTOs
Bean Validation on Kotlin properties requires the correct annotation target. By default, annotations might land on the constructor parameter, whereas validators read fields/getters:

~~~kotlin
data class CreateUserRequest(
    @field:NotBlank val email: String,
    @field:Min(0) val age: Int?
)
~~~

- {{@JsonProperty(required = true)}} is not a substitute for business validation.
- Do not use {{Double}} for money; use {{Long}} (smallest unit) or {{BigDecimal}} and configure the serializer explicitly.
- Consider {{FAIL_ON_UNKNOWN_PROPERTIES}}: enable to catch typos, disable for forward compatibility; choose according to the API contract and document it.
- Responses should use explicit DTOs, not serialize JPA entities due to lazy loading and cyclic references.

### Pitfall production
- Nullable DTOs leaking into services forcing ubiquitous {{?.}}; validate once in the controller and return guaranteed domain types.
- Using {{!!}} after binding for brevity transforms data errors into 500s, losing context.
- Log payloads containing PII; only log the request ID, error code, and the name of the erroneous field.
- Test all combinations: missing fields, nulls, incorrect types, defaults, unknown fields; use JSON fixtures rather than constructing objects manually.

> Senior tip: Treat JSON payloads as untrusted input just like HTML forms. A set of contract tests with real fixtures, fail-fast enabled, and unified 400 error codes helps prevent most "NPE in service" incidents where the real cause is deserialization.`,
    follow: ['How does the difference between a missing field and a null field affect PATCH APIs?', 'Why is {{@field:NotBlank}} necessary instead of {{@NotBlank}}?', 'How do you configure fail-fast Jackson for production?']
  },
  'kotlin-012': {
    q: 'You use {{suspend fun}} in a Spring controller. What happens to transactions, SecurityContext, and MDC when a coroutine resumes on a different thread, and how do you handle it?',
    a: `**Summary:** Spring MVC and WebFlux both support {{suspend fun}} in controllers, but the mechanics differ: MVC runs on async servlets, while WebFlux runs on an event loop with non-blocking chains. The danger is that thread-bound state like {{@Transactional}} JDBC, {{SecurityContext}}, MDC, and request attributes do not automatically follow the coroutine when it resumes on a different thread.

### How Spring runs suspend functions
Spring MVC since Spring Framework 5.3 supports suspend controller methods (WebFlux since 5.2): the framework calls via a coroutine bridge, returns an async result, and releases the request thread at the suspension point. However, it does not turn JDBC into non-blocking; concurrent request numbers remain limited by the Tomcat thread pool, DB connection pool, and other resources.

WebFlux supports {{suspend fun}} and {{Flow}}; {{kotlinx-coroutines-reactor}} handles conversions with {{Mono}}/{{Flux}}. On the event loop, a blocking JDBC call can block the entire processing loop for multiple requests, so switch to {{Dispatchers.IO}} or use reactive drivers.

~~~kotlin
@RestController
class OrderController(private val service: OrderService) {
    @GetMapping("/orders/{id}")
    suspend fun get(@PathVariable id: Long): OrderDto =
        withContext(Dispatchers.IO) {   // encapsulate blocking part
            service.load(id)
        }
}
~~~

### Transaction: the easiest place to fail
Spring's {{@Transactional}} with JDBC/JPA relies on transactions bound to the current thread ({{ThreadLocal}}). When a coroutine suspends and resumes on another thread, the open connection/transaction does not automatically follow. Spring only supports {{@Transactional}} on {{suspend fun}} when using **ReactiveTransactionManager** (e.g., R2DBC), as the transaction is held in the Reactor Context, not ThreadLocal. With JDBC/JPA, do not assume it's correct just because the code compiles.

Safe approach:
- Write integration tests with real rollback, running the suspend method through the Spring proxy, checking data after failure.
- With JDBC, wrap all DB operations in a suspend function running on the same dispatcher and use {{TransactionTemplate}} if fine-grained control is needed.
- Do not call {{runBlocking}} in controllers or filters; it holds the thread and easily causes starvation.
- With WebFlux + R2DBC, use {{TransactionalOperator}} and verify the transaction lifecycle through suspension.

### Context propagation
- MDC: Add {{MDCContext}} from {{kotlinx-coroutines-slf4j}}, or pass the request ID explicitly in the context.
- Security: {{SecurityContextHolder}} is thread-local by default; after resuming on a different thread, authentication may be lost. Use Spring 6/Micrometer context propagation or capture/restore explicitly, and test endpoints requiring permissions.
- Tenant, locale, and request attributes face the same issue; do not assume they remain "naturally" available.

### Cancellation and errors
- WebFlux might cancel when the client disconnects; do not swallow {{CancellationException}}.
- {{withTimeout}} cancels the coroutine but does not rollback external side effects; idempotency or compensation is required.
- Do not use {{runCatching}} around a suspend call without rethrowing {{CancellationException}}.

### Choosing MVC vs WebFlux
- MVC + coroutine is primarily for readable sequential code, not for increasing throughput.
- WebFlux only provides benefits when the entire chain is non-blocking: WebClient, R2DBC, Kafka reactive; a single blocking JDBC call can break the model.
- Measure p95/p99, queue time, and connection wait before concluding.

> Senior tip: After adding suspend, re-run security tests and rollback tests; these two types of failures typically do not emerge in unit tests but appear only when coroutines resume on different threads in real environments.` ,
    follow: ['Why can {{@Transactional}} JDBC lose transactions after coroutine resumption?', 'How do you propagate SecurityContext and MDC through dispatchers?', 'When does MVC + coroutine fail to increase throughput?']
  },
  'kotlin-013': {
    q: 'You are designing a tier to call multiple dependencies in parallel using coroutines. How should structured concurrency, cancellation, and {{Dispatchers.IO}} be limited to prevent DB pool exhaustion?',
    a: `**Summary:** Structured concurrency forces all child coroutines into a scope with a clear lifecycle: the parent waits for children, and if a child fails, the group is canceled (except in {{supervisorScope}}). {{Dispatchers.IO}} is not an infinite pool — by default it has about 64 threads — so you must limit concurrency according to DB pools, HTTP clients, and downstream rate limits.

### Scope tree and error propagation
{{coroutineScope}} creates a sub-scope: if one branch throws an error, sibling branches are canceled and the error is propagated outward. {{supervisorScope}} isolates errors in each branch, suitable when a widget failure shouldn't break the entire dashboard.

~~~kotlin
suspend fun dashboard(userId: Long): Dashboard = coroutineScope {
    val profile = async { profileClient.fetch(userId) }
    val orders = async { orderClient.recent(userId) }
    Dashboard(profile.await(), orders.await()) // error in one branch -> cancels sibling
}
~~~

Inside {{coroutineScope}}, if a child coroutine fails (whether via {{launch}} or {{async}}), it **immediately** cancels the parent scope and sibling branches; {{coroutineScope}} waits for all children to terminate before propagating the error. The difference between the two builders is clear in the **root** coroutine or in {{supervisorScope}}: {{launch}} has no receiver for the result, so the exception goes to {{CoroutineExceptionHandler}}, while {{async}} holds the exception in {{Deferred}} and throws it when {{await}} is called. Therefore, in {{supervisorScope}}, an {{async}} that fails without being {{await}}-ed is silently ignored.

### Cancellation is cooperative
Coroutines only stop at suspension points or when {{ensureActive()}} is called; tight CPU loops do not stop automatically. Blocking JDBC calls cannot be canceled; {{runInterruptible}} is only useful if the driver respects interrupts. Cleanups in {{finally}} should avoid suspension, or be wrapped in {{withContext(NonCancellable)}} for mandatory cleanup.

Do not catch {{CancellationException}} and then return a result normally: this breaks structured concurrency and causes requests already canceled to continue writing data.

### Dispatchers.IO
{{Dispatchers.IO}} is an elastic pool with a default limit of 64 threads (or equal to core count if more than 64 cores; changed via system property {{kotlinx.coroutines.io.parallelism}}), not "as many as needed". If your DB pool has 20 connections and you open 500 coroutines calling the DB, most will wait for connections; latency increases and timeout cascades occur.

- Use {{Dispatchers.Default}} for CPU, {{Dispatchers.IO}} for blocking IO.
- Set bulkheads with {{Semaphore}} or {{limitedParallelism}} for each dependency.
- Do not increase IO threads to mask slow DBs; measure connection wait, pool saturation, and p99.
- Context switching has a cost; consolidate {{withContext}} instead of wrapping each small call.

### Compared to Java 21 StructuredTaskScope
{{StructuredTaskScope}} (preview from JDK 21, requires {{--enable-preview}}; API changes in subsequent JDK versions) also ensures children do not outlive the parent scope, with policies like {{ShutdownOnFailure}}/{{ShutdownOnSuccess}} in JDK 21. Coroutines have a cancellation ecosystem, Flow, and broader suspend integration; virtual threads + structured concurrency are suitable for blocking Java code.

Do not mix both models arbitrarily: if using coroutines, maintain the scope throughout; if calling Java APIs returning {{CompletableFuture}}, bridge with extension {{CompletableFuture.await()}} (package {{kotlinx.coroutines.future}}, in {{kotlinx-coroutines-core}} since 1.7; previously module {{kotlinx-coroutines-jdk8}}) instead of creating threads or calling {{get()}} to block.

### Observability
Set {{CoroutineName}} based on request/job, enable {{-Dkotlinx.coroutines.debug}} in staging to ensure thread dumps show coroutine names, and log when scopes are canceled. Missing names and contexts are common reasons why debugging coroutines is harder than threads.

> Senior tip: Concurrency limits should be numbers reviewed against downstream capacity, not the dispatcher defaults. A bulkhead of 20 for a 20-connection DB is usually more stable than 64 IO threads competing for a few connections.` ,
    follow: ['Why do {{launch}} and {{async}} handle exceptions differently?', 'Where do you set bulkheads for each dependency in the code?', 'Does coroutine cancellation rollback external transactions?']
  },
  'kotlin-014': {
    q: 'Why should you not use {{data class}} as a JPA entity? How do you design {{equals}}/{{hashCode}}/{{toString}} for Kotlin entities to avoid breaking {{HashSet}} and lazy loading?',
    a: `**Summary:** Do not use {{data class}} as a JPA entity. The automatically generated {{equals}}/{{hashCode}} include every property in the primary constructor — including the ID, which is often null before persist — so the hash changes after insert, breaking {{HashSet}}/{{HashMap}} and potentially triggering unintended queries. Use a regular class with an immutable business key or handle the ID carefully.

### Mechanism of equals/hashCode generation
{{data class}} generates {{equals}}, {{hashCode}}, {{toString}}, and {{copy}} based on properties in the primary constructor. For new entities, the {{id}} is often null; two different entities could be considered equal if the remaining fields are identical. After Hibernate assigns an ID, {{hashCode}} changes, so the object, now in a {{Set}}, can no longer be found.

Lazy collections in {{equals}} turn a simple comparison into a DB query; bidirectional relationships can cause infinite recursion. {{toString}} is worse: logging an entity might pull the entire object graph and expose sensitive data.

{{copy()}} of a data class creates a new object with the same ID but a different state; Hibernate treats it as detached/duplicate, easily leading to unintended {{merge}} operations.

### Why entity must be "open"
Hibernate creates proxies via subclassing for lazy loading. Final classes/methods block subclassing, so entities must be opened via the all-open plugin (or manually declared {{open}} for both class and properties); the {{kotlin-spring}} plugin only opens classes with Spring annotations, not entities. The {{kotlin-jpa}} plugin generates a no-arg constructor; opening the entity should be declared explicitly in the {{allOpen}} block containing {{annotation("jakarta.persistence.Entity")}} in build.gradle.kts instead of relying on the default plugin behavior for each version.

The no-arg constructor generated by the plugin does not run property initializers or the {{init}} block by default: fields are at JVM defaults (0/null) until Hibernate assigns values from the ResultSet. Do not place critical invariants in {{init}}, and remember that non-null properties can temporarily be null until Hibernate completes assignment.

### Safe approach
~~~kotlin
@Entity
open class Order protected constructor() {
    @Id
    var id: UUID? = null                    // set before save

    lateinit var code: String               // immutable business key, unique

    constructor(code: String) : this() {
        this.code = code
        this.id = UUID.randomUUID()
    }

    override fun equals(other: Any?): Boolean =
        this === other || (other is Order && code == other.code)

    override fun hashCode(): Int = code.hashCode()

    override fun toString(): String = "Order(" + code + ")"
}
~~~

- The business key must be immutable, unique, and carry business meaning; if absent, use the ID but handle nulls consistently.
- Do not put collections, lazy relations, audit timestamps, or mutable fields in {{equals}}/{{hashCode}}.
- Lazy proxies are subclasses of the entity, so {{other is Order}} is correct for proxies; but {{javaClass == other.javaClass}} is wrong (the proxy class differs from the real class). Read values of {{other}} via **properties (getters)**, because proxy getters initialize the proxy and return the real value; if the property is final (forgot all-open), Kotlin reads the proxy field directly, which is null, and {{equals}} returns false. To check the class accurately, use {{Hibernate.getClass(other)}}.
- With IDs assigned by the application, Spring Data sees the ID is not null and considers it an old entity, calling {{merge}} (SELECT first). Implement {{Persistable}} with an {{isNew}} flag so {{save}} uses {{persist}}.

### Pitfall production
- Test by adding an entity to a {{HashSet}}, flush, then {{contains}}; if the hash changes, the test exposes it immediately.
- {{equals}} based on ID: two new entities both with null IDs could be considered equal; return false unless it is the same instance.
- Inheriting entities: don't compare via {{getClass()}} because proxies are subclasses; use business keys or {{Hibernate.getClass}}.
- Don't use data classes for entities just to reduce boilerplate; the debugging cost is far greater.`,
    follow: ['Which business key is suitable for calculating {{equals}}/{{hashCode}}?', 'Why can {{toString}} on lazy entities cause N+1?', 'What problem does {{Persistable}} solve when IDs are assigned by the application?']
  },
  'kotlin-015': {
    q: 'You model business errors using sealed classes. How do you map to HTTP safely, serialize stably, and ensure clients don\'t break when adding new branches?',
    a: `**Summary:** Use sealed hierarchy for finite business outcomes (validation, not found, conflict) and leave exceptions for infrastructure/unexpected errors. Sealed helps {{when}} exhaustive in modules, but do not make them public JSON contracts: adding a subtype can cause consumers compiled beforehand to throw {{NoWhenBranchMatchedException}} or deserialization errors.

### Classify before choosing the type
- Expected business errors: the caller must handle them; do not use exceptions as control flow.
- Infrastructure errors: DB timeout, network loss, bugs — exception + boundary handler, retry/circuit breaker in the outer layer.
- Programming errors: {{IllegalStateException}}, fail fast; do not swallow into results.

Sealed is suitable when the number of branches is small and stable. If an HTTP error code is added every week, the hierarchy will bloat and every consumer must be updated.

~~~kotlin
sealed interface PaymentError {
    data class InvalidAmount(val amount: Long) : PaymentError
    data class InsufficientFunds(val available: Long) : PaymentError
    data class DuplicateRequest(val key: String) : PaymentError
    data class GatewayTimeout(val retryAfterSeconds: Long) : PaymentError
}

fun retryable(e: PaymentError): Boolean = when (e) {
    is PaymentError.GatewayTimeout -> true
    is PaymentError.InvalidAmount,
    is PaymentError.InsufficientFunds,
    is PaymentError.DuplicateRequest -> false
}
~~~

### Exhaustiveness and evolution
{{when}} on sealed requires no {{else}}, so the compiler reports missing branches. But do not use {{else}} in business code: it disables warnings and silently ignores new subtypes.

In multi-module setups, a consumer compiled with the old list of subtypes might receive a new subtype from the provider and throw {{NoWhenBranchMatchedException}} at runtime. Therefore: keep sealed types {{internal}} within the module, or if public, always have a fallback branch and test for compatibility.

Sealed type subtypes must reside in the same package and module (Kotlin 1.5+). This is useful to limit scope, but means they cannot be extended from other modules.

### Serialization
- Jackson needs {{@JsonTypeInfo}} + {{@JsonSubTypes}} or equivalent configuration; do not let internal class names become the public JSON contract.
- Kotlin serialization supports sealed with {{classDiscriminator}}; the client must know the types in advance.
- Best practice is to map to a stable {{ErrorResponse}} DTO with code/message/fields at the adapter level; the domain should not depend on HTTP, and clients should not see internal changes.
- For public APIs, adding a subtype is a contract change; requires versioning or fallback.

### Mapping to HTTP
Use {{@RestControllerAdvice}} to return {{ProblemDetail}} (RFC 9457) with type, title, status, detail, and extended properties for field errors. Mapping:
| Branch | HTTP |
|---|---|
| InvalidAmount | 400 |
| InsufficientFunds | 409 |
| DuplicateRequest | 409/200 idempotent |
| GatewayTimeout | 503 + Retry-After |

Log expected errors at info/warn with error codes; unexpected ones should log stack traces and trigger alerts.

### Pitfall
- {{runCatching}} catches {{CancellationException}} too; in coroutines, you must rethrow.
- Using Kotlin's {{Result}} for business errors loses the error type; a sealed class is clearer.
- Sealed types nested too deeply or carrying mutable state make comparison/pattern matching difficult.
- Returning direct exception messages to APIs exposes internal information.

> Senior tip: Treat sealed results as internal contracts, and public error codes as contracts with clients. Keep these two layers separate, and have contract tests for each branch mapping to HTTP; this allows you to refactor the domain without breaking clients.` ,
    follow: ['Why can adding sealed subtypes cause errors in already compiled consumers?', 'How do you serialize sealed types to stable JSON?', 'When should you use exceptions instead of sealed results?']
  },
  'kotlin-016': {
    q: 'Extension functions are handy but easily abused. What conventions do you set to avoid "ghost APIs", import conflicts, and unreadable DSLs in Spring codebases?',
    a: `**Summary:** Extension functions are static dispatch, convenient for pure helpers but easily create "ghost APIs" on types you don't own, hide dependencies, and silently change behavior when libraries add members with the same name. Limit them within modules, prefer {{internal}}, and use {{@DslMarker}} when writing DSLs.

### Static dispatch and shadowing traps
Extensions are compiled into static methods taking a receiver. They do not override, do not dispatch by runtime type, and the real member always wins if the name/signature matches.

Dangerous consequence: today you write {{fun String.slugify()}}, tomorrow the library adds a {{slugify()}} member; the call site doesn't change, but behavior does. Therefore, do not place public extensions on common types like {{String}}, {{List}}, or {{Any}} in shared modules.

Two modules defining the same extension can cause ambiguity on import; IDE chooses one, making review difficult. Name specifically based on domain and avoid wildcard imports.

### DSL and @DslMarker
Without markers, nested lambdas can access the wrong outer receiver:

~~~kotlin
@DslMarker
annotation class RouteDsl

@DslMarker
class RouteBuilder {
    fun get(path: String, block: RouteBuilder.() -> Unit) { /* ... */ }
}

fun routes(block: RouteBuilder.() -> Unit) = RouteBuilder().block()
~~~

With {{@DslMarker}}, receivers with the same marker are hidden in inner lambdas; to use the outer receiver, you must call {{this@routes}} explicitly. This prevents child route configuration from accidentally writing to parent routes.

### Operators and infix
Only overload operators when the meaning is obvious: {{plus}}, {{get}}, {{contains}}, {{compareTo}}. {{invoke}} on services looks like a function call but hides dependencies; {{get}} on things that aren't collections is confusing. Infix like {{to}} is okay, but do not create new obscure symbols.

### Side effects and testability
Extensions have no constructor so they do not receive dependencies via DI. If an extension reads {{SecurityContext}}, calls repositories, opens transactions, or sends HTTP, it becomes a hidden dependency, hard to mock and hard to replace. Convert these into explicit services/interfaces.

Extension properties have no backing field; if using {{by lazy}}, the delegate is not bound to each receiver. Do not use extensions to cache state per instance.

### Interop
Java sees extensions as static methods in a facade class named after the file, e.g., {{StringExt.kt}} becomes {{StringExtKt.slugify(s)}}; renaming the file changes the binary API. Use {{@file:JvmName}} to stabilize, {{@JvmName}} for signature conflicts. Default parameters need {{@JvmOverloads}} if you want Java to call them.

### Review conventions
- Pure helpers, short, no IO, name clearly states domain.
- {{internal}} by default; public only if truly shared API.
- No extensions on {{Any}}/{{Any?}}.
- Test nullable receivers and member name collisions.

> Senior tip: If an extension needs mocking, transactions, or environment configuration, it is no longer an extension — turn it into a bean. This rule keeps code testable and avoids naming conflicts when upgrading libraries.` ,
    follow: ['What happens if a library adds a member with the same name as an extension?', 'What does {{@DslMarker}} prevent in nested DSLs?', 'Why are extensions with side effects harder to test than services?']
  },
  'kotlin-017': {
    q: 'Do you choose {{Flow}} or {{Flux}}/{{Mono}} for streaming pipelines? Compare backpressure, context propagation, interop, and when Reactor should be kept.',
    a: `**Summary:** {{Flow}} and {{Flux}}/{{Mono}} are both lazy streams with backpressure, but Flow is based on suspend and structured concurrency, while Reactor is based on Reactive Streams with schedulers and its own {{Context}}. Choose based on your end-to-end stack (WebFlux/R2DBC or coroutine/JDBC), bridge at the adapter level, and do not mix contexts implicitly.

### Execution model
The {{flow}} builder with {{emit}} is cold: each collector re-runs the source. {{emit}} is suspend so the producer naturally blocks when the consumer is slow — backpressure via suspension. By default, the pipeline runs sequentially in the collector's coroutine; {{flowOn}} changes the dispatcher for upstream, {{buffer}}/{{conflate}} decouple speeds, {{collectLatest}} cancels old processing when a new element arrives.

{{Flux}}/{{Mono}} implement Reactive Streams: consumers request(n), operators respond to demand; {{subscribeOn}} sets the source, {{publishOn}} changes the scheduler for downstream. Reactor has an immutable {{Context}}, {{Sinks}} for hot streams, {{share}}/{{replay}}/{{cache}} to share.

Both are cold by default; subscribing/collecting multiple times runs the source again unless shared.

~~~kotlin
fun prices(id: String): Flow<Price> = flow {
    while (true) {
        emit(client.fetch(id))   // suspend -> backpressure
        delay(1_000)
    }
}

@GetMapping("/prices/{id}", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
fun stream(@PathVariable id: String): Flow<Price> = service.prices(id)
~~~

### Backpressure and errors
- Flow: {{buffer(capacity)}}, {{conflate}}, {{collectLatest}}; infinite buffers only mask symptoms and can OOM.
- Reactor: {{onBackpressureBuffer}}/{{onBackpressureDrop}}/{{onBackpressureLatest}}, {{limitRate}}, {{flatMap}} with concurrency parameter (default 256) — set explicitly according to downstream.
- Flow uses {{catch}} for upstream; errors downstream are not caught by that operator. Reactor uses {{onErrorResume}}, {{retryWhen}}, {{timeout}}.
- Cancellation: Flow cancels by scope; Reactor cancels via {{Disposable}}/subscription. Neither automatically rolls back side effects.

### Context and interop
{{kotlinx-coroutines-reactive}}/{{kotlinx-coroutines-reactor}} provide {{Flow.asFlux()}}, {{Publisher.asFlow()}}, {{awaitSingle()}}, {{awaitFirst()}}, and {{ReactorContext}} to bridge contexts. Bridging does not automatically synchronize all {{ThreadLocal}} variables; MDC, security, and tenant must be handled separately.

In WebFlux, returning {{Flow}} from controllers is adapted to {{Flux}}. Spring MVC (since 5.3) also accepts {{Flow}} as a return type through a reactive adapter mechanism (requires {{kotlinx-coroutines-reactor}} on the classpath) and streams results via async servlets; however, each streaming connection still holds servlet resources, so for massive concurrent SSE clients, WebFlux is more suitable.

### Which to choose
| Context | Choice |
|---|---|
| WebFlux + R2DBC + WebClient | Reactor |
| Pure Kotlin service, JDBC, suspend | Flow |
| Kafka | reactor-kafka or controlled consumer loop |
| Need complex backpressure, hot streams | Reactor/Sinks |

Do not convert back and forth frequently in the hot path; choose the boundary (adapter) and maintain one model throughout.

### Pitfall
- Blocking in {{map}} of Flow or on Reactor's event loop.
- Using {{GlobalScope}}/{{Sinks}} without lifecycle, causing leaks.
- Test: {{runTest}} + Turbine for Flow, {{StepVerifier}} + {{reactor-test}} for Reactor; remember virtual time.
- Infinite Flow without cancellation will hang tests; always set timeouts.

> Senior tip: Don't choose Flow just because you're writing Kotlin. If the ecosystem is WebFlux/R2DBC, Reactor provides more coherent backpressure and tooling; if the team mainly writes suspend services and JDBC, Flow is more readable. Measure with real load tests and monitor consumer lag.` ,
    follow: ['What part of the pipeline does {{flowOn}} affect?', 'How do you bridge Reactor Context and CoroutineContext?', 'Why can infinite Flows hang tests?']
  },
  'kotlin-018': {
    q: 'You are migrating a multi-module Spring Boot system from Java to Kotlin. What technical points in build, annotation processing, and API boundaries determine success?',
    a: `**Summary:** Migrate by module/bounded context, maintain clear Java boundaries, and prioritize new or low-change modules. The hard part isn't Kotlin syntax, but multi-language builds, annotation processing (kapt/KSP), Spring/JPA proxies, boundary nullability, and binary compatibility of public APIs.

### Module strategy
- Choose leaf modules or new modules with low coupling; avoid Java ↔ Kotlin circular dependencies between modules.
- In the same module, the Kotlin compiler runs first and sees Java source; javac runs later, seeing Kotlin classes. Java source generated by annotation processors does not automatically appear for Kotlin in the same round.
- Keep package/API boundaries stable; expose Java-friendly facades if consumers are Java.
- Do not rewrite services that are already stable just to increase the Kotlin percentage; choose based on actual change levels.

### Build and annotation processing
- kapt runs Java annotation processors, generates stubs, slows down builds, and breaks incremental compilation; needed for processors without KSP support.
- KSP is faster and Kotlin-first but only works with supported processors; check MapStruct, Hibernate metamodel, Dagger/Hilt before migrating.
- Spring Framework 6.1 removed the mechanism to read parameter names from debug info: Java code must be compiled with {{-parameters}}. With Kotlin, Spring reads parameter names via kotlin-reflect, but {{javaParameters = true}} (Spring Boot Gradle plugin enables this) should still be used to avoid errors binding {{@PathVariable}}/{{@RequestParam}} without explicit names.
- Configure {{kotlin("plugin.spring")}}, {{kotlin("plugin.jpa")}}, all-open/no-arg; verify plugin versions match the compiler.
- {{jvm-default}} must be consistent across modules; changes affect interface default methods when called from Java.
- Pin Kotlin stdlib, use BOM, measure build time before/after; kapt is usually the biggest cost.

### Java ↔ Kotlin boundary APIs
- Avoid putting default arguments, suspend, inline/value classes in public APIs for Java without bridges; Java doesn't see default arguments unless {{@JvmOverloads}} is used.
- Use {{@JvmStatic}}, {{@JvmName}}, {{@Throws}} as needed; Java's checked exceptions don't automatically appear in Kotlin.
- Mark packages with {{@NullMarked}}/JSpecify; if your Kotlin compiler supports JSpecify, nullability is understood correctly, otherwise it remains platform types — verify versions.
- Kotlin {{List}} is a read-only view, it doesn't guarantee immutability in Java; do not share mutable collections across boundaries.
- Keep DTOs/APIs in separate modules if both languages use them.

### Spring/JPA and tests
- Entities need open/no-arg correctly; {{@Transactional}} on final classes/methods or self-invocation is still bypassed.
- Jackson needs the Kotlin module; check manually created {{ObjectMapper}} instances.
- Integration tests are needed for proxies, rollbacks, lazy loading, and serialization; don't just test calling the class directly.
- MockK understands Kotlin better (final classes, {{suspend}}, objects, extensions); Mockito 5 mocks final classes via inline mock makers but is less natural with {{suspend}}. Use {{runTest}} instead of {{runBlocking}} in coroutine tests.
- Measure APM/agent coroutine context support before rollout.

### Operation and team
- Coding conventions, ktlint/detekt, review checklist for interop; avoid "Kotlin written like Java" and overly clever DSLs.
- Pair programming, ownership of build plugins, rollback plans.
- Measure lead time, defect escape, build time, p95; do not measure by number of lines.
- Keep rollback capability: new modules can be reverted without affecting old ones.

### Pitfall
- Big-bang rewrites. Running both kapt and KSP in the same module is allowed (common during migration), but it multiplies build time and is prone to confusion about which processor generates what; have a plan to remove kapt.
- Forgetting {{javaParameters}} or the Kotlin module — runtime errors only appear in real environments.
- Upgrading the Kotlin compiler but forgetting Spring/JPA plugins; proxies and no-arg break.
- Public Kotlin APIs changing signatures silently when adding default parameters or changing nullability.

> Senior tip: Choose a bounded context with a clear API, migrate it together with tests and observability, then compare metrics against baseline before expanding. Investing early in build/annotation processing and Java interop conventions is much cheaper than fixing proxy/deserialization errors scattered around later.` ,
    follow: ['Why is Java source generated by annotation processors hard to see from Kotlin in the same round?', 'What criteria do you use to choose between kapt and KSP?', 'What Kotlin constructs should not appear in public APIs for Java?']
  }
});
