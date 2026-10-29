/*
 * English translation of js/data/q-microservices.js — task T385. Format: js/core/i18n.js (content overlay).
 * ids: microservices-044 microservices-045 microservices-046 microservices-047 microservices-048 microservices-049
 */
App.i18n.content({
  'microservices-044': {
    q: 'The "server is in charge" spirit implies: user calls delete on n-items but server returns 200 when only 1 fails is a bug; you must return proper HTTP status codes for individual results (207/200/409/500), and share a common error envelope containing detail[]. Explain.',
    a: `**Summary:** "Server is in charge" means **the server decides and returns status codes that truthfully reflect reality**, so the client doesn't have to guess from the body. Deleting n items with one failure while returning **200** is a bug. The rule: all success → 200/204; mixed results → **207** with individual results; entire request violating business rules → **409**; transient server/downstream failure → **503/500**. Every error must use **a common envelope** (e.g., ProblemDetail, RFC 9457) containing a {{detail[]}} array listing individual ids, statuses, and reasons.

### Quick Understanding
You ask the post office to mail 5 packages. The clerk says "**OK, done!**" (200), but one package is actually returned because of a wrong address. You go home relieved, only to find out days later. A professional post office would give you **a receipt for each package** (207 + detail): 4 sent, 1 rejected due to wrong address (409), and if the entire logistics system is down, it tells you "cannot mail today, try again tomorrow" (503). The status code is **the large bold text on the receipt**: the client's software reads this first to decide whether to retry.

### Terminology
- **Status code**: A 3-digit HTTP response code; 2xx success, 4xx client-side error, 5xx server-side error.
- **207 Multi-Status**: Response containing individual results for parts of a batched request.
- **409 Conflict**: Request conflicts with current state (locked, dependencies).
- **503 Service Unavailable**: Temporarily unable to serve, usually accompanied by Retry-After.
- **Error envelope**: Unified JSON structure for all API errors.
- **ProblemDetail (RFC 9457)**: JSON standard for HTTP errors (type, title, status, detail, instance + extensions); natively supported by Spring 6.
- **Retryable**: Errors where retrying might succeed (usually 429, 503); business-logic 4xx errors are not.

### The "Server is in Charge" Principle
1. **Status code is the contract**: HTTP clients, gateways, retry policies, and monitoring rely on status codes, not the body. Returning 200 with {{"errors": [...]}} makes them think it succeeded. Why it's dangerous: no retries, no alerts, data discrepancies silently emerge.
2. **200 only if the entire operation succeeds.** If any item fails, it cannot be 200.
3. **Distinguish business errors from transient errors**: 409 (do not retry) is different from 503 (retry later). Returning 500 for business conflicts makes clients retry uselessly, increasing load.
4. **Always provide itemized details** so the client doesn't have to re-query everything.

### Status Table for Delete Batch
| Situation | HTTP status | Body |
|---|---|---|
| All deleted successfully | 200 (with body) / 204 (empty) | {"deleted": N} or empty |
| Mixed success and failure | 207 | {"results": [...]} per id |
| Request violates constraints (e.g., all ids locked) | 409 | envelope + detail[] |
| All ids do not exist | 404 (or 204 if delete is idempotent) | envelope |
| Downstream unavailable, nothing deleted | 503 | envelope + Retry-After |
| Unexpected error (bug) | 500 | envelope, no stack trace |

Rule of thumb: **If all items share the same outcome, use that status; if results are mixed, use 207**, and the true status of each item is in the detail.

### Common Error Envelope
~~~json
{
  "type": "https://api.example.com/errors/partial-failure",
  "title": "Partial failure",
  "status": 207,
  "detail": "3/5 deleted",
  "items": [
    {"id": "a1", "status": 200, "message": "ok"},
    {"id": "a2", "status": 409, "code": "LOCKED", "message": "locked by order #123"},
    {"id": "a3", "status": 503, "code": "DOWNSTREAM_UNAVAILABLE", "retryable": true}
  ]
}
~~~
- The detailed array (here {{items}}, many teams call it {{detail[]}}) must be present in all batch error responses.
- Each item has a **machine-readable error code** and a retryable flag, so the client doesn't have to parse strings.

### Implementation in Spring
1. Service returns individual item results (record {{ItemResult(id, status, code, message)}}).
2. Controller calculates the aggregate status based on the rules and returns {{ResponseEntity.status(...)}}.
3. Unexpected exceptions are mapped to 500 ProblemDetail by {{@RestControllerAdvice}}, logged as ERROR; business errors mapped to 4xx, logged as WARN.

### Common Mistakes
1. **Returning 200 with errors in the body**. Symptom: monitoring shows green, but users complain items aren't deleted. Fix: use 207 or the actual error status.
2. **Returning 500 for business conflicts**. Symptom: clients keep retrying, fake 5xx alerts. Fix: 409 with a clear error code.
3. **No itemized details**. Symptom: client has to re-query to see what remained. Fix: always return details by id.
4. **Inconsistent error body**. Symptom: frontend needs a different parser for every API. Fix: common envelope according to ProblemDetail.

### 1-Minute Interview Answer
"Server is in charge means the status code must truthfully reflect reality, because HTTP clients, retry policies, and monitoring only look at status codes. Deleting five items with one failure while returning 200 is a bug: nothing gets retried, and nobody gets alerted. My rule: all success is 200 or 204; mixed results use 207 with details per id; business rule violations use 409, which should not be retried; transient downstream errors use 503 with Retry-After. Every error uses a common envelope based on ProblemDetail, containing an array of details with id, status, error code, and a retryable flag. I enforce this contract via status code contract tests."

> Senior tip: Write contract tests for status codes, e.g., "5 ids, 1 locked, 1 missing, 3 valid → expect 207 with 5 detailed items". These tests are cheap but catch major regressions.`,
    follow: [
      'When to return 202 Accepted instead of 207 for delete batch?',
      'How should a client handle 207 for better UX?',
      'Should an error envelope also be used for success responses?'
    ]
  },
  'microservices-045': {
    q: 'Multi-tenancy rate limit & quota by tenant: token bucket per-tenant in Redis (Lua), "noisy neighbor" tenant needing limitation, advisory 429 with Retry-After + X-RateLimit-*; internal service calls using circuit-breaker.',
    a: `**Summary:** Use **token bucket per tenant** stored in Redis, updated via **Lua script** so "read-calculate-write" is atomic, ensuring a noisy tenant cannot exhaust shared connection pools, threads, and DB resources for everyone. When exceeding limits, return **429 Too Many Requests** with **Retry-After** and **X-RateLimit-*** headers; limits are set based on tiers (Free/Pro/Enterprise). For internal service-to-service calls, use tenant-based rate limiting at the gateway combined with **bulkhead + circuit breaker** per dependency at the service level.

### Quick Understanding
Each tenant has a **token bucket**: the bucket holds up to 100 tokens, refilled at 10 tokens/second. Each request consumes 1 token. Tenants using it steadily always have tokens; tenants bursting get to use 100 reserved tokens (burst), then must wait for tokens to drip back in. Run out of tokens, and you get told "come back in 2 seconds" (429 + Retry-After). Because every tenant has their own bucket, an API addict cannot drain tokens from others. Redis is the **common bucket holder** for all service instances, and the Lua script ensures no one "withdraws tokens twice simultaneously".

### Terminology
- **Rate limit / quota**: Speed limit (req/sec) / total usage limit in a period (req/month).
- **Token bucket**: Algorithm with capacity and refill rate, allowing short bursts.
- **Noisy neighbor**: Tenant using too many shared resources, slowing down others.
- **Lua script in Redis**: Script running atomically on the Redis server; no command can interleave.
- **EVALSHA**: Running a pre-loaded script by SHA code, avoiding resending the script every time.
- **429 Too Many Requests**: Status reporting the client sent too many requests.
- **Retry-After**: Header indicating how long the client should wait before retrying.
- **Fail-open / fail-closed**: When counters fail, pass requests / block everything.

### Token Bucket in Redis (Step-by-Step)
1. **Key** by tenant (and endpoint if needed): {{rl:<tenantId>:<endpoint>}} or {{rl:<tenantId>:global}}.
2. **Lua script** reads Redis time, token count, and last refill timestamp, adds tokens based on elapsed time (not exceeding capacity), subtracts 1 if sufficient, and writes back. Why Lua: If the app does GET then SET, two instances might see "1 token left" and both allow it.
3. **Result** returned: allowed or not, remaining tokens, milliseconds to wait.
4. **Gateway** acts on the result: allow, or return 429 with headers.

~~~text
-- KEYS[1]=bucket key, ARGV[1]=capacity, ARGV[2]=refill tokens/second
local cap  = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local t    = redis.call('TIME')                         -- Redis time, avoids clock skew between app instances
local now  = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)
local b    = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(b[1]) or cap
local ts     = tonumber(b[2]) or now
tokens = math.min(cap, tokens + (now - ts) * rate / 1000)
local allowed, wait = 0, 0
if tokens >= 1 then tokens = tokens - 1; allowed = 1
else wait = math.ceil((1 - tokens) * 1000 / rate) end   -- ms, integer
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], math.ceil(cap / rate * 1000) + 1000)
return {allowed, math.floor(tokens), wait}
~~~
Don't want to write it yourself: Spring Cloud Gateway has {{RequestRateLimiter}} with {{RedisRateLimiter}} (token bucket using Lua) and {{KeyResolver}} returning tenantId; or use Bucket4j with a Redis backend.

### Response when limited
~~~text
HTTP/1.1 429 Too Many Requests
Retry-After: 2
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1735689600
{"code": "RATE_LIMITED", "retry_after": 2, "limit": 100}
~~~
Client SDKs must respect Retry-After (with jitter), not retry immediately.

### Tiers per tenant
| Tier | Rate | Burst (capacity) |
|---|---|---|
| Free | 100 req/min | 20 |
| Pro | 1,000 req/min | 200 |
| Enterprise | 10,000 req/min or dedicated pool | per contract |
Tier is stored in tenant configuration (60s cache TTL); change tier to invalidate cache. Besides per-second/minute rate limits, **quotas** per month (for billing) should be counted separately, more accurately, asynchronously in DB.

### Internal calls and noisy neighbors at deep layers
- The gateway limits by tenant; inside the service, **bulkhead per dependency** (and potentially per tier) prevents a noisy tenant from exhausting thread/connection pools.
- **Circuit breaker** for service-to-service calls to fail fast when a dependency is weak; it protects the dependency, not fairness between tenants.
- Heavy background jobs (export, report) per tenant run through queues with tenant concurrency limits.

### Common Mistakes
1. **Limiting by IP instead of tenant**. Symptom: many tenants behind the same NAT blocked unfairly, or one tenant using multiple IPs bypasses it. Fix: Key by tenantId (and user if needed).
2. **Redis failure brings down the API**. Symptom: all requests fail because counter cannot be called. Fix: choose fail-open with alerts, plus local instance limits as a near-approximate backup.
3. **Wrong refill unit** (second vs minute). Symptom: actual limit off by 60x. Fix: automated tests counting requests in a time window.
4. **Global limit only, not per endpoint**. Symptom: tenant drains limit on heavy export endpoint, DB overloaded. Fix: specific limits (higher cost) for expensive endpoints.

### 1-Minute Interview Answer
"I use a per-tenant token bucket in Redis, updated by Lua script to make read-calculate-write atomic, using Redis time to avoid clock skew. Capacity allows bursts, and refill rate is the sustainable speed, both based on the tenant tier. Exceeding the limit returns 429 with Retry-After and X-RateLimit headers so the client SDK waits appropriately. On Spring Cloud Gateway, I use RedisRateLimiter with a KeyResolver by tenant. Inside the service, I add bulkhead per dependency and circuit breaker so a noisy tenant cannot exhaust pools. The trade-off is Redis dependency, so I choose fail-open with alerts and local limits as a fallback."

> Senior tip: Measure the "rate-limited requests / total requests" ratio per tenant. Tenants frequently hitting 429 need a tier upgrade or client optimization (batching, caching). Don't just block; reach out to customers.`,
    follow: [
      'Rate limit per-tenant vs per-user: when do you need both?',
      'Redis Lua script overhead vs check-then-set?',
      'Token bucket vs sliding window: which one for accurate billing?'
    ]
  },
  'microservices-046': {
    q: 'The multi-tenant DB paradox (not mandatory): compare operational cost & schema migration between "PG RLS", "schema-per-tenant", "database-per-tenant"; small formula.',
    a: `**Summary:** The paradox is: **database-per-tenant** isolates almost perfectly but requires operating N databases; **shared-schema** is cheap and one migration handles all, but security depends on query discipline; **PostgreSQL RLS** is the middle ground (shared table, DB-level policy). Simple formula: operational cost is proportional to **N (number of tenants) × M (number of migrations) × time per migration**, plus monitoring/backup cost per DB; data leakage risk is proportional to **N tenants sharing one table**. Choose based on tenant count, compliance requirements, and **team operational capacity**, often resulting in a **hybrid** model.

### Quick Understanding
Three housing options: **one house per guest** (DB-per-tenant), **one apartment per guest in the same building** (schema-per-tenant), **shared dormitory with lockers** (shared-schema + RLS). A private house is safest, but if you have only 2 maintenance staff looking after 500 houses, every house will eventually leak because they can't repair them in time: "perfect isolation" on paper becomes "poor safety" in practice. Dormitories are cheap and you repair the whole building at once, but if just one locker is broken, everyone's belongings might be stolen. Good managers **give VIPs private houses, and regular guests rooms with high-quality locks**.

### Terminology
- **DB-per-tenant**: Each tenant has their own database (or instance).
- **Schema-per-tenant**: Each tenant has their own schema in the same database.
- **Shared-schema + tenant_id**: All tenants share tables, distinguished by a tenant_id column.
- **RLS (Row-Level Security)**: PostgreSQL policy automatically filtering rows by tenant for every query.
- **N × M problem**: Migration runs = number of tenants × number of migrations.
- **Hybrid tenancy**: Combining models based on tenant tier.
- **AbstractRoutingDataSource**: Spring's DataSource picking the actual DataSource by key (e.g., tier/tenant) at runtime.
- **Blast radius**: Scope of impact when an issue occurs.

### Small Formula (Step-by-Step)
1. **Migration cost** ≈ N × M × t (t = time per run + error handling). Shared-schema: N = 1.
2. **Fixed operational cost** ≈ number of DBs × (monitoring + backup + upgrades + connection pools).
3. **Data leakage risk** ≈ number of tenants sharing a table × probability of a query missing a filter; RLS significantly reduces this.
4. **Team capacity** is the divisor: for the same cost, a team with better automation supports a larger N.

~~~text
Schema-per-tenant: 100 tenants × 20 migrations/mo = 2,000 runs/mo
  each 30s → ~17 machine-hours/mo, 1% failure → ~20 tenants needing manual fixing per month
Shared-schema:     1 × 20 = 20 runs/mo, but 1 query missing filter = leak all 100 tenants
DB-per-tenant:     100 DBs × (backup + alert + upgrade version) → automation is mandatory
~~~

### Detailed Comparison
| Criteria | DB-per-tenant | Schema-per-tenant | Shared + tenant_id | Shared + RLS |
|---|---|---|---|---|
| Isolation | almost total (incl. resources) | high (data), shared resources | logical | logical + DB policy |
| Infrastructure cost | very high | high | low | low |
| Migration | N × M | N × M | 1 × M | 1 × M + policy |
| Backup/restore 1 tenant | easy (dump 1 DB) | easy (dump 1 schema) | hard (filter tenant_id) | hard |
| Delete tenant (GDPR) | drop DB | drop schema | delete by tenant_id | like shared |
| Query across tenants (analytics) | hard (must aggregate) | hard | easy | easy (special role bypasses RLS) |
| Noisy neighbor | no | yes (shared instance) | yes | yes |
| Onboard tenant | provision new DB | provision schema + migrate | insert a row | insert a row |

### Decisions by Stage
1. **Beginning** (few tenants, low compliance): shared-schema + tenant_id, enable RLS early if using PostgreSQL; simple and cheap.
2. **Growth** (hundreds of tenants, customers demanding audits): shared + RLS + automated leakage anti-test; separate large tenants causing noisy neighbor issues to dedicated pools/DBs.
3. **Enterprise** (large customers demanding isolation, data residency, dedicated SLA): hybrid: large tenants have dedicated schema/DB, small ones shared; group tenants by schema version so migrations run in batches.

### Hybrid Implementation
- Router identifies tenant → tier → selects DataSource; Spring uses {{AbstractRoutingDataSource}} with key tier/tenantId (key from tenant context set in a filter).
- Hibernate 6 supports multi-tenancy by connection/schema ({{MultiTenantConnectionProvider}} + {{CurrentTenantIdentifierResolver}}) and by column ({{@TenantId}}).
- Migration: Flyway/Liquibase runs per schema/DB via a job with a tenant list, limited parallel execution, recording results per tenant.
- Centralized monitoring with tenant labels (Prometheus/Datadog), not N separate dashboards.

### Common Mistakes
1. **Hybrid router picks wrong DataSource**. Symptom: enterprise tenant writes to shared DB, or reads other tenants' data. Fix: test routing for every tier, missing tenant context is an error (fail-closed).
2. **No automation for N × M**. Symptom: every release takes all day to run migrations, some tenants on outdated versions. Fix: batch migration jobs, track schema_version per tenant, code compatible with multiple versions.
3. **Choosing DB-per-tenant "for security" when the team is small**. Symptom: backups for some DBs fail unnoticed, versions drift. Fix: separate only when genuinely requested and automation exists.
4. **N dashboards, N alerts**. Symptom: alert fatigue, missing real incidents. Fix: centralized monitoring with tenant labels, alerts based on SLOs.

### 1-Minute Interview Answer
"It's a trade-off between isolation and operational cost. DB-per-tenant isolates almost perfectly, making backup and tenant deletion easy, but migration is N times M, and each DB needs dedicated monitoring/backup; with a small team, this often makes the system less safe. Shared-schema only needs one migration, but a missing filter query leaks all tenants, so I enable PostgreSQL RLS and have automated anti-leak tests. I decide based on tenant count, compliance, and team capacity: start with shared plus RLS, separate large tenants into schemas or DBs when genuinely needed, and use AbstractRoutingDataSource to route, with batched migration jobs."

> Senior tip: When asked, don't just answer "DB-per-tenant for safety"; answer "decide based on tenant count, compliance, and operational capacity; start with shared-schema + RLS, separate large tenants into schemas/DBs when there's evidence (large customers requesting, audit compliance)". Answers showing trade-offs and transition roadmaps are senior-level.`,
    follow: [
      'Hybrid routing (enterprise DB dedicated, SMB shared) risks and how to test?',
      'Migration automation for schema-per-tenant: what tool do you use?',
      'When to migrate from shared-schema to schema-per-tenant?'
    ]
  },
  'microservices-047': {
    q: 'Kafka writes every message to disk, but a broker still handles hundreds of MB/s. Track a record from arriving at the leader to being read by a consumer: log segments, page cache, zero-copy, ISR, {{acks}} and {{min.insync.replicas}}. Which config determines data loss vs no loss?',
    a: `**Summary:** Kafka is fast because it only performs **sequential appends** to log segment files, allows the **OS page cache** to act as a buffer instead of JVM heap, sends data to consumers via **zero-copy (sendfile)**, and handles records in **compressed batches**. Durability doesn't come from fsync, but from **replication**: with RF=3, {{acks=all}} and {{min.insync.replicas=2}}, a record is only acknowledged when at least 2 replicas in the ISR have it, so losing 1 broker doesn't mean data loss.

### 1. Partition is a directory containing segments
Each partition on disk is a directory, e.g., {{orders-3/}}. The log is cut into several **segments**; the filename is the first offset in the segment:
~~~text
orders-3/
  00000000000000000000.log        <- data (sequential record batches)
  00000000000000000000.index      <- offset -> byte position (sparse index)
  00000000000000000000.timeindex  <- timestamp -> offset
  00000000000005242880.log        <- active segment being written
  00000000000005242880.index
~~~
- Only the **active segment** is written, always at the end of the file, which is sequential write, making it fast on both HDD and SSD.
- New segments are created when reaching {{segment.bytes}} (default 1 GiB) or {{segment.ms}} (default 7 days).
- Retention and compaction work on **entire closed segments**: deleting a file is much cheaper than deleting rows individually like in a database. Active segments aren't deleted, so topics with low traffic can keep data longer than {{retention.ms}}.
- Consumer reading offset 5,300,000: broker finds the segment with the largest base offset ≤ 5,300,000, consults {{.index}} to jump close to the byte position, then scans a short segment.

### 2. Why writing to disk is still fast
1. **Page cache**: Broker writes files via OS; data resides in page cache (RAM managed by the kernel), write command returns immediately **without fsync-ing** every message (Kafka lets the OS flush). Consumers reading just-written data read straight from RAM. The cache is outside the JVM heap, so no GC pressure, and persists after broker restart.
2. **Batch**: Producer sends batches of records; broker stores batches (even if already compressed) to disk and sends entire batches to consumers. No decompression, no transformation.
3. **Zero-copy**: During consumer fetch, broker uses {{FileChannel.transferTo}} (Linux {{sendfile}}): data goes from page cache directly to the socket, no copying through application memory.
~~~text
Regular read: disk -> page cache -> JVM heap -> socket buffer -> NIC  (4 copies)
sendfile:     disk -> page cache ----------------------------> NIC   (no JVM involvement)
~~~
Note: **TLS** requires data to be encrypted in the JVM before sending, so zero-copy is lost. That's why broker CPU increases significantly with TLS.
4. **Parallelism by partition**: Each partition is an independent log, potentially on different brokers.

### 3. Replication: ISR and high watermark
Each partition has 1 **leader** and multiple **followers**. Followers actively send fetch requests to the leader to pull data (like a consumer).
- **ISR (in-sync replicas)**: Set of replicas catching up with the leader. Followers not catching up within {{replica.lag.time.max.ms}} (default 30s) are dropped from the ISR.
- **High watermark (HW)**: Largest offset that all replicas in the ISR have. Consumers **only read up to HW**, so they never see records that could be lost during leader transition.
~~~text
leader    : 0 1 2 3 4 5      (LEO = 6)
follower A: 0 1 2 3 4 5      (LEO = 6)
follower B: 0 1 2 3          (LEO = 4)
ISR = {leader, A, B}  =>  HW = 4  => consumer reads offsets 0..3
~~~

### 4. acks and min.insync.replicas
| Producer Config | Leader acknowledges when | Risk |
|---|---|---|
| {{acks=0}} | don't wait | loss on any network error |
| {{acks=1}} | leader writes to its log | leader dies before follower copies: **lost** record already acknowledged |
| {{acks=all}} | all replicas **in current ISR** have it | safe, unless ISR shrinks to 1 |

Crucial point: {{acks=all}} means "enough current ISR", **not** "enough RF". If 2 followers are dropped from the ISR, the ISR is only the leader, and {{acks=all}} behaves like {{acks=1}}. {{min.insync.replicas}} prevents this: if the ISR is smaller than this value, the broker rejects the write with a {{NotEnoughReplicasException}}.

| RF | min.insync.replicas | Lost 1 broker | Lost 2 brokers |
|---|---|---|---|
| 3 | 1 | writeable, potential loss if leader dies next | writeable, high risk |
| 3 | **2** | **writeable, no loss** | stops accepting writes (safe) |
| 3 | 3 | stops accepting writes | stops accepting writes |

~~~java
@Bean
NewTopic orders() {
    return TopicBuilder.name("orders")
        .partitions(12)
        .replicas(3)                                            // RF=3
        .config(TopicConfig.MIN_IN_SYNC_REPLICAS_CONFIG, "2")   // need at least 2 replicas
        .build();
}
// producer: from Kafka 3.0, acks=all and enable.idempotence=true are default
~~~
Add {{unclean.leader.election.enable=false}} (default): prevent replicas outside the ISR from becoming leader, accepting temporary partition offline rather than silent data loss.

### Production Pitfall
- Auto-created topics use broker's {{default.replication.factor}}, defaulting to **1**: one disk failure = topic loss. Disable auto-creation or set default RF=3.
- Underestimating disk for replication: ingress 50 MB/s, retention 7 days ≈ 50 × 86,400 × 7 ≈ 30 TB, multiplied by RF=3 ≈ **90 TB** cluster-wide, excluding overhead.
- Over-allocating JVM heap (e.g., 32 GB on a 64 GB machine) steals RAM from page cache. Brokers typically need only a few GB of heap; leave the rest for the OS.
- Consumers reading old data (replay several days) not in page cache read from actual disk, pushing hot data out of cache, slowing down realtime producers and consumers.

> Senior tip: Alert on **UnderReplicatedPartitions > 0** and **UnderMinIsrPartitions > 0**; these are the earliest signals before the producer starts receiving {{NotEnoughReplicasException}}. When benchmarking, compare throughput with/without TLS, and measure the p99 latency of {{acks=all}}, because it depends on the slowest follower in the ISR, not the leader.`,
    follow: [
      'Why Kafka doesn\'t fsync per message but is still durable? When would you consider more frequent flushing?',
      'ISR shrinks to 1 replica during peak time: what do producers, consumers, and on-call see?',
      'Enabling TLS increases broker CPU by 2x, how do you analyze and handle this?'
    ]
  },
  'microservices-048': {
    q: 'Producer sends 20,000 events/sec, each event 1 KB, but throughput is low and broker CPU high due to too many small requests. Explain the internals of {{KafkaProducer}} (partitioner, record accumulator, sender thread) and tuning {{batch.size}}, {{linger.ms}}, compression, {{max.in.flight.requests.per.connection}} without breaking ordering.',
    a: `**Summary:** {{send()}} doesn't send immediately: records are serialized, partitioned, and placed into **batches per partition** in the record accumulator; a separate **sender thread** groups batches that are full or have waited for {{linger.ms}} into requests sent to the broker. Increasing {{linger.ms}} (5–20 ms) and {{batch.size}} (64–256 KB) plus {{lz4}}/{{zstd}} compression results in fewer requests and better compression. Ordering is maintained via **idempotent producer** (default since Kafka 3.0) with up to 5 in-flight requests.

### Path of a Record
~~~text
your thread                                      sender thread (I/O)
send(record) --> serializer --> partitioner --> RecordAccumulator
                                                 orders-0: [batch filling]
                                                 orders-1: [batch full] [batch]
                                                 orders-2: [batch lingering]
                                                        |
                                    group batches by broker leader, send ProduceRequest
                                    up to max.in.flight requests un-acked / connection
~~~
1. **Serializer** converts key/value to bytes.
2. **Partitioner**: with a key, chooses partition by Murmur2 hash of key (same key same partition). **No key**? From Kafka 3.3, the producer uses a **sticky** strategy: fill a batch for one partition until full, then switch, yielding much larger batches than round-robin per record.
3. **RecordAccumulator**: each partition has a queue of batches. Total memory is limited by {{buffer.memory}} (default 32 MB); if full, {{send()}} **blocks** for up to {{max.block.ms}} (default 60s) before throwing an error.
4. **Sender thread** takes batches when full {{batch.size}} or waited for {{linger.ms}}, grouping batches for the same broker into one request.

### Why small requests slow things down
20,000 events/s × 1 KB = 20 MB/s. If {{linger.ms}} is near 0 and traffic evenly spread across 12 partitions, each batch has only a few records; the broker handles thousands of requests/s, each incurring fixed costs (headers, logging, replication, ack). With {{linger.ms=10}}, each 10 ms accumulates ~200 KB, resulting in only a few dozen large requests per second. Compression is also more effective since JSON repeats field names: larger batches → higher compression ratio (3–5x reduction is common with JSON, depending on data).

| Param | Default | Increasing it |
|---|---|---|
| {{linger.ms}} | 5 ms from Kafka 4.0 (0 before) | larger batches, slightly higher latency |
| {{batch.size}} | 16 KB | fewer requests, higher memory usage per partition |
| {{compression.type}} | none | reduces bandwidth and disk usage, adds producer CPU |
| {{buffer.memory}} | 32 MB | better burst handling before blocking |

~~~yaml
spring:
  kafka:
    producer:
      acks: all
      batch-size: 131072          # 128 KB
      compression-type: zstd      # or lz4 for less CPU
      properties:
        linger.ms: 10
        delivery.timeout.ms: 120000   # total allowed time, including retries
~~~

### Ordering and max.in.flight.requests.per.connection
Without idempotence, retries can break ordering:
~~~text
request 1 (offset expected 100-199) -> timeout, will retry
request 2 (200-299)                 -> succeeds, written first
request 1 retry                     -> written later  => order reversed
~~~
**Idempotent producer** ({{enable.idempotence=true}}) assigns a **producer id** and a **sequence number** per batch per partition. The broker only accepts batches with sequence numbers in the correct order; duplicate batches are discarded. This maintains order with {{max.in.flight.requests.per.connection}} up to 5 (default 5) and retries do not create duplicates.

From Kafka 3.0, idempotence is default, but it **automatically turns off** if you set conflicting configs without enabling idempotence explicitly (e.g., {{acks=1}}). It's best to explicitly set {{enable.idempotence=true}} and {{acks=all}}.

Transactions ({{transactional.id}}) go further: atomic writes to multiple partitions and consumer offset commits, used for consume-transform-produce in Kafka. They increase latency and only cover data within Kafka.

### Production Pitfall
- Calling {{send(...).get()}} per record: turns producer into synchronous mode, every record waits for one round of ack, throughput drops to hundreds/s. In Spring Kafka 3.x, {{KafkaTemplate.send}} returns {{CompletableFuture}}: handle results with a callback.
- Heavy work or blocking calls in the callback: callback runs on the sender thread, blocking it blocks all batches.
- Ignoring callback errors: after {{delivery.timeout.ms}}, record is dropped, only indicated via callback. No log = silent data loss.
- One hot key: batching doesn't help because records are doused into one partition, limited by one leader.

> Senior tip: Measure producer metrics {{batch-size-avg}}, {{records-per-request-avg}}, {{record-queue-time-avg}}, and {{compression-rate-avg}} before and after tuning. Average batch only a few KB is a sign {{linger.ms}} is too small; queue time approaching {{delivery.timeout.ms}} is a sign the broker or network is congested, increasing batch doesn't solve this.`,
    follow: [
      'Why does sticky partitioner apply only to records without keys?',
      'buffer.memory is full and send() starts blocking: how to handle this at the API layer?',
      'When do you accept disabling idempotence or lowering acks for latency?'
    ]
  },
  'microservices-049': {
    q: 'Team wants to use Kafka as a job queue (email sending, PDF rendering, jobs 1–60s) because "Kafka is already there". Why are traditional consumer groups not suitable for work queues? What do Queues for Kafka (share groups, KIP-932) solve, and what are their limitations?',
    a: `**Summary:** Consumer groups assign **entire partitions to one consumer** and store **one offset** per partition, so a slow job blocks everything behind it (head-of-line blocking), maximum workers = number of partitions, and there is no ack/retry/scheduling per message. **Share groups** (KIP-932) allow multiple consumers to fetch records from a partition and acknowledge **individual records**, but do not guarantee order, and are a new feature in Kafka 4.x, so verify release status before production use.

### Problem 1: Head-of-line blocking by partition
~~~text
partition 3:  [job A: 60s] [job B: 1s] [job C: 1s] [job D: 1s] ...
consumer-3 :   processing A ......................... B, C, D must wait
consumer-5 :   partition 5 empty, idling but cannot take jobs from partition 3
~~~
One partition has **one** consumer in a group. Job A renders a 60s PDF, so B, C, D wait 60s, even if other workers are idle.

### Problem 2: Scaling limited by partition count
12 partitions mean at most 12 consumers have work; the 13th pod idles. Jobs averaging 2 seconds mean max throughput is roughly 12 / 2 = **6 jobs/s**. To get 100 jobs/s, you need ~200 parallel workers: either increase to hundreds of partitions (high broker resources, cannot downscale), or handle parallel processing within the consumer, where you must manually track finished offsets.

### Problem 3: Offset is a pointer, not per-message ack
Offset commit means "everything before this offset is done". If record 100 fails but 101–150 are done, you **cannot** commit past 100. If the consumer crashes, 101–150 are reprocessed. There is no concept of "returning this job to the queue after 5 minutes". Retries, delays, DLQs must be self-built: retry topics, DLTs (Spring Kafka {{@RetryableTopic}}, {{DeadLetterPublishingRecoverer}}), each adding topics, consumers, and failure points.

| Work Queue Need | Consumer Group | Broker Queue (RabbitMQ, SQS) |
|---|---|---|
| Worker takes any job | no, bound by partition | yes |
| Ack/nack per message | no, offset only | yes |
| Retry after X min, DLQ | build yourself (sub-topic) | built-in (DLX, redrive policy) |
| Scale workers freely | max = partitions | yes |
| Preserve key order | **yes** | limited |
| Replay old jobs | **yes** | no (ack = gone) |

### Share groups (Queues for Kafka, KIP-932)
Idea: Add a new group type where consumers **share individual records** instead of partitions.
- Multiple consumers fetch from one partition; number of consumers **can exceed partition count**.
- Broker **lends (acquires)** a record to a consumer with a timeout key. If it expires before acknowledgment, the record is handed to another consumer, like SQS visibility timeout.
- Consumer acknowledges per record: **ACCEPT** (done), **RELEASE** (return to re-delivery), **REJECT** (cannot process, do not re-deliver).
- Broker counts **delivery attempts** per record; exceeding the limit causes the record to be skipped (archive), preventing infinite poison message loops.
- New Java client: {{KafkaShareConsumer}}.

Release status: Early access in Kafka 4.0, preview in 4.1. Before production use, read release notes and documentation for your specific cluster version to ensure stability and configuration requirements.

### Limitations to note in interviews
- **No order**: Records with the same key could be processed simultaneously by two consumers. Use consumer groups if key ordering is required.
- Number of in-flight records per partition is limited, so partition is still a limit of sorts.
- Records rejected or exceeding delivery attempts are just skipped; in original designs, they **do not** automatically move to DLQ, you still have to manually record failed jobs for investigation.
- No scheduled delivery (delay) or priority like specialized message brokers.
- Does not replace exactly-once consumer group transactions; processing is still at-least-once, handler must be idempotent.
- Ecosystem (frameworks, monitoring, managed services) needs time to provide full support.

### Recommendation
- Jobs that are already **events in Kafka** (e.g., order-created triggers email), short and steady: consumer groups + limited parallel processing + retry topics are enough.
- Long jobs, uneven time, need retry/delay/DLQ: use a message broker (SQS, RabbitMQ) or job table in DB; use Kafka as source and bridge to a queue if needed.
- Kafka cluster already on a stable version supporting share groups and you accept losing ordering: share groups are worth trying, reducing one operational system.

> Senior tip: When the team says "Kafka is already there", ask 3 questions: how long is the longest job, is ordering needed, and who handles failed jobs. I once saw a 6-partition topic with 3-minute Excel export jobs: one Monday morning, 200 people clicked export, wait times hit 1 hour while 20 other pods sat idle; switching to SQS with 20 workers solved it.`,
    follow: [
      'How to handle parallel processing in a consumer while committing offsets safely?',
      'Share groups vs SQS visibility timeout: similarities and differences?',
      'When would you still choose consumer groups for jobs even with share groups available?'
    ]
  }
});

