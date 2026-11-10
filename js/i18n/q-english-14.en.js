/*
 * English translation of js/data/q-english.js — task T742. Format: js/core/i18n.js (content overlay).
 * ids: english-123 english-124 english-125 english-126 english-127
 */
App.i18n.content({
  'english-123': {
    q: 'Why would you choose Playwright over Selenium for a new UI automation project? When might Selenium still be the right choice?',
    a: `**Summary:** Playwright is often suitable for new projects because of **auto-waiting** (automatically waiting for elements to be ready), its modern architecture, strong parallelism, and convenient debugging (trace/video). Selenium is still reasonable when specific browser/legacy support is needed, the team has a large investment in Selenium Grid/infrastructure, or the organization has tooling constraints. A strong answer compares by **context**, not declaring one tool "wins absolutely".

### What — where do Playwright and Selenium differ?
- **Selenium** (older, very popular) drives the browser through the WebDriver protocol. Each action is usually a separate request; waiting for elements to stabilize or handling timing sometimes requires writing your own waits.
- **Playwright** (Microsoft, more modern) communicates with the browser through a stronger control channel and has built-in **auto-wait**: before clicking/filling, it waits for the element to be visible, stable, and to receive events — reducing many timing errors.

Everyday analogy: Selenium is like driving a manual car — you control many steps but can make mistakes if you miss the clutch/throttle timing. Playwright is like having automatic gear assistance in many situations — you still need to drive well, but fewer small mistakes.

### Sample answer (90 seconds)
"For a new UI automation project, I would usually choose Playwright.

The main reason is reliability. Playwright has built-in auto-waiting, so actions wait for elements to be visible and actionable. That reduces a common source of flaky tests caused by timing issues. It also supports modern web features well, handles multiple tabs and contexts easily, and gives strong debugging tools like traces, screenshots, and videos.

From a team perspective, setup is straightforward, and parallel execution is easier to scale in CI. That helps us get faster feedback on pull requests.

That said, I would still consider Selenium in some cases. For example, if the organization already has a mature Selenium Grid, shared libraries, and reporting built around it, migrating everything may not be worth the cost immediately. Selenium can also be relevant when there are specific browser or legacy environment constraints.

So my decision is based on project context: for greenfield work, Playwright is often the better default; for existing ecosystems, I evaluate migration cost versus long-term benefits."

### Quick comparison table (can be spoken)
| Criterion | Playwright | Selenium |
|---|---|---|
| Auto-wait | Strong built-in, less manual waiting | Usually needs careful explicit/fluent waits |
| Debug | Trace viewer, video, screenshot convenient | Depends on extra tools/logging |
| Ecosystem | Newer, developing fast | Very large, long-standing docs and community |
| Legacy/enterprise | Good for modern web | Sometimes fits existing infra/constraints |
| Migration cost | High if deeply using Selenium | Low if already invested heavily |

### Useful vocabulary
- **auto-waiting**: mechanism that waits for conditions before acting.
- **greenfield project**: a project built from scratch with little legacy code/infra constraint.
- **migration cost**: cost of switching (time, risk, training, pipeline changes).
- **cross-browser testing**: testing across multiple browsers/channels.

### Common mistakes
- Over-criticizing Selenium ("Selenium is bad") — unprofessional; the interviewer may be using Selenium.
- Only saying "Playwright is faster" without saying where (setup, feedback loop, debugging).
- Ignoring team factor: a "better" tool the team cannot operate still fails.
- Not mentioning trade-offs: a senior answer always has conditions ("it depends").

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through STAR in order. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence about what you learned, because interviewers listen for growth. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for English interviews
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: If asked deeper, talk about **risk of migration**: run both frameworks in parallel for a while, pick a small pilot suite, measure flaky rate and execution time before expanding. A data-driven approach builds more trust than slogans.`,
    follow: [
      'How would you migrate an existing Selenium suite to Playwright safely?',
      'What kinds of tests are still better done at API or unit level instead of UI?',
      'How do you compare flakiness and execution time before and after choosing a tool?',
    ],
  },
  'english-124': {
    q: 'How do you handle flaky tests in an automation suite? Give a concrete approach you have used.',
    a: `**Summary:** A **flaky test** (a test that is unstable, passing sometimes and failing sometimes with no code change) erodes the team's trust in automation. A professional approach: **measure** (quarantine + track flaky rate), **classify root cause** (timing, data, environment, execution order, external dependency), **fix the root cause** (not just rerun), and set **rules** so flakiness does not spread. Rerunning can be a temporary signal, not a solution.

### What — what is a flaky test and why is it dangerous?
A flaky test gives different results across runs under the same expected conditions. Everyday analogy: a light switch that sometimes turns the light on and sometimes not — you do not know whether the bulb, wiring, or power is at fault; if you ignore it, you no longer trust the switch.

Danger because:
- Team starts ignoring failures ("probably flaky") → real bugs reach production.
- Pipeline slows due to reruns, merges get blocked.
- Maintenance cost rises, automation loses value.

### Sample answer (90 seconds)
"I treat flaky tests as a reliability problem, not just an annoyance.

First, I make them visible. We track flaky rate per test and quarantine repeatedly unstable tests so they do not block every pull request. But quarantine is temporary — each quarantined test gets an owner and a deadline.

Second, I classify the root cause. Common causes are timing issues, shared test data, environment instability, order dependency, or external services. I reproduce the failure using logs, traces, screenshots, and sometimes by running the test repeatedly in CI.

Third, I fix the root cause. For example, in one project a checkout UI test failed randomly because it clicked before a network call finished. Instead of adding a fixed sleep, we waited for the specific API response and a stable UI state. For another case, tests conflicted because they reused the same user account; we switched to isolated test data created per test run.

Finally, we added rules: no arbitrary sleeps, control external dependencies with mocks or stable test environments, and review flaky trends weekly. Over time, our flaky rate dropped and the team trusted the pipeline again."

### Step-by-step handling mechanism
1. **Detect**: tag/flaky history, run repeatedly (repeat) to confirm.
2. **Quarantine**: separate from the main gate but still run for monitoring.
3. **Diagnose**: read trace/log, check timing, data, network, parallelism.
4. **Fix**: correct wait conditions, isolate data, stabilize environment, mock dependencies.
5. **Prevent**: code review checklist, limit fixed sleeps, report trends.

### Cause → fix table
| Cause | Sign | Fix |
|---|---|---|
| Timing/race | Random failure, passes when run slowly | Wait for specific condition, auto-wait, no {{Thread.sleep}} |
| Shared test data | Fails under parallel/large suite | Create data per test, clean up after test |
| Environment | Fails by node/time of day | Stabilize image/env, check health before suite |
| Order dependency | Passes alone, fails when order changes | Each test independent, clear setup/teardown |
| External dependency | Fails due to payment/email/third-party | Mock/stub, contract test, stable sandbox |

### Common mistakes
- Rerunning until pass: hides real bugs and wastes CI resources.
- Adding long {{sleep}}: tests get slower but can still be flaky.
- Quarantining forever: a "test graveyard" — nobody fixes them.
- No owner: everyone knows it is flaky, nobody is responsible.

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through STAR in order. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence about what you learned, because interviewers listen for growth. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for English interviews
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: Talk about a **service level for the test suite** (e.g. flaky rate < 2%, PR suite < 15 minutes). With measurable targets, quarantine/fix/priority decisions become clear and easier to justify to managers.`,
    follow: [
      'When would you delete a flaky test instead of fixing it?',
      'How do you prevent flaky tests in code review?',
      'What is the difference between retrying a test and making it reliable?',
    ],
  },
  'english-125': {
    q: 'Tell me about a bug you caught with automation that saved a release. What happened, and what did you learn?',
    a: `**Summary:** This is a behavioral + technical question. Use the **STAR** structure (Situation, Task, Action, Result): release context → risk → which test found it → how you coordinated fix/verify → concrete result (avoided incident, saved time/money, protected customers). Emphasize both **business value** and the **process improvement lesson**.

### What — what does the interviewer want to hear?
They do not just want "there was a bug". They want to assess:
- Do you write tests at high-risk spots?
- Do you investigate and communicate clearly with developers/product?
- Do you turn a one-time save into a long-term improvement?

### Sample answer (90 seconds, STAR)
"Situation: In my previous team, we were preparing a release for an e-commerce checkout flow. The change looked small — it updated how discount codes were applied.

Task: As part of our release process, I was responsible for running and reviewing the automated regression suite for payment and promotion scenarios.

Action: During the CI run, an end-to-end API and UI test failed in a specific case: when a user applied a percentage discount and then changed the shipping method, the final total was recalculated incorrectly. I reproduced the issue locally, checked the logs, and narrowed it down to the order of recalculation. I reported it with clear steps, test evidence, expected versus actual totals, and the affected scenario. I also worked with the developer to add a focused test case around discount plus shipping changes.

Result: We fixed the bug before release, so customers were not charged the wrong amount. After that, we expanded our promotion regression matrix and added contract checks for pricing calculations. The main lesson for me was that high-risk business rules need targeted automation, not just happy-path coverage."

### Why is this story convincing?
- Has **business context** (checkout, charged wrong amount).
- Has **technical evidence** (CI, e2e/API+UI, expected vs actual, logs).
- Has **collaborative action** (did not throw the bug over the wall).
- Has **result + lesson** (improved test matrix/contract checks).

### Detailed example to give if probed deeper
- Test data: 10% discount code, shipping changes from standard to express.
- Expected: total = (subtotal - discount) + new shipping.
- Actual before fix: discount applied in wrong order or old value retained.
- Verification: rerun new test case + regression suite + edge cases (0%, 100% discount if business allows, multiple codes, address change).

### Useful vocabulary
- **caught a bug before release**: found a bug before shipping.
- **expected vs actual result**: expected result compared to actual.
- **reproduction steps**: steps to reproduce the bug.
- **regression matrix**: matrix of regression cases to check.
- **happy path**: ideal success flow; edge cases must be added beyond it.

### Common mistakes
- Too technical without **impact** (customer/revenue impact).
- Saying "automation found it" like magic without explaining how you designed that test.
- Blaming the developer: keep a neutral tone focused on product and process.
- Forgetting "lesson learned": interviewer wants to see you learn and improve.

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through STAR in order. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence about what you learned, because interviewers listen for growth. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for English interviews
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: Prepare 2–3 bug stories at different levels (UI, API, data). Pick the one matching the role you are applying for. For SDET, always include "how we prevented it from happening again" — that is what distinguishes a tester from a quality engineer.`,
    follow: [
      'How did you decide the severity of that bug?',
      'What would you do if the team wanted to release anyway?',
      'How do you choose which business flows deserve end-to-end automation?',
    ],
  },
  'english-126': {
    q: 'How do you work with developers to improve testability? Give a practical example.',
    a: `**Summary:** **Testability** (how testable something is) is how easily you can write stable, fast, meaningful tests for a system. An SDET works effectively with developers by proposing changes that are **small, concrete, and benefit both sides**: stable selectors, API/hooks to observe state, logs/trace IDs, separating business logic from UI, and easy test data setup. Avoid vague requests like "make it testable for me" — speak in terms of risk and cost.

### What — what does testability mean?
A feature has good testability when:
- There is a clear way to identify elements/state (not fragile CSS).
- You can set up the required data and conditions without complex manual steps.
- Errors have enough information to diagnose (logs, correlation ID).
- Important logic can be tested at unit/API level, not forced through UI.

Everyday analogy: machinery is easier to inspect when it has status lights and measurement ports; if everything is sealed, it is hard to know what broke.

### Sample answer (90 seconds)
"I see testability as a shared responsibility, so I try to collaborate with developers early, not after the feature is finished.

In practice, I bring specific problems and propose small changes. For example, in one project our UI tests were flaky because selectors depended on dynamic CSS classes. I discussed it with the frontend developer and we agreed to add stable {{data-testid}} attributes for key actions like login, submit order, and apply coupon. That made selectors clearer and reduced maintenance when styles changed.

Another example was an order-processing feature where the UI only showed a spinner for a long time. It was hard to know whether the backend was still processing or already failed. I suggested exposing a clear status through the API and adding a correlation ID in logs. That helped both automation and production debugging.

I try to keep the conversation practical: I explain the risk, show how the change reduces flaky tests or debugging time, and keep the request small. When developers see that testability also helps them troubleshoot issues faster, collaboration becomes much easier."

### Effective collaboration steps
1. **Join early**: review acceptance criteria/design, ask "how do we know the feature is right/wrong?"
2. **Bring evidence**: point out which tests are flaky/slow due to missing observation hooks.
3. **Propose small changes**: 1–2 high-value changes ({{data-testid}}, API status, seed data).
4. **Agree on standards**: coding guideline for selectors, logging, error codes.
5. **Measure results**: reduced test fix time, reduced flakiness, faster debugging.

### Testability suggestion table
| Problem | Impact | Suggest to dev |
|---|---|---|
| Selector changes with CSS | UI tests break on style refactor | Add {{data-testid}} to key elements |
| Async state not observable | Must sleep/guess | Clear endpoint/state, loading/success/error |
| Errors lack trace ID | Hard to connect UI ↔ backend logs | Correlation ID across services |
| Hard to set up data | Slow tests, manual dependency | Stable test API/seed data/factory |
| All logic in UI | Must E2E test everything | Separate business logic for unit/API tests |

### Common mistakes
- Complaining "dev doesn't support testing" without concrete examples and benefits.
- Requesting large changes late in the sprint: easily rejected.
- Focusing only on UI: testability also lives in API contract, logging, data setup.
- Not acknowledging dev benefits (prod debugging, faster bug reproduction).

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through STAR in order. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence about what you learned, because interviewers listen for growth. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for English interviews
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: Use the phrase "shift-left collaboration" (collaborating early in the development cycle) but explain it simply. A testability suggestion accepted before coding is done is often many times cheaper than patching flaky tests after release.`,
    follow: [
      'How do you convince a developer who says test IDs pollute production code?',
      'What testability improvements help the most for API testing?',
      'How do you balance asking for test hooks with keeping the product code clean?',
    ],
  },
  'english-127': {
    q: 'A new feature is about to be developed. How would you explain your test strategy to the team?',
    a: `**Summary:** A **test strategy** (overall testing plan) is a high-level plan: what to test, at which level, how, which risks to prioritize, who is responsible, and when quality is sufficient for release. Answer with a clear framework: understand the feature → identify risks → choose test levels (unit/integration/API/UI/E2E) → data/environment → automation in CI → entry/exit criteria.

### What — how is test strategy different from test plan/test case?
- **Test strategy**: overall direction, usually stable per product/team.
- **Test plan**: specific plan for a feature/release (scope, schedule, resources).
- **Test case**: detailed steps for one scenario.

Everyday analogy: traveling — strategy is choosing safe transport, budget, priorities; plan is the day-by-day itinerary; test case is each task on the morning of day 1.

### Sample answer (90 seconds)
"For a new feature, I start by understanding the user flow, acceptance criteria, and the main risks. I ask: what could break business value, data correctness, security, or user experience?

Then I define the test scope by layers. I encourage unit tests for business logic, integration or API tests for service behavior and contracts, and a small number of UI end-to-end tests for critical user journeys. The goal is fast feedback and good coverage without making the suite slow and flaky.

I also plan test data and environments early. We need clear preconditions, realistic edge cases, and stable dependencies. If the feature depends on external services, we may use mocks or sandbox environments where appropriate.

For automation, I include high-value scenarios in CI: smoke tests on pull requests and broader regression tests on scheduled runs. I align with developers and the product owner on entry and exit criteria — for example, critical defects fixed, key tests passing, and known risks documented.

Finally, I keep the strategy practical: it should help the team make a confident release decision, not produce paperwork."

### Step-by-step framework (use when speaking)
1. **Clarify**: feature goal, acceptance criteria, main/exception flows.
2. **Risk assessment**: high risks (money, permissions, data, integration).
3. **Test levels**:
   - Unit: small, fast logic.
   - Integration/API: DB, service, contract, business errors.
   - UI/E2E: 1–3 critical end-to-end flows.
4. **Non-functional (if relevant)**: performance, security basics, accessibility.
5. **Data & environment**: edge data, user roles, sandbox/mock.
6. **Automation & CI**: what runs on PR, what runs nightly/release.
7. **Exit criteria**: critical tests pass, serious defects handled, remaining risks accepted deliberately.

### Priority table by risk
| Area | Risk | Preferred test level |
|---|---|---|
| Business rule (price, discount, permission) | Wrong data/money | Unit + API + a few E2E |
| External service integration | Timeout, wrong contract | Integration/API contract, mock/sandbox |
| Main UI workflow | User cannot complete | Selective E2E |
| Validation/input | Data errors, security | Unit/API with edge cases |

### Useful vocabulary
- **acceptance criteria**: conditions for the feature to be considered done.
- **test pyramid**: idea of many fast low-level tests, few slow high-level E2E.
- **entry/exit criteria**: conditions to start/end a testing phase.
- **risk-based testing**: prioritizing tests by risk/impact.

### Common mistakes
- Saying "test everything": not realistic, wastes time.
- Only UI E2E: suite slow, flaky, late feedback.
- Ignoring test data and external dependencies: plan looks good but cannot run.
- Not stating release criteria: team does not know what "good enough" means.

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through STAR in order. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence about what you learned, because interviewers listen for growth. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for English interviews
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: When presenting strategy, state the **trade-off** explicitly: you choose fewer E2E but cover business logic well via API/unit for fast feedback. A strong SDET does not just find bugs — they help the team make evidence-based release decisions.`,
    follow: [
      'How do you decide which scenarios must be automated before release?',
      'What would you do if there is not enough time to test everything?',
      'How do you include performance or security checks in a lightweight way?',
    ],
  },
});
