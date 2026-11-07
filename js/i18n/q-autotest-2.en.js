/*
 * English translation of js/data/q-autotest.js — task T744. Format: js/core/i18n.js (content overlay).
 * ids: autotest-009 autotest-010 autotest-011 autotest-012 autotest-013 autotest-014 autotest-015 autotest-016 autotest-017
 */
App.i18n.content({
  'autotest-009': {
    q: 'How do you manage test data for automation: creating data through the API instead of through the UI, cleaning up after tests, and making sure tests that run in parallel do not touch each other\'s data?',
    a: `**Summary:** Test data (the records a test creates, uses and removes) must be **independent, repeatable and easy to clean up**. Prefer **creating data through the API** (or a controlled seed) over the UI, because it is fast, stable and barely depends on the interface. Every test should **own its data** (a unique name/id, a namespace per run) and then **clean up** (teardown), or be isolated (transaction rollback at the integration layer). When running in parallel, avoid sharing a fixed record (user "test1") – otherwise you get race conditions (two threads competing for the same row) and flaky tests.

### Why not create data through the UI
- The UI is slow (many click steps, waiting for pages) → the suite balloons.
- A UI change breaks the setup step even when you are testing a different feature.
- A clean state is hard to guarantee. Example: to test "cancel order" you first have to click through 10 steps that create the order.

### Creating data through the API (recommended)
~~~java
// Fast setup via REST Assured (pseudocode)
String suffix = java.util.UUID.randomUUID().toString().substring(0,8);
String email = "qa+" + suffix + "@example.test"; // unique on every run

long orderId = given().header("Authorization","Bearer " + token)
    .contentType("application/json")
    .body("{\"customer\":\""+email+"\",\"items\":[{\"sku\":\"A1\",\"qty\":1}]}")
  .when().post("/orders")
  .then().statusCode(201).extract().path("id");

// ... run the test with orderId ...
// Teardown (if the system allows it)
given().header("Authorization","Bearer " + adminToken)
  .when().delete("/orders/" + orderId).then().statusCode(204);
~~~

### Isolation strategies when running in parallel
| Strategy | How it works | Fits | Notes |
|---|---|---|---|
| Unique data | UUID/timestamp inside name/email | Most API/UI e2e | The DB grows if nothing cleans up |
| Per-worker namespace | Each thread/worker gets a prefix | Parallel on the same environment | Needs an explicit convention |
| Create & delete inside the test | Setup + teardown per case | API tests | Teardown can fail → needs a cleanup job |
| Transaction rollback | {{@Transactional}} test, rollback afterwards | Integration in the same process (Spring) | Does not apply to UI e2e against a separate HTTP app |
| Isolated environment | One DB/schema/container per run | Strong integration | Heavier, usually backend |

### Cleanup (teardown)
- Clean up in {{@AfterEach}}/hooks; accept that teardown may not run when the test crashes.
- Add a job that deletes stale data by pattern ({{qa+*@example.test}} older than 24h), or reset staging on a schedule. **On test environments only.**
- Design it idempotent (running it twice is safe).

### Common mistakes
- Sharing one {{admin}} account across all parallel tests → sessions/orders get mixed together.
- Teardown that only runs when the test passes → leftovers make the next case fail.
- Hardcoded ids ({{orderId=123}}) that only exist in one environment.
- Creating lots of data and never deleting it → staging fills up, tests slow down.

### How to answer in an interview
State the principles: create through the API, unique per test, clean up or isolate. Give the UUID-suffix + chained-setup example. Say explicitly how you handle parallelism (worker prefix) and how you clean up when teardown fails.

> Senior tip: Treat test data as part of the test architecture. One "data factory" (a function that builds a canonical user/order) saves many hours spent fixing flaky data collisions – and it speeds up onboarding.`,
    follow: [
      'When the system has no API for creating data, how do you negotiate that with the devs or the architect?',
      'How do you handle sensitive data (PII) in a test environment?',
      'Does parallelism at class level versus method level change the data strategy?'
    ]
  },
  'autotest-010': {
    q: 'In UI automation, how do you handle iframes, multiple tabs/windows, file upload/download, and browser alerts/popups (Selenium)? Give the important caveat for each case.',
    a: `**Summary:** These situations are classic traps because the element lives **outside** the current context of WebDriver. **iframe** (an HTML page embedded inside another page): you must call {{switchTo().frame(...)}} before locating anything inside it, then {{switchTo().defaultContent()}} to get out. **Multiple tabs/windows**: manage **window handles** (the identifier of each window) and {{switchTo().window(handle)}}. **File upload**: usually {{sendKeys(absolute_path)}} to the {{input type="file"}} (never click the OS dialog). **Download**: configure the download folder of the browser profile and check that the file shows up (wait with a timeout). **JS alert**: {{switchTo().alert()}} then {{accept()/dismiss()}}.

### iframe
- An iframe (inline frame) has its own DOM. {{findElement}} on the main page **does not see** elements inside the iframe.
~~~java
driver.switchTo().frame("payment-iframe"); // by id/name, by index, or by WebElement
driver.findElement(By.id("card-number")).sendKeys("4111111111111111");
driver.switchTo().defaultContent(); // back to the main page
~~~
- Pitfall: nested iframes → switch step by step; forgetting {{defaultContent()}} makes the following step fail.

### Multiple tabs/windows
~~~java
String main = driver.getWindowHandle();
driver.findElement(By.id("open-report")).click(); // opens a new tab
var wait = new org.openqa.selenium.support.ui.WebDriverWait(driver, java.time.Duration.ofSeconds(10));
wait.until(d -> d.getWindowHandles().size() > 1);
for (String h : driver.getWindowHandles()) {
    if (!h.equals(main)) { driver.switchTo().window(h); break; }
}
// ... work in the new tab ...
driver.close();
driver.switchTo().window(main); // back to the main tab (very important)
~~~
- Pitfall: forgetting to switch back to main; a blocked popup means the handle count never grows.

### File upload
- The most stable way: send the file path to the {{input type="file"}} (it may even be hidden, depending on the app – be careful).
~~~java
import java.nio.file.Path;
Path file = Path.of("src/test/resources/fixtures/invoice.pdf").toAbsolutePath();
driver.findElement(By.cssSelector("input[type='file']")).sendKeys(file.toString());
~~~
- Avoid clicking the operating-system dialog (unstable, depends on the OS/headless mode). On Grid/remote you need {{LocalFileDetector}}.

### File download
- Plain Selenium has no API that reads the downloaded file directly. The usual approach: configure Chrome prefs so it downloads into a fixed folder, turn off "Save as", then check {{Files.exists()}} with a waiting timeout.
- Headless/CI: the folder must be writable; delete old files before the test so you do not match a stale one. Playwright has a more convenient built-in download API.

### Alert / confirm / prompt (native JS)
~~~java
var alert = wait.until(org.openqa.selenium.support.ui.ExpectedConditions.alertIsPresent());
alert.accept();   // OK (dismiss() for Cancel, sendKeys() for prompt)
~~~
- Tell apart a JS alert (native) from an HTML modal (a {{div}} element) – for an HTML modal you locate the element normally, without {{switchTo().alert()}}.

### Common mistakes
- Locating an element inside an iframe without switching → {{NoSuchElementException}}.
- Uploading by clicking the OS dialog on headless CI → hangs/fails.
- Asserting the download immediately → the file is not written yet; you must wait with a timeout.

### How to answer in an interview
Walk through each case with its core command (switch frame/window, sendKeys a path, accept the alert) and one pitfall per case. Emphasise headless/CI (paths, download folder).

> Senior tip: The "outside the ordinary DOM" cases (iframe, upload, download) are the ones that go flaky. Isolate them into helpers with explicit retry/timeout and detailed logging (handle count, frame name) so CI failures are quick to debug.`,
    follow: [
      'How does uploading a file on Selenium Grid (remote node) differ from uploading locally?',
      'How do you verify the content of the PDF/Excel file that was just downloaded, inside the test?',
      'In what way does an HTML modal that simulates an alert differ from a JS alert when automating?'
    ]
  },
  'autotest-011': {
    q: 'Why is logging in through the UI for every test case slow and easy to break? How do you speed it up by reusing a session/cookie or a storage state (Selenium/Playwright)? What security risks must be considered?',
    a: `**Summary:** Repeating a UI login for every test costs time (open the page, fill the form, wait for redirects, sometimes SSO/MFA) and adds breakage points (flakiness) that have nothing to do with the feature under test. Speed it up by **logging in once** and then reusing the authentication state: a **cookie/session** (Selenium: {{driver.manage().getCookies()/addCookie()}} after opening the right domain) or a **storage state** (Playwright: save cookies + localStorage into a file/context). Risks: leaked credentials/tokens in artifacts, shared sessions creating dependencies between tests, and losing coverage of the login flow if you keep no separate smoke test.

### The problem with a UI login per test
- 50 tests × 5 seconds of login = more than 4 minutes just for setup.
- Login depends on the network, SSO, CAPTCHA, rate limits → flaky.
- A test should focus on the behaviour it is meant to verify.

### Option 1: Reusing cookie/session (Selenium)
Log in once (UI or API), save the cookies, then inject them into a fresh browser before visiting a protected page.
~~~java
// 1) Log in once (UI or API) to get valid cookies
loginViaApi();
java.util.Set<org.openqa.selenium.Cookie> saved = driver.manage().getCookies();

// 2) Another test: open the right domain first (a cookie belongs to a domain)
 driver.get("https://app.example.test/404");
driver.manage().deleteAllCookies();
for (var c : saved) driver.manage().addCookie(c); // inject the session cookies
 driver.get("https://app.example.test/dashboard"); // straight to the page under test
~~~
- You must call {{get()}} on the domain before {{addCookie()}}. The {{HttpOnly/Secure/SameSite}} cookie flags can affect behaviour.

### Option 2: Storage state (Playwright – concept)
Save the state (cookies + localStorage) of a {{BrowserContext}} and load it into a new context.
~~~java
// Playwright Java (the idea)
BrowserContext ctx = browser.newContext();
Page page = ctx.newPage();
// ... log in once ...
ctx.storageState(new BrowserContext.StorageStateOptions()
    .setPath(java.nio.file.Paths.get(auth.json)));
// Another test
BrowserContext authed = browser.newContext(
    new Browser.NewContextOptions()
        .setStorageStatePath(java.nio.file.Paths.get(auth.json)));
~~~

### Option 3: Log in through the API and take the token
If the app uses Bearer tokens: call {{/auth/login}} to obtain a token and set the header on the test requests. Faster and more stable than the UI; you need to understand the auth mechanism of the app.

### Risks & mitigation
| Risk | Description | Mitigation |
|---|---|---|
| Leaked credential/token | {{auth.json}}/cookies committed or exposed in an artifact | Store in a CI temp folder, {{.gitignore}}, use secrets; limited TTL |
| Session expiry | The token expires in the middle of a run | Refresh the state; pick a TTL that fits the suite duration |
| Dependencies between tests | Test A changes user state and breaks test B | Each worker uses its own user; never share a mutable account |
| Login coverage lost | Nobody tests the login screen | Keep 1-2 separate UI login smoke tests |

### How to answer in an interview
Explain the cost and the flakiness of repeated UI logins. Mention cookie injection (Selenium), storage state (Playwright) or an API token. Bring up the security risks on your own, and mention keeping a smoke test for the login flow.

> Senior tip: Draw a clear line: a smoke test verifies that the **login flow** still works, while other business tests use a **prepared logged-in state** – fast, isolated, and still protected by one layer of coverage.`,
    follow: [
      'How do you handle an application that uses MFA (multi-factor authentication) – can MFA be automated?',
      'Is a storage state shared between parallel tests safe when tests change the user profile?',
      'How do you store and refresh auth state in CI without exposing secrets?'
    ]
  },
  'autotest-012': {
    q: 'What value does BDD with Cucumber (Gherkin) bring, and when does it turn into a burden? Write an example of a good Gherkin scenario (short, behaviour-focused) and point out the anti-patterns people hit all the time.',
    a: `**Summary:** **BDD** (Behavior-Driven Development – development driven by the behaviour you expect) uses language close to natural speech to describe behaviour, which gives dev/QA/BA a **shared understanding**. **Cucumber** executes **Gherkin** scenarios (Given/When/Then) that map onto step definitions (Java code). The value: living documentation of the important business behaviour, and agreement on the acceptance criteria. It becomes a burden when Gherkin is written as a detailed UI-click script, when the team does not maintain it together, or when BDD is used for every case including technical ones – that adds a redundant "translation" layer and heavy maintenance.

### Gherkin basics
{{Feature}} groups a capability. {{Scenario}} is one case. {{Given}} (precondition), {{When}} (action), {{Then}} (outcome). A step definition (Java) executes each step.

### A good scenario (behaviour, not tied to the UI)
~~~gherkin
Feature: Applying a discount code
  Scenario: A valid code takes 10% off an eligible order
    Given the customer has a cart worth 1,000,000 VND
    And the discount code "SAVE10" is still valid for orders from 500,000 VND
    When the customer applies the code "SAVE10"
    Then the total after the discount is 900,000 VND
    And the code "SAVE10" is recorded as used
~~~
A BA/QA/dev can read it; it never says "click the button with id=btn-23".

### Anti-patterns (the burden)
| Anti-pattern | Example | Why it is bad |
|---|---|---|
| Tied to UI/implementation | "When click id=btn-23..." | Breaks whenever the UI changes; loses the business meaning |
| Too many detailed steps | 20 steps per case | Hard to read, hides the intent |
| Used for every test | Technical unit/API tests written in Gherkin too | Redundant translation layer; JUnit/REST Assured is already clear |
| Nobody reads/maintains it | Written "just to have BDD" | Produces no shared understanding, only adds debt |
| Fat/duplicated step defs | Complex logic inside a step | It should call a service/API/page helper |

### When it pays off / when to avoid it
- **Pays off:** business rules that need BA/PO agreement; important acceptance criteria; complex domains (finance).
- **Avoid:** a small all-dev team with no BA; technical cases (contract, performance); a UI that keeps changing with no discipline to separate the layers.

### Java in practice
Cucumber-JVM + JUnit Platform. Step definitions call the **service/API layer** or a thin page object – keep Gherkin at the behaviour level.
~~~java
@When("the customer applies the code {string}")
public void applyVoucher(String code) {
    response = cartApi.applyVoucher(cartId, code); // calls the API, does not click the UI
}
~~~

### How to answer in an interview
State the value (shared understanding, living acceptance criteria) and the conditions needed to succeed. Point out the anti-patterns (detailed UI, overuse). Conclude: use BDD **selectively** for high-value business cases; technical tests use JUnit/REST Assured directly.

> Senior tip: A good Gherkin scenario answers "what must the system do", not "where does the test click". If a feature file reads like instructions for moving a mouse, you are writing an automation script wearing a BDD costume – raise the language to the business level.`,
    follow: [
      'How do you organise step definitions so they are reusable without creating "God steps"?',
      'How does Scenario Outline differ from Scenario, and when do you use it?',
      'How do you convince a team to drop Gherkin for the groups of tests where it does not fit?'
    ]
  },
  'autotest-013': {
    q: 'How do you design an automatic test report (for example Allure) so that a failure carries enough information to debug? How do you attach screenshots, video/trace, and request-response logs?',
    a: `**Summary:** A test report lets the team know **what was run, where it passed or failed, and why it failed**. **Allure** is a popular reporting framework: you add {{@Step}}, {{@Description}}, {{@Attachment}} (screenshot, log, video, trace) to the test so a failure comes with evidence you can debug quickly. Best practice: **attach artifacts automatically on failure** (UI screenshot, page source, API request/response log, Playwright trace), keep them where CI can collect them, and keep the report lean (never log sensitive data). A good report shortens the time spent separating a flaky test from a real bug.

### Why you need artifacts on failure
A test that fails on CI (a headless environment, running in parallel) is very hard to reproduce when all you have is a stack trace. A screenshot shows what state the UI was in; video/trace shows the sequence of actions; an API log shows the request/response that actually went over the wire.

### Allure: the main concepts
- **Install the adapter** that matches your runner (JUnit 5/TestNG). Configure the {{allure-results}} output.
- Annotations: {{@Epic/@Feature/@Story}} (classification), {{@Step}} (splits the test into steps in the report), {{@Description}}, {{@Severity}}.
- Attachments: attach bytes/String/file (PNG image, text, JSON).

~~~java
import io.qameta.allure.*;

@Feature("Payment")
class PaymentTest {

    @Test
    @Story("Card payment is declined")
    @Description("Shows an error message when the card is declined")
    void cardDeclined_showsError() {
        openCheckout();
        payWithCard("4111-DECLINED");
        assertErrorVisible(); // if this fails, the hook takes a screenshot
    }

    @Step("Open the checkout page")
    void openCheckout() { /* ... */ }

    @Attachment(value = "Screenshot", type = "image/png")
    public byte[] saveScreenshot(byte[] png) { return png; }
}
~~~

### Attaching automatically on failure (JUnit 5 + Selenium, the idea)
~~~java
import org.junit.jupiter.api.extension.*;
import org.openqa.selenium.*;

public class ScreenshotOnFailure implements TestWatcher {
    @Override
    public void testFailed(ExtensionContext ctx, Throwable cause) {
        WebDriver driver = /* get the driver from the context/test instance */;
        if (driver instanceof TakesScreenshot ts) {
            byte[] png = ts.getScreenshotAs(OutputType.BYTES);
            // call an @Attachment method or Allure.addAttachment
            io.qameta.allure.Allure.addAttachment("Failure screenshot", "image/png",
                new java.io.ByteArrayInputStream(png), "png");
        }
    }
}
// Register it: @ExtendWith(ScreenshotOnFailure.class)
~~~
- With Playwright: screenshot/video/trace are built in; attach the trace file ({{.zip}}) to the CI report.

### What to attach (pick with care)
| Artifact | When | Notes |
|---|---|---|
| Screenshot | UI failure | Capture at the exact moment of failure; hide/drop PII if present |
| Page source/DOM | Hard-to-diagnose UI problems | Can be large; only when needed |
| API request/response | REST test failure | **Mask** tokens, passwords, PII |
| Browser console/network log | Frontend errors | Depends on the tool (CDP/Playwright trace) |
| Video/trace | Important or flaky cases | Consumes storage; can be enabled only on retry/failure |

### Common mistakes
- Only a stack trace, no screenshot/log → wasted time asking "what did CI see on screen?".
- Attaching everything for every passing test → heavy reports, CI disk full.
- Logging secrets/tokens/PII into Allure → security risk.

### How to answer in an interview
Say that Allure structures the report plus attachments. Stress "attach automatically on failure" (screenshot, request/response with masking). Give an example of the hook/listener you use and how CI publishes the report.

> Senior tip: A report is a **debugging tool**, not a formality. One screenshot taken at the right failure moment plus a masked request/response is usually worth more than hundreds of log lines – optimise for time-to-diagnosis.`,
    follow: [
      'How do you mask sensitive data in attachments/logs while keeping enough information to debug?',
      'When should video/trace be on for every test, and when only on failure or retry?',
      'How do you publish the Allure report in CI (GitHub Actions/Jenkins) so the team can view it easily?'
    ]
  },
  'autotest-014': {
    q: 'How do you run automation tests in CI (GitHub Actions or Jenkins)? Cover these issues: headless, installing browser/driver, storing artifacts (report/screenshot/log), splitting smoke vs regression, and gating the merge.',
    a: `**Summary:** Running automation in CI (Continuous Integration – the system that builds and tests automatically whenever code is pushed) needs a **headless** environment (a browser that opens no graphical window), the correct browser/driver installed, secret management, and **artifact** configuration (keeping the result files: report, screenshot, log) so you can debug failures. CI usually means GitHub Actions or Jenkins: checkout code → set up the JDK → install browser dependencies → run the tests (Maven/Gradle) → upload artifacts → (optionally) gate merge/PR when a failing test must block it. You need to control duration, stability (flakiness) and suite splitting (smoke vs regression).

### Headless and the CI environment
- **Headless**: run the browser with no interface, which fits CI machines (they have no display). Chrome/Firefox support headless; Selenium/Playwright have matching configuration for it.
- Install system dependencies (the Linux libraries Chrome needs) or use a container image that already ships browsers (the Playwright image, a Selenium image).
~~~yaml
# GitHub Actions (illustrating the idea, shortened)
name: UI Tests
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: 'temurin', java-version: '17' }
      - name: Run tests
        run: mvn -B test -Dheadless=true
      - name: Upload Allure results
        if: always()              # still upload on failure, for debugging
        uses: actions/upload-artifact@v4
        with:
          name: allure-results
          path: target/allure-results
~~~
(Note: real YAML needs exact indentation; this example only illustrates the structure.)

### Artifacts and logs
- **Artifact**: a file kept after the job finishes (report, screenshot, surefire XML). Use {{if: always()}} so the upload happens even when the tests fail.
- Never upload secrets; mask the logs.

### Gating the merge
- Make the test job a **required status check** on the PR → it cannot merge while the job fails.
- Layer the runs: PRs run quick smoke/API; nightly runs the full UI regression. Do not make a PR wait 60 minutes on flaky-prone UI.

### Jenkins (the equivalent concepts)
- A pipeline (Jenkinsfile) with stages: Checkout, Build, Test, Archive artifacts ({{junit}}, {{allure}}). It runs on an agent that has a browser/container available.

### Stability on CI
- Conditional waiting, isolated data, no dependence on execution order.
- Controlled retry (rerun failed) only to damp infrastructure noise, and still track the frequently flaky tests so you fix the root cause.
- Cap parallelism at what the agent resources can handle.

### Common mistakes
- Running headed (with a GUI) on an agent that has no display → the browser fails to start (you need headless or Xvfb).
- Missing {{if: always()}} on the artifact upload → the job failed and there is no screenshot left to look at.
- One shared staging environment for every parallel PR → data collisions.
- Hardcoded URLs/credentials in the repository.

### How to answer in an interview
Describe the pipeline: trigger → setup → run headless → upload artifacts → gate merge. Name the difference between smoke (PR) and regression (nightly). Give an example of how you deal with flaky tests on CI (stabilise the waits/data, not just switch retry on).

> Senior tip: CI is only valuable when its signal is trustworthy. A UI suite that "goes red at random" gets ignored by the team, which is worse than having no tests at all – invest in stability and layering before you scale up the number of cases.`,
    follow: [
      'How do you handle secrets (passwords, tokens) safely in a CI pipeline?',
      'When UI tests are too slow for a PR, how do you design a layered execution strategy?',
      'How do you use retry in CI without hiding genuinely flaky tests?'
    ]
  },
  'autotest-015': {
    q: 'You are a Java developer with 4 years of experience who wants to move into an SDET/automation role: which skills do you need to make up for, what does a 3–6 month roadmap look like, and what are the career benefits and risks? Give a balanced view of the Vietnamese market (without inventing specific salary figures).',
    a: `**Summary:** A Java dev with ~4 years moving into **SDET/automation** (Software Development Engineer in Test – an engineer who writes code to test automatically and builds quality tooling) has the advantage of a programming foundation: OOP, Git, CI. What must be made up: a testing mindset (risk-based thinking, test design), UI/API automation tooling (Selenium/Playwright, REST Assured), dealing with flaky tests, and the communication skills to talk about quality with the team. A 3–6 month roadmap should follow real projects: API tests → UI with good POM/waits → CI/reporting → understanding the quality pipeline. Career-wise: closer to engineering, more influence on product quality, but you must actively avoid being seen as someone who "only writes scripts" by contributing a framework, a test strategy and mentoring. The Vietnamese market does have demand for QA automation/SDET in products and in outsourcing; the level and the opportunities differ a lot by company, domain and English – **avoid inventing specific salary figures**, survey it yourself at the time.

### How does an SDET differ from a dev and from a manual QA?
- **Manual QA**: tests by hand, explores, designs cases. May not write code.
- **Dev**: builds product features.
- **SDET**: uses dev skills to build automation, frameworks, test tooling and CI integration, and sometimes takes part in designing the **testability** (how easily the system can be tested) of the system. Where the line sits depends on the company.

### Skills to make up (from a Java dev with 4 years)
| Group | You may already have | Needs making up / practising |
|---|---|---|
| Programming | Java core, OOP, collections | Writing clean tests, abstraction for a framework, debugging async/timing |
| Testing | Basic unit tests | Test design (equivalence, boundary), risk-based, exploratory mindset |
| UI automation | Little or none | Selenium 4/Playwright, durable locators, waits, POM, handling flakiness |
| API automation | Knows REST | REST Assured, auth, schema, data setup |
| CI/CD | Knows Git | Test pipeline, headless, artifacts, merge gating, Allure |
| Quality & communication | Varies | Discussing risk with dev/PO, prioritising the ROI of automation |

### A 3–6 month roadmap (practical)
1. **Month 1:** consolidate test design + JUnit 5; write REST Assured tests against a real or simulated API (CRUD, auth, schema assertions). Goal: an API suite running in CI.
2. **Month 2:** basic UI automation (pick Playwright or Selenium) for 3-5 critical flows; learn locators, waits, POM, handling upload/iframe at a basic level. Goal: stable tests with little flakiness.
3. **Month 3:** raise the quality bar: data through the API, login state reuse, Allure + screenshot on failure, headless runs on GitHub Actions/Jenkins. Goal: a report you can actually debug from.
4. **Months 4-6:** expand selectively (parallelism, Grid/parallel, contract/mocks such as WireMock where it fits), take part in testability reviews, contribute to the framework and team guidelines. Goal: create value beyond "writing more scripts".

~~~text
Java dev (4y) --add a test mindset--> API automation --> UI + POM/waits
      --> CI/report/stability --> SDET contributing framework & strategy
~~~

### Career benefits / risks (balanced)
- **Benefits:** it uses your coding background; the role sits between dev and quality; you learn system architecture from the testing angle; you can grow into SDET lead, quality platform work, or back into dev with a good quality mindset.
- **Risks:** being handed nothing but maintenance of flaky scripts; being undervalued in companies that measure only the "number of test cases"; UI technology changes fast and demands continuous learning. Lower the risk by tying automation to **value** (fewer regressions, shorter feedback loops) and by building framework competence.

### The Vietnamese market (balanced, no invented numbers)
- Demand for automation/SDET shows up in product companies, fintech, e-commerce, and in outsourcing for international clients; the requirements usually include Java or another language, Selenium/Playwright, API, CI, and sometimes communicative English.
- Compensation, seniority and opportunity **vary strongly** by company, domain, location and point in time. Survey it yourself through job descriptions (JD), real interviews and up-to-date market sources – **do not lean on salary numbers heard second-hand when answering in an interview**.

### How to answer in an interview
Name the strengths (4 years of Java + programming) and the gaps (test design, automation tooling, flaky/CI). Present a 3-6 month roadmap with measurable milestones. Discuss benefits and downsides in a balanced way and how you create value (ROI, stability). About the Vietnamese market: answer realistically and do not invent salaries.

> Senior tip: When switching roles, do not introduce yourself as "someone who knows Selenium". Introduce yourself as "an engineer who uses code to reduce release risk" – that framing directs you to learn the right things: strategy, stability, CI, and collaboration with the team.`,
    follow: [
      'In your first 30-60-90 days as an SDET on a new team, what do you prioritise?',
      'How do you prove the value of automation to management (not just by reporting the number of test cases)?',
      'If the team only wants you to write scripts for manual cases, how do you respond and steer it?'
    ]
  },
  'autotest-016': {
    q: 'You join a team of 10 QAs that has no automation and you are asked to design the framework from scratch. Describe the main layers, how configuration works, why DriverFactory uses ThreadLocal, and how reporting is genuinely useful.',
    a: `**Summary:** An automation framework (a framework for automated testing) is a set of tools, conventions and code that lets QAs write, run and maintain tests effectively, instead of each person doing it their own way. For a team of 10 QAs you split it into clearly separated layers: config (configuration: which browser, environment URL, wait times), DriverFactory (creates and manages the browser driver, using ThreadLocal so every test thread has its own browser), Page Object (a class describing one page: locators and actions), tests (the verification scenarios), reporting (result reports, for example Allure). Each layer solves one problem, which avoids mixed-up code that becomes unmaintainable as the team grows.

### Config: all configuration in one place
Config is where the information needed to run a test is read (Chrome or Firefox, the URL of the test environment, timeouts, test accounts). Instead of hardcoding (writing fixed values straight into the test) a URL or a username, config reads them from a properties file or from environment variables. That way the same suite runs on a dev machine, on staging or on CI just by changing the configuration file, with no code edit. Example: a config file with the keys browser=chrome, baseUrl=https://staging.example.app.

### DriverFactory and ThreadLocal
DriverFactory is the single class that creates the browser driver. In Playwright or Selenium every test should use its own driver/BrowserContext instance so tests cannot affect each other. When running in parallel (many tests at once on many threads), sharing a static driver means two tests operate the same browser → they block each other and the run hangs. ThreadLocal is a Java mechanism that keeps a separate value for each thread: every test thread takes its own driver, nothing is shared. Example: thread A opens Chrome for the login test, thread B opens a different Chrome for the payment test, and the two threads stay independent.

### Page Object (POM)
A Page Object is a class that holds the locators (how to find an element) and the actions (typing, clicking) of one page, while the test only calls actions and asserts the result (checking that the outcome matches the expectation). When the login button changes its id, you fix the Page Object in one place instead of a dozen tests. The test reads like a scenario: loginPage.login(user, pass); assert dashboard.isLoaded().

### Reporting
Reporting uses Allure so that a failure comes with a screenshot, a log and the run duration, which lets the team debug fast. Allure combines the {{@Step}} annotation to split the test into steps and {{@Attachment}} to attach images when something fails.

### Example DriverFactory structure (Java)
~~~java
public class DriverFactory {
    private static final ThreadLocal<BrowserContext> context = new ThreadLocal<>();
    public static BrowserContext get() { return context.get(); }
    public static void set(BrowserContext c) { context.set(c); }
}
~~~
BrowserContext (Playwright) is an isolated working session, like a brand-new browser window, with its own cookies and localStorage. ThreadLocal guarantees that each test thread gets its own context.

### Common mistakes
- Hardcoded URLs/passwords in tests → hard to run on several environments, plus a security risk.
- A static driver shared by all tests → random failures when running in parallel.
- No reporting → a failure on CI leaves only a stack trace and nobody knows what was on screen.

### How to answer in an interview
Name the 5 layers, explain that ThreadLocal protects isolation (keeping runs separate) during parallel execution, that config is separated from code, and that reporting makes debugging possible. Give an example of a framework you designed or improved. Conclude: a framework is valuable because tests are quick to write, run stably, and when one fails other people understand the reason immediately.

> Senior tip: Do not build a giant framework before the first test exists. Start with 2-3 critical tests, then extract the duplication into reusable layers when the team actually needs it.`,
    follow: [
      'How do you organise a shared BasePage (driver, waits, logging) without turning it into a God class?',
      'Should you use the Page Factory of Selenium (@FindBy), and what are its pros and cons?',
      'Should config come from environment variables or from a properties file – which do you pick for CI?'
    ]
  },
  'autotest-017': {
    q: 'In what ways does running automation tests in parallel with Playwright (Browser/Context/Page per thread, Docker image, CI sharding) differ from Selenium Grid 4? Why must tests be independent before they can run in parallel?',
    a: `**Summary:** Running in parallel means running many tests at the same time to shorten the suite. Playwright has a three-level model: Browser (the browser itself, heavy to start), BrowserContext (an isolated working session, like a new window, lightweight), Page (one tab). Each test should use its own BrowserContext, and the contexts run on separate threads. The Playwright Docker image already has the browsers installed, so CI behaves like the dev machine. Sharding (splitting into pieces) means dividing the suite into parts that run in different CI jobs. Selenium Grid 4 has a Router/Distributor/Node architecture that distributes tests across nodes. Tests must be independent (no shared data, no reliance on the result of another test) before they can run in parallel safely; otherwise two tests edit the same order → random failures.

### The three Playwright levels
- **Browser**: a browser instance (Chrome/Firefox/WebKit), expensive to start in resources, usually started once for the whole suite.
- **BrowserContext**: an isolated working session that has its own cookies, localStorage and storage. Lightweight, quick to create, closed when the test is done. Each test uses one context.
- **Page**: one tab inside a context, where you manipulate the DOM.

Example where each test creates its own context:
~~~java
BrowserContext ctx = browser.newContext();
Page page = ctx.newPage();
// ... run the test ...
ctx.close(); // clean up after each test
~~~

### ThreadLocal and parallel execution
With a Java test runner (JUnit/TestNG), tests can run on several threads. Each thread needs its own BrowserContext so they do not collide. Store the context of the current thread in a ThreadLocal, and each test takes its own context. If you share a static context, two tests press buttons on the same page → wrong results.

### Docker image and sharding
Playwright publishes a Docker image with the browsers and their dependencies already installed. CI pulls the image and runs the tests inside the container → a consistent environment. Sharding: split the suite into N pieces (for example --shard 1/3, 2/3, 3/3) and run them on 3 different CI jobs, which cuts the total duration by close to 3 times.

### Comparison with Selenium Grid 4
Selenium Grid 4: the Router receives requests, the Distributor picks a suitable Node, and the Node runs the browser. It supports Docker and is well observable. It fits when you need many different browsers or many operating systems. Playwright parallelises well on modern web apps, needs fewer complicated drivers and has strong auto-wait. Pick Grid if you need real Safari or legacy systems; pick Playwright if a Java team wants less flakiness and traces that are easy to debug.

### Why tests must be independent before going parallel
If test A creates an order and test B deletes that same order, running them in parallel collides on data. The rule: each test creates its own data (through the API), deletes it when done (teardown), and does not rely on state produced by another test. Then running 1 test or 100 tests at once gives the same result.

### Common mistakes
- Sharing a static driver/context between parallel tests → failures bleed into each other.
- Tests using fixed data (a hardcoded user test1) → race conditions when parallel.
- Unbalanced sharding (one job holds all the slow tests) → total duration does not drop.

### How to answer in an interview
Present the Browser/Context/Page model, ThreadLocal isolation, the Docker image, sharding, and the comparison with Grid 4. Emphasise that data independence is the prerequisite. Give an example of flakiness caused by shared data that you fixed.

> Senior tip: Parallelising only helps when the tests are truly independent. Fix the flaky ones and separate the data before you raise the number of workers; otherwise you are simply running faster in order to fail faster.`,
    follow: [
      'How does BrowserContext isolate tests compared with restarting the browser for every test?',
      'In Selenium Grid 4 Router/Distributor/Node, what does each role actually do?',
      'When would you pick Playwright over Selenium Grid 4 for a Java team?'
    ]
  },
});
