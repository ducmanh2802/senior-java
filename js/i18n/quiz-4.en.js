/*
 * English translation of js/data/quiz.js — task T229. Format: js/core/i18n.js (content overlay).
 * ids: qz-db-005 qz-db-006 qz-microservices-001 qz-microservices-002 qz-microservices-003 qz-microservices-004 qz-microservices-005 qz-microservices-006 qz-design-001 qz-design-002 qz-design-003 qz-design-004 qz-design-005 qz-design-006
 */
App.i18n.content({
  'qz-db-005': {
    q: 'According to Little\'s Law, a system receives 1000 requests per second, and each request takes 50 ms on average for a DB query. What is the minimum number of DB connections needed?',
    options: ['About 5 connections', 'About 500 connections', 'About 50 connections', 'About 1000 connections'],
    explain: `**Correct answer: About 50 connections.**

### Why it is correct
Little\'s Law: {{L = lambda x W}} — the number of concurrent units equals the arrival rate multiplied by the service time.

- Arrival rate {{lambda}} = 1000 requests/second
- Connection holding time {{W}} = 50 ms = 0.05 seconds
- Number of concurrent units {{L}} = 1000 x 0.05 = **50**

This means that on average, 50 requests are holding a connection simultaneously (assuming the connection is held exactly for the 50 ms of the query). This is the **theoretical minimum**; in practice, extra capacity is needed for bursts, typically 1.5–2 times, so about 75–100 connections.

### Why the other options are wrong
- **5 connections**: Too few; the system will have to queue requests, and latency will be multiplied.
- **500 connections**: Too many for the requirement, putting pressure on the database and potentially exceeding {{max_connections}}.
- **1000 connections**: Equivalent to using a thread per request — the worst approach; the database usually cannot handle it.

### Sizing the pool in HikariCP
~~~yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 100
      connection-timeout: 3000     # ms, wait for connection
      leak-detection-threshold: 60000
~~~

### Boundary conditions to remember
- The total number of connections from **all** instances in the cluster must not exceed the {{max_connections}} of the database (including connections from other systems). With 10 instances, each instance should only take a small portion.
- If the pool is **smaller** than the number of concurrently processing threads, threads will have to wait for a connection — that is a signal you should add a separate connection pool for slow tasks (reporting, exports).

> Senior tip: use Little\'s Law to calculate, then **verify with actual metrics**: monitor {{hikaricp.connections.pending}}, connection wait time, and the rate of "connection is not available" errors. If {{pending}} is frequently non-zero, the pool is undersized; if it is mostly {{idle}} but performance is still slow, the problem lies elsewhere (SQL, network, CPU).`
  },
  'qz-db-006': {
    q: 'Two transactions update two tables A and B in different orders, causing a deadlock. Which measure is best?',
    options: ['Unify the locking order throughout the codebase (always lock A before B) and set a short timeout for locks', 'Increase the transaction timeout and retry more times', 'Remove indexes to reduce lock contention', 'Use READ UNCOMMITTED isolation level to avoid waiting for locks'],
    explain: `**Correct answer: Unify the locking order throughout the codebase (always lock A before B) and set a short timeout for locks.**

### Why it is correct
Deadlocks occur when two transactions hold a lock that the other is waiting for, creating a circular wait. The root cause here is **inconsistent locking order**: transaction 1 locks A then B, transaction 2 locks B then A. The most sustainable solution is to define a global order for all transactions — lock by ID in increasing order, or always A then B — so the circular wait cannot be closed.

Additionally, limit the lock wait time (PostgreSQL: {{SET lock_timeout = '2s'}}, or {{FOR UPDATE NOWAIT}} to fail immediately) so transactions don\'t hang indefinitely, and catch the deadlock error at the application layer to retry with randomized backoff.

### Why the other options are wrong
- **Increase timeout and retry more**: This doesn\'t fix the root cause, just prolongs the incident and adds load to the database. Retry should only be a supplement for rare deadlocks, not a substitute for standardizing lock order.
- **Remove indexes**: Completely irrelevant. A deadlock is a problem of locking order between transactions, not about index structure.
- **Use READ UNCOMMITTED**: Completely wrong. Dirty reads are an unacceptable trade-off for order or financial business processes; furthermore, PostgreSQL doesn\'t support this level (treats it as READ COMMITTED).

### Standardizing lock order in code
~~~java
@Transactional
public void transfer(Long from, Long to, BigDecimal amount) {
    Long first = Math.min(from, to);          // always lock smaller id first
    Long second = Math.max(from, to);
    Account a = accountRepo.findByIdForUpdate(first);   // SELECT ... FOR UPDATE
    Account b = accountRepo.findByIdForUpdate(second);
    // ... update balances
}
~~~

> Senior tip: on PostgreSQL, deadlocks are detected quickly (1 second by default) and return an error to the application — catch this error and retry with randomized backoff. If the error persists, push the locking order rule to the repository layer so all services follow it, instead of leaving it to individual decisions.`
  },
  'qz-microservices-001': {
    q: 'The application writes to an order table and publishes an event to Kafka. Why is this a dual-write problem, and what is the correct way to handle it?',
    options: ['Not a problem because both Kafka and the database are distributed systems, so errors will self-sync', 'Publish the event first, then write to the database to avoid writing garbage', 'Use an XA transaction between the database and Kafka to make the two operations one', 'Writing to the database and publishing the event are two independent operations, so one can succeed while the other fails; the correct way is transactional outbox: write the event to an outbox table in the same transaction, then have a publisher read and send it'],
    explain: `**Correct answer: Writing to the database and publishing the event are two independent operations, so one can succeed while the other fails; the correct way is transactional outbox: write the event to an outbox table in the same transaction, then have a publisher read and send it.**

### Why it is correct
These two operations reside in **two different distributed systems** with two separate transaction mechanisms. The database cannot roll back a message already sent to Kafka, and Kafka doesn\'t know if the database has committed or not. Two typical failure scenarios:
1. DB write succeeds, publish fails → **data without event** (consumer doesn\'t know the order was created).
2. Publish succeeds, DB write fails → **event without data** (consumer processes an order that doesn\'t exist).

**Transactional outbox** solves this by writing the event to an {{outbox}} table in the *same transaction* as the business data. A publisher (or CDC tool like Debezium) then reads the outbox table and sends it. If the publish step fails, the outbox data remains to be retried — the event is never lost.

### Why the other options are wrong
- **Systems auto-sync**: No mechanism exists to auto-sync between two independent systems.
- **Use XA**: Kafka **does not** support XA/two-phase commit with external resources. Kafka\'s transactional producer ensures atomicity between multiple writes **within Kafka** (multiple partitions, including commit offset), not with the database. Even for systems supporting XA, 2PC is expensive, the coordinator becomes a bottleneck, and it reduces availability.
- **Publish before DB write**: Only reverses the problem direction; there is still a scenario where the event is processed before the data exists.

### Simple outbox pattern
~~~java
@Transactional
public Order createOrder(OrderRequest req) {
    Order order = orderRepo.save(toEntity(req));
    outboxRepo.save(OutboxEvent.of("ORDER_CREATED", order.getId(), payload(req)));
    return order;      // same transaction: never have an order without an event
}
~~~

> Senior tip: the consumer must also be **idempotent** because the outbox publisher might resend messages (at-least-once). Store the processed event ID and ignore if duplicated. For large systems, use **Debezium** to read CDC from the database\'s WAL instead of polling the outbox table — lower latency and avoids polling load on the database (the outbox table is still written, so remember to clean up old data).`
  },
  'qz-microservices-002': {
    q: 'The client calls the payment API, but the network lags, so the client retries, resulting in the system deducting money twice. What is the standard way to handle this?',
    options: ['Require the client not to retry under any circumstances', 'Use an idempotency key generated by the client, store the processing result by key, and return the old result if the key already exists, combined with a unique constraint in the database', 'Lock the payment endpoint with synchronized so only one request is processed at a time', 'Increase the client timeout to 60 seconds to avoid the need to retry'],
    explain: `**Correct answer: Use an idempotency key generated by the client, store the processing result by key, and return the old result if the key already exists, combined with a unique constraint in the database.**

### Why it is correct
The root problem is: **the client doesn\'t know if the request reached the server**. If a timeout occurs after the server has processed it, the client must retry to avoid losing the transaction — and the server must ensure that retrying does not create side effects a second time.

**Idempotency key** mechanism:
1. The client generates a unique key for each business operation (UUID) and sends it in the header.
2. The server stores the key + result in a table with a {{UNIQUE}} constraint.
3. When receiving a request with an existing key, the server **returns the original result** instead of processing it again.

The {{UNIQUE}} constraint in the database is the necessary condition — it turns "check and write" into an atomic operation, preventing two parallel requests from both processing.

### Why the other options are wrong
- **Ban client retries**: Not feasible in practice. Retry is correct and necessary behavior in unreliable networks; the server must be responsible for idempotency.
- **synchronized on endpoint**: Only protects within one JVM. With multiple instances, two requests can still run in parallel; and synchronized is the wrong way to solve distributed issues.
- **Increase client timeout**: Only reduces the probability of a timeout, doesn\'t eliminate the cause. Longer timeouts make the user experience worse.

### Applying at the data layer
~~~sql
CREATE TABLE payment_request (
    idempotency_key varchar(64) PRIMARY KEY,
    status           varchar(20) NOT NULL,
    response_body    text,
    created_at       timestamptz NOT NULL DEFAULT now()
);
~~~

> Senior tip: keep the idempotency scope **short** (a few minutes to a few hours) and clean up the table; if kept indefinitely, the table will grow too large. For financial operations, add a key at the business level (e.g., each order can only be paid once) because idempotency keys only protect at the API level, not when other business flows act on the same order.`
  },
  'qz-microservices-003': {
    q: 'The circuit breaker is OPEN after multiple failures. What is Resilience4j\'s default behavior?',
    options: ['All calls to the faulty service are rejected immediately (fail fast) without calling downstream, until the wait time passes, then it switches to HALF_OPEN', 'Calls are still passed down but with a shorter timeout than usual', 'The circuit breaker auto-resets after 30 seconds and all calls are allowed through again', 'The circuit breaker switches to CLOSED immediately upon one failed call'],
    explain: `**Correct answer: All calls to the faulty service are rejected immediately (fail fast) without calling downstream, until the wait time passes, then it switches to HALF_OPEN.**

### Why it is correct
Circuit breakers have three states:
- **CLOSED**: calls go through normally; counts errors in a sliding window. Exceeding the threshold (default 50% errors in the last 100 calls) switches it to OPEN.
- **OPEN**: **all calls are rejected immediately** with a {{CallNotPermittedException}} — no call is made downstream, no connection is used, no thread is used. After {{waitDurationInOpenState}} (default 60 seconds), it switches to HALF_OPEN.
- **HALF_OPEN**: allows some trial calls (default {{permittedNumberOfCallsInHalfOpenState}} = 10). If they succeed, it returns to CLOSED; if they fail, it returns to OPEN.

This is the mechanism to block "retry storms" and cascading failures: when downstream is dead, we refuse immediately instead of letting hundreds of requests wait for a timeout and then dump them all at once.

### Why the other options are wrong
- **Passed down but shorter timeout**: Wrong, that is the behavior of {{TimeLimiter}}, not a circuit breaker.
- **Auto-resets after 30s and allowed through**: Wrong, the circuit breaker doesn\'t auto-allow calls when OPEN; it switches to HALF_OPEN and tries only a few calls.
- **CLOSED immediately upon one failure**: Absurd — CLOSED is the state where calls go through; from OPEN, the breaker can only switch to HALF_OPEN, and failures in HALF_OPEN push it back to OPEN, not to CLOSED.

### Resilience4j configuration
~~~yaml
resilience4j:
  circuitbreaker:
    instances:
      payment:
        sliding-window-type: COUNT_BASED
        sliding-window-size: 100
        failure-rate-threshold: 50
        wait-duration-in-open-state: 30s
        permitted-number-of-calls-in-half-open-state: 5
~~~

> Senior tip: always accompany **timeouts** with every downstream call — circuit breakers do not replace timeouts, they only react after failures occur. Set {{waitDurationInOpenState}} shorter if you want to retry sooner (accepting a few failed calls), or longer if downstream needs time to recover. Adjust thresholds based on actual data, don\'t leave it at the default 50% if the system\'s background error rate is already high.`
  },
  'qz-microservices-004': {
    q: 'With Apache Kafka, in what scope is message order guaranteed?',
    options: ['In the entire topic, regardless of partition', 'Within each partition; consumers in the same group read different partitions, so to increase parallelism, the number of partitions must be increased', 'Within each consumer group, regardless of the topic', 'Only when enable.idempotence of the producer is enabled'],
    explain: `**Correct answer: Within each partition; consumers in the same group read different partitions, so to increase parallelism, the number of partitions must be increased.**

### Why it is correct
Kafka divides topics into **partitions**, each partition is a log with a strict recording order. Producers write to partitions based on {{message.key}} (hash), so messages with the same key always go to the same partition and maintain the correct order. Consumers in a group read **each partition by exactly one consumer**, so order is only guaranteed **within a partition**.

Direct consequence: **the number of concurrent consumers cannot exceed the number of partitions**. If there are 10 partitions and 20 consumers in the same group, 10 consumers will sit idle. To increase throughput, you must **increase the number of partitions** — a change that cannot be reversed (Kafka doesn\'t allow reducing partitions), and it changes the mapping of key → partition, so new messages for the same key may go to a different partition, breaking the order by key during the transition.

### Why the other options are wrong
- **Entire topic**: Technically incorrect in Kafka. If global ordering is needed, a single partition must be used — and parallelism is limited.
- **Within each consumer group**: No concept of ordering at the group level.
- **Only when enable.idempotence**: This flag ensures the producer doesn\'t create duplicate messages and maintains order within partitions, but it is not the condition for Kafka to guarantee order within a partition.

### Applying to business
- Want order by **entity** (e.g., commands of the same order): use **entityId as message key** so all messages fall into the same partition.
- Want order by **system-wide event stream**: must accept a single partition, i.e., lose horizontal scalability.

> Senior tip: when consumers process slower than the producer, Kafka\'s **consumer lag** will increase. Monitor lag per partition — lag concentrated on one partition is often due to a hot key (hot key), in which case adding partitions won\'t help (a key always sits on one partition), instead separate the key (add suffix/salting if business allows) or increase processing speed for that key. And remember to commit offset **after** processing is complete; otherwise, data will be lost if the consumer crashes.`
  },
  'qz-microservices-005': {
    q: 'You need to change an API response from a string status to an object with multiple fields. What is the safest way?',
    options: ['Change the response structure immediately and notify consumers via email', 'Create a /v2 endpoint and deprecate the old one immediately', 'Stage 1: add the new field and keep the old one; Stage 2: move consumers to the new field; Stage 3: remove the old field when no consumer uses it', 'Just make the old field nullable and let the client handle it'],
    explain: `**Correct answer: Stage 1: add the new field and keep the old one; Stage 2: move consumers to the new field; Stage 3: remove the old field when no consumer uses it.**

### Why it is correct
This is the **expand – contract** strategy, the fundamental principle of backward-compatible API versioning:
- **Expand**: add the new field, **keep** the old field with compatible values. Old clients still read it and don\'t break.
- **Contract**: only delete the old field after confirming no consumer uses it (via access logs, telemetry, or contracts with each consumer).

Each step can be deployed and rolled back independently, so there is never a moment the system breaks.

### Why the other options are wrong
- **Change immediately then email**: Completely wrong. Consumers are programs, not humans; no one reads emails before deploying.
- **Create /v2 and deprecate /v1**: Creates a period of incompatibility (breaking change) — old clients will break immediately. Wasteful effort to maintain two versions.
- **Make old field nullable**: Nullability is a small detail; the big problem is **the client expects a string type** and will parse incorrectly when encountering an object — errors appear on the client side, very hard to trace.

### Applying to Kafka events
The same principle applies but is harder: events already published cannot be changed. Add a **version to the event payload** and let the consumer know which schema it is processing, and publish the new event in parallel instead of modifying the old one.

> Senior tip: use **consumer-driven contract tests** (Pact, Spring Cloud Contract) to automatically detect if producer schema changes break consumers — this is mandatory protection when having multiple independent teams. And always track "which fields of the response are being read" via access logs or API analytics, as that is the data you need to know if it\'s safe to delete a field.`
  },
  'qz-microservices-006': {
    q: 'Downstream B slows down, dragging down service A\'s threads. What mechanism helps isolate resources between downstreams?',
    options: ['Increase maximumPoolSize of the shared thread pool to have more threads', 'Add retry with backoff for all calls to downstream B', 'Turn off the circuit breaker so no calls are blocked', 'Use bulkhead: a separate thread pool or semaphore for each downstream combined with a short timeout, so slow calls don\'t occupy all shared resources'],
    explain: `**Correct answer: Use bulkhead: a separate thread pool or semaphore for each downstream combined with a short timeout, so slow calls don\'t occupy all shared resources.**

### Why it is correct
**Bulkhead** takes the analogy from maritime engineering: ships have separate watertight compartments, if one compartment floods, it doesn\'t drag down the others. In code, this means separating resources by downstream: each dependency has its own executor or semaphore with a limited number of permits, combined with a short timeout.

When B slows down, the threads dedicated to B run out of permits and new calls to B are rejected quickly (fail fast) — while calls to C and D still run normally. This is the "partial failure" that we want in microservice architecture.

### Why the other options are wrong
- **Increase shared thread pool**: Makes the shared resource even thinner. When B slows down, threads are still occupied, just more threads to burn through — resources are still depleted, just slower.
- **Add retry**: Retrying while downstream is slow makes the situation **worse**: more calls, connections held longer, creating retry storms. Retry should only be used for *transient* errors (network reset, 503) not for slow downstream services.
- **Turn off circuit breaker**: Completely wrong, this is how you lose the only protection mechanism currently working correctly.

### Configuring bulkhead with Resilience4j
~~~java
@Bulkhead(name = "clientB", type = Bulkhead.Type.THREADPOOL)
@CircuitBreaker(name = "clientB")
@TimeLimiter(name = "clientB")
@Retry(name = "clientB")
public CompletableFuture<Response> callB(Request req) {
    // THREADPOOL bulkhead and TimeLimiter require CompletionStage return type
    return CompletableFuture.completedFuture(client.execute(req));
}
~~~

> Senior tip: bulkhead, circuit breaker, timeout, and retry are **four independent layers of protection**; don\'t use just one. With annotations, Resilience4j (Spring Boot) wraps in the default order from outside in: Retry → CircuitBreaker → RateLimiter → TimeLimiter → Bulkhead → actual call. This means each retry goes through the circuit breaker, and timeout counts per attempt. Always accompany metrics for each layer so you know where the issue lies before addressing it.`
  },
  'qz-design-001': {
    q: 'Need to limit 100 requests/minute per user at the API gateway. How do token bucket and sliding window differ?',
    options: ['Token bucket allows bursting up to the number of accumulated tokens, while sliding window hard-limits over each time interval; token bucket is easier to implement in a distributed way with an atomic Lua script on Redis', 'Token bucket is more accurate than sliding window in all cases, so always choose token bucket', 'Sliding window doesn\'t need to store state on the server, so it is more suitable for distributed systems', 'Both give identical results, just differing in how RateLimit headers are written'],
    explain: `**Correct answer: Token bucket allows bursting up to the number of accumulated tokens, while sliding window hard-limits over each time interval; token bucket is easier to implement in a distributed way with an atomic Lua script on Redis.**

### Why it is correct
- **Token bucket**: the bucket holds up to N tokens, refilled at a rate of R tokens/second. Each request consumes 1 token; if out of tokens, it is rejected. Because tokens accumulate over time, the system **accepts bursts** (using all accumulated tokens) — very similar to the real-world behavior of API limits.
- **Sliding window**: the "log" version stores timestamps of requests in the last 60 seconds (e.g., Redis sorted set) and compares with the threshold — accurate in terms of "not exceeding 100 requests/minute" but memory-intensive according to request count; the "counter" version approximates by using two weighted fixed windows, lighter but not absolutely accurate.

Regarding accuracy, sliding window is the *stricter* way; token bucket is more flexible and a popular choice for APIs because the user experience is better (allowing them to queue commands then call them at once).

### Why the other options are wrong
- **Token bucket always more accurate**: Wrong, sliding window is more accurate; with a bucket filled to 100 tokens and a refill rate of 100 tokens/minute, a user can send nearly 200 requests in a 60-second window (100 pre-accumulated tokens + 100 tokens refilled).
- **Sliding window doesn\'t need state**: Wrong, both methods need to store state (token count or timestamp list) to decide whether to allow the request.
- **Both give identical results**: Distinctly different in burst behavior, and the {{RateLimit-Remaining}} header value is calculated differently.

### Atomic implementation on Redis
~~~lua
-- KEYS[1] = key, ARGV[1] = capacity, ARGV[2] = refillRatePerSec, ARGV[3] = nowMs
local data = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(data[1]) or tonumber(ARGV[1])
local ts = tonumber(data[2]) or tonumber(ARGV[3])
tokens = math.min(tonumber(ARGV[1]), tokens + (tonumber(ARGV[3]) - ts) / 1000 * tonumber(ARGV[2]))
if tokens < 1 then
    redis.call('HMSET', KEYS[1], 'tokens', tokens, 'ts', ARGV[3])
    return 0
end
redis.call('HMSET', KEYS[1], 'tokens', tokens - 1, 'ts', ARGV[3])
return 1
~~~

Since the Lua script in Redis runs **atomically**, reading–checking–subtracting is an atomic block, no lock needed.

> Senior tip: don\'t forget Redis is shared infrastructure — if it crashes, the entire gateway might lose rate limiting. Have a "fail open" (allow) or "fail closed" (block) fallback depending on risk level, and place a **local** rate limit (token bucket in process memory) at the gateway edge to filter garbage early, then use Redis for precise global limits.`
  },
  'qz-design-002': {
    q: 'In a URL shortener system, when redirecting from a short code to the destination URL, should 301 or 302 be used?',
    options: ['301 Moved Permanently so browsers cache the redirect long-term, reducing server load', 'No difference, all redirect status codes are handled the same by browsers', '307 Temporary Redirect is mandatory because it preserves the POST method of the client', '302 Found so every access queries the server, allowing for click measurement and destination URL changes later'],
    explain: `**Correct answer: 302 Found so every access queries the server, allowing for click measurement and destination URL changes later.**

### Why it is correct
- **301** implies "permanently": browsers and bots will **cache** the redirect and stop asking the server. This reduces load, but makes it **impossible to measure clicks accurately** and **impossible to change back** — if the destination URL is blocked, you cannot redirect users elsewhere.
- **302** is temporary redirect: every access queries the server. In return, you get accurate click statistics and can fix the mapping (change destination, block, count ranking).

For most URL shortener products, **302 is the default choice**. If you use 301, only use it when the destination URL is truly immutable (e.g., link in a one-time email) and you accept losing statistics.

### Why the other options are wrong
- **301 to cache and reduce load**: True technically, but wrong from a business perspective for most cases — losing measurement and the ability to fix. (Some major services still choose 301 for SEO and load reduction, then measure clicks differently — that is a conscious trade-off.)
- **307 mandatory for POST**: 307 (and 308) preserves the method, but redirects in URL shorteners are almost always GET. There is no technical reason to use 307 here.
- **No difference**: Completely wrong, browser caching behavior is significantly different.

### Considerations
- **Destination URL must be moderated** (check for dangerous URLs, phishing, prohibited content) and may need deletion after expiration.
- **Cache hit rate**: Mapping table code → URL should be cached in Redis or CDN before touching the database.

> Senior tip: design to **change destination without deployment**: store mapping in the database and allow admins to fix it. Remember to add appropriate {{Cache-Control}} headers — if you use 301 but still want to measure clicks, set custom cache headers instead of relying on the status code.`
  },
  'qz-design-003': {
    q: 'Multiple requests read a hot cache key at the same time it expires, causing "cache stampede" and overwhelming the database. What is the best way to handle this?',
    options: ['Increase TTL to be very large so the cache never expires', 'Use a distributed lock on cache miss so only one request actually calls the database, others wait then read the cache; combine with TTL jitter and refresh the cache before it expires', 'Delete the cache instead of reading when a miss is detected', 'Add unlimited retries for requests that miss'],
    explain: `**Correct answer: Use a distributed lock on cache miss so only one request actually calls the database, others wait then read the cache; combine with TTL jitter and refresh the cache before it expires.**

### Why it is correct
Cache stampede occurs when hundreds of requests meet a miss and all call the database. Classic solutions include three layers:
1. **Lock on miss** (cache-aside with lock): only one request wins the lock and goes to call the database; other requests wait for a short time, then read the cache (and if still miss, try again with backoff).
2. **TTL jitter**: add a random interval to the TTL so keys created at the same time don\'t all expire at the same time, avoiding periodic "bunching effects".
3. **Early refresh (early refresh)**: for hot keys, reload the value **before** the TTL expires — via a background job, or probabilistic early expiration (each request has a small probability to self-reload when the key is about to expire, probability increases as it nears expiration). While reloading, still return the old value, so hot keys never fall into a miss state during high traffic.

### Why the other options are wrong
- **Increase TTL**: Trade-off on data freshness (stale data) and doesn\'t solve the key being deleted by other events (invalidation). Sooner or later, you will still hit stampede.
- **Delete cache on miss**: Meaningless — miss means there\'s nothing to delete, and this behavior makes it worse.
- **Unlimited retries**: Turns the situation into a disaster: each request retrying multiple times only adds more load to the database exactly when it is weakest.

### Sample code
~~~java
public String get(String key) {
    String v = redis.get(key);
    if (v != null) return v;
    String lockKey = "lock:" + key;
    if (redis.tryLock(lockKey, 5, TimeUnit.SECONDS)) {   // SET NX PX, own token
        try {
            v = redis.get(key);                 // double-check: could have just been loaded
            if (v != null) return v;
            v = loadFromDb(key);
            redis.set(key, v, ttlWithJitter()); // TTL + random
            return v;
        } finally {
            redis.unlock(lockKey);              // unlock only lock we hold
        }
    }
    for (int i = 0; i < 20; i++) {              // don\'t hold lock: wait for others to load
        sleep(50);
        v = redis.get(key);
        if (v != null) return v;
    }
    throw new CacheBusyException(key);          // or return stale value/fallback
}
~~~

> Senior tip: for systems with very high traffic, use **cache in front of the database** (CDN, Redis) combined with **early refresh** to keep the cache always warm. If using Caffeine at the application layer, turn on {{refreshAfterWrite}}: when a key past the refresh point is read, Caffeine immediately returns the old value and reloads asynchronously (only one reload for each key), instead of letting all requests wait for a synchronous reload when the key expires.`
  },
  'qz-design-004': {
    q: 'Flash sale: 1,000 products, 100,000 requests in 1 second, each person only gets to buy 1. What way both ensures not overselling, and quickly rejects most requests once sold out?',
    options: ['Put all requests into a Redis queue then process sequentially later, ensuring no one is missed', 'Use an atomic stock limitation mechanism (e.g., Lua script to reduce remaining quantity if available, combined with a unique constraint per user at the database layer) so only requests that actually have stock proceed', 'Use load balancer round-robin and hope requests are distributed evenly', 'Check stock at the UI layer then return an error when sold out'],
    explain: `**Correct answer: Use an atomic stock limitation mechanism (e.g., Lua script to reduce remaining quantity if available, combined with a unique constraint per user at the database layer) so only requests that actually have stock proceed.**

### Why it is correct
The requirement has **two conditions that must be true simultaneously**: total items sold does not exceed 1,000, and a person cannot buy 2 products. Both need **atomic** operations (check-and-set).

The Redis layer (Lua script) is responsible for "is it still in stock?": the script executes atomically so 100,000 requests cannot simultaneously read the same stock value then write — only the number of requests corresponding to the remaining stock proceed. The database layer applies a {{UNIQUE (product_id, user_id)}} constraint to block a person from buying twice, combined with conditional stock update {{UPDATE ... WHERE stock > 0}} to never go negative.

### Why the other options are wrong
- **Queue then process sequentially**: Regarding inventory guarantee, it is correct, but it doesn\'t meet the "fast rejection" requirement: 99,000 people who don\'t have stock still have to wait for their turn to know the result, and the queue grows huge. In flash sales, **fast rejection** of requests that don\'t meet criteria is a must.
- **Round-robin load balancer**: Solves nothing; race conditions lie at the data layer, not in request distribution.
- **UI-layer check**: Clients can skip UI or send requests in parallel; client-side checks are never a guarantee mechanism.

### Important additions
- **Order queue** is still needed for the *write* to the database: after Redis confirms stock, record the order into a queue to process asynchronously, avoiding 100,000 writes running simultaneously against the database.
- **Bot prevention**: limit by IP, device, behavior; prevent one bad actor from setting up 1,000 accounts to buy 1,000 times.

> Senior tip: real flash sales resemble concert ticket problems: **reserve first (Redis) then pay (queue)**. Remember that Redis is a critical single point of failure that needs maintenance (multi-AZ, failover), because if it crashes, the entire mechanism to prevent overselling collapses. Always have a safe fallback: if Redis isn\'t ready, **refuse** to sell rather than letting it through — overselling is much more expensive than selling slowly.`
  },
  'qz-design-005': {
    q: 'In a realtime chat system, how to ensure messages are in the correct order and not duplicated when the client loses network and resends?',
    options: ['Rely on the client-sent timestamp to sort messages', 'Let the client sort the message list itself based on received order', 'Server assigns a sequence number increasing by receipt time, client keeps lastSeenSeq to pull missed messages, and includes messageId for server deduplication', 'Just attaching a timestamp by the server to each message is enough to ensure order and no duplication'],
    explain: `**Correct answer: Server assigns a sequence number increasing by receipt time, client keeps lastSeenSeq to pull missed messages, and includes messageId for server deduplication.**

### Why it is correct
Two independent mechanisms are needed:
- **Ordering**: The server is the only source of truth, assigning {{seq}} incrementally. The client stores {{lastSeenSeq}} and upon reconnecting can request "give me messages from seq N onwards". The timestamp sent by the client cannot be used because clocks drift and the network can reorder traffic.
- **Deduplication**: Each message has a {{messageId}} generated by the client (UUID). The server stores received IDs (Redis SET with TTL, or unique table in DB) and ignores if duplicated. This makes client retries safe.

### Why the other options are wrong
- **Rely on client timestamp**: Wrong — client clocks drift, and the user can change the machine\'s time.
- **Let client sort**: Client only sees what it has received; if packets are lost, the display order will be wrong and there is no way to know what is missing.
- **Only server timestamp**: Timestamp only indicates *the time*, doesn\'t guarantee ordering relationship when multiple messages have the same millisecond resolution, and doesn\'t solve duplication.

### Suggested architecture
- WebSocket for the realtime channel, but **persistence is the source of truth**: write the message to the DB (or Kafka) first, then broadcast.
- When the client reconnects: sync history according to {{lastSeenSeq}} first then enable realtime, to avoid missing messages at the transition moment.

> Senior tip: clearly separate **global room order** and **display order**: server ensures by seq, while the client can group messages by time for display. Seq is assigned **per chat room** (no need for global order across rooms), thanks to which partitioning by roomId is easy; for very crowded rooms, the seq counter of a room becomes a write hotspot (every message must go through it), so put that room on a separate partition/leader or assign seq in batches.`
  },
  'qz-design-006': {
    q: 'Notification service sends millions of emails and SMS to users. How to avoid resending when the consumer retries?',
    options: ['Increase the number of workers to send faster', 'No need to handle it because users accept duplicate notifications', 'Shorten the email API timeout so the system isn\'t congested', 'Use idempotency key by recipient, template and business code, storing sent records to skip duplicate sends'],
    explain: `**Correct answer: Use idempotency key by recipient, template and business code, storing sent records to skip duplicate sends.**

### Why it is correct
Message queues guarantee **at-least-once**: if the consumer finishes processing but crashes before committing the offset, the message will be redelivered and the notification resent. The notification system must endure this via **idempotency**.

The business key is usually a triplet: {{(recipientId, templateCode, businessId)}} — e.g., send "order shipped" for order {{ord_123}}. The server stores sent records by this key with TTL (a few days depending on business); duplicate sends are detected and skipped.

Another protective layer: use the **idempotency key/token of the provider** if their API supports it (check each provider\'s documentation; many email/SMS APIs don\'t have this mechanism), to avoid sending and being charged twice. Note there\'s still a crack: if the worker sends successfully but crashes before recording the "sent" record, the retry will resend — idempotency on our side reduces duplication to a very rare level, not eliminating it absolutely.

### Why the other options are wrong
- **Increase workers**: Only makes the system send faster, doesn\'t solve at-least-once, and increases risk of duplicate sends due to parallel processing of multiple messages with the same key.
- **Accept duplicate sends**: With transactional notifications (payment confirmation, OTP), duplicate sends cause confusion and can be a security issue when OTPs are resent.
- **Shorten timeout**: Short timeouts cause more errors, which means retries increase, which means duplicate sends increase — going in the wrong direction.

### Design additions
- **Retry with backoff by error type**: 5xx/temporary errors get retried, 4xx (bad address) errors go to **dead-letter queue** for manual handling.
- **Rate limit by provider**: to avoid account block API.
- **Template versioning**: to know which template was used for a sent message, for reconciliation.

> Senior tip: separate queues by **priority** (OTP and transactional notifications in one queue, marketing in another) so a marketing email campaign doesn\'t clog security notifications. And always have a dashboard tracking **number of duplicates skipped** — if this number suddenly spikes, it is often a sign the consumer is retrying incorrectly.`
  }
});
