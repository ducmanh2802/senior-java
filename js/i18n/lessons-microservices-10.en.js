/*
 * English translation of js/data/lessons-microservices.js — task T1053. Format: js/core/i18n.js (content overlay).
 * ids: lesson-microservices-009 lesson-microservices-010
 */
App.i18n.content({
  'lesson-microservices-009': {
    title: 'Timeout budget and deadline propagation: do not let the call chain kill itself',
    goals: ['Explain why a service timeout must be smaller than the time the caller has left', 'Compute the load multiplication when several layers retry at once (retry storm) and list 4 ways to stop it', 'Compute the remaining timeout per hop with a fake clock and decide whether there is still time to retry'],
    body: `**Summary:** A request passing through several services only has a TOTAL allowed time (timeout budget) — usually the client SLA. Each hop must take the remaining time to configure the timeout for the next hop (deadline propagation), not set an independent hard timeout; and before retrying it must check that the remaining time is enough for a new attempt, otherwise it only fuels a retry storm.

### Three terms to define first
- **timeout**: the maximum number of milliseconds you will wait for ONE call (e.g. 800ms).
- **deadline (or budget)**: the ABSOLUTE point in time by which the request must finish (e.g. 12:00:03.420). The deadline does not change as the request travels through hops, only the remaining time keeps shrinking.
- **SLA**: the commitment on response time to the user (e.g. "99% of requests under 3 seconds") — the source of the budget number.
Everyday analogy: a plane takes off at 15:00 (deadline), not "in 2 more hours" (timeout) — every part counts backwards from 15:00, no one sets their own clock.

### Why having each place set its own timeout is disastrous
The common bad convention: every service sets its downstream call timeout to 5 seconds. Chain user → gateway → order → payment → bank, payment hangs. Picture:
~~~text
Gateway:   |========== 5s ==========|  → gives up, reports error to user
Order:     |=========== 5s ===========|  → gives up, calls payment again
Payment:   |============ 5s =============|  → still waiting for the bank!
Bank:      |============= 5s ===============|  → finishes, but no one receives it
~~~
Three consequences: (1) the user gets an error at second 5 but the system burns resources (threads, DB connections) until second 15 for a request no one is waiting for — under high load exactly this mass of "orphan work" clogs the pool and cascades into a chain failure (cascading failure: one slow service drags the whole cluster down); (2) the caller has already given up while the callee is still working → if the action is a write (charging money) the system state drifts from what the user saw; (3) no one knows where the real error is when every layer reports "timeout".
Hence the foundational rule: **the timeout you set for yourself must be SMALLER than the time the caller has left**, so the caller still has time to read your error and handle it (fallback, return 504 with a reason). Likewise, a hop inside the same service must have a timeout smaller than the running deadline.

### Deadline propagation: pass the remaining time, not the timeout
Instead of each hop setting a hard timeout itself, the caller sends "you only have X ms left" to the callee. HTTP has no standard for this, people invent their own header ({{X-Deadline-Ms}} or an absolute epoch-ms instant); gRPC has the grpc-timeout header built in and every interceptor honors it — so a gRPC chain that slows down cuts itself at the right place automatically.
~~~seq
title: Deadline propagation: each hop gets less time than the previous
actors: User | Gateway | Order | Payment | Bank
User -> Gateway: POST /orders (deadline +3000ms)
Gateway -> Order: create (deadline left 2600ms)
Order -> Payment: authorize (deadline left 1900ms)
Payment -> Bank: charge (deadline left 1200ms)
Bank --> Payment: OK
Payment --> Order: OK (700ms left, no error)
Order --> Gateway: 201 Created
Gateway --> User: 201 Created
note Gateway: each hop trims its own time before propagating the deadline
~~~
Concrete arithmetic, and also the implementation rule:
~~~text
Client gives 3000ms total
Gateway:    keeps 400ms for itself → hands Order      2600ms
Order:      keeps 700ms (DB, aggregation) → hands Payment 1900ms
Payment:    caps the Bank hop at 1200ms, keeps the remaining 700ms to write the result + reply
~~~
Code on the calling side (RestTemplate/Feign interceptor style):
~~~java
// Timeout for the next hop = min(my cap, remaining budget - reserve for my own work)
long remaining = budget.remainingMillis();          // read from X-Deadline header
long hopTimeout = Math.min(1200, remaining - 300);  // cap 1.2s, keep 300ms reserve
if (hopTimeout <= 0) {
    return failFast("deadline exhausted");          // out of time: calling further cannot finish in time, stop
}
requestConfig.setResponseTimeout(Duration.ofMillis(hopTimeout));
~~~

### Retry storm: load multiplication nobody intended
One service timing out and retrying 3 times is normal. Three layers STACKED, each 3 times, is a disaster: if gateway, order and payment all retry when the layer below is slow, a single user request becomes up to 3x3x3 = 27 requests to payment — exactly when payment is at its slowest. That is a retry storm: load multiplies exponentially and turns a slow dependency into a full cluster outage. Four blocking layers:
1. **Retry in only ONE layer**, the one closest to the failing component (usually the direct caller); the layers above fail fast.
2. **Retry budget**: e.g. at most 10% of total requests may be retries (both Envoy and Resilience4j support a retry budget).
3. **Backoff + jitter**: backoff is increasing the wait between attempts (100ms, 200ms, 400ms); jitter adds random noise so thousands of clients do not retry at the exact same instant.
4. **Circuit breaker** (automatic breaker: after N consecutive failures, pause calls for a while): blocks pointless retries, and only retries requests that still have ENOUGH deadline — see the next section.

### When you must NOT retry anymore
A retry only makes sense if the new attempt can still finish BEFORE the deadline. Formula: {{canRetry = remaining >= backoffMillis + timeoutOfNextAttempt}}. With 250ms left while the next hop needs 1200ms, that retry is guaranteed to die on the way — sending it only adds load. Failing early (fail fast) at the edge is the CORRECT behavior: the user sees an error within 3 seconds as promised, and the system stops burning resources on ghost requests.

### Common mistakes
- Setting the inner-layer timeout LARGER than the outer layer: the outer gives up first, the inner works for nothing.
- Forgetting to subtract your own work: handing the whole budget to downstream leaves no ms to write the result or reply to the caller.
- Passing TIMEOUT (relative ms) instead of DEADLINE (absolute instant): each hop recomputes from scratch so total time balloons.
- Every layer retrying at once → storm when a dependency slows (brownout: it slows down without fully dying).
- Not cancelling work still running when the deadline passes — stopping the wait is not enough.

### Interview notes
Draw a 4-hop chain with a 3000ms budget, point out the formula for splitting the timeout per hop; explain why the deadline (absolute instant) must be propagated, not the timeout; list the retry storm + 4 blockers (single retry layer, retry budget, backoff + jitter, circuit breaker); close with "failing fast when there is not enough time left is a feature, not a bug".

> Senior tip: set timeouts from data, not gut feeling: measure the real downstream p99 then choose timeout = p99 + a margin (common formula: p99 x2 or p99 + 100ms); too tight a timeout generates errors on slow-but-ok traffic, too loose holds resources. Monitor separately "requests cut by deadline" and "retry rate / request rate" — when both curves rise together, that is the dawn of a storm incident.
`,
    exercises: [{
      title: 'Budget: compute remaining time per hop with a fake clock',
      prompt: `Implement {{Budget}} — a calculator for the remaining time of a call chain, using a clock passed in so time can be stepped freely in tests (no sleep, no reading the real clock).

- {{Budget(long totalMillis, LongSupplier clock)}}: deadline = current clock time + totalMillis; throws {{IllegalArgumentException}} if totalMillis is not positive.
- {{static Budget withDeadline(long deadlineMillis, LongSupplier clock)}}: create from an absolute deadline passed down from the caller through a header (like X-Deadline) — a middle service continues the caller's deadline, it does not reset from scratch.
- {{long deadlineAt()}}: the stored absolute deadline.
- {{long remaining()}}: remaining time, never negative.
- {{boolean expired()}}: the clock has reached or passed the deadline.
- {{long timeoutForCall(long capMillis, long reserveMillis)}}: timeout for the next downstream call = {{min(capMillis, remaining - reserveMillis)}}; if the result is not positive return {{0}} — the caller must fail fast, not call downstream. Validate {{capMillis > 0}}, {{reserveMillis >= 0}} (otherwise throw IllegalArgumentException).
- {{boolean canRetry(long retryTimeoutMillis, long backoffMillis)}}: allow one more attempt only when the remaining time is enough to wait the backoff and then run a full {{retryTimeoutMillis}} attempt; validate {{retryTimeoutMillis > 0}}, {{backoffMillis >= 0}}.
`,
      hints: [
        'You only need to store two things: the absolute deadline (long) and the clock. Every other method is deadline minus the clock\'s current time.',
        'Use {{Math.max(0, deadline - now)}} so {{remaining()}} is never negative once the clock has passed the deadline.',
        'In {{timeoutForCall}}, take {{deadline - now - reserve}} first, then {{Math.min}} with the cap; if the available amount is not positive return 0, not a negative number.',
        'For the public constructor taking totalMillis: compute the deadline first in a static helper, then delegate to a private constructor with an extra boolean parameter so the two constructors do not have identical signatures.',
      ],
      explain: `Budget is the arithmetic of deadline propagation: one request is born with an absolute deadline (a clock instant, not a relative number of ms), and every later decision derives from {{deadline - now}}. {{timeoutForCall(cap, reserve)}} embodies the two rules in the lesson: the next hop's timeout never exceeds that hop's own cap, and it always subtracts {{reserve}} so the service still has ms to write the result, reply to the caller, run compensation. Returning {{0}} means "fail fast": do not issue a call you already know cannot finish in time.

{{canRetry(timeout, backoff)}}, not the retry state itself, is the guard against retry storm: if {{remaining < backoff + timeout}}, the new attempt is guaranteed to die after the caller has given up, and sending it only multiplies load on a system that is already slow. The retry loop in test 8 stops exactly when remaining is 100ms < backoff 400 + timeout 200 — the request fails fast at the edge within the SLA instead of becoming the number 27 at the last layer.

{{withDeadline}} reproduces the middle hop: service B receives A's deadline and continues from that exact instant — it has NO right to add another 1000ms. This is where propagating a deadline (absolute instant) differs from propagating a timeout (relative number): propagating a timeout makes the deadline balloon through every hop. In production there is half a job not simulated here: when the deadline passes while work is still running, the service must cancel it (interrupt, close the connection, statement timeout) — just stopping the wait while the worker keeps burning DB is the very definition of orphan work.

Common pitfalls when implementing: forgetting to clamp {{remaining}} to 0 (tests 1, 5 go red), comparing {{remaining >= timeout}} and forgetting the backoff (tests 5, 8 go red), returning a negative timeout when the reserve eats the whole budget (test 4), and using {{System.currentTimeMillis}} instead of the supplied clock (passes the suite but is not deterministic).
`,
    }],
    check: [
      { q: 'The gateway gives order-service a 1000ms deadline. Order has used 650ms, needs to call payment with a cap of 500ms, and wants to keep 100ms for itself. What timeout should be set for payment?', options: ['500 ms — payment\'s configured cap', '350 ms — order\'s remaining time', '250 ms — remaining minus reserve', '1000 ms — the original gateway deadline'], answer: 2, explain: '350ms remain, minus 100ms reserve leaves only 250ms available; the 500ms cap does not cut further. Setting 350ms (no reserve) means payment could finish exactly when order has no ms left to write the result; setting the cap or the original deadline both violate the caller\'s budget.' },
      { q: 'Three layers A→B→C, each with 3 attempts (1 initial + 2 retries). C is slow. What is the maximum number of requests that can hit C for ONE user request?', options: ['3 requests', '9 requests', '18 requests', '27 requests'], answer: 3, explain: 'A tries 3 times; each of those makes B try 3 times; each of B\'s tries makes C receive 3 tries from B → 3x3x3 = 27. That is why retries must be concentrated in ONE layer, with a retry budget, and only while enough deadline remains.' },
      { q: 'Why should an absolute deadline (an instant) be propagated instead of a relative timeout?', options: ['Because the header is shorter', 'Because a relative number of ms makes each hop recompute from scratch so the total time of the chain balloons; the deadline never changes so the remaining time is always correct', 'Because deadlines are faster than timeouts', 'Because HTTP does not support timeouts'], answer: 1, explain: 'Timeout is a relative quantity and summing it across hops is wrong; the deadline is an absolute instant and any hop derives its own remaining time as deadline - now. gRPC does exactly this with grpc-timeout.' },
      { q: 'Payment times out (the provider does not answer in time). Which statement is CORRECT?', options: ['A timeout is proof the charge never ran, so refunding immediately is safe', 'A timeout cannot distinguish "never ran" from "already finished", so the result must be verified via idempotency key or a status query before concluding', 'A timeout is a signal to retry immediately 3 times', 'A timeout only matters when it is set longer than the total deadline'], answer: 1, explain: 'All three scenarios (never ran / still running / finished but the response was lost) produce the same timeout. Only an idempotency key or a status query can tell them apart; that is also why deadline propagation and canRetry must come together, so you do not blindly retry into the unknown.' },
    ],
  },
  'lesson-microservices-010': {
    title: 'Simulating Kafka: partition log, offset and commit strategy',
    goals: ['Explain the partition log and the offset in a consumer group', 'Distinguish committing the offset before vs. after processing and the resulting loss or duplication', 'Simulate assign/poll/commit yourself to observe at-least-once and at-most-once'],
    body: `**Summary:** Kafka (the distributed event-streaming system where producers send records and consumers read them back in order) stores messages in a partition log (an append-only partitioned journal) at an offset (a positional index 0,1,2...). A consumer group (a set of consumers sharing one group name to split the work) divides partitions among consumers; a consumer polls (pulls a batch of records) and commits (records the position it has read). Committing before processing (at-most-once, at most one delivery) can lose messages when it crashes after committing; committing after processing (at-least-once, at least one delivery) can duplicate when it crashes before committing. This lesson simulates the mechanism in miniature so the trade-off is visible.

### The real mechanism (Kafka) — understand before simulating
A topic (named data stream) is split into multiple partitions. Each partition is a time-ordered immutable log: the broker (the Kafka server that stores data) assigns an increasing offset to every record. Kafka guarantees that within a group each partition is assigned to at most one consumer at a time (to preserve order within the partition).

~~~seq
title: Basic read flow (simplified)
actors: Producer | Broker/Partition | Consumer | OffsetStore
Producer -> Broker/Partition: append(record) -> offset=5
Consumer -> Broker/Partition: poll(from offset=3)
Broker/Partition --> Consumer: records [3,4,5]
Consumer -> Consumer: process business logic
Consumer -> OffsetStore: commit(offset=6) (next read position)
~~~

Real configuration names (Kafka Java client, the {{KafkaConsumer}} class):
- {{enable.auto.commit}}: commits automatically on a timer (default true, {{auto.commit.interval.ms}}). Convenient but may commit a position whose records are not fully processed yet.
- Manual commit: {{consumer.commitSync()}} / {{commitAsync()}} after processing is done → the at-least-once direction.
- {{auto.offset.reset}} ({{earliest}}/{{latest}}): chooses the position when the group has no committed offset yet.
- Rebalance (reassigning partitions when a consumer joins/leaves the group): assigned by the {{PartitionAssignor}}. {{RangeAssignor}} assigns consecutive partitions per topic to each consumer (skews load when there are many topics). {{RoundRobinAssignor}} rotates all partitions of all topics across consumers (more balanced). {{CooperativeStickyAssignor}} reduces disruption by revoking/assigning incrementally. When a partition is revoked, {{ConsumerRebalanceListener.onPartitionsRevoked}} should commit the offsets already processed.
- Task note "assign partitions (range vs round-robin)": the point is that Range slices consecutively per topic while Round-robin distributes in rotation. (The exercise does not implement rebalance/assigner; it focuses on offset + commit — that is the deliberate simplification.)

### Why the commit strategy decides loss vs. duplication
| Strategy | When it commits | Where it crashes | Consequence |
|---|---|---|---|
| At-most-once (at most one delivery) | Before processing | After commit, before processing finishes | Message lost (offset already advanced, message skipped) |
| At-least-once (at least one delivery) | After processing | After processing, before commit | Duplicate (offset not advanced, re-polled) |
| Exactly-once (exactly one, Kafka scope) | Transaction / EOS | Depends | Needs {{transactional.id}}, {{isolation.level=read_committed}}; does not cover external DBs |

The Kafka broker only knows which offset was committed, not whether the business logic finished. So at-least-once is safer against data loss, and the consumer must be idempotent (processing a repeated message causes no second side effect, e.g. dedup by key/version).

### The simplified simulation (plain Java)
{{MiniKafka}} runs in a single JVM: a partition is a {{List<String>}} indexed by offset; each group has a committed offset and a read position. There is no network, no real rebalance, no concurrent consumers, no retention/compaction, and no time-based auto-commit. A "crash" is simulated by {{resetToCommitted}} (restart and read from the committed offset).

~~~java
// At-least-once: commit only AFTER successful processing
List<String> batch = k.poll("g", "orders", 0, 10);
for (String m : batch) { handle(m); }     // crash here → not yet committed
k.commit("g", "orders", 0, k.position("g","orders",0));
// handle wrote to DB + crash before commit → re-poll → duplicate (needs idempotent consumer)
~~~

### Common mistakes
- Enabling {{enable.auto.commit}} while processing takes longer than {{auto.commit.interval.ms}}: the background commit can advance the offset of a batch not fully processed.
- Committing offset per record instead of per batch: slow; committing per batch but processing out of order relative to the offset commit.
- Ignoring rebalance: missing the chance to commit offsets already processed before a partition is revoked.
- Thinking Kafka "exactly-once" is free: EOS only covers produce/consume inside Kafka; writes to an external DB/JDBC still need idempotency/outbox.

### Interview notes
State clearly: partition log + offset, group assignment (range/round-robin), the two commit directions and the crash consequences, why at-least-once + idempotent consumer is the usual choice. Mention {{enable.auto.commit}}, {{commitSync}}, {{ConsumerRebalanceListener}} and the limits of EOS.

> Senior tip: track {{consumer lag}} (latest offset minus committed offset) per partition; a sudden lag spike usually means slow processing, a rebalance, or a poison message blocking one partition.
`,
    exercises: [
      {
        title: 'MiniKafka: poll/commit and loss-vs-duplication by strategy',
        prompt: `Implement {{MiniKafka}} simulating a partition log. {{append(topic, partition, message)}} appends a message to the end of the partition and returns its offset (starting at 0). {{poll(group, topic, partition, max)}} returns up to {{max}} messages from the group's current position on that partition (if there is no position yet, use the committed offset, default 0) and **advances** the group's position by the number returned (simulating that they were read). {{commit(group, topic, partition, offset)}} sets the group's committed offset. {{position(group, topic, partition)}} returns the current read position; {{committed(group, topic, partition)}} returns the committed offset. {{resetToCommitted(group, topic, partition)}} sets position = committed (simulating a consumer restarting after a crash). Tests check: commit before processing then reset → the message is skipped (lost); process then crash before commit then reset → the message is read again (duplicate). All methods {{synchronized}}.
`,
        hints: [
          'append takes the size before adding as the offset. poll reads from pos (or committed if there is no pos yet), copies a subList, then sets pos to the position after what was returned.',
          'resetToCommitted sets pos = commits.getOrDefault(key,0) to simulate a restart reading from the committed offset.',
          'Groups and partitions stay independent thanks to the composite key; committed defaults to 0.',
        ],
        explain: `The simulation separates {{position}} (the in-memory read cursor) from {{committed}} (the durable position the group has recorded). Committing before processing makes committed advance immediately: reset simulates a crash afterwards, so position jumps back to the already-advanced committed → the unprocessed batch is skipped (lost). Committing after processing keeps committed old: reset after a crash makes poll return the batch again → duplicate. This is exactly at-most-once vs. at-least-once.

In real Kafka, the committed offset is stored in the internal topic {{__consumer_offsets}}. {{poll()}} returns {{ConsumerRecords}}; {{commitSync}} usually commits offset = lastProcessed + 1. A rebalance may revoke a partition, so offsets already processed should be committed. The simulation omits the network, serialization, multiple consumers, real rebalance, retention, and does not simulate time-based {{enable.auto.commit}}.

Common mistakes: confusing "polled" with "fully processed"; committing the offset of a record not yet processed; using auto-commit with a slow handler; not making the consumer idempotent when choosing at-least-once.
`,
      },
    ],
    check: [
      { q: 'The offset is committed before the business logic finishes, then the process crashes. Typical consequence?', options: ['The message is processed again (duplicate)', 'The message is skipped because the offset already advanced (lost)', 'The broker rolls the offset back', 'The consumer group is deleted'], answer: 1, explain: 'A committed offset is treated as already read; after restart the consumer continues from the new offset, so the unprocessed batch is skipped. This is at-most-once.' },
      { q: 'Why does at-least-once usually go together with an idempotent consumer?', options: ['To increase throughput', 'Because a crash before commit can make the same message be polled and processed again', 'Because Kafka deletes messages after poll', 'Because offsets always decrease'], answer: 1, explain: 'Committing after processing is safer against data loss but creates a duplication window when a crash happens before commit; idempotency (dedup by key/version) makes the repeated processing cause no second side effect.' },
      { q: 'What does Kafka exactly-once (EOS/transaction) guarantee?', options: ['Exactly-once automatically for every external DB and HTTP call', 'Consistency within Kafka under the transaction configuration; external DBs still need their own mechanism', 'Idempotent consumers are never needed again', 'Rebalance is disabled'], answer: 1, explain: 'Transactional producer and read_committed give consistency inside Kafka; writes to a DB/JDBC or HTTP calls outside Kafka are not part of the Kafka transaction, so outbox/idempotency keys are still needed.' },
    ],
  },
});
