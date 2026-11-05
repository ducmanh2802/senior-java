/*
 * English translation of js/data/q-devops.js — task T735. Format: js/core/i18n.js (content overlay).
 * ids: devops-062 devops-063 devops-064 devops-065 devops-066 devops-067 devops-068 devops-069 devops-070 devops-071 devops-072 devops-073
 */
App.i18n.content({
  'devops-062': {
    q: 'A Java process suddenly disappears. Sometimes the log contains {{java.lang.OutOfMemoryError}}, sometimes the log is silent and the container reports exit code 137. What is the difference between the Linux kernel OOM killer and the JVM OutOfMemoryError, how do you confirm each with {{dmesg}}/journalctl, and how do you prevent each?',
    a: `**Summary:** **OutOfMemoryError (OOME)** is an error thrown by the **JVM** when it cannot allocate memory in the regions it manages (heap, metaspace, etc.) — the process usually keeps running (depending on configuration), the log contains an OOME stack trace, and you may get a heap dump if {{-XX:+HeapDumpOnOutOfMemoryError}} is enabled. The **OOM killer** is a **Linux kernel** mechanism: when the system (or cgroup/container) runs out of RAM, the kernel picks a process to kill immediately (SIGKILL) — the application log usually **has nothing**, the exit code is usually 137 (128+9), and the evidence is in {{dmesg}} or {{journalctl -k}}. The two operate at different layers, with different symptoms and different fixes.

### Quick understanding
Think of the JVM as a company renting office space (a container with a RAM limit). **OOME** is like the internal accountant (JVM) reporting "the heap room is full, no more desks can be added" — the company still stands, and the accountant writes a memo (stack trace). The **OOM killer** is like the building management (kernel) seeing the whole building/apartment exceed the allowed power/water, and cutting power abruptly (SIGKILL) — nobody has time to write a memo, only the building security log ({{dmesg}}) records it.

### Terms
- **Heap**: the memory region where the JVM allocates Java objects. Bounded by {{-Xmx}}.
- **Metaspace**: the memory region (native, since Java 8+) holding class metadata. Can overflow if too many classes are loaded.
- **SIGKILL (signal 9)**: a signal that forces the process to die immediately; the process cannot catch/block it and cannot run shutdown hooks. Exit code = 128 + 9 = **137**.
- **cgroup (control group)**: a Linux mechanism that limits resources (RAM, CPU) for a group of processes. Containers use cgroups; exceeding a cgroup's memory limit triggers the kernel to OOM-kill a process in that cgroup.
- **oom_score / oom_score_adj**: values the kernel uses to pick the "victim" when an OOM occurs at the system level. A higher score means more likely to be killed.

### Comparison table
| | OutOfMemoryError (JVM) | OOM killer (Linux kernel) |
|---|---|---|
| Who decides | JVM | Kernel (system or cgroup) |
| Typical cause | Heap full, metaspace full, cannot create native thread | Process/cgroup exceeds physical RAM/limit; node out of RAM |
| Application log | Has {{java.lang.OutOfMemoryError: ...}} and stack trace | Usually **nothing** (SIGKILL) |
| Exit code (container/process) | Depends: app may keep running, or exit with app-decided code; with {{-XX:+ExitOnOutOfMemoryError}} JVM exits (usually code 3) / {{CrashOnOutOfMemoryError}} | Usually **137** (SIGKILL) |
| Heap dump | Yes if {{-XX:+HeapDumpOnOutOfMemoryError}} is enabled | No (JVM never gets to run) |
| Evidence | App log, heap dump ({{.hprof}}), {{jstat}} | {{dmesg -T}}, {{journalctl -k}}, {{/var/log/kern.log}} (distro-dependent), K8s events |
| Fix | Increase/tune {{-Xmx}}, fix leak, reduce allocation, inspect metaspace/thread | Set memory limit/request reasonably, reduce RSS (heap + metaspace + thread stack + direct buffer + native), fix native leak |

### Confirming the OOM killer
~~~bash
# Inspect kernel log (requires privileges; in a container you may need to check the node)
dmesg -T | grep -i -E 'killed process|out of memory|oom-kill'
# Example line:
# [Tue Nov 05 10:22:11 2026] Out of memory: Killed process 12345 (java)
#   total-vm:..., anon-rss:..., file-rss:..., shmem-rss:...

# With systemd/journald
journalctl -k --since "1 hour ago" | grep -i -E 'killed process|oom'

# On Kubernetes: describe the pod
kubectl describe pod <pod>
# Look for: Last State: Terminated, Reason: OOMKilled, Exit Code: 137
# Or warnings in Events
~~~
If running in a container, {{dmesg}} inside the container may show nothing depending on security configuration; check the **node** or use {{kubectl describe}}/monitoring.

### Confirming a JVM OutOfMemoryError
~~~bash
# Search application log
grep -n "OutOfMemoryError" /var/log/app/app.log

# Common OOME variants:
# Java heap space          -> heap full (leak or heap too small)
# Metaspace                -> too many classes/loaders (usually a ClassLoader leak)
# unable to create new native thread -> out of RAM/native for thread stacks or OS limit hit
# Direct buffer memory     -> direct ByteBuffer (Netty, NIO) accumulating
# GC overhead limit exceeded (some older GC/config) -> GC runs forever without reclaiming
~~~

### Prevention
**For OOME (JVM):**
~~~bash
# Enable heap dump on OOME (ensure there is space to write the dump file)
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/log/app/heapdump.hprof
# Make the JVM exit so the orchestrator restarts cleanly (strategy-dependent)
-XX:+ExitOnOutOfMemoryError
# Set heap reasonably; do not set -Xmx right at the container memory limit
~~~

**For the OOM killer (container):**
- Total real RSS = heap + metaspace + code cache + thread stacks + direct buffers + native + GC overhead. Do not set {{-Xmx}} = 100% of the container memory limit. Rough rule: heap 60-75% of limit, leave the rest for non-heap.
- Use {{-XX:MaxRAMPercentage=75.0}} (JDK 10+) so the JVM computes heap from the container/cgroup limit.
- Set Kubernetes {{resources.requests.memory}} and {{limits.memory}} realistically; monitor {{container_memory_working_set_bytes}}.
- Check thread count ({{-Xss}}, thread pool) — each thread costs stack (default often ~1MB, JVM/OS dependent).

### Common mistakes
1. **Seeing exit 137 and immediately raising {{-Xmx}}**: if killed by the OOM killer due to cgroup, raising heap can make RSS exceed the limit faster → killed sooner. Avoid by confirming via {{dmesg}}/K8s OOMKilled; raise the **memory limit** or reduce non-heap/heap appropriately.
2. **Not enabling heap dump because "it costs disk"**: when a real OOME happens you have no data to analyse the leak. Avoid by enabling dumps, configuring a path with enough space, and cleaning old files.
3. **Confusing OOME {{unable to create new native thread}} with heap**: raising {{-Xmx}} can make it worse by leaving less native RAM for threads. Avoid by reading the OOME message carefully; check thread count, {{-Xss}}, {{ulimit -u}}.
4. **Only looking at app log when the process disappears**: the OOM killer leaves no app log. Avoid by always checking kernel log/K8s events.

### Interview answer
I distinguish the two cases. OutOfMemoryError is thrown by the JVM when heap/metaspace/direct memory/etc. is insufficient — the app log has a stack trace, and there may be a heap dump if {{HeapDumpOnOutOfMemoryError}} is enabled. The OOM killer is the Linux kernel killing the process (usually SIGKILL, exit 137) when the system or cgroup runs out of RAM — the app log is usually silent, and the evidence is in {{dmesg -T}} or {{journalctl -k}}, and on Kubernetes it is {{OOMKilled}}. The fixes differ: for OOME, analyse the heap dump, tune {{-Xmx}} or fix the leak; for the OOM killer, ensure the memory limit covers total RSS (heap + non-heap + thread + direct buffer), and use {{MaxRAMPercentage}} instead of hard-coding {{-Xmx}} too close to the limit.

> Senior tip: Operating rule: every production Java service should have {{-XX:+HeapDumpOnOutOfMemoryError}}, {{-XX:+ExitOnOutOfMemoryError}} (or equivalent) for fail-fast and clean orchestrator restarts; the dashboard must clearly separate "OOMKilled (kernel)" from "OOME (JVM)" because the runbooks differ. Never diagnose an OOM by "the app died".`,
    follow: [
      'How do you choose {{-Xmx}} and {{MaxRAMPercentage}} when running Java in a container with a 2Gi memory limit?',
      'When the whole node runs out of RAM, which process does the OOM killer pick? How does {{oom_score_adj}} affect this?',
      'What are the common root causes of a "Metaspace" OOME in a Spring Boot application, and how do you detect them?'
    ],
  },
  'devops-063': {
    q: 'A Java service running for a few days throws {{java.io.IOException: Too many open files}} or {{SocketException: Too many open files}}. How do you check the {{ulimit -n}} (soft/hard) limit, the limits in systemd/container, and use {{lsof}}/{{/proc/<PID>/fd}} to find a file descriptor leak in Java?',
    a: `**Summary:** Every file, socket, pipe, epoll fd... a process opens consumes one **file descriptor (fd)**. Linux limits the number of fds per process via {{RLIMIT_NOFILE}} (soft and hard limits, see {{ulimit -n}} / {{ulimit -Hn}}). When the limit is hit, opening a new file/socket fails with "Too many open files" (EMFILE). Common Java causes: streams/sockets/channels not closed (missing try-with-resources), {{Files.list/lines/walk}} returning a Stream that holds an fd, misconfigured connection pool, or WatchService. Diagnosis: inspect the process's real limits in {{/proc/<PID>/limits}}, count current fds, and use {{lsof -p}} to see what kind of fd and where it points; fix by closing resources and setting sensible limits at the systemd/container layer.

### Quick understanding
A file descriptor is like a "ticket" to enter a resource room: every open file, every network connection, every pipe needs one ticket. The kernel issues a maximum number of tickets per process (the limit). If code "borrows a ticket" (opens a file/socket) but forgets to "return it" (close), the number of tickets held keeps growing — after a few days they run out, and the next open is rejected: "Too many open files". Even though the message says "files", network sockets count too.

### Terms
- **File descriptor (fd)**: a non-negative integer (0,1,2...): 0=stdin, 1=stdout, 2=stderr; from 3 upward are files/sockets/pipes... opened by the process.
- **Soft limit / Hard limit**: soft is the threshold the kernel applies immediately; a process (with appropriate privileges) can raise soft up to hard; only root (or {{CAP_SYS_RESOURCE}}) can raise hard. {{ulimit -n}} usually shows soft; {{ulimit -Hn}} shows hard.
- **{{RLIMIT_NOFILE}}**: the resource-limit name for the number of open fds.
- **try-with-resources**: a Java construct that declares resources in a {{try(...)}} statement; the compiler automatically inserts {{close()}} when leaving the block, even on exception. Example: {{try (var in = Files.newInputStream(path))}} then use {{in}} inside the block.

### Checking limits and usage
~~~bash
# Limits in the current shell (may DIFFER from the running process)
ulimit -n      # soft
ulimit -Hn     # hard

# The REAL limits of the Java process (important)
PID=12345
cat /proc/$PID/limits | grep "Max open files"
# Max open files   1024   4096   files  (example: soft 1024, hard 4096)

# Number of currently open fds
ls /proc/$PID/fd | wc -l
# or
lsof -nP -p $PID | wc -l

# See what kind of fd (regular file, TCP/UDP socket, pipe, anon_inode...)
lsof -nP -p $PID | awk '{print $5}' | sort | uniq -c | sort -rn | head
# Example: 800 IPv4 (socket), 50 REG (file), 30 FIFO...
~~~

If {{ls /proc/$PID/fd | wc -l}} keeps rising over time (an upward graph), that is a leak.

### Limits at multiple layers (Linux/service/container)
| Layer | Configuration | Notes |
|---|---|---|
| Kernel-wide | {{fs.file-max}}, {{fs.nr_open}} ({{/proc/sys/fs/...}}) | System ceiling; rarely the direct cause for one process |
| PAM/login shell | {{/etc/security/limits.conf}}, {{limits.d}} | Applies to login sessions; **systemd services usually do not read** this file |
| systemd service | {{LimitNOFILE=65536}} in {{[Service]}} | The correct way for a daemon running under systemd; reload daemon and restart service |
| Docker/containerd | {{--ulimit nofile=65536:65536}}, or runtime config | Image/container must set this explicitly; default can be low |
| Kubernetes | Usually inherited from node/container runtime; some environments use {{securityContext}}/annotations depending on runtime | Check in the pod: {{cat /proc/1/limits}} |

**Trap:** you SSH into the server and see {{ulimit -n}} = 65535, but the Java service running under systemd still sees 1024 in {{/proc/$PID/limits}} because the systemd unit did not set {{LimitNOFILE}}.

### Finding the fd leak in Java: common patterns
~~~bash
# Socket leak: many TCP lines to the same destination or CLOSE_WAIT
lsof -nP -p $PID | grep TCP | head
ss -tanp | grep "pid=$PID"

# File leak: many REG entries pointing at log/temp/directory files
lsof -nP -p $PID | grep REG | awk '{print $9}' | sort | uniq -c | sort -rn | head

# Many "anon_inode:[eventpoll]" unexpectedly: may be creating selector/epoll in a loop (rare)
# Many pipes: creating ProcessBuilder/process without closing streams
~~~

**Java code that often leaks:**
~~~java
// WRONG: Files.lines returns a Stream that holds the fd until closed
long n = Files.lines(Path.of("/data/big.txt")).count();

// RIGHT
try (Stream<String> lines = Files.lines(Path.of("/data/big.txt"))) {
    long n = lines.count();
}

// WRONG: Files.list / Files.walk also must be closed
Files.list(dir).forEach(...);

// RIGHT
try (Stream<Path> paths = Files.list(dir)) {
    paths.forEach(...);
}

// WRONG: HttpURLConnection / InputStream not closed
InputStream in = url.openStream();
byte[] b = in.readAllBytes();

// RIGHT
try (InputStream in = url.openStream()) {
    byte[] b = in.readAllBytes();
}

// ZipFile / JarFile hold an fd to the archive — must be closed
try (ZipFile z = new ZipFile("app.jar")) { ... }
~~~
Also: {{DirectoryStream}} (NIO) must be closed; {{WatchService}} if created repeatedly; HTTP/DB connections not going through a pool or a misconfigured pool (HikariCP leak detection is useful).

### Supporting tools
- HikariCP: enable {{leakDetectionThreshold}} to log warnings when a connection is borrowed too long.
- Repeated {{lsof}} or monitoring {{process_files_open_files}} / {{process_files_max_files}} (Prometheus JMX exporter / Micrometer).
- Heap dump helps indirectly (find objects holding {{Socket}}, {{FileInputStream}}), but {{lsof}} and code review are more direct.

### Common mistakes
1. **Only raising {{ulimit}}/{{LimitNOFILE}} without fixing the leak**: fds run out later, but still run out; also hides the bug. Avoid by treating the limit increase as a temporary safety measure while finding and fixing the leak.
2. **Editing {{/etc/security/limits.conf}} for a systemd service**: has no effect. Avoid by setting {{LimitNOFILE}} in the systemd unit file.
3. **Assuming "Too many open files" is only disk files**: in network services the majority of cases are **sockets**. Avoid by using {{lsof}} to classify by TYPE.
4. **Closing resources on the happy path but forgetting on exception**: leak only appears when errors occur. Avoid by always using try-with-resources for {{Closeable}}/{{AutoCloseable}}.

### Interview answer
"Too many open files" means the process hit {{RLIMIT_NOFILE}}. I check the process's real limits via {{/proc/<PID>/limits}} (not just {{ulimit}} in the shell) because systemd/container may set different values. I measure fd count with {{ls /proc/<PID>/fd | wc -l}} and classify with {{lsof -p}} to see whether they are sockets or regular files. In Java, the common causes are unclosed resources: {{Files.lines/list/walk}} returning a Stream that holds an fd, {{InputStream}}/{{Socket}}/{{ZipFile}} not closed, or HTTP/DB connections not returned to the pool — fix with try-with-resources and correct pool configuration. I raise {{LimitNOFILE}} (systemd) or the container ulimit as a safety measure, but always address the root leak and add monitoring of {{open_files}} over time.

> Senior tip: Set an alert when {{process_open_fds / process_max_fds > 0.7}} (or equivalent). Fd leaks usually grow slowly (a few fds/minute) and only blow up after days — if you only look when already at 100%, you always handle an incident at midnight. With Java NIO/Netty, also check direct buffers and channel count, but "Too many open files" is the clearest fd-level signal.`,
    follow: [
      'Why is {{Files.lines()}} mandatory inside try-with-resources, and why do many developers miss it?',
      'What is the difference between setting {{ulimit}} in the shell, {{limits.conf}}, and systemd\'s {{LimitNOFILE}}?',
      'How do you use HikariCP leak detection and fd metrics to detect a connection leak before hitting the limit?'
    ],
  },
  'devops-064': {
    q: 'You are building a production incident runbook for an on-call team of a Java service (banking/payments). What steps should the runbook include (detect/triage/mitigate/resolve/postmortem), the principle of collecting evidence before restart, and how to organize escalation/communication to reduce impact time?',
    a: `**Summary:** An incident runbook is a step-by-step action document so the on-call engineer (even one who did not author the system) can **reduce impact quickly, safely, and in coordination**. The standard framework: **Detect → Triage → Mitigate → Communicate (in parallel) → Resolve → Postmortem**. For Java, the golden rule is **collect evidence before restart** (thread dump, heap dump/histogram, GC log, {{dmesg}}, metric snapshot) because a restart wipes the in-RAM state. At lead level, you design the runbook to reduce MTTR (mean time to recovery), reduce bus factor, and build a blameless culture: the goal is to fix the system, not find someone to blame.

### Quick understanding
A runbook is like a "fire handling manual" placed next to the fire extinguisher: when there is smoke, the on-call engineer does not need to remember the whole architecture — they open the right page, follow the checklist, call the right person, and log what was done. In payments/banking, incident handling also ties to SLA commitments, customer/partner notification, and sometimes compliance (audit trail). Restarting a service is like "flipping the breaker" — it can put out the fire fast but also destroys the traces; so photograph the scene (evidence) first.

### Terms
- **Incident**: a situation that degrades service quality or causes disruption (rising errors, rising latency, loss of function).
- **On-call**: a rotation schedule for responding to incidents outside business hours.
- **MTTD / MTTR**: Mean Time To Detect / To Recover — average time to detect / to recover.
- **Mitigation**: an action that reduces customer impact quickly (rollback, scale, shift traffic), not necessarily fixing the root cause.
- **Root cause**: the deep cause of the incident; found after the system is stable.
- **Blameless postmortem**: a retrospective that does not assign personal blame, focusing on mechanisms/systems/guardrails.

### Runbook structure (framework template)
~~~text
1. Detect (detection)
   - Sources: alerts (Prometheus/Alertmanager, CloudWatch, APM), reports from CS/partners
   - Incident entry condition: error rate > X% for Y minutes, p99 > Z ms, payment success < ...
   - Open an incident channel (Slack/Teams/bridge call), assign an Incident Commander (IC) for high severity

2. Triage (classification)
   - Severity (SEV): SEV1 affects money transactions/customers broadly; SEV2 partial degradation; SEV3 low
   - Scope: what % of traffic, which region, which function (login/payment/lookup)
   - Quick hypotheses: recent deploy? DB/partner/network dependency? infrastructure change?

3. Mitigate (reduce impact) — prioritize restoring service
   - Roll back the latest version (if correlated with a deploy)
   - Disable the feature flag causing the issue; reduce traffic (rate limit), switch to degraded mode
   - Scale/restart with control (after collecting evidence); DB/region failover per playbook
   - For payments: identify stuck/in-flight transactions, avoid double-charge; coordinate with business

4. Communicate (in parallel)
   - Periodic updates (e.g. every 15 minutes for SEV1): status, impact, next actions, ETA if available
   - Stakeholders: CS, management, partners, (if needed) compliance/legal — via pre-approved templates
   - Log the timeline: timestamp + action + person

5. Resolve (fix)
   - Confirm metrics recover (error rate, latency, success rate) and stay stable
   - Post-incident monitoring (hypercare) for 30-60 minutes
   - Close the incident when conditions are met

6. Postmortem (learn) — within 24-72 working hours
   - Objective timeline, impact (number of transactions/customers, duration)
   - Root cause (technical + process), contributing factors
   - Action items with owner, deadline, priority (tests, alerts, circuit breaker, runbook updates)
   - Blameless: do not name individuals to blame; state "what the system allowed to happen"
~~~

### Principle: collect evidence BEFORE restart (Java)
Restart/deleting a pod/killing a process loses: thread stacks, heap, socket state, in-RAM buffers. Prepare a "collection bundle" (script) and run it fast:

~~~bash
TS=$(date +%Y%m%d_%H%M%S)
OUT=/tmp/incident_$TS; mkdir -p $OUT
PID=<PID_JAVA>

# 1) System context
date > $OUT/time.txt
uptime; free -m; df -h; df -i > $OUT/sys.txt
top -H -b -n1 -p $PID > $OUT/top_threads.txt

# 2) Thread dump: 3 times 5-10 seconds apart
for i in 1 2 3; do jcmd $PID Thread.print > $OUT/threaddump_$i.txt; sleep 7; done
# Or jstack $PID

# 3) Memory/GC
jcmd $PID GC.heap_info > $OUT/heap_info.txt 2>&1 || true
jcmd $PID GC.class_histogram > $OUT/class_histogram.txt 2>&1 || true
# Heap dump only if leak suspected and disk/permission allow (large file, may pause)
# jcmd $PID GC.heap_dump $OUT/heap.hprof

# 4) Network/sockets
ss -s > $OUT/ss_summary.txt
ss -tanp > $OUT/ss_all.txt 2>&1 || true
lsof -nP -p $PID > $OUT/lsof.txt 2>&1 || true

# 5) Kernel/OOM
dmesg -T | tail -200 > $OUT/dmesg_tail.txt 2>&1 || true

# 6) App log (pull the segment near the incident)
# tail -n 5000 /var/log/app/app.log > $OUT/app_tail.log

# Compress and store per policy (mind sensitive/PII data)
tar czf $OUT.tgz $OUT
~~~

**In Kubernetes:** use {{kubectl exec}} (if the container has {{jcmd}}), an ephemeral debug container, or a protected Actuator endpoint ({{/actuator/threaddump}}, {{/actuator/heapdump}}). Consider: {{heapdump}} may contain sensitive data — follow security policy.

**When to restart first?** If a SEV1 is spreading and you have collected the minimum (thread dump + metrics + {{dmesg}}) or cannot access the process, prioritize mitigation. The runbook must state "minimum required before restart".

### Escalation & communication
- **Escalation matrix**: for SEV1, call IC + technical lead + owners of dependent services within X minutes; have backup contact numbers.
- **Single coordinator (IC)**: avoid overlapping orders from multiple people.
- **Notification template**: pre-written for internal customers/partners, stating "what is affected, since when, what is being done, next update when" — do not speculate on cause until certain.
- **Banking/payments**: record suspicious transactions, coordinate reconciliation; follow internal/regulatory incident reporting procedures if thresholds are reached.

### Common mistakes
1. **No runbook, only "person A knows"**: when A is on leave, MTTR spikes. Avoid by documenting, drilling (game day), and updating after each postmortem.
2. **Restart reflex**: damps symptoms but repeats, with no root-cause data. Avoid by a "minimum evidence before restart" checklist; automate collection.
3. **Postmortem becomes a blame session**: people hide information next time. Avoid by staying blameless, focusing on guardrails (alerts, tests, circuit breaker, limits, review).
4. **Vague action items with no owner/deadline**: "improve monitoring" never finishes. Avoid by assigning each action an owner, deadline, and completion criteria.

### Interview answer (lead perspective)
I build the runbook along the lifecycle Detect, Triage, Mitigate, Communicate, Resolve, Postmortem. The most important part for Java is the evidence-before-restart checklist: 3 thread dumps spaced apart, heap/GC info, fd/socket counts, and {{dmesg}} to distinguish the OOM killer from OOME — because a restart wipes in-RAM state. I define clear SEV levels, an Incident Commander, periodic stakeholder updates, and an escalation matrix so the right people join within minutes. After the incident is a blameless postmortem with action items that have owners and deadlines. My goal is to reduce MTTR and recurrence, not to find who is at fault. In a payments context I add steps for transaction impact control and coordination with business/compliance.

> Senior tip: A runbook only lives if it is used. (1) Link the runbook from the alert, (2) run game days/drills periodically in a safe environment, (3) update the runbook as a postmortem action item. A runbook that is 80% correct but everyone can find is worth more than a perfect document sitting in a wiki nobody reads.`,
    follow: [
      'On what criteria do you define SEV1/SEV2 for a payments service (SLO, % transactions, revenue, compliance)?',
      'When you suspect a deploy caused the issue, do you rollback or roll forward? What are the decision conditions?',
      'How do you balance "collecting a heap dump" (which may pause and expose data) against security/compliance requirements?'
    ],
  },
  'devops-065': {
    q: 'Explain user, group, rwx/octal permissions, sudo/sudoers, setuid, umask; how do you grant minimum privileges to a deploy user?',
    a: `**Summary:** Linux controls access via users/groups and three r/w/x permission groups for owner/group/other; minimum privilege for a deploy user = a dedicated user, dedicated group, sudo only for specific commands, umask 027, no random setuid.

### Basic concepts
- **User**: each account has a UID; /etc/passwd stores UID, home, shell.
- **Group**: a set of users; /etc/group. A user has a primary group + supplementary groups.
- **rwx permissions**: read (read content/list directory), write (modify/create/delete), execute (run file/enter directory).
- **Octal**: r=4, w=2, x=1; e.g. 755 = rwxr-xr-x, 640 = rw-r-----.
- **sudo**: run a command with root privileges per policy in /etc/sudoers (edit with visudo).
- **sudoers**: defines who may run which commands on which hosts as which user.
- **setuid**: a special bit (4xxx) making a file run with the owner's UID (e.g. passwd). Major security risk.
- **umask**: the default permission mask applied when creating files (022 → file 644, dir 755; 027 → file 640, dir 750).

### Granting minimum privileges to a deploy user
1. Create a dedicated deploy user: useradd -m -s /bin/bash deploy.
2. Create an app group and add deploy: usermod -aG app deploy.
3. App directory owned by group app, mode 2750 (setgid so new files inherit the group): chown -R root:app /opt/app && chmod 2750 /opt/app.
4. sudoers only for needed commands: deploy ALL=(root) NOPASSWD: /bin/systemctl restart myapp, /bin/journalctl -u myapp. Edit with visudo; never allow sudo su or sudo bash.
5. umask 027 in deploy's ~/.bashrc.
6. Deploy private key mode 600.

### Pitfalls
- chmod -R 777 is an anti-pattern.
- sudo NOPASSWD for apt/yum is effectively full root.
- setuid on shell scripts is ignored by the kernel.

> Senior tip: Least-privilege principle: the deploy user needs no root shell, only service restart and log reading. Audit sudoers periodically (sudo -l -U deploy).`,
    follow: [
      'What is the difference between chmod and chown? When do you use ACLs (setfacl)?',
      'What does the setgid bit on a directory do for newly created files?',
      'How do you audit a deploy user\'s access on production?'
    ],
  },
  'devops-066': {
    q: 'Write a bash deploy script that handles errors: set -euo pipefail, trap ERR/EXIT, exit codes, bounded retry, logging, idempotency.',
    a: `**Summary:** A reliable deploy script = set -euo pipefail for fail-fast, trap for cleanup/logging, bounded retry for network operations, timestamped logging, and idempotent steps (re-running does no harm).

### set -euo pipefail
- set -e: exit immediately when a command fails.
- set -u: error on use of an unset variable.
- set -o pipefail: a pipeline fails if any command in it fails (not only the last).

### trap
- trap cleanup EXIT: runs cleanup when the script ends (success or failure).
- trap 'echo "fail at line LINENO" >&2' ERR: logs the failing line.

### Bounded retry
retry() { local n=0 max=5 delay=2; until "$@"; do n=$((n+1)); [ $n -ge $max ] && return 1; sleep $delay; delay=$((delay*2)); done; }
Use for curl health checks, image pulls, scp.

### Logging
- exec > >(tee -a /var/log/deploy.log) 2>&1 or a function log() { echo "[$(date -Is)] $*"; }.
- Add a correlation id (deploy id) for tracing.

### Idempotency
- Check before acting: if the file/service is already in the desired state, skip.
- Use checksum/version to decide whether to deploy.
- Atomic: deploy into a new directory then switch a symlink; rollback = switch the symlink back.

### Pitfalls
- set -e does not catch errors inside if/while conditions; check explicitly.
- trap ERR does not run on exit due to a signal; also trap INT/TERM.
- Infinite retry causes hangs; always have a max.

> Senior tip: Production deploy scripts should support --dry-run, use a lock file (flock) to prevent two deploys running at once, and have clear exit codes (0 ok, 1 general error, 2 lock, 3 health fail) so CI/CD can classify outcomes.`,
    follow: [
      'What is the difference between trap EXIT and trap ERR?',
      'How do you ensure only one deploy instance runs at a time (flock)?',
      'When should you use Ansible instead of a bash script?'
    ],
  },
  'devops-067': {
    q: 'Compare Deployment, ReplicaSet, StatefulSet, DaemonSet: internal mechanisms and examples for a Spring app, Kafka/DB, and a log agent.',
    a: `**Summary:** Deployment manages ReplicaSets for rolling out stateless apps; ReplicaSet keeps the pod count; StatefulSet is for stateful workloads with stable identity/PVC and ordered rollout; DaemonSet runs one pod per node.

### Internal mechanisms
- **ReplicaSet**: controller compares actual pod count to replicas and creates/deletes pods by selector. Has ownerReferences pointing to the Deployment.
- **Deployment**: manages ReplicaSets, performs rolling updates, rolls back via revision history.
- **StatefulSet**: pods have stable names (web-0, web-1), a separate PVC per ordinal, ordered rollout; suits DB/Kafka/ZooKeeper.
- **DaemonSet**: ensures one pod on every node; used for log/metrics agents, CNI, storage.

### Examples
- Stateless Spring Boot app → Deployment + HPA.
- Kafka broker → StatefulSet + PVC.
- Fluent Bit/log agent → DaemonSet.

### Pitfalls
- Using Deployment for a DB loses identity/PVC mapping.
- StatefulSet scale-down does not auto-delete PVCs; clean up manually.

> Senior tip: Choose the workload type by state + identity: stateless → Deployment; stateful + identity → StatefulSet; node-level agent → DaemonSet.`,
    follow: [
      'How does a Deployment rolling update work (maxSurge, maxUnavailable)?',
      'When do you use Job/CronJob instead of Deployment?',
      'What is a StatefulSet headless service used for?'
    ],
  },
  'devops-068': {
    q: 'Service types (ClusterIP, NodePort, LoadBalancer, ExternalName, headless) and bringing requests from outside the cluster into it (Ingress, Gateway API, AWS LB Controller) — when do you use which?',
    a: `**Summary:** A Service provides a stable endpoint for pods; ClusterIP is internal, NodePort opens a node port, LoadBalancer creates a cloud LB, ExternalName is a DNS alias, headless enables direct discovery. Bring external traffic in via Ingress/Gateway API + AWS LB Controller.

### Service types
- **ClusterIP**: internal cluster IP, the default. For service-to-service communication.
- **NodePort**: opens a port 30000-32767 on every node; access via node IP:port.
- **LoadBalancer**: provisions a cloud LB (AWS NLB/ALB) pointing at the service.
- **ExternalName**: CNAME to an external DNS name (no proxy).
- **Headless (clusterIP: None)**: returns pod DNS A records; used for StatefulSet discovery, gRPC.

### Bringing external traffic in
- **Ingress**: L7 routing (host/path) via an Ingress controller (nginx, ALB).
- **Gateway API**: the newer standard, supporting HTTPRoute/GRPCRoute, role separation.
- **AWS Load Balancer Controller**: creates ALB/NLB from Ingress/Gateway/Service.

### When to use
- Public API → Ingress/ALB + ClusterIP service.
- TCP/UDP or gRPC streaming → NLB or Gateway.
- Service mesh/internal → ClusterIP + mesh.

### Pitfalls
- NodePort range and firewall.
- One LoadBalancer per service = many LBs → cost; aggregate via Ingress.

> Senior tip: Prefer Gateway API for new projects; Ingress is still common. Use ExternalName to gradually migrate an external dependency.`,
    follow: [
      'What is the difference between Ingress and a Service LoadBalancer in cost and features?',
      'What limitations of Ingress does Gateway API solve?',
      'When do you use a headless service with a StatefulSet?'
    ],
  },
  'devops-069': {
    q: 'What components make up a monitoring system (metrics, logs, traces, alerting, dashboard, on-call) and how does data flow through each component?',
    a: `**Summary:** Monitoring = metrics (numbers) + logs (events) + traces (request paths) + alerting (alerts) + dashboard (visualization) + on-call (response). Flow: app → agent/collector → storage → query → dashboard/alert → on-call.

### Components
- **Metrics**: time-series numbers (CPU, RPS, latency p99). Prometheus/Grafana/CloudWatch.
- **Logs**: timestamped event lines with level and context. Fluent Bit → Loki/Elasticsearch/CloudWatch Logs.
- **Traces**: distributed tracing (OpenTelemetry) by traceId/spanId.
- **Alerting**: rules on metrics/logs → Alertmanager/PagerDuty.
- **Dashboard**: Grafana panels.
- **On-call**: rotation, escalation, runbook.

### Data flow
App emits metrics (Prometheus scrape / push OTLP) → Prometheus remote_write → storage (Thanos/Mimir) → Grafana query → dashboard.
Logs: app stdout → container runtime → Fluent Bit DaemonSet → parse/label → Loki → Grafana.
Traces: SDK → OTel Collector → Tempo/Jaeger → Grafana.

### Pitfalls
- Metrics alone are not enough for root cause; need logs+traces.
- Alert fatigue: too many alerts → they get ignored.

> Senior tip: Standardize on OpenTelemetry for vendor neutrality; carry a correlation id (traceId) across logs/metrics/traces.`,
    follow: [
      'What are the RED and USE methods?',
      'When do you use push vs pull for metrics?',
      'How do you reduce log retention cost?'
    ],
  },
  'devops-070': {
    q: 'Mechanisms for collecting logs and metrics: pull (Prometheus scrape) vs push, agent DaemonSet (Fluent Bit), parse/label, retention and cost, cardinality.',
    a: `**Summary:** Prometheus pulls by scraping the /metrics endpoint; push via Pushgateway/OTLP for short-lived jobs. A Fluent Bit DaemonSet tails log files, parses, labels, and sends to Loki. Cardinality (number of label combinations) determines cost and performance.

### Pull vs push
- **Pull**: Prometheus scrapes targets on an interval; the target must expose an endpoint. Easy to detect a down target (scrape fails).
- **Push**: the app pushes (Pushgateway for batch jobs, OTLP for OTel). Needed for short-lived jobs.

### Fluent Bit DaemonSet
- Runs on every node, tails /var/log/containers/*.log.
- Parses (JSON/regex), filters, enriches (k8s metadata), outputs to Loki/Elasticsearch.
- Buffers and retries when the backend is down.

### Retention and cost
- Logs: hot 7-14 days, cold (S3) 90+ days; sample debug logs.
- Metrics: high-res 15d, downsample 90d+.
- Cardinality: number of distinct label combinations. High-cardinality labels (user_id, request_id) → storage/query blow-up.

### Pitfalls
- Putting request_id in a metric label → cardinality explosion.
- No retention set → cost grows.

> Senior tip: Rule: metric labels only for dimensions with bounded values (status code, normalized endpoint). High-cardinality data goes into logs/traces, not metrics.`,
    follow: [
      'How do you detect a cardinality explosion (Prometheus TSDB head)?',
      'Fluent Bit vs Fluentd: when do you choose which?',
      'How does log sampling affect incident investigation?'
    ],
  },
  'devops-071': {
    q: 'What factors do you scale an app on: CPU, RAM (why scaling on RAM is usually wrong for the JVM), RPS, queue lag, custom metrics; HPA/KEDA/Cluster Autoscaler/Karpenter.',
    a: `**Summary:** Scale on the real bottleneck: CPU for compute, RPS/latency for web, queue lag for workers. Scaling on RAM is usually wrong for the JVM because heap is fixed and GC; use custom metrics (RPS, lag) with HPA/KEDA, and scale nodes with Cluster Autoscaler/Karpenter.

### Why scaling on RAM is wrong for the JVM
- JVM heap size is fixed (-Xmx); used RAM ≈ heap + metaspace + off-heap; it does not grow with load immediately.
- GC cleans the heap → used RAM fluctuates; scaling on RAM causes unnecessary or slow scaling.

### Scaling factors
- CPU utilization (HPA target 70%).
- RPS / latency p99 (custom metrics from Prometheus).
- Queue lag (Kafka/RabbitMQ) for workers.
- In-flight requests.

### Tools
- **HPA**: scales pods by metrics (CPU/mem/custom/external).
- **KEDA**: event-driven autoscaling (queue lag, cron), scale to zero.
- **Cluster Autoscaler**: adds nodes when pods are pending.
- **Karpenter**: provisions nodes fast per pod requirements, spot-friendly.

### Pitfalls
- HPA needs correct requests/limits; if requests are too low → wrong scaling.
- Scaling out but exhausting the DB connection pool → bottleneck moves.

> Senior tip: Measure the end-to-end bottleneck (LB → app → DB) before choosing the scaling metric; usually it is DB connections or CPU, not RAM.`,
    follow: [
      'How does Karpenter differ from Cluster Autoscaler?'
    ],
  },
  'devops-072': {
    q: 'Complex pipeline flow and downstream: a complex pipeline calling other repos (GitLab multi-project/parent-child, Jenkins upstream-downstream, GitHub Actions repository_dispatch/workflow_call), passing artifact/version, handling downstream failures.',
    a: `**Summary:** A complex pipeline orchestrates multiple repos: GitLab parent-child/multi-project, Jenkins upstream-downstream, GitHub Actions reusable workflow/repository_dispatch. Pass version/artifact via registry and API; downstream failure → retry/rollback/alert.

### Mechanisms
- **GitLab**: parent-child pipeline (trigger:include), multi-project pipeline (trigger:project), passing variables via variables.
- **Jenkins**: build job → upstream/downstream, using artifact copy plugin or Nexus/registry.
- **GitHub Actions**: workflow_call (reusable workflow), repository_dispatch (event from another repo), workflow_run.

### Passing artifact/version
- Build image → push to registry with a version tag (git SHA + semver).
- Downstream pulls the image by tag; do not copy artifacts directly.
- Pass metadata via API/variable (version, commit SHA).

### Handling downstream failure
- Retry with backoff; on failure → roll back the previous deploy.
- Notify Slack/PagerDuty; block merge.
- Idempotent deploy: safe to re-run.

### Pitfalls
- Tight coupling between repos → a change in one repo breaks another's pipeline.
- Secret sprawl: each repo holds its own secrets.

> Senior tip: Use the container registry as the contract between repos; version is the image tag; the downstream pipeline only needs the tag, not the source.`,
    follow: [
      'When do you use reusable workflow vs repository_dispatch?',
      'How do you ensure version consistency across multiple repos?',
      'How do you roll back when a downstream deploy fails?'
    ],
  },
  'devops-073': {
    q: 'Ansible vs Terraform: provisioning vs configuration management, inventory, playbook, idempotency, when to use both?',
    a: `**Summary:** Terraform provisions infrastructure (IaC, state) declaratively; Ansible configures software/idempotently (agentless, SSH). Use Terraform to create VMs/K8s clusters, Ansible to install packages/configure apps. Combine: Terraform outputs inventory → Ansible runs.

### Concepts
- **Provisioning**: creating resources (VM, network, DB) → Terraform.
- **Configuration management**: installing/configuring software on hosts → Ansible.
- **Inventory**: the list of hosts/groups for Ansible (static or dynamic from Terraform output).
- **Playbook**: YAML describing tasks in order, using idempotent modules.
- **Idempotency**: re-running changes nothing if already in the desired state.

### When to use both
- Terraform creates EC2 + security group + RDS → outputs IPs → Ansible playbook installs Java, deploys the app, configures systemd.
- Terraform for infra lifecycle; Ansible for app config and patching.

### Pitfalls
- Ansible does not manage infra state → cannot detect drift; Terraform state needs remote backend + locking.
- SSH key management and become (sudo) need care.

> Senior tip: Separate infra (Terraform) and config (Ansible); use dynamic inventory to avoid hardcoding IPs; verify idempotency by running the playbook twice.`,
    follow: [
      'How does Terraform state locking work (DynamoDB)?',
      'Ansible idempotency rests on modules, not hand-written tasks — explain.',
      'When do you use Ansible instead of cloud-init/user-data?'
    ],
  }
});
