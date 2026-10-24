/*
 * English translation of js/data/q-concurrency-jvm.js — task T167. Format: js/core/i18n.js (content overlay).
 * ids: concurrency-001 concurrency-002 concurrency-003 concurrency-004 concurrency-005 concurrency-006 concurrency-007 concurrency-008 concurrency-009 concurrency-010 concurrency-011 concurrency-012 concurrency-013
 */
App.i18n.content({
  'concurrency-001': {
    q: 'Java Memory Model: what does "happens-before" mean? What does {{volatile}} guarantee and what does it NOT guarantee?',
    a: `**Summary:** happens-before is an ordering relation guaranteed by the JMM: if A happens-before B, then all writes of A are visible to B and are ordered consistently with B. {{volatile}} creates a happens-before between the write and the read of the same variable — ensuring **visibility and ordering** — but it does NOT guarantee **atomicity** of multi-step operations like {{i++}}.

### Why JMM is needed
Each core has its own cache; the compiler/JIT reorders instructions for optimization. A thread may read a stale value, or even see a field with its default value even though thread A has finished construction (unsafe publication).

### Common happens-before rules
- **Program order**: actions within the same thread.
- **Monitor**: unlock happens-before the next lock on the same monitor.
- {{volatile}}: write happens-before read of the same variable.
- {{Thread.start()}} and {{Thread.join()}}; transitive rules.

### Volatile: what it gives and what it does not

~~~java
volatile boolean stop;
// CORRECT: flag visibility, safe publication
while (!stop) { work(); }
// WRONG: i++ is a read-modify-write of 3 steps, can still lose updates
volatile int counter;
counter++;               // => must use AtomicInteger
~~~

- **Gives**: reads see the latest value; writes before volatile are "published" to threads that read after.
- **Does not give**: atomic compound actions; elimination of check-then-act races.

> Senior tip: interviewers often ask "volatile is used but still wrong — why?" — the standard answer: volatile only ensures visibility, not integrity of multi-step operations; you need a lock or an immutable object.`,
    follow: [
      'Why does double-checked locking require {{volatile}}?',
      'Give an example where {{volatile}} is used but a race still exists.'
    ]
  },
  'concurrency-002': {
    q: 'Compare {{synchronized}}, {{ReentrantLock}}, {{ReadWriteLock}} and {{StampedLock}}: when do you choose each?',
    a: `**Summary:** {{synchronized}} is the default choice — the JVM optimizes it strongly (thin lock, lock coarsening/elision). Switch to {{ReentrantLock}} when you need tryLock, interruptible wait, fairness, or multiple Conditions. {{ReadWriteLock}} and {{StampedLock}} are only worth it when reads dominate writes clearly and there is real contention.

### Comparison table

| Feature | synchronized | ReentrantLock | ReadWriteLock | StampedLock |
|---|---|---|---|---|
| Mechanism | JVM monitor | CAS + AQS | 1 AQS, read/write state split | CAS + spin/park |
| tryLock/timeout | No | Yes | Yes | Yes |
| Interruptible while waiting | No | Yes | Yes | Yes |
| Reentrant | Yes | Yes | Yes | No |

### Points to cover
1. **synchronized**: JVM upgrades through thin lock and inflates under contention; JIT performs lock coarsening and elimination (escape analysis). Use it first in 90% of cases.
2. **{{ReentrantLock}}**: each Condition is a separate wait queue (e.g. notFull/notEmpty); lockInterruptibly allows exit on cancel/shutdown.
3. **{{ReentrantReadWriteLock}}**: read lock shared, write exclusive; only valuable when read/write ratio is very skewed (>10:1) and the critical section is long enough. Fair mode prevents starvation but reduces throughput.
4. **{{StampedLock}}**: offers Optimistic read — read without locking, then validate the stamp and fall back to readLock if a write occurs. Fastest for read-heavy; cost: non-reentrant, complex code, easy to forget unlocking with the correct stamp.

~~~java
// Optimistic read with StampedLock
long stamp = sl.tryOptimisticRead();   // no lock
double x = cx, y = cy;
if (!sl.validate(stamp)) {             // write occurred?
    stamp = sl.readLock();             // fallback to pessimistic
    try { x = cx; y = cy; } finally { sl.unlockRead(stamp); }
}
~~~

> Senior tip: do not choose a lock based on a whiteboard — benchmark with JMH on a real profile. I once saw a module migrating from JDK 8 to 17 replace ReentrantLock with synchronized: throughput did not drop, and the code became much shorter.`,
    follow: [
      'StampedLock is non-reentrant — what problem does it cause when refactoring old code?',
      'How does ReentrantLock Condition differ from Object.wait/notify?'
    ]
  },
  'concurrency-003': {
    q: 'Deep dive into {{ThreadPoolExecutor}}: submission order for creating threads, rejection policies, and how to size the pool for CPU-bound vs IO-bound?',
    a: `**Summary:** submission order is: create a new thread if below corePoolSize; if at core, enqueue; if queue full, create threads up to maximumPoolSize; if still above max and queue full, reject according to policy. Sizing: CPU-bound ≈ number of cores; IO-bound ≈ core × (1 + W/C) where W/C is the wait/compute ratio — the formula is only a starting point; measure for real.

### Full constructor

~~~java
new ThreadPoolExecutor(
    4,                                  // corePoolSize
    8,                                  // maximumPoolSize
    60, TimeUnit.SECONDS,               // keepAlive for non-core threads
    new ArrayBlockingQueue<>(100),      // queue BOUNDED (very important)
    namedThreadFactory,                 // name threads
    new ThreadPoolExecutor.CallerRunsPolicy()); // rejection
~~~

- Trap: the queue is checked **before** creating threads above core. With an unbounded queue, maxPoolSize is almost meaningless.
- {{allowCoreThreadTimeOut(true)}} lets core threads die when idle — good for pools with elastic traffic.

### Rejection policies
- **AbortPolicy** (default): throws {{RejectedExecutionException}} — fail fast, caller retries.
- **CallerRunsPolicy**: runs on the submitter thread — natural backpressure; but if submitted from a Netty event loop it slows the whole system.
- **DiscardPolicy / DiscardOldestPolicy**: silently drops — only suitable for discardable tasks (metrics, log).

### Sizing
- **CPU-bound**: pool ≈ number of cores; more threads only increase context switching.
- **IO-bound**: pool ≈ core × (1 + W/C); W/C is the wait/compute ratio — REST, JDBC, file IO can be 10–50 times the core count.
- Little's law validation: concurrency needed ≈ throughput × target latency (e.g. 1000 req/s × 200 ms = 200 in flight).
- Metrics: expose activeCount/queueSize via Micrometer; alert when queue > 70% for many minutes.

### Production pitfalls
- Unbounded queue (default of {{newFixedThreadPool}}): p99 drifts long then OOM heap.
- Exceptions thrown without anyone noticing: wrap with try-catch, define an UncaughtExceptionHandler.
- JDBC pool must be tuned in parallel: 200 threads with 10 connections = 190 threads queued waiting for a connection.

> Senior tip: I always provide a sample number: with an external API at 100 rps and 200 ms latency, concurrency cap = 20 by Little's law; rate limiter at 100 rps blocks bursts. An answer missing numbers and measurement is half a point down at senior level.`,
    follow: [
      'Why does JDK check the queue before creating threads above core?',
      'CallerRunsPolicy blocking the Netty event loop — how to handle it?'
    ]
  },
  'concurrency-004': {
    q: 'Why should you avoid using {{Executors.newFixedThreadPool}} / {{newCachedThreadPool}} by default in production?',
    a: `**Summary:** {{newFixedThreadPool}} uses an unbounded {{LinkedBlockingQueue}} ⇒ a burst makes the queue grow infinitely: p99 drifts long then OOM heap; maxPoolSize becomes almost meaningless. {{newCachedThreadPool}} has max = {{Integer.MAX_VALUE}} with {{SynchronousQueue}} ⇒ bursts create thousands of threads ⇒ OOM "unable to create native thread". Production should build ThreadPoolExecutor manually with bounded queue and deliberate policy.

### Failure story

~~~java
// Burst 50k tasks in 10s, each ~100ms
Executors.newFixedThreadPool(10);
// unbounded queue: tens of thousands of tasks queued => p99 to hundreds of seconds
// tasks holding large payload => OOM heap

Executors.newCachedThreadPool();
// SynchronousQueue: each task needs a new thread
// 10k threads × 1 MB stack reserve => "unable to create native thread"
~~~

### Shortcomings of factory helpers
- Do not expose rejection policy (default Abort) and ThreadFactory — thread dumps become pool-1-thread-123, hard to grep.
- Do not expose queue type/capacity, allowCoreThreadTimeOut — all tuning requires code changes.
- No built-in metrics: queue depth / active count / rejection count.
- Java 21: {{newVirtualThreadPerTaskExecutor}} replaces "cached pool" for IO tasks — but still must limit at the resource layer (JDBC pool, semaphore), or you will DDOS your own DB.

### The right way

~~~java
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    8, 32, 30, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(200),
    new CustomizableThreadFactory("video-encode-"), // Spring; set daemon via setDaemon(true)
    new ThreadPoolExecutor.CallerRunsPolicy()); // or Abort + retry/MQ
pool.allowCoreThreadTimeOut(true);
~~~

Rule I apply when reviewing for the team: every production pool must have (1) bounded queue, (2) explicitly stated rejection policy, (3) thread names easy to grep.

> Senior tip: a real case I investigated: p99 jumped from 80 ms to 9 s not because code slowed down, but because the unbounded queue swallowed 200k tasks after a traffic spike. Fail fast with explicit rejection is better than silently queuing infinitely.`,
    follow: [
      'CallerRunsPolicy with the Netty event loop — what is the risk?',
      'With virtual threads, what else must be limited besides thread count?'
    ]
  },
  'concurrency-005': {
    q: '{{CompletableFuture}}: difference between {{thenApply}} and {{thenCompose}}, how to use {{allOf}}, exception handling, and where does the default executor run?',
    a: `**Summary:** {{thenApply}} = map a value to a value; {{thenCompose}} = flatMap when the next step itself returns a CompletableFuture — avoid nesting CF<CF<T>>. Errors handled via exceptionally / handle / whenComplete. Without passing an executor: the callback runs on the thread that completed the previous step, or ForkJoinPool.commonPool() — blocking tasks must use a separate executor.

### thenApply vs thenCompose

~~~java
CompletableFuture<HttpResp> resp = client.callAsync(url);

// map value -> value
CompletableFuture<Dto> dto = resp.thenApply(Dto::of);

// flatMap: next step is async (returns CF)
CompletableFuture<Detail> d = resp.thenCompose(r -> fetchAsync(r.id));

// if using thenApply r -> fetchAsync(r.id): you get CF<CF<Detail>> — wrong result
~~~

### allOf + collecting results
~~~java
CompletableFuture<List<Price>> all = CompletableFuture
    .allOf(c1, c2, c3)
    .thenApply(v -> List.of(c1.join(), c2.join(), c3.join()));
~~~
- allOf returns CF<Void>; after complete, each child CF is done so join does not block.
- If one child completes exceptionally, allOf completes exceptionally (wrapped in CompletionException) — but only when ALL child CFs finish: allOf is not fail-fast; to cancel early you must handle it yourself.

### Exception handling
- {{exceptionally(ex -> fallback)}}: only on error; use for fallback value.
- {{handle((v, ex) -> ...)}}: always runs; use to normalize both paths.
- {{whenComplete((v, ex) -> ...)}}: side effect (log/metric), preserves original result.
- A chain without error handling will silently drop until join/get — the "fall into the void" error; always add whenComplete to log.

### Default executor
- Without passing one: callback runs on the thread that completed the previous step (or Caller thread if already complete).
- Async without executor: runs on {{ForkJoinPool.commonPool()}} (parallelism = cores - 1) — when drained it affects the whole JVM (parallel streams, other CFs).
- Big pitfall: blocking code (JDBC, REST sync) inside commonPool freezes the entire commonPool; classic self-deadlock: a callback in commonPool .join() a child CF that also runs in commonPool.

> Senior tip: my convention: then* callbacks are non-blocking only; all IO goes through supplyAsync(fn, ioExecutor) separately; join/get only at the edge layer (controller, batch-finish). This avoids "CF hell" and commonPool self-deadlock.`,
    follow: [
      'thenApply vs thenApplyAsync — which thread does the callback run on in each case?',
      'How do you set a timeout for a multi-step CF chain?'
    ]
  },
  'concurrency-006': {
    q: 'Deadlock: what are the 4 required Coffman conditions, how is it detected via thread dump, how to prevent it in design? Distinguish livelock and starvation.',
    a: `**Summary:** deadlock requires all 4 Coffman conditions — mutual exclusion, hold-and-wait, no-preemption, circular wait; break any one and it is gone. In production detected via thread dump: the JVM prints "Found one Java-level deadlock". Livelock: threads are running but progress = 0 because they keep yielding to each other. Starvation: a thread never gets resources because it is continuously preempted.

### 4 Coffman conditions
1. **Mutual exclusion** — a resource is used by only one thread at a time.
2. **Hold and wait** — holding one lock while waiting for another.
3. **No preemption** — a lock cannot be forcibly removed from the holding thread.
4. **Circular wait** — cycle: A waits for B, B waits for A.

### Detecting via thread dump

~~~bash
jstack <pid> > dump-1.txt       # capture 2–3 times a few seconds apart
jcmd <pid> Thread.print -l      # alternative to jstack
~~~

~~~text
"Thread-A" waiting to lock <0x0a1b> (owned by "Thread-B")
"Thread-B" waiting to lock <0x9c2d> (owned by "Thread-A")
Java level deadlock ...
~~~

ReentrantLock is also detected because AQS holds the owner. If the dump does not report deadlock but the service hangs (waiting for IO/DB lock): compare multiple dumps — threads stuck at the same stack in every capture are suspects (hot thread analysis).

### Prevention — break exactly 1 of the 4 conditions
- **Lock ordering**: all code locks in the same order (e.g. by entity id ascending) — breaks circular wait, the most durable method.
- **tryLock + timeout**: if wait fails, release all held locks and retry — denies no-preemption.
- **Open calls**: do not invoke callbacks/DB/network while holding a lock.
- Reduce nested locks: one method, one lock; use existing concurrent structures.

~~~java
// Break circular wait: always lock two accounts by ascending id
Account a = from, b = to;
if (a.id > b.id) { Account t = a; a = b; b = t; }
synchronized (a) { synchronized (b) { transfer(from, to, amount); } }
~~~

### Livelock & starvation
- **Livelock**: both sides retry continuously and cancel each other's actions — active but no progress; fix with random backoff or one side deciding.
- **Starvation**: writers continuously win, readers starve because the lock is not fair; fix with fair lock (reduces throughput), quota, or ordered MQ.

> Senior tip: DB deadlock is the hardest form: MySQL auto-resolves (rollbacks one transaction) but the app only sees a generic error. Enable innodb_print_all_deadlocks to log every deadlock to the error log — one app deadlock is just one of hundreds in DB logs.`,
    follow: [
      'Thread dump does not show deadlock but service hangs — how to investigate further?',
      'synchronized has no timeout — how to implement "wait at most X ms"?'
    ]
  },
  'concurrency-007': {
    q: 'Virtual threads (Java 21): internal mechanism, pinning problem, when to use / not use, impact on {{ThreadLocal}} and connection pools?',
    a: `**Summary:** a virtual thread is a thread managed by the JVM, not an OS thread: the JVM mounts it onto a carrier thread (ForkJoinPool, carriers ≈ CPU count) and when blocking IO occurs, the JVM saves the stack to heap, unmounts, and returns the carrier to another task. Low cost means millions of concurrent tasks. Pinning: when blocking inside a {{synchronized}} block on Java 21, the virtual thread cannot unmount — the carrier is held (Java 24/25 removes this restriction via JEP 491).

### Mechanism
- Virtual thread has heap-based stack (continuation); scheduler is ForkJoinPool FIFO.
- Blocking IO provided by JDK (Socket, sleep, j.u.c locks) is the unmount point (Object.wait on Java 21 still pins); after IO, the task is remounted on a new carrier.
- API compatible: {{Thread.ofVirtual().start()}} or {{Executors.newVirtualThreadPerTaskExecutor()}}. New style: one thread per task, NO pool.

### Pinning
~~~java
synchronized (lock) {        // inside this block blocking IO...
    api.call();              // => virtual thread pinned to carrier
}                            // carrier cannot be freed
~~~
- Java 21: blocking inside synchronized (or calling native) prevents unmount => holds carrier; when many tasks hit this block, parallelism collapses to the number of carriers.
- Detection: flag {{-Djdk.tracePinnedThreads=full}} (prints pinned stack; removed from JDK 24) or JFR event jdk.VirtualThreadPinned.
- Before Java 24: replace synchronized with ReentrantLock in regions that block IO — the top measure.

### Should / should not
- **Should**: server with many concurrent connections via blocking IO; migrate existing blocking code without switching to reactive; fan-out calling hundreds of calls per request.
- **Should not**: CPU-bound (cheap threads do not help core count); reactive code already working well; tasks requiring large state via ThreadLocal without migrating to ScopedValue.
- Virtual threads are "cheap" but still limited by resources underneath (DB pool, file descriptors) — that is where semaphore + rate limit belong.

### ThreadLocal & resource pools
- NO virtual thread pooling → ThreadLocal creates a new copy per task: MDC, security context recreated per request, GC pressure increases; large objects held in ThreadLocal × millions of tasks = easy OOM.
- Bottleneck usually shifts to JDBC pool: 10 connections = 10 tasks running in parallel, rest queued. That is CORRECT — but you must tune the JDBC pool and look at details, not "increase pool infinitely".

> Senior tip: benchmark before trusting virtual threads: test increasing concurrency from 100 to 10k, measure p99 and connection pool; usually p99 depends more on JDBC pool than thread count — increasing JDBC pool is the real fix.`,
    follow: [
      'How to detect pinning of a Java 21 service in production?',
      'Should virtual threads be used for fan-out of 1000 calls per request or a reactive stack?'
    ]
  },
  'concurrency-008': {
    q: 'When to use {{ThreadLocal}}? Why does it cause memory leaks in thread pools and how is it handled?',
    a: `**Summary:** {{ThreadLocal}} gives each thread its own data copy: user context, transaction context, trace id MDC... In thread pools, threads live long so values set are not released unless {{remove()}} is called — heap leak; worse, the next task may read the previous task's value (security issue).

### Mechanism
- Each Thread has a ThreadLocalMap: key is a weak reference to the ThreadLocal object, value is a strong reference.
- {{set(v)}} assigns an entry into the current thread's map; {{get()}} searches the map; when the ThreadLocal object leaves scope, the key is GC'd but the value remains until cleaned lazily. {{remove()}} is the only reliably active cleanup method.

### Leak in pools
1. Task forgets remove: value stays in thread for days, occupying Old Gen.
2. **Data leak between requests**: next task reads the wrong MDC requestId/userId — serious security issue, un-debuggable from stack trace.
3. Value referencing a webapp class (Tomcat) ⇒ WebappClassLoader cannot be released on redeploy → Metaspace leak.
4. Static cache + ThreadLocal = doubles heap footprint.

### The right way

~~~java
try {
    MDC.put("requestId", reqId);
    chain.doFilter(req, resp);
} finally {
    MDC.clear();          // always clean in finally
}
~~~

- Convention: set — try/finally — remove in the same call stack; put set/remove in filter/interceptor, not letting individual methods set themselves.
- Mutable SimpleDateFormat: wrapping with ThreadLocal.withInitial is temporary; Java 17/21 uses immutable DateTimeFormatter — done, no ThreadLocal needed.
- Java 21/22 preview: ScopedValue replaces ThreadLocal in virtual-thread code; value tied to scope so dies automatically, no need to remember remove.

> Senior tip: a "user A sees user B's data" case stuck with me: MDC held the previous request's userId in the thread, a later filter read MDC without setting — 1 in 10k requests hit this. After that, our team reviews requiring {{set(}} and {{remove}} to appear together in the same method.`,
    follow: [
      'ThreadLocalMap uses WeakReference for the key — why does the value still leak?',
      'How does InheritableThreadLocal behave with virtual threads?'
    ]
  },
  'concurrency-009': {
    q: 'How does CAS work, how does {{AtomicInteger}} use it, what is the ABA problem, and how does {{LongAdder}} differ from {{AtomicLong}}?',
    a: `**Summary:** CAS is the CPU's atomic "compare and swap": write a new value only if the current value matches what is seen — the basis of lock-free. {{AtomicInteger}} uses a CAS loop for getAndIncrement. ABA: a value goes A → B → A, making CAS think nothing changed; fix with {{AtomicStampedReference}} (with stamp). {{LongAdder}} fights hot-spots: splits counter into many cells, sums on read — higher throughput under conflict, trading read accuracy.

### CAS in JVM

~~~java
public final int incrementAndGet() {
    int cur;
    do {
        cur = get();                            // read current
    } while (!compareAndSet(cur, cur + 1));     // fail => retry
    return cur + 1;
}
~~~

- CAS compiles to {{lock cmpxchg}} on x86 or ldxr/stxr on ARM — hardware atomic, no mutex needed.
- Many JDK structures build on CAS: AtomicXxx, AQS (base for ReentrantLock/Semaphore), ConcurrentHashMap node insert...

### ABA problem
CAS only checks "equal or not", not history of change. Classic error on a lock-free stack:

~~~text
Thread 1: reads head = A, aims to CAS A -> next
Thread 2: pops A, pops B, pushes node A back (A B A)
Thread 1: CAS succeeds — BUT the stack really changed
~~~

Fix:
- {{AtomicStampedReference}}: CAS on a pair (reference, stamp); stamp increments each change.
- In Java, objects with GC-aware references rarely suffer; ABA mainly on off-heap/direct buffers, object pools, node reuse.
- Alternative: attach a version number to the record, or revert to locks for complex parts.

### LongAdder vs AtomicLong

| | AtomicLong | LongAdder |
|---|---|---|
| Mechanism | 1 volatile long + CAS | base + array of Cells by thread hash |
| High conflict | CAS loops fail continuously, CPU burns | each thread CAS its own cell, few fails |
| sum() | exact at a point | approximate when other threads updating |
| Use when | need exact value at each moment | counting metrics, high throughput |

LongAdder wins hot-key by splitting cache lines: avoids many cores CAS on the same cache line (cache line bouncing).

> Senior tip: code review rule: metrics counters → LongAdder; exact-value-at-point (token bucket rate limiter) → AtomicLong. In async-profiler, if you see CAS fail spin loop of AtomicLong consuming CPU under high conflict — that is where LongAdder shines.`,
    follow: [
      'CAS + volatility: why must {{AtomicInteger}}\'s field be volatile?',
      'ABA on machines with GC-aware references: is it still a real issue?'
    ]
  },
  'concurrency-010': {
    q: 'Double-checked locking for singleton: write correct code and explain why {{volatile}} is mandatory.',
    a: `**Summary:** DCL enters {{synchronized}} only on the first call. If instance is not {{volatile}}, JIT/CPU may assign the reference to the field before the constructor finishes; another thread sees reference != null but uses an object "half-built" (fields uninit). {{volatile}} forbids this reordering via happens-before.

### Correct code

~~~java
public class Db {
    private static volatile Db instance;   // volatile MANDATORY

    public static Db getInstance() {
        Db r = instance;                   // read once for hot path
        if (r == null) {
            synchronized (Db.class) {
                r = instance;              // read again inside lock
                if (r == null) instance = r = new Db();
            }
        }
        return r;
    }
}
~~~

### Why missing volatile is wrong
- {{new Db()}} includes: allocate memory, run constructor, assign reference to field. JIT only guarantees order inside the synchronized block; thread B outside may see reference assignment before constructor completes.
- Thread B enters the first branch (no lock), sees instance != null, returns an uninit object — a bug depending on CPU/JIT/scheduler, hard to reproduce.
- {{volatile}} creates happens-before between writing the reference and reading after; all constructor init fields are visible to thread B.

### Alternatives (recommended over DCL)
- **Holder idiom** — uses JVM class initializer lock, no volatile needed:

~~~java
private static class Holder { static final Db INSTANCE = new Db(); }
public static Db getInstance() { return Holder.INSTANCE; }  // lazy + thread-safe
~~~

- **{{enum}} singleton**: blocks reflection + serialization for free (Effective Java recommends).
- In Spring apps: the container's singleton bean already has proper lifecycle/scope — do not write by hand.

> Senior tip: I treat "hand-written DCL singleton" as legacy code needing careful review: two common bug groups are (1) forgot volatile — "half-built object" bug hits production unnoticed, (2) holder but class loaded by two different classloaders in an app server.`,
    follow: [
      'What are the 3 steps of {{new Foo()}} that JIT can reorder?',
      'How does Holder idiom work when a class is loaded twice by two classloaders?'
    ]
  },
  'concurrency-011': {
    q: 'Compare use cases of {{CountDownLatch}}, {{CyclicBarrier}}, {{Semaphore}}, and {{Phaser}}: when do you choose each?',
    a: `**Summary:** {{CountDownLatch}} = wait for N tasks to finish (once). {{CyclicBarrier}} = N workers wait for each other at a sync point, reusable. {{Semaphore}} = limit number of concurrent threads (limit concurrency / resource — not time-based rate limit). {{Phaser}} = multi-phase barrier with flexible party count.

### Sample code for each

~~~java
// CountDownLatch: fan-out, wait for all then aggregate
CountDownLatch done = new CountDownLatch(tasks.size());
for (var t : tasks) executor.submit(() -> {
    try { process(t); } finally { done.countDown(); }   // always in finally
});
done.await(30, TimeUnit.SECONDS);

// CyclicBarrier: workers wait at each phase, with barrier action
CyclicBarrier barrier = new CyclicBarrier(N, () -> flushStage());

// Semaphore: max 5 concurrent calls to external API
Semaphore gate = new Semaphore(5);
gate.acquire();
try { api.call(); } finally { gate.release(); }
~~~

### When to choose each

| Scenario | Choice |
|---|---|
| Wait for N tasks then aggregate | CountDownLatch |
| Workers sync at each phase, repeat | CyclicBarrier |
| Limit external resource | Semaphore |
| Party count changes between phases | Phaser |
| Fan-out/fan-in async with data flow | CompletableFuture.allOf |

### Pitfalls
- Forgetting countDown on error path → await hangs forever: put in finally, always use await with timeout.
- Semaphore: releases must equal acquires; release in finally; with semaphore, a different thread can release (unlike a lock).
- CyclicBarrier: one thread throws and the barrier becomes "broken" (BrokenBarrierException for all waiting); design reset/retry.
- CountDownLatch does not reset; use CyclicBarrier if reuse needed.

> Senior tip: 90% of real fan-out needs are just "wait for N tasks" — CountDownLatch + await timeout is the cleanest pattern. I have used Phaser exactly once: a pipeline with multiple stages where worker count changes after each stage — powerful but not worth using as a default.`,
    follow: [
      'How does CyclicBarrier "broken" happen and how to handle it?',
      'When does CompletableFuture.allOf replace CountDownLatch?'
    ]
  },
  'concurrency-012': {
    q: 'Design a system to process 1 million records in parallel with rate limits (external API) and no data loss. How do you build the architecture?',
    a: `**Summary:** split into 3 layers: (1) durable source with checkpoint (Kafka or table cursor) so crash can resume; (2) controlled fan-out: bounded queue + correct rate limiter per external quota; (3) idempotent sink + DLQ for at-least-once with exactly-once effect. No unbounded queues; do not infer quota from worker count.

### Overall architecture

~~~text
Kafka topic (or job table with cursor)
  -> Ingest worker: fetch small batch (e.g. 500), advance checkpoint after batch sink ack
  -> BoundedQueue (cap ~ 2× concurrency)
  -> Worker pool (virtual threads): one per record
  -> Rate limiter (token bucket per API quota) before each external call
  -> Sink writes idempotently by key; errors go to DLQ
  -> Checkpoint store: advance after full batch committed
~~~

### 1) Source — durable checkpoint
- Kafka: offset managed by broker, replayable; crash mid-way re-consumes from uncommitted offset — no data lost.
- Self-written batch job: save cursor (last id) in a table; commit checkpoint after sink acks the full batch, not immediately after reading.

### 2) Concurrency + rate limit
- Measure real API quota (429 headers, docs); never guess. Use token bucket (Resilience4j/Guava RateLimiter).
- Concurrency cap by Little's law: concurrency ≈ quota (rps) × expected latency. Example 100 rps × 200 ms = 20 in flight ⇒ semaphore 20.
- 429/Retry-After: worker respects Retry-After, add jitter to avoid stampede when whole cluster retries; after 3 retries push record to retry/DLQ topic.

~~~text
// Example: 10k records, quota 100 rps, latency 200 ms
// => 20 workers in parallel; rate limiter 100 rps blocks burst
// record hits 429: wait Retry-After + jitter, max 3 times then to DLQ
~~~

### 3) No data loss
- Idempotent sink by business key (upsert / unique constraint / event id) — retry safe.
- DLQ for records failing after N retries, with alerts; no DLQ silently loses data.
- Outbox pattern when atomic DB + external is needed: write outbox in the same business transaction, relay background; crash replays outbox.
- Graceful shutdown: stop new submits, drain queue (with timeout), flush final batch, advance checkpoint, then exit.

### 4) Operations
- Metrics: queue depth, in-flight count, actual rps vs quota, DLQ count, batch latency p99; alert when DLQ > 0 continuously.
- Load test to break: burst 10× quota, kill -9 mid-batch — checkpoint must resume correctly.
- Quota is a hard ceiling: switch to batching — 1 call for 500 records instead of 500 separate calls.

> Senior tip: expensive mistake I saw: "each worker sleeps 100 ms" with 250 workers thinking it rate-limits — result 2,500 rps, API throws 429 in waves, checkpoint not advancing, losing 8 hours replaying one batch. Rate limit must be measured (actual rps vs quota on dashboard), not enforced by sleep in code.`,
    follow: [
      'Why is the checkpoint after the full batch rather than after each record?',
      '429/Retry-After: should the worker retry in the same thread or push to a separate topic? Why?'
    ]
  },
  'concurrency-013': {
    q: 'Structured concurrency (Java 21 preview): what is the core idea, what problem of CompletableFuture does it solve, and where does ScopedValue replace ThreadLocal?',
    a: `**Summary:** JEP 453 (preview from Java 21) treats a group of parallel tasks as a bounded block: when leaving the block, all subtasks must finish; one fails and the parent cancels the others then throws. ScopedValue (JEP 446, preview) is immutable shared data tied to a code block instead of ThreadLocal — expires automatically, does not leak when pool is reused, and inheritance is cheap for virtual threads.

### Problems with CompletableFuture
- Callbacks run on uncontrolled threads (executor/callback thread) — stack traces hard to read.
- No cascade cancellation: if one task fails, others keep running consuming resources; must write cancellation logic manually.
- "Orphan" tasks live longer than the request (no lifetime limit) — hard to reason about.
- No scope block — no point where "all must finish".

### StructuredTaskScope

~~~java
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    var u = scope.fork(() -> findUser(id));
    var o = scope.fork(() -> fetchOrder(id));

    scope.join().throwIfFailed();   // 1 fails => cancel rest
    return new Profile(u.get(), o.get());
}   // leaving block: no subtask survives
~~~

- Clear lifetime: children do not live outside the block that spawned them; cancellation propagates automatically.
- Two built-in policies: ShutdownOnFailure (1 fail cancels all) and ShutdownOnSuccess (first success is enough, cancel rest — good for "race for fastest").

### ScopedValues

~~~java
static final ScopedValue<User> CURRENT_USER = ScopedValue.newInstance();

ScopedValue.where(CURRENT_USER, user)
           .run(() -> handleRequest(request));   // only inside run()
~~~

- No set/remove to forget: value lives exactly within the scope then disappears; no leak between pool tasks.
- Immutable; only rebind for smaller scope.
- With virtual threads, subtask forked inside StructuredTaskScope inherits binding cheaply (shared, not copied), no per-thread entry like ThreadLocal.
- ScopedValue preview 21-24, final in JDK 25 (JEP 506); structured concurrency still preview in JDK 25 with API changes (StructuredTaskScope.open() + Joiner replacing ShutdownOnFailure/ShutdownOnSuccess). On JDK 21 production: ThreadLocal.remove() in filter is still the safe standard.

> Senior tip: quick split: CompletableFuture fits data-flow composition of many steps; StructuredTaskScope fits the "call N, 1 fail cancels rest, aggregate" pattern. I apply it to fan-out of 3-5 calls: code drops from ~40 lines (CF + manual AtomicBoolean cancellation) to ~10 lines, stack traces become easy to read.`,
    follow: [
      'How does ShutdownOnFailure differ from ShutdownOnSuccess in use case?',
      'Why is ScopedValue harder to leak than ThreadLocal in a thread pool?'
    ]
  },
});
