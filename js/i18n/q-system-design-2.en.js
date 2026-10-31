/*
 * English translation of js/data/q-system-design.js — task T195. Format: js/core/i18n.js (content overlay).
 * ids: design-008 design-009 design-010 design-011 design-012 design-013
 */
App.i18n.content({
  'design-008': {
    q: 'Design a real-time chat system: WebSocket, presence, message ordering and storage. How do you handle disconnections and duplicate messages?',
    a: `**Summary:** Real-time chat has three independent parts: **connection** (a WebSocket gateway that holds millions of open connections), **routing** (knowing which gateway a user is attached to so you can push messages to them), and **storage** (appending messages to each conversation). Ordering only needs to be guaranteed **inside one conversation**, not globally; sending uses at-least-once delivery plus client-side deduplication.

### Requirements
- **Functional:** 1-on-1 and group chat, instant send/receive, read receipts, online/offline status, history, file attachments, push notification when the user is offline.
- **Non-functional:** 10 million concurrent users, 1–3 connections per user; p99 from send to recipient < 200 ms; no lost messages; loading the latest 50 messages < 500 ms.
- **Accepted trade-offs:** global ordering is not required; presence may lag a few seconds; a message may arrive twice during retries.

### Connection: WebSocket gateway
~~~text
Client ==WebSocket==> Gateway node (holds the socket)
                         |
                    Session registry (Redis):
                    userId -> [gatewayId, connId]
                         |
              +----------+----------+
              |                     |
        Message service        Presence service
              |
        Kafka / Redis Stream
              |
        Target gateway -> pushes down to the socket
~~~
- The gateway **holds no business logic**; it only authenticates, keeps the socket open, registers the session and forwards messages.
- Each gateway serves 100k–500k connections depending on RAM and file descriptors; scale horizontally by adding nodes.
- You need sticky sessions at the load balancer, or a shared registry, so that any gateway can route a message to the right user.
- Ping/pong heartbeat every 30 seconds; after 60 seconds without a response, close the socket and delete the session.

### Presence
Do not broadcast every online/offline change to the whole contact list. Instead:
- Write {{presence:userId = online}} with a 60-second TTL, refreshed on every heartbeat.
- A viewer only queries presence for the people whose chat window is open (a few dozen), never the whole contact list.
- When a user goes offline, publish an event to that user's subscribers (friends who have the chat open).
- Multiple devices: a user is online if **at least one** session is alive; keep one key per device and aggregate them.

### Message ordering
Only ordering within a single conversation is needed. A reliable approach:
1. The message service receives a message and assigns an **increasing sequence number** to the conversation. You can use Redis {{INCR conv:seq:<id>}}, but the counter must be durable (if Redis is lost, sequences can go backwards).
2. Safer: a DB-backed allocator issues a durable sequence per conversation, or you use sortable IDs (Snowflake) plus validation.
3. Store the message with {{(conversation_id, seq)}} as the unique key.
4. The client renders messages in the order of the seq values it receives; if it detects a gap, it requests the missing messages (gap detection).

Do not use client timestamps: phone clocks drift, so the order can come out inverted.

### Storage
For chat, the access pattern is always "the latest N messages of one conversation". Choose a wide-column store (Cassandra/ScyllaDB/HBase) or Postgres partitions:
~~~text
partition key: conversation_id
clustering key: seq DESC
columns: message_id, sender_id, type, body, created_at, edited_at
~~~
- Reading the latest 50 messages is a small range scan and very fast.
- A large group conversation still lives in a single partition; if one conversation becomes huge (rare), split it by month.
- Files and images go to S3; messages store only metadata and signed URLs.

### Send flow
1. The client generates {{clientMsgId}} (a UUID) and sends it over the WebSocket together with {{conversationId}}.
2. The gateway forwards it to the message service (via internal RPC or Kafka).
3. The message service checks permissions, blocks spam, assigns the seq, writes to the DB and returns an ack to the sender.
4. It emits a {{message-created}} event to every gateway that holds a session of a member.
5. The gateway pushes the message down to the client; the client sends an ack; if no ack arrives before the timeout, the gateway retries.
6. Offline user: store the message in a pending mailbox and send a push notification.

### Preventing duplicates and message loss
- **At-least-once** on every hop. The client dedups by {{clientMsgId}}; the server keeps a unique {{(conversation_id, client_msg_id)}}, so a retry does not create a second message.
- **Two-way ack:** the server acks only after a durable write; the client shows a "sending/sent" state. With no ack, the client retries with the same clientMsgId.
- **Reconnect:** the client sends the {{lastSeq}} it has received; the server returns messages from {{lastSeq + 1}} (capped in size, paged if there are too many). This is the reliable way to avoid losing messages after a network drop.
- Exactly-once is unnecessary: duplicates are rare, and deduplication is far cheaper than trying to guarantee strict exactly-once end to end.

### Large groups
A group with 100k members (a community channel) cannot be fanned out to every member inside one request. Use the **pull model for large groups**: write one copy into the conversation, notify online clients "there is a new message" and let them load it. For small groups, push directly to keep latency low.

### Incidents and operations
| Incident | Impact | Mitigation |
|---|---|---|
| Gateway dies | Socket lost | Client reconnects with backoff + jitter, LB moves traffic to other nodes |
| Stale session registry | Message pushed to the wrong node | Short TTL, delete on socket close, fall back to asking again |
| Redis sequence lost | Duplicates / regressed seq | Durable sequence from the DB, or accept a rebuild |
| Consumer slow | Messages arrive late | Scale consumers, apply backpressure, prioritise 1-on-1 messages |
| Spam/flood | Overload | Per-user rate limit, block before assigning a seq |

> Senior tip: do not try to make WebSocket "stateless" by pushing everything through the database — you would create millions of queries per second. What you need is a **small central registry** (which gateway the user is on) plus gateways that keep sockets in RAM; that model has been proven at tens of millions of connections.`,
    follow: [
      'How does end-to-end encryption affect the architecture?',
      'How do you preserve message ordering when a conversation is moved between shards?',
      'If you need full-text search over chat history, which search engine would you integrate and how would you sync it?'
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
    q: 'Distributed lock: is Redis Redlock really safe? When should you use ZooKeeper/etcd, and what problem does a fencing token solve?',
    a: `**Summary:** A distributed lock is only truly safe when combined with a **fencing token** — an increasing number that the protected resource itself checks. A single-node Redis lock with SET NX PX plus a unique token is enough for most "avoid doing the work twice" needs. Redlock across several nodes reduces the chance of losing the lock, but it still depends on clocks, and it cannot save a client that was paused (for example by a long GC) after its lock expired. When correctness really matters, prefer a database constraint or optimistic locking over a distributed lock.

### Why use a lock
Example: two instances running the same report-recalculation job, or two requests decrementing the same stock counter at the same time. A distributed lock gives **mutual exclusion** across processes and machines. But before using one, ask: is there a way **without** a lock? A unique constraint, a conditional update, or partitioning by key is usually simpler and more correct.

### Basic Redis lock
~~~text
SET lock:report:2026-10 "token-uuid" NX PX 30000
~~~
- {{NX}}: set only if the key does not exist — this is the "acquire" step.
- {{PX 30000}}: a 30-second TTL (time to live, i.e. auto-expiry) so the lock cannot stay forever if the process dies.
- {{token-uuid}}: a value unique to this acquire call; it is used when releasing.

The release must check the token, otherwise you delete someone else's lock once your old lock expired and a new owner had already entered:
~~~text
-- KEYS[1]=lock key, ARGV[1]=token
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
~~~
Two separate GET and DEL commands are wrong; the check and the delete must be combined into one atomic Lua script.

### The biggest problem: the lock expires while the client is still working
The classic scenario:
1. Client A acquires a lock with a 30-second TTL.
2. A is hit by a **stop-the-world GC** pause of 40 seconds (the JVM freezes all application threads while it collects garbage), or by a slow network / a hung VM.
3. The lock expires; client B acquires it and starts writing.
4. A wakes up, believes it still holds the lock, and **overwrites** B's result.

A longer TTL does not fix this, it only lowers the probability. A watchdog (a background thread that renews the lock) also cannot save you if the process is frozen entirely.

### Fencing token
The correct solution: every acquire returns an **increasing number** (from a counter in Redis/etcd/DB). Every write carries this number, and the target resource **rejects** any number smaller than the largest one it has already seen.
~~~text
A acquires -> token 33
A pauses ...
lock expires, B acquires -> token 34, B writes with 34 (storage remembers 34)
A wakes up, writes with 33 -> storage rejects it because 33 < 34
~~~
This is why Kleppmann says a lock **alone** is not enough for correctness: you need storage that can verify the fencing token. If the target resource cannot check a token (for example, writing a file to S3), the lock does not protect you from the pause scenario.

### Redlock and the debate
Redlock: acquire on N=5 independent nodes; the lock is granted if at least 3 nodes confirm within less than the TTL; it is considered held while the remaining time is > 0.
- **Supporters (antirez):** less dependence on a single node, tolerates losing a node, fits when you care about efficiency.
- **Opponents (Kleppmann):** it still relies on **clocks and timing**, has no fencing; a long client pause still overwrites; the system can lose the lock during network failures. He recommends systems with real consensus (ZooKeeper/etcd) plus fencing.
Practical conclusion: Redlock is **not wrong** for the goal "reduce the chance of two workers running at the same time", but it is **not enough** for the goal "never overwrite". Do not use it for payments or stock unless you add a second line of protection.

### ZooKeeper / etcd
- **ZooKeeper:** creates an **ephemeral sequential node** (a temporary znode whose name ends with an increasing counter); the smallest node holds the lock. When the session dies, the node disappears automatically. A watch tells you when the lock is released. It is a consensus system (ZAB protocol), so writes are linearizable.
- **etcd:** lease + revision; you acquire with a transaction that compares the revision; when the lease expires the key disappears. Fewer moving parts, and easier to run in the Kubernetes ecosystem.
- Shared downsides: one more cluster to operate, higher latency than Redis, much lower throughput.

### Choosing for each scenario
| Requirement | Reasonable choice |
|---|---|
| Avoid two duplicate jobs, rare overlap acceptable | Redis SET NX PX + token + TTL |
| Leader election for a scheduler | etcd/ZooKeeper lease, or a DB advisory lock |
| Protect stock/payments | **No distributed lock**; use a conditional update + unique constraint |
| Absolute exclusion, storage can verify a token | Consensus + fencing token |
| Prevent duplicate message processing | Idempotency key, not a lock |

### Best practices
- Set the TTL 3–5 times longer than the expected processing time; a watchdog may renew it, but **do not trust it absolutely**.
- Always release in {{finally}} with a Lua script that checks the token.
- Log {{acquire/release}} together with the token and the time the lock was held, for investigation.
- If the lock is "nice to have" (only to reduce load), fail-open; if it is mandatory, you must have a constraint in the data layer.

> Senior tip: the question I always ask in interviews is "what happens if the client holding the lock is paused by a 40-second GC?". An answer of "increase the TTL" is not enough; an answer of "put a fencing token at the storage layer" comes from someone who has actually operated distributed systems.`,
    follow: [
      'How do you implement fencing tokens against a storage that cannot compare versions?',
      'When is a Postgres advisory lock a better choice than Redis?',
      'How do you monitor long-held locks without causing false positives?'
    ]
  },
  'design-011': {
    q: 'Explain CAP and PACELC. Which consistency model suits a wallet, a shopping cart and a news feed? Pick the corresponding database.',
    a: `**Summary:** CAP says that when a **network partition** happens, the system must choose between consistency and availability. PACELC adds: when there is **no** partition, you still have to choose between latency and consistency. There is no real "CA" in a distributed system; during a partition you are either CP or AP, and the rest of the time you trade latency against consistency.

### What CAP actually says
- **C (Consistency):** every read sees the latest write — in the sense of linearizability (the system behaves as if there were a single copy of the data).
- **A (Availability):** every request to a live node gets a **non-error response** (it does not promise the newest data).
- **P (Partition tolerance):** the system keeps running when the network splits into parts that cannot talk to each other. In any real distributed system P is **mandatory**, because networks do fail; so in practice you only choose C or A when a partition occurs.

A common misunderstanding: "pick 2 of 3" as if it were a fixed menu. In reality, **when P happens** you choose C (refuse or block rather than return wrong data) or A (return possibly stale data).

### PACELC
If there is a **P**artition, choose **A** or **C**; **E**lse (normal operation) choose **L**atency or **C**onsistency.
- {{PA/EL}}: Cassandra, DynamoDB (eventual by default) — favour availability and low latency.
- {{PC/EC}}: Spanner, CockroachDB, etcd, ZooKeeper — favour consistency and pay with latency.
- {{PA/EC}}: configurable, for example MongoDB with write concern majority (EC) but still AP during a partition depending on configuration.
PACELC is more useful than CAP because it describes the **99.99% of the time when there is no partition** — and that is when latency is what users actually feel.

### The consistency spectrum
From strongest to weakest:
1. **Linearizable:** like a single variable; a read right after a write sees it. Most expensive.
2. **Sequential:** all nodes see the same order of operations, not necessarily in real time.
3. **Causal:** preserves causality (a reply comes after the question), while unrelated operations may run in parallel.
4. **Read-your-writes:** the writer sees its own writes.
5. **Monotonic reads:** never see data older than a previous read.
6. **Eventual:** converges eventually, with no promise of when.

In practice we rarely need linearizability for everything. For example: a wallet balance needs read-your-writes; a feed only needs eventual consistency; a shopping cart needs read-your-writes but not globally.

### Quorum
With a replicated system of N nodes: a write succeeds when W nodes confirm it, and a read reads from R nodes. If **R + W > N**, the read set and the write set overlap in at least one node, so a read sees the newest write (provided versions are compared). Example: N=3, W=2, R=2. Raising W makes writes slower and write availability worse when a node dies; raising R makes reads slower (you wait for more nodes) and read availability worse.

### Choosing by requirement
| Data | Consistency needed | Choice |
|---|---|---|
| Wallet balance, ledger | Linearizable/strong, with transactions | PostgreSQL/MySQL, CockroachDB, Spanner |
| Orders, stock | Strong, for conditional decrement | Postgres + conditional update; avoid eventual |
| Shopping cart | Read-your-writes, small losses acceptable | Redis/DynamoDB, TTL |
| Sessions, tokens | Strong keyed reads | Redis cluster, DynamoDB |
| News feed, timeline | Eventual, a few seconds | Cassandra/ScyllaDB, Redis sorted set |
| Product search | Eventual, full-text needed | Elasticsearch/OpenSearch |
| Analytics, logs | Eventual, huge write volume | ClickHouse, BigQuery, S3 + Athena |
| Config, feature flags | Read-your-writes, needs to be fast | etcd/ZooKeeper or Redis + pub/sub |

### Decisions by example
**Wallet:** use Postgres with transactions and an append-only ledger. Reason: losing one cent is a legal incident; you do not trade consistency for latency. If you need global scale, use CockroachDB/Spanner and accept higher write latency.

**Shopping cart:** a user who adds an item must see it immediately on that device (read-your-writes), but losing one item through a rare error is annoying, not catastrophic. Redis/DynamoDB with a 30-day TTL is reasonable; data may be eventual across devices.

**News feed:** a few seconds of delay is fine. Cassandra for the original posts, Redis sorted sets for feeds that are already fanned out. Do not use Postgres as feed storage because of write amplification and difficult cursor pagination.

### Common traps
- **Reading from a replica right after a write:** a 100 ms replication lag is enough for users to see recently saved data as "lost". Fix: read from the primary for a few seconds after a write, or use a session token/version.
- **Mixing sources:** write to Postgres, read from Elasticsearch, but indexing lags 5 seconds — users create a record and cannot find it. You need a "processing" notice or a fallback read.
- **Confusing "eventual" with "never correct":** eventual consistency needs a mechanism that guarantees convergence (retry, anti-entropy, read repair). Without it, you lose data.

> Senior tip: when an interviewer asks about CAP, do not just define it and stop. Say immediately "for this problem I accept up to X seconds of staleness, because this is how the user experiences it" — that is the answer of someone who designs products, not someone who only read books.`,
    follow: [
      'How do you implement read-your-writes when the user reads from a replica in another region?',
      'If you need to move a production table from eventual to strong consistency, what does the roadmap look like?',
      'Explain how DynamoDB achieves strong conditional writes even though it is an AP system.'
    ]
  },
  'design-012': {
    q: 'The system currently serves 1,000 users; your boss wants it ready for 1 million. Lay out the architecture roadmap by milestone, with each milestone tied to the scaling signal that justifies it.',
    a: `**Summary:** Scaling is not about building Google's architecture on day one; it is about **fixing the next bottleneck** at each milestone. 1k users need a clean monolith and tested backups; 100k need stateless app servers + cache + read replicas; 1M need sharding, asynchronous decoupling and multi-region. Every step must be driven by a **measurable signal** and by an operating cost the team can afford.

### Principles
1. **Measure before scaling.** Know your p99, QPS, DB connections, CPU and slow queries. Without numbers, every change is a guess.
2. **Scale along the cheapest axis first:** code/index → cache → replica → queue → shard → service.
3. **Keep deployments independent.** Do not split into microservices just because it sounds modern.
4. **Every step has a rollback.** Feature flag, dual-write, shadow read.

### Milestone 1 — 1,000 users: get the foundation right
- One Spring Boot application (a monolith: a single deployable unit) plus one Postgres (or MySQL), deployed as 1–2 instances behind a reverse proxy.
- **Automatic backups with a tested restore** (many teams skip this step).
- Indexes for the main queries, a sensible connection pool (HikariCP 10–20 connections per instance).
- Structured logs, health checks, uptime alerts.
- Basic CI/CD, versioned migrations (Flyway/Liquibase).
**Not needed yet:** Redis, Kafka, microservices, Kubernetes. At this scale they only add risk.

Signal that it is time to move on: DB CPU regularly above 60%, p99 > 500 ms, deployments causing downtime.

### Milestone 2 — 10,000 users: split read load, add caching
- Redis for frequently read data (sessions, catalog, config). Cache-aside with TTL + jitter.
- A **read replica** for reports and heavy queries; critical reads still go to the primary.
- CDN for static assets; object storage (S3) for user files instead of storing them in the DB.
- Move background jobs to dedicated workers (email, reports) so they no longer block requests.
- Add APM (Micrometer + Prometheus/Grafana or a managed service) and tracing for the core flow.

Signal: p99 for reads grows with traffic, cache hit rate is low, background jobs eat web-server CPU.

### Milestone 3 — 100,000 users: stateless + async + observability
- The app becomes **fully stateless** (sessions in Redis/JWT) and scales horizontally behind a load balancer.
- Rate limiting at the gateway; circuit breaker for external dependencies.
- A **message queue** (RabbitMQ/Kafka/SQS) for asynchronous work: email, webhooks, image processing.
- Split databases by domain if needed (for example search into Elasticsearch), but it can still be a modular monolith.
- **Connection pooling at the proxy layer** (PgBouncer), because 20 instances × 20 connections = 400 connections and Postgres starts to struggle.
- Define clear SLOs and alert on those, not on individual CPU spikes.
- Regular load tests with realistic scenarios.

Signal: writes exceed what one primary can handle, large tables (>100M rows) make queries slow, deployments need downtime for migrations.

### Milestone 4 — 500,000 users: partitioning, planned sharding
- **Partition large tables** by time or by tenant before even thinking about sharding.
- Shard only when one primary is no longer enough: choose the **shard key** from the most frequent query, avoiding hotspots. For example, shard by {{tenant_id}} instead of by time.
- Split read models (CQRS) for heavy screens; sync them with events.
- Split services by **business capability** with clear boundaries: auth, billing, notification. Each service owns its own DB and communicates through APIs/events.
- **Idempotency and the outbox pattern** become mandatory once you have async.
- Strengthen security: secret manager, audit log, least privilege.

Signal: one slow service blocks the whole system, teams step on each other during deployments, DB cost grows non-linearly.

### Milestone 5 — 1,000,000 users: multi-region, cells
- **Multi-region:** start active-passive (simple, RPO of a few minutes); go active-active only when truly needed and once you have a conflict-resolution strategy.
- **Cell-based architecture:** divide users into isolated cells so a failure in one cell does not spread to the whole system.
- CDN + edge for static content; reads close to users.
- A data pipeline for analytics separated from OLTP (CDC → lakehouse).
- Chaos engineering, game days, runbooks for every major incident.
- Cost optimisation: right-sizing, reserved instances, storage tiering.

### Summary table
| Milestone | Added | Removed / deliberately skipped |
|---|---|---|
| 1k | Monolith, 1 DB, backups, CI/CD | No cache, no queue |
| 10k | Redis, replica, CDN, workers | No shard, no microservices |
| 100k | Stateless, LB, queue, PgBouncer, SLO | No splitting into too many services |
| 500k | Partition/shard, CQRS, domain services | No splitting by technical layer |
| 1M | Multi-region, cells, chaos, data platform | No active-active until needed |

### What is often missed
- **Operating cost grows faster than traffic.** Every component you add is something to patch, back up, upgrade and operate at night.
- **People are the bottleneck.** 3 engineers cannot operate 20 microservices plus a service mesh. Pick an architecture that matches the team's capacity.
- **Old data.** Migrating 100 million rows has to run in the background, in batches, with verification; never in a single transaction.
- **Safe deployments:** blue-green/canary matter more than picking a new database technology.

> Senior tip: I always ask "if traffic jumps 10x tomorrow, what breaks first?" and then prepare exactly that. The team that can answer with numbers scales better than the team with a beautiful architecture that does not know where the real bottleneck is.`,
    follow: [
      'How do you convince your boss that microservices are not needed at 100k users?',
      'When should you shard by tenant instead of by user id?',
      'How do you migrate 100 million rows to a new schema with almost no downtime?'
    ]
  },
  'design-013': {
    q: 'Design a distributed job scheduler handling tens of thousands of jobs per day and large batches. How do you prevent duplicate execution and handle failing jobs?',
    a: `**Summary:** A distributed scheduler needs a **durable source of truth** for schedules and state, an atomic **claim-job** operation (SELECT FOR UPDATE SKIP LOCKED), **idempotent** workers, and checkpoints for large batches. You cannot guarantee exactly-once end to end; aim for at-least-once plus idempotent effects.

### Requirements
- **Functional:** cron jobs (every 5 minutes, every night), one-shot jobs after X minutes, retry on failure, manual re-run, state tracking.
- **Non-functional:** 50,000 jobs/day (less than 1/s on average, but concentrated at the start of the working day), batches of 10 million records, one job never runs twice at the same moment, maximum job delay of 1 minute, no lost jobs when a node dies.

### Architecture
~~~text
+-------------------+       +----------------------+
| Scheduler service | ----> |  job table (DB)      |
| (multiple inst.)  |       |  next_run_at, status |
+-------------------+       |  lease_until, shard  |
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
  cron_expr    TEXT,                  -- NULL for one-off jobs
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
Several scheduler instances scan the table at the same time. The correct way on Postgres (MySQL 8 also has {{SKIP LOCKED}} but lacks {{RETURNING}} and does not allow a subquery on the same table inside UPDATE — you must {{SELECT ... FOR UPDATE SKIP LOCKED}} and then UPDATE in the same transaction):
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
- {{SKIP LOCKED}} lets several workers take different jobs without waiting for each other.
- If a worker dies, {{lease_until}} expires and a reaper job puts the job back to PENDING (incrementing attempts).
- Do not keep the transaction open while the job runs; hold it only long enough to claim.

### Cron and next_run_at
- Do not let every node run its own cron (that would duplicate work). Only **one** process materializes cron entries into job instances, or use a DB unique key on {{(name, scheduled_at)}} to prevent duplicates.
- Compute {{next_run_at}} in UTC using the configured time zones; store UTC in the DB.
- Avoid a "thundering herd" at midnight: add **jitter** when creating jobs (between 00:00 and 00:05) or split the slots.
- Missed jobs (node down at restart time): query jobs with {{next_run_at < now()}} and run them, with a bounded window (for example, only catch up within the last hour).

### Leader election (if needed)
Some work should be done by only one node: materializing cron entries, cleanup. Use:
- a Postgres advisory lock, or
- an etcd/ZooKeeper lease, or
- a {{leader_lease}} table with a conditional update and a TTL.
You do **not** need a leader for claiming jobs — {{SKIP LOCKED}} is enough.

### Large batches: divide and conquer
10 million records cannot be handled in one transaction or one job. Split them into **partitions/chunks**:
~~~text
Parent job (batch-2026-10-22)
 +-- chunk 0: ids 1..100000
 +-- chunk 1: ids 100001..200000
 ...
 +-- chunk N
~~~
- Each chunk is a child job, claimed independently and run in parallel.
- Each chunk writes a **checkpoint** (the last processed id/offset) so it can resume instead of starting over.
- Commit in batches of 500–1,000 records; avoid a 10-million-row transaction (bloat, locks, a huge WAL).
- Limit concurrency so workers do not saturate the source or destination DB.
- Track progress per chunk; the parent job is DONE only when every chunk is DONE.

### Idempotency: the key to everything
A job may run again because of a retry, an expired lease, or a manual run. Every handler must be safe to execute twice:
- Write with a **business unique key** (for example {{(batch_id, record_id)}}) and use upsert/ignore.
- Or check the state before acting: if it is already DONE, skip.
- For external effects (sending email, calling an API), use the partner's idempotency key if one exists.
- If you cannot make it idempotent, write an **intent** first, then execute, and add a reconciliation step.

### Retry, backoff, DLQ
- Classify errors: transient (timeout, 5xx, deadlock) → retry; permanent (bad data, 4xx) → FAILED immediately.
- Exponential backoff + jitter; after a maximum number of attempts (for example 5), move the job to DEAD/DLQ.
- The DLQ needs a UI/CLI to view and replay jobs, together with the failure reason and the payload.
- Alert when the FAILED ratio rises or when a job exceeds its SLA.

### Operations
| Metric | Meaning | Suggested threshold |
|---|---|---|
| Job PENDING past next_run_at | Scheduler is stuck | More than 1 minute is abnormal |
| Job RUNNING past lease | Worker is hung | The reaper handles it; alert if many |
| High attempts | System errors | More than 2 needs review |
| Batch runtime | Throughput | 30% above baseline = investigate |
| DLQ size | Jobs given up | More than 0 needs a human to look |

### Available tools
- **Quartz** (JDBC job store, clustered): good for simple jobs, but large batches and sharding are not its strengths.
- **Spring Batch:** strong on chunking, restart, skip/retry; you need to add a distributed scheduler yourself.
- **Kubernetes CronJob:** only suitable for a few jobs, no exactly-once, and not suitable for tens of thousands of jobs.
- **Temporal:** durable workflows, retries and timers are excellent; fits when jobs have many steps and need compensation, but adds infrastructure.
- **Kafka + consumer:** good for streams, not for precise cron schedules.

> Senior tip: the first thing I always check when taking over a scheduler is **whether a job can run twice**. If the handler is not idempotent, no matter how elegant the lease/retry mechanism is, it will create wrong data on the night of an incident — and that is a debugging session nobody wants.`,
    follow: [
      'How do you handle a daily job that must run exactly once while still tolerating a node dying midway?',
      'When a batch is choking the production DB, how do you throttle it without stopping it completely?',
      'Compare a hand-built scheduler with Temporal at a scale of 50,000 jobs/day.'
    ]
  }
});
