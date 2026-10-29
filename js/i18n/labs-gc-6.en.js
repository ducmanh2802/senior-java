/*
 * English translation of js/data/labs-gc.js — task T447. Format: js/core/i18n.js (content overlay).
 * ids: lab-gc-007 lab-gc-008
 */
App.i18n.content({
  'lab-gc-007': {
    title: 'Moving to Kubernetes with a 1-CPU limit: the JVM picks Serial GC and a 384 MB heap',
    scenario: `**Context:** **PayVN Merchant API** (Spring Boot 3.4, JDK 21.0.4) used to run on a 4 vCPU / 8 GB VM with {{-Xmx2g}}, p99 ~60 ms. This week the team moved it to Kubernetes using the {{eclipse-temurin:21-jre}} image, with a Dockerfile that only has {{ENTRYPOINT ["java", "-jar", "/app.jar"]}} (no JVM flags at all). The manifest sets {{requests: cpu 500m, memory 1536Mi}} and {{limits: cpu "1", memory 1536Mi}} "to save cost".

**Symptoms:** After moving 100% of traffic over (09:00 on October 26, 2026), p99 rose to **450 ms**, with occasional requests **> 1.1 seconds**. The pod is not OOMKilled; {{kubectl top}} shows memory usage of only **~640Mi / 1536Mi**, so the team concluded "it is not a memory problem" and planned to add replicas.

**Data collected:** The first lines of the GC log ({{-Xlog:gc*}} temporarily enabled through {{JAVA_TOOL_OPTIONS}}), the log excerpt at ~09:13, {{jstat -gcutil}}, {{-XX:+PrintFlagsFinal}} run inside the pod, and the CPU throttling metric.`,
    questions: [
      'Why did the JVM pick Serial GC and a maximum heap of 384 MB when nobody configured anything? Explain ergonomics inside a container.',
      'Read the GC log: what happens to the old generation (Tenured), and why are Full GCs happening continuously? Compute the fraction of time spent in GC.',
      'Why does "the pod only uses 640Mi / 1536Mi" fail to prove there is no memory problem? Propose the correct configuration for the pod and the JVM.'
    ],
    hints: [
      'The first lines of the GC log: "Using Serial", "CPUs: 16 total, 1 available", "Memory: 1536M", "Heap Max Capacity: 384M". The JVM only treats the machine as "server class" (and picks G1) when there are at least 2 CPUs and about 1792 MB of RAM.',
      'MaxRAMPercentage defaults to 25%: 25% × 1536M = 384M. Tenured only has 256M; after a Full GC there are still 201M of live data (~77%).',
      'jstat: 1262 young + 27 full in 820 seconds, GCT 57.3 s. With 1 CPU throttled 41%, every pause is stretched, and Serial GC stops the whole application.'
    ],
    answer: `**Summary:** No JVM flags are set, so the JVM uses **ergonomics**: inside the container it sees **1 CPU** (from the limit) and **1536 MB** (from the memory limit). With fewer than 2 CPUs, the JVM does not treat this as a "server class machine", so it picks **Serial GC** (a single thread that stops the whole application) instead of G1; and the default maximum heap = **25% of RAM = 384 MB**. The app's live data of ~200 MB takes up ~77% of the 256 MB old gen, so there is a **Full GC every ~30 seconds** (577 ms each) and a young GC every ~0.6 seconds. The pod uses only 640Mi because the JVM is capped, not because the app is light on memory. Fix: set {{-XX:MaxRAMPercentage=75}}, raise the CPU limit to 2 (or remove the limit), and declare the GC explicitly.

### First principles: how the JVM picks its own configuration

With no flags, HotSpot decides for itself ("ergonomics") based on the hardware it **can see**. Since JDK 10 (and 8u191), the JVM is **container-aware**: it reads cgroups to get the CPU quota and memory limit instead of the whole node's hardware. In this pod:

~~~text
Node: 16 vCPU, 64 GB          Container (cgroup): cpu limit 1, memory limit 1536Mi
                                       |
                    JVM sees: 1 CPU available, 1536 MB RAM
                                       |
   Server-class?  needs >= 2 CPU AND >= ~1792 MB  -> NO (1 CPU, 1536 MB)
                                       |
   Default GC:    Serial GC  (instead of G1)
   Max heap:      MaxRAMPercentage 25%  x 1536M = 384M
   Initial heap:  1/64 x 1536M = 24M,   Min heap 8M
   Young/Old:     NewRatio=2 -> young 128M (eden 102.4M + 2 survivor 12.8M), old (Tenured) 256M
~~~

Note that {{requests: cpu 500m}} has no effect: since JDK 19 the JVM ignores cpu shares and uses only the **quota (limit)** to compute the CPU count. The pair "1 CPU, 1.5 GB" is a common "cost-saving" configuration, and it lands right below both thresholds.

**Serial GC** uses **one thread** to collect garbage and **stops the whole application** on every collection (young and full alike). It suits small apps with a few hundred MB of heap, 1 CPU and no need for low latency — not a payment API targeting a p99 under 100 ms.

### Reading the GC log step by step

- {{GC(1286) Pause Young}}: Eden is full (104832K) → live objects are copied to survivor (12800K) and **11,120K is pushed up to Tenured** (241210K → 252330K). Tenured has only ~9.8 MB free out of 256 MB.
- {{GC(1287) Pause Full (Allocation Failure)}}: the next young collection cannot be sure there is enough room to push objects into Tenured, so Serial runs a **Full GC** (mark-compact over the entire heap, 1 thread): 577 ms. After the Full GC, Tenured holds **201406K ≈ 197 MB live** = 77% of 256 MB.
- {{GC(1288)}}: young collection is back to normal, and Tenured is already at 203210K. Each young collection pushes about 1.6 MB more into Tenured (jstat: O 77.52% → 79.95% after 4 young collections), so it only takes about 35–40 young collections (~25 seconds) for the 59 MB of free space to fill up again → the next Full GC.

From jstat at uptime 820 s: **1,262 young + 27 full**, GCT = 57.3 s → **~7% of the time the app is frozen by GC**, on average **a Full GC every ~30 seconds** (820 / 27). Add 41% CPU throttling (the pod uses 997m, hitting the 1-CPU ceiling): JIT, GC and requests compete for a single core, and whenever throttling kicks in, pauses stretch even further. Requests that coincide with a Full GC take about 0.6 s longer → matching the 1,140 ms max.

### Why "640Mi / 1536Mi" is misleading

Process memory = heap (up to 384M) + metaspace (~98M) + code cache + thread stacks + direct buffers + GC structures. A total of ~640Mi makes sense. The pod has 900Mi free **because the JVM is not allowed to use it**, while the heap inside is suffocating (Tenured at 77–96%). The right conclusion: look **inside the JVM** (GC log, jstat), not at the container's RSS.

Adding replicas does not help either: each replica has the same 384M heap and the same ~200 MB live set (caches, Spring context), so Full GCs stay just as frequent.

### Evidence from the artifacts

- {{Using Serial}}, {{CPUs: 16 total, 1 available}}, {{Memory: 1536M}}, {{Heap Max Capacity: 384M}}, {{Heap Initial Capacity: 24M}}.
- PrintFlagsFinal: {{UseSerialGC = true}} (source {{ergonomic}}), {{UseG1GC = false}}, {{MaxHeapSize = 402653184}} (384 MB), {{MaxRAMPercentage = 25}}.
- Capacities in the log: DefNew 117952K (eden 104832K + 1 survivor 13120K) + Tenured 262144K = 380096K ≈ **371M** ({{(371M)}}), exactly the 384M heap minus one survivor.
- Full GC 577 ms with User=0.57s ≈ Real=0.58s: a single thread is doing the work (G1 on the old VM: User many times Real because of the multiple workers).
- jstat: O 77–80%, FGC 27, GCT 57.3 s; CGC = "-" because Serial has no concurrent cycle.
- Throttling 41%, CPU 997m = hitting the limit.

### Fix

~~~yaml
resources:
  requests: { cpu: "2", memory: 2Gi }
  limits:   { memory: 2Gi }          # many teams drop the CPU limit and keep only the request
env:
  - name: JAVA_TOOL_OPTIONS
    value: >-
      -XX:+UseG1GC
      -XX:MaxRAMPercentage=75.0
      -XX:+ExitOnOutOfMemoryError
      -Xlog:gc*:file=/tmp/gc.log:time,uptime,level,tags:filecount=5,filesize=20m
~~~

- {{MaxRAMPercentage=75}}: a heap of ~1.5 GB out of 2 GB, leaving ~25% for metaspace, threads, code cache and direct memory. Do not set 90–100% — you will get OOMKilled because of off-heap memory.
- Declare the GC **explicitly** so that you no longer depend on the ergonomics thresholds. If you are forced to keep 1 CPU, G1 still works, but its concurrent threads compete with the app for CPU; in that case consider {{-XX:ActiveProcessorCount=2}} only once you understand the consequences, or simply give it 2 CPUs.
- Verify after the change: the GC log must print "Using G1", the post-GC heap must be < 50% of max, Full GC = 0, throttling < 5%.

| Configuration | GC | Max heap | Expected result |
|---|---|---|---|
| 1 CPU, 1536Mi, no flags | Serial (ergonomic) | 384M | Full GC ~30s, p99 450ms |
| 1 CPU, 1536Mi, MaxRAMPercentage=75 | Serial | 1152M | Fewer Full GCs, but pauses are still single-threaded STW |
| 2 CPU, 2Gi, G1, MaxRAMPercentage=75 | G1 | ~1536M | Young pauses ~10ms, almost no Full GC |

### Common mistakes

- Copying a "java -jar" Dockerfile with no flags and trusting the JVM to choose well — in a small container the default is usually a 25% heap and may well be Serial.
- Setting {{-Xmx}} exactly equal to the memory limit → the pod gets OOMKilled because of off-heap memory.
- Setting a low CPU limit for a Java app: at startup JIT needs plenty of CPU, and GC needs CPU; throttling slows everything down by a multiple.
- Looking at {{kubectl top}} (RSS) to draw conclusions about the heap.

### One-minute spoken answer

"No JVM flags, so the JVM uses cgroup-based ergonomics: it sees 1 CPU and 1536 MB, below the server-class threshold of 2 CPUs, so it picks Serial GC and a max heap of 25%, which is 384 MB. The GC log clearly says Using Serial and Heap Max Capacity 384M. Live data of about 200 MB takes 77% of the 256 MB old gen, so there is a Full GC every 30 seconds, each one 577 ms on a single thread; jstat shows 7% of the time in GC, plus 41% CPU throttling. The pod uses only 640Mi because the JVM is capped, not because the app is light. I raise it to 2 CPUs, set MaxRAMPercentage 75 and declare UseG1GC explicitly, then verify again with the GC log."

> Senior tip: I made it a team standard: every Java service on Kubernetes **must** set {{-XX:MaxRAMPercentage}}, an explicit GC and a rotating {{-Xlog:gc*}} file; CI checks for the "Using G1" line (or the chosen GC) in the startup log. The gc,init lines at the top of the log are the first thing I read when a service "got slower after moving to K8s" — 9 out of 10 times the cause is the default 25% heap or a CPU limit that is too low.`,
    rubric: [
      'Correctly explains ergonomics inside the container: the JVM reads cgroups, sees 1 CPU and 1536M, falls below the server-class threshold (>= 2 CPUs, ~1792MB) and therefore picks Serial GC; MaxRAMPercentage 25% -> 384M heap; notes that requests cpu has no effect (JDK 19+ uses the quota).',
      'Reads the GC log correctly: Tenured 256M, still ~201MB live after the Full GC (77%), Full GC 577ms on a single thread (User ≈ Real), objects constantly promoted into Tenured, so a Full GC every ~30s.',
      'Quantifies from jstat: 1262 young + 27 full in 820s, GCT 57.3s (~7%), combined with 41% CPU throttling; explains why an RSS of 640Mi and adding replicas neither proves nor solves anything.',
      'Proposes the right configuration: MaxRAMPercentage ~75 (not 100%), explicit GC (G1), 2 CPUs or no CPU limit, GC logging enabled, and how to verify after the change.'
    ]
  },
  'lab-gc-008': {
    title: 'Old gen grows by 2.65 objects per second: the Finalizer thread is stuck in finalize() closing an SFTP connection',
    scenario: `**Context:** **PayVN Settlement Gateway** (JDK 21.0.4, G1, {{-Xmx4g}}, 4 vCPU) pulls and pushes reconciliation files with the clearing centre over SFTP. The service uses an old internal library {{vn.pay.legacy.sftp}} (written back in the Java 6 era): each {{SftpHandle}} holds an SSH channel and a 16 KB buffer, and **closes the channel in finalize()**. The calling code never calls {{close()}} — "let GC handle it".

**Symptoms:** At **19:00 on October 24, 2026** the clearing centre upgraded its SFTP server. Since then, the gateway's post-mixed-GC heap has been climbing steadily: ~980 MB (stable for 3 months before) → **1,990 MB at 02:04** → **2,931 MB at 08:07 on October 25**. The pod restarted at 19:40 on October 24. No code changes. Extrapolating the trend: OOM at around 14:00.

**Data collected:** Two runs of {{jcmd 1 GC.class_histogram}}, the GC log, {{jstat -gcutil}}, a thread dump and the library code excerpt.`,
    questions: [
      'Why does the heap grow steadily when only 6–10 SFTP sessions are actually in use? Explain the JVM finalization mechanism step by step and why an object with finalize() lives longer than a normal object.',
      'Using the numbers in the artifacts, prove that the accumulation rate matches the gap between the handle creation rate and the rate at which the Finalizer thread processes them.',
      'Propose a remediation plan: short term (before 14:00), the root fix, and a codebase-wide policy on finalize()/Cleaner on JDK 21.'
    ],
    hints: [
      'Histogram: the number of {{SftpHandle}} objects ≈ the number of {{java.lang.ref.Finalizer}} objects, and they grow together; each handle drags along a 16 KB {{[B}}. Yet only 6–10 sessions are in use — what are the rest waiting for?',
      'The JVM has only ONE "Finalizer" thread, running every finalize() one after another. What is that thread doing across 3 consecutive dumps? How long does each take (DEBUG log)?',
      'Creation 3.2/s, finalize completes 1 per 1.8s ≈ 0.55/s → the queue grows by 2.65/s. Multiply by the 21,780 seconds between the two samples, then by 16,400 bytes.'
    ],
    answer: `**Summary:** This is a **finalizer backlog**, not a leak of the "someone is holding a reference" kind. The code never calls {{close()}}, so each {{SftpHandle}} is only cleaned up through {{finalize()}}. The JVM runs every finalize() on **a single "Finalizer" thread**; after the SFTP server upgrade, {{finalize()}} blocks for ~1.8 seconds waiting for the channel-close ack, so the Finalizer processes only **~0.55 handles/second** while the app creates **~3.2 handles/second**. The queue grows by **2.65 objects/second**, and each object holds a 16 KB buffer → ~946 MB every 6 hours, matching the histogram and the GC log. Fix: call {{close()}} explicitly (try-with-resources), take IO out of finalize, and eliminate finalize() from the codebase.

### First principles: how an object with finalize() dies

A normal object: once nothing references it any more, the next GC reclaims it. An object with {{finalize()}} is different — the JVM **must call finalize() before it is allowed to delete it**, and finalize() is arbitrary Java code that may run for a long time, or even "resurrect" the object. The sequence:

~~~text
1. new SftpHandle()  -> JVM also creates a java.lang.ref.Finalizer pointing to the object
                        (which is why the Finalizer count ~ the SftpHandle count in the histogram)
2. App drops the reference -> the object "is no longer used by anyone"
3. GC detects it      -> does NOT delete it; enqueues the Finalizer in a queue (ReferenceQueue).
                        The object + everything it points to (16 KB buffer, SshChannel) stays ALIVE,
                        and is usually promoted to old gen while it waits.
4. The "Finalizer" thread (1 thread, priority 8) takes elements one by one and calls finalize()
5. The next GC        -> only now are the object and the buffer really reclaimed
~~~

The key point: step 4 is **a single queue with a single server**. If one finalize() takes 1.8 seconds, the whole queue waits. GC cannot "collect faster" — it can only delete an object **after** the Finalizer has processed it. That is why the post-GC heap grows steadily and G1 runs full concurrent-mark plus mixed cycles without reclaiming anything extra: these objects are **still reachable** from the finalization queue.

Everyday analogy: an office has one employee who shreds documents. Every document must be confirmed by phone before it can be shredded. Previously each call took 18ms; now the partner answers slowly, 1.8 seconds. Documents waiting to be shredded pile up in the storeroom (the heap) even though nobody needs them.

### Quantifying: the numbers agree

| Quantity | Value | Source |
|---|---|---|
| Handle creation rate | ~3.2 per second | {{sftp_handles_opened_total}} |
| Finalize rate | 33 / 60 s ≈ 0.55 per second (1.8 s each) | DEBUG log "close ack waited≈1800ms" |
| Accumulation | 3.2 − 0.55 ≈ **2.65 per second** | |
| Actual | (118,911 − 61,190) / 21,780 s = **2.65 per second** | 2 histograms |
| Memory | 57,721 × 16,400 B ≈ **946.6 MB** | histogram: [B up 946.7 MB |
| Post-mixed heap | 1,990 → 2,931 MB (+941 MB) | GC log |
| Checkpoint 1 | 23,090 s × 2.65 ≈ 61,190 handles | matches sample 1 |

Before October 24, the close ack was ~18 ms → the Finalizer could process ~55/seconds, more than enough against 3.2/seconds, so the design flaw "never close" had been **dormant for 3 months**. The external change (the SFTP server acking slowly) made it flare up. Forecast: max heap 4,096 MB, baseline ~980 MB, ~156 MB added per hour (2.65 × 3,600 × 16.4 KB) → ~1,000 MB free at 08:07 → exhausted after ~6–7 hours, around 14:00.

### Evidence from the artifacts

- Histogram: {{SftpHandle}} 61,190 → 118,911 and {{SshChannel}} has the same count; {{java.lang.ref.Finalizer}} 61,204 → 118,930 (nearly equal: one Finalizer per handle, plus 14–19 from other classes). [B grew from 1.01 GB to 1.96 GB. Meanwhile the app has only 6–10 real SFTP sessions.
- Thread dump: the **"Finalizer"** thread is RUNNABLE but is really waiting on a socket (native {{Net.poll}}) inside {{SshChannel.awaitClose}} ← {{SshChannel.disconnect}} ← {{SftpHandle.finalize(SftpHandle.java:88)}} ← {{Finalizer.runFinalizer}}; 3 consecutive dumps are identical.
- GC log: post-mixed heap 978M (old pod) → 1,990M → 2,931M; concurrent mark runs normally (1.8s), pauses are short — **G1 is not at fault**, it is simply not allowed to delete these objects. FGC = 0 is still correct: the heap has not yet run out of room.
- jstat: O 41% → 64% → 88%, CGC rising (31 → 72) because old gen crosses IHOP more often.
- Code: {{close()}} exists but {{StatementPuller}} never calls it.

### Remediation plan

**Short term (before 14:00):**
- Rolling-restart the pod in a low-transaction window to reset the queue (buys ~18 hours).
- Smallest hotfix: call {{close()}} in {{StatementPuller}} using try-with-resources. If {{SftpHandle}} does not implement {{AutoCloseable}}, use try/finally.

~~~java
for (RemoteFile f : listing) {
    try (SftpHandle h = sftp.open(f.path())) {   // requires SftpHandle to implement AutoCloseable
        store.save(f.name(), h.readAll());
    }                                             // close() runs IMMEDIATELY, on the app thread
}
// close() is called explicitly -> the channel is already closed -> finalize() sees !isOpen() and returns at once
~~~

After the hotfix, finalize() is still called, but it only checks {{isOpen()}} and returns in microseconds, so the queue disappears.

**Root fix in the library:**
- Make {{SftpHandle implements AutoCloseable}}; {{close()}} has a short timeout and is idempotent.
- **Remove finalize()**. If you need a safety net for callers who forget to close, use {{java.lang.ref.Cleaner}} with an action that only **logs a warning and closes the socket locally** (never waits on the network). Cleaner also runs on a shared thread — a slow action creates just as much backlog as finalize.

**Codebase policy (JDK 21):**
- Finalization is **deprecated for removal** (JEP 421, JDK 18). Ban {{finalize()}} in new code; scan dependencies.
- Run tests and staging with {{--finalization=disabled}} (JDK 18+) to expose code that relies on finalize to release resources.
- Monitor: JFR has the {{jdk.FinalizerStatistics}} event (JDK 18+) listing which classes have finalizers and how many times they ran; alert when the histogram shows {{java.lang.ref.Finalizer}} growing continuously.
- Principle: resources outside the JVM (sockets, files, SSH channels, connections) **must** be closed explicitly; GC only manages heap memory, not resources.

| Mechanism | When it runs | Thread | Risk |
|---|---|---|---|
| try-with-resources / close() | Immediately, deterministically | The app thread | Forgetting to call it (catch with static analysis) |
| Cleaner | After GC finds the object unreachable | Shared Cleaner thread | Slow action → backlog; no guarantee it runs |
| finalize() | After GC, at an unpredictable time | 1 Finalizer thread | Backlog, object resurrection, deprecated |

### Common mistakes

- Seeing the heap grow and immediately assuming a "cache leak", then hunting for a static map; in the histogram you must watch for {{java.lang.ref.Finalizer}} — a large count is a sign of finalization.
- Raising {{-Xmx}}: it only postpones the time to OOM, the accumulation rate is unchanged.
- Thinking you can "force" finalize to run with {{System.gc()}} or {{System.runFinalization()}}: neither makes the Finalizer faster when each finalize() blocks for 1.8 seconds.
- Skipping the "Finalizer" thread when reading a dump because it is a system thread.
- Note: {{GC.class_histogram}} triggers a Full GC by default to count live objects — on a large heap that causes a pause; run it outside peak hours.

### One-minute spoken answer

"Two histograms show SftpHandle and java.lang.ref.Finalizer growing together, from 61 thousand to 119 thousand, each handle holding a 16 KB buffer, while only 6–10 real SFTP sessions are in use. The code never calls close, so handles are only cleaned up through finalize, and the JVM has just one Finalizer thread. The thread dump shows the Finalizer stuck in finalize at line 88 waiting for the channel-close ack, and the log says 1.8 seconds each time since the SFTP server upgrade. Creating 3.2 per second, processing 0.55 per second, leaving a surplus of 2.65 per second, exactly the measured growth rate, and times 16 KB gives 946 MB every 6 hours, matching the GC log. Short term I restart and hotfix with try-with-resources; long term I remove finalize, close resources explicitly, and run tests with --finalization=disabled."

> Senior tip: A heuristic I use often: if a "leak" has a **perfectly constant rate** and starts right when something **external** changed (a partner, the network, the database) rather than a deployment, think of a queue whose single consumer slowed down — Finalizer, Cleaner, AsyncAppender, a single-thread executor. Take the input rate minus the output rate, multiply by time, and compare with the histogram; once the three numbers agree to within 1%, you have a root cause solid enough to present in a postmortem.`,
    rubric: [
      'Correctly identifies the finalizer backlog: SftpHandle is never closed and is only cleaned up via finalize(); there is a single Finalizer thread; objects awaiting finalization are still reachable, so GC cannot reclaim them (G1 is not at fault).',
      'Evidence: histogram SftpHandle ≈ Finalizer growing together 61190→118911, [B +946MB; the Finalizer thread stuck in SftpHandle.finalize line 88 waiting on the socket ack; close ack log ~1800ms; post-mixed heap 978→1990→2931MB.',
      'Quantifies consistently: create ~3.2/s, finalize ~0.55/s, accumulate 2.65/s = (118911−61190)/21780s; ×16400B ≈ 946MB; explains why the flaw stayed dormant when the ack was 18ms and forecasts the OOM time.',
      'Plan: short-term restart + try-with-resources; root fix with AutoCloseable, removing finalize, and a Cleaner that only does fast work; JDK 21 policy (JEP 421 deprecated, --finalization=disabled, JFR jdk.FinalizerStatistics, no using GC to manage resources).'
    ]
  }
});
