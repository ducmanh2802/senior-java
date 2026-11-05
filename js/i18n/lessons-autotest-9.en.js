/*
 * English translation of js/data/lessons-autotest.js — task T767. Format: js/core/i18n.js (content overlay).
 * ids: lesson-autotest-011
 */
App.i18n.content({
  'lesson-autotest-011': {
    title: 'Flaky tests: detecting them from run history, isolating them correctly, and fixing the root cause',
    goals: [
      'Define flaky in a verifiable way and tell it apart from a real regression',
      'Why rerun-on-fail lowers confidence in the whole suite, and how to compute the probability that it swallows a bug',
      'Detect flakiness from data (test, commit, result) using the rule "same commit with both a pass and a fail"',
      'Measure the flaky rate, propose quarantine with a threshold, and give every isolated test an owner and an expiry date',
      'Run the 6-step process that fixes the root cause instead of avoiding it',
    ],
    body: `**Summary:** a **flaky test** is a test that gives **different results between two runs while nothing has changed** — same code, same commit, same environment. The most reliable way to detect it is not "sit there rerunning it until you see it", but reading the run history: a test that **on the very same commit** has both a pass and a fail is certainly flaky, because the code did not change. The right fix is to find the **source of nondeterminism** (time, ordering, shared data, environment, the application itself) and remove it. Automatic retry fixes nothing — it only turns "red once" into "green right away", and when the code really has a bug it swallows that bug too.

### Three kinds of red — do not merge them into one
| Kind | Signal | Action |
|---|---|---|
| **Real bug (regression)** | fails **steadily** from commit X onward, passed before that commit | open a ticket, block the merge |
| **Wrong test (test defect)** | fails steadily but the expectation is wrong (requirement changed, message changed) | fix the test |
| **Flaky** | fails **unsteadily** on the same commit | quarantine + fix the root cause |

The danger of flakiness is that it **competes** with the other two kinds the moment you look at CI: the pipeline goes red, somebody says "that one is flaky, just retry it", and a real bug gets swallowed by the retry. That is why a lot of QA literature classifies flakiness as **technical debt** you have to pay down, not as "a small incident".

### Where it comes from: a list you can diagnose with quickly
**1. Time and waiting.** Sleeping with {{Thread.sleep(2000)}} and then asserting: the CI box is slower than yours. Waiting for a condition that **never happens** (a CSS animation, a WebSocket that has not pushed its data yet). Clocks: a test that generates a report "on February 31st", a test that runs at 23:59:59.9, an "expires in 7 days" test that crosses midnight, or CI running UTC while you run UTC+7 — the kind of bug that only blows up at night in Vietnam time.

**2. Ordering and state dependencies.** Test A logs in and leaves that tab as it is; test B assumes somebody already logged in. Sequential run is green, random-order run is red. JUnit 5 sorts methods with some {{MethodOrderer}} that is **not the order you wrote the code in**, so this kind of bug occasionally "heals itself" — which makes it even more dangerous.

**3. Shared data.** Two workers use the same qa@example.com account and both change the password on it; a voucher that can only be redeemed once; a test asserting "the list must contain exactly 10 records" while someone is clicking around in the staging DB; seed data swept away by another test.

**4. Environment and infrastructure.** A shared database (deadlocks, the connection pool running dry), a third-party API rate limit when the suite fires 200 req/s, DNS inside a container, the disk filling up with videos/screenshots, {{/dev/shm}} being 64 MB and crashing Chromium, a dependency service restarting in the middle of the nightly.

**5. The application itself being nondeterministic.** A UUID or order id rendered on the UI and then asserted as a string, a search result with no stable ordering, cache TTLs, eventual consistency after a write (the read replica has not caught up yet), stock quotes and exchange rates that move every minute.

**6. The test creating nondeterminism on its own.** {{new Random()}} without a seed, iterating a {{HashMap}} and comparing it to a hard-coded list, {{Instant.now()}} called twice giving two different values, locale-dependent strings ({{toLowerCase}} in Turkish).

### Why rerun-on-fail is a double-edged sword
TestNG has {{IRetryAnalyzer}}, JUnit 5 has an extension you write yourself (or a third-party library such as JUnit Pioneer's {{@RetryingTest}}), Playwright (the Node flavour) has {{retries}} in the config. Everybody turns it on because it makes CI "green again" instantly. Now do the arithmetic: a test with a **20%** chance of failing, retried twice (3 attempts at most). The probability it is **still red** = 0.2³ = 0.8%. A suite of 500 tests of which 10 are flaky like that → the probability that **all 10** go green is 0.992¹⁰ ≈ 92%. In other words, every night CI is green with high probability, and people forget that those 10 tests are broken.

The problem is not the wasted time (retry makes the slowest test run 3 times, and it usually sits exactly at the most expensive spot). The problem is the **signal**: as the flaky rate climbs, people start retrying **tests that are red because of a real bug** as well, then hit merge. A healthy policy:
- retry **yes**, but a small number of times (1), only for a listed group of tests (tag), and **every retry must be written to the log** so you can count them;
- the final result of a test that passed after a retry must show as "passed after retry" (yellow), **not green**;
- a test that needed a retry on 3 consecutive nights is automatically quarantined, with an issue and an owner.

### Detecting it with data: the "same commit" rule
This is the part the exercise simulates. For each (test, commit) pair, collect the number of passes and the number of failures. A commit carrying **both** means the code did not change while the result did → flaky, no other explanation is left. The opposite case — a test failing on a newer commit and passing on an older one — is a **regression**; do not rush to label it flaky.

~~~text
LoginTest  c1: pass pass fail   <- same commit holds both pass and fail  -> FLAKY
PayTest    c1: fail  c2: fail   <- fails steadily, code changed          -> real bug
CartTest   c1: pass  c2: fail   <- pass then steady fail tracking commits -> regression
OtpTest    c1: fail pass        <- FLAKY, and CI looks green thanks to retry
~~~

The two numbers that should minimally be on the dashboard: a test's **flaky rate** = (number of commits with mixed results) / (number of commits that test has run on), and the **suite flaky rate** = runs that went red because of flakiness / total runs. A sensible quarantine threshold is usually rate ≥ 0.2–0.5 **and** the test must have enough commits (≥ 2–3) so that a single accidental mixing is not turned into a verdict.

### Quarantine done right
Quarantine is **not** {{@Disabled}} and then forget about it. The pattern that works well in many teams:

1. Give it a **tag** ({{@Tag("quarantine")}} / a TestNG group), never delete the test: the PR suite skips that tag, but the **nightly still runs it** so data keeps coming in.
2. Every quarantined test must have **an issue + an owner + an expiry date** (2 weeks). Without an owner, quarantine becomes a graveyard.
3. The dashboard shows **the quarantine list and the age of each entry** — that number must shrink over time; if it grows, the strategy is wrong.
4. A quarantined test **must not block the merge**, but it must appear yellow in the report so nobody mistakes it for green.
5. When quarantined tests exceed ~3% of the suite, stop adding features and spend a sprint paying the debt.

~~~seq
title: How a red test is handled in CI
actors: CI | Detector | Owner | Board
CI -> Detector: send run history: test commit result
Detector -> Detector: same commit with both pass and fail
Detector -> Board: update flaky rate and quarantine list
Board -> Owner: raise an issue when the threshold is crossed
Owner -> CI: fix the root cause then drop the quarantine tag
note CI..Detector: with no history you cannot tell flaky from regression
~~~

### The fix-at-the-root process (6 steps)
1. **Reproduce under control**: run 30–50 times in a row with {{@RepeatedTest(50)}} (JUnit 5) or {{invocationCount}} (TestNG) and record the log of every run. If you cannot hit it even once in 50, do not fix by guesswork.
2. **Take parallelism out as a variable**: rerun with parallel=1. If it stops going red → a race or shared state (back to lessons 009-010), not a waiting bug.
3. **Make time deterministic inside the test**: replace {{LocalDate.now()}} with an injected {{Clock}} ({{Clock.fixed(...)}}), or in UI terms assert an **invariant** instead of an absolute value ("the date column is not empty" rather than "equals 05/11/2026").
4. **Replace waiting with conditions**: drop every {{sleep}}; use Playwright web-first assertions ({{assertThat(locator).hasText(...)}} polls until the timeout) or wait for **network idle / data ready** explicitly. Sleeping is guessing; waiting on a condition is knowing.
5. **Private data for each run**: generate unique keys ({{"qa-" + UUID.randomUUID()}}), clean up after the test, and **do not assert absolute counts** on a shared environment — assert your own records (filter by the key you just created).
6. **Seed the randomness the test itself needs**: if a test needs random values, seed them with a fixed number taken from an environment variable and print the seed to the log so that exact run can be reproduced.

If after those 6 steps it still goes red occasionally, the cause is almost certainly in **the application or the infrastructure**: open a ticket for a dev with evidence (trace, log, the two runs side by side) — flakiness that lives in the application is not QA's job to patch away inside the test.

### Four mistakes people keep making
- **Deleting the test to make CI green**: the fastest and the worst option; coverage quietly drops and nobody notices.
- **Retrying at the page-object level**: retrying a click means you may have pressed the Submit button twice → duplicate orders. Retry only **idempotent** operations (reads), and retry at the runner level.
- **Raising the timeout to 60 seconds**: flaky becomes slow. You just bought stability with 40 minutes of CI every night.
- **Blaming "unstable CI"**: what you do not measure you cannot know; the flaky rate broken down by team/module/commit usually points at one specific service or one specific group of tests.

### Interview connections
- "How do you handle flaky tests?" → do not answer "retry". Answer: (1) classify it with run-history data, (2) quarantine with an owner and an expiry date, (3) the 6-step diagnosis process, (4) measure the flaky rate weekly and treat it as technical debt.
- "Your test is red, the CI report tells you nothing — what now?" → describe capturing **the two runs side by side** (commit, timestamp, log, trace) and eliminating variables one at a time (parallelism, data, clock).
- "What flaky rate is acceptable?" → a good answer carries both a number and a reason: under 0.5–1% of runs for a suite that blocks merges; above 3% means stopping features to pay the debt down.
- When is retry **legitimate**? → when you are certain the source of nondeterminism is in external infrastructure (a flaky network to a partner API), and the retry is logged and capped in count.

> Senior tip: the numbers worth bringing to a quality review are not "how many tests pass" but **defect escape + flaky rate + the average time from a test going red to it being fixed**. A 1,200-test suite that is 99% green but 5% flaky every week is more useless than a 300-test suite that is 100% green and has duration data so it can be sharded. And one cheap trick that works: run CI in **random order** mode ({{junit.jupiter.testmethod.order.default = org.junit.jupiter.api.MethodOrderer$Random}}, print the seed to the log) — it drags out every test that is hiding behind another test, before they reach production.`,
    exercises: [
      {
        title: 'FlakyDetector: find tests with mixed results on the same commit, compute the rate and propose quarantine',
        prompt: `Write {{FlakyDetector}} doing exactly what CI needs: read the run history and point out which tests are flaky, which ones are regressions, and which ones should be quarantined. **No reading the real clock, no random, no parallelism.** One run of one test is one {{Run}} object.

**1) The {{Run}} class** (data only):
- constructor {{Run(String test, String commit, boolean pass)}}.
- getters {{test()}}, {{commit()}}, {{pass()}} (of type {{String}}, {{String}}, {{boolean}}).

**2) The static functions of {{FlakyDetector}}** — "mixed on the same commit" is the core definition behind all of them:
- {{static Set<String> flaky(List<Run> runs)}}: the tests that have **at least one commit** on which the test both passed and failed. Order does not matter.
- {{static Map<String, Integer> commitCount(List<Run> runs)}}: for **every** test appearing in {{runs}}, the number of **distinct** commits that test has run on.
- {{static Map<String, Double> rate(List<Run> runs)}}: for every test, {{(number of mixed commits) / (number of distinct commits)}}, using real (floating-point) division. A test that never mixed → {{0.0}}.
- {{static List<String> quarantine(List<Run> runs, double minRate, int minCommits)}}: the tests with {{rate >= minRate}} **and** {{commitCount >= minCommits}} (both bounds include equality). Sorted by **rate descending**, and on equal rate by **name ascending**.
- {{static List<String> regressions(List<Run> runs)}}: the tests for which (a) on the **last commit** where the test appears — "last" means the **order in which each commit first appears in the list** {{runs}} — **every** run failed, and (b) there is at least one earlier commit on which the test passed at least once. Return the names as a list in ascending order. This is exactly the test that is "steadily red from some commit onward", meaning a real bug rather than flakiness.
- A {{runs}} list that is {{null}} or empty: every function returns an empty result (empty Set/Map, empty list) and **throws no exception**. {{minCommits <= 0}}: treat it as {{1}}.

Example over the data:

~~~text
LoginTest c1: pass pass fail   -> mixed at c1  |  1/2 commits  -> rate 0.5   FLAKY
PayTest   c1 fail c2 fail c3 fail             -> rate 0.0   not flaky, not a regression (never passed)
CartTest  c1 pass c2 pass c3 fail             -> rate 0.0   -> REGRESSION (last commit all fail, passed at an earlier commit)
SearchTest c1: pass+fail  c2: fail+pass  c3 pass  c4 pass   -> 2/4 = 0.5   FLAKY
OtpTest    c1: fail pass                     -> 1/1 = 1.0   FLAKY
AddrTest   c1: pass fail   c2: fail pass     -> 2/2 = 1.0   FLAKY
~~~

With {{minRate = 0.5}} and {{minCommits = 2}} the quarantine result is {{[AddrTest, LoginTest, SearchTest]}} ({{OtpTest}} is dropped because it has only run on 1 commit — a single mixing is not enough to conclude anything).

Traps: (a) if you compute "failed on this commit, passed on another", you are counting a **regression** as flaky, and the team will wrongly accuse a real bug; (b) if you take the last commit alphabetically instead of by the order it appears in the history, then with real CI data (commit hashes) the result is completely meaningless.`,
        hints: [
          'Build the structure once and reuse it: one private function returning a {{Map<String, Map<String, int[]>>}} (test → commit → array [pass count, fail count]). Use {{LinkedHashMap}} at both levels to keep the order of appearance — that order is precisely the definition of "last commit" used by {{regressions}}.',
          '{{computeIfAbsent}} keeps it tidy: {{by.computeIfAbsent(test, k -> new LinkedHashMap<>()).computeIfAbsent(commit, k -> new int[2])}}, then increment {{cell[0]}} or {{cell[1]}}. Remember that {{runs == null}} returns an empty map so that none of the other functions has to worry about it.',
          'flaky and rate share one single count: the number of commits where **both cells are > 0**. Write one private function that counts mixed commits and use it for both {{flaky}} and {{rate}} — do not compute the same thing twice in two different ways.',
          '{{rate}} is floating-point division: cast it as {{(double) mixed / commits}}, otherwise {{int/int}} rounds to 0 and no quarantine threshold ever fires.',
          '{{quarantine}} sorts with a two-level comparator ({{Double.compare(rateY, rateX)}}, then {{x.compareTo(y)}}) — read the rates from the map you already computed; calling the counting function again inside the comparator turns this into O(n² log n).',
          '{{regressions}}: take the {{List<int[]>}} of cells in order; you need {{cells.size() >= 2}}, the last cell having {{pass == 0 && fail > 0}}, and **one of the earlier cells** having {{pass > 0}}. Drop the last condition and a test that never passed (broken from the start) gets called a regression.',
        ],
        explain: `The whole exercise turns on a single count: **inside one commit, does the test have both outcomes?** A {{commit}} is the unit at which the code does not change, so two different results on the same commit rule out every explanation of the "it must be the new code" kind. That is the verifiable definition of flaky, and it explains why you **need a history of many runs** — one run only gives you red or green, it never tells you what percentage of the time that test is red.

{{LinkedHashMap}} at both levels is a deliberate detail, not a habit. It preserves the **first-appearance order** of the commits, so "the last {{commit}}" in {{regressions}} means exactly what CI sees: the most recent run. With a {{HashMap}} the order becomes arbitrary and the conclusion "this test has been broken lately" comes out wrong — and being wrong on data is more dangerous than having no data at all. If you had real timestamps you would sort by them; here we use the order in the list because the problem statement gives no time.

{{regressions}} has two conditions and people routinely drop one of them. The "the last commit fails completely" condition also catches PayTest (which never passed) — but PayTest is not a regression, it is a test broken from birth or an unfinished feature. The "it passed at an earlier commit" condition is what produces the sentence that is actually worth something to a dev: "before commit X this still worked". In real work that sentence is the evidence you paste into the ticket, and it is the reason people fix things faster.

The **two-sided threshold** ({{minRate}} **and** {{minCommits}}) is where experience shows. A new test that ran on one commit, failed, then passed after a retry has rate = 1.0 — it sounds alarming, but a sample of one is nothing: it could be a half-finished deploy, CI could have lost power. Requiring {{minCommits >= 2}} (3 in real life) keeps in the quarantine list only the tests that have **demonstrated** nondeterminism several times. Re-read the exercise data with {{minCommits = 3}}: {{OtpTest}} is dropped because it ran on 1 commit, {{AddrTest}} and {{LoginTest}} are dropped because they only have 2 commits even though {{AddrTest}} scores rate 1.0, and only {{SearchTest}} is left — 4 commits, 2 of them mixed, rate exactly 0.5 so it still clears {{minRate}}. A single threshold would hand you the wrong list.

{{rate}} also carries a very Java-shaped lesson: {{mixed / commits}} with two integers yields {{0}}, and the quarantine list is **always empty** — this bug is extremely hard to spot because nobody throws anything, the suite simply never quarantines a thing. Putting {{(double)}} on the numerator is the specific cure.

Other frequent mistakes: (1) comparing {{Double}} values produced by imprecise division with {{==}} — for a {{0.5}} threshold that is safe because 0.5 is represented exactly in binary, but if your data yields {{1.0/3}} you must compare with {{Math.abs(a - b) < 1e-9}}; (2) accepting a {{Run}} whose fields are {{null}} as valid, letting {{computeIfAbsent(null, ...)}} quietly lump every odd run into one bucket; (3) counting mixed commits with a set **difference** (commits having a pass minus commits having a fail) — it has to be a set **intersection**, because a test that passes at c1 and fails at c2 would be called mixed by the difference even though no single commit holds both outcomes.`,
      },
    ],
    check: [
      {
        q: 'Which evidence lets you conclude a test is flaky without rerunning it?',
        options: [
          'The test fails on CI but passes on your machine',
          'In the run history the test has both passes and fails on the same commit',
          'The test failed once and never failed again',
          'The test takes more than 60 seconds to run',
        ],
        explain: `The same commit means the code did not change, so different results can only come from a nondeterministic factor (time, shared data, ordering, environment). "Fails on CI, passes on your machine" is only a suspicion signal — it may well be a genuine environment-dependent bug.`,
      },
      {
        q: 'A test has a 20% chance of failing and CI has retry 2 enabled (3 attempts at most). Which statement is most accurate?',
        options: [
          'The suite becomes trustworthy because the chance of red drops to 0.8% per test',
          'A test that is red because of a real bug also gets a 99.2% chance of being retried into green, so the failure signal is lost',
          'Retry increases runtime but does not affect the quality of the signal',
          'Retry only applies to tests that fail on an assertion, not to exceptions',
        ],
        explain: `The 0.8%-red figure does not distinguish "red because flaky" from "red because of a bug": when a bug shows up in a flaky-looking form, the retry swallows it exactly like harmless flakiness. That is why retry needs a small cap, must be logged, and a "pass after retry" result has to be shown yellow rather than green.`,
      },
      {
        q: 'How should you quarantine a flaky test so that it does not turn into hidden debt?',
        options: [
          '{{@Disabled}} the test and delete it from the suite so CI goes green',
          'Add a tag so PR runs skip it while the nightly still runs it, plus an issue, an owner and an expiry date',
          'Raise the timeout of that test to 60 seconds',
          'Move the test to a manual rerun every morning',
        ],
        explain: `The goal of quarantine is to **not block the flow** while still **keeping the data and the accountability**. Tag + nightly keeps measuring the flaky rate; issue + owner + deadline forces somebody to fix it. Disabling it and forgetting about it means coverage drops without anyone writing it down anywhere.`,
      },
      {
        q: 'Which step should you take **first** when you start diagnosing a test that goes red occasionally?',
        options: [
          'Raise the timeout and add a sleep before the assertion to stabilise it for now',
          'Reproduce under control: run 30–50 times in a row logging each run, and also try running with parallelism switched off',
          'Rewrite the page object',
          'Ask a dev to fix the application',
        ],
        explain: `If you cannot reproduce it, every change you make is a guess. {{@RepeatedTest(50)}} gives you the red ratio; switching off parallel execution is the experiment that separates a race or shared state from a waiting bug. Those two facts decide the direction of the fix, and they cost far less than guessing and then waiting for next week's nightly.`,
      },
    ],
  },
});
