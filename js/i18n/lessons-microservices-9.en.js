/*
 * English translation of js/data/lessons-microservices.js — task T1020/T1117. Format: js/core/i18n.js (content overlay).
 * ids: lesson-microservices-011
 */
App.i18n.content({
  'lesson-microservices-011': {
    title: 'Idempotent producer: sequence numbers, dedup, and OUT_OF_ORDER errors',
    goals: [
      'Explain the producer ID (PID) and sequence number used by Kafka\'s idempotent producer',
      'Implement broker-side dedup logic: APPENDED, DUPLICATE, OUT_OF_ORDER',
      'State the limits of an idempotent producer (partition scope, session, retries)',
    ],
    body: `**Summary:** When a producer (the sender) retries (tries to send again) because of a timeout (the time limit expired), the broker may receive the same record twice. An idempotent producer (a producer that can safely send the same record again without creating a duplicate effect) assigns each producer a PID (producer ID, identifier for that sending session) and assigns each record on a partition a sequence number (a counter that increases by 1). The broker remembers the last sequence per (PID, partition): a repeated seq → DUPLICATE, a jumped seq → OUT_OF_ORDER, the correct next seq → APPENDED.


### What the real mechanism looks like (Kafka)
Enabling {{enable.idempotence=true}} (the default in newer clients) causes the broker to assign the producer a {{PID}}. For each {{<topic, partition>}}, the producer assigns a {{sequence number}} starting at 0 and increasing by 1 for each successfully sent record or batch. The broker stores {{(PID, partition) -> lastSeq}} alongside the log.

| Received (PID, seq) | Condition (last = last appended seq) | Result |
|---|---|---|
| first time / last not set yet | seq == 0 (simplified simulation) | APPENDED, last=seq |
| correct next | seq == last + 1 | APPENDED, last=seq |
| repeated retry | seq == last | DUPLICATE (ack succeeds, nothing written again) |
| jumped / abnormally old | seq > last + 1 or seq < last | OUT_OF_ORDER (error) |

~~~seq
title: A retry creates a duplicate, but the broker deduplicates it
actors: Producer(PID=7) | Broker | Log
Producer(PID=7) -> Broker: append(partition, seq=3, msg)
Broker -> Log: write msg (lastSeq=3)
Broker -->> Producer(PID=7): ACK (lost on the network)
Producer(PID=7) -> Broker: retry append(partition, seq=3, msg)
Broker --> Broker: seq==lastSeq → DUPLICATE
Broker -->> Producer(PID=7): ACK (no second write)
~~~

Related configuration (newer clients usually enforce these automatically when idempotence is enabled): {{acks=all}} (the leader waits for all in-sync replicas to confirm before acknowledging), {{retries}} large enough (in practice bounded by {{delivery.timeout.ms}}), and {{max.in.flight.requests.per.connection}} <= 5 (default 5) to preserve ordering. Kafka idempotence guarantees no duplicates and no reordering **only within the scope of a single producer session and a single partition**. A restarted producer gets a new PID (unless {{transactional.id}} is used to fence the old session). Exactly-once across partitions or topics requires the transaction API.

### Why OUT_OF_ORDER is a serious error
If the broker receives seq=5 when last=3, then seq=4 may have been lost. Accepting seq=5 would create a permanent hole in the log (missing data that can never be filled). Kafka clients can surface {{OutOfOrderSequenceException}}: this usually signals an abnormal retry/in-flight configuration or an unhealthy state, and it should not be silently ignored.

### The simplified simulation in this lesson
{{Broker.append(pid, seq, msg)}} handles only one logical partition. It has no topic/partition key, no PID epoch fencing (the mechanism Kafka uses to block an old producer session after a restart), no batching, and no network. DUPLICATE is returned explicitly so tests can observe it (in real Kafka the broker still returns a successful acknowledgement).

~~~java
Broker b = new Broker();
b.append(7, 0, "a"); // APPENDED
b.append(7, 0, "a"); // DUPLICATE (retry)
b.append(7, 1, "b"); // APPENDED
~~~

### Common mistakes
- Thinking an idempotent producer gives end-to-end exactly-once: consumers or external databases can still observe repeated effects if the rest of the pipeline is not idempotent.
- Configurations that conflict with idempotence (for example {{acks!=all}} or {{max.in.flight.requests.per.connection}} > 5) are rejected by newer clients. If idempotence is turned off and many in-flight requests are allowed, retries can reorder records.
- The sequence is **per (PID, partition)**; it is not shared across partitions.
- Confusing DUPLICATE (safe — the broker already has the record) with OUT_OF_ORDER (an error that needs handling).

### Interview framing
Explain: PID plus a per-partition sequence, how the broker tells a valid retry from a gap, and the scope limits (session, partition). Mention {{enable.idempotence}}, {{acks=all}}, {{transactional.id}}, and why consumers still need to be idempotent.

> Senior tip: monitor producer {{record-error-rate}}, {{record-retry-rate}}, and OutOfOrderSequence events. A sudden rise in retries while the broker is healthy often points to client timeouts, in-flight settings, or a network that causes false timeouts.
`,
    exercises: [{
      title: 'Broker.append: APPENDED / DUPLICATE / OUT_OF_ORDER',
      prompt: `Implement {{Broker}} with a single logical partition. {{append(pid, seq, msg)}} handles a record from producer {{pid}} (int) with sequence {{seq}} (long, starting at 0 for each pid) and returns one of three strings: {{"APPENDED"}} if seq is the next number ({{lastSeq + 1}}, or 0 if this pid has never written before) — store msg and update lastSeq; {{"DUPLICATE"}} if {{seq == lastSeq}} (already present, a retry) — do not store it again; {{"OUT_OF_ORDER"}} if {{seq > lastSeq + 1}} (a gap) or {{seq < lastSeq}} (older than last) — do not store it and do not change lastSeq. {{size()}} returns the number of successfully appended messages. {{lastSeq(pid)}} returns the lastSeq for that pid, or {{-1}} if none. Methods must be {{synchronized}}.`,
      hints: [
        'For a new pid, expected = 0. For a pid that already has a last value, expected = last + 1. Compare seq with expected and last.',
        'DUPLICATE applies only when the pid already exists and seq == last. If the pid is new but seq != 0, that is OUT_OF_ORDER (it jumped from the start).',
        'OUT_OF_ORDER must not change last and must not write to the log.',
      ],
      explain: `This is a small state machine per PID: lastSeq is the trusted marker. seq == expected means append and update; seq == last means a retry of an already committed record, so return DUPLICATE without appending again; everything else (a gap or going backward) is OUT_OF_ORDER because accepting it would create a hole or a conflict. The "unknown pid starts at 0 only" test emphasizes that seq=1 must not be accepted before seq=0 has been seen.

In real Kafka, the broker tracks {{(PID, baseSequence)}} for batches on a partition and uses a PID epoch to fence old producers. An out-of-order error can make the producer fatal. Idempotence does not replace business idempotency. This simulation uses a single partition, no epoch, does not compare msg content on duplicates, and uses {{synchronized}} instead of the real log append mechanism.

Common mistakes: treating seq < last as DUPLICATE; not separating state per pid; appending before checking; forgetting that a new pid with seq > 0 is OUT_OF_ORDER.`,
    }],
    check: [
      { q: 'A producer resends (PID=5, seq=10) because the ACK timed out, but the broker already has lastSeq=10. What is the correct result?', options: ['APPENDED adds a second record', 'DUPLICATE, with no extra write', 'OUT_OF_ORDER', 'The broker resets lastSeq'], answer: 1, explain: 'seq equal to lastSeq is a retry of a record the broker has already acknowledged. The broker returns logical success (dedup) but does not append a second copy.' },
      { q: 'The broker has lastSeq=3 for PID=5 and receives seq=5. What is the correct result?', options: ['APPENDED', 'DUPLICATE', 'OUT_OF_ORDER because it skipped seq=4', 'Automatically fill in seq=4'], answer: 2, explain: 'seq > lastSeq+1 creates a gap (seq=4 is missing). The broker must reject it to preserve sequence continuity; silently accepting it would hide data loss.' },
      { q: 'What scope does Kafka\'s idempotent producer (enable.idempotence) guarantee?', options: ['Exactly-once for every database and external HTTP call', 'No duplicates/reordering within a producer session + partition (with correct config)', 'Every consumer becomes idempotent automatically', 'No retries ever happen'], answer: 1, explain: 'The guarantee is based on PID/sequence per partition. Cross-partition transactions need transactional.id. Systems outside Kafka still need their own idempotency mechanisms.' },
    ],
  },
});
