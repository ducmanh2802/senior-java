/*
 * English translation of js/data/quiz-autotest.js — task T750. Format: js/core/i18n.js (content overlay).
 * ids: qz-autotest-001 qz-autotest-002 qz-autotest-003 qz-autotest-004 qz-autotest-005 qz-autotest-006 qz-autotest-007 qz-autotest-008 qz-autotest-009 qz-autotest-010 qz-autotest-011 qz-autotest-012 qz-autotest-013 qz-autotest-014 qz-autotest-015 qz-autotest-016 qz-autotest-017 qz-autotest-018 qz-autotest-019 qz-autotest-020 qz-autotest-021 qz-autotest-022 qz-autotest-023 qz-autotest-024 qz-autotest-025 qz-autotest-026 qz-autotest-027 qz-autotest-028
 */
App.i18n.content({
  'qz-autotest-001': {
    q: 'In Playwright, how does a Locator from {{getByRole}} differ from a regular {{locator}}?',
    options: [
      'Locator always returns the first element and does not auto-retry',
      'Locator is a lazy description that auto-retries the action until conditions are met or timeout',
      'Locator works only with CSS selectors',
      'Locator cannot be passed to assertions'
    ],
    explain: `**Summary: Locator is lazy + auto-retry.** A Locator does not query the DOM immediately; it stores "how to find" and Playwright automatically waits for the element to be ready before click/fill/assert.

### Why the other options are wrong
- **Returns first element without retry**: that is the behavior of a one-time {{querySelector}}, not a Locator.
- **Only CSS**: Playwright Locators support role, text, test-id, XPath, and CSS.
- **Cannot pass to assertion**: {{expect(locator)}} is the standard way to assert.`
  },
  'qz-autotest-002': {
    q: 'Which conditions does Playwright auto-wait for before performing a click? (Choose 3)',
    options: [
      'Element attached to the DOM',
      'Element visible and stable (not animating)',
      'Element has the desired text',
      'Element enabled and not covered by an overlay'
    ],
    explain: `**Summary: attached + visible/stable + enabled/not covered.** Playwright click auto-wait checks attached, visible, stable, enabled, receives events (not covered by overlay). Specific text is not an auto-wait condition.

### Why the other options are wrong
- **Has desired text**: Playwright does not wait for specific text; that is your assertion.`
  },
  'qz-autotest-003': {
    q: 'What does Page Object Model (POM) help most with in test automation?',
    options: [
      'Speed up test runs by dropping retries',
      'Separate locators and actions per screen, reducing duplication and easing maintenance when UI changes',
      'Replace the test runner framework',
      'Automatically generate test cases from UI'
    ],
    explain: `**Summary: separate locators/actions per screen.** POM encapsulates selectors and interactions in a class; when the UI changes you edit one place.

### Why the other options are wrong
- **Speed up by dropping retry**: retry is a framework mechanism, unrelated to POM.
- **Replace test runner**: POM is a pattern; JUnit/TestNG still run tests.
- **Auto-generate tests**: that is codegen/recorder, not POM.`
  },
  'qz-autotest-004': {
    q: 'In JUnit 5, which annotation runs a method before each test?',
    options: ['@BeforeAll', '@BeforeEach', '@AfterEach', '@Test'],
    explain: `**Summary: @BeforeEach.** Runs before each @Test method; @BeforeAll runs once before all tests in the class.

### Why the other options are wrong
- **@BeforeAll**: runs once for the whole class, usually for heavy resource init.
- **@AfterEach**: runs after each test.
- **@Test**: marks a test method, not setup.`
  },
  'qz-autotest-005': {
    q: 'What is REST Assured typically used for in automation?',
    options: [
      'Running browser E2E tests',
      'Testing REST APIs with a given/when/then syntax',
      'Managing browser context',
      'Generating Allure reports'
    ],
    explain: `**Summary: testing REST APIs.** REST Assured provides a given().when().then() DSL to assert status, body, headers.

### Why the other options are wrong
- **Browser E2E**: that is Playwright/Selenium.
- **Browser context**: belongs to Playwright.
- **Allure report**: a separate reporting library, not REST Assured.`
  },
  'qz-autotest-006': {
    q: 'What is Cucumber-JVM\'s Gherkin language used for?',
    options: [
      'Writing Java code directly',
      'Describing behavior in Given/When/Then that business can read',
      'Running tests in parallel',
      'Managing Maven dependencies'
    ],
    explain: `**Summary: describe behavior in Given/When/Then.** The .feature file is a living spec; Java glue code maps each step.

### Why the other options are wrong
- **Java code directly**: Gherkin is not Java.
- **Parallel run**: handled by test runner/config.
- **Maven dependencies**: handled by pom.xml.`
  },
  'qz-autotest-007': {
    q: 'When a test is flaky (fails occasionally), which handling is most reasonable? (Choose 2)',
    options: [
      'Add unconditional retries to every test',
      'Analyze root cause: timing, shared state, dependent data',
      'Isolate the test and add explicit waits/assertions',
      'Delete the test so CI stays green'
    ],
    explain: `**Summary: analyze root cause + isolate.** Flakiness usually comes from race conditions, shared state, non-deterministic data.

### Why the other options are wrong
- **Unconditional retry**: hides bugs and slows CI.
- **Delete the test**: loses coverage without fixing the problem.`
  },
  'qz-autotest-008': {
    q: 'What is Playwright storageState typically used for?',
    options: [
      'Saving cookies/localStorage to reuse a login session',
      'Saving screenshot baselines',
      'Saving trace files',
      'Saving HAR network data'
    ],
    explain: `**Summary: store auth state.** storageState saves cookies/localStorage; later tests load it into a context to skip login.

### Why the other options are wrong
- **Screenshot baseline**: use toMatchSnapshot.
- **Trace**: use tracing.start/stop.
- **HAR**: use recordHar.`
  },
  'qz-autotest-009': {
    q: 'When is Playwright tracing (trace.zip) most useful?',
    options: [
      'When debugging a failed test via timeline, network, console, screenshot',
      'When speeding up tests',
      'When running tests in parallel',
      'When generating test code'
    ],
    explain: `**Summary: debug failed tests.** Trace Viewer shows timeline, DOM snapshots, network, console.

### Why the other options are wrong
- **Speed up**: tracing adds overhead.
- **Parallel**: handled by workers/sharding.
- **Generate code**: that is codegen.`
  },
  'qz-autotest-010': {
    q: 'What does sharding help with in CI using Playwright/TestNG?',
    options: [
      'Split the test suite into parts run in parallel across multiple machines',
      'Auto-fix failing tests',
      'Reduce the number of tests',
      'Generate Allure reports'
    ],
    explain: `**Summary: split suite to run in parallel.** Sharding distributes tests by shard index/total to reduce total time.

### Why the other options are wrong
- **Auto-fix tests**: no.
- **Reduce test count**: no reduction, only distribution.
- **Allure**: separate reporting tool.`
  },
  'qz-autotest-011': {
    q: 'What is WireMock typically used for in automation?',
    options: [
      'Mock HTTP endpoints of external dependencies',
      'Run a browser',
      'Manage DB migrations',
      'Generate fake test data'
    ],
    explain: `**Summary: mock HTTP endpoints.** WireMock returns simulated responses so tests stay independent of real services.

### Why the other options are wrong
- **Browser**: Playwright/Selenium.
- **DB migration**: Flyway/Liquibase.
- **Faker**: data faker libraries.`
  },
  'qz-autotest-012': {
    q: 'What does Testcontainers help with in automation tests?',
    options: [
      'Start real dependencies (DB, Kafka, Redis) in containers for tests',
      'Run tests in the cloud',
      'Mock the whole network',
      'Generate reports'
    ],
    explain: `**Summary: real dependencies in containers.** Testcontainers spins up real DB/message brokers for reliable integration tests.

### Why the other options are wrong
- **Cloud tests**: not the purpose.
- **Mock network**: that is WireMock/mock server.
- **Reports**: Allure/reporting tools.`
  },
  'qz-autotest-013': {
    q: 'What kind of applications does Appium 2 automate?',
    options: [
      'Desktop web',
      'Mobile native/hybrid/webview',
      'API backend',
      'Database'
    ],
    explain: `**Summary: mobile.** Appium 2 automates mobile apps (iOS/Android) via the WebDriver protocol.

### Why the other options are wrong
- **Desktop web**: Playwright/Selenium.
- **API backend**: REST Assured/Postman.
- **Database**: JDBC/test queries.`
  },
  'qz-autotest-014': {
    q: 'In Playwright, which attribute does getByTestId usually depend on?',
    options: ['data-testid', 'id', 'class', 'name'],
    explain: `**Summary: data-testid.** By default getByTestId finds the data-testid attribute (configurable).

### Why the other options are wrong
- **id/class/name**: there are separate locators (use locator('#id')).`
  },
  'qz-autotest-015': {
    q: 'Which practices help make automation tests durable in CI? (Choose 2)',
    options: [
      'Independent tests that do not depend on order',
      'Stable locators (role/test-id) instead of brittle CSS',
      'Shared state between tests for speed',
      'Drop assertions to avoid failures'
    ],
    explain: `**Summary: independent tests + stable locators.** Independence enables parallel/shard runs; stable locators reduce flakiness.

### Why the other options are wrong
- **Shared state**: causes coupling and flakiness.
- **Drop assertions**: removes the test's meaning.`
  },
  'qz-autotest-016': {
    q: 'In Playwright for Java, what is the most accurate description of the relationship between {{Browser}}, {{BrowserContext}}, and {{Page}}?',
    options: [
      'Each Browser creates only one Page, and Page manages shared cookies',
      'BrowserContext is a tab; each Context contains multiple Browsers',
      'Browser represents the browser process, BrowserContext is an isolated session (separate cookies/storage), Page is a tab in the Context',
      'Page and BrowserContext are the same object with different method names'
    ],
    explain: `**Summary:** {{Browser}} (browser) -> {{BrowserContext}} (isolated session) -> {{Page}} (tab). This model lets tests run in parallel without session cross-talk.

**Step-by-step:**
- **Browser (what):** an object representing a browser process (Chromium/Firefox/WebKit) controlled by Playwright. You usually create one Browser per suite to save startup time.
- **BrowserContext (why):** like a separate "incognito profile": own cookies, localStorage, sessionStorage, permissions. Two Contexts in the same Browser do not see each other's data. Each test can log in as a different account without launching a new browser.
- **Page (how):** a tab/page inside a Context. All actions like {{page.navigate()}}, {{page.locator()}} happen on a Page.

**Example (Java):**
~~~java
try (Playwright pw = Playwright.create()) {
  Browser browser = pw.chromium().launch();
  // Each test creates its own context -> isolated session
  BrowserContext ctx = browser.newContext();
  Page page = ctx.newPage();
  page.navigate("https://example.com");
}
~~~

**Common pitfalls:** Reusing one Context across tests leaks cookie/state into later tests, causing flakiness. Create a new Context in {{@BeforeEach}} and close it in {{@AfterEach}}.

> Senior tip: Create 1 Browser per worker, but 1 BrowserContext per test. This keeps good speed (no repeated browser launch) while isolating data.

### Why the other options are wrong
- **One Browser one Page, shared cookies**: Wrong on both counts. One Browser can create many Contexts/Pages; cookies belong to the Context, not the whole Browser.
- **Context is a tab containing many Browsers**: completely reverses the hierarchy.
- **Page and Context are the same object**: Wrong. They are different classes with different APIs (Context manages storage/routing; Page manages navigation/DOM).`
  },
  'qz-autotest-017': {
    q: 'You want to select the "Login" button in a way that stays robust (won\'t break when UI changes class/CSS). In Playwright for Java, which locator is preferred per accessibility guidance?',
    options: [
      '{{page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Login"))}}',
      '{{page.locator("button.btn-primary.login-btn")}}',
      '{{page.locator("//button[contains(@class,\'login\')]")}}',
      '{{page.locator("div > div:nth-child(2) > button")}}'
    ],
    explain: `**Summary:** Prefer {{getByRole}} (accessibility role) because it attaches to the element's meaning, not easily changing CSS/DOM details.

**Step-by-step:**
- **What is an accessibility role:** The browser assigns a "role" to elements (button, link, textbox...) so assistive tools (screen readers - software that reads the screen for visually impaired users) understand them. Playwright reuses this information to find elements.
- **Why it is robust:** The button name "Login" and its button role usually stay stable with business requirements; CSS class names like {{btn-primary}} or structure like {{div > div:nth-child(2)}} change when designers adjust the UI.
- **How it works:** {{getByRole(AriaRole.BUTTON, ...setName("Login"))}} finds an element with role button and accessible name matching "Login". Playwright also auto-waits for the element to appear and be ready.

**Example (Java):**
~~~java
page.getByRole(AriaRole.BUTTON,
    new Page.GetByRoleOptions().setName("Login")).click();
~~~

**Common pitfalls:** Using long CSS selectors; adding one wrapper {{div}} breaks many tests. Or display text with differing whitespace - use regex {{Pattern.compile("Login")}}.

> Senior tip: Locator priority: getByRole/getByLabel (semantics) > getByTestId (test contract) > CSS/XPath (last resort). If no suitable role exists, ask the team to add {{data-testid}} instead of writing brittle XPath.

### Why the other options are wrong
- **CSS class {{.btn-primary.login-btn}}**: Depends on class names; CSS refactor or theme change breaks tests.
- **XPath by class**: Still anchored to class and verbose, hard to read/maintain.
- **CSS by position {{nth-child(2)}}**: Extremely brittle; adding/removing siblings changes the index.`
  },
  'qz-autotest-018': {
    q: 'When using {{getByTestId}} in Playwright for Java, which statements are correct? (Choose 2)',
    options: [
      '{{getByTestId("submit")}} finds the element by attribute {{id="submit"}} by default',
      '{{getByTestId}} is a contract between dev and QA: stable when text/CSS change, as long as the test id attribute is kept',
      'The default attribute name ({{data-testid}}) can be changed via {{setTestIdAttribute}} config',
      '{{getByTestId}} automatically translates text, so it suits multilingual apps'
    ],
    explain: `**Summary:** {{getByTestId}} defaults to {{data-testid}}, a stable anchor controlled by the team; the attribute can be changed via {{setTestIdAttribute}}.

**Step-by-step:**
- **What is getByTestId:** Locating an element by a test-dedicated attribute (default {{data-testid}}). Example HTML: {{<button data-testid="submit">Send</button>}} -> {{page.getByTestId("submit")}}.
- **Why it is needed:** When the UI has no clear role/label (icon button, canvas...), or text changes by language, a test id gives a stable anchor.
- **Changing the default attribute:** Some codebases use {{data-test}}, {{data-qa}}... Playwright allows global config:
~~~java
playwright.selectors().setTestIdAttribute("data-test");
// afterwards getByTestId("submit") finds data-test="submit"
~~~

**Common pitfalls:** Overusing test ids for everything instead of getByRole/getByLabel first - loses the chance to catch accessibility issues. Or devs deleting the attribute during refactor because "it is not used in production".

> Senior tip: Use test id as a second option: prefer role/label first. Standardize the attribute name in the project and add lint/review rules so nobody accidentally removes {{data-testid}}.

### Why the other options are wrong
- **Finds by {{id}} by default**: Wrong. Default is {{data-testid}}. To find by id use {{page.locator("#submit")}}.
- **Auto-translates text for multilingual apps**: Wrong. A test id is a fixed string you assign; unrelated to i18n/translation.`
  },
  'qz-autotest-019': {
    q: 'What problem does this Playwright for Java code have? {{Locator msg = page.locator(".toast"); if (msg.isVisible()) msg.click();}}',
    options: [
      'Missing {{page.waitForTimeout(5000)}} before checking',
      'Must use {{getByText}} instead of {{locator}} with a class',
      '{{locator()}} does not return a valid Locator object',
      '{{isVisible()}} does not auto-wait like action/assertion: may return {{false}} even if the toast is about to appear (race condition)'
    ],
    explain: `**Summary:** {{isVisible()}} (instant check) has no auto-wait; with async UI rendering you easily hit a race condition (checking before the element appears).

**Step-by-step:**
- **What is auto-wait:** For actions ({{click}}, {{fill}}) and web-first assertions ({{assertThat(locator).isVisible()}}), Playwright repeatedly checks until the condition holds or timeout. This keeps tests stable on slow networks/UI.
- **How isVisible() differs:** {{locator.isVisible()}} returns the result immediately, without waiting. If a toast renders after 200ms, the {{if}} may miss it.
- **Correct fix:**
~~~java
Locator msg = page.locator(".toast");
assertThat(msg).isVisible(); // web-first, auto-waits
msg.click();
~~~
Or if the toast may not appear: use {{waitFor}} with a suitable timeout and clear logic.

**Common pitfalls:** Sprinkling {{Thread.sleep}}/{{waitForTimeout}} everywhere to "patch" timing - slow tests that are still flaky when the environment is slower than usual.

> Senior tip: Golden rule - use actions/assertions to wait; avoid instant {{isVisible()}}/{{count()}} in branching logic unless you intentionally check current state. Never use fixed {{waitForTimeout}}.

### Why the other options are wrong
- **Missing {{waitForTimeout(5000)}}**: Hard waiting is an anti-pattern, does not fix the root cause and slows the suite.
- **Must use {{getByText}}**: Not required; the issue is the waiting mechanism, not the locator type.
- **{{locator()}} is invalid**: Wrong. {{page.locator()}} returns a valid Locator; the syntax is correct.`
  },
  'qz-autotest-020': {
    q: 'In Playwright for Java, what is the main difference between the web-first assertion {{assertThat(locator).hasText("OK")}} and the manual check {{locator.textContent().equals("OK")}}?',
    options: [
      '{{assertThat}} works only with {{getByRole}}, while {{textContent}} works with any locator',
      '{{assertThat(locator).hasText(...)}} is a web-first assertion: auto-retries/waits until text matches or timeout; {{textContent()}} gets the value instantly',
      'The two are completely equivalent in waiting behavior',
      '{{textContent()}} always throws if the element has no text yet'
    ],
    explain: `**Summary:** A web-first assertion ({{assertThat(locator)...}}) automatically waits for the value to match; calling {{textContent()}} then comparing is a one-time check, prone to failure when content updates asynchronously.

**Step-by-step:**
- **What is a web-first assertion:** {{com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat}} is designed for dynamic UI. It repeatedly reads the DOM and compares until pass or timeout (default ~5s).
- **Why it is needed:** After clicking "Save", a label may change from "Saving..." to "OK" after a few hundred ms. {{assertThat(locator).hasText("OK")}} waits; {{textContent()}} may read "Saving...".
- **Example (Java):**
~~~java
import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;
page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Save")).click();
assertThat(page.locator(".status")).hasText("OK"); // auto-waits
~~~

**Common pitfalls:** Taking {{String t = locator.textContent();}} then {{assertEquals("OK", t)}} - {{t}} is a stale snapshot that never updates. Also easy to hit {{null}} when called too early.

> Senior tip: For any UI state check, use {{assertThat(locator)...}} ({{isVisible}}, {{hasText}}, {{hasAttribute}}, {{hasCount}}). Use {{textContent()}} only when you need to extract data for logic, and ensure stability is waited for first.

### Why the other options are wrong
- **{{assertThat}} only works with {{getByRole}}**: Wrong. It accepts any {{Locator}}.
- **Completely equivalent**: Wrong about waiting - this is the core difference.
- **{{textContent()}} always throws if no text yet**: Not accurate; it may return {{null}} or an empty string depending on state, with no retry.`
  },
  'qz-autotest-021': {
    q: 'You have an {{auth.json}} file storing {{storageState}} after login. How do you reuse this session in Playwright for Java to skip login in another test?',
    options: [
      '{{browser.newContext(new Browser.NewContextOptions().setStorageStatePath(Paths.get("auth.json")))}}',
      '{{page.navigate("auth.json")}} then {{page.reload()}}',
      '{{browser.launch(new BrowserType.LaunchOptions().setStorageState("auth.json"))}}',
      'Copy the contents of {{auth.json}} into {{localStorage}} via {{page.evaluate}} after each {{click}}'
    ],
    explain: `**Summary:** Pass {{storageState}} (saved state: cookies + localStorage) into {{BrowserContext}} when creating it; the new Context starts already logged in.

**Step-by-step:**
- **What is storageState:** A JSON file containing cookies and origin storage that Playwright exports from a logged-in Context. It is like "carrying over" the login session.
- **Why it is needed:** Logging in via UI is slow and flaky; if 50 tests each log in, the suite is slow and prone to failures on the login page. Reusing the session lets tests focus on the feature under test.
- **How it works:**
~~~java
// Save (run once, e.g. global setup)
context.storageState(new BrowserContext.StorageStateOptions()
    .setPath(Paths.get("auth.json")));
// Reuse
BrowserContext ctx = browser.newContext(
    new Browser.NewContextOptions()
        .setStorageStatePath(Paths.get("auth.json")));
Page page = ctx.newPage();
page.navigate("https://app.example.com/dashboard"); // already logged in
~~~

**Common pitfalls:** The session expires (token expiry) and many tests fail at once - need periodic refresh of {{auth.json}}. Or committing {{auth.json}} with real tokens to git (secret leak).

> Senior tip: Create storageState in global setup via API login (fast, stable) instead of UI login. Add {{auth.json}} to {{.gitignore}}. With multiple roles (admin/user), create multiple state files.

### Why the other options are wrong
- **{{page.navigate("auth.json")}}**: Navigates the page, does not load auth state into the context.
- **{{setStorageState}} on {{launch}}**: {{LaunchOptions}} has no such option; storageState belongs to {{BrowserContext}}, not Browser.
- **{{page.evaluate}} injecting localStorage after each click**: Manual, error-prone (missing cookies/httpOnly, wrong origin/timing) and impractical.`
  },
  'qz-autotest-022': {
    q: 'You need to block all image requests ({{*.png}}, {{*.jpg}}) to speed up tests. Which Playwright for Java API fits best?',
    options: [
      '{{page.waitForRequest("**/*.{png,jpg}")}}',
      '{{browser.newContext().route(...)}} but must call after {{page.navigate()}}',
      '{{page.route("**/*.{png,jpg}", route -> route.abort())}}',
      '{{page.setExtraHTTPHeaders(...)}} with header {{Accept: text/html}}'
    ],
    explain: `**Summary:** {{page.route(urlPattern, handler)}} lets you block, modify, or mock network requests; call {{route.abort()}} to cancel a request.

**Step-by-step:**
- **What is network routing:** Playwright can intercept requests the page makes (images, APIs, scripts...). You register a URL pattern and a handler function.
- **Why it is needed:** Blocking heavy assets (images, fonts, analytics) speeds up and stabilizes tests when you do not need to check them. Also used to mock APIs with fixed data.
- **How it works:**
~~~java
// Register BEFORE navigating so no requests are missed
page.route("**/*.{png,jpg,jpeg}", route -> route.abort());
page.navigate("https://example.com");
~~~
Pattern {{**}} matches any path. The handler receives {{Route}}; you can {{abort()}}, {{fulfill()}} (return a fake response), or {{resume()}} (let it through, possibly with modified headers).

**Common pitfalls:** Registering the route after {{navigate()}} - image requests already fired. Or {{abort()}}-ing an important API request and breaking the page.

> Senior tip: Register routes before the action that triggers requests. To mock an API selectively, match by specific URL/path rather than a broad wildcard. You can set routes on {{context.route(...)}} to apply to every page in the context.

### Why the other options are wrong
- **{{waitForRequest}}**: Only waits/listens for a request to happen; does not block or modify it.
- **{{context.route}} must be called after {{navigate()}}**: Wrong timing; routes must be registered before requests fire. (Setting on context is valid, but the described timing is wrong.)
- **{{setExtraHTTPHeaders}} with {{Accept}}**: Only adds headers to outgoing requests; does not block image requests by pattern.`
  },
  'qz-autotest-023': {
    q: 'The checkout page embeds a card form inside an {{<iframe>}}. What is the correct way to interact with the card number input in Playwright for Java?',
    options: [
      '{{page.locator("#card-number").fill("4111111111111111")}} because Playwright searches all iframes automatically',
      '{{page.evaluate("document.querySelector(\'iframe\').contentDocument...")}}',
      'Switch entirely to {{browser.newPage()}} with the iframe URL',
      '{{page.frameLocator("iframe[name=\'card\']").getByLabel("Card number").fill("4111111111111111")}}'
    ],
    explain: `**Summary:** Use {{frameLocator}} to "enter" the iframe, then locate elements inside; it stays a Locator (lazy, auto-waiting) and is safer than cross-frame DOM access.

**Step-by-step:**
- **What is an iframe:** An HTML page embedded inside another page (inline frame). The iframe has its own DOM (element tree); ordinary JavaScript and locators on {{page}} do not automatically cross into it.
- **What is frameLocator:** A Playwright API that creates an "iframe-scoped locator". It does not return a hard {{Frame}} object but a {{FrameLocator}} you can chain with {{getByRole/getByLabel/locator}}.
- **How it works:**
~~~java
page.frameLocator("iframe[name='card']")
    .getByLabel("Card number")
    .fill("4111111111111111");
~~~
Playwright auto-waits for the iframe to appear and the inner element to be ready.

**Common pitfalls:** Using {{page.frame("name")}} and keeping a stale Frame reference - if the iframe reloads/replaces, the reference becomes invalid. {{frameLocator}} avoids this because it re-resolves on every action.

> Senior tip: Prefer {{frameLocator}} (locator semantics, resilient to frame reloads) over {{page.frame()}}. For nested iframes, chain: {{page.frameLocator("#outer").frameLocator("#inner").getByRole(...)}}.

### Why the other options are wrong
- **{{page.locator}} searches all iframes automatically**: Wrong. A {{page}} locator searches only the main frame's DOM, not inside iframes.
- **{{page.evaluate}} with {{contentDocument}}**: Usually blocked by the same-origin policy if the iframe is cross-origin, and loses Playwright's auto-wait.
- **{{browser.newPage()}} with the iframe URL**: Many iframes (especially payment) need the parent page's context/cookies/scripts; opening the URL alone usually does not reproduce real behavior.`
  },
  'qz-autotest-024': {
    q: 'The page has a "Download report" button that opens a new tab and an "Export CSV" button that triggers a file download. What is the correct handling in Playwright for Java? (Choose 2)',
    options: [
      'Use {{page.waitForPopup(() -> page.getByText("Download report").click())}} to capture the {{Page}} of the new tab',
      'Call {{Thread.sleep(3000)}} after click then find the new tab via {{browser.contexts().get(0).pages()}}',
      'Use {{page.waitForDownload(() -> page.getByText("Export CSV").click())}} to receive the {{Download}} object',
      'Use {{page.waitForRequest(...)}} to receive the CSV file content instead of download'
    ],
    explain: `**Summary:** Capture the popup (new tab/window) with {{waitForPopup}} and the file download with {{waitForDownload}} - both must be awaited together with the click to avoid missing the event.

**Step-by-step:**
- **What is a popup:** When a click opens {{target="_blank"}} or {{window.open}}, the browser creates a new tab/Page. Playwright fires a popup event on the original Page.
- **What is a download:** When the server responds with headers that make the browser download a file, Playwright fires a download event.
- **Why await together with click:** If you click first and then wait, the event may already have fired and be lost (race condition). The standard pattern passes the action into the wait function:
~~~java
Page popup = page.waitForPopup(() -> {
  page.getByText("Download report").click();
});
popup.waitForLoadState();
assertThat(popup).hasTitle("Report");

Download download = page.waitForDownload(() -> {
  page.getByText("Export CSV").click();
});
download.saveAs(Paths.get("report.csv"));
~~~

**Common pitfalls:** Fixed sleep then scanning pages - slow and unstable. Or forgetting {{waitForLoadState}} on the popup before asserting.

> Senior tip: Always use the {{waitForX(() -> action)}} pattern. For downloads, check {{download.suggestedFilename()}} and the saved file content to assert correct data, not just that the click did not error.

### Why the other options are wrong
- **{{Thread.sleep}} then scanning {{pages()}}**: Hard wait, flaky, and needlessly complex when event APIs exist.
- **{{waitForRequest}} instead of download**: You capture the network request but not the {{Download}} object (suggested filename, saved file stream). Handling attachments manually is cumbersome.`
  },
  'qz-autotest-025': {
    q: 'To debug a Playwright for Java test that fails on CI (hard to reproduce locally), you enable tracing. Which configuration collects a full trace for later analysis?',
    options: [
      '{{browser.startTracing()}} and {{browser.stopTracing()}} are enough, no need to attach to a context',
      '{{context.tracing().start(new Tracing.StartOptions().setScreenshots(true).setSnapshots(true).setSources(true));}} ... {{context.tracing().stop(new Tracing.StopOptions().setPath(Paths.get("trace.zip")));}}',
      'Only {{page.screenshot()}} when the test fails',
      'Enable {{setHeadless(false)}} to see the error instead of tracing'
    ],
    explain: `**Summary:** Tracing is enabled on {{BrowserContext}}: {{start}} with screenshots/snapshots/sources, {{stop}} with a {{trace.zip}} path; open with Trace Viewer to see timeline, DOM snapshot, network, console.

**Step-by-step:**
- **What is tracing:** A mechanism that records the whole test run: every action, screenshots, DOM snapshots (page state at that moment), network request/response, console logs, and mapping to source lines.
- **Why it is needed:** CI usually runs headless (no UI) with different OS/network than your machine. A trace lets you "replay" exactly when it failed without re-running.
- **How it works (Java):**
~~~java
context.tracing().start(new Tracing.StartOptions()
    .setScreenshots(true)  // screenshot per step
    .setSnapshots(true)    // DOM snapshot (replayable)
    .setSources(true));    // attach source lines
// ... run tests ...
context.tracing().stop(new Tracing.StopOptions()
    .setPath(Paths.get("trace.zip")));
~~~
Open the file: {{mvn exec:java -e -D exec.mainClass=com.microsoft.playwright.CLI -D exec.args="show-trace trace.zip"}} (or the equivalent CLI).

**Common pitfalls:** Calling {{start}} but forgetting {{stop}} on failure - put {{stop}} in {{finally/@AfterEach}}. Or always enabling tracing for every test (heavy I/O, slower); in practice use "on-first-retry" or on failure.

> Senior tip: In CI, save {{trace.zip}} as a build artifact only on failure/retry. Combine with screenshots and video if needed, but trace is usually the richest and sufficient.

### Why the other options are wrong
- **{{browser.startTracing()}} is enough**: The tracing API lives on {{context.tracing()}} (standard Playwright Java). You also must {{stop}} to a file to analyze.
- **Only {{page.screenshot()}} on failure**: Only one image at failure time, missing timeline/network/DOM history - hard to find root cause.
- **Enable headed instead of tracing**: CI usually has no display; and watching the run does not help "replay" a failure that already happened.`
  },
  'qz-autotest-026': {
    q: 'A Playwright suite has 200 tests and takes 40 minutes on CI. You want to split evenly across 4 machines running in parallel. Which mechanism describes Playwright sharding correctly?',
    options: [
      'Each machine runs with parameters like {{--shard=1/4}}, {{--shard=2/4}}... to receive a non-overlapping subset of tests',
      'Run the same command on all 4 machines; Playwright auto-locks files to avoid duplicates',
      'Manually copy 50 test files into 4 separate repos',
      'Sharding works only with {{BrowserContext}} in a single process, not across machines'
    ],
    explain: `**Summary:** Sharding splits the test set into N shards; each machine/process runs one shard via {{--shard=current/total}} to reduce total wall time.

**Step-by-step:**
- **What is sharding:** Splitting (partitioning) the test set. For 200 tests, {{1/4}} takes roughly the first 50 by deterministic order, {{2/4}} the next 50... Shards do not overlap.
- **Why it is needed:** One machine running sequentially takes 40 minutes; 4 sharded machines running in parallel can finish in ~10 minutes (plus some overhead). CI feedback is faster.
- **How it works:** Playwright Test (Node) uses {{--shard=1/4}}. With Playwright for Java, sharding is usually done at the runner/build layer (e.g. Maven Surefire splitting by module/fork, or CI matrix assigning shard index) or via an orchestrator; the core principle is each worker gets a disjoint subset.
~~~bash
# illustrating the idea (Playwright Test CLI)
npx playwright test --shard=1/4
npx playwright test --shard=2/4
~~~

**Common pitfalls:** Tests that depend on order or share data - shards must be safe in any order. Or merging reports from multiple shards incorrectly, losing results.

> Senior tip: Sharding only pays off with independent tests. Combine sharding (multiple machines) with parallel/workers (multiple threads on one machine) while watching CPU/RAM. Balance shards by historical run times if test durations vary.

### Why the other options are wrong
- **Same command, auto file lock**: Playwright does not distribute tests across independent machines via file locking like that.
- **Manual copy of test files**: Manual, error-prone (duplication/gaps) and not maintainable.
- **Only within one process**: Wrong. The main purpose of sharding is scaling to multiple CI machines/agents; within one process people use workers/threads.`
  },
  'qz-autotest-027': {
    q: 'You want to call a REST API directly (e.g. get a token, create test data) in Playwright for Java without opening a browser. Which object fits?',
    options: [
      '{{page.locator("body").evaluate(...)}} to send fetch',
      '{{Browser.newPage()}} then navigate to the API endpoint',
      'Use {{java.net.HttpClient}} separately and you cannot share cookies with the browser context',
      '{{playwright.request().newContext()}} or {{context.request()}} to use {{APIRequestContext}}'
    ],
    explain: `**Summary:** {{APIRequestContext}} is Playwright's built-in HTTP client; create it standalone ({{playwright.request()}}) or attach to a {{BrowserContext}} ({{context.request()}}) to share cookies/storage.

**Step-by-step:**
- **What is APIRequestContext:** An object sending HTTP requests (GET/POST/PUT...) built into Playwright, supporting baseURL, default headers, and response parsing.
- **Why it is needed:** Many data setup (seed data) or verification steps are faster and more stable via API than UI. Example: create an order via API, then open the UI to verify display.
- **How it works (Java):**
~~~java
APIRequestContext api = playwright.request().newContext(
    new APIRequest.NewContextOptions()
        .setBaseURL("https://api.example.com"));
APIResponse res = api.post("/login",
    RequestOptions.create().setData(Map.of("u","a","p","b")));
assertEquals(200, res.status());
// Or use context.request() to carry the browser session's cookies
APIResponse me = context.request().get("/api/me");
~~~

**Common pitfalls:** Forgetting to {{dispose()}} a standalone {{APIRequestContext}}. Or needing to call an API with the same browser session but using {{playwright.request()}} (no cookie sharing) instead of {{context.request()}}.

> Senior tip: Use the API for setup/teardown data, use the UI to verify user behavior. Check {{res.ok()}} and log {{res.text()}} on failure for quick debugging. Caution: APIs running outside the UI can still create "dirty" data if teardown fails.

### Why the other options are wrong
- **{{page.evaluate}} sending fetch**: Requires an open Page, subject to the page's CORS/origin constraints, and not suitable when you want to bypass the UI.
- **{{newPage()}} navigating to endpoint**: The browser renders/handles the response as a document, not a controlled API call with method/headers/body.
- **Only {{HttpClient}} and cannot share cookies**: {{HttpClient}} works, but you must manage cookies/headers yourself. Playwright provides integrated {{APIRequestContext}}; and using {{context.request()}} shares cookies with the browser context.`
  },
  'qz-autotest-028': {
    q: 'A login test succeeds with Playwright for Java. Another test later needs the logged-in state. Which organization is reasonable to be both fast and avoid leaking secrets?',
    options: [
      'Log in via UI in {{@BeforeAll}} and share one {{Page}} across all tests',
      'Hard-code username/password in test code and commit to git for convenience',
      'Log in once (preferably via API), save {{storageState}} to a temporary file not committed, then create a new {{BrowserContext}} from that file for each test',
      'Disable authentication in the test environment to skip login'
    ],
    explain: `**Summary:** Separate authentication into a setup step that creates {{storageState}} (session state), reuse it per test via a fresh {{BrowserContext}}; keep secrets out of git.

**Step-by-step:**
- **Problem to solve:** Repeated UI login -> slow/flaky. Shared session -> tests interfere. Hard-coded credentials -> secret leak.
- **Balanced solution:**
  1. Global setup: call the login API (or UI once) to obtain a session.
  2. {{context.storageState(...setPath("playwright/.auth/user.json"))}}.
  3. Each test: {{browser.newContext(newContextOptions().setStorageStatePath(...))}} -> isolated but already logged in.
- **Security:** Read credentials from environment variables/CI secret manager; add the state file to {{.gitignore}} (it contains session tokens).
~~~java
String user = System.getenv("TEST_USER");
String pass = System.getenv("TEST_PASS"); // do not hard-code
~~~

**Common pitfalls:** Sharing one {{Page}}/{{Context}} between tests -> state leaks. Or the token in {{storageState}} expiring mid-run, failing the whole batch.

> Senior tip: Each worker/role gets its own state file. Check expiry: if navigating lands on the login page, regenerate the state. Never commit tokens/cookies or passwords.

### Why the other options are wrong
- **{{@BeforeAll}} sharing one {{Page}}**: Shares state across tests, breaking isolation; one test dirtying the session affects others.
- **Hard-code and commit**: Leaks login credentials into git history - serious security risk.
- **Disable auth in test env**: Tests no longer reflect real behavior; misses auth/authorization bugs.`
  }
});
