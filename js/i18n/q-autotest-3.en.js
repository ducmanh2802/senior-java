/*
 * English translation of js/data/q-autotest.js — task T745. Format: js/core/i18n.js (content overlay).
 * ids: autotest-018 autotest-019 autotest-020 autotest-021 autotest-022 autotest-023 autotest-024 autotest-025 autotest-026 autotest-027 autotest-028 autotest-029
 */
App.i18n.content({
  'autotest-018': {
    q: 'What is a flaky test, how do you measure it and isolate it, how do you fix it at the root, and why can automatic retry be dangerous?',
    a: `**Summary:** A flaky test (an unstable, "flickering" test) is a test that sometimes passes and sometimes fails while the production code has not changed, because of timing, environment or data. Measuring: flaky rate = number of failures caused by flakiness divided by the total number of runs. Isolating: mark the flaky test, move it into a separate suite, run it alone to confirm. Fixing at the root: wait for the right condition (no hard sleeps), independent data per test, durable locators, no shared state. Automatic retry (re-running a test when it fails) is dangerous because it hides real bugs, produces a falsely green suite, wastes time, and makes defect leakage (bugs escaping into production) grow without anybody knowing.

### What a flaky test is
A flaky test is an unstable test: same code, same environment, this run it passes, the next run it fails. Frequent causes: the element has not appeared yet but the test already clicks it (timing), waiting is not long enough so it has to retry, stale data was not deleted, the network is slow, an animation has not finished. Flakiness makes the team lose trust in automation: when CI turns red, somebody says "probably flaky", everyone ignores it → real bugs slip through.

### How to measure flaky rate
Flaky rate = (number of test failures caused by flakiness) / (total number of test runs) × 100%. Track it on CI: every time a test fails and you suspect flakiness, re-run it; if the re-run passes → mark it flaky. List the most flaky tests so you can prioritize fixing them. Example: 1000 runs, 20 flaky failures → flaky rate 2%.

### Isolating a flaky test
- Mark the flaky test (tag flaky), move it into a separate suite that does not block merges.
- Run that single test many times on a dev machine to reproduce it.
- If you cannot fix it right away, temporarily drop it out of the main regression suite so it does not pollute the signal.

### Fixing at the root
- Replace hard sleeps (Thread.sleep) with conditional waits (wait for the button to be clickable, for the spinner to disappear).
- Independent data for every test, never a shared fixed account.
- Durable locators (data-testid), avoid brittle XPath.
- Do not share session/cookies between tests.

### Why automatic retry is dangerous
Automatic retry is a CI configuration that re-runs a test when it fails (for example retry 3 times). It makes a flaky test still pass on CI, but it conceals real bugs: one failure may come from a product bug, the next retry passes because the timing is different, and the team believes everything is fine. The consequences: an artificially low flaky rate, higher defect leakage, and a team spending hours debugging "ghost bugs". Only use controlled retry for clearly infrastructure-related errors (a dropped network connection), and you must track which tests retry often so the root cause gets fixed.

### Common mistakes
- Turning on retry for the whole suite to keep CI green, without investigating the flakiness.
- Fixing only the symptom (adding a sleep) instead of the root cause (waiting for the wrong condition).
- Ignoring a flaky test because "re-running it makes it pass".

### How to answer in an interview
Give the definition, how you measure flaky rate, how you isolate and how you fix at the root. Proactively point out the risks of automatic retry. Bring up a flaky test you once fixed and the result (flaky rate dropped from what to what).

> Senior tip: A flaky test is worse than no test at all, because it trains the team to ignore red signals. Prioritize really fixing a few flaky tests over switching on retry for the whole suite.`,
    follow: [
      'How do you tell a flaky test apart from a real bug on CI?',
      'When is automatic retry acceptable, and when is it not?',
      'How do you track flaky rate and report it to the team on a regular basis?'
    ]
  },
  'autotest-019': {
    q: 'A UI suite takes 2 hours and must get under 20 minutes. How do you analyze it and plan the work? Give the concrete steps and an example with numbers.',
    a: `**Summary:** Cutting a UI suite from 2 hours down to under 20 minutes requires combining several levers: trimming unnecessary UI tests, pushing most of the coverage down to the API/unit layer, running in parallel, and using headless. You cannot simply turn on more workers and keep 120 minutes of UI tests. The plan: measure the time of each test, find the slowest ones, move business tests that do not need a UI down to the API layer, run headless, set up data through the API instead of through the UI, shard the CI runs, and deal with flaky tests. The goal: keep UI tests only for the important flows (login, checkout), fast and stable.

### Step 1: measure and analyze
Run the suite and record the duration of every test. Identify the 20% slowest tests that eat 80% of the time (the Pareto rule). Example: 100 UI tests, the 10 slowest ones account for 90 minutes. Focus on those tests.

### Step 2: move tests down to a lower layer (test pyramid)
Not every check needs a UI. A test that verifies a pricing rule or the data returned by an API should be moved to REST Assured (calling the API directly: fast and stable). Keep only the important end-to-end flows in the UI. Example: 60 tests checking discount calculations moved to the API layer → 50 minutes saved.

### Step 3: run in parallel and headless
Run on several workers (for example 4 threads) and headless (a browser with no window, which suits CI). 120 minutes split across 4 workers → about 30 minutes, then combine with step 2 → under 20 minutes.

### Step 4: set up data through the API
Instead of creating an order through the UI (many click steps, slow), create the data beforehand through the API and let the UI check only the rendering. This saves setup time in every test.

### Step 5: CI sharding and flaky handling
Split the suite into shards that run on different CI jobs. Delete or quarantine flaky tests; do not let a flaky test force the whole suite to re-run several times.

### Example with numbers
| Stage | Suite duration |
|---|---|
| Initially | 120 minutes |
| Moved 60 tests down to the API | 70 minutes |
| Headless + 4 workers | 20 minutes |
| After handling flaky tests | 18 minutes |

### Common mistakes
- Only increasing the number of workers without moving tests to the API layer → a small drop, not enough.
- Keeping every UI test because "we do not want to delete anything" → the suite stays slow.
- Running headed (with a visible window) on CI → hard to start up, and slower.

### How to answer in an interview
Lay out the 5 concrete steps, give example numbers, and state the principle of keeping UI only for critical flows. Explain why parallelization alone is not enough. Share your experience of actually slimming down a real suite.

> Senior tip: The goal is not the shortest suite, it is a fast and trustworthy suite. A 20-minute suite that is green every day is worth more than a 2-hour suite that is intermittently red every week.`,
    follow: [
      'Based on what criteria do you decide which tests move from the UI down to the API?',
      'Does running in parallel affect how you have to manage test data?',
      'After cutting it down to 20 minutes, do you keep this suite on every PR or only nightly?'
    ]
  },
  'autotest-020': {
    q: 'How does visual regression testing work, how do you choose the diff threshold, and what is the maintenance cost?',
    a: `**Summary:** Visual regression testing takes a screenshot of a web page and compares it against a baseline image (the screenshot previously accepted as correct). If the difference exceeds an allowed threshold (for example a percentage of differing pixels or a number of diff points), the test is marked as failed. It helps catch unintended UI defects such as covered text, changed colors, or a broken layout. The downside is that it is prone to flakiness from fonts, anti-aliasing and dynamic content, and the maintenance cost is high because baselines need to be updated often.

### How it works
1. Run the test the first time, take screenshots of the important pages → store them as the baseline.
2. On later runs, take screenshots again under the same conditions and compare pixel by pixel with the baseline.
3. If the difference is below the threshold → pass. If it exceeds the threshold → fail, and the diff image is reported so QA can review it.

Example: a product page has 500,000 pixels, a 0.1% threshold = at most 500 differing pixels allowed. If a new banner makes 2,000 pixels differ → fail.

### Choosing the diff threshold
A threshold that is too strict → flaky (fonts render differently on another machine, images compress differently) → the test keeps failing even though the UI is correct. A threshold that is too loose → real bugs are missed (a missing button, text hidden behind something) → little value. Start from a middle threshold (for example 0.1-0.5%) and tune it per page. Pages with animation or rotating ads should be excluded, or screenshotted only after they settle.

### Maintenance cost
- Updating the baseline whenever the UI legitimately changes (for example a button redesign) → QA has to review and accept the new image.
- Storing thousands of baseline images takes disk space.
- False positives make the team lose trust and start ignoring visual alerts.
- It is only effective on stable UI; pages that change constantly should not rely heavily on visual regression.

### When to use it / when not to
- Use it: landing pages, checkout pages, important UI designs that rarely change.
- Don't use it: pages with personalized content, rotating ads, or functional checks (assert on the data instead of on an image).

### Common mistakes
- Taking the screenshot before the page finished loading → differences come from missing content, not from a UI bug.
- Not updating the baseline after a redesign → the whole visual suite fails.
- Using visual checks on every page → maintenance becomes overwhelming and flakiness goes up.

### How to answer in an interview
Explain the screenshot-and-compare-to-baseline mechanism, how you pick the threshold, and the maintenance cost. Mention where you would and would not use it. Give an example of what it catches (for instance the checkout button hidden behind a popup).

> Senior tip: Visual regression is a supporting layer, it does not replace functional assertions. Combine both: assert the data is correct (API/UI) and screenshot the important, rarely changing pages. Do not let visual be your main test layer, because its maintenance cost is high.`,
    follow: [
      'How do you reduce false positives caused by fonts and anti-aliasing across different machines?',
      'When the UI is redesigned, what is your process for updating the baselines?',
      'Which pages do you apply visual regression to and which ones do you exclude?'
    ]
  },
  'autotest-021': {
    q: 'How does contract testing differ from E2E (end-to-end) between microservices from a QA standpoint? Link back to the testing topic without repeating what is already covered there.',
    a: `**Summary:** Contract testing (for example with Pact) confirms that two services share the same understanding of the request and response format, without needing the whole system to run at the same time. The consumer (the calling service) records the contract it expects, and the provider (the called service) verifies whether it actually satisfies that contract. E2E runs the whole flow through many real services: slow, and it needs a complete environment. From a QA point of view: contract testing is used to catch integration bugs early and runs continuously in CI; E2E is used for a small number of critical business flows that run less often (nightly/before release). The testing topic already covered contract testing from the developer side; here the focus is the QA role and when to choose which.

### What contract testing is
Two services talk to each other over an API. The consumer writes a contract: "I send request A, I expect response B". The contract is stored and handed to the provider. The provider runs a verification: it receives request A and checks whether its response matches B. Both sides can verify independently, without starting up together.

Example: Order Service calls Payment Service. Order writes the contract: send POST /pay with amount and token; expect a 200 response containing transactionId. Payment verifies whether it returns exactly that schema.

### What E2E is
E2E (end-to-end, checking the flow from one end to the other) runs a real flow across several services: the user places an order in the UI → Order Service → Payment Service → Email Service. It checks that the whole system works together, but it is slow and needs databases, a message broker, and a full staging environment.

### Comparison from the QA side
| Criterion | Contract testing | E2E |
|---|---|---|
| Speed | Fast (seconds) | Slow (minutes) |
| Environment | No full system needed | Needs complete staging |
| Bugs caught | Data-format mismatches between services | End-to-end business flow bugs |
| When it runs | Every commit (CI) | Nightly, before release |
| Who mainly owns it | QA + dev define the contract together | QA writes the business scenarios |

### Link back to the testing topic
The testing topic already has the contract testing and mutation testing sections from the technical side. What to emphasize here: QA takes part in defining contracts for the important flows, proactively syncs with devs when an API changes, and uses E2E only for a handful of critical flows so the pipeline does not slow down.

### Common mistakes
- Using E2E for every integration check → a slow pipeline, and a failure is hard to attribute to a specific service.
- Not updating the contract when the API changes → the contract passes while reality fails.
- Forgetting optional fields in the contract → the provider adds a field and the consumer breaks.

### How to answer in an interview
State the main differences (speed, environment, bugs caught), when to use contract vs E2E, and the QA role in defining contracts. Give a real example of a service you have tested.

> Senior tip: Contract testing is the solid layer between unit and E2E. Use contracts for most integration checks and keep E2E for the 5-10 most important business flows.`,
    follow: [
      'When an API changes, who is responsible for updating the contract, and what is the process?',
      'Which kinds of bugs does contract testing catch that E2E struggles with, and the other way around?',
      'What factors decide whether you use a contract test or an E2E test for a new feature?'
    ]
  },
  'autotest-022': {
    q: 'Performance testing with k6, JMeter or Gatling: the workload model, think time, ramp-up, and how to read p95/p99. Focus on the QA tooling angle and do not repeat the load-test question already in the testing topic.',
    a: `**Summary:** Performance testing checks how much load the system withstands and how fast it responds; it differs from functional automation (it is not just pass/fail). k6 (written in JavaScript), JMeter (a Java GUI, very common) and Gatling (Scala, tests written as code) are the popular tools. The workload model describes the number of virtual users, the duration, and the proportion of each action. Think time is the pause between two actions of a real user, which makes the model realistic. Ramp-up means growing the user count from 0 to the target gradually, so you do not shock the system. p95/p99 are percentiles: 95% of requests are faster than X ms, and the worst 1% are faster than Y ms. They tell you whether the majority of users get good service, while p99 describes the slowest 1% of users.

### The tools
- **k6**: JavaScript scripts, run from the CLI, well suited to CI and to developers.
- **JMeter**: a graphical interface, many plugins, popular in Vietnamese enterprises.
- **Gatling**: scripts written in Scala/Java, nice reports, suits teams that like code-first.

### Workload model
The workload model defines: how many concurrent users, for how long, and what each user does. Example: 100 users placing orders, each user 5 orders/hour, for 30 minutes. QA must agree with the PM on this model before running anything.

### Think time
Real people do not click nonstop; they pause a few seconds between steps. Think time simulates that pause (for example a uniform 3-5 seconds). Without think time, the system gets hit with far more requests than reality → distorted results (worse than the real world).

### Ramp-up
Do not throw 1000 users at the system at second 0 (it can shock the system and the result will not reflect reality). Ramp up gradually: from 0 to 1000 users over 10 minutes, and only start measuring once things stabilize.

### Reading p95/p99
- **p95**: 95% of requests have a response time less than or equal to this value. For example p95 = 400 ms means 95% of users see the page load within 400 ms.
- **p99**: the worst 1% of requests. For example p99 = 2 seconds means 1% of users wait more than 2 seconds.
QA cares about p95/p99 because the average can hide extremely slow requests. If p50 = 100 ms but p99 = 5 seconds, the system probably has a problem affecting some users.

### Common mistakes
- Reporting only the average → rare slow-path bugs get masked.
- No think time → load higher than reality, wrong conclusions.
- Running performance tests in an environment different from production (different configuration) → results you cannot rely on.
- Not agreeing on thresholds (acceptance criteria) before the run.

### How to answer in an interview
Name the tools you have used, how you build the workload model, think time, ramp-up, and how you explain p95/p99 to management. Give real numbers you have read (for example p95 400 ms, p99 2 seconds).

> Senior tip: Performance testing is not a one-off run. Establish a baseline (reference numbers) and compare every release: if p95 goes from 400 ms up to 800 ms, there is probably a performance regression to handle before deployment.`,
    follow: [
      'How do you pick a suitable virtual-user count for the first load test?',
      'p95 is stable but p99 spikes — how do you handle that?',
      'Do you run performance tests in CI or only on a dedicated environment, and why?'
    ]
  },
  'autotest-023': {
    q: 'Using the Playwright APIRequestContext to test APIs and combining UI + API in one test (set up data via API, assert via UI). How does network interception (page.route) let you mock the backend?',
    a: `**Summary:** APIRequestContext is the Playwright object that makes raw HTTP calls without opening a browser, which is fast and stable. Use it to set up data (for example create a user or an order through the API) and then open the UI to check how the result renders. Combining UI + API in one test makes the test faster and less dependent on the interface. Network interception (page.route) intercepts requests coming from the browser and returns a simulated response (a mock), which you use to test error handling (the API returns 500, it times out) without a real backend.

### What APIRequestContext is
APIRequestContext lets you send HTTP requests (GET, POST...) from Playwright Java code without starting a browser. It is fast, stable, and not flaky because of page rendering. It is typically used to prepare data before a UI test.

### Combining UI + API in one test
Example test "view an order after placing it":
1. Use APIRequestContext to call POST /orders and create an order with status "shipping".
2. Open the UI and navigate to the "My orders" page.
3. Check that the UI shows the order you just created with the correct status.

~~~java
// Set up data through the API (no browser opened)
APIRequestContext request = APIRequestContext.create();
var createResp = request.post("https://api.example.test/orders",
    new APIRequestContextOptions().setData("{ \"customer\": \"alice\", \"items\": [...] }"));
int orderId = createResp.json().getInteger("id");

// Verify through the UI
Page page = browser.newContext().newPage();
page.navigate("https://app.example.test/orders/" + orderId);
page.locator("[data-testid='order-status']").waitFor();
assertEquals("SHIPPING", page.locator("[data-testid='order-status']").innerText());
~~~

The benefit: creating data through the API is fast, you do not need to click through the UI to place an order; the UI is used only to verify the rendering.

### Network interception with page.route
page.route intercepts every network request the page makes (API calls, images, scripts) and lets you answer it (fulfill) with fake data. Uses:
- Simulate a successful / failed payment API call without actually calling it.
- Check how the UI renders a message when the API returns a 500 error.
- Avoid depending on an unstable backend inside a UI test.

Example (Playwright Java idea):
~~~java
page.route("**/api/payment", route -> {
    route.fulfill(new RouteFulfillOptions()
        .setStatus(200)
        .setContentType("application/json")
        .setBody("{ \"status\": \"success\", \"transactionId\": \"txn_123\" }"));
});
~~~
Once the route is registered, every request to /api/payment from the page receives this fake response.

### Common mistakes
- Mocking too much of the backend → the test never checks the real wiring, it can pass while production is broken.
- The route pattern does not match (a wrong URL, for example) → the request still goes out for real and the test becomes flaky.
- Forgetting to remove the route after the test → it affects other tests sharing the same browser.
- Only testing the UI without ever verifying the real API in a few important cases.

### How to answer in an interview
Explain that APIRequestContext is used for fast data setup, give the UI + API combination example, and describe page.route mocking the backend to test error handling. Stress that mocks must not be abused: you still need at least one case that calls the real API.

> Senior tip: Use API setup so UI tests run fast, but keep a few tests that call the real API (no mocks) to make sure the systems genuinely connect. Use mocks only to cover error cases that are hard to reproduce (timeout, 500).`,
    follow: [
      'How can APIRequestContext and Page share a session/auth when you need that?',
      'When do you choose a mocked backend instead of a real sandbox?',
      'How do you verify that a route pattern actually matched the network request you intended?'
    ]
  },
  'autotest-024': {
    q: 'What is shift-left, and at which stage of the pipeline (PR, nightly, pre-release) does each kind of automated test run?',
    a: `**Summary:** Shift-left means running testing earlier in the software development lifecycle instead of waiting until the end. Automated tests are split across the pipeline: PR (pull request – a request to merge code) runs unit tests and a fast API smoke (under 10 minutes); nightly (running every night) runs the full UI regression plus light performance checks; before release you run smoke tests on staging and E2E for critical flows. The goal is to find bugs early, when the fix is cheap, without slowing down how often developers contribute code.

### What shift-left is
In the traditional model, testing happens after development finishes the feature (the right side of the process diagram). Shift-left moves testing to the left (earlier): developers write unit tests and QA writes API tests at the same time the code is being written. A bug found at the coding stage is cheaper and faster to fix than one found after deployment to production.

### Which tests run at each stage
- **PR (every time code is pushed for review):** unit tests, API smoke, lint. Fast (under 10 minutes) and a merge gate (code cannot be merged if it fails).
- **Nightly (every night):** full UI regression, light performance, visual regression. Runs outside working hours, so it does not block developers.
- **Before release:** smoke tests on staging (the environment closest to production), E2E for critical flows (login, checkout), checks against production-like data.

Example pipeline:
~~~text
PR push --> unit + API smoke (<10p) --> gate merge
Nightly --> regression UI + performance
Pre-release --> smoke staging + E2E critical
~~~

### Why you split into tiers
If you ran the whole UI regression on every PR, developers would wait 2 hours before knowing whether their code can be merged → development slows down and developers start ignoring the tests. Tiering gives fast feedback on PRs and deeper checking on nightly/release.

### Common mistakes
- Running UI regression on every PR → a slow pipeline, and developers stop trusting the tests.
- Nobody deals with the nightly failure the next morning → bugs pile up.
- No merge gate → broken code can land on the main branch.

### How to answer in an interview
Explain what shift-left means, show the table of tests per pipeline stage, and the reason for tiering. Give an example of a pipeline you designed or improved. Explain the merge gate and who is responsible for handling nightly failures.

> Senior tip: A pipeline is only valuable when its signal is trustworthy. PR checks must be fast and stable so developers believe them; nightly runs may be slower, but failures must be handled by the next morning.`,
    follow: [
      'How do you decide which tests go into the PR smoke and which into the nightly regression?',
      'The nightly run failed — who is responsible for handling it the next morning?',
      'What is a merge gate and why is it mandatory for PRs?'
    ]
  },
  'autotest-025': {
    q: 'How do you test things that depend on third parties (payment gateway, OTP, email) without calling the real service every time? Name WireMock, sandboxes and test hooks.',
    a: `**Summary:** Third-party services (payments, OTP over SMS, sending email) should not be called for real in automated tests, because they cost money, they are slow, and you cannot control their state (a random OTP, for example). The solutions: WireMock (a local fake HTTP server), a sandbox (the provider's own test environment), and test hooks (insertion points in code used to bypass or fake a response). The goal is to test your own flow without affecting, or being affected by, the external service.

### The problem with calling third parties for real
- Payment gateway: every test transaction costs a small fee, and you need a real or fake card.
- OTP by SMS: every code costs money, and the provider blocks you if you send too many.
- Email: the test mailbox floods, and the verification code changes every time.

### WireMock
WireMock is a fake HTTP server you run locally or inside the test. You configure it as: "when a request arrives at /payment, return a success or a failure response with fake data". The test calls WireMock instead of the real gateway, which is fast and predictable.

Example WireMock configuration (illustrative):
~~~text
When a POST /v1/charge request arrives with amount > 0
Return 200 with { "status": "succeeded", "transactionId": "test_txn_123" }
~~~

### Sandbox
Many providers (payment, email, SMS) offer a dedicated sandbox environment for development/testing. The interface looks like the real one but no real money is charged, and the OTP is always fixed (for example 123456). Use a sandbox when you need a more realistic integration check than WireMock can give.

### Test hooks
A test hook is a point inserted into the code that changes behavior when running tests. For example: the OTP-sending function takes a hook parameter, and in tests it returns the fixed code "123456" instead of calling the real SMS gateway. Hooks let you test the verification flow without a real phone.

### When to use which
- **WireMock:** testing your own flow against controlled responses, fast, CI friendly.
- **Sandbox:** a more realistic integration check, but slower and with call-rate limits.
- **Test hook:** when WireMock or a sandbox cannot be configured, or when you need to exercise internal logic with fake data.

### Common mistakes
- Calling the real payment service from CI tests → costs money and fails whenever the network is slow.
- Real OTP in tests → the suite cannot run automatically, the tester has to wait for a text message.
- Not cleaning sandbox data → leftover records break later tests.

### How to answer in an interview
Name the three solutions (WireMock, sandbox, test hook), give concrete examples for payment/OTP/email, and say when you pick each one. Explain why nothing should be called for real in automation.

> Senior tip: Do not let the automation suite develop hard dependencies on third-party services. Every external service needs a simulation layer or a hook so tests stay self-contained, fast, and free.`,
    follow: [
      'How do you simulate error responses from the payment gateway (declined card, expired card)?',
      'What are the limitations of a sandbox compared with real production?',
      'Can test hooks reduce the trustworthiness of a test, and why?'
    ]
  },
  'autotest-026': {
    q: 'What does basic security in automated testing (an OWASP ZAP baseline scan in CI) mean at the QA level? How do you integrate it and what should you watch out for?',
    a: `**Summary:** Security in automation at the QA level is not about working as a pentester (deep, manual penetration testing); it is about running basic scans (baseline scans) in CI to catch common security issues (missing security headers, forms exposed to simple attacks...) and reporting them so developers fix them. OWASP ZAP is a popular open-source tool that can run through Docker in CI. The ZAP baseline scan checks the basic rules and produces a report. Things to watch: scan only test/staging environments, never production without permission, and never leak tokens/passwords into the report.

### What security at the QA level is
QA does not have to be a security expert, but can add an automated scanning step to the test pipeline. The goal is to catch common problems early (the low-hanging fruit) before the code reaches production, and to reduce the burden on the security team.

### The OWASP ZAP baseline scan
ZAP (Zed Attack Proxy) is an open-source web security scanner. A baseline scan is a light scanning mode: no aggressive attacks, it only checks basic rules (for example the Strict-Transport-Security and Content-Security-Policy headers, and cookie Secure/HttpOnly flags). It runs through the zaproxy/zap-stable Docker image in CI.

Example ZAP baseline run (illustrative):
~~~bash
docker run --network host -v $(pwd):/zap/wrk/:rw zaproxy/zap-stable \
    zap-baseline.py -t https://staging.example.app -r report.html
~~~
(The command above only illustrates the idea; flags depend on the ZAP version.)

### Integrating it into CI
Add a ZAP step after the application is deployed to staging in the pipeline. If ZAP finds high-severity issues you can either fail the build or just file a report for developers, depending on how severe the findings are. Export the HTML report as an artifact so the team can review it.

### Important notes
- Scan only staging/test environments; never scan production without written permission from the system owner.
- Do not store tokens, passwords, or PII (personally identifiable data) in the ZAP report.
- The ZAP baseline can produce false positives; QA has to triage them before handing issues to developers.
- Automated security checks are an addition, not a replacement for periodic penetration testing.

### Common mistakes
- Scanning production without permission → it can be treated as an attack and create legal exposure.
- A ZAP report containing tokens → a brand new security risk.
- Treating the ZAP baseline as "security done" → skipping the real pentester.

### How to answer in an interview
Say that OWASP ZAP is a basic scanner, how you run it through Docker in CI, which classes of issues it finds (headers, cookies), and the caveats about environment and sensitive data. Affirm that this is the QA level and does not replace a pentester.

> Senior tip: Automated security is valuable only when it is wired into a handling process: ZAP reports an issue → developers fix it → the re-scan passes. A ZAP report that is generated and then read by nobody has no value.`,
    follow: [
      'Which common issues does a ZAP baseline most often find in Java/Spring applications?',
      'How do you handle ZAP false positives without slowing down CI?',
      'Who is allowed to view and act on security reports coming out of automation?'
    ]
  },
  'autotest-027': {
    q: 'Measuring the quality of test automation: defect leakage, requirement coverage, flaky rate — and how you report them to management. With example numbers.',
    a: `**Summary:** For management to know whether test automation delivers value, track these metrics: defect leakage (the share of bugs your automation missed and that were found after the release went to production), requirement coverage (the percentage of business requirements backed by at least one automated test), and flaky rate (the share of failures caused by the test or the environment rather than by the product). Reports to management must be simple, show a trend over time, and come with a proposed action — not just a list of passes and fails.

### Defect leakage
Defect leakage = bugs found in production (after release) divided by total bugs (found in testing + found in production) × 100%. Example: in one month the team found 40 bugs during testing and 10 bugs in production → leakage = 10 / (40+10) = 20%. The goal is to bring leakage down over time. If leakage is high, automation is not catching enough of the important bugs.

### Requirement coverage
This is different from code coverage (the share of code lines executed by tests). Requirement coverage is the percentage of business requirements (user stories, acceptance criteria) that have at least one corresponding automated test. Example: 50 requirements, 35 of them have an automated test → coverage 70%. Focus on the important requirements (high risk, revenue-bearing).

### Flaky rate
Flaky rate = the number of failures caused by the test or the environment (not by production code) divided by the total number of runs. Example: 1000 runs, 30 flaky failures → flaky rate 3%. The goal is to push flaky rate below 1%.

### Reporting to management
Keep the report simple, weekly/monthly:
| Metric | This month | Last month | Action |
|---|---|---|---|
| Defect leakage | 20% | 25% | Fix the critical tests that were skipped |
| Requirement coverage | 70% | 60% | Add tests for 5 new requirements |
| Flaky rate | 3% | 5% | Fix the 3 most flaky tests |

Use trend charts (leakage going down, coverage going up) rather than isolated numbers.

### Common mistakes
- Reporting only the test case count (for example "we have 500 tests") without saying what it is worth.
- Reporting code coverage instead of requirement coverage, which management cannot interpret.
- An artificially low flaky rate because retry is switched on for the whole suite.

### How to answer in an interview
Name the three metrics, their formulas, example numbers, and how you report them simply to management. Explain why requirement coverage matters more than code coverage for QA.

> Senior tip: A useful metric is one that leads to action. If a report exists only to be archived and nobody reads it, simplify it again or focus on the 1-2 most important metrics (for example leakage and flaky rate).`,
    follow: [
      'How do you collect production bug data so defect leakage is computed accurately?',
      'Does 100% requirement coverage mean automation is good enough, and why?',
      'How often do you report to management, and through which channel?'
    ]
  },
  'autotest-028': {
    q: 'AI in testing (self-healing locators, LLM-generated test cases): what are the real benefits and the real risks? How do you use AI in automation cautiously?',
    a: `**Summary:** AI in testing includes self-healing locators (automatically repairing a locator when the UI changes) and generating test cases with an LLM (large language model) from business requirements. Benefits: writing tests faster, less time spent fixing flaky locators, freeing QA to focus on test design. Risks: AI can generate tests that are wrong about the business logic (hallucination — producing confident but incorrect information), code written by AI is hard to maintain, sending code to a public model is a security risk, and there is a per-call cost. The cautious way to use it: AI suggests, a human reviews and approves before anything enters the repo; never send code or sensitive data to a public AI service.

### Self-healing locators
When an old locator breaks (a button's id changed, for example), a self-healing locator finds a replacement based on other attributes (name, text, position) and suggests it for QA to approve. It cuts the time spent fixing flaky tests caused by minor UI changes.

### Generating test cases with an LLM
QA supplies a user story and the LLM produces Gherkin scenarios or Java test code. It is a fast way to bootstrap a test set, especially for people new to automation. However, the LLM can miss extreme cases (edge cases) or write tests that do not follow team conventions.

### The real risks
- **Hallucination:** AI writes a test that passes on your machine but checks the wrong business logic → defect leakage goes up.
- **Maintenance:** AI-generated code usually lacks comments and has odd structure, so it is hard to change later.
- **Security:** uploading your source repository, test data, or customer information to a public AI service can leak it.
- **Cost:** every AI call costs money, so do not call it automatically for every test.

### Using it cautiously
- AI only suggests; a human reviews and approves before commit.
- Never send production source code, tokens, or PII to a public AI service.
- Use AI inside a private/enterprise environment with a security policy when available.
- Always run the AI-generated test and verify the outcome before adding it to the suite.

### Common mistakes
- Accepting a test written by AI without checking it → tests that pass for the wrong reason.
- Feeding real customer data into a public LLM → a security violation.
- Letting AI write every test so QA does not understand the code → impossible to maintain later.

### How to answer in an interview
State the benefits (speed, less locator fixing) and the risks (hallucination, maintenance, security). Explain the cautious workflow (suggest → review → verify → commit). Give an example of how you used AI, or your plan to.

> Senior tip: AI is an assistant, not a replacement for QA. The value of QA is risk thinking and test design, which AI cannot fully replace yet. Use AI to speed up, not to replace human verification.`,
    follow: [
      'How do you validate an AI-generated test before it enters the repo?',
      'Do you allow uploading the source repository to a public AI service, and why?',
      'Can self-healing locators make a test less accurate, and why?'
    ]
  },
  'autotest-029': {
    q: 'You are asked to build a QA/automation strategy for a fintech product that has no tests at all. Present the roadmap, the principles, the tooling and the metrics.',
    a: `**Summary:** A QA/automation strategy is the overall plan for quality and automated testing of a product. For a fintech (technology-driven financial) product with no tests, the priorities are security, the correctness of money movements, and regulatory readiness. The roadmap: assess risk → identify the critical flows → build a minimal framework → run it in CI → extend selectively. Principles: independent tests, never use real data, clear reporting. Tooling: Java, JUnit 5, Playwright/REST Assured, Allure, GitHub Actions/Jenkins. Metrics: defect leakage, flaky rate, feedback time, requirement coverage.

### Fintech and its risks
Fintech handles money and sensitive customer data under strict regulation. A bug can cause monetary loss, reputational damage, and legal violations. The automation strategy must prioritize payment flows, account flows, and security.

### The build-out roadmap (3-6 months)
Month 1: risk assessment, pick 5-10 critical flows (login, view balance, money transfer, checkout). Write REST Assured tests for the critical APIs.
Month 2: build the basic Playwright framework (Page Object, waits, durable locators). UI tests for the critical flows.
Month 3: CI integration (GitHub Actions/Jenkins), Allure reporting, headless execution.
Months 4-6: parallel test expansion, contract testing for microservices, team training, defining the metrics.

### Principles
- Tests are independent and do not share data.
- Never use real customer data in tests.
- Every test has an explicit assertion and reports clearly when it fails.

### Suggested tooling
- Language: Java (the team already knows it).
- Test runner: JUnit 5.
- API automation: REST Assured.
- UI automation: Playwright (less flaky, good tracing) or Selenium if the system is legacy.
- Reporting: Allure.
- CI: GitHub Actions or Jenkins.

### Metrics
- Defect leakage: bugs that reached production / total bugs.
- Flaky rate: tests failing because of the test itself / total runs.
- Feedback time: from when a developer pushes code to when they learn the test result.
- Requirement coverage: % of important requirements that have a test.

### Common mistakes
- Building a huge framework before the first test exists.
- Using real data or real payment cards in tests.
- Measuring only the number of test cases, not the value.

### How to answer in an interview
Present the month-by-month roadmap, the principles, the tooling and the metrics. Explain why fintech prioritizes security and correctness. Give an example of a process you have applied or would apply.

> Senior tip: A strategy is not a document you put on a shelf; it has to show up in a pipeline that runs every day. Start small with the critical flows, get them running stably in CI, and only then expand. Management cares about the risk you removed, not about the test case count.`,
    follow: [
      'In the first 3 months, which fintech flows do you test first, and why?',
      'How do you convince management to invest in automation when the product has no tests at all?',
      'How do you define "transaction correctness" and how do you check it in automation?'
    ]
  }
});
