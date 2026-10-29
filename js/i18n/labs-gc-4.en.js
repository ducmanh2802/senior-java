/*
 * English translation of js/data/labs-gc.js — task T445. Format: js/core/i18n.js (content overlay).
 * ids: lab-gc-003 lab-gc-004
 */
(function () {
  'use strict';
  App.i18n.content({
    'lab-gc-003': {
      title: 'OutOfMemoryError: Metaspace after adding promotion rules written in Groovy',
      scenario: `**Context:** The e-commerce marketplace **ShopVN** runs the **price-engine** service (Spring Boot 3.2, JDK 17.0.10, Groovy 4.0) that computes shopping-cart prices. JVM: {{-Xmx2g -XX:MaxMetaspaceSize=256m -XX:+UseG1GC}}. Release **2.4** was deployed at **09:00 on October 21, 2026** and added a feature that lets merchants write their own promotion rules in Groovy, stored in the {{promotion_rule}} table. About 3% of pricing requests go through a Groovy rule, roughly 1.5 requests/second per pod.

**Symptoms:** At **14:50**, all 4 pods returned HTTP 500 one after another with {{java.lang.OutOfMemoryError: Metaspace}}. The heap was using only about 600 MB / 2 GB. A restart brings the pod back, but the forecast says the failure will repeat about 6 hours later. The dev team ran {{GC.class_histogram}} but found no unusual classes on the heap, so they proposed raising {{MaxMetaspaceSize}} to 1 GB.

**Data Collected:** {{jcmd 1 VM.classloader_stats}} at 13:52, hourly Prometheus metrics, the GC log and application log around the OOM, the {{PricingRuleEngine}} source code, and the result of a query on the rule table.`,
      questions: [
        'Why does the JVM throw OutOfMemoryError when the heap is only about 600 MB? Why does the class histogram show nothing unusual?',
        'Using classloader_stats and the metrics, prove the root cause: who creates the classes, and why are they never unloaded? If there are only 37 rules, how many classes should be needed?',
        'How would you fix this in the short term and in the long term? Is raising MaxMetaspaceSize to 1 GB, or removing the limit, a good idea? What alerts should be added?'
      ],
      hints: [
        'Metaspace holds class metadata (bytecode, methods, constant pool), not objects. Look at the Classes and Parent columns in classloader_stats: how many loaders are there, how many classes does each one load, and who is their parent?',
        'jvm_classes_unloaded_classes_total is always 0, while the class count grows by about 1.54 classes/second, exactly matching rule_eval/s. The last two Full GCs also fail to shrink Metaspace. That means the classes are still reachable.',
        'GroovyShell.parse(String) compiles a new class on every call (the script name is auto-generated), and the parent GroovyClassLoader keeps the generated classes in its cache. The shell is a field of a singleton bean.'
      ],
      answer: `**Summary:** This is a **class leak in Metaspace**. {{PricingRuleEngine}} calls {{shell.parse(script)}} on **every request**, so Groovy compiles **a new class each time** (each class is defined by its own {{GroovyClassLoader$InnerLoader}}). All of them are retained by the shell's {{GroovyClassLoader}}, and the shell is a field of a singleton bean, so no class is ever unloaded. There are only 37 rules, yet in 5 hours the service generated about 27 thousand classes and filled up {{MaxMetaspaceSize=256m}}.

### Why it OOMs with an empty heap

- **Metaspace** is native memory outside the heap; it holds class metadata: the Klass structure, methods, bytecode, and constant pool. It is bounded by {{-XX:MaxMetaspaceSize}} and has nothing to do with {{-Xmx}}.
- {{GC.class_histogram}} counts **objects on the heap**. A small Groovy class on the heap is just a {{java.lang.Class}} object of a few hundred bytes plus an InnerLoader, a few MB for 27 thousand classes, so it drowns in the noise. The heavy part (about 4.7 KB per class) lives in Metaspace, and the histogram cannot show it.
- **A class is unloaded only when its class loader becomes unreachable**, and that happens during GC (in G1, at Remark or Full GC). There is no mechanism to unload a single class on its own.

### Evidence

- {{classloader_stats}}: {{Total = 26919}} loaders, of which **26,914 are {{GroovyClassLoader$InnerLoader}} loaders**, each with **Classes 1** and ChunkSz 5120. All of them share **the same Parent 0x0000000800c62a40**, which is the single {{groovy.lang.GroovyClassLoader}} row (Classes 0), the loader of the shared shell. 26,914 × 5,120 bytes ≈ 131 MB, more than half of Metaspace.
- For comparison: {{LaunchedClassLoader}} (all of Spring, Hibernate, and application code) has only 14,871 classes and about 88 MB.
- Metrics: {{jvm_classes_loaded_classes}} grows steadily by about 5,544 classes/hour, i.e. 1.54 classes/second, **exactly matching {{rule_eval/s}}**. One evaluate call produces one class. {{jvm_classes_unloaded_classes_total}} is 0 for almost 6 hours. Metaspace grows about 26 MB/hour, while heap-after-GC stays flat at about 230–240 MB.
- {{promotion_rule}}: only **37 distinct scripts**, and the last update was the day before. Only 37 classes should be needed.
- GC log: {{Pause Young (Concurrent Start) (Metadata GC Threshold)}}, then {{Pause Remark}} (where G1 unloads classes) yet Metaspace stays {{261402K->261402K}}. The JVM then tries two Full GCs: {{Pause Full (Metadata GC Threshold)}} and {{Pause Full (Metadata GC Clear Soft References)}}, the final attempts before throwing OOM. Metaspace is still {{262101K->262101K}}, close to the 262144K (256 MB) ceiling, meaning **there is nothing to reclaim**; everything is reachable.
- Stack trace: the OOM happens in {{ClassLoader.defineClass1}}, called from {{GroovyShell.parse}} at {{PricingRuleEngine.evaluate(PricingRuleEngine.java:26)}}.
- The Hikari line {{Thread starvation or clock leap detected}} is only a consequence of the two ~1.2-second Full GCs, not the cause.

### How Groovy works internally

1. {{GroovyShell.parse(String)}} auto-generates a new script name (of the form ScriptNNN) on every call, so there is no cache hit: **every call is a compile**, even when the script content is identical.
2. {{GroovyClassLoader.doParseClass}} creates an {{InnerLoader}} (a child of the shell's loader) to define the new class, then **puts the class into the parent GroovyClassLoader's class cache**.
3. Reference chain: singleton bean {{PricingRuleEngine}} → {{shell}} → {{GroovyClassLoader}} → class cache → {{Class ScriptNNN}} → its InnerLoader. Because this chain is always reachable, no GC can unload it.

The "keep one shared shell" remark in the code review is only half right: a shared shell **plus** parsing on every request is exactly what turns it into an unbounded class repository. Creating a new shell per request would let classes unload at GC, but still burns CPU on compilation (a few ms each time) and keeps constant pressure on Metaspace and GC. Both approaches are wrong in the same place: **compiling in the hot path**.

### Fix

**Short term (hotfix):** compile each rule **once**, cache the Class by rule id and version, and create a new Script instance per request. Scripts are **not thread-safe** because they hold their own Binding, so you must not share a single Script instance between threads.

~~~java
private final GroovyClassLoader gcl = new GroovyClassLoader(getClass().getClassLoader());
private final Map<String, Class<? extends Script>> compiled = new ConcurrentHashMap<>();

@SuppressWarnings("unchecked")
public BigDecimal evaluate(PromotionRule rule, Cart cart) {
    String key = rule.getId() + ":" + rule.getVersion();          // recompile when the version changes
    Class<? extends Script> cls = compiled.computeIfAbsent(key,
            k -> (Class<? extends Script>) gcl.parseClass(rule.getScript(), "Rule_" + rule.getId() + "_v" + rule.getVersion() + ".groovy"));
    Script script = InvokerHelper.createScript(cls, new Binding(Map.of("cart", cart)));
    Object result = script.run();
    return result == null ? BigDecimal.ZERO : new BigDecimal(result.toString());
}
~~~

When a rule changes version, the old class stays in the {{gcl}} cache. There are two ways to handle it: use **a separate GroovyClassLoader for each full reload of the rule set** and drop the old loader (so the whole class tree becomes unloadable), or call {{gcl.clearCache()}} and clear the {{compiled}} map when rules change. The rule count is small (37), so the cost is negligible.

**Long term:**
- If rules are only conditional expressions and arithmetic, consider an **expression language that does not generate a class on each evaluation** (pre-parsed SpEL, or data-shaped rules such as a condition table), which is easier to control and audit.
- **Security:** Groovy scripts written by merchants running inside the payment JVM are equivalent to remote code execution. A sandbox is mandatory ({{SecureASTCustomizer}} with whitelisted imports and receivers, plus a runtime limit), rules must be reviewed before activation, or the engine should be isolated in a separate service with minimal privileges.

**Raise MaxMetaspaceSize to 1 GB or remove the limit?** No. That only postpones the incident from about 6 hours to about 35 hours. If you remove the limit (the default is unlimited), Metaspace will gradually eat into the container's memory limit and the pod will be **OOMKilled** with no stack trace, which is much harder to diagnose. Keeping a reasonable limit so the failure surfaces clearly is the right call.

### Prevention and alerts

- Alert when {{rate(jvm_classes_loaded_classes)}} is still positive 30 minutes after startup. In a stable application the class count is nearly flat after warm-up.
- Alert when Metaspace usage exceeds 80% of {{MaxMetaspaceSize}}, and when the GC log shows the {{Metadata GC Threshold}} cause repeating.
- Integration test: run 10,000 evaluates and assert that the class count grows by no more than the number of rules.
- Code review: ban {{GroovyShell.parse}}, {{GroovyClassLoader.parseClass}}, {{ScriptEngine.eval}} (with String scripts), {{Proxy.newProxyInstance}} with a new loader, and ByteBuddy or CGLIB class generation in the request path, unless there is a cache.

> Senior tip: When you see an OOM Metaspace, the first thing to run is {{jcmd <pid> VM.classloader_stats}} and look at **the number of loaders and their parents**. Thousands of loaders of the same type, each with 1–2 classes, almost always means dynamic class generation in the hot path (Groovy, JSR-223, proxies, bytecode generation). A few huge loaders that refuse to disappear are usually a leak from hot redeploy or a ThreadLocal holding an old loader. To find the class names, temporarily enable {{-Xlog:class+load=info}} on one pod, or use {{jcmd <pid> VM.metaspace show-loaders}} for more detail.`,
      rubric: [
        'Explain that Metaspace is native memory holding class metadata, separate from the heap; a heap histogram cannot see it, and a class is unloaded only when its loader becomes unreachable.',
        'Evidence: about 26,914 GroovyClassLoader$InnerLoader loaders with 1 class each, all children of a single GroovyClassLoader; the class count grows 1.54/s matching rule_eval/s; unloaded = 0; two Full GCs (Metadata GC Threshold, Clear Soft References) fail to shrink Metaspace.',
        'Identify the root cause correctly: shell.parse() on every request on a singleton GroovyShell generates a new class each time, and the class is retained in the GroovyClassLoader cache; only 37 rules means only 37 classes are needed.',
        'Propose compiling once and caching the Class by rule id and version, creating a new Script instance per request (Script is not thread-safe), with a way to release classes when rules change.',
        'Push back on raising or removing MaxMetaspaceSize (it only postpones the incident and can turn into OOMKilled), add alerts on class-loaded rate and Metaspace usage, and mention the security risk of merchant-written scripts.'
      ]
    },
    'lab-gc-004': {
      title: 'QR gateway pod OOMKilled while the heap uses only 40%',
      scenario: `**Context:** **PayFast** runs **qr-gateway** (Spring Boot 3.3 WebFlux, Reactor Netty, JDK 21.0.4), which receives QR payment callbacks from merchants and calls core banking. Kubernetes pod: request 1Gi, **limit 2Gi**, 2 vCPU. {{JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -XX:NativeMemoryTracking=summary}} (NMT had just been enabled after previous restarts). No {{-Xms}}, {{-Xss}}, or {{-XX:MaxDirectMemorySize}} is set.

**Symptoms:** On **October 21, 2026**, the pod restarted 6 times, most recently at **10:21:17**. Every restart has exit code 137, no {{OutOfMemoryError}} in the logs, and no heap dump. The JVM dashboard shows heap used at only about 600 MB / 1.5 GB (40%). From 09:40 to 10:10, core banking was slow (p99 from 300 ms to 4 seconds). From 08:10, merchant **M-2231** changed its callback signing secret but misconfigured it, so it kept receiving HTTP 401 and retrying.

**Data Collected:** {{kubectl describe pod}} and the node kernel log, Prometheus metrics over time, {{jcmd 1 VM.native_memory summary}} at 10:05, the Netty log, and the relevant code.`,
      questions: [
        'Why was the container OOMKilled when heap used is only about 40%? Build a "memory budget" for the process from NMT and the metrics, and point out the components outside the heap.',
        'Which component keeps growing, and why? Prove it using the relationship between the artifacts (when it started, growth rate, buffer count).',
        'Why did the JVM not throw OutOfMemoryError but get killed by the kernel? Propose a short-term fix, a correct JVM/container configuration, and suitable alerts.'
      ],
      hints: [
        'The container is killed based on the actual memory of the process (RSS), not heap used. Compare heap used with heap committed, then add up the committed entries in NMT.',
        'Direct ByteBuffers (including the Netty buffer pool) are under the Other section of NMT. Compare Other with direct_used, then divide direct_used by direct_count. What event in the scenario coincides with the point where direct memory starts growing?',
        'When -XX:MaxDirectMemorySize is not set, the default direct memory limit equals the max heap (1536 MiB). How much can heap plus direct reach compared with the 2Gi limit? And threads: do 412 threads × 1 MB stack really consume 412 MB of RAM?'
      ],
      answer: `**Summary:** The pod was killed because the **total memory of the process** (heap committed plus native memory) exceeded 2Gi, not because the heap was full. Two causes compound: (1) {{MaxRAMPercentage=75}} lets the heap take up to 1536 MiB, leaving only 512 MiB for everything else, while the basic non-heap portion is already about 450–500 MiB; (2) a **Netty direct buffer leak** in {{SignatureWebFilter}}: the 401 branch does not release the buffer, losing about 168 MB/hour since merchant M-2231 started sending bad signatures at 08:10. The thread count rising to 412 as core banking slowed made things worse, but was not the main cause.

### Memory budget at 10:05 (NMT, committed)

| Component | Committed | Notes |
|---|---|---|
| Java Heap | 1,170 MB | used is only 610 MB, but committed is what occupies RAM; it can reach 1,536 MB |
| Other (direct buffers) | **392 MB** | growing continuously |
| Metaspace + Class + Shared class space | 142 MB | stable |
| GC (G1 remembered sets, bitmaps) | 80 MB | proportional to heap size |
| Thread (412 threads) | 70 MB | stack reserved 413 MB but only 67 MB committed |
| Code cache | 58 MB | stable |
| Symbol, NMT, Internal and other | 39 MB | stable |
| **Total** | **1,997,510 KB ≈ 1.90 GiB** | matches {{working_set 1.90 GiB}} at 10:05 |

At 10:20, heap committed was 1,212 MB and direct 434 MB, and the working set reached 1.99 GiB. G1 only needs to expand the heap by a few dozen MB more (still valid, since the max is 1,536 MB) to hit the limit: {{memory: usage 2097152kB, limit 2097152kB}} and {{anon-rss:2081256kB}}.

Two traps when reading dashboards:
- **Heap used is not heap committed.** The container pays for the committed portion (heap pages G1 has touched), not the used portion. G1 almost never returns memory to the OS without a Full GC or periodic GC.
- **Thread stack reserved is not committed.** The default {{-Xss}} of 1 MB is reserved virtual memory. Actual RAM is only the stack that has been used: {{stack: reserved=422912KB, committed=69040KB}}, about 170 KB per thread. So "412 threads × 1 MB = 412 MB" is wrong.

### Direct memory leak: the evidence

1. NMT {{Other committed=401408KB}} (392 MB) matches {{direct_used 392 MB}} at 10:05. This is memory allocated through direct ByteBuffers.
2. 392 MB / 98 buffers ≈ **4 MB per buffer**, exactly the size of a chunk in Netty 4.1's {{PooledByteBufAllocator}}. The pool keeps allocating new chunks because old chunks still hold buffers that nobody returns.
3. Timing and rate: direct memory was 66 MB at 08:05 (the base pool) and started growing **at 08:10, exactly when M-2231 began receiving 401s**. The growth is steady at about 168 MB/hour (126 → 210 → 294 → 378 MB every 30 minutes) and does not depend on core banking being slow or fast. At about 5.2 requests 401 per second, each request loses about 9 KB, roughly a callback body after joining.
4. Log {{ResourceLeakDetector}}: {{LEAK: ByteBuf.release() was not called before it's garbage-collected}}. The default SIMPLE level samples only a small fraction of buffers so the log is sparse, but this is direct confirmation.
5. Code: {{DataBufferUtils.join}} creates a pooled buffer. The {{!hmac.verify}} branch returns {{setComplete()}} **without calling** {{DataBufferUtils.release(body)}}. Only the valid branch releases. Before 08:10 there were almost no bad-signature requests, so the leak stayed hidden.

### Why there is no OutOfMemoryError

{{-XX:MaxDirectMemorySize}} is not set, so the default limit equals the max heap, i.e. 1536 MiB. In theory heap 1536 plus direct 1536 plus non-heap about 450 is more than 3.4 GiB, far above the 2 GiB limit. The JVM never reached its own limits, so the **kernel cgroup** struck first with SIGKILL (exit 137). The JVM had no chance to log or dump. This is why all JVM sizing must **add up to less than the container limit**.

### Threads: a contributing factor

From 09:40, {{cb_p99}} rose to about 4 seconds. {{newCachedThreadPool}} is unbounded, so it creates a new thread for every in-flight call, and the thread count grew from about 100 to 412. This only added about 50 MB of RAM, but it is a sign of a missing bulkhead: if core banking stays slow for longer, the thread count could reach thousands and pile even more load onto core banking.

### Fix

**Short term (same-day hotfix):**
1. Release the buffer on **every** branch:

~~~java
return DataBufferUtils.join(request.getBody())
    .flatMap(body -> {
        byte[] bytes = new byte[body.readableByteCount()];
        body.read(bytes);
        DataBufferUtils.release(body);          // release right after copying, before any branch
        if (!hmac.verify(bytes, request.getHeaders().getFirst("X-Signature"))) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
        return chain.filter(exchange.mutate().request(replay(request, bytes)).build());
    });
~~~

Also limit the body size before joining, e.g. with {{DataBufferUtils.join(body, maxBytes)}} (Spring 5.3.x and later), to reject oversized callbacks.

2. Configure the JVM so the total is below the limit and failures surface inside the JVM instead of being killed: {{-XX:MaxRAMPercentage=55}} (heap about 1126 MiB) or {{-Xmx1100m -Xms1100m}}, plus {{-XX:MaxDirectMemorySize=256m}}. When exceeded, Netty throws a direct memory error with a stack trace instead of the pod dying silently.
3. Replace {{newCachedThreadPool}} with a bounded pool (e.g. 64 threads with a bounded queue), or use virtual threads on JDK 21 with a {{Semaphore}} or bulkhead to bound concurrent calls to core banking.
4. Work with M-2231 to fix the secret; temporarily rate-limit 401 requests per merchant.

**Long term:**
- Define a memory budget for each service: heap + MaxDirectMemorySize + metaspace + code cache + GC overhead (about 5–8% of the heap with G1) + threads × actual stack + 10–15% headroom ≤ limit.
- Run integration and staging tests with {{-Dio.netty.leakDetection.level=paranoid}} and fail tests when a LEAK log appears. Write dedicated tests for the error branches (401, 400, timeout) of every filter that reads the body.
- Set {{-Xms}} equal to {{-Xmx}} for critical services so heap committed is fixed from the start. If the budget is wrong, the pod dies at startup or during a load test instead of at 10 a.m.

### Alerts and monitoring

- {{container_memory_working_set_bytes / limit > 0.9}} for 5 minutes. This is the metric closest to the OOM killer's criterion, more important than heap used.
- Direct memory growing continuously: the {{deriv}} of {{jvm_buffer_memory_used_bytes}} (id="direct") over 30 minutes staying positive for an hour, or crossing an absolute threshold.
- Count log lines containing {{LEAK:}} from ResourceLeakDetector: alert on the very first line.
- {{jvm_threads_live_threads}} above a threshold, plus pool metrics (active, queue) of the executor calling core banking.
- Watch {{kube_pod_container_status_last_terminated_reason}} with reason="OOMKilled" together with the restart count.

> Senior tip: When a pod is OOMKilled but the heap looks fine, enable {{-XX:NativeMemoryTracking=summary}} (low overhead) and capture {{VM.native_memory summary}} twice, 30–60 minutes apart. You can also use {{VM.native_memory baseline}} then {{summary.diff}} to see immediately which section is growing. If RSS (e.g. {{anon-rss}} in the kernel log) is significantly larger than total NMT committed at the same moment, the difference is usually glibc malloc fragmentation (which can be reduced with {{MALLOC_ARENA_MAX=2}}) or a native library that NMT does not track. On Kubernetes, I always keep at least 25–30% of the limit for off-heap memory on Netty-based services, and I never leave MaxDirectMemorySize at its default.`,
      rubric: [
        'Explain that OOMKilled is caused by total RSS (heap committed plus native) exceeding the 2Gi limit, not heap used; build the budget from NMT (about 1.90 GiB at 10:05, matching the working set) and show that MaxRAMPercentage=75 leaves only about 512 MiB for non-heap.',
        'Identify the direct buffer leak: NMT Other 392 MB matches direct_used, about 4 MB per buffer (a Netty pool chunk), growth starting at 08:10 together with M-2231\'s 401s, the ResourceLeakDetector log, and the 401 branch in SignatureWebFilter not releasing.',
        'Explain why there is no OutOfMemoryError: MaxDirectMemorySize defaults to max heap, so the JVM limit is larger than the container limit and the kernel kills with exit 137.',
        'Place the thread factor correctly: newCachedThreadPool grows to 412 threads while core banking is slow, but stack committed is only about 69 MB (reserved differs from committed).',
        'Propose: release buffers on every branch, lower the heap and set MaxDirectMemorySize, a bounded executor or bulkhead, paranoid leak detection in tests, alerts on working set / limit, direct memory, and LEAK logs.'
      ]
    }
  });
})();
