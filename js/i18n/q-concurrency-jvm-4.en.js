/*
 * English translation of js/data/q-concurrency-jvm.js — task T170.
 * ids: jvm-014 jvm-015 jvm-016 jvm-017 jvm-018 concurrency-021 concurrency-022 concurrency-023
 */
App.i18n.content({
  'jvm-014': {
    q: `Native Memory Tracking: RSS is much larger than heap — metaspace, thread stack, direct buffer, code cache, glibc malloc arenas. How do you analyze it?`,
    a: `**Summary:** Java process RSS includes heap plus native memory allocated by the JVM (metaspace, code cache, thread stack, GC data structures, symbols, direct buffer...), plus native parts the JVM does not track (JNI libraries, malloc overhead and fragmentation). NMT ({{-XX:NativeMemoryTracking=summary}}) only shows JVM-allocated parts. Procedure: enable NMT, take a baseline, after a few hours view {{summary.diff}} to see which category grew. If total NMT committed is stable but RSS still increases, suspect parts outside NMT, usually glibc malloc arena or native libraries.

### Main categories in NMT
| Category | Content | Unusual growth when |
|---|---|---|
| Java Heap | Heap | Committed up to Xmx is normal |
| Class | Metaspace + compressed class space | Class loader leak, dynamic class generation (proxy, script engine) |
| Thread | Platform thread stack | Thread count increases (unbounded pool, threads never terminate) |
| Code | JIT code cache | Usually stable; default 240 MB with tiered compilation |
| GC | Card table, remembered set, mark bitmap | Large heap, large G1 remembered set |
| Other (JDK 11+) | Direct ByteBuffer, Unsafe.allocateMemory | NIO/Netty not releasing buffers |
| Arena Chunk | HotSpot internal arena (compiler...) | Spike during JIT compilation of large methods |

Note: "Arena Chunk" is HotSpot's own arena, **not** glibc malloc arena. The glibc overhead does not appear in NMT.

### Operations
~~~bash
# Can only be enabled at startup, not while running
java -XX:NativeMemoryTracking=summary -jar app.jar

jcmd <pid> VM.native_memory baseline
# ... after a few hours
jcmd <pid> VM.native_memory summary.diff

# Compare with actual RSS: largest regions
pmap -x <pid> | sort -k3 -n | tail -20
~~~
- summary has small overhead; detail records allocation call stacks and costs more, only use when needed to know who allocates.
- Cross-check: RSS ≈ NMT committed + parts outside NMT. Large and growing gap means the problem is outside the JVM.

### Each root cause
1. **Thread growth**: count threads with {{jcmd <pid> Thread.print}} or metric {{jvm.threads.live}}. Each platform thread reserves {{-Xss}} (default 1 MB on Linux x64) but only commits pages actually used.
2. **Class growth**: class loader leak, CGLIB/ByteBuddy generating classes continuously; inspect with {{jcmd <pid> VM.metaspace}}. Set {{-XX:MaxMetaspaceSize}} helps expose the leak early, but the root cause must still be fixed.
3. **Other growth**: direct buffer. {{-XX:MaxDirectMemorySize}} defaults to max heap. Netty has its own counter and limit ({{io.netty.maxDirectMemory}}) and may allocate outside JDK's counter; enable Netty leak detector ({{-Dio.netty.leakDetection.level=paranoid}}) in test environments.
4. **NMT stable but RSS still growing**: glibc malloc fragmentation and arena. Threads allocating heavily may be assigned separate arenas (default 8 × core count on 64-bit), each arena retains freed memory. Try {{MALLOC_ARENA_MAX=2}} or change allocator (jemalloc) and compare. Native libraries belong here too, e.g. {{Inflater}}/{{GZIPInputStream}} not closed will hold zlib memory.

### Container
On Kubernetes, pods get OOMKilled (exit 137) when RSS exceeds the memory limit, and at that point the JVM throws no OutOfMemoryError. Therefore heap should only occupy part of the limit; leave room for the above categories.

> Senior tip: the formula I use is RSS = heap + NMT outside-heap + outside-NMT, and always compute all three before concluding. Common case: 4 GB pod gets OOMKilled despite heap at 2.5 GB; NMT shows Thread taking a few hundred MB because an HTTP client creates a new thread per request. That requires code fix — increasing memory limit only delays the failure.`,
    follow: [
      'Why does glibc malloc arena inflate RSS, and what trade-off does MALLOC_ARENA_MAX involve?',
      'How do NMT summary and detail differ, and when is detail needed?',
      'Pod is OOMKilled but logs contain no OutOfMemoryError — how do you investigate?'
    ]
  },
  'jvm-015': {
    q: `JVM flags baseline for a Spring Boot service on container: heap %, GC, OOM dump, GC log, exit on OOM — reason for each flag?`,
    a: `**Summary:** The baseline for a containerized Spring Boot service must protect against silent failures and make production debugging possible with minimal overhead. Each flag answers a specific failure mode.

### Recommended flags

| Flag | Purpose | Why it matters |
|---|---|---|
| {{-XX:+UseContainerSupport}} | Auto-adjust heap/GC to container limits | Prevents JVM from seeing host RAM instead of cgroup limit |
| {{-XX:MaxRAMPercentage=75.0}} | Heap cap relative to container memory | Leaves headroom for native/metaspace/thread/GC overhead; 75% is the safe default |
| {{-XX:+UseG1GC}} | Low-pause collector with predictable latency | Default for JDK 17+/21+; handles large heaps well |
| {{-XX:+HeapDumpOnOutOfMemoryError}} | Write heap dump on OOM | Without it you only get Exit code 137 and guess; dump allows MAT/YourKit analysis |
| {{-XX:HeapDumpPath=/dumps}} | Path for dumps | Must be a volume, not container layer, or it disappears on restart |
| {{-XX:+ExitOnOutOfMemoryError}} | Crash JVM immediately on OOM | Prevents a zombie service that responds slowly or corrupts state; Kubernetes restarts the pod |
| {{-Xlog:gc*:file=/logs/gc.log::filecount=5,filesize=100m}} | GC log with rotation | JDK 11+ unified logging; 5×100 MB avoids unbounded disk growth |
| {{-XX:+AlwaysPreTouch}} | Touch all heap pages at startup | Avoids runtime allocation stalls from the OS; important for latency-sensitive services |

### Deep explanation
- **Heap % not fixed MB:** containers are resized by HPA; fixed {{-Xmx}} breaks when the pod is scaled or moved. Percentage adapts.
- **ExitOnOutOfMemoryError vs catching:** catching {{OutOfMemoryError}} in Java is risky because the JVM may be in a partially finished state; for stateless services, crash-and-restart is safer.
- **GC log rotation:** without rotation, long-running pods fill the node disk; filecount/filesize ensures bounded footprint.
- **AlwaysPreTouch cost:** startup is slower because all pages are committed; trade-off is worth it for latency-sensitive APIs.

### When to change
- If using ZGC/Shenandoah for sub-millisecond pauses, replace G1; otherwise keep G1.
- If native memory is high (see jvm-014), lower MaxRAMPercentage to 65% and investigate before tuning GC.

> Senior tip: I never set a fixed {{-Xmx}} in Kubernetes; always {{MaxRAMPercentage}} + {{UseContainerSupport}}, and I always mount /dumps as an emptyDir volume with enough space (at least heap size × 1.2). The most common production mistake is missing {{HeapDumpPath}} and finding only Exit 137 with no evidence.`,
    follow: [
      'Why use MaxRAMPercentage instead of fixed Xmx in containers?',
      'ExitOnOutOfMemoryError — when is crash safer than catching?',
      'GC log rotation settings and how they prevent node disk exhaustion'
    ]
  },
  'jvm-016': {
    q: `Reference types: Soft/Weak/Phantom, {{ReferenceQueue}}, why is SoftReference cache a bad idea?`,
    a: `**Summary:** SoftReference lets the GC reclaim the referent when memory is low, which sounds like a cache — but the JVM gives no timing guarantee, so it behaves unpredictably under load and can cause sudden latency spikes instead of graceful degradation.

### Reference types comparison

| Type | GC behavior | Typical use |
|---|---|---|
| Strong | Never collected while reachable | Normal objects |
| Soft ({{SoftReference}}) | Collected when memory is low | Old-style caches; not recommended |
| Weak ({{WeakReference}}) | Collected at next GC cycle if no strong refs | Canonical mappings (e.g. class-level caches) |
| Phantom ({{PhantomReference}}) | Collected after finalization; used for pre-cleanup | Tracking object lifecycle / resource cleanup |

### Why SoftReference is a bad cache
- **No eviction policy:** the JVM decides when to clear, not your code. Under sudden load, all entries may vanish at once, causing a thundering herd of backend calls.
- **Latency spikes:** clearing happens during GC pauses; you cannot predict when it occurs, making p99 unstable.
- **Memory pressure is not the only signal:** soft refs stay until an OOM is near, so they provide little benefit over an explicit LRU with size/count limits.
- **ReferenceQueue is required for cleanup:** if you use weak/phantom refs for resources (direct buffers, native handles), you must poll the queue; otherwise you leak native resources.

### Better patterns
- **Guava Cache / Caffeine:** explicit size/expire policies, statistics, and async refresh; predictable eviction.
- **Explicit LRU with metrics:** you control max entries and can log hits/misses; easier to tune.
- **PhantomReference for direct buffers:** when a ByteBuffer is no longer strongly reachable, you can release native memory via the queue before GC finalizes it.

### Code snippet: WeakReference with queue
~~~java
ReferenceQueue<Object> rq = new ReferenceQueue<>();
WeakReference<Object> ref = new WeakReference<>(obj, rq);
// Poll queue to know when to release associated resource
Reference<? extends Object> cleared = rq.poll();
if (cleared != null) { /* clean up */ }
~~~

> Senior tip: I have seen production outages where a SoftReference-backed metadata cache cleared during a GC event and every request hit the database; switching to Caffeine with a max-size of 10k and 5-minute expiry fixed both memory and latency predictability. If you need native cleanup, always pair PhantomReference with a blocking queue poll, never rely on finalizers.`,
    follow: [
      'How does ReferenceQueue work with Weak/Phantom references?',
      'When should PhantomReference be used instead of finalizers?',
      'Why does SoftReference cause unpredictable latency under load?'
    ]
  },
  'jvm-017': {
    q: `Startup time: CDS/AppCDS, Spring AOT, CRaC, GraalVM native — compare and when is it worth doing?`,
    a: `**Summary:** Startup optimization is a trade-off: faster boot usually means fewer runtime优化 options (reflection, dynamic proxies, JIT warmup) or higher build complexity. Choose based on scale and deployment frequency.

### Comparison table

| Approach | Startup improvement | Trade-off / cost | Best when |
|---|---|---|---|
| CDS / AppCDS | 30-50% class loading | Needs archive creation; limited to same JDK version | Large apps with many classes; easy to add to build |
| Spring AOT | 50-70% boot; lower memory | Requires compile-time proxy/config; loses some runtime flexibility | Microservices restarted often (K8s HPA, rolling updates) |
| CRaC (Coordinated Restore at Checkpoint) | Near-instant (milliseconds) | Requires checkpoint after warm-up; not portable across hosts; JVM pauses at restore | Stateful long-running services with stable config |
| GraalVM Native Image | Sub-100ms; very low memory | Long build (~minutes); reflection/logging need explicit config; no JIT optimization at runtime | Serverless / FaaS / CLI tools; very high deployment frequency |

### Details
- **CDS:** the JVM dumps loaded classes to a shared archive; on restart it maps the archive instead of parsing bytecode. AppCDS extends this to application classes. It is safe and low-risk.
- **Spring AOT:** at build time, Spring generates native configurations and proxies, removing runtime reflection. It requires using Spring Boot 3.x and may break libraries relying on runtime bytecode generation.
- **CRaC:** you start the app, let it warm up, call {{jdk.crac}}, then snapshot memory. On restore, the process resumes from that state. It is powerful but requires coordinated checkpointing and does not work well if the environment (IP, host, secrets) changes.
- **GraalVM Native:** compiles to a native executable with a minimal runtime (Substrate VM). It eliminates JIT warmup entirely but requires all reflection/proxy/config to be declared at build time; some frameworks need special adapters.

### When to do it
- **CDS:** always worth it for large services; minimal downside.
- **Spring AOT:** if you deploy 10+ times per day or use aggressive HPA; measure before committing because some libraries need adjustments.
- **CRaC:** if startup time is critical and your service can warm up deterministically; avoid if you rely on dynamic secrets or host-specific config.
- **GraalVM Native:** only when startup latency is the dominant metric (e.g., edge functions, CLI); not for long-lived services that benefit from JIT optimization over hours.

> Senior tip: I start with CDS because it is zero-risk, then measure with Spring AOT if boot time is still a bottleneck. I never choose GraalVM Native for a typical REST service just for startup — the build complexity and lost runtime optimization usually cost more than they save, unless it is a serverless function with cold-start penalties.`,
    follow: [
      'How does AppCDS differ from basic CDS?',
      'What are the limitations of CRaC across different hosts?',
      'When does GraalVM Native lose to JIT over a long-running service?'
    ]
  },
  'jvm-018': {
    q: `async-profiler: CPU vs wall-clock vs alloc vs lock mode, how do you read the flame graph to find the hot path?`,
    a: `**Summary:** async-profiler samples at low overhead and can profile CPU, wall-clock, allocations, and locks; the flame graph shows the stack where time was spent, with width representing proportion; the hot path is the widest bottom-up path from the root.

### Modes comparison

| Mode | What it measures | When to use |
|---|---|---|
| CPU | Actual CPU time (not sleeping) | Finding computation bottlenecks; hotspot method optimization |
| Wall-clock | Real elapsed time including wait | Identifying latency caused by blocking (DB, network, locks) |
| Alloc | Object allocations | Memory pressure; finding unnecessary temporary objects |
| Lock | Lock contention time | Finding synchronization bottlenecks; thread blocking |

### Reading the flame graph
- **Vertical axis = stack depth:** bottom is the entry point (main / thread pool); top is the deepest call.
- **Width = proportion of sampled time:** wider bars mean more time spent there.
- **Hot path rule:** start from the widest bottom frame and follow upward where width stays high; that is the critical chain.
- **Color (optional):** some tools color by package; use it only as a hint, not a rule.

### Specific reading tips
- If CPU mode shows a wide bar at {{HashMap.put}}, check if the map is oversized or has poor hash distribution.
- If wall-clock mode shows wide bars at {{Thread.sleep}} or JDBC calls, the bottleneck is external, not CPU.
- If alloc mode shows many small objects at the top, the issue is temporary object churn; consider pooling or reducing allocations.
- If lock mode shows a wide bar at a synchronized method, consider finer-grained locking or lock-free structures.

### Basic command
~~~bash
# CPU profile, 30 seconds, output flamegraph
./profiler.sh -d 30 -f flame.html <pid>

# Wall-clock with allocation profiling
./profiler.sh -e wall -d 30 -o flame.html <pid>
~~~

> Senior tip: I always start with wall-clock because it shows what users actually wait for; then switch to CPU to confirm whether the wait is computation or blocking. In one case a service had high CPU but users were fast — the real problem was lock contention visible only in lock mode; CPU profile alone misled us to optimize an already-fast computation.`,
    follow: [
      'How does wall-clock profiling differ from CPU profiling in practice?',
      'When should you use alloc mode vs lock mode?',
      'How do you distinguish blocking wait from slow computation in a flame graph?'
    ]
  },
  'concurrency-021': {
    q: `What states can a Java thread have (NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED)? When do transitions occur, and what can you infer from a thread dump?`,
    a: `**Summary:** Thread states reflect the OS/threading model; in a dump, BLOCKED points to lock contention, WAITING/TIMED_WAITING points to coordination (join, wait, LockSupport), and RUNNABLE does not mean actively executing — it includes threads ready to run and those running on CPU.

### States and transitions

| State | Meaning | Transition trigger |
|---|---|---|
| NEW | Created but not started | After {{new Thread()}} |
| RUNNABLE | Ready or running | After {{start()}}; stays until blocked or terminated |
| BLOCKED | Waiting for a monitor lock | When entering {{synchronized}} block; released when holding thread exits block |
| WAITING | Waiting indefinitely for another thread | After {{Object.wait()}} (no timeout), {{Thread.join()}}, or LockSupport.park without timeout |
| TIMED_WAITING | Waiting with a timeout | After {{sleep()}} (always timed), {{wait(timeout)}}, {{join(timeout)}}, LockSupport.parkNanos |
| TERMINATED | Execution finished | After run/Callable completes; cannot restart |

### Reading a thread dump
- **BLOCKED at line 42 of ClassA:** the thread is stuck trying to enter a synchronized block; find the thread holding the monitor (check for "locked" in its stack) — that is the bottleneck.
- **WAITING on 0x...:** usually {{Object.wait()}}; check what holds the monitor; often a missing {{notify()}} or a long computation before notify.
- **TIMED_WAITING at Thread.sleep:** normal for polling or rate limiting; if excessive, consider event-driven instead of polling.
- **RUNNABLE but high CPU:** confirm with profiling; if it is actually using CPU, the method at the top is the hot path.
- **Many threads in BLOCKED / WAITING:** indicates either a pool that is too large or a synchronization design issue; count them per lock identifier.

### Example inference
If dump shows 80 threads in BLOCKED at {{ConcurrentHashMap.put}} and one thread holding the segment lock doing heavy computation, the fix is not to increase pool size — it is to reduce the computation time inside the locked section or replace with concurrent structures.

> Senior tip: I never count RUNNABLE threads as "busy"; in high-concurrency services, most threads wait on I/O or locks. The useful metric is the ratio of BLOCKED+WAITING to total threads; if it exceeds 70%, the service is lock-bound, not CPU-bound. Always pair dump analysis with a quick profiler run to confirm whether a BLOCKED thread is actually the root cause or just a symptom.`,
    follow: [
      'How do you distinguish BLOCKED from WAITING in a thread dump?',
      'What does a high count of TIMED_WAITING at Thread.sleep imply?',
      'How do you find the thread holding the monitor in a dump?'
    ]
  },
  'concurrency-022': {
    q: `What ways exist to run code on another thread: {{Thread}}, {{Runnable}}, {{Callable}}, {{ExecutorService}}, virtual thread? Why is calling {{run()}} instead of {{start()}} a bug, and which do you choose in a real service?`,
    a: `**Summary:** Thread creation is low-level; ExecutorService abstracts thread lifecycle; virtual threads (JDK 21+) make blocking I/O cheap. Calling {{run()}} executes on the current thread, destroying concurrency and possibly causing deadlock if it expects another thread to release a lock.

### Comparison

| Mechanism | Abstraction level | Thread lifecycle | Return result | Best when |
|---|---|---|---|---|
| {{Thread}} + {{Runnable}} | Low | Manual (start/join) | No | Quick test; never in production code |
| {{Thread}} + {{Callable}} | Low | Manual | Via {{Future}} | Not recommended; use executor |
| {{ExecutorService}} (pool) | High | Managed | Via {{Future}} / {{CompletableFuture}} | All production services; controls concurrency |
| Virtual threads ({{Thread.startVirtualThread}}) | High | Lightweight | Same as above | Many blocking tasks; scale to thousands of concurrent operations |

### Why {{run()}} instead of {{start()}} is a bug
- {{start()}} schedules a new OS/platform thread; {{run()}} executes synchronously on the caller thread.
- If the code expects concurrent execution, it runs sequentially, reducing throughput to zero for that task.
- If the code acquires a lock expecting another thread to release it, running on the same thread can cause deadlock or infinite wait.

### Real service choice
- **Always use an ExecutorService (thread pool):** fixed/thread-cached pools control resource usage; unbounded pools cause OOM under load.
- **Use virtual threads when:** you have thousands of concurrent blocking operations (HTTP clients, DB queries) and want to avoid heavy OS threads; they require JDK 21+ and work best with blocking APIs, not CPU-bound loops.
- **Avoid manual Thread creation:** no queue, no reuse, no graceful shutdown; hard to monitor and control.

### Example: correct executor usage
~~~java
ExecutorService exec = Executors.newFixedThreadPool(4);
Future<String> f = exec.submit(() -> fetchData());
String result = f.get(); // blocks until done; consider timeouts
exec.shutdown();
exec.awaitTermination(30, TimeUnit.SECONDS);
~~~

> Senior tip: I have seen production services create one Thread per request because someone called run() incorrectly; the fix was to replace with a fixed pool of 8 threads and a bounded queue (ArrayBlockingQueue). Virtual threads are powerful, but do not use them for CPU-heavy algorithms — they share a small number of carrier threads and can starve if tasks never yield. Always pair virtual threads with blocking I/O, not compute loops.`,
    follow: [
      'How do virtual threads differ from platform threads in resource usage?',
      'When is a fixed pool better than a cached pool?',
      'What happens if you forget to shut down an ExecutorService?'
    ]
  },
  'concurrency-023': {
    q: `Compare {{Thread.sleep}}, {{Object.wait}}, {{Thread.join}}, and {{Thread.yield}}: which releases the lock, which must be called inside {{synchronized}}, and what bug does using the wrong one cause?`,
    a: `**Summary:** sleep does not release any lock; wait releases the monitor and requires synchronized; join waits for another thread to finish; yield hints the scheduler to switch but has no contract. Using sleep where wait is needed can deadlock; calling wait outside synchronized throws IllegalMonitorStateException.

### Comparison

| Method | Releases monitor lock | Must be in synchronized | What it does | Bug if misused |
|---|---|---|---|---|
| {{Thread.sleep}} | No | No | Pauses current thread for duration | Holding a lock while sleeping blocks everyone; using instead of wait loses coordination |
| {{Object.wait}} | Yes | Yes | Releases monitor; waits for notify/notifyAll | Calling outside synchronized throws exception; missing notify causes permanent wait |
| {{Thread.join}} | No (waits on thread) | No | Waits for target thread to terminate | Calling on self causes deadlock; missing timeout can hang forever |
| {{Thread.yield}} | No | No | Hints scheduler to let others run | No guarantee; relying on it for correctness is non-deterministic |

### Detailed behavior
- **sleep:** the thread pauses but keeps all monitors; if it holds a shared resource, other threads cannot enter. Use only for rate limiting or polling intervals, never inside critical sections.
- **wait:** releases the monitor of the object it is called on; another thread can acquire it and call notify. Must always be inside a synchronized block on the same object. After wake-up, the thread must re-acquire the monitor before continuing.
- **join:** waits for the thread object to terminate; it does not relate to object monitors. Use with a timeout to avoid permanent hangs.
- **yield:** a hint to the OS scheduler; it does not guarantee context switch and does not affect locks. Useful in tight loops when fairness is needed, but never as a synchronization mechanism.

### Common bugs
- **Sleeping inside synchronized:** causes lock starvation; move sleep outside if possible.
- **Wait without notify:** if notify is missed (e.g., due to ordering), the waiting thread hangs; always use condition variables or timeouts.
- **Join on self:** never call {{thread.join()}} from the thread's own run method.

### Example: correct coordination
~~~java
synchronized (lock) {
  while (!condition) {
    lock.wait(); // releases lock, waits
  }
  // do work
} // lock re-acquired automatically
~~~

> Senior tip: I have debugged a deadlock where a thread held a database connection lock and called Thread.sleep(5000) inside synchronized; the fix was to release the lock, perform the sleep, then re-acquire. Another case: a wait() was called without synchronized because someone thought it was like sleep; the IllegalMonitorStateException only appeared under load, making it a classic intermittent production bug. Always verify wait/notify pairs with a timeout and a while-loop for spurious wakeups.`,
    follow: [
      'Why must wait() be paired with a while-loop and not an if?',
      'What is a spurious wakeup and how do you handle it?',
      'How do you avoid deadlock when joining threads that might block on the same resource?'
    ]
  }
});
