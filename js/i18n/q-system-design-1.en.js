/*
 * English translation of js/data/q-system-design.js — task T194. Format: js/core/i18n.js (content overlay).
 * ids: design-001 design-002 design-003 design-004 design-005 design-006 design-007
 */
App.i18n.content({
  'design-001': {
    q: 'You have 45 minutes for a system design interview. Walk through how to lead the session from start to finish to demonstrate the right senior-level capabilities.',
    a: `**Summary:** A 45-minute system design session is a test of **structured thinking process**, not memorized architecture. Follow 7 steps: clarify requirements, estimate scale, design API, build data model, sketch overall architecture, dive deep into 1-2 bottlenecks, discuss trade-offs — and think out loud throughout.

### Time allocation
| Minute | Activity | Deliverable |
|---|---|---|
| 0–5 | Clarify requirements | 3–5 use cases, scale numbers, out-of-scope |
| 5–10 | Estimation | QPS, storage, bandwidth, read/write ratio |
| 10–15 | API + data model | 3–5 endpoints, main tables/collections |
| 15–25 | Overall architecture | Box diagram + read/write flows |
| 25–38 | Deep dive into 1–2 bottlenecks | Concrete mechanism, not just naming |
| 38–43 | Trade-off + failure modes | When another approach is better |
| 43–45 | Recap | 3 key points summarizing the design |

### 1. Clarify requirements (don't skip)
- **Functional:** only 3–5 main use cases; ask clearly what is **not** included. For a URL shortener: custom alias, analytics, link expiration?
- **Non-functional:** DAU, read/write ratio, peak factor, p99 latency, availability (99.9 vs 99.99), consistency, retention, budget.
- If the interviewer doesn't give numbers, **set assumptions and say them aloud**: "I assume 10M DAU, peak 3× average, and eventual consistency for analytics."

### 2. Estimation to guide technology choices
Simple formulas are enough:
- {{Average QPS = DAU × actions/day / 86400}}, {{Peak QPS = 2–5 × average}}.
- {{Storage = writes/day × record size × retention days × replication factor}}.
- **The conclusion matters more than the number**: 50 GB fits one Postgres; 50 TB requires partitioning and object storage.

### 3. API
Write 3–5 short endpoints, state main request/response, and include an **idempotency key** for every write API. This shows production experience: client retries are guaranteed to happen.

### 4. Data model and storage selection
Work backward from **access pattern** to schema, not from an ERD. State:
- Main entities, primary key, partition key.
- Index that serves the hottest query.
- Why SQL or NoSQL: transactions/joins need SQL; massive writes with simple key-value need wide-column; real-time ranking needs Redis sorted set; files need S3.

### 5. Overall architecture
Draw a simple diagram before adding details:
~~~text
Client -> CDN -> Load Balancer -> API (stateless)
                                   |-> Redis (cache)
                                   |-> Postgres (primary) -> replica
                                   |-> Kafka -> workers -> analytics store
~~~
Clearly explain how read and write flows differ.

### 6. Deep dive into bottlenecks
Interviewers usually pick one of: hot key, write amplification, lock contention, fan-out, consistency with cache, message loss. Choose the area **you know deepest**, explain mechanism step by step, and provide 2 alternatives with selection criteria.

### 7. Trade-offs and failure modes
Always be able to answer: "What if Redis dies?", "What if traffic jumps 10× in an hour?", "What happens if two requests arrive at the same time?" A design without failure modes hasn't been thought through.

### Common mistakes
- Drawing before clarifying requirements, then having to redraw.
- Naming Kafka, Cassandra, Kubernetes like magic spells without explaining **why**.
- Skipping estimation and not knowing whether the system is small or large.
- Staying silent for 30 seconds — the interviewer can't grade thoughts inside your head.
- Not actively mentioning consistency, monitoring, and operating cost.

> Senior tip: I always spend the last 60 seconds saying "what I would do differently if I had more time" — it shows you understand the design's limits and can prioritize, exactly what interviewers look for at senior level.`,
    follow: [
      'If the interviewer interrupts and changes the requirement mid-session, how do you handle it?',
      'When only 10 minutes remain, which part do you prioritize: database design or scaling?',
      'How do you prove your design can handle peak load without a real load test?'
    ],
  },
  'design-002': {
    q: 'Design a URL shortener (like bit.ly) serving 100 million new URLs per month, with reads 100× more frequent than writes. Walk from requirements to bottlenecks.',
    a: `**Summary:** A URL shortener is a **large-scale key-value** problem: generate a unique short code, look it up extremely fast, with far more reads than writes. Choose counter + base62 for code generation, store the mapping in a DB with a unique index, cache hot URLs in Redis, and redirect with 302 to preserve analytics.

### Requirements
- **Functional:** create short URL (optional custom alias and TTL), redirect, click statistics, optional deletion.
- **Non-functional:** 100M new URLs/month ≈ **40 writes/s** average; reads 100× ≈ **4,000 reads/s**, peak 3–5×. p99 redirect < 50 ms. 99.99% availability for redirect. Analytics can lag a few minutes.
- **Out of scope:** advanced anti-phishing, multi-region active-active from day one.

### Estimation
- 100M × 500 bytes ≈ **50 GB/month**, ~600 GB/year — a single Postgres with index is comfortable; sharding isn't needed yet.
- 7-character base62 gives {{62^7 ≈ 3.5 × 10^12}} combinations, enough for decades.
- Cache: 20% of hot URLs drive 80% of traffic; 1–2 million Redis entries is plenty.

### Short code generation: 3 methods and selection
1. **Hash the long URL** (MD5/SHA then take 7 chars): same URL produces same code, good for dedup, but **collision must be handled** by trying salts.
2. **Random 7 characters + retry on conflict**: simple, well-distributed, but wastes requests as the code space fills and doesn't guarantee linear growth.
3. **Global counter + base62**: never collides, codes grow evenly. Downside: **codes are predictable**; fix with XOR against a secret or add random characters.

My choice: **segmented counter (range allocation)**. A service reserves 10,000 IDs ahead from DB/Redis via {{INCRBY}}, serves from memory; if the process dies, only a range is lost, uniqueness is preserved.

### API
~~~text
POST /api/v1/urls
  { longUrl, customAlias?, expiresAt? }  -> { shortUrl, code }
GET  /{code}                             -> 302 Location: longUrl
GET  /api/v1/urls/{code}/stats           -> { clicks, countries, referrers }
DELETE /api/v1/urls/{code}
~~~
Every POST includes header {{Idempotency-Key}} so retries don't create duplicate entries.

### Data model
~~~sql
CREATE TABLE url_mapping (
  id          BIGINT PRIMARY KEY,
  code        VARCHAR(10) NOT NULL,
  long_url    TEXT NOT NULL,
  user_id     BIGINT,
  created_at  TIMESTAMPTZ NOT NULL,
  expires_at  TIMESTAMPTZ,
  UNIQUE (code)
);
CREATE INDEX idx_mapping_user ON url_mapping(user_id, created_at DESC);
~~~
Click events are **not** in the transactional DB: push to Kafka, workers write to ClickHouse/BigQuery. Writing every click to Postgres would kill the DB with thousands of writes/s combined with reads.

### Architecture
~~~text
                  +-----------+
Client --------> |   CDN     |
                  +-----------+
                        |
                  +-----------+
                  |    LB     |
                  +-----------+
                        |
             +----------+-----------+
             |      URL service     |  stateless, scale horizontally
             +----------+-----------+
                  |            |
           +------+-----+   +--+---------+
           |   Redis    |   | Postgres   |
           | code->url  |   | primary    |
           +------------+   +--+---------+
                               |  replica
                        +------+------+
                        |  Kafka      | -> click worker -> analytics DB
                        +-------------+
~~~

### Read flow (most important)
1. Normalize the code, check format.
2. Check Redis. Hit → redirect immediately, **don't touch DB**.
3. Miss → read from Postgres replica; if found, set Redis TTL 24h with jitter.
4. Not found → return 404, cache "null" with short TTL (30–60s) to block cache penetration.
5. Write click event **asynchronously** to Kafka, don't block redirect.

### 301 or 302?
- **301 (permanent):** browser/CDN caches it, reducing server load, but you lose the ability to change the target, update statistics, or revoke the link.
- **302 (temporary):** every click passes through the server, more expensive but allows accurate analytics and flexible changes.
For products requiring statistics, choose 302. For static permanent links optimized for cost, 301 may be allowed intentionally.

### Bottlenecks and solutions
| Problem | Symptoms | Solution |
|---|---|---|
| Hot URL (viral) | One Redis/DB shard overloaded | L1 local cache in app + replicate key |
| Cache stampede on key expiry | Multiple requests read DB together | Single-flight/mutex per code |
| Code generation contention | Duplicate key with random approach | Counter range allocation |
| Table bloat | Queries slow over time | Partition by month or hash(code) |
| Abuse/phishing | Malicious links | Safe Browsing API, rate limit by user/IP |

### Scaling
When exceeding 1B URLs: shard by {{hash(code)}} with consistent hashing, or move mapping to a KV store (DynamoDB/Cassandra) with {{code}} as partition key. Analytics fully separated, time-based partitioning. Multi-region: each region reads replicas, writes to primary region; accepts replication delay of tens of ms.

> Senior tip: the most commonly overlooked issue is **custom alias and code collisions**. A user enters alias "promo2026" while the system just generated the same code — you must separate namespaces or check uniqueness across both sources, or you'll have a very hard-to-reproduce bug.`,
    follow: [
      'If the requirement changes to 10 billion URLs and 1 million reads/s, how does the architecture change?',
      'How do you ensure click statistics aren\'t lost when Kafka is down?',
      'Custom alias can be squatted; how do you design alias rules and reclamation?'
    ],
  },
  'design-003': {
    q: 'Design a distributed rate limiter for an API gateway. Compare token bucket vs sliding window, and how to implement atomically with Redis.',
    a: `**Summary:** Rate limiter protects systems from overload and abuse. For a single instance, an in-memory token bucket is enough; with multiple instances you need shared state and **atomic updates** — Redis + Lua script, or an approximate algorithm that accepts a small error to reduce round-trips.

### Requirements and placement
- Limit by **API key / user / IP / endpoint**, e.g., 100 req/min for regular users, 10,000 for partners.
- Added latency per request < 2 ms; limiter failure must not crash the whole system.
- Return {{429 Too Many Requests}} with {{Retry-After}}, {{X-RateLimit-Limit}}, {{X-RateLimit-Remaining}}, {{X-RateLimit-Reset}}.
- Place at the API gateway (Nginx/Envoy/Spring Cloud Gateway) to block early, before reaching business services.

### Algorithm comparison
| Algorithm | How it works | Pros | Cons |
|---|---|---|---|
| Fixed window | Count in each minute, reset at minute boundary | Cheap, easy to understand | **Double burst at boundary** (100 at 12:00:59 + 100 at 12:01:00) |
| Sliding window log | Store timestamp of each request | Most accurate | Memory O(number of requests), hard to scale |
| Sliding window counter | Interpolate between previous and current windows | Cheaper, smoother than fixed | Still approximate, small error |
| **Token bucket** | Bucket holds N tokens, refills r tokens/sec | Allows controlled bursts, cheap | Must store 2 variables (tokens, timestamp) |
| Leaky bucket | Queue drains at fixed rate | Smooths output | Adds latency, not good for synchronous APIs |

For APIs, **token bucket** is usually best because real traffic has bursts: a user opens an app, fires 20 requests at once, then is quiet for 5 minutes.

### How token bucket works
Each key has {{capacity}} (max burst) and {{refillRate}} (tokens/second). When a request arrives:
1. Calculate {{elapsed = now - lastRefill}}.
2. {{tokens = min(capacity, tokens + elapsed × refillRate)}}.
3. If {{tokens >= cost}} then subtract and allow; otherwise block.

Example: capacity 100, refill 10/s. A user idle for 10 seconds gains 100 tokens (bucket full), then fires 100 consecutive requests — they all pass. That's controlled burst, not a bug.

### Distributed implementation with Redis
Common mistake: read token in app, calculate, write back. Two concurrent requests read the same {{tokens = 1}} and both get through → limit exceeded. Must combine calculation and write into **one atomic command**. Redis Lua runs single-threaded, making it suitable:

~~~text
-- KEYS[1] = rate:user:123 , ARGV = capacity, refill, now_ms, cost
local data = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(data[1])
local ts = tonumber(data[2])
local now = tonumber(ARGV[3])
if tokens == nil then
  tokens = tonumber(ARGV[1])
  ts = now
end
local refill = (now - ts) / 1000.0 * tonumber(ARGV[2])
tokens = math.min(tonumber(ARGV[1]), tokens + refill)
local cost = tonumber(ARGV[4])
local allowed = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], 86400000)
return { allowed, math.floor(tokens) }
~~~

Notes:
- Use **Redis's own time** ({{redis.call('TIME')}}) instead of the app's clock to avoid clock skew across nodes.
- TTL must exceed the time to fill the bucket; otherwise the key is deleted and the user gets a fresh burst.
- One Redis call per request is 0.3–1 ms in the same datacenter, acceptable; for faster needs, use a **local bucket + periodic sync** (request a quota portion from Redis every 100 ms). This allows slight overage but reduces Redis load by tens of times.

### Hot key and sharding
A partner API key calling 500k req/s makes one Redis key a bottleneck. Solutions:
- Split quota into N sub-counters ({{rate:key:0..N-1}}) and choose randomly/hash per request; total quota is approximate.
- For IP-based limits, use network prefix as key to avoid over-distribution.
- Cache the decision for very short periods (e.g., 10 ms) for hot keys, trading accuracy.

### What if the limiter fails?
- **Fail-open:** allow requests when Redis is unreachable. The system keeps serving, but loses protection — appropriate for normal read APIs.
- **Fail-closed:** block everything. Safe for payments, but turns a Redis outage into a system-wide outage.
- Practice: fail-open with a **local fallback limiter** (in-memory bucket per instance with evenly divided quota) to keep minimal protection.

### Graceful error responses
Beyond 429, return retry time and instructions. Good clients back off according to {{Retry-After}}; bad clients get blocked — that's the goal.

> Senior tip: don't rate-limit by user ID before authentication, because attackers can create millions of accounts. Always have an extra layer by IP and by endpoint; and remember that a company NAT may share thousands of users behind one IP — IP-based limits must be much wider than user-based limits.`,
    follow: [
      'How do you handle fair quota when one tenant consumes the entire cluster quota?',
      'If you need exact absolute sliding-window limits, what data structure do you choose?',
      'How do you test a rate limiter under high concurrent load without flaky results?'
    ],
  },
  'design-004': {
    q: 'Design a flash sale system: 100,000 requests in 1 second for 1,000 products, each user can only buy one, absolutely no oversell. Present the flow and failure handling.',
    a: `**Summary:** Flash sale is a **limited resource contention under extreme load**. Principles: block and decide as early as possible; deduct inventory with an **atomic conditional operation**; create orders asynchronously; and always have the DB as the final guard against oversell.

### Requirements
- **Functional:** sale opens at the exact time, each user max 1 per product, hold for 10 minutes to pay, waitlist when out of stock.
- **Non-functional:** 100k req/s in a few seconds, p99 response < 500 ms, **never oversell**, eventual consistency acceptable for notifications and statistics.
- **Priority:** inventory correctness > latency > absolute fairness.

### Quick estimation
1,000 products, 100,000 requests → over 99% will fail. So **most work is rejecting quickly**, not creating orders. The goal is letting only ~1,000 requests go deep.

### Overall architecture
~~~text
Client -> CDN/WAF -> LB -> API gateway (rate limit, auth)
                                |
                         Sale service
                          |         |
                  Redis (Lua)     Kafka (order created)
                  stock + user      |
                  dedup set         v
                              Order worker -> DB (conditional update)
                                                   |
                                              Payment service
~~~
Before sale opens: **warmup** puts inventory and eligible users into Redis. After sale: reconcile Redis with DB.

### Tier 1 — block at gateway
- Rate limit by user/IP/device fingerprint, e.g., 5 req/s.
- Authenticate before entering the sale service to filter unauthenticated bots.
- Can use a "waiting room" issuing tokens at a controlled rate to flatten traffic; users see queue position instead of errors.

### Tier 2 — decide in Redis with Lua
This is the anti-oversell mechanism. One atomic script does 3 things: check if the user already bought, check remaining stock, deduct stock and record the user.

~~~text
-- KEYS[1]=stock:sku, KEYS[2]=buyers:sku ; ARGV[1]=userId
if redis.call('SISMEMBER', KEYS[2], ARGV[1]) == 1 then
  return -1                      -- already bought
end
local left = tonumber(redis.call('GET', KEYS[1]) or '0')
if left <= 0 then
  return 0                       -- out of stock
end
redis.call('DECR', KEYS[1])
redis.call('SADD', KEYS[2], ARGV[1])
return 1                         -- reserved
~~~

Because Redis is single-threaded and the script is atomic, two concurrent requests can't both read {{left = 1}}. This is a **reservation**, not the final order.

### Tier 3 — asynchronous order creation
Successful requests are pushed to Kafka with a pre-generated {{orderId}} and {{reservationId}}. The API immediately returns "processing" with a lookup code, without making the user wait for DB write. Workers consume and create orders.

### Tier 4 — DB is the final guard
Redis can be wrong due to manual operations, backup restore, or script errors. DB must protect itself:

~~~sql
UPDATE inventory
   SET available = available - 1, version = version + 1
 WHERE sku = 'SKU-1' AND available >= 1;
-- affected rows = 0 => out of stock, cancel reservation

ALTER TABLE orders ADD CONSTRAINT uk_user_sku UNIQUE (user_id, sku);
~~~
- The conditional {{UPDATE}} is atomic at the row level; no need for {{SELECT ... FOR UPDATE}} then calculate in the app.
- The unique constraint prevents the case where two requests from the same user slip through Redis.
- If affected rows = 0, the worker marks the reservation failed and releases it.

### Hold and expiration
Reservation has a 10-minute TTL (Redis key + {{expires_at}} column in DB). A job scans expired reservations to restore inventory. Must be **idempotent**: restore only if the reservation status is still PENDING, using a conditional update to avoid double restore.

### Anti-oversell: real-world errors
| Error | Consequence | Prevention |
|---|---|---|
| Read inventory then write in app | Lost update, oversell | Conditional UPDATE or Lua |
| Trust Redis alone | Redis restore oversells | DB constraint + reconciliation |
| Retry creates duplicate order | One user with multiple orders | Unique (user, sku), idempotency key |
| Double inventory restoration | Sells more than actual | Reservation state + conditional update |
| Expiration job runs before payment callback | Paid order canceled | Lock both by orderId |

### Hot row and sharding
1,000 products, but one hot SKU can receive 50k req/s. That SKU's inventory row becomes a bottleneck. Two approaches:
- **Shard inventory** into N buckets (each with 1/N quantity); requests choose a bucket with remaining stock randomly. Increases throughput, but must accept that one bucket may run out while others remain.
- **Serialize by SKU** via Kafka partition key = sku: simpler, throughput a few thousand/s per partition, easier to keep correct.

With 1,000 products, bucket sharding usually wins because DB correctness is still protected.

### Failures and operations
- **Redis dies before sale opens:** cancel the sale or switch to DB-only mode with very low rate limits — better to be slow than to oversell.
- **Kafka stalls:** reservations remain, users see "processing"; need lag alerts and consumer scaling.
- **Reconciliation:** at end of day compare {{successful orders + expired reservations}} against initial quantity; any discrepancy is a P1 incident.
- **Transparency:** showing remaining quantity can cause contention; usually just show "in stock / out of stock".

> Senior tip: I always design flash sales so they can be **turned off in 1 minute** via feature flag, returning a "technical issue" page instead of selling incorrectly. Oversell is not just a data error, it's a media crisis — a single unfulfilled order costs far more than an early rejection.`,
    follow: [
      'If the requirement changes to allow up to 3 products per user, how does the Lua script change?',
      'How do you handle a payment callback arriving after the reservation has already expired?',
      'How do you reconcile inventory between Redis and DB without blocking live traffic?'
    ],
  },
  'design-005': {
    q: 'Design a payment / digital wallet system. How to ensure idempotency, ledger integrity, and reconciliation with partners?',
    a: `**Summary:** Payments are a **correctness and audit** problem, not a speed problem. Three pillars: idempotency key for every write, an **immutable double-entry ledger** as the source of truth, and **daily reconciliation** against partner statements. There is no "exactly-once" magic — only at-least-once combined with idempotent processing.

### Requirements
- **Functional:** deposit/withdraw, internal transfer, payment via provider (card, wallet), refund, view balance and history.
- **Non-functional:** no lost or created money; every change is traceable; p99 < 1s for internal commands; 99.99% availability; audit logs kept minimum 7 years.
- **Out of scope:** advanced fraud ML, complex multi-currency (but design must include currency field).

### Data model: double-entry ledger
Every transaction consists of **multiple entries** so that total debit = total credit. Never update balance directly; only **append** entries; balance is computed (or materialized and updated within the same transaction).

~~~sql
CREATE TABLE ledger_entry (
  id           BIGSERIAL PRIMARY KEY,
  txn_id       UUID NOT NULL,
  account_id   BIGINT NOT NULL,
  direction    CHAR(1) NOT NULL CHECK (direction IN ('D','C')),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency     CHAR(3) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uk_idem ON ledger_entry (txn_id, account_id, direction);
~~~
- Money stored in **smallest integer units** (VND as đồng, USD as cents). Never use {{double}}/{{float}} because of binary float errors.
- **Append-only table**: fix errors with reversal entries, never delete. This is an audit requirement, not a preference.
- Balance can be rebuilt from the ledger anytime; a balance table is only a read-optimized cache and must be reconciled periodically.

### Idempotency
Client sends {{Idempotency-Key}} (UUID) for each command. Server stores the key with request hash and response:
1. If new key: process, save response in the same transaction with the ledger entry.
2. If existing key with same request hash: return **exactly the old response**, don't reprocess.
3. If existing key with different body: return 409 to detect a client bug.
Retries due to network timeouts or user double-clicks are all safe.

### Transaction state machine
~~~text
INITIATED -> AUTHORIZED -> CAPTURED -> SETTLED
     |            |            |
     +----------> FAILED <-----+
     |                         |
     +--> EXPIRED       REFUNDED (from CAPTURED/SETTLED)
~~~
Every state transition is a **conditional update** ({{WHERE status = 'AUTHORIZED'}}). No arbitrary jumps; every unexpected event is logged and queued for investigation.

### Architecture
~~~text
Client -> Payment API -> Payment service -> Ledger DB (primary)
                              |                  |
                              |            outbox table
                              v                  |
                        Provider gateway <-- outbox relay -> Kafka
                              |                                  |
                       webhook receiver ----------------------+
                                                              v
                                                     Settlement/recon job
~~~
- **Outbox pattern:** ledger write and event recorded in the same DB transaction; a relay reads the outbox and publishes to Kafka. Avoid "write DB then call Kafka" dual-write — if Kafka fails, the two diverge.
- **Provider webhook** must be idempotent by {{provider_event_id}} because providers retry multiple times.

### Distributed transactions: saga, not 2PC
Transferring between two wallets in different services: debit A, credit B. Don't use distributed transactions. Use saga:
1. Debit A (ledger entry, status PENDING).
2. Emit event to service B.
3. Credit B succeeds → mark complete.
4. If step 3 fails after N retries → compensation entry (re-credit A).
Every step is idempotent and retryable. Intermediate states must be visible to users ("processing"), not silent.

### Reconciliation
Daily (and optionally hourly) download partner statements, match by {{provider_ref}}:
- **In our system, missing from partner:** pending transaction — investigate; provider may have timed out but not actually charged.
- **In partner, missing from our system:** lost webhook — actively query provider by ref.
- **Amount/currency/fee mismatch:** alert immediately, don't auto-correct.
- **Duplicates:** provider sent twice; ensure ledger has only one entry.

Reconciliation results must be saved and shown on a dashboard; "no discrepancy" is also a result that needs proof.

### Isolation and locking
- Balance updates: use {{UPDATE ... WHERE balance >= amount}} or row locks, and **lock accounts in ascending order** to avoid deadlock during two-way transfers.
- Isolation level: for the ledger, prefer short transactions and DB constraints; SERIALIZABLE may cause many retries and should be measured before broad use.

### Security and compliance
- Don't log card numbers/CVV; tokenize via provider.
- Least-privilege access; manual adjustments require 4-eyes approval.
- Immutable audit logs, exportable for auditors.

> Senior tip: the most expensive lesson I've learned is **never let the balance table be the only source of truth**. When something goes wrong, an append-only ledger lets you rebuild the full history and prove it to partners; a balance table updated incorrectly gives no way to know when it went wrong.`,
    follow: [
      'How do you handle a webhook arriving before the API has finished creating the transaction?',
      'If the provider does not provide detailed statements, what does reconciliation rely on?',
      'How to design a partial refund API on the ledger?'
    ],
  },
  'design-006': {
    q: 'Design a notification service sending email/SMS/push to millions of users. How to handle retry, priority, and prevent duplicates?',
    a: `**Summary:** Notification service is a **send-and-accept at-least-once** system that needs per-channel priority queues, retry with backoff, dedup by event, and complete separation from core business flows. A user's OTP must never wait behind a marketing campaign.

### Requirements
- **Functional:** send email, SMS, push, in-app; templates with variables; users configure notification types; view delivery history; cancel unsent notifications.
- **Non-functional:** 1 million notifications/day, peak 10k/min; OTP p99 < 3s end-to-end; no lost transaction notifications; marketing can delay.
- **Constraints:** third-party providers have rate limits and downtime.

### Architecture
~~~text
Service A --\
Service B ---> Notification API -> DB (notification, template)
Service C --/         |
                       v
                 Priority router
              /        |         \
         high(OTP)   normal      low(marketing)
              \        |         /
               Kafka topics (3 levels)
                     |
               Channel workers (email/sms/push)
                     |
               Provider adapters (SES, Twilio, FCM)
                     |
               Delivery status -> DB + webhook
~~~
The API accepts and returns **202 only**, never calls providers synchronously. Calling synchronously means the provider's latency and reliability become yours.

### Data model
~~~sql
CREATE TABLE notification (
  id            UUID PRIMARY KEY,
  user_id       BIGINT NOT NULL,
  channel       VARCHAR(10) NOT NULL,
  template_code VARCHAR(50) NOT NULL,
  payload       JSONB NOT NULL,
  dedup_key     VARCHAR(200) NOT NULL,
  priority      SMALLINT NOT NULL,
  status        VARCHAR(20) NOT NULL,
  attempts      INT NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uk_notif_dedup ON notification (dedup_key, channel);
~~~
{{dedup_key}} example {{order-paid:12345:email}} — the same business event creates only one notification per channel.

### Priority
Three separate topics, three separate worker groups (or the same workers but with weighted reading):
- **High:** OTP, security alerts, financial transactions. Never blocked by marketing.
- **Normal:** order confirmation, appointment reminders.
- **Low:** promotions, newsletters. Can delay a few hours.

Using a single queue with a priority field is the classic mistake: marketing floods in and makes OTP wait — a real incident.

### Retry
- Retry only for **temporary** errors: timeout, 429, 5xx. Permanent errors (invalid email format, nonexistent phone number, 4xx) are marked FAILED, not retried.
- **Exponential backoff + jitter**: 1s, 5s, 30s, 2m, 10m; jitter prevents thousands of workers retrying at the same time.
- Limit to 5–8 tries then move to **DLQ**. DLQ must have a tool to view and replay, with reason and payload.
- For provider rate limits, workers self-throttle (token bucket) instead of letting the provider return 429 continuously.

### Prevent duplicates
The system is at-least-once, so duplicates are a real possibility. Three layers:
1. Unique {{dedup_key}} on event receipt — blocks duplicates at the source.
2. Before calling the provider, set status to SENDING with a conditional update; if already SENDING/SENT, skip.
3. Some SMS providers support their own idempotency key; use it if available.
Absolute guarantee isn't possible if the provider doesn't support it; marketing duplicates are rare and acceptable, while resending OTP is expected (user uses the latest code).

### Template and content
- Templates stored in DB with versions; template changes don't require deploy.
- Render with validated data; **escape** user content to prevent injection in HTML email.
- Multi-language based on user locale.
- Cut SMS safely by Unicode character length.

### User preferences and regulations
- Preference table by {{user_id, channel, category}}; honor opt-out immediately.
- Quiet hours: don't send marketing at night according to the user's timezone.
- Log who consented to what and when — needed for compliance.

### Provider failover
Each channel should have at least two providers. A common adapter interface; when the primary provider fails repeatedly (circuit breaker opens), switch to backup. Note cost and quality differences; failover must trigger alerts so you don't silently burn budget.

### Monitoring
Mandatory metrics: queue lag by priority, delivery rate by provider, p99 latency, DLQ size, bounce/complaint rate for email. Rising bounce rate signals domain reputation decline — fix before blacklisting.

> Senior tip: I always separate OTP from the regular notification system, sometimes with its own provider. A marketing campaign sending 2 million wrong emails can clog the queue and delay OTP by 10 minutes — that's not just a slow email, it's users being unable to log in.`,
    follow: [
      'How do you design a cancel mechanism for a notification already in the queue?',
      'If the primary provider triples its price, how does the architecture help you switch?',
      'How to measure email quality without reading user content?'
    ],
  },
  'design-007': {
    q: 'Design a news feed for a social network. Compare fan-out on write vs fan-out on read; how does a hybrid architecture handle celebrities?',
    a: `**Summary:** News feed is a **massive reads with broad writes** problem. Fan-out on write (push) gives fast reads but expensive writes; fan-out on read (pull) has cheap writes but expensive reads. Real systems use **hybrid**: push for normal users, pull and merge for celebrities.

### Requirements
- **Functional:** view feed of followed users, sorted by time or relevance; pagination; new posts visible within seconds; deleted posts disappear from feed.
- **Non-functional:** 50M DAU, average 200 follows per user, 5M new posts/day; reads 20×/day/user ≈ ~11,500 reads/s average, peak 50k. p99 feed load < 300 ms. Eventual consistency of a few seconds is acceptable.

### Estimating write amplification
A user with 1,000 followers publishes one post → 1,000 feed records. With 200 followers on average and 5M posts/day → **1B feed records/day**. A celebrity with 50M followers: one post = 50M records — impossible to push.

### Two models
| Criteria | Fan-out on write (push) | Fan-out on read (pull) |
|---|---|---|
| Write | Expensive, scales with followers | Cheap, only writes original post |
| Read | Very fast, pre-built list | Slow, must merge multiple sources |
| New post visibility | A few seconds (depends on worker) | Almost instant |
| Celebrity | Write amplification disaster | Naturally handled |
| Storage | Hundreds of times larger | Small |
| Delete/update | Must propagate to all feeds | Only edit original |

### Hybrid architecture
~~~text
Post service -> Kafka (post-created)
                    |
            Fan-out worker
             /            \
   follower < 10k      follower >= 10k
        |                     |
  push into feed cache   mark "celebrity post"
  for each follower       (only 1 record written)
        |                     |
        +--------+------------+
                 |
        Feed service on read:
        1. get pushed feed from Redis (ZSET)
        2. get recent celebrity posts from followed accounts
        3. merge by timestamp, paginate
~~~
- Feed cache: Redis sorted set, {{key = feed:userId}}, {{score = timestamp}}, {{member = postId}}, trimmed to 800–1,000 posts. Older posts fall back to DB.
- Celebrity follow list per user cached separately, rarely changes.
- Fan-out worker scales horizontally by userId partition; processes in batches to reduce Redis round-trips.

### Write flow
1. User posts: Post service saves the post, emits {{post-created}} event.
2. Fan-out worker reads follower list (cached).
3. For normal followers: {{ZADD feed:userId timestamp postId}} per user, pipelined in batches of 500.
4. For celebrity: don't push; record in the author's "recent posts" list.
5. Online users can receive real-time notifications via WebSocket, but the feed itself stays gradually consistent.

### Read flow
1. Get latest N posts from feed ZSET ({{ZREVRANGEBYSCORE}}).
2. Get recent celebrity posts that the user follows, limited by time.
3. Merge both lists, deduplicate, take enough for the page.
4. Hydrate post info (content, author, media) from cache/DB in batches — avoid N+1.
5. Return cursor as {{(score, postId)}} for stable pagination.

### Pagination
Don't use offset because the feed changes continuously and will cause duplicates/missing items. Use a **cursor** based on score + id; the condition is {{score < lastScore OR (score = lastScore AND id < lastId)}}.

### Delete and edit
- Delete: mark deleted on the original post; feed reads through a filter layer. For pushed feeds, the deleted post may remain in cache until TTL, or the worker can propagate a delete event (expensive).
- Edit content: edit only the original, the feed only stores the id, so it's automatically correct — a major benefit of **storing pointers, not copies**.

### Ranking
Time-ordered is the easy default. For ranked feeds:
1. **Candidate generation:** gather a few hundred posts from push/pull/trending.
2. **Scoring:** features (recency, engagement, relationship, content type) through a model.
3. **Re-ranking:** diversity, deduplicate, ads.
Separate ranking from storage; cache results briefly. Don't run heavy models synchronously if p99 is affected.

### Common incidents
| Incident | Cause | Mitigation |
|---|---|---|
| Slow fan-out | Celebrity or worker stall | Celebrity threshold, batching, backpressure |
| Empty feed | Redis data loss | DB fallback + rebuild on demand |
| Duplicate posts | Push + pull merge | Deduplicate by postId |
| Hot key | One user read constantly | L1 cache, replication |
| Deletion not propagated | Old id still in cache | Filter on hydration, short TTL |

> Senior tip: the celebrity threshold shouldn't be a fixed 10k. I once saw an account with 8k followers whose post went viral with 2 million interactions, blocking the fan-out queue. Use a dynamic threshold based on actual load and always have a mechanism to disable push for a specific account.`,
    follow: [
      'If the product requires immediate consistency when following/unfollowing, how do you handle it?',
      'How do you rebuild feeds when Redis loses all data without crashing the system?',
      'How to personalize feeds while keeping p99 under 300 ms?'
    ],
  }
});

