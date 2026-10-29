/*
 * English translation of js/data/lessons-testing.js — task T466. Format: js/core/i18n.js (content overlay).
 * ids: lesson-testing-004
 */
App.i18n.content({
  'lesson-testing-004': {
    title: 'A homegrown harness: verifyAll, barrier abort and the NOT RUN state',
    goals: [
      'Write a runner that runs every case and collects PASS/FAIL instead of stopping at the first failure',
      'Tell SKIP apart from NOT RUN and explain why a case that never ran must never count as PASS',
      'Design a RESULT line with an honest denominator and use it as a quality gate in CI',
    ],
    body: `**Summary:** A homegrown test harness usually breaks in one of two ways: fail-fast reports only the first failing case, so you go through many fix-then-rerun cycles; or — worse — it turns cases that never ran into "passed", so the pipeline is green while nothing was actually verified. A correct runner must run every case, record a separate status per case (PASS, FAIL, SKIP, NOT RUN) and aggregate them into a RESULT line with an honest denominator.

### Why fail-fast blinds you
A runner of the form {{for (Case c : cases) c.run();}} stops as soon as the first case throws. On a dev machine that looks fast, but when a refactor breaks 12 cases you only see case 3. You fix it, rerun, see case 7, fix again... Each CI round takes a few minutes, and you have no idea how far you are from "green". Worse, some bugs only appear when cases run together, so stopping early hides interactions between them.

JUnit and most mature runners take the **verifyAll** approach: run each case, record the result, and only then aggregate. In return, each case must be **independent**: a case must not leave dirty data behind, must not close shared resources, must not assume an order. Without isolation, running every case creates cascading failures that are harder to reproduce than with fail-fast.

A subtle point: verifyAll does not mean ignoring fatal errors. If the JVM runs out of memory, overflows the stack or the process is killed, the runner cannot continue. In that situation the remaining cases must be recorded as **NOT RUN**, never silently treated as passed.

### Four states, not two
Most homegrown harnesses only have two counters: pass and fail. That is the source of the incorrect reports.

| State | Meaning | Example |
|---|---|---|
| PASS | The case ran to completion and every assertion held | Adding two numbers gives the right result |
| FAIL | The case ran but an assertion failed or it threw an unexpected exception | expected 100 but got 99, NullPointerException |
| SKIP | There was a valid decision not to run it | Only run smoke tests on release day |
| NOT RUN | It never ran, usually because the runner aborted | Barrier closed, process killed, previous case hung |

JUnit distinguishes **failure** (AssertionError) from **error** (any other exception), but many UI reports merge both into "failed". In this lesson's harness exceptions are also merged into FAIL, but the detail must keep the exception type and message. What matters is not the name but **never equating a case that did not run with a case that passed**. A case may have run halfway, printed a few log lines and then been aborted at the barrier; it is still NOT RUN, not PASS, because the final verification never happened.

### The silent trap: always green because nothing ran
Imagine a runner that increments {{fail}} on every failed assertion and counts {{total}} as the number of cases **that ran**. Case 1 passes, case 2 calls {{abort()}} at the barrier, cases 3 and 4 never start. The output is {{RESULT 1/1}} and CI is green. No case failed, but 3 cases were never checked.

This is why the two numbers must be separated:
- {{total}} is the **number of registered cases**, taken from the list before running, not the number of cases that ran.
- {{not_run}} counts the cases that could not run; it is tracked separately and always appears in the result line when greater than 0.

An easy invariant to check: {{passed + failed + skipped + not_run == total}}. If this equation does not hold, the report is broken and none of its numbers can be trusted.

### Barriers and NOT RUN
A barrier stands for an infrastructure condition: is the database ready yet, has the dependent service started yet, has the future completed yet. In this lesson's harness each case may call {{awaitBar()}}. If the abort flag is already set, the call throws a dedicated exception; the runner catches exactly that exception and records the current case and every following case as NOT RUN.

Example with three cases:
- Case A runs to completion, PASS.
- Case B calls {{abort()}} then {{awaitBar()}} and is blocked at the barrier.
- Case C is never called.

The report must be {{RESULT 1/3 (2 not_run)}}, not {{RESULT 1/1}} and certainly not {{RESULT 3/3}}. From the 3 in the denominator the reader immediately knows two cases were not verified. If you use the exit code as a gate, block when {{not_run > 0}}; otherwise a CI run cancelled midway can look like a perfect run.

### How SKIP differs from NOT RUN
Both reduce coverage, but the cause and the handling are different:
- **SKIP** is a deliberate, known decision with a reason: "this test only runs when Docker is available", "only runs on release day", "the feature is behind a feature flag". The test author owns it.
- **NOT RUN** is an operational incident: the runner died, the barrier closed, a global timeout fired, the process was killed. Nobody actively decided to drop this case.

So do not merge them into a single "skipped" column. A sudden spike in skips usually means a feature flag was turned off by mistake or an environment condition changed; a sudden spike in not_run means the test infrastructure is in trouble. Both deserve their own alert. In particular, a permanent skip is a hidden bug: attach an owner, a ticket and an expiry date to every conditional skip.

### skipIf must take the date from outside
A common variant is a test that only runs on a specific date, for example a release-day smoke test. If the test calls {{LocalDate.now()}} internally, the suite becomes dependent on the real clock: green today, red tomorrow, and CI in another timezone gives yet another result. The right way is to pass the date in:

~~~java
LocalDate today = LocalDate.of(2026, 10, 26);        // the test decides the date
Case smoke = TestGate.skipIf(
    "release-day smoke",
    d -> d.equals(LocalDate.of(2026, 10, 25)),         // the predicate receives the supplied date
    check -> check.require(true, "smoke ok")
);
Report report = gate.add(smoke).runAll(today);       // same date, same result
~~~

This keeps the harness's own tests deterministic too: they produce the same result no matter when they run, and you can exercise both the skip branch and the run branch in the same pass.

### The report must carry enough to act on
A line saying "1 test failed" helps nobody fix anything. Each result should carry:
- A **case name** that is unique and describes the behaviour, not {{test1}}, {{test2}}.
- An explicit **status**, separating PASS, FAIL, SKIP, NOT RUN; exceptions include their type and message.
- **Detail**: expected/actual, exception type and message, seed for property-based tests.
- **Run order** or an id so the case can be reproduced when it depends on the environment.
- **Duration** if you want to spot abnormally slow cases.

When a case has several failing assertions, do not throw at the first one. {{Check}} should collect **all** problems and report them in one go: fixing everything in one pass beats three passes. But do not swallow exceptions either: if a case throws an unexpected error, record FAIL with the exception type and message — never turn it into SKIP.

### Use RESULT as a quality gate
The exit code only says how the process ended; it says nothing about how many tests actually ran. A test class disabled by a merge conflict, a wrong filter in the run command, or a cancel midway can all produce exit code 0. A gate should also check:
- A minimum number of tests executed, for example at least 80% of the registered cases.
- {{not_run == 0}} on the main branch.
- The skip count does not exceed the agreed threshold, and every new skip has a ticket.
- No case runs for too long without a timeout.

In the Java ecosystem, Surefire/Failsafe prints {{Tests run: X, Failures: Y, Errors: Z, Skipped: W}}; parse all four numbers instead of just looking at the build's green colour. With a homegrown harness, the {{RESULT passed/total (skipped, not_run)}} line is your machine-readable contract.

### Common production traps
- **Catching {{Throwable}} and continuing**: swallowing {{OutOfMemoryError}} and {{StackOverflowError}} leaves the JVM in an unreliable state. The small harness in this lesson catches {{Throwable}} to demonstrate reporting, but production code must rethrow {{VirtualMachineError}} and let the outer layer mark the rest as NOT RUN.
- **A case that hangs forever**: a runner without a timeout hangs the whole CI. Every case needs a watchdog or a global timeout.
- **Using {{System.exit}} in a case**: the process exits before the report is written, and every following case becomes NOT RUN without anyone knowing.
- **Sharing state between cases**: an earlier case leaves data behind, and a later case either passes falsely or fails unfairly. Create a fresh fixture for each case.
- **Counting total from the cases that ran**: this is exactly the bug that reports 1/1 instead of 1/3. Total must come from the registered list.
- **Silent skips**: an untracked {{@Disabled}} or {{assumeTrue}} lets coverage erode with no alert.

> Senior tip: I once watched a pipeline stay green for three weeks because a test class was marked disabled while resolving a merge conflict; Surefire printed "Tests run: 0" but the build still succeeded. Since then the team set gates: the total number of tests may not drop more than 5% from the baseline, not_run must be 0, and every new skip must reference a ticket in a comment. An honest harness matters more than a fast one.

### Interview notes
Interviewers often ask: "Why should a test suite not be fail-fast?", "How are skipped and not run different?", "How do you know a green pipeline is real and not just no tests running?", and "How do you design a quality gate?". A good answer states the four states clearly, the denominator taken from the registered list, the total-count invariant, and how to tell a deliberate skip from an infrastructure-caused not run. The exercise below makes you write exactly such a runner, including the barrier abort and a skipIf that takes the date as an argument.`,
    exercises: [
      {
        title: 'Write TestGate: verifyAll, barrier abort and an honest RESULT line',
        prompt: `You are given the skeleton {{TestGate}} with the basic types. Complete the logic:

**1. {{Check}}** collects problems instead of throwing immediately:
- {{require(condition, message)}} adds {{message}} to the problem list when the condition is false.
- {{eq(expected, actual)}} adds a problem of the form {{expected X but got Y}} when the two values differ.
- {{passed()}} returns true when there is no problem; {{problems()}} returns a copy of the problem list.

**2. {{runAll(today)}}** runs **sequentially, without fail-fast**:
- Every registered case must have exactly one result in the report, including cases that did not run.
- If the abort flag is already set **before** reaching a case: record {{NOT_RUN}} and do not call the body.
- If {{case.skippedOn(today)}} returns true: record {{SKIP}} and do not call the body.
- Otherwise run the body with a fresh {{Check}}. If the body calls {{awaitBar()}} after an abort, catch {{AbortedException}} and record the current case and every following case as {{NOT_RUN}}.
- If the body throws any other exception, record {{FAIL}} with the class name and message as detail, then **continue** with the next case.
- If the body completes and the {{Check}} has problems, record {{FAIL}} with the problems joined by {{"; "}}; with no problems record {{PASS}}.

**3. Barrier**: {{abort()}} sets the abort flag; {{awaitBar()}} throws {{AbortedException}} if the flag is set, otherwise returns true.

**4. {{Report}}**: {{total()}} is the number of registered cases. {{passed()}}, {{failed()}}, {{skipped()}}, {{notRun()}} count by status. {{line()}} returns exactly this format:
- No skip and no not run: {{RESULT 2/3}}.
- Not run present: {{RESULT 4/5 (1 not_run)}}.
- Both: {{RESULT 2/4 (1 skipped, 1 not_run)}}.

The tests call {{runAll}} with a fixed {{LocalDate}}, so do not read {{LocalDate.now()}}. Nothing needs to be printed to stdout; the tests read directly from the report object.`,
        hints: [
          'When counting total, use {{cases.size()}} or {{results.size()}} on the report; do not count the cases that actually ran, because that is exactly the bug that turns 1/3 into 1/1.',
          'Inside {{runAll}}, check the {{aborted}} flag before each case. When {{awaitBar()}} throws {{AbortedException}}, catch it separately and record {{NOT_RUN}}; do not let it fall into the generic {{Throwable}} branch and be recorded as FAIL.',
          'The {{line()}} method only adds the parenthesised part when there is a skip or a not run; use {{String.join(", ", notes)}} to produce exactly {{(1 skipped, 1 not_run)}}.',
        ],
        explain: `This exercise mirrors how Surefire/JUnit aggregate results, but written by hand so you can see the design decisions:

- **VerifyAll** runs every case so that one CI run gives you the whole picture. The tests check both the run order and the fact that the third case still runs after the second one fails.
- **NOT RUN** is a separate state. When the barrier closes, the current case and every following case have no verified result, so they must never be counted as passed. This is the difference between an honest report and a "fake green" report.
- **SKIP** is deliberate, decided by a predicate that receives the date from outside. Because {{LocalDate}} is passed into {{runAll}}, the tests can exercise both the skip day and the run day without depending on the real clock.
- **Unexpected errors** must still surface. A case that throws {{IllegalStateException}} is recorded as FAIL with the type and message, and the following cases keep running.

Common mistakes:
- Counting {{total}} from the cases that ran, so the report says 1/1 instead of 1/3 when aborted.
- Catching {{AbortedException}} together with {{Throwable}} and recording FAIL; that misjudges a case that never finished and makes an infrastructure incident indistinguishable from a real bug.
- Forgetting to check {{aborted}} before each case, so the remaining cases still run after the barrier.
- Calling {{LocalDate.now()}} inside the predicate, which makes the test depend on the run date and flaky on CI in another timezone.
- Swallowing all but the first problem in {{Check}}; fixing gets slower because each run only reveals one assertion.

In production code, catch {{Exception}} and {{AssertionError}} rather than {{Throwable}}; errors such as {{OutOfMemoryError}} must abort the runner and mark the rest as NOT RUN. If you need to run in parallel, each case must have its own report entry merged by id, never a single shared counter.`,
      },
    ],
    check: [
      {
        q: 'Why is a runner that only counts {{passed}} and {{failed}} but ignores cases that never ran more dangerous than an ordinary failing test?',
        options: [
          'Because it makes the tests run more slowly',
          'Because the pipeline can be green without verifying anything, creating a false sense of safety and hiding bugs until production',
          'Because Java does not allow skipping cases',
          'Because it increases the number of log lines',
        ],
        answer: 1,
        explain: `A real failure shows up and forces someone to fix it; a case that never ran but is counted as passed goes unnoticed. CI is green, the team trusts it, and the bug reaches production. The runner is not slower because a case was skipped; Java certainly allows not running a case; and fewer log lines is not the issue either. The deadly part is the trustworthiness of the signal.`,
      },
      {
        q: 'A case calls {{assumeTrue(false)}} or is skipped because today is not release day. Which state is correct?',
        options: [
          'PASS, because no assertion failed',
          'FAIL, because the test did not run',
          'SKIP, because it is a deliberate decision based on a known condition',
          'NOT RUN, because every case that did not run is not run',
        ],
        answer: 2,
        explain: `SKIP is a deliberate decision known in advance: an environment condition, release day, a feature flag. NOT RUN is an unintended incident such as the runner being killed or the barrier closing. Neither is PASS and neither is FAIL; but merging them hides different causes and different ways to respond.`,
      },
      {
        q: 'Why should {{skipIf}} take the date as a parameter instead of calling {{LocalDate.now()}} inside?',
        options: [
          'Because LocalDate.now() always throws an exception in tests',
          'Because it makes the test deterministic: the same date passed in gives the same result, and both the skip branch and the run branch can be exercised',
          'Because LocalDate has no now() method',
          'Because only dates in the past can be used',
        ],
        answer: 1,
        explain: `Reading the real clock makes the test depend on when it runs and on the CI timezone, so it is green today and red tomorrow. Passing the date in lets the test pin both a skip day and a run day in the same pass. LocalDate does have now(), and no rule forbids future dates; the issue is determinism.`,
      },
    ],
  },
});
