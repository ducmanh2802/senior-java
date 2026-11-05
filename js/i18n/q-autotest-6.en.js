/*
 * English translation of js/data/q-autotest.js — task T748. Format: js/core/i18n.js (content overlay).
 * ids: autotest-042 autotest-043 autotest-044 autotest-045
 */
App.i18n.content({
  'autotest-042': {
    q: 'When reviewing test code (E2E/API), which signals tell you the test is low quality? Talk about weak asserts, fixed sleeps, dependence on execution order, and how to fix them.',
    a: `**Summary:** A low-quality test burns run time but delivers little confidence: it can be **falsely green** (it passes even though the feature is broken) or **falsely red** (flaky). The usual signals are **weak asserts** (not checking what actually matters), **{{Thread.sleep}}/fixed waits** (slow and brittle), **order dependence** (test B only passes if test A ran first), plus fragile locators, shared state, and tests that do far too much. Reviewing test code means asking two questions: "if a real bug appeared, would this test go red?" and "when it goes red, does it explain itself?".

### Real scenario
A PR adds 15 UI tests and the pipeline is sometimes green, sometimes red. Reading the code you find: many {{Thread.sleep(5000)}}, asserts that only check the page "did not return HTTP 500" without checking any business content, and {{testCreateOrder}} leaves behind state that {{testPayOrder}} silently depends on. The result is a suite that is both slow and blind to the regressions that actually matter.

### Signal 1: Weak assertion
A weak assertion is a claim that is too general and is not tied to the business outcome you are trying to protect. An assertion (a statement in the test that a value must be X) only has value when X is the business fact you care about.

Weak example:
~~~java
// You only learn the page loaded, not that the order was created correctly
String title = page.title();
org.junit.jupiter.api.Assertions.assertNotNull(title);

// Or checking only HTTP 200 without checking the body
org.junit.jupiter.api.Assertions.assertEquals(200, res.status());
~~~

Stronger version:
~~~java
// Check the actual business signal
com.microsoft.playwright.assertions.PlaywrightAssertions
    .assertThat(page.getByTestId("order-status")).hasText("CREATED");
org.junit.jupiter.api.Assertions.assertEquals("SKU-123",
    res.json().get("items").get(0).get("sku").asText());
~~~

Principle: assert on **concrete business values** (the right id/status/amount/message) at a stable observation point.

### Signal 2: {{sleep}} / fixed waits
{{Thread.sleep(3000)}} assumes "after three seconds it is certainly finished". On a slow machine or a loaded CI server the work is not finished yet, so the test goes red; on a fast machine you waste 2.9 seconds on every single run. With Playwright, prefer its built-in auto-wait and wait on an explicit condition or signal (see {{autotest-032}}).

~~~java
// Weak: blind wait
Thread.sleep(3000);
page.locator("#status").textContent();

// Better: wait on an explicit condition (for example URL or status element)
page.waitForURL("**/orders/*");
com.microsoft.playwright.assertions.PlaywrightAssertions
    .assertThat(page.getByTestId("order-status")).hasText("CREATED");
~~~

Rare exception: a few special integration cases have no observable signal at all — but then you must document the reason in the code and keep the delay at the minimum; always look first for an alternative signal.

### Signal 3: Dependence on execution order
An order-dependent test means a later test is only correct because an earlier test created or changed data. JUnit may run tests in a different order, run them in parallel, or run one single test in isolation after a failure — and then everything breaks.

~~~java
// Weak: state shared implicitly through a field/static
static String createdOrderId;
@Test void t1_create() { createdOrderId = createOrder(); }
@Test void t2_pay() { pay(createdOrderId); } // fails when run alone
~~~

The fix: each test sets up whatever it needs (arrange) inside its own scope (setup/fixture/helper), or you merge the steps into one scenario when they are genuinely steps of a single flow.

### Other low-quality signals
| Signal | Why it is bad | Direction of the fix |
|---|---|---|
| One test checks 10 unrelated things | Impossible to tell which one failed, hard to maintain | Split by behavior; each test has one clear goal |
| Catching every exception and then passing | Hides real errors | Catch only the expected exception, assert specifically |
| {{Thread.sleep}} instead of a conditional wait | Slow + flaky | Wait on URL/response/locator state |
| Hard-coded data that collides with other tests | Red under parallel runs or a shared CI | Isolated data, unique ids |
| Locators bound to fragile CSS | Breaks when the UI changes | Role/test id ({{autotest-032}}) |
| Large copy-pasted blocks between tests | Fixes never stay in sync | Deliberate helpers/POM/builders ({{autotest-031}}) |

### Quick review checklist
1. Which **behavior** does this test protect? Does the assert actually prove that behavior?
2. Is there a **sleep** or any blind wait? Can it be replaced by a condition?
3. Does the test pass **on its own** (and under parallel execution)?
4. When it goes red, do the message/trace help you find the cause?
5. Does it leak secrets/PII into logs or test data ({{autotest-037}})?

### How to answer in an interview
Name the three core signals (weak assert, sleep, order dependence), each with a short "weak → better" example and the reason. Extend with two or three more signals (shared state, tests that are too large) and close with the review checklist. Show the mindset: a test is a maintenance asset, and test quality directly determines how much people trust a release.

> Senior tip: Guess the quality of a suite with one question: "how many of the red tests are real bugs, and how many are the test's own fault?" If the false-red rate is high, the team stops believing the pipeline — and at that point adding new tests only increases bad debt. Fix weak asserts and blind waits before you increase the test count.`,
    follow: [
      'How do you distinguish "one test with many asserts" (several checks of the same behavior) from "one test doing many things" (several behaviors)?',
      'When you discover order-dependent tests in a large suite, how do you plan the decoupling so that the change itself stays low-risk?',
      'How do you write assert messages/logs clear enough that an on-call reading a CI result understands immediately?'
    ]
  },
  'autotest-043': {
    q: 'How do you manage the version (release/version history) of test code together with application code? Compare a monorepo (one shared repository) with a separate test repository, and when do you pick which?',
    a: `**Summary:** Automation test code is source code: it needs version control (Git), review, CI, and a binding to the application version it is checking. Two models dominate: **monorepo** (tests live in the same repository as the application code) or a **separate test repository**. A monorepo lets an API change and the test update travel in one PR and stay easy to synchronize; a separate repo can split ownership and release cadence but drifts out of sync easily ("the test repo is still testing the old API"). The choice depends on team structure, service boundaries, and your ability to keep things synchronized. Whichever model you pick, you need conventions: which test runs against which version, who owns it, and which pipeline blocks a merge.

### Original terms
- **Version control**: the system that records the change history (Git). "The version of tests together with code" means knowing that at commit/tag X these tests are compatible with that application build.
- **Monorepo** (mono repository): one Git repository containing many modules/projects (for example {{services/order}}, {{services/user}}, {{e2e-tests}} in the same repo).
- **Separate repo**: application code in repo A, automation code (especially cross-system E2E) in repo B.

### Monorepo: tests live with the code
~~~text
repo/
  services/order/        (order code + its unit/integration tests)
  services/user/
  e2e/                   (Playwright/RestAssured for cross-service flows)
  .github/workflows/     (CI runs only the affected part)
~~~

Advantages:
- **Synchronized change in one PR**: you change the {{POST /orders}} response → you update the contract/test in the same PR → CI validates both at once, which avoids the window "new app, old tests".
- **Code reuse**: sharing models/builders/helpers is easier (you still need to manage boundaries).
- **Linked history**: {{git blame/bisect}} connects an application change with the test change made next to it.

Downsides: the repo is large, CI has to be smart (run only the affected part) or everything slows down; access rights are more uniform.

### Separate test repo
~~~text
repo-app-order/    (unit/integration inside the service)
repo-app-user/
repo-e2e/          (E2E across many services, run on a schedule/trigger)
~~~

Advantages:
- Clean ownership split (the QA/SDET team owns the E2E repo), separate access rights.
- E2E can run on its own cadence (nightly) against an integration environment.

Downside (the biggest one):
- **Version drift**: the app is deployed with changes but the E2E repo was not updated → mass failures, or (worse) false greens because the test no longer checks the right thing.
- Cross-repo PR coordination is hard: you need a trigger convention (run E2E from repo B against the image/commit of app repo A).

~~~seq
title: Version-drift risk when tests live in a separate repo
actors: App repo | Deploy | E2E repo | CI
App repo -> Deploy: merge the /order API change
Deploy -> CI: deploy the new version
CI -> E2E repo: run the E2E suite (still on the old test code)
E2E repo --> CI: failure from a contract mismatch, or false green from weak asserts
~~~

### Selection criteria
| Criterion | Leans monorepo | Leans separate repo (with discipline) |
|---|---|---|
| Unit/integration of one service | Always in the service repo | Rarely split out |
| E2E inside one product/team | Convenient | Needs a version-pinning mechanism |
| E2E across several independent products/teams | Can be its own module in a large monorepo | Can be a separate repo with a clear contract |
| Strict access-separation requirements | Harder | Easier |
| Selective CI (affected tests) | Requires investment | Each repo has its own CI |

### Practices that keep versions in sync (any model)
- **Unit/integration**: always sit next to the service code, run in that service's CI, and block the merge when they fail.
- **Contract tests**: store/verify them bound to the consumer/provider version (a Pact broker or a versioned artifact) so you know exactly which versions are compatible.
- **Cross-service E2E**: bind the run to the **version/tag** of the environment under test (run E2E as a "reconciliation" against a specific deployment) and record {{appVersion}} in the report.
- **Branch/tag**: tag every release; re-run tests on the tag to reproduce a result.
- **Ownership**: whoever breaks a test (or the team that owns that module) is responsible for fixing it — avoid "someone's E2E repo" that nobody takes care of.

### Common mistakes
- Keeping E2E in a separate repo with no mechanism to run it against the app version just deployed → silent drift.
- A monorepo where CI runs the full two hours on every PR because there is no affected-test selection → the team switches tests off.
- Nobody owns the tests: red for weeks, eventually ignored.

### How to answer in an interview
Compare the two models along the axes of change synchronization, ownership, CI cost, and version-drift risk. Give a pragmatic recommendation: unit/integration always travel with the service; E2E prefers to sit close to the code (monorepo or a disciplined module) and must be bound to the version under test. Emphasize mechanisms (CI gate, contracts, tags) rather than model dogma.

> Senior tip: The question is not only "which repo holds the tests" but "how a change that breaks a contract gets blocked before deployment". A separate repo where the app CI is required to run the matching versioned E2E suite still achieves the goal; a monorepo where E2E is always skipped does not. The synchronization mechanism matters more than the repository address.`,
    follow: [
      'With contract tests (Pact), how do you store contracts and pick which contract version to verify between services?',
      'How do you design monorepo CI so it runs only the tests affected by the changed code?',
      'When a separate E2E repo has to test an urgent app hotfix, what is the version-coordination process?'
    ]
  },
  'autotest-044': {
    q: '(Lead) How do you persuade the dev team to write tests and split quality responsibility between devs and QA? When the team is busy shipping a release, how do you keep that commitment?',
    a: `**Summary:** Persuading devs to write tests is not "making them do extra work" but changing how the team works in order to **reduce the cost of fixing bugs late** and to raise sustainable release speed. In the lead role you use data (leaked bugs, fix duration, incidents), you start small (tests for new code / the bug just fixed), you make writing tests **easy** (templates, examples, fast CI), and you split responsibility clearly: **devs own the unit/integration tests of their own part** (quality built into the code), while **QA/SDET** focus on test strategy, product risk, selective E2E/contract work, tooling and coaching — not being the "single inspection gate" at the end of the sprint. When the release is busy, you keep the commitment with a minimum of non-negotiable rules (a test for every bug fix, CI never switched off) and by cutting scope reasonably instead of cutting invisible quality.

### Real scenario
A team of 8 devs and 2 QA. Every sprint piles on features, manual testing happens at the end of the iteration, production leaks 5-8 bugs per month, hotfixes take 30% of the time. QA is overloaded, devs say "there is no time to write tests". The lead's goal: move gradually toward "quality is a shared responsibility" without paralyzing delivery.

### Why devs should write tests (arguments backed by data)
- **Fast feedback**: unit/integration tests run in minutes and tell you whether a change broke the logic, much faster than waiting for a manual QA round.
- **Bug cost grows with time**: a bug found locally/in CI is far cheaper than one found in staging/production (investigation, hotfix, user impact). Quote internal numbers: hotfix hours per month, incident count, rollback duration.
- **Safe refactoring**: with tests, devs dare to refactor; without tests the code "freezes" because nobody dares to touch it.
- **Living documentation**: tests describe the expected behavior (especially edge cases) better than stale comments.

Framing the conversation: no blame ("QA missed it"), but talk about **the system** ("we are paying a late fee for every bug; a test is the early, cheaper fee").

### Splitting dev / QA responsibility (the spirit of RACI, not dogma)
| Item | Dev | QA/SDET | Note |
|---|---|---|---|
| Unit tests of business logic | **Owns, writes** | Review/coaching | Sits with the code, runs fast |
| Integration tests inside the service (DB, mapping) | **Owns** | Supports with patterns/tools | Typically Testcontainers |
| Contract tests at service boundaries | Shared ownership (consumer/provider) | Coordinates the conventions | Prevents integration breakage |
| E2E of critical flows | Contributes | **Leads the strategy**, keeps the suite small and stable | Avoid QA hoarding all E2E |
| Risk-based test plan, exploratory testing | Participates | **Leads** | The part a machine cannot replace |
| CI, flakiness, tooling | Supports | **Leads** (SDET) | Platform for the whole team |
| Release go/no-go decision | Shared responsibility | Shared responsibility | Based on signals, not gut feel |

Principle: QA is not "the person who presses the button instead of the dev" but the **risk and test-engineering expert** who raises the capability of the whole team.

### How to persuade and roll this out (start small)
1. **Pick a pain point that has numbers**: the three bug types that kept recurring recently → propose "every bug fix ships with one reproducing test".
2. **A clear minimum convention**: for example "a PR that changes logic must add/adjust a test; a bug fix must add a regression test". Put it into the Definition of Done.
3. **Make it easy**: test templates, examples in the repo, helpers/builders, CI that runs the relevant part fast. Reducing friction beats issuing orders.
4. **Pairing/coaching**: the SDET pairs 30-60 minutes with a dev when adding the first test for a hard module.
5. **Celebrate progress**: track leaked bugs going down and hotfix time going down; share the specifics without turning it into a hunt for "coverage %".

~~~seq
title: The pragmatic change loop
actors: Lead | Dev | QA/SDET | CI
Lead -> Dev: minimum convention + examples + goal (a test with every bug fix)
Dev -> CI: PR shipped with tests (unit/integration)
QA/SDET -> Dev: coaching/pairing, review of test strategy
CI --> Lead: signals (pass/flaky/duration, leaked bugs tracked)
~~~

### When the release is busy: how to keep the commitment
- **The minimum is not negotiable**: a test for bug fixes/hotfixes (prevents recurrence), existing CI gates are never switched off "temporarily". "Temporary" usually becomes permanent.
- **Cut scope, not invisible quality**: reduce the number of features in the release, or reduce E2E depth for low-risk features — but never drop all tests for what you ship.
- **A risk-tiered verification set**: smoke + tests for the changed area + the relevant contracts are mandatory; the long full regression runs nightly/in parallel and does not block a hotfix once the lower tiers give evidence.
- **Timebox the test debt**: if you truly must borrow (rare), open a ticket with an owner and a deadline inside or right after the release, so it does not drift away.
- **Transparent risk**: shipping with missing coverage must be a deliberate decision (risk acknowledged and recorded), not an oversight.

### Common mistakes
- Imposing a top-down {{coverage 80%}} target → devs write ceremonial tests with weak asserts ({{autotest-042}}).
- QA stays the "single gate" → devs learn nothing, the bottleneck does not move.
- Under release pressure you dismiss a red CI "to get through" → discipline breaks and the signal loses its value.

### How to answer in an interview
Argue with cost/feedback data (with numbers), present the shared responsibility model (devs own the lower layers, QA/SDET lead strategy/risk/tooling), and the incremental rollout (start from bug fixes/regressions). For release pressure: keep the non-negotiable minimum, cut scope, use risk tiers, and manage test debt transparently.

> Senior tip: The lead's goal is not "forcing devs to write more tests" but making **safe release the easiest default path**. When CI is fast, templates are ready, and a small convention is consistently honored, the right behavior outlasts any speech about quality.`,
    follow: [
      'How do you respond when a dev says "my code is simple, it does not need tests"?',
      'How do you measure progress of the quality culture without relying on raw coverage?',
      'In a production crisis, how do you balance a fast hotfix against keeping test discipline?'
    ]
  },
  'autotest-045': {
    q: '(Lead) Lay out a 6-month roadmap taking automated regression coverage (a regression being an old bug coming back) from 10% up to 70%. How do you split the phases, measure, and manage risk?',
    a: `**Summary:** Growing regression automation from 10% to 70% in six months is a goal that is **reachable if the scope is defined and the metric is right**. As lead you need to: (1) define "regression that is automated" against a catalog of test cases/risks (not a blind test count), (2) build a baseline and choose the priority case set (by bug frequency, revenue/business impact, usage frequency), (3) split the roadmap into phases (foundation → prioritized coverage → stabilization/scale) with monthly targets, (4) invest in anti-flaky work and CI that is fast enough, (5) track leading indicators (flaky rate, CI duration, defect leakage) and not only the coverage percentage. The big risks: measuring the wrong thing, automating low-value cases, and a slow/flaky suite that destroys the team's trust.

### Real scenario
A web product (Java backend, web UI). Today there are roughly 300 manual regression cases and about 30 automated ones (an estimated ~10% of the defined regression case set), and the pass takes 2 person-days per release. Six-month goal: about 70% of the important regression cases automated, running in the pipeline with a trustworthy signal.

### Step 0: definition and baseline (before promising 70%)
- **Regression test** (regression testing): checking that an existing feature still behaves correctly after a change. "Automated" means an executable, stable automated test that runs in CI/on a defined schedule and asserts something meaningful (not a falsely green script).
- **Draw the scope**: build a deliberate catalog of regression cases (or behavior groups), separating "smoke", "core regression", "rare edge cases". The 70% should be computed over the **core/valuable regression** set, not by forcing rare exploratory manual cases into poor automation.
- **Baseline**: number of stably automated cases / total target cases; run duration; flaky rate; bugs leaked after the most recent release.

### The 6-month roadmap (phased proposal)
| Phase | Timeframe | Main objective | Deliverables |
|---|---|---|---|
| 1. Foundation | Month 1 | Pick tooling (Playwright Java for UI, RestAssured/Testcontainers for API/integration), project skeleton, POM/data conventions, CI running smoke | Test repo, pipeline, 10-15 stable smoke cases, review conventions ({{autotest-042}}) |
| 2. High-priority coverage | Months 2-3 | Automate high-revenue/high-risk flows (login, ordering, payment, authorization) following the test pyramid (API/integration first) | +40-60% of core cases, reporting (Allure) + debug artifacts ({{autotest-035}}) |
| 3. Controlled expansion | Months 4-5 | Add mid-tier cases, handle i18n/selected edge cases, parallelize and optimize duration ({{autotest-041}}) | Reach ~60-70% of core cases, CI duration inside budget |
| 4. Stabilization and handover | Month 6 | Bring flakiness below the threshold, document, transfer ownership to the team ({{autotest-044}}), finalize how we measure | A sustainable 70%, a maintenance process, a deliberate backlog of the remaining cases |

(The %/case figures are an illustrative skeleton; the lead must recalibrate them against the real scale.)

~~~seq
title: The 6-month roadmap (summary)
actors: Lead | Team | CI
Lead -> Team: Month 1 foundation + smoke + conventions
Team -> CI: Months 2-3 automate the high-priority cases (API/UI)
Team -> CI: Months 4-5 expansion + parallelism + optimization
Lead -> Team: Month 6 flaky stabilization + ownership handover
CI --> Lead: continuous measurement (coverage, flaky, duration, leakage)
~~~

### Measurement (avoiding a "fake 70%")
- **Target regression coverage ratio**: % of cases in the core regression catalog that have stable automation. Report absolute numbers too: 210/300 core cases.
- **Signal quality**: flaky rate (failures not caused by a product bug), time from merge to result.
- **Actual outcome**: defect leakage (bugs reaching production in an automated area versus a non-automated one), regression cycle time per release.
- **Suite health**: run duration, share of tests in quarantine (should be close to 0).

Do not use: "number of tests" growing without a bound case, or line-of-code coverage as a proxy for business regression.

### Risk management
| Risk | Signal | Mitigation |
|---|---|---|
| Automating the wrong priority | Many tests but bugs still leak in money flows | Select cases by risk/impact, review with PO/QA |
| Flaky suite, slow CI | The team reruns or ignores | Fight flakiness from day one ({{autotest-032}}, {{autotest-035}}), a time budget, controlled parallelism |
| Maintenance debt | Tests break in bulk when the UI changes | POM/robust locators, quality review, clear ownership |
| Skill gap | Slow progress, weak tests | Pairing, templates, Playwright/Testcontainers training, smaller monthly targets |
| A 70% promise on the wrong scope | Target hit but useless | Freeze the baseline definition + case catalog in month 1 |

### Resourcing (realistic)
- Reserve fixed capacity every sprint (for example 20-30%, or one dev+SDET pair) instead of "doing it when free".
- Couple it with feature work: a new or high-risk feature ships with automation of the related regression cases.

### How to answer in an interview
Start with the definition plus the baseline (measure the right thing). Present the four phases with monthly milestones, emphasizing foundation and stabilization (do not charge into mass test writing). Name the metrics (target coverage, flaky, CI duration, leakage) and two or three main risks with mitigations. Show lead thinking: business outcomes (leaked bugs, release speed) matter more than one isolated percentage.

> Senior tip: "70%" only means something when it is bound to an **agreed case catalog** and those tests are **trustworthy**. A 70% suite that is 15% flaky is worse than a 40% suite that is stable. Set a stop rule for expansion: if flakiness crosses the threshold, switch the sprint to stabilization before adding any new case.`,
    follow: [
      'To reach 70% safely, which do you automate first: UI E2E cases or API/integration cases? Why?',
      'When the business changes priorities mid-way (month 3), how do you adjust the roadmap and the 70% target?',
      'Which regression cases do you deliberately NOT automate and keep manual/exploratory?'
    ]
  }
});
