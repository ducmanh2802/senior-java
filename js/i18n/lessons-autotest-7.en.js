/*
 * English translation of js/data/lessons-autotest.js — task T765. Format: js/core/i18n.js (content overlay).
 * ids: lesson-autotest-009
 */
App.i18n.content({
  'lesson-autotest-009': {
    title: 'Designing an automation framework: layers, per-environment config, the Browser/Context/Page lifecycle and JUnit 5 fixtures',
    goals: [
      'Draw the 5 layers of a UI/API test framework and say what lives in which layer',
      'Explain the Playwright → Browser → BrowserContext → Page model and pick the right lifetime scope for each one',
      'Why Playwright objects are not thread-safe and how to allocate a driver per thread with ThreadLocal',
      'Write a JUnit 5 Extension that hands out a Browser/Page to the test and cleans up when the test ends',
      'Split configuration per environment without stuffing secrets into git',
    ],
    body: `**Summary:** A framework is the skeleton that lets hundreds of tests re-run in every environment without you editing the same code over and over: it separates **the things that change often** from **the places where they are different** — how the browser is driven (the driver), how each screen is operated (the page object), how APIs are called, test data, and the test scenarios themselves. In Playwright for Java the backbone is the object chain **Playwright → Browser → BrowserContext → Page** plus one rule of survival: **a Browser can be launched once and reused by the whole class, a Page must never be shared between threads**, because Playwright objects are **not thread-safe**. The cleanest way to allocate them is ThreadLocal (one set per thread) or a JUnit 5 Extension (allocate per test-lifecycle scope).

### What a framework is, and how it differs from "a pile of scripts"
A **script** is one .java file that clicks through a flow: open the browser, log in, place an order, check, close the browser. Five scripts are fine; 300 scripts give you 300 hard-coded login URLs, 300 different ways of waiting, and when the frontend team renames one button you have to edit 120 files.

A **framework** is the layer of code that is **not a test** but that tests call into. It answers 6 questions: (1) where do browser objects come from, who opens them and who closes them? (2) where do screen operations live? (3) how are APIs called and where does the token come from? (4) how is test data generated so that two tests do not step on each other? (5) where are the dev/staging/prod settings read from? (6) when a test fails, what evidence is left behind and where does the report go?

~~~text
src/test/java/com/shop/qa/
  core/        PlaywrightHolder, Config, WaitHelper, ReportHook   <- infrastructure, rarely changes
  pages/       LoginPage, CartPage, CheckoutPage (Page Object)    <- changes with the UI
  api/         AuthClient, OrderClient, SqlFixture                <- changes with the API
  data/        UserBuilder, OrderBuilder, users.csv               <- changes with the test case
  tests/       LoginTest, CheckoutSmokeTest, OrderFlowTest        <- what QA writes every day
src/test/resources/env/dev.properties, staging.properties
~~~

Naming and dependency rule: **tests depend on pages/api, pages never depend on tests, core depends on nothing at all**. A page object that contains {{assertTrue(...)}} is the classic design error (covered in the Page Object lesson): a page describes *what you can do*, a test describes *what you expect*.

### The three object layers of Playwright for Java
Playwright (the Java library) drives the browser through an internal driver process. Four concepts, compared with things you use every day:

| Object | What it is | Everyday analogy | Cost to create |
|---|---|---|---|
| {{Playwright}} | the session with the driver, it owns the background process | plug in the power cable and turn the computer on | ~0.3–1 s |
| {{Browser}} | one running browser (chromium/firefox/webkit) | opening the browser | ~0.2–0.8 s |
| {{BrowserContext}} | one isolated "profile": cookies, localStorage, cache, permissions | switching to incognito mode — a different machine, a different account | **~10 ms**, very cheap |
| {{Page}} | one tab inside a context | opening a tab | ~5 ms |

~~~java
// The Playwright class implements AutoCloseable: try-with-resources guarantees the background process is cleaned up
try (Playwright playwright = Playwright.create()) {
    Browser browser = playwright.chromium()
            .launch(new BrowserType.LaunchOptions().setHeadless(true));

    // Context = a separate profile: cookie/localStorage fully isolated from other contexts
    BrowserContext context = browser.newContext(
            new Browser.NewContextOptions().setViewportSize(1280, 720));

    Page page = context.newPage();
    page.navigate("https://shop.test/login");
    page.getByLabel("Email").fill("qa@shop.test");
    page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Log in")).click();

    context.close();
    browser.close();
}
~~~

Context is the most important invention for making tests fast: in Selenium, to get a "clean logged-in session" you have to restart the driver (several seconds); in Playwright you only need {{browser.newContext()}} (a few milliseconds) and every cookie/localStorage is brand new. A 500-test suite that creates one driver per test spends ~10 minutes just opening browsers; one context per test spends ~5 seconds.

### How long should each one live
- **Playwright + Browser**: whole-run scope (or whole-class scope). Launch once, close at the end.
- **BrowserContext + Page**: scope of **each test**. Create in {{@BeforeEach}}, close in {{@AfterEach}}. That way test A logging in as an admin never sees test B's cookies — this is **test independence**, the precondition for running in parallel (lesson 010).

A reasonable exception: a "30-second login" flow can reuse its session through {{storageState}} — save the logged-in state to a file, then load it when creating the context ({{newContextOptions().setStorageStatePath(...)}}). It is both fast and still isolated, because each test gets a **copy** of the state instead of sharing one live session.

### Not thread-safe: the tripwire for Java developers
**Thread-safe** means an object is safe when several threads call it at the same time. Playwright objects are **not** like that: {{Page}}, {{BrowserContext}} and {{Locator}} may only be touched from **exactly the thread that created them**, and two threads must never operate on the same page. The reason: every UI operation (click, fill) is a command sent over a pipe to the driver process, then the call waits for the reply; the browser has no idea which thread a command came from, so two threads write over each other's page state. Symptoms when you break the rule: tests fail at the wrong line, "Target page, context or browser has been closed", results that flip between fast and slow with no predictable pattern — the most unpleasant class of bug to diagnose.

That is why JUnit 5 parallel or TestNG parallel needs **one Playwright/Browser set per thread**. The standard shape:

~~~java
public final class PlaywrightHolder {
    // ThreadLocal = "one private memory slot per thread": nobody steps on anybody else's value
    private static final ThreadLocal<Playwright> PW = new ThreadLocal<>();
    private static final ThreadLocal<Browser> BROWSER = new ThreadLocal<>();

    private PlaywrightHolder() {}

    public static Browser browser() {
        Browser b = BROWSER.get();
        if (b == null) {                       // this thread does not have a browser yet
            PW.set(Playwright.create());
            b = PW.get().chromium()
                    .launch(new BrowserType.LaunchOptions().setHeadless(true));
            BROWSER.set(b);
        }
        return b;
    }

    public static void quit() {
        Browser b = BROWSER.get();
        if (b != null) { b.close(); BROWSER.remove(); }
        Playwright p = PW.get();
        if (p != null) { p.close(); PW.remove(); }   // REMOVE: CI threads get reused!
    }
}
~~~

The {{PW.remove()}} line looks redundant but it is a real bug: the JUnit/Gradle runner **reuses its thread pool** for later tests. If you only close without removing, the next {{browser()}} call pulls out an already-closed Browser and blows up with "has been closed"; if you never close, each thread leaves a live browser behind → 16 threads × 8 workers = the machine runs out of RAM.

### JUnit 5 Extension: allocation like a fixture
An JUnit 5 **Extension** is a hook that runs around the test lifecycle ({{BeforeAllCallback}}, {{BeforeEachCallback}}, {{AfterEachCallback}}, {{ParameterResolver}}) — you write it once and every test uses it via {{@ExtendWith(...)}}. This is the right place to put resource open/close and screenshot-on-failure, because whoever writes the tests **will forget** if you make them write it by hand:

~~~java
public class PlaywrightExtension implements BeforeEachCallback, AfterEachCallback, ParameterResolver {
    @Override public void beforeEach(ExtensionContext ctx) {
        BrowserContext bc = PlaywrightHolder.browser()
                .newContext(new Browser.NewContextOptions().setViewportSize(1440, 900));
        ctx.getStore(ExtensionContext.Namespace.GLOBAL).put(BrowserContext.class, bc);
        ctx.getStore(ExtensionContext.Namespace.GLOBAL).put(Page.class, bc.newPage());
    }

    @Override public void afterEach(ExtensionContext ctx) {
        var store = ctx.getStore(ExtensionContext.Namespace.GLOBAL);
        BrowserContext bc = store.remove(BrowserContext.class);
        if (bc != null) bc.close();          // closing the context = clearing tab, cookies, sockets
    }

    @Override public boolean supportsParameter(ParameterContext pc, ExtensionContext ec) {
        return pc.getParameter().getType() == Page.class;
    }

    @Override public Object resolveParameter(ParameterContext pc, ExtensionContext ec) {
        return ec.getStore(ExtensionContext.Namespace.GLOBAL).get(Page.class);
    }
}

// The test only declares a parameter, it does not care who opens or who closes anything
@ExtendWith(PlaywrightExtension.class)
class CheckoutSmokeTest {
    @Test void cart_shows_two_items(Page page) {
        page.navigate(Config.load("staging").baseUrl() + "/cart");
        assertThat(page.locator("#cart-count")).hasText("2");
    }
}
~~~

Playwright also ships a ready-made JUnit 5 extension ({{@UsePlaywright}} in the {{com.microsoft.playwright.junit}} package of the playwright artifact) — good to know it exists, but you **still have to write your own** when you need extra behaviour such as turning tracing on, attaching Allure, or picking a profile per test. In that case your custom extension is about 60 lines.

### Configuration per environment
One suite must run on dev, staging and prod-sandbox **without changing a single line of code**. That means: URLs, account names, timeout length, retry count, and the "is there real payment or not" flag are all configuration data.

~~~java
public record Config(String env, String baseUrl, String apiBase, int timeoutMs, String user, String pass) {
    public static Config load(String env) {
        Properties p = new Properties();
        try (java.io.InputStream in = Config.class.getResourceAsStream("/env/" + env + ".properties")) {
            if (in == null) throw new IllegalStateException("cannot find env/" + env + ".properties");
            p.load(in);
        } catch (java.io.IOException e) {
            throw new UncheckedIOException("cannot read environment config " + env, e);
        }
        // Secrets are NOT in the properties file and NOT in git: they come from CI
        return new Config(env, p.getProperty("baseUrl"), p.getProperty("apiBase"),
                Integer.parseInt(p.getProperty("timeoutMs", "5000")),
                System.getenv("QA_USER"), System.getenv("QA_PASS"));
    }
}
~~~

Three things worth doing from day one: (1) defaults for everything that is not a secret ({{timeoutMs}}), so adding a new environment only means copying a file; (2) secrets through environment variables or the CI secret store; (3) **fail early**: a missing config file must throw at startup, do not let 200 tests fail with {{NullPointerException}} while the whole team guesses.

### Resource lifecycle within one run

~~~seq
title: Allocating resources for UI tests running in parallel
actors: JUnit | Holder | Browser | Context | Page
JUnit -> Holder: beforeEach needs a page
Holder -> Browser: Playwright.create and chromium.launch
JUnit -> Browser: newContext dedicated to this test
Browser -> Context: clean cookie and localStorage
Context -> Page: newPage
Page --> JUnit: returned for the test to use
JUnit -> Context: afterEach closes page and context
JUnit -> Holder: at class end call quit and remove
note JUnit..Holder: each thread has its own Playwright and Browser
~~~

### Failures you actually see in production
- **Sharing one Page between tests that run in parallel** (to "save resources"): wrong results you cannot reproduce. Real savings belong at the context/driver layer, not at the shared-state layer.
- **A mutable singleton in a util class**: one {{static Browser browser}} plus {{static String currentToken}} is a recipe for a race. Contextual variables must come with an explicit lifetime scope.
- **Forgetting to close Playwright**: the node driver process stays alive, the CI runner hangs or runs out of RAM, and the next job dies with a confusing error.
- **Hard-coding URLs/locators for one environment**: {{page.navigate("https://staging.shop.test")}} inside a test means the prod suite runs… on staging.
- **Putting a secret in a config file and committing it**: reports and git are public spaces inside the company.
- **Over-decorating the framework**: 4 layers of abstraction for 20 tests, so a new QA is afraid to change anything. A good framework is one where other people read your tests and can guess the broken spot in 2 minutes.

### Interview connections
- "How would you design a framework from scratch?" → list the 5 layers, state the lifetime scope of driver/context/page, describe per-environment configuration, then close with "start from 5 API smoke tests in CI and grow from there".
- "Why ThreadLocal?" → because Playwright (and WebDriver) is not thread-safe; JUnit/TestNG parallel uses many threads and each thread needs its own controller. Add: {{ThreadLocal.remove()}}, because the runner reuses threads.
- "Browser or Context per test?" → Browser shared (expensive to launch), Context per test (cheap, isolating). Add that mentioning {{storageState}} to reuse a login session scores points.
- "What does one of your test classes look like?" → describe the extension/fixture, {{@BeforeEach}} creating the context, {{@AfterEach}} closing it and taking a screenshot on failure.

> Senior tip: the place where a framework saves the most money is not clever code but a **written-down resource lifecycle policy** that is itself checked by tests: 1 Playwright + 1 Browser per thread, 1 Context per test, closed in {{afterEach}}. On an 800-test UI suite across 16 workers, this shape cut the run from ~90 minutes to ~12 minutes while keeping the data isolated. And one defensive rule worth its price: never let a page object create/close a browser — whoever creates it closes it, otherwise you will get "ghost browser nights" in CI.`,
    exercises: [
      {
        title: 'BrowserPool: one dedicated driver per thread, quit done properly',
        prompt: `Write {{BrowserPool}} that reproduces the driver-allocation policy of the framework described above (one "browser" per thread, no thread ever shares one), with {{FakeDriver}} as a fake driver. **Do not open a real browser.** Use only the JDK, Java 17, and run deterministically: no sleep, no random.

**1) Class {{FakeDriver}}** — one instance is one running "browser":
- constructor {{FakeDriver(long id, long ownerThread)}}: {{id}} is the sequence number handed out by the pool, starting at **1**; {{ownerThread}} is the id of the thread that owns it.
- {{id()}}, {{ownerThread()}}, {{closed()}}: the getters, of type {{long}}, {{long}}, {{boolean}}.
- {{close()}}: marks the driver as closed; calling it twice is harmless.

**2) Class {{BrowserPool}}** — the per-thread allocator:
- {{BrowserPool()}}: a fresh pool, no driver yet, the id counter starts at 1.
- {{FakeDriver acquire()}}: returns the driver of **the calling thread**. If that thread has no driver yet, create one ({{id}} increases **across the whole pool**, {{ownerThread = Thread.currentThread().getId()}}) and attach it to this thread — this is essentially a {{ThreadLocal}}. If the thread already has a driver, return **exactly the same object**, do not create another.
- {{FakeDriver current()}}: the calling thread's driver, or {{null}} if that thread has never acquired one.
- {{void quit()}}: closes the calling thread's driver (call {{close()}} on it), **removes** it from the per-thread state, and increments the closed-driver counter. If the calling thread never acquired anything, stay silent and **do not throw**. After quit, {{acquire()}} on the same thread must return a driver **with a different id**.
- {{int created()}}: total number of drivers created so far, across all threads.
- {{int closedCount()}}: total number of drivers closed through {{quit()}}.
- {{int live()}}: {{created() - closedCount()}}.

Two traps the tests will catch: (a) if the pool keeps **one** driver shared by every thread, then two threads operate on one page — exactly the thing Playwright forbids; (b) if the pool creates a driver **on every acquire**, then 500 tests open 500 browsers and RAM explodes. The valuable part is "one driver per thread, and hand it back when work is done".

~~~text
thread main    : acquire -> FakeDriver#1, acquire -> FakeDriver#1 (same object)
thread worker-3: acquire -> FakeDriver#2   (it never gets #1)
quit on worker-3: #2 closed, live() = 1
~~~`,
        hints: [
          'The core is a single {{ThreadLocal<FakeDriver>}} field: each thread sees its own memory slot, so the "get or create this thread\'s driver" part needs no lock (no synchronized).',
          'The id counter and the created/closed counters must be {{AtomicLong}} and {{AtomicInteger}} **of the instance** (final fields inside BrowserPool), because every thread writes into them. Do not use a plain int: {{x++}} updated from 8 threads will report a smaller number than reality.',
          'quit(): read the driver with {{mine.get()}}; if it is null, return immediately (do not throw); otherwise {{mine.remove()}} first, then {{d.close()}}, then increment the counter. The remove is the crux — the runner reuses threads, so a closed driver left inside the ThreadLocal makes the next acquire hand out a broken driver.',
          'live() is only the subtraction of the two counters; do not maintain a separate third variable that can drift out of sync.',
          'The 8-thread × 50-call test: build an {{ExecutorService}} with 8 fixed threads, submit 8 tasks, each task calls {{acquire()}} 50 times and puts the ids into a {{Set}} to prove that **one task sees exactly one driver**, then {{shutdown()}} plus {{awaitTermination(60, TimeUnit.SECONDS)}}. Do not use {{Thread.sleep}} to "wait to be sure".',
        ],
        explain: `**Why ThreadLocal instead of a Map keyed by thread id?** A {{ConcurrentHashMap<Long, FakeDriver>}} keyed by {{thread.getId()}} would also work, but it keeps drivers **after the thread dies** (a CI thread pool lives all day long) and you have to clean it up yourself. {{ThreadLocal}} lets each thread carry its own resource: reads and writes need no lock, and {{remove()}} is an explicit "give the resource back". This is precisely the shape the Selenium/Playwright DriverFactory uses when running in parallel.

Three steps inside {{acquire}}, in order: create the driver with {{seq.incrementAndGet()}} (the id is **pool-wide**, not per-thread — that is what makes two drivers never share a number and what gives the "ids increase in order" test any meaning), {{mine.set(d)}}, so the next call gets exactly the same object back, and {{created.incrementAndGet()}} for reporting. Missing one of the three breaks one test: forget {{set}} and every acquire opens a new browser; forget the counter and {{live()}} is wrong.

In {{quit}}, the order remove-then-close is not accidental. If you close first and remove afterwards, another operation on **the same thread** in between (say a different {{@AfterEach}} that runs earlier) still sees the closed driver through {{current()}} and calls into it. Removing first makes "{{current()}} returns null" genuinely mean "this thread really has no driver right now".

{{AtomicInteger}} sounds like a detail but it is where QA teams catch long-lived bugs: the test "8 threads x 50 calls" demands {{created() == 8}}. With a plain {{int}}, {{created++}} is three steps (read, add, write), so two threads read the same old value and both write 2 → the final number is too small; with {{AtomicInteger.incrementAndGet()}} it is always right. If you ever see {{created()}} return 6 or 7 while 8 drivers exist, this is why.

The last test ({{created() <= 2}}) teaches something important for reading CI results: **task != thread**. A pool of 2 threads runs 4 tasks; the first two tasks run on two different threads and create two drivers, the last two tasks run **on those same two threads**, so the ThreadLocal still holds the old driver → {{created()}} stays 2, not 4. That is exactly why you must call {{quit()}} + {{remove()}} at the end of every test: resources and login state "stuck" to a thread are the source of flakiness that many teams blame on... the browser.`,
      },
    ],
    check: [
      {
        q: 'In Playwright for Java, which lifetime scope is the most sensible for Browser and for BrowserContext when the suite runs in parallel?',
        options: [
          'Browser per test, Context per test — maximum isolation is the safest',
          'Browser shared by one thread/the whole run, a fresh BrowserContext for each test',
          'Browser and Context both a single static singleton for the whole suite',
          'Context shared, a fresh Browser for each test',
        ],
        answer: 1,
        explain: 'Launching a Browser is expensive (a few hundred ms up to a second) while creating a Context costs only ~10 ms, so sharing the Browser and making a new Context per test is both fast and isolates cookie/localStorage. Option 3 is the trap: a singleton shares the login state between tests and additionally gets written concurrently from several threads.',
      },
      {
        q: 'Why should Playwright/Page objects not be used from several threads at the same time?',
        options: [
          'Because the JVM forbids accessing an object from another thread',
          'Because each operation is a command sent to the driver process and awaited; two threads writing to the same page overlap the UI state and the results become unpredictable',
          'Because Playwright only works in headless mode when there are many threads',
          'Because JUnit 5 does not support running in parallel',
        ],
        answer: 1,
        explain: 'The JVM does not forbid multi-thread access to an object, but the object must be **designed** for it. Playwright chose a "one page, one thread" model (an actor-like model), so its API is not thread-safe. Symptoms when you violate it: "browser has been closed", assertions failing at the wrong place, flakiness you cannot reproduce.',
      },
      {
        q: 'In BrowserPool, which step is **mandatory** for a ThreadLocal<FakeDriver> so it does not leak on CI?',
        options: [
          'Call ThreadLocal.get() frequently',
          'Call ThreadLocal.remove() inside quit() or at the end of the test, because the runner reuses threads from the pool',
          'Mark the field volatile',
          'Close the browser in @BeforeAll',
        ],
        answer: 1,
        explain: 'The Gradle/JUnit/TestNG thread pool can keep one thread running thousands of tests. Without remove, either a closed driver stays in the ThreadLocal (the next acquire hands it out and errors), or each thread piles up resources it never closed. volatile is irrelevant here: it only guarantees that a new value is visible across threads, while ThreadLocal already isolates per thread.',
      },
      {
        q: 'A JUnit 5 Extension is the right place for resource open/close because:',
        options: [
          'It runs faster than a @BeforeEach written inside the test class',
          'It applies to every test once you add @ExtendWith, it does not depend on the memory of whoever writes the test, and it keeps the test focused on business behaviour',
          'It automatically retries a test when it fails',
          'It allows sharing a Page between tests to save RAM',
        ],
        answer: 1,
        explain: 'The value of a fixture/extension is that it is **mandatory**: code inside the framework always runs, whereas code that every QA must remember to write in each test will eventually be forgotten by someone — and forgetting to clean up resources or forgetting the failure screenshot are the two most expensive classes of bug.',
      },
    ],
  },
});
