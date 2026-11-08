/*
 * English translation of js/data/labs-gc.js — task T1008. Format: js/core/i18n.js (content overlay).
 * ids: lab-gc-010 lab-gc-011 lab-gc-012
 */
App.i18n.content({
  'lab-gc-010': {
    title: 'Redeploying a scripting feature: Metaspace OOM from a classloader leak in ScriptEngine',
    scenario: `**Background:** Platform **InsureCore** (Spring Boot 3.2, JDK 17.0.10) lets the business team configure insurance premium formulas via scripts. Service **premium-engine** loads scripts from the database, compiles and executes them to compute premiums. Each time the business team clicks "Apply new formula" on the admin page, the service reloads all currently active formulas. The pod runs 2 vCPU, memory limit 3Gi. JVM: {{-Xmx1536m -XX:MaxMetaspaceSize=192m -XX:MetaspaceSize=96m -XX:+UseG1GC -Xlog:gc*,gc+metaspace=info:file=/logs/gc.log:time,uptime,level,tags}}.

**Terms explained:**
- **Metaspace:** The native memory area (outside the heap) the JVM uses to store *class metadata* — information describing a class such as method names, fields, and loaded bytecode. (Before Java 8 this area was called PermGen and lived in the heap; from Java 8 onward it is Metaspace, using native memory.) Metaspace can grow; {{-XX:MaxMetaspaceSize}} caps the maximum to avoid consuming all machine RAM.
- **Classloader (class loading component):** The JVM component responsible for reading bytecode (.class) and creating {{Class}} objects in Metaspace. Each classloader has its own "generation" of classes. Only when **no object references the classloader or any class it loaded** can GC reclaim (unload) the entire classloader and free the corresponding Metaspace. If even one reference remains, the classloader gets "stuck" → Metaspace leak.
- **ScriptEngine (Nashorn/GraalJS/JDK scripting):** An API for running dynamic scripts (JavaScript, etc.) inside the JVM. Many implementations compile scripts into Java bytecode and load them via a dedicated classloader. Continuously creating ScriptEngine/classloader instances without proper cleanup can cause a Metaspace leak.
- **{{OutOfMemoryError: Metaspace}}:** An error thrown when Metaspace needs to grow but has already hit {{MaxMetaspaceSize}} and GC cannot unload any more classloaders. The heap may still have free space.
- **{{jcmd VM.metaspace}} / {{VM.classloader_stats}}:** JDK diagnostic tools (shipped with {{jcmd <pid>}}) reporting how much Metaspace is used, how many classloaders exist, and which classes were loaded.

**Symptoms:** Service deployed at **08:00 on 23/10/2026**. The business team reloads formulas roughly **every 10–15 minutes** during working hours to test (peak ~6 reloads/hour). At **15:42**, the pod started returning HTTP 500 in bulk. Logs contain {{java.lang.OutOfMemoryError: Metaspace}}. Restarting the pod makes it run again, but it recurs after about 7–8 hours. The dashboard shows heap at only ~520 MB / 1536 MB when the error occurs. Dev A argues "heap is large enough, MaxMetaspaceSize must be too small" and proposes raising it to 512 MB. Dev B ran {{jmap -histo}} but sees no abnormal growth of application classes on the heap.

**Data collected:** Error and GC logs around the OOM, {{jcmd VM.metaspace}} and {{jcmd VM.classloader_stats}} taken at 15:10 (~30 minutes before OOM), the {{jvm_classes_loaded_classes}} metric over time, and the source of {{PremiumFormulaService}}.`,
    questions: [
      'Why does the application throw {{OutOfMemoryError: Metaspace}} while the heap is only ~520 MB? Explain what Metaspace is, how it differs from the heap, and cite evidence from the GC log/jcmd/metrics.',
      'What is the root cause of Metaspace growing indefinitely and classes never being unloaded? Identify which classloader leaks, how many loaders, and the mechanism by which GC unloads classloaders.',
      'How would you fix this in the short and long term (code + configuration + scripting architecture)? Why is simply increasing {{MaxMetaspaceSize}} wrong? What alerts/monitoring are needed?'
    ],
    hints: [
      'Look at the GC log: {{Metadata GC Threshold}}, {{Metaspace ... unchanged}} after Pause Full/Last Ditch Collection, and {{MaxMetaspaceSize 192M}}. Compare with heap after GC (~396M) — which memory area is exhausted?',
      'A classloader is GC-collected only when no references point to it, to its loaded classes, or to instances of those classes. {{VM.classloader_stats}} shows 284 loaders of type {{NashornScriptEngine$3}}, one class each. {{reloadFormulas()}} creates a new {{ScriptEngine}} each time and {{compiled}} holds {{CompiledScript}} — does {{CompiledScript}} hold a back-reference to the engine/classloader?',
      'Correlate the numbers: {{formula_reload_events}} rises 1→41, {{jvm_classes_loaded_classes}} rises ~18420→36720 (~18300 classes), unloaded stays 0. Does that match ~284 loaders × classes/scripts generated? What is Nashorn\'s state on JDK 17 (deprecated/removed)?'
    ],
    answer: `**Summary:** {{OutOfMemoryError: Metaspace}} occurs because the service creates a **new** {{ScriptEngine}} (Nashorn) on every formula reload (~6 times/hour), yet the {{CompiledScript}} cached in {{compiled}} keeps a back-reference to the structures of the engine/classloader used to compile it. As a result each reload generates new classloader/script classes, and old classloaders **never become eligible** for GC unloading → Metaspace grows steadily ({{unloaded_classes_total}} always 0) until it hits {{MaxMetaspaceSize=192m}}. The heap still has free space (~520 MB) because this is a native Metaspace exhaustion, not a heap issue. The real fix is proper lifecycle management of engine/compiled script (reuse an engine with control, or replace Nashorn with a modern scripting mechanism), and removing references that keep classloaders alive.

### 1) What Metaspace is and how it differs from the heap

- **Heap:** holds *objects* (instances) created via {{new}} (e.g. {{String}}, {{HashMap}}, {{byte[]}}). The G1 heap GC collects objects no longer referenced.
- **Metaspace:** holds *class metadata* (class structure, method bytecode, constant pool, annotation metadata...). This is native memory. Each time the JVM loads a class (via a classloader), its metadata is allocated into Metaspace.
- **Releasing Metaspace:** happens only when the **entire classloader** that loaded those classes is no longer reachable (no references from GC roots, no live instances of classes it loaded, no held class objects). Then GC may *unload* the classloader and return the Metaspace. If even one reference remains, Metaspace will not decrease — like a "leak", but in the metadata region.
- **MaxMetaspaceSize:** a hard cap. When the cap is reached and GC cannot unload anything, the JVM throws {{OutOfMemoryError: Metaspace}}. This is a safety mechanism so the process does not consume all machine/container RAM.

### 2) Evidence from artifacts

**GC log shows Metaspace full while heap is not:**
- GC(398) at 15:10: {{Metaspace: 178602K(180224K)...}} — already ~174 MB used / ~176 MB committed, very close to the cap; heap after GC only {{214M(1536M)}}.
- GC(421) cause {{Metadata GC Threshold}}: the JVM tries to GC due to metadata pressure.
- GC(423) {{Pause Full (Metadata GC Threshold)}} 1188 ms, GC(424) {{Metadata GC Clear Soft References}} 1241 ms, GC(425) {{Last Ditch Collection}} 1310 ms — three consecutive Full GCs, yet {{Metaspace}} **does not decrease** ({{196410K...->196410K}}, then {{196582K}}). Heap after Full GC only ~396M. This is the classic sign: GC tried everything (including clearing soft refs) but **no classloader could be unloaded**.
- Error log: {{OutOfMemoryError: Metaspace}} at {{ClassLoader.defineClass1 (Native Method)}} → {{ScriptLoader.installClass}} → {{nashorn...Compiler.compile}} → {{PremiumFormulaService.reloadFormulas:57}}. The stack trace points directly at **defining/loading a new class** when compiling a Nashorn script.

**jcmd VM.metaspace at 15:10 (before OOM):**
- {{Total Usage - 321 loaders, 14822 classes}}; {{174.42 MB (98%) used}}; {{MaxMetaspaceSize: 192.00 MB}}. Only ~18 MB left before the cap.
- {{Non-Class}} dominates (151.77 MB) — consistent with bytecode/metadata of the generated script classes.

**jcmd VM.classloader_stats:**
- There are **284 loaders** of type {{jdk.nashorn.api.scripting.NashornScriptEngine$3}}, each loading {{1 class}}, total {{ChunkSz ~116,736,000 bytes}}. Many small classloaders, each holding a piece of Metaspace — the typical pattern of a leak from repeatedly creating loader/script classes.

**Correlated metrics:**
- {{jvm_classes_loaded_classes}} rises 18420 → 36720 (+18300) while {{jvm_classes_unloaded_classes_total}} stays **0**. {{formula_reload_events}} rises to 41. Each reload compiles 42 active formulas (log {{active=42}}) and creates new engine/compiled artifacts → more classes; no unloading means old classloaders are kept alive.
- Heap stays stable/moderate (~312–520 MB), no heap-leak pattern. That is why {{jmap -histo}} (looking at heap instances) shows no "application class growing abnormally" — the cause is Metaspace/classloader, not heap instances.

### 3) Root cause (mechanism)

In {{reloadFormulas()}}:
~~~java
compiled.clear();
ScriptEngine engine = new ScriptEngineManager().getEngineByName("nashorn"); // NEW engine every time
for (Formula f : repo.findAllActive()) {
    Compilable c = (Compilable) engine;
    CompiledScript cs = c.compile(f.getScriptBody()); // Nashorn compile -> generates class bytecode, loaded via loader
    compiled.put(f.getId(), cs); // cache holds CompiledScript
}
~~~

- Nashorn, when compiling a script, often generates Java classes (bytecode) for fast execution. Those classes are loaded by the classloader attached to the engine/context.
- {{compiled}} is a {{ConcurrentHashMap}} field of the {{@Service}} singleton → lives for the whole application lifetime (GC root via Spring context). {{compiled.clear()}} only removes entries from the map; but the {{CompiledScript}}/related objects may still be retained by other references, and more importantly: the chain from {{CompiledScript}} → (engine internal context) → (script loader) → {{Class}} keeps the old loader from being unloaded. Creating a new engine each time without releasing per Nashorn's lifecycle mechanism is a common trap.
- GC unloads a classloader only when **all reference paths** to loader/class/instance are gone. A single leftover reference (static collection, singleton map, callback, thread local) "pins" the loader → Metaspace leak. This is why classloader leaks are hard to see with ordinary heap instance histograms.

> Technical context (for accurate interview answers): Nashorn JavaScript engine shipped with JDK 8–14, was **deprecated in JDK 11 (JEP 335)** and **removed from the JDK in JDK 15 (JEP 372)**. On JDK 17, Nashorn is not part of the JDK by default; if the service still uses engine name "nashorn", it is typically because a dependency/internal runtime image bundles standalone Nashorn. This raises maintenance risk and calls for a replacement plan (e.g., GraalJS). State this according to the JDK actually in use — do not fabricate APIs.

### 4) Fix

**Short term (reduce risk, buy time):**
1. **Controlled restart/rollout** before hitting the cap (the growth rate is known from metrics). This is an operational measure only.
2. **Reduce reload frequency** and prevent unnecessary concurrent reloads; log/audit every reload.
3. **Increase {{MaxMetaspaceSize}}** (e.g., 256m/320m) *only if* the container still has native memory headroom — and only as a **band-aid**, because the leak continues (OOM just happens later). Do not treat this as the fix. Budget: heap (1536m) + metaspace (new max) + code cache + thread stacks + other native < container memory limit (3Gi).

**Long term (fix the root cause):**

1. **Manage engine/compiled script lifecycle correctly:**
- Do not create a new {{ScriptEngine}} casually on every reload unless needed. If reload is required, ensure **no references** to old {{CompiledScript}}/engine remain (clear the cache *and* ensure nothing else holds them). With Nashorn, understand its lifecycle ({{NashornScriptEngine}} may need a specific usage pattern; in many cases reuse a controlled engine/factory or isolate per classloader and *release* the whole graph when replacing).
- A safer direction: run each "formula generation" in an **isolated ClassLoader** you control; on reload, build a new generation, atomically swap traffic to it, then *drop every reference* to the old generation so GC can unload it. This resembles a safe plugin/reload pattern (must verify no thread locals, static caches, or loggers hold classes).

~~~java
// Idea: atomically swap formula generations, holding no reference to the old one
private final AtomicReference<FormulaBundle> bundle = new AtomicReference<>();

public synchronized void reloadFormulas() {
    FormulaBundle next = FormulaBundle.compileAll(repo.findAllActive()); // new generation
    FormulaBundle prev = bundle.getAndSet(next); // atomic swap
    // prev goes out of scope; do NOT store prev in any field/static/cache
    // so the classloader/compiled artifacts of prev become GC-unloadable
}

public double calculate(String formulaId, Bindings vars) {
    return bundle.get().calculate(formulaId, vars);
}
~~~
(This is a framework idea; a real implementation must ensure {{FormulaBundle}}/engine/classloader is not referenced by the scripting engine's static registry.)

2. **Consider replacing Nashorn:** since Nashorn is no longer in JDK 17, evaluate migrating to **GraalJS** (GraalVM JavaScript, runnable on HotSpot depending on version/configuration — verify project compatibility) or safer alternatives (rule engines like Drools, MVEL, or restricted expressions instead of free-form scripts) when the business allows. A "full power" script engine is also a security risk (sandboxing is hard).

3. **Limit and validate scripts:** enforce execution time, memory/CPU limits (if the engine supports them), and prevent scripts from arbitrarily accessing dangerous internal classes.

### 5) Prevention and alerts

- **Metrics/alerts:** track {{jvm_classes_loaded_classes}} and {{jvm_classes_unloaded_classes_total}} — if loaded grows steadily while unloaded stays ~0 for a long time, alert on a classloader leak. Track {{jvm_memory_used_bytes}} (area nonheap, id Metaspace) / committed vs {{MaxMetaspaceSize}}; alert when usage > 75–80% or shows a sustained upward trend.
- **Log/GC:** enable {{-Xlog:class+load=info,class+unload=info}} (watch log volume) or use JFR events {{jdk.ClassLoad}}, {{jdk.ClassUnload}} during investigation. Alert on repeated {{Metadata GC Threshold}} or Full GC caused by metadata.
- **Testing:** soak test: perform hundreds/thousands of formula reloads in staging, observe {{classes unloaded}} > 0 and stable Metaspace after warmup. Run with a lower {{-XX:MaxMetaspaceSize}} to detect leaks earlier.
- **Process:** any "reload/plugin/dynamic script" feature must have an explicit unload design and review for reference leaks (static collections, thread locals, JDBC drivers, logger contexts).

> Senior tip: When you see {{OutOfMemoryError: Metaspace}} but the heap still has free space, do not rush to increase {{MaxMetaspaceSize}} — that usually only delays the failure. Ask: "is something **loading classes continuously**?" (script engine, dynamic proxy/CGLIB, Groovy/JSP compilation, redeploy, serialization framework). Three life-saving commands: {{jcmd <pid> VM.metaspace}} (how much Metaspace remains, GC threshold), {{jcmd <pid> VM.classloader_stats}} (which loader is abnormally numerous), and the {{classes loaded vs unloaded}} metric. If {{unloaded}} is near 0 while {{loaded}} grows with a business action (reload, special request), you are almost certainly facing a classloader leak. The real fix is **cutting every reference** so the classloader becomes garbage — not making Metaspace bigger.`,
    rubric: [
      'Correctly distinguishes Heap vs Metaspace/native memory: Metaspace OOM occurs when class metadata hits MaxMetaspaceSize (192m) and GC cannot unload; heap after GC stays low (~396–520M). Cites GC log (Metadata GC Threshold, Full GC Metadata not reducing Metaspace) and/or jcmd/metrics.',
      'Identifies the classloader leak mechanism: repeated ScriptEngine/compile creates new classes+loaders; CompiledScript/cache or back-references keep the classloader alive; a classloader is unloaded only when no references remain. Cites VM.classloader_stats (284 NashornScriptEngine$3 loaders) and classes loaded increasing while unloaded=0.',
      'Correlates the numbers: ~41 reload events, 42 active formulas per reload, +~18300 loaded, 0 unloaded, Metaspace approaching the cap — explains why increasing MaxMetaspaceSize only delays the failure.',
      'Proposes in-depth fixes: lifecycle management (no leaking references, safe generation swap/unload) or replacing Nashorn (deprecated in JDK 11, removed in JDK 15 — stated in the JDK 17 context) with a suitable alternative; safe script control; soak-test reloads many times.',
      'States monitoring/prevention: alert when unloaded does not increase while loaded does, Metaspace usage/threshold, Metadata GC Threshold/Full GC metadata, JFR ClassLoad/Unload during investigation; review process for reload/plugin/dynamic script features.'
    ],
  },
  'lab-gc-011': {
    title: 'Young GC 20 times per second: creating a new ObjectMapper per request and large log string concatenation',
    scenario: `REST payment service running Spring Boot 3 + JDK 17 in a container with 4 vCPU / 4 GB heap. After traffic increased, the GC log shows Young GC continuously ~20 times per second, GC CPU ~40%, p99 latency rising from 80 ms to 600 ms. JFR allocation profiling points to two hotspots: an ObjectMapper created for every request, and large concatenated log messages. Total heap ~1.2 GB, young gen ~300 MB, allocation rate ~6 GB/s. No Full GC; heap after young GC returns to ~200 MB.`,
    questions: [
      'What is the root cause of Young GC happening so frequently? Cite evidence from the GC log and JFR.',
      'How would you fix it in the short and long term, and how would you measure the improvement?'
    ],
    hints: [
      'Read the GC log: one young GC every ~50 ms, Eden 300 MB fills very quickly.',
      'JFR shows ObjectMapper.<init> accounts for 38% of allocations.',
      'Large concatenated log messages create temporary StringBuilder/char[].'
    ],
    answer: `**Summary:** Young GC happens 20 times per second because the allocation rate of ~6 GB/s far exceeds the collection throughput; the two main sources are an ObjectMapper created per request (38% of allocations) and large concatenated log messages. ObjectMapper is thread-safe and should be reused as a single instance; logging should use SLF4J parameterized messages. After the fix the allocation rate drops sharply.

### 1) Mechanism: why Young GC happens so often

Generational GC divides the heap into young and old generations. New objects are allocated in Eden. When Eden fills, the JVM triggers a Young GC. Each one is cheap (~4 ms) but 20 per second totals ~80 ms/s of GC CPU, causing continuous pauses.

### 2) Evidence from JFR

JFR ObjectAllocationInNewTLAB: ObjectMapper.<init> 38%. ObjectMapper is heavy (caches introspection). Creating one per request is an anti-pattern. StringBuilder.append 18%, Logger.info 12%.

### 3) Fix

Short term: use a single static final ObjectMapper instance; replace string concatenation in logs with SLF4J placeholders; reduce DEBUG logging in production.
Long term: enable Jackson Afterburner; increase young gen with -Xmn; monitor allocation rate with JFR.

### 4) Measurement

Re-run with -Xlog:gc and compare young GC frequency, GC CPU %, and p99.

### 5) Pitfall

Configuring an ObjectMapper after sharing it affects all threads. Increasing heap does not address the root cause.

> Senior tip: When you see frequent Young GC but no Full GC, do not just increase heap — open JFR Allocation profiling. In 80% of cases it is unnecessary object creation.`,
    rubric: [
      'Identifies the high allocation rate from the GC log: young GC ~20/s, Eden 300 MB fills every ~50 ms.',
      'Points to the JFR hotspots: ObjectMapper.<init> 38%, StringBuilder.append 18%, Logger.info 12%.',
      'Explains that ObjectMapper is thread-safe and should not be created per request.',
      'Proposes short-term/long-term fixes and measurement.',
      'Pitfall: configuring after sharing, and that increasing heap does not fix the root cause.'
    ],
  },
  'lab-gc-012': {
    title: 'OutOfMemoryError: Cannot reserve direct buffer memory (Netty/NIO)',
    scenario: `Gateway service using Netty 4 + Reactor Netty on JDK 17, container limit 2 GB (cgroup). After a few hours of running, the application throws OutOfMemoryError: Cannot reserve direct buffer memory and the container is OOMKilled by kubelet. jcmd VM.native_memory shows Direct (reserved/committed) ~1.8 GB while -XX:MaxDirectMemorySize=1g. Heap is only ~600 MB. There is evidence that Netty does not release ByteBuf (a reference count leak) in a custom handler.`,
    questions: [
      'What is the root cause of the direct buffer OOM? Cite evidence from the error log, NMT, and flags.',
      'How would you fix it in the short and long term, and how would you prevent recurrence?'
    ],
    hints: [
      'Direct memory is not part of the heap; NMT shows Direct committed ~1.8 GB > MaxDirectMemorySize 1 GB.',
      'Netty uses reference counting; if ByteBuf is not released it leaks direct memory.',
      'The container is OOMKilled because total native memory exceeds the cgroup limit.'
    ],
    answer: `**Summary:** The OOM "Cannot reserve direct buffer memory" occurs when direct (off-heap) memory exceeds -XX:MaxDirectMemorySize (1 GB), due to a Netty ByteBuf leak (reference count not released). Direct memory is not part of the heap, so -Xmx does not help. NMT shows Direct committed ~1.8 GB > 1 GB. Fix: release ByteBuf correctly, limit direct memory according to the container, and monitor NMT.

### 1) Mechanism: direct memory and Netty

ByteBuffer.allocateDirect allocates native (off-heap) memory outside the JVM heap. -XX:MaxDirectMemorySize caps total direct memory. When it is exceeded, the JVM throws OOM.

Netty manages ByteBuf with reference counting: each ByteBuf has a refCnt; once processing is done it must be release()d.

### 2) Evidence

error.log: stack trace through Netty PooledByteBufAllocator. nmt.txt: Direct committed ~1.93 GB > MaxDirectMemorySize 1 GB. Heap only 600 MB. Container limit 2 GB.

### 3) Root cause

A custom handler reads a ByteBuf but does not release() it in finally; the exception path also leaks.

### 4) Fix

Short term: release ByteBuf in finally; use SimpleChannelInboundHandler; enable leak detector PARANOID; reduce MaxDirectMemorySize.
Long term: audit handlers, codecs, filters; monitor NMT periodically.

### 5) Pitfall

Increasing -Xmx does not help direct memory. Netty's pooled allocator may retain memory in its cache.

> Senior tip: When facing OOM "Cannot reserve direct buffer memory", do not increase heap — run jcmd VM.native_memory summary and compare Direct committed against MaxDirectMemorySize.`,
    rubric: [
      'Distinguishes direct memory vs heap; NMT Direct committed ~1.93 GB > MaxDirectMemorySize 1 GB; heap only 600 MB.',
      'Points to Netty reference counting: an unreleased ByteBuf leaks direct memory.',
      'Links to container OOMKilled: total native memory exceeds the 2 GB cgroup limit.',
      'Proposes fixes: release in finally, SimpleChannelInboundHandler, leak detector, limit direct memory.',
      'Prevention: periodic NMT alerts, set container limit = Xmx + MaxDirect + margin.'
    ],
  }
});
