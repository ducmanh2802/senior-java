/*
 * English translation of js/data/lessons-concurrency.js — task T690. Format: js/core/i18n.js (content overlay).
 * ids: lesson-concurrency-007
 */
App.i18n.content({
  'lesson-concurrency-007': {
    title: 'Rate limiter and Semaphore: limiting speed versus limiting how many jobs run at once',
    goals: [
      'Tell **rate** (how many jobs per second) apart from **concurrency** (how many jobs are running right now), and know which tool caps which one',
      'Write a token bucket and explain where {{capacity}} (burst) differs from the {{refill rate}}',
      'Write a sliding window counter and show why a fixed window lets through double the limit at the boundary',
      'Use a {{Semaphore}} correctly: {{release()}} in {{finally}}, {{tryAcquire}} with a timeout, and how to make tests deterministic with a fake clock',
    ],
    body: `### Two things commonly both called "load limiting"
- **Concurrency**: at one instant, how many jobs are **running**. For example, a pool allows only 3 people to dive at the same time.
- **Rate**: within a span of time, how many jobs are **started**. For example, a ticket booth hands out 100 tickets per minute, even if each person is only inside for 2 seconds.

Neither implies the other. If each request to the DB takes 10 ms, then 3 concurrent requests equal roughly 300 requests per second; if the DB slows to 2 seconds, those same 3 concurrent requests drop to about 1.5 requests per second. So "Semaphore(3)" is not "100 requests/second", and vice versa.

| Need | Tool |
|---|---|
| Protect a resource counted by **number of threads using it** (connection pool, open file handles, "at most 50 concurrent requests to the partner") | {{Semaphore}} |
| Protect a quota counted over **time** (100 req/s, 1 million LLM tokens per minute, anti-spam) | rate limiter: token bucket / sliding window |
| Both (the common real-world case) | bulkhead (Semaphore) plus a rate limiter sitting next to it |

Why you must limit yourself **before** someone else limits you: the partner returns {{HTTP 429 Too Many Requests}} (with a {{Retry-After}} header saying how long to wait), the DB gets overloaded, the bill grows with every request, and worst of all a "retry storm": rejected clients retry immediately, multiplying the load several-fold so the system never recovers.

### Semaphore, step by step
A {{Semaphore}} is a jar holding {{n}} **permits** (tickets). Taking a ticket decreases the count in the jar; returning one increases it back.

~~~java
Semaphore permits = new Semaphore(3);            // 3 tickets
void handle(Request r) throws InterruptedException {
    permits.acquire();                            // out of tickets: STOP here and wait
    try {
        partnerClient.call(r);                    // at most 3 calls running concurrently
    } finally {
        permits.release();                        // REQUIRED to be inside finally
    }
}
~~~

| API | Behaviour |
|---|---|
| {{acquire()}} | take 1 ticket, wait forever if none left; if interrupted, throws {{InterruptedException}} |
| {{acquireUninterruptibly()}} | wait until a ticket is obtained, cannot be woken by an interrupt |
| {{tryAcquire()}} | take one if a ticket remains, **does not wait**, returns {{true/false}} |
| {{tryAcquire(200, TimeUnit.MILLISECONDS)}} | wait at most 200 ms, return {{false}} when time is up — the way to turn "wait" into "fail fast" |
| {{release()}} | put 1 more ticket into the jar (**no prior** {{acquire}} needed), the count may exceed {{n}} |
| {{drainAcquire(n)}} | grab up to {{n}} currently available tickets, return how many were grabbed, no waiting |
| {{new Semaphore(3, true)}} | fair: whoever waited longest gets the next ticket; more expensive because it must queue |

Two details interviewers like to ask:
1. **Non-fair by default**: a thread that was just woken can snatch a ticket ahead of one that has waited longer, in exchange for higher throughput. Choose {{fair = true}} when you actually see starvation in metrics, not by gut feeling.
2. {{release()}} belongs to nobody: calling release without acquiring **increases** the ticket count. So any code path that permits an extra release (a release in {{catch}}, or a release outside the {{try}}) silently makes the limit disappear.

Semaphore trap number one: tickets **leak**. If {{release()}} is not inside {{finally}} and {{partnerClient.call}} throws an exception, every failure loses a ticket forever; after 3 failures {{acquire()}} waits forever and the whole service stalls, even though the CPU is idle.

### Token bucket: average rate, burst allowed
Picture a bucket that holds at most {{capacity}} marbles (tokens). A thin tap drips {{refillPerSecond}} marbles per second into it. Each request takes 1 marble; if none remain, it is rejected immediately.

~~~text
          +-----------+
 refilling|  TOKENS   |  <--- add 100 every second, stop at the cap of 200
   +100/s |           |
          +-----------+
                 |
            tryAcquire(): token left -> take 1, none left -> reject
~~~

- {{refillPerSecond}} = the **average rate** allowed over the long run.
- {{capacity}} = the **burst size**: because the bucket fills up after a quiet period, you can cram 200 requests into 1 second if the bucket is full, after which you are throttled back to 100/second. This is a feature (it absorbs ripple traffic), not a bug — but it also means that right after a lull, your system is taking a peak at double the average quota.

The correct implementation needs no background thread dripping marbles on a schedule. You only need to remember **when the last refill happened** and the current token count, and compute at the moment of use ("lazy refill"):

~~~java
// elapsed is the number of nanos since the previous check
double gained = elapsed / 1_000_000_000.0 * refillPerSecond;
tokens = Math.min(capacity, tokens + gained);      // clamp at capacity: never stockpile burst
if (tokens >= 1.0) { tokens -= 1.0; return true; }
return false;
~~~

If instead you "add 100 to the variable every second" with a scheduled thread, drift accumulates whenever the machine pauses, and you gain one more thread to manage. Lazy refill is just arithmetic on timestamps.

Quick comparison: a **leaky bucket** (a bucket with a hole in the bottom) allows no burst — every request drains out at an even single stream, which suits work that must be written down into a queue; a token bucket allows bursts and suits API quotas. **Guava {{RateLimiter}}** and **Resilience4j {{RateLimiter}}** are the two popular libraries shipping ready-made warm-up/queued variants; in interviews you are still asked to write one yourself to test that you understand burst.

### Sliding window: counting correctly within "the last 1 second"
The question: "in the {{windowNanos}} **just past**, how many requests have already been allowed". The most exact way: keep the list of timestamps of **accepted** requests.

~~~java
Deque<Long> hits = new ArrayDeque<>();          // store only ACCEPTED requests
synchronized boolean allow() {
    long now = clock.getAsLong();
    while (!hits.isEmpty() && now - hits.peekFirst() >= window) hits.pollFirst();   // expired ones sit at the head
    if (hits.size() >= max) return false;
    hits.addLast(now);
    return true;
}
~~~

Compared with a **fixed window counter** (one counter per second-slot, reset on the dot), a sliding window avoids the boundary shock:

~~~text
fixed window, max 3 requests per second:
  second 0: 3 requests at 0.90s -> 3 allowed; counter resets at 1.00s
  second 1: 3 requests at 1.05s -> 3 allowed again
  => within 0.90s -> 1.05s (0.15s) there were 6 requests = 40 req/s, while the limit is 3 req/s

sliding window, same max of 3:
  3 requests at 0.90s -> at 1.05s they still count inside the 1-second window => all 3 rejected
~~~

The downside: memory is proportional to the number of requests in the window (10,000 req/s over a 1-minute window is 600,000 timestamps). People work around this with a **sliding window counter** (split the window into a few sub-slots, each keeping just one count, accepting some error), or use a **token bucket** when an approximation is enough.

### One JVM or many JVMs
A limiter inside your process only counts **that process's** requests. A service running 4 instances, each capped at 100 req/s, delivers 400 req/s to the partner. Two ways to handle it:
- **Static quota split**: each instance gets {{limit / number of instances}}; simple but wrong under autoscale or when one instance receives more traffic (you need the load balancer to split evenly), and every scale event means editing configuration.
- **Shared counter**: keep the state where every instance can see it — Redis (an in-RAM data store that many servers read and write together; the {{INCR}} + {{EXPIRE}} commands or a Lua script run **atomically** on the Redis server), or a central gateway. The price: one extra network round-trip per decision, and when Redis dies the limiter either "lets everything through" or "blocks everything" — you must pick the fallback explicitly.

### Tests that are not flaky
Two techniques the exercises use:
1. **Inject the clock**: accept a {{LongSupplier clockNanos}} instead of calling {{System.nanoTime()}}. The test turns the clock by 500 ms, 1 second, 60 seconds itself — fast, absolutely reproducible, and able to check even the case where the clock stands still.
2. **Multi-thread tests that guess no timings**: a {{CountDownLatch(1)}} as a starting gate so 16 threads charge in together, each calling {{tryAcquire()}} **until rejected**, against a bucket of {{capacity = 100000}} with the clock frozen. No refill means the total number of grants **must equal exactly** the capacity — an exact figure, not "roughly that much". Code missing {{synchronized}} loses updates when adding/subtracting {{tokens}} (or the {{size}} of the hit list), so it grants MORE than capacity; {{join(timeout)}} guarantees the test never hangs. This is precisely how a race "reveals itself stably": do not wait for two threads to coincidentally overlap for a few nanoseconds — make them fight a hundred thousand times.

### Production bugs you will actually meet
- Forgetting {{release()}} on failure: tickets leak, and once they run out every request waits until it times out, en masse.
- Setting the limit by **the number of instances you think exist**, not by the real resource behind it: after one autoscale wave, the DB eats double the allowed connections.
- Fixed window counter: customers complain "you give me double the quota for 2 seconds", or conversely perfectly steady traffic still gets blocked at the start of every slot.
- Token bucket with a {{capacity}} far above the partner's real capacity: the burst knocks over the backend even though "on average it is exactly the limit".
- Waiting for a permit with no timeout: an unbounded {{acquire()}} turns one slow dependency into an entire queue of hung requests (so use {{tryAcquire(timeout)}} and fail fast, with the timeout **smaller than** the client's timeout).
- Retrying with no backoff and no regard for {{Retry-After}}: you manufacture your own retry storm.
- No **circuit breaker**: a limiter controls the rate you send out, while a circuit breaker is the "breaker switch" that trips when the downstream keeps failing, letting the system breathe (Resilience4j provides both).

### Interview relevance
Typical questions: "Your API calls a partner that accepts only 100 req/s, and your service runs 6 instances — how do you design it?", "Where does a Semaphore differ from a RateLimiter?", "How do you handle burst?". The high-scoring answer: separate concurrency from rate clearly, describe the token bucket with the meaning of {{capacity}}/burst, point out the multi-instance problem and the two strategies (static split versus a shared counter via Redis/gateway), state the fallback when the shared counter is dead, and know how to write deterministic tests with an injected clock. If the prompt is "protect the DB", add a word about bulkheads and the connection pool — that is where the real bottleneck sits.`,
    exercises: [
      {
        title: 'A thread-safe token bucket with an injected clock',
        prompt: `Write {{TokenBucket}} — a "token bucket" rate limiter (token bucket: a bucket holding marbles, each request takes one marble).

Constructor signature: {{TokenBucket(int capacity, int refillPerSecond, LongSupplier clockNanos)}}
- {{capacity}}: the maximum number of tokens the bucket holds, which is also the largest burst size.
- {{refillPerSecond}}: how many tokens are added per second (the average rate).
- {{clockNanos}}: the time source, in nanoseconds. In production it is {{System.nanoTime()}}; in tests it is a fake clock the test cranks by hand. You must **not** call {{System.nanoTime()}} internally.

The only method: {{boolean tryAcquire()}} — ask for 1 token, **never blocks** and never throws an exception.
- The bucket **starts full** ({{capacity}} tokens).
- Before each ask, top up tokens according to the time elapsed since the previous check: add {{(nanos elapsed / 1 billion) * refillPerSecond}} tokens, but never exceed {{capacity}}.
- If at least one whole token remains, subtract 1 and return {{true}}; if none remains, return {{false}}. No "running into debt" (tokens are never negative), and no allowing over-quota just because another thread is waiting.
- It must be **thread-safe**: with many threads calling concurrently, the total number of {{true}} returns may not exceed the tokens that actually exist.
- No {{Thread.sleep}}, no background thread to "drip" tokens (compute lazily with the formula), no physically storing a queue of tokens.

A hint about time: since the tests will freeze the clock and also crank it 60 seconds forward, every behaviour must be derivable from {{clockNanos}} alone.`,
        hints: [
          'Three state fields: {{tokens}} (a {{double}}, to keep the fractional part), {{lastRefillNanos}}, and {{clock}}. No list of tokens needed.',
          'The top-up formula: {{tokens = Math.min(capacity, tokens + (now - lastRefillNanos) / 1_000_000_000.0 * refillPerSecond)}}; then assign {{lastRefillNanos = now}}.',
          'Wrap the whole {{tryAcquire()}} in {{synchronized}}: read-then-modify on {{tokens}} is a read-modify-write compound — two threads both seeing {{tokens = 1.0}} would both subtract and both be granted.',
          'The nano clock has no fixed origin ({{System.nanoTime()}} returns an arbitrary large number), and test 6 cranks the clock to the 5000-second mark: take the baseline {{lastRefillNanos = clockNanos.getAsLong()}} right in the constructor and set {{tokens = capacity}}; do not derive the token count from an absolute point in time.',
        ],
        explain: `All the subtlety lives in the **lazy refill**: no thread drips tokens at all. Every time somebody asks, you compute "how long has passed since the previous check, which equals how many tokens", add them and clamp at {{capacity}}. The result matches a scheduled counter exactly, but no drift accumulates when the JVM pauses, and the test controls 100 percent of time by turning an {{AtomicLong}}.

The {{double}} for the fraction is the detail people drop: with {{refillPerSecond = 3}}, after 0.5 seconds you have only 1.5 tokens. Use an {{int}} and round down at each step and 1.5 becomes 1, the next round computes from 0 again, and you **lose** half a token every half second — the effective quota falls to 2/second. If you prefer a {{long}}, store the "leftover nanos" and only grant once they accumulate to {{1_000_000_000 / refillPerSecond}}.

{{synchronized}} is enough, and it is the choice you should voice in an interview: the operation to protect is the sequence read-add-clamp-subtract, and at a few hundred {{refillPerSecond}} calls per second the lock is not the bottleneck. Going lock-free means CAS on a packed {{long}} (token count plus timestamp) — more complex and easy to get wrong. The last test forces you to choose correctly: 16 threads drain a 100000-token bucket on a frozen clock, so the total number of grants **must equal exactly** {{capacity}}; non-atomic code grants MORE because two threads both see {{1.0}}, both return {{true}}, and one subtraction overwrites the other.

Common mistakes:
- Forgetting to clamp at {{capacity}}: after a night of no traffic, the morning brings a huge burst — exactly when the partner is most likely to fall over.
- Forgetting to update {{lastRefillNanos}}: either tokens grow without bound, or they never grow at all.
- Calling {{System.nanoTime()}} somewhere: the fake-clock tests may still pass, but when real traffic arrives the behaviour diverges and you can never reproduce the bug.
- Returning {{true}} and only then subtracting the token: when an exception squeezes in between, the token vanishes; or subtracting before checking leaves tokens negative.
- Making {{tryAcquire()}} "wait 5 ms" with {{Thread.sleep}}: it destroys the test's determinism and wastes threads, while the whole meaning of this API is **never block**.`
      },
      {
        title: 'Sliding window log: enforcing exactly "max requests within the sliding window"',
        prompt: `Write {{RateWindow}} — a limiter of the form "within the {{windowNanos}} **just past**, at most {{maxRequests}} requests are accepted".

Signature: {{RateWindow(int maxRequests, long windowNanos, LongSupplier clockNanos)}} and the method {{boolean allow()}}.
- {{allow()}} never blocks and never throws an exception; it returns {{true}} when the request is accepted.
- A request **counts toward the window only if it is accepted**. A rejected request leaves no trace (do not "count the blocked ones too").
- A request accepted at time {{t}} **stops** counting once {{now - t >= windowNanos}} (exactly equal to {{windowNanos}} already means expired).
- If {{maxRequests < 1}} or {{windowNanos <= 0}}, throw {{IllegalArgumentException}} from the constructor.
- Must be thread-safe; no {{Thread.sleep}}, no internal {{System.nanoTime()}}, no background threads.

Restated so you are certain of the requirement: at every moment, the number of accepted requests whose timestamp falls in the range {{(now - windowNanos, now]}} must always be less than or equal to {{maxRequests}}. This is exactly what a fixed window counter (resetting the counter at each time slot) does **not** guarantee.`,
        hints: [
          'Keep an {{ArrayDeque<Long>}} of timestamps in increasing order. Because {{now}} never decreases, expired entries always sit at the **head** of the list: {{while (!q.isEmpty() && now - q.peekFirst() >= window) q.pollFirst();}}.',
          'Only {{addLast(now)}} when you have decided to return {{true}}. Counting rejected requests as well is the most common mistake on this exercise.',
          'The window is half-open {{(now - window, now]}}: the expiry condition is {{now - t >= window}} — using {{>}} lets one extra request through exactly at the boundary.',
          'The whole block "expire + check {{size()}} + add" must sit inside one {{synchronized}} region, otherwise two threads both see {{size() = 4}} and both add.',
        ],
        explain: `The timestamp list is always appended with an {{now}} that **never moves backwards** (a monotonic clock), so it stays sorted by itself and the expired entry is always at the head. One {{while}} loop at the start of each call is enough — every request is added once and removed once, so the cost is amortized O(1) even though it looks like you must scan the whole list.

This is a **sliding window log**: absolutely exact, in exchange for memory equal to the number of requests accepted within one window. At a limit of 3 req/s that is negligible, but at 10,000 req/s in a 60-second window it is 600,000 boxed {{Long}} values (about 20 MB with boxing overhead) — at that point people switch to a **sliding window counter** (split the window into small slots, each slot keeping just one count, a few percent of error) or use a token bucket because its memory is O(1).

Why not a fixed window counter? The code is only about 5 lines: one counter and one "current slot" marker, reset when the slot rolls over. But it allows {{2 * max}} requests in the instants right before and right after the boundary, exactly as the fourth test demonstrates. The irony is that the customers calling your API experience the limit as "inconsistent" in precisely that way, while you have nothing in the logs to explain it.

Common mistakes:
- Counting rejected requests too: one spike fills the window "phantom-style", and you block legitimately for a long stretch afterwards.
- Getting the expiry condition wrong ({{now - t > window}} instead of {{now - t >= window}}): at exactly {{t + window}} the old request is still being counted.
- Forgetting {{synchronized}}: the multi-threaded test with a frozen clock yields a number of accepts greater than {{max}}.
- Storing timestamps as {{int}}, or doing the subtraction on objects: {{Long}} auto-unboxes fine, but calling {{peekFirst()}} on an empty list throws {{NullPointerException}} — always check {{isEmpty()}} first.
- Using this structure for **many** keys (one window per API key): you need a map of windows and an eviction strategy for keys that go quiet, otherwise it becomes a memory leak; that is exactly when Redis starts to be worth considering.`
      },
    ],
    check: [
      {
        q: 'Your service uses a {{Semaphore(20)}} to call a DB. Each request now waits on the DB 2 seconds on average, previously only 20 ms. How does throughput change?',
        options: ['Unchanged, because the number of permits is unchanged', 'Drops from ~1,000 req/s to ~10 req/s', 'Rises, because threads wait more', 'Unchanged, only p99 rises'],
        explain: `Little's law: throughput = concurrency / time per job. Before: 20 / 0.02 s = 1,000 req/s. After: 20 / 2 s = 10 req/s. The Semaphore holds **concurrency** constant, while **rate** follows from the downstream latency. That is why a Semaphore is not a rate limiter, and also why, when the DB slows down, the cap of 20 connections protects the DB but drags your throughput down with it.`,
      },
      {
        q: 'A token bucket with {{capacity = 200}} and {{refillPerSecond = 100}} has just spent a night with no traffic. In the first second of new traffic, at most how many requests are accepted?',
        options: ['100, because that is the quota', '200, because the bucket is full and the capacity allows the burst', '300, because 200 are already there plus 100 refilled during that second', '1, because each second only drips 100 and each request needs 1 token'],
        explain: `After a quiet night the bucket is clamped at {{capacity}} = 200 tokens. In the first second the first 200 requests drain the tokens; only a request arriving after those 200 waits for fresh refills — in theory about 100 more tokens drip **during** the second, but since the first 200 requests come instantly, the rest of the second has almost nothing left to grant; the meaningful figure is {{capacity}}, not {{refill}}. The point to make in an interview: {{capacity}} is the maximum burst size, and if the partner can only take 100 req/s at the **peak**, then {{capacity}} should sit near 100, not 200.`,
      },
      {
        q: 'You run 4 instances behind a load balancer, and the partner enforces 100 req/s for the whole system. Which approach does **not** guarantee the limit?',
        options: ['Each instance sets its limit to 25 req/s', 'One central limiter (Redis or a gateway) counting for all 4 instances together', 'Each instance sets its own limit to 100 req/s', 'Route every request through one shared queue that dispenses at the allowed rate'],
        explain: `A limiter inside one JVM only counts its own requests; 4 instances at 100 req/s each means the partner receives up to 400 req/s. A static split (25 per instance) is simple but still wrong under autoscale or when the load balancer splits unevenly; a central limiter or a shared queue is the right way — provided you handle the case where it is unreachable (fallback: block or let through).`,
      },
      {
        q: '{{tryAcquire()}} on a limiter returns {{false}}. Which handling makes the most sense inside a web request?',
        options: ['Call {{tryAcquire()}} again in a loop until it returns true', '{{Thread.sleep(1000)}} then try again', 'Fail fast: answer the client immediately (429 or a bounded queue), taking {{Retry-After}} into account and using backoff on the client side', 'Throw an {{OutOfMemoryError}} so the container restarts'],
        explain: `A spin loop makes you DoS yourself and pins the thread; sleep cannot tell you how long to wait and piles up into a horrible p99. The right way: reject early, return a clear signal to the client (429 + Retry-After), and have the client retry with exponential backoff and jitter. For batch work, use a bounded queue plus workers that take permits in a controlled manner.`,
      },
    ],
  },
});
