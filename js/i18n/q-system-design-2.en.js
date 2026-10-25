/*
 * English translation of js/data/q-system-design.js — task T195. Format: js/core/i18n.js (content overlay).
 * ids: design-008 design-009 design-010 design-011 design-012 design-013
 */
App.i18n.content({
  'design-008': {
    q: 'Design a real-time chat system: WebSocket, presence, message ordering and storage. How to handle disconnection and duplicate messages?',
    a: `**Summary:** Real-time chat consists of three independent parts: **connection** (WebSocket gateway holding millions of connections), **routing** (knowing which gateway the user is on to push messages), and **storage** (appending messages to conversations). Order only needs to be guaranteed **within each conversation**, not globally; messaging uses at-least-once + client dedup.

### Requirements
- **Functional:** 1-on-1 and group chat, instant send/receive, read receipt, online/offline, history, file attachment, push when offline.
- **Non-functional:** 10 million users concurrent, each with 1–3 connections; p99 send to recipient < 200 ms; no lost messages; history load < 500 ms for latest 50 messages.
- **Acceptance:** global order is not required; presence may lag a few seconds; messages may arrive duplicated under certain retries.

### Connection: WebSocket gateway
~~~text
Client --WebSocket--> Gateway node (holds socket)
                       |
                Session registry (Redis):
                userId -> [gatewayId, connId]
                      |
          +-----------+-----------+
          |                     |
    Message service      Presence service
          |
    Kafka / Redis Stream
          |
    Gateway target -> push down to socket
~~~
- Gateway **does not hold business logic**; only authenticates, holds socket, registers session, routes messages.
- Each gateway handles 100k–500k connections depending on RAM and file descriptors; scale horizontally by adding nodes.
- Sticky session at the load balancer or use a shared registry so any gateway can route a message to the right user.
- Heartbeat ping/pong every 30 seconds; if no response for over 60 seconds, close the socket and delete the session.

### Presence
Do not broadcast the status of each user online to the entire contact list every time. Approach:
- Store {{presence:userId = online}} with TTL 60 seconds, refresh per heartbeat.
- Anyone viewing presence queries only users who have the chat window open (tens of people), not the whole contact list.
- When offline, emit events to subscribers of that user (friends viewing the chat).
- Multi-device: online means **at least one** active session remains; key per device and merged.

### Message ordering
Only order within one conversation is needed. Solid approach:
1. Message service receives a message, assigns an **incrementing sequence number** to the conversation. Could use Redis {{INCR conv:seq:<id>}}, but must guarantee durability (if Redis is lost, sequences may regress).
2. Safer: DB/allocator assigns durable sequence per conversation, or use sortable IDs (Snowflake) with checks.
3. Store the message with {{(conversation_id, seq)}} as the primary key.
4. Client renders by the seq received; if a gap is detected, request the missing ones (gap detection).

Do not use client timestamps because phone clocks drift and may invert ordering.

### Storage
For chat, the access pattern is always "latest N messages of one conversation". Choose wide-column (Cassandra/ScyllaDB/HBase) or Postgres partition:
~~~text
partition key: conversation_id
clustering key: seq DESC
columns: message_id, sender_id, type, body, created_at, edited_at
~~~
- Reading the latest 50 messages is a small range scan, very fast.
- Large group conversations still use a single partition; if one conversation is too large (rare), split by month.
- Files/images stored in S3; messages only store metadata and signed URLs.

### Messaging flow
1. Client generates {{clientMsgId}} (UUID) and sends via WebSocket along with {{conversationId}}.
2. Gateway routes to Message service (via internal RPC or Kafka).
3. Message service checks rights, prevents spam, assigns seq, writes to DB, returns ack to sender.
4. Emits {{message-created}} events to gateways holding sessions of members.
5. Gateway pushes to client; client sends ack; if no ack within timeout, gateway retries.
6. Offline user: store in mailbox and send push notification.

### Duplicate prevention and message loss
- **At-least-once** at every leg. Client dedups per {{clientMsgId}}; server stores unique {{(conversation_id, client_msg_id)}} so retries don't create duplicates.
- **Bidirectional ack:** server acks once written durably; client shows state "sent/sent". If no ack, client retries with the same clientMsgId.
- **Reconnect:** client sends {{lastSeq}} received; server returns messages from {{lastSeq + 1}} (capped count, if too many load pages). This is a solid way to avoid losing messages after disconnection.
- Exactly-once is unnecessary: duplicates are rare and dedup much cheaper than trying to guarantee strictly.

### Large groups
Groups of 100k members (community channel) can't fan-out each person in a single request. Use the **pull model for large groups**: store a snapshot in the conversation, online clients get notifications "new message" then self-load. For smaller groups, push directly for low latency.

### Incidents and operations
| Incident | Impact | Mitigation |
|---|---|---|
| Gateway dies | Lost socket | Client reconnect with backoff + jitter, LB moves nodes |
| Stale session registry | Push routed to wrong node | Short TTL, delete on socket close, fallback to ask |
| Redis sequence lost | Duplicates/regression | Durable sequence from DB, or accept rebuild |
| Consumer slow | Messages delayed | Scale consumers, backpressure, prioritize 1-on-1 |
| Spam/flood | Overload | Rate limit per user, block before assigning seq |

> Senior tip: don't force WebSocket "stateless" by pushing everything through the database — you'll create millions of queries per second. What's needed is a **small centralized registry** (which gateway the user is on) plus gateways holding sockets in RAM; this proven model scales to tens of millions of connections。`,
    follow: [
      'How does end-to-end encryption affect the architecture?',
      'How to preserve message ordering when a conversation is moved between shards?',
      'If you need full-text search across chat history, which search engine integrate and sync how?'
    ]
  },
  'design-009': {
    q: 'Compare cache-aside, write-through and write-behind. How to handle cache stampede, hot keys and consistent invalidation?',
    a: `**Summary:** Cache-aside is the default for most systems: the app reads the cache itself, misses go to DB then set. Write-through writes both cache and DB immediately; write-behind writes cache then writes DB later (fast but risks data loss). Three problems always must be answered: invalidation, stampede (multiple requests missing simultaneously), and hot keys.

### Compare the three models
| Model | Write path | Pros | Cons | When to use |
|---|---|---|---|---|
| Cache-aside | Write DB, evict cache | Simple, cache holds used data | Has stale window, cold miss slow | Default, data read often |
| Read-through | App reads cache; cache loads from DB on miss | App unaware of DB | Need cache supporting loader | Library/infra ready |
| Write-through | Write cache + DB in same transaction | Cache always fresh, sees right after write | Slower, writing little-read wasteful | Data read immediately after write |
| Write-behind | Write cache, DB write async | Very fast, batched | **Data loss if cache dies**, complex | Counter, metrics, tolerate loss |

### Correct Cache-aside practice
~~~java
public User getUser(long id) {
    String key = "user:" + id;
    User cached = redis.get(key, User.class);
    if (cached != null) return cached;

    User user = repository.findById(id).orElseThrow();
    long ttl = 600 + ThreadLocalRandom.current().nextInt(60);
    redis.set(key, user, Duration.ofSeconds(ttl));   // jitter fights avalanche
    return user;
}

public void updateUser(User user) {
    repository.save(user);
    redis.delete("user:" + user.id());   // evict AFTER DB commit
}
~~~
Why **evict** instead of updating cache? Concurrent requests may update cache out of order vs DB, leaving stale data forever. Evict is simpler and the next read refills automatically.

### Invalidation pitfalls
1. **Evict before commit:** another request reads miss, fetches old data from uncommitted DB, then writes it back to cache — stale data lives on. Always evict **after** commit.
2. **Evict twice (delayed double delete):** evict after commit, then evict again after 500 ms to clean stale data that may have been written late. It's a mitigation, not a guarantee.
3. **CDC/binlog (Debezium):** listen for DB changes and evict cache — most reliable, decoupled from business code, but adds infra.
4. **TTL is a safety net:** every key should have TTL, even if you think invalidation is correct.

### Stampede (thundering herd)
When a hot key expires, thousands of requests hit miss and read the DB simultaneously. Three approaches:
- **Mutex/single-flight per key:** only one request loads, others wait or return stale data. Use {{SET lock:key NX PX 3000}}.
- **Probabilistic early expiration:** re-warm sooner with increasing probability near expiry.
- **Stale-while-revalidate:** serve expired data while a background worker refreshes.

Simple single-flight code:
~~~java
User loadWithLock(String key, long id) {
    if (redis.setIfAbsent("lock:" + key, "1", Duration.ofSeconds(3))) {
        try {
            User u = repository.findById(id).orElseThrow();
            redis.set(key, u, Duration.ofMinutes(10));
            return u;
        } finally {
            redis.delete("lock:" + key);
        }
    }
    sleep(50);
    return getFromCacheOrDb(key, id);
}
~~~

### Hot key
A key read hundreds of thousands of times/sec overloads a single Redis node.
- **L1 in-process cache** (Caffeine) TTL 1–5 seconds: cuts >90% requests to Redis.
- **Key replication:** create {{user:123:0..9}} with same value, read randomly — spreads load but invalidation must clear all 10.
- **Read from replica:** if read-only, add a cache-tier read replica.
- Identify hot keys via {{redis-cli --hotkeys}} or tracking latency per key.

### Penetration and avalanche
- **Penetration:** nonexistent keys queried repeatedly. Cache short null TTL, or use a Bloom filter to reject before touching DB.
- **Avalanche:** many keys expire together due to bulk loading. Add **jitter** to TTL: {{ttl = base + random(0, base × 0.1)}}.

### Consistency: choosing the level?
- Financial data, balances: **no cache** or very short cache with strict invalidation; read DB/ledger directly.
- Product catalog: cache 1–5 minutes, accept stale.
- Feature flags: cache locally + pub/sub for fast eviction.
Don't promise "cache is always correct"; state clearly **acceptable staleness latency** and how to measure.

> Senior tip: in production incidents, cache is usually the thing masking the error, not the root cause. I always prepare to **turn off the cache in 1 minute** (feature flag) to see whether the system can survive; if turning off cache crashes the DB, you didn't have a cache, you added a new death point。`,
    follow: [
      'How do you choose the TTL for data that is both needed freshly and read a lot?',
      'How to invalidate cache when data changes from a different service with no shared codebase?',
      'Compare Redis and in-process cache (Caffeine) on consistency and latency.'
    ]
  },
  'design-010': {
    q: 'Distributed lock: Is Redis Redlock truly safe? When to use ZooKeeper/etcd, and what problem does the fencing token solve?',
    a: `**Summary:** A distributed lock is only truly safe with **fencing tokens** — an incrementing number checked by the resource owner. Redis single-node with SET NX PX plus a token is sufficient for most needs to avoid concurrency. Redlock across multiple nodes reduces the risk of lost locks but still relies on clocks and cannot save a client after GC pause following lock expiry. For high correctness, prefer DB/optimistic locks over distributed locks.

### Why use a lock
Example: two instances running the same report job, or two requests subtracting stock simultaneously. Distributed locks give **mutual exclusion across processes** machines. But before using, ask: is there a way without a lock? Unique constraints, conditional updates, or partitioning by key are usually simpler and safer.

### Basic Redis lock
~~~text
SET lock:report:2026-10 "token-uuid" NX PX 30000
~~~
- {{NX}}: set only if absent — this is the "acquire" part.
- {{PX 30000}}: TTL 30 seconds to avoid deadlock if a process dies.
- {{token-uuid}}: value unique per acquire, used when releasing.

Releasing must verify the token; otherwise it deletes another's lock when the old one expires and the new one enters:
~~~text
-- KEYS[1]=lock key, ARGV[1]=token
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
~~~
Two separate GET then DEL is wrong; must be combined in Lua.

### The biggest problem: lock expiry while client still working
Classic scenario:
1. Client A acquires a 30-second lock.
2. A gets caught by a **stop-the-world GC** for 40 seconds (or slow network, VM hangs).
3. Lock expires, client B acquires and starts writing.
4. A wakes up, thinks it still holds the lock, and **overwrites** B's result.

Longer TTL doesn't fix this completely, only reduces likelihood. The watchdog (auto-renew) also can't save if the process hangs entirely.

### Fencing token
The right solution: each acquire assigns an **incrementing number** (counter from Redis/etcd/DB). Every write/operation carries this number; the target resource **rejects** numbers smaller than the largest one seen.
~~~text
A acquire -> token 33
A pauses ...
lock expires, B acquires -> token 34, B writes with 34 (storage remembers 34)
A wakes, writes with 33 -> storage rejects because 33 < 34
~~~
This is why Kleppmann says lock alone is insufficient for correctness; need storage supporting fencing verification. If the target resource can't verify the token (e.g., writing to S3), the lock doesn't protect against the pause scenario.

### Redlock and debate
Redlock: acquire across N=5 independent nodes, succeeds if ≥ 3 nodes confirm within less than TTL time; considered to hold the lock if remaining time > 0.
- **Supporters (antirez):** reduce dependency on a single node, tolerate node loss, fits when efficiency matters.
- **Opponents (Kleppmann):** still depends on **clocks and timing**, no fencing; a long client pause still overwrites; the system can lose the lock during network failures. Recommend systems with real consensus (ZooKeeper/etcd) and fencing.
Practical conclusion: Redlock is **not wrong** for the goal "reduce chance of two workers running concurrently", but **insufficient** for the goal "never overwrite". Don't use it for payments or stock unless there's a second bound.

### ZooKeeper / etcd
- **ZooKeeper:** creates **ephemeral sequential nodes**; smallest node holds the lock. Session death auto-removes the node. Watch to know when the lock is released. Is a consensus system (ZAB) so should support linearizable writes.
- **etcd:** lease + revision; acquire by transaction comparing revision; lease expiry removes the key. Fewer operations, easier operation within Kubernetes ecosystem.
- Common downsides: adding another cluster to operate, higher latency than Redis, much lower throughput.

### Choosing for each scenario
| Requirement | Rational choice |
|---|---|
| Avoid two jobs concurrent, rare overlap accepted | Redis SET NX PX + token + TTL |
| Leader election for scheduler | etcd/ZooKeeper lease, or DB advisory lock |
| Protect stock/payment | **No distributed lock**; conditional update + unique constraint |
| Absolute exclusion with verifiable token | Consensus + fencing tokens |
| Prevent message processing duplicates | Idempotency key, not a lock |

### Best practices
- TTL 3–5 times longer than expected processing time; auto-watchdog renew but **do not trust absolutely**.
- Always release in {{finally}} with Lua checking the token.
- Log {{acquire/release}} with the token and lock duration for investigation.
- If the lock is "nice to have" (just to reduce load), fail-open; if mandatory, must have a data-layer bound.

> Senior tip: the interview question I always ask is "what if the client holds the lock during a 40-second GC?". Someone answering "increase TTL" isn't enough; someone answering "fencing token at the storage layer" is a person who really operates distributed systems。`,
    follow: [
      'How to implement fencing tokens with a storage lacking version comparison support?',
      'When is Postgres advisory lock a better choice than Redis?',
      'How to monitor long-held locks without false positives?'
    ]
  },
  'design-011': {
    q: 'Explain CAP and PACELC. Which consistency model is suitable for a wallet, shopping cart, and news feed? Select the corresponding database.',
    a: `**Summary:** CAP says that when there is a **partition**, the system must choose between consistency and availability. PACELC adds: when **no** partition occurs, you still choose between latency and consistency. There is no "CA" in a real distributed system; only CP or AP during network partitions, and latency/consistency in normal conditions.

### What CAP accurately says
- **C (Consistency):** every read sees the newest write — in the sense of linearizability.
- **A (Availability):** every request to a live node returns a **response without error** (doesn't promise the newest data).
- **P (Partition tolerance):** the system keeps running despite network splits. In a real distributed system, P is **mandatory** because networks will fail; so effectively you choose C or A only when a partition occurs.

Common misunderstanding: "choose 2 of 3" as a fixed menu. Reality is **when P occurs**, you choose C (refuse/hang to not return wrong data) or A (return possibly stale data).

### PACELC
If **P**artition then choose **A** or **C**; **E**lse (normal) choose **L**atency or **C**onsistency.
- {{PA/EL}}: Cassandra, DynamoDB (default eventual) — prioritize availability and latency.
- {{PC/EC}}: Spanner, CockroachDB, etcd, ZooKeeper — prioritize consistency, pay for latency.
- {{PA/EC}}: configurable, e.g., MongoDB with write concern majority (EC) but still AP depending on config.
PACELC helps more than CAP because it addresses **99.99% of time with no partition** — latency becomes what users feel.

### Consistency levels
Ordered strong to weak:
1. **Linearizable:** like a single variable; reads see immediately after write. Most expensive.
2. **Sequential:** all nodes see the same order of operations, not necessarily real-time.
3. **Causal:** preserves causality (reply after question), allows unrelated concurrent.
4. **Read-your-writes:** writer sees its own writes.
5. **Monotonic reads:** never see older data than previous read.
6. **Eventual:** converges eventually, no promise when.

In practice, we rarely need linearizable for everything. Example: wallet balance needs read-your-writes; feed just needs eventual; shopping cart needs read-your-writes but not globally.

### Quorum
With a replicated N-node system: writes succeed when W nodes confirm, reads from R nodes. If **R + W > N**, the read and write sets overlap at least one node, so reads see the newest write (with condition versioning). Example N=3, W=2, R=2.

### Choose by requirement
| Data | Consistency needed | Choice |
|---|---|---|
| Wallet balance, ledger | Linearizable/strong, with transactions | PostgreSQL/MySQL, CockroachDB, Spanner |
| Orders, stock | Strong for conditional subtract | Postgres + conditional update; avoid eventual |
| Shopping cart | Read-your-writes, tolerate minor loss | Redis/DynamoDB, TTL |
| Sessions, tokens | Strong keyed-reads | Redis cluster, DynamoDB |
| News feed, timeline | Eventual a few seconds | Cassandra/ScyllaDB, Redis sorted set |
| Product search | Eventual, full-text needed | Elasticsearch/OpenSearch |
| Analytics, logs | Eventual, huge writes | ClickHouse, BigQuery, S3 + Athena |
| Config, feature flags | Read-your-writes, need fast | etcd/ZooKeeper or Redis + pub/sub |

### Decisions by example
**Wallet:** use Postgres with transaction, ledger append-only. Reason: losing a cent is legal trouble; consistency isn't traded for latency. If global scale is needed, use CockroachDB/Spanner but accept higher write latency.

**Shopping cart:** a user adding a product must see it immediately on their device (read-your-writes), but losing one item due to rare errors is annoying, not catastrophic. Redis/DynamoDB with 30-day TTL is reasonable; data may be eventual across devices.

**News feed:** a few seconds delay is fine. Cassandra for original posts, Redis sorted set for already-fan-out feeds. Don't use Postgres for feed storage due to write amplification and cursor pagination difficulty.

### Common traps
- **Reading from replica immediately after write:** replication lag 100 ms lets users see "lost" recently written data. Fix: read from primary a few seconds after write, or use session token/version.
- **Mixing sources:** write Postgres, read Elasticsearch, but index delays 5 seconds — users create then find nothing. Need "processing" notice or fallback read.
- **Confusing "eventual" with "never correct":** eventual needs a mechanism guaranteeing convergence (retry, anti-entropy, read repair). Without it, you lose data.

> Senior tip: when the interviewer asks about CAP, don't just define it then stop. Immediately say "for this problem, I accept staleness how long, because how the user feels it" — that's the answer of someone who designs products, not just reading books。`,
    follow: [
      'How to implement read-your-writes when the user reads from a replica in another region?',
      'If you need to change from eventual to strong consistency for a production table, how does the roadmap look?',
      'Explain how DynamoDB achieves strong conditional writes despite being an AP system.'
    ]
  },
  'design-012': {
    q: 'The system currently serves 1,000 users; your boss wants you prepared for 1 million. Draw the architecture roadmap by milestone, each milestone tied to the scaling signal you need?',
    a: `**Summary:** Scaling isn't making a Google architecture from day one, but solving the **next bottleneck at each milestone**. 1k users need a clean monolith and backups; 100k need stateless + cache + replicas; 1M need sharding, decoupling, multi-region. Each step must have **measurable signals** and operating cost that matches.

### Principles
1. **Measure before scaling.** Know p99, QPS, DB connections, CPU, slow queries. Without numbers, every change is guesswork.
2. **Scale along the cheapest axis first:** code/index → cache → replica → queue → shard → service.
3. **Keep deployment autonomy.** Don't split microservices just because it sounds modern.
4. **Every step has rollback.** Feature flag, dual-write, shadow reads.

### Milestone 1 — 1,000 users: get the foundation right
- One Spring Boot app + one Postgres (or MySQL), deployed as 1–2 instances behind a reverse proxy.
- **Automatic backup tested for restoration** (many teams skip this step).
- Indexes for the main queries, sensible connection pool (HikariCP 10–20 connections per instance).
- Structured logs, health checks, uptime alerts.
- Basic CI/CD, versioned migrations (Flyway/Liquibase).
**Not needed yet:** Redis, Kafka, microservices, Kubernetes. At this scale they only add risk.

Signal to continue: DB CPU > 60% regularly, p99 > 500 ms, deployments cause downtime.

### Milestone 2 — 10,000 users: split read load, add cache
- Redis for frequently read data (sessions, catalog, config). Cache-aside with TTL + jitter.
- **Read replica** for reporting and heavy queries; critical reads still go to primary.
- CDN for static assets; object storage (S3) for user files instead of storing in DB.
- Move background jobs to dedicated workers (email, reports) so they don't block requests.
- Add APM (Micrometer + Prometheus/Grafana or managed service), tracing for the core flow.

Signal: p99 read rises with traffic, low cache hits, background jobs eating CPU.

### Milestone 3 — 100,000 users: stateless + async + observability
- App **fully stateless** (sessions in Redis/JWT), scale horizontally behind a load balancer.
- Rate limiting at the gateway; circuit breaker for external dependencies.
- **Message queue** (RabbitMQ/Kafka/SQS) for asynchronous tasks: email, webhooks, image processing.
- Split databases by domain if needed (e.g., search to Elasticsearch), but remain a modular monolith.
- **Connection pooling at the proxy layer** (PgBouncer) because 20 instances × 20 connections = 400 connections, Postgres starts struggling.
- Set clear SLOs and alert on them, not individual CPU spikes.
- Regular load tests with realistic scenarios.

Signal: write exceeds one primary capacity, large tables (>100M rows) slow queries, deployments need downtime for migrations.

### Milestone 4 — 500,000 users: partition, planned sharding
- **Partition large tables** by time or tenant before thinking about sharding.
- Shard only when a primary isn't enough: choose **shard key** by the most frequent query, avoiding hotspots. E.g., shard by {{tenant_id}} rather than time.
- Split read models (CQRS) for heavy screens; sync via events.
- Split services by **business capability** with clear boundaries: auth, billing, notification. Each service owns its DB, communicates via API/events.
- **Idempotency and outbox** become mandatory with async.
- Strengthen security: secret manager, audit log, least privilege.

Signal: one service blocking the whole system when slow, team deployments clashing, DB cost scaling nonlinearly.

### Milestone 5 — 1,000,000 users: multi-region, cells
- **Multi-region:** start with active-passive (simple, RPO a few minutes), active-active only when truly needed and conflict-resolution solutions exist.
- **Cell-based architecture:** divide users into isolated cells, a failure in one cell doesn't spread everywhere.
- CDN + edge for static content; reads close to users.
- Data pipeline for analytics separated from OLTP (CDC → lakehouse).
- Chaos engineering, game days, runbooks for major incidents.
- Optimize cost: right-sizing, reserved instances, storage tiering.

### Summary table
| Milestone | Added | Removed/skip |
|---|---|---|
| 1k | Monolith, 1 DB, backup, CI/CD | No cache, no queue |
| 10k | Redis, replica, CDN, worker | No shard, no microservice |
| 100k | Stateless, LB, queue, PgBouncer, SLO | No too many services |
| 500k | Partition/shard, CQRS, domain services | No tech-layer split |
| 1M | Multi-region, cell, chaos, data platform | No active-active until needed |

### What's often missed
- **Operating cost rises faster than traffic.** Every component added is something to patch, backup, upgrade, and operate nights.
- **People are the bottleneck.** 3 engineers can't operate 20 microservices + service mesh. Pick architecture matching team size.
- **Old data.** Migrating 100 million rows runs in the background, batched, verified; never in one transaction.
- **Safe deployments:** blue-green/canary matter more than choosing a new DB technology.

> Senior tip: I always ask "if tomorrow traffic jumps 10x, what breaks first?" and prepare for the right thing. The team that answers with numbers scales better than the team with pretty architecture but doesn't know the real bottleneck。`,
    follow: [
      'How to convince your boss that microservices aren\'t needed at 100k users?',
      'When to choose sharding by tenant instead of user id?',
      'How to migrate 100 million rows to a new schema with almost no downtime?'
    ]
  },
  'design-013': {
    q: 'Design a distributed job scheduler handling tens of thousands of jobs per day and large batches. How to prevent duplicate execution and handle failing jobs?',
    a: `**Summary:** A distributed scheduler needs **durable truth** for scheduling and state, atomic **claim-job** (SELECT FOR UPDATE SKIP LOCKED), idempotent workers, and checkpoints for large batches. You can't guarantee exactly-once end-to-end; do at-least-once plus idempotent effects.

### Requirements
- **Functional:** cron jobs (every 5 min, every night), one-shot jobs after X minutes, retry on error, manual rerun, state tracking.
- **Non-functional:** 50,000 jobs/day (average < 1/s but concentrated at opening hours), batch 10 million records, no duplicate execution of one job at the same time, max job delay 1 minute, no lost jobs when a node dies.

### Architecture
~~~text
+-------------------+       +----------------------+
| Scheduler service | ----> |  job table (DB)      |
| (multiple inst.)  |       |  next_run_at, status |
+-------------------+       |  lease_until, shard |
          |                  +----------+-----------+
          | claim job                   |
          v                             v
+-------------------+       +----------------------+
|  Worker pool     | ----> |  business handler    |
|  (autoscaling)   |       +----------------------+
+-------------------+
          |
          v
   Kafka topic job-events -> monitoring / DLQ
~~~

### Job table
~~~sql
CREATE TABLE job (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  cron_expr    TEXT,                  -- NULL if one-off
  next_run_at  TIMESTAMPTZ NOT NULL,
  status       VARCHAR(20) NOT NULL,  -- PENDING, RUNNING, DONE, FAILED, DEAD
  attempts     INT NOT NULL DEFAULT 0,
  lease_until  TIMESTAMPTZ,
  worker_id    TEXT,
  payload      JSONB NOT NULL,
  idempotency_key TEXT NOT NULL,
  UNIQUE (idempotency_key)
);
CREATE INDEX idx_due ON job (next_run_at) WHERE status = 'PENDING';
~~~

### Atomic claim-job
Multiple scheduler instances query the table simultaneously. The correct way on Postgres (MySQL 8 also supports {{SKIP LOCKED}} but lacks {{RETURNING}} and doesn't allow subquery on the same table in UPDATE — must {{SELECT ... FOR UPDATE SKIP LOCKED}} then UPDATE in one transaction)：
~~~sql
UPDATE job
   SET status = 'RUNNING',
       worker_id = 'worker-7',
       lease_until = now() + interval '5 minutes',
       attempts = attempts + 1
  WHERE id = (
    SELECT id FROM job
     WHERE status = 'PENDING' AND next_run_at <= now()
     ORDER BY next_run_at
     LIMIT 1
     FOR UPDATE SKIP LOCKED
  )
RETURNING *;
~~~
- {{SKIP LOCKED}} lets multiple workers take different jobs without waiting.
- If a worker dies, {{lease_until}} expires and a reaper job puts the job back to PENDING (increments attempts).
- Don't hold the transaction long while running the job; only hold enough for claiming.

### Cron and next_run_at
- Don't let each node run cron independently (would duplicate). Only **one** process materializes cron into job instances, or use a DB unique key on {{(name, scheduled_at)}} to prevent duplication.
- Compute {{next_run_at}} in UTC and configured timezones; store UTC in the DB.
- Avoid "thundering herd" at midnight: add **jitter** when creating jobs (00:00–00:05) or split slots.
- Missed jobs (node down on restart): query jobs with {{next_run_at < now()}} and rerun, with a bounded window (e.g., only rerun within 1 hour).

### Leader election (if needed)
 Some jobs should only one node does: materialize cron, cleanup. Use：
- Postgres advisory lock，or
- etcd/ZooKeeper lease，or
- a {{leader_lease}} table with conditional update and TTL.
Need leader for claiming jobs — {{SKIP LOCKED}} is enough.

### Large batches: split to win
10 million records can't fit in one transaction or one job. Split into **partition/chunks**：
~~~text
Parent job (batch-2026-10-22)
 +-- chunk 0: ids 1..100000
 +-- chunk 1: ids 100001..200000
 ...
 +-- chunk N
~~~
- Each chunk is a child job, claimed independently, run in parallel.
- Each chunk writes **checkpoint** (last processed id/offset) to resume, not redo from scratch.
- Commit in batches of 500–1,000 records; avoid transactions of 10 million rows (bloat, locks, huge WAL).
- Limit concurrency so workers don't saturate source/destination DB.
- Track progress per chunk; parent job is DONE only when all chunks are DONE.

### Idempotency: the key of everything
Jobs may rerun due to retry, lease expiry, or manual run. Every handler must be safe on double-execution：
- Write with **unique job key** (e.g., {{(batch_id, record_id)}}) and use upsert/ignore.
- Or check state before acting: if already DONE, skip.
- External impacts (send email, call API) use the partner's idempotency key if available.
- If idempotent can't be done, write **intent** first then execute, with reconciliation.

### Retry, backoff, DLQ
- Classify errors: transient (timeout, 5xx, deadlock) → retry; permanent (data wrong, 4xx) → FAILED immediately.
- Backoff exponential + jitter; max tries (e.g., 5) then move to DEAD/DLQ.
- DLQ needs UI/CLI to view and replay, with reason and payload.
- Alert when FAILED ratio rises or job exceeds SLA.

### Operations
| Metric | Meaning | Suggested threshold |
|---|---|---|
| Job PENDING past next_run_at | Scheduler stuck | > 1 min is abnormal |
| Job RUNNING past lease | Worker hung | Reaper handles, alert if many |
| High attempts | System errors | > 2 needs review |
| Batch runtime | Throughput | 30% above baseline = investigate |
| DLQ size | Jobs dropped | > 0 needs human view |

### Available tools
- **Quartz** (JDBC job store, clustered): good for simple jobs, but batch and sharding aren't strengths.
- **Spring Batch:** strong on chunk, restart, skip/retry; needs custom distributed scheduler.
- **Kubernetes CronJob:** only good for few jobs, no exactly-once and bad for tens of thousands of jobs.
- **Temporal:** durable workflows, retry, timer great; good when jobs have many steps needing compensation, but adds infra.
- **Kafka + consumer:** good for streams, not for precise cron.

> Senior tip: the thing I always check first when receiving a scheduler system is **whether jobs can duplicate**. If the handler isn't idempotent, every elegant lease/retry mechanism still creates wrong data at the night when incidents happen — and that's a debugging nobody wants。`,
    follow: [
      'How to handle daily jobs that should run exactly once, tolerating a node dying midway?',
      'When a batch hammers production DB, how to throttle without stopping?',
      'Compare hand-built scheduler with Temporal at scale 50,000 jobs/day.'
    ]
  }
});
