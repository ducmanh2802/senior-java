/*
 * English translation of js/data/quiz-design.js — task T428. Format: js/core/i18n.js (content overlay).
 * ids: qz-microservices-017 qz-microservices-018 qz-microservices-019 qz-microservices-020 qz-scenario-007 qz-scenario-008 qz-scenario-009 qz-scenario-010 qz-scenario-011 qz-scenario-012 qz-scenario-013 qz-scenario-014 qz-scenario-015 qz-scenario-016 qz-scenario-017 qz-scenario-018 qz-scenario-019 qz-scenario-020
 */
App.i18n.content({
  'qz-microservices-017': {
    q: `Internal services authenticate each other with OAuth2 client credentials (JWT). Service B calls the auth server's introspection endpoint on every request, which creates 3,000 RPS on the auth server and adds 40 ms of latency. How do you improve this?`,
    options: [
      `Drop authentication between internal services because they are already inside the VPC`,
      `Cache the introspection result for 24 hours per token`,
      `Validate the JWT locally by checking the signature against the public key fetched from the JWKS endpoint (cached, refreshed automatically when an unknown key id appears), verify {{exp}}, {{iss}}, {{aud}} and scope; keep access tokens short-lived (a few minutes)`,
      `Switch to sending the client secret in every request so B can compare it itself`
    ],
    explain: `**Correct answer: validate the JWT locally with a cached JWKS.**

### Why this is correct
- The JWT is signed by the auth server; B only needs the public key to verify the signature and does not have to ask the auth server every time. Spring Security Resource Server does exactly this when you configure {{spring.security.oauth2.resourceserver.jwt.issuer-uri}} or {{jwk-set-uri}}.
- The JWKS is cached; when the auth server rotates keys, a new token carrying an unknown {{kid}} makes the library reload the JWKS.
- Checking {{aud}} matters a lot: a token issued to service C must not be accepted by B. Short-lived tokens limit the damage when one leaks, which makes up for not being able to revoke instantly.

### Why the other options are wrong
- **Drop auth inside the VPC**: the "trust the internal network" model no longer holds (zero trust); a single compromised service (SSRF, RCE) is enough for the attacker to call everything.
- **Cache introspection for 24 hours**: longer than the token lifetime, which defeats the point of introspection (checking whether a token was revoked); a short cache still leaves many calls.
- **Send the client secret on every request**: a long-lived secret travels all over the network and every service has to know every other service's secret; this is the opposite of what OAuth2 is for.

> Senior tip: introspection still fits opaque tokens, or when you need immediate revocation (for example sensitive financial operations). With a service mesh, mTLS authenticates service identity at the transport layer while the JWT carries user/scope information at the application layer; the two complement each other.`
  },
  'qz-microservices-018': {
    q: `Topic {{customer-state}} uses {{cleanup.policy=compact}} to always keep the latest state of each customer, keyed by customerId. A customer requests data deletion (GDPR). What is the correct way to delete from the topic?`,
    options: [
      `Send a record with the same key and an empty JSON object "{}" as the value`,
      `Manually delete the segment file that contains the record on the broker`,
      `Reduce the topic retention.ms to 1 second`,
      `Send a tombstone: a record with the same key and a {{null}} value; compaction deletes the older versions of that key, and the tombstone is kept for about {{delete.retention.ms}} so consumers can see it before it is removed`
    ],
    explain: `**Correct answer: send a tombstone (null value) for the key you want to delete.**

### Why this is correct
- Log compaction keeps at least the **latest** record for each key. A tombstone is the latest record with a null value, marking "this key has been deleted". When the log cleaner runs, the older versions of the key are removed.
- The tombstone is retained for {{delete.retention.ms}} (24 hours by default) so a slow consumer still receives it and deletes its local copy; after that the tombstone is removed too.
- Note: compaction only runs on closed segments, so the data does not disappear immediately; you can tune {{segment.ms}}, {{min.compaction.lag.ms}} or {{max.compaction.lag.ms}} if you have a deletion deadline.

### Why the other options are wrong
- **A "{}" value**: this is a valid value, so compaction keeps it as the latest one; the old data is replaced but the key still exists.
- **Manually deleting the segment file**: it corrupts the index and offsets and can break the broker; never touch log files directly.
- **Reducing retention.ms**: with a compaction-only policy, time-based retention does not apply; switching to compact,delete would delete the data of **every** customer.

> Senior tip: for GDPR requests on topics that are not compacted (event logs kept for a long time), the practical approach is crypto-shredding: encrypt personal data with a per-customer key, and deleting the key makes the data unreadable in every replica and backup.`
  },
  'qz-microservices-019': {
    q: `A pipeline reads from topic {{orders}}, computes, writes to topic {{invoices}}, and another consumer writes {{invoices}} into PostgreSQL. Which statements about exactly-once in Kafka are true? (Choose 2)`,
    options: [
      `Just enabling {{enable.idempotence=true}} makes the whole pipeline, including the PostgreSQL write, exactly-once`,
      `A transactional producer (transactional.id) can write the output and commit the input offset in the same transaction, which gives exactly-once for the consume-transform-produce flow inside Kafka`,
      `A consumer that must not see data from aborted transactions has to set {{isolation.level=read_committed}}, because the default is read_uncommitted`,
      `Setting acks=1 is enough for exactly-once`,
      `A Kafka transaction automatically rolls back the data already written to PostgreSQL`
    ],
    explain: `**Correct answer: a transactional producer for consume-transform-produce; and consumers must set read_committed.**

### Why this is correct
- With a transaction the producer calls {{sendOffsetsToTransaction}} to commit the input offset **in the same transaction** as the output records. Either both succeed or both abort: no loss, no duplicates within Kafka.
- Records of an aborted transaction stay in the log. A {{read_uncommitted}} consumer (the default) still reads them; only {{read_committed}} filters them out and reads only up to the last stable offset.

### Why the other options are wrong
- **Idempotence alone**: an idempotent producer only prevents duplicates caused by retries within one producer session; it covers neither the consumer, offsets, nor external systems.
- **acks=1**: weaker than the default even; if the leader dies before a follower has replicated, data is lost; transactions require acks=all.
- **PostgreSQL rollback**: a Kafka transaction does not coordinate with an external database. For the DB write step you need an idempotent consumer: store the offset or message id in the same DB transaction (inbox), or upsert by business key.

> Senior tip: in an interview, say clearly that "exactly-once in Kafka" is different from "exactly-once effect end-to-end". Most real systems use at-least-once plus an idempotent consumer because it is simpler and correct with every kind of sink.`
  },
  'qz-microservices-020': {
    q: `Every rolling deploy of the 6 consumer pods makes group {{invoice-sync}} rebalance continuously; all consumers stop processing and the lag spikes for several minutes. Which measure reduces the impact most effectively?`,
    options: [
      `Use static membership (a fixed {{group.instance.id}} per pod, for example the StatefulSet pod name) with {{session.timeout.ms}} longer than the time needed to restart one pod, combined with cooperative rebalancing (CooperativeStickyAssignor) so only the affected partitions are revoked`,
      `Lower session.timeout.ms to 1 second so rebalancing is faster`,
      `Disable rebalancing on the broker entirely`,
      `Give every pod its own consumer group so they do not affect each other`
    ],
    explain: `**Correct answer: static membership + cooperative rebalancing.**

### Why this is correct
- **Static membership** (KIP-345): the consumer has a fixed {{group.instance.id}}. When a pod restarts and comes back within {{session.timeout.ms}}, the coordinator recognizes the same member and hands back exactly the same partitions **without a rebalance**.
- **Cooperative rebalancing** (KIP-429): instead of every consumer revoking all its partitions (eager, stop-the-world), only the partitions that actually need to move are revoked; the other consumers keep processing. Since Kafka 3.x, the default value of {{partition.assignment.strategy}} is {{[RangeAssignor, CooperativeStickyAssignor]}}, but it still uses Range until you remove Range from the list.
- Kafka 4.0 makes the new consumer group protocol (KIP-848, {{group.protocol=consumer}}) generally available, with incremental rebalances coordinated by the broker, which also targets exactly this problem.

### Why the other options are wrong
- **session.timeout.ms 1 second**: a consumer is declared dead because of a short GC pause, so there are even more rebalances.
- **Disable rebalancing**: there is no such setting; rebalancing is the mandatory mechanism for handing out partitions when members change.
- **One group per pod**: each pod receives every message and processes it 6 times.

> Senior tip: also use {{maxUnavailable: 1}} on rolling updates and graceful shutdown (close the consumer properly so offsets are committed). Track the number of rebalances per hour; a sudden increase is often an early sign of a max.poll.interval.ms problem or a pod being OOMKilled.`
  },
  'qz-scenario-007': {
    q: `A transaction history API uses {{ORDER BY created_at DESC, id DESC LIMIT 50 OFFSET :offset}} on a table with 50 million rows. Page 1 takes 5 ms, page 2,000 (OFFSET 100,000) takes 4 seconds. Which fix is most appropriate?`,
    options: [
      `Adding an index on created_at is enough; OFFSET will then be as fast as on the first page`,
      `Keyset (seek) pagination: the client sends the (created_at, id) pair of the last row of the previous page, and the query becomes {{WHERE (created_at, id) < (:lastCreatedAt, :lastId) ORDER BY created_at DESC, id DESC LIMIT 50}} with a composite index on (created_at, id)`,
      `Increase PostgreSQL work_mem and shared_buffers`,
      `Cache all 50 million rows in Redis and paginate on Redis`
    ],
    explain: `**Correct answer: keyset pagination with a composite index.**

### Why this is correct
- {{OFFSET 100000}} forces the DB to **read and discard** 100,000 rows before returning 50. Even when it walks an index, the cost still grows linearly with the offset; the deeper the page, the slower it gets.
- Keyset jumps straight to the starting position through the index (the row value comparison {{(a, b) < (x, y)}} can use a composite index on PostgreSQL), so every page costs about the same as the first.
- Adding {{id}} to the sort key breaks ties when many rows share the same {{created_at}}, which prevents rows being lost or repeated between pages.

### Why the other options are wrong
- **Index on created_at only**: the index avoids the sort, but OFFSET still has to walk past 100,000 entries; deep pages stay slow.
- **Larger work_mem/shared_buffers**: it can reduce I/O but does not change the complexity; it also affects the whole database.
- **Cache 50 million rows in Redis**: it burns memory, is hard to keep in sync, and deep pagination on Redis has a similar cost.

### Trade-off
Keyset cannot jump to an arbitrary "page 2,000"; it only moves forward or backward. For a transaction history UI (infinite scroll, a "load more" button) that is acceptable; if you need page jumps, cap the maximum page number and suggest that users filter by date range.

> Senior tip: return an opaque cursor (base64 of created_at + id) instead of letting the client build the parameters itself, so that changing the sort key later does not break the API contract.`
  },
  'qz-scenario-008': {
    q: `An engineer runs the migration {{CREATE INDEX idx_orders_customer ON orders(customer_id)}} on an 80-million-row PostgreSQL table at 10 a.m. For 6 minutes, every INSERT/UPDATE into orders hangs and the order-placing API times out. How should it be done next time?`,
    options: [
      `Run the same statement at night, because CREATE INDEX usually does not lock anything`,
      `Set statement_timeout = 1s for the migration so it cancels itself if it takes too long`,
      `Use {{CREATE INDEX CONCURRENTLY}} (it runs outside a transaction block); if it fails it leaves an INVALID index that has to be dropped and recreated; set a short lock_timeout so it does not queue up and block other queries`,
      `Build the index on a replica and then fail over to that replica`
    ],
    explain: `**Correct answer: CREATE INDEX CONCURRENTLY, and handle the INVALID index if it fails.**

### Why this is correct
- A plain {{CREATE INDEX}} holds a SHARE lock on the table for the whole build: SELECTs still run but INSERT/UPDATE/DELETE are blocked. On 80 million rows the build takes several minutes, which is enough to take down the ordering flow.
- {{CONCURRENTLY}} only takes SHARE UPDATE EXCLUSIVE (it does not block writes), builds over several scans and waits for old transactions to finish. The cost: it is slower, it cannot run inside a transaction block (many migration tools need special configuration for this step), and if it fails it leaves the index in the INVALID state.
- A short {{lock_timeout}} (for example 5s) lets the migration give up instead of standing in the lock queue and making every query behind it queue up too.

### Why the other options are wrong
- **Run it at night, assuming there is no lock**: plain CREATE INDEX **does** block writes; running at night only reduces the blast radius, and a 24/7 system (payments) still hangs.
- **statement_timeout 1 second**: the index would never finish building; and it does not solve the write blocking during that second.
- **Build on a replica then fail over**: a physical replica is read-only and cannot build an index of its own; failing over just to run a migration is an unnecessary risk.

> Senior tip: in Flyway, a migration containing CONCURRENTLY must run outside a transaction (Flyway supports {{executeInTransaction=false}} for a script). After it runs, check {{pg_index.indisvalid}} to make sure no INVALID index is left behind, burning write cost without ever being used.`
  },
  'qz-scenario-009': {
    q: `A Spring Boot pod has a 2Gi memory limit and runs with {{-Xmx2g}}. The pod restarts every few hours, {{kubectl describe}} reports {{OOMKilled}} (exit code 137), but the logs contain no {{OutOfMemoryError}} and no heap dump is produced. What is the most likely cause?`,
    options: [
      `The heap has a memory leak; the JVM throws OutOfMemoryError but the log is lost`,
      `The liveness probe fails, so Kubernetes kills the pod`,
      `The node is short of CPU, so the kernel kills the process`,
      `The heap is allowed to use all 2Gi, and non-heap memory (metaspace, thread stacks, code cache, direct buffers, GC) pushes the total RSS above the limit; the kernel OOM killer kills the process; the heap should be about 70–75% of the limit (for example {{-XX:MaxRAMPercentage=75}})`
    ],
    explain: `**Correct answer: the process's total memory exceeds the container limit; the heap is not full.**

### Why this is correct
- The container memory limit caps the **whole RSS** of the process, not just the heap. The JVM also uses metaspace (class metadata), about 1 MB of stack per thread (200 threads is 200 MB), the JIT code cache, Netty/NIO direct buffers and internal GC structures.
- When RSS reaches the limit, the kernel (cgroup OOM killer) sends SIGKILL: the JVM gets no chance to write a log or a heap dump, and exit code 137 = 128 + 9 (SIGKILL).
- The fix: set {{-XX:MaxRAMPercentage=75}} (the JVM computes it from the container limit) or {{-Xmx}} around 1.4g; use Native Memory Tracking ({{-XX:NativeMemoryTracking=summary}}, {{jcmd <pid> VM.native_memory}}) to see the non-heap part.

### Why the other options are wrong
- **Heap leak, OOME log lost**: if the heap fills up, the JVM throws OutOfMemoryError inside the process (which is still alive), so the log and {{-XX:+HeapDumpOnOutOfMemoryError}} work; an OOMKilled state shows it was killed from the outside.
- **Liveness failure**: the restart reason would be liveness probe failed (usually exit code 143 with SIGTERM), not OOMKilled.
- **CPU shortage**: a CPU shortage causes throttling (slowness), not kills.

> Senior tip: set the memory request equal to the limit for Java services to avoid eviction when the node is short of memory, and alert when container_memory_working_set_bytes passes 90% of the limit for 10 minutes, before OOMKilled happens.`
  },
  'qz-scenario-010': {
    q: `A single Redis cluster is shared by the product cache, login sessions and distributed locks, configured with {{maxmemory-policy allkeys-lru}}. During a promotion peak, users get logged out at random and jobs run twice because locks "disappear". What is the right fix?`,
    options: [
      `Split Redis by purpose: the cache uses an instance with allkeys-lru (or allkeys-lfu); sessions and locks use a separate instance with noeviction (or volatile-*) and enough memory, with an alert when usage passes 80% of maxmemory`,
      `Switching the shared cluster to volatile-lru is enough, because sessions and locks all have a TTL so they will never be evicted`,
      `Disable maxmemory so Redis can use the machine's unlimited RAM`,
      `Raise the TTL of sessions and locks so they are evicted less often`
    ],
    explain: `**Correct answer: split Redis by purpose, with an eviction policy that matches each kind of data.**

### Why this is correct
- With {{allkeys-lru}}, when maxmemory is reached Redis evicts **any key** that has not been used recently, including sessions and locks. During a promotion peak the product cache grows sharply and pushes sessions and locks out.
- Cache data is temporary and can be reloaded; sessions and locks are **state** that must not be lost silently. The two have opposite requirements, so they need separate instances (or clusters). With {{noeviction}}, Redis returns an error to write commands when full; a clear error is better than silent data loss, and a memory alert lets you act before that point.

### Why the other options are wrong
- **volatile-lru on the shared cluster**: volatile-* only evicts keys that have a TTL. The cache, sessions and locks all have TTLs, so sessions and locks are still eviction candidates.
- **Disable maxmemory**: Redis uses up all the RAM, the machine swaps or gets killed by the OOM killer, and all data is lost at once.
- **Raise the TTL**: eviction does not care whether a TTL is long or short (with allkeys-lru), and longer TTLs make memory fill up faster.

> Senior tip: watch {{evicted_keys}} in {{INFO stats}}; on the instance that holds sessions and locks, this number must always be 0. Also, a lock used for correctness still needs a fencing token or a database constraint, because a Redis failover (asynchronous replication) can also lose a lock.`
  },
  'qz-scenario-011': {
    q: `Every rolling deploy of the payment service (10 pods on Kubernetes) makes clients see about 300 502/503 errors and a few "connection reset" errors. Which measures address the actual cause? (Choose 2)`,
    options: [
      `Add a preStop hook (for example a sleep of 5–10 seconds) so kube-proxy/Ingress has time to remove the pod from the endpoint list before the app starts shutting down`,
      `Raise the number of replicas from 10 to 30`,
      `Enable Spring Boot graceful shutdown ({{server.shutdown=graceful}}, the default since Boot 3.4) with a suitable {{spring.lifecycle.timeout-per-shutdown-phase}}, and set terminationGracePeriodSeconds larger than preStop plus the drain time`,
      `Set terminationGracePeriodSeconds to 0 so the old pod shuts down as fast as possible`,
      `Put a database check into the liveness probe`
    ],
    explain: `**Correct answer: a preStop delay and graceful shutdown with a long enough grace period.**

### Why this is correct
When a pod is deleted, two things happen **in parallel**: the kubelet sends SIGTERM to the container, and the control plane updates the EndpointSlice so nodes/Ingress stop sending traffic. The endpoint update takes a few seconds to propagate, and during that time traffic still reaches the pod that is shutting down.
- **preStop sleep**: delays SIGTERM by a few seconds so the endpoint is fully removed; by the time the app starts shutting down there are almost no new requests.
- **Graceful shutdown**: Spring Boot stops accepting new requests and waits for in-flight requests to finish (up to the timeout) instead of cutting them off, which avoids "connection reset" and half-finished transactions.
- terminationGracePeriodSeconds (30 seconds by default) must be larger than preStop plus the drain time, otherwise the kubelet sends SIGKILL halfway through.

### Why the other options are wrong
- **More replicas**: it lowers the error rate per pod but does not fix the mechanism; every pod that gets replaced still drops requests.
- **Grace period of 0**: it forces an immediate shutdown, every in-flight request is cut, and there are even more errors.
- **Liveness checking the DB**: unrelated to deploys, and it can cause a restart storm when the DB is flaky.

> Senior tip: prove it by running a load test (for example k6 at 500 RPS) during a deploy and demanding zero errors; add a PodDisruptionBudget and {{maxUnavailable: 0}}, {{maxSurge: 25%}} so there is always enough capacity while pods are replaced.`
  },
  'qz-scenario-012': {
    q: `After a database primary failover (the DNS endpoint points to the new node within about 30 seconds), many Java pods keep reporting connection errors or hanging requests for another 10–15 minutes before recovering on their own. What is the most likely cause?`,
    options: [
      `The new DB node runs slower than the old one`,
      `Connections in the pool still point to the dead old node; without a socket timeout or TCP keepalive, each connection waits until the OS reports an error (which can take many minutes); on top of that the JVM caches DNS results. You need to set socketTimeout/keepalive on the driver, a sensible HikariCP maxLifetime and a short DNS TTL`,
      `HikariCP does not support failover, so you have to switch to another connection pool`,
      `The application has to be rebuilt with the new IP address`
    ],
    explain: `**Correct answer: old connections hang because they have no timeout, plus DNS caching.**

### Why this is correct
- When the old node disappears suddenly (no FIN/RST), the open TCP connections in the pool do not know the peer is dead. A request that picks such a connection sends a query and waits for a response forever, until the OS TCP retransmission timeout runs out (on Linux that can be about 15 minutes with the default settings).
- The JVM may cache DNS results (the {{networkaddress.cache.ttl}} property); if it is set too high, new connections still go to the old IP.
- The fix: {{socketTimeout}} (PostgreSQL JDBC) so a query does not wait forever, enable {{tcpKeepAlive}}, set Hikari's {{maxLifetime}} shorter than the infrastructure timeout (for example 30 minutes), {{keepaliveTime}} to test idle connections, and a JVM DNS TTL of about 30–60 seconds.

### Why the other options are wrong
- **The new node is slower**: that does not explain connection errors that heal by themselves after 10–15 minutes.
- **HikariCP does not support failover**: the pool only manages connections; a broken connection is discarded and a new one is created against the current address. The problem is the timeouts, not the choice of pool.
- **Rebuild with the new IP**: the app connects through the DNS endpoint; rebuilding is unnecessary and defeats the purpose of the endpoint.

> Senior tip: make failover part of your game days: fail over deliberately in staging and measure the time from the failover until the error rate reaches 0. That number is your real RTO, and it is usually far from the "30 seconds" in the provider's documentation.`
  },
  'qz-scenario-013': {
    q: `About 2% of requests are rejected with the JWT error "token not yet valid" ({{nbf}}/{{iat}} in the future), and it only happens when a request lands on 1 of the 8 auth server pods. What is the cause and a sensible fix?`,
    options: [
      `The signing key of that pod differs from the other pods; keys have to be rotated across the whole system`,
      `The token is too long, so it gets truncated as it passes through the load balancer`,
      `The node running that pod has a skewed clock (clock skew) and signs tokens with an issuance time ahead of the real time on the service validating them; sync NTP on the node, add an offset alert and allow a small leeway (30–60 seconds) during validation`,
      `The JWT library has a bug, so the nbf and exp checks must be turned off completely`
    ],
    explain: `**Correct answer: clock skew on one node; fix NTP and add a small leeway.**

### Why this is correct
- {{iat}} (issued at) and {{nbf}} (not before) come from the clock of the machine that signs the token. If that machine runs **fast** by a few minutes, a service validating with the correct clock sees the token as "not yet valid".
- The error only appears when a request lands on one specific pod, and the rate matches that pod's share of the traffic: a very distinctive sign of a per-node problem.
- The root fix: sync NTP (chrony) on the node and monitor the offset. A small validation leeway (many libraries support a clock skew tolerance) is a sensible safety net, because clocks never match exactly.

### Why the other options are wrong
- **A different signing key**: it would cause an invalid signature error, not a time-related error.
- **Truncated token**: it causes parse/signature errors, not exactly this time-related message.
- **Turn off nbf/exp checks**: a leaked token would then work forever; a small leeway is completely different from disabling the checks.

> Senior tip: clock skew also causes harder-to-see errors elsewhere: TOTP/OTP, AWS SigV4 signatures (which require the time offset to be at most 5 minutes), log ordering and Snowflake IDs. Put an NTP offset metric on every node's dashboard.`
  },
  'qz-scenario-014': {
    q: `Partition 3 of topic {{orders}} has been stuck at offset 18,234 for 2 hours, and the lag of that partition has grown to 400 thousand while the other 11 partitions are normal. The log repeats the same JSON parse error. The team configured an error handler that retries without limit. What is the cause and the fix?`,
    options: [
      `The broker holding partition 3 has a disk failure, so the partition needs to be reassigned`,
      `The consumer of partition 3 is short of CPU, so that pod needs more resources`,
      `Add more partitions to spread the load away from partition 3`,
      `A poison pill: the record at offset 18,234 can never be processed, and the infinite retries block every record behind it in the partition; configure a limited number of retries and then send the record to a dead letter topic (for example {{DefaultErrorHandler}} + {{DeadLetterPublishingRecoverer}}), and classify non-retryable errors (deserialization) so they go to the DLT immediately`
    ],
    explain: `**Correct answer: a poison pill is blocking the partition; you need bounded retries and a dead letter topic.**

### Why this is correct
- Kafka processes records in order within a partition. One permanently failing record (malformed JSON) combined with unlimited retries keeps the consumer stuck at exactly that offset; the other partitions keep running, which is why only partition 3 lags.
- Spring Kafka: {{DefaultErrorHandler}} with a bounded {{BackOff}}, and when the attempts run out {{DeadLetterPublishingRecoverer}} sends the record to the {{orders.DLT}} topic with headers carrying the exception, then commits the offset and moves on.
- Deserialization errors should be wrapped by {{ErrorHandlingDeserializer}} so the consumer does not die in a loop before it reaches the listener; exceptions such as deserialization/validation are treated as not-retryable and go to the DLT immediately.

### Why the other options are wrong
- **Broker disk failure**: it would cause producer errors and broker logs, not a repeated JSON parse error in the consumer.
- **CPU shortage**: it causes uniform slowness, not an absolute stall at one offset, and the log would not repeat exactly one error.
- **More partitions**: the bad record is still in partition 3; new partitions do not help the data that already exists.

> Senior tip: a DLT needs an owner: a dashboard counting messages, an alert when new messages arrive, and a tool to replay from the DLT once the bug is fixed. A DLT nobody reads is just an organized way of losing data.`
  },
  'qz-scenario-015': {
    q: `This month's AWS bill is 3x last month's while traffic grew only 15%. Cost Explorer shows sharp cost increases under NAT Gateway and CloudWatch. Which causes/measures make sense? (Choose 2)`,
    options: [
      `Inbound internet traffic (data transfer IN) is charged heavily, so some users have to be blocked`,
      `Pods in private subnets read/write S3 through the NAT Gateway, so every GB incurs processing charges; add a VPC Gateway Endpoint for S3 (free of charge) so S3 traffic does not go through NAT`,
      `Buying Reserved Instances is what tripled the bill`,
      `A release turned on DEBUG log level, so the volume of logs shipped to CloudWatch Logs grew sharply (ingestion is billed per GB); set the log level back to INFO, sample logs, and set a retention policy on the log group`,
      `EC2 reading S3 in the same region is always billed for data transfer per GB`
    ],
    explain: `**Correct answer: S3 traffic going through the NAT Gateway; and DEBUG logs increasing CloudWatch Logs ingestion charges.**

### Why this is correct
- **NAT Gateway** charges per hour and per **GB processed** (about 0.045 USD/GB in us-east-1). A job reading/writing tens of TB of S3 through NAT costs thousands of dollars. A **Gateway endpoint** for S3 and DynamoDB is free; you only add a route to the route table.
- **CloudWatch Logs** charges ingestion per GB (about 0.50 USD/GB in us-east-1 for the Standard log class) plus storage. Turning on DEBUG can multiply the log volume by 10–50x. A log group without retention is kept forever.

### Why the other options are wrong
- **Data transfer IN is charged heavily**: inbound data from the internet into AWS is generally free; the charge is on the way out (OUT).
- **Reserved Instances tripled the bill**: RIs are a commitment that lowers the price; there may be an upfront payment, but it does not explain increases in NAT and CloudWatch.
- **EC2 reading S3 in the same region is always charged for transfer**: data transfer between S3 and EC2 in the same region is free (request charges still apply); the cost appears when traffic goes through the NAT Gateway or crosses regions.

> Senior tip: enable Cost Anomaly Detection and tag resources (team, service) so you immediately know who caused the increase. Add "check log level and log volume" to the release checklist; one DEBUG line inside a hot loop can cost thousands of dollars a month.`
  },
  'qz-scenario-016': {
    q: `At 8 p.m. on Saturday, requests to {{POST /api/auth/login}} jump from 50 to 3,000 RPS, 98% of them returning 401, coming from thousands of different IPs with only a few requests each, trying many different emails. What is the most sensible reaction?`,
    options: [
      `This is credential stuffing (reusing passwords leaked from other places): enable rate limiting per account and per device/ASN signal, enable CAPTCHA or a bot challenge at the WAF for the login endpoint, and monitor accounts with unusual successful logins so you can force a password change or step-up authentication`,
      `Block each IP one by one as failing requests show up`,
      `Turn the login feature off entirely until Monday morning`,
      `Permanently lock every account that fails once`
    ],
    explain: `**Correct answer: recognize credential stuffing and defend in layers by account, device and bot signals.**

### Why this is correct
- The signs: many IPs (botnet/residential proxies), few requests per IP, a different email on each attempt, and a high failure rate. The attacker uses email/password lists leaked from other services, hoping users reuse passwords.
- Because each IP sends only a few requests, IP-based limiting is nearly useless. You need other signals: attempt counts per account, device fingerprints, ASN/data center, and a challenge (CAPTCHA, bot management) only for suspicious traffic.
- 2% success at 3,000 RPS means dozens of accounts taken over every second: you have to monitor successful logins from suspicious sources, revoke sessions and require step-up authentication.

### Why the other options are wrong
- **Blocking IPs one by one**: thousands of IPs rotate constantly, so blocking cannot keep up and easily blocks real users behind shared NAT.
- **Turning login off**: the attacker achieves their denial-of-service goal; only consider it when nothing else is left.
- **Permanent lock after one failure**: the attacker can lock real users in bulk (account lockout DoS); use temporary locks with backoff.

> Senior tip: check new passwords against lists of breached passwords (for example the Have I Been Pwned k-anonymity API) and encourage MFA; in the long run, passkeys eliminate credential stuffing entirely.`
  },
  'qz-scenario-017': {
    q: `The "set avatar from URL" feature downloads an image from a URL that the user enters. A pentester enters {{http://169.254.169.254/latest/meta-data/iam/security-credentials/}} and gets back the EC2 instance's IAM role name. What is the correct and most complete remediation?`,
    options: [
      `Block the string "169.254.169.254" in the URL with a regex`,
      `Defend against SSRF in layers: only allow http/https, resolve DNS and then reject private/loopback/link-local IPs (check the IP again after every redirect, and connect to the exact IP you verified to avoid DNS rebinding), enforce IMDSv2 on EC2, and fetch images through an egress proxy that can only reach the internet`,
      `Only allow URLs that end in .jpg or .png`,
      `Change the IAM role to one with more permissions so other errors do not happen`
    ],
    explain: `**Correct answer: layered SSRF defense, checking the IP after resolution, IMDSv2, and an egress proxy.**

### Why this is correct
- SSRF turns your server into a "proxy" for calling into the internal network. 169.254.169.254 is the Instance Metadata Service; with IMDSv1 a simple GET reads the role's temporary credentials.
- Check by **IP after resolution**, not by string: an attacker can use a domain that points to an internal IP, decimal/hex notations, or a 302 redirect to an internal address. DNS rebinding swaps the IP between the check and the connection, so you must connect to exactly the IP you verified.
- **IMDSv2** requires fetching a token with a PUT request that carries a custom header; an SSRF that only sends GETs cannot do that. Set the hop limit to 1 so containers cannot reach it (depending on the network architecture).
- An egress proxy separates the external URL fetch from the internal network entirely.

### Why the other options are wrong
- **Regex blocking the IP string**: it is trivially bypassed with {{http://2852039166/}}, a domain pointing to that IP, IPv6, or a redirect.
- **Allow only .jpg/.png suffixes**: {{http://169.254.169.254/x?a.jpg}} is still valid; a URL suffix says nothing about the destination.
- **Granting more IAM permissions**: it makes the damage bigger when credentials leak; do the opposite (least privilege).

> Senior tip: after the fix, assume the role's credentials already leaked: check CloudTrail for unusual calls made with that role from unknown IPs. SSRF has caused many large data leaks on AWS, which is why it is such a common security interview question.`
  },
  'qz-scenario-018': {
    q: `The pricing service runs with a CPU limit of 1 core; the dashboard shows average CPU at only 35% of the limit, but p99 latency rises from 80 ms to 600 ms at peak. The metric {{container_cpu_cfs_throttled_periods_total}} rises sharply. Which explanation is correct?`,
    options: [
      `Average CPU is 35%, so CPU cannot be the cause; the problem must be in the database`,
      `Kubernetes lowers the pod's CPU when the node has higher-priority pods`,
      `The CFS quota is measured over 100 ms periods: bursts (many threads handling requests, parallel GC, JIT) use the whole 100 ms of CPU in the first few dozen ms of a period, and the rest of the period is throttled; the average stays low but requests are stalled. Raise or remove the CPU limit (keep the request), and consider the GC thread count/{{-XX:ActiveProcessorCount}}`,
      `The pod is short of memory, so its CPU is reduced`
    ],
    explain: `**Correct answer: CFS throttling caused by bursts inside each 100 ms period.**

### Why this is correct
- A 1-core limit means that in every 100 ms period the container may use a total of 100 ms of CPU **across all cores**. If 8 threads run in parallel on an 8-core node, the quota is exhausted after about 12.5 ms and then the whole container is stalled until the period ends: the request in flight absorbs up to about 87 ms of waiting, repeated over many periods.
- The per-minute average stays low because the app is idle most of the time; throttling is only really visible through the {{throttled_periods / periods}} ratio.
- The JVM sees the 1-core limit and picks its GC thread count accordingly; if you force a larger thread count, the bursts get worse.

### Why the other options are wrong
- **Low average CPU, so it is not CPU**: that is exactly the trap; the average hides the short throttled bursts.
- **Lowered because of higher-priority pods**: the CPU request guarantees a minimum share; quota throttling comes from the pod's own limit, not from other pods.
- **Memory shortage lowers CPU**: a memory shortage causes heavy GC or OOMKilled, not a rise in CFS throttled periods.

> Senior tip: many organizations set an accurate CPU request and drop the CPU limit for latency-sensitive services, relying on the request to share resources fairly. If a limit is mandatory, set it clearly above peak usage and alert when the throttled ratio exceeds 5%.`
  },
  'qz-scenario-019': {
    q: `After moving to Java 21 and enabling {{spring.threads.virtual.enabled=true}} (Spring Boot 3.2+), the order service occasionally freezes completely under load. The thread dump shows all carrier threads busy, with virtual threads "pinned" inside a {{synchronized}} block that wraps a blocking HTTP call to a partner. What is the cause and the fix?`,
    options: [
      `Virtual threads do not support HTTP clients, so you have to go back to platform threads`,
      `The number of virtual threads is capped at 256, so it runs out of threads`,
      `You need a bigger heap because each virtual thread takes 1 MB of stack`,
      `On Java 21, a virtual thread that blocks inside synchronized is pinned to its carrier thread; the number of carriers defaults to the number of cores, so a few slow calls take up every carrier. Replace synchronized with ReentrantLock around I/O, limit concurrency to the partner (Semaphore), and use the JFR event {{jdk.VirtualThreadPinned}} to find the pinning points; JDK 24 (JEP 491) removed pinning with synchronized`
    ],
    explain: `**Correct answer: pinning inside synchronized exhausts the carrier threads.**

### Why this is correct
- A virtual thread runs on a small pool of carrier threads (a ForkJoinPool, with as many carriers as cores by default). When a virtual thread blocks (I/O), it is normally **unmounted** so the carrier can serve another virtual thread.
- On Java 21–23, if a virtual thread blocks while holding a monitor ({{synchronized}}), it cannot unmount and instead **pins** its carrier. On an 8-core machine, only 8 requests waiting for the partner inside synchronized are enough to take every carrier, leaving thousands of other virtual threads waiting: the service freezes.
- The fix: use {{ReentrantLock}} (a virtual thread can unmount while waiting on this lock), narrow the synchronized region so it does not wrap I/O, and limit the number of concurrent calls to the partner. JDK 24 with JEP 491 lets virtual threads unmount even inside synchronized.

### Why the other options are wrong
- **No HTTP client support**: the JDK's blocking APIs (sockets, HttpClient) have been rewritten to cooperate with virtual threads.
- **A cap of 256 virtual threads**: there is no such limit; you can create millions of virtual threads. The number 256 is the default maximum of the carrier pool, not of virtual threads.
- **1 MB of stack per virtual thread**: a virtual thread's stack lives on the heap and grows on demand, usually only a few KB.

> Senior tip: virtual threads remove the old thread pool's "natural limit" (Tomcat's 200 threads). Set explicit limits on the resources behind them: the DB connection pool, a Semaphore for the partner; otherwise 10,000 concurrent requests all pile onto the downstream system.`
  },
  'qz-scenario-020': {
    q: `At 8 p.m. on Friday, the payment success rate drops from 99% to 60%. Within 15 minutes, 9 engineers are in the same chat channel, each testing a hypothesis, and one has already prepared a hotfix. As the senior engineer, what should you do? (Choose 2)`,
    options: [
      `Appoint a single Incident Commander to coordinate, and separate the communications role (posting status updates to stakeholders at a fixed cadence, for example every 30 minutes) from the investigation group`,
      `Wait until the root cause is found before deciding on a rollback, to avoid rolling back the wrong thing`,
      `Let everyone deploy their own hotfix so you can try things in parallel and go faster`,
      `Prioritize reducing the impact first: check the most recent changes (deploy, config, feature flag) and roll back or turn off the flag if it is related, then investigate the root cause`,
      `Name the person who caused the failure in the postmortem so it does not happen again`
    ],
    explain: `**Correct answer: appoint an Incident Commander and separate the communications role; prioritize mitigation (rollback/turn off the flag) before hunting for the root cause.**

### Why this is correct
- **Incident Commander**: 9 people testing hypotheses with no coordination easily leads to overlapping changes and nobody knowing what has changed. The IC assigns work (one person on the payment logs, one checking the partner, one reviewing recent changes), decides on actions and keeps the timeline. The communications role keeps the engineering group from being interrupted by questions from management.
- **Mitigate first**: every minute of an incident is lost revenue. Most incidents start from a recent change; a rollback is a cheap, reversible action that is often enough to restore service. The root cause can be found afterwards, in a stable environment.

### Why the other options are wrong
- **Wait for the root cause before rolling back**: it prolongs customer impact; a wrong rollback is cheap, waiting is expensive.
- **Everyone deploys their own hotfix**: many changes at once make the situation harder to understand, can cause a second incident, and you cannot tell which change helped.
- **Naming the person who caused the failure**: postmortems must be blameless; blaming people makes everyone hide information. The right question is "which system allowed this error to slip through?".

> Senior tip: agree on severity levels and rollback triggers in advance (for example, roll back immediately without a meeting if the success rate is below 95% for 5 minutes after a deploy). A decision made in advance is always faster than one made at 8 p.m. on a Friday.`
  }
});
