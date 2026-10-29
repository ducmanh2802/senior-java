/*
 * English translation of js/data/lessons-security.js — task T462, re-synced with the Vietnamese source in T502.
 * Format: js/core/i18n.js (content overlay).
 * ids: lesson-security-003
 */
App.i18n.content({
  'lesson-security-003': {
    title: 'Rate limiting with a token bucket: bursts, refill and an injected clock',
    goals: [
      'Explain that a token bucket is defined by exactly two numbers — capacity (how large a burst you accept at once) and refill rate (the sustained speed) — and choose them from the SLA (the service-level agreement: the written promise on throughput and latency)',
      'Implement refill-on-demand with an injected clock so the tests are deterministic and never read real time',
      'Compare the token bucket with the fixed window and the sliding window (log and counter), and explain how to enforce one shared limit across many servers with Redis',
    ],
    body: `### A token bucket: two parameters instead of one number
A requirement such as "at most 100 requests/minute" says nothing about whether those 100 requests arrive inside the first 100 milliseconds or are spread evenly over the whole minute. A token bucket separates those two ideas into two numbers:

- **capacity** (also called **burst**): the maximum number of tokens the bucket can hold — the burst you accept at one instant (for example 20 requests landing in the same second).
- **refill rate**: how many tokens are added per unit of time — the sustained rate you allow in the long run (for example 100 requests per minute, however they are spread out).

Every request "withdraws" one token: if one is available the request passes and the token is subtracted; if not, it is rejected with HTTP **429 Too Many Requests**. When the bucket is full, refilling stops, because any extra token would be clipped back at {{capacity}}.

~~~java
// refill-on-demand: no timer, no dedicated thread per bucket
private void refill(long nowMs) {
    if (nowMs <= lastRefillMs) return;                 // clock went backwards: mint no extra tokens
    tokens = Math.min(capacity, tokens + (nowMs - lastRefillMs) * refillPerMs);
    lastRefillMs = nowMs;
}
~~~

Every check is O(1) and the refill is computed only when somebody calls in. That is why **refill-on-demand** (work out the refill lazily, at the moment of the request) is far more common than keeping a timer thread that feeds tokens into every bucket.

### The clock is passed in, not read inside
If {{tryAcquire}} called {{System.currentTimeMillis}} itself, a test would have to {{Thread.sleep}} before it could observe a refill: slow, flaky on CI, and it could never reproduce "the clock running backwards" or "the clock jumping ahead" — two situations that really happen when **NTP** (Network Time Protocol: the service that keeps the machine clock aligned with time servers, and occasionally steps it backwards) adjusts a machine. Passing {{nowMs}} in (or taking a time supplier in the constructor) turns every situation into plain input data:

~~~java
bucket.tryAcquire(0);        // full: drains all 5 tokens
bucket.tryAcquire(3);        // 3 ms later with a rate of 1 token/ms: exactly 3 tokens have been refilled
bucket.tryAcquire(-500);     // clock went backwards: no extra tokens may be minted
~~~

In production, inside a single **JVM** (the Java process running your application) you pass time from a **monotonic** source — {{System.nanoTime()}} divided by 1,000,000, a clock that only ever moves forward even when the wall clock is corrected — instead of {{currentTimeMillis}} (which can move backwards when NTP corrects it). When the bucket lives in Redis for many instances, use **Redis's own clock** (the {{TIME}} command inside the Lua script) as the single source, so machines whose clocks disagree cannot corrupt the refill arithmetic.

### Comparing rate-limiting algorithms
| Algorithm | Pros | Cons |
|---|---|---|
| Fixed window | simple, O(1) memory | bursts at the boundary: 100 requests at the end of minute 1 + 100 requests at the start of minute 2 = 200 requests in a couple of seconds |
| Sliding window log | absolutely accurate (every request timestamp is kept) | memory O(number of requests in the window) |
| Sliding window counter | a balance between accuracy and memory | an estimate, not absolutely accurate |
| Token bucket | controlled bursts, O(1) | you must tune both capacity and rate |
| Leaky bucket | even output, smooths traffic for downstream services | no bursts allowed; requests must queue and wait |

### In production
- **Key**: per IP (the client's network address), per user, or both, together with a **cap on the number of buckets** — an LRU map (least recently used: when the map is full, the bucket nobody has touched for the longest time is evicted) — so an attacker creating millions of fake keys cannot balloon memory.
- **Concurrency**: reading and writing {{tokens}} is a read-modify-write; use {{synchronized}} (fast enough because the critical section is tiny) or a CAS loop (compare-and-swap: retry the update if another thread changed the value in the meantime) on {{AtomicLong}}, so two threads cannot withdraw the same token. The Bucket4j library does all of this for you, including the distributed version.
- **Distribution**: a bucket sitting in each instance's own RAM multiplies the total allowance by the number of instances (five servers at 100 requests/minute each = 500 requests/minute in total). Put the bucket in **Redis** (an in-memory key-value store that all your servers talk to — effectively a shared HashMap living outside the JVMs) behind a **Lua script**: Lua runs inside Redis as one atomic step (read, refill, subtract and write back in a single script), so two servers cannot race. A dedicated gateway is the other common place to enforce the limit.
- **Response**: return {{429}} with a {{Retry-After}} header holding the number of seconds until the next attempt, and make clients add **jitter** (a small random delay) when they retry, so the whole herd does not come back at the same instant.
- **Capacity vs rate**: capacity = the burst you truly accept, rate = the sustained level in the contract. For example "100 requests/minute, allow a burst of 20" gives capacity 20 and a rate of 100/60 ≈ 1.67 tokens/second. Setting capacity 100 and rate 100 tokens/second means allowing a burst of up to 100 requests and a sustained 6000 requests/minute — far beyond the limit.

### Common traps
- Reading real time inside the logic and then testing with {{Thread.sleep}}: slow tests, occasional failures, and clock skew (two machines disagreeing about "now") cannot be reproduced.
- Refilling with a timer thread for **each** bucket: a few thousand buckets means a few thousand timers; refill-on-demand needs none.
- Comparing {{tokens}} with {{==}} on floating point, or refilling tokens but forgetting to update {{lastRefillMs}} — tokens get refilled again and again for the same interval.
- Not capping the number of buckets (one object per IP) — scanning fake IPs turns into a memory leak.
- Confusing rate limiting with a quota: rate limiting caps frequency, a quota caps the total amount in a period (for example 10,000 calls per month).

### Interview relevance
Interviewers often ask: "which rate-limiting algorithm would you choose, and why?", "how do you keep it correct across many instances?", "what do you do when the clocks on two machines disagree?", "how do you return {{429}} to clients properly?". Once you finish the two exercises below — a token bucket with an injected clock and a sliding window log — you have enough material to answer all four questions with your own code.`,
    exercises: [
      {
        title: 'Write TokenBucket: capacity, refill rate and an injected clock',
        prompt: `Complete {{TokenBucket}} — a token-bucket rate limiter that is fully deterministic (the test supplies the time):

- {{TokenBucket(capacity, tokensPerSecond, nowMs)}}: the bucket starts **full**, with {{capacity}} tokens; {{refillPerMs}} = {{tokensPerSecond / 1000.0}}. An invalid capacity or rate throws {{IllegalArgumentException}}.
- {{tryAcquire(nowMs)}}: refill the tokens for the time that has elapsed (capped at {{capacity}}), then subtract 1 if there are enough; return false if not. {{tryAcquire(nowMs, permits)}} does the same for a larger number of tokens.
- {{available(nowMs)}}: the number of tokens available after refilling; {{retryAfterMs(nowMs)}}: 0 if a token can be taken right now, otherwise the number of milliseconds until the next possible attempt.
- A backwards clock ({{nowMs}} earlier than the latest time seen) must **not** mint extra tokens.

Use only the JDK, never real time.`,
        hints: [
          'Refill lazily (on demand): on each call compute {{tokens += (nowMs - lastRefillMs) * refillPerMs}}, clip it at {{capacity}}, and only then set {{lastRefillMs = nowMs}}.',
          'Only refill when {{nowMs > lastRefillMs}}; on a backwards clock skip entirely, and never write {{lastRefillMs}} back to a smaller value.',
          '{{tryAcquire(nowMs, permits)}}: if {{permits > capacity}} always return false (there can never be enough tokens), otherwise compare {{tokens >= permits}} and subtract once.',
        ],
        explain: `Refill-on-demand is the key point: no timer feeds tokens, so there is no thread, no race with a "refill job", and every behaviour depends only on the pair of times you pass in. {{lastRefillMs}} must be updated **after** refilling, otherwise the same interval gets refilled a second time.

The classic mistake is to use {{System.currentTimeMillis}} internally: tests have to {{Thread.sleep}}, so they are slow and flaky on CI, and you cannot simulate a clock that jumps ahead or runs backwards — yet NTP really can move the system clock backwards. Handle it by skipping when {{nowMs <= lastRefillMs}}: do not trust a clock that goes backwards, and the bucket keeps its token count.

On floating point: the tests use a rate of 1000 tokens/second, so {{refillPerMs = 1.0}} and every value is an exact integer. With a rate such as 3 tokens/second ({{0.003}} per ms), {{tokens}} carries a small rounding error, so never compare {{tokens}} with {{==}}; production often stores tokens in smaller integer units (for example {{long}} "milli-tokens") to avoid the error entirely. One more note: the constructor takes a {{long tokensPerSecond}}, so it cannot represent "100 requests/minute" (1.67 tokens/second); a real version should take a {{(tokens, Duration)}} pair like Bucket4j.`,
      },
      {
        title: 'Write SlidingWindow: an exact limit inside a sliding window',
        prompt: `Complete {{SlidingWindow}} — a limit based on a **sliding window** (a log of the recent requests: absolutely exact, no fudging at the boundary):

- {{SlidingWindow(windowMs, maxPermits, nowMs)}}: the window is {{windowMs}} milliseconds long and allows at most {{maxPermits}} requests inside it. Invalid parameters throw {{IllegalArgumentException}}.
- {{tryAcquire(nowMs)}}: a request counts at time {{nowMs}} if, after dropping the requests that have left the window, fewer than {{maxPermits}} remain; if it passes, record the request.
- {{count(nowMs)}}: the number of requests still inside the window at {{nowMs}}.
- A request at {{t}} is considered expired when {{nowMs - t >= windowMs}}. A backwards clock freezes: the window must not widen.

Use only the JDK, never real time.`,
        hints: [
          'Keep the timestamps in an {{ArrayDeque}} (a double-ended queue with cheap insert/remove at both ends) in ascending order; before deciding, remove from the head every timestamp with {{nowMs - t >= windowMs}}.',
          'Remember {{clock = max(nowMs, clock)}} so a clock running backwards cannot widen the window; every operation uses this frozen value.',
          'When {{hits.size() >= maxPermits}} reject; otherwise {{addLast}} the frozen timestamp and then return true.',
        ],
        explain: `A sliding window log is absolutely exact because you keep **every** timestamp instead of counting per fixed frame: the "100 requests at the end of the previous window + 100 requests at the start of the next one" pattern can no longer slip through within a few seconds around the boundary the way it does with a fixed window. In exchange, memory is proportional to the number of requests in the window, so you must prune diligently — the {{while}} at the front of the deque is O(1) amortised per request because each timestamp is removed exactly once.

The expiry condition decides the behaviour at the boundary: with {{nowMs - t >= windowMs}}, a hit at 0 ms expires exactly when the clock reaches 1000 ms. Choosing {{>}} or {{>=}} must be consistent everywhere (code, tests, client documentation), otherwise you are off by one request at the boundary.

A backwards clock is handled by freezing: if NTP pulls the time back, you **do not** want old hits to come back to life or the window to open up — that is why {{freeze}} takes the max with the {{clock}} already seen. The exercise uses a deque, so memory is O(n); production with a large window (for example 1 minute and 10 thousand requests) usually switches to a sliding window counter to keep O(1), or caps the deque size to prevent a memory leak under scanning. Distinguish this from the token bucket: a bucket allows controlled bursts, while a sliding window is exact per window — the two solve different problems.`,
      },
    ],
    check: [
      {
        q: 'A bucket has {{capacity = 10}} and {{tokensPerSecond = 5}}; you drain a full bucket completely, how many tokens does it hold 1 second later?',
        options: [
          '0 because tokens are only granted the moment a request arrives',
          '5 — the rate determines the refill, capacity is only the ceiling',
          '10 because capacity determines the refill',
          'Undeterminable because it depends on the system time',
        ],
        answer: 1,
        explain: `After 1 second the bucket refills {{5 × 1}} = 5 tokens, going from 0 to 5 — it has not reached the ceiling of 10, so it is not clipped. Capacity = 10 only means the bucket **can** hold up to 10 tokens if you wait long enough (2 seconds to fill); it is not the refill speed. Refilling does not depend on the system time because it uses exactly the time you pass in, so the "undeterminable" option is wrong.`,
      },
      {
        q: 'Why pass {{nowMs}} into {{tryAcquire}} instead of calling {{System.currentTimeMillis}} inside?',
        options: [
          'Because {{System.currentTimeMillis}} is many times slower than {{nanoTime}}',
          'To make the logic deterministic: tests can reproduce every situation (backwards clock, jumps) without sleeping, while production still passes real time from a single source',
          'Because the JVM forbids calling time functions inside security code',
          'Because the system clock is always off by exactly 1 second',
        ],
        answer: 1,
        explain: `The real reason is **testability and reproducibility**: with time passed in, you simulate minutes, seconds and even a backwards clock just by changing the argument, while the test still runs in milliseconds. Otherwise you must {{Thread.sleep}} (slow, flaky on CI) and can never create a backwards-clock situation. {{System.currentTimeMillis}} is not meaningfully slow, the JVM does not forbid it, and NTP skew is not a fixed 1 second.`,
      },
      {
        q: 'The requirement is "each user at most 100 requests/minute, while also allowing an immediate burst of 20 requests". Which configuration fits best?',
        options: [
          'Fixed window of 60 seconds with a limit of 100',
          'Sliding window log keeping the 100 most recent timestamps',
          'Token bucket: {{capacity = 20}} for bursts, with a refill rate equivalent to 100 requests per minute',
          'Token bucket: {{capacity = 100}} and {{tokensPerSecond = 100}}',
        ],
        answer: 2,
        explain: `The burst of 20 is exactly the {{capacity}}, while 100/minute is the refill rate — precisely the two parameters of a token bucket. A fixed window of 100 allows 100 requests right at the start of the window (beyond the allowed burst) and another 100 right before the boundary; a sliding log meets the requirement but costs memory proportional to the number of timestamps in the window; and {{capacity = 100}} with {{tokensPerSecond = 100}} allows a burst of 100 (too large) and a sustained 6000/minute (far beyond the limit).`,
      },
    ],
  },
});
