App.i18n.content({
  'lab-gc-003': {
    title: 'OutOfMemoryError: Metaspace after adding Groovy-based promotion rules',
    scenario: `**Background:** E-commerce platform **ShopVN** has a service **price-engine** (Spring Boot 3.2, JDK 17.0.10, Groovy 4.0) that calculates cart prices. JVM: {{-Xmx2g -XX:MaxMetaspaceSize=256m -XX:+UseG1GC}}. Version **2.4** deployed at **09:00 on 21/10/2026** added a feature for merchants to write their own promotion rules using Groovy, stored in the {{promotion_rule}} table. Approximately 3% of price calculation requests go through Groovy rules, equivalent to 1.5 requests/second per pod.
    
**Symptoms:** At **14:50**, all 4 pods returned HTTP 500 with {{java.lang.OutOfMemoryError: Metaspace}}. The heap was only using about 600 MB / 2 GB. Restarting fixed it, but the projection showed it would recur in about 6 hours. The dev already ran {{GC.class_histogram}} but saw nothing unusual on the heap, so they proposed increasing {{MaxMetaspaceSize}} to 1 GB.
    
**Data collected:** {{jcmd 1 VM.classloader_stats}} at 13:52, hourly Prometheus metrics, GC log and application log at the time of OOM, source code of {{PricingRuleEngine}}, and the query results from the rule table.`,
    questions: [
      'Why did the JVM throw OutOfMemoryError even though the heap was only around 600 MB? Why did the class histogram not show anything unusual?',
      'From the classloader_stats and metrics, prove the root cause: who creates the classes, and why are they never unloaded? With only 37 rules, how many classes should be needed?',
      'How would you fix this in the short and long term? Is increasing MaxMetaspaceSize to 1 GB or removing the limit a good idea? What alerts should be added?'
    ],
    hints: [
      'Metaspace contains class metadata (bytecode, methods, constant pool), not objects. Look at the Class count and Parent in classloader_stats: how many loaders are there, how many classes does each loader define, and who are their parents?',
      'jvm_classes_unloaded_classes_total is always 0, while the number of classes increases by about 1.54 classes/second, exactly matching rule_eval/s. Even the last two Full GCs did not reduce Metaspace. This means the classes are still reachable.',
      'GroovyShell.parse(String) compiles a new class every time it is called (with an auto-generated script name), and the parent GroovyClassLoader keeps the generated class in its cache. The shell is a field of a singleton bean.'
    ],
    answer: `**Summary:** This is a **class leak in Metaspace**. {{PricingRuleEngine}} calls {{shell.parse(script)}} **per request**, so Groovy compiles **a new class each time** (each class is defined by a separate {{GroovyClassLoader$InnerLoader}}). All of them are kept by the {{GroovyClassLoader}} of the shell, and since the shell is a field of a singleton bean, no class can ever be unloaded. There are only 37 rules, but in 5 hours, about 27 thousand classes were generated, filling up the {{MaxMetaspaceSize=256m}}.
    
### Why the heap is empty but OOM happens
    
- **Metaspace** is native memory, outside the heap, containing class metadata: Klass structure, methods, bytecode, constant pool. It is limited by {{-XX:MaxMetaspaceSize}}, unrelated to {{-Xmx}}.
- {{GC.class_histogram}} counts **objects on the heap**. A small Groovy class on the heap is just a {{java.lang.Class}} object of a few hundred bytes plus one InnerLoader, meaning a few MB for 27 thousand classes, so it gets lost in the noise. The heavy part (about 4.7 KB per class) resides in Metaspace, which the histogram does not show.
- **Classes are only unloaded when their class loader is unreachable**, and this happens during GC (in G1, during Remark or Full GC). There is no mechanism to unload individual classes separately.
    
### Evidence
    
- {{classloader_stats}}: {{Total = 26919}} loaders, of which **26,914 loaders are {{GroovyClassLoader$InnerLoader}}**, each with **1 Class**, ChunkSz 5120. All have the **same Parent 0x0000000800c62a40**, which is the single {{GroovyClassLoader}} row (0 Classes), the loader of the shared shell. 26,914 × 5,120 bytes ≈ 131 MB, occupying more than half of Metaspace.
- Comparison: {{LaunchedClassLoader}} (all of Spring, Hibernate, application code) only has 14,871 classes and about 88 MB.
- Metrics: {{jvm_classes_loaded_classes}} steadily increases by about 5,544 classes/hour, or 1.54 classes/second, **exactly matching {{rule_eval/s}}**. One evaluation generates one class. {{jvm_classes_unloaded_classes_total}} has been 0 for nearly 6 hours. Metaspace increased by about 26 MB/hour, while the heap after GC remained flat at around 230–240 MB.
- {{promotion_rule}}: only **37 distinct scripts**, and the last update was yesterday. It should have only needed 37 classes.
- GC log: {{Pause Young (Concurrent Start) (Metadata GC Threshold)}}, followed by {{Pause Remark}} (where G1 unloads classes), but Metaspace remains {{261402K->261402K}}. Subsequently, the JVM attempts two Full GCs: {{Pause Full (Metadata GC Threshold)}} and {{Pause Full (Metadata GC Clear Soft References)}}, the last efforts before throwing OOM. Metaspace remains {{262101K->262101K}}, near the 262144K (256 MB) limit, meaning **there is nothing to reclaim**, all are reachable.
- Stack trace: OOM occurs in {{ClassLoader.defineClass1}}, called from {{GroovyShell.parse}} at {{PricingRuleEngine.evaluate(PricingRuleEngine.java:26)}}.
    
### Groovy Internals
    
1. {{GroovyShell.parse(String)}} automatically assigns a new script name (e.g., ScriptNNN) for each call, so there is no cache hit: **each call is a compilation**, even if the script content is identical.
2. {{GroovyClassLoader.doParseClass}} creates an {{InnerLoader}} (child of the shell's loader) to define the new class, then **adds the class to the class cache of the parent GroovyClassLoader**.
3. Reference chain: singleton bean {{PricingRuleEngine}} → {{shell}} → {{GroovyClassLoader}} → class cache → {{Class ScriptNNN}} → its InnerLoader. Since this chain is always reachable, no GC can unload them.
    
### How to fix
    
**Short-term (hotfix):** Compile each rule **once**, cache the Class by rule ID and version, and create a new Script instance per request. Scripts **are not thread-safe** because they hold their own Binding, so a single Script instance cannot be shared among threads.
    
~~~java
private final GroovyClassLoader gcl = new GroovyClassLoader(getClass().getClassLoader());
private final Map<String, Class<? extends Script>> compiled = new ConcurrentHashMap<>();
    
@SuppressWarnings("unchecked")
public BigDecimal evaluate(PromotionRule rule, Cart cart) {
    String key = rule.getId() + ":" + rule.getVersion();
    Class<? extends Script> cls = compiled.computeIfAbsent(key,
            k -> (Class<? extends Script>) gcl.parseClass(rule.getScript(), "Rule_" + rule.getId() + "_v" + rule.getVersion() + ".groovy"));
    Script script = InvokerHelper.createScript(cls, new Binding(Map.of("cart", cart)));
    Object result = script.run();
    return result == null ? BigDecimal.ZERO : new BigDecimal(result.toString());
}
~~~
    
When a rule version changes, the old class remains in the cache of {{gcl}}. There are two ways to handle this: use **a separate GroovyClassLoader for each full rule reload** and then discard the old loader (allowing the whole tree of classes to be unloaded), or call {{gcl.clearCache()}} and clear the {{compiled}} map when a rule changes. Since the number of rules is small (37), the cost is negligible.
    
**Long-term:**
- If rules are just conditional expressions and calculations, consider an **expression language that does not generate a new class for every evaluation** (SpEL pre-parsed, or data-driven rules like condition tables), which is easier to control and audit.
- **Security:** Groovy scripts written by merchants running in the payment JVM are equivalent to remote code execution. Mandatory use of a sandbox ({{SecureASTCustomizer}} with import and receiver whitelisting, execution time limiting), review rules before activation, or isolate into a separate service with minimal privileges.
    
**Is increasing MaxMetaspaceSize to 1 GB or removing the limit a good idea?** No. Doing so only delays the issue from about 6 hours to about 35 hours. If the limit is removed, Metaspace will gradually eat into the container's memory limit, and the pod will be **OOMKilled** without a stack trace, making it much harder to diagnose. Keeping a reasonable limit is correct to let the error surface clearly.
    
### Prevention and alerts
    
- Alert when {{rate(jvm_classes_loaded_classes)}} is still positive 30 minutes after startup. For stable applications, the number of classes should be nearly flat after warm-up.
- Alert when Metaspace usage is over 80% of {{MaxMetaspaceSize}}, and when GC log has continuous {{Metadata GC Threshold}} causes.
- Integration test: run 10,000 evaluations, assert that the number of classes does not increase by more than the number of rules.
- Code review: ban {{GroovyShell.parse}}, {{GroovyClassLoader.parseClass}}, {{ScriptEngine.eval}} (with String-based scripts), {{Proxy.newProxyInstance}} with a new loader, ByteBuddy or CGLIB creating classes in the request path, unless cached.
    
> Senior tip: When you see Metaspace OOM, the first thing to do is run {{jcmd <pid> VM.classloader_stats}} and look at the **number of loaders and their parents**. Thousands of loaders of the same type, each with 1–2 classes, are almost always dynamically generated classes in the hot path (Groovy, JSR-223, proxies, bytecode generation). A few huge loaders that refuse to disappear are typically leaks due to hot redeploys or ThreadLocals holding old loaders. To know the class names, temporarily turn on {{-Xlog:class+load=info}} on a pod, or use {{jcmd <pid> VM.metaspace show-loaders}} to see details.`,
    rubric: [
      'Explain Metaspace is native memory for class metadata, separate from heap; heap histogram cannot show this, classes only unload when their loader is unreachable.',
      'Evidence: ~26,914 GroovyClassLoader$InnerLoader, each with 1 class, parented by a single GroovyClassLoader; classes increase at 1.54/s matching rule_eval/s; unloaded=0; two Full GCs failed to reduce Metaspace.',
      'Identify root cause: shell.parse() per request on a singleton GroovyShell, each generates a new class kept in GroovyClassLoader cache; 37 rules should only need 37 classes.',
      'Fix: compile once and cache Class by rule id and version, create new Script instance per request (not thread-safe), with a way to release classes when rules change.',
      'Refute increasing/removing MaxMetaspaceSize (only delays, may lead to OOMKilled), and alert on class loaded rate and Metaspace usage; warn about security risks of merchant-written scripts.'
    ]
  },
  'lab-gc-004': {
    title: 'Pod QR gateway OOMKilled while heap used only 40%',
    scenario: `**Background:** **PayFast** operates **qr-gateway** (Spring Boot 3.3 WebFlux, Reactor Netty, JDK 21.0.4) receiving QR payment callbacks from merchants and calling core banking. Kubernetes pod: request 1Gi, **limit 2Gi**, 2 vCPU. {{JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -XX:NativeMemoryTracking=summary}}. No {{-Xms}}, {{-Xss}} or {{-XX:MaxDirectMemorySize}} set.
    
**Symptoms:** On **21/10/2026**, the pod restarted 6 times, the most recent at **10:21:17**. Each restart has exit code 137, no {{OutOfMemoryError}} in logs, no heap dump. JVM dashboard shows heap used only around 600 MB / 1.5 GB (40%). From 09:40 to 10:10, core banking was slow (p99 from 300 ms to 4 seconds). From 08:10, merchant **M-2231** changed the callback signing secret but configured it incorrectly, thus constantly receiving HTTP 401s and resending them.
    
**Data collected:** {{kubectl describe pod}} and node kernel logs, Prometheus metrics over time, {{jcmd 1 VM.native_memory summary}} at 10:05, Netty logs, and relevant code.`,
    questions: [
      'Why was the container OOMKilled while heap used was only about 40%? Draw up a "memory budget" for the process from NMT and metrics, pointing out components outside the heap.',
      'Which component is increasing continuously and why? Prove it with the link between artifacts (start time, growth rate, number of buffers).',
      'Why did the JVM not throw OutOfMemoryError but instead got killed by the kernel? Propose short-term fixes, correct JVM/container configuration, and appropriate alerts.'
    ],
    hints: [
      'Container is killed based on actual process memory (RSS), not heap used. Compare heap used with heap committed, then sum up the committed items in NMT.',
      'Direct ByteBuffer (including Netty\'s buffer pool) is in the "Other" category of NMT. Compare "Other" with direct_used, then divide direct_used by direct_count. Does the time direct memory started to increase match any event in the scenario?',
      'Without setting -XX:MaxDirectMemorySize, the default limit for direct memory is equal to max heap (1536 MiB). How high can total heap + direct go compared to the 2Gi limit? And threads: do 412 threads × 1 MB stack really consume 412 MB of RAM?'
    ],
    answer: `**Summary:** The pod was killed because **total process memory** (heap committed plus native memory) exceeded 2Gi, not because the heap was full. Two causes combined: (1) {{MaxRAMPercentage=75}} allows heap to occupy up to 1536 MiB, leaving only 512 MiB for everything else, while basic non-heap components already take about 450–500 MiB; (2) **direct buffer leak in Netty** within {{SignatureWebFilter}}: branches returning 401 do not release buffers, leaking about 168 MB/hour since merchant M-2231 started sending incorrect signatures at 08:10. Threads increasing to 412 when core banking slowed down made the situation worse, but it was not the main cause.
    
### Memory budget at 10:05 (NMT, committed)
    
| Component | Committed | Notes |
|---|---|---|
| Java Heap | 1,170 MB | used only 610 MB, but committed is the portion taking RAM; can reach up to 1,536 MB |
| Other (direct buffer) | **392 MB** | increasing continuously |
| Metaspace + Class + Shared class space | 142 MB | stable |
| GC (remembered set, bitmap of G1) | 80 MB | proportional to heap size |
| Thread (412 threads) | 70 MB | stack reserved 413 MB but committed only 67 MB |
| Code cache | 58 MB | stable |
| Symbol, NMT, Internal and others | 39 MB | stable |
| **Total** | **1,997,510 KB ≈ 1.90 GiB** | matches {{working_set 1.90 GiB}} at 10:05 |
    
At 10:20, heap committed 1,212 MB and direct 434 MB, working set reached 1.99 GiB. Just letting G1 expand the heap by a few dozen MB more (still valid as max is 1,536 MB) is enough to hit the limit: {{memory: usage 2097152kB, limit 2097152kB}} and {{anon-rss:2081256kB}}.
    
Two traps when reading dashboards:
- **Heap used is different from heap committed.** The container pays for the committed portion (pages G1 has touched), not the used portion. G1 almost never returns memory to the OS without a Full GC or periodic GC.
- **Thread stack reserved is different from committed.** {{-Xss}} default 1 MB is virtual memory reserved. Actual RAM is just the stack used: {{stack: reserved=422912KB, committed=69040KB}}, about 170 KB per thread. Thus "412 threads × 1 MB = 412 MB" is incorrect.
    
### Direct memory leak: evidence
    
1. NMT {{Other committed=401408KB}} (392 MB) matches {{direct_used 392 MB}} at 10:05. This is memory allocated via direct ByteBuffer.
2. 392 MB / 98 buffers ≈ **4 MB per buffer**, the exact size of one chunk of {{PooledByteBufAllocator}} in Netty 4.1. The pool has to allocate new chunks because old ones have buffers that are kept and never returned.
3. Timing and rate: direct was at 66 MB at 08:05 (base pool), started increasing **at 08:10, exactly when M-2231 started receiving 401s**. The rate increases steadily by about 168 MB/hour (126 → 210 → 294 → 378 MB every 30 minutes) and is independent of whether core banking is slow or fast. With about 5.2 401 requests per second, each request leaks about 9 KB, the size of a callback body after joining.
4. Log {{ResourceLeakDetector}}: {{LEAK: ByteBuf.release() was not called before it\'s garbage-collected}}. The default SIMPLE level only samples a small fraction of buffers, so the log is sparse, but this is a direct confirmation.
5. Code: {{DataBufferUtils.join}} creates a pooled buffer. The {{!hmac.verify}} branch returns {{setComplete()}} **without calling** {{DataBufferUtils.release(body)}}. Only the successful branch releases. Before 08:10, there were almost no requests with wrong signatures, so the leak didn\'t show.
    
### Why no OutOfMemoryError
    
{{-XX:MaxDirectMemorySize}} was not set, so the default limit equals max heap, i.e., 1536 MiB. Theoretically, heap 1536 + direct 1536 + non-heap around 450 is over 3.4 GiB, far exceeding the 2 GiB limit. The JVM never hit its own limits, so the **kernel cgroup** was the one to act first via SIGKILL (exit 137). The JVM had no chance to log or dump. This is why all JVM parameters must **sum up to less than the container limit**.
    
### Thread: additional factor
    
From 09:40, {{cb_p99}} increased to about 4 seconds. {{newCachedThreadPool}} has no limit, so it created new threads for each waiting call, increasing the thread count from about 100 to 412. This only added about 50 MB of RAM, but it\'s a sign of a lack of bulkhead: if core banking stays slow longer, the thread count could reach thousands and add even more load to core banking.
    
### How to fix
    
**Short-term (hotfix):**
1. Release buffers in **every** branch:
    
~~~java
return DataBufferUtils.join(request.getBody())
    .flatMap(body -> {
        byte[] bytes = new byte[body.readableByteCount()];
        body.read(bytes);
        DataBufferUtils.release(body);          // release immediately after reading, before branching
        if (!hmac.verify(bytes, request.getHeaders().getFirst("X-Signature"))) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
        return chain.filter(exchange.mutate().request(replay(request, bytes)).build());
    });
~~~
    
Should limit body size before joining, e.g., using {{DataBufferUtils.join(body, maxBytes)}} (Spring 5.3.x+), to block overly large callbacks.
    
2. Configure JVM so the total is less than the limit and errors surface in the JVM instead of being killed: {{-XX:MaxRAMPercentage=55}} (heap about 1126 MiB) or {{-Xmx1100m -Xms1100m}}, combined with {{-XX:MaxDirectMemorySize=256m}}. When exceeded, Netty will throw a direct memory error with a stack trace, instead of the pod dying silently.
3. Replace {{newCachedThreadPool}} with a limited-size pool (e.g., 64 threads with limited queue), or use virtual threads on JDK 21 combined with {{Semaphore}} or bulkhead to limit concurrent calls to core banking.
4. Work with M-2231 to fix the secret; temporarily rate-limit by merchant for 401 requests.
    
**Long-term:**
- Establish a memory budget for each service: heap + MaxDirectMemorySize + metaspace + code cache + GC overhead (about 5–8% heap with G1) + threads × actual stack + 10–15% buffer ≤ limit.
- Run integration and staging tests with {{-Dio.netty.leakDetection.level=paranoid}} and fail tests on LEAK logs. Write dedicated tests for failure branches (401, 400, timeout) of all filters reading the body.
- Set {{-Xms}} equal to {{-Xmx}} for critical services, to fix heap committed from the start. If the budget is wrong, the pod will die immediately upon startup or load testing, instead of at 10 AM.
    
### Alerts and monitoring
    
- {{container_memory_working_set_bytes / limit > 0.9}} for 5 minutes. This is the indicator closest to the OOM killer\'s criteria, more important than heap used.
- Direct memory increasing continuously: {{deriv}} of {{jvm_buffer_memory_used_bytes}} (id="direct") over 30 minutes positive for over 1 hour, or exceeds absolute threshold.
- Count log lines containing {{LEAK:}} from ResourceLeakDetector: alert immediately from the first line.
- {{jvm_threads_live_threads}} exceeding threshold, and metrics about the pool (active, queue) of the executor calling core banking.
- Monitor {{kube_pod_container_status_last_terminated_reason}} with reason="OOMKilled" along with restart count.
    
> Senior tip: When a pod is OOMKilled but heap looks fine, enable {{-XX:NativeMemoryTracking=summary}} (low overhead) and take {{VM.native_memory summary}} snapshots 30–60 minutes apart. You can use {{VM.native_memory baseline}} then {{summary.diff}} to instantly see what increased. If RSS (e.g., {{anon-rss}} in kernel log) is significantly larger than total NMT committed at the same time, the difference is often glibc malloc fragmentation (can be reduced by {{MALLOC_ARENA_MAX=2}}) or native libraries that NMT doesn\'t track. In Kubernetes, I always reserve at least 25–30% of the limit for non-heap components with services using Netty, and never leave MaxDirectMemorySize at the default value.`,
    rubric: [
      'Explain OOMKilled is due to total RSS (heap committed plus native) exceeding the 2Gi limit, not heap used; established budget from NMT (about 1.90 GiB at 10:05, matching working set) and pointed out MaxRAMPercentage=75 leaves only ~512 MiB for non-heap.',
      'Identify direct buffer leak: NMT Other 392 MB matches direct_used, ~4 MB per buffer (Netty pool chunk), increasing from 08:10 with M-2231\'s 401s, ResourceLeakDetector log, 401 branch in SignatureWebFilter not releasing.',
      'Explain why no OutOfMemoryError: MaxDirectMemorySize defaults to max heap so JVM limit > container limit, kernel kills with exit 137.',
      'Acknowledge thread role: newCachedThreadPool increased to 412 threads when core banking slowed, but stack committed is only ~69 MB (reserved != committed).',
      'Fixes: release buffer on all branches, reduce heap + MaxDirectMemorySize, executor with limits or bulkhead, paranoid leak detection in tests, alert on working set / limit, direct memory and LEAK logs.'
    ]
  }
});