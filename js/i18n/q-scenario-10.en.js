/*
 * English translation of js/data/q-scenario.js — task T483. Format: js/core/i18n.js (content overlay).
 * ids: scenario-062 scenario-063 scenario-064 scenario-065 scenario-066 scenario-067
 */
App.i18n.content({
  'scenario-062': {
    q: 'Every rolling deploy of the payment service (10 pods) gives clients about 200–400 502/503 errors and a handful of "connection reset" errors over 1–2 minutes, even though the readiness probe is configured. How do you find the root cause and make deploys "drop zero requests"?',
    a: `**Summary:** when a pod is deleted, Kubernetes **in parallel** sends SIGTERM to the container and removes the pod from the endpoint list; ingress/kube-proxy takes a few seconds to update, so during that window traffic still flows into a JVM that is shutting down. The fix has three layers: a **preStop sleep** of a few seconds to wait until the endpoint is removed, Spring Boot **graceful shutdown** to finish in-flight requests, and {{terminationGracePeriodSeconds}} greater than the sum of both; plus {{maxUnavailable: 0}} and a readiness probe that actually means something for new pods.

### Understand quickly
It is like a cashier closing a register: the manager both **turns off the register light** (SIGTERM) and **tells the guard** not to send customers to this register (endpoint removal). But the message takes a few seconds to arrive, so the guard still sends customers to the darkened register. The right way: notify first, **wait a few seconds** for the guard to get the message, then serve the customers already standing there and close.

### Terms
- **EndpointSlice**: the list of pod IPs behind a Service; kube-proxy and ingress controllers read this list.
- **preStop hook**: a command that runs **before** the container receives SIGTERM.
- **Graceful shutdown**: stop accepting new requests, wait for in-flight requests to finish, then shut down.
- **terminationGracePeriodSeconds**: the maximum total time (default 30s) from the start of termination until kubelet sends SIGKILL.

### Symptoms and numbers
- Errors appear only in the deploy window; the ingress access log shows 502 with "upstream prematurely closed connection" and "connect() failed (111: Connection refused)" to the old pod IP.
- Old pod: no "Graceful shutdown" log line, the process dies less than 1 second after SIGTERM.
- Some payment requests take 8–15 seconds (they call a bank) and are cut off mid-flight.

### Hypotheses and how to verify
1. **Race between SIGTERM and endpoint removal.** Log the moment SIGTERM is received (shutdown hook) and compare it with when the IP disappears from {{kubectl get endpointslices -l kubernetes.io/service-name=payment -w}}; ingress keeps sending requests to that IP for 2–5 seconds after SIGTERM.
2. **The app shuts down immediately instead of waiting for in-flight requests.** Check {{server.shutdown}}: Spring Boot 3.4 and later default to graceful; older versions default to immediate.
3. **Grace period too short.** A 15-second request plus waiting for the endpoint, while {{terminationGracePeriodSeconds}} is still 30 with a long shutdown phase, can end in SIGKILL (exit 137).
4. **New pods receive traffic too early.** Readiness reports UP before warm-up finishes, so the first requests time out.

### Step-by-step mechanism when a pod is deleted
~~~text
API server marks the pod Terminating
   ├─► (A) kubelet: run preStop -> send SIGTERM -> wait -> SIGKILL when grace expires
   └─► (B) EndpointSlice controller removes the IP -> kube-proxy / ingress updates (a few seconds)
(A) and (B) run IN PARALLEL, with no guaranteed ordering
~~~
Without preStop, (A) is usually faster than (B): the JVM has already closed its port while ingress still holds the old IP, producing connection refused/502.

### Configuration fix
~~~yaml
spec:
  terminationGracePeriodSeconds: 60   # > preStop (10) + shutdown timeout (40)
  containers:
  - name: payment
    lifecycle:
      preStop:
        sleep: { seconds: 10 }        # K8s 1.30+; older versions: exec ["sh","-c","sleep 10"]
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
  shutdown: graceful                  # stop accepting new requests, wait for in-flight ones
spring:
  lifecycle:
    timeout-per-shutdown-phase: 40s   # default 30s
~~~
When shutdown begins, Spring Boot also flips readiness to a state that no longer receives traffic; but **you should not rely on that alone**, because readiness also needs a few probe cycles to take effect.

### Other things that need a graceful stop
- Kafka consumer: the container stops the listener and commits offsets during shutdown; make processing idempotent so redelivery is safe.
- {{@Scheduled}} jobs and async executors: configure them to wait for tasks to finish ({{spring.task.execution.shutdown.await-termination=true}}).
- Keep-alive connections from ingress: Tomcat's graceful shutdown returns errors for new requests on old connections, so the preStop sleep is still the primary layer.

### Prevention
- Test: run k6/Gatling at 200 RPS continuously while {{kubectl rollout restart deployment/payment}}, and require zero 5xx.
- PodDisruptionBudget so a node drain does not evict many pods at once.
- Measure deploys as an SLO: "number of 5xx during the deploy window".

### Common mistakes
1. **preStop sleep longer than the grace period**: kubelet SIGKILLs halfway, and all in-flight requests die.
2. **Distroless image with no sleep binary** while still using exec sleep: the hook fails; use the native sleep action (K8s 1.30+) or a custom endpoint.
3. **Only setting {{server.shutdown=graceful}}** and forgetting preStop: requests still drop because of the endpoint race.

### 1-minute oral answer
"The cause is a race: when a pod is deleted, Kubernetes sends SIGTERM and removes the endpoint in parallel, and ingress needs a few seconds to update, so it keeps sending traffic to a JVM that is shutting down. I verify by comparing the SIGTERM log with the moment the IP leaves the EndpointSlice and with ingress 502 access logs. I fix it with a 10-second preStop sleep, server.shutdown graceful with a 40-second timeout, a 60-second grace period, maxUnavailable 0, and readiness that only goes UP after warm-up. Finally I run a load test during rollout restart to prove zero errors."

> Senior tip: the grace period number must be derived from **the longest request you accept completing**, not picked arbitrarily. For a service calling a bank with p99.9 of 15 seconds, I set the shutdown timeout to 40 seconds and grace to 60 seconds; after the change, errors per deploy dropped from a few hundred to zero, and the team felt safe deploying during business hours.`,
    follow: [
      "Why is preStop still needed when a readiness probe already exists?",
      "How do you handle a rolling deploy that keeps causing Kafka consumer rebalances?",
      "What does a PodDisruptionBudget give you when a node is drained?"
    ]
  },
  'scenario-063': {
    q: 'The HPA of the catalog service oscillates constantly: replicas jump 4 → 12 → 4 → 12 roughly every 6–7 minutes, even when traffic is almost flat. Every scale-up makes latency worse. How do you analyze and stabilize it?',
    a: `**Summary:** HPA computes {{desired = ceil(current × currentUtilization / target)}} based on CPU **relative to the request**. A freshly started JVM pod burns a lot of CPU (class loading, JIT, warm-up), which pushes the average CPU up, so HPA scales out further; a few minutes later CPU is low again, the 5-minute stabilization window expires, it scales in, and the cycle repeats. Verify with {{kubectl describe hpa}} and per-pod CPU metrics; fix with {{behavior}} (stabilization windows, rate limits), set the CPU request close to reality, readiness UP only after warm-up, and consider scaling on a metric closer to the business (RPS, lag).

### Understand quickly
HPA is like **a supermarket manager watching cashier busyness to open more lanes**. A new cashier has to boot the till and count the float, so they look "very busy" before serving anyone. The manager sees average busyness rise, opens more lanes; a bit later everyone is idle, closes lanes; the new lane again looks "falsely busy"... and so on.

### Terms
- **HPA CPU utilization**: actual CPU used divided by the container's **CPU request**, not by the limit.
- **Stabilization window**: HPA looks back at recommendations within this window and picks the safest value; default 300 seconds for scale down, 0 seconds for scale up.
- **Tolerance**: a difference under 10% from the target makes HPA do nothing.
- **Flapping**: scaling up and down repeatedly.

### Symptoms and numbers
- Target CPU 60%, request 500m. At steady state each pod uses ~250m (50%).
- New pod: the first 30–60 seconds use 1.5–2 cores (JIT C2 + warm-up), 300–400% of the request.
- {{kubectl describe hpa catalog}} Events: "New size: 12; reason: cpu resource utilization (percentage of request) above target", and a few minutes later "New size: 4; reason: All metrics below target".

### Hypotheses and how to verify
1. **Startup CPU of new pods skews the average.** Plot {{container_cpu_usage_seconds_total}} per pod: pods younger than 1 minute show a CPU spike. HPA has a mechanism to skip CPU samples from pods that are not ready during initialization, but if readiness goes UP **too early**, warm-up CPU still counts.
2. **Request too low relative to reality**, so utilization is sensitive to every small fluctuation. Verify with the long-run p95 actual CPU compared to the request.
3. **Unbounded scale-up**: jumping straight from 4 to 12 in one cycle because it is using the default scale-up behavior.
4. **Latency rises during scale-up** because new pods are not warm (JIT, connection pool, cache) yet receive traffic immediately.

### Step-by-step of one flapping cycle
~~~text
t0   4 pods x 50%                        -> stable
t1   slight fluctuation: 4 pods x 70%    -> desired = ceil(4 x 70/60) = 5
t2   new pod ready early, CPU 350%       -> average over 5 pods ~ 126% -> desired 11..12
t3   7 new pods warming up together      -> CPU still high, stay at 12
t8   warm-up done: 12 pods x 17%         -> recommendation 4, 300s stabilization expires -> back to 4
t9   4 pods climb back to ~50-70%        -> new cycle
~~~

### Stable configuration
~~~yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  minReplicas: 6                          # floor enough for baseline traffic
  maxReplicas: 20
  metrics:
  - type: Resource
    resource: { name: cpu, target: { type: Utilization, averageUtilization: 65 } }
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60      # only scale if the high recommendation lasts 60s
      policies: [ { type: Percent, value: 50, periodSeconds: 60 } ]   # at most +50% per minute
    scaleDown:
      stabilizationWindowSeconds: 600     # slow down on scale-in
      policies: [ { type: Pods, value: 1, periodSeconds: 120 } ]
~~~
Also:
- **Set the CPU request according to actual p90–p95** (e.g. 1000m), so utilization reflects the real load.
- **Readiness UP only after warm-up** (pre-calling the main endpoints, filling the connection pool), which lets HPA skip startup CPU and avoids the latency increase.
- If CPU is not the real bottleneck (the service waits on I/O), scale on RPS or latency through custom/external metrics (Prometheus Adapter, KEDA).

### Trade-offs
| Option | Benefit | Cost |
|---|---|---|
| Long stabilization | stable | slow to react to genuine peaks |
| High minReplicas | less flapping, ready for peaks | costs money in off-peak hours |
| Scale on RPS | close to the business | needs a metric pipeline, may lag |

### Common mistakes
1. **Thinking of the target against the limit** instead of the request: a 60% target with a 500m request means only 300m.
2. **Enabling both CPU-based HPA and VPA adjusting CPU request** at the same time: two controllers fight each other.
3. **No scale-up rate limit**: a fake peak drags in dozens of pods, which can exhaust the DB connections (each pod opens a pool of 20).

### 1-minute oral answer
"HPA computes utilization against the CPU request. A new JVM pod burns a lot of CPU during warm-up, pulling the average up, so HPA scales out; then CPU drops and after the 5-minute stabilization window it scales back in, forming a loop. I verify with HPA events and CPU by pod age. I fix it with behavior: 60-second stabilization on scale-up, 10 minutes on scale-down, a +50% per minute cap; set the request from the real p95; readiness UP only after warm-up; and if the service mostly waits on I/O, scale on RPS instead of CPU."

> Senior tip: remember that every new replica **adds more connections to the DB**. I once saw HPA jump from 8 to 40 pods on a fake peak, each with a Hikari pool of 20 connections, 800 in total exceeding the Postgres {{max_connections}}, so autoscaling itself caused the incident. Always compute {{maxReplicas × pool size}} against the DB limit.`,
    follow: [
      "When should you scale on Kafka lag instead of CPU?",
      "Why should you not run CPU-based HPA and CPU-based VPA on the same Deployment?",
      "What data do you base the choice of minReplicas on?"
    ]
  },
  'scenario-064': {
    q: 'The dashboard shows pods of the pricing service using on average only 35% of their CPU limit (1 core), yet p99 latency rises from 80ms to 600ms whenever traffic increases slightly, and GC pauses are unusually long. The team plans to optimize the code. What do you suspect and how do you verify it?',
    a: `**Summary:** I suspect **CPU throttling** due to the CFS quota: a 1-core limit means that in each 100ms period the container may consume only 100ms of CPU in total. A multi-threaded application (Tomcat, GC, JIT) can burn the whole quota within the first 25ms across 4 cores and then **be frozen for the remaining 75ms**, even though the per-minute average is only 35%. Verify with {{container_cpu_cfs_throttled_periods_total}} or {{cpu.stat}} in the cgroup; fix by raising or removing the CPU limit (keeping the request), tuning thread counts/GC accordingly, and alerting on the throttling ratio.

### Understand quickly
A CPU limit is like **a 100-minute movie ticket per show**, but you may use several seats at once. Put 4 people in at the same time and 100 person-minutes are gone after 25 minutes, and the whole group has to **step outside and wait** for the next show. Averaged over the day you use very little of the ticket, but exactly when you need it you get thrown out. The nice average hides those waits.

### Terms
- **CFS quota/period**: Linux gives a cgroup a CPU-time allowance (quota) per cycle (period, default 100ms). A 1-core limit = 100ms quota every 100ms.
- **Throttling**: the cgroup exhausts its quota before the period ends, so all of its threads are stopped until the next period.
- **CPU request**: the guaranteed CPU share, used for scheduling and for dividing CPU under contention; it does not cause throttling.
- **availableProcessors**: the number of CPUs the JVM thinks it has; in a container the JVM derives it from the quota (limit).

### Symptoms and numbers
- The node has 8 cores, the pod has limit 1 core, request 500m.
- Per-minute average CPU: 0.35 core. But {{rate(container_cpu_cfs_throttled_periods_total[5m]) / rate(container_cpu_cfs_periods_total[5m])}} = **45%**: nearly half of all periods are throttled.
- GC log: "Pause Young" pauses are 15ms normally, 120–250ms under load.
- {{java -XX:+PrintFlagsFinal -version}} inside the container: the JVM picks **SerialGC** because it sees fewer than 2 CPUs.

### Hypotheses and how to verify
1. **Quota-based throttling.** Enter the container: {{cat /sys/fs/cgroup/cpu.stat}} (cgroup v2) and look at {{nr_periods}}, {{nr_throttled}}, {{throttled_usec}}; run it again after 60 seconds and compute the deltas. Or use the cAdvisor metrics above.
2. **The JVM misreads its resources.** {{jcmd 1 VM.info}} or startup logs with {{-Xlog:os+container=info}} show the quota and the CPU count the JVM computed; with a 1-core limit, {{availableProcessors}} = 1, and the JVM defaults to Serial GC (a single GC thread, stop-the-world).
3. **Is the code actually slow?** Compare: run the same load test on a pod without a limit; if p99 goes back to 85ms, the problem is infrastructure, not code.

### Step-by-step mechanism
~~~text
Period 100ms, quota 100ms, the app has 4 threads running in parallel on 4 cores
0ms ─ 25ms : 4 threads x 25ms = 100ms CPU -> quota EXHAUSTED
25ms ─ 100ms: ALL threads stopped (throttled for 75ms)
=> an in-flight request gains up to 75ms; a running GC is stopped too
~~~
A request crossing a few throttled periods already gains hundreds of ms. Per-minute average metrics don't show it because total CPU stays low; that is why "35% and still slow".

### Fixes
| Approach | Effect | Caveat |
|---|---|---|
| Remove the CPU limit, keep an accurate request | no throttling, uses idle CPU on the node | needs policy approval; noisy neighbours controlled via request |
| Raise the limit (e.g. 2–4 cores) | sharply less throttling | costs namespace quota |
| {{-XX:ActiveProcessorCount=2}} | JVM picks G1, sensible GC/JIT thread counts | doesn't raise quota, only fixes the JVM's estimate |
| Reduce parallel threads (pool) | burns less quota at once | may reduce throughput |

For latency-sensitive services the common approach: request = true p95 usage (e.g. 1 core), limit removed or 2–4× the request; specify GC explicitly ({{-XX:+UseG1GC}}) instead of letting the JVM choose.

### Prevention
- Alert when the throttled-period ratio exceeds 10–20% for a sustained period.
- Put p99 latency, throttled ratio, and GC pause on the same dashboard.
- When sizing, measure **bursts** (p99 CPU per second), not only per-minute averages.

### Common mistakes
1. **Looking at average CPU and concluding "CPU is spare"**: throttling happens on a 100ms scale, invisible to per-minute metrics.
2. **A limit under 2 cores for a JVM app**: the JVM picks Serial GC, long pauses, which burns even more quota at exactly the sensitive moment.
3. **Optimizing code before measuring the infrastructure**: weeks lost while p99 doesn't move.

### 1-minute oral answer
"Low average CPU with high latency makes me suspect CFS CPU throttling: a 1-core limit is 100ms of CPU per 100ms, a multi-threaded app exhausts the quota early and is then stopped for the rest of the period. I check cpu.stat in the cgroup or the throttled-periods metric: 45% of periods are throttled. The JVM also sees only 1 CPU, so it picks Serial GC, which adds long pauses. I fix it by setting the request from p95, removing or raising the limit, specifying G1 and a suitable ActiveProcessorCount, and adding an alert on the throttling ratio."

> Senior tip: before letting the team optimize code because of p99, I always look at 3 charts: **throttled ratio, GC pause, connection pool wait**. In one project, just removing the CPU limit for 6 latency-sensitive services (keeping the request) brought p99 from 600ms down to about 90ms without changing a single line of code.`,
    follow: [
      "When you remove the CPU limit, how do you keep one pod from consuming the whole node?",
      "Why does the JVM pick Serial GC when the container has fewer than 2 CPUs?",
      "Should memory limits be removed like CPU limits? Why?"
    ]
  },
  'scenario-065': {
    q: 'The consumer group {{invoice-sync}} (6 instances, topic with 12 partitions) rebalances every few minutes, the lag grows from 0 to 2 million, and the log is full of {{CommitFailedException}}. Each message requires an external API call taking 0.5–1 second. How do you diagnose and fix this "rebalance storm"?',
    a: `**Summary:** a consumer fetches up to {{max.poll.records}} messages (default 500) per {{poll()}} call; processing 500 × 1 second = 500 seconds, exceeding {{max.poll.interval.ms}} (default 300,000ms = 5 minutes), so the client leaves the group on its own, causing a rebalance; the offsets of that batch cannot be committed ({{CommitFailedException}}), the batch is redelivered and the cycle repeats. Fix by **reducing the number of records per poll** so a batch's processing time sits far below the limit, speeding up processing (controlled parallelism, API timeouts), and only raising {{max.poll.interval.ms}} when you understand the consequences; use cooperative rebalancing and static membership to make rebalances less painful.

### Understand quickly
A consumer group is like **a team of workers sharing conveyor belts**. The supervisor (group coordinator) has a rule: each worker must **come back to the desk for work** at least once every 5 minutes, otherwise they are considered gone and the belts are reshuffled among the others. A worker grabs 500 parcels at 1 second each, taking 8 minutes to come back; the supervisor has already reshuffled the work, the worker's effort is not recognized, and the parcels have to be redone from scratch.

### Terms
- **Rebalance**: the group redistributes partitions among consumers; with eager rebalancing every consumer stops consuming.
- **max.poll.interval.ms**: the maximum time between two {{poll()}} calls; exceeding it makes the consumer be considered dead.
- **session.timeout.ms / heartbeat**: the heartbeat runs on a background thread and detects a dead process; different from the poll interval, which detects "the process is alive but stuck".
- **Static membership**: a fixed {{group.instance.id}} so a quick restart doesn't cause a rebalance.

### Symptoms and logs
~~~text
WARN  [Consumer clientId=invoice-sync-3, groupId=invoice-sync] consumer poll timeout has expired.
  This means the time between subsequent calls to poll() was longer than the configured
  max.poll.interval.ms, which typically implies that the poll loop is spending too much time
  processing messages. You can address this either by increasing max.poll.interval.ms or by
  reducing the maximum size of batches returned in poll() with max.poll.records.
ERROR CommitFailedException: Commit cannot be completed since the group has already rebalanced...
~~~
- Lag grows in steps; rebalances per hour: 15–20.
- The external API is called **duplicately** (the same invoiceId multiple times) because the batch is reprocessed.

### Hypotheses and how to verify
1. **Batch too large for the processing time.** Measure the processing time per batch (a self-recorded metric or a Micrometer timer around the listener) and compare it with 300 seconds.
2. **The external API is unusually slow** (p99 from 1 second to 10 seconds). Check the HTTP client metrics; without a timeout one hung request can occupy a whole minute.
3. **Rebalance caused by deploy/restart**, not by polling. Look at coordinator/consumer logs: is the leave reason "poll timeout" or "session timeout".
4. Check the group state: {{kafka-consumer-groups.sh --bootstrap-server kafka:9092 --describe --group invoice-sync}}, the CONSUMER-ID column keeps changing, LAG grows.

### Step-by-step mechanism
~~~text
poll() -> receive 500 records
process 500 x ~1s ............... 300s: exceeds max.poll.interval.ms
 -> client sends LeaveGroup, coordinator rebalances, partitions move to another consumer
finish at second 500 -> commitSync() -> CommitFailedException (no longer owns the partitions)
the new consumer starts from the last committed offset -> the 500 records are processed AGAIN -> slow again -> loop
~~~

### Fix
~~~yaml
spring:
  kafka:
    consumer:
      max-poll-records: 50                 # 50 x 1s = 50s, far below the 300s limit
      properties:
        max.poll.interval.ms: 600000       # raised deliberately, stuck detection is slower
        partition.assignment.strategy: org.apache.kafka.clients.consumer.CooperativeStickyAssignor
        group.instance.id: \${HOSTNAME}     # static membership (stable StatefulSet pod name)
~~~
- **Timeouts for the external API** (connect 2s, read 5s) and a circuit breaker: one hung call must not take the whole batch.
- **Controlled throughput increase**: raise the listener's {{concurrency}} up to the partition count (12), or process in parallel within a batch but **group by key** to keep ordering per invoice.
- **Idempotency** on the API caller side (send an idempotency key = invoiceId) because at-least-once always has duplicates.
- Kafka 4.0 has the new consumer group protocol (KIP-848, {{group.protocol=consumer}}) where the broker coordinates partition assignment, greatly reducing "stop-the-world" rebalances; both broker and clients must support it.

### Trade-offs
| Parameter | Raising it | Lowering it |
|---|---|---|
| max.poll.records | higher throughput per poll, easier to exceed the interval | safer, more round-trips |
| max.poll.interval.ms | tolerates slow batches | a truly stuck consumer is found faster |
| concurrency | faster processing | useless beyond the partition count |

### Common mistakes
1. **Only raising max.poll.interval.ms to 1 hour**: rebalances stop, but a truly stuck consumer holds partitions for an hour with nobody noticing.
2. **Processing async inside the listener and returning immediately**: offsets commit before processing finishes, losing messages on a crash.
3. **Static membership with duplicate IDs** across two pods: one instance gets fenced repeatedly.

### 1-minute oral answer
"The poll timeout log together with CommitFailedException points straight at max.poll.interval.ms. Each poll fetches 500 records, each record takes 1 second, that's 500 seconds, exceeding the 5-minute default; the consumer is kicked out of the group, the batch cannot be committed and is reprocessed, forming a loop. I measure the time per batch to confirm. I reduce max.poll.records to 50, set timeouts on the external API, raise concurrency up to the partition count, make processing idempotent by invoiceId, and use cooperative sticky plus static membership so rebalances during deploys are gentler."

> Senior tip: my rule of thumb is **p99 batch processing time ≤ 1/3 of max.poll.interval.ms**. Add "batch processing time" and "rebalances per hour" metrics to the consumer dashboard from day one; when rebalances > 0 outside deploy hours, that is an early warning before the lag explodes.`,
    follow: [
      "How do session.timeout.ms and max.poll.interval.ms detect two different kinds of failure?",
      "How is cooperative rebalancing different from eager rebalancing?",
      "How do you process in parallel within a partition while still keeping ordering by key?"
    ]
  },
  'scenario-066': {
    q: 'Partition 3 of topic {{orders}} has been stuck at offset 18,234 for 2 hours, its lag has grown to 400 thousand, while the other partitions are normal. The consumer log repeats the same JSON parse error every second. How do you handle this "poison message"?',
    a: `**Summary:** a bad message (poison message) makes the consumer fail forever at the same offset; because Kafka processes a partition sequentially, every message behind it is stuck. Verify with {{kafka-consumer-groups.sh --describe}} and read that exact offset; fix with **ErrorHandlingDeserializer** (parse errors no longer blow up inside {{poll()}}), **DefaultErrorHandler** with a bounded number of retries, and **DeadLetterPublishingRecoverer** to push bad messages to a DLT topic, classify errors that are not worth retrying, and have a process to review and replay the DLT.

### Understand quickly
A partition is like **a queue of people at a ticket gate**. One person has a torn ticket the machine cannot read; the staff keeps scanning it over and over while everyone behind waits. The right way: try a few times, and if it still fails, **send that person to a separate counter** (DLT) for later handling, and the queue keeps moving.

### Terms
- **Poison message**: a message that fails every time it is processed (malformed, violates data constraints).
- **DLT (Dead Letter Topic)**: a topic holding messages that could not be processed, with headers describing the error.
- **Retryable and non-retryable**: transient errors (DB timeout) are worth retrying; data errors (invalid JSON) will fail no matter how many times you retry.

### Symptoms and verification
~~~text
$ kafka-consumer-groups.sh --bootstrap-server kafka:9092 --describe --group order-svc
TOPIC  PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG     CONSUMER-ID
orders 2          991203          991210          7       order-svc-1-...
orders 3          18234           418901          400667  order-svc-2-...
orders 4          770012          770015          3       order-svc-3-...
~~~
1. Only one partition is stuck, CURRENT-OFFSET does not move: a clear sign of a poison message (if the whole group is slow, it is a throughput problem).
2. Read that exact message: {{kafka-console-consumer.sh --bootstrap-server kafka:9092 --topic orders --partition 3 --offset 18234 --max-messages 1}}. You see a truncated payload or an old producer sending {{amount}} as the string "1,000".
3. Repeated log: "SerializationException: Error deserializing ... at offset 18234". The error happens **inside {{poll()}}**, before reaching the listener code, so your handler cannot catch it.

### Mechanism of the stall
~~~text
poll() -> deserialize offset 18234 -> exception
offset is not committed -> the next poll reads 18234 again -> exception -> ...
Kafka does not allow "skipping ahead" within a partition: 18235.. must wait
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
    // Send bad messages to "orders.DLT", by default with the same partition count as the source topic
    var recoverer = new DeadLetterPublishingRecoverer(template);
    // 1 initial attempt + up to 3 retries, 1 second apart; then move to the DLT and continue
    var handler = new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 3));
    handler.addNotRetryableExceptions(ConstraintViolationException.class); // data error: do not retry
    return handler;
}
~~~
- {{ErrorHandlingDeserializer}} wraps the real deserializer; on a parse error it returns null with error information in the header, and the error handler receives the exception so it can route to the DLT. {{DeserializationException}} is in the non-retryable group by default.
- Spring Boot automatically wires the {{CommonErrorHandler}} bean into the default container factory.
- The DLT topic must exist with **at least as many partitions as the source** (the recoverer keeps the same partition count by default).

### Handling during the incident
- If the fix cannot be deployed yet: stop the consumer group, use {{kafka-consumer-groups.sh --reset-offsets --to-offset 18235 --topic orders:3 --group order-svc --execute}} to skip exactly one message, **after saving that message's content**. This is a manual, approved operation, not a routine one.
- Tell the producer team to fix the source; determine how many messages share the same error.

### Prevention
- Schema Registry (Avro/Protobuf/JSON Schema) with compatibility checks so producers cannot send data that breaks the contract.
- Alert: **per-partition** lag unchanged for 10 minutes; number of messages entering the DLT > 0.
- DLT process: a dashboard to view messages and causes (exception headers), a tool to replay to the source topic after the fix.

### Common mistakes
1. **Infinite retry** ({{FixedBackOff}} with an unlimited count) for data errors: the partition is stuck forever.
2. **Catching and silently skipping** in the listener: no stall, but **data is lost** and nobody knows.
3. **A DLT with fewer partitions than the source**: publishing to the DLT fails, and you get stuck in the recovery step.

### 1-minute oral answer
"One partition frozen at one offset is the signature of a poison message. I use kafka-consumer-groups describe to see partition 3 stuck at 18234, read that exact message with the console consumer and see invalid JSON. Because the error blows up inside poll, the consumer re-reads it forever. I wrap the deserializer with ErrorHandlingDeserializer, configure DefaultErrorHandler to retry 3 times then push to a DLT, and mark data errors as non-retryable. Then I add per-partition lag alerts, DLT alerts and a replay process."

> Senior tip: distinguish **transient errors** from **data errors** in the design from the start: transient errors get retries with backoff (including retry topics), data errors go straight to the DLT. A DLT nobody reads is just a bin with storage cost; assign an owner and a handling SLA (e.g. within one business day) to every DLT.`,
    follow: [
      "How is a retry topic (non-blocking retry) different from DefaultErrorHandler's in-place retry, and how does each affect ordering?",
      "When replaying messages from the DLT, how do you avoid processing duplicates?"
    ]
  },
  'scenario-067': {
    q: 'Consumer lag on topic {{payment-events}} rises steadily every day during peak hours (from 0 to 700 thousand), only returning to 0 at night, and next week the peak is higher again. No errors, no rebalances. The team proposes "add more consumer pods". How do you analyze the processing capacity and what plan do you propose?',
    a: `**Summary:** lag rising steadily with no errors means the **arrival rate exceeds the processing rate** during peak hours. You need two numbers: messages arriving per second, and the group's maximum processing capacity = number of consumers **that actually own partitions** × (1 / processing time per message). Adding pods only helps while the number of consumers is below the partition count; if the bottleneck is the DB/API behind, adding pods makes it worse. Plan: measure, find the bottleneck, optimize processing (batching, removing redundant round-trips), and only then scale partitions/consumers deliberately, with lag alerts based on **time**.

### Understand quickly
Lag is like **a queue at the counter**. If 800 people arrive per minute while the counters serve only 600 per minute, the queue grows by 200 people every minute, even though nobody is doing anything wrong. Opening more counters only helps if there is room to place them (partitions) and **the warehouse behind** (DB) can keep up with the new counters.

### Terms
- **Lag**: LOG-END-OFFSET minus CURRENT-OFFSET (committed), i.e. the number of unprocessed messages.
- **Time-based lag**: how long the oldest unprocessed message has been waiting; more meaningful in business terms than a count.
- **Per-consumer throughput**: messages per second a single processing stream can handle, ≈ 1 / processing time per message.
- **Partition skew**: some partitions receive far more messages due to a hot key.

### Collected numbers
- Producer during peak: 800 msg/s (growing 10% per week with user growth).
- Topic with 12 partitions, the group has 12 consumer threads (concurrency 4 × 3 pods).
- Average processing time per message: 20ms (read 1 record, write 2 records, each statement a DB round-trip).
- Maximum capacity: 12 × (1000 / 20) = **600 msg/s**. Missing 200 msg/s, i.e. lag grows 720 thousand per peak hour, matching the observation.

### Hypotheses and how to verify
1. **Overall capacity shortfall** (as computed above). Verify: lag grows evenly across **all** partitions; the consumer's {{records-consumed-rate}} metric is flat at a ceiling of ~600 msg/s.
2. **Partition skew.** {{kafka-consumer-groups.sh --describe}}: if lag concentrates in 1–2 partitions, the issue is a hot key (e.g. one large merchant), and adding consumers doesn't help.
3. **Bottleneck behind.** Measure DB/API latency during peak; if the DB is already at 85% CPU, adding consumers only pushes latency up.
4. **Redundant consumers.** If consumer threads > partitions, the excess sit idle; check the CONSUMER-ID column for rows with no partition assigned.

### Plan ordered by cost
| Step | Example | Estimated effect |
|---|---|---|
| 1. Fewer round-trips | merge 3 SQL statements into 1 batch, upsert | 20ms down to ~8ms: 1,500 msg/s |
| 2. Batch processing | batch listener of 100 records, batch insert | another 2–5× if the DB can take it |
| 3. Parallelize within a partition by key | parallel consumer library, or group by key yourself | more throughput while keeping ordering by key |
| 4. Add partitions + consumers | 12 to 24 | doubles the ceiling, but changes the key mapping |

Adding partitions is the **last** step because: the partition count can only grow, never shrink; the {{hash(key) % partitions}} mapping changes, so new messages for the same key may go to a different partition while old messages are still unprocessed, breaking ordering during the transition. If you must, do it when lag is near 0 or move to a new topic with a plan.

### Batch listener example
~~~java
@KafkaListener(topics = "payment-events", batch = "true")
public void onBatch(List<PaymentEvent> events) {
    // 1 round-trip for the whole batch instead of 3 x N round-trips
    paymentRepository.upsertAll(events);   // JDBC batch / INSERT ... ON CONFLICT
}                                           // error mid-batch: use BatchListenerFailedException to point at the bad record
~~~

### Monitoring and success criteria
- Alert on **wait time** (e.g. oldest message > 5 minutes) instead of count; tools like Burrow or kafka-exporter + rate calculation.
- Dashboard: arrival rate, processing rate, lag per partition, DB latency.
- Capacity target: processing ceiling ≥ 2× the current peak to leave room for 10%/week growth and for "catching up" after an incident.

### Common mistakes
1. **Adding pods when consumers already equal the partition count**: costs money, no throughput gain.
2. **Raising concurrency when the DB is already saturated**: per-message latency rises, throughput barely changes, sometimes drops.
3. **Alerting on a fixed lag count**: 100 thousand messages can be 2 minutes on one topic but 3 hours on another.

### 1-minute oral answer
"Lag growing steadily with no errors is a capacity problem: 800 msg/s in, while 12 consumers at 20ms per message handle only 600 msg/s, missing 200 msg/s, exactly the lag growth rate. Adding pods is useless because consumers already equal the partition count. I check per-partition skew and DB load, then optimize in the cheapest order: batch the DB round-trips, batch listener, parallelize by key, and only then increase partitions because it changes the key mapping and cannot be reduced. I set alerts on wait time and target a processing ceiling of twice the peak."

> Senior tip: when leading a review of a "scale the consumers" proposal, I ask for a back-of-the-envelope calculation: **peak arrival, processing time per message, partition count, DB limit**. Often batching the DB round-trips alone gives 2–3× throughput, far cheaper than adding infrastructure and without touching message ordering.`,
    follow: [
      "How do you handle partition skew when one merchant accounts for 40% of traffic?",
      "What do you need to prepare before increasing the partition count of a running topic?",
      "How does a batch listener handle an error on a single record in the middle of a batch?"
    ]
  }
});
