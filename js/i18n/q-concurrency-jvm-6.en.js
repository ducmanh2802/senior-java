/*
 * English translation of js/data/q-concurrency-jvm.js — task T172. Format: js/core/i18n.js (content overlay).
 * ids: jvm-022 concurrency-028 concurrency-029 jvm-023 jvm-024 jvm-025
 */
App.i18n.content({
  'jvm-022': {
    q: 'Distinguish {{StackOverflowError}} and {{OutOfMemoryError}}: causes, how to reproduce each, should you catch them, and what state is the JVM/application in after the error?',
    a: `**Summary:** StackOverflowError occurs when the stack of **a single thread** runs out of space, almost always from too-deep or infinite recursion. Only that thread is affected, and the stack is freed as the exception unwinds upward through the call chain. OutOfMemoryError occurs when the JVM cannot allocate memory in a shared region (heap, metaspace, direct memory, or native memory when creating a thread). It explodes on the "unlucky" thread that is allocating at that moment — not necessarily the one that caused it — and the whole application is often in a broken state. Both are {{Error}} (subclass of {{VirtualMachineError}}) and should not be caught to continue. For OOM, configure a heap dump and {{ExitOnOutOfMemoryError}} so the process can restart cleanly.

### Comparison
| | StackOverflowError | OutOfMemoryError |
|---|---|---|
| Memory region | Stack of one thread ({{-Xss}}) | Heap, Metaspace, direct buffer, native (when creating thread)... |
| Typical cause | Infinite or too-deep recursion ({{toString}} cycles, very deep tree) | Leak, heap too small for load, loading too much data at once |
| Who suffers | The thread doing the recursion | Any thread allocating at that moment |
| After error | Stack freed on unwind; JVM still healthy | Heap still full; other threads about to OOM; app state may be partial |
| Stack trace | Repeats same frames (default keeps 1024 frames, {{-XX:MaxJavaStackTraceDepth}}) | Points to allocation site, usually not the leak site |
| Tools | Read stack trace | Heap dump + MAT, NMT, GC log |

### Reproduce
~~~java
// StackOverflowError
static int depth = 0;
static void recurse() { depth++; recurse(); }

public static void main(String[] args) {
    try {
        recurse();
    } catch (StackOverflowError e) {
        System.out.println(depth);   // a few thousand to tens of thousands, depending on -Xss, frame size and JIT
    }
}
~~~
~~~java
// OutOfMemoryError: Java heap space  (run with -Xmx64m)
List<byte[]> hold = new ArrayList<>();
while (true) hold.add(new byte[1024 * 1024]);   // reference kept, so GC cannot reclaim
~~~
These examples are only for learning; do not run "create threads infinitely" (to reproduce {{unable to create native thread}}) on shared machines, because it affects other processes of the same user.

### Why not catch and continue
- StackOverflowError can blow at any call in the chain, even while a method is updating a partial state. Finally still runs, but finally also needs stack and can blow again. Catching it at the request boundary to return an error is acceptable, if the code does not modify shared state.
- OutOfMemoryError: other threads may have already died from OOM (thread pool loses workers, scheduler stops), objects may be partial in cache, connections partial. In practice there is no way to prove the app is still correct, so let the process die and restart.
- {{catch (Throwable t)}} inside a worker loop swallows OOM: the service still looks "alive" but is quietly broken. If you must catch Throwable, rethrow {{VirtualMachineError}}.

### Proper handling
**StackOverflowError**: read the stack trace to find repeating frame clusters; replace recursion with a loop using {{ArrayDeque}} as an explicit stack; limit input depth (Jackson 2.15+ limits nested depth to 1000 by default via {{StreamReadConstraints}}). Only increase {{-Xss}} when depth is legitimate and bounded, and remember it applies to every thread.

**OutOfMemoryError**:
~~~bash
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps/ -XX:+ExitOnOutOfMemoryError
~~~
Read the **message** to know which region is exhausted: {{Java heap space}}, {{GC overhead limit exceeded}} (Parallel GC), {{Metaspace}}, {{Direct buffer memory}}, {{unable to create native thread}}, {{Requested array size exceeds VM limit}}. Each requires a different investigation direction. A pod killed by OOMKilled (exit 137) has no OutOfMemoryError at all: the kernel killed the process because RSS exceeded the memory limit.

### Common wrong answers
- "The thread that throws OOM is the culprit": usually just the victim; the culprit is in the heap dump.
- "StackOverflowError is caused by full heap": unrelated to heap.
- "Increase Xmx to fix StackOverflowError": stack is adjusted by Xss, not Xmx.
- "Catch OutOfMemoryError then call System.gc()": the JVM has already GC'd everything before throwing OOM.

> Senior tip: with StackOverflowError, I treat input as the first suspect: parent-child category trees created by users, recursive rule engines, JSON from partners. Limiting depth at the system boundary is much cheaper than increasing Xss. With OOM, the first question is always "what region does the message say?"; very often teams confuse OOM Metaspace or Direct buffer memory with OOM heap and increase Xmx uselessly.`,
    follow: [
      'Why is the thread that throws OutOfMemoryError often not the culprit?',
      'What impact does increasing -Xss have when a service has 500 threads?'
    ]
  },
  'concurrency-028': {
    q: 'A thread publishes data through a ready flag, but the reader sometimes sees the new flag and the old value. Explain happens-before and how to fix it?',
    a: `**Summary:** Without happens-before the program has a data race; the compiler and CPU may reorder instructions, so the reader is not guaranteed to see prior writes. Use volatile for the publish flag, or synchronize both sides with the same monitor or a concurrency primitive.

### Mechanism
- Volatile write has release semantics; volatile read has acquire semantics. If the reader sees that write, the writes before the flag happen-before the reads after the flag.
- Therefore the writer writes payload first, then sets the flag. The reader checks the flag before reading payload.
- Sleep/yield does not create a happens-before relation; stress tests also do not prove the program correct.

### Limitations
- Volatile does not make addition or read-modify-write atomic. Use AtomicLong, a lock or LongAdder depending on requirements.
- If the invariant involves multiple fields that need a consistent snapshot, use a lock or publish an immutable object through a volatile reference.
- Multiple writers need a clear ownership protocol; a single volatile flag does not accumulate updates.

~~~java
int value;
volatile boolean ready;
void publish() { value = 42; ready = true; }
int read() { return ready ? value : -1; }
~~~

To verify a hard-to-reproduce litmus test, use jcstress; thread.sleep is not a replacement for synchronization.

> Senior tip: when reviewing concurrent code, point to the happens-before edge connecting the writer to the reader. If you cannot point to a specific edge, do not rely on "it runs fine on x86".`,
    follow: [
      'Why does volatile not protect count++?',
      'When is an immutable snapshot needed instead of multiple volatile fields?'
    ]
  },
  'concurrency-029': {
    q: 'A parallel stream in an endpoint blocks other ForkJoin tasks. Explain the common pool and redesign accordingly?',
    a: `**Summary:** Parallel stream usually uses ForkJoinPool.commonPool, which is shared in the JVM. Blocking I/O holds workers while waiting and can starve unrelated tasks; separate the workload into a bounded executor or use an async client with a concurrency limit.

### Why the common pool is a trap
- ForkJoinPool is optimized for small CPU-bound tasks via work stealing: idle workers steal from busy workers' deques.
- When a worker is waiting for a socket/DB, it cannot steal other work. Compensation for blocking is not a guarantee to use the pool as an I/O executor.
- A parallel stream in an endpoint can compete with CompletableFuture async stages that do not pass an executor.

### Fix
- Use a dedicated executor for each dependency, with bounded threads, clear rejection policy and timeouts.
- Set a semaphore per partner quota and DB connection count; parallel does not mean unlimited.
- Pass the executor to supplyAsync/thenApplyAsync. With parallel stream, consider sequential loops or switch to an API that allows specifying an executor.
- Queues must be bounded: unbounded queues turn overload into continuous latency and memory growth.

### Operations
- Monitor queue depth, active workers, rejections, dependency latency and common pool saturation.
- Do not create an executor per request. Shutdown executors with the application lifecycle.
- Virtual threads make blocking code easier to scale, but they do not increase DB or partner quotas.

> Senior tip: apply bulkheads per dependency. When the queue is full, fail fast is usually better than queuing work that will definitely miss its deadline.`,
    follow: [
      'Why do virtual threads still need a semaphore?',
      'Which CompletableFuture stage by default may run on the common pool?'
    ]
  },
  'jvm-023': {
    q: 'A service has a large heap and sensitive p99: do you choose G1 or Generational ZGC, and what benchmark is credible?',
    a: `**Summary:** G1 balances throughput and pause with a soft pause target; Generational ZGC aims for very short pauses by doing more work concurrently. The decision depends on SLO, CPU/RSS headroom and benchmarking with the correct runtime — not a single pause number.

### Trade-off
- G1 splits the heap into regions, uses young/mixed collection and concurrent marking; some phases are still stop-the-world. MaxGCPauseMillis is a target, not an SLA.
- Generational ZGC uses object age; ZGC uses load barriers to do more work while the application runs. JEP 439 introduces generational mode in JDK 21.
- Concurrent work consumes CPU. If CPU quota is near the limit, reducing pause may mean lower throughput.

### Selection process
1. Run with the same heap limit, JDK build, container quota, dataset and request mix.
2. Stable warm-up; measure multiple runs for both peak and burst, as well as cold deploy.
3. Compare p99/p999, throughput, CPU, RSS, allocation rate, pause distribution and GC time.
4. Canary a group of instances, keep rollback configuration.

~~~bash
-Xlog:gc*,safepoint:file=/logs/gc.log:time,uptime,level,tags
~~~

Read logs together with JFR; watch metaspace, direct memory and thread stack, which also count in RSS outside the heap.

> Senior tip: if the pause target is met but CPU headroom is exhausted at peak, that collector is not production-ready. Do not set Xmx to the container's full memory limit.`,
    follow: [
      'Why is MaxGCPauseMillis not a commitment?',
      'What do you monitor to know ZGC is taking CPU from the application?'
    ]
  },
  'jvm-024': {
    q: 'A benchmark shows object allocation disappears after warm-up. What do escape analysis and scalar replacement explain, and why is it not a contract?',
    a: `**Summary:** The JIT can prove an object does not escape its required scope, then replace its fields with scalars, removing allocation and unnecessary locks. This is a runtime optimization depending on profile — not a language or bytecode guarantee.

### Process
- Interpreter/C1 collects profiles; tiered compilation can promote hot methods to C2.
- Escape analysis finds references that are returned, stored in fields/static, or passed to calls that cannot be analyzed.
- If the object does not escape, scalar replacement can keep each field in registers; lock elimination can also drop monitors that are never observed.
- Changing profiles can cause deoptimization and recompilation.

### Measure correctly
- Use JFR or async-profiler allocation mode to find hot allocation on real workload.
- JMH needs warm-up, fork, and dead-code elimination protection; benchmarking a single cold loop usually measures the interpreter.
- Object escape or overly complex code can prevent optimization. Do not conclude that records are always stack-allocated.

> Senior tip: optimize allocation only when the allocation flame graph proves it takes significant CPU/GC. Design clear code first; do not rely on a JIT optimization that is hard to reproduce across JDK versions.`,
    follow: [
      'How does escape through a static field affect the analysis?',
      'Why does JMH need warm-up and fork?'
    ]
  },
  'jvm-025': {
    q: 'Latency increases minutes after deploy, then drops; compilation and deoptimization rise. Explain tiered compilation and how to investigate?',
    a: `**Summary:** HotSpot starts with interpreter/C1, collects profiles, then compiles hot methods with C2; warm-up and deoptimization can change latency after deploy. You must compare JIT activity, code cache, class loading and GC before changing compiler flags.

### Tiered compilation
- Interpreter runs bytecode and records invocation/back-edge counters.
- C1 compiles quickly at lower optimization levels and may attach instrumentation.
- C2 uses profiles to inline and strongly optimize. When type or hierarchy assumptions are no longer valid, code may deoptimize to a lower level.
- The code cache stores machine code; a full code cache can stop compilation or degrade performance.

### Investigation
- Record JFR and compilation/deoptimization logs briefly in canary; watch compiler thread CPU, code cache usage, class loading.
- Separate warm-up from connection pool initialization, cache, CDS and GC; these often occur together after deploy.
- Controlled warm-up before receiving traffic is required, but must run real code paths.
- Do not disable tiered compilation based only on correlation. Changes can make throughput lower and more stable.

### Pitfalls
- Health checks usually do not warm hot paths.
- Benchmarks need enough warm-up and the same image/runtime as production.
- CDS/AOT can reduce startup/class loading but do not eliminate all JIT warm-up.

> Senior tip: keep a group of warmed instances as a reference during rollout. Compare p99 with CPU, compilation, error rate to distinguish JIT effects from dependency cold start.`,
    follow: [
      'How is deoptimization different from a compilation failure?',
      'What are the symptoms when the code cache is full?'
    ]
  }
});
