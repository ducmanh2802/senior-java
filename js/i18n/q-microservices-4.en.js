/*
 * English translation of js/data/q-microservices.js — task T193, retranslated in T537. Format: js/core/i18n.js (content overlay).
 * ids: microservices-030 microservices-031 microservices-032 microservices-033 microservices-034 microservices-035 microservices-036 microservices-037 microservices-038
 */
App.i18n.content({
  'microservices-030': {
    q: 'Consumer groups keep rebalancing during deploys and autoscaling. How do you distinguish cooperative sticky assignment from static membership, and which configuration do you choose to reduce processing downtime?',
    a: `**Summary:** **cooperative sticky** rebalances **in stages**: it only revokes the partitions that genuinely have to move while the others keep processing; **static membership** ({{group.instance.id}}) keeps a consumer's "identity" across a short restart, so a restart within {{session.timeout.ms}} **does not cause a rebalance**. The two mechanisms solve two different problems (a rebalance that hurts less / removing unnecessary rebalances) and should be combined. Kafka 4.x also ships a new group protocol (KIP-848) where the broker computes the assignment, which makes rebalances even lighter.

### Quick intuition
Six waiters share 12 tables in a restaurant. With the old **eager** style, every time someone clocks in or goes home, **everyone** drops the tables they are serving, huddles up and splits the tables again from scratch while customers wait. **Cooperative sticky**: whoever serves a table keeps it, only a few tables move to the newcomer. **Static membership**: if a waiter steps out to answer a call for 30 seconds, the manager **keeps those tables reserved** instead of re-splitting; only a long absence counts as leaving.

### Glossary
- **Rebalance**: the process of redistributing partitions among the consumers of a group.
- **Eager rebalance**: every consumer gives up all partitions before receiving the new assignment (stop-the-world).
- **Cooperative rebalance**: only the partitions that must move are revoked; it may take two rounds.
- **Sticky assignment**: an algorithm that tries to keep the old assignment so fewer partitions move.
- **Static membership**: the consumer declares a fixed {{group.instance.id}} so it is recognized again after a quick restart.
- **session.timeout.ms / heartbeat.interval.ms**: how long heartbeats may be missing before the member is removed / how often heartbeats are sent.
- **max.poll.interval.ms**: the maximum time between two polls; exceeding it makes the consumer leave the group by itself.
- **Fencing**: the broker blocks an old member when another member uses the same instance id.

### Where a rebalance stops processing (step by step)
1. Each partition is assigned to exactly one member at any moment.
2. When a member joins/leaves or the subscription changes, the coordinator computes a new assignment.
3. **Eager**: every consumer revokes **all** partitions (commits offsets, stops processing), then waits for the new assignment. Why it hurts: during that window the whole group processes nothing.
4. A rolling deploy of 6 pods means roughly 12 rebalances (one when each pod leaves, one when it comes back), a few seconds of pause each time, so lag spikes.

~~~text
Eager, adding consumer C:  A:[0,1,2] B:[3,4,5] → ALL revoke → A:[0,1] B:[2,3] C:[4,5]
Cooperative sticky:        A keeps [0,1], B keeps [3,4] → release only 2 and 5 → C:[2,5]
Static membership, A restarts for 20s (< session timeout 45s): no rebalance, A gets [0,1] back
~~~

### Cooperative sticky
1. Sticky tries to keep the old assignment; cooperative only revokes the part that must move.
2. It usually needs **two rounds**: round 1 announces which partitions will be released and the consumer stops processing them; round 2 hands them to the new member. Why it is safe: at no moment do two consumers hold the same partition.
3. This **narrows the interruption**, it does not eliminate rebalances.
4. Configuration: {{partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor}}. Moving away from Range/RoundRobin needs **two rolling passes**: pass 1 declares both {{CooperativeStickyAssignor, RangeAssignor}}, pass 2 removes Range; switching in one shot hits an incompatible-protocol error during the transition.

### Static membership
1. Assign a stable, unique {{group.instance.id}} per instance (for example the StatefulSet pod name: order-0, order-1).
2. If the instance restarts and comes back within {{session.timeout.ms}} (default 45s), the coordinator **keeps the old assignment** and does not rebalance.
3. **Limits**: with a Deployment the new pod has a random name, hence a new id, so a rebalance still happens; if two processes use the same id, the later member **fences** the earlier one. If a pod really died, its partitions sit idle until the session timeout expires, so do not set the timeout too long.

### How to operate it
- Use cooperative sticky consistently across the whole group; when upgrading the client, avoid a protocol mismatch.
- Enable static membership only when the platform guarantees a unique and stable id (StatefulSet); with ephemeral pods, cooperative is usually safer.
- Tune {{session.timeout.ms}}, {{heartbeat.interval.ms}} (about one third of the session timeout) and {{max.poll.interval.ms}} to the real processing time; if a batch runs too long without polling, the member is removed even though the broker is healthy. Lower {{max.poll.records}} when each record is slow.
- When partitions are revoked (listener {{onPartitionsRevoked}}), commit the part already processed; do **not** commit the offset of a batch that is still running.
- Kafka 4.x: consider {{group.protocol=consumer}} (KIP-848), where the broker computes the assignment and rebalances happen incrementally without "syncing the whole group".

~~~yaml
spring:
  kafka:
    consumer:
      properties:
        partition.assignment.strategy: org.apache.kafka.clients.consumer.CooperativeStickyAssignor
        group.instance.id: order-0        # taken from the StatefulSet pod name, must be unique
        session.timeout.ms: 45000
        max.poll.records: 200
~~~

### Common mistakes
1. **Switching the assignor in a single rolling deploy**. Symptom: incompatible-protocol errors, consumers cannot join. How to avoid: the two-step rolling upgrade above.
2. **Static membership on a Deployment**. Symptom: you still rebalance on every deploy, and sometimes a ghost member holds partitions until the timeout. How to avoid: use it with a StatefulSet or a stable id.
3. **Raising max.poll.interval.ms to hide a stuck batch**. Symptom: the consumer is genuinely stuck but is detected much later. How to avoid: split the batch, add timeouts to outbound calls.
4. **CPU-based autoscaling that is too twitchy**. Symptom: consumers are constantly added and removed, endless rebalances. How to avoid: scale on lag, add a cooldown, never exceed the partition count.

### One-minute spoken answer
"These are two different mechanisms. Cooperative sticky rebalances in stages: only the partitions that must move are revoked while the others keep running, so the interruption is much smaller than with eager. Static membership with a fixed group.instance.id lets a pod that restarts within the session timeout skip the rebalance, which fits StatefulSets well. I combine both, tune the session timeout, heartbeat and max.poll.interval to the real processing time, and autoscale on lag with a cooldown. When switching assignors I roll out in two steps to avoid a protocol mismatch. On Kafka 4 I consider the new group protocol KIP-848. I always monitor the number and the duration of rebalances per deploy."

> Senior tip: monitor the rebalance count, the rebalance duration and the assignment per deploy. If rebalances come from {{max.poll.interval.ms}}, simply raising the timeout can hide a stuck batch; prefer splitting the batch or moving long processing to a worker with checkpoints.`,
    follow: [
      'If a static member hangs but its session timeout has not expired, how does that affect availability?',
      'When rolling out a Kafka client, how should you control the assignor version?'
    ]
  },
  'microservices-031': {
    q: 'You must not lose records and must avoid repeating business processing when a consumer writes to the database. Explain at-least-once, the idempotent producer and Kafka transactions, along with the limits of exactly-once.',
    a: `**Summary:** commit the offset **after** processing for at-least-once: the record may be processed again but is never lost; committing **before** processing risks losing data. The **idempotent producer** removes duplicates caused by the producer's own retries when writing to Kafka. **Kafka transactions** + {{isolation.level=read_committed}} give exactly-once inside a **Kafka → Kafka** flow (consume-transform-produce), but they **cannot** cover an external database. When the consumer writes to a DB, the standard approach is at-least-once + an **inbox/dedup table in the same DB transaction** as the business write.

### Quick intuition
You are a warehouse clerk receiving delivery notes numbered in sequence. After finishing note 10 you write "done up to note 10" in the ledger (commit the offset). If you **finish the delivery and then faint before writing the ledger**, the next shift redoes note 10, i.e. a duplicate (at-least-once). If you **write the ledger first and then faint before the delivery**, note 10 is skipped forever (data loss). The safe way: write the ledger last, and stick a **note number** on every crate; the warehouse checks "this number was already received" and skips it. That is an idempotent consumer.

### Glossary
- **Offset commit**: stores the position a consumer group has processed in the internal {{__consumer_offsets}} topic.
- **At-least-once / at-most-once**: never lost but may repeat / never repeated but may be lost.
- **Idempotent producer**: a producer with a producer ID + per-partition sequence numbers so the broker drops retry duplicates.
- **Kafka transaction**: groups several writes (across partitions) + the offset commit into a single atomic unit.
- **read_committed**: the consumer only sees records of committed transactions.
- **transactional.id**: a stable identity for a transactional producer, used to fence a "zombie" producer.
- **Inbox / dedup table**: a table storing processed event ids, written in the same transaction as the business data.
- **Outbox**: a table holding events waiting to be published, written in the same transaction as the business data.

### At-least-once and idempotency (step by step)
1. The consumer reads offset 10 and writes to the DB successfully.
2. The consumer dies **before** committing offset 11.
3. After the rebalance, offset 10 is read again. This duplicate is **intentional** so that no event is lost.
4. Protect the DB: inside **the same DB transaction**, insert the event id into the inbox table (primary key) before updating the business data; if the insert is a duplicate, skip. Why the same transaction: if you split them, a crash between the two steps creates duplicates again.
5. Commit the offset after the DB transaction commits.

~~~java
@KafkaListener(topics = "payment.captured")
@Transactional   // DB transaction (JPA)
public void on(PaymentCaptured evt) {
    if (inboxRepo.insertIfAbsent(evt.eventId()) == 0) return;   // already processed: skip
    orderRepo.markPaid(evt.orderId(), evt.amount());            // same transaction
}   // once the DB commits, the container commits the offset
~~~
- Committing the offset **before** writing the DB: a crash in between advances the offset while the DB has nothing, so the **effect is lost**.
- With batches or parallel processing: only commit the highest offset for which **every earlier record has finished**.

### Idempotent producer and transactions
1. **Idempotent producer** (on by default since Kafka 3.0, paired with {{acks=all}}): the broker remembers the last sequence of each producer/partition, so a retried duplicate batch is dropped. **Limit**: it cannot stop the **application** from calling {{send()}} twice for the same event (for example when the request itself is retried from the start); that case needs an event id + dedup on the consumer.
2. **Transaction**: the producer has a {{transactional.id}}, writes many records + the consumer offsets in one transaction ({{sendOffsetsToTransaction}}), then commits or aborts.
3. The downstream consumer sets {{isolation.level=read_committed}} to skip records belonging to uncommitted or aborted transactions.

~~~text
consume input → transform → beginTransaction
                          → send(output...) + sendOffsetsToTransaction(input offsets)
                          → commitTransaction   (all succeed together or all abort)
~~~

### The boundary of exactly-once
| Flow | Exactly-once? | How |
|---|---|---|
| Kafka → Kafka | yes (within Kafka) | transactions / Kafka Streams {{processing.guarantee=exactly_once_v2}} |
| Kafka → DB | not automatically | at-least-once + inbox/upsert in the same DB transaction |
| Kafka → external API | not automatically | an idempotency key sent to the external side + reconciliation |
| DB → Kafka | not automatically | transactional outbox + CDC |

"Exactly-once" must always state its **scope** and **which failures are covered**.

### Common mistakes
1. **Inbox insert and business update in two different transactions**. Symptom: duplicates still appear after a crash. How to avoid: one DB transaction for both.
2. **Believing a Kafka transaction also covers the DB**. Symptom: Kafka commits while the DB rolls back (or the reverse), data drifts. How to avoid: pick one source of truth, use inbox/outbox.
3. **The downstream consumer still uses read_uncommitted** (the default). Symptom: it reads records of aborted transactions. How to avoid: set read_committed on consumers of transactional topics.
4. **auto commit + asynchronous processing**. Symptom: a crash loses records because the offset was already committed automatically. How to avoid: turn auto commit off (Spring Kafka already does), commit after processing.

### One-minute spoken answer
"I choose at-least-once: commit the offset only after processing and accept possible reprocessing instead of losing records. To avoid repeating business work, the consumer inserts the event id into an inbox table and updates the data in the same DB transaction; a duplicate is skipped. The idempotent producer only prevents retry duplicates from the producer, not an application that sends twice. Kafka transactions with read_committed give exactly-once when both the input and the output are Kafka, as in Kafka Streams, but they do not cover Postgres or an external API. That is why whenever I say exactly-once I state the scope. In practice I carry the event id across logs, DB and traces so that replay is provably safe."

> Senior tip: production usually picks at-least-once plus an idempotent consumer. Carry the event id across logs, DB and traces so the on-call team can prove which retry created a duplicate and replay safely.`,
    follow: [
      'Why does an idempotent producer not prevent a duplicated business publish?',
      'When the consumer writes to the DB, how do you design the inbox table and commit the offset?'
    ]
  },
  'microservices-032': {
    q: 'A new Kafka cluster needs to drop ZooKeeper. How does KRaft change the architecture and the operational process, and how do you plan the migration of a running cluster?',
    a: `**Summary:** **KRaft** moves metadata management into Kafka itself: a group of **controllers** elects a leader with the Raft protocol and stores metadata in an internal log, dropping ZooKeeper entirely. The result: one system less to run, faster controller failover and clusters that hold more partitions. Since **Kafka 4.0 ZooKeeper has been removed completely**, so an old cluster must migrate on the **3.x line (the bridge release 3.9)** before moving to 4.x, following the official procedure, with verification steps and a rollback window before "finalizing".

### Quick intuition
Kafka used to be a company renting an **external law office** (ZooKeeper) to keep the registry: who leads which partition, which topics exist. Every change required a call to that office. KRaft is **setting up an internal legal department** of three people sharing one notebook and deciding by majority. Fewer parties to coordinate, faster, but now you are responsible for keeping the department staffed (the quorum).

### Glossary
- **Metadata**: information about the cluster (topics, partitions, leaders, ISR, configs, ACLs).
- **Controller**: the node that manages metadata and makes decisions (elect partition leaders, create topics).
- **Raft**: a consensus algorithm: one leader appends to the log, followers replicate it, a majority must agree.
- **Quorum / majority**: the minimum number of nodes needed to make a decision (3 nodes tolerate 1 failure, 5 nodes tolerate 2).
- **Metadata log ({{__cluster_metadata}})**: the internal log holding every metadata change; brokers read it to stay up to date.
- **Combined mode**: one process acting as both broker and controller (fine only for dev/test).
- **Bridge release**: a 3.x version that supports both modes for the migration (3.9 is the last one with ZooKeeper).
- **Finalize migration**: the step that locks the cluster into KRaft; after it you cannot go back to ZooKeeper.

### How KRaft changes the architecture
1. **Before**: ZooKeeper stored metadata; one broker was elected controller, read/wrote ZooKeeper and pushed metadata to the other brokers. Why it was slow: a new controller had to load all metadata from ZooKeeper during failover.
2. **After**: 3 or 5 controllers run Raft and metadata is a replicated log; a standby controller already has the metadata, so failover is almost instant.
3. **Brokers** still store partition data as before, but obtain metadata by reading the metadata log.
4. **The quorum** needs an odd number of nodes placed in different failure domains (different AZs).

~~~text
       KRaft controller quorum (3 nodes, Raft)
   [ctrl-1 LEADER] ⇄ [ctrl-2] ⇄ [ctrl-3]   ← metadata log
            │ metadata (pull)
   [broker-1] [broker-2] [broker-3] ...      ← partition data
Losing 1 of 3 controllers: still running.  Losing 2 of 3: no majority → no metadata changes
~~~
No ZooKeeper does not mean Kafka recovers from every failure by itself: if the controller quorum loses its majority, every metadata change (creating a topic, re-electing a leader when a broker dies) stalls; brokers may keep serving the data they have, but the cluster cannot adjust itself.

### How operations change
- Creating a new cluster: generate a cluster id and format the storage directory with {{kafka-storage.sh}} before starting the nodes.
- Monitor **quorum health** (current leader, metadata log follower lag) with {{kafka-metadata-quorum.sh describe --status}} and JMX metrics.
- Backup/restore must understand KRaft metadata, not just copy a broker's data directory.

### Migrating a running cluster (ZooKeeper → KRaft, step by step)
1. **Upgrade to the bridge release** (3.9 recommended) while still in ZooKeeper mode. Why: 4.x can no longer read ZooKeeper.
2. **Check the features in use** are supported by KRaft in the target version; back up configs, metadata and ACLs; confirm monitoring.
3. **Stand up the KRaft controller quorum** with the migration configuration pointing at the old ZooKeeper.
4. **Rolling-restart the brokers** with the migration configuration: the KRaft controllers copy metadata from ZooKeeper; during this "dual-write" phase metadata is still written back to ZooKeeper.
5. **Rolling-restart the brokers into full KRaft mode**, checking partitions, ISR and client lag after every node.
6. **Finalize**: remove the migration configuration from the controllers. Rollback is only possible **before** this step, and only inside the agreed time window.
7. Once stable, upgrade to 4.x and retire ZooKeeper.

Always follow the official migration guide for the exact version; configuration names and detailed steps can differ between releases.

### Common mistakes
1. **Colocating controllers and brokers in production**. Symptom: CPU/disk contention exactly when a leader is re-elected, slow metadata. How to avoid: dedicated controllers.
2. **Alerts that only watch "broker up"**. Symptom: the quorum has lost its majority and nobody knows until creating a topic fails. How to avoid: alert on quorum health and metadata lag.
3. **Jumping straight from an old ZooKeeper-based 3.x to 4.0**. Symptom: brokers fail to start. How to avoid: migrate on the bridge release first, then move to 4.x.
4. **Finalizing too early**. Symptom: problems appear with no way back. How to avoid: run long enough in the migration state with explicit criteria before finalizing.

### One-minute spoken answer
"KRaft replaces ZooKeeper with a controller quorum inside Kafka, using Raft and storing metadata in an internal log. Standby controllers already have the metadata, so failover is fast, the cluster can hold more partitions, and there is one system less to operate. Since Kafka 4.0 ZooKeeper is gone, so I migrate on the bridge release 3.9: stand up the controller quorum in migration mode, rolling-restart the brokers so metadata is copied, then roll them into full KRaft while watching ISR and lag after each step, and finalize only once stable because there is no way back afterwards. For operations I place 3 or 5 controllers in different AZs and alert on quorum health, not just broker up."

> Senior tip: rehearse losing one controller and restoring on staging with data close to production. The criterion is a measured recovery time for metadata operations (creating a topic, re-electing a leader), not just seeing the process running.`,
    follow: [
      'When the controller quorum loses its majority, what do brokers and clients see?',
      'Which rehearsal do you use to verify that KRaft metadata can be restored?'
    ]
  },
  'microservices-033': {
    q: 'The audit topic must keep history for replay, while the customer status topic only needs the latest value per key. Do you choose retention or compaction, and what do their configurations affect?',
    a: `**Summary:** **retention** deletes whole old segments by time ({{retention.ms}}) or size ({{retention.bytes}}), which suits an event history with a time limit such as an audit topic (set retention long enough, or archive elsewhere if you need it longer). **Compaction** ({{cleanup.policy=compact}}) keeps **the latest value per key**, which suits a customer status topic (a changelog). Compaction runs asynchronously, so it is not an instant "snapshot", and deletion records (tombstones) are only kept for a limited period too.

### Quick intuition
**Retention** is like a **security camera that keeps 30 days**: after 30 days the old tape is overwritten, but you can review everything within those 30 days. **Compaction** is like a **phone book**: for each person you only need the **latest** phone number and the old one is crossed out; if someone moves away for good, you write "deleted" for a while and then remove the line entirely. The audit topic needs to review "what happened", so it is the camera; the customer status topic only needs "what is true now", so it is the phone book.

### Glossary
- **Segment**: a sub-file of a partition's log; Kafka deletes/compacts whole segments, not individual records.
- **Active segment**: the segment currently being written; it is never deleted or compacted.
- **retention.ms / retention.bytes**: the age / size limit of a partition before old segments are deleted (default 7 days / unlimited).
- **Log compaction**: the cleaner keeps the newest record per key and drops older records with the same key.
- **Tombstone**: a record with a null value, meaning "this key was deleted".
- **delete.retention.ms**: how long a tombstone is kept after compaction (default 1 day).
- **min.cleanable.dirty.ratio / min.compaction.lag.ms**: the "dirty" threshold that triggers the cleaner / the minimum time a record is left untouched before it can be compacted.
- **Changelog topic**: a topic reflecting the current state of each key, used to rebuild a state store/cache.

### Retention (step by step)
1. Kafka appends to segments; when a segment is big enough ({{segment.bytes}}, default 1GB) or old enough ({{segment.ms}}) it is "closed" and a new segment starts.
2. The broker checks periodically: if the newest record of a closed segment is older than {{retention.ms}}, or the partition exceeds {{retention.bytes}}, it **deletes the whole segment**. Why per segment: deleting a file is far faster than deleting record by record.
3. A consumer offline longer than retention cannot read the deleted part (the offset is reset according to {{auto.offset.reset}}).
4. Use it for telemetry, audit with a retention policy, and event replay within a defined window. If you must keep years of data, archive to object storage (S3) or use tiered storage.

### Compaction (step by step)
1. The cleaner scans the closed segments and builds "the latest offset of each key".
2. It writes new segments, dropping older records with the same key. Why asynchronous: compaction is IO-heavy, so it runs in the background per the {{min.cleanable.dirty.ratio}} threshold.
3. Reading from the start of the topic may still show **several versions** of a key if the cleaner has not reached it yet, and the active segment is never compacted.
4. A null-valued record is a **tombstone**; after compaction the tombstone is kept for another {{delete.retention.ms}} and then cleaned as well. Why keep it: so a consumer that is still reading gets to see the delete.

~~~text
Before compaction: c42=Gold | c77=Basic | c42=Platinum | c77=null
After compaction:  c42=Platinum | c77=null (tombstone, kept for delete.retention.ms)
Later:             c42=Platinum          (c77 is gone for good)
~~~

### Combining and configuring
~~~bash
# audit topic: keep 90 days
kafka-configs.sh --bootstrap-server localhost:9092 --alter --entity-type topics --entity-name audit.events \\
  --add-config retention.ms=7776000000
# customer status topic: compact
kafka-configs.sh --bootstrap-server localhost:9092 --alter --entity-type topics --entity-name customer.state \\
  --add-config cleanup.policy=compact,min.compaction.lag.ms=60000
~~~
- You can enable **both**: {{cleanup.policy=compact,delete}} means compaction keeps the latest value per key while retention bounds age/size. But retention may also delete the latest value of a key that rarely changes, losing data needed for a rebuild, so it must match the recovery requirement.

### How to choose
| Need | Choose |
|---|---|
| Audit, event sourcing, replay of history | long enough retention (+ archive if you need longer) |
| Latest state per key, rebuilding a cache/state store | compact |
| Latest state but with a size bound | compact,delete (carefully) |
| Arbitrary queries, multi-record transactions | a database, not a topic |

### Common mistakes
1. **Unstable keys on a compacted topic**. Symptom: compaction does not reduce size, the same customer has many keys. How to avoid: use a stable entity id as the key.
2. **A consumer offline longer than delete.retention.ms**. Symptom: it never receives the delete, the cache keeps a "ghost customer". How to avoid: set delete.retention.ms above the maximum offline time, or rebuild from scratch.
3. **Short retention on an audit topic**. Symptom: you need to investigate an incident from two months ago and the data is gone. How to avoid: retention per policy, archive to S3.
4. **Treating compaction as immediate**. Symptom: a bootstrapping consumer sees old records and misprocesses them. How to avoid: consumers always apply "the later record wins" and handle tombstones.

### One-minute spoken answer
"Retention deletes whole segments when they are too old or too big, so it suits an audit topic that needs replay within a window; I set retention by the retention policy and archive to S3 if I need it longer. Compaction keeps the newest record per key, which suits a customer status topic used to rebuild a cache or state store. I keep in mind that compaction runs in the background so consumers can still see old records, the active segment is never compacted, and a tombstone only lives for delete.retention.ms. You can enable compact and delete together but must be sure you are not losing data needed for a rebuild. A topic cannot replace a database when you need arbitrary queries."

> Senior tip: try rebuilding the state store from the topic after the cleaner has run and the tombstones have expired. If the rebuild still needs to know "the record was deleted" to understand the business, you must store the deletion marker or the history somewhere else.`,
    follow: [
      'If a new consumer needs to restore the full history, does compaction satisfy that?',
      'What risk does a tombstone expiring before an offline consumer comes back create?'
    ]
  },
  'microservices-034': {
    q: 'A Spring Kafka listener keeps hitting the same invalid-data error. How do you configure retry, DefaultErrorHandler and DeadLetterPublishingRecoverer to prevent a poison message from blocking the partition?',
    a: `**Summary:** classify errors first: **transient** errors (DB timeout, 503) get bounded retries with backoff; **permanent** errors (bad payload, validation violation, corrupt deserialization) are not retried but sent straight to the **DLT** with metadata. {{DefaultErrorHandler}} orchestrates retry/recover, {{DeadLetterPublishingRecoverer}} publishes the failed record to the DLT; the offset only advances when the record has been processed **or** successfully moved to the DLT. Deserialization errors must be caught with {{ErrorHandlingDeserializer}}, otherwise the consumer is stuck in a loop at the poll step.

### Quick intuition
A packaging conveyor meets a crate with a **damaged label** (a poison message). If the worker keeps picking it up, trying to read the label, failing, putting it back, and trying again... the whole conveyor stops forever. The right way: a crate that is **temporarily wet** (transient error) is left to dry for a moment and retried a few times; a crate whose **label is torn off** (permanent error) gets a note "which conveyor, which position, what error" and is moved to the **faulty-goods shelf** (DLT) while the conveyor keeps running. Later the person responsible for the faulty shelf reviews it and puts it back once fixed.

### Glossary
- **Poison message**: a record that fails on every attempt; if you do not take it out it blocks the partition.
- **DefaultErrorHandler**: Spring Kafka's default error handler (since 2.8); it retries by seeking back to the offset and calls the recoverer when attempts run out.
- **BackOff**: the wait policy between retries ({{FixedBackOff}}, {{ExponentialBackOff}}).
- **DeadLetterPublishingRecoverer**: the recoverer that sends the failed record to a dead letter topic (by default named {{<topic>.DLT}}, with the same partition count).
- **DLT (Dead Letter Topic)**: the topic holding records that could not be processed, with headers describing the error.
- **ErrorHandlingDeserializer**: a deserializer that wraps the real one; on failure it does not throw during poll but hands the error to the error handler.
- **Not-retryable exception**: an exception declared permanent that goes straight to the recoverer.

### Processing flow (step by step)
1. **The listener throws**. The container hands the record to {{DefaultErrorHandler}}.
2. **Classify**: if the exception is in the not-retryable list, jump to step 4. Why: retrying a data error changes nothing and only increases lag.
3. **Retry**: the handler seeks back to the failing offset (later records in the batch are polled again), waits per the backoff and calls the listener again. Retries run on the consumer thread, so the partition **waits**, in exchange for keeping order.
4. **Recover**: once attempts are exhausted, {{DeadLetterPublishingRecoverer}} sends the record to the DLT with the original headers.
5. **Commit the offset** after the recovery succeeds. If the DLT publish fails, the recoverer raises an error and the record is processed again instead of being skipped. Why: silently committing when the DLT failed means **losing the record**.

~~~java
@Bean
DefaultErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
    var recoverer = new DeadLetterPublishingRecoverer(template);   // default: <topic>.DLT, same partition
    var backoff = new ExponentialBackOff(500L, 2.0);
    backoff.setMaxElapsedTime(5_000L);              // retry for at most ~5s, then go to the DLT
    var handler = new DefaultErrorHandler(recoverer, backoff);
    handler.addNotRetryableExceptions(InvalidPayloadException.class,
                                      DeserializationException.class); // permanent: DLT immediately
    return handler;
}
~~~
~~~yaml
spring:
  kafka:
    consumer:
      value-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
      properties:
        spring.deserializer.value.delegate.class: org.springframework.kafka.support.serializer.JsonDeserializer
~~~

~~~text
offset: 40 ✓  41 ✗(retry 500ms,1s,2s…) → DLT  42 ✓  43 ✓
                 the partition only pauses ~5s, not forever
DLT headers: kafka_dlt-original-topic/partition/offset, kafka_dlt-exception-fqcn, -message, -stacktrace
~~~

### The DLT needs a "contract"
- Name and route the DLT consistently. If you keep the default partition count, the DLT must have **at least** as many partitions as the source topic.
- Original headers (topic, partition, offset, exception, timestamp) are mandatory for investigation and replay.
- The DLT serializer must be able to write corrupt payloads too: when deserialization failed, the remaining value is raw bytes, so configure the template/serializer accordingly (for example ByteArraySerializer for that case).
- The DLT needs an **owner, alerts and a replay process** with idempotency; do not replay automatically and continuously, it creates an error loop.

### Ordering and offsets
- Blocking retry keeps the order but later records in the same partition must wait, so the total backoff must be short and well below {{max.poll.interval.ms}}.
- Asynchronous retry topics ({{@RetryableTopic}}) give better throughput but can change the per-key order.
- The container ack mode (BATCH by default) only commits records that have finished or been recovered.

### Common mistakes
1. **Not using ErrorHandlingDeserializer**. Symptom: the log repeats a deserialization error at the same offset forever, the listener is never called. How to avoid: wrap the deserializer as shown above.
2. **Retrying validation errors**. Symptom: every bad record holds the partition for tens of seconds. How to avoid: declare them not-retryable.
3. **A DLT with too few partitions or that does not exist**. Symptom: recovery fails and the record repeats forever. How to avoid: create the DLT first, with enough partitions, and check write permissions.
4. **Nobody watches the DLT**. Symptom: thousands of failed orders sit there for weeks. How to avoid: alert on the rate into the DLT, and have an owner and a replay runbook.

### One-minute spoken answer
"I classify errors first. Transient errors such as a DB timeout are retried a few times by DefaultErrorHandler with exponential backoff, for only a few seconds in total so the partition is not held long. Permanent errors such as a bad payload or corrupt deserialization are declared not-retryable so DeadLetterPublishingRecoverer sends them straight to the DLT with topic, partition, offset and exception headers. Deserialization errors I catch with ErrorHandlingDeserializer, otherwise the consumer is stuck at poll. The offset is only committed when processing finished or the DLT publish succeeded, so no record is lost. The trade-off of blocking retry is that the partition waits during retries, in exchange for keeping order. I always have an alert and an owner for the DLT."

> Senior tip: keep a dedicated dashboard for retry counts, the rate into the DLT and the age of the oldest unprocessed record. A DLT of 0 does not mean healthy if the consumer is retrying the same poison record thousands of times.`,
    follow: [
      'How do retry topics differ from blocking retry in terms of ordering and lag?',
      'How do you replay a DLT so that you do not send a payment that already succeeded again?'
    ]
  },
  'microservices-035': {
    q: 'Consumer lag keeps rising after traffic triples. How do you find the bottleneck and apply backpressure, even after increasing the number of consumers?',
    a: `**Summary:** lag is the gap between the **log end offset** (the newest record) and the **offset the consumer has committed**. Adding consumers only helps when **there are partitions left to split** and the bottleneck is **the consumer itself**; if the bottleneck is the DB/downstream, a hot partition or constant rebalances, more consumers are useless or even make things worse. The approach: measure the ingress/egress rates, lag and **event age** per partition, find the real bottleneck, then apply backpressure (limit concurrency, pause/resume) instead of opening unlimited workers.

### Quick intuition
A supermarket is three times busier and the checkout lines get longer. Opening more registers (more consumers) only helps when **there is space for more registers** (partitions) and **the cashier is the slow part**. If the real slow part is the **bank's card terminal** (DB/downstream), opening more registers only overloads the terminal further. If one customer is buying 500 items (a hot key), that customer's register stays jammed no matter how many other registers exist. Backpressure is when the terminal says it is busy and the cashier **stops inviting new customers** instead of taking everyone and getting stuck halfway.

### Glossary
- **Log end offset (LEO)**: the next offset that will be written to the partition.
- **Consumer lag**: LEO minus the committed offset, computed per partition.
- **Event age / lag time**: the time from when an event was written to when it is processed; closer to the user experience than an offset number.
- **Hot partition**: a partition receiving far more traffic because the key distribution is skewed.
- **Backpressure**: a mechanism that slows the sending/receiving side when the downstream cannot keep up.
- **pause/resume**: a consumer API that stops fetching records from a partition while still polling to keep the membership.
- **Little's Law**: work in progress = arrival rate × processing time.
- **KEDA**: a Kubernetes autoscaler that scales on external metrics such as Kafka lag.

### Diagnosing before scaling (step by step)
1. **Consumers vs partitions**: more consumers than partitions means the extra ones sit idle. Adding partitions increases parallelism but changes the key mapping (affecting order) and raises broker load.
2. **Compare ingress and egress**: records/s written by producers vs records/s processed by consumers. If out < in for long, lag grows linearly.
3. **Look at lag per partition**: lag concentrated in 1–2 partitions is a **hot key**, not a lack of consumers.
4. **Look at the time per record**: DB connection pool wait, downstream latency, GC pauses, rebalance count.
5. **Tell a burst from missing capacity**: lag rising while event age stays low may just be a burst being caught up; event age rising forever is an SLA violation.

~~~text
in: 3,000 rec/s   out: 2,000 rec/s   → lag grows 1,000 rec/s ≈ 3.6 million/hour
consumers: 12 pods / 12 partitions (cannot add more)
each record: 6ms, of which 5ms is the DB write (pool of 10 connections, DB already at ~2,000 writes/s)
=> the bottleneck is the DB, NOT the number of consumers
~~~

### Fix by bottleneck
- **Consumer CPU-bound**: optimize the code, add partitions + consumers, or process in parallel per key inside the consumer.
- **Downstream/DB**: write in batches (one INSERT with many rows), cut round-trips, add DB capacity; set concurrency by the connection pool and DB quota, not by the record count.
- **Hot key**: handle the hot key separately, or split it into smaller keys if the business only needs ordering at a finer level.
- **Constant rebalances**: static membership, cooperative sticky, lower {{max.poll.records}}.

### Backpressure (step by step)
1. Kafka is a durable buffer **within the retention limit**, not infinite: lag larger than retention means data loss.
2. When the downstream is exhausted, the consumer **pauses** the partition (Spring Kafka: pause the container or the listener), keeps polling to maintain heartbeats/membership, and does **not commit** offsets for the unprocessed part.
3. Bound the number of in-flight tasks (semaphore/bulkhead) by the downstream capacity: if the DB takes at most ~2,000 writes/s and each write is 5ms, then 2,000 × 0.005 = 10 concurrent tasks is enough (Little's Law); more only makes writes queue inside the DB.
4. If the overload lasts: slow the producers, shed non-critical work, or add downstream capacity. The queue only postpones the incident and burns disk.

### Safe autoscaling
- Scale on lag/event age together with throughput (KEDA Kafka scaler, for example), but **cap replicas at the partition count** and by downstream capacity.
- Have a cooldown and a minimum replica count; scaling up/down too fast causes constant rebalances and lag grows even more.
- Alert on **event age**; it is usually closer to user impact than an offset count.

### Common mistakes
1. **Adding pods beyond the partition count**. Symptom: new pods idle, lag unchanged. How to avoid: cap max replicas at the partition count.
2. **Scaling consumers when the DB is the bottleneck**. Symptom: lag keeps growing, the DB starts timing out, errors increase. How to avoid: measure pool wait/DB latency before scaling.
3. **Unbounded asynchronous processing**. Symptom: OOM from millions of tasks in memory, a crash loses progress. How to avoid: cap in-flight work, pause when full.
4. **Looking only at total lag**. Symptom: you miss one partition stuck on a poison message. How to avoid: track lag and event age per partition.

### One-minute spoken answer
"Lag is the log end offset minus the committed offset, and adding consumers only helps when partitions are left and the bottleneck is the consumer. So I measure first: ingress vs egress rates, lag per partition to find hot keys, and the per-record time split into DB pool wait, downstream, GC and rebalances. If the DB is the bottleneck, I write in batches and bound concurrency by DB capacity using Little's Law. For backpressure I pause partitions when the downstream is exhausted, keep polling to maintain membership and do not commit the unfinished part. I autoscale on lag with KEDA but never beyond the partition count, with a cooldown. I alert on event age because it is closer to users than an offset number."

> Senior tip: set an SLO like "99% of events processed within 30 seconds" and alert on event age. A million lag on an analytics topic can be harmless; a few thousand payment events that are already 10 minutes old are not.`,
    follow: [
      'What can cause low lag but a high event age?',
      'How do you coordinate consumer autoscaling with the DB connection pool limit?'
    ]
  },
  'microservices-036': {
    q: 'Many teams read the same Avro events and need to deploy producers/consumers independently. How do you choose Schema Registry compatibility and the schema change process?',
    a: `**Summary:** Schema Registry stores the schema versions of each subject and **checks compatibility** whenever a new schema arrives, so producers and consumers owned by different teams can deploy independently without breaking each other. When consumers must read old data (replay), **BACKWARD** (or better **BACKWARD_TRANSITIVE**) is the pragmatic choice; if you cannot control the deploy order, use **FULL_TRANSITIVE**. Every change follows the rules: new fields get a default, meanings never change, fields are removed through a deprecation phase, and the rollout has an order.

### Quick intuition
Many departments share one **order form** (the schema). The department that owns the form wants to add an "alternate phone" box. If the new box has a **default value** ("leave it blank if unknown"), a reader using the new form can still read old orders that lack the box, and a reader using the old form ignores the unknown box. Schema Registry is the **form review desk**: before a new form is issued it checks "does the new form make life hard for people still using the old one" and rejects it if so. But it cannot check **meaning**: changing a box from "amount (USD)" to "amount (cents)" is still a number, and the review desk will not notice.

### Glossary
- **Subject**: the name of a group of schema versions, usually {{<topic>-value}} under the default strategy.
- **Writer schema / reader schema**: the schema used when the producer writes / the schema the consumer uses to read; Avro reconciles the two when deserializing.
- **Schema ID**: the identifier of a schema in the registry, written at the start of every message (magic byte + 4-byte ID).
- **BACKWARD**: the new schema can read data written with the previous schema (upgrade consumers first).
- **FORWARD**: the old schema can read data written with the new schema (upgrade producers first).
- **FULL**: both directions hold.
- **TRANSITIVE**: checks against **every** earlier version, not just the immediately preceding one.
- **Alias (Avro)**: an old name declared in the reader schema so a renamed field can still be read.

### How it works inside (step by step)
1. **The producer** serializes with Avro, asks the registry for the schema ID (and caches it), then writes {{[magic byte][schema ID][binary data]}}. Why not send the whole schema: it saves bandwidth, every message adds only 5 bytes.
2. **Registering a new schema**: the registry compares it with older versions according to the compatibility mode; if it fails it returns a 409 and the schema is not registered.
3. **The consumer** reads the schema ID, loads the writer schema from the registry (caching it), and then Avro **resolves** it into the consumer's reader schema: fields present in the reader but missing in the writer take their default; fields present in the writer but unknown to the reader are skipped.

~~~text
writer v1: {id, amount}            reader v2: {id, amount, currency="VND"}
old record (v1) ──► reader v2: currency missing → use default "VND"   (BACKWARD ok)
new record (v2) ──► reader v1: unknown currency → skip                (FORWARD ok)
=> adding a field with a default satisfies FULL
~~~

### Change rules
- **Adding a field**: always give it a default (with Avro, a nullable field is the union {{["null", "string"]}} with default null).
- **Removing a field**: only remove fields that have a default; mark them deprecated first and wait until every consumer stops using them.
- **Renaming**: use an alias in the reader schema or add a new field and migrate; never rename in place.
- **Changing a type**: only the "type promotions" Avro allows (int → long, float → double, string ↔ bytes); everything else counts as breaking.
- **Never reuse a field name for a different meaning**, never change a unit silently.

### Safe rollout order (BACKWARD)
1. Add an optional field with a default and register the schema (usually from CI).
2. Deploy a **consumer** that reads both the old and the new form.
3. Deploy the **producer** that starts writing the new field.
4. Wait out the retention/replay window and verify every consumer is updated.
5. Only then drop the old field with a following schema version.

### Choosing a mode for many teams
| Situation | Mode |
|---|---|
| Consumers always upgrade first and must replay data over many versions | BACKWARD_TRANSITIVE |
| Producers upgrade first, consumers lag behind | FORWARD_TRANSITIVE |
| Many teams, the deploy order cannot be controlled | FULL_TRANSITIVE |

### Common mistakes
1. **Using BACKWARD (not transitive) and then replaying an old topic**. Symptom: v3 is compatible with v2 and v2 with v1, but v3 cannot read v1. How to avoid: use a transitive mode.
2. **Changing the meaning while keeping the type**. Symptom: the registry approves, the amount is off by 100×. How to avoid: a meaning change becomes a new field; review semantics and contract-test with old/new sample payloads.
3. **Enabling auto-register in production**. Symptom: an unknown schema gets registered from a broken build. How to avoid: register in CI, disable auto-register in production.
4. **Setting NONE to keep the pipeline green**. Symptom: another team's consumer breaks after a deploy. How to avoid: mode changes go through review and have a deadline to revert.

### One-minute spoken answer
"Schema Registry stores the schema versions and checks compatibility at registration; each message carries only a schema ID, and the consumer resolves the writer schema against its reader schema. With many teams and replay needs I choose BACKWARD_TRANSITIVE, or FULL_TRANSITIVE if the deploy order cannot be controlled. My rules: new fields always have a default, removals go through deprecation, renames use aliases, and meanings never change silently. The rollout order is: register the schema from CI, deploy consumers first and producers after, wait out retention before cleaning old fields. The trade-off is extra process, but the registry cannot check semantics, so I still need review and contract tests."

> Senior tip: schema ownership must include a business owner, a breaking-change policy and a contact when the compatibility check fails. The registry does not replace a semantic review or an inventory of the consumers using the topic.`,
    follow: [
      'How do backward and full transitive differ when replaying a topic with long history?',
      'If you change the unit of a field but keep the same numeric type, does the registry detect it?'
    ]
  },
  'microservices-037': {
    q: 'A bank runs Kafka, RabbitMQ and IBM MQ. How do you assign roles to the three brokers for event streaming, work queues and legacy transactions instead of forcing every workload onto one platform?',
    a: `**Summary:** assign roles by **semantics**, not by how "hot" a tool is: **Kafka** for event streams that need fan-out to many consumers and replay; **RabbitMQ** for work queues/tasks that need a per-message ack, flexible routing and retry/dead-letter; **IBM MQ** stays at the integration edge with core banking/mainframe and partners that are already standardized on MQ, where SLAs, audits and support contracts already exist. Connect the worlds with **controlled bridges** (connector + idempotency), pick one default broker for new workloads, and require an ADR for every exception.

### Quick intuition
A bank has three kinds of "transport". **Kafka** is a **radio station that records its broadcasts**: it plays once, many branches listen, and anyone who missed it can rewind. **RabbitMQ** is the **in-office work tray**: each work slip goes to exactly one person, who signs when done, and a failed slip moves to the error tray. **IBM MQ** is the **guaranteed courier route** with a multi-year contract with the treasury (mainframe, core banking): slow to change, but already audited and used by every partner. Forcing everything onto one route either loses the ability to rewind, or requires tearing up a contract that works fine.

### Glossary
- **Event stream**: a chain of events stored in order and read independently by many parties.
- **Work queue / competing consumers**: many workers take jobs from one queue, each message processed by only one worker.
- **Exchange / routing key**: RabbitMQ's routing mechanism (direct, topic, fanout, headers).
- **Queue manager (IBM MQ)**: the component that manages queues and connection channels in IBM MQ.
- **JMS**: the standard Java API for messaging; IBM MQ supports it fully (Jakarta JMS).
- **Bridge / connector**: a component that moves messages between two brokers (for example Kafka Connect MQ source/sink).
- **ADR (Architecture Decision Record)**: a document recording an architecture decision, its reasons and consequences.
- **RPO / RTO**: the maximum amount of data you accept losing / the maximum time to recover.

### Comparing by workload
| Need | Kafka | RabbitMQ | IBM MQ |
|---|---|---|---|
| Replay, many independent consumers | **strong**: the log is retained, each group has its own offset | a queue is usually deleted on ack; Streams (3.9+) can replay | not its main strength |
| Task queue, routing | possible but you design it yourself (partitions limit the worker count) | **strong**: exchanges, competing consumers, DLX | does this well, especially in JMS environments |
| Ordering | within a partition | per queue, lost with many consumers/requeues | depends on queue and consumer configuration |
| Transactions with legacy systems | through a connector | through a plugin/bridge | **often already standard**, XA support, mainframe connectivity |
| Throughput | very high | medium–high | high, optimized for per-message reliability |

### Architectural decision (step by step)
1. **List the flows** by semantics: events that many parties must hear/replay, work that exactly one party must do, transactions with core systems. Why: choose a broker by the behavior you need, not by team preference.
2. **Assign roles**: domain events (TransactionPosted, CustomerUpdated) that need projection rebuilds, analytics or fraud detection → Kafka. Short jobs (send an OTP, generate a PDF statement) that need ack, retry, dead-letter → RabbitMQ. Communication with core banking/mainframe and payment partners already on MQ → keep IBM MQ at the edge.
3. **Design the bridge in exactly one place**: for example a Kafka Connect MQ source that brings transactions from MQ into Kafka for fan-out; every message carries a **business id** so the receiving side can deduplicate.
4. **Standardize operations**: every platform has an owner, monitoring, a runbook and a clear DR plan (RPO/RTO).

~~~text
Core banking ══IBM MQ══► [MQ source connector] ──► Kafka: txn.posted ──► fraud, analytics, notify
                                                          │ (replay to rebuild)
App ──► RabbitMQ: statement.jobs ──► PDF workers (ack, retry, DLX)
Every message carries a unique txnId → consumers deduplicate when the bridge repeats
~~~

### Banking: control first
- Define data classification, encryption (TLS in transit, encryption at rest), audit trail, retention, replay permissions and how poison messages are handled.
- **A broker is not a ledger**: when the business needs reconciliation, balances and an immutable audit, the source of truth is the ledger/DB system; the broker only transports.
- Every bridge adds duplicate risk, reordering, broken traces and ownership disputes; add one only with a reason.

### Common mistakes
1. **Three brokers for the same flow**. Symptom: a transaction goes MQ → Rabbit → Kafka, failures are hard to locate, duplicates appear. How to avoid: one primary broker per flow, bridges only at the edge.
2. **A non-idempotent bridge**. Symptom: the connector restarts, resends, and a transaction is written twice. How to avoid: a business id + dedup on the consumer.
3. **Using Kafka as a work queue for long jobs**. Symptom: one slow job blocks the jobs behind it in the partition. How to avoid: job queues belong to RabbitMQ.
4. **Every team choosing its own new broker**. Symptom: fragmented on-call cost and skills. How to avoid: a default broker + an ADR for exceptions.

### One-minute spoken answer
"I assign roles by semantics. Kafka for domain events that need many consumers and replay, such as a posted transaction flowing to fraud detection and analytics. RabbitMQ for work queues that need a per-message ack, retry and dead-letter, such as generating statements or sending OTPs. IBM MQ stays at the edge with core banking and partners because the SLA, audit and support contract already exist. Between the worlds I put a single bridge, for example Kafka Connect MQ source, and every message carries a business id for deduplication. The trade-off is running several platforms, so I pick one default broker for new workloads and exceptions need an ADR. And a broker is never the ledger."

> Senior tip: choose one default broker for new workloads; exceptions need an ADR stating the owner and the direct on-call cost. Multiple platforms may exist because of legacy, but do not let every team pick a fourth broker.`,
    follow: [
      'How do you design a Kafka–IBM MQ bridge so that duplicates do not create two transactions?',
      'When is Kafka replay not enough to satisfy a financial audit?'
    ]
  },
  'microservices-038': {
    q: 'An API writes an order to the database and then needs to publish a Kafka event. How do you design an outbox with Debezium so that no event is lost, ordering is kept per aggregate, and it is operable when the connector restarts?',
    a: `**Summary:** write the business row and the outbox row in **the same DB transaction**; Debezium (running on Kafka Connect) reads the **transaction log** (the PostgreSQL WAL, the MySQL binlog) and publishes to Kafka with **key = aggregate ID** to preserve per-aggregate order. This is "an atomic write at the DB + at-least-once delivery through CDC": a connector restarting from its checkpoint may resend, so consumers must be idempotent by event ID. Operations must monitor the connector, the replication slot/WAL and the age of unpublished events.

### Quick intuition
Every time a cashier closes an order, they write the order and the line "tell the warehouse" **on the same page of the same book** (one transaction). Debezium is the **scribe** who reads the book's journal copy (the WAL) page by page and marks "copied up to here" (the offset). If the scribe is called away and comes back, they continue from the last mark, possibly copying a few pages again (duplicates) but **never skipping**. The warehouse checks the order id so it does not prepare the goods twice.

### Glossary
- **Outbox table**: a table holding events waiting to be sent, living in the same DB as the business data.
- **CDC (Change Data Capture)**: capturing changes by reading the DB's log.
- **WAL / binlog**: PostgreSQL's write-ahead log / MySQL's binary log.
- **Replication slot**: PostgreSQL's "bookmark"; the DB keeps the WAL from the position the slot has not read yet.
- **Kafka Connect**: the framework that runs connectors (source/sink) and stores connector offsets in an internal topic.
- **SMT (Single Message Transform)**: a transformation step inside Kafka Connect; the Outbox Event Router is a Debezium SMT.
- **Aggregate ID**: the id of a business entity (orderId), used as the Kafka key to keep order.
- **Optimistic locking (version)**: a version column so two transactions do not overwrite each other on the same aggregate.

### Data flow (step by step)
1. **The API writes the order**: in one transaction, insert/update the {{orders}} table and insert a row into {{outbox}}. Why: both commit or both roll back, so there is no dual write any more.
2. **The DB commit** writes the changes to the WAL in commit order.
3. **Debezium reads the WAL** through the replication slot (PostgreSQL, pgoutput plugin) from the checkpointed position.
4. **The Outbox Event Router** turns the outbox row into a Kafka record: the topic is chosen by aggregate type, the key is the aggregate ID, the payload comes from the payload column, and the event id/type can go into headers.
5. **Kafka Connect stores the connector offset** after Kafka acknowledges the write. Why publish first and store the offset after: a crash in between resends, it never loses.
6. **The consumer deduplicates** by event ID inside the same transaction as its business write.

~~~text
Spring @Transactional ─► orders + outbox ─commit─► WAL
                                                    │ replication slot
                                    Debezium (Kafka Connect) + Outbox Event Router
                                                    │ key = orderId
                                         topic order.events ─► consumer (dedup eventId)
~~~
The outbox table usually has: {{id}} (event ID, UUID), {{aggregatetype}}, {{aggregateid}}, {{type}}, {{payload}}, the creation time and a schema version. Pin the connector version and verify the topic/key/header mapping with an integration test (Testcontainers).

### Restart, duplicates and ordering
- **Restart**: the connector continues from the stored offset; the window between "published" and "offset stored" is replayed. Consumers deduplicate by event ID or use an idempotent update.
- **Cleaning the outbox**: with CDC you can **delete the outbox row in the same transaction** right after the insert (Debezium still sees the INSERT in the WAL and the Event Router skips the DELETE event), or clean on a schedule with a suitable retention. Do not clean in a way that removes data from the log before CDC has read it.
- **Per-aggregate order** comes from the WAL commit order + the same key/partition. When several transactions update one aggregate, **DB locking/versioning** decides the commit order; do not rely on the app timestamp.

### Production controls
- Monitor the connector task state, source lag, the WAL held by the slot, publish errors and the outbox growth rate.
- A slot abandoned for a long time makes the WAL grow until the disk is full: set alerts and a {{max_slot_wal_keep_size}} limit, and have a runbook for when the connector stops.
- Payloads carry a schema version; do not put unnecessary sensitive data in the outbox.
- Rehearse on staging: restart the connector, test duplicates, restore the offset; confirm the DB keeps the log long enough for the expected recovery time.

### Common mistakes
1. **A non-idempotent consumer**. Symptom: after every connector restart some orders are processed twice. How to avoid: a processed_event table or an upsert on the natural key.
2. **A key that is not the aggregate ID**. Symptom: OrderCancelled arrives before OrderCreated at the consumer. How to avoid: the Event Router takes the key from aggregateid.
3. **A connector dead all weekend and nobody knows**. Symptom: the WAL grows, the DB disk fills, the whole system starts failing writes. How to avoid: alert on task state and retained WAL.
4. **Adding a column to the outbox without updating the router config**. Symptom: the new header/field never shows up in Kafka. How to avoid: an integration test that checks the mapping after every change.

### One-minute spoken answer
"I write the order and the outbox row in the same transaction, so there is no dual write any more. Debezium reads the WAL through a replication slot, the Outbox Event Router publishes the event to the topic with the key set to the orderId so per-order order is preserved, and Kafka Connect stores the offset only after Kafka acknowledges. So when the connector restarts it may resend but never loses, and consumers deduplicate by event ID in the same transaction as their business write. The order between transactions of the same order is decided by DB locking or versioning. Operationally I alert on the connector state, the WAL retained by the slot and the age of unpublished events, and I have a runbook for when the connector stops."

> Senior tip: set warning thresholds for the age of unpublished events and the WAL size. "The DB commit succeeded" is only half the SLA; how fast the event reaches Kafka is what consumers and customers feel.`,
    follow: [
      'What impact does a Debezium replication slot held for a long time have on PostgreSQL?',
      'How do you clean the outbox table without deleting events that have not been published?'
    ]
  }
});
