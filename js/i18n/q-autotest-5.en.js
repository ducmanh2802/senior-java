/*
 * English translation of js/data/q-autotest.js — task T747. Format: js/core/i18n.js (content overlay).
 * ids: autotest-036 autotest-037 autotest-038 autotest-039 autotest-040 autotest-041
 */
App.i18n.content({
  'autotest-036': {
    q: 'In a microservices architecture (many small services talking to each other over the network), at which service level do you test? What does an ephemeral environment (a temporary one, created per PR – Pull Request, a request to merge code) buy you, and what do you have to watch out for?',
    a: `**Summary:** Microservices (an architecture that splits an application into many small, independent services that talk over HTTP/gRPC or messages) make "testing the whole system" expensive and brittle. The pragmatic approach is to layer: **unit tests** inside each service, **integration tests** wired to that service's own DB/broker (usually with Testcontainers – a library that starts temporary containers), **contract tests** that check the API/message agreement between two services without running both of them, and only a small number of cross-service **E2E** tests for the flows that really matter. A **per-PR ephemeral environment** is a test environment created automatically for each PR and destroyed when the PR closes – it lets you test closer to reality and isolates your change, but you have to control cost, data and start-up time.

### The real situation: why "full stack" testing never settles down
A commerce system has 6 services: gateway, user, catalog, order, payment, notification. If every PR in order builds all 6 services + 3 DBs + Kafka (a message queue system) + Redis (a fast in-memory cache) on one shared environment, you get: tests waiting on each other, junk data left over from other PRs, another service mid-deploy turning your tests red. Result: the team stops trusting the tests.

### Which service level do you test at
| Level | Scope | Goal | Suggested tooling (Java) |
|---|---|---|---|
| Unit | One class/function inside a service | Correct logic, fast (ms) | JUnit 5, Mockito |
| Integration (inside a service) | Service + its real DB/broker (isolated) | Mapping, queries, configuration that actually runs | Spring Boot Test, Testcontainers (temporary Postgres/Kafka containers) |
| Contract | The communication boundary between consumer and provider | An API/message change does not break the other side | Pact (consumer/provider), Spring Cloud Contract |
| Component / service-in-isolation | One service running, external dependencies faked | The service's HTTP flow is correct | WireMock/MockServer to fake external APIs, Testcontainers for the DB |
| Cross-service E2E | A few services working together (few flows) | The important end-to-end business journey | Playwright for UI, RestAssured for API, run on a controlled integration environment |

Rule of thumb (not an absolute law): the more tests at the low levels (fast, stable), the fewer at the top. Pyramid shape: many unit, a moderate amount of integration, few E2E.

### What a contract test is (from scratch)
**Contract testing** is like two sides signing an agreement: "I (the order service, the consumer) will call {{GET /users/:id}} and expect the fields {{id, name, status}}". A contract test turns that agreement into an automated check. The consumer generates a contract file from its own expectations; the provider runs a verification of that contract **without** the consumer having to run at the same time. So when the provider changes its response (for example drops the {{status}} field), the provider's CI goes red before the deploy – even though the order service was never started.

~~~text
Consumer (order)                Provider (user)
  writes expectation  --generates-->  contract.json  --verifies-->  provider CI fails on a breach
  (no need to run user)                          (no need to run order)
~~~

### The per-PR ephemeral environment
An **ephemeral environment** is a temporary one: when a PR is opened, the pipeline (CI/CD – the automated build/test/deploy process) creates an isolated deployment (usually a temporary Kubernetes namespace, or docker-compose on the runner), runs migrations, seeds a minimal dataset, then runs smoke/E2E against that temporary URL. When the PR merges or closes, everything is destroyed.

~~~seq
title: Ephemeral environment per PR
actors: Dev | CI | Cluster | Test Runner
Dev -> CI: open/update PR
CI -> Cluster: create namespace pr-123, deploy the changed service
Cluster --> CI: return temp URL (https://pr-123.example.test)
CI -> Test Runner: run smoke/API/E2E against the temp URL
Test Runner --> CI: result (pass/fail + artifact)
CI -> Cluster: destroy namespace pr-123 when the PR closes
~~~

Benefits: isolation between PRs, testing closer to production than pure mocks, and reviewers get a link to click through themselves. Practical caveats:
- **Cost and quota**: every PR burns CPU/RAM/cluster capacity; cap the number of concurrent PR environments, destroy them automatically when idle, use lightweight images.
- **Start-up time**: starting a DB, running migrations and waiting for services to become healthy can take several minutes; consider running only smoke per PR and the full E2E nightly.
- **Data**: seed a minimal, deterministic dataset (do not use unmasked real production data – see {{autotest-037}}); reset cleanly every run.
- **External dependencies**: payment gateways, third-party email – usually mocked/stubbed at the boundary, otherwise the ephemeral environment stays brittle.
- **Security**: the temporary URL must not be exposed on an uncontrolled public endpoint; use test values for secrets, never production secrets.

### Common mistakes
- Treating contract tests as "optional" and relying only on E2E across 6 services → slow feedback, high flakiness.
- Building an ephemeral environment that is "almost complete" but sharing one DB with other PRs → data collisions, tests randomly red.
- Not setting a lifetime (TTL) on temporary namespaces → the cluster fills up after a few weeks.

### How to answer in an interview
State the pyramid per service level and explain that contract testing solves the cross-team coordination problem without integrating everything. For ephemeral: walk through PR → build → test → destroy, then name three caveats: cost/TTL, isolated seeded data, external dependencies that must be mocked.

> Senior tip: Do not chase "100% E2E". With microservices the goal is that each service can be deployed independently with confidence: contract tests keep the boundaries stable, in-service integration tests keep the core correct, and E2E only guards a few money/revenue journeys. Ephemeral environments are good leverage as long as you control cost and data.`,
    follow: [
      'What is the difference between a contract test (Pact/Spring Cloud Contract) and an integration test that uses WireMock, and which kind of bug does each one catch?',
      'When a PR only changes the UI, do you still build an ephemeral environment for the whole backend? How do you weigh that?',
      'How do you seed data for an ephemeral environment so that it stays fast and reproducible (deterministic)?'
    ]
  },
  'autotest-037': {
    q: 'How do automated tests work with sensitive data (PII – personally identifiable information, passwords, tokens)? When staging (the pre-production environment) uses production-like data, how do you apply masking (hiding/anonymising it)?',
    a: `**Summary:** Sensitive data (PII such as names, emails, phone numbers, ID document numbers; secrets such as passwords, tokens, API keys) **must not** leak into test code, the repo, logs, screenshots or CI artifacts. The principle: use **synthetic data** for most tests; when you are obliged to use "production-like" data on staging, you must **mask/anonymise** it (transform it so a real person is no longer identifiable) and control access. Automation has to be designed so it never accidentally prints or writes secrets (log filtering, turning off capture of sensitive headers in traces, using a secret manager).

### The core terms
- **PII** (Personally Identifiable Information): data that can identify a specific person (full name, personal email, phone number, address, ID document numbers). Everyday example: your phone's contact list is PII.
- **Staging**: an environment that closely mirrors production, used to test before the real release.
- **Masking/anonymisation**: replacing a real value with a fake one while keeping the shape and behaviour of the data (an email still looks like an email, a number still has the right length) so tests keep running meaningfully without exposing real people.
- **Secret**: a password, token or API key – if it leaks, someone can get into the system.

### Classifying the data used in tests
| Type | Example | Where to use | Risk |
|---|---|---|---|
| Synthetic | {{user+uuid@example.test}}, name "Nguyen Van A Test" | Unit, integration, most E2E | Low, as long as it is generated in the correct format |
| Masked from prod | Hashed email on a test domain, phone with digits replaced | Staging when you need realistic data distribution | Still risky if the masking is weak |
| Real production (unmasked) | A raw copy of the production DB | **Avoid** for everyday automation | High: PII exposure, policy/legal breach |

### Masking production-like data: step by step
1. **Identify the sensitive fields** (data classification): email, phone, address, account numbers, free-text notes (they can contain PII), tokens.
2. **Choose a masking strategy per field**:
   - Format-preserving fixed replacement: {{090xxxx123}} → {{090000000}} (keeps the length), or generate a valid-looking fake number.
   - A salted one-way hash for identifiers that must stay consistent across tables (the same fake user_id still matches the FK) but cannot be reversed back to a real person.
   - Null, or a sample value, for fields the test does not need.
   - Keep the **non-sensitive** data that matters for the logic (order status, money distribution) so the test still means something.
3. **Do it outside personal dev environments**: the job that builds staging from prod runs in a controlled area, only permitted roles can read the source; the output is an already-masked staging DB.
4. **Verify**: pattern scans (regex for email/phone/ID numbers), measure the share of fields that still hold real-looking values; automated tests must **not** assert on real PII.

~~~java
// Example of generating synthetic data inside a test (not taken from prod)
String email = "qa+" + java.util.UUID.randomUUID() + "@example.test";
String phone = "0900000" + (100 + new java.util.Random().nextInt(900));
~~~

### Protecting secrets in automation
- **Never hard-code** passwords/tokens in source. Take them from a **secret manager** or from environment variables supplied by CI. In code only read {{System.getenv("TEST_USER_PASS")}}.
- **Logs**: never print a token; the logger must be configured to hide sensitive patterns.
- **Artifacts** (trace/video/screenshot – {{autotest-035}}): they can contain a filled-in form with PII or an {{Authorization}} header. Mitigate: use dedicated test accounts, restrict recording of sensitive headers, review before sharing an artifact.
- **Repo**: enable secret scanning (gitleaks/git-secrets) in CI to block commits that leak keys.

### Trade-off table
| Approach | Pros | Cons | When to use |
|---|---|---|---|
| Fully synthetic | Safe, reproducible | May not match real data distribution | Default for almost every test |
| Masked from prod | Real distribution and rare edge shapes | The masking process is complex, residual risk remains | Staging for a few flows that need realism |
| Tightly controlled prod subset | Very close to reality | High legal/privacy risk | As rarely as possible, with explicit approval |

### Common mistakes
- Using a colleague's real email/phone in test data "because it is convenient" → PII ends up in the repo and in logs.
- Printing the whole response body, tokens included, into the test report.
- Assuming staging "is internal so it is fine" and restoring unmasked prod – staging usually has far more people with access than you think.

### How to answer in an interview
State the principle: synthetic by default, masked when you need production-like data. Explain that masking keeps formats and relationships (FKs) but removes identifiability. List the leak points that are specific to automation – code, logs, traces/screenshots, environment variables – and how each one is blocked.

> Senior tip: Treat test data as an asset with a lifecycle like code: who creates it, who may read it, how long it is kept, how it is destroyed. A PII leak through a CI artifact can be more serious than a red test. Automating the checks (secret scanning, PII pattern scanning in logs) is far cheaper than handling the incident.`,
    follow: [
      'How do you distinguish masking, pseudonymization (a fake that can be mapped back under control) and anonymization (irreversible) in a testing context?',
      'How do you keep a Playwright trace from recording the value of a password field or the Authorization header?',
      'When a test needs to verify an email/SMS OTP, how do you design it without using a real user mailbox or real phone number?'
    ]
  },
  'autotest-038': {
    q: 'Besides E2E, Playwright supports component testing and API testing. How do you combine them, and how do you mock the backend so the frontend (FE) can be tested independently?',
    a: `**Summary:** Not every UI check needs a real browser driving the whole system. **Component testing** mounts and checks one piece of UI in isolation; **API testing** calls HTTP endpoints directly to check the contract/response without any UI; **E2E** (end-to-end) walks a real flow from the UI down to the backend. To test the FE independently you **mock the backend** (fake the API responses) with {{page.route()}} (intercept requests inside the browser) or by pointing the FE at a fake API. A good combination: display and small interaction logic → component/API level; important business flows that cross layers → a selectively chosen set of E2E tests.

### The three levels (from scratch)
- **Component**: like testing "one part" (say the login form) detached from the whole machine. You pass props/state in and assert what renders and how it behaves. Faster than E2E because you do not need the full app plus a real backend.
- **API testing**: send an HTTP request (GET/POST/...) and assert status/body/headers. It checks the backend or a contract without drawing any UI. Playwright offers {{APIRequestContext}} to call APIs.
- **E2E UI**: open a real page, act like a user, going through FE + BE + DB.

### Quick comparison
| Level | Speed | Reliability | What it catches | Real backend needed |
|---|---|---|---|---|
| Component | Fast | High (isolated) | Rendering, local interaction, UI state | No (mocked props/callbacks) |
| API | Fast to medium | High | Status codes, schema, API business errors | Optional (or a mock server) |
| E2E UI | Slower | More flaky | Cross-layer flows, real integration | Usually yes |

### Combining them in practice (the strategy)
Example feature "place an order":
- Component: the address picker displays correctly, form validation works, the button is disabled while required fields are empty.
- API: {{POST /orders}} returns 201 with a valid body, 400 when {{itemId}} is missing, 409 when the item is out of stock.
- E2E: one flow "pick a product → pay → see the confirmation" on an integration environment (few cases, controlled data).

~~~seq
title: Layering FE and API tests
actors: Dev | Component test | API test | E2E (Playwright UI)
Dev -> Component test: check rendering/interaction in isolation
Dev -> API test: check endpoints and the contract
Dev -> E2E (Playwright UI): check the important cross-layer flow
Component test --> Dev: very fast feedback
API test --> Dev: fast feedback
E2E (Playwright UI) --> Dev: slower but closer to reality
~~~

### Mocking the backend to test the FE independently
Approach 1: **{{page.route()}}** in Playwright – intercept requests coming from the browser and return a fake response. Useful when a UI test needs an error scenario (500), or when the backend is not finished yet.

~~~java
page.route("**/api/profile", route -> route.fulfill(
    new com.microsoft.playwright.Route.FulfillOptions()
        .setStatus(500)
        .setContentType("application/json")
        .setBody("{\"message\":\"Temporary error\"}")
));
page.navigate("https://app.test/account");
com.microsoft.playwright.assertions.PlaywrightAssertions
    .assertThat(page.getByTestId("error-banner")).isVisible();
~~~

Approach 2: point the FE's API {{baseURL}} at a **mock server** (WireMock/MockServer). Advantage: the same stubs are reusable across test types.

Approach 3: API testing with {{playwright.request()}} ({{APIRequestContext}}) to call the backend directly.

~~~java
com.microsoft.playwright.APIRequestContext api = playwright.request().newContext();
com.microsoft.playwright.APIResponse res = api.get("https://staging.test/api/health");
org.junit.jupiter.api.Assertions.assertEquals(200, res.status());
~~~

### A note on Playwright component testing
Playwright does have component-testing capability (popular in the Node/JS world). With **Playwright for Java**, the practical focus is usually E2E UI + {{APIRequestContext}} + {{page.route}}; component tests of a FE framework (React/Vue) are normally run with that ecosystem's own tooling. When you answer, say it plainly: choose a component-testing tool suited to the FE stack, while Playwright (Java) is strong at E2E and browser-level integration testing.

### Common mistakes
- Mocking every API inside an E2E run and then declaring "the system works" – in fact you only proved that the FE renders against fake JSON.
- A {{route("**/*")}} pattern that also blocks static assets → a blank page; intercept only the endpoints you actually need.
- Using API tests instead of UI tests for flows that contain browser-level logic (redirects, cookies, visible CORS behaviour).

### How to answer in an interview
Explain the purpose of each level and the criteria for choosing between them. Mention {{page.route}} for deliberate mocking (error cases, backend not ready yet) and stress keeping a small E2E set that runs against the real integration stack. Show that you understand the trade-off: isolation is fast but can drift from reality.

> Senior tip: Before writing an E2E, ask "which layer catches this bug most cheaply?". A validation-display bug caught at component level costs seconds; caught at E2E it costs minutes and tends to be flaky. E2E is for integration confidence, not for every if-branch in the UI.`,
    follow: [
      'When you mock with {{page.route}}, how do you avoid a test that stays green while the real contract between FE and BE has already changed?',
      'How do you organise API tests ({{APIRequestContext}}) and UI tests inside one Playwright Java project?',
      'In which case do you accept an E2E that depends on a real backend even though it is slower?'
    ]
  },
  'autotest-039': {
    q: 'Automating accessibility testing (a11y – making the UI usable, for example by screen reader users) with axe-core and Playwright: what does the basic setup look like, how do you integrate it, and what are the limits?',
    a: `**Summary:** **Accessibility** (a11y) means the interface is usable by more people, including keyboard users, screen reader users (software that reads the screen out loud) or people with limited vision – for example buttons have names, colour contrast is sufficient, heading structure is sane. **axe-core** is a rules library that automatically detects a number of common a11y violations. Combined with Playwright you inject axe into the page, run a scan and get back a list of violations. The basic level: scan the main pages/states in CI, block severe issues, produce a report. **The important limit**: automation only catches a part (typically less than half of real problems); the actual experience still needs manual evaluation and testing with assistive technology.

### The real situation
The product has a sign-up form: an input not attached to a {{<label>}}, an icon button with no accessible name, light grey text on a white background. Mouse users still get by; a screen reader user may not know what that input is for. Automation with axe surfaces these issues early on every PR instead of waiting for late complaints.

### How to wire it in at a basic level (the idea)
1. Add an axe integration dependency for Playwright (in the Java world you usually use a bridge library that runs the axe script in the page context; the general principle is the same).
2. On the important pages/states (home page, main forms, checkout steps), once the page has settled: inject axe → run analyze → read violations.
3. Filter by severity (serious/critical) to decide whether to fail the build or only warn.
4. Store the report (JSON/HTML) as a CI artifact.

~~~java
// Idea-level pseudocode (the exact API depends on the integration library you pick)
page.navigate("https://app.test/signup");
// 1) inject the axe-core script into the page
// 2) run axe.run() inside the page context
// 3) read the violations and assert there are no serious ones
// if (!criticalViolations.isEmpty()) fail("A11y issues: " + criticalViolations);
~~~

~~~seq
title: Automated a11y scan inside a test
actors: Playwright test | Page (browser) | axe-core
Playwright test -> Page (browser): navigate to the state to check
Playwright test -> axe-core: inject and run analyze over the DOM
axe-core --> Playwright test: list of violations (rule, impact, node)
Playwright test -> Playwright test: fail if critical/serious (per threshold)
~~~

### What automation catches quite well (typical examples)
- A meaningful image missing {{alt}}, an input missing a label.
- Colour contrast violations (the cases that can actually be measured).
- Basic ARIA/role misuse, duplicate ids that break references.
- Some heading/landmark problems.

### Limits (you must say this in an interview)
- It does **not prove a page "fully complies"** with a standard (e.g. WCAG). Automation only checks a finite set of rules.
- It cannot judge the **quality of label text** (does the name really mean the right thing), whether the **reading order** makes sense in context, or whether the **keyboard experience** is smooth on a complex flow.
- Results depend on the **page state** at scan time: a modal never opened, an error never shown → the hidden violations are not seen. You must scan several states.
- There can be false positives/negatives; review them instead of disabling rules carelessly.

### A pragmatic strategy
| Step | Action |
|---|---|
| Pick the scope | 5–10 important pages/flows (login, main forms, checkout) |
| Pick the threshold | Fail CI on {{critical/serious}}; log {{moderate/minor}} as warnings/tickets |
| Multiple states | Scan after opening the modal, after validation errors appear, at a mobile viewport if needed |
| Combine with manual work | A keyboard checklist, walking 1–2 flows with a screen reader periodically |

### Common mistakes
- Scanning only the logged-out home page → missing the important forms behind login.
- Seeing a pile of violations and switching the whole check off → you lose the safety net; fix them progressively by priority instead.
- Believing that axe passing means the page is accessible → a misunderstanding of the limits.

### How to answer in an interview
Explain that a11y is for real users (including assistive technology). Describe how axe fits into the Playwright flow: navigate → inject/analyze → assert by impact. Emphasise the limits of automation and the manual/multi-state complement that goes with it. Show a pragmatic attitude: improve gradually, prioritise the severe issues.

> Senior tip: Put a11y in the same pipeline as functional tests, but start small (a few pages, serious/critical only). Success is measured by fewer severe a11y regressions and by user feedback, not by driving the violation count to zero by loosening the rules.`,
    follow: [
      'Which page states do you scan (after login, modal open, errors shown) so that you do not miss violations?',
      'What is the difference between an element role/name (what a screen reader uses) and a CSS selector (what a test uses)?',
      'When axe reports a false positive, what is your team process – fix it, annotate it, or record a deliberate exception?'
    ]
  },
  'autotest-040': {
    q: 'How do you automatically test i18n (multi-language support), timezones and currency formatting in an application? Which cases break easily, and how do you design the tests?',
    a: `**Summary:** Applications serving many regions go wrong in places that look small: a missing translated string or a placeholder that does not line up, date/time shown in the wrong timezone or rolling over to the wrong day, money formatted with the wrong thousands separator/decimal marker/currency symbol. To automate this: (1) **i18n** – check that translation keys exist, the UI renders for the right locale, placeholders get substituted, string length does not break the layout; (2) **timezone** – fix the timezone of the input data (store UTC) and assert the display for the target locale/timezone, including boundary cases (day rollover, DST); (3) **money** – use a proper money type (avoid float), assert the formatting per locale (for example {{1.234,56 ₫}} vs {{$1,234.56}}) and the correct rounding. The test design must separate canonical data from locale-specific display.

### The core terms
- **i18n** (internationalization): designing the system so it supports many languages/regions without changing core code. **l10n** (localization) is the concrete content/translation for each region.
- **Locale**: a region + language identifier (for example {{vi-VN}}, {{en-US}}) that drives how dates, numbers and money are formatted.
- **Timezone** (a UTC offset zone): for example {{Asia/Ho_Chi_Minh}} (UTC+7). **UTC** is the reference time standard; data is usually stored in UTC and displayed in the user's timezone.
- **DST** (Daylight Saving Time): some regions shift the clock with the season, which creates "nonexistent hours" or "repeated hours".

### 1) Testing i18n (multi-language)
Context: the checkout page has a Pay label and a validation message "Please enter {field}". If you add the {{en-US}} locale and forget a key, the UI renders {{checkout.pay.button}} (the raw key) – ugly and confusing.

How to test:
- **Key-set checks**: (usually a unit test on the resource side) make sure every key in the default locale exists in the other locales, and that placeholders ({{field}}) match.
- **UI checks per locale**: with Playwright, open the app with the desired locale (configure {{locale}} on the context) and assert the visible text.

~~~java
// Playwright Java: create a context with a specific locale
com.microsoft.playwright.BrowserContext ctx = browser.newContext(
    new com.microsoft.playwright.Browser.NewContextOptions().setLocale("en-US"));
com.microsoft.playwright.Page page = ctx.newPage();
page.navigate("https://app.test/checkout");
com.microsoft.playwright.assertions.PlaywrightAssertions
    .assertThat(page.getByTestId("pay-btn")).hasText("Pay now");
ctx.close();
~~~

Cases that break: longer text (German is usually longer than English) overflowing a button; pluralization (1 item vs 2 items); strings glued together that end up grammatically wrong.

### 2) Testing timezones
Principle: the backend stores the instant in **UTC** (or in a type that carries an offset), the UI converts it into the display timezone. The classic bug: adding and subtracting hours manually with integers → wrong when crossing midnight or DST.

How to test:
- Pick one fixed UTC instant as the input (for example {{2026-01-01T17:30:00Z}}).
- For a user in {{Asia/Ho_Chi_Minh}} (UTC+7) → expect the display {{02/01/2026 00:30}} (already the next day).
- For {{America/New_York}} → expect whatever EST/EDT dictates at that date.
- Boundary cases: just before/just after midnight; the day DST switches (if your product serves regions with DST).

~~~java
// Idea: seed data with a fixed UTC timestamp, then assert the UI per locale/timezone
// 2026-01-01T17:30:00Z -> in VN (UTC+7) that is 00:30 on 02/01/2026
String utcInstant = "2026-01-01T17:30:00Z";
// ... create a record using utcInstant, open the UI with the VN timezone, assert the date/time text ...
~~~

In Playwright you can set {{timezoneId}} on the context so the browser renders in the timezone you want.

~~~java
com.microsoft.playwright.BrowserContext ctx = browser.newContext(
    new com.microsoft.playwright.Browser.NewContextOptions()
        .setLocale("vi-VN")
        .setTimezoneId("Asia/Ho_Chi_Minh"));
~~~

### 3) Testing money formatting
Data principle: money uses integers (the smallest unit, e.g. cents) or {{BigDecimal}} – **never {{float/double}}**, because of binary rounding errors.

Display per locale:
| Locale | Example (same value, 1234567 VND or 1234.56 USD) | Note |
|---|---|---|
| {{vi-VN}} | {{1.234.567 ₫}} | dot as the thousands separator, {{₫}} symbol |
| {{en-US}} | {{$1,234.56}} | comma thousands separator, dot decimal separator |

Test: supply a canonical value (a number) and assert the displayed string for that locale. Boundary cases: zero, negative amounts, very large numbers, rounding (2 decimal places or 0 depending on the currency).

### Designing the overall test approach
- **Separate the layers**: unit tests for money/date formatting (pure functions) across many locales; E2E only checks a few representative screens with the main locales.
- **Fixed data**: constant timestamps and amounts, never "the current time" (it makes tests flaky).
- **A minimal matrix**: pick 2–3 strategic locales (vi-VN, en-US, plus one with DST if relevant) instead of every locale on every test.

### Common mistakes
- Comparing hard-coded date/time strings without setting {{timezoneId/locale}} on the context → passes on the dev machine (VN) and fails in CI (UTC).
- Asserting money with {{double}} ({{0.1 + 0.2}}) → tiny fractional errors; use {{BigDecimal}} or integer cents.
- Testing only the default locale → missing translations and broken placeholders in other locales are never detected.

### How to answer in an interview
Present the three axes (i18n, timezone, money) with the guiding principle: canonical data (UTC, an exact money type) separated from display (locale/timezone). Name the tooling: Playwright {{locale/timezoneId}}, unit-level tests of the formatting functions, chosen boundary cases (day rollover, DST, rounding). Stress avoiding any dependence on the current time or the machine environment.

> Senior tip: Keep one shared set of time/money boundary cases (cross-midnight, DST transitions, zero/negative/huge, rounding) and run it as fast unit tests. E2E only needs to prove the locale wiring on a few pages. Do not multiply the matrix (every locale × every page) when there is no matching risk.`,
    follow: [
      'Why store time in UTC and display it in the user timezone, instead of storing local time?',
      'How do you test pluralization (1 product / 2 products) and strings with variables (placeholders) across several languages?',
      'If the app uses a formatting library (ICU/MessageFormat), do you test at library level or at UI level?'
    ]
  },
  'autotest-041': {
    q: 'How do you measure and reduce the runtime of an API suite (a set of tests that call APIs)? How do you use parallelism, token (auth) reuse and test-data optimisation while still keeping reliability?',
    a: `**Summary:** A slow API suite delays CI feedback, so the team stops running the tests. To cut runtime while staying trustworthy: (1) **measure first** (per-test and per-suite duration, how much of it is network waiting) so you know where the bottleneck is; (2) **parallelise** independent tests (but isolate their data so they do not race); (3) **reuse authentication** (token/session) sensibly instead of logging in again for every test when it is safe; (4) **optimise data** (minimal seeding, reuse immutable fixtures, targeted cleanup). The principle: speed must never be bought with flakiness – tests have to stay independent and deterministic.

### The real situation
An API suite has 400 tests and takes 35 minutes running sequentially in CI. The analysis shows: 40% of the time is the repeated login step to get a token, 30% is creating heavy data (each test creates 20 records), the rest is the real API calls. The goal: down to ~10 minutes without adding flakiness.

### Step 1: Measure (optimising without measuring is blind)
- Record the duration of each test (a JUnit 5 extension, Surefire/Failsafe reports, Allure).
- Find the slowest tests (the top 10 usually account for most of the total time).
- Classify them: slow because of CPU/asserts, because of network I/O, because of waiting (sleep/poll), or because of data setup.
Useful metrics: total duration, p50/p95 test duration, number of login calls, number of queries/records created.

### Step 2: Parallelism
Run many tests at once across several workers/threads. The precondition: **tests must be independent** (a test must not depend on state left behind by another test).

~~~java
// JUnit 5: enable parallel execution through configuration (junit-platform.properties)
// junit.jupiter.execution.parallel.enabled = true
// junit.jupiter.execution.parallel.mode.default = concurrent
// (The actual configuration depends on the project; this example illustrates the idea)
~~~

Risks when running in parallel:
- **Data collisions**: two tests editing the same record "user-1" → random outcomes. The fix: each test uses its own data (a random id, a namespace per test), or an isolated DB / transaction rollback.
- **Resource limits**: too much parallelism overloads the API/DB, and responses get slower in return. Set a suitable number of workers (e.g. 4–8) and measure.

### Step 3: Reusing tokens (auth) sensibly
Repeated login costs time (password hashing, calls to the IdP – the identity provider). Ways to optimise:
- **Fetch the token once per test group** (for example {{@BeforeAll}} in the class, or a suite-level fixture) when the tests use the same permissions and the token stays valid for the whole run.
- **Cache per permission profile**: a token for the admin role, a token for the user role – reused inside the worker if it is safe.
- **Do not share mutable state attached to a token** (for example test A changes the password of the shared account → test B fails).

~~~java
// Idea: fetch the token once, reuse it for requests within the same safe scope
static String token;
@BeforeAll
static void authOnce(com.microsoft.playwright.APIRequestContext api) {
  // Call /login once, store the token
  var res = api.post("https://api.test/login",
      com.microsoft.playwright.options.RequestOptions.create()
          .setData(java.util.Map.of("u","test","p", System.getenv("TEST_PASS"))));
  token = res.json().get("token").asText();
}
~~~

Security note: a token is a secret at runtime – never write it to logs (see {{autotest-037}}). If the system issues short-lived tokens, consider refreshing them, or keep the BeforeAll scope short enough.

### Step 4: Optimising test data
- **Minimal seeding**: create only the fields/records the assert needs, do not build a whole world.
- **Shared immutable fixtures**: read-only data (a country list) seeded once for the suite; data that gets written must be separate per test.
- **Set up through the API or the DB directly, depending on the goal**: multi-step business API calls in setup are slow; if the test is checking editing an order, you can create that order through a helper/fast DB seed (but accept that this skips one layer compared to the real flow – state it clearly).
- **Targeted cleanup**: delete the data the test created (by prefix/id) so the DB does not grow across runs, but avoid a full {{TRUNCATE}}, which causes contention when tests run in parallel.

### Trade-off table
| Technique | Time saved | Risk | How to keep it reliable |
|---|---|---|---|
| Parallelism | High | Data races, overload | Data isolation, capped worker count |
| Token reuse | Medium-high (when login is expensive) | Shared state, expired tokens | Read-only token scopes, clear profiles |
| Minimal seeding | Medium | Setup drifts from reality | Standard helpers, periodic review |
| Dropping duplicate API E2E | Medium | Losing case coverage | Check overlap with the other test layers |

### Common mistakes
- Turning on parallel execution while tests still share {{static}} mutable state → flakiness that is very hard to trace.
- Caching one admin token for every test, including permission tests → the permission tests become meaningless.
- Optimising by deleting asserts "to make it fast" → fast but useless.

### How to answer in an interview
Give the sequence: measure → find the bottleneck → parallelise (together with isolation) → reuse auth safely → optimise data. Bring numbers (like the 35 minutes → ~10 minutes case) and stress the constraints: independence, determinism, never weakening permission or security checks.

> Senior tip: Track suite duration as a health metric (a CI time budget). Every PR that adds a slow test carries an interest payment. Prioritise fixing the slowest tests and stabilising them before you blindly increase parallelism.`,
    follow: [
      'How do you isolate data when API tests run in parallel against the same shared DB?',
      'When should you NOT reuse a token (for example logout tests, password-change tests, permission tests)?',
      'How do you distinguish time genuinely saved from cost that has simply been moved into an infrastructure setup step?'
    ]
  }
});
