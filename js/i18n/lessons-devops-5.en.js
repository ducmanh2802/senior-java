/*
 * English translation of js/data/lessons-devops.js — task T701. Format: js/core/i18n.js (content overlay).
 * ids: lesson-devops-007
 */
App.i18n.content({
  'lesson-devops-007': {
    title: 'Beating a retry storm: the circuit breaker CLOSED/OPEN/HALF_OPEN states, retry budget and the jitter styles',
    goals: [
      'Explain with a concrete load calculation why retrying can turn a small incident into a long-lasting one (retry storm, metastable failure)',
      'Describe the circuit breaker state machine precisely: sliding window, minimumNumberOfCalls, OPEN fail fast, HALF_OPEN with a limited number of trial calls',
      'Implement a circuit breaker that uses a fake clock so tests are deterministic, together with overflow-free full jitter and a retry budget',
      'Configure Resilience4j on Spring Boot 3 with the right decorator order and avoid traps such as retrying CallNotPermittedException',
    ],
    body: `### The retry storm: when "retry once more to be safe" takes the system down
The lesson "Retrying correctly when calling an external provider" taught you error classification and backoff for **a single call**. This lesson looks at the **system level**: hundreds of Pods all retrying against one dependency that is already weak.

An example with real numbers: the Order service receives 1,000 req/s and every request calls Payment exactly once. Payment can withstand at most about 1,500 req/s. One long GC pause makes Payment slow for a few seconds, every call times out. Order is configured with 3 retries (4 calls in total):

| Moment | Error rate | Actual load on Payment |
|---|---|---|
| Normal | 0% | 1,000 req/s |
| Incident | 100% | 1,000 × 4 = **4,000 req/s** (2.7 times what it can take) |
| The GC is finished, but the queue is still full | still ~100% because it is overloaded | still 4,000 req/s |

The third row is the frightening one: the original cause is already gone, but **the retries themselves** keep Payment in an overloaded state. This behaviour is called a **metastable failure** — the system stays stuck in the bad state until a human cuts the load by hand. Several retry layers multiply the effect: gateway 2 times × BFF 3 times × Order 3 times = **18 calls** to Payment for one single user click.

Three tools solve three different parts of the problem — you need all three:

| Tool | Solves | Does not solve |
|---|---|---|
| Backoff + jitter | Spreads the retries out in time and pushes them later | The total number of retries stays exactly the same |
| Retry budget | Caps the total retries as a percentage of the original traffic | No fail fast when the dependency is completely dead |
| Circuit breaker | Stops calling a broken dependency, fails fast, probes cautiously again | No load reduction while the error rate is still below the threshold |

### The jitter styles
Let {{c = min(cap, base × 2^attempt)}} be the ceiling of the wait for retry number {{attempt}}. The classic article "Exponential Backoff And Jitter" (Marc Brooker, AWS Architecture Blog) compares:

| Style | Wait time | Comment |
|---|---|---|
| No jitter | {{c}} | Every client is in lockstep → the load arrives in waves |
| Full jitter | uniform random inside {{[0, c]}} | Best spread of all, fewest calls in total; occasionally retries very early |
| Equal jitter | {{c/2 + random[0, c/2]}} | Always waits at least c/2; spreads worse than full jitter |
| Decorrelated | {{min(cap, random[base, prev × 3])}} | Built on the previous wait; almost as effective as full jitter |

The conclusion of that article: any jitter is far better than no jitter at all, and full jitter plus decorrelated produce the least total work. One implementation detail matters a lot: compute {{c}} by doubling **with a ceiling check**. If you write {{base << attempt}}, the result overflows for attempt ≥ 63 (for long Java only uses the low 6 bits of the shift distance), so you get 0 or a negative number.

### Retry budget: capping the total number of retries
The idea (Finagle, gRPC retry throttling, the "standard" retry mode of the AWS SDK, which uses a token-bucket retry quota): a retry is only allowed while **the total number of retries ≤ X% of the original requests**, plus a small "reserve" so that a low-traffic service can still retry.
- The dependency is healthy and errors are occasional: plenty of budget left, every transient error gets retried.
- A widespread outage: the budget runs dry immediately, so the extra load is **at most X%** instead of four times the original.

With X = 20% and 100 requests that all fail, each one wanting 3 retries: without a budget that is 300 retries, with a budget only about 20 (plus the reserve). Exercise 2 checks exactly this number.

### Circuit breaker: the state machine
~~~text
            failure rate ≥ threshold (once there are ≥ minimumNumberOfCalls results)
   CLOSED ─────────────────────────────────────────────────► OPEN
     ▲                                                          │
     │ the trials succeed                                       │ waitDurationInOpenState elapsed,
     │                                                          │ and the next call arrives
     │                                                          ▼
     └────────────────────────────────────────────────── HALF_OPEN
                              a trial fails ──────────► OPEN (the timer starts over)
~~~

- **CLOSED**: every call goes through. Each result is recorded in a **sliding window**: COUNT_BASED (the last N calls) or TIME_BASED (the calls made in the last N seconds). The failure rate is only computed once the window already holds **at least minimumNumberOfCalls** results, so that 1 error out of 1 call cannot open the circuit. Old results get pushed out of the window, which is why the breaker reflects the **current** condition rather than the history since process start-up.
- **Slow calls**: Resilience4j also counts the calls slower than {{slowCallDurationThreshold}}; a slow-call rate above {{slowCallRateThreshold}} opens the circuit as well. A dependency that is **slow** is usually more dangerous than one that is **dead**: it keeps holding threads and connections for a very long time.
- **OPEN**: the dependency is not called at all, {{CallNotPermittedException}} is thrown immediately (a few microseconds). Threads are released and the dependency gets a chance to recover.
- **HALF_OPEN**: after {{waitDurationInOpenState}}, exactly {{permittedNumberOfCallsInHalfOpenState}} trials are allowed; calls beyond that number are still rejected. Resilience4j computes the failure rate over those trials: below the threshold it returns to CLOSED (the window is refreshed), at or above the threshold it goes back to OPEN. The exercise simplifies this to "one failed trial opens the circuit again".
- By default Resilience4j only moves OPEN → HALF_OPEN when **a next call arrives** after the wait; if you want the transition to happen automatically on the clock, switch on {{automaticTransitionFromOpenToHalfOpenEnabled}}.

Why does the exercise take {{LongSupplier nowMs}} instead of {{System.currentTimeMillis()}}? So that the test "at exactly 5000ms it moves to HALF_OPEN" runs deterministically in a few milliseconds, with no {{Thread.sleep}} at all. Resilience4j does the same thing: it accepts a {{Clock}} that a test can replace.

### Resilience4j on Spring Boot 3
~~~yaml
resilience4j:
  circuitbreaker:
    instances:
      payment:
        sliding-window-type: COUNT_BASED
        sliding-window-size: 20
        minimum-number-of-calls: 10
        failure-rate-threshold: 50
        slow-call-duration-threshold: 2s
        slow-call-rate-threshold: 80
        wait-duration-in-open-state: 30s
        permitted-number-of-calls-in-half-open-state: 3
  retry:
    instances:
      payment:
        max-attempts: 3                  # includes the very first call
        wait-duration: 200ms
        enable-exponential-backoff: true
        exponential-backoff-multiplier: 2
        ignore-exceptions:
          - io.github.resilience4j.circuitbreaker.CallNotPermittedException
~~~

~~~java
@Retry(name = "payment")
@CircuitBreaker(name = "payment", fallbackMethod = "chargeFallback")
public Receipt charge(ChargeRequest req) { return paymentClient.charge(req); }

// same parameters + a Throwable last; invoked on an error or while the circuit is OPEN
private Receipt chargeFallback(ChargeRequest req, Throwable t) {
    throw new PaymentUnavailableException("Payment is temporarily unavailable", t); // fast 503, never pretend success
}
~~~

The default order of the aspects is: {{Retry ( CircuitBreaker ( RateLimiter ( TimeLimiter ( Bulkhead ( the function ) ) ) ) )}} — Retry sits **on the outside**. Consequence: every retry passes through the circuit breaker and is counted by it, and when the circuit is OPEN the Retry aspect receives {{CallNotPermittedException}}. If you do not declare that exception as ignored, Retry will "retry" an open circuit: it burns the backoff waiting time on something that is guaranteed to fail. One more note: {{@TimeLimiter}} only applies to methods returning {{CompletableFuture}}/{{CompletionStage}}; for a synchronous call put the timeout in the HTTP client instead.

### Production traps you keep running into
- **One shared breaker for every dependency**: Payment dies and that opens the circuit for the calls to Inventory as well. Give each dependency (sometimes each important endpoint) its own instance.
- **Counting 4xx errors as failures**: a client floods you with malformed requests → the circuit opens and blocks the legitimate users too. Use {{recordExceptions}}/{{ignoreExceptions}} so that only server-side errors and timeouts are counted.
- **minimumNumberOfCalls that does not fit the traffic**: too small and the circuit "flaps" (opens and closes repeatedly) on a few random errors; too large for a low-traffic service and it never gets enough evidence to open.
- **A fallback that pretends success**: answering "OK" when no money has actually been charged is a serious business bug. Legitimate fallbacks: stale cached data (explicitly labelled as stale), a safe default value, or a fast 503 carrying {{Retry-After}}.
- **A breaker per Pod**: 30 Pods, each allowing 3 trials in HALF_OPEN → 90 probe requests reach the freshly recovered dependency at the same instant. Usually acceptable; if it is not, lower the number of trials or add jitter to the OPEN waiting time.

### Interview connection
A question you will hear: "A dependency gets slower and slower and then the whole system dies along with it — how do you prevent that?" An answer with all the required ideas: (1) a timeout shorter than the caller's timeout; (2) retry in **one** layer only, with backoff + full jitter and a retry budget; (3) a circuit breaker per dependency, with slow-call counting, and Retry ignoring {{CallNotPermittedException}}; (4) a bulkhead so that a slow dependency cannot consume every thread; (5) a fallback that is correct from the business point of view; (6) metrics for the breaker state and the retry count so you alert early. The exercises below implement the core of (2) and (3).

> Senior tip: When you write the postmortem of a cascading failure, plot "original requests/s" and "actual requests reaching the dependency/s" on top of each other. The gap between the two lines is precisely the load created by the retries — usually the most convincing piece of evidence for getting a team to accept a retry budget and a circuit breaker.`,
    exercises: [
      {
        title: 'CircuitBreaker with a count-based sliding window and a fake clock',
        prompt: `The starter already provides the fields, the constructor, {{state()}} and {{rejectedCount()}}. Every point in time comes from {{nowMs.getAsLong()}} (a fake clock in the tests). Finish:

**{{tryAcquire()}}** — am I allowed to call the dependency:
- CLOSED: always true.
- OPEN: if {{now − openedAt < openMs}} then increment {{rejected}} and return false. Otherwise move to HALF_OPEN (reset the trial counters) and then handle the call exactly as HALF_OPEN does.
- HALF_OPEN: if trials are still left ({{issued < halfOpenPermits}}) grant one trial and return true; when none is left, increment {{rejected}} and return false.

**{{onSuccess()}} / {{onError()}}** — report the result of a call that was granted:
- CLOSED: record the result in a sliding window holding **the last {{windowSize}} results** (the oldest result gets pushed out). When the window holds **≥ {{minCalls}}** results and {{failures × 100 ≥ failureRatePercent × window size}} the circuit opens.
- HALF_OPEN: {{onError}} → open the circuit again immediately. {{onSuccess}}: once {{halfOpenPermits}} trials have succeeded, return to CLOSED with an **empty** window.
- OPEN: ignore it (a late result from a call that started before the circuit opened).
- Opening the circuit = state OPEN, {{openedAt = now}}, clear the window.

**{{call(op, fallback)}}**: if not allowed, return {{fallback.get()}} and **do not invoke** {{op}}. If allowed, invoke {{op.get()}}: success → {{onSuccess()}} and return the result; a thrown {{RuntimeException}} → {{onError()}} and return {{fallback.get()}}.`,
        hints: [
          'In {{tryAcquire}}, handle OPEN first: if {{openMs}} has not elapsed yet, reject; if it has, set state to HALF_OPEN and **fall through** into the HALF_OPEN branch within the very same call.',
          'Sliding window: {{addLast}} the new result, and if {{size() > windowSize}} then {{removeFirst()}}. Keep an extra counter of the failures so the rate can be compared with integers: {{failures * 100 >= percent * size}}.',
          'Write one shared {{open()}} method: set OPEN, record {{openedAt = nowMs.getAsLong()}}, clear the window. Call it when the failure rate crosses the threshold in CLOSED and when a HALF_OPEN trial fails.',
        ],
        explain: `**The mechanism**: the breaker is a small state machine in which every transition depends only on call results and on the clock. Injecting the clock through {{LongSupplier}} makes it possible to test the scenario "at 5999ms still rejected, at 6000ms a trial is allowed" in a few milliseconds.

**The subtle points the tests check:**
- **minCalls**: without this condition, 1 error out of 1 call (100%) would already open the circuit — the breaker would flap constantly during low traffic.
- **The "≥" comparison** done with integers ({{failures * 100 >= percent * size}}) to avoid floating-point error; 50% exactly at the threshold must open the circuit.
- **Pushing old results out**: the "evicts old results" test with window 4 only opens once the old error has been evicted; counting everything since the beginning (3/7 ≈ 43%) would never open — a breaker would then reflect history instead of the present.
- **HALF_OPEN limits the trials**: if every call went through, 1,000 requests would crash into the just-recovered dependency and knock it down again.
- **Clearing the window when the circuit opens**: if the old errors were kept, the freshly closed circuit could reopen immediately because of the pre-incident history.
- **{{call}} is not synchronized**: holding the lock while calling a slow dependency would serialise every request — the breaker itself would become the bottleneck.

**Differences from the real Resilience4j**: in HALF_OPEN, Resilience4j waits for all the permitted trials and then compares the failure rate with the threshold (it is not "one error and it opens"), and it also supports slow calls, a TIME_BASED window and ignore/record exception rules.

> Senior tip: always export the breaker state metrics (Resilience4j ships them for Micrometer: {{resilience4j.circuitbreaker.state}}, {{resilience4j.circuitbreaker.not.permitted.calls}}) and alert when a breaker stays OPEN for more than a few minutes. A circuit that has been open for a long time and nobody notices means a feature is quietly running on its fallback.`
      },
      {
        title: 'Overflow-free full jitter and a RetryBudget that stops a retry storm',
        prompt: `**1. {{Backoff.ceiling(attempt, baseMs, capMs)}}** — the ceiling of the wait for retry number {{attempt}} (starting at 0): {{min(capMs, baseMs × 2^attempt)}}. It must **not overflow** for large attempt values (63, 70, 1000…): once the value passes the ceiling it stops at the ceiling. Assume {{baseMs ≥ 1}}.

**2. {{Backoff.delay(attempt, baseMs, capMs, rnd)}}** — full jitter: a random whole number uniformly drawn from **[0, ceiling]**. So that the test can compare against a seed, take exactly **one** random value with {{rnd.nextInt((int) c + 1)}} where {{c = ceiling(...)}} (assume {{capMs}} never exceeds one billion).

**3. {{RetryBudget(percent, reserve)}}**:
- {{onRequest()}}: record one original request (the first attempt, not a retry).
- {{tryRetry()}}: grant a retry when the number of retries already granted is **less than** {{reserve + requests × percent / 100}} (integer division); when granting, increment the granted-retry counter and return true, otherwise return false.`,
        hints: [
          'Do not use {{baseMs << attempt}} or {{Math.pow}}: for attempt 63/64 the result is wrong or negative. Double inside a loop and stop as soon as the ceiling is reached.',
          'To double safely: if {{c > capMs / 2}} then {{c * 2}} is certainly past the ceiling → assign {{capMs}} directly; otherwise {{c * 2 ≤ capMs}}, so an overflow is impossible.',
          'RetryBudget only needs two counters, {{requests}} and {{retries}}; {{tryRetry}} compares {{retries}} with {{reserve + requests * percent / 100}}.',
        ],
        explain: `**Backoff.ceiling**: the loop runs at most until the ceiling is reached (about 60 iterations for long), so its cost is negligible. The condition {{c > capMs / 2}} is the classic overflow check: you never compute a number that could exceed {{Long.MAX_VALUE}}. The test {{ceiling(70, 3, Long.MAX_VALUE)}} catches every direct multiplication. A common bug: {{100L << 63}} gives 0 and {{100L << 64}} gives 100 back (for long, Java only takes the low 6 bits of the shift distance), so {{min(cap, ...)}} returns 0 or 100 instead of the ceiling.

**Backoff.delay**: full jitter draws uniformly from the whole range [0, c]. The test "spreads over the whole range" catches two wrong implementations: returning the fixed value {{c}} (no jitter — every client in lockstep) and equal jitter {{c/2 + random}} (never below c/2, so {{min < 160}} could never hold). Take exactly one number from {{rnd}} so the result is reproducible for a given seed — that is also how you should write the real code: accept a {{Random}}/{{RandomGenerator}} as a parameter instead of calling {{ThreadLocalRandom}} inside, so the code stays testable.

**RetryBudget**: 100 failing requests, each wanting 3 retries → without a budget that is 300 retries (load ×4); with a 20% budget plus a reserve of 2 only 22 retries survive (load ×1.22). A real budget (Finagle, gRPC) is computed inside a sliding time window so that old traffic gets "forgotten"; the exercise drops the time dimension to stay compact. A common mistake: using floating-point division and then rounding up, so very low traffic still gets far more retries than intended.

> Senior tip: In Resilience4j, {{IntervalFunction.ofExponentialRandomBackoff(initialInterval, multiplier, randomizationFactor)}} uses a "randomization factor" (a ± swing around the exponential value), not full jitter. If you need true full jitter, write your own {{IntervalFunction}} — a lambda that takes the attempt number and returns the waiting milliseconds — built on exactly the formula of this lesson.`
      },
    ],
    check: [
      {
        q: 'On Spring Boot with Resilience4j, a method carries both {{@Retry}} and {{@CircuitBreaker}}. While the circuit is OPEN, what happens if Retry keeps its default configuration (retry on every exception)?',
        options: ['The circuit breaker sits outside Retry, so Retry never runs while the circuit is open', 'Retry is on the outside, receives CallNotPermittedException and retries pointlessly (burning the backoff time); you should declare CallNotPermittedException in ignore-exceptions', 'Retry automatically knows the circuit is open and stops immediately', 'Every retry closes the circuit for one round'],
        explain: `The default aspect order is Retry ( CircuitBreaker ( RateLimiter ( TimeLimiter ( Bulkhead ( the function ) ) ) ) ): Retry wraps everything else. An OPEN circuit throws {{CallNotPermittedException}}, Retry treats that as a failure and tries again after the backoff — a guaranteed failure that only adds latency. The first option reverses the order. Retry does not "know" the breaker state unless you configure it to ignore that exception. Retry never closes the circuit; only successful trials in HALF_OPEN close it.`
      },
      {
        q: 'Why does a circuit breaker need the HALF_OPEN state with a limited number of trials, instead of going straight OPEN → CLOSED once the waiting time expires?',
        options: ['To save the memory used by the sliding window', 'To probe whether the dependency has recovered with only a few requests; going straight to CLOSED would shove all the traffic back into a dependency that just came up and could knock it down again', 'Because HALF_OPEN lets every request through but does not record the results', 'Because Kubernetes requires three states for the readiness probe'],
        explain: `HALF_OPEN is the "probe" step: only a handful of requests are sent; if they succeed the circuit closes, if one fails it reopens and the wait starts again. Going straight to CLOSED would release the whole traffic (plus whatever piled up in queues) onto a dependency that has just recovered. It has nothing to do with memory. HALF_OPEN is precisely the state that **limits** the requests and **does** record their results in order to decide. Kubernetes probes have nothing to do with the circuit breaker.`
      },
      {
        q: 'Comparing the backoff styles when 1,000 clients all fail at the same moment, which statement is correct?',
        options: ['Exponential backoff without jitter is enough because the waiting time already grows exponentially', 'Full jitter waits a random time in [0, c], spreads the retries best and produces the fewest calls in total; equal jitter always waits at least c/2 so its spread is worse', 'Equal jitter is better than full jitter because it never retries too early', 'Jitter increases the total number of retries, so it should only be used with few clients'],
        explain: `Without jitter, 1,000 clients still retry all at once on exactly the same time marks: the load is stretched out, but it still arrives in waves. Full jitter spreads uniformly over the whole interval, so the load at any instant is the lowest; according to the simulations in the AWS article "Exponential Backoff And Jitter", full jitter (and decorrelated) produce the least total work. Equal jitter avoids retries that come too early, but pays for it with a worse spread, so it is not "better" in general. Jitter does not change the maximum number of retries; it only changes when a retry happens, and it becomes more useful the more clients there are.`
      },
    ],
  },
});
