/*
 * English translation of js/data/lessons-autotest.js — task T761. Format: js/core/i18n.js (content overlay).
 * ids: lesson-autotest-005
 */
App.i18n.content({
  'lesson-autotest-005': {
    title: 'Test runner: JUnit 5 vs TestNG lifecycle, data-driven tests, tags and retry',
    goals: [
      'State the exact order of steps in a test class lifecycle and explain why JUnit 5 creates a new instance per test method',
      'Convert a hardcoded test into a data-driven one with @CsvSource, @MethodSource and TestNG @DataProvider',
      'Use tags/groups to pick the smoke or regression suite straight from the CI command line',
      'Explain why retry hides flaky tests and why dependsOnMethods should be avoided',
    ],
    body: `### What the test runner does for you
A test method only describes **what to check**. Everything else is handled by the **test runner** (the JUnit 5 or TestNG engine): **finding** test methods by annotation, **creating** the object that holds them, **running** setup/teardown steps in the correct order, **catching exceptions** and classifying pass/fail/skip, **printing a report** that CI can read. Understanding its lifecycle is understanding why some tests pass alone but break when the whole suite runs — the root cause is almost always ordering and shared state.

### Lifecycle of a test class in JUnit 5
~~~text
@BeforeAll      (once per class, before any test)
  |
  |  @BeforeEach (before EACH test)
  |  @Test      (test body)
  |  @AfterEach (after EACH test, even when the test fails)
  |
@AfterAll       (once per class, after all tests)
~~~

~~~java
import com.microsoft.playwright.*;
import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

class SearchSmokeTest {
    static Playwright playwright;              // shared state: one Playwright process per class
    static Browser browser;

    BrowserContext context;                    // per-test state: one context per test
    Page page;

    @BeforeAll static void startBrowser() {    // static by default: JUnit 5 requires this (see below)
        playwright = Playwright.create();
        browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
    }

    @BeforeEach void openPage() {              // runs before each @Test
        context = browser.newContext();        // new context = own cookies/localStorage/storageState
        page = context.newPage();
    }

    @AfterEach void closePage() { context.close(); }

    @AfterAll static void stopBrowser() { browser.close(); playwright.close(); }

    @Test void searchFindsJavaBook() {
        page.navigate("https://shop.example/search?q=java");
        assertThat(page.getByTestId("result-count")).containsText("results");
    }
}
~~~

Three details decide the quality of the suite:
- **@BeforeAll must be static by default**, because JUnit 5 creates **a new test object for each @Test** ({{PER_METHOD}} mode). If a test method needs to run inside @BeforeAll (launching Playwright for all @ParameterizedTest), annotate the class with {{@TestInstance(TestInstance.Lifecycle.PER_CLASS)}} — then @BeforeAll no longer needs to be static.
- **@AfterEach runs even when the test fails.** This is where you close the context / take a screenshot; never skip it.
- **Do not put test data in @BeforeAll** when the suite runs in parallel: shared state between tests is the root cause of "passes alone, fails in the suite".

JUnit 5 also has a **per-test** style (@BeforeAll/@AfterAll via {{Lifecycle.PER_TEST}} + {{@RegisterExtension}}) — the Playwright Java binding ships the {{@UsePlaywright}} extension that creates and closes page/context around each test; if your version lacks that module, write the fixture yourself as in the code above, same pattern.

### JUnit 5 or TestNG
| Aspect | JUnit 5 | TestNG |
|---|---|---|
| Status | De facto standard, largest ecosystem | Common in legacy Selenium suites, still widely used by companies |
| Lifecycle | @BeforeAll/@BeforeEach/@BeforeSuite | @BeforeSuite/@BeforeClass/@BeforeMethod (+ alwaysRun) |
| Data-driven | @ParameterizedTest + @CsvSource/@MethodSource | @DataProvider |
| Skip/select | @Disabled, @Tag, tag expression | @Test(enabled=false), groups/excludedGroups |
| Parallel | @Execution(CONCURRENT) + junit-platform.properties, rougher config | Parallel on methods/classes/dataprovider is easy to enable |
| Retry | Not built in (write your own extension) | IRetryAnalyzer built in |
| Extension model | @ExtendWith, parameter resolver | Listener/invocation — powerful but hard to debug |

Answering an interview like "which does your team use": say **JUnit 5 for unit + API tests** because devs are familiar and Maven/Gradle/CI integration is good, and **TestNG only when inheriting an old suite or needing complex grouping/parallelism**. Do not say "TestNG is more modern" — that belonged to the JUnit 4 era.

### Data-driven: one logic, many data sets
Instead of writing 6 identical tests, write **one** test and run it over a table of data.

~~~java
@ParameterizedTest(name = "{0} + {1} = {2}")        // test case name shown in the report
@CsvSource({
    "1, 2, 3",
    "10, 20, 30",
    "-5, 5, 0"
})
void adds(int a, int b, int expected) {
    assertEquals(expected, calculator.sum(a, b));
}

@ParameterizedTest
@MethodSource("loginCases")                          // source: complex data (objects, paths)
void loginFlow(LoginCase c) {
    LoginPage login = new LoginPage(page).open().as(c.user, c.pass);
    if (c.expectError) assertThat(login.errorBox()).isVisible();
    else assertThat(page.getByTestId("welcome-user")).containsText(c.user);
}

static Stream<LoginCase> loginCases() {                // method name must match @MethodSource("loginCases")
    return Stream.of(
        new LoginCase("bean", "secret123", false),
        new LoginCase("ghost", "secret123", true));    // LoginCase is a record or POJO owned by the team
}
~~~

{{@CsvSource}} is convenient for scalar data (strings, numbers) but has a trap: comma is the delimiter, so a value containing a comma must be wrapped in single quotes, and an empty value is interpreted as null. Structured data → use {{@MethodSource}}. TestNG equivalent:

~~~java
@DataProvider(name = "browsers")
public static Object[][] browsers() {
    return new Object[][] { { "chromium" }, { "firefox" }, { "webkit" } };
}

@Test(dataProvider = "browsers")
void openHomepage(String browserName) {
    Browser b = Playwright.create().chromium().launch();   // in real code, pick the browser per browserName
    Page p = b.newContext().newPage();
    p.navigate("https://shop.example");
    assertThat(p.getByRole(AriaRole.HEADING)).isVisible();
}
~~~

Running one UI test on 3 engines is the typical example of data-driven **saving money**: same code, 3 pieces of evidence.

### Tags/groups: pick the suite from the command line
~~~java
@Test @Tag("smoke") void loginWorks() { ... }
@Test @Tag("regression") void paginationOnSearchPage() { ... }
~~~

CI selects via {{mvn -Dgroups=smoke test}} (Surefire) or {{-DexcludedGroups=slow}}; TestNG uses {{groups}}/{{excludedGroups}} in testng.xml or {{-Dgroups=}}. One case can carry multiple tags. This is how "smoke in 5 minutes, regression overnight" is realized without two separate repos.

### Retry and @RepeatedTest: two things often confused
{{@RepeatedTest(5)}} re-runs the test **5 times to find intermittent bugs** (it does not turn a failure into a pass). **Retry** is the opposite: fail on run 1, run again automatically, pass on run 2 means the suite is green. TestNG has {{IRetryAnalyzer}}; JUnit 5 needs a custom extension. Retry is a double-edged knife: it makes CI less red but **hides flaky tests** — and a flaky test nobody trusts is worse than a red one. The recommended practice: at most 1 retry, **log the retry count of each case** into the report (Allure has metadata for this), and set a ceiling like "how many cases needed retry last week" — if it exceeds 2% of total cases, stop writing new tests and fix flaky ones first.

### Why dependsOnMethods should be avoided
TestNG allows {{@Test(dependsOnMethods = "login")}}. It works, but creates three problems: (1) the child test is **silently skipped** when the parent fails, losing report information; (2) **no parallel execution**, because ordering becomes a dependency; (3) it encourages **chained state** — login stores the user in a static field, then "checkout" reads it, so one small change in login makes 10 tests fail hard to trace. Replacement: each test **prepares its own precondition** (call an API to create data, or use a pre-logged-in {{storageState}} — faster than UI login), or move shared setup into {{@BeforeEach}}.

### Three common mistakes
- Putting **driver/context in a static field** to "avoid recreating" → two threads trample each other when parallel is on; always pass the driver via the constructor as in the POM lesson.
- Forgetting to **close Playwright/Browser** in @AfterAll → CI leaks processes, later builds fail due to out of memory.
- @BeforeEach that only **logs in** (runs the command) "to check it enters" without asserting → empty green test.

### Interview relevance
Common questions: "How do JUnit 5 and TestNG differ", "Write a test that runs on 3 browsers without copying code", "Do your tests depend on each other", "How does your team handle flaky tests". Answer frame: state the mechanism (annotation → lifecycle → data provider → tag), give one concrete example of yours (case count, suite time), end with a reasoned decision ("I disable dependsOnMethods because of parallel, replace with storage state"). SDET interviewers value answers with **trade-offs** more than answers that list APIs.

> Senior tip: suite time is almost always eaten by **setup**, not by asserts. Measure how long a @BeforeEach that opens a page takes versus a context prepared in advance via API + storage state: the difference is often 5–20x, and that is why JUnit 5/TestNG have {{@BeforeAll}}/{{@BeforeSuite}} — put the expensive part at suite level, the cheap part (a clean context) at test level.`,
    exercises: [
      {
        title: 'Mini runner: read a CSV table and report PASS/FAIL by parameterized test case name',
        prompt: `A real test runner does exactly three things: **read a data table**, **run the test function for each row**, **name the test case from the data** ({{@ParameterizedTest(name = ...)}}). You will write the minimal version of that.

Write a {{TestTable}} class with 4 static methods:

**1.** {{List<Map<String, String>> rows(String csv)}} — the first line is the header, the rest are data; each line returns a {{LinkedHashMap}} preserving column order.
- Fields are separated by commas, and **values are trimmed of surrounding whitespace**.
- A field wrapped in double quotes may contain commas; two consecutive double quotes inside a quoted field are **one** real double quote.
- Empty lines (or whitespace-only) are skipped, including the trailing line after the final newline.
- {{csv}} with no lines → throws {{IllegalArgumentException}}.
- A line whose field count differs from the header's → throws {{IllegalArgumentException}}, message stating that line's column count and the header's.

**2.** {{String render(String template, Map<String, String> row)}} — template contains tokens of the form {column-name} (single braces); each token is replaced by that column's value in the current row.
- A column name not in the header → throws {{IllegalArgumentException}} with a message starting with {{Cot khong ton tai: }} followed by the column name.
- A template with an opening brace but no closing brace → throws {{IllegalArgumentException}}.

**3.** {{List<String> run(String csv, String nameTemplate, Function<Map<String, String>, Boolean> check)}} — for each row: build the case name with {{render}}, then call {{check}}.
- {{check}} returns {{true}} → report line {{PASS name}}; returns {{false}} → {{FAIL name}}.
- {{check}} throws {{RuntimeException}} → {{FAIL name: message}}; if message is null, use the simple class name ({{getClass().getSimpleName()}}).
- Returns the report lines **in the same order as the data rows**.

**4.** {{String summary(List<String> report)}} — count lines starting with {{PASS }} and {{FAIL }}, return a string like {{passed=1 failed=2}}. Empty list → {{passed=0 failed=0}}.

Constraint: JDK only, static methods, no file reads, no real time or randomness.`,
        hints: [
          'Splitting fields: walk characters with a quoted flag. Two consecutive double quotes while quoted add one quote char to the result and skip the next char. Outside quotes, a comma is the delimiter.',
          'Splitting lines: {{String.valueOf(csv).split("\\r?\\n", -1)}} then skip lines whose {{trim()}} is empty; {{-1}} keeps the trailing line so empty trailing content is not silently dropped.',
          'Preserve column order: use {{LinkedHashMap}} (not HashMap). Check a column exists via {{containsKey}}, not via {{get}} returning null.',
          'In run: {{Boolean.TRUE.equals(check.apply(row))}} is safer than a bare {{check.apply(row)}} because Function may return null.',
        ],
        explain: `Three points that make this close to a real runner:

1. **Test case names generated from data.** {{render}} mirrors the {{name}} parameter of {{@ParameterizedTest}}: JUnit substitutes parameter tokens with real values. The report says {{FAIL qa -> ok}} rather than {{FAIL loginFlow}}, so the CI reader knows exactly which data row is wrong without opening code.
2. **{{LinkedHashMap}} everywhere.** HashMap leaks column position, and when a table has two columns with the same name the runner must fail early ({{put}} overwriting is behaviour you should know to avoid — not checked here).
3. **check's exception becomes FAIL, not a suite crash.** A real runner does exactly this: one error boundary per case, while the runner's own exceptions (bad CSV table, missing column) throw {{IllegalArgumentException}} to fail fast — distinguishing the two is a point often asked in interviews.

{{summary}} counts by prefix {{PASS }}/{{FAIL }} rather than by content, mirroring how CI parses JUnit XML stdout: the report is a **string with a contract**, which is why you must never print random logs to stdout when using a text report.`,
      },
    ],
    check: [
      {
        q: 'Why must @BeforeAll be static in JUnit 5 by default?',
        options: [
          'Because JUnit 5 does not support non-static annotations',
          'Because by default JUnit 5 creates a new test object for each @Test (PER_METHOD), so there is no shared instance to call the method on',
          'Because static runs faster',
          '@BeforeAll runs after @BeforeEach',
        ],
        answer: 1,
        explain: 'The instance is per-test, while @BeforeAll runs once before any instance exists. Switch to @TestInstance(PER_CLASS) and @BeforeAll can drop static — but state in the object is then shared across tests, so be careful when enabling parallel.',
      },
      {
        q: 'Which situation fits @MethodSource better than @CsvSource?',
        options: [
          'A table of simple integer pairs',
          'Data that needs a structured object, e.g. LoginCase(user, pass, expectError)',
          'When tests should run in parallel',
          'When tagging a test as smoke',
        ],
        answer: 1,
        explain: '@CsvSource only carries scalar values in a string and has comma/null traps. @MethodSource returns Arguments/Object containing real objects, reads better and refactors better.',
      },
      {
        q: 'What is the difference between @RepeatedTest(5) and retry on failure?',
        options: [
          'Same thing, different names',
          '@RepeatedTest runs 5 times to find intermittent bugs; retry re-runs on failure and reports pass if the next run is correct',
          'Retry only works with TestNG',
          '@RepeatedTest always fails when one run fails',
        ],
        answer: 1,
        explain: '@RepeatedTest is a tool to find race conditions (all 5 runs must pass). Retry is a mechanism that hides flaky tests: fail on run 1 but suite still green — log the retry count into the report instead of using it to make CI stop being red.',
      },
      {
        q: 'Why is dependsOnMethods (TestNG) considered an anti-pattern for UI suites?',
        options: [
          'It does not exist in TestNG',
          'Child tests are silently skipped when the parent fails, it blocks parallelism and creates chained state that is hard to debug',
          'It increases driver timeout',
          'It requires @DataProvider',
        ],
        answer: 1,
        explain: 'Ordering becomes a dependency: one change in login makes 10 tests vanish from the report (skip), and you cannot run in parallel. Replace with self-contained setup or a pre-logged-in storage state.',
      },
    ],
  },
});
