/*
 * English translation of js/data/q-concurrency-jvm.js — task T169. Format: js/core/i18n.js (content overlay).
 * ids: jvm-002 jvm-003 jvm-004 jvm-005 jvm-006 jvm-007 jvm-008 jvm-009 jvm-010 jvm-011 jvm-012 jvm-013
 */
App.i18n.content({
  'jvm-002': {
    q: 'Compare GC algorithms: Serial, Parallel, G1, ZGC, Shenandoah — mechanisms and selection criteria; how does G1 operate (region, mixed GC)?',
    a: `**Summary:** Serial and Parallel are stop-the-world; choose by throughput vs small RAM; G1 (default since Java 9) is region-based, incremental, balancing latency; ZGC (including Generational) and Shenandoah are concurrent with pauses under 1 ms for large heaps. Choose by goal: throughput → Parallel; balanced → G1; latency p99 low + large heap → ZGC.

### Comparison table

| GC | Mechanism | Fits heap | Goal |
|---|---|---|---|
| Serial | Full STW, 1 thread | Small (<100 MB) | Simple/CLI apps |
| Parallel | STW, parallel threads | Medium to large | Maximum throughput |
| G1 | Short STW phases | Medium–large (4–32 GB) | Balanced latency |
| ZGC | Concurrent, very short STW | Large to TB | Pause < 1 ms |
| Shenandoah | Concurrent | Large | Low pause |

### How G1 works
- Heap split into regions (1–32 MB); each region tagged Eden / Survivor / Old / Humongous (object ≥ half region).
- Young GC: pure Eden/Survivor regions, STW parallel — fast because few regions.
- Concurrent marking calculates per-region liveness (SATB), then old/mixed GC selects regions with low liveness (most garbage, garbage-first) to clean — this is "mixed GC".
- IHOP (InitiatingHeapOccupancyPercent, default 45): when old occupies that fraction of heap, concurrent marking starts.

~~~bash
java -XX:+UseG1GC -XX:MaxGCPauseMillis=50 -Xlog:gc* ...   # Java 9+
# G1 adjusts region count each GC to meet pause target
# MaxGCPauseMillis is a guiding target, not a hard guarantee
~~~

### ZGC / Shenandoah
- ZGC: colored pointers + load/store barrier; most stages run concurrent with no STW; Java 21 has Generational ZGC (-XX:+ZGenerational) — separates young/old, much better throughput than old ZGC; JDK 23 makes it default, JDK 24 removes non-generational ZGC (ZGenerational flag deprecated).
- Shenandoah: forwarding pointer + concurrent compaction; very low pause.
- Common cost: concurrent CPU overhead (competes with app cores), some barrier cost.

### When to choose
- **Parallel**: batch job, throughput priority, pauses of a few hundred ms acceptable.
- **G1**: default for most web/apps with medium to large heaps.
- **ZGC**: latency-sensitive service (p99 < 10 ms), heap 4 GB to TB, Java 21+.
- **Serial**: small container (~512 MB), few cores.

> Senior tip: jumping to ZGC just because of "low pause" is not always right: ZGC has concurrent CPU overhead and throughput may drop versus G1 on the same heap; measure p99 and throughput over 24h for both before deciding — latency and throughput are a trade-off, choose based on data.`,
    follow: ["How does G1 mixed GC select regions?", "How does Generational ZGC differ from non-generational ZGC?"],
  },
  'jvm-003': {
    q: 'Tuning JVM heap for containers (Kubernetes): why should you not set Xmx equal to the pod RAM limit? How does {{-XX:MaxRAMPercentage}} work?',
    a: `**Summary:** JVM RSS = heap + metaspace + stack per thread + code cache + direct memory + other native. Setting Xmx = RAM limit takes all space for heap, leaving no room for native — container gets OOMKilled (exit 137) even though heap hasn’t OOMed. {{-XX:MaxRAMPercentage}} (default 25%) sets heap as % of RAM limit; rest is for native; in practice 50–75% depending on profile.

### Why Xmx = RAM limit is a trap

~~~text
RAM limit 2 GB, Xmx = 2 GB
heap used 1.7 GB (not heap OOM)
RSS = heap 1.7 GB + metaspace 150 MB
     + thread stacks + code cache + direct buffers
     => ~2.1 GB > limit => kernel OOMKill pod (exit 137)
~~~

OOMKilled is different from OOM "Java heap space": no exception in JVM log, only kube event "OOMKilled". HeapDumpOnOutOfMemoryError is useless for native OOM.

### MaxRAMPercentage
- Java 10+ enables {{UseContainerSupport}} by default: JVM reads cgroup limit and computes heap by %.
- Default 25% is conservative for heavy services; practice: 50–75%, remembering heap % + predicted native < 100%.
- {{-XX:MaxDirectMemorySize}} caps direct buffer; {{-XX:MaxMetaspaceSize}} caps metaspace — the two native items that usually "eat reserve" must have caps.
- {{-Xss256k}} if you have thousands of threads — saves GB of native reserve for stacks.

### Pitfall production
- Repeated kube event OOMKilled is the first sign; don’t just read JVM log.
- Heap below limit does not mean safe: RSS still grows with native; alert on RSS (host metrics), not just heap.
- 65% heap is often a safe level for Spring Boot/Netty which consume significant native memory.

> Senior tip: in my team template: heap 65%, native 35% inside the pod — no OOMKilled in 2 years. Raise heap in steps 50 → 60 → 65% after measuring real RSS; never jump to 75% at the start.`,
    follow: ["How is OOMKilled (exit 137) different from Java heap space OOM?", "With a 1 GB RAM pod, what is 25% MaxRAMPercentage in MB heap?"],
  },
  'jvm-004': {
    q: 'Types of OutOfMemoryError and how to diagnose each (heap dump, MAT)?',
    a: `**Summary:** Common OOME types: {{Java heap space}}, {{GC overhead limit exceeded}}, {{Metaspace}}, {{unable to create native thread}}, {{Direct buffer memory}}. Each requires different tools: heap dump + MAT for heap; NMT for native; count threads + ulimit for native threads. Enabling HeapDumpOnOutOfMemoryError from startup is mandatory.

### Summary table

| Error | Meaning | Tool |
|---|---|---|
| Java heap space | Out of object allocation space | heap dump → MAT (Leak Suspects, Dominator Tree) |
| GC overhead limit exceeded | GC ~98% of time, freeing < 2% heap | GC log + heap dump |
| Metaspace | Metadata class exceeds MaxMetaspaceSize | dump + classloader count; increasing with redeploy = classloader leak |
| Unable to create native thread | OS refuses to create thread (ulimit, cgroup pids) | jstack count threads; ulimit -u; cgroup pids |
| Direct buffer memory | allocateDirect exceeds MaxDirectMemorySize | NMT; check Netty pool; increase/tune cap |

### Working with MAT
~~~bash
java -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/dumps ...
jmap -dump:live,format=b,file=heap.hprof <pid>   # active dump
~~~

- **Leak Suspects**: automatic suspect report — start here.
- **Dominator Tree**: object holding the most heap; Path to GC Roots shows which chain keeps it.
- Retained size differs from shallow size: follow retained to find the real root.

### Pitfall
- Heap OOM but dump shows no large objects: heap fragmentation — need a large contiguous block (stream file, large buffer); check GC log.
- "Unable to create native thread" usually from unbounded thread creation (newCachedThreadPool) — trace which executor creates unlimited threads.
- On "Direct buffer": reduce Netty direct pool or increase MaxDirectMemorySize based on NMT measure.

> Senior tip: enable HeapDumpOnOutOfMemoryError at boot with a Path with enough disk; the dump may stop the JVM for a few seconds, but it is the only trustworthy dump because it captures the exact OOM state — a dump after restart has no investigation value.`,
    follow: ["Heap OOM but dump shows no large object — next step?", "Why does JVM have a separate message \\\"GC overhead limit exceeded\\\"?"],
  },
  'jvm-005': {
    q: 'Memory leak in Java: common real-world examples and how to find them (heap dump, MAT)?',
    a: `**Summary:** Java with GC does not mean no leak: leak = objects no longer used but still referenced from GC Roots. Common forms: static cache without eviction, unregistered listeners, ThreadLocal in pools, classloader leak on redeploy, mutable key in HashMap. Standard process: watch heap trend, take 2 dumps spaced apart, MAT Dominator Tree + Path to GC Roots.

### Common real-world forms
- **Static unbounded cache**: static Map put continuously, no TTL/LRU — old gen grows steadily. Fix: Caffeine with maximumSize + expireAfter.
- **Listener not unregistered**: registered to EventBus/cache but not removed when service closes — each restart adds another layer.
- **ThreadLocal in pool**: set without remove — context (user/MDC) lives forever in the thread.
- **ClassLoader leak (Tomcat redeploy)**: JDBC driver registered in app 1 not deregistered; ThreadLocal value references webapp ⇒ WebappClassLoader not freed after redeploy.
- **Mutable key in HashMap**: key mutated after put ⇒ entry not found again (logic leak).
- **Unclosed resource**: Connection/InputStream in exception path not finally-closed — pool drains, sockets stuck in CLOSE_WAIT.

### Finding process
1. **Watch heap trend**: old gen after full GC steadily increases to OOM after hours/days — slow leak; rapid swings are just bursts.
2. **Heap dump twice** 30 min to 1 hour apart; diff class histogram (MAT Compare or jmap -histo) — class growing steadily is suspect.
3. **MAT Dominator Tree**: object with largest retained heap — 90% caught as static Map, cache, ThreadLocal map, classloader.
4. **Path to GC Roots** (exclude weak/soft): find the chain holding the object; identify which code holds it.

~~~bash
jmap -dump:live,format=b,file=dump-1.hprof <pid>
jmap -histo <pid> | head -30
~~~

> Senior tip: set up a trend alarm (compare heap after full GC between two points 1 hour apart) to catch leaks much earlier than fixed-threshold alerts; the "Largest Objects" column in MAT is where I always start when investigating a dump.`,
    follow: ["What does excluding weak/soft references in Path to GC Roots mean, and why?", "What are the risks of taking a heap dump in production (pause, disk)?"],
  },
  'jvm-006': {
    q: 'CPU 100% in production: what is your investigation procedure (top -H, jstack, async-profiler, JFR)?',
    a: `**Summary:** find the thread burning CPU: top -H -p PID gets hottest thread id → grep nid in jstack (JDK 18+ prints nid decimal; JDK 8–17 must convert to hex first), read first frame (hot method). For deeper analysis use async-profiler/flame graph or JFR. Must answer: burning CPU from business code, JIT compiler, GC thread, or native (TLS/deflate).

### Standard procedure
1. Identify the process using most CPU (top/htop).
2. Get the hottest thread of that process:

~~~bash
top -H -p <pid>                          # threads, see %CPU; assume hottest TID is 4321
jstack <pid> | grep -A 12 "nid=4321"     # JDK 18+: nid decimal (with [4321] after #N)
printf %x 4321                           # JDK 8–17: nid is hex → 10e1
jstack <pid> | grep -A 12 "nid=0x10e1"
~~~

The first RUNNABLE frame usually points to the method burning CPU.

3. Classify cause: GC thread (check jstat -gc and GC log), JIT compiler thread (-Xlog:jit + PrintCompilation), business code, native.
4. Flame graph when stack is not enough:

~~~bash
./profiler.sh -d 30 -e cpu -f flame.html <pid>   # async-profiler 3.x: asprof
# widest frame (most samples) = place burning most CPU
# includes native and kernel frames by default
~~~

5. JFR always on for sensitive prod services: jcmd <pid> JFR.start duration=60s filename=cpu.jfr; analyze with JDK Mission Control (hotspot view, allocation call tree).

### Common causes
- GC thread hot → many full GCs: move to heap tuning, not code fix.
- JIT compiler thread hot: hot path churn (lambda, polymorphic megamorphism).
- Busy-wait in code: spin-loop wait, poll 0 ms, retry loop without backoff.
- Native: TLS handshake, compress/deflate, bitmap — jstack does not show native frame; async-profiler catches it (shows native frame by default).

> Senior tip: I start with async-profiler (sampler-based, no STW — safe in prod) before drilling jstack; if CPU is 100% and GC and JIT are safe, 90% is busy-wait — find the while loop missing sleep in code review.`,
    follow: ["CPU 100% but hot thread is in native — how to identify?", "How does async-profiler differ from JFR, which to choose?"],
  },
  'jvm-007': {
    q: 'Class loading: how does the parent delegation model work and why? Where does ClassLoader leak happen on webapp redeploy?',
    a: `**Summary:** parent delegation: class loader asks parent first (bootstrap → platform → application) to load; only if not found does it load itself. Purpose: java.* loaded once and prevents outside code from spoofing system classes. ClassLoader leak: webapp class held by static/ThreadLocal/underegistered driver reference ⇒ WebappClassLoader not GCed, metaspace grows with each redeploy.

### Parent delegation
- Order: Bootstrap (java.base, java.*) → Platform (JDK modules) → Application (classpath) → WebAppClassLoader per webapp (Tomcat — this loader reverses order: looks in WEB-INF first, except java.* / JDK classes).

~~~text
loadClass(name):
  1. ask parent.loadClass(name); if parent finds it => use parent\'s
  2. parent not found => self findClass(name)
~~~

- Why: security (app cannot inject false java.lang.String) and consistency (one java.base copy used across JVM).
- JVM determines "same class" by (class name, classloader id) so a class can be loaded multiple times if the app server does not reuse.
- Java 9 module rewrites loader but keeps delegation logic.

### ClassLoader leak on redeploy
1. JDBC driver registered in DriverManager (static) without deregister on undeploy.
2. ThreadLocal value lives in Tomcat thread pool, referencing webapp class.
3. Static field/singleton of webapp holds classloader.

~~~text
WebappClassLoader caught by static field -> class of webapp
=> Metaspace grows with each redeploy
=> multiple redeploys hit OOM Metaspace
Tomcat usually logs: "The web application [app] appears to have started a thread named ..."
~~~

Standard fix:
- Register lifecycle: Spring context close, JDBC driver deregister, ThreadLocal clear in ServletContextListener.
- Tomcat has built-in "leak prevention": catches many common sources; still must watch log "appears to have started a thread" on redeploy.
- Avoid mutable static in webapp; caches should use container lifecycle contract.

> Senior tip: comparing jcmd <pid> GC.class_histogram before and after redeploy is early sign of loader leak: webapp class count increases after each redeploy — detect before OOM Metaspace by days.`,
    follow: ["Why can the same class be loaded multiple times by different classloaders?", "What does Tomcat warning \\\"appears to have started a thread\\\" mean?"],
  },
  'jvm-008': {
    q: 'JIT compiler: C1/C2, tiered compilation, escape analysis, warm-up — and the trade-off of GraalVM native image versus JVM?',
    a: `**Summary:** HotSpot compiles by tier: interpreter → C1 (fast, collects profile) → C2 (strong optimization). Escape analysis lets objects not escaping the method be scalar replaced (no heap allocation) and lock elision. Warm-up: perf reaches maximum after thousands of invocations; GraalVM native image is AOT: startup ~100 ms + low RSS, but peak perf usually lower than JIT for long-running workloads.

### Tiered compilation
- C1 compiles quickly, lightly optimized, with profiling; C2 uses that profile to inline, escape analysis in strong optimization.
- Method reaches "hot" pushed from interpreter to C1 then C2 (threshold ~10k invocations).
- Code cache holds compiled code — reserve enough (default ~240 MB); full means JIT stops, performance drops over long runs.

~~~bash
-XX:+PrintCompilation -Xlog:jit*   # see which method compiled, which tier
-XX:ReservedCodeCacheSize=512m      # easy to fill for long-running services
~~~

### Escape analysis (C2)
~~~java
// object lives only in method — no escaping
int sum() {
    Point p = new Point();      // JIT scalar replacement: no heap allocation
    p.x = 1; p.y = 2;
    return p.x + p.y;
}
~~~
- Scalar replacement: non-escaping object becomes local variables — reduces allocation, reduces GC work.
- Lock elision: synchronize on non-escaping object removed by JIT.
- Method must be eligible and profiled; usually useful in hot loops.

### Warm-up
- At startup, code runs interpreter/C1 — clearly lower perf until C2 finishes compiling hot path.
- Benchmark right after restart yields "poor" numbers — must warm up thousands of requests before measuring.
- Adjustable: compile threshold (lower → compile earlier); JFR Compilation event for profiling compile activity.

### GraalVM native image: trade-off

| Metric | JVM JIT | Native image |
|---|---|---|
| Startup | seconds (Spring Boot 2–10 s) | under 100 ms |
| RSS | higher | much lower |
| Peak perf | highest for well-warmed hot path | usually lower |
| Reflection/Proxy | handled | requires explicit config (closed-world) |
| Debug/profiler | full | more limited |

- Native image for serverless/cron/edge where startup + memory are weak points; keep JVM for long-running services with enough warm-up.
- Spring Boot 3 AOT + GraalVM feasible for small apps; native integration libraries need clear reflection/proxy config.

> Senior tip: my rule: long-running workloads (hours) keep JVM — best peak perf after warm-up; serverless/burst keep native image. Benchmark your own workload before deciding — fast startup and high peak throughput are trade-offs, not win-win.`,
    follow: ["What does an object \"escaping\" mean, what conditions allow escape analysis to work?", "What does native image lose compared to JIT hot path?"],
  },
  'jvm-009': {
    q: 'Stop-the-world, safepoint — what are they, and how to read GC log to detect issues?',
    a: `**Summary:** STW is a phase where all application threads must stop at a safepoint so JVM can do global work (GC, deopt, thread dump; biased locking revocation before JDK 15). Read GC log to see if young/mixed pauses exceed target, allocation rate, promotion rate, and signs of full GC (largest warning on G1).

### Safepoint
- All threads must reach a "safepoint" — position with full pointer state — before GC/deopt/heap dump.
- A thread running a long loop without safepoint (large counted loop) stretches time-to-safepoint; pause includes accumulated wait time.
- Log {{-Xlog:safepoint}} shows reached/wait time; high wait means a slow thread reaching safepoint.

### Reading G1 GC log

~~~text
[gc] Pause Young (Normal) 512M->128M(1024M) 14.2ms   # under MaxGCPauseMillis: OK
[gc] Pause Young (Mixed) 300M->150M(1024M) 60ms      # mixed cleaning old regions
[gc] Pause Full (G1 Compaction Pause) 800M->600M(1024M) 800ms  # BIG WARNING on G1
[gc] to-space exhausted                               # usually before Full GC
~~~

### What to look for in log
- **Pause frequently exceeds MaxGCPauseMillis**: check young size, humongous allocation.
- **Full GC appears**: G1 out of space (to-space exhausted) — increase heap or reduce humongous.
- **Allocation rate (MB/young GC)**: high — look back at code creating garbage (String concat, DTO copy).
- **Promotion rate to old**: unusually high — objects live longer than expected; old fills quickly, must see if mixed GC keeps up.
- **Metaspace increasing with deploy** — classloader leak.

~~~bash
# Java 9+
-Xlog:gc*,safepoint:file=gc.log:time,uptime,level,tags
~~~

Analysis tools: GCeasy / GCViewer for pause charts, throughput GC, heap after GC.

> Senior tip: my rule: Full GC on G1 (other than manual System.gc()) is a capacity failing sign — pull 24h GC log before any tuning, measure first then adjust; final step is increase heap, not blind parameter tuning.`,
    follow: ["App has latency spikes despite short GC pauses — how to verify?", "How is G1 Mixed GC different from Full GC?"],
  },
  'jvm-010': {
    q: 'String deduplication, compressed oops, and object header layout — how to estimate object size?',
    a: `**Summary:** Compressed oops compresses 64-bit pointers to 4 bytes when heap ≤ 32 GB (enabled by default) — above 32 GB JVM disables it, reference becomes 8 bytes increasing heap by ~20%. Object header = mark word (8 B) + klass pointer (4 B with compression) ≈ 12 B + padding 8 B. Standard tool: JOL (Java Object Layout). String deduplication (G1) shares backing array between Strings with same content.

### Compressed oops
- For heap ≤ 32 GB: pointer encoded in 4 bytes; above 32 GB disables automatically ⇒ each reference field expands to 8 bytes.
- Classic trap: raise heap from 31 GB to 33 GB — only because compressed oops disabled, actual used heap increases ~20–30%; many cases 31 GB with compression holds more data than 33–40 GB without.
- Heap > 32 GB: consider sharding (multiple small instances) or accept cost.

### Object header + estimation
~~~text
compressed refs: mark word 8 B + klass 4 B = 12 B
data fields + padding to multiple of 8 B
Integer: 12 + 4 = 16 B
class with long: 12 + 8 (long) + 4 padding = 24 B (not 8)
byte[100]: 12 + 4 (length) + 100 = 116 -> 120 B
~~~

- JOL (Java Object Layout) is the main tool — {{org.openjdk.jol:jol}} — prints exact layout per field, padding.
- HashMap entry ~ 44–56 bytes each — HashMap<Long, Object> 1 million entries ≈ 50+ MB, not 8 bytes/entry as imagined.

### String deduplication (G1; since JDK 18 for all GCs)
- {{-XX:+UseStringDeduplication}}: concurrent thread processes Strings past age threshold, letting same-content Strings share backing byte[]/Latin-1 encoding.
- Can reduce 20–40% heap in apps with many duplicate URLs/config/tokens; enable by age threshold (default 3) and measure before/after.
- Java 9+ String uses internal byte[] (compact strings): Latin-1 String 1 byte per char — "1 billion ASCII chars ~ 1 GB" not 2 GB.

> Senior tip: measure with tools (JOL + heap dump), don’t estimate from memory: 1 million HashMap entries often demands 60–100 MB heap before the data itself — a 2 GB heap can drain with just a few un-evicted caches; calculating header + ref + padding is a highlight skill in JVM interviews.`,
    follow: ["Why is 31 GB sometimes better than 33 GB?", "How much does compact strings (Java 9) save with ASCII text?"],
  },
  'jvm-011': {
    q: 'Latency-sensitive service (p99 < 10 ms) on JVM: your GC strategy and tuning (ZGC generational, heap layout, non-GC STW sources)?',
    a: `**Summary:** for p99 < 10 ms target: choose ZGC generational (Java 21+, pause under 1 ms nearly independent of heap size); heap ~1.5–2× live set to keep concurrent mark frequency low; control all non-GC STW sources (long safepoint, full code cache, System.gc() in library); measure with GC log + JFR + load test before production.

### Main decisions

| Factor | Choice | Reason |
|---|---|---|
| GC | ZGC generational (-XX:+UseZGC -XX:+ZGenerational) | pause < 1 ms, nearly independent of heap size |
| Heap size | 1.5–2× live set | lower concurrent mark cycle frequency |
| Young size | let ZGC gen manage automatically | ZGC generational manages young |
| Allocation rate | measure per request, reduce String concat/DTO copy | concurrent GC still costs CPU at high alloc |

### Step-by-step implementation
1. Java 21+ + above flags; pause typically 0.1–0.5 ms; needs enough cores since ZGC uses concurrent CPU (shared with app).
2. Heap: not maxed at RAM limit; 1.5–2× live set sufficient in most cases (measure live set via JFR/MAT).
3. Exclude non-GC STW sources:
   - Safepoint: {{-Xlog:safepoint}} — check long counted loops increasing TTSP.
   - Code cache full: JIT stops compiling, code runs slower — reserve enough.
   - System.gc() from third-party: with ZGC, System.gc() runs a concurrent cycle (only calling thread waits); with G1 use {{-XX:+ExplicitGCInvokesConcurrent}} to avoid full GC STW, or {{-XX:+DisableExplicitGC}}.
   - HeapDumpOnOutOfMemoryError: dump can pause tens of seconds — remember when triggered.
4. Measure: GC log (pause p99), JFR allocation profile and Safepoint events; load test at 2× peak before production.

~~~bash
-XX:+UseZGC -XX:+ZGenerational -Xlog:gc*,safepoint:file=gc.log:time
# JDK 23+: just -XX:+UseZGC (generational default, JDK 24 removes ZGenerational flag)
~~~

### When not to use ZGC
- Small heap (< 4 GB) and throughput priority: G1 good enough, ZGC adds CPU overhead for concurrent threads.
- Batch job (no latency concern): Parallel GC gives higher throughput.

> Senior tip: p99 < 10 ms needs measurement at 3 layers: GC pause (GC log), runtime event (JFR), scheduling/network (APM tracing). ZGC reduces GC pause but spikes can still come from safepoint, deopt, thread scheduling — measure each layer to avoid misattributing to GC.`,
    follow: ["How does ZGC generational differ from non-generational ZGC, why add it?", "What non-GC STW sources have you seen in production?"],
  },
  'jvm-012': {
    q: 'JFR + JMC: enabling continuous profiling on production, overhead, important events to watch?',
    a: `**Summary:** JFR (Java Flight Recorder) is an integrated event recording in HotSpot, free from JDK 11 (backported to 8u262). It writes to a memory ring buffer and disk with very low overhead: {{default}} config designed at ~1%, enough for continuous 24/7; {{profile}} more detailed (~2%) for short investigations. Enable with {{-XX:StartFlightRecording}} plus {{maxage}}/{{maxsize}} to always have a "black box" of recent hours. When incident occurs, use {{jcmd <pid> JFR.dump}} to extract data then open with JMC or command-line {{jfr}}.

### Enabling on production
~~~bash
# Black box running continuously: keep max 6 hours or 1 GB
java -XX:StartFlightRecording=name=bb,settings=default,maxage=6h,maxsize=1g,dumponexit=true,filename=/data/jfr/exit.jfr -jar app.jar

# Incident: dump current data
jcmd <pid> JFR.dump name=bb filename=/data/jfr/incident.jfr

# Short 2-minute investigation with more detailed config
jcmd <pid> JFR.start name=probe settings=profile duration=2m filename=/data/jfr/probe.jfr
~~~
- {{maxage}}/{{maxsize}} only apply when recording writes to disk ({{disk=true}}, default true).
- On Kubernetes: JFR folder on sufficient volume. Active dump via jcmd when alert fires, or rely on {{dumponexit=true}} but copy file before volume deleted.
- Programmatically: {{jdk.jfr.Recording}} (e.g., {{new Recording(Configuration.getConfiguration("default"))}}), and from JDK 14 {{RecordingStream}} for real-time event reading (JFR Event Streaming), for example pushing GC pause to Micrometer.

### Where overhead comes from
- Most events are info JVM already has (GC, safepoint, class load), nearly free.
- Cost is **taking stack traces** for high-frequency events: execution sample, allocation sample, lock. Default config samples more sparsely and has thresholds (e.g., only log lock wait or socket I/O over 20 ms); profile samples denser with lower thresholds.
- From JDK 16, allocation uses event {{jdk.ObjectAllocationSample}} with throttle (limit events per second) so can run continuously. Two old events {{jdk.ObjectAllocationInNewTLAB}} and {{jdk.ObjectAllocationOutsideTLAB}} disabled by default because expensive.

### Events to check first
| Issue | Event |
|---|---|
| High CPU, hot method | {{jdk.ExecutionSample}}, {{jdk.CPULoad}}, {{jdk.ThreadCPULoad}} |
| GC | {{jdk.GarbageCollection}}, {{jdk.GCPhasePause}}, {{jdk.GCHeapSummary}} |
| Allocation | {{jdk.ObjectAllocationSample}} |
| Lock, wait | {{jdk.JavaMonitorEnter}}, {{jdk.JavaMonitorWait}}, {{jdk.ThreadPark}} |
| Slow I/O | {{jdk.SocketRead}}, {{jdk.SocketWrite}}, {{jdk.FileRead}} |
| Pause outside GC | {{jdk.SafepointBegin}}, {{jdk.ExecuteVMOperation}} |
| Memory leak | {{jdk.OldObjectSample}} (dump with {{path-to-gc-roots=true}}) |
| Virtual thread (JDK 21) | {{jdk.VirtualThreadPinned}}, {{jdk.VirtualThreadSubmitFailed}} |
| JIT | {{jdk.Compilation}}, {{jdk.Deoptimization}}, {{jdk.CodeCacheFull}} |

### Analysis
- **JMC**: Automated Analysis page automates scoring common issues; Method Profiling and Flame Graph for CPU; Memory for allocation; Lock Instances, Socket I/O, Garbage Collections pages; Threads shows which thread blocked when.
- **No GUI**: {{jfr summary file.jfr}}, {{jfr print --events jdk.GCPhasePause file.jfr}}. JDK 21 adds {{jfr view hot-methods file.jfr}} and {{jcmd <pid> JFR.view}} for server-side summary tables.

### Pitfall
- Forgetting {{maxage}}/{{maxsize}} for long recordings, disk fills.
- Only enabling when incident already occurred is too late: brief spikes never reproduce. The greatest JFR value is a ready black box.
- JFR file contains system properties, env vars, command-line args. Secrets passed via env will be inside, so handle file as sensitive data.

> Senior tip: I enable JFR default with {{maxage=6h}} on every pod and link to alerting: when p99 exceeds threshold, a job auto-calls {{JFR.dump}} on that exact pod. So 30-second spikes at 2 AM still have data to read next morning, usually revealing long safepoint, connection pool lock, or a large allocation batch.`,
    follow: ["How do JFR and async-profiler differ, when to use which?", "How to push GC pause metrics from JFR Event Streaming to Prometheus?", "No GUI on server, how do you analyze .jfr file?"],
  },
  'jvm-013': {
    q: 'Reading heap dump: dominator tree, shallow vs retained size, GC roots path — MAT leak finding process?',
    a: `**Summary:** Shallow size is the size of the object itself (header + fields). Retained size is memory freed if that object is collected: itself plus all objects only reachable through it. Dominator tree orders objects by relation "all paths from GC root to B go through A", so the top object of a branch with large retained size is what holds memory. Process: take dump at right time → Leak Suspects → Dominator Tree sorted by retained → Path to GC Roots (exclude weak/soft) to know **who** holds it → match with code. Slow leaks compare two dumps spaced hours apart.

### Taking heap dump
~~~bash
# Auto on OOM (should always be on)
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps/

# Active
jcmd <pid> GC.heap_dump /dumps/heap.hprof        # default live objects only: runs full GC first
jcmd <pid> GC.heap_dump -all /dumps/heap.hprof   # includes unreachable objects
~~~
- Dump is **stop-the-world**: 8 GB heap can stop from seconds to tens of seconds, file roughly used heap size. In production, pull pod from load balancer first and ensure volume has space.
- Dump contains real data (account numbers, tokens, customer info). Apply sensitive-data process when copying out for analysis.

### Shallow and retained
~~~text
GC root (static field CACHE)
  -> HashMap (shallow 48 B)
       -> Node[] (shallow 512 KB)
            -> 100,000 entries -> Session (shallow 32 B) -> byte[] 4 KB
Retained of HashMap: about 400 MB   <- suspect
Retained of one Session: about 4 KB
~~~
- Leak is rarely a single huge object. Usually a collection with small shallow but huge retained.
- If object held via two separate paths it does not belong to retained of either. That is why retained per branch can be small while heap is full; then find common dominator above.

### Process in MAT
1. **Leak Suspects report**: quick start, points out groups occupying most heap and accumulation paths.
2. **Dominator Tree**, sort by Retained Heap; use "Group by class" or "Group by class loader" when app server runs multiple webapps.
3. **Path to GC Roots** with option to exclude phantom/weak/soft: keep only strong paths, because weak/soft don’t prevent GC so not leak cause.
4. **Merge Shortest Paths to GC Roots** on a set of objects (e.g., all {{Session}}) to see common holder.
5. Histogram and **OQL** to count/filter, e.g., {{SELECT * FROM java.util.HashMap s WHERE s.size > 10000}}.
6. Slow leak: take two dumps hours apart, compare histogram to see which class grows steadily.

### Understanding correctly
- When MAT parses dump, it **discards unreachable objects** (still viewable in Unreachable Objects Histogram), so retained size is not inflated by garbage, even with {{-all}} dump. Real effect of "live" dump is full GC before dump, adding one STW.
- GC roots in MAT include: local variables and params on stack of running threads, static fields (via class and classloader), JNI references, held monitors, system classes.
- Common culprits: static Map as unbounded cache, ThreadLocal in thread pool, registered listener not removed, Hibernate persistence context in long batch, old classloader after redeploy.

### Pitfall
- 20 GB dump won’t open on laptop: run MAT headless ({{ParseHeapDump.sh}}) on a high-RAM machine, increase {{-Xmx}} in MemoryAnalyzer.ini, build index and report first then open GUI.
- Dump on container filesystem lost on pod restart. {{HeapDumpPath}} must point to persistent volume.

> Senior tip: for slow leaks I don’t take continuous dumps in production because each is an STW. I monitor old-gen trend after GC via metric, then take only two dumps on a pod pulled from traffic, hours apart. Comparing histograms almost always points straight to the accumulating class; then Path to GC Roots tells which code holds it.`,
    follow: ["When do you use Unreachable Objects Histogram?", "20 GB heap dump — how to analyze without hanging the machine?", "Retained sizes of objects don’t sum to used heap — why?"],
  }
});
