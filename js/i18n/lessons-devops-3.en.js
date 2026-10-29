/*
 * English translation of js/data/lessons-devops.js — task T471. Format: js/core/i18n.js (content overlay).
 * ids: lesson-devops-005
 */
App.i18n.content({
  'lesson-devops-005': {
    title: 'The ingestion loop: token-bucket rate limiting and pre-emptive credential rotation before expiry',
    goals: [
      'Implement token bucket correctly: refill tokens over time, cap burst with capacity, never lose fractional time slices',
      'Design pre-emptive credential rotation before the token expires, plus a fallback when 401 still occurs',
      'Build a cyclic ingestion loop: auto-throttle when out of quota, process in order, mark leftovers for the next run',
    ],
    body: `### The problem: pushing thousands of files over many hours
An ingestion job (reading data from a source and pushing it into the destination store) that runs for hours typically hits two "hard" limits from the destination:

1. **Rate limit (quota)**: the provider only allows a certain number of requests in a time window. SharePoint/OneDrive (Microsoft Graph) returns {{429 Too Many Requests}} with a {{Retry-After}} header; Amazon S3 limits by prefix (about 3,500 PUT and 5,500 GET per second) and returns {{503 Slow Down}} when exceeded. Pushing faster just yields more errors, and the provider may throttle for longer.
2. **Credential expiry**: OAuth2 access tokens or temporary credentials (e.g., AWS STS) usually live 15 minutes to 1 hour. A 5-hour job will definitely hit token expiry if it does not refresh proactively.

### Token bucket: step by step
Imagine a bucket holding tokens:
- The bucket has a **capacity** C (maximum tokens). Initially the bucket is full.
- Every **refillIntervalMs** we add **refillTokens** tokens, but never above C.
- Each request must take 1 token. An empty bucket means the request waits (or is rejected).

We do not need a background thread to "refill" tokens. The standard approach is **lazy refill**: each time a request arrives, compute how many **full periods** have elapsed since the last refill, and add the corresponding tokens:

~~~java
long periods = (now - lastRefill) / refillIntervalMs;      // number of full periods elapsed
if (periods > 0) {
    tokens = Math.min(capacity, tokens + periods * refillTokens);
    lastRefill += periods * refillIntervalMs;              // do NOT set lastRefill = now
}
~~~

Why {{lastRefill += periods × interval}} instead of {{lastRefill = now}}? Suppose interval = 1000ms and a request arrives at 1500ms: 1 full period passed, add 1 token. If we set {{lastRefill = 1500}} the 500ms remainder is **discarded**: the next token would have to wait until 2500ms instead of 2000ms. Repeated many times, the actual throughput ends up significantly lower than configured.

### Why token bucket instead of fixed window?
**Fixed window** counts requests in fixed minute boundaries (second 0 to 59). A client sends 60 requests at second 59 and 60 more at second 60 (new window): both windows are valid, but the provider actually sees **120 requests in 2 seconds** — double the limit. Token bucket has no such "boundary": in any time span T, the maximum requests is {{C + refill rate × T}}. Capacity allows a **bounded burst** (e.g., at startup), after which the rate is clamped to the refill rate.

| Algorithm | Pros | Cons |
|---|---|---|
| Fixed window | Simple, one counter | Double burst at window boundaries |
| Sliding window log | Accurate | Stores every request timestamp, memory cost |
| Token bucket | Bounded burst, O(1) memory | Must choose capacity wisely |

### Pre-emptive credential rotation
The naive way is to wait for a {{401 Unauthorized}} and then fetch a new token: the batch that is already in progress fails, needs its own retry logic, and if multiple threads hit 401 simultaneously they all race to fetch a new token.

Better — **pre-emptive rotation**: before each cycle, check the token's remaining lifetime. If {{expiresAt − now < safety threshold}} (e.g., 2 minutes) then proactively fetch a fresh token from the secret store / identity provider (HashiCorp Vault, AWS Secrets Manager, Azure AD…). A 2–5 minute threshold covers network latency, clock skew between machines, and a long processing cycle.

Note: pre-emptive rotation **does not replace** 401 handling. A token can still be revoked before its expiry; on 401, fetch a new token and retry **exactly once**.

### The cyclic ingestion loop
1. **Check credential**: if less than the threshold remains, fetch a new token.
2. **Process within quota**: take files in order, each file consumes 1 token. When tokens run out, **stop this cycle** and wait for the next — do not spin calling {{tryConsume}} uselessly.
3. **Honour Retry-After**: if the provider returns 429 with Retry-After, wait at least that long.
4. **Checkpoint**: save progress after each cycle so a mid-run crash can resume from where it stopped.
5. **Cycle limit**: if allowed cycles are exhausted but files remain, mark them {{SKIPPED}} for the next run instead of running forever hogging resources.

### Common production traps
- **Each instance has its own bucket**: the quota belongs to the **account** at the provider, but 4 pods each with a 10 req/min bucket totals 40 — still gets 429. Divide the quota by the instance count, or use a shared bucket (e.g., on Redis).
- **Using system clock for the bucket**: {{System.currentTimeMillis()}} can jump backward when NTP adjusts; use {{System.nanoTime()}} (monotonic) to measure elapsed time.
- **Reading the source faster than writing the destination**: data piles up in memory to OOM. Put a bounded {{BlockingQueue}} between the reader and writer to create natural **backpressure**.

### Interview notes
A common question: "A job runs for 5 hours calling an API with a quota and a token that lives 1 hour — how do you design it?" Answer: token bucket (explain lazy refill, capacity = burst), quota divided by instance count; pre-emptive rotation with safety threshold + fallback one-time refresh on 401; cyclic loop with checkpoint; honour Retry-After. The exercise below implements the token bucket and that loop.

> Senior tip: Set the bucket rate 10–20% below the real quota. Providers count in their own way (misaligned windows, they count retries too), so running at 100% of quota almost guarantees occasional 429s.`,
    exercises: [
      {
        title: 'TokenBucket with lazy refill + IngestionLoop with credential rotation',
        prompt: `All times are in milliseconds and are **passed in** (no reading the real clock) for deterministic tests.

**1. {{TokenBucket(capacity, refillTokens, refillIntervalMs, now)}}** — on creation, the bucket is full ({{capacity}} tokens), the refill mark is {{now}}.
- {{tryConsume(now)}}: lazy refill then take 1 token if available (return true), otherwise return false.
- {{available(now)}}: lazy refill then return the current token count.
- Lazy refill: full periods {{periods = (now − lastRefill) / refillIntervalMs}}; if > 0 then {{tokens = min(capacity, tokens + periods × refillTokens)}} and {{lastRefill += periods × refillIntervalMs}} (keep the fractional remainder for next time).

**2. {{IngestionLoop.run(secrets, bucket, files, startTime)}}** — runs {{MAX_CYCLES = 3}} cycles; cycle k (k = 0, 1, 2) happens at {{now = startTime + k × CYCLE_MS}} ({{CYCLE_MS = 60000}}):
- Credential: if no secret yet, or {{secret.expiresAtMs − now < ROTATE_BEFORE_MS}} ({{120000}}), call {{secrets.fetch("ingest", now)}} to get a new secret.
- Iterate {{files}} in order; skip files not in {{NEW}} state. For each NEW file: if {{bucket.tryConsume(now)}} then set {{state = "PROCESSED"}} and {{token = secret.token}}; if out of tokens **stop this cycle** (break).
- After 3 cycles, any remaining NEW files become {{SKIPPED}}.`,
        hints: [
          'Write a private {{refill(now)}} used by both {{tryConsume}} and {{available}}; remember {{lastRefill += periods * refillIntervalMs}} instead of {{lastRefill = now}}.',
          'In {{run}}, compute {{now = startTime + cycle * CYCLE_MS}} for each cycle; keep {{secret}} outside the loop, only call {{fetch}} when null or {{expiresAtMs - now < ROTATE_BEFORE_MS}}.',
          'When {{tryConsume}} returns false, {{break}} — later cycles will have fresh tokens. Finally, one pass turns NEW into SKIPPED.',
        ],
        explain: `**TokenBucket**: lazy refill only does work when someone asks, so no background thread is needed, O(1) cost. The subtle point is keeping the fractional time: the test "keeps the leftover" verifies this — setting {{lastRefill = now}} would make the request at 2000ms rejected. {{Math.min(capacity, ...)}} caps the burst: idling for 1000 seconds still only accumulates 5 tokens, not 5000.

**IngestionLoop**: the order of steps within a cycle is deliberate — check the credential **before** processing, so no file is handled with a token about to expire. In the rotation test: at 0s we get t1 (expires at 200s); at 60s 140s remain ≥ 120s so we keep t1; at 120s 80s remain < 120s so we fetch t2 — hence the first 4 files use t1, the last 2 use t2.

Common mistakes:
- Comparing expiry against **elapsed time since start** instead of against {{now}}: works when startTime = 0 but breaks when startTime != 0 (the test "startTime != 0" catches this: at 620000 the token expires at 700000, only 80 seconds left).
- Calling {{fetch}} every cycle: wastes calls to the secret store, which may itself rate-limit you.
- Not {{break}} when tokens run out: the result might still be correct but wastes work; in real code each attempt is a 429 error.
- Forgetting to mark SKIPPED: files stuck at NEW, no way to distinguish "not yet due" from "forgotten due to a bug".

> Senior tip: In real code, don't write your own bucket if a library exists: Resilience4j {{RateLimiter}} or Bucket4j (also supports distributed buckets over Redis/Hazelcast). But check whether the library keeps the fractional time and uses a monotonic time source — those are exactly the two bugs this exercise trains you to spot.`,
      },
    ],
    check: [
      {
        q: 'What is the main advantage of token bucket over fixed window when rate-limiting API calls?',
        options: ['Easier to implement because it only needs one counter', 'No double burst at window boundaries; burst is always bounded by capacity', 'Uses zero memory', 'Guarantees the provider never returns 429'],
        answer: 1,
        explain: `Fixed window lets you pack two windows' quota into a few seconds around the boundary (double the limit). Token bucket refills continuously so in any interval the max is capacity + refill rate × time. "Easier to implement": actually fixed window is the one with just a counter. "Zero memory": the bucket still stores the token count and timestamp (very little, but not zero). "Never 429": the provider counts differently and the quota may be split across instances, so 429 can still happen.`,
      },
      {
        q: 'Why must the lazy-refill token bucket update {{lastRefill += periods * interval}} instead of {{lastRefill = now}}?',
        options: ['To avoid long overflow', 'To avoid discarding the fractional part of an incomplete period, keeping the configured refill rate accurate', 'To make the bucket refill faster than configured', 'Both ways give the same result'],
        answer: 1,
        explain: `Setting it to now throws away the remainder (e.g., the 500ms of a 1500ms arrival), so the next token arrives later and the actual rate drops below the configured rate. No overflow involved. The correct way does not refill faster — it just preserves the exact rate. The two are clearly different whenever a request lands off a period boundary.`,
      },
      {
        q: 'With pre-emptive rotation already in place, do you still need to handle 401 Unauthorized?',
        options: ['No, pre-emptive rotation guarantees you never hit 401', 'Yes: the token can be revoked early or clocks may skew; on 401, fetch a new token and retry exactly once', 'Yes: retry 401 indefinitely until it succeeds', 'No, 401 is always a configuration error'],
        answer: 1,
        explain: `Pre-emptive rotation eliminates most 401s but not all: tokens can be revoked, clocks across machines can drift. The standard fallback is refresh and retry once; if it is still 401, that is a configuration error. Infinite retries spam the provider and secret store. "401 is always a configuration error" is wrong because expired/revoked tokens also return 401.`,
      },
    ],
  },
});
