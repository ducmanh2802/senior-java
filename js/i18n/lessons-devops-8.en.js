/*
 * English translation of js/data/lessons-devops.js — task T704. Format: js/core/i18n.js (content overlay).
 * ids: lesson-devops-011
 */
App.i18n.content({
  'lesson-devops-011': {
    title: "Automated canary analysis: comparing baseline with canary on error rate and p95, relative + absolute thresholds, PROMOTE/CONTINUE/ROLLBACK",
    goals: [
      "Tell canary **routing** (splitting traffic) apart from canary **analysis** (a machine compares the numbers of the two groups and then decides)",
      "Design the decision set: an absolute ceiling, a relative threshold against the baseline, an absolute floor so you never divide by zero, and a minimum sample count",
      "Explain why too few requests must give CONTINUE rather than ROLLBACK, and why the evidence has to grow with the rollout step",
      "Implement {{CanaryJudge.decide(baseline, canary, step)}} and run a multi-step rollout with {{rollout}}",
    ],
    body: `### Where canary routing stops and canary analysis begins
Lesson {{lesson-devops-003}} taught the **routing** half: pushing {{10}}% of traffic to the new build using a stable hash of {{userId}}, and killing the release when the error rate crosses one fixed threshold. The **analysis** half — the thing Flagger/Argo Rollouts actually do — is subtler: it **compares two groups at the same moment** (named {{baseline}} = the old build taking {{90}}% and {{canary}} = the new build taking {{10}}%) over the same time window, then returns one of three decisions:

- {{PROMOTE}} — the signals are good, move up to the next step ({{10}}% → {{25}}% → {{50}}% → {{100}}%).
- {{CONTINUE}} — **no conclusion yet**, keep the same %, wait for the next cycle. This is not a failure, it means "not enough evidence yet".
- {{ROLLBACK}} — the signals are bad, drop to {{0}}% immediately (the old build is still running, so a rollback is only a weight change, far faster than redeploying).

~~~seq
title: Automated canary analysis inside one cycle
actors: Gateway | Stable | Canary | Prometheus | Analyzer
Gateway -> Canary: 10 percent of traffic routed by userId
Gateway -> Stable: the remaining 90 percent of traffic
Canary --> Prometheus: error rate and p95 labelled with version
Stable --> Prometheus: same metrics, same time window
Analyzer -> Prometheus: query canary against baseline
Prometheus --> Analyzer: two time series already aligned
Analyzer -> Analyzer: check minimum samples then compare thresholds
Analyzer -> Gateway: PROMOTE 25, CONTINUE, or ROLLBACK 0
note Analyzer..Gateway: rollback is always automatic, promote needs enough evidence
~~~

### The three numbers you must have, and what each one means
- **error rate** = failed requests / total requests inside the window (usually 1-5 minutes). You have to keep {{5xx}} apart from {{4xx}}: a client sending bad data is not your regression.
- **p95 latency**: sort every response time in the window and take the value at position 95%. **p50** means "half of the requests are faster than this" (what the majority actually feels), while **p95/p99** catch the long tail: a new build that adds {{synchronized}} or one N+1 query only makes the slow group worse, and p50 still looks fine. Use p95, because it is more stable than p99 when the sample is small.
- **request count (samples)**: this is what decides whether the two numbers above mean anything at all.

### Why you must compare against a baseline instead of using an absolute threshold alone
An absolute threshold on its own has two classic bugs:
1. Your service **already** runs at a 3% error rate because some partner times out often. A canary at 3.2% "exceeds the 2% threshold" → rollback wrongly, even though the new build is no worse than anything.
2. The opposite: an absolute threshold of 5% is far too generous. Baseline 0.1%, canary 4% is forty times worse yet still "safe" → 100% of traffic receives the broken build.

That is why a modern decision set is always a **pair**: an absolute ceiling (protection against a disaster) and a relative threshold measured against the baseline (catches real regressions).

### Why a relative threshold alone also breaks: the absolute floor
If the baseline error rate is {{0}} (a quiet night, nothing failed at all), then {{1.5 x baseline = 0}} — the canary needs a **single** failed request to "exceed the relative threshold" and get killed. Dividing by zero is the most common design bug in a hand-rolled canary. So the relative comparison only makes sense once the canary has also passed a small **absolute floor** (for example {{1}}% errors, {{120}}ms p95). That floor is exactly "the level I accept no matter how good the baseline is".

The rule set of {{CanaryJudge}} (applied to both error rate and p95):
{{breach = (canary > CEILING && baseline <= CEILING) || (canary > FLOOR && canary > REL_FACTOR x baseline)}}

- {{CEILING}}: the absolute ceiling. A canary above it is a suspect right away — **but only while the baseline is not above it**, because you must not punish the canary for an illness the old build already had.
- {{FLOOR}}: the absolute floor that keeps the relative comparison from dividing by zero.
- {{REL_FACTOR}}: the relative factor; 1.5 is the commonly used level (canary 50% worse than the baseline).

A numeric example, with {{REL_FACTOR = 1.5}}, error {{FLOOR = 1}}%, {{CEILING = 5}}%:

| baseline | canary | Absolute ceiling? | Relative? | Verdict |
|---|---|---|---|---|
| 0.2% | 0.5% | no (0.5 < 5) | no (0.5 < the 1% floor) | good, PROMOTE |
| 0.2% | 1.5% | no | yes (1.5 > 1% and > 0.3%) | ROLLBACK |
| 0% | 0.4% | no | no (below the floor) | PROMOTE — a few errors are not evidence yet |
| 9% | 10% | no (the baseline is already above the ceiling) | no (10 < 13.5) | PROMOTE — the canary is no worse than the baseline |
| 1% | 8% | yes | yes | ROLLBACK |

### Minimum sample size: the statistics part the interviewer wants to hear
An error rate is an **estimate from a sample**, not a fact. With {{n}} requests and a true error rate {{p}}, the standard deviation of the error rate you observe is approximately {{sqrt(p(1-p)/n)}}. With {{p = 0.01}}:
- {{n = 20}}: margin of about 2.2% — meaning observing 0% and observing 5% are both perfectly normal. Any conclusion you draw is a guess.
- {{n = 200}}: margin of about 0.7%.
- {{n = 1000}}: margin of about 0.3% — only then is "canary 1.2% versus baseline 0.4%" actual evidence.

Rule of thumb: you need enough samples to **expect to see at least a few errors** if the true error rate equals the threshold; and p95 always needs a bigger sample, because it is taken from the tail of the distribution. That is why the decision set must require {{MIN_SAMPLES}} for **both sides** (if the baseline is short of samples there is nothing to compare against either).

### The minimum sample count has to grow with the rollout step
The logic you need to be able to say out loud in an interview: the {{10}}% step is a cheap experiment, being wrong there costs {{10}}% of traffic; the {{100}}% step bets everything. So the evidence you demand must climb together with the blast radius. In the exercise, {{requiredSamples(step) = MIN_SAMPLES x max(1, ceil(step / 25))}}: {{10}}% and {{25}}% need {{100}} samples, {{50}}% needs {{200}}, {{100}}% needs {{400}}. Until the sample count is reached, the only correct conclusion is {{CONTINUE}} — absolutely not {{PROMOTE}}, and even less {{ROLLBACK}}.

~~~java
// the comparison skeleton: three beats, in exactly this order
Decision decide(Metrics base, Metrics can, int step) {
    long need = requiredSamples(step);
    // not enough samples yet: conclude nothing, even if the numbers look terrible
    if (can.requests < need || base.requests < need) return Decision.CONTINUE;
    if (breach(base.errorRate, can.errorRate, ERR_CEILING, ERR_FLOOR)) return Decision.ROLLBACK;
    if (breach(base.p95Millis, can.p95Millis, LAT_CEILING_MS, LAT_FLOOR_MS)) return Decision.ROLLBACK;
    return Decision.PROMOTE;
}
~~~

### Production traps you will really hit
- **Rolling back because of too few samples**: 12 requests, 3 errors = a 25% error rate → you kill the release at 2am. The sampling error (the table above) explains why that behaviour is wrong.
- **Comparing windows that are not the same**: taking the canary's last 5 minutes and comparing it with the baseline's "last week". Night traffic differs from daytime traffic and users come from different segments; you must compare **two groups running in parallel at the same time**.
- **Forgetting JVM warm-up**: the canary has 3 brand-new Pods, and in the first minute JIT/Spring boot make p95 three times higher → a rollback that is not the new build's fault, exactly the HPA trap. Fix it: wait for {{minReadySeconds}} and gate the start of the analysis cycles on warm-up finishing, or give the first few cycles a lower weight.
- **Metrics with no version label**: if Prometheus only has the combined error rate, a canary failing at 10% only lifts that combined number by 1%. Every metric/trace/log must carry a {{version}} label or an {{X-Version}} header attached by the gateway.
- **Changing the % mid-flight changes the user set**: if routing uses random instead of a stable hash, then raising {{10}}% to {{25}}% swaps which users are inside the group, so the numbers of the two steps cannot be compared with each other and users jump version in the middle of a session.
- **One metric that lies**: the canary lowers the error rate but raises p95 because it... retries more. You have to watch both at once and require a **run** of passing checks ({{consecutiveSuccess}}), not one pretty cycle.
- **No way for a human to stop it**: there must always be a "pause/abort" button and a manual gate at the {{50}}% or {{100}}% step for services that touch money, because the machine does not know today is settlement day.

### Interview notes
A common question: "How do you automate the promote/rollback decision, and when does it give the wrong answer?" — answer: compare the canary with the baseline **over the same window** on error rate (keeping {{5xx}} apart from {{4xx}}) and on p95, use a **pair** of absolute + relative thresholds, require a minimum sample count on both sides that grows with the blast radius; false positives come from small samples, unfinished warm-up, or dividing by a baseline of 0; false negatives come from metrics without a version label, a window so long it dilutes the incident, or canary users who are not representative (nothing but light users). Being able to name **both directions of error** is the sign of someone who has really operated a canary.

> Senior tip: Make {{CONTINUE}} a bounded state, not an unbounded one: for example at most 5 CONTINUE cycles and then a rollback for being blind to the data — a canary parked at 10% for hours is a disguised incident, because you are running two versions in parallel on a shared schema and nobody is watching any more.`,
    exercises: [
      {
        title: "CanaryJudge: decide(baseline, canary, step) and simulating a 10/25/50/100 rollout",
        prompt: `Implement the canary decision engine. {{Decision}} and {{Metrics}} are already provided ({{Metrics}} throws {{IllegalArgumentException}} when {{requests < 0}}, when {{errorRate}} is outside {{0..1}}, or when {{p95Millis < 0}} — you do not need to change it).

Constants already present in {{CanaryJudge}}: {{MIN_SAMPLES = 100}}, {{ERR_CEILING = 0.05}}, {{ERR_FLOOR = 0.01}}, {{LAT_CEILING_MS = 500.0}}, {{LAT_FLOOR_MS = 120.0}}, {{REL_FACTOR = 1.5}}.

- {{requiredSamples(step)}}: throw {{IllegalArgumentException}} when {{step < 1}} or {{step > 100}}; return {{MIN_SAMPLES x max(1, ceil(step / 25.0))}} — the evidence must grow with the blast radius.
- {{decide(baseline, canary, step)}}: throw {{IllegalArgumentException}} when either of the two {{Metrics}} is {{null}}. Then:
  1. If {{canary.requests < requiredSamples(step)}} **or** {{baseline.requests < requiredSamples(step)}} → return {{CONTINUE}} (not enough samples, however bad the numbers look).
  2. If there is a breach on error rate **or** on p95 → return {{ROLLBACK}}.
  3. Otherwise → {{PROMOTE}}.
- {{breach(baseline, canary, ceiling, floor)}} (a private helper used by both metrics): return {{true}} when {{canary > ceiling}} and {{baseline <= ceiling}}, **or** when {{canary > floor}} and {{canary > baseline x REL_FACTOR}}.
- {{rollout(baseline, canaryByStep, steps)}}: throw {{IllegalArgumentException}} when {{canaryByStep == null}} or {{steps == null}} or their lengths do not match. Walk the steps **in order**, calling {{decide}} for each {{(canaryByStep.get(i), steps[i])}} pair, accumulating the results into a list and **stopping immediately** when you meet a decision other than {{PROMOTE}} (a rollback or a wait). Return the accumulated list of decisions — a healthy rollout through 4 steps returns 4 {{PROMOTE}} elements.`,
        hints: [
          "Finish in this order: check the minimum sample count first, then check for breaches, then PROMOTE. While samples are missing you are not allowed to make any decision at all.",
          "requiredSamples: use {{Math.ceil(step / 25.0)}} (divide by the real number 25.0, not the integer 25) and then multiply by MIN_SAMPLES.",
          "breach is used for both error rate and p95: {{canary > ceiling && baseline <= ceiling}} is the absolute branch, {{canary > floor && canary > baseline * REL_FACTOR}} is the relative branch.",
          "rollout: use {{break}} as soon as the decision differs from PROMOTE, otherwise the test \"stops at the rollback step\" will see 4 elements instead of 2.",
        ],
        explain: `The three beats of {{decide}} are exactly how Argo Rollouts/Flagger write an {{AnalysisTemplate}}. Beat 1 (minimum samples) blocks the classic false positive: 3 errors out of 12 requests is a 25% error rate that still means nothing statistically. Beat 2 stacks **two threshold layers on top of each other**: the absolute ceiling catches disasters, the relative factor catches the regressions an absolute threshold would miss; both need a side condition — the absolute ceiling only gets to kill when the baseline has not crossed it (do not punish the canary for a pre-existing illness), while the relative comparison only gets to conclude when the canary also passes a small absolute floor (this is what stops "1.5 x 0 = 0" from turning one failed request into the culprit). Beat 3 raises the sample count with the step, because as the blast radius grows the evidence requirement has to grow too.

Mistakes commonly made while writing this:
- Forgetting to check the sample count of the **baseline**: with no data on the other side there is nothing to compare, but the code usually only looks at the canary.
- Using {{>=}} instead of {{>}}: sitting exactly on the threshold is not yet a breach; be consistent so the tests are not sensitive to round numbers.
- Dividing by the baseline without guarding {{baseline == 0}} → the rollout dies unjustly in the middle of the night, when traffic is low and the baseline is perfect.
- Treating {{CONTINUE}} as {{ROLLBACK}} (or the other way round): these two states differ in action, one waits, the other kills the release.
- {{rollout}} not stopping at the first decision that differs from {{PROMOTE}}, so a bad build still gets "promoted" at the later steps.

When you answer in an interview, speak in the three categories of failure: **false positive** (small sample, JVM warm-up not finished, baseline = 0, windows that do not line up), **false negative** (metrics missing a version label, a window so long it dilutes the incident, canary users who are not representative — only light users), and **operational safety** (rollback is always automatic, promotion to 100% should have a manual gate for services that touch money; migrations must be expand-contract so that a way back still exists).`,
      },
    ],
    check: [
      {
        q: "How does canary analysis differ from canary routing?",
        options: [
          "Analysis is splitting % of traffic; routing is writing the metrics",
          "Analysis compares the numbers of the two groups and then decides PROMOTE/CONTINUE/ROLLBACK; routing only decides which requests go to the new build",
          "They are the same thing",
          "Analysis is only used for blue-green",
        ],
        explain: "Routing decides the path of a request. Analysis is the observation machine: it compares the canary with the baseline over the same window and then issues the rollout decision.",
      },
      {
        q: "The canary only has 12 requests, 3 of them failed (25%). What should you do?",
        options: [
          "ROLLBACK right away",
          "CONTINUE: not enough samples to conclude anything",
          "PROMOTE, because the errors must come from the new build",
          "Double the traffic so you measure faster",
        ],
        explain: "With a small sample the margin of error of the error rate is very large (several %), so this is not evidence yet. Increasing traffic before you understand the cause only makes the outage bigger.",
      },
      {
        q: "Why do you need an absolute floor next to the relative threshold?",
        options: [
          "To catch the case baseline = 0: 1.5 x 0 = 0, so even one failed request \"exceeds the threshold\"",
          "To make rollback faster",
          "Because p95 is always larger than the error rate",
          "To lower the minimum sample count",
        ],
        explain: "The relative comparison divides by the baseline; a spotless baseline turns every tiny number into \"infinitely worse\". The floor states the level I accept regardless of the baseline.",
      },
      {
        q: "Why not punish the canary for crossing the absolute ceiling when the baseline has already crossed it too?",
        options: [
          "Because the absolute ceiling only applies to p95",
          "Because that is a pre-existing illness of the system, the canary did not create it; rolling back improves nothing",
          "Because the baseline is always right",
          "Because promotion has nothing to do with error rate",
        ],
        explain: "The goal of a canary is to detect **a regression caused by the new build**. If the baseline is already broken, killing the canary makes no user better off; you have to open an issue for the underlying condition.",
      },
    ],
  },
});
