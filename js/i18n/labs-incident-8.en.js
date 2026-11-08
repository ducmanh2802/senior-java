/*
 * English translation of js/data/labs-incident.js — task T1010. Format: js/core/i18n.js (content overlay).
 * ids: lab-incident-019 lab-incident-020 lab-incident-021
 */
App.i18n.content({
  'lab-incident-019': {
    title: 'Kafka consumer kicked out of group repeatedly and duplicate message processing',
    scenario: `The order-service consumes topic {{orders.created}} (3 partitions) with Spring Kafka at concurrency 3. After adding an enrichment step that calls HTTP to another service (15-20 seconds per batch), the consumer got kicked out of the group, lag rose from 0 to 80,000, and the same order got processed multiple times. Consumer log and kafka-consumer-groups --describe below.`,
    questions: ['What is the root cause of the consumer being kicked out of the group and lag increasing? Cite evidence from the log.', 'How would you fix it short-term and long-term?'],
    hints: ['Compare batch processing time with max.poll.interval.ms.', 'max.poll.interval.ms is the maximum time between two poll() calls, not the time to process one message.'],
    answer: `**Summary:** Batch processing takes 26 seconds, the consumer does not call poll() in time → the coordinator considers the member dead and kicks it out of the group, partitions get reassigned, messages already processed partially get reprocessed.

### Internal mechanism

1. **max.poll.interval.ms is not a message processing timeout.** It is the maximum interval between two {{poll()}} calls. If processing a batch takes longer than this value, the consumer does not call poll() in time → the coordinator considers the member dead → kicks it out of the group → rebalance → partitions assigned to another consumer.
2. **Heartbeat is only sent while the consumer still calls poll().** It runs on the background network thread of the Kafka client (not your batch processing thread). session.timeout.ms = the broker considers the member dead if no heartbeat is received for long enough; max.poll.interval.ms = maximum time between two poll() calls. Synchronous batch processing that takes too long does not call poll → the coordinator considers the member dead → kicks it out of the group → rebalance.
3. **Rebalance leads to duplicate processing.** Partitions get reassigned, offsets not yet committed → messages already partially processed get reprocessed. Without idempotency, data gets duplicated.
4. **Lag increases.** Consumer kicked out repeatedly → offsets not committed → lag increases.

### Evidence

- Log: {{Member consumer-1-abc123 sending LeaveGroup request ... session timed out}}.
- metrics: processing time per batch = 26s, max_poll_interval_ms = 30000 → very close to the threshold.
- consumer-groups.txt: LAG ~28000 per partition, no active members.

### Fix

- **Short-term:** raise max.poll.interval.ms to 5 minutes ({{max.poll.interval.ms=300000}}) and reduce max.poll.records to 50-100 so batches are smaller. Set {{enable.auto.commit=false}} and commit manually after processing completes.
- **Long-term:** move HTTP enrichment out of the consumer loop: use async/non-blocking, or produce to an intermediate topic, or process in parallel with ExecutorService and poll on the main thread. Add idempotency (unique orderId) so duplicate processing does not cause errors.
- **Monitoring:** track rebalance rate, consumer lag, processing time per batch.

> Senior tip: max.poll.interval.ms should be 2-3 times the actual batch processing time; if a batch is larger than 1 minute, reduce batch size or move processing out of the consumer thread. Always design the consumer to be idempotent because rebalance is inevitable.`,
    rubric: ['Explain max.poll.interval.ms is the time between two poll() calls, not a message processing timeout.', 'Explain heartbeat is only sent while still calling poll() (background network thread), session.timeout.ms vs max.poll.interval.ms, synchronous batch processing makes the consumer not poll in time.', 'Explain rebalance leads to duplicate processing and lag increase.', 'Propose raising max.poll.interval.ms, reducing batch size, moving enrichment out of the consumer loop, idempotency.'],
  },
  'lab-incident-020': {
    title: 'HikariCP connection exhaustion: REQUIRES_NEW nested inside an outer transaction',
    scenario: `OrderService.createOrder() opens an outer transaction, calls PaymentService.charge() which has @Transactional(propagation=REQUIRES_NEW). Each request holds 2 connections at once. When traffic increases, HikariCP runs out of connections, log "Connection is not available, request timed out after 30000ms", pending connections increase, thread dump shows many threads waiting for getConnection. Log, metrics and thread dump below.`,
    questions: ['What is the root cause of HikariCP running out of connections? Cite evidence from metrics and thread dump.', 'How would you fix it short-term and long-term?'],
    hints: ['Compare active connection count with max; count connections each request holds.', 'REQUIRES_NEW opens a new transaction → borrows a new connection from the pool.'],
    answer: `**Summary:** Each request holds 2 connections at once because the outer transaction has not committed when REQUIRES_NEW is called; a pool of 20 connections only serves 10 concurrent requests → when traffic > 10, connections run out, threads wait for getConnection.

### Internal mechanism

1. **REQUIRES_NEW opens a new transaction and borrows a new connection.** When a method annotated with @Transactional(propagation=REQUIRES_NEW) is called inside an outer transaction, Spring suspends the outer transaction (keeping its connection) and opens a new transaction borrowing a new connection from the pool. That request holds 2 connections at the same time.
2. **Pool size small relative to concurrency.** Pool max 20, each request holds 2 → at most 10 concurrent requests. http_requests_in_flight = 80 → 70 requests must wait for a connection.
3. **Threads blocked waiting for getConnection.** Thread dump shows many http-nio threads state=WAITING at HikariPool.getConnection. After 30s timeout, throws SQLTransientConnectionException.
4. **Not slow queries.** db_query_p99_ms = 45ms, cpu 35% → DB and CPU both idle; bottleneck is pool size and the pattern of holding connections.

### Evidence

- metrics: active=20, idle=0, pending=145, max=20.
- thread-dump: many threads WAITING at getConnection.
- app.log: "Connection is not available, request timed out after 30000ms".

### Fix

- **Short-term:** raise pool size to 40-50 (but DB max_connections must be enough); reduce connection timeout to 5-10s to fail fast; add circuit breaker.
- **Long-term:** eliminate REQUIRES_NEW nested inside an outer transaction: merge logic into the same transaction, or make PaymentService async/event-driven (outbox pattern) so connections are not held long. If REQUIRES_NEW is needed, ensure the outer transaction commits/releases its connection before calling.
- **Monitoring:** track hikaricp_connections_pending, active, timeout; alert when pending > 0 persists.

> Senior tip: REQUIRES_NEW is a powerful but dangerous tool when nested inside an outer transaction because it holds 2 connections. Rule: transactions should be short, do not call external services (HTTP, Kafka) inside a transaction, and pool size must be ≥ 2 × concurrent requests when using REQUIRES_NEW.`,
    rubric: ['Explain REQUIRES_NEW suspends the outer transaction and borrows a new connection → holds 2 connections/request.', 'Explain pool of 20 only serves 10 concurrent requests, traffic 80 → connection exhaustion.', 'Cite evidence metric active=20/pending=145 and thread dump WAITING at getConnection.', 'Propose increasing pool, eliminating nested REQUIRES_NEW, async/event-driven, monitoring pending.'],
  },
  'lab-incident-021': {
    title: 'API returns 500 in bulk at 2am because disk is full, log deleted but capacity does not drop',
    scenario: `**Context.** System **ShopVN** runs service **order-service** (Spring Boot 3.2, Logback writes logs to file, deployed on 1 Linux VM Ubuntu 22.04, root disk {{/dev/sda1}} 50 GB). Application logs at {{/var/log/order-service/app.log}} and access log at {{/var/log/nginx/access.log}}. The operations team (DevOps - the team managing infrastructure, servers, deploy) had configured **logrotate** (a Linux tool that rotates log files: compresses old logs, creates new files, deletes expired logs) but had not rechecked it after the recent upgrade.

**Symptoms.** On **03/11/2026**, from **02:14** (off-peak, batch job running), monitoring reports HTTP 500 rate spiking on {{/api/orders}}. Application log records error {{java.io.IOException: No space left on device}}. On-call SSHes into server, {{df -h}} reports {{/}} at 100%. They run {{rm /var/log/order-service/app.log}} (delete log file) but {{df -h}} **still 100%**, API still 500. At 02:41 after proper handling, service recovered.

**Data collected:** Java error log, {{df -h}} result, {{du -sh}} of log directory, {{logrotate}} config, cron/timer status of logrotate, and {{lsof}} for the deleted-but-still-held file.`,
    questions: [
      'Explain why deleting app.log with rm leaves df still reporting disk full. Cite evidence from artifact: where is the capacity being held, which process holds it?',
      'Why does logrotate not rotate logs for order-service (and logs accumulate to 31 GB)? Analyze both the timer and config/permission errors.',
      'How would you handle the incident right now (restore service overnight) and prevent it long-term?'
    ],
    hints: [
      'In Linux, "deleting a file" (rm/unlink) only removes the file name from the directory. Disk capacity is only freed when NO process still holds a file descriptor (FD - the handle a process uses to read/write the file) pointing to that file. lsof +L1 lists files with NLINK=0 (lost name) but still open.',
      'logrotate.timer is disabled (does not run on schedule). Also logrotate --debug reports Permission denied on app.log.1 (owner app:app) - when logrotate runs as root and encounters a file with odd permissions or misconfig, it may skip. copytruncate and create/postrotate are two different ways for the process to keep writing to the new file.',
      'Short-term: free the FD being held (truncate the open file via /proc/<pid>/fd/<n>, or send signal/restart the process with control). Long-term: enable the timer, fix permissions/config of logrotate, separate /var/log to its own partition, quota, monitor capacity and log size, rolling in Logback.'
    ],
    answer: `**Summary:** Disk {{/dev/sda1}} (50 GB) is 100% full because order-service and nginx logs accumulated (31 GB + 1.2 GB) while {{logrotate.timer}} was disabled and logrotate config had a permission error, so logs were never rotated. On-call used {{rm}} to delete the file but the Java process (PID 18421, running since 12/10) and nginx still hold **file descriptors** (FD - the "handle" open to the file) pointing to the now-nameless file, so the kernel has not freed the capacity ({{lsof +L1}} shows {{app.log (deleted)}} still occupying ~31 GB). Need to truncate the open FD to save the incident, then enable log rotation, separate the partition and monitor.

### Step-by-step understanding of the problem

**Step 1 - How does full disk cause 500?**
- A disk (storage) is where files are stored. Each disk is split into **partitions**. {{/dev/sda1}} is the root partition {{/}} of 50 GB, currently {{Use% 100%}} ({{df -h}}). Inodes (the index managing files) still 91% free ({{df -i}}), so it ran out of **data** capacity, not inodes.
- When the application writes logs (Logback's {{FileAppender}} - the logging library of Spring Boot) or the system writes data, the OS needs free space. Out of space → {{IOException: No space left on device}}. {{app-error.log}} also shows PostgreSQL reporting error writing {{pg_wal/... No space left on device}} if DB is on the same partition or indirectly affected - here DB may be on {{/data}} (46%) but JDBC connection/temp writes can still hit indirect errors; the certain facts are the application could not write logs and requests failed with 500.

**Step 2 - Why does {{rm}} not free capacity? (important concept)**
- In Linux, a file has two parts: (1) the **name** in the directory (directory entry) and (2) the **data** on disk (inode + blocks). The {{rm}} command essentially calls {{unlink}}: only removes the name. The kernel frees the data when **link count (NLINK) = 0 AND no process still has the file open**.
- A process opening a file receives an FD (an integer pointing to the open file). If the process keeps the FD after the name is removed, the file becomes "deleted but still open" - occupying real capacity.
- Evidence: {{lsof +L1 /var/log}} ({{lsof}} = list open files; {{+L1}} = files with NLINK < 1, i.e. name deleted) shows:
  - {{java (PID 18421, user app) FD 9w}} holding open {{/var/log/order-service/app.log (deleted)}} size **33,285,996,544 bytes (~31 GB)**, {{NLINK 0}}.
  - {{nginx (PID 2310, 2311)}} holding open {{/var/log/nginx/access.log (deleted)}} ~1.2 GB.
- That is why {{df -h}} still 100% after {{rm}}: the 31 GB + 1.2 GB data is still held by those FDs.

**Step 3 - Why did logs grow to 31 GB?**
- {{logrotate.timer}} (the systemd timer that runs logrotate on schedule) is {{disabled; inactive (dead)}} → logrotate **does not run automatically**. Cron still runs, but on modern Ubuntu logrotate is usually triggered by the timer; if the timer is off and no equivalent cron job exists, no rotation happens.
- {{logrotate --debug}} reports {{Permission denied}} on {{app.log.1}} (file owned by {{app:app}}). Logrotate usually runs as root, but this error indicates file/config state is abnormal (e.g. a previous rotation was interrupted, or interaction with {{copytruncate}}). Even though the main cause is the disabled timer, the config also needs checking.
- Java process (PID 18421) has been running continuously since **Mon Oct 12 03:14:55 2026** (~3 weeks). No rotation + continuous logging → {{app.log}} grew to 31 GB.

### Fix

*Immediate handling (restore service, carefully):*
1. **Free the capacity held by the open FD** without needing to kill the process immediately:
   - Common safe approach: **truncate** (empty) the open file via the FD path in {{/proc}}: {{sudo truncate -s 0 /proc/18421/fd/9}} and {{sudo truncate -s 0 /proc/2310/fd/4}} (point to the correct PID/FD from {{lsof}}). The file stays open but size becomes 0 → disk frees up immediately. Re-check {{df -h}}.
   - Or send a signal for nginx to reopen the log file: {{nginx -s reopen}} / {{kill -USR1}} (matching the nginx {{postrotate}} config). With Java + Logback using {{copytruncate}}, restarting the app frees the old FD but causes downtime; only do that if truncating via {{/proc}} is not applicable.
2. Safely clean old logs: compress/delete {{app.log.1}} and old compressed logs, keep a few recent ones. Verify no application data is deleted.
3. Confirm API no longer returns 500, DB/application writing normally. Record the incident timeline.

*Long-term prevention:*
- **Enable and verify logrotate:** {{sudo systemctl enable --now logrotate.timer}}, run a trial {{sudo logrotate -f /etc/logrotate.d/order-service}} and check the result. Fix log file permissions (ensure logrotate can read/rename) or use {{su app app}} inside the logrotate block if needed.
- **Understand {{copytruncate}} vs {{create}}/{{postrotate}}:** {{copytruncate}} copies content then truncates the open file (app does not need to open a new file) - convenient but may **lose a few log lines** at truncation time and cause I/O cost for large files. Better for Java/Logback: use **RollingFileAppender/SizeAndTimeBasedRollingPolicy** inside Logback so the application rotates files itself, reducing dependence on logrotate. For nginx, {{create}} + {{postrotate}} ({{USR1}}) is the standard.
- **Separate partitions:** place {{/var/log}} (or {{/var/log/order-service}}) on a separate partition/volume (like {{/dev/sdb1}} with 104 GB free). Full logs will not fill {{/}} and will not take down the OS/DB.
- **Capacity limits:** quota, limit per-file log size and total rotated copies (e.g. 200 MB × 10 files). Enable {{maxHistory}}/{{totalSizeCap}} in Logback.
- **Monitoring and alerting:** alert when {{disk usage > 80%}}, when growth rate is abnormal, when a log file exceeds threshold (e.g. > 2 GB), and check {{logrotate.timer}} is active. This is work DevOps/SRE (the reliability team) should automate.
- **After incident:** write a postmortem, add a "disk full / log bloat" runbook for on-call.

> Senior tip: "Deleting a log file but disk not freed" is a classic interview question because it tests whether you understand file descriptors and how Linux manages files. When debugging a full disk, always run the trio: {{df -h}} (any space left?), {{df -i}} (any inodes left?), {{du -sh}} + {{lsof +L1}} (who is holding it, any deleted-but-open files?). And never let logs share a partition with {{/}}.`,
    rubric: ['Correctly explain the Linux mechanism: rm only unlinks the name; capacity is freed only when NLINK=0 and no FD is open; cite lsof +L1 (java PID 18421 FD 9w, app.log deleted ~31 GB, nginx access.log deleted) and df still 100% after rm.', 'Analyze root cause of log bloat: logrotate.timer disabled/inactive so it does not run; logrotate --debug Permission denied on app.log.1; Java process running continuously since 12/10; total /var/log/order-service 31 GB.', 'State safe immediate handling: truncate /proc/<pid>/fd/<n> (or reopen/restart with control) to free the held FD, check df and restore HTTP service; not just repeat rm.', 'State long-term prevention: enable logrotate.timer + trial run, fix config/permissions, use Logback rolling or understand copytruncate/create+postrotate, separate /var/log partition, quota, monitor disk/log and timer.'],
  },
});
