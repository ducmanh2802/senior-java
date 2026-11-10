/*
 * English translation of js/data/q-concurrency-jvm.js — task T1156. Format: js/core/i18n.js (content overlay).
 * ids: concurrency-034 concurrency-035 concurrency-036 concurrency-037 jvm-033 jvm-034 jvm-035 jvm-036
 */
App.i18n.content({
  'concurrency-034': {
    q: 'How do you properly size a {{ThreadPoolExecutor}} for an I/O-bound service?',
    a: `**Summary:** For an I/O-bound service (waiting on DB, HTTP, Kafka rather than CPU-intensive calculation), the thread count should not simply equal the core count. You need to base your decision on the wait/compute ratio, the bottleneck resource limit (e.g., connection pool), use a bounded queue, and have a clear rejection/backpressure policy.

### What → Why → How
- {{CPU-bound}} (pure calculation): thread count close to {{Runtime.getRuntime().availableProcessors()}} is usually enough to fully utilize the CPU.
- {{I/O-bound}}: when a thread calls DB/HTTP it blocks waiting for response, while other threads can keep running. Thus, you can use more threads than cores. But creating too many adds context switch (context switch: CPU saving one thread's state and loading another's) costs, increases memory, and easily overloads downstream resources.
- {{Little's law}}: average items in system {{L}} ≈ arrival rate {{λ}} × average time {{W}}. Simply put: to reach target throughput you need enough threads to cover the waiting time. There is no "one-size-fits-all" formula — only a thinking framework.
- {{Slowest resource}}: the real ceiling is usually the connection pool (e.g., {{HikariCP}}), database connections, or a downstream rate limit. If the thread pool is larger than what the downstream can handle, you only generate useless context switches.

### Example
Suppose a request waits ~80ms on DB and spends ~20ms on logic. If DB allows 10 concurrent connections, you cannot use DB more effectively with 100 threads than with 10 (it just adds contention). Conversely, if DB is strong and latency is low, thread count can be raised.

### Practical configuration
| Component | Suggestion | Reason |
|---|---|---|
| {{corePoolSize}}/{{maxPoolSize}} | Start small, measure with p95/p99 | Increase only when queue depth steadily grows and throughput is below target |
| {{workQueue}} | Bounded {{ArrayBlockingQueue}} (avoid unbounded {{LinkedBlockingQueue}}) | Prevents OOM during traffic spikes |
| {{RejectedExecutionHandler}} | {{CallerRunsPolicy}} or explicit 503/backpressure | CallerRunsPolicy relieves pressure but slows caller; for public API return error with {{Retry-After}} |
| Per {{@Async}} | Always use a dedicated {{Executor}}, never default {{SimpleAsyncTaskExecutor}} | Avoids unbounded thread growth |

### How ThreadPoolExecutor handles work
The order is **not** what many assume: (1) below {{corePoolSize}} → create new thread; (2) at core → **put into queue**; (3) queue **full** → create more threads up to {{maximumPoolSize}}; (4) still full → {{RejectedExecutionHandler}}. Consequence: with an unbounded {{LinkedBlockingQueue}} (the default of {{Executors.newFixedThreadPool}}), step 3 never happens — {{maximumPoolSize}} is meaningless, queue inflates infinitely when downstream is slow, latency rises silently. Formula for I/O-bound: cores × (1 + wait time / compute time); but the **real ceiling** is the slowest resource downstream.

### Real-world example
A notification service used {{Executors.newFixedThreadPool(20)}} to call an SMS API (normally 150ms). When the SMS provider slowed to 5s, the unbounded queue piled up 1.4 million tasks, heap full, pod OOMKilled — losing all tasks. Redesign: {{ThreadPoolExecutor(20, 40, 60s, ArrayBlockingQueue(2000), CallerRunsPolicy)}} for synchronous thread, SMS sending moved to Kafka for durable buffering; added metrics {{executor.queued}} and {{executor.active}} via Micrometer. Next time provider slowed, queue hit 2000, system gracefully slowed (backpressure), no tasks lost, no OOM.

### Interview sample answer
"For I/O-bound services, thread count should be larger than core count; a reference formula is core count multiplied by one plus the wait-to-compute ratio. But I always check the real bottleneck downstream: 100 threads with a DB connection pool of 20 means 80 threads just wait for a connection. I always use a bounded queue because ThreadPoolExecutor only creates more threads once the queue is full; an unbounded queue makes maximumPoolSize meaningless and can cause OOM. I choose a deliberate rejection policy like CallerRunsPolicy to create backpressure, name threads, and push active, queued, rejected metrics to the dashboard. With Java 21, if it's just I/O waiting, virtual threads with a semaphore limit are simpler than manually sizing a pool."

> Senior tip: Don't optimize by feel. Watch {{queue depth}}, {{activeCount}}, {{completedTaskCount}}, {{rejected count}}, connection wait time, p95/p99 latency, and error rate. For multi-instance systems, account for the aggregate downstream limit.`
    ,
    follow: ['How do you detect thread pool saturation?', 'When should you use virtual threads instead of a platform-thread pool?', 'Why is an unbounded queue dangerous for an I/O-bound service?']
  },
  'concurrency-035': {
    q: 'What is structured concurrency (JEP 453, preview), when should you consider it, and what are its limitations?',
    a: `**Summary:** {{Structured concurrency}} organizes subtasks so their lifecycle is bound to a scope. Instead of "fire and forget" (dispatching work without waiting), subtasks belong to a {{structured task scope}} and errors/cancellation propagate consistently.

### What → Why → How
- Current problem: {{ExecutorService}} lets you create subtasks and forget them; it is hard to know when all are done, hard to propagate {{cancellation}}, and easy to leak threads/resources on failure.
- Idea: treat a group of tasks as a single unit. If a subtask fails, the whole group can be cancelled (fail-fast). If only the first successful result is needed, remaining tasks can be stopped.
- Main APIs (preview): {{StructuredTaskScope.ShutdownOnFailure}} (cancel all on error) and {{StructuredTaskScope.ShutdownOnSuccess}} (take first success and cancel others). {{ScopedValue}} helps pass context (trace id, auth) without clunky {{ThreadLocal}}.

### Worked example
~~~java
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Future<String> f1 = scope.fork(() -> callServiceA());
    Future<String> f2 = scope.fork(() -> callServiceB());
    scope.join();           // wait for all or cancel on failure
    scope.throwIfFailed();  // throw if any task failed
    // use f1.resultNow(), f2.resultNow()
}
~~~
If {{callServiceA}} throws, {{scope.join()}} triggers cancellation of {{callServiceB}} if still running, avoiding wasted resources.

### When to consider
| Situation | Fit? | Note |
|---|---|---|
| Calling interdependent microservices in parallel (need all results) | Yes | {{ShutdownOnFailure}} feels natural |
| Take fastest result from several sources | Yes | {{ShutdownOnSuccess}} |
| Complex pipeline, safe context passing | Yes | Combine with {{ScopedValue}} |
| Long-running, independent work, no tight coupling | Maybe not | {{CompletableFuture}} stays simpler sometimes |

### Important limitations
- **Preview API**: {{JEP 453}} is a preview, may change between JDK versions. **Do not ship to production** without a migration plan.
- **Limited ecosystem**: tooling, IDE support and real-world experience limited.
- **Not a silver bullet**: solves no concurrency problem itself, just improves structure/propagation.
- **Compatibility**: need suitable JDK, enable preview.

### API status
Structured concurrency has been **preview** across several versions: JEP 453 (Java 21), then further previews in 22, 23, 24; in Java 25 (JEP 505) the API was redesigned — creating a scope via {{StructuredTaskScope.open(...)}} with **Joiners** instead of Java 21 subclasses {{ShutdownOnFailure}}/{{ShutdownOnSuccess}}. Must enable {{--enable-preview}} and accept API may change. So in production, many teams use virtual thread executor + {{Future}} or libraries, and only try structured concurrency in low-risk parts.

### Real-world example
A "personalized home" API called 4 services via {{CompletableFuture}}. When one service errors immediately, the other 3 calls run to their full timeout — wasting threads and downstream quota; worse, a "dropped" call still logs and emits metrics, messing up traces. A try with structured concurrency (Java 21 preview, {{ShutdownOnFailure}}): an error in one branch **cancels** remaining branches immediately, no orphan tasks, thread dump shows parent-child relationships. Extra downstream calls on error reduced by ~70%. Team keeps it in an internal service waiting for API to stabilize.

### Interview sample answer
"Structured concurrency binds subtask lifecycle to a scope, like try-with-resources: tasks in scope must finish before scope closes; if one fails, others are cancelled; errors propagate to parent. It solves CompletableFuture problems like orphan tasks, swallowed errors, and cancellation propagation. It goes well with virtual threads. But this is still preview: from JEP 453 in Java 21 through several previews, to Java 25 where the API was redesigned with StructuredTaskScope.open and Joiner. So in production I only consider it when the team accepts enable-preview and tracks API changes; otherwise I use virtual thread executor with Future and clear timeouts."

> Senior tip: Try it in dev/test, compare against {{CompletableFuture}} for clarity, cancellability, and debuggability. Adopt in production only once standard and understood.`
    ,
    follow: ['Difference between Structured Concurrency and CompletableFuture?', 'How ScopedValue differs from ThreadLocal?', 'Why "structure" instead of ExecutorService?']
  },
  'concurrency-036': {
    q: 'What is {{happens-before}} in the Java Memory Model (JMM)? Why is it important for avoiding data races?',
    a: `**Summary:** The {{Java Memory Model (JMM)}} defines rules for threads to see each other's memory changes consistently. The {{happens-before}} (happens-before) relation guarantees **visibility** and **ordering** between actions. Without it, you get a {{data race}} (data race) and undefined behavior.

### What → Why → How
- **Cache/local variables:** CPUs have caches, JIT may reorder instructions. Without constraints, thread B might not see thread A's write, or see it out of order.
- **Data race:** multiple threads accessing a non-{{volatile}} variable without sync, with at least one writer. JMM guarantees nothing here.
- **Happens-before:** if A happens-before B, changes before A are visible after B, and related instructions cannot be reordered in violation of this rule.

### Important happens-before sources
| Action | Explanation |
|---|---|
| {{Thread.start()}} | Actions before {{start()}} happen-before actions in the new thread |
| {{Thread.join()}} | Actions in terminating thread happen-before {{join()}} returns |
| {{synchronized}} (unlock → lock) | Changes before unlock are visible to thread acquiring lock later |
| {{volatile}} write → read | {{volatile}} write happens-before next {{volatile}} read of same variable |
| {{final}} fields (safely published) | After object is correctly published, {{final}} fields are frozen and guaranteed visible |

### Simple example
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
            // 4: x must be 42 thanks to happens-before edge
            System.out.println(x);
        }
    }
}
~~~
{{ready = true}} (volatile write) happens-before {{if (ready)}} (volatile read). Therefore (1) happens-before (4).

### Pitfall
- Adding {{volatile}} to a flag isn't enough in complex logic.
- {{final}} is safe only if object does not escape before constructor finishes.
- Do not confuse {{volatile}} with atomicity for {{count++}}.
- "Safe publication" matters: incorrect publication can make a thread observe an object not fully initialized.

### Inside: why happens-before is needed
CPUs have caches and **store buffers**; JIT/CPU can **reorder** instructions as long as single-thread result is unchanged. Without happens-before, thread B might never see thread A's write (reading from cache/register), or see in different order. {{volatile}} write = "flush" prior changes; {{synchronized}} unlock → lock creates similar relation; {{Thread.start()}}, {{join()}}, and {{java.util.concurrent}} classes (put into {{ConcurrentHashMap}} then get, {{CountDownLatch.countDown}} → {{await}}) also guarantee happens-before.

### Real-world example
A service had a non-volatile stop flag {{boolean running = true;}} read by a worker in a loop, and shutdown hook set {{running = false}}. On dev, worker stops fine; on production after JIT (C2 hoists variable read out of loop), worker **never stops** — each deploy pod hangs for 30s until K8s kills it, losing messages. Fix: {{volatile boolean running}} (or {{AtomicBoolean}}); graceful shutdown runs correctly. Another place used double-checked locking without volatile for a singleton — another thread saw a "half-initialized" object — fixed with holder-class idiom.

### Interview sample answer
"The Java Memory Model defines when a thread is guaranteed to see data another thread wrote. Due to caches and instruction reordering, without a happens-before relation another thread might not see the new value, or see in a strange order. Happens-before is created by: volatile write before read, unlock before lock on same monitor, Thread.start and join, and java.util.concurrent classes. Data race occurs with two threads accessing same variable, one writing, no happens-before; it's a bug showing only after JIT optimization, like a non-volatile flag causing hang. I prefer using AtomicBoolean, ConcurrentHashMap, and immutable objects with final fields."

> Senior tip: Prefer immutable designs. Use {{final}}, publish objects only when complete, minimize shared mutable state. Pick right tool: {{volatile}} for visibility/flags, {{synchronized}}/{{Lock}} for mutual exclusion, {{java.util.concurrent.atomic}} for atomic ops.`
    ,
    follow: ['Visibility vs atomicity?', 'What is safe publication?', 'Why do final fields have freeze semantics?']
  },
  'concurrency-037': {
    q: 'When using {{CompletableFuture}}, how to choose Executor, handle timeouts, fallbacks, and propagate context?',
    a: `**Summary:** {{CompletableFuture}} defaults to {{ForkJoinPool.commonPool()}}. For I/O-bound tasks, don't use common pool. Create a bounded {{ExecutorService}}, use {{orTimeout}}/{{completeOnTimeout}}, {{exceptionally}}/{{handle}} for fallbacks, and manage {{MDC}}/{{trace context}} propagation.

### What → Why → How
- **commonPool** is for CPU-bound tasks. I/O-blocking tasks on it can "occupy" the pool and slow down everything.
- **Dedicated Executor**: caps threads, easy to monitor, isolates load.
- **Timeout**: avoids hanging. Use {{orTimeout(timeout, unit)}} or {{completeOnTimeout(value, timeout, unit)}}.
- **Error handling**: {{exceptionally}} for fallback, {{handle}} for success/failure.
- **Context**: {{MDC}} uses {{ThreadLocal}}. Tasks on other threads lose context unless you copy/propagate it (e.g., wrapper).

### Worked example
~~~java
ExecutorService ioPool = Executors.newFixedThreadPool(32);

CompletableFuture<User> cf = CompletableFuture
    .supplyAsync(() -> userClient.get(id), ioPool)  // dedicated executor
    .orTimeout(2, TimeUnit.SECONDS)                  // timeout
    .exceptionally(ex -> {
        log.warn("get user failed", ex);
        return User.anonymous(id);                   // fallback
    });
~~~

### Important notes
| Topic | Recommendation |
|---|---|
| Choosing pool | I/O-bound: dedicated bounded pool. CPU-bound: near core count. |
| allOf vs anyOf | {{allOf}} waits for all; if any fails then {{get/join}} throws (doesn't cancel others unless managed). Consider fail-fast. |
| Timeout | Realistic timeout (e.g., p99 * 1.5), log clearly. |
| MDC propagation | Copy {{MDC.getCopyOfContextMap()}} before submit, restore in task. Virtual threads may still need context propagation. |
| Shutdown | {{shutdown()}}/{{shutdownNow()}} and {{awaitTermination}} on app stop. |

### Pitfall
- Common pool for blocking calls → starvation.
- No timeout → cascading failure.
- Ignoring exceptions → hidden bugs.
- No MDC propagation → logs lose trace id.

### Inside: which thread runs the callback
{{thenApply}} (no Async) runs on **thread completing the future** — if future is done it runs immediately on **thread calling** {{thenApply}}. {{thenApplyAsync}} without executor runs on {{ForkJoinPool.commonPool()}} (size = core − 1; on 2 vCPU container only 1 thread). Blocking I/O in common pool blocks every parallel stream and every other {{CompletableFuture}}.

### Real-world example
Price aggregation called 5 providers via {{supplyAsync}} without executor. On 2 vCPU pod, common pool has 1 thread → 5 calls run **sequentially**, p95 3.4s instead of ~700ms. MDC lost on pool threads. Fix: dedicated bounded executor, {{orTimeout(800ms)}} with {{exceptionally}} returning "no quote", wrapping executor with {{ContextExecutorService}} to keep traceId. p95 remains 820ms, slow provider doesn't ruin request.

### Interview sample answer
"I don't use common pool for I/O: shared across JVM, size is core count minus one, one blocking call chokes everything else. I pass my own bounded executor or virtual thread executor. thenApply without Async runs on thread completing future. Each branch gets timeout via orTimeout, and I handle errors via exceptionally or handle to return intentional fallback, not swallowing silently. When combining with allOf, join each future to get results. Finally context: MDC, traceId, SecurityContext don't propagate automatically, so I wrap executor with context propagation."

> Senior tip: Measure p95/p99 for timeouts and pool sizes. Prefer explicit error/fallback paths over silently swallowing exceptions.`
    ,
    follow: ['Difference between exceptionally and handle?', 'Does allOf cancel remaining futures when one fails?', 'How to propagate MDC through CompletableFuture?']
  },
  'jvm-033': {
    q: 'When reading G1 GC log, what are main pause types and what do they mean?',
    a: `**Summary:** {{G1 GC (Garbage First)}} splits heap into equal {{region}}s. Common pauses: {{Young GC}} (collects Eden + Survivor), {{Mixed GC}} (collects part of Young + some Old regions with much garbage), {{Full GC}} (whole heap, slowest), {{Humongous allocation}} (causes pause), {{To-space exhausted}} (no room left).

### What → Why → How
- **G1 goal:** target pause time ({{-XX:MaxGCPauseMillis}}) by prioritizing regions with most garbage.
- **Young GC:** Eden full. Moves survivor objects to Survivor or Old. Usually short.
- **Mixed GC:** After enough garbage in Old regions (reaches threshold), G1 collects Young + subset of Old regions.
- **Humongous object:** Object > 50% region size goes to {{humongous region}}.
- **To-space exhausted:** Not enough room to copy surviving objects → potential Full GC.

### Reading GC log (ideas)
| Signal | Interpretation |
|---|---|
| {{[GC pause (G1 Evacuation Pause) (young)]}} | Ordinary Young GC |
| {{[GC pause (G1 Evacuation Pause) (mixed)]}} | Mixed GC |
| {{[Full GC (Allocation Failure)]}} | Full GC - investigate |
| {{Humongous regions}} | Too many large objects |

### Real log (JDK 17, -Xlog:gc*)
~~~text
[...][info][gc] GC(1532) Pause Young (Normal) (G1 Evacuation Pause) 6020M->3810M(8192M) 48.512ms
[...][info][gc] GC(1540) Pause Young (Concurrent Start) (G1 Humongous Allocation) 7100M->5900M(8192M) 61.2ms
[...][warn][gc] GC(1601) To-space exhausted
[...][info][gc] GC(1601) Pause Full (G1 Compaction Pause) 8150M->5200M(8192M) 3842.117ms
~~~
Reading: Young clears Eden; "Concurrent Start" is triggered by **humongous allocation**; "Mixed" clears more Old regions; **To-space exhausted** → **Full GC 3.8s**.

### Real-world example
Service had 3-4s Full GCs hourly. Log showed "Humongous Allocation": reports created 30-60MB {{byte[]}} arrays — each array took tens of contiguous regions, fragmenting heap, until to-space exhausted. Fix: stream file to response; temporarily increase {{-XX:G1HeapRegionSize=16m}}. Full GC gone, Young pause 30-50ms.

### Interview sample answer
"G1 splits heap into regions and has three pause types. Young clears Eden/Survivor, tens of ms. When Old fills, G1 starts mark cycle, beginning with Young pause (Concurrent Start), then Mixed pauses clear Old regions. Full GC is bad: G1 can't keep up, usually with To-space exhausted, stops heap for seconds. When reading logs I look at pause time, heap usage, reason (like Humongous Allocation), and Old growing to suspect leak. Humongous allocation is a common cause of Full GC; fix by streaming instead of building large arrays."

> Senior tip: Start with G1 defaults, enable GC logging, watch pause time, GC counts, heap usage. If hitting humongous allocation/to-space exhausted, check large object sizes or adjust region size/{{-Xmx}}. Only consider ZGC/Shenandoah when needed and understood.`
    ,
    follow: ['When does G1 move from Young to Mixed GC?', 'How humongous objects affect things?', 'Difference between G1 and ZGC goals?']
  },
  'jvm-034': {
    q: 'What is {{tiered compilation}} in HotSpot? How does it work, and why be careful when benchmarking?',
    a: `**Summary:** {{Tiered compilation}} combines {{interpreter}} (fast startup), {{C1 compiler}} (fast compilation), {{C2 compiler}} (deep optimization) to balance startup and peak performance. Hot code is promoted through tiers to optimized native code.

### What → Why → How
- **Purpose:** Don't compile everything up front. Interpret to profile, then compile hot methods.
- **Tiers:** Tier 0 (interpreter), Tier 1 (C1 no profile), Tier 2/3 (C1 with profile), Tier 4 (C2 deeply optimized).
- **Deoptimization:** If profile assumption is wrong, JVM falls back to interpreter.
- **OSR:** Replaces loop with native version mid-execution.

### Why be careful when benchmarking
| Problem | Explanation |
|---|---|
| Warm-up | Code needs to be compiled to reach peak performance. |
| JIT not stable | Profiling/deopt events happen during warm-up. |
| Single run | Results skewed by JIT. |

### How to benchmark
- Use {{JMH}}.
- {{@Fork}} >= 3.
- Enough warm-up iterations.
- Measurement iterations.
- Avoid measuring I/O.

### Inside: five tiers and deoptimization
HotSpot tiers: 0 (interpreter), 1-3 (C1), 4 (C2). Tier 0 → C1 tier 3 compiles **collecting profile** (types, hot branches) → C2 tier 4 compiles deeply optimized based on profile. If assumption fails (new subclass, unexpected branch), JVM **deoptimizes** — drops code, falls back to interpreter, recompiles.

### Real-world example
Team compared two JSON serialization methods looping {{nanoTime}} 1k times → A "3x faster". On production no difference. Re-ran with JMH (warm-up, fork, {{Blackhole}}): difference 8%, initial result was due to A measured **after** JIT warmed up shared part. Also found p99 high for first 3 mins after deploy due to JIT → team added warm-up step before readiness probe, p99 for first 3 mins dropped 900ms → 180ms.

### Interview sample answer
"Tiered compilation combines interpreter, C1, and C2 to balance startup and peak performance. Code is promoted through tiers based on profile (types, hot branches). If profile assumption fails, JVM deoptimizes and recompiles. Benchmarking with nanoTime loops is usually wrong: measures uncompiled code, JIT may eliminate code, run order affects results. I use JMH with warm-up, forks, Blackhole, and diverse data. In production, this effect appears as high p99 for first minutes, so I warm-up before readiness probe."

> Senior tip: If performance improves after minutes, JIT is compiling. Use {{-XX:+PrintCompilation}} to investigate, but watch overhead.`
    ,
    follow: ['Difference between C1 and C2?', 'When does deoptimization occur?', 'Why JMH vs main()?']
  },
  'jvm-035': {
    q: 'How do you investigate a {{Metaspace leak}}?',
    a: `**Summary:** {{Metaspace}} stores class metadata. {{Metaspace leak}} happens when {{ClassLoader}} cannot be GC'd (unloaded) because of references, preventing class unloading. Distinguish from heap leak.

### What → Why → How
- **Causes:** Hot redeploy (undeploy app but classloader held), custom ClassLoader, dynamic proxy (CGLib/JDK Proxy), scripts.
- **Signs:** Metaspace usage climbs after redeploy, eventually OOM: Metaspace.
- **Unloading:** Only if ClassLoader is unreachable AND no class is referenced.

### Investigation steps
| Tool | Purpose |
|---|---|
| {{-XX:MaxMetaspaceSize}} | Fail fast |
| {{-Xlog:class+unload*:file=...}} | See if classes are unloading |
| {{jcmd <pid> VM.classloader_stats}} | Count classloaders |
| {{jmap -clstats}} | Analyze classloader tree |
| {{Eclipse MAT}} | Find GC roots for ClassLoader |

### Process
1. Observe Metaspace over time.
2. Take heap dump.
3. Find ClassLoader leak GC roots (Static field, ThreadLocal, Listener).
4. Identify cause (unregister listener, shutdown executor).

### Pitfall
- Confusing heap leak with Metaspace leak.
- Restarting instead of fixing.
- Hot redeploy in production.

### Real-world example
App allowed plugin updates without restart, each created new {{URLClassLoader}}. After 40 updates OOM. {{jcmd VM.classloader_stats}} showed 41 plugin classloaders alive. Heap dump (MAT, GC roots of old classloader) revealed: plugin registered {{ThreadLocal}} and listener in static registry without unregistering — each reference held old classloader. Fix: plugin {{close()}} unregisters listener/ThreadLocal, loader {{close()}} on swap.

### Interview sample answer
"Metaspace stores class metadata, class released only when its classloader is GC'd. Metaspace leak is almost always classloader leak: long-lived reference (static field, ThreadLocal in pool thread, listener, plugin thread) holds object of old classloader, pulling in every class loaded. Common in hot-reload, redeploy, or proxy libraries. I investigate via loaded-class count and Metaspace metrics, jcmd VM.classloader_stats to count classloaders, then heap dump with MAT to find GC-root path to old classloader. Set MaxMetaspaceSize so error surfaces early."

> Senior tip: In production avoid hot redeploy. If using container/app server, ensure every resource released on undeploy. Focus on "who holds the ClassLoader".`
    ,
    follow: ['Difference between PermGen and Metaspace?', 'Why custom ClassLoaders leak?', 'Prevent ClassLoader leaks in web app?']
  },
  'jvm-036': {
    q: 'To start Spring Boot faster on Kubernetes, what are the options and trade-offs?',
    a: `**Summary:** Improving {{startup time}} is critical for autoscaling/cold starts. Techniques: {{AppCDS}}, {{Spring AOT}}, {{CRaC}}, {{GraalVM Native Image}}. Each has trade-offs in build time, image size, memory, and compatibility.

### Options comparison
| Option | Mechanism | Pros | Cons | Use case |
|---|---|---|---|---|
| **CDS/AppCDS** | Archive class metadata, reuse | Easy, little code change, faster | Only optimizes class loading | Common, low risk |
| **Spring AOT** | Build-time bean definitions | Less reflection, faster | Build step, reflection limits | With JVM or native |
| **CRaC** | Checkpoint running JVM, restore | Near instant startup | Needs CRaC support, complex test | Cold start on JVM |
| **GraalVM Native** | AOT compilation to binary | Tiny, instant | Long build, complex reflection | Serverless, startup-critical |

### Practical recommendations
- **Safe default:** JVM + CDS + Spring AOT. Good balance.
- **Fast startup:** CRaC before Native Image. Keeps HotSpot benefits.
- **Native Image:** Only when compatible and startup is critical.

### Pitfall
- Native Image + Hibernate: reflection configuration nightmare.
- Measuring "JVM started" instead of "time to first request".
- Only optimizing startup, ignoring steady-state.
- CRaC setup complexity.

### Real-world example
Service started in 38s; HPA slow to scale → 503 error at morning peak.
- **CDS**: 38s → 27s.
- **Lazy init** (for non-essential beans): 27s → 21s (added test for lazy beans).
- **Component scan/Auto-config pruning**: 21s → 17s.
- **GraalVM Native**: 0.3s startup, RAM -60%, but build +9 mins, reflection issues, throughput -15% → kept JVM.
Added minReplicas, 503 gone.

### Interview sample answer
"I measure where time goes, then choose based on cost. CDS is cheapest, saves class parsing, no code change. Then I prune component scan, auto-config, use lazy init for heavy non-essential beans, with test to ensure they work. Spring AOT and GraalVM Native give instant startup/low RAM but build slow, reflection needs configuration, steady-state throughput can be lower than JIT. CRaC snapshots warm state. On K8s, I combine these with proper startup/readiness probe, and minReplicas instead of relying purely on fast startup."

> Senior tip: Measure first (startup time, memory, throughput). Enterprise apps usually fine with JVM + CDS + AOT. Native Image value only when cold start is critical and build/test investment is justified.`
    ,
    follow: ['Startup time vs time to first request?', 'Why CRaC can be better than Native Image?', 'Native Image with Spring Data JPA/Hibernate?']
  }
});
