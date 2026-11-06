/*
 * English translation of js/data/q-soft.js — task T796. Format: js/core/i18n.js (content overlay).
 * ids: testing-033 testing-034 testing-035 testing-036 testing-037 testing-038 testing-039 testing-040
 */
App.i18n.content({
  'testing-033': {
    q: `What is Testcontainers and why does it solve the problem of tests passing on dev but failing on CI when H2 is used instead of Postgres?`,
    a: `**Summary:** Testcontainers starts real Docker containers (Postgres, Redis, Kafka) right inside the test JVM, so tests run on the same engine as production, eliminating dialect/index/transaction differences from H2.

### Why H2 causes production bugs
- H2 defaults to Postgres compatibility but is not 100% matching: jsonb types, arrays, partial indexes, locking, sequences.
- JPQL/native SQL queries pass on H2 but fail on Postgres.
- Flyway migrations running on H2 do not catch errors that only occur on Postgres.

### Basic usage
~~~java
@Testcontainers
class OrderRepositoryIT {
  @Container
  static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16-alpine");
  @DynamicPropertySource
  static void props(DynamicPropertyRegistry r) {
    r.add("spring.datasource.url", pg::getJdbcUrl);
    r.add("spring.datasource.username", pg::getUsername);
    r.add("spring.datasource.password", pg::getPassword);
  }
  @Autowired OrderRepository repo;
  @Test void save_and_find() { }
}
~~~

### Reuse containers to keep CI fast
- By default each test class creates/destroys its container — slow.
- Enable reuse: ~/.testcontainers.properties with testcontainers.reuse.enable=true and withReuse(true).
- Singleton container pattern: one static container shared across many test classes.
- Ryuk automatically removes containers when the JVM exits.

### Pitfall
- No Docker on the CI runner → use GitHub Actions service containers or Testcontainers Cloud.
- Port conflicts when running in parallel → Testcontainers auto-maps random ports.
- Data leak between tests → truncate tables in @BeforeEach.

> Senior tip: pin the image version in tests, do not use latest; put .testcontainers.properties in the repo.`,
    follow: ['How does the singleton container pattern differ from @Container per class?', 'How do you run Testcontainers on GitHub Actions without a Docker daemon?', 'How do you balance fast tests (H2) with correct tests (Testcontainers)?'],
  },
  'testing-034': {
    q: `What is contract testing between two microservices? Compare Spring Cloud Contract and Pact?`,
    a: `**Summary:** Contract testing checks that producer and consumer agree on the shape of request/response without running both at the same time, replacing slow E2E with small tests that run independently.

### What E2E solves poorly
- E2E needs both services deployed + broker + DB → slow, flaky.
- Breaking changes are only detected when the integration test runs → too late.

### Two schools
| | Consumer-driven (Pact) | Provider-driven (Spring Cloud Contract) |
|---|---|---|
| Who writes the contract | Consumer | Provider |
| Flow | Consumer test generates a pact file → provider verifies | Provider writes the contract → generates tests for the consumer |
| Best fit | many consumers on different stacks | Spring ecosystem |

### Spring Cloud Contract example
~~~groovy
Contract.make {
  request { method GET(); url "/api/orders/1" }
  response { status 200(); body(id: 1, status: "PAID") }
}
~~~

### When to use
- Many teams, independent deploys, APIs changing frequently.
- Detect breaking changes in CI before merging.

### Pitfall
- Contracts only check shape, not business logic.
- Version contracts with Pact Broker to track can-i-deploy.
- Do not contract-test internal APIs that change constantly.

> Senior tip: start with a contract for one important API (payments), measure how many breaking changes get caught early.`,
    follow: ['How does Pact Broker and can-i-deploy work?', 'How to handle contracts when the provider adds a new field (backward compatible)?', 'Can contract tests replace integration tests?'],
  },
  'testing-035': {
    q: `What is mutation testing with PIT (Pitest) and why does high coverage not mean good tests?`,
    a: `**Summary:** Coverage measures lines of code executed, not assertion quality. Mutation testing automatically breaks code (changes > to >=, deletes lines) and checks whether tests fail; if tests still pass, the tests are weak.

### Mechanism
- PIT generates mutants: replaces operators, flips conditions, deletes statements, changes return values.
- Runs the test suite against each mutant. Test fails → killed (good). Passes → survived (weak test).
- Mutation score = killed / total mutants.

### Example
~~~java
public int discount(int price, boolean vip) {
  if (vip) return price * 90 / 100;
  return price;
}
~~~
A test that only checks discount(100,false)==100 → the mutant vip->!vip survives.

### Maven configuration
~~~xml
<plugin>
  <groupId>org.pitest</groupId>
  <artifactId>pitest-maven</artifactId>
  <version>1.15.0</version>
  <configuration>
    <targetClasses>com.example.order.*</targetClasses>
    <mutationThreshold>80</mutationThreshold>
  </configuration>
</plugin>
~~~

### Pitfall
- Running across the whole repo is very slow; limit packages and use incremental runs.
- Equivalent mutants → noise; filter them.
- Not for generated code/DTOs.

### When to use
- Critical modules (pricing, security) before a big release.
- Nightly in CI, not on every PR.

> Senior tip: set a mutation threshold of 70–80% for core modules; 20% survivors usually means missing assertions.`,
    follow: ['What is an equivalent mutant and how do you handle it?', 'Does PIT support Kotlin?', 'How to integrate mutation score into the CI quality gate?'],
  },
  'testing-036': {
    q: `Where do flaky (unstable) tests in backend come from, and how do you kill each kind (time, ordering, shared data)?`,
    a: `**Summary:** A flaky test = same code, same input, different results across runs. Causes: time dependence, execution order, shared data, race conditions. Kill them by isolating, making deterministic, retrying only to detect.

### Cause classification
| Type | Example | Fix |
|---|---|---|
| Time | Thread.sleep, Instant.now(), hard timeouts | inject Clock, Awaitility |
| Ordering | test A creates data, test B reads it; parallel run fails | each test sets up/tears down itself |
| Shared data | uses shared DB row id=1 | random ids, truncate per test |
| Race | async event not yet processed | Awaitility + timeout |

### Example fix for time
~~~java
class OrderService {
  private final Clock clock;
  boolean isExpired(Order o) {
    return o.createdAt().isBefore(clock.instant().minus(1, DAYS));
  }
}
// Test
Clock fixed = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), UTC);
~~~

### Awaitility for async
~~~java
await().atMost(5, SECONDS).until(() -> repo.count() == 1);
~~~

### Strategy to kill flaky tests
1. Tag flaky tests (@Tag("flaky")) and run them in a separate job.
2. Retry at most 2 times only to collect data, not to pass.
3. Quarantine: failing 3 times in 7 days → disable + open a ticket.
4. Root cause: read logs, add deterministic logging.

### Pitfall
- Retries hide real bugs.
- @DirtiesContext everywhere → slow; fix isolation instead of resetting context.

> Senior tip: measure the flaky rate every week; if > 2%, stop features and clean up flaky tests for one sprint.`,
    follow: ['How does Awaitility differ from Thread.sleep?', 'How to detect flaky tests automatically in CI?', 'How to handle flaky tests caused by database locking?'],
  },
  'testing-037': {
    q: `How do you test Flyway/Liquibase migrations so they don't pass on dev but fail in production?`,
    a: `**Summary:** Migrations must be tested on a real DB (Testcontainers) with production-like data, running the entire migration chain from empty, and checking backward compatibility.

### Test layers
1. Smoke: app boots with an empty DB → Flyway runs everything → context loads.
2. Upgrade: DB with old data → run the new migration → verify.
3. Rollback/down: test revert if a down script exists.
4. Performance: large migration on large data → measure time.

### Testcontainers + Flyway example
~~~java
@Testcontainers
class MigrationIT {
  @Container
  static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16");
  @Test
  void all_migrations_apply_cleanly() {
    Flyway.configure().dataSource(pg.getJdbcUrl(), pg.getUsername(), pg.getPassword())
          .load().migrate();
  }
}
~~~

### Backward compatibility (expand-contract)
- Add a nullable column (expand) → deploy code → backfill → drop the old column (contract) in the next release.
- Test: code version N runs on schema version N-1.

### Flyway pitfalls
- validateOnMigrate=true detects checksum changes.
- Wrong ordering: V2__, V10__ sort lexically. Use zero-padding V010__.
- Long-running DDL locks the table → use CREATE INDEX CONCURRENTLY.

### Liquibase pitfalls
- changeSet id must be unique.
- rollback tag required if you want to go down.

> Senior tip: run migrations against a copy of production every release; if > 30s, split into an online migration.`,
    follow: ['What is the expand-contract pattern?', 'How to test migrations with large data transforms?', 'Flyway repair vs clean?'],
  },
  'testing-038': {
    q: `(Lead) When refactoring legacy code with no tests, what are characterization tests and seams?`,
    a: `**Summary:** A characterization test records current behaviour (even bugs) to act as a safety net during refactoring. A seam is a point where you can inject tests into hard-to-test code (static, new, global).

### Characterization test (Michael Feathers)
- Run the code with input, record the output, assert that output. It only locks in behaviour.
- When refactoring makes a test fail → a new bug or an intentional behaviour change.

### Seam
- Object seam: replace a dependency via constructor.
- Link seam: replace a class via classpath.

### Seam example for static code
~~~java
public class Pricing {
  protected double rateFor(String country) { return TaxService.getRate(country); }
  public double price(Order o) { return o.amount() * rateFor(o.country()); }
}
class PricingTest extends Pricing {
  protected double rateFor(String c) { return 0.1; }
}
~~~

### Safe refactoring process
1. Write characterization tests for the module.
2. Identify the smell → small refactor → run tests.
3. Repeat. Every commit must be green.
4. Only change behaviour after tests exist.

### Pitfall
- Characterization tests can lock in bugs.
- Too many snapshot tests → heavy maintenance.
- Do not refactor and fix bugs at the same time.

> Senior tip: track the number of public methods without tests decreasing every sprint; use ArchUnit.`,
    follow: ['How does approval testing differ from characterization testing?', 'How to handle global state/singletons?', 'How to measure safe refactoring beyond tests passing?'],
  },
  'testing-039': {
    q: `(Lead) How do you cut CI time from 40 minutes to 10 minutes without losing reliability?`,
    a: `**Summary:** Analyse the bottleneck (build + test + docker), then parallelise, cache, choose the right test for the right stage, reuse Testcontainers. Goal: PR feedback < 10 minutes, full suite nightly.

### Measure before optimising
- Split the time: compile, unit, integration, e2e, docker build, deploy.
- Usually 60% is integration tests + container startup.

### Levers
1. Cache: Maven/Gradle dependency cache, Docker layer cache, Spring context cache.
2. Parallelise: split the test suite by module (Gradle parallel, Maven -T), GitHub Actions matrix.
3. Test selection: run only affected tests on PR; full suite nightly.
4. Container reuse: Testcontainers reuse + singleton.
5. JVM: fewer forks, enough heap.
6. Build: skip javadoc/source jars on PR.

### GitHub Actions matrix example
~~~yaml
strategy:
  matrix:
    module: [order, payment, inventory]
jobs:
  test:
    steps:
      - uses: actions/cache@v4
        with: { path: ~/.m2/repository, key: m2-\${{ hashFiles('**/pom.xml') }} }
      - run: mvn -pl \${{ matrix.module }} -am test
~~~

### Pitfall
- Test selection misses tests → run the full suite nightly + on main.
- Stale cache → invalidate by lock file hash.
- Too much parallelism → OOM on the runner.

### Metrics
- PR feedback time p95, flaky rate, cost per run.
- Budget: unit < 2 minutes, integration < 5 minutes.

> Senior tip: set a PR pipeline SLO of < 10 minutes as if it were a feature.`,
    follow: ['How does test impact analysis work?', 'How to balance speed and reliability when skipping tests?', 'Cost optimisation for CI runners?'],
  },
  'testing-040': {
    q: `Test pyramid vs testing trophy for microservices: when to choose which and the realistic ratios?`,
    a: `**Summary:** Pyramid: many unit tests, few integration. Trophy: thick integration, thin unit. For Spring Boot microservices, the trophy is usually right because bugs concentrate at the boundaries (HTTP, SQL, messages). Suggested ratio: 40% unit, 45% slice/integration, 10% contract, 5% E2E.

### Comparison
| | Pyramid | Trophy |
|---|---|---|
| Assumption | bugs are in logic | bugs are at integration boundaries |
| Unit tests | thick | thin |
| Integration | thin | thick |
| E2E | very few | very few |

### When the Pyramid is right
- Complex domain (pricing, routing, rule engine) with many pure logic branches.
- Little I/O, little framework.

### When the Trophy is right
- CRUD services with validation, mapping, SQL.
- Many integrations (DB, cache, broker, HTTP).

### Realistic ratios
| Type | Ratio | Time/test |
|---|---|---|
| Unit (domain) | 40% | < 50 ms |
| Slice (web/jpa) | 30% | 1–3 s |
| Integration (Testcontainers) | 15% | 5–15 s |
| Contract | 10% | 2–5 s |
| E2E | 5% | minutes |

### Pitfall
- 100% coverage from unit tests on DTO/getters → waste.
- Too many E2E → slow, flaky.
- No mutation score → illusory coverage.

> Senior tip: start from bug history: if 70% of bugs come from SQL/mapping, invest in slice+integration; if from rules, invest in unit.`,
    follow: ['How to measure which layer bugs come from to decide test investment?', 'Which flows should E2E cover?', 'Does the testing trophy slow down CI?'],
  },
});
