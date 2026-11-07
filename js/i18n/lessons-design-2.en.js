/*
 * English translation of js/data/lessons-design.js — task T803. Format: js/core/i18n.js (content overlay).
 * ids: lesson-design-006
 */
App.i18n.content({
  'lesson-design-006': {
    title: 'Transactional outbox: why you must not send to Kafka inside a DB transaction',
    goals: [
      'Explain what dual-write is and correctly list the divergent states it creates between the DB and the broker',
      'Write an outbox table plus a relay that recovers after a crash, and understand why the semantics are at-least-once',
      'Know how to make a consumer idempotent and how to preserve event order per aggregate',
      'Choose between a polling relay and CDC (Debezium) based on the infrastructure you already have',
    ],
    body: `### The problem: one business operation, two systems to write

The "create order" service has to do two things: write the order into MySQL and tell the other systems (warehouse, email, loyalty points) about it through Kafka. **Kafka** is a distributed event queue, so here are the concepts you need first: a **producer** is the application that sends messages; a **topic** is a named mailbox (order-created); a topic is split into several **partitions**, which are parallel append-only logs writing sequentially, and Kafka only guarantees **order inside one partition**; a **broker** is the server that stores the partitions (each partition is replicated onto other brokers so nothing is lost when one server dies); a **consumer** reads the messages and records its **offset** (a cursor that says how far it has read) so the next read continues from there.

The most natural way to write it is:

~~~java
@Transactional
public void placeOrder(Order o) {
    orderRepo.save(o);                 // (1) the DB commits when the method returns
    kafka.send("order-created", o);    // (2) send the message from inside the same method
}
~~~

These two steps live in **two systems that share no transaction**. Enumerate every possibility:

| Where the process dies | What actually happens | Consequence |
|---|---|---|
| Before the commit | no order, no event | fine, the client retries |
| After the commit, before the send | order exists, no event | the warehouse never learns about it, and **the event is lost forever** because nothing anywhere remembers that it still had to be sent |
| Mid-send, the ack is lost | order exists, possibly 2 events | duplicates, the consumer must tolerate them |
| Send finished, commit fails (uniqueness constraint, a later exception) | no order, but the event exists | the other systems work on an order that **does not exist** |

This is the **dual-write** problem: no single COMMIT command spans two independent systems, so there is no way to "resume exactly where it broke" when the application only knows about the send itself.

### 2PC/XA: the "correct" solution almost nobody uses

**Two-Phase Commit (2PC)**: a transaction manager asks every participant (the DB, a broker that supports **XA**) "are you prepared?" (the prepare phase, during which each side holds its locks), and only after all of them answer does it issue the commit. The price: the transaction manager is a central point of failure, locks are held for the whole prepare phase so throughput usually drops several-fold, one hung participant hangs the entire group with it, and it destroys the independent deployability that makes microservices worth having. So in real systems the requirement is changed: instead of trying to reach exactly-once across two systems, make **one system the single commit point**.

### Outbox: bringing both writes into one transaction

The idea: do not send to Kafka inside the transaction. Instead write the message into **a table of the business database itself**, in the same transaction:

~~~sql
CREATE TABLE outbox (
  id           BIGINT PRIMARY KEY,      -- stable event id, never regenerated on retry
  agg_id       VARCHAR(64),             -- order-7: used as the partition key
  event_type   VARCHAR(64),
  payload      JSON,
  created_at   DATETIME(3),
  delivered_at DATETIME(3) NULL         -- NULL = not relayed yet
);
INSERT INTO orders (...);               -- the business row
INSERT INTO outbox (...);               -- the event to be sent
COMMIT;                                 -- ONE commit covering both rows
~~~

Because both INSERTs target the same database, atomicity is guaranteed by the database itself: either the order and the event exist together, or neither exists. The "order exists but the event is missing" state is gone, and so is "an event for an order that was rolled back". A second component, the **relay**, will pick up the rows where delivered_at IS NULL and send them to Kafka afterwards.

The price, stated up front: the event reaches Kafka **later** than the commit (by the polling delay, typically a few hundred milliseconds to a few seconds), and the semantics are **at-least-once** (the relay may send twice). Both are manageable, and both are deliberate trade-offs, not bugs.

~~~seq
title: Outbox relay, one single commit point
actors: Service | MySQL | Relay | Kafka | Consumer
Service -> MySQL: BEGIN, INSERT orders and INSERT outbox
MySQL --> Service: COMMIT, both rows are now in the log
note Service..MySQL: Dying here leaves no event, client retry is safe
Relay -> MySQL: SELECT WHERE delivered_at IS NULL
MySQL --> Relay: batch of events not sent yet
Relay -> Kafka: send with partition key order-7
Relay -> MySQL: UPDATE SET delivered_at = now
note Relay..Kafka: Crashing between send and update resends it later
Kafka -> Consumer: delivers the event, possibly duplicated
Consumer -> Consumer: check event id, skip if already applied
~~~

### Relay: polling or CDC
- **Polling**: the relay runs a SELECT on a schedule, sends to Kafka, then UPDATEs delivered_at (or deletes the row into an archive table). Pro: no extra infrastructure, the database is all you need. Con: repeated read load on the source database, latency equal to the poll interval, and you need an index on (delivered_at, id) so it does not scan the whole table.
- **CDC (Change Data Capture)**: a tool like **Debezium**, running inside Kafka Connect, reads the database **transaction log** (MySQL binlog, PostgreSQL WAL) and publishes every change as a message, including the new INSERT into the outbox table. Pro: no queries against the business tables, low latency, and the log already contains both the order row and the outbox row, so their relative order is preserved. Con: one more piece of infrastructure to operate, it needs log-read permissions, and schema changes have to be managed.

### At-least-once and idempotent consumers
There is always a window of "sent to Kafka but not yet marked delivered" (the relay dies at exactly that moment, or the ack arrives late). The next relay pass sees the row still NULL and sends it again. That window cannot be removed without 2PC-style coordination, so instead of promising exactly-once at the producer, we **accept duplicates and make the consumer tolerate them**:
- Every event carries a **stable event id** (the id of the outbox row), not a UUID regenerated on each send.
- The consumer stores the ids it has processed (a processed_event table with a primary key, a Redis SET with a TTL, or the consumer's own state store) and skips ids it has already seen — which turns "sent twice" into "applied once".
- Prefer operations that are **naturally idempotent**: UPDATE status='PAID' WHERE order_id=? AND status='NEW' runs twice with only one effect; "add 100 points" is not idempotent, so turn it into "add points keyed by reference key = event id".

### Ordering per aggregate
If you want the consumer to see "order created" before "order paid", every event of **the same order** must go through **the same partition**: use agg_id as the partition key. Two more conditions are then required: the relay must send sequentially for a given key (do not parallelise events of one order), and a retry for a key must wait, because Kafka never reorders messages that are already inside a partition. Note too that a topic's partition count does not grow without limit: adding partitions changes how keys are mapped, so capacity planning has to be decided early.

### What an outbox does not solve by itself
- It does not guarantee that Kafka durably received the message: the producer still needs acks=all, retries, **enable.idempotence=true** (deduplication and loss protection inside Kafka itself) and enough min.insync.replicas.
- It does not fix reads from a replica: if the service reads a replica to absorb load, the order may not be visible yet while the event has already been relayed and sent — so read the primary for a row you just wrote.
- The outbox table grows forever: you need an archive job for delivered rows, supporting indexes, and for large systems you shard the outbox table itself by agg_id.
- It does not make a committed business operation fail again: once the business logic committed, the event travels **later**, it is never retracted. A business flow that must be undone publishes a reversing event (compensating) instead — see saga.

### Real-world pitfalls
- Marking delivered **before** receiving the ack from Kafka: the message that was in flight is genuinely lost.
- Stuffing "hot" data into the payload (the current balance): an event should describe what already happened; whoever needs the current value reads the system of record.
- Running two relay instances with no assignment of work: at-least-once stays correct, but you get many more duplicates and per-key ordering breaks easily.
- Putting the outbox table in a database **different** from the business database: you lose exactly the thing you bought and you are back to dual-write.
- Not monitoring **relay lag** (now - created_at of the oldest row without delivered_at): the incident only surfaces when the warehouse team calls to ask why an order has been sitting there.

### Interview notes
Answer along this frame: (1) dual-write and its divergent states; (2) the outbox gathers everything into one commit point, in exchange for latency and at-least-once; (3) a polling relay or CDC depending on the infrastructure you have; (4) idempotent consumer + partition key per aggregate; (5) operations: the relay lag metric, cleanup, producer configuration. If you are asked "why not use a Kafka transaction": producer transactions in Kafka (Kafka 0.11+, used for exactly-once stream processing) only coordinate operations **inside** Kafka, they do not commit together with MySQL. If you are asked "why not use XA": answer with the lock and coordination costs above.
The exercise below simulates a DB and a broker that can crash mid-operation, so you can run it yourself and see that dual-write loses the event while the outbox does not.`,
    exercises: [{
      title: 'Prove that dual-write loses the event and the outbox does not',
      prompt: `The simulated infrastructure already exists in the test file (you do not have to write it), with this API:

~~~java
final class Sim {
    static class Crash extends RuntimeException { }  // the process dies mid-operation
    Map<String,String> orders;      // committed ORDER rows
    Map<String,String> outbox;      // committed OUTBOX rows
    Set<String> delivered;          // outbox ids already relayed
    List<String> broker;            // messages Kafka ACTUALLY received
    Set<String> applied;            // events the consumer has applied
    String crashBefore;             // "commit" | "publish" | "mark" | null
    void begin()                    // open a transaction
    void saveOrder(String id)       // pending INSERT, durable only after commit
    void saveOutbox(String id)      // pending outbox INSERT
    void commit()                   // crashBefore = "commit": drop pending rows, throw Crash
    void publish(String id)         // crashBefore = "publish": throw Crash, broker unchanged
    void mark(String id)            // crashBefore = "mark": throw Crash, delivered not recorded yet
    boolean apply(String id)        // true = first time, false = a copy
    void recover()                  // the process has restarted
}
~~~

Implement the class {{Outbox}} with these static methods, using **exactly** the required order of operations so that the crash outcome does not depend on how you wrote it:
1. {{dualWrite(sim, id)}}: begin, saveOrder, commit, then publish. Do not catch Crash, let it escape to the caller.
2. {{writeWithOutbox(sim, id)}}: begin, saveOrder, saveOutbox, commit. Do **not** publish in this step.
3. {{relay(sim)}}: for each id present in outbox but not yet in delivered, publish that id and then mark it.
4. {{consume(sim, id)}}: return the consumer's {{apply}} result (true = new event, false = duplicate).
`,
      hints: [
        'dualWrite calls publish AFTER commit: if it crashes exactly at publish, no trace is left for a relay to learn that an event still had to be sent, so the event is lost forever.',
        'relay should first copy the list of not-yet-delivered ids into a List and only then send, so that you do not modify the collection you are iterating over.',
        'The publish-then-mark order is deliberate: a crash between the two steps makes the next relay pass send again (at-least-once). Doing mark first and publish second would lose the message.',
        'consume only has to return the result of sim.apply(id): true means the first application, false means a duplicate copy.',
      ],
      explain: `All three conclusions are visible right in the output: (1) dualWrite crashing at publish leaves a row in {{orders}} while {{broker}} stays empty, and every later {{relay}} does nothing — dual-write never recorded anywhere that the event still had to be sent; (2) writeWithOutbox crashing at commit leaves nothing at all, so the client retries cleanly — that is exactly the atomicity the outbox buys you; (3) a crash between publish and mark produces a real duplicate ({{broker}} contains o1 twice), which is at-least-once, and because the consumer stores the event id the business effect happens only once. In production delivered_at is usually replaced by deleting the row or moving it into an archive table, and the mark must happen AFTER the producer receives the ack.`,
    }],
    check: [
      { q: 'Why can calling {{kafka.send}} inside a {{@Transactional}} method still lose the event?', options: ['Because Kafka has no transactions, so Spring cannot send from inside the method', 'Because the two operations belong to two systems with no shared commit point: dying between commit and send leaves an order without an event', 'Because {{@Transactional}} always rolls back when a producer send happens in the same method', 'Because you must use {{@KafkaListener}} instead of a producer send'], explain: `This is exactly dual-write: Spring commits the DB when the method returns, while the send is a call to a different system. Kafka does have transactions (Kafka 0.11+), but they only coordinate operations inside Kafka and do not commit together with MySQL, so the first option is wrong in its premise. {{@Transactional}} does not roll back just because a send happened, and {{@KafkaListener}} is on the consumer side, unrelated to producing.` },
      { q: 'The relay sends the message successfully but dies before writing delivered_at. Which semantics describe this correctly?', options: ['Exactly-once, because the relay will not resend a row it already sent', 'At-most-once, because the message may have been lost', 'At-least-once, because the next relay pass still sees the row as not delivered and sends it again, so the consumer must be idempotent', 'Best-effort, resent only when someone asks'], explain: `Without extra coordination there is no way to know "already sent but not yet marked", so the design accepts resending and pushes deduplication to the consumer (which stores the event ids it applied). Exactly-once is a promise beyond what a relay can deliver; at-most-once is the opposite case (the message is not lost, only duplicated); and nobody has to ask for a resend — the relay loop finds the pending rows by itself.` },
      { q: 'Why should the relay use the aggregate id (order id) as the partition key when sending to Kafka?', options: ['So that Kafka replicates the message to other brokers', 'Because Kafka only preserves order inside one partition, so every event of the same order must sit in the same partition', 'To reduce the number of partitions the topic has to create', 'Because a partition key is mandatory and may only be an aggregate id'], explain: `Replication (the first option) is independent of the partition key. Kafka guarantees sequential order only within a single partition, so for "order created" to arrive before "payment", the two events of that order must share one partition. A partition key can be any string, it is not required to be an aggregate id, and choosing a key does not reduce the number of partitions of the topic.` },
      { q: 'Compared with CDC (Debezium), what is the main drawback of a polling relay?', options: ['It needs permission to read the database transaction log', 'It creates repeated read load on the source database itself and latency equal to the poll interval', 'It cannot preserve event order per aggregate', 'It always sends duplicate messages'], explain: `Polling runs SELECT WHERE delivered_at IS NULL on a schedule against the business database, which both costs resources and adds a delay equal to the poll interval; log-read permissions are a cost of CDC, not of polling. Order is still preserved as long as you read by id and send with the right partition key, and duplication is an at-least-once property of both approaches.` },
    ],
  },
});
