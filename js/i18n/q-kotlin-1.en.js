/*
 * English translation of js/data/q-kotlin.js — task T166. Format: js/core/i18n.js (content overlay).
 * ids: kotlin-001 kotlin-002 kotlin-003 kotlin-004 kotlin-005 kotlin-006 kotlin-007 kotlin-008 kotlin-009 kotlin-010
 */
App.i18n.content({
  'kotlin-001': {
    q: 'You are calling a Java API from Kotlin and get a platform type. Does Kotlin null safety fully protect you, and how do you handle @Nullable/@NotNull at the boundary?',
    a: `**Summary:** Kotlin distinguishes {{String}} and {{String?}} at compile time, but when a Java type lacks nullability annotation it becomes a **platform type** ({{String!}}), so the compiler allows both nullable and non-null usage. Make the contract explicit at the Java boundary with supported annotations, validate input, and convert to an explicit Kotlin type.

### Where platform type comes from
Kotlin cannot infer whether a Java method may return null if bytecode carries no metadata. With {{String!}}, the compiler lets you assign to {{String}}; if Java returns null, the failure appears at dereference time as an NPE at runtime. This is an intentional compatibility gap, not a Kotlin type that should travel deep into the application.

~~~text
// Java without annotation: Kotlin sees String!
val name: String = legacyUser.name  // can blow up if Java returns null

// Normalize at adapter
val name: String? = legacyUser.name
val display = name ?: "Anonymous"
~~~

### Annotation and boundary
- Use consistent nullability annotations in the Java API; Kotlin reads many popular annotations from JSpecify, JetBrains, Android and other annotation sets. Confirm the compiler and libraries in use support the correct annotation set.
- Some annotations apply package/default scope; check the actual nullability of inherited methods and generic types, because missing or incompatible annotations can still result in a platform type.
- For external data (DB, JSON, Java legacy), validate once at the adapter/service boundary, then convert to a non-nullable domain type if the data is required.
- The {{!!}} operator is only appropriate when the invariant is proven and failure must be fast; using it casually turns NPE into a hard-to-trace error.

### Production pitfalls
- A Kotlin property may call a Java getter; looking like a field does not mean null-safe.
- Generic Java such as {{List<String>}} can contain null if no trustworthy type-use annotation exists. Do not assume every element is valid.
- With Spring/Jackson/Hibernate, constructor, reflection and proxies can bypass Kotlin initialization expectations; verify configuration and real data.
- Test both the case where Java returns null, including null elements inside collections, at the integration boundary.

> Senior tip: set a review rule that platform types must not cross multiple layers; convert to {{T?}} at the adapter, log request context with an identifier but do not log sensitive data, then handle null explicitly.`,
    follow: ['How does Kotlin analyze nullability of generic Java if annotations only apply to the collection?', 'How would you design a Kotlin DTO receiving a payload with missing fields?', 'Why does {{!!}} usually reduce error-handling quality?'],
  },
  'kotlin-002': {
    q: 'When converting a Java DTO to Kotlin, do you choose a data class or a Java record? Compare semantics, interop, and cases where a data class should not be used.',
    a: `**Summary:** {{data class}} is a convenient choice for Kotlin value objects: the compiler generates {{equals}}, {{hashCode}}, {{toString}}, {{copy}} and component destructuring based on the primary constructor. {{record}} is a Java value carrier with a contract and a Java-native API; choose by language at the boundary, do not treat the two as full replacements.

### Semantics to distinguish
A data class requires at least one parameter in the primary constructor; only properties declared there participate in auto-generated functions. Properties declared in the class body do not participate in equality/copy. Record components are all public state by design, accessors use the component name (not a JavaBean getter by default), and records are final, shallowly immutable.

~~~text
// Kotlin: id and name define equality/copy
 data class UserDto(val id: Long, val name: String) {
    var cache: String? = null // not part of equals/copy
}

// Java: record is the natural choice for a Java API
record UserDto(long id, String name) {}
~~~

### Choose by boundary
- Kotlin-first codebase: data class for small request/response DTOs, immutable configuration, and query results.
- Public API used heavily from Java: record has clear semantics in Java, but verify serializers, frameworks and baseline Java requirements.
- If mutable entities, database identity, lazy associations, or lifecycle callbacks are needed: do not use a data class as a default entity. Auto-generated equality on mutable fields/associations can break Set/Map and trigger unintended queries.
- Kotlin data class {{copy}} is a **shallow copy**; mutable objects inside still share references.

### Interop and pitfalls
To Java, a data class looks like a regular class: it has getters, a constructor, and {{copy}} with full arguments (default arguments do not automatically create overloads for Java unless {{@JvmOverloads}} is used). Record accessors are named like {{id()}}, not {{getId()}}; older frameworks expecting JavaBean conventions may not be compatible.

Do not put passwords/tokens into {{toString()}} of sensitive DTOs; logging a data class can accidentally expose values. Choose constructor defaults carefully, because deserializers may distinguish missing from null differently.

> Senior tip: use immutable DTOs at the boundary and map explicitly to the domain; avoid letting auto-generated {{equals}} decide the identity of a JPA entity with mutable relationships.`,
    follow: ['Does a property declared outside the primary constructor affect {{copy()}}?', 'Is a data class suitable as a JPA entity? Why?', 'How does a Java caller use Kotlin default parameters?'],
  },
  'kotlin-003': {
    q: 'What problem does an extension function solve in Kotlin? How would you use them in a Java/Spring codebase to avoid creating misleading APIs?',
    a: `**Summary:** Extension functions allow calling a function with {{receiver.function()}} syntax, adding convenient operations without modifying or inheriting the original class. This is resolved statically by the receiver type at compile time, not a new method attached to the object, and it does not provide access to private members.

### Mechanism and dispatch
The compiler translates an extension into a static function taking the receiver as the first parameter. Therefore overloads are chosen by compile-time type, even when the runtime object is a subtype; extensions do not override virtual methods.

~~~text
fun String.maskEmail(): String =
    substringBefore('@').take(1) + "***@" + substringAfter('@')

val value: CharSequence = "sam@example.com"
// Only callable if extension is declared on CharSequence
~~~

Extensions can be overloaded and imported like functions. If a real member and an extension share the same name/signature, the member always wins. The syntax can make readers think the base library has that API, so package and naming must reveal origin.

### Use in real services
- Good for pure, short, stable conversions: {{Instant.toUtcDateTime()}}, small mappings, or domain predicates.
- Place them in a package close to the owning module; use clear names and avoid dozens of generic extensions like {{toDto()}} that do not specify the target type.
- Do not use them to hide side effects, access repositories, read SecurityContext, or replace dependency injection. Extensions do not receive dependencies through a constructor in a transparent way.
- For APIs requiring polymorphism, plugin contracts, or runtime-dependent behavior, use interfaces, members, or decorators.

### Java interop and pitfalls
Java cannot call extensions with receiver syntax; it typically calls a static function in a Kotlin facade file (facade name defaults from the file name, changeable with {{@file:JvmName}}). Java overload of generics/nullable types can be harder to read than Kotlin.

Extensions on nullable receivers can be valid, but handle null explicitly. Avoid names that match common Java methods, because imports can cause reviewers to misunderstand. Unit tests should call through the real package to detect import conflicts.

> Senior tip: restrict extensions to modules and use them for pure operations; if a function needs mockable dependencies or changeable policies, an explicit service/interface is easier to maintain.`,
    follow: ['Can an extension override a subtype member?', 'How does Java call a Kotlin extension function?', 'When should an extension become an injected service?'],
  },
  'kotlin-004': {
    q: 'A Spring Boot service has many blocking tasks and needs concurrent processing. Compare Kotlin coroutines, Java virtual threads, and CompletableFuture, then choose an approach.',
    a: `**Summary:** The three options have different models: {{CompletableFuture}} represents an async result via callbacks/composition; coroutines allow sequential-style suspend code but need a suitable runtime/dispatcher; virtual threads keep blocking code easy to read with Java 21 lightweight threads. Choose by the real stack, integration capabilities, and resource limits—not a single benchmark.

### Mechanisms
{{CompletableFuture}} represents a completed result; {{Async}}-suffixed methods usually submit work to an executor (if no executor is passed, often the common pool), while non-{{Async}} continuations may run immediately on the thread completing the future. It fits fan-out/fan-in and Java pipelines, but long {{thenCompose}} chains spread error handling, context and cancellation. Choose an explicit executor for blocking IO, set timeouts, and limit concurrency; do not assume every continuation runs in the background.

A coroutine suspends at suspension points and yields the thread to the dispatcher; continuation resumes later. It reduces threads held awaiting IO, but only libraries that are suspend/non-blocking or properly bridged can leverage it. Running blocking JDBC on a dispatcher does not make JDBC non-blocking.

A virtual thread attaches a lightweight Java Thread to a carrier when running; when a blocking operation is compatible, the JVM can unmount the virtual thread and free the carrier. Code stays synchronous, but DB connections, HTTP connections, CPU, and rate limits are still finite resources.

### Decision matrix
| Criterion | Coroutines | Virtual threads | CompletableFuture |
|---|---|---|---|
| Language | Kotlin | Java 21+ | Java 8+ |
| Style | sequential suspend | sequential blocking | async composition |
| Ecosystem | needs API/bridge | blocks well with libraries improving gradually | widespread in Java APIs |
| Risk | wrong dispatcher/context | cheap threads do not mean infinite dependencies | callbacks, executors, hard-to-read errors |

### Safe implementation
With Spring, confirm framework version, web stack, driver (JDBC or R2DBC), and transaction/security context propagation. Set semaphores/bulkheads according to the downstream pool; set timeouts to the request budget; measure queue, connection waits, p95/p99, and timeout rates. Do not switch everything to coroutines just because Kotlin supports them.

Pitfall: higher concurrency can exhaust the DB pool before CPU is busy; cancellation does not automatically roll back every external side effect. Structured concurrency and lifecycle must keep child tasks within the request scope.

> Senior tip: load-test with real latency profiles—for example with a 40-connection DB pool, do not allow 2,000 concurrent requests all waiting on transactions; concurrency must match dependency limits, no matter how cheap virtual threads or coroutines are.`,
    follow: ['Do virtual threads make JDBC queries non-blocking?', 'When using coroutines in Spring, how do you verify transaction context propagation?', 'Do you set concurrency limits at the application or connection pool?'],
  },
  'kotlin-005': {
    q: 'You introduce Kotlin into a Spring Boot application with JPA. What are the roles of kotlin-spring/all-open and no-arg plugins, and which runtime errors must be controlled?',
    a: `**Summary:** Kotlin makes classes and methods final by default, while Spring proxies often need subclassing; the {{kotlin-spring}} plugin opens classes annotated with Spring stereotypes so proxies work. JPA needs a no-argument constructor and entities that can be proxied, so configure {{kotlin-jpa}}/no-arg and open entities per provider requirements; the plugin does not replace understanding lifecycle.

### Why plugins are needed
Spring AOP, transaction and some proxies create subclasses via CGLIB; final classes/methods prevent overriding. The Kotlin Spring plugin is a preset of all-open that automatically opens types with known Spring annotations such as {{@Component}}, {{@Service}}, {{@Configuration}} and related meta-annotations.

JPA providers need to initialize entities according to persistence standards and may create proxies for lazy loading. The no-arg plugin generates synthetic constructors for annotated entities. With Kotlin plugin versions before 2.3.20, {{kotlin-jpa}} configured no-arg but did not automatically open entities; you needed a separate all-open config or declare entities open per provider. From Kotlin 2.3.20, the JPA plugin also enables all-open with a JPA preset. Confirm plugin/version and annotation namespace in use (Spring Boot 3 uses {{jakarta.persistence}}); {{kotlin-spring}} only opens classes with Spring annotations, it does not automatically open JPA entities.

~~~text
plugins {
    kotlin("jvm")
    kotlin("plugin.spring")
    kotlin("plugin.jpa")
}
~~~

### Kotlin entities: be careful
- Entities are usually mutable classes with appropriate constructors; do not make every entity a data class because {{equals/hashCode/toString}} may touch lazy associations, bidirectional recursion, or change hash after persist.
- Do not include lazy collections in {{toString()}} or equality. Load entities inside a transaction, then map to DTO before serializing the response.
- The synthetic no-arg constructor does not mean every field is initialized like a domain constructor; verify nullability and defaults when hydrating.
- Open classes/methods only where proxies need them; do not open the entire domain blindly.

### Verify in production
Write integration tests using a real transaction: call a method through a Spring bean to verify proxy/rollback; persist, reload, and access relationships according to the fetch plan. Enable SQL logging in tests, not by default in production. Verify schema validation, constructor mapping, Jackson, and lazy loading outside a transaction.

Common errors are {{@Transactional}} on a final class/method, or self-invocation calling a method on the same bean causing the proxy to be bypassed; the Kotlin plugin does not fix self-invocation.

> Senior tip: pin plugin versions to the Kotlin compiler, verify generated bytecode/integration tests after upgrades; a unit test calling the class directly does not prove Spring proxies are active.`,
    follow: ['Why does self-invocation make {{@Transactional}} not apply?', 'What errors can a data-class entity cause with Hibernate proxies?', 'How do you distinguish plugin misconfiguration from lazy-fetch errors?'],
  },
  'kotlin-006': {
    q: 'How do you design a result model for an API with success, validation error, and system error using sealed classes? How does {{when}} help, and what are its limits?',
    a: `**Summary:** A sealed hierarchy restricts the set of subtypes that can exist in a module/package by Kotlin rules, helping {{when}} be exhaustive and clarifying valid states. Use it to model results with a finite number of branches; still decide HTTP mapping, serialization, and compatibility when adding branches.

### Thinking in state sets
Instead of one object with {{success}}, {{errorCode}}, {{payload}} all nullable at once, a sealed type represents each state separately. The compiler checks missing branches when {{when}} handles a sealed hierarchy without a default.

~~~text
sealed interface ApiResult<out T> {
    data class Success<T>(val value: T) : ApiResult<T>
    data class Invalid(val fields: List<String>) : ApiResult<Nothing>
    data class Failed(val code: String) : ApiResult<Nothing>
}

fun message(r: ApiResult<*>) : String = when (r) {
    is ApiResult.Success -> "OK"
    is ApiResult.Invalid -> "Invalid input"
    is ApiResult.Failed -> "Try later"
}
~~~

### Why useful
- Each branch carries exactly the data it needs; reduces contradictory states like {{success=true}} but missing payload.
- Adding a subtype makes the compiler point out which {{when}} expressions need updates, helpful when refactoring within the same codebase.
- Generic covariance lets error branches use {{Nothing}} because those branches do not provide {{T}}.

Sealed types are not a replacement for exceptions for all errors. For unrecoverable infrastructure errors or those needing stack/cause, exceptions and boundary handlers are usually appropriate. For expected business errors (validation, not found), typed results can make flow clearer.

### Boundaries and pitfalls
Serialization frameworks need discriminator/subtype configuration; subtype names should not accidentally become a public JSON contract. With distributed APIs, old clients may receive a new type and not know how to handle it. Adding a branch to a sealed type breaks exhaustive {{when}} consumers that need to be recompiled.

> Senior tip: sealed result types are especially useful for state machines with 3–6 clear states; if error branches grow continuously by HTTP code/infrastructure, split the hierarchy and keep exception boundaries centralized.`,
    follow: ['When should exceptions replace sealed results?', 'How does adding a sealed subtype affect binary/source compatibility?', 'How do you serialize a sealed hierarchy to stable JSON?'],
  },
  'kotlin-007': {
    q: 'When moving a data pipeline from Java Stream to Kotlin collections or Sequence, how do you evaluate eager/lazy behavior, performance, and resource lifetime?',
    a: `**Summary:** Kotlin collection operators often create intermediate collections and run eagerly; {{Sequence}} is lazy and fits long transformation chains that can short-circuit, but adds iterator/lambda overhead and is not automatically faster. Java Stream is also lazy until a terminal operation, with pipeline rules and resource handling; choose by data size, step count, short-circuit needs, and readability.

### Eager and lazy
With {{list.filter(...).map(...)}}, Kotlin materializes the filtered result then maps it. With {{asSequence()}}, elements flow through the pipeline step by step when a terminal operation consumes them; {{first}} can stop early without processing the rest.

~~~text
val first = items.asSequence()
    .filter { it.enabled }
    .map { it.name.trim() }
    .firstOrNull()
~~~

If the pipeline has only one transformation on a small list, Sequence can be slower due to abstraction/dispatch. If the source is large with many steps or terminal short-circuit, reducing intermediate allocations can matter. Measure with representative workloads.

### Compared to Java Stream
Stream is consumed once, has terminal operations, supports primitive streams, and parallel mode; Kotlin Sequence has no integrated parallel execution like parallelStream. A Java Stream from a resource (e.g., {{Files.lines}}) must be closed with try-with-resources; Kotlin {{sequence}} generally does not manage resource lifetime automatically. Do not keep a lazy pipeline open longer than the resource remains open.

### Pitfalls and choices
- Side effects in lambdas make execution order/dependence depend on the terminal operation; keep pipelines pure.
- Iterating a Sequence multiple times repeats work at the source; if results are needed several times, materialize to a list.
- Database/JPA: sequence processes loaded objects, not a replacement for paging or streaming cursor inside a proper transaction. Do not load millions of rows into memory and change APIs for laziness.
- For CPU parallelism, use executors/parallel strategies with clear limits; do not expect Sequence to parallelize automatically.

> Senior tip: prioritize readability; benchmark with JMH or load tests using real data, measuring allocations and GC—not just elapsed time once. Large optimizations usually come from paging/query plans rather than swapping {{List}} for {{Sequence}}.`,
    follow: ['Why can Sequence be slower than collections for short pipelines?', 'How do you close a lazy file stream?', 'Is Sequence equivalent to parallelStream?'],
  },
  'kotlin-008': {
    q: 'In code review, how do you explain {{let}}, {{run}}, {{with}}, {{apply}}, and {{also}} so the team does not turn scope functions into unreadable syntax?',
    a: `**Summary:** Scope functions differ on two axes: the receiver is {{this}} or the argument is {{it}}, and the result is either the receiver object or the lambda value. Use them to group short, purposeful operations; avoid nesting many scopes because {{this}}/{{it}} obscure context.

### Quick memory table
| Function | Inside lambda | Result | Common intent |
|---|---|---|---|
| let | it | lambda value | null handling, transform |
| run | this | lambda value | configure then compute |
| with(obj) | this | lambda value | multiple operations on object |
| apply | this | receiver | initialize/configure |
| also | it | receiver | side effect like log/validate |

~~~text
val request = Request().apply {
    id = incomingId
    source = "web"
}.also { logger.info("request {}", it.id) }

val length = nullableName?.let { it.trim().length }
~~~

### Choose syntax by intent
{{apply}} is useful when building/mutating an object that should be returned. {{also}} fits small side effects without changing pipeline value. {{let}} usually expresses transformation or execution when non-null. {{run}}/{{with}} help access multiple members and return a computed result.

Do not choose scope functions just to save a few characters. If the lambda is long, has many branches, or important side effects, use named variables and separate methods so readers see the flow.

### Production pitfalls
- Nesting {{apply}}/{{let}} makes {{this}} point to the wrong object; use receiver labels or better, split the block.
- {{also}} can make a pipeline look functional while writing to DB or sending events. Side effects need method names and clear error handling.

=== kotlin-009 ===`,
    follow: ['What is the mechanism of sealed class exhaustive when?', 'Can a scope function replace an explicit variable?', 'When does nesting scope functions cause bugs?'],
  },
  'kotlin-009': {
    q: 'When Kotlin needs to declare a singleton/factory that Java callers also use, do you choose a top-level declaration, an object, or a companion object? What does {{@JvmStatic}} change?',
    a: `**Summary:** Kotlin top-level functions/properties compile to static members of a facade file; {{object}} creates a singleton; {{companion object}} is an object attached to a class for factory/constants related to that class. {{@JvmStatic}} generates an additional static bridge for Java ergonomics; it does not make the companion object static JVM state in the strict sense.

### How to choose
- Top-level: utility functions not tied to a specific class, e.g., parse/format; keep packages small and file names clear.
- {{object}}: one shared instance, e.g., stateless registry or strategy; remember mutable state is global state and needs thread safety.
- Companion: factory {{User.from(dto)}}, constants, or instance-creation APIs related to {{User}}. It is a companion instance, not a constructor.

~~~text
class User private constructor(val id: Long) {
    companion object {
        @JvmStatic
        fun from(id: Long) = User(id)
    }
}
~~~

Kotlin calls {{User.from(1)}}. Without {{@JvmStatic}}, Java usually calls {{User.Companion.from(1)}}. The annotation creates a static bridge so Java can call {{User.from(1)}}; you can add bridges for property getters accordingly.

### Interop and pitfalls
Top-level APIs are visible to Java through a facade class (default name from the file); changing the file name can change the binary API unless stabilized with {{@file:JvmName}}. Do not create facades containing unrelated utilities.

{{const val}} fits simple compile-time constants; {{val}} in a companion is not necessarily a JVM static final constant as Java expects. Public inline constants can cause issues when the value changes but clients have not recompiled.

Singletons should not hold request/user state; classloader isolation, test isolation, and mutable global collections can leak between requests or tests.

> Senior tip: if an API is used widely from Java, write a small Java smoke test for real calling patterns and keep facade/signature stable; Kotlin compiling successfully does not guarantee a Java-friendly API.`,
    follow: ['How does Java call a companion function without {{@JvmStatic}}?', 'When does a top-level function become an unstable Java API?', 'Why can mutable singletons leak data between requests?'],
  },
  'kotlin-010': {
    q: 'A Java Spring team is considering switching to Kotlin. What decision and rollout plan do you propose so the language benefits are not overshadowed by operational cost?',
    a: `**Summary:** Do not switch languages just because Kotlin is shorter; base the decision on pain points, team skills, framework/library compatibility, hiring, and long-term operational cost. For most stable systems, test a new module or bounded context, measure quality and delivery speed, then expand—usually lower risk than a full rewrite.

### Assess value and cost
Kotlin brings null safety, data/sealed types, extensions, coroutine syntax, and less boilerplate. But value comes when the team uses these features consistently; mixed Java/Kotlin adds conventions, plugin/build complexity, bytecode debugging, and a learning curve. Interop also has sharp edges: platform types, default parameters, checked-exception differences, property/accessor behavior, and annotation processing.

Build a table per system: Spring Boot/Kotlin plugin versions, JPA/proxy, serialization, kapt/KSP, agents/APM, static analysis, test fixtures, build time, and IDE support. Verify critical libraries have Kotlin APIs or only Java APIs.

### Controlled rollout
1. Interview the team and identify measurable problems: null errors, development speed, onboarding, module boilerplate.
2. Choose a small service or new module with low coupling; set coding conventions, formatters, lint, and Java interop guidelines.
3. Run a pilot through CI, integration tests, observability, and real releases. Compare lead time, defects, build duration, incidents, and review effort to baseline.
4. Expand by domain boundary if results are good; keep Java/Kotlin interop explicit. Do not force conversion of stable services just to reach a Kotlin ratio.

### When not to switch
- The team has no time for training/maintaining build plugins.
- A legacy system is near sunset; benefits will not pay off.
- Critical dependencies or tooling are incompatible, or production debugging depends on an agent that does not yet support Kotlin.
- Motivation is only reducing line count; shorter code but harder abstraction slows reviews.

Measure across a few releases, not by LOC. Provide a migration guide, pipeline owners, pair programming, and a rollback plan if the pilot reduces reliability.

> Senior tip: success criteria should be defect escape, lead time, and build/review time. A 1–2 module pilot over several releases gives more trustworthy data than a long rewrite without an exit path.`,
    follow: ['Which metrics do you choose to evaluate a Kotlin pilot?', 'How do you keep Java/Kotlin interop maintainable during transition?', 'When do you stop the pilot and decide not to expand?'],
  },
});
