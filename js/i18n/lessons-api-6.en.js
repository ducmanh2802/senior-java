/*
 * English translation of js/data/lessons-api.js — task T1031. Format: js/core/i18n.js (content overlay).
 * ids: lesson-api-008
 */
App.i18n.content({
  'lesson-api-008': {
    title: 'Distributed rate limiter: sliding window counter vs token bucket, boundary burst',
    goals: [
      'Explain why fixed window suffers double-burst at the boundary and how sliding window counter approximately fixes it',
      'Compare token bucket and sliding window counter on accuracy, cost, burst tolerance, and suitable use cases',
      'Describe a real distributed rate-limit mechanism (Redis INCR/EXPIRE, atomic Lua script, gateway) and the simplifications in the simulation',
      'Implement both algorithms with a fake clock, determine retryAfter, and block boundary bursts',
    ],
    body: `### Summary
The two most common rate-limit algorithms are the **sliding window counter** and the **token bucket**. Both answer the question "may this request proceed?" but make different trade-offs: sliding window counter is cheap and easy to understand, token bucket allows natural bursts and reports exactly when a token will be available again. At senior level you must be able to state both formulas, the boundary error, and how to implement it atomically when the system runs multiple instances.

### Terms recap (first use in this lesson's context)
- **Rate limiter**: component in front of business logic deciding pass vs 429. Think of a ticket-checker at a gate: only 100 people per minute, the 101st waits for the next turn.
- **Time window**: fixed interval used for counting, e.g. 60 seconds.
- **Burst**: a rapid burst of requests in a short time. Mobile apps often burst on open (5 parallel API calls).
- **Atomic**: an operation that completes wholly without interleaving. If "read then add then write" is not atomic, two threads can both read 99, both add to 100, both pass — exceeding the limit.
- **Redis**: in-memory data store accessed by key, shared across application instances. {{INCR}} increments an integer by key and returns the new value; {{EXPIRE}} sets a TTL.
- **Lua script in Redis**: a small snippet running inside Redis as one atomic operation, used when you need "read - compute - write" seamlessly (e.g. token bucket).
- **Distributed**: multiple application instances serving traffic; if each keeps its own counter the effective limit multiplies by instance count, so the counter must live in a shared place (Redis) or at the gateway.

### 1) Fixed window and the double-burst boundary error
**What it is:** Fixed window divides time into fixed slots (00:00-00:59, 01:00-01:59...) and counts within the current slot. When the slot ends the count resets to 0.

**Why it breaks at the boundary:** Limit 100/min. At second 00:59, 100 requests pass (slot 1). At 01:00 a new slot starts, 100 more pass. Result: 200 requests in 2 seconds around the boundary, even though each slot alone is "correctly" 100/min. This is **boundary burst** — a classic error.

~~~text
Slot 1 [00:00 -------- 00:59]  100 req (pile at end of slot)
Slot 2 [01:00 -------- 01:59]  100 req (pile at start of slot)
                    ^^^
            200 req in ~2 seconds around the boundary
~~~

### 2) Sliding window counter: approximate formula
**What it is:** Instead of looking only at the current slot, combine the current slot with the **fraction elapsed** of the previous slot.

With a 60-second window, at second {{elapsed}} of the current slot (0 ≤ elapsed < 60), previous slot had {{prevCount}} requests, current slot has {{currCount}}:
- Fraction of previous slot still overlapping the sliding window: {{weight = (60 - elapsed) / 60}}
- Estimated requests in the last 60 seconds: {{estimate = prevCount * weight + currCount}}
- Pass if {{estimate < limit}}.

**Numeric example:** limit 100, previous slot 100 requests, now at second 6 of new slot (elapsed=6, weight=0.9), new slot already has 15. {{estimate = 100*0.9 + 15 = 105}} → reject. Thus a burst piled at the start of the new slot is blocked by the "trail" of the previous slot.

**Why only approximate:** It assumes requests in the previous slot were evenly distributed. In reality they may pile at the end (the boundary burst itself) — the formula {{prevCount * weight}} then slightly over- or under-shoots depending on distribution, but the error is small and the cost is minimal (just 2 counters + 1 multiplication).

**Real implementation (Redis, simplified):** two keys following {{rate:ID:prevWindow}} and {{rate:ID:currWindow}} (ID is the client id, prevWindow/currWindow are the previous and current slot indices), each key {{INCR}} on a request and {{EXPIRE}} after 2 windows for self-cleanup. Read both keys and apply the formula. To keep "read + decide" consistent under multiple instances, use a single Lua script (atomic in Redis). At large scale, gateways like NGINX, Kong, Envoy ship this kind of counter.

### 3) Token bucket: the token jar and natural bursts
**What it is:** A "jar" holding {{capacity}} tokens. The jar refills {{refillRate}} tokens per second (capped at capacity). Each request takes 1 token; an empty jar yields 429. Unused tokens accumulate up to capacity.

**Why natural bursts are allowed:** If the system is idle for 30 seconds the jar is full; when 10 requests arrive at once the first 10 take tokens immediately (a legitimate burst), and only the 11th must wait for refill. This matches real behavior: users should not be punished for "saving up" quota.

**Minimal state:** only {{tokens}} (current token count, a real number) and {{lastRefillTime}} (last refill instant). On a request: refill by {{(now - lastRefillTime) * refillRate}} (capped by capacity), update the instant, then try to subtract 1.

**Computing retryAfter:** if {{missing}} tokens are short, wait time = {{missing / refillRate}}. This is the precise value for the {{Retry-After}} header.

**Real implementation (Redis):** token bucket must update {{tokens}} and {{lastRefillTime}} together according to the current time — i.e. "read, compute against now, write" must be atomic. In practice use a Lua script in Redis (or a dedicated Redis module) and **pass {{now}} from the client as a parameter** so every instance computes against the same instant (a Lua script in Redis should not fetch the time itself, since that is non-deterministic / hard to reproduce; passing the time makes the logic deterministic).

~~~seq
title: Distributed token bucket via Redis Lua (simplified)
actors: Client | App Instance A | App Instance B | Redis
Client -> App Instance A: GET /orders (API key K)
App Instance A -> Redis: EVAL token_bucket.lua key=rl:K now=t1
note Redis: refill by (t1-last), subtract 1 token, persist - atomic
Redis --> App Instance A: OK, 9 tokens left
App Instance A --> Client: 200 OK
Client -> App Instance B: GET /orders (API key K, same time)
App Instance B -> Redis: EVAL token_bucket.lua key=rl:K now=t1
Redis --> App Instance B: OK, 8 tokens left (A changed it)
App Instance B --> Client: 200 OK
~~~

### 4) Quick comparison
| Criterion | Sliding window counter | Token bucket |
|---|---|---|
| Memory per client | 2 counters + window marker | 2 numbers (tokens, lastRefill) |
| Burst | Pulled by previous slot (blocks boundary burst fairly well) | Allows natural burst up to capacity |
| Accuracy | Approximate (assumes even distribution in previous slot) | Accurate against real time |
| retryAfter | Estimate (until the needed part of the window passes) | Exact (missing tokens / refill rate) |
| Atomicity when distributed | 2 keys, may use Lua; small errors sometimes acceptable | Needs Lua/script for read-compute-write as one step |
| Commonly used at | Simple gateway config, per-minute/hour quotas | Public APIs, SDKs, where legitimate burst and exact Retry-After matter |

### 5) Where the simulation simplifies
- **Fake clock:** exercises pass {{nowMillis}} on each call instead of {{System.nanoTime()}} or {{Thread.sleep()}} for deterministic tests. Real systems use real time; distributed systems must also tolerate small clock skew between machines (use Redis time or accept the small error).
- **Single process, single decision thread:** exercises need no {{synchronized}}/Lua; the goal is to understand the formula. Real systems must ensure atomicity (Lua script, {{synchronized}}, or a single-threaded gateway).
- **Single key:** exercises simulate one limiter; real systems have one counter/jar per API key (or IP, or user+endpoint) with TTL-based cleanup of stale keys.

### Common mistakes
- **Using fixed window while assuming safety:** boundary burst still lets roughly double the limit through in an instant.
- **Token bucket without capacity cap:** {{tokens}} grows unbounded while idle → then a huge burst slips through, defeating the protection.
- **Counter stored in each instance's memory:** 8 instances → effective limit ×8.
- **Forgetting atomicity when distributed:** separate read/write causes over-limit under high load (race condition).
- **Not returning {{Retry-After}}:** clients guess blindly, easily causing a retry storm — many clients retrying at once, worsening overload (covered in lesson 006).

### Interview link
Common question: "Design a rate limiter for a public API running on multiple instances, 100 requests/min per API key, allowing short bursts." Structured answer: (1) pick the algorithm (token bucket for legitimate burst + exact retryAfter, or sliding window counter if you accept approximation and want extreme cheapness); (2) put the counter in Redis/gateway, use a Lua script for atomicity; (3) key by API key, TTL for self-cleanup; (4) return 429 with {{Retry-After}} and {{RateLimit-*}}; (5) state the trade-offs (one extra Redis round-trip per request, small clock skew acceptable). Mentioning fixed window's boundary burst is a big plus.

> Senior tip: The algorithm is only half the problem. The other half is **operations**: limits must be tiered (by IP to block bots, by API key for fairness, by endpoint since {{POST /payments}} is costlier than {{GET /health}}), customers need a dashboard to view their usage, and you must measure "how many requests were blocked" to distinguish bad clients from good ones wrongly throttled (a sign of a mis-set limit).`,
    exercises: [
      {
        title: 'Implement SlidingWindowCounter and TokenBucket with a fake clock, blocking boundary bursts',
        prompt: `Implement two rate-limit classes, both using a **fake clock** (parameter {{nowMillis}}, milliseconds, never going backwards between calls on the same instance). No {{Thread.sleep}}, no {{System.nanoTime()}}, no I/O.

1) {{class SlidingWindowCounter}}
- Constructor: {{SlidingWindowCounter(int limit, long windowMillis)}} with {{limit > 0}}, {{windowMillis > 0}}.
- {{boolean tryAcquire(long nowMillis)}}: returns {{true}} if the request is allowed (and records it), {{false}} if over limit.
- {{long retryAfterMillis(long nowMillis)}}: milliseconds to wait (rounded **up** to the millisecond) for an estimated chance to be allowed; returns 0 if currently allowed.
- Algorithm: divide time into fixed slots of length {{windowMillis}}. Current slot index {{currIdx = floor(nowMillis / windowMillis)}}, elapsed time in slot {{elapsed = nowMillis - currIdx*windowMillis}}. Let {{prev}} be requests recorded in the immediately previous slot ({{currIdx-1}}), {{curr}} those in the current slot. Previous-slot weight: {{weight = (windowMillis - elapsed) / (double) windowMillis}}. Estimate: {{estimate = prev*weight + curr}}.
  - Allow (and increment {{curr}}) when {{estimate < limit}}. Comparison uses {{<}} on the double value.
  - {{retryAfterMillis}}: if {{estimate < limit}} returns 0. Otherwise find the minimum wait {{d >= 0}} (milliseconds) such that at {{t = nowMillis + d}} the estimate < {{limit}}; if it crosses into a new slot, compute against that slot's state. Result is rounded up ({{ceil}}). Does not record a request.
  - When moving to a new slot, the old "current" becomes "previous"; if more than 1 slot is skipped, previous is treated as 0.

2) {{class TokenBucket}}
- Constructor: {{TokenBucket(double capacity, double refillPerSecond)}} with {{capacity > 0}}, {{refillPerSecond > 0}}. Starts **full** ({{capacity}} tokens) at the first call's time.
- {{boolean tryAcquire(long nowMillis)}}: refill tokens by elapsed time (capped at {{capacity}}), update the time marker, then if >= 1 token subtract 1 and return {{true}}, else {{false}}.
- {{long retryAfterMillis(long nowMillis)}}: if after refilling (hypothetical, **without** changing state) there are >= 1 tokens, returns 0; otherwise returns the wait time (rounded up) to have enough for 1 token.

Both classes must work correctly when {{nowMillis}} stays constant (many requests at the same instant) and when jumping far forward.`,
        hints: [
          'Sliding window: use {{Math.floorDiv(nowMillis, windowMillis)}} to get the slot index. When {{idx}} jumps more than 1 slot, set {{prevCount = 0}} because the immediately previous slot has no data.',
          'Token bucket: split a "refill returning hypothetical tokens" function shared by both {{tryAcquire}} and {{retryAfterMillis}}; only {{tryAcquire}} writes {{lastMillis}} and {{tokens}}. Initialize {{lastMillis}} on the first call so the bucket starts full at that instant.',
          'Boundary burst: at elapsed=6ms, window=1000ms, prev=100, curr=0, limit=100, estimate = 99.4; the first request is accepted but the second (curr becomes 1) must be blocked.',
        ],
        explain: `### Sliding window counter
The key point is {{rotate/estimate}}: when moving to the next slot, push {{currCount}} down to {{prevCount}}; if jumping further (long idle) then {{prevCount}} must reset to 0. The formula {{prev * (windowMillis - elapsed) / windowMillis + curr}} is linear interpolation: the further the previous slot is (large elapsed, small weight) the less it contributes.

### Token bucket
Splitting {{refilled(nowMillis)}} (pure computation) lets {{retryAfterMillis}} stay side-effect-free — a common bug is the "preview" function updating {{lastMillis}}, making a later {{tryAcquire}} compute wrongly. Capping by {{capacity}} is mandatory: without it, after idle time {{tokens}} grows unbounded and a huge burst slips through.

### Why the fake {{nowMillis}}
Tests must be deterministic: same input gives same output. Passing a fake clock lets you build the boundary scenario exactly (990ms then 1006ms). Real systems use real time/Redis and must accept small clock skew.`,
      },
    ],
    check: [
      {
        q: 'Why can a fixed window (100 requests/min) still let 200 requests through in about 2 seconds?',
        options: [
          'Because the counter overflows at the minute boundary',
          'Because 100 requests pile at the end of the previous slot and 100 at the start of the next slot are each valid within their own slot (boundary burst)',
          'Because fixed window never resets the counter',
          'Because the client can send many connections in parallel',
        ],
        answer: 1,
        explain: 'Fixed window resets the counter per fixed slot independently. 100 requests valid at 00:59 (slot 1) plus 100 valid at 01:00 (slot 2) add up to 200 requests in ~2 seconds around the boundary. Sliding window counter fixes this by weighting the previous slot.',
      },
      {
        q: 'In the sliding window counter, {{estimate = prevCount * weight + currCount}} implicitly assumes what?',
        options: [
          'All requests in the current slot arrive at the end of it',
          'Requests in the previous slot are evenly distributed (so the part still overlapping the sliding window is proportional to weight)',
          'Each client sends exactly one request per slot',
          'All servers have perfectly synchronized clocks',
        ],
        answer: 1,
        explain: 'The formula implicitly assumes even distribution in the previous slot, so it is only an approximation (small error), traded for extremely low cost: just 2 counters.',
      },
      {
        q: 'What is the standout advantage of token bucket over sliding window counter?',
        options: [
          'It never needs to store state',
          'It allows natural bursts up to capacity (quota "saved up") and computes retryAfter exactly from the refill rate',
          'It is always perfectly accurate without any atomic operation when distributed',
          'It can never be exceeded in any case',
        ],
        answer: 1,
        explain: 'Token bucket keeps unused tokens (up to capacity) so it accepts legitimate bursts, and retryAfter = missing tokens / refill rate is exact. When distributed it still needs atomic updates (Lua script).',
      },
      {
        q: 'When running an app on 6 instances, why is a counter in a JVM variable wrong?',
        options: [
          'Because the JVM does not support integers large enough',
          'Because each instance keeps its own counter so the effective limit multiplies and depends on how the load balancer distributes traffic',
          'Because a JVM variable is not thread-safe',
          'Because only the gateway can read HTTP headers',
        ],
        answer: 1,
        explain: 'Rate-limit state must be shared (Redis/gateway). Per-instance counters break the total limit; updates must also be atomic to avoid race conditions.',
      },
    ],
  },
});
