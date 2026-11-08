/*
 * English translation of js/data/lessons-autotest.js — task T764/T1081. Format: js/core/i18n.js (content overlay).
 * ids: lesson-autotest-008
 */
App.i18n.content({
  'lesson-autotest-008': {
    title: 'Assertion, soft assertion and failure reporting (screenshot, trace, Allure, JUnit XML)',
    goals: [
      'Tell hard assert from soft assert and pick the right one based on whether the checks depend on each other',
      'Write your own SoftAssert: collect failures, build the summary message, clear the state after reporting',
      'Explain how evidence is captured when a test fails on Playwright for Java: screenshot, video, trace, attachment',
      'Understand the JUnit XML file that CI uses to decide red/green, and write your own counter of tests/failures/errors/skipped',
      'Design an Allure report good enough for someone else to fix the bug without asking you again',
    ],
    body: `**Summary:** An assertion is a claim that can be true or false — "the HTTP status must be 200", "the table must still have 10 rows". Without assertions, automation is just a button-clicking script: it runs to the end, prints "done", and stays green even when the application is wrong. A **hard assert** stops immediately at the first failure; a **soft assert** writes every failure into a list and then fails once at the end, so a single run lists 12 wrong fields instead of 1. But a failure is only valuable when the report says **where, why, and with what evidence**: an attached screenshot/trace, clear business steps, and the tests/failures/errors/skipped counters in the JUnit XML file — the thing CI reads to decide whether to merge or not.

### What an assertion really is
Picture a delivery note. The courier opens the box, **checks** every item against the order form (all 3 present, nothing cracked), then **signs to confirm**. An assertion is that "check" operation in code; the "sign to confirm" part is the test being reported as PASS or FAIL.

Two things are easy to confuse:
- A **log** only writes things down so a human reader can judge. A log never fails a test.
- An **assertion** compares and judges automatically: when it is wrong it throws {{AssertionError}} (the "expectation not met" error that test frameworks catch and print into the report).

In JUnit 5 the hard style is the most common:

~~~java
// Hard assert: the first wrong line stops the method, the lines below it do NOT run
assertEquals(200, resp.getStatusCode());          // compare values
assertNotNull(resp.getHeader("location"));         // must be present
assertTrue(items.size() >= 5, "need at least 5 items in the list");  // the message is what saves you in CI
~~~

The message in the last parameter sounds tiny but it decides whether you spend 5 minutes or 2 hours: the line "expected 200 but was 500" tells the story by itself, while "test failed" tells nothing.

### Why hard asserts throw information away
A UI test opens the registration form and fills all 12 fields incorrectly (last name empty, email invalid, phone missing a digit, terms checkbox ticked wrong…). With hard asserts:

~~~text
Run 1: FAIL "last name: error message not shown"      <- you only learn about field 1
Fix the error-display helper -> rerun (25 minutes)
Run 2: FAIL "email: error message not shown"          <- now field 2
... 12 cycles like this = half a day, and you still do not know what else is broken
~~~

That is exactly why soft asserts exist: **one run, know everything**. But a soft assert is not the better-version-by-default — it destroys fail-fast, and fail-fast is valuable when later steps depend on the result of earlier ones (you take the id from a response to make the next call; if the id is null, every assert after it is meaningless).

| Situation | Use | Why |
|---|---|---|
| Checking many independent fields of the same response/form | soft | you get all failures in one run |
| A later step needs data from the earlier step (id, token) | hard | if the first is wrong, continuing only manufactures fake failures |
| A smoke test of a few minutes, on an environment that changes often | hard | you need the first breakage point very fast |
| Verifying the UI after a scroll or after an AJAX call | Playwright web-first | it waits by itself, no sleep needed |

### How to write a soft assert (AssertJ, TestNG, JUnit 5)
AssertJ has {{SoftAssertions}} — "soft" here means **do not throw immediately**, but record into memory and let {{assertAll()}} summarise everything in one shot:

~~~java
import org.assertj.core.api.SoftAssertions;

SoftAssertions softly = new SoftAssertions();
softly.assertThat(page.locator("#name").textContent()).isEqualTo("Nguyen Van A");
softly.assertThat(page.locator("#phone").textContent()).isEqualTo("0900123456");
softly.assertThat(page.locator("#addr").isVisible()).isTrue();
softly.assertAll();   // FORGET THIS LINE = a falsely green test, 3 failures swallowed silently
~~~

Then there is JUnit 5's "soft in one shot" style, which needs no state-carrying object — each lambda is one check, failures are collected and reported together:

~~~java
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;

assertAll(
    () -> assertEquals("Nguyen Van A", page.locator("#name").textContent()),
    () -> assertEquals("0900123456", page.locator("#phone").textContent()),
    () -> assertEquals(true, page.locator("#addr").isVisible())
);
~~~

TestNG has {{SoftAssert}} with the same idea but calling {{assertAll()}} at the end is **mandatory**; forget it and the failures are lost. Safe trick: call {{assertAll()}} in {{@AfterMethod}}, so it does not depend on whether the person who wrote the test remembered.

Playwright for Java has its own kind of **web-first** assertion (asserting the browser way). What makes it different: it waits automatically until the condition becomes true or the default 5-second timeout runs out, so you never need {{Thread.sleep}}:

~~~java
import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

assertThat(page.locator("#cart-count")).hasText("3");   // polls until the text is "3", TimeoutError after 5s
assertThat(page.locator("#submit")).isEnabled();
assertThat(page).hasTitle("Order successful");
~~~

{{sleep(2000)}} followed by a hard assert is flakiness source number 1: the CI machine is slower than your machine and 2 seconds is not enough; raise it to 10 seconds and a suite of 500 tests gains almost an hour. Web-first assertions are both fast (they take the result as soon as the condition holds) and durable.

### Evidence when a test fails: screenshot, video, trace, attachment
A **screenshot** is a picture of the screen at the moment of failure. In Playwright, do not take it inside each test — capture it automatically with a hook, because test authors will forget:

~~~java
// Turn on video and HAR (network log) recording when creating the context
BrowserContext context = browser.newContext(new Browser.NewContextOptions()
        .setRecordVideoDir(java.nio.file.Paths.get("artifacts/video")));
Page page = context.newPage();
page.goto("https://shop.test/checkout");

// In @AfterEach: only collect evidence when the test failed (shorter report, easier to read)
if (testFailed) {
    page.screenshot(new Page.ScreenshotOptions()
            .setPath(java.nio.file.Paths.get("artifacts/fail-" + testName + ".png"))
            .setFullPage(true));                      // full-page: scrolls the whole height, not only the visible viewport
    page.locator("#cart").screenshot();               // or capture only the suspicious region
}
~~~

The Playwright **trace** (switched on through {{browserContext.tracing()}} with the screenshots + snapshots options — see the Javadoc of BrowserContext.tracing for the options class name) is a .zip holding the **timeline** of the test: every action, the page DOM at each step, network, console log. Open it with {{npx playwright show-trace}}. A screenshot only says "the screen looks wrong"; a trace says "it became wrong after which click, and which request returned empty data" — a very big difference when debugging.

**Allure** ({{io.qameta.allure}}) is a tool that builds an HTML report out of test results: it labels business steps, classifies failures, and displays attachments.

~~~java
import io.qameta.allure.Allure;
import io.qameta.allure.Attachment;
import io.qameta.allure.Step;

@Step("Log in with account {0}")            // {0} = the first argument, shown in the report
void login(String user) {
    page.fill("#user", user);
    page.fill("#pass", "pwd");
    Allure.addAttachment("Request body", "{\\"user\\": \\"" + user + "\\"}");   // debug data, secrets must be masked
}

@Attachment(value = "Screen on failure", type = "image/png")
byte[] attachFailure() {
    return page.screenshot(new Page.ScreenshotOptions().setFullPage(true));
}
~~~

Allure reads results from the {{target/allure-results}} folder (one JSON file per step/test), then {{allure generate}} builds the HTML. Two config files worth knowing: **environment.properties** (environment, version, branch — shown at the top of the report so you know which build the tests ran against) and **categories.json** (grouping failures by kind: "Product defect", "Test defect", "Invalid result"), for example:

~~~json
[
  { "name": "Test defect - wrong data", "matchedStatuses": ["failed"], "messageRegex": ".*expected.*but was.*" },
  { "name": "Environment - timeout", "matchedStatuses": ["broken"], "messageRegex": ".*TimeoutError.*" }
]
~~~

### The numbers CI reads: the JUnit XML file
JUnit XML is an XML text format that Surefire/Failsafe (Maven), the Gradle test task and the JUnit/TestNG runners write out, usually at {{target/surefire-reports/TEST-*.xml}}. Jenkins uses the {{junit}} step, GitHub Actions uses a report-reading action — all they need are these numbers to print "42 tests, 2 failed, 1 skipped" and to decide whether the pipeline is red or green:

~~~text
<testsuites name="smoke">
  <testsuite name="LoginTest" tests="4" failures="1" errors="1" skipped="1" time="6.2">
    <testcase classname="LoginTest" name="correct login"/>
    <testcase classname="LoginTest" name="wrong password" time="1.1">
      <failure message="status: expected 200 but was 401">at LoginTest.java:34</failure>
    </testcase>
    <testcase classname="LoginTest" name="locked account" time="5.0">
      <error message="TimeoutError: waiting for locator">#checkout</error>
    </testcase>
    <testcase classname="LoginTest" name="todo" time="0"><skipped message="not finished yet"/></testcase>
  </testsuite>
</testsuites>
~~~

You must be able to tell the three states apart in an interview:
- **failure**: the assertion was wrong — the application behaved differently from what was expected (or the test expected the wrong thing). This is a real bug or a wrong test.
- **error** (in the XML) / **broken** (in Allure): an unintended exception — {{NullPointerException}}, {{TimeoutError}}, a wait expiring, the driver dying, the environment missing a service.
- **skipped**: it did not run — {{@Disabled}}, a precondition not met, a tag filtered out.

This difference changes what the whole team does next: 5 errors usually means infrastructure/environment is broken rather than 5 bugs; 1 failure means a ticket must be opened. That is why a good pipeline gates per type, for example "fail if failures > 0", while errors only raise a warning until you are done handling flakiness.

~~~seq
title: From a failed test to a bug ticket
actors: Test | XML | CI | Allure
Test -> XML: write testcase + failure
Test -> Allure: write JSON per step, attachment
CI -> XML: read failures/errors/skipped counts
CI --> CI: raise the alarm, attach bug or flaky label
Allure --> CI: html report + artifact
note Test..Allure: a failure must name the first error, not just "3 failed"
~~~

### Four mistakes you often meet on production
- **Forgetting {{assertAll()}}** (TestNG SoftAssert, AssertJ SoftAssertions): the test is green and the failures are swallowed. More dangerous than a failing test, because it steals the team's trust in the entire suite.
- **A test with no assertion at all**: "it finished without throwing" is counted as a pass. Check it by deliberately breaking the application and running again — if it is still green, that test is useless.
- **A report that contains only a stack trace**: no screenshot/trace, no request-response, no input data. Another QA (or you, two weeks later) has no way to reproduce it.
- **Logging the token and the password into an attachment**: Allure reports are usually open inside the company, so this becomes a credential leak. Mask before attaching, keep only what is needed to debug (last 4 characters, order id).
- **Parsing JUnit XML yourself with a simple regex and adding the attributes of the wrapping {{testsuites}} tag too**: you get doubled numbers and CI reports the wrong totals with nobody understanding why. If you want to parse, use a library, or read attributes of each inner suite tag only.

### Interview relevance
- "How do hard and soft asserts differ, and when do you choose which?" → answer along the **data dependency** axis: independent fields means collect failures, a later step needing the previous step's output means fail early; include the 12-field form example.
- "Your tests are flaky, does the framework retry them?" → retry hides flakiness; use it only at the runner layer (IRetryAnalyzer) with a small number of attempts, and you must keep a list of the tests that get retried so the root cause is still fixed.
- "Where does CI get its test numbers?" → JUnit XML (tests/failures/errors/skipped), artefact upload with an always() condition, an Allure report built from allure-results.
- "How long does it take for your bug report to get fixed?" → talk about evidence design: a screenshot at the right moment + a trace + a masked request/response usually saves an entire diagnostic session.

> Senior tip: Don't trust a green suite. Every quarter, self-check by **planting a deliberate failure** in one assert (change the expected value to something else) and run: if the test is still green, that assert never executed — usually because a soft assert is missing assertAll, or because the assert line sits after an exception swallowed in {{try/catch}}. For reports: a good message line has the shape "label + expected + actual", enough for someone else to reproduce it without asking you.`,
    exercises: [
      {
        title: 'Write SoftAssert and a JUnit XML counter',
        prompt: `Two small tasks that simulate exactly what QA writes every day: collect failures and report once, then read the numbers out of a JUnit XML file so CI can decide. Write plain Java, JDK only, two package-private classes (no public class other than Main).

**1) Class {{SoftAssert}}** — the minimal version of AssertJ {{SoftAssertions}} / TestNG {{SoftAssert}}:
- {{check(ok, message)}}: if {{ok}} is false, write {{message}} into the failure list, keeping the order they were added.
- {{equal(actual, expected, label)}}: if the two values are not equal (compared like {{Objects.equals}} — both null counts as equal), add a failure with the exact shape {{label + ": expected " + expected + " but was " + actual}}.
- {{notNull(actual, label)}}: if {{actual}} is null, add the failure {{label + ": must not be null"}}.
- {{pending()}}: how many failures are still pending.
- {{errors()}}: a **copy** of the failure list; adding/removing on the returned list must not affect the object.
- {{assertAll()}}: with no failures it stays silent; with failures it throws {{AssertionError}} whose message starts with the line "n fail:" and then each failure on its own line beginning with two spaces and "- ". **After that the failure list must be empty**, even though it just threw (so the next test can reuse the same object and so calling it repeatedly does not report the same failure twice).

~~~text
3 fail:
  - status: expected 200 but was 500
  - token: must not be null
  - role: expected admin but was guest
~~~

**2) Class {{JUnitXml}}** reading a Surefire-style XML string (hand-parsed with {{indexOf}}, no XML library):
- {{summary(xml)}} returns a {{Map}} with the keys {{tests}}, {{failures}}, {{errors}}, {{skipped}}, {{passed}}, {{suites}} (values are {{Integer}}), **summed over every open tag of the inner testsuite elements**, and **skipping the wrapping** {{testsuites}} tag on the outside (remember that the wrapping tag's name also begins with exactly the opening string of an inner suite tag, so you must look at the character right after it as well).
- Each number is read from an **attribute** of the suite's open tag; a missing attribute counts as 0. Only {{tests}}, when missing, is taken from the **number of testcase open tags** inside that suite's range. When looking for an attribute you must be sure it is the real attribute name (the character right before it is whitespace), instead of accidentally matching a string that is a suffix hidden inside another attribute name — for example {{name}} sitting inside {{classname}}.
- {{passed}} = tests - failures - errors - skipped, never below 0.
- {{failedCases(xml)}} returns a list of strings shaped {{classname#name}} in document order, for each testcase whose body contains a failure tag or an error tag (a skipped tag is **not** counted; a self-closing testcase ends with {{/>}} and has an empty body, so it can never be a failure).
- An empty string, a string with no suite, or missing attributes: return 0 / an empty list, and **never throw an exception**.

~~~text
<testsuites><testsuite name="a" tests="3" failures="1"/></testsuites>
~~~

The string above must give tests=3, failures=1, errors=0, skipped=0, passed=2, suites=1 (the wrapping tag must not be counted anywhere).

Requirements while working: do not throw inside {{check}} — the whole value of a soft assert is that it does not stop; and do not use {{replaceAll}} to count tags, because the wrapping tag would be counted twice.`,
        hints: [
          'SoftAssert keeps the failures in one field of type List<String>. The core point is that check throws nothing at all; only assertAll throws.',
          'In assertAll: build the message first, then clear the list, and only THEN throw. After a throw the code below never runs, so if you put the clear after it, the state never gets cleaned.',
          'Each failure in the message: a newline, then two spaces, then a hyphen, then one space, i.e. it starts with "\\n  - ". The test counts occurrences of this substring to make sure you did not squeeze all failures onto one line.',
          'JUnitXml needs no XML library: find the open tag with indexOf, cut up to the closing angle bracket, then read the value between the two quotes after the = sign. The trap: the string "name=" occurs inside "classname=", so you must make sure the character right before the attribute name is a space — otherwise every attribute of testcase is read as classname.',
          'For the testcase body: a self-closing tag (ending with />) has an empty body; otherwise cut up to the matching closing tag. Cutting wrong hands the next testcase the failure of the current one.',
        ],
        explain: `**SoftAssert** is nothing more than a List<String> plus one summary. {{check}} records a failure, {{equal}} and {{notNull}} normalise the wording into "label: expected X but was Y" — that exact format is what lets a CI reader know which expectation was not met without opening any code. {{errors()}} returns {{new ArrayList<>(errs)}}: if it returned the internal list directly, the caller could add or remove entries and corrupt the test state — this "leaked internal state" bug is very common in page objects and test data builders.

{{assertAll}} does three things in a strict order: (1) build the message, (2) clean the list, (3) throw. Why the clean must happen **before** throwing: once it throws, no line below runs; and cleaning afterwards is also pointless because the object is normally reused (one field for the whole class, or one shared helper). The test "can be reused after reporting" checks exactly that — in TestNG/AssertJ this is also why you may call {{assertAll()}} in {{@AfterMethod}} without fearing a double report.

**JUnitXml.summary** scans the text in a loop: find the suite opening string, take the open tag (cut up to the closing angle bracket), then decide. The biggest trap is the wrapping tag: its opening string **starts with** the inner suite opening string, so searching for the substring alone also swallows the wrapper and double-counts the numbers (that is the "CI reports 84 failed when there are only 42" kind of bug). So you must also inspect the character right after, or check startsWith against the longer tag name and skip it. Attributes are read by name, missing ones default to 0 — only when {{tests}} is missing do you count the testcase tags inside the suite, because some old runners do not write that attribute. {{passed}} is derived by subtraction and clamped from below with {{Math.max(0, ...)}}, because real data can be inconsistent (a report cut off mid-write) and CI should never receive a negative number.

**failedCases** needs the body cut correctly: a self-closing testcase has an empty body so it cannot be a failure; a testcase with a closing tag gives you the segment in between. In Surefire, {{<failure}} means the assertion was wrong and {{<error}} means an exception — both are "a red test", while {{<skipped}} is not: telling them apart correctly is what lets a pipeline gate on "failures > 0" without turning red because of disabled tests.

Common mistakes when doing this exercise: (1) forgetting the position parameter in {{indexOf(needle, i)}}, which loops forever on the same match; (2) forgetting that the closing string {{</testsuite>}} is 12 characters long so you must jump exactly that far — jumping by the open tag instead pulls the next suite's testcases into the previous suite; (3) reading an attribute by searching for {{name=}} and cutting by quotes without checking the character right before the attribute name — {{name}} also matches inside {{classname}}, so every testcase comes back as "LoginTest#LoginTest"; (4) using {{split}} on the quote character to read attributes — it breaks as soon as a value contains a space (like {{name="wrong password"}}) or a nested quote.`,
      },
    ],
    check: [
      {
        q: 'A test opens the registration form and all 12 fields show the wrong error message. You want one run that lists all 12 failures. Which approach is right?',
        options: [
          'Call assertEquals for each field, adding sleeps in between so the UI has time to render',
          'Use SoftAssertions (or TestNG SoftAssert), then call assertAll at the end of the test',
          'Drop the asserts, take a screenshot and let QA look at it by eye',
          'Use Playwright assertThat because it waits by itself',
        ],
        answer: 1,
        explain: 'A soft assert writes failures into a list instead of stopping right away, so it goes through all 12 checks and reports once. Option 4 is wrong because Playwright assertThat is still a hard assert for one condition: the first wrong condition stops the test. Sleep is a source of flakiness. Dropping asserts leaves the test with no judgement at all.',
      },
      {
        q: 'Which statement is TRUE about the TestNG SoftAssert?',
        options: [
          'It summarises automatically when the test ends, no extra call needed',
          'If you forget to call assertAll, the test still reports pass even though failures were collected',
          'It only throws when there are at least two failures',
          'It deletes the log of the steps that ran before',
        ],
        answer: 1,
        explain: 'This is the classic accident: failures get swallowed and the suite turns a false green. That is why many teams put assertAll in @AfterMethod/@AfterEach so it does not depend on the memory of whoever wrote the test. JUnit 5 avoids this trap with assertAll wrapping the lambdas in place.',
      },
      {
        q: 'In a JUnit XML file, what is the difference between failure and error?',
        options: [
          'failure is a wrong assertion; error is an unintended exception (TimeoutError, NullPointerException)',
          'failure is a slow test; error is a skipped test',
          'They are the same thing, only renamed across runner versions',
          'failure is produced by CI, error is produced by the framework',
        ],
        answer: 0,
        explain: 'This difference changes the team\'s whole next action: 5 errors usually means the environment/infrastructure is broken (missing service, dead driver), while a failure means the application behaved differently from expectations — a ticket must be opened. A good pipeline gates on "failures > 0" and only warns on errors until flakiness is dealt with.',
      },
      {
        q: 'When is a soft assert a BAD decision?',
        options: [
          'When checking many independent fields in the same response',
          'When later steps depend on data from earlier steps, e.g. taking the id out of the response to make the next call',
          'When the suite runs in parallel on CI',
          'When the test uses page objects',
        ],
        answer: 1,
        explain: 'If the id is null and you keep going, you collect 8 meaningless failures that bury the 1 real one, and the reader cannot tell whether the application is wrong or the test data is wrong. Failing early at the precondition step is correct. The other cases have nothing to do with whether the assert is soft or hard.',
      },
    ],
  },
});
