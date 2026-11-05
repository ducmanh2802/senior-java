/*
 * English translation of js/data/q-devops.js — task T734. Format: js/core/i18n.js (content overlay).
 * ids: devops-057 devops-058 devops-059 devops-060 devops-061
 */
App.i18n.content({
  'devops-057': {
    q: 'Service Java on a Linux server suddenly uses 100% CPU on one core during peak. How do you use top -H to find the hot thread, convert the thread id to hex to match it with jstack, and read the stack trace to find the root cause?',
    a: `**Summary:** 100% CPU in Java usually means a thread is spinning in a compute loop (code, regex, serialization) or GC running continuously. Process: use {{top -H -p <PID>}} to see which thread (TID) eats CPU, convert TID from decimal to hex, find the line {{nid=0x...}} matching it in the thread dump ({{jstack}} or {{jcmd PID Thread.print}}) to learn which line of code that thread is on. Capture evidence (thread dump, {{jstat}}) before restarting, because restarting erases all traces.

### Quick understanding
Think of a JVM process as a factory with many workers (threads). One worker working frantically without rest makes the electricity meter (CPU meter) jump to 100%. You cannot see it with the naked eye while the factory runs; you use per-worker camera ({{top -H}}) to know who is working, then consult the attendance sheet (thread dump) to know which step that person is on. Converting TID to hex is like converting the employee number from decimal to the code printed on the attendance sheet.

### Terms (explained from scratch)
- **PID (Process ID)**: identifier of a process on Linux. Each {{java -jar app.jar}} run is a new process with its own PID.
- **TID (Thread ID)**: identifier of a thread inside the process. JVM creates many threads (main, GC, worker, HTTP handler). On Linux a thread is also a "lightweight process", so it has its own TID.
- **Thread dump**: snapshot of the state of all JVM threads at one moment: thread name, state (RUNNABLE, BLOCKED, WAITING), and stack trace (chain of functions being called). Capture with {{jstack <PID>}} or {{jcmd <PID> Thread.print}}.
- **nid**: "native id" in the thread dump, the OS thread TID written in hex (base 16). This is the bridge between Linux and JVM.
- **Hex (hexadecimal)**: base-16 counting using 0-9 and a-f. Example: 12399 (decimal) = 0x306f (hex).

### Step-by-step procedure (with numeric example)
~~~bash
# Step 1: identify which Java process eats CPU
top -c
# Suppose: PID 12345, COMMAND java, %CPU 198 (near 200% = eats 2 cores)

# Step 2: see which thread inside that process eats CPU
top -H -p 12345
# -H: show threads (top shows processes by default)
# -p: only PID 12345
# Press P to sort by %CPU. Example:
#   PID   USER  %CPU  COMMAND
#   12399 app   99.3  java      <-- hot thread (TID=12399)
#   12401 app   98.7  java      <-- second hot thread

# Step 3: convert decimal TID to hex
printf '%x\\n' 12399
# Result: 306f
printf '%x\\n' 12401
# Result: 3071

# Step 4: capture thread dump and find matching nid
jstack 12345 > /tmp/dump1.txt
# Or: jcmd 12345 Thread.print > /tmp/dump1.txt
grep -n 'nid=0x306f' /tmp/dump1.txt
# Finds a line like:
# "http-nio-8080-exec-7" #42 daemon prio=5 os_prio=0 tid=0x... nid=0x306f runnable
# Then read the next 15-30 lines to see the stack trace
grep -A 25 'nid=0x306f' /tmp/dump1.txt
~~~

### Reading the stack trace: illustrative example
~~~text
"http-nio-8080-exec-7" #42 daemon prio=5 nid=0x306f runnable
   java.lang.Thread.State: RUNNABLE
        at java.util.regex.Pattern$GroupHead.match(Pattern.java:...)
        at java.util.regex.Pattern$Branch.match(Pattern.java:...)
        at com.myapp.util.Validator.isValidEmail(Validator.java:87)
        at com.myapp.service.UserService.register(UserService.java:42)
~~~
Read top-down: the top frame is where the thread is running. Here the thread is stuck in the regex engine ({{Pattern.match}}) — a sign of catastrophic backtracking (regex running exponentially when given bad input). The business-code line is {{Validator.java:87}}.

### Distinguish root cause by stack
| Seen in stack | Suspect | Action |
|---|---|---|
| Loop in business code ({{while}}, {{for}}) | Wrong logic, exit condition never met | Read code, check input |
| {{java.util.regex.Pattern}} | Regex backtracking with long/bad input | Simplify regex, limit input length, use possessive quantifier |
| {{G1 Young Generation}}, {{GC Thread}}, {{VMThread}} | GC running continuously because heap is nearly full | {{jstat -gcutil <PID>}}, check heap/GC log |
| {{ObjectMapper.writeValue}}, {{Gson.toJson}} on large object | Serializing complex object graph | Limit response, use DTO, streaming |
| {{MessageDigest}}, {{BCrypt}}, {{Cipher}} | Heavy crypto/hashing (may be normal under high load) | Check throughput, consider offload |

### JDK version note
- **JDK 8-17**: {{nid}} in thread dump is usually hex ({{nid=0x306f}}). You must convert TID to hex.
- **JDK 21+ (HotSpot)**: some builds print {{nid}} in decimal in the thread dump; then you can match directly with TID from {{top -H}}. Safest: run {{jstack <PID> | head -30}} to see the {{nid}} format, then decide whether hex conversion is needed.
- Always capture **3 thread dumps 5-10 seconds apart**: if the same thread stays on the same stack across 3 dumps, it is "stuck"; if the stack changes continuously, the thread is heavy but still progressing.

### Common pitfalls
1. **Restarting as soon as CPU is high**: loses all evidence. In production the same incident may recur; without a dump you will be guessing next time. Avoid by always capturing {{jstack}} (3 times), {{jstat -gcutil}}, and saving them before restart.
2. **Looking only at process %CPU, not threads**: process at 200% but spread over 20 threads (10% each) is normal load; one thread at 100% is abnormal. Avoid by always using {{top -H -p <PID>}}.
3. **Confusing hex/decimal direction**: {{printf '%x'}} converts decimal -> hex; {{printf '%d' 0x306f}} converts back. Many people look up the wrong way and cannot find {{nid}}.
4. **Ignoring GC threads**: if the hot thread is {{GC task thread}} or {{G1 Conc#0}}, the root cause is memory (heap nearly full, high allocation rate), not business code. Optimizing code then is useless; check {{-Xmx}}, {{jstat}}, heap dump.

### Interview answer
When a Java service eats 100% CPU, I use {{top -H -p <PID>}} to find the specific thread consuming CPU (TID). Then I convert TID to hex with {{printf '%x'}} because HotSpot thread dumps record native id as {{nid=0x...}}. I capture at least 3 thread dumps 5 seconds apart with {{jstack}} or {{jcmd}}, then grep {{nid}} to see the stack trace. From the stack I distinguish: if it is business code or regex, I fix the logic; if it is a GC thread, the problem is memory, and I switch to analyzing {{jstat -gcutil}} and GC log. I always capture evidence before restarting because restart wipes the state.

> Senior tip: In Kubernetes you often have no {{jstack}} installed in a distroless image. Use {{jcmd}} (ships with JRE), or {{kubectl debug}} with an ephemeral container carrying a JDK, or expose a thread-dump endpoint via Spring Boot Actuator ({{/actuator/threaddump}}) protected by auth. Prepare a way to capture dumps before the incident happens.`,
    follow: [
      'If the thread dump shows the hot thread is a GC thread, what do you investigate next?',
      'Why capture 3 thread dumps a few seconds apart instead of a single one?',
      'How do you detect catastrophic backtracking of a regex in production without reading code?'
    ],
  },
  'devops-058': {
    q: 'uptime reports load average 12.00, 8.50, 4.20 on a 4-core machine. What does that mean? How does load average differ from %CPU, and when is load high while CPU is low?',
    a: `**Summary:** Load average is the average number of processes that are **running** (RUNNABLE) or **waiting for a resource without being interruptible** (usually waiting for disk I/O, D state on Linux) over 1, 5, and 15 minutes. On Linux, load average **includes processes waiting for I/O**, so high load does not mean CPU is busy. Rough rule: sustained average load above the number of cores means a queue exists. The three numbers reveal the trend: increasing (12 > 8.5 > 4.2) or decreasing. Always combine {{vmstat}}, {{top}} (%wa, %us), and {{iostat}} to tell whether the queue is from CPU or I/O.

### Quick understanding
Think of load average as the number of people queued at a checkout counter (CPU core). "Running" is the person being served; "waiting for I/O" (D state) is the person standing at the counter while the cashier waits for the card reader to respond — they occupy a queue spot even though the cashier is not busy computing. On Linux both kinds are counted in the queue. So a long queue (high load) may be from too many customers (CPU-bound) or from a slow card reader (I/O-bound).

### Terms
- **RUNNABLE (R)**: process running on CPU or waiting in the CPU run queue to run.
- **Uninterruptible sleep (D)**: process waiting for an I/O operation (usually disk, sometimes NFS) to complete and **cannot be interrupted** by a signal (even {{kill -9}} does not kill it immediately). On Linux, D-state is counted in load average.
- **I/O wait (%wa)**: percentage of time CPU is idle but waiting for I/O to complete. CPU is "idle" but work is stuck at disk/network.
- **Core**: unit of CPU execution. A 4-core machine can run 4 CPU-bound threads concurrently without queuing.

### Reading the three load-average numbers
~~~bash
uptime
#  02:15:03 up 10 days,  3:42,  2 users,  load average: 12.00, 8.50, 4.20
#                                                         1m     5m    15m
~~~
- **1 minute = 12.00**: average 12 processes in queue/running in the last minute.
- **5 minutes = 8.50, 15 minutes = 4.20**: trend is **increasing** (12 > 8.5 > 4.2) → the problem is happening now, pay attention immediately.
- Opposite trend (4, 8, 12): the problem is easing.
- Compared to cores: {{nproc}} returns 4 → load 12 on 4 cores means on average ~3 processes waiting per core. A clear sign of overload if sustained.

**Rough thresholds (coarse, workload-dependent):**
| Load / Core | Meaning |
|---|---|
| < 0.7 | Comfortable |
| 0.7 – 1.0 | Watch closely |
| > 1.0 sustained | Queue exists, latency rises |
| > cores * 2 | Severe overload (for CPU-bound workload) |

### High load but low CPU: when does it happen?
~~~bash
# Quick check
top
# Watch %Cpu(s) line: us low (e.g. 5%) but wa high (e.g. 70%)
vmstat 1 5
# r column: number of processes waiting for CPU (RUNNABLE)
# b column: number of processes blocked waiting for I/O (D-state)  <-- high load from this
# wa column: % CPU waiting for I/O
~~~
| Situation | Load | %us (CPU user) | %wa (I/O wait) | b column (vmstat) | Typical cause |
|---|---|---|---|---|---|
| CPU-bound | High | High | Low | 0 | Loop, computation, GC |
| I/O-bound | High | Low | High | High | Slow disk, DB writing to disk slowly, hung NFS, heavy logging |
| Lock contention (rare) | Possibly high | Low | Low | Low | Many RUNNABLE threads contending on locks (rarely raises load like I/O) |

### Investigating an I/O-bound case
~~~bash
iostat -x 1 3
# Watch %util (near 100% = disk saturated), await (avg wait ms), r/s w/s
# High %util + high await + high load + high %wa = disk is the bottleneck

# Find which process causes heavy I/O
pidstat -d 1 5
# kB_rd/s, kB_wr/s columns per PID

# For Java: check GC log, writing heap dump, too much logging?
lsof -p <PID> | wc -l   # many open files?
~~~

### Common pitfalls
1. **Seeing load > cores and immediately demanding more CPU**: if the cause is I/O (slow EBS, NFS lag, DB on same machine), more CPU will not help; need higher IOPS, different storage, or less I/O. Avoid by always looking at %wa and iostat first.
2. **Comparing load across machines with different core counts**: load 8 on 4 cores (2x) is worse than load 8 on 32 cores (idle). Avoid by always dividing load by {{nproc}}.
3. **Confusing Linux load average with other Unix systems**: some Unix systems (traditional BSD) do not count I/O wait in load. Documentation on the web can mislead; on Linux, D-state is counted.
4. **Ignoring the 1/5/15-minute trend**: a 1-minute spike may be a deploy or short batch job; high 15-minute load indicates a sustained problem.

### Interview answer
Load average on Linux is the average number of processes running or waiting for uninterruptible I/O (D-state) over 1, 5, and 15 minutes. The key point is that Linux counts I/O wait into load, so high load does not mean CPU is busy. Example load 12 on a 4-core machine: if {{vmstat}} shows a high {{b}} column and high %wa in {{top}}, the issue is I/O (disk, network storage), and I use {{iostat -x}} and {{pidstat -d}} to find the source; if %us is high and the {{r}} column is high, then it is CPU-bound. I always read the three numbers as a trend and divide by core count to judge severity.

> Senior tip: On cloud (AWS EC2 with EBS gp2/gp3), "high load, low CPU" is very common when EBS burst credit runs out or configured IOPS are below demand. Check {{iostat -x}} (await, %util) and CloudWatch metrics {{VolumeQueueLength}}, {{BurstBalance}} together. With Java, synchronous GC logging or frequent log-framework flushing can also create surprising I/O wait.`,
    follow: [
      'How do you distinguish high load caused by disk I/O from high load caused by a hung NFS mount?',
      'Can a process in D state (uninterruptible sleep) be killed with kill -9? Why or why not?',
      'On a Kubernetes container, what does the load average you see inside the container reflect?'
    ],
  },
  'devops-059': {
    q: 'A Linux server reports "No space left on device" when writing logs. {{df -h}} shows the / partition 100% full, but {{du -sh /}} adds up to only about 60%. Explain this phenomenon, use {{lsof +L1}} to find deleted files still held open, and handle it safely.',
    a: `**Summary:** {{df}} measures at the filesystem level (allocated blocks), while {{du}} walks the directory tree and sums sizes of files that still have names. When a process still holds a file descriptor open to a file that has been {{rm}}'d (name removed from directory) but not {{close()}}'d, the filesystem has not freed the blocks because the real link count is still > 0 at kernel level — so {{df}} still sees full, while {{du}} no longer sees that file. {{lsof +L1}} lists files with link count < 1 that are still open. Safe handling: truncate the file via {{/proc/<PID>/fd/<FD>}} or ask the app to rotate logs/restart in a controlled way; do not kill -9 blindly. Also, "No space left" can be caused by **running out of inodes** ({{df -i}}).

### Quick understanding
Think of a file as a book in a library. {{rm}} only removes the label/name of the book from the shelf (removes the directory entry). But if someone (a process) still holds the book open reading, the librarian (filesystem/kernel) cannot throw the book away because that person still needs it — the pages (disk blocks) are still occupied. {{du}} only counts books on the shelf; {{df}} counts total paper used in the warehouse. {{lsof +L1}} helps find who is holding a "nameless" book (no label on the shelf).

### Terms
- **Block**: unit of capacity allocated on a filesystem (usually 4KB). {{df}} counts allocated blocks.
- **Inode**: metadata structure of a file (permissions, owner, timestamps, pointers to data blocks). Each file needs one inode. Out of inodes → cannot create new files even with free space.
- **File descriptor (fd)**: integer a process uses to reference an open file. The kernel keeps an fd table per process.
- **Hard link / link count**: number of names (directory entries) pointing to the same inode. {{rm}} decrements link count; blocks are freed only when link count = 0 **and** no fd is still open.
- **Truncate**: cut a file's content to a smaller size (usually 0) without deleting the file or closing the fd.

### Step 1: confirm lack of space vs lack of inodes
~~~bash
df -h
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/nvme0n1p1   50G   50G     0 100% /

df -i
# Filesystem      Inodes  IUsed   IFree IUse% Mounted on
# /dev/nvme0n1p1 3276800 3276800      0  100% /   <-- out of inodes (millions of small files)
~~~
If {{IUse%}} is 100% but space remains: cause is too many small files (session files, cache, {{/tmp}} directory). Find the directory with many files: {{for d in /*; do echo "$d $(find "$d" -xdev | wc -l)"; done 2>/dev/null | sort -k2 -rn | head}}.

### Step 2: df vs du mismatch — deleted file still held open
~~~bash
# du should run at the mount point, skipping other filesystems
du -shx / 2>/dev/null
# 30G  /

# Find files that are "unlinked" (link count 0) but still open
lsof +L1
# or scoped to filesystem: lsof +L1 /dev/nvme0n1p1
# Example output:
# COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NLINK  NODE NAME
# java    12345 app    3w   REG  259,1 21474836480    0 123456 /var/log/app/app.log (deleted)
#                                     ^^^^^^^^^^^        ^ NLINK=0: deleted
#                                     ~20GB still held
~~~
- **NLINK column = 0** (or shown as {{(deleted)}}): file no longer has a name in any directory.
- **SIZE/OFF column**: actual size still occupying blocks.
- **FD column** (e.g. {{3w}}): file descriptor number 3, opened for writing.

You can also check from the process side:
~~~bash
ls -l /proc/12345/fd/3
# lrwx------ 1 app app 64 ... /proc/12345/fd/3 -> /var/log/app/app.log (deleted)
~~~

### Safe handling (preserve important data depending on case)
| Method | Command | When to use | Risk |
|---|---|---|---|
| Truncate via /proc fd | {{: > /proc/12345/fd/3}} or {{truncate -s 0 /proc/12345/fd/3}} | Need to free space immediately, accept losing the open log content | Loses unflushed/shipped log; app keeps writing from current offset — may create null-byte "hole" depending on how app writes |
| Trigger log rotation | {{kill -USR1 12345}} (if app supports) or {{logrotate -f}} | App has reopen-log mechanism | Needs app support; check config |
| Controlled service restart | {{systemctl restart app}} per runbook | After evidence captured, accept brief downtime | Loses in-memory state; follow runbook |
| Copy then truncate | {{cp /proc/12345/fd/3 /tmp/app.log.rescued && : > /proc/12345/fd/3}} | Need to keep log for investigation | Temporary I/O cost |

**Note:** {{rm /var/log/app/app.log}} while the file is still held **does not free space** — that is exactly the cause. After truncating, {{df -h}} will reflect free space.

### Prevention
- Use **logrotate** (Linux) or rolling config in the logging framework (Logback {{SizeAndTimeBasedRollingPolicy}}, Log4j2 {{RollingFileAppender}}) to rotate and compress/delete old logs.
- Avoid the pattern "delete log file then let app recreate it" without a reopen-fd mechanism — app keeps writing to the old (now unlinked) fd.
- Monitor {{node_filesystem_avail_bytes}} (node_exporter/Prometheus) and {{node_filesystem_files_free}} (inodes), alert at 80%.
- With containers/Kubernetes: logs should go to stdout for the runtime to collect; limit container log size (Docker {{max-size}}, containerd config).

### Common pitfalls
1. **Only running {{rm}} on a large file and assuming done**: if the process still holds it, {{df}} does not change. Avoid: after {{rm}}, check {{lsof +L1}}; prefer truncate or controlled restart.
2. **{{kill -9}} on Java process immediately**: frees fd but loses the chance to capture thread dump/heap dump, and may corrupt data being written. Avoid: capture evidence, try truncate/log rotation first; restart per runbook.
3. **Ignoring inodes**: {{df -h}} shows free space but still "No space left" — confuses many people. Avoid: always check {{df -i}} together.
4. **Running {{du}} across mounts**: {{du -sh /}} may descend into {{/proc}}, {{/sys}}, network mounts, giving wrong/slow results. Avoid: use {{du -shx /}} ({{-x}}: do not cross filesystem boundaries).

### Interview answer
When {{df}} reports full but {{du}} sums to less, I suspect a file was unlinked (name removed) while a process still holds its file descriptor open. {{df}} counts blocks allocated at filesystem level; {{du}} only counts files that still have paths. I use {{lsof +L1}} to find entries with NLINK=0 and large SIZE/OFF — often a Java log file that was {{rm}}'d but the app never reopened. Safe handling is to truncate via {{/proc/<PID>/fd/<FD>}} or trigger log rotation/controlled restart; I avoid {{kill -9}} before capturing evidence. I also check {{df -i}} because running out of inodes produces the same error message. Long term I use log rotation, monitor disk/inodes, and in containers push logs to stdout.

> Senior tip: "20 GB log file deleted but disk not freed" is a classic 2 AM incident. Add alerts when {{lsof +L1}} (or equivalent metric) detects large deleted files, and standardize logging: on K8s write to stdout; on VMs use logrotate + reopen signal. Never use {{rm}} on a log file currently being written as a "quick disk cleanup".`,
    follow: [
      'Why can truncating via /proc/<PID>/fd create null-byte "holes" in the log file if the app appends by offset?',
      'How do you configure Logback to rotate logs by size and time, avoiding manual deletion?',
      'In which situations does running out of inodes typically happen, and how to detect it early?'
    ],
  },
  'devops-060': {
    q: 'A Linux server running a Java service has thousands of TCP connections in TIME_WAIT and CLOSE_WAIT growing steadily. How do you diagnose with {{ss}}, distinguish the root cause of TIME_WAIT vs CLOSE_WAIT, and fix it in Java code?',
    a: `**Summary:** TIME_WAIT and CLOSE_WAIT are fundamentally different TCP states: **TIME_WAIT** happens on the side that **actively closes** a connection after the FIN exchange completes, held for ~60 seconds (on Linux) to prevent delayed packets from being misinterpreted — many TIME_WAIT usually means the app opens/closes connections to the same destination repeatedly (no reuse). **CLOSE_WAIT** happens on the **passive** side after receiving FIN from the peer, but the **application has not called close()** — steadily growing CLOSE_WAIT is almost always a socket-leak bug in code. Use {{ss -tan}} to count by state and by destination; fix the root cause in code: connection pool + closing responses correctly.

### Quick understanding
A TCP connection is like a two-way phone call. When ending: the side that hangs up first (active close) waits a while (TIME_WAIT) to be sure the other party heard the final "beep" and that no stale signal enters a new call. The side that hangs up second (passive) hears the first side hang up, but if the application (the person holding the phone) forgets to put the receiver down, the line stays in "waiting for you to hang up" — that is CLOSE_WAIT. Many TIME_WAIT usually means you make too many short calls; many CLOSE_WAIT means code forgot to hang up.

### Terms
- **Socket**: endpoint of a network connection, tied to (IP, port, protocol). In Java, {{Socket}} and the connections under {{HttpClient}} both use sockets.
- **FIN**: TCP packet meaning "I have no more data to send, I want to close my send side." Closing a TCP connection requires a two-way FIN/ACK exchange.
- **Ephemeral port (temporary port)**: source port assigned by the OS when a client opens an outbound connection (range {{ip_local_port_range}}, usually 32768-60999). Run out of ephemeral ports → cannot open new connections to that destination.
- **Keep-alive (HTTP)**: reuse one TCP connection for multiple HTTP requests, avoiding repeated TCP/TLS handshakes.

### Diagnosing with ss
~~~bash
# Overall socket summary by state
ss -s

# Count TIME_WAIT and CLOSE_WAIT
ss -tan state time-wait | wc -l
ss -tan state close-wait | wc -l

# See which destination has many TIME_WAIT (client opening/closing repeatedly to where?)
ss -tan state time-wait | awk '{print $5}' | sort | uniq -c | sort -rn | head

# See CLOSE_WAIT attached to which process
ss -tanp state close-wait
# -p: show process (needs root or same user)
# Example: users:(("java",pid=12345,fd=187))

# Check whether that process's fd is a socket
lsof -nP -p 12345 | grep -c TCP
~~~

### TIME_WAIT: root cause and handling
**Typical symptom:** tens of thousands of TIME_WAIT to the same {{IP:443}} of a partner, plus {{java.net.BindException: Cannot assign requested address}} (EADDRNOTAVAIL) under bursts.

**Root cause in Java code:**
~~~java
// WRONG: create a new HttpClient per request -> no TCP/TLS connection reuse
// Each time, connection closes -> TIME_WAIT on client side (if client closes first)
public String call(String url) throws Exception {
    HttpClient c = HttpClient.newHttpClient();
    return c.send(HttpRequest.newBuilder(URI.create(url)).build(),
                  HttpResponse.BodyHandlers.ofString()).body();
}

// RIGHT: share one client (thread-safe), with pool/keep-alive
private static final HttpClient CLIENT = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(2))
        .build();
~~~
With Spring: declare **one bean** of {{RestClient}}/{{WebClient}} with a configured {{ConnectionProvider}} (Reactor Netty) or {{PoolingHttpClientConnectionManager}} (Apache). Do not {{new RestTemplate()}} inside every method.

**System-level handling (widening the boundary, not fixing root cause):** widen {{net.ipv4.ip_local_port_range}}; enable {{net.ipv4.tcp_tw_reuse=1}} (Linux) for outbound connections — use only when you understand it (needs TCP timestamps). Do not disable TIME_WAIT.

### CLOSE_WAIT: root cause and handling
**Symptom:** {{ss}} shows CLOSE_WAIT growing over time, never decreasing; after a few hours hits the fd limit or shows odd behavior.

**Root cause:** the peer sent FIN (closed its side), your kernel ACKed and moved the socket to CLOSE_WAIT, but the **Java application never read fully / never closed** the response/stream → fd/socket held forever.

~~~java
// WRONG (Apache HttpClient 4.x/5.x old style): not consuming/closing entity -> connection not returned to pool
CloseableHttpResponse resp = httpClient.execute(request);
String body = EntityUtils.toString(resp.getEntity()); // if exception thrown before close...
// resp.close() never called -> socket may stick

// RIGHT: try-with-resources
try (CloseableHttpResponse resp = httpClient.execute(request)) {
    String body = EntityUtils.toString(resp.getEntity());
    return body;
}

// With java.net.http.HttpResponse: body read by BodyHandler is usually fine,
// but if using InputStream BodyHandler you must close the stream.
~~~
With JDBC: always close {{ResultSet}}, {{Statement}}, {{Connection}} (try-with-resources) or let the pool (HikariCP) manage them. Connection leaks belong to the same family of "forgot to close resource".

### Quick comparison table
| | TIME_WAIT | CLOSE_WAIT |
|---|---|---|
| Which side | Actively closed the connection | Passive (received FIN from peer) |
| Duration | ~60s (Linux, fixed) | Infinite until app calls close() |
| Grows forever? | No (expires after timeout), but can stay high if creating continuously | Yes — sign of a leak bug |
| Typical cause | Open/close connections repeatedly, no pool/keep-alive | Not closing response/socket/stream |
| Main fix | Reuse connections, pool | Fix code: try-with-resources, close entity |
| Risk | Run out of ephemeral ports (EADDRNOTAVAIL) | Run out of file descriptors (EMFILE) |

### Common pitfalls
1. **Mistaking CLOSE_WAIT for a network/peer problem**: CLOSE_WAIT means the peer closed its side correctly; the bug is in your app not closing. Avoid: use {{ss -tanp state close-wait}} to attach PID/fd, then inspect the code path using that fd.
2. **Trying to "delete" TIME_WAIT with reckless sysctl**: {{tcp_tw_recycle}} was removed from newer kernels and breaks NAT; careless tuning causes hard-to-debug failures. Avoid: fix code to reuse connections.
3. **Looking only at total connections, not by destination/state**: 5000 TIME_WAIT scattered differs from 5000 TIME_WAIT to one destination (exhausts ephemeral ports to that destination). Avoid: {{ss}} + {{awk/sort/uniq}} by destination column.

### Interview answer
I distinguish TIME_WAIT and CLOSE_WAIT with {{ss -tan}}. TIME_WAIT is on the side that actively closed, lasting ~60 seconds to protect against delayed packets; many TIME_WAIT to the same destination usually means code creates a new connection per request instead of using a connection pool and keep-alive — risk is running out of ephemeral ports. CLOSE_WAIT is on the passive side after receiving FIN, but the app has not {{close()}}'d; steadily growing CLOSE_WAIT is almost certainly a socket-leak bug, e.g. an HTTP response entity not consumed/closed in Java. I use {{ss -tanp state close-wait}} to attach PID/fd, then check code for try-with-resources. Fix the root cause in code; sysctl tuning is only a temporary measure.

> Senior tip: Add the metric {{process_files_open_files}} and a socket-by-state dashboard (node_exporter or Micrometer + OS metrics). CLOSE_WAIT growing linearly by the hour is a "time bomb" — detecting it at 30% of the fd limit leaves time to fix during business hours. For services calling many partners, standardize the HTTP client as a shared bean with a pool and explicit timeouts.`,
    follow: [
      'Why does TIME_WAIT exist in TCP and what would happen if it were removed entirely?',
      'In Spring Boot with RestTemplate/WebClient, how do you configure connection pool and timeouts to avoid connection leaks?',
      'How do you distinguish CLOSE_WAIT caused by your app from CLOSE_WAIT caused by a library/driver (e.g. JDBC driver, HTTP client)?'
    ],
  },
  'devops-061': {
    q: 'A Java service calling {{api.partner.com}} sometimes hangs for a few seconds during DNS resolution, or after the partner changes IP (failover) the app keeps calling the old IP for tens of minutes. How does the JVM cache DNS, where do you configure {{networkaddress.cache.ttl}}, and how do you diagnose slow DNS on Linux/container?',
    a: `**Summary:** The JVM (class {{InetAddress}}) has its own DNS cache layer above the OS resolver. Historical defaults: when a Security Manager is present, successful results are cached **forever** (to avoid DNS spoofing); when no Security Manager is present (common since Java 17+ because Security Manager is deprecated), successful results are cached **30 seconds**, failed lookups **10 seconds**. Configure via {{networkaddress.cache.ttl}} and {{networkaddress.cache.negative.ttl}} in {{<java.home>/conf/security/java.security}} or set at startup with {{java.security.Security.setProperty}}. For slow DNS, diagnose at the OS/container layer first ({{/etc/resolv.conf}}, {{nsswitch.conf}}, {{getent}}, {{dig}}, latency to resolver), then suspect the JVM layer.

### Quick understanding
DNS is like looking up a phone book to convert a name ({{api.partner.com}}) into a phone number (IP). The JVM keeps a small notebook (cache) so it does not have to consult the phone book every time — faster, but if the number changes (failover), the old notebook causes wrong calls. The real phone book lives in the OS ({{/etc/resolv.conf}} pointing to a DNS server). If consulting the real phone book is slow, the JVM is slow too even though the notebook works.

### Terms
- **DNS (Domain Name System)**: system that resolves domain names to IP addresses.
- **TTL (Time To Live)**: how long a DNS record may be cached. There is the TTL of the DNS record itself (from authoritative server) and the TTL of the cache in JVM/OS — two different things.
- **Resolver**: component performing DNS queries (usually glibc/musl library + {{/etc/resolv.conf}} config).
- **{{InetAddress}}**: standard Java class representing an IP address and performing name resolution ({{InetAddress.getByName}}, {{getAllByName}}).

### JVM DNS cache: mechanism and defaults
~~~text
Java code calls InetAddress.getByName("api.partner.com")
  -> Check JVM cache (InetAddress cache)
     -> Cache hit & not expired: return IP immediately (no OS query)
     -> Cache miss/expired: call OS resolver
        -> OS checks /etc/hosts, nscd (if present), then asks DNS server in /etc/resolv.conf
        -> Return result, JVM stores it in cache per TTL
~~~

**Default values to remember for interviews:**
| Property | With Security Manager | Without Security Manager (common today) |
|---|---|---|
| {{networkaddress.cache.ttl}} (success) | -1 (cache forever) | 30 (seconds) |
| {{networkaddress.cache.negative.ttl}} (failure) | 10 | 10 |

Values: {{-1}} = cache forever; {{0}} = no cache; {{N}} = cache N seconds. (Confirm on the JDK you use because behavior/documentation may differ by distribution; Security Manager is deprecated since Java 17.)

### Configuring TTL
~~~text
# File: $JAVA_HOME/conf/security/java.security
# (find the networkaddress.cache.ttl line)
networkaddress.cache.ttl=30
networkaddress.cache.negative.ttl=10
~~~
Or set in code at startup (must run early, before the first lookup, and consider security policy):
~~~java
import java.security.Security;

// Cache 30 seconds — balance between reducing lookups and reacting to failover
Security.setProperty("networkaddress.cache.ttl", "30");
Security.setProperty("networkaddress.cache.negative.ttl", "5");
~~~
Or pass a property at launch (some JDKs support different properties; the safest is {{java.security}}). Check the documentation for your specific JDK.

**Considerations when choosing TTL:**
- TTL too large (or -1): after failover/IP change (RDS endpoint IP change, ELB, partner DR), app calls the old IP → errors until restart or cache expiry.
- TTL = 0: every call resolves → higher latency, higher DNS load; but fast reaction to changes.
- In practice: 30-60 seconds is a common balance; for services where failover matters, 10-30 seconds. Combine with a **connection pool** to reduce resolve frequency (connections kept open do not need re-resolving).

### Diagnosing slow DNS on Linux/container
~~~bash
# 1) Resolver config in container/pod
cat /etc/resolv.conf
# nameserver, search, ndots, options timeout/attempts

cat /etc/nsswitch.conf | grep hosts
# Example: hosts: files dns  (check /etc/hosts first, then DNS)

# 2) Measure resolve time (bypasses JVM cache — run from shell)
time getent hosts api.partner.com
# getent uses system NSS (like many native apps)

dig api.partner.com
# Watch "Query time" (ms), which SERVER answered, ANSWER SECTION

# 3) Check /etc/hosts for stale entries
grep partner /etc/hosts

# 4) Check connectivity/latency to DNS server
# (take nameserver IP from resolv.conf, e.g. 10.96.0.10)
# use nc or repeated dig

# 5) If suspecting OS cache (nscd/systemd-resolved)
# systemd-resolve --statistics (depends on distro)
~~~

**In Kubernetes:** {{/etc/resolv.conf}} usually points to CoreDNS (ClusterIP). {{ndots:5}} and search domains can make an external domain be tried many times with internal suffixes → many NXDOMAIN queries, increasing latency (see also devops-035). Symptom: {{dig}} an FQDN with a trailing dot {{api.partner.com.}} is fast, but calling without the trailing dot is slow.

### Distinguishing "slow DNS" from "slow connection"
| Symptom | Suspect DNS | Suspect TCP/TLS/connect |
|---|---|---|
| First call to domain slow, later ones (same process, within TTL) fast | JVM/OS cache miss then hit | Less related |
| {{dig}} slow | Resolver/DNS server/search path | No |
| {{dig}} fast but app slow | JVM cache TTL=0, or resolving every call due to code | Or TLS handshake, pool exhausted |
| After failover still calling old IP | JVM/OS cache TTL too long | No |

### Common pitfalls
1. **Setting {{networkaddress.cache.ttl=-1}} (cache forever)**: common when copying old config "to be safe". Consequence: DNS failover has no effect until all JVMs restart. Avoid: set a finite TTL (30s) unless you have another mechanism.
2. **Changing only the DNS record but forgetting TTL at many layers**: authoritative DNS TTL, resolver cache, OS cache, JVM cache, connection pool holding connections to old IP. Avoid: when planning failover, lower TTL beforehand (hours/days depending), understand the whole cache chain.
3. **Blaming "Java is slow" without measuring at OS layer**: if {{dig/getent}} takes 3 seconds, the JVM will too. Avoid: diagnose bottom-up (network → resolver → OS NSS → JVM).
4. **Confusing TCP sysctls with DNS**: TCP parameters do not fix DNS. Avoid: isolate the correct layer.

### Interview answer
The JVM caches DNS in {{InetAddress}}. Modern defaults (no Security Manager) usually cache a successful lookup for about 30 seconds and a failed lookup for 10 seconds; you can configure {{networkaddress.cache.ttl}} and {{networkaddress.cache.negative.ttl}} in {{java.security}} or set them early with {{Security.setProperty}}. TTL too long causes the app to call the old IP after failover; TTL 0 causes too many lookups. When DNS is slow, I diagnose from the OS: {{/etc/resolv.conf}}, {{nsswitch.conf}}, measure with {{getent}} and {{dig}} to separate a slow resolver from a slow app. On Kubernetes I watch {{ndots}}/search domains increasing query count. I also use a connection pool to reduce resolve frequency.

> Senior tip: Before a planned failover (changing DB endpoint, DR site), build a checklist: lower DNS TTL at the authoritative server first; confirm JVM {{networkaddress.cache.ttl}} is low enough; check the connection pool validates/evicts dead connections; and have a rolling-restart runbook if needed. "DNS changed but the app still fails" is almost always caching at one of the layers.`,
    follow: [
      'What is the difference between the TTL of a DNS record (authoritative) and the JVM\'s {{networkaddress.cache.ttl}}?',
      'In Kubernetes, how does {{ndots:5}} affect latency when resolving external domain names?',
      'How do you make a Java service react quickly when an RDS failover changes the endpoint IP?'
    ],
  }
});
