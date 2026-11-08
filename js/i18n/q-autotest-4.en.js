/*
 * English translation of js/data/q-autotest.js — task T746. Format: js/core/i18n.js (content overlay).
 * ids: autotest-030 autotest-031 autotest-032 autotest-033 autotest-034 autotest-035
 */
App.i18n.content({
  'autotest-030': {
    q: 'You are interviewing an SDET candidate: what do you ask, what exercise do you give to assess them, and what are your hiring criteria?',
    a: `**Summary:** Hiring an SDET (Software Development Engineer in Test – an engineer who uses code to build automation and quality tooling) has to assess both test thinking and programming ability. Ask about framework-building experience, handling flaky tests, designing tests for a critical flow, and how test data is separated. Exercises: write a small automation (API or UI) from a requirement, code-review a flaky test, or design Page Objects from a page description. Criteria: clean code, test thinking (risk, edge cases), understanding of wait/locator/data isolation, and clear communication. Avoid asking only about tools, or setting an exercise so long that the candidate burns out.

### Interview questions
- "Describe a time you dealt with a flaky test. How did you quantify it and fix the root cause?"
- "Design automation for the payment flow: do you start with the API or the UI layer, and why?"
- "How do you make sure tests running in parallel do not collide on data?"
- "How do you write a Page Object so that asserts stay out of the page?"

### Suggested exercises
1. **Write a small automation:** Give a description of the sign-up page; the candidate writes an API test (REST Assured) or a UI test (Playwright) covering successful registration and an error case (duplicate email). Assess clean code, asserts, locators.
2. **Code-review a flaky test:** Hand over a test that fails randomly; the candidate points out the cause (a hard sleep, shared data) and how to fix it.
3. **Design Page Objects:** Give a page description; the candidate draws/structures Page Objects that separate locators from actions.

### Hiring criteria
| Criterion | Description |
|---|---|
| Test thinking | Spots risk and edge cases, does not only test the happy path |
| Clean code | Clear naming, layered design, no duplicated code |
| Automation tooling | Understands wait, locators, POM, API testing |
| Data isolation | Knows how to separate data, no shared test state |
| Communication | Explains tool choices and reports defects so developers understand |

### Hiring mistakes with SDETs
- Only asking about tools (Selenium vs Playwright) and never about test thinking.
- An exercise that is too long (4 hours), so good candidates drop out.
- Not assessing the ability to work with devs/PO (an SDET needs a lot of communication).

### How to answer in an interview
Describe how you set up the interview (questions, exercise, criteria) and the reason for each part. Give an example if you have interviewed, or been interviewed, for an SDET role.

> Senior tip: A good SDET is not the person who writes the most scripts, but the one who helps the team reduce release risk with quality code. Pick people with test thinking and collaboration skills, not just people who can run a tool.`,
    follow: [
      'Based on which criteria do you judge the clean code a candidate submits in the exercise?',
      'How do you tell that a candidate has test thinking and not just coding skill?',
      'How long should the take-home exercise be, and what do you look for in the submitted code?'
    ]
  },
  'autotest-031': {
    q: 'How does Playwright for Java work under the hood: from the Java test code to the real browser, which layers does a call go through (Playwright client, Node.js driver, Chromium/Firefox/WebKit)? What is a BrowserContext, why does it isolate so well, and why is Playwright usually faster and less flaky than Selenium WebDriver?',
    a: `**Summary:** **Playwright for Java** does not talk to the browser directly over HTTP the way Selenium WebDriver does. Java code calls the **Playwright client** (the {{com.microsoft.playwright}} library) → the client starts and communicates with a **Node.js driver** (a process shipped with Playwright) → the driver uses each browser engine's **native protocol** (Chrome DevTools Protocol for Chromium, its own protocol for Firefox/WebKit) to control a real **Chromium/Firefox/WebKit**. A **Browser** is the browser process; a **BrowserContext** is an isolated "browsing profile" (cookies, localStorage, cache, session) inside that same Browser. Playwright is usually faster and less flaky because it waits for **actionability** (it waits until an element is ready to be interacted with) and keeps the control channel lean, but business-level flakiness (data, API races) can still happen.

### Why understanding the internal architecture matters
When a test is slow, hangs, or "passes sometimes, fails sometimes" (**flaky**: an unstable result even though the code has not changed), you need to know which layer the fault is in: test code, client, driver, browser, or the application. Knowing the path a command takes also explains why Playwright and Selenium (see {{autotest-002}}, {{autotest-003}}) behave differently.

### The layers involved (top to bottom)
~~~text
[Test Java (JUnit 5)]
        |
        v  (API calls: page.click, locator.fill, assertThat...)
[Playwright client - com.microsoft.playwright]
        |
        v  (pipe / internal WebSocket to the Node process)
[Playwright driver (Node.js, shipped with the Playwright package)]
        |
        v  (browser-native protocol: CDP for Chromium, ...)
[Browser engine: Chromium | Firefox | WebKit]
        |
        v
[Real web page: DOM, JS, network, render]
~~~

~~~seq
title: One Playwright action (click)
actors: Test Java | Playwright Client | Driver Node | Browser
Test Java -> Playwright Client: page.getByTestId("login").click()
Playwright Client -> Driver Node: send click command + selector
Driver Node -> Browser: check actionability, then click natively
Browser --> Driver Node: completion event / error
Driver Node --> Playwright Client: result
Playwright Client --> Test Java: continue or throw exception
~~~

- **Playwright client (Java)**: the layer you use in your code ({{Playwright}}, {{Browser}}, {{BrowserContext}}, {{Page}}, {{Locator}}). It serialises commands and receives the results.
- **Node.js driver**: a background Node process managed by Playwright. Node.js here is a **JavaScript runtime** (an environment that runs JS outside the browser) – you do not have to write any JS, but the machine running the tests needs the compatible environment that the Playwright package ships.
- **Native protocol**: instead of one common HTTP standard like W3C WebDriver, the driver speaks the engine's optimised "language". For Chromium that is usually **CDP** (Chrome DevTools Protocol – the DevTools protocol used to inspect and control the browser). This allows efficient, detailed observation and control (network, trace).
- **Browser engine**: Chromium (the base of Chrome/Edge), Firefox, WebKit (the base of Safari). Playwright downloads a matching browser build at install time (or uses system browsers, depending on configuration).

### Browser, BrowserContext, Page – tell them apart
| Concept | What it is (everyday example) | Data | Creation cost |
|---|---|---|---|
| {{Browser}} | The browser application that is running (opening Chrome) | Shares the engine process | Relatively heavy, so reuse it for the whole suite when possible |
| {{BrowserContext}} | An isolated "private window" (separate cookies/storage) | Its own cookies, localStorage, session, permissions | Lighter than a Browser; creating a new one per test makes a lot of sense |
| {{Page}} | One tab inside a context | The DOM of that tab | Light |

~~~java
import com.microsoft.playwright.*;

public class Demo {
  public static void main(String[] args) {
    try (Playwright pw = Playwright.create()) {
      // Shared Browser (e.g. in @BeforeAll) - heavy, created once
      Browser browser = pw.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
      // Isolated context per test - clean cookies/storage
      BrowserContext context = browser.newContext();
      Page page = context.newPage();
      page.navigate("https://example.test/login");
      // ... act and assert ...
      context.close(); // clean up the context
      browser.close();
    }
  }
}
~~~

### Why BrowserContext makes tests less flaky
- **State isolation**: test A logging in does not leak cookies/session into test B. Many flaky failures come from "tests depending on execution order" because they share one profile.
- **Safer parallelism**: each worker gets its own context, so there is less contention.
- Versus Selenium: WebDriver is usually tied to one browser session; to isolate cleanly you must create a new session (expensive) or clear cookies/storage yourself (easy to miss something).

### Why it is usually faster and less flaky than Selenium (and the limits)
- **Auto-wait/actionability**: before click/fill, Playwright waits until the element is visible, stable and able to receive events (see {{autotest-032}}) → fewer "not rendered yet" errors. Traditional Selenium needs manual explicit waits ({{autotest-005}}).
- **Lean control channel**: the native protocol plus a centrally managed driver make operations consistent.
- **It can still be flaky**: a slow backend API, changing test data, animation/layout shift, clocks/time zones. Playwright does **not** fix a test whose business logic is wrong.

### Common mistakes
- Creating a new {{Browser}} for every test → the whole suite gets slow; share the Browser and create a {{BrowserContext}}/ {{Page}} per test.
- Forgetting {{close()}} on context/page/browser → process leaks, CI hangs.
- Thinking "Playwright needs no waiting at all" → skipping {{waitForResponse}}/{{waitForURL}} when the business flow depends on the network (see {{autotest-032}}).
- Headless on CI differs from headful on local (fonts, viewport) → small differences; pin the viewport and use a trace on failure ({{autotest-035}}).

### How to answer in an interview
State the chain clearly: "Java test → Playwright client → Node driver → native protocol (CDP/engine) → Chromium/Firefox/WebKit". Distinguish {{Browser/BrowserContext/Page}} and give the strategy: share the Browser, **one Context per test** for isolation. Compare briefly with Selenium (W3C HTTP + a driver binary, {{autotest-002}}) and stress that auto-wait reduces timing flakiness, but data and business conditions still have to be controlled.

> Senior tip: Do not "save time" by sharing one {{BrowserContext}} across the whole suite – you will pay that time back many times over hunting bugs caused by state leaking between tests. Isolation (a clean context) plus a trace on failure is the foundation of a stable CI.`,
    follow: [
      'When do you share the Browser but create a new BrowserContext, and when do you actually need several Browsers?',
      'Playwright uses CDP for Chromium – what does that mean for Firefox/WebKit and for cross-browser testing?',
      'A Playwright test is still flaky even with auto-wait: which architecture layers do you narrow it down through?'
    ]
  },
  'autotest-032': {
    q: 'How do Playwright auto-wait, actionability checks and web-first assertions ({{assertThat(locator)}} retries by itself) work? How are timeouts configured, why are explicit waits almost never needed, and when do you still need {{waitForResponse}}/{{waitForURL}}?',
    a: `**Summary:** Playwright **auto-waits** before an action: {{click()}}, {{fill()}}, {{check()}}… only execute once the element passes **actionability** (being interactable: attached to the DOM, visible, stable, receives events, enabled…). **Web-first assertions** such as {{assertThat(locator).hasText(...)/isVisible()}}, from {{PlaywrightAssertions}}, **retry** until the condition holds or the timeout expires, instead of reading a value once and comparing it. Timeouts can be set globally ({{setDefaultTimeout}}), for assertions ({{setDefaultAssertionTimeout}}), or per single call. That is why you **almost never need explicit waits** of the "find, then sleep/wait by hand" style used in Selenium ({{autotest-005}}), but you still need {{waitForResponse}}/{{waitForURL}}/{{waitForCondition}} when you must synchronise with a **business/network event** that actionability says nothing about.

### What auto-wait is (explained from the ground up)
A web page loads and renders **asynchronously** (async – things do not happen in immediate order): JS adds a button after 500ms, an animation moves the button, an API returns data before the table appears. If the tool clicks while the button is not ready → failure. **Auto-wait** means the tool waits by itself until the action is safe, within a time limit (the **timeout** – past that limit it reports an error).

### Actionability checks
Before actions such as {{click}}, Playwright verifies (depending on the action) conditions like: the element is **attached** (still in the DOM), **visible**, **stable** (not moving/animating so the click point would shift), **receives events** (not covered by another layer), **enabled** (not disabled), and for {{fill}} it must be **editable**. You never call a wait chain yourself; the action bundles the check and the execution.

~~~java
import com.microsoft.playwright.*;
import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

Page page = context.newPage();
page.navigate("https://shop.test");
// No Thread.sleep needed: click waits for the button to become actionable
page.getByTestId("add-to-cart").click();
// fill waits for the input to become editable
page.getByLabel("Email").fill("a@b.test");
~~~

### Web-first assertions vs plain asserts
- **Plain assert** (JUnit style, {{assertEquals(text, "Hello")}}): you read the text **once**; if the UI updates 200ms later, the test fails even though the app is correct – you would have to wait yourself.
- **Web-first assertion** ({{assertThat(locator)...}}): Playwright **re-reads/retries** until it matches or until the timeout. It "follows" a DOM that is changing.

~~~java
// Web-first: retries until the text matches (assertion default ~5s)
assertThat(page.getByTestId("status")).hasText("Payment complete");
assertThat(page.getByRole(AriaRole.HEADING,
    new Page.GetByRoleOptions().setName("Cart"))).isVisible();

// Set a separate assertion timeout (ms)
assertThat(page.getByTestId("slow-banner"))
    .isVisible(new LocatorAssertions.IsVisibleOptions().setTimeout(15000));
~~~

### Timeouts: the configuration levels
| Level | How to set it (the idea) | Applies to |
|---|---|---|
| Default action/navigation | {{page.setDefaultTimeout(ms)}} or {{context.setDefaultTimeout(ms)}} | click/fill/waitForSelector… |
| Default assertion | {{PlaywrightAssertions.setDefaultAssertionTimeout(ms)}} | {{assertThat(...)}} |
| Per single call | the optional {{.setTimeout(...)}} on an action/assert/waitFor | Particularly slow cases |

~~~java
// Example: raise the timeout for a slow staging environment
page.setDefaultTimeout(30_000);
PlaywrightAssertions.setDefaultAssertionTimeout(10_000);
~~~

### Why explicit waits are almost not needed (compared with Selenium)
Selenium usually goes: {{findElement}} + {{WebDriverWait.until(clickable/visible)}} + sometimes {{Thread.sleep}} (bad practice) to dodge races ({{autotest-005}}). Playwright folds the waiting into the **action** and the **assertion**. You still write intent ("click this button", "see this text"), not "wait 3 seconds".

### When you STILL need {{waitForResponse}}/{{waitForURL}}/a business wait
Actionability only knows whether an element "can be clicked"; it does **not** know whether your business operation is finished.
- **{{page.waitForResponse(...)}}**: wait for an HTTP response that matches (URL/matcher) – use it when the UI changes only after the order-saving API returns 200.
- **{{page.waitForURL(...)}}**: wait for navigation to a URL/pattern (after a login redirect).
- **{{waitForCondition}}** / waiting on a locator state: a custom condition.

~~~java
// Wait for the order-creation API to finish, then assert the result page
Response resp = page.waitForResponse(
    r -> r.url().contains("/api/orders") && r.request().method().equals("POST"),
    () -> page.getByTestId("submit-order").click()); // run the action inside the lambda
if (resp.status() != 201) throw new AssertionError("Order creation failed: " + resp.status());
page.waitForURL("**/orders/*/success");
assertThat(page.getByTestId("order-id")).isVisible();
~~~

### Common mistakes
- Using {{Thread.sleep}} "just to be safe" → the test gets slow and is still flaky; use conditional assertions/waitFors instead.
- Setting a very large global timeout → a genuine failure takes a very long time to be reported.
- Asserting with {{page.locator(...).textContent()}} (read once) instead of {{assertThat(...).hasText(...)}} → you throw away the retry benefit yourself.
- Forgetting that {{toBeVisible}} is not the same as "present in the DOM": an element can exist but be hidden.

### How to answer in an interview
Explain three points: (1) actions wait for **actionability**, (2) {{assertThat}} **retries** (web-first), (3) timeouts are configurable at several levels. Say clearly that "explicit waits are almost never needed" but waiting for a response/URL **is still needed** for business conditions – and give the example of {{waitForResponse}} wrapped around the submit click (compared with Selenium {{autotest-005}}).

> Senior tip: When writing a test, ask yourself: "Am I waiting for the **UI to be interactable**, or for the **business operation to complete**?" Let Playwright's auto-wait handle the first; the second needs the correct signal (response, URL, data state) – do not mix both together with a single sleep.`,
    follow: [
      'What is the difference between {{assertThat(locator).isVisible()}} and the boolean returned by {{locator.isVisible()}}?',
      'How do you choose a {{waitForResponse}} matcher so it does not match the wrong request (polling, analytics)?',
      'When an action times out, how do you use trace/screenshot to find out what state the element is in?'
    ]
  },
  'autotest-033': {
    q: 'How do you organise Playwright for Java tests with JUnit 5: sharing the Browser, creating a new BrowserContext/Page per test (extension/fixture), writing Page Objects with Locators, and using {{storageState}} to reuse login state?',
    a: `**Summary:** A lean structure: **{{Playwright}} + {{Browser}}** are shared (expensive to start, created once for the suite), while **{{BrowserContext}} + {{Page}}** are created **per test** for isolation ({{autotest-031}}). With JUnit 5 you wrap this lifecycle in **{{@BeforeAll/@AfterAll}}** (or an {{Extension}}) plus **{{@BeforeEach/@AfterEach}}**; community extensions (for example {{microsoft/playwright-junit}}) can act as ready-made "fixtures". A **Page Object** (POM, {{autotest-006}}) holds {{Locator}}s and actions; the test only calls business operations and asserts with web-first assertions. **{{storageState}}** saves the cookies/localStorage after logging in once and loads them into a new context → the repeated login step is skipped, which is faster and less flaky.

### Organisational goals
- Tests are **independent** and can run in parallel (one failure is not caused by "residue" from another run).
- Reasonable cost: do not open a new browser per test, but still isolate state.
- Maintainable code: when the UI changes you fix the Page Object, not dozens of tests.

### Suggested lifecycle (JUnit 5)
~~~java
import com.microsoft.playwright.*;
import org.junit.jupiter.api.*;
import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

@TestInstance(TestInstance.Lifecycle.PER_CLASS) // allows a non-static @BeforeAll
class CheckoutTests {
  Playwright pw;
  Browser browser;

  @BeforeAll
  void launch() {
    pw = Playwright.create();
    browser = pw.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
  }

  BrowserContext context;
  Page page;

  @BeforeEach
  void createContext(TestInfo info) {
    // One clean context per test; you can set a shared viewport/locale
    context = browser.newContext(new Browser.NewContextOptions()
        .setViewportSize(1280, 720));
    page = context.newPage();
  }

  @AfterEach
  void closeContext() {
    if (context != null) context.close(); // clears this test's cookies/storage
  }

  @AfterAll
  void closeAll() {
    if (browser != null) browser.close();
    if (pw != null) pw.close();
  }

  @Test
  void addItem_showsInCart() {
    page.navigate("https://shop.test");
    page.getByTestId("add-sku-1").click();
    assertThat(page.getByTestId("cart-count")).hasText("1");
  }
}
~~~
- **Fixture** (a general concept): the "prepare/clean up" part that tests reuse. Here {{createContext/closeContext}} is the per-test fixture.

### Page Objects with {{Locator}}
A {{Locator}} is an object representing how to find an element (lazy – it auto-waits when used), which makes it a good Page Object field. Avoid stuffing {{assert}} calls into a Page Object; return data or return the next Page Object, and let the test decide what to check.

~~~java
class LoginPage {
  private final Page page;
  private final Locator user;
  private final Locator pass;
  private final Locator submit;

  LoginPage(Page page) {
    this.page = page;
    this.user = page.getByTestId("username");
    this.pass = page.getByTestId("password");
    this.submit = page.getByRole(AriaRole.BUTTON,
        new Page.GetByRoleOptions().setName("Log in"));
  }

  HomePage loginAs(String u, String p) {
    user.fill(u);
    pass.fill(p);
    submit.click();
    page.waitForURL("**/home"); // wait for the business navigation
    return new HomePage(page);
  }
}

// Test: call the action, assert in the test
@Test
void login_ok() {
  page.navigate("https://shop.test/login");
  HomePage home = new LoginPage(page).loginAs("alice", "secret");
  assertThat(home.welcomeBanner()).containsText("alice");
}
~~~

### {{storageState}}: reusing the login
Logging in through the UI in every test is both slow and flaky-prone (CAPTCHA, rate limits, dependency on the IdP). **{{storageState}}** is a "snapshot" of the authentication state (cookies + localStorage origins) written to a JSON file, which is then loaded into a new context.

~~~java
// STEP 1: run once (setup) to create the login state file
void saveAuthState() {
  BrowserContext ctx = browser.newContext();
  Page p = ctx.newPage();
  p.navigate("https://shop.test/login");
  p.getByTestId("username").fill("alice");
  p.getByTestId("password").fill("secret");
  p.getByTestId("login-submit").click();
  p.waitForURL("**/home");
  // Save the authenticated cookies/localStorage
  ctx.storageState(new BrowserContext.StorageStateOptions()
      .setPath(java.nio.file.Paths.get("auth.json")));
  ctx.close();
}

// STEP 2: each test loads the state -> already logged in
@BeforeEach
void createAuthedContext() {
  context = browser.newContext(new Browser.NewContextOptions()
      .setStorageStatePath(java.nio.file.Paths.get("auth.json")));
  page = context.newPage();
}
~~~

~~~seq
title: Reusing login with storageState
actors: Setup | Auth File | Test Context | App
Setup -> App: log in through the UI once
App --> Setup: session cookie
Setup -> Auth File: save storageState (auth.json)
Test Context -> Auth File: load state on newContext
Test Context -> App: go straight to the page that needs auth
~~~

### Common mistakes
- Sharing a {{Page}}/Context between tests → tests affect each other (login leaks, shopping carts left behind).
- {{storageState}} expiring (token timeout) → mass failures; regenerate the state in a CI setup step or shorten the state's lifetime.
- Pushing complex wait/assert logic into Page Objects → hard to read; keep a Page Object as a "map plus actions".
- Brittle CSS locators instead of stable {{getByTestId/getByRole}} ({{autotest-004}} still applies).

### How to answer in an interview
State the lifecycle clearly: a shared {{Browser}}, **Context/Page per test** (JUnit 5 {{@BeforeEach/@AfterEach}} or an extension). Present the POM built on {{Locator}}s (relate it to {{autotest-006}}) and its maintenance benefit. Explain {{storageState}} as "log in once, load the session" to speed tests up and cut flakiness – including the caveat about expiring tokens.

> Senior tip: Treat "login" as a **precondition** of a business test, not as something every run must re-verify. Use {{storageState}} (or seed the session through the API) for most tests; keep only a few E2E tests that go through the real UI login flow, so authentication behaviour stays covered.`,
    follow: [
      'When should you seed a session through the API instead of saving {{storageState}} from the UI?',
      'How do you structure BaseTest/Extension to add trace and screenshot when a test fails (relates to {{autotest-035}})?',
      'In an SPA, should Page Objects be split per page or per component (header, modal)?'
    ]
  },
  'autotest-034': {
    q: 'In Playwright for Java, how do you handle iframes ({{frameLocator}}), popups/new tabs ({{waitForPopup}}), downloads ({{waitForDownload}}), uploads ({{setInputFiles}}), dialogs, and network interception ({{page.route}}) to mock the backend?',
    a: `**Summary:** Real websites contain many situations that are "harder than clicking a button on one page": content embedded in an **iframe** (a page inside a page), a **popup/new tab** opening, **downloading/uploading files**, native dialog boxes (**dialog**: {{alert/confirm/prompt}}), and dependence on **slow/failing APIs**. Playwright for Java has a dedicated API for each: {{frameLocator()}} to act inside an iframe (with waiting built in), {{page.waitForPopup()}} to capture a new tab/window, {{page.waitForDownload()}} + {{download.saveAs()}}, {{locator.setInputFiles()}} for uploads, {{page.onDialog()}} to handle dialogs, and **{{page.route()}}** to block/modify/mock network requests. Using the right tool keeps tests stable and (when mocking is deliberate) reduces dependence on the environment.

### 1) iframe: use {{frameLocator}}
An **iframe** (inline frame) is an HTML document embedded inside the parent page – the DOM inside it is separate, so {{page.locator}} normally cannot see through. {{frameLocator}} points at the frame and then finds elements within it, still benefiting from auto-wait.

~~~java
// The parent page has <iframe id="pay-frame" ...> containing the confirm button
FrameLocator pay = page.frameLocator("#pay-frame");
pay.getByTestId("confirm-pay").click();
assertThat(pay.getByText("Success")).isVisible();
~~~
Pitfall: a selector pointing at the wrong frame (several nested iframes) → you have to walk one {{frameLocator}} layer at a time.

### 2) Popup / new tab: {{waitForPopup}}
A click can open a new window/tab ({{window.open}} or {{target=_blank}}). Capture the new {{Page}} object by waiting for the popup **at the same time** as the action that opens it.

~~~java
Page popup = page.waitForPopup(() -> {
  page.getByRole(AriaRole.LINK,
      new Page.GetByRoleOptions().setName("Open receipt")).click();
});
popup.waitForLoadState();
assertThat(popup).hasURL(java.util.regex.Pattern.compile(".*receipt.*"));
popup.close();
~~~

~~~seq
title: Capturing a popup on link click
actors: Test | Main Page | Popup Page | Browser
Test -> Main Page: click "Open receipt"
Main Page -> Browser: window.open / new tab
Browser --> Popup Page: a new Page is created
Test -> Popup Page: waitForPopup returns the Page, assert URL
~~~

### 3) Download: {{waitForDownload}}
Catch the file-download event triggered by an action; save it to a path so you can check it (name, that it exists). On CI you need write permission for that directory.

~~~java
Download download = page.waitForDownload(() -> page.getByTestId("export-csv").click());
String suggested = download.suggestedFilename();
download.saveAs(java.nio.file.Paths.get("build/test-downloads/" + suggested));
// You can also assert the file exists / its size is > 0
~~~

### 4) Upload: {{setInputFiles}}
For an {{<input type="file">}}, set the file path (or a payload). There is no OS dialog to drive – Playwright sets the input directly.

~~~java
page.getByTestId("avatar-upload").setInputFiles(
    java.nio.file.Paths.get("src/test/resources/avatar.png"));
assertThat(page.getByTestId("upload-ok")).isVisible();
~~~

### 5) Dialog: {{page.onDialog}}
A native **dialog** ({{alert}}, {{confirm}}, {{prompt}}) blocks the page if nothing handles it. Register the handler **before** the action that triggers the dialog.

~~~java
page.onceDialog(dialog -> {
  // dialog.type(), dialog.message() to assert if needed
  dialog.accept("Cancellation reason"); // or dialog.dismiss()
});
page.getByTestId("delete-btn").click();
~~~

### 6) Network interception / mocking the backend: {{page.route}}
{{page.route(urlPattern, handler)}} intercepts requests that match, so you can: return a fake response (mock), modify header/body, or call {{route.abort()}}. Useful when the backend is not ready yet, when you want to test a 500 error, or to isolate the UI. **Be careful**: mock too much → the test is no longer a real E2E test.

~~~java
// Mock the product list API to return a fixed JSON
page.route("**/api/products", route -> {
  String body = "[{\"id\":1,\"name\":\"SKU-1\"}]";
  route.fulfill(new Route.FulfillOptions()
      .setStatus(200)
      .setContentType("application/json")
      .setBody(body));
});
page.navigate("https://shop.test/products");
assertThat(page.getByText("SKU-1")).isVisible();
~~~

| Situation | Main API | Remember |
|---|---|---|
| iframe | {{frameLocator}} | Separate DOM; can be nested |
| new tab/popup | {{waitForPopup}} | Wait concurrently with the click that opens it |
| download | {{waitForDownload}} | Save the file, check that it exists |
| upload | {{setInputFiles}} | Set the file input directly |
| alert/confirm/prompt | {{onDialog}}/{{onceDialog}} | Register before triggering |
| mock/block network | {{page.route}} | Only mock deliberately |

### Common mistakes
- Looking for an element inside an iframe with {{page.locator}} → nothing is found; you must use {{frameLocator}}.
- Calling {{waitForPopup}} after the click has finished → you may miss the event; always wrap the action in the {{waitForPopup}} lambda.
- A {{route}} pattern that is too broad ({{**/*}}) → you also block CSS/JS/fonts and the page breaks.
- Forgetting {{removeRoute}}, or using {{onceDialog}} in the wrong situation → it affects later tests if the context is shared (avoid it with a per-test context).

### How to answer in an interview
Walk through each case with its API and one practical note (an iframe has a separate DOM, a popup must be waited for together with the action, do not mock everything with route). Emphasise that mocking the backend with {{route}} is a **deliberate tool** (isolated UI tests / error cases), while important E2E flows should still run against a controlled integration environment.

> Senior tip: For the "abnormal" cases (iframe, popup, download), write small helpers with clear log/trace output. These break differently on local versus CI (file permissions, headless mode, popup blocking) – do not wait until the pipeline is red before you work out how to reproduce them.`,
    follow: [
      'When do you mock with {{page.route}} and when do you use WireMock or a stub service at the infrastructure layer (relates to {{autotest-014}})?',
      'How do you handle uploading several files, or a file input that is hidden (no visible browse button)?',
      'If a popup gets blocked by browser policy in the test environment, how do you handle it?'
    ]
  },
  'autotest-035': {
    q: '(Lead) Debugging a Playwright test that fails on CI: how do you use Trace Viewer ({{tracing.start/stop}}, {{show-trace}}), video, screenshots and codegen? How do you design the artifact strategy and the flaky triage process for a team?',
    a: `**Summary:** A failure on **CI** (Continuous Integration – the system that runs tests automatically on every code push) is harder than locally, because nobody is watching a screen. Playwright provides **artifacts** (material/evidence for investigation): the **trace** (a recording of interactions, DOM snapshots, network, console) viewed with **Trace Viewer** ({{tracing.start/stop}}, opened via {{npx playwright show-trace}} or an equivalent tool), **video**, **screenshot**. **codegen** generates sample locators/actions so you can reproduce or rewrite a fragile step. At lead level: standardise **when artifacts are collected** (always on failure, optionally sampled), **where they are stored and for how long**, a **naming convention tied to build + test**, and a **flaky triage process** (classify, owner, root fix, track the rate) so the team does not just "rerun until green".

### Why CI failures are hard to debug
- The environment differs from local: headless, slower CPU, different network, locale/timezone, test data.
- Nobody sees the moment of failure; text logs usually lack UI/network context.
- **Flaky** ({{autotest-003}}, {{autotest-015}}): with the same commit, a re-run may pass → if you only press rerun, the root cause is still there.

### Trace: a "camera" for your test
A **trace** records a timeline: actions, DOM snapshots, requests/responses, console. Enable it per context:

~~~java
BrowserContext context = browser.newContext();
context.tracing().start(new Tracing.StartOptions()
    .setScreenshots(true)   // images inside the trace
    .setSnapshots(true)     // DOM snapshot
    .setSources(true));     // attach source (useful when debugging)

try {
  // ... run the test ...
} finally {
  // Only save on failure to save space (a team decision)
  context.tracing().stop(new Tracing.StopOptions()
      .setPath(java.nio.file.Paths.get("build/traces/" + testName + ".zip")));
  context.close();
}
~~~

Opening a trace (on a machine that has the Playwright tooling): use the CLI {{npx playwright show-trace path/to/trace.zip}} (Playwright's Node toolchain) or a viewer integrated into the CI report. Trace Viewer shows every step: which locator, what the page looked like at that moment, which request was slow or failed.

### Video and screenshot
- **Video**: configured with {{recordVideo}} when creating the context (for example by setting {{dir}}) to record the whole session; useful for seeing overall behaviour, but heavy.
- **Screenshot**: captured at the moment of failure ({{page.screenshot(...)}} in {{@AfterEach}} when the test failed) – light and quick to read.
- A pragmatic strategy: **trace on failure** (the richest information) + screenshot on failure; turn video on when you need to reproduce a rare case, or on nightly builds.

### Codegen
**Codegen** ({{npx playwright codegen <url>}}) opens a browser that records your actions and suggests locators/code. Use it to: discover stable selectors, quickly reproduce a reported flow, or compare the suggested locators with your current POM. Do not paste codegen output straight into the suite without review (locators may not be durable and business asserts are missing).

~~~bash
# Suggested command (run manually when investigating), never inside test code
# npx playwright codegen https://staging.example.test
~~~

### Artifact strategy for the team
| Decision | Suggestion |
|---|---|
| When to collect | Trace/screenshot **on failure**; optionally trace "on-first-retry" if the framework supports controlled retry |
| Naming | {{<build>-<suite>-<class>-<method>-<attempt>.zip/png}} so you can trace back |
| Storage | The CI system's artifacts (GitHub Actions artifacts, Jenkins stash…) + retention (7–30 days depending on cost) |
| Security | A trace can contain cookies/tokens/PII; **filter / do not record** sensitive data, restrict view access |
| Linking | Attach the artifact link to the ticket/Allure report ({{autotest-011}}) |

### The flaky triage process (lead)
~~~seq
title: Flaky test triage process
actors: CI | Dev/SDET | Tracker | Owner
CI -> Dev/SDET: failure + attached trace/screenshot
Dev/SDET -> Tracker: classify (env flaky|timing|data|real bug)
Tracker -> Owner: assign owner + priority
Owner -> CI: fix root cause (proper wait, data isolation, mock)
CI --> Tracker: track pass/flake rate over time
~~~

1. **Detection**: a failure with artifacts attached; mark it "suspected flaky" if the rerun passes (but still open a ticket).
2. **Classification**: wrong timing/auto-wait ({{autotest-032}}), state leakage (missing isolated context, {{autotest-033}}), shared data, a dependency on an external service, or a **real product bug**.
3. **Root-cause fix**: wait for the right signal ({{waitForResponse/URL}}), isolate the data, stabilise the locator, mock deliberately ({{autotest-034}}), fix the app if it is a bug.
4. **Threshold**: set an SLO (for example the main suite below 1% flaky) and do **not** accept an "indefinite quarantine" without an owner.

### Common mistakes
- Turning on trace+video for every test every time → storage cost, slow CI.
- Auto-rerunning until green without recording anything → hiding quality debt.
- A trace containing tokens/secrets → leakage; use clean contexts, avoid logging in with sensitive real accounts, review the artifact policy.
- Looking only at the final screenshot and skipping the trace timeline → you miss the failing request that caused it.

### How to answer in an interview
Present the tools: the trace ({{start/stop}}, Trace Viewer) is the most powerful, screenshot/video support it, codegen helps you reproduce. Then talk like a lead: an **artifact strategy** (on-failure, naming, retention, security) and a **triage process** (classify → owner → root fix → measure the rate), stressing that rerun is not a substitute for fixing flakiness.

> Senior tip: A trustworthy pipeline treats flakiness as a **quality incident** with an owner and a deadline, not as "a property of UI tests". Good artifacts (a trace) turn the "it works on my machine" argument into evidence that can be replayed step by step.`,
    follow: [
      'At what level do you enable tracing (BrowserContext vs global) when many tests run in parallel?',
      'When the trace exposes tokens/sessions in request headers, how do you reduce the risk?',
      'How do you tell a flaky test apart from a product bug when all you have are CI artifacts?'
    ]
  }
});
