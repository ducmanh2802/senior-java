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
    q: `Distinguish stub, mock, spy, fake in unit tests. When is too much mocking a code smell, how do you recognize it, and how do you handle it?`,
    a: `**Summary:** Four kinds of test double differ in **degree of "fake"**: stub only returns data, spy is the real object with call recording, mock both returns data and **verifies behavior**, fake is a simplified but real implementation. Too much mocking is a smell because the test is **asserting internal structure** rather than observable behavior — every refactor breaks tests while the system remains correct.

### Four test double types
| Type | Purpose | In Mockito |
|---|---|---|
| Stub | configure fixed output | {{when(...).thenReturn(...)}} |
| Spy | real object, records calls for verify | {{spy()}} |
| Mock | define expectations, verify anything | {{mock()}} + {{verify()}} |
| Fake | lightweight but real implementation | self-written class, e.g., in-memory repo |

Core difference: **stub only answers, mock answers and is also verified (verify) for calls**. If a test uses {{when}} without {{verify}}, it is essentially a stub.

### Example — assert behavior, not internal calls
~~~java
// Bad: test tied to implementation, code change breaks test
verify(paymentGateway).charge(eq(500_000L), eq("CARD-1"));

// Good: assert observable result
Order order = service.place(cmd);
assertThat(order.status()).isEqualTo(PAID);
assertThat(order.chargedAmount()).isEqualTo(500_000L);
~~~

### Signs of too much mocking
- **Observing call counts instead of results**: test full of {{verify(mock, times(3))}} without asserting any system value.
- **Have to fix mock every time implementation changes**: sign you're testing "how" not "what".
- **Business-empty test**: change all logic in service, test still green.
- **Mock propagation**: mock of mock, deep call chain — usually signals missing abstraction.
- **Unusually slow test**: lots of mocking usually accompanies complex setup; consider if something belongs to integration layer.

### How to handle
1. **Replace mock with fake when possible**: in-memory repo, fixed {{Clock}}, JSON fixture instead of real HTTP client.
2. **Only mock at external system boundaries**: HTTP client, message broker, clock, random — where you have no control.
3. **Shift assertions to observable output**: entity state, return value, published event.
4. **Let lower layer be tested with real implementation** instead of mocking at upper layer.
5. **Contract test** for inter-service agreement instead of long-term mock in unit test.

> Senior tip: my personal rule when reviewing PR — **a test should only fail when observable behavior changes**. If renaming a private variable or adding an intermediary class makes the test red, that test asserts structure, and it will make the team hate writing tests.`,
    follow: [
      'Do you use {{@ExtendWith(MockitoExtension.class)}}? What issues do {{@Mock}} with {{@InjectMocks}} have?',
      'How does Fluent assertion library (AssertJ) help compared to pure JUnit {{assertEquals}}?',
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
    q: `How much code coverage is enough? Why does high coverage still have bugs? How is mutation testing (PIT) different from coverage and how do you use it in CI?`,
    a: `**Summary:** Coverage measures **lines of code executed**, not "test catches bugs". 80% coverage can come with 0% meaningful assertions. Mutation testing measures real value by **deliberately breaking code** then seeing if tests detect it — so it's a supplementary metric, not a replacement for coverage.

### What coverage is enough?
| Level | Actual meaning |
|---|---|
| < 50% | team not serious about tests; needs support, not blame |
| 60–70% line | minimum acceptable for business logic |
| 80% line + 70% branch | reasonable target for core business |
| 100% | usually **wrong goal** — easily leads to meaningless tests for pretty numbers |

Don't apply a uniform threshold across repo: **DTO, entity, config, generated code don't need coverage**; core business logic does the opposite.

### Why high coverage still has bugs
- Test only asserts "no exception" → line runs fully but wrong result still passes.
- **Assertions missing in error branches**: {{catch}} branch returns default, nobody checks → coverage still green.
- **Order-dependent tests** make some tests "counted for coverage" indirectly.
- Coverage is **a function of code**, not test quality: just call all methods to reach 100%.

### How mutation testing (PIT) works
PIT generates **mutants** — wrong versions of code — then reruns tests:
- Mutant **killed** (test red) → your assertion has meaning.
- Mutant **survived** (test green) → you're missing an important test.

~~~xml
<plugin>
  <groupId>org.pitest</groupId>
  <artifactId>pitest-maven</artifactId>
  <!-- choose latest version compatible with JDK 21 -->
  <configuration>
    <targetClasses>
      <param>com.acme.order.domain.*</param>
    </targetClasses>
    <mutationThreshold>70</mutationThreshold>
    <outputFormats><param>HTML</param></outputFormats>
  </configuration>
</plugin>
~~~
Typical mutant: change {{>=}} to {{>}}, delete a branch {{if}}, change constant, replace {{null}} with default value.

### How to use in CI
- Run **PIT for core business** (domain module), not whole repo — runtime increases many times over normal tests.
- Set **mutation threshold** as quality gate (e.g., 70% on domain), and **run only on PR or nightly** depending on pipeline speed.
- HTML report so team sees which mutants survived — that's exactly the "tests to add" list.

### Common traps
- **Optimizing for numbers**: write empty tests to reach threshold. This is why many teams drop the metric entirely.
- **Calculating mutation score over all code** including non-logic code → meaningless score drop.
- **Coverage gate slows PR** if rerunning whole suite; should use "coverage delta" (block when new code lowers quality) instead of blocking total.

> Senior tip: use coverage as **early sensor** (which module isn't tested, who wrote code without tests) not as a goal. When you need one number to argue with management, mutation score on domain is more convincing than total coverage.`,
    follow: [
      'How does coverage "ratchet" (block when new code lowers quality) work in pipeline?',
      'Does mutation testing take a lot of time, and how do you estimate when adding to CI?',
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
    q: `How do you review others' code? What's in a senior reviewer's checklist, and how do you review effectively while respecting colleagues?`,
    a: `**Summary:** Review isn't style bug hunting — it's **protecting the product and transmitting standards**. Senior checklist has 4 groups: correct? safe? won't break at scale? readable by others? The most respectful way is **state priority of each comment** so the author knows what's blocking merge and what's optional.

### Senior review checklist
| Group | Must-answer questions |
|---|---|
| Correct | logic, null, edge (empty, 0, expired date), idempotency |
| Safe | SQL injection, secret in log, authorization, unvalidated input |
| Sustainable | N+1 query, missing index, transaction wrapping slow I/O, memory leak |
| Compatible | response change breaks old clients? migration safe on rollback? |
| Operational | log/metric/trace enough for 3 AM debug, retry/circuit breaker, timeout |
| Tested | new logic has tests? flaky? asserts behavior? |
| Readable | names clear, abstraction correct, comments explain **why** not **what** |

### Writing effective and respectful comments
- **Classify severity** — most effective: {{must:}} (blocks merge), {{should:}} (should fix, can defer), {{nit:}} (style suggestion, doesn't block). Author knows what's mandatory.
- **Explain reason, not just command**: "Here the query inside loop becomes N+1 (100 records = 101 round-trips), consider changing to a single {{IN}} query + map results."
- **Provide fix direction**: "I suggest extracting {{validate()}} out of controller, because business rules in web layer are hard to reuse."
- **Praise good parts**: good reviews include praise; specific praise ("the way you separated validation is very testable") builds correct behavior faster than criticism.
- **Don't touch style when tools handle it**: if formatter/linter exists, don't comment on format.
- **Review within reasonable time**: commit to 24 working hours; PR left >3 days should be handed to someone else.

### Before / after example
- Before: "Why use {{List}} here? Use {{HashMap}}."
- After: "{{should:}} Here we need lookup by id so {{List}} is O(n) each time. With expected data of a few thousand records it's acceptable, but if it can reach hundreds of thousands, consider switching to {{Map}} for O(1) lookup."

### Common traps
- **50 comments in one pass** ⇒ author overwhelmed, won't open PR next time.
- **Approve then read carefully** — formal review is worthless; read diff first, comment after.
- **Debating style instead of design**: style should be decided by tools.
- **"Review" just to say something**: reviewing all PRs silently is also a form of damage.

> Senior tip: useful metrics for review quality are **first response time** and **number of PR rounds to merge**. If a PR needs 3 rounds to merge, that's a communication or design quality issue, not reviewer issue.`,
    follow: [
      'How do you handle when a colleague disagrees with your comment and both have valid points?',
      'Should you use automated tools (SonarQube, review bot) to reduce reviewer load?',
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
    q: `How do you organize test data and ensure tests are independent, reproducible? What anti-patterns do you commonly see when reading others' test code?`,
    a: `**Summary:** Good tests must **create their own data** and **not depend on order or time**. Use factory/builder instead of huge fixtures, always seed random, and clean up after each test. Three most common anti-patterns: using {{@DirtiesContext}} to "fix" data pollution, depending on execution order, and embedding data directly in tests.

### Test data — 4 principles
1. **Each test creates its own data**: don't rely on previous tests' data.
2. **Use builder/factory instead of huge JSON fixtures**: 500-line fixtures break when model changes and hide what's really important.
3. **Random always has seed**: otherwise each failure is unreproducible.
4. **Test data must be readable**: use meaningful variable names instead of {{user1}}, {{user2}}.

~~~java
class OrderFixtures {
    static Order pendingOrder(long customerId, LocalDateTime createdAt) {
        return Order.of(customerId, List.of(Item.of("SKU-1", 2)), createdAt, Status.PENDING);
    }
}

// test creates itself, doesn't depend on other tests
@Test void expired_order_is_rejected() {
    var order = pendingOrder(42L, LocalDateTime.now().minusDays(2));
    assertThat(service.validate(order)).isEqualTo(REJECTED);
}
~~~

### Ensuring reproducibility
- **Same seed ⇒ same result**: use shared seed function for suite, log seed to CI for reproduction.
- **Same timezone and locale**: set fixed throughout suite, don't let tests "work on my machine".
- **Don't rely on order**: if forced to use {{@TestMethodOrder}}, treat it as a signal to redesign.
- **Self-cleaning data**: prefer transaction rollback for JPA tests, use {{@Sql}} to reset tables, or use separate DB for suite.

### Common anti-patterns when reviewing team tests
| Anti-pattern | Signs | Consequence |
|---|---|---|
| Shared data | static variables, common DB for all tests | failures when running parallel |
| Order dependency | test B needs data from test A | random failures, unreproducible |
| {{@DirtiesContext}} to "patch" | clearing cache/context every test | CI slows many times |
| Too long test | 200 lines, many unrelated asserts | don't know where error is |
| Missing assertions | runs but checks nothing | false sense of safety |
| Hardcoded data | 500-line JSON in repo | hard to maintain, hides meaning |

### Common traps
- **Generating large data in every test** (thousands of records) slows suite; create minimal data sufficient to cover branches.
- **Deleting with {{DELETE FROM}} out of order** ⇒ violates foreign keys. Use truncate cascade or rollback.
- **Tests depending on real environment data** (old dev DB) ⇒ unreproducible outside that machine.

> Senior tip: a quick quality check of another team's tests is **clear DB and run tests in reverse order**. If red ⇒ you've found an order-dependent test, and that's usually a hidden bug in remaining tests too.`,
    follow: [
      'How do you handle test data needing many relationships (foreign keys) in JPA tests?',
      'Should you use random data generators like Java Faker in tests?',
      'How do you keep tests fast when the problem needs large historical data (e.g., 1 year of data)?'
    ]
  }
});
