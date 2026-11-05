/*
 * English translation of js/data/q-concurrency-jvm.js — task T654. Format: js/core/i18n.js (content overlay).
 * ids: jvm-028 jvm-029 jvm-030 jvm-031 jvm-032 concurrency-030 concurrency-031
 */
App.i18n.content({
  'jvm-028': {
    q: "After a traffic spike, a Java pod still holds RSS near its peak even though the heap after GC is only 20% full. Why doesn't the JVM give memory back to the OS, and how do you choose {{-Xms}}, {{AlwaysPreTouch}} and heap uncommit for each kind of workload?",
    a: `**Summary:** A heap has three different numbers: **used** (what live objects currently occupy), **committed** (the region the JVM has already asked the OS for) and **max** ({{-Xmx}}). RSS follows committed, not used. G1 only shrinks the committed heap after a Full GC or at the end of a concurrent mark cycle, so once a service stops taking traffic it also stops doing GC, and RSS stays flat. For a latency-sensitive API on K8s I set {{-Xms}} = {{-Xmx}} and accept a fixed RSS; for batch work or several JVMs sharing a machine I let the heap shrink through periodic uncommit.

### The three numbers of a heap
~~~text
max (Xmx)   |-----------------------------------------|  4 GB   (only reserves virtual address space)
committed   |----------------------------|               2.8 GB (already asked from the OS)
used        |-------|                                    600 MB (live objects)
~~~
- **Reserve**: at startup the JVM pre-reserves a range of virtual addresses of size Xmx. No real RAM is spent yet.
- **Commit**: the JVM tells the OS it intends to use this region. Linux hands out physical pages lazily: a page only counts toward RSS once it has been written for the first time.
- **Uncommit**: the JVM gives the region back to the OS. Only at this point does RSS go down.

Why the JVM does not return memory right after every GC: commit/uncommit costs system calls, and every page that has to be requested again pays a page fault the first time it is touched. If you return memory and traffic rises again immediately, latency gets bad exactly when you need it good. So the GC keeps the already-committed part "in reserve".

### When each GC shrinks the heap
| GC | When it uncommits | Related flag |
|---|---|---|
| G1 | After a Full GC and at the end of a concurrent cycle, driven by {{MinHeapFreeRatio}}/{{MaxHeapFreeRatio}} (default 40/70) | {{-XX:G1PeriodicGCInterval=<ms>}} (JEP 346, JDK 12): if the heap has been idle long enough, run one cycle just to shrink it |
| ZGC | Automatically uncommits unused regions after a delay (JEP 351) | {{-XX:ZUncommitDelay}} (seconds, default 300), {{-XX:-ZUncommit}} to switch it off |
No GC shrinks the heap below {{-Xms}}. Setting Xms = Xmx means switching the ability to return memory off completely.

### A real example
A service reports: on normal days heap used is 500 MB, at month end an export job pushes committed up to 3.5 GB. After the export finishes, traffic is low so young GCs are rare, old gen never crosses the IHOP threshold so there is no concurrent cycle, and there is no Full GC either. RSS stays at 3.5 GB for the whole month. A node running 6 such pods falls under memory pressure and the kubelet evicts other pods.

~~~bash
# Batch / several JVMs on one node: let the heap shrink
-Xms512m -Xmx4g -XX:+UseG1GC -XX:G1PeriodicGCInterval=60000   # idle 60 s -> run one cycle
# Latency-sensitive API, Guaranteed pod (request = limit): pin the heap, touch every page up front
-Xms3g -Xmx3g -XX:+AlwaysPreTouch
~~~

### AlwaysPreTouch: trade startup time for stable latency
{{-XX:+AlwaysPreTouch}} writes to every page of the heap at startup. Benefit: no scattered page faults during traffic serving (when GC copies objects into a region touched for the first time, the pause gets longer); RSS equals Xms from the very beginning, so if the limit is too small the pod dies at start instead of dying at peak. Cost: slower startup (the bigger the heap, the longer it takes), which does not suit CLI tools or scale-to-zero workloads.

### Choosing by workload
| Workload | Xms | Uncommit | PreTouch |
|---|---|---|---|
| Latency-sensitive API, Guaranteed pod | = Xmx | Not needed | On |
| Bursty batch, several JVMs sharing a node | Small (about 25% of Xmx) | G1PeriodicGCInterval or ZGC | Off |
| Dev, CI, internal tooling | Small | On | Off |

### Production pitfalls
- Setting a small Xms for an API: the heap grows step by step across many GCs; during the first minutes after a deploy GCs are frequent and latency is bad. Worse, you only discover the limit is too small when the heap has fully expanded during peak hours.
- Calling {{System.gc()}} to "give RAM back": you pay a full stop-the-world Full GC, and many images set {{-XX:+DisableExplicitGC}} so the call does nothing at all.
- Inferring RSS from {{jvm_memory_used_bytes}}: you must look at {{jvm_memory_committed_bytes}} plus the container's RSS ({{container_memory_working_set_bytes}}).
- RSS is high but committed heap is low: the culprit is outside the heap (metaspace, thread stacks, direct buffers, malloc); you need NMT, not uncommit.

> Senior tip: on K8s I default to Xms = Xmx + AlwaysPreTouch for online services, because with a Guaranteed pod the scheduler has already reserved that RAM for you; handing it back to the OS does not let any other pod use it, and it costs latency. Uncommit is only worth switching on when several JVMs genuinely share RAM or jobs run in bursts. Before tuning anything, plot used, committed and RSS next to each other on one dashboard: most "why doesn't RAM go down" questions answer themselves from that chart.`,
    follow: [
      "Why can a small Xms make a pod get OOMKilled only during peak hours instead of right at startup?",
      "What does G1PeriodicGCInterval do to the CPU and latency of a service that is idle?",
      'Which metrics let you distinguish "the heap has not shrunk yet" from a native memory leak?',
    ],
  },
  'jvm-029': {
    q: 'Production logs are full of {{java.lang.NullPointerException}} lines with no stack trace and no message, while right after the deploy they had both. Why does the JVM do this, where does the real cost of creating an exception sit, and how do you handle it?',
    a: `**Summary:** This is the {{OmitStackTraceInFastThrow}} optimisation of the C2 JIT compiler, on by default: when certain **implicit** exceptions thrown by the JVM itself (NullPointerException, ArithmeticException, ArrayIndexOutOfBoundsException, ArrayStoreException, ClassCastException) keep happening over and over at the same place in compiled code, the JVM substitutes a pre-built exception object - no stack trace, no message. The reason: capturing the stack trace is the most expensive part of an exception. What to do: find the earliest occurrence in the logs (it still has a full stack), consider running with {{-XX:-OmitStackTraceInFastThrow}}, and above all fix the code so that the normal flow does not throw exceptions in a loop.

### Where an exception is expensive
The constructor of {{Throwable}} calls {{fillInStackTrace()}}: the JVM walks backwards over the thread's whole stack and captures every frame. The stack of a Spring request passing through Tomcat, filters and proxies is typically 100-200 frames deep. When you log it, {{getStackTrace()}} additionally converts the raw data into an array of {{StackTraceElement}} (class, method, file, line) and the logger joins it into a string of several KB.

| Step | Relative cost |
|---|---|
| {{throw}}/{{catch}} inside a method that is already JIT-compiled | Cheap, the JIT can turn it into a jump instruction |
| Creating the exception + fillInStackTrace | Expensive, proportional to stack depth (microsecond range) |
| Logging the stack trace to file/JSON | The most expensive: string formatting, I/O, log storage cost |

Compared with an {{if}} statement that costs nanoseconds, creating an exception with a stack is thousands of times more expensive. Throwing a few per minute is harmless; throwing thousands per second inside the normal request flow becomes a CPU problem.

### The fast-throw mechanism step by step
1. The method {{sum()}} runs hot, so C2 compiles it.
2. The profile shows the "implicit NPE is thrown" branch at {{o.total()}} really does happen many times.
3. C2 recompiles: instead of creating a new NPE, it throws a **pre-built** NPE instance with no stack trace and no message (not even the helpful NPE message introduced in JDK 14+).
4. From then on the log only contains the bare exception name.

~~~text
10:00:01 ERROR java.lang.NullPointerException: Cannot invoke "Order.total()" because "o" is null
    at com.shop.Report.sum(Report.java:42) ...       <- the first occurrences: full stack
10:07:45 ERROR java.lang.NullPointerException        <- after C2 optimised it: completely blank
~~~
This only applies to exceptions the JVM throws implicitly. A {{throw new IllegalArgumentException(...)}} that you wrote yourself is never trimmed.

### What to do when you hit it
- Find the **earliest** occurrence after a deploy/restart: the first few still have a full stack.
- Turn on {{-XX:-OmitStackTraceInFastThrow}} so the stack is always there. The trade-off: if the NPE genuinely happens thousands of times per second, CPU and log volume go up - but that is a bug to fix, not a reason to hide it.
- Alert on duplicated ERROR lines: this optimisation only kicks in when an exception repeats at high frequency.

### Do not use exceptions as control flow
~~~java
// Wrong: 30% of the lines are empty, and each empty line creates an exception with a stack
try { qty = Integer.parseInt(s); } catch (NumberFormatException e) { qty = 0; }

// Right: check first, exceptions are only for genuinely abnormal cases
qty = (s == null || s.isBlank()) ? 0 : Integer.parseInt(s.strip());

// A predictable business error, thrown very often, a stack tells you nothing:
final class QuotaExceeded extends RuntimeException {
    QuotaExceeded(String msg) {
        super(msg, null, false, false); // disable suppression, do not record a stack trace
    }
}
~~~
The 4-argument constructor {{(message, cause, enableSuppression, writableStackTrace)}} has existed since Java 7 and is protected, so only a subclass can call it. Use it only for business errors answered with 4xx; technical errors must always keep their stack.

### Production pitfalls
- Logging a full stack for predictable 4xx errors (validation, quota): logs balloon, storage cost rises, real errors get buried.
- Catching then {{throw new XxxException(e.getMessage())}}: you lose the original stack; always pass {{e}} as the cause.
- Concluding "the logger is misconfigured, that's why the stack is missing": the real author is the JIT.

> Senior tip: when I see a bare NPE in the logs I immediately know "this bug has already happened a great many times" - I do not need to read a stack to know its scale. In the services I own, {{-XX:-OmitStackTraceInFastThrow}} is part of the standard flag set: a little performance lost in the worst case, in exchange for never having to restart a pod just to get a stack trace back in the middle of an incident.`,
    follow: [
      'Why is only the implicit JVM-thrown exception optimised, while an exception you throw yourself is not?',
      'When do you use writableStackTrace = false, and when absolutely not?',
      'How do you measure the cost of creating an exception so the number is trustworthy instead of a guess?',
    ],
  },
  'jvm-030': {
    q: 'A colleague measured with a {{for}} loop plus {{System.nanoTime()}} and concluded that variant B is 10 times faster than variant A. Why is this kind of micro-benchmark usually wrong on the JVM, and how would you rewrite it with JMH so the result is trustworthy?',
    a: `**Summary:** The JVM changes the code while it runs: interpreter, then C1, then C2; inlining; deleting code whose result is never used; computing constants up front; replacing a running loop with a compiled version (OSR). A hand-written for loop usually measures the warm-up phase, or measures code the JIT has already deleted. JMH (OpenJDK's Java Microbenchmark Harness) handles warm-up, runs each benchmark in its own JVM (fork), prevents code deletion through returned values or {{Blackhole}}, and reports results with an error margin. Even with JMH, a micro-benchmark answers only a narrow question; a production decision must be based on a profile taken under real load.

### Five traps of the hand-written for loop
| Trap | What happens | Consequence |
|---|---|---|
| No warm-up | Interpreter time and compile time are mixed into the measurement | Whatever ran first is penalised |
| Dead-code elimination | Nobody uses the result, so C2 deletes the whole computation | Absurdly "fast", under 1 ns/op |
| Constant folding | The input is a constant, the JIT computes the answer at compile time | You measure an assignment, not an algorithm |
| OSR | A long loop inside {{main}} is swapped mid-flight for a less optimised compiled version | Numbers differ completely from the same code placed in a method called many times |
| Measuring A then B in the same JVM | A's profile influences how B is compiled (polymorphic call sites, GC state) | Swap the order and you swap the result |

A real example: "B is 10 times faster" because B finishes computing but never returns the result, so C2 deleted almost the entire method body.

### Rewriting it with JMH
~~~java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@Warmup(iterations = 5, time = 1)          // 5 x 1 second so the JIT settles down
@Measurement(iterations = 5, time = 1)
@Fork(2)                                   // 2 separate JVMs, profiles do not bleed into each other
@State(Scope.Thread)
public class JoinBench {
    @Param({"10", "1000"})                 // measure at several input sizes
    int size;
    List<String> items;

    @Setup(Level.Trial)
    public void setup() {                  // build the data outside the measured part
        items = IntStream.range(0, size).mapToObj(i -> "item" + i).toList();
    }

    @Benchmark
    public String streamJoin() {           // returns the result: JMH consumes it, the JIT cannot delete it
        return items.stream().collect(Collectors.joining(","));
    }

    @Benchmark
    public void stringJoin(Blackhole bh) { // alternative: feed the result into a Blackhole
        bh.consume(String.join(",", items));
    }
}
~~~
Run it: {{java -jar target/benchmarks.jar JoinBench -prof gc}}. The {{gc}} profiler additionally prints {{gc.alloc.rate.norm}} (bytes allocated per op). That number is usually more important than ns/op, because allocation puts GC pressure on the whole service, not only on the function being measured.

### Reading the result
~~~text
Benchmark             (size)  Mode  Cnt     Score     Error  Units
JoinBench.streamJoin    1000  avgt   10  9120.4 ±  310.2  ns/op
JoinBench.stringJoin    1000  avgt   10  7480.9 ±  255.7  ns/op
~~~
(illustrative numbers)
- Look at the Error column: if the error bars of the two sides overlap, you cannot conclude anything yet.
- A 20% difference on a 9 µs operation only matters when it sits in a hot path executed very many times per second.
- The two benchmarks must do **exactly the same job** (same output); comparing two different functions is a mistake reviewers catch often.

### Pitfalls when using JMH
- Running it in the IDE or on a laptop with many things open: use a quiet machine, the same JDK, the same GC, the same number of cores as production.
- {{@Setup(Level.Invocation)}} for a very short benchmark: the setup cost bleeds into the measurement.
- Benchmarking one isolated function and concluding the whole service is faster: in a real service, CPU cache, GC and lock contention behave completely differently.
- Not recording the JDK version, flags and hardware: nobody can reproduce the result.

> Senior tip: when reviewing a "performance optimisation" PR I ask for three things: (1) a production profile or a load test that points at exactly this hot spot, (2) JMH proving the improvement is larger than the error margin, with {{-prof gc}}, (3) p99 re-measured after the deploy. Missing (1) usually means optimising a place nobody cares about; missing (3) means you still do not know whether the improvement is real.`,
    follow: [
      'Why does JMH recommend @Fork instead of running all benchmarks in one JVM?',
      'When do you measure throughput (Mode.Throughput) instead of average time, and how do you measure latency percentiles?',
      'What does gc.alloc.rate.norm tell you that ns/op does not?',
    ],
  },
  'jvm-031': {
    q: 'The team attached an OpenTelemetry/APM Java agent to every service: startup got slower, CPU went up, and at one point a service would not even boot because of {{VerifyError}}. How does a Java agent work internally, where are the risks, and how do you roll an agent out to production?',
    a: `**Summary:** A Java agent is a JAR that the JVM loads before {{main}} via {{-javaagent}}. It receives an {{Instrumentation}} object and registers a {{ClassFileTransformer}} to **rewrite the bytecode** of a class at the moment that class is loaded (or to retransform classes that are already loaded). An APM agent injects timing code and trace-context propagation into hundreds of libraries. The price: startup slows down because every class passes through the transformer, CPU and allocation increase at every instrumented point, and wrongly generated bytecode - or two agents editing the same class - can cause {{VerifyError}}. Bringing one to production means measuring the overhead, switching off instrumentation you do not need, pinning the version, and having a switch to detach the agent quickly.

### The mechanism step by step
1. The JVM starts with {{-javaagent:/otel/opentelemetry-javaagent.jar}}. The JAR's manifest declares {{Premain-Class}}.
2. Before {{main}}, the JVM calls the agent's {{premain(String args, Instrumentation inst)}}.
3. The agent calls {{inst.addTransformer(...)}}. From then on **every class** that gets loaded (Spring, Hibernate, the JDBC driver...) passes through {{transform}}: it receives the bytecode as a byte array and returns a new byte array, or {{null}} to keep it unchanged.
4. The agent uses Byte Buddy/ASM to insert code at the beginning and the end of methods, for example around {{PreparedStatement.execute}}: open a span, measure duration, attach the SQL statement.
5. The new bytecode still goes through the verifier as usual before it can run.

~~~java
public final class TimingAgent {
    public static void premain(String args, Instrumentation inst) {
        inst.addTransformer(new ClassFileTransformer() {
            @Override
            public byte[] transform(ClassLoader loader, String className,
                                    Class<?> redefined, ProtectionDomain pd, byte[] bytes) {
                if (className == null || !className.startsWith("com/shop/")) {
                    return null;                 // null = leave it alone, the cheapest path
                }
                return Weaver.addTiming(bytes);  // hand-written class, uses ASM to rewrite bytecode
            }
        }, true);                                // true: allow retransform later on
    }
}
~~~

### Startup agent vs dynamically loaded agent
| | {{-javaagent}} at startup | Attaching to a running JVM |
|---|---|---|
| Entry point | {{premain}} | {{agentmain}} (manifest {{Agent-Class}}) |
| Used for | APM, tracing, code coverage | Profilers, diagnostic tools |
| Since JDK 21 | Normal | The JVM prints a warning (JEP 451); a later release is expected to disallow it by default, re-enabled with {{-XX:+EnableDynamicAgentLoading}} |
JEP 451 follows the "integrity by default" principle: a library must not attach an agent into its own JVM on the fly in order to bypass encapsulation. If your team needs a dynamically attaching tool regularly, enable the flag explicitly so that decision shows up in the configuration.

### Real costs and real risks
- **Startup**: the tens of thousands of classes of a Spring Boot app all pass through the transformer; a full APM agent typically adds several seconds to startup. That affects the readiness probe and autoscaling speed.
- **Runtime**: each span is a few objects; an endpoint doing 50 queries produces 50 spans. Sampling reduces export and storage cost, but the code that was already injected still runs on every request.
- **Conflicts**: two agents (APM + security agent) editing the same class can produce invalid bytecode, causing {{VerifyError}} or strange behaviour that only appears under a particular class-load order.
- **Version dependence**: an old agent cannot read class files of a new JDK or does not know a new library, so when you upgrade the JDK the agent is usually the first thing blocking you.
- **Security**: an agent has full power inside the JVM; the JAR must come from a trusted source and be checksum-verified.

### Rollout procedure for production
1. Measure before and after in a load test: startup time, p99, CPU, allocation rate.
2. Switch off instrumentation you do not need (the OTel agent allows enabling/disabling per library), and configure sampling sensibly.
3. Pin the agent version in the base image; upgrade it like a library: read the changelog, run a canary.
4. Have a switch: an environment variable that drops {{-javaagent}} during an incident, without rebuilding the image.
5. Write business spans through the API (OpenTelemetry API, Micrometer Observation) instead of hoping the agent guesses them.

> Senior tip: the incident I hit most often with agents is not overhead but **JDK upgrades**: going from 17 to 21, the service would not start because the old agent did not understand the new class file. Since then the agent is on the mandatory checklist for every JDK upgrade, and the pipeline always runs the smoke test **with the agent attached**, instead of testing without it in CI and only attaching the agent in production.`,
    follow: [
      'How do premain and agentmain differ, and what does JEP 451 change for dynamically loaded agents?',
      'When do you instrument with an agent and when with code (Micrometer Observation, OpenTelemetry API)?',
      'How do you prove that a VerifyError comes from a conflict between two agents?',
    ],
  },
  'jvm-032': {
    q: 'A service that processes large files uses {{ByteBuffer.allocateDirect}} and occasionally hits {{OutOfMemoryError}} about direct buffer memory even though the heap is free. Why is direct memory "not returned", and how does the Foreign Function & Memory API (Java 22) with {{Arena}} change off-heap memory management?',
    a: `**Summary:** {{allocateDirect}} allocates memory outside the heap, but that region is only released when the **small ByteBuffer object on the heap** is collected by the GC and its Cleaner runs. When the heap is mostly free the GC runs rarely, so gigabytes of off-heap memory can be held by buffers that are already dead but not yet cleaned; once {{-XX:MaxDirectMemorySize}} (default: as large as the max heap) is reached, the JVM throws OOM. The FFM API (JEP 454, final in Java 22, preview in Java 21) lets you allocate off-heap memory attached to an {{Arena}} and release it **deterministically** when the arena closes, with bounds checking and blocked use-after-free. In practice the best fix is simpler: do not allocate a new buffer per request - pool them, or stream through one fixed buffer.

### Why direct buffers stick around
~~~text
Heap:      [DirectByteBuffer, a few tens of bytes] --Cleaner--+
Off-heap:  [================ 64 MB native ============]<+
~~~
1. {{allocateDirect(64 MB)}} asks for 64 MB outside the heap and at the same time creates a small DirectByteBuffer object on the heap and registers a Cleaner for it.
2. Your code no longer references the buffer, but the 64 MB is still held until the GC notices that the small object is unreachable.
3. The small object has usually already been promoted to old gen, and old gen is only cleaned by a mixed or full GC. When the heap is idle, that cycle may not happen for hours.
4. On the allocation that would exceed the limit, the JDK waits for reference processing, calls {{System.gc()}}, and retries a few times; still short of room, it throws {{OutOfMemoryError: Cannot reserve ... bytes of direct buffer memory}}.
5. If the image sets {{-XX:+DisableExplicitGC}}, that GC call above does nothing, so the OOM arrives sooner.

### Comparing the ways to hold data
| | Heap byte[] | Direct ByteBuffer | FFM MemorySegment + Arena |
|---|---|---|---|
| Released | By the GC | When the GC collects the buffer (nondeterministic) | When the Arena closes (deterministic) |
| Max size | About 2 GB per array | About 2 GB (int index) | long offsets, beyond 2 GB |
| I/O with the OS | Must copy through a temporary native region | No extra copy | No extra copy |
| Safety | Fully safe | Bounds-checked | Bounds-checked + use-after-free blocked |
| Available since | Every JDK | Java 1.4 | Final in Java 22 |

### FFM API: deterministic allocation and release
~~~java
// Java 22+: an off-heap region that lives exactly as long as the arena
try (Arena arena = Arena.ofConfined()) {                 // only the creating thread may use it
    MemorySegment seg = arena.allocate(256L * 1024 * 1024); // 256 MB, size given as a long
    for (long off = 0; off < seg.byteSize(); off += 4) {
        seg.set(ValueLayout.JAVA_INT, off, 42);           // write an int at an offset
    }
    int first = seg.get(ValueLayout.JAVA_INT, 0);
}   // arena closes: 256 MB returned at once, no waiting for the GC
// using seg after close -> IllegalStateException, not reading garbage like a C pointer
~~~
- {{Arena.ofConfined()}}: one thread, cheap to close. {{Arena.ofShared()}}: several threads share it, closing costs more because it must make sure no thread is still accessing it. {{Arena.ofAuto()}}: the GC manages it, like ByteBuffer. {{Arena.global()}}: lives until the JVM exits.
- Need to hand the memory to an old API that takes a ByteBuffer: {{seg.asByteBuffer()}}.
- Java 21 LTS: FFM is still preview, needs {{--enable-preview}}, and is usually not used in production; on Java 25 LTS you can use it.

### Handling a direct-buffer incident
- Measure: {{BufferPoolMXBean}} for the pool named "direct", or the Micrometer metric {{jvm_buffer_memory_used_bytes}} with tag id=direct.
- Set {{-XX:MaxDirectMemorySize}} explicitly and count it in the container's RAM budget; left at the default (equal to Xmx), heap + direct can be double what you planned.
- Do not allocate a new direct buffer per request or per file: pool and reuse (Netty {{PooledByteBufAllocator}}), or stream through one fixed 64 KB buffer.
- If a service depends on direct buffers, do not enable {{DisableExplicitGC}}; if you want to stop a library's {{System.gc()}} from causing a Full GC, with G1 consider {{-XX:+ExplicitGCInvokesConcurrent}}.
- {{sun.misc.Unsafe}} for off-heap work: the memory-access methods are deprecated for removal (JEP 471, JDK 23) and print a warning from JDK 24 (JEP 498); FFM is the official replacement.

> Senior tip: when I see a direct-memory OOM, my first question is "who calls allocateDirect, and how many times per second?". In most cases it is hand-written code allocating a new buffer per file or per request. Switching to a fixed buffer pool usually takes off-heap from several GB down to a few tens of MB - far cheaper than raising the limit or rewriting against a new API.`,
    follow: [
      'Why is MaxDirectMemorySize defaulting to the max heap dangerous when you size a pod memory limit?',
      'Where do Arena.ofConfined and Arena.ofShared differ, and why is closing a shared arena more expensive?',
      'When is data worth placing off-heap instead of on the heap, and what is the complexity price?',
    ],
  },
  'concurrency-030': {
    q: 'One hot cache key expires, 500 concurrent requests all miss it and all run the same expensive DB query. Inside a single JVM, how do you coalesce the duplicate loads (single-flight) correctly, how do you handle failures and timeouts, and what changes when you have many instances?',
    a: `**Summary:** The first request for a key creates **one** {{CompletableFuture}} representing the load and puts it into a {{ConcurrentHashMap<K, CompletableFuture<V>>}} with an atomic operation; later requests see that future and wait on the same result. When the load finishes, the future is removed from the map. Three things must be right: never run I/O inside a map lock, a failure must not "stick" to later callers, and one waiter's timeout must not poison the shared future. In production I use Caffeine's {{AsyncLoadingCache}} because it already does all of this; with several instances a local single-flight cuts the loads from 500 x N down to N, and to reach exactly one load cluster-wide you need proactive refresh or a distributed lock.

### Why duplicate calls are dangerous
The key "hot product price" expires at 20:00:00. In the next 50 ms, 500 requests arrive; each one sees a miss and runs a 200 ms query. The DB receives 500 identical queries, the pool of 20 connections is drained, and other APIs get stuck as well. This is a cache stampede inside one instance.

### Implementing single-flight
~~~java
final class SingleFlight<K, V> {
    private final ConcurrentHashMap<K, CompletableFuture<V>> inFlight = new ConcurrentHashMap<>();
    private final Executor loaderPool;                       // dedicated pool, bounded

    SingleFlight(Executor loaderPool) { this.loaderPool = loaderPool; }

    CompletableFuture<V> get(K key, Function<K, V> loader) {
        CompletableFuture<V> created = new CompletableFuture<>();
        CompletableFuture<V> existing = inFlight.putIfAbsent(key, created); // atomic, very fast
        if (existing != null) {
            return existing;                                 // someone is already loading: share the wait
        }
        loaderPool.execute(() -> {                           // I/O runs OUTSIDE the map lock
            try {
                created.complete(loader.apply(key));
            } catch (Throwable t) {
                created.completeExceptionally(t);            // every waiter receives the failure
            } finally {
                inFlight.remove(key, created);               // the failure is not kept for the next round
            }
        });
        return created;
    }
}
// Caller: sf.get(id, repo::loadPrice).copy().orTimeout(300, TimeUnit.MILLISECONDS)
~~~

### Each decision and why
1. **putIfAbsent, do not run the loader inside computeIfAbsent**: the mapping function of {{computeIfAbsent}} runs while the map holds the lock on that bin; a 200 ms query in there blocks every other key landing in the same bin.
2. **remove(key, created)** in its two-argument form: it removes exactly this round's future, never by mistake the future of a later load.
3. **Do not keep a failed future**: if a failed future stayed in the map, every later request would get the old error until a restart.
4. **A private timeout via {{copy()}}**: {{orTimeout}} completes **the very** future it is called on. Called directly on the shared future, the first waiter to lose patience makes all 500 waiters receive TimeoutException. {{copy()}} (Java 9) creates a separate child future per waiter.
5. **A bounded loader pool**: do not use the commonPool; the number of parallel loads equals the number of distinct keys currently missing, and it needs an upper bound.

### Comparing the options
| Approach | Coalescing inside one instance | Coalescing cluster-wide | Complexity |
|---|---|---|---|
| Do nothing | No | No | Low |
| Hand-written single-flight | Yes | No | Medium, easy to get wrong |
| Caffeine AsyncLoadingCache | Yes, plus expire/refresh | No | Low |
| Distributed lock (Redis SET NX) | Yes | Yes | High, adds latency and a failure point |
| Refresh before expiry | No coalescing needed | Almost | Medium |
Caffeine with {{refreshAfterWrite}} serves the stale value while loading the new one in the background, reloads a key only once, and users never have to wait.

### Production pitfalls
- The key does not include every parameter that affects the result (tenant, permissions, language): user A receives user B's data.
- The result is a mutable object shared with 500 waiters: one changes it and the others see the change. Return immutable objects.
- The key is arbitrary client input: an attacker sends random keys, each key triggers a load, single-flight does not help; you need validation and rate limiting.

> Senior tip: I measure the effect with the ratio "loader calls / miss requests": before coalescing it is close to 1, after coalescing a hot key can drop to 0.01. If you run 20 instances and the DB still cannot take 20 simultaneous loads, the answer is usually proactive refresh plus TTL jitter, not a distributed lock.`,
    follow: [
      'Why is calling orTimeout directly on the shared future a bug, and how does copy() fix it?',
      'How does refreshAfterWrite differ from expireAfterWrite from the end user point of view?',
      'When is a distributed lock worth more than local single-flight?',
    ],
  },
  'concurrency-031': {
    q: 'The API gets slower as load rises, but CPU is only at 30% and the DB is still idle. You suspect lock contention: which data proves it (thread dump, JFR, async-profiler), and how do you reduce contention without breaking the logic?',
    a: `**Summary:** The classic signature of lock contention: throughput stops rising while CPU is still available, latency grows with the number of concurrent requests, and a thread dump shows many threads {{BLOCKED}} "waiting to lock" on one and the same monitor address. Prove it with 3-5 thread dumps taken a few seconds apart, JFR events {{jdk.JavaMonitorEnter}}/{{jdk.ThreadPark}}, or async-profiler in {{lock}} mode. Fixes in priority order: move I/O out of the locked region, read without locks using an immutable snapshot, split the lock into several, use lock-free structures - and only last, change the lock type.

### Why locks cause "slow without costing CPU"
A lock lets only one thread into the critical section. If that section takes 2 ms, then even with 200 threads that lock serves at most 500 operations per second. The remaining threads do not run, they queue up, so CPU stays low. By Little's law, waiting time equals queue length divided by service rate: the more requests are waiting, the more latency rises, linearly.

### Collecting the evidence
~~~text
"http-nio-8080-exec-87" #112 daemon prio=5 ... waiting for monitor entry
   java.lang.Thread.State: BLOCKED (on object monitor)
        at com.shop.pricing.RateCache.get(RateCache.java:41)
        - waiting to lock <0x00000006c1a2b3c8> (a com.shop.pricing.RateCache)

"http-nio-8080-exec-12" #37 daemon prio=5 ... runnable
   java.lang.Thread.State: RUNNABLE
        at sun.nio.ch.NioSocketImpl.read(NioSocketImpl.java:...)
        ...
        at com.shop.pricing.RateCache.reload(RateCache.java:58)
        - locked <0x00000006c1a2b3c8> (a com.shop.pricing.RateCache)
~~~
How to read it: 150 threads wait on the same {{<0x00000006c1a2b3c8>}}, and the thread holding that lock is busy **reading a socket** (an HTTP call) inside the synchronized block. Root cause: I/O inside the critical section.
- Take 3-5 dumps 5 seconds apart ({{jcmd <pid> Thread.print}}): if the same lock address appears in every dump, it is not a coincidence.
- JFR: {{jcmd <pid> JFR.start duration=60s filename=lock.jfr settings=profile}}, open it in JMC and look at {{jdk.JavaMonitorEnter}} (waiting on synchronized) and {{jdk.ThreadPark}} (waiting on ReentrantLock and the other java.util.concurrent locks). Events are only recorded once a wait exceeds a configured threshold (about 10-20 ms), so the total wait time per lock is a trustworthy number.
- async-profiler: {{asprof -e lock -d 30 -f lock.html <pid>}} draws a flame graph of lock wait time and points straight at the call site.

### The fixes, in priority order
| Approach | Example | Caveat |
|---|---|---|
| Move I/O and slow work out of the lock | Do the HTTP call first, lock only when assigning the result | Two threads may load at once: accept it or coalesce (single-flight) |
| Immutable snapshot + volatile | Read without locks, write by swapping the whole object | Fits data that is read often and written rarely |
| Split the lock (striping) | ConcurrentHashMap instead of a synchronized Map | Operations spanning several keys need their own design |
| Lock-free structures | LongAdder for counters, AtomicReference | CAS retries a lot when contention is extreme |
| Change the lock type | ReadWriteLock/StampedLock when readers dominate | Only worth it when the read section is long enough; writers can starve |

Fixing the example above:
~~~java
final class RateCache {
    private final RateClient client;                       // HTTP client that fetches the rate table
    private volatile Map<String, BigDecimal> rates = Map.of(); // immutable snapshot

    RateCache(RateClient client) { this.client = client; }

    BigDecimal get(String ccy) {
        return rates.get(ccy);                // lock-free read, always sees a complete copy
    }

    void reload() {                           // called from a scheduled thread
        Map<String, BigDecimal> fresh = client.fetchAll();  // I/O outside every lock
        rates = Map.copyOf(fresh);            // volatile write: safely publishes the whole new map
    }
}
~~~

### Production pitfalls
- Replacing synchronized with ReentrantLock but keeping the I/O inside: a different lock, exactly the same contention.
- Locking on an object shared by accident: {{synchronized}} on an interned string, on a class literal, or a synchronized method on a singleton bean turning the whole service into one doorway.
- Synchronous logging: a file/console appender has a lock inside it; heavy logging on a hot path turns the logger into the contention point (use an async appender).
- "Fixing" it by growing the thread pool: more threads only make the queue in front of the lock longer and consume more memory.

> Senior tip: during an incident I look for the {{- locked <0x...>}} line in the thread dump and then check what the thread holding the lock is **actually doing**. Nine times out of ten it is doing I/O (HTTP, DB, file write) or logging. My review rule: no network call, query or sleep inside synchronized/lock, unless a comment explains why it is unavoidable.`,
    follow: [
      'Why does low CPU with high latency suggest lock contention rather than a CPU shortage?',
      'When does a StampedLock optimistic read genuinely help, and what are its risks?',
      'How does synchronous logging become a contention point, and what does an async appender trade away?',
    ],
  },
});
