/*
 * English translation of js/data/lessons-design.js — task T275. Format: js/core/i18n.js (content overlay).
 * ids: lesson-design-001 lesson-design-002 lesson-design-003 lesson-design-004 lesson-design-005
 */
App.i18n.content({
  'lesson-design-001': {
    title: 'Rate limiter: Token bucket and sliding window log',
    goals: [
      'Simulate token bucket with injected time to prevent double-refilling for the same time interval',
      'Compare token bucket\'s burst capability with the precise limits of sliding window log',
    ],
    body: `### What does rate limiting protect?
Rate limiters restrict the rate of incoming work so that a single client, a buggy tenant, or a retry storm doesn't exhaust threads, connection pools, or downstream budgets. Before choosing an algorithm, clearly define the key (user, API key, tenant, or route), the unit (requests/sec, bytes/sec), allowed burst, and what happens when rejected (HTTP 429, queue, or fallback). Limiting at the gateway protects the system early; service-level limiting is still necessary when there are many internal calls.

### Token bucket step-by-step
A bucket has capacity C and current tokens T. Each request requires one token. Elapsed time Δt adds r × Δt tokens, but T is capped at C. A request is accepted when T ≥ 1, then one token is subtracted. For example, C=5, r=2 tokens/sec: after sitting idle for 2 seconds, there are at most 5 tokens, allowing a burst of 5 requests; thereafter, it can only continue at an average of 2 requests/sec. The bucket doesn't accumulate infinitely because anything exceeding C is discarded.

~~~text
T := min(C, T + elapsed × refillRate)
if T >= cost: T := T - cost; allow
else: reject
~~~

Time must be an input to make the algorithm deterministic and testable. In production, use a monotonic clock for duration, not a wall clock which can jump when NTP adjusts the time. If multiple instances limit the same tenant, per-instance RAM counters increase the total quota proportional to the number of instances. Shared state like Redis with atomic operations (often Lua scripts) is needed, or deliberate quota partitioning; separate read-then-write operations have race conditions.

### Sliding window log
Stores the timestamp of each accepted request within a window. When time t arrives, discard timestamps ≤ t-window, then accept if the remainder is less than the limit. This algorithm correctly expresses the limit for any window segment, but memory usage is O(requests in window) per key and cleanup is expensive. For high loads, a sliding window counter divides the window into small buckets to reduce memory but has errors near boundaries. Fixed windows are cheaper but allow almost double the burst at the boundary of two consecutive minutes.

| Algorithm | Burst | Memory | Accuracy |
|---|---|---|---|
| Token bucket | Yes, up to capacity | O(1)/key | Doesn't provide long-term quota |
| Sliding log | No limit exceed in any window | O(requests/window) | Almost precise |
| Fixed window | Can spike at boundaries | O(1)/key | High at boundaries |

### Implementation in applications
In a single JVM, synchronize the bucket or use proper concurrent structures. With Redis, combine state reading, token calculation, and writing into an atomic script; use TTL to clean up inactive keys. Define clearly what happens when Redis fails: fail-open increases overload risk, fail-closed compromises availability. Bucket4j provides many backends and refill configurations; Redis/Gateway is suitable when quotas need sharing. Metrics for allowed, rejected, key count, and backend latency are needed, but avoid attaching user IDs to metric labels causing cardinality explosion.

### Operational pitfalls
Token cost can vary by endpoint; if the limiter only counts requests, a 1 GB upload is treated the same as a health check. Keying by IP behind a proxy is wrong without verifying trusted proxy headers. Multiple replicas with the same refill configuration don't create a cluster-wide quota if each replica maintains its own bucket. When changing capacity/rate, know if the old state is migrated or reset. Returning 429 should have a proper Retry-After, but clients still need jitter to avoid thundering herd retries.

### Interview notes
State the quota scope and overflow semantics first; then choose bucket if controlled burst is needed, or sliding log if window precision is required. The exercise below uses an injected clock so that boundary tests are not flaky and don't require sleep.`,
    exercises: [{
      title: 'Implement token bucket with a mock clock',
      prompt: 'Implement {{TokenBucket(capacity, refillPerSecond, nowMillis)}}. {{allow(nowMillis)}} refills tokens based on elapsed time, caps at capacity, then consumes one token if enough are available. Time must not go backwards; if now is less than the previous mark, consider elapsed as 0 and do not move the mark backwards.',
      hints: ['Create state consisting of tokens and last; start with a full bucket.', 'Convert milliseconds to seconds before multiplying by the rate; update last monotonically and clamp tokens.'],
      explain: 'Each call multiplies elapsed by the refill rate to create a fractional amount of tokens; keep it as a double so 500 ms at a rate of 1/s accumulates into half a token. Only allow when at least 1 is available. Use {{Math.min}} to prevent long idle periods from creating a burst larger than capacity. In production, rate/capacity must be validated, and distributed state must be updated atomically.',
    }],
    check: [
      { q: 'Why does token bucket allow burst?', options: ['Tokens accumulate up to capacity when there are no requests', 'It stores all timestamps', 'Each instance synchronizes with Redis itself', 'Because refill has no limit'], explain: 'Correct: idling accumulates finite tokens up to capacity. Sliding log stores timestamps (not tokens); Redis doesn\'t sync itself; refill is capped by capacity, so it\'s not infinite.' },
      { q: 'What is most important when sharing a quota across multiple replicas?', options: ['Use a static field', 'Use shared state and atomic updates', 'Increase the limit on each replica', 'Use a wall clock for accuracy'], explain: 'Local state multiplies the quota by the number of replicas. A shared store needs atomic operations to prevent two requests from both reading the last token. Static only shares within one JVM; increasing limits results in incorrect quotas; wall clock doesn\'t solve synchronization.' },
    ],
  },
  'lesson-design-002': {
    title: 'Cache eviction: LRU and LFU',
    goals: [
      'Use LinkedHashMap access-order for a concise LRU and recognize thread-safety limits',
      'Explain the map plus doubly linked list structure and LFU\'s frequency buckets',
    ],
    body: `### Cache needs an eviction policy
A cache keeps copies of expensive-to-calculate or expensive-to-read data. When full, an eviction policy decides which entry to remove; policies are only effective when future access patterns relate to history. A cache is not a source of truth: it needs TTL, invalidation, size limits, and defined behavior on cache miss. LRU assumes that recently used items are likely to be used again; LFU assumes that items used frequently in the past continue to be useful.

### LRU with LinkedHashMap
{{LinkedHashMap}} links entries using a doubly linked list. The constructor with {{accessOrder=true}} places the most recently accessed entry at the end; the head of the list is the least recently used. Override {{removeEldestEntry}} to remove the head after a put exceeds capacity. get/put/remove are O(1) on average, the code is short and less prone to pointer errors. However, this LRU is not thread-safe; synchronizing the entire cache can serialize the workload. Decisions are also needed on whether null means a miss or a valid value.

~~~java
Map<K,V> map = new LinkedHashMap<K,V>(16, .75f, true) {
  protected boolean removeEldestEntry(Map.Entry<K,V> e) {
    return size() > capacity; // after put, remove the eldest entry
  }
};
~~~

### Manual LRU
A HashMap maps keys to nodes. A doubly linked list maintains the order of recent use; get finds the node in O(1), unlinks it from its old position, and links it to the tail. put updates an existing node or creates a new one, then unlinks the head if capacity is exceeded. Sentinel head/tail nodes eliminate many null checks. The map and the list are two views of the same set of entries, so every operation must update both; forgetting to remove from the map creates an inaccessible entry, forgetting to unlink creates a ghost node.

### LFU and tie-breaking
LFU removes the key with the lowest frequency. A HashMap key→node is used along with frequency buckets, where each bucket is a doubly linked list ordered by recency, giving O(1) amortized get/put. get moves a node from bucket f to f+1; minFreq increases when the current bucket is empty. During eviction, take the LRU node in the minFreq bucket to resolve ties. Frequency needs aging or decay in long-running systems: a key that was hot yesterday could hold its spot forever even if it's no longer accessed today.

| Policy | Suitable for | Weakness |
|---|---|---|
| LRU | temporal locality | large scans can flush the hot set |
| LFU | stable popularity | stale frequency, more state |
| TTL | business-defined expiration | doesn't pick victims when full |

### Choosing a production solution
Local caches like Caffeine are usually better than manual implementations because they include eviction, statistics, concurrency, and admission policies. Redis is suitable for shared caching but adds network hops and operational overhead; TTL doesn't guarantee immediate invalidation. The Spring Cache abstraction provides unified annotations, but semantics depend on the provider. With cache-aside, read misses then load from source; concurrent misses can create a stampede, requiring request coalescing, bounded locks, or refresh-ahead. Do not cache exceptions or data with incorrect authorization keys.

### Pitfalls and measurement
A high hit rate can still hide poor p99 latency if misses hit a slow database. Monitor hit/miss, eviction, load latency, size, and memory cost; avoid key-based cardinality labels. Large objects can cause OOM if capacity is based only on entry count, so use weight-based limits. Cache invalidation via events can lose messages; use TTL or versioning as a safeguard. Access-order LRU turns get into a mutation, so concurrent reads still need synchronization.

### Interview notes
Explain why LRU uses a map plus a list to maintain O(1), then ask if the workload has temporal locality. If caching across multiple nodes, discuss local vs shared, invalidation, stampede, and consistency before talking about algorithms.`,
    exercises: [{
      title: 'Implement O(1) LRU using HashMap and a doubly linked list',
      prompt: 'Implement {{LruCache}} with positive capacity, {{get}} returns null if missing and refreshes recency; {{put}} updates or adds, evicting the least recently used element when full.',
      hints: ['Nodes store keys so that eviction can correctly remove the entry from the map.', 'Create sentinel head/tail nodes; every get or put of an existing key should unlink and link just before the tail.'],
      explain: 'The map allows finding a node in O(1), the list maintains access order. Sentinels ensure that unlink doesn\'t have to handle head/tail nodes separately. When capacity is exceeded, {{head.next}} is the victim; it must be removed from both the list and the map simultaneously. LFU extends this idea with multiple lists by frequency, along with recency tie-breaking rules.',
    }],
    check: [
      { q: 'Is get in an access-order LinkedHashMap a read-only operation?', options: ['Yes, the order does not change', 'No, it changes the recency of the entry', 'Only changes when the map is full', 'It always deletes the entry'], explain: 'Access-order must move the entry just read to the end, so get modifies the structure. This requires synchronization when shared. Other options describe insertion-order or incorrect behavior.' },
      { q: 'In LFU, when multiple keys have the same lowest frequency, what is a common tie-breaker?', options: ['Evict the newest key', 'Evict the LRU key in that frequency bucket', 'Evict the key with the smallest hash', 'Cannot distinguish'], explain: 'Using recency within each frequency bucket creates stable decisions and supports O(1). Hash does not reflect usefulness; lack of a tie-breaker makes semantics ambiguous.' },
    ],
  },
  'lesson-design-003': {
    title: 'Consistent hashing and virtual nodes',
    goals: [
      'Model the hash ring and map keys to the next node clockwise',
      'Measure key movement when adding a node and understand the trade-off between virtual node count, balance, and cost',
    ],
    body: `### The problem with modulo partitioning
With N shards, the {{hash(key) % N}} approach is simple, but adding or removing a shard causes most keys to change destination because the denominator changes. The cache goes cold, data requires large rebalancing, and downstream experiences spikes. Consistent hashing places both nodes and keys on the same hash ring; keys move clockwise to the first node. When adding a node, only the segment between the new node and its predecessor typically changes ownership; the rest remains the same.

### Ring with virtual nodes
A physical node is placed on the ring multiple times using labels like {{nodeA#0}}…{{nodeA#V-1}}. Each vnode has its own hash position. When looking up a key, choose the vnode with the smallest hash ≥ hash(key), wrapping back to the start if necessary. Virtual nodes reduce load imbalance caused by a few random points and allow stronger nodes to have more vnodes. The cost is a larger ring and membership updates taking O(V log(NV)) if using a TreeMap.

~~~text
hash(key) = 73
ring: 10 A#0 ---- 81 B#2 ---- 140 C#0
key 73 → B#2 (first point >= 73)
~~~

The hash function needs good distribution and stability across processes. Java's {{hashCode}} is unsuitable unless the algorithm/encoding is standardized, and identity hash should not be used. Production typically uses 64/128-bit hashes with clear seeds/byte conventions; collisions must be handled. Don't use a TreeMap comparator that might treat two different points as equal, causing vnode loss.

### Adding, removing nodes and movement
When adding a vnode, keys in the segment taken over by the new vnode change owner; when removing a node, its keys move to its successor. The movement rate can be measured by creating a fixed set of keys, pre-distributing them, adding a node, then counting owner changes. The ideal result when adding a new node to N nodes is approximately 1/(N+1), though not exact for every seed/virtual-node count. Tests should use the same key set and hash deterministically.

### Balance and limits
Too few vnodes lead to uneven distribution; more vnodes improve balance but make the membership/ring larger and consume more CPU/memory. Vnodes do not solve hot key problems: a hot key still resides on one shard. Replication, key salting (which can break order), or application-level cache/read replicas are needed. Different node capacities can be represented by different vnode counts, but changing weights causes movement and requires planning.

| Strategy | Membership change | Balance | Issues |
|---|---|---|---|
| modulo N | usually almost all keys | good when N is fixed | adding shards causes massive remap |
| ring, 1 point/node | minimal remap | high variance | a node might receive a massive segment |
| ring, many vnodes | minimal remap | better | ring state and rebalancing |

### Production and operation
Consistent hashing is suitable for distributed caches, partition routing, or shard placement when membership changes. It doesn't automatically replicate data, provide consensus, or handle split brain. Service discovery must broadcast membership with consistent versions; if nodes A and B see different rings, the same key could be written to two places. When deploying, consider shadow-routing, copying data before switching, and monitoring movement and miss rates. If strong data partitioning is needed, database partitioning or rendezvous hashing might be simpler.

### Interview notes
Explain the hash ring, successor lookup, and why movement is localized. Then quantify movement with workloads, mention virtual nodes, hot keys, replication, and membership synchronization. The exercise uses a simple deterministic hash to focus on ownership rather than a production cryptographic hash.`,
    exercises: [{
      title: 'Measure movement when adding a node to a hash ring',
      prompt: 'Implement {{Ring}} with {{addNode(name, virtualNodes)}} and {{owner(key)}}. Use a stable hash {{Math.floorMod(String.hashCode(), 100000)}}; place vnodes according to the string {{name + "#" + i}}. owner selects the first vnode position >= hash(key), wrapping back to the beginning.',
      hints: ['Use TreeMap for ceilingEntry to find the next vnode; null means wrap around.', 'Handle hash point collisions deterministically by probing the next point; reject duplicate names to avoid overwrites.'],
      explain: 'The ring places multiple points for each physical node. {{ceilingEntry}} performs successor lookup; if there\'s no point behind, it wraps back to {{firstEntry}}. Collisions must be resolved instead of allowing the TreeMap to overwrite. The movement rate should be measured using real keys and the same hash algorithm in both configurations.',
    }],
    check: [
      { q: 'Adding a node to a consistent hash ring typically changes the owner of how many keys?', options: ['All keys', 'A contiguous portion of the ring', 'No keys', 'Only keys named after the new node'], explain: 'The new node takes over the ring segment from its predecessor to the new point, so only keys in that area remap (approximately 1/(N+1) when balanced).' },
      { q: 'What problem do virtual nodes primarily solve?', options: ['Single hot key', 'Uneven distribution when each node has only one point', 'Replication consistency', 'Data encryption'], explain: 'Multiple sample points help achieve better load balancing. Hot keys still concentrate; virtual nodes do not replicate or encrypt data.' },
    ],
  },
  'lesson-design-004': {
    title: 'Circuit breaker: CLOSED, OPEN, HALF_OPEN',
    goals: [
      'Implement a state machine with failure thresholds and open duration controlled by a mock clock',
      'Distinguish circuit breaker from retry, timeout, and bulkhead in production',
    ],
    body: `### Why is a circuit breaker needed?
When a dependency is slow or failing, requests hold threads and connections longer; full queues spread failure to otherwise healthy endpoints. Infinite retries also multiply the load on a degrading dependency. A circuit breaker stops calls for a period, allowing the system to recover, and allows a few probes to test recovery capability. It does not replace timeout: each call still needs a finite deadline.

### State machine
CLOSED allows calls and counts failures in a window or consecutive sequence. When the threshold is reached, it transitions to OPEN, rejecting quickly without calling the dependency. After a wait duration, a check can transition to HALF_OPEN. HALF_OPEN only allows a few probes; if enough probes succeed, it closes; if they fail, it reopens. Define clearly which errors count: timeouts/5xx usually count, 4xx validations usually don't; cancellations might need special handling.

~~~text
CLOSED -- failures >= threshold --> OPEN
OPEN -- now >= retryAt --> HALF_OPEN
HALF_OPEN -- enough successes --> CLOSED
HALF_OPEN -- any counted failure --> OPEN
~~~

Monotonic/mock clocks make wait durations accurately measurable. Do not call {{Thread.sleep}} in tests; pass now into operations or use a clock abstraction. In multi-threaded systems, state transitions must be atomic to prevent hundreds of probes from slipping through at once. Resilience4j provides circuit breakers, sliding windows, metrics, decorators, and event hooks; production still needs proper threshold/window selection.

### Window and threshold
A 50% failure rate over a window of 10 calls means something different than 50% over 1,000 calls. Count-based windows are suitable for stable traffic; time-based windows reflect recency but require clocks and cleanup. There's a minimum number of calls to avoid opening due to a single failure at startup. Slow-call rates can open the circuit even if calls haven't failed. Being too sensitive causes flapping; being too loose provides no protection. Monitor status, rejected calls, and time spent in each state.

### HALF_OPEN concurrency
When the cooldown ends, only allow the configured number of probes. Running probes must be counted towards the quota; other concurrent calls are rejected or receive a fallback. If only checking state then incrementing non-atomically, multiple requests may see empty slots. After probe completion, handle results exactly once; duplicate callbacks or swallowed exceptions can leave the state incorrect. Use semaphores/atomic counts or verified libraries.

| Mechanism | Role |
|---|---|
| Timeout/deadline | limits the time a call occupies resources |
| Retry | tries again on recoverable errors, with limits and backoff |
| Circuit breaker | suspends calls when errors exceed a threshold |
| Bulkhead | limits concurrent calls to isolate resources |

### Production policy
Place the breaker around the specific remote dependency, not the entire request if there are independent steps. Fallbacks must be business-appropriate: stale data might be acceptable, but payments cannot be faked as successful. If using retries inside a breaker, define if a logical call or each attempt is counted; too many retries make the breaker open late and amplify load. Set timeouts smaller than the total deadline, add jitter to retries, and observe transitions.

### Interview notes
Describe state transitions along with probe semantics, then distinguish between timeout/retry/bulkhead. Ask about thresholds chosen from SLOs and baselines, rather than asserting a fixed number fits every service.`,
    exercises: [{
      title: 'Implement breaker based on failure threshold and mock clock',
      prompt: 'Implement {{Breaker(threshold, openMillis, nowMillis)}} with {{failure(now)}}, {{success(now)}}, and {{allow(now)}}. After consecutive failure threshold, transition to OPEN; after wait duration, transition to HALF_OPEN and allow exactly one probe; probe success closes, probe failure reopens.',
      hints: ['OPEN only transitions to HALF_OPEN when now-openedAt reaches wait; HALF_OPEN only grants one permit.', 'Failure in HALF_OPEN reopens immediately; success in HALF_OPEN closes and resets the failure count.'],
      explain: 'This exercise uses consecutive failures to keep the state machine small; production libraries typically support sliding windows by call count or time. Probe permits must be atomic in concurrent code. Remote call timeouts must remain separate; a breaker doesn\'t automatically stop a hanging call.',
    }],
    check: [
      { q: 'Which mechanism does a circuit breaker replace?', options: ['Timeout completely', 'It doesn\'t replace timeout; it prevents new calls when a dependency fails', 'Database transaction', 'Load balancing'], explain: 'Breaker rejects new calls based on state; requests already sent still need timeouts. It doesn\'t manage transactions or select nodes like a load balancer.' },
      { q: 'What is the purpose of a probe in HALF_OPEN?', options: ['Create more load regardless of the result', 'Try a limited number of calls to decide whether to close or reopen', 'Clear errors from logs', 'Ignore timeouts'], explain: 'Small probes verify if a dependency has recovered before allowing normal traffic. It doesn\'t clear logs, ignore timeouts, or automatically create infinite load.' },
    ],
  },
  'lesson-design-005': {
    title: 'Idempotency key and retry exponential backoff',
    goals: [
      'Simulate safe payment retries using idempotency keys and storing results before returning',
      'Design retries with limits, exponential backoff, jitter, and distinguish retryable errors',
    ],
    body: `### Retry creates at-least-once
A client sends a payment but a timeout doesn't prove the server hasn't processed it. If a new request is resent, the customer might be charged twice. Networks don't provide certainty to the client when a response is lost; therefore, real-world designs are usually at-least-once delivery plus idempotent operations, not an end-to-end exactly-once promise.

### Idempotency key
A client creates a stable key for a payment intent and sends the same key in every retry. The server stores the key, request fingerprint, and result. The first time, it claims the key atomically, performs the business logic, and stores the result; subsequent calls with the same payload return the old result. If the same key is used with a different payload, return a conflict instead of silently returning the wrong thing. Keys should be scoped by merchant/account and operation; TTL must be longer than the retry window but suitable for retention/compliance.

~~~text
key not present → claim → process once → store response
key present + same payload → return stored response
key present + different payload → conflict
~~~

This is a difficult transaction boundary: if the key is written then the process crashes before charging, the key is stuck; if charging succeeds then crashes before storing the response, a retry might charge again. Use transactions within a ledger if in the same database, or workflows/outbox and downstream idempotency if calling a payment provider. The PROCESSING state needs a lease/timeout and a reconciliation method; do not just use ConcurrentHashMap in multi-instance applications.

### Retry policy
Exponential backoff increases the wait interval per attempt: base × 2^attempt, capped to avoid excessive values. Random jitter reduces retry synchronization of multiple clients after an outage. Retry only transient errors (timeouts, 429 via Retry-After, some 5xx), limit total attempts/deadlines, and do not retry validation errors or most 4xx. The timeout for each attempt must be within the caller's deadline. Retrying at multiple layers multiplies calls: 3 attempts at the gateway × 3 at the service = 9 requests.

### Mocking time
The exercise uses a list of retry time points instead of sleep: the delay for attempt i is min(cap, base×2^i), and total time is checked via arithmetic. In production, schedulers use a monotonic clock; tests only verify policy, not actual waiting. Do not keep threads sleeping for backoff in reactive/event-loop systems; schedule asynchronously. Resilience4j Retry configures max attempts, interval functions, and exception predicates; the policy doesn't automatically provide idempotency storage.

| Mechanism | Guarantees |
|---|---|
| Retry | increases success chances for transient errors |
| Idempotency | resending the same intent doesn't multiply effects |
| Timeout | limits waiting time for each attempt |
| Outbox | publishes events after commit in a recoverable way |

### Production checklist
Store unique constraints for (scope, key), fingerprint canonical payloads, results/status, timestamps, and retention. Claims must be atomic; two concurrent requests with the same key must only result in one execution. Do not store sensitive card data in the idempotency table; store references/tokens according to PCI controls. Metrics include duplicate hits, conflicts, long processing, and retry attempts; log keys should be hashed/redacted. The API returns consistent semantics when the initial request is still PROCESSING (202/409 or bounded wait).

### Pitfalls
A new random key for every retry defeats idempotency. Only storing the key after processing creates a duplicate race. Hashing a non-canonical payload might change due to JSON field order; fingerprints need a canonical representation and should include currency/merchant. Too short a retention period allows duplicate charges from late retries; infinite retention makes the table grow forever. Retrying a non-idempotent POST without a key is a serious financial error.

### Interview notes
Start with a scenario where the response is lost after the provider has already charged. Explain why retries need the same key, where keys are stored, and the transaction boundary; then add retry budgets, backoff+jitter, timeouts, duplicate concurrent requests, and reconciliation.`,
    exercises: [{
      title: 'Simulate idempotent payment and deterministic backoff',
      prompt: 'Implement {{PaymentService.pay(key, amount)}}: same key and same amount record only one charge; same key but different amount throws IllegalArgumentException. {{Backoff.delay(attempt, base, cap)}} returns base×2^attempt capped at cap, with attempt starting from 0.',
      hints: ['Two maps hold the payload fingerprint/amount and the result; check if the key already exists before increasing the charge count.', 'Calculate doubling using a loop and check the cap before multiplication to avoid long overflow.'],
      explain: `This exercise simulates storing results by key so that retries return the same receipt and do not increase the charge count. The same key with a different payload must conflict. Two maps here simplify state; real systems need unique constraints/transactions so two instances don't process simultaneously. Backoff has a cap and avoids overflow; jitter is added in production, but tests focus on deterministic policy.`,
    }],
    check: [
      { q: 'A client timeouts after the server has already charged. What is needed for a safe retry?', options: ['Create a new key for the retry', 'Resend the same idempotency key and payload', 'Skip storing the result', 'Retry infinitely'], explain: 'The same key and payload allow the server to recognize the same intent and return the recorded result. A new key creates a new operation; not storing the result leads to duplicates; infinite retries cause load and don\'t guarantee safety.' },
      { q: 'Why add jitter to exponential backoff?', options: ['To make all clients retry at the same time', 'To reduce retry synchronization after an outage', 'To skip timeouts', 'To replace the idempotency key'], explain: 'Jitter spreads out retry times, reducing thundering herds. It doesn\'t replace timeouts or idempotency; synchronized retries are what should be avoided.' },
    ],
  },
});
