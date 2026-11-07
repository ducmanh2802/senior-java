/*
 * English translation of js/data/lessons-devops.js — task T758. Format: js/core/i18n.js (content overlay).
 * ids: lesson-devops-013
 */
App.i18n.content({
  'lesson-devops-013': {
    title: "Analyzing access logs during an incident without a dashboard: errors per minute, top error endpoints, p95 nearest-rank",
    goals: [
      "Run an incident investigation workflow when you have nothing: bound the time, bound the scope, find what changed, reduce blast radius before hunting for the root cause",
      "Write a grep/awk/sort/uniq pipeline to count errors per minute, get the top error endpoints, and compute p95 latency from access logs",
      "Understand why you must compare the **error rate** instead of the absolute error count, and why p95 nearest-rank differs from the average",
      "Recognize the traps that corrupt your numbers: paths carrying ids, mixing 4xx with 5xx, retries skewing the sample, buckets that are too wide or too narrow, sort missing -n",
      "Implement {{AccessLogStats}}: parse fixed-format log lines, compute stats per minute, p95 per endpoint, and top error endpoints",
    ],
    body: `### When an incident explodes, the dashboard may be the one thing you do not have

A lot of senior/lead interviews ask exactly this: "Your service fails en masse at 2am, **the dashboard has not been set up yet** (new team, new service, or Grafana happens to be down for maintenance), what do you do?" The person who answers "open Kibana" is someone who has never had to find the numbers on their own. The real skill is: sit in front of a log file and **produce the three numbers** that the dashboard would have produced.

A five-step process, in exactly this order (do not move step 5 up before step 4):
1. **Bound the time**: from which minute did the errors start? Without a time anchor, every hypothesis is hopeless.
2. **Bound the scope**: all endpoints or one endpoint? all Pods or one Pod? one region, one large customer, or everyone?
3. **Find the change signature**: cross-check the timestamp from step 1 against the deploy schedule, config changes, feature-flag toggles, migrations, or changes at a partner. Most incidents are "something was just changed", so this step often points to the culprit on its own.
4. **Reduce blast radius** before understanding the root cause: roll back the new build, turn off the feature flag, increase the number of replicas, add a timeout/retry with a ceiling, or block the endpoint that is overloading the system. "Roll back, then investigate" is always the right risk-management move, because it buys time without requiring you to guess correctly.
5. **Root cause + prevention**: only after users are protected do you move to profiling, thread dumps, EXPLAIN, and reading code. End with a change that makes the incident **not recur** (tests, SLO-based alerts, guardrails in code).

### The three numbers you must be able to extract from logs

Every initial investigation comes down to three questions, and all three are **counting operations over access logs**:
- **Errors over time**: the 5xx rate of each minute → tells you when it started, whether it is still climbing or has already stopped.
- **Errors by location**: which endpoint accounts for the most errors, and does it also account for the most *traffic*.
- **Where it is slow**: p95 latency per endpoint, compared to a normal day.

The log line format used in this lesson (and a common self-defined format when writing access logs for an app):

~~~text
2026-05-04T10:15:32Z GET /api/orders 500 1240
   timestamp UTC     method  path   status  latencyMs
~~~

That is: 5 fields separated by whitespace, an ISO-8601 timestamp **with the letter Z indicating UTC**, latency measured in **milliseconds**. In practice you will encounter the nginx combined log (more fields, quoted, latency at the end if configured) and JSON-formatted app logs — so the first step of every investigation is {{head -3 access.log}}, read what the real log line looks like, and only then start counting.

### Errors by time window: count per minute, not cumulatively

~~~bash
# access.log: "2026-05-04T10:15:32Z GET /api/orders 500 1240"
awk '{ m=substr($1,1,16); t[m]++; if ($4>=500) e[m]++ }
     END { for (k in t) print k, "total=" t[k], "err=" e[k]+0 }' access.log | sort
~~~

Reading it piece by piece: field {{1}} in awk is the timestamp, field {{4}} is the status. {{substr(\$1,1,16)}} takes the first 16 characters of the timestamp, i.e. enough to reach the minute — for the line above that becomes the string {{2026-05-04T10:15}}. The two arrays {{t[m]++}} and {{e[m]++}} count by minute as the key; {{for (k in t)}} iterates over all minutes; {{e[k]+0}} ensures that a minute with no errors still prints 0 instead of an empty value; and {{sort}} at the end is needed because the order of {{for (k in t)}} is random.

Why by window instead of a cumulative total: a grand total from the start of the file only tells you "there are errors", not **when**. The 10-minute series below says far more:

| Minute | total | 5xx | error rate | p95 |
|---|---|---|---|---|
| 10:13 | 900 | 3 | 0.3% | 180 ms |
| 10:14 | 880 | 5 | 0.6% | 190 ms |
| 10:15 | 910 | 214 | 23.5% | 1240 ms |
| 10:16 | 300 | 180 | 60% | 3000 ms |

Three readings from the table: errors **started at 10:15** (ask immediately: what was deployed/changed at 10:15?); by 10:16 the error rate rose while **total requests dropped** — that is a sign the system can no longer serve (requests timing out, clients giving up, queues saturated), far more severe than "errors increased"; and p95 jumped in those exact two minutes, meaning slowness and errors share the same cause.

Choosing the bucket width: too small (1 second) means many buckets have only a few samples and the chart is full of noise; too wide (1 hour) means a 10-minute incident is diluted into "a slightly bad day". A practical rule: pick a bucket so each cell has **a few hundred samples or more**, typically 1 minute for a medium-sized service, 5 minutes for a small one.

> Note: {{uniq -c}} only merges **identical lines that sit next to each other**, so you must always {{sort}} before {{uniq}}. Forgetting {{sort}} is the most common mistake when first using this pair, and the result still "looks like it has numbers" so you do not realize you are wrong.

### What log lines one request produces

~~~seq
title: The path of one access log line
actors: Client | Gateway | Order | NodeLog | Agent
Client -> Gateway: GET /api/orders
Gateway -> Order: forward, with traceparent
Order --> Gateway: 500 after 1240 ms
Order -> NodeLog: print JSON log to stdout
NodeLog -> Agent: read the container log file
Agent -> Agent: attach metadata then ship to Loki
note NodeLog..Agent: container stdout is stored as a file on the node
~~~

The easily forgotten part: **latency**. Many default nginx/gateway configurations do not record processing time, or only record the time from when the request was received, not when the last byte was written to the client (streaming, large payloads). If the log has no latency field, there is no p95 at all — and that is something to fix **before** an incident, not during one.

### Top error endpoints: a short command, a long list of traps

~~~bash
awk '$4>=500 { print $2, $3 }' access.log | sort | uniq -c | sort -rn | head
~~~

{{\$2}} is the method, {{\$3}} is the path → prints {{GET /api/orders}}; {{sort}} so identical lines sit next to each other; {{uniq -c}} counts; {{sort -rn}} sorts by the count column, **numerically**, descending (missing {{-n}} means {{sort}} compares as strings: "9" is greater than "100" — a classic bug); {{head}} takes the first 10 lines.

The cardinality trap: if the path carries the real id ({{/orders/8842}}), every order becomes its own "endpoint" and the top table is useless. You must normalize to a template before counting:

~~~bash
awk '$4>=500 { p=$3; sub("/[0-9]+$", "/{id}", p); print $2, p }' access.log | sort | uniq -c | sort -rn | head
~~~

The interpretation trap, more important than the command trap: **the endpoint accounting for 90% of errors may simply account for 90% of traffic**. The right question is "which endpoint has an error **rate** twice that of the rest?", i.e. take the number of errors **divided by** the number of requests of that same endpoint. Two absolute numbers cannot be compared because their samples differ.

And only count **5xx** as your own errors — do not lump in **4xx**: {{404}} means the client mistyped the path, {{401}} means an expired token, {{429}} means you are successfully defending yourself, {{499}} (nginx) means the client gave up — none of these are regressions. Conversely, if 4xx spikes, that is also a signal worth reading: perhaps the API contract just changed, or someone is scanning.

### What p95 is, and why the average lies

**p95 (95th percentile)** of a latency set = a value {{v}} such that **95% of requests have latency less than or equal to v**, and the remaining 5% are slower. The **nearest-rank** method: sort the sample set ascending, take the sample at rank {{ceil(0.95 x n)}}.

~~~java
static double p95(List<Long> latencies) {
    if (latencies.isEmpty()) return 0.0;
    List<Long> sorted = new ArrayList<Long>(latencies);
    Collections.sort(sorted);
    int n = sorted.size();
    int rank = (95 * n + 99) / 100;            // equals ceil(95n/100), using integers
    if (rank < 1) rank = 1;
    if (rank > n) rank = n;
    return sorted.get(rank - 1).doubleValue(); // nearest-rank: take an ACTUAL sample, no interpolation
}
~~~

Why compute with integers instead of writing {{Math.ceil(0.95 * n)}}: with floating-point numbers, {{0.95}} cannot be represented exactly, so 0.95 times 20 yields 19.000000000000004, {{ceil}} pushes it to 20, and p95 jumps all the way to the last sample. With 20 latency samples 10, 20, ..., 200, the correct answer is **190**, not 200.

Why not use the average: latency is **right-skewed** (most requests are fast, a few are very slow), so the average is pulled by the tail.

| n | Sample set | Average | p50 | p95 | p99 |
|---|---|---|---|---|---|
| 20 | 10..200 ms evenly spaced | 105 ms | 100 ms | 190 ms | 200 ms |
| 20 | 19 samples at 20 ms + 1 sample at 30,000 ms | 1,519 ms | 20 ms | 20 ms | 30,000 ms |

The second row is a real story: one 30-second request makes the "average" jump 14x even though 95% of users are unaffected, and makes you think the system got slower when in reality only **one** bad query path exists. p95/p99 tell the right story: p95 is stable against single outliers, while p99 is sensitive to long tails (so p99 needs more samples to be meaningful).

Also do not take the p95 of the **whole service** as the only indicator: an endpoint that takes 5% of traffic can be completely broken while the aggregate p95 still looks "fine". p95 must be computed **per endpoint** (and per version during a rollout — the topic of the canary lesson).

### When metrics are available it is shorter, but you still need to understand the numbers

Most incidents start from metrics, not logs, because metrics are cheap and come with weeks of history:

~~~bash
# PromQL: 5xx rate per endpoint over the last 5 minutes
sum by (uri) (rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
  / sum by (uri) (rate(http_server_requests_seconds_count[5m]))
# p95 per endpoint, using Micrometer's histogram
histogram_quantile(0.95, sum by (le, uri) (rate(http_server_requests_seconds_bucket[5m])))
~~~

Logs and metrics complement each other in this direction: metrics tell you **what** is happening and **how much** across the whole system in 5 seconds; logs tell you **why** for a specific request, but they are expensive and slow. In the exercise below, since there are no metrics, we build both from raw logs.

### Production traps you will really hit
- **Mixing time zones**: the app writes local time, the gateway writes UTC → minute buckets drift apart, and comparing with "the same hour yesterday" means comparing two different worlds. Standardize on UTC right in the log schema.
- **One request producing many ERROR lines**: counting ERROR lines and reporting "300 errors" when only 30 requests actually failed, because each request prints 10 lines (retries, filters, wrapped exceptions). Count by **request**, or by distinct {{traceId}}.
- **Logs rotated away**: incident at 2am, investigation at 4am, the file has already been cut by {{logrotate}}. {{ls -l}} plus {{zcat}} on the compressed file is a required skill, and that is also why logs must be shipped to a central store.
- **Retries skewing the sample**: the client retries 3 times on one failure → both the error rate and the request count are multiplied by three. To understand what broke in the business, you must count by the original **request id**/traceId, not by log lines.
- **Missing logs due to sampling or ingest lag**: "the dashboard is silent" does not mean "there are no errors". Always check whether {{volume}} dropped abnormally before concluding the system is healthy.
- **Buckets too small for low traffic**: 6 requests, 2 errors = 33% error rate, sounds like a disaster, but it is really noise. A number must come with its sample size.
- **Forgetting the time dimension**: two overlapping incidents (a new build deployed at 10:14, a partner slowing down from 10:15) are very hard to separate if your logs lack enough fields to group by {{version}}.
- **Optimizing before measuring**: without p95 per endpoint, every "performance improvement" is just a feeling, and it often makes something else worse.

### Interview notes
For the question "the system has no observability, what do you do?", answer with structure: (1) state the investigation order clearly — bound the time, bound the scope, find what changed, **reduce blast radius** and only then hunt for the root cause, because rollback is the cheapest action when you understand nothing; (2) describe three concrete counting operations on access logs (errors per minute, top endpoints by error **rate**, p95 per endpoint) and that you can write an {{awk | sort | uniq -c | sort -rn}} pipeline without a dashboard; (3) describe how to read the result: which minute errors started, a drop in total means throughput collapsed rather than just errors rising, p95 jumping at the same time as errors means two symptoms share one cause; (4) close with **prevention**: standardize a JSON log schema with {{version}} and {{latencyMs}}, enable metrics, and switch alerts to an error budget. Naming the "reduce blast radius first" step is what distinguishes a senior from a mid-level engineer.

> Senior tip: Every team should keep a small {{scripts/incident.sh}} that runs {{awk}} against its own log format, and **practice using it in a game day every quarter**. At 2am with adrenaline, you will not think of the {{awk}} syntax; you will only remember that the script exists and what three tables it prints.`,
    exercises: [
      {
        title: "AccessLogStats: parse log lines, errors per minute, p95 nearest-rank per endpoint, top error endpoints",
        prompt: `A log line has **5 fields** separated by whitespace; leading/trailing whitespace and multiple spaces between fields are all accepted:

{{timestamp method path status latencyMs}}, for example {{2026-05-04T10:15:32Z GET /api/orders 500 1240}}.

{{LogLine}} and {{Bucket}} are already written in the starter (**do not modify them**): {{LogLine}} holds {{minute}} (the first 16 characters of the timestamp), {{method}}, {{path}}, {{status}}, {{latencyMs}}, has {{endpoint()}} returning the form {{GET /api/orders}}, and {{isError()}} which is {{status >= 500}}; {{Bucket}} holds {{total}}/{{errors}} and has {{errorRate()}}. The rest is your job in {{AccessLogStats}}:

- {{static LogLine parse(String line)}}: throw {{IllegalArgumentException}} when {{line}} is null, when the number of fields is not 5, when the timestamp is shorter than 16 characters or the character at position 10 (0-indexed) is not the letter {{T}}, or when {{status}} or {{latencyMs}} are not integers. Return a {{LogLine}} whose {{minute}} is the first 16 characters of the timestamp and whose {{method}} is uppercased. The remaining constraints (status in {{100..599}}, path starting with {{/}}, non-negative latency) are already enforced by {{LogLine}} for you.
- {{static Map<String, Bucket> statsByMinute(List<String> lines)}}: throw {{IllegalArgumentException}} when {{lines}} is null. Skip elements that are null or empty after trimming. Group by {{minute}}: {{total}} is the number of lines in that minute, {{errors}} is the number of lines with {{status >= 500}}. Return a {{TreeMap}} so the map sorts itself by minute.
- {{static double errorRate(List<String> lines, String minute)}}: throw {{IllegalArgumentException}} when {{minute}} is null. Return the error rate of that minute, **0.0 when that minute has no lines at all**. Reuse {{statsByMinute}} and {{Bucket.errorRate}} instead of writing a second counting loop.
- {{static double p95(List<String> lines, String endpoint)}}: throw {{IllegalArgumentException}} when {{lines}} or {{endpoint}} is null. Compare {{endpoint}} against {{LogLine.endpoint()}}. Take the latency of **every** request for that endpoint (2xx, 4xx, and 5xx alike); if there are no samples, return 0.0. Nearest-rank: sort ascending, then take the sample at rank {{(95 * n + 99) / 100}} — integer division rounds down, which is exactly {{ceil(95n/100)}} **without using floating-point numbers**. The reason to avoid floating-point: {{Math.ceil(0.95 * 20)}} yields 20 instead of 19, because 0.95 cannot be represented exactly.
- {{static Map<String, Long> errorsByEndpoint(List<String> lines)}}: throw {{IllegalArgumentException}} when {{lines}} is null. A map from endpoint → number of 5xx lines; include **only** endpoints that have at least one error.
- {{static List<String> topErrorEndpoints(List<String> lines, int n)}}: throw {{IllegalArgumentException}} when {{n < 0}}. Based on {{errorsByEndpoint}}, sort by error count **descending**, break ties by endpoint name **A-Z**, and take the first {{n}} elements. If {{n}} is larger than the number of endpoints with errors, return all of them; {{n = 0}} returns an empty list.

Self-check before running the tests: {{p95}} of the 20 samples {{10, 20, ..., 200}} must be **190**; a minute with no requests at all must return **0.0** instead of throwing; an endpoint that only has 4xx must be **absent** from the top list.`,
        hints: [
          'parse: use {{line.trim().split(" +")}} (this regex means one or more spaces), then check {{t.length == 5}} and {{t[0].charAt(10)}}.',
          'statsByMinute: count with a {{Map<String, long[]>}} where {{long[2]}} = {total, errors}, and use a {{TreeMap}} so minutes are sorted in time order.',
          'errorRate: call {{statsByMinute(lines).get(minute)}}; if non-null return {{b.errorRate()}}, if null return 0.0. Do not write a second counting loop.',
          'p95: filter by {{endpoint.equals(p.endpoint())}}, {{Collections.sort}}, {{rank = (95 * n + 99) / 100}}, then return {{vals.get(rank - 1)}}.',
          'topErrorEndpoints: the comparator must return {{Long.compare(b.getValue(), a.getValue())}} (descending) first, and only when equal fall back to {{a.getKey().compareTo(b.getKey())}}.',
        ],
        explain: `The four statistics methods share exactly one pattern: **filter - group - count - sort**. This is precisely what {{group by}} in SQL and {{sum by (uri)}}, {{rate()}} in PromQL do; writing it by hand once helps you understand why dashboards need labels and why label cardinality is expensive.

The places most likely to go wrong in this exercise:
- **{{split(" +")}} instead of {{split(" ")}}**: if a log line has double spaces, {{split(" ")}} produces empty elements and {{t.length}} becomes 7, so every line is reported as malformed. Conversely, {{split()}} with no argument skips leading whitespace, but {{trim()}} + {{split(" +")}} is the most readable pair.
- **{{minute}} taken with {{substring(0, 16)}}**: enough to reach the minute without parsing date/time, without {{LocalDateTime}}, and therefore it also does **not** normalize time zones for you. If a service writes local time, its numbers will land in the wrong bucket, and only a log schema that standardizes on UTC prevents that at the source. That is why {{parse}} does not try to interpret the timestamp.
- **{{rank}} must be an integer**: the formula {{(95 * n + 99) / 100}} is the integer form of {{ceil(95n/100)}} (because {{ceil(a/b) = (a + b - 1) / b}} with floor division). Writing {{Math.ceil(0.95 * n)}} will sometimes return the last sample instead of the correct one; this kind of bug only appears for certain values of {{n}}, so it is very hard to spot by eye, and the "20 samples yield 190" case in the tests catches exactly that.
- **{{p95}} is computed over all requests of the endpoint, not just error requests**: p95 latency is an indicator of *experience*, and a bad experience includes requests that succeed but are slow. If you only take 5xx samples, you get the p95 of just the broken group — a number that answers no useful question.
- **{{errorRate}} for a missing minute returns {{0.0}}, not an exception**: dashboards/alerts need a continuous data series. But this is where you must remember the statistics lesson: a minute with no samples is **not the same** as a minute with 0% errors — with 0 samples, do not conclude anything.
- **{{TreeMap}} so the map sorts itself by minute**: minutes in ISO-8601 format have the same string order as time order; using {{HashMap}} makes the output shuffled and you lose exactly what you need: the *progression*.
- **Ties in the top list**: without a {{tie-break}}, the order of two endpoints with the same 5 errors changes with the map's hash order, tests become flaky, and readers of the table also misinterpret. Sorting A-Z when tied is the cheapest way to make the result **deterministic**.

Retell it in an interview along this practical thread: read {{head -3}} to learn the format, count errors per minute to find the start time, compare **rates** not absolute numbers because samples differ, group by normalized endpoint (paths without ids) to find the culprit, use nearest-rank p95 per endpoint because the average is pulled by long tails, cross-check the start time with the deploy schedule, then **roll back/disable the flag first** before investigating deeply. Finally: any incident where you have to read raw logs to find the numbers is an observability incident, so prevention means standardizing a JSON schema with {{service}}, {{version}}, {{traceId}}, {{latencyMs}} and building metrics + alerts around an error budget.`,
      },
    ],
    check: [
      {
        q: "Errors have been rising steadily since 10:15. What should you do BEFORE hunting for the root cause?",
        options: [
          "Run a profiler across the whole service",
          "Reduce blast radius: roll back the new build or disable the feature flag, then investigate",
          "Write the postmortem",
          "Raise the log level to TRACE and wait",
        ],
        answer: 1,
        explain: "Rollback is a cheap, reversible action that buys time for both users and you. Investigating the root cause while users are still broken is getting the priority order backwards.",
      },
      {
        q: "Endpoint A accounts for 900/1000 errors across the whole system. Which conclusion is correct?",
        options: [
          "A is definitely the culprit",
          "You cannot tell yet: you must divide by the number of requests of A itself to get the error rate, then compare with other endpoints",
          "A is slow",
          "You should also count 4xx into A's errors",
        ],
        answer: 1,
        explain: "The absolute error count depends on traffic. If A takes 90% of traffic, then 90% of errors is exactly what you would expect — nothing unusual.",
      },
      {
        q: "Why use p95 instead of the average when talking about slowness?",
        options: [
          "Because p95 is faster to compute",
          "Because latency is right-skewed: one 30s request makes the average spike even though 95% of users are unaffected; p95 is taken from actual samples so it reflects the real experience",
          "Because the average is always smaller than p95",
          "Because p95 does not require sorting the data",
        ],
        answer: 1,
        explain: "The average is pulled by the long tail. p95/p99 are percentiles over a sorted sample, catching the tail problems (slow query, GC pause, retry).",
      },
      {
        q: "The pipeline {{awk ... | uniq -c | sort -rn}} produces wrong counts. Where is the bug?",
        options: [
          "Missing {{sort}} right before {{uniq -c}}: uniq only merges identical lines that are adjacent",
          "Missing {{head}}",
          "Using {{awk}} instead of {{grep}}",
          "The bucket is too wide",
        ],
        answer: 0,
        explain: "uniq works on sorted data. If you forget sort, every time it sees a new key it prints another line with count 1, and the top table becomes meaningless without raising any error.",
      },
    ],
  },
});
