/*
 * English translation of js/data/lessons-design.js — task T804. Format: js/core/i18n.js (content overlay).
 * ids: lesson-design-007
 */
App.i18n.content({
  'lesson-design-007': {
    title: 'Sharding: choosing a shard key, hot partitions and resharding',
    goals: [
      'Choose a shard key against four criteria and state the consequence of each choice',
      'Distinguish hash-based from range-based sharding and know when scatter-gather shows up',
      'Measure and explain a hot partition with numbers, not with gut feeling',
      'Describe a safe resharding procedure and why hash modulo must move most keys',
    ],
    body: `### What a shard is, and when you actually need one
**Sharding** (horizontal partitioning) means splitting one huge table into several **shards**, where each shard is an independent database running on a different machine, plus a **shard key** rule that tells you which record lives on which shard. Do not confuse it with a **read replica**: a replica is only a copy that absorbs read traffic, every write still lands on one node and total capacity is still one node. Sharding relieves three limits at once: the writes-per-second and connection count of a single node, disk capacity, and index size (the B+Tree grows deeper as the table balloons, and maintenance such as an index rebuild or an ALTER takes hours).

Numbers for scale: an orders table with 900 million rows, 2 KB per row before indexes. One node holding roughly 2 TB of hot data is already very hard to operate; splitting into 16 shards brings it down to about 56 million rows and 125 GB per shard, and each shard can be backed up and migrated independently.

Because the data now sits in many places, **every query must know where to go**. That is why the shard key decision is almost impossible to undo later.

### Four criteria for choosing a shard key
1. **It appears in almost every query.** Without it in the WHERE clause the app has to fire the query at every shard (see scatter-gather).
2. **It distributes both stored volume and traffic evenly.** Many rows does not mean many requests: a tenant with 10 million orders that nobody looks at any more is lighter than a tenant with 100 thousand orders scanned every second.
3. **It never changes after the row is written.** Changing a shard key value means deleting on one shard and inserting on another; it is no longer one UPDATE inside one transaction.
4. **It creates no time-based hotspot.** Sharding by day means the "today" shard absorbs 100% of all writes.

In practice people pick the id of the **aggregate** (orderId, userId) because it satisfies criteria 1 and 3; avoid created_at because it breaks 2 and 4.

### Hash-based
~~~java
int shard = Math.floorMod(orderId.hashCode(), SHARDS);   // 0..SHARDS-1
~~~
Pros: no mapping table needed, even distribution when the keys are diverse, routing is O(1). Cons: it destroys **locality** completely, so every range query (by time, by prefix, BETWEEN, a large LIMIT/OFFSET) turns into scatter-gather; and when SHARDS changes, almost every key moves. A measured figure: for 1200 keys "user-0" through "user-1199", going from 4 to 6 shards makes **802 keys (66.8%)** change shard, because {{h % 4}} and {{h % 6}} agree on only a fraction of the congruence classes.

The classic trap: {{Math.abs(hash) % n}}. When {{hash == Integer.MIN_VALUE}}, {{Math.abs}} still returns a negative number (two's-complement overflow) → IndexOutOfBounds. Always use {{Math.floorMod}}.

### Range-based
Each shard owns one value range: shard 0 takes ids 0 through 99,999,999, shard 1 takes the next range, and so on, recorded in a **mapping table** (shard directory). Pros: locality is preserved, a "this month's orders" query touches a single shard, and adding a new shard is usually just cutting one more range at the top end of the scale, with no old data moved. Cons: skew — if the data grows with time, the last shard is always hot; and the mapping table has to be versioned, otherwise two instances will disagree about the same range.

| Criterion | Hash | Range |
|---|---|---|
| Capacity balance | good | depends on how the ranges are cut |
| Query with the shard key | 1 shard | 1 shard |
| Range and sorted queries | scatter-gather to every shard | good, in place |
| Increasing the shard count | many keys must move | usually just add a new shard |
| Hot tenant | spread out if the key is the order id | ranges go hot easily |
| Extra infrastructure | none | yes: a mapping table plus someone to run it |

### Hot partitions and how to measure them
A real situation: 900 of the last 1000 requests belong to one big tenant. If the shard key is tenantId, that entire write load lands on ONE shard, the p99 of that shard drags the whole system down, while the other 7 shards sit idle. If the shard key is the order id (a different id per order), the very same 1000 keys distribute over 8 shards as 124 to 126 keys per shard, an imbalance of just 0.016.

To keep the discussion out of the realm of feelings, use two figures: {{counts}} (keys/requests per shard) and {{imbalance = (max - min) / average}} — exactly 0 when the split is perfectly even, approximately the shard count minus 1 when one shard takes nearly everything. The exercise measures precisely these two quantities.

Deal with a hot partition in order of increasing cost: move the big tenant to a shard of its own (the "dedicated shard" strategy, common for enterprise customers); salt the key into tenantId + '#' + (n % 16) to split it up, at the price of every tenant query having to gather from 16 sub-shards; add read replicas for the read side; or change the shard key to entity level and keep a lookup table from tenantId to the list of shards.

### Scatter-gather
The query {{WHERE status = 'PAID' ORDER BY created_at LIMIT 20 OFFSET 1000}} on 32 shards: no shard knows who the first 1000 rows are globally, so each shard must return 1020 locally sorted rows and the app merges and re-sorts them. That means 32,640 rows travel over the network for one 20-row page, and the cost grows with OFFSET. Ways to reduce it:
- Always include the shard key in the WHERE clause when the use case allows it (a per-order query carries the orderId).
- Move the "browsing without a key" kind of query into a dedicated **view**: Kafka events (see the outbox lesson) fed into Elasticsearch/OpenSearch or an aggregation service, treated as a search tool rather than the source of truth.
- Paginate with a cursor (seek on the pair (created_at, id)) instead of OFFSET.
- Set a timeout and a fan-out limit, because one slow query occupies a connection on every shard at the same time. Note that connection pools multiply by the number of shards: 32 shards with a pool of 10 means one app instance already opens up to 320 connections.

### Resharding from 4 to 6 without stopping the service
You cannot run UPDATE over hundreds of millions of rows in the middle of peak hours, and if the app hard-codes {{hash % N}} then the new and the old version would write to two different shards. The standard procedure uses a versioned mapping table (directory) and migrates in steps:

~~~seq
title: Resharding 4 to 6, zero downtime
actors: App | Router | Old shard | New shard | Migration job
App -> Router: route(order-42) using directory version 3
Router -> Old shard: read and write as usual
Migration job -> Old shard: scan every key, compute its new shard
Migration job -> New shard: copy the keys that are changing owner
note Old shard..New shard: while copying, new writes must be caught up
App -> Router: new writes go to both the old and the new shard
Migration job -> Router: compare to confirm both sides match
Router -> New shard: stop dual-write, switch reads to version 4
Router --> App: API unchanged, the router decides
~~~

The safe order: (1) turn on **dual-write** so every new write appears on both sides; (2) **backfill** the old data; (3) **catch-up** and **reconciliation** (row counts, checksum comparison per range); (4) shift reads over small percentages (5%, 25%, 100%) so you can still roll back; (5) drop the old shard after a safety window. If you use consistent hashing with virtual nodes (lesson lesson-design-003), the number of keys that must move when adding one shard drops to roughly 1/(N+1), about 17% in the 4-to-5 case, instead of 66.8%.

### Cross-shard constraints
- A **table-wide UNIQUE** constraint (email, phone number) is no longer guaranteed by one database. Ways out: a lookup table mapping email_hash to userId on a fixed shard, with ids allocated by a single service; or accept an "eventually checked" constraint and repair violations with a compensating event.
- **JOINs and foreign keys** between two tables sharded by different keys cannot be executed at the DB layer. Design for **co-location**: the tables of one aggregate share the same shard key (orders and order_items both by orderId).
- **Multi-shard transactions**: turn them into a saga with idempotent events, or shrink the transaction unit so it fits in one shard.
- **Distributed locks and deadlock** when one business operation touches two shards in different orders: always acquire locks in the same order (sort by shard id).

### Pitfalls
- Sharding time-series data by {{created_at}}: the current shard is always hot and always the write bottleneck; if you still want locality by time, combine the two schemes (group by month, hash by id inside the group).
- Running a migration with no way back: you must keep the ability to read from the old shard until the new data proves stable.
- Forgetting that operational tooling has to shard too: full-table scan jobs, statistics reports, and backups all become fan-outs.
- Letting the routing logic scatter through the app: changing the routing policy then becomes a major overhaul. Push it into one Router layer / shared library, versioned through configuration.

### Interview notes
Answer frame: (1) state the pressure that forces sharding (writes, capacity, connections, index) and rule out using replicas alone; (2) ask about the access pattern before choosing the shard key, because that is the hardest decision to reverse; (3) hash or range, with the reason and the locality consequence; (4) how the hot tenant is handled (dedicated shard, salt, replica) and how it is measured with imbalance; (5) scatter-gather for queries without the key, with the view/index solution; (6) the resharding procedure and how to shrink the number of keys moved. The usual follow-ups are "what about a unique email", "how do you know which shard is hot", and "have you ever merged two shards, and where is merging harder than splitting?".`,
    exercises: [{
      title: 'Measure load skew and count the keys that move when you add shards',
      prompt: `Implement class {{Router}} with five static methods, JDK only.

- {{hashShard(key, shards)}}: returns the shard index in {{0..shards-1}} computed as {{Math.floorMod(key.hashCode(), shards)}}. If {{shards < 1}}, throw {{IllegalArgumentException}}.
- {{rangeShard(value, upperBounds)}}: {{upperBounds}} are the upper bounds **sorted ascending**; for example two bounds, 100 and 200, create three regions. Return the index of the region containing {{value}}: region 0 holds the values below the first bound, the last region holds the values greater than or equal to the last bound.
- {{counts(keys, shards)}}: an array counting the keys on each shard according to {{hashShard}}.
- {{movedKeys(keys, from, to)}}: count the keys that change shard when growing from {{from}} to {{to}} shards (use {{hashShard}} for both).
- {{imbalance(counts)}}: returns {{(max - min) / average}}, which is 0 when the split is perfectly even; on an empty array throw {{IllegalArgumentException}}.

Reference values to check against: {{hashShard("user-0", 4)}} equals 2, and {{movedKeys}} for 1200 keys "user-0" through "user-1199" when going from 4 to 6 shards equals 802.
`,
      hints: [
        'hashShard must use Math.floorMod, not the % operator or Math.abs, because hashCode can be negative and Math.abs(Integer.MIN_VALUE) is still negative.',
        'rangeShard: walk the bounds in order; the value belongs to the region of the first bound greater than it; if no bound is greater than the value, return the last region index.',
        'imbalance: compute max, min and the sum in ONE loop, then divide (max - min) by the average; remember the cast to double so you do not end up doing integer division.',
        'movedKeys only needs to compare hashShard(k, from) with hashShard(k, to) for each key; there is no need to generate any new shard list.',
      ],
      explain: `The 1200 keys "user-i" distribute over 4 shards as 298, 300, 302, 300 keys, so {{imbalance}} is only 0.013, yet {{movedKeys}} from 4 to 6 shards returns 802, i.e. 66.8% of the keys must change place: {{h % 4}} and {{h % 6}} give the same result only on a fraction of the congruence classes modulo 12. That is why growing the shard count with a hard-coded modulo formula costs a whole data-migration campaign, while consistent hashing (lesson lesson-design-003) moves only about 1/(N+1). With skewed data (900 keys from one big tenant), hashing by order id still keeps each of the 8 shards between 124 and 126 keys; feed that same data in with tenantId as the shard key and one shard holds 900 requests, another 100, the remaining six are empty, and imbalance equals 7.2. That is how you demonstrate a hot partition with numbers instead of arguing by feeling. {{rangeShard}} shows the other side of the trade-off: it keeps locality for range queries but forces you to manage a versioned mapping table, and the last region always receives every newly written record.`,
    }],
    check: [
      { q: 'Which requirement below makes a shard key a BAD choice?', options: ['It appears in the WHERE clause of almost every query', 'One of its values accounts for about 40% of all write traffic', 'It does not change after the record is created', 'It is the id of the aggregate, for example orderId'], explain: `One value taking almost half of the traffic means one shard receives close to half of all writes, i.e. a hot partition, and sharding loses its whole point of balancing the load. The other three requirements are exactly the criteria of a good shard key: present in the queries so you can route, immutable so a record never moves between two databases, and an aggregate id so related tables land on the same shard.` },
      { q: 'Why does {{Math.floorMod(hash, N)}} cause a problem when N grows from 4 to 6?', options: ['Because the hash function is not deterministic between runs', 'Because changing N remaps most keys to different shards, triggering an enormous data-migration campaign', 'Because it cannot be applied to UUID-shaped keys', 'Because it always leaves one shard empty'], explain: `The results of {{h % 4}} and {{h % 6}} coincide on only a fraction of the congruence classes; the measurement in this lesson was 66.8% of keys moving. String hashing is deterministic per the {{hashCode}} specification, so the first option is wrong; modulo still works fine for UUIDs (they are just strings), it simply keeps no locality; and the distribution is usually quite even, shards do not end up empty on their own.` },
      { q: 'The query {{WHERE status = ? ORDER BY created_at LIMIT 20 OFFSET 1000}} contains no shard key and runs across 32 shards. How do you handle it?', options: ['The database automatically forwards the query to the right shard', 'Send the query to the shard whose number equals status, then take the result', 'You must scatter-gather all 32 shards, each returning 1020 rows, then merge and re-sort; in the long run move this kind of query into a separate view (Elasticsearch or an aggregation service) and paginate with a cursor instead of OFFSET', 'Just add an index on status and the fan-out is gone'], explain: `A shard does not know the global order, so each shard has to return at least LIMIT plus OFFSET rows and the cost grows with OFFSET. The database cannot route on its own without the shard key, and an index only speeds things up inside one shard, it does not reduce the number of shards that must be asked. Routing by the status value has no basis either: status does not determine which shard holds the data.` },
      { q: 'In the resharding procedure, why must dual-write and backfill be turned on BEFORE reads switch to the new shard?', options: ['To reduce the disk usage of the old shard', 'So the new shard catches up with both the old data and the writes that happen during the move, and reads only switch once reconciliation shows the two sides match, leaving a way to roll back', 'Because the old shard runs out of room for new data', 'Because dual-write turns a two-shard transaction into a one-phase commit'], explain: `If reads switched over right away, every write that happened during the backfill would not yet be copied to the new shard and would vanish from the user's view; dual-write plus backfill plus reconciliation is how that window gets closed while rollback stays possible. Dual-write increases rather than decreases disk usage, and it does not merge two transactions into one: consistency still has to be proven by reconciliation.` },
    ],
  },
});
