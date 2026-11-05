/*
 * English translation of js/data/q-scenario.js — task T732. Format: js/core/i18n.js (content overlay).
 * ids: scenario-109 scenario-110 scenario-111 scenario-112 scenario-113 scenario-114 scenario-115 scenario-116
 */
App.i18n.content({
  'scenario-109': {
    q: 'A Ninjavan interviewer asks: how would you design Feature Flags to enable/disable a feature for a subset of users while optimizing for performance?',
    a: `**Summary:** A Feature Flag is an on/off switch for a capability that can be enabled per user or segment; store definitions in the DB and cache them in Redis, evaluate using hash bucketing, and refresh periodically.

### Context
- Used for gradual rollout, A/B testing, and as a kill switch when an incident happens.
- Evaluating a flag must not add more than a few milliseconds to the request path.

### Approach
1. Model: {{Flag}} (key, default, rules), {{Override}} (user/segment).
2. Storage: Redis cache + DB; TTL 30s; invalidate via pub/sub.
3. Evaluate: hash {{userId}} into a bucket 0..99 and compare against the rollout %; apply segment rules (country, plan).
4. SDK caches flags in-memory with periodic refresh.

### Trade-offs
| Storage | Pros | Cons |
| SQL | ACID, easy to query | joins become slow with many rules |
| NoSQL | scales well | eventual consistency |

### Pitfalls
- Flags accumulate over time → schedule periodic cleanup.
- No audit of who toggled a flag → incidents become hard to trace.

> Senior tip: A feature flag is intentional technical debt; set an expiry date and an owner for every flag.`,
    follow: [
      'How do you roll out safely from 1% to 100%?',
      'How is a kill switch different from a feature flag?'
    ]
  },
  'scenario-110': {
    q: 'An interviewer asks: an API is being spammed — how do you apply rate limiting effectively at large scale?',
    a: `**Summary:** Rate limiting uses Token Bucket or Sliding Window on Redis, keyed by user/IP/API key; return 429 + Retry-After.

### Concepts
- Token Bucket: a bucket of tokens refills at a steady rate; each request consumes 1 token.
- Sliding Window: counts requests within a moving time window.

### Approach
1. Key: {{userId}} or {{ip}} or {{apiKey}}.
2. Redis: {{INCR}} + {{EXPIRE}} (fixed window); sorted set (sliding window).
3. Distributed: use a Lua script for atomicity.
4. Response: HTTP 429 with a {{Retry-After}} header.

### Trade-offs
| Algorithm | Pros | Cons |
| Fixed window | simple | burst at window boundaries |
| Sliding window | smooth | higher memory usage |
| Token bucket | flexible | harder to tune |

### Pitfalls
- Rate limiting at the app layer can be bypassed when there are many instances → centralize at the gateway/Redis.
- Keying by IP causes NAT users to be blocked incorrectly.

> Senior tip: Rate limiting is protection, not business logic; set different limits for read/write and for tiers.`,
    follow: [
      'How do you rate limit by tier (free/pro)?',
      'What is the difference between throttling and rate limiting?'
    ]
  },
  'scenario-111': {
    q: 'An interviewer asks: two users try to buy the last concert seat at the same time — how do you handle the concurrency?',
    a: `**Summary:** Use a pessimistic lock ({{SELECT ... FOR UPDATE}}) or an optimistic lock (version column) on the seat row; combine it with an idempotency key and a transaction.

### Mechanism
- Pessimistic: lock the seat row at the start of checkout; other users wait or time out.
- Optimistic: {{update ... where version = ?}}; if 0 rows are affected → conflict, retry.

### Approach
1. Seat states: AVAILABLE/HELD/SOLD.
2. Hold the seat with a TTL (5 minutes) via Redis/DB.
3. Payment succeeds → SOLD; payment fails or TTL expires → release.

### Trade-offs
| Approach | Pros | Cons |
| Pessimistic | safe | lower throughput |
| Optimistic | high throughput | retry storm |

### Pitfalls
- Deadlock when locking multiple seats → always lock in id order.
- Holds that are never released → "ghost" seats.

> Senior tip: Combine optimistic locking with an idempotency key; monitor the conflict rate.`,
    follow: [
      'How do you design an idempotency key?',
      'How do you avoid a double charge?'
    ]
  },
  'scenario-112': {
    q: 'An interviewer asks: explain database indexes, B-Tree vs Binary Tree, and how to check whether a column is indexed.',
    a: `**Summary:** An index is an auxiliary structure (usually a B-Tree) that speeds up lookups; a B-Tree is balanced and well-suited for range queries; check via {{EXPLAIN}} and the catalog.

### Concepts
- B-Tree: a balanced tree where each node holds many keys; supports =, <, >, BETWEEN, ORDER BY.
- Binary tree: each node has 2 children; it can become skewed and is not suitable for disk access.

### Checking indexes
~~~sql
EXPLAIN ANALYZE SELECT ...;
SELECT * FROM pg_indexes WHERE tablename='t';
~~~

### When not to use an index
- Small tables; columns with low cardinality (boolean); write-heavy workloads.

### Pitfalls
- The index is not used because of an implicit cast or a function applied to the column.
- Too many indexes slow down writes.

> Senior tip: An index is a read/write trade-off; measure the real plan, do not guess.`,
    follow: [
      'How does column order matter in a composite index?',
      'What is a covering index?'
    ]
  },
  'scenario-113': {
    q: 'An interviewer asks: how do isolation levels differ, and how do locking levels work?',
    a: `**Summary:** Isolation levels (Read Uncommitted/Committed/Repeatable Read/Serializable) control dirty/non-repeatable/phantom reads; locking (row/table, shared/exclusive) is the underlying mechanism.

### Table
| Level | Dirty | Non-repeatable | Phantom |
| Read Uncommitted | yes | yes | yes |
| Read Committed | no | yes | yes |
| Repeatable Read | no | no | yes* |
| Serializable | no | no | no |

*InnoDB RR also prevents phantoms using gap locks.

### Locking
- Shared (S) for reads; Exclusive (X) for writes.
- Row-level vs table-level; deadlocks occur when locks form a cycle.

### Pitfalls
- Choosing Serializable for everything → low throughput.
- Long transactions hold locks → contention.

> Senior tip: Default to Read Committed plus explicit locking when needed; measure contention.`,
    follow: [
      'How does MVCC work?',
      'What is a gap lock?'
    ]
  },
  'scenario-114': {
    q: 'An interviewer asks: when should you use Kafka instead of REST/RPC, and what are the trade-offs?',
    a: `**Summary:** Kafka is a distributed log, well-suited for event streaming, decoupling, and replay; REST/RPC is for synchronous request/response.

### Comparison
| Criterion | Kafka | REST/RPC |
| Coupling | loose | tight |
| Latency | ms-seconds | ms |
| Ordering | per-partition | not guaranteed |
| Replay | yes | no |

### When to use Kafka
- Event sourcing, audit logs, analytics pipelines, async tasks.
- When you need to decouple producers/consumers and scale them independently.

### Pitfalls
- Using Kafka for simple request/response → unnecessary complexity.
- Non-idempotent consumers → duplicate processing.

> Senior tip: Start with REST; move to Kafka when you need async/replay/scale.`,
    follow: [
      'What is a consumer group?',
      'What are exactly-once semantics?'
    ]
  },
  'scenario-115': {
    q: 'An interviewer asks: with Redis caching, what should you cache and how do you handle cache hits and misses?',
    a: `**Summary:** Cache data that changes infrequently and is read often; on a hit return from the cache, on a miss query the DB then set the cache; handle invalidation and stampedes.

### Strategies
- Cache-aside: the app performs get/set itself.
- Write-through: write to the DB and the cache at the same time.
- TTL + invalidation via events.

### Cache hit/miss
- Hit: return immediately.
- Miss: query the DB, set the cache with a TTL, return.

### Pitfalls
- Cache stampede when many TTLs expire at once → add jitter to TTLs, use locking.
- Stale data → make invalidation explicit.
- Cache penetration (keys that do not exist) → use a bloom filter or cache nulls.

> Senior tip: A cache is an optimization, not the source of truth; always have a DB fallback.`,
    follow: [
      'What is a cache avalanche?',
      'What is write-behind caching?'
    ]
  },
  'scenario-116': {
    q: 'An interviewer asks: a query on a table with billions of rows is still slow even though indexes are in place — what do you do?',
    a: `**Summary:** Check whether the index is actually used ({{EXPLAIN}}), partition by time, rewrite the query, and verify statistics and I/O.

### Investigation
- {{EXPLAIN (ANALYZE, BUFFERS)}}: Seq Scan? Sort spill?
- Stale statistics → run {{ANALYZE}}.
- Index not matched due to a function or cast on the column.

### Solutions
1. Partition by time (range) for large datasets.
2. Rewrite: avoid {{SELECT *}}, avoid functions on indexed columns.
3. Add a covering index for the hot query.
4. Use a read replica for heavy listing queries.

### Pitfalls
- Moving from a non-partitioned table to a partitioned one requires a migration plan.
- Indexes are "in place" but the planner does not choose them → verify.

> Senior tip: Always verify with the real plan; do not trust the assumption that "the index exists".`,
    follow: [
      'What is partition pruning?',
      'When should you use a materialized view?'
    ]
  }
});
