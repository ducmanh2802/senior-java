/*
 * English translation of js/data/q-soft.js — task T218. Format: js/core/i18n.js (content overlay).
 * ids: behavioral-010 behavioral-011 behavioral-012 testing-011 testing-012 testing-013 testing-014 testing-015
 */
App.i18n.content({
  'behavioral-010': {
    q: 'What will you do in your first 90 days at a new company?',
    a: `**Summary:** This question measures **speed to learn, proactivity and pragmatism**. A strong answer divides into 3 phases of 30 days, with a **concrete deliverable** at each stage, and balances "learning" with "contributing" — not 90 days reading code, nor 90 days fixing what you do not understand yet.

### What the interviewer wants to assess
- **Do you have a plan?** Did you think ahead about 3 months, or are you answering by feel?
- **Learn vs. do**: You understand that it is normal not to contribute value on day one.
- **Specificity**: Are there milestones and measurable "understanding" criteria?
- **Contribution mindset**: You do not wait until day 91 to start.
- **Safety**: You do not promise things you cannot keep.

### Answer framework (STAR mapping)
- **S — Situation**: New system, you know nothing — this is "your situation".
- **T — Task**: The 90-day goal is to learn enough to work effectively and deliver a small value.
- **A — Action**: Specific actions by phase below.
- **R — Result**: Concrete product delivered at 30/60/90 day marks.
- **0–30 days — Understand**: Run locally, read git history of the module you will own, draw the main flow yourself and compare with docs to see where docs are wrong — this is the fastest way to know what the real system is. In parallel, talk to 5–6 people: 1 product, 2–3 devs, 1 QA, 1 ops. The deliverable of this phase is a "open questions" doc — a list of what you still do not understand and who can answer. I also **do not propose improvements in the first 30 days**, because every proposal before understanding the system just costs rewriting.
- **31–60 days — Small, safe contribution**: Pick low-risk work with real value: write tests for uncovered areas, add missing log/metrics, or fix a small recorded bug. The goal is to **understand the codebase deep enough to fix without breaking**, and have at least one PR merged. I ask for tighter review than usual — not because I lack confidence, but because each good PR is one time I learn the team’s coding conventions.
- **61–90 days — Own a piece**: Take an end-to-end item (with a backup), responsible from small design to deploy and monitoring. At the same time propose **one improvement with data** — usually something I observed in the first 60 days: an N+1 query, a slow pipeline, or a manual release process. I present the proposal to the team lead before bringing to the team.

> In short: on day 90 I want to be someone who **can contribute and knows where improvement is needed**, not someone who just started.

### What to avoid
- **"I will read all the codebase first"**: nobody does this, and it sounds unplanned.
- **Promise to fix old system issues in 90 days**: unrealistic promises reduce trust.
- **Too much focus on new tech**: "I want to refactor to X" in the first 90 days is a big red flag.
- **No measurable criteria**: "will know the system" is not a criterion.
- **Not meeting anyone outside tech**: especially when the role touches product/business.

> Senior tip: insert a detail **showing you thought about not breaking the new system** — for example "in phase one I will prioritize reading and writing tests over fixing logic." Interviewers value this caution more than surprise at ambition.`,
    follow: [
      'In the first 90 days, how will you know you have learned enough to work effectively?',
      'How will you react if after 30 days you realize the current architecture has a serious problem?',
      'When do you know it is time to contribute rather than just learn?'
    ]
  },
  'behavioral-011': {
    q: 'What questions will you ask about the company and this position?',
    a: `**Summary:** Many candidates answer very superficially ("about culture and salary"). A strong answer shows you **have researched in advance**, know which questions **help you decide**, and do not ask things easily found on the website. Prepare 5–6, grouped, and say clearly which you ask for **personal reasons**.

### What the interviewer wants to assess
- **Preparation level**: What have you read about the company before the interview?
- **Quality of questions**: To **make a decision**, not to impress.
- **Systems thinking**: You see the link between role, process and business outcome.
- **Respect**: Not asking things easily found on the hiring page.

### Answer framework (STAR mapping)
- **S — Situation**: Where you are, which interview round, what you already know.
- **T — Task**: Gather enough information to decide, not to impress.
- **A — Action**: Prepare questions by group, ask in priority order.
- **R — Result**: After the interview, you have enough data to decide whether to accept.

### Recommended question groups (STAR logic: context → task → action → result)
| Group | Example question | Why ask |
|---|---|---|
| Product context | "What problem is this team solving, and how is success measured?" | Understand what you will actually do |
| Role expectation | "At month 6, what makes the manager say this person has done well?" | Know the standard from day one |
| Team and working style | "How are PRs reviewed, and how does the team handle production incidents?" | Affects quality of work life |
| Technical | "What architecture decision did the team debate recently and what was the outcome?" | Understand decision culture |
| Growth path | "Where did the previous person in this role go in 1–2 years?" | Know the role’s trajectory |
| Personal | "What is something in my profile you want to clarify?" | Proactive and realistic |

### Sample answer
> "I prepare about 6 questions, divided by purpose, not order.
> The first I always ask is about **product context**: 'What is the team focused on, and how is success measured?'. This helps me understand the real work, not the website description.
> The second is the one **I truly need to decide**: 'At month 6, what will make you say this person has done well?'. Many roles do not state expectations clearly, and new hires have to guess — both sides end up disappointed.
> The third is about **real working style**: 'How are PRs reviewed, and when a production incident happens, what is the response process?'. I want to work where there is operational discipline.
> The fourth is about decision culture: 'In the past year, what architecture proposal did the team disagree on? What happened?'. I ask this because I want to know if the team can disagree healthily.
> I also ask about the role’s growth path, and save the last for the interviewer: 'Is there anything in my profile you want to clarify further?'. In the final round, this is the best chance to address any hiring risk.
> I intentionally **do not** ask about salary in this round, because that is information you get quickly at offer stage; today I want to use the time to understand the work and the team."

### What to avoid
- **Asking what is already on the company website**: "How do I apply?" — wastes your chance to impress.
- **Asking salary/bonus in the first round**: shifts focus; ask at the final round.
- **Too generic** ("What is the work environment like?") or **too many (8–10)**: nobody answers usefully, and you turn it into an interview of them.
- **Not listening then repeating the same topic**, or **not preparing any**: "I have not thought about it" is a bad signal.

> Senior tip: the best question many people skip is **"What architecture decision did the team debate recently?"**. It shows whether the team has a culture of healthy debate, and pushes the conversation into depth instead of small talk.`,
    follow: [
      'If you could ask only one question, which would you choose?',
      'Can you ask about salary without losing goodwill?',
      'What do you need to know about the team to judge whether you fit?'
    ]
  },
  'behavioral-012': {
    q: 'How do you negotiate salary and an offer? Any tips for the Vietnamese market and remote work?',
    a: `**Summary:** Salary negotiation is a business skill, not luck. Principles: **have data before negotiating, negotiate on total compensation not just base salary, and always leave an exit so the relationship does not turn bad**. In Vietnam, besides base salary there is quarterly bonus, allowances, and insurance; with remote work, also calculate conversion cost, timezone and contract type.

### What the interviewer wants to assess
- **Preparation**: Do you know market rates for this role?
- **Self-valuation**: Based on value delivered, not cost of living.
- **Negotiation skill**: Know when to concede and when to hold.
- **Maturity**: You know when to say "no".

### Answer framework (STAR mapping)
- **S — Situation**: The proposed role, company budget, value you bring.
- **T — Task**: Reach an agreement while the company relationship stays good.
- **A — Action**: Reference data, questions asked first, total-compensation approach.
- **R — Result**: Final salary, total income, remaining goodwill.

### Sample answer + practical tips
> "I divide negotiation into four steps.
> **One, prepare data before the interview.** I look up market rates for senior backend in Vietnam through public sources — surveys (Levels.fyi, Glassdoor, industry reports) show about 30–45 million VND/month gross for 5–7 years experience at product companies; outsourcing or FDI may be lower. More important than the number: **I price by value** — "I reduced p99 of the payment flow 40% and led migration X" — that is the basis to negotiate.
> **Two, ask questions before stating a number.** When HR asks "What salary do you expect?", I respond with a question: "What is the budget for this role, and which part is flexible?" Flexible parts are the opportunity to negotiate instead of accepting the first number. In Vietnam I ask clearly about structure: **what share is base, how is quarterly bonus structured, are there allowances and insurance?** A base of 40M with uncertain bonus can be worse than 35M with a 2-month bonus.
> **Three, negotiate on total compensation.** I propose priorities: base at or above median, clear quarterly bonus tied to personal KPI, training budget, equipment/laptop, and equity if available. For remote work with overseas clients I also calculate: conversion rate, equipment/internet allowance, tax support, and contract type (EOR vs contractor).
> **Four, keep an option and professionalism.** I always ask for 1–2 days to consider, and when negotiating further I state conditions clearly: "If base is at level X, I will agree." I do not threaten with another offer unless it really exists, and I do not lie about current salary.
> Recent result: initial offer 38M, I negotiated with data and concrete contributions to reach 45M plus a 2-month bonus — total income up 25%, and relationship with HR and hiring manager stayed very good."

### What to avoid
- **Giving a single hard number**: loses all leverage and can cap you below market.
- **Lying about current salary or other offers**: Vietnam IT is small, information spreads fast.
- **Talking only about base**: talk total value, and know your minimum acceptable before entering.
- **Too hard at the first round**, or using "I have another offer" when it is not true.
- **Ignoring bonus, benefits, insurance, equity** — in Vietnam much of offer value is outside base salary.
- **Not considering contract for remote**: EOR vs contractor affects tax and insurance greatly.

> Senior tip: set your **walk-away number** before the interview and write it down. When you have that number in mind, you negotiate very differently — calmer, and know exactly when to stop. People without a walk-away often accept worse than they could, only because they fear saying "no".`,
    follow: [
      'How do you price your work when converting to money?',
      'If the company says "we cannot increase further", how do you respond?',
      'For remote work with overseas clients, which contract terms will you watch especially?'
    ]
  },
  'testing-011': {
    q: 'Your service publishes events to Kafka and consumes events from another service. How do you test producer/consumer — Testcontainers, embedded Kafka, or mock? How do you reliably test async parts (delayed message, consume error, retry)?',
    a: `**Summary:** Kafka needs **three test tiers**: unit test for event mapping logic (mock {{KafkaTemplate}}), **embedded Kafka** for consumer behavior (real topic, real consumer group), and **Testcontainers Kafka** for near-production flow. For async parts, the key is **wait by condition** with Awaitility instead of {{Thread.sleep}}, and you must test **error paths** (retry, DLT, poison message), not just happy path.

### Three tiers for Kafka
| Tier | Tool | Verifies | Speed |
|---|---|---|---|
| Unit | mock {{KafkaTemplate}} | payload, key, partition, header, idempotency key | under 50 ms |
| Slice | {{@EmbeddedKafka}} from spring-kafka-test | real consumer, offset, ack mode, error handler, DLT | a few seconds |
| Integration | {{KafkaContainer}} from Testcontainers | real broker in KRaft mode, serialization, production config | 10–30 s |

### Producer test — focus is data contract
~~~java
@Test void publish_order_created_uses_order_id_as_key() {
    KafkaTemplate<String, OrderCreated> template = mock();
    var service = new OrderEventPublisher(template);

    service.publish(OrderCreated.of("OD-1", 500_000L));

    verify(template).send(eq("order.created"), eq("OD-1"),
        argThat(v -> v.amount() == 500_000L));
}
~~~
- Mock test only proves "we called send with correct params"; **it does not prove message actually reaches consumer**.
- If event uses Avro/Protobuf with Schema Registry, test with real schema: version mismatch in serialization is a common hidden bug.
- Remember to test **outbox** flow: message must be replayable after broker crash, not lost when publish fails.

### Consumer test — embedded Kafka + Awaitility
~~~java
@SpringBootTest
@EmbeddedKafka(partitions = 1, topics = "order.created",
               bootstrapServersProperty = "spring.kafka.bootstrap-servers")
class OrderConsumerTest {
    @Autowired KafkaTemplate<String, OrderCreated> template;
    @Autowired SettlementService settlement;

    @Test void paid_order_is_settled() {
        template.send("order.created", "OD-1", new OrderCreated("OD-1", 500_000L));

        await().atMost(Duration.ofSeconds(5)).untilAsserted(() ->
            assertThat(settlement.findByOrderId("OD-1"))
                .get().extracting(Settlement::getState)
                .isEqualTo(SETTLED));
    }
}
~~~
- {{@EmbeddedKafka}} loads a real broker into JVM so CI needs no Docker and is still fast.
- **Always wrap assert in {{untilAsserted}}**: consumer runs in another thread; asserting immediately checks before processing is finished — the most common cause of Kafka test flakiness.
- Choose timeout **just right** (3–5 s): 30 s only makes CI slow at the exact moment a test is failing.

### Error paths — the part usually missed
| Scenario | How to test |
|---|---|
| Deserialize error (bad payload) | Send garbage message, assert DLT receives it |
| Handler throws exception | Enable error handler with backoff, assert retry count |
| Message cannot be processed | Assert skipped or pushed to DLT per policy |
| Broker dies mid-way | Stop container then restart, assert no message loss |

Only with a real broker (embedded or container), not mock, can you reproduce two situations: **offset committed but handler not finished** (message lost on restart) and **rebalance makes another consumer receive the message** (duplicate processing).

### Common pitfalls
- **Many tests share one topic** in embedded broker ⇒ data noise; separate topic or group id per test. And **Embedded Kafka is not production**: it runs in JVM, usually 1 broker with no ACL or TLS by default — those should be tested at Testcontainers tier (Spring Boot 3.1+ has {{@ServiceConnection}} to auto-connect {{KafkaContainer}} to app, no manual property needed).

> Senior tip: when an event-driven system fails in production, the cause is almost always **message order**, **duplicate messages**, or **message that cannot be deserialized** — not pure business logic. Invest in testing those three: duplicates must be idempotent, out-of-order messages must not corrupt state, and old-schema messages must still be consumed by the new consumer.`,
    follow: [
      'Do you use separate topics per test or shared topic with separate group id? Risks of each?',
      'With Avro/Protobuf and Schema Registry, how do you test schema evolution (compatibility)?',
      'How do you test consumer restart mid-process without losing messages?'
    ]
  },
  'testing-012': {
    q: 'Your Spring Boot test suite is slow (20 minutes). Where is the cause, how do {{@WebMvcTest}} and {{@DataJpaTest}} differ in speed, and how does context caching work to speed up the suite without sacrificing reliability?',
    a: `**Summary:** Slow Spring suites usually have **three causes**: rebuilding ApplicationContext too many times (context cache broken), writing tests at too high a tier ({{@SpringBootTest}} for everything), and depending on real I/O. Before optimizing, **measure** where time is spent; then speed up by grouping tests with same config, removing {{@DirtiesContext}}, and enabling JUnit 5 **parallel execution**.

### Three causes of slow suites
| Cause | How to recognize | Fix |
|---|---|---|
| Context rebuilt many times | time ~ number of classes × a few seconds | group same config, remove {{@DirtiesContext}} |
| Tests at too high tier | every test is {{@SpringBootTest}} | lower to slice/unit |
| Real I/O dependency | tests wait for network, sleep, retry | WireMock, shared container, static data |
| Sequential run | CPU idle but suite is long | enable JUnit 5 parallel |

### How context caching works
Spring TestContext framework caches **ApplicationContext** and reuses it for tests with the same **MergedContextConfiguration**: same active profiles, same property sources, same context customizers, same initializer, same test type.
- Default cache max is **32 contexts** (property {{spring.test.context.cache.maxSize}}).
- {{@DirtiesContext}} (class or method) **removes context from cache** ⇒ next run must build from scratch. This is the #1 culprit of slow suites.
- Tests nested with {{@Nested}} usually share the outer class context, cheaper than separate classes.
- {{@TestPropertySource}} different across classes ⇒ each class its own context. Grouping tests that need different properties into **same class** is much cheaper.

### Compare slice tests
| Annotation | Loads | Default DB | Speed | Used to verify |
|---|---|---|---|---|
| {{@WebMvcTest}} | web tier + Spring Security; services must be mocked with {{@MockitoBean}} (Boot 3.4+, older {{@MockBean}}) | none | 1–2 s | controller, validation, serialization |
| {{@DataJpaTest}} | JPA, repository, transaction rollback | embedded (H2/HSQLDB if on classpath) | 2–4 s | repository, JPQL, mapping, constraint |
| {{@JsonTest}} | Jackson only | none | under 1 s | serialize/deserialize |
| {{@SpringBootTest}} | full application context | per config | 10–30 s | wiring, real security filter, E2E |

Note: {{@DataJpaTest}} **replaces DataSource with embedded DB by default**. To test on real Postgres, add {{@AutoConfigureTestDatabase(replace = Replace.NONE)}} then connect Testcontainers — otherwise you test on H2 and all dialect differences appear in production.

### Checklist to speed up
1. **Measure first**: check Surefire/Gradle report to know which class takes time; do not optimize by feeling.
2. **Group by config, not by feature** — same class, same profile.
3. **Remove {{@DirtiesContext}}**: replace with self-cleaning (rollback, truncate, delete by app API).
4. **Enable JUnit 5 parallel** via {{junit-platform.properties}}:
~~~text
junit.jupiter.execution.parallel.enabled=true
junit.jupiter.execution.parallel.mode.default=concurrent
junit.jupiter.execution.parallel.mode.classes.default=concurrent
~~~
5. **Sharding in CI** when suite is still large: split by class groups to run many jobs in parallel.

### Common pitfalls
- **Enable parallel when tests still use shared data or static state** ⇒ new flaky tests, now suite is both slow and unstable.
- **{{@Transactional}} with async threads**: rollback applies only to test thread; tasks running in other threads are not rolled back ⇒ data leaks and later tests affected.
- **Optimizing by removing tests** just to make pipeline green, or using {{@Timeout}} to "handle" hanging tests: hides symptoms and makes team lose trust in CI.
- **Building context per test method** because using {{@DirtiesContext(classMode = AFTER_EACH_TEST_METHOD)}} or changing {{@MockitoBean}}/property per test ⇒ loses all cache benefits. Enable log {{org.springframework.test.context.cache=DEBUG}} to see cache hit/miss count.

> Senior tip: do not optimize "just for numbers". Set a goal for **p95 time per test** and **flaky rate** together. A suite running 3 minutes with 5% random red is still a broken pipeline, because teams learn to ignore CI red — and then all speed optimizations become meaningless.`,
    follow: [
      'What tools do you use to measure and analyze test time (Surefire report, JFR, flamegraph)?',
      'When do you accept the trade-off: keeping high-tier tests for reliability even if suite is slow?',
      'Do you use test sharding in CI, and split by which criteria?'
    ]
  },
  'testing-013': {
    q: 'How do you test authorization and security in Spring Boot — {{@WithMockUser}}, IDOR tests (changing id in URL to read someone else’s data), and tests with real JWT? Which authorization errors most often reach production?',
    a: `**Summary:** Security tests must have **three tiers**: unit test for authorization logic at service tier (using {{@WithMockUser}}), slice web for controller + filter chain (MockMvc + spring-security-test), and integration test with **real JWT** to prove token is parsed, valid and correctly rejected. The key point: **negative tests matter more than positive tests** — an API tested only with valid users is not tested.

### Three tiers for security testing
| Tier | Tool | Verifies |
|---|---|---|
| Unit / service | {{@WithMockUser}} + method security | rules "who can do what" at business tier |
| Slice web | {{@WebMvcTest}} + MockMvc | routing, role-based authorization, 401/403 error codes |
| Integration | {{@SpringBootTest}} + {{TestRestTemplate}} | real JWT, real filter chain, real config |

### Using {{@WithMockUser}} correctly
~~~java
@WebMvcTest(OrderController.class)
class OrderControllerSecurityTest {
    @Autowired MockMvc mvc;
    @MockitoBean OrderService service;

    @Test void anonymous_is_rejected() throws Exception {
        mvc.perform(get("/api/orders")).andExpect(status().isUnauthorized());
    }

    @Test @WithMockUser(roles = "CUSTOMER")
    void customer_cannot_call_admin_endpoint() throws Exception {
        mvc.perform(get("/api/admin/orders"))
           .andExpect(status().isForbidden());
    }
}
~~~
- Service is mocked, so this slice only verifies **URL/role rules**; checking "is this order mine?" belongs to service, and must be tested at integration tier (IDOR below).
- Clearly distinguish **401** (unauthenticated — no identity) and **403** (authenticated but insufficient permission). Returning 401 for a logged-in user lacking permission is wrong.
- {{roles("ADMIN")}} creates authorities as {{ROLE_ADMIN}}; if code checks {{SCOPE_admin}} then use {{authorities(...)}} instead of roles. Mixing these two systems is a very common authorization bug.
- Method security must be enabled with {{@EnableMethodSecurity}} (since Spring Security 5.6, replacing deprecated {{@EnableGlobalMethodSecurity}}). Without this annotation, {{@PreAuthorize}} **does nothing** and tests pass silently — the most dangerous bug type.

### IDOR test — mandatory
Idea: create data of **user A**, then let **user B** try to access using the same id.
~~~java
@Test void user_b_cannot_read_order_of_user_a() throws Exception {
    var order = orderRepo.save(Order.of("OD-A", 100L));
    mvc.perform(get("/api/orders/" + order.getId()).with(user("user-b").roles("CUSTOMER")))
       .andExpect(status().isForbidden());
}
~~~
- Returning **403** or **404** are both acceptable. Many systems choose 404 to not reveal the id exists (avoid enumeration).
- **IDOR leaks because**: controller gets id from path, service queries by id but **does not filter by owner**; or filters using body info instead of security context; or only checks "is CUSTOMER?" not "is it mine?".

### Real JWT test
- Sign token in test with the same key pair as production (Nimbus {{JwtEncoder}} or jjwt), then send via {{Authorization}} header.
- Must include cases: expired token, bad signature, wrong audience/issuer, missing required claim, token for disabled account.
- With {{@WebMvcTest}}, spring-security-test has {{jwt()}} post-processor to build requests with token without real signing — but **integration test must sign for real**, because only integration catches config errors (wrong issuer, wrong lifetime, wrong key).

### Common pitfalls
- **Only testing with {{@WebMvcTest}}**: the slice loads {{Filter}} and {{SecurityFilterChain}}, but any service/repository that the filter depends on (looking up user, checking revoked token) are mocked ⇒ does not prove real path; need full-context tests.
- **Using {{ROLE_ADMIN}} for all tests** to "make it easy" ⇒ hides most authorization errors.
- **Not testing disabled/deleted accounts** while token is still valid, and **asserting by message instead of error code**: assert status code and response structure.

> Senior tip: build an **authorization matrix** — resource × role table — and ensure **every cell has a test**. That table serves as documentation and auto-generated test list. In fintech, the cell "user A reads user B’s data" is the most dangerous, and it never appears in happy-path tests.`,
    follow: [
      'How do you handle authorization spread across tiers (controller, service, repository) — is there a way to test centrally?',
      'How do you test when token is still valid but the account has been disabled or role changed?',
      'Do you use automated security scanning tools (OWASP ZAP, dependency-check) in the pipeline?'
    ]
  },
  'testing-014': {
    q: 'How do you test Flyway/Liquibase migrations to make sure they run correctly on real data? And when deploying with rolling updates (old and new versions running together), how do you ensure the new schema does not break the old version?',
    a: `**Summary:** Migrations must be tested **on real data**, not on empty DB — errors often lie in constraints, existing data and runtime on large tables. With rolling deploy, use the **expand–contract** strategy: add new column (nullable) first, dual-write during transition, and only **drop old column in a later migration**, when all instances are on the new version.

### Four test types for migrations
| Type | What it does | Catches |
|---|---|---|
| From start | full script on empty DB, version 1 to latest | syntax errors, missing files, checksum mismatch |
| Upgrade path | load schema + data at version N, run from N+1 | constraints conflicting with existing data |
| With real data | run on anonymized production copy | NOT NULL, unique, index broken by dirty data |
| Performance | measure lock time and runtime on large table | migration blocking production at deploy |

~~~java
@Test void migrations_apply_on_top_of_existing_data() {
    Flyway.configure()
          .dataSource(dataSource)
          .target("3")
          .load().migrate();
    seedLegacyOrders(1000);

    var result = Flyway.configure().dataSource(dataSource).load().migrate();
    assertThat(result.success).isTrue();
    assertThat(jdbcTemplate.queryForObject("select count(*) from orders", Long.class))
        .isEqualTo(1000);
}
~~~
- Second {{migrate}} must be **no-op** (0 migrations applied) because versioned migrations run once; repeatable scripts ({{R__}}) or manual scripts must be idempotent ({{IF NOT EXISTS}}…). Run {{validate}} to detect edited applied files (checksum mismatch).
- **Do not edit applied migration files**: checksum will mismatch and all environments error. To fix, create a new versioned file.
- Use **SQL lint** (SQLFluff) in CI to catch syntax errors before production.

### Expand–contract for rolling deploy
| Step | Action | Old version still runs? |
|---|---|---|
| 1. Expand | add new nullable column, delete nothing | yes |
| 2. Deploy new code | write both old and new columns (dual write) | yes |
| 3. Backfill | copy old data to new column (after dual write, so new rows are not missed) | yes |
| 4. Switch read | read from new column | yes |
| 5. Contract | drop old column in **next migration** | no longer needed |

Example renaming column {{payment_time}} to {{paid_at}}:
~~~sql
ALTER TABLE orders ADD COLUMN paid_at timestamp NULL;
UPDATE orders SET paid_at = payment_time WHERE paid_at IS NULL AND id BETWEEN :from AND :to;
ALTER TABLE orders DROP COLUMN payment_time;
~~~
- Creating index on large table must use {{CREATE INDEX CONCURRENTLY}} (Postgres) to not block writes; this **cannot run inside a transaction**, so configure that script to run outside transaction (Flyway: {{executeInTransaction=false}} in companion {{.conf}} file).
- For NOT NULL column: add nullable → backfill → add {{CHECK (paid_at IS NOT NULL) NOT VALID}} → {{VALIDATE CONSTRAINT}} (no write block) → {{SET NOT NULL}}. From Postgres 12, {{SET NOT NULL}} skips full scan when valid CHECK exists; doing straight {{SET NOT NULL}} scans the whole table under ACCESS EXCLUSIVE lock.
- Every step must **be rollbackable**: if backfill fails, you need a specific undo script, not just "drop column".

### Common pitfalls
- **Testing migrations on empty DB** ⇒ misses all errors from old data: duplicate unique values, NOT NULL violations, slow indexes.
- **Dropping column in same release** ⇒ old version still running selects it and breaks production.
- **Editing old migration file** ⇒ checksum mismatch, deploy stops midway.
- **Running migrations at peak hours** with blocking DDL ⇒ API hangs. Set maintenance window or batch migration.
- **Not measuring runtime on large tables** ⇒ deploy takes hours, table locked because ALTER TABLE rewrites 200 million rows.

> Senior tip: keep an **anonymized production data copy** in test environment and run migrations on it before each release. It catches errors from dirty data accumulated over years (duplicates, nulls, wrong formats) that empty-DB tests never find. Combined with the **expand first, contract later** rule, you eliminate almost all downtime risk from schema changes.`,
    follow: [
      'How do you handle rollback after a migration with data has run (not just code rollback)?',
      'Do you use any tool to compare schema across environments and detect drift?',
      'When do you accept downtime for schema changes instead of expand–contract?'
    ]
  },
  'testing-015': {
    q: 'How does property-based testing (jqwik) differ from example-based testing? For which specific problem do you use it, and how do you choose properties (invariants) correctly?',
    a: `**Summary:** Example-based tests only check cases **you thought of**; property-based tests check **all inputs** in a large domain by generating data with seed, then **shrinking** to minimal failing cases. jqwik is a property-based testing library for Java inspired by QuickCheck, running as a JUnit Platform engine. It finds bugs that example tests miss mainly at **edges** (0, negatives, MAX_VALUE), in **multi-parameter interactions**, and in algorithms with constant branches that are easy to get wrong.

### Comparing the two styles
| | Example-based | Property-based |
|---|---|---|
| Criterion | concrete result in a few cases | an **invariant** true for all inputs |
| When fail | know input immediately | framework **shrinks** to minimal example |

### Example from e-commerce business logic
Problem: compute **shipping fee** and **order total**, with member-tier discounts and free shipping when total reaches a threshold.
~~~java
@Property(tries = 500)
void amounts_never_negative_and_subtotal_monotonic(@ForAll("order") Order order) {
    var total = pricing.total(order);

    assertThat(total.amount()).isGreaterThanOrEqualTo(BigDecimal.ZERO);
    assertThat(total.shipping()).isGreaterThanOrEqualTo(BigDecimal.ZERO);

    assertThat(pricing.total(order.withExtraItem(1)).subtotal())
        .isGreaterThanOrEqualTo(total.subtotal());
}

@Provide
Arbitrary<Order> order() {
    return Combinators.combine(
            Arbitraries.integers().between(1, 50),
            Arbitraries.longs().between(0, 5_000_000),
            Arbitraries.of(Tier.class))
        .as(Order::of);
}
~~~
Three things to watch:
- **Separate property from example**: property must be mathematically true, or you will debug the property not the bug.
- **Generator must create hard data**: if you only generate quantities 1–50 you never hit edge 0. Generate 0, negatives, very large values when business allows.
- **Slower than example tests**: 500 cases take a few hundred ms if logic is pure; heavy logic should reduce {{tries}} in PR and increase in nightly job.

### Choosing the right property
| Property form | Business example | Why strong |
|---|---|---|
| Value-domain invariant | fee and total always non-negative | catches overflow, rounding errors |
| Equivalent to reference | tax by formula A matches algorithm B | catches rare branches |
| Round-trip | serialize then deserialize equals original | catches lost fields, wrong types |
| Monotonic | more items => subtotal not lower | catches discount logic errors |

### When it finds bugs example tests miss
- **Numeric edges**: free-shipping at 500,000 VND, but rounding before makes 499,999 miss threshold. Example with 1,000,000 never touches the edge.
- **Multi-parameter interaction**: only 5 boolean flags = 32 combinations; examples usually pick 3 "pretty" ones.
- **Division/rounding algorithms**: allocating amounts to multiple parties must sum correctly; off by 1 VND is serious.
- **String parsing**: "1.000.000" and "1000000" must yield same result; Vietnamese users often type thousand-separator.
- **BigDecimal**: scale and {{RoundingMode}} errors only appear with many decimal digits.

### Common pitfalls
- **Wrong property for business** ⇒ continuous red and team starts ignoring. Example: "adding items does not reduce total" sounds right but fails when order crosses free-shipping threshold. Conversely, weak property is also dangerous: comparing with {{Set}} misses duplicates or missing elements — must compare as multiset.
- **Using {{Assume.that}} too much** ⇒ most cases filtered, test runs fast but meaningless.
- **Not reproducible failure** ⇒ jqwik prints seed in report on failure; rerun with {{@Property(seed = "...")}}. By default jqwik saves failure cases to {{.jqwik-database}} and reruns them first next time.

> Senior tip: property-based testing is a **bomb detector**, not a safety net. Do not expect it to replace example tests — use it to **generate failing cases**, then convert the failing case into a fixed example test in the main suite. The suite will then be fast, stable, and not miss edges.`,
    follow: [
      'For which algorithms or domains do you prefer property-based over example-based?',
      'How do you balance tries and execution time when property tests become slow?',
      'What do you do when a property fails but the example you think is correct actually reveals the property was wrong?'
    ]
  }
});
