/*
 * English translation of js/data/lessons-api.js — task T1029. Format: js/core/i18n.js (content overlay).
 * ids: lesson-api-006
 */
App.i18n.content({
  'lesson-api-006': {
    title: '429 Too Many Requests: Retry-After, RateLimit-* and a client that respects the limit',
    goals: [
      'Explain how 429 differs from 403 and 503, and why the client needs {{Retry-After}} instead of guessing',
      'Read and write the {{Retry-After}}, {{RateLimit-Limit}}, {{RateLimit-Remaining}}, {{RateLimit-Reset}} headers correctly',
      'Write a correct retrying client: exponential backoff + deterministic jitter, honoring Retry-After, and never retrying a POST that is missing an {{Idempotency-Key}}',
      'Choose a rate-limit algorithm (fixed window, sliding window, token bucket) and where to keep the counter when running multiple instances',
    ],
    body: `### What it is: 429 is a refusal with "a time to come back"
**Summary:** {{429 Too Many Requests}} means the request is perfectly valid (correct token, correct syntax) but the client is calling **too fast**, so the server temporarily refuses it. It differs from {{401}}/{{403}} (an identity/permission problem, retrying is useless) and from {{503}} (the server is overloaded or under maintenance, not the client's fault). The thing that makes 429 useful is the {{Retry-After}} header — the server tells the client exactly **how long to wait before coming back**, so the client does not have to guess.

Terms that appear for the first time; read them slowly because every example below reuses them:
- **Rate limit (speed limit)**: a ceiling on how many requests a client may send in a unit of time, e.g. 100 requests/minute per API key. Like a traffic light that allows at most 600 cars per hour through an intersection.
- **Quota (allowance per period)**: the total amount that may be used over a longer period, e.g. 1 million requests/month. A rate limit protects CPU and the connection pool; a quota protects operating capacity and the bill.
- **Throttle (squeeze traffic)**: slow the client down instead of blocking it outright, e.g. by queueing or reducing bandwidth.
- **Backoff**: wait a little longer between each retry: 100 ms, 200 ms, 400 ms...
- **Jitter (random noise)**: add a random amount to the wait time. Picture 5,000 clients all receiving 429 at 10:00:00 and all scheduling a retry exactly 10 seconds later — without jitter, all 5,000 requests slam in during the same second and knock the just-recovered system over again. Jitter spreads them across many different seconds.
- **Retry storm**: exactly the phenomenon just described.
- **Retry budget**: a cap on the share of requests that may be retries, e.g. "no more than 20% of requests in the last 10 seconds". If the budget is exceeded, treat it as a real failure, stop retrying, and **raise an alert** instead of digging the hole deeper.
- **Idempotent**: calling once or many times with the same data leaves the same final state (GET, PUT, DELETE). POST is not, so blindly retrying a POST can charge money twice.

### Why you must throttle, and where to do it
Every request consumes a finite resource: a thread (Java 21 can use a **virtual thread** — an ultra-lightweight thread managed by the JVM, so you can create millions of them without the RAM cost of OS threads), a slot in the **connection pool** (a group of DB connections opened in advance for reuse, because opening a new DB connection takes a few dozen ms), a few KB of RAM. Without a limit, one buggy client (a loop calling the API nonstop) or a traffic shock (a flash sale) will grab everything and **all** customers die together — the "one bad apple spoils the barrel" effect.

Throttling must sit **in front of** the business layer: at the gateway/API edge, or in a filter/interceptor early in the application. If a request has already reached the service before being refused, the DB and connection pool have already taken the full hit — meaning you throttled to... protect the developer's feelings, not to protect the system.

### Request-counting algorithms
| Algorithm | How it works | Pros | Cons |
|---|---|---|---|
| **Fixed window** | Count inside the "current minute" slot; over the limit you block; reset to 0 at the start of the next minute | 1 counter, extremely cheap | Allows a double-burst edge case: 100 requests at 10:00:59 + 100 requests at 10:01:01 = 200 requests in 2 seconds, yet neither window exceeds "100/minute" |
| **Sliding window log** | Store the timestamp of **every** request and count how many fall in the last 60 seconds | Perfectly accurate | Memory grows with the number of requests |
| **Sliding window counter** | Count the current window plus a weighted share of the previous window that has already slid by | Cheap, approximately correct | Only an estimate |
| **Token bucket** | A bucket of capacity B is refilled at r tokens/second. Each request takes 1 token; an empty bucket means 429. After running at full speed you can still "burst" B requests in a row | Allows natural bursts; needs only 2 numbers (tokens, lastRefill) to describe **one client**, which is why it can run at the **API edge** (the gateway tier where a request first touches your system) | A bit more math than a fixed window; needs synchronization when many threads take tokens at once |

Token bucket is the most popular choice for public APIs because it captures the intent "on average 100/minute, still allowed a short burst within the limit".

~~~java
// A pure-JDK token bucket: capacity 100 tokens, fully refilled with 100 tokens every 60 seconds.
class TokenBucket {
    private static final double CAPACITY = 100;
    private static final long REFILL_NANOS = 60_000_000_000L;   // 60 seconds
    private double tokens = CAPACITY;
    private long last = System.nanoTime();

    synchronized boolean tryConsume() {
        long now = System.nanoTime();
        tokens = Math.min(CAPACITY, tokens + (now - last) / (double) REFILL_NANOS * CAPACITY);
        last = now;
        if (tokens < 1) return false;
        tokens -= 1;
        return true;
    }

    // How many seconds until at least 1 token is available again? This is the value for Retry-After.
    synchronized long retryAfterSeconds() {
        double missing = Math.max(0, 1 - tokens);
        return (long) Math.ceil(missing / CAPACITY * 60);
    }
}
~~~

### Server-side headers: two groups, do not confuse them
**Group 1 — {{Retry-After}}** (sent with 429 and 503; RFC 9110 defines it for 503 and 3xx, and API vendors use it for 429 as well). There are only **two** formats:
- Seconds: {{Retry-After: 12}} — "wait 12 seconds". Easiest for the client.
- HTTP-date: {{Retry-After: Wed, 21 Oct 2026 07:28:00 GMT}} — "wait until this moment". **Depends on the clocks on both sides**: clock skew means skewed wait time, so prefer the seconds form.

**Group 2 — {{RateLimit-*}}** lets the client know **how much is left** so it can self-regulate before being blocked:
- {{RateLimit-Limit}}: the allowance for the window (100).
- {{RateLimit-Remaining}}: how many requests remain in the window.
- {{RateLimit-Reset}}: **how many seconds** until the window refills tokens (an older IETF draft defined it as an epoch timestamp; a newer draft uses a number of seconds — so when reading a partner's API, consult their docs instead of guessing).

The current IETF draft merges these into a single structured-field header, e.g. {{RateLimit: "account";r=49;t=12}}, which allows several limits at once (per account, per IP). In practice most APIs still return the three separate headers, and any decent SDK can read both styles.

Golden rule: **{{RateLimit-Remaining}} is information, {{Retry-After}} is an order.** The server is still free to return 429 earlier (it is scaling down), so the client may only trust Retry-After absolutely.

### The full flow across several tiers
~~~seq
title: Client respects 429 + Retry-After
actors: App | Gateway | Redis | Service
App -> Gateway: GET /orders (carries API key)
Gateway -> Redis: tryConsume key=ratelimit:acct42
Redis --> Gateway: OK, 48 tokens left
Gateway -> Service: forward request
Service --> Gateway: 200 OK, order list
Gateway --> App: 200 + RateLimit-Remaining: 47
App -> Gateway: 101st request in the same minute
Gateway -> Redis: tryConsume
Redis --> Gateway: EMPTY, bucket is dry
note Gateway: do not forward; generate 429 at the edge
Gateway --> App: 429 + Retry-After: 12
note App: wait 12s + jitter, only retry because it is GET
App -> Gateway: GET /orders after 12 seconds
Gateway --> App: 200 OK
~~~

Why must the counter live in **Redis** (Redis = an in-memory key-value store, addressed by key name, shared by every instance) and not in a JVM variable? Because the application runs 6 instances behind a load balancer: if each instance keeps its own counter, the real limit becomes 600/minute even though you advertise 100/minute. This is a classic scale-out mistake. The trade-off is that every request gains one Redis round trip (a few ms), so people often count **locally + globally** (each instance keeps a rough local allowance and periodically reports to Redis to debit the total) or use Redis with a single atomic {{EVAL}}.

### A correct client: write it once, every SDK reuses it
~~~java
Response send(Request req) {
    int attempt = 0;
    while (true) {
        attempt++;
        Response r = http.execute(req);
        boolean retryable = (r.status() == 429 || r.status() == 503);
        boolean safe = !req.method().equals("POST") || req.header("Idempotency-Key") != null;
        if (!retryable || !safe || attempt >= MAX_ATTEMPTS) return r;
        sleep(backoff(r, attempt));        // only interrupt early when the caller's total deadline has expired
    }
}

long backoff(Response r, int attempt) {
    String ra = r.header("Retry-After");
    if (ra != null) return retryAfterMillis(ra);          // 1) listen to whatever the server says
    long d = Math.min(MAX_DELAY, BASE_DELAY << (attempt - 1));  // 2) exponential: 100, 200, 400...
    return d / 2 + random.nextLong(d / 2 + 1);            // 3) "equal jitter": [d/2, d]
}
~~~
Four design decisions you must be able to explain in an interview:
1. **Honor {{Retry-After}} first**, compute your own delay only when the server says nothing. The server knows when your token bucket refills; the client does not.
2. **Exponential backoff** (double the delay each try) to spread the load, and **cap** it (e.g. 10-30 seconds) so you do not wait past the user's deadline.
3. **Jitter** so thousands of clients do not retry at the same instant. Two common variants: *full jitter* ({{random(0, d)}}) and *equal jitter* ({{d/2 + random(0, d/2)}} — still guarantees a minimum rest, with less bunching).
4. **Never retry a non-idempotent request.** A POST without an {{Idempotency-Key}} receiving 429 means "call again later after creating a new key", not "resend the exact same thing". If you must retry a POST, you must resend the **same** key (lessons 3 and 4 of this track).

You also need an **overall deadline**: 5 retries with backoff can consume more than 30 seconds, while the user left the screen after 3 seconds. A good SDK always accepts a {{timeout}} from the caller and cancels midway when the time runs out.

### Common mistakes
- **Returning 429 without {{Retry-After}}**: the client is forced to guess, and most guess "immediately" → it creates a retry storm by itself.
- **Counting by IP** for customers behind a corporate proxy: 200 employees share one IP, the whole company is blocked because of one person. Count by API key/user; IP is only a secondary layer.
- **One limit per instance** as described above.
- **Retrying errors that will never recover**: retries are only for **transient** errors (429, 503, network timeouts). Retrying on {{400}}/{{401}}/{{403}}/{{422}} only slows the user down and hides the real bug.
- **Forgetting a retry budget and alerting**: if 429 persists, that is an incident, not something the SDK should silently handle. Count retries and push them to metrics.
- **Letting retries break the caller's deadline** or retrying forever (missing {{maxAttempts}}) — an infinite loop when the server keeps failing.
- **Missing client-side warnings**: 429 should be logged with its own label; if you lump it into "network error", nobody will know the next morning that a partner throttled you.

### Interview notes
A typical question: "Your public API runs 8 instances behind a load balancer and a partner complains about unfair 429s. How do you investigate and fix it?" A scoring structure:
1. **Locate the counter**: 8 instances, each with an in-JVM counter → the real limit is 8x and varies with routing; move the counter to Redis (atomic command) or down to the API gateway.
2. **Check the counting unit**: by IP or by API key? Behind a corporate NAT, IP is the wrong unit.
3. **Response quality**: does 429 include {{Retry-After}} and {{RateLimit-Remaining}}; is there a {{Request-Id}} to correlate logs on both sides?
4. **Client side**: does the SDK have backoff + jitter, maxAttempts, and does it respect idempotency?
5. **Policy**: per-customer limits (tiers), per-endpoint limits ({{POST /payments}} is more expensive than {{GET /health}}), and a **self-service** view so customers can see their own usage.

Bonus point: explain that rate limiting is part of **graceful degradation** (the system deliberately sacrifices part of the service so the rest stays alive) — block the right actors so 99% of good customers keep running, instead of letting the system die for everyone.

> **Senior tip:** Three details that separate someone who has operated a public API. (1) Always return {{Retry-After}} for 429 **and** 503, even if you only estimate "1 second" — a wrong number is still better than nothing. (2) Return 429 **as early as possible**: at the edge, before validating the JWT and before touching the DB; if the rate-limit filter runs after the auth filter, an attacker still makes you spend resources on authentication. (3) Consider 429 **before the request**: if {{RateLimit-Remaining}} = 0 then proactively wait 150 ms instead of calling and receiving 429 — you save a round trip for both sides, and the partner is not counted as "a misbehaving client".`,
    exercises: [
      {
        title: 'RetryClient: read Retry-After, deterministic backoff + jitter, never retry a POST without an Idempotency-Key',
        prompt: `Write {{class RetryClient}} that calls a fake server under the contract below. Everything is **deterministic**: it uses a fake clock, and you must not call {{Thread.sleep}} or use real time.

Types that are already provided (do not change their signatures):
- {{FakeServer}} — an interface with exactly one method, {{Response handle(Request req)}}, the fake server returns one {{Response}} for each call.
- {{record Request(String method, String path, Map<String, String> headers)}} — {{header(name)}} looks up **case-insensitively**.
- {{record Response(int status, Map<String, String> headers)}} — header keys in this map are already lowercased; {{header(name)}} reads by name.
- {{class FakeClock}} — {{long now()}}, {{void advance(long deltaMillis)}}.
- {{class RetryPolicy}} — {{int maxAttempts}} (total number of server calls, counting the first, >= 1), {{long baseDelayMs}}, {{long maxDelayMs}} (cap on a single backoff step), {{long seed}}.

Signature to implement: {{Response send(Request req)}}.

Processing rules, applied in order:
1. Call {{server.handle(req)}}. Count the number of calls so far as {{attempt}} (the first call is 1).
2. Return {{resp}} immediately (no wait) if **at least one** of these is true:
   - {{resp.status()}} is neither 429 nor 503.
   - {{attempt >= policy.maxAttempts}} (budget exhausted — return the very last response received).
   - {{req.method()}} is {{POST}} and the request has **no** {{Idempotency-Key}} header. Reason: retrying a non-idempotent request can create duplicate records; being safe beats being polite.
3. Otherwise, compute the wait {{wait}}, call {{clock.advance(wait)}}, and go back to step 1:
   - If {{resp}} has a non-empty {{retry-after}} header, **use it** and ignore backoff and jitter. {{retry-after}} is an integer number of seconds (e.g. {{"7"}} means 7000 ms) **or** an HTTP-date in RFC 1123 form (e.g. {{"Tue, 14 Nov 2023 22:13:50 GMT"}}); for an HTTP-date, {{wait}} = that moment minus {{clock.now()}}, floored at 0. A negative seconds value is treated as 0.
   - If there is no {{retry-after}}: {{d = min(maxDelayMs, baseDelayMs * 2^(attempt-1))}}, then apply equal jitter: {{wait = d/2 + jitter}} with {{jitter}} in {{[0, d/2]}}.
   - {{jitter}} must be **deterministic**: for each call to {{send}}, create exactly one {{SplittableRandom}} seeded with {{policy.seed ^ (req.method() + " " + req.path()).hashCode()}}, and on each retry draw {{rnd.nextLong(d / 2 + 1)}}. The same request with the same seed must produce the same sequence of waits.
4. The last response received is the return value (even if it is still 429).`,
        hints: [
          'Use a {{while(true)}} loop with an {{attempt}} counter incremented at the **start** of each iteration: call the server first, then decide whether to wait and loop again.',
          'Try parsing {{retry-after}} with {{Long.parseLong}}; if it throws {{NumberFormatException}}, try {{DateTimeFormatter.RFC_1123_DATE_TIME}} and subtract {{clock.now()}}.',
          'Do not double in a way that overflows: instead of shifting {{baseDelayMs << (attempt-1)}}, loop {{attempt-1}} times doing {{d = Math.min(maxDelayMs, d * 2)}}, or create a single {{SplittableRandom}} once at the start of send.',
        ],
        explain: `Three things this exercise teaches, and also three common mistakes in real SDKs.

**One — the order of checks determines safety.** The "POST without an {{Idempotency-Key}}" condition must block retrying **before** waiting. If you check it after, the client still politely waits 12 seconds and then resends a money-transfer command that may already have succeeded on the server (request timeout ≠ request failure — the server may have debited the money and then died on the way back). This is exactly why {{Idempotency-Key}} exists: it turns a non-idempotent POST into a POST that **can be replayed**, and it is also why the client must not generate a fresh key on each retry — it must keep the same key, as the {{headers preserved across every attempt}} test verifies.

**Two — {{Retry-After}} is an order, backoff is a fallback.** The server holds the token bucket so it knows exactly when you refill; the client is only guessing. So when the header is present, use it directly with no added jitter (the {{retry-after seconds}} test demands exactly 7000 ms). When you must compute it yourself, a safe formula is {{min(cap, base * 2^(attempt-1))}} then split into a fixed upper half + a random half — the *equal jitter* variant. If you use a plain {{new Random()}}, your tests become non-deterministic; if you use the **same** fixed value for every request, all clients retry on the same beat, which is exactly what jitter exists to avoid. Tip: seed with {{policy.seed ^ request.hashCode()}} — deterministic per request, different across requests.

**Three — a fake clock turns wait logic into verifiable logic.** If the client calls {{Thread.sleep}}, the test takes 30 real seconds and still cannot prove the client waited **exactly how long**. With {{FakeClock}}, every wait is a single {{advance}} and you only compare the time difference between two server calls. This is a pattern worth learning: any code that depends on time (SRS, session expiry, cache TTL) should accept a clock as a parameter so it can be tested.

Common mistakes when writing this: using {{<=}} instead of {{<}} so the number of calls exceeds {{maxAttempts}}; forgetting {{attempt >= maxAttempts}} when {{maxAttempts == 1}} so it still retries; treating every {{retry-after}} header as a number and throwing an exception on an HTTP-date; parsing an HTTP-date with the old {{Date}} API that depends on the machine's local timezone (the 1970-01-01T00:00:00Z epoch) instead of {{Instant}}; and returning the **first** response instead of the last when the budget is exhausted, losing the newest {{retry-after}} that an upper-layer caller needs.`,
      },
    ],
    check: [
      {
        q: 'The server returns {{429}} with {{Retry-After: 30}}. What should the client do?',
        options: [
          'Retry immediately because 429 is a transient network error',
          'Wait 30 seconds (optionally adding jitter) then retry, if the request is idempotent',
          'Stop completely and show the user an error because 429 means permanently banned',
          'Retry immediately but raise {{RateLimit-Limit}} to 30',
        ],
        answer: 1,
        explain: '{{Retry-After}} tells the client when the server expects it to come back, so wait according to it. Adding jitter is good to spread the load when thousands of clients are blocked at once. Waiting only applies to idempotent requests. 429 is not a permanent ban (that is 403 or an account lock), and {{RateLimit-Limit}} is a header the **server sends**; a client sending it has no meaning.',
      },
      {
        q: 'Why should you not blindly retry a {{POST /payments}} that received 503?',
        options: [
          'Because 503 is not a retryable error',
          'Because POST may not be idempotent: retrying can create a second transaction and charge money twice',
          'Because POST is always faster than GET so retrying is wasteful',
          'Because the client is not allowed to retry any method',
        ],
        answer: 1,
        explain: '503 is a transient error and **is** retryable, but only for requests whose re-execution has no side effects. POST is not idempotent: the command may already have succeeded on the server and only been lost on the way back, so retrying creates a second record. The only way out is to make it idempotent with an {{Idempotency-Key}} and resend the **same key** — then retrying is safe.',
      },
      {
        q: 'An application runs 8 instances behind a load balancer and each instance keeps the request counter in a JVM variable. What is the consequence?',
        options: [
          'Nothing, the load balancer distributes evenly so the limit stays correct',
          'The real limit becomes about 8x the advertised one and depends on routing; the counter must move to Redis or the gateway',
          'Performance drops because Redis is not used',
          'It is only wrong when there are more than 100 clients',
        ],
        answer: 1,
        explain: 'Each JVM counts independently, so "100 requests/minute" is multiplied by the number of instances; a client with session affinity (the load balancer always routes the same customer to one instance) even sees a different "virtual" limit than a client that is spread out. The counter must live somewhere **shared** (Redis with an atomic command, or the gateway tier). Even distribution only makes the error smaller, it does not make it correct.',
      },
      {
        q: 'The phenomenon "many clients all receive 429 and all retry at the exact same second, knocking the just-recovered system over again" is called what, and how do you fix it?',
        options: [
          'Thundering herd — the only fix is to raise the limit',
          'Retry storm — use exponential backoff plus jitter, and set a retry budget',
          'Split-brain — add another Redis replica',
          'Poison pill — delete the message from the queue',
        ],
        answer: 1,
        explain: 'This is a retry storm (a form of thundering herd). Exponential backoff makes the total load decrease over time, jitter spreads the retry moments instead of piling them into one second, and a retry budget prevents every request from turning into a retry. Raising the limit is only firefighting; it does not eliminate the phenomenon.',
      },
    ],
  },
});
