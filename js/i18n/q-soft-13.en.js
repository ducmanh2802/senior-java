/*
 * English translation of js/data/q-soft.js — task T983. Format: js/core/i18n.js (content overlay).
 * ids: testing-041 testing-042 testing-043 testing-044 testing-045 testing-046 testing-047
 */
App.i18n.content({
  'testing-041': {
    q: 'Testcontainers starts a real Docker container from inside a Java test — what is Ryuk, how do container reuse between local runs and a singleton container help, and what should you watch out for when running tests in parallel on CI?',
    a: `**Summary:** Testcontainers is a Java library that connects to Docker, starts a real container (Postgres, Redis, Kafka, etc.), assigns a dynamic port, and effectively acts as a separate database running in isolation. Ryuk is a small companion container that cleans up the main container when the JVM shuts down. Reuse keeps a container alive between local runs to avoid repeated startup; a singleton container shares one container across the whole test suite. On CI, multiple jobs running in parallel must avoid port conflicts and leftover containers that fill up disk space.

### How Testcontainers works under the hood
When code calls new PostgreSQLContainer<>("postgres:16-alpine"):

1. Testcontainers connects to the Docker socket (/var/run/docker.sock on Linux) and asks Docker whether the postgres:16-alpine image is already present; if not, it pulls it.
2. Docker creates the container. Testcontainers asks Docker to assign a random port on the host machine, mapped to port 5432 inside the container. The test does not know the port in advance and must obtain it from pg.getJdbcUrl() after the container is ready.
3. Testcontainers waits for the container to report readiness: it scans container logs for the line "database system is ready to accept connections", or runs the pg_isready command inside the container.
4. After readiness, Testcontainers returns the connection URL (JDBC URL) to Spring, and the test writes code as usual with spring.datasource.url.

The container lives until the test finishes or the JVM shuts down.

### Ryuk: the garbage collector, not optional
Ryuk is a small Go container that runs on the same network as the main container. Each main container registers itself with Ryuk; when the JVM shuts down, Testcontainers calls Ryuk's HTTP API so Ryuk can remove the main container. If you disable Ryuk (disableRyuk()), the main container is not cleaned up automatically and you must delete it manually. If the JVM is killed with kill -9 or the machine loses power, Ryuk never receives the cleanup command -> leftover containers remain, Docker storage fills up on a self-hosted runner, and subsequent runs fail due to insufficient disk space.

### Container reuse: keep containers alive between local runs
By default, every mvn test run causes Testcontainers to create and then clean up containers => each suite waits for image pulls and container startup (from a second to several seconds). Enable reuse with:
- withReuse(true) on the container, and
- the line testcontainers.reuse.enable=true in the file ~/.testcontainers.properties.

Testcontainers assigns a fixed name to the container; the next run checks whether that container already exists and is running, then reuses it without restarting. Enable this only on developer machines. Disable reuse on CI: each job must be a clean environment, and a reused container will carry over data from the previous run and cause tests to fail unpredictably.

### Singleton container: one container for the whole suite
Mark the container as static final so JUnit starts it once for the entire test class, or place the container in an abstract base class so multiple subclasses share it:
~~~java
@Testcontainers
abstract class PgIT {
    @Container
    @ServiceConnection                       // Spring Boot 3.1+: auto-wires url/username/password
    static final PostgreSQLContainer<?> PG =
        new PostgreSQLContainer<>("postgres:16-alpine");
}

class OrderRepositoryIT extends PgIT {
    // 60 tests, no additional container started
}
~~~
@ServiceConnection (Spring Boot 3.1+) automatically binds spring.datasource.* into the test application, so you do not need to declare @DynamicPropertySource manually.

### Running multiple tests in parallel on CI
- Always let Docker assign dynamic ports; never hardcode port 5432, otherwise two jobs running at the same time on the same runner will hit Address already in use.
- The CI runner must have a Docker daemon. GitHub Actions can use service containers; if the runner has no Docker, use Testcontainers Cloud or accept running tests on an embedded database while documenting the limitation clearly.
- Watch runner memory limits: each Postgres container costs at least a few hundred MB; running too many parallel jobs on a small runner causes OOM.
- Having Docker does not automatically mean Testcontainers will work: the runner must mount the Docker socket or have privileged access.

### Realistic cost figures
| Component | Time |
|---|---|
| Pull image postgres:16-alpine (>100 MB) | 15-40 seconds on the first run, near 0 with layer cache |
| Container startup until pg_isready OK | 3-6 seconds |
| Ryuk container | 1-2 seconds, started once |
| Run migrations on an empty schema | 1-5 seconds |

A module with 300 repository tests sharing one container is about 8-15 seconds slower in total than H2, not 300 times slower.

### In production
Never ship Testcontainers into a production application running on Kubernetes or a real server - it is a testing tool. When errors occur on CI, check:
- Cannot connect to the Docker daemon -> the runner has no Docker or does not mount the socket.
- Containers not cleaned up after a test failure -> Ryuk was disabled or the JVM crashed; check docker ps and remove leftover containers.
- /var/lib/docker full on a self-hosted runner -> leftover containers have accumulated.

### Common pitfalls
- Using the image tag latest: the image changes constantly, Docker layer cache becomes useless, and builds are not reproducible. Always pin a version (postgres:16-alpine).
- The container is not declared static, or each test class creates its own container: CI starts hundreds of containers and fills up disk.
- Enabling reuse.enable=true on CI: stale data leaks between jobs.
- Disabling Ryuk for speed: leftover containers accumulate and the runner dies from lack of disk space.
- Test classes write to the same schema and run in parallel: flaky failures that waste days of debugging.

> Senior tip: present this decision to your lead with numbers from your own team: a repository suite of 300 tests runs in 4 minutes 20 seconds with a shared Postgres container versus 1 minute 10 seconds with H2; over the past 12 months we caught 4 SQL bugs that only failed on Postgres, and each production fix cost about a day. That is the argument of an experienced engineer.`,
    follow: [
      'If Ryuk is disabled (for example on a self-hosted runner with restricted permissions), how do you clean up leftover containers?',
      'How do you run Testcontainers on CI without a local Docker daemon (Docker-in-Docker, Testcontainers Cloud)?',
      'How do you balance fast tests and tests running on a real database within the same module?'
    ]
  },

  'testing-042': {
    q: 'Your payment API supports an idempotency key. How do you write a test to prove that multiple requests with the same key arriving concurrently charge money exactly once?',
    a: `**Summary:** An idempotency test must reproduce the real failure condition: **multiple requests with the same idempotency key arriving almost at the same time**, running on a **real DB** (Testcontainers) because the deduplication mechanism relies on unique constraints and database transactions. The test releases N threads simultaneously using {{CountDownLatch}}, then asserts the final state: exactly **one** ledger entry, the balance deducted exactly **once**, and the remaining requests receiving the same result or a 409.

### Why a sequential test is not enough
A test like "call the API twice in a row, the second time returns the cached result" only checks the branch where **the record already exists**. The real production failure happens when two requests arrive a few milliseconds apart: both read "no key yet", both charge money (check-then-act). Only parallel execution exposes this bug. And you must use the **same kind of DB** as production: H2 handles locks and isolation differently from PostgreSQL, so a test may pass on H2 yet still be wrong on Postgres.

### Creating a deliberate race
~~~java
@Test
void sameKeyConcurrentRequestsChargeOnce() throws Exception {
    int threads = 20;
    var start = new CountDownLatch(1);
    var pool = Executors.newFixedThreadPool(threads);
    List<Future<Integer>> results = new ArrayList<>();
    for (int i = 0; i < threads; i++) {
        results.add(pool.submit(() -> {
            start.await();                                   // every thread waits at the starting line
            return client.charge("key-123", 100_000).statusCode();
        }));
    }
    start.countDown();                                       // release all at once to create contention
    pool.shutdown();
    assertTrue(pool.awaitTermination(30, TimeUnit.SECONDS)); // timeout, never hang CI
    for (var f : results) assertThat(f.get()).isIn(200, 409);
    assertThat(ledgerRepo.countByIdempotencyKey("key-123")).isEqualTo(1); // exactly 1 ledger entry
    assertThat(walletRepo.balance(USER_ID)).isEqualTo(INITIAL - 100_000); // deducted exactly once
}
~~~
The key point: **assert the final state in the DB**, not just the HTTP status. Repeat the test many times (for example {{@RepeatedTest(20)}}) so that buggy code exposes the failure reliably rather than occasionally.

### Scenarios you must cover
| Scenario | Expectation |
|---|---|
| Same key, same body, concurrent | 1 ledger entry; other requests return the same result or 409 "processing" |
| Same key, **different** body | 422: key already used for a different request (avoids client confusion) |
| First request fails mid-way (DB rollback) | A retry with the same key is processed again, not stuck in "processing" forever |
| Stored key expires (for example after 24 hours) | Behavior matches what the API documentation describes |
| Kafka consumer receives a duplicate message | Processed once thanks to a processed_message table with a unique key |

### Real-world example
An e-wallet had an idempotency test that ran sequentially and always passed. In production, 37 transactions were double-charged in one month, all when the mobile app retried after 2 seconds due to a slow network. Reading the code: the service checked {{findByKey}} and then inserted, with no unique constraint. The team wrote the parallel test above: the old code failed 20/20 times (in one run it created 4 ledger entries). The fix: a unique constraint on the idempotency key, insert a "PROCESSING" record before debiting money within the same transaction, catch the duplicate-key error, and return the stored result. The test passed 200/200 repeated runs; no more double charges.

### Common mistakes
- Running this test on H2 or a mocked repository: there are no real locks and constraints, so it proves nothing.
- Using {{Thread.sleep}} to "create" concurrency: non-deterministic, sometimes it exposes the bug, sometimes it does not.
- Asserting only the status code: two requests both return 200 but the ledger has 2 rows and the test still passes.
- Putting {{@Transactional}} on the test class: other threads cannot see uncommitted data, so results are misleading.

### Interview-ready answer
"I test idempotency under the exact condition that causes real production failures, meaning multiple requests with the same key arriving almost simultaneously, because a sequential test only checks the branch where the record already exists. I use Testcontainers with the same PostgreSQL as production, because the deduplication mechanism relies on unique constraints and transactions. In the test, twenty threads wait on a CountDownLatch and are released at the same time to call the API with the same key; the executor has a timeout so CI never hangs. After that I do not just check the status code, I check the final state in the DB: exactly one ledger entry and the balance deducted only once. I add scenarios for the same key with a different body, a first request failing mid-way, and I repeat the test many times so buggy code exposes the failure reliably. I avoid putting Transactional on the test class because other threads cannot see uncommitted data."

> Senior tip: run this concurrent test on the **old code before the fix** and keep a screenshot of the failing result. A test that has never failed on buggy code has proven nothing; with money, that evidence also helps justify prioritizing the fix.`,
    follow: [
      'Why must this test run on a real PostgreSQL instead of H2 or a mocked repository?',
      'If the first request fails mid-way, how must a retry with the same key behave and how do you test it?',
      'How do you test a Kafka consumer receiving duplicate messages in a similar way?'
    ]
  },

  'testing-043': {
    q: 'How do you detect a breaking change to an API contract (renaming a field, changing a date format) before an older mobile app breaks? How do snapshot/approval tests for a JSON response work?',
    a: `**Summary:** A snapshot (approval) test saves an approved JSON response to a file and, on each run, compares the new response with that file. It catches **unintended changes** to the API: renaming a field, changing a type, losing a field, or changing a date format. To verify **backward compatibility**, compare in **lenient** mode (allow new fields, do not allow removed or changed fields), exclude dynamic fields like timestamps and ids, and combine it with OpenAPI spec comparison in CI.

### The problem it solves
Unit tests usually assert a few important fields; nobody asserts all 40 fields of a response. When a developer refactors a DTO, changes {{@JsonProperty}}, upgrades Jackson, or changes the {{ObjectMapper}} configuration (for example serializing a date as a number instead of an ISO string), older mobile clients can break while tests still pass. A snapshot test covers the **entire shape** of the response at very low authoring cost.

### Comparison mechanism and modes
Spring Boot test already bundles JSONAssert. **STRICT** mode requires an exact match (no extra fields, arrays in the same order). **LENIENT** mode allows the actual response to have **additional** fields and arrays in a different order. This matches the definition of backward compatibility for clients that read JSON and ignore unknown fields: adding a field is safe; removing or renaming one is breaking.

~~~java
@Test
void orderDetailResponseIsBackwardCompatible() throws Exception {
    String actual = mvc.perform(get("/api/v1/orders/{id}", ORDER_ID))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();
    String approved = Files.readString(Path.of("src/test/resources/approved/order-detail.json"));
    // Ignore dynamic fields; LENIENT: allow new fields, forbid missing/changed old fields
    var comparator = new CustomComparator(JSONCompareMode.LENIENT,
        new Customization("createdAt", (a, b) -> true),
        new Customization("traceId", (a, b) -> true));
    JSONAssert.assertEquals(approved, actual, comparator);
}
~~~

### Updating snapshots
- **Intentional** change (adding a field): update the approved file in the same PR so the reviewer can see the JSON diff clearly.
- **Breaking** change (removing, renaming, or changing a type): do not "fix" the snapshot; create a new version ({{/api/v2}}) or keep the old field marked deprecated for a period of time.
- Use fixed test data (a fixed Clock, fixed ids) so snapshots do not change on every run.
- At the spec level: generate OpenAPI from code and run a spec comparison tool (for example openapi-diff) between the main branch and the PR, failing on breaking changes.

### Real-world example
A team upgraded Spring Boot and the default Jackson configuration for {{OffsetDateTime}} changed the timezone format; on another occasion a developer renamed {{totalAmount}} to {{total}} during a refactor. The second change caused older Android app versions (still 30% of users) to show a total of 0 for two days. The team added snapshot tests for the 25 endpoints the mobile app uses, in lenient mode, plus an OpenAPI diff check in CI. Over the next 6 months, CI blocked 4 breaking changes; in 3 of those cases the developer did not realize they had changed the API contract.

### Common mistakes
- Using STRICT for everything: adding a single field also fails, and developers get used to blindly updating snapshots.
- Snapshots containing timestamps or random UUIDs: they fail on every run.
- Automatically "approving" new snapshots in CI: this destroys the entire value of the test.
- Snapshots that are too large (an entire list of 500 elements): nobody can read the diff; 2-3 representative elements are enough.

### Interview-ready answer
"I use snapshot tests to lock down the shape of the API responses that clients depend on. The response is compared with an approved JSON file stored in the repo; an intentional change updates that file in the same PR so the reviewer can see the diff. To verify backward compatibility, I compare in JSONAssert's lenient mode: adding new fields still passes, but removing, renaming, or changing the type of a field fails, which matches the definition of not breaking old clients. Dynamic fields like timestamps or trace ids are excluded from the comparison, and test data uses a fixed Clock and fixed ids so the snapshot stays stable. At the contract level, I compare the OpenAPI spec between the PR and the main branch to block breaking changes. If a breaking change is truly required, I create a new version or keep the old field deprecated instead of updating the snapshot."

> Senior tip: prioritize snapshots for the endpoints used by **mobile** clients, because you cannot force users to update the app. A web frontend deployed together with the backend can be fixed quickly; an app on a customer's phone must coexist with the old contract for months.`,
    follow: [
      'How do JSONAssert LENIENT and STRICT modes differ, and why does LENIENT match the definition of backward compatibility?',
      'How do you handle dynamic fields (timestamps, UUIDs) in snapshots?',
      'When a breaking change is unavoidable, what do you do instead of updating the snapshot?'
    ]
  },

  'testing-044': {
    q: 'Your service calls a partner API (payments, shipping). How do you test timeouts, retries, circuit breakers, and network failures of that client without calling the real partner?',
    a: `**Summary:** Code that calls a partner (payment gateway, shipping provider) must be tested with **simulated network failures**: slowness, dropped connections, 5xx, 429, and malformed responses. WireMock runs a real HTTP server inside the test, so the client goes through the real stack (HTTP client timeouts, retries, circuit breaker, deserialization). The test verifies: the timeout is effective, retries happen the right number of times and **only** for transient errors, the idempotency key stays the same across retries, and the circuit breaker opens when errors persist.

### Why not mock the client interface
If you mock {{PaymentClient}} with Mockito, you skip exactly the parts that tend to break: the timeout configuration of {{RestClient}}/{{WebClient}}, the Resilience4j wrappers, mapping HTTP errors to exceptions, and JSON parsing. WireMock places the boundary at the **network wire**: your code runs exactly as in production, only the server on the other side is fake.

### Failure scenarios WireMock can create
| Scenario | How to create it | Expected client behavior |
|---|---|---|
| Partner is slow | {{withFixedDelay(5000)}} | Time out after 2 seconds, do not wait 5 seconds |
| Dropped connection | {{withFault(Fault.CONNECTION_RESET_BY_PEER)}} | Retry if safe, fail clearly when attempts are exhausted |
| 503 then 200 | A stateful scenario | Retry once, then succeed |
| 400 business error | status 400 + error body | Do not retry, map to a business error |
| 429 + Retry-After | Retry-After header | Wait as directed or return a transient error |
| JSON missing a field | malformed schema body | Parsing error handled, no NPE |

### Example: retry test that preserves the idempotency key
~~~java
@RegisterExtension
static WireMockExtension wm = WireMockExtension.newInstance()
    .options(wireMockConfig().dynamicPort()).build();

@DynamicPropertySource
static void props(DynamicPropertyRegistry r) { r.add("partner.base-url", wm::baseUrl); }

@Test
void retriesOnceOn503AndKeepsIdempotencyKey() {
    wm.stubFor(post("/pay").inScenario("flaky").whenScenarioStateIs(STARTED)
        .willReturn(aResponse().withStatus(503)).willSetStateTo("recovered"));
    wm.stubFor(post("/pay").inScenario("flaky").whenScenarioStateIs("recovered")
        .willReturn(okJson("{\\"status\\":\\"PAID\\"}")));

    var result = paymentClient.pay("ord-1", 100_000);

    assertThat(result.status()).isEqualTo("PAID");
    wm.verify(2, postRequestedFor(urlEqualTo("/pay"))
        .withHeader("Idempotency-Key", equalTo("ord-1")));   // same key on both attempts
}
~~~
Timeout tests should measure duration with a generous upper bound (for example {{assertTimeoutPreemptively}} of 4 seconds for a configured 2-second timeout) so they are not flaky on slow CI.

### Real-world example
A ticket-booking service called an airline over HTTP. It was configured to retry 3 times for every error, including timeouts on POST reservation requests, and had no idempotency key. When the airline was slow, one customer ended up holding 3 seats, and 140 seats were over-reserved in a single evening. The team wrote a WireMock test suite: 5-second delay with a 2-second timeout, 503 then 200, connection reset. The tests exposed 2 bugs: the read timeout was not configured (the client waited for a very long default), and POST retries had no key. After the fix (2-second timeout, retry only for 503/429 and connection errors, key derived from the order id, circuit breaker opens when 50% of 20 calls fail), the same incident did not recur.

### Common mistakes
- Only testing the happy path with WireMock: you miss its entire value.
- Retrying 400 errors: resending a bad request is pointless and can get you blocked by the partner.
- Using a fixed port: parallel tests collide; always use a dynamic port.
- Circuit breaker tests that depend on real time: configure a small window in the test profile and reset the breaker between tests.

### Interview-ready answer
"For code that calls a partner, I do not mock the client interface; I use WireMock as a fake HTTP server so the code goes through the real stack: HTTP client timeouts, retries, the circuit breaker, and JSON parsing. I write tests for each failure type: the partner slower than the timeout, a dropped connection, 503 then success, a 400 business error, 429 with Retry-After, and a malformed response. For each case I verify the client reacts correctly: the timeout is effective, it retries only transient errors, it does not retry 400, and importantly for POST requests the idempotency key stays the same across retries, which I check by verifying the request count and the header. The circuit breaker is tested with a small window in the test profile. WireMock uses a dynamic port so tests can run in parallel safely. I also keep a contract test or a scheduled sandbox run to detect when the partner changes its API."

> Senior tip: every time there is an incident with a partner, add that exact scenario as a WireMock stub. After a year you have an "incident museum" that runs on every PR, and every change to timeout or retry configuration is verified before it reaches production.`,
    follow: [
      'Why is WireMock better than mocking the client interface with Mockito in this case?',
      'What are the risks of retrying a POST request, and which test proves you handled it correctly?',
      'How do you test a circuit breaker without depending on real time?'
    ]
  },

  'testing-045': {
    q: 'How do you test the cache layer (Spring Cache, Redis) to be sure the cache is actually used, evicted at the right time when data changes, and does not fail to serialize when running on Redis?',
    a: `**Summary:** A cache layer test must verify four things: the cache is **actually used** (the second call does not hit the DB), the cache is **evicted at the right time** when data changes (no stale data returned), **keys do not collide** across methods, and **serialization/TTL are correct** on real Redis. The two most common bugs that only tests catch: calling a {{@Cacheable}} method from within the same class (it does not go through the proxy so the cache never runs) and objects that cannot be serialized when moving from an in-memory cache to Redis.

### Why cache behavior often fails silently
Spring Cache works through a **proxy**: calls from another bean go through the proxy, the proxy checks the cache, and only then calls the real method. An internal call ({{this.findProduct()}}) bypasses the proxy, so the cache is never used. No error is thrown, but the DB still takes the full load. Conversely, forgetting {{@CacheEvict}} on an update means users see stale prices for the entire TTL. Both cases "work" in normal functional tests, so they need dedicated tests for cache behavior.

### Testing that the cache is used and evicted
~~~java
@SpringBootTest
class ProductCacheTest {
    @Autowired ProductService service;
    @Autowired CacheManager cacheManager;
    @MockitoSpyBean ProductRepository repo;     // Spring Boot 3.4+; older versions use @SpyBean

    @BeforeEach void clear() { cacheManager.getCache("products").clear(); }

    @Test
    void secondReadHitsCacheAndUpdateEvicts() {
        service.getProduct(42L);
        service.getProduct(42L);
        verify(repo, times(1)).findById(42L);   // 2nd read comes from cache

        service.updatePrice(42L, new BigDecimal("199000"));   // has @CacheEvict
        assertThat(service.getProduct(42L).price()).isEqualByComparingTo("199000");
        verify(repo, times(2)).findById(42L);   // after evict it must read DB again
    }
}
~~~
Using a spy and verify is appropriate here because **the number of DB hits is exactly the behavior** under test.

### Testing with real Redis
An in-memory cache does not serialize objects, so it hides bugs. Use Testcontainers Redis in a separate test set to verify: the object read back from Redis equals the one written (records, BigDecimal, date/time types), the TTL is set (check that {{redisTemplate.getExpire("products::42")}} is greater than 0 and does not exceed the configured value), and the key has the correct prefix. Note: when you change a class structure, old data in Redis may become unreadable after deployment. You need to test reading a value written in the old format, or change the key prefix by version.

### Real-world example
A product detail page had {{@Cacheable}} but the DB still received 3,000 queries per second during peak hours. A test like the one above (verifying repository call count) failed immediately: the method was invoked via {{this}} inside the same service. The fix was to move the cached method to a separate bean; DB queries dropped to about 200 per second. Three weeks later, the team switched from Caffeine to Redis to share the cache across 8 pods: production threw {{SerializationException}} because a DTO was not serializable. The team added a Redis test suite with Testcontainers to CI; on the next DTO change, the same error was caught in the PR.

### Common mistakes
- Not clearing the cache between tests: a later test "eats" data from an earlier one and results depend on execution order.
- Disabling the cache in the test profile ({{spring.cache.type=none}}) with no test that enables it.
- Two different methods using the same cache name and the same parameter, so they return the wrong type.
- Waiting for TTL to expire with sleep: slow and flaky; checking that the TTL was set is sufficient.

### Interview-ready answer
"For the cache layer, I verify four things. First, the cache is actually used: call twice and verify the repository is called only once. This test catches self-invocation, where a Cacheable method is called from within the same class and therefore bypasses the proxy. Second, the cache is evicted at the right time: update the data and read it back to see the new value. Third, keys do not collide across methods. Fourth, with Redis I have a separate Testcontainers test set to verify serialization and deserialization work correctly, the TTL is set, and the key prefix is correct, because an in-memory cache does not serialize and hides bugs. I always clear the cache between tests, and I do not wait for TTL with sleep; I verify that the expiration time was set. Here, verifying the number of DB calls is appropriate because that is exactly the behavior under test."

> Senior tip: when you change the structure of an object cached in Redis, **bump the key prefix by version** (for example products-v2). A rolling deployment will have old and new versions reading the same cache; separate prefixes avoid both deserialization errors and the old version reading data in the new format.`,
    follow: [
      'Why does calling a @Cacheable method from within the same class not use the cache, and which test catches this bug?',
      'When you change the structure of a cached DTO, what risks does a rolling deployment pose for old data in Redis?',
      'How do you verify TTL without sleeping until it expires?'
    ]
  },

  'testing-046': {
    q: '(Lead) How do you keep the architecture from decaying PR by PR (controllers calling repositories directly, dependency cycles between modules)? How do you use ArchUnit, even on a legacy codebase that already has many violations?',
    a: `**Summary:** ArchUnit turns **architecture rules** into unit tests that run in CI: controllers must not call repositories directly, the domain must not depend on Spring, there must be no dependency cycles between modules, and field injection must not be used. It reads the bytecode of compiled classes and checks dependency relationships, so it detects violations at the PR stage instead of six months later when the architecture has already rotted. For a legacy codebase with existing violations, use **freeze** to block only new violations.

### Why it needs to be automated
Architecture rules usually live in documentation or in the lead's head. Every PR violates them "just a little" ("the controller calls the repository for speed"), busy reviewers let it slide, and after a year every module depends on every other module. You can no longer extract a service or replace the persistence layer. ArchUnit turns the rules into tests: a violation fails the build with a message that points to the exact class and dependency line.

### Example rule set
~~~java
@AnalyzeClasses(packages = "com.shop", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    @ArchTest   // layering: web -> service -> repository, no reverse direction
    static final ArchRule layers = layeredArchitecture().consideringAllDependencies()
        .layer("Web").definedBy("..web..")
        .layer("Service").definedBy("..service..")
        .layer("Persistence").definedBy("..repository..")
        .whereLayer("Web").mayNotBeAccessedByAnyLayer()
        .whereLayer("Service").mayOnlyBeAccessedByLayers("Web")
        .whereLayer("Persistence").mayOnlyBeAccessedByLayers("Service");

    @ArchTest   // business modules have no dependency cycles
    static final ArchRule noCycles = slices().matching("com.shop.(*)..").should().beFreeOfCycles();

    @ArchTest   // pure domain, no framework coupling
    static final ArchRule pureDomain = noClasses().that().resideInAPackage("..domain..")
        .should().dependOnClassesThat().resideInAPackage("org.springframework..");

    @ArchTest
    static final ArchRule noFieldInjection = GeneralCodingRules.NO_CLASSES_SHOULD_USE_FIELD_INJECTION;
}
~~~

### Applying it to a legacy codebase: freeze
Enabling a new rule on a 5-year-old codebase can produce 300 violations. Wrap the rule with {{FreezingArchRule.freeze(rule)}}: the first run records the existing violations in a "violation store" (a file in the repo), subsequent runs fail only on **new** violations; fixed violations automatically disappear from the store. The team pays down debt gradually without stopping all work to fix 300 places.

### Which rules are worth writing
| Rule | Reason |
|---|---|
| Layering, no dependency cycles | Preserves the ability to extract modules/services |
| Domain does not depend on a framework | Easier to test, easier to upgrade the framework |
| Module A calls module B only through an api package | Preserves modular monolith boundaries |
| No banned APIs ({{java.util.Date}}, {{System.out}}) | Keeps coding standards consistent |
| {{@Entity}} classes do not leave the service layer | Avoids leaking entities through the API and lazy-loading bugs |

### Real-world example
A modular monolith with 40 developers and 6 business modules. When the team planned to extract the "billing" module into a separate service, they found 140 places where other modules called directly into billing's internal classes, estimated at 3 months to untangle. The team added ArchUnit: each module may call another only through its {{api}} package, and no dependency cycles; existing violations were frozen. Each sprint they removed 15-20 violations; new violations were blocked at PR time (about 2-3 times per month, always by developers new to the conventions). After 5 months the store had 0 violations for billing, and extracting the service took 3 weeks.

### Common mistakes
- Writing too many fine-grained rules from the start: the team pushes back and disables the tests.
- Not recording the reason ({{because(...)}}): developers do not understand why they are blocked and look for workarounds.
- Analyzing test classes too: tests are often allowed broader dependencies, causing false positives.
- Enabling rules on a legacy codebase without freeze: the build fails with hundreds of errors and the rules are removed immediately.

### Interview-ready answer
"I use ArchUnit to turn architecture rules into tests that run in CI, because rules that live only in documentation get violated gradually with every PR. ArchUnit reads bytecode and checks dependencies between classes, so I can write rules like layered web, service, repository with no reverse dependencies; no dependency cycles between modules; the domain does not depend on Spring; modules call each other only through an api package; and no field injection. Each rule includes a reason so the failure message explains itself. On a legacy codebase with many existing violations, I use freeze: record the current violations, block only new ones, and pay down debt every sprint. I start with the three or four rules that matter most for the architecture goal, such as preparing to extract a service, rather than writing dozens of fine-grained rules."

> Senior tip: tie every ArchUnit rule to a **specific architecture goal** the team has agreed on (for example "extract billing in Q3"). Rules with a goal are respected; rules that exist only because of the lead's personal preference feel like bureaucracy and get worked around.`,
    follow: [
      'How does FreezingArchRule work and why do you need it when applying rules to legacy code?',
      'Which rules do you consider most worth writing for a modular monolith preparing to extract a service?',
      'How do you keep the team from seeing architecture rules as bureaucracy and looking for workarounds?'
    ]
  },

  'testing-047': {
    q: '(Lead) How do you run end-to-end tests across a multi-microservice system without slowing down CI? How do you isolate test data, and how do you balance contract tests with E2E?',
    a: `**Summary:** You cannot run full-system E2E tests on every PR and still keep CI fast. The strategy is three layers: **contract tests** on every PR to catch contract errors between services in minutes; **a small number of E2E tests** for the most critical business flows, run on a near-production environment on a schedule or before a release; **synthetic checks** running continuously in production. Each E2E test creates its own data, uses identifiers unique to the run, and waits for asynchronous results by polling with a condition instead of sleeping.

### Three testing layers
| Layer | Goal | Time | Blocks merge? |
|---|---|---|---|
| Contract tests (Pact, Spring Cloud Contract) | Request/response shape between each pair of services | A few minutes, every PR | Yes |
| Critical-flow E2E (10-30 flows) | Business flows across multiple services on a real environment | 15-40 minutes, nightly or pre-release | Blocks release |
| Synthetic checks | Production still works from the user's perspective | A few minutes each run, continuously | Alerts, triggers rollback |

### Isolating data when many E2E tests run in parallel
A shared staging environment is used by multiple teams and multiple runs. Each E2E test must create its own data via the API (customers, products, wallets) with identifiers tagged with the run id ({{e2e-run-8812-...}}), never relying on pre-existing data. With Kafka, the test reads the result through the destination service's API rather than consuming the topic itself with a shared consumer group, because that would "steal" messages from the real service. A cleanup job deletes old e2e data by prefix.

### Waiting for asynchronous results the right way
Flows across multiple services are often asynchronous (place order → payment → inventory via events). Do not use {{Thread.sleep(10000)}}: sometimes it is too short, sometimes it wastes time. Use polling with a condition and a limit:
~~~java
String orderId = api.placeOrder(customerId, sku, 2);
await().atMost(Duration.ofSeconds(30)).pollInterval(Duration.ofMillis(500))
    .untilAsserted(() -> assertThat(api.getOrder(orderId).status()).isEqualTo("CONFIRMED"));
assertThat(api.getStock(sku).reserved()).isEqualTo(2);   // inventory reserved the correct quantity
~~~
Every E2E request sends a trace id header; when it fails, the report prints the trace id so you can open the distributed trace directly and see which service caused the error.

### Environments
- **Shared staging**: cheap, but easily polluted by other teams' deployments. Needs a deployment schedule and isolated data.
- **Ephemeral per-PR environments**: deploy the changed service and use stable versions of the others. Cleaner but more infrastructure; a good fit once you have solid Kubernetes and IaC.
- Run E2E tests selectively based on which service changed to reduce runtime.

### Real-world example
A system of 15 services had 220 E2E tests running on every PR, taking 70 minutes and failing about 40% of the time; developers got used to merging while E2E was red. The team moved API shape checks to contract tests (4 minutes per PR) and kept 24 E2E tests for the order, payment, refund, and login flows; data was created per run; sleeps were replaced with Awaitility; tests ran nightly and before releases. PR time dropped to 12 minutes, the non-bug E2E failure rate fell to 3%, and when a test failed the trace id pointed straight to the faulty service. A synthetic check placed a test order every 5 minutes in production using a specially marked test account.

### Common mistakes
- Using E2E to cover every business variation: slow and brittle; variations belong in unit/integration tests.
- Shared data between runs: parallel E2E tests corrupt each other's data.
- No way to investigate failures: missing trace ids and centralized logs, so every red run costs half a day.
- E2E failures that nobody owns: the signal gets ignored.

### Interview-ready answer
"I do not run full-system E2E tests on every PR because they are slow and flake often, which makes developers lose trust in the signal. I split testing into three layers. Every PR runs contract tests between each pair of services, taking just a few minutes, which catch most integration errors like a renamed field. E2E is limited to about twenty of the most critical business flows, running nightly and before releases on a near-production environment. Each E2E test creates its own data via the API with identifiers tagged by run id, waits for asynchronous results with bounded polling like Awaitility instead of sleep, and sends a trace id so that when it fails we know immediately which service caused it. Finally, synthetic checks run continuously in production with a specially marked test account. Every E2E failure has an on-call owner responsible for handling it the same day."

> Senior tip: measure the **non-bug E2E failure rate** and treat it as a health metric for the test suite. Above roughly 5%, developers start ignoring red signals; at that point, cutting E2E tests or fixing the flake sources is more valuable than writing new tests.`,
    follow: [
      'How do you wait for the result of an asynchronous Kafka flow in an E2E test without making it flaky?',
      'Ephemeral per-PR environments versus shared staging: when do you choose each?',
      'When an E2E test fails, how do you quickly identify which service caused the error?'
    ]
  }
});
