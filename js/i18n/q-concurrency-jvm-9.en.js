/*
 * English translation of js/data/q-concurrency-jvm.js — task T655. Format: js/core/i18n.js (content overlay).
 * ids: concurrency-032 concurrency-033 concurrency-034 concurrency-035 concurrency-036 concurrency-037 jvm-033 jvm-034 jvm-035 jvm-036
 */
App.i18n.content({
  'concurrency-032': {
    q: 'You write a thread-safe class (a quota counter, a cache, a rate limiter). How do you write a test that proves it is correct when run concurrently, so that the test fails reliably on wrong code but is not flaky on correct code?',
    a: `**Summary:** A good concurrency test has three parts: (1) **make the threads really run at the same moment** using a starting gate ({{CountDownLatch}}), (2) **repeat often enough** to raise the chance of hitting the race window, (3) **check an invariant** after every thread has finished, waiting with {{Future.get}} with a timeout instead of {{Thread.sleep}}. This style of test can only prove "there is a bug", it can never prove "there is no bug"; for parts that are subtle with respect to the memory model (volatile flags, publication) use jcstress, and for asynchronous code use Awaitility to wait for a condition.

### Why concurrency tests are usually useless
- Creating 10 threads with a {{new Thread(...).start()}} loop: the first thread is already finished before the tenth one is created, so in practice they run sequentially.
- Each thread performs only 1 operation: the race window is a few nanoseconds wide, you almost never hit it.
- Waiting with {{Thread.sleep(1000)}} and then asserting: on a slow CI the test fails (flaky), on a fast machine it passes even when the code is wrong.
- Asserting inside the worker thread: the AssertionError is thrown on a different thread, JUnit never sees it, and the test stays green.

### The standard test skeleton
~~~java
@RepeatedTest(20)                                    // run the whole test many times
void quotaNeverExceeded() throws Exception {
    QuotaCounter quota = new QuotaCounter(1_000);    // allows exactly 1000 permits
    int threads = 16, attemptsPerThread = 500;       // 8000 attempts, only 1000 are allowed
    ExecutorService pool = Executors.newFixedThreadPool(threads);
    CountDownLatch start = new CountDownLatch(1);    // starting gate
    AtomicInteger granted = new AtomicInteger();
    List<Future<?>> futures = new ArrayList<>();

    for (int t = 0; t < threads; t++) {
        futures.add(pool.submit(() -> {
            start.await();                           // every thread waits at the start line
            for (int i = 0; i < attemptsPerThread; i++) {
                if (quota.tryAcquire()) granted.incrementAndGet();
            }
            return null;                             // Callable: the exception surfaces through Future
        }));
    }
    start.countDown();                               // release all threads at the same instant
    for (Future<?> f : futures) f.get(10, TimeUnit.SECONDS); // error in a thread -> test fails
    pool.shutdownNow();

    assertEquals(1_000, granted.get());              // invariant: no over-granting, no under-granting
}
~~~
1. The latch keeps every thread at the start line, so the critical section really overlaps.
2. The number of attempts far exceeds the quota: a check-then-act race ({{if (count < limit) count++}}) grants more than 1000 in almost every run.
3. {{Future.get}} with a timeout: an exception inside a worker is rethrown on the test thread, and a deadlock turns into a failure after 10 seconds instead of hanging CI.
4. The invariant is checked once at the end, after {{Future.get}} has established a happens-before edge to every action inside the tasks.
5. Using more threads than CPU cores causes context switches in the middle of the work, which increases the chance of exposing the race.

### When you need a different tool
| Situation | Tool |
|---|---|
| Race in business logic (counting, allocating, cache) | The latch + repeat skeleton above |
| Visibility, reordering (volatile flags, double-checked locking, publication) | jcstress from OpenJDK: runs it millions of times and lists every outcome that was observed |
| Asynchronous code (Kafka listener, @Async, scheduler) | Awaitility: {{await().atMost(5, SECONDS).until(...)}} instead of sleep |
| Potential deadlock | Test with a timeout, print a thread dump when it times out, review the order in which locks are taken |
| One specific interleaving | Put latches inside fake dependencies to force thread A to stop mid-way so that thread B can run |

### Pitfalls
- The test passed once on a laptop so you consider it done: run {{@RepeatedTest}} or a loop of thousands of iterations in a nightly job.
- Not shutting the executor down: threads leak between tests and later tests are affected.
- Verifying how many times a mock was called while the threads are still running: always wait for completion first, then verify.
- Mixing functional tests with performance measurement: "runs faster" belongs to JMH, not to a unit test.

> Senior tip: I always run a new test against **deliberately broken code** (remove the synchronized, change AtomicInteger to a plain int) before I trust it. A test that stays green on wrong code is worthless. It takes 5 minutes, and more than once it showed me that the team's "concurrency" test was actually running sequentially.`,
    follow: [
      'Why can an assert inside a worker thread fail to fail the test, and how do you bring the error back to the test thread?',
      'How does jcstress differ from a JUnit test that is simply repeated many times?',
      'How do you force one specific interleaving between two threads in order to reproduce a known bug?'
    ]
  },
  'concurrency-033': {
    q: 'You need a rate limiter inside one instance: each API key allows at most 100 requests per second, bursts up to 200 are permitted, and it is called about 50,000 times per second from many threads. How do you implement a thread-safe token bucket (synchronized or CAS), how do you keep state per key, and which traps do you avoid?',
    a: `**Summary:** A token bucket needs only two numbers per key: how many tokens are present now and when it was last refilled. No thread has to refill tokens periodically: each call computes the tokens added by the elapsed time **lazily**. The two numbers must change **together**, so pack them into one immutable record and update it with a CAS loop on an {{AtomicReference}}, or simply use {{synchronized}} on each bucket (the critical section is a handful of arithmetic operations, so that is fine too). State per key lives in a {{ConcurrentHashMap}} with a size cap and a way to evict stale keys. Use {{System.nanoTime()}} as the clock, not {{currentTimeMillis()}}.

### The algorithm
- Capacity = 200: the maximum number of requests in one burst.
- Rate = 100 tokens per second.
- Each request: tokens = min(capacity, tokens + (now − last) × rate). If tokens ≥ 1, subtract 1 and let the request through, otherwise return 429.

Example: a key idle for 3 seconds has a full bucket of 200. The client fires 300 requests within 0.5 seconds: 200 go through immediately, during those 0.5 seconds 50 more tokens are added so 50 more pass, and 50 are rejected. After that the rate settles at 100 per second.

### Implementation with CAS
~~~java
final class TokenBucket {
    private record State(double tokens, long lastNanos) {}   // immutable: the two numbers travel together
    private final double capacity, perNano;
    private final AtomicReference<State> state;

    TokenBucket(double capacity, double perSecond) {
        this.capacity = capacity;
        this.perNano = perSecond / 1_000_000_000.0;
        this.state = new AtomicReference<>(new State(capacity, System.nanoTime()));
    }

    boolean tryAcquire() {
        while (true) {
            State cur = state.get();
            long now = System.nanoTime();                     // monotonic, does not jump when the clock is adjusted
            double refilled = Math.min(capacity, cur.tokens() + (now - cur.lastNanos()) * perNano);
            if (refilled < 1) return false;                   // out of tokens: reject, no write needed
            State next = new State(refilled - 1, now);
            if (state.compareAndSet(cur, next)) return true;  // lost the CAS: re-read and recompute
        }
    }
}
~~~
- Why a record: with two separate {{AtomicLong}}s each variable is atomic but the **pair** is not; two threads could both refill from the same timestamp and over-grant tokens.
- {{compareAndSet}} compares the **reference**, it does not call {{equals}}. That is exactly what we want: every write creates a new object, so the CAS succeeds only if nobody wrote in between our read and our write.

### synchronized or CAS
| | synchronized on the bucket | CAS + record |
|---|---|---|
| Code | Simple, easy to review | A loop, harder to read |
| Low contention | Very fast | Very fast |
| One extremely hot key, many threads | Threads queue up and may get parked | Retrying burns CPU and allocates an object per attempt |
| Virtual threads on JDK 21–23 | No I/O inside, so pinning is very short, acceptable | Never pins |
In practice both are enough for 50,000 calls per second because the critical section is only a few arithmetic operations. Pick synchronized if your team finds it more readable; pick CAS when one very hot key is called by many threads at once.

### State per key
~~~java
private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();

boolean allow(String apiKey) {               // apiKey has already been authenticated
    return buckets.computeIfAbsent(apiKey, k -> new TokenBucket(200, 100)).tryAcquire();
}
~~~
- The constructor inside {{computeIfAbsent}} only allocates an object and performs no I/O, so the lock on the bucket is held for a very short time.
- Create a bucket only for keys that were authenticated; otherwise an attacker sends random keys and grows the map until OOM. If stale keys must be evicted, use Caffeine with {{expireAfterAccess}} and {{maximumSize}}.
- A bucket that is evicted and then recreated comes back full: acceptable for a "soft" rate limit.

### Common traps
- {{System.currentTimeMillis()}}: an NTP adjustment backwards produces a negative elapsed interval, an adjustment forwards fills the bucket unexpectedly. {{nanoTime}} exists precisely for measuring intervals, which is the right use here.
- One token-refill task per key in a {{ScheduledExecutorService}}: 100,000 keys means 100,000 periodic tasks; lazy computation costs nothing while a key is idle.
- Multiple instances: each pod limits on its own, so 10 pods means 10 × 100 per second. For a global limit use Redis (an atomic Lua script) or split the quota by pod count, at the cost of extra network latency or imprecision while scaling.

> Senior tip: Bucket4j and Resilience4j RateLimiter already implement this and have distributed variants; I only write my own when the logic is unusual. Whatever you use, return a {{Retry-After}} header and expose a metric of rejected requests per key: when a big customer complains about being blocked wrongly, that metric is what lets you answer in 5 minutes.`,
    follow: [
      'Why does compareAndSet on an AtomicReference compare references instead of using equals, and what does that imply when the state is a record?',
      'How does a token bucket differ from a sliding window counter in terms of burst behaviour and memory?',
      'If the limit must be global across 20 instances, do you choose Redis or a static quota split, and why?'
    ]
  },
  'concurrency-034': {
    q: 'How do you size a {{ThreadPoolExecutor}} for an I/O-bound service in a principled way?',
    a: `**Summary:** For an I/O-bound service (I/O-bound: the thread spends most of its time waiting on I/O such as a DB, an HTTP call or Kafka rather than computing on the CPU), the thread count should not simply equal the core count. You need to reason from the wait/compute ratio, from the slowest resource limit (for example the connection pool), and use a bounded queue with an explicit rejection/backpressure policy.

### What → why it is needed → how it works
- {{CPU-bound}} (pure computation): a thread count close to {{Runtime.getRuntime().availableProcessors()}} is usually enough to use the CPU fully.
- {{I/O-bound}}: when a thread calls the DB or an HTTP endpoint it blocks waiting for the response, while other threads can still run. So you can use far more threads than cores. But if you create too many, the cost of context switches (context switch: the CPU saving one thread's state and loading another's) grows, memory grows, and you easily overload the resources further down.
- {{Little's law}}: the average number of items in a system {{L}} ≈ arrival rate {{λ}} × average time spent in the system {{W}}. Applied simply: to reach a target throughput you need enough threads/workers to cover the waiting time. There is no "one size fits all" formula — it is only a thinking frame.
- {{The slowest resource}}: usually the real ceiling is the connection pool (for example {{HikariCP}}), the DB connections, or a downstream rate limit. If the thread pool is larger than what can hand out a connection, you only generate useless context switches.

### Worked example
Assume a request waits about 80 ms on the DB and spends about 20 ms on logic. If the DB allows 10 concurrent connections, 100 threads cannot use the DB better than 10 can (and they add contention). Conversely, if the DB is strong and latency is low, the thread count can be raised.

### A practical configuration
| Component | Suggestion | Reason |
|---|---|---|
| {{corePoolSize}}/{{maxPoolSize}} | Start small, measure with p95/p99 | Increase only when queue depth starts growing steadily and throughput is still below target |
| {{workQueue}} | Use a bounded {{ArrayBlockingQueue}} (not the unbounded, effectively infinite {{LinkedBlockingQueue}}) | Avoids OOM when traffic spikes |
| {{RejectedExecutionHandler}} | {{CallerRunsPolicy}} or return 503 / explicit backpressure | {{CallerRunsPolicy}} relieves pressure temporarily but slows the caller down; for a public API it is usually better to return an error with {{Retry-After}} |
| Per {{@Async}} | Always configure your own {{Executor}}, never the default {{SimpleAsyncTaskExecutor}} | Avoids an unbounded number of threads |

### Real-world pitfalls
- Copying "hot" numbers from a blog post without measuring your own environment.
- Setting {{Tomcat max-threads}} very high without bounding {{HikariCP maximumPoolSize}} → threads wait for connections and latency rises.
- An unbounded queue → memory inflates and saturation is hard to notice.
- Looking only at CPU utilization: an I/O-bound system usually shows low CPU, while queue depth/saturation is the real signal.

> Senior tip: Do not optimize by feel. Watch {{queue depth}}, {{activeCount}}, {{completedTaskCount}}, {{rejected count}}, connection wait time, p95/p99 latency and the error rate. For a system with many instances, also account for the aggregate limit imposed on downstream services.`
  ,
    follow: ['How do you detect thread pool saturation?', 'When should you use virtual threads instead of a platform-thread pool?', 'Why is an unbounded queue dangerous for an I/O-bound service?'],
  },
  'concurrency-035': {
    q: 'What is structured concurrency (JEP 453, preview), when should you consider it, and what are its limitations?',
    a: `**Summary:** {{Structured concurrency}} is a way of organising subtasks so that their lifecycle is bound to a scope. Instead of "fire and forget" (dispatching work and not waiting for it), every subtask belongs to one {{structured task scope}}, and errors/cancellation propagate consistently.

### What → why it is needed → how it works
- The problem today: {{ExecutorService}} lets you create subtasks and forget them, it is hard to know when all of them are done, hard to push {{cancellation}} down to them, and easy to leak threads/resources when something fails.
- The idea: treat a group of tasks as one unit. If one subtask fails, the whole group can be cancelled (fail-fast). If you only need the first successful result, the remaining tasks can be stopped.
- The main APIs (in the preview): {{StructuredTaskScope.ShutdownOnFailure}} (cancel everything when there is an error) and {{StructuredTaskScope.ShutdownOnSuccess}} (take the first successful result and cancel the rest). In addition {{ScopedValue}} lets you pass context (trace id, authentication) without the clunky manual thread-local handling.

### Worked example
~~~java
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Future<String> f1 = scope.fork(() -> callServiceA());
    Future<String> f2 = scope.fork(() -> callServiceB());
    scope.join();           // wait for all of them, or get cancelled when one fails
    scope.throwIfFailed();  // throw if any task failed
    // use f1.resultNow(), f2.resultNow()
}
~~~
If {{callServiceA}} throws, {{scope.join()}} triggers cancellation of {{callServiceB}} if it is still running, which avoids wasting resources.

### When to consider it
| Situation | A good fit? | Note |
|---|---|---|
| Calling several interdependent microservices in parallel (you need both results) | Yes | {{ShutdownOnFailure}} feels very natural |
| Taking the fastest result from several sources | Yes | {{ShutdownOnSuccess}} |
| A complex pipeline where you want to pass context safely | Yes | Combine it with {{ScopedValue}} |
| Long-running, independent work with no need for tight lifecycle coupling | Maybe not needed | Sometimes {{CompletableFuture}} stays simpler |

### Important limitations
- **Preview API**: {{JEP 453}} is a preview and may change between JDK releases. **Do not ship it to production** without a migration plan.
- **Not fully settled yet**: tooling, IDE support and real-world experience are still limited.
- **It does not replace everything**: it solves no concurrency problem by itself, it only improves structure and the propagation of cancellation/errors.
- **Compatibility**: you need a suitable JDK and must enable preview features to use it.

> Senior tip: Try it in a dev/test environment and compare it against {{CompletableFuture}} in terms of clarity, cancellability and debuggability. Adopt it in production only once the API is standard and the team understands the trade-offs.`
  ,
    follow: ['What is the difference between structured concurrency and CompletableFuture?', 'How does ScopedValue differ from ThreadLocal?', 'Why do you need "structure" instead of just using an ExecutorService?'],
  },
  'concurrency-036': {
    q: 'What is {{happens-before}} in the Java Memory Model (JMM)? Why does it matter for avoiding data races?',
    a: `**Summary:** The {{Java Memory Model (JMM)}} defines the rules by which threads see each other's memory changes consistently. The {{happens-before}} relation guarantees both **visibility** (being able to see a change) and **ordering** (the order actions appear to happen) between actions. Without happens-before you can get a {{data race}} and undefined behaviour.

### What → why it is needed → how it works
- **Caches/local variables:** every CPU has caches and the JVM may reorder instructions for optimization. Without constraints, thread B might not see a write from thread A, or might see it in a different order.
- **Data race:** happens when at least two threads access the same variable without {{volatile}} and without synchronization, and at least one of them writes. In that case the JMM guarantees nothing.
- **Happens-before:** if A happens-before B, then every change made before A is visible to everything after B, and the related instructions may not be reordered in a way that violates that rule.

### The actions that create happens-before
| Action | Explanation |
|---|---|
| {{Thread.start()}} | Every action before {{start()}} happens-before the actions in the new thread |
| {{Thread.join()}} | Every action in the terminating thread happens-before {{join()}} returns |
| {{synchronized}} (unlock → lock) | Changes made before the unlock are visible to the thread that acquires that lock later |
| {{volatile}} write → read | A {{volatile}} write happens-before the next {{volatile}} read of the same variable |
| {{final}} fields (published safely) | Once the object is published correctly, its {{final}} fields are frozen and are guaranteed visible |

### A simple example
~~~java
public class Example {
    private int x = 0;
    private volatile boolean ready = false;

    // thread 1
    void writer() {
        x = 42;        // 1
        ready = true;  // 2 - volatile write
    }

    // thread 2
    void reader() {
        if (ready) {   // 3 - volatile read
            // 4: x must be 42 thanks to the happens-before edge between the volatile write and read
            System.out.println(x);
        }
    }
}
~~~
{{ready = true}} (the volatile write) happens-before the successful {{if (ready)}} (the volatile read). Therefore (1) happens-before (4).

### Pitfalls
- Adding {{volatile}} to a flag variable is not enough once the logic gets more complicated; you have to understand the constraints.
- {{final}} is only safe if the object does not "escape" (get referenced elsewhere) before the constructor finishes.
- Do not confuse {{volatile}} with atomicity for increment/decrement operations ({{volatile int}} is not safe for {{count++}}).
- "Safe publication" matters: if you publish incorrectly, another thread can observe an object that is not fully initialized.

> Senior tip: Prefer immutable designs. Use {{final}}, publish objects only once they are complete, and minimize sharing of mutable state. When synchronization is needed, pick the right tool: {{volatile}} for visibility/flags, {{synchronized}}/{{Lock}} for mutual exclusion, {{java.util.concurrent.atomic}} for atomic operations.`
  ,
    follow: ['What is the difference between visibility and atomicity?', 'What is safe publication?', 'Why do final fields have freeze semantics?'],
  },
  'concurrency-037': {
    q: 'When using {{CompletableFuture}}, how do you choose the {{Executor}}, handle timeouts, provide fallbacks, and propagate context?',
    a: `**Summary:** {{CompletableFuture}} uses {{ForkJoinPool.commonPool()}} by default. For I/O-bound tasks (waiting on the network or a DB) you should not use the common pool. Create your own bounded {{ExecutorService}}, use {{orTimeout}}/{{completeOnTimeout}}, {{exceptionally}}/{{handle}} for fallbacks, and care about propagation of the {{MDC}}/{{trace context}}.

### What → why it is needed → how it works
- **commonPool** is designed for CPU-bound tasks or tasks that do not block for long. If many I/O-blocking tasks run on it, they can "occupy" the pool and slow down every other task.
- **A dedicated Executor**: caps the thread count according to downstream capacity, easy to monitor, isolates load.
- **Timeout**: avoids hanging forever. Since Java 9 there is {{orTimeout(timeout, unit)}}, and Java 9+ also has {{completeOnTimeout(value, timeout, unit)}}.
- **Error handling**: {{exceptionally}} turns an error into a substitute value, {{handle}} deals with both success and failure.
- **Context**: the SLF4J {{MDC}} uses a {{ThreadLocal}}. When a task runs on another thread the context is lost unless you copy/propagate it yourself (for example with an executor decorator/wrapper).

### Worked example
~~~java
ExecutorService ioPool = Executors.newFixedThreadPool(32);

CompletableFuture<User> cf = CompletableFuture
    .supplyAsync(() -> userClient.get(id), ioPool)  // a dedicated executor
    .orTimeout(2, TimeUnit.SECONDS)                  // timeout
    .exceptionally(ex -> {
        // fallback or log, return a default value
        log.warn("get user failed", ex);
        return User.anonymous(id);
    });

// combine several futures
CompletableFuture.allOf(cf1, cf2, cf3)
    .thenRun(() -> { /* all completed successfully */ });
~~~

### Important notes
| Topic | Recommendation |
|---|---|
| Choosing the pool | I/O-bound: a dedicated pool with a bounded size (driven by the connection pool/downstream). CPU-bound: close to the core count. |
| allOf vs anyOf | {{CompletableFuture.allOf}} waits for all of them; if any fails then {{get/join}} throws an exception (it does not cancel the remaining tasks unless you manage that yourself). Think about whether you want fail-fast. |
| Timeout | Set a realistic timeout (for example p99 × 1.5) and log clearly why it timed out. |
| MDC propagation | For platform threads, copy {{MDC.getCopyOfContextMap()}} before submitting and restore it inside the task. For virtual threads you still have to pay attention, because the context may need propagating too. |
| Shutdown | Call {{shutdown()}}/{{shutdownNow()}} and {{awaitTermination}} when the application stops. |

### Pitfalls
- Using the {{commonPool}} for hundreds of blocking calls → starvation.
- Not setting a timeout → cascading failure.
- Ignoring exceptions in {{thenApply}}/{{thenAccept}} (they can hide bugs).
- Forgetting to propagate MDC → logs missing the trace id once you are on another pool's thread.

> Senior tip: Always measure p95/p99 to set timeouts and pool sizes. Prefer explicit error/fallback paths instead of silently swallowing exceptions. If you need to propagate complicated context, consider a library or an executor wrapper.`
  ,
    follow: ['What is the difference between exceptionally and handle?', 'Does allOf cancel the remaining futures when one fails?', 'How do you propagate MDC through CompletableFuture?'],
  },
  'jvm-033': {
    q: 'When reading a G1 GC log, what are the main pause types and what do they mean?',
    a: `**Summary:** {{G1 GC (Garbage First)}} splits the heap into many {{regions}} of equal size. The common pauses are: {{Young GC}} (collects Eden + Survivor), {{Mixed GC}} (collects part of Young plus some Old regions that hold a lot of garbage), {{Full GC}} (the whole heap, usually the slowest), pauses caused by {{Humongous allocation}}, and {{To-space exhausted}}, which signals that the heap has no room left.

### What → why it is needed → how it works
- **G1's goal:** hit a target pause time ({{-XX:MaxGCPauseMillis}}) by prioritizing the regions that contain the most garbage first.
- **Young GC:** happens when Eden is full. It moves survivor objects to a Survivor region or to Old regions. Usually short.
- **Mixed GC:** once enough garbage has accumulated in Old regions (reaching a threshold), G1 runs a Mixed GC that collects Young plus a subset of Old regions, freeing space without needing a Full GC right away.
- **Humongous object:** an object larger than about 50% of the region size is placed directly in a {{humongous region}}. Collecting humongous objects can cause a significant pause.
- **To-space exhausted:** there is not enough room in the destination region to copy the surviving objects → it can lead to a Full GC.

### Reading a GC log quickly (the idea)
| Signal | How to interpret it |
|---|---|
| {{[GC pause (G1 Evacuation Pause) (young)]}} | An ordinary Young GC |
| {{[GC pause (G1 Evacuation Pause) (mixed)]}} | A Mixed GC |
| {{[Full GC (Allocation Failure)]}} | A Full GC — investigate the cause |
| {{Humongous regions}} | Many large objects can become a problem |
| Pause duration | Compare it with {{MaxGCPauseMillis}} to see whether it exceeds the target |

### Pitfalls
- Looking only at total GC time and ignoring pause frequency.
- Growing the heap blindly instead of finding the cause (allocation pattern, humongous objects, memory leak).
- Not enabling detailed GC logging (on JDK 11+ use {{Xlog:gc*:file=...}}).
- Confusing "mixed" with "full" — mixed is still a targeted collection, while full is usually much worse.

> Senior tip: Start with G1's default configuration, turn on GC logging, and watch pause time, GC counts and heap usage. If you keep hitting humongous allocation or to-space exhausted, look at the large object sizes and consider a sensible region size / {{-Xmx}}. Consider ZGC/Shenandoah only when you genuinely need extremely short pauses and understand the trade-offs.`
  ,
    follow: ['When does G1 move from Young GC to Mixed GC?', 'How do humongous objects affect things?', 'How do G1 and ZGC differ in their goals?'],
  },
  'jvm-034': {
    q: 'What is {{tiered compilation}} in HotSpot? How does it work, and why do you need to be careful when benchmarking?',
    a: `**Summary:** {{Tiered compilation}} combines an {{interpreter}} (fast to start up), the {{C1 compiler}} (compiles quickly with light optimization) and the {{C2 compiler}} (compiles more slowly but optimizes deeply) to balance startup time against peak performance. "Hot" code (called many times) is promoted through the tiers until it reaches fully optimized native code.

### What → why it is needed → how it works
- **Purpose:** do not compile all code up front. Interpret first in order to collect profiling data (a profile: call counts, actual types...), then compile only the hot methods.
- **The main tiers (the idea):** Tier 0 (interpreter), Tier 1 (C1 without profiling), Tier 2/3 (C1 with profiling), Tier 4 (C2, fully optimizing).
- **Deoptimization:** if an assumption made from profiling turns out to be wrong (an unexpected class load, a type change), the JVM can demote (deoptimize) and fall back to the interpreter or to non-optimized code.
- **On-stack replacement (OSR):** allows replacing a loop that is currently running with its compiled native version without waiting for the loop to finish.

### Why you must be careful when benchmarking
| Problem | Explanation |
|---|---|
| Warm-up | Before reaching real performance, the code must run enough to be compiled by C2. Measuring immediately means you are measuring the interpreter/C1. |
| JIT is not stable | There can be many compile/deoptimize events during warm-up. |
| A single run | Results can be wildly off because of the JIT. |
| Different compiler flags | Different JIT configuration gives different results. |

### How to benchmark correctly
- Use {{JMH}} (Java Microbenchmark Harness) — it is designed with the JIT in mind.
- {{@Fork}} >= 3 (a separate JVM per fork so runs do not influence each other).
- Enough warm-up iterations (usually thousands of invocations, or a fixed warm-up time).
- Measure with measurement iterations and report mean + standard deviation or a confidence interval.
- Avoid measuring System.out or I/O inside the benchmark.

> Senior tip: If you see "performance improving after a few minutes of running", that is the JIT compiling. When debugging real-world performance, care about both warm-up and post-warm-up behaviour. To investigate the JIT you can enable compilation logging ({{-XX:+PrintCompilation}}), but watch out for the overhead.`
  ,
    follow: ['What is the difference between the C1 and C2 compilers?', 'When does deoptimization occur?', 'Why does JMH matter compared with a simple main()?'],
  },
  'jvm-035': {
    q: 'How do you investigate a {{Metaspace leak}} (a class-metadata leak)?',
    a: `**Summary:** {{Metaspace}} stores class metadata (class definitions, methods, the constant pool...). A {{Metaspace leak}} happens when a {{ClassLoader}} cannot be garbage collected (unloaded) because something still references it, so its classes cannot be unloaded and Metaspace keeps growing. You must distinguish it from a heap leak.

### What → why it is needed → how it works
- **Common causes:** hot redeploy (the webapp is undeployed but the classloader/context is still retained), custom ClassLoaders, dynamic proxies (CGLib/JDK Proxy), scripting engines, frameworks that generate classes at runtime.
- **Symptoms:** Metaspace usage climbing after each deploy/restart of the application, eventually {{OutOfMemoryError: Metaspace}} or warning thresholds being hit.
- **Class unloading:** happens only when the ClassLoader is no longer reachable and no class from it is referenced.

### Step-by-step investigation
| Tool/Method | Purpose |
|---|---|
| {{-XX:MaxMetaspaceSize}} | Set a cap so it fails fast instead of slowing the server down indefinitely |
| {{-Xlog:class+unload*:file=...}} (JDK 9+) | See whether classloaders/classes are actually being unloaded |
| {{jcmd <pid> VM.classloader_stats}} | Statistics about the current classloaders |
| {{jmap -clstats}} or a heap dump | Analyse the classloader tree |
| {{Eclipse MAT}} (Memory Analyzer) / {{VisualVM}} | Find the GC roots pointing at a ClassLoader (usually a Thread, a static field, a listener...) |

### The investigation process
1. **Observe:** track Metaspace usage over time (JMX/metrics). Does it increase after each redeploy?
2. **Take a heap dump** before the OOM, or after several redeploys.
3. **Find the ClassLoader leak:** in MAT, locate the {{ClassLoader}} instances and inspect their {{GC Roots}}. If a thread's context classloader, a static field, or a framework cache holds them, they will never be collected.
4. **Identify the cause:** usually a listener that was never unregistered, a thread pool that was not shut down, a cache that was not cleared, or a library holding a reference.
5. **Fix it:** unregister listeners, shut down executors, clear ThreadLocals, and respect the ClassLoader lifecycle.

### Pitfalls
- Confusing a Metaspace leak with a heap leak (different symptoms, and they require analysing the right memory area).
- Just restarting instead of fixing → the problem comes back.
- Hot redeploy in production is extremely dangerous with regard to ClassLoader leaks.
- Not capping {{MaxMetaspaceSize}} makes early detection harder.

> Senior tip: In production, avoid hot redeploy. If you use a container/app server, make sure every resource is released on undeploy. When investigating, focus on "who is holding the ClassLoader" rather than only "how many classes there are". One retained ClassLoader retains every class it loaded.`
  ,
    follow: ['What is the difference between PermGen and Metaspace?', 'Why do custom ClassLoaders leak easily?', 'How do you prevent ClassLoader leaks in a web app?'],
  },
  'jvm-036': {
    q: 'To make Spring Boot start faster on Kubernetes, what are the options and what are the trade-offs between them?',
    a: `**Summary:** Improving {{startup time}} matters for autoscaling, scale-to-zero and cold starts. The techniques are {{AppCDS}}/{{CDS}} (Class Data Sharing), {{Spring AOT}} (Ahead-of-Time processing), {{CRaC}} (Coordinated Restore at Checkpoint) and {{GraalVM Native Image}}. Each has trade-offs in build time, image size, memory usage and compatibility.

### Comparing the options
| Option | How it works | Advantages | Disadvantages | When to use it |
|---|---|---|---|---|
| **CDS/AppCDS** | Stores the metadata of already-loaded classes in an archive and reuses it at startup | Easy to adopt, minimal code changes, noticeably shorter startup | Only optimizes class loading, still runs on the JVM (JIT kicks in after warm-up) | Very common, low risk, applicable to many projects |
| **Spring AOT** | At build time it generates bean definitions, proxies and configuration metadata instead of doing runtime reflection | Less reflection, faster, prepares you well for native image | Requires an AOT build step, some dynamic features may be limited | Combined with the JVM or with native image; what Spring recommends |
| **CRaC** | Takes a checkpoint (snapshot) of a running JVM and restores it quickly instead of booting from scratch | Extremely fast startup (near instant), keeps the warm state, and JIT profiles may be preserved depending on the case | Needs CRaC support on the platform (JVM + container runtime), more complex, and restore must be tested carefully | Great for scale-to-zero/cold start on the JVM, increasingly common |
| **GraalVM Native Image** | Compiles the whole application into a native binary (ahead-of-time compilation) | Extremely fast startup (milliseconds), small memory footprint | Very long build times, reflection/dynamic features need configuration, some libraries are hard to make compatible (Hibernate has many restrictions), and you lose HotSpot's strong JIT optimizations | Small microservices, serverless, when startup is critical — and only when compatibility is sufficient |

### Practical recommendations
- **Safe default:** JVM + CDS + Spring AOT. This is a good balance between compatibility, effect and maintainability.
- **Need extremely fast startup:** consider CRaC before jumping to Native Image. CRaC keeps the benefits of the HotSpot JIT.
- **Use Native Image only** once you have verified that every dependency (especially Hibernate, JPA, reflection) is compatible, you accept long build times, and you genuinely need native startup.

### Pitfalls
- Native Image + Hibernate: reflection and proxies need configuration, and it does not always "just work".
- Measuring wrong: measure "time to first request", not only "JVM started".
- Optimizing only startup while ignoring steady-state memory/throughput.
- CRaC requires an environment that supports checkpoint/restore (not every K8s setup is ready for it).

> Senior tip: Start from measurement (startup time, memory, throughput). In most enterprise projects, JVM + CDS + AOT is enough. Native Image is genuinely valuable only when cold start is a severe problem and you are willing to invest in more complex build and test pipelines.`
  ,
    follow: ['What is the difference between startup time and time to first request?', 'Why can CRaC be better than Native Image in some cases?', 'What do you need to watch out for when using Native Image with Spring Data JPA/Hibernate?'],
  },
});
