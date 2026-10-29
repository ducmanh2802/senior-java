/*
 * English translation of js/data/labs-incident.js — task T449. Format: js/core/i18n.js (content overlay).
 * ids: lab-incident-010 lab-incident-011
 */
App.i18n.content({
  'lab-incident-010': {
    title: 'Deploying order-service with the pool raised to 40 leaves payment-service unable to open a connection: PostgreSQL runs out of max_connections',
    scenario: `**Context.** The **ShopVN** marketplace has several services sharing one PostgreSQL 16 (RDS db.r6g.4xlarge, {{max_connections = 400}}, {{superuser_reserved_connections = 3}}). On Kubernetes:
| Service | Pods | Hikari maximumPoolSize | Connections |
|---|---|---|---|
| order-service | 12 (HPA 12–16) | 10 | 120 |
| payment-service | 6 (HPA 6–10) | 15 | 90 |
| report-service | 2 | 20 | 40 |
| admin/batch | | | 10 |

Total before the incident: **260/400**. All services use Spring Boot 3.3, HikariCP 5.1 with the remaining defaults ({{minimumIdle}} not set, {{connectionTimeout = 30s}}, {{maxLifetime = 30 minutes}}).

**Event (28/10/2026).** At 19:55 order-service deploys **v2.14**. The PR contains a line changing {{maximum-pool-size: 10 → 40}} described as "fix Connection is not available errors during load test". At 20:00 the order-service HPA scales to 16 pods according to the peak-hour schedule. From **20:04**, **checkout fails 23%** of the time: payment-service reports that it cannot get a connection, and 2 new payment pods (from the HPA scale-out) go into CrashLoopBackOff. Oddly, order-service keeps running normally and DB CPU is only 22%.

**What you have.** PostgreSQL logs, payment-service logs, a {{pg_stat_activity}} snapshot, Hikari metrics and the timeline.`,
    questions: [
      'What is the root cause? Why is the service that fails (payment) not the one that was just deployed (order)? Cite evidence from the artifacts.',
      'Apply Little\'s law to the order-service numbers: how many connections does it actually need? Why does raising the pool to 40 not help, and even hurts?',
      'What do you do right now, and how do you redesign things so that one service cannot drain another service\'s connections?',
    ],
    hints: [
      'Add up the connections: 257 + 90 + 40 + 10 = ? Compare it with 400 − 3 reserved slots. Look at the state column for order-service: how many active, how many idle?',
      'When minimumIdle is not set, Hikari keeps minimumIdle = maximumPoolSize: each pod opens all 40 connections even when idle. A new payment pod needs at least 1 connection at startup; old pods progressively lose connections as maxLifetime expires.',
      'Little\'s law: busy connections = request rate × connection hold time. 1,800 req/s × 0.0035 s ≈ ? At the DB layer you can limit each role with ALTER ROLE ... CONNECTION LIMIT.',
    ],
    answer: `**Summary:** order-service v2.14 raised the pool from 10 to 40 without setting {{minimumIdle}}, so each pod **opens 40 connections up front even though it barely uses any**. The rollout plus HPA at 16 pods needs 640 connections, far beyond the budget. By 20:03:41 PostgreSQL had reached 397 application connections (400 minus 3 superuser slots) and started rejecting every new connection. order-service kept running because it had "claimed its seats" first; the victims were payment-service: new pods could not start, and old pods progressively lost connections as {{maxLifetime}} expired and could not reopen them. In reality order-service only needs about **6–7 busy connections for the whole fleet**. Fix: roll back, then set a **connection budget** per service ({{CONNECTION LIMIT}} per role, check replicas × pool in CI) and consider RDS Proxy/PgBouncer.

### Background: why PostgreSQL limits the number of connections
Each PostgreSQL connection is **a separate process** on the server (about 5–10 MB of RAM, plus {{work_mem}} while running a query). {{max_connections}} is the fixed number of seats in a "restaurant": when the seats run out, new guests are turned away immediately ({{FATAL: sorry, too many clients already}}); they do not queue. A connection pool (Hikari) on the application side is like a group of guests **holding seats for a long time**: it reserves N seats so it does not have to wait to open a connection (TCP + TLS + authentication, 20–50 ms).

The problem: the seats are **held**, not merely **used**. An idle connection still occupies one of the 400 seats.

### Root cause, step by step
1. **Hikari defaults to {{minimumIdle = maximumPoolSize}}** (a fixed pool). Raising max to 40 means every v2.14 pod that starts opens and **holds** 40 connections.
2. Budget: 400 − 3 = 397 seats. The other services hold 90 + 40 + 10 = 140 → order-service can have at most **257**. With 16 pods × 40 = **640**, it is certain to exceed that.
3. Rolling rollout: each v2.14 pod that comes up replaces a v2.13 pod (10 connections) that goes down. Six new pods are full at 40; the seventh gets only 7 connections before the DB runs out of seats (20:03:41): 6 × 40 + 7 + 10 (last v2.13 pod) = **257**. Total 257 + 90 + 40 + 10 = **397**, exactly the limit.
4. **Who gets hurt?** Services that need a **new** connection after that moment:
   - 2 new payment pods from the HPA (20:03:30): Hikari tries to open its first connection at startup, fails → {{Exception during pool initialization}} → the app exits → CrashLoopBackOff. The HPA adds pods but adds no capacity.
   - Old payment pods: connections reach {{maxLifetime}} of 30 minutes one by one (log at 20:05:11); Hikari closes and tries to reopen, gets rejected → the pool shrinks from 15 to 11 → requests wait 30 seconds and fail with {{(total=11, active=11, idle=0, waiting=43)}}.
   - order v2.14 pods from the 8th onward also CrashLoop, and the rollout sticks at 7/16.
5. DB CPU 22%: the DB is **not overloaded**, it is simply out of seats. 251/257 order-service connections are **idle**.

### Little's law: how many connections does order-service actually need?
Average busy connections = rate × hold time = 1,800 req/s × ~0.0035 s ≈ **6.3** for the **whole** fleet (matching {{active = 6}} in pg_stat_activity and {{hikaricp_connections_active}} ≈ 0.9/pod). Even multiplied by 3 for bursts, 12–16 pods × 10 connections = 120–160 is **far more than enough**. The "Connection is not available" error during the load test (3,000 rps concentrated on **2 pods**) came from the test environment, or from code holding a connection too long (calling HTTP inside a transaction): find that cause instead of raising the pool.

~~~text
A bigger pool does NOT mean faster:
 - the DB has 16 vCPU: only ~16-32 queries can usefully run in parallel
 - more connections => more processes, more context switches, more lock contention
 - an idle connection still takes 1 of the 400 seats => it "eats" another service's budget
~~~

### Evidence
- PR #4182 diff: **"maximum-pool-size: 40"**, no {{minimum-idle}}.
- pg_stat_activity 20:04:30: order-service **251 idle + 6 active = 257**; six v2.14 pods × 40, pod -6 with 7, the v2.13 pod with 10. Application total 397.
- Prometheus: {{hikaricp_connections_idle}} **39.1**, {{active}} **0.9**, {{usage_seconds p99 = 0.006}}.
- DB log: **"FATAL: sorry, too many clients already"** from 20:03:41; payment log: **"Exception during pool initialization"** (new pod) and **"total=11, active=11, idle=0, waiting=43"** (old pod) after the **"connection has passed maxLifetime"** line.
- Timeline: rollback at 20:18:40, checkout recovered at 20:24.

### How to fix
**Immediately:** {{kubectl rollout undo deployment/order-service}} (already done). Even faster if available: override the env var {{SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=10}}. If rollback is slow, you can {{pg_terminate_backend}} some idle order-service connections (Hikari will try to reopen up to 40, so this only buys a few minutes).

**Long term:**
- **A connection budget** per service, written down: {{maxReplicas × maximumPoolSize ≤ budget}}. For example order 16 × 10 = 160, payment 10 × 15 = 150, report 40, batch 20, total 370 < 397. Check it automatically in CI (read Helm values + HPA maxReplicas).
- **Bulkhead at the DB layer**: a separate role per service plus {{ALTER ROLE order_app CONNECTION LIMIT 160;}}. When order-service exceeds it, only **it** fails and payment stays safe.
- Set a small {{minimumIdle}} (for example 2–5) with {{idleTimeout}} so idle pods give connections back (trade-off: the first burst has to open new connections).
- At high pod counts: **RDS Proxy** or **PgBouncer** (transaction pooling) so thousands of app-side connections share a few dozen real ones. Note that transaction pooling does not preserve session state ({{SET}}, advisory locks); prepared statements are only safe with PgBouncer 1.21+ and {{max_prepared_statements}}.
- Review: every pool-size change must come with a Little's law calculation and the total budget.

### Prevention and monitoring
- Alert on {{sum(numbackends) / max_connections > 0.8}} (CloudWatch {{DatabaseConnections}}).
- Dashboard of the idle/active ratio by {{application_name}} (set {{ApplicationName}} in the JDBC URL for each service).
- Canary: deploy 1 pod first and compare how many extra connections it opens.

### Common mistakes
- Seeing "Connection is not available" and raising the pool: the usual cause is connections being held too long, not a small pool.
- Forgetting to multiply by the replica count and HPA maxReplicas, and forgetting that old and new pods coexist during a rolling update.
- Raising the DB's {{max_connections}} to 1,000: costs RAM, increases contention, and only moves the threshold.
- Blaming the service that reports errors (payment) without checking **who is holding** the connections.

### One-minute spoken answer
"Deploying order-service raised the pool from 10 to 40, and Hikari keeps a fixed pool by default, so every pod holds 40 connections even though it uses barely one. With the rollout and the HPA, order-service took 257 seats and, together with the other services, exactly 397 of 400, so PostgreSQL started rejecting new connections. Payment was hurt because new pods could not start and old pods lost connections as maxLifetime expired. Little's law shows order only needs about 6 busy connections for the whole fleet. I roll back immediately, then set a per-service connection budget, CONNECTION LIMIT per role for isolation, a small minimumIdle, and use RDS Proxy or PgBouncer as the pod count grows."

> Senior tip: I treat database connections as a **shared resource with a quota**, like CPU quota on Kubernetes. Every PR that changes pool size or HPA maxReplicas must update the budget table. A small pool is normal: a 16-vCPU PostgreSQL rarely needs more than 50–100 busy connections at once; if the app needs more, it is almost certainly holding connections while waiting for something else (HTTP, Kafka, locks).`,
    rubric: [
      'Identify the root cause: pool of 40 with minimumIdle defaulting to max, rollout + HPA pushing total connections to 397/400, PostgreSQL rejecting new connections',
      'Explain why payment was hurt: new pods fail pool initialization, old pods lose connections due to maxLifetime and cannot reopen; order had claimed seats first',
      'Cite evidence: 251 idle/6 active on order-service, 257 + 90 + 40 + 10 = 397, hikaricp idle 39.1/active 0.9, FATAL too many clients log',
      'Apply Little\'s law: 1800 req/s × ~3.5 ms ≈ 6 busy connections, a bigger pool does not help',
      'Propose: rollback, connection budget replicas × pool, CONNECTION LIMIT per role, small minimumIdle, RDS Proxy/PgBouncer, connection-ratio alert',
    ],
  },
  'lab-incident-011': {
    title: 'KEDA scales consumers from 3 to 24 pods, yet Kafka lag grows 4x: a rebalance storm caused by autoscaling',
    scenario: `**Context.** **notification-service** (Spring Boot 3.3, spring-kafka 3.2, kafka-clients 3.7) reads the {{order-events}} topic (**12 partitions**, Kafka 3.7) to send SMS/push notifications to customers. Each pod runs {{concurrency = 4}} consumers. Each message calls an SMS gateway (~16 ms), so each consumer handles about **250 msg/s**. {{partition.assignment.strategy}} and {{group.instance.id}} are not set (defaults are used).

Autoscaling uses **KEDA** (Kafka scaler): {{lagThreshold: 1000}}, {{minReplicaCount: 3}}, {{maxReplicaCount: 24}}, {{allowIdleConsumers: true}} (enabled to "be able to scale beyond the number of partitions"), plus an HPA scaleDown override of {{stabilizationWindowSeconds: 0}} "to save cost". A pod takes ~40 seconds to start.

**Symptoms (11/11 flash sale, 11:00).** Producers rise from 900 to **4,200 msg/s** in 10 minutes. KEDA scales to 24 pods within 30 seconds, but lag does not fall; it spikes, peaking at **1.39 million** by 11:10. Customers receive order-confirmation SMS 6–8 minutes late, and **18,400** customers receive the same SMS 2–3 times. After that, until 12:30, the pod count oscillates between 3 and 24 many times.

**What you have.** Broker logs (GroupCoordinator), one consumer's log, per-minute metrics.`,
    questions: [
      'Why does scaling from 3 to 24 pods not increase throughput, and instead make lag grow even faster? Calculate the consumer group\'s capacity ceiling.',
      'Explain the eager rebalance mechanism (range protocol) and why 18,400 SMS were duplicated. What do static membership and CooperativeStickyAssignor help with, and what do they not help with?',
      'How would you redesign the autoscaling and the consumers so the system can handle a flash sale at 4,200 msg/s?',
    ],
    hints: [
      'A partition is read by at most one consumer in the group. With 12 partitions and 4 consumers per pod, how many pods are enough to use every partition?',
      'Every new pod joining is one rebalance; with the range protocol (eager), ALL consumers must return their partitions and stop reading until the group stabilizes. Look at the consume msg/s column at 11:02–11:04.',
      'If a message already sent its SMS but the offset is not committed (ack-mode BATCH), then when the partition is revoked another consumer re-reads from the committed offset. Real capacity only grows by adding partitions or speeding up per-partition processing.',
    ],
    answer: `**Summary:** The group's maximum capacity is **locked by the partition count**: 12 partitions × 250 msg/s = **3,000 msg/s**, already reached with 3 pods × 4 consumers. Scaling to 24 pods only adds 84 **idle** consumers, and every pod join is an **eager rebalance**: all consumers give up their partitions and stop reading. 29 rebalances in 5 minutes drop throughput from 3,000 to 410–640 msg/s, so lag grows 4x. Partitions revoked mid-batch mean messages that already sent an SMS but were not committed get processed again → duplicate SMS. Scale-down without stabilization causes another wave of rebalances and flapping. Fix: cap replicas by the partition count, add partitions/increase per-partition throughput, use CooperativeStickyAssignor, make SMS sending idempotent, and dampen autoscaling.

### Background: partitions, consumer groups and rebalancing
- A topic is split into **partitions**. Within a consumer group, **each partition belongs to only one consumer** at a time (to preserve ordering). So the number of consumers doing work is at most the number of partitions. The 13th consumer onward just sits idle.
- **Rebalance** is the process where the group coordinator (one broker) redistributes partitions when a member joins or leaves. It is like reshuffling table assignments in a restaurant every time a new waiter starts a shift.
- **Eager rebalance** (RangeAssignor, RoundRobinAssignor): every consumer **gives back all** its partitions, waits for all members to rejoin, and only then receives a new assignment. During that time **the whole group stops reading**: "stop the world".
- **Cooperative (incremental) rebalance** (CooperativeStickyAssignor): only the partitions that **need to move** are revoked; the others keep being read.

Note: kafka-clients 3.x defaults to {{partition.assignment.strategy = [RangeAssignor, CooperativeStickyAssignor]}}, and the group uses the **first** strategy that all members support, i.e. **range (eager)**. The log confirms {{protocol='range'}}.

### Root cause, step by step
1. **11:00** producers at 4,200 msg/s > capacity of 3,000 msg/s → lag grows by 1,200 msg/s (72,000 after one minute, matching the table).
2. KEDA sees lag/1000 > 3 replicas, and {{allowIdleConsumers: true}} allows going beyond the partition count → desired 24. The HPA scales quickly from 3 to 24.
3. The 21 new pods start a few seconds apart (40-second startup); each pod joins with 4 consumers → the coordinator rebalances continuously: generation **1842 → 1871 (29 times)** in 5 minutes. Each one takes ~12 seconds ({{Preparing}} 11:01:47 → {{Stabilized}} 11:01:59) and every consumer stops reading.
4. Result: consumption drops to **640, 410, 520** msg/s (11:02–11:04) while production stays at 4,200 → lag grows ~3,600 msg/s, three times faster than before scaling.
5. Once stable, the group has **96 members** but only 12 hold partitions (log {{partitions assigned: []}}): throughput returns to exactly 3,000 msg/s, no more.
6. **11:21** lag drops below the threshold, {{stabilizationWindowSeconds: 0}} → scale 24 → 3 instantly → 21 pods send LeaveGroup → 17 more rebalances. Lag rises again (47,000 at 11:23) → scales up again → flapping until 12:30.

~~~text
Capacity = min(number of consumers, number of partitions) × throughput per consumer
3 pods  x 4 = 12 consumers, 12 partitions  => 12 x 250 = 3,000 msg/s
24 pods x 4 = 96 consumers, 12 partitions  => 12 x 250 = 3,000 msg/s  (+84 idle consumers)
                                             - time lost to rebalancing
~~~

### Why 18,400 duplicate SMS
With {{ack-mode BATCH}}, offsets are committed **after** the whole batch is processed (up to 500 records). When a rebalance revokes a partition mid-batch, records that already sent an SMS but were not committed are read again by the new consumer **from the last committed offset** → sent again. Log: **"SMS sent orderId=O-77120931 but offset 5518302 of order-events-6 not committed (partition revoked)"**. Kafka guarantees **at-least-once**, not exactly-once, for external side effects (sending an SMS). 29 + 17 rebalances times a few hundred in-flight records each adds up to tens of thousands of duplicates.

### Evidence
- Broker: **"generation 1842"** → **"generation 1871 ... with 96 members"**, reason **"Adding new member ... group instance id None"** (no static membership).
- Consumer: **"Revoke previously assigned partitions order-events-0"**, **"protocol='range'"**, **"partitions assigned: []"**; config {{group.instance.id = null}}, {{ack-mode = BATCH}}.
- Metrics: consumption 3,000 → 640/410/520 while rebalancing 8/9/7 times per minute; lag 144,000 → 1,172,000; 96 consumers but only 12 partitions.

### How to fix
**Immediately:** set {{maxReplicaCount: 3}} (= 12 partitions / 4 concurrency) and {{allowIdleConsumers: false}} so the group stabilizes and runs at the full 3,000 msg/s; the ~1.4 million lag backlog drains in about 11 minutes after production falls back to 900 msg/s.

**Increase real capacity (before the next flash sale):**
- **Add partitions** (for example 48). Note: adding partitions changes the key → partition mapping for new messages, so if you need ordering by {{orderId}}, do it during low traffic and accept or handle the transition window.
- **Speed up each partition**: send SMS asynchronously in batches (if the gateway supports a batch API), or process in parallel by key within a partition (for example the Confluent Parallel Consumer library) with a bounded concurrency limit.
- **{{CooperativeStickyAssignor}}**: when a member joins/leaves, only the partitions that need to move are revoked, and the other consumers keep reading. Moving from range to cooperative requires **rolling the deployment twice** (first pass: the list contains both, second pass: cooperative only); the client's current default configuration already is step 1.
- **Static membership** ({{group.instance.id}} = StatefulSet pod name): if a pod restarts and returns within {{session.timeout.ms}}, there is **no** rebalance. It helps rolling deploys, **not** scale-out (a new member still has to be assigned partitions).

**Autoscaling done right:**
- {{maxReplicaCount × concurrency ≤ number of partitions}}.
- scaleDown {{stabilizationWindowSeconds}} of 300–600 seconds, and a bounded scaleUp step; measure lag in **time** (lag / consumption rate) instead of message count.

**Preventing duplicates:** send SMS with an **idempotency key** ({{orderId + notification type}}) stored in Redis/DB ({{SET NX}} with a TTL) before calling the gateway; per-record acknowledgement ({{AckMode.RECORD}}) reduces the number of in-flight records but cannot replace idempotency.

### Common mistakes
- Believing "more pods means more throughput" with Kafka: the ceiling is the partition count.
- Enabling {{allowIdleConsumers}} to "be able to scale beyond partitions".
- Scaling down instantly to save cost, causing flapping and constant rebalancing.
- Trusting static membership to prevent rebalances during scaling.
- Assuming Kafka's duplicate protection saves you: external side effects must be idempotent on your side.

### One-minute spoken answer
"The topic has only 12 partitions and each pod runs 4 consumers, so 3 pods already use every partition; the ceiling is 3,000 msg/s. KEDA scaling to 24 pods only adds 84 idle consumers, but every join triggers an eager rebalance under the range protocol: all consumers stop reading. 29 rebalances in 5 minutes drop throughput to 400–600 msg/s and lag grows 4x. Partitions are revoked mid-batch, so messages that already sent an SMS but were not committed get re-read, causing duplicate SMS. I cap replicas by the partition count, add partitions and increase per-partition throughput, move to CooperativeStickyAssignor, add stabilization for scale-down, and use idempotency keys when sending SMS."

> Senior tip: For Kafka consumers, autoscaling on lag only makes sense **below the partition ceiling**, and every scale event carries a "rebalance tax". I usually pick 3–4x more partitions than peak demand from the start (partitions are cheap, changing them later is expensive), keep the consumer count fixed at a sensible level, and only autoscale further once cooperative rebalancing is enabled. One metric I always alert on: **rebalances per minute > 0 sustained** — that is almost always a disease, not load.`,
    rubric: [
      'Calculate the capacity ceiling: 12 partitions × 250 msg/s = 3,000 msg/s, already reached with 3 pods × 4 consumers; 24 pods only add idle consumers',
      'Explain eager rebalance (range protocol, all consumers return partitions and stop), citing 29 rebalances and consumption dropping to 410–640 msg/s',
      'Explain duplicate SMS from partitions revoked mid-batch with uncommitted offsets (at-least-once), and propose an idempotency key',
      'Correctly distinguish CooperativeStickyAssignor (incremental) from static membership (helps restarts only, not scale-out)',
      'Redesign autoscaling: maxReplicas × concurrency ≤ partitions, stabilization on scale-down, add partitions/increase per-partition throughput',
    ],
  },
});
