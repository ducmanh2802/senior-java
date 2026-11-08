/*
 * English translation of js/data/lessons-microservices.js — task T1020. Format: js/core/i18n.js (content overlay).
 * ids: lesson-microservices-011
 */
App.i18n.content({
  'lesson-microservices-011': {
    title: 'Idempotent producer: sequence number, dedup and OUT_OF_ORDER error',
    goals: [
      'Explain producer ID (PID) and sequence number in Kafka idempotent producer',
      'Implement broker dedup: APPENDED, DUPLICATE, OUT_OF_ORDER',
      'State limits of idempotent producer (partition scope, session, retry)',
    ],
    body: `**Summary:** When the producer (sender) retries (tries sending again) because of a timeout (waiting time expired), the broker may receive the same record twice. An idempotent producer (producer capable of safe repeated sending) assigns each producer a PID (producer ID, identifying the sending session) and each record on a partition a sequence number (incrementing sequence number). The broker remembers the last sequence per (PID, partition): repeated seq → DUPLICATE, jumped seq → OUT_OF_ORDER, correct next → APPENDED.

### Real mechanism (Kafka)

Enabling {{enable.idempotence=true}} (default true in newer clients) makes the broker grant the producer a {{PID}}. For each {{<topic, partition>}}, the producer assigns a {{sequence number}} starting at 0, incrementing by 1 for each successful record/batch. The broker stores {{(PID, partition) -> lastSeq}} (attached to the log).

| Received (PID, seq) | Condition (last = last appended seq) | Result |
|---|---|---|
| first / last not yet | seq == 0 (simplified simulation) | APPENDED, last=seq |
| correct next | seq == last + 1 | APPENDED, last=seq |
| repeated retry | seq == last | DUPLICATE (ack succeeded, no extra write) |
| jumped / abnormal old | seq > last + 1 or seq < last | OUT_OF_ORDER (error) |

~~~seq
title: Retry creates duplicate but broker dedups
actors: Producer(PID=7) | Broker | Log
Producer(PID=7) -> Broker: append(partition, seq=3, msg)
Broker -> Log: write msg (lastSeq=3)
Broker -->> Producer(PID=7): ACK (lost on network)
Producer(PID=7) -> Broker: retry append(partition, seq=3, msg)
Broker --> Broker: seq==lastSeq → DUPLICATE
Broker -->> Producer(PID=7): ACK (no second write)
~~~

Related configuration (newer clients usually ensure automatically when idempotence is enabled): {{acks=all}}, {{retries}} large enough (in practice limited by {{delivery.timeout.ms}}), and {{max.in.flight.requests.per.connection}} <= 5 (default 5) to preserve order. Kafka idempotence guarantees no duplicate/no reordering **within the scope of one producer session and one partition**. Producer restart gets a new PID (unless using {{transactional.id}} to fence the old session); cross-partition/cross-topic exactly-once needs the transaction API.

### Why OUT_OF_ORDER is a serious error

If the broker receives seq=5 when last=3, seq=4 may have been lost. Accepting seq=5 creates a permanent hole in the log. The Kafka client may encounter {{OutOfOrderSequenceException}}: usually a sign of abnormal config/retry/in-flight, should not be silently ignored.

### Simplified simulation

{{Broker.append(pid, seq, msg)}} handles only one logical partition, no topic/partition key, no PID epoch fencing, no batch, no network. DUPLICATE is returned for test observation (in reality it is still an ack success).

~~~java
Broker b = new Broker();
b.append(7, 0, "a"); // APPENDED
b.append(7, 0, "a"); // DUPLICATE (retry)
b.append(7, 1, "b"); // APPENDED
~~~

### Common mistakes

- Thinking the idempotent producer achieves end-to-end exactly-once: external consumer/DB still sees repeat effects if the pipeline is not idempotent.
- Config conflicting with idempotence (e.g. {{acks!=all}} or {{max.in.flight.requests.per.connection}} > 5) is rejected by the client in newer versions; if idempotence is turned off and many in-flight requests are allowed, retry can reorder.
- Sequence is **per (PID, partition)**; not shared across partitions.
- Confusing DUPLICATE (safe, broker already has it) with OUT_OF_ORDER (needs error handling).

### Interview notes

Present: PID + sequence per partition, how the broker distinguishes a valid retry from a hole, scope limits (session, partition). Mention {{enable.idempotence}}, {{acks=all}}, {{transactional.id}} and why the consumer still needs to be idempotent.

> Senior tip: monitor producer {{record-error-rate}}, {{record-retry-rate}} and OutOfOrderSequence; abnormal retry increase when the broker is stable usually comes from timeout/in-flight or the network causing fake timeouts.
`,
    exercises: [{
      title: 'Broker.append: APPENDED / DUPLICATE / OUT_OF_ORDER',
      prompt: `Implement {{Broker}} with one logical partition. {{append(pid, seq, msg)}} handles a record from producer {{pid}} (int) with sequence {{seq}} (long, starting at 0 per pid) and returns one of three strings: {{"APPENDED"}} if seq is the next number ({{lastSeq + 1}}, or 0 if pid has not written yet) → store msg and update lastSeq; {{"DUPLICATE"}} if {{seq == lastSeq}} (already exists, retry) → do not store more; {{"OUT_OF_ORDER"}} if {{seq > lastSeq + 1}} (jumped) or {{seq < lastSeq}} (older than last) → do not store, do not change lastSeq. {{size()}} returns the number of messages successfully appended. {{lastSeq(pid)}} returns lastSeq of pid, or {{-1}} if not yet. Method {{synchronized}}.`,
      hints: [
        'For a new pid, expected = 0. For a pid that already has last, expected = last + 1. Compare seq with expected and last.',
        'DUPLICATE only when pid already exists and seq == last. If pid is new but seq != 0 then OUT_OF_ORDER (jumped from the start).',
        'OUT_OF_ORDER does not change last and does not write to the log.',
      ],
      explain: `State machine per PID: lastSeq is the trusted marker. seq == expected → append and update; seq == last → retry of an already committed record so only ack DUPLICATE; the rest (jumped or went back) → OUT_OF_ORDER because accepting would create a hole/conflict. Test "unknown pid starts at 0 only" emphasizes not accepting seq=1 before seeing seq=0.

In real Kafka, the broker tracks {{(PID, baseSequence)}} for batches on a partition; there is a PID epoch to fence old producers. An out-of-order error can make the producer fatal. Idempotence does not replace business idempotency. The simulation merges into one partition, no epoch, does not match msg content on duplicate, uses {{synchronized}} instead of the real log append mechanism.

Common mistakes: treating seq < last as DUPLICATE; not separating state per pid; appending before checking; forgetting new pid with seq > 0.`,
    }],
    check: [
      { q: 'Producer resends (PID=5, seq=10) due to ACK timeout, broker already has lastSeq=10. Correct result?', options: ['APPENDED adds a second record', 'DUPLICATE, no extra write', 'OUT_OF_ORDER', 'Broker resets lastSeq'], answer: 1, explain: `seq equal to lastSeq is a retry of a record already acknowledged by the broker; the broker returns logical success (dedup) but does not append a second time.` },
      { q: 'Broker has lastSeq=3 for PID=5, receives seq=5. Correct result?', options: ['APPENDED', 'DUPLICATE', 'OUT_OF_ORDER because it jumped over seq=4', 'Auto-fill seq=4'], answer: 2, explain: `seq > lastSeq+1 creates a hole (missing seq=4). The broker must reject to preserve sequence continuity; silently accepting would hide data loss.` },
      { q: 'Kafka idempotent producer (enable.idempotence) guarantees what scope?', options: ['Exactly-once for every DB and external HTTP call', 'No duplicate/reordering within producer session + partition scope (with proper config)', 'Every consumer automatically idempotent', 'Never retry'], answer: 1, explain: `Guarantee based on PID/sequence per partition; cross-partition transaction needs transactional.id. Systems outside Kafka still need their own idempotency mechanism.` },
    ],
  },
});
