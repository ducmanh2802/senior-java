/*
 * English translation of js/data/q-concurrency-jvm.js — task T955. Format: js/core/i18n.js (content overlay).
 * ids: jvm-042 jvm-043 jvm-044
 */
App.i18n.content({
  'jvm-042': {
    q: 'JFR + JMC and async-profiler: profile allocation and lock contention in production with low overhead; flame graph.',
    a: `**Summary:** To find the cause of high CPU, heavy GC, or rising latency in production, you need a profiler with low overhead. **JFR (Java Flight Recorder)** is the JVM's "black box": it records events (GC, allocation, lock, safepoint, thread...) at low cost and can run continuously. **JMC (Java Mission Control)** opens and analyzes {{.jfr}} files. **async-profiler** samples stack traces by CPU, allocation, and lock and emits **flame graphs** to quickly reveal hotspots. The three tools complement each other: JFR gives the big picture over time, async-profiler pinpoints the specific cause.

### Terminology (explained on first use)
- **Profiler**: a tool that measures where a program spends CPU, memory, and locks.
- **Overhead**: the extra cost introduced by the measuring tool itself. Production needs low overhead.
- **Sampling**: periodically capturing data (e.g. sampling stack traces on a schedule) instead of recording everything.
- **Allocation profiling**: measuring where code allocates many objects, usually causing GC pressure.
- **Lock contention**: many threads competing for the same lock and waiting for each other, increasing latency.
- **Flame graph**: a chart of stack traces; **width** represents the proportion of samples/time, **height** is the call stack.
- **Hotspot**: a piece of code that consumes a large share of resources.

### JFR (Java Flight Recorder)
JFR is built into the JVM (OpenJDK) and records events such as GC, allocation, thread, lock contention, safepoint, and compilation. Strength: low overhead, suitable for production.

~~~text
// Start with recording
-XX:StartFlightRecording=filename=app.jfr,dumponexit=true,settings=profile

// Or use jcmd while running
jcmd <pid> JFR.start settings=profile filename=/tmp/app.jfr duration=10m
jcmd <pid> JFR.dump filename=/tmp/app.jfr
jcmd <pid> JFR.stop
~~~

{{settings=profile}} collects more detail than {{default}} (overhead may be slightly higher, still must be evaluated per system).

### JMC (Java Mission Control)
JMC analyzes the {{.jfr}} file: charts of CPU/heap/GC over time, allocation hot methods/classes, lock contention, thread, safepoint. JMC answers: "when did the incident happen, and what GC/lock/allocation coincided?"

### async-profiler
async-profiler samples stack traces (usually less affected by safepoint bias than older profilers) and exports an HTML flame graph.
~~~text
./asprof -d 60 -e cpu   -f cpu.html   <pid>
./asprof -d 60 -e alloc -f alloc.html <pid>
./asprof -d 60 -e lock  -f lock.html  <pid>
~~~

### Reading a flame graph correctly
- Vertical axis: call stack (the function below calls the one above).
- Horizontal axis: **width** = proportion of samples (CPU/allocation/lock). A wide "wall" is the hotspot.
- Do not read stack depth as time. A deep stack does not mean slow.

### Real-world example
Assumption: a search API on 6 pods, 4 vCPU/pod, 4 GB heap, p99 normally 110 ms. After a release, CPU rises 45% -> 78%, young GC doubles, p99 420 ms. A 15-minute JFR (settings=profile) opened in JMC shows allocation rate spiking, many temporary {{String}}/{{HashMap}}. async-profiler {{-e alloc}} for 60 seconds shows a flame graph whose hotspot is {{buildResponse()}}: creating a new map per element and intermediate serialization. Optimization: remove the intermediate step, reduce temporary objects. Result: allocation rate down ~55%, CPU ~50%, p99 ~130 ms. No restart or debugger attach needed.

### Common pitfalls
- **Profiler configured too heavy**: sampling too dense increases overhead. Choose an appropriate profile.
- **Misreading the flame graph**: looking at height instead of width.
- **Profiling only CPU**: high latency can come from allocation/GC or lock contention. Choose {{alloc}}/{{lock}} mode when appropriate.
- **Capturing at the wrong time**: the 60-second snapshot must fall during the incident; the JFR timeline helps pick the right moment.

### Interview notes
"When investigating production performance, I prioritize low-overhead tools. JFR is my first choice because it is built into the JVM and records GC, allocation, lock, safepoint, and thread over time; I use JMC to analyze the .jfr file. For a specific hotspot, I use async-profiler to sample CPU, allocation, or lock contention and export a flame graph. When reading a flame graph, I look at the width because it represents the sample proportion, while the height is just the call stack. I usually combine them: JFR for the big picture on a timeline, async-profiler for which method is the cause. The first step is always to determine whether the bottleneck is CPU-bound, allocation/GC-bound, lock contention, or I/O, then choose the matching profile mode."

> Senior tip: do not optimize before knowing the bottleneck. CPU, allocation, and lock contention have similar symptoms (high latency) but different fixes. Picking the wrong profiler mode leads to wrong conclusions.`,
    follow: ['How to distinguish a bottleneck caused by allocation vs lock contention?', 'When should continuous JFR recording be used?']
  },
  'jvm-043': {
    q: 'Metaspace: class metadata, classloader leak, why redeploying Tomcat increases metaspace and how to handle it.',
    a: `**Summary:** **Metaspace** is the native memory area (outside the Java heap) that stores class metadata: class structure, methods, fields, constant pool... (since Java 8, replacing PermGen). A **classloader leak** happens when a GC root still holds a reference to the {{ClassLoader}} of an already-redeployed app, so GC cannot reclaim that classloader and all the class metadata it loaded. On Tomcat, each redeploy creates a new ClassLoader; if the old one leaks, Metaspace grows across deploys and may cause {{OutOfMemoryError: Metaspace}}.

### Terminology (explained on first use)
- **Class metadata**: the information the JVM needs to understand a class (name, methods, bytecode metadata, constant pool...), not instance data.
- **Metaspace**: the native memory area holding class metadata. Unlike PermGen it is not fixed in size, but it can still run out when leaking.
- **ClassLoader**: the component that loads classes. On Tomcat, each webapp usually has its own ClassLoader for isolation.
- **Redeploy**: undeploy the old version and load the new one without restarting the whole JVM.
- **Classloader leak**: the old ClassLoader is still referenced, so GC cannot reclaim it; the classes it loaded are not freed either.
- **GC root**: the starting point from which GC determines live objects (thread stack, static field, JNI ref...). If a path from a GC root still reaches the old ClassLoader, it stays alive.

### Metaspace and the ClassLoader lifecycle
When the JVM loads a class through a ClassLoader, the metadata lives in Metaspace. When the ClassLoader becomes unreachable and is GC'd, the JVM may free the metadata of the classes it loaded. Therefore Metaspace depends heavily on the ClassLoader lifecycle — very important during redeploy.

Related flags:
- {{-XX:MetaspaceSize}}: threshold that triggers GC/metadata adjustment (not a "fixed size").
- {{-XX:MaxMetaspaceSize}}: maximum Metaspace limit. Helps fail fast on leak, but set too low causes false OOME.

### Why redeploying Tomcat increases Metaspace
1. Deploy webapp v1: Tomcat creates WebappClassLoader W1, loads v1 classes -> Metaspace grows.
2. Redeploy v2: Tomcat creates W2. If clean, W1 has no references -> GC reclaims W1 -> v1 metadata freed.
3. If there is a leak (ThreadLocal not {{remove()}}ed, background thread not shut down, JDBC driver/MBean registered globally not deregistered, static cache holding webapp objects...), a GC root still points to W1.
4. W1 cannot be GC'd. After N redeployments, W1..Wn-1 stay alive -> Metaspace accumulates -> {{OutOfMemoryError: Metaspace}}.

Imagine each tenant change (redeploy) issues a new key (new ClassLoader), but the building security guard (long-lived server thread pool) still holds the old tenant's belongings (ThreadLocal/static ref). The old room can never be cleaned.

### Common leak causes
- **ThreadLocal not removed**: Tomcat pool threads survive redeploy; the ThreadLocal value holds the old webapp's object/class.
- **Self-created thread/timer/executor not shut down**: background thread keeps running, holding the old classloader.
- **Global registration not deregistered**: JDBC driver, JMX MBean, logging hook, serialization hook.
- **Static cache**: cache in a parent/common classloader holding webapp objects.
- **Third-party libraries**: check versions and shutdown mechanisms.

### Detection
1. **Symptom**: after each redeploy Metaspace/native memory grows and does not drop; after a few deploys OOM Metaspace occurs.
2. **Monitoring**: JFR, {{jcmd <pid> VM.metaspace}}, VisualVM/JMC.
3. **Heap dump**: after several redeployments, use Eclipse MAT to find multiple ClassLoaders of the same webapp, then inspect **Path to GC Roots** to see who holds them.
4. **Tomcat log**: Tomcat warns about some leaks on undeploy (not exhaustive).

### Real-world example
Assumption: an internal webapp on Tomcat, redeployed 1-2 times/day, heap 2 GB. Initial Metaspace ~180 MB. Each redeploy adds 60-90 MB, Full GC does not reduce it. On the 12th redeploy, {{OutOfMemoryError: Metaspace}} occurs. Heap dump (MAT) shows 11 {{WebappClassLoader}} still alive; GC root from the Tomcat thread pool to a {{ThreadLocal}} holding the old webapp's {{UserContext}}. Root cause: a filter set a ThreadLocal but did not {{remove()}} in {{finally}}. Fix: always {{remove()}} in {{finally}}, shut down background threads in {{ServletContextListener.contextDestroyed}}, check JDBC/MBean deregistration. Result: 20 redeployments, Metaspace fluctuates 170-210 MB, no cumulative growth.

### Handling and prevention
- **Clean up on undeploy**: in {{contextDestroyed}}, shut down thread pools, timers, schedulers, clients.
- **ThreadLocal**: every {{set}} paired with {{remove}} in {{finally}}.
- **Deregister globals**: deregister JDBC driver, MBean, hooks.
- **Limit/monitor**: a reasonable {{MaxMetaspaceSize}} to detect leaks early.
- **Long term**: rolling restart of process/pod is the cleanest approach; hot redeploy requires resource-management discipline.

### Interview notes
"Metaspace stores class metadata in native memory, replacing PermGen since Java 8. On Tomcat, each redeploy creates a new ClassLoader; if the old one is GC'd, the old metadata is freed. A classloader leak happens when a GC root still holds the old ClassLoader, e.g. ThreadLocal not removed, background thread not shut down, or global registration like JDBC/MBean not deregistered. Then Metaspace grows across redeployments and may cause OutOfMemoryError: Metaspace. To handle it, I monitor Metaspace via JFR or jcmd, capture a heap dump, and use MAT to find surviving ClassLoaders and inspect Path to GC Roots. Prevention: always remove ThreadLocal in finally, shut down resources in contextDestroyed, and set MaxMetaspaceSize to detect leaks early."

> Senior tip: the "safe redeploy" standard is redeploying many times without cumulative growth in Metaspace or webapp ClassLoader count. Testing only one redeploy can miss slowly accumulating leaks.`,
    follow: ['How to use heap dump/MAT to find a classloader leak?', 'Why is ThreadLocal in a thread pool dangerous during redeploy?']
  },
  'jvm-044': {
    q: 'Overall GC tuning: choosing a collector by workload, reading GC logs, heap sizing, pause target; when to switch collectors.',
    a: `**Summary:** GC tuning is a measurement-and-tradeoff problem, not a "magic flag" choice. Choose the collector by workload: **Serial** for small apps/few cores; **Parallel** prioritizes throughput; **G1** balances, common for servers; **ZGC generational** (Java 21+) prioritizes very low pause/large heap. Read GC log/JFR to understand pause, frequency, allocation rate, promotion. Size the heap generously; usually set {{-Xms}}={{-Xmx}}. Switch collectors only when data shows the current one misses SLO and allocation/object lifecycle causes are ruled out.

### Terminology (explained on first use)
- **Workload**: traffic characteristics (short/long requests, allocation rate, long-lived objects, latency vs throughput focus).
- **Throughput**: fraction of time the app does useful work (not spent in GC).
- **Pause (STW)**: time the app is stopped due to GC.
- **Allocation rate**: rate of new object creation (MB/s). High -> frequent GC.
- **Promotion**: objects surviving young GC are moved to the old generation.
- **GC log**: GC journal; JDK 9+ uses Unified Logging {{-Xlog:gc*}}.
- **SLO**: service level objective (e.g. p99 < 200 ms).

### Choosing a collector by workload
| Collector | Fits | Tradeoff |
|---|---|---|
| Serial | Small heap, 1 core, simple CLI/batch | Long pause as heap/load grow |
| Parallel | Batch/throughput, accepts pause | STW pause can be large |
| G1 | Most servers, needs balance | Pause fairly, not as low as ZGC |
| ZGC generational | Strict p99/p999, large heap | CPU/throughput overhead may trade; must measure |

No single best collector for everything. A senior answer states criteria, how to measure, then chooses.

### Reading GC log / observation
~~~text
-Xlog:gc*:file=gc.log:time,uptime,level,tags:filecount=5,filesize=20m
~~~

Metrics to watch:
- **Pause duration**: does it exceed SLO p99?
- **Frequency**: young GC too frequent usually means high allocation rate or small heap/young gen.
- **Cause**: Allocation Failure, Humongous Allocation, Metadata GC Threshold...
- **Heap before/after**: high after GC -> retention/leak or small heap.
- **Promotion/Old occupancy**: old growing steadily needs inspection of long-lived objects.

Add JFR and metrics (Micrometer/Prometheus) to see timeline alongside latency.

### Heap sizing and pause target
- **{{-Xms}} = {{-Xmx}}** on servers: avoid resizing, reduce noise.
- Heap too small: frequent GC, lower throughput, risk of OOME.
- Heap too large: may hide leaks; with long-pause collectors, pause may increase.
- **G1 pause target**: {{-XX:MaxGCPauseMillis=200}} is a target, not a hard guarantee. Set too low it can backfire.

### Real-world example
Assumption: a Java 17 reporting service, heap 6 GB, Parallel GC, spike creates many temporary objects (CSV/JSON export). p99 normally 150 ms but during major pause requests stutter 1.2-2.8 seconds, 3-5 times/hour. GC log: high allocation rate, long pause. SLO p99 < 400 ms. Step 1: optimize code (streaming CSV, remove intermediate strings) -> allocation rate down 35%, pause still 700-1200 ms. Step 2: switch to G1 with {{-Xms6g -Xmx6g}}, {{MaxGCPauseMillis=200}} (realistic target), measure with traffic replay: most pauses 40-140 ms, p99 ~220 ms. ZGC not chosen because SLO already met and change is minimal.

### When to switch collectors
Switch when: there is a baseline (pause, throughput, CPU, allocation); the current collector misses SLO even after handling allocation/leak/sizing; benchmarked on real workload.

Do not switch when: GC log/JFR not read; root cause is high allocation, leak, or wrong sizing; or only because "a blog said it is faster".

### Common pitfalls
- **Copy-paste flags**: every workload differs.
- **Looking only at pause, ignoring throughput/CPU**: low-pause GC can cost CPU.
- **Confusing high allocation rate with leak**: high allocation -> frequent GC; leak -> heap after GC grows steadily.

### Interview notes
"My GC tuning starts from SLO and workload characteristics. I choose the collector by tradeoff: Parallel for throughput/batch, G1 for balance on servers, ZGC generational when very low pause is needed with large heap. I enable GC log and use JFR to read pause duration, frequency, allocation rate, promotion, and GC cause. For heap sizing I usually set Xms equal to Xmx on servers and ensure the heap is large enough that GC is not too frequent; with G1 I use MaxGCPauseMillis as a realistic target. I only switch collectors when there is a baseline and I confirm the problem is not high allocation, leak, or wrong sizing. GC tuning is measure, change one thing, then measure again."

> Senior tip: effective order: (1) is allocation rate too high, (2) is there leak/retention, (3) is heap sizing appropriate, (4) only then choose/switch collector and tune flags. Reversing this order usually wastes time and risk.`,
    follow: ['How to distinguish high allocation rate from memory leak via GC log?', 'Is G1 MaxGCPauseMillis a hard guarantee?']
  }
});
