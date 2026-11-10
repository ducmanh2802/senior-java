/*
 * English translation of js/data/q-kotlin.js — task T788. Format: js/core/i18n.js (content overlay).
 * ids: kotlin-019 kotlin-020 kotlin-021 kotlin-022 kotlin-023 kotlin-024 kotlin-025 kotlin-026
 */
App.i18n.content({
  'kotlin-019': {
    q: 'In Spring Boot 3, Kotlin coroutines and Java Virtual Threads both promise "synchronous code, high throughput" — which one do you choose, and when?',
    a: `**Summary:** In Spring Boot 3, both Java Virtual Threads (Virtual Thread, Java 21) and Kotlin coroutines promise to write synchronous-looking code while handling many tasks simultaneously. Virtual Thread is a JVM-level mechanism for all JVM languages, suitable when you want to keep blocking Java code and scale threads. Coroutines are a Kotlin language-level abstraction, suitable when the codebase is Kotlin and requires structured concurrency, cancellation, and asynchronous call composition. Choose based on stack and needs, not just raw performance.

### 1. Two different concepts
- Virtual Thread (JEP 444): Real JVM threads but as cheap as coroutines, mounting and unmounting from carrier threads. Code remains standard blocking I/O like Thread.sleep, InputStream.read. You don't need to change how you write code, just configure JVM/Spring.
- Coroutine: Suspend functions where the compiler generates a state machine, not occupying a thread while waiting; requires kotlinx-coroutines runtime. You write code that looks synchronous but actually suspends at each waiting point.

### 2. When to choose Virtual Threads
- Codebase is primarily Java, or Kotlin but calling blocking APIs like JDBC, RestTemplate, or old libraries that only have blocking APIs.
- Want to enable quickly with spring.threads.virtual.enabled=true without changing code.
- Need compatibility with observability tools, agents, or profilers that run on standard JVM threads.

### 3. When to choose coroutines
- Kotlin codebase, wanting suspend, Flow, structured concurrency, and automatic cancellation when the request is cancelled.
- Need to compose multiple asynchronous calls (async/await) and propagate cancellation to child calls.
- Need to connect to Reactor (coroutines have a bridge to Reactor via kotlinx-coroutines-reactor).

### 4. Trade-off table
| Criterion | Virtual Thread | Coroutine |
|---|---|---|
| Language | Java and Kotlin | Kotlin |
| Code style | blocking | suspend |
| Cancellation | manual | structured automatic |
| Async composition | CompletableFuture | async/await, Flow |
| Libraries | blocking OK | need suspend-aware APIs |

### 5. Example Spring Boot 3
~~~kotlin
@GetMapping("/orders/{id}")
suspend fun get(@PathVariable id: Long): OrderDto =
    withContext(Dispatchers.IO) {
        service.load(id)
    }
~~~
{{withContext(Dispatchers.IO)}} only wraps the blocking part of database access, not blocking the entire processing thread. With Virtual Threads, you don't need {{withContext}}, but you are still limited by the database connection pool.

### 6. Common pitfalls
- Virtual Thread combined with synchronized can pin the carrier thread, losing benefits; use ReentrantLock instead of synchronized when needed.
- Coroutine calling blocking code directly will occupy the dispatcher thread; use withContext(Dispatchers.IO) for blocking parts.
- Mixing both in the same request makes context difficult to track and debug.
- Virtual Thread does not make the database faster; connection pools and downstream limits are still bottlenecks.

> Senior tip: Start with Virtual Threads if the team still writes a lot of Java; switch to coroutines when you need cancellation, asynchronous composition, and the codebase already uses Kotlin. Measure p99 and actual thread count before deciding, not just based on single benchmark numbers.`,
    follow: ['How do you measure Virtual Thread pinning?', 'How does withContext(Dispatchers.IO) differ from Virtual Threads in terms of resources?', 'When is it not worth migrating to coroutines?']
  },
  'kotlin-020': {
    q: 'Structured concurrency and cancellation in Kotlin coroutines: How do coroutineScope and supervisorScope differ, and why is cancellation cooperative?',
    a: `**Summary:** Structured concurrency (concurrent with structure — all child coroutines are attached to a parent scope with a clear lifecycle) ensures that child coroutines never leak: the parent waits for the children, and a child error cancels the entire group (except in supervisorScope). {{coroutineScope}} cancels all branches when one child fails; {{supervisorScope}} allows a failing child to operate independently. Cancellation is cooperative: coroutines only stop when they check {{isActive}} or call a suspend function, so setting a cancellation flag is not enough.

### 1. The problem of "leaking" coroutines
If you launch a coroutine without attaching it to a scope with a clear lifecycle, it continues to run even after the request is finished → resource leaks, hard to debug. Every coroutine must belong to a scope; the parent waits for all children, and cancelling the parent cancels the entire subtree below it.

### 2. coroutineScope vs supervisorScope
- {{coroutineScope}}: If one child throws an exception, it cancels all other children and propagates the exception to the parent. Suitable when all branches must succeed, e.g., aggregating data from multiple services.
- {{supervisorScope}}: Error in one child does not affect siblings; the error propagates only through the child's Job. Suitable when one failing component should not ruin the entire page, e.g., dashboard with many independent widgets.

### 3. Cancellation is cooperative
Calling {{job.cancel()}} only sets a "cancelled" flag; the coroutine only stops at the next suspension point or when it checks {{isActive}}. Heavy CPU-bound loops must call {{ensureActive()}} or {{yield()}}. Do not catch {{CancellationException}} and return normal results; that breaks structured concurrency and causes cancelled requests to continue writing data.

### 4. Common pitfalls
- Ignoring {{CancellationException}} → coroutine does not stop.
- Using {{GlobalScope}} → loses structured concurrency.
- Blocking calls directly in coroutine → does not respond to cancellation.

> Senior tip: Treat cancellation as a contract — every suspend function should respond to cancellation; test by cancelling the Job and verify resources are cleaned up.`,
    follow: ['Where to place ensureActive() in a CPU-heavy loop?', 'Should CancellationException be caught?', 'How to propagate cancellation to blocking I/O?']
  },
  'kotlin-021': {
    q: 'Null safety when calling Java code from Kotlin: What is a platform type, and why can NPEs still occur?',
    a: `**Summary:** Platform type is how Kotlin handles Java types lacking nullability info, e.g., {{String!}}; the compiler doesn't know null or non-null so it doesn't enforce checks. If Java returns null and Kotlin references, NPE occurs at runtime. I handle this by treating every value from Java as nullable at the boundary, adding nullability annotations to Java code, and using {{requireNotNull}} or the safe operator {{?.}} to convert to a clear Kotlin type. I avoid {{!!}} unless the invariant is proven and the error must fail fast.

### 1. What is platform type
- A Java method like {{String getName()}} appears in Kotlin as {{String!}} (with an exclamation mark).
- Compiler doesn't know nullability, so it doesn't enforce checks.
- Annotations like {{@Nullable}} or {{@NotNull}} help, but support depends on compiler configuration (e.g., {{-Xjsr305}}) and version; JSpecify (org.jspecify.annotations) is a newer standard — check your project.

### 2. Why NPEs still occur
- Java code returns null unexpectedly, e.g., {{Map.get}} returns null.
- Kotlin trusts it's non-null and calls a method → NPE at runtime.
- Java generics like {{List<String>}} can contain null elements without type-use annotations.

### 3. Prevention methods
- Add nullability annotations to Java code (Spring widely uses {{Nullable}}/{{NotNull}}).
- Treat all Java values as nullable at the boundary and perform checks.
- Use {{Objects.requireNonNull}} or {{requireNotNull}} at the interaction boundary to fail fast.

Example:
~~~kotlin
val name: String? = javaObj.name // safe, treat as nullable
val upper = name?.uppercase() // safe call
val required = requireNotNull(javaObj.name) // fails fast with clear message
~~~

### 4. Things to avoid
- Force-casting a platform type to non-null with {{!!}} → NPE if Java returns null.
- Java collections can be mutated or contain null elements.
- Annotations not propagated through reflection/complex generics.
- Don't let platform types spread deep into domain logic; convert immediately at the adapter level.

### 5. Sample interview answer
"Platform type is how Kotlin handles Java types lacking nullability info, e.g., String!; compiler doesn't know null or not-null so it doesn't enforce checks. If Java returns null and Kotlin references, NPE occurs at runtime. I handle this by treating every value from Java as nullable at the boundary, adding nullability annotations to Java code, and using {{requireNotNull}} or safe operator {{?.}} to convert to clear Kotlin type. I avoid {{!!}} unless the invariant is proven and error must fail fast."

> Senior tip: Treat every value from Java as nullable until an annotation proves otherwise; write an adapter layer at the boundary to convert to clear, safe Kotlin types, log with request identifier but without logging sensitive data.`,
    follow: ['JSR-305 annotation honored by Kotlin by default?', 'How to enforce nullability at Java boundary?', 'Map.get in Java returns platform type, how to handle?']
  },
  'kotlin-022': {
    q: 'Kotlin data class vs. Java record in JPA/Hibernate: Which one should you choose, and why should entities typically not be data classes?',
    a: `**Summary:** Kotlin data classes generate {{equals}}, {{hashCode}}, {{toString}}, and {{copy}} based on all properties in the primary constructor; Java records are similar but immutable. JPA entities need mutability, identity based on an id, and support for proxying, making neither ideal as a default entity type. Use a standard class with {{var}} and equals based on id (or default identity). Data classes and records are better suited for DTOs, values, and read models.

### 1. Kotlin data class
- Generates constructors, getters, setters (if {{var}}), {{equals}}, {{hashCode}}, {{toString}}, {{copy}}.
- {{equals}}/{{hashCode}} use all properties → issue with lazy associations and proxies.
- {{copy()}} is a shallow copy: mutable objects inside still share references.

### 2. Java record
- Immutable by design, accessor named as components (no default JavaBean getters), record is final.
- No setter, so Hibernate is hard to initialize (needs no-arg constructor and field access); not suitable for entity.

### 3. Why entities should not be data classes
- Lazy loading: {{equals}}/{{hashCode}} touches associations → N+1 or {{LazyInitializationException}}.
- Proxies: Hibernate creates a proxy subclass for lazy loading. Final class cannot be subclassed (needs open or all-open plugin).
- Identity: Entity identified by id, not entire state; two new entities with null id might be considered equal if based on other fields.
- Mutable collections in data class easily cause aliasing bugs.

### 4. Safe implementation
~~~kotlin
@Entity
open class Order protected constructor() {
    @Id
    var id: UUID? = null

    lateinit var code: String

    constructor(code: String) : this() {
        this.code = code
        this.id = UUID.randomUUID()
    }

    override fun equals(other: Any?): Boolean =
        this === other || (other is Order && code == other.code)

    override fun hashCode(): Int = code.hashCode()

    override fun toString(): String = "Order(code=$code)"
}
~~~
- Business key must be immutable, unique, business-relevant.
- Do not put collections, lazy associations, audit timestamps, or changing fields into {{equals}}/{{hashCode}}.
- Proxy is a subclass, so {{other is Order}} is correct, but {{javaClass == other.javaClass}} is wrong. Read values through getter to initialize proxy; use {{Hibernate.getClass(other)}}.
- For app-assigned id, Spring Data calls merge; use {{Persistable}} with {{isNew}} flag if wanting save to use persist.

### 5. Selection
- Entity: standard class, open (or all-open plugin), equals/hashCode by id or default identity.
- DTO/read model: data class or record (immutable, value semantics).

### 6. Sample interview answer
"I don't use data class as JPA entity because automatically generated equals/hashCode uses all properties, including null-id and lazy associations — this changes the hash after persist, breaks HashSet/HashMap and can trigger unwanted queries. Java record isn't suitable either because it's immutable and lacks setters that JPA needs. I use open class, equals/hashCode based on business key or id, and keep data class/record only for DTO and read model."

> Senior tip: convention = entity is a mutable class identified by id; DTO is an immutable data class/record. Code review should check entity's equals/hashCode and test adding entity to HashSet then verify contains after persist.`,
    follow: ['What is the problem with defining equals/hashCode based on an id before the entity is persisted?', 'How do you configure the all-open plugin?', 'When should Hibernate\'s @Immutable annotation be used?']
  },
  'kotlin-023': {
    q: 'Kotlin extension functions: How do they work, and what are the risks of abusing them in a large codebase?',
    a: `**Summary:** Extension functions are syntactic sugar: the compiler converts {{receiver.ext()}} into a static method call like {{ExtKt.ext(receiver)}}. They do not use dynamic dispatch, cannot access private members, and cannot be overridden. Overusing them can lead to "ghost" APIs, difficulty in finding definitions, and naming conflicts.

### 1. Mechanism
- {{fun String.isEmail(): Boolean}} compiles down to {{fun isEmail($receiver: String): Boolean}}.
- Calling {{s.isEmail()}} is effectively {{isEmail(s)}}.
- Resolution is static at compile time, meaning it is not polymorphic based on the runtime type. If a subclass has a member with the same name, the member is always prioritized.

### 2. Benefits
- Add methods to classes you don't own (like {{String}} or {{List}}) without needing inheritance.
- Perfect for creating DSL builders and fluent APIs.
- Supports extension properties.

### 3. Risks of abuse
- **Overload resolution:** Hard to distinguish between extension and member, or between multiple extensions.
- **Action at a distance:** Methods appear on types based on an import anywhere in the file.
- **Naming conflicts:** Generic names (like {{toDto}}) in multiple modules can cause conflicts.
- **Discoverability:** IDEs might not suggest the extension if the import isn't present.

### 4. Best practice conventions
- Extensions should ideally be pure functions without side effects.
- Organize them in clearly named files, within packages that follow domain logic.
- Avoid extensions for overly general types like {{Any}} or {{List<Any>}}.
- Prefer member functions if you own and control the class.

### 5. Java interop
- Java sees extensions as static helpers in a generated facade class (default name from file name, e.g., StringExtKt). Use {{@file:JvmName}} to stabilize, {{@JvmName}} for signature conflicts.

### 6. Example
A team put fun String.toDto() in a common module. Two months later, a new Java library added getDto(), and another module also defined toDto(). Code compiled but called the wrong function, causing wrong data in financial reports. Solution: rename to toOrderDto(), toInvoiceDto(), place in separate packages and use {{@file:JvmName("OrderDtoExt")}} for Java caller stability.

### 7. Pitfalls
- Extensions cannot be overridden → unexpected behavior with subclasses.
- Extension properties do not have backing fields.

### 8. Sample interview answer
"Extension function lets me add helper methods to a type without inheritance; compiler compiles it to a static function receiving the object as the first parameter. It's not truly polymorphic and doesn't access private members. I only use extensions for pure helpers like formatting or mapping, no side effects like DB/HTTP calls, because those need to be injected and mocked. If an extension needs mocking, transactions, or configuration, it's not an extension — turn it into a bean."

> Senior tip: Extensions are ergonomic, not a core OOP mechanism. During review, consider if a clearer member function or a dedicated utility class would be more maintainable.`,
    follow: ['What is the priority order between an extension function and a member function?', 'How do you organize extensions in a multi-module project?', 'Can an extension function access private members?']
  },
  'kotlin-024': {
    q: 'Spring Boot + Kotlin: all-open plugin, kotlin-spring, Jackson module — What is the minimum configuration and what are the common errors?',
    a: `**Summary:** Kotlin classes and methods are final by default, but Spring requires subclass proxies for features like AOP, {{@Transactional}}, and {{@Async}}. JPA also needs subclass proxies and a no-arg constructor. The {{kotlin-spring}} (all-open) plugin opens classes with Spring annotations, while the {{no-arg}} plugin generates empty constructors for entities. The Jackson Kotlin module handles data classes and nullability correctly.

### 1. The "final" challenge
- Spring AOP creates proxy subclasses → if the class is final, CGLIB proxying fails, {{Transactional}} doesn't work, no rollback.
- JPA/Hibernate also create proxy subclasses and thus require classes to be open.
- {{@Configuration}} classes must be open (or you must set {{proxyBeanMethods=false}}).

### 2. kotlin-spring / all-open
- This plugin automatically opens classes and methods annotated with {{@Component}}, {{@Transactional}}, {{@Async}}, {{@Cacheable}}, etc.
- In Gradle: {{id("org.jetbrains.kotlin.plugin.spring")}}.
- Manually configure to open custom annotations if needed.

### 3. no-arg plugin
- Generates an empty constructor for classes annotated with {{@Entity}}, {{@Embeddable}}, or {{@MappedSuperclass}}, required for JPA to instantiate entity objects via reflection.
- Default generated constructor doesn't run property initializers/{{init}}; Hibernate assigns fields from ResultSet later.

### 4. Jackson module
- The {{jackson-module-kotlin}} provides support for constructors, data classes, default values, and Kotlin's nullability.
- Register via {{ObjectMapper.registerModule(KotlinModule())}} (Spring Boot does this automatically if on classpath).
- Use {{@field:NotBlank}}/{{@field:Min}} because Bean Validation defaultly reads fields/getters, not constructor params.

### 5. Common errors
- **Forgetting the plugin:** {{@Transactional}} doesn't work (no proxy) → no transaction rollback.
- **Final entities:** Hibernate proxy creation fails, often silently failing or causing lazy loading errors.
- **Deserialization issues:** Jackson failing because the Kotlin module is missing.
- **Initialization order:** Issues combining {{lateinit}} with constructor injection.

### 6. Example Gradle
~~~kotlin
plugins {
  kotlin("jvm")
  kotlin("plugin.spring")
  kotlin("plugin.jpa")
  kotlin("plugin.allopen")
}
~~~

> Senior tip: Maintain a build plugin checklist in your CI: verify {{@Transactional}} rollbacks work with a test; ensure entities load lazily; and verify JSON round-trip serialization for all DTOs.`,
    follow: ['When should {{proxyBeanMethods=false}} be used?', '{{lateinit}} vs. constructor injection: which is preferred?', 'Can KSP be used instead of kapt in a Spring environment?']
  },
  'kotlin-025': {
    q: 'Kotlin {{Flow}} vs. Project Reactor ({{Mono}}/{{Flux}}): What are the differences regarding cold/hot streams, backpressure, and when to choose which in Spring WebFlux?',
    a: `**Summary:** {{Flow}} is a Kotlin-native cold stream based on coroutines, where backpressure is handled naturally via suspension. Reactor (Mono/Flux) is a Java-based reactive library that supports both cold and hot streams, using an explicit {{request(n)}} mechanism for backpressure. In Spring WebFlux (Reactor-based), use Reactor at the web boundary and bridge to {{Flow}} for internal Kotlin logic using {{kotlinx-coroutines-reactor}}.

### 1. Cold vs. Hot
- **Flow:** Primarily cold — every {{collect}} call restarts the producer logic. {{collect}} is a suspend function, so producer is automatically suspended when the consumer is slow (backpressure via suspension).
- **SharedFlow/StateFlow:** Hot — broadcast to many; {{StateFlow}} replays the latest value (like a conflated hot stream).
- **Mono/Flux:** Cold default, hot via Sinks.

### 2. Backpressure
- **Flow:** Natural — {{collect}} is a suspend function, so the producer waits when the consumer is slow (with buffer). Use {{buffer}}, {{conflate}}, {{collectLatest}} to control. An infinite buffer only masks symptoms and can lead to OOM.
- **Reactor:** Explicit demand — subscriber requests n; operators like {{limitRate}}, {{flatMap}} with concurrency need explicit configuration to control downstream speed.

### 3. Composition
- **Flow:** Operators are suspend functions (map, filter, flatMapMerge), following structured concurrency.
- **Reactor:** Chain of operators and dedicated {{Scheduler}}.

### 4. Integration in WebFlux
- Controllers return {{Mono}} or {{Flux}} (Reactor) for Spring's internal handling.
- Internal Kotlin logic can return {{Flow}}, converted using {{flow.asFlux()}}.
- Bridge context using {{Dispatchers.Reactor}}. MDC, security, tenant need custom handling to propagate through threads.

### 5. When to choose which
| Context | Choice |
|---|---|
| WebFlux + R2DBC + WebClient | Reactor |
| Kotlin service, JDBC, suspend | Flow |
| Need complex backpressure, hot streams | Reactor/Sinks |

Don't convert back and forth too much; choose a boundary (adapter) and keep one model throughout.

### 6. Common Pitfalls
- Blocking in {{map}} of Flow or Reactor event loop → kills throughput.
- {{GlobalScope}}/{{Sinks}} without lifecycle management → leaks.
- Testing: {{runTest}} + Turbine for Flow; {{StepVerifier}} + {{reactor-test}} for Reactor.
- Infinite Flow without cancellation will hang tests; always set a timeout.

> Senior tip: Define clear boundaries: Reactor for web, {{Flow}} for domain, convert at controller. Measure memory and backpressure with load tests, not just response time.`,
    follow: ['Does {{asFlux()}} preserve the coroutine context?', '{{SharedFlow}} vs. {{Flux.share()}}: how do they compare?', 'When should {{StateFlow}} be used instead of manual caching?']
  },
  'kotlin-026': {
    q: '(Lead) Should you migrate a Java codebase to Kotlin? How would you decide and execute the transition?',
    a: `**Summary:** Avoid "big-bang" rewrites. Base your decision on measurable business value, team skills, and framework compatibility. Use the "strangler" approach: write new modules in Kotlin, define clear interop boundaries, and track key metrics. Keep Java for high-performance hot paths or stable legacy code, and use Kotlin for new domains. Migration is a multi-quarter effort requiring a dedicated owner and a rollback plan.

### 1. When to migrate
- Team already experienced with Kotlin, and the project benefits from null safety, coroutines, or custom DSLs.
- Starting a new domain with clear APIs and robust testing.
- Build infrastructure (Gradle, KSP) is ready for both languages.

### 2. When to stay with Java
- Team is Java-only, facing tight production deadlines.
- Rely on legacy frameworks with poor Kotlin support.
- Performance is absolutely critical and requires specialized Java tooling (profilers, agents) not optimized for Kotlin.

### 3. The Strangler strategy
- Implement new modules in Kotlin while keeping existing ones in Java.
- Maintain clear interop boundaries: use stable packages, avoid Kotlin-specific constructs in public APIs.
- Convert files gradually when they need changes ("boy scout rule") rather than massive non-functional rewrites.

### 4. Risks and Mitigation
- **Build time increases:** Use KSP, build caching, to mitigate {{kapt}} overhead.
- **Codebase complexity:** Establish strict conventions and use tools like {{ktlint}} or {{detekt}}.
- **Onboarding:** Documentation, pair programming.
- **Binary compatibility:** Be careful with public API signatures.

### 5. Metrics for success
- Lead time, defect escape rates, build durations, p99 latency.
- Developer satisfaction surveys.
- "Rollback capability" — revert modules if necessary.

### 6. Pitfalls
- **Big-bang rewrites:** Regression risk, team morale.
- **Kotlin "Java-style":** Missing benefits of the language.
- **Annotation processing gaps:** Subtle runtime errors from bad configuration.

> Senior tip: Select a bounded context with a very clear API, migrate it along with its tests and observability hooks, and compare performance metrics against the baseline before scaling. Invest in build and interop conventions early to avoid friction.`,
    follow: ['How to select the first module for migration?', 'How to measure the ROI of a language migration?', 'When is the right time to stop a migration?']
  }
});
