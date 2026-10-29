/*
 * English translation of js/data/q-concurrency-jvm.js — task T167; entries 001-013 re-translated in T513.
 * Format: js/core/i18n.js (content overlay).
 * ids: concurrency-001 concurrency-002 concurrency-003 concurrency-004 concurrency-005 concurrency-006 concurrency-007 concurrency-008 concurrency-009 concurrency-010 concurrency-011 concurrency-012 concurrency-013
 */
App.i18n.content({
  'concurrency-001': {
    q: 'Java Memory Model: what does "happens-before" mean? What does {{volatile}} guarantee and what does it NOT guarantee?',
    a: `**Summary:** happens-before is the "ordering promise" made by the Java Memory Model (JMM): if action A happens-before action B, then everything A wrote is **visible** when B runs, and A is treated as occurring before B. {{volatile}} creates a happens-before edge between a write and a later read of the same variable, so it guarantees **visibility and ordering** — but it does NOT guarantee **atomicity** of multi-step operations such as {{i++}}.

### Quick intuition
Think of each thread as an employee with a private notepad (the CPU cache). You write a new number on your notepad, but a colleague at the next desk still reads their old notepad. happens-before is the rule "when you finish writing, copy it to the shared whiteboard, and readers must look at the whiteboard". {{volatile}} is that whiteboard for one variable. But a whiteboard does not stop two people reading 5 at the same time, both adding 1, and both writing 6 — for that you need a lock or an atomic operation.

### Key terms
- **JMM (Java Memory Model)**: the part of the Java spec (JLS chapter 17) that says which values a thread is allowed to see from writes made by another thread.
- **Visibility**: whether thread B sees the value thread A just wrote.
- **Reordering**: the compiler, JIT or CPU changes instruction order to run faster, as long as the result within **one** thread does not change.
- **Atomicity**: an operation happens as a whole, with no other thread interleaving.
- **Data race**: two threads access the same variable, at least one writes, and there is no happens-before between them.
- **Unsafe publication**: handing an object reference to another thread without happens-before, so that thread may see a "half-built" object.
- **Monitor**: the lock attached to every Java object, used by {{synchronized}}.

### Why the JMM is needed
1. **Each core has its own cache.** A write may live only in that core's cache or store buffer for a while; another core still reads the old value. Why: going to RAM is hundreds of times slower than cache, so hardware is "lazy" about syncing for speed.
2. **The compiler/JIT reorders instructions.** For example the JIT sees {{stop}} is never modified inside the loop and hoists the read out: {{while (!stop)}} becomes an infinite loop. Why: within one thread that does not change the result.
3. **Another thread may see a "half-built" object.** Thread A finishes the constructor and then assigns the reference, but thread B sees a non-null reference while fields are still default (0/null) — unsafe publication.
4. **The JMM is a contract:** if you create enough happens-before edges, the JVM promises all those optimizations stay invisible to you. Without happens-before the result is undefined.

~~~text
Core 1 (Thread A)            Core 2 (Thread B)
cache: stop = true           cache: stop = false   <- still reads the old value
        \\                          /
         ---------- RAM: ? --------
volatile: writes must be flushed, reads must take the newest copy
~~~

### Common happens-before rules
1. **Program order**: within one thread, earlier statements happen-before later ones.
2. **Monitor lock**: unlocking a monitor happens-before the next lock on the **same** monitor. Why it matters: this is why code inside {{synchronized}} sees everything the previous thread wrote.
3. **{{volatile}}**: a write to a volatile variable happens-before every later read that sees that value.
4. **{{Thread.start()}}**: everything before {{start()}} is visible in the new thread. **{{Thread.join()}}**: everything the child thread did is visible after {{join()}} returns.
5. **Transitive**: A hb B and B hb C implies A hb C. This is the "magic" that lets ordinary field writes **before** a volatile write be published too.

### Volatile: what you get and what you do not

~~~java
volatile boolean stop;
// CORRECT: flag visibility, safe publication
while (!stop) { work(); }    // once another thread sets stop = true, the loop is guaranteed to stop

// WRONG: i++ is a 3-step read-modify-write, updates are still lost
volatile int counter;
counter++;                   // => use AtomicInteger / LongAdder / lock
~~~

- **You get**: reads see the latest value; writes **before** the volatile write are "published" to threads that later read the volatile variable.
- **You do not get**: atomicity for compound actions; no protection against check-then-act races ({{if (x == null) x = ...}}).

Numbers: 2 threads, each calls {{counter++}} 100,000 times on a volatile variable. Expected 200,000; in practice you usually get something like 13x,xxx-19x,xxx and a different value every run. Switch to {{AtomicInteger.incrementAndGet()}} and it is always 200,000.

### Common mistakes
- **A stop flag that is not volatile**: symptom is a background thread that never stops when asked (it only shows up after JIT optimizations, so a short test passes). Fix: a flag shared between threads must be {{volatile}} or {{AtomicBoolean}}.
- **Believing volatile makes a counter correct**: symptom is a count that is short under load. Fix: use {{AtomicInteger}}/{{LongAdder}} or a lock.
- **Using several separate volatile fields to keep one invariant** (e.g. min and max): a reader can see the new min with the old max. Fix: wrap them in an immutable object published through one volatile reference, or use a lock.
- **Using Thread.sleep in a test to "prove" correctness**: sleep creates no happens-before. Fix: use jcstress for litmus tests, or reason with the rules above.

### One-minute spoken answer
"happens-before is a rule of the Java Memory Model: if A happens-before B then B is guaranteed to see everything A wrote. The reason we need it is that each CPU core has its own cache and the JIT is allowed to reorder instructions, so without rules one thread could read stale values from another. The common sources of happens-before are unlock before lock on the same monitor, a volatile write before a volatile read, thread start and join, and transitivity. volatile gives me visibility and ordering, which makes it great for a stop flag or for publishing an object; but it does not make count++ atomic because that is three steps: read, add, write. In practice I use volatile for flags, AtomicInteger or LongAdder for counters, and a lock or an immutable object when several fields must change together."

> Senior tip: interviewers often ask "volatile is there, so why is it still wrong?" — the standard answer: volatile guarantees you see the value, not the integrity of a multi-step operation; you need a lock, an Atomic class or an immutable object. When I review concurrent code I require the author to point to the **specific happens-before edge** connecting writer and reader; if they cannot, the code is "correct by luck" (usually thanks to x86, and the bug shows up on ARM, for example AWS Graviton).`,
    follow: [
      'Why does double-checked locking require {{volatile}}?',
      'Give an example where {{volatile}} is used yet a race still exists.'
    ]
  },
  'concurrency-002': {
    q: 'Compare {{synchronized}}, {{ReentrantLock}}, {{ReadWriteLock}} and {{StampedLock}}: when do you choose each?',
    a: `**Summary:** {{synchronized}} is the default: short syntax, impossible to forget unlocking, and the JVM optimizes it heavily (lightweight locking when uncontended, lock coarsening/elision). Switch to {{ReentrantLock}} when you need what synchronized lacks: {{tryLock}} with timeout, interruptible waiting, fairness, multiple {{Condition}}s. {{ReadWriteLock}} and {{StampedLock}} are only worth it when reads clearly outnumber writes **and** you have measured real contention.

### Quick intuition
Imagine a meeting room with one key. {{synchronized}} is a self-locking door: you enter and it locks, you leave and it unlocks — you cannot forget. {{ReentrantLock}} is a key you carry yourself: more flexible (wait at most 2 seconds then leave, or bail out when your boss calls), but forgetting to return the key blocks the whole company. {{ReadWriteLock}} is an exhibition room: many people can **view** at the same time, but when someone needs to **modify** the display, the door closes. {{StampedLock}} lets viewers "glance in without a ticket", then check whether anyone modified anything while they glanced; if so, they look again carefully.

### Key terms
- **Monitor**: the lock built into every Java object, used by {{synchronized}}.
- **AQS (AbstractQueuedSynchronizer)**: a JDK framework that manages one state variable and a queue of waiting threads; the base of ReentrantLock, Semaphore, CountDownLatch.
- **CAS (compare-and-swap)**: a CPU instruction "write the new value if the current value is still what I saw", atomic without a lock.
- **Reentrant**: a thread already holding the lock can acquire the same lock again (nested calls) without blocking itself.
- **Contention**: several threads fighting for the same lock at the same time.
- **Lock coarsening / elision**: the JIT merges adjacent lock/unlock pairs into one, or removes a lock on an object that never escapes the method (escape analysis).
- **Starvation**: a thread waits forever and never gets its turn.

### Comparison table

| Feature | synchronized | ReentrantLock | ReadWriteLock | StampedLock |
|---|---|---|---|---|
| Mechanism | JVM monitor | CAS + AQS | 1 AQS, read/write state split | CAS + spin/park |
| tryLock/timeout | No | Yes | Yes | Yes |
| Interruptible while waiting | No | Yes | Yes | Yes |
| Reentrant | Yes | Yes | Yes | No |
| Multiple wait conditions | 1 wait set | Multiple Conditions | Yes (write lock) | No Condition |
| Auto-release on exception | Yes | Must unlock in finally | Must unlock in finally | Must unlock with the right stamp |

### Points to cover (order of consideration)
1. **synchronized first.** With no contention the JVM uses lightweight locking (a single CAS); it only inflates to a full monitor under contention. The JIT also does lock coarsening and elimination. Why choose it first: in about 90% of cases performance is equivalent, while the code is shorter and you cannot forget to unlock. (Biased locking has been disabled by default since JDK 15 and removed in JDK 18.)
2. **{{ReentrantLock}} when you need control.** Each {{Condition}} is its own wait queue (for example notFull/notEmpty in a bounded buffer); {{lockInterruptibly()}} lets a thread escape when cancelled or during shutdown; {{tryLock(2, SECONDS)}} helps avoid deadlock. Why not by default: you must call {{unlock()}} in {{finally}}, and forgetting it hangs the system.
3. **{{ReentrantReadWriteLock}} when reads dominate.** The read lock is shared, the write lock exclusive. Only worth it when the read/write ratio is very skewed (roughly above 10:1) **and** the critical section is long enough; if a read section takes a few nanoseconds, the bookkeeping for the read lock costs more than it saves. Fair mode prevents starvation but lowers throughput.
4. **{{StampedLock}} for maximum read speed.** Optimistic read: read without locking, then {{validate(stamp)}} to check whether a write slipped in; if so, fall back to readLock. The price: **not reentrant** (taking it twice in the same thread self-deadlocks), no Condition, complex code, easy to unlock with the wrong stamp.

~~~java
// StampedLock optimistic read
long stamp = sl.tryOptimisticRead();   // no lock, just a "version number"
double x = cx, y = cy;                 // copy into locals
if (!sl.validate(stamp)) {             // did a write slip in while reading?
    stamp = sl.readLock();             // fall back to pessimistic
    try { x = cx; y = cy; } finally { sl.unlockRead(stamp); }
}
return Math.hypot(x, y);               // only use the data after validation
~~~

~~~java
// ReentrantLock: always lock - try - finally unlock
if (lock.tryLock(200, TimeUnit.MILLISECONDS)) {
    try { updateBalance(); } finally { lock.unlock(); }
} else {
    throw new BusyException("Account is being processed, please retry later");
}
~~~

### Common mistakes
- **Forgetting unlock on exception**: symptom is that after one error every request entering that section hangs forever (thread dump shows a pile of threads WAITING at {{ReentrantLock.lock}}). Fix: {{lock()}} right before {{try}}, {{unlock()}} in {{finally}}.
- **Using StampedLock in recursive/nested code**: symptom is a thread hanging itself. Fix: use StampedLock only in small, well-encapsulated classes and never call callbacks while holding it.
- **Choosing ReadWriteLock by gut feeling**: symptom is it is slower than synchronized when read sections are short. Fix: benchmark with JMH using the real read/write ratio.
- **A JVM lock for data that lives in the DB**: running 3 pods means 3 separate locks and no protection at all. Fix: lock or constrain at the DB layer.

### One-minute spoken answer
"By default I use synchronized because it is concise, you cannot forget to unlock, and the JVM optimizes it well when uncontended. When I need tryLock with a timeout to avoid deadlock, interruptible waiting, fairness, or multiple Conditions, I move to ReentrantLock — it is built on AQS and CAS, but I must unlock in finally. ReadWriteLock lets many readers run in parallel and only pays off when reads dominate and read sections are long enough. StampedLock adds optimistic reads and is the fastest for read-heavy workloads, but it is not reentrant and easy to misuse. My experience is not to choose from theory but to measure with JMH on real load; several times we switched back to synchronized with no throughput loss at all."

> Senior tip: do not choose a lock on a whiteboard — benchmark with JMH on a real profile. I once saw a module migrated from JDK 8 to 17 replace ReentrantLock with synchronized: throughput did not drop and the code became much shorter. One more note for Java 21: with virtual threads, blocking I/O inside synchronized **pins** the virtual thread to its carrier thread, so ReentrantLock is the safer choice there; since JDK 24 (JEP 491) this restriction has been removed for synchronized.`,
    follow: [
      'StampedLock is not reentrant — what problem does that cause when refactoring old code?',
      'How does a ReentrantLock Condition differ from Object.wait/notify?'
    ]
  },
  'concurrency-003': {
    q: 'Deep dive into {{ThreadPoolExecutor}}: the order in which threads are created on submit, rejection policies, and how to size the pool for CPU-bound vs IO-bound work?',
    a: `**Summary:** when you submit a task, {{ThreadPoolExecutor}} follows a fixed order: (1) fewer than corePoolSize threads exist, create a new one; (2) core is full, enqueue the task; (3) the queue is full, create more threads up to maximumPoolSize; (4) already at max and the queue is still full, reject according to the policy. Sizing: CPU-bound ~ number of cores; IO-bound ~ cores x (1 + W/C), where W/C is wait time over compute time. The formula is only a starting point; you must measure.

### Quick intuition
Picture a bank counter. corePoolSize is the number of permanent tellers; the queue is the row of waiting chairs; maximumPoolSize is the total headcount when temporary staff are called in; the rejection policy is the guard at the door saying "we are full for today". The surprise: this bank only calls temporary staff when **the waiting chairs are full**, not when customers first start arriving. If the row of chairs is infinite, temporary staff are never called and customers wait forever.

### Key terms
- **corePoolSize**: the number of threads the pool tries to keep permanently.
- **maximumPoolSize**: the thread ceiling, only exceeded above core when the queue is full.
- **keepAliveTime**: above-core idle threads are destroyed after this time.
- **Bounded queue**: a queue with a capacity limit, for example {{ArrayBlockingQueue(100)}}.
- **Rejection policy**: what to do when the pool cannot accept another task.
- **CPU-bound / IO-bound**: a task spends its time computing / waits on network, DB or files.
- **Little's law**: work in progress = throughput x time per item.
- **Backpressure**: a "slow down" signal sent back to the producer when the system is overloaded.

### Submit order (step by step)
1. **Fewer threads than core** -> create a new thread and run the task immediately, even if some thread is idle. Why: the pool "warms up" to the core size.
2. **Core is full** -> {{queue.offer(task)}}. Why the queue first: the JDK treats threads as expensive, so queueing is preferred over creating another thread.
3. **Queue full** -> create new threads up to maximumPoolSize. This is the emergency mode to shed load.
4. **At max and queue still full** -> call the RejectedExecutionHandler.

~~~text
submit(task)
   |
   v
threads < core ? --yes--> create a new thread
   | no
   v
queue.offer ok ? --yes--> wait in the queue
   | no (full)
   v
threads < max ? --yes--> create a "temporary" thread
   | no
   v
rejection policy
~~~

### Full constructor

~~~java
new ThreadPoolExecutor(
    4,                                  // corePoolSize
    8,                                  // maximumPoolSize
    60, TimeUnit.SECONDS,               // keepAlive for non-core threads
    new ArrayBlockingQueue<>(100),      // queue BOUNDED (very important)
    namedThreadFactory,                 // name threads so dumps are readable
    new ThreadPoolExecutor.CallerRunsPolicy()); // rejection
~~~

- Mental trap: the queue is checked **before** creating threads above core. With an unbounded queue, maxPoolSize is almost meaningless (the pool never grows above core).
- {{allowCoreThreadTimeOut(true)}} lets even core threads die when idle — good for pools with elastic traffic.
- Numbers: core 4, max 8, queue 100. Submit 50 tasks at once: 4 run, 46 wait in the queue, and there is **no** fifth thread. Submit 110 tasks: 4 run + 100 queued + 4 temporary threads run 4 more = 108, and the last 2 tasks are rejected.

### Rejection policies
- **AbortPolicy** (default): throws {{RejectedExecutionException}} — fail fast; the caller retries or returns 503.
- **CallerRunsPolicy**: runs the task on the submitting thread — natural backpressure because a busy caller cannot submit more; but if you submit from a Netty event loop, the whole system slows down with it.
- **DiscardPolicy / DiscardOldestPolicy**: drop silently — only for tasks that may be thrown away (metrics, logs).

### Sizing
1. **CPU-bound**: pool ~ number of cores (maybe +1). Why: there are only N real cores; more threads only add context switches.
2. **IO-bound**: pool ~ cores x (1 + W/C). Example: 8 cores, each request waits 90 ms on the DB and computes 10 ms -> W/C = 9 -> about 80 threads. REST, JDBC and file IO can be 10-50 times the core count.
3. **Validate with Little's law**: required concurrency ~ throughput x target latency (for example 1000 req/s x 200 ms = 200 requests in flight).
4. **Measure**: expose activeCount/queueSize via Micrometer; alert when the queue is above 70% for several minutes.

### Common mistakes
- **Unbounded queue** (the default of {{newFixedThreadPool}}): symptom is p99 drifting upward, heap growing, then OOM. Fix: always pass a capacity to the queue.
- **A task throws and nobody notices**: with {{submit()}} the exception sits quietly in the Future. Fix: wrap the task in try-catch and log, or use {{execute()}} with an UncaughtExceptionHandler.
- **JDBC pool not tuned in parallel**: 200 threads with 10 connections = 190 threads queued waiting for a connection, mass timeouts. Fix: match the thread pool to the connection pool and the DB limit.
- **Setting a large max with an unbounded queue and expecting elasticity**: the pool stays at core forever. Fix: understand the order above.

### One-minute spoken answer
"ThreadPoolExecutor handles a submit in order: below core it creates a thread, at core it enqueues, only when the queue is full does it create threads up to max, and when max is reached it rejects. The point people get wrong is that the queue comes before above-core threads, so with an unbounded queue max is meaningless and a burst turns into latency and then OOM. The policy I usually use is AbortPolicy to fail fast with a 503, or CallerRunsPolicy for internal batch work to get backpressure. For sizing, CPU-bound equals core count, IO-bound is cores times one plus W over C, validated with Little's law and queue-size and active-count metrics. In production I always require a bounded queue, an explicit policy and named threads."

> Senior tip: I always give a concrete number: with an external API at 100 rps and 200 ms latency, the concurrency cap is 20 by Little's law; a rate limiter at 100 rps blocks bursts. An answer without numbers and without a measurement method loses half a point at senior level.`,
    follow: [
      'Why does the JDK check the queue before creating threads above core?',
      'CallerRunsPolicy blocks the Netty event loop — how do you handle that?'
    ]
  },
  'concurrency-004': {
    q: 'Why should you avoid using {{Executors.newFixedThreadPool}} / {{newCachedThreadPool}} by default in production?',
    a: `**Summary:** {{newFixedThreadPool}} uses an unbounded {{LinkedBlockingQueue}}: on a burst the queue grows without limit, p99 drifts upward and then the heap OOMs, and maxPoolSize becomes almost meaningless. {{newCachedThreadPool}} has max = {{Integer.MAX_VALUE}} with {{SynchronousQueue}} (it cannot hold a task): a burst creates thousands of threads, leading to OOM "unable to create native thread". In production, build a {{ThreadPoolExecutor}} yourself with a bounded queue, a deliberate rejection policy and named threads.

### Quick intuition
{{newFixedThreadPool}} is a restaurant with 10 cooks but an endless queue: customers keep lining up, nobody is ever turned away, but the last person waits 3 hours and the queue spills into the street (runs out of RAM). {{newCachedThreadPool}} is the opposite: every customer gets a newly hired cook, without limit — until there is no room left in the kitchen (out of memory / the OS thread limit). Both lack the most important thing: a clear limit and a way to say "no" when overloaded.

### Key terms
- **Executors**: a JDK utility class that produces common pools (fixed, cached, single, scheduled).
- **LinkedBlockingQueue**: a linked-list queue; if you create it without a capacity, the capacity is {{Integer.MAX_VALUE}}.
- **SynchronousQueue**: a queue with capacity 0 — every put needs a thread taking the task immediately.
- **Native thread**: a real operating-system thread; each Java platform thread maps to one native thread with its own stack.
- **OOM (OutOfMemoryError)**: the JVM runs out of heap, metaspace, or cannot create a native thread.
- **p99**: 99% of requests are faster than this value; it measures the slow tail users feel.
- **ThreadFactory**: the object that decides how a thread is created (name, daemon, priority).

### Failure story (step by step)
1. A burst of 50k tasks in 10 seconds, each task about 100 ms.
2. A fixed pool of 10 threads handles about 100 tasks/second, so in 10 seconds it finishes only about 1k tasks. The other 49k sit in the queue. Why no extra threads: the queue is never full, so max is never used.
3. The last task in the queue waits about 490 seconds. The client timed out long ago, but the server keeps doing useless work.
4. Each task holds a payload (for example 50 KB) -> 49k x 50 KB ~ 2.4 GB in the heap -> continuous GC -> OOM.

~~~java
// Burst of 50k tasks in 10s, each ~100ms
Executors.newFixedThreadPool(10);
// unbounded queue: tens of thousands of tasks waiting => p99 in the hundreds of seconds
// tasks holding large payloads => heap OOM

Executors.newCachedThreadPool();
// SynchronousQueue: every task needs a new thread (if no thread is free)
// 10k threads x ~1 MB stack reserve => "unable to create native thread"
~~~

~~~text
newFixedThreadPool(10)          newCachedThreadPool()
[10 threads] <- [unbounded queue]   [thread][thread][thread]... unbounded
  latency grows -> heap OOM         RAM/ulimit exhausted -> native thread OOM
~~~

### Shortcomings of the factory helpers
- They do not expose the rejection policy (default Abort) or the ThreadFactory — thread dumps are full of {{pool-1-thread-123}}, hard to grep.
- They do not expose the queue type/capacity or allowCoreThreadTimeOut — every tuning change requires code changes.
- No built-in metrics: queue depth / active count / rejection count.
- Java 21: {{newVirtualThreadPerTaskExecutor}} replaces the "cached pool" for IO tasks — but you still must limit at the resource layer (JDBC pool, semaphore), otherwise you DDoS your own DB.

### The right way

~~~java
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    8, 32, 30, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(200),                    // at most 200 waiting tasks
    new CustomizableThreadFactory("video-encode-"),   // Spring; set daemon via setDaemon(true)
    new ThreadPoolExecutor.CallerRunsPolicy());       // or Abort + retry/MQ
pool.allowCoreThreadTimeOut(true);
~~~

Without Spring, Java 21 provides {{Thread.ofPlatform().name("video-encode-", 0).factory()}} to name threads.

Rule I apply when reviewing for the team: every production pool must have (1) a bounded queue, (2) an explicitly stated rejection policy, (3) thread names that are easy to grep, (4) metrics for queue size and rejection count.

### Common mistakes
- **Creating a pool inside every request** ({{Executors.newFixedThreadPool}} in a controller method): symptom is the thread count growing forever because the pool is never shut down. Fix: a shared pool bean, shut down with the app lifecycle.
- **Using newSingleThreadExecutor for important work**: it also has an unbounded queue, and one slow task backs up the whole queue. Fix: set a capacity and a timeout.
- **Switching to virtual threads and dropping all limits**: symptom is the DB reporting "too many connections" or the partner returning 429. Fix: a Semaphore or connection pool as the real limit.
- **CallerRunsPolicy on a Netty/WebFlux IO thread**: the event loop is blocked and every other connection slows down. Fix: use AbortPolicy and fail fast at that layer.

### One-minute spoken answer
"I do not use Executors.newFixedThreadPool or newCachedThreadPool in production because both lack a limit exactly where it matters most. The fixed pool uses an unbounded LinkedBlockingQueue, so on a burst tasks queue forever, latency climbs to hundreds of seconds and then the heap OOMs, while max pool is never used. The cached pool uses a SynchronousQueue with max equal to Integer.MAX_VALUE, so a burst creates thousands of threads and OOMs because a native thread cannot be created. Instead I build a ThreadPoolExecutor with a bounded queue, a clear rejection policy, named threads and metrics. Since Java 21, IO tasks can use virtual threads, but I still limit them with a semaphore or a connection pool."

> Senior tip: a real case I investigated: p99 jumped from 80 ms to 9 s not because the code got slower but because the unbounded queue swallowed 200k tasks after a traffic spike. Failing fast with an explicit rejection is much better than silently queueing forever.`,
    follow: [
      'CallerRunsPolicy on the Netty event loop — what is the risk?',
      'With virtual threads, what else must be limited besides the thread count?'
    ]
  },
  'concurrency-005': {
    q: '{{CompletableFuture}}: the difference between {{thenApply}} and {{thenCompose}}, how to use {{allOf}}, exception handling, and where does the default executor run?',
    a: `**Summary:** {{thenApply}} = map: turn a value into another value. {{thenCompose}} = flatMap: use it when the next step **itself** returns a CompletableFuture, to avoid nesting {{CompletableFuture<CompletableFuture<T>>}}. {{allOf}} waits for several futures and then collects results with {{join()}}. Errors are handled with {{exceptionally}} / {{handle}} / {{whenComplete}}. Without passing an executor, a non-async callback runs on the thread that just completed the previous step (or the calling thread if the future is already done), while {{*Async}} methods run on {{ForkJoinPool.commonPool()}} — blocking tasks must use a dedicated executor.

### Quick intuition
CompletableFuture is like a laundry ticket: you get the ticket immediately, the clothes are done later. {{thenApply}} is "when done, fold the clothes" — a small job on the result. {{thenCompose}} is "when done, send them to the ironing shop" — that shop gives you **a new ticket**; thenCompose lets you hold one final ticket instead of a "ticket clipped inside a ticket". {{allOf}} is "tell me when all three bags are done". The executor is "who does the work": if you do not say, whoever is free does it, and if you make the building's shared staff (commonPool) wait, the whole building is stuck.

### Key terms
- **CompletableFuture (CF)**: a future you can complete from outside and chain asynchronous processing steps onto.
- **map / flatMap**: map turns T into R; flatMap turns T into a "box containing R" and then unwraps one level.
- **Callback / stage**: one step in the chain that runs when the previous step completes.
- **commonPool**: a ForkJoinPool shared by the whole JVM, default parallelism = number of cores - 1.
- **CompletionException**: the exception that wraps the original error as it travels through a CF chain or when you call {{join()}}.
- **Executor**: the component that decides which thread runs a task.
- **Fail-fast**: stop at the first error instead of waiting for everything.

### thenApply vs thenCompose

~~~java
CompletableFuture<HttpResp> resp = client.callAsync(url);

// map value -> value
CompletableFuture<Dto> dto = resp.thenApply(Dto::of);

// flatMap: the next step is async (returns a CF)
CompletableFuture<Detail> d = resp.thenCompose(r -> fetchAsync(r.id));

// if you use thenApply(r -> fetchAsync(r.id)): you get CF<CF<Detail>> — not what you want
~~~

Rule of thumb: if the lambda returns a plain value, use thenApply; if it returns a CompletableFuture, use thenCompose.

### allOf + collecting results
~~~java
CompletableFuture<List<Price>> all = CompletableFuture
    .allOf(c1, c2, c3)
    .thenApply(v -> List.of(c1.join(), c2.join(), c3.join()));
~~~
1. {{allOf}} returns {{CF<Void>}} — it holds no result, it only says "everything is done".
2. When allOf completes, each child CF is done, so the {{join()}} calls inside do not block.
3. If one child fails, allOf also completes exceptionally (wrapped in CompletionException) — but **only when ALL children have finished**: allOf is not fail-fast. To cancel early you must handle it yourself (for example, a failing child completes a separate "failFast" CF).

Numbers: call three price services that take 120 ms, 80 ms and 300 ms. Sequentially that is 500 ms; with supplyAsync + allOf it is about 300 ms (the slowest call).

### Exception handling
- {{exceptionally(ex -> fallback)}}: runs only on error; use it for a fallback value.
- {{handle((v, ex) -> ...)}}: always runs; use it to normalize both the success and failure paths.
- {{whenComplete((v, ex) -> ...)}}: side effect (log/metric) that keeps the original result or error.
- A chain with no error handling stays silent until someone calls {{join/get}} — if nobody does, the error "falls into the void"; add whenComplete to log.
- Timeout: Java 9+ has {{orTimeout(2, SECONDS)}} (fails with TimeoutException) and {{completeOnTimeout(fallback, 2, SECONDS)}}.

### Default executor (case by case)
1. **{{thenApply}} (not Async)**: runs on the thread that completed the previous step; if the future was already done, it runs right on the thread calling thenApply.
2. **{{thenApplyAsync(fn)}} / {{supplyAsync(fn)}} with no executor**: runs on {{ForkJoinPool.commonPool()}} (parallelism = cores - 1). That pool is shared with parallel streams and other CFs: exhausting it affects the whole JVM. (If parallelism is <= 1, for example a 1-2 vCPU container, the JDK creates a new thread per task.)
3. **{{supplyAsync(fn, ioExecutor)}}**: runs on the executor you specify — the right way for IO.
- Big pitfall: blocking code (JDBC, sync REST) inside commonPool freezes the whole pool; the classic self-deadlock: a callback in commonPool {{join()}}s a child CF that also needs to run in commonPool.

### Common mistakes
- **Using thenApply for a step that returns a CF**: symptom is a {{CF<CF<T>>}} type and having to join twice (blocking a thread). Fix: thenCompose.
- **supplyAsync without an executor for JDBC/HTTP**: symptom is parallel streams and other features slowing down, and thread dumps showing commonPool workers waiting on sockets. Fix: a dedicated, bounded IO executor.
- **Forgetting error handling**: symptom is requests "disappearing" with no log. Fix: whenComplete logging at the end of the chain, handle/exceptionally at the border.
- **join() scattered through the chain**: loses the async benefit and can deadlock. Fix: join only at the edge layer.

### One-minute spoken answer
"thenApply is map, used when the next step returns a plain value; thenCompose is flatMap, used when the next step itself returns a CompletableFuture so you avoid a future inside a future. To run several calls in parallel I supplyAsync each one, allOf them, then join each to collect the results — noting that allOf is not fail-fast. For errors, exceptionally gives a fallback, handle normalizes both branches, and whenComplete logs. The most important point is the executor: Async methods without an executor run on the commonPool shared by the whole JVM, so every IO call gets a dedicated bounded executor, and I only join at the outermost layer."

> Senior tip: my convention: then* callbacks are non-blocking only; every IO goes through supplyAsync(fn, ioExecutor) with its own executor; join/get only at the edge layer (controller, batch finish). This design avoids "CF hell" and self-inflicted commonPool deadlocks.`,
    follow: [
      'thenApply vs thenApplyAsync — which thread does the callback run on in each case?',
      'How do you set a timeout for a multi-step CF chain?'
    ]
  },
  'concurrency-006': {
    q: 'Deadlock: what are the 4 necessary conditions, how do you detect it with a thread dump, and how do you prevent it by design? How does it differ from livelock and starvation?',
    a: `**Summary:** deadlock only happens when all 4 Coffman conditions hold — mutual exclusion, hold-and-wait, no-preemption, circular wait; break any one of them and deadlock is impossible. In production you detect it with a thread dump: the JVM itself prints "Found one Java-level deadlock" along with the wait cycle. Livelock: threads are still running but make no progress because they keep yielding to and retrying each other. Starvation: some threads never get resources because others keep cutting in line.

### Quick intuition
Deadlock is two cars meeting on a one-lane bridge: each has taken half the bridge and waits for the other to back up, neither does, stuck forever. Livelock is two people meeting in a narrow corridor: both step left, then both step right... still moving but nobody gets through. Starvation is a person in a queue where "friends" keep cutting in front: the queue moves, that person just never reaches the counter.

### Key terms
- **Coffman conditions**: the 4 necessary conditions (named after Edward Coffman, 1971) for deadlock.
- **Mutual exclusion**: a resource is used by only one thread at a time.
- **Hold and wait**: holding one resource while asking for another.
- **No preemption**: nobody can take a resource away from the thread holding it.
- **Circular wait**: a closed wait chain (A waits for B, B waits for A).
- **Thread dump**: a snapshot of every thread's stack at one moment ({{jstack}}, {{jcmd Thread.print}}).
- **Lock ordering**: a convention that every code path acquires locks in the same order.
- **Open call**: calling out (callback, DB, network) while holding no lock.

### The 4 Coffman conditions
1. **Mutual exclusion** — a resource is used by one thread at a time. Why it is hard to break: locks exist precisely to do this.
2. **Hold and wait** — holding one lock while waiting for another. Break it by acquiring all needed locks at once, or by holding only one.
3. **No preemption** — a lock cannot be taken from the thread holding it. Break it with {{tryLock}} plus timeout: if the wait fails, release what you hold.
4. **Circular wait** — a cycle: A waits for B, B waits for A. Break it with lock ordering — the most durable way.

~~~text
Thread-A: holds lock(acc#1) ---- waits ----> lock(acc#2)
                ^                              |
                |                              v
Thread-B: waits lock(acc#1) <---- holds ---- lock(acc#2)
  => closed cycle: nobody releases, nobody progresses
~~~

### Detecting with a thread dump

~~~bash
jstack <pid> > dump-1.txt       # capture 2-3 times, a few seconds apart
jcmd <pid> Thread.print -l      # alternative to jstack, -l adds j.u.c lock details
~~~

~~~text
"Thread-A" waiting to lock <0x0a1b> (owned by "Thread-B")
"Thread-B" waiting to lock <0x9c2d> (owned by "Thread-A")
Found one Java-level deadlock: ...
~~~

1. Look for the line "Found one Java-level deadlock" at the end of the dump — the JVM detects the wait cycle itself.
2. Read each thread: which lock it holds ("locked <0x...>"), which lock it waits for ("waiting to lock <0x...>").
3. Map back to code through the stack trace to see which two pieces of code acquire the locks in opposite order.
- ReentrantLock is detected too because AQS records the owner. You can also check from code: {{ThreadMXBean.findDeadlockedThreads()}}.
- If the dump does not report deadlock but the service still hangs (waiting for IO, a DB lock or a pool connection): compare several dumps — a thread stuck at the same stack in every capture is a suspect.

### Prevention — break exactly 1 of the 4 conditions
- **Lock ordering**: all code locks in the same order (for example by entity id ascending) — breaks circular wait, the most durable method.
- **tryLock + timeout**: if the wait fails, release everything held and retry (with backoff) — breaks no-preemption.
- **Open calls**: do not call callbacks/DB/network while holding a lock.
- Fewer nested locks: one method, one lock; use existing concurrent structures.

~~~java
// Break circular wait: always lock the two accounts by ascending id
Account a = from, b = to;
if (a.id > b.id) { Account t = a; a = b; b = t; }
synchronized (a) { synchronized (b) { transfer(from, to, amount); } }
~~~

### Livelock & starvation
- **Livelock**: both sides retry continuously and cancel each other's actions — there is activity (high CPU) but no progress; fix with random backoff or by letting one side decide.
- **Starvation**: writers keep winning and readers starve because the lock is not fair (or the other way round); fix with a fair lock (at the cost of throughput), quotas, or an ordered queue.

| | Deadlock | Livelock | Starvation |
|---|---|---|---|
| CPU | Low | High | Normal |
| Thread state | BLOCKED/WAITING forever | RUNNABLE | Some wait a long time |
| Progress | None | None | Yes, but unfair |

### Common mistakes
- **Transferring A->B and B->A at the same time**, each locking the source account first: symptom is a few requests hanging forever under high load. Fix: lock by ascending id.
- **Calling listeners/callbacks while holding a lock**: the callback takes another lock from another module -> a hard-to-see wait cycle. Fix: copy the data out, release the lock, then call.
- **Deadlock between a JVM lock and a connection pool**: a thread holds a lock and waits for a connection, another holds a connection and waits for the lock. The dump does not report deadlock. Fix: never take a connection while holding a lock.
- **DB deadlock**: two transactions update rows in opposite order. Fix: update in a fixed primary-key order and keep transactions short.

### One-minute spoken answer
"Deadlock needs all four Coffman conditions: mutual exclusion, hold and wait, no preemption and circular wait, so breaking just one is enough. The method I use most is lock ordering, for example a money transfer always locks the smaller account id first so a wait cycle can never form; where I cannot impose an order I use tryLock with a timeout and then release and retry. In production I take two or three jstacks and the JVM prints Found one Java-level deadlock; if it hangs without reporting deadlock I look for threads stuck at the same stack across dumps. Livelock is different: threads still run, CPU is high, but nothing progresses; starvation is when the system runs but some threads never get their turn."

> Senior tip: DB deadlock is the hardest form: MySQL resolves it automatically (rolls back one transaction) but the app only sees a generic error. Enable innodb_print_all_deadlocks to log every deadlock to the error log — one app deadlock is just one of hundreds the DB logged.`,
    follow: [
      'The thread dump does not report deadlock but the service hangs — how do you investigate further?',
      'synchronized has no timeout — how do you implement "wait at most X ms"?'
    ]
  },
  'concurrency-007': {
    q: 'Virtual threads (Java 21): how do they work internally, the pinning problem, when to use or not use them, and their effect on {{ThreadLocal}} and connection pools?',
    a: `**Summary:** a virtual thread (JEP 444, final since Java 21) is a thread managed by the JVM, not by the OS. The JVM "mounts" it onto a carrier thread — a platform thread from a dedicated ForkJoinPool whose default size is about the number of CPUs. When the virtual thread hits blocking IO, the JVM saves its stack to the heap, unmounts it and hands the carrier to another virtual thread. Because it is cheap, you can run millions of tasks concurrently. Pinning: on Java 21, blocking inside a {{synchronized}} block (or inside a native call) prevents unmounting and holds the carrier; JDK 24 (JEP 491) removed this restriction for synchronized.

### Quick intuition
A platform thread is like hiring a private driver per passenger: the passenger spends 30 minutes in a restaurant and the driver waits outside the car, which is pure waste. A virtual thread is like a taxi company: when the passenger gets out to eat (waits for IO), the car goes to pick up someone else; when the passenger is done, any car can come for them. The number of cars (carriers) is only the number of CPUs, yet they serve thousands of passengers. Pinning is when the passenger tells the driver "wait for me, do not go anywhere" — on Java 21 that is when the passenger is inside a synchronized block.

### Key terms
- **Platform thread**: a traditional Java thread, mapped 1-to-1 to an OS thread, with a stack of about a megabyte.
- **Virtual thread**: a lightweight thread scheduled by the JVM, whose stack lives on the heap and grows on demand.
- **Carrier thread**: a platform thread currently "carrying" (running) a virtual thread.
- **Mount / unmount**: attach a virtual thread to a carrier to run / detach it when it has to wait.
- **Continuation**: the structure that saves the stack state so execution can pause and resume at the same spot.
- **Pinning**: the virtual thread is stuck to its carrier and cannot unmount while blocked.
- **JFR (Java Flight Recorder)**: a low-overhead tool for recording events inside the JVM.
- **ScopedValue**: a way to share immutable data within a code scope, replacing ThreadLocal (final since JDK 25).

### Mechanism (step by step)
1. **Create**: {{Thread.ofVirtual().start(task)}} or {{Executors.newVirtualThreadPerTaskExecutor()}}. It initially costs a few hundred bytes, because the stack lives on the heap as a continuation.
2. **Schedule**: the scheduler is a dedicated ForkJoinPool (not commonPool) running in FIFO mode; it mounts the virtual thread on a free carrier.
3. **Hit blocking**: the JDK's blocking points (Socket, {{Thread.sleep}}, {{java.util.concurrent}} locks, BlockingQueue...) are written so that when a virtual thread waits, the JVM copies the stack frames to the heap and unmounts. Why: the carrier is released to run another virtual thread.
4. **Wait ends**: the IO completes, the virtual thread goes back into the queue and is mounted on any carrier (possibly a different one), continuing from exactly where it stopped.
5. **New style**: one virtual thread per task, **NO pool** of virtual threads — creating a new one is cheaper than reuse.

~~~text
Carrier-1: [VT-1 runs] -> VT-1 waits on DB (unmount) -> [VT-7 runs] -> ...
Carrier-2: [VT-2 runs] -> [VT-3 runs] -> VT-1 comes back (mount) ...
Heap:      VT-1 stack lives here while waiting on the DB
=> 8 carriers serve 10,000 virtual threads that are mostly waiting on IO
~~~

Numbers: 10,000 concurrent requests, each waiting 200 ms on DB/HTTP. Platform threads: about 10,000 threads x ~1 MB stack reserve, almost certainly hitting a limit. Virtual threads: 10,000 small continuations on the heap, running on 8 carriers.

### Pinning
~~~java
synchronized (lock) {        // Java 21: blocking IO inside this block...
    api.call();              // => the virtual thread is pinned to its carrier
}                            // the carrier cannot be freed for another task
~~~
- **Java 21-23**: blocking inside synchronized (including {{Object.wait()}}) or inside a native/foreign call prevents unmounting -> the carrier is held. When many tasks hit that block, parallelism collapses to the number of carriers.
- **JDK 24+ (JEP 491)**: synchronized and Object.wait no longer pin; virtual threads unmount normally. Native and foreign calls still pin.
- **Detection**: the JFR event {{jdk.VirtualThreadPinned}} (available since Java 21, still usable in newer releases); the flag {{-Djdk.tracePinnedThreads=full}} prints the pinned stack on Java 21-23 but was removed in JDK 24.
- **On Java 21**: replacing synchronized with ReentrantLock in regions that block on IO is the number one measure; also upgrade libraries (JDBC driver, HTTP client) to versions that removed synchronized from their IO paths.

### Should / should not
- **Should**: servers with many concurrent connections using blocking IO; migrating existing blocking code without switching to reactive; fan-out calling hundreds of services per request. Spring Boot 3.2+ enables it with {{spring.threads.virtual.enabled=true}}.
- **Should not**: CPU-bound tasks (cheap threads do not create more cores); reactive code that already works well; tasks holding large state in ThreadLocal.
- Virtual threads are "cheap" but the resources underneath are not (DB pool, file descriptors, partner quotas) — that is where you need a semaphore and a rate limit.

### ThreadLocal & resource pools
- No virtual thread pooling -> ThreadLocal creates a fresh copy per task: MDC and security context are recreated for every request, GC pressure rises; large objects held in ThreadLocal multiplied by millions of tasks easily cause OOM. ScopedValue (preview in Java 21, final in JDK 25) is the replacement direction.
- The bottleneck usually shifts to the JDBC pool: 10 connections means 10 tasks run DB work in parallel and the rest wait. That is CORRECT — but you must tune the JDBC pool within what the DB can handle and look at the details; "increase the pool infinitely" is not the answer.

### Common mistakes
- **Pooling virtual threads** (putting them in a FixedThreadPool or reusing them): you lose the benefit and still leak ThreadLocal between tasks. Fix: a fresh virtual thread per task; use a Semaphore as the limit.
- **No limits after enabling virtual threads**: symptom is the DB reporting no connections left, the partner returning 429, Hikari timing out en masse. Fix: a Semaphore per dependency.
- **Pinning on Java 21**: symptom is unusually low throughput and thread dumps showing carriers all stuck inside synchronized. Fix: JFR VirtualThreadPinned, switch to ReentrantLock or upgrade to JDK 24+.
- **Using virtual threads for heavy computation**: it is not faster and slows IO tasks because carriers are occupied. Fix: a separate CPU pool.

### One-minute spoken answer
"A virtual thread is a lightweight thread managed by the JVM: it is mounted on a carrier thread, and when it hits blocking IO the JVM saves the stack to the heap, unmounts it and gives the carrier back for other work. Thanks to that I can write ordinary blocking code and still serve tens of thousands of requests with a few carriers. The thing to watch on Java 21 is pinning: blocking inside synchronized or a native call holds the carrier; I detect it with the JFR VirtualThreadPinned event and replace synchronized with ReentrantLock; since JDK 24 synchronized no longer pins. Virtual threads fit IO-bound work, do not help CPU-bound work, should not be pooled, and resources behind them must still be limited with a semaphore or connection pool."

> Senior tip: benchmark before trusting virtual threads: raise concurrency from 100 to 10k, measure p99 and the connection pool; usually p99 depends far more on the JDBC pool and the DB limit than on the thread count. The fix then is tuning the JDBC pool (within what the DB can take) and putting a semaphore in front of each dependency, not adding threads.`,
    follow: [
      'How do you detect pinning of a Java 21 service in production?',
      'For a fan-out of 1000 calls per request, should you use virtual threads or a reactive stack?'
    ]
  },
  'concurrency-008': {
    q: 'When do you use {{ThreadLocal}}? Why does it cause memory leaks in thread pools, and how do you handle it?',
    a: `**Summary:** {{ThreadLocal}} gives each thread its own copy of data, which is useful for carrying request context without passing a parameter through every method: user context, transaction context, trace id in MDC... In a thread pool, threads live a very long time, so values you set are not released unless you call {{remove()}} — a heap leak; worse, the next task may read the previous task's value (a security bug).

### Quick intuition
Each thread has its own "drawer". ThreadLocal is a label on the drawer: the same label "currentUser" but each thread opens it and sees its own things. The problem is that in a thread pool threads are shift workers sharing a desk: if the previous shift did not clean the drawer, the next shift opens it and finds the old customer's papers — both taking space (memory leak) and exposing information (data leak). Golden rule: whoever puts things in the drawer must clean it out before finishing the job.

### Key terms
- **ThreadLocalMap**: a hash table inside each Thread object that stores that thread's ThreadLocal values.
- **WeakReference (weak reference)**: a reference that does not keep an object alive; the GC may collect the object if only weak references remain.
- **Strong reference**: an ordinary reference that keeps the object alive.
- **Stale entry**: an entry whose key has been GC'd (null) but whose value is still there.
- **MDC (Mapped Diagnostic Context)**: a map in logging (SLF4J/Logback) that attaches requestId/userId to every log line, implemented with ThreadLocal.
- **ClassLoader leak**: an object still referenced so that the webapp's classloader cannot be collected on redeploy.
- **Metaspace**: the memory area outside the heap that holds class metadata.
- **ScopedValue**: immutable data attached to a code scope that expires automatically when leaving the scope.

### Mechanism (step by step)
1. Each Thread has a {{threadLocals}} field of type ThreadLocalMap. Why inside Thread: reads/writes touch only the current thread's data, so no lock is needed.
2. {{tl.set(v)}}: take the current thread's map and write an entry whose key is a **weak reference** to the ThreadLocal object and whose value is a **strong reference** to v.
3. {{tl.get()}}: look up the current thread's map by key; if absent, call {{initialValue()}}.
4. When the ThreadLocal object is no longer used, the key is GC'd to null but the map still strongly holds the value. The value is cleaned **lazily**, only when the map happens to scan that entry during a later get/set.
5. Pool threads never die -> the map is never discarded -> the value lives forever. {{remove()}} is the only reliably active cleanup.

~~~text
Thread "http-nio-8080-exec-7" (lives for the whole app)
  threadLocals: ThreadLocalMap
    [ key: weak -> ThreadLocal(userCtx) | value: STRONG -> UserContext(user=A, 2 MB) ]
Request A finishes, remove() forgotten -> Request B runs on the same thread
  -> get() returns A UserContext   (data leak)
  -> 200 threads x 2 MB = 400 MB dead in Old Gen (memory leak)
~~~

### Leaks in the pool
1. A task forgets remove: the value stays in the thread for hours or days, occupying Old Gen.
2. **Data leak between requests**: the next task reads the previous task's MDC requestId/userId — a serious security bug that cannot be debugged from a stack trace.
3. A value referencing a webapp class (Tomcat) => WebappClassLoader cannot be released on redeploy -> Metaspace leak.
4. Static cache + ThreadLocal = data duplicated per thread, heap footprint multiplied.

### The right way

~~~java
try {
    MDC.put("requestId", reqId);
    chain.doFilter(req, resp);
} finally {
    MDC.clear();          // always clean in finally, even on exception
}
~~~

- Convention: set - try/finally - remove within the same call stack; put set/remove in a filter/interceptor, not in individual methods.
- Mutable SimpleDateFormat: wrapping it in {{ThreadLocal.withInitial}} is a temporary fix; Java 17/21 should use the immutable {{DateTimeFormatter}} — done, no ThreadLocal needed.
- Passing context to another thread (executor, @Async): ThreadLocal does **not** follow automatically; use Spring's TaskDecorator or Micrometer Context Propagation to copy it in and clean it out.
- ScopedValue (preview Java 21-24, final in JDK 25 via JEP 506): the value is tied to a scope so it expires automatically, with no remove to forget — a good fit for virtual threads.

### Common mistakes
- **Forgetting remove in a hand-written filter**: symptom is logs occasionally carrying someone else's userId, or a user seeing another user's data. Fix: always clean in finally.
- **Reading ThreadLocal in code running on @Async/CompletableFuture**: symptom is a null value (different thread). Fix: TaskDecorator/context propagation.
- **InheritableThreadLocal with a pool**: the value is copied only when a thread is **created**, so the pool's old threads keep the first request's value. Fix: do not use InheritableThreadLocal with pools.
- **A ThreadLocal holding a large object with virtual threads**: one copy per task, hundreds of thousands of copies for hundreds of thousands of tasks. Fix: keep ThreadLocals small, or move to ScopedValue.

### One-minute spoken answer
"ThreadLocal gives each thread its own copy of a value; I use it for request context such as MDC or the security context. Internally every Thread has a ThreadLocalMap whose key is a weak reference to the ThreadLocal and whose value is a strong reference. In a thread pool threads live for the whole app, so without remove the value stays forever: it leaks heap, it can let the next request read the previous request's data, and on Tomcat it also leaks the classloader on redeploy. So I always set in the filter and remove in finally at the same place. With Java 21 and virtual threads I keep ThreadLocals very small and move towards ScopedValue."

> Senior tip: a "user A sees user B's data" incident stuck with me: MDC held the previous request's userId in the thread, and a later filter read MDC without setting it — 1 in 10k requests hit it. After that, our team's reviews require {{set(}} and {{remove}} to appear together in the same method.`,
    follow: [
      'ThreadLocalMap uses a WeakReference for the key — why does the value still leak?',
      'How does InheritableThreadLocal behave with virtual threads?'
    ]
  },
  'concurrency-009': {
    q: 'How does CAS work, how does {{AtomicInteger}} use it, what is the ABA problem, and how does {{LongAdder}} differ from {{AtomicLong}}?',
    a: `**Summary:** CAS (compare-and-swap) is a CPU atomic instruction: "write the new value only if the current value is still exactly what I saw" — the foundation of lock-free programming. {{AtomicInteger}} uses a CAS loop for {{incrementAndGet}}: try, and on failure re-read and try again. ABA: a value goes A -> B -> A, so CAS thinks nothing changed; fix it with {{AtomicStampedReference}} (which carries a version number). {{LongAdder}} fights the hot spot by splitting the counter into several cells and summing them on read — much higher throughput under heavy contention, at the cost that {{sum()}} is only approximate while other threads are updating.

### Quick intuition
CAS is like editing a wiki page: you open version 5, edit, click save; the system accepts only if the page is still version 5. If someone saved before you, you reload and redo the edit. Nobody has to "lock" the page. ABA is when someone edits the page and then reverts it to the exact old content — you look at the content and think nobody touched it. LongAdder is like a cashier office with several bill counters: each cashier counts into their own machine and you add them up at the end of the day, instead of a dozen people fighting over one machine.

### Key terms
- **CAS (compare-and-swap)**: a compare-then-write instruction that is atomic at the hardware level.
- **Lock-free**: an algorithm that guarantees at least one thread makes progress, without using locks.
- **CAS loop / spin**: looping try-CAS until it succeeds.
- **ABA problem**: the value changes and then changes back, and CAS cannot detect it.
- **Stamp / version**: a counter incremented on every change, carried alongside the value to detect ABA.
- **Cache line**: a 64-byte block that the CPU keeps coherent between cores.
- **Cache line bouncing**: one cache line bouncing between cores because many cores write to it.
- **AQS**: the JDK synchronization framework (basis of ReentrantLock, Semaphore) that uses CAS to change its state.

### CAS in the JVM (step by step)

~~~java
public final int incrementAndGet() {
    int cur;
    do {
        cur = get();                            // 1. read the current value (volatile read)
    } while (!compareAndSet(cur, cur + 1));     // 2. CAS; failure => another thread just changed it => retry
    return cur + 1;
}
~~~
(This is the idea; the real JDK calls {{Unsafe.getAndAddInt}} directly, which on x86 usually becomes one {{lock xadd}} instruction.)

1. Read the current value of the volatile field. Why volatile: to always see the latest value and to give CAS happens-before meaning.
2. Compute the new value in a local variable.
3. Call CAS: the CPU locks the cache line for an instant, compares, and writes if it matches.
4. Failure means another thread won -> go back to step 1. Nobody "sleeps", so there is no context switch.

- CAS compiles to {{lock cmpxchg}} on x86, or to an ldxr/stxr pair (or the ARMv8.1 LSE CAS instruction) on ARM — hardware atomic, no mutex needed.
- Many JDK structures build on CAS: AtomicXxx, AQS (basis of ReentrantLock/Semaphore), ConcurrentHashMap when inserting into an empty bucket...

### The ABA problem
CAS only checks "equal or not", it does not know history. The classic bug on a lock-free stack:

~~~text
Thread 1: reads head = A (A.next = B), plans CAS head: A -> B
Thread 2: pop A, pop B, push node A back   (head: A -> B -> A)
Thread 1: CAS(head, A, B) SUCCEEDS — but B was popped, the stack is corrupted
~~~

How to fix:
- {{AtomicStampedReference}}: CAS on the pair (reference, stamp); the stamp increases on every change, so A(stamp 1) differs from A(stamp 3).
- {{AtomicMarkableReference}}: a variant with only a single mark bit.
- In Java, the GC keeps an object alive while references exist, so ABA is rarer than in C/C++ (an address cannot be "reused" while someone still holds it); ABA mostly appears with object pools, node reuse, off-heap/direct buffers, or when doing CAS on a **numeric value** (balance 100 -> 50 -> 100).
- Other options: attach a version number to the record (like optimistic locking in a DB), or go back to a lock for the complex parts.

### LongAdder vs AtomicLong

| | AtomicLong | LongAdder |
|---|---|---|
| Mechanism | 1 volatile long + CAS | base + array of Cells, each thread picks a cell by hash |
| High contention | CAS keeps failing, CPU burns in the loop | each thread CASes its own cell, few failures |
| sum() | exact at a point in time | approximate while other threads update |
| API | incrementAndGet, compareAndSet... | increment, add, sum, sumThenReset (no CAS) |
| Memory | 8 bytes | larger (cells are padded with @Contended) |
| Use when | need an exact value at every moment, generate IDs | count metrics, high throughput |

How LongAdder works: with no contention it CASes {{base}}; when that CAS fails it creates a Cell array and each thread adds to its own cell; the array can grow up to the number of CPUs. Cells are padded so they sit on different cache lines, avoiding cache line bouncing.

Numbers (order of magnitude, machine dependent): 16 threads incrementing one counter, AtomicLong can be several to tens of times slower than LongAdder because most CAS attempts fail; with 1 thread the two are equivalent.

### Common mistakes
- **Check-then-act with an Atomic**: {{if (a.get() > 0) a.decrementAndGet()}} still races. Fix: a conditional CAS loop, or {{updateAndGet}}/{{accumulateAndGet}}.
- **Using LongAdder to generate IDs/sequence numbers**: it has no incrementAndGet, so you cannot obtain a unique value. Fix: AtomicLong.
- **Passing a function with side effects to updateAndGet**: the function may be called several times when CAS fails. Fix: a pure function, no logging or API calls inside.
- **A hand-written CAS loop on hot data**: symptom is 100% CPU with low throughput. Fix: LongAdder, or reduce contention by sharding the data.

### One-minute spoken answer
"CAS is a CPU atomic instruction: write the new value only if the current value is still what I read. AtomicInteger uses it in a loop: read, compute, CAS, retry on failure, so no thread ever sleeps. The first limitation is ABA: if the value changes and changes back, CAS cannot tell; I handle it with AtomicStampedReference or a version number. The second is that under high contention many threads CAS the same cache line and keep failing; LongAdder solves it by splitting into many cells and summing on read. So for metrics I use LongAdder, and for values that must be exact at every moment, like ID generation, I use AtomicLong."

> Senior tip: my code review rule: metric counters -> LongAdder; values that must be exact at every moment (token bucket rate limiter, ID generation) -> AtomicLong. In async-profiler, if the AtomicLong CAS loop shows up as CPU under high contention, that is a place LongAdder can easily replace it.`,
    follow: [
      'CAS + volatility: why must the field inside {{AtomicInteger}} be volatile?',
      'On a machine with a tracing GC that keeps references alive, is ABA still a real problem?'
    ]
  },
  'concurrency-010': {
    q: 'Double-checked locking for a singleton: write the correct code and explain why {{volatile}} is mandatory.',
    a: `**Summary:** double-checked locking (DCL) enters {{synchronized}} only on the first call; later calls read the field without a lock. If the instance field is not {{volatile}}, the JIT/CPU can make another thread see the reference assigned **before** the constructor finishes; that thread sees a non-null instance but uses a "half-built" object (fields not initialized). {{volatile}} forbids this reordering thanks to the happens-before edge between the write and the read of the field.

### Quick intuition
Imagine building a house: the correct order is to finish the house and then hang the house number. But the construction crew (JIT/CPU) may hang the number early to go faster, as long as **they themselves** are not affected. The postman (another thread) sees the number and walks in — into a house without a floor. {{volatile}} is the rule "you may only hang the number when the house is finished, and the postman must look at the official number", so whoever sees the number knows the house is complete.

### Key terms
- **Singleton**: a class with exactly one instance in the application.
- **Lazy initialization**: create the object only when someone first uses it, not eagerly.
- **Double-checked locking (DCL)**: check for null twice, once outside the lock (fast) and once inside the lock (safe).
- **Reordering**: the JIT/CPU changes instruction order when it sees no effect on the current thread.
- **Happens-before**: the JMM rule that guarantees ordering and visibility between threads.
- **Holder idiom**: use a static nested class so the JVM initializes it lazily and thread-safely.
- **Class initialization lock**: the lock the JVM uses to make sure a class's static initialization runs exactly once.

### Correct code

~~~java
public class Db {
    private static volatile Db instance;   // volatile MANDATORY

    public static Db getInstance() {
        Db r = instance;                   // read the volatile field once for the hot path
        if (r == null) {                   // check 1: no lock
            synchronized (Db.class) {
                r = instance;              // check 2: read again inside the lock
                if (r == null) instance = r = new Db();
            }
        }
        return r;
    }
}
~~~
The local variable {{r}} makes the hot path read the volatile field only once (a volatile read is slightly more expensive than a local read).

### Why missing volatile is wrong (step by step)
1. {{new Db()}} consists of 3 actions: (a) allocate memory, fields default to 0/null; (b) run the constructor; (c) assign the reference to the {{instance}} field.
2. In thread A, the JIT only has to keep the result **from A's point of view** unchanged, so it may let step (c) become visible to other threads before (b).
3. Thread B enters check 1 (no lock), sees {{instance != null}}, skips synchronized and returns the object — but the constructor has not finished, fields are still null/0.
4. B uses a broken object: NullPointerException or wrong configuration, happening rarely and depending on CPU/JIT/scheduler, almost impossible to reproduce.
5. With {{volatile}}: the volatile write (c) cannot be moved before the writes inside the constructor, and when thread B reads the volatile field and sees the reference, it is guaranteed to see every initialized field.

~~~text
Thread A (no volatile)          Thread B
allocate Db@1 (url = null)
instance = Db@1   <- visible too early
                                instance != null -> return Db@1
                                Db@1.url.length()  -> NPE!
run constructor: url = "jdbc:..."
~~~

### Alternatives (recommended over DCL)
- **Holder idiom** — leverages the JVM class initialization lock, no volatile needed:

~~~java
private static class Holder { static final Db INSTANCE = new Db(); }
public static Db getInstance() { return Holder.INSTANCE; }  // lazy + thread-safe
~~~
Why it works: the {{Holder}} class is initialized only when {{Holder.INSTANCE}} is first read; the JVM guarantees initialization runs exactly once and the result is published safely to every thread.

- **{{enum}} singleton**: gets reflection and serialization protection for free (recommended by Effective Java).
- In a Spring app: the container's singleton bean already has the right lifecycle/scope — do not write it by hand.

### Common mistakes
- **Forgetting volatile**: symptom is an NPE that "cannot happen" showing up once in a while, especially on ARM. Fix: volatile, or the holder idiom.
- **Checking only once outside the lock** (dropping check 2): two threads both see null, both wait for the lock, and each creates an instance. Fix: always check again inside the lock.
- **synchronizing the whole getInstance() method**: correct but every call takes the lock. Fix: the holder idiom gives both laziness and speed.
- **Heavy constructor (DB/network call) in the holder**: one failure breaks the class until restart (ExceptionInInitializerError then NoClassDefFoundError). Fix: no IO during static initialization.

### One-minute spoken answer
"Double-checked locking checks for null outside the lock so the hot path does not lock, then checks again inside synchronized so only one instance is created. The field must be volatile because new does three things: allocate, run the constructor and assign the reference, and the JIT or CPU may let another thread see the assignment before the constructor finishes; that thread skips the lock and uses a half-built object. volatile creates happens-before between the write and the read, so whoever sees the reference also sees a fully initialized object. Still, in practice I prefer the holder idiom or an enum because the JVM handles thread safety itself, and in Spring I let the container manage singletons."

> Senior tip: I treat a "hand-written DCL singleton" as legacy code that needs careful review: the two usual bug groups are (1) forgetting volatile — the "half-built object" bug reaches production and cannot be reproduced, and (2) the holder being loaded by two different classloaders in an application server, so in reality there are two "singletons".`,
    follow: [
      'How can the JIT reorder the three steps of {{new Foo()}}?',
      'How does the holder idiom behave when the class is loaded twice by two classloaders?'
    ]
  },
  'concurrency-011': {
    q: 'Compare the use cases of {{CountDownLatch}}, {{CyclicBarrier}}, {{Semaphore}} and {{Phaser}}: when do you choose each?',
    a: `**Summary:** {{CountDownLatch}} = wait for N jobs to finish (single use). {{CyclicBarrier}} = N workers wait for each other at a rendezvous point, then move to the next phase, reusable. {{Semaphore}} = limit how many threads may enter at the same time (a concurrency/resource limit — not a rate limit per unit of time). {{Phaser}} = a multi-phase barrier with a flexible number of parties.

### Quick intuition
- **CountDownLatch** is a countdown rocket: each subsystem signals when its check is done, at zero the rocket launches; once launched it does not count again.
- **CyclicBarrier** is a hiking group meeting at each rest stop: early arrivals wait, and when everyone is there they continue to the next leg; the next stop works the same way.
- **Semaphore** is a parking lot with 5 spaces: when it is full the next car waits at the barrier, and a car leaving lets another one in.
- **Phaser** is a hiking group where members can join or leave at any stop.

### Key terms
- **Party**: one participant in a barrier/phaser.
- **Permit**: one "entry ticket" of a Semaphore; acquire takes a ticket, release returns it.
- **Barrier action**: code that runs once when all parties reach the rendezvous point (before the group continues).
- **Broken barrier**: the state of a CyclicBarrier after a party is interrupted or times out, or the barrier action throws.
- **Fan-out / fan-in**: spread work across many threads / gather the results back.
- **Rate limit**: cap the number of calls per unit of time (for example 100 calls/second) — different from capping how many run at once.
- **AQS**: the JDK synchronization framework that CountDownLatch and Semaphore are built on.

### How each one works
1. **CountDownLatch(n)**: internally a counter (the AQS state). {{countDown()}} decrements by one; {{await()}} blocks until it reaches zero. Once at zero, every later await returns immediately. Why single use: there is no operation to increment it again; the design favors simplicity and speed.
2. **CyclicBarrier(n, action)**: each thread calling {{await()}} waits; the n-th thread runs the action, wakes everyone, and the barrier resets itself for the next phase. Why "cyclic": it can be reused for many rounds.
3. **Semaphore(k)**: has k permits. {{acquire()}} takes one (waiting if none are left), {{release()}} returns it. There is no notion of "owner": a different thread may release — unlike a lock.
4. **Phaser**: {{register()}}/{{arriveAndDeregister()}} change the number of parties mid-flight; {{arriveAndAwaitAdvance()}} is like the barrier's await; there is a phase number.

~~~text
CountDownLatch(3):  T1 done(2) T2 done(1) T3 done(0) -> main.await() returns
CyclicBarrier(3):   W1 waits.. W2 waits.. W3 arrives -> action -> all 3 enter phase 2 -> repeat
Semaphore(5):       [5 calls running] the 6th waits -> one call finishes, release -> call 6 enters
~~~

### Sample code for each

~~~java
// CountDownLatch: fan-out, wait for all then aggregate
CountDownLatch done = new CountDownLatch(tasks.size());
for (var t : tasks) executor.submit(() -> {
    try { process(t); } finally { done.countDown(); }   // remember finally
});
boolean ok = done.await(30, TimeUnit.SECONDS);          // false if it times out

// CyclicBarrier: workers wait for each other each phase, with a barrier action
CyclicBarrier barrier = new CyclicBarrier(N, () -> flushStage());

// Semaphore: at most 5 concurrent calls to an external API
Semaphore gate = new Semaphore(5);
gate.acquire();
try { api.call(); } finally { gate.release(); }
~~~

### When to choose which

| Situation | Choice |
|---|---|
| Wait for N tasks to finish, then aggregate | CountDownLatch |
| Workers wait for each other per phase, repeated phases | CyclicBarrier |
| Limit concurrent access to an external resource | Semaphore |
| Number of parties changes between phases | Phaser |
| Async fan-out/fan-in that returns data | CompletableFuture.allOf |
| Limit the number of calls per second | A rate limiter (Resilience4j, Guava), not Semaphore |

A number that shows the difference between Semaphore and rate limiting: Semaphore(5) with 100 ms per call allows about 50 calls/second; if calls take only 10 ms it becomes 500 calls/second — Semaphore does not limit per unit of time.

### Common mistakes
- **Forgetting countDown on the error path**: symptom is await hanging forever when a task throws. Fix: countDown in finally, always use await with a timeout and check the return value.
- **Semaphore releasing more than it acquires** (release in finally even though acquire failed, or releasing twice): the permit count grows and the limit stops working. Fix: acquire **before** try, release in finally; with tryAcquire only release when it returned true.
- **A broken CyclicBarrier**: one thread throwing/timing out makes every waiting thread receive BrokenBarrierException. Fix: design reset/retry, or switch to Phaser.
- **Using CountDownLatch for multiple rounds**: the latch does not reset; the second round's await returns immediately. Fix: CyclicBarrier, or a new latch per round.

### One-minute spoken answer
"These four are all synchronizers in java.util.concurrent but they solve four different problems. CountDownLatch waits for N jobs to finish, single use — I use it for fan-out then wait, always countDown in finally and await with a timeout. CyclicBarrier is a group of workers waiting for each other at each phase, reusable, with a barrier action, but one failing thread breaks the whole barrier. Semaphore limits how many jobs run at once, for example at most 5 calls to a partner; it is not a per-second rate limit. Phaser is for many phases with a changing number of members. In practice most needs are just CountDownLatch or CompletableFuture.allOf."

> Senior tip: 90% of real-world fan-out needs are just "wait for N jobs" — CountDownLatch + await with timeout is the cleanest pattern. I used Phaser exactly once: a pipeline with several stages where the number of workers changed when each stage ended — powerful, but not worth using by default.`,
    follow: [
      'How does a CyclicBarrier become "broken", and how do you handle it?',
      'When can CompletableFuture.allOf replace CountDownLatch?'
    ]
  },
  'concurrency-012': {
    q: 'Design a system to process 1 million records in parallel with rate limits (external API) and no data loss. How do you build the architecture?',
    a: `**Summary:** I split the problem into 3 layers: (1) a source with a durable checkpoint (Kafka, or a cursor column in a table) so that after a crash the job continues from where it stopped; (2) controlled fan-out: a bounded queue, a concurrency cap and a rate limiter that matches the external API quota; (3) an idempotent sink plus a DLQ, so at-least-once delivery still produces an exactly-once effect. Never use an unbounded queue, and never infer the quota from the number of workers.

### Quick intuition
Imagine you must deliver 1 million letters through a post office that accepts only 100 letters per second. You need: a notebook recording "already delivered up to letter number N" (checkpoint) so after a power cut you know where to continue; a doorman counting exactly 100 letters per second (rate limiter) instead of letting 250 clerks rush the counter; a unique code on each letter so the post office can drop duplicates (idempotent); and a basket of "returned letters" (DLQ) that you inspect later instead of throwing failures away.

### Key terms
- **Checkpoint / offset**: the position already processed, stored durably so the job can resume after an incident.
- **Rate limit / quota**: the maximum number of requests a partner allows within one unit of time.
- **Token bucket**: a rate-limit algorithm — a "bucket" is refilled with tokens at a steady rate, and each request takes one token.
- **Idempotent**: running the same operation many times gives the same result as running it once.
- **At-least-once**: every record is processed at least once (duplicates are possible) and none is lost.
- **DLQ (Dead Letter Queue)**: where records that failed after several retries wait, so they can be inspected and replayed.
- **Outbox pattern**: write the event into an outbox table inside the same business transaction; a separate process sends it afterwards.
- **Jitter**: a random extra delay so that clients do not all retry at the same instant.
- **Little's law**: concurrency = throughput × latency — the number of requests in flight equals requests per second multiplied by how long each one takes.

### Overall architecture

~~~text
Kafka topic (or a job table with a cursor)
  -> Ingest worker: fetch a small batch (e.g. 500), advance the checkpoint only after the batch is acked by the sink
  -> BoundedQueue (capacity ~ 2x concurrency)
  -> Worker pool (virtual threads): one worker handles one record
  -> Semaphore (concurrency) + Rate limiter (token bucket per API quota) before every external call
  -> Sink writes idempotently by key; failures go to the DLQ
  -> Checkpoint store: advance after the whole batch is committed
~~~

### 1) Source — a durable checkpoint
1. **Kafka**: the broker stores the offset and it can be replayed; a crash mid-way means the consumer re-reads from the last uncommitted offset, so no data is lost (but records may be processed twice, which is why step 3 must be idempotent).
2. **Hand-written batch job**: store the cursor (last processed id) in a table and read with {{WHERE id > :cursor ORDER BY id LIMIT 500}}.
3. **Commit the checkpoint after** the sink acks the whole batch, not right after reading. Why: if you commit at read time and crash before writing, those records are skipped forever — silent data loss.

### 2) Concurrency + rate limit
1. **Measure the real quota** of the external API (documentation, 429/Retry-After headers); never guess. Implement it with a token bucket (Resilience4j RateLimiter or Guava RateLimiter).
2. **Cap concurrency with Little's law**: concurrency ≈ quota (requests per second) × latency. Example: 100 rps × 200 ms = 20 calls in flight, so {{Semaphore(20)}}. Why both are needed: the rate limiter caps calls per second, while the semaphore caps how many calls stay stuck at the same time when the partner slows down.
3. **429 / Retry-After**: the worker honours Retry-After and adds jitter so the whole cluster does not retry at the same moment (a thundering herd); after 3 retries push the record to a retry topic/DLQ.

~~~text
// Example: 1,000,000 records, quota 100 rps, latency 200 ms
// => 20 calls in parallel; the rate limiter caps bursts at 100 rps
// minimum time: 1,000,000 / 100 = 10,000 s ~ 2.8 hours (this is the hard ceiling)
// a record that hits 429: wait Retry-After + jitter, max 3 times then go to the DLQ
~~~

### 3) No data loss
- **Idempotent sink** by business key (upsert / unique constraint / event id) so retries are safe.
- **DLQ** for records that fail N retries, with an alert; having no DLQ is the quiet way to lose data.
- **Outbox pattern** when the DB and the external system must stay atomic: write the outbox row in the same business transaction and let a background relay send it; after a crash the outbox is replayed.
- **Planned shutdown**: stop accepting new work, wait for the queue to drain (with a timeout), flush the last batch, advance the checkpoint, and only then stop the process.

### 4) Operations
- Metrics: queue depth, in-flight count, actual rps versus quota, DLQ count, batch latency p99; alert when the DLQ keeps growing.
- Load-test to destruction: burst 10x the quota, kill -9 in the middle of a batch — the checkpoint must resume at exactly the right place.
- When the quota is a hard ceiling (the 2.8 hours above against an SLA of 1 hour): switch to batching if the partner supports it — one call with 500 records instead of 500 separate calls — or negotiate a higher quota.

### Common mistakes
- **"Rate limiting" with a sleep inside every worker**: symptom is actual rps = workers × (1/sleep), over quota, 429 storms. Fix: one shared rate limiter, with actual rps measured on a dashboard.
- **Committing the checkpoint before the write finishes**: symptom is missing records after every deploy or crash. Fix: commit only after the sink acks.
- **A non-idempotent sink**: symptom is duplicated rows (money sent twice, two emails) after every replay. Fix: unique key/upsert, store processed event ids.
- **Retrying immediately without jitter**: the whole cluster retries together and the partner is even more overloaded. Fix: exponential backoff with jitter, respect Retry-After.

### One-minute spoken answer
"I split it into three layers. The source must have a durable checkpoint, Kafka offsets or a cursor in a table, and I advance the checkpoint only after the whole batch is written, so a crash simply resumes at the right place. In the middle sits controlled fan-out: a bounded queue, a semaphore that caps in-flight calls by Little's law, and one token-bucket rate limiter set to the partner quota; on 429 I retry following Retry-After with jitter, and after three attempts the record goes to the DLQ. The output writes idempotently by business key, so at-least-once still gives an exactly-once result. Finally I watch actual rps versus quota and the DLQ, and in a test I kill a batch mid-way to prove nothing is lost."

> Senior tip: an expensive mistake I saw: "each worker sleeps 100 ms" with 250 workers, believing that was a rate limit — the result was 2,500 rps, the API fired 429s in waves, the checkpoint stopped advancing, and we lost 8 hours replaying one batch. A rate limit must be measurable (actual rps versus quota on a dashboard), not enforced by a sleep in code.`,
    follow: [
      'Why is the checkpoint after the full batch rather than after each record?',
      '429/Retry-After: should the worker retry in the same thread or push to a separate topic? Why?'
    ]
  },
  'concurrency-013': {
    q: 'Structured concurrency (Java 21 preview): what is the core idea, what problem of CompletableFuture does it solve, and where does ScopedValue replace ThreadLocal?',
    a: `**Summary:** structured concurrency (JEP 453, preview since Java 21) treats a group of parallel tasks as **one bounded block**: when execution leaves the block every subtask must have finished; if one subtask fails, the block cancels the remaining subtasks and reports the error. It fixes the weak spots of CompletableFuture: no cascade cancellation, "orphan" tasks that outlive the request, hard-to-read stack traces. ScopedValue (JEP 446, preview in Java 21, final in JDK 25) is immutable data bound to a block of code and replaces ThreadLocal for per-request context: it expires by itself, cannot leak when a pool reuses threads, and subtasks inherit it cheaply.

### Quick intuition
Think of a lead who hands three tasks to three people and then waits in the meeting room. Structured concurrency is the rule: "nobody leaves the meeting room while work is unfinished; if one person reports a failure, the lead tells the other two to stop". With CompletableFuture each person walks off on their own, the lead goes home, and they keep working with nobody telling them to stop. ScopedValue is like a visitor badge that only works inside the building: step outside and the badge expires by itself — unlike ThreadLocal, which is a key you had to remember to give back.

### Key terms
- **Structured concurrency**: the principle that a child task's lifetime is contained inside the code block that created it.
- **StructuredTaskScope**: the JDK API that implements the principle (fork, join, cancel).
- **Subtask / fork**: a child task created inside the scope.
- **Cancellation propagation**: when one task fails, related tasks are cancelled automatically.
- **Orphan task**: a task still running after the caller has already returned or failed.
- **Preview feature**: not-yet-final Java API; requires {{--enable-preview}} and may change between releases.
- **ScopedValue**: an immutable value that is "bound" for the duration of a {{run}}/{{call}} invocation.
- **Rebind**: bind a different value for a smaller nested scope.
- **Virtual thread**: a thread managed by the JVM rather than the OS, cheap enough to create one per task (see concurrency-007).

### Problems with CompletableFuture
1. **Callbacks run on a thread you do not control** (an executor/callback thread) — the stack trace contains mostly framework frames, so it is hard to see who called what.
2. **No cascade cancellation**: if one task fails, the others keep running and burn resources; you must write cancellation logic yourself.
3. **Orphan tasks** live longer than the request (no lifetime bound) — hard to reason about, and they may write data after the request already returned an error.
4. **No scope block** — there is no single point that says "by here everything must be finished".

~~~text
CompletableFuture:                    StructuredTaskScope:
request --+- findUser   (fails!)      try (scope) {
           +- fetchOrder (keeps         fork findUser   (fails!)
           |             running)       fork fetchOrder -> cancelled
           +- return the error          join -> throws the error
fetchOrder keeps running after        } // leaving the block: no subtask alive
the request already returned
(orphan task)
~~~

### StructuredTaskScope (API in Java 21-24)

~~~java
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    var u = scope.fork(() -> findUser(id));     // each fork runs in a new virtual thread
    var o = scope.fork(() -> fetchOrder(id));

    scope.join().throwIfFailed();   // one fails => cancel the rest, throw the error
    return new Profile(u.get(), o.get());
}   // leaving the block: no subtask is still alive
~~~

1. {{fork}} starts a subtask (on a new virtual thread by default).
2. {{join}} waits until every subtask has finished **or** the policy decides to stop.
3. The ShutdownOnFailure policy: the first failing subtask shuts the scope down, and the remaining subtasks are interrupted.
4. {{throwIfFailed()}} rethrows the original failure; when nothing failed, {{get()}} returns each result.
5. try-with-resources closes the scope and guarantees no child thread is left alive.

- Two built-in policies: ShutdownOnFailure (one failure cancels everything) and ShutdownOnSuccess (one success is enough, cancel the rest — suited to "race several replicas for the fastest answer").
- Cancellation works through interrupt, so a subtask must react to interrupts (JDK I/O on virtual threads does).

### ScopedValues

~~~java
static final ScopedValue<User> CURRENT_USER = ScopedValue.newInstance();

ScopedValue.where(CURRENT_USER, user)
           .run(() -> handleRequest(request));   // the value exists only inside run()

// deep inside: CURRENT_USER.get() returns the user; outside run() there is no binding
~~~

- There is no set/remove to forget: the value lives exactly for the scope and then disappears; nothing leaks between tasks in a pool.
- Immutable; you can only rebind it for a smaller nested scope.
- A subtask forked inside StructuredTaskScope inherits the binding cheaply (shared, not copied), with no per-thread entry like ThreadLocal/InheritableThreadLocal.
- Versions: ScopedValue was preview in 21-24 and final in JDK 25 (JEP 506); structured concurrency is still preview in JDK 25 with a changed API ({{StructuredTaskScope.open()}} plus a Joiner instead of ShutdownOnFailure/ShutdownOnSuccess). On JDK 21 production without preview flags, ThreadLocal + {{remove()}} in a filter is still the safe standard.

### Common mistakes
- **Shipping preview APIs to production, then upgrading the JDK**: symptom is code that no longer compiles because the API changed (as in JDK 25). Fix: isolate preview usage behind a wrapper, or use it only on a final release.
- **Calling get() before join()**: symptom is IllegalStateException. Fix: always join (and throwIfFailed) first.
- **A subtask swallowing InterruptedException**: symptom is cancellation having no effect and the scope waiting for a long time. Fix: restore the interrupt flag or rethrow.
- **Treating ScopedValue as a mutable variable**: there is no set; to change it, rebind inside a nested scope.

### One-minute spoken answer
"Structured concurrency treats a group of parallel tasks as one block: fork the subtasks, join, and when execution leaves the block no subtask is still running. With ShutdownOnFailure, if one subtask fails the scope interrupts the rest and throws the error, so there are no orphan tasks like with CompletableFuture, and stack traces are readable because each subtask is an ordinary virtual thread. ScopedValue replaces ThreadLocal for per-request context: immutable, valid only inside run, expiring by itself so you cannot forget to remove it. Watch the versions: ScopedValue is final from JDK 25, structured concurrency is still preview with a changed API, so on Java 21 production I still use ThreadLocal with remove."

> Senior tip: a quick way to choose: CompletableFuture fits data flow that composes many steps; StructuredTaskScope fits the "call N things, one failure cancels the rest, aggregate" pattern. I applied it to fan-out of 3-5 calls: the code went from 40 lines (CompletableFuture plus manual AtomicBoolean cancellation) to 10 lines, and the stack traces became far easier to read.`,
    follow: [
      'How does ShutdownOnFailure differ from ShutdownOnSuccess in use case?',
      'Why is ScopedValue harder to leak than ThreadLocal in a thread pool?'
    ]
  },
});
