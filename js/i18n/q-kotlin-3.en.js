/*
 * English translation of js/data/q-kotlin.js — task T788. Format: js/core/i18n.js (content overlay).
 * ids: kotlin-019 kotlin-020 kotlin-021 kotlin-022 kotlin-023 kotlin-024 kotlin-025 kotlin-026
 */
App.i18n.content({
  'kotlin-019': {
    q: 'In Spring Boot 3, Kotlin coroutines and Java Virtual Threads both promise "synchronous code, high throughput" — which one do you choose, and when?',
    a: `**Summary:** Virtual Threads are a JVM mechanism (Java 21) for all JVM languages, suitable when you want to keep blocking Java code and scale threads; coroutines are a Kotlin language-level abstraction, suitable when the codebase is Kotlin and requires structured concurrency, cancellation, and Flow. In Spring Boot 3, both are supported; choose based on your stack and the need for cancellation/composition rather than just raw performance.

### 1. What level do the two concepts operate at?
- Virtual Threads (JEP 444): Genuine JVM threads that are as lightweight as coroutines, mounting and unmounting onto carrier threads. Code remains standard blocking I/O ({{Thread.sleep}}, {{InputStream.read}}).
- Coroutines: Suspend functions where the compiler generates a state machine that avoids blocking threads; they require the {{kotlinx-coroutines}} runtime.

### 2. When to choose Virtual Threads
- The codebase is primarily Java or Kotlin but calls blocking APIs (JDBC, RestTemplate).
- You want to quickly enable them using {{spring.threads.virtual.enabled=true}} without significant code changes.
- You need compatibility with libraries that only offer blocking APIs.

### 3. When to choose coroutines
- In a Kotlin codebase where you want to leverage {{suspend}}, {{Flow}}, structured concurrency, and automatic cancellation.
- You need to compose multiple asynchronous calls (async/await) and propagate cancellation efficiently.
- You require Reactor integration (coroutines provide a bridge to Reactor).

### 4. Trade-off table
| Criterion | Virtual Threads | Coroutines |
|---|---|---|
| Language | Java/Kotlin | Kotlin |
| Code style | blocking | suspend |
| Cancellation | manual | structured |
| Async composition | CompletableFuture | async/await, Flow |
| Libraries | blocking OK | need to be suspend-aware |

### 5. Pitfalls
- Virtual Threads + {{synchronized}} blocks pinning the carrier thread → loss of benefits; use {{ReentrantLock}} instead.
- Coroutines + blocking calls → blocks the thread pool; use {{withContext(Dispatchers.IO)}}.
- Mixing both in the same request → makes debugging context difficult.

> Senior tip: Start with Virtual Threads if the team still uses Java; move to coroutines when you need cancellation/composition and already have a Kotlin foundation. Measure p99 and the actual number of threads before making a final decision.`,
    follow: ['How do you measure Virtual Thread pinning?', 'How does {{withContext(Dispatchers.IO)}} differ from Virtual Threads in terms of resource usage?', 'When is it not worth migrating to coroutines?']
  },
  'kotlin-020': {
    q: 'Structured concurrency and cancellation in Kotlin coroutines: How do {{coroutineScope}} and {{supervisorScope}} differ, and why is cancellation cooperative?',
    a: `**Summary:** Structured concurrency ensures that child coroutines do not "leak" — the parent waits for all children to finish and cancels them if the parent itself is cancelled. {{coroutineScope}} cancels all children if any child fails; {{supervisorScope}} allows children to fail independently. Cancellation is cooperative: code must check {{isActive}} or call a suspend function to stop.

### 1. The problem of "leaking" coroutines
If you launch a coroutine without attaching it to a scope, it continues to run even after the request is finished → this leads to resource leaks and makes debugging difficult.

### 2. How structured concurrency helps
Every coroutine belongs to a scope; the parent scope waits for all its children. Cancelling the parent scope automatically cancels the entire subtree of coroutines.

### 3. coroutineScope vs supervisorScope
- {{coroutineScope}}: If one child throws an exception, it cancels all other children and propagates the exception to the parent.
- {{supervisorScope}}: A failure in one child does not affect its siblings; the exception propagates only through that child's Job.

### 4. Cooperative cancellation
- Calling {{job.cancel()}} only sets a "cancelled" flag; the coroutine only actually stops when it reaches a suspension point or manually checks {{isActive}}.
- CPU-heavy code must manually check the status using {{ensureActive()}} or {{yield()}}.

### 5. Example
~~~kotlin
suspend fun fetchAll() = coroutineScope {
    val a = async { fetchA() }
    val b = async { fetchB() }
    a.await() + b.await()  // if a fails, b is automatically cancelled
}
~~~

### 6. Pitfalls
- Swallowing {{CancellationException}} → prevents the coroutine from stopping correctly.
- Using {{GlobalScope}} → breaks structured concurrency and leads to unmanaged coroutines.
- Making blocking calls within a coroutine → the coroutine won't respond to cancellation requests.

> Senior tip: Treat cancellation as a contract: every suspend function should respond to cancellation; test your code by cancelling the Job and asserting that resources are cleaned up properly.`,
    follow: ['Where should {{ensureActive()}} be placed in a CPU-heavy loop?', 'Should {{CancellationException}} be caught?', 'How do you propagate cancellation to blocking I/O?']
  },
  'kotlin-021': {
    q: 'Null safety when calling Java code from Kotlin: What is a platform type, and why can NPEs still occur?',
    a: `**Summary:** When calling Java from Kotlin, Java return types that lack nullability annotations become platform types ({{T!}}). Kotlin doesn't know if they are null or non-null, so the compiler doesn't enforce null checks. NullPointerExceptions (NPEs) can still occur if Java returns null and Kotlin code dereferences it without a check.

### 1. Platform type
- A Java method like {{String getName()}} appears in Kotlin as {{String!}} (with an exclamation mark).
- The compiler allows calling both nullable and non-null methods on it without warnings or errors.
- Annotations like {{@Nullable}} or {{@NotNull}} (from JSR-305, JetBrains, etc.) help Kotlin determine the exact nullability.

### 2. Why NPEs still occur
- Java code might return null unexpectedly (e.g., from a {{Map.get}} call).
- Kotlin code assumes the value is non-null and calls a method on it → resulting in an NPE at runtime.
- Java generics like {{List<String>}} can still contain null elements.

### 3. Prevention methods
- Add nullability annotations to your Java code (Spring widely uses {{@Nullable}}).
- At the Kotlin boundary, treat platform types as nullable by default and perform explicit checks.
- Use {{Objects.requireNonNull}} in Java or {{requireNotNull}} in Kotlin at the interaction boundary.

### 4. Example
~~~kotlin
val name: String? = javaObj.name  // Safe conversion to nullable
val upper = name?.uppercase()     // Standard null-safe call
~~~

### 5. Pitfalls
- Force-casting a platform type to non-null using {{!!}} → leads to an NPE if Java actually returns null.
- Collections received from Java can be mutated or contain null elements unexpectedly.
- Annotations are sometimes not propagated correctly through reflection or complex generics.

> Senior tip: Treat every value coming from Java as nullable until an explicit annotation proves otherwise; write an adapter layer to convert external Java types into clear, safe Kotlin types.`,
    follow: ['Are JSR-305 annotations honored by Kotlin by default?', 'How do you enforce nullability at the Java boundary?', '{{Map.get}} in Java returns a platform type; how should it be handled?']
  },
  'kotlin-022': {
    q: 'Kotlin {{data class}} vs. Java {{record}} in JPA/Hibernate: Which one should you choose, and why should entities typically not be data classes?',
    a: `**Summary:** Kotlin data classes generate {{equals}}, {{hashCode}}, {{toString}}, and {{copy}} based on all properties; Java records are similar but immutable. JPA entities require mutability, identity based on an id, and proxying support, making neither ideal as a default entity type. Use standard classes with {{var}} and define {{equals}} based on the id. Data classes and records are better suited for DTOs and value objects.

### 1. Kotlin data class
- Generates constructors, getters, setters (if {{var}}), {{equals}}, {{hashCode}}, {{toString}}, and {{copy}}.
- The generated {{equals}} and {{hashCode}} use all properties → this causes issues with lazy associations and Hibernate proxies.

### 2. Java record
- Immutable by design, with component accessors, {{equals}}, {{hashCode}}, and {{toString}}.
- Lacks setters → cannot be easily hydrated by JPA (which typically requires a no-arg constructor and setters or direct field access).

### 3. Why entities should not be data classes
- **Lazy loading:** Using generated {{equals}}/{{hashCode}} might touch lazy associations → leading to N+1 query problems or {{LazyInitializationException}}.
- **Proxies:** Hibernate creates proxy subclasses. Since data classes are final by default, proxies cannot subclass them (unless using the all-open plugin).
- **Identity:** Entity identity should be based on its id, not its entire state which might change.

### 4. Selection guide
- **Entity:** Use a standard class, marked as {{open}} (or via the all-open plugin), with {{equals}}/{{hashCode}} based on the primary key (id).
- **DTO/Read Model:** Use a {{data class}} or {{record}} for immutable value semantics.

### 5. Pitfalls
- Data classes with mutable collections → can lead to difficult-to-track aliasing bugs.
- Using a {{record}} as a JPA entity → results in a missing no-arg constructor error at runtime.
- Calling {{copy()}} on a managed entity → creates a detached instance with the same id, causing confusion during merge operations.

> Senior tip: Follow this convention: entity = mutable class with identity-based id; DTO = immutable data class or record. Always check the {{equals}} and {{hashCode}} implementation of your entities during code reviews.`,
    follow: ['What is the problem with defining {{equals}}/{{hashCode}} based on an id before the entity is persisted?', 'How do you configure the all-open plugin?', 'When should Hibernate\'s {{@Immutable}} annotation be used?']
  },
  'kotlin-023': {
    q: 'Kotlin extension functions: How do they work, and what are the risks of abusing them in a large codebase?',
    a: `**Summary:** Extension functions are syntactic sugar: the compiler converts {{receiver.ext()}} into a static method call like {{ExtKt.ext(receiver)}}. They do not use dynamic dispatch, cannot access private members, and cannot be overridden. Overusing them can lead to "ghost" APIs, difficulty in finding definitions, and naming conflicts.

### 1. Mechanism
- {{fun String.isEmail(): Boolean}} compiles down to {{fun isEmail($receiver: String): Boolean}}.
- Calling {{s.isEmail()}} is effectively {{isEmail(s)}}.
- Resolution is static at compile time, meaning it is not polymorphic based on the runtime type.

### 2. Benefits
- Add methods to classes you don't own (like {{String}} or {{List}}) without needing inheritance.
- Perfect for creating DSL builders and fluent, builder-style APIs.
- Supports extension properties (using getters and setters).

### 3. Risks of abuse
- **Overload resolution:** It can be hard to distinguish between an extension and a member function, or between multiple extensions.
- **Action at a distance:** Methods can suddenly appear on types based on an import anywhere in the file.
- **Naming conflicts:** Generic names (like {{toDto}}) used in multiple modules can cause conflicts.
- **Discoverability:** IDEs might not suggest the extension if the necessary import isn't already present.

### 4. Best practice conventions
- Extensions should ideally be pure functions without side effects.
- Organize them in clearly named files, within packages that follow the domain logic.
- Avoid writing extensions for overly general types (like {{Any}} or {{List<Any>}}).
- Prefer member functions if you actually own and control the class.

### 5. Pitfalls
- Extensions cannot be overridden → this can lead to unexpected behavior when dealing with subclasses.
- Extension properties do not have backing fields, limiting their use for state storage.
- Java callers see extensions as static helpers, not as methods on the object.

> Senior tip: Extensions are an ergonomic tool, not a core OOP mechanism. During review, consider if a clearer member function or a dedicated utility class would be more maintainable.`,
    follow: ['What is the priority order between an extension function and a member function?', 'How do you organize extensions in a multi-module project?', 'Can an extension function access private members?']
  },
  'kotlin-024': {
    q: 'Spring Boot + Kotlin: all-open plugin, kotlin-spring, Jackson module — What is the minimum configuration and what are the common errors?',
    a: `**Summary:** Kotlin classes and methods are final by default, but Spring requires subclass proxies for features like AOP, {{@Transactional}}, and {{@Async}}. JPA also needs subclass proxies and a no-arg constructor. The {{kotlin-spring}} (all-open) plugin opens classes with Spring annotations, while the {{no-arg}} plugin generates empty constructors for entities. The Jackson Kotlin module handles data classes and nullability correctly.

### 1. The "final" challenge
- Spring AOP creates proxy subclasses → if the class is final, CGLIB proxying fails.
- JPA/Hibernate also create proxy subclasses and thus require classes to be open.
- {{@Configuration}} classes must be open (or you must set {{proxyBeanMethods=false}}).

### 2. kotlin-spring / all-open
- This plugin automatically opens classes and methods annotated with {{@Component}}, {{@Transactional}}, {{@Async}}, {{@Cacheable}}, etc.
- In Gradle: {{id("org.jetbrains.kotlin.plugin.spring")}}.
- You can also manually configure it to open custom annotations.

### 3. no-arg plugin
- Generates an empty constructor for classes annotated with {{@Entity}}, {{@Embeddable}}, or {{@MappedSuperclass}}.
- This is required for JPA to instantiate entity objects via reflection.

### 4. Jackson module
- The {{jackson-module-kotlin}} provides support for constructors, data classes, default values, and Kotlin's nullability.
- Register it via {{ObjectMapper.registerModule(KotlinModule())}} (Spring Boot does this automatically if the dependency is present).

### 5. Common errors
- **Forgetting the plugin:** {{@Transactional}} won't work (no proxy is created) → resulting in no transaction rollback.
- **Final entities:** Hibernate proxy creation fails, often silently falling back to eager loading or causing errors.
- **Deserialization issues:** Jackson failing to deserialize a data class because the Kotlin module is missing.
- **Initialization order:** Issues combining {{lateinit}} with constructor injection.

### 6. Gradle Example
~~~kotlin
plugins {
  kotlin("jvm")
  kotlin("plugin.spring")
  kotlin("plugin.jpa")
  kotlin("plugin.allopen")
}
~~~

> Senior tip: Maintain a build plugin checklist in your CI pipeline: verify that {{@Transactional}} rollbacks work with a test; ensure that entities load lazily; and verify JSON round-trip serialization for all DTOs.`,
    follow: ['When should {{proxyBeanMethods=false}} be used?', '{{lateinit}} vs. constructor injection: which is preferred?', 'Can KSP be used instead of kapt in a Spring environment?']
  },
  'kotlin-025': {
    q: 'Kotlin {{Flow}} vs. Project Reactor ({{Mono}}/{{Flux}}): What are the differences regarding cold/hot streams, backpressure, and when to choose which in Spring WebFlux?',
    a: `**Summary:** {{Flow}} is a Kotlin-native cold stream based on coroutines, where backpressure is handled naturally via suspension. Reactor is a Java-based reactive library that supports both cold and hot streams, using an explicit {{request(n)}} mechanism for backpressure. In Spring WebFlux (which is Reactor-based), use Reactor at the web boundary and bridge to {{Flow}} for your internal Kotlin logic using {{kotlinx-coroutines-reactor}}.

### 1. Cold vs. Hot
- **Flow:** Primarily cold — every {{collect}} call restarts the producer logic.
- **SharedFlow/StateFlow:** Hot streams for broadcasting; {{StateFlow}} replays the latest value.
- **Mono/Flux:** Cold by default, but can be made hot via {{Sinks}} or Processors.

### 2. Backpressure
- **Flow:** Natural and simple — the {{collect}} call suspends, and the producer suspends when the buffer is full.
- **Reactor:** Uses explicit demand signaling ({{request(n)}}) from the subscriber.

### 3. Composition
- **Flow:** Uses suspend operators like {{map}}, {{filter}}, and {{flatMapMerge}}, following structured concurrency.
- **Reactor:** Uses a chain of operators and dedicated {{Scheduler}} objects.

### 4. Integration in Spring WebFlux
- Controllers typically return {{Mono}} or {{Flux}} (Reactor) for Spring's internal handling.
- Internal Kotlin logic can return a {{Flow}}, which is converted using {{flow.asFlux()}}.
- Bridge the context using {{Dispatchers.Reactor}} where necessary.

### 5. When to choose which
- **Kotlin + Coroutine stack:** Use {{Flow}} for domain logic and Reactor at the web interaction boundary.
- **Java/Reactor stack:** Stick with Reactor end-to-end.
- **Reactor Ecosystem:** If you need deep integration with things like {{WebClient}} or R2DBC, Reactor is often more straightforward.

### 6. Pitfalls
- **Missing subscribers:** A {{Flow}} without a collector won't run (it's cold) — a common mistake.
- **Mixing dispatchers:** Can lead to context loss (like losing MDC or security info).
- **Hot streams:** Creating hot streams without proper backpressure management can lead to OOM errors.

> Senior tip: Define clear boundaries: use Reactor for the web layer and {{Flow}} for the domain layer, performing the conversion in the controller. Always measure memory usage and backpressure behavior with load tests.`,
    follow: ['Does {{asFlux()}} preserve the coroutine context?', '{{SharedFlow}} vs. {{Flux.share()}}: how do they compare?', 'When should {{StateFlow}} be used instead of manual caching?']
  },
  'kotlin-026': {
    q: '(Lead) Should you migrate a Java codebase to Kotlin? How would you decide and execute the transition?',
    a: `**Summary:** Avoid "big-bang" rewrites. Base your decision on measurable business value, team skills, and framework compatibility. Use the "strangler" approach: write new modules in Kotlin, define clear interop boundaries, and track key metrics. Keep Java for high-performance hot paths or stable legacy code, and use Kotlin for new domains. Migration is a multi-quarter effort requiring a dedicated owner and a rollback plan.

### 1. When to migrate
- The team is already experienced with Kotlin, and the project would benefit from null safety, coroutines, or custom DSLs.
- You are starting a new domain with clear APIs and robust testing.
- Your build infrastructure (Gradle, KSP) is ready to support both languages.

### 2. When to stay with Java
- The team is Java-only and facing a tight production deadline.
- You rely on legacy frameworks that do not have good Kotlin support.
- Performance is absolutely critical and requires specialized Java tooling (profilers, agents) not yet optimized for Kotlin.

### 3. The Strangler strategy
- Implement new modules in Kotlin while keeping existing ones in Java.
- Maintain clear interop boundaries: use stable packages and avoid Kotlin-specific constructs in public APIs.
- Convert files gradually when they need changes ("boy scout rule") rather than doing massive, non-functional rewrites.

### 4. Risks and Mitigation
- **Build time increases:** Use KSP and build caching to mitigate the overhead of {{kapt}}.
- **Codebase complexity:** Establish strict conventions and use tools like {{ktlint}} or {{detekt}}.
- **Onboarding:** Provide clear documentation and use pair programming to spread knowledge.
- **Binary compatibility:** Be very careful with public API signatures.

### 5. Metrics for success
- Track lead time, defect escape rates, build durations, and p99 latency.
- Conduct developer satisfaction surveys to gauge the impact on morale.
- Ensure "rollback capability" — that modules can be reverted if necessary.

### 6. Pitfalls
- **Big-bang rewrites:** These often lead to regressions and destroy team morale.
- **Kotlin "Java-style":** Writing Kotlin that looks like Java misses the actual benefits of the language.
- **Annotation processing gaps:** Forgetting to configure plugins can lead to subtle runtime errors.

> Senior tip: Select a bounded context with a very clear API, migrate it along with its tests and observability hooks, and compare its performance metrics against the baseline before scaling the migration further. Invest in build and interop conventions early to avoid friction.`,
    follow: ['How do you select the first module for migration?', 'How do you measure the ROI of a language migration?', 'When is the right time to stop a migration?']
  }
});
