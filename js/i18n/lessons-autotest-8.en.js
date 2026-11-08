/*
 * English translation of js/data/lessons-autotest.js — task T766/T1083. Format: js/core/i18n.js (content overlay).
 * ids: lesson-autotest-010
 */
App.i18n.content({
  'lesson-autotest-010': {
    title: 'Parallel execution and sharding in CI: JUnit 5 parallel, the Playwright Docker image, splitting shards by duration',
    goals: [
      'Tell apart in-process parallelism (parallel) from spreading the suite over several machines (sharding), and know when to use which',
      'Enable and configure JUnit 5 / TestNG parallel execution, and understand why Playwright being non thread-safe forces one driver set per thread',
      'Write a CI job that uses the mcr.microsoft.com/playwright/java image and passes the shard index/total to Maven',
      'Split shards by **historical duration** with the LPT algorithm instead of dividing evenly by test count',
      'List the things you must fix in the tests before turning parallelism on (shared data, ordering, limited resources)',
    ],
    body: `**Summary:** when a suite of 800 UI tests takes 53 minutes sequentially, nobody waits for it. There are two progressively cheaper ways to shrink it: **parallel** — one machine, many threads, each thread with its own Playwright/Browser set; and **sharding** — many jobs/machines, each job running a subset of the suite. Parallelism eats the CPU and RAM of a single machine, while sharding scales horizontally but adds a new problem: how to split so that the jobs **finish at nearly the same time**. The right answer is to split by **historical duration** (taken from the {{time}} attribute in JUnit XML — lesson 008), not by the number of tests.

### The two scaling axes — do not mix them up
~~~text
PARALLEL (1 machine, N threads)          SHARDING (M jobs, M machines/containers)
  worker-1: tests A B C                   shard 1: A..S   (machine 1)
  worker-2: tests D E F       --->        shard 2: T..Z2  (machine 2)
  shared CPU/RAM/DB source                shard 3: ...     (machine 3)
~~~

- **Parallel** solves the problem "one machine has 15 of its 16 cores idle while the tests run on a single thread". It is bounded by RAM (each chromium uses ~150-300 MB) and by whatever **sequential** part is still left (setup, login, DB seeding).
- **Sharding** solves the problem "even with 16 threads it still takes 20 minutes, and CI bills per minute of a single job". GitHub Actions/Jenkins run M jobs in parallel; each job is one container.

You can add the two together, but do not overdo it: 4 shards x 8 threads = 32 browsers on four 16-core machines is a formula for mass timeouts.

### The prerequisite: tests that are truly independent
Running in parallel does **not create** independence, it **exposes** the fact that you do not have it. Four things must be clean before you turn it on:

| Problem | Symptom when parallel is on | The fix |
|---|---|---|
| Order dependency (test A creates an order, test B reads that order) | B fails because the list is empty, but only when they run in the same run | each test prepares its own data (API/SQL seed), or merge them into one test |
| Shared data (the same account, the same discount code) | logins overwrite each other, "unique 1 record" conflicts, negative balances | generate data **private to each test**: emails shaped like {{qa-<testName>-<UUID>@shop.test}}, UUID ids |
| Static state in the framework ({{static Page page}}, {{static token}}) | wrong results you cannot explain | scope the lifetime to the test/context (lesson 009), or use {{ThreadLocal}} |
| Limited resources (a connection pool of 10, a rate limit of 100/min, one physical device) | timeouts, 429 Too Many Requests | raise the pool size, or **limit concurrency** for that test group only ({{@ResourceLock}} / {{@Execution(SAME_THREAD)}}) |

JUnit 5 ships two annotations to isolate the tests that cannot run in parallel: {{@ResourceLock("db-schema")}} (tests sharing a lock run one at a time) and {{@Execution(SAME_THREAD)}} (the test may not be spread across threads). Use them for tests that drop/seed the schema, tests uploading files into the same folder, tests that need a webcam — instead of turning parallelism off for the whole suite.

### Turning on parallel in JUnit 5
Declare it in {{src/test/resources/junit-platform.properties}}:

~~~properties
junit.jupiter.execution.parallel.enabled = true
# this class runs in parallel with other classes
junit.jupiter.execution.parallel.mode.default = concurrent
junit.jupiter.execution.parallel.mode.classes.default = concurrent
# scale: 2 threads per core, capped at 16
junit.jupiter.execution.parallel.config.strategy = dynamic
junit.jupiter.execution.parallel.config.dynamic.factor = 2
# let tests of the same class share one instance (needed for non-static @BeforeAll/@AfterAll)
junit.jupiter.testinstance.lifecycle.default = per_class
~~~

- **{{mode.default = concurrent}}**: the **methods** inside one class also run in parallel. This is exactly what breaks {{@BeforeAll}} + instance state if you keep {{Page page}} as a field with {{@TestInstance(PER_CLASS)}}: one page being clicked by two threads — precisely Playwright's "not thread-safe" error.
- **{{strategy = dynamic}} + {{factor = 2}}**: thread count = 2 x number of CPU cores. Use **{{fixed}} + {{parallel.config.fixed.pool.size = 8}}** when you want a stable number across runners — prefer fixed when RAM is the bottleneck, because on a 4-core CI machine dynamic only creates 8 threads while needing ~2 GB.
- TestNG works differently: {{parallel="methods"}} or {{parallel="classes"}} + {{thread-count="8"}} in {{testng.xml}}, {{parallel="instances"}} when you use {{@Factory}}. Data providers run sequentially unless you set {{@DataProvider(parallel = true)}} — and a parallel provider multiplies the browser count whenever each stream creates a context inside the provider.

Maven Surefire also has in-machine parallelism; it works by forking **several JVM processes**: {{-DforkCount=4 -DreuseForks=false}}. Each fork is its own JVM with fully isolated resources, but each fork costs 2-4 seconds of startup plus its own Playwright.create() (the container image is downloaded again). This is also a kind of "implicit" sharding — simple, with no suite-splitting code to write.

### Sharding in CI: split the test set, each job takes one part
Playwright (the Node.js edition) has {{--shard=3/10}} built in. **Playwright for Java has no equivalent shard flag**, so you split it yourself with one of three practical approaches:

1. **By class list** — the runner receives {{SHARD_INDEX}}/{{SHARD_TOTAL}} and filters the classes whose index belongs to it. This is what the exercise below models.
2. **By tag/group** — mark {{@Tag("shard-a")}} then run with {{-Dgroups=shard-a}}; simple, but becomes a maintenance chore as tests are added.
3. **forkCount across machines** — each job runs part of the suite with {{-Dit.test=Checkout*,Order*}}.

~~~yaml
# .github/workflows/e2e.yml (simplified)
jobs:
  ui-regression:
    runs-on: ubuntu-latest
    container:
      # Microsoft's image: ships Chromium/Firefox/WebKit + ffmpeg + system dependencies
      image: mcr.microsoft.com/playwright/java:v1.47.0-noble
    strategy:
      fail-fast: false           # one broken shard must not stop the other shards
      matrix:
        shard: [1, 2, 3, 4]
    env:
      SHARD_INDEX: \${{ matrix.shard }}
      SHARD_TOTAL: 4
    steps:
      - uses: actions/checkout@v4
      # The shard selector (exercise below) reads SHARD_INDEX/SHARD_TOTAL + the JUnit XML of previous runs,
      # then prints the list of classes belonging to this shard, one class per line.
      - run: java -cp target/test-classes com.shop.qa.ShardSelector > shard.txt
      - run: mvn -B verify -Dtest="$(paste -sd, - < shard.txt)"
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: allure-\${{ matrix.shard }}
          path: target/allure-results
~~~

Three details are commonly missed here:
- **Pin the image tag to the library version**: {{v1.47.0-noble}} must match {{com.microsoft.playwright:playwright:1.47.0}}. Playwright embeds the browser binaries per version; a version mismatch gives "Executable doesn't exist at .../chrome-linux" — and you only find out after 20 minutes of running.
- **Turn tracing/video on in the container**: the image includes ffmpeg, so {{setRecordVideoDir}} works; a plain {{ubuntu}} image is missing the codecs and is missing {{libnss3}}/{{libatk}} — Playwright then reports browser-startup errors that are very hard to read.
- **Merge the results before building the report**: each shard only holds part of the {{allure-results}}. You must upload the artifact **with {{if: always()}}** (otherwise the artifact fails along with the report step), download everything in a later step, merge it, and only then run {{allure generate}} — otherwise the report contains 1/4 of the tests.

Jenkins uses {{parallel}}/{{matrix}} in a declarative pipeline with the same idea: one container per {{matrix}} branch, and a {{post}} block with an {{always}} condition to collect the reports.

### Selenium Grid 4 — for comparison, not as a default choice
**Selenium Grid** is a service standing between the test and the browser: the test sends a request "give me a Chrome", the Grid places it on a **node** (a machine with Chrome + chromedriver) through the **Distributor**, while the **Router** does the routing. Grid 4 runs as a single {{selenium-server}} process (or {{hub}} + {{node}}), and has {{SessionRequest}}, {{NodeSelector}}, and the ability to pin by capability.

| Aspect | Playwright + sharding in CI | Selenium Grid 4 |
|---|---|---|
| Who allocates the browsers | each test/job launches its own on its own machine | the Grid allocates centrally, the test only asks for a session |
| Infrastructure cost | 0 (use the runners you already have) | you must feed hub + nodes, upgrade them, watch their health |
| Parallelism | per your threads/jobs | per the number of slots you open on the nodes |
| Video/trace | built-in (ffmpeg, trace zip) | you have to write it yourself |
| Use it when | cloud CI, medium and large suites, single-stack team | several teams share one browser/desktop fleet, you must test on a specific OS/version machine, legacy stacks |

Many Vietnamese companies still use Grid because Selenium has been around for a long time and because they want QA to run Windows desktop tests on real nodes. When an interview asks "Grid or sharding?", a good answer is: "Grid solves the **centralized resources and multi-platform** problem; sharding solves the **run time** problem. Modern CI usually picks sharding + containers, because nobody wants to maintain extra infrastructure."

### Splitting shards by duration: the LPT algorithm
Splitting evenly by **count** is wrong, because test durations differ by 20x: {{CheckoutFlowTest}} takes 90 seconds while {{HomeBannerTest}} takes 4 seconds. 100 tests split into 4 shards are equal in count, but the shard holding the heavy tests runs 25 minutes while the light one finishes in 6 minutes — you still have to **wait 25 minutes**, and the other three machines sit idle (makespan = the duration of the slowest shard, and that is exactly what we want to minimize).

**LPT (Longest Processing Time)** — a simple greedy algorithm with a guarantee: the makespan is at most 4/3 of the optimum.

~~~text
durations: A 50s, B 40s, C 30s, D 25s, E 20s, F 5s     shards = 2

1) sort descending by duration: A B C D E F
2) take each test and drop it into the shard that is currently LIGHTEST (smallest accumulated load); on a tie choose the lower index

  A -> S1            S1=[A]        load S1=50  S2=0
  B -> S2            S2=[B]        load S1=50  S2=40
  C -> S2            S2=[B,C]      load S1=50  S2=70
  D -> S1            S1=[A,D]      load S1=75  S2=70
  E -> S2            S2=[B,C,E]    load S1=75  S2=90
  F -> S1            S1=[A,D,F]    load S1=80  S2=90

makespan = 90 (compare splitting by count A,B,C | D,E,F, which gives 120)
~~~

You need **historical duration data**: take it from JUnit XML (each {{<testcase time="4.7">}}) or from the CI report, accumulated as a rolling average over the last 10 runs so that one abnormal run cannot skew it. Tests that have no history yet: give them a default value (the median of the suite), do not give them 0 — otherwise they all pile up into one shard.

### Common failures in production
- **Turning on parallel while the tests still depend on each other** → the suite goes red every night in a random order, everyone loses trust in it and turns parallelism off. Always run {{-DforkCount}} on a separate branch and compare the result with the sequential run before merging.
- **One shared test account for every thread**: two workers change the password of the same user at the same time → both fail. Accounts must be private, or use a **read-only** account type.
- **Splitting shards by {{index % total}} over an unsorted list**: inserting one test in the middle of the list reshuffles the whole distribution and changes the contents of every shard → you lose the ability to say "shard 2 was red, why". Split by **duration** and by sorted name, so the result is deterministic.
- **Forgetting that every shard runs {{@BeforeAll}} DB seeding**: 4 shards x 2000 inserted rows = the DB dies or you get duplicate keys. Seed once in a separate job ({{needs:}} in GH Actions), or seed idempotently ({{ON CONFLICT DO NOTHING}}).
- **Too many browsers for /dev/shm**: the default container gives {{/dev/shm}} 64 MB; Chromium crashes with a mysterious "out of memory". The fix: run the container with {{--shm-size=1g}} (in GH Actions: {{options: --shm-size=1g}} for a service, or configure the container).
- **Using retries to balance the shards**: it sounds funny but it happens often, because the heavy test fails on the slow shard. Fix the split data, do not fix the retry count.
- **Not limiting the concurrency of API tests**: 16 threads hit staging at 200 requests/second → rate limit 429, and you think it is an application bug.

### Interview connections
- "Your UI suite takes 2 hours, how do you get it down to 20 minutes?" → answer in order: (1) cut the tests that are not worth keeping and push them down to the API layer, (2) turn on parallel in one machine with driver-per-thread, (3) shard by historical duration into M jobs, (4) re-measure the makespan and tune the number of shards. Mention the numbers and the **cost**: 4 jobs x 16 minutes of CI versus 1 job x 53 minutes.
- "How do you split the shards evenly?" → describe LPT, say why splitting by count is wrong, and name the source of the duration data.
- "Does Playwright have {{--shard}}?" → the Node.js edition does; with the Java edition you split yourself (class filter/tag/forkCount) and you should remember that **a Browser cannot be shared between threads**.
- "And Selenium Grid?" → compare as in the table above, and state clearly when Grid wins (multi-platform, shared infrastructure, desktop apps).

> Senior tip: before adding machines, **cut the duration of the slowest test**. A 4-shard suite where each shard takes 20 minutes, but the slowest test in that shard takes 18 minutes (one E2E "place order + wait for approval + reconciliation" test that merges three flows) — buying three more machines still gives you **18 minutes**, because the makespan is decided by a single test; that is the "longest plank" effect. The dashboard symptom: p50 shard time is 8 minutes but p95 is 22 minutes. In that case the job is to split the test, not to add shards.`,
    exercises: [
      {
        title: 'Sharder: split the suite into N shards with LPT, compute the makespan and the lower bound',
        prompt: `Write {{Sharder}}, a simulation of the shard splitter that CI calls before starting the jobs. The input is the **historical duration** of each test (in seconds); the output is a **completely deterministic** split — the same input must give the same result, even when the map's element insertion order differs. No random, no reading the real clock, no parallelism.

**1) {{static List<List<String>> split(Map<String, Long> durations, int shards)}}** — the LPT algorithm:
- {{durations}} maps test name → number of seconds. The result is a list of exactly **{{shards}}** shards (a shard may be empty); each shard is a list of test names in **the order they were assigned**.
- Sort the tests: **duration descending**; two tests with the same duration are ordered by **name ascending**, using the natural order of strings ({{compareTo}}).
- Assign each test of the sorted list, in turn, to the shard with the **smallest current total duration**; if several shards tie for lightest, pick the shard with the **smallest index**.
- {{shards <= 0}}: throw {{IllegalArgumentException}}.
- {{durations}} being {{null}} or empty: return {{shards}} empty lists, do not throw.

Example with {{a=5, b=3, c=2, d=2}} and {{shards = 2}}:

~~~text
descending order: a(5), b(3), c(2), d(2)   (c ties with d, so c comes first)
a -> shard 0            [a]      load 5 | 0
b -> shard 1            [a] [b]  load 5 | 3
c -> shard 1            [a] [b,c] load 5 | 5
d -> shard 0 (tie on load -> smallest index)  load 7 | 5
result: [[a, d], [b, c]]
~~~

**2) {{static long makespan(List<List<String>> plan, Map<String, Long> durations)}}** — the **largest** total duration among the shards (this is exactly the time CI has to wait). Accumulate with {{durations.getOrDefault(name, 0L)}}: a foreign name that is not in the map counts as 0. An empty {{plan}} or a {{null}} {{durations}} returns 0.

**3) {{static long lowerBound(Map<String, Long> durations, int shards)}}** — the theoretical lower bound of the makespan: no split can be more even than {{max(largest duration, ceil(total / shards))}}. Round up with integer arithmetic ({{(total + shards - 1) / shards}}). {{durations}} null/empty returns 0; {{shards <= 0}} throws {{IllegalArgumentException}}.

Traps to watch for: (a) if you sort by iterating the map and comparing with {{>}} without a tie-break rule on the name, the result depends on the order of {{put}} — CI will then be unable to explain why shard 3 was red yesterday and shard 1 is red today; (b) if you split evenly by **number of tests**, one 90-second test makes the whole shard take 20 minutes.`,
        hints: [
          'Dump the map keys into a {{List<String>}} and sort **once** with {{sort}} using a two-level comparator (duration descending, then name ascending). Everything else only walks the sorted list — that is what makes the result independent of the order of {{put}}.',
          'Keep a {{long[] load = new long[shards]}} array so you know which shard is currently lightest. Find the minimum with a loop starting at index 1, switching only when {{load[i] < load[lightest]}} (**strictly less**) — using {{<=}} picks the largest index on a tie, which breaks the requirement.',
          'Return exactly {{shards}} elements even when there are fewer tests: create the empty lists right at the start, do not create only the shards that end up receiving tests.',
          '{{lowerBound}} has two components: the longest test cannot be "sawn in half", so the makespan is at least as large as it; and on average each shard must carry {{ceil(total/shards)}}. Round up with {{(sum + shards - 1) / shards}}, do not use double division.',
          'Check {{durations}} for null in **all three** methods: CI may call {{lowerBound}} on a suite that has no duration data yet, and a {{NullPointerException}} in the pipeline-generation step leaves the whole team waiting.',
        ],
        explain: `The two tie-break rules are what makes the algorithm deterministic, and they are not decoration. **Tie on duration → order by name**: if two tests both take 30 seconds and you let the map iteration order decide, then {{HashMap}} on two different JVMs can produce two different orders, which means two CI runs split the shards differently — a flaky bug becomes impossible to reproduce. **Tie on load → smallest index**: when two shards are both empty (at the start of the algorithm), using {{<=}} makes the first test land in the last shard, and you end up with {{shards - 1}} empty shards plus one shard that contains everything.

Why LPT rather than an "absolutely even split" (the partition problem — NP-hard, needs DP/branch-and-bound)? Because CI needs the result in milliseconds and needs it to be **easy to explain when someone else reads it**. Greedy LPT costs only O(n log n) and carries a classic guarantee: its makespan does not exceed 4/3 of the optimal makespan (7/6 with two machines). You almost never lose 30% because of the way you split; you lose 30% because a 90-second test sits in the same shard as three 60-second tests.

{{makespan}} is the **only** number worth putting on a dashboard when you add machines: if you add shards and the makespan does not drop, you have hit the ceiling — either because one test is too long, or because the number of shards already exceeds the number of heavy tests. That is why this lesson also asks you to compute {{lowerBound}}: the distance between the actual makespan and the lower bound tells you **how many metres are left** to squeeze. In the {{WIDE}} example the lower bound of 80 equals the LPT result exactly, so buying more machines would only make the run longer without making it any faster.

{{lowerBound(WIDE, 3)}} = 60 illustrates the other half of the expression: when one test is too long compared with the average, **that test decides the lower bound**, and adding shards is useless. The real CI lesson: 6 shards that each take 20 minutes because every shard contains one 18-minute test — you must split the test, not add shards.

Common mistakes on this exercise: (1) sorting over the {{entrySet}} with {{Comparator.comparingLong(d -> d.get(name))}} and forgetting the tie-break-by-name branch; (2) returning {{min(shards, testCount)}} shards — that breaks the requirement of "exactly {{shards}} elements"; (3) rounding with {{Math.ceil((double) sum / shards)}} and forgetting that floating-point numbers can be off by one unit; (4) computing {{makespan}} by summing over the indexes of {{plan}} without handling foreign names, so a test that was removed from the map but is still in an old plan inflates the number.`,
      },
    ],
    check: [
      {
        q: 'A suite of 600 tests split into 4 shards that are equal **by count** still runs 40 minutes, while the average shard takes 15 minutes. Which conclusion is most correct?',
        options: [
          'You need a fifth shard',
          'The makespan is decided by the shard holding the heaviest tests — you must split by historical duration',
          'You need to turn parallelism off inside each shard',
          'You need to increase the Playwright timeout',
        ],
        explain: `The pipeline duration equals the time of the **slowest** shard, not the average. Splitting by count ignores the fact that tests differ by 20x in duration. LPT over the {{time}} data from JUnit XML solves the actual problem; adding shards in that situation only spends CI money without shrinking the makespan.`,
      },
      {
        q: 'Why does {{junit.jupiter.execution.parallel.mode.default = concurrent}} easily break a Playwright UI-test suite?',
        options: [
          'JUnit does not support running in parallel, so the flag is ignored',
          'It lets the @Test methods inside one class run on several threads; if the class holds Page/BrowserContext as fields, multiple threads operate on the same non-thread-safe object',
          'It forces every test to share one Browser',
          'It makes @BeforeEach stop running',
        ],
        explain: `Playwright (and WebDriver) is only safe when one page is touched by one thread. Concurrent mode turns instance fields into state shared between threads. The safer setup: enable {{mode.classes.default = concurrent}} but keep {{mode.default = same_thread}}, or hand out the Page per test through an extension/ThreadLocal and create a new Context for each test.`,
      },
      {
        q: 'How should the tag of the Docker image {{mcr.microsoft.com/playwright/java}} be pinned?',
        options: [
          'Use {{:latest}} so you always have the newest browsers',
          'Pin the exact version that matches the com.microsoft.playwright:playwright artifact version in the pom',
          'Pinning the operating system name is enough, for example {{-noble}}',
          'No pinning needed, because Playwright downloads the browsers when the tests run',
        ],
        explain: `Playwright embeds the browser binaries for the exact library version, and the image contains the browsers for one specific version. A version mismatch produces the "Executable doesn't exist" error. {{latest}} also makes the suite change behaviour between two nights without anyone pushing anything. The {{--with-deps}} flag (or an image that already ships the dependencies) covers the system dependencies, but the version still has to match.`,
      },
      {
        q: 'Which of the following tests **should not** run in parallel with the other tests?',
        options: [
          'A test that opens the home page and checks the banner',
          'A test that calls the product-category API only to read',
          'A test that drops and recreates the whole sample-data schema in the staging DB',
          'A test that checks the layout of an already generated PDF invoice',
        ],
        explain: `Seeding/resetting the schema touches a shared resource: while that test is dropping tables, every other test reading the same DB fails for no reason. JUnit 5 handles this with {{@ResourceLock("shared-db")}} so that group runs one at a time, instead of turning parallelism off for the whole suite.`,
      },
    ],
  },
});
