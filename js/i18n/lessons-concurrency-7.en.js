/*
 * English translation of js/data/lessons-concurrency.js — task T754. Format: js/core/i18n.js (content overlay).
 * ids: lesson-concurrency-008 lesson-concurrency-009
 */
App.i18n.content({
  'lesson-concurrency-008': {
    title: 'Producer–consumer with BlockingQueue: bounded queues, backpressure, poison pills, and Kafka consumer lag',
    goals: [
      'Explain the producer–consumer model and why a blocking queue decouples production speed from processing speed',
      'Distinguish put/take (blocking) from offer/poll (non-blocking or bounded wait) and choose correctly when the queue is full',
      'Shut down a multi-thread pipeline **cleanly** with poison pills, without losing or duplicating items',
      'Connect in-JVM backpressure to Kafka consumer lag to answer system design interview questions',
    ],
    body: `### The idea: put a bin between the maker and the packer
**Summary:** Producer–consumer separates "the side that creates work" from "the side that processes work" with a shared queue. When the two sides run at different speeds, the queue absorbs the difference; when the queue is **bounded**, it also pushes pressure back to the producer — that is backpressure.

Picture a conveyor belt in a bakery. One person shapes buns (the producer), another person wraps them (the consumer). If wrapping is slower than shaping, you cannot force the shaper to wait for each bun — you place a **tray** that holds a finite number of buns between the two people. The shaper keeps shaping and placing buns on the tray; the wrapper keeps taking buns from the tray. The tray is the queue. If the tray were infinite, the shaper would keep going and the tray would overflow (run out of space, run out of memory). If the tray has a limit, when it is full the shaper **must stop** until space opens up — that is backpressure: a slow consumer automatically slows the producer, instead of crashing the system.

In Java, that thread-safe "tray" is a {{BlockingQueue}}. It is safe for multiple producers and multiple consumers at the same time, and its operations know how to **wait**:
- {{put(e)}}: add an element; if the queue is full, **block** (park the thread) until space becomes available.
- {{take()}}: remove an element; if the queue is empty, **block** until an item appears.
- {{offer(e)}} / {{poll()}}: non-blocking, return {{false}}/null immediately if the operation cannot succeed.
- {{offer(e, timeout, unit)}} / {{poll(timeout, unit)}}: block for at most the given time, then give up.

### Why bounded is what makes it safe
A {{LinkedBlockingQueue}} created without a capacity has capacity {{Integer.MAX_VALUE}}, which is effectively unbounded. If the consumer is even slightly slower than the producer and you use an unbounded queue, memory grows until you get an OOM — lesson 3 (ThreadPoolExecutor) hit exactly this trap with {{newFixedThreadPool}}. A **bounded** queue like {{new ArrayBlockingQueue<>(200)}} turns a "slow" problem into "controlled slowness": the producer is blocked by {{put}}, runs no faster than the consumer, and you can see the pressure immediately.

| Behavior when the queue is full | API | Use when |
|---|---|---|
| Block forever until space opens | {{put}} | an internal producer is allowed to slow down (batch, ingest) |
| Block up to a time limit, then give up | {{offer(e, t, unit)}} | the producer is a web request that must respond quickly (429/503) |
| Reject immediately | {{offer(e)}} returns {{false}} | there is a fallback path (write to DB, DLQ, drop a metric) |
| Block when empty waiting for work | {{take}} | the consumer should stay busy, not spin |
| Block up to a limit, then return null | {{poll(t, unit)}} | the consumer needs to do other work when there is nothing to do |

> Practical rule: **always set a capacity**. The capacity is how much work you agree to "hold" in RAM. Too small and producers block constantly (throughput drops); too large and you lose the backpressure effect while burning heap.

### Shutting down the pipeline cleanly: the poison pill
The biggest challenge is not running, but **stopping**: how does a consumer know "there is no more work, exit" instead of waiting forever on {{take()}} (so the thread never finishes)? The most common approach is a **poison pill**: put a special element into the queue that the consumer treats as "this is the quit command". Each consumer that {{take()}}s a pill {{break}}s, but a pill is consumed by only one consumer, so you must enqueue **exactly one pill per consumer**:

~~~seq
title: Pipeline shutdown with a poison pill
actors: Main | Queue | C1 | C2
Main -> Queue: put(all work done)
Main -> Queue: put(POISON) for C1
Main -> Queue: put(POISON) for C2
Queue --> C1: take() = POISON
C1 -> C1: break, thread exits
Queue --> C2: take() = POISON
C2 -> C2: break, thread exits
~~~

Why does {{ArrayBlockingQueue}} forbid {{null}}? Because {{null}} is used as the return value of {{poll()}} meaning "nothing available", so it must be a separate sentinel, for example a constant outside the real data range. If you need to enqueue {{null}} or an "end of stream" signal, wrap the data in an object with an {{isDone}} flag.

There are three alternatives worth knowing in interviews:
1. **Poison pill**: simple, follows the data flow naturally, but the pill count must match the consumer count.
2. **{{Thread.interrupt()}}**: a blocked {{take}}/{{put}} throws {{InterruptedException}} → you exit in {{catch}}. Good for urgent shutdown.
3. **{{volatile running}} flag + {{poll(timeout)}}**: the consumer loops while the {{running}} flag is true, calls {{q.poll(100, MILLISECONDS)}} each time, and exits when it times out returning {{null}}. Flexible but has latency up to the timeout.

### Connecting to Kafka: consumer lag and backpressure outside the JVM
BlockingQueue is producer–consumer **inside one process**. Kafka is the distributed, durable version (messages are written to disk and can be read again): a producer writes to a **topic** (split into **partitions**), and consumers in a **consumer group** read together. Two concepts to remember:
- **Offset**: a pointer to "how far this consumer has read" in a partition. Committing offsets slowly ⇒ after a restart it reads from there again ⇒ *at-least-once* (duplicates are possible, so you must be idempotent).
- **Consumer lag** = (latest offset of the partition) − (committed offset). Rising lag means the consumer is **processing slower than the producer is writing** — exactly the full-queue situation.

Similarity: both models measure "fullness" to detect a speed imbalance. The key difference for interview answers: a bounded queue in the JVM makes {{put}} **block the producer** (immediate backpressure), while Kafka **does not block** the producer — the broker still accepts and writes to disk, and lag grows. Kafka backpressure lives on the consumer side: you slow down processing, reduce batch size, lower {{max.poll.records}}, and if lag gets too high you add consumer instances (at most as many as partitions) or speed up processing. A Kafka producer only "feels" pressure through the client {{buffer.memory}} filling up when the broker is slow.

~~~seq
title: Consumer lag grows when processing is slow
actors: Producer | Kafka topic | Consumer
Producer -> Kafka topic: write continuously (offset rises)
Kafka topic --> Consumer: poll batch (max.poll.records)
Consumer -> Consumer: process slowly, commit offset slowly
note Consumer..Kafka topic: lag = latest - committed, keeps rising
~~~

> Senior pitfall: {{max.poll.interval.ms}}. If one processing loop takes longer than this threshold (default 5 minutes), the broker considers the consumer dead, kicks it out of the group, and triggers a **rebalance** ⇒ the partition moves to another consumer ⇒ the same message is processed again in two places. That is why you must process in small batches and not "eat" a huge batch before committing.

### Production bugs you will actually meet
- Unbounded queue → OOM when the consumer is slow (the {{newFixedThreadPool}} trap).
- Sending **fewer** poison pills than consumers → some consumers stay stuck on {{take}} forever and the pipeline never shuts down.
- {{take}} in a loop without {{try/catch InterruptedException}} → during shutdown the interrupt is swallowed and the thread never exits.
- Processing a message **before** committing the offset and then crashing → data loss (an unconscious at-most-once choice). Committing before processing → loss if an error happens midway.
- A consumer dies with no detection → the queue fills up silently, latency rises, and nobody knows.

### Interview relevance
When asked to "design an ingest flow for system X", the senior answer is: (1) separate producer/consumer with a **bounded** queue, (2) state the full-queue policy clearly (block/offer timeout/reject/DLQ), (3) shut down cleanly with poison pills or interrupts, (4) connect to Kafka: partitions, offsets, at-least-once + idempotent processing, and use **consumer lag** as the scale-out metric instead of blocking the producer.`,
    exercises: [
      {
        title: 'Pipeline with 2 producers and 3 consumers: clean shutdown with poison pills, no loss, no duplicates',
        prompt: `Write {{Pipeline.run(n, producers, consumers, capacity)}}:

- Create an {{ArrayBlockingQueue}} with capacity {{capacity}} as the work queue (elements are integers).
- Run {{producers}} producer threads: together they must enqueue **exactly the numbers 1..n, each number exactly once**, using {{put}} (a producer may slow down when the queue is full). A partitioning that is guaranteed correct: producer {{p}} (0-based) enqueues the numbers {{p+1, p+1+producers, p+1+2*producers, ...}} as long as they do not exceed {{n}}.
- Run {{consumers}} consumer threads: each consumer repeatedly {{take}}s and collects elements into a **thread-safe** list, until it sees a **poison pill** and stops. The integer {{-1}} is the poison pill (real data is always positive).
- After ALL producers have finished {{put}}ting, enqueue **exactly {{consumers}} poison pills** so that each consumer exits cleanly.
- Wait for all consumers to finish, and return the collected list **sorted ascending** (so the result does not depend on thread scheduling). If the pipeline gets stuck (missing pills), the future must time out after 5 seconds and the test must fail.

Signature: {{static List<Integer> run(int n, int producers, int consumers, int capacity) throws Exception}}. {{capacity >= 1}}. When {{n == 0}} no numbers are enqueued, but the pipeline must still shut down cleanly and return an empty list.`,
        hints: [
          'Use {{ArrayBlockingQueue<>(capacity)}} for the queue and {{CopyOnWriteArrayList}} or {{ConcurrentLinkedQueue}} for the result list.',
          'Producer partitioning: producer p enqueues {{v = p+1; v <= n; v += producers}} — this guarantees 1..n is covered exactly once.',
          'Shutdown order: start producers + consumers FIRST, wait for producers to finish, then {{q.put(POISON)}} exactly {{consumers}} times, then wait for consumers.',
          'Use {{future.get(5, TimeUnit.SECONDS)}} so that missing pills produce a clear timeout failure instead of hanging forever.',
          'Sort the list before returning, because the order in which consumers take items depends on thread scheduling.',
        ],
        explain: `Three points make the solution correct and **deterministic** (the result does not change no matter how threads interleave):
1. **Cover 1..n exactly once**: each number belongs to exactly one producer by the formula {{p+1+k*producers}}, so no matter how many producers there are, no number is enqueued twice or skipped.
2. **Exactly as many poison pills as consumers**: {{-1}} is {{put}} after all producers have finished, so the pills sit **behind** all real data in the FIFO queue. Each consumer {{break}}s as soon as it sees one pill, so each pill "consumes" exactly one consumer — just enough, none missing (stuck on {{take}}), none extra (leftover pills remain in the queue but do not affect the result).
3. **Waiting in order**: {{get}} all producers → enqueue pills → {{get}} all consumers. If you reverse this (enqueue pills before producers finish), pills interleave with data, one consumer exits early, and the data after it is lost.

Why the tests still pass reliably: the function returns a **sorted** list, so comparing to ascending {{1..n}} is an invariant independent of thread scheduling. Capacity 1 forces {{put}} to block almost constantly → it verifies backpressure without changing the result. {{n = 0}}: no numbers are produced, main still enqueues {{consumers}} pills, all consumers exit → empty list.

Common mistakes:
- Wrong pill count ({{consumers - 1}} or {{1}}) → some consumer hangs on {{take}}, {{get(5s)}} times out → FAIL.
- Using {{null}} as the pill → {{ArrayBlockingQueue}} throws {{NullPointerException}} because it forbids {{null}}.
- Collecting results into a plain {{ArrayList}} → data race, lost/duplicated elements that are hard to reproduce. You must use a thread-safe structure.
- Forgetting {{setDaemon(true)}}: if a consumer stays alive due to a bug, the JVM cannot exit; daemon threads allow the process to reach {{RESULT}} and finish.

Extension to try yourself: replace {{-1}} with a {{Task}} object that has a {{done}} flag, or use {{poll(50, MILLISECONDS)}} + a {{volatile running}} flag to compare against poison pills.`,
      },
    ],
    check: [
      {
        q: 'The queue is full and your producer is a web request that must respond to the client within 200 ms. Which operation fits best?',
        options: ['{{put(e)}} so you never lose a message', '{{take()}} to balance speeds automatically', '{{offer(e, 50, MILLISECONDS)}} and return 503/429 on failure', '{{new LinkedBlockingQueue()}} with no capacity'],
        explain: '{{offer}} with a timeout lets you **actively drop** instead of blocking forever and hanging the request — exactly what a web service needs (with Retry-After, or pushing to a DLQ). {{put}} blocking is good backpressure for batch work but harmful for synchronous requests. {{take}} is the consumer side. A queue with no capacity is effectively unbounded → it consumes heap until OOM.',
      },
      {
        q: 'You run a pipeline with 3 consumers and enqueue only 1 poison pill after the producers finish. What happens?',
        options: ['All 3 consumers shut down cleanly', 'Two consumers stay stuck on take() forever and the pipeline never shuts down', 'Consumers 2 and 3 magically get another pill', 'The queue generates pills automatically when empty'],
        explain: 'Each pill is {{take}}n by **only one** consumer, which then {{break}}s. Enqueueing 1 pill for 3 consumers ⇒ only 1 exits, the other 2 wait on {{take}} forever, and {{awaitTermination}}/{{get(timeout)}} will fail. You must enqueue **exactly as many** pills as consumers.',
      },
      {
        q: 'In Kafka, "consumer lag" keeps rising steadily. What does that mean and what is the right response?',
        options: ['The producer is sending too slowly; speed up the producer', 'The consumer is processing slower than the producer is writing; scale out consumers in the group or speed up processing', 'The broker is dying; restart the broker', 'Lag has no operational meaning'],
        explain: 'Lag = latest offset − committed offset; it is the distributed-system equivalent of a "full queue". Kafka **does not** block the producer (the broker still writes to disk), so backpressure shows up as lag. The response: add consumer instances (at most as many as partitions; beyond that they are idle), reduce batch size/process faster. High lag also warns about {{max.poll.interval.ms}} → rebalance → duplicate processing.',
      },
    ],
  },
  'lesson-concurrency-009': {
    title: 'ConcurrentHashMap and thread-safe caches: atomic computeIfAbsent and single-flight against thundering herds',
    goals: [
      'Explain why {{Hashtable}} and {{Collections.synchronizedMap}} still fail for the "check then write" (check-then-act) pattern',
      'Use {{computeIfAbsent}} to load cache entries atomically: the loader runs only once per key even when many threads miss at the same time',
      'Build a small loading cache with single-flight and correct {{invalidate}} behavior',
      'State the limits: the loader must not call back into the same map, keys/values cannot be null, and when Redis is needed instead of an in-JVM cache',
    ],
    body: `**Summary:** {{ConcurrentHashMap}} allows parallel reads and writes that do not block the whole table, but what you really need in a cache is **{{computeIfAbsent}}**: it guarantees that for a missing key, the loader function runs **only once**, while other threads wait and share the result. That is the foundation of the "single-flight" pattern that protects against every request hitting the DB at once when a hot key expires.

### The problem with plain HashMap and the old "band-aids"
{{HashMap}} is not thread-safe: two threads calling {{put}} at the same time can corrupt its internal structure (buckets/array), lose data, or even create an infinite loop (pre-Java 8). People used to patch it with:
- {{Hashtable}}: every method is {{synchronized}} on the **whole table** ⇒ all threads block each other, even readers ⇒ extremely low throughput.
- {{Collections.synchronizedMap}}: wraps a {{HashMap}} with a shared mutex lock, also blocking everything. And it still **cannot** perform a compound operation.

The key point: both still expose races at the **operation-group** level. Look at this very "reasonable" code:

~~~java
// DIES IMMEDIATELY when two threads load the same key
V v = map.get(k);
if (v == null) { v = loadFromDb(k); map.put(k, v); }   // check-then-act is NOT atomic
return v;
~~~

Two threads both {{get}} {{null}}, both call {{loadFromDb}} (2 expensive DB queries, sometimes 500 queries), and both {{put}}. This is a **thundering herd**: one key expires and a crowd of requests all reload it at once. The whole-table lock in {{Hashtable}} does not help because it only makes each {{get}}/{{put}} atomic individually; it cannot merge all three lines.

### ConcurrentHashMap: lock by bucket, not the whole table
{{ConcurrentHashMap}} (Java 8+) keeps {{Node}}s in a bucket array; each bucket has a {{synchronized}} on its head node — so only threads touching the **same bucket** wait for each other, while the rest run in parallel. Reads via {{get}} take no lock at all (they read a {{volatile}} array reference). {{size}}/{{mappingCount}} are approximate values (striped counting, like {{LongAdder}}). Keys and values **cannot be null** — because there is no way to distinguish "key not present" from "value is null" when reading without locks.

Why lesson 2 on deadlock/lock ordering did not mention this: there we locked **accounts** in id order; a cache needs a **compound** operation (read-missing-then-load-then-write) to be atomic per key. The tool is {{computeIfAbsent}}.

### computeIfAbsent = free single-flight
~~~java
// the loader runs ONLY ONCE for a key that is absent; other threads wait and share the result
V value = map.computeIfAbsent(key, k -> loadFromDb(k));
~~~
Internally, when a key is missing, the winning thread locks the bucket and runs the loader; other threads touching the same bucket are **blocked** until the function finishes, then see the key is present and do not run it again. Result: each key is loaded exactly **once**, regardless of interleaving — so tests of this kind are **deterministic** (not flaky).

> CLASSIC WARNING: {{computeIfAbsent}} **forbids** the loader from calling back into the same map ({{map.remove}}, {{map.put}} on the same bucket). Java throws {{IllegalStateException}} or causes a **deadlock** (because the loader holds the bucket lock while trying to modify that same bucket). If your loader needs to write a secondary cache, use a separate map. The loader must also be **fast**: it holds the bucket lock, so a slow loader (HTTP/DB) makes every key in the same bucket wait — which is why "block-on-load" caches are only safe when the loader is cheap; when the loader is expensive you need single-flight with {{Future}}/{{CompletableFuture}} (see lessons 4/6) or accept that one leader request loads while others return the **stale** value until the new one arrives (stale-while-revalidate).

### Building blocks for a cache and the multi-instance problem
A minimal loading cache = {{ConcurrentHashMap}} + {{computeIfAbsent}} + {{invalidate(key) = remove(key)}}. But a JVM cache only works **inside one process**: 5 pods behind a load balancer will have 5 caches, 5 loads, and 5 expiry times — with no way to "invalidate in sync". That is when people consider **Redis** (a centralized cache with TTL via {{EXPIRE}}, where {{DEL}} affects every instance). The trade-off: one extra network hop (~0.2–1 ms in the same region), one more failure point, and a cache-DB consistency problem. A common strategy: **cache-aside** (the app reads the cache, on a miss reads the DB and writes the cache), choose a TTL to bound staleness, and on a DB write {{DEL}} the cache (or use "write-through"). Do not cache everything: only data that is **read often, changes slowly, and is expensive to compute**.

### Production bugs you will actually meet
- Loading by hand inside {{get}} (check-then-act) instead of {{computeIfAbsent}} → a thundering herd takes down the DB.
- Putting {{null}} into a {{ConcurrentHashMap}} → {{NullPointerException}}; to represent "negative cache" you must wrap {{Optional}} or use a sentinel.
- The loader calls back into the same map inside {{computeIfAbsent}} → the bucket deadlocks.
- Treating {{size}} as an exact number → it is approximate; do not use it to enforce a hard memory limit.
- No cache size limit (an unbounded map) → it holds every key forever ⇒ memory leak. Real caches need **eviction** (LRU/TinyLFU) and **TTL**; {{Caffeine}} is the standard Java library for this (production use; in a hands-on interview you can write a minimal version yourself).
- Assuming a JVM cache is shared across instances → it is not; each process has its own copy.

### Interview relevance
The question "a hot cache key just expired and 500 requests all miss and fire the same expensive query — how do you handle it?" has a senior answer: (1) {{single-flight}} — in one JVM use {{ConcurrentHashMap.computeIfAbsent}} (or a map of {{CompletableFuture}}s) so that **only one** leader request loads while the rest wait and share; (2) across many instances you need a shared-layer lock/limit (a Redis lock, or "stale-while-revalidate" so only one machine reloads); (3) state the trade-offs clearly: the loader holds the bucket lock so it must be fast, and a local cache cannot replace a centralized cache when you need synchronous invalidation.`,
    exercises: [
      {
        title: 'Thread-safe LoadingCache: computeIfAbsent for single-flight, with invalidate',
        prompt: `Write a {{LoadingCache<K, V>}} class that wraps a {{ConcurrentHashMap}} to cache values computed by a {{loader}}:

- Constructor: {{LoadingCache(Function<K, V> loader)}} — store the loader and create an empty {{ConcurrentHashMap}}.
- {{V get(K key)}}: return the value for the key. If the key is **absent**, call the loader **exactly once** (even when many threads {{get}} the same key concurrently — single-flight) and store the result. If it is already cached, do **not** call the loader. This is where {{computeIfAbsent}} shines.
- {{void invalidate(K key)}}: remove the key from the cache; the next {{get}} will load it again.
- {{int size()}}: the number of cached keys.

The loader returns non-null values and does not call back into the cache. Signature: {{V get(K key)}}, {{void invalidate(K key)}}, {{int size()}}, constructor takes {{java.util.function.Function<K, V>}}.

The tests count loader invocations with an {{AtomicInteger}} placed inside the loader you pass in; the expected result is **loader calls = the number of distinct keys actually loaded**, independent of thread scheduling.`,
        hints: [
          '{{get}} only needs one line: {{return map.computeIfAbsent(key, loader);}} — that is single-flight.',
          'Do not write {{if (map.get(key) == null) map.put(key, loader.apply(key));}}: that is check-then-act and two threads can both load.',
          '{{invalidate}} is {{map.remove(key)}}; after removal, {{get}} will see the key is absent and load it again.',
          '{{size}} is {{map.size()}}; the tests only compare when the system is quiescent, so CHM approximate sizing does not matter.',
        ],
        explain: `All correctness comes from **{{computeIfAbsent}}**: for a missing key, it runs the loader and installs the result into the map as a **bucket-atomic** operation. Other threads that call {{computeIfAbsent}} for the same key while the loader is running are blocked at the bucket, and when they proceed the key is already present so the loader does **not** run again. Therefore:
- Thundering-herd test: 16 threads all {{get("HOT")}} ⇒ {{loads}} = 1, every thread receives the same "V-HOT". This invariant holds for every interleaving ⇒ the test is **deterministic**, no sleep needed.
- Multi-key test: each distinct key goes through the loader exactly once, even when spread across 10 threads.
- {{invalidate}} test: {{remove}} makes the key absent again ⇒ the next {{get}} triggers a second loader call.

Common mistakes and why the tests catch them:
- The "check-then-act" version ({{get}} then {{put}}): still correct on a single thread, but in the thundering-herd test many threads see null and all load ⇒ {{loads}} > 1 ⇒ FAIL. This is exactly the real bug people hit when a hot key expires.
- Using {{Hashtable}} or {{synchronizedMap}}: each individual operation is atomic, but the **group** "read-missing-then-load-then-write" is still not ⇒ still two loads. To group them you would have to lock the whole block ({{synchronized}}) → you lose parallelism; {{computeIfAbsent}} gives you both.
- Having the loader call back into the same map ⇒ {{IllegalStateException}}/bucket hang. In this exercise the loader is clean, so it is safe.
- Returning {{null}} from the loader ⇒ {{ConcurrentHashMap}} throws NPE and the key is not cached (every {{get}} loads again). In production you must reject null or use a sentinel.

Upgrade to try yourself: change {{Function<K,V>}} to a loader that returns {{CompletableFuture<V>}} (a map of futures) to get single-flight **without** holding the bucket lock for the whole DB call — that is how Caffeine/Spring Cache do "refresh ahead".`,
      },
    ],
    check: [
      {
        q: 'Why does {{Collections.synchronizedMap(new HashMap<>())}} still fail to prevent a thundering herd on a cache miss?',
        options: ['Because it is slow', 'Because it locks each operation individually, while the "get-then-load-then-put" pattern is a non-atomic check-then-act', 'Because it does not allow writes', 'Because it is not thread-safe'],
        explain: 'The mutex only protects **each** method. Two threads can still both pass {{get}} and see null, both load, and both put — because there is no shared lock between {{get}} and {{put}}. {{computeIfAbsent}} merges check-and-load into a single per-key atomic operation so the loader runs only once.',
      },
      {
        q: 'What happens if, inside the loader of {{ConcurrentHashMap.computeIfAbsent}}, you call {{map.remove(other)}} on the **same** map?',
        options: ['Perfectly fine', 'It may throw IllegalStateException or deadlock, because the loader modifies the same map while holding the bucket lock', 'It rolls back automatically', 'It only runs on a single-thread pool'],
        explain: '{{computeIfAbsent}} holds the bucket lock while running the loader. Calling back into the same map (especially touching the same bucket) is a **recursive update** — Java 8+ detects it and throws, or in some cases hangs. The loader must be **clean**: compute the value only, do not modify the map that contains it.',
      },
      {
        q: 'You have 5 pods behind a load balancer, each with its own JVM loading cache. When a record is updated in the DB, what is the **right** way to make every pod see the new data?',
        options: ['{{invalidate}} on one pod is enough', 'Call {{invalidate}} on each pod manually and forever', 'Use a centralized cache (Redis) with TTL + shared deletion, or a signaling mechanism (pub/sub) to all pods', 'Increase the {{ConcurrentHashMap}} capacity'],
        explain: 'A JVM cache is **per process**: deleting on pod A does not affect pod B. You need a shared layer (Redis, with {{DEL}}/TTL) or broadcast invalidation signals (Redis pub/sub, Kafka events) to every instance. Capacity or {{size}} is unrelated to cross-pod consistency.',
      },
    ],
  },
});
