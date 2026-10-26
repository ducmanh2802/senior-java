/*
 * English translation of js/data/labs-incident.js — task T260. Format: js/core/i18n.js (content overlay).
 * ids: lab-incident-003
 */
App.i18n.content({
  'lab-incident-003': {
    title: 'Consumer posting service stalls: Kafka lag 1.6 million, continuous rebalance',
    scenario: `**Context:** Bank **VNBank** has service **ledger-posting** (Spring Boot 3.2, spring-kafka 3.1, kafka-clients 3.6) reading topic **payment-events** (24 partitions, Kafka 3.6, 3 brokers) and calling the core banking posting API for each event. Idempotency key is {{eventId}}: if an event has already been posted, core returns **409 DUPLICATE**. Deployment is 6 pods × concurrency 4 = 24 consumers. Normally each core call takes about 80 ms, lag is almost zero.

**Symptoms:** At 09:02 on **22/10/2026**, the core banking team rebuilds an index on the posting DB, API latency rises to about 700 ms (expected to last until end of day). From around 09:10, lag grows continuously, reaching more than **1.6 million** messages by 11:43. Customers report balances not updating after transfers. Dashboard shows consumers still "running", core banking still receiving about 34 requests/second, pod CPU low, no pod restarts. Someone suggests scaling to 12 pods.

**Data collected:** Two runs of {{kafka-consumer-groups.sh}} 30 minutes apart, log of one pod, metrics and consumer config.`,
    questions: [
      'Why does lag grow at exactly the message arrival rate while core banking still receives about 34 requests/second from the consumer? Prove with the two describes and the log.',
      'Explain the mechanism chain: max.poll.records, max.poll.interval.ms, batch ack-mode, RangeAssignor rebalance. Why does the heartbeat keep running while the consumer is still kicked out of the group?',
      'Would scaling to 12 pods help? Propose immediate mitigation, long-term fix, and alerts needed.'
    ],
    hints: [
      'Compare CURRENT-OFFSET of the same partition at 11:13 and 11:43. Then look at committed/s and core_409/s metrics.',
      'Each poll returns at most 500 records, each taking about 700 ms. How long does one batch take compared to max.poll.interval.ms 300,000 ms? With batch ack-mode, when is the offset committed?',
      'The topic has 24 partitions. What does consumer 25 and beyond do? And if each batch still takes 350 seconds, does adding consumers help commit?'
    ],
    answer: `**Summary:** The consumer group falls into a **rebalance livelock with no progress**. Each {{poll()}} returns 500 records, each taking about 700 ms, so one batch takes about **350 seconds**, exceeding the default {{max.poll.interval.ms}} of 300 seconds. The consumer is kicked out of the group before it can commit (batch ack-mode only commits after the whole batch), the partition is assigned to another consumer, which starts again **from the same old offset**. Core banking still receives 34 requests/second but most are replays (409 DUPLICATE). Offset has not moved since about 09:10, so lag grows exactly at the message arrival rate (about 180 messages/second).

### Evidence

- **Offset stuck:** partition 13 has {{CURRENT-OFFSET 7313768}} at both 11:13 and 11:43, and the same holds for all 24 partitions. Only LOG-END-OFFSET increases. Total lag rises from 1,331,664 to 1,656,392, i.e. 324,728 over 1,800 seconds, about **180 messages/second**, matching {{in_msg/s}}. Metric {{committed/s = 0.0}} since 09:30.
- **Time between polls:** {{tbp_max}} about 351,000–352,600 ms, above 300,000. Log matches: batch starts at 11:20:02.118, the heartbeat thread reports {{consumer poll timeout has expired}} at **11:25:02.130**, exactly 300 seconds later. Consumer sends LeaveGroup, but the listener thread keeps processing until {{batch done ... took 350294 ms}} at 11:25:52.
- **Commit failure:** {{CommitFailedException: ... the consumer was kicked out of the group}}, then {{Lost previously assigned partitions payment-events-13}}. All 350 seconds of work are discarded.
- **Replay:** batch has {{created=0, duplicate=500}}: all 500 events were posted in the first round (around 09:10), every later round only gets 409 from core. From 10:00, {{core_409/s}} is almost equal to {{core_calls/s}} (33.5 out of 33.6): nearly 100% of calls to core are repeated work. After rejoin, consumer gets payment-events-21 and starts from {{offset=7235975}}, exactly the stuck CURRENT-OFFSET in describe. The loop continues.
- **Continuous rebalance:** {{generationId=1874}}, about 41–47 rebalances/hour, describe always reports {{is rebalancing}}, state {{PreparingRebalance}} with 21 members.
- Noise: health {{UP}}, low CPU, no restarts. Consumer is "alive" but does no useful work.

### Mechanism

1. **Two different dead-consumer detectors.** {{session.timeout.ms}} (45 seconds) is checked by heartbeat from the **background thread**, so a slow-processing consumer still sends heartbeats regularly. {{max.poll.interval.ms}} (300 seconds) checks the **processing thread**: if {{poll()}} is not called within 300 seconds, the client assumes the thread is stuck and leaves the group on its own. This is exactly the WARN message in the log.
2. **Batch ack-mode:** with a record listener, spring-kafka commits offset after processing all records from one {{poll()}}. If the batch never finishes within 300 seconds, it never commits.
3. **Range assignor is eager rebalance:** every time a member leaves or rejoins, the **whole** group stops, all partitions are revoked, then reassigned. 24 members rotate out roughly every 6 minutes, so the group is almost always rebalancing.
4. **Idempotency saves data but not throughput:** thanks to {{eventId}}, no duplicate posting occurs (no money lost), but each duplicate call still costs about 700 ms at core. Core is effectively redoing the same work.

Before 09:02: 500 × 80 ms = 40 seconds per batch, matching {{tbp_max 41,200}}, safely under 300 seconds. The latent bug existed from the start; core slowing down only exposed it.

### Would scaling to 12 pods help?

**No.** The topic has 24 partitions, so at most 24 consumers can have work. With 12 pods × 4 = 48 consumers, 24 consumers sit idle, and more members make each rebalance slower. More importantly, each batch still takes 350 seconds, so it still cannot commit. Even after livelock is gone, max throughput is only about 24 / 0.7 ≈ 34 messages/second, smaller than the ~180 messages/second arriving.

### Fix

**Immediate (config, rolling restart):**

~~~yaml
spring:
  kafka:
    consumer:
      max-poll-records: 20                 # 20 × 0.7 s = 14 s per batch, far below the limit
      properties:
        max.poll.interval.ms: 600000        # extra safety margin when downstream is unusually slow
~~~

After the change, offset will start moving. The first ~500 events per partition still have to call core and get 409 (about 700 ms each); this can be skipped faster if the consumer stores already-successfully-processed eventIds. But throughput is still only about 34 messages/second, so an additional step is needed to raise capacity:

- Work with core banking to use a **batch posting API** (e.g. 50 postings per call) or temporarily postpone the index rebuild.
- Or process in parallel within one partition **by key** (same account sequential, different accounts parallel), e.g. using a parallel consumer library, while preserving per-account ordering.
- Priority: slow posting affects balances customers see, so notify customer support and show "transaction processing".

**Long term:**

- Switch to {{CooperativeStickyAssignor}} (incremental rebalance): only partitions that need to move are revoked, other consumers keep running.
- **Static membership** ({{group.instance.id}} = pod name): rolling restart does not trigger rebalance if the pod returns within {{session.timeout.ms}}.
- Commit more frequently (ack-mode {{RECORD}} or {{COUNT}}/{{TIME}}) to reduce rework on partition loss.
- When downstream is slow or failing: use error handler backoff, or {{pause()}} the container instead of processing past the limit.
- Design partition count for required capacity: at 700 ms per message and 180 messages/second, at least 126 parallel processing threads are needed if processing sequentially, so use batch or key-based parallel processing.
- Before changing partition count: increasing partitions changes key-to-partition mapping, affecting per-account ordering during the transition.

### Alerts

- Lag by wait time (seconds), not only message count: e.g. lag / arrival rate exceeding 60 seconds.
- {{committed/s}} equals 0 for 5 minutes while messages still arrive: the most accurate sign of livelock.
- {{kafka_consumer_time_between_poll_max}} exceeding 70% of {{max.poll.interval.ms}}.
- Rebalances/hour greater than 0 with no deploy.
- Core 409 DUPLICATE rate: if unusually high, replay is happening.

> Senior tip: For a consumer calling an external system, I always compute {{max.poll.records}} × worst-case downstream p99 and keep it below about half of {{max.poll.interval.ms}}. The log message {{consumer poll timeout has expired}} should be treated as an incident, not a warning. And never answer "high lag" by adding pods before checking partition count and whether offset is moving.`,
    rubric: [
      'Identify livelock: CURRENT-OFFSET stuck between 11:13 and 11:43 (e.g. partition 13 at 7313768), committed/s = 0, lag growing at ~180 messages/second equal to arrival rate.',
      'Explain mechanism: 500 records × ~700 ms = 350 s exceeds max.poll.interval.ms 300 s, consumer leaves group on its own (poll timeout log), CommitFailedException because batch ack-mode only commits after the whole batch, new partition restarts from old offset (409 DUPLICATE).',
      'Distinguish session.timeout.ms (heartbeat thread) from max.poll.interval.ms (processing thread), and state impact of eager rebalance with RangeAssignor.',
      'Explain why adding pods does not help: max 24 consumers for 24 partitions, each batch still over 300 s, throughput ~34 messages/second still below 180.',
      'Propose: reduce max.poll.records, raise max.poll.interval.ms, raise throughput (batch API, key-based parallel), CooperativeStickyAssignor, static membership, more frequent commits; alerts by committed rate, time-between-poll, rebalance.'
    ]
  }
});
