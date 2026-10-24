/*
 * English translation of js/data/q-concurrency-jvm.js — task T171. Format: js/core/i18n.js (content overlay).
 * ids: concurrency-024 concurrency-025 concurrency-026 concurrency-027 jvm-019 jvm-020 jvm-021
 */
App.i18n.content({
  'concurrency-024': {
    q: `How does {{synchronized}} differ on a static method, instance method and block (class lock vs object lock)? If two threads call a static synchronized method and an instance synchronized method of the same class at the same time, do they block each other?`,
    a: `**Summary:** synchronized always locks **a specific object**. Instance method locks {{this}}; static method locks the object {{Class}} ({{Foo.class}}); block locks the object you specify. Different locks do not block each other: static synchronized and instance synchronized of the same class can run in parallel. This is often exactly the bug when both modify a static field. Likewise, two different instances calling instance synchronized do not block each other.

### Lock matrix
| Thread A calls | Thread B calls | Blocked? |
|---|---|---|
| a1.syncMethod() | a1.otherSyncMethod() | Yes, same lock a1 |
| a1.syncMethod() | a2.syncMethod() | No, two different objects |
| Foo.staticSync() | Foo.otherStaticSync() | Yes, same lock Foo.class |
| Foo.staticSync() | a1.syncMethod() | No, Foo.class and a1 are different objects |
| a1.syncMethod() | a1.plainMethod() | No, unsynchronized method needs no lock |

### Common bug: wrong lock scope
~~~java
class SequenceService {
    private static long next = 0;            // static data, shared by all instances

    public synchronized long nextId() {      // locks THIS, not the class
        return ++next;
    }
}
// As a Spring singleton (1 instance) it is temporarily fine.
// But somewhere there is new SequenceService() -> 2 different locks -> duplicate ids.
~~~
Fix: lock the object that protects the data, i.e. {{static synchronized}} or {{synchronized (SequenceService.class)}}; even better use {{AtomicLong}}.

Rule: **the lock must have the same scope as the data it protects**. Instance data -> instance lock, static data -> static lock.

### Synchronized block and choosing the lock object
~~~java
class AccountService {
    private final Object lock = new Object();   // private final dedicated lock

    public void transfer(long from, long to, long amount) {
        validate(from, to, amount);             // outside locked section
        synchronized (lock) {                   // only lock the truly needed segment
            debit(from, amount);
            credit(to, amount);
        }
        notifyCustomer(from);                   // I/O kept outside the lock
    }
}
~~~
- A private final lock prevents outside code (or libraries) from synchronizing on your object and causing hard-to-debug deadlocks.
- Do not lock on: String literals (interned, shared across the JVM); {{Integer}}/{{Long}} small values (cached, shared); non-final fields (reassignment changes the lock); {{getClass()}} (subclass has a different Class). Since JDK 16, javac warns when synchronizing on an instance of value-based classes like Integer.

### Inside the JVM
- Synchronized methods are marked with flag {{ACC_SYNCHRONIZED}} in bytecode; blocks use {{monitorenter}}/{{monitorexit}}, plus a monitorexit in the exception branch so the lock is always released.
- Reentrant: a thread holding the lock can call another synchronized method on the same object without blocking itself.
- Biased locking is disabled by default since JDK 15 and removed in JDK 18. JDK 21 uses lightweight locks when there is no contention, and only inflates to a full monitor when contention occurs.

### Common wrong answers
- "static synchronized and instance synchronized use the same lock": wrong, they are two different objects.
- "synchronized method locks the whole object, so all methods of the object are blocked": only methods/blocks synchronized on the same object wait for each other.
- "synchronized in the service is enough": it only works in **one JVM**. A service running 3 pods has 3 independent locks; then you must lock at the DB or use atomic data-store operations.

> Senior tip: when I see synchronized on a public method of a Spring bean, I ask two questions: where is the protected data, and how many instances does the service run? If the data is in the DB, the JVM lock is meaningless with multiple pods; if the data is a static field, locking this is the wrong scope. Those two questions catch most synchronization bugs in business code.`,
    follow: [
      `Why should you not synchronize on a String literal or Integer?`,
      `Is synchronized reentrant, and when does that matter?`
    ]
  },
  'concurrency-025': {
    q: `{{count++}} produces wrong results when run from multiple threads: why? List ways to fix within one JVM, and when the service runs multiple instances (e.g. inventory, voucher usage counting), what do you do with DB or Redis?`,
    a: `**Summary:** {{count++}} consists of three steps — read, add, write — and is not atomic. Two threads reading the same old value cause one increment to be lost (lost update). {{volatile}} does not fix it because it only guarantees visibility. Within one JVM you can use {{synchronized}}/Lock, {{AtomicInteger.incrementAndGet()}} (CAS), or {{LongAdder}} when writes are frequent and reads rare. When running multiple instances, every JVM lock is useless: you must bring the check-and-update to the data storage itself, such as a conditional {{UPDATE}} in the DB, optimistic locking with version, {{SELECT ... FOR UPDATE}}, or {{DECR}}/Lua script on Redis.

### Why it is wrong
~~~text
count = 5
Thread A: read 5            Thread B: read 5
Thread A: 5 + 1 = 6        Thread B: 5 + 1 = 6
Thread A: write 6            Thread B: write 6      -> one increment lost
~~~
For a single field, bytecode is {{getfield}}, {{iconst_1}}, {{iadd}}, {{putfield}}; another thread can interleave between these instructions.

~~~java
static int count = 0;
public static void main(String[] args) throws InterruptedException {
    Runnable r = () -> { for (int i = 0; i < 100_000; i++) count++; };
    Thread a = new Thread(r), b = new Thread(r);
    a.start(); b.start(); a.join(); b.join();
    System.out.println(count);   // often less than 200000, different each run
}
~~~

### Fix within one JVM
| Method | Mechanism | When to use |
|---|---|---|
| synchronized / ReentrantLock | Mutual exclusion | Updating multiple variables together, need to keep constraints between them |
| AtomicInteger / AtomicLong | CAS, retry on conflict | One variable, need exact value immediately (sequence number) |
| LongAdder | Each thread accumulates to a separate cell, sum() on read | Counter metric written very often, read rarely |
| No sharing | Each thread counts separately then merges | Parallel batch processing |

Check-then-act trap: {{if (stock.get() > 0) stock.decrementAndGet()}} is still wrong even with Atomic, because both threads may see 1 then both decrement. You must combine check and update into one atomic operation:

~~~java
// Wrong check-then-act
if (stock.get() > 0) {
    stock.decrementAndGet();
}

// Correct: atomic conditional update
boolean ok = stock.compareAndSet(expected, expected - 1);
~~~

### Fix with DB (multi-instance)
Use a conditional update and check affected rows. Example for inventory:
~~~sql
UPDATE products SET stock = stock - 1
WHERE id = ? AND stock > 0;
~~~
Then check whether the affected row count > 0. This is correct regardless of how many app instances or DB connections exist. Do not read stock into Java, check there, then write back; that is check-then-act across instances.

Optimistic locking with version:
~~~sql
UPDATE orders SET qty = qty - 1, version = version + 1
WHERE id = ? AND version = ?;
~~~
If affected rows == 0, retry or abort.

### Fix with Redis
- Use {{INCR}} / {{DECR}} directly for counters; they are atomic.
- For conditional decrement (e.g., coupon limit), use Lua to keep check and update in one server execution:
~~~lua
-- KEYS[1] = stock:sku123
local s = tonumber(redis.call('GET', KEYS[1]) or '0')
if s > 0 then redis.call('DECR', KEYS[1]) return 1 end
return 0
~~~
- Redis is only a holding place; real orders are still written to DB (via queue), and reconciliation jobs are needed because Redis can lose data on failover.

**5. Distributed lock** (Redisson; ShedLock for periodic jobs): only use when the operation cannot be expressed as an atomic action. A lock with TTL may expire during a long GC pause, so a fencing token or DB-write condition is still needed.

### Common wrong answers
- "Add volatile and it is fixed": volatile does not make count++ atomic.
- "Use synchronized in the service": 3 pods = 3 independent locks.
- "Read inventory into Java, check in Java, then UPDATE qty with a new value": lost update between instances.

> Senior tip: for inventory deduction or voucher problems, I always start with a conditional UPDATE and check affected rows: one SQL statement, no distributed lock, absolutely correct. Only when I measure a single "hot" row choking the DB (thousands of requests per second to the same SKU) do I move the holding place to Redis Lua, with reconciliation jobs against the DB.`,
    follow: [
      `Why is check-then-act still wrong even with AtomicInteger?`,
      `Optimistic locking vs conditional UPDATE: which for a flash sale?`,
      `Distributed lock TTL expires during GC pause — how do you prevent it?`
    ]
  },
  'concurrency-026': {
    q: `How is livelock and starvation different from deadlock? Give a real-world example, detection method, and when do you use a fair lock ({{new ReentrantLock(true)}}) — what does it cost?`,
    a: `**Summary:** Deadlock: threads **stand still** waiting for each other forever, CPU near 0. Livelock: threads **still run**, continuously reacting to each other (release then retry) but no one progresses; CPU high with throughput 0. Starvation: the system still progresses, but **some** threads are never served because they are always surpassed. Fair lock grants by wait order (FIFO) so it prevents starvation, but throughput drops significantly due to lost "cut-in" ability and each grant must wake a sleeping thread. Only use when starvation has been measured.

| | Deadlock | Livelock | Starvation |
|---|---|---|---|
| Thread state | BLOCKED/WAITING forever | RUNNABLE, looping | Some wait very long, others run normally |
| CPU | Low | High | Normal |
| System making progress? | No (for affected threads) | No | Yes, but unfairly |
| Thread dump | JVM reports "Found one Java-level deadlock" | Stack changes between dumps but stays in a retry loop | One thread waits on the same lock across many dumps, others get it |
| Fix | Fixed lock order, tryLock with timeout | Random backoff, clear role separation | Fair lock, limits, separate queue |

### Livelock: example
~~~java
// Two threads transfer in opposite directions, "politely" releasing locks when the second is not obtained
while (true) {
    if (from.lock.tryLock()) {
        try {
            if (to.lock.tryLock()) {
                try { move(from, to, amt); return; }
                finally { to.lock.unlock(); }
            }
        } finally { from.lock.unlock(); }
    }
    // No backoff: both threads may stay out of phase, take and release together, retry together
}
~~~
Fix: add random backoff ({{Thread.sleep(ThreadLocalRandom.current().nextInt(1, 10))}}) so the two sides drift out of phase and one can acquire both locks; or better, always lock in a fixed id order.

In distributed systems livelock is even more common: two consumers retry immediately on a message with optimistic-lock conflict; thousands of clients retry after timeout (retry storm) keep the system busy with retries instead of real work. Fix with exponential backoff plus jitter.

### Starvation
- {{ReentrantLock()}} default is **non-fair**: a newly arrived thread can cut in and take the lock as soon as it is released, before threads already queued, because a running thread is much faster to schedule than waking a sleeping one. High throughput, but theoretically a thread can lose forever.
- {{synchronized}} has no fair option.
- ReadWriteLock: a continuous stream of readers can starve writers. {{ReentrantReadWriteLock}} in non-fair mode has a mechanism to reduce this (new readers must yield when a writer is at the head of the queue) but does not guarantee it absolutely.
- Thread priority ({{setPriority}}) is almost ignored on Linux; do not rely on it.
- Beyond locks: a thread pool can be monopolized by long tasks, leaving short tasks waiting forever; one tenant sending huge request volume can consume the pool meant for others. Fix by separating pools (bulkhead) and per-tenant limits.

### Fair lock
~~~java
ReentrantLock fair = new ReentrantLock(true);   // grants by queue order
Semaphore permits = new Semaphore(10, true);     // fair semaphore
~~~
- Cost: each release must wake exactly the thread at the head and wait for it to be scheduled. Javadoc clearly states overall throughput is usually lower, possibly much lower under high contention.
- Fairness applies only to lock acquisition order, not CPU scheduling fairness. {{tryLock()}} without timeout still cuts in even with a fair lock.
- Use when service order has business meaning, or tail latency is more important than throughput, and measurements show starvation.

### Common wrong answers
- "Livelock is a mild deadlock": opposite — livelock burns CPU and is harder to spot because every thread looks busy.
- "Always use fair lock to be safe": you pay with throughput without fixing the root cause (holding the lock too long).

> Senior tip: the livelock I meet most often is not in Java code but in retry policy: client timeout 1 second and retries immediately 3 times; the service already overloaded gets even more loaded. Exponential backoff with jitter and circuit breaker is the "fair lock" of distributed systems. Starvation inside the JVM usually shows as a p99.9 spike for one group; then I first try reducing lock hold time; fair lock is the last choice.`,
    follow: [
      `Why does non-fair lock give higher throughput than fair lock?`,
      `Is retry storm a livelock? How do you design retry to avoid it?`
    ]
  },
  'concurrency-027': {
    q: `Write a thread-safe singleton using eager, lazy holder and enum, then compare them. How can a singleton be broken by reflection, serialization, clone or multiple class loaders, and which approach prevents that?`,
    a: `**Summary:** There are three sound approaches: **eager** ({{static final}} field initialized when the class is loaded), **holder idiom** (lazy thanks to a nested class that is only initialized when accessed the first time) and **enum** (the JVM guarantees exactly one instance, blocks reflection and serialization without extra work). All three are thread-safe thanks to JVM locking during class initialization (JLS 12.4.2), no volatile or synchronized needed. Singleton can be broken by: reflection calling the private constructor, deserialization creating a new object, {{clone()}} if the class is Cloneable, and each class loader having its own class copy. Enum blocks reflection and serialization; class loader cannot be blocked in code.

### Three approaches
~~~java
// 1. Eager: simplest
public final class FeeTable {
    private static final FeeTable INSTANCE = new FeeTable();
    private FeeTable() { }
    public static FeeTable get() { return INSTANCE; }
}

// 2. Holder: created only when get() is first called
public final class CoreBankClient {
    private CoreBankClient() { }
    private static class Holder { static final CoreBankClient I = new CoreBankClient(); }
    public static CoreBankClient get() { return Holder.I; }
}

// 3. Enum
public enum IdGenerator {
    INSTANCE;
    private final AtomicLong seq = new AtomicLong();
    public long next() { return seq.incrementAndGet(); }
}
~~~

| | Lazy? | Thread-safe by | Blocks reflection | Blocks serialization | Notes |
|---|---|---|---|---|---|
| Eager | At class load time | Class init lock | No (must check manually) | Needs readResolve | Sufficient in most cases |
| Holder | Yes | Class init lock of Holder | No (must check manually) | Needs readResolve | Lazy without synchronized cost |
| DCL + volatile | Yes | volatile + synchronized | No | Needs readResolve | Verbose, easy to get wrong |
| Enum | At class load time | Enum spec | Yes | Yes | Cannot inherit another class |

"Eager" is actually lazy at class level: the class is only initialized on first access (calling get(), reading a non-constant static field). It is only truly "early" when another static method of the class is called first.

### Why thread-safe without locks
The JVM guarantees that static initialization of a class runs **exactly once**; other threads must wait until initialization finishes, and the initialization result is safely published to all threads. Holder exploits the fact that nested class {{Holder}} is only initialized when {{Holder.I}} is read for the first time.

Pitfall: if the constructor throws an exception, the class enters an error state. The first time you see {{ExceptionInInitializerError}}, afterward it is {{NoClassDefFoundError}}, and it does not retry until restart. Do not call network or DB inside a singleton constructor.

### Breaking and preventing
**Reflection**
~~~java
Constructor<FeeTable> c = FeeTable.class.getDeclaredConstructor();
c.setAccessible(true);
FeeTable other = c.newInstance();      // second instance
~~~
- Partial defense: in the constructor, if {{INSTANCE != null}} throw {{IllegalStateException}}.
- Enum: any attempt to create an enum instance via reflection is blocked; {{newInstance}} throws {{IllegalArgumentException}} ("Cannot reflectively create enum objects").
- If the class is in a named module that does not open its package, {{setAccessible(true)}} throws {{InaccessibleObjectException}}.

**Serialization**
~~~java
public final class FeeTable implements Serializable {
    // ...
    private Object readResolve() { return INSTANCE; }  // replace deserialized object with real instance
}
~~~
Without {{readResolve}}, each deserialization creates a new object. Enum is serialized by name and always returns the existing constant.

**Clone**: only an issue when the class (or parent) implements Cloneable. Do not implement it, or override {{clone()}} to throw {{CloneNotSupportedException}}.

**Multiple class loaders**: a "singleton" is really one instance per (class, class loader) pair. App servers running multiple webapps, plugin systems, or Spring Boot DevTools restarting the class loader all create multiple copies. Cannot be blocked in code; place the class in a shared loader or avoid static singleton.

### Inside Spring
Singleton bean scope means "one instance per ApplicationContext", managed by the container: testable (mock, replace bean), no global static state. A self-written static singleton should only be for things truly independent of the container (constant tables, utility). 

> Senior tip: in interviews I answer concisely: "enum if reflection and serialization must be blocked, holder if lazy is needed, and in Spring do not write your own singleton". Interviewers often push on ExceptionInInitializerError; knowing that a class that fails initialization is "broken permanently" until restart shows you have really debugged this on production.`,
    follow: [
      `Why can enum singleton not be broken by reflection?`,
      `What happens if the singleton constructor throws an exception?`,
      `How is Spring singleton bean different from the singleton pattern?`
    ]
  },
  'jvm-019': {
    q: `How are JDK, JRE and JVM different? Describe the path from {{.java}} file to native-speed execution: javac, bytecode, class loading, verify, interpreter, JIT.`,
    a: `**Summary:** JVM is the virtual machine that executes bytecode (HotSpot is the most common implementation). JRE = JVM + standard library, enough to run a program. JDK = JRE + development tools ({{javac}}, {{jar}}, {{jlink}}, {{jcmd}}, {{jfr}}...). Since Java 11, Oracle no longer releases a separate JRE (some vendors like Eclipse Temurin still provide a JRE package); usually you use JDK or build a minimal runtime with {{jlink}}. Path: {{javac}} compiles .java to platform-independent bytecode (.class) -> class loader loads, verifies, links and initializes the class when needed -> interpreter runs bytecode -> hot methods are JIT-compiled (C1 then C2) to native code to replace it.

### Three concepts
| | Includes | Used for |
|---|---|---|
| JVM | Class loader, execution engine (interpreter + JIT), GC, runtime memory areas | Running bytecode |
| JRE | JVM + standard library (java.base, java.sql...) | Running applications |
| JDK | JRE + javac, jar, javadoc, jlink, jcmd, jstack, jfr... | Development, packaging, diagnostics |

"Java" is a specification (JLS for language, JVMS for virtual machine). HotSpot and OpenJ9 are JVM implementations; Temurin, Corretto, Zulu are OpenJDK distributions.

### The path
~~~text
Fee.java --javac--> Fee.class (bytecode + constant pool)
   |
   v   first time code needs Fee class
Loading        : class loader finds and reads bytes (delegation: app -> platform -> boot)
Linking        : verify (bytecode valid, type-safe)
                 -> prepare (allocate static space, assign default values)
                 -> resolve (turn symbolic references into real references, usually lazy)
Initialization : run static initializer, exactly once
   |
   v
Interpreter runs bytecode, counts method calls and loop iterations
   |   hot method
   v
C1 (fast compile with profiling) -> C2 (strong optimization based on profile: inline, escape analysis)
   |   assumption violated (new class loaded, previously never-run branch runs)
   v
Deoptimization: back to interpreter, then recompile
~~~

### Why the two-layer design
- Bytecode allows "write once, run anywhere": the same .class runs on Linux x64 and ARM Graviton.
- Interpreter starts immediately, no need to compile the whole program; JIT only spends effort on the small truly hot part.
- JIT knows **actual runtime data** (which types are really passed in, which branches run often), so in many cases it optimizes stronger than static compilation. Example: inlining an interface call when in practice only one implementation exists.
- Cost: warm-up — first minutes after deploy latency is higher than normal.

### javac does less than you think
javac almost does not optimize: only folds compile-time constants and drops branches like {{if (false)}}. Generics are erased; lambda is compiled to {{invokedynamic}}; string concatenation since Java 9 also uses {{invokedynamic}} ({{StringConcatFactory}}). Real optimization is in JIT. Inspect bytecode with {{javap -c -p Fee.class}}.

### Observing the process
~~~bash
java -Xlog:class+load=info -jar app.jar      # which classes loaded, from where
java -XX:+PrintCompilation -jar app.jar      # which methods JIT-compiled, at which tier
jcmd <pid> Compiler.codecache                # current code cache usage
~~~

### Common wrong answers
- "Java is an interpreted language": actually hybrid — interpreted first, then JIT on hot parts.
- "JIT compiles the whole program at startup": only methods crossing the threshold are compiled.
- "All classes loaded at startup": classes are loaded lazily, when first needed.
- "Server needs JRE installed": modern images use JDK or a runtime built with jlink.

> Senior tip: understanding this path explains many production phenomena: high p99 after each deploy (JIT not warm, so warm-up before receiving traffic); {{NoClassDefFoundError}} only appears when running a rarely used branch (class loaded lazily); and why images built with {{jlink}} with only needed modules are significantly smaller than full JDK.`,
    follow: [
      `When does deoptimization occur and how does it affect latency?`,
      `How do ClassNotFoundException and NoClassDefFoundError differ?`,
      `How does jlink help when packaging a Docker image?`
    ]
  },
  'jvm-020': {
    q: `How does GC determine an object is "garbage"? What are GC roots, why doesn't JVM use reference counting, and why does Java have GC yet still suffer memory leaks?`,
    a: `**Summary:** HotSpot uses **reachability analysis** (tracing): start from the GC roots set, follow every strong reference to mark live objects. Objects unreachable from any root are garbage, even if those objects still point to each other. GC roots include: local variables and parameters in frames of living threads, static fields of loaded classes (through class loader), JNI references, held monitors, and internal JVM references. JVM does not use reference counting because it cannot collect reference cycles (A points to B, B points to A) and the update cost of the counter on every assignment is high (must be atomic under multithreading). A leak in Java means an object **is still reachable** but no longer used: GC cannot know your intention.

### Reachability
~~~text
GC roots
 +-- thread "http-nio-8080-exec-3" stack: local variable order -> Order -> List<Item>
 +-- static field CustomerCache.MAP -> HashMap -> ... -> Customer      (still alive)
 +-- ...

 Session A <--> Session B    (point to each other but no root reaches them) => garbage, collected
~~~
- General steps: **mark** from roots, then **sweep / compact / copy** depending on collector. Young GC scans only young gen, but must treat references from old gen to young gen as additional roots. Those references are tracked via card table / remembered set, updated through write barrier.
- Concurrent collectors (G1 marking, ZGC) mark while the app runs, so barriers prevent missing an object just reassigned (SATB in G1, load barrier in ZGC).

### Specific GC roots
| Root | Common leak example |
|---|---|
| Local variable, parameter on living thread stack | Worker keeps a large list in an infinite loop |
| Static field | Unbounded static Map used as cache |
| Living thread (with its ThreadLocalMap) | ThreadLocal not removed in thread pool |
| Class loader and loaded classes | Old class loader held after redeploy |
| JNI global reference | Native library holds object |
| Held monitor | Rare |

### Why not reference counting
1. **Reference cycles**: Order and Customer point to each other — counter never reaches 0, becomes a leak. CPython needs a separate cycle collector for this reason.
2. **Assignment cost**: must increment/decrement on every assignment and parameter pass; multithreading requires atomic, slow and causes cache line contention.
3. **Cascading deallocation**: when the last reference to a large structure disappears, millions of objects are freed immediately on the running thread, causing unpredictable pauses.

Tracing is the opposite: cost is proportional to **live objects** (for copy collectors). Many garbage but few live objects is very cheap, matching the characteristic that most objects die young.

### Finalize and weak references
- Objects with {{finalize()}} must go through an extra round (placed in finalizer queue and temporarily "revived"), so they are reclaimed later. finalize has been deprecated for removal (JEP 421, JDK 18).
- Soft/Weak/Phantom references do not keep objects alive like strong references; GC handles them by separate rules.

### Why leaks still happen
~~~java
public class AuditService {
    private static final Map<String, List<Event>> PENDING = new ConcurrentHashMap<>();

    public void record(String txId, Event e) {
        PENDING.computeIfAbsent(txId, k -> new CopyOnWriteArrayList<>()).add(e);
        // forgot to remove when transaction completes -> every Event remains reachable from static field
    }
}
~~~
How to find: take a heap dump and use Path to GC Roots in MAT on the suspected object; the holding chain is usually static field -> map -> entry -> object.

### Common wrong answers
- "Setting null makes the object collected immediately": setting null only cuts one reference. The object dies only when no path from any root remains, and only at the next GC.
- "Local variables still in scope mean the object is alive": JIT may consider a variable no longer used as dead, so the object may be collected earlier than you think. That is why {{Reference.reachabilityFence}} exists.
- "System.gc() frees memory immediately": it is only a hint (can be disabled with {{-XX:+DisableExplicitGC}}), and with G1 it typically causes a full GC.
- "Objects pointing to each other in cycles are never collected": true for reference counting, false for JVM.

> Senior tip: when explaining a leak to the team, I always point out the **root** taken from MAT, usually a static field, ThreadLocal of a thread pool, or a class loader. The question "we have GC, why still leaking" is answered in one sentence: GC collects what is unreachable, not what you no longer need.`,
    follow: [
      `How does card table / remembered set solve the problem when only young gen is collected?`,
      `Why does Reference.reachabilityFence exist?`
    ]
  },
  'jvm-021': {
    q: `How do minor GC, major GC and full GC differ? When is an object promoted to old gen, and on production how do you recognize "too-early promotion" or full GC from GC log?`,
    a: `**Summary:** Heap is divided by generation based on the weak hypothesis "most objects die young". **Minor (young) GC** cleans young gen (Eden + Survivor) when Eden is full; has stop-the-world but is fast because only few live objects are copied. **Major GC** is cleaning old gen; the term is not standardized, with G1 it is usually the concurrent marking cycle plus mixed GC passes. **Full GC** cleans the whole heap (plus class unloading) in one stop-the-world; with G1 it is the fallback when other mechanisms cannot keep up, long pause and is a sign of trouble. Objects are promoted when they survive minor GC more times than the tenuring threshold (max 15), when Survivor cannot hold them (early promotion), and very large objects in G1 (humongous) are allocated directly into separate regions in old gen.

### Object lifecycle
~~~text
new Order()  -> Eden
Eden full     -> Young GC: live objects copied to Survivor, age = 1;
                Eden and old Survivor cleared
Later         -> live objects copied between two Survivors, age +1
Age reaches threshold (max 15) or Survivor full -> promote to Old
Old gradually full -> G1: concurrent marking when IHOP exceeded (default 45% heap)
                -> mixed GC cleans young + some old regions with lots of garbage
Not keeping up -> Full GC (stop-the-world, entire heap)
~~~
- Age is stored in 4 bits of the object header, so {{MaxTenuringThreshold}} max is 15. Actual threshold is dynamically adjusted based on Survivor fill level ({{TargetSurvivorRatio}}, default 50%).
- In G1, objects from half a region size upward are **humongous** and allocated directly to separate regions in old. Continuously creating large byte arrays (reading files, building large responses) is a pressure source on old gen.

### Comparison
| | Young | Mixed (G1) | Full |
|---|---|---|---|
| Scope | Eden + Survivor | Young + some old regions with lots of garbage | Entire heap |
| Trigger | Eden full | After concurrent marking | Allocation failure, evacuation failure, System.gc()... |
| Pause | Short (few ms to a few tens of ms) | Short, targeting pause goal | Long, can be seconds with large heap |
| Normal? | Yes, happens continuously | Yes | No, needs investigation |

### Too-early promotion
Objects living "on average" (session, response being built, batch of 10,000 records) survive 1–2 young GCs, Survivor does not have room so they are pushed to old, then die shortly after. Old gen fills with garbage, marking and mixed GC run more frequently, severe cases lead to full GC.

Common causes: very high allocation rate; young gen too small (e.g., setting {{MaxGCPauseMillis}} too low causes G1 to shrink young); batch holding too much data at once.

### Reading GC log (JDK 17, -Xlog:gc)
~~~text
[12.345s][info][gc] GC(41) Pause Young (Normal) (G1 Evacuation Pause) 1530M->420M(2048M) 18.214ms
[60.101s][info][gc] GC(97) Pause Young (Concurrent Start) (G1 Humongous Allocation) 1720M->980M(2048M) 25.002ms
[75.880s][info][gc] GC(120) Pause Full (G1 Compaction Pause) 2010M->1890M(2048M) 2450.317ms
~~~
- Line 1 normal: young GC cleaned over 1 GB, 420 MB left.
- Line 2: marking triggered by a humongous allocation; need to see who is allocating large arrays.
- Line 3: full GC took 2.4 seconds but only freed 120 MB, meaning old gen contains entirely **live** objects. This is a leak or heap too small, not a GC tuning issue.

### Actions
- Check age distribution in Survivor with {{-Xlog:gc+age=trace}}.
- Old gen after each mixed/full GC increases over days: leak, need heap dump. Old gen stable but still full GC: heap too small or humongous allocation; increase heap, reduce large array allocation, or let G1 start marking earlier.
- Full GC from {{System.gc()}} by library or hand-written code: find and remove the call, or use {{-XX:+ExplicitGCInvokesConcurrent}}.

### Common wrong answers
- "Major GC equals full GC": the terms are often mixed, but with G1 cleaning old gen is mainly concurrent marking plus mixed GC, not full GC.
- "Minor GC does not stop the application": it has stop-the-world, just very short.
- "Objects must survive 15 GC passes to go to old": threshold changes dynamically, and Survivor full causes early promotion.

> Senior tip: the first metric I look at is not pause time but **old gen after GC** (heap left after mixed/full GC). A flat line is a healthy heap; a staircase upward is a leak; flat but close to ceiling means heap is too small. Three shapes, three different handling paths.`,
    follow: [
      `Why is MaxTenuringThreshold at most 15?`,
      `What is a humongous object in G1 and why does it cause problems?`,
      `When does full GC occur in G1, and how do you handle it?`
    ]
  }
});
