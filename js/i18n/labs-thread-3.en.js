App.i18n.content({
  'lab-thread-003': {
    title: 'Throughput drops 15x, CPU at 41% due to a synchronized block',
    scenario: `**Context:** **PayVN Pricing** (Spring Boot 3.4, Java 21, 2 vCPU limit on Kubernetes) provides dynamic pricing for e-commerce products. The price JSON table is loaded from S3 every 5 minutes and cached as a {{byte[]}} in memory. The service has 16 Tomcat workers.

**Symptoms:** After adding a promotion field to the price table (JSON file grew from 380 KB to 2.4 MB), throughput dropped from **~1 400 req/s to ~96 req/s**, p99 increased from 18ms to **320ms**, while pod CPU usage was only **~41%** (0.82 cores on a 2-core limit) with no errors, no DB timeouts, and no deadlocks. The autoscaler's threshold is 70%, so it didn't scale; adding more pods only increases total capacity, not efficiency per request.

**Data Collected:** Two thread dumps taken 10 seconds apart (same pod), and {{pidstat -t -p 1 1 3}} on the container during the incident.`,
    questions: [
      'Distinguish this phenomenon from a deadlock. Why are 11 threads BLOCKED while CPU is only ~41% (0.82 cores on 2 cores) and the autoscaler doesn\'t react?',
      'Identify the code block causing contention and explain why it is significantly worse after the JSON file grew from 380 KB to 2.4 MB.',
      'Propose an alternative design for reading the price table that is almost lock-free, and outline how to measure/alert to detect this type of degradation early.'
    ],
    hints: [
      'Compare the two samples: did the holder of lock <0x000000076b4c1a90> change? Sample 1 holder was exec-7, sample 2 holder was exec-14 (exec-7 is now queued). The lock is being passed around and the holder is always RUNNABLE, CPU time is increasing — the system is progressing, just sequentially: this is contention, not a deadlock.',
      'Look at pidstat: the entire process is only at 82.93% (~0.83 cores) on 4 host CPUs, distributed evenly among 16 workers (~5% per thread). 16 threads are busy but total less than 1 core — they take turns running one thread at a time: a sign of serialization.',
      'In sample 1, the thread holding the lock is parsing a 2.4 MB JSON (line 121 calls parsePriceTable); in sample 2, a different holder is resizing the HashMap to index by SKU (line 122 calls indexBySku). Both are inside the same synchronized price() method starting at line 121.'
    ],
    answer: `**Summary:** This is **lock contention** on the {{0x000000076b4c1a90}} monitor of {{PricingService}}, not a deadlock. Each request passes through {{synchronized}} and **re-parses the entire 2.4 MB price table and rebuilds the index** — the critical section is ~10.4ms, so the theoretical ceiling is ~96 req/s, matching the measured throughput. 11 HTTP threads are {{BLOCKED}} in the queue; CPU is only ~0.83 cores (41% of 2-core limit) because at any given time only one thread runs in the critical section, so the autoscaler is not triggered.

### Root Cause

The bug is in caching the **raw bytes** from S3 but re-parsing them on every request, inside a {{synchronized}} method:

~~~java
// PricingService.java — buggy version
private volatile byte[] tableBytes;      // Loaded from S3 every 5 minutes, cached as RAW

public synchronized Price price(String sku, int qty) {
    PriceTable table = parsePriceTable(tableBytes);  // line 121 (body at 137): parse 2.4MB ON EACH request
    Map<String, Price> index = indexBySku(table);    // line 122 (body at 143): rebuild HashMap
    return index.get(sku).multiply(qty);
}
~~~

The problem isn't using {{synchronized}}, but the **critical section size multiplied by frequency**: the lock is held throughout the parse + rebuild process of **every** request, not just during reload.

- 380 KB file: parse + index ~0.7ms → ceiling {{1 / 0.0007}} ≈ 1 400 req/s. The 1 400 req/s baseline was actually **near the ceiling**; no one noticed.
- 2.4 MB file (~6.3x larger): Jackson parse ~9ms + rebuild HashMap ~1.4ms → critical section ~10.4ms → ceiling {{1 / 0.0104}} ≈ **96 req/s**. Actual demand is still > 1 000 req/s; the excess queues up, driving p99 to 320ms.
- 16 Tomcat workers don't help: every request must pass through **one** monitor, so effective parallelism is 1. Adding workers only lengthens the queue.

Java monitors are not fair (not FIFO): a newly arrived thread might "cut in line" and grab the lock before a thread that has been waiting longer, causing wide latency variance (avg ~125ms but p99 320ms) even though throughput is hard-capped at ~96 req/s.

### Evidence

- Sample 1 (09:41:02): {{http-nio-8080-exec-7}} RUNNABLE in Jackson {{parseEscapedName}} ← {{parsePriceTable(PricingService.java:137)}} ← {{price(PricingService.java:121)}}, has line {{- locked <0x000000076b4c1a90>}}.
- Sample 2 (09:41:12), 10 seconds later: same lock, but the holder is now {{http-nio-8080-exec-14}} (exec-7 was BLOCKED in sample 1), currently at {{HashMap.resize}} ← {{indexBySku(PricingService.java:143)}} ← {{price(PricingService.java:122)}}; while {{exec-7}} is back in the BLOCKED queue. The lock is **handed off** and the holder is always RUNNABLE — the system is making progress. If it were a deadlock, the holder would stay stuck on the same frame, CPU wouldn't increase, and the JVM would print {{Found one Java-level deadlock}}.
- The {{BLOCKED}} {{http-nio-8080-exec-*}} workers are all at {{PricingService.java:121}} (the first line of the {{synchronized}} method) with {{waiting to lock <0x000000076b4c1a90>}}. {{BLOCKED}} means waiting for the monitor, not consuming CPU. CPU time for each worker increases by ~0.5s in 10s (e.g., exec-12: 39 874ms → 40 396ms) — each thread only runs ~5% of the time.
- {{pidstat}}: process is 82.93% (~0.83 cores) on 4 host CPUs, distributed evenly among 16 workers (~5%/thread). 16 threads are busy but total less than 1 core = serialization. With a 2 vCPU limit, 0.83 core ≈ **41%** — below the 70% autoscaler threshold.
- {{jvm.threads.states blocked = 11}} and {{http.server.requests}}: COUNT increased by 5 781 in 60s ≈ **96 req/s**, matching the 1/10.4ms ceiling. Avg latency = ΔTOTAL_TIME/ΔCOUNT = 722.4s / 5 781 ≈ 125ms ≈ (1 holder + 11 BLOCKED) × 10.4ms — fits Little's law for a sequential service queue.
- No {{Found one Java-level deadlock}} at the end of the dump (HotSpot only prints this if it detects a cycle) — no wait cycle, consistent with unidirectional contention.

### Fix

**Short-term:** parse once on load, only perform lookups in the request path.

~~~java
private volatile Map<String, Price> snapshot = Map.of();   // pre-parsed, immutable

// Load/refresh in background, not in the request path
@Scheduled(fixedDelay = 300_000)
void refresh() {
    byte[] bytes = s3.get(KEY);
    snapshot = indexBySku(parsePriceTable(bytes));          // only update reference after rebuild
}

public Price price(String sku, int qty) {                   // NOT synchronized
    return snapshot.get(sku).multiply(qty);                 // pure lookup, ~microsecond
}
~~~

Key takeaway: **copy-on-write + volatile reference**. Readers never wait for the writer; the writer builds the complete new data set and then swaps the reference in one atomic assignment. The old snapshot remains usable during refresh, no locks needed.

**Long-term:**
- If lazy-loading is required, use {{AtomicBoolean}} to ensure only one thread refreshes, others use the old snapshot instead of queuing.
- Split {{synchronized}} into {{ReentrantReadWriteLock}} if partial updates are truly needed, or use {{ConcurrentHashMap}} + {{computeIfAbsent}} for SKU-based caching.
- For counters/metrics, use {{LongAdder}} instead of {{synchronized}} on a shared object (another very common error).
- Add jitter to the refresh schedule so pods don't hit S3 simultaneously; or pass the version via S3 events.
- If many pods are needed, consider distributed cache (Redis) or load once at startup + file versioning on S3.
- Note on Java 21: virtual threads **won't save you** here. When pinned in a {{synchronized}} block, the virtual thread pins its carrier; and even if not pinned, the mutex still serializes — switching from platform threads to virtual threads only increases the number of queued threads.

| Method | Contention Reduction | When to Use |
|---|---|---|
| Shrink critical section | Yes, most effective | Always, the first step |
| Copy-on-write + volatile | Near zero when reading | Data read heavily, written in batches |
| ReadWriteLock | Parallel reads | Partial updates, strict consistency needed |
| ConcurrentHashMap / LongAdder | Very good | Counters, key-based caching |
| Stripe locking (hash % N) | Good | Data partitionable by key |

### Prevention

- Monitor **number of BLOCKED threads** ({{jvm_threads_states_threads}} or {{jvm.threads.states}}) and **monitor wait time** instead of just CPU. Alert when blocked > 10% of workers for 1 minute.
- Measure directly with JFR: turn on {{-XX:StartFlightRecording=settings=profile}} and watch the {{jdk.JavaMonitorEnter}} event with {{duration > 10ms}}; or use async-profiler in {{lock}} mode to see the lock-holding stack trace.
- Throughput SLO + latency SLO must be alerted independently of CPU; this incident is a classic example of "low CPU but dead system".
- Code review: any {{synchronized}} wrapping IO, parsing, network calls, or large loops must be flagged as a design flaw.

> Senior tip: In interviews, don't just say "add more threads" or "use ConcurrentHashMap". Speak in terms of the formula: max throughput of a sequential segment = 1 / lock holding time, so the right question is "how long is the critical section and can it be read outside the lock?". Real-world tip: take thread dumps 2-3 times 5-10 seconds apart — if the same lock is held and a BLOCKED queue is waiting for it every time, but the holder is RUNNABLE, changing owners or frames, and CPU time is increasing, it's contention (progress is being made, just sequential); deadlocks have the holder stuck forever on the same frame, CPU doesn't increase, and the JVM prints {{Found one Java-level deadlock}}.`,
    rubric: [
      'Distinguish contention from deadlock: lock 0x000000076b4c1a90 is held in both samples but changes hands (exec-7 then exec-14), holder is RUNNABLE and CPU increases, 11 threads are BLOCKED, no wait cycle.',
      'Identify the oversized critical section in the synchronized PricingService.price at line 121, including 2.4 MB JSON parsing and HashMap index rebuilding, making throughput = 1/lock holding time.',
      'Explain why low CPU/autoscaler didn\'t scale and state correct figures: process ~0.83 core (41% of 2-core limit) distributed among 16 workers (~5% each thread), 96 req/s versus 1 400 baseline.',
      'Propose copy-on-write/volatile snapshot or shrinking the critical section, accompanied by monitoring for blocked threads and JFR JavaMonitorEnter.'
    ]
  }
});