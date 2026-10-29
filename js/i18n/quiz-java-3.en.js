/*
 * English translation of js/data/quiz-java.js — task T421. Format: js/core/i18n.js (content overlay).
 * ids: qz-concurrency-011 qz-concurrency-012 qz-concurrency-013 qz-concurrency-014 qz-concurrency-015 qz-concurrency-016 qz-concurrency-017 qz-concurrency-018 qz-concurrency-019 qz-concurrency-020 qz-jvm-007 qz-jvm-008 qz-jvm-009 qz-jvm-010 qz-jvm-011 qz-jvm-012 qz-jvm-013 qz-jvm-014 qz-jvm-015 qz-jvm-016 qz-jvm-017 qz-jvm-018
 */
App.i18n.content({
  "qz-concurrency-011": {
    "q": `Why is the following double-checked locking implementation **broken** according to the Java Memory Model?
~~~java
class Config {
    private static Config instance;           // missing volatile
    private final Map<String, String> props;  // populated in the constructor
    static Config get() {
        if (instance == null) {
            synchronized (Config.class) {
                if (instance == null) instance = new Config();
            }
        }
        return instance;
    }
}
~~~`,
    "options": [
      `Two instances can be created, because synchronized does not stop a second thread`,
      `A thread reading at the first check (outside synchronized) can see a non-null instance while the object's non-final fields have not been fully written yet`,
      `It causes a deadlock if the constructor throws an exception`,
      `It is not broken on x86, so no fix is needed`
    ],
    "explain": `**Correct answer: another thread may see a partially initialized object.**

### Why it is correct
{{instance = new Config()}} consists of three steps: allocate memory, run the constructor (write the fields), assign the reference. The compiler/CPU is allowed to **reorder** these so that the reference is published before the writes made inside the constructor become visible to another thread. Thread B reads {{instance}} **outside** synchronized, so there is no happens-before edge with thread A → it may see a "half-built" object.
Fix: declare {{private static volatile Config instance}} (a volatile write happens-before a volatile read), or use the holder idiom / an enum.
(In this example {{props}} is final, so the JMM guarantees it through final field semantics; but every non-final field, and every object those fields point to, is not covered.)

### Why the other options are wrong
- **Two instances**: the second check inside synchronized already prevents this.
- **Deadlock**: the exception simply unwinds out of the synchronized block and releases the lock normally.
- **x86 is safe**: x86 has a stronger memory model, but the **JIT is still allowed to reorder** instructions; and the code must also be correct on ARM (Graviton, Apple Silicon).

> Senior tip: the simplest correct approach is the **holder idiom** (a {{private static class Holder}} holding {{static final Config I = new Config();}}): JVM class initialization guarantees thread safety and lazy loading. In Spring, a singleton bean already does this for you.`
  },
  "qz-concurrency-012": {
    "q": `A worker processes messages from a queue. After calling {{executor.shutdownNow()}} the worker **does not stop**. Why, and how do you fix it?
~~~java
while (true) {
    try {
        Task t = queue.take();
        handle(t);
    } catch (InterruptedException e) {
        log.warn("interrupted", e);
    }
}
~~~`,
    "options": [
      `shutdownNow only cancels tasks that have not started; it never affects a running task`,
      `queue.take() does not respond to interrupts, so you have to use poll() with a timeout`,
      `The catch block swallows InterruptedException (the interrupt flag is already cleared when the exception is thrown) and loops again; you must call Thread.currentThread().interrupt() and break out of the loop`,
      `You need to call Thread.stop() because interrupt is only a hint`
    ],
    "explain": `**Correct answer: the InterruptedException is swallowed.**

### Why it is correct
{{shutdownNow()}} calls {{interrupt()}} on the worker threads. A {{queue.take()}} that is blocked throws {{InterruptedException}} and **clears the interrupt flag**. The catch block only logs and goes back to the loop → {{take()}} blocks again as if nothing had happened. Fix:
~~~java
} catch (InterruptedException e) {
    Thread.currentThread().interrupt(); // restore the flag for the code above
    return;                             // exit so the thread can terminate
}
~~~

### Why the other options are wrong
- **Never affects a running task**: shutdownNow interrupts the threads that are running tasks; whether a task stops depends on whether it responds to the interrupt.
- **take() does not respond to interrupts**: {{take()}} is exactly the method that can be interrupted (it declares throws InterruptedException).
- **Thread.stop()**: unsafe (it releases every lock midway); since Java 20 it always throws {{UnsupportedOperationException}}.

> Senior tip: the rule is: either **propagate** the InterruptedException or **restore the flag**; never swallow it. Kubernetes pods that cannot shut down within {{terminationGracePeriodSeconds}} and are then SIGKILLed (losing the message being processed) are usually caused by exactly this bug.`
  },
  "qz-concurrency-013": {
    "q": `A request counter is incremented by **16 threads**, one million times each; the total is only read after every thread has {{join()}}ed. Which approaches give the **correct result** of 16,000,000? (Choose 3)`,
    "options": [
      `volatile long count; every thread calls count++`,
      `AtomicLong count; every thread calls count.incrementAndGet()`,
      `LongAdder count; every thread calls count.increment(), and count.sum() is read at the end`,
      `long count; every increment is wrapped in synchronized (LOCK) { count++; } where LOCK is one shared static object`,
      `long count; every thread wraps count++ in synchronized (Thread.currentThread())`,
      `ThreadLocal<Long> count; every thread increments its own value, and main reads count.get()`
    ],
    "explain": `**Correct answer: AtomicLong, LongAdder, and synchronized on one shared lock.**

### Why it is correct
{{count++}} is three steps: read, add, write; two interleaving threads lose updates. You need **atomicity**:
- {{AtomicLong.incrementAndGet}}: a CAS loop (lock-free).
- {{LongAdder}}: splits the value across several cells, so each thread normally increments its own cell with little contention; {{sum()}} after all joins gives the exact result. Fastest under high contention.
- {{synchronized}} on **the same** object: mutual exclusion plus happens-before.

### Why the other options are wrong
- **volatile + count++**: volatile only guarantees visibility; it does not turn read-add-write into a single atomic step → lost updates.
- **synchronized(Thread.currentThread())**: every thread locks a **different** object, so there is no mutual exclusion at all.
- **ThreadLocal**: each thread has its own copy; main can only read main's copy (null), and the other copies are never merged.

> Senior tip: metrics counters (Micrometer) use a LongAdder-style approach because they are written often and read rarely. But LongAdder cannot replace AtomicLong when you need an exact value **immediately after each increment** (id generation, rate limiting). And every one of these solutions is correct only **within a single JVM**; with several instances you need a DB/Redis INCR.`
  },
  "qz-concurrency-014": {
    "q": `A cache uses {{ConcurrentHashMap.computeIfAbsent(key, k -> callRemoteApi(k))}}, and each API call takes ~2 seconds. Under high load, requests for **other keys** (already present in the map or not) also slow down. Which explanation is the most accurate?`,
    "options": [
      `ConcurrentHashMap locks the entire map for the duration of compute`,
      `ConcurrentHashMap is split into 16 fixed segments as in Java 7, so 1/16 of the keys are blocked`,
      `computeIfAbsent always calls the mapping function, even when the key already exists`,
      `The mapping function runs while holding a bin lock; other updates on the same bin (and resizing) must wait the full 2 seconds, so the mapping function must be short`
    ],
    "explain": `**Correct answer: the mapping function runs while holding the bin lock.**

### Why it is correct
Since Java 8, ConcurrentHashMap locks at the **bin** level (synchronized on the first node of a bin, CAS when the bin is empty). {{computeIfAbsent}} guarantees that the mapping function runs **atomically, at most once** per key, so it has to hold the bin lock for the whole time the function runs. The Javadoc states it explicitly: other updates may be blocked while the computation runs, so the function must be **short and simple**. Keys that hash into the same bin, and table resize operations, all have to wait the 2 seconds.
Fix: cache a {{CompletableFuture}} instead ({{computeIfAbsent(k, x -> CompletableFuture.supplyAsync(..., ioPool))}}) so the function returns immediately, or use a Caffeine {{AsyncLoadingCache}}.

### Why the other options are wrong
- **Locks the whole map**: only the affected bin is locked; reads ({{get}}) do not lock.
- **16 segments**: that was the Java 7 design, removed in Java 8.
- **Always calls the function**: the function only runs when the key is absent (or maps to null).

> Senior tip: one more trap: calling {{computeIfAbsent}} **recursively** on the same map inside the mapping function can throw {{IllegalStateException("Recursive update")}} or hang. Never do I/O, and never modify the map itself, inside compute/merge.`
  },
  "qz-concurrency-015": {
    "q": `An endpoint uses {{orders.parallelStream().map(this::callRemoteApi)}} (each I/O call takes 200 ms). With 50 concurrent requests, the **whole application** slows down, including code that uses {{CompletableFuture.supplyAsync(...)}} without passing an executor. Why?`,
    "options": [
      `Both use ForkJoinPool.commonPool (by default the number of cores minus one thread); its threads get blocked on I/O, so every other task has to queue`,
      `Parallel stream creates a new thread for each element and exhausts memory`,
      `commonPool has no thread limit, so there is too much context switching`,
      `parallelStream always keeps results ordered, so it holds a global lock`
    ],
    "explain": `**Correct answer: contention on ForkJoinPool.commonPool.**

### Why it is correct
Parallel streams and {{CompletableFuture.*Async}} without an executor both run on the **commonPool** shared by the entire JVM, whose default size is {{availableProcessors() - 1}} (on a 2-vCPU pod that leaves just 1 thread!). This pool is designed for short **CPU-bound** work. Doing 200 ms of I/O in it blocks the workers, and every other task using commonPool has to wait.

### Why the other options are wrong
- **One thread per element**: a parallel stream splits the work with work-stealing across a fixed number of threads.
- **No thread limit**: the opposite is true; commonPool is very small.
- **A global lock to keep order**: order is preserved by joining results along the split structure, with no global lock needed.

> Senior tip: the rule is: parallel streams only for CPU work on large data, never for I/O. For I/O use a dedicated, bounded executor (or virtual threads on Java 21) with timeouts. You can tune {{-Djava.util.concurrent.ForkJoinPool.common.parallelism}}, but that only treats the symptom.`
  },
  "qz-concurrency-016": {
    "q": `A team is about to migrate an I/O-bound service to virtual threads (Java 21+). Which statements are **correct**? (Choose 3)`,
    "options": [
      `You should not pool virtual threads; create a new one per task, for example Executors.newVirtualThreadPerTaskExecutor()`,
      `Virtual threads speed up CPU-bound work such as encryption or data compression`,
      `To limit concurrent access to the DB or a partner API, use a Semaphore or the connection pool size instead of limiting the number of threads`,
      `Since Java 24 (JEP 491), a virtual thread that blocks inside synchronized no longer pins its carrier thread in most cases`,
      `ThreadLocal is forbidden inside virtual threads`
    ],
    "explain": `**Correct answer: do not pool, limit through Semaphores/resource pools, and JEP 491.**

### Why it is correct
- Virtual threads are very cheap (a few hundred bytes to a few KB of stack on the heap), so you can create millions of them. Pools exist to save an expensive resource — threads — which is no longer needed; a virtual-thread pool also carries stale ThreadLocals from one task to the next.
- Since you no longer limit the number of threads, concurrency limits must sit at the **resource**: {{Semaphore}}, HikariCP {{maximumPoolSize}}, bulkheads.
- JEP 491 (Java 24) lets a virtual thread unmount when it blocks inside {{synchronized}}; pinning still happens while running native code / foreign functions.

### Why the other options are wrong
- **Speeds up CPU-bound work**: virtual threads add no CPU; they only help when a thread **waits** on I/O. CPU-bound work is still limited by the number of cores.
- **ThreadLocal is forbidden**: ThreadLocal still works; it is just memory-hungry with millions of threads. Java 25 has {{ScopedValue}} as an official replacement.

> Senior tip: measure before and after with a load test: the biggest benefit is that simple blocking code reaches nearly reactive throughput. On Java 21, watch the JFR event {{jdk.VirtualThreadPinned}} and libraries that still wrap I/O in synchronized.`
  },
  "qz-concurrency-017": {
    "q": `A consumer occasionally throws {{NoSuchElementException}} from {{queue.remove()}} when there are several consumers. What is the cause?
~~~java
synchronized (lock) {
    if (queue.isEmpty()) {
        lock.wait();
    }
    Item item = queue.remove();
}
~~~`,
    "options": [
      `wait() does not release the lock, so producers cannot add elements`,
      `Using if instead of while: a thread can wake up (spurious wakeup, or another consumer already took the element) while the queue is still empty; the condition must be re-checked in a loop`,
      `You must use notify() instead of notifyAll() so that exactly one consumer is woken`,
      `The queue must be declared volatile`
    ],
    "explain": `**Correct answer: if instead of while.**

### Why it is correct
When a thread is woken up it must **re-acquire the lock** before it continues running. In that window another consumer may already have taken the element. On top of that, the JVM allows **spurious wakeups** (waking up without any notify). So the condition must be re-checked:
~~~java
while (queue.isEmpty()) lock.wait();
~~~
The Javadoc of {{Object.wait}} requires always using wait inside a loop.

### Why the other options are wrong
- **wait does not release the lock**: wait **releases** the monitor while waiting, then re-acquires it on wake-up.
- **notify instead of notifyAll**: it does not eliminate spurious wakeups, and when several kinds of threads wait on the same lock (producers and consumers) it easily wakes the wrong one and hangs.
- **volatile**: every access is already inside synchronized, so visibility is already guaranteed; the bug is in the condition logic.

> Senior tip: in new code you almost never need to hand-write wait/notify: use {{BlockingQueue.take()}}/{{poll(timeout)}} (which handle every case correctly), or {{ReentrantLock}} + {{Condition}} when you need separate wait conditions (notFull/notEmpty).`
  },
  "qz-concurrency-018": {
    "q": `A feature-flag configuration is read about 10,000 times per second from many threads and changes only a few times a day (a full reload from the DB). Which approach is the **simplest and most efficient** way to always read a consistent version?`,
    "options": [
      `Put synchronized on every getter and on the reload method`,
      `A ReentrantReadWriteLock with fairness = true, taking the read lock on every read`,
      `Keep one immutable configuration object in a volatile field (or an AtomicReference); reload by building a new object and swapping the reference`,
      `Use a Collections.synchronizedMap and update keys one by one during reload`
    ],
    "explain": `**Correct answer: immutable snapshot + volatile reference (copy-on-write).**

### Why it is correct
- A read is just one **volatile read**: no lock, no CAS → practically free, and it scales linearly with the number of cores.
- The immutable object is published through a volatile field, so a reading thread sees **all of** the new version or all of the old one, never a half-old/half-new state.
~~~java
private volatile Config current = Config.load();
void reload() { current = Config.load(); } // swap the whole object
boolean enabled(String f) { return current.flags().contains(f); }
~~~

### Why the other options are wrong
- **synchronized on every getter**: correct, but every read contends on one monitor — an unnecessary bottleneck.
- **ReadWriteLock**: the read lock still has to CAS a shared counter (a hot cache line), and fairness makes it slower still; more complex and slower.
- **synchronizedMap updating key by key**: a reading thread can see a **mixed** configuration (some new keys, some old ones) while the reload is in progress.

> Senior tip: this is the pattern used by many libraries (routing tables, config clients). If a reload needs to build on the previous version, use {{AtomicReference.updateAndGet}}. Only consider an optimistic {{StampedLock}} read when the data is too large to copy on every write.`
  },
  "qz-concurrency-019": {
    "q": `According to the Java Memory Model, what does the following code print?
~~~java
int[] data = new int[1];             // not volatile, no synchronized
Thread t = new Thread(() -> data[0] = 42);
t.start();
t.join();
System.out.println(data[0]);
~~~`,
    "options": [
      `It can print 0 because data is not volatile`,
      `It can print 0 when running on ARM because its memory model is weaker than x86`,
      `Compile error: data must be effectively final`,
      `It always prints 42, because every action in t happens-before t.join() returning`
    ],
    "explain": `**Correct answer: it always prints 42.**

### Why it is correct
The JMM defines fixed **happens-before** edges that need no volatile:
- {{t.start()}} happens-before every action in t (t sees everything main did before start).
- Every action in t happens-before a successful **{{t.join()}} return** in another thread.
Therefore, after the join, main is guaranteed to see {{data[0] = 42}}.

### Why the other options are wrong
- **Can print 0**: volatile is unnecessary once a happens-before edge from join exists.
- **ARM**: the JMM is a hardware-independent specification; the JVM inserts the appropriate memory barriers so that join keeps its guarantee on every architecture.
- **Effectively final**: the variable {{data}} (the array reference) is never reassigned, so it is effectively final; a lambda modifying an array element is legal.

> Senior tip: the happens-before edges you use most: unlock → lock on the same monitor, volatile write → volatile read, {{start}}, {{join}}, submitting a task to an executor → the task runs, task completion → {{Future.get()}} returning, and putting into/taking from a {{BlockingQueue}}. Code that uses these tools needs no extra volatile for the data that travels with them.`
  },
  "qz-concurrency-020": {
    "q": `A reconciliation batch job runs in several phases, with N workers per phase. You are choosing the synchronization tools. Which statements are **correct**? (Choose 2)`,
    "options": [
      `CountDownLatch cannot be reset; once the count reaches 0 it is done, and a new round needs a new latch`,
      `CyclicBarrier is reusable: once enough parties reach the barrier it resets itself for the next phase and can run a barrierAction`,
      `A Semaphore only allows the thread that acquired a permit to call release`,
      `CountDownLatch.await() returns as soon as the count drops by one`,
      `CyclicBarrier is the best choice when the number of participating workers changes dynamically between phases`
    ],
    "explain": `**Correct answer: CountDownLatch is one-shot; CyclicBarrier is reusable.**

### Why it is correct
- {{CountDownLatch}}: one or more threads {{await()}} until the count reaches 0; the count can never go back up → use it for a **one-time** event (waiting for N services to start, waiting for N tasks to finish).
- {{CyclicBarrier(parties, barrierAction)}}: N threads wait **for each other** at a rendezvous point; when all have arrived it runs the barrierAction (for example merging the phase results) and then resets itself for the next phase.

### Why the other options are wrong
- **Semaphore**: there is no notion of an owner; any thread may release (which is why an extra release silently increases the permit count — a real bug).
- **await returns when the count drops by one**: it only returns when the count reaches **0** (or on interrupt/timeout).
- **Dynamic number of workers**: a CyclicBarrier has a fixed number of parties; for that case use {{Phaser}} ({{register}}/{{arriveAndDeregister}}).

> Senior tip: always use the timeout variants ({{await(30, SECONDS)}}) in production; one dead worker makes the whole barrier hang forever (the barrier becomes "broken" when a thread is interrupted/times out). For complex workflows, {{CompletableFuture.allOf}} or structured concurrency is usually easier to read.`
  },
  "qz-jvm-007": {
    "q": `A Kubernetes pod has a 2 GiB memory limit and the JVM runs with {{-Xmx2g}}. The pod keeps restarting with status {{OOMKilled}} (exit code 137), but the application log has **no** OutOfMemoryError and heap used is only about 1.5 GB. What is the most likely cause?`,
    "options": [
      `The process total (heap + metaspace + thread stacks + code cache + direct buffers + GC structures) exceeds the limit and the kernel OOM killer kills the process; the heap should be set to about 70–75% of the limit`,
      `The heap is leaking; raising -Xmx to 2.5g fixes it`,
      `Kubernetes kills the pod because a long GC pause makes the liveness probe fail`,
      `The JVM does not recognize the container, so it reads the node's RAM`
    ],
    "explain": `**Correct answer: the process RSS exceeds the limit and the kernel OOM killer steps in.**

### Why it is correct
{{-Xmx}} only caps the **heap**. A JVM process also uses native memory: metaspace, thread stacks (~1 MB × thread count), code cache (JIT), direct ByteBuffers (Netty), GC structures (the G1 remembered set), malloc from native libraries. When total RSS reaches the cgroup limit, the **kernel** sends SIGKILL → exit 137, and the JVM never gets a chance to log OutOfMemoryError or write a heap dump.
Fix: {{-XX:MaxRAMPercentage=70..75}} (leaving 25–30% headroom), cap {{-XX:MaxDirectMemorySize}} and {{-XX:MaxMetaspaceSize}}, and measure with Native Memory Tracking.

### Why the other options are wrong
- **Raise Xmx**: this makes things worse because it leaves less room for native memory.
- **Liveness probe**: a failing probe also causes restarts, but the status would be a liveness failure, not {{OOMKilled}}.
- **Not container-aware**: JDK 10+ (and 8u191+) is container-aware; besides, an explicit {{-Xmx}} overrides any automatic calculation anyway.

> Senior tip: compare {{kubectl top pod}} (RSS) with heap used in Grafana: a gap of a few hundred MB up to over 1 GB is normal. A good baseline: limit = request for memory, heap 70–75%, and an alert when RSS > 90% of the limit.`
  },
  "qz-jvm-008": {
    "q": `An app server hosts several applications; after every **hot redeploy** (without restarting the JVM) Metaspace grows, and after about 10 redeploys you hit {{java.lang.OutOfMemoryError: Metaspace}}. What is the most likely cause?`,
    "options": [
      `The heap is too small; you need to raise -Xmx`,
      `ClassLoader leak: the old deployment's ClassLoader is still referenced (ThreadLocal, a registered JDBC driver, threads that never stop…), so none of its classes can be unloaded`,
      `The string pool is full because too many strings are interned`,
      `Thread stacks are too large; you need to reduce -Xss`
    ],
    "explain": `**Correct answer: ClassLoader leak.**

### Why it is correct
A class can only be unloaded once the **ClassLoader** that loaded it is no longer reachable. On every redeploy the server creates a new ClassLoader and loads all the classes into Metaspace again. If even **one reference** from the outside points at any object/class of the old deployment, the whole old ClassLoader and its thousands of classes are retained. The usual culprits:
- A {{ThreadLocal}} on a server thread holding objects from the old app.
- A JDBC driver registered in the {{DriverManager}} (which lives in the parent ClassLoader).
- Threads created by the app (scheduler, timer) that are never stopped.
- Shutdown hooks, MBeans, static caches in shared libraries.

### Why the other options are wrong
- **Raise Xmx**: Metaspace is a **native** region, separate from the heap; Xmx has no effect on it.
- **String pool**: since Java 7 the String pool lives on the **heap**; when it fills you get "Java heap space".
- **Reduce -Xss**: thread stacks are not in Metaspace; the related failure would be "unable to create native thread" or StackOverflowError.

> Senior tip: diagnose with {{jcmd <pid> VM.classloader_stats}}, then a heap dump → MAT "Duplicate Classes" and the Path to GC Roots of the old ClassLoader. Set {{-XX:MaxMetaspaceSize}} so the problem surfaces early instead of eating all the RAM. This is one reason the container model "one app per JVM, deploy = restart" replaced hot redeploys.`
  },
  "qz-jvm-009": {
    "q": `GC log (JDK 17, G1, {{-Xmx4g}}) of a service during peak hours:
~~~text
[120.512s][info][gc] GC(311) Pause Young (Normal) (G1 Evacuation Pause) 3890M->3850M(4096M) 45.123ms
[121.020s][info][gc] GC(312) Pause Young (Normal) (G1 Evacuation Pause) 3990M->3960M(4096M) 52.871ms
[121.433s][info][gc] GC(313) Pause Full (G1 Compaction Pause) 4090M->3980M(4096M) 2843.552ms
~~~
Which conclusion is the most accurate?`,
    "options": [
      `Young GC runs too often; enlarging the young generation is enough`,
      `Full GC is normal with G1 and will stop by itself after warm-up`,
      `The live set is close to max heap: each GC reclaims very little and leads to a nearly 3-second Full GC; suspect a memory leak or an undersized heap, and take a histogram/heap dump`,
      `A 45 ms pause is too long, so switch to Serial GC`
    ],
    "explain": `**Correct answer: the live set is close to max heap.**

### Why it is correct
Read each line in the form {{before->after(total)}}:
- Young GC reclaims only 40 MB and 30 MB: most objects survive, and the heap **after GC** is still around 3.85–3.96 GB out of 4 GB.
- Full GC (single-threaded over the whole heap, stop-the-world for 2.8 seconds) still leaves 3.98 GB → the **real live data** takes up almost the entire heap.
This is the signature of a **memory leak** (a live set that grows over time) or a heap that is too small for the load. Next steps: compare {{jcmd <pid> GC.class_histogram}} at two points in time, and take a heap dump to analyze in MAT. An OutOfMemoryError: Java heap space is coming.

### Why the other options are wrong
- **Enlarge the young gen**: the problem is long-lived objects in the old gen, not how often young GC runs.
- **Full GC is normal**: with G1, Full GC is a **fallback after a failure** (it could not evacuate), always a bad sign.
- **Serial GC**: Serial's pauses on a 4 GB heap are far longer.

> Senior tip: the most important metric in a GC log is **heap after GC** over time (the bottom of the sawtooth). A rising bottom line means a leak; a flat but high bottom line means you need more heap or need to hold less data in memory. Also enable {{-XX:+HeapDumpOnOutOfMemoryError}} so you have evidence.`
  },
  "qz-jvm-010": {
    "q": `A colleague benchmarks with a {{for}} loop of one million iterations plus {{System.nanoTime()}}, and concludes that method A is **100 times faster** than B after the first few thousand iterations. On production nobody sees a difference. What is the most likely explanation?`,
    "options": [
      `System.nanoTime is not accurate below a millisecond on Linux`,
      `GC running during the benchmark makes A faster`,
      `Production runs in the interpreter, without JIT`,
      `The JIT optimized the benchmark: A's results are never used, so the work is eliminated (dead code elimination), on top of different warm-up and OSR behaviour; you must measure with JMH and return results through a Blackhole`
    ],
    "explain": `**Correct answer: the JIT eliminates the computation (dead code elimination), plus warm-up effects.**

### Why it is correct
Once the loop is hot, C2 compiles it (via **OSR**, on-stack replacement) and may:
- **Dead code elimination**: A's result is never used → the whole call is removed → "faster" approaches zero.
- **Constant folding/inlining**: the input is constant, so it is precomputed.
- Measure the interpreter/C1 phase for B but only C2 for A (different execution order).
**JMH** handles all these traps: a forked JVM, warm-up iterations, {{Blackhole.consume()}} so results cannot be eliminated, and proper statistics.

### Why the other options are wrong
- **nanoTime is inaccurate**: nanoTime has good resolution (tens of ns) on Linux; that error cannot produce a 100× gap.
- **GC makes A faster**: GC only slows the measurement while it runs; it never makes code faster.
- **Production has no JIT**: HotSpot has tiered JIT enabled by default at all times.

> Senior tip: performance optimization always starts with **profiling production** (async-profiler, JFR) to find the real hot path, and only then a JMH microbenchmark to compare options. Even microbenchmark results should be re-validated with an end-to-end load test.`
  },
  "qz-jvm-011": {
    "q": `A team builds a ~2 GB in-process cache out of {{SoftReference}} because "the GC will clean it up automatically when memory runs low". Production shows the heap always nearly full, GC running constantly, and latency poor and unpredictable. Why?`,
    "options": [
      `A SoftReference is only cleared when the heap is under heavy pressure, so the heap stays nearly full and the GC works constantly; the cache has no explicit eviction policy. Use a size-bounded cache such as Caffeine instead`,
      `SoftReferences are reclaimed on every young GC, so the cache is always empty`,
      `SoftReferences live outside the heap, so the GC cannot control them`,
      `You should use PhantomReference for the cache because its get() is faster`
    ],
    "explain": `**Correct answer: soft references keep the heap full and eviction is uncontrollable.**

### Why it is correct
HotSpot only clears a SoftReference when it **needs memory**, following a heuristic based on how recently the reference was accessed and how much heap is free ({{-XX:SoftRefLRUPolicyMSPerMB}}). Consequences:
- The cache grows until it fills the heap → the GC runs constantly, and each cycle has to process millions of reference objects.
- When things are finally cleared, they are cleared **in bulk** all at once → the hit rate collapses and a thundering herd hits the DB.
- No TTL, and no way to know which entry to drop first.
A cache with a size/TTL bound (Caffeine {{maximumSize}}, {{expireAfterWrite}}) gives stable, measurable behaviour.

### Why the other options are wrong
- **Reclaimed on every young GC**: that is close to **WeakReference** behaviour (cleared when only weakly reachable).
- **Outside the heap**: the referenced object still lives on the heap like any other object.
- **PhantomReference**: {{get()}} **always returns null**; phantom references exist to tell you when an object is collected (cleaning up resources, like {{Cleaner}}), not for caching.

> Senior tip: WeakReference suits metadata tied to another object's life cycle ({{WeakHashMap}} keyed by object). For data caches, always choose explicit eviction and track hit rate and eviction count through metrics.`
  },
  "qz-jvm-012": {
    "q": `What does the following code print?
~~~java
class Config {
    static final int MAX = 10;          // compile-time constant
    static final Integer BOXED = 20;
    static { System.out.print("init "); }
}
// main:
System.out.print(Config.MAX + " ");
System.out.print(Config.BOXED + " ");
~~~`,
    "options": [
      `init 10 20`,
      `10 init 20`,
      `10 20 (the static block never runs)`,
      `init 10 init 20`
    ],
    "explain": `**Correct answer: "10 init 20".**

### Why it is correct
- {{MAX}} is a **constant variable** (static final of a primitive/String type, initialized with a constant expression). javac **inlines** the value 10 into the calling class, so reading MAX never touches class Config → class initialization is not triggered.
- {{BOXED}} is of type {{Integer}}, which is not a constant variable; reading it is a real static field access ({{getstatic}}), one of the triggers for **class initialization** → the static block runs and prints "init", then 20 is printed.
- A class is initialized only once.

### Why the other options are wrong
- **init 10 20**: the class is not initialized when you only read an inlined constant.
- **Never runs**: reading BOXED does trigger it.
- **init twice**: a static initializer runs exactly once per class/ClassLoader.

> Senior tip: constant inlining has real consequences: change {{MAX}} in a library **without recompiling** the calling code and the caller keeps using the old value. Public constants in a shared library should be values that truly never change; read configuration values through a method instead.`
  },
  "qz-jvm-013": {
    "q": `A recursive algorithm walks a category tree 100,000 levels deep (bad data) and causes {{StackOverflowError}}. Which fix is the **most robust**?`,
    "options": [
      `Increase -Xmx to give the stack more memory`,
      `Catch StackOverflowError and retry the recursion`,
      `Convert it to a loop with an explicit ArrayDeque stack (and validate data cycles/depth)`,
      `Rewrite it as tail recursion so the JIT optimizes it into a loop`
    ],
    "explain": `**Correct answer: convert to a loop with an explicit stack.**

### Why it is correct
Every recursive call creates a **stack frame** on the thread stack (a fixed size, ~512 KB–1 MB by default). 100,000 frames exceed that limit. Using an {{ArrayDeque}} on the **heap** means depth is limited only by the heap and is controllable:
~~~java
Deque<Node> stack = new ArrayDeque<>();
stack.push(root);
while (!stack.isEmpty()) {
    Node n = stack.pop();
    visit(n);
    n.children().forEach(stack::push);
}
~~~
You should also check for **cycles** (a visited Set), because abnormally deep data usually comes from a parent loop.

### Why the other options are wrong
- **Increase -Xmx**: Xmx is the heap; the stack is tuned with {{-Xss}} (which merely postpones the failure for larger data and costs RAM for every thread).
- **Catch StackOverflowError**: it is an Error, and the state may already be corrupted midway (locks, finally blocks that never completed); retrying still overflows.
- **Tail recursion**: HotSpot has **no** tail-call optimization.

> Senior tip: recursion whose depth is decided by user input/external data is a DoS hole (deeply nested JSON, XML entities). Modern parsers impose depth limits (Jackson {{StreamReadConstraints.maxNestingDepth}}); do the same for your code.`
  },
  "qz-jvm-014": {
    "q": `A service requires p99 < 10 ms, with a 32 GB heap on Java 21. With G1, GC pauses occasionally reach 150–300 ms. What is the most reasonable choice?`,
    "options": [
      `Switch to Parallel GC for the highest throughput`,
      `Shrink the heap to 4 GB so G1 pauses are shorter`,
      `Set -XX:MaxGCPauseMillis=1 for G1 so pauses always stay under 1 ms`,
      `Try Generational ZGC (-XX:+UseZGC -XX:+ZGenerational on Java 21): pauses are usually under 1 ms, at the cost of extra CPU and some heap headroom; confirm with a load test`
    ],
    "explain": `**Correct answer: try Generational ZGC and measure with a load test.**

### Why it is correct
ZGC does most of its work (mark, relocate) **concurrently** with the application thanks to load barriers and colored pointers; pauses are usually under 1 ms and **do not grow with heap size**. The generational version (JEP 439, Java 21) separates young/old objects, so short-lived objects are reclaimed more efficiently, with less CPU and lower allocation-stall risk than the old ZGC. Java 21 needs {{-XX:+ZGenerational}}; from Java 23 it is the default.
Trade-off: more CPU spent on concurrent GC, throughput may be a few percent lower than G1, and you need heap headroom to avoid allocation stalls.

### Why the other options are wrong
- **Parallel GC**: tuned for throughput, but a full GC stop-the-world on 32 GB can take seconds.
- **Shrink the heap to 4 GB**: may not fit the data, GC runs denser or you get an OOM; it does not address the root cause.
- **MaxGCPauseMillis=1**: it is only a **soft goal**; G1 still has to evacuate with stop-the-world pauses, and setting it too low shrinks the young gen, makes GC run more often, and still misses the goal.

> Senior tip: before changing the GC, confirm that the latency really comes from GC (compare pause timestamps in the GC log with p99, use JFR). Often the culprit is time-to-safepoint, excessive allocation, or lock contention. Roll out GC changes through canaries, comparing p99/p999, CPU and RSS.`
  },
  "qz-jvm-015": {
    "q": `You are putting together a baseline JVM flag set for a Spring Boot service on Java 21 in a container. Which flags are **sensible**? (Choose 3)`,
    "options": [
      `-XX:MaxRAMPercentage=75.0`,
      `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps`,
      `-Xlog:gc*:file=/logs/gc.log:time,uptime:filecount=5,filesize=20M`,
      `-XX:+UseConcMarkSweepGC`,
      `-XX:PermSize=256m -XX:MaxPermSize=512m`
    ],
    "explain": `**Correct answer: MaxRAMPercentage, heap dump on OOM, and rotating GC logs.**

### Why it is correct
- {{MaxRAMPercentage=75}}: the heap is computed from the container's memory limit, leaving ~25% for native memory; it adapts automatically when the limit changes, with no Xmx to edit.
- {{HeapDumpOnOutOfMemoryError}} + a path on a persistent volume (not the container's ephemeral filesystem) so the evidence survives a pod restart.
- {{-Xlog:gc*}} (unified logging, JDK 9+) writes to a file with time decorators and **rotation** of 5 files × 20 MB, at very low cost.

### Why the other options are wrong
- **UseConcMarkSweepGC**: CMS was removed in JDK 14; newer JVMs ignore the flag with a warning, which creates a false impression about which GC is actually running.
- **PermSize/MaxPermSize**: PermGen was replaced by Metaspace in Java 8; the flags are ignored (with a warning). The modern equivalent is {{MaxMetaspaceSize}}.

> Senior tip: add {{-XX:+ExitOnOutOfMemoryError}} so the pod restarts cleanly instead of running on in a broken state, and put the heap dump on a volume with enough space (a dump is roughly the size of the heap). Re-read the effective flags with {{jcmd <pid> VM.flags}} after every JDK upgrade.`
  },
  "qz-jvm-016": {
    "q": `After every deploy, p99 latency is 5–10 times higher for the first 2–3 minutes and then falls back to normal. The GC log is normal. What is the main cause?`,
    "options": [
      `The code still runs in the interpreter/C1 until C2 compiles the hot paths (tiered compilation), plus class loading and cold caches; mitigate with warm-up traffic, CDS/AppCDS, or CRaC`,
      `The JVM runs a full GC over the whole heap right at startup`,
      `The JVM re-verifies bytecode for every request`,
      `Metaspace has to resize after every request`
    ],
    "explain": `**Correct answer: JIT warm-up and cold caches.**

### Why it is correct
HotSpot uses **tiered compilation**: a method starts in the interpreter (the slowest), gets compiled by C1 once it has been called enough times (fast, with profiling), and is compiled by C2 once it is hotter still (deeply optimized using the profile). This takes tens of seconds to a few minutes under real load. At the same time: classes are loaded for the first time (Spring, Jackson, Hibernate), and the connection pool, application caches and CPU caches are all cold.
Mitigations: send warm-up traffic before the readiness probe reports ready, AppCDS (shortens class loading), Spring AOT, CRaC (restore from a warmed-up snapshot), or a GraalVM native image (no warm-up needed, but different peak throughput).

### Why the other options are wrong
- **Full GC at startup**: the normal GC log rules this out.
- **Bytecode verification per request**: verification happens **once**, when the class is linked.
- **Metaspace resizing per request**: metaspace only grows when new classes are loaded, not per request.

> Senior tip: a rolling deploy of many cold pods at once can slow the whole cluster; use a small maxSurge, slow start on the load balancer (ALB slow start mode), and a readiness probe that only turns OK after warm-up. Watch the JFR Compilation/Deoptimization events if latency keeps fluctuating for a long time.`
  },
  "qz-jvm-017": {
    "q": `In Eclipse MAT, a {{HashMap}} object shows a **shallow heap of 48 bytes** but a **retained heap of 1.8 GB**. What does this actually mean?`,
    "options": [
      `The HashMap object itself occupies 1.8 GB`,
      `If this HashMap is garbage collected, about 1.8 GB will be freed (the objects reachable only through it); the next step is to see who holds it via Path to GC Roots`,
      `MAT is wrong, because retained heap is always less than or equal to shallow heap`,
      `1.8 GB is the total of every object the HashMap references, including objects that are also held elsewhere`
    ],
    "explain": `**Correct answer: 1.8 GB would be freed if this object were collected.**

### Why it is correct
- **Shallow heap**: the size of the object itself (header + fields). A HashMap is only a few dozen bytes; the table array and the Nodes are separate objects.
- **Retained heap**: the total size of the set of objects **reachable only through this object** (the dominator tree). Collecting it collects that whole set with it.
A large retained size is the number-one leak suspect. Next step: "Path to GC Roots (exclude weak/soft references)" to find which static field or thread holds the HashMap.

### Why the other options are wrong
- **The object itself occupies 1.8 GB**: confusing shallow with retained.
- **Retained ≤ shallow**: the opposite is true; retained is always **≥** shallow because it includes the object itself.
- **Including objects held elsewhere**: objects still reachable through another path are **not** counted in the HashMap's retained size (because collecting the HashMap would not free them).

> Senior tip: the standard workflow: Leak Suspects report → Dominator Tree sorted by retained → Path to GC Roots → read the code that holds the reference. Compare two heap dumps taken a few hours apart (histogram diff) to see which class keeps growing. Heap dumps contain real data (PII, tokens), so treat them as sensitive data.`
  },
  "qz-jvm-018": {
    "q": `A service uses Netty and runs with {{-Xmx3g}}. The process RSS keeps growing to 6 GB while heap used is only about 1 GB. What is the **most sensible** investigation step?`,
    "options": [
      `Take a heap dump, because all Java memory lives on the heap`,
      `Lower -Xmx to 1 GB so RSS drops with it`,
      `Enable Native Memory Tracking (-XX:NativeMemoryTracking=summary), take a baseline, then use jcmd VM.native_memory summary.diff over time; also watch the BufferPool MXBean to check direct buffers`,
      `Increase -Xss to reduce the number of threads`
    ],
    "explain": `**Correct answer: use Native Memory Tracking and watch direct buffers.**

### Why it is correct
The gap between RSS and heap is **native** memory. NMT breaks it down by category (Java Heap, Class/Metaspace, Thread, Code, GC, Internal/Other…) and {{summary.diff}} against the baseline shows which category is **growing**:
~~~bash
jcmd <pid> VM.native_memory baseline
# a few hours later
jcmd <pid> VM.native_memory summary.diff
~~~
With Netty, the number-one suspect is an unreleased **direct ByteBuffer** (a ByteBuf leak); look at the BufferPool MXBean "direct" counters and enable {{-Dio.netty.leakDetection.level=advanced}} in a test environment. Note that NMT does not see memory that native libraries malloc themselves; for that use jemalloc or async-profiler in native mode.

### Why the other options are wrong
- **Heap dump**: the heap only uses 1 GB; the dump shows only tiny {{DirectByteBuffer}} objects and not the native region they point to.
- **Lower Xmx**: it does not touch the native part that is growing, and it may cause a heap OOM.
- **Increase -Xss**: it increases the stack for every thread, raising RSS further, and does not reduce the thread count.

> Senior tip: NMT costs roughly 5–10% throughput at the summary level; enable it temporarily while investigating. Set {{-XX:MaxDirectMemorySize}} so a direct-buffer leak surfaces as a clear OutOfMemoryError instead of a silent OOMKilled.`
  }
});
