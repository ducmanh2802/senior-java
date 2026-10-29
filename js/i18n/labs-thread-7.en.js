/*
 * English translation of js/data/labs-thread.js — task T442. Format: js/core/i18n.js (content overlay).
 * ids: lab-thread-003
 */
App.i18n.content({
  'lab-thread-003': {
    title: 'Throughput dropped 15x, CPU only 41% because of one synchronized block',
    scenario: `**Context:** **PayVN Pricing** (Spring Boot 3.4, Java 21, 2 vCPU limit on Kubernetes) prices e-commerce products dynamically. The JSON price table is loaded from S3 every 5 minutes and cached in memory as a {{byte[]}}. The service has 16 Tomcat workers.

**Symptoms:** After adding a promotion field to the price table (the JSON file grew from 380 KB to 2.4 MB), throughput dropped from **~1,400 req/s to ~96 req/s**, p99 went from 18ms to **320ms**, while pod CPU was only **~41%** (0.82 core against a 2-core limit) and there were no errors, no DB timeouts, no deadlock. The autoscaler threshold is 70% so it never scaled; adding pods only increases total capacity and does not reduce the cost per request.

**Data collected:** Two thread dumps taken 10 seconds apart (same pod), and {{pidstat -t -p 1 1 3}} on the container during the incident.`,
    questions: [
      'Distinguish this phenomenon from deadlock. Why are 11 threads BLOCKED while CPU is only ~41% (0.82 core out of 2 cores) and the autoscaler does not react?',
      'Point out the block of code causing the contention and explain why it got much worse after the JSON file grew from 380 KB to 2.4 MB.',
      'Propose an alternative design to read the price table with almost no locking, and describe how to measure/alert so this kind of degradation is caught early.'
    ],
    hints: [
      'Compare the two samples: does lock <0x000000076b4c1a90> change owner? In sample 1 the holder is exec-7, in sample 2 the holder is exec-14 (and exec-7 is now queueing again). The lock keeps being handed over and the holder is always RUNNABLE with CPU time increasing — the system is making progress, it is just sequential: that is contention, not deadlock.',
      'Look at pidstat: the whole process is only 82.93% (~0.83 core) across the host\'s 4 CPUs, split almost evenly over 16 workers (~5% per thread). 16 threads are busy yet together they use less than 1 core — they take turns running one at a time: the signature of serialization.',
      'In sample 1 the thread holding the lock is parsing the 2.4 MB JSON (line 121 calls parsePriceTable); in sample 2 a different holder is resizing a HashMap to index by SKU (line 122 calls indexBySku). Both are inside the same synchronized price() method starting at line 121.'
    ],
    answer: `**Summary:** This is **lock contention** on the {{0x000000076b4c1a90}} monitor of {{PricingService}}, not a deadlock. Every request goes through {{synchronized}} and **re-parses the entire 2.4 MB price table and rebuilds the index** — the critical section is ~10.4ms, so the theoretical ceiling is only ~96 req/s, exactly the measured throughput. 11 HTTP threads sit {{BLOCKED}} in the queue; CPU is only ~0.83 core (41% of the 2-core limit) because at any moment only one thread runs inside the critical section, so the autoscaler never fires.

### Root cause

The bug is that the service caches the **raw bytes** from S3 but re-parses them on every call, inside a {{synchronized}} method:

~~~java
// PricingService.java — the buggy version
private volatile byte[] tableBytes;      // downloaded from S3 every 5 minutes, cached as RAW bytes

public synchronized Price price(String sku, int qty) {
    PriceTable table = parsePriceTable(tableBytes);  // line 121 (method body at line 137): parses 2.4MB on EVERY request
    Map<String, Price> index = indexBySku(table);    // line 122 (method body at line 143): rebuilds the HashMap
    return index.get(sku).multiply(qty);
}
~~~

The problem is not the use of {{synchronized}} but **the size of the critical section multiplied by its frequency**: the lock is held for the whole parse + index build of **every** request, not just during reload.

- File of 380 KB: parse + index ~0.7ms → ceiling {{1 / 0.0007}} ≈ 1,400 req/s. The 1,400 req/s baseline was in fact already **right at the ceiling**; nobody noticed.
- File of 2.4 MB (~6.3x larger): Jackson parse ~9ms + HashMap rebuild ~1.4ms → critical section ~10.4ms → ceiling {{1 / 0.0104}} ≈ **96 req/s**. Real demand is still above 1,000 req/s, so the excess queues up and p99 reaches 320ms.
- The 16 Tomcat workers do not help: every request must pass through **one** monitor, so effective parallelism is 1. Adding workers only makes the queue longer.

Java monitors are not fair (not FIFO): a newly arriving thread can "cut in line" and grab the lock ahead of a thread that has been waiting longer, so latency is widely spread (mean ~125ms but p99 320ms) even though throughput is hard-capped at ~96 req/s.

### Evidence

- Sample 1 (09:41:02): {{http-nio-8080-exec-7}} is RUNNABLE inside Jackson {{parseEscapedName}} ← {{parsePriceTable(PricingService.java:137)}} ← {{price(PricingService.java:121)}}, with the line {{- locked <0x000000076b4c1a90>}}.
- Sample 2 (09:41:12), 10 seconds later: still the same lock, but the holder is now {{http-nio-8080-exec-14}} (which was still BLOCKED in sample 1), sitting in {{HashMap.resize}} ← {{indexBySku(PricingService.java:143)}} ← {{price(PricingService.java:122)}}; meanwhile {{exec-7}} is back in the BLOCKED queue. The lock is **being handed over** and the holder is always RUNNABLE — the system is making progress. In a deadlock the holder would sit still in the same frame, CPU time would not increase, and the JVM would print a {{Found one Java-level deadlock}} section.
- The BLOCKED {{http-nio-8080-exec-*}} workers are all at {{PricingService.java:121}} (the first line of the {{synchronized}} method) with {{waiting to lock <0x000000076b4c1a90>}}. {{BLOCKED}} means waiting to enter the monitor, which consumes no CPU. Each worker's CPU time grows ~0.5 seconds over 10 seconds (for example exec-12: 39,874ms → 40,396ms) — each thread only gets to run ~5% of the time.
- {{pidstat}}: the process is at 82.93% (~0.83 core) on a 4-CPU host, split almost evenly over 16 workers (~5%/thread). 16 busy threads adding up to less than 1 core = serialization. Against a 2 vCPU limit, 0.83 core ≈ **41%** — below the autoscaler threshold of 70%.
- {{jvm.threads.states blocked = 11}} and {{http.server.requests}}: COUNT increased by 5,781 in 60 seconds ≈ **96 req/s**, matching the 1/10.4ms ceiling. Mean latency = ΔTOTAL_TIME/ΔCOUNT = 722.4s / 5,781 ≈ 125ms ≈ (1 holder + 11 BLOCKED) × 10.4ms — exactly Little's law for a queue served sequentially.
- There is no {{Found one Java-level deadlock}} section at the end of the dump (HotSpot only prints it when it detects a cycle) — no wait cycle, consistent with one-way contention.

### Fix

**Short-term:** parse once at load time and only look up in the request path.

~~~java
private volatile Map<String, Price> snapshot = Map.of();   // already parsed, immutable

// Load/refresh runs in the background, off the request path
@Scheduled(fixedDelay = 300_000)
void refresh() {
    byte[] bytes = s3.get(KEY);
    snapshot = indexBySku(parsePriceTable(bytes));          // build everything first, then swap the reference
}

public Price price(String sku, int qty) {                   // NOT synchronized
    return snapshot.get(sku).multiply(qty);                 // pure lookup, a few microseconds
}
~~~

The key point: **copy-on-write + volatile reference**. Readers never wait for a writer; the writer builds a complete new dataset and swaps the reference in a single atomic assignment. The old snapshot stays usable during the refresh, with no lock needed.

**Long-term:**
- If you must lazy-load, use {{AtomicBoolean}} so only one thread refreshes while other requests keep using the old snapshot instead of queueing.
- Split {{synchronized}} into {{ReentrantReadWriteLock}} if you really need partial updates, or use {{ConcurrentHashMap}} + {{computeIfAbsent}} for a per-SKU cache.
- Use {{LongAdder}} for counters/metrics instead of {{synchronized}} on a shared counter object (another very common mistake).
- Add jitter to the refresh schedule so many pods do not hit S3 at the same moment; or publish a version through S3 events.
- If you need many pods, consider a distributed cache (Redis), or load once at startup plus a file version on S3.
- Note for Java 21: virtual threads do **not** rescue this case. When pinned inside {{synchronized}}, a virtual thread keeps its carrier; and even without pinning, the mutex still serializes — switching platform threads to virtual threads only increases the number of threads queueing.

| Approach | Reduces contention | When to use |
|---|---|---|
| Shrink the critical section | Yes, strongest | Always, the first step |
| Copy-on-write + volatile | Nearly zero on reads | Read-heavy data, batched writes |
| ReadWriteLock | Parallel reads | Partial writes, consistency required |
| ConcurrentHashMap / LongAdder | Very good | Counters, per-key caches |
| Striped locking (hash % N) | Good | Data that can be partitioned by key |

### Prevention

- Track the **number of BLOCKED threads** ({{jvm_threads_states_threads}} or {{jvm.threads.states}}) and **monitor wait time**, not just CPU. Alert when blocked > 10% of workers for 1 minute.
- Measure directly with JFR: enable {{-XX:StartFlightRecording=settings=profile}} and look at the {{jdk.JavaMonitorEnter}} event with {{duration > 10ms}}; or use async-profiler in {{lock}} mode to see the stack that holds the lock.
- Throughput SLO + latency SLO must alert independently of CPU; this incident is the textbook case of "CPU low but the system is dead".
- Code review: any {{synchronized}} that wraps IO, parsing, network calls, or a large loop must be treated as a design bug.

> Senior tip: In an interview, do not answer "add more threads" or "just use ConcurrentHashMap". Say it as a formula: the maximum throughput of a sequential section = 1 / time the lock is held, so the right question is "how long is the critical section and can the read be moved outside the lock?". A practical trick: take thread dumps 2–3 times, 5–10 seconds apart — if every time the same lock is held and a queue of BLOCKED threads is waiting for it, but the holder is RUNNABLE and changes owner or frame with CPU time increasing, that is contention (progress, just sequential); a deadlock's holder stays frozen in the same frame forever, CPU does not increase, and the JVM prints {{Found one Java-level deadlock}} itself.`,
    rubric: [
      'Distinguish contention from deadlock: lock 0x000000076b4c1a90 is held in both samples but changes owner (exec-7 then exec-14), the holder stays RUNNABLE and CPU time increases, 11 threads are BLOCKED, and there is no wait cycle.',
      'Identify the oversized critical section in synchronized at PricingService.price line 121, covering the 2.4 MB JSON parse and the HashMap index rebuild, which makes throughput = 1/lock-hold time.',
      'Explain the low CPU / no autoscaling with the correct numbers: process ~0.83 core (41% of the 2-core limit) split evenly over 16 workers ~5% each, 96 req/s versus a 1,400 baseline.',
      'Propose copy-on-write/volatile snapshot or shrinking the critical section, together with monitoring on blocked threads and the JFR JavaMonitorEnter event.'
    ]
  }
});
