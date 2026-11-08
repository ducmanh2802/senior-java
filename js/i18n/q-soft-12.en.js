/*
 * English translation of js/data/q-soft.js — task T796. Format: js/core/i18n.js (content overlay).
 * ids: testing-033 testing-034 testing-035 testing-036 testing-037 testing-038 testing-039 testing-040
 */
App.i18n.content({
  'testing-033': {
    q: `What is Testcontainers and why does it solve the issue of tests passing on dev but failing on CI when using H2 instead of Postgres?`,
    a: `**Summary:** Testcontainers is a Java library that starts **real Docker containers** (PostgreSQL, Kafka, Redis...) right within the test and cleans them up afterward. It solves the "pass on H2, fail on production" problem because tests run on the **correct production engine and version**: with the same SQL syntax, data types, and locking/constraint behavior. The trade-off is that tests are a few seconds slower for the first startup, and CI requires a Docker-enabled environment.

### Why H2 causes production bugs
H2 has a "compatibility mode" but it only partially mimics Postgres:
- Postgres-specific syntax: {{ON CONFLICT DO UPDATE}}, {{jsonb}}, array operators, {{generate_series}}, advanced window functions → H2 fails or behaves differently.
- Data types: {{timestamptz}}, {{numeric}} rounding, case-sensitive/different collation string comparison.
- Behavior: ordering when no ORDER BY, row locking, deadlock, length limits.
- Flyway migrations written for PostgreSQL often fail on H2 → teams have to maintain two sets of scripts, and the test set is not the one running in production.

### Usage with Spring Boot 3.1+
~~~java
@SpringBootTest
@Testcontainers
class OrderRepositoryIT {
  @Container
  @ServiceConnection            // Boot auto-configures spring.datasource.url/username/password
  static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16-alpine");

  @Autowired OrderRepository repo;

  @Test void upsertKeepsLatestStatus() {
    repo.upsert(new Order(1L, "NEW"));
    repo.upsert(new Order(1L, "PAID"));     // uses ON CONFLICT, H2 cannot run this
    assertThat(repo.findById(1L)).get().extracting(Order::status).isEqualTo("PAID");
  }
}
~~~
Flyway runs real migrations during context startup → tests both migrations and queries.

### Making it fast
- **Shared container** for the suite: declare static in a base class or use {{@ImportTestcontainers}}, Spring caches the context between test classes with the same configuration → starts once (approx. 2–4 seconds for Postgres Alpine).
- **Clean data** between tests instead of creating a new container: {{@Transactional}} rollback, or TRUNCATE.
- **Reuse** when running locally ({{testcontainers.reuse.enable=true}}): container stays alive across runs — use only on dev machine, not on CI.
- Keep a few unit tests without DB for pure logic.

### On CI
- GitHub Actions Ubuntu runner has Docker pre-installed; GitLab needs Docker-in-Docker or a runner with Docker socket.
- Kubernetes runners without Docker: use Testcontainers Cloud or a dedicated runner with Docker.
- Pull images from internal registry/mirror to avoid Docker Hub download limits ({{hub.image.name.prefix}}).

### Real-world example
An order service used H2 for tests; 3 incidents in one quarter all "passed tests but failed production": upsert ON CONFLICT, {{timestamptz}} timezone mismatch, and a migration adding a jsonb column that didn't run on H2 so it was "disabled" in tests. Switching repository tests to Testcontainers PostgreSQL 16 using a shared container: suite increased from 3 minutes to 4 minutes 10 seconds, but for the next two quarters, no SQL errors reached production.

### Pitfall
- One container per test class → suite much slower.
- Using {{latest}} tag → test today differs from yesterday; pin the correct production version.
- Test data not cleaned → tests depend on execution order.
- Using reuse on CI → state leaks across builds.

### Interview answer
"Testcontainers starts real Docker containers like PostgreSQL or Kafka right in the test and cleans them up when done. I use it because H2 only partially mimics PostgreSQL: syntax like ON CONFLICT or jsonb, timestamptz types, locking behavior and collation are all different, and Flyway migrations written for PostgreSQL often can't run on H2, so the test is checking a different database than production. Since Spring Boot 3.1, I declare a static container with @ServiceConnection, Boot auto-configures the datasource, and Flyway runs real migrations on startup. To keep the suite fast, I use a shared container for the entire suite, clean data with rollback or truncate instead of creating new containers, pin the correct production version, and only enable reuse on the dev machine. In my previous project, switching to Testcontainers added about a minute to the suite but blocked a whole class of SQL errors from reaching production."

> Senior tip: pin Testcontainers images to the **exact minor version** of production (e.g., postgres:16.4) and upgrade them in sync with production. When upgrading PostgreSQL, run the suite on the new version first — it's the cheapest compatibility test you have.`,
    follow: ['How does the singleton container pattern differ from @Container per class?', 'How do you run Testcontainers on GitHub Actions without a Docker daemon?', 'How do you balance fast tests (H2) with correct tests (Testcontainers)?'],
  },
  'testing-034': {
    q: `What is contract testing between two microservices? Compare Spring Cloud Contract and Pact?`,
    a: `**Summary:** Contract testing checks the **communication agreement** between consumer and provider — paths, parameters, request/response structure — **without running both at the same time**. Each side tests independently against a common contract file, so breaking changes are detected immediately in the CI of the side that makes the change. **Pact** follows a consumer-driven approach (consumer describes requirements, provider verifies), supports multiple languages, has Pact Broker and {{can-i-deploy}}; **Spring Cloud Contract** is usually provider-driven (provider defines the contract in Groovy/YAML, generates tests for provider and stubs for consumer), fits best when both sides use Spring.

### Problems E2E testing solves poorly
- E2E requires deploying multiple services with the correct versions → slow, fragile due to unrelated reasons (environment, data).
- Errors are only exposed **after** the provider has merged changes → finding the breaker takes time.
- Manual mocking on the consumer side might be wrong from the start without anyone knowing → consumer test passes against a non-existent API.

### Pact workflow
~~~seq
title: Consumer-driven contract with Pact
actors: OrderSvc | PactBroker | PaymentSvc | CI
OrderSvc -> OrderSvc: test with Pact mock, generate pact file
OrderSvc -> PactBroker: publish pact (version = git sha)
PaymentSvc -> PactBroker: fetch pact from all consumers
PaymentSvc -> PaymentSvc: replay request into actual app, verify response
PaymentSvc -> PactBroker: publish verification result
CI -> PactBroker: can-i-deploy PaymentSvc to prod?
~~~
- **Provider state**: contract records "when order 42 exists in PAID status"; provider has hooks to prepare that data before replay.
- **can-i-deploy**: Broker knows which version of each side is in which environment and whether they've been verified against each other → blocks deployment that would break the currently running consumer.
- **Matchers** based on data types ({{like}}, regex) instead of fixed values, to keep the contract from being brittle.

### Spring Cloud Contract
Provider writes the contract; plugin generates JUnit tests running against the real controller and generates **WireMock stubs** packaged into a jar; consumer uses {{@AutoConfigureStubRunner}} to run tests against that stub. Suitable when the provider wants to control the API and all parties use JVM/Spring.

| Criteria | Pact | Spring Cloud Contract |
|---|---|---|
| Who writes contract | Consumer | Usually provider |
| Languages | Multi-language (JS, Go, Java…) | Mainly JVM |
| Sharing | Pact Broker / PactFlow | Jar stub via Maven repo |
| Deployment control | can-i-deploy | Build your own |
| Messaging | Yes (message pact) | Yes |

### When to use
- Multiple teams, multiple services calling each other, independent releases.
- Have consumers outside the JVM (frontend, mobile) → Pact.
- Few services, same team, deployed together → integration tests may suffice.
Contract testing **does not replace** provider business logic testing — it only checks communication shape.

### Real-world example
Service Payment changed the {{amount}} field from a number to an object containing {{value}} and {{currency}} — email notification was sent, but 2 out of 5 consumers didn't read it. On production, mobile app and refund service failed parsing for 50 minutes. Afterward, teams adopted Pact + Broker and blocked deployment using can-i-deploy. Three months later, a similar change was blocked right in Payment's pipeline, including the names of affected consumers; the team switched to adding new fields in parallel (expand/contract) instead of changing types.

### Pitfall
- Contracts recording specific values (id, time) → fail continuously for unimportant reasons.
- Consumer including every field of the response in the contract even if not used → provider cannot change anything.
- No can-i-deploy → verification passed but a broken version was still deployed.
- Using contract tests to check business logic.

### Interview answer
"Contract testing checks the communication agreement between the consumer and provider without running both at the same time. With Pact, the consumer writes tests with mocks and generates a pact file describing the required request and response, then publishes it to the Pact Broker. The provider fetches pacts from all consumers, replays them against the real application, verifies the response, and uses provider state to prepare data. Before deployment, CI queries the Broker with can-i-deploy, to ensure we never push a version that breaks a running consumer. Spring Cloud Contract is usually provider-driven, generating tests for the provider and WireMock stubs for the consumer, which fits well when both sides use Spring. I choose Pact when there are non-JVM consumers or teams releasing independently. It's important that the contract only includes fields the consumer actually uses and uses matchers based on types, not values."

> Senior tip: start contract testing with **the pair of services that break most often**, not the whole system. When can-i-deploy blocks a real broken deployment, other teams will want to adopt it voluntarily.`,
    follow: ['Pact Broker and can-i-deploy work?', 'How to handle contracts when the provider adds a new field (backward compatible)?', 'Can contract tests replace integration tests?'],
  },
  'testing-035': {
    q: `What is mutation testing with PIT (Pitest) and why does high coverage not mean good tests?`,
    a: `**Summary:** Coverage only shows which code lines **have run** during tests, not whether the test **actually checks the result**. Mutation testing (PIT/Pitest) deliberately **makes small bytecode changes** to code — changing {{>}} to {{>=}}, changing {{+}} to {{-}}, deleting a method call, returning null — each change is a **mutant**, then reruns tests. Test fails → mutant is **killed** (good test); test still passes → mutant **survived** (weak test). **Mutation score** = percentage of mutants killed.

### Why high coverage still has bugs
~~~java
int discount(int total) {
  if (total > 1_000_000) return total / 10;   // 10% off for orders over 1 million
  return 0;
}
@Test void discountRuns() {
  discount(2_000_000);          // 100% line + branch coverage if discount(1) is added...
  discount(1);                  // ...but NO assertion -> all mutants survive
}
// Better test: assertEquals(200_000, discount(2_000_000));
//               assertEquals(0, discount(1_000_000));   // kills mutant changing > to >=
~~~
The first test gives 100% coverage but protects nothing. The second test even catches **boundary** bugs (is exactly 1 million discounted?) — common bugs in financial logic.

### How PIT works
1. Runs tests once, records **which test covers which line** (to only run relevant tests for each mutant).
2. Generates mutants at bytecode level based on mutators (DEFAULTS: boundary conditions, conditional negation, operators, return values, void call deletion…).
3. For each mutant, runs tests covering it; stops immediately if a test fails.
4. HTML report: line-by-line, which mutant survived, which mutator.

~~~xml
<plugin>
  <groupId>org.pitest</groupId>
  <artifactId>pitest-maven</artifactId>
  <configuration>
    <targetClasses><param>com.shop.pricing.*</param></targetClasses>
    <mutationThreshold>70</mutationThreshold>   <!-- build fails if < 70% -->
    <threads>4</threads>
  </configuration>
  <!-- JUnit 5 requires pitest-junit5-plugin dependency -->
</plugin>
~~~

### Equivalent mutant
Some mutants don't change behavior (e.g., swapping conditions in a loop that gives the same result) → no test can kill them. Don't aim for 100%; review survived mutants by group and ignore equivalent ones. A reasonable threshold is usually 60–80% for business code.

### When to use
- **Critical business code**: pricing, fees, interest, permissions, state machines.
- Evaluating the test suite quality of a module before refactoring.
- Do not run on the entire codebase for every PR (slow); use incremental mode/only changed classes ({{scmMutationCoverage}}, or Arcmutate for PR-based analysis).

### Real-world example
Loan fee module had 92% line coverage. Running PIT: mutation score 48%; 61 mutants survived, mostly at boundary conditions (overdue days {{>}} or {{>=}}) and rounding calls that tests didn't detect. The team added 35 tests with specific assertions at boundaries, score reached 81%. During this process, they found **a real bug**: fees weren't applied for loans overdue by exactly 30 days — causing a loss of about 0.4% in fees per month.

### Pitfall
- Running PIT on entire codebase per PR → multi-hour pipeline.
- Aiming for 100% → wasted effort on equivalent mutants.
- Running for config code, DTOs, getters/setters → noise.
- Treating mutation score as a personal KPI → people write tests to "kill mutants" instead of checking business requirements.

### Interview answer
"Coverage only shows which code lines ran, not whether the test checks the result: a test calling a method without asserting anything still gives 100% coverage. Mutation testing with PIT answers that: it deliberately makes small bytecode changes, like changing greater-than to greater-than-or-equal, changing plus to minus, deleting a call, each is a mutant, then reruns tests covering those lines. Test fail means mutant killed; test passes means there's a bug the tests don't detect. I use it for critical business code like pricing, permissions, set a threshold around 70%, and run it per-changed-class to not slow down PRs. Some equivalent mutants can't be killed so 100% is not needed. In the loan module, coverage was 92% but mutation score was 48%, and when adding boundary tests we found a real fee bug."

> Senior tip: when reviewing a PR with new tests, ask one simple question: "if I change > to >= on this line, which test fails?". That is mutation testing by head, free, and teaches the team to write boundary assertions.`,
    follow: ['Equivalent mutant is what and how do you handle it?', 'Does PIT support Kotlin?', 'How to integrate mutation score into the CI quality gate?'],
  },
  'testing-036': {
    q: `Where do flaky (unstable) tests in backend come from, and how do you kill each kind (time, ordering, shared data)?`,
    a: `**Summary:** A flaky test = same code, same input, different results across runs. Causes almost always fall into a few groups: **time** (system clock, timezone, sleep), **asynchrony** (asserting before background work finishes), **ordering and shared data** (one test leaves data for another), **external resources** (network, ports, slow containers), and **randomness/non-determinism** (HashMap order, random). Kill them by classifying the cause, fixing the root cause, and having an **isolate + own + fix-by-date** process so flakiness doesn't accumulate.

### Classification and fixes
| Source | Symptom | Fix |
|---|---|---|
| Time | Fail at midnight, month-end, different CI timezone | Inject {{Clock}}, use {{Clock.fixed}} in tests |
| Async | Fail when CI is slow | {{Awaitility}} to wait for condition, not {{Thread.sleep}} |
| Shared data | Fail when execution order changes or parallel run | Each test owns setup/teardown, random unique ids |
| Undefined order | Comparing HashSet/query result without ORDER BY | Assert independent of order, or use ORDER BY |
| External res | Network timeout, port occupied | Testcontainers, random ports, WireMock |
| Spring context leak | Different {{@MockBean}} creates new context | Group configurations, use {{@DirtiesContext}} intentionally |

### Time
~~~java
@Service
class CouponService {
  private final Clock clock;                       // inject instead of LocalDate.now()
  CouponService(Clock clock) { this.clock = clock; }
  boolean isExpired(Coupon c) { return LocalDate.now(clock).isAfter(c.expiry()); }
}
// test: fixed time, does not depend on run date
var clock = Clock.fixed(Instant.parse("2026-01-31T23:59:59Z"), ZoneId.of("Asia/Ho_Chi_Minh"));
assertThat(new CouponService(clock).isExpired(coupon)).isTrue();
~~~

### Asynchrony
~~~java
orderService.place(order);                          // publish event, consumer processes in background
await().atMost(Duration.ofSeconds(5))               // Awaitility: wait for condition, max 5s
       .untilAsserted(() -> assertThat(emailRepo.countFor(order.id())).isEqualTo(1));
~~~
{{Thread.sleep(2000)}} is both slow (always waits 2s) and still flaky (slow CI might need 2.5s). Awaitility finishes as soon as the condition is met and only fails when the time truly expires.

### Process to kill flaky tests
1. **Detect**: CI records tests that fail then pass on retry (Gradle Enterprise/Develocity, JUnit report, result comparison script); run suspect tests 50–100 times sequentially to reproduce.
2. **Isolate**: tag and move to a separate job that doesn't block merge — but **must have an owner and fix-by-date** (e.g., 2 weeks).
3. **Fix root cause** per table above; do not add auto-retry as the final solution.
4. **Measure**: % of CI builds failing due to flakiness weekly, show on team dashboard.

### Real-world example
Repo with 2,400 tests, about 18% CI builds failed due to unrelated code changes, devs got used to pressing "re-run" and once ignored a real failure. 4 weeks of analysis found 37 flaky tests: 14 due to {{Thread.sleep}} with Kafka consumer, 9 due to {{LocalDate.now()}}, 8 due to shared data in DB, 6 due to query result order. Fixes per group in 3 sprints (Awaitility, Clock, own data per test, ORDER BY): flaky CI builds fell below 1%, CI time even decreased by 4 minutes due to removing sleeps.

### Pitfall
- Retries hide real bugs.
- {{@Disabled}} and forgotten forever.
- Increasing sleep from 1s to 5s.
- Tests using a single shared "test user" record.

### Interview answer
"Flaky tests are tests that sometimes pass and sometimes fail without code changes, and I handle them by classifying the cause. Time: code calling LocalDate.now directly failed at midnight or month-end, I inject Clock and use Clock.fixed in tests. Async: asserting before consumer processes, I replace Thread.sleep with Awaitility to wait for a condition with a max timeout. Shared data and order: each test creates its own data with unique ids, assert independent of order or use ORDER BY. External resources use Testcontainers and WireMock. Regarding the process, CI detects tests failing then passing on retry; the test is isolated to a separate job that doesn't block merge, but it has an owner and a fix-by-date, and we track flaky failure rates weekly. In my last repo, this brought flaky CI builds from 18% to under 1%."

> Senior tip: record every "re-run" press. When teams get used to re-running, one day a real test failure will be ignored — and that's usually the most important concurrency test.`,
    follow: ['Awaitility differ from Thread.sleep how?', 'Detect flaky tests automatically in CI?', 'Handle flaky tests caused by database locking?'],
  },
  'testing-037': {
    q: `How do you test Flyway/Liquibase migrations so they don't pass on dev but fail in production?`,
    a: `**Summary:** Migrations must be tested on a real DB (Testcontainers) with production-like data, running the entire migration chain from empty, and checking backward compatibility.

### Why dev pass but production fail
| Cause | Example |
|---|---|
| Dirty data | {{ALTER ... SET NOT NULL}} fail due to old NULL rows; creating unique index fails due to duplicate data |
| Volume | {{ALTER COLUMN TYPE}} rewrites 200 million rows, table locked for 40 minutes |
| Old app version running | Renaming column → old app version fails immediately after migration finishes |
| Mismatched history | Someone modified a migration file that already ran → checksum mismatch, app doesn't start |
| Different engine | Test using H2, production is PostgreSQL |

### Layer 1 — Run from scratch on the correct engine
~~~java
@Testcontainers
class MigrationTest {
  @Container static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16.4");
  @Test void allMigrationsApplyCleanly() {
    Flyway fw = Flyway.configure()
        .dataSource(pg.getJdbcUrl(), pg.getUsername(), pg.getPassword())
        .validateMigrationNaming(true).load();
    MigrateResult r = fw.migrate();                 // runs V1..Vn like production
    assertThat(r.success).isTrue();
    assertThat(fw.validateWithResult().validationSuccessful).isTrue();   // checksum matches
  }
}
~~~
Add tests for **difficult data** (NULL, long strings, duplicates) before new migrations to ensure they can be handled.

### Layer 2 — Production clone
- Nightly pipeline restores an anonymized production snapshot, runs the branch's migrations, and measures **time** and **locking** (log {{lock_timeout}}, track {{pg_locks}}).
- Set thresholds: any migration locking a table for more than a few seconds or running for more than 5 minutes must be rewritten to be online (CONCURRENTLY, backfill in batches).

### Layer 3 — Backward compatibility (expand-contract)
When rolling deploy, old and new pods run simultaneously against the **same schema**. Renaming column {{name}} → {{full_name}}:
1. Release 1 (expand): add {{full_name}} column, app writes to both, reads from old; backfill.
2. Release 2: read from the new column.
3. Release 3 (contract): stop writing to old, drop old column.
Test: run the integration tests of the **application version currently in production** against the schema after the new migration — failure means the migration broke compatibility.

### Flyway/Liquibase rules
- **Never modify** a migration that has already run in any shared environment; fix with a new migration.
- Do not use {{flyway clean}} outside local environment (disabled by default in Flyway 9: {{cleanDisabled=true}}).
- {{flyway repair}} should be used deliberately (delete broken records, update checksums after understanding the root cause).
- Liquibase: use {{preConditions}} to check before running, {{rollback}} written in advance for risky changes.

### Real-world example
A migration adding a unique index on {{customer.email}} passed in all environments, but failed during production deploy due to 214 duplicate emails from a 3-year-old import bug; deploy hung, app had to be rolled back. Afterward, the team added a nightly job running migrations against an anonymized production snapshot and testing backward compatibility. In 6 months, this job blocked 4 broken migrations: 2 due to dirty data, 1 due to 12-minute table lock, 1 due to column renaming breaking the old version.

### Pitfall
- Testing migrations on H2 or schema created by Hibernate {{ddl-auto}}.
- Combining DDL and large data backfill in a migration running at app startup → pod readiness timeout.
- No rollback plan — many DDLs can't be rolled back, must write compensatory migrations.
- Two branches creating V42 → version conflict when merging (use timestamp or check in CI).

### Interview answer
"Migration pass on dev but fail production usually due to three reasons: dirty/large production data, old app version still running during rolling deploy, and mismatched migration history. So I test in three layers. Layer one, run all migrations from scratch on the real engine using Testcontainers, including checksum validation and seeding difficult data like NULLs or duplicates. Layer two, nightly job runs migrations against an anonymized production snapshot, measuring time and locking; migrations locking tables for more than a few seconds must be rewritten to be online. Layer three is backward compatibility: I follow expand/contract, for example, when renaming a column, I add a new one, write to both, backfill, then drop the old one in a later release, and I run the integration tests of the version currently in production against the new schema. Plus, I never modify migrations that have already run. In my last project, the production-clone job blocked four broken migrations in six months."

> Senior tip: add two questions to every migration review checklist: "how long will this lock tables with production data?" and "can the old application version run on this schema?". Those two questions block most migration incidents before they reach CI.`,
    follow: ['Expand-contract pattern is what?', 'Test migration with large data transforms?', 'Flyway repair vs clean?'],
  },
  'testing-038': {
    q: `(Lead) When refactoring legacy code with no tests, what are characterization tests and seams?`,
    a: `**Summary:** With legacy code without tests, I don't refactor first. I **record the current behavior** using **characterization tests** (tests describing what the code **does**, including weird behavior, not what it **should** do), then find **seams** — points where you can replace behavior without modifying surrounding code — to isolate hard-to-test dependencies (DB, time, static, HTTP). Once there is a safety net, refactor in small steps, run tests after each step, and only fix bugs **after** refactoring is done (don't do two things at once).

### Characterization test
Process according to Michael Feathers (Working Effectively with Legacy Code):
1. Call code with input.
2. Write **intentionally wrong** assert ({{assertEquals(0, result)}}).
3. Run, read the actual value in the error message.
4. Correct the assert to the actual value — now the test "freezes" the current behavior.
For large output (reports, JSON, exported files), use **approval testing** (snapshot): save the first result as an "approved" file, match the whole file next time.
Best input source: **real data** (anonymized production request logs) — covers cases no one remembers.

### Seam
A seam is where you **can change behavior during testing** without modifying logic. Common types in Java:
- **Extract dependency into parameter/constructor** (object seam).
- **Extract and override**: extract hard call into protected method, test by overriding in subclass.
- **Wrap static/singleton** behind a thin interface.
~~~java
// Before: untestable because of static call + system time
class InvoiceService {
  BigDecimal lateFee(Invoice i) {
    long days = ChronoUnit.DAYS.between(i.due(), LocalDate.now());
    return days > 30 ? LegacyRates.get("LATE").multiply(i.amount()) : BigDecimal.ZERO;
  }
}
// After (minimal change, behavior preserved): add seam via constructor
class InvoiceService {
  private final Clock clock; private final RateProvider rates;   // RateProvider wraps LegacyRates
  InvoiceService(Clock clock, RateProvider rates) { this.clock = clock; this.rates = rates; }
  BigDecimal lateFee(Invoice i) {
    long days = ChronoUnit.DAYS.between(i.due(), LocalDate.now(clock));
    return days > 30 ? rates.get("LATE").multiply(i.amount()) : BigDecimal.ZERO;
  }
}
~~~
The step of creating a seam must be a **safe mechanical refactoring** (done by IDE: extract method, introduce parameter) because there are no tests yet.

### Safe refactoring process
1. Select the area to be changed (don't cover the whole system with tests).
2. Create minimal seam → write characterization test → run green.
3. Refactor in small steps, commit frequently, run tests every step.
4. Find bug while recording behavior? **Note it, don't fix it**; fix in a separate commit later, with a new test.
5. When replacing the whole module: strangler fig + run in parallel to compare results.

### Real-world example
A 3,200-line invoice calculation class, 0 tests, every change caused billing errors. The team took 5,000 anonymized real invoices as input for an approval test (compare the whole output file), created 6 seams (Clock, wrapping 3 static classes, 2 repositories). It took 2 weeks to have a safety net; afterward, they separated 7 small classes in 4 weeks, without a single discrepancy on 5,000 invoices. While recording behavior, they discovered 2 old bugs (rounding error) — fixed later, with notice to business.

### Pitfall
- Fixing bugs while refactoring → can't tell if the change in result is from refactoring or fixing the bug.
- Writing tests for "intended" behavior instead of "current" behavior → test fails immediately, no safety net.
- Mocking too deeply into internal details → test breaks on refactoring, loses value.
- Creating seams by making big changes without tests.

### Interview answer
"With legacy code without tests, I don't refactor immediately. The first step is characterization tests: record what the code is doing, even weird behavior. How to do it is to call the code, write an intentionally wrong assert, read the real value then fix the assert; for large outputs, I use approval test comparing the whole file. The best input is anonymized real data. To make it testable, I find seams, which is where I can change behavior during testing without modifying logic: inject Clock instead of calling now, wrap static classes behind a thin interface, extract hard calls into methods to be overridden. The step of creating a seam must be mechanical refactoring using IDE because there are no tests yet. Once there is a safety net, I refactor in small steps, running tests every step. Bugs discovered while recording behavior are noted and fixed in a separate commit later. Last time, with a 3,200-line invoice class, we used 5,000 real invoices as approval tests and separated seven classes without any discrepancy."

> Senior tip: set a clear time budget for the "building the safety net" phase (e.g., 20–30% of total effort) and report it to management upfront. This part generates no features, but it's the reason refactoring doesn't turn into an incident.`,
    follow: ['Approval testing differs from characterization testing how?', 'Handling global state/singletons?', 'Measure safe refactoring beyond test passing?'],
  },
  'testing-039': {
    q: `(Lead) How do you cut CI time from 40 minutes to 10 minutes without losing reliability?`,
    a: `**Summary:** Reducing CI from 40 to 10 minutes starts by **measuring**: time per step, per test, and the critical path. The levers in order of effectiveness are: **caching** (dependency, build), **parallelisation** (splitting tests into shards), **fixing slow tests** (excessive Spring context creation, sleep, new container per class), **tiered running** (PR runs fast, full suite nightly), and **test impact analysis** — all while **preserving** what must block merge.

### Measure before optimising
- Split the time: compile, unit, integration, e2e, docker build, deploy.
- Usually 60% is integration tests + container startup.

### Levers
| Lever | How-to | Typical reduction |
|---|---|---|
| Cache | Maven/Gradle dependency cache, Docker layer cache, build cache | 3–8 minutes |
| Parallel | Split suite into 4–8 shards by run time; Surefire {{forkCount}}; JUnit 5 parallel for unit tests | 2–4 times |
| Context Spring | Group test configurations, remove scattered {{@MockBean}} creating new context, remove redundant {{@DirtiesContext}} | 5–15 minutes |
| Container | One shared Testcontainers for the entire suite | several minutes |
| Skip sleep | Awaitility instead of {{Thread.sleep}} | depends |
| Tiers | PR: build + unit + integration fast; merge: full; nightly: E2E, mutation, load | 30–50% on PR |
| Test impact | Run only tests related to changed files (affected modules) | huge for monorepo |

~~~yaml
# GitHub Actions: split integration tests into 4 shards running in parallel
jobs:
  it:
    runs-on: ubuntu-latest
    strategy: { matrix: { shard: [1, 2, 3, 4] } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '21', cache: maven }
      - run: ./mvnw -B verify -Dshard=MATRIX_SHARD -DshardCount=4   # script selects test classes per shard
~~~
(Replace {{MATRIX_SHARD}} with Actions matrix expression; script divides test classes so total time per shard is balanced.)

### Step 3 — Maintain reliability
- What must block merge cannot be reduced: build, unit, integration of affected modules, contract tests, high-level security scans.
- Test impact analysis must be **safe by default**: changes to build configuration files, shared libraries → run everything.
- Run full suite on main branch after merge; revert fast if it fails.
- Track failure leakage to other stages to see if skipping tests increases risk.

### Metrics to track
p95/p90 PR feedback time, flaky rate, runner wait time, monthly runner costs, number of bugs found after merge.

### Real-world example
Monorepo with 14 modules, PR CI took 41 minutes. Measurements showed: 9 minutes loading dependencies (no cache), Spring context created 46 times (approx. 11 seconds each ≈ 8.5 minutes) due to each test class having its own {{@MockBean}} set, 23 test classes creating their own PostgreSQL container, 6 minutes of sleeps in Kafka tests. Fixes: Maven cache, reduced 46 Spring contexts to 5, shared container, Awaitility, split into 4 shards, only build affected modules on PR. Result: p50 **41 → 9 minutes**, p90 12 minutes; number of bugs found after merge did not increase over 3 months of monitoring.

### Pitfall
- Parallelising when tests share DB/data → flaky rate spikes.
- Skipping integration tests on PR to be "fast" → errors pile up on main branch.
- Optimising the fastest job instead of the critical path.
- Adding larger runners without fixing root causes (context, sleep) → wasted money, marginal reduction.

### Interview answer
"I start by measuring: time per step, per test class, and count Spring context creation times, as usually 20% of tests take 80% of the time. Then, I apply levers by order of effectiveness. Cache dependencies and builds. Group test configurations so Spring caches the context, as each unique set of @MockBean creates a new context taking ten seconds. Use a shared Testcontainers for the entire suite and replace Thread.sleep with Awaitility. Split tests into shards running in parallel based on run time. Tiers: PR runs build, unit, and integration tests for affected modules; E2E, mutation, and load tests run after merge or nightly. What must block merge is never skipped, and test impact analysis must be safe by default. In the last monorepo, PR CI went from 41 minutes down to about 9 minutes, just reducing 46 Spring contexts to 5 saved over 8 minutes."

> Senior tip: print Spring context startup counts at the end of each test run and set a threshold in CI. No one intends to create new contexts, but every new {{@MockBean}} silently adds 10 seconds — an automatic threshold keeps the suite from slowing down again.`,
    follow: ['Test impact analysis works how?', 'Balance speed and reliability when skipping tests?', 'Cost optimisation for CI runners?'],
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