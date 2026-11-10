/*
 * English translation of js/data/q-scenario.js — task T732. Format: js/core/i18n.js (content overlay).
 * ids: scenario-109 scenario-110 scenario-111 scenario-112 scenario-113 scenario-114 scenario-115 scenario-116
 */
App.i18n.content({
  'scenario-109': {
    q: 'Ninjavan interviewer asks: how do you design Feature Flags to enable/disable features for a subset of users while optimizing for performance?',
    a: `**Summary:** A Feature Flag (a feature switch in code that doesn't require redeployment) allows for gradual rollout by user/segment. Design it for performance by storing configuration in a DB (source of truth), using Redis cache + in-memory SDK for <1ms evaluation, and using hash bucketing for consistent traffic distribution.

### Real-world context
A logistics system (like Ninjavan) has 50k RPS. The team wants:
- Gradual rollout of a "new fee calculation" to 5% of users initially, then increasing.
- A/B testing to measure conversion.
- A kill switch to turn off a new feature instantly if p99 latency spikes.

Requirement: Flag evaluation must add less than 1–2ms to each request and should not call the DB on every request.

### Mechanism (step-by-step)
1. **Data Model** (DB is the ultimate source of truth):
   - {{flags(id, key, description, default_value, rollout_percent, rules_json, owner, expires_at, updated_at)}}
   - {{flag_overrides(flag_id, target_type, target_id, value)}} to force on/off for specific users/segments.
2. **Fast config access**: SDK (the library embedded in the app) maintains an in-memory cache (in the process RAM). Every 10–30s, it polls the DB or receives invalidation via Redis Pub/Sub (a mechanism to notify in realtime). Do not call the DB in the request path.
3. **Evaluation** (decision to enable/disable):
   ~~~java
   // Stable hash: same userId always falls into the same bucket
   int bucket = Math.floorMod(userId.hashCode(), 100); // 0..99, stable hashCode for String
   boolean on = (bucket < flag.rolloutPercent());
   if (override != null) on = override; // apply specific overrides
   ~~~
4. **Segment rules**: evaluate based on attributes (country, plan, appVersion). Priority: specific overrides > segment rules > rollout % > default.

### Overall flow
~~~seq
title: Evaluate Feature Flag (no DB hit in request path)
actors: Client | App | SDK Cache | Redis
Client -> App: request (userId=U123)
App -> SDK Cache: isEnabled("new_fee", U123)
SDK Cache -> SDK Cache: hash bucket + rules (RAM)
SDK Cache --> App: true/false (<1ms)
App --> Client: response based on flag
note SDK Cache..Redis: refresh 30s or pub/sub invalidate
~~~

### Trade-off table
| Approach | Pros | Cons | Use case |
|---|---|---|---|
| DB on every request | Always latest | +5–20ms, DB overload | Do not use at scale |
| Redis cache + TTL | Fast (~1ms), simple | Lag up to TTL when changed | Most common |
| In-memory SDK + pub/sub | <0.1ms, no Redis hit | More complex, eventual consistency | High traffic, high performance |
| SaaS (LaunchDarkly/Unleash) | Full UI, audit, targeting | Cost, third-party dependency | Fast delivery |

### Real-world pitfalls
- **Flag accumulation (Technical debt)**: hundreds of stale flags that no one dares to remove. Rule: every flag must have an {{owner}} and {{expires_at}}; automated job to warn about expired flags.
- **No audit**: who toggled the flag when? Mandatory audit log (flag_key, actor, old/new, time) to trace during incidents.
- **Unstable hash**: user flips between A and B during a session if hash algorithm/seed changes. Use stable hash (Murmur3) and never change the seed.
- **Inconsistent evaluation**: each service implements its own logic → inconsistent behavior. Standardize using a shared SDK.

> Senior tip: Treat a feature flag as "intentional technical debt" — set an expiry date and an owner the moment it is created. At 50k RPS, in-memory cache + pub/sub invalidation keeps p99 evaluation < 0.5ms; use Redis as the configuration distribution layer, but avoid Redis in the hot path of every request if possible.`,
    follow: ['How do you roll out safely from 1% to 100%?', 'How is a kill switch different from a feature flag?']
  },
  'scenario-110': {
    q: 'Interviewer asks: API is being spammed — how do you apply rate limiting effectively at large scale?',
    a: `**Summary:** Rate limiting (preventing clients from making too many requests in a given time period) should be implemented at the gateway layer using Token Bucket or Sliding Window algorithms on Redis (a shared in-memory key-value store used as a counter across multiple instances) to ensure atomicity (operations are not interrupted); return HTTP 429 along with a {{Retry-After}} header so clients know when to try again.

### Real-world context
A public API receives 20k RPS under normal conditions, but a bot starts sending 2k RPS to the {{/login}} and {{/otp}} endpoints → CPU increases, DB connection pool is exhausted, and real users experience timeouts. Objective: block abuse without impacting legitimate users.

### Algorithm mechanisms (step-by-step)
1. **Token Bucket**: Imagine a bucket containing at most N tokens, with R tokens refilled each second. Each request consumes 1 token; if no tokens are left → deny. Allows for bursts while limiting the average rate.
2. **Fixed Window**: count requests within each minute (e.g., 10:00:00–10:00:59). Simple but suffers from bursts at the window boundary: 100 reqs at the end of minute 1 + 100 reqs at the beginning of minute 2 = 200 reqs in 2 seconds.
3. **Sliding Window**: calculated over a moving time interval (e.g., the last 60 seconds) → smoother, but uses more memory (stores timestamps of requests or uses 2 counters).

~~~java
// Simplified fixed window with Redis (use Lua script for atomic operations if precision is critical)
String key = "rl:user:" + userId + ":" + (System.currentTimeMillis() / 60000);
Long count = redis.incr(key);              // increment, atomic
if (count == 1) redis.expire(key, 60);     // set 60s TTL for new key
if (count > 100) throw new TooManyRequests(); // > 100 reqs/minute
~~~

### Large-scale implementation
- **Where to apply**: API Gateway / reverse proxy (Nginx, Kong, Envoy) to block as early as possible, before reaching the app/DB. App layer performs additional business-specific rate limiting (e.g., OTP sending limit per user).
- **Classification key**: {{userId}} (logged in), {{apiKey}} (partner), {{ip}} (anonymous). Combine multiple layers: global + per-user + per-endpoint.
- **Distributed (multiple instances)**: use a shared Redis + Lua script to perform {{INCR+EXPIRE}} atomically, avoiding race conditions (where two instances read the old count simultaneously).

### Trade-off table
| Algorithm | Pros | Cons | Suitable for |
|---|---|---|---|
| Fixed window | Very simple, low memory | Bursts at window boundary | Less critical endpoints |
| Sliding window log | Accurate, smooth | High memory (stores each req) | Moderate traffic |
| Sliding window counter | Smooth, efficient | Approximate | Popular in production |
| Token bucket | Allows controlled bursts | Tuning refill/rate is complex | APIs needing bursts |

### Real-world pitfalls
- **Rate limiting only at the app, multiple instances**: each instance counts independently → actual total = limit × number of instances. Must centralize at gateway/Redis.
- **Keying by IP behind NAT (shared IP network)**: entire offices/companies blocked incorrectly. For logged-in users, prioritize keying by {{userId}}/{{apiKey}}.
- **Not returning {{Retry-After}}**: client retries immediately → creates a "retry storm" that worsens the issue. Always return 429 + {{Retry-After}} header (seconds) and support exponential backoff.
- **Forgetting whitelisting**: health-checks, important partners, and webhook callbacks get blocked → service disruption.

> Senior tip: Set different limits based on behavior: read (GET) more generous than write (POST), sensitive endpoints (login/OTP) tighter (e.g., 5/minute/user). At 20k RPS, use Redis Cluster + Lua script; monitor the {{rate_limit_rejected_total}} metric to tune — if too many real users are blocked, the limit is too tight.`,
    follow: ['How do you rate limit by tier (free/pro)?', 'What is the difference between throttling and rate limiting?']
  },
  'scenario-111': {
    q: 'Interviewer asks: booking a concert ticket, two users try to buy the last seat at the same time — how do you handle the concurrency?',
    a: `**Summary:** When two users try to buy the last seat simultaneously, you must ensure only one succeeds using database-level locking (pessimistic {{SELECT FOR UPDATE}} or optimistic locking with a {{version}} column) combined with a seat status that includes a TTL (temporary hold) and an idempotency key (a unique key to prevent duplicate requests) to avoid double-charging.

### Real-world context
Event opens for booking at 10:00, 50k users rush in, seat {{A1}} is the last one. Two requests arrive nearly simultaneously, both reading "AVAILABLE" and both attempting to write "SOLD" → overselling (selling more than available), leading to refunds and complaints.

### Internal mechanisms and why
The root cause is **race condition** (result depends on an uncontrolled order of execution). You need to turn the "check availability → hold seat" operation into a safe atomic unit.

1. **Pessimistic lock (lock before doing)**:
~~~sql
BEGIN;
-- Lock the seat row; other transactions touching this row will WAIT until commit/rollback
SELECT status, version FROM seats WHERE id = 42 FOR UPDATE;
-- Check: if still AVAILABLE, proceed to hold
UPDATE seats SET status = 'HELD', hold_until = NOW() + INTERVAL '5 min', holder = :user
WHERE id = 42 AND status = 'AVAILABLE';
COMMIT;
~~~
{{FOR UPDATE}} acquires an exclusive lock on the row. The second request is blocked; when the first request commits, the second request re-reads and sees {{HELD}} → returns "seat is held by another user".
2. **Optimistic lock (no lock, check on write)**: add a {{version}} column. No one waits; whoever writes first wins.
~~~sql
-- Read: status=AVAILABLE, version=7
UPDATE seats SET status='HELD', version=version+1, holder=:user
WHERE id=42 AND status='AVAILABLE' AND version=7;
-- affected rows = 1 → success; = 0 → someone else changed it, report conflict
~~~
3. **Hold with TTL (time-to-live)**: transition {{AVAILABLE → HELD}} (hold for 5 minutes) instead of selling directly. A scheduled job or a check on {{hold_until}} returns the seat to {{AVAILABLE}} if payment isn't completed in time.

### Overall flow
~~~seq
title: Holding the last seat (pessimistic lock)
actors: UserA | API | DB | UserB
UserA -> API: select seat A1
API -> DB: SELECT FOR UPDATE (lock row A1)
DB --> API: AVAILABLE
UserB -> API: select seat A1
API -> DB: SELECT FOR UPDATE (wait for lock)
API -> DB: UPDATE A1 = HELD (UserA)
API --> UserA: seat held for 5 minutes
DB --> API: release lock, see HELD
API --> UserB: seat already held by another
~~~

### Trade-off table
| Approach | Pros | Cons | Use case |
|---|---|---|---|
| Pessimistic (FOR UPDATE) | Absolutely safe, simple logic | Low throughput, potential deadlock/timeout on hot rows | Last seat, very limited quantity, critical |
| Optimistic (version) | No block, high throughput | Conflicts high in heavy contention → retry storm | Moderate contention |
| Distributed lock (Redis SETNX) | Reduces DB load | Complex, must handle lock expiration | Combined, not a replacement for DB truth |
| Serialized queue | No race | High latency, wait UX | Extreme flash sale |

### Real-world pitfalls
- **Deadlock when holding multiple seats**: UserA chooses A1, A2; UserB chooses A2, A1 → each holds 1 lock and waits for the other. Fix: always lock in ascending {{id}} order within the same transaction.
- **"Ghost" seats (HELD forever)**: user holds the seat but closes the app without paying. Mandatory TTL + cleanup job ({{WHERE status='HELD' AND hold_until < NOW()}}) and release on payment fail/timeout.
- **Double charge**: client retries due to slow network. Use an {{idempotency key}} (client sends a unique key for each checkout; server stores result, duplicate requests return stored result) at the payment step.
- **Trusting "seat available" cache**: UI shows available from cache → user clicks buy and only then DB detects it's taken. Cache is for display; final decision always based on DB in transaction.

> Senior tip: For the last seat (extremely high contention on exactly 1 row), pessimistic {{FOR UPDATE}} + TTL hold is the simplest and safest. Monitor contention/lock-wait time; if p99 lock-wait > 500ms, consider a queue. Always add an idempotency key at the payment step and record an audit log (who held/bought which seat, at what time) for reconciliation.`,
    follow: ['How do you design an idempotency key?', 'How do you avoid a double charge?']
  },
  'scenario-112': {
    q: 'Interviewer asks: explain database indexes, B-Tree vs Binary Tree, and how to check if a column is indexed.',
    a: `**Summary:** An index (auxiliary data structure that helps the DB find rows quickly without scanning the entire table, like a book's index) typically uses a B-Tree because it is balanced and supports both exact lookups (=) and range queries (<, >, BETWEEN, ORDER BY). Check indexes using {{EXPLAIN (ANALYZE)}} and system catalogs ({{pg_indexes}}, {{SHOW INDEX}}).

### Why do we need an index (step-by-step mechanism)
The {{orders}} table has 10 million rows, query {{WHERE user_id = 123}}:
- **No index**: The DB must perform a sequential scan of all 10 million rows → reads many disk pages, slow (seconds).
- **With a B-Tree index on {{user_id}}**: The DB traverses from the root of the tree to the leaf based on the value 123 (few steps, because the tree is shallow), and takes a pointer (row pointer/ctid) to the exact row → reads only a few pages (milliseconds).

### What is a B-Tree and how is it different from a Binary Tree?
- **B-Tree (Balanced Tree)**: Each node contains **multiple keys** and multiple children; all leaves are at the same depth (balanced). Since DB data resides on disk (I/O by page 4KB/8KB), a node containing multiple keys helps **reduce disk reads**. Lookup is O(log_m N) with large m → tree is very shallow (tens of millions of rows only take ~3–4 levels).
- **Binary Tree (each node has 2 children)**: If data is inserted sequentially, it may become a skewed line (degenerate) → O(N). Balanced trees (AVL/Red-Black) are great in RAM, but each node contains few keys → results in too many disk reads when data is large.

~~~text
B-Tree (simplified, degree 3) on user_id:
            [ 50 | 100 ]
           /     |      \
     [10|30]   [60|80]  [110|150]   <- leaf node points to row
Find user_id=80: 50?100? -> between -> 60?80? -> to row (3 steps)
~~~

### Checking if a column is indexed
~~~sql
-- PostgreSQL: check execution plan (is it using index, how long does it take?)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE user_id = 123 AND status = 'PAID';

-- List indexes on table
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'orders';
~~~
~~~sql
-- MySQL
EXPLAIN SELECT * FROM orders WHERE user_id = 123;
SHOW INDEX FROM orders;
~~~
In {{EXPLAIN}}, seeing {{Index Scan}} / {{Bitmap Index Scan}} (PG) or {{ref/range}} using the key (MySQL) means the index is active; seeing {{Seq Scan}} / {{ALL}} means the whole table is being scanned.

### Trade-off table: when to create/not create an index
| Situation | Should index? | Why |
|---|---|---|
| Column frequently filtered/joined/sorted (WHERE, JOIN, ORDER BY) | Yes | Reduces rows to read |
| Small table (few thousand rows) | Usually no | Seq scan in RAM is fast, index adds overhead |
| Column with low cardinality (few distinct values, e.g., boolean, gender) | Usually no | Returns too many rows, planner skips index |
| Write-heavy table (continuous INSERT/UPDATE) | Consider | Every write must update all indexes → slows down writes |
| Column wrapped in a function {{WHERE lower(email)=...}} | Need function index | Index on {{email}} cannot be used |

### Real-world pitfalls
- **Index "exists" but is not used**: due to implicit cast ({{WHERE user_id = '123'}} when column is int), wrapping column in a function, or collation mismatch. Always verify using {{EXPLAIN ANALYZE}}.
- **Too many indexes**: read query faster but {{INSERT/UPDATE/DELETE}} slower, consumes space. Rule: only index columns used by real queries, monitor unused indexes ({{pg_stat_user_indexes}}).
- **Composite index (multi-column) order wrong**: index {{(a,b)}} helps {{WHERE a=?}} and {{WHERE a=? AND b=?}}, but **does not** help {{WHERE b=?}} alone (leftmost prefix rule).
- **Forgetting {{ANALYZE}}**: outdated statistics make the planner choose the wrong plan (skipping index). After large data imports, run {{ANALYZE}}.

> Senior tip: An index is a read/write trade-off — don't create it based on intuition. Process: take slow query from slow log/pg_stat_statements → {{EXPLAIN (ANALYZE, BUFFERS)}} → add exactly 1 index to serve that query → measure again. On tables with tens of millions of rows, the correct index can reduce query time from ~3s to < 20ms.`,
    follow: ['Composite index column order?', 'What is a covering index?']
  },
  'scenario-113': {
    q: 'Interviewer asks: how do isolation levels differ, and how do locking levels work?',
    a: `**Summary:** Isolation levels (rules controlling how a transaction sees changes made by other transactions) range from lowest to highest (Read Uncommitted, Read Committed, Repeatable Read, Serializable), offering trade-offs between correctness and performance. Locking (mechanism holding resources to prevent concurrent modifications) is how the DB implements isolation, ranging from row-level to table-level, shared or exclusive.

### Real-world context
Money transfer system: T1 reads balance as 10 million, T2 also reads 10 million and withdraws 8 million and commits, T1 subtracts 5 million based on the old balance → balance becomes negative. This is a consequence of insufficient isolation.

### Three anomalies (why isolation is needed)
- **Dirty read**: reading data that another transaction has just written but **not yet committed** (might be rolled back).
- **Non-repeatable read**: running the same query twice in a single transaction yields different results because another transaction has {{UPDATE/DELETE}} and committed in between.
- **Phantom read**: running the same range query (e.g., {{WHERE amount > 100}}) twice, the second time shows **new rows** because another transaction has {{INSERT}} and committed.

### Isolation level table
| Level | Dirty read | Non-repeatable | Phantom | Performance |
|---|---|---|---|---|
| Read Uncommitted | Possible | Possible | Possible | Highest (rarely used) |
| Read Committed (PostgreSQL default) | No | Possible | Possible | Good, common |
| Repeatable Read (MySQL/InnoDB default) | No | No | Possible* | Medium |
| Serializable | No | No | No | Lowest, safest |

*InnoDB in Repeatable Read uses MVCC (Multi-Version Concurrency Control — each transaction sees its own snapshot) + gap locks (locks the space between keys), effectively preventing many phantom read scenarios.

### Locking level
- **Shared lock (S)**: allows reads, blocks writes. Multiple transactions can hold S concurrently.
- **Exclusive lock (X)**: allows writes; blocks other S and X locks. {{UPDATE/DELETE}} and {{SELECT ... FOR UPDATE}} acquire X.
- **Row-level vs table-level**: row-level lock allows high concurrency; table-level locks the whole table, safe but causes congestion. Modern DBs (PostgreSQL, InnoDB) prioritize row-level.
- **Deadlock**: T1 holds lock A waiting for B, T2 holds lock B waiting for A. DB detects this (after ~1s, depending on configuration) and aborts one transaction (returns error). Prevent by always locking in a fixed order and keeping transactions short.

~~~sql
-- Explicitly acquire exclusive lock when "read-then-write" safety is required
BEGIN;
SELECT balance FROM accounts WHERE id = 1 FOR UPDATE; -- lock row id=1
UPDATE accounts SET balance = balance - 500000 WHERE id = 1;
COMMIT;
~~~

### Trade-off table: when to choose which level
| Need | Suggested Level | Notes |
|---|---|---|
| Regular read API, approximate reporting | Read Committed | Default is good, low contention |
| Read-then-write based on read value (transfer money) | Read Committed + {{FOR UPDATE}} | Clear, effective |
| Need consistent snapshot throughout long transaction | Repeatable Read | Avoids non-repeatable read |
| Extremely sensitive business (ledger) | Serializable or DB-level constraints | Slow, use only when necessary |

### Real-world pitfalls
- **"Default is safe"**: Read Committed still allows non-repeatable read; logic like "read balance → subtract" without {{FOR UPDATE}} still suffers from race conditions.
- **Raising to Serializable everywhere**: throughput drops significantly; serialization failure (PG) requires retry → complex. Raise only where necessary.
- **Long transactions holding locks**: open transaction, call external API, then commit → holds row lock for dozens of seconds, other requests queue up, p99 spikes. Rule: transaction as short as possible, no network calls inside.
- **Confusing isolation with atomicity**: isolation relates to concurrent transactions; atomicity (A in ACID) is all-or-nothing in a single transaction.

> Senior tip: Practically, stick with Read Committed and use {{SELECT ... FOR UPDATE}} / {{UNIQUE}} constraints / {{CHECK}} constraints in "read-then-write" scenarios. Monitor {{pg_stat_activity}} (lock wait) and deadlock counts; if lock-wait p99 > 200ms, review long transactions and lock order.`,
    follow: ['How does MVCC work?', 'What is a gap lock?']
  },
  'scenario-114': {
    q: 'Interviewer asks: when should you use Kafka instead of REST/RPC, and what are the trade-offs?',
    a: `**Summary:** Kafka (a distributed event streaming platform/log — distributed queue, stores messages in order and allows re-reading) is suitable when you need asynchronous processing, producer/consumer decoupling, high throughput, and the ability to replay events; REST/RPC (synchronous request/response — send request and wait for response) is suitable when you need immediate results and a simple flow.

### Real-world context
A newly created order needs: inventory deduction, email notification, loyalty point addition, analytics update. If Order Service calls Inventory, Email, Loyalty, Analytics sequentially using REST: (1) Order must wait for all → slow; (2) Email failure causes the whole order to fail even if the order is valid; (3) Adding a new consumer requires changing Order Service. Kafka solves this by having Order just emit one {{OrderCreated}} event.

### Mechanism (step-by-step, simplified)
- **Producer** writes messages to a **topic** (channel). The topic is split into multiple **partitions** to enable parallelism.
- Kafka stores messages sequentially on disk based on the offset (position). Unlike traditional queues: messages **are not deleted immediately after reading** (retained based on retention period, e.g., 7 days) → consumers can re-read.
- **Consumer group**: multiple instances in the same group share partitions → horizontal scaling. Each partition is handled by only 1 consumer in the group at any given time → guarantees **order within 1 partition** (usually select key = {{orderId}} so events of the same order go to the same partition).

~~~seq
title: Order created, sides process asynchronously
actors: Client | OrderSvc | Kafka | Inventory | Email
Client -> OrderSvc: POST /orders
OrderSvc -> Kafka: publish OrderCreated (key=orderId)
OrderSvc --> Client: 201 Created (fast)
Kafka -> Inventory: consume OrderCreated
Inventory -> Inventory: deduct inventory
Kafka -> Email: consume OrderCreated
Email -> Email: send confirmation
~~~

### Trade-off table
| Criterion | Kafka (event/async) | REST/RPC (sync) |
|---|---|---|
| Client response | No business result immediately (accepted later) | Immediate response |
| Coupling | Loose: producer doesn't know consumer | Tight: caller must know callee |
| End-to-end latency | Usually higher (ms–seconds) | Low for 1 hop (ms) |
| Fault tolerance | Consumer dies, resumes reading from offset | Callee dies → caller errors (needs retry/circuit breaker) |
| Ordering | Guaranteed in 1 partition | No concept of stream |
| Replay/audit | Yes (read old offset) | No |
| Operations | Complex (cluster, schema, monitoring) | Simpler |

### When to use Kafka vs REST/RPC
- **Use Kafka**: Business events needed by many sides (OrderCreated), data/analytics pipelines, audit logs, service integration requiring decoupling, handling bursty loads (buffer), and need for replay.
- **Use REST/RPC**: Need immediate answer to continue (login returns token, check balance before withdrawal), simple CRUD operations, 1-1 request/response, small team lacking Kafka operational capacity.
- **Combined**: REST to accept request + return fast ack, behind it publish Kafka event for heavy processing.

### Real-world pitfalls
- **Using Kafka for everything**: request/reply over Kafka (request-reply topic) is complex, hard to debug. Keep REST for sync.
- **Consumer not idempotent (same result for retries)**: Kafka guarantees at-least-once (can deliver duplicates). If inventory deducted twice for the same event → business error. Handle with idempotency key (store {{eventId}} already processed) or upsert.
- **Wrong partition key**: key null/random → events of the same {{orderId}} fall into different partitions → lost order. Select key based on the entity that needs order maintenance.
- **Poor schema management**: producer changes message format → consumer crashes. Use Schema Registry (Avro/Protobuf/JSON Schema) and compatibility rules.
- **Consumer lag (falling behind)**: consumer processes slowly, backlog increases. Monitor {{consumer lag}}; scale consumers (at most equal to number of partitions) or optimize processing.

> Senior tip: Decide based on the question "does the caller need the result immediately to return to the user?" — if yes, REST/gRPC; if no, consider Kafka. Start simple, move to Kafka when there is a real need for decoupling/replay/buffer. Always make consumers idempotent and monitor consumer lag (alert if lag > threshold, e.g., 10k messages or > 60s).`,
    follow: ['What is a consumer group?', 'Exactly-once semantics?']
  },
  'scenario-115': {
    q: 'Interviewer asks: Redis cache, what to cache, and how to handle cache hits and misses?',
    a: `**Summary:** Redis cache (in-memory storage used to store temporary data copies for fast reading, avoiding repeated DB queries) is used for data that is read often and changes infrequently (configuration, profile, catalogs). The most common pattern is cache-aside: on a hit (exists in cache) return immediately, on a miss (doesn't exist) query the DB, write to the cache with TTL (Time To Live), then return; at the same time, invalidation (deleting cache when data changes) and handling errors like cache stampede/penetration must be managed.

### Real-world context
Product detail page calls 6 DB queries, 5k RPS during peak → DB CPU 90%, p99 800ms. 95% of requests read the same set of hot products, data only changes when the seller updates it (a few times/hour). Cache allows returning most from RAM (sub-millisecond).

### What to cache (criteria)
- **High read, low write**: high read:write ratio (e.g., 100:1). Data that is frequently updated and requires absolute precision (account balance) → do not cache or cache very carefully.
- **Recomputable**: cache loss doesn't mean data loss (DB is still the source of truth).
- **Medium volume**: object not too large; key uses clear conventions ({{product:42}}, {{user:42:profile}}).

### Cache hit/miss mechanism (cache-aside, step-by-step)
~~~java
String key = "product:" + id;
Product p = redis.get(key);            // 1) attempt to read cache
if (p != null) return p;               // 2) HIT: return immediately (fast)
p = db.findProduct(id);                // 3) MISS: query DB (source of truth)
if (p != null) {
    redis.setex(key, 300, serialize(p)); // 4) write to cache, TTL 300s
} else {
    redis.setex(key, 60, "__NULL__");    // 4b) cache short empty value (to prevent penetration)
}
return p;
~~~
- **Write-through**: write to DB and update cache at the same time (fresher data, more complex code).
- **Invalidation on write**: when seller updates product → delete key {{product:42}} ({{DEL}} command) so the next read misses and fetches new data. "Delete" is safer than "update cache" to prevent stale values due to race conditions.

~~~seq
title: Cache-aside hit/miss
actors: Client | App | Redis | DB
Client -> App: GET /products/42
App -> Redis: GET product:42
Redis --> App: MISS
App -> DB: SELECT product 42
DB --> App: row
App -> Redis: SETEX product:42 300s
App --> Client: product
~~~

### Trade-off table for strategies
| Strategy | Pros | Cons | Use case |
|---|---|---|---|
| Cache-aside | Simple, only cache read data | First miss is slow, may be stale | Most common |
| Write-through | Cache fresh after write | Slower write (2 places), cache infrequently read data | Need read immediately after write |
| Write-behind (async DB write) | Very fast write | Risk of data loss if cache dies before flushing | Accept risk, high throughput write |
| TTL only (no active invalidation) | Simple | Data stale max = TTL | Data accepts latency |

### Real-world pitfalls
- **Cache stampede (thundering herd)**: hot key hits TTL right at the peak, thousands of requests all miss → all hit DB, DB crashes. Mitigation: jitter TTL (add random ±10%), mutex/lock for only 1 request to rebuild cache, or soft-TTL (return stale while refreshing in background).
- **Cache avalanche**: many keys hit TTL at the same time (e.g., deploy sets same TTL). Add jitter and avoid setting identical TTLs.
- **Stale data**: DB updated but forgot to invalidate cache → user sees stale data. Rule: all write paths must invalidate related keys; accept eventual consistency in TTL if using TTL-only.
- **Cache penetration**: query id does not exist → always misses → always hits DB. Cache short null values (30–60s) or use Bloom filter (probabilistic filter) to block non-existent keys.
- **Large objects/slow serialization**: caching heavy entities consumes RAM and CPU. Only cache necessary fields, choose compact formats (JSON/protobuf).

> Senior tip: Cache is an optimization layer, **DB is still the source of truth** — all flows must function correctly when Redis is empty or down (fallback to DB, might be slower but not broken). Set TTL for every key (prevent perpetual keys from leaking RAM), monitor hit ratio (aim for > 90% for hot keys) and memory {{used/max}}; p99 Redis intra-network cache read is usually < 2ms.`,
    follow: ['What is a cache avalanche?', 'What is write-behind caching?']
  },
  'scenario-116': {
    q: 'Interviewer asks: optimizing a query on a billion-row table that already has indexes, yet it is still slow — what do you do?',
    a: `**Summary:** "Index exists" does not mean the planner (the DB's execution plan selector) will use it. Must verify with {{EXPLAIN (ANALYZE, BUFFERS)}} to see what the DB is actually scanning, how long it takes, and how many pages it reads; then optimize based on the cause: index mismatch, data too large (needs partitioning), stale statistics, poorly written query, or I/O/sort spilling memory.

### Real-world context
{{events}} table has 1.2 billion records (18 months of behavioral logs). Query "get 100 events of user in 7 days" has index {{(user_id, created_at)}} but p99 is still 4–6 seconds, DB I/O wait is high during peak hours.

### Investigation step-by-step (symptoms → checks → cause)
1. **View the actual plan** (don't guess):
~~~sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, type, created_at
FROM events
WHERE user_id = 42
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 100;
~~~
2. **Read signs in the plan**:
   - {{Seq Scan}} on large table → index is not used.
   - {{Index Scan}} but {{actual time}} is high, {{buffers read}} is high → index is used but still reads too many rows/pages (poor selectivity, or has to "re-filter" too much).
   - {{Sort Method: external merge Disk}} → {{work_mem}} memory is insufficient, sort spills to disk.
   - {{rows estimated}} is far off from {{actual rows}} → statistics (data distribution) are stale, planner chooses the wrong plan.
3. **Why "complete" indexes are not used/fast**:
   - Wrapping column in function: {{WHERE DATE(created_at)=...}} makes index {{(created_at)}} useless → rewrite to {{created_at >= ... AND created_at < ...}}.
   - Implicit cast: {{WHERE user_id = '42'}} when column is {{bigint}}.
   - Composite index wrong order (leftmost prefix): index {{(created_at, user_id)}} does not help {{WHERE user_id = 42}}.
   - Planner estimates too many rows returned → decides Seq Scan is cheaper (sometimes correct, sometimes due to stale stats).

### Solutions (short-term → long-term)
- **Fix query/index mismatch**: correct order {{(user_id, created_at)}}, remove function/cast on filter column, only {{SELECT}} needed columns (avoid {{SELECT *}}). Use **covering index** (index that also includes returned columns, e.g., {{(user_id, created_at) INCLUDE (id, type)}} in PostgreSQL) for Index Only Scan, no need to read table.
- **Update statistics**: {{ANALYZE events;}} (or increase autovacuum/analyze frequency). If planner still chooses wrong plan after stats are correct, only then consider hints ({{pg_hint_plan}}) as temporary measure.
- **Partitioning by time**: table with 1.2 billion rows, queries mainly for 7–30 recent days → partition RANGE by month/week. Planner uses **partition pruning** (skips irrelevant partitions) so it only scans a few partitions instead of the whole table. Combine with local indexes on each partition.
~~~sql
-- Idea example (PostgreSQL declarative partitioning)
CREATE TABLE events (id bigint, user_id bigint, created_at timestamptz, type text)
PARTITION BY RANGE (created_at);
CREATE TABLE events_2026_05 PARTITION OF events
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE INDEX ON events_2026_05 (user_id, created_at);
~~~
- **Reduce processed data**: keyset/cursor pagination instead of large {{OFFSET}}; pre-aggregate (summary tables) or materialized view (view physically storing result) for reporting; archive old data to cold table/storage.

### Trade-off table
| Solution | Pros | Cons | Use case |
|---|---|---|---|
| Fix index/query | Fast, low risk | Won't save if scanning too much data | Always try first |
| Covering index | Reduces table read (heap fetch) | Consumes space, slows write | Hot queries, few columns |
| Time partitioning | Strong pruning, easy to drop old data | Migrating large table is complex, requires partition key | Billion-row table, time-based query |
| Read replica | Offloads reads from primary | Replication lag | Heavy listing/reporting |
| Sharding (horizontal DB split) | Scales beyond 1 machine | Very complex (join, transaction across shards) | Extremely large, last resort |

### Real-world pitfalls
- **Trusting "index exists" without verifying**: always trust real {{EXPLAIN ANALYZE}}, don't trust assumptions.
- **Partitioning but forgetting partition key in WHERE**: query {{WHERE user_id=42}} (no {{created_at}} filter) on time-partitioned table → scans all partitions, no pruning. Query and partition key design must go together.
- **Migrating to partition on live billion-row table**: long lock, downtime. Needs a plan (create new partitioned table, backfill in batches, dual-write/cutover) and test on staging.
- **{{OFFSET 1000000}}**: DB still has to read & skip 1 million rows. Use keyset pagination ({{WHERE (created_at,id) < (:c,:i) ORDER BY created_at DESC, id DESC LIMIT 100}}).

> Senior tip: Standard procedure: (1) {{EXPLAIN (ANALYZE, BUFFERS)}} + compare estimated vs actual, (2) fix query/index to be sargable (filter can use index), (3) {{ANALYZE}} to update stats, (4) if still touching too many rows → partition/prune data. On a ~1 billion row table partitioned correctly by month, a 7-day query often reduces from scanning the whole table to < 2% data and p99 from seconds to tens of ms.`,
    follow: ['Partition pruning?', 'When to use materialized view?']
  }
});
