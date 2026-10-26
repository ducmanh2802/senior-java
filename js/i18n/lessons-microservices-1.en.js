/*
 * English translation of js/data/lessons-microservices.js — task T276. Format: js/core/i18n.js (content overlay).
 * ids: lesson-microservices-001 lesson-microservices-002 lesson-microservices-003 lesson-microservices-004
 */
App.i18n.content({
  'lesson-microservices-001': {
    title: 'Transactional outbox: no lost events between database and broker',
    goals: [
      'Explain dual-write and why a DB transaction does not cover Kafka',
      'Design an outbox relay that survives crashes and retries',
      'Distinguish internal atomicity from at-least-once delivery'
    ],
    body: `**Summary:** Transactional outbox writes business changes and the event to be published in the same database transaction. A relay reads the outbox and sends the event; because a crash can occur between sending and marking, the consumer must still be idempotent.

### Why dual-write is dangerous
A request often needs to update an order in the DB and publish OrderCreated to Kafka. If the DB commits first and the process dies, the order exists but there is no event. If publish happens first and the DB rolls back, the consumer receives an event for an order that was never committed. Calling two operations sequentially does not create a distributed transaction.

Outbox solves this by storing both records in the same transaction:
~~~text
BEGIN
  INSERT order(...)
  INSERT outbox(id, aggregate_id, type, payload, created_at)
COMMIT
~~~
Rollback loses both; commit lets the relay recover publishing after a failure. This is atomicity between state and the intent to publish an event, not atomicity with the broker.

### Relay and delivery guarantees
The relay can poll unsent rows and publish. Common sequence: publish succeeds, then mark sent. If the process dies between the two steps, the next run publishes again. Marking before publishing creates a window for lost messages. Therefore the design favors at-least-once and uses a stable event ID so the consumer can deduplicate.

~~~java
// Sketch: transaction only covers operations on the same database.
transaction(() -> {
    orders.insert(order);
    outbox.insert(new Event(eventId, order.id(), "OrderCreated"));
});
// Relay sends event; only marks after ACK, so it can resend on crash.
~~~

### Production integration
Outbox can be a SQL table the relay polls in limited batches, or CDC reading the transaction log. A popular CDC choice is Debezium on Kafka Connect: the connector reads the transaction log (PostgreSQL WAL, MySQL binlog) so it only sees committed rows; the SMT Outbox Event Router turns each outbox row into a message on a topic by aggregate type, using the aggregate ID as the message key. The application does not need to poll itself. Spring Cloud Stream helps connect binder and handler but does not automatically make a DB transaction with Kafka atomic. Kafka transactions only cover operations inside Kafka (produce and consumer offset commit); they do not cover a relational DB.

| Approach | Pros | Cost / notes |
|---|---|---|
| Polling | Less infra, easy to understand | Query load on DB, need row claim and backoff |
| CDC | Low latency, less polling | Operate connector, schema and log retention |

### Production pitfalls
Outbox grows continuously if sent rows are not cleaned up; cleaning too early loses replay capability. Multiple relays picking rows must use claim/lease or a CDC mechanism with checkpoints. Ordering per aggregate needs a stable partition key and sequence/version; global ordering is usually not guaranteed. Payload must be versioned, sensitive data protected, and metrics on oldest row age, lag, and retries must exist.

### Interview relevance
Describe the crash at each boundary: before commit, after commit before publish, after publish before ACK/mark. Then explain why idempotent consumers are still needed and how to replay a range of events.

> Senior tip: track p95/p99 age of unsent outbox rows and backlog count; alerting by event age often reflects user impact better than just counting rows.`,
    exercises: [
      {
        title: 'Write order and outbox atomically, relay can retry',
        prompt: `Implement {{OutboxStore}} simulating an in-memory transaction. {{create(id, failAfterOrder)}} writes order and event together: duplicate id throws {{IllegalArgumentException}}; {{failAfterOrder = true}} simulates an error after writing the order, must throw {{IllegalStateException}} and leave neither order nor event behind (no half-written data). {{relay(sender)}} feeds unsent events to sender one by one and returns the count of successfully sent events in that call; only marks as sent when sender returns {{true}}, if sender returns {{false}} the event is kept for retry (should stop at the first failing event to preserve order). Sent events must not be fed to sender again. All methods {{synchronized}} for consistent operations.`,
        hints: [
          'Stage both order and event first, check the simulated error, then write both to the map.',
          'Keep relay synchronized; for each pending event, sender false means no ACK yet.',
          'Only add event id to sent after sender succeeds; a retry may resend if a real crash happened between the two actions.'
        ],
        explain: `The exercise stages two mutations under one monitor and stages data before committing to the map. In a real DB, the transaction provides rollback; the monitor only simulates mutual exclusion within one JVM and does not replace a durable transaction.

Relay marks after sender succeeds. If sender throws, the exception propagates and sent state is unchanged. If the broker accepted but the app died before writing sent, the next run may send a duplicate; this model highlights why production needs consumer dedup by event id. The mutex here also holds the lock across the network call, which production should not do because it blocks writes; a real relay claims a batch, sends outside the transaction, then updates status/offset appropriately.

Common mistakes: mark before send causing lost events on broker error; create order then throw without rolling back leaving half state; or assume synchronized protects across multiple instances/processes.`
      }
    ],
    check: [
      {
        q: 'Relay sends successfully but process dies before writing sent. What is the possible outcome?',
        options: ['Event is definitely lost', 'Event is resent; consumer needs deduplication', 'DB automatically rolls back the committed transaction', 'Kafka deletes the event'],
        answer: 1,
        explain: `Outbox keeps the unmarked row so the relay will retry. This creates duplicates but avoids losing the event; the consumer uses a stable event id to handle idempotently.`
      },
      {
        q: 'How does Debezium (with SMT Outbox Event Router) take events from the outbox table?',
        options: ['CDC from the database transaction log', 'Scan every table every millisecond', 'Call the Spring controller directly', 'Read the producer ThreadLocal'],
        answer: 0,
        explain: `Debezium connector reads the transaction log (PostgreSQL WAL, MySQL binlog) to capture committed INSERTs into the outbox table; Outbox Event Router is just an SMT that transforms and routes that change event to a topic. Debezium does not poll tables on a schedule, does not call into the application, and does not read state from the producer JVM.`
      }
    ]
  },
  'lesson-microservices-002': {
    title: 'Idempotent consumer: fighting duplicates and stale events',
    goals: [
      'Explain at-least-once and duplicates',
      'Deduplicate using messageId in the same transaction as the side effect',
      'Skip events with an older version'
    ],
    body: `**Summary:** An idempotent consumer turns receiving the same message multiple times into a single business effect. You must store the messageId or version in the same transaction as the state update; only caching in RAM is not enough when restarting or running multiple instances.

### Why receiving duplicates is normal
The broker usually only knows whether the consumer committed the offset, not whether the DB side effect committed. If the DB commits but the process dies before committing the offset, the broker redelivers the message. This is at-least-once behavior: prefer not losing messages, accept redelivery. Network timeout also leaves the producer unsure whether the server processed it.

### Dedup and version
An inbox table has a unique key (consumer, message_id). The consumer in one DB transaction: insert inbox; if conflict, exit without side effect; if new, update projection then commit. The two operations must be atomic. With state-replacement events, store the version per aggregate and only apply versions greater than the current one; old events arriving late are skipped. With additive events (charge, increment), version cannot replace the dedup id.

~~~java
if (inbox.insertIfAbsent(message.id())) { // unique constraint is the arbiter between replicas
    if (message.version() > current.version()) apply(message);
}
~~~

### Distinguishing event and command
An event typically describes something that happened, while a command requests an action. You should not skip a command just because the payload looks the same; two valid transactions can have the same amount. The idempotency key should come from the originator and be stable across retries. With an HTTP API, store the key, request fingerprint, and result so a repeat call returns the same result.

| Mechanism | Coverage | Limit |
|---|---|---|
| In-RAM Set | Single live process | Lost on restart, not shared across replicas |
| SQL inbox unique | Multiple instances, durable | Storage growth; need evidence-based retention |
| Aggregate version | Skip stale state events | Not enough for all additive side effects |

### Tooling and production
Kafka consumer offset and DB transaction are separate systems; committing offset after DB typically creates at-least-once. Kafka transactions support consume-transform-produce inside Kafka, but do not automatically make it atomic with an external database. Spring Cloud Stream provides listener/binder and error handling, does not automatically make business side effects idempotent. Design the inbox schema with a unique constraint, metrics for duplicate rate, lag, conflict version; retention must exceed the replay/recovery window. If you delete the key too early, an old replay may re-run the side effect.

### Pitfalls
Check-then-act is not atomic: two consumers both see the key missing and both charge. Use a unique constraint and handle duplicate key. Do not use timestamp as version if clocks can drift; a monotonically increasing sequence per aggregate is better. With out-of-order delta events, you need buffer/gap handling or rebuild from source; just skipping old versions may lose a required delta.

### Interview relevance
Point out the crash point between DB commit and offset commit, then describe the unique key, transaction boundary, retention, and how to handle out-of-order events.

> Senior tip: measure duplicate rate per topic/consumer; a sudden spike often signals a rebalance, timeout, or DB latency, not necessarily a broker bug.`,
    exercises: [
      {
        title: 'Apply a message once and only accept newer versions',
        prompt: `Implement {{Projection}}. {{apply(m)}} receives {{Message(id, version, value)}}, returns {{true}} when there is a new state effect, {{false}} if the id was already processed or the version is not greater than the current version (equal also counts as stale). Dedup by id is independent of version: every received id, even stale events that are skipped, is recorded in {{seen}} ({{seenCount()}} counts all of them). Only replace {{value}} and {{version}} when applying. All operations thread-safe.`,
        hints: [
          'Check messageId first; do not use version to replace dedup.',
          'Mark the ID as seen even for a stale event so the same event is not reconsidered.',
          'Only replace value and version when the incoming version is greater than the current one.'
        ],
        explain: `The Set represents a durable inbox and synchronized makes check-then-act atomic in this simulation. In production, an in-process Set is not enough; use a unique constraint at the DB, and insert the inbox in the same transaction as the projection update. If the side effect is in another service, you need an outbox or idempotency key at the destination.

A stale event is still marked as seen so replay remains a no-op, but the state does not change. Two different events with the same version do not overwrite each other: version must represent a meaningful order, usually emitted by the aggregate. If the event is a delta rather than a snapshot, skipping a version gap may be wrong for the business.

Common mistakes: storing the ID after the side effect so a crash creates a repeated side effect; using an ID that is not stable across retries; or only checking version and missing duplicates of side effects that cannot be replaced.`
      }
    ],
    check: [
      {
        q: 'DB side effect committed but consumer has not committed offset. Most likely scenario?',
        options: ['Message may be redelivered', 'Broker knows DB committed so skips', 'DB auto-rolls back per offset', 'Message gets a new ID'],
        answer: 0,
        explain: `Offset and DB are two separate transactions; a crash in between can cause the broker to redeliver. Inbox/idempotency makes the redelivery not double the effect.`
      },
      {
        q: 'Why is a local HashSet check-then-act not enough with multiple replicas?',
        options: ['Set cannot store Strings', 'Each replica has its own state and both may process before writing', 'Kafka does not send Strings', 'Version always increases by clock'],
        answer: 1,
        explain: `Processes do not share the Set and local operations are not atomic cluster-wide. A shared unique constraint/inbox is the arbiter.`
      }
    ]
  },
  'lesson-microservices-003': {
    title: 'Saga orchestration: compensating when a multi-service flow fails',
    goals: [
      'Describe a saga as a chain of local transactions',
      'Execute compensations in reverse order when a later step fails',
      'State the limits of compensation and orchestration'
    ],
    body: `**Summary:** A saga splits a cross-service business flow into local transactions with durable outcomes. When a later step fails, the orchestrator calls compensations for the steps that already succeeded; this is a new business action, not a time-travel rollback.

### Order placement flow
Example: create order in PENDING state → authorize/charge payment → reserve inventory → confirm order. Each service commits its own DB and emits an event/response. There is no ACID transaction covering all three services. If inventory reservation fails after payment was charged, the orchestrator requests a refund then marks the order FAILED/CANCELLED.

~~~text
Order(PENDING) → Payment(authorized) → Inventory(reserved)
                                      ↘ failure
                       Payment(refunded) ← compensation
~~~

Compensation does not erase what happened: a refund can be slow, fees may not be returned, the held inventory may have already expired. Therefore intermediate states must be visible and retryable/reconcilable.

### Orchestration vs choreography
The orchestrator stores sagaId, status of each step, results, and retries; it decides the next step. Choreography lets services react to each other's events, with less central coordination but the flow becomes harder to see with many branches. For business flows with conditions and audit needs, orchestration is usually easier to control; for short flows, event choreography can reduce direct coupling.

### Execution safety
Every command carries the sagaId and an idempotency key. The orchestrator needs a durable state machine so a restart does not forget progress; timeouts must distinguish unknown outcome from certain failure. A payment timeout may have succeeded at the provider: before compensating you must query status or resend with the same key to get the old result. Compensations must also be idempotent and retryable. Use outbox/inbox to avoid losing events at the DB-broker boundary.

| Choice | Good when | Watch out for |
|---|---|---|
| Orchestration | Many steps, branches, audit | Orchestrator must be HA and durable |
| Choreography | Short flow, event reaction | Tracking dependencies and cycles is harder |

Spring Statemachine or a workflow engine like Temporal/Camunda can manage state and retries depending on architecture; Spring Cloud Stream supports event transport but does not provide saga semantics. A saga does not guarantee global isolation: you may need reservation, optimistic version, or re-checking invariants.

### Production pitfalls
Calling compensation immediately on timeout is dangerous because the original command may still be running. Design timeouts, status queries, idempotency, and reconciliation. Do not retry indefinitely without limits; store the last error, alert, and put the saga into a state requiring manual intervention. Track the longest-stuck sagas, compensation failure rate, and completion time.

### Interview relevance
Draw the state transitions, list the durable data, idempotency keys, unknown-outcome timeouts, and how to continue after a restart. Clearly state which compensations actually reverse the effect.

> Senior tip: a failed compensation is a business state needing a dashboard and runbook, not just an ERROR log.`,
    exercises: [
      {
        title: 'Refund after inventory reservation fails',
        prompt: `Implement {{OrderSaga}} with steps: place order, charge payment, reserve inventory, confirm. {{run(failPayment, failInventory)}} returns the list of operations in order, using exactly these strings:
- Success: {{order}}, {{charge}}, {{reserve}}, {{confirm}}.
- Payment fails: {{order}}, {{charge-failed}}, {{cancel}} (payment never charged so no refund, no inventory reservation).
- Inventory fails: {{order}}, {{charge}}, {{reserve-failed}}, {{refund}}, {{cancel}} (compensate in reverse: refund then cancel order, no confirm).

Each compensation runs only if the corresponding step succeeded; a failed step must not be recorded as successful.`,
        hints: [
          'Log operations in order; check payment failure before recording charge as successful.',
          'Only add refund if charge has already succeeded.',
          'On inventory failure, compensation order is refund then cancel; no confirm.'
        ],
        explain: `The exercise is a simplified state machine: each branch logs the local outcome and compensation. Step 3 fails after charge, so refund then cancel order. Payment failure means there is no charged amount to refund. A durable saga must persist the current step before/while emitting the next command so a restart can continue.

In production a refund can fail or be pending; you cannot just return CANCELLED as if the money is already back. You need a REFUND_PENDING state, bounded retries, an idempotency key, and reconciliation. If the charge request times out, you must query by key before deciding whether a refund is needed.

Common mistakes: compensating in forward order, compensating a step that never succeeded, or assuming compensation is a synchronous rollback. The orchestrator should have explicit valid transitions and store the sagaId for audit.`
      }
    ],
    check: [
      {
        q: 'In a saga, what does compensation mean?',
        options: ['ACID rollback across all services', 'A new business action that counteracts a step that already committed', 'Delete broker logs', 'Disable retries system-wide'],
        answer: 1,
        explain: `Each local transaction committed independently. Compensation is a new command/event that may fail or not fully reverse the effect.`
      },
      {
        q: 'Payment request times out and it is unknown whether the provider charged. What should you do?',
        options: ['Refund immediately without checking', 'Send a new charge with a different ID', 'Look up or retry with the same idempotency key to determine the outcome', 'Mark the saga as successful'],
        answer: 2,
        explain: `Timeout does not prove the operation failed. The same key lets the provider return the old result; querying status avoids double-charging or wrong refund.`
      }
    ]
  },
  'lesson-microservices-004': {
    title: 'Retry and dead letter queue: classify errors instead of looping forever',
    goals: [
      'Design bounded retry with backoff',
      'Distinguish transient errors from poison messages',
      'Route failing messages to a DLQ for safe replay'
    ],
    body: `**Summary:** Retry fits transient errors like timeout or throttling, but needs bounded attempts and backoff. A message that cannot be processed after the policy must be quarantined into a DLQ with metadata for investigation and controlled replay.

### Retry with a rhythm
Immediate retry creates a retry storm: many requests hitting a struggling dependency at once. Backoff increases the wait between attempts, usually with jitter so clients do not wake up in sync. Example base delays 100 ms, 200 ms, 400 ms; cap the maximum and total time. This lesson uses a fake clock so tests do not wait real time.

Transient errors: network reset, 429/503 depending on contract. Permanent errors: invalid schema, missing required field, a poison message that always throws the same exception. Retrying a permanent error only delays other messages in the partition.

### DLQ and operability
DLQ keeps the payload, message id, topic/partition/offset, attempt count, summarized exception, and timestamp. Do not put secrets/PII unnecessarily in headers or logs. DLQ needs alerting, access control, retention, tooling to view, and a process to fix/replay. Replay must preserve idempotency and avoid creating the side effect twice.

~~~java
// Pseudocode: attempt count capped, clock injectable for deterministic tests.
if (attempt < maxAttempts) schedule(message, now + backoff(attempt));
else deadLetter(message, error);
~~~

Spring Kafka has {{DefaultErrorHandler}} (retry via BackOff) combined with {{DeadLetterPublishingRecoverer}}, and retry topics via {{@RetryableTopic}}; Spring Cloud Stream has retry/DLQ mechanisms per binder and config. The Kafka broker has no built-in DLQ for consumers; the application/framework must publish to another topic. Avoid long synchronous retries on the consumer thread because it reduces throughput, holds the partition, and if the gap between two polls exceeds {{max.poll.interval.ms}} (default 300000 ms) the consumer leaves the group, triggering a rebalance.

| Policy | When to use | Risk |
|---|---|---|
| Short inline retry | Very short error, fast op | Blocks partition |
| Retry topic with delay | Need longer delay | Ordering and ops complexity |
| DLQ | Budget exhausted or permanent error | Message forgotten if no alert |

### Production pitfalls
Counting retries by call count may differ from broker delivery count; define attempt clearly. Add jitter, max delay, and total time budget. Do not retry every exception; validation errors go to DLQ early. Record metrics on age, depth, retry count, DLQ rate; avoid logging full payload. If a side effect commits before the error response, retry needs idempotency.

### Interview relevance
State which errors to retry, max attempts, backoff, total timeout, DLQ ownership, replay, and how to preserve throughput/ordering.

> Senior tip: set the retry time budget smaller than the business SLA; if a message arrives after the deadline, a successful retry may still cause harm.`,
    exercises: [
      {
        title: 'Retry with a fake clock then move poison messages to DLQ',
        prompt: `Implement {{RetryQueue}}: each message is processed at most {{maxAttempts}} times. {{runOne(now, processor)}} only considers the message at the head of the queue: if the queue is empty or {{now < dueAt}} it does nothing and returns {{false}}; if due, it removes the message, runs the processor, and returns {{true}}. On success the message leaves the queue. Processor returns {{false}} (error) then increments {{attempts}}: if {{attempts}} equals {{maxAttempts}} move the Job (keeping its attempts) to DLQ; otherwise re-queue with {{dueAt = now + baseDelay * 2^(attempts-1)}}.`,
        hints: [
          'If not yet dueAt, do not remove the message from the queue.',
          'Each processor false increments attempts; new dueAt is now plus delay.',
          'After the maxAttempts-th attempt, move to dead, do not keep in ready.'
        ],
        explain: `The clock is passed into runOne so tests do not sleep. The delay schedule in the test: first failure schedules at now+baseDelay; second failure schedules at now+2×baseDelay. After maxAttempts the message leaves ready and goes to DLQ. Production needs a cap on the exponent to avoid overflow, add jitter, persist state, and distinguish transient from permanent exceptions.

The Predicate false simulates an error. In a real system the processor usually throws; the error handler classifies the exception, metrics and context are recorded with the message. Retrying after a side effect already committed can repeat the effect, so retry must go with idempotency. This simple queue also does not handle fairness or multi-partition ordering.

Common mistakes: retry without delay, off-by-one on attempts, poison message stuck at head of queue, or moving to DLQ without alert/owner.`
      }
    ],
    check: [
      {
        q: 'A payload with invalid schema will fail on every attempt. Appropriate handling?',
        options: ['Retry indefinitely', 'Retry fast without limit', 'Route to DLQ early via permanent-error policy', 'Increase timeout indefinitely'],
        answer: 2,
        explain: `A poison message will not fix itself; retry only blocks progress. Quarantine with metadata for investigation and replay after fix.`
      },
      {
        q: 'What is the purpose of jitter in exponential backoff?',
        options: ['Encrypt the payload', 'Prevent many clients from retrying in sync, creating a thundering herd', 'Guarantee exactly-once', 'Maintain global ordering'],
        answer: 1,
        explain: `Jitter spreads out retry times, reducing the thundering herd when the dependency just recovered.`
      }
    ]
  }
});