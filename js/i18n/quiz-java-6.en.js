/*
 * English translation of js/data/quiz-java.js — task T681. Format: js/core/i18n.js (content overlay).
 * ids: qz-concurrency-023 qz-concurrency-024 qz-jvm-021 qz-jvm-022 qz-jvm-023 qz-jvm-024
 */
App.i18n.content({
  "qz-concurrency-023": {
    "q": `Review a class that uses {{synchronized}} everywhere. Which statements are **correct**? (Choose 3)
~~~java
public class OrderService {
    private static final String LOCK = "ORDERS";
    public static synchronized void rebuildAll() { ... }
    public synchronized void save(Order o) { ... }
    public void publish(Order o) {
        synchronized (LOCK) { queue.add(o); }
    }
}
~~~
`,
    "options": [
      `rebuildAll() locks on the OrderService.class object, so two different instances still exclude each other`,
      `A monitor is reentrant: a thread that already holds the lock can enter other code using the same lock without blocking itself`,
      `Locking on LOCK is safe because it is a String literal: literals are interned and never change value`,
      `A thread blocked waiting to enter a synchronized block can be woken up with thread.interrupt()`,
      `Calling LOCK.wait() without holding LOCK's monitor throws IllegalMonitorStateException`
    ],
    "explain": `**Correct answer: a static method locks on the Class object, a monitor is reentrant, and wait() requires holding the monitor.**

### What a monitor is
Every Java object comes with a **monitor**: one mutually exclusive ticket (only one thread holds it at a time) plus a **wait set** (the list of threads currently in {{wait()}}). The token identifying the lock is the **object reference** you name.

### Why the chosen answers are correct
- **{{static synchronized}} -> locks on {{OrderService.class}}**: a static method has no {{this}}, so the JVM uses the {{Class}} object as the monitor. Two threads on two different instances **still** exclude each other. By contrast {{save()}} locks on {{this}}: two different instances run **in parallel** and never block one another — this is the point most often misunderstood when you actually need a global invariant.
- **Reentrant**: a monitor counts acquisitions per thread, so a thread that already holds the lock can re-enter a region using the same lock (a method calling another method) without deadlocking itself. That is what makes nested code simple to write.
- **{{wait()}} requires holding the monitor**: it has to add the thread to that very object's wait set, so calling it outside {{synchronized}} throws {{IllegalMonitorStateException}} immediately.

### Why the other options are wrong
- **String literals are safe**: literals are **interned JVM-wide**, so any other class that locks on the identical string "ORDERS" shares **the same monitor** with you — invisible coupling, puzzling contention, and if someone passes that reference out, they can hold your lock. The standard is {{private static final Object LOCK = new Object();}} (an object that cannot accidentally be shared).
- **Interruptible while blocked on {{synchronized}}**: monitor acquisition is a **non-interruptible** block; {{interrupt()}} only sets the flag and the thread keeps waiting until it gets the lock. If you need cancellability, use {{ReentrantLock.lockInterruptibly()}} (or {{tryLock}} with a timeout). Note the distinction: {{wait()}} **does** react to an interrupt (it throws {{InterruptedException}}).

> Senior tip: two lessons that matter in production: (1) a {{synchronized}} wrapping an RPC/DB call can **hang an entire pool of threads** — every other request queues behind it, and because the wait cannot be interrupted, neither {{ExecutorService.shutdownNow()}}, a client timeout, nor request cancellation can save you; so keep only the lines that truly need the monitor inside it and never call out (RPC, DB) from there. (2) In a thread dump, this kind of deadlock shows up as a group of threads "waiting to lock" the same monitor while the holder itself is waiting on another lock — the JVM prints "Found one Java-level deadlock" for both monitors and {{ReentrantLock}}, but it does **not** detect "waiting on yourself" deadlocks such as upgrading a read lock into a write lock.`
  },
  "qz-concurrency-024": {
    "q": `A cache uses {{ReentrantReadWriteLock}}. Two threads read at the same time and **both** find the key missing. What happens?
~~~java
rw.readLock().lock();
try {
    if (cache.get(key) == null) {
        rw.writeLock().lock();               // trying to "upgrade"
        try { cache.put(key, loadFromDb(key)); }
        finally { rw.writeLock().unlock(); }
    }
    return cache.get(key);
} finally {
    rw.readLock().unlock();
}
~~~
`,
    "options": [
      `Both hang forever: the write lock is not granted while any read lock is still held, and those read locks are held by these very two threads`,
      `T2 gets the write lock immediately, because a read lock is released automatically when a thread asks for the write lock`,
      `T2 throws IllegalMonitorStateException, because it is holding a read lock while requesting a write lock`,
      `The code is correct, just slower: the write lock waits until the other thread's read lock expires`
    ],
    "explain": `**Correct answer: T1 and T2 deadlock against each other, because there is no read -> write upgrade.**

### Reading the mechanism
{{ReentrantReadWriteLock}} lets **many** threads hold the read lock at the same time, but the write lock is exclusive: it is granted only when **no** read lock remains. The Javadoc states explicitly that this lock class does **not support upgrading** a read lock into a write lock — meaning that if you hold the read lock and ask for the write lock, you block yourself.

How it plays out:
~~~text
T1: readLock OK (reader count = 2, together with T2) -> ask for writeLock -> blocked, waits for readers to release
T2: readLock OK                                       -> ask for writeLock -> blocked, waits for readers to release
 current readers = {T1, T2}, and both are blocked, so nobody ever releases
 -> a closed waiting cycle: no timeout, no exception
~~~
The painful part: this is a deadlock **without an owner** (the write lock belongs to nobody yet), so deadlock detectors such as {{ThreadMXBean.findDeadlockedThreads()}} easily miss it; the thread dump only shows two threads {{WAITING (parking)}} inside {{writeLock().lock()}}, and you have to realise yourself that they are still holding the read lock ({{getHoldCount()}} of the read lock > 0).

### The fix
Release the read lock **before** asking for the write lock, then re-check the condition once you hold the write lock (double-check), because another thread may have finished loading while you were waiting:
~~~java
rw.readLock().lock();
boolean absent;
try { absent = cache.get(key) == null; }
finally { rw.readLock().unlock(); }
if (absent) {
    rw.writeLock().lock();
    try { if (cache.get(key) == null) cache.put(key, loadFromDb(key)); }
    finally { rw.writeLock().unlock(); }
}
~~~
Once you **hold the write lock**, continuing to read is allowed via a **downgrade** (acquire the read lock, then release the write lock) — that direction is supported by the JDK.
A neater answer for exactly the "load once per key" problem: drop the lock entirely and use {{ConcurrentHashMap.computeIfAbsent}} (the function runs only when the key is absent, atomic per bin — but remember the mapping function must be short and must not do slow I/O), or {{StampedLock}} with {{tryConvertToWriteLock}} / {{tryOptimisticRead}}, or the immutable-snapshot + {{AtomicReference}} pattern.

### Why the other options are wrong
- **The read lock releases itself when you ask for write**: no such mechanism exists; the lock is still counted as a held reader.
- **Throws an exception**: asking for a lock in the wrong posture throws nothing at all, so the bug shows up as a **hang**, not as a log line.
- **Just slower**: "the write lock waits for the read lock to expire" is meaningless — a read lock has no expiry, it only ends when {{unlock()}} runs.

> Senior tip: if you still want an RWLock, do not upgrade — use {{tryLock(timeout)}} for the write lock: when the time is up, return "cache miss, read straight from the DB" instead of hanging; adding a timeout turns a deadlock into degradation. And remember that the read lock is **not** free: every {{lock()}}/{{unlock()}} is one CAS on a shared state word (a hot cache line), so for a small cache with heavy reads, {{StampedLock}} optimistic reads or a plain concurrent map are usually faster and have no deadlock window at all.`
  },
  "qz-jvm-021": {
    "q": `The property {{app.timeout}} is not passed into the container, so {{parseInt}} throws. Two endpoints of **the same JVM** read {{Config.TIMEOUT}} one after the other, and each one {{catch (Throwable t)}} then logs the exception class name. Which statements are **correct**? (Choose 3)
~~~java
class Config {
    static final int TIMEOUT = Integer.parseInt(System.getProperty("app.timeout", "abc"));
}
~~~
`,
    "options": [
      `The first read throws ExceptionInInitializerError; every later read throws NoClassDefFoundError with the message "Could not initialize class Config"`,
      `TIMEOUT is not a compile-time constant, so reading it triggers initialization; had it been written static final int TIMEOUT = 30, javac would have inlined the constant into the caller and triggered nothing`,
      `The one-argument Class.forName("Config") only loads the class, it does not run the static initializer yet`,
      `The JVM runs <clinit> only once per class per classloader; a class marked as erroneous fails on every later access too, so the process must be restarted`,
      `int has a default value of 0, so the second read returns 0 and the second endpoint keeps working normally`
    ],
    "explain": `**Correct answer: ExceptionInInitializerError followed by NoClassDefFoundError, only constants get inlined, and a static initializer runs exactly once.**

### Which steps a class goes through
1. **Loading**: find the bytecode, build the {{Class}} object, move it into the metaspace.
2. **Linking**: verify (check the bytecode), **prepare** (allocate memory for static fields and assign **the type's default value**: 0, null — your code has not run yet), resolve.
3. **Initialization**: run {{<clinit>}} — that is, the static initializers and static blocks, **in exactly the declaration order in the file**.

{{<clinit>}} runs **exactly once** per (class, classloader), under that class's own **initialization lock** (JVMS 5.5). The outcome is recorded: success (mark = initialized) or failure (mark = erroneous).

### What happens in this scenario
~~~text
Endpoint A: getstatic Config.TIMEOUT -> class not initialized yet -> run <clinit>
            -> NumberFormatException -> JVM wraps it: ExceptionInInitializerError(cause=NumberFormatException)
            -> Config is marked ERRONEOUS
Endpoint B: getstatic -> class is erroneous -> NoClassDefFoundError: Could not initialize class Config
            (the original cause is NO LONGER in the stack trace!)
~~~
Why the remaining answers are wrong:
- **{{Class.forName("Config")}}**: the one-argument version is equivalent to {{forName(name, true, loader)}} → it **does** initialize. To only load, you must use the three-argument version with {{initialize = false}}.
- **Returns 0**: the "prepare" state (every static = 0) exists **before** init; once the class is erroneous, no read is allowed to return any value — it keeps throwing {{NoClassDefFoundError}} forever.

### Why a "constant" is the exception
JVMS defines a *constant expression* (primitive/String, made only of constants and operations that call no method). {{static final int TIMEOUT = 30;}} is a constant → javac puts the value straight into the bytecode of every class that uses it (the {{ConstantValue}} attribute), the field is never read through {{getstatic}}, so it does **not** trigger init. {{Integer.parseInt(...)}} is a method call → not a constant → triggers init, even though the field is {{final}}.

> Senior tip: this is the source of the incident "the second endpoint fails with a stranger error than the first": the second stack trace **loses the cause**, and people debug the wrong thing. Three preventions: (1) do not do I/O (read a file, call the vault, parse config) inside {{<clinit>}} — put it in an {{init()}} method called explicitly at boot, so you fail fast and log the real reason; (2) if you still use static init, "touch" the class at boot, catch {{ExceptionInInitializerError}} and print {{getCause()}}; (3) remember the initialization lock can also cause a **deadlock** when two threads initialize two classes that reference each other (A is running {{<clinit>}} and needs B, B is running {{<clinit>}} and needs A); the thread dump shows {{BLOCKED}}, "waiting to lock" on a {{java.lang.Class}} — easy to misread as an ordinary locking bug.`
  },
  "qz-jvm-022": {
    "q": `Turning on allocation sampling (async-profiler {{-e alloc}} / JFR) on a **hot** method shows almost no objects being created, even though the code clearly allocates on every call. Re-running with {{-Xint}} (interpreter only) shows a fresh {{Point}} in every single iteration. Most plausible explanation?
~~~java
public double distance(Point p) {
    Point copy = new Point(p.x, p.y);   // never escapes the method
    return Math.hypot(copy.x, copy.y);
}
~~~
`,
    "options": [
      `The GC collected everything before the profiler could record a sample, because a small object only stays in Eden for a few ms`,
      `C2 saw the object does not escape and replaced it with local variables (scalar replacement): the fields live in registers/stack frame, no heap allocation at all`,
      `The JVM automatically interns every immutable value class, so only one shared instance ever exists`,
      `In normal mode objects come from the thread's pre-allocated TLAB, so only the very first call is a real allocation`
    ],
    "explain": `**Correct answer: escape analysis + scalar replacement in the JIT compiler.**

### What "escape" means and how the mechanism works
The JIT (C2) analyses whether the **reference** of a freshly created object can "escape" the compilation scope of the method. It escapes when you:
- return the object to the caller, assign it into a field of another live object, put it into a collection or a static field,
- pass it to a method that C2 **cannot inline**,
- publish it to another thread (including through a {{BlockingQueue}}).

If it does not escape, the object is really just **a bundle of local values**: C2 takes it apart ("scalar replace") and keeps each field in a register or in a stack-frame slot. No object on the heap → nothing for the GC to collect, and the benchmark's {{for}} loop looks "free".
Coming along with it is **lock elision**: a {{synchronized}} on a non-escaping object is removed entirely, because nobody else can ever see that object.

### Why {{-Xint}} behaves differently
{{-Xint}} disables the JIT: the code runs in the interpreter, no analysis happens at all, so every iteration performs a real {{new}}. In normal mode the optimisation only appears **after** the method is hot enough to be compiled by C2 and its callees have been inlined — which is why measuring "{{-Xint}} versus normal", or "first iteration versus the millionth", gives completely different conclusions.

### Why the other options are wrong
- **The GC cleaned up before sampling could see it**: allocation sampling records the event at **the moment the object is created** (when the TLAB pointer is bumped), not when the GC runs; a short-lived object is still counted.
- **Interning the object**: only {{String}} is interned, and only on request ({{intern()}}, the constant pool); there is no mechanism that automatically shares objects by value.
- **Pre-shared TLAB**: a TLAB is a chunk of heap already reserved for the thread; every {{new}} is still one pointer bump and still produces an allocation event. It is not an object pool.

> Senior tip: two practical consequences. (1) **Do not write object pools / recycle objects to "reduce GC"** for small, short-lived objects: a {{new}} inside a TLAB costs a few nanoseconds, and a young GC of already-dead objects is nearly free; a pool adds reference-holding fields, invites leaks, and actively **prevents** scalar replacement because the object now lives long and is shared. (2) This optimisation is **opportunistic**: adding one log line with a placeholder, making the method bigger, or a caller that cannot be inlined is enough to bring the allocations **back** between two builds. So when you tune allocation, measure the allocation rate ({{jcmd PID GC.class_histogram}}, async-profiler {{-e alloc}}, JFR {{jdk.ObjectAllocationInNewTLAB}}) on the real build instead of trusting that "the JVM handles small objects for you". One more caveat: an object that does **not** escape but is too large, or that has a dynamically sized array field, is also usually skipped.`
  },
  "qz-jvm-023": {
    "q": `A service reads a whole file into memory: each request allocates one {{byte[]}} of about 6 MB. Heap 8 GB, {{-XX:G1HeapRegionSize=4m}}. The GC log contains the line {{Pause Young ... (G1 Humongous Allocation)}} and the humongous region count keeps rising, with occasional {{Pause Full}}. What is going on?
~~~text
[gc] GC(118) Pause Young (Mixed) (G1 Humongous Allocation) 6215M->5980M(8192M) 41.2ms
[gc,heap] GC(118) Humongous regions: 1542->1540
~~~
`,
    "options": [
      `A 6 MB array is bigger than the young gen, so it goes straight to the old gen; that is normal G1 behaviour`,
      `G1 always copies every live object, so this is only a slightly longer pause and nothing to worry about`,
      `The JVM raises the region size on its own when it sees large objects; these log lines belong to the warm-up phase`,
      `A 6 MB array exceeds half a region (2 MB), so it is classified as humongous: it occupies a run of consecutive regions, sits outside the normal young collection cycle, and the need to find a contiguous run of free regions causes fragmentation until there is no room left even though the heap still has free space`
    ],
    "explain": `**Correct answer: an object larger than 50% of the region size becomes a humongous object.**

### Regions and the humongous threshold
G1 divides the heap into equal **regions** (the size is picked from the heap by default, between 1 MB and 32 MB; here you forced 4 MB). A region either plays the role of eden/survivor/old, **or** holds one **humongous object**. The rule: an object whose size is **greater than 50% of the region size** (> 2 MB for a 4 MB region) cannot fit in a single region, so it is called humongous.

It is allocated from the start into a **run of consecutive regions**: the first region (the head) carries the metadata, the following ones just continue the chain. Consequences:
- **It never goes through the young gen**: it does not get reclaimed "for free" in a young GC the way an ordinary short-lived object does; to reclaim a humongous region you must know for sure that no reference remains (JDK 9+ has eager reclaim for the unreferenced case, but it still needs a cycle with enough information).
- **It needs a contiguous free run**: 6 MB needs **2 consecutive free regions**. The heap may have 2 GB free but shredded into pieces → no run is long enough → the allocation fails. At that point G1 either has to start a concurrent cycle early, or, when nothing else is left, run a **Full GC** — that is the {{Pause Full}} line in the log.
- **Copying is expensive**: when it has to move, it copies whole regions, so pauses grow.

That is why seeing {{G1 Humongous Allocation}} frequently means you are manufacturing old-gen pressure and fragmentation with large arrays.

### How to fix it (in the order you should try)
- **Do not load whole files into RAM**: stream them in small chunks ({{InputStream}}, a 64–128 KB buffer), or use {{FileChannel.transferTo}} so the copy never passes through the heap.
- **Reuse buffers** in a controlled way (a buffer pool, {{ArrayDeque}} + clear), or use a **direct ByteBuffer** (off-heap, it does not land in any region).
- **Raise the region size**: {{-XX:G1HeapRegionSize=16m}} → threshold becomes 8 MB, and a 6 MB array turns into an ordinary object. The trade-off: partitioning gets coarser, pause prediction gets less accurate, and this is not suitable for a small heap.

### Why the other options are wrong
- **Bigger than the young gen so it goes to old**: the young gen here is far larger than 6 MB; the deciding factor is the **region size**, not the young gen.
- **Only a longer pause**: the log shows {{Pause Full}} and a nearly exhausted heap — that is a failure signal, not normal behaviour.
- **Raises the region size automatically**: the region size is decided **once at startup** and never changes while the process runs.

> Senior tip: two details interviewers like to dig into. (1) The "half a region" threshold explains why the same 6 MB array may or may not be humongous depending on {{-XX:G1HeapRegionSize}} — always verify with {{jcmd}} using the {{VM.flags}} command, or read the {{Humongous regions}} line from {{-Xlog:gc+heap}}. (2) A greedy {{MaxGCPauseMillis}} (say 20 ms) makes G1 shrink the young gen to hold the pause, which pushes surviving objects into the old gen sooner and makes the problem worse; if your workload genuinely has many giant objects, ZGC (it has no region-copy model like this, and its pauses do not scale with heap size) is usually the better fit — but measure the allocation rate before you switch GC.`
  },
  "qz-jvm-024": {
    "q": `A Java 21 service runs happily with {{-Xmx31g}}. To "get rid of the OOMs", the team raises it to {{-Xmx48g}} on the same node. Afterwards: RSS grows by **more** than the exact 48/31 ratio, throughput drops by roughly 12–15%, while the GC log shows the GC count and the live data size essentially unchanged. Most plausible cause?`,
    "options": [
      `Above 31 GB, G1 automatically switches to the serial Full GC algorithm because there are not enough regions to parallelise`,
      `The JVM disables the JIT once the heap passes 32 GB, to save memory for objects, so the code falls back to the interpreter`,
      `Above the 32 GB threshold HotSpot stops using compressed oops: every reference field inflates from 4 to 8 bytes, objects get bigger, fewer objects fit in one cache line, and RAM traffic increases`,
      `Linux can only address 32 GB for a single 64-bit Java process, and the excess gets swapped out`
    ],
    "explain": `**Correct answer: past about 32 GB, compressed oops is switched off, and every object containing references gets larger.**

### What compressed oops are
"oop" = **ordinary object pointer**, the way the JVM stores a **reference to a heap object** inside another object's field or inside an array. On a 64-bit JVM, instead of spending 8 bytes, HotSpot stores only **4 bytes** and decodes them on use:
~~~text
address = HEAP_BASE + (stored_value << 3)
~~~
This **3-bit** left shift is legal because every object is **aligned to 8 bytes**, so the low 3 bits are always 0 — which is how 32 bits can describe a heap of up to **2^32 × 8 = 32 GB**. The condition: the heap region (more precisely, the address range the JVM reserves, including all reserved parts) stays within that limit; ergonomics turns compressed oops off by itself once {{-Xmx}} passes about 32 GB.

### Why crossing the threshold makes things slower
| | heap ≤ 32 GB | heap > 32 GB |
|---|---|---|
| reference field | 4 bytes | 8 bytes |
| example object: header 12 + 3 refs | 12 + 12 = 24 bytes | 12 + 24 = 36 -> padded to 40 bytes |
| objects fitting in a 64-byte cache line | more | fewer |
The chain of consequences: the heap "inflates" relative to the real live data, **more bytes have to be scanned/copied** on every GC, and there are **more RAM accesses** because one cache line holds fewer live objects. That is why throughput drops even though the GC count does not change — the well-known "32 GB cliff".

### Verifying and what to do about it
- Check the flags actually in effect: {{java -XX:+PrintCommandLineFlags -version}}, or {{jcmd}} with the {{VM.flags}} command and look for {{UseCompressedOops}}; MAT also reports "compressed oops" in a heap dump.
- **Keep the heap at about ≤ 31 GB and run more instances** (usually the right answer for a web service: smaller young GCs, smaller blast radius).
- {{-XX:ObjectAlignmentInBytes=16}} allows compressed oops up to a 64 GB heap, but every object gets padded to a multiple of 16 bytes — typically a net loss for workloads full of small objects.
- Move large data **off-heap** (direct buffers, an external cache, RocksDB) or use **ZGC** for a very large heap, and measure again.

### Why the other options are wrong
- **G1 switches to serial Full GC**: G1's Full GC has been multithreaded since JDK 10, and the region count has nothing to do with the 32 GB threshold.
- **Disables the JIT**: no such mechanism exists; {{UseCompressedOops}} has no bearing on compiled code either.
- **Linux can only address 32 GB**: a 64-bit process can address hundreds of TB; 32 GB is only the limit used to **force** references down to 4 bytes.

> Senior tip: there are two independent "compressions" that people mix up: **compressed oops** depends on the **heap size**, whereas **compressed class pointers** (references to a {{Klass}}) depend on the **Metaspace** (a 2 GB range by default) and stay on regardless of heap size. So do not answer in an interview that "the heap is over 32 GB, therefore class pointers are off too". Beyond that, this is a textbook case of treating "raise {{-Xmx}}" as a fix without understanding the cause: if the real live set is 40 GB, a 48 GB heap only buys time, and if the live set is 20 GB you should ask why {{-Xmx31g}} reported OOM at all — usually fragmentation, humongous allocation, or off-heap growth, not a heap that is too small.`
  },
});
