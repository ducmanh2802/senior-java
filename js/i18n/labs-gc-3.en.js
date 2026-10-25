(function () {
  'use strict';
  App.i18n.content({
    'lab-gc-005': {
      title: 'Fraud Scoring: p99 increased 4x after release, dense young GC',
      scenario: `**Context:** Bank **VNBank** has a **risk-scoring** service (Spring Boot 3.3, JDK 21.0.4, G1, {{-Xms4g -Xmx4g}}, 4 vCPU pod) that scores card transactions for fraud before approval. SLA: p99 under 80 ms. The heap contains about 1.2 GB of pre-loaded models and rules (stable old gen). Each request is enriched with 200 recent transactions of the customer from Redis and 300 features are computed.

**Symptoms:** Version **3.8** was deployed at **14:00 on October 22, 2026** with two minor changes: adding "audit log request" and adding caching for individual features. After deployment, traffic remained unchanged (about 1,850 requests/second per pod), but p99 increased from 38 ms to **162 ms**, and CPU increased from 41% to 78%. There are no Full GCs, and no errors. A team member suggested switching to ZGC "for lower pause times".

**Data Collected:** GC logs from the same timeframe the previous day (v3.7) and today (v3.8), Prometheus metrics, 5-minute JFR results (JDK 21's {{jfr view}} summary by application frame), and the code changes in v3.8.`,
      questions: [
        'From GC logs and metrics, explain the mechanism causing the p99 increase: allocation rate, frequency and duration of young pauses, promotion, and mixed GC. Calculate the pause time ratio before and after.',
        'Which code is causing the increased allocation? Why does a {{log.debug}} line, while the level is INFO, still consume memory and CPU?',
        'Propose a fix. Is switching to ZGC the right solution? What would you add to the pipeline to catch this regression before production?'
      ],
      hints: [
        'The Eden space is unchanged (614 regions, approx 1.2 GB). Dividing 1.2 GB by the allocation rate gives the interval between young GCs. Young pause duration is proportional to the number of live objects that must be copied, not the Eden size: check the Survivor regions before and after.',
        'In Java, method arguments are evaluated BEFORE the method runs. {{log.debug("...{}", x)}} only defers the call to {{x.toString()}}, not the expression generating {{x}}. What does the metric {{logback_events_total}} with level="debug" being 0 indicate?',
        '{{String.format}} runs 300 times per request, and cache hit is only 31%. Calculate the number of calls per second. ZGC reduces pause times, but does it reduce the 2 GB/s of garbage and the CPU used for JSON serialization?'
      ],
      answer: `**Summary:** This is a regression in **allocation rate**, not a leak or a GC configuration issue. Version 3.8 increases garbage from about 0.28 MB to about 1.14 MB per request (allocation increased from 0.52 to 2.11 GB/s). The main culprit is {{log.debug(..., mapper.writeValueAsString(req))}}: JSON of about 230 KB is serialized for **every** request then discarded, because the log level is INFO. The second is {{String.format}} running 300 times per request to create cache keys. Young GC is 4 times denser, each pause is twice as long, promotion increased 15 times leading to continuous mixed GC cycles, combined with wasted CPU, pushing p99 from 38 to 162 ms.

### Reading GC logs and metrics

| Metric | 3.7 | 3.8 | Explanation |
|---|---|---|---|
| Allocation | 0.52 GB/s | 2.11 GB/s | {{jvm_gc_memory_allocated_bytes_total}} |
| Young GC interval | ~2.37 s | ~0.57 s | Eden 614 regions (1228 MB) / allocation rate; matches timestamp GC(12804..12807) and GC(3031..3034) |
| Young pause | ~12 ms | ~25 ms | {{Survivor regions: 8->9}} vs {{46->48}}: amount of live objects to copy increased 5x |
| Pause time ratio | 0.5% | 4.6% | {{rate(jvm_gc_pause_seconds_sum)}} 0.005 vs 0.046 seconds per second |
| Promotion | 0.4 MB/s | 6.1 MB/s | Survivor space can't hold it, young objects promoted early to old |
| Mixed GC | ~Every 3 hours | ~Every 1–2 minutes | GC(3101) Concurrent Start, GC(3107..3109) Mixed 71–94 ms |

Why young pause is longer: evacuation time is proportional to the **number of live objects** at the time of GC, not the Eden size. Each request being processed (approx 1,850 rps × dozens of ms) holds the JSON string, Jackson's {{char[]}} buffer, and the string keys. If each request is 4 times "heavier", the set of live objects in flight is also larger, so survivors increase from 8 to 46–48 regions (out of 77 max). Objects that don't fit in survivors are promoted early to old ({{Old regions: 646->648}} after each GC). Old gen fills up quickly, hitting IHOP, triggering a concurrent mark cycle and 3 mixed GCs lasting 71–94 ms. This mixed GC is the tail latency in p99.

CPU overhead: serializing 230 KB JSON takes about 0.5–1 ms CPU per request, at 1,850 rps is over 1 core just to create strings and discard them. Added with more frequent GC threads, CPU increases from 0.41 to 0.78 on 4 vCPU, and requests must wait longer for CPU.

### Culprits in the code

1. **{{FraudAuditLogger.logRequest}} line 23: 59.6% allocation.** Java evaluates arguments before calling the method, so {{mapper.writeValueAsString(req)}} always runs, then {{log.debug}} checks the level, sees it's INFO, and discards the result. SLF4J placeholders only defer string concatenation and calling {{toString()}} of arguments, they don't defer the expression calculating the argument. Evidence: {{logback_events_total}} with level="debug" is **0/s**, meaning no debug lines are written, but JFR shows {{byte[]}} and {{char[]}} account for 67.6% of allocation.
2. **{{FeatureVectorBuilder.featureKey}} line 41: 15.8%.** {{String.format}} parses the format string, creates {{Formatter}}, {{FormatSpecifier}} ({{java.util.Formatter$FormatSpecifier}} 4.2%), and {{StringBuilder}}. Called 300 times per request, approx 555,000 times per second per pod. Cache hit is only 31%, so most keys are wasted.

### How to fix

**Short-term (hotfix):**

~~~java
// Method 1: explicit guard
if (log.isDebugEnabled()) {
    log.debug("score request {}", mapper.writeValueAsString(req));
}

// Method 2: SLF4J 2 fluent API, supplier only runs when level is enabled
log.atDebug()
   .setMessage("score request {}")
   .addArgument(() -> toJsonQuietly(req))
   .log();
~~~

For cache keys: compute the static part once per feature ({{def.keySuffix()}} created when loading feature definitions), then concatenate {{r.customerId() + def.keySuffix()}}. Even better, use a record {{FeatureKey(customerId, featureId)}} as the key to avoid creating strings. Also reconsider if caching is necessary, given only 31% hit rate.

**Long-term:** ...`,
      rubric: [
        'Recognize high allocation rate: 2.11 GB/s vs 0.52 GB/s, young GC interval decreased 4x, promotion increased 15x.',
        'Explain p99 latency: young GC pause duration proportional to live objects in survivor space (increased 5x), leading to frequent mixed GC cycles, plus CPU waste.',
        'Identify culprits: log.debug always evaluates mapper.writeValueAsString due to Java argument evaluation rules; String.format inside loop with low cache hit rate.',
        'Propose fix: guard logs (isDebugEnabled/fluent API), optimize cache keys (records or static concatenation).',
        'ZGC won\'t solve 2 GB/s garbage rate or CPU waste; advise on adding integration tests for allocations/GC logs in staging.'
      ]
    }
  });
})();
