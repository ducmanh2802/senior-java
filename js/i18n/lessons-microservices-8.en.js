/*
 * English translation of lessons-microservices 009-010 (task T1019).
 * Format: js/core/i18n.js content overlay.
 */
App.i18n.content({
  'lesson-microservices-009': {
    title: 'Timeout budget and deadline propagation: do not let a call chain kill itself',
    goals: [
      'Explain why a service timeout must be smaller than the remaining time its caller granted',
      'Calculate load amplification when multiple layers retry (retry storm) and name 4 ways to stop it',
      'Compute remaining timeout per hop with a fake clock and decide whether there is enough time to retry',
    ],
    body: `**Summary:** A request crossing multiple services has only a TOTAL allowed time (timeout budget) - usually the client SLA. Each hop must take the remaining time to configure the next hop timeout (deadline propagation), not set an independent fixed timeout; and before retrying it must check that the remaining time is enough for one more call, otherwise it contributes to a retry storm.

### Three terms to define first
- **timeout**: the maximum milliseconds you will wait for ONE call (for example 800ms).
- **deadline (or budget)**: the ABSOLUTE TIME POINT by which the request must finish (for example 12:00:03.420). The deadline does not change across hops; only the remaining time shrinks.
- **SLA**: the response-time commitment to users (for example "99% of requests under 3 seconds") - the source of the budget number.
Everyday example: a plane takes off at 15:00 (deadline), not "wait 2 more hours" (timeout) - every part calculates backward from 15:00, nobody sets their own clock.

### Why letting every place set its own timeout is a disaster
A common bad convention: every service sets downstream call timeout = 5 seconds. Chain user -> gateway -> order -> payment -> bank, payment hangs. Picture it:
~~~text
Gateway:   |========== 5s ==========|  -> gives up, reports error to user
Order:     |=========== 5s ===========|  -> gives up, retries payment
Payment:   |============ 5s =============|  -> still waiting for bank!
Bank:      |============= 5s ===============|  -> finishes, nobody receives it
~~~
Three consequences: (1) the user receives an error at second 5 but the system burns resources (threads, DB connections) until second 15 for a request nobody is waiting for - under high load this "orphan work" clogs pools and collapses the chain (cascading failure: one slow service drags the whole cluster down); (2) the caller has given up while the callee is still working -> if the operation writes (charges money) then system state diverges from what the user sees; (3) nobody knows where the real error is when every layer reports "timeout".
Therefore the fundamental rule: **the timeout you set for yourself must be SMALLER than the remaining time the caller granted**, so the caller still has time to read your error and handle it (fallback, return 504 with a reason). Conversely, a hop within the same service must have a timeout smaller than the running deadline.

### Deadline propagation: pass remaining time, do not pass timeout
Instead of each hop setting a fixed timeout, the caller sends "you only have X ms left" to the callee. HTTP has no standard, people set a custom header ({{X-Deadline-Ms}} or an absolute epoch-ms point); gRPC has the grpc-timeout header built in and every interceptor honors it - so a gRPC chain that slows down cuts off at the right place.
~~~seq
title: Deadline propagation: each hop gets less time
actors: User | Gateway | Order | Payment | Bank
User -> Gateway: POST /orders (deadline +3000ms)
Gateway -> Order: create (deadline 2600ms left)
Order -> Payment: authorize (deadline 1900ms left)
Payment -> Bank: charge (deadline 1200ms left)
Bank --> Payment: OK
Payment --> Order: OK (700ms left to respond)
Order --> Gateway: 201 Created
Gateway --> User: 201 Created
note Gateway: each hop subtracts its own time before passing the deadline
~~~
Concrete arithmetic, and also the configuration rule:
~~~text
Client provides 3000ms total
Gateway:      keeps 400ms for its own work -> grants Order      2600ms
Order:        keeps 700ms (DB, aggregation) -> grants Payment   1900ms
Payment:      caps Bank hop at 1200ms, keeps the remaining 700ms to write result + respond
~~~
Caller-side code (RestTemplate/Feign interceptor style):
~~~java
// Next-hop timeout = min(own cap, remaining budget - reserve for own work)
long remaining = budget.remainingMillis();          // read from X-Deadline header
long hopTimeout = Math.min(1200, remaining - 300);  // cap 1.2s, keep 300ms reserve
if (hopTimeout <= 0) {
    return failFast("deadline exhausted");          // out of time: calling cannot finish in time, stop
}
requestConfig.setResponseTimeout(Duration.ofMillis(hopTimeout));
~~~

### Retry storm: load multiplication nobody planned
One service timing out and retrying 3 times is normal. Three NESTED layers, 3 times each, is a disaster: if gateway, order, and payment all retry when the layer below is slow, one user request becomes up to 3x3x3 = 27 requests to payment - exactly when payment is slowest. That is a retry storm: exponentially amplified load, turning one slow dependency into a cluster collapse. Four layers of defense:
1. **Retry at only ONE layer** closest to the transient failure (usually the direct caller), upper layers fail fast.
2. **Retry with a budget**: for example at most 10% of total requests may be retries (Envoy and Resilience4j both have retry budgets).
3. **Backoff + jitter**: backoff means increasing wait time between attempts (100ms, 200ms, 400ms); jitter means adding random noise so thousands of clients do not retry at the same instant.
4. **Circuit breaker** (automatic cutoff: after N consecutive errors, stop calling for a period): blocks useless retry traffic, and only retry requests that still have ENOUGH deadline - back to the next section.

### When you must NOT retry anymore
Retry only makes sense if the new attempt can still finish BEFORE the deadline. Formula: {{canRetry = remaining >= backoffMillis + timeoutOfNextAttempt}}. With 250ms left and the next hop needs 1200ms, that retry will certainly die on the way - sending it only adds load. Dying early (fail fast) at the edge is the RIGHT behavior: the user sees an error within the 3 seconds promised, and the system stops burning resources on ghost requests.

### Common mistakes
- Setting an inner-layer timeout LARGER than the outer layer: the outer layer gives up first, the inner layer does wasted work.
- Forgetting to subtract your own work: granting the full budget to downstream leaves no ms to write results or respond to the caller.
- Passing TIMEOUT (relative ms) instead of DEADLINE (absolute point): each hop recalculates from scratch and total time inflates.
- Every layer retries -> storm when one dependency slows (brownout: gradually slowing rather than dead).
- Not canceling work in progress when the deadline passes - just stopping waiting is not enough.

### Interview notes
Draw a 4-hop chain with a 3000ms budget and show the per-hop timeout formula; explain why a deadline (absolute point) must be propagated rather than a timeout; list retry storm + 4 mitigations (single-layer retry, retry budget, backoff + jitter, circuit breaker); conclude with "failing fast when there is not enough time is a feature, not a bug".

> Senior tip: set timeouts from data, not gut feeling: measure the real downstream p99 and choose timeout = p99 + a margin (a common formula is p99 x2 or p99 + 100ms); a timeout too tight creates errors on slow-but-ok traffic, too wide holds resources. Monitor separately "requests cut by deadline" and "retry rate / request rate" - when those two lines rise together, it is the dawn of a storm incident.`,
    exercises: [{
      title: 'Budget: compute remaining time per hop with a fake clock',
      prompt: `Implement {{Budget}} - a remaining-time calculator for a call chain, using an injected fake clock so tests can step time freely (no sleep, no real clock).

- {{Budget(long totalMillis, LongSupplier clock)}}: deadline = the clock's current time + totalMillis; throw {{IllegalArgumentException}} if totalMillis is not positive.
- {{static Budget withDeadline(long deadlineMillis, LongSupplier clock)}}: create from an absolute deadline passed down by a caller via header (like X-Deadline) - a service in the middle of the chain continues the caller's deadline, it does not reset from zero.
- {{long deadlineAt()}}: the stored absolute deadline.
- {{long remaining()}}: time remaining, never negative.
- {{boolean expired()}}: the clock has reached or passed the deadline.
- {{long timeoutForCall(long capMillis, long reserveMillis)}}: timeout for the next downstream call = {{min(capMillis, remaining - reserveMillis)}}; if the result is not positive return {{0}} - the caller must fail fast, do not call downstream. Validate {{capMillis > 0}}, {{reserveMillis >= 0}} (otherwise throw IllegalArgumentException).
- {{boolean canRetry(long retryTimeoutMillis, long backoffMillis)}}: allow one more attempt only when the remaining time is enough to wait for backoff and then run a full {{retryTimeoutMillis}} attempt; validate {{retryTimeoutMillis > 0}}, {{backoffMillis >= 0}}.`,
      hints: [
        'You only need to store two things: the absolute deadline (long) and the clock. Every other method is deadline minus the clock current time.',
        'Use {{Math.max(0, deadline - now)}} so {{remaining()}} never goes negative when the clock passes the deadline.',
        'In {{timeoutForCall}}, compute {{deadline - now - reserve}} then {{Math.min}} with cap; if the available portion is not positive return 0, not a negative number.',
        'For the public constructor taking totalMillis: compute the deadline first in a static helper, then call through a private helper constructor with an extra (boolean) parameter so the two constructors do not collide in signature.',
      ],
      explain: `Budget is the arithmetic of deadline propagation: a request is born with an absolute deadline (a clock point, not a relative ms count), and every decision after that derives from {{deadline - now}}. {{timeoutForCall(cap, reserve)}} embodies two rules from the lesson: the next hop timeout never exceeds that hop's own cap, and it always subtracts {{reserve}} so the service still has ms to write results, respond to the caller, or run compensation. Returning {{0}} means "fail fast": do not issue a call you know cannot survive.

{{canRetry(timeout, backoff)}}, not retry state, is the retry-storm gate: if {{remaining < backoff + timeout}} then the new attempt will certainly die after the caller has given up, issuing it only multiplies load on an already slow system. The retry loop in test 8 stops exactly when remaining 100ms < backoff 400 + timeout 200 - the request will fail fast at the edge within SLA instead of becoming the number 27 at the last layer.

{{withDeadline}} reproduces a hop in the middle of the chain: service B receives A's deadline and continues that same point - it does NOT get to add 1000ms on its own. This is where passing a deadline (absolute point) differs from passing a timeout (relative number): passing a timeout inflates the deadline at every hop. In production there is a missing half not modeled here: when the deadline passes while work is in progress, the service must cancel (interrupt, close connection, statement timeout) - only stopping the wait while letting the worker keep burning the DB is the exact recipe for orphan work.

Implementation traps: forgetting to clamp {{remaining}} to 0 (tests 1, 5 turn red), comparing {{remaining >= timeout}} but forgetting backoff (tests 5, 8 turn red), returning a negative timeout when reserve consumes the budget (test 4), and using {{System.currentTimeMillis}} instead of the injected clock (passes by luck but is not deterministically testable).`,
    }],
    check: [
      { q: 'Gateway gives order-service a 1000ms deadline. Order has used 650ms, needs to call payment with cap 500ms and wants to keep 100ms for its own work. What timeout should be set for payment?', options: ['500 ms - the configured cap of payment', '350 ms - order remaining time', '250 ms - remaining minus reserve', '1000 ms - the original deadline from gateway'], answer: 2, explain: '350ms remain, minus 100ms reserve leaves only 250ms available; cap 500ms is not reached so it does not cut further. Setting 350ms (no reserve) means payment may finish exactly when order has no ms left to write the result; setting the cap or the original deadline both violate the caller budget.' },
      { q: 'Three layers A->B->C, each layer does 3 attempts (1 initial + 2 retries). C is slow. What is the maximum number of requests that can hit C for ONE user request?', options: ['3 requests', '9 requests', '18 requests', '27 requests'], answer: 3, explain: 'A tries 3 times; for each of those B also tries 3 times; for each of B attempts, C receives 3 more from B -> 3x3x3 = 27. That is why retries must be concentrated at ONE layer, with a retry budget and only when there is enough deadline.' },
      { q: 'Why should an absolute deadline (a time point) be passed in a header rather than a relative timeout?', options: ['Because the header is shorter', 'Because passing a relative ms count makes each hop recalculate from scratch, inflating total chain time; a deadline does not change so remaining time is always correct', 'Because a deadline is faster than a timeout', 'Because HTTP does not support timeout'], answer: 1, explain: 'Timeout is a relative quantity, adding it up across hops is wrong; a deadline is an absolute point, every hop derives its own remaining time as deadline - now. gRPC does exactly this with grpc-timeout.' },
      { q: 'Payment times out (provider does not respond in time). Which statement is CORRECT?', options: ['Timeout proves the charge did not run, refunding immediately is safe', 'Timeout cannot tell whether it did not run or already finished; you must verify via idempotency key or status query before concluding', 'Timeout is a slow signal, just retry 3 times immediately', 'Timeout only matters when the timeout is longer than the total deadline'], answer: 1, explain: 'All three scenarios (not run / running / finished but response lost) produce the same timeout. Only an idempotency key or a status query can distinguish them; that is also why deadline propagation and canRetry must go together, to avoid blind retries into the unknown.' },
    ],
  },

  'lesson-microservices-010': {
    title: 'Simulating Kafka: the partition log, offsets, and commit strategies',
    goals: [
      'Explain the partition log and offset in a consumer group',
      'Distinguish committing offset before vs after processing, leading to message loss or duplication',
      'Simulate assign/poll/commit yourself to observe at-least-once and at-most-once',
    ],
    body: `**Summary:** Kafka (a distributed event queue where producers send records and consumers read them back as a stream) stores messages in a partition log (an append-only journal) by offset (a sequential numeric position 0,1,2...). A consumer group (a set of consumers sharing a group name to split reading work) assigns partitions to consumers; a consumer polls (pulls a batch of records) and commits (records the position it has read). Committing before processing (at-most-once) can lose messages on a crash after commit; committing after processing (at-least-once) can duplicate messages on a crash before commit. This lesson simulates a simplified mechanism to make the trade-off visible.

### The real mechanism (Kafka) - understand before simulating
A topic (the name of a data stream) is split into multiple partitions. Each partition is an append-only log over time: the broker (a Kafka server that stores data) assigns an increasing offset to each record. Kafka guarantees that each partition in a group is assigned to at most 1 consumer at a time (to preserve order within the partition).

~~~seq
title: Basic read flow (simplified)
actors: Producer | Broker/Partition | Consumer | OffsetStore
Producer -> Broker/Partition: append(record) -> offset=5
Consumer -> Broker/Partition: poll(from offset=3)
Broker/Partition --> Consumer: records [3,4,5]
Consumer -> Consumer: process business logic
Consumer -> OffsetStore: commit(offset=6) (next read position)
~~~

Real configuration names (Kafka Java client, {{KafkaConsumer}} class):
- {{enable.auto.commit}}: automatically commits on an interval (default true, {{auto.commit.interval.ms}}). Convenient but can commit a position whose records are not fully processed.
- Manual commit: {{consumer.commitSync()}} / {{commitAsync()}} after processing is done -> toward at-least-once.
- {{auto.offset.reset}} ({{earliest}}/{{latest}}): chooses the position when the group has no committed offset.
- Rebalance (reassignment of partitions when a consumer joins/leaves the group): assigned by a {{PartitionAssignor}}. {{RangeAssignor}} assigns contiguous partitions **per topic** to consumers (can skew load with multiple topics). {{RoundRobinAssignor}} rotates **all partitions of all topics** across consumers (more balanced). {{CooperativeStickyAssignor}} reduces disruption by revoking/assigning incrementally. On partition revoke, {{ConsumerRebalanceListener.onPartitionsRevoked}} should commit processed offsets.

The task mentions "partition assignment (range vs round-robin)": the key idea is Range splits contiguously per topic, Round-robin distributes in rotation. (The exercise simulation does not implement rebalance/assignor, it focuses on offset+commit; this is a simplification.)

### Why commit strategy determines loss or duplication
| Strategy | When to commit | Where crash happens | Consequence |
|---|---|---|---|
| At-most-once | Before processing | After commit, before processing done | Message lost (offset advanced, message skipped) |
| At-least-once | After processing | After processing, before commit | Message duplicated (offset not advanced, polled again) |
| Exactly-once (Kafka scope) | Transaction / EOS | Varies | Needs {{transactional.id}}, {{isolation.level=read_committed}}; does not automatically cover external DB |

The Kafka broker only knows the committed offset, not whether business logic finished. Therefore at-least-once is safer against data loss, and the consumer must be idempotent (processing duplicates does not cause side effects twice, e.g. dedup by key/version).

### Simplified simulation (pure Java)
{{MiniKafka}} runs in one JVM: a partition is a {{List<String>}} indexed by offset; each group has a committed offset and a read position. No network, no real rebalance, no concurrent consumers, no retention/compaction, no time-based auto-commit simulation. A "crash" is simulated by {{resetToCommitted}} (restart and read from the committed offset).

~~~java
// At-least-once: commit ONLY after successful processing
List<String> batch = k.poll("g", "orders", 0, 10);
for (String m : batch) { handle(m); }     // crash here -> not yet committed
k.commit("g", "orders", 0, k.position("g","orders",0));
// handle writes DB + crash before commit -> polled again -> duplicate (needs idempotency)
~~~

### Common mistakes
- Enabling {{enable.auto.commit}} while processing takes longer than {{auto.commit.interval.ms}}: the background commit can advance offsets of a batch not fully processed.
- Committing offset per record instead of per batch: slow; or committing a batch offset but processing out of order relative to the commit.
- Not handling rebalance: missing the chance to commit processed offsets before a partition is revoked.
- Thinking "Kafka exactly-once" is free: EOS only covers produce/consume inside Kafka; writing to an external DB/JDBC still needs idempotency/outbox.

### Interview notes
State clearly: partition log + offset, group assignment (range/round-robin), the two commit directions and crash consequences, why choose at-least-once + idempotent consumer. Mention {{enable.auto.commit}}, {{commitSync}}, {{ConsumerRebalanceListener}}, and EOS limits.

> Senior tip: monitor {{consumer lag}} (latest offset minus committed offset) per partition; a sudden lag spike usually means slow processing, rebalance, or a poison message blocking one partition.`,
    exercises: [{
      title: 'MiniKafka: poll/commit and loss-duplication by strategy',
      prompt: `Implement {{MiniKafka}} simulating a partition log. {{append(topic, partition, message)}} adds a message to the end of the partition and returns the offset (starting at 0). {{poll(group, topic, partition, max)}} returns at most {{max}} messages from the group's current position on that partition (if no position exists, use the committed offset, default 0) and **advances the group's position** by the number of messages returned (simulating read). {{commit(group, topic, partition, offset)}} sets the group's committed offset. {{position(group, topic, partition)}} returns the current read position; {{committed(group, topic, partition)}} returns the committed offset. {{resetToCommitted(group, topic, partition)}} sets position = committed (simulating a consumer restart after crash). Tests verify: commit before processing then reset -> messages are skipped (loss); processed but not committed then reset -> messages are read again (duplication). All methods are {{synchronized}}.`,
      hints: [
        'append takes size before add as the offset. poll reads from pos (or committed if pos is missing), copies subList, then sets pos = the position after the returned portion.',
        'resetToCommitted sets pos = commits.getOrDefault(key,0) to simulate a restart reading again from the committed offset.',
        'Groups/partitions are independent via a composite key; committed defaults to 0.',
      ],
      explain: `The simulation separates {{position}} (the in-memory read position) and {{committed}} (the durable position the group acknowledged). Committing before processing advances committed immediately: reset simulating a crash after that makes position return to the already-advanced committed -> the unprocessed batch is skipped (loss). Committing after processing keeps committed at the old value: reset after crash makes poll return the batch again -> duplication. This is exactly at-most-once vs at-least-once.

In real Kafka, committed offsets are stored in the internal {{__consumer_offsets}} topic. {{poll()}} returns {{ConsumerRecords}}; {{commitSync}} usually commits offset = lastProcessed + 1. Rebalance can revoke partitions so processed offsets must be committed. The simulation omits network, serialization, multiple consumers, real rebalance, retention, and does not simulate time-based {{enable.auto.commit}}.

Common mistakes: confusing "polled" with "processed"; committing the offset of an unprocessed record; using auto-commit with a slow handler; not making the consumer idempotent when choosing at-least-once.`,
    }],
    check: [
      { q: 'Offset is committed before business processing finishes, then the process crashes. What is the typical consequence?', options: ['The message is processed again (duplicate)', 'The message is skipped because the offset already advanced (loss)', 'The broker rolls back the offset', 'The consumer group is deleted'], answer: 1, explain: 'A committed offset is considered read; after restart the consumer continues from the new offset so the unprocessed batch is skipped. This is at-most-once.' },
      { q: 'Why does at-least-once usually go with an idempotent consumer?', options: ['To increase throughput', 'Because a crash before commit can cause the same message to be polled and processed again', 'Because Kafka deletes messages after poll', 'Because offsets always decrease'], answer: 1, explain: 'Committing after processing is safer against data loss but creates a duplication window on a crash before commit; idempotency (dedup by key/version) makes reprocessing cause no side effects twice.' },
      { q: 'What does Kafka exactly-once (EOS/transaction) guarantee?', options: ['Every external DB is automatically exactly-once too', 'Produce/consume scope inside Kafka under transaction configuration; external DBs still need their own mechanism', 'No idempotent consumer is ever needed', 'Rebalance is disabled'], answer: 1, explain: 'Transactional producer and read_committed help consistency inside Kafka; writes to external DB/JDBC or HTTP calls outside Kafka are not in the Kafka transaction so they still need outbox/idempotency key.' },
    ],
  },
});
