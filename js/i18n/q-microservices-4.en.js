/*
 * English translation of js/data/q-microservices.js — task T193. Format: js/core/i18n.js (content overlay).
 * ids: microservices-030 microservices-031 microservices-032 microservices-033 microservices-034 microservices-035 microservices-036 microservices-037 microservices-038
 */
App.i18n.content({
  'microservices-030': {
    q: 'Consumer groups keep rebalancing during deploys and autoscaling. How do you distinguish cooperative sticky assignment from static membership, and which configuration do you choose to reduce processing downtime?',
    a: `**Summary:** Cooperative sticky rebalance moves partitions step by step, avoiding revoking the whole assignment at once; static membership keeps member identity across short restarts to avoid unnecessary rebalances. They solve two different problems and can be combined.

### Where a rebalance causes a stop
In a consumer group, each partition is assigned to only one member at a time. When a member joins/leaves or the subscription changes, the coordinator computes a new assignment. With the eager protocol, consumers revoke all partitions, then receive the new assignment; during that time they process no records. A simultaneous deploy therefore creates a synchronous gap.

### Cooperative sticky
Sticky tries to keep the old assignment to reduce partition movement; the cooperative protocol revokes only the partitions that need to move. A rebalance may take several rounds: the first round announces the part to release, the consumer stops processing those partitions, then the next round hands them to the new member. This narrows the scope of the interruption; it does not eliminate rebalance.

### Static membership
Assign a stable {{group.instance.id}} to each instance. If an instance restarts within {{session.timeout.ms}}, the coordinator waits for the member to come back instead of immediately treating it as a new member and reassigning everything. The value must be unique within the group; a duplicate ID causes the member to be fenced. Static membership is not suitable if the autoscaler creates many pods sharing an ID or the old instance can still be alive in parallel.

### How to operate it
- Use a cooperative sticky assignor supported across the whole group; a rolling upgrade must avoid a protocol mismatch between old and new clients.
- Choose the static ID by ordinal/stateful identity, or enable it only when the platform guarantees a unique and stable identity. With ephemeral pods, cooperative is usually safer.
- Tune {{session.timeout.ms}}, {{heartbeat.interval.ms}} and {{max.poll.interval.ms}} to the real processing time. If a batch runs too long without calling poll, the member is removed even though the broker is healthy.
- On rebalance, close the consumer, commit the part already processed safely, then reinitialize resources. Do not commit the offset of a batch that is still running.

> Senior tip: monitor rebalance count, rebalance duration and partition assignment per deployment. If rebalances are caused by {{max.poll.interval.ms}}, simply increasing the timeout can hide a stuck batch; prefer splitting the batch or moving long processing to a worker with checkpoints.`,
    follow: [
      'If a static member hangs but its session timeout has not expired, how does that affect availability?',
      'When rolling out a Kafka client, how should you control the assignor version?'
    ]
  },
  'microservices-031': {
    q: 'You must not lose records and must avoid repeating business processing when a consumer writes to the database. Explain at-least-once, the idempotent producer and Kafka transactions, along with the limits of exactly-once.',
    a: `**Summary:** Commit the offset after processing for at-least-once: it may run again but avoids losing records; committing before processing trades that for possible data loss. The idempotent producer eliminates duplicates caused by retries on the Kafka write side; transactions + {{read_committed}} support exactly-once within Kafka-to-Kafka flows, but do not by themselves create an atomic transaction with an external database.

### At-least-once and idempotency
Suppose the consumer reads offset 10, writes to the DB successfully, then dies before committing. After a restart, offset 10 is read again. This is an intentional duplicate so that no event is lost. Protect the DB with an idempotency key (a unique event ID) or a unique constraint, and update state within the same DB transaction.

If you commit the offset before writing the DB, a crash in between advances the offset while the DB change is not there: the effect is lost. With batches, only commit the highest offset when every preceding record has completed contiguously; parallel processing needs per-offset completion tracking.

### Producer idempotence and transactions
The idempotent producer uses a producer ID and a per-partition sequence so the broker eliminates duplicates caused by retries; configure the producer safely with {{acks=all}} and appropriate retries. It does not prevent the application from deliberately sending the same event twice through two independent send calls.

A Kafka transaction can write multiple records and consumer offsets as a single unit. A downstream consumer with {{isolation.level=read_committed}} skips records belonging to an uncommitted or aborted transaction. This is the foundation for duplicate-free consume-transform-produce within Kafka.

~~~text
consume input -> transform -> begin transaction
                         write output + sendOffsetsToTransaction
                    commit transaction
~~~

### The boundary of exactly-once
If the middle step is a call to a payment API or a write to PostgreSQL, the Kafka transaction cannot cover that side effect. Use an idempotency key at the destination, an inbox/dedup table in the same transaction as the business write, or an outbox for publishing in the other direction. "Exactly once" must state its scope and which failures are covered.

> Senior tip: in production we usually choose at-least-once plus an idempotent consumer. Put the event ID across logs, DB and traces so the on-call team can prove which retry created a duplicate and replay safely.`,
    follow: [
      'Why does an idempotent producer not prevent a duplicated business publish?',
      'When the consumer writes to the DB, how do you design the inbox table and commit the offset?'
    ]
  },
  'microservices-032': {
    q: 'A new Kafka cluster needs to drop ZooKeeper. How does KRaft change the architecture and the operational process, and how do you plan the migration of a running cluster?',
    a: `**Summary:** KRaft brings the metadata quorum into Kafka using Raft, removes ZooKeeper and reduces the number of systems you have to operate. Migration must follow the procedure supported by the Kafka version, verify metadata and rollback ability; do not switch modes arbitrarily on production.

### What KRaft does
Previously ZooKeeper stored cluster metadata and coordinated the controller; brokers held the data log. KRaft uses a group of Kafka controllers that elect a leader via Raft and write metadata to a replicated metadata log. Brokers still store partition data as before. The controller quorum should have an odd number of nodes, usually three or five, spread across appropriate failure domains.

~~~text
KRaft controllers: leader <-> followers (metadata log)
                         |
                    Kafka brokers (partition logs)
~~~

Not having ZooKeeper does not mean Kafka recovers from every failure by itself. If the controller quorum loses its majority, metadata mutations are affected; brokers may keep serving part of the existing data but cluster changes do not happen normally.

### Controlled migration
- Check the source/target versions, the features in use and the official migration guide for that exact release; do not rely on one command for all versions.
- Back up configuration and metadata, confirm the replication factor, controller quorum, disk, network ACL and monitoring.
- Perform the metadata mode transition steps per the documentation; keep the cluster stable through each step and verify the controller quorum and partition state before continuing.
- Prepare a conditional rollback with a deadline. Once metadata has moved in an incompatible direction, downgrading may no longer be a safe operation.

### Production pitfalls
Colocating controllers and brokers on the same machines can save resources but causes CPU/disk contention exactly when a leader is re-elected. Alerts that only watch broker up and ignore quorum health will detect the problem too late. Also make sure the backup/restore procedure understands KRaft metadata, not just copying the data directory.

> Senior tip: rehearse losing one controller and restoring in a staging environment with data close to production. The criterion is a measured recovery time for metadata operations, not just seeing the process running.`,
    follow: [
      'When the controller quorum loses its majority, what do brokers and clients see?',
      'Which rehearsal do you use to verify that KRaft metadata can be restored?'
    ]
  },
  'microservices-033': {
    q: 'The audit topic must keep history for replay, while the customer status topic only needs the latest value per key. Do you choose retention or compaction, and what do their configurations affect?',
    a: `**Summary:** Retention deletes segments by time or size, suitable for event history with a time limit. Compaction keeps the latest value per key (including tombstones for the configured period), suitable for a state changelog; it is not an instantaneous snapshot.

### Retention
Kafka writes append-only by segment. When a segment is old enough per {{retention.ms}} or exceeds the size limit per {{retention.bytes}}, the broker can delete the whole segment. A consumer offline longer than retention loses the ability to read the deleted part. Use it for telemetry, audit with a retention policy, or event replay within a defined window.

### Compaction
The cleaner scans the log and removes older records with the same key, but runs asynchronously; reading from the beginning may show multiple versions before cleanup completes. A record with a null value is a tombstone, meaning the key is deleted; the tombstone is kept only for {{delete.retention.ms}} and is then cleaned as well.

~~~text
key=c42 value=Gold   -> key=c42 value=Platinum -> compacted: Platinum
key=c77 value=Basic  -> key=c77 value=null    -> compacted: tombstone, then deleted
~~~

A topic can enable both {{cleanup.policy=compact,delete}}: compaction keeps the final state per key, retention bounds the log age/size. But time-based retention can delete data needed for a rebuild, so it must match the recovery requirement.

### Choosing and operating
- Event sourcing/audit: retention long enough, plus archive if policy requires longer.
- Changelog/cache state: compact; keys must be stable, the same logical entity always with the same key.
- Compaction does not guarantee that only one record remains immediately; a bootstrapping consumer must handle tombstones and old records safely.
- Do not use compaction as a database substitute when you need arbitrary queries, multi-record transactions or complete history.

> Senior tip: try rebuilding the state store from the topic after the cleaner has run and the tombstones have expired. If the rebuild still needs the "deleted records" to understand the business, you must store the deletion marker or the history elsewhere.`,
    follow: [
      'If a new consumer needs to restore the full history, does compaction satisfy that?',
      'What risk does a tombstone expiring before an offline consumer comes back create?'
    ]
  },
  'microservices-034': {
    q: 'A Spring Kafka listener keeps hitting the same invalid-data error. How do you configure retry, DefaultErrorHandler and DeadLetterPublishingRecoverer to prevent a poison message from blocking the partition?',
    a: `**Summary:** Classify errors first: transient errors get bounded retries and backoff; permanent errors are recovered to a DLT after being written with metadata. {{DefaultErrorHandler}} orchestrates retry/recover, {{DeadLetterPublishingRecoverer}} publishes the failed record; only acknowledge the offset after recovery succeeds.

### Processing flow
A listener throws an exception. The error handler can retry synchronously on the consumer thread with backoff. If the number of attempts is exceeded, the recoverer sends the record to the DLT; only when the DLT publish succeeds is the handler allowed to consider the input processed. If the DLT publish fails, you should not silently commit the offset, because the record would be lost from the main flow.

~~~java
var recoverer = new DeadLetterPublishingRecoverer(template);
var handler = new DefaultErrorHandler(recoverer,
    new FixedBackOff(1_000L, 3L)); // three retries after the first attempt
handler.addNotRetryableExceptions(InvalidPayloadException.class);
factory.setCommonErrorHandler(handler);
~~~

The number of attempts, backoff and exception classification must match the Spring Kafka version in use. For permanent schema/validation errors, retries only increase lag. For a transient DB timeout, a short retry helps; long, infinite retries hold the partition hostage.

### The DLT needs a contract
- Set the DLT by a consistent convention; {{DeadLetterPublishingRecoverer}} by default usually appends a suffix, but you must define the routing and partition strategy explicitly.
- Keep the original topic/partition/offset, exception class/message and timestamp in headers for replay and investigation.
- Choose a serializer that can handle corrupt payloads too; if the DLT producer cannot serialize the original record, recovery fails again.
- The DLT needs alerts, an owner and a replay process with idempotency. Do not replay automatically and continuously, creating an error loop.

### Ordering and offsets
Retry blocks the consumer thread, so later records in the same partition wait; this is a choice that preserves ordering. If you enable retry topics/asynchronous retry, throughput is better but per-key ordering can change. The ack mode and container configuration must ensure the offset only advances when the record has been processed or certainly recovered.

> Senior tip: have a dedicated dashboard for retry counts, DLT rate and the age of the oldest record. A DLT of 0 does not mean healthy if the consumer is retrying the same poison record thousands of times.`,
    follow: [
      'How do retry topics differ from blocking retry in terms of ordering and lag?',
      'How do you replay a DLT so that you do not send a payment that already succeeded again?'
    ]
  },
  'microservices-035': {
    q: 'Consumer lag keeps rising after traffic triples. How do you find the bottleneck and apply backpressure, even after increasing the number of consumers?',
    a: `**Summary:** Lag is the gap between the log end offset and the consumer offset; adding consumers only helps if there are partitions left to split and the bottleneck is in consumer processing. Measure ingress/egress rates, record latency and downstream resources; apply concurrency limits, pause/resume and load control instead of opening unlimited workers.

### Diagnosing before scaling
- If the number of consumers in the group is larger than the partitions, the extra consumers get no work. Increasing partitions can raise parallelism but affects key ordering and broker load.
- Compare producer bytes/records per second with consumer throughput; look at lag per partition to find hot keys, not just total lag.
- Check per-record processing time, batch size, poll duration, DB pool wait, downstream latency, rebalance and GC.
- Lag rising while record age is low may be a burst being caught up; rising record age is a signal that the SLA is being violated.

### Backpressure
Kafka stores a durable buffer within retention, but it is not infinite. The consumer should stop taking more when the downstream is exhausted: pause the partition/container, limit concurrency or adjust the poll batch. Keep polling periodically so heartbeat/group membership does not time out, while not committing offsets for the part not yet processed.

If the DB can only take 500 writes/s, set worker concurrency by the connection pool and DB quota. If traffic stays above capacity for long, you need to reduce the producer rate, shed noncritical work or add downstream capacity; the queue only postpones the incident and consumes disk.

~~~text
lag = log end offset - committed offset
oldest event age + per-partition lag + DB pool wait -> diagnosis
~~~

### Autoscaling and safety
Scale by lag/lag age together with throughput, but cap replicas by partition count and downstream capacity. Scaling up/down too fast triggers constant rebalances; cooldown and a min replica help. Alerting on lag age is usually closer to user impact than offset count when partition rates differ.

> Senior tip: set an SLO of "99% of events processed within 30 seconds" and alert on event age. A million lag on a slow topic can be harmless; a few thousand payment events that are 10 minutes old are not.`,
    follow: [
      'What can cause low lag but a high event age?',
      'How do you coordinate consumer autoscaling with the DB connection pool limit?'
    ]
  },
  'microservices-036': {
    q: 'Many teams read the same Avro events and need to deploy producers/consumers independently. How do you choose Schema Registry compatibility and the schema change process?',
    a: `**Summary:** Schema Registry stores schema versions and checks compatibility when a new schema is published. With consumers that may read old data, backward compatibility is usually the pragmatic choice; changes must follow the rules for defaults, nullability and an ordered consumer/producer rollout.

### Why a schema registry
The producer writes the schema ID in the wire format instead of repeating the whole schema. The consumer fetches the writer schema by ID and combines it with the reader schema to deserialize. The registry helps check that evolution is compatible, but it does not by itself guarantee that the business meaning of a field is right.

### Change rules
- Adding a field: with backward compatibility, the new reader schema needs a default to read old records that miss the field. An old reader usually skips the new field in the writer schema, but you must check according to the format and registry mode.
- Deleting/renaming a field: may need an alias or a deprecation phase; do not silently reuse a field name/meaning.
- Changing a type: only do it when schema compatibility allows and both old/new applications understand the value.
- Different compatibility modes: backward checks a new reader reading an old writer; forward checks an old reader reading a new writer; full requires both. Transitive also checks against multiple earlier versions, not just the most recent one.

### Safe rollout order
1. Add an optional/default field, publish the schema.
2. Deploy a consumer that can read both the old and new form.
3. Start the producer writing the new field.
4. Wait for the retention/replay window and verify that every consumer has been updated.
5. Only then remove the old field in the next migration version.

Do not turn on compatibility just to make the pipeline green: a schema can be syntactically compatible but still break the system by changing meaning (USD to cents). Test the contract with old/new sample payloads and verify replay from the topic.

> Senior tip: schema ownership must include a business owner, a breaking-change policy and a contact when the compatibility check fails. The registry does not replace semantic review or a consumer inventory.`,
    follow: [
      'How do backward and full transitive differ when replaying a topic with long history?',
      'If you change the unit of a field but keep the same numeric type, does the registry detect it?'
    ]
  },
  'microservices-037': {
    q: 'A bank runs Kafka, RabbitMQ and IBM MQ. How do you assign roles to the three brokers for event streaming, work queues and legacy transactions instead of forcing every workload onto one platform?',
    a: `**Summary:** Kafka suits a distributed log, fan-out to many consumers and replay; RabbitMQ suits queue/task routing with acks and flexible messaging patterns; IBM MQ is usually tied to enterprise/legacy systems that need interoperability and operations under existing contracts. Choose by semantics, SLA, skills and operational cost, not by a single benchmark.

### Comparison by workload
| Need | Kafka | RabbitMQ | IBM MQ |
|---|---|---|---|
| Replay many times, many independent consumers | Strong: retained log, independent offsets | A queue is normally consumed then acked/deleted; needs a separate topology/plug-in | Has mechanisms suited to enterprise integration but a different operating model |
| Task queue and routing | Possible but you must design it yourself | Exchange routing and competing consumers are its strength | Suited to integrating with existing MQ systems |
| Ordering | Within a partition | Per queue; concurrency/requeue can affect it | Depends on queue and consumer configuration |
| Financial legacy integration | Through a connector/API | Depends on the estate | Often already the standard connection within the organization |

### Architectural decision
- Domain events needing many subscribers and replay to rebuild projections: Kafka.
- Short jobs needing acks, retry/dead-letter routing and queue semantics: RabbitMQ.
- Mainframe/core banking already connected to IBM MQ with an SLA, audit and support contract: keep MQ at the corresponding boundary; bridge to Kafka if you need analytics/event fan-out.
- Do not use three brokers for the same flow without a reason: every bridge adds duplicates, ordering, tracing and ownership.

### Banking: control first
Define data classification, encryption, audit trail, retention, DR/RPO/RTO, replay permissions and how to handle poison messages. Do not treat the broker as the only financial ledger if the business requires reconciliation, balance computation and immutable audit; the source of truth must be defined separately.

> Senior tip: choose one default broker for new workloads; exceptions need an ADR stating the owner and the direct on-call cost. Multiple platforms may exist because of legacy, but each team should not be free to pick a fourth broker.`,
    follow: [
      'How do you design a Kafka–IBM MQ bridge so that duplicates do not create two transactions?',
      'When is Kafka replay not enough to satisfy a financial audit?'
    ]
  },
  'microservices-038': {
    q: 'An API writes an order to the database and then needs to publish a Kafka event. How do you design an outbox with Debezium so that no event is lost, ordering is kept per aggregate, and it is operable when the connector restarts?',
    a: `**Summary:** Write the business row and the outbox row in the same DB transaction; Debezium reads the transaction log and publishes through Kafka Connect. This is an atomic write at the database plus at-least-once delivery through CDC, so consumers still need idempotency and ordering must be tied to the aggregate key.

### Data flow
The application creates the order and the outbox event in one local transaction. On commit, both exist or both roll back. The Debezium connector reads the WAL/binlog from the checkpointed position, turns the outbox row into a Kafka record; the Kafka key should be the aggregate ID to preserve ordering within the partition.

~~~text
Spring transaction -> orders + outbox
                           |
                    DB WAL/binlog
                           v
              Debezium / Kafka Connect -> topic
~~~

The outbox usually has an event ID, aggregate type/ID, event type, payload, created time and schema version. Use the Debezium Outbox Event Router SMT for the pinned connector version; verify the topic/key/header mapping in an integration test.

### Restart, duplicates and ordering
The connector stores a CDC offset. After a restart it continues from the checkpoint; depending on the crash window, publishing may repeat. Consumers deduplicate by event ID or an idempotent business update. Do not delete the outbox row before CDC has certainly read it; with CDC you usually need a separate cleanup policy and suitable retention.

Per-aggregate ordering depends on transaction log order, connector routing and the same Kafka key/partition. If multiple transactions update one aggregate concurrently, database locking/versioning decides the commit order; do not create business ordering from the app's timestamp.

### Production controls
- Monitor connector task state, source lag, replication slot/binlog retention, topic publish errors and outbox growth.
- A replication slot left unused for a long time can make the WAL grow and fill the disk; set alerts and a runbook for connector outages.
- Payload schemas need versioning; the outbox should not contain unnecessary sensitive data.
- Run replay tests, duplicate tests and connector offset restoration in staging; confirm that the DB log retention covers the expected recovery time.

> Senior tip: set warning thresholds for the age of unpublished events and WAL size. "The DB commit succeeded" is only half the SLA; how quickly the outbox reaches Kafka is what consumers and customers feel.`,
    follow: [
      'What impact does a Debezium replication slot held for a long time have on PostgreSQL?',
      'How do you clean the outbox table without deleting events that have not been published?'
    ]
  }
});
