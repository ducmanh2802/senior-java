/*
 * English translation of js/data/q-kotlin.js — task T950. Format: js/core/i18n.js (content overlay).
 * ids: kotlin-027 kotlin-028 kotlin-029
 */
App.i18n.content({
  'kotlin-027': {
    q: 'The team wants to write a small microservice in Kotlin and is considering Ktor instead of Spring Boot. What criteria do you compare the two by, and when do you choose Ktor?',
    a: `**Summary:** **Ktor** is JetBrains' web framework for Kotlin, built on **coroutines**, very lightweight and **explicit**: you install each plugin yourself (serialization, auth, metrics), with no auto-configuration and no built-in DI. **Spring Boot** is a full ecosystem: auto-config, DI, Spring Data, Security, Actuator, thousands of integrations, but heavier and more "magic". I choose Ktor for **small, I/O-heavy services** where the team is fluent in Kotlin/coroutines and there are few enterprise integrations; I choose Spring Boot when you need the **ecosystem, company standards**, and the team comes mainly from Java.

### How Ktor works
- The app is a Kotlin function that configures the **engine** (Netty, CIO…) and installs **plugins**; routes are written with a DSL; each handler is a {{suspend}} function running on a coroutine.
- No classpath scanning, no proxies, no annotation magic → fast startup, easy to trace the request path.
- DI is not built in: pass dependencies by hand via constructors or use Koin.
~~~kotlin
fun main() {
    embeddedServer(Netty, port = 8080) {
        install(ContentNegotiation) { json() }          // kotlinx.serialization
        val repo = OrderRepository(dataSource())        // "DI" by hand
        routing {
            get("/orders/{id}") {
                val id = call.parameters["id"]?.toLongOrNull()
                    ?: return@get call.respond(HttpStatusCode.BadRequest)
                val order = repo.find(id)                // suspend: does not block the thread
                    ?: return@get call.respond(HttpStatusCode.NotFound)
                call.respond(order)
            }
        }
    }.start(wait = true)
}
~~~

### Comparison by criteria
| Criterion | Ktor | Spring Boot (Kotlin) |
|---|---|---|
| Model | Coroutine from the ground up | MVC blocking (+ virtual thread) or WebFlux + coroutine |
| Startup, memory | Light, fast | Heavier (reducible via CDS/AOT/native) |
| Built-in integrations | Few: you pick the DB library (Exposed, jOOQ, JDBC), security | Very many: Spring Data, Security, Kafka, Actuator, Cloud |
| Company standards | Must build yourself (logging, tracing, health) | Usually an internal starter already exists |
| Hiring, docs | Fewer | Very many |
| Testing | testApplication runs server in memory | Test slices, MockMvc, Testcontainers |
| Fit | Small services, gateway, BFF, internal tools | Large business systems, many integrations |

### Decision questions
1. Does the company have a **standard platform** (internal Spring starter for logging, tracing, security, config)? If yes → choosing differently means rebuilding everything for one service.
2. Is the team **truly fluent in coroutine** (structured concurrency, cancellation, dispatcher)? Ktor offers no easy "blocking fallback".
3. What **integrations** does the service need: complex JPA, Kafka, OAuth2 resource server… — Spring has them ready, Ktor must assemble them.
4. Are **resource/startup constraints** truly important (serverless, sidecar)?

### Real-world example
A team of 4 wrote a BFF (backend-for-frontend) aggregating data from 6 services for a mobile app using Ktor: each request calls the 6 services in parallel via {{async}}, startup about 1 second, runs on 256MB RAM. Good result. The next year the team wanted to write the payment service in Ktor too; when listing requirements (OAuth2 resource server, audit, outbox with Kafka, tracing per company standard), assembling them on Ktor was estimated to take about 5 extra weeks compared to using the internal Spring starter — they chose Spring Boot + Kotlin coroutines for that service. Both decisions were right for their context.

### Pitfalls
- Choosing Ktor because it is "light and modern" and then rebuilding security, health checks, tracing worse than the company standard.
- Calling blocking JDBC directly in a Ktor handler without switching to {{Dispatchers.IO}} → blocks the event loop thread.
- Too many frameworks in one company → hard to move people between teams.
- Judging Spring Boot "heavy" only by startup time while forgetting CDS, AOT, or native image.

### Interview notes
"Ktor is JetBrains' framework for Kotlin, built on coroutines, very light and explicit: I install each plugin myself, routes are written with a DSL, there is no auto-configuration and no built-in DI. Spring Boot is a whole ecosystem with DI, Spring Data, Security, Actuator and many integrations, at the cost of being heavier and more magical. I choose based on four questions: does the company already have a standard platform built on Spring, is the team truly fluent in coroutines, what integrations does the service need, and are resources or startup time truly important. For a BFF or small I/O-heavy service with a strong Kotlin team, Ktor fits well. For a business service needing OAuth2, Kafka, audit, tracing per company standard, I choose Spring Boot with Kotlin, because assembling those on Ktor costs many weeks and tends to be less standard."

> Senior tip: before choosing a framework different from the company standard, list every non-functional requirement (auth, logging, tracing, metrics, config, secrets, health) and estimate the cost of building them yourself. That number usually decides faster than any benchmark.`,
    follow: [
      'How do you do DI in Ktor as the service grows?',
      'What should you watch when calling blocking JDBC in Ktor regarding the dispatcher?',
      'How does Spring Boot with coroutines (suspend controller) differ from Ktor at runtime?'
    ],
  },
  'kotlin-028': {
    q: 'You write tests for a Kotlin backend with suspend functions and calls to other services. How do you use MockK, runTest (kotlinx-coroutines-test), and Spring Boot tests, and what mistakes make tests slow or flaky?',
    a: `**Summary:** Testing a Kotlin backend uses three main tools: **MockK** (a mock library written for Kotlin: understands {{suspend}}, final classes, objects, extensions), **runTest** from kotlinx-coroutines-test (runs coroutines in tests with **virtual time**, so a 10-second delay finishes instantly), and **springmockk** ({{@MockkBean}}) when mocking beans in a Spring context. Common mistakes: using {{runBlocking}} with real delays (slow), using Mockito with final Kotlin classes (cannot mock), and letting coroutines run outside the test scope (flaky).

### Why Mockito is "annoying" with Kotlin
- Kotlin classes are **final** by default → classic Mockito cannot create a subclass to mock (needs mockito-inline, now default since Mockito 5, but still awkward in many places).
- {{suspend fun}} has a hidden {{Continuation}} parameter → stubbing with Mockito is very verbose.
- The {{when}} syntax clashes with a Kotlin keyword.
MockK solves this with a DSL: {{every}}/{{coEvery}} to stub, {{verify}}/{{coVerify}} to check.

### MockK + runTest
~~~kotlin
class OrderServiceTest {
    private val payment = mockk<PaymentClient>()          // strict mock: unstubbed call -> error
    private val repo = mockk<OrderRepository>(relaxUnitFun = true)
    private val service = OrderService(payment, repo)

    @Test
    fun placesOrderAndRetriesOnce() = runTest {            // virtual time
        coEvery { payment.charge(any()) } throws IOException() andThen ChargeResult.OK
        val order = service.place(OrderRequest(amount = 100_000))
        assertEquals(OrderStatus.PAID, order.status)
        coVerify(exactly = 2) { payment.charge(any()) }    // 1 failure + 1 retry
        // service uses delay(2_000) before retry -> runTest skips it, test runs in milliseconds
    }
}
~~~
- {{coEvery}}/{{coVerify}} are for suspend functions; {{every}}/{{verify}} for regular functions.
- {{slot<T>()}} + {{capture}} to capture the actual argument and assert in detail.
- {{mockkObject(SomeObject)}} for an {{object}} singleton; remember {{unmockkAll()}} after the test.

### Controlling coroutines in tests
- runTest uses a **TestDispatcher**: every {{delay}} is "fast-forwarded"; {{advanceUntilIdle()}} drains all pending work.
- Code that hard-codes a dispatcher ({{Dispatchers.IO}}) **escapes** virtual time → **inject the dispatcher** via the constructor so tests can pass {{StandardTestDispatcher(testScheduler)}}.
- Coroutines launched with {{GlobalScope}} are not awaited by the test → flaky; use an injected scope.

### In Spring Boot
- {{@WebMvcTest}}/{{@WebFluxTest}} + {{@MockkBean}} (springmockk library) instead of {{@MockBean}}/{{@MockitoBean}} when using MockK.
- A {{suspend}} controller is tested with {{WebTestClient}} or MockMvc (Spring supports suspend controllers on MVC too).
- Repository tests with {{@DataJpaTest}} + Testcontainers, just like with Java.

### Real-world example
A Kotlin service with 400 tests taking 7 minutes. Cause: tests used {{runBlocking}} with retry logic containing real {{delay(1000..5000)}}, and 30% of tests used Mockito with {{open}} classes just to be mockable. Switching to runTest, injecting the dispatcher, using MockK, and removing {{open}} from business classes: suite down to 1 minute 40 seconds; 6 flaky tests caused by {{GlobalScope}} were fixed by injecting the scope.

### Pitfalls
- Mocking too much with {{relaxed = true}} → tests stay green even when code calls things wrong (mock returns default values for everything).
- Forgetting {{unmockkAll()}}/{{clearMocks}} → mocks leak between tests.
- Hard-coded dispatcher in code → no control over time.
- Using {{Thread.sleep}} inside a coroutine test.

### Interview notes
"With a Kotlin backend I use MockK instead of Mockito, because Kotlin classes are final by default and suspend functions have a hidden Continuation parameter, which Mockito handles very verbosely. MockK has every and coEvery for stubbing, verify and coVerify for checking, slot for capturing arguments, and can mock objects. I test coroutine code with runTest from kotlinx-coroutines-test: it runs on virtual time so a multi-second delay in retry logic finishes instantly. For that to work, code must inject its dispatcher and scope instead of hard-coding Dispatchers.IO or GlobalScope, otherwise coroutines escape virtual time and tests become both slow and flaky. In Spring I use @MockkBean from springmockk with test slices, and Testcontainers for repositories just like with Java. On one earlier service, switching to runTest and MockK brought the suite from 7 minutes to under 2 minutes."

> Senior tip: adopt the convention that every class using coroutines receives a CoroutineDispatcher or CoroutineScope through its constructor. That small convention decides whether coroutine code is testable deterministically or not.`,
    follow: [
      'How does a relaxed mock differ from a strict one, and when do you use relaxed?',
      'How do StandardTestDispatcher and UnconfinedTestDispatcher differ?',
      'How do you test a Flow that emits many values over time?'
    ],
  },
  'kotlin-029': {
    q: 'You want to avoid passing the wrong id (userId in place of orderId) in Kotlin code using value classes. What is the mechanism of @JvmInline value class, and what do you need to watch when passing it through JSON (Jackson / kotlinx.serialization), Spring, and JPA?',
    a: `**Summary:** {{@JvmInline value class OrderId(val value: Long)}} creates a **separate type at compile time** — the compiler errors if you pass {{UserId}} where {{OrderId}} is expected — but at runtime it is mostly **"unboxed"** into a plain {{long}}, costing almost no extra memory. The trade-off: function names taking value classes get **mangled** (renamed in bytecode) and reflection behaves unusually, so reflection-based frameworks (Jackson, Hibernate, Spring binding) need configuration, or you use value classes **only in the domain layer** and convert to primitive types at boundaries.

### The problem value classes solve
~~~kotlin
fun refund(userId: Long, orderId: Long, amount: Long)   // three parameters, all Long
refund(order.id, user.id, 50_000)                         // swapped, compiler stays silent -> refund to wrong order
~~~
With value classes:
~~~kotlin
@JvmInline value class UserId(val value: Long)
@JvmInline value class OrderId(val value: Long)
@JvmInline value class Vnd(val amount: Long) {
    init { require(amount >= 0) { "Amount cannot be negative" } }  // invariant checked at creation
}
fun refund(userId: UserId, orderId: OrderId, amount: Vnd)
refund(order.id, user.id, Vnd(50_000))                    // COMPILE ERROR: type mismatch
~~~

### Runtime mechanism
- When used with a static type, the compiler replaces {{OrderId}} with {{long}} → no object allocation.
- It gets **boxed** (a real object) when used as a general type: put into {{List<OrderId>}}, nullable type {{OrderId?}}, generics, or via an interface.
- A function taking a value class has its name mangled (e.g. {{refund-abc123}}) to avoid signature clashes after unboxing → **Java cannot call it directly**; use {{@JvmName}} when Java callers are needed.

### Through JSON
| Library | Status |
|---|---|
| kotlinx.serialization | Good support: annotate the value class with {{@Serializable}}, serializes as the inner value (e.g. number 42) |
| Jackson + jackson-module-kotlin | Recent versions support value classes but with limits (especially as Map keys, nullable, generics); verify carefully with your version or write a custom serializer |
Spring Boot uses Jackson by default; you can switch to kotlinx.serialization when the library is on the classpath (Spring has an HttpMessageConverter for it), but the choice must be consistent across the service.

### With Spring and JPA
- **Path variable / request param**: Spring must know how to turn "42" into {{OrderId}} → register a {{Converter<String, OrderId>}}, or accept {{Long}} in the controller and wrap it.
- **JPA/Hibernate**: support for value classes as a column or id is very limited due to name mangling and reflection; the safe approach is for the entity to keep {{Long}}, with domain/service using {{OrderId}} and conversion in the repository or mapper. Some teams use {{AttributeConverter}} for ordinary columns (not for ids).
- Principle: **value classes are strongest in the domain layer and internal API**; framework boundaries use primitive types.

### Real-world example
A refund incident: a {{refund(userId: Long, orderId: Long)}} function had its arguments swapped during a refactor, and 37 refunds went to the wrong order before reconciliation caught it. The team then introduced value classes for ids and amounts in the payment module; during the conversion, the compiler found **4 more pre-existing places** where the wrong type had been passed (luckily no incident, because values happened to coincide). The JPA entity still kept Long; the mapper converted at the repository. Measured performance cost was negligible.

### Pitfalls
- Putting a value class straight into a JPA entity as the id → hard-to-understand errors at startup or query time.
- Forgetting the converter for a path variable → unclear 400/500 errors.
- Using value classes in large collections on a hot path → boxing, losing the performance benefit.
- Calling from Java without {{@JvmName}} → the function is not visible.

### Interview notes
"A value class with @JvmInline creates a distinct type at compile time, so passing UserId where OrderId is expected is a compile error, but at runtime it is mostly unboxed into a plain long so it costs almost no extra memory. It still boxes when used in collections, generics, or nullable types. Function names taking value classes are mangled in bytecode, so Java cannot call them directly, and reflection-based frameworks need care. kotlinx.serialization supports them well; Jackson with the Kotlin module supports them but with limits, to be checked per version. With Spring I register a Converter for path variables. With JPA I keep the entity using Long and use value classes only in the domain layer, converting in the mapper. I once saw a swapped userId/orderId cause refunds to the wrong order; value classes block that class of error at compile time."

> Senior tip: start value classes from **functions with several parameters of the same primitive type in money flows** (ids, amounts, currencies). That is where the benefit is largest and the conversion cost smallest.`,
    follow: [
      'When does a value class get boxed, and how does that affect performance?',
      'How does a value class differ from a typealias?',
      'For modeling an amount with a currency unit, would you use a value class or a data class?'
    ],
  }
});
