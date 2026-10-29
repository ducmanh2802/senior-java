/*
 * English translation of js/data/lessons-devops.js — task T470; re-translated after the content review in task T495.
 * Format: js/core/i18n.js (content overlay).
 * ids: lesson-devops-003 lesson-devops-004
 */
App.i18n.content({
  'lesson-devops-003': {
    title: 'Rolling, blue-green, canary: stable hash traffic splitting and auto-rollback on error rate',
    goals: [
      'Compare rolling, blue-green and canary by blast radius, resource cost, rollback and data constraints',
      'Design a canary that splits the % of traffic with a stable hash of userId so the same user always sees the same version',
      'Build auto-rollback: an error-rate gate plus a minimum sample threshold, avoiding rollbacks caused by noise',
    ],
    body: `### Three strategies, three trade-offs
| Strategy | Blast radius | Cost | Rollback | Data constraints |
|---|---|---|---|---|
| **Rolling update** | The whole cluster in cycles, versions mixed during the deploy | Lowest (keeps {{maxSurge}}/{{maxUnavailable}}) | Rollback = redeploy the old build, slow | Migrations must be compatible with both versions |
| **Blue-green** | One switch, but a wrong switch means 100% of traffic | Double resources (two environments running side by side) | Fast: point the Service selector back to blue | The DB schema must be compatible with both builds so you can still go back to blue |
| **Canary** | By % of traffic, usually 1→5→25→100 | Medium (a few extra canary pods) | Fast: drop the % back to 0 | Old and new versions serve together; the DB must be strictly compatible |

Canary is powerful because **real production data** decides whether to continue: after 5% of traffic for 15 minutes, the error rate, p99 latency and logs of the new build are already statistically meaningful — something blue-green does not have before the switch.

### Splitting traffic: a stable hash instead of "random per request"
A load balancer that spreads by connection/request makes **the same user** hit both versions within one session: the user creates an order on the new build and pays on the old one → the classic schema error. The fix: **sticky by userId** using a stable hash function:

~~~text
bucket = floorMod(userId.hashCode(), 100)     // 0..99
bucket < canaryPercent  →  version "canary"
otherwise               →  version "stable"
~~~

The formula of {{String.hashCode()}} is spelled out in the String Javadoc ({{s[0]×31^(n−1) + s[1]×31^(n−2) + … + s[n−1]}}), so every JVM, every process and every restart computes **the same number** — unlike the default {{Object.hashCode()}} (identity hash), which changes on every run. That is why every replica and every gateway can decide the route on its own without a shared session store. (Real systems usually use a better-distributed hash such as MurmurHash, plus a "salt" based on the experiment name so each canary round picks a different user set; the idea stays the same.) The ratio is approximately {{canaryPercent}}% over a large enough user set; an individual user always stays on the same version — this both prevents "split sessions" and lets you observe exactly the canary user set.

Rollout strategy: 1% → 5% → 20% → 50% → 100%, each step with an observation window. At every %, the hash makes the user set a **subset** of the lower % (a 1% canary user is still canary at 20%) — ramping up never makes a user jump versions mid-flight.

### Automatic rollback: threshold + minimum samples + sliding window
Canary only makes sense when you can **compare**. Automatic rollback needs three things:

1. **Error rate** per version: {{failures / total}} over a sliding window (for example the last 5 minutes), not cumulative since the beginning of time — a bug may live in one specific user cluster.
2. **Minimum sample threshold** (minSamples): 3 failed requests out of the first 3 is a 100% error rate, but not enough evidence to kill a release. The classic rule: ≥ 20–50 requests or ≥ 5 minutes.
3. **Comparison threshold** (error threshold): usually max(abs, factor × baseline). Simple version: {{errorRate("canary") > 0.02}} (2%) and canary already has ≥ 30 samples.

~~~text
record(version, success)           // append to the window
if canary.samples >= minSamples
   and canary.errorRate > threshold:
       rollback(): canaryPercent = 0  →  100% traffic back to stable
~~~

After a rollback, **do not** stop observing: the logs and traces of that short canary window are gold for the postmortem. Also distinguish an **automatic** rollback (safe, only lowers the %) from promoting to 100% (needs signals good enough: error rate ≤ baseline, no other anomaly).

### Common production traps
- **Hashing with {{Random()}} on every request**: users keep switching versions; two parallel requests from the same user can even go to two different places. Hash a **stable identity of the user** (userId, or accountId for money flows).
- **Raising the % mid-rollout makes users jump versions**: when going 5% → 20%, users already in canary must **stay** in canary. With a fixed bucket 0..99 compared against the percent this holds automatically (bucket 3 < 5 and also < 20); if the code uses "random < percent" or changes the hash formula between two deploys, users jump all over the place.
- **Rollback because of noise**: 3 errors in the first 3 requests (possibly a shared network incident) kills the release at 2 a.m. and the team loses a whole day investigating a build that was fine. Minimum samples + a threshold compared against the stable baseline is what makes it fair.
- **One-way DB migration**: canary writes data in the new shape while stable still reads the old shape — after the canary deploy a rollback is **impossible** because the data is already written. The expand-contract technique (widen the schema to be compatible with both, migrate, then narrow it) is the precondition for canary on a stateful system.
- **Metrics without a version label**: canary takes 5% of traffic but the dashboard only shows the aggregated error rate of the whole service — a 10% error in canary only moves the aggregate by 0.5%, and nobody notices. Every metric/log must carry a version label (for example a {{version}} label on the Pod, or an {{X-Version}} header added by the gateway) so canary can be compared with stable.

### Interview notes
The classic senior question: "For a payment service, which strategy do you choose and how do you auto-rollback?" — Answer: canary by % with a stable hash of userId (sticky sessions, no shared store), observe the error rate per version with minimum samples, roll back by dropping the % to 0; the precondition is an expand-contract migration so the old build can always be rolled back. The exercise below builds exactly that router + auto-rollback in plain Java.`,
    exercises: [
      {
        title: 'CanaryRouter: stable hash traffic splitting and automatic rollback when the error rate crosses the threshold',
        prompt: `Complete {{CanaryRouter}}, a simulation of a canary gateway:

- Constructor {{CanaryRouter(canaryPercent, errorThreshold, minSamples)}}: clamp {{canaryPercent}} to 0..100; keep the other two parameters as given.
- {{route(userId)}}: return {{canary}} or {{stable}}. Use {{bucket = Math.floorMod(userId.hashCode(), 100)}}; if {{bucket < canaryPercent}} then canary. {{canaryPercent == 0}} always returns stable; {{== 100}} always returns canary. The same userId always yields the same result (stable hash).
- {{record(version, success)}}: record one request result for a version ({{canary}} or {{stable}}); {{success == false}} is a failure.
- {{errorRate(version)}}: {{failures / total}} for that version; return 0.0 when there are no samples yet.
- {{shouldRollback()}}: true when {{canary}} has **at least** {{minSamples}} samples **and** {{errorRate("canary") > errorThreshold}}. With too few samples it stays false even at 100% errors.
- {{rollback()}}: set {{canaryPercent = 0}} — every request afterwards goes to stable.
- {{canaryPercent()}}: the current ratio.`,
        hints: [
          'Store the stats as {{Map<String, int[]>}} with a two-element array [total, failures]; {{record}} increments total and increments failures when {{!success}}.',
          'Route: handle the two edges early ({{<= 0}} always stable, {{>= 100}} always canary), in between use {{Math.floorMod(userId.hashCode(), 100) < canaryPercent}}.',
          'shouldRollback: check {{samples >= minSamples}} **before** errorRate — 9/9 failures must still return false so noise does not trigger a rollback.',
        ],
        explain: `A stable hash of the userId guarantees the two properties a canary gateway needs: (1) a ratio approximately equal to the configured % over a large user set, (2) stickiness — the same user never jumps versions mid-flight, so there is no "split session" between two incompatible schemas. {{Math.floorMod}} handles negative hashCodes too (no negative bucket index).

{{shouldRollback}} combines two conditions: enough samples (statistics) and crossing the threshold (quality). This is the "automatic" part of auto-rollback: when it is true, the gateway only needs to set canaryPercent = 0 — 100% of traffic is back on stable instantly, with no redeploy. In real systems, errorRate is also compared against the stable baseline ({{canaryRate > max(threshold, 3 × stableRate)}}) so you do not roll back a release that is actually still better than the old build.

Common mistakes:
- Computing the route with {{ThreadLocalRandom.current().nextInt(100) < percent}}: a dice roll per request, so users keep switching versions — right for traffic distribution, wrong for sticky sessions. You must hash the user identity.
- Using the cumulative error rate since the release started: one incident half an hour ago skews it forever and you never see recovery. A sliding window (or periodically resetting the stats) is required.
- Rolling back by redeploying the old build: 5–10 minutes, while dropping the % to 0 takes seconds. With a DB compatible with both versions (expand-contract), % = 0 is always safe.
- Defining "enough samples" by time instead of request count: at 1% of traffic at 3 a.m., 15 minutes might bring only a handful of requests — not enough to conclude good or bad. Do not promote to a higher % while canary has not collected {{minSamples}} yet.

In an interview, connect the three pieces: the strategy (canary), the routing (stable hash of userId), and the stop mechanism (error rate + minSamples + dropping the % to 0), plus the migration precondition so data can be rolled back safely.

> Senior tip: Rolling back from 20% → 0% while keeping the old stats once made the next rollout (say 5%) roll back immediately because the old stats were still over the threshold — always reset the stats on rollback or use a fresh sliding window for each rollout.`,
      },
    ],
    check: [
      {
        q: 'The canary gateway splits traffic with {{Math.floorMod(userId.hashCode(), 100) < canaryPercent}}. What is the most important property of this approach?',
        options: ['Perfectly even traffic distribution every second', 'The same userId always sees the same version; the ratio is approximately the % over a large user set', 'No need to observe the error rate', 'It only works when sticky cookies are enabled'],
        answer: 1,
        explain: `The hash of userId is a stable function: every request from the same user lands in the same bucket → no split session between two versions. The ratio is only approximately the % (enough statistics over a large set), not perfectly even every second — and that is not the goal. Canary still needs error-rate observation; sticky cookies play no part because the hash is already sticky.`,
      },
      {
        q: 'A new canary has received 3 requests and all 3 failed (100% error rate), minSamples = 30. What is the correct behavior of auto-rollback?',
        options: ['Roll back immediately because 100% > 2%', 'Do not roll back because there are not enough samples yet', 'Roll back and suspend the release forever', 'Multiply the error rate by 30 and then compare with the threshold'],
        answer: 1,
        explain: `Minimum samples is the evidence threshold: 3/3 is not enough to conclude the release is broken (and it may be a shared infrastructure error). Rolling back immediately creates release flapping during peak hours. There is no "multiply the samples" logic; and "suspend forever" is not auto-rollback behavior — it only drops the % to 0 and then you investigate.`,
      },
      {
        q: 'After an auto-rollback drops canaryPercent to 0, what is the correct next step?',
        options: ['Delete all canary metrics/logs', 'Keep observing the short canary traffic window as postmortem evidence, fix the bug and roll out again from a small %', 'Immediately send 100% of traffic to the new stable build', 'Redeploy the same canary build at 50%'],
        answer: 1,
        explain: `The data from that canary window (logs, traces, error patterns) is the source of the root cause. After fixing it, roll out again from a small % with adjusted minSamples. Deleting the metrics destroys the evidence; sending 100% immediately skips the process; redeploying the buggy build at 50% repeats the incident.`,
      },
    ],
  },
  'lesson-devops-004': {
    title: 'Retrying external provider calls correctly: FINAL/RETRY error classification, backoff and jitter',
    goals: [
      'Use an Adapter to bring document storage providers (ECM/EFSS, OneDrive…) behind a single interface and one shared error classification table',
      'Classify errors as FINAL (do not retry) and RETRY (safe to try again), and explain why retrying the wrong kind of error is harmful',
      'Implement bounded retries with capped exponential backoff, and understand the role of jitter, Retry-After and idempotency',
    ],
    body: `### Context: one service, many providers
In a bank or a large enterprise, a Java application often has to read/write documents in several different repositories: an on-premise ECM system (IBM FileNet, OpenText…), an internal EFSS (Enterprise File Sync and Share) store, or the cloud such as OneDrive/SharePoint through Microsoft Graph. Each provider has its own protocol (REST, SOAP, CMIS), **its own error code set** and **its own rate limit**.

If business code calls each provider directly, the "should this error be retried" logic gets scattered everywhere and each place handles it differently. The **Adapter pattern** fixes this: each provider gets an adapter that implements the same interface ({{EcmConnector}}), and **each adapter translates its provider's error codes into a shared classification** (FINAL or RETRY). The retry logic is written **once** in the service layer, based on that shared classification.

### Two kinds of errors
**FINAL — retrying fails exactly the same way:**
- {{400 Bad Request}} (bad parameter), {{403 Forbidden}} (the service account lacks permission), {{404 Not Found}} (the file was deleted), {{413}} (file too large).
- Action: stop immediately and report a clear error. Retrying only wastes time and quota, and if you fire thousands of 403 requests, the provider's protection system may lock the integration account entirely.

**RETRY — transient errors; waiting a bit may succeed:**
- {{429 Too Many Requests}} (rate limit hit), {{503 Service Unavailable}} (provider overloaded/maintenance), {{502}}/{{504}} (gateway failure or timeout), network errors such as connection reset, {{SocketTimeoutException}}.
- Action: wait and try again, **with a bounded number of attempts**.

**Special case — 401 because the token expired:** this is not a "blind" retry. You must **fetch a new token first**, then retry **exactly once**; if it is still 401, it is a configuration error (FINAL). In the table below, the code {{TOKEN_EXPIRED}} is classified RETRY with the implicit assumption that the adapter has already refreshed the token before throwing the error upward.

### Exponential backoff with a cap
Do not retry as "try again every 1 second". When a provider is overloaded and every client fires again after exactly 1 second, that creates a fresh load spike (**thundering herd**) and the provider never recovers.

**Exponential backoff**: the wait for attempt n = base × 2^(n−1), but **never above a cap**. With base = 100ms and cap = 1000ms:

| Retry attempt | 1 | 2 | 3 | 4 | 5 | 6 onwards |
|---|---|---|---|---|---|---|
| Wait (ms) | 100 | 200 | 400 | 800 | 1000 | 1000 |

The cap is mandatory: without it, attempt 20 would wait 100ms × 2^19 ≈ 14 hours; worse, if you compute it with a bit shift {{base << n}} for a large n, the number **overflows** into a negative value.

### Jitter: don't let every client wait exactly the same
Backoff spreads attempts out over time, but 1000 instances that all fail at second 0 still retry together at 100ms, 300ms, 700ms… — still waves. **Jitter** adds randomness to the wait. The most common variant is **full jitter**: wait a random number in 0..backoff(n). Retries then spread out over time instead of piling into one column.

~~~java
long backoff = Math.min(CAP_MS, BASE_MS << Math.min(retry - 1, 20)); // limit the shift count so it cannot overflow
long sleep = ThreadLocalRandom.current().nextLong(backoff + 1);     // full jitter: 0..backoff
~~~

In the exercise we separate the backoff computation (deterministic, testable) from the randomness, and record the wait times into a list instead of calling {{Thread.sleep}} so tests run fast and produce fixed results.

### Retry-After: when the provider says how long to wait, listen
For {{429}} and {{503}}, the HTTP standard lets the server return a {{Retry-After}} header (a number of seconds or a timestamp). Microsoft Graph (OneDrive/SharePoint) returns this header when throttling. If present, wait **at least** that long instead of using your own backoff — retrying sooner usually gets throttled again and can extend the throttling period.

### Per-provider error code mapping table
| Provider | Error code | Classification | Meaning |
|---|---|---|---|
| EFSS (internal, illustrative example) | {{RATE_LIMIT}} | RETRY | Hit the requests/second limit |
| | {{SERVER_BUSY}} | RETRY | Provider temporarily overloaded |
| | {{TOKEN_EXPIRED}} | RETRY | Adapter already refreshed the token, call once more |
| | {{PERMISSION_DENIED}} | FINAL | Must fix the service account permissions |
| | {{FILE_NOT_FOUND}} | FINAL | The file does not exist |
| OneDrive (Microsoft Graph) | {{activityLimitReached}} | RETRY | Throttled (HTTP 429), usually with Retry-After |
| | {{serviceNotAvailable}} | RETRY | Service temporarily unavailable (HTTP 503) |
| | {{accessDenied}} | FINAL | No permission |
| | {{itemNotFound}} | FINAL | Item not found |

Unknown codes (not yet known to the adapter) default to **FINAL**: better to fail fast and let operators extend the table than to blindly retry an error that may be permanent.

### Idempotency: the precondition for retrying write operations
Retrying is only safe when the operation is **idempotent** — doing it once or three times gives the same result. Reading a file (GET) is always safe. Upload is dangerous: the first request may **already have succeeded** at the provider while the response timed out on the way back; the retry creates a duplicate. How to handle it: upload to a **fixed path** in overwrite mode (PUT by file name), or send an **idempotency key** if the provider supports it, or check "does the file already exist" before retrying.

### Common production traps
- **Retries stacked across layers**: the HTTP client retries 3 times, the service retries 3 times, the message consumer retries 3 times → one error becomes 27 requests. Retry at **one** layer only.
- **Retries without an overall deadline**: the user's request waits 30 seconds because of retries while the gateway already timed out at 10 seconds — the extra retries only waste resources.
- **Retrying when the provider is completely down**: every request burns through all retry attempts and the thread pool is exhausted. Combine with a **circuit breaker** (for example Resilience4j): when the failure rate crosses the threshold it "opens the circuit", fails fast for a while, then cautiously tries again.

### Interview notes
A common question: "An external provider sometimes returns 5xx or 429 — how do you handle it?" A complete answer: (1) the adapter translates error codes into FINAL/RETRY, unknown codes are FINAL; (2) retry only RETRY errors, at most N times, exponential backoff with a cap + full jitter, honouring Retry-After; (3) retry only idempotent operations; (4) a circuit breaker when the provider is down; (5) retry at exactly one layer and with an overall deadline. The exercise below implements the core of (1)–(2).

> Senior tip: Count a metric of retry attempts per provider and per error code. A spike in retries is the earliest signal that the provider is about to go down or that you are about to hit a quota — it usually shows up before your own service's error rate rises.`,
    exercises: [
      {
        title: 'Classify errors per provider and retry with capped exponential backoff',
        prompt: `The starter already has {{ErrorKind}}, {{ErrorPolicy}}, {{EcmConnector}} and {{ProviderException}} (carrying the error code in the {{code}} field). You need to complete:

1. {{EfssPolicy.classify(code)}}: {{RATE_LIMIT}}, {{SERVER_BUSY}}, {{TOKEN_EXPIRED}} → {{RETRY}}; every other code (including unknown ones) → {{FINAL}}.
2. {{OneDrivePolicy.classify(code)}}: {{activityLimitReached}}, {{serviceNotAvailable}} → {{RETRY}}; every other code → {{FINAL}}.
3. {{EcmService.backoffMs(retry)}} with {{retry}} ≥ 1: {{min(CAP_MS, BASE_MS × 2^(retry − 1))}}, {{BASE_MS = 100}}, {{CAP_MS = 1000}}. It must not overflow for a very large {{retry}} (for example 60).
4. {{EcmService.fetchWithRetry(connector, id)}}:
- Call {{connector.fetch(id)}}; on success return the result.
- Catch {{ProviderException}} and classify {{e.code}} using {{connector.policy()}}.
- {{RETRY}} and fewer than {{MAX_RETRIES = 3}} retries so far: add {{backoffMs(n)}} to the {{sleeps}} list (n = 1, 2, 3 — in place of Thread.sleep) then call again. At most **4 calls** in total.
- {{FINAL}}, or 3 retries already used: rethrow **the same exception** that was just caught.`,
        hints: [
          'Both policies only need a {{Set<String>}} of RETRY codes; anything not in the set returns {{FINAL}} — unknown codes automatically become FINAL.',
          'backoffMs: start from {{BASE_MS}} and double {{retry - 1}} times, but stop as soon as the value is ≥ {{CAP_MS}}, then take {{Math.min}} with the cap. This can never overflow.',
          'fetchWithRetry: use a {{while (true)}} loop with a {{retries}} counter; in {{catch}}, if it is not retryable then {{throw e}}, otherwise increment {{retries}}, append {{backoffMs(retries)}} to {{sleeps}} and loop again.',
        ],
        explain: `The solution separates three responsibilities: the **adapter/policy** knows each provider's error language; **backoffMs** is a pure function (same input, same output) so it is easy to test; **fetchWithRetry** only knows FINAL/RETRY and not which provider it is — adding a third provider only requires one more policy.

Why rethrow **the original** exception instead of wrapping it in a new one such as "Exceeded max retries"? Because the caller (and the logs) need the **final error code** to decide: SERVER_BUSY after 4 attempts means the provider is down, PERMISSION_DENIED means the configuration must be fixed — two completely different actions.

Common mistakes:
- Writing {{BASE_MS << (retry - 1)}} without a bound: with retry = 60 the shift overflows {{long}} into a negative value or 0 and {{Math.min}} returns a negative number — the "no overflow" test catches this.
- Miscounting: "retry 3 times" means **4 calls** (1 initial + 3 retries). Writing {{for (attempt = 0; attempt < 3; ...)}} makes only 3 calls.
- Defaulting unknown codes to RETRY: a new permanent error will be retried all over the system and nobody will notice.
- Retrying FINAL errors "to be safe": it wastes quota, and with 403 it can make the provider lock the account.

In production, instead of hand-writing the loop you usually use Resilience4j {{Retry}} (configured with {{maxAttempts}}, {{IntervalFunction.ofExponentialRandomBackoff}}, {{retryOnException}} driven by the policy) together with {{CircuitBreaker}}. But understanding this loop is what lets you configure the library correctly.

> Senior tip: Recording the wait times instead of actually sleeping (like the {{sleeps}} list) is not only for fast tests — in production, injecting a {{Sleeper}}/{{Clock}} lets you unit-test every retry branch without making CI minutes slower.`,
      },
    ],
    check: [
      {
        q: 'When calling an external provider API, which of these errors should be classified as RETRY?',
        options: ['401 Unauthorized repeating even after fetching a new token', '404 Not Found', '429 Too Many Requests', '400 Bad Request'],
        answer: 2,
        explain: `429 is a transient error (rate limit hit): waiting a while — preferably according to the Retry-After header — and trying again usually succeeds. A 401 **after refreshing the token** means the credentials/configuration are wrong, so retrying any number of times changes nothing (only the first 401 caused by an expired token is worth refreshing and retrying once). 404: the file does not exist, calling again will not make it exist. 400: the request is badly formed, resending it unchanged is still wrong.`,
      },
      {
        q: 'Why should jitter be added to exponential backoff?',
        options: ['To make every retry faster', 'To prevent many clients that failed at the same time from retrying at exactly the same moment', 'To reduce the memory used by retries', 'To increase the maximum number of retries'],
        answer: 1,
        explain: `Without jitter, every client that failed at the same moment waits exactly the same time (100ms, 200ms, 400ms…) and hits the provider in waves, making it harder for the provider to recover. Jitter spreads retries out over time. Jitter does not make retries faster (full jitter waits less on average, but the goal is spreading, not speed), has nothing to do with memory, and does not change the maximum number of retries.`,
      },
      {
        q: 'A service uploads a file to a provider; the first request times out on the client side. What is the risk of retrying right away, and how should it be handled?',
        options: ['No risk, because a timeout means the provider has not received the file', 'It may create a duplicate file because the first request may have succeeded; the upload must be idempotent (overwrite at a fixed path or use an idempotency key)', 'The risk is that the provider locks the account immediately', 'Just increase the timeout and the risk disappears'],
        answer: 1,
        explain: `A client-side timeout only means the client did not receive the response — the provider may have already stored the file. Retrying a non-idempotent operation creates a duplicate, so uploads must be designed to be idempotent. "No risk" is wrong because it assumes the provider has not received the file. The provider does not lock the account over one retry. Increasing the timeout lowers the frequency but does not remove the possibility of a response being lost on the way back.`,
      },
    ],
  },
});
