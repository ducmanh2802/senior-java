/*
 * English translation of js/data/labs-incident.js — task T450. Format: js/core/i18n.js (content overlay).
 * ids: lab-incident-012 lab-incident-013
 */
App.i18n.content({
  'lab-incident-012': {
    title: 'Switching the Redis cache serializer on deploy leaves the cache "empty" and takes the database down with it',
    scenario: `**Context.** **catalog-service** (16 pods, Spring Boot 3.3, Spring Cache + Redis 7 via Lettuce, Hikari 20 connections/pod) serves product details to the web app, the mobile app, and to **checkout-service** (which reads prices). The {{product}} cache has a 6-hour TTL, about **1.8 million keys**, and a **98.5%** hit ratio at 6,000 req/s. On a miss the service runs a 5-table join on PostgreSQL 16 (RDS 8 vCPU), ~35 ms when the DB is idle. A previous load test showed the DB can handle at most about **1,400 product queries/second**.

**Event (29/10/2026).** At 14:00 **v5.2** is deployed with the PR "switch the cache to JSON so the Node.js service can read it". From 14:03 product pages get slower; by 14:06 p99 reaches 9 seconds and checkout fails 31% of the time because price calls time out. Redis CPU is only 18%, memory keeps growing. The rollout continues because the readiness probes of the new pods are all green.

**What you have.** The cache config diff, per-minute metrics, application logs, Redis information and {{pg_stat_statements}}.`,
    questions: [
      'What is the root cause? Why is Redis still healthy and still holding 1.8 million keys, yet the hit ratio falls to 6.8%?',
      'Use the numbers: when the hit ratio drops, how many queries/second does the DB have to handle compared with its capacity of ~1,400/s? Why does checkout go down as well?',
      'What do you do in the next 5 minutes, and how should the serializer/key change have been rolled out safely?',
    ],
    hints: [
      'The diff adds prefixCacheNameWith("catalog:v2:"): the new key is catalog:v2:product::id, while the 1,812,004 old keys product::id are still sitting there but nobody reads them.',
      'Misses/second = req/s × (1 − hit ratio). At 13:58: 6000 × 1.5% = 90. At 14:06: 6000 × 93.2% = ? Compare that with 1,400.',
      'Rolling back to v5.1 still leaves the old keys with up to 6 hours of TTL. Next time: dual-read (read the new key, on a miss read the old key and convert it), warm up, canary, @Cacheable(sync = true) and a concurrency limit while loading from the DB.',
    ],
    answer: `**Summary:** PR v5.2 changed **both the key prefix and the serializer**, so to the new pods all 1.8 million old keys become "invisible": every request misses and falls through to the DB. The rolling update gradually raises the share of new pods to 16/16, the hit ratio falls from 98.5% to 6.8%, the required query load rises to about **5,600/s** while the DB can only handle ~1,400/s. The DB sits at 100% CPU, Hikari is exhausted, catalog is 9 seconds slow, and checkout (which depends on catalog for prices) fails 31% of the time. This is a **cold-cache stampede caused by a deploy**, not a hot key expiring. The fastest fix is a **rollback**, because the old keys are still in Redis, so the hit ratio recovers immediately. Next time: change the cache format expand/contract (dual-read), warm up, canary, and protect the DB while loading.

### Background: cache-aside and why "the cache is part of your capacity"
Spring {{@Cacheable}} follows **cache-aside**: look in Redis by key; if present, return it; otherwise call the method (query the DB) and write the result to Redis. Spring Data Redis's default key is {{cacheName::key}}, for example {{product::880213}}; {{prefixCacheNameWith("catalog:v2:")}} turns it into {{catalog:v2:product::880213}}. To Redis those are **two completely different keys**.

The most important point: with a 98.5% hit ratio, the DB only sees 1.5% of the traffic. **System capacity = DB capacity / miss ratio**. The DB handles 1,400/s divided by 1.5% ≈ 93,000 req/s "on paper". But when the cache is empty, capacity drops to exactly 1,400 req/s. The cache is no longer an "optimization"; it is a **load-bearing component**.

### Root cause, step by step
1. **14:00** rollout of v5.2, maxSurge 4: 4 new pods (25% of traffic) read keys {{catalog:v2:...}}: 100% miss. The old pods still hit the old keys.
2. Miss demand/second ≈ 6,050 × (1 − 0.741) ≈ **1,570**, already above the DB's capacity of ~1,400 (14:01 row: the DB only manages 1,410/s) → DB CPU 96%, query time 38 ms → 610 ms.
3. When queries are slow, each request holds its connection longer → Hikari's 20 connections/pod are exhausted ({{total=20, active=20, idle=0, waiting=187}}) → catalog requests wait 30 seconds.
4. The readiness probe only checks that the app has started; it does **not** check service quality → the rollout continues to 8, 12, 16 pods. Hit ratio 50% → 28% → **6.8%**. Demand: 6,020 × 0.932 ≈ **5,610 queries/s**, four times capacity. The DB cannot do more than ~1,350/s (table), and the rest queue and then time out.
5. The cache **refills slowly** precisely because the DB is the one congested: in 6 minutes only 100,444 new keys were loaded (against the 1.8 million needed). On top of that, **per-key stampede**: {{@Cacheable}} without {{sync = true}} means 16 pods × hundreds of threads all miss the same hot product and query the DB together ("412 concurrent loaders" for id 880213). {{pg_stat_statements}}: 497,331 calls for 100,444 ids → each id loaded ~5 times.
6. **checkout** calls catalog for prices with a 2-second timeout → 31% errors. A change "only about the cache format" takes the payment flow down.

~~~text
              hit 98.5%                         hit 6.8%
req 6000/s ──> Redis ──miss 90/s──> DB       req 6000/s ──> Redis ──miss 5610/s──> DB (max 1400/s)
                                   CPU 21%                                       CPU 100%, queue
~~~

### Evidence
- Diff: **"prefixCacheNameWith("catalog:v2:")"** and **"GenericJackson2JsonRedisSerializer"**: new key, new format.
- Redis: **"product::* 1812004"** (the old keys are all still there) versus **"catalog:v2:product::* 100444"**; Redis CPU 18%: Redis is not the bottleneck.
- Table: hit 98.5 → 74.1 → 50.2 → 27.9 → 6.8% **matching** v5.2 pods 4 → 8 → 12 → 16; DB queries 90 → 1,410 and then stuck at ~1,350/s; DB CPU 100%.
- {{pg_stat_statements}}: **calls 497331, mean 1288.4 ms**; 100,444 distinct ids.
- Logs: Hikari **waiting=187**, **"412 concurrent loaders"**, checkout **"Read timed out (2000 ms)"**.

### How to fix
**Within 5 minutes:**
- {{kubectl rollout undo deployment/catalog-service}}. The old {{product::*}} keys still have TTL (up to 6 hours), so the v5.1 pods hit immediately and the DB sheds load within tens of seconds. This is a case where a rollback is **cheaper than any forward fix**.
- If rolling back is not possible: pause the rollout for now ({{kubectl rollout pause}}), reduce DB load with rate limiting/load shedding at the gateway for product pages, and prioritize checkout's price path.

**Changing the cache format safely (expand/contract):**
1. **Expand**: the new version **reads the new key, and on a miss reads the old key** (deserializing with the old serializer), converts it and writes to the new key. No request has to hit the DB just because the format changed.
2. Or **warm up** first: a job reads the old keys / the top N hot products and writes the new keys, then checks the new keys' hit ratio before shifting traffic.
3. **Canary** 1 pod + watch the hit ratio and DB QPS; stop the rollout automatically (Argo Rollouts analysis) if DB QPS > 2× normal.
4. **Contract**: once the new keys are full and stable, remove the code that reads the old key; the old keys expire by TTL.

**Protecting the DB from stampede:**
- {{@Cacheable(cacheNames = "product", key = "#id", sync = true)}}: within **one JVM**, only one thread loads each key, the other threads wait. Across pods there can still be duplicates (at most 16 per key instead of hundreds); blocking that entirely needs a distributed lock ({{SET NX}} with a short TTL) or request coalescing.
- **Bulkhead for the loader**: cap concurrent DB queries per pod (for example a Semaphore of 8) and **fail fast** (return 503 or stale data) instead of queueing for 30 seconds and holding the thread.
- Split the **price path for checkout** (critical) from product pages: separate cache, separate timeout, or read from a replica.

### Prevention
- Treat **every change to a key, prefix, serializer, cache name, or the data type of a value** as a data migration, with a checklist.
- Alert on hit ratio < 90% and DB QPS > 3× baseline; include the hit ratio in canary analysis.
- Load-test with an **empty cache** (cold start) so you know the real capacity when Redis loses its data (failover, flush).

### Common mistakes
- Thinking a serializer change is a "refactor with no impact": in reality it wipes the whole cache.
- Changing only the serializer and not the prefix: new pods read old keys with the JSON serializer → deserialization errors (SerializationException), which is even worse.
- Flushing Redis ({{FLUSHALL}}) to "clean up" before a deploy, creating a cold cache yourself.
- Believing {{sync = true}} stops stampede across multiple pods.

### One-minute spoken answer
"v5.2 changed the cache prefix and the serializer, so the new pods cannot see the 1.8 million old keys and every request misses down to the DB. The rollout progressively adds new pods, so the hit ratio falls from 98.5% to 6.8%; the DB needs 5,600 queries/s when it can only handle 1,400, CPU hits 100%, the pool is exhausted, and checkout's price calls time out. The fastest fix is a rollback because the old keys are still in Redis. Next time I change the cache format expand/contract: read the new key, on a miss read the old key and convert it, warm up, canary while watching the hit ratio, and protect the DB with sync=true and a limit on concurrent loads."

> Senior tip: The question I always ask when reviewing a system with a cache is: **"What happens if the cache is empty during peak hours?"**. If the answer is "the DB falls over", then the cache is a mandatory component, and every change that touches it has to be deployed like a database migration: with a plan, a way back, and measurements. My rule of thumb: the DB must handle at least 20–30% of the traffic in the miss state, and the rest has to go through a controlled rejection mechanism.`,
    rubric: [
      'Identify the root cause: the prefix + serializer change creates a new keyspace, the old keys are still there but the new pods never read them, so the cache is cold in step with the rollout',
      'Compute the DB demand: 6000 × (1 − hit) ≈ 5,600 queries/s against a capacity of ~1,400/s; chain it: DB CPU 100% → Hikari exhausted → catalog slow → checkout timeouts',
      'Cite evidence: Redis product::* 1,812,004 vs catalog:v2 100,444, the hit ratio falling with the number of v5.2 pods, pg_stat_statements calls/mean, 412 concurrent loaders',
      'Propose rollback as the fastest option because the old keys are still there; roll out safely with dual-read/warm-up/canary driven by the hit ratio',
      'Protect the DB: sync=true (limits within one JVM), distributed lock/coalescing, a bulkhead for the loader, splitting the critical path; alert on the hit ratio',
    ],
  },
  'lab-incident-013': {
    title: 'Recommendation hangs and the liveness probe kills the whole BFF pod by pod: a cascading failure caused by missing timeouts',
    scenario: `**Context.** **product-page-bff** (10 pods, Spring Boot 3.2, Java 17, Tomcat {{threads.max = 200}}, {{accept-count = 100}}) assembles the data for the product page: product information, price, stock, and the "Recommended products" block from **recommendation-service**. The recommendation block is **not important**: the page can still sell without it. Traffic is ~900 req/s (90 req/s per pod), a recommendation call normally returns in 60 ms. Starting one BFF pod takes ~45 seconds.

Kubernetes probe (both on the application's port 8080):
~~~yaml
livenessProbe:  { httpGet: { path: /actuator/health/liveness,  port: 8080 }, periodSeconds: 10, timeoutSeconds: 1, failureThreshold: 3 }
readinessProbe: { httpGet: { path: /actuator/health/readiness, port: 8080 }, periodSeconds: 5,  timeoutSeconds: 1, failureThreshold: 2 }
~~~

**Incident (29/10/2026).** At 21:00:10 the Elasticsearch cluster behind recommendation-service hits a long GC pause; recommendation accepts connections but **does not reply**. By 21:01 the whole product page returns 503. Recommendation recovers at **21:09**, but the BFF only stabilizes at **21:31**: pods keep restarting (restartCount 4–7).`,
    questions: [
      'Describe the causal chain from "recommendation stops replying" to "the whole site returns 503". Why does a feature that is not important take the whole site down?',
      'Why did the BFF have to wait until 21:31 when recommendation had already recovered at 21:09? What part did the liveness probe play?',
      'Propose a fix: timeouts, fault isolation, fallback, and correct probe configuration.',
    ],
    hints: [
      'new RestTemplate() uses SimpleClientHttpRequestFactory, which has no connect/read timeout by default. 90 req/s per pod and every request holds one thread forever: how long until the 200 threads are exhausted?',
      'The HTTP probe hits the same port 8080 and needs a Tomcat thread to answer. No threads → the probe waits more than 1 second → readiness takes the pod out of the Service, and 3 liveness failures → kill. The remaining pods take the extra traffic.',
      'A restart does not cure a slow downstream. Liveness should only answer "is the process broken beyond self-recovery"; put management on a separate port, use a short timeout for reco, give it its own bulkhead, and fall back to an empty list.',
    ],
    answer: `**Summary:** RestTemplate called recommendation **with no timeout**, so when recommendation hung, every BFF request held a Tomcat thread indefinitely; at 90 req/s per pod, the 200 threads are exhausted in about **2.2 seconds**. The probe shares port 8080, so it gets no thread to answer either: readiness pulls the pod out of the Service (0 endpoints → 503 for the whole site), and 3 liveness failures **kill** the pod. A restart does not fix a downstream; a new pod takes the traffic of the whole fleet, exhausts its threads again and is killed again: a **restart storm** that lasts 22 minutes after recommendation has already recovered. Fix: short timeouts, a bulkhead and an empty-list fallback for the recommendation block, a separate management port for probes, and liveness that does not depend on request threads.

### Background: thread-per-request and why timeouts are mandatory
Tomcat (Spring MVC) uses the **one thread per request** model. That thread does everything, including **waiting** for an outgoing HTTP call. The pool has 200 threads, like a counter with 200 staff: if every staff member phones a department that does not answer and **never hangs up**, after a while nobody is left to serve customers, not even someone asking "is the counter open?" (the health check).

Little's law: busy threads = arrival rate × hold time. Normal: 90 req/s × 0.06 s ≈ **5.4** busy threads (matching the 6 in the table). When the hold time is unbounded: 200 threads / 90 req/s ≈ **2.2 seconds** to exhaust. After that, new requests wait in the accept queue (100) and are then rejected.

{{new RestTemplate()}} uses {{SimpleClientHttpRequestFactory}} (HttpURLConnection) with connect/read timeouts that default to **unbounded**. The stack trace shows the thread parked in {{HttpClient.parseHTTPHeader}} → waiting for the first byte of the response with no deadline.

### Causal chain
1. **21:00:10** recommendation hangs (accepts TCP but does not reply). Every BFF request sticks in {{RecommendationClient.fetch}}.
2. ~2 seconds later, 200/200 threads are busy (jstack: elapsed 2.1–28.4 s, all with the same stack). 5xx 12%.
3. The HTTP probe hits port 8080 → no thread available → kubelet waits 1 second → {{context deadline exceeded}}. Readiness fails twice (10 seconds) → the pod is removed from the Service. At 21:00:40 only 3 pods are ready → 3 pods carry the traffic of 10 → they exhaust faster. At 21:01:30 **0 endpoints** → nginx returns 503 for the **whole site**, including the parts unrelated to recommendations.
4. Liveness fails 3 × 10 seconds (21:00:42, :52, 21:01:02) → **Killing**. The container takes 45 seconds to restart; as soon as it is ready it takes the backlog of traffic, calls the still-hanging recommendation again → exhausts → is killed again. 26 restarts by 21:05.
5. **21:09** recommendation recovers, but: freshly started pods have cold JIT (several times slower), and with only 1–2 pods ready at a time each pod takes 1/2 of the total traffic of the site (450 req/s instead of 90) → threads still exhaust because processing time went up → liveness keeps killing. The system falls into a **self-sustaining** (metastable) state: the root cause is gone but the loop "overload → kill → fewer pods → more overload" keeps running. It only exits when enough pods happen to be ready at the same time (21:31).

~~~text
reco hangs ─> threads wait forever ─> 200/200 threads busy ─> probe timeout
   ├─ readiness fail ─> fewer ready pods ─> remaining pods overloaded ─┐
   └─ liveness fail  ─> kill/restart 45s ─> fewer pods ────────────────┤
                                                                        └─> 0 endpoints ─> 503 for the whole site
after 21:09: new pod (cold JIT) takes 5x traffic ─> exhausts ─> liveness kill ─> repeat until 21:31
~~~

### Evidence
- jstack: **200/200** {{http-nio-8080-exec-*}} threads in {{RecommendationClient.fetch}} → {{RestTemplate.doExecute}} → {{HttpURLConnection.getInputStream0}} → {{parseHTTPHeader}}; **not a single thread** serving health.
- Code: **"return new RestTemplate(); // no timeout configured"**.
- Events: **"Readiness probe failed ... Client.Timeout exceeded while awaiting headers"** 21:00:31; liveness failing 21:00:42/52, 21:01:02 and then **"Container bff failed liveness probe, will be restarted"**.
- Ingress: **"0 endpoint ready -> 503"**. Metrics: busy threads 6 → 200, ready pods 10 → 3 → 0, restarts 0 → 53, recommendation p99 back to 0.07 s at 21:09 but 5xx still 88%.

### How to fix
**1. Timeouts on every outbound call**, smaller than the page's time budget:
~~~java
@Bean
RestTemplate recoRestTemplate() {
    var f = new SimpleClientHttpRequestFactory();
    f.setConnectTimeout(Duration.ofMillis(200)); // cannot open a connection within 200 ms: give up
    f.setReadTimeout(Duration.ofMillis(300));    // wait at most 300 ms for the response (normal p99 60 ms)
    return new RestTemplate(f);
}
~~~
**2. Isolation (bulkhead) + fallback**: the recommendation block runs on its own bounded executor (for example 20 threads, a small queue) or a Resilience4j {{Bulkhead}}, together with a **circuit breaker**: once failures/timeouts pass the threshold it stops calling for 30 seconds and returns an **empty list**. The page still shows products, price and stock. The blocks can be called in parallel with a shared deadline (CompletableFuture with {{orTimeout}}), and any block that is late gets dropped.

**3. Probes with the right roles:**
| Probe | The question it answers | What it should depend on |
|---|---|---|
| startupProbe | "Has it finished starting up?" | the 45 s startup time (so liveness does not kill a pod that is still booting) |
| readiness | "Should it receive traffic right now?" | the pod's own state; **not** unimportant downstreams |
| liveness | "Is the process broken in a way a restart would fix?" | almost only "is the JVM alive"; **never** a downstream |
- Set {{management.server.port=8081}}: actuator runs on a separate server (its own connector and threads), so probes do not compete with business requests for threads.
- Liveness {{timeoutSeconds}} 3–5, a higher {{failureThreshold}}; add a {{startupProbe}}.
- Consider HPA/minReadySeconds and slow start at the load balancer so new pods do not take a flood of traffic while their JIT is still cold.

### Prevention
- Code review rule: **no HTTP client without a timeout**; use one shared, pre-configured builder bean.
- Chaos test: inject **infinite latency** (not a 500 error) into each dependency and confirm the page still serves.
- Alert on {{tomcat_threads_busy_threads / max > 0.8}} and on restarts per minute.

### Common mistakes
- Only testing a downstream that **fails fast** (500), not one that **hangs**: hanging is far more dangerous.
- Wiring the DB/downstream health into liveness, turning an external failure into mass restarts.
- Setting too large a timeout (30 seconds) for a non-critical block: threads still exhaust, just more slowly.
- Raising {{threads.max}} to 1,000: it only delays the moment of exhaustion and costs RAM.

### One-minute spoken answer
"RestTemplate called recommendation with no timeout, so when recommendation hung, every request held a Tomcat thread forever; at 90 req/s, 200 threads are gone in about 2 seconds. The probe shares port 8080, so it got no answer either: readiness pulled pods out of the Service until there were 0 endpoints and the whole site returned 503, and liveness killed pods. A restart does not fix a downstream, so new pods took the backlog and were killed again; even though recommendation recovered at 21:09, the BFF stayed down until 21:31. I fix it with 200/300 ms timeouts, a bulkhead and a circuit breaker with an empty-list fallback for the recommendation block, a separate management port for probes, liveness that depends neither on request threads nor on downstreams, and a startupProbe."

> Senior tip: Two questions I always ask when reviewing a service: **"How long is the timeout on every outbound call, and does the total stay under the SLA?"** and **"If dependency X hangs (not fails), does the page still run?"**. The liveness probe is a double-edged knife: used wrong, Kubernetes turns a partial incident into a total one. From experience: liveness should be very "tolerant" (restart only on a deadlock or a truly broken process), while resilience has to live in the code through timeouts, bulkheads and fallbacks.`,
    rubric: [
      'Identify that RestTemplate has no timeout, so threads wait forever; use Little\'s law to show 200 threads exhaust in ~2.2 seconds at 90 req/s',
      'Explain that the probe shares port 8080 and needs a Tomcat thread: readiness removes pods until 0 endpoints (whole site 503), liveness kills pods; cite the events and the jstack 200/200 threads',
      'Explain the restart storm/metastable state after 21:09: new pods have cold JIT and take the backlog, get killed again; a restart does not cure a downstream',
      'Propose short timeouts, a bulkhead + circuit breaker + empty fallback for a non-critical feature',
      'Configure probes correctly: separate management port, liveness independent of downstreams, startupProbe, sensible timeout/threshold',
    ],
  },
});
