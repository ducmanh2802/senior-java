/*
 * English translation of js/data/q-concurrency-jvm.js — task T168. Format: js/core/i18n.js (content overlay).
 * ids: concurrency-014 concurrency-015 concurrency-016 concurrency-017 concurrency-018 concurrency-019 concurrency-020 jvm-001
 */
App.i18n.content({
  'concurrency-014': {
    q: 'ForkJoinPool and work stealing: mechanism, why does parallel stream using commonPool become dangerous on a server?',
    a: `**Summary:** ForkJoinPool gives each worker its own deque: worker pushes/pops its own tasks at one end (LIFO), idle workers "steal" from the other end of another deque (FIFO). Thus almost no shared lock, very suitable for divide-and-conquer. {{ForkJoinPool.commonPool()}} is a static pool shared across the JVM; default parallelism = number of cores − 1. Parallel stream and {{*Async}} methods of CompletableFuture without passing an executor all run on this pool, so a single blocking snippet (JDBC, HTTP) can occupy several workers and slow every other feature using the same pool.

### How work stealing works
1. Task calls {{fork()}}: child task pushed onto the worker’s own deque, can be stolen.
2. Worker pulls from its deque LIFO: the just-forked task is the smallest, data still hot in cache.
3. Worker runs out of work, picks a random other deque and steals from the other end (FIFO). Oldest tasks are usually the largest, so stealing once gets a lot of work, reducing steal attempts.
4. {{join()}} does not sit idle: the worker doing the join will run another task (often the child task itself, or a stolen one). Thus a small pool can handle deep recursion.

Why do owner and thief use different ends? They only collide when the deque is nearly empty, handled by CAS instead of a lock.

~~~java
class SumTask extends RecursiveTask<Long> {
    final long[] a; final int lo, hi;
    SumTask(long[] a, int lo, int hi) { this.a = a; this.lo = lo; this.hi = hi; }
    protected Long compute() {
        if (hi - lo <= 10_000) {                    // small enough for sequential
            long s = 0; for (int i = lo; i < hi; i++) s += a[i]; return s;
        }
        int mid = (lo + hi) >>> 1;
        SumTask left = new SumTask(a, lo, mid);
        left.fork();                                 // left half into deque, may be stolen
        long right = new SumTask(a, mid, hi).compute(); // do right half self
        return right + left.join();
    }
}
~~~

### Why commonPool is dangerous on a server
- **Shared across JVM**: parallel stream, {{CompletableFuture.supplyAsync(fn)}} without executor, {{Arrays.parallelSort}}, and third-party library code all compete for a few workers.
- **Very small**: 4-vCPU pod has only 3 workers. Pods with ≤2 vCPU have parallelism = 1; then CompletableFuture async without executor creates a new thread per task (unbounded), while parallel stream is nearly sequential.
- **Not for blocking**: a worker blocked by JDBC/HTTP cannot do other work. ForkJoinPool only adds threads when code reports ahead via {{ForkJoinPool.managedBlock}}, which JDBC drivers or HTTP clients rarely do.
- Typical scenario: an API calls {{parallelStream()}} and inside the lambda calls HTTP to core banking. At high load workers stall on I/O, all other CompletableFuture async tasks queue up, and unrelated endpoints time out in a chain.

### Doing it right
| Scenario | Approach |
|---|---|
| Many parallel I/O calls | {{supplyAsync(task, ioExecutor)}} with bounded ThreadPoolExecutor, or virtual threads (Java 21) |
| CPU-bound divide-and-conquer | Separate ForkJoinPool, fixed parallelism |
| Parallel stream | Only for CPU-bound over large data; no I/O inside lambda; measure first |

- Parallel stream does not accept an executor. The trick of running it inside {{customPool.submit(...)}} works because of implementation details (the running task’s pool is used for forks), not a specified behavior. Avoid for critical code.
- You can adjust commonPool via system property {{java.util.concurrent.ForkJoinPool.common.parallelism}}, but this is a global knob, not a separation of pools.
- Virtual threads use a **separate** ForkJoinPool as scheduler, not commonPool. Still, if a virtual thread is pinned (e.g., I/O inside synchronized on Java 21), the carrier thread is held just like before.

### Common wrong answers
- "Parallel stream is always faster": with a few thousand elements, split/merge overhead exceeds benefit. Sources like {{LinkedList}} or {{Stream.iterate}} split poorly.
- "commonPool has as many threads as cores": actually core − 1, because the calling thread also participates.

> Senior tip: when reviewing code, I grep {{parallelStream}} and {{supplyAsync}} without passing an executor — these are the two most common paths that leak into commonPool. Expose {{getActiveThreadCount()}} and {{getQueuedSubmissionCount()}} of commonPool as metrics: queue growing during peak hours is the sign someone is blocking inside the pool.`,
    follow: [
      'Why does the worker steal tasks from the FIFO end of the deque instead of the LIFO end?',
      'How do you choose the split threshold for a RecursiveTask?',
      'When should you use ForkJoinPool.managedBlock?'
    ]
  },
  'concurrency-015': {
    q: 'Producer–consumer with {{BlockingQueue}}: backpressure, choosing bounded queue and policy when full (reject, block, drop) — how do you decide?',
    a: `**Summary:** Producer–consumer must use a **bounded** queue, because an unbounded queue only turns the problem "slow" into "OOM". When the queue is full, there are four choices: block the producer ({{put}}), time-limited wait ({{offer}} with timeout), reject immediately ({{offer}} returns false, return 429/503 or switch to persistent store), and drop (only if data is allowed to be lost, such as metrics). The choice depends on two questions: is the producer allowed to slow down, and can data be lost?

### Why bounded is mandatory
- {{LinkedBlockingQueue}} created without capacity uses capacity = {{Integer.MAX_VALUE}}; {{Executors.newFixedThreadPool}} uses the correct bounded type.
- When producer is faster than consumer over time, memory grows until GC pressure causes pauses, then OOM.

### Backpressure strategies
| Strategy | Method | When to use | Risk |
|---|---|---|---|
| Block | {{put}} | Data must not be lost; producer can wait | Cascade slowdown if consumer stalls |
| Timed block | {{offer(e, timeout)}} | Need bounded wait; fail fast after limit | Still blocks briefly |
| Reject | {{offer}} false | Call must return quickly; caller handles retry | Caller must be ready |
| Drop | remove oldest / skip | Metrics, logs, telemetry | Silent data loss if not tracked |

### Choosing the right queue
- **SynchronousQueue**: zero buffer, direct handoff; best when producer and consumer rates match closely and you want backpressure immediately.
- **ArrayBlockingQueue**: fixed array, lower overhead, predictable; use when capacity is fixed and memory is tight.
- **LinkedBlockingQueue**: node-based, can set capacity; default unbounded — always specify capacity.
- **DelayQueue / Scheduled**: for time-based scheduling, not pure throughput.

### Choosing the policy
- If data **must not be lost** (financial orders, audit events): block or persist to durable queue (Kafka, DB) and retry; never drop silently.
- If real-time response is critical and loss is acceptable (metrics, tracing): drop with metric, and alert when drop rate > threshold.
- If producer can slow (batch upload): block with timeout and circuitBreaker; if timeout exceeds, open circuit and return 503.

### Pitfalls in production
- A library using {{LinkedBlockingQueue}} without capacity hides the leak; always check constructor args.
- {{put}} without timeout in a thread pool can cause all threads to block; use {{offer}} with timeout, or submit to a separate bounded executor.
- Drop without monitoring is silent failure; expose {{drops}} and {{rejected}} counters per queue.
- Mixing policies across tiers (accept at edge, drop inside service) causes inconsistency; decide at API contract level.

### Code: bounded with timeout
~~~java
BlockingQueue<Event> q = new ArrayBlockingQueue<>(1000);
boolean ok = q.offer(event, 1, TimeUnit.SECONDS);
if (!ok) { metrics.dropped.increment(); return 503; }
~~~

> Senior tip: in review I check every {{BlockingQueue}} constructor for capacity and every {{offer}} / {{put}} for timeout — unbounded queue + missing timeout is the most common hidden backpressure failure on server code.`,
    follow: [
      'When is SynchronousQueue preferable to ArrayBlockingQueue?',
      'How do you prevent cascading slowdown when all producers block on a full queue?',
      'What metrics should expose queue state and drop/reject rates?'
    ]
  },
  'concurrency-016': {
    q: 'Interrupt: {{InterruptedException}} handled correctly (restore flag), cancel tasks, {{Future.cancel}} — how do you implement?',
    a: `**Summary:** Interrupt is a **cooperative** mechanism: {{t.interrupt()}} only sets a flag. A thread blocked at {{sleep}}, {{wait}}, {{join}}, {{BlockingQueue.take}}, {{Lock.lockInterruptibly}}... will exit with {{InterruptedException}}, and the flag is cleared. When catching this exception there are only two correct paths: either throw it onward (declare throws), or if you cannot throw, call {{Thread.currentThread().interrupt()}} to restore the flag and then finish the work. {{Future.cancel(true)}} essentially sends an interrupt to the running task thread; if the task does not check the flag, it keeps running until completion.

### Mechanism
- Each thread has an interrupt flag. {{interrupt()}} sets the flag; if the thread is at a blocking point, it throws InterruptedException and clears the flag.
- {{Thread.sleep}} / {{Object.wait}} / {{Lock.lockInterruptibly}} / {{BlockingQueue.take}} all respond to the flag.
- Non-blocking work must check {{Thread.interrupted()}} or {{isInterrupted()}} periodically; if ignored, cancellation does nothing.

### Correct handling
1. **Propagate**: declare throws InterruptedException and let the caller decide.
2. **Restore and exit**: if in a runnable/task and you cannot propagate, restore the flag, clean up, return. Never swallow silently.
3. **Cancel future**: {{Future.cancel(true)}} sends interrupt; always wrap runnable tasks with try/catch and restore flag before returning.

~~~java
public void run() {
    try {
        while (!Thread.interrupted()) {
            doWork();
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt(); // restore
        cleanup();
        return; // stop
    }
}
~~~

### Future.cancel
- {{cancel(false)}}: cannot interrupt; task runs to end; future is done but result discarded.
- {{cancel(true)}}: sends interrupt; if task ignores it, it completes normally; if it responds, stops.
- Use with {{ExecutorService}} tasks: always design tasks to respond to interrupt, else cancellation is only a hope.

### Pitfalls
- Catching InterruptedException and continuing without restoring or exiting makes cancellation invisible.
- Calling {{interrupt()}} on a thread that finished already has no effect; check state first if needed.
- In thread pools, interrupting one task does not affect others; isolation is the design.

> Senior tip: I always grep for {{catch (InterruptedException}} and check whether the next line is {{Thread.currentThread().interrupt()}} or a throw — missing either is a guaranteed cancellation bug in production.`,
    follow: [
      'Why is interrupt cooperative rather than forced?',
      'What is the difference between isInterrupted() and Thread.interrupted()?',
      'How should a long-running loop respond to interrupt without blocking?'
    ]
  },
  'concurrency-017': {
    q: '{{wait/notify}} vs {{Condition}}: what is spurious wakeup, and why must you always check the condition in a loop?',
    a: `**Summary:** {{wait}} / {{notify}} is tied to an object’s monitor and can only be called while holding {{synchronized}} on that same object; each monitor has **one** wait set. {{Condition}} (from {{Lock.newCondition()}}) lets a single lock have multiple separate wait queues (notFull, notEmpty) and adds {{awaitUninterruptibly}}, {{awaitNanos}}, {{awaitUntil}}. Always wait in a {{while}}, because a thread may wake when the condition is not yet true: spurious wakeup (allowed by spec), {{notifyAll}} waking many threads at once, or another thread sneaking in and taking the state before you regain the lock.

### Wait/notify mechanism
1. Thread A holds the monitor and calls {{wait()}}: A releases the monitor, enters the wait set.
2. Thread B acquires the same monitor, changes state, calls {{notify()}} / {{notifyAll()}}; B must release monitor before A can wake.
3. A wakes, tries to re-acquire the monitor; only when it gets it again can it check the condition.
4. If the condition is false, loop back to {{wait()}}.

### Spurious wakeup
- The specification permits a thread to wake even without a notify; this can happen due to system events or JVM internals.
- Even with correct notify, if multiple threads wait and one is notified, others may wake due to {{notifyAll}} or timing.
- Always write: {{while (!condition) { lock.wait(); } }}

### Condition advantages
- Multiple conditions per lock: one for "not full", one for "not empty"; avoids mixing wait sets.
- Timed waits: {{awaitNanos}}, {{awaitUntil}} for bounded waiting.
- Interruptible: {{await}} responds to interrupt; {{awaitUninterruptibly}} ignores it.
- Fairness and cancellation support via the underlying AQS.

### Pitfalls
- Using {{if}} instead of {{while}} around wait is the classic broken condition wait bug.
- Calling {{wait()}} without holding the monitor throws IllegalMonitorStateException.
- Notifying on the wrong object or notifying before changing state causes missed signals.

> Senior tip: in code review I always check the loop around {{wait()}} / {{await()}} — seeing {{if}} instead of {{while}} is an automatic flag for a potential missed-wakeup or spurious-wakeup race.`,
    follow: [
      'Why is notifyAll needed over notify in multi-consumer scenarios?',
      'How does Condition avoid mixing wait sets?',
      'What is the order of operations when await returns?'
    ]
  },
  'concurrency-018': {
    q: 'Safe publication and immutability: why can an object not published safely appear "half-baked"; how do {{final}} field semantics work?',
    a: `**Summary:** Publish means making a reference to an object visible from another thread. If published through a normal field (data race), the JMM provides no happens-before between writes inside the constructor and reads in another thread. The reading thread may see a non-null reference but fields inside still at 0 / null. Safe publish methods: static initializer, {{volatile}} / Atomic fields, reads/writes under the same lock, or passing through concurrent collection / BlockingQueue. Specifically, {{final}} fields have special guarantees: if {{this}} is not leaked during construction, any thread that sees the object sees final values (and everything reachable through them) exactly as at constructor end.

### Why half-published objects are dangerous
- The compiler/JIT may reorder writes inside constructor, and without a happens-before edge, another thread may observe partial construction.
- Even if reference is non-null, fields may still hold default values.
- Example: a thread sees {{reference = new Config()}} but {{config.port}} is still 0 (default int) despite constructor assigning 8080.

### Safe publication ways
1. **Static initializer**: class initialization guarantees visibility (JLS 12.4.2).
2. **Volatile / AtomicReference**: write to volatile creates happens-before with later read.
3. **Under same lock**: both write and read use synchronized / Lock on same object.
4. **Concurrent collection / BlockingQueue**: internal happens-before guarantees (e.g., {{ConcurrentHashMap.put}} / {{BlockingQueue.put}}).
5. **Final field with safe constructor**: if {{this}} does not escape, all threads see final values correctly.

### Final semantics
- If the object is properly constructed ({{this}} not leaked) and referenced safely, {{final}} fields are guaranteed visible correctly.
- Non-final fields may still be reordered, so they need additional synchronization.
- If {{this}} escapes through a listener, callback, or inner class during constructor, even final guarantees break.

### Pitfalls
- Publishing via a non-volatile non-final field from one thread to another is the most common safe-publication failure.
- Using {{final}} alone is not enough if the reference itself is published unsafely; combine with safe reference publication.
- Immutable objects (all fields final, no mutation after construction) are the safest; build them fully before publishing.

### Example
~~~java
public final class Config {
    private final int port;
    public Config(int p) { this.port = p; } // safe if this not leaked
}
// Safe publish
Config c = new Config(8080); // if reference passed safely (volatile/lock/queue)
~~~

> Senior tip: when reviewing I check whether a mutable object is published through a non-final non-volatile field; if yes, I ask for either immutable redesign or explicit synchronization at both ends — this is the most common source of "works in local test, breaks in production" concurrency bugs.`,
    follow: [
      'Why is static initialization safe publication?',
      'What happens if this leaks during constructor?',
      'How do you design an immutable object with safe publication?'
    ]
  },
  'concurrency-019': {
    q: 'False sharing, cache line, {{@Contended}}: phenomenon, detection, fix — how to measure with JMH?',
    a: `**Summary:** The CPU synchronizes cache by **cache line** unit (64 bytes on x86 and most ARM servers). When two threads write to two **different** variables that share the same line, each write forces the coherence protocol (MESI) to take exclusive ownership of that line and invalidate the other core’s copy. The line "ping-pongs" between cores, throughput drops sharply even without locks or data races. Fix by separating variables into different lines: {{@Contended}} (requires {{-XX:-RestrictContended}} for application code), padding, or designing so each thread writes to its own region like {{LongAdder}}. Measure with JMH using multi-threaded benchmark groups, plus profiler {{perf c2c}} or {{perfnorm}}.

### How false sharing happens
- Two fields (e.g., counters for different threads) are adjacent in memory and fall in the same 64-byte line.
- Thread A writes counter1; core must get exclusive ownership of line; Thread B’s cached line invalidated.
- Thread B writes counter2; same reverse process; line bounces.
- No lock, no race, but performance collapses due to coherence overhead.

### Detection
- JMH with high-thread group + high iteration count; if throughput is far below expected and scales poorly with more threads, suspect false sharing.
- Linux {{perf c2c}} shows HITM (hit modified) events high for a cache line; map to fields by address.
- {{perf stat -e delec/event/}} or JVM-specific tools; look for high cache-misses with low actual work.

### Fix strategies
1. **Padding**: insert dummy fields to push variables to separate lines (manual, brittle).
2. {{@Contended}}: JVM adds padding automatically; must disable restriction with {{-XX:-RestrictContended}} for user code.
3. **Design separation**: use {{LongAdder}} / {{Striped64}} which distribute writes across cells; each cell in its own line.
4. **Reorder fields**: place frequently-written fields apart, but this is fragile.

### JMH measurement
~~~java
@State(Scope.Group)
public class FalseSharing {
    volatile long counter1 = 0;
    volatile long counter2 = 0;
    @Benchmark
    @GroupThreads(2)
    @Group("gs")
    public void inc1() { counter1++; }
    @Benchmark
    @GroupThreads(2)
    @Group("gs")
    public void inc2() { counter2++; }
}
~~~

### Pitfalls
- Over-padding increases memory usage; apply selectively to hot fields.
- {{@Contended}} does not work by default for application classes due to restriction; remember the JVM flag.
- False sharing can hide behind “slow server” symptoms; profiling per-cache-line is needed.

> Senior tip: when profiling slow multi-threaded code I always check {{perf c2c}} before blaming locks — false sharing is silent, has no stack trace, and can reduce throughput by 5× or more; padding with {{@Contended}} and using {{LongAdder}} usually fixes it instantly.`,
    follow: [
      'How does MESI protocol cause false sharing?',
      'What is the difference between false sharing and true data race?',
      'When should you prefer LongAdder over AtomicLong?'
    ]
  },
  'concurrency-020': {
    q: 'Graceful shutdown executor: {{shutdown}} vs {{shutdownNow}}, {{awaitTermination}}; {{ScheduledExecutorService}} swallows exception and stops job silently — how to handle?',
    a: `**Summary:** {{shutdown()}} stops accepting new tasks but lets running tasks and queued tasks finish. {{shutdownNow()}} stops accepting, removes queued tasks (returns them, does not run them), and **interrupts** all workers; tasks that ignore interrupt still run to completion. Neither waits; to wait you must call {{awaitTermination(timeout)}}. With {{ScheduledExecutorService}}, if one execution of {{scheduleAtFixedRate}} throws an exception, all future executions are **silently cancelled**: the exception is stored in the ScheduledFuture and never logged; the thread does not die, only the job stops. Fix by catching all exceptions inside the job body, logging them, and pushing metrics.

### Shutdown comparison
| | New tasks | Queued tasks | Running tasks | Wait option |
|---|---|---|---|---|
| {{shutdown()}} | Rejected | Run to finish | Run to finish | {{awaitTermination}} |
| {{shutdownNow()}} | Rejected | Returned (not run) | Interrupted | {{awaitTermination}} |

### Await termination
- Call {{awaitTermination(long timeout, TimeUnit)}} after shutdown / shutdownNow.
- If it returns false, tasks are still running; consider force or log for next time.
- Always combine with a timeout; never block forever in shutdown hooks.

### ScheduledExecutorService exception swallowing
- Each scheduled task is wrapped; if it throws, future executions are cancelled, but the worker thread continues.
- The exception is in the future and often never inspected.
- Fix: wrap the runnable with try/catch inside the task; log and emit metric; never let exception propagate out.

~~~java
scheduler.scheduleAtFixedRate(() -> {
    try {
        doWork();
    } catch (Exception e) {
        logger.error("scheduled job failed", e);
        metrics.failed.increment();
        // do NOT throw; do NOT return empty
    }
}, 0, 1, TimeUnit.MINUTES);
~~~

### Pitfalls
- Calling {{shutdownNow()}} and expecting immediate stop; if tasks ignore interrupt, they continue.
- Not calling {{awaitTermination}} in a shutdown hook causes the JVM to exit while tasks are still running, leading to lost work.
- Using fixed-rate for tasks that may exceed the period; use fixed-delay or handle overlap.

> Senior tip: in production shutdown hooks I always use {{shutdown()}} + {{awaitTermination(30, SECONDS)}} with a fallback {{shutdownNow()}}; for scheduled tasks I wrap every body in try/catch and expose {{last_exception}} metric — the silent cancellation of scheduled jobs is the most common “my batch stopped working on Tuesday” issue.`,
    follow: [
      'Why does scheduleAtFixedRate silently stop after an exception?',
      'What is the proper shutdown sequence for an ExecutorService?',
      'How do you handle tasks that ignore interrupt during shutdown?'
    ]
  },  'jvm-001': {
    q: 'List JVM memory areas (heap young/old, metaspace, stack, code cache, direct memory) and explain which region causes which symptoms.',
    a: `**Summary:** Heap (young Eden/Survivor + old) holds Java objects; metaspace is native memory for class metadata; each thread has a stack; code cache holds JIT-compiled code; direct memory is for NIO ByteBuffers outside the heap. Quick symptoms: OOM "Java heap space" = heap; OOM "Metaspace" = many classes / classloader leak; "unable to create native thread" = stack / native; RSS higher than Xmx = native (direct / cache / stack).

### Memory regions table
| Region | Contains | Symptoms when issue |
|---|---|---|
| Heap: young (Eden + 2 Survivor) / old | Java objects | OOM Java heap space; frequent Full GC |
| Metaspace | Class / method metadata | OOM Metaspace; gradual growth on each redeploy |
| Stack per thread | Method frames | StackOverflowError; "unable to create native thread" |
| Code Cache | JIT-compiled native code | Deoptimization; C2 compile threshold issues |
| Direct Memory | NIO ByteBuffer / mapped files outside heap | High RSS vs Xmx; OOM direct buffer |

### Heap details
- Young: Eden for new objects; Survivor spaces (S0, S1) for objects surviving GC; when Eden full, minor GC copies survivors to Survivor or promotes to old.
- Old (Tenured): objects that survive multiple GC cycles; Full GC scans old + metaspace; if old fills, OOM.
- GC types: G1 (default in modern JVM), ZGC / Shenandoah (low latency); tuning includes {{-Xms}} / {{-Xmx}}, region size, GC threads.

### Metaspace
- Replaces PermGen (Java 7); native memory, not heap.
- Bounded by {{-XX:MaxMetaspaceSize}}; default unlimited — can exhaust native memory.
- Classloader leaks (e.g., redeploying WAR without restarting) cause gradual growth; fix by restarting or using separate classloaders with cleanup.

### Stack and native threads
- Default thread stack size {{-Xss}} (often 1MB on 64-bit); many threads = high native memory.
- "unable to create native thread" usually from OS thread limit or memory; reduce thread count or increase ulimit.

### Direct memory
- Used by NIO {{ByteBuffer.allocateDirect}} and memory-mapped files; not counted in heap, so RSS > Xmx indicates direct usage.
- Monitor with {{BufferPoolMXBean}}; limit with {{-XX:MaxDirectMemorySize}}.

### Symptoms guide
- Fast OOM with GC logs showing old full -> heap leak or too large objects.
- Slow growth after redeploy and never drops -> metaspace / classloader leak.
- High CPU with many threads but low throughput -> too many threads, stack overhead.
- RSS high, heap fine -> direct memory or native cache.

> Senior tip: when debugging OOM I always compare Xmx to RSS and check GC logs for promotion rate; a common mistake is setting Xmx too high and ignoring native memory (direct + metaspace + stack), which causes the process to be killed by the OS despite JVM heap being fine.`,
    follow: [
      'How do you distinguish heap OOM from direct-memory OOM?',
      'What causes classloader leak and how to detect it?',
      'How does G1 differ from ZGC in memory management?'
    ]
  }
});
