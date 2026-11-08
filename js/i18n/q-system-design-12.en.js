/*
 * English translation of js/data/q-system-design.js — task T790. Format: js/core/i18n.js (content overlay).
 * ids: design-030 design-031 design-032 design-033 design-034 design-035
 */
App.i18n.content({
  'design-030': {
    q: 'Design a multi-channel notification service.',
    a: `**Summary:** A multi-channel notification service must deliver at-least-once, deduplicate by the pair (dedupKey, channel), use a dedicated queue per channel, enforce priority, retry with backoff plus jitter, and trip a circuit breaker on the downstream provider.

### 1. Why at-least-once and not exactly-once?

Exactly-once across a network is impossible (Two Generals Problem). The practical pattern is at-least-once plus dedup: the producer retries when it does not receive an ACK, and the consumer skips a message when it has already seen its dedupKey.

### 2. Dedup key

dedupKey = hash(userId + templateId + businessEventId + channel). Store it in Redis with SETNX and a 24h TTL; if the key already exists the message is skipped.

### 3. Per-channel queues

Each channel (email, SMS, push, in-app) gets its own queue because:
- SLAs differ (OTP SMS < 5s, email may take 30s).
- Providers differ.
- Rate limits differ.

Priority queue order: OTP > transactional > marketing.

### 4. Retry + jitter

Exponential backoff 1s, 2s, 4s, ... with full jitter to avoid a thundering herd when the provider recovers.

### 5. Circuit breaker

When the error rate exceeds 50% over a 10s window, open the breaker for 30s, then probe in half-open state. This stops hammering a dead provider.

### 6. OTP priority

OTP bypasses the marketing queue, runs on a dedicated queue with dedicated workers, and retries faster.

~~~seq
title: Notification send flow
actors: App | Notification Service | Queue | Provider
App -> Notification Service: event (userId, template)
Notification Service -> Notification Service: dedup check
Notification Service -> Queue: enqueue per channel
Queue -> Provider: send
Provider --> Queue: ACK / fail
Queue -> Notification Service: retry on fail
~~~

### Pitfalls

- Dedup TTL too short → duplicate sends after a restart.
- Non-idempotent provider call → retry sends the message twice.
- Marketing flood starves the OTP queue.

> Senior tip: OTP must run on its own queue with dedicated workers and an SLA under 5s; marketing may be delayed. Use full jitter (random 0..backoff) rather than equal jitter so retries do not synchronize.`,
    follow: ['How is OTP prioritized?', 'Why is jitter needed?'],
  },
  'design-031': {
    q: 'Design a real-time leaderboard.',
    a: `**Summary:** A real-time leaderboard uses a Redis Sorted Set (ZSET): ZINCRBY atomically adds points, ZREVRANGE returns the top scores, ZREVRANK returns a user's rank, and the database is the source of truth for recovery.

### 1. Why a Redis ZSET?

A ZSET stores member-score pairs and sorts in O(log N) per operation. Being in-memory it achieves millisecond latency, which is what a leaderboard needs for continuous updates.

### 2. Key commands

- ZINCRBY lb score userId — atomically add points.
- ZREVRANGE lb 0 9 WITHSCORES — top 10.
- ZREVRANK lb userId — 0-based rank.
- ZSCORE lb userId — current score.

### 3. Tie-breaker

Redis breaks ties lexicographically on the member string. To break ties by the time the score was achieved, encode the score as a composite: score * 1e9 + (MAX_TS - ts), so the earlier achiever ranks higher.

### 4. Recovery after crash

Redis is a cache; the database holds score history. When Redis is lost, rebuild the ZSET from the database in a batch. Alternatively use Redis persistence (AOF every second) plus a replica.

### 5. Scaling

- Shard by leaderboard key (global vs per-game).
- For a very large leaderboard (millions of users), keep only the top-N in Redis and give normal users an approximate rank via bucketing.

### Pitfalls

- Using INCR on a String then SORT → O(N log N) per query, which is slow.
- No persistence → data loss on restart.
- A single hot leaderboard becomes a bottleneck; partition it.

> Senior tip: Always keep a database source of truth plus a rebuild script; Redis is only a view. Encode the tie-breaker into the score so ranking is deterministic and race-free.`,
    follow: ['Tie-breaker?', 'Recovery?'],
  },
  'design-032': {
    q: 'Design real-time 1-1 and group chat.',
    a: `**Summary:** Real-time chat uses WebSockets, persists each message before broadcasting, fan-out is hybrid (direct for small groups, pub/sub for large groups), presence is tracked, and push notification fires when a user is offline.

### 1. Persist before broadcast

Persist the message to the database before broadcasting so durability and ordering are guaranteed; the client ACKs by message id.

### 2. Hybrid fan-out

- Small groups (under 1000): the server fans out directly to each member's connection.
- Large groups (a celebrity channel): publish/subscribe through Redis or Kafka, and clients subscribe to the topic.

### 3. Presence

Heartbeat every 30s; entries in Redis with a 60s TTL. When a user goes offline, send a push notification.

### 4. Reconnect

The client reconnects with exponential backoff and resumes from the last message id (cursor) so no messages are lost.

### 5. Ordering

Sequence numbers are assigned per conversation; the client reorders by seq.

### Pitfalls

- Broadcasting before persisting → message loss on crash.
- Presence storms with millions of connections → use distributed presence.
- WebSocket sticky sessions → the load balancer must use consistent hashing.

> Senior tip: Always persist first and use cursor-based resume; presence is best-effort and must not block message delivery.`,
    follow: ['Fan-out?', 'Reconnect?'],
  },
  'design-033': {
    q: 'Design a news feed with celebrities.',
    a: `**Summary:** A celebrity news feed uses hybrid fan-out: push for ordinary users (write-time fan-out) and pull for celebrities (read-time merge), with cursor-based pagination.

### 1. The celebrity problem

Write-time fan-out for a celebrity with millions of followers causes massive write amplification and is slow. Read-time fan-out for everyone makes reads slow for all users.

### 2. Hybrid

- Ordinary users: write-time fan-out pushes posts into each follower's feed cache.
- Celebrities: no fan-out; when a follower reads their feed, celebrity posts are merged on read.

### 3. Cursor-based pagination

Use a cursor (timestamp + id) instead of OFFSET to avoid skips and duplicates when data is changing. A large OFFSET forces an O(N) scan.

### 4. Ranking

Score = affinity + recency + engagement; merge the top-K from multiple sources.

### 5. Cache and invalidation

Feed cache has a short TTL; a celebrity post lazily invalidates follower feeds.

### 6. Monitoring

Track fan-out lag, feed freshness, and read latency at p99.

### Pitfalls

- Cache stampede on a celebrity post → use coalescing.
- Unstable cursor under clock skew → use Snowflake ids.
- A viral celebrity post → thundering herd.

> Senior tip: Hybrid fan-out trades write cost against read cost; pick a follower threshold (e.g. 10k) to switch to pull.`,
    follow: ['Why hybrid?', 'Cursor vs OFFSET?'],
  },
  'design-034': {
    q: 'Design file storage with deduplication.',
    a: `**Summary:** Deduplicating file storage uses content-addressable storage (CAS): the content hash is the id, chunking enables partial dedup (delta), and reference counting drives garbage collection.

### 1. Content-addressable

The file id is SHA-256(content). Uploading the same content yields the same id, so the upload is skipped and the reference count is incremented.

### 2. Chunking

Split a file into chunks (e.g. 4MB) so partial dedup works (delta). This is useful for backups and versioning.

### 3. Reference counting

Each file/chunk has a reference count; when it reaches zero, garbage collection runs (soft delete, then hard delete after a TTL).

### 4. Integrity

Verify the hash after upload and download; on corruption, re-fetch from a replica.

### 5. Storage tiers

Hot (SSD) for recent data, cold (S3 Glacier) for archives.

### 6. Upload flow

Client hashes the content → checks existence → uploads missing chunks → commits the manifest.

### 7. Concurrency and consistency

The manifest commit uses optimistic locking on the file id; conflicts are retried. Chunk uploads are idempotent by chunk hash.

### 8. Cost optimization

Tiering plus a lifecycle policy automatically moves cold data after 30 days of no access.

### Extra pitfalls

- Orphaned chunks from a failed upload → GC sweep.
- Cross-tenant dedup must respect privacy (hash leakage reveals existence) → salt per tenant.

> Senior tip: CAS plus reference counting is the foundation of Dropbox and Borg; always have a GC job and an integrity check.`,
    follow: ['Why chunking?', 'Reference counting?'],
  },
  'design-035': {
    q: 'Design ticketing that prevents overbooking.',
    a: `**Summary:** Overbooking-proof ticketing uses a hold with a TTL plus SELECT FOR UPDATE, an expiry worker that releases held seats, and an atomic confirm that transitions a hold into a booking.

### 1. Hold phase

When a user selects a seat, INSERT a hold with expires_at = now + 10 minutes and status=HOLD. Use SELECT FOR UPDATE on the seat row to serialize concurrent holds.

### 2. Expiry worker

A scheduled job runs UPDATE seat SET status=AVAILABLE WHERE status=HOLD AND expires_at < now.

### 3. Confirm

On payment success, run UPDATE seat SET status=BOOKED WHERE id=? AND status=HOLD AND expires_at > now (conditional). If zero rows are affected, the hold has expired and the booking fails.

### 4. Pessimistic vs optimistic

- Pessimistic (FOR UPDATE): serializes, safe, lower throughput.
- Optimistic (version column): higher throughput, retries on conflict; suitable under low contention.

### Pitfalls

- Hold TTL too short → the user has not finished paying.
- Expiry worker races with confirm → the conditional update protects against it.
- Over-selling happens if the update is not conditional.

> Senior tip: Always use a conditional update with a status check; the expiry worker is only cleanup, not the authority.`,
    follow: ['Pessimistic vs optimistic?', 'Hold expired?'],
  },
});
