/*
 * English translation of js/data/q-concurrency-jvm.js — tasks T172, T518. Format: js/core/i18n.js (content overlay).
 * ids: jvm-022 concurrency-028 concurrency-029 jvm-023 jvm-024 jvm-025
 */
App.i18n.content({
  'jvm-022': {
    q: 'Distinguish {{StackOverflowError}} and {{OutOfMemoryError}}: causes, how to reproduce each, whether you should catch them, and what state the JVM/application is in after the error?',
    a: `**Summary:** StackOverflowError happens when the stack of **one thread** runs out of space, almost always because recursion is too deep or infinite. Only that thread is affected, and the stack is freed as soon as the exception unwinds back out. OutOfMemoryError happens when the JVM cannot allocate memory in a **shared** region (heap, metaspace, direct memory, or native memory to create a thread). It blows up on the "unlucky" thread that happens to be allocating at that moment, not necessarily the thread that caused it, and usually the whole application is already in a broken state. Both are {{Error}} (subclasses of {{VirtualMachineError}}) and should not be caught in order to keep running. For OOM, configure a heap dump and {{ExitOnOutOfMemoryError}} so the process gets a clean restart.

### Quick intuition
A thread's stack is like a pile of plates on one chef's counter: every method call puts another plate on top, and when the method returns the plate comes off. Infinite recursion keeps stacking plates until it hits the ceiling — **StackOverflowError** — and only that chef's counter is affected; clear the pile and the counter is clean again. The heap is like the **shared pantry** of the whole restaurant: when the pantry is full (**OutOfMemoryError**), the next person who comes to take something is the one who gets the error, even if someone else filled the pantry. And the pantry is still full after the error is reported, so the whole restaurant is in danger.

### Glossary
- **Stack frame**: the memory region for one method call (local variables, parameters, return address).
- **-Xss**: the maximum stack size for each platform thread.
- **Unwind**: the exception propagates back out, dropping frames one by one.
- **Error vs Exception**: Error is a serious problem of the environment; applications usually should not catch it.
- **VirtualMachineError**: the parent class of StackOverflowError and OutOfMemoryError.
- **ExitOnOutOfMemoryError**: a flag that makes the JVM exit immediately on OOM so it can be restarted cleanly.
- **ArrayDeque**: a double-ended queue, used as an explicit stack when turning recursion into a loop.
- **OOMKilled (exit 137)**: the kernel kills the container because it exceeded the memory limit; this is not OutOfMemoryError.

### How the two errors happen (step by step)
1. **StackOverflowError**: every call pushes a frame onto the thread's stack -> recursion never stops -> the Xss limit is hit -> the JVM throws the error right at that call -> the exception unwinds, frames are dropped, the stack is empty again. Why the JVM stays healthy: the stack belongs to that one thread and nobody else shares it.
2. **OutOfMemoryError**: a thread asks for an allocation -> the heap has no room -> the JVM runs GC as hard as it can -> still not enough -> it throws OOM to the **thread that is asking** -> but the objects holding the heap are still there, and the next threads that ask will OOM too. Why the app is in danger: the error fires at a random place and leaves half-finished state behind.

~~~text
StackOverflowError                      OutOfMemoryError
thread A: [f][f][f]...[f] X             shared heap: [######## full ########]
thread B: [g][h]  (normal)              thread A asks 1 MB -> OOM (the victim)
=> only A fails, A's stack is cleared   thread B asks next  -> OOM
                                        culprit: a static cache holding 90% of the heap
~~~

### Comparison
| | StackOverflowError | OutOfMemoryError |
|---|---|---|
| Memory region | The stack of one thread ({{-Xss}}) | Heap, Metaspace, direct buffer, native (when creating a thread)... |
| Typical cause | Infinite or too-deep recursion ({{toString}} cycles, very deep trees) | Leak, heap too small for the load, loading too much data at once |
| Who suffers | The thread doing the recursion | Any thread allocating at that moment |
| After the error | The stack is freed on unwind; the JVM stays healthy | The heap is still full; other threads are about to OOM too; app state may be half-finished |
| Stack trace | Repeats the same frames (by default only 1024 frames are kept, {{-XX:MaxJavaStackTraceDepth}}) | Points at the allocation site, usually not the leak site |
| Tools | Read the stack trace | Heap dump + MAT, NMT, GC log |

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
while (true) hold.add(new byte[1024 * 1024]);   // the reference is kept, so GC cannot reclaim it
~~~
Both examples are only for learning; do not run something like "create threads forever" (to reproduce {{unable to create native thread}}) on a shared machine, because it affects other processes of the same user.

### Why not catch and keep running
- StackOverflowError can blow up at any call in the chain, including while a method is updating half-finished state. The finally block still runs, but finally also needs stack space and can blow up again. Catching it at the boundary of a request to return an error is acceptable, provided that code does not modify shared state.
- OutOfMemoryError: other threads may already have died from OOM (a thread pool loses workers, a scheduler stops), there may be half-built objects in caches, half-open connections. In reality there is no way to prove the app is still correct, so let the process die and restart.
- {{catch (Throwable t)}} inside a worker loop swallows OOM too: the service looks "alive" but is quietly broken. If you must catch Throwable, rethrow {{VirtualMachineError}}.

### Handling it correctly
**StackOverflowError**: read the stack trace to find the repeating cluster of frames; turn recursion into a loop using {{ArrayDeque}} as an explicit stack; limit input depth (Jackson 2.15+ limits nesting depth to 1000 by default through {{StreamReadConstraints}}). Only increase {{-Xss}} when the depth is legitimate and bounded, and remember it applies to every thread.

**OutOfMemoryError**:
~~~bash
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps/ -XX:+ExitOnOutOfMemoryError
~~~
Read the **message** to know which region is exhausted: {{Java heap space}}, {{GC overhead limit exceeded}} (Parallel GC), {{Metaspace}}, {{Direct buffer memory}}, {{unable to create native thread}}, {{Requested array size exceeds VM limit}}. Each one points to a different investigation. A pod killed by OOMKilled (exit 137) has no OutOfMemoryError at all: the kernel killed the process because RSS exceeded the memory limit.

### Common wrong answers
- "The thread that throws OOM is the culprit": it is usually just the victim; the culprit is inside the heap dump.
- "StackOverflowError is caused by a full heap": it has nothing to do with the heap.
- "Increase Xmx to fix StackOverflowError": the stack is tuned by Xss, not Xmx.
- "Catch OutOfMemoryError then call System.gc()": the JVM has already GC'd as hard as it can before throwing OOM.

### Common mistakes
- **catch (Throwable) in a worker loop**: swallows OOM; the service looks alive but loses workers and leaves half-finished data. Avoid it by rethrowing {{VirtualMachineError}} and enabling ExitOnOutOfMemoryError.
- **Increasing -Xss for the whole JVM to fix one deep recursion**: every thread can then take more stack memory. Avoid it by rewriting with a loop or limiting input depth.
- **Increasing Xmx when you hit OOM Metaspace or Direct buffer memory**: useless. Avoid it by reading the message after the colon.
- **A recursive toString/equals cycle between two entities (for example two-way Lombok @Data)**: StackOverflowError while logging. Avoid it by excluding relationship fields from toString/equals.

### One-minute spoken answer
"StackOverflowError is one thread's stack running out of space, almost always from infinite or too-deep recursion; only that thread is affected and the stack is freed when the exception unwinds, so the JVM stays healthy. OutOfMemoryError is a shared region such as the heap, metaspace or direct memory running out; it blows up on the thread that happens to be allocating, usually just a victim, and because the memory is still full the whole app is in a broken state. Both are Errors, so I do not catch them to keep running. For stack overflow I read the repeating frame cluster, convert recursion into a loop or limit input depth. For OOM I read the message to know which region, enable a heap dump and ExitOnOutOfMemoryError so the process restarts cleanly, then analyze the dump."

> Senior tip: with StackOverflowError, I treat input as the first suspect: user-created parent-child category trees, recursive rule engines, JSON from partners. Limiting depth at the system boundary is much cheaper than increasing Xss. With OOM, the first question is always "which region does the message name?"; very often teams mistake OOM Metaspace or Direct buffer memory for OOM heap and increase Xmx for nothing.`,
    follow: [
      'Why is the thread that throws OutOfMemoryError often not the culprit?',
      'What impact does increasing -Xss have when a service has 500 threads?'
    ]
  },
  'concurrency-028': {
    q: 'A thread publishes data through a ready flag, but the reader sometimes sees the new flag and the old value. Explain happens-before and how do you fix it?',
    a: `**Summary:** When the writer and the reader have no happens-before relationship, the program has a **data race**: the compiler, the JIT and the CPU are allowed to reorder instructions, so the reader is not guaranteed to see earlier writes even after it sees the flag {{ready = true}}. Fix: declare the flag {{volatile}} and write the payload **before** flipping the flag, or synchronize both sides with the same monitor or a concurrency primitive (AtomicReference, BlockingQueue, CountDownLatch...).

### Quick intuition
It is like texting a colleague "the document is on the desk" — but the message arrives faster than the person carrying the document, so the colleague runs over and the desk is still empty (or still holds the old version). The {{ready}} flag is the message, {{value}} is the document. {{volatile}} on the flag is a courier rule: "you may only send the message after the document has been put down, and whoever reads the message is guaranteed to see the document."

### Glossary
- **Happens-before**: a rule of the Java Memory Model: if A happens-before B, then B sees everything A wrote.
- **Data race**: two threads access the same variable, at least one of them writes, and there is no happens-before between them.
- **Reordering**: changing instruction order as an optimization; legal when a single thread cannot tell the difference.
- **Release / acquire**: a volatile write is a "release" (pushes all earlier writes out), a volatile read is an "acquire" (sees everything that was released).
- **Publish**: make data visible to other threads.
- **Invariant**: a constraint that must always hold across several fields (for example min <= max).
- **jcstress**: an OpenJDK tool for testing concurrency scenarios that are hard to reproduce.

### Why the reader sees the new flag but the old value (step by step)
1. The writer runs {{value = 42; ready = true;}}. Without volatile, these two writes have no ordering constraint with respect to other threads.
2. The JIT or the CPU (especially ARM) can make the write to {{ready}} visible to another core before the write to {{value}}.
3. The reader sees {{ready == true}}, reads {{value}} and gets 0 (the old value). The JIT can even hoist the read of {{ready}} out of the loop, so the reader waits forever.
4. When {{ready}} is volatile: a volatile write is release — every earlier write (value = 42) must become visible first; a volatile read is acquire — if the reader sees {{ready == true}} it is guaranteed to see {{value == 42}}. This is the volatile rule plus the transitivity of happens-before.

~~~text
Without volatile:                     With volatile ready:
Writer: value=42 ; ready=true        Writer: value=42 --hb--> ready=true (release)
Another core may see:                                          |
  ready=true, value=0   <- BUG      Reader: reads ready==true (acquire) --hb--> reads value==42
~~~

### The fix

~~~java
int value;
volatile boolean ready;                  // the publish flag must be volatile

void publish() {
    value = 42;                          // 1. write the payload FIRST
    ready = true;                        // 2. flip the flag AFTER (release)
}
int read() {
    return ready ? value : -1;           // read the flag FIRST (acquire), then read the payload
}
~~~
- The order is mandatory: the writer writes the payload and only then flips the flag; the reader checks the flag and only then reads the payload. Swapping the order removes the guarantee.
- Sleep/yield does not create a happens-before relationship; a stress test that runs fine does not prove the program correct either.

### Limitations
- Volatile does not make addition or read-modify-write atomic. Use AtomicLong, a lock or LongAdder depending on requirements.
- If the invariant spans several fields that need a consistent snapshot, use a lock or publish **one immutable object** through a volatile reference (or AtomicReference).
- Multiple writers need a clear ownership protocol; a single volatile flag cannot accumulate updates from several people.
- If the reader must wait until data exists (instead of checking and returning -1): use CountDownLatch, CompletableFuture or BlockingQueue instead of a busy loop.

To verify hard-to-reproduce litmus tests, use jcstress; {{Thread.sleep}} is not a replacement for synchronization.

### Common mistakes
- **A volatile flag but the payload written after the flag**: the reader still sees the old value. Avoid it by always writing the payload first and flipping the flag last.
- **Only the payload volatile, the flag not volatile**: the reader's read of the flag has no acquire, so there is no guarantee. Avoid it: the variable used as the "signal" is the one that must be volatile.
- **Publishing several related fields through separate volatiles**: the reader sees a mixed combination of old and new versions. Avoid it by wrapping them into an immutable object and publishing one reference.
- **Concluding "it is correct" because it runs fine on an x86 laptop**: the bug shows up on ARM/Graviton. Avoid it by arguing with happens-before and testing with jcstress.

### One-minute spoken answer
"The cause is that there is no happens-before between the writer and the reader, meaning a data race: the JIT and CPU are allowed to make the write to the flag visible before the write to value, so the reader sees ready as true while value is still old. The fix is to declare ready volatile, have the writer write value first and flip the flag last, and have the reader read the flag first and value after: a volatile write has release semantics, a volatile read has acquire semantics, and with transitivity value is guaranteed to be visible. But volatile does not make compound operations atomic, and if I need a snapshot of several fields I publish an immutable object through one volatile reference or use a lock. I do not use sleep or stress tests to prove correctness; I point to a specific happens-before edge and verify with jcstress when needed."

> Senior tip: when reviewing concurrent code, point to the happens-before edge connecting the writer to the reader. If you cannot point to a specific edge, do not rely on "it runs fine on x86".`,
    follow: [
      'Why does volatile not protect count++?',
      'When is an immutable snapshot needed instead of multiple volatile fields?'
    ]
  },
  'concurrency-029': {
    q: 'A parallel stream in an endpoint blocks other ForkJoin tasks. Explain the common pool and how would you redesign?',
    a: `**Summary:** a parallel stream runs on {{ForkJoinPool.commonPool()}} — one pool shared by the whole JVM, with only (number of cores - 1) workers. Blocking I/O (HTTP calls, JDBC) inside a parallel stream holds a worker for the whole wait, starving unrelated tasks (CompletableFuture async stages without an explicit executor, other parallel streams). Redesign by moving the I/O workload into a bounded executor (bulkhead) or an async client, with a concurrency limit, timeouts and a bounded queue.

### Quick intuition
The commonPool is like the only elevator in the building, carrying 3 people at a time. A parallel stream calling I/O is like 3 people getting in and then **standing inside** the elevator on a 2-minute phone call: the elevator cannot go anywhere, the whole building queues up, including people who have nothing to do with the call. The fix: whoever has to wait a long time takes a separate elevator with a people limit (a dedicated executor), and the shared elevator is only for quick trips (pure computation).

### Glossary
- **commonPool**: a static ForkJoinPool shared across the whole JVM; default parallelism = number of cores - 1.
- **Parallel stream**: a stream that processes elements in parallel on the commonPool.
- **Work stealing**: an idle worker takes tasks from another worker's deque.
- **Blocking I/O**: the thread sits waiting for the network/disk/DB to return and cannot do anything else.
- **Bulkhead**: splitting resources (pools, semaphores) per dependency so one failing part does not sink the rest.
- **Starvation**: a task waits forever because all workers are taken.
- **Compensation thread**: an extra thread the ForkJoinPool creates when a worker announces it is about to block via {{ForkJoinPool.managedBlock}}.
- **Rejection policy**: how an executor handles the case when it cannot accept more tasks.

### Why the common pool easily becomes a trap (step by step)
1. ForkJoinPool is optimized for small CPU-bound tasks through work stealing: an idle worker takes a task from a busy worker's deque.
2. A pod with 4 vCPU -> the commonPool has 3 workers. An endpoint calls {{ids.parallelStream().map(this::callPartner)}}, each call takes 300 ms.
3. All 3 workers sit waiting on sockets and cannot steal anything else. Thread compensation only happens when the code announces it via managedBlock, and HTTP clients or JDBC drivers do not do that, so the commonPool cannot be treated as an I/O executor.
4. Every CompletableFuture async stage without an explicit executor and every other parallel stream in the JVM now has to queue behind -> unrelated endpoints time out too.
5. Numbers: 100 ids x 300 ms / 3 workers ≈ 10 seconds for one request; 5 concurrent requests keep the commonPool stuck for almost a minute.

~~~text
commonPool (3 workers, 4 vCPU pod)
worker-1: [callPartner ... waiting 300ms ...]
worker-2: [callPartner ... waiting 300ms ...]
worker-3: [callPartner ... waiting 300ms ...]
queue:    [CF.supplyAsync from another API][parallel sort][...] <- starving, timeout
~~~

### The fix
- Use a dedicated executor per dependency: bounded threads/queue, a clear rejection policy and timeouts.
- Set a semaphore by partner quota and DB connection count; parallel does not mean unlimited.
- Pass the executor to {{supplyAsync}}/{{thenApplyAsync}}. Parallel streams do not accept an executor: consider a sequential loop, or switch to an API that lets you specify one.
- Queues must be bounded: an unbounded queue turns overload into rising latency and memory.

~~~java
// Bulkhead for the partner: at most 20 parallel calls, queue of 100, fail fast when full
ExecutorService partnerPool = new ThreadPoolExecutor(20, 20, 0, TimeUnit.SECONDS,
        new ArrayBlockingQueue<>(100), new ThreadPoolExecutor.AbortPolicy());

List<CompletableFuture<Quote>> fs = ids.stream()
        .map(id -> CompletableFuture.supplyAsync(() -> callPartner(id), partnerPool)
                .orTimeout(2, TimeUnit.SECONDS))          // each call has a deadline
        .toList();
List<Quote> quotes = fs.stream().map(CompletableFuture::join).toList(); // join at the boundary
~~~
With Java 21 you can replace the pool with {{newVirtualThreadPerTaskExecutor()}} plus a {{Semaphore(20)}} around callPartner — there still has to be a limit.

### Operations
- Monitor queue depth, active workers, rejection count, dependency latency and commonPool saturation ({{getActiveThreadCount}}, {{getQueuedSubmissionCount}}).
- Do not create an executor per request. Shut executors down with the application lifecycle.
- Virtual threads make blocking code easier to scale, but they do not increase DB quotas or partner capacity.

### Common mistakes
- **I/O inside a parallel stream**: the symptom is many APIs getting slow at the same time, and a thread dump shows {{ForkJoinPool.commonPool-worker}} threads sitting in socket reads. Avoid it with a dedicated I/O executor.
- **Creating a new executor in every request**: the thread count keeps growing and memory leaks. Avoid it by making the executor a shared bean with a shutdown.
- **A dedicated executor but an unbounded queue**: the commonPool is no longer stuck, but latency keeps rising and eventually OOM. Avoid it with a bounded queue + AbortPolicy + returning 503.
- **Dropping the timeout for partner calls**: a slow partner keeps every worker stuck. Avoid it with timeouts on the HTTP client and orTimeout on the futures.

### One-minute spoken answer
"A parallel stream runs on the commonPool, a pool shared by the whole JVM with only the number of cores minus one workers. If the lambda does HTTP or JDBC, the worker sits waiting on I/O, cannot steal other work, and ForkJoinPool does not compensate with new threads because the driver does not announce the block; so every CompletableFuture async stage without an executor and every other parallel stream starves, and unrelated endpoints time out too. I redesign with bulkheads: one executor per dependency with bounded threads and queue, a clear rejection policy, a timeout per call, a semaphore per partner quota; or virtual threads plus a semaphore on Java 21. I keep parallel streams only for pure computation on large data, and I monitor commonPool metrics to catch anyone blocking in it again."

> Senior tip: apply bulkheads per dependency. When the queue is already full, failing fast is usually better than queuing work that will definitely miss its deadline.`,
    follow: [
      'Why do virtual threads still need a semaphore?',
      'Which CompletableFuture stage by default may run on the common pool?'
    ]
  },
  'jvm-023': {
    q: 'A service has a large heap and sensitive p99: do you pick G1 or Generational ZGC, and what benchmark is trustworthy enough?',
    a: `**Summary:** G1 balances throughput and pause with a **soft** pause target ({{MaxGCPauseMillis}}); Generational ZGC aims for very short pauses (under 1 ms) by doing almost all of its work **concurrently** with the application, at the cost of extra CPU. The decision rests on the latency SLO, the remaining CPU/RSS headroom and a benchmark run with the right runtime and the right load — not on a single pause number.

### Quick intuition
Compare two ways of cleaning a large supermarket. **G1** closes one section for a few dozen milliseconds to clean it quickly, and shoppers in that section have to wait a bit. **ZGC** has staff clean while shoppers keep shopping, so almost nobody waits, but it needs extra staff (CPU) and every shopper walks slightly slower (the barrier). If the supermarket is already short-staffed at peak hours (CPU at the limit), adding parallel cleaning just makes everything slower. That is why you must try both **during real peak hours** before choosing.

### Glossary
- **SLO**: a service-level objective, for example "p99 under 50 ms".
- **p99 / p999**: 99% / 99.9% of requests are faster than this number — it measures the slow "tail".
- **Region**: a memory cell that G1 splits the heap into; G1 collects region by region.
- **Mixed collection**: a G1 GC cycle that collects young regions plus some old regions with a lot of garbage.
- **Load barrier**: a small piece of code ZGC inserts on every reference read so it can fix pointers while GC moves objects.
- **Generational ZGC**: ZGC split into young/old (JEP 439, JDK 21); the default ZGC mode from JDK 23.
- **Headroom**: the resource (CPU, RAM) still free at peak.
- **Canary**: rolling a change out to a small group of instances before applying it everywhere.

### Trade-off (step-by-step reasoning)
1. **G1** splits the heap into regions, has young/mixed collection and concurrent marking; some phases (copying objects) are still stop-the-world. {{MaxGCPauseMillis}} (default 200 ms) is a target that guides how many regions G1 collects per cycle, **not an SLA**: when the heap is tight or allocation explodes, pauses can still exceed it.
2. **Generational ZGC** exploits object age (collecting young often and cheaply) and uses load barriers to mark, relocate and compact while the application runs. JEP 439 brought generational mode to JDK 21; it is the default from JDK 23, and JDK 24 removed the old mode.
3. **Concurrent work consumes CPU.** If the CPU quota is already at the limit, reducing pauses may turn into lower throughput, or even allocation stalls (a thread waiting for GC because collection cannot keep up).
4. **RSS**: ZGC usually needs more heap than the live set to have room to breathe; both collectors also have metaspace, direct memory and thread stacks that count in RSS outside the heap.

| Criterion | G1 | Generational ZGC |
|---|---|---|
| Typical pause | a few ms to a few dozen ms | under 1 ms |
| Dependence on heap size | pause grows with the amount of live objects to copy | almost none |
| CPU overhead | lower | higher (GC threads + barriers) |
| Throughput | usually a bit better | may be a bit lower |
| When it fits | most services | p99 dominated by GC pauses, large heap |

### Selection process (a trustworthy benchmark)
1. **Same conditions**: same heap limit, same JDK build, same container quota (CPU/RAM), same dataset and request mix. Why: changing any other variable makes the result meaningless.
2. **Stable warm-up** before measuring; measure several runs, at peak, in bursts, and right after a cold deploy.
3. **Compare several metrics at once**: p99/p999, throughput, CPU, RSS, allocation rate, pause distribution and total GC time.
4. **Run long enough** (a few hours) to see full old-gen cycles, not just young GC.
5. **Canary** a group of instances in production and keep the rollback config ready.

~~~bash
-Xlog:gc*,safepoint:file=/logs/gc.log:time,uptime,level,tags
# G1:  -XX:+UseG1GC -XX:MaxGCPauseMillis=100
# ZGC: -XX:+UseZGC   (JDK 21 also needs -XX:+ZGenerational; JDK 23+ does not)
~~~

~~~text
Example result of a 2-hour load test, 4 vCPU pod, 8 GB heap (illustrative numbers)
              p99     p999    throughput   CPU peak   RSS
G1            38 ms   120 ms  10,000 rps   62%        9.6 GB
Gen ZGC       21 ms    35 ms   9,600 rps   78%        10.1 GB
=> ZGC wins on latency; choose it if the SLO is about p999 and there is CPU headroom at peak
~~~
Read the GC log together with JFR; remember that metaspace, direct memory and thread stacks also count in RSS outside the heap.

### Common mistakes
- **Comparing with a 5-minute benchmark on a laptop**: you never see the old-gen cycle and the CPU is different from production. Avoid it by running in a container with the same quota for a few hours.
- **Looking only at the average pause**: G1's average looks great but p999 is bad. Avoid it by comparing the pause distribution and the p999 of requests.
- **Switching to ZGC when CPU peak is already 85%**: overall latency gets worse, with allocation stalls. Avoid it by adding CPU or staying on G1.
- **Setting Xmx to the whole memory limit so ZGC "has room"**: the pod gets OOMKilled. Avoid it by accounting for the native part too.

### One-minute spoken answer
"G1 splits the heap into regions and collects them in groups with a soft pause target, and MaxGCPauseMillis is not a commitment; Generational ZGC marks and relocates concurrently thanks to load barriers so pauses are under one millisecond, but it costs extra CPU and usually needs a larger heap. I do not choose by a single pause number but by the SLO and by CPU and RSS headroom. A trustworthy benchmark uses the same JDK, the same heap and container quota, the same data and request mix, has a warm-up, runs for a few hours, and compares p99, p999, throughput, CPU and RSS. Then I canary in production with a rollback config. If ZGC hits the latency but drains CPU at peak, I stay on G1."

> Senior tip: if the pause target is met but CPU headroom is exhausted at peak, that collector is not production-ready. Do not set Xmx to the container's full memory limit.`,
    follow: [
      'Why is MaxGCPauseMillis not a commitment?',
      'What do you monitor to know ZGC is taking CPU from the application?'
    ]
  },
  'jvm-024': {
    q: 'A benchmark shows object allocation disappears after warm-up. What do escape analysis and scalar replacement explain, and why is it not a contract?',
    a: `**Summary:** once a method is hot, JIT C2 can prove that an object **does not escape** the scope it can analyze, then replace that object with individual scalar variables (scalar replacement) — the allocation disappears — and drop locks nobody else can observe (lock elimination). This is a **runtime optimization that depends on profiles**, not a guarantee of the language or the bytecode: change the JDK, change how the method is called, or make the code a little more complex, and it may stop happening.

### Quick intuition
Suppose every time you compute a bill you take a fresh sheet of scratch paper (allocate an object), write two numbers, add them and throw the paper away. After a few thousand times a clever assistant notices "this sheet never leaves the desk", so they just do the arithmetic in their head (variables in registers) — no more paper. But they only do that when they are **sure** the sheet is never handed to anyone; if on some path the sheet is carried to another room, they must go back to real paper. The benchmark showing "allocation disappears after warm-up" is the moment the assistant starts doing the math in their head.

### Glossary
- **Escape analysis**: analyzing whether a reference to an object escapes the current method/thread.
- **Scalar replacement**: replacing an object with its individual fields as local variables/registers.
- **Lock elimination (elision)**: dropping synchronized on an object that only one thread can see.
- **Inline**: copying the body of a called method into the call site; escape analysis can only see what has been inlined.
- **Profile**: runtime statistics (actual types, which branches run) collected by the interpreter/C1.
- **Deoptimization**: discarding optimized code when the profile's assumptions no longer hold.
- **JMH**: the official OpenJDK benchmarking framework; it handles warm-up, forking and dead-code elimination.
- **Dead-code elimination**: the JIT removes code whose result is never used.

### The process (step by step)
1. **Collect profiles**: the interpreter/C1 count invocations and record actual types; tiered compilation hands hot methods to C2. Why it matters: before that there is no such optimization, so a cold benchmark still sees allocation.
2. **Inline**: C2 inlines small called methods. Why it matters: if the object is passed to a method that is not inlined, the JIT must treat the object as escaped.
3. **Escape analysis**: check whether the reference is returned, stored in a field/static, put into a collection, passed to another thread, or passed into a call it cannot analyze.
4. **Scalar replacement**: if the object does not escape, each field stays in a register or local variable; there is no more {{new}} on the heap.
5. **Lock elimination**: a monitor on a non-escaping object that nobody can observe is dropped.
6. **Deoptimize when assumptions change**: for example a new implementation gets loaded, or a rare branch starts running — the optimized code is discarded, execution falls back to slow code and recompiles, and the allocation may reappear.

~~~java
record Point(int x, int y) {}

long sumDistance(int[] xs, int[] ys) {
    long total = 0;
    for (int i = 0; i < xs.length; i++) {
        Point p = new Point(xs[i], ys[i]);   // does not escape: eligible for scalar replacement
        total += Math.abs(p.x()) + Math.abs(p.y());
    }
    return total;
}

List<Point> cache = new ArrayList<>();
void keep(int x, int y) {
    cache.add(new Point(x, y));              // escapes into a field -> must really allocate
}
~~~

~~~text
Allocation rate measured with JFR on sumDistance (illustrative numbers)
0-10 s   (interpreter/C1)  : ~800 MB/s
after C2 compile           : ~0 MB/s   <- scalar replacement
after deopt (new class)    : ~800 MB/s for a few seconds, then back to ~0 when C2 recompiles
~~~

### Measuring correctly
- Use JFR ({{jdk.ObjectAllocationSample}}) or async-profiler in alloc mode to find hot allocation on the **real workload**, not only in a microbenchmark.
- JMH needs warm-up, multiple forks and dead-code elimination protection ({{Blackhole}} or returning the result); benchmarking a single cold loop usually just measures the interpreter.
- You can compare by temporarily turning the optimization off in an experiment ({{-XX:-DoEscapeAnalysis}}) to see the difference — only for measurement, never in production.
- Objects that escape or overly complex code (a method too large to inline, many branches merging objects) can block the optimization. Do not conclude that records or small objects "are always allocated on the stack" — HotSpot has no stack allocation, only scalar replacement when conditions allow.

### Common mistakes
- **Writing your own benchmark with a for loop**: the numbers fluctuate and the JIT sometimes removes the whole loop. Avoid it by using JMH.
- **Designing an API around the assumption that allocation is free**: on another JDK or after a small code change, GC pressure spikes. Avoid it by measuring the real workload and not treating a JIT optimization as a contract.
- **Optimizing allocation when GC is not the bottleneck**: harder-to-read code with no improvement. Avoid it by optimizing only when the allocation flame graph proves it takes a significant share of CPU/GC.
- **Passing objects into large methods or through interfaces with many implementations**: inlining is lost and the object escapes. Avoid it by keeping hot paths simple and checking with a profiler instead of guessing.

### One-minute spoken answer
"Allocation disappearing after warm-up is C2's work: once the method is hot enough and the small calls are inlined, escape analysis proves the object is not returned, not stored in a field and not passed outside, so the JIT replaces it with scalar variables in registers and drops locks on it. But that is a profile-dependent optimization: before C2 compiles, allocation still happens; when the assumptions change it deoptimizes; and more complex code or a different JDK may not get the optimization. So I do not treat it as a contract. I measure with JMH with warm-up and forks, and with JFR or async-profiler alloc on the real workload, and I only optimize allocation when the numbers show it really pressures GC."

> Senior tip: optimize allocation only when the allocation flame graph proves it takes a significant share of CPU/GC. Design clear code first; do not depend on a JIT optimization that is hard to reproduce across JDK versions.`,
    follow: [
      'How does escape through a static field affect the analysis?',
      'Why does JMH need warm-up and fork?'
    ]
  },
  'jvm-025': {
    q: 'Latency increases minutes after deploy, then drops; compilation and deoptimization rise. Explain tiered compilation and how do you investigate?',
    a: `**Summary:** HotSpot starts with the interpreter and C1, collects profiles, then compiles hot methods with C2; this warm-up period and the deoptimizations make latency high for a few minutes after deploy and then fall back by itself. Before changing compiler flags, correlate JIT activity (compilation, deopt, compiler-thread CPU), the code cache, class loading and GC — because many "cold" things happen at the same time after deploy (connection pools, caches), and correlation is not causation.

### Quick intuition
A football team that just walked onto the pitch cannot play at full speed right away: it has to warm up, get used to the grass and read the opponent's play. The JVM is the same: for the first few minutes it plays "slowly" (interpreter, C1) to observe which code runs often, and only then "accelerates" (C2). If the opponent changes tactics (a wrong assumption), the team has to step back and adjust (deoptimization). But a slow first hour can also be because the pitch is wet (empty caches) or the team is short-handed (a connection pool not yet open) — you have to look at all the causes before blaming the warm-up.

### Glossary
- **Tiered compilation**: compiling at several tiers: interpreter -> C1 -> C2.
- **Invocation / back-edge counter**: counters of how many times a method is called / how many loop iterations, which decide when to compile.
- **Instrumentation**: extra code C1 inserts to collect profiles, making the code run a bit slower.
- **Deoptimization**: discarding optimized machine code when an assumption (type, class hierarchy, branch) no longer holds.
- **Code cache**: the region holding JIT machine code; when it is full, compilation stops or degrades.
- **CDS / AOT cache**: classes pre-processed and stored ahead of time for faster startup (the AOT cache arrives in JDK 24).
- **Readiness probe**: a Kubernetes check that decides when a pod may receive traffic.
- **Canary**: a small group of instances that receives the new version first.

### Tiered compilation (step by step)
1. **Interpreter** runs bytecode and records invocation/back-edge counters. Why start here: it avoids spending compile time on code that only runs a few times.
2. **C1** compiles quickly at different optimization levels and may attach instrumentation to collect profiles (actual types, which branches run).
3. **C2** uses the profiles to inline and optimize aggressively. While C2 works, compiler threads burn CPU that competes with requests.
4. **Deoptimization**: when assumptions about types or the class hierarchy no longer hold (a new class is loaded, a rare branch starts running), code falls back to a lower tier and is recompiled.
5. **Code cache** stores machine code; a full code cache can stop compilation or degrade it, and performance erodes over time.

~~~text
p99 (ms)
 300 |*
 200 | * *            <- interpreter/C1 + compiler threads eating CPU
 100 |     * *  *     <- C2 compiles gradually, a few deopts
  40 |           * * * * * * * *   <- stable
     +--------------------------------> minutes after deploy
       0   1   2   3   4   5   6
~~~

### Investigation (step by step)
1. **Record data in the canary**: JFR (events {{jdk.Compilation}}, {{jdk.Deoptimization}}, {{jdk.CodeCacheFull}}, {{jdk.ClassLoad}}) and short compilation/deoptimization logs; look at compiler-thread CPU, code cache usage and class load counts.
2. **Separate the other "cold" sources**: connection-pool initialization, empty caches, TLS handshakes to dependencies, whether CDS is used, GC while the heap is growing. These often happen **at the same time** as JIT warm-up.
3. **Compare with a control group**: instances that are already warm on the same version; if the gap exists only in the first few minutes and lines up with the compilation peak, JIT is the main cause.
4. **Controlled warm-up** before receiving traffic (readiness only reports ready after a sample workload has run), but it must hit **real code paths**, not just health checks.
5. **Do not disable tiered compilation** based only on correlation: that change can lower throughput permanently or make startup even slower.

~~~bash
java -XX:+PrintCompilation -jar app.jar          # temporarily in the canary
jcmd <pid> Compiler.codecache                    # current code cache usage
jcmd <pid> JFR.start duration=5m filename=/data/warmup.jfr
~~~

### Pitfalls
- Health checks usually do not warm hot paths, so a "ready" pod still runs the interpreter on its main endpoints.
- Benchmarks need enough warm-up and the same image/runtime as production.
- CDS/AOT cache can shorten startup and class loading but does not remove all JIT warm-up (JDK 25 stores more method profiles in the AOT cache to shorten this part; you still need to measure).

### Common mistakes
- **A readiness probe that only calls /health**: p99 spikes when a new pod takes real traffic. Avoid it by warming up with sample requests on the main endpoint before reporting ready.
- **A rolling update that is too fast**: many pods are cold at the same time and the whole cluster slows down. Avoid it with a small {{maxSurge}} and extra wait time between batches.
- **A pod with too little CPU**: compiler threads compete with requests and warm-up drags on. Avoid it by giving enough CPU (or a CPU limit above the request) in the first phase.
- **Blaming the JIT while empty caches are the culprit**: optimizing the wrong thing. Avoid it by separating each cold source with its own metric.

### One-minute spoken answer
"HotSpot runs code in the interpreter first, counts invocations and loops, hot methods get compiled by C1 with instrumentation to collect profiles, and then C2 uses those profiles to inline and optimize aggressively. In the first few minutes compiler threads eat CPU and the code is not yet optimized, plus deoptimizations when assumptions turn out wrong, so latency is high and then falls. When investigating I record JFR and compilation logs in the canary, look at compiler-thread CPU, code cache and class loading, and separate the other cold sources such as the connection pool or empty caches by comparing against a group of already-warm instances. The handling is to warm up with real code paths before readiness reports ready and to give enough CPU, not to disable tiered compilation just because of a correlation."

> Senior tip: keep a group of warmed instances as a reference during rollout. Compare p99 with CPU, compilation and error rate to distinguish JIT effects from dependency cold start.`,
    follow: [
      'How is deoptimization different from a compilation failure?',
      'What are the symptoms when the code cache is full?'
    ]
  }
});
