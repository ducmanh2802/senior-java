App.i18n.content({
  'scenario-062': {
    q: 'Each rolling deployment of the payment service (10 pods) causes about 200–400 502/503 errors and several "connection reset" errors over 1–2 minutes, despite readiness probes being configured. How do you find the root cause and achieve a "zero-downtime" deployment?',
    a: `**Summary:** When a pod is deleted, Kubernetes **in parallel** sends a SIGTERM to the container AND removes the pod from the endpoint list; ingress/kube-proxy take a few seconds to update, so traffic still flows into a JVM that is shutting down during that time. Fix this with three layers: **preStop sleep** for a few seconds to wait for endpoint removal, **graceful shutdown** in Spring Boot to finish in-flight requests, and a {{terminationGracePeriodSeconds}} longer than the sum of both phases; plus {{maxUnavailable: 0}} and proper readiness checks for new pods.

### Understanding the issue
Think of it like a cashier closing their register: the manager **turns off the register light** (SIGTERM) AND **notifies security** not to direct customers to this register (remove endpoint). However, the notification takes a few seconds to propagate, so security still directs customers to the register that is turning off. The correct approach: notify first, **wait a few seconds** for security to receive the update, then finish serving existing customers and close the register.

### Terminology
- **EndpointSlice**: The list of pod IPs behind a Service; kube-proxy and ingress controllers read this list.
- **preStop hook**: A command that runs **before** the container receives SIGTERM.
- **Graceful shutdown**: Stop accepting new requests, wait for in-flight requests to complete, then shut down.
- **terminationGracePeriodSeconds**: The maximum total time (default 30s) from the start of shutdown until kubelet sends SIGKILL.

### Symptoms and Metrics
- Errors only appear during the deployment window; ingress access logs show 502s with "upstream prematurely closed connection" and "connect() failed (111: Connection refused)" to old pod IPs.
- Old pods: "Graceful shutdown" log does not appear; the process exits in under 1 second after SIGTERM.
- Some payment requests take 8–15 seconds (calling banks) and are cut off in the middle.

### Hypotheses and Verification
1. **Race between SIGTERM and endpoint removal.** Log the timestamp when SIGTERM is received (shutdown hook) and compare it with the time the IP disappears from {{kubectl get endpointslices -l kubernetes.io/service-name=payment -w}}; the ingress continues sending requests to the old IP for 2–5 seconds after SIGTERM.
2. **App exits immediately without waiting for in-flight requests.** Check {{server.shutdown}}: Spring Boot 3.4+ defaults to graceful; older versions default to immediate.
3. **Grace period too short.** Request 15 seconds + endpoint wait, but {{terminationGracePeriodSeconds}} is 30, it might be SIGKILLed (exit 137).
4. **New pod receives traffic too early.** Readiness returns UP before warm-up completes; first requests timeout.

### Step-by-step mechanism when a pod is deleted
~~~text
API server marks pod as Terminating
   ├─► (A) kubelet: runs preStop -> sends SIGTERM -> waits -> SIGKILL when grace ends
   └─► (B) EndpointSlice controller removes IP -> kube-proxy / ingress updates (takes seconds)
(A) and (B) run IN PARALLEL, no guaranteed order
~~~
Without a preStop, (A) usually finishes before (B): the JVM has closed ports while the ingress still has the old IP, causing connection refused/502.

### Configuration Fix
~~~yaml
spec:
  terminationGracePeriodSeconds: 60   # > preStop (10) + shutdown timeout (40)
  containers:
  - name: payment
    lifecycle:
      preStop:
        sleep: { seconds: 10 }        # K8s 1.30+; older: exec ["sh","-c","sleep 10"]
    readinessProbe:
      httpGet: { path: /actuator/health/readiness, port: 8080 }
---
# Deployment strategy
strategy:
  rollingUpdate: { maxUnavailable: 0, maxSurge: 2 }
~~~
~~~yaml
# application.yml
server:
  shutdown: graceful                  # stops new requests, waits for in-flight
spring:
  lifecycle:
    timeout-per-shutdown-phase: 40s   # default 30s
~~~
When shutting down, Spring Boot also sets readiness to not accept traffic; however, **do not rely solely on this** because readiness also needs several probe cycles to take effect.

### Other things to shut down cleanly
- Kafka consumer: container listener stops and commits offset during shutdown; handle idempotency to tolerate re-delivery.
- Scheduled tasks {{@Scheduled}} and async executors: configure to await completion ({{spring.task.execution.shutdown.await-termination=true}}).
- Keep-alive connections from ingress: graceful shutdown in Tomcat returns errors for new requests on old connections, so preStop sleep remains the primary layer.

### Prevention
- Test: run k6/Gatling at 200 RPS continuously while {{kubectl rollout restart deployment/payment}}, require 0 5xx errors.
- PodDisruptionBudget to ensure node drain does not kick too many pods at once.
- Measure deployment as an SLO: "number of 5xx errors during deployment window".

### Common Pitfalls
1. **preStop sleep longer than grace period**: kubelet SIGKILLs mid-process, all in-flight requests die.
2. **Distroless image lacks sleep command** but still uses exec sleep: hook fails; use native sleep action (K8s 1.30+) or custom endpoint.
3. **Only configuring {{server.shutdown=graceful}}** but forgetting preStop: still drop requests due to endpoint race.

### 1-minute Interview Answer
"The cause is a race: when a pod is deleted, Kubernetes sends a SIGTERM and removes the endpoint in parallel. The ingress takes a few seconds to update, so it continues sending traffic to the JVM that is shutting down. I verify this by comparing the SIGTERM log with the time the IP leaves the EndpointSlice and the ingress 502 access logs. I fix this by adding a 10-second preStop sleep, configuring graceful shutdown with a 40-second timeout, setting the grace period to 60 seconds, using maxUnavailable: 0, and ensuring readiness only turns UP after warm-up. Finally, I run load tests during rollout restart to prove zero errors."

> Senior tip: the grace period must be calculated based on the **longest request you accept to complete**, not just a guess. For a service calling banks where p99.9 is 15 seconds, I set a 40-second shutdown timeout and a 60-second grace period; after the change, 5xx errors per deployment dropped from hundreds to zero, and the team feels confident deploying during business hours.`
    ,
    follow: [
      'Why is preStop still needed when readiness probe exists?',
      'How to handle rolling deployment with Kafka consumers causing constant rebalancing?',
      'How does PodDisruptionBudget help when a node is drained?'
    ]
  },
  'scenario-063': {
    q: 'The catalog service HPA fluctuates constantly: replica count jumps 4 → 12 → 4 → 12 every 6–7 minutes, even when traffic is nearly flat. Each time it scales up, latency increases. How do you analyze and stabilize it?',
    a: `**Summary:** HPA calculates {{desired = ceil(current × currentUtilization / target)}} based on CPU **against the request**. A new JVM pod burns a lot of CPU at startup (class loading, JIT, warm-up), driving up average CPU, prompting HPA to scale up; a few minutes later, CPU drops, after the 5-minute stabilization window, it scales down, then loops. Verify with {{kubectl describe hpa}} and pod-level CPU metrics; stabilize with {{behavior}} (stabilization window, speed limits), setting CPU requests closer to actual usage, readiness only turning UP after warm-up, and consider scaling based on more business-oriented metrics (RPS, lag).

### Understanding the issue
HPA is like a **supermarket manager watching cashier busyness to open more registers**. A new cashier opening their register must turn on the machine, count money, so they look "very busy" even if not serving anyone yet. The manager sees average busyness increase, opens more registers; moments later everyone is idle, they close registers; new registers are "busy-looking"... and it loops.

### Terminology
- **HPA CPU utilization**: Actual CPU usage divided by the container's **CPU request**, not the limit.
- **Stabilization window**: HPA looks back at recommendations within this time and selects the safest value; default scale down 300s, scale up 0s.
- **Tolerance**: HPA changes nothing if the difference is within 10% of the target.
- **Flapping**: constant scaling up and down.

### Symptoms and Metrics
- Target CPU 60%, request 500m. At stability, each pod uses ~250m (50%).
- New pod: 30–60 seconds of 1.5–2 core usage (JIT C2 + warm-up), 300–400% of request.
- {{kubectl describe hpa catalog}} Events: "New size: 12; reason: cpu resource utilization (percentage of request) above target", minutes later "New size: 4; reason: All metrics below target".

### Hypotheses and Verification
1. **Startup CPU of new pod skews the average.** Plot {{container_cpu_usage_seconds_total}} per pod: pods under 1 minute old have spiked CPU. HPA skips CPU samples from pods that aren't ready, but if readiness turns UP **too early**, warm-up CPU is included.
2. **Request is too low compared to reality**, making utilization overly sensitive to small fluctuations. Verify by comparing actual p95 CPU over days with the request.
3. **Aggressive scale up without limits**: jumping from 4 to 12 in one cycle because of default scale-up behavior.
4. **Latency increases during scale-up** because the new pod isn't warm (JIT, connection pool, cache) but immediately receives traffic.

### Step-by-step mechanism of a flapping cycle
~~~text
t0   4 pods x 50%                 -> stable
t1   slight fluctuation: 4 pods x 70%   -> desired = ceil(4 x 70/60) = 5
t2   new pod ready early, CPU 350% -> avg of 5 pods ~ 126% -> desired 11..12
t3   7 new pods all warm-up      -> CPU still high, hold 12
t8   warm-up done: 12 pods x 17%  -> recommendation 4, after 300s stabilization window -> scale down to 4
t9   4 pods back to ~50-70%      -> new cycle
~~~

### Stabilization Configuration
~~~yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  minReplicas: 6                          # floor sufficient for baseline traffic
  maxReplicas: 20
  metrics:
  - type: Resource
    resource: { name: cpu, target: { type: Utilization, averageUtilization: 65 } }
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60      # need high recommendation sustained for 60s to scale
      policies: [ { type: Percent, value: 50, periodSeconds: 60 } ]   # max +50%/min
    scaleDown:
      stabilizationWindowSeconds: 600     # slow decrease
      policies: [ { type: Pods, value: 1, periodSeconds: 120 } ]
~~~
Additionally:
- **Set CPU request based on actual p90–p95** (e.g., 1000m), so utilization reflects actual load.
- **Readiness only UP after warm-up** (pre-call key endpoints, open sufficient connection pool), helping HPA ignore startup CPU and prevent latency spikes.
- If CPU isn't the real bottleneck (I/O bound service), scale based on RPS or latency via custom/external metrics (Prometheus Adapter, KEDA).

### Trade-offs
| Choice | Pro | Cost |
|---|---|---|
| Long stabilization | stable | slow reaction to real peaks |
| High minReplicas | no flapping, ready for peaks | waste money at off-peak |
| Scale by RPS | closer to business load | need metric pipeline, can be laggy |

### Common Pitfalls
1. **Setting target based on limit** in your head instead of request: 60% target with 500m request is just 300m.
2. **Enabling both HPA (CPU) and VPA (CPU request adjustment)** at the same time: two controllers fighting.
3. **Unlimited scale-up speed**: one fake peak triggers dozens of pods, possibly exhausting DB connections (each pod opens 20 connections).

### 1-minute Interview Answer
"HPA calculates utilization against CPU request. A new JVM pod burns heavy CPU during warm-up, driving the average up, prompting HPA to scale up; after CPU drops and the 5-minute stabilization window passes, it scales down, looping the cycle. I verify this via HPA events and per-pod CPU metrics. I stabilize this by configuring behavior: 60s stabilization for increase, 10 mins for decrease, capping at +50% per minute; setting requests based on actual p95; ensuring readiness only turns UP after warm-up; and if the service is I/O bound, scaling based on RPS instead of CPU."

> Senior tip: always remember each new replica **also multiplies connections to the DB**. I once saw HPA jump from 8 to 40 pods in a fake peak, each pod with 20 Hikari connections, total 800 connections exceeding Postgres {{max_connections}} and the autoscale itself caused the outage. Always calculate {{maxReplicas × pool size}} against DB limits.`
    ,
    follow: [
      'When to scale by Kafka lag instead of CPU?',
      'Why should you not use both HPA (CPU) and VPA (CPU) for the same Deployment?',
      'What metrics do you use to choose minReplicas?'
    ]
  },
  'scenario-064': {
    q: 'Dashboard shows pricing service pods using 35% CPU limit on average (limit 1 core), but p99 latency jumps from 80ms to 600ms on light traffic increases, and GC pauses are abnormally long. You plan to optimize code. What do you suspect and how do you verify?',
    a: `**Summary:** I suspect **CPU throttling** due to CFS quota: a 1-core limit means the container only gets 100ms of total CPU time per 100ms period. A multi-threaded app (Tomcat, GC, JIT) might consume that quota in the first 25ms on 4 cores and **get frozen for the remaining 75ms**, even if the average over a minute is only 35%. Verify using {{container_cpu_cfs_throttled_periods_total}} or {{cpu.stat}} in cgroup; fix by increasing or removing CPU limit (keeping the request), tuning thread/GC counts accordingly, and alerting on throttling ratio.

### Understanding the issue
CPU limit is like a **100-minute movie pass per session**, but you can use many seats at once. If you bring 4 people at once, 25 minutes in, you've used 100 person-minutes, and the whole group must **go outside and wait** until the next session. Your average usage per day is low, but right when you need it, you get kicked out. A beautiful average has masked those wait times.

### Terminology
- **CFS quota/period**: Linux grants cgroups a CPU-time limit (quota) within each period (default 100ms). 1-core limit = 100ms quota per 100ms.
- **Throttling**: cgroup uses up quota before the period ends, so all its threads are stopped until the next period.
- **CPU request**: guaranteed CPU, used for scheduling and sharing CPU during contention; does not cause throttling.
- **availableProcessors**: number of CPUs the JVM thinks it has; in a container, the JVM calculates this from the quota (limit).

### Symptoms and Metrics
- Node has 8 cores, pod limit 1 core, request 500m.
- CPU average per minute: 0.35 core. But {{rate(container_cpu_cfs_throttled_periods_total[5m]) / rate(container_cpu_cfs_periods_total[5m])}} = **45%**: nearly half of periods are throttled.
- GC log: "Pause Young" pause usually 15ms, under load 120–250ms.
- {{java -XX:+PrintFlagsFinal -version}} in container: JVM selects **SerialGC** because it sees fewer than 2 CPUs.

### Hypotheses and Verification
1. **Quota-based throttling.** Inside container: {{cat /sys/fs/cgroup/cpu.stat}} (cgroup v2) to check {{nr_periods}}, {{nr_throttled}}, {{throttled_usec}}; re-run after 60 seconds and calculate increase. Or use cAdvisor metric above.
2. **JVM misinterprets resources.** {{jcmd 1 VM.info}} or startup log with {{-Xlog:os+container=info}} shows quota and number of CPUs the JVM calculates; with 1-core limit, {{availableProcessors}} = 1, JVM defaults to Serial GC (only 1 GC thread, stop-the-world).
3. **Is the code slow?** Compare: run load test on the same code on a pod without limit; if p99 drops to 85ms, the issue is infrastructure, not code.

### Step-by-step mechanism
~~~text
Period 100ms, quota 100ms, app has 4 threads running in parallel on 4 cores
0ms ─ 25ms : 4 threads x 25ms = 100ms CPU -> QUOTA EXHAUSTED
25ms ─ 100ms: ALL threads stopped (throttled 75ms)
=> request in-flight is added up to 75ms; GC running is also stopped
~~~
A request passing through a few throttled periods is already added hundreds of ms. Average per minute doesn't see this because total CPU is still low; that's why "35% but still slow".

### Fixes
| Approach | Effect | Note |
|---|---|---|
| Remove CPU limit, keep correct request | no throttling, use idle node CPU | need policy; noisy neighbor controlled by request |
| Increase limit (e.g., 2–4 cores) | significantly reduce throttling | waste namespace quota |
| {{-XX:ActiveProcessorCount=2}} | JVM chooses G1, appropriate GC/JIT thread count | doesn't increase quota, just fixes JVM estimation |
| Reduce parallel threads (pool) | burn less quota at once | might reduce throughput |

For latency-sensitive services, common practice: request = actual p95 usage (e.g., 1 core), limit removed or 2–4x request; specify GC explicitly ({{-XX:+UseG1GC}}) instead of letting JVM guess.

### Prevention
- Alert when throttled period ratio > 10–20% sustained.
- Dashboard with: p99 latency, throttled ratio, GC pause side-by-side.
- When sizing, measure by **burst** (p99 CPU per second) not just average per minute.

### Common Pitfalls
1. **Looking at average CPU and concluding "CPU is ample"**: throttling happens at 100ms scale, minute metrics don't see it.
2. **Limit below 2 cores for JVM app**: JVM selects Serial GC, long pauses, consumes quota right when latency matters.
3. **Optimizing code before measuring infrastructure**: waste weeks without p99 changes.

### 1-minute Interview Answer
"Low average CPU but high latency makes me suspect CFS CPU throttling: a 1-core limit is 100ms CPU every 100ms, the app consumes quota fast with many threads then gets frozen for the rest of the period. I verify via throttled periods in cgroup or throttled metrics: 45% of periods are throttled. JVM also sees only 1 CPU and defaults to Serial GC, causing long pauses. I fix this by setting request based on p95, removing or raising the limit, explicitly specifying G1 and appropriate ActiveProcessorCount, and adding a throttled ratio alert."

> Senior tip: before asking the team to optimize code for p99, I always look at 3 charts: **throttled ratio, GC pause, connection pool wait**. At one project, just removing CPU limit for 6 latency-sensitive services (keeping request) reduced p99 from 600ms to about 90ms without changing a line of code.`
    ,
    follow: [
      'When removing CPU limit, how to avoid one pod consuming all node CPU?',
      'Why does JVM select Serial GC when container has fewer than 2 CPUs?',
      'Should memory limit be removed like CPU limit? Why?'
    ]
  },
  'scenario-065': {
    q: 'Consumer group {{invoice-sync}} (6 instances, 12 partitions) rebalances every few minutes, lag grows from 0 to 2 million, and logs are full of {{CommitFailedException}}. Each message takes 0.5–1 second for external API call. How do you diagnose and fix this "rebalance storm"?',
    a: `**Summary:** the consumer takes up to {{max.poll.records}} (default 500) messages per {{poll()}}; processing 500 × 1 second = 500 seconds, exceeding {{max.poll.interval.ms}} (default 300,000ms = 5 minutes), so the client leaves the group, causing rebalance; the offset batch cannot be committed ({{CommitFailedException}}), batch is re-delivered, and loops. Fix by **reducing the number of records per poll** to keep batch processing time well below the limit, accelerating processing (controlled parallelism, API timeout), and only increasing {{max.poll.interval.ms}} after understanding the implications; use cooperative rebalancing and static membership to make rebalancing less painful.

### Understanding the issue
The group is like a **team of workers sharing conveyor belts**. The manager (group coordinator) has a rule: each worker must **return to the receiving table** at least every 5 minutes, otherwise, they are assumed to have left, and the conveyor belt is reassigned. A worker grabs 500 items, each takes 1 second, it takes 8 minutes to return; the manager has already reassigned the work, the worker's effort isn't recorded, and the items must be done again.

### Terminology
- **Rebalance**: group reassigns partitions among consumers; in eager rebalancing, all consumers stop processing.
- **max.poll.interval.ms**: max time between two {{poll()}} calls; exceeding this means the consumer is considered dead.
- **session.timeout.ms / heartbeat**: heartbeat runs in background, detects dead process; different from poll interval (detects "process alive but stuck").
- **Static membership**: set a fixed {{group.instance.id}} for fast restarts without rebalancing.

### Symptoms and Logs
~~~text
WARN  [Consumer clientId=invoice-sync-3, groupId=invoice-sync] consumer poll timeout has expired.
  This means the time between subsequent calls to poll() was longer than the configured
  max.poll.interval.ms, which typically implies that the poll loop is spending too much time
  processing messages. You can address this either by increasing max.poll.interval.ms or by
  reducing the maximum size of batches returned in poll() with max.poll.records.
ERROR CommitFailedException: Commit cannot be completed since the group has already rebalanced...
~~~
- Lag grows stepwise; rebalances per hour: 15–20.
- External API is called **multiple times** (same invoiceId multiple times) because batches are re-processed.

### Hypotheses and Verification
1. **Batch too large compared to processing time.** Measure time processing each batch (custom metric or Micrometer timer around listener) and compare with 300 seconds.
2. **External API abnormally slow** (p99 from 1s to 10s). Check HTTP client metric; missing timeout means one stalled request can take minutes.
3. **Rebalance due to deployment/restart** not poll. Check logs: is the reason for leaving "poll timeout" or "session timeout"?
4. Check group status: {{kafka-consumer-groups.sh --bootstrap-server kafka:9092 --describe --group invoice-sync}}, CONSUMER-ID changes constantly, LAG increases.

### Step-by-step mechanism
~~~text
poll() -> receives 500 records
processes 500 x ~1s ............... 300s: exceed max.poll.interval.ms
 -> client sends LeaveGroup, coordinator rebalances, partition moved to other consumer
finishes at 500s -> commitSync() -> CommitFailedException (no longer owns partition)
new consumer starts from old committed offset -> 500 records processed AGAIN -> slow -> loop
~~~

### Fixes
~~~yaml
spring:
  kafka:
    consumer:
      max-poll-records: 50                 # 50 x 1s = 50s, well below 300s limit
      properties:
        max.poll.interval.ms: 600000       # increase deliberately, detect stalled consumer slower
        partition.assignment.strategy: org.apache.kafka.clients.consumer.CooperativeStickyAssignor
        group.instance.id: \${HOSTNAME}     # static membership (stable pod name StatefulSet)
~~~
- **Timeout for external API** (connect 2s, read 5s) and circuit breaker: one stalled call must not tie up the whole batch.
- **Increase throughput** with control: increase listener {{concurrency}} up to partition count (12), or process in parallel within batch but **group by key** to maintain order per invoiceId.
- **Idempotency** for API calls (sending idempotency key = invoiceId) because at-least-once always has duplicates.
- Kafka 4.0 has new consumer group protocol (KIP-848, {{group.protocol=consumer}}) where broker orchestrates partition assignment, reducing "stop-the-world" rebalance; requires broker and client support.

### Trade-offs
| Parameter | Increase leads to | Decrease leads to |
|---|---|---|
| max.poll.records | higher throughput per poll, easy to exceed interval | safer, more round-trips |
| max.poll.interval.ms | tolerate slow batch | fast detection of truly stuck consumer |
| concurrency | faster processing | useless if exceeds partition count |

### Common Pitfalls
1. **Increasing max.poll.interval.ms to 1 hour**: stops rebalance, but a truly stuck consumer keeps the partition for 1 hour without detection.
2. **Async processing in listener then returning immediately**: offset commits before processing completes, message lost on crash.
3. **Static membership with identical IDs** across two pods: one instance fenced constantly.

### 1-minute Interview Answer
"Logs point directly to max.poll.interval.ms. Each poll gets 500 records, each taking 1 second equals 500 seconds, exceeding the 5-minute default, causing the consumer to be dropped, the batch uncommitted, and re-processed in a loop. I measure batch processing time to confirm. I reduce max.poll.records to 50, timeout external APIs, increase concurrency up to partition count, ensure idempotency by invoiceId, and use cooperative sticky with static membership to make rebalancing during deployment lighter."

> Senior tip: my rule of thumb is **p99 batch processing time ≤ 1/3 max.poll.interval.ms**. Add "batch processing time" and "rebalance count per hour" metrics to the consumer dashboard from day one; when rebalance count > 0 outside deployment hours, that's an early warning before lag explodes.`
    ,
    follow: [
      'How do session.timeout.ms and max.poll.interval.ms detect two different error types?',
      'How does cooperative rebalancing differ from eager rebalancing?',
      'How to process in parallel within a partition while keeping order per key?'
    ]
  },
  'scenario-066': {
    q: 'Partition 3 of topic {{orders}} stands still at offset 18,234 for 2 hours, partition lag grows to 400k, while other partitions are normal. Logs are full of JSON parse errors every second. How do you handle this "poison message"?',
    a: `**Summary:** a bad message (poison message) causes consumer error forever at the same offset; because Kafka processes sequentially in a partition, all subsequent messages are blocked. Verify using {{kafka-consumer-groups.sh --describe}} and read that specific offset; fix by using **ErrorHandlingDeserializer** (parse errors no longer crash {{poll()}}), **DefaultErrorHandler** with limited retries and **DeadLetterPublishingRecoverer** pushing broken messages to a DLT, categorize non-retryable errors, and have a process to review and replay the DLT.

### Understanding the issue
A partition is like a **line of people waiting at the ticket booth**. One person has a torn ticket, the scanner cannot read it; the staff tries scanning it repeatedly, everyone behind is waiting. Correct approach: try a few times, if it fails, **invite them to a separate counter** (DLT) for later processing, the line moves on.

### Terminology
- **Poison message**: a message that fails processing every time (bad format, constraint violation).
- **DLT (Dead Letter Topic)**: topic containing messages that cannot be processed, with headers describing the error.
- **Retryable vs. non-retryable**: transient error (DB timeout) worth retrying; data error (JSON bad) fails regardless of retry count.

### Symptoms and Verification
~~~text
$ kafka-consumer-groups.sh --bootstrap-server kafka:9092 --describe --group order-svc
TOPIC  PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG     CONSUMER-ID
orders 2          991203          991210          7       order-svc-1-...
orders 3          18234           418901          400667  order-svc-2-...
orders 4          770012          770015          3       order-svc-3-...
~~~
1. Only one partition stands still, CURRENT-OFFSET not moving: poison message signature (if whole group is slow, it's throughput).
2. Read the message: {{kafka-console-consumer.sh --bootstrap-server kafka:9092 --topic orders --partition 3 --offset 18234 --max-messages 1}}. Found payload truncated or producer sent {{amount}} as string "1,000".
3. Log loop: "SerializationException: Error deserializing ... at offset 18234". Error happens **inside {{poll()}}**, before listener code, so listener handler won't catch it.

### Why it gets stuck
~~~text
poll() -> deserialize offset 18234 -> exception
offset not committed -> next poll reads 18234 again -> exception -> ...
Kafka does not allow "skipping" in partition: 18235.. must wait
~~~

### Fix with Spring Kafka (Boot 3)
~~~yaml
spring:
  kafka:
    consumer:
      value-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
      properties:
        spring.deserializer.value.delegate.class: org.springframework.kafka.support.serializer.JsonDeserializer
~~~
~~~java
@Bean
DefaultErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
    // Send broken message to "orders.DLT", default same partition count as original topic
    var recoverer = new DeadLetterPublishingRecoverer(template);
    // 1st attempt + max 3 retries, 1s apart; then move to DLT and proceed
    var handler = new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 3));
    handler.addNotRetryableExceptions(ConstraintViolationException.class); // data error: do not retry
    return handler;
}
~~~
- {{ErrorHandlingDeserializer}} wraps the real deserializer; when parsing fails, it returns null with error info in header, and error handler receives exception to move to DLT. {{DeserializationException}} is non-retryable by default.
- Spring Boot automatically attaches {{CommonErrorHandler}} bean to the default container factory.
- DLT topic must exist with **partition count ≥ original topic** (default recoverer preserves partition count).

### Handling during incident
- If fix not deployed yet: stop consumer group, use {{kafka-consumer-groups.sh --reset-offsets --to-offset 18235 --topic orders:3 --group order-svc --execute}} to skip exactly one message, **after saving** that message content. This is a manual operation with approval, not a standard procedure.
- Alert producer team to fix source; determine how many messages have same error.

### Prevention
- Schema Registry (Avro/Protobuf/JSON Schema) with compatibility checks so producers cannot send invalid contracts.
- Alert: lag of **individual partition** not changed for 10 minutes; number of messages in DLT > 0.
- DLT procedure: dashboard to view messages, reason (exception header), tool to replay to original topic after fixing.

### Common Pitfalls
1. **Infinite retry** ({{FixedBackOff}} with unlimited attempts) for data error: partition stuck forever.
2. **Catch and silently ignore** in listener: not stuck but **data lost** without knowledge.
3. **DLT has fewer partitions than original topic**: publish to DLT fails, stuck at recover stage.

### 1-minute Interview Answer
"A partition standing still at an offset is a poison message signature. I use kafka-consumer-groups describe to see partition 3 stuck at 18234, read that message via console consumer and find bad JSON. Because errors happen inside poll, the consumer reads it again forever. I wrap the deserializer with ErrorHandlingDeserializer, configure DefaultErrorHandler to retry 3 times then send to DLT, marking data errors as non-retryable. Finally, add partition-lag alerts, DLT alerts, and a replay procedure."

> Senior tip: differentiate **transient errors** and **data errors** right in the design: transient errors retry with backoff (even retry topic), data errors immediately to DLT. A DLT no one watches is just a trash can with storage costs; assign owner and SLA for processing (e.g., within 1 workday) for each DLT.`
    ,
    follow: [
      'How does retry topic (non-blocking retry) differ from DefaultErrorHandler local retry, and the impact on order?',
      'How to avoid duplicates when replaying messages from DLT?'
    ]
  },
  'scenario-067': {
    q: 'Consumer lag of topic {{payment-events}} grows steadily every peak hour (from 0 to 700k), goes back to 0 at night, and the peak is higher each week. No errors, no rebalance. The team proposes "adding consumer pods". Analyze the processing capacity and plan?',
    a: `**Summary:** lag growing steadily without errors means **input rate is larger than processing rate** at peak hours. Need to measure two numbers: messages per second input and maximum processing capacity of the group = number of consumers **actually having partitions** × (1 / processing time per message). Adding pods only helps if there are still consumers less than partitions; if DB/downstream API is the bottleneck, adding pods makes it worse. Plan: measure, find bottleneck, optimize processing (batch, remove redundant round-trip), then scale partition/consumer with calculations, accompanied by time-based lag alerts.

### Understanding the issue
Lag is like a **line of people waiting at the booth**. If 800 people arrive per minute and booths only serve 600 people/minute, the line grows 200 people every minute, even if nobody did anything wrong. Opening more booths only helps if there is space to place booths (partitions) and **the back office** (DB) can handle the new booth count.

### Terminology
- **Lag**: LOG-END-OFFSET minus CURRENT-OFFSET (committed), i.e., messages pending processing.
- **Time-based lag**: how long the oldest pending message has been waiting; more business value than count.
- **Throughput per consumer**: messages/second a thread handles, ≈ 1 / processing time per message.
- **Partition skew**: some partitions receive significantly more messages due to hot keys.

### Data collection
- Producer peak hour: 800 msg/s (10% growth per week with user growth).
- Topic 12 partitions, group has 12 consumer threads (concurrency 4 × 3 pods).
- Average processing time per message: 20ms (read 1 record, write 2 records, each query a round-trip DB).
- Max capacity: 12 × (1000 / 20) = **600 msg/s**. Missing 200 msg/s, lag grows 720k per peak hour, matching observation.

### Hypotheses and Verification
1. **Lack of total capacity** (calculated above). Verify: lag grows steadily on **all** partitions; {{records-consumed-rate}} metric of consumer flatlines at ~600 msg/s.
2. **Partition skew.** {{kafka-consumer-groups.sh --describe}}: if lag concentrates on 1–2 partitions, it's a hot key issue (e.g., one large merchant), adding consumers does nothing.
3. **Downstream bottleneck.** Measure DB/API latency during peak; if DB is at 85% CPU, increasing consumers only pushes latency higher.
4. **Redundant consumer.** If consumer thread count > partition count, the excess sits idle; check CONSUMER-ID column for unassigned partitions.

### Plan by cost order
| Step | Example | Estimated effect |
|---|---|---|
| 1. Less round-trips | batch 3 SQL to 1, upsert | 20ms down to ~8ms: 1,500 msg/s |
| 2. Process in batch | batch listener 100 records, insert batch | increase 2–5x if DB handles it |
| 3. Parallel within partition by key | parallel consumer lib, or group by key | increase while keeping order per key |
| 4. Increase partition + consumer | 12 to 24 | double ceiling, but changes key mapping |

Increasing partition is the **final** step because: partition count only increases, cannot decrease; {{hash(key) % partitions}} mapping changes so new messages for the same key might go to a different partition while old messages aren't processed yet, breaking order during transition. If must increase, do when lag is near 0 or move to a new topic with a plan.

### Example batch listener
~~~java
@KafkaListener(topics = "payment-events", batch = "true")
public void onBatch(List<PaymentEvent> events) {
    // 1 round-trip for batch instead of 3 x N round-trips
    paymentRepository.upsertAll(events);   // JDBC batch / INSERT ... ON CONFLICT
}                                           // error in batch: use BatchListenerFailedException to indicate broken record
~~~

### Monitoring and Success Criteria
- Alert based on **wait time** (e.g., oldest message > 5 mins) instead of quantity; tools like Burrow or kafka-exporter + calculation by speed.
- Dashboard: input rate, processing rate, lag per partition, DB latency.
- Capacity objective: processing ceiling ≥ 2x current peak to allow 10%/week growth and for "chasing lag" after incidents.

### Common Pitfalls
1. **Adding pods when consumers = partition count**: waste money, throughput unchanged.
2. **Increasing concurrency while DB already choked**: processing time per message increases, throughput nearly unchanged, sometimes decreases.
3. **Alerting based on fixed lag count**: 100k messages could be 2 minutes in this topic but 3 hours in another.

### 1-minute Interview Answer
"Steady lag growth without errors is a capacity issue: 800 msg/s in, while 12 consumers each taking 20ms only process 600 msg/s, missing 200 msg/s exactly equal to lag growth speed. Adding pods is useless because consumers already equal partitions. I check skew by partition and DB load, then optimize in cheapest order: reduce DB round-trips, batch listener, parallelize by key, and only increase partitions finally as it changes key mapping and is irreversible. I set alerts by wait time and target processing ceiling of twice the current peak."

> Senior tip: when reviewing a "scale consumer" proposal, I ask for a calculation on paper: **peak input, processing time per message, partition count, DB limit**. Often, just reducing DB round-trips gives 2–3x throughput, much cheaper than adding infrastructure and doesn't touch message order.`
    ,
    follow: [
      'How to handle partition skew when one merchant accounts for 40% of traffic?',
      'What preparations are needed to increase the partition count of a running topic?',
      'How does batch listener handle errors of one record in a batch?'
    ]
  }
});
