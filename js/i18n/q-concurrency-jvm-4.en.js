/*
 * English translation of js/data/q-concurrency-jvm.js — tasks T170, T516.
 * ids: jvm-014 jvm-015 jvm-016 jvm-017 jvm-018 concurrency-021 concurrency-022 concurrency-023
 */
App.i18n.content({
  'jvm-014': {
    q: `Native Memory Tracking: RSS is much higher than heap — metaspace, thread stack, direct buffer, code cache, glibc malloc arenas. How do you analyze it?`,
    a: `**Summary:** The RSS of a Java process is the heap plus native memory allocated by the JVM (metaspace, code cache, thread stacks, GC data structures, symbols, direct buffers...), plus native memory the JVM does not track (JNI libraries, malloc overhead and fragmentation). NMT ({{-XX:NativeMemoryTracking=summary}}) only sees the part the JVM allocates itself. Procedure: enable NMT, take a baseline, and after a few hours look at {{summary.diff}} to see which category grew. If NMT's total committed stays stable while RSS keeps growing, suspect the part outside NMT, usually glibc malloc arenas or native libraries.

### Quick intuition
Think of RSS as the total rent bill for the JVM's apartment. The heap is only the rent for the main room; then come the electricity (thread stacks), the water (metaspace), the parking fee (direct buffers) and the management fee (GC data structures). NMT is the itemised bill the **JVM writes itself**, so it only lists what the JVM pays for. Costs paid by the "roommates" (native libraries, glibc malloc holding on to freed memory) never appear on that bill; if the total bill grows while the itemised bill stays flat, the culprit lives outside the JVM.

### Terms
- **RSS**: the real amount of RAM the process occupies — the number Kubernetes uses to OOMKill.
- **NMT (Native Memory Tracking)**: a HotSpot feature that tracks native memory allocated by the JVM itself.
- **Reserved / committed**: reserved is address space held in advance; committed is the part actually backed by memory (closer to RSS).
- **Metaspace**: the native region that holds class metadata.
- **Direct buffer**: off-heap memory used by NIO/Netty.
- **glibc malloc arena**: a separate memory-management region the C library hands to threads to reduce contention; it retains memory that was freed.
- **pmap**: a Linux command that lists a process's memory regions and how much of each is resident.
- **jemalloc**: an alternative allocator to glibc malloc, usually less prone to fragmentation.

### Analysis procedure (step by step)
1. Enable NMT at startup. Why: NMT must track from the very first allocation; it cannot be switched on mid-run.
2. Once the app is stable, take a {{baseline}}.
3. Wait a few hours under real traffic, then run {{summary.diff}} to see which category grew.
4. Compare NMT's total committed with RSS: if they match, the problem is inside the JVM; if RSS is much higher and keeps growing, look outside NMT.
5. Handle each category as described in the table below.

~~~text
RSS 3.2 GB
= Java Heap committed       2.0 GB
+ NMT off-heap              0.7 GB  (Thread 0.3, Class 0.2, Code 0.1, GC 0.1)
+ the part NMT cannot see   0.5 GB  (malloc arena, native libraries)  <- if this keeps growing, suspect glibc
~~~

### Main categories in NMT
| Category | Content | Grows abnormally when |
|---|---|---|
| Java Heap | Heap | Committed up to Xmx is normal |
| Class | Metaspace + compressed class space | Class loader leak, dynamic class generation (proxies, script engines) |
| Thread | Platform thread stack | Thread count increases (unbounded pool, threads that never end) |
| Code | JIT code cache | Usually stable; capped at 240 MB by default with tiered compilation |
| GC | Card table, remembered set, mark bitmap | Large heap, large G1 remembered set |
| Other (JDK 11+) | Direct ByteBuffer, Unsafe.allocateMemory | NIO/Netty not releasing buffers |
| Arena Chunk | HotSpot internal arena (compiler...) | Spikes while the JIT compiles a large method |

Note: "Arena Chunk" is HotSpot's own arena, **not** glibc's malloc arena. glibc's overhead does not show up in NMT.

### Operations
~~~bash
# Can only be enabled at startup, not while the process is running
java -XX:NativeMemoryTracking=summary -jar app.jar

jcmd <pid> VM.native_memory baseline
# ... a few hours later
jcmd <pid> VM.native_memory summary.diff

# Compare with the real RSS: the largest regions
pmap -x <pid> | sort -k3 -n | tail -20
~~~
- summary adds a small overhead; detail records allocation call stacks so it costs more — use it only when you need to know who allocates.
- Cross-check: RSS is roughly NMT committed plus the part outside NMT. A large, growing gap means the problem is outside the JVM.

### Each root cause
1. **Threads growing**: count threads with {{jcmd <pid> Thread.print}} or the metric {{jvm.threads.live}}. Each platform thread reserves {{-Xss}} (1 MB by default on Linux x64) but only commits the pages it actually uses.
2. **Classes growing**: class loader leak, CGLIB/ByteBuddy generating classes non-stop; inspect with {{jcmd <pid> VM.metaspace}}. Setting {{-XX:MaxMetaspaceSize}} makes the leak surface early, but you still have to fix the root cause.
3. **Other growing**: direct buffers. {{-XX:MaxDirectMemorySize}} defaults to max heap. Netty keeps its own counter and limit ({{io.netty.maxDirectMemory}}) and may allocate outside the JDK's counter; enable Netty's leak detector ({{-Dio.netty.leakDetection.level=paranoid}}) in test environments.
4. **NMT stable but RSS still growing**: glibc malloc fragmentation and arenas. Threads that allocate heavily can be assigned their own arena (default cap 8 × the core count on 64-bit), and each arena retains freed memory. Try {{MALLOC_ARENA_MAX=2}} or switch allocator (jemalloc) and compare. Native libraries belong here too: an {{Inflater}}/{{GZIPInputStream}} that is never closed holds zlib memory.

### Container
On Kubernetes, a pod is OOMKilled (exit 137) when RSS exceeds the memory limit, and at that moment the JVM throws no OutOfMemoryError at all. So the heap should only take part of the limit, leaving room for all the categories above.

### Common mistakes
- **Hunting a leak in heap dumps while the heap is fine**: you lose a whole day for nothing. Avoid: compare RSS with heap first; a large gap means go the native route.
- **Running NMT detail on production for a long time**: the overhead is significant. Avoid: summary runs in the background; detail only when you need to know who allocates.
- **Raising the memory limit to cure OOMKilled**: a native leak keeps growing, you just die more slowly. Avoid: use summary.diff to find the growing category.
- **Not closing GZIPInputStream/Inflater**: RSS creeps up outside NMT. Avoid: try-with-resources for every compression stream.

### 1-minute spoken answer
"A Java process's RSS is the heap, plus native memory the JVM allocates itself such as metaspace, thread stacks, code cache, GC structures and direct buffers, plus native memory outside the JVM's tracking such as JNI libraries and glibc malloc. I enable Native Memory Tracking at summary level at startup, take a baseline once the app is stable, and a few hours later read summary.diff to see which category grew: Thread growing means count threads, Class growing means suspect a classloader leak, Other growing means direct buffers. If NMT stays flat while RSS keeps growing, I suspect malloc arenas and try MALLOC_ARENA_MAX or jemalloc. The trade-off is that NMT costs a little overhead and detail costs more. In containers I always leave room for native memory when sizing the heap."

> Senior tip: the formula I use is RSS = heap + the NMT part outside the heap + the part outside NMT, and I always compute all three numbers before concluding. Common case: a 4 GB pod gets OOMKilled although the heap is only 2.5 GB; NMT shows Thread taking a few hundred MB because an HTTP client creates a new thread per request. That case needs a code fix — raising the memory limit only makes the failure slower.`,
    follow: [
      'Why does the glibc malloc arena inflate RSS, and what trade-off does MALLOC_ARENA_MAX involve?',
      'How do NMT summary and detail differ, and when do you need detail?',
      'A pod is OOMKilled but the logs contain no OutOfMemoryError — how do you investigate?'
    ]
  },
  'jvm-015': {
    q: `JVM flags baseline for a Spring Boot service on a container: heap %, GC, OOM dump, GC log, exit on OOM — the reason for each flag?`,
    a: `**Summary:** My baseline for Spring Boot 3 on Java 21 in a container: let the JVM read the cgroup memory limit itself and set the heap as a percentage ({{-XX:MaxRAMPercentage}} around 60-75), pick the GC explicitly (G1, or Generational ZGC when you need low latency), enable GC logging with rotation, write a heap dump on OOM to a durable volume, set {{-XX:+ExitOnOutOfMemoryError}} so the process dies outright instead of lingering half-alive, and run JFR in the background. I never add a flag whose effect I cannot measure.

### Quick intuition
A baseline JVM flag set is like a pilot's **pre-flight checklist**: it is not there to fly faster, but so that when something goes wrong the aircraft reacts correctly and leaves enough data to investigate. Heap by percentage is like packing luggage within the bag's weight allowance; the heap dump and JFR are the black box; ExitOnOutOfMemoryError is the rule "if an engine fails, land immediately, do not keep flying". Every flag must answer the question "what does it protect me from?".

### Terms
- **cgroup**: the Linux mechanism that limits CPU/RAM per container; the JVM reads the limit from here.
- **MaxRAMPercentage / InitialRAMPercentage**: maximum / initial heap as a percentage of the memory limit.
- **Server-class machine**: a machine the JVM treats as "server" (2+ CPUs and roughly 1792 MB RAM or more); below that the JVM picks SerialGC.
- **Unified logging (-Xlog)**: the JVM logging system since JDK 9, with file rotation.
- **ExitOnOutOfMemoryError**: the JVM exits as soon as it hits the first OutOfMemoryError.
- **JAVA_TOOL_OPTIONS**: an environment variable the JVM reads automatically to add flags; convenient in containers.
- **restartPolicy**: the Kubernetes rule for restarting a container when its process exits.
- **Graceful shutdown**: stop accepting new requests, wait for in-flight requests to finish, then shut down.

### How the JVM decides when a pod starts (step by step)
1. Read the memory/CPU limit from the cgroup. Why it matters: without that, the JVM thinks it has the whole node's RAM.
2. Compute heap = limit × MaxRAMPercentage (unless Xmx is set).
3. Choose the GC: if there is a flag, follow it; otherwise G1 for a server-class machine, SerialGC otherwise.
4. Open the GC log, JFR and NMT according to the flags — these can only be enabled at this step; NMT cannot be switched on mid-run, and JFR needs a jcmd call afterwards.
5. On OOM: write a heap dump to HeapDumpPath, then exit (exit code 3) so kubelet restarts the container.

~~~text
Pod limit 2 GiB, 2 vCPU, MaxRAMPercentage=70
heap max  ~ 1434 MiB
native    ~ 614 MiB  (metaspace, thread, code cache, direct, GC, malloc)
GC        = G1 (because of -XX:+UseG1GC; 1 vCPU without an explicit flag -> SerialGC)
~~~

### The flag set
~~~bash
-XX:MaxRAMPercentage=70
-XX:InitialRAMPercentage=70
-XX:+UseG1GC
-Xlog:gc*:file=/logs/gc-%p.log:time,uptime,level,tags:filecount=5,filesize=20m
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/dumps/
-XX:+ExitOnOutOfMemoryError
-XX:StartFlightRecording=settings=default,maxage=6h,maxsize=512m
-XX:NativeMemoryTracking=summary
~~~
Usually passed through the {{JAVA_TOOL_OPTIONS}} environment variable or the image ENTRYPOINT.

### Why each flag
| Flag | Why |
|---|---|
| MaxRAMPercentage=70 | Heap = 70% of the container memory limit (the JVM reads cgroup v1/v2). The rest goes to metaspace, thread stacks, code cache, direct buffers and GC structures. The default is only 25%, a waste for a pod running a single JVM |
| InitialRAMPercentage = Max | Not gradual heap growth; if the limit is too small, it shows up right at startup |
| UseG1GC | States the GC explicitly. The JVM picks SerialGC when the machine is not "server class" (fewer than 2 CPUs or under about 1792 MB RAM), so a 1-vCPU pod silently runs Serial |
| Xlog:gc* | Unified logging (JDK 9+), 5 rotating files × 20 MB, %p is the pid |
| HeapDumpOnOutOfMemoryError + HeapDumpPath | The only evidence for a heap OOM. The directory must be on a volume that survives restarts and has room for the heap size |
| ExitOnOutOfMemoryError | After an OOM the app state is no longer trustworthy (threads die midway, operations are left half-done). The JVM exits with code 3, the container stops and kubelet restarts it per restartPolicy. The heap dump is still written before exiting |
| StartFlightRecording | A black box with about 1% overhead, and it already has data the moment an incident happens |
| NativeMemoryTracking=summary | Can only be enabled at startup; helps when RSS is high, with a small overhead |

### Generational ZGC
- Java 21: {{-XX:+UseZGC -XX:+ZGenerational}}. From JDK 23 generational mode is the default; JDK 24 dropped the non-generational mode entirely, so remove the ZGenerational flag when you upgrade.
- Choose it when p99 latency is dominated by GC pauses and the heap is large enough; in exchange it costs more CPU and memory than G1.

### Flags I do NOT set by default
- {{-Xss256k}}: a small stack easily causes StackOverflowError with Spring/Hibernate's deep call stacks. It is also unrelated to virtual threads, because a virtual thread's stack lives on the heap.
- {{-XX:MaxGCPauseMillis}} set too small (default 200): G1 shrinks the young generation to hit the goal, so GC runs more often and throughput drops.
- {{-XX:MaxDirectMemorySize}}, {{-XX:MaxMetaspaceSize}}: direct memory defaults to max heap and metaspace is unbounded. Only set them after measuring, with the goal of making failures surface early as an OOM with a clear message instead of OOMKilled.
- A pile of flags copied from Java 8 era blogs (CMS, PermSize...): some flags only make the JVM warn and ignore them, others make it refuse to start.

### Outside the JVM
- Spring Boot: {{server.shutdown=graceful}}, actuator liveness/readiness probes. These belong in application.yml, not in JVM flags.
- Kubernetes: memory request = limit for important services; {{terminationGracePeriodSeconds}} longer than the graceful shutdown time.
- Check what the JVM really sees: {{java -XX:+PrintFlagsFinal -version}} inside the image, or {{jcmd <pid> VM.flags}} at runtime.

### Common mistakes
- **Not stating the GC on a 1-vCPU pod**: the symptom is unexpectedly long pauses and a startup log showing SerialGC. Avoid: always set {{-XX:+UseG1GC}} or ZGC.
- **No ExitOnOutOfMemoryError**: the service is "half alive", health checks are green but the scheduler has died. Avoid: exit and let the orchestrator restart it.
- **HeapDumpPath on a temporary filesystem**: the dump is lost when the container restarts. Avoid: mount a durable volume with enough space.
- **Setting both Xmx and MaxRAMPercentage**: Xmx wins, the percentage has no effect, and changing the pod limit does nothing. Avoid: use only one way.

### 1-minute spoken answer
"My baseline for Spring Boot on a container is: heap as a percentage of the memory limit, around 70%, with Initial equal to Max so a lack of RAM shows up right at startup; G1 or Generational ZGC stated explicitly because a pod with few CPUs silently runs SerialGC; GC logging with rotation; a heap dump on OOM to a durable volume; ExitOnOutOfMemoryError so the process dies outright instead of lingering half-alive; JFR in the background and NMT summary. Every flag must have a reason: either protect against OOMKilled, leave evidence, or avoid a silently broken state. The trade-off is that a larger heap leaves less room for native memory. I do not copy flags from old blogs, and I always check the startup log or jcmd VM.flags to see what the JVM actually chose."

> Senior tip: the 70% figure is not gospel. I run a load test with NMT enabled, measure RSS at peak and only then tune: services with many threads or Netty need more headroom (around 60%), a service with few threads and a large heap can go to 75-80%. And I always read the startup log to see which GC and heap size the JVM actually picked, because I have hit 1-vCPU pods silently running SerialGC many times.`,
    follow: [
      'How do ExitOnOutOfMemoryError and CrashOnOutOfMemoryError differ?',
      'A pod is OOMKilled (exit 137) while the heap is not full — how do you investigate?',
      'Why does a JVM in a 1-vCPU pod run SerialGC?'
    ]
  },
  'jvm-016': {
    q: `Reference types: Soft/Weak/Phantom, {{ReferenceQueue}}, why is a SoftReference cache a bad idea?`,
    a: `**Summary:** A strong reference keeps an object alive. A SoftReference is cleared by the GC only when memory is tight, and the JVM guarantees all soft references are cleared before throwing OutOfMemoryError. A WeakReference is cleared on the first GC that sees the object as only weakly reachable. A PhantomReference has a {{get()}} that always returns null; it is used only to learn "the object is dead" through a {{ReferenceQueue}} and to clean up off-heap resources; since JDK 9 you should use {{java.lang.ref.Cleaner}} instead of writing that yourself. Using SoftReference as a cache is a bad idea because eviction is decided by the GC based on heap pressure, not on entry size or value: the cache keeps filling the heap, then gets flushed in bulk exactly when the system is under the most pressure.

### Quick intuition
Imagine the object is a balloon and the reference is the string. **Strong** means you hold the string tightly: the balloon cannot fly away. **Soft** means the string is loosely tied to a chair: only when the room gets too crowded (heap pressure) does the cleaner cut it. **Weak** means it is only taped on: the cleaner removes it on the first pass. **Phantom** means only a photo of the balloon is left: you cannot get the balloon back, you only use it to know "the balloon has flown away" so you can clean up the accessories. Using SoftReference as a cache is like stuffing the room full of things and hoping the cleaner decides what to throw out: they throw things away in bulk exactly when the room is busiest.

### Terms
- **Strong reference**: an ordinary reference; keeps the object alive.
- **SoftReference**: the GC collects it only under memory pressure, and definitely before throwing OOM.
- **WeakReference**: the GC collects it the first time it sees the object is only weakly reachable.
- **PhantomReference**: you cannot get the object back ({{get()}} is always null); it only signals that the object is dead.
- **ReferenceQueue**: the queue the GC puts Reference objects into after their referent is collected.
- **Referent**: the object a Reference points to.
- **Cleaner**: a JDK 9+ API for registering a cleanup action that runs when an object dies.
- **W-TinyLFU**: Caffeine's eviction algorithm, which keeps frequently accessed entries.

### Lifecycle of a WeakReference with a queue (step by step)
1. Create {{new WeakReference<>(obj, queue)}}; obj still has a strong reference elsewhere so it lives normally.
2. The last strong reference is dropped; now obj is only weakly reachable.
3. The next GC notices, clears the link ({{get()}} returns null) and collects obj. Why on the first pass: a weak reference has no right to keep the object.
4. The GC puts the WeakReference object itself into the queue.
5. A cleanup thread {{poll()}}s the queue and removes the matching entry from the map — exactly what {{WeakHashMap}} does to clean itself.

~~~text
strong:  [code] ==> obj          (always alive)
soft:    [ref] --> obj          (alive until the heap is under pressure)
weak:    [ref] --> obj          (dies on the next GC if no strong ref remains)
phantom: [ref] ..x obj          (get() = null; only signals through the queue)
~~~

### Comparison
| Type | When cleared | get() | Used for |
|---|---|---|---|
| Strong | When no reference remains | object | The default |
| Soft | When the heap is under pressure; definitely before OOM | object or null | Almost never |
| Weak | The next GC when only weak refs remain | object or null | {{WeakHashMap}}, attaching metadata to an object owned by other code |
| Phantom | After the object is unreachable | always null | Cleaning up native resources |

### ReferenceQueue
When you create a reference with a queue, after the referent is collected the GC puts the **Reference object itself** (not the referent) into the queue. A cleanup thread calls {{poll()}} or {{remove()}} on the queue to delete the entry or release the resource. {{WeakHashMap}} uses exactly this mechanism to remove entries whose key has died.

### Cleaner instead of hand-written PhantomReference (JDK 9+)
~~~java
public final class NativeBuffer implements AutoCloseable {
    private static final Cleaner CLEANER = Cleaner.create();
    private final Cleaner.Cleanable cleanable;

    public NativeBuffer(long size) {
        long addr = allocate(size);
        // The action MUST NOT reference this, otherwise the object never dies
        this.cleanable = CLEANER.register(this, new Free(addr));
    }
    private record Free(long addr) implements Runnable {
        public void run() { release(addr); }   // runs when the object dies or on close()
    }
    @Override public void close() { cleanable.clean(); } // main path: explicit close
}
~~~
- {{DirectByteBuffer}} in the JDK uses this Cleaner mechanism (built on PhantomReference) to return native memory.
- Trap when writing it yourself: the PhantomReference object must be strongly held somewhere, otherwise it is itself collected and never reaches the queue. Cleaner takes care of that.
- Cleaner is only a safety net. Resources must still be closed explicitly with try-with-resources.

### Why a SoftReference cache is a bad idea
1. **No size limit**: the cache grows until the heap is tight, meaning the heap is always nearly full, GC runs more often, and the old generation is packed with cache objects.
2. **Eviction follows the GC, not value**: HotSpot keeps a soft reference based on the time since it was last accessed compared with the free heap ({{-XX:SoftRefLRUPolicyMSPerMB}}, default 1000 ms per free MB). Under heap pressure many entries are removed at once, the cache misses in bulk, and requests pile onto the DB exactly at high load.
3. **Higher GC cost**: every GC cycle has to process tens of thousands of extra Reference objects.
4. **No observability**: no hit rate, no way to know why an entry disappeared, and behaviour differs between GCs and heap configurations.

Replace it with Caffeine using {{maximumSize}} or {{maximumWeight}}, {{expireAfterWrite}}, {{recordStats()}}: predictable size, an eviction policy (W-TinyLFU) based on access frequency, and metrics.

### Common wrong answers
- "Weak references are cleared when memory is low": that is soft.
- "WeakHashMap is a good cache": it is weak on the **key**, not the value. A key that is an interned String literal is never cleared, while a freshly created key can be gone right after the next GC.
- "PhantomReference.get() returns the object so you can clean it": always null; the data you need for cleanup must be stored separately.

### Common mistakes
- **Caching with SoftReference**: the symptoms are a heap that is always nearly full, frequent GC, and a cache that is empty right at peak hour, overloading the DB. Avoid: Caffeine with {{maximumSize}} and metrics.
- **Using WeakHashMap as a cache keyed by String literals**: entries are never removed (literals are interned and always reachable). Avoid: only use WeakHashMap when keys are objects whose lifecycle is owned by other code.
- **A Cleaner action referencing this**: the object never dies and native resources leak. Avoid: make the action a static nested class/record holding only the data needed for cleanup.
- **Relying on Cleaner/finalize instead of close()**: resources are returned very late or never. Avoid: try-with-resources is the main path.

### 1-minute spoken answer
"Java has four reference strengths. Strong keeps an object alive. Soft is cleared only under heap pressure and definitely before OOM. Weak is cleared on the first GC that sees only a weak reference; it is used in WeakHashMap and to attach metadata to someone else's object. Phantom's get always returns null; it only tells you through a ReferenceQueue that the object died so you can clean native resources; since JDK 9 I use Cleaner instead of writing that myself. I avoid SoftReference caches because eviction is decided by the GC from heap pressure rather than size or value: the cache keeps the heap full and then is flushed in bulk at high load. Instead I use Caffeine with a size limit, expiry and hit-rate statistics."

> Senior tip: when I see {{SoftReference}} in cache code during review, I ask for a size-bounded Caffeine cache. One change fixes both frequent GC and the "the cache mysteriously empties itself at 9 a.m." phenomenon. Weak references keep their rightful place: attaching metadata to objects whose lifecycle is owned by other code.`,
    follow: [
      'How does WeakHashMap work and when is it safe to use?',
      'Why must a Cleaner action not reference the object it is watching?'
    ]
  },
  'jvm-017': {
    q: `Startup time: CDS/AppCDS, Spring AOT, CRaC, GraalVM native — compare them and when is each worth doing?`,
    a: `**Summary:** There are four approaches with increasing trade-offs. (1) **CDS/AppCDS** stores already-parsed classes in an archive, cutting class loading time, with almost no code changes. (2) **Spring AOT** generates bean definitions at build time to reduce reflection at startup, in exchange for configuration being "frozen" into the build. (3) **CRaC** snapshots a warmed-up JVM and restores it in tens to hundreds of milliseconds; you need a JDK with CRaC support (Azul Zulu, BellSoft Liberica) and the code must close and reopen its connections. (4) **GraalVM native image** compiles AOT into a binary: startup in milliseconds, low RAM, but closed-world, slow builds, and peak throughput usually lower than JIT. For long-running services, CDS is enough (add AOT if needed). Scale-to-zero, serverless and CLIs are where CRaC or native is worth the investment.

### Quick intuition
Starting a Spring Boot service is like opening a restaurant every morning: you set up the tables (class loading), brief the staff (bean creation), and the chef takes a while to find the rhythm (JIT warm-up). **CDS** is like keeping the tables already set from the day before. **Spring AOT** is like printing the shift schedule instead of holding a meeting every morning. **CRaC** is like photographing the restaurant while it runs smoothly and "teleporting" back to exactly that state. **Native image** is like building a fast-food stand: open and selling right away, but the menu is fixed and hard to change.

### Terms
- **CDS (Class Data Sharing)**: stores parsed classes in an archive file (.jsa) so later runs load them faster.
- **AppCDS**: CDS extended to application classes, not only JDK classes.
- **AOT cache**: the CDS upgrade in JDK 24 that stores loaded and linked classes too (and, from JDK 25, method profiles).
- **Spring AOT**: a build step that generates Java code for bean definitions instead of using reflection at runtime.
- **CRaC (Coordinated Restore at Checkpoint)**: snapshot a warmed JVM and restore it later, based on Linux CRIU.
- **Closed-world**: the native image assumption that every piece of code that can run is known at build time.
- **Reachability metadata**: files that declare reflection, proxies and resources for native image.
- **Scale-to-zero**: shutting down all instances when there is no traffic and starting them again on a request.

### The four approaches ordered by trade-off (step by step)
1. **CDS/AppCDS**: almost no code changes; cuts class load/verify time. Why do it first: cheapest and lowest risk.
2. **Spring AOT**: adds a build step; in exchange configuration is "frozen" into the build.
3. **CRaC**: requires a CRaC-enabled JDK and hooks to close/reopen resources; you get both fast startup and an already-warm JIT.
4. **Native image**: changes how you build and run entirely; fastest startup, lowest RAM, but usually lower peak throughput.

~~~text
Illustrative order of magnitude (medium Spring Boot app, real numbers depend on the app)
Plain JVM            ~ 6-8 s
+ CDS/AOT cache      ~ 4-5 s
+ Spring AOT         ~ 3-4 s
CRaC restore         ~ 0.1-0.3 s  (JIT already warm)
Native image         ~ 0.05-0.1 s (no JIT)
~~~

### Where startup time goes
Loading and verifying tens of thousands of classes; Spring scanning the classpath and creating beans via reflection; the JIT is not warm yet so code runs in the interpreter. CDS and AOT target the first two parts. Only CRaC and native image also solve warm-up.

### CDS / AppCDS
- Since JDK 12 there is a default archive for JDK classes, enabled by default. AppCDS (open to everyone since JDK 10) adds application classes to the archive.
- The simple way (JDK 13+): run once with {{-XX:ArchiveClassesAtExit=app.jsa}}, then run with {{-XX:SharedArchiveFile=app.jsa}}. Since JDK 19, {{-XX:+AutoCreateSharedArchive}} can create and recreate the archive automatically.
- Spring Boot 3.3+ supports it out of the box: extract the jar ({{java -Djarmode=tools -jar app.jar extract}}), run a training pass with {{-Dspring.context.exit=onRefresh}} so the app exits right after startup and writes the archive.
- The archive only works with the **exact** JDK and classpath used to create it; if they differ, the JVM silently ignores the archive (with only a warning). That is why it must be created during the Docker image build.
- CDS does not store JIT-compiled code. The improvement is usually a few tens of percent of startup time. JDK 24 (JEP 483) extends it into the AOT cache, storing classes already loaded and linked. JDK 25 simplifies cache creation ({{-XX:AOTCacheOutput}}, JEP 514) and stores method profiles as well (JEP 515) so the JIT has data from the start, cutting warm-up too.

### Spring AOT
- The {{process-aot}} goal of {{spring-boot-maven-plugin}} (or the equivalent Gradle plugin) generates Java code for bean definitions at build time. On the JVM, enable it with {{-Dspring.aot.enabled=true}}; with native image, AOT is mandatory.
- Trade-off: conditions such as {{@Profile}} and {{@ConditionalOnProperty}} are evaluated at build time, so you can no longer switch profiles or the bean set at runtime as before. The JVM benefit is usually moderate; its main value is as the foundation for native image.

### CRaC
- Not part of official OpenJDK. It needs a CRaC-enabled JDK, runs only on Linux and relies on CRIU.
- Procedure: run {{java -XX:CRaCCheckpointTo=/cr -jar app.jar}}, warm up, then run {{jcmd app.jar JDK.checkpoint}}. Next time start with {{java -XX:CRaCRestoreFrom=/cr}}.
- Spring Framework 6.1 / Boot 3.2 integrate it: lifecycle beans are stopped before the checkpoint and started again after restore; there is also a mode that checkpoints automatically once the context refresh finishes ({{-Dspring.context.checkpoint=onRefresh}}).
- Your own code must implement {{org.crac.Resource}} ({{beforeCheckpoint}} / {{afterRestore}}) to close sockets, files and connection pools before the snapshot and reopen them after restore.
- The snapshot contains the entire heap, including secrets and tokens, so it must be protected like sensitive data. Be careful with values generated at startup (random seeds, instance ids) because they are duplicated across every restore.
- AWS Lambda SnapStart is Lambda's own snapshot mechanism (Firecracker microVMs); it only shares the {{org.crac}} hook API — it is not running JDK CRaC.

### GraalVM Native Image
- It statically analyses from the main method and only puts reachable code into the binary (closed-world). Reflection, dynamic proxies, resources and serialization must be declared in reachability metadata. Spring AOT and the GraalVM Reachability Metadata Repository cover most of it; for less common libraries you must declare it yourself.
- Pros: startup in tens of milliseconds, low RSS, small image. Cons: builds take minutes and a lot of RAM, debugging and profiling are very different from the JVM, peak throughput is usually lower than JIT (Oracle GraalVM has PGO to narrow the gap), and there are fewer GC choices.

### When it is worth doing
| Context | Choice |
|---|---|
| Long-running service on K8s with rolling deploys | CDS is enough; invest in readiness probes and warm-up |
| Need to autoscale quickly on a spike (flash sale) | CDS plus enough min replicas; CRaC if you already control snapshots |
| Lambda, scale-to-zero | SnapStart or native image |
| CLI, short jobs, sidecars | Native image |

### Common mistakes
- **Creating the CDS archive on a dev machine and copying it into the image**: the JDK or classpath differs, the JVM ignores the archive, and nothing gets faster. Avoid: create the archive inside the Docker build step and check {{-Xlog:cds}}.
- **Enabling Spring AOT and then switching profiles at runtime**: beans are not what you expect. Avoid: build separately per configuration, or do not use AOT on the JVM.
- **A CRaC snapshot keeping old DB connections**: every query fails after restore. Avoid: implement {{org.crac.Resource}} or use Spring's lifecycle integration.
- **Moving a long-running service to native image**: throughput drops, CI builds slow down, and reflection errors appear at runtime. Avoid: only choose it when startup/RAM is truly the bottleneck.

### 1-minute spoken answer
"Startup time comes from class loading, Spring creating beans via reflection, and the JIT not being warm. CDS or AppCDS stores parsed classes in an archive, needs almost no code change and shaves a few tens of percent; from JDK 24 it becomes the AOT cache and JDK 25 stores method profiles too. Spring AOT generates bean definitions at build time but freezes profiles and conditions. CRaC snapshots a warmed JVM and restores it in a few hundred milliseconds, but it needs JDK support and hooks to close and reopen connections, and the snapshot also contains secrets. Native image starts in tens of milliseconds with low RAM, but it is closed-world and peak throughput is usually lower. For long-running K8s services I stop at CDS and good warm-up; only serverless or CLIs justify CRaC or native."

> Senior tip: before optimizing startup, ask "who is waiting for the startup?". With a K8s rolling update, a 20-second startup is usually invisible to anyone; what causes incidents is a pod receiving traffic before the JIT is warm, which spikes p99 for the first few minutes. Measure with {{BufferingApplicationStartup}} plus the actuator startup endpoint to find the slow bean: often a single bean making a network call at startup takes half the time.`,
    follow: [
      'When does an AppCDS archive get disabled, and how do you integrate it into the Docker build?',
      'What does a CRaC snapshot contain, and how do you handle connection pools and secrets on restore?',
      'What constraints does Spring AOT impose on @Profile and @ConditionalOnProperty?'
    ]
  },
  'jvm-018': {
    q: `async-profiler: CPU vs wall-clock vs alloc vs lock mode, how do you read a flame graph to find the hot path?`,
    a: `**Summary:** async-profiler is a sampling profiler for HotSpot. It captures stack traces without waiting for a safepoint, so it does not suffer from safepoint bias like classic JVMTI profilers, and it can see both native and kernel frames. Pick the mode based on the question you need answered: **cpu** — who is burning CPU; **wall** — where threads are in real time, including time spent waiting on I/O or locks (use it to find latency); **alloc** — who allocates the most (the source of GC pressure); **lock** — who waits on locks the longest. On a flame graph, width is the proportion of samples — the X axis is not time; look for wide frames, especially the "flat tops" (self time) at the top.

### Quick intuition
A sampling profiler is like someone walking through the office with a notebook **every 10 ms**, writing down what each employee is doing. After 30 seconds, whatever shows up most often in the notebook is what takes the most time. **cpu** mode only records people actually working; **wall** also records people sitting and waiting for a phone call (waiting on the DB, waiting on a lock); **alloc** records who keeps taking new paper (creating objects); **lock** records who is queuing for the key. The flame graph is the summary of that notebook: the wider the block, the more often that activity was caught.

### Terms
- **Sampling profiler**: a profiler that captures stacks periodically instead of recording every call, so overhead is low.
- **Safepoint bias**: the flaw of old profilers that only captured stacks at safepoints, so they blamed the wrong "hot" spot.
- **perf_events**: the Linux kernel mechanism for counting CPU cycles and sampling.
- **Wall-clock**: real elapsed time, including time a thread sleeps or waits.
- **TLAB**: the per-thread allocation region inside Eden; async-profiler samples allocations per TLAB.
- **Flame graph**: a chart of stacked frames where width is the proportion of samples.
- **Self time**: time spent in the method itself, excluding callees.
- **Inclusive time**: the time of a method plus every method it calls.

### From samples to a flame graph (step by step)
1. At each interval (default 10 ms for cpu), async-profiler receives a signal and captures the stack of the running thread — no need to wait for a safepoint. Why it matters: it samples where the code really runs, so it is not skewed.
2. Identical stacks are merged and counted.
3. Each frame is drawn as a block, child blocks on top of the parent; width is proportional to the sample count.
4. Read from the bottom up: find a wide branch that belongs to your own code, then look for flat tops (self time) along that branch.

~~~text
            [ writeValueAsString 40% ]      [ regex 10% ]
       [ OrderController.get ......... 55% ][ Report 15% ]
  [ DispatcherServlet ................................ 70% ]
[ Thread.run ................................................ 100% ]
   width = more samples; the flat top at 40% = optimization candidate #1
~~~

### The four modes
| Mode | How it samples | Question it answers |
|---|---|---|
| {{cpu}} | perf_events (CPU cycles); falls back to {{itimer}}/{{ctimer}} without permission | Hot methods: JSON serialization, regex, crypto |
| {{wall}} | Timer, samples every thread regardless of state | Requests that are slow because they wait on the DB, HTTP or a lock |
| {{alloc}} | Samples per TLAB (JDK 11+ via JVMTI SampledObjectAlloc) | Who generates garbage, why GC runs so often |
| {{lock}} | Contended monitors and LockSupport.park | Contention on synchronized or ReentrantLock |

### Common commands
~~~bash
asprof -d 30 -e cpu -f /tmp/cpu.html <pid>
asprof -d 30 -e wall -t -f /tmp/wall.html <pid>     # -t: split the flame graph per thread
asprof -d 30 -e alloc -f /tmp/alloc.html <pid>
asprof -d 30 -e lock -f /tmp/lock.html <pid>
# Multiple events at once: only with JFR output
asprof -d 60 -e cpu,alloc,lock -f /tmp/profile.jfr <pid>
~~~
- {{asprof}} is the launcher name from version 3.0 (it used to be {{profiler.sh}}). You can also load it as an agent at startup: {{-agentpath:/opt/ap/lib/libasyncProfiler.so=start,event=cpu,file=cpu.html}}.

### Reading the flame graph
- Each rectangle is a frame; the frame below calls the frame above. Width is the percentage of samples that contain that frame (inclusive).
- The part of a frame that is wider than the sum of its children above is **self time**: code that really consumes resources inside that method.
- The left-right order is alphabetical, not chronological. Click to zoom; the search feature highlights every matching frame and shows the total percentage.
- Colours follow the default palette (they can differ slightly between versions): green is JIT-compiled Java, teal is an inlined method, yellow is JVM C++ (GC, JIT compiler), red is native library code, orange is kernel.
- How to read it: go bottom-up, find the branch of your own code that takes most of the width, then look at the flat tops above it.

### Example scenarios
- CPU 90%: the cpu flame graph shows 40% inside {{ObjectMapper.writeValueAsString}}, called from a log line that prints the whole object at INFO level. Fix it by removing that log or logging only the id.
- p99 high but CPU only 20%: the cpu flame graph shows nothing special; wall with {{-t}} shows HTTP threads parked at {{HikariPool.getConnection}}. The pool is exhausted, not the code slow.
- Frequent GC: alloc points at {{String.format}} and boxing inside a billing loop.
- Adding threads does not increase throughput: lock points at a {{synchronized}} block around a cache.
- Note: since JDK 13 classic socket I/O goes through {{NioSocketImpl}}, so frames waiting on a socket read usually live in the {{sun.nio.ch}} package.

### On production
- Overhead is low at the default interval (cpu 10 ms), so it can run on production for sessions of tens of seconds.
- In containers perf_events is often blocked ({{perf_event_paranoid}}, seccomp): use {{-e itimer}} or {{ctimer}}, or grant the right permissions. Add {{-XX:+UnlockDiagnosticVMOptions -XX:+DebugNonSafepoints}} at startup so inlined code produces accurate stack traces.
- Compared with JFR: JFR is always running and has many event types (GC, I/O, safepoints); async-profiler is stronger when you need native/kernel frames, clear wall-clock profiling and fast flame graphs.

### Common mistakes
- **Using cpu mode to find latency**: the flame graph shows nothing special because threads are mostly waiting. Avoid: use wall with {{-t}}.
- **Reading the X axis as time**: concluding "this ran first". Avoid: remember left-to-right is only name order; only width matters.
- **A container blocking perf_events**: the command reports a permission error or returns empty results. Avoid: {{-e itimer}}/{{ctimer}} or the right permissions.
- **Optimizing from a single 5-second capture**: too few samples, too much noise. Avoid: capture 30-60 seconds under representative load and compare before/after.

### 1-minute spoken answer
"async-profiler is a sampling profiler for HotSpot; it captures stacks without a safepoint so it has no safepoint bias and can see both native and kernel frames. I pick the mode by question: cpu to find who burns CPU, wall to find where a request is waiting, alloc to find who generates garbage and makes GC frequent, lock to find who contends on locks. On a flame graph, width is the proportion of samples and the horizontal axis is not time; I go bottom-up, find the branch of my own code and then look at the flat tops, which are self time. The trade-off with JFR is that async-profiler is stronger for native frames and wall-clock, while JFR runs continuously in the background with many event types. When investigating latency I always run wall before cpu."

> Senior tip: when investigating latency I run wall with {{-t}} before cpu. A CPU profile only shows the time a thread actually runs; if 80% of a request's time is waiting for a connection pool, optimizing hot methods on the cpu flame graph only improves the small remainder. And I always capture flame graphs before and after a fix to prove the impact with numbers.`,
    follow: [
      'async-profiler vs JFR: when do you choose which?',
      'What is safepoint bias and why does it make classic profilers blame the wrong spot?',
      'A flame graph has many yellow frames (JVM C++) — how do you interpret that?'
    ]
  },
  'concurrency-021': {
    q: `What states can a Java thread have (NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED)? When do the transitions happen, and what can you infer from the state when reading a thread dump?`,
    a: `**Summary:** {{Thread.State}} has 6 values: NEW (created, not started), RUNNABLE (running or ready to run, including waiting on I/O at the OS level), BLOCKED (waiting to enter a {{synchronized}} monitor), WAITING (waiting without a time limit: {{wait()}}, {{join()}}, {{LockSupport.park()}}), TIMED_WAITING (waiting with a time limit: {{sleep}}, {{wait(ms)}}, {{parkNanos}}), TERMINATED (run has finished). What interviewers like to probe: Java has no separate "RUNNING" state; a thread reading a socket is still RUNNABLE; a thread waiting on a {{ReentrantLock}} is WAITING, not BLOCKED.

### Quick intuition
Think of a thread as an employee in an office. NEW: the contract is signed but they have not shown up yet. RUNNABLE: at their desk — maybe typing, maybe waiting for the printer (Java does not distinguish). BLOCKED: queueing outside the meeting room while someone else is using it ({{synchronized}}). WAITING: sitting and waiting until someone calls their name, with no timer. TIMED_WAITING: setting an alarm "wait at most 5 minutes". TERMINATED: they have left the company and cannot be called back. Reading a thread dump is like looking at a photo of the whole office: 180 people standing at the same door tells you where the bottleneck is.

### Terms
- **Thread.State**: an enum of 6 values describing a thread's state from the JVM's point of view.
- **Monitor**: the lock attached to an object, used by synchronized; waiting for the monitor is BLOCKED.
- **Parking**: the {{LockSupport.park()}} mechanism that puts a thread to sleep; the foundation of ReentrantLock, BlockingQueue, Future.get.
- **Thread dump**: a snapshot of the state and stack of every thread ({{jstack}}, {{jcmd Thread.print}}).
- **nid (native id)**: the thread id at the operating-system level, used to match with {{top -H}}.
- **Carrier thread**: the platform thread currently running a virtual thread.
- **IllegalThreadStateException**: the error when calling start() a second time on the same Thread.

### State transition diagram
~~~text
          start()                      run() returns or throws an exception
  NEW  ----------->  RUNNABLE  ----------------------------------------->  TERMINATED
                      |    ^
   enter synchronized |    |  acquire the monitor
   while it is held   v    |
                     BLOCKED

  RUNNABLE  -- wait() / join() / park() ------------->  WAITING
  RUNNABLE  -- sleep(ms) / wait(ms) / parkNanos() --->  TIMED_WAITING
  WAITING, TIMED_WAITING -- notify, unpark, timeout, interrupt -->  RUNNABLE
       (for wait() only: it must re-acquire the monitor, so it goes through BLOCKED first)
~~~

### Each state
| State | Entered when | Left when |
|---|---|---|
| NEW | {{new Thread(r)}} | {{start()}} |
| RUNNABLE | After start, or after waiting ends | The OS may be running it or not; the JVM does not distinguish |
| BLOCKED | Entering a synchronized block/method whose monitor is held; or waking from {{wait()}} and waiting to re-acquire the monitor | It acquires the monitor |
| WAITING | {{Object.wait()}}, {{Thread.join()}}, {{LockSupport.park()}} (the base of ReentrantLock, BlockingQueue, Future.get) | notify/notifyAll, the other thread terminates, unpark, interrupt |
| TIMED_WAITING | {{Thread.sleep(ms)}}, {{wait(ms)}}, {{join(ms)}}, {{parkNanos}}, {{poll(timeout, unit)}} | The timeout expires, or the same causes as WAITING |
| TERMINATED | run() returns or throws an exception | It cannot leave: calling start() again throws {{IllegalThreadStateException}} |

### Predict the output
~~~java
public static void main(String[] args) throws InterruptedException {
    Thread t = new Thread(() -> {
        try { Thread.sleep(500); } catch (InterruptedException e) { }
    });
    System.out.println(t.getState());   // NEW
    t.start();
    Thread.sleep(100);                  // give t time to reach sleep(500)
    System.out.println(t.getState());   // TIMED_WAITING
    t.join();
    System.out.println(t.getState());   // TERMINATED
}
~~~

### Reading a thread dump
- Many threads **BLOCKED** on the same "waiting to lock <0x...>": contention on one monitor (or a deadlock if the threads wait on each other in a cycle).
- Many threads **WAITING (parking)** at {{HikariPool.getConnection}}: HTTP threads are waiting for a connection, the pool is exhausted. A worker WAITING at {{LinkedBlockingQueue.take}} is an idle worker, which is completely normal.
- A thread **RUNNABLE** at {{socketRead}} or {{NioSocketImpl.read}}: it is waiting on the network but still shows RUNNABLE; do not conclude that it is burning CPU. To find out which threads burn CPU, match {{top -H}} with the nid in the dump (older JDKs such as 8 and 11 print nid in hex, newer ones in decimal; check the format before comparing).
- Capture 3 dumps a few seconds apart: only a thread that stays in the same place across all 3 is a suspect.

### Common wrong answers
- "There are RUNNING and READY states": those are OS states; Java merges both into RUNNABLE.
- "A thread waiting on ReentrantLock is BLOCKED": wrong, it is WAITING (parking), because Lock uses {{LockSupport.park}}. BLOCKED is only for the synchronized monitor.
- "sleep makes a thread BLOCKED": wrong, it is TIMED_WAITING.

### Virtual threads (Java 21)
{{getState()}} still returns these 6 states. When a virtual thread waits on I/O or a lock it is unmounted from its carrier and sits in WAITING/TIMED_WAITING without occupying a platform thread. A normal thread dump often does not list every virtual thread; use {{jcmd <pid> Thread.dump_to_file -format=json <file>}}.

### Common mistakes
- **Seeing many RUNNABLE threads and concluding "the code burns CPU"**: they are actually waiting on sockets. Avoid: measure CPU with {{top -H}} or async-profiler; a dump only tells you where a thread is standing.
- **Ignoring WAITING threads at getConnection**: the symptom is mass API timeouts while CPU is low. Avoid: recognise the exhausted connection pool, check Hikari metrics (pending, active) and find where connections are held too long.
- **Capturing only one dump**: you cannot tell a stuck thread from one passing by. Avoid: capture 3 dumps a few seconds apart.
- **Calling start() a second time to "restart" a thread**: throws IllegalThreadStateException. Avoid: create a new Thread or submit again to the executor.

### 1-minute spoken answer
"A Java thread has six states: NEW right after creation; RUNNABLE after start, which covers running, waiting for CPU and waiting on I/O at the OS level; BLOCKED while waiting to enter a synchronized monitor; WAITING when waiting without a time limit such as wait, join or park; TIMED_WAITING when there is a time limit such as sleep or a timed wait; and TERMINATED when run finishes. The gotchas interviewers probe: a thread waiting on ReentrantLock is WAITING, not BLOCKED, and a thread reading a socket is still RUNNABLE. When reading a dump I capture three snapshots and group threads by identical stacks: many BLOCKED threads on one lock means contention, many WAITING threads at getConnection means the connection pool is exhausted, and CPU must be measured with top -H or a profiler."

> Senior tip: when reading a dump I do not count states, I group threads by **identical stack traces**. 180 HTTP threads all standing at one {{getConnection}} line tell a clearer story than any chart. And remember that RUNNABLE in a dump does not mean the thread is using CPU: CPU must be measured with {{top -H}} or a profiler.`,
    follow: [
      'What state does a thread that has just been notify()d move to before it runs again?',
      'Why does a thread reading a socket show as RUNNABLE, and does it burn CPU?'
    ]
  },
  'concurrency-022': {
    q: `Which ways are there to run code on another thread: {{Thread}}, {{Runnable}}, {{Callable}}, {{ExecutorService}}, virtual thread? Why is calling {{run()}} instead of {{start()}} a bug, and which do you choose in a real service?`,
    a: `**Summary:** Thread is the "worker", while Runnable and Callable are the "task". Runnable returns no result and cannot throw a checked exception; Callable returns a value and can throw exceptions, and you get the result through a {{Future}}. In real code almost nobody calls {{new Thread()}}: tasks are submitted to a bounded {{ExecutorService}} (threads with names, limits and shutdown), or with Java 21 you use virtual threads for I/O-bound work. {{start()}} is what creates a new thread and calls run() on it; calling {{run()}} directly is just an ordinary method call on the current thread. There is no compile error and no exception — you only silently lose concurrency.

### Quick intuition
Separate two ideas: the **task** and the **worker**. Runnable is a slip of paper describing work ("clean the warehouse"); Callable is a slip with a request to report the result ("count the stock and report the number"). Thread is the worker. ExecutorService is a staffing agency with a ready team: you hand over the slip, they assign a worker, and they give you an appointment ticket (Future) to collect the result. Virtual threads are a huge, very cheap pool of freelancers, well suited to work that is mostly sitting and waiting. Calling {{run()}} instead of {{start()}} is like taking the work slip and **doing it yourself right there** — the job still gets done, but nobody is working in parallel.

### Terms
- **Runnable**: an interface with a {{run()}} method; returns no result and cannot throw checked exceptions.
- **Callable**: an interface with a {{call()}} method; returns a result and can throw exceptions.
- **Future**: a handle to a result that will exist in the future; {{get()}} waits for it.
- **ExecutionException**: the wrapper around an exception thrown by a task, received when calling {{Future.get()}}.
- **ExecutorService**: a service that manages a group of threads and a task queue.
- **Platform thread**: a Java thread mapped 1-1 to an OS thread.
- **Virtual thread**: a lightweight thread managed by the JVM (Java 21+), suited to I/O-bound tasks.
- **@Async**: a Spring annotation that runs a method on another executor.

### The start() flow (step by step)
~~~text
main: t.start()
  1. The JVM checks the state is NEW (otherwise it throws IllegalThreadStateException)
  2. It calls a native method that creates a new OS thread with its own stack
  3. The thread goes NEW -> RUNNABLE, and start() returns to main immediately
  4. The new thread calls run() -> runs the lambda
main keeps running in parallel       |      the worker runs run()

main: t.run()   -> just a method call: run() executes on main itself, the next line waits
~~~

### The options
~~~java
// 1. Extending Thread: avoid it (mixes "the task" with "the worker", and uses your one extends slot)
class Worker extends Thread { public void run() { work(); } }
new Worker().start();

// 2. Runnable: a task with no result
Thread t = new Thread(() -> work(), "report-1");
t.start();

// 3. Callable + ExecutorService: has a result and can throw exceptions
ExecutorService pool = Executors.newFixedThreadPool(4);  // demo; production uses a bounded ThreadPoolExecutor
Future<Integer> f = pool.submit(() -> countRows());      // Callable<Integer>
Integer rows = f.get(2, TimeUnit.SECONDS);               // an exception in the task -> ExecutionException

// 4. Java 21: virtual threads
Thread.ofVirtual().name("vt-", 0).start(() -> callApi());
try (var exec = Executors.newVirtualThreadPerTaskExecutor()) {
    exec.submit(() -> callApi());
}   // close() waits for the tasks to finish
~~~

| Option | Result | Checked exceptions | Who manages the lifecycle | Use when |
|---|---|---|---|---|
| extends Thread | None | No | You do | Almost never |
| Runnable + new Thread | None | No | You do | A special background thread that lives for the whole app |
| Callable + ExecutorService | Future | Yes | The pool | The default for parallel tasks |
| CompletableFuture + executor | A chain of async steps | Wrapped in CompletionException | The pool | Composing several calls |
| Virtual thread | Same as above | Same as above | The JVM, very cheap | Very many I/O-bound tasks (Java 21+) |

### start() vs run()
~~~java
Thread t = new Thread(() -> System.out.println(Thread.currentThread().getName()), "worker");
t.run();    // prints "main": runs right on the calling thread, like a normal method call
t.start();  // prints "worker": the JVM creates a new thread and calls run() on it
t.start();  // throws IllegalThreadStateException: each Thread can only be started once
~~~
- What {{start()}} does: calls a native method that creates an OS thread (its own stack, about 1 MB reserved by default on Linux x64), registers it with the JVM, moves the state from NEW to RUNNABLE, and the new thread calls run(). start() returns immediately without waiting.
- Why calling run() is a dangerous bug: everything still "works", unit tests still pass, only the processing time becomes N times longer. This bug usually only shows up in a load test.

### Why not new Thread() in a service
- Each platform thread costs stack memory and creation/destruction overhead. A spike of 5,000 requests becoming 5,000 threads can exhaust RAM or hit the OS thread limit ("unable to create native thread").
- No limit, no names, no shutdown point; exceptions fall into the default UncaughtExceptionHandler and are only printed to stderr.
- In Spring: use {{ThreadPoolTaskExecutor}} or {{@Async}} with a self-configured executor, or enable {{spring.threads.virtual.enabled=true}} (Boot 3.2+, Java 21).

### Common wrong answers
- "There are two ways to create a thread: extends Thread and implements Runnable": not wrong, but incomplete. A senior interviewer expects ExecutorService, Callable/Future and virtual threads.
- "Callable runs on a new thread": Callable is only a task; where it runs is decided by the executor.
- "An exception in a task submitted with submit() gets logged": no, it sits silently in the Future until someone calls get().

### Common mistakes
- **Calling run() instead of start()**: the symptom is "parallel" code whose total time equals the sum of the tasks, with logs showing the main/http-nio thread name. Avoid: use an executor instead of managing Thread yourself; review every {{.run()}} call on a Thread object.
- **new Thread() per request**: the symptom is the thread count exploding during spikes and "unable to create native thread". Avoid: a shared bounded executor, or virtual threads with a resource limit behind them.
- **submit() without ever calling get()**: the task's exception disappears. Avoid: try/catch + log inside the task, or use execute() so the exception reaches the UncaughtExceptionHandler.
- **Future.get() without a timeout**: the calling thread hangs forever when the task hangs. Avoid: {{get(timeout, unit)}}.

### 1-minute spoken answer
"Thread is the worker and Runnable and Callable are the task: Runnable returns no result, Callable returns a result and can throw exceptions, collected through a Future. start() is what creates a new OS thread and calls run on it; calling run() directly is just a method call on the current thread — no error, but concurrency is lost, which is why this bug usually only surfaces in load tests. In a real service I do not create Threads, I submit to a bounded ExecutorService with named threads and shutdown; with Java 21 and I/O-bound work I use virtual threads, but I still limit the resources behind them with a semaphore or connection pool. With Spring I use ThreadPoolTaskExecutor or enable spring.threads.virtual.enabled."

> Senior tip: my rule is one clearly named executor per kind of work ({{payment-io-}}, {{report-cpu-}}) so a glance at a thread dump tells me which pool is congested. With Java 21 and mostly I/O-bound tasks, virtual threads remove most of the pool-sizing work; but you still must limit the resources behind them (connection pools, partner rate limits) with a Semaphore, because virtual threads limit nothing themselves.`,
    follow: [
      'How do execute() and submit() differ when a task throws an exception?',
      'When do virtual threads not help, or even make things worse?'
    ]
  },
  'concurrency-023': {
    q: `Compare {{Thread.sleep}}, {{Object.wait}}, {{Thread.join}} and {{Thread.yield}}: which one releases the lock, which one must be called inside {{synchronized}}, and what bug does using the wrong one cause?`,
    a: `**Summary:** Only {{wait()}} releases a monitor, and only the monitor of the object it is called on. That is why it must be called while holding that monitor; otherwise it throws {{IllegalMonitorStateException}}. {{sleep()}} keeps every lock and only pauses the current thread. {{join()}} waits for another thread to terminate; for platform threads it is implemented with {{wait()}} on the Thread object itself, so it only "releases" the monitor of that Thread object and keeps every other lock. {{yield()}} is only a hint to the scheduler: it releases no lock and guarantees nothing.

### Quick intuition
Imagine you are holding the key to the meeting room. {{sleep()}} is falling asleep inside the room while still holding the key: nobody can get in. {{wait()}} is stepping out to the waiting chairs and **handing back the key to that exact room** so others can work, and whoever finishes calls you. {{join()}} is standing around waiting for a colleague to finish their work — whatever keys you are holding, you keep holding. {{yield()}} is saying "whoever needs the computer can go first" — a polite offer that others may simply ignore.

### Terms
- **Monitor**: the lock attached to every object, used by synchronized, wait and notify.
- **IllegalMonitorStateException**: the error when calling wait/notify without holding that object's monitor.
- **Lost wakeup**: the notify arrives before the thread starts waiting, so the thread sleeps forever.
- **Spurious wakeup**: a thread wakes up on its own without anyone calling notify.
- **Scheduler**: the part of the OS that decides which thread runs on the CPU.
- **Thread.onSpinWait()**: a hint to the CPU that the thread is busy-waiting (spinning), letting the CPU optimise (Java 9+).
- **Awaitility**: a test library that waits for a condition to happen instead of sleeping a fixed time.

### Who holds the lock while waiting
~~~text
Thread A holds locks L1 and L2:
  Thread.sleep(1000)  -> still holds L1, L2 (any thread needing L1/L2 is BLOCKED)
  L2.wait()           -> releases L2, STILL holds L1  (watch out for deadlock)
  other.join()        -> still holds L1, L2
  Thread.yield()      -> still holds L1, L2, and may continue immediately
~~~

| | Belongs to | Releases the lock? | Must hold the monitor? | Wakes up when | State |
|---|---|---|---|---|---|
| sleep(ms) | static on Thread | No | No | timeout expires, interrupt | TIMED_WAITING |
| wait() | Object | Releases that object's monitor | Mandatory | notify/notifyAll, interrupt, timeout, spurious | WAITING / TIMED_WAITING |
| join() | Thread instance | No (except the monitor of that Thread object) | No | the other thread terminates, interrupt, timeout | WAITING / TIMED_WAITING |
| yield() | static on Thread | No | No | almost immediately | RUNNABLE |

### Why wait() must be inside synchronized
wait() is used to wait for a **condition on shared state**. Checking the condition and going to sleep must be one atomic step. Without holding the lock, the producer could add an element and call notify **between** the consumer checking "queue is empty" and the consumer calling wait. The signal is lost and the consumer sleeps forever (lost wakeup). The JVM forces you to hold the monitor so there is no such gap, and wait() releases the monitor so the producer can get in and change the state.

### Classic bug: sleep inside synchronized
~~~java
synchronized (account) {
    account.debit(amount);
    Thread.sleep(2000);      // "waiting for the core banking system": holds the lock for 2 seconds!
    account.audit();
}
// Every other thread that needs account is BLOCKED for 2 seconds:
// that account can handle only about 0.5 transactions per second
~~~
Calling HTTP or the DB while holding a lock has the same consequence. Rule: do not do blocking work inside a critical section.

### join
~~~java
Thread t1 = new Thread(() -> loadCustomers());
Thread t2 = new Thread(() -> loadAccounts());
t1.start(); t2.start();
t1.join();                   // main waits for t1 to finish
t2.join(5_000);              // waits at most 5 seconds; a timeout does NOT throw
if (t2.isAlive()) log.warn("loadAccounts is overdue");   // you must check yourself
~~~
- When a thread finishes, the JVM calls {{notifyAll()}} on the Thread object to wake threads joining on it. That is why the javadoc advises against wait/notify on Thread instances.
- New code should use {{Future.get(timeout, unit)}}, {{CompletableFuture.allOf}} or {{CountDownLatch}} instead of join.

### yield
It is only a hint "I am willing to give up the CPU"; the scheduler may ignore it. Do not use it for synchronization or to force tests to run "in the right order". For spin loops in low-level code the right API is {{Thread.onSpinWait()}} (Java 9+).

### Predict the result
~~~java
Object lock = new Object();
synchronized (lock) {
    lock.notify();           // no one is waiting: the notify is ignored, no exception
}
lock.wait();                 // throws IllegalMonitorStateException: not holding lock's monitor
~~~

### Common wrong answers
- "sleep releases the lock so other threads can run": wrong, sleep keeps every lock.
- "wait releases all locks the thread holds": wrong, it only releases the monitor of the object wait was called on. Holding lock A and calling {{b.wait()}} keeps A, and that is a source of deadlock.
- "notify() makes the woken thread run immediately": no, that thread must re-acquire the monitor (BLOCKED) after the notifying side leaves synchronized.

### Common mistakes
- **sleep() or API/DB calls inside synchronized**: the symptom is a thread dump full of BLOCKED threads on the same lock and throughput dropping to a few requests per second. Avoid: hold the lock only for short in-memory work; keep I/O outside.
- **Calling wait() without holding the monitor**: throws IllegalMonitorStateException immediately. Avoid: wait/notify always inside {{synchronized (same object)}}.
- **join(timeout) and assuming the other thread finished**: a join timeout throws nothing, and the code continues with data that is not ready. Avoid: check {{isAlive()}}, or use {{Future.get(timeout)}}, which throws TimeoutException.
- **Using sleep/yield in tests to "wait for the other thread"**: flaky, slow tests. Avoid: CountDownLatch or Awaitility.

### 1-minute spoken answer
"Of these four methods only wait releases a lock, and only the monitor of the exact object wait is called on, so it must be called while holding that monitor or it throws IllegalMonitorStateException. The reason is that checking the condition and going to sleep must be atomic so no signal is lost. sleep only pauses the thread and keeps every lock, so sleep inside synchronized is the classic bug that leaves every other thread BLOCKED. join waits for another thread to finish; internally it waits on the Thread object, so it only releases that Thread object's monitor. yield is only a hint to the scheduler. In new code I replace join with Future or CountDownLatch, and I never use sleep for synchronization."

> Senior tip: during review I treat {{Thread.sleep}} in production code (except bounded backoff on retries) as a sign the design needs another look. Waiting for a condition should use a signalling mechanism (latch, future, queue); waiting for a duration should use ScheduledExecutorService. In tests, replace sleep with Awaitility so tests are both faster and not flaky.`,
    follow: [
      'What is a lost wakeup, and why does holding the monitor while calling wait() prevent it?',
      'How does Thread.onSpinWait() differ from yield()?'
    ]
  }
});
