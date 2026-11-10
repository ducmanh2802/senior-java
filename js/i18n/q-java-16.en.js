/*
 * English translation of js/data/q-java.js — task T948. Format: js/core/i18n.js (content overlay).
 * ids: collections-034 collections-035 modern-039 modern-040 modern-041 modern-042
 */
App.i18n.content({
  'collections-034': {
    q: `How do {{modCount}} and {{expectedModCount}} work inside an iterator? Why can fail-fast stay silent in multi-threaded use, and which operations truly do not throw {{ConcurrentModificationException}}?`,
    a: `**Summary:** {{modCount}} is a non-volatile {{int}} that increases on structural changes; each iterator keeps {{expectedModCount}} and compares it on every step. Two points rarely stated clearly: (1) CME detection is best-effort, so in multi-threaded environments it may **stay silent and not throw**, leaving you with wrong results instead of an error; (2) not every modification is a "structural change" — {{setValue}} or {{put}} on an existing key **does not** increment modCount, so it does not cause CME.

### Mechanism at field level
~~~java
// ArrayList (simplified)
protected transient int modCount = 0;              // transient, NOT volatile
public E set(int i, E e) { elementData[i] = e; }   // does not touch modCount
public boolean add(E e)  { modCount++; ... }
public E remove(int i)   { modCount++; ... }

// ArrayList.Itr
int cursor, lastRet = -1, expectedModCount = modCount;
public E next() {
    if (modCount != expectedModCount) throw new ConcurrentModificationException();
    ...
}
public void remove() {
    ...
    ArrayList.this.remove(lastRet);
    expectedModCount = modCount;                    // key point: iterator syncs itself
}
~~~
- Because {{modCount}} is read and written by multiple threads without synchronization, under the JMM this is a **data race**: a thread may keep reading a stale value. So fail-fast is both redundant (reports CME for single-thread errors) and insufficient (reports nothing on a real race). The Javadoc of the collections promises only one sentence: fail-fast detection is "best effort".
- {{expectedModCount = modCount}} in {{it.remove()}} is why "modifying through the iterator is valid": the iterator knows what it just did.
- {{subList}} is a view: modifying the backing list increments modCount for both, so an iterator over the subList also fails.

### Which operations do not cause CME
| Operation while iterating | Increments modCount? | Result |
|---|---|---|
| {{it.remove()}}, {{it.set()}} on ListIterator | yes, but iterator resyncs | valid |
| {{list.add(e)}}, {{list.remove(i)}}, {{list.clear()}} | yes | CME at next next() |
| {{map.put(existingKey, newValue)}} | no | no CME |
| {{map.put(newKey, v)}}, {{map.remove(k)}} | yes | CME |
| {{e.setValue(v)}} in {{entrySet()}}, {{map.replaceAll}}, {{map.computeIfPresent}} | no | valid |
| Index-based for loop + {{list.remove(i)}} | yes, but nobody checks | **no throw**, silently skips elements |
- The last row is the scariest trap: this bug leaves no signal except missing data. It happens because indices shift after removal, while CME is only checked inside the iterator.

### How removeIf and forEach work internally
- {{ArrayList.removeIf}} does not create an iterator. It scans the array, writes kept elements into new positions, then trims the tail and increments {{modCount}} **once**; so the whole thing counts as one structural change and produces no CME. To know the real cost, remember it is still an O(n) compaction like arraycopy.
- {{HashMap.forEach}}, {{replaceAll}}, {{computeIfPresent}} use the same fail-fast idea but check with an internal function ({{modCount != expectedModCount}} then throw) — also only best-effort.
- If you must modify while iterating in a controlled way: collect keys to change into a temporary list then modify later, use {{ConcurrentHashMap}} (weakly consistent iterator, no CME), or iterate a snapshot copy. Do not catch and swallow CME.

### In production
- Symptom 1: CME in a single-thread unit test — almost always for-each plus remove, or a getter called during logging/serialization that internally caches into a map (read the stack trace carefully to find **who** modified, because CME only reports where it was detected).
- Symptom 2, more dangerous: **no** CME but wrong results in a multi-threaded app using {{ArrayList}}/{{HashMap}}: lost nodes, wrong {{size}}, {{null}} appearing in arrays, even infinite loops. This is exactly when fail-fast stays silent because of the race.
- Cheap debugging technique: wrap the collection in a class that records the stack trace on every structural modification (enable only in test environments), because the debugger shows you {{modCount}}'s value but not who just incremented it.
- Team guidelines: (1) do not modify a collection while iterating, use {{removeIf}}/{{compute}}; (2) collections shared across threads must be concurrent or immutable ({{List.copyOf}}, {{Set.of}}); (3) return copies or unmodifiable views to callers; (4) do not catch CME to retry — it signals a logic error.

> Senior tip: CME is not a "concurrency bug"; it is "someone modified structure outside the iterator". The truly scary case is the opposite: a race that fail-fast does not detect, because {{modCount}} is not volatile and has no happens-before. So the lead answer is: fail-fast is only a debugging aid; correctness comes from {{synchronized}}, concurrent collections, or immutability.`,
    follow: [
      'Why does non-volatile modCount make fail-fast unreliable in multi-threaded use, and what does the JMM say about this race?',
      'How do removeIf and iterator-plus-remove() differ in modCount increments and arraycopy cost?',
      'When do you accept ConcurrentHashMap weakly consistent iterators, and when is a snapshot mandatory?'
    ]
  },
  'collections-035': {
    q: `People say ArrayList is faster than LinkedList because of cache locality. How do you MEASURE that with JMH, how do you read the results, and which traps make microbenchmarks conclude wrongly?`,
    a: `**Summary:** Big-O counts **operations**, not the cost of each operation. Traversing {{ArrayList}} walks a contiguous reference array (one 64-byte cache line holds 8-16 references, prefetchable); traversing {{LinkedList}} is a pointer chase through nodes scattered on the heap, each step may cause a cache miss. The conclusion must come from a proper measurement: JMH with enough warmup, {{@Fork}}, Blackhole or a used result, and {{-prof gc}} — because most wrong microbenchmarks come from JIT removing code or comparing two different operations.

### Three cost layers of a computation
- Operation count: what Big-O describes.
- Cost per operation: L1 load ~1 ns, RAM load ~80-100 ns — about 100x apart.
- Memory: cache lines occupied, object headers, GC pressure.

~~~text
ArrayList of 10 elements (compressed oops):
  elementData: [ r0 r1 r2 r3 r4 r5 r6 r7 r8 r9 ]   40 bytes, fits in 1 cache line
  -> sequential traversal, CPU can prefetch; Integer objects still scattered

LinkedList of 10 elements:
  node0 [prev|item|next]  node1 [prev|item|next]  ...   ~32 bytes per node
  -> allocated over time, so heap positions are nearly random
  -> every traversal step is an unpredictable pointer read
~~~

### Minimal benchmark
~~~java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MICROSECONDS)
@State(Scope.Benchmark)
@Warmup(iterations = 5, time = 1)
@Measurement(iterations = 5, time = 1)
@Fork(2)
public class ListBench {
    @Param({"1000", "100000"}) int n;
    List<Integer> arr, link;

    @Setup(Level.Trial) public void init() {
        arr = new ArrayList<>(); link = new LinkedList<>();
        for (int i = 0; i < n; i++) { arr.add(i); link.add(i); }
    }

    @Benchmark public long sumArrayList()   { long s = 0; for (int x : arr)  s += x; return s; }
    @Benchmark public long sumLinkedList()  { long s = 0; for (int x : link) s += x; return s; }
    // Note: insert/remove-in-the-middle benchmarks that mutate size need @Setup(Level.Invocation) to restore;
    // the lines below only illustrate the idea. For a real measurement, use @Setup(Level.Invocation) to copy a fresh list each call.
    @Benchmark public long addMiddleArray(Blackhole bh) { ArrayList<Integer> a = new ArrayList<>(arr); a.add(n / 2, 7); return a.size(); }
    @Benchmark public long addMiddleLink(Blackhole bh)  { LinkedList<Integer> l = new LinkedList<>(link); l.add(n / 2, 7); return l.size(); }
}
~~~
- Run: create a project from the {{jmh-archetypes}} archetype, then {{java -jar target/benchmarks.jar ListBench -p n=100000 -prof gc}}. {{-prof gc}} adds columns for allocated bytes per operation and GC count — the way to prove the difference comes from **memory/cache**, not instruction count.
- Reading results: {{Score}} must come with {{Error}} and {{Cnt}}; two scores are only worth comparing when their confidence intervals do not overlap.

### Typical numbers (illustrative — measure on your own machine and data)
| Operation with n = 100,000 Integer | ArrayList | LinkedList |
|---|---|---|
| Traversal sum | ~15-30 us | ~120-250 us |
| Random {{get(i)}} | nanoseconds (index arithmetic) | microseconds (walk to i) |
| Insert in the middle | memmove of references, a few us, no object allocation | walk to node O(n) + 3 pointer swaps + 1 new object |
| Structure memory | 4 bytes per reference slot | ~32 bytes per node plus allocation footprint |
- The counter-intuitive point: {{add(index, e)}} is O(n) for **both** — ArrayList because of memmove, LinkedList because it must **walk** to the position. LinkedList is cheap only when you already have a {{ListIterator}} sitting at the right spot (for example right after {{next()}} then {{remove()}}).

### Traps that make numbers wrong
| Trap | What happens | How to avoid |
|---|---|---|
| Missing warmup | measures interpreter/C1, wrong conclusions about inlining and escape analysis | enough {{@Warmup}}, {{@Fork(2)}} (runs the benchmark in a separate JVM process to avoid cross-contamination), check the score has stabilized |
| JIT removing code because the result is unused | score ~0 ns, "benchmark says the list is 100x faster" | return the result or {{Blackhole.consume}} (Blackhole: JMH API that consumes the result so JIT cannot delete the code) |
| Constant folding (JIT precomputes constants), corrupting data | {{@Setup}} precomputes results; inserts/removals accumulate and n changes across iterations | real input variation, {{@Param}}, {{@Setup(Level.Invocation)}} when state must be restored per call |
| Comparing two different operations | "append at end" vs "get by index" | one operation per benchmark, same data, same n |
| GC interfering | scores include collection cost | {{-prof gc}}; if allocations match, the difference is cache |
| Busy IDE, CPU limits in containers | high variance, {{availableProcessors}} does not reflect the real machine | multiple forks, disable heavy work, declare real CPU |

### In production
- Run JMH as a periodic job (baseline then compare) when changing a data structure on a hot path, but the final conclusion must come from profiling the real workload: async-profiler or JFR event {{jdk.ObjectAllocationSample}}, flame graph pointing at {{ArrayList.contains}}.
- Common review case: {{orders.contains(x)}} inside a 100k loop — the culprit is Big-O, not cache locality; same lesson: measure before fixing.
- Worth measuring: changing a data structure on a hot path, or when someone proposes {{LinkedList}}. Not worth it: code that runs five times per request.

> Senior tip: the difference between senior and lead on this question is not memorizing numbers, but the ability to **design the measurement**: why {{@Fork}}, Blackhole, {{-prof gc}} are needed, and why numbers on 100k elements may be meaningless for a 50-element workload. Closing line: "{{LinkedList}} is wrong almost always — and I can prove it with JMH on this system's real data."`,
    follow: [
      'What does Blackhole prevent, and how would JIT "cheat" without it?',
      'In what direction does {{@Setup(Level.Invocation)}} make a benchmark wrong, and what replaces it?',
      'Which extra benchmark would you write to prove ArrayDeque beats LinkedList as a queue?'
    ]
  },
  'modern-039': {
    q: `Virtual threads (Java 21) when migrating from platform threads: heavy ThreadLocal, JDBC pool as a real bottleneck, semaphore to limit concurrency.`,
    a: `**Summary:** Virtual threads (lightweight JVM-managed threads, official since Java 21/JEP 444) let you handle many I/O-waiting tasks (DB calls, HTTP) with familiar blocking code, but when migrating from platform threads (OS threads, heavy and few) you hit three new bottlenecks: {{ThreadLocal}} memory blowup, the JDBC connection pool becoming the real limit, and the need for semaphore/bulkhead to protect downstream resources.

### What makes virtual threads different
- **Platform thread**: each thread maps 1-1 to an OS thread. Creation is costly (stack often ~1MB), so in practice only a few thousand exist → the "thread-per-request" model hits a ceiling when many requests are waiting on I/O.
- **Virtual thread**: scheduled by the JVM onto a few **carrier threads** (OS threads). When a virtual thread hits blocking I/O (reading a socket, JDBC), the JVM **unmounts** it from the carrier so the carrier can run other work; when I/O completes it **mounts** again. Thus you can have tens or hundreds of thousands of virtual threads "waiting" without spending millions of OS threads.
- Everyday analogy: a platform thread is like each customer occupying a whole waiter even while waiting for food; a virtual thread is like one waiter serving many tables, moving to another table while someone waits for food.

### Step 1 - Migrate thread usage (usually the easy part)
~~~java
// Before: limited by thread pool
ExecutorService exec = Executors.newFixedThreadPool(200);

// After (Java 21): one virtual thread per task
try (ExecutorService exec = Executors.newVirtualThreadPerTaskExecutor()) {
    futures = tasks.stream().map(t -> exec.submit(t::run)).toList();
    // try-with-resources waits for all tasks (structured-like)
}
~~~
- The API stays almost the same ({{Runnable/Callable}}). No need to convert blocking code to reactive.
- **Only helps for I/O-bound** work (mostly waiting). CPU-bound work (heavy computation) is not faster and may be worse due to scheduling overhead.

### Step 2 - ThreadLocal memory blowup
- {{ThreadLocal}} stores one copy of the value **per thread**. With 200 platform threads that is 200 copies; with 200,000 virtual threads that is 200,000 copies → memory explodes (OOM - Out Of Memory).
- Common cases: filters attaching {{SecurityContext}}, logging {{MDC}} (Mapped Diagnostic Context - log context), locale, transaction holder.
- Handling:
  - Always {{remove()}} in {{finally}} (with many virtual threads, forgetting remove leaks for the task's lifetime).
  - Pass data through method parameters instead of implicitly through ThreadLocal.
  - Consider **ScopedValue** (Java 21 preview, stabilizing in later releases): an immutable value scoped to a scope, safely inherited by child virtual threads, without the heavy per-thread copying of ThreadLocal. Check preview/final status for the exact JDK you use.

### Step 3 - JDBC pool is the real bottleneck
- Virtual threads allow 10,000 concurrent requests, but the database (DB) usually handles only tens to a few hundred connections. {{HikariCP}} (common JDBC pool) defaults small (often 10). Result: 9,990 virtual threads queue waiting for a connection → latency rises, timeouts pile up.
- **Limit concurrency at the DB call layer** with a semaphore (a counting permit):
~~~java
// permits = connection pool size (or smaller) to never exceed the DB
Semaphore dbPermits = new Semaphore(20);

try (ExecutorService exec = Executors.newVirtualThreadPerTaskExecutor()) {
    exec.submit(() -> {
        dbPermits.acquire();           // waits for a turn, does not hold a carrier with VT
        try {
            return queryDatabase();    // blocking JDBC
        } finally {
            dbPermits.release();       // returns the turn
        }
    });
}
~~~
- This is a bulkhead (partition): isolating a slow downstream so it cannot take down the whole system. Do not blindly enlarge the JDBC pool — the limit is in the DB.

### Step 4 - Pinning (carrier pinning)
- If a virtual thread runs code inside a {{synchronized}} block or calls a native method that blocks, the JVM may be unable to **unmount** it → the carrier thread is "pinned", losing the scalability benefit.
- Java 21 still pins with {{synchronized}}; newer releases (notably from Java 24) improved this so {{synchronized}} no longer pins in many cases. Check your exact JDK version.
- Avoidance: replace {{synchronized}} around I/O with {{ReentrantLock}}; keep critical sections (the part needing the lock) very short and free of I/O.
- Detection: enable JFR (Java Flight Recorder - JVM event recording tool) event {{jdk.VirtualThreadPinned}}, or use {{-Djdk.tracePinnedThreads=full}} when debugging.

### Production pitfalls
- **Enable virtual threads without limiting downstreams:** DB, external services, legacy thread pools get overloaded → cascading failures.
- **ThreadLocal + virtual threads = leaks/OOM:** especially in filters/logging.
- **Using virtual threads for CPU-bound work:** throughput drops, p99 worsens; CPU-bound work should use {{ForkJoinPool}}/fixed parallelism.
- **Old thread pool wrapped inside a virtual thread:** creating a virtual thread only to {{submit}} to a {{fixedThreadPool(50)}} still bottlenecks at pool 50.
- **Poor observability:** traditional thread dumps are hard to read with thousands of VT; need JFR/metrics.

> Senior tip: virtual threads make "thread creation cost" nearly zero, but they do **not** make downstream resources infinite. Practical formula: VT for I/O fan-out + semaphore = min(DB pool, external service limit) + timeout + circuit breaker (opens when downstream errors keep failing). Measure p99 and error rate before/after; roll out only with data.`,
    follow: [
      'How does ThreadLocal differ from ScopedValue, and what does ScopedValue solve for virtual threads?',
      'When does pinning occur, what is its impact, and how do you detect it in production?',
      'When should you NOT use virtual threads?'
    ]
  },
  'modern-040': {
    q: `Structured concurrency and ScopedValue (Java 21+): preview/final status by JDK, benefits, and correct usage.`,
    a: `**Summary:** Java 21 introduces (in preview form — see note) two mechanisms accompanying virtual threads (lightweight JVM-managed threads): **Structured Concurrency** via {{StructuredTaskScope}}, which runs multiple subtasks (child tasks) as one unit with a clear lifecycle (start together, wait together, cancel/clean up together on failure); and **ScopedValue**, which passes an immutable value by "scope" down to subtasks/child threads safely and efficiently, replacing {{ThreadLocal}} (the traditional thread-bound variable). Version note: in Java 21 both are **preview** (need {{--enable-preview}}); {{ScopedValue}} became final in Java 25, while {{StructuredTaskScope}} keeps evolving across JDKs.

### What and why needed
- **Previous problem:** with {{ExecutorService}} + {{Future}}, you submit tasks yourself, get each result yourself, handle timeout/cancellation yourself. If one task fails, the others may still run in the background (leaked work), the parent thread may block forever waiting, and observability is fragmented — hard to tell which child task belongs to which request.
- **Structured Concurrency (structured concurrent programming):** idea borrowed from "structured programming" (one block in, one block out). Subtasks are forked within a scope; the scope guarantees that when you leave the block (even on error) all subtasks have completed or been cancelled. Clear lifecycle, no leaks.
- **{{ThreadLocal}} problem:** {{ThreadLocal}} binds a value to a thread and you must set/remove yourself; forgetting {{remove}} on a thread pool leaks data into other requests. With millions of virtual threads, keeping a mutable per-thread copy is costly and hard to propagate to child threads automatically.
- **{{ScopedValue}}:** binds an **immutable** value to a scope; all code in that scope (including child virtual threads created inside) can read it; leaving the scope ends it automatically — no {{remove}}, no leak.

### How it works (mechanism step by step)
~~~java
// StructuredTaskScope: call 2 services in parallel, combine results
record Result(User u, Order o) {}

Result load(long id) throws Exception {
    // ShutdownOnFailure: one subtask fails -> cancel the rest
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        var u = scope.fork(() -> fetchUser(id));   // subtask (usually on VT)
        var o = scope.fork(() -> fetchOrder(id));
        scope.join();            // wait for all (or cancellation)
        scope.throwIfFailed();   // throw if any subtask failed
        return new Result(u.get(), o.get()); // safe after join + throwIfFailed
    } // leaving scope: guarantees no subtask keeps running in the background
}

// ScopedValue: pass the current user by scope, not ThreadLocal
static final ScopedValue<User> CURRENT_USER = ScopedValue.newInstance();
void handle(User user) {
    ScopedValue.where(CURRENT_USER, user).run(() -> service.process());
    // inside process() and child subtasks: CURRENT_USER.get() returns user
} // leaving run -> binding ends
~~~
1. {{fork}} creates a subtask (usually on a virtual thread). {{join}} waits; {{ShutdownOnFailure}} cancels the rest when one task throws (fail-fast). {{ShutdownOnSuccess}} returns the first successful result and cancels the rest.
2. {{ScopedValue.where(...).run/call}} creates a scope binding; the value **does not change** within the scope. Read with {{CURRENT_USER.get()}} (throws if unbound) or {{orElse}}.

### Real-world example (production)
Assume an order-detail API (p99 target 300ms) calling 3 services: user (80ms), order (100ms), promotions (120ms) — sequential total ~300ms, right at the limit. The old approach used {{ExecutorService}} submitting 3 {{Callable}}, {{future.get(250, ms)}}; when promotions fails, the other two futures may still finish and get discarded, and logs do not link the 3 calls to the same request. Switching to {{StructuredTaskScope.ShutdownOnFailure}} (on a JDK supporting preview): fork 3 subtasks, {{join}} then {{throwIfFailed}}. Result: time ~120ms (parallel, take max); when promotions fails, the other two subtasks are cancelled immediately, request returns an error in ~90ms instead of waiting the full timeout; traces group the 3 subtasks into one readable tree. {{ScopedValue}} is used to pass an immutable {{requestId}}/{{tenantId}} down to subtasks without {{ThreadLocal.set/remove}} (avoiding leaks on pools). (Numbers are illustrative, plausible for internal microservices.)

### Version status and trade-offs
| Mechanism | Java 21 | Java 22-24 | Java 25 |
|---|---|---|---|
| {{StructuredTaskScope}} | Preview (needs {{--enable-preview}}) | Preview (API may change) | Still evolving — check your JDK |
| {{ScopedValue}} | Preview | Preview | Final |

### Production pitfalls
- **Preview = API may change:** across JDKs, {{StructuredTaskScope}} method names/behavior have changed. Do not use preview blindly in production without accepting upgrade risk; pin the JDK version and enable the flag explicitly.
- **{{ScopedValue}} is not for mutable data:** do not bind a {{Map}} then mutate it — you lose safety. Bind only immutable data (ids, readonly context).
- **Timeout:** use {{joinUntil(deadline)}} or an appropriate timeout mechanism; {{join}} does not expire on its own.
- **Not a replacement for everything:** long-lived background work and complex scheduling still need {{ExecutorService}}/a dedicated scheduler.

### Sample interview answer
"Structured Concurrency and ScopedValue are two features shipping with virtual threads from Java 21, starting as preview so you must track status per JDK version. StructuredTaskScope lets me fork multiple subtasks in a scope and join them as one unit: if one subtask fails I can cancel the rest, and leaving the scope guarantees no background work leaks — unlike ExecutorService where I manage Futures myself and easily leak tasks. ScopedValue replaces ThreadLocal for immutable scoped data like requestId: it binds within a scope, propagates automatically to child subtasks including virtual threads, and ends automatically when leaving the scope, so there is no risk of forgetting remove and leaking across a pool. In practice I use this pattern to call a few services in parallel and merge results, reducing latency while making failure and cancellation clean. When applying it I always check the JDK version and enable --enable-preview while it is still preview, and I use ScopedValue only for immutable data."

> Senior tip: treat structured concurrency as "structured programming for concurrency" — subtask lifecycles follow code-block structure. Before production use: confirm status (preview/final) on the exact JDK you run, because {{StructuredTaskScope}} changed API between preview builds; {{ScopedValue}} is more stable (final from Java 25).`,
    follow: [
      'Why is ScopedValue more efficient than ThreadLocal?',
      'How does ShutdownOnFailure differ from ShutdownOnSuccess?',
      'When do you still use ExecutorService?'
    ]
  },
  'modern-041': {
    q: `Advanced streams: writing your own Collector, gatherers (JDK 24), and why parallel streams are not always faster.`,
    a: `**Summary:** Three advanced stream (a pipeline processing data sequentially over a collection) topics: (1) writing your own {{Collector}} (result aggregator) to customize collection — you must understand the {{supplier/accumulator/combiner/finisher}} contract; (2) **Gatherers** (JDK 24, {{Stream.gather}}) let you write custom intermediate operations, the kind of filter/group/transform that the old API lacked; (3) {{parallel stream}} is not always faster — it is slower for small data, hard-to-split sources, blocking I/O, or work per element too light relative to split/merge cost. Always measure before enabling parallel.

### 1) Writing your own Collector — what, why, mechanism
- **What:** {{Collector}} describes how to gather stream elements into a result (e.g., {{toList}}, {{groupingBy}}). When the built-in API is not enough, write your own.
- **Four-part contract ({{Collector.of(...)}}):**
  - {{supplier}}: creates an empty container (called once per start / per partition when parallel).
  - {{accumulator}}: adds one element to the container ({{(container, element) -> ...}}).
  - {{combiner}}: merges two containers into one — **must be correct** under parallel execution, because each thread gathers its own container and the combiner merges them.
  - {{finisher}}: (optional) turns the container into the final result; omit when the container is already the result ({{IDENTITY_FINISH}}).
- **Common trap:** accumulator mutates shared external state (not thread-safe under parallel); combiner merges incorrectly (drops elements, wrong order) → wrong results only exposed under parallel.

~~~java
import java.util.*;
import java.util.stream.*;

// Example: gather into an immutable list, written with Collector.of
Collector<String, ?, List<String>> toImmutable = Collector.of(
    ArrayList::new,                 // supplier: empty container
    ArrayList::add,                 // accumulator: add element
    (left, right) -> { left.addAll(right); return left; }, // combiner
    List::copyOf                    // finisher: immutable list
);
List<String> res = Stream.of("a","b","c").collect(toImmutable);
~~~

### 2) Gatherers (JDK 24) — custom intermediate operations
- **What:** {{Stream.gather(Gatherer)}} (Java 24) lets you define a custom **intermediate** operation (returns a stream), filling the gap that previously required tricks or complex collectors.
- **Built into {{java.util.stream.Gatherers}}:** {{windowFixed(n)}} (fixed-size chunks), {{windowSliding(n)}} (sliding window), {{fold}} (stateful reduction to one element), {{scan}} (like fold but emits each intermediate step), {{mapConcurrent(maxConcurrency, fn)}} (concurrent map with a concurrency limit, useful for light I/O in a stream).
- **Difference from collector:** a collector is a **terminal** operation returning one value; a gatherer is an **intermediate** operation returning a stream you can keep chaining.

~~~java
import java.util.stream.Gatherers;
// sliding window of size 3
var windows = List.of(1,2,3,4,5).stream()
        .gather(Gatherers.windowSliding(3))
        .toList(); // [[1,2,3],[2,3,4],[3,4,5]]
~~~

### 3) Why parallel streams are not always faster
- They share {{ForkJoinPool.commonPool}}; if the pipeline does blocking I/O, workers get held and starve other work (see also modern-027).
- **Split** + **combine/merge** costs are real. Hard-to-split sources ({{LinkedList}}, {{Iterator}}, {{Stream.iterate}}, IO sources) barely parallelize but still pay the overhead.
- Small data or very light per-element work (N * Q small, where N = element count, Q = cost per element) → overhead exceeds benefit. Rule of thumb: only worth considering when N*Q is large enough and measured.
- Correctness must be preserved: {{combiner}} and collector must be safe; no shared side effects.

| Situation | Use | Why |
|---|---|---|
| Custom result gathering | Write your own {{Collector}} (terminal) | Clear contract, supports parallel if combiner is correct |
| Custom intermediate transform (JDK 24+) | {{Gatherer}} | API designed specifically for intermediate ops |
| CPU-bound, large data, easily split source | Consider {{parallel()}} + **benchmark** | Use multiple cores |
| I/O-bound / small data | Sequential or {{CompletableFuture}}/virtual threads | Avoid blocking commonPool, avoid overhead |

### Real-world example (production)
Assume a transaction-log aggregation job: 2 million records, each needing parse + risk-score computation (pure CPU-bound, ~5 microseconds/record), then grouped statistics. The first version used {{parallelStream}} on an {{ArrayList}} (good splitting source) + a custom collector; on an 8-core machine time dropped from ~10s (sequential) to ~2.8s, and since the combiner was tested thoroughly results matched. In another case, a developer applied the same {{parallelStream}} to 800 small config records, each element only a few comparisons: time rose from 3ms to 12ms due to split/merge overhead, and p99 occasionally spiked from contention on {{commonPool}} with other tasks. Fix: set a threshold — only enable parallel when size exceeds a threshold (e.g., > 50,000 elements) **and** a benchmark confirms benefit; keep small sets sequential. For the "sliding window of 10 transactions" to detect patterns, on JDK 24 use {{gather(Gatherers.windowSliding(10))}} instead of managing a complex buffer yourself.

### Production pitfalls
- **Combiner bugs only surface under parallel:** unit tests running sequentially still pass; must test with {{parallelStream()}} or enough data for the framework to parallelize.
- **Using {{mapConcurrent}} gatherer for heavy blocking:** it limits concurrency but still runs on stream infrastructure — for heavy blocking I/O, split out to an executor/virtual threads explicitly.
- **Premature optimization:** measure with JMH on real data; "parallel" is not a magic switch.

### Sample interview answer
"With advanced streams I split into three parts. First, writing your own Collector when you need custom gathering: you must know the supplier creating the container, the accumulator adding an element, the combiner merging two containers — the combiner is especially important because under parallel each thread gathers separately then merges, and a wrong combiner yields wrong results. Second, from JDK 24 Gatherers let you write custom intermediate operations like windowFixed, windowSliding or mapConcurrent instead of abusing collectors or tricks. Third, parallel streams are not always faster: they share ForkJoinPool.commonPool and pay split and merge costs, so they only help for CPU-bound, large data, easily split sources like ArrayList with no blocking. With I/O or small data they are often slower and also cause pool contention. My principle is sequential by default, enabling parallel only when a benchmark proves benefit on real data."

> Senior tip: test a custom {{Collector}} with both {{stream()}} and {{parallelStream()}} — a wrong combiner is a "silent" bug. With gatherers, check the JDK version (needs 24+). Before using {{parallel()}}, measure with JMH; do not trust intuition. (Reference: JEP 485 - Stream Gatherers.)`,
    follow: [
      'What must a Collector combiner do?',
      'How does Gatherers.mapConcurrent differ from parallel stream?',
      'How do you measure parallel streams?'
    ]
  },
  'modern-042': {
    q: `Text blocks, switch expressions, var — pitfalls when reviewing code.`,
    a: `**Summary:** Three "convenient" modern Java constructs each have review traps: **text blocks** (multi-line strings, Java 15) compute indentation from the smallest common leading whitespace and easily gain a trailing newline; **switch expressions** (switch returning a value, Java 14) require exhaustiveness and handle {{null}} differently from old switch; **var** (local type inference, Java 10) is only for local variables and hurts readability when the type is not obvious from the right-hand side.

### 1) Text blocks — what, why, traps
- **What:** multi-line strings written between three double quotes {{""" ... """}}, convenient for embedding SQL/JSON/HTML in code. The compiler handles newlines and indentation.
- **Why needed:** previously you concatenated {{\\n}} and escaped quotes, which was hard to read and error-prone.
- **Indentation mechanism (incidental whitespace):** Java finds the smallest leading-whitespace count across content lines (including the closing {{"""}} position) and strips that many spaces from every line. So placing the closing delimiter shallower or deeper changes the result.
- **Trailing-newline trap:** if the closing {{"""}} sits on its own line, the text block gains a trailing newline. To remove it, use {{\\}} at the end of the line or place the closing delimiter right after content (depending on case).
- **Escape trap:** a text block is still a Java string — {{\\}} is still an escape. Use {{\\s}} to preserve trailing spaces, because the compiler usually strips trailing whitespace.

~~~java
String sql = """
        SELECT id, name
        FROM users
        WHERE active = true
        """; // closing delimiter aligned -> strips all left indentation
// Careful: NEVER concatenate user input into a SQL text block
String bad = """
        SELECT * FROM users WHERE name = '""" + userInput + "'";
// -> SQL injection (malicious SQL). Use PreparedStatement.
~~~

### 2) Switch expressions — exhaustiveness and null
- **What:** switch can return a value (expression) using {{->}} or {{yield}}; the compiler checks that all cases are covered.
- **Exhaustive (full coverage):** for an {{enum}} or sealed type, if you list every value, no {{default}} is needed. Benefit: adding a new enum value makes every incomplete switch fail to compile instead of silently falling into {{default}}.
- **{{null}} trap:** traditional switch on {{String/enum}} throws {{NullPointerException}} (NPE - null access error) when the selector is {{null}}. From Java 21, pattern matching allows explicit {{case null}}; without {{case null}} (and without a catch-all {{default}}), {{null}} still causes an NPE. In review you must ask: "can this value be null?"
- **Case-order trap (Java 21):** a general pattern placed before a specific pattern makes the later branch "dominated" (never runs) and the compiler errors.

~~~java
// Java 21: handle null explicitly
String label = switch (status) {       // status may be null
    case null -> "UNKNOWN";            // explicit null case
    case ACTIVE -> "Active";
    case LOCKED -> "Locked";
}; // enum fully covered -> no default needed
~~~

### 3) var — local type inference
- **What:** {{var}} (Java 10) lets the compiler infer a local variable's type from its initializer. Only for **local variables** with an initializer; **not** for fields, method parameters, or return types.
- **Why needed:** reduces repetition of long types (e.g., {{Map<String, List<Order>>}}). Only worthwhile when the right-hand side makes the type clear.
- **"Unclear type" trap:** {{var x = get();}} forces the reader to guess the type → slower review, easy misunderstanding.
- **{{diamond}} + {{var}} trap:** {{var list = new ArrayList<>();}} infers {{ArrayList<Object>}} (no type information), rarely what you want.
- **{{null}} trap:** {{var x = null;}} does not compile because the type cannot be inferred.

| Situation | Use {{var}}? | Why |
|---|---|---|
| {{var user = new User(name);}} | Yes | RHS makes type clear |
| {{var map = Map.of("a", 1);}} | Yes | clear |
| {{var result = service.process(req);}} | Consider | must read method signature |
| {{var list = new ArrayList<>();}} | No | infers {{Object}} |

### Production pitfalls
- Text-block SQL concatenated with data → SQL injection (serious vulnerability). Always use bind parameters.
- Switch expression with a "just in case" {{default}} on an enum → loses the compile warning when new enum values are added.
- Teammates overusing {{var}} makes business logic (money, status) easy to misread as the wrong type.

> Senior tip: set team conventions: {{var}} only when the RHS states the type on the same line; text blocks only for constant strings (no dynamic data); switch over enum/sealed types prefers exhaustive without {{default}} so the compiler catches new cases. In review, three quick questions: "does the text block concatenate input?", "can the switch receive null?", "does the reader know this var's type immediately?"`,
    follow: [
      'How does a text block strip indentation, and how does the closing {{"""}} affect it?',
      'How does a switch expression handle {{null}} compared to traditional switch on {{String/enum}}?',
      'When does {{var}} make code harder to review, and what convention should a team set?'
    ]
  }
});
