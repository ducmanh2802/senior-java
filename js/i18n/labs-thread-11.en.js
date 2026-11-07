/*
 * English translation of js/data/labs-thread.js — task T1005. Format: js/core/i18n.js (content overlay).
 * ids: lab-thread-011
 */
App.i18n.content({
  'lab-thread-011': {
    title: `Synchronous logging blocks all requests when the disk is slow and full`,
    scenario: `**Context:** **PayVN Ledger** (Spring Boot 3.4, Java 21, Logback 1.5, Tomcat 200 threads, 2 vCPU pod on Kubernetes) records the transaction ledger. Application logging goes through Spring Boot's default configuration into file {{/var/log/app/ledger.log}} via {{RollingFileAppender}} (appender = the logging framework's "writer", receives log events and writes to a destination such as file/console). Directory {{/var/log/app}} is mounted from a **PersistentVolume** (disk attached to the pod) using block storage backend.

**Symptoms:** At **09:14 on 06/11/2026**, the operations team received alert "disk utilization 100%" on the log volume. From 09:14:30, **every API** of Ledger (including {{GET /actuator/health}}) started hanging: p99 jumped from 60ms to over 20 seconds, Ingress returned 504 repeatedly. Pod CPU only **6%**, heap stable, HikariCP {{active=2/20 idle=18 pending=0}} (DB nearly idle). After clearing old log files at 09:27, p99 returned to normal within 1 minute **without restart**.

**Data collected:** {{jcmd 1 Thread.print -l}} at 09:19:10, {{df -h}} and {{iostat -x 1 3}} on the node while disk was full, {{logback-spring.xml}} configuration, and pod log (excerpted from stdout sidecar because the file appender is clogged).`,
    questions: [
      'Why does a full/slow disk HANG nearly all APIs, even though CPU and DB are idle? Give evidence from the thread dump (thread name, lock ID, count).',
      'Explain the synchronous logging mechanism in Logback: why does only 1 thread hold the lock and 193 threads get BLOCKED? Distinguish "waiting for I/O" (RUNNABLE/native) from "blocked by monitor" (BLOCKED).',
      'Propose short-term and long-term fixes: how to use AsyncAppender (queueSize, discardingThreshold, neverBlock), handle full disk, and the trade-off between "not slowing down the app" and "not losing logs".'
    ],
    hints: [
      'Find monitor {{<0x0000000712c04a10>}} in the dump: which thread has the {{- locked ...}} line (holding it) and what is it doing (stack includes {{FileOutputStream.writeBytes}})? What state are the other threads {{- waiting to lock ...}} in?',
      'Logback\'s file appender uses {{synchronized}} around the write operation ({{subAppend}}) to protect the stream. With synchronous disk write ({{immediateFlush=true}} default), the thread calling {{log.info(...)}} must finish writing to disk before releasing the lock. Disk 100% + {{await ~1s}} => lock held for a long time.',
      'Look at the configuration: no {{AsyncAppender}}. Compare with the other logging lab: {{AsyncAppender}} separates "putting log into queue" (fast) from "writing to disk" (slow) using a separate worker, but you must configure {{neverBlock=true}} and {{discardingThreshold}} so a clogged worker doesn\'t crash the app.'
    ],
    answer: `**Summary:** Logging is configured **synchronously** ({{RollingFileAppender}} directly, without {{AsyncAppender}}). Logback protects the file-writing thread with one monitor: at any time only 1 thread can write. Thread {{http-nio-8080-exec-12}} holds monitor {{<0x0000000712c04a10>}} of {{RollingFileAppender}} and is stuck in {{FileOutputStream.writeBytes}} because disk {{/var/log/app}} is full at 100% ({{await ~1s}}, {{%util 100%}}). While it holds the lock, **193** other Tomcat threads (nearly all 200 threads serving requests) are {{BLOCKED}} when trying to call {{log.info(...)}}. CPU/DB idle but no free thread left to process requests, so every API (including health) hangs. After clearing the disk, the stuck write completes, the lock is released, the app recovers automatically.

### Background terms (explained from scratch)

- **Log / logging:** the application records events (which API was called, what error) for later investigation. Real-life analogy: a shift logbook.
- **Appender (Logback):** component that receives one log line and writes it to a destination. {{RollingFileAppender}} writes to a file and automatically "rolls" the file (creates a new one) when too large/too many days.
- **Synchronous write:** the thread calling {{log.info(...)}} must **itself** finish writing that line to disk before continuing. Like you must personally deliver the form, wait for the officer to stamp it, before going home.
- **Monitor / {{synchronized}}:** Java\'s "lock" attached to an object. Only one thread holds the lock at a time; other threads wanting to enter a {{synchronized}} block switch to state {{BLOCKED}} (blocked), waiting outside the door, **spending no CPU** but also **doing no work**.
- **{{AsyncAppender}}:** intermediary buffer. The business thread just drops the log event into an **in-memory queue** (very fast) and continues; a separate worker thread takes from the queue and writes to disk. Slow disk only clogs the worker, not directly blocking business threads — *if configured correctly*.
- **Blocking I/O:** an OS read/write call where data is not ready (disk full/slow), so the thread hangs at the native call until done.

### Mechanism: why 1 clogged thread hangs 193 threads

The write path of {{RollingFileAppender}} (simplified):
~~~java
// Logback OutputStreamAppender (mechanism illustration)
protected void subAppend(E event) {
    synchronized (this) {                 // (1) only 1 thread enters: takes the appender\'s monitor
        byte[] bytes = encoder.encode(event);
        writeBytes(bytes);                // (2) write to OutputStream -> FileOutputStream
        if (immediateFlush) stream.flush(); // (3) force to disk IMMEDIATELY (default true)
    }                                     // (4) release monitor
}
~~~

When disk is full/slow:
1. {{exec-12}} enters the {{synchronized}} block, takes {{- locked <0x0000000712c04a10>}} (monitor of the {{RollingFileAppender}} itself), calls {{FileOutputStream.writeBytes}} (native). The kernel cannot write (volume 100%, {{await ~1s}}) so the native call **hangs**. Thread is state {{RUNNABLE}} (running native) but actually waiting on I/O — important: it **still holds the lock**.
2. Other threads ({{exec-41}}, {{exec-97}}, ...) call {{log.info}} → reach {{subAppend}} → hit {{synchronized (this)}} on the **same object {{0x0000000712c04a10}}** → cannot enter → switch to {{BLOCKED (on object monitor)}}, {{- waiting to lock <0x0000000712c04a10>}}.
3. Tomcat has 200 threads serving requests; 193 threads {{BLOCKED}} + 1 thread stuck holding lock + 6 idle = **almost no thread left to process new requests**. Incoming requests queue in the accept queue then timeout 504. {{/actuator/health}} also needs a Tomcat thread and itself logs → also affected.

This is a "shared resource becomes single bottleneck" incident: every request goes through logging, logging again serialized by one lock + one disk.

### Evidence (matching numbers)

- Single monitor: {{<0x0000000712c04a10> (a ch.qos.logback.core.rolling.RollingFileAppender)}}. {{exec-12}} holds ({{- locked}}) at {{OutputStreamAppender.subAppend:238}}, {{RUNNABLE}} at {{FileOutputStream.writeBytes}} (native) — exactly when writing to disk. {{exec-41}} ({{info}} at {{LedgerController.postEntry:44}}) and {{exec-97}} ({{info}} at {{LedgerController.getEntry:61}}) both {{BLOCKED}} {{- waiting to lock <0x0000000712c04a10>}} at {{subAppend:238}}.
- Dump statistics: 193 threads waiting for lock, 1 holding lock, 6 idle → matches 200 Tomcat threads. Holding lock across 3 consecutive dumps (09:19:10/20/30) → not fleeting.
- Disk: {{/dev/vdb}} 10G used 100%, {{Avail 0}}. {{iostat}} {{await ~940-1120ms}}, {{%util 100%}}, {{wkB/s}} only 4-12KB → write nearly jammed because out of space.
- False health: CPU 6%, HikariCP {{active=2/20 pending=0}} → DB/CPU not the cause. Recovery after clearing disk **without restart** → confirms not a permanent deadlock, but lock held too long by I/O.
- Configuration: no {{AsyncAppender}}, {{immediateFlush}} default true → path fully synchronous.

### Fix

**Short term (recover now):**
1. Clear old log files / add space for {{/var/log/app}} (already done at 09:27, app recovers itself).
2. Check {{maxHistory/totalSizeCap}} of {{RollingFileAppender}} to auto-delete old logs; set disk usage alert (e.g. > 80%).
3. If you must keep the file appender temporarily, consider {{immediateFlush=false}} to reduce flush count (trade-off: JVM crash may lose a few last lines in buffer).

**Long term (design correctly):** separate "generate log" from "write to disk" using {{AsyncAppender}}, and configure so a clogged worker **does not block the app**:

~~~xml
<appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
  <file>/var/log/app/ledger.log</file>
  <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
    <fileNamePattern>/var/log/app/ledger.%d{yyyy-MM-dd}.%i.log.gz</fileNamePattern>
    <maxFileSize>200MB</maxFileSize>
    <maxHistory>14</maxHistory>
    <totalSizeCap>3GB</totalSizeCap> <!-- prevent disk bloat -->
  </rollingPolicy>
  <encoder><pattern>%d{ISO8601} %-5level [%thread] %logger - %msg%n</pattern></encoder>
</appender>

<appender name="ASYNC" class="ch.qos.logback.classic.AsyncAppender">
  <queueSize>8192</queueSize>          <!-- in-RAM queue, increase to withstand burst -->
  <discardingThreshold>0</discardingThreshold> <!-- 0 = do not auto-drop INFO/WARN when nearly full -->
  <neverBlock>true</neverBlock>        <!-- IMPORTANT: when queue full, DROP log, do NOT block thread -->
  <appender-ref ref="FILE"/>
</appender>

<root level="INFO"><appender-ref ref="ASYNC"/></root>
~~~

> Note: in real configuration, place **only one** {{<neverBlock>true</neverBlock>}} (delete duplicate line if any). {{neverBlock=true}} means when queue is full, {{AsyncAppender}} uses {{offer()}} (no wait) instead of {{put()}} → business thread continues, **accepting lost log** during clogged period. This is an intentional trade-off.

**Trade-offs (state clearly when designing):**
| Choice | When disk slow/full | Trade-off |
|---|---|---|
| Synchronous (current) | App hangs, no log lost | Service killed by logging — worst |
| Async + {{neverBlock=false}} | Business thread still blocks when queue full | Preserves log but can still hang app |
| Async + {{neverBlock=true}}, {{discardingThreshold=0}} | Drop newest log when full, app survives | Lose trace exactly during incident — need drop metric |
| Async + {{neverBlock=true}} + {{discardingThreshold>0}} | Drop some TRACE/DEBUG/INFO when nearly full, keep ERROR | Balanced, but may lose INFO needed for diagnosis |

Common practice: {{neverBlock=true}} (prioritize app survival), {{discardingThreshold=0}} (don\'t silently drop low levels if you need them), enable monitoring of dropped events (Logback does not expose it by itself; can wrap or use Log4j2\'s similar {{DefaultAsyncQueueFullPolicy}}), and **log to stdout** so the platform (Fluent Bit / sidecar) ships it — cleanly separate local disk I/O from the app.

### Common pitfalls

- Thinking "using Logback is safe" but forgetting to wrap {{AsyncAppender}}: Spring Boot defaults to console logging; custom file config easily skips async.
- Just increasing {{queueSize}}: run out of RAM before solving the problem, and a long burst still fills up.
- Setting {{neverBlock=true}} without monitoring drops → lose exactly the log line of the incident.
- Seeing {{BLOCKED}} in dump and immediately thinking "deadlock": deadlock needs a **wait cycle** (A holds lock X waiting for Y, B holds Y waiting for X). Here 193 threads all wait for **the same one lock** held by 1 thread — this is **I/O contention**, not deadlock (will clear when I/O finishes / disk freed).
- Running {{jstack}} and seeing only Tomcat threads, forgetting to check "who holds the lock": always find the line {{- locked <...>}} matching {{- waiting to lock <...>}}.

> Senior tip: Treat logging as a **dependency that can fail**, like DB or HTTP upstream. Operating principle: (1) the request thread\'s log path must be O(1) in memory (drop into queue) and never block indefinitely, (2) always set {{totalSizeCap}} + disk alert, (3) {{neverBlock=true}} for async appender and monitor drop rate, (4) prefer log to stdout + shipper. In an interview, if you can present both "AsyncAppender + neverBlock" and the trade-off of lost log plus how to monitor drops, you are answering at senior level.`,
    rubric: [
      'Correctly identify the culprit: {{http-nio-8080-exec-12}} RUNNABLE at {{FileOutputStream.writeBytes}} but HOLDING monitor {{<0x0000000712c04a10>}} (RollingFileAppender) while disk {{/dev/vdb}} is full at 100% ({{df}} Avail 0, {{iostat}} await ~1s %util 100%). 193 Tomcat threads {{BLOCKED (on object monitor)}} {{waiting to lock <0x0000000712c04a10>}} at {{OutputStreamAppender.subAppend:238}} when calling {{log.info}} from controller/service.',
      'Explain the mechanism correctly: the synchronous appender uses {{synchronized}} around {{subAppend}} + default {{immediateFlush=true}}, so the logging thread must write to disk itself; the lock is held throughout the slow I/O. Distinguish the lock-holding thread (RUNNABLE/native, still holds monitor) from the waiting thread (BLOCKED). State clearly this is I/O contention, not deadlock (no wait cycle).',
      'Propose correctly configured AsyncAppender: {{queueSize}}, {{discardingThreshold}}, {{neverBlock=true}} (so clogged worker/disk does not block app), with trade-off of lost log; handle disk ({{totalSizeCap}}, {{maxHistory}}, alert, consider stdout+shipper). Includes short-term step (clear disk / app recovers itself).'
    ]
  }
});
