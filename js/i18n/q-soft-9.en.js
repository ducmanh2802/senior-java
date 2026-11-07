/*
 * English translation of js/data/q-soft.js — task T674. Format: js/core/i18n.js (content overlay).
 * ids: testing-031 testing-032
 */
App.i18n.content({
  'testing-031': {
    q: 'How do you introduce performance testing into the CI of a 15-dev team (what runs on each PR, what runs nightly, where do you block merges)? When reading p95/p99, what interpretation mistakes are common, and how do you organise baseline + dashboards?',
    a: `**Summary:** Do not run a "30-minute perf test" on every PR. The strategy that works in a large team is **three tiers**: a few-minute perf smoke on each PR with thresholds **relative** to a baseline, a canonical benchmark when merging to main, and long soak/capacity runs before a release (which do not block merges). On the numbers: p95/p99 only mean something when **the sample is large enough, the environment matches production in data and resources, and you use an open model (arrival rate)**. The baseline is a file committed in the repo; report changes as a % against the baseline, never as absolute numbers.

### Three tiers in the pipeline
| Tier | When to run | Duration | Threshold | Block merge? |
|---|---|---|---|---|
| Perf smoke | every PR | 2–5 minutes, low load | catch gross faults: p95 > 1.2× baseline, errors > 0.5% | yes, but with slack |
| Canonical benchmark | every merge to main | 10–20 minutes | p95 > 1.1× baseline ⇒ alert; > 1.5× ⇒ open an incident | no (already merged to main) |
| Soak / spike / capacity | weekly, before release | 2–8 hours | memory leaks, load limits, behaviour under autoscaling | no |
The PR smoke only answers "did someone just add a query inside a loop"; it does not measure the system's capability. It runs on a CI machine smaller than production, so it can **only be compared against itself**.

### Baseline and dashboard
- Each service has a {{perf/baseline.json}} committed in the repo: {{p50, p95, p99, rps, errorRate, dbCpu, gcPause}} from the most recent canonical run, along with the commit and date.
- Every run writes its results to a store (Grafana/InfluxDB, or JSON artifact files + a static dashboard). The trend line over time matters more than any single number.
- **Reset the baseline** when a deliberate change lands (add an index, change the JVM, change data size) and record the reason in the commit — otherwise everyone interprets it their own way.
- Statistical rules: discard the first 1–2 minutes of warm-up (JIT, cold cache), take **the p95 of the whole run**, do not take the prettiest value out of three runs.

### Four percentile interpretation mistakes (the part that shows depth)
1. **Averaging percentiles**: taking the p95 of 5 nodes and averaging them is **not** the global p95, and it always comes out lower than reality. Merge the histograms (HDR form) and recompute. With Prometheus, run {{histogram_quantile}} over buckets that have been summed; never sum quantiles.
2. **Sample too small**: a p99 from 500 requests rests on the last 5 data points — its variation is pure noise. A stable p99 needs tens of thousands of samples.
3. **Coordinated omission**: if every "user" waits for the response before sending the next request, then when the system slows down, that very slowness reduces the number of requests sent — the metrics look **better than reality**. The fix: an open model driven by **arrival rate** (k6 {{ramping-arrival-rate}}, Gatling {{injectOpen}}/{{constantUsersPerSec}}).
4. **Comparing two runs on different environments or different data**: 500 rows vs 10 million rows are not the same problem.

### Example Gatling scenario (Java DSL)
~~~java
class OrderApiBenchmark extends Simulation {
    HttpProtocolBuilder httpProtocol = http.baseUrl("http://api.internal");
    ScenarioBuilder scn = scenario("order-read")
        .exec(http("get order").get("/api/orders/1001").check(status().is(200)));
    {
        setUp(scn.injectOpen(constantUsersPerSec(50).during(Duration.ofSeconds(180))))
            .protocols(httpProtocol)                    // open model driven by arrival rate, no manual pauses inserted
            .maxUsers(200);                             // cap on concurrent users on the load-generator machine
    }
}
~~~
(This is the Java DSL of Gatling 3.x; re-check the docs for the exact version you use. Gatling also has **global assertions** in {{setUp}} that fail the run when a threshold is broken — convenient for a CI gate.) In CI, run it in a container with a **CPU limit equal to production**, the app with the same JVM flags, and the same data snapshot.

### Five environment rules
- Data of **the same size** as production (including the distribution: 10% of customers account for 60% of orders).
- The same number of instances, with autoscaling disabled during the measurement — otherwise you are measuring the scaling algorithm itself.
- The same instance type / CPU limit / GC / JVM version.
- A **separate** perf environment, not a DB shared with the QA environment (QA traffic pollutes the numbers).
- Turn on profiling when you need to localise the fault (JDK's JFR, async-profiler) — a perf test tells you **that** it is slow, a flamegraph tells you **where** it is slow.

### Organising at team scale
| Task | Who |
|---|---|
| Scenarios + baseline for their own service | feature team, as part of the feature |
| Environments, sample data, CI jobs | platform/devex team |
| Approving the "perf budget" (target p95 per API) and SLOs | lead + product |
| Investigating a regression when the benchmark goes red | the author of the suspect commit + the reviewer |
The rule: every service has **one target-p95 table** shown on the dashboard; adding a new API means declaring its SLO before merge, not after the fire.

### Traps
- Blocking merges with an **absolute threshold** (p95 < 300 ms) ⇒ the CI runner changes hardware and the whole team is stuck; block with **relative** numbers instead.
- One perf expert owning all the tests (bus factor) ⇒ it never scales.
- Measuring on a small environment then **extrapolating** to production by machine ratio — usually wrong because the bottleneck (DB, connection pool) does not scale linearly.
- Pretty metrics caused by a cache that never goes cold: always have a warm-up phase before you measure.
- Reporting "p99 = 250 ms" without stating how many requests, how many rows of data, and what machine.

> Senior tip: the sentence that builds credibility in this area has **three numbers and one mechanism**: "adding an index on (status, created_at) for the order-list query cut p95 from 1.9 seconds to 210 ms at 800 RPS, DB CPU from 78% to 23%". And when you must defend the budget for the soak tier (the most expensive one), reduce it to failure cost: "each congestion during a flash sale loses roughly X orders in 20 minutes; one hour of perf environment per week is far cheaper".`,
    follow: [
      'When CI runners fluctuate heavily, how do you decide which threshold is "red enough to block a merge"?',
      'How do you detect a performance regression caused by one specific PR when benchmarks only run on main?',
      'For an event-driven system (Kafka), how do you measure end-to-end latency and consumption lag?'
    ],
  },
  'testing-032': {
    q: 'You are handed a 15-dev team: the pipeline takes 25 minutes, production bugs keep rising, and most of the testing is manual E2E. How do you build a test strategy and quality gates from that current state, and what numbers do you use to report to management?',
    a: `**Summary:** A test strategy **does not start with "recommend 80% coverage"** but with diagnosing the team's own numbers: which tier the bugs of the last 6 months came from, how much the pipeline costs, what the flake rate is, which code regions change the most. Then come three short documents (test-writing standard, tiering, gates) plus a **two-quarter behaviour-change program**, rolled out by risk area, with gates ramped up gradually. Report to management in terms of production defect cost and DORA, not in terms of test counts.

### Step 0 — diagnose (2 weeks, no code changes)
| Question | Data source |
|---|---|
| Which tier do the bugs come from? | 6 months of incidents/post-mortems, classified: logic / HTTP mapping / SQL / configuration / integration |
| How much is the pipeline costing? | CI: p95 duration of each job, number of jobs failing for non-code reasons |
| Who is writing tests, at which tier? | git: ratio of test files per module, and who the authors are |
| Which code changes a lot and causes many defects? | {{git log}} churn joined with tickets by module |
| How many days per release do tests/manual QA consume? | actual time spent by the manual testing group |
The diagnosis decides **the pyramid shape specific to your team**: if 60% of the bugs come from HTTP↔domain mapping and SQL, invest in slice tests + integration, not in writing more unit tests for the domain.

### Step 1 — a one-page standard (short, but actually used)
- **Definition of Done**: "every new behaviour has a test at the appropriate tier, with the tier stated in the PR"; "every production bug gets a regression test that reproduces it **before** the fix".
- **Tiering table by type of change**: pure business rule → unit; controller/validation/JSON → {{@WebMvcTest}}; query/constraint → {{@DataJpaTest}} + container; wiring, security, async → full context; business flow crossing services → thin E2E.
- **Technical conventions**: name tests after behaviour, AAA, shared test data builder, shared container base class, {{Thread.sleep}} forbidden, editing old tests to make them pass is forbidden.
- A template repo + an internal "toolbox" so none of the 15 people improvises their own.

### Step 2 — shared infrastructure (2 people build it, the whole team benefits)
- CI split by tier: lint → unit → integration → (nightly) contract/mutation → E2E smoke after deploy, each tier with a **time budget**; overall target under 10 minutes for a PR.
- Cache Docker images, parallelism + sharding, enable test history to measure flakiness per test id.
- A one-command test environment: DB seed + containers + profile, because without it nobody runs anything.

### Step 3 — rollout in three phases
| Phase | Duration | Content | Condition to enter the next step |
|---|---|---|---|
| 1. Stabilise | 4–6 weeks | clean up flakes, pipeline < 10 minutes, one single gate: no merge on a red build | the team no longer hits "rerun" by reflex |
| 2. Seed | 6–8 weeks | 2 core modules tested at the right tier, one "test champion" per subgroup, 2 workshops on real bugs | a mutation-score baseline + regression tests for production bugs exist |
| 3. Expand | next quarter | gates per risk area, contract tests between services, perf smoke in CI, demote manual E2E to automation | production bugs drop, QA moves to exploratory testing |
Do not go "all-in" across the whole company at once: 15 people changing habits simultaneously is the most common failure scenario.

### Step 4 — quality gates ramped up gradually (the "fixable in one work session" principle)
| Gate | Enable when | Starting threshold |
|---|---|---|
| Compile + unit pass | always | – |
| No merge while the pipeline is red | phase 1 | branch protection |
| **Delta** coverage for new/changed files | phase 2 | 60% at the unit+slice tier |
| Mandatory regression test for production bugs | phase 2 | a rule, not a % |
| Mutation score for core modules (nightly) | phase 3 | establish a baseline, then raise it gradually |
| Contract verify + {{can-i-deploy}} | once there are ≥ 2 dependent services | blocks deployment |
| Dependency + image + secret scan | always (cheap) | any high-severity finding blocks |
Any gate that a dev cannot figure out how to fix within one session will be circumvented — the tell-tale sign is PRs that "temporarily disable" it.

### Step 5 — sustain the behaviour (the decisive part, and the one most often skipped)
- The review checklist has an item "which tier is the test at"; the reviewer names the tier instead of just saying "add a test".
- Reserve **10–15% of capacity each quarter** for test debt, tracked as a measurable epic (not "side work").
- Pair on flake fixes; a flake caused by code belongs to the code's author, one caused by infrastructure belongs to the platform team.
- Onboarding: a "write your first test in 30 minutes" doc + a small graduation PR.
- **No** individual KPIs based on test counts or coverage — the origin of garbage tests.

### Numbers to report to management
| Metric | How to measure | What it lets you say |
|---|---|---|
| Change failure rate | share of deploys that cause an incident (DORA) | test quality is directly tied to money |
| MTTR + hotfix hours per month | incidents | converts defect cost into labour hours |
| Pipeline p95, flake rate | CI | speed and trustworthiness of the pipeline |
| PRs stuck more than 1 day because of tests | CI + review | the hidden cost of missing tests |
| Production bugs per month broken down by tier | incidents | confirms the investment is going to the right place |

### Traps
- Buying tooling before having standards (Sonar, Pact Broker, k6), then letting it gather dust because nobody owns it.
- Imposing one coverage threshold company-wide ⇒ teams write DTO tests just to hit the number.
- Cutting E2E because it is "slow" without replacing it with tests in the tier below ⇒ you lose the last layer of protection.
- A 40-page strategy nobody reads; a usable standard is 1 page + templates in the repo.
- A single person who understands the entire test infrastructure ⇒ it neither scales nor survives.

> Senior tip: the strongest argument to management is not "clean code" but **the economics of defects**: "change failure rate 18%, each incident costs about 6 person-hours ⇒ roughly X labour hours per quarter; invest one engineer for one quarter in test infrastructure and flakes to bring it down to 8%". At the same time, proactively state the limits: "the gates will slow merge throughput for about the first 2 weeks, in exchange for a pipeline people trust". A lead speaks in trade-offs and in numbers, not in principles.`,
    follow: [
      "The team pushes back (\"testing is QA's job\") — do you handle it with process or with concrete examples?",
      'How do you convince product to give 15% capacity for test debt when the roadmap is already full?',
      'After 2 quarters, what signs tell you this strategy has failed and needs a change of direction?'
    ],
  },
});
