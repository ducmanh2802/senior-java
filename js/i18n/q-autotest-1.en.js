/*
 * English translation of js/data/q-autotest.js — task T743. Format: js/core/i18n.js (content overlay).
 * ids: autotest-001 autotest-002 autotest-003 autotest-004 autotest-005 autotest-006 autotest-007 autotest-008
 */
App.i18n.content({
  'autotest-001': {
    q: 'In a web project, which type of test do you automate first (unit, API, UI) to get the best ROI? Compare the test pyramid and the testing trophy in the context of automation testing, and explain how you choose a strategy for a team with both devs and QA.',
    a: `**Summary:** The ROI (return on investment) of automation is usually highest at the **unit and API/integration** layers and lowest at UI end-to-end (E2E, running all the way from the user interface to the real system). The test pyramid recommends a wide base (many unit tests) – a narrow top (few UI tests); the testing trophy (a more modern view popularized by Kent C. Dodds) emphasizes the **integration** layer as the highest value. For a dev + QA team, the pragmatic strategy is: devs keep unit/integration tests close to the code, QA focuses on API automation and a small set of UI E2E tests for critical business flows.

### Why choosing the right thing to automate matters
Automation (running tests by program instead of manual clicking) costs time to write, maintain, and run in CI (Continuous Integration – the system that builds/tests on every push). Automating the wrong layer produces slow, flaky (pass/fail randomly) tests that get ignored. The goal is to catch bugs early at the lowest cost.

### Test pyramid vs testing trophy
| Aspect | Test pyramid | Testing trophy |
|---|---|---|
| Original idea | Mike Cohn; many small, fast tests at the base | Kent C. Dodds; prioritize integration |
| Thickest layer | Unit tests (each function/class tested alone) | Integration (many parts wired together) |
| UI E2E | Very few, only critical flows | Few, but not dismissed |
| Strength | Fast feedback, good fault isolation | Catches integration-boundary bugs, close to real behavior |
| Risk | Too many mocked units → miss integration bugs | Integration is slower, needs stable environment |
| Fit for UI automation | Limit UI E2E | Also limits UI E2E, but accepts more API/integration |

ASCII sketch:
~~~text
    Pyramid:          Trophy:
       /             (E2E)
      /UI            /----    /----          / INTE    <- thick
    / INTE         / GRATION  /--------       --------/
  /   UNIT           (UNIT)
  /------------       (STATIC)
~~~

### ROI priority (practical for Java web)
1. **Unit tests** (written by devs): fast (milliseconds), run on every commit, low maintenance cost. High ROI for business logic (pricing, authorization).
2. **API automation** (written by QA/SDET, using REST Assured): independent of UI, more stable than UI, faster than browser E2E, covers core business flows. Usually the "sweet spot" ROI for QA.
3. **UI E2E** (Selenium/Playwright): needed for critical end-to-end flows (login, order, payment) but slow, flaky-prone, costly when UI changes. Keep the count small and selective.

### Concrete example (illustrative numbers)
For an "order placement" flow: 200 unit tests run in 20 seconds; 50 API tests run in 2 minutes; 10 UI E2E run in 15 minutes with 2 flaky. If the team has only 30 minutes of CI budget, adding 5 more UI tests may push CI too long and add noise; investing in 20 API tests covering discount/stock rules gives higher value.

### Choosing a strategy for a dev + QA team
- **Simple RACI:** devs own unit + tests close to code; QA/SDET owns the API suite and UI smoke (quick check of critical flows).
- **UI selection rule:** automate only high-revenue/high-risk flows that run frequently and whose UI is relatively stable. Exploratory testing still done by humans.
- **Measure ROI:** track run time, flaky rate, bugs caught before release. Cut automation with negative ROI.

### Common mistakes
- Automating every manual test case, including rare ones → maintenance overload.
- Inverted pyramid (ice-cream cone): too much UI, little unit/API → slow, flaky CI.
- No owner → broken tests nobody fixes, eventually disabled.

### How to answer in an interview
State clearly: "I prioritize unit and API first because they are fast, stable, and high ROI; UI E2E only for critical flows. I lean toward pyramid or trophy depending on context – for integration-heavy web I lean toward trophy (thick API/integration). With a dev+QA team I split ownership and use flaky/time metrics to adjust." Give real numbers or experience.

> Senior tip: Do not argue dogmatically about pyramid vs trophy. Use your pipeline data (time, flaky rate, defect leakage – bugs reaching production) to decide which layer needs more investment, and be willing to delete automation with negative ROI.`,
    follow: [
      'A UI test is flaky repeatedly: do you fix, quarantine, or delete it? What criteria decide?',
      'How do you measure "defect leakage" to know whether the team automation strategy works?',
      'When moving from manual to automation, where do you start in the first sprint?'
    ]
  },
  'autotest-002': {
    q: 'How does Selenium 4 work internally: what mechanism controls the browser (W3C WebDriver protocol), the role of the driver binary, and what does Selenium Manager help with? Compare with Selenium 3 (JSON Wire Protocol).',
    a: `**Summary:** Selenium WebDriver controls the browser by sending HTTP commands following the **W3C WebDriver protocol** (an open standard defining endpoints like /session, /element, /click). Test code calls the WebDriver API → the client library turns it into an HTTP request → the **driver binary** (chromedriver, geckodriver – the intermediary program provided by the browser vendor) translates the command into native browser actions. Selenium 4 speaks W3C natively (more stable), while Selenium 3 mainly used the **JSON Wire Protocol** (older, not fully standardized). **Selenium Manager** (built in from Selenium 4.6+) auto-downloads and configures the matching driver/browser, reducing version-mismatch errors.

### Overall picture: components
~~~text
[Java test code]
      |
      v
[Selenium Client (WebDriver API)]  -- HTTP (W3C WebDriver) -->
      |                                                 |
      |                                          [Driver binary]
      |                                          chromedriver / geckodriver
      |                                                 |
      |                                          [Browser engine]
      v                                                 v
  result/assert                                    Chrome / Firefox
~~~
- **Client library** (selenium-java): provides classes like {{ChromeDriver}}, {{WebElement}}. It does not control the browser directly; it sends requests.
- **Driver binary:** the bridge. Each browser has its own driver because engines differ. The driver understands W3C commands and calls the browser's internal APIs.
- **Browser:** actually executes (rendering, JS, events).

### What is the W3C WebDriver protocol
- An **open web standard** (W3C Recommendation) describing how to automate browsers over HTTP + JSON. Examples: {{POST /session}} creates a session; {{POST /session/:id/element}} finds an element; {{POST /session/:sessionId/element/:elementId/click}} clicks.
- Because it is a standard, browsers/drivers implement the same "language" → Selenium scripts run across browsers (cross-browser) when they follow the API.
- Selenium 4 communicates **native W3C**: less translation back and forth, fewer behavioral differences between drivers.

### Selenium 3 vs Selenium 4
| Aspect | Selenium 3 | Selenium 4 |
|---|---|---|
| Main protocol | JSON Wire Protocol (old, not fully W3C) | W3C WebDriver protocol (standard) |
| Driver compatibility | Client sometimes encodes/decodes between two protocols | Direct W3C communication, more stable |
| Driver management | Usually external lib (WebDriverManager) or manual download | **Selenium Manager** built in (auto-resolves driver/browser) |
| New features | Limited | Relative locators, better Actions, better CDP/BiDi support, redesigned Grid 4 |
| Grid | Old Hub/Node architecture | Grid 4: Router/Distributor/Node, Docker support, observability |

Note: "CDP" (Chrome DevTools Protocol) and "WebDriver BiDi" (new bidirectional protocol) are additional mechanisms for advanced features (network interception, console logs). They do not replace W3C WebDriver for basic control.

### Selenium Manager
- Old problem: Chrome updates constantly → chromedriver must match the browser version; mismatch causes "session not created". Teams had to download drivers manually, set PATH, or use a third-party library.
- Selenium Manager: a component shipped with Selenium; when creating a driver it **detects the installed browser**, determines the matching version, downloads the driver (and browser if needed), and configures it. Enables "just works" on fresh dev/CI machines.
- You can still override (specify driver path) in special environments.

### Minimal Java example (Selenium 4)
~~~java
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;

public class Demo {
    public static void main(String[] args) {
        // Selenium Manager handles the driver if not configured manually
        WebDriver driver = new ChromeDriver(); // opens a browser session (POST /session)
        try {
            driver.get("https://example.com"); // navigate
            String title = driver.getTitle();  // query state via W3C
            driver.findElement(By.id("login")).click(); // find + click
            System.out.println(title);
        } finally {
            driver.quit(); // close session, free resources
        }
    }
}
~~~

### Common mistakes
- Browser/driver version mismatch (even with Selenium Manager, CI with restricted network cannot download drivers) → session init failure.
- Forgetting {{quit()}} → browser/driver processes hang, wasting RAM on CI.
- Confusion: Selenium does not "see the screen like a person"; it sends protocol commands; if an element is covered/animating, a click can fail even if a human sees it.

### How to answer in an interview
Present the chain: "Java test → Selenium client → HTTP W3C WebDriver → driver binary (chromedriver/geckodriver) → browser". Emphasize Selenium 4 standardizes on W3C (dropping JSON Wire) and Selenium Manager solves driver version matching. Mention a real error you hit (version mismatch) and how you handled it.

> Senior tip: When debugging intermittent failures, remember the many layers: test, client lib, driver, browser, network, app. Enable verbose driver logs (e.g. chromedriver verbose) and understand which W3C command is being sent – that localizes faster than staring at test stack traces.`,
    follow: [
      'When do you need Selenium Grid 4, and what do Router/Distributor/Node do?',
      'Selenium Manager cannot download the driver in CI (restricted network): how do you handle it?',
      'How does WebDriver BiDi differ from one-way W3C WebDriver, and what capabilities does it unlock?'
    ]
  },
  'autotest-003': {
    q: 'Compare Selenium, Playwright, and Cypress in terms of architecture, auto-wait mechanism, multi-browser/multi-language support, and parallel execution. When do you choose which for a Java enterprise project?',
    a: `**Summary:** **Selenium** uses the W3C WebDriver protocol via a driver binary (very broad multi-language, multi-browser, large ecosystem) but auto-wait must be managed manually. **Playwright** (Microsoft) controls the browser via the browser's native protocol, with strong **auto-wait**, tracing/debugging, support for Chromium/Firefox/WebKit, and an official Java port. **Cypress** runs tightly coupled to the browser event loop and is mainly JavaScript/TypeScript – less suitable for pure Java teams. Choose based on team stack, cross-browser needs, stability/flakiness, and CI.

### Quick comparison
| Aspect | Selenium 4 | Playwright (Java) | Cypress |
|---|---|---|---|
| Architecture | Client → HTTP W3C → driver → browser | Client → native browser protocol | Runner coupled to browser event loop (JS) |
| Languages | Java, C#, Python, JS, Ruby… | JS/TS, Python, Java, .NET | Mainly JS/TS |
| Browsers | Chrome, Firefox, Edge, Safari (via driver) | Chromium, Firefox, WebKit | Chrome family, Firefox, Edge |
| Auto-wait | Needs explicit/fluent waits | Auto-waits until element actionable | Auto-retry/wait in many commands |
| Multi-tab/context | Via window handles | Browser context/page well isolated | Limited depending on scenario |
| Parallel | Grid / runner parallel | Good parallel workers | Split specs / extra services |
| Network mock/trace | Extra libs/CDP | {{page.route()}}, built-in trace viewer | {{cy.intercept()}} |
| Fit for Java enterprise | Very familiar | Good for new projects, reduces flakiness | Limited for Java-only teams |

### Auto-wait and flakiness
- **Flaky** (passes/fails randomly due to timing/environment): a major cause is acting before the element is ready.
- Selenium: {{findElement}} may find the DOM node before it is clickable (covered/animating) → need **explicit wait**.
- Playwright: {{click()/fill()}} auto-waits for actionability → reduces timing flakiness. Still must wait for business conditions (API done).
- Cypress: retry/assertion helps, but the async model differs.

### When to choose (Java enterprise)
- **Selenium:** large existing framework, legacy, multi-language, Grid already in place. Invest in standardizing waits/locators.
- **Playwright for Java:** new project, need to reduce flakiness, trace/network mocking, isolated tests. Fits modern web.
- **Cypress:** when JS frontend leads; usually not preferred for pure Java teams.

### Common mistakes
- Choosing by trend, ignoring team skills/migration cost.
- Blind trust in auto-wait: race conditions still happen with slow APIs/websockets.
- Judging only by demos; test real cases with auth, upload, tables.

### How to answer in an interview
Compare by architecture, auto-wait/flakiness, cross-browser, team fit, debug/CI. Conclude with a context-aware decision and trade-offs.

> Senior tip: The tool only reduces part of the flakiness. Isolated test data, durable locators, and waiting for the right business condition determine stability – evaluate how tests are written, not just the tool.`,
    follow: [
      'How does a Playwright browser context isolate tests?',
      'If you must test on real Safari, how do Selenium and Playwright respond?',
      'How do you migrate gradually from Selenium to Playwright without blocking releases?'
    ]
  },
  'autotest-004': {
    q: 'How do you choose durable locators (ways to identify elements on a page) for UI tests? Compare id, CSS selector, XPath, and data-testid; how do you coordinate with developers to add data-testid?',
    a: `**Summary:** A durable locator **changes little when the UI layout changes** and reflects the **intent** of the element (login button) rather than fragile structure (the 3rd div). Priority: {{data-testid}} (or data-test) dedicated to tests → stable id/name → short meaningful CSS selector → avoid long structure-dependent XPath. Coordination with devs: agree on a naming convention for {{data-testid}}, add it to components, treat it as a "contract" for tests.

### What a locator is
Automation (Selenium/Playwright) must **find the right element** (button, input) to interact with. A locator is the "address": by id, CSS (a language for selecting web elements), XPath (a query language over the HTML tree), or a custom attribute.

### Comparison
| Type | Example | Pros | Cons | Durability |
|---|---|---|---|---|
| id | {{By.id("email")}} | Fast, clear | Durable only if devs keep it stable; dynamic ids change | High if stable |
| name | {{By.name("username")}} | Easy to understand for forms | Not always present | Medium |
| CSS selector | {{[data-testid='login-btn']}} | Flexible, usually fast | Structural selectors ({{div>div:nth-child(3)}}) are brittle | Depends on writing |
| XPath | {{//button[text()='Login']}} | Powerful (by text/tree) | Long, breaks on structure/text changes | Often brittle if overused |
| data-testid | {{[data-testid='submit-order']}} | Separates tests from style/layout; clear intent | Needs dev convention and upkeep | High with convention |

### Brittle vs durable
- **Brittle:** {{//div[2]/form/div[3]/button[1]}} – adding one {{div}} breaks it; or framework CSS classes changing on version upgrade.
- **Durable:** {{[data-testid='checkout-submit']}} – layout/style changes are fine as long as the test attribute stays.

### Coordinating to add data-testid
1. **Naming convention:** {{kebab-case}} by behavior: {{login-submit}}, {{cart-item-price}}. Avoid {{button-3}}.
2. **Placement:** interactive or business-meaningful elements (buttons, inputs, error messages).
3. **Stability:** renaming requires coordination (search usage in tests).
4. **Production:** usually kept (small HTML attribute). If hidden, use a deliberate build mechanism but ensure tests run in the right environment.

~~~html
<input data-testid="search-input" type="text" />
<li data-testid="search-result-item">...</li>
~~~
~~~java
// Selenium
driver.findElement(By.cssSelector("[data-testid='search-input']")).sendKeys("phone");
~~~

### Strategy
- If {{data-testid}} exists: use it. If stable id/name exists: use it. If matching by text: acceptable but careful with i18n (Playwright offers {{getByRole/getByText}} supporting accessibility). Avoid absolute XPath, {{nth-child}}, dynamic classes.

### Common mistakes
- Copying XPath from DevTools and pasting → extremely brittle.
- Using display text for multi-language apps without a strategy.
- Duplicate {{data-testid}} on a page → wrong element selected.

### How to answer in an interview
State the priority order and reasons (durability, separation from UI). Emphasize dev collaboration and that {{data-testid}} is a contract. Give an example of a brittle locator you fixed.

> Senior tip: Locate by **user intent** (role, label, test id) and lock the convention with the team – saves many hours of fixing trivial tests when UI changes.`,
    follow: [
      'When is XPath acceptable, and how do you write more durable relative XPath?',
      'How do you handle elements with dynamic ids (random per render)?',
      'What are the benefits of accessibility-based locators (getByRole) vs pure CSS?'
    ]
  },
  'autotest-005': {
    q: 'Explain Selenium wait strategies: implicit wait, explicit wait, fluent wait. Why should you not mix implicit and explicit? What is StaleElementReferenceException, its causes, and safe handling?',
    a: `**Summary:** A **wait** lets a test wait for the page/element to be ready. **Implicit wait:** global config, WebDriver auto-retries when finding elements – simple but hard to control. **Explicit wait:** waits for a **specific condition** (clickable, visible) with a clear timeout. **Fluent wait** is a more flexible explicit wait (polling interval, ignoring temporary exceptions). Do not mix implicit and explicit because wait times can add up/unpredictably. **StaleElementReferenceException** happens when an element reference points to a DOM node that was replaced/removed (page re-render); handle by re-finding the element or waiting for a stable state.

### Why wait is needed
Modern web loads asynchronously (AJAX/fetch – background data calls), re-renders the DOM, has animations. Tests run faster than humans; clicking before a button is ready fails.

### Three wait types
| Type | Usage | Pros | Cons |
|---|---|---|---|
| Implicit wait | {{driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10))}} | Set once | Applies to every {{findElement}}; cannot wait for complex conditions; hard to debug; conflicts with explicit |
| Explicit wait | {{new WebDriverWait(driver, Duration.ofSeconds(10)).until(ExpectedConditions.elementToBeClickable(...))}} | Waits for exact condition, clear timeout | Must write at each needed point |
| Fluent wait | {{FluentWait}} + {{withTimeout/pollingEvery/ignoring}} | Custom polling, ignores temporary exceptions | More verbose |

~~~java
import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.*;
import java.time.Duration;

// Explicit: wait until button clickable (visible + enabled)
By pay = By.cssSelector("[data-testid='pay-btn']");
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
wait.until(ExpectedConditions.elementToBeClickable(pay)).click();

// Fluent: retry every 500ms, ignore temporary not-found
Wait<WebDriver> fluent = new FluentWait<>(driver)
    .withTimeout(Duration.ofSeconds(15))
    .pollingEvery(Duration.ofMillis(500))
    .ignoring(NoSuchElementException.class);
fluent.until(d -> d.findElement(By.id("result")).isDisplayed());
~~~

### Why not mix implicit and explicit
Selenium recommends not combining them. Both mechanisms intervene in finding/waiting; when mixed, actual wait time may add up or become unpredictable depending on driver, causing unexpectedly slow tests or strange timeouts. Best practice: implicit = 0 (or unset) and use purposeful explicit/fluent waits.

### StaleElementReferenceException
- **Stale** (expired reference): you hold {{WebElement btn}} at T1. JS re-rend/refresh of the region replaces the node. {{btn}} points to the old address → operation throws {{StaleElementReferenceException}}.
- Common causes: storing an element then DOM changes; iterating a list while DOM changes mid-loop; SPA (Single Page Application – one page that re-renders often) re-render.

Safe handling:
1. **Re-find the element** right before use (do not keep references long).
2. **Wait for a stable locator** (presence/clickable) instead of using the old object.
3. **Small controlled retry** when you understand the cause is re-render.

~~~java
// Always re-locate when needed
wait.until(ExpectedConditions.elementToBeClickable(pay)).click();

// Small retry on re-render (careful)
for (int i = 0; i < 2; i++) {
    try {
        wait.until(ExpectedConditions.elementToBeClickable(pay)).click();
        break;
    } catch (StaleElementReferenceException e) {
        if (i == 1) throw e; // still failing on last try → report real error
    }
}
~~~

### Common mistakes
- {{Thread.sleep(5000)}} instead of condition-based wait → slow and still flaky.
- Large implicit wait "to be safe" → wrong locator also waits long.
- Catching generic {{Exception}} and swallowing stale → hides real bugs.

### How to answer in an interview
Distinguish the three waits, recommend explicit, avoid mixing implicit. Explain stale as "DOM changed, old reference expired" and mention re-find/wait for stability. Give an example of stale on an auto-refreshing data table.

> Senior tip: Wait for **meaningful conditions** (button clickable, spinner gone, data shown) instead of "long enough" – tests become both fast and stable.`,
    follow: [
      'What is the difference between presenceOfElementLocated and visibilityOfElementLocated?',
      'How do you wait for a network request to finish in pure Selenium, and when to consider Playwright?',
      'How do you standardize waits in a framework so everyone does not invent their own?'
    ]
  },
  'autotest-006': {
    q: 'What is Page Object Model (POM) and what problem does it solve? What are common POM design mistakes (assertions in page, god page)? Briefly compare with the Screenplay pattern.',
    a: `**Summary:** **Page Object Model (POM)** is a design pattern: each page/component is a class containing **locators** and **actions** (login, submit), while tests call actions and assert results. POM reduces duplication and isolates UI changes (change a locator in one place). Common mistakes: putting **assertions** in the page blurring responsibilities, creating a **god page** that is huge, or letting tests touch locators directly. **Screenplay** (actor–task–interaction, e.g. Serenity) expresses business behavior better for complex scenarios but costs more to learn/setup; most Java teams find POM (+ component objects) sufficient.

### Problem POM solves
Without POM: every test calls {{findElement(...)}} itself. A UI id change → edit dozens of tests. POM centralizes "how the page works" in one place.

### Basic POM (Java + Selenium)
~~~java
import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.*;
import java.time.Duration;

// Page Object: only locators + actions
public class LoginPage {
    private final WebDriver driver;
    private final WebDriverWait wait;
    private final By user = By.cssSelector("[data-testid='username']");
    private final By pass = By.cssSelector("[data-testid='password']");
    private final By submit = By.cssSelector("[data-testid='login-submit']");

    public LoginPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    // Action returns the next page (clear flow)
    public HomePage loginAs(String u, String p) {
        wait.until(ExpectedConditions.visibilityOfElementLocated(user)).sendKeys(u);
        driver.findElement(pass).sendKeys(p);
        driver.findElement(submit).click();
        return new HomePage(driver);
    }

    // Expose data so tests assert (assertions do NOT live in the page)
    public String errorMessage() {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(
            By.cssSelector("[data-testid='login-error']"))).getText();
    }
}

// Test: reads like a scenario
// LoginPage login = new LoginPage(driver);
// login.loginAs("alice", "wrong");
// assertTrue(login.errorMessage().contains("Invalid"));
~~~

### Common design mistakes
| Mistake | Symptom | Consequence | Fix |
|---|---|---|---|
| Assert in Page | {{loginAs}} calls {{assert}} | Page both navigates and checks, hard to reuse (login for setup) | Page returns data/state; assert in test |
| God Page huge | One class 2000 lines for whole app | Hard to read, merge conflicts | Split pages/components (Header, Modal, Table) |
| Locators leak out | Test calls {{driver.findElement}} directly | Loses POM benefit | Expose only meaningful actions/questions |
| Business logic/DB in Page | Calculations, DB queries | Mixed responsibilities | Page only interacts with UI; coordinate in helper/service tests |
| Random waits/{{sleep}} | Slow, flaky | Poor stability | Standardize waits in base/component |

### Quick comparison with Screenplay
- **POM:** "what actions the page has" – intuitive, easy to learn. Unit: Page/Component.
- **Screenplay:** "Actor performs a Task via Interactions and asks Questions" (e.g. {{Actor.attemptsTo(Login.with(...))}}; {{should(seeThat(...))}}). Scenarios read like business language, good task reuse; but boilerplate and needs discipline. Seen in Serenity BDD.
- Choice: small/medium team → POM + components. Complex business scenarios needing "living" reports → consider Screenplay.

### How to answer in an interview
Define POM, benefits (less duplication, isolated changes). Proactively mention 2 mistakes (assert in page, god page) and how to avoid. Compare Screenplay briefly, conclude by team size.

> Senior tip: POM is not the goal – **maintainability** is. If a Page Object is harder to read than straight test code, simplify: small components, clear actions, drop abstractions that add no value.`,
    follow: [
      'How do you organize BasePage/BaseTest (driver, wait, logging) without becoming a god class?',
      'Is Selenium Page Factory ({{@FindBy}}) still worth using, pros/cons?',
      'For SPAs with reusable components, do you model by "Page" or "Component"?'
    ]
  },
  'autotest-007': {
    q: 'How do JUnit 5 and TestNG differ in the context of automation testing? When do you choose which? Show data-driven testing (same test with many datasets) using {{@ParameterizedTest}} or {{@DataProvider}}.',
    a: `**Summary:** **JUnit 5** (Jupiter) is the modern standard test framework for Java ({{@Test}} annotation, lifecycle {{@BeforeEach}}, flexible extension model) – usually the default for unit/integration and well supported by many libraries. **TestNG** is strong in some traditional automation features: XML suite config, test dependencies ({{dependsOnMethods}} – usually discouraged), parallel, and very flexible **data-driven** via {{@DataProvider}}. Data-driven (same scenario with many datasets) works in both: JUnit 5 uses {{@ParameterizedTest}} + {{@MethodSource/@CsvSource}}. For new automation, JUnit 5 is usually simpler and integrates well with Spring/CI; TestNG remains useful for inheriting large suites or needing special features.

### JUnit 5 vs TestNG: key points
| Aspect | JUnit 5 (Jupiter) | TestNG |
|---|---|---|
| Ecosystem | De-facto standard, Spring Boot integration, IDE/CI good | Common in older Selenium automation, XML suites |
| Basic annotations | {{@Test}}, {{@BeforeEach}}, {{@AfterEach}}, {{@Nested}} | {{@Test}}, {{@BeforeMethod}}, {{@AfterMethod}} |
| Extension | {{@ExtendWith}} (strong, composable extension model) | Listeners, annotation transformer |
| Data-driven | {{@ParameterizedTest}} + {{@ValueSource/@CsvSource/@MethodSource}} | {{@DataProvider}} (flexible, returns object arrays) |
| Test dependencies | Discouraged (tests should be independent) | {{dependsOnMethods/groups}} (easy to create brittle chains) |
| Parallel/suite | Supported via config; depends on runner | Strong XML/suite config, familiar |
| Groups/tags | {{@Tag}} | {{groups}} |

### What data-driven is and examples
Data-driven testing: the same test logic runs repeatedly with different datasets (input/expected). It covers boundaries without copy-pasting tests.

~~~java
// JUnit 5: ParameterizedTest
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.*;

class TaxTest {
    // Each CSV row is a case: income, expectedTax
    @ParameterizedTest
    @CsvSource({
        "1000, 0",
        "50000, 5000",
        "200000, 30000"
    })
    void calcTax_cases(long income, long expected) {
        assertEquals(expected, TaxCalculator.calc(income));
    }
}
~~~

~~~java
// TestNG: DataProvider (illustrative idea)
import org.testng.annotations.*;

public class TaxTestNG {
    @DataProvider(name = "cases")
    public Object[][] cases() {
        return new Object[][] { {1000L, 0L}, {50000L, 5000L} };
    }

    @Test(dataProvider = "cases")
    public void calcTax(long income, long expected) {
        // assert...
    }
}
~~~

### Choosing for automation
- New project, Spring Boot, team familiar with JUnit: **JUnit 5** (simpler, good extensions for Selenium/REST Assured).
- Inherited large TestNG suite, complex XML suites, existing infra: may keep **TestNG** but avoid {{dependsOnMethods}} (makes tests depend on each other, hard to run in parallel/debug).
- Either way: tests must be **independent**, data separated, runnable in parallel.

### Common mistakes
- Using {{dependsOnMethods}} to "save setup" → one failing test collapses the chain, hiding root cause.
- Data-driven with shared/mutated data → flaky under parallel.
- Mixing JUnit 4/5/TestNG styles in one module unnecessarily → confusing config.

### How to answer in an interview
Brief comparison (ecosystem, extension/DataProvider, test dependencies). State preference for JUnit 5 on new projects and the principle: independent tests, data-driven for repetitive cases. Show a {{@ParameterizedTest}} or {{@DataProvider}} example you used.

> Senior tip: Do not let the framework decide test quality. "Independent, repeatable, fast" matters more than choosing JUnit or TestNG; data-driven is a good tool but test data must be managed like code (versioned, meaningful).`,
    follow: [
      'Why is {{dependsOnMethods}} in TestNG often considered an anti-pattern for automation?',
      'How do you run tests safely in parallel when each case uses its own data?',
      'How does JUnit 5 {{@Nested}} help organize UI/API tests?'
    ]
  },
  'autotest-008': {
    q: 'How do you test APIs end-to-end with REST Assured (given/when/then, asserting status/body/header)? How do you chain multiple requests (get a token then call a protected API) and validate JSON Schema?',
    a: `**Summary:** **REST Assured** is a Java library for writing API tests in **given/when/then** style (prepare – act – check): set headers/body/auth, send HTTP, then assert status code, headers, and JSON content (using Hamcrest/JsonPath). API **end-to-end** at the HTTP level means calling real endpoints (or an integration environment) and checking response contracts. To **chain** requests (e.g. login to get a token → call a protected API), extract a value from the response ({{extract().path(...)}}) and pass it to the next request. **JSON Schema validation** checks the "shape" of data (which fields, types, required) and catches structural breaking changes.

### What REST Assured is
REST Assured (Java library) wraps HTTP calls and assertions, yielding syntax that reads like behavior descriptions. It suits API-layer tests (faster and more stable than UI).

### given/when/then example
~~~java
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

class OrderApiTest {
    void getOrder_returns200() {
        given()
            .baseUri("https://api.example.test")
            .header("Accept", "application/json")
        .when()
            .get("/orders/123")           // HTTP GET
        .then()
            .statusCode(200)              // assert status
            .header("Content-Type", containsString("application/json"))
            .body("id", equalTo(123))     // JsonPath: field id = 123
            .body("items.size()", greaterThan(0));
    }
}
~~~
- {{body("items.size()", ...)}} uses **JsonPath** (syntax to point into JSON) to assert deep inside the structure.

### Chaining requests: login → use token
~~~java
// 1) Login to get access token
String token =
    given()
        .contentType("application/json")
        .body("{"user":"alice","pass":"secret"}")
    .when()
        .post("/auth/login")
    .then()
        .statusCode(200)
        .extract().path("accessToken"); // extract field from JSON

// 2) Call protected API with Bearer token
given()
    .header("Authorization", "Bearer " + token)
.when()
    .get("/profile")
.then()
    .statusCode(200)
    .body("username", equalTo("alice"));
~~~
Note: do not hardcode real secrets in the repo; use environment variables/secret store in CI.

### JSON Schema validation
A JSON schema describes the structure: types, required fields, enums. Schema checks detect unexpected additions/removals/type changes in responses.

~~~java
import static io.restassured.module.jsv.JsonSchemaValidator.matchesJsonSchemaInClasspath;

given()
.when().get("/orders/123")
.then().statusCode(200)
      .body(matchesJsonSchemaInClasspath("schemas/order-schema.json"));
~~~
- You need REST Assured's {{json-schema-validator}} module.
- Put schemas under {{src/test/resources}}.

### Common mistakes
- Asserting only status 200 without checking body → API returning wrong data still passes.
- Chaining on shared/dirty environment data → flaky. Better: create data via setup API, clean up after test.
- Depending on an unstable shared environment, or forgetting timeouts → tests hang in CI.
- Logging tokens/PII (personal data) into reports.

### How to answer in an interview
Present given/when/then with a body/header assertion example. Mention chaining tokens via {{extract()}} and schema validation for contracts. Emphasize test data management and secret security.

> Senior tip: For important APIs, combine **contract-style checks** (schema/required fields) with a few meaningful business assertions. Do not write hundreds of tiny assertions on easily changing fields – tests become brittle and costly to maintain.`,
    follow: [
      'When do you use JSON Schema validation vs asserting individual fields with JsonPath?',
      'How do you test file upload or pagination APIs with REST Assured?',
      'How do you organize base URI, auth, and logging shared across a REST Assured suite?'
    ]
  }
});
