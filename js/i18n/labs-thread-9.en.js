/*
 * English translation of js/data/labs-thread.js — task T444. Format: js/core/i18n.js (content overlay).
 * ids: lab-thread-007 lab-thread-008
 */
App.i18n.content({
  'lab-thread-007': {
    title: 'SMS provider failure takes down notify-service: 187 threads stuck inside the Logback AsyncAppender',
    scenario: `**Context:** **PayVN Notify** (Spring Boot 3.4, Java 21, Logback 1.5, Tomcat 200 threads) sends OTPs and transaction notifications over SMS/email. Logging goes through an {{AsyncAppender}} wrapping a {{RollingFileAppender}} that writes to {{/var/log/app}} — a directory mounted from **Amazon EFS (NFS)** so the ops team "would not have to get into the pod to fetch logs".

**Symptoms:** At **11:32 on 25/10/2026**, the SMS provider started returning HTTP 503. The SMS sending code retries 3 times, and on every failure it logs {{log.warn(..., e)}} with the **full stack trace**; once retries are exhausted it logs {{log.error}}. From 11:33 the **whole service** (email and health checks included) slowed down: p99 went from 80 ms to **28 s**, ingress returned 504, the readiness probe failed. Pod CPU was only **9%**, heap was normal, the DB was normal. When the SMS provider recovered at 11:51, the service recovered by itself after ~1 minute.

**Data collected:** {{jcmd 1 Thread.print}} at 11:41:20 (counts already done), the {{logback-spring.xml}} configuration, mount information and log rate numbers.`,
    questions: [
      'Why does an SMS provider failure slow down the email endpoint and the health check too? Point to the bottleneck in the dump.',
      'Explain how the AsyncAppender behaves with its default configuration: when are events dropped, and when is the thread calling log blocked? Why do INFO events keep flowing while WARN/ERROR block?',
      'Propose short-term and long-term fixes, with their trade-offs (losing logs vs blocking requests).'
    ],
    hints: [
      '187 HTTP threads all park on the same ConditionObject {{<0x00000007c08a3b10>}} inside {{ArrayBlockingQueue.put}}, called from {{AsyncAppenderBase.put}}: they are waiting for a free slot in the log queue.',
      'Only 1 thread, {{AsyncAppender-Worker-ASYNC_FILE}}, takes events out and writes them to a file on NFS. Compare the write rate (~340 events/s) with the rate at which WARN+ERROR events are produced (~5,200 events/s).',
      'Logback: when the number of free slots falls below {{discardingThreshold}} (20% of the queue by default), TRACE/DEBUG/INFO events are dropped, while WARN/ERROR are always kept; if {{neverBlock=false}} then {{put}} blocks when the queue is full.'
    ],
    answer: `**Summary:** "Async" logging can still **block** business threads. When the SMS provider fails, the service produces ~5,200 WARN/ERROR events per second with stack traces, but the **single** worker of the {{AsyncAppender}} can only write ~340 events/s to EFS (NFS, flushing on every event). The 256-slot queue fills in under 0.1 seconds; with the default configuration ({{neverBlock=false}}), every thread calling {{log.warn/error}} parks inside {{ArrayBlockingQueue.put}} — 187 of 200 Tomcat threads are stuck, so email and the health check die too. Fix: {{neverBlock=true}}, write logs to stdout/local disk, and cut the volume of error logging (no stack trace on every retry, circuit breaker).

### Ground up: how AsyncAppender works

Writing to a file is slow I/O (a few ms, and NFS is even slower), so Logback lets you wrap the real appender in an {{AsyncAppender}}: the business thread only **drops the event into a queue** ({{ArrayBlockingQueue}}, 256 slots by default) and moves on; a **single worker thread** takes events out and writes them to the file. It works like a mail counter: customers drop letters into a box and leave, and one clerk carries the letters away and posts them.

The key question: **what happens when the mailbox is full?** Logback gives you two knobs:

| Property | Default | Meaning |
|---|---|---|
| {{queueSize}} | 256 | Queue capacity |
| {{discardingThreshold}} | queueSize/5 (= 51) | When the number of **free** slots drops below this threshold, TRACE/DEBUG/INFO events are **dropped**; WARN/ERROR are **never** dropped |
| {{neverBlock}} | false | false: {{put()}} waits until there is room (blocking the logging thread). true: uses {{offer()}}, dropping the event when the queue is full |

So with the default configuration, as the queue approaches full: INFO events are silently dropped (the thread is not blocked), while **WARN/ERROR must wait for a free slot**. That is why in the dump all 187 threads sit inside {{Logger.warn}} or {{Logger.error}} — exactly the events that are not allowed to be dropped.

### Why the worker is too slow

~~~text
Produced:   WARN 3,900/s + ERROR 1,300/s = 5,200 events/s (each event has a ~9 KB stack trace)
Consumed:   1 worker x (1 / 2.9 ms) ≈ 340 events/s
Gap:        ~4,860 events/s surplus -> the 256-slot queue fills in ~0.05 s
After that: the logging rate of the WHOLE JVM = the worker rate = 340 events/s
            -> every thread must wait for its turn to log before it can return the response
~~~

The worker is slow for two compounding reasons: {{immediateFlush=true}} (the default) means every event is one {{write()}} to the file; and the file lives on **NFS over the network** (EFS), so every write costs a round trip to the storage server. A local disk or stdout is orders of magnitude faster.

Why do **email and the health check** die as well? Because they share the same 200 Tomcat threads. With 187 threads stuck in logging, only 13 are left for all requests; email also logs ERROR (for example {{EmailSender.send}} logs a template error on line 61), so it gets stuck too. Readiness probe timeouts -> Kubernetes removes the pod from the Service -> traffic shifts to the other pods -> those pods get stuck as well. A failure at an **external partner** escalated into a service-wide outage through a **shared resource: the log queue**.

### Evidence from the artifacts

- 187 exec threads park on the **same** {{<0x00000007c08a3b10>}} (the queue's "notFull" {{ConditionObject}}) inside {{ArrayBlockingQueue.put}} <- {{AsyncAppenderBase.putUninterruptibly}} <- {{Logger.warn}}/{{Logger.error}}.
- The only {{AsyncAppender-Worker-ASYNC_FILE}} thread is RUNNABLE in {{FileOutputStream.writeBytes}} (native), and all 3 consecutive dumps show it in that same place; its accumulated cpu is huge (912 s) because it works non-stop.
- Configuration: {{queueSize=256}}, {{neverBlock}} not declared -> false, {{immediateFlush}} not declared -> true; {{nfs4}} mount from EFS.
- Numbers: warn+error rose from 2/s to 5,200/s exactly when SMS broke, while the worker only manages ~340 events/s. INFO fell slightly (310 -> 290/s) only because there were fewer requests; in reality many INFO events were dropped inside the appender without anyone noticing.
- CPU 9%: the threads are parked, not computing.

### Fix

**Short term:**
- Enable {{<neverBlock>true</neverBlock>}}: when the queue is full, drop the event instead of blocking — losing logs beats losing the service.
- Reduce logging: on a failed retry log a single {{warn}} line (without a stack trace), and log the stack trace once when retries are exhausted; add a **circuit breaker** (Resilience4j) on the SMS provider so the service stops calling it and stops logging while the partner is down.

~~~java
// Before: 3 retries x a 62-line stack trace
log.warn("SMS send failed attempt={} to={}", attempt, maskedPhone, e);
// After: one compact line; the stack trace is logged only at DEBUG
log.warn("SMS send failed attempt={} status={} msg={}", attempt, status, e.getMessage());
~~~

**Long term:**
- Write logs to **stdout** (or the node's local disk) and let an agent (Fluent Bit, CloudWatch agent) ship them; do not write logs directly to NFS.
- Set {{immediateFlush=false}} on the file appender if you accept losing the last few events when the JVM crashes.
- Consider a fully non-blocking appender (for example the Log4j2 async logger with a discard policy) and a **metric for dropped events** so you know when logs are being lost.
- Put the "log queue" on the list of shared resources that need a bulkhead, just like a connection pool.

| Option | Business threads blocked? | Logs lost? |
|---|---|---|
| Default (neverBlock=false) | Yes, when full | INFO lost when nearly full |
| neverBlock=true | No | WARN/ERROR lost too when full |
| Large queueSize (e.g. 8192) | Only delays it | Less, but costs RAM; a long burst still fills it |
| Less logging + circuit breaker | Rarely | The least — fixes the root cause |

### Common mistakes

- Believing that "AsyncAppender = never blocks". The Logback default **blocks** for WARN/ERROR.
- Only increasing {{queueSize}}: if the burst lasts minutes, any queue fills up; it just delays the incident and increases RAM usage.
- Logging a stack trace on every retry or inside a loop; one partner failure then produces tens of MB of logs per second.
- Reading the dump, seeing WAITING and thinking the threads are "idle"; you must look at **what** they wait for (the same ConditionObject = the same queue).

### One-minute verbal answer

"The dump shows 187 of 200 Tomcat threads parked in ArrayBlockingQueue.put inside Logback's AsyncAppender, on the same condition, all of them calling log.warn or log.error. A single worker writes logs to EFS at about 340 events per second, while the SMS failure produces five thousand WARN/ERROR events with stack traces every second. By default Logback drops INFO when the queue is nearly full but never drops WARN/ERROR, and neverBlock is false, so the threads are blocked. Because the thread pool is shared, email and the health check die too. I would enable neverBlock, cut stack-trace logging, add a circuit breaker for SMS and move logging to stdout instead of NFS."

> Senior tip: In postmortems I always ask "is the logging path a synchronous dependency?". Logs, metrics and tracing exporters are all I/O; if they can block business threads, they are a shared failure point. One number worth remembering: a typical Spring stack trace has 60–100 lines, ~8–10 KB; 1,000 errors per second is ~10 MB/s of logs alone — enough to clog many logging systems. Rate-limit repeated error logs and measure "log events dropped" as well.`,
    rubric: [
      'Identifies the right bottleneck: 187 HTTP threads parked in ArrayBlockingQueue.put inside AsyncAppenderBase (the same ConditionObject 0x00000007c08a3b10), with a single worker writing to an NFS file.',
      'Explains the Logback AsyncAppender defaults correctly: queueSize 256, discardingThreshold 20% drops only TRACE/DEBUG/INFO, WARN/ERROR are kept, neverBlock=false so put blocks when full.',
      'Quantifies: ~5,200 WARN/ERROR events/s produced vs ~340 events/s consumed (immediateFlush + NFS), and explains why email and the health check die too (shared 200 Tomcat threads).',
      'Proposes fixes with trade-offs: neverBlock=true (accepting lost logs), less stack-trace logging/rate limiting, a circuit breaker for SMS, logs to stdout/local disk instead of NFS, and a metric for dropped events.'
    ]
  },
  'lab-thread-008': {
    title: 'FX rates freeze for 12 seconds every hour: ReadWriteLock and one waiting writer',
    scenario: `**Context:** **PayVN FX** (Spring Boot 3.4, Java 21) serves exchange rates to every foreign-currency transaction, ~2,500 req/s via {{GET /fx/rate}}. The rate table holds 180 currency pairs in {{RateTable}}, guarded by a {{ReentrantReadWriteLock}} (non-fair by default) on the grounds that "reads are frequent and writes are rare, so a read lock lets reads run in parallel". The {{fx-refresh}} job refreshes the table every 30 seconds. This month the BI team added an endpoint {{GET /fx/export}} that exports a CSV snapshot plus history, and their BI tool calls it at **minute 15 of every hour**.

**Symptoms:** Since 25/10/2026, at exactly **hh:15:30 -> hh:15:42** every hour, p99 of {{/fx/rate}} jumps from 4 ms to **11.8 seconds**, and foreign-currency payments time out in bulk. CPU is low, there is no long GC and no DB error. The team argues: "a read lock is shared, the export only reads, how could it block anyone?"

**Data collected:** the application log around 10:15, {{jcmd 1 Thread.print -l}} at 10:15:36 and the {{RateTable}} source.`,
    questions: [
      'The export only holds a read lock, so why are the rate-lookup requests (which also only need a read lock) blocked? Explain how the non-fair ReentrantReadWriteLock works and reconstruct the timeline from the log.',
      'Why does the dump show no thread holding lock 0x00000007b3a01c88? How do you deduce who holds it?',
      'Propose at least 2 redesigns of RateTable and compare their trade-offs. As a lead, what rules would you set for the team?'
    ],
    hints: [
      'Watch the timing: the export starts at 10:15:02 but /fx/rate only slows down from 10:15:30 — exactly when fx-refresh-1 asks for the write lock. What changes once a writer is waiting?',
      'In a non-fair ReentrantReadWriteLock, a new reader blocks itself if the thread at the head of the wait queue is a writer (the anti writer-starvation mechanism). That writer is in turn waiting for the old reader — the export — to release the lock.',
      'jstack only lists ownable synchronizers held in exclusive mode (exclusive owner). A read lock is shared, so it never shows up; you have to infer it from the stack: which thread is inside exportSnapshot after calling readLock().lock()?'
    ],
    answer: `**Summary:** The export holds the **read lock for ~40 seconds** because it performs an HTTP call to fetch history for 180 currency pairs **inside** the locked region. At 10:15:30, {{fx-refresh-1}} asks for the **write lock** and has to wait for the export. In {{ReentrantReadWriteLock}}, when a writer sits at the head of the queue, **new readers must queue behind the writer too** (so the writer is not starved). The result: 171 rate-read requests are blocked for ~11.7 seconds until the export finishes. Fix: never do I/O inside a locked region; better still, remove the lock for readers with an **immutable snapshot + volatile** (copy-on-write).

### Ground up: ReadWriteLock and the "don't starve writers" rule

A read-write lock hands out two kinds of tickets: a **read ticket** (several holders at once) and a **write ticket** (one holder only, and nobody may read while it holds the ticket). It sounds like "reads never block reads". But picture a meeting room: people keep streaming in and out continuously, 2,500 per second. If a new reader is always allowed in as long as another reader is inside, the room **never empties** and the writer waits forever — that is **writer starvation**.

To avoid that, {{ReentrantReadWriteLock}} (in its default non-fair mode too) follows this rule: a new reader calling {{readLock().lock()}} **blocks itself if the head of the wait queue is a writer** (in the JDK source: {{readerShouldBlock()}} -> {{apparentlyFirstQueuedIsExclusive()}}). In other words, a writer that is **waiting** "closes the door" to every new reader until it has entered and left. The writer, in turn, waits for **all existing readers** to return their read tickets.

~~~text
10:15:02  exec-3 (export) takes the READ lock ------------------------+ holds it ~39.6 s
                                                                     |
10:15:02..10:15:30  reader /fx/rate enters/leaves normally (read // read) | p99 4 ms
                                                                     |
10:15:30.044  fx-refresh-1 asks for the WRITE lock -> must wait for the export |
              AQS wait queue: [WRITER fx-refresh-1]                  |
10:15:30+     a new reader sees a WRITER at the head -> queues behind |
              wait queue: [WRITER][R exec-212][R exec-187]... 171 R  |
10:15:41.733  the export releases the READ lock <---------------------+
10:15:41.734  the WRITER enters, updates 180 pairs (a few us), releases
10:15:41.736  the 171 readers are woken up and return their results (elapsed up to 11,688 ms)
~~~

So **the export on its own blocks nobody**; the **waiting writer** is the "door". Combine the two: one slow reader + one ordinary writer = every reader slows down. Because the export lasts 40 seconds > the 30-second refresh period, **every export is guaranteed to overlap a refresh**, which is why the incident repeats at exactly hh:15:30 every hour.

### Why the dump shows nobody holding the lock

The "Locked ownable synchronizers" section of {{jstack -l}} / {{Thread.print -l}} only lists {{AbstractOwnableSynchronizer}} objects for which the thread is the **exclusive owner** ({{exclusiveOwnerThread}}) — for example a {{ReentrantLock}} or a write lock. A **read lock is shared**, so AQS only counts read holdings and does not record who holds them, meaning it **never appears** there. This is a very common trap: 172 threads wait on a lock and "nobody holds it".

How to reason: find the thread that is running **inside** code that took the read lock. Only {{http-nio-8080-exec-3}} is in {{RateTable.exportSnapshot(RateTable.java:64)}} — line 64 is after {{rw.readLock().lock()}} and before {{unlock()}}, so it holds the read lock while waiting on the socket ({{HttpURLConnection.getInputStream}} -> {{NioSocketImpl.timedRead}}). That thread is RUNNABLE, but it is really waiting on the network (native poll).

### Evidence from the artifacts

- Log: export start 10:15:02.118, done 10:15:41.733 (39,615 ms ≈ 180 x 220 ms). Refresh 10:15:30.044 "acquiring write lock", applied 10:15:41.734 with {{waitedForLock=11690ms}}. The slowest request, 11,688 ms, finished at 10:15:41.736 — 2 ms after the writer.
- The first 28 seconds of the export (10:15:02 -> 10:15:30) had a normal p99: proof that the export's read lock **does not** block readers while no writer is waiting.
- Dump: 172 threads parked on the same {{<0x00000007b3a01c88>}} ({{ReentrantReadWriteLock$NonfairSync}}): 1 in {{WriteLock.lock}} ({{RateTable.refresh}} line 51), 171 in {{ReadLock.lock}} ({{RateTable.get}} line 41).
- No thread lists {{0x00000007b3a01c88}} under ownable synchronizers -> the holder is a reader (shared), consistent with exec-3 inside exportSnapshot line 64.

### Fix

**Short term:** move the I/O out of the locked region — copy the table under the read lock (180 entries, a few µs), release the lock, and only then make the HTTP calls:

~~~java
public void exportSnapshot(Writer out) throws IOException {
    Map<String, Rate> copy;
    rw.readLock().lock();
    try { copy = Map.copyOf(rates); }          // hold the lock for a few microseconds
    finally { rw.readLock().unlock(); }
    for (var e : copy.entrySet()) {            // slow I/O happens OUTSIDE the lock
        out.write(csvLine(e.getKey(), e.getValue(), historyClient.fetch(e.getKey())));
    }
}
~~~

**Root fix — readers do not need a lock at all (immutable snapshot):** the data is written once every 30 seconds and read 2,500 times per second, so copy-on-write is the natural model:

~~~java
public class RateTable {
    private volatile Map<String, Rate> rates = Map.of();  // immutable table
    public Rate get(String pair) { return rates.get(pair); } // no lock, no waiting
    public void refresh(Map<String, Rate> fresh) {
        rates = Map.copyOf(fresh);   // build a new table, swap the reference in one step
    }                                // volatile guarantees readers see a complete table
    public Map<String, Rate> snapshot() { return rates; }   // export uses the snapshot
}
~~~

A reader loads the {{volatile}} reference and looks up the immutable map: no queue, no writer starvation, no reader starvation. The export grabs {{snapshot()}} and can take as long as it likes without affecting anyone. Note that the old code {{rates.clear(); rates.putAll(...)}} carries another risk: if somebody ever removes the lock, a reader could see an **empty** table between clear and putAll.

### Comparing the options

| Option | Do readers wait? | Complexity | When to use |
|---|---|---|---|
| RRWL + I/O inside the lock (current) | Yes, while a writer waits | Low | Never |
| RRWL, copy first, I/O outside the lock | Very briefly (µs) | Low | Large data updated in parts |
| Fair RRWL ({{new ReentrantReadWriteLock(true)}}) | Still yes — FIFO fairness also queues readers behind the writer | Low | Does not solve this problem |
| {{StampedLock}} optimistic read | Almost never | High, easy to get wrong, not reentrant | Extremely hot path, small data |
| Immutable snapshot + volatile | Never | Low | Read-heavy, periodic full refresh (this case) |

One more note: {{writeLock().tryLock(timeout)}} does **not** save you, because the writer still joins the wait queue while its timeout runs and still blocks new readers; only the no-argument {{tryLock()}} "barges in" without queuing.

### Rules for the team (lead view)

1. **No I/O, no calls to other services, no heavy logging inside a locked region** — applies to {{synchronized}}, {{ReentrantLock}}, read locks and distributed locks alike.
2. Data that is "read often, written periodically" -> default to an immutable snapshot; only use RRWL when you have measured a reason to.
3. Every new endpoint (like the BI export) must be reviewed for the shared resources it touches, not just for its logic.
4. Measure **lock hold time** (a timer around the locked region, or the {{jdk.ThreadPark}} JFR event) and alert when it exceeds a threshold.

### Common mistakes

- Believing that "a read lock never blocks a read lock". True when no writer is waiting; false when one is.
- Switching to fair mode to be "fairer" — fair mode is even stricter; readers also queue behind the writer in FIFO order.
- Reading the dump, seeing nobody owns the lock and suspecting a "JVM bug" or a "lost wakeup"; in reality read locks simply show no owner.
- Only looking at BLOCKED/WAITING threads and skipping the RUNNABLE thread sitting in a socket read — that thread is the culprit.

### One-minute verbal answer

"The BI export holds the read lock for 40 seconds because it makes an HTTP call for 180 currency pairs inside the locked region. That on its own blocks nobody, as the first 28 seconds show a normal p99. But at 10:15:30 the refresh job asks for the write lock and must wait for the export; in ReentrantReadWriteLock, when a writer is at the head of the queue, new readers must queue behind it so the writer is not starved, so 171 rate reads get stuck for 11.7 seconds. The dump shows nobody holding the lock because a read lock is shared, so you have to infer the holder from the thread sitting in exportSnapshot on line 64. I would move the I/O outside the lock right away, and in the longer term switch to an immutable map behind a volatile reference so readers need no lock at all."

> Senior tip: When I see {{ReentrantReadWriteLock}} in a code review, I ask "what is the read/write ratio and what is the longest lock hold time?". In most cases — read-heavy, batch writes — copy-on-write with a {{volatile}} reference is both simpler and faster: {{get}} becomes one volatile read plus one map lookup, with no CAS on the reader counter (at 2,500 req/s across many cores, a CAS on a shared variable causes cache-line contention on its own). RRWL is only worth it when the data is too large to copy and is updated in parts.`,
    rubric: [
      'Explains the mechanism correctly: the export holds the read lock for a long time because of I/O inside the locked region; the writer fx-refresh asks for the write lock and waits; new readers block themselves because the head of the queue is a writer (anti writer-starvation, applies to non-fair mode too), so 171 requests are blocked.',
      'Reconstructs the timeline from the log: export 10:15:02–10:15:41.733 (39,615 ms), no slowdown in the first 28 seconds, the writer waiting from 10:15:30.044 with waitedForLock=11690 ms, the slowest request 11,688 ms finishing right after the writer; it repeats hourly because a 40 s export > the 30 s period.',
      'Explains why no thread appears to own lock 0x00000007b3a01c88 (a shared read lock has no exclusive owner) and deduces that exec-3 inside exportSnapshot line 64 is the holder.',
      'Proposes fixes: copy then I/O outside the lock (short term), immutable snapshot + volatile (long term), compares with fair mode/StampedLock/tryLock, and sets team rules (no I/O inside locks, measure lock hold time).'
    ]
  }
});
