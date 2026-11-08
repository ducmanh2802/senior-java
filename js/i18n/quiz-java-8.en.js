/*
 * English translation of js/data/quiz-java.js — task T1000. Format: js/core/i18n.js (content overlay).
 * ids: qz-core-028 qz-collections-027 qz-concurrency-028 qz-jvm-027 qz-modern-030 qz-collections-028 qz-concurrency-029 qz-concurrency-030 qz-concurrency-031 qz-concurrency-032 qz-jvm-028 qz-jvm-029 qz-jvm-030 qz-jvm-031 qz-core-029 qz-jvm-032 qz-concurrency-033 qz-collections-029 qz-jvm-033 qz-core-030
 */
App.i18n.content({
  "qz-core-028": {
    "q": `What does the following code print?
~~~java
record Box(int v) {}
Box a = new Box(1);
Box b = new Box(1);
System.out.println(a == b);
System.out.println(a.equals(b));
System.out.println(a.hashCode() == b.hashCode());
~~~`,
    "options": [
      `false true true`,
      `true true true`,
      `false false false`,
      `true false false`
    ],
    "explain": `**Correct answer: false true true.**

### Why it is correct
A record automatically generates {{equals}}/{{hashCode}} based on its components ({{v}} here), so two {{Box(1)}} instances are equal and have the same hash. But {{a}} and {{b}} are two distinct objects on the heap, so {{a == b}} is false.

### Why the other options are wrong
- **true true true**: a record does not intern itself; {{==}} still compares references.
- **false false false**: {{equals}}/{{hashCode}} are generated automatically, not identity-based.
- **true false false**: wrong in both directions.

> Senior tip: a record is an immutable value object; use it to avoid writing {{equals}}/{{hashCode}} by hand and to avoid breaking the contract.`
  },
  "qz-collections-027": {
    "q": `What does the following code print?
~~~java
Map<String, Integer> m = new HashMap<>();
m.put("a", 1);
m.put("b", 2);
m.merge("a", 10, Integer::sum);
m.computeIfAbsent("c", k -> 3);
System.out.println(m);
~~~`,
    "options": [
      `{a=11, b=2, c=3}`,
      `{a=1, b=2, c=3}`,
      `{a=10, b=2, c=3}`,
      `Throws NullPointerException`
    ],
    "explain": `**Correct answer: {a=11, b=2, c=3}.**

### Why it is correct
- {{merge("a", 10, sum)}}: key "a" already has value 1, the remapping function computes {{sum(1,10)=11}} and assigns 11.
- {{computeIfAbsent("c", ...)}}: key "c" is absent, so the function is called and returns 3, which is assigned.
- "b" is never touched.

### Why the other options are wrong
- **{a=1,...}**: {{merge}} does not ignore an existing key; it applies the function.
- **{a=10,...}**: {{merge}} accumulates, it does not replace.
- **NPE**: the function is not null and the key is not null, so nothing is thrown.

> Senior tip: {{merge}}/{{computeIfAbsent}}/{{computeIfPresent}} replace the "get then put" pattern in concurrent maps; on {{ConcurrentHashMap}} they are atomic.`
  },
  "qz-concurrency-028": {
    "q": `What is the problem with the following code?
~~~java
CompletableFuture<Integer> f = CompletableFuture.supplyAsync(() -> {
    if (true) throw new IllegalStateException("boom");
    return 1;
});
f.thenApply(x -> x + 1).exceptionally(e -> -1);
System.out.println(f.join());
~~~`,
    "options": [
      `It prints -1`,
      `It throws a CompletionException wrapping the IllegalStateException`,
      `It prints 0`,
      `The program hangs`
    ],
    "explain": `**Correct answer: it throws a CompletionException wrapping the IllegalStateException.**

### Why it is correct
- {{f}} is the original {{CompletableFuture}} holding the exception. {{thenApply}}/{{exceptionally}} create a **new** (chained) {{CompletableFuture}}; they do not modify {{f}}.
- {{f.join()}} returns the result of the original {{f}}, so it throws a {{CompletionException}} wrapping the original exception.
- To get -1 you must call {{join()}} on the chained future (e.g. {{f.exceptionally(...)}}).

### Why the other options are wrong
- **-1**: only the chained future holds -1, not {{f}}.
- **0**: no branch returns 0.
- **Hangs**: {{join()}} waits until {{f}} completes (here it completes exceptionally) and then throws; it does not hang. The task runs on {{ForkJoinPool.commonPool()}}, whose threads are daemon threads, so the JVM still exits.

> Senior tip: always keep a reference to the chained future if you need to handle the exception, or use {{whenComplete}}/{{handle}} to log and return a value at the same time. If you pass a custom executor (e.g. {{Executors.newFixedThreadPool}}), remember to {{shutdown()}}: that pool's threads are not daemon threads, and forgetting to shut it down prevents the JVM from exiting.`
  },
  "qz-jvm-027": {
    "q": `In a G1 mixed collection, what does the collection set (the regions to be collected during this pause) consist of?`,
    "options": [
      `All young regions, plus a subset of old regions chosen with the most garbage first, sized to fit the pause target`,
      `Only the old regions with the most garbage; young regions wait for the next young GC`,
      `Only the humongous regions, because they consume the most memory`,
      `Every region of the heap, in allocation order`
    ],
    "explain": `**Correct answer: all young regions plus a portion of the old regions with the most garbage.**

### Why it is correct
G1 divides the heap into equal-sized regions (1–32 MB). Every garbage-collection pause (young or mixed) collects **all** young regions (eden and survivor). After a concurrent marking cycle, G1 knows how much live data each old region contains; in subsequent mixed collections it incrementally adds old regions with the **most garbage** (the least live data, so the cheapest to copy), within an estimate that keeps the pause under {{MaxGCPauseMillis}}. This "Garbage-First" selection of old regions is where the name comes from.

### Why the other options are wrong
- **Only old regions**: young regions are always in the collection set.
- **Only humongous**: humongous regions (objects larger than half a region) are reclaimed when dead, typically at cleanup or via eager reclaim, not as the defining criterion of a mixed collection.
- **Every region**: collecting the whole heap only happens in a Full GC, which G1 tries to avoid.

> Senior tip: {{G1MixedGCCountTarget}} and {{G1HeapWastePercent}} control how many mixed GCs run and how much garbage is acceptable to leave behind. Full GCs in the G1 log usually mean marking started too late ({{InitiatingHeapOccupancyPercent}}) or the heap is too tight.`
  },
  "qz-modern-030": {
    "q": `A team migrates an I/O-bound service to virtual threads (Java 21). Which practices are correct? (Choose 2)`,
    "options": [
      `Do not pool virtual threads: create one thread per task, e.g. {{Executors.newVirtualThreadPerTaskExecutor()}}`,
      `Limit access to scarce resources (DB, partner APIs) with a {{Semaphore}} or a connection-pool size, rather than limiting the number of threads`,
      `Set a fixed virtual-thread pool sized to the number of CPU cores to avoid overload`,
      `Store heavy objects (e.g. a large buffer) in a {{ThreadLocal}} to reuse them across requests as you would with a regular thread pool`,
      `Move CPU-bound work (image compression, encryption) to virtual threads too because they are faster than platform threads`
    ],
    "explain": `**Correct answer: 0 and 1.**

### Why it is correct
- **Do not pool**: virtual threads are cheap (their stack lives on the heap and grows on demand), so creating and destroying them costs almost nothing. Pools exist to amortize expensive threads; pooling virtual threads only adds complexity and a useless limit.
- **Limit resources, not threads**: previously the thread-pool size acted as an accidental load limit. With one thread per request that limit disappears, and 10,000 requests can hit the DB at once. Put the limit at the resource itself: a {{Semaphore}}, a connection pool, or a rate limiter.

### Why the other options are wrong
- **Fixed pool sized to cores**: this turns virtual threads into expensive platform threads; for I/O-bound work, throughput gets capped at the core count.
- **ThreadLocal for reuse**: every task is a new thread so there is nothing to reuse. Each thread creates its own heavy object, which wastes a lot of memory with hundreds of thousands of threads. To share read-only context, look at {{ScopedValue}} (finalized in JDK 25).
- **CPU-bound**: virtual threads do not make the CPU faster; for pure computation, a platform thread pool sized to the cores is still the right choice.

> Senior tip: on JDK 21–23, check for pinning ({{synchronized}} around I/O) with the JFR event {{jdk.VirtualThreadPinned}} before rolling out.`
  },
  "qz-collections-028": {
    "q": `A key class has a buggy {{hashCode()}} that always returns the same number. A freshly created {{HashMap}} (default capacity 16) receives 9 different keys of this class in sequence. When the 9th key is put, what does the HashMap do?`,
    "options": [
      `It turns that bin into a red-black tree immediately, because the bin exceeds 8 nodes`,
      `It resizes the table to 32 instead of treeifying, because the table is still smaller than 64; every key still lands in the same bin`,
      `It throws {{IllegalStateException}} because there are too many collisions in one bin`,
      `It can never treeify because the key class does not implement {{Comparable}}`
    ],
    "explain": `**Correct answer: it resizes to 32 and does not treeify yet, because the table has not reached {{MIN_TREEIFY_CAPACITY}} = 64.**

### Why it is correct
In {{putVal}}, when a linked-list bin exceeds {{TREEIFY_THRESHOLD}} = 8 nodes, HashMap calls {{treeifyBin}}. But {{treeifyBin}} checks first: if the table is still smaller than 64 it **resizes** instead of treeifying. Design rationale: long bins in a small table are usually just a symptom of a table that is too tight, so doubling the table is cheaper and more effective than building a tree.

With a constant hashCode, resizing does not help: every key still has the same hash and still lands in the same bin. Subsequent puts will resize 32 -> 64, and only once the table reaches 64 does the bin become a tree. The tree then searches by hash first, and by {{compareTo}} if the key is Comparable. If the key is not Comparable, HashMap still treeifies (using {{tieBreakOrder}} to order ties on insert) but lookups must scan many branches, degrading toward O(n).

### Why the other options are wrong
- **Treeify immediately**: ignores the requirement that the table must be >= 64.
- **Throws exception**: HashMap never throws because of collisions; it only gets slower.
- **Can never treeify**: wrong; a non-Comparable key is still treeified, it is just less efficient to search.

### Thresholds to remember
| Constant | Value | Meaning |
|---|---|---|
| TREEIFY_THRESHOLD | 8 | a longer list is considered for treeifying |
| UNTREEIFY_THRESHOLD | 6 | a tree with <= 6 nodes (when resize splits a bin) goes back to a list |
| MIN_TREEIFY_CAPACITY | 64 | below this, resize instead of treeifying |

> Senior tip: treeifying is a safety net against a bad hashCode or hash-flooding attacks, not a feature to rely on. If you see CPU in {{HashMap.getNode}} in a profile, check the key's hashCode first.`
  },
  "qz-concurrency-029": {
    "q": `Two threads share an object with a plain {{int data}} and a {{volatile boolean ready}}:
~~~java
// Thread A
data = 42;
ready = true;

// Thread B
while (!ready) { }
System.out.println(data);
~~~
Which statements are correct? (Choose 2)`,
    "options": [
      `B definitely prints 42: the volatile write to {{ready}} happens-before the read that sees {{true}}, and {{data = 42}} comes before it in program order`,
      `If {{volatile}} is removed from {{ready}}, B may loop forever or print 0`,
      `Making only {{data}} volatile while leaving {{ready}} plain also guarantees that B prints 42`,
      `{{volatile}} forbids all reordering across the entire program`,
      `This guarantee only holds on x86; on ARM, B can still print 0`
    ],
    "explain": `**Correct answer: 0 and 1.**

### Why it is correct
The Java Memory Model defines the **happens-before (HB)** relation: if X HB Y, then everything X wrote is visible at Y. Three links chain together:
1. In thread A: {{data = 42}} HB {{ready = true}} (program order).
2. A volatile write to {{ready}} HB any volatile read of {{ready}} **that sees that value**.
3. In thread B: the read that sees {{true}} HB {{println(data)}}.

HB is transitive, so {{data = 42}} HB B's read of {{data}}, and B prints 42. Without volatile, link 2 is gone: the JIT may hoist {{ready}} out of the loop (read it once and loop forever), and the CPU or compiler may reorder A's two writes, so B could print 0.

### Why the other options are wrong
- **Only data volatile**: B reads {{ready}} non-volatile so there is no HB link; the loop may still never see {{true}}.
- **Forbids all reordering**: volatile only constrains ordering around the volatile accesses themselves, not the whole program.
- **Only on x86**: the JMM is a language specification; the JVM must uphold this guarantee on every architecture (on ARM it inserts extra memory barriers).

> Senior tip: other HB sources that often come up in interviews: unlocking a monitor HB a subsequent lock on the same monitor; {{Thread.start()}} HB every action in the new thread; every action in a thread HB the return of {{join()}}. The busy-wait in the example is only for illustration; real code uses a {{CountDownLatch}} or a {{CompletableFuture}}.`
  },
  "qz-concurrency-030": {
    "q": `Two threads each run {{count++}} 1000 times on a {{volatile int count}} field (initially 0). After both {{join()}}, what is the value of {{count}}?`,
    "options": [
      `It can be less than 2000, because {{count++}} is read, add, write; volatile does not make those three steps atomic`,
      `It is always exactly 2000, because volatile makes every thread see the latest value`,
      `It can be greater than 2000 due to repeated overwrites`,
      `It throws {{ConcurrentModificationException}} when two threads write at the same time`
    ],
    "explain": `**Correct answer: it can be less than 2000 (a lost update).**

### Why it is correct
{{count++}} is three operations: read {{count}}, add 1, write it back. Volatile guarantees that each read sees the most recent write, but it does **not** lock those three steps together:
~~~text
A reads 5      B reads 5
A writes 6     B writes 6     -> two ++ operations but only +1
~~~
Each interleaving like this loses one increment.

### How to fix it
| Approach | When to use |
|---|---|
| {{AtomicInteger.incrementAndGet()}} | ordinary counting, uses CAS |
| {{LongAdder}} | many threads incrementing, the total read infrequently (metrics) |
| {{synchronized}} / {{ReentrantLock}} | several variables must be updated together for consistency |

### Why the other options are wrong
- **Always 2000**: confuses visibility with atomicity.
- **Greater than 2000**: each write is just the value read plus 1, so the result cannot exceed the total number of increments.
- **ConcurrentModificationException**: that exception is thrown by collection iterators; it has nothing to do with a field.

> Senior tip: {{LongAdder}} spreads the count across multiple cells to reduce CAS contention; under heavy load it can be several times faster than {{AtomicLong}}, but {{sum()}} is not an atomic snapshot.`
  },
  "qz-concurrency-031": {
    "q": `{{new ReentrantLock()}} (no-arg constructor). Thread T1 is waiting in the lock's queue. At the exact moment the lock owner calls {{unlock()}}, thread T2 arrives and calls {{lock()}}. What can happen?`,
    "options": [
      `T1 definitely acquires the lock first, because ReentrantLock is fair (FIFO) by default`,
      `T2 is thrown an {{IllegalMonitorStateException}} because a thread is already waiting`,
      `T2 can acquire the lock before T1 (barging), because the default is non-fair: T2 tries to CAS the AQS {{state}} before enqueuing`,
      `Calling {{tryLock()}} on a fair lock always respects the queue order`
    ],
    "explain": `**Correct answer: the default is non-fair, so T2 can barge in.**

### Why it is correct
{{ReentrantLock}} is built on **AbstractQueuedSynchronizer (AQS)**: a {{volatile int state}} (0 means free, > 0 is the number of times the owner has re-entered) plus a FIFO queue of parked threads. In non-fair mode (the default), {{lock()}} tries to CAS {{state}} from 0 to 1 **immediately**, and only enqueues if that fails. T1 has just been unparked and still needs time to run again, so T2 (already running on a CPU) often wins.

Why is non-fair the default? Unparking a parked thread costs tens of microseconds, while a running thread that grabs the lock pays no context switch. That yields significantly higher throughput; the price is that a thread can be barged past many times (starvation).

### Why the other options are wrong
- **Fair by default**: you only get fairness with {{new ReentrantLock(true)}}.
- **IllegalMonitorStateException**: that exception is thrown only when unlocking a lock you do not hold.
- **tryLock() respects fairness**: the javadoc states clearly that the no-arg {{tryLock()}} grabs the lock immediately if it is free, even for a fair lock. To respect ordering, use {{tryLock(0, TimeUnit.SECONDS)}}.

> Senior tip: a fair lock is often much slower under load. Use it only when you truly need fairness (e.g. no request may wait too long), and measure with a benchmark before switching.`
  },
  "qz-concurrency-032": {
    "q": `A service running **Java 21** uses one virtual thread per request. Each request calls a {{synchronized}} method that performs a blocking JDBC query taking about 200 ms. The machine has 8 cores. Under 5,000 concurrent requests, throughput drops to only about 40 requests/second. What is the cause and the fix?`,
    "options": [
      `Virtual threads cannot run JDBC; you must switch to R2DBC`,
      `Each virtual thread uses a 1 MB stack so the process runs out of memory`,
      `{{Thread.sleep}} and I/O inside a virtual thread always hold the carrier thread`,
      `Blocking I/O inside {{synchronized}} **pins** the virtual thread to its carrier (only 8 carriers exist), so only 8 requests run at once; fix with {{ReentrantLock}} or upgrade to JDK 24+`
    ],
    "explain": `**Correct answer: pinning due to synchronized on JDK 21.**

### Why it is correct
Virtual threads run on a small pool of **carrier threads** (by default the number of cores). When a virtual thread blocks on I/O, the JVM **unmounts** it from the carrier so the carrier can run other work. On JDK 21–23 there is one exception: if it is inside {{synchronized}} (holding a monitor) or in a native frame, it cannot be unmounted and the carrier stays occupied (**pinned**). 8 carriers x (1000 ms / 200 ms) = 40 requests/second, which matches the observed number.

### How to handle it
- Replace {{synchronized}} around the blocking I/O with {{ReentrantLock}}: the virtual thread unmounts normally.
- Upgrade to **JDK 24+**: JEP 491 lets virtual threads unmount even while holding a monitor, so {{synchronized}} no longer causes pinning (native calls and foreign functions still pin).
- Detect it: use the JFR event {{jdk.VirtualThreadPinned}}; on JDK 21–23 there is also {{-Djdk.tracePinnedThreads=full}}.

### Why the other options are wrong
- **Cannot run JDBC**: blocking JDBC I/O runs fine on virtual threads. The problem here is pinning, not JDBC.
- **1 MB stack**: a virtual thread's stack lives on the heap and grows on demand (a few KB), so 5,000 threads are trivial.
- **sleep/I/O always pin**: wrong; these are exactly the cases that do unmount.

> Senior tip: the DB connection pool is still a real limit. 5,000 virtual threads all waiting on a 20-connection HikariCP pool will still be capped by 20 connections, so tune the pool and timeouts accordingly.`
  },
  "qz-jvm-028": {
    "q": `A GC log shows a young GC taking only 5 ms, but the application stalls for nearly 800 ms at that moment. The {{-Xlog:safepoint}} log reports "Reaching safepoint" of about 795 ms and "At safepoint" of about 5 ms. What is the most plausible explanation?`,
    "options": [
      `Long time-to-safepoint: one thread runs for a long time without hitting a safepoint poll (e.g. a large counted loop in JIT-compiled code, or a huge array copy), and every other thread must wait for it`,
      `A Full GC ran in the background without being logged`,
      `A thread blocked in native/I/O holds the safepoint until the I/O completes`,
      `Safepoints are only for GC so the pause must equal the GC time; the log is wrong`
    ],
    "explain": `**Correct answer: the time waiting for every thread to reach a safepoint (time-to-safepoint, TTSP) is too long.**

### Why it is correct
Many JVM operations (the stop-the-world part of GC, deoptimization, some diagnostic commands such as thread dumps) require **every** Java thread to stop in a safe state, called a safepoint. The JVM sets a flag requesting a safepoint, and each thread stops when it reaches a **safepoint poll** (the JIT inserts polls at method returns and at loop back-edges). The pause a user sees equals the time waiting for the last thread to reach a safepoint plus the time spent doing the work at the safepoint:
~~~text
Reaching safepoint ~795 ms   <- waiting for the slowest thread
At safepoint        ~5 ms    <- the GC itself only took about this
~~~
A common culprit is a long counted loop ({{int i}}): C2 used to omit polls in that kind of loop. Since JDK 10, **loop strip mining** splits loops into chunks of about 1000 iterations and inserts polls between chunks, so that case is rarer but not gone (very large array copies, some intrinsics).

### Why the other options are wrong
- **Full GC in the background**: every GC appears in the GC log; here the log already shows the wait to reach the safepoint as the culprit.
- **Thread in native/I/O**: a thread running native code is considered safe (it does not touch the Java heap), so it does not make the safepoint wait.
- **Log is wrong**: safepoints are also used for deopt, lock revocation, thread dumps, etc., and the pause always includes TTSP.

> Senior tip: when a latency spike does not match the GC pause, enable {{-Xlog:safepoint*}} or look at safepoint events in JFR. Async-profiler in wall-clock mode helps find the thread that is slow to reach the safepoint.`
  },
  "qz-jvm-029": {
    "q": `Interface {{Shape}} initially has only one loaded implementation, {{Circle}}; the hot method {{total(List<Shape>)}} calls {{shape.area()}} and has been C2-compiled. A few minutes later, a {{Square}} appears for the first time. {{-XX:+PrintCompilation}} prints "made not entrant" for {{total}} and latency spikes briefly. What happened?`,
    "options": [
      `GC moved the Circle objects so the compiled code is no longer valid`,
      `C2 compiled incorrectly so the JVM restarted the compiler`,
      `Deoptimization: C2 inlined {{Circle.area()}} based on the assumption of a single implementation; Square appearing invalidated that assumption, the code was discarded, the method fell back to the interpreter and was then recompiled`,
      `The JVM paused to read Square.class from disk, and that is the entire cost`
    ],
    "explain": `**Correct answer: deoptimization because an optimization assumption was invalidated.**

### Why it is correct
The JIT optimizes based on what it **observes**, together with assumptions:
1. Class Hierarchy Analysis (CHA) and the type profile show only Circle, so C2 **inlines** {{Circle.area()}} directly (no virtual call remains) and then optimizes further around it.
2. When Square is loaded or appears at the call site, that assumption becomes false. The JVM marks that code **not entrant** (no new calls may enter it); frames currently executing in that code are **deoptimized**, meaning their state is reconstructed and they continue in the interpreter.
3. The method runs slowly in the interpreter and lower tiers for a while, then is recompiled with the new profile (bimorphic: check the type and inline both). That period is the latency spike.

### Why the other options are wrong
- **GC moved objects**: GC updates pointers in compiled code through oop maps; moving objects does not invalidate compiled code.
- **Compile error**: this is normal behavior, not a compiler bug.
- **Only reading the file**: class loading is cheap; the large cost is the deopt and recompilation.

> Senior tip: this is why benchmarks must warm up with data as diverse as production (JMH), and why a **megamorphic** call site (3 or more types) cannot be inlined. On a very hot path, keeping few types at a call site helps the JIT optimize better.`
  },
  "qz-jvm-030": {
    "q": `A service has a 64 GB heap and a p99 latency SLA of 10 ms. With G1, mixed GCs cause 80–150 ms pauses. Running on JDK 21. Which option is the most reasonable?`,
    "options": [
      `Keep G1 and set {{-XX:MaxGCPauseMillis=10}}; G1 will guarantee pauses stay under 10 ms`,
      `Switch to Parallel GC to increase throughput`,
      `Increase the heap to 128 GB so G1 runs less often`,
      `Switch to Generational ZGC ({{-XX:+UseZGC -XX:+ZGenerational}} on JDK 21): pauses stay under 1 ms and are largely independent of heap size, at the cost of extra CPU for concurrent work and the need for heap headroom`
    ],
    "explain": `**Correct answer: Generational ZGC.**

### Why it is correct
G1 partitions the heap into regions and collects garbage generationally. Most of the work of **evacuating** (moving) objects still happens inside a pause, so the pause grows with the amount of live data that must be copied. ZGC performs both marking and relocation **concurrently** with the application, using **colored pointers** and load barriers: any thread that loads a stale pointer fixes it itself. Pauses are reduced to a few short operations, typically under 1 ms even with heaps of hundreds of GB.

Versions: JDK 21 has Generational ZGC via the {{-XX:+ZGenerational}} flag; JDK 23 enables generational mode by default; JDK 24 removes the non-generational mode entirely.

### Trade-offs
| | G1 | Generational ZGC |
|---|---|---|
| Pause | 10–200 ms depending on live set | typically under 1 ms |
| CPU | lower | extra CPU for concurrent GC work |
| Heap | more compact | needs heap headroom so GC can keep up |
| Throughput | usually slightly higher | slightly lower |

### Why the other options are wrong
- **MaxGCPauseMillis=10**: it is only a **goal**; G1 tries to meet it but does not guarantee it, and setting it too low can make GC run more frequently.
- **Parallel GC**: all work is stop-the-world, so pauses with 64 GB would reach seconds.
- **Increase the heap**: GC runs less often but copies more data each time; it does not solve the pause.

> Senior tip: before switching GC, verify the pauses really come from GC (check time-to-safepoint, allocation rate). After moving to ZGC, watch for "Allocation Stall" in the log: it signals the heap is too tight.`
  },
  "qz-jvm-031": {
    "q": `The following hot method runs millions of times per second, yet JFR records almost no allocations of {{Point}}:
~~~java
double dist(int x1, int y1, int x2, int y2) {
    Point p = new Point(x2 - x1, y2 - y1);   // not stored outside
    return Math.sqrt(p.x() * p.x() + p.y() * p.y());
}
~~~
Why?`,
    "options": [
      `C2 escape analysis sees that {{p}} does not escape the method, so it uses scalar replacement: the object is replaced by local variables or registers, with no heap allocation`,
      `HotSpot allocates {{Point}} on the thread stack instead of the heap`,
      `The allocation happens in a TLAB so JFR does not count it as an allocation`,
      `The JVM pre-caches small {{Point}} instances like the Integer cache`
    ],
    "explain": `**Correct answer: scalar replacement driven by escape analysis.**

### Why it is correct
C2 analyzes whether an object **escapes** the method: is it returned, assigned to a field or static, or passed to a method that cannot be inlined? {{p}} is only used locally so it does not escape. C2 then **decomposes the object into its fields** ({{x}}, {{y}} become two local variables) and removes the {{new}} entirely: no header, no allocation, no GC work. Escape analysis also enables **lock elision** on objects that do not escape.

### Why the other options are wrong
- **Allocated on the thread stack**: a common misconception. HotSpot does not allocate whole objects on the stack; it performs scalar replacement, meaning the object ceases to exist.
- **TLAB**: a TLAB is just a thread-local area of the heap for fast allocation; objects in a TLAB are still real allocations and JFR still samples them (allocation events in and outside TLABs).
- **Cache like Integer**: there is no such mechanism for user-defined classes.

### When this optimization does not happen
- The method has not been C2-compiled yet (running in the interpreter or C1).
- The object is passed to a method that cannot be inlined (too large, megamorphic).
- Complex control flow causes the object to escape on some path.

> Senior tip: do not break object-oriented design to "avoid new" before measuring. Use JMH with {{-prof gc}} to see bytes allocated per invocation; many temporary objects in practice cost nothing thanks to escape analysis.`
  },
  "qz-core-029": {
    "q": `Class {{A}} has a static initializer that reads {{B.X}}, and class {{B}} has a static initializer that reads {{A.Y}} (X, Y are not compile-time constants). Thread 1 uses A for the first time at the same moment thread 2 uses B for the first time. What can happen?`,
    "options": [
      `Each class's static initializer runs twice, once per thread`,
      `It always completes, but one side sees the default value (0/null) of the other side's field`,
      `Deadlock: thread 1 holds A's initialization lock and waits for B, thread 2 holds B's lock and waits for A; both threads hang forever`,
      `The JVM detects the cycle and throws {{ExceptionInInitializerError}}`
    ],
    "explain": `**Correct answer: deadlock during class initialization.**

### Why it is correct
JLS 12.4.2 guarantees that each class is initialized **only once** per classloader. Mechanism: the thread initializing a class holds an initialization lock, and any other thread that wants to use that class must **wait** until initialization completes. The sequence:
~~~text
T1: starts initializing A  -> runs A's <clinit> -> needs B -> waits (T2 is initializing B)
T2: starts initializing B  -> runs B's <clinit> -> needs A -> waits (T1 is initializing A)
~~~
The two threads wait forever. It is hard to diagnose because there is no {{synchronized}} in the code. In jstack, both threads are stuck inside {{<clinit>}} and the usual "Found one Java-level deadlock" line often does not appear.

With only **one** thread, the JVM lets the thread that is initializing A re-enter A (recursive initialization), so it does not hang; that is the case where you can see the default 0/null values.

### Why the other options are wrong
- **Runs twice**: contradicts the JLS "only once" guarantee.
- **Always completes**: only true with a single thread; with two threads a deadlock is possible.
- **JVM detects the cycle**: the JVM does not detect it; {{ExceptionInInitializerError}} appears only when the static initializer itself throws.

> Senior tip: keep static initializers simple and avoid cross-class calls. The lazy holder idiom (a static nested class {{Holder}} containing {{static final X INSTANCE = new X();}}) relies exactly on the JLS guarantees of one-time, thread-safe initialization.`
  },
  "qz-jvm-032": {
    "q": `A heap dump of a JSON-parsing service shows that about 30% of the heap is Strings with duplicate content ("ACTIVE", "VN", city names...) and long lifetimes. With {{-XX:+UseStringDeduplication}} enabled, what happens?`,
    "options": [
      `Strings with identical content are merged into the same object, so {{a == b}} returns true`,
      `Every String is automatically {{intern()}}ed`,
      `It only affects String literals in the source code`,
      `The GC finds long-lived Strings with the same content and makes them **share a single byte[]**; the String objects remain distinct`
    ],
    "explain": `**Correct answer: the underlying byte[] is shared, while the String objects stay separate.**

### Why it is correct
A String consists of the String object (header, hash, coder) and a {{byte[]}} holding the characters, which is usually the largest part. With deduplication enabled, the GC records Strings that have survived a number of GC cycles (3 by default, configurable via {{StringDeduplicationAgeThreshold}}), and a background thread probes a hash table: Strings with identical content have their {{value}} field pointed at the existing array, and the old array becomes garbage.
- Initially only G1 supported it; since JDK 18, Serial, Parallel, and ZGC support it as well.
- Semantics do not change: {{==}} still compares two distinct objects.

### Why the other options are wrong
- **Merge objects, == true**: only the character array is shared; object identity is preserved, so behavior does not change.
- **Automatically intern**: intern returns a canonical object from the StringTable and must be called explicitly; dedup is a different, background mechanism that only targets long-lived Strings.
- **Only literals**: literals are already interned; dedup targets Strings created at runtime (JSON parsing, DB reads).

> Senior tip: dedup costs extra background CPU and only pays off for long-lived Strings. For data with a small, known set of values (status, country codes), converting to an enum or normalizing during parsing (Jackson has an {{InternCache}} for field names) often saves more.`
  },
  "qz-concurrency-033": {
    "q": `The following class is created by thread A and then assigned to a shared plain field {{static Config current}} (no synchronization); thread B reads {{current.timeout()}}:
~~~java
class Config {
    private int timeout;
    Config(int t) { this.timeout = t; }
    int timeout() { return timeout; }
}
~~~
B can see a non-null {{current}} but {{timeout}} as 0. Which changes **guarantee** that B sees the correct value? (Choose 3)`,
    "options": [
      `Mark the {{timeout}} field {{final}} (and do not let the constructor leak {{this}})`,
      `Declare {{current}} as {{volatile}}`,
      `Replace {{current}} with an {{AtomicReference<Config>}} and use {{set}}/{{get}}`,
      `Have B {{Thread.sleep(100)}} before reading`,
      `Mark {{timeout()}} as {{synchronized}} while the assignment to {{current}} remains unsynchronized`
    ],
    "explain": `**Correct answer: 0, 1, 2.**

### Why the bug happens
With no happens-before relation between A and B, the compiler or CPU may reorder: write the reference to {{current}} **before** writing {{timeout}}. B sees the object but the field still has its default value. This is **unsafe publication**.

### Why they are correct
- **final field**: the JMM gives final a special guarantee. Any thread that sees a reference to the object (after the constructor finishes) is guaranteed to see the final values assigned in the constructor, even if the reference itself was published unsafely. Condition: {{this}} must not escape during construction.
- **volatile current**: a volatile write happens-before a volatile read that sees that value, so every write before it (including those inside the constructor) becomes visible.
- **AtomicReference**: {{set}}/{{get}} carry volatile memory semantics.

### Why the other options are wrong
- **sleep**: it creates no happens-before relation; it only makes the bug harder to reproduce.
- **synchronized getter**: monitor happens-before only applies when **both sides** use the same lock. The writer does not hold that lock, so no guarantee is established.

> Senior tip: other safe-publication patterns: assign in a static initializer, place into a thread-safe collection ({{ConcurrentHashMap}}, {{BlockingQueue}}), or write and read under the same lock. An immutable object (all fields final) is the simplest way to avoid thinking about this at all.`
  },
  "qz-collections-029": {
    "q": `Several threads use the following code to cap a {{ConcurrentHashMap}}-based cache at 1000 entries:
~~~java
if (cache.size() < 1000) {
    cache.put(key, value);
}
~~~
After a while the cache holds 1,180 entries. Why?`,
    "options": [
      `The check-then-act is not atomic: many threads can see size below 1000 and all put; moreover {{size()}} is only an estimate while concurrent updates are in progress`,
      `{{size()}} locks the entire map, so the bug must be elsewhere`,
      `ConcurrentHashMap blocks puts at a threshold itself, so 1,180 must be a JDK bug`,
      `Two threads putting at the same time make ConcurrentHashMap throw {{ConcurrentModificationException}} and duplicate entries`
    ],
    "explain": `**Correct answer: a check-then-act race, plus size() not being a snapshot.**

### Why it is correct
Each individual {{ConcurrentHashMap}} operation is thread-safe, but a **sequence of two operations** is not:
~~~text
T1: size() = 999 -> OK      T2: size() = 999 -> OK
T1: put(k1)                 T2: put(k2)           -> 1001
~~~
In addition, {{size()}} sums a set of counters spread across multiple cells (like {{LongAdder}}) without locking the map. While puts/removes run concurrently the result is only an estimate at the moment of the read. The javadoc also recommends {{mappingCount()}} (which returns a long) over {{size()}}.

### The right way to do it
- Use a bounded cache out of the box: Caffeine with {{maximumSize(1000)}} (frequency-based eviction), which is exactly what the snippet is trying to do by hand.
- If you must do it yourself: reserve a slot first with an {{AtomicInteger}} or a {{Semaphore}}, put only when a slot is acquired, and release the slot on remove.

### Why the other options are wrong
- **size() locks the map**: ConcurrentHashMap (since Java 8) has no global lock; {{size()}} locks nothing.
- **Blocks at a threshold**: ConcurrentHashMap has no concept of a maximum number of entries.
- **ConcurrentModificationException**: ConcurrentHashMap's iterators are weakly consistent and never throw that exception; a duplicate key is overwritten, not duplicated.

> Senior tip: any read-then-write decision on a shared map should use an atomic operation: {{putIfAbsent}}, {{computeIfAbsent}}, {{merge}}. The function passed to {{compute*}} must be short, because it runs while holding the bin lock.`
  },
  "qz-jvm-033": {
    "q": `With Compact Strings (the default since Java 9), which of the following Strings is stored with the **UTF16** coder (2 bytes per character)?`,
    "options": [
      `"café"`,
      `"Hà Nội"`,
      `"ORDER-2026-001"`,
      `"Über"`
    ],
    "explain": `**Correct answer: "Hà Nội".**

### Why it is correct
Since Java 9 (JEP 254), a String stores its characters in a {{byte[] value}} plus a {{coder}} field:
- **LATIN1**: every character is in U+0000–U+00FF -> 1 byte per character.
- **UTF16**: if **any single** character falls outside that range -> the whole string uses 2 bytes per character.

"Hà Nội": 'à' (U+00E0) is in Latin-1, but 'ộ' (U+1ED9) is not, so the entire string is UTF16. Most Vietnamese text with diacritics falls into this case, because Vietnamese tone marks mostly live in the U+1Exx range.

### Why the other options are wrong
- **"café"**: 'é' is U+00E9, which is in Latin-1.
- **"ORDER-2026-001"**: pure ASCII, Latin-1.
- **"Über"**: 'Ü' is U+00DC, which is in Latin-1.

### Practical implications
- Services that mostly hold ASCII strings (ids, codes, JSON keys) often see a noticeable reduction in String footprint after moving to Java 9+.
- Vietnamese text with diacritics still costs 2 bytes per character in memory, unlike its UTF-8 encoding when sent over the network.
- It can be disabled with {{-XX:-CompactStrings}}, but that is rarely needed.

> Senior tip: when estimating heap for a cache full of Vietnamese text, do not use the UTF-8 byte count from the DB; in the JVM each character costs 2 bytes, plus roughly 40 bytes for the String object and the array header.`
  },
  "qz-core-030": {
    "q": `To "save memory", a service calls {{userId.intern()}} for every request (millions of userIds that are almost never duplicated). Running on Java 17. Which assessment is most accurate?`,
    "options": [
      `It causes an OutOfMemoryError: PermGen because interned strings live in PermGen`,
      `Interned strings are never garbage collected, so the heap will definitely overflow`,
      `{{intern()}} returns a new copy so it actually doubles memory usage`,
      `It saves almost nothing because userIds rarely repeat, yet it costs CPU to probe the StringTable on every request; interned strings live on the heap and are still garbage collected when nothing references them`
    ],
    "explain": `**Correct answer: little benefit, real cost; but no PermGen OOM.**

### Why it is correct
{{intern()}} probes the **StringTable** (a JVM hash table): if a string with the same content exists it returns the existing object, otherwise it adds one. It only saves memory when **many duplicate strings** live for a long time. With nearly unique userIds:
- Each request pays for an extra hash computation and a table probe contended across threads.
- The table grows with the number of strings; GC must clean up dead entries, increasing GC time.
- Almost no string is ever shared.

History: since Java 7, interned strings live on the **heap** (before that, in PermGen); Java 8 removed PermGen entirely. An interned string is garbage collected like any other object once nothing references it.

### Why the other options are wrong
- **OOM PermGen**: Java 17 has no PermGen.
- **Never garbage collected**: wrong since Java 7; an interned string with no references is reclaimed.
- **Returns a new copy**: the opposite; it returns the existing canonical instance (or the string itself the first time).

> Senior tip: to reduce duplicate strings, measure first with a heap dump (Eclipse MAT has a duplicate-strings report). For a small value set, use an enum or a bounded normalization map; for many long-lived duplicates, enable {{-XX:+UseStringDeduplication}}. Tune the table with {{-XX:StringTableSize}} only if you truly must intern a lot.`
  }
});
