/*
 * English translation of js/data/labs-incident.js — task T686. Format: js/core/i18n.js (content overlay).
 * ids: lab-incident-016 lab-incident-017 lab-incident-018
 */
App.i18n.content({
  'lab-incident-016': {
    title: 'order-api p99 spikes to 2.9 seconds exactly every 10 minutes: the export job runs in the same pod as the API',
    scenario: `**Context.** **order-api** (Spring Boot 3.3, Spring Data JPA / Hibernate 6, JDK 21.0.5) serves the order API for the mobile app, 2 replicas, each pod 4 CPU with a 4Gi limit. JVM: {{-Xms3g -Xmx3g -XX:+UseG1GC -Xlog:gc*:file=/logs/gc.log:time,uptime,level,tags}}. SLO: p99 of {{GET /api/orders/:id}} under 300 ms. Traffic is about 1,100 request/s split evenly across the two pods.

Three weeks ago the team added **the reconciliation job for the logistics partner LogiX** directly inside order-api: {{@Scheduled(cron = "0 */10 * * * *")}} — every 10 minutes it exports the orders that changed into a CSV file on S3, then calls a webhook to tell the partner. The code got a quick review because "it is only a small job".

**Symptoms.** The p99 alert fires exactly at minutes :00, :10, :20…, each time for about 5–10 seconds, on both pods at the same moment. Outside that window p99 is about 85 ms. This week LogiX complained about receiving **each file twice** and about files that were "overwritten mid-read". Before the job existed, this alert had never fired.

**Data collected:** the GC log of pod {{order-api-5d8f7c9b6-hx2rm}} around 10:20 (plus a slice of pod {{pt4zq}}), Prometheus metrics, the application logs of both pods, and the code of the job.`,
    questions: [
      'Explain the sequence of events in the GC log of hx2rm from 10:20:00 to 10:20:15: why does "G1 Humongous Allocation" appear, then "(Evacuation Failure)", and finally a Pause Full? Quote specific lines and compute how much memory the job holds on the heap.',
      'Why do both replicas spike at the same moment, and why does that make the load balancer useless for p99? Beyond GC, what business-level bugs does the current job design cause for LogiX?',
      'As the lead, what fixes would you propose at code level, at architecture level (workload isolation), and operationally? Why are a bigger heap or a different GC not the real answer?'
    ],
    hints: [
      'Heap Region Size is 1M, so any array of 512 KB or more is a humongous object and needs consecutive regions. A StringBuilder holding 176 MB — how many doublings does its internal array go through, and how large is the last one?',
      'Count the copies of the data that are alive on the heap at the same time: the entity List, the StringBuilder array, the String from toString(), the byte[] from getBytes(), and the copy inside RequestBody.fromBytes. Until when is the variable orders still referenced?',
      'Compare the "export start" log lines of the two pods and the S3 key name. Where does @Scheduled run when there are 2 replicas? Where does lastExportAt live, and what happens when a pod restarts?'
    ],
    answer: `**Summary:** Every 10 minutes the export job runs **on both replicas at the same moment** and loads all 418,260 entities plus several copies of a 176 MB CSV file onto a 3 GB heap. Allocation jumps from about 190 MB/s to 1.74 GB/s, the humongous arrays occupy hundreds of consecutive regions, G1 runs out of room to evacuate ({{(Evacuation Failure)}}) and has to run a {{Pause Full (G1 Compaction Pause)}} of 2.3 seconds. Because both pods stop at the same time, no healthy replica is left to take the traffic, so p99 for the whole service goes to 2.9 seconds. The same design also sends duplicate files to LogiX and loses/duplicates data when a pod restarts.

### Root cause

**1. The job keeps the whole data set on the heap, several copies at once.** Estimate at the peak (around 10:20:06):

| What is alive | Size | Note |
|---|---|---|
| {{List<Order>}} of 418,260 entities | about 700 MB | the variable {{orders}} stays in scope until the method ends, including during the upload |
| The internal array of StringBuilder | about 268 MB | doublings 1, 2, 4, …, 134, 268 MB; the old arrays become humongous garbage |
| The String from {{toString()}} | 176 MB | garbage right after {{getBytes}} |
| {{byte[] csv}} | 176 MB | lives until the upload finishes |
| The copy inside {{RequestBody.fromBytes}} | 176 MB | the SDK copies the input array |

With 1 MB regions ({{Heap Region Size: 1M}}), every array of 512 KB is a **humongous object**: it is not allocated in eden but gets a run of **consecutive** regions straight in old. A 268 MB array needs 268 contiguous regions. The 3 GB heap already carries about 640 MB of permanently live data, so contiguous free space runs out very fast.

**2. The GC sequence.**
- {{GC(1407)}} pauses 61 ms instead of 14 ms, and the heap after GC rises from 641M to 1108M: the entities being loaded survive and get copied.
- {{GC(1408) Pause Young (Concurrent Start) (G1 Humongous Allocation)}}: allocating a humongous array crosses the IHOP threshold, so G1 starts a concurrent mark. {{Humongous regions: 389->134}}: the dead old StringBuilder arrays were reclaimed early (eager reclaim), the current 134 MB array is still live.
- {{GC(1412) ... (Evacuation Failure) 3034M->2854M}}: 560 eden regions and 96 survivor regions need somewhere to copy the live objects, but the heap is nearly full; G1 has to leave the objects it cannot copy where they are ({{Old regions: 1758->2410}}), pause 392 ms. On JDK 17 and earlier the same condition was logged as {{To-space exhausted}}.
- The following request for 176 consecutive MB for the SDK copy still finds no room, so G1 runs {{Pause Full (G1 Compaction Pause) 2854M->1931M}} in **2318 ms**, stopping the entire application. The heap after the Full GC is still 1931M because the entities and the arrays are still referenced.
- When the job finishes (10:20:11), {{GC(1415)}} reclaims all humongous regions ({{Humongous regions: 620->0}}); the entities that already moved to old have to wait for mixed GC, and the heap only comes back to 648M at 10:21:20.

**3. It runs on every replica at once.** {{@Scheduled}} runs inside each JVM: N replicas means N runs, and the same cron means the same second. Pod pt4zq has {{Pause Full ... 2251.733ms}} at the same 10:20:06–10:20:08 window. A load balancer only helps while some replica is healthy; here both stop at once, requests queue up, and p99 for the whole service is 2,870 ms.

### Evidence

- The timing matches exactly: {{export start}} at 10:20:00.004 (hx2rm) and 10:20:00.002 (pt4zq); alloc {{1.74 GB/s}} and {{pause 3.034 s}} in the 10:20:00 window; p99 spikes at every :00, :10, :20, :30 mark.
- {{csv built size=176553812 bytes}} matches the 176 MB humongous arrays; {{loaded 418260 orders}} matches the Old regions growth in GC(1407)–GC(1408).
- Total STW on hx2rm: 61 + 49 + 71 + 11 + 89 + 393 + 2318 + 42 ≈ 3,034 ms, matching {{pause 3.034 s}} in the 15-second window starting at 10:20:00. The single Full GC alone accounts for 2.3 seconds.
- Pod CPU goes to 3.9/4 cores during the export window: the 4 Parallel Workers of the GC take all the CPU, so requests get none.
- The business bug: both pods upload **the same key** {{partner-logix/2026-11-02T10:20.csv}} and both call {{notifyNewFile}}: LogiX gets 2 notifications, and if they read the file while the second upload is overwriting it, they may get a partially replaced version. {{lastExportAt}} lives in memory: on a pod restart it is reinitialised to {{Instant.now()}}, so the orders of the previous window are lost forever. The watermark is also taken **after** the upload: {{window_from=2026-11-02T03:10:11.204Z}} is 10:10:11, not 10:10:00, so orders updated during the 11 seconds the export was running are missed permanently; and the two pods even have two different watermarks (.204Z and .951Z).

### Fix

**Code: streaming, never hold the whole file on the heap.**

~~~java
@Transactional(readOnly = true)    // PostgreSQL only streams according to the fetch size while inside a transaction
public Path writeCsv(Instant from, Instant to) throws IOException {
    Path tmp = Files.createTempFile("settlement-", ".csv");
    try (BufferedWriter w = Files.newBufferedWriter(tmp, StandardCharsets.UTF_8);
         Stream<OrderCsvRow> rows = orderRepository.streamRows(from, to)) {   // DTO projection, fetch size 1000
        rows.forEach(r -> {
            try { w.write(r.toCsvLine()); w.newLine(); }
            catch (IOException e) { throw new UncheckedIOException(e); }
        });
    }
    return tmp;   // then: s3.putObject(req, RequestBody.fromFile(tmp)) and delete the temp file
}
~~~

The repository uses an {{@Query}} returning a projection (not an entity, so nothing enters the persistence context) together with the {{org.hibernate.fetchSize}} hint. The memory footprint of the job drops from about 1.5 GB to a few MB. For even larger files, use a multipart upload.

**Architecture: isolate the workload.** Move the export out of the pod that serves the API: a Kubernetes {{CronJob}} ({{schedule: "*/10 * * * *"}}, {{concurrencyPolicy: Forbid}}) or a separate worker deployment with its own resources and its own JVM, reading from a read replica. If it absolutely must stay in the app, use a distributed lock (for example ShedLock on the DB) so that only one instance runs — but that pod still carries the load: full isolation remains the right choice.

**Getting the business logic right:** store the watermark ({{last_exported_to}}) in the DB, export the window {{(from, to]}} on each run with {{to}} fixed **before** the query; derive the S3 key from the window, and only write the watermark and call the webhook after the upload completes. Then a rerun is idempotent: the same window always produces the same file.

**Why this is not GC tuning.** A bigger heap only moves the breaking point: the data grows with the order count, so next month it breaks again. Raising {{G1HeapRegionSize}} to 32 MB still leaves a 176 MB array humongous. Generational ZGC ({{-XX:+UseZGC -XX:+ZGenerational}} on JDK 21) shortens pauses, but 1.74 GB/s of allocation still eats CPU and can cause allocation stalls. The root of the problem is **the memory design of the job and running it in the same pod as the API**, not the GC.

### Prevention

- Review rule: a batch job must not {{findAll}}/{{List}} an entire data set and must not build a whole file in memory; every {{@Scheduled}} in a multi-replica service has to answer "where does it run, how many times, is it idempotent".
- Alert on {{jvm_gc_pause_seconds_max}} with cause "G1 Compaction Pause" (any Full GC is an incident), and on sudden jumps in allocation rate.
- Load test with the background job running in parallel with real traffic, not the API alone.

> Senior tip: When latency spikes on a regular cycle (every 10 minutes, every hour), look for **whatever runs on a schedule** before you read the GC log: cron, @Scheduled, a cache whose TTLs all expire at once, a backup. Line up the job log timestamps with the first abnormal GC line and you have the culprit in 5 minutes. As a lead, I treat "a batch workload sharing a pod with an API that has an SLO" as an architectural anti-pattern: it always produces exactly this kind of incident, only a matter of when.`,
    rubric: [
      'Explains humongous objects with 1M regions (arrays from 512 KB, needing consecutive regions) and the sequence GC(1408) Humongous Allocation, GC(1412) Evacuation Failure, GC(1413) Pause Full 2318 ms, with log lines quoted.',
      'Estimates the memory the job holds: 418,260 entities, the doubling StringBuilder arrays, the String, the byte[] csv and the SDK copy (more than 1 GB in total) on a 3 GB heap that already carries about 640 MB of live data; ties it to the 1.74 GB/s allocation.',
      'Points out that @Scheduled runs on both replicas in the same second so both pods pause together and the load balancer cannot save p99; it also causes duplicate key uploads and duplicate webhooks for LogiX.',
      'Finds the watermark bugs: lastExportAt in memory (lost on restart, one value per pod) and Instant.now() taken after the upload so orders are missed; proposes a DB watermark, the (from, to] window and an idempotent key.',
      'Proposes the fixes: streaming (projection, fetch size, temp file, RequestBody.fromFile or multipart) and workload isolation (Kubernetes CronJob/separate worker, concurrencyPolicy Forbid or ShedLock); explains why a bigger heap, a different region size or a different GC only treats the symptoms.'
    ],
  },
  'lab-incident-017': {
    title: 'A rolling update drops requests with 502: missing preStop and a readiness probe that is not right',
    scenario: `**Context:** the **ShopVN** marketplace deploys **checkout-service** (which handles payments) on **Kubernetes** — the platform that automatically deploys, scales and manages **containers** (a packaged environment holding the application plus everything it needs to run) across many machines. Containers run inside a **pod** (the smallest unit in Kubernetes, usually one container). A **Deployment** manages how many copies of the pod exist and how they are updated: when a new version appears, Kubernetes does a **rolling update** — create a new pod, wait until the new pod is ready, then stop the old pods one at a time, so the service is never fully down.

**Symptoms:** on **23/10/2026 at 15:00**, ShopVN deployed a new version of checkout-service. During the rolling update customers received bursts of **502 Bad Gateway** errors for about 2–3 minutes. 502 is an HTTP code meaning "the intermediary (a gateway, e.g. ingress/nginx) did not get a valid response from the server behind it" — here a checkout pod that had already been shut down or was not yet ready to accept connections. In total about **1,840 requests** failed with 502. Old pods in **Terminating** state (shutting down) still received requests; new pods received traffic before they were ready.

**Data collected:** the Deployment manifest of checkout-service (see the deployment.yaml artifact).`,
    questions: [
      'Why do customers still receive 502s from the old pod that is shutting down, and from the new pod that is not ready yet, during a rolling update?',
      'Redesign the readiness probe, startup probe, preStop and graceful shutdown so that a deployment drops no requests.'
    ],
    hints: [
      'The readiness probe decides whether a pod is put on the list of things that receive traffic (the Endpoints object). A probe that is too early, or that checks the wrong endpoint, marks the pod ready before Tomcat is actually listening on port 8080.',
      'When a pod is deleted, Kubernetes sends SIGTERM (a polite shutdown request), waits terminationGracePeriodSeconds, and only then sends SIGKILL (which forces an immediate stop). Without a preStop (a command run before the shutdown signal, e.g. a sleep that lets in-flight requests finish), the ingress can pour requests into the pod at the very moment it starts shutting down.'
    ],
    answer: `**Summary:** The 502s in this deployment come from two causes at once: (1) the readiness probe is too early (initialDelaySeconds 5) and checks {{/actuator/health}}, which only reports that the application context loaded — not that Tomcat is listening on port 8080 — so new pods were put into the traffic pool before they were really ready; (2) the old pods were shut down with no preStop and a short 30-second grace period, so the ingress kept sending requests to pods in Terminating state and cut requests that were mid-flight. Result: customers got a flood of 502 Bad Gateway for 2–3 minutes, about 1,840 requests.

### Concepts to know first
- **Pod:** the smallest unit in Kubernetes, holding one or more containers that share an IP address and storage.
- **Container:** a packaged environment holding the application with its libraries and configuration, running independently of the host operating system.
- **Deployment:** manages the copies (replicas) of a pod and rolls out new versions one at a time (rolling update) instead of taking the whole service down at once.
- **Ingress:** the component that acts like a "front door", taking requests from the internet and routing them to the right pod (here an nginx ingress, playing the gateway role).
- **Readiness probe:** a periodic check of whether a pod is ready to serve traffic. When the probe succeeds, kubelet marks the pod Ready and the endpoint controller adds the pod to the Endpoints list — only then does the ingress start sending requests to it.
- **PreStop:** a hook that runs inside the container before Kubernetes sends the shutdown signal, used to wait for in-flight requests to finish.
- **SIGTERM / SIGKILL:** Linux signals asking a program to shut down politely (SIGTERM) and forcing an immediate stop with no chance to clean up (SIGKILL).
- **Graceful shutdown:** shutting down politely — stop accepting new connections but finish the ones already in progress before exiting completely (in Spring Boot configured with {{server.shutdown=graceful}}).
- **TerminationGracePeriodSeconds:** the maximum time Kubernetes waits for a pod to shut down itself after SIGTERM before firing SIGKILL.

### Root cause

**1. The readiness probe passes too early and checks the wrong thing.** initialDelaySeconds 5 means Kubernetes starts probing 5 seconds after the container starts, which may not be enough for Spring Boot to finish loading its context and for Tomcat to open port 8080. Worse, the probe only checks {{/actuator/health}}: that endpoint returns UP once the application context is loaded, but that does not guarantee Tomcat is ready to accept connections. As soon as the first round of probes succeeds, kubelet marks the pod Ready, the Kubernetes endpoint controller updates the Endpoints list, and the ingress starts pouring requests into the pod immediately — while Tomcat is still starting or not listening yet → requests are dropped, and the client sees 502.

**2. No preStop when the old pod is stopped.** Kubernetes deletes a pod in this order: it stamps a deletion time, the pod enters Terminating, the endpoint controller gradually propagates the change to the nodes (which takes a few seconds), and only then SIGTERM is delivered to the container. If the container has no preStop, it gets no time to wait for in-flight requests to finish; combined with graceful shutdown not being enabled, requests are cut off mid-processing and customers see 502.

**3. The grace period is too short.** terminationGracePeriodSeconds = 30 seconds, while a payment request can take 10–30 seconds to complete. When the 30 seconds are up, Kubernetes fires SIGKILL and cuts every request still alive.

### Fix

- **Readiness probe:** change the path to {{/actuator/health/readiness}} (the readiness endpoint of Spring Boot Actuator 3.x — it only returns READY after the ApplicationReadyEvent has been handled, meaning the application is genuinely ready to serve traffic), and set {{initialDelaySeconds: 15}}, {{periodSeconds: 5}}, {{failureThreshold: 3}}. Make sure {{management.endpoints.web.exposure.include}} contains {{health}} and that {{management.endpoint.health.probes.enabled: true}} is set (it defaults to true).
- **Startup probe:** add a {{startupProbe}} on the path {{/actuator/health}} with {{failureThreshold: 30}} (one check every 10 seconds, 300 seconds at most) so Kubernetes does not run the readiness/liveness probes while the application is still starting.
- **PreStop hook:** add a {{lifecycle.preStop}} that runs {{sleep 10}} (or calls an internal shutdown endpoint) before SIGTERM is delivered, giving the ingress and the endpoint controller time to update, and giving in-flight requests time to finish.
- **Grace period:** raise {{terminationGracePeriodSeconds}} to 60 seconds (or more, based on the p99 business request processing time).
- **Spring Boot:** enable {{server.shutdown=graceful}} in {{application.yml}}, so Tomcat stops accepting new connections but finishes the existing ones before stopping.

How to verify after the fix: deploy again, watch that a new pod does not enter the Endpoints list before {{/actuator/health/readiness}} returns 200, and confirm that a rolling update produces zero 502 requests ({{kubectl get pods --watch}}, the ingress access log).

> Senior tip: Every deployment that drops 502s is ninety percent of the time a probe and pod-lifecycle problem. A preStop sleep of 5–10 seconds is the cheapest and most effective fix there is. Always put the readiness probe on an endpoint that reflects "ready to serve traffic", not just "the application started", and track the p99 request processing time so the grace period is long enough instead of picking a round number like 30 seconds.`,
    rubric: [
      'Recognises that the readiness probe is too early and that checking {{/actuator/health}} does not reflect Tomcat being ready to listen, so new pods receive traffic too soon.',
      'Explains the Kubernetes pod shutdown sequence: Terminating → endpoint controller updates Endpoints → SIGTERM → wait terminationGracePeriodSeconds → SIGKILL, and the role of preStop.',
      'Proposes the correct fixes: readiness on {{/actuator/health/readiness}}, a startupProbe, a preStop sleep, a 60s grace period, {{server.shutdown=graceful}}.'
    ],
  },
  'lab-incident-018': {
    title: 'HPA keeps scaling out but p99 climbs: a 500m CPU limit makes the JVM get CFS throttled',
    scenario: `**Context:** ShopVN runs **search-service** on Kubernetes. Kubernetes (often shortened to K8s) is a system that runs and manages containers (packaged applications) across a cluster of machines. Each pod (the smallest deployable unit in Kubernetes, usually wrapping one container) is given a **CPU request** of 250m (0.25 of a CPU core — the amount of CPU Kubernetes promises to reserve for that pod, and the number the scheduler and autoscaler use for their calculations) and a **CPU limit** of 500m (0.5 of a CPU core — a hard ceiling enforced by the Linux kernel; the pod is not allowed to use more than this). **HPA (Horizontal Pod Autoscaler)** is a Kubernetes controller that automatically changes the number of pod replicas based on a metric; here the target is 70% CPU utilization, measured as actual CPU usage divided by the CPU request.

**Symptoms:** on **24/10/2026**, starting at 10:00, traffic increased. The HPA scaled out continuously from 2 pods to 10 pods within 15 minutes, but p99 latency (the response time of the slowest 1% of requests — a common "tail latency" metric; if p99 is 1.8 s, 99% of requests are faster than 1.8 s and 1% are slower) rose from 120 ms to 1.8 s. Each pod's actual CPU usage was only about 300m, which is below the 500m limit, yet the **throttled ratio** (the fraction of CPU scheduling periods where the container was held back because it hit its quota) was very high.

**Data collected:** the {{kubectl top pod}} output (a command that shows current CPU/memory usage per pod) and the HPA status (see the kubectl-top.txt artifact).`,
    questions: [
      'Why does the HPA keep scaling out from 2 to 10 pods while p99 latency goes up instead of down?',
      'Explain CFS quota and CFS throttling, and describe how they affect a JVM (Java 17, the Java runtime that executes Java programs) running inside a container.'
    ],
    hints: [
      'The HPA compares CPU usage to the **request** (250m), not the limit: 320m / 250m = 128%, which is above the 70% target, so the controller keeps adding pods.',
      'A 500m CPU limit means a CFS quota of 50 ms for every 100 ms period. When the JVM bursts (for example during garbage collection or JIT compilation) and uses more than 50 ms inside one period, the kernel throttles it (pauses it) until that period ends — and those pauses show up as higher p99.'
    ],
    answer: `**Summary:** The HPA keeps scaling out because it calculates {{utilization = usage / request}} (320m / 250m = 128%, which is above the 70% target). It never compares usage against the CPU limit. At the same time, the 500m CPU limit causes the Linux kernel to enforce a CFS quota of 50 milliseconds in every 100-millisecond period. When the JVM has a short burst of CPU work (garbage collection — the JVM process that reclaims memory from objects no longer used — or JIT compilation — the Just-In-Time compiler that turns Java bytecode into fast native machine code while the program runs), it can exceed 50 ms within a single period and gets throttled: the kernel parks the container until the next period begins. Because JDK 17 is container-aware, it detects that the container effectively has 0.5 CPU and reports {{availableProcessors()}} = 1, so the garbage collector and JIT compiler run with only 1 thread. That makes GC pauses longer (about 40 ms every 1.3 s in this case) and pushes p99 latency from 120 ms to 1.8 s. Adding more pods does not fix it, because every pod hits the same CPU ceiling and serves requests slowly.

### Concepts to know first
- **Pod / container:** A pod is the smallest deployable unit in Kubernetes; it usually runs one container. A container is a packaged application environment isolated by the Linux kernel, and the kernel can cap how much CPU and memory it may use.
- **CPU request (250m):** The amount of CPU Kubernetes reserves for the pod. "250m" means 250 millicores = 0.25 of one CPU core. The scheduler uses requests to decide where to place pods, and the HPA uses requests to compute utilization ({{usage / request}}).
- **CPU limit (500m):** A hard ceiling on how much CPU the container may consume. 500m = 0.5 core. If the container tries to use more CPU time than its quota allows within a scheduling period, the kernel throttles it.
- **HPA (Horizontal Pod Autoscaler):** A controller that watches a metric (here, average CPU utilization across pods) and automatically increases or decreases the replica count so the metric stays near the target.
- **CFS (Completely Fair Scheduler):** The default Linux CPU scheduler. It tries to share CPU time fairly among runnable tasks. For containers, Linux uses cgroups (control groups — a kernel feature that limits and accounts for resources per group of processes) together with CFS to enforce CPU limits via a **quota** and a **period**.
- **CFS quota and CFS period:** The period is the time window (100 ms by default). The quota is the maximum CPU time the container may use within that window. A 500m limit means quota = 50 ms per 100 ms period (0.5 core × 100 ms).
- **CFS throttling:** When a container uses up its quota before the period ends, the kernel puts it to sleep until the next period starts. Frequent throttling makes the application "stutter" — requests pause unpredictably — which directly increases tail latency (p95/p99).
- **JVM container-aware behavior:** Since JDK 10 (and refined in later versions including JDK 17), the JVM reads cgroup limits and sizes itself for the container instead of the whole host machine. It derives the heap size, the number of GC threads, and the JIT compiler threads from what the container is allowed to use.
- **{{availableProcessors()}}:** A Java method that returns how many processors the JVM thinks it can use. With a 500m CPU limit on a multi-core node, JDK 17 typically reports 1. That can reduce parallelism inside the JVM (fewer GC/JIT threads).
- **KEDA (Kubernetes-based Event Driven Autoscaling):** A project that lets you scale pods based on external or custom metrics (requests per second, queue lag, latency) instead of only CPU or memory.

### Root cause, step by step

**1. The HPA scales on {{usage / request}}, not on the limit, so it keeps adding pods.** In the artifact, a pod uses about 320m CPU with a 250m request. The HPA computes 320m / 250m = 128%, which exceeds the 70% target, so it requests more replicas (2 → 10 in 15 minutes). More pods spread incoming traffic across more replicas, but they do not remove the 500m CPU cap on each pod. Every pod still runs under the same throttling condition.

**2. The 500m limit creates CFS throttling.** A 500m limit translates to a CFS quota of 50 ms per 100 ms period. That means in every 100 ms window the container can run for at most 50 ms total across its threads. The JVM does not use CPU smoothly: it has bursts. For example, a GC cycle or a JIT compilation spike can easily consume more than 50 ms of CPU time inside one period. When that happens, the kernel throttles the container for the rest of the period. The artifact reports a throttled ratio of ~0.9 (about 90%), meaning the pods were held back in most periods. This explains why {{kubectl top}} shows an average of ~320m (below the 500m limit) while latency is terrible: the average hides the stop-and-go pattern that hurts tail latency.

**3. The JVM effectively runs as a 1-CPU runtime.** JDK 17 is container-aware and derives parallelism from CPU limits. With 0.5 CPU, {{availableProcessors()}} commonly returns 1. As a result, the GC and JIT compiler have only a single thread to work with. In this incident that shows up as GC pauses of ~40 ms every ~1.3 s, and slower warm-up/steady-state performance after compilation — together pushing p99 from 120 ms to 1.8 s. Adding pods increases total capacity in theory, but each individual request still suffers the same throttling and reduced parallelism, so tail latency stays bad (or gets worse under load).

### How to fix it

- **Right-size CPU requests and limits (short term):** Set {{requests.cpu}} close to observed steady usage (for example 300m) and raise {{limits.cpu}} (for example 1000m) or remove the CPU limit if your cluster policy allows. A common production pattern for latency-sensitive Java services is to set **request = limit** so the pod gets the **Guaranteed** QoS (Quality of Service) class in Kubernetes — that avoids CPU being reclaimed unpredictably and, combined with a sufficiently high limit, prevents CFS throttling from normal JVM bursts. Do not pick numbers blindly; base them on real profiles (CPU, GC, p99) under load.
- **Scale on a user-facing metric (medium term):** CPU utilization is a poor signal when throttling distorts behavior. Consider autoscaling on RPS (requests per second) or on p95/p99 latency using **KEDA** or the Prometheus Adapter, with targets that reflect real SLOs (service-level objectives — measurable reliability goals, e.g. "p99 < 300 ms").
- **Tune the JVM for containers:** Keep {{-XX:+UseContainerSupport}} enabled (default on JDK 17). Set {{-XX:MaxRAMPercentage}} (for example 75.0) so heap sizing matches the container memory limit. If the runtime mis-detects parallelism, you can set {{-XX:ActiveProcessorCount}} explicitly to control GC/JIT thread counts — but treat this as a deliberate override and validate it with load tests.
- **Add observability and alerts:** Monitor {{container_cpu_cfs_throttled_periods_total}} and {{container_cpu_cfs_throttled_seconds_total}} (exposed by cAdvisor / kubelet metrics). Alert when the throttled ratio rises or when p99 breaches its SLO while the HPA is scaling out — that combination is a strong signal of a CPU limit/throttling problem, not a lack of replicas.

### How to explain it in an interview
"In that incident the HPA scaled out because it computes utilization as CPU usage divided by the request — 320m over a 250m request is about 128%, above the 70% target — so it never looks at the 500m limit. The real problem was the 500m CPU limit: in Linux that becomes a CFS quota of 50 ms per 100 ms period. A JVM has bursty CPU usage from GC and JIT compilation, so it can burn through 50 ms quickly, get throttled for the rest of the period, and repeat. The throttled ratio was around 90%, which explains why average CPU looked fine but p99 jumped from 120 ms to 1.8 s. On top of that, JDK 17 is container-aware and with a 0.5 CPU limit it effectively reports 1 available processor, so GC and JIT run with very little parallelism and GC pauses get longer. Adding pods didn't help because every pod was throttled the same way. I would fix it by right-sizing CPU request/limit (often request equals limit for latency-sensitive Java, with a high enough limit to absorb bursts), scale on latency or RPS via KEDA instead of raw CPU, keep container-aware JVM flags sensible, and alert on CFS throttled metrics so we catch this early."

> Senior tip: When the HPA keeps adding pods but tail latency does not improve (or gets worse), check {{container_cpu_cfs_throttled_periods_total}} and {{container_cpu_cfs_throttled_seconds_total}} first — a low CPU limit causing CFS throttling is one of the most common root causes for Java services on Kubernetes. A practical rule: give latency-sensitive JVM workloads enough CPU headroom for GC/JIT bursts (often request = limit with a limit sized from profiling), and never assume "average CPU below the limit" means the container is healthy — throttling is about bursts, not averages.`,
    rubric: [
      'Explains that the HPA computes utilization as usage/request (320m/250m = 128% > 70%) and therefore keeps scaling out, independent of the CPU limit and not because more replicas solve the latency problem.',
      'Explains how a 500m limit maps to CFS quota (50 ms) per period (100 ms) and how JVM bursts (GC/JIT) cause throttling even when average usage (~320m) stays below the limit, driving up p99.',
      'Explains container-aware JVM behavior: {{availableProcessors()}} effectively becomes 1 under a 0.5 CPU limit, reducing GC/JIT parallelism (longer GC pauses) and worsening latency; adding pods does not remove per-pod throttling.',
      'Proposes concrete fixes: adjust CPU request/limit (often request = limit / Guaranteed QoS with burst headroom), autoscale on latency or RPS (e.g. KEDA/Prometheus Adapter), use container-aware JVM settings appropriately, and monitor/alert on CFS throttled metrics.'
    ],
  },
});
