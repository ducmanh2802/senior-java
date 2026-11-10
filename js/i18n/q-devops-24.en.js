/*
 * English translation of js/data/q-devops.js — task T982. Format: js/core/i18n.js (content overlay).
 * ids: devops-137 devops-138 devops-139 devops-140 devops-141 devops-142 devops-143
 */
App.i18n.content({
  'devops-137': {
    q: 'How does MariaDB Galera Cluster work: synchronous replication, quorum, SST/IST?',
    a: `**Summary:** MariaDB Galera Cluster is a (near) **synchronous multi-primary** cluster: writes can go to any node; on commit, the transaction is **broadcast to all nodes** together with its write-set, and every node **certifies** (conflict check) in the same global order, then applies. You need an **odd number of nodes (>= 3)** to have a **quorum** when the network partitions. A new or lagging node catches up via **SST** (full data copy) or **IST** (only the missing part, taken from another node's {{gcache}}).

### How a commit happens
1. Client writes to node A; the transaction runs locally as usual (row locks only on A).
2. At COMMIT, A packages the **write-set** (changed rows + primary keys) and broadcasts it through the group communication layer in **global order** (every node receives the same order).
3. Every node **certifies**: does this write-set touch a row that a transaction earlier in global order already modified (and that the originating node has not seen)? The decision is **deterministic** — all nodes reach the same result without asking each other.
4. If certified: A returns OK to the client; other nodes apply asynchronously (hence "virtually synchronous": data is guaranteed but apply may lag slightly). If not: A rolls back and returns a **deadlock** error to the client.
Consequence: two people writing the **same row on two different nodes** → one side gets an error at commit (certification failure), even though no locks ever waited on each other.

### Quorum
- Each network partition counts the nodes it can see; the partition with the **majority** becomes the primary component and keeps serving, the minority becomes **non-primary** and rejects queries — preventing split-brain.
- 2 nodes split → each side is 50%, neither is a majority → the whole cluster stops. Hence use 3 nodes, or 2 nodes + **garbd** (Galera Arbitrator, votes only, stores no data).

### SST and IST
| | SST | IST |
|---|---|---|
| When | New node, or lagged too far (gcache no longer has the missing part) | Short absence, missing part still in gcache |
| Data transferred | Whole DB | Only missing write-sets |
| Method | {{mariabackup}} (does not lock donor long), rsync | From donor's gcache |
| Time | 100GB DB over 1Gbps ≈ 15-30 minutes+ | Seconds to a few minutes |
Set {{gcache.size}} large enough to hold the writes generated during your longest typical maintenance window (e.g. 2GB/hour writes, 2-hour maintenance → gcache >= 4-5GB) so a restarting node uses IST instead of SST.

### In production
- Write to **one node** at a time (via ProxySQL/MaxScale) to avoid certification failure; other nodes serve reads and stand by.
- Every table needs a **primary key** (InnoDB); tables without a primary key replicate very slowly or error out.
- Large transactions (UPDATE millions of rows) → huge write-set, whole cluster stalls; split into batches.
- Monitor {{wsrep_cluster_size}}, {{wsrep_cluster_status}}, {{wsrep_local_recv_queue_avg}}, {{wsrep_flow_control_paused}} (a slow node drags the whole cluster via flow control).

### Real-world example
A booking system ran Galera with 3 nodes, the app writing round-robin to all 3. At peak, 2-3% of bookings failed with "deadlock found" even though no real deadlock was logged — that was certification failure when two people booked the same room on two different nodes. Switching to writing via MaxScale to a single primary node (reads still balanced) plus retrying certification errors dropped failures below 0.05%. Raising {{gcache.size}} from the 128MB default to 4GB meant the next OS patch brought each node back via IST in 40 seconds instead of a 25-minute SST.

### Pitfalls
- 2-node cluster without an arbitrator.
- Writing to multiple nodes then being surprised by "deadlock" errors at commit.
- gcache too small → every restart is a heavy SST, donor slows down.
- A weaker node (slow disk) → flow control slows the whole cluster.

### Interview-style answer
"Galera is a multi-primary synchronous cluster. A transaction runs locally on the node that receives the write; at commit, its write-set is broadcast to all nodes in a global order, and each node certifies whether it conflicts with a transaction earlier in that order. Because the order is identical, all nodes reach the same decision. If certified, the commit succeeds; otherwise the originating node rolls back and returns a deadlock error, so two concurrent writes to the same row on two different nodes yield an error at commit for one of them. The cluster needs an odd number of nodes, at least three or two plus an arbitrator, so a majority can keep serving when the network splits while the minority stops accepting writes. A new or lagging node catches up via SST, a full copy usually with mariabackup, or IST, fetching only the missing write-sets from gcache. In practice I write to a single node through ProxySQL or MaxScale and size gcache large enough so restarts use IST."

> Senior tip: size gcache from the write-set volume generated per hour times your longest typical maintenance window. Changing that one parameter often turns every maintenance from "waiting 30 minutes for SST" into "a few tens of seconds for IST".`,
    follow: ['How long does SST take for a 100GB DB?', 'How large should gcache be?', 'Galera vs Group Replication?'],
  },
  'devops-138': {
    q: 'Redis Sentinel: quorum, failover, and how do clients (Lettuce/Redisson) discover the new master?',
    a: `**Summary:** Redis Sentinel is a set of processes that **monitor + auto-failover** a single-master, multiple-replica setup. Each Sentinel pings the master; when enough Sentinels agree the master is "dead" (ODOWN), the Sentinels **elect a leader** by **majority**, the leader picks the best replica, promotes it, and reconfigures the other replicas. Clients like Lettuce/Redisson **do not hard-code the master address** but ask Sentinel and listen for master-change notifications to reconnect on their own.

### Quorum vs majority — two different concepts
- **quorum** (in {{sentinel monitor mymaster 10.0.0.1 6379 2}}): the number of Sentinels that must agree the master is not responding before moving from SDOWN (one Sentinel thinks it is dead) to **ODOWN** (enough have agreed).
- **majority** of all Sentinels: required to **elect a leader** that performs the failover. With 3 Sentinels you need 2.
That is why you run **at least 3 Sentinels on 3 different machines/zones**; with 2 Sentinels, losing one leaves no majority to fail over.

### Failover step by step
1. Master stops responding for longer than {{down-after-milliseconds}} (e.g. 5000) → SDOWN on each Sentinel.
2. Quorum reached → ODOWN; Sentinels elect a leader (epoch-based, simple Raft-like).
3. Leader picks a replica: excludes replicas that have been disconnected too long, prefers lower {{replica-priority}}, then the replica with the **largest replication offset** (least data loss).
4. Sends {{REPLICAOF NO ONE}} to the chosen replica; points other replicas at the new master; publishes the new config ({{+switch-master}} channel).
5. The old master returning becomes a replica of the new master.
Total time is roughly {{down-after-milliseconds}} + a few seconds.

### How the client discovers the new master
~~~yaml
spring:
  data:
    redis:
      sentinel:
        master: mymaster
        nodes: sentinel-1:26379,sentinel-2:26379,sentinel-3:26379
      timeout: 2s           # a command hanging on a dead master fails fast instead of forever
~~~
- **Lettuce** (Spring Boot default): asks Sentinel for the master address, tracks changes and reconnects; can be configured to read from replicas ({{ReadFrom.REPLICA_PREFERRED}}) when slightly stale data is acceptable.
- **Redisson**: {{useSentinelServers()}} with the Sentinel list, updates topology on its own.
- During failover there are a few seconds of errors → make idempotent commands retry with backoff; for non-idempotent commands (INCR) think carefully.

### Data loss on failover
Redis replication is **asynchronous**: a write already ACKed on the master but not yet on a replica is lost on failover. Mitigate with {{min-replicas-to-write 1}} and {{min-replicas-max-lag 10}} (master rejects writes when no replica keeps up) — at the cost of possibly rejecting writes when a replica has a problem. {{WAIT}} lets you wait for a write to reach N replicas for critical operations.

### Sentinel vs Redis Cluster
| | Sentinel | Redis Cluster |
|---|---|---|
| Data | All on one master | Sharded across 16384 slots on multiple masters |
| Write scaling | No | Yes |
| Failover | Done by Sentinel | Done by the masters voting among themselves |
| Client | Asks Sentinel | Knows the slot map, handles MOVED/ASK |
| Fits | Data fits on one machine, needs HA | Data/write volume exceeds one machine |

### Real-world example
A session system used 1 master + 1 replica + **2 Sentinels co-located with Redis** on the same machines. When the machine holding the master and one Sentinel died, the remaining Sentinel had no majority → **no failover**, login errors for 25 minutes until someone promoted manually. Fix: 3 Sentinels across 3 zones, 2 replicas, Lettuce configured with Sentinels and a 2s timeout. Drilling a master shutdown: failover in ~7 seconds, app reconnected on its own, only ~0.3% of requests errored during the switch.

### Pitfalls
- Hard-coding the master IP in app config.
- Even number of Sentinels, or co-locating them with the master.
- No command timeout → threads hang when the master dies.
- Using Redis as the sole store for data that must not be lost (e.g. balances) while forgetting async replication.

### Interview-style answer
"Redis Sentinel is a group of processes that monitor and auto-failover a single-master, multiple-replica setup. There are two thresholds: quorum is how many Sentinels must agree the master is dead, and majority of all Sentinels is needed to elect the leader that performs failover. That is why I always use at least three Sentinels across three zones. The leader picks the replica with suitable priority and the largest replication offset, promotes it, points the other replicas at it, and publishes the new master. On the Java side, Lettuce in Spring Boot is configured with the Sentinel list instead of a master address; it asks for the master and reconnects on change, with a command timeout around two seconds and backoff retry for idempotent commands. Remember replication is async, so a few trailing writes can be lost on failover; min-replicas-to-write reduces that risk. If data or write volume exceeds one machine, move to Redis Cluster."

> Senior tip: drill with {{SENTINEL FAILOVER mymaster}} on staging and measure two numbers — how long the app errors and how many commands fail. If you have never measured, the client timeout/retry config is almost certainly wrong.`,
    follow: ['How does Redis Cluster failover work?', 'Sentinel quorum vs cluster quorum?', 'Lettuce auto-reconnect config?'],
  },
  'devops-139': {
    q: 'Kafka cluster HA: replication factor, min.insync.replicas, rack awareness, KRaft quorum?',
    a: `**Summary:** Kafka HA rests on **per-partition replication**: each partition has a **leader** and **followers**; the followers that keep up form the **ISR**. The standard config for important data is **replication.factor = 3**, **min.insync.replicas = 2**, producer **acks=all** — losing 1 broker still reads/writes normally, and no acknowledged message is lost. **Rack awareness** places the 3 copies in 3 zones. **KRaft** (mandatory since Kafka 4.0) replaces ZooKeeper with a **controller** group using the Raft consensus protocol to hold metadata.

### Replication, ISR and acks
- Producer writes to the leader; followers pull from the leader. A follower that falls behind by more than {{replica.lag.time.max.ms}} (default 30s) is removed from ISR.
- {{acks=all}}: the leader only returns OK when **every replica in the ISR** has the message. Combined with {{min.insync.replicas=2}}: if ISR drops below 2, the leader **rejects writes** ({{NotEnoughReplicasException}}) instead of accepting a single copy.
- Since Kafka 3.0, the producer defaults to {{acks=all}} and {{enable.idempotence=true}} (prevents duplicates on retry).

| RF / min.insync | Lose 1 broker | Lose 2 brokers |
|---|---|---|
| 3 / 2 | Read/write normal | Writes rejected, reads still work (data safe) |
| 3 / 1 | Writes normal | Still writes with 1 copy — losing that broker loses data |
| 2 / 2 | Writes rejected | — |

### Unclean leader election
{{unclean.leader.election.enable=false}} (default): only an ISR replica may become leader → no loss of acknowledged data, but a partition can become **unavailable** if all ISR members die. Enabling it prioritizes availability over data — only appropriate for logs/metrics where loss is acceptable.

### Rack awareness
Set {{broker.rack=ap-southeast-1a}} per broker → Kafka spreads the 3 copies of a partition across 3 racks/zones; losing a whole zone still leaves 2 copies. Consumers can read from a follower in the same zone ({{client.rack}} + {{replica.selector.class}}) to reduce cross-zone network cost.

### KRaft
- A controller group (usually 3 or 5) stores metadata (topics, partitions, ISR, config) in an internal log agreed via Raft; one controller is leader.
- Losing the controller leader → re-election in a few seconds; a majority of controllers must remain.
- Benefits over ZooKeeper: one system instead of two, faster metadata failover, supports far more partitions. Kafka 4.0 removed ZooKeeper entirely.

### Real-world example
Topic {{payment-events}} was configured RF=2, min.insync.replicas=1, producer acks=1 from the "move fast" era. During a rolling upgrade, one broker restarted exactly while the other was leader with a follower lagging behind; unclean election was off but acks=1 meant ~1,900 messages already ACKed existed only on the old leader and were lost when its disk failed. Payment reconciliation found the mismatch. Fix: RF=3, min.insync.replicas=2, acks=all, rack awareness across 3 zones, alerting on {{UnderReplicatedPartitions > 0}} and {{UnderMinIsrPartitionCount > 0}}. Subsequent upgrades lost no messages.

### Pitfalls
- RF=3 but min.insync.replicas=1 → still sometimes only one copy.
- Setting min.insync.replicas = RF → losing 1 broker stops writes.
- Leaving internal topics ({{__consumer_offsets}}, Kafka Streams/Connect topics) at low RF.
- Not monitoring under-replicated partitions — you only find out after data is lost.

### Interview-style answer
"Kafka achieves HA through per-partition replication: each partition has a leader and followers, and the followers that keep up form the ISR. For important data I use replication factor 3, min.insync.replicas 2, and producer acks=all; since Kafka 3 these are also the producer defaults along with idempotence. The leader then only ACKs once at least two copies hold the message; losing one broker still writes normally, losing two makes Kafka reject writes instead of accepting a single copy. I leave unclean leader election off so a leader is never chosen without the data. Rack awareness places the three copies in three zones, so losing a whole zone still leaves two. Metadata is managed by KRaft, a Raft-based controller group; Kafka 4 dropped ZooKeeper. I always alert when under-replicated or under-min-ISR partitions appear."

> Senior tip: periodically check the actual config of **every** topic ({{kafka-configs --describe}}), not just the broker defaults. Topics created automatically or by frameworks often carry a different RF and min.insync than you assume.`,
    follow: ['ZooKeeper vs KRaft?', 'What does unclean.leader.election.enable do?', 'Kafka replication lag alert?'],
  },
  'devops-140': {
    q: 'Elasticsearch cluster HA: master-eligible nodes, quorum, shard + replica, split-brain?',
    a: `**Summary:** Elasticsearch HA has two layers. **Coordination layer**: **master-eligible** nodes elect a master that manages cluster state (indices, mappings, shard placement) by **majority** in the **voting configuration** — since 7.x the cluster manages this list itself, so the old split-brain no longer happens when configured correctly. **Data layer**: each index is split into **primary shards**, and each primary has **replicas** on different nodes (and zones) — losing a node still reads/writes, and replicas rebuild automatically.

### Master and quorum
- Use **3 dedicated master-eligible nodes** (no data, small config) across 3 zones; losing 1 still leaves a 2/3 majority.
- Elasticsearch 7+ auto-adjusts the voting configuration when master-eligible nodes are added/removed; {{cluster.initial_master_nodes}} is needed only **on first cluster bootstrap** (then remove it from config).
- Before 7.x you had to set {{discovery.zen.minimum_master_nodes}} = N/2 + 1 yourself; getting it wrong is the classic split-brain source — two masters, two versions of the data.
- A busy master (long GC, too many shards) slows the whole cluster even when data nodes are healthy.

### Shard and replica
- Primary shard count is fixed at index creation (changing it requires reindex/split/shrink); replica count can change any time.
- A replica never sits on the same node as its primary; with **shard allocation awareness** ({{node.attr.zone}} + {{cluster.routing.allocation.awareness.attributes: zone}}) it is not in the same zone either.
- Writes go to the primary then sync to active replicas. Reads hit primary or replica, so replicas also boost search throughput.
- **Shard size** should be roughly 10-50GB; too many tiny shards overload the master and heap.

### Cluster state colors
| Color | Meaning |
|---|---|
| green | All primaries and replicas assigned |
| yellow | All primaries assigned, some replicas missing (at risk) |
| red | A primary unassigned → part of the data is unreadable/unwritable |
Investigate with {{GET _cluster/allocation/explain}} — it says why a shard is unassigned (disk over watermark, awareness rules, missing node).

### Real-world example
A logging cluster of 9 nodes where all 9 were master-eligible and data-bearing, with 4,800 shards (mostly under 1GB from daily per-service indices). Every long GC on the node that happened to be master dropped the master for 20-40s and backed up log writes. Redesign: 3 dedicated masters (4GB heap) in 3 zones, separate data nodes, weekly indices with 40GB size-based rollover via ILM, shard count down to ~600. No master drops in 6 months; a 2-hour zone power loss moved the cluster to yellow, then back to green after replicas rebuilt.

### Pitfalls
- 2 master-eligible nodes: losing 1 loses the majority, cluster stops.
- Making every node master-eligible in a large cluster → master competes with heavy queries.
- replicas = 0 for data you want to keep "to save space" → losing a node means red.
- Disk over watermark (default 85%/90%/95%) → no new shards assigned, then indices go read-only.

### Interview-style answer
"I look at Elasticsearch HA in two layers. The coordination layer is master-eligible nodes electing a master by majority in the voting configuration. I run three dedicated masters in three zones, small and data-free, so losing one still leaves a majority and the master is never slowed by heavy queries. Since 7.x the cluster manages the voting configuration itself, and you only need initial_master_nodes on first bootstrap, so the old split-brain from mis-setting minimum_master_nodes is gone. The data layer is primary shards plus replicas; a replica never shares a node with its primary, and with zone-based allocation awareness not a zone either. I keep shards around 10-50GB and use ILM to roll over. When the cluster is yellow or red, I use allocation explain to see why a shard is unassigned, usually disk watermark or awareness rules."

> Senior tip: track **total shards per node** and average shard size weekly. Most master-instability incidents in logging clusters come from "too many tiny shards," not from missing hardware.`,
    follow: ['Dedicated master node sizing?', 'Recommended shard size?', 'Cross-cluster replication?'],
  },
  'devops-141': {
    q: 'MongoDB replica set HA: primary/secondary, election, write concern, fencing?',
    a: `**Summary:** A MongoDB replica set has **one primary** that accepts writes and **secondaries** that replicate by reading the primary's **oplog**. When the primary loses contact with the majority, the nodes elect a new primary (Raft-based protocol) in about **10-12 seconds**. **Write concern** decides when a write is considered done: {{w: "majority"}} (default since MongoDB 5.0) guarantees an acknowledged write **will not be rolled back** on failover. An isolated old primary **steps down** because it can no longer see the majority — that is the mechanism preventing two primaries from accepting writes.

### Replication and oplog
- Every change on the primary is written to the oplog (a capped collection); secondaries continuously pull and apply it.
- **Oplog window** = how much time the oplog covers. A secondary that falls behind the window must re-sync from scratch (initial sync) — size the oplog for your longest maintenance.

### Election
- Each node heartbeats every 2 seconds; if the primary is unseen for longer than {{electionTimeoutMillis}} (default 10 seconds), a secondary becomes candidate and needs a **majority of voting members**.
- Higher {{priority}} and fresher data are preferred; priority 0 never becomes primary (e.g. a node in a DR DC).
- **Arbiter**: votes only, holds no data. Use it when you can only afford 2 data nodes, but it makes {{w: "majority"}} fragile (losing one data node in a P-S-A stalls majority writes) → 3 data nodes are recommended instead.

### Write concern and read concern
| Setting | Meaning | Risk |
|---|---|---|
| w: 1 | OK once primary wrote it | Failover may roll back writes not yet on a secondary |
| w: "majority" | Majority of nodes wrote it (with journal) | A few ms slower; safe on failover |
| readConcern "majority" | Only read data acknowledged by majority | Never reads data that will be rolled back |
| readPreference secondary | Read from a secondary | Data may be a few seconds stale |

### Fencing
An old primary isolated from the majority **steps down to secondary** once it can no longer reach the majority, so the minority side stops accepting majority writes. There can be a brief window where two nodes both think they are primary, but a {{w: "majority"}} write to the old primary can never reach a majority → it is never acknowledged. That is why majority matters for important data.

### Java side
~~~java
// Spring Data MongoDB / driver: retryable writes are on by default from driver 3.6+
MongoClientSettings settings = MongoClientSettings.builder()
    .applyConnectionString(new ConnectionString(
        "mongodb://m1,m2,m3/shop?replicaSet=rs0&w=majority&retryWrites=true"))
    .readPreference(ReadPreference.primaryPreferred())
    .build();   // driver discovers the new primary after election and retries the write once
~~~

### Real-world example
A scheduling app used MongoDB with 3 nodes and {{w: 1}} "from the old config." A 15-second network blip isolated the primary; while isolated it still accepted ~300 bookings, and after election those writes were **rolled back** (saved to the rollback dir, nobody noticed) — customers had confirmation messages but no bookings. Switching to {{w: "majority"}} with retryWrites, alerting on replication lag and monitoring the rollback dir: write latency rose ~3ms; no more "disappearing" bookings.

### Pitfalls
- P-S-A (arbiter) topology with majority write concern → writes stall when one data node is lost.
- Reading from a secondary for a "write then immediately read" flow → user sees stale data.
- Oplog too small → secondary needs initial sync of hours after maintenance.
- Connection string with a single host → driver cannot find the new primary.

### Interview-style answer
"A MongoDB replica set has one primary that accepts writes and secondaries that pull the primary's oplog to replicate. If the primary loses contact with the majority for about 10 seconds, the nodes elect a new primary using a Raft-based protocol, preferring higher priority and fresher data. What I care about most is write concern: for important data I use w majority, the default since 5.0, so an acknowledged write is never rolled back on failover. With w 1, an isolated primary still accepts writes and those writes get rolled back after election. Fencing here is the old primary stepping down once it loses the majority, and a majority write to the minority side can never be acknowledged. I use three data nodes rather than an arbiter, list all hosts in the connection string, enable retryWrites, and only read from secondaries when stale data is acceptable."

> Senior tip: check the actual write concern in the connection string and the cluster default ({{getDefaultRWConcern}}). Systems created before MongoDB 5.0 often still run w 1 without anyone knowing.`,
    follow: ['What is an arbiter and when to use one?', 'Read preference primary/secondary?', 'Sharded cluster HA?'],
  },
  'devops-142': {
    q: 'General HA design: odd node count, quorum, fencing, and periodic failover testing?',
    a: `**Summary:** Real HA needs four things: an **odd number of voting nodes** so there is always a clear majority, **quorum** so only the majority side can make decisions, **fencing** so the old node stops accepting writes before the new one takes over, and **periodic failover drills** to measure real RTO/RPO. Missing any one of them leaves a system that is "redundant on paper" but can still go down — or worse, corrupt data through split-brain.

### Why an odd number of nodes
Quorum = floor(N/2) + 1.
| Nodes | Quorum | Survives losing |
|---|---|---|
| 2 | 2 | 0 |
| 3 | 2 | 1 |
| 4 | 3 | 1 |
| 5 | 3 | 2 |
A fourth node does not improve tolerance over three — it only adds cost and one more party that must agree. With two sites, place a third node (or a lightweight **witness/arbiter**) at a third site to avoid a 50/50 split.

### What quorum solves
When the network partitions, neither side can tell whether the other is dead or the link is down. The simple rule: **only the side seeing the majority may act as primary**; the minority side stops accepting writes. etcd, Patroni, Kafka KRaft, MongoDB, Elasticsearch, and Redis Sentinel all follow this rule.

### Fencing
Quorum decides who may be primary, but the old node may not know it lost the role (long GC, slow network) and can still write. Fencing stops that:
- **STONITH** ("shoot the other node in the head"): power off via IPMI/cloud API before switching roles.
- **Revoke access to the resource**: detach volumes, change storage permissions, block IPs.
- **Fencing token**: each leadership change increments a sequence number; storage rejects writes carrying an old token.
- **Time-bound lease**: the primary must renew a lock; if it cannot renew, it stops on its own (watchdog).

### RTO and RPO
- **RTO** (Recovery Time Objective): maximum acceptable downtime.
- **RPO** (Recovery Point Objective): maximum acceptable data loss (expressed as time).
Synchronous replication → RPO ≈ 0 but slower writes and replica dependency; asynchronous → faster but RPO equals replication lag.

### Failover drills
- Scheduled (quarterly), starting in staging then production at low traffic, with a script and observers.
- Scenarios: kill the primary, partition the network, slow the disk, take down a whole zone.
- Measure: detection time, switchover time, application errors, data loss; compare against committed RTO/RPO.
- Tools: Chaos Mesh, LitmusChaos (Kubernetes), AWS Fault Injection Service, Toxiproxy for network latency.

### Real-world example
A system had a 2-node "active-standby" DB with a ping-based failover script and a 5-minute RTO commitment. The first drill (blocking the network between the two nodes) let both nodes become primary; the app wrote to both for 4 minutes → manual reconciliation. Redesign: 3 nodes + Patroni/etcd, fencing via watchdog, app connecting through a proxy that asks for the primary. Quarterly drills after that: RTO measured 14-20 seconds, RPO 0 (one synchronous replica), no split-brain.

### Pitfalls
- Two nodes deciding by pinging each other.
- Placing all three quorum nodes in the same zone/rack.
- HA on paper but never drilled.
- App without proper retry/timeout → a 15-second failover becomes 15 minutes of user-facing errors.

### Interview-style answer
"For me real HA needs four things. First, an odd number of voting nodes, because quorum is a majority: three nodes survive losing one, five survive losing two, and a fourth node does not improve tolerance over three. With two sites I add a witness at a third site. Second, quorum: when the network splits, only the side seeing the majority may be primary, and the minority stops accepting writes. Third, fencing, because the old node may not know it lost the role — say during a long GC — so it must be powered off, have its write access revoked, or use a fencing token and a time-bound lease. Fourth, periodic drills: kill the primary, partition the network, take down a zone, and measure switchover time and data loss against the committed RTO and RPO. I have seen a first drill of a two-node cluster expose split-brain with both nodes accepting writes for four minutes; after redesigning with three nodes and Patroni the measured RTO was under 20 seconds."

> Senior tip: after every drill, record the result in a fixed table (date, scenario, measured RTO, measured RPO, app errors). That table is the strongest evidence for auditors or customers asking about availability commitments.`,
    follow: ['Which chaos testing tools?', 'RPO vs RTO difference?', 'Multi-region HA?'],
  },
  'devops-143': {
    q: 'PostgreSQL vs MariaDB Galera vs MongoDB replica set: comparing HA for a Java backend?',
    a: `**Summary:** All three provide HA but with different philosophies. **PostgreSQL + Patroni**: one primary accepting writes, synchronous or asynchronous replicas, automatic failover — easy to reason about, strong transactions, fits OLTP like payments and orders. **MariaDB Galera**: every node accepts writes, near-instant sync — at the cost of write conflicts when multiple nodes change the same row and the whole cluster slowing to its slowest node. **MongoDB replica set**: one primary, built-in failover, write concern chosen per operation — fits document data with fast-changing schemas. I choose by **data model and consistency requirements first**, then HA.

### Comparison
| Criterion | PostgreSQL + Patroni | MariaDB Galera | MongoDB replica set |
|---|---|---|---|
| Write model | One primary | Many primaries | One primary |
| Replication | Streaming WAL, sync/async | Synchronous certification | Oplog, write-concern-based ack |
| Failover | Patroni + etcd, ~10-30s | No switchover; failed node removed | Built-in election, ~10-12s |
| Data loss on failover | 0 with sync replica; seconds with async | 0 for committed writes | 0 with w: majority |
| Write conflicts | None (single writer) | Certification failure when two nodes change same row | None (single writer) |
| Write scaling | Vertical, or sharding (Citus) | Not really (every node writes everything) | Sharded cluster |
| Java ecosystem | JPA/Hibernate, JDBC very mature | JPA/JDBC | Spring Data MongoDB, driver |

### When to choose
- **PostgreSQL**: relational data, constraints, multi-table transactions, SQL reporting — my default for most Java backends.
- **Galera**: an existing MySQL/MariaDB system needing HA without switchover; still **write to one node** through ProxySQL/MaxScale to avoid conflicts.
- **MongoDB**: nested documents, frequently changing schemas, access by aggregate; not ideal for complex multi-collection transactions (supported but costlier).
- On AWS: **Aurora PostgreSQL/MySQL** separates storage (6 copies across 3 AZs) from compute, failover usually under 30s — often replaces self-managed Patroni.

### Java application side — common to all three
- **Connect through a stable endpoint**: HAProxy/PgBouncer targeting the primary, MaxScale/ProxySQL, MongoDB connection string listing all hosts; JDBC PostgreSQL supports multiple hosts with {{targetServerType=primary}}.
- **Pool must drop dead connections fast**: Hikari {{maxLifetime}} shorter than proxy/DB timeout, {{connectionTimeout}} a few seconds; do not cache DNS too long (JVM {{networkaddress.cache.ttl}}).
- **Controlled retry** for transient errors during failover; retry only idempotent operations or whole transactions.
- **Read from replicas** only for queries that tolerate a few seconds of staleness.

### Real-world example
An e-commerce platform ran Galera with 3 nodes writing round-robin; every sale event had 1-2% of orders failing with "deadlock" from certification failure on the inventory table, and the node with slow disk dragged the whole cluster via flow control. When rebuilding the order module, the team chose **Aurora PostgreSQL** (one writer, two readers): drilled failover ~25s, app using the AWS JDBC driver with fast failover. The product catalog (varying attributes per category) moved to MongoDB with w: majority. Peak-time order errors dropped below 0.05%.

### Pitfalls
- Choosing a DB because "HA sounds cool" rather than by data model.
- Using Galera as free-form multi-primary then being surprised by deadlock errors.
- MongoDB with w: 1 for money data.
- App keeping connections to the old primary after failover due to pool/DNS cache.

### Interview-style answer
"I choose the database first by data model and consistency requirements, then by HA. PostgreSQL with Patroni is a single primary with sync or async replicas and automatic failover via etcd in roughly 10-30 seconds; it is easy to reason about and has strong transactions, so it is my default for OLTP like orders and payments. Galera lets every node accept writes with near-instant sync, but concurrent writes to the same row fail certification, and the slowest node drags the whole cluster, so in practice I still write to one node. MongoDB replica sets have built-in election and per-operation write concern; with w majority no acknowledged write is lost, which fits document data. On AWS I usually use Aurora instead of running Patroni myself. Whatever I choose, the Java side must connect through a stable endpoint, drop dead connections fast in the pool, and retry in a controlled way during failover."

> Senior tip: measure **application recovery time** after failover, not just DB failover time. A DB switchover in 20 seconds with a pool holding dead connections and 60-second DNS cache can become minutes of user-facing errors.`,
    follow: ['How does Aurora HA differ?', 'Multi-region DB strategy?', 'Connection pooling with HA DB?'],
  }
});
