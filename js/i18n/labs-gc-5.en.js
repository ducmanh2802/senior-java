/*
 * English translation of js/data/labs-gc.js — task T446. Format: js/core/i18n.js (content overlay).
 * ids: lab-gc-005 lab-gc-006
 */
(function () {
  'use strict';
  App.i18n.content({
    'lab-gc-005': {
      title: 'Card fraud scoring: p99 up 4x after a release, dense young GCs',
      scenario: `**Context:** The bank **VNBank** runs the **risk-scoring** service (Spring Boot 3.3, JDK 21.0.4, G1, {{-Xms4g -Xmx4g}}, 4 vCPU pod) that scores every card transaction for fraud before sending it for approval. SLA: p99 under 80 ms. The heap holds about 1.2 GB of models and rules preloaded (old gen stable). Every request is enriched with the customer's 200 most recent transactions from Redis and then computes 300 features.

**Symptoms:** Release **3.8** was deployed at **14:00 on October 22, 2026** with two small changes: an "audit log request" and a per-feature cache. After the deploy, traffic was unchanged (about 1,850 requests/second per pod), but p99 rose from 38 ms to **162 ms**, and CPU from 41% to 78%. No Full GC, no errors. A teammate suggested switching to ZGC "for low pauses".

**Data Collected:** The GC log for the same time window the day before (release 3.7) and today (release 3.8), Prometheus metrics, a 5-minute JFR result ({{jfr view}} from JDK 21 plus a table aggregated by application frame), and the code that changed in release 3.8.`,
      questions: [
        'From the GC log and the metrics, explain the mechanism that raised p99: allocation rate, frequency and length of young pauses, promotion, mixed GC. Compute the share of time spent paused before and after.',
        'Which code causes the extra allocation? Why does a log.debug line still cost memory and CPU when the level is INFO?',
        'Propose a fix. Is switching to ZGC the right solution? What would you add to the process to catch this regression before it reaches production?'
      ],
      hints: [
        'Eden is unchanged (614 regions, about 1.2 GB). Divide 1.2 GB by the allocation rate to get the interval between two young GCs. Young pause time is proportional to the number of live objects that must be copied, not to eden size: look at the Survivor regions before and after.',
        'In Java, method arguments are evaluated BEFORE the method runs. log.debug("...{}", x) only defers the call to x.toString(), not the expression that produces x. What does the logback_events_total metric at level debug being 0 tell you?',
        'String.format runs 300 times per request, and the cache hit rate is only 31%. Compute the number of calls per second. ZGC reduces pauses, but does it reduce 2 GB/s of garbage or the CPU spent serializing JSON?'
      ],
      answer: `**Summary:** This is a regression in **allocation rate**, not a leak and not a GC configuration mistake. Release 3.8 raised the garbage per request from about 0.28 MB to about 1.14 MB (allocation from 0.52 to 2.11 GB/s). The main culprit is {{log.debug(..., mapper.writeValueAsString(req))}}: a JSON document of about 230 KB is serialized for **every** request and then thrown away, because the log level is INFO. Second is {{String.format}} running 300 times per request to build a cache key. Young GCs became 4 times denser, each pause twice as long, promotion rose 15-fold and pulled in a continuous run of mixed GC cycles, plus wasted CPU, pushing p99 from 38 to 162 ms.

### Reading the GC log and the metrics

| Metric | 3.7 | 3.8 | Explanation |
|---|---|---|---|
| Allocation | 0.52 GB/s | 2.11 GB/s | {{jvm_gc_memory_allocated_bytes_total}} |
| Young GC interval | about 2.37 s | about 0.57 s | Eden 614 regions (1228 MB) / allocation rate; matches the timestamps of GC(12804..12807) and GC(3031..3034) |
| Young pause | about 12 ms | about 25 ms | {{Survivor regions: 8->9}} versus {{46->48}}: the number of live objects to copy grew 5 times |
| Pause time share | 0.5% | 4.6% | {{rate(jvm_gc_pause_seconds_sum)}} 0.005 versus 0.046 seconds per second |
| Promotion | 0.4 MB/s | 6.1 MB/s | survivor cannot hold it all, so young objects are pushed to old early |
| Mixed GC | about once every 3 hours | about every 1-2 minutes | GC(3101) Concurrent Start, GC(3107..3109) Mixed 71-94 ms |

Why young pauses got longer: evacuation time is proportional to the **live objects** at GC time, not to eden size. Every in-flight request (about 1,850 rps x a few tens of ms) holds a JSON string, Jackson's {{char[]}} buffer and the String keys. When each request is 4 times "heavier", the set of objects in flight is larger too, so survivors grow from 8 to 46-48 regions (out of a maximum of 77). Whatever does not fit in survivor is promoted to old early ({{Old regions: 646->648}} after every GC). Old fills faster, hits IHOP, and spawns a concurrent mark cycle plus 3 mixed GCs of 71-94 ms (the line {{GC(3108) Pause Young (Mixed) ... 94.118ms}}, matching {{jvm_gc_pause_seconds_max 0.094}}). This is exactly the tail of p99.

On top of that, CPU: serializing 230 KB of JSON costs about 0.5-1 ms of CPU per request; times 1,850 rps that is more than 1 core just to build a string and throw it away. Adding denser GC threads, CPU rose from 0.41 to 0.78 on 4 vCPU, and requests have to wait for CPU more often.

### The culprits in the code

1. **{{FraudAuditLogger.logRequest}} line 23: 59.6% of allocation.** Java evaluates arguments before calling the method, so {{mapper.writeValueAsString(req)}} always runs, and only then does {{log.debug}} check the level, see INFO and drop the result. SLF4J placeholders (the curly-brace pairs) only defer string concatenation and the argument's {{toString()}} call; they cannot defer the expression that computes the argument. Evidence: {{logback_events_total}} at level="debug" is **0/s**, meaning no debug line was ever written, yet JFR shows {{byte[]}} and {{char[]}} (Jackson's buffers and the resulting String) make up 67.6%.
2. **{{FeatureVectorBuilder.featureKey}} line 41: 15.8%.** {{String.format}} has to parse the format string and creates a {{Formatter}}, a {{FormatSpecifier}} ({{java.util.Formatter$FormatSpecifier}} 4.2%) and a {{StringBuilder}}. It is called 300 times per request, about 555 thousand times per second per pod. With only a 31% cache hit rate, most of the keys created are wasted.
3. {{RuleEngine.evaluate}} (10.5%) and reading the request body (5.3%) **already existed in release 3.7**; this is noise. Compared with the JFR from October 15, only the two new sites appeared.

Sanity check: 1.14 MB x 1,855 rps ≈ 2.11 GB/s, of which the audit log is about 0.68 MB (the 230 KB JSON as Jackson's {{char[]}} plus the resulting String) and featureKey about 0.18 MB (300 calls x about 600 bytes).

### Fix

**Short term (hotfix):**

~~~java
// Option 1: explicit guard
if (log.isDebugEnabled()) {
    log.debug("score request {}", mapper.writeValueAsString(req));
}

// Option 2: the SLF4J 2 fluent API; the supplier only runs when the level is enabled
log.atDebug()
   .setMessage("score request {}")
   .addArgument(() -> toJsonQuietly(req))
   .log();
~~~

For the cache key: precompute the static part once per feature ({{def.keySuffix()}} created when the feature definition is loaded), then concatenate {{r.customerId() + def.keySuffix()}}. Even better, use a record {{FeatureKey(customerId, featureId)}} as the key so no String is created. Also reconsider whether the cache is worth keeping at only a 31% hit rate.

**Long term:**
- **A real audit trail should not be a debug log of the whole payload.** If business or regulators need an audit trail, write a reduced record (requestId, masked customerId, amount, score, decision, model version) at INFO, asynchronously via Kafka or an async appender. The full payload contains card data and transaction history, so writing it to logs is a compliance risk (PCI DSS, Decree 13/2023 on personal data).
- **ZGC is not the solution.** Generational ZGC on JDK 21 ({{-XX:+UseZGC -XX:+ZGenerational}}) brings pauses below a millisecond, but 2.11 GB/s of garbage still has to be processed by GC threads running in parallel (costing CPU on a pod already at 78%), and the more than 1 core spent serializing JSON for nothing remains. Fix the source of allocation first; only then evaluate a GC change based on data.
- Enlarging young gen or tuning {{MaxGCPauseMillis}} only trades pause frequency for pause length; it does not reduce total cost.

### Prevention

- Regression alert on **allocation per request**: {{rate(jvm_gc_memory_allocated_bytes_total)}} divided by the request rate, compared with the previous release. Alert when it rises more than 50% after a deploy, plus an alert when the pause-time share exceeds 2%.
- Canary deploy comparing p99, CPU and allocation/request between the canary and the stable release before a full rollout.
- JMH benchmarks for the hot path with {{-prof gc}}, tracking {{gc.alloc.rate.norm}} (bytes per operation) in CI and failing when it rises past a threshold.
- Keep JFR running continuously with the default configuration so allocation data is always available when comparing releases.
- Review rules or static analysis: ban heavy calls in the arguments of {{log.debug}} and {{log.trace}}. Sonar has a rule for this case.

> Senior tip: For a low-latency service, I treat **bytes allocated per request** as a metric on par with latency and CPU. At a throughput of a few thousand rps, every 100 KB of extra garbage per request is about 0.2 GB/s for GC. When p99 rises after a release with no errors, compare {{jvm_gc_memory_allocated_bytes_total}} before and after first. It is the fastest way to tell whether the problem is in the code (allocation) or in the infrastructure.`,
      rubric: [
        'Quantify it: allocation rises from 0.52 to 2.11 GB/s, young GC from about 2.4 s to about 0.57 s apart, pause from about 12 to 25 ms because survivors grow (8 to 46-48 regions), and pause time from 0.5% to about 4.6%.',
        'Explain the chain of early promotion (6.1 MB/s), the concurrent cycle and mixed GCs of 71-94 ms as the tail of p99, plus the CPU wasted on serializing JSON.',
        'Point to the right culprits: log.debug with mapper.writeValueAsString, whose argument is evaluated even when the level is INFO (logback debug events = 0), and String.format 300 times per request in featureKey; distinguish them from the allocation that already existed in release 3.7.',
        'Propose fixes: an isDebugEnabled guard or the fluent API with a supplier, keys without String.format; an audit trail with a reduced record and a note on card data; and explain why ZGC or GC tuning is not the root fix.',
        'Prevention: alerts on allocation per request and pause-time share, canary deploys, JMH -prof gc in CI, and continuous JFR.'
      ]
    },
    'lab-gc-006': {
      title: 'p99 jumps to 1.2 seconds exactly every 10 minutes: Pause Full (System.gc()) in the statement job',
      scenario: `**Context:** **PayVN Statement** (Spring Boot 3.3, JDK 17.0.12, G1, {{-Xms8g -Xmx8g}}, 8 vCPU pod) serves the statement-viewing API ({{GET /statements/*}}) and runs the {{StatementBatchJob}} job that generates statement PDF files every 10 minutes (minute 0, 10, 20…). Last month a developer added a line at the end of the job "to free RAM after the big PDF batch" because the "heap used" dashboard showed 3.6 GB.

**Symptoms:** The latency dashboard for {{/statements/*}} has a regular sawtooth shape: normally p99 is ~40ms, but exactly at **hh:m0:00** (02:00, 02:10, 02:20…) p99 jumps to **~1.2 seconds**, with a few dozen timeouts on mobile clients (1 s timeout). No errors, average CPU 25%, and heap after GC looks "very healthy".

**Data Collected:** The GC log (unified logging {{-Xlog:gc*:file=gc.log:time,uptime,level,tags}}) around 02:10, {{jstat -gccause}}, the job log, the JVM flags and the result of grepping the source code.`,
      questions: [
        'Using the GC log and jstat, identify the cause of the latency spikes that happen exactly every 10 minutes. Why exactly at hh:m0?',
        'Why is calling System.gc() "to free RAM" a misunderstanding of G1? Explain the 3.6 GB heap figure the developer worried about.',
        'Propose a fix, and state the risk of each relevant JVM option (DisableExplicitGC, ExplicitGCInvokesConcurrent).'
      ],
      hints: [
        'Find the cause in parentheses on the Pause Full lines and in the LGCC column of jstat -gccause. Compare their timestamps with the job log.',
        'Before the Full GC the heap is 3388M, still below the 45% IHOP threshold (~3686M), so G1 had no need to mark concurrently — there is no Concurrent Mark Cycle at all. Garbage sitting in old gen "waiting its turn" is normal.',
        'By default on G1, {{System.gc()}} runs a Full GC that stops the whole application. {{-XX:+ExplicitGCInvokesConcurrent}} turns it into a concurrent cycle; {{-XX:+DisableExplicitGC}} ignores it entirely but carries a direct buffer risk.'
      ],
      answer: `**Summary:** Every latency spike is a **{{Pause Full (System.gc())}} that stops the application for ~1.2 seconds**, caused by the {{System.gc()}} call at {{StatementBatchJob.java:118}}, invoked right after every batch (job finishes at 02:10:00.401 → Full GC at 02:10:00.412). On G1, {{System.gc()}} is by default a stop-the-world Full GC that compacts the entire heap. It does not "free RAM" beyond what the collector would do: garbage in old gen is normal, and G1 reclaims it when needed with a concurrent cycle plus mixed GCs and pauses of a few tens of ms. Fix: delete that line; prevent recurrence with {{-XX:+ExplicitGCInvokesConcurrent}}.

### First principles: the kinds of pause G1 uses to collect garbage

The G1 heap is split into equal-sized **regions** (here 4 MB x 2048 regions = 8 GB). New objects are born in **Eden**; those that survive a few collections move to **Survivor** and then **Old**. G1 has 3 kinds of collection:

| Kind | What it collects | Stops the app? | Typical time here |
|---|---|---|---|
| Young (Normal) | Eden + Survivor | Yes, short | ~13 ms |
| Concurrent Mark + Mixed | Marks old gen **concurrently with the app**, then gradually collects the old regions with the most garbage | Short pauses (Remark, Mixed) | a few tens of ms |
| Full GC | **The whole heap**, mark + compact | Yes, long | **~1,200 ms** |

A Full GC in G1 is the "last resort" — it should only happen when G1 fails (runs out of room). {{System.gc()}} is an **explicit request** to "collect everything now": on G1 the default is exactly one stop-the-world Full GC with 4 phases: Mark → Prepare → Adjust pointers → Compact. During those 1.2 seconds **no request is processed**.

### Why the developer thought System.gc() was needed

The "heap used" dashboard reaching 3.6 GB looks scary, but with G1 that is normal: G1 **deliberately lets garbage sit in old gen** until old gen crosses the **IHOP** threshold (Initiating Heap Occupancy Percent, by default 45% of the heap ≈ 3,686 MB here); only then does it start marking concurrently. Collecting earlier just wastes CPU. Think of the office waste bin: nobody empties it every time a sheet of paper goes in; it is emptied when nearly full, and emptied while everyone keeps working (concurrently), instead of making the whole office stand up and wait.

The right number to watch is **heap after GC** (live data), not instantaneous heap used. Here the real live set is only ~1.6 GB (after the Full GC: {{3388M->1656M}}). An 8 GB heap is plenty.

### Evidence from the artifacts

- GC log: {{GC(1873) Pause Full (System.gc()) 3388M->1656M(8192M) 1196.204ms}}, Real=1.20s; the 4 phases add up to ≈ 1,185 ms. The earlier ones are at exactly 01:40, 01:50, 02:00, 02:10 — a 10-minute cycle, each about 1.19-1.20 s.
- Just before it, a normal young GC: {{GC(1872) ... 3648M->2864M(8192M) 13.204ms}} — the app's usual pause is only ~13 ms.
- The heap before the Full GC is 3388M (131+8+700+2+6 = 847 regions x 4 MB) and **below the 3686M IHOP**, and {{grep -c 'Concurrent Mark Cycle'}} = 0: G1 never needed to collect old gen, meaning there was no memory pressure at all.
- jstat: LGCC switches from "G1 Evacuation Pause" to "System.gc()" and FGC goes 37 → 38, FGCT grows by 1.196 s (44.081 → 45.277); CGC = 0.
- Job log: the batch finished at 02:10:00.401, the Full GC started at 02:10:00.412 (11 ms later). Grepping the source: {{StatementBatchJob.java:118: System.gc()}}. VM.flags has neither {{DisableExplicitGC}} nor {{ExplicitGCInvokesConcurrent}}.
- The p99 bucket at 02:10:00 = 1,212 ms, the surrounding buckets ~40 ms.

Total damage: 6 times per hour x 1.2 s = **7.2 seconds per hour with the app completely frozen**, only to collect garbage that G1 would collect on its own far more cheaply.

### Fix

1. **Delete the System.gc() line** at {{StatementBatchJob.java:118}}. This is the root fix.
2. Add a preventive flag to every service: {{-XX:+ExplicitGCInvokesConcurrent}} — if some library calls {{System.gc()}}, G1 will start a **concurrent marking cycle** instead of a stop-the-world Full GC.
3. If the PDF batch really creates many large (humongous) objects, handle it with streaming or by capping the buffer size, not by calling GC.

~~~java
// BEFORE
public void run() {
    generatePdfs(batch);
    System.gc();            // a 1.2s stop-the-world Full GC on G1 — hurts every other request
}
// AFTER: do not interfere with GC; if you worry about memory, measure the live set (heap after GC)
public void run() {
    generatePdfs(batch);    // cap the batch size / stream if needed
}
~~~

### Comparing the relevant JVM flags

| Flag | What System.gc() does | Risk |
|---|---|---|
| Default | Stop-the-world Full GC | Long pauses like this incident |
| {{-XX:+ExplicitGCInvokesConcurrent}} | Starts a concurrent cycle (short pauses) | Almost none; costs a little background CPU |
| {{-XX:+DisableExplicitGC}} | Ignored entirely | **Direct buffer**: when it hits the {{MaxDirectMemorySize}} limit, the JDK calls {{System.gc()}} to release old {{DirectByteBuffer}}s; disabling it can cause {{OutOfMemoryError: Direct buffer memory}} in apps that use a lot of NIO/Netty |

Because of the direct buffer risk, I prefer {{ExplicitGCInvokesConcurrent}} over {{DisableExplicitGC}}.

### Common mistakes

- Panicking at instantaneous "heap used"; you must look at **heap after GC** (or old gen after a mixed GC).
- Thinking {{System.gc()}} is just a "gentle hint". The spec says the JVM may ignore it, but HotSpot by default **always performs** a Full GC.
- Forgetting hidden callers: RMI distributed GC (when JMX remote/RMI is enabled) can call {{System.gc()}} periodically according to {{sun.rmi.dgc.server.gcInterval}} (default 1 hour); some old libraries call it too.
- Enabling {{DisableExplicitGC}} on a Netty/NIO service without monitoring direct memory.

### One-minute spoken answer

"The p99 spikes line up exactly with the Pause Full (System.gc()) line every 10 minutes, each stopping the app for about 1.2 seconds. The source is the System.gc() call at StatementBatchJob line 118, invoked right after every batch — the job log shows it finished at 02:10:00.401 and the Full GC started 11 ms later. On G1, System.gc() is by default a stop-the-world Full GC. It is unnecessary: the heap at 3.4 GB is still below the 45% IHOP threshold, G1 has never needed to run concurrent mark, and the real live set is only 1.6 GB. I would delete that line and add ExplicitGCInvokesConcurrent in case some other library calls it; I would not use DisableExplicitGC because it can break direct buffer reclamation."

> Senior tip: When I see a latency spike with a **regular period** (exactly every N minutes), I think first of a cron/job, System.gc(), RMI DGC or log rotation — not user traffic. Running {{grep -E 'Pause Full' gc.log}} and reading the cause in parentheses is the fastest diagnosis: "(System.gc())" is code, "(G1 Compaction Pause)" means G1 genuinely ran out of room, "(Metadata GC Threshold)" means metaspace. Three different causes, three different fixes.`,
      rubric: [
        'Identify the right cause: Pause Full (System.gc()) of ~1.2s every 10 minutes from System.gc() at StatementBatchJob.java:118, with timestamps matching the job log (02:10:00.401 → 02:10:00.412).',
        'Explain it correctly: on G1 System.gc() is by default a stop-the-world Full GC; the heap at 3388M is below the 45% IHOP (~3686M), there is no Concurrent Mark Cycle, the real live set is ~1656M, so the manual GC call is unnecessary.',
        'Back it with jstat -gccause (LGCC = System.gc(), FGC 37→38, FGCT grows by ~1.196s, CGC 0) and compare with the normal young GC of ~13ms.',
        'Propose the fix: delete System.gc(), use -XX:+ExplicitGCInvokesConcurrent, and mention the DisableExplicitGC risk with direct buffers plus hidden callers (RMI DGC, libraries).'
      ]
    }
  });
})();
