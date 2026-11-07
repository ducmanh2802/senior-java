/*
 * English translation of js/data/labs-incident.js — task T685. Format: js/core/i18n.js (content overlay).
 * ids: lab-incident-014 lab-incident-015
 */
App.i18n.content({
  'lab-incident-014': {
    title: 'Raised Tomcat threads to 400 for month end: doc-service is OOMKilled every 45 minutes while the heap only uses 690 MB',
    scenario: `**Context.** **doc-service** (Spring Boot 3.3, Spring MVC on Tomcat, JDK 21.0.5, G1) renders electronic invoices as PDF and stores them on an EFS mount at {{/mnt/efs/invoices}}. Each request {{POST /v1/invoices/:id/pdf}} renders the PDF into a {{byte[]}} (average 1.12 MB, p99 3.8 MB) and then writes it to the file, which takes about 1 second. Pod: request 1Gi, **limit 2Gi**, 2 vCPU. {{JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=80 -XX:+UseG1GC -XX:NativeMemoryTracking=summary}}; no {{-Xmx}}, {{-Xss}} or {{-XX:MaxDirectMemorySize}} is set.

**Recent change.** On 28/10/2026, to prepare for the end-of-month invoice run, PR #812 raised {{server.tomcat.threads.max}} from **200 to 400**. The load test only ran at 150 request/s, so it caught nothing.

**Symptoms (30/10/2026).** From 18:00 traffic grew from about 200 to 370 request/s. Pod **doc-service-7b9c6d5f48-qm2zt** restarted 4 times (18:41, 19:12, 19:58, 20:47), every time with exit code 137 and no {{OutOfMemoryError}} anywhere in the log. The heap dashboard only ever showed heap used around 690 MB out of a maximum of 1.6 GB. The week before, with 200 threads and about 205 request/s, the pod had never restarted.

**Data collected:** {{kubectl describe pod}} and the kernel log, the JVM flags and the configuration change, Prometheus metrics from the container start at 19:58:12 until it was killed, and {{jcmd 1 VM.native_memory summary}} captured at 20:40.`,
    questions: [
      'Why was the container OOMKilled when heap used was only about 690 MB and the JVM never threw OutOfMemoryError? Build the "memory budget" of the process from the NMT snapshot at 20:40.',
      'Which NMT category grew sharply, what is it, and why does it track the Tomcat thread count instead of rising steadily over time like a leak? Evidence with numbers from the artifacts.',
      'Propose a short-term fix (tonight) and a long-term fix, a sensible JVM/container configuration, and how to prevent the same fault from only showing up after it reaches production.'
    ],
    hints: [
      'Add up the committed values of the NMT categories and compare the total with the 2Gi limit. With MaxRAMPercentage=80, how large is the heap allowed to grow (look at MaxHeapSize)? How much room is then left for everything outside the heap?',
      'Compare NMT Other with direct_used. Then compare direct_n with tc_cur at each point in time, and divide direct_u by direct_n to get the average size of one buffer. What number in the problem statement does that match?',
      'FileChannel.write receives a heap ByteBuffer. The write() syscall cannot read straight from the heap (the GC may move the array), so the JDK copies the data into a temporary direct buffer. After the write finishes, where is that temporary buffer kept, and for how long?'
    ],
    answer: `**Summary:** There is no leak. The pod was killed by the kernel because the **total process memory** (committed heap plus native memory) exceeded 2Gi. Two factors add up: (1) {{MaxRAMPercentage=80}} allows a heap of 1638 MiB, leaving only about 410 MiB for everything outside the heap; (2) every Tomcat thread holds a **temporary direct buffer the size of one PDF file** because of {{FileChannel.write(ByteBuffer.wrap(pdf))}}, so when PR #812 raised the threads from 200 to 400 and traffic went to 370 request/s, direct memory doubled to about 490–512 MB. Add the stacks of 437 threads and the non-heap part reaches about 900 MiB, double the space that was left.

### Root cause

**1. How the NIO temporary buffer works.** When you call {{FileChannel.write}} or {{SocketChannel.write}} with a heap ByteBuffer, the JDK cannot pass the address of a Java array to the {{write()}} syscall, because the GC may move that array at any moment. So the JDK (the internal class {{sun.nio.ch.Util}}) takes a **temporary direct buffer exactly as large as the number of bytes being written**, copies the data into it, writes, and then **returns the buffer to that same thread's cache** instead of freeing it. By default that cache puts no limit on buffer size (the system property {{jdk.nio.maxCachedBufferSize}} is not set). The result:
- Every thread that has ever written a PDF keeps about 1 buffer whose size equals the largest file it wrote recently (if the cached buffer is smaller than what is needed, the JDK discards it and allocates a larger one).
- Tomcat threads live forever in the pool while traffic is high, so their buffers live forever too.
- Therefore direct memory is roughly **thread count × size of a large PDF**. Double the threads and you double the direct memory.

**2. A wrong memory budget.** {{MaxRAMPercentage=80}} on a 2Gi limit gives {{MaxHeapSize=1717567488}} (1638 MiB). {{MaxDirectMemorySize}} is not set, so it defaults to the max heap value, i.e. another 1638 MiB. The JVM's own ceilings add up to far more than the container limit, so the JVM never reaches a point where it throws {{OutOfMemoryError}} itself: the cgroup kernel acts first, with SIGKILL (exit 137) - no log line, no heap dump.

### Evidence

The budget at 20:40 (NMT, committed):

| Component | Committed | Note |
|---|---|---|
| Java Heap | 1024 MiB | used is only 690 MB, but committed is what actually occupies RAM; it is still allowed to grow to 1638 MiB |
| Other (direct buffers) | **490 MiB** | {{Other (reserved=501760KB, committed=501760KB)}} |
| Metaspace + Class + Shared class space | 131 MiB | stable |
| Thread (437 threads) | 105 MiB | {{stack: reserved=447488KB, committed=104882KB}} |
| GC | 72 MiB | |
| Code cache | 60 MiB | |
| Symbol and the small categories | 40 MiB | |
| **Total** | **1968828KB ≈ 1.88 GiB** | matches {{ws 1.88 GiB}} at 20:40 |

The part outside the heap is about 900 MiB, while the heap is still allowed to grow by another 614 MiB. At 20:45 heap committed rose to 1088 MB and direct to 512 MB, working set 1.96 GiB; a few minutes later the kernel recorded {{memory: usage 2097152kB, limit 2097152kB}} and {{anon-rss:2068840kB}}.

The direct buffers follow the **thread count**, not the clock:
- {{direct_n}} is always about {{tc_cur}} plus 20: 121/104, 245/222, 328/304, 401/375, 426/400. One buffer per Tomcat thread, plus roughly 20 background buffers.
- {{direct_u / direct_n}}: 489 MB / 426 = **about 1.15 MB per buffer**, exactly the size of the 1.12 MB average PDF.
- Between 20:40 and 20:45 the thread count stood still at 400, yet direct still grew from 489 to 512 MB with the buffer count unchanged (426): threads were successively handed larger files (p99 3.8 MB) and replaced their old buffer with a bigger one. That is cache behaviour, not a leak.
- The week before, with 200 threads: {{direct_used=236 MB}}, {{working_set=1.49 GiB}}, no restart. The only thing that changed was {{threads.max}}, and direct memory doubled.
- Request latency did not change (p50 0.98 s), so the growing busy-thread count comes from traffic (Little's law: 375 request/s × about 1 s ≈ 375–400 concurrent requests), not from a slow downstream.

### Fix

**Short term (tonight):**
1. Add {{-Djdk.nio.maxCachedBufferSize=262144}}: a temporary buffer larger than 256 KB is released right after the write instead of being kept in the per-thread cache. This is an official JDK flag, no code change needed.
2. Shrink the heap: {{-XX:MaxRAMPercentage=55}} (about 1126 MiB) and set {{-XX:MaxDirectMemorySize=256m}}. If direct memory goes over that, the JVM throws {{OutOfMemoryError: Cannot reserve ... bytes of direct buffer memory}} with a stack trace, instead of the pod dying in silence.
3. Put {{threads.max}} back to 200 and scale out (add pods through the HPA) instead of cramming more threads into one 2Gi pod.

**Long term: never hand the whole file to a single write.**

~~~java
// Option 1: write in 64 KB slices, so the temporary buffer is at most 64 KB instead of the whole file
try (FileChannel ch = FileChannel.open(target, CREATE, WRITE, TRUNCATE_EXISTING)) {
    int off = 0;
    while (off < pdf.length) {
        int len = Math.min(64 * 1024, pdf.length - off);
        ByteBuffer slice = ByteBuffer.wrap(pdf, off, len);
        while (slice.hasRemaining()) {
            off += ch.write(slice);            // write can consume less than asked, so keep looping
        }
    }
}

// Option 2 (better): render straight into a stream, never hold the byte[] of the whole file on the heap
try (OutputStream out = new BufferedOutputStream(Files.newOutputStream(target), 64 * 1024)) {
    pdfRenderer.render(invoice, out);
}
~~~

Option 2 also relieves the heap: 375 request/s × 1.12 MB of {{byte[]}} is about 420 MB of garbage per second from the PDF arrays alone.

### Prevention

- **The memory budget belongs in the code review:** max heap + MaxDirectMemorySize + metaspace + code cache + GC (about 5–8% of the heap) + thread count × real stack size + 15% headroom must stay under the limit. Changing {{threads.max}}, a pool size or a batch size changes capacity, so it must come with this calculation.
- Set {{-Xms}} equal to {{-Xmx}} for critical services so the committed heap is fixed from the start; a wrong budget then shows up in the load test instead of at peak.
- Load test with the **production configuration and production traffic** (here it must reach 400 busy threads), and capture an NMT {{baseline}} plus {{summary.diff}} before and after.
- Alerts: {{container_memory_working_set_bytes / limit > 0.9}} for 5 minutes; {{jvm_buffer_memory_used_bytes}} (id="direct") above a threshold; {{kube_pod_container_status_last_terminated_reason}} with reason="OOMKilled".

> Senior tip: When NMT {{Other}} is large but your code never calls {{ByteBuffer.allocateDirect}}, think of the two "hidden" sources: the NIO temporary buffers (created anywhere a heap buffer is written into a channel, including inside libraries) and Netty's buffer pools. Quick trick: compare {{jvm_buffer_count_buffers}} (id="direct") with the thread count; if the two lines run in parallel, it is almost certainly the per-thread temporary buffer cache. I always set {{jdk.nio.maxCachedBufferSize}} (256 KB is enough) for services where many threads write files or blocking sockets.`,
    rubric: [
      'Explains that OOMKilled comes from total process memory (committed heap plus native) exceeding the 2Gi limit, not from heap used; adds up NMT to about 1.88 GiB at 20:40, matching the working set.',
      'Points out that MaxRAMPercentage=80 allows a 1638 MiB heap, leaving only about 410 MiB for non-heap; MaxDirectMemorySize defaults to the max heap, so the JVM never throws OutOfMemoryError and the kernel kills instead (exit 137).',
      'Identifies NMT Other (490 MiB) as direct buffers coming from the NIO per-thread temporary buffer cache when FileChannel.write receives a heap ByteBuffer; evidences it with direct_n tracking tc_cur and about 1.15 MB per buffer, roughly the PDF size.',
      'Connects it to PR #812 (threads.max 200 to 400) and 370 request/s: direct memory and stacks grow with the thread count; distinguishes this from a leak (the buffer count is flat while the thread count is flat).',
      'Proposes the fixes: jdk.nio.maxCachedBufferSize, slicing or streaming the write, reducing the heap and setting MaxDirectMemorySize, scaling out instead of adding threads; plus working-set/limit alerts and load testing with the production configuration.'
    ],
  },
  'lab-incident-015': {
    title: 'Every pricing-api deploy causes 3 minutes of 502/503 that then clears by itself: wrong probes, missing startupProbe and preStop',
    scenario: `**Context.** **pricing-api** (Spring Boot 3.2.5, Spring MVC, JDK 21, 8 replicas, each pod limited to 1 CPU / 1.5Gi) computes prices for shopping carts through {{POST /v1/quotes}} and accounts for about 70% of the 900 request/s that pass through ingress-nginx. At startup an {{ApplicationRunner}} loads about 1.28 million price rules from PostgreSQL into Caffeine (about 20 seconds); while that is running {{/v1/quotes}} answers 503 "price rules not loaded" so the service never quotes a wrong price. From pod creation to actually being able to serve takes about **70 seconds**.

**Symptoms.** Every deploy (including one that only changes logging) the ingress dashboard shows the 5xx rate spiking for **about 3 minutes** before returning to 0 on its own. The mobile app displays "Couldn't compute a price" and some customers abandon their carts. Most recent occurrence: **03/11/2026 14:02:00**, deploy v4.8.0. {{application-prod.yml}} configures neither {{server.shutdown}} nor the management probes.

**Data collected:** the Deployment manifest, Kubernetes events and the {{kubectl rollout status}} output, Spring Boot logs for one new pod and one old pod, ingress-nginx logs and the 5xx counts broken down per 30 seconds.`,
    questions: [
      'Classify the errors: where do the 502s and the 503s come from (the ingress or the pods), and which phase of the rollout produces each kind? Evidence with concrete log lines, IPs and timestamps.',
      'Why was pod k7x2m restarted, and why is the current probe configuration a ticking time bomb even though the rollout did finish today?',
      'How would you change the Deployment and the Spring Boot configuration so a rollout loses no requests? Explain the exact order of events when an old pod is stopped.'
    ],
    hints: [
      'Read the upstream_addr and upstream_status columns in the access log: the 502s carry an old pod IP as upstream, the 503s carry a new pod IP. Match the IPs against the pod list.',
      'Readiness is currently tcpSocket: it passes the instant Tomcat opens the port. Compare the "Tomcat started" timestamp with the timestamp where the warm-up finishes in the Spring Boot log.',
      'When a pod is deleted, removing its endpoint from the ingress and sending SIGTERM to the container happen in parallel, in no particular order. What is the default value of server.shutdown in Spring Boot 3.2? Liveness has initialDelay 30 s, period 10 s, failureThreshold 3: by which second must the pod have opened its port?'
    ],
    answer: `**Summary:** Three configuration mistakes stack up. (1) **Readiness is a tcpSocket probe**, so a new pod enters load balancing the moment Tomcat opens the port, while the {{ApplicationRunner}} still needs about 20 more seconds to load the price rules: the pod itself answers 503 for {{/v1/quotes}}, and because the Deployment believes the pod is ready it kills old pods too early, which pushes the 503 share above 50% at some points. (2) **The old pods die the instant they receive SIGTERM** (no preStop, and Spring Boot 3.2 defaults to {{server.shutdown=immediate}}) while the ingress is still sending them requests: 502. (3) **There is no startupProbe**, so liveness only gives a pod about 50 seconds to open its port; a pod that starts slowly because its CPU is throttled gets killed (k7x2m).

### Root cause

**The 503s come from the new pods.** Spring Boot only flips the readiness state to {{ACCEPTING_TRAFFIC}} **after the ApplicationRunners have finished**. But the current probe is {{tcpSocket}} and asks Spring nothing at all: Tomcat opened the port at 14:02:47 so the probe passed at 14:02:48, while the rules were only fully loaded at 14:03:08. During those 20 seconds the pod receives real traffic and answers 503.

What makes it worse: the Deployment controller counts "available" from readiness. Seeing 3 new pods Ready, it immediately scales the old ReplicaSet down from 6 to 3 (14:02:49). At that moment 3 of the 6 endpoints are still warming up, so roughly half of all quote requests come back 503. The same thing repeats at 14:03:45: the last 3 old pods are killed while 4 of the 7 new pods (batch 2 plus k7x2m) are still warming up, and the 14:03:30 window records 6,118 503s.

**The 502s come from the old pods.** When a pod is deleted, Kubernetes does **two things in parallel**: kubelet sends SIGTERM to the container, and the endpoint controller removes the pod IP from the Endpoints/EndpointSlice so that ingress-nginx updates its upstream list. The second one takes time to propagate (usually a fraction of a second up to a few seconds). Without {{preStop}}, Spring Boot 3.2 with the default immediate {{server.shutdown}} stops Tomcat straight away ({{Stopping service [Tomcat]}} at 14:02:00.208) and closes Hikari: requests in flight are cut off and new requests get their connection refused. ingress-nginx does not retry POST automatically (it is not idempotent), so the client receives the 502 directly.

**Liveness is far too tight during startup.** The first probe fires at second 30 and the kill happens after 3 consecutive failures, i.e. at second 50. A normal pod opens its port at second 44 (r8wq4) - a very narrow margin. k7x2m was throttled at 71% of its CPU quota, only finished JPA at 14:02:41 and had not opened the port by second 50, so it was killed at 14:02:53 and had to start over from scratch, stretching the rollout by about a minute.

### Evidence

- The 502s always pair with an old pod IP at the exact moment that pod is killed: {{10.42.5.18}} (2xkfp, killed 14:02:00) with {{connect() failed (111: Connection refused)}} and {{upstream prematurely closed connection}}; {{10.42.3.40}} (h4q8n, killed 14:02:49). The old pod log shows {{HikariDataSource (HikariPool-1) has been closed}} for a request still running, and the process exited less than a second after SIGTERM.
- The 503s carry {{upstream_status 503}} and a new pod IP as upstream ({{10.42.6.22}} = r8wq4 at 14:02:51), and there is not a single line with {{upstream_addr = "-"}}: the ingress always had endpoints, it is the pod that answered 503. The same pod returns 200 for {{GET /v1/products/88213/price}}: the application is up, it only lacks the rules.
- The r8wq4 log: {{Tomcat started}} at 14:02:47.240, the first 503 WARN at 14:02:49.611, {{Loaded 1284310 price rules in 21676 ms}} at 14:03:08.981. The 503 window matches the warm-up window exactly.
- The event {{Scaled down replica set pricing-api-5c7b9d6f4d to 3 from 6}} at 14:02:49, only 1 second after r8wq4 became Ready.
- k7x2m: {{Liveness probe failed ... connection refused (x3 over 20s)}} then {{Container app failed liveness probe, will be restarted}} at 14:02:53.
- The error windows match each batch: old pods killed (14:02:00, 14:02:49, 14:03:45) produce the 502s; new pods warming up (14:02:48–14:03:08, 14:03:38–14:04:04, 14:04:34–14:04:55) produce the 503s. After 14:04:55 everything is back to 0.

### Fix

~~~yaml
spec:
  strategy:
    rollingUpdate: { maxSurge: 25%, maxUnavailable: 0 }   # never shrink capacity during a rollout
  template:
    spec:
      terminationGracePeriodSeconds: 45                    # must exceed preStop 10s + shutdown 25s
      containers:
      - name: app
        lifecycle:
          preStop:
            exec: { command: ["sh", "-c", "sleep 10"] }   # wait for the ingress to drop the endpoint before the app stops
        startupProbe:
          httpGet: { path: /actuator/health/liveness, port: 8080 }
          periodSeconds: 5
          failureThreshold: 36                             # allow up to 180 s of startup
        readinessProbe:
          httpGet: { path: /actuator/health/readiness, port: 8080 }
          periodSeconds: 5
          failureThreshold: 2
        livenessProbe:
          httpGet: { path: /actuator/health/liveness, port: 8080 }
          periodSeconds: 10
          timeoutSeconds: 2
          failureThreshold: 3
~~~

~~~yaml
# application-prod.yml
server:
  shutdown: graceful                       # Spring Boot 3.2 defaults to immediate
spring:
  lifecycle:
    timeout-per-shutdown-phase: 25s
management:
  endpoint:
    health:
      probes:
        enabled: true                      # auto-enabled when running on Kubernetes, stated explicitly to be sure
~~~

The order of events for an old pod after the fix: the pod moves to Terminating and its endpoint is removed (in parallel) → preStop sleeps 10 seconds, during which the pod still serves normally whatever requests still arrive → SIGTERM → Tomcat stops accepting new requests and waits for the in-flight ones (25 seconds at most) → the context and Hikari close → the process exits, well inside the 45-second grace period. On the new pod side: readiness only goes UP once {{PriceRuleWarmup}} is done, so the 503s disappear and the Deployment no longer kills old pods too early. Liveness is not evaluated at all until the startupProbe passes.

Note: {{exec sleep}} requires an image that ships a shell; for a distroless image use the {{sleep}} action of preStop, which recent Kubernetes releases support.

### Prevention

- Standardise the probes for every Spring Boot service: startup, readiness and liveness each use their own {{/actuator/health/*}} group; liveness must **not** check the DB or any downstream (the aggregate endpoint {{/actuator/health}} includes the DB, and using it as liveness kills pods whenever the DB gets slow).
- Do the warm-up inside an ApplicationRunner (or publish {{ReadinessState.REFUSING_TRAFFIC}} yourself and switch to {{ACCEPTING_TRAFFIC}} when done) so that readiness tells the truth.
- Test the rollout in CI/staging: run continuous load while {{kubectl rollout restart}} executes, and require zero 5xx errors.
- Alert on the 5xx ratio correlated with deploy events, and cut startup time (CDS/AppCDS, selective lazy init, a higher CPU request during startup).

> Senior tip: A rollout that loses no requests needs all four of these: readiness that truly reflects the application being ready, maxUnavailable 0, a preStop sleep of a few seconds so the endpoint has time to be removed, and graceful shutdown whose grace period is larger than preStop plus the shutdown timeout. I always verify by running {{kubectl rollout restart}} while a steady load is in flight; if the dashboard still shows any 502 at all, the service is almost certainly missing preStop or graceful shutdown.`,
    rubric: [
      'Separates the 502s (the ingress sends to an old pod that has already stopped: connection refused, upstream prematurely closed, IPs 10.42.5.18 / 10.42.3.40) from the 503s (a new pod answers them itself during warm-up, upstream_status 503, IP 10.42.6.22).',
      'Shows that the tcpSocket readiness passes when Tomcat opens the port (14:02:47) while the warm-up only finishes at 14:03:08, so the Deployment treats the pod as available and scales the old pods down too early, which drives the 503 ratio up.',
      'Explains that the old pods die immediately because there is no preStop and Spring Boot 3.2 defaults server.shutdown to immediate, while removing the endpoint from the ingress runs in parallel with SIGTERM.',
      'Explains why k7x2m was killed by liveness: initialDelay 30 + 3 × 10 s ≈ 50 s, and the CPU-throttled pod had not opened its port yet; proposes a startupProbe.',
      'Gives a correct fixed configuration: readiness/liveness/startup using /actuator/health/readiness and /liveness, a preStop sleep, server.shutdown=graceful, a terminationGracePeriodSeconds large enough, maxUnavailable 0; plus how to verify it with a rollout under load.'
    ],
  },
});
