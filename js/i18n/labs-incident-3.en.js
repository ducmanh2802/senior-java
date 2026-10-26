/*
 * English translation of js/data/labs-incident.js — task T261. Format: js/core/i18n.js (content overlay).
 * ids: lab-incident-004 lab-incident-005 lab-incident-006 lab-incident-007 lab-incident-008 lab-incident-009
 */
App.i18n.content({
  'lab-incident-004': {
    title: 'Flash sale page hangs for 30 seconds roughly every 5 minutes: cache stampede on a single hot key',
    scenario: `**Context:** During the flash sale campaign on **22/10/2026**, the campaign-1111 product listing page on **ShopVN** receives about **9,000 requests/second**. **product-service** (20 pods, Spring Boot 3.3, Tomcat 200 threads, Hikari 20 connections per pod) caches results in Redis via Spring Cache with a 5-minute TTL. On cache miss, the service runs a 4-table join query on PostgreSQL 15 (about 420 ms when the DB is idle). checkout-service shares the same DB.

**Symptoms:** From 12:00, roughly every 5 minutes there is a 20–40 second window where the flash sale page returns errors or is extremely slow, DB CPU hits 99%, and **checkout slows down too** (p99 goes from 180 ms to nearly 7 seconds). Outside those windows everything is normal; the cache hit ratio is 99.9%. One teammate suggests "raising the TTL to 30 minutes to be safe" and another suggests "adding jitter to the TTL".

**Data collected:** Metrics for 10 seconds around the 12:05 window, Redis MONITOR (sampled a few seconds), application logs, {{pg_stat_activity}} and {{pg_stat_statements}}, and the cache code and configuration.`,
    questions: [
      'Explain the mechanism causing the periodic stall windows. Why is the gap between two windows about 5 minutes 37 seconds rather than exactly 5 minutes?',
      'How many DB queries run per window instead of 1? Evidence from Redis MONITOR, pg_stat_statements and pg_stat_activity. Why is checkout also affected?',
      'Evaluate the two proposals "raise TTL to 30 minutes" and "add jitter to the TTL". What would you fix now, and what long term?'
    ],
    hints: [
      'The whole page uses ONE key. When the key expires, every request during the window it takes to re-load sees a miss. @Cacheable does not lock by default: whoever misses runs the query themselves.',
      'Count the SET commands for the same key in MONITOR, and the calls count in pg_stat_statements. If there were only one load every 5 minutes, how many per hour? Each SET has PX 300000.',
      'Jitter helps when many keys expire at the same moment. How many keys are at play here? Think about refreshing before expiry and serving stale data while refreshing.'
    ],
    answer: `**Summary:** This is a **cache stampede** (also called dogpile or thundering herd) on **one hot key**, {{flashsale::campaign:1111:items}}. When the key expires, thousands of concurrent requests all see the miss at once, and because {{@Cacheable}} has no request coalescing, every request runs the heavy query itself. Around 500 identical queries in flight push DB CPU to 99%, each query takes 14–21 seconds instead of 420 ms, and checkout, which shares the DB, slows down too.

### Mechanism

1. At 12:05:21.4 the key expires (TTL 5 minutes counted from the last SET of the previous window).
2. At 9,000 requests/second, dozens of requests see the miss within milliseconds: the log shows 3 {{cache miss ... -> loading}} entries within 1 ms across 2 pods. Each request calls {{repo.loadCampaignItems}} on its own.
3. Hikari allows 20 connections per pod, i.e. 400 concurrent queries across 20 pods: {{hikari 400/3,412}}, and {{pg_stat_activity}} shows **371 + 29 = 400** sessions running exactly that query (371 on CPU, 29 waiting on LWLock). The 420 ms query becomes about 21 seconds because 400 queries contend for CPU.
4. Tomcat runs out of threads ({{tomcat 4,000}}), new requests queue, and product p99 is around 20 seconds. Requests that missed earlier still have to run the query once they get a connection.
5. The first query finishes at 12:05:43.1 and SETs into Redis; from that point new requests hit. But the **~500 loaders** started earlier keep running and SET one by one until 12:05:58.7. Each SET carries {{PX 300000}}, so the TTL is **reset** by the last SET.
6. Therefore the next expiry is 12:05:58.7 + 5 minutes = **12:10:58.7**, which matches the data. The cycle is the 5-minute TTL plus the duration of the stampede window (about 37 seconds), explaining why the windows drift: 12:00:00.1, 12:05:21.4, 12:10:58.7, 12:16:36.2.

### Quantitative evidence

- Redis MONITOR: **505 SET commands** for the same key, same payload (98,213 bytes), from 12:05:43.118 to 12:05:58.702 — meaning 505 query runs per window instead of 1.
- {{pg_stat_statements}}: **6,212 calls** in one hour while only about 12 are needed (one per 5 minutes). Mean **13,870 ms** vs the normal 420 ms. This query consumed 86,160 seconds of total execution time in one hour, double the order-insert query.
- Metrics: {{loads}} is 171 + 112 + 164 + 58 = 505, matching the SET count. hit_ratio 0% at 12:05:30, {{db_cpu 99%}}.
- Checkout dragged along: {{INSERT INTO orders}} waits on {{Lock}} and CPU, {{slow order insert ... 6120 ms}}, {{checkout_p99 6.9 s}}. A single cache miss on a browsing page broke the revenue-generating checkout flow.
- Noise: {{GET /v1/products/SKU-77120 200 41 ms}} is a different endpoint with its own cache, unaffected.

### Evaluating the proposals

- **Raise TTL to 30 minutes:** only reduces frequency from roughly every 5 minutes to every 30 minutes; each incident still takes the page down for 30–40 seconds. Flash sale prices and remaining quotas would also be up to 30 minutes stale. It does not fix the root cause.
- **Add jitter to the TTL:** useful when **many keys** are loaded together and expire together (e.g. the warm-up job loading 10,000 products at 11:55). Here the problem is **one key** read by thousands of concurrent requests, so jitter changes nothing.

### Fix

**Short term (deploy same day):**
1. {{@Cacheable(sync = true)}}: Spring calls {{Cache.get(key, valueLoader)}}, and within one JVM only one thread runs the loader while the others wait for its result. Queries per window drop from ~500 to at most 20 (one per pod), which the DB can absorb. Note: this is a lock within one JVM, not a distributed lock.
2. **Refresh before expiry (refresh-ahead):** a {{@Scheduled}} job every 60 seconds calls a method with {{@CachePut}} for live campaigns, keeping the TTL of 5–10 minutes as a safety net. In normal conditions the key never actually expires.

**Long term:**
- **Stale-while-revalidate (logical expiry):** store the value with a {{softExpireAt}} field and a longer physical TTL (e.g. 30 minutes). Past {{softExpireAt}}, one request acquires a distributed lock ({{SET lock:campaign:1111 <token> NX PX 10000}}) and refreshes asynchronously; all other requests keep serving stale data for a few seconds. Nobody waits on the DB.

~~~java
CachedValue<List<FlashSaleItemDto>> v = redis.get(key);          // value + softExpireAt
if (v != null && v.softExpireAt().isAfter(Instant.now())) return v.data();
if (v != null) {                                                  // stale: 1 request refreshes, others serve stale
    if (lock.tryAcquire("lock:" + key, Duration.ofSeconds(10))) refreshAsync(campaignId);
    return v.data();
}
return loadWithLockOrWait(campaignId);                           // nothing yet: lock + short wait
~~~

- **Two-level cache:** Caffeine in each pod with {{refreshAfterWrite(30s)}} (async refresh while serving the old value) and {{expireAfterWrite(10m)}}, with Redis as level 2. This also reduces 9,000 GET commands/second against a single Redis key (a hot key can also overload a single Redis shard).
- **Protect the DB:** give the heavy query its own small connection pool (bulkhead), set {{statement_timeout}} on reads, and make sure one product-browsing feature cannot monopolize checkout's DB. Optimize the query (indexes, a pre-aggregated table for campaigns).

### Prevention and alerting

- Alert when a cache's {{miss/s}} spikes (e.g. more than 100x baseline) or hit ratio falls below 90% for 30 seconds.
- Alert when the cache-load query's {{calls}} in {{pg_stat_statements}} exceeds a per-minute threshold (normally about 0.2 runs/minute).
- Watching for the "regularly periodic failure" pattern on dashboards: a cycle close to the TTL is almost always a stampede.
- Load test deliberately deleting the hot key ({{DEL}}) under peak load.

> Senior tip: For every "hot" key (homepage, flash sale, config), the first question I ask is: "What happens when this key disappears at peak load?" The only acceptable answer is "one process reloads, the others keep using the stale value". The TTL should be a safety net, not the primary refresh mechanism. And remember every SET resets the TTL: multiple loaders writing will make the failure window drift, which is a great clue when reading dashboards.`,
    rubric: [
      'Identify a cache stampede on one hot key: key expires, @Cacheable does not lock so every missing request runs the heavy query itself; 400 identical queries in flight (limited by Hikari 20 × 20 pods) push DB CPU to 99%.',
      'Quantitative evidence: 505 SET commands for the same key in MONITOR, loads 171+112+164+58 = 505, pg_stat_statements 6,212 calls/hour vs about 12 needed, mean 13,870 ms vs 420 ms.',
      'Explain the ~5 minute 37 second cycle: every SET with PX 300000 resets the TTL from the last SET of the previous window; explain why checkout slows too (shared DB).',
      'Correctly rebut: raising TTL only lowers frequency and makes data staler; jitter only helps when many keys expire together, not for a single hot key.',
      'Propose: sync=true (JVM lock), refresh-ahead or stale-while-revalidate with a distributed lock, two-level cache (Caffeine refreshAfterWrite), bulkhead and statement_timeout for the DB; alerts on miss rate and cache-load query runs.'
    ]
  },
  'lab-incident-005': {
    title: 'Webhook sender service restarts every 25 minutes: Too many open files and 62K sockets in CLOSE_WAIT',
    scenario: `**Context:** Payment gateway **PayHub** runs a **merchant-notify** service (Spring Boot 3.2, JDK 17, Apache HttpClient 5.2) that sends payment-result webhooks to about 3,000 merchants over HTTPS. Failed webhooks are retried on a backoff schedule. There are 4 pods, and the container's file descriptor limit is 65,536. In August, the service hit pool-exhaustion errors while sending webhooks ({{ConnectionRequestTimeoutException}}). The fix applied back then was to raise {{maxConnTotal}} and {{maxConnPerRoute}} to 50,000.

**Symptoms:** On **23/10/2026**, from about 11:06, merchant-notify stops accepting new requests, the log fills with {{Too many open files}}, the liveness probe fails and the pod restarts at 11:09. After restart the pod runs normally for about 25 minutes, then it repeats. CPU, heap and GC all look normal. At 10:41, large merchant **M-0042** deploys a new version and their webhook endpoint starts returning **HTTP 500**.

**Data collected:** Output of {{ss}} and {{/proc}} inside the pod at 11:07 (before the restart), metrics, logs and the webhook-sending code.`,
    questions: [
      'What are the file descriptors being spent on? What does the CLOSE_WAIT state mean, and which side is "at fault"?',
      'Find the leaking code and prove it by connecting the artifacts (timing, growth rate, peer addresses, pool metrics). Why did the August "fix" make the incident worse?',
      'Propose a short-term fix, long-term fix and alerts. Is restarting via liveness probe an acceptable mitigation?'
    ],
    hints: [
      'CLOSE_WAIT means the remote side sent FIN (closed the connection) and the kernel ACKed, but our application has NOT called close() on the socket yet. A socket in this state can persist forever.',
      'Resolve IP 112.213.89.40 to a hostname. From 10:41, fds grow about 12,200 every 5 minutes, i.e. about 40 per second. Compare with m42_5xx/s and with leased.',
      'In HttpClient 5 classic, a connection only returns to the pool when the response is closed or the entity is fully read. What error would a 20-connections-per-route pool report under this leak, and what about a 50,000 pool?'
    ],
    answer: `**Summary:** {{WebhookSender.deliver}} **does not close the response on the error path** (status other than 2xx). Every webhook that receives a 500 from M-0042 leaves one connection permanently leased in the pool. After about 75 seconds idle, the merchant's server closes the connection; our socket enters **CLOSE_WAIT** and keeps holding a file descriptor. At roughly 40 failed webhooks per second, the process exhausts 65,536 FDs in about 25 minutes: Tomcat cannot accept new connections, the liveness probe fails, the pod restarts, and the cycle repeats.

### What CLOSE_WAIT means

When the other side closes the connection (sends FIN), our kernel ACKs and puts the socket in CLOSE_WAIT, **waiting for the application to call close()**. The kernel has no timeout for this state. So thousands of CLOSE_WAIT entries are almost always **a bug in our own application** (a forgotten close), not a network fault or the merchant's fault. By contrast, TIME_WAIT is the normal state of the side that closed first and clears itself after a while; here there are only {{timewait 47}}, negligible.

### Evidence

- {{ls /proc/1/fd | wc -l}} equals **65536**, exactly the {{Max open files 65536}} limit.
- {{ss -tan state close-wait | wc -l}} reads 62,040, i.e. **62,039 sockets** (minus the header line). Of those, **58,214** go to **112.213.89.40**, and {{getent hosts}} shows that is {{webhook.m0042-shop.vn}}. The other peers (1,873, 611, ...) are a slow accumulation since 19/10 from other merchants occasionally failing.
- {{ss -tanp}}: all CLOSE_WAIT sockets belong to {{"java",pid=1}} with fds reaching 40,211 and beyond.
- **Timing and growth rate:** fds hold at ~4,300 until 10:40, then climb steadily **about 12,200 every 5 minutes, i.e. about 40.6/second** from 10:41, matching {{m42_5xx/s}} around 40 and the first log {{webhook merchant=M-0042 ... status=500}} at 10:41:07. (65,536 − 4,357) / 40.6 ≈ 1,507 seconds, about 25 minutes from 10:41:07, matching the first {{Too many open files}} at 11:06 and the 25-minute restart cycle.
- **Pool:** {{leased}} rises in lockstep with fds (always about 460 lower, reaching 65,079 at 11:07), while {{avail}} stays flat around 210. Connections are borrowed and never returned. 65,079 = 62,039 CLOSE_WAIT + about 3,040 connections to M-0042 still ESTABLISHED (leaked within the last 75 seconds, server has not closed yet).
- **Consequences:** Tomcat {{Socket accept failed ... Too many open files}} (cannot accept new requests, including probes), HttpClient cannot create new sockets to other merchants ({{M-1007 ... SocketException: Too many open files}}), webhook/s drops to 41. Kubelet reports the liveness failure and restarts the pod.
- Noise: CPU, heap and GC are stable and unrelated. GC cannot help because the pool (a singleton) keeps strong references to the leased connections.

### The leaking code

~~~java
CloseableHttpResponse resp = httpClient.execute(post);
if (code >= 200 && code < 300) {
    EntityUtils.consume(resp.getEntity());   // only the 2xx branch returns the connection
    return DeliveryResult.ok(code);
}
return DeliveryResult.retryLater(code);      // error branch: connection leased forever
~~~

In HttpClient 5 classic, a connection only returns to the pool when **the entity is fully consumed** or **the response is closed**. The 5xx branch does neither. If an exception is thrown midway ({{signer}}, {{getCode}}), the connection leaks too.

### Why the August "fix" made it worse

With the old limit of 20 connections per route, this leak would have surfaced as **that route's pool exhausting** after 20 failures: only webhooks to the failing merchant got {{ConnectionRequestTimeoutException}}, other merchants were unaffected, and the error pointed right at the culprit. Raising it to 50,000 **masked the symptom** and turned a localized, easily diagnosable error into a global one: process-wide FD exhaustion, taking down both the inbound API and webhooks for all 3,000 merchants. Pool limits are a bulkhead by design.

### Fix

**Short term (hotfix):** always close the response via try-with-resources, or better, use the response-handler API (HttpClient 5 closes it for you and returns the connection to the pool):

~~~java
DeliveryResult deliver(Merchant m, WebhookEvent ev) throws IOException {
    HttpPost post = buildPost(m, ev);
    return httpClient.execute(post, response -> {          // HttpClientResponseHandler
        int code = response.getCode();
        EntityUtils.consume(response.getEntity());          // drain the body (cap size if needed)
        return (code >= 200 && code < 300) ? DeliveryResult.ok(code) : DeliveryResult.retryLater(code);
    });                                                       // connection always released, even on exception
}
~~~

While waiting to deploy: pause webhooks to M-0042 (manual circuit breaker) and notify the merchant.

**Long term:**
- Return the pool limits to sensible values (e.g. 500 total, 20 per route). A per-route pool exhaustion is a signal, not an error to hide.
- Configure connection housekeeping: {{evictExpiredConnections()}} and {{evictIdleConnections(TimeValue.ofSeconds(30))}} on the builder, plus a time-to-live for connections, so idle sockets get closed proactively.
- **Per-merchant circuit breaker and bulkhead:** one failing merchant must not consume shared resources. Escalate retry backoff and suspend after N consecutive failures.
- Put the service into a test environment with fault injection: a mock merchant returning 500, 404, timeouts, mid-response disconnects; assert FDs do not grow.
- Raise the FD limit to be generous, but **never treat raising ulimit as the fix**: pushing it to a million only moves the crash from 25 minutes to a few hours.

### Is restarting via liveness probe acceptable?

It is why the system "self-heals" every 25 minutes, but it is a very poor mitigation: each restart drops in-flight webhooks and inbound requests, retried webhooks can cause duplicate deliveries (merchants must handle idempotency per event id), and the incident gets masked. Use it only as a deliberate stopgap (scheduled rolling restarts) while waiting for the hotfix.

### Alerts

- {{process_files_open_files / process_files_max_files}} above 70%, and a sustained positive growth rate for 15 minutes.
- CLOSE_WAIT socket count per pod (node exporter or a script counting {{ss}}) above a few hundred.
- {{httpcomponents_httpclient_pool_total_connections}} with state="leased" rising without falling, or approaching max.
- 5xx rate per merchant: one failing merchant must be visible individually, not averaged into the total.

> Senior tip: When you see lots of CLOSE_WAIT, group sockets by peer address with {{ss}} and map back to the code that calls that peer. There is almost certainly one branch (usually an error or exception path) that never closes the response, stream or connection. The rule I enforce in reviews: every {{CloseableHttpResponse}}, {{InputStream}}, {{ResultSet}} must be in try-with-resources, or use a callback-style API so the library closes it. And never "fix" pool exhaustion by raising the pool size before proving there is no leak.`,
    rubric: [
      'Explain CLOSE_WAIT correctly: the remote side closed (FIN), our application has not called close(), the socket holds an FD indefinitely; it is an application bug, not a network or merchant fault.',
      'Evidence: 65,536 FDs equals the limit, 62,039 CLOSE_WAIT of which 58,214 to 112.213.89.40 (webhook.m0042-shop.vn), fds growing 40/second from 10:41 matching m42_5xx/s, leased rising while avail stays flat, FDs exhausted after about 25 minutes.',
      'Identify the exact code: the non-2xx status branch neither consumes the entity nor closes the response, so the connection stays leased forever; GC cannot reclaim it because the pool holds the reference.',
      'Explain how raising maxConnTotal and maxConnPerRoute to 50,000 masked the leak and turned a per-route localized error into process-wide FD exhaustion.',
      'Propose: try-with-resources or response handler, restore pool limits, evict idle and expired connections, per-merchant circuit breaker, alerts on FDs, CLOSE_WAIT and leased pool; explain why liveness restarts or raising ulimit are not solutions.'
    ]
  },
  'lab-incident-006': {
    title: 'Hikari pool exhausted by a transaction waiting on HTTP',
    scenario: `@Transactional updates inventory then calls a slow risk API that takes 28 seconds. The 20-connection Hikari pool drains, and even read endpoints fail despite DB CPU at 18%.`,
    questions: ['Why does the pool drain despite low DB CPU?','Propose a redesign of the flow and an incident response.'],
    hints: ['The HTTP call happens inside the transaction.','Little law: 1.8×28≈50 connections.'],
    answer: `**Summary:** The transaction holds a connection for the entire risk API call; 20 long-waiting requests drain the pool and 31 more queue behind them.
### Evidence
The log shows UPDATE, then HTTP; PostgreSQL sessions are idle in transaction; Hikari active=20, idle=0. By Little law, 1.8 req/s × 28s requires about 50 connections.
### Fix
- Split the transaction: write PENDING/outbox and commit, call the risk API outside the transaction, then a new transaction finalizes the result; use a saga with inventory compensation.
- Cap load, add timeouts, circuit breakers and bulkheads; handle idempotency.
- Monitor connection hold time, pending threads and transaction age.
> Senior tip: Low query time but high connection hold time usually means non-DB I/O inside a transaction.`,
    rubric: [
      'States that the transaction holds a connection, producing idle in transaction',
      'Computes the ~50 connection demand vs a pool of 20',
      'Proposes short transactions / outbox',
      'Mentions idempotency and timeout/breaker',
      'Mentions pending / hold-time metrics'
    ]
  },
  'lab-incident-007': {
    title: 'Kafka rebalance caused by a batch exceeding the max poll interval',
    scenario: `A Kafka consumer processes a batch of 500 records sequentially, and each record may wait on the tax API for 30 seconds. Lag grows and the group rebalances continuously.`,
    questions: ['Explain the rebalance and distinguish heartbeats.','Fix batch sizing, offsets and downstream errors.'],
    hints: ['500×30s exceeds 300s.','Heartbeat does not replace poll.'],
    answer: `**Summary:** A batch can take 15,000 seconds between two polls, exceeding max.poll.interval.ms of 300 seconds. The consumer is removed, partitions are revoked and a rebalance happens; uncommitted records may be replayed.
### Analysis
The log shows a poll of 500 records, then timeouts, then the interval warning. Heartbeats keep the session alive; the max poll interval limits how long the application may go without polling.
### Fix
- Size batches by p99 and cap timeout/retry.
- Use bounded workers with backpressure; commit offsets in partition order.
- Make side effects idempotent; send persistent errors to a retry topic/DLQ; raise the interval only after measuring.
- Track poll interval, rebalances, lag and uncommitted offsets.
> Senior tip: Size batches for worst case, not average latency.`,
    rubric: [
      'Computes 500×30s exceeding 300s',
      'Distinguishes heartbeat vs max poll',
      'Mentions replay due to uncommitted offsets',
      'Smaller batches / bounded workers / ordered commits',
      'Idempotency and retry topic'
    ]
  },
  'lab-incident-008': {
    title: 'ThreadLocal MDC retains payloads on a worker pool',
    scenario: `Heap grows after a deploy, and logs carry stale requestIds. A filter sets MDC and RequestContext ThreadLocals but does not clean up on every branch.`,
    questions: ['Explain the leak and the stale requestId.','How would you fix the exception and async paths?'],
    hints: ['Worker threads outlive requests.','Clean up in finally.'],
    answer: `**Summary:** The ThreadLocal value is tied to a long-lived worker; missing cleanup keeps payloads alive and MDC leaks the requestId into the next request.
### Evidence
MAT shows only the path Thread→threadLocals→RequestContext, retained 612MiB / 184 entries; the same worker emits a stale requestId even when the header is absent.
### Fix
Put {{MDC.clear()}} and {{RequestContextHolder.reset()}} in finally, and do not store request bodies or credentials. For async work, pass context explicitly, or capture/restore/clear via an executor decorator. Test the exception path and a new request reusing the same worker.
> Senior tip: Thread pools carrying context need a capture, restore, clear convention; MDC contamination can leak data.`,
    rubric: [
      'Explains the ThreadLocal lifecycle and the missing finally',
      'Cites the heap dump and the stale log from the same worker',
      'Cleanup in finally',
      'Safe async propagation, avoiding PII',
      'Proposes a worker-reuse test'
    ]
  },
  'lab-incident-009': {
    title: 'Retry storm amplifying a catalog failure',
    scenario: `Order, pricing and the DB proxy each allow up to three attempts per layer, counting the initial call. The catalog slows down; attempts surge even though user traffic is unchanged.`,
    questions: ['Compute the retry amplification.','Redesign the retry policy and protect the downstream.'],
    hints: ['Three layers with up to 3 attempts each: 3×3×3=27 downstream calls for one logical request if every call needs retries.','Ingress is stable while downstream load grows >10x; real-world measurements do not necessarily reach the worst case.'],
    answer: `**Summary:** Three layers allow up to 3 attempts each, counting the first, so one logical request can generate up to 27 downstream calls. As the catalog slows, retries without jitter/budget help push it from 100 to 1,044 attempts/s even though user traffic stays flat.
### Analysis
p99 rose from 80ms to 1.8s and errors hit 42%; retries stacked on top of requests inflate concurrency and queues.
### Fix
- Retry at only one layer, max 2–3 attempts, exponential backoff with full jitter, only for transient errors and idempotent operations.
- Propagate deadlines, apply a retry budget, bulkheads, circuit breakers and load shedding.
- Use idempotency keys; separate logical requests from physical attempts on dashboards.
> Senior tip: Track the amplification ratio to catch retry storms early.`,
    rubric: [
      'Computes 27 attempts',
      'Cites stable user traffic vs catalog at 1,044/s',
      'A single retry layer, jitter, limits',
      'Deadline/budget/bulkhead/breaker',
      'Idempotency and logical/physical metrics'
    ]
  }
});
