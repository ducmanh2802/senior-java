/*
 * English translation of js/data/quiz-design.js — task T426. Format: js/core/i18n.js (content overlay).
 * ids: qz-design-007 qz-design-008 qz-design-009 qz-design-010 qz-design-011 qz-design-012 qz-design-013 qz-design-014 qz-design-015 qz-design-016 qz-design-017 qz-design-018 qz-design-019 qz-design-020 qz-architecture-007 qz-architecture-008 qz-architecture-009 qz-architecture-010 qz-architecture-011
 */
App.i18n.content({
  'qz-design-007': {
    q: `A social network with 200 million users uses fan-out on write for its news feed. A singer with 50 million followers publishes a post and the fan-out queue is backed up for 40 minutes. Which fix is most appropriate?`,
    options: [
      `Hybrid: ordinary users still get fan-out on write, while accounts with more followers than a threshold (for example > 100k) are not fanned out and instead get merged into the feed at read time (fan-out on read)`,
      `Move the whole system to fan-out on read: every time the app opens, query the new posts of everyone the user follows`,
      `Scale the fan-out consumers up 10x so 50 million copies can be written faster`,
      `Limit every account to at most 5 million followers`
    ],
    explain: `**Correct answer: hybrid fan-out, with celebrities pulled in at read time.**

### Why this is correct
- **Fan-out on write** (push): when a post is published, the system copies the post id into each follower's feed cache. Reading the feed is extremely fast (just read a ready-made list), but the write cost is proportional to the number of followers: one post by a celebrity = 50 million writes.
- **Fan-out on read** (pull): the posts are gathered from the people you follow at read time. Writes are cheap, but reads are expensive if you follow many people.
- Follower distribution is extremely skewed: 99.9% of users have a few hundred followers, and only a few thousand accounts have millions. Hybrid uses push for the majority (fast reads) and pull for the few celebrities: when a user opens the feed, take the pre-pushed feed and then **merge** in the latest posts of the few celebrities they follow (each celebrity has its own timeline that is kept hot in cache).

### Why the other options are wrong
- **Move everything to fan-out on read**: a user who follows 500 people would have to query 500 timelines and sort them every time the app opens; with 200 million users that is an enormous read load, and it throws away the fast-read advantage for the majority.
- **10x the consumers**: you still have to write 50 million copies for one post, which burns cache memory, and you only move the bottleneck to Redis/storage; the celebrity's second post backs up again.
- **Limit followers**: that is an unacceptable product decision, not a technical solution.

> Senior tip: the celebrity threshold should be dynamic configuration and should also account for posting frequency. The feed cache usually keeps only the few hundred most recent post ids for users active within 30 days; inactive users are not fanned out to, which saves memory.`
  },
  'qz-design-008': {
    q: `Quick estimate for a URL shortener: 100 million new URLs per month, kept for 5 years, each record (short code, original URL, metadata) about 500 bytes. Roughly how much raw storage is needed?`,
    options: [
      `About 300 GB`,
      `About 3 TB`,
      `About 30 TB`,
      `About 300 TB`
    ],
    explain: `**Correct answer: about 3 TB.**

### How to compute it
~~~text
100 million/month x 12 months x 5 years = 6 billion records
6 x 10^9 x 500 bytes = 3 x 10^12 bytes = 3 TB
~~~
This is raw capacity, excluding indexes, replicas (usually x3) and storage engine overhead. When presenting, say it explicitly: "3 TB of raw data, roughly 10-15 TB once you count indexes and 3 replicas" to show you know the real on-disk number is larger.

### Why the other options are wrong
- **300 GB**: off by one order of magnitude, usually from forgetting to multiply by 5 years or assuming 50 bytes per record.
- **30 TB**: off by one order in the other direction, for example by mistakenly using 5,000 bytes per record.
- **300 TB**: off by two orders, possibly from adding click traffic (100 reads per URL) to storage, even though reads create no new data unless analytics are persisted.

### Design implications
3 TB still fits in a small database cluster or a handful of shards, so the design does not need to be overly complex. QPS is the part that matters: 100 million per month is about 40 writes/second on average, and with a 100:1 read ratio that is about 4,000 reads/second, with peaks 3-5x higher. That read volume needs a cache (Redis/CDN) in front of the database.

> Senior tip: memorize the anchors "one month is about 2.5 million seconds" and "one day is about 86,400 seconds (round to 10^5)". The interviewer is judging how you round and sanity-check the numbers, not byte-level precision.`
  },
  'qz-design-009': {
    q: `A cache cluster of 10 nodes currently splits keys with {{hash(key) % N}}. Adding an 11th node during peak traffic drops the cache hit rate from 95% to nearly 10% and the DB is overloaded. Which explanation is correct?`,
    options: [
      `The new node has not warmed up, so only about 1/11 of keys miss; the sharp hit-rate drop is a TTL misconfiguration`,
      `Modulo hashing only changes the node of keys whose hash is divisible by 11`,
      `With modulo, about 10/11 (nearly 91%) of keys move to a different node, so almost the entire cache misses; consistent hashing (with virtual nodes) only moves about 1/11 of the keys`,
      `Consistent hashing also moves about 91% of the keys; the only difference is a more even distribution`
    ],
    explain: `**Correct answer: modulo hashing moves about 91% of keys to another node; consistent hashing only moves about 1/11.**

### Why this is correct
- With {{hash % N}}, when N changes from 10 to 11, a key keeps its node only when {{h % 10 == h % 11}}, which is a small fraction (about 1/11). Almost every key "moves house", so the first request for each key misses and goes straight to the DB, like a cache stampede across the whole cluster.
- **Consistent hashing**: nodes and keys are hashed onto the same circle (ring). A key belongs to the first node clockwise. Adding a node only "cuts" one arc away from the neighbouring node, so only about 1/(N+1) of keys move. **Virtual nodes** (each physical node holds 100-200 points on the ring) make the cut arcs come evenly from many nodes instead of loading all of them onto one.

### Why the other options are wrong
- **Only 1/11 of keys miss because the node is cold**: that is the behaviour of consistent hashing, not modulo.
- **Only keys whose hash is divisible by 11**: mathematically wrong; {{h % 10}} and {{h % 11}} differ for the vast majority of h.
- **Consistent hashing also moves 91%**: wrong; its core advantage is precisely that it only moves the 1/(N+1) fraction.

> Senior tip: Redis Cluster does not use consistent hashing; it uses 16,384 fixed hash slots ({{CRC16(key) % 16384}}), so adding a node migrates slots in a controlled way. Whatever the mechanism, resize cache clusters off-peak and watch DB QPS during the migration.`
  },
  'qz-design-010': {
    q: `Service A holds a distributed lock in Redis (TTL 10 seconds) while writing a report file to storage. A suffers a 30-second GC pause, the lock expires, service B acquires it and finishes the write; then A wakes up and overwrites the data with the old content. What is the correct countermeasure?`,
    options: [
      `Raising the TTL to 60 seconds is enough, since GC pauses rarely exceed that`,
      `Switch to Redlock with 5 independent Redis nodes`,
      `Before writing, A re-checks with a GET that the lock still belongs to it, then writes`,
      `Use a fencing token: every lock grant returns an increasing number, and storage rejects any write carrying a token smaller than the highest token it has seen`
    ],
    explain: `**Correct answer: a fencing token checked on the storage side.**

### Why this is correct
The root problem: a client **cannot know for sure** it still holds the lock at the moment it performs the write, because between the check and the write there can always be a pause (GC, CPU throttling, slow network). A fencing token moves the check to **the side that receives the write**:
~~~text
A acquires lock -> token 33   (then GC pause)
lock expires, B acquires lock -> token 34, writes with 34 -> storage records max=34
A wakes up, writes with 33 -> storage sees 33 < 34 -> rejects
~~~
The token can be an increasing number issued by the lock service (ZooKeeper zxid, etcd revision) or a version column in the DB ({{UPDATE ... WHERE version < :token}}).

### Why the other options are wrong
- **Increase the TTL**: it only makes the incident rarer rather than eliminating it; pauses can come from swapping, VM migration, or a network partition. A longer TTL also makes the system wait longer when A really has died.
- **5-node Redlock**: it increases the availability of the lock service, but does not solve a client that pauses after receiving the lock. Martin Kleppmann made exactly this point in his Redlock analysis.
- **GET again before writing**: there is still a gap between the GET and the write command (check-then-act), and the pause can land right in it.

> Senior tip: if the target resource is a database, you often do not need a distributed lock: optimistic locking (a version column) or a unique constraint is usually simpler and safer. Use a Redis lock for **efficiency** (avoiding duplicated work); **correctness** must be guaranteed by the storage.`
  },
  'qz-design-011': {
    q: `The system uses cache-aside with Redis in front of PostgreSQL. Occasionally a product price in the cache is hours older than the DB. Which measures correctly reduce stale cache? (Choose 2)`,
    options: [
      `On update, write the new price to the cache first, then write the DB`,
      `On update, write the DB and then delete the cache key instead of setting the new value into the cache`,
      `Remove the TTL so the cache never expires and there are no misses`,
      `Invalidate the cache from CDC (Debezium reading the WAL/binlog) with retries, so the key is still deleted even if the app crashes right after commit`,
      `Delete the cache key inside the DB transaction, before commit`
    ],
    explain: `**Correct answer: write the DB then delete the cache; and invalidate through CDC with retries.**

### Why this is correct
- **Write the DB then delete the cache**: delete is safer than set because two concurrent updates can set the cache in the reverse order of their commits (A commits first but sets later, so the cache holds A's value even though the DB holds B's). With delete, the next read loads again from the DB. A rare race still exists (a reader reads the old DB value, the writer writes and deletes, then the reader sets the old value), so always keep a TTL as a safety net.
- **CDC**: if the app crashes between "commit the DB" and "delete the cache", the stale key lives until the TTL expires. Debezium reads committed changes from the DB log and emits events; a consumer deletes the key with retries, so the deletion eventually happens.

### Why the other options are wrong
- **Write the cache first, then the DB**: if the DB write fails or rolls back, the cache holds a value that never existed in the DB.
- **Remove the TTL**: every inconsistency would then be permanent; the TTL is the last line of defence.
- **Delete the cache before commit**: a read that sneaks in after the delete but before the commit reads the old value from the DB and loads it back into the cache, giving the stale value another full TTL.

> Senior tip: for sensitive data such as prices, combine three layers: delete after commit, CDC invalidation and a short TTL (a few minutes) with jitter. Measure the stale rate by sampling and comparing cache against DB instead of guessing.`
  },
  'qz-design-012': {
    q: `E-wallet: a merchant account receives and spends about 200 transactions/second, and the balance must never go negative. Which way of deducting money is both correct and able to handle the load?`,
    options: [
      `Inside the same transaction: {{UPDATE account SET balance = balance - :amt WHERE id = :id AND balance >= :amt}}, check that the affected row count is 1, then INSERT the ledger entries`,
      `Read the balance with a SELECT inside the default {{@Transactional}} (READ COMMITTED), check in Java that the funds are sufficient, then UPDATE the new value`,
      `Use a Redis distributed lock per account id, read and write the balance normally inside it, with no constraint in the DB`,
      `Deduct asynchronously through Kafka, and a daily batch checks which accounts went negative and claws the money back`
    ],
    explain: `**Correct answer: an atomic conditional UPDATE together with ledger writes in the same transaction.**

### Why this is correct
- The statement {{UPDATE ... WHERE balance >= :amt}} is executed atomically by the DB on a single row: the row is write-locked while it is updated, and the condition is re-evaluated on the newest version. If there is not enough money, 0 rows are affected and the app returns an "insufficient balance" error.
- Writing the double-entry ledger lines (debit/credit) in the same transaction keeps the balance consistent with the ledger. You can add {{CHECK (balance >= 0)}} as a final safety layer.
- 200 TPS on a single row is still fine as long as transactions are short (a few ms). Above that threshold, split a hot account into several sub-accounts.

### Why the other options are wrong
- **SELECT then UPDATE in Java under READ COMMITTED**: two transactions both read 100, both see enough funds, and both write their result: a lost update, and the balance can go negative. READ COMMITTED does not prevent this kind of read-modify-write race.
- **Redis lock only**: the lock can expire while the app is paused (see fencing tokens), and a Redis failover can lose the lock; the correctness of money must not depend on a system outside the DB.
- **Deduct asynchronously and claw back**: it violates the "never negative" requirement and creates bad debt and legal risk.

> Senior tip: when asked "why not SELECT FOR UPDATE", answer that it is also correct but holds the lock longer (across a round trip back to the app); a conditional UPDATE folds the check and the write into one statement, so throughput is higher.`
  },
  'qz-design-013': {
    q: `You use Snowflake-style IDs (41 bits of millisecond timestamp, 10 bits of worker id, 12 bits of sequence). What is the maximum number of IDs one worker can generate per millisecond, and what should you do when NTP moves the clock back by 5 ms?`,
    options: [
      `1,024 IDs/ms; when the clock moves back, reset the sequence to 0 and keep generating`,
      `4,096 IDs/ms; when the current time is detected to be smaller than the timestamp of the last generation, wait until the clock passes that point (or fail if the skew is large) so that no duplicate ID is generated`,
      `4,096 IDs/ms; a backward clock causes no problem because the worker id already guarantees uniqueness`,
      `1,024 IDs/ms; switch to UUID v4 for the duration of the backward jump`
    ],
    explain: `**Correct answer: 4,096 IDs/ms per worker; when the clock moves back, wait or refuse to generate.**

### Why this is correct
- 12 sequence bits give 2^12 = 4,096 values within the same millisecond on one worker. 10 worker bits give 1,024 workers, for a theoretical ~4 million IDs/ms across the whole cluster. The 41 millisecond timestamp bits last about 69 years from the chosen epoch.
- Uniqueness relies on the triple (timestamp, worker, sequence). If the clock moves back 5 ms, the worker returns to timestamps it **already used** and can produce the exact same triple again, i.e. a duplicate ID. That is why the standard implementation keeps {{lastTimestamp}}: if {{now < lastTimestamp}} and the skew is small (a few ms), just wait; if the skew is large, throw and alert.

### Why the other options are wrong
- **1,024 IDs/ms**: confuses the worker id bits with the sequence bits.
- **Reset the sequence to 0 on a backward jump**: that is precisely how you generate IDs that duplicate the ones already issued during those 5 ms.
- **Worker id guarantees uniqueness**: the worker id only distinguishes machines; on the same machine a repeated timestamp plus sequence is still a duplicate ID.
- **Temporarily switch to UUID v4**: it breaks the 64-bit format and the time ordering, and BIGINT storage cannot even hold it.

> Senior tip: configure NTP in slew mode (gradual correction) instead of step mode to avoid backward jumps. Allocate worker ids through ZooKeeper/etcd or a DB table with a lease, because two pods sharing a worker id is the hardest duplicate-ID bug to detect.`
  },
  'qz-design-014': {
    q: `A report export API runs synchronously for 2-5 minutes; the load balancer cuts the connection at 60 seconds, so users click repeatedly and create many duplicate jobs that overload the DB. How should you redesign it?`,
    options: [
      `Raise the load balancer idle timeout to 10 minutes for this endpoint`,
      `Run each request in its own thread ({{@Async}}) and return 200 immediately, with nothing else`,
      `POST creates a job and returns {{202 Accepted}} with a job id; a worker processes it from a queue; the client polls {{GET /jobs/:id}} or receives a notification; use an idempotency key (user + parameters) so a repeated click returns the existing job; put the result file on object storage behind a presigned URL`,
      `Cache report results for 24 hours so the next click is fast`
    ],
    explain: `**Correct answer: the async job pattern with 202 Accepted, a queue and an idempotency key.**

### Why this is correct
- It separates "accept the request" from "process it": the HTTP request finishes in a few ms and no longer depends on the timeouts of the LB, proxies or browsers.
- A queue plus a bounded number of workers gives **backpressure**: at most N reports run in parallel, so the DB is not overwhelmed.
- The idempotency key (for example a hash of user id + report type + date range) makes a repeated click return the job that is already running instead of creating a new one.
- Large files live on S3 and the client downloads them through a time-limited presigned URL, so the application server never streams files.

### Why the other options are wrong
- **Raise the LB timeout**: it holds a connection and a thread for minutes per request; the user can still press F5 and create duplicate jobs; and other proxies (CDN, mobile networks) can still cut the connection.
- **@Async returning 200 immediately**: the client has no way to know whether the job finished or where to download the result; the job lives in memory and is lost when the pod restarts; and duplicates are still not prevented.
- **24-hour cache**: it only helps on the second attempt; the first one still times out, and a click while the first job is running still creates a duplicate.

> Senior tip: store job state in the DB (PENDING/RUNNING/DONE/FAILED, progress %, error) so the UI can show progress, and run heavy reports on a read replica so they do not affect the transactional path.`
  },
  'qz-design-015': {
    q: `The system runs in two datacenters and the link between them is down (network partition) for 10 minutes. For "wallet balance" and "shopping cart" data, which CAP choice is appropriate?`,
    options: [
      `Both choose AP: keep accepting writes in both DCs and merge after the network recovers`,
      `Both choose CP: reject all writes in both DCs until the network recovers`,
      `Wallet balance chooses AP so no transaction is lost; cart chooses CP because orders must be exact`,
      `Wallet balance chooses CP (the side without a quorum/primary refuses writes); the cart chooses AP (it still accepts add/remove and merges by item when the network recovers)`
    ],
    explain: `**Correct answer: money chooses CP, the shopping cart chooses AP.**

### Why this is correct
CAP only forces a choice **during a partition**: either reject requests to stay consistent (CP), or keep serving and accept temporary divergence (AP).
- **Wallet balance**: if both DCs accept withdrawals, a customer can withdraw the same money twice (double spend). Lost money cannot be fixed afterwards, so the side that loses quorum must refuse writes; a customer seeing a temporary error is better than losing money.
- **Shopping cart**: items added or removed on either side can be merged (union by item, or CRDTs). The worst failure is a deleted item reappearing, and the customer can delete it again. Refusing to add to the cart loses revenue immediately. This is exactly why Amazon Dynamo was designed as AP for the shopping cart.

### Why the other options are wrong
- **Both AP**: the wallet can be double-spent.
- **Both CP**: the cart stops working for 10 minutes needlessly.
- **Wallet AP, cart CP**: it inverts the correct trade-off, taking the risk of losing money for money data and sacrificing availability for data that tolerates divergence.

> Senior tip: also mention PACELC: even without a partition you still choose between latency and consistency (for example, writing synchronously to the second DC costs an extra 20-40 ms). For wallets, a single-DC primary per account is often chosen instead of active-active.`
  },
  'qz-design-016': {
    q: `Concert ticket sale: 500,000 people arrive at once, 20,000 seats, customers pick a seat and hold it for 10 minutes to pay, and a seat must never be sold twice. Which components should exist? (Choose 3)`,
    options: [
      `A virtual waiting room: queue people and admit only enough of them to the seat-selection page each minute`,
      `Check seat availability with a SELECT and then INSERT the ticket, with no extra constraint because the application layer already checks`,
      `Hold the seat with a time-limited atomic operation (for example {{SET seat:eventId:seatId userId NX EX 600}} in Redis, or an UPDATE with a state condition AVAILABLE)`,
      `Pessimistically lock the entire seat table of the event in every booking transaction`,
      `A unique constraint on (event_id, seat_id) in the sold-tickets table as the final safety layer`
    ],
    explain: `**Correct answer: waiting room, atomic hold with a TTL, and a unique constraint in the DB.**

### Why this is correct
- **Waiting room**: 500,000 people are competing for 20,000 seats. Letting them all in at once is a self-inflicted DDoS. Queueing means the backend only serves a few thousand people concurrently, and the experience is fairer (earlier arrivals choose first).
- **Atomic hold with a TTL**: {{SET ... NX EX 600}} succeeds only for the first person; after 10 minutes without payment the key expires by itself and the seat is released, with no cleanup job needed. The DB equivalent: {{UPDATE seat SET status='HELD', held_until=... WHERE id=? AND status='AVAILABLE'}}.
- **Unique constraint**: if a Redis failover loses the hold keys, two people can reach checkout together; the DB constraint guarantees only one ticket is written, and the other customer is refunded automatically.

### Why the other options are wrong
- **SELECT then INSERT**: the classic check-then-act race - two requests both see the seat as free and both write.
- **Lock the whole seat table**: it serialises every booking for the event, and throughput collapses exactly when load is highest.

> Senior tip: rendering the seat map from a cache with 1-2 seconds of lag is acceptable; only the hold operation itself needs strong consistency. Cleanly separating the read path (cheap, cached) from the write path (atomic) is the key to every ticket-sales problem.`
  },
  'qz-design-017': {
    q: `An e-commerce site needs search-box autocomplete: about 10 million products, 20,000 keystrokes/second at peak, p99 under 50 ms, suggestions ordered by popularity. Which approach fits best?`,
    options: [
      `Pre-compute the top-K suggestions for every prefix (a trie or a prefix -> top-K table) from the search logs in a batch job and serve them from memory/Redis; debounce on the client for about 150 ms and cache results per prefix`,
      `Run {{SELECT name FROM product WHERE name LIKE :q || \'%\' ORDER BY sold DESC LIMIT 10}} on PostgreSQL for every keystroke`,
      `Run {{LIKE \'%\' || :q || \'%\'}} for every keystroke to also catch words in the middle of a product name`,
      `Use an ML model to generate suggestions in real time for every typed character`
    ],
    explain: `**Correct answer: pre-compute the top-K for every prefix and serve it from memory.**

### Why this is correct
- Autocomplete is a **read-heavy, slowly changing data** problem: keyword popularity does not need to update every second. A batch job (hourly or daily) reads the search logs, counts frequencies, and stores the top 10 results for every prefix.
- Serving is then just an O(prefix length) lookup in a trie or a single GET in Redis, which easily reaches a few ms.
- Client-side debounce and per-prefix caching (CDN/browser) cut the number of real requests several-fold.

### Why the other options are wrong
- **Prefix LIKE on PostgreSQL**: you can use a B-tree with {{text_pattern_ops}}, but ORDER BY popularity over a large matching set (the prefix "a" matches millions of rows) requires heavy sorting; 20,000 QPS hitting the primary DB is overload.
- **LIKE '%q%'**: it cannot use a B-tree index, so it scans the whole 10-million-row table on every keystroke.
- **Real-time ML per character**: the latency and cost do not fit a 50 ms p99; ML (if used at all) belongs in ranking inside the batch job or in personalisation over a small candidate set.

> Senior tip: combine two sources: a pre-computed global top-K plus a small layer for hot trends (trending within the last 15 minutes) updated via a stream. And filter sensitive keywords before they enter the suggestion list.`
  },
  'qz-design-018': {
    q: `After moving read APIs to a PostgreSQL read replica (replication lag usually 100-500 ms), a user changes their shipping address, but reloading the page still shows the old address. What is the most appropriate fix?`,
    options: [
      `Switch to synchronous replication for all replicas so lag is zero`,
      `Read-your-writes: after the user writes, reads of that same user's data for a short window (for example a few seconds, or until the replica has replayed up to the LSN of the write) are routed to the primary`,
      `Add {{Thread.sleep(1000)}} after the write so the replica can catch up`,
      `Drop the read replica and send all read traffic to the primary`
    ],
    explain: `**Correct answer: guarantee read-your-writes for the person who just wrote.**

### Why this is correct
- Users only get upset when they **do not see their own change**. Nobody notices if other people see it a few hundred ms late. So you only need consistency for the session of the user who just wrote.
- Implementation: after a write, store a marker (a timestamp, or the LSN returned by {{pg_current_wal_lsn()}}) in the session/cookie; the read router checks it and reads from the primary while still inside the window or while the replica has not yet replayed up to that LSN ({{pg_last_wal_replay_lsn()}}).
- The bulk of read traffic still goes to replicas; the primary only takes a tiny extra slice.

### Why the other options are wrong
- **Synchronous replication for all replicas**: every commit must wait for replica acknowledgement, so write latency grows, and a slow or dead replica can stall writes. Even with {{synchronous_commit = remote_apply}}, that cost applies to every transaction just to fix the problem of one session.
- **Sleep 1 second**: lag has no fixed ceiling (during vacuum or heavy writes it can be several seconds), and the thread is held for nothing.
- **Drop the replica**: it fixes the symptom by throwing away your read-scaling capability.

> Senior tip: with Spring you can use {{AbstractRoutingDataSource}} to pick primary/replica based on {{@Transactional(readOnly = true)}} plus a "just wrote" flag in the request context. Always monitor a replication lag metric and alert when it exceeds 1-2 seconds.`
  },
  'qz-design-019': {
    q: `A 2-billion-row orders table needs sharding. 80% of queries are "my orders" by user_id, and 20% are lookups by order_id. How should you choose the shard key?`,
    options: [
      `Shard by created_at (one shard per month) to make archiving old data easy`,
      `Shard by order status (NEW, PAID, SHIPPED...) to separate the load`,
      `Shard by hash(user_id), and embed the shard id (or a few bits of user_id) in order_id so lookups by order_id also go straight to the right shard`,
      `Shard by hash(order_id) for the most even distribution, and scatter-gather to every shard for queries by user_id`
    ],
    explain: `**Correct answer: shard by user_id and encode the shard into order_id.**

### Why this is correct
- The shard key should match the **dominant access pattern**: "my orders" touches only one shard, so it can paginate and sort within a single DB.
- Lookups by order_id (from support, payment webhooks) still route if order_id carries the shard id, for example a Snowflake-style ID that reserves 10 bits for the logical shard. No global lookup table is needed.
- Hash(user_id) distributes evenly; use logical shards (for example 1,024 logical shards mapped onto 16 physical DBs) so you can split databases later without rehashing.

### Why the other options are wrong
- **By created_at**: every new write lands in the current month's shard (a hot shard), and "my orders" must touch many shards.
- **By status**: only a few values, unevenly distributed, and every status change has to move the row to another shard.
- **Hash(order_id)**: writes distribute evenly, but 80% of queries (by user_id) must scatter-gather to every shard; latency equals the slowest shard and load multiplies by the number of shards.

> Senior tip: watch out for extremely large users (merchants with millions of orders) that can make one shard hot. Before sharding, consider time-based partitioning in PostgreSQL plus archiving; many 2-billion-row systems still run well on a single cluster with good indexes and archiving.`
  },
  'qz-design-020': {
    q: `Job scheduler: 5 Spring Boot pods read the same jobs table (about 50,000 jobs/day). Some jobs run 2-3 times. Which approaches correctly prevent duplicate execution? (Choose 2)`,
    options: [
      `Each worker claims jobs with {{SELECT ... FROM jobs WHERE status = \'PENDING\' ORDER BY run_at LIMIT 10 FOR UPDATE SKIP LOCKED}} and marks them RUNNING in the same transaction`,
      `Let {{@Scheduled}} run on every pod but add a random sleep of 0-5 seconds to reduce the chance of overlap`,
      `Give each pod its own Kafka consumer group so that every pod receives enough jobs`,
      `For periodic cron jobs, use ShedLock (a lock table with lockAtMostFor) so only one pod runs each trigger, combined with idempotent jobs`,
      `Only run the scheduler on the pod whose hostname ends with -0`
    ],
    explain: `**Correct answer: claim with FOR UPDATE SKIP LOCKED; and ShedLock for cron jobs, combined with idempotency.**

### Why this is correct
- **SKIP LOCKED** (PostgreSQL 9.5+, MySQL 8.0+): each worker locks the rows it takes, and other workers skip locked rows instead of waiting, so 5 pods take 5 different groups of jobs without blocking each other. Flipping the status to RUNNING in the same transaction ensures nobody claims them again.
- **ShedLock**: before running, it writes a lock row per job name with {{lock_until}}; another pod sees the unexpired lock and skips. {{lockAtMostFor}} makes the lock auto-release if the pod dies. Since the lock can expire while a job runs too long, jobs should still be idempotent.

### Why the other options are wrong
- **Random sleep**: it only lowers the probability, it does not remove the race; duplicates still happen under load or with long-running jobs.
- **One consumer group per pod**: Kafka delivers every message to **every** consumer group, so each job runs 5 times - the exact opposite of the goal. To split work you must share one group.
- **Only pod -0 runs**: a {{-0}} style name only exists with StatefulSet; a Deployment gets random names. And if that pod dies, no job runs (single point of failure).

> Senior tip: add a "reaper" that returns jobs stuck in RUNNING (heartbeat older than N minutes) to PENDING, and store an attempt count so jobs that fail repeatedly move to a DEAD state for someone to handle.`
  },
  'qz-architecture-007': {
    q: `In a Spring bean, the method {{importAll()}} (no annotation) calls {{this.saveBatch(batch)}}, while {{saveBatch}} is annotated {{@Transactional(propagation = REQUIRES_NEW)}}. When an error occurs, the data from earlier batches is not rolled back or committed separately as expected. Why?`,
    options: [
      `REQUIRES_NEW only works when the method is private`,
      `Spring only supports REQUIRES_NEW with JTA, not with DataSourceTransactionManager`,
      `A transaction is only created when the method is called from a controller`,
      `Calling through {{this}} is self-invocation: the call does not go through the AOP proxy, so the annotation on {{saveBatch}} is ignored; move it to another bean or use {{TransactionTemplate}}`
    ],
    explain: `**Correct answer: self-invocation bypasses the proxy.**

### Why this is correct
Spring implements {{@Transactional}} with the **Proxy pattern**: the bean injected elsewhere is actually a proxy (a CGLIB subclass or a JDK dynamic proxy). The proxy starts the transaction and then calls the method on the real object. Once you are inside the real object, {{this.saveBatch()}} is a plain Java call to that same object, not through the proxy, so no interceptor ever reads the annotation.
~~~java
@Service
class ImportService {
  private final BatchWriter writer;          // separate bean -> goes through the proxy
  void importAll(List<List<Row>> batches) {
    for (var b : batches) writer.saveBatch(b); // one new transaction per batch
  }
}
~~~
Another option: use {{TransactionTemplate.execute(...)}} to manage the transaction in code, which is explicit and does not depend on the proxy.

### Why the other options are wrong
- **Only works with private**: the opposite is true - a private method cannot be overridden by the proxy, so the annotation on a private method has no effect (with the default proxy mode).
- **Only supported with JTA**: {{DataSourceTransactionManager}} and {{JpaTransactionManager}} both support REQUIRES_NEW by suspending the current transaction and taking a new connection.
- **Only from a controller**: a transaction is created on any call that goes through the proxy, regardless of which layer makes the call.

> Senior tip: REQUIRES_NEW takes an extra connection while the old one is still held; with a pool of 10 connections and 10 concurrent requests, that can deadlock the pool. Think carefully before using it inside a loop.`
  },
  'qz-architecture-008': {
    q: `The {{Customer}} aggregate currently contains {{List<Order>}} (a VIP customer has 30,000 orders). Every new order requires loading the whole customer, and optimistic-lock failures keep occurring when the customer orders from multiple devices. How would you redesign it with DDD?`,
    options: [
      `Split Order into its own aggregate, referencing Customer by {{customerId}}; each transaction modifies only one aggregate; cross-aggregate rules (such as updating the membership tier) are handled by domain events, with eventual consistency`,
      `Keep it as is but switch {{List<Order>}} to {{FetchType.LAZY}}, which is enough`,
      `Remove the version column so optimistic-lock errors stop`,
      `Merge Customer, Order and Payment into one large aggregate so every invariant is enforced within a single transaction`
    ],
    explain: `**Correct answer: small aggregates, referenced by id, linked through domain events.**

### Why this is correct
- An aggregate is a **consistency boundary**: every invariant inside it is maintained within one transaction, so the bigger the aggregate, the more contention. Adding an order does not require locking the whole customer.
- Vaughn Vernon's rule: design small aggregates, reference other aggregates by id, modify one aggregate per transaction, and use eventual consistency between aggregates.
- Example: an {{OrderPlaced}} event is published; a handler adds points and upgrades the Customer in its own transaction. A few seconds of delay is acceptable for the business.

### Why the other options are wrong
- **Just switch to LAZY**: it reduces load cost but does not fix the boundary: Customer is still the aggregate root that every new order must go through and contend on for the version; touching the collection to add an element can still initialise all 30,000 orders.
- **Remove the version**: the error disappears because the changes now silently overwrite each other (lost update), which is worse.
- **Merge into a large aggregate**: it multiplies the very problem you have.

> Senior tip: in an interview, ask back "which invariants really must be correct immediately?". The answer is usually very few; the rest can accept eventual consistency.`
  },
  'qz-architecture-009': {
    q: `The {{PaymentGateway}} interface has 3 implementations (VNPay, MoMo, ZaloPay). You need to add latency measurement and retries for all three without touching the individual implementations, while clients keep using the same {{PaymentGateway}} interface. Which pattern fits best?`,
    options: [
      `Adapter`,
      `Decorator: a class that also implements {{PaymentGateway}}, wraps another {{PaymentGateway}} and adds behaviour before/after delegating`,
      `Facade`,
      `Abstract Factory`
    ],
    explain: `**Correct answer: Decorator.**

### Why this is correct
Decorator keeps the **same interface** and adds behaviour by wrapping:
~~~java
class MeteredGateway implements PaymentGateway {
  private final PaymentGateway inner;  // VNPay, MoMo... or another decorator
  private final Timer timer;
  public PayResult pay(PayRequest r) {
    return timer.record(() -> inner.pay(r)); // add latency measurement, keep the original logic
  }
}
// stack the layers: new RetryingGateway(new MeteredGateway(new VnPayGateway(...)))
~~~
Decorators can be stacked in any order, in line with the Open/Closed Principle.

### Why the other options are wrong
- **Adapter**: used to **change the interface**, for example turning the MoMo SDK (its own API) into your {{PaymentGateway}}. Here the interface does not change.
- **Facade**: provides a **simpler** interface over a complex subsystem (bundling several steps); it is not for adding behaviour across the same interface.
- **Abstract Factory**: creates families of related objects; it does not add behaviour at runtime.

> Senior tip: in Spring, latency measurement and retries are usually done with AOP or Resilience4j annotations, whose essence is exactly a decorator created by a proxy. Writing decorators by hand is still useful when you need explicit control over ordering (for example, metrics wrapping outside retry to measure total time, or inside to measure each attempt).`
  },
  'qz-architecture-010': {
    q: `You use {{ApplicationEventPublisher}} to publish {{OrderPlacedEvent}} and handle it with {{@TransactionalEventListener}} (sending a confirmation email). Which statements are correct? (Choose 2)`,
    options: [
      `The listener runs inside the same transaction as the order, so if sending the email fails the order is rolled back too`,
      `The default phase is {{AFTER_COMMIT}}: the listener only runs when the transaction that published the event has committed successfully`,
      `The event is guaranteed to be processed even if the JVM crashes right after the commit`,
      `If the event is published when no transaction is running, the listener is not called by default (unless {{fallbackExecution = true}} is set)`,
      `The listener always runs on a separate thread`
    ],
    explain: `**Correct answer: the default phase is AFTER_COMMIT; and without a transaction the listener is skipped unless fallbackExecution is enabled.**

### Why this is correct
- {{@TransactionalEventListener}} registers the event with the transaction synchronization and only calls the listener at the right phase ({{AFTER_COMMIT}} by default). If the transaction rolls back, the email is not sent, which matches the intent of "do not send a confirmation for an order that does not exist".
- When publishing outside a transaction there is nothing to synchronize with, so Spring skips the listener; {{fallbackExecution = true}} lets it run immediately.

### Why the other options are wrong
- **Runs in the same transaction and can roll back the order**: in the AFTER_COMMIT phase the transaction has already committed, so a listener exception can no longer roll the order back.
- **Guaranteed even if the JVM crashes**: the event only lives in memory. A crash between the commit and the moment the listener runs loses the event. If you need reliability, use the outbox pattern (write the event into a table in the same transaction) or the Spring Modulith Event Publication Registry.
- **Always on a separate thread**: by default it runs synchronously on the thread that just committed; for async you must add {{@Async}}.

> Senior tip: inside an AFTER_COMMIT listener, if you need to write to the DB use {{REQUIRES_NEW}}, because the old transaction has committed but its resources are still bound to the thread; writing with REQUIRED may not commit the way you think.`
  },
  'qz-architecture-011': {
    q: `Six months after choosing Kafka over RabbitMQ, the new team members ask why and want to switch back. Nobody remembers what was considered. Which practice prevents this for future decisions?`,
    options: [
      `Write the decision on a shared wiki page that anyone can edit when the context changes`,
      `Let one person (the architect) own architecture decisions and have everyone ask them directly when needed`,
      `Write a short ADR stored in the repo: context, options considered, decision, consequences (including the downsides); ADRs are not edited but replaced by a new ADR marked "superseded"`,
      `Write the rationale as a comment in the code of the Kafka producer class`
    ],
    explain: `**Correct answer: Architecture Decision Records in the repo, immutable, superseded by a new ADR.**

### Why this is correct
- An ADR (after Michael Nygard) contains: **Title, Status, Context, Decision, Consequences**. Many teams add an "Options considered" section to record the rejected alternatives and the reasons.
- Stored in the repo (for example {{docs/adr/0007-use-kafka.md}}), it is reviewed through PRs like code and has git history.
- Old ADRs are not edited: when the context changes, you write a new ADR and mark the old one as superseded. That way you can still tell **why the decision was reasonable at the time**.
- The "Consequences" section records the downsides too (for example "Kafka has no built-in delay queue, so retries must be built"), which helps newcomers understand the trade-off instead of assuming the old decision was a mistake.

### Why the other options are wrong
- **A wiki anyone can edit**: the content gets overwritten, historical context is lost, and it usually drifts away from the code.
- **One architect keeps it in their head**: bus factor of 1 - when that person leaves, the knowledge is gone.
- **A comment in the class**: an architecture decision affects many services; it does not belong to one class, and a comment has no place to record the rejected options.

> Senior tip: ADRs should be short - readable in 5 minutes. Only write them for decisions that are hard to reverse (choosing a broker, a database, how to split services), not for which logging library to pick.`
  }
});
