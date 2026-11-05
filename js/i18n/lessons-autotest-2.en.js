/*
 * English translation of js/data/lessons-autotest.js — task T760. Format: js/core/i18n.js (content overlay).
 * ids: lesson-autotest-003 lesson-autotest-004
 */
App.i18n.content({
  'lesson-autotest-003': {
    title: 'Wait: implicit, explicit, fluent, and Playwright auto-wait',
    goals: [
      'Explain why Thread.sleep makes tests both slow and flaky',
      'Distinguish implicit wait, explicit wait, and fluent wait — when to use which',
      'Understand polling interval, ignored exceptions, and StaleElementReferenceException',
      'Describe the wait loop in pseudocode and know why implicit and explicit must not be mixed',
    ],
    body: `### Why UI tests must wait
Modern web pages **render progressively**: HTML arrives first, JavaScript runs after, data loads over XHR/fetch and only then fills the DOM. When the script clicks "Search", the result may **not yet exist** for a few hundred ms to a few seconds. Saying "click the result element right now" means at that millisecond the node is missing — the engine throws {{NoSuchElementException}} (element not found). **Wait** is the mechanism of "patiently re-querying until the condition is met".

### Thread.sleep: guessing, never knowing
~~~java
driver.get("https://shop.example/checkout");
Thread.sleep(3000);          // "surely done in 3 seconds"
driver.findElement(By.id("pay-now")).click();
~~~

The number 3000 is a **guess**: slow CI machine → 4 seconds → test fails even though the app is correct (flaky — passes sometimes, fails sometimes, not due to code); fast machine waits uselessly. Multiplied out: suite of 200 tests × 3 seconds = **600 seconds of unnecessary sleep per run**. And sleep **does not state what it is waiting for**: waiting for what? — nobody knows, not even the test reader. Hence it is the most common anti-pattern in new automation suites.

### Implicit wait: "every findElement may nag up to X seconds"
~~~java
driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(5));
~~~

Once set, **every** missing {{findElement}} polls up to 5 seconds before throwing. Convenient because set once, but four limits: (1) it only answers "does the element **exist** in the DOM yet" — invisible or disabled nodes still get returned, clicking a hidden node fails differently; (2) {{findElements}} (plural) polls the full 5 seconds even when the correct answer is "empty" — waiting 5 seconds to conclude nothing exists is expensive; (3) set on the driver, it affects even places where you want fast failure; (4) **mixing with explicit wait produces unpredictable wait times** (below).

### Explicit wait: wait for the right condition, in the right place
~~~java
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10), Duration.ofMillis(200));
WebElement pay = wait.until(ExpectedConditions.elementToBeClickable(By.id("pay-now")));
// other common helpers:
// visibilityOfElementLocated, presenceOfElementLocated, textToBePresentInElement,
// titleIs, numberOfElementsToBe..., stalenessOf(element)
~~~

{{WebDriverWait}} loops: try the condition; if not met, **sleep the polling interval** (3rd argument, default 500 ms) then retry; on timeout throw {{TimeoutException}}. Core difference from implicit: the condition is not just "node exists" but **usable state** ({{elementToBeClickable}} = visible + not disabled), and you choose what to wait for, where, and how long. By default {{WebDriverWait}} swallows {{NoSuchElementException}} while polling (that is "condition not yet met", not an error).

### FluentWait: full control
~~~java
Wait<WebDriver> wait = new FluentWait<>(driver)
    .withTimeout(Duration.ofSeconds(10))
    .pollingEvery(Duration.ofMillis(250))
    .ignoring(StaleElementReferenceException.class)
    .withMessage("cart not updated after 10s");
WebElement cart = wait.until(d -> d.findElement(By.id("cart-count")));
~~~

{{StaleElementReferenceException}} is the exception you must understand in order to ignore it correctly: you already obtained a {{WebElement}}, but the SPA re-rendered and threw that node **out of the tree** — the object you hold becomes a "stale reference", every operation on it throws. FluentWait catches and retries: the next find gets a fresh node. Rule: ignore **errors meaning "condition not yet met"**, never swallow {{TimeoutException}} or {{NullPointerException}} — the test would swallow real bugs.

**Why not mix implicit + explicit**: implicit applies to every findElement. Set implicit to 10 s, then run WebDriverWait 10 s which calls findElement inside: each **polling attempt** of explicit can get stuck for 10 seconds inside implicit → one wait becomes 20+ seconds, erratic, and Selenium warns about it in the docs. Practical standard: **implicit = 0, every wait explicit**; only set a short implicit in legacy suites with no time to refactor.

### Playwright: auto-wait by default
Playwright flips the default — **no need to write waits**, because:

- {{page.click("#pay-now")}} before clicking checks **actionability**: element attached (in DOM), **visible**, **stable** (no longer moving — wait for animation to finish), **enabled**, receives events (not covered by overlay). If not met, retry up to the default timeout (action: 30 seconds).
- {{locator.waitFor()}} actively waits for a state; {{expect(locator).toBeVisible()}} (a "web-first" assertion) retries for 5 seconds — assertions that wait, eliminating the "ask before render" flakiness.

~~~java
page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Add to cart")).click();
page.locator(".toast-success").waitFor();
expect(page.getByTestId("cart-count")).toHaveText("3");   // retries itself, no sleep needed
~~~

### Common mistakes
- Sleep after every click "just in case" → suite swells to 40 minutes, CI clogged.
- Waiting for an element to **disappear** (modal closing): implicit does not help because it matches the first node still present; use a negative condition ({{stalenessOf}}, Playwright {{isHidden}}).
- Waiting for data to "settle" via UI wait: element visible but data arrives 200 ms later — wait for a business condition (text changed, row count), not just appearance.
- Timeout "to be safe" 60 seconds for everything: masks real slowness; choose timeout by p95 of the action.

### Interview connection
Question: "How do you keep your tests stable?" — do not answer "I set wait to 10s"; answer in layers: implicit off, explicit waits on **state conditions** (clickable/visible/text), ignore the correct exception types, and measure flaky rate. Question "what about Playwright auto-wait?" — auto-wait handles **elements**, not **business races** (two requests arriving together), so web-first assertions and waiting for data conditions are still needed. Finish the exercise below (write the wait loop yourself with FakeClock) and you grasp the loop both Selenium and Playwright run underneath.

> Senior tip: wait time is a suite budget. A good suite has p95 per test close to real business-action time plus infrastructure latency, not the sum of configured timeouts. When CI bloats, the first thing is to grep {{sleep}} and find implicit waits — those two usually consume half the time.`,
    exercises: [
      {
        title: 'FluentWait on FakeClock: timeout, polling, ignoring',
        prompt: `Reimplement {{FluentWait}} working with {{FakeClock}} (a simulated clock — tests advance time via {{clock.advance(ms)}}, no real sleeping). {{until}} loops until the condition is met or the budget runs out:

~~~text
poll at elapsed 0 -> not met? -> advance(every) -> if elapsed > atMost: throw WaitTimeoutException
poll -> not met? -> advance -> ...
met: return value immediately (no further advance)
~~~

Exact rules:

1. {{until(condition)}}: call {{condition.get()}}. Returns **non-null** → return the value, end.
2. Condition throws {{RuntimeException}}: if it is an instance of **one of the {{ignoring}} classes** (including subclasses — use {{isInstance}}) → treat as not met; otherwise **rethrow immediately** (before advancing).
3. After each not-met: {{clock.advance(every)}}; if {{clock.now() - start > atMost}} → throw {{WaitTimeoutException}}.
4. Fluent setters {{atMost}}, {{every}}, {{ignoring}} return {{this}}. Defaults: {{atMost = 5000}}, {{every = 500}}, nothing ignored. {{start}} is recorded when {{until}} is called.

{{FakeClock}}, {{WaitTimeoutException}}, {{StaleException}} are given and correct. Example with {{every = 200}}: condition met on 3rd poll → {{clock.now() == 400}}; condition always null with {{atMost = 1000}} → poll 6 times at 0,200,400,600,800,1000, advance to 1200 then throw {{WaitTimeoutException}}.`,
              hints: [
          'Loop: {{while (true)}} — each iteration tries the condition; on success {{return}}, otherwise advance then check timeout. Record {{start = clock.now()}} **before** the loop.',
          'Catch {{RuntimeException}} (not Exception) so NPE/IllegalState are not swallowed; test ignored with {{c.isInstance(e)}}.',
          'Common bug: using {{>=}} instead of {{>}} — one operator flip makes poll count and time thresholds all wrong (this lesson checks exact milliseconds).',
        ],
        explain: `{{isInstance}} (not {{==}} on class) makes {{ignoring(StaleException.class)}} also catch {{DetachedException}} — in real Selenium, the driver throws a few subclasses of the same error type, so ignoring by **family** is required behavior.

{{FakeClock}} is Clock injection (covered in the testing track) applied to waits: the whole exercise runs in fake milliseconds and **reproduces the timeout scenario exactly** without waiting — this is also how you unit-test retry/backoff code in real services ({{RetryTemplate}}, resilience4j).

Watch the {{>}} vs {{>=}} boundary: the spec chooses "advance first, then check", so the last poll happens when elapsed == atMost and throws only right after exceeding it. When reviewing a suite, ask the wait author "when is the last poll considered expired?" — anyone who cannot answer usually copied the number 10 seconds.`,
      },
    ],
    check: [
      {
        q: 'Why is {{Thread.sleep(3000)}} an anti-pattern in UI tests?',
        options: [
          'Because sleep uses a lot of memory',
          'Because sleep is a guess: too short fails on slow machines, too long slows CI, and it expresses no condition',
          'Because Java forbids sleep in tests',
          'Because Playwright has no such API',
        ],
        answer: 1,
        explain: 'Problem in both directions: fast machines wait uselessly (suite of 200 tests × 3 s = 10 minutes thrown away), slow machines do not get enough (false failures). Correct waiting waits for a **condition**, not **time**.',
      },
      {
        q: 'What happens when you set implicit wait to 10 s and use WebDriverWait 10 s (with findElement inside)?',
        options: [
          'The two mechanisms cancel each other',
          'Each explicit poll can get stuck up to 10 s inside implicit → 20+ s waits, erratic',
          'No effect',
          'Driver reports a config error immediately',
        ],
        answer: 1,
        explain: 'Implicit applies to **every** findElement; explicit calls findElement many times while polling → time multiplies, and Selenium docs recommend implicit = 0 when using explicit.',
      },
      {
        q: 'Before clicking, Playwright auto-wait checks what? Pick the option NOT in the list.',
        options: ['Element visible', 'Element enabled', 'Element stable (not moving)', 'Element background color matches the theme'],
        answer: 3,
        explain: 'Actionability = attached, visible, stable, enabled, receives events. Color/theme is not an interaction condition, so it is not checked.',
      },
      {
        q: 'Why can StaleElementReferenceException occur AFTER findElement already succeeded?',
        options: [
          'Driver lost network',
          'SPA re-render removes the node from the DOM — the held WebElement becomes stale',
          'Element was hidden',
          'Implicit wait too long',
        ],
        answer: 1,
        explain: 'WebElement is a pointer to a specific node in the DOM tree; framework re-renders create a new node at the same spot, the old pointer becomes stale. Hence correct waits must catch-and-retry by **re-finding**.',
      },
    ],
  },
  'lesson-autotest-004': {
    title: 'Page Object Model and Page Factory / Screenplay: organizing UI test code so it survives UI changes',
    goals: [
      'Separate locators + actions from tests and clarify where assertions belong',
      'Write fluent page objects returning the next page and explain the benefit',
      'Critique one-step-wrapper POM and deprecated PageFactory',
      'Compare POM with Screenplay and say when to use which',
    ],
    body: `### Problem: tests stuck to the page
~~~java
// tightly coupled test - every locator lives in the test
@Test
void loginSuccess() {
    driver.get("https://shop.example/login");
    driver.findElement(By.id("user")).sendKeys("bean");
    driver.findElement(By.id("pass")).sendKeys("secret123");
    driver.findElement(By.cssSelector("button.primary")).click();
    assertEquals("bean", driver.findElement(By.id("welcome-user")).getText());
}
// ... 39 more tests copy the same locator block
~~~

Next week frontend renames id {{user}} → {{username}}: 40 places to fix, each a risk of a missed edit. Test failures say "node not found" instead of "login screen broken" — developers reading them cannot tell where the real fault is. This is why unstructured UI suites die: unfixable, so people turn them off.

### Page Object Model: one page, one class
**POM (Page Object Model)** — Selenium/WebDriver's standard pattern: each screen (or area) is a class; that class **owns the locators + business-level actions of the page**; tests keep only **intent + assertion**.

~~~java
public class LoginPage {
    private final WebDriver driver;
    private final By userInput = By.id("username");          // locator declared ONCE
    private final By passInput = By.id("password");
    private final By loginBtn = By.cssSelector("form button[type=submit]");

    public LoginPage(WebDriver driver) {
        this.driver = driver;
    }

    public LoginPage typeUser(String user) {                  // fluent: returns itself for chaining
        driver.findElement(userInput).clear();
        driver.findElement(userInput).sendKeys(user);
        return this;
    }

    public LoginPage typePassword(String pass) {
        driver.findElement(passInput).clear();
        driver.findElement(passInput).sendKeys(pass);
        return this;
    }

    public DashboardPage clickLogin() {                       // returns THE NEXT PAGE
        driver.findElement(loginBtn).click();
        return new DashboardPage(driver);
    }
}

// test now describes BUSINESS INTENT only:
@Test
void loginSuccess() {
    DashboardPage dash = new LoginPage(driver)
        .typeUser("bean").typePassword("secret123").clickLogin();
    assertTrue(dash.isLoaded());                              // assertion in TEST, not in page
}
~~~

Rename id {{username}}? Fix **one line** in LoginPage, 40 tests unchanged. Tests read like business language ("loginAs... then..."), and on failure the error points straight at the page.

### Four rules that make a good POM
1. **No assertions inside the page object.** A page object **describes the page**, it does not **judge**. Why: page actions are **reused in both success and failure cases** — same {{clickLogin()}}, one real login (expect dashboard) and one wrong-password test (expect to stay on login). Embedding "must see dashboard" into {{clickLogin()}} makes every login-error test fail because the assertion sits **in the wrong place**, with a message saying nothing about the business case.
2. **Navigation methods return the next page's object.** To support error branches too: declare the return type as parent {{Page}} and let the test check {{instanceof}}, or expose {{loginPage.hasError()}}. Avoid making the page object throw exceptions based on outcome.
3. **No one-step wrappers.** Do not write {{clickSubmitButton()}}, {{enterUsername(String)}} per widget — the page object becomes a DOM mirror, and every UI refactor doubles the edit cost. Each page object should match a **business action a real user performs** ({{loginAs(user, pass)}}, {{placeOrder(item)}}), not a single click.
4. **Extract fragments for repeating parts** — header, menu, pagination — into their own classes ({{new CartFragment(driver).goToCheckout()}}), reused across pages.

### PageFactory and @FindBy: deprecated
~~~java
// OLD STYLE (Selenium 2/3) — DO NOT use anymore:
public class LoginPage {
    @FindBy(id = "username") private WebElement userInput;    // proxied, only located on access
    public LoginPage(WebDriver driver) { PageFactory.initElements(driver, this); }
}
~~~

The old mechanism used a **dynamic proxy**: the {{WebElement}} field is not located until touched, "re-find on every use" — nice idea, but it comes with hard-to-trace {{StaleElementReferenceException}} and reflection slowing the page. Selenium 4 **deprecated PageFactory**: the modern correct way is by hand — keep **{{By}}** (the description) and call {{findElement}} at the moment of use (lazy like a Playwright locator).

### Playwright + POM
No PageFactory to inherit; the common pattern is a page class holding {{Page}} + locator fields, assertions using **web-first** right in the test:

~~~java
public class LoginPage {
    private final Page page;
    final Locator userInput, passInput, loginBtn;
    public LoginPage(Page page) {
        this.page = page;
        userInput = page.getByLabel("Username");
        passInput = page.getByLabel("Password");
        loginBtn  = page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Log in"));
    }
    public LoginPage loginAs(String u, String p) {
        userInput.fill(u); passInput.fill(p); loginBtn.click();
        return this;
    }
}
// test: expect(loginPage.loginAs("bean", "secret").errorBox()).toBeVisible();
~~~

### Screenplay: organize by action, not by page
**Screenplay pattern** (popularized by Serenity BDD, Netserf — the evolution of POM) views code from the **user's perspective**: an **Actor** has **Ability** (can use a browser — {{BrowseTheWeb}}), performs a **Task** (LogInAs, AddToCart), and reads results via a **Question** (CartTotal). A task composes many steps across multiple pages; recombination is easy because tasks are small and independent.

~~~text
Actor.named("Bean").can(BrowseTheWeb.with(page))
     .attemptsTo(LogIn.as("bean", "secret"))
     .asks(for(Cart.items()).to(haveSize(3)));
~~~

| Aspect | POM | Screenplay |
|---|---|---|
| Unit of organization | page | business action (Task/Question) |
| Reads like prose | fairly good | very good ("actor attempts to...") |
| Infrastructure complexity | low | high (interfaces, composition) |
| Fits | most suites, new teams | long multi-page flows, deep BDD, large teams |

### Common mistakes
- **God page**: one class containing everything of the site → merge conflicts and nobody dares edit.
- Page object holding a **static {{WebDriver}}** → two threads running in parallel stomp on each other; the driver must be passed via constructor.
- Returning an "uncontrolled transformation": {{clickLogin()}} always returns DashboardPage even on wrong login → test misreads state.
- Hiding {{Thread.sleep}} inside page object methods: default waiting should come from the engine (Playwright) or explicit wait helpers, not sleep per method.

### Interview connection
SDET roles often ask: "Describe your automation framework structure." A 60-second frame: layer 1 driver/manager (lifecycle), layer 2 base page (waits, common errors), layer 3 page objects + fragments, layer 4 test data (JUnit 5 {{@ParameterizedTest}}), plus reporting (Allure) and CI. Mention two decisions: **assertions in tests** and **lazy locators instead of PageFactory** — proof you track Selenium 4. "When is Screenplay better than POM": long flows spanning many pages needing action recombination; small suites are simpler with POM, do not over-engineer.

> Senior tip: the real value of POM is not "grouping locators" — it is **re-describing the page in the team's business language**. When QA, dev, and PO can all read the test without knowing CSS, the test becomes living documentation; that is also when it survives redesigns.`,
    exercises: [
      {
        title: 'Fluent LoginPage and DashboardPage on a fake browser',
        prompt: `{{MiniBrowser}} simulates a login web app: {{open(path)}}, {{typeUser}}, {{typePass}}, {{submit}} (validates users {{bean/secret123}}, {{qa/qa12345}}; user {{ghost}} is locked; on success url = {{/dashboard}} and old errors cleared), plus getters {{currentUrl}}, {{error}}, {{welcome}}.

Write page objects following the POM standard:

- {{LoginPage(MiniBrowser)}}:
  - {{LoginPage type(String user)}} — fill user, **return itself** (fluent).
  - {{LoginPage password(String pass)}} — fill pass, return itself.
  - {{Page clickLogin()}} — call {{browser.submit()}}; if {{currentUrl()}} is {{/dashboard}} return {{new DashboardPage(browser)}}, else return {{new LoginPage(browser)}} (rule: the next page is the one the browser actually is on).
  - {{String error()}} — read the error message from the browser.
- {{DashboardPage(MiniBrowser)}}:
  - {{String welcome()}} — read {{browser.welcome()}}, must match {{Hello <user>}}.
  - {{LoginPage logout()}} — call {{browser.open("/login")}} then return {{new LoginPage(browser)}}.

Design constraints (likely interview questions): the page object **does not assert and does not throw exceptions based on business outcome** — it only mirrors browser state; assertions belong to tests. {{Page}} (abstract, holds browser) is given.`,
              hints: [
          '{{type}}/{{password}}: call {{browser.typeUser}}, {{browser.typePass}} then {{return this;}} — fluent style allows chaining {{.type(..).password(..)}}.',
          '{{clickLogin}} decides the return type from the **browser real page** after submit: {{browser.currentUrl().equals("/dashboard") ? new DashboardPage(browser) : new LoginPage(browser)}}.',
          '{{logout}}: {{browser.open("/login"); return new LoginPage(browser);}}. Page object does not compare or throw business errors — tests handle that.',
        ],
        explain: `The whole exercise crystallizes three POM rules: (1) **business outcome decides the return type**, the page object never "hopes" for the dashboard; (2) page object **does not assert** — the test for wrong password still lands on {{LoginPage}}, needing no exception; (3) **fluent returns itself** for fill steps, **returns the next page** for navigation steps.

Using {{==}} in the "fluent" check verifies exactly that type/password do not create new objects — in a real framework this guarantees every {{driver.findElement}} uses the locator of the **same** browser instance, not a fake page. {{MiniBrowser}} (given) plays "DOM + server": the part you write will be reviewed like real code, so knowing how to separate the mock from your own code is a valuable SDET skill.`,
      },
    ],
    check: [
      {
        q: 'In POM, where should assertions (assertEquals, expect...) be placed?',
        options: [
          'In the page object, since it knows its page best',
          'In the test: page object only exposes state and actions',
          'In the base page class, running automatically after each action',
          'No assertion needed; test passing is enough',
        ],
        answer: 1,
        explain: 'Page object describes the page, it does not judge. Assert in the test and the same action works for both success and failure cases, and a failure names the business intent.',
      },
      {
        q: '{{clickLogin()}} leading to the dashboard should return what to support the wrong-login case?',
        options: [
          'void',
          'String url',
          'Parent type Page (or the next page) so the test checks instanceof/state',
          'Must throw an exception if it cannot reach the dashboard',
        ],
        answer: 2,
        explain: 'The real outcome (browser url) decides the returned object: DashboardPage on success, LoginPage on error. The test decides expectations; forcing exceptions in the page object kills all negative tests.',
      },
      {
        q: 'Current status of PageFactory / @FindBy in Selenium 4?',
        options: ['Recommended approach', 'Deprecated — modern is keeping By and lazy findElement in the page object', 'Chrome-only', 'Playwright-specific API'],
        answer: 1,
        explain: 'PageFactory uses dynamic proxy + reflection and hides StaleElementReferenceException that is hard to debug; Selenium 4 marks it deprecated. Keeping By descriptions and calling findElement at the right moment gives the same effect, more readable.',
      },
      {
        q: 'Main difference between Screenplay and POM?',
        options: [
          'Screenplay needs no browser',
          'Screenplay organizes code around a user\'s business actions (Task/Question), POM around pages',
          'Screenplay only runs with TestNG',
          'POM does not support assertions',
        ],
        answer: 1,
        explain: 'Same page, same driver; the difference is the organizing axis: Screenplay composes Tasks around what the user does, so recombination is easy for long multi-page flows — at the cost of more infrastructure.',
      },
    ],
  },
});
