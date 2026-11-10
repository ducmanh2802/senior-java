/*
 * English translation of js/data/q-scenario.js — task T966. Format: js/core/i18n.js (content overlay).
 * ids: scenario-117 scenario-118 scenario-119 scenario-120 scenario-121 scenario-122 scenario-123 scenario-124
 */
App.i18n.content({
  'scenario-117': {
    q: 'p99 latency of API increased 5x after new deploy, but CPU and RAM of pod remain normal. How do you investigate step by step?',
    a: `**Summary:** CPU and RAM normal but p99 increased 5x means requests are **waiting**, not **computing**: waiting for DB, connection pool, downstream service, lock, or GC pause. I anchor the timing, compare traces before/after deploy to find the span that widened, check pools and locks, then cross-check the deploy diff. If SLA is violated, **rollback first, investigate later**.

### Why CPU normal but still slow
Threads waiting for I/O or locks do not consume CPU. A service with 200 threads, if every request waits an extra 400ms for a DB connection, CPU stays at 20% but p99 spikes. p99 is especially sensitive to queues: when the pool is nearly full, a small fraction of requests queue for a long time while p50 barely changes — a classic sign of resource contention.

### Step-by-step investigation
1. **Anchor the timing**: overlay p50/p99/error rate against the deploy marker. p50 unchanged but p99 up → queue/lock; both p50 and p99 up → every request does extra work.
2. **Compare traces**: take the 20 slowest traces before and after deploy (Jaeger/Tempo/Datadog). Which span widened? Did the number of DB spans per request increase (sign of new N+1)?
3. **Connection pool**: metric Hikari {{hikaricp_connections_pending}}, {{hikaricp_connections_acquire_seconds}}. Pending > 0 for a long time → pool exhausted (long transactions, or HTTP call inside transaction).
4. **Downstream**: latency and timeout of each HTTP client; did the new version call an additional service?
5. **JVM**: GC pause p99 (GC log, JFR); thread dump several times 5 seconds apart — many threads {{BLOCKED}} on the same monitor is lock contention; with virtual threads check pinning via JFR event {{jdk.VirtualThreadPinned}}.
6. **Deploy diff**: code, config (timeout, pool size), library versions, migration (index dropped?), feature flag.

~~~seq
title: p99 up but CPU low
actors: Client | API | Hikari | DB
Client -> API: GET /orders
API -> Hikari: getConnection()
note Hikari: pool 10/10 busy, waiting 380ms
Hikari --> API: connection
API -> DB: SELECT (20ms)
DB --> API: rows
API --> Client: 200 after 420ms
~~~

### Real-world example
After a deploy, p99 of the order API went from 180ms to 950ms, p50 stayed around 60ms, CPU 25%. Trace showed DB span unchanged but a wait before the first span; Hikari pending metric rose to 30–40. Deploy diff: a developer added a fraud-check API call (about 300ms) **inside** a {{@Transactional}} method, so each request held the connection 5x longer, pool of 10 connections exhausted. Rollback in 8 minutes; fix moved the call outside the transaction, p99 back to 190ms. Then the team added an alert when {{connections_pending > 0}} for over 2 minutes.

### When to rollback immediately
- SLO violated and real users affected.
- No clear hypothesis in the first 10–15 minutes.
Rollback first shortens impact time; the bug can still be investigated on staging with the same load, or from collected traces.

### Pitfall
- Increasing pool size to "fix" — DB gets more load, problem moves elsewhere.
- Only looking at average (avg) — hides the p99 tail.
- Starting from heap dump when the symptom is I/O wait.
- No pre-existing trace/metric pool → wasting hours guessing.

### Sample interview answer
"CPU and RAM normal but p99 up means requests are waiting, not computing. First I check whether SLO is violated: if real users are affected and I don't have a clear hypothesis yet, I rollback first. In parallel, I compare p50 vs p99: p50 flat but p99 up usually means a queue, like pool exhaustion or lock. I compare slowest traces before and after deploy to see which span widened or if there are extra DB spans, check Hikari pending metric, latency of each downstream, GC pause, and several consecutive thread dumps to find BLOCKED threads. Finally I cross-check the deploy diff: code, timeout config, pool, library versions, migration. Once I had exactly this case: someone added a 300ms HTTP call inside a transaction, pool exhausted, p99 from 180 to nearly 1 second. Moving the call outside the transaction brought p99 back to normal."

> Senior tip: every service dashboard should have three charts side by side — p50/p99, pool pending, and GC pause — with a deploy marker line. With those three charts, 80% of "slow but CPU low" incidents are pinpointed within minutes.`,
    follow: ['How to detect I/O wait in JVM using which tool?', 'When to rollback vs continue debugging?']
  },
  'scenario-118': {
    q: 'A downstream service slow bringing down the whole system (cascading failure): signs and how to stop the spread?',
    a: `**Summary:** Cascading failure happens when a slow dependency makes the caller hold threads and connections, pool drains, and the caller slows down too — gradually spreading to the gateway. Stop the spread with **short timeout with budget**, **circuit breaker** to fail fast, **bulkhead** to isolate resources by dependency, **intentional fallback**, **limited retry**, and **load shedding** at the entry point.

### Propagation mechanism, step by step
1. Payment service slows from 100ms to 5s.
2. Order Service calls Payment without a reasonable timeout: each request holds a Tomcat thread (default max 200) for 5s.
3. At 100 requests/second, after about 2 seconds all 200 threads are waiting → Order cannot serve even APIs **unrelated** to Payment.
4. Gateway and services calling Order also start waiting → the whole system slows down.
5. Retry at each layer multiplies load on the already weak Payment → it cannot recover (retry storm).

### Signs to recognize
- Thread pool/connection pool of many services near max at the same time; queue growing.
- Latency increasing gradually along the call chain, originating from one dependency.
- Timeout errors rising while CPU of services remains low.

### Defense layers
| Mechanism | Stops what | Suggested config |
|---|---|---|
| Timeout | Thread held indefinitely | connect 1s, read ≈ normal p99 × 2–3 |
| Circuit breaker | Continuing to call a broken service | open when errors/slow > 50% in 20–50 calls |
| Bulkhead | One dependency consuming all threads | limit concurrent calls per dependency |
| Fallback | User getting a blank error | cached old data, default value, deferred processing |
| Limited retry | Transient network errors | max 2 attempts, backoff + jitter, only for idempotent calls |
| Load shedding | Overload at entry | return 503 early when queue exceeds threshold |

~~~java
// Resilience4j (Spring Boot 3): default order Retry(CircuitBreaker(Bulkhead(call)))
@CircuitBreaker(name = "payment", fallbackMethod = "paymentPending")
@Bulkhead(name = "payment")                 // max N concurrent calls to Payment
public PaymentResult charge(Order o) {
    return paymentClient.charge(o);         // client already sets read timeout 2s
}
PaymentResult paymentPending(Order o, Throwable t) {
    // do not fake success: record PENDING, process later via job/queue
    return PaymentResult.pending(o.id());
}
~~~
**Timeout budget**: if the gateway allows 3s total, downstream layers must have smaller timeouts (e.g. 2s, then 1s); a lower layer timeout longer than the upper layer is useless because the caller has already given up.

### Real-world example
On promotion day, the product recommendation provider slowed to 8s. The product detail page called it synchronously without a timeout; within 4 minutes all threads of Product Service were held, the checkout page (same service) returned 503, revenue for that hour dropped about 35%. After the incident: 300ms timeout for recommendations, bulkhead of 20 concurrent calls, fallback returning a cached "bestsellers" list. Next time the provider is slow, the page still loads in 400ms, only the recommendation part is cached data; no one affecting checkout is impacted.

### Pitfall
- Retry at every layer: 3 layers × 3 attempts = 27 calls into a weak service.
- Fallback "faking success" for money operations → wrong data.
- Circuit breaker configured but no metric/alert when it opens → no one knows.
- HTTP call inside DB transaction → holds DB connection, spreads to DB.

### Sample interview answer
"Cascading failure is when a slow dependency makes the caller hold threads and connections, pool drains, and the caller slows down too, including APIs unrelated to the dependency. Signs are pools of many services all near max, latency spreading gradually along the call chain, CPU still low. To stop the spread I use several layers. Short timeout with budget: lower layer always smaller than upper layer. Circuit breaker to fail fast when the dependency is broken, giving it time to recover. Bulkhead so one dependency cannot consume all threads. Intentional fallback, e.g. cached data or pending status, never faking success for money operations. Retry only a few times, with backoff and jitter, and only at one layer to avoid retry storm. Load shedding at the entry point. Once a product recommendation provider slowed for 8 seconds and brought down the entire checkout page; after adding 300ms timeout, bulkhead, and fallback, when it slows again users barely notice."

> Senior tip: practice by injecting latency (Toxiproxy, chaos experiment) into each dependency on staging every quarter. Resilience configuration not tested is usually wrong on the day it needs to run.`,
    follow: ['What is a reasonable timeout for each case?', 'When circuit breaker is open, is traffic still sent?']
  },
  'scenario-119': {
    q: 'Lost update due to two people editing at the same time on production: find and handle it?',
    a: `**Summary:** Lost update is when two requests both **read** a value, both **compute** in the application, then both **write**, and the later write overwrites the earlier one — the DB reports no error. I confirm via log/audit and reproduce with concurrent tests, then fix in priority order: **conditional atomic UPDATE** → **optimistic locking ({{@Version}})** → **pessimistic lock ({{SELECT ... FOR UPDATE}})**, and correct wrong data via reconciliation.

### Mechanism, step by step
~~~text
t1  A: SELECT qty FROM inventory WHERE sku='X'   -> 10
t2  B: SELECT qty FROM inventory WHERE sku='X'   -> 10
t3  A: (application computes 10 - 3 = 7)  UPDATE ... SET qty = 7
t4  B: (application computes 10 - 5 = 5)  UPDATE ... SET qty = 5   <- A's 3 products lost
~~~
At READ COMMITTED (default PostgreSQL and many MySQL configs), both UPDATEs are valid: B waits for A to commit then overwrites. The error is that the computation happens **outside the DB**. With JPA it's very common: {{findById}} → modify field → {{save}} is exactly read-modify-write.

### Investigation on production
- Compare **audit log / history table** with current value: total shipments per order ≠ inventory difference.
- Find code sections "read → compute in Java → write" on data edited by many people at once (inventory, balance, reward points, order status).
- Reproduce: test firing 50 concurrent requests on the same key (CountDownLatch or k6), compare result with expected value.

### Three fixes
**1. Conditional atomic UPDATE** — best when computation can be expressed in SQL:
~~~sql
UPDATE inventory SET qty = qty - :take, updated_at = now()
WHERE sku = :sku AND qty >= :take;   -- 0 rows affected = not enough stock
~~~
DB locks the row while computing, so two commands cannot step on each other.

**2. Optimistic locking** — when logic is complex, conflicts rare:
~~~java
@Entity class Account {
  @Id Long id;
  BigDecimal balance;
  @Version long version;   // Hibernate adds "AND version = ?" to UPDATE
}
// If 0 rows updated -> ObjectOptimisticLockingFailureException (Spring)
// -> read again and retry up to 3 times, or tell user "data has changed"
~~~
With a web edit form, send {{version}} to the client and return 409 Conflict when different.

**3. Pessimistic lock** — when conflicts frequent and retry costly:
{{@Lock(LockModeType.PESSIMISTIC_WRITE)}} generates {{SELECT ... FOR UPDATE}}. Keep the transaction really short, set lock timeout, lock in a fixed order to avoid deadlock.

| Method | Suitable for | Risk |
|---|---|---|
| Atomic UPDATE | Add/subtract, conditional status change | Complex logic hard to write in SQL |
| Optimistic | Rare conflicts, edit forms | Hot key → continuous retry |
| Pessimistic | High conflicts, short operation | Waiting for lock, deadlock |

### Real-world example
A fashion shop running a flash sale: inventory display shows 0 but actual warehouse still has 47 items, and 12 orders sold beyond stock in another code. Audit showed code {{findBySku → setQty(qty - n) → save}}. At 300 requests/second on a few hot SKUs, lost update happened hundreds of times. Switched to conditional atomic UPDATE {{qty >= :take}}; ran a reconciliation job between inventory and shipment docs to fix old data. Next flash sale: 0 inventory discrepancy, order API p99 also dropped 30% because one SELECT was eliminated.

### Pitfall
- Believing {{@Transactional}} automatically prevents lost update — no, it still happens at READ COMMITTED.
- Adding {{@Version}} but merging DTO from client without carrying the old version → check is meaningless.
- Unlimited optimistic retry on hot key → DB load spikes.
- Fixing code but forgetting to correct already-wrong data.

### Sample interview answer
"Lost update happens when two requests both read a value, both compute in the application, then both write, and the later write overwrites the earlier one. At READ COMMITTED the DB does not report an error, so @Transactional alone is not enough. On production I detect it by comparing audit log with current value, and reproduce by firing many concurrent requests on the same key. My preferred fix is to push the computation into a single conditional atomic UPDATE, e.g. subtract stock with a condition that stock remains; if no row is updated, report out of stock. When logic is complex and conflicts rare, I use optimistic locking with @Version and bounded retry, or return 409 for edit forms. When conflicts are very high, I use SELECT FOR UPDATE with a short transaction. And always a reconciliation step to fix already-wrong data."

> Senior tip: grep the whole codebase for the "find → set → save" pattern on tables with quantity or balance columns. This is the most common lost update source in Spring Data applications, and usually finds several spots in the first pass.`,
    follow: ['What happens inside the DB engine with atomic UPDATE?', 'Optimistic lock vs pessimistic lock: when to choose which?']
  },
  'scenario-120': {
    q: 'Data migration of 500 million rows with zero downtime: how to design?',
    a: `**Summary:** There is no "single command" to safely migrate 500 million rows. I use the **expand → migrate → contract** model: add the new structure in a non-locking way (expand), **dual-write + batched backfill with checkpoint and rate limit**, verify data, switch reads to the new structure, then delete the old structure (contract). Every DDL has a short {{lock_timeout}} and retry; every step has an exit path.

### Why DDL on large tables is dangerous
At PostgreSQL, almost every {{ALTER TABLE}} needs an {{ACCESS EXCLUSIVE}} lock. The danger is not just the command runtime: the command **queues behind** a long transaction, and every SELECT/UPDATE arriving after it queues behind it → the whole table hangs even though the DDL only needs 10ms. So always set {{SET lock_timeout = '3s'}} and retry instead of waiting indefinitely.

### Operation classification (PostgreSQL 11+)
| Operation | Safety level |
|---|---|
| {{ADD COLUMN}} nullable or constant default | Metadata only, fast |
| {{CREATE INDEX CONCURRENTLY}} | No write lock; runs outside transaction; check index INVALID if failed |
| {{ALTER COLUMN TYPE}} (type change requires rewrite) | Rewrites the whole table — avoid, use new column + backfill |
| {{SET NOT NULL}} | Scans whole table — instead use {{CHECK (...) NOT VALID}} then {{VALIDATE CONSTRAINT}} |
| Add foreign key | {{NOT VALID}} first, {{VALIDATE}} later (no long write lock) |
MySQL 8: prefer {{ALGORITHM=INSTANT}}/{{INPLACE, LOCK=NONE}}; heavy changes use gh-ost or pt-online-schema-change.

### Example plan: change {{amount}} from INT to NUMERIC(19,4)
1. **Expand**: add column {{amount_v2 NUMERIC(19,4)}} (metadata-only).
2. **Dual-write**: release application writing to both columns (or trigger).
3. **Batched backfill**:
~~~sql
UPDATE payments SET amount_v2 = amount
WHERE id > :last AND id <= :last + 10000 AND amount_v2 IS NULL;
-- save :last to a checkpoint table; sleep 50–100ms between batches;
-- auto slow down when replication lag > 5s or DB CPU > 70%
~~~
4. **Verify**: count remaining NULL rows, compare {{sum(amount)}} with {{sum(amount_v2)}} per ID range.
5. **Switch reads** to the new column behind a feature flag; monitor for a few days.
6. **Contract**: stop writing to the old column, then delete the old column in a later release.

### Real-world example
Transaction table with 520 million rows, 1.8TB, needed to change money column type. First attempt using {{ALTER COLUMN TYPE}} on staging estimated table lock of 6–7 hours — impossible. Used expand/contract: backfill 52,000 batches × 10,000 rows, about 4,000 rows/second off-peak, automatically stops when replica lag exceeds 5 seconds; total 5 days. WAL increased by about 900GB so storage for WAL had to be increased and monitored closely. Result: zero minutes of downtime, total amount matched exactly across 5,200 ID ranges before switching reads.

### Pitfall
- One UPDATE for the whole table: huge transaction, bloat, replica falls behind by hours.
- Forget dual-write → new data generated during backfill is missing.
- Delete old column in the same release as the read switch → no rollback path.
- {{CREATE INDEX CONCURRENTLY}} failing midway leaves an INVALID index no one deletes.

### Sample interview answer
"With 500 million rows, I don't look for a single command that runs fast; I split into expand, migrate, contract. First I classify DDL: which operations change only metadata, which rewrite the whole table. Rewrite operations are replaced by adding a new column. Every DDL gets a lock_timeout of a few seconds and retry, because the biggest danger is a DDL command queuing behind a long transaction and blocking every query behind it. Then the application dual-writes to both old and new, and I backfill in batches of about ten thousand rows by primary key, with checkpoint so it can resume, with rate limiting and automatic stop when replication lag is high. Then I verify row counts and totals per range, switch reads to the new structure behind a feature flag, and only delete the old structure in a later release. I once did this for a transaction table over 500 million rows, running five days with zero minutes of downtime."

> Senior tip: rehearse the entire plan on a production-size replica first, and measure three numbers: backfill speed, WAL volume generated, replication lag. These three numbers determine the schedule and storage to prepare — guessing wrong on any one is an incident.`,
    follow: ['How to safely add NOT NULL constraint on PostgreSQL?', 'How does gh-ost work compared to native online DDL?']
  },
  'scenario-121': {
    q: 'Kafka consumer lag increasing non-stop during peak hours: cause and how to handle?',
    a: `**Summary:** Lag increasing non-stop means **ingress rate exceeds total processing capacity** of the consumer group. I measure the actual capacity of one consumer (messages/second and processing time per step), check partition distribution (skew), rebalance, and the bottleneck behind (usually the DB). Fixes in order: **reduce per-message processing time** (batch, drop unnecessary I/O) → **increase parallelism in the right place** → **add partitions/consumers** when truly needed.

### Capacity math
One consumer capacity ≈ 1000 / (processing time per message in ms). Each partition is read by only one consumer in the group, so:
~~~text
Group capacity = min(consumer count, partition count) × one consumer capacity
Example: 12 partitions, 12 consumers, 25ms per message -> 12 × 40 = 480 msg/s
Peak ingress 900 msg/s -> lag increases 420 msg/s, after 1 hour ~1.5 million messages
~~~
Adding a 13th consumer does nothing if there are only 12 partitions.

### Investigation
1. **Lag per partition** ({{kafka-consumer-groups --describe}}, Burrow, metric {{records-lag-max}}): lag even across all partitions → insufficient capacity; concentrated on a few partitions → **skew** due to hot key (e.g. a large merchant).
2. **Per-step processing time**: trace span or timer around DB call, HTTP call, serialization. Usually 80% is I/O.
3. **Rebalance**: repeating "Revoking partitions" log → consumer kicked out of group because one {{poll}} takes longer than {{max.poll.interval.ms}} (default 5 minutes), causing reprocessing and more lag.
4. **Downstream bottleneck**: DB CPU, connection pool, partner API rate limit.

### Handling
- **Batch**: listener receives a batch, writes DB with one bulk statement instead of 500 separate ones.
~~~java
@KafkaListener(topics = "payments", batch = "true", concurrency = "6")
void onBatch(List<ConsumerRecord<String, PaymentEvent>> records) {
    // group by key, one INSERT ... ON CONFLICT for the whole batch
    repo.upsertAll(records.stream().map(r -> toRow(r.value())).toList());
}   // offset commit after the whole batch completes (AckMode BATCH)
~~~
- **Drop unnecessary I/O**: cache lookup data, drop unnecessary synchronous calls.
- **Parallelism within partition preserving key order**: e.g. Confluent Parallel Consumer, or internal queue hashed by key.
- **Add partitions**: only when consumer count already equals partition count; note that messages with the same key may go to a different partition after adding partitions → loses ordering during the transition.
- **Skew**: change the key (add suffix to hot key if business allows), or separate stream for large customers.

### Real-world example
Consumer writing transaction history to PostgreSQL: lag rose to 2 million messages every night, cleared by 2 AM. Measured: 18ms/message, 15ms of that was individual INSERT; 12 partitions, 12 pods. Switched to batch of 500 messages + one multi-row INSERT: average 1.2ms/message, capacity increased about 15x with the same number of pods; peak lag no longer exceeded 5 seconds. No partitions added.

### Pitfall
- Adding pods beyond partition count — extra pods idle.
- Increasing consumers when the bottleneck is the DB → DB congests even more.
- Async processing then committing offset before done → message loss on crash.
- Alerting on message lag count instead of **time lag** ({{lag / processing rate}}).

### Sample interview answer
"Lag increasing non-stop means ingress rate exceeds the group's processing capacity, so I start with the math. How many milliseconds does one consumer take per message, multiplied by consumer count, but not exceeding partition count, because each partition is read by only one consumer. Then I look at lag per partition: even across all means insufficient capacity; concentrated on a few means skew from a hot key. I check rebalance logs, because one poll taking longer than max.poll.interval gets the consumer kicked out and causes reprocessing. Then I measure each step, and usually most of it is I/O to the DB. The most effective fix is usually batch: receive a batch of messages and write with one bulk statement. Once I did this, processing time dropped about 15x without adding partitions or pods. Only after optimizing processing and when consumer count equals partition count do I add partitions, and I must remember key ordering."

> Senior tip: set consumer SLO by **processing time lag** (e.g. "events processed within 30 seconds"), not message lag count. A million messages of lag can be 10 seconds with a fast consumer, or 3 hours with a slow one.`,
    follow: ['How to handle partition skew?', 'Does increasing partition count affect a running system?']
  },
  'scenario-122': {
    q: 'Personal data leak via logs: detect, handle, prevent recurrence?',
    a: `**Summary:** Detecting PII or secret in logs means treat it as **already leaked**. Order: **block the source** (hotfix to turn off/mask the log line) → **narrow scope** (restrict log access, identify who read) → **revoke/rotate** every leaked secret → **delete or obscure** data in every place logs flowed to → **assess notification obligation** under Decree 13/2023 on personal data protection or GDPR → **prevent recurrence** with centralized masking and automated checks.

### Why logs are a common leak point
- Dev logs raw request/response to debug: {{log.info(request)}} pulls ID number, card number, token.
- Lombok-generated {{toString()}} prints every field, including sensitive fields.
- Exception messages contain input values.
- Logs copied to many places: node files, Elasticsearch, S3 archive, APM tools, support tickets — deleting one place is not enough.

### Handling in order
1. **Block the source (first hour)**: hotfix to remove or mask the log line; if can't deploy yet, lower the logger level via Actuator {{/actuator/loggers}}.
2. **Narrow access**: temporarily lock the index/bucket containing sensitive logs, only for the investigation team; export the log system's audit log to find out who queried.
3. **Secret**: revoke and **rotate immediately** (API key, token, DB password) — deleting logs does not revoke the secret. Check for abnormal secret usage (CloudTrail, access log).
4. **Clean data**: delete or reindex with filter in Elasticsearch, delete S3 archive objects (note versioning and backups), delete in APM and tickets.
5. **Assess and notify**: data type, number of subjects affected, who accessed; coordinate with legal/DPO on notification obligation under regulations.
6. **Blameless postmortem** with concrete actions.

### Preventing recurrence
~~~java
// Hide sensitive fields from toString and JSON log
public record CustomerDto(
    String id,
    @JsonIgnore String nationalId,          // never serialize to JSON log
    String phone) {
  @Override public String toString() {      // don't let record print raw fields
    return "CustomerDto[id=" + id + ", phone=" + mask(phone) + "]";
  }
  static String mask(String p) { return p == null ? null : "*******" + p.substring(Math.max(0, p.length() - 3)); }
}
~~~
- Centralized masking at the logging layer (regex pattern for card number, ID/CCCD, email in layout/encoder) as the final safety net.
- Logging convention: only log ID and error code, not body; review checklist has a PII item.
- Automated scan: daily job to find PII patterns in logs, gitleaks in CI for secrets.
- Shortest possible log retention, role-based access.

### Real-world example
An e-wallet detected via a scan job: the eKYC API log recorded the raw body containing ID number/CCCD and base64 image for 9 days, about 41,000 records, flowing into Elasticsearch and S3 archive. Within 2 hours: hotfix removed body log, locked index, audit showed 6 internal accounts had accessed. Within 2 days: deleted data from Elasticsearch, S3 (including old versions), and APM; legal assessed reporting obligation. Then added centralized masking and daily scan job — the next 3 months detected 2 more phone number log spots before production.

### Pitfall
- Only deleting logs without rotating secrets.
- Forgetting copies: archive, backup, APM tools, screenshots in tickets.
- Manual masking at each log spot — new spots will be forgotten.
- Covering up the incident — violates regulations and loses trust when discovered later.

### Sample interview answer
"When I detect personal data or secret in logs, I treat it as already leaked and handle it as a security incident. In the first hour I block the source: hotfix to remove or mask that log line, or temporarily lower log level via Actuator. At the same time I lock access to the index and bucket containing the logs, and pull the audit to see who accessed. If it's a secret, I revoke and rotate immediately, because deleting logs does not revoke the secret. Then I clean data everywhere the logs flowed to, including Elasticsearch, S3 archive including old versions, and APM tools. Then I coordinate with legal to assess notification obligation under Decree 13. To prevent recurrence, I place centralized masking at the logging layer as a safety net, a convention to log only ID and error code, never body, and a daily PII scan job in logs plus gitleaks in CI."

> Senior tip: add an automated test that sends requests with fake card number and CCCD through the main APIs, then asserts the output log does not contain those strings. This test is cheap, runs in CI, and catches most sensitive-log bugs before production.`,
    follow: ['How to detect secrets committed early?', 'Which layer should PII be masked at in the application?']
  },
  'scenario-123': {
    q: 'Abnormally long GC pause under load: diagnose and handle?',
    a: `**Summary:** Long GC pause under load has four main root cause groups: **heap nearly full/leak** (Full GC), **excessive allocation rate** (GC can't keep up), **GC threads CPU-throttled** (container throttled, too little CPU), and **misconfiguration** (heap near container limit, wrong GC chosen). I read GC log + JFR, check CPU throttling, then handle by root cause: fix leak/reduce allocation first, then sizing and GC choice.

### Mechanisms to understand
- **G1** (default since Java 9): divides heap into regions; Young GC stops the world (stop-the-world) to copy surviving objects; pause target per {{-XX:MaxGCPauseMillis}} (default 200ms). If concurrent marking can't keep up clearing Old Gen → **Full GC** (Java 10+ is concurrent but still pauses long with large heap).
- **Pause proportional to live objects**, not garbage. Large heap cache makes each GC copy more.
- **Generational ZGC** (Java 21, enabled with {{-XX:+UseZGC -XX:+ZGenerational}}; default for ZGC from Java 23): pause under 1ms regardless of heap size, at the cost of more CPU and memory.

### Diagnosis
1. **GC log**: {{-Xlog:gc*,safepoint:file=gc.log:time,uptime,level,tags}}. Look for: "Pause Full", "To-space exhausted", heap after GC rising cycle by cycle (leak).
2. **Allocation rate**: JFR ({{jcmd <pid> JFR.start duration=120s filename=app.jfr}}) → Allocation section, see which method allocates most.
3. **CPU throttling in Kubernetes**: {{container_cpu_cfs_throttled_periods_total}} / {{container_cpu_cfs_periods_total}}. 30% throttling means GC threads are also paused mid-way → pause stretches many times.
4. **Safepoint**: long pause but GC log reports short GC time → time waiting for threads to reach safepoint (long counting loop, deoptimize event).
5. **Leak**: heap after Full GC still high and rising → heap dump ({{jcmd <pid> GC.heap_dump}}), analyze with Eclipse MAT (dominator tree).

### Handling by root cause
| Root cause | Handling |
|---|---|
| Leak / unlimited cache | Fix code, bounded cache (Caffeine maximumSize, TTL) |
| High allocation rate | Drop unnecessary object creation in hot loop, large stream, unnecessary log strings |
| CPU throttling | Increase CPU limit or drop limit keeping request; check {{ActiveProcessorCount}} |
| Heap near container limit | {{-XX:MaxRAMPercentage=70}}, leave room for metaspace, thread stack, direct buffer |
| Need low pause with large heap | Try Generational ZGC, re-measure p99 and CPU |

### Real-world example
Pricing service on Kubernetes: p99 rose from 120ms to 1.4s every peak hour. GC log had Young GC of 600–900ms, but heap after GC stable (no leak). Metric showed CPU throttling 45%: container limit 1 CPU, JVM sees 1 CPU so runs only 1 GC thread, and is also throttled. Meanwhile JFR showed a function building JSON log strings allocating 1.2GB/second. Increased limit to 2 CPU, dropped large log strings: allocation rate down to 350MB/second, Young GC down to 25–40ms, p99 back to 140ms. No GC change needed.

### Pitfall
- Increasing heap to "reduce GC" → each pause copies more, Full GC even longer.
- Copying tuning flags from the internet without measuring before/after.
- Forgetting heap is only part of JVM memory → OOMKilled by container.
- Switching to ZGC without adding CPU → concurrent GC eats application CPU.

### Sample interview answer
"Long GC pause I don't guess — I turn on GC log and JFR. I classify into four groups. One: heap nearly full or leak — I check if heap after each cycle keeps rising, whether there's Full GC; if so, take heap dump and analyze with MAT. Two: allocation rate too high — JFR shows which method allocates the most. Three: GC choked on CPU, very common on Kubernetes — I check CPU throttling metric, because GC threads paused mid-way makes stretch many times. Four: configuration — heap near container limit, or wrong GC chosen. I fix the root cause first, like leak, unlimited cache, or excess allocation, then adjust sizing and consider Generational ZGC if low pause with large heap is needed. Most recently, the real cause was a 1 CPU container throttled 45% plus a log function allocating over 1GB per second; fixing both brought Young GC from nearly 1 second to under 40ms."

> Senior tip: always place a **CPU throttling** chart next to the GC pause chart on the dashboard. In container environments, half of "GC slow" cases are actually "GC not allowed to run".`,
    follow: ['ZGC vs G1: when to choose?', 'How to read GC log effectively for beginners?']
  },
  'scenario-124': {
    q: 'Database deadlock spiking during peak hours: investigate and fix?',
    a: `**Summary:** Deadlock is a wait cycle: transaction A holds lock X waiting for Y, B holds Y waiting for X; DB detects and **aborts one side**. Spikes during peak because more transactions overlap. I get deadlock details from DB log to know **which statements and rows** form the cycle, then fix the root: **consistent lock ordering**, **short transactions**, correct index to avoid excess locking, and **bounded retry** for the aborted side.

### Mechanism, step by step
~~~text
T1: UPDATE account SET ... WHERE id = 1   -- locks row 1
T2: UPDATE account SET ... WHERE id = 2   -- locks row 2
T1: UPDATE account SET ... WHERE id = 2   -- waits for T2
T2: UPDATE account SET ... WHERE id = 1   -- waits for T1  => wait cycle
DB detects (PostgreSQL checks after deadlock_timeout = 1s) and aborts one transaction
~~~
Transfer A→B and B→A at the same time is the classic example: each transaction locks the source account first.

### Gathering evidence
- **PostgreSQL**: log automatically writes "ERROR: deadlock detected" with DETAIL of each process, lock type, statement per side. Enable {{log_lock_waits = on}} to also see lock waits longer than {{deadlock_timeout}} (sign of impending deadlock).
- **MySQL InnoDB**: {{SHOW ENGINE INNODB STATUS}} LATEST DETECTED DEADLOCK section; enable {{innodb_print_all_deadlocks}} to log every deadlock to error log.
- Application: count exceptions per statement (Spring translates to {{CannotAcquireLockException}}/{{DeadlockLoserDataAccessException}} depending on version and driver).

### Common causes and fixes
| Cause | Fix |
|---|---|
| Two threads lock the same row set in different order | Always lock in ascending id order |
| Long transaction (HTTP call, heavy processing inside) | Move I/O out, transaction only contains DB operations |
| UPDATE missing index → locks more rows than needed (MySQL gap/next-key lock) | Add correct index for WHERE condition |
| Foreign key: inserting child locks parent row in share mode | Consistent operation order, or update parent first |
| Large batch updating thousands of rows in random order | Sort by key before writing, split into small batches |

~~~java
@Transactional
public void transfer(long from, long to, BigDecimal amt) {
    long first = Math.min(from, to), second = Math.max(from, to);
    // lock in fixed order -> cannot create wait cycle
    Account a = repo.lockById(first);    // SELECT ... FOR UPDATE
    Account b = repo.lockById(second);
    // ... subtract/add money
}
~~~
Retry: the aborted side retries up to 2–3 times with random backoff (Spring Retry), only for idempotent operations. Retry is a safety net, not a fix.

### Deadlock vs lock wait timeout
- **Deadlock**: wait cycle, DB aborts one side immediately after detection.
- **Lock wait timeout**: just waits too long for a transaction holding a lock (e.g. hung transaction), no cycle.

### Real-world example
Wallet system: payday, deadlock from 2–3 up to 400/hour, 1.5% of transfer transactions failed. PostgreSQL log showed two UPDATE statements on the {{wallet}} table with ID pairs in reverse order — money transferring back and forth between family wallets. Code locked source wallet first, destination wallet second. Fixed to lock by ascending ID and added 2 retries: deadlock down to 0–1/hour, failed transactions under 0.01%.

### Pitfall
- Only adding retry and leaving the design — as load increases, retry also deadlocks.
- Raising isolation to SERIALIZABLE to "be safe" → serialization errors and more conflicts.
- Locking the whole table to avoid deadlock → throughput collapses.
- Not monitoring deadlock count over time → only know when customers complain.`,
    follow: ['How are deadlock and lock wait timeout different?', 'When is there a reason to use SERIALIZABLE?']
  }
});