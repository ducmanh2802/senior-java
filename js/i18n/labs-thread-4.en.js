/*
 * English translation of js/data/labs-thread.js — task T250. Format: js/core/i18n.js (content overlay).
 * ids: lab-thread-004
 */
App.i18n.content({
  'lab-thread-004': {
    title: 'Virtual thread enabled, but reconciliation API is even slower',
    scenario: `**Context:** **PayVN Recon** (Spring Boot 3.4, Java 21) reconciles transactions with 6 partner banks. Pod limited to 2 vCPU. Last week, the team enabled {{spring.threads.virtual.enabled=true}} to increase capacity (previously 200 platform threads). The {{POST /recon/settle}} endpoint calls a legacy partner SDK via synchronous HTTP; the SDK maintains a client for each bank, and the client's {{send}} method is {{synchronized}} for "safety".

**Symptoms:** After enabling, throughput **decreased** from ~900 req/s to ~42 req/s, p99 increased from 120ms to **5.2s**, pod CPU only ~35% (2 cores). Old thread dumps ({{jcmd 1 Thread.print}}) only show 31 platform threads, hundreds of requests waiting are not visible. No deadlock, GC normal, no connection errors.

**Data collected:** Enabled {{-Djdk.tracePinnedThreads=full}} on canary pod (printed to stdout; this option only exists in JDK 21–23, removed in JDK 24), enabled JFR profile on the other pod, and ran {{jcmd 1 Thread.dump_to_file -format=text /tmp/td.txt}} (268 KB file, 226 virtual threads counted).`,
    questions: [
      'Why did throughput DECREASE after enabling virtual threads? Explain using the number of carrier threads in the artifact and the pinning mechanism.',
      'Point out the exact line of code causing pinning and explain why synchronized around IO differs from ReentrantLock around IO with virtual threads.',
      'Outline the fix plan (short-term, long-term), verification steps after the fix, and warnings when the whole team moves to virtual threads on Java 21.'
    ],
    hints: [
      'Count the number of {{ForkJoinPool-1-worker-*}} threads in the dump: those are carrier threads for virtual thread scheduler, default is equal to available CPUs. Pod has 2 vCPU, so only 2 carriers.',
      'The {{<== monitors:1}} marker means the virtual thread is pinned to the carrier because it is holding a Java monitor (synchronized) while blocking on IO. If the carrier is occupied, other virtual threads cannot run.',
      'JFR shows 330 {{jdk.VirtualThreadPinned}} events in 60 seconds, median 291ms, first app frame is {{LegacySettlementClient.readResponse}} — meaning each settle request pins the carrier for nearly 0.3 seconds. 330 × 0.291s ≈ 96 carrier-seconds out of a total 2 × 60 = 120 carrier-seconds: carriers are pinned ~80% of the time, all other endpoints only get ~20% of carrier time.'
    ],
    answer: `**Summary:** The legacy SDK wraps synchronous HTTP calls in a {{synchronized}} block. On Java 21, virtual threads that block on IO while holding a monitor are **pinned** to the carrier and cannot unmount. The pod has 2 vCPUs, so there are only 2 carriers ({{ForkJoinPool-1-worker-1/2}}); each settle request pins a carrier for ~291ms, effectively reducing the branch calling the SDK to a maximum of 2 concurrent requests and **occupying the carrier for all other endpoints as well**. Virtual threads only help when there are thousands of threads **not** holding carriers while waiting — here, they become a queue on 2 carriers.

### Pinning mechanism — why it is slower than platform threads

Virtual threads run on a **carrier** (platform thread from the {{ForkJoinPool}} scheduler). When a virtual thread calls a "virtual-thread-friendly" blocking operation (socket, {{LockSupport.park}}, {{java.util.concurrent}} locks/queues, {{Thread.sleep}}), the JVM **unmounts** it from the carrier, and the carrier runs other virtual threads. But when a virtual thread blocks while holding a **monitor** (the {{synchronized}} keyword), the JVM cannot unmount it from the carrier's stack, so it **holds the carrier** — known as pinning. On JDK 21, virtual threads **waiting to enter** a held monitor ({{synchronized}} BLOCKED) also pin the carrier. (File IO on JDK 21 also pins, but the scheduler temporarily adds more carriers; pinning due to socket IO **is not compensated**.)

Consequences for a 2 vCPU pod:

~~~text
Default carrier count = Runtime.availableProcessors() = 2
Each request holds carrier when reading response ≈ 291 ms
Theoretical ceiling ≈ 2 / 0.291 ≈ 6.9 requests/second for the pinned branch
~~~

With 200 platform threads, settle requests waiting for IO only occupied **their own threads**; other endpoints still had nearly 200 threads to run. With virtual threads, the 2 carriers are **shared resources for all requests**: JFR recorded 330 pinning events × ~0.291s ≈ 96 carrier-seconds out of 120 available (2 carriers × 60s), meaning ~80% of carrier time is pinned waiting for sockets. All other endpoints (including those not calling the SDK) only get ~20% of carrier time, so total service throughput dropped to ~42 req/s and p99 rose to 5.2s. CPU is low because carriers are waiting on network, not calculating.

### Evidence

- Pinning trace: Carrier {{ForkJoinPool-1-worker-1}} pinned when virtual thread {{tomcat-handler-117}} parked in {{NioSocketImpl.timedRead}}; {{<== monitors:1}} marker is on frame {{LegacySettlementClient.send(...)}} (the {{synchronized}} method), called from {{ReconcileService.settle(...)}}. JDK 21 only prints each pinning stack once, so subsequent settle requests aren't reprinted — do not conclude "it only pinned once".
- JFR: 330 {{jdk.VirtualThreadPinned}} events in 60s, **median 291.2ms**, top frame is {{VirtualThread.parkOnCarrierThread}} — virtual thread wants to park but cannot unmount.
- Carrier dump ({{Thread.print}}): Only {{ForkJoinPool-1-worker-1}} and {{ForkJoinPool-1-worker-2}}, both carrying virtual threads. No third carrier to take work.
- {{Thread.dump_to_file}} counted 226 virtual threads but only 2 carriers: ratio of 113 virtual threads/carrier, huge queue.

### Fix plan

**Short-term:** Roll back {{spring.threads.virtual.enabled=false}} in production (revert to 200 platform threads, 900 req/s throughput), or increase carrier count temporarily via {{-Djdk.virtualThreadScheduler.parallelism=8}} — just pain relief, doesn't fix the root, still wasteful as carriers are blocked.

**Root fix:** Replace {{synchronized}} with {{ReentrantLock}} (or remove if locking isn't needed), and ideally, do not hold any locks around IO:

~~~java
// Before: synchronized holds monitor while reading socket -> pins carrier
public synchronized String send(String payload) {
    return http.post(endpoint, payload);          // 291ms network wait
}

// After: ReentrantLock doesn't pin; best to call IO outside lock scope
private final ReentrantLock lock = new ReentrantLock();
public String send(String payload) {
    Request req;
    lock.lock();
    try {
        req = buildRequest(payload);               // fast, no IO
    } finally {
        lock.unlock();                             // release lock BEFORE HTTP call
    }
    return http.post(req);                         // IO outside lock
}
~~~

Note: switching {{synchronized}} to {{ReentrantLock}} is enough to allow virtual threads to unmount during IO, but if held throughout 291ms, other requests **wait for the lock** (no pinning, but still sequential). Thus, IO must be moved **out of the lock scope**.

**Long-term:**
- Replace legacy SDK with an async HTTP client ({{java.net.http.HttpClient}} with {{sendAsync}}, or WebClient) — no thread waits for network.
- If SDK cannot be replaced, limit concurrency via {{Semaphore}} and use a dedicated platform thread pool (bulkhead), don't let it take down the whole scheduler.
- Upgrade to **JDK 24+** (JEP 491) if you want {{synchronized}} to stop pinning virtual threads — but you still have to redesign locking due to sequentialization. Native calls/JNI still pin even on JDK 24.
- Check all dependencies: JDBC drivers, crypto libs, native file IO might pin; JFR {{jdk.VirtualThreadPinned}} is the tool for discovery.

### Verification

1. Run JFR for 60s under real load, require {{jdk.VirtualThreadPinned}} close to 0 (or < 20ms if threshold exists).
2. Carrier dump: take several {{Thread.print}} samples — carriers when idle should be in {{WAITING (parking)}} in {{ForkJoinPool.awaitWork}}, not carrying the same virtual thread across samples.
3. Compare throughput and p99 with platform thread baseline; expect equal or higher throughput.
4. Check for virtual thread leaks: JFR {{jdk.VirtualThreadStart/End}} (if enabled) or counting via {{Thread.dump_to_file}} over time.`,
    rubric: [
      'Distinguish contention/pinning with deadlock: carrier threads pinned due to synchronized holding across blocking IO, reducing concurrency to the number of carriers (2).',
      'Point out the synchronized block in LegacySettlementClient.send as the cause of pinning, explaining why synchronized (monitor) pins but ReentrantLock (usually) doesn\'t.',
      'Propose reducing the transaction/lock scope: move IO out of the lock (use ReentrantLock for memory state, not IO), or switch to async HTTP client.',
      'Mention monitoring/alerting: JFR VirtualThreadPinned, monitoring carrier thread availability/load, and architectural guidelines against synchronized around IO.'
    ]
  }
});

