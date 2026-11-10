/*
 * English translation of js/data/q-soft.js — task T216. Format: js/core/i18n.js (content overlay).
 * ids: testing-001 testing-002 testing-003 testing-004 testing-005 testing-006 testing-007 testing-008 testing-009 testing-010
 */
App.i18n.content({
  'testing-001': {
    q: `How do you design a test strategy for a Spring Boot service (orders + payments)? Test pyramid or testing trophy? When to use unit test, slice test ({{@WebMvcTest}}, {{@DataJpaTest}}) and full context ({{@SpringBootTest}})?`,
    a: `**Summary:** With Spring Boot service, use a **thick-middle pyramid**: many unit tests for logic, **slice test as middle layer** (Web / JPA / Redis), and very few E2E. Real-world ratio 70% unit, 25% slice, 5% E2E, and CI under 10 minutes is the goal — because if the team can't wait for tests, they'll skip them.

### Test pyramid vs testing trophy
| | Test pyramid (Mike Cohn, Martin Fowler popular) | Testing trophy (Kent C. Dodds) |
|---|---|---|
| Shape | very many unit, few integration, very few E2E | thin unit, thick integration, thin E2E |
| Viewpoint | bugs concentrated in business logic | most bugs lie at **integration boundaries**, not logic |
| When correct | complex domain, many rules | app with little logic, lots of I/O |

With Spring Boot, **trophy is the reasonable default**: framework already provides cheap middle layers (WebMvcTest, DataJpaTest) so no need to build separate infrastructure.

### Layer → test type mapping
| Layer | Test type | Annotation | Time |
|---|---|---|---|
| Domain / pure service | Unit | – | < 50 ms |
| Controller + validation + JSON | Slice web | {{@WebMvcTest}} | 1–2 s |
| Repository + JPQL | Slice JPA | {{@DataJpaTest}} | 2–4 s |
| Security, filter, async, message | Full context | {{@SpringBootTest}} + {{@AutoConfigureMockMvc}} | 10–30 s |
| Multiple services, DB, broker | E2E | Testcontainers + compose | minutes |

### Example 3 tiers for Order module
~~~java
// 1. Unit: pure logic, no mock needed
class OrderPricingTest {
    @Test void vip_gets_10_percent_off() {
        var pricing = new OrderPricing(new VipTierRepositoryStub());
        assertThat(pricing.total(basePrice(1_000_000), Tier.VIP)).isEqualTo(900_000);
    }
}

// 2. Slice web: only web layer loaded, service replaced by mock
@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean OrderService service;   // Boot 3.4+; @MockBean deprecated
    @Test void create_returns_201() throws Exception {
        given(service.create(any())).willReturn(OrderResponse.of("OD-1"));
        mvc.perform(post("/api/orders").contentType(APPLICATION_JSON).content("{}"))
           .andExpect(status().isCreated());
    }
}

// 3. Full context: only 1–2 smoke tests for payment flow
@SpringBootTest
@AutoConfigureMockMvc
class CheckoutFlowIT { /* login -> create order -> pay -> reconcile */ }
~~~

### Common traps
- **Using {{@SpringBootTest}} for everything** → CI slow, loss of trust in pipeline, dev starts ignoring red tests.
- **Context cache**: Spring caches ApplicationContext by config; each config change builds new context ⇒ group tests with same config into one class, avoid {{@DirtiesContext}}.
- **H2 instead of Postgres** at repository layer ⇒ wrong dialect, wrong unique/index behavior ⇒ bugs only surface in production.
- **E2E running in parallel using shared DB** ⇒ data noise, tests fail randomly.

> Senior tip: start with the question "where did the team's recent bugs come from?". If most bugs come from HTTP↔domain mapping or SQL, invest in slice tests, don't write more unit tests for domain — that's the opposite direction of "test more".`,
    follow: [
      'Do you use {{@SpringBootTest}} with {{webEnvironment = RANDOM_PORT}} and {{TestRestTemplate}}? When is that better than {{MockMvc}}?',
      'How does Spring context cache work, and how do you leverage it in CI?',
      'For a microservice with Kafka, how do you test the consumer while keeping speed?'
    ]
  },
  'testing-002': {
    q: `Why use Testcontainers for integration tests instead of H2/embedded database? How to make the test suite fast enough (reuse container, singleton pattern) yet trustworthy?`,
    a: `**Summary:** Testcontainers runs the **exact production engine** (Postgres 16, Redis 7, Kafka) in Docker, so it eliminates the layer of bugs "works on H2, dies in production". The downside is each container startup takes a few seconds — fixed by **singleton container** (shared 1 instance across suite) and **reuse** (keep container alive between local runs).

### Where H2 fails — differences that have caused incidents
| Behavior | H2 | Real Postgres |
|---|---|---|
| JSON type | none | {{jsonb}} + GIN index |
| Auto increment | sequence | identity/sequence behaves differently |
| {{ON CONFLICT DO UPDATE}} | limited support | full, with {{RETURNING}} |
| Timezone | follows JVM | follows column {{timestamptz}} + session |
| String compare / sort | compatibility mode, simple collation | DB collation (ORDER BY differs), {{ILIKE}}, {{citext}} |
| Constraint / trigger | missing or different | full, including trigger |

Any query relying on index, unique, or transaction isolation is **untrustworthy** on H2.

### Using Testcontainers in Spring Boot 3
~~~java
@Testcontainers
@SpringBootTest
class OrderRepositoryIT {
    @Container
    @ServiceConnection                    // Boot 3.1+: auto-connect to spring.datasource.*
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("orders")
            .withInitScript("db/seed.sql");

    @Autowired OrderRepository repo;

    @Test void query_by_status_uses_index() { ... }
}
~~~
- If using JUnit 5 without {{@ServiceConnection}}, declare {{@DynamicPropertySource}} pointing to container URL/username/password.
- Testcontainers also has "container for everything": Redis, Kafka, MongoDB, LocalStack (to test AWS SDK without a real account).

### Speeding up — three techniques
1. **Singleton pattern**: one {{static}} container shared across the whole suite, started once instead of per test class.
2. **Reuse**: {{withReuse(true)}} + set {{testcontainers.reuse.enable=true}} in {{~/.testcontainers.properties}} → container survives across multiple {{mvn test}} runs on dev machine. Only enable locally; disable in CI because each job is a clean environment.
3. **Warm image**: pull image in advance, use specific tag (not {{latest}}) to leverage Docker layer cache.

### Common traps
- **No Docker in CI** ⇒ must choose a Docker-capable runner or remote service container; if not, don't pretend H2 is equivalent — document limitations in README.
- **Container not stopped** when test fails ⇒ container leak, fills disk. Testcontainers uses "Ryuk" to clean up, but if Ryuk is disabled you must clean manually.
- **Port conflict** when running in parallel ⇒ always let container assign dynamic port, don't hardcode.
- **Slow tests waiting for database**: every test runs migration ⇒ collect migrations in {{@Sql}} or run Flyway once.

> Senior tip: measure before optimizing. A suite of 400 tests with a shared Postgres container usually runs ~3–5 minutes — much faster than each dev debugging a bug that only appears on Postgres and no one on the team can reproduce.`,
    follow: [
      'How do you share one container across a module while keeping data independence between tests?',
      'Should you enable {{@ServiceConnection}} for both Redis and Kafka, or only Postgres?',
      'If CI runner has no Docker, how do you solve "test on real DB"?'
    ]
  },
  'testing-003': {
    q: `How do you distinguish stub, mock, spy, and fake in unit tests? When is excessive mocking a code smell, how do you recognize it, and how do you deal with it?`,
    a: `**Summary:** The four types of test doubles (test double = a stand-in object used in place of a real dependency during testing) differ in how "fake" they are: a stub only returns data, a spy is a real object that records calls, a mock both returns data and **verifies behavior**, and a fake is a simplified but working implementation. Too much mocking is a smell because the test is **asserting internal structure** instead of observable behavior — every refactor breaks tests even though the system is still correct.

### The four types of test doubles
| Type | Purpose | In Mockito (Mockito = a popular Java library for creating test doubles) |
|---|---|---|
| Stub | configure a fixed output | {{when(...).thenReturn(...)}} |
| Spy | a real object that records calls for verification | {{spy()}} |
| Mock | define expectations, verify calls | {{mock()}} + {{verify()}} |
| Fake | a lightweight but real implementation | a hand-written class, e.g. an in-memory repo |

Core difference: **a stub only answers, a mock answers and is also verified for how it was called**. If a test uses {{when}} but never {{verify}}, it is essentially just a stub.

### Example — assert behavior, not internal calls
~~~java
// Not good: test is tightly coupled to implementation, code change breaks the test
verify(paymentGateway).charge(eq(500_000L), eq("CARD-1"));

// Good: assert the observable result
Order order = service.place(cmd);
assertThat(order.status()).isEqualTo(PAID);
assertThat(order.chargedAmount()).isEqualTo(500_000L);
~~~

### Signs of excessive mocking
- **Observing call counts instead of results**: the test is full of {{verify(mock, times(3))}} but asserts no value coming out of the system.
- **You must fix mocks every time implementation changes**: a sign you are testing "how" rather than "what".
- **A test that is empty in business meaning**: you change all the logic inside the service and the test still stays green.
- **Mock propagation**: a mock of a mock, a deep call chain into lower layers — usually a sign of a missing abstraction (abstraction = a simpler interface that hides details).
- **Unusually slow tests**: heavy mocking often comes with complex setup; reconsider whether something belongs in an integration test layer instead.

### How to handle it
1. **Replace mocks with fakes when possible**: an in-memory repository, a fixed {{Clock}} (Clock = a Java time source you can inject and replace in tests), a JSON fixture instead of a real HTTP client.
2. **Mock only at external system boundaries**: HTTP client, message broker (message broker = middleware like Kafka/RabbitMQ that passes messages between services), clock, random — places you do not control.
3. **Move assertions to observable output**: entity state, return value, published event.
4. **Let lower layers be tested with real implementations** instead of mocking at the upper layer.
5. **Use contract tests** (contract test = a test that checks the agreement between services at the API level) for inter-service agreements instead of long-lived mocks in unit tests.

### Why excessive mocking makes tests "brittle"
When you write {{verify(repo).save(any())}} or {{verify(mapper, times(2)).toDto(any())}}, the test is asserting **how** the code works, not **what** result it produces. A valid refactor — merging two mapping calls into one, changing {{save}} to {{saveAll}} — does not break behavior but turns the test red. Over time the team becomes afraid to refactor because "change 1 line, 30 tests turn red." A practical rule: **mock at system boundaries** (an outgoing HTTP client, a message broker, a clock, a payment gateway) and **use real objects or fakes for everything inside** (domain objects, mappers, validators, in-memory repositories). Only verify a call when that call **is the behavior** you need to check, for example "exactly 1 confirmation email must be sent."

### Real-world example
An order module had 420 unit tests; 80% used Mockito with an average of 6 mocks each. When {{OrderService}} was split into two smaller classes, 140 tests turned red even though there were no bugs; it took 3 days to fix the tests. Analysis: most tests verified the call order between mapper, validator, and repository. The team wrote an {{InMemoryOrderRepository}} (a fake, about 40 lines using a {{HashMap}}), used the real mapper and validator, and only mocked {{PaymentGateway}} and {{Clock}}. The number of tests dropped to 260 but the mutation score (PIT, mutation testing = a tool that deliberately breaks code to see if tests catch it) rose from 61% to 78%, and the next large refactor turned only 6 tests red — all real behavior changes.

### Sample interview answer
"A stub only returns fixed data, a mock returns data and also lets you verify calls, a spy is a real object whose calls are recorded, and a fake is a lightweight but working implementation, like an in-memory repository. I mock at system boundaries such as an HTTP client, a broker, a payment gateway, or a clock, and inside I use real objects or fakes. Signs of too much mocking are five or six mocks in a test, verifying the order of internal calls, and a refactor that does not change behavior turning lots of tests red — that means the tests are locking down structure instead of protecting behavior. To fix it I assert observable results, replace mocks with fakes for repositories, and if a class needs too many mocks that usually means the class is doing too much and should be split. I use mutation testing to check whether tests actually catch bugs."

> Senior tip: a personal rule I use when reviewing a PR — **a test should only fail when observable behavior changes**. If renaming a private variable or adding an intermediate class makes the test red, that test is asserting structure, and it will make the team hate writing tests.`,
    follow: [
      'Do you use {{@ExtendWith(MockitoExtension.class)}}? What issues do {{@Mock}} with {{@InjectMocks}} have?',
      'How does a fluent assertion library (AssertJ) help compared to plain JUnit {{assertEquals}}?',
      'When should you use {{@Spy}} instead of {{@Mock}}?'
    ]
  },
  'testing-004': {
    q: `Two services call each other and you fear one changing API breaks the other. How does contract testing (Spring Cloud Contract / Pact) solve this? When to use, and what's the operational cost?`,
    a: `**Summary:** Contract test verifies the **agreement between consumer and provider** at API level, instead of full integration test. Two directions: **consumer-driven** (Pact — consumer writes expectations then publishes pact to broker) and **provider-driven** (Spring Cloud Contract — provider defines contract, framework generates tests for consumer). This is the right answer when the team is stuck at "deploy fast but don't dare change API".

### Two approaches
| | Pact (consumer-driven) | Spring Cloud Contract (provider-driven) |
|---|---|---|
| Who writes contract | consumer describes what it needs | provider describes what it offers |
| Artifact | pact JSON/YAML file, publish to Pact Broker | contract file in provider repo (Groovy DSL) |
| Verification | provider runs {{pactVerify}} on CI | provider generates tests, consumer runs tests with stub server |
| Risk | many consumers ⇒ many contract versions | provider changes contract ⇒ breaks consumer |

Mixing is possible: Pact for active consumer, Spring Cloud Contract for shared systems with many services.

### Consumer contract example
~~~java
// consumer: payment-service
@ExtendWith(PactConsumerTestExt.class)
@PactTestFor(providerName = "order-service")
class PaymentConsumerPactTest {
    @Pact(consumer = "payment-service")
    public RequestResponsePact orderNotFound(PactDslWithProvider builder) {
        return builder.given("order 999 does not exist")
            .uponReceiving("get order 999")
                .path("/api/orders/999").method("GET")
            .willRespondWith().status(404)
                .body(new PactDslJsonBody()
                    .stringValue("code", "ORDER_NOT_FOUND"))
            .toPact();
    }
}
~~~

### CI workflow
1. Consumer runs test → generates pact file → publishes to Pact Broker by branch/commit.
2. Provider pipeline pulls matching pact and runs {{pactVerify}} → **fails build if API deviated**.
3. Breaking change blocked at CI, not at production deploy.

With Spring Cloud Contract, provider writes contract in Groovy DSL and the framework generates both stub server for consumer and verification test for provider.

### When to use / when not
- **Use**: many services, deploy frequencies differ, API contracts change frequently, need independent deploy.
- **Don't need**: 2 small services, already have E2E integration test in staging, or team lacks capacity to operate Pact Broker (another infrastructure needing deploy, backup, monitoring).

### Common traps
- **Contract test doesn't replace integration test**: it guarantees "API shape", not "business semantics".
- **Pact bloats** if every test generates one interaction; collect important cases into one pact, remove old interactions after consumer deployed.
- **Silent breaking change**: provider changes response but consumer hasn't deployed — need clear version and deprecation window policy.
- **Only testing happy path** in contract: describe errors (4xx) too because that's where things break most.

> Senior tip: contract test is most valuable when it **runs in CI on both sides** and failure actually blocks deploy. If it only exists on paper, it's just a pretty document — prove it by intentionally changing response once and showing the build turn red.`,
    follow: [
      'How does Pact Broker store contract versions, and how to handle when a consumer is deleted?',
      'Should you use OpenAPI + request/response validator instead of Pact when the system isn\'t too large?',
      'How to ensure contract test catches **semantic** errors (different data type) not just shape differences?'
    ]
  },
  'testing-005': {
    q: `How do you test time-dependent code ({{Clock}}, {{LocalDateTime}}) and concurrent code without flakiness? Do you use Awaitility, {{CountDownLatch}}, or something else?`,
    a: `**Summary:** The principle is to **push time and scheduling dependencies out of code via interface**, then in tests replace with fake clock and wait conditions with timeout. Absolutely avoid {{Thread.sleep}} in tests: it's the source of 90% flaky tests.

### Problem 1 — time dependency
If service calls {{Instant.now()}} directly, test depends on system time, dev machine timezone, and CI time — same code passes and fails randomly.

~~~java
@Service
public class VoucherService {
    private final Clock clock;                       // inject, not new Date()
    VoucherService(Clock clock) { this.clock = clock; }

    public boolean isExpired(Voucher v) {
        return Instant.now(clock).isAfter(v.expiresAt());
    }
}

// production
@Bean Clock clock() { return Clock.systemDefaultZone(); }

// test: fixed time, no wait needed
Clock fixed = Clock.fixed(Instant.parse("2026-03-01T10:00:00Z"), ZoneOffset.UTC);
~~~
- With {{LocalDate.now()}} (date by local timezone), use {{Clock}} + specific {{ZoneId}} to avoid date shift between UTC-7 and UTC+7.
- With cron/scheduler: **don't test a specific time point**, separate "compute list of tasks to do" into a pure function receiving {{Instant}} then call directly in test.

### Problem 2 — waiting for a state (Awaitility)
~~~java
await().atMost(Duration.ofSeconds(3))
       .pollInterval(Duration.ofMillis(50))
       .untilAsserted(() ->
           assertThat(orderRepository.findById(id).orElseThrow().getStatus())
               .isEqualTo(Status.PAID));
~~~
- {{await()}} **polls** within allowed time and **fails fast** when time expires — this is the difference from {{Thread.sleep}}.
- Always set timeout **just right**: too long slows CI, too short causes false failures.
- With future/batch job, use {{Awaitility}} + status flag in DB, don't measure by "wait until you see log".

### Problem 3 — concurrency testing
~~~java
@Test void concurrent_deduct_has_no_lost_update() throws Exception {
    // initial balance 1000, 8 threads each deduct 100
    var barrier = new CyclicBarrier(8);            // 8 threads start together
    var pool = Executors.newFixedThreadPool(8);
    var futures = new ArrayList<Future<?>>();

    for (int i = 0; i < 8; i++) {
        futures.add(pool.submit(() -> {
            barrier.await();                         // sync start point
            accountRepository.deduct(100);
            return null;                             // Callable: allows checked exception
        }));
    }
    for (var f : futures) f.get(10, TimeUnit.SECONDS);
    pool.shutdown();

    assertThat(accountRepository.findById(1).orElseThrow().getBalance()).isEqualTo(200);
}
~~~
- **Barrier/latch to create real race**: without synchronizing start point, race rarely occurs and test is "false green".
- With Java 21 you can use **virtual threads** to simulate thousands of concurrent requests while test stays fast.
- Need **timeout** for every concurrency test: hanging test hangs the whole pipeline.

### Common traps
- **Using {{@TestMethodOrder}}** to "force" order → hides tests that depend on each other's state. Rewrite so each test creates its own data.
- **Random without seed** → unreproducible failures. Always pass fixed seed.
- **Different locale/TZ between dev and CI**: formatting by default locale is a source of "works on my machine" bugs.
- **Async test doesn't wait**: result asserted before background task runs.

> Senior tip: if a test fails ~1/20 times, don't "rerun until green" — find the non-deterministic layer (time, order, shared data, race). Principle: **tests must be deterministic**, same commit must give same result.`,
    follow: [
      'Do you use {{@RepeatedTest}} or any tool to hunt race conditions?',
      'How do you test "retry with backoff" logic without waiting for real time?',
      'With event-driven systems, how do you control time besides using {{Clock}}?'
    ]
  },
  'testing-006': {
    q: `How much code coverage is enough? Why can you still have bugs with high coverage? How is mutation testing (PIT) different from coverage, and how do you use it in CI?`,
    a: `**Summary:** Coverage (code coverage = the percentage of code lines/branches executed by tests) measures **which lines of code were executed**, not "can the tests catch bugs." 80% coverage can come with 0% meaningful assertions. Mutation testing measures real value by **deliberately breaking the code** and seeing if tests detect it — so it is a complementary metric, not a replacement for coverage.

### How much coverage is enough?
| Level | Practical meaning |
|---|---|
| < 50% | the team is not serious about tests; needs support, not blame |
| 60–70% line | the minimum acceptable level for business logic |
| 80% line + 70% branch | a reasonable target for core business logic (branch coverage = checks whether each true/false path of an if/switch was executed) |
| 100% | usually the **wrong goal** — easily leads to meaningless tests just to make the number look good |

Do not apply a single threshold to the whole repo: **DTOs (Data Transfer Object = a simple data carrier class), entities, config, and generated code do not need coverage**; core business logic is the opposite.

### Why high coverage still has bugs
- The test only asserts "no exception thrown" → the line runs but a wrong result still passes.
- **Assertions missing on error branches**: a {{catch}} branch returns a default value and nobody checks it → coverage is still green.
- **Order-dependent tests** make some tests get "counted" for coverage indirectly.
- Coverage is **a function of the code**, not of test quality: just calling every method can reach 100%.

### How mutation testing (PIT) works
PIT generates **mutants** — broken versions of the code — then reruns the tests:
- A mutant is **killed** (the test turns red) → your assertion has meaning.
- A mutant **survived** (the test stays green) → you are missing an important test.

~~~xml
<plugin>
  <groupId>org.pitest</groupId>
  <artifactId>pitest-maven</artifactId>
  <!-- choose the latest version compatible with JDK 21 -->
  <configuration>
    <targetClasses>
      <param>com.acme.order.domain.*</param>
    </targetClasses>
    <mutationThreshold>70</mutationThreshold>
    <outputFormats><param>HTML</param></outputFormats>
  </configuration>
</plugin>
~~~
Typical mutants: change {{>=}} to {{>}}, remove an {{if}} branch, change a constant, replace {{null}} with a default value.

### How to use it in CI
- Run **PIT for core business** (the domain module), not for the whole repo — runtime is many times higher than normal tests.
- Set a **mutation threshold** as a quality gate (e.g. 70% on domain), and **run only on PRs or nightly** depending on pipeline speed (CI = Continuous Integration, an automated pipeline that builds/tests code on each change).
- Produce an HTML report so the team can see which mutants survived — that is exactly the list of "tests to add."

### Common pitfalls
- **Optimizing for the number**: writing empty tests to reach the threshold. This is why many teams drop the metric entirely.
- **Calculating mutation score over all code** including non-logic code → a meaningless drop in score.
- **A coverage gate slows PRs** if it reruns the whole suite; use a "coverage delta" (block when new code lowers quality) instead of blocking on the total.

### Real-world example
A shipping fee service had 92% line coverage and a green CI, but a bug caused customers in remote areas to be charged a fee of 0 for 3 days. Investigation: the tests called {{calculateFee()}} for every region but only asserted {{assertNotNull(result)}}. First PIT run: mutation score 54%; mutants "change {{>}} to {{>=}} at the distance threshold" and "return 0" both survived. The team added specific assertions for the fee value, tests for boundaries (exactly 50 km, 50.1 km), and set PIT to run on the core fee-calculation classes with a 75% threshold. PIT ran in incremental mode for only the changed classes in a PR (about 3 minutes); the full run ran nightly (about 25 minutes). Six months later the mutation score was 81%, no more fee-calculation bugs reached production; line coverage barely changed.

### Sample interview answer
"Coverage only tells you which lines ran, not whether the tests checked the results; a test that calls a function and only asserts non-null still counts as covered. So I do not set a single threshold for the whole repo. I set around 80% line and 70% branch for core business logic like pricing and authorization, and I exclude DTOs, config, and generated code. I use coverage to find untested areas, not to judge quality. Mutation testing with PIT answers the right question: it deliberately changes code, like flipping a comparison or returning a default value, and checks if tests turn red. A surviving mutant means there is behavior not being checked. In CI I run incremental PIT on classes changed in a PR to keep it fast, run the full version nightly, and set a threshold for the core module."

> Senior tip: use coverage as an **early sensor** (which module is untested, who just wrote code without tests) rather than as a goal. When you need a single number to argue with management, mutation score on the domain is more convincing than total coverage.`,
    follow: [
      'How does a coverage "ratchet" (block when new code lowers quality) work in a pipeline?',
      'Is mutation testing time-consuming, and how do you estimate the cost when adding it to CI?',
      'Do you use any tool to remove duplicate tests?'
    ]
  },
  'testing-007': {
    q: `How do you design load/performance test scenarios for an order API (JMeter, Gatling, k6)? How do you read p95/p99 to know if the system needs scaling or needs code fixes?`,
    a: `**Summary:** Load test isn't "hit API a million times" — it's **simulating real traffic** using workload model from production logs. When reading results, priority order is: **error rate → p99 → throughput → resources**. p99 rising while p50 stays nice is almost always a sign of **resource leak or contention**, not lack of machines.

### Choosing tools
| Tool | Strong at | Weak at |
|---|---|---|
| JMeter | quick GUI, many plugins, familiar in VN | messy scenarios, doesn't scale well, hard to read results |
| Gatling | written in Java/Scala, beautiful reports, handles millions of RPS | needs Scala/Java knowledge |
| k6 | extremely short JS scripts, runs well in CI, easy Grafana integration | complex scenarios become inconvenient |

For interview: **Gatling** (because written in Java, close to domain) or **k6** (fast, easy to demo) are both safe choices.

### Scenario design — 4 steps
1. **Get real workload** from APM/log: read/write ratio, distribution by endpoint, peak hours, payload size, logged-in user ratio.
2. **Choose load model**: ramp-up (measure warm-up), plateau (measure sustained capacity), spike (measure sudden surge), soak (memory leak).
3. **Set SLO as threshold**, not arbitrary numbers: e.g., {{p95 < 300 ms}}, {{p99 < 800 ms}}, error rate < 0.1%.
4. **Separate tiers**: test each tier (gateway, service, DB) to know where bottleneck is.

### k6 example
~~~javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    peak: {
      executor: 'ramping-arrival-rate',
      startRate: 50, timeUnit: '1s',
      preAllocatedVUs: 100, maxVUs: 500,
      stages: [
        { target: 200, duration: '2m' },
        { target: 1000, duration: '5m' },
        { target: 200, duration: '2m' },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<800'],
    http_req_failed: ['rate<0.001'],   // matches SLO error rate < 0.1%
  },
};

export default function () {
  const res = http.get(__ENV.BASE_URL + '/api/orders?page=1');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
~~~

### Reading results correctly
- **p99 is the most important number**: it reflects worst user experience. p50 nice + p99 bad ⇒ there's **queueing, GC pause, lock contention, connection pool exhaustion**, or **slow downstream**.
- **Throughput saturated** while latency straight up ⇒ hit limit; measure resources (CPU, GC, DB pool, DB connections) to identify bottleneck.
- **Error rate > 0**: could be timeout, connection refused, rate-limit — must read logs by response, don't just look at latency chart.
- **Don't compare latency across runs with different environments**: same data, same dataset size, same JVM config.

### Common traps
- **Forgetting warm-up**: first 5 minutes noisy due to JIT and empty cache ⇒ wrong conclusions.
- **Testing on dev machine** ⇒ measuring laptop bottleneck, not system.
- **Not simulating "coordinated omission"** in unsupported tools ⇒ latency looks better than reality. Gatling and k6 handle this well.
- **Running load test in production** at peak hours — nobody does it, but worth mentioning as a real interview question.

> Senior tip: always present **before/after numbers**. "p99 dropped from 1.2 s to 280 ms after adding index and cache" is an engineer's answer; "I ran load test" is a new hire's answer.`,
    follow: [
      'When do you choose arrival-rate (open model) vs constant VUs (closed model), and why?',
      'How do you simulate traffic with irregular (bursty) patterns instead of uniform?',
      'What do you do when you find the bottleneck is at the database tier rather than application?'
    ]
  },
  'testing-008': {
    q: `How do you review other people's code? What is on a senior reviewer's checklist, and how do you review effectively while still respecting your colleagues?`,
    a: `**Summary:** Review is not about hunting style bugs — it is about **protecting the product and passing on standards**. A senior checklist has 4 groups: is it correct? is it safe? will it break at scale? can others read it? The most respectful way is to **state the priority of each comment** so the author knows what blocks the merge and what is optional.

### A senior review checklist
| Group | Questions that must be answered |
|---|---|
| Correct | logic, null, edge cases (edge case = an unusual input like empty, 0, expired date), idempotency (idempotency = running the same operation twice gives the same result) |
| Safe | SQL injection (SQL injection = an attack where user input is executed as SQL), secrets in logs, authorization, uncontrolled input |
| Sustainable | N+1 query (N+1 = 1 query to fetch a list + N extra queries for each item), missing index, a transaction wrapping slow I/O, memory leak |
| Compatible | does a response change break old clients? is the migration safe on rollback? (rollback = reverting to the previous version) |
| Operable | are logs/metrics/traces enough to debug at 3 a.m., retry/circuit breaker (circuit breaker = stops calling a failing dependency to prevent cascading failure), timeout |
| Tested | does new logic have tests? are they flaky (flaky = fails randomly)? do they assert behavior? |
| Readable | clear names, right abstraction, comments explain **why** not **what** |

### How to write effective and respectful comments
- **Classify severity** — the most effective approach: {{must:}} (blocks merge), {{should:}} (should fix, can defer), {{nit:}} (style suggestion, does not block). The author immediately knows what is mandatory.
- **Explain the reason, not just the command**: "Here a query inside the loop becomes N+1 (100 records = 101 round trips), consider switching to a single {{IN}} query + mapping the results."
- **Give a direction to fix**: "I suggest extracting {{validate()}} out of the controller, because business rules in the web layer are hard to reuse."
- **Praise good parts**: good reviews include praise; specific praise ("the way you separated validation makes this easy to test") builds the right behavior faster than criticism.
- **Do not touch style when tools handle it**: if you have a formatter/linter (linter = a tool that automatically checks code style/rules), do not comment on formatting.
- **Review within a reasonable time**: commit to 24 working hours; a PR left for more than 3 days should be handed to someone else.

### Before / after example
- Before: "Why use {{List}} here? Use {{HashMap}}."
- After: "{{should:}} Here we need lookup by id so {{List}} is O(n) each time. With the expected data of a few thousand records that is acceptable, but if it can grow to hundreds of thousands, consider switching to {{Map}} for O(1) lookup."

### Common pitfalls
- **50 comments in one pass** ⇒ the author is overwhelmed and will not open PRs next time.
- **Approve then read carefully** — a formal review is worthless; read the diff first, comment after.
- **Arguing about style instead of design**: style should be decided by tools.
- **"Review for show"**: approving every PR without saying anything is also a form of damage.

### Real-world example
A team of 10 had an average review wait time of 2 days; many PRs received 30–40 comments, mostly about naming and formatting; a new developer asked to transfer teams because they felt "nitpicked." Meanwhile a PR that added {{@Transactional}} (a Spring annotation that wraps code in a database transaction) around an outgoing HTTP call slipped through review and exhausted the connection pool when the partner was slow. Changes made: formatter + Checkstyle + SpotBugs ran in CI so reviews no longer debated formatting; a comment prefix convention ({{blocking:}}, {{suggestion:}}, {{nit:}}, {{question:}}); PRs capped at around 400 lines; a mandatory checklist for transactions, queries, and security; a commitment to give the first review response within 4 working hours. After one quarter: review wait time dropped to 5 hours, the average number of comments per PR was halved, but the share of "blocking" comments that found real issues went up; there were no more incidents caused by a transaction wrapping I/O.

### Sample interview answer
"When I review I read the description and ticket first to understand the goal, then I look at the overall design before reading line by line. My checklist, in priority order: is it correct, including logic, edge cases, null, idempotency; is it safe, including authorization, injection, secrets in logs; will it hold up under load, like N+1, missing indexes, a transaction wrapping slow I/O; is it backward compatible, like API or migration changes; and finally, is it readable. I let automated tools in CI handle format and style. To respect colleagues I label the severity of each comment, what blocks merge versus what is only a suggestion, I explain reasons instead of giving orders, and I praise good parts. If we go back and forth more than three times I switch to a direct conversation. I also try to respond quickly, because a PR that waits long costs the team more than a missing comment."

> Senior tip: useful metrics for review quality are **time to first response** and **number of PR rounds to merge**. If a PR takes 3 rounds to merge, that is a communication or initial design quality problem, not a reviewer problem.`,
    follow: [
      'How do you handle it when a colleague disagrees with your comment and both sides have valid points?',
      'Should you use automated tools (SonarQube, review bots) to reduce the load on reviewers?',
      'What do you do when you find a PR with serious issues but the author is facing a deadline?'
    ]
  },
  'testing-009': {
    q: `As a lead, how do you design quality gates in the CI/CD pipeline? How do you handle flaky tests without making the team lose trust in the pipeline?`,
    a: `**Summary:** Pipeline must **fail fast and fail right**: lint → compile → unit → integration → contract → E2E → deploy, each tier with its own time budget. Flaky tests are **technical debt for the whole team** (the cause may be in the test, in the code, or in the CI infrastructure), not a fault to pin on one person — handle it by measuring, isolating, setting fix deadlines and banning "retry to green".

### Tiered pipeline design
| Tier | Content | Budget | When runs |
|---|---|---|---|
| 1. Lint & format | Checkstyle/Spotless, secret scan | < 2 min | every commit |
| 2. Compile + unit | build, unit test | < 3 min | every PR |
| 3. Integration | Testcontainers, slice test | < 10 min | every PR |
| 4. Contract | pact verify | < 5 min | PR + main |
| 5. E2E | API flow, smoke test (Playwright/REST Assured) | < 15 min | main, before deploy |
| 6. Deploy | canary + smoke + auto rollback | — | after merge |

Rule: **cheap tiers must fail first**. There's no point running a 15-minute E2E when compile is already broken. For urgent branches, allow bypassing tiers 4–6 but **not** bypassing unit tests.

### Specific quality gates
- **Coverage delta**: a PR must not reduce the quality of the new code (block by "ratchet" instead of a total threshold).
- **Mutation score** on domain module (nightly or periodic, because it is time-consuming).
- **Dependency & container scan**: OWASP Dependency-Check, Trivy for images.
- **Don't merge when the pipeline is red**: enable branch protection on GitHub/GitLab, merge rights only through the pipeline.

### Flaky test — 5-step process
1. **Measure first**: track the rate of random red runs by test id (CI providers usually have this built in).
2. **Reproduce**: rerun the failing test 20 times in CI to confirm it is random, not caused by a code change.
3. **Isolate immediately**: tag {{flaky}} and run it in a separate job, don't block merge — but **must have a ticket and an owner**.
4. **Set a deadline**: e.g., 7 days to fix; past the deadline delete that test and rewrite it at a lower, more stable tier (e.g., replace a flaky E2E with unit/integration tests covering the same behavior) — a test quarantined forever protects nothing.
5. **Fix the root cause** by cause group: order dependency, shared data, time, real network, resource contention.

~~~bash
# Reproduce flake: loop a test class 20 times, count red runs
for i in $(seq 1 20); do mvn -q test -Dtest=OrderServiceIT || echo "FAIL run $i"; done
# note: -Dsurefire.rerunFailingTestsCount only reruns tests that ALREADY failed (hides flake), don't use it for reproduction
~~~

### Common traps
- **Using retry to make the pipeline green**: hides the symptom and loses the warning signal too. If you are forced to retry to survive infrastructure incidents, move retry to a separate job and alert when the retry rate increases.
- **Quarantine without a deadline**: quarantine turns into a dump site. Always attach ticket + deadline.
- **E2E running on PR**: makes the PR take 20 minutes and everyone starts pushing many times, increasing CI load.
- **Only measuring "test count"** without measuring quality: 2,000 tests with 8% flaky is meaningless.

> Senior tip: track the 4 DORA metrics — deploy frequency, lead time, change failure rate, MTTR. They connect test quality directly to business value: reducing change failure rate is the most convincing argument when asking for more engineering resources.`,
    follow: [
      'Do you use "test sharding" (splitting the suite by class to run in parallel), and by what criteria?',
      'How do you ensure tests on CI run exactly like the local environment without creating another configuration problem?',
      'When should a flaky test be deleted rather than fixed?'
    ]
  },
  'testing-010': {
    q: `How do you organize test data and ensure tests are independent and reproducible? What anti-patterns do you often see when reading other teams' test code?`,
    a: `**Summary:** Good tests must **create their own data** and **not depend on order or time**. Use a factory/builder instead of huge fixtures, always seed random values, and clean up after each test. The three most common anti-patterns: {{@DirtiesContext}} to "fix" data pollution, depending on execution order, and embedding data directly in tests.

### Test data — 4 principles
1. **Each test creates its own data**: do not rely on data created by a previous test.
2. **Use a builder/factory instead of huge JSON fixtures** (fixture = pre-prepared test data, often a file): a 500-line fixture breaks whenever the model changes and hides what really matters.
3. **Random always has a seed** (seed = a starting value that makes random output repeatable): otherwise every failure is impossible to reproduce.
4. **Test data must be readable**: use meaningful variable names instead of {{user1}}, {{user2}}.

~~~java
class OrderFixtures {
    static Order pendingOrder(long customerId, LocalDateTime createdAt) {
        return Order.of(customerId, List.of(Item.of("SKU-1", 2)), createdAt, Status.PENDING);
    }
}

// the test creates its own data, does not depend on other tests
@Test void expired_order_is_rejected() {
    var order = pendingOrder(42L, LocalDateTime.now().minusDays(2));
    assertThat(service.validate(order)).isEqualTo(REJECTED);
}
~~~

### Ensuring reproducibility
- **Same seed ⇒ same result**: use a shared seed function for the whole suite, log the seed to CI for reproduction.
- **Same timezone and locale** (locale = regional settings like date/number format): set them fixed for the whole suite, do not let tests "work on my machine."
- **Do not rely on order**: if you are forced to use {{@TestMethodOrder}}, treat that as a sign the tests need redesign.
- **Data cleans itself up**: prefer transaction rollback for JPA tests (JPA = Java Persistence API, the standard for mapping Java objects to database tables), use {{@Sql}} to reset tables, or use a separate database for the suite.

### Anti-patterns often seen when reviewing other teams' tests
| Anti-pattern | Symptom | Consequence |
|---|---|---|
| Shared data | static variables, a DB shared by all tests | tests fail when run in parallel |
| Order dependency | test B needs data from test A | random failures, not reproducible |
| {{@DirtiesContext}} to "patch" | clearing cache/context on every test (DirtiesContext = tells Spring to rebuild the whole app context) | CI becomes many times slower |
| Overly long test | 200 lines, many unrelated asserts | you cannot tell where the error is |
| Missing assertions | runs but checks nothing | creates a false sense of safety |
| Hardcoded data | a 500-line JSON in the repo | hard to maintain, hides meaning |

### Common pitfalls
- **Generating large data in every test** (thousands of records) slows the suite; create the minimum data needed to cover the branch.
- **Deleting data with {{DELETE FROM}} in the wrong order** ⇒ violates foreign keys (foreign key = a database rule linking a column to another table's key). Use truncate cascade or rollback.
- **Tests depending on real environment data** (an old dev DB) ⇒ nobody can reproduce them outside that machine.

### Real-world example
A suite of 600 integration tests ran in 18 minutes and about 1 in 5 CI runs had a random red test. Investigation: (1) 40 tests shared a customer with a fixed email in {{data.sql}}, so parallel runs collided on a unique constraint (unique constraint = a database rule that a value must be unique); (2) 25 tests used {{LocalDateTime.now()}} so they turned red at month end; (3) 60 classes had {{@DirtiesContext}}, causing the Spring context to restart more than 60 times. Fixes: a builder generating data with a unique email/code per test ({{"user-" + UUID}}); inject {{Clock}} and use {{Clock.fixed}} in tests; remove {{@DirtiesContext}}, truncate data after each test, and share one Testcontainers container (Testcontainers = a library that runs real databases in Docker for tests) for the whole suite. Result: runtime dropped to 7 minutes, random red rate fell below 1%; any red test could be reproduced locally.

### Sample interview answer
"I follow the rule that each test creates the data it needs using a builder or factory with sensible defaults, stating only the fields that matter for that test, and I use unique values like UUID so parallel runs do not collide. Anything non-deterministic is controlled: time through an injected Clock, random with a seed, IDs generated through a replaceable interface. After each test I clean up data, by rollback or truncate, instead of using DirtiesContext because it restarts the Spring context and makes the suite very slow. For integration tests I use Testcontainers with a real DB, started once for the whole suite. The most common anti-patterns are huge shared SQL fixtures, tests that depend on execution order, using real time, and sleep to wait for async work instead of waiting on a condition. I treat a randomly failing test as a real bug to fix, not something to rerun until green."

> Senior tip: a quick way to check another team's test quality is to **wipe the database and run the tests in reverse order**. If they turn red ⇒ you have found order-dependent tests, and that is usually a hidden bug in the remaining tests too.`,
    follow: [
      'How do you handle test data that needs many relationships (foreign keys) in JPA tests?',
      'Should you use a random data generator like Java Faker in tests?',
      'How do you keep tests fast when the problem needs large historical data (for example, 1 year of data)?'
    ]
  }
});
