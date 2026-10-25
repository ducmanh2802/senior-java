/*
 * English translation of js/data/labs-incident.js — task T259. Format: js/core/i18n.js (content overlay).
 * ids: lab-incident-001 lab-incident-002
 */
App.i18n.content({
  'lab-incident-001': {
    title: 'Partner bank slowdown collapses the payment flow and double-charges customers',
    scenario: `**Context:** ShopVN payment flow: app → **api-gateway** (Spring Cloud Gateway) → **checkout-service** → **payment-service** → **bank-adapter** → credit card API of partner bank **VBK**. All services are Spring Boot 3.2, Tomcat 200 threads, with Micrometer Tracing (traceId passed via W3C header {{traceparent}}). Besides calling bank-adapter, payment-service also exposes the balance view API {{GET /v1/wallets/balance}}, which typically takes only ~45 ms.

**Symptoms:** On **22/10/2026**, starting at **19:58**, VBK's API slowed (p99 rising from 0.8 s to roughly 35 s; VBK confirmed a DB error on their side, fixed at 20:04). Consequence: gateway returns **504** to every payment flow in bulk (including wallet users that never hit VBK), the balance API times out, and the system only fully recovers at 20:09. Next morning, reconciliation found **217 orders** in FAILED state while customers were deducted by VBK, of which 64 orders were deducted **2–3 times**.

**Data collected:** JSON logs of 4 components filtered by a traceId, each service's timeout and retry config, and Prometheus metrics 19:55–20:10.`,
    questions: [
      'Reconstruct the timeline of trace 6721d0a87c3e4b19a2f05d8e1c6b7a34. Which misconfigured timeout made a problem at the partner bank propagate across the entire payment flow and even the balance API?',
      'Why did customers get deducted 2–3 times while the order was in FAILED state? Point to the log lines as evidence.',
      'Redesign the timeout, retry and error isolation strategy for this chain. How to handle the 217 affected orders?'
    ],
    hints: [
      'List timeouts from outer to inner: gateway, checkout (multiply by number of retries), payment, bank-adapter. Which layer gives up first, and which layers keep waiting until when?',
      'Follow PAY-9F3A21: who was waiting for its result at 20:01:47? What does the Broken pipe line say? Then count how many paymentIds were created for the same ORD-26102201873.',
      'Use Little\'s law: busy threads = arrival rate × wait time. With pay_in around 14–17 requests/second and each request waiting about 35 seconds, how many threads are needed? Why does the balance API, which never calls VBK, die along with the rest?'
    ],
    answer: `**Summary:** Timeouts were configured **backwards**: the outermost layer gives up earliest (gateway 10 s) while the inner layers wait longer (checkout 30 s × 3 retries, payment 45 s, bank-adapter 60 s). When VBK slows down about 35 s, every inner layer keeps holding its thread to do a job the client has already abandoned. Checkout keeps retrying, amplifying load and creating a **new paymentId** each time, so the old transaction still succeeds at VBK. As a result both service thread pools deplete (shares the pool with the balance API), and customers get charged repeatedly while the order is marked FAILED.

### Trace timeline

| Time | Event |
|---|---|
| 20:01:12.204 | Gateway receives payment request for ORD-26102201873 |
| 20:01:12.241 | payment-service creates **PAY-9F3A21**, calls bank-adapter, bank-adapter calls VBK |
| 20:01:22.205 | Gateway **504** "Response took longer than timeout: PT10S", app reports failure to customer |
| 20:01:42.231 | checkout exhausts read-timeout 30 s, Resilience4j retry (attempt 2) |
| 20:01:42.744 | payment-service creates **PAY-9F3A77**, debit attempt 2 for the same order |
| 20:01:47.072 | VBK returns **SUCCESS for PAY-9F3A21** after 34,812 ms |
| 20:01:47.093 | payment-service writes response, but hits **Broken pipe**: checkout closed the connection, nobody is left to read the result |
| 20:02:13.262 | Retry attempt 3: creates **PAY-9F3B02** |
| 20:02:19.588 | VBK returns **SUCCESS for PAY-9F3A77** (36,827 ms), i.e. the second charge |
| 20:02:27.790 | PAY-9F3B02 cannot reach bank-adapter: {{accept queue 100/100}} |
| 20:02:43.252 | checkout marks order **FAILED** after 3 attempts |

Result: one FAILED order but two successful debit transactions at VBK. This is exactly the pattern of the 51 orders charged twice.

### Root cause

**1. Timeout backwards (outer < inner).** The gateway budget is 10 s, but:
- checkout waits for payment a maximum of 30 s × 3 times, plus 2 × 0.5 s wait, i.e. about 91 s total;
- payment waits bank-adapter 45 s; bank-adapter waits VBK 60 s.

After the 10th second, every job inside is **wasted work** (nobody is waiting for a result) yet still occupies a thread. The correct rule: timeout must **decrease from outer to inner**, and the total time including retries of the inner layer must be smaller than the outer timeout.

**2. Thread pool exhaustion and propagation.** By Little\'s law: busy threads = arrival rate × hold time. At 20:02, {{pay_in}} is about 17.6 requests/second (6.3 orders/second really, the rest from retries) × about 35 s ≈ 600 threads needed, while the pool only has 200. Result: {{busy_bank}}, {{busy_pay}} and {{busy_checkout}} are all 200/200, and bank-adapter\'s accept queue is full. Because {{/v1/wallets/balance}} shares the payment-service Tomcat pool, it must also wait for a thread: {{balance took 9874 ms}}, {{balance_p99}} rises to 30 s. Wallet payment customers (not related to VBK) also get 504. This is the symptom of a missing **bulkhead**.

**3. Retry on non-idempotent operation.** Each attempt creates a new payment with {{ref = paymentId}}, so VBK treats them as different transactions. The retry after timeout is the dangerous case: a timeout **does not mean failure**, only "unknown result". PAY-9F3A21 actually succeeded.

**4. Slow recovery.** VBK recovers at 20:04 but the system takes until 20:09 to stabilize, because pending requests and retries must still drain (busy_pay still 200 at 20:06), even though their clients have given up long ago.

### How to fix

**Resolve incident and data immediately:**
- Reconcile each order against VBK debit transactions by {{order}} and {{paymentId}}. Orders with at least one SUCCESS transaction: move to PAID (or ask the customer to keep or refund). Excess transactions: refund via VBK\'s refund API, with a notice to the customer. Log it for incident report.
- Temporarily disable checkout\'s retry for {{/v1/payments}}.

**New timeout budget (decreasing, retry-aware):**

| Layer | Timeout | Note |
|---|---|---|
| gateway | 10 s | keep, is the promise to app |
| checkout → payment | 8 s, **no retry** on POST create payment | or only retry on connect fail before sending request |
| payment → bank-adapter | 7 s | connect timeout 1 s instead of 15 s |
| bank-adapter → VBK | 6 s | on timeout return PENDING, never FAILED |

Better yet, propagate **deadline** per request (e.g. a header carrying the deadline), so each layer computes its remaining time and rejects immediately once past the deadline, instead of static per-service config.

**Idempotency and unknown state:**
- The idempotency key is **orderId** (or payment intent id), sent to VBK as ref, not the paymentId of each attempt. If VBK supports it, reusing the same ref is rejected as duplicate or returns the previous result.
- On timeout: mark the order **PENDING/UNKNOWN**, not FAILED. A job queries VBK\'s transaction status (inquiry API) or receives a callback before finalizing.
- For a slow bank, switch to **async**: API returns 202 with paymentId, the app polls status or receives a push.

**Error isolation:**
- **Circuit breaker** on bank-adapter for VBK (Resilience4j: opens when latency or error ratio crosses the threshold), to fail fast and show "VBK is under maintenance, please choose another method".
- **Bulkhead**: separate pool or semaphore per partner bank in bank-adapter, and isolate the balance API from the payment creation flow (separate pool or service).

### Prevention and alerts

- Alert when partner call p99 exceeds 3 s, when {{tomcat_threads_busy_threads}} exceeds 80% max, and according to the 504 rate at gateway.
- Business alert: number of FAILED orders with SUCCESS debit, run reconciliation close to real time (every 15 minutes) instead of waiting until morning.
- Config review: verify automatically (lint) that the client timeout is smaller than the timeout of the layer calling it, plus retries.
- Periodic chaos test: inject 30 s delay into the mock bank API on staging, verify fail-fast behavior and no duplicate debits.

> Senior tip: When reviewing a synchronous call chain, I always draw a table "who waits whom, how long, how many retries" from outer to inner. Nine out of ten systems I have seen had at least one place where the inner timeout exceeded the outer, usually because someone "loosened the timeout for safety" when the partner slows. The takeaway: timeout is not failure. With money, every timeout must lead to UNKNOWN status and the inquiry mechanism, never to FAILED then retry with a brand-new transaction.`,
    rubric: [
      'Identify the backwards timeout config: gateway 10s < checkout 30s × 3 retries < payment 45s < bank-adapter 60s; after 10 seconds every inner process is wasted but still holds a thread.',
      'Explain pool exhaustion propagation (Little\'s law: ~17 req/s × 35 s exceeds 200 threads) and why the balance API dies along because it shares the Tomcat pool (missing bulkhead).',
      'Prove repeated charging from logs: PAY-9F3A21 SUCCESS after 34,812 ms while checkout had timed out (Broken pipe); retry created PAY-9F3A77 and PAY-9F3B02 with new refs; the order is marked FAILED.',
      'Propose decreasing timeout budget from outer to inner (or propagate deadline), drop retry for non-idempotent POST, idempotency key on orderId, PENDING/UNKNOWN status with inquiry on timeout.',
      'Propose circuit breaker, per-partner bulkhead, handling 217 orders (reconciliation, move to PAID or refund) and near-real-time reconciliation alerts.'
    ]
  },
  'lab-incident-002': {
    title: 'Flash sale at 12:00: retry without backoff amplifies 2,400 requests into 27,000 per second',
    scenario: `**Context:** ShopVN opens a flash sale at **12:00:00 on 20/10/2026**, with discount code **FLASH1111** (10,000 lines). When placing an order, **checkout-service** calls **voucher-service** to validate and reserve the code. voucher-service runs on 8 pods, Tomcat 200 threads and Hikari 30 connections per pod, data on PostgreSQL. The mobile app has a self-retries mechanism when it hits a 5xx or timeout error.

**Symptoms:** From 12:00:10 voucher-service returns errors in bulk. Code FLASH1111 runs out at 12:02:40, the DB finishes contention, but voucher-service is still overloaded. At 12:06 SRE scales voucher-service to 16 pods: no improvement, new pods join the fleet instantly. Only when the gateway rate limit kicks in and a circuit breaker skips voucher at 12:14 does the system recover (12:19). Real purchase volume is estimated at only about 2,400 placements per second.

**Data collected:** Prometheus metrics per minute and per 100 ms, logs of checkout-service and voucher-service, backend and mobile retry configs.`,
    questions: [
      'Calculate the amplification factor from user to voucher-service. Prove it with the Resilience4j metric and the logs of one request.',
      'Why, once FLASH1111 is exhausted and the DB finishes contention, does the system still not self-recover, and scaling to 16 pods help nothing? What does the request distribution per 100 ms tell us?',
      'Propose short-term and long-term fixes: proper retry, protecting the server side, and handling the hotspot of the discount code.'
    ],
    hints: [
      'Each retry layer multiplies the load. Mobile retries up to 3 times, checkout retries up to 5 times. Compare with kind="failed_with_retry": how many requests does each such attempt send to voucher-service?',
      'The read timeout is 1 second, but voucher_p99 from the server is 4.8 seconds: voucher-service still processes requests the client has abandoned. When most capacity goes to useless requests, what happens, even after the root cause is gone?',
      'Look at the 100 ms rows: why do requests cluster into the .0 to .1 window of each second? The retry has no jitter and the flash sale starts exactly at 12:00:00.000.'
    ],
    answer: `**Summary:** This is a **retry storm** leading to a **metastable failure**. The root cause (a row lock voucher contest) only delays by about 2–3 seconds, but two retry layers without backoff or jitter (mobile 3 times × checkout 5 times, 0 ms wait) amplify the load to about **11 times**: 2,400 real placements become roughly 26,900 requests/second to voucher-service. At this point most capacity is consumed by requests the client has already abandoned, so the system cannot self-release, even after the root cause ended at 12:02:40.

### Amplification factor

- From the Resilience4j metric at 12:05: the number of logical calls from checkout is 410 + 280 + 5,130 = 5,820/s, matching {{checkout_in 5,820}}. Real requests to voucher-service: 410 × 1 + 280 × ~3 + **5,130 × 5** ≈ 26,900/s, matching {{voucher_in 26,900}}. 88% of calls fail after exhausting 5 attempts.
- From checkout to app: 5,820 / 2,400 ≈ 2.4. The app retries up to 3 times (headers {{X-Client-Retry}} 1 and 2 in the log).
- Total: 26,900 / 2,400 ≈ **11.2 times**, theoretical maximum is 3 × 5 = 15.
- Log trace 6714904b...: attempt 1 → the 5 attempts are spaced **exactly 1.001–1.002 seconds** apart (read timeout 1 second + 0 ms wait), then returns 503. One second later, the app resends the order with {{X-Client-Retry: 2}}, creating another 5-attempt chain.

### Why it does not self-recover: metastable failure

1. **Useless work:** checkout gives up after 1 second, but voucher-service keeps requests queued in Tomcat and Hikari ({{waiting=171}} per pod, {{hikari_pending}} ~1,370), finishing them in about 4.8 seconds ({{voucher_p99}}). Almost every result is discarded, while each useless request generates additional retries.
2. **Positive feedback loop:** slow → timeout → retry → load increases → slower. After 12:02:40, each request is just a light SELECT/UPDATE ({{SOLD_OUT}}), yet 27,000 requests/second on 8 × 30 = 240 connections still exceeds capacity. An overloaded state sustains itself without the root cause.
3. **Scaling does not help:** going to 16 pods doubles the total connections ({{hikari_pending}} rises to 2,710), adding load to the DB and making it slower. Arrival load scales with error rate, so extra capacity cannot keep up with the load retries create.
4. **Synchronization (thundering herd):** the 100 ms data shows about 64% of requests each second pile into the first 200 ms ({{.0 11204}}, {{.1 6118}}). Flash sale starts exactly at 12:00:00.000, all retries share a fixed 1-second cycle (1 second timeout + 0 ms wait, app waits a fixed 1,000 ms), so wave phases stay aligned. Each tick is a burst 4× the average.
5. **Distraction to ignore:** health check remains {{UP}} (DB still alive, just overloaded); {{db_row_lock_wait}} drops to 0 from 12:03. The DB is not the bottleneck after 12:03.

Only when **cut off the intake** (rate limit at gateway 3,000 requests/second and a circuit breaker skipping voucher) at 12:14 is the loop broken: voucher_in falls immediately to 3,350, p99 recovers to 95 ms after 2 minutes.

### How to fix

**Short term (playbook during an incident):**
- Cut the load: rate limit at gateway, enable a circuit breaker or a feature toggle (orders without voucher, or show 'code sold out').
- Disable retry in one layer (remote config for app: {{maxAttempts}} = 1) to reduce amplification immediately.
- 'Code sold out' info should be cached at the outermost layer: cache the SOLD_OUT flag in checkout or gateway, stop calling voucher-service.

**Long term: proper retry**
- **Retry in only one layer**, usually the closest to the user or a layer with enough context. Never nest retries.
- **Exponential backoff + jitter**, fewer attempts:

~~~java
RetryConfig voucherRetry = RetryConfig.custom()
        .maxAttempts(2)                                        // 1 call + 1 retry attempt
        .intervalFunction(IntervalFunction.ofExponentialRandomBackoff(
                Duration.ofMillis(200), 2.0, 0.5))             // 200ms * 2^n, randomized +-50%
        .retryOnException(e -> e instanceof ResourceAccessException
                && e.getCause() instanceof ConnectException)   // only exceptions before sending request
        .build();                                              // 503/429 and read timeout: do not retry
~~~

- **Do not retry when the server reports overload** (503 or 429). The server returns {{Retry-After}}, the client must honor it.
- **Retry budget**: cap the number of retries in a window, e.g. no more than 10% of successful requests. Implement it yourself with a token bucket, or use the built-in mechanism of a service mesh.
- **Circuit breaker** (Resilience4j) placed before retry: when error ratio exceeds 50%, open the circuit and fail fast, without generating more load.

**Long term: protect the server side**
- **Load shedding**: limit concurrent requests (concurrency limit) and return 503 fast when exceeded, instead of queuing for 4–5 seconds. Drop requests past the client deadline (propagate deadline via header).
- Tomcat {{accept-count}} and small queue, Hikari {{connection-timeout}} short enough to fit the deadline.

**Long term: discount code hotspot**
- Don't allow 2,400 requests/second to UPDATE one row. Use an atomic counter on Redis ({{DECR}} or a Lua script to check and decrement), then write to DB async. Or shard the 10,000 lines into many buckets (sharded counter).
- Mobile: add jitter to decrement (open the 'Buy' button randomly by a few hundred ms), queue up (waiting room) for large flash sales.

### Prevention and alerts

- Dashboard and alert **amplification**: {{voucher_in / checkout_in}} exceeds 1.5 within 2 minutes. Ratio {{failed_with_retry}} over total calls exceeds 20%.
- Load test for flash sale simulates dependent failures (inject 3-second delay into voucher), verify the system self-recovers after dropping the error. This is the test for metastable failure.
- Architectural rule: every retry config must be reviewed together with the whole call chain (table "which layer retries, how many times, how long").

> Senior tip: When you see the system not self-recovering even though the root cause has ended, think immediately of metastable failure. The only way out is to **reduce traffic intake below capacity** (rate limit, turn off retry, turn off feature), not to scale. I always put one line in the runbook: "if voucher_in / checkout_in > 2, turn off retry first, investigate later". Also, a retry with 0 wait and a fixed timeout almost certainly produces synchronized waves. Jitter is not decoration.`,
    rubric: [
      'Calculated amplification: 410 + 280×3 + 5,130×5 ≈ 26,900 requests/second versus ~2,400 real placements (~11 times, max 15 = 3 × 5), with log showing 5 attempts 1 second apart and X-Client-Retry.',
      'Explained metastable failure: server processes requests the client abandoned (p99 4.8 s vs timeout 1 s), positive feedback loop, stays overloaded after FLASH1111 exhausts; scaling does not help because load scales with error and adds connections to DB.',
      'Recognized synchronized waves in the 100 ms data caused by retry without jitter and flash sale starting at the same instant.',
      'Proposed proper retry: only one layer, exponential backoff + jitter, no retry on 503/429 (honor Retry-After), retry budget, circuit breaker; cut load at gateway during an incident.',
      'Proposed server protection (load shedding, concurrency limit, drop expired-deadline requests) and hotfix for discount code (Redis DECR, sharded counter), with amplification alerts.'
    ]
  }
});
