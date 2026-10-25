/*
 * English translation of js/data/q-scenario.js — task T203. Format: js/core/i18n.js (content overlay).
 * ids: scenario-015 scenario-016 scenario-017 scenario-018 scenario-019 scenario-020 scenario-021 scenario-022 scenario-023 scenario-024 scenario-025 scenario-026
 */
App.i18n.content({
  'scenario-015': {
    q: 'Java service runs out of memory (OOM) and restarts continuously on Kubernetes, every few hours. How do you diagnose and fix it?',
    a: `**Summary:** exit code 137 / OOMKilled means the container exceeded the cgroup memory limit — this is not a Java OutOfMemoryError. Assess the total: heap (Xmx/MaxRAMPercentage) + metaspace + native/Netty/threads must be smaller than the limit; diagnose with kubectl describe, container memory metrics, NativeMemoryTracking and heap dumps; fix by setting heap to ~ 60–75% of the limit and finding native leaks if any.

### Clarify requirements
- Exit code, restartCount, how long does each pod live? Does the final log contain a Java OutOfMemoryError?
- Current memory limit/request? Is the JVM configured with a static -Xmx or MaxRAMPercentage?
- Does the app use native libraries / Netty / Kafka direct buffers?

### Investigate / Analyze
- {{kubectl describe pod}}: see OOMKilled; {{kubectl top pod}} vs limit; Prometheus container_memory_working_set_bytes near limit.
- Calculate total JVM memory: heap + metaspace + code cache + thread stacks + direct buffers + GC overhead — heap 4GB on a 4GB limit almost certainly causes OOMKilled because native still needs several hundred MB.
- Enable {{-XX:NativeMemoryTracking=summary}} to see allocations; if Netty leak suspected, temporarily enable {{-Dio.netty.leakDetection.level=paranoid}}.
- Enable {{-XX:+HeapDumpOnOutOfMemoryError}} to analyze with MAT — but Java OOM is different from cgroup OOMKilled: if you never see a Java OOM in the logs, it is native.

### Solution
- Set {{-XX:MaxRAMPercentage=60–75}} (or explicit Xmx) so that heap + native + headroom stays below the limit; headroom at least ~15% of the limit.
- Limit direct buffers ({{-Dio.netty.maxDirectMemory}}), limit thread count (e.g., a smaller custom thread pool).
- If it is a heap leak: fix according to MAT; if native: limit buffers, check JNI layer.
- Size correctly: increase limit or reduce replication load; HPA based on memory — but do not scale horizontally if there is a leak, each pod leaks after respawn.
- Liveness/readiness should not rely on memory — it will trigger unnecessary restarts.

### Trade-off & pitfall
- MaxRAMPercentage too high (> 80%) makes OOMKilled very likely because native is not included in the heap.
- Forgetting to mount a volume for heap dumps: writes to ephemeral filesystem, easily fills disk and loses the dump file.
- Not enabling GC logs before deployment loses critical information; always enable under {{-Xlog:gc*:file=/logs/gc.log:time}}.

> Senior tip: my rule when providing a JVM on K8s: memory limit = heap × 1.25 + a few hundred MB (metaspace + threads + Netty). A pod with Xmx 1g and limit 1g will OOMKilled within days at peak GC hours. Enable NativeMemoryTracking on staging before production to know how much native your app uses.`,
    follow: [
      'How does JVM container awareness (UseContainerSupport) work and when does it fail?',
      'How do ZGC or G1 help with OOMKilled on K8s?'
    ],
  },
  'scenario-016': {
    q: 'Service memory grows slowly by about 200 MB per day and requires periodic restarts. How do you diagnose a memory leak?',
    a: `**Summary:** distinguish two types — heap leak (heap does not drop back to a low level after Full GC) and native/off-heap leak (RSS increases while heap stays stable). Heap: two heap dumps 24 hours apart → analyze with Eclipse MAT (Leak Suspects, Dominator Tree). Native: NativeMemoryTracking + pmap. Common errors: unbounded cache, ThreadLocal, unregistered listener, static Map.

### Clarify requirements
- Which source increases 200 MB/day: heap or total container RSS? After Full GC does it return to the old level?
- Any large cache in the app (Guava/Caffeine, local Redis) or native library?
- Does the leak grow with traffic (requests per day) or with time (timer job runs daily)?

### Investigate / Analyze
- Grafana: heap after GC line increases daily = heap leak; RSS increases when heap is stable = native leak.
- {{jcmd GC.heap_info}} / {{jstat -gcutil}} to track old gen after Full GC; heap dump with {{jmap -dump:live}} or automatic HeapDumpOnOutOfMemoryError — compare two dumps 24 hours apart.
- Eclipse MAT: Leak Suspects + Dominator Tree point to the objects retaining the most memory; histogram diff between the two dumps shows which class increased.
- If native: {{jcmd VM.native_memory summary}} diff over time; measure RSS with smaps, pmap to see which segment grows; if classloader leak during redeploy: check Metaspace.

### Solution
- Fix according to MAT results: common types and corresponding fixes:
- Unbounded cache: use Caffeine {{maximumSize}} + {{expireAfterWrite}}.
- ThreadLocal not removed in worker pool: remove inside finally.
- Listener/cache registered again on each restart without unregister: lifecycle placed correctly.
- Temporary: schedule pod restarts via cron as a resistance measure while waiting for the hotfix release.
- Prevention: always set maximumSize for caches, limit thread pools, and soak test with production-like data before release.

### Trade-off & pitfall
- Live heap dump on a large JVM causes a long stop-the-world — dump during low-traffic hours or use HeapDumpOnOutOfMemoryError (automatic).
- Cache TTL too long with infinitely generated keys is a very subtle leak menu; monitor eviction and size to catch it early.
- A very slow leak (10 MB/day) is hard to reproduce within a short sprint cycle — soak testing for at least one week is mandatory before release.

> Senior tip: Dominator Tree usually helps trace objects retaining large retained heap, but native leaks need different tools. If forced to restart periodically to reduce impact, treat it as a temporary measure with alerts and deadlines; still find the root cause and monitor trends.`,
    follow: [
      'How do you distinguish a heap leak from a native/off-heap leak to avoid the wrong direction?',
      'How should Caffeine cache TTL and max size be set for safe usage without leaks?'
    ],
  },
  'scenario-017': {
    q: 'A third-party service (payment, SMS, lookup) is slow or unstable, causing your system to collapse. How do you protect it?',
    a: `**Summary:** do not let a weak dependency drag you down — control it with three layers: clear short timeouts, circuit breaker (Resilience4j) + retry with backoff/jitter, bulkhead to separate threads; write to DB first and send later (outbox) when possible; have a stale-data fallback; never hold a DB connection or lock while waiting for an external call.

### Clarify requirements
- Which third party, how important is it (synchronous payment verification or auxiliary feature)? What is their SLA, do they have a health check?
- Currently: synchronous blocking call, is there any timeout, how is the thread / connection pool configured?
- Acceptable UX: report error immediately, return old data (cached), or queue and notify later?

### Investigate / Analyze
- APM external span: measure latency distribution per dependency, error %, identify which dependency participates in the p99 chain.
- Reproduce the incident: when the third party takes 30s, how many of your threads get stuck, how does the pool get depleted — the cascade phenomenon.
- Classification: which dependency is mandatory synchronous (card verification) vs can be asynchronous (email, log).

### Solution
- Clear timeouts: connect under 1s, read 2–5s depending on business; library defaults (60s or infinite) are deadly.
- Resilience4j:
~~~java
CircuitBreaker cb = CircuitBreaker.of("partnerA", cbCfg);   // stop calling when errorRate exceeds threshold
Bulkhead bh = Bulkhead.of("partnerA", bhCfg);               // limit concurrent calls
Retry rt = Retry.of("partnerA", retryCfg);                  // 2 times, backoff + jitter
// recommended order: Retry outermost -> CircuitBreaker -> Bulkhead -> call
// (CB open stops retry immediately, each attempt is counted by CB)
// rt.decorateSupplier(cb.decorateSupplier(bh.decorateSupplier(() -> partner.call())))
~~~
- Fallback: cache the last good result (stale-while-error), return with a label "old data"; if the business accepts async → write DB first (outbox), worker sends later, respond immediately to the user.
- Separate threads: external calls run on their own thread pool (bulkhead) or WebClient non-blocking — do not consume all HTTP threads; do not hold DB connections while waiting (do not wrap HTTP call in a transaction).
- Reduce load when broken: CB open → disable auxiliary features (SMS, recommendation), keep the main flow.

### Trade-off & pitfall
- Retry storm: many retries at once multiply load on an already weak third party — must use backoff + jitter + retry budget.
- Circuit breaker too sensitive often opens and stops a good service — set according to real SLO + separate health probe.
- Bulkhead within the process does not save if DB is also blocked by the same waiting threads — rule: never call HTTP inside a transaction.

> Senior tip: timeout + retry.backoff + circuit breaker must exist from day one, not added after an error. I once saw a payment partner with p99 4s drag down the entire cluster because 20 threads called synchronously with a 30s timeout; adding Bulkhead 5 + 3s timeout + CB took 2 hours of coding and saved many on-call nights.`,
    follow: [
      'What timeout is reasonable for each call type (card verification vs payment)?',
      'When the circuit breaker is open and traffic still arrives — what fallback avoids an infinite queue?'
    ],
  },
  'scenario-018': {
    q: 'Cache hot keys expire at peak hours, causing thousands of DB QPS (cache stampede). And if Redis goes down? How do you design for this?',
    a: `**Summary:** stampede is prevented by 4 layers: TTL with jitter, single-flight per key (Redis lock), stale-while-revalidate and probabilistic early refresh (XFetch). When Redis is down: circuit breaker for fast fail, serve stale from Caffeine layer 2, protect DB with semaphore/rate limit prioritizing the main flow; never let full traffic rush to the DB.

### Clarify requirements
- What does the cache contain (product list, session, currency rate)? What is the QPS of the hottest key?
- When Redis is down, how many DB QPS can it handle before collapsing (determines the fallback)?
- Which Redis mode is running (single, Sentinel, Cluster), expected RTO?

### Investigate / Analyze
- Simulate: delete a hot key and measure DB QPS — see a spike at the second it expires.
- Check configuration: uniform TTL (no jitter), no single-flight, no serve stale.
- Measure cache hit ratio trend + DB load spike around expiration time.

### Solution
- Always add jitter to TTL: {{ttl = base + random(0, 300s)}} so thousands of keys do not expire at the same second.
- Stampede protection:
~~~java
// layer 2: Caffeine inside JVM; get(key, loader) automatically provides single-flight per key
Object v = localCache.get(key, k -> loadWithRedisLock(k));
// loadWithRedisLock: read Redis -> miss then SET NX EX lock per-key -> load DB
~~~
  In addition to the JVM, use per-key lock (SET NX EX 10s): one instance loads, others wait then read the cache again.
- Probabilistic early refresh (XFetch): refresh early when {{now - delta * beta * ln(random()) >= expiry}} (delta = recompute time, beta ≈ 1; random in (0,1) so ln is negative) — the closer to expiration, the higher the probability of refresh, so keys stay fresh and never experience sudden expiration.
- Redis down: Resilience4j CircuitBreaker for Redis client (fail fast instead of 5s timeout per request); Caffeine serves stale; if stale also runs out → semaphore to limit DB requests, the rest return a well-behaved error.
- Redis architecture: Sentinel / Cluster for HA; client with autodiscovery (Lettuce); test failover for real, do not rely on theory.

### Trade-off & pitfall
- Per-key lock must have a short TTL to prevent the holder from dying; single-flight inside JVM only saves one instance — must combine with Redis lock for multiple instances.
- Serving stale for too long causes data divergence (price, inventory) — only use for loose data types, never for balance.
- Stampede also reappears after Redis failover (empty cache) — need a warm-up scenario after restart.

> Senior tip: my standard formula: TTL + jitter, Caffeine layer 2, per-key lock on miss, XFetch early refresh. For a hot key (main banner), I refresh in the background every 1–2 minutes and never let the key expire — the stampede problem is eliminated, no need to guess TTL.`,
    follow: [
      'How does XFetch probabilistic early refresh work, and how is parameter k chosen based on key importance?',
      'In case of Redis Cluster failover (empty cache): how do you warm up the cache so DB does not take the full load?'
    ],
  },
  'scenario-019': {
    q: 'The system is about to receive 10x traffic during a big promotion event. What do you prepare?',
    a: `**Summary:** correct order: load test at 10x to identify bottlenecks per layer (app, pool, DB, third party); pre-scale on schedule before the event (HPA reactive is too slow); control incoming traffic (rate limiting, queue, waiting room); degraded mode ready (disable auxiliary features); runbook and game-day rehearsal before the event.

### Clarify requirements
- What event (flash sale, payroll, marketing)? Traffic profile: peak RPS, duration, read/write ratio.
- Which features must maintain absolute SLO (payment, login), which can be cut (suggestions, statements)?
- How much pre-provisioned infrastructure budget is allowed for peak days?

### Investigate / Analyze
- Load test (k6/Gatling) at 2x, 5x, 10x with realistic profile — identify bottleneck at app CPU, DB connection pool, or third-party limit (SMS, bank gateway).
- Identify current peak: how many RPS the system can handle before latency exceeds SLO.
- List all external caps: LB connection limits, K8s node pool, DB connection limits, third-party API quotas, ESP/SMTP quotas.

### Solution
- **Pre-scale:** increase HPA min replicas on schedule before the event; preload node pool; warm up cache + connection pool; CDN for statics.
- **Traffic control:** per-user rate limit (token bucket) + tiered API priority: (1) payment/login, (2) lookup, (3) secondary features; queue writes that are not blocking (email/SMS receipt), respond immediately "recorded, SMS will arrive".
- **Waiting room:** when near saturation, queue at the LB/CDN layer with order number updates — keep the experience from dying.
- **Degraded mode ready with feature flags:** disable in predefined order (recommendation → export → detailed history), keep only the main flow.
- **Precompute:** price/promotion tables computed in advance by version key; measure and clearly record partner quotas (bank gateway can be hard-capped at 50 TPS).
- **Runbook:** pre-packaged decisions (which limit to increase, what to disable, which queue to open); APM dashboard, SLO alert, enough on-call staff on event day.

### Trade-off & pitfall
- Forgetting third-party quotas is a hard cap — design must follow it (queue + backpressure), not just scale your own infrastructure.
- Cache invalidation at the exact stressful moment can kill the site — hot data precomputed by version key, not deleted by short TTL.
- HPA reactive cannot keep up with 10x within 15 minutes — scheduled scaling + keep-warm is mandatory; CPU trigger is only supplementary.

> Senior tip: a system that has not survived 10x has not been tested at 10x — I always organize a game day (rehearse cache down, partner down, pod scale failure) before a major event, scoring each scenario; on event day I only follow the runbook and record coefficients for the next plan.`,
    follow: [
      'Which scenarios should a game day focus on (cache down, partner down, pod scale failure)?',
      'Waiting room design at which layer (CDN vs app server)?'
    ],
  },
  'scenario-020': {
    q: 'User presses the "Pay" button twice (or the client retries after timeout), causing the system to deduct money twice. How do you fix it?',
    a: `**Summary:** use an idempotency key — the client generates a unique key for each payment intent and keeps the same key on retry; the server stores the key + result in a table with a unique constraint, and duplicate requests return the old result; underneath, a DB unique constraint prevents race conditions between nodes; the external payment gateway also uses its own idempotency header.

### Clarify requirements
- Where does the retry come from: user double-click, HTTP client timeout, or automatic retry? The most common is timeout.
- Can the amount change between retries? How long is the idempotency window (24h, 48h)?
- Does the third-party gateway (MoMo, Stripe) support its own idempotency header?

### Investigate / Analyze
- Distinguish two sources of double charge: (a) client sends two separate requests creating two transactions; (b) server finishes processing but the response is lost (HTTP timeout) → client retries.
- Check code: does each POST /pay create a new order, or use the same order_id/idempotency key?
- Check DB: is there any unique constraint on (order_id, transaction_type)?

### Solution
- Idempotency keys table with unique constraint:
~~~sql
CREATE TABLE idempotency_keys (
  key_id varchar(64) PRIMARY KEY,
  request_hash char(64),
  response_body text,
  created_at timestamptz
);
-- INSERT ... ON CONFLICT (key_id) DO NOTHING
-- rowsAffected = 0 -> return stored response_body (safe retry)
~~~
- Inside the service: a simple state machine (PENDING → PAID) and conditional UPDATE:
~~~sql
UPDATE payments SET status = 'PAID'
WHERE id = :pid AND status = 'PENDING';
-- rowsAffected = 0 means already processed, do not deduct again
~~~
- HTTP client: every retry of the same request sends the same key; changing the body must change the key; TTL 24–48h is long enough for network flaps.
- Third-party gateway (Stripe/MoMo): pass their idempotency header on each call, do not create an intermediate key.

### Trade-off & pitfall
- Checking only at the service layer is not enough: two nodes processing in parallel can both pass — only the DB unique constraint is the real source of truth.
- Security: the key must be tied to user_id; always check request_hash before returning a cached response, to avoid returning an old result for a different request with the same content.
- Key TTL too short (< actual retry time) causes double; a long TTL only costs storage — prefer safety.

> Senior tip: the structured answer that always scores in interviews: (1) idempotency key for safe retry, (2) DB unique constraint to prevent race between nodes, (3) state machine so only one transition runs. A real case I handled with MoMo gateway: every retry within 24h must return the same result — even if the money has already passed to the partner.`,
    follow: [
      'If the gateway returns a timeout (unknown result), how do you combine it with idempotency?',
      'How do you handle request hash when the client sends the same intent but changes harmless fields (headers)?'
    ],
  },
  'scenario-021': {
    q: 'Kafka message is processed repeatedly by the consumer, and sometimes processed out of order. What is the cause and how do you design against both problems?',
    a: `**Summary:** Kafka at-least-once means duplicates are normal — the consumer must be idempotent: every event has a unique event_id and an upsert by DB unique key; order is guaranteed by Kafka only within a single partition — choose partition key = business key (accountId) and process sequentially within one partition; if parallel processing is required, use a resequencer based on timestamp/version.

### Clarify requirements
- What type of event, does it have a unique event_id from the producer? How many consumer instances, average processing time per message?
- Between which messages is order important (same user, same order)? Define the scope clearly.
- Is eventually consistent with out-of-order events acceptable?

### Investigate / Analyze
- Source of duplicates: producer retry (acks, broker restart), consumer rebalance before committing offset, or business re-publish — measure each type.
- Source of out-of-order: consumer processes in parallel with a thread pool, retry to DLT then returns to an old message after a newer one was already processed, or wrong partition key.
- Check broker: min.insync.replicas, unclean.leader.election, commit interval — affect scale of duplicates/loss.

### Solution
- Idempotent consumer:
~~~sql
INSERT INTO processed_events (event_id, payload_hash) VALUES (?, ?)
ON CONFLICT (event_id) DO NOTHING;
-- rowsAffected = 1 only runs business logic; = 0 means already processed
~~~
- Order: partition key = domain (accountId, orderId); every event with the same domain goes to the same partition; within a partition Kafka guarantees order.
- If parallel processing by key is required: resequencer based on {{source_ts}} or version, buffer state per key waiting for previous events (with timeout).
- Non-duplicate emission: use transactional outbox — write DB + event in the same transaction; producer {{enable.idempotence=true}}; consumer turns off auto commit, only commits after processing is complete.
- DLT: messages that cannot be processed are pushed to a dead-letter topic with error details, with an alarm; do not discard silently.

### Trade-off & pitfall
- {{max.poll.interval.ms}} too short when processing takes a long time → rebalance loop, creates more duplicates; idempotency must handle this — or increase the interval.
- Do not expect exactly-once automatically from Kafka — an idempotent consumer is mandatory; exactly-once semantics only work within a specific producer-consumer scope.
- When partition count increases / repartitioning, the same key may change partition — the resequencer needs a reliable source, not just receive order.

> Senior tip: duplicate is not a Kafka bug but a distributed-system design challenge; the rule I enforce in code review: "every event must have event_id from the source and source_ts" — these two fields make debugging and reconciliation hundreds of times easier.`,
    follow: [
      'How does transactional outbox combine with Kafka so events are not lost when DB commits but publish fails?',
      'Resequencer buffer per key with timeout — detailed design?'
    ],
  },
  'scenario-022': {
    q: 'During migration to a new system, you must keep data synchronized between legacy and new systems running in parallel. How do you design to avoid drift?',
    a: `**Summary:** do not use manual dual-write (very easy to drift when one side fails) — use CDC (Debezium) as the main one-way path, or outbox if dual-write is required; periodically reconcile by bucket to detect and fix drift; migrate gradually by user cohort with feature flags; short freeze window at final cutover.

### Clarify requirements
- Migration strategy: big bang, strangler, or long dual-run? Do both systems write to the same data?
- Legacy DB engine (Oracle, SQL Server, MySQL), is CDC allowed? Can schema be changed?
- Is absolute accuracy required or is eventual consistency acceptable? How long is the migration period?

### Investigate / Analyze
- Assess dual-write drift cost: each failure on one side creates a type of drift that must be repaired; estimate number of drift cases.
- Check data format: timezone, decimal precision, charset, collation, enums may have different meanings.
- Track daily sync volume to forecast load and delay.

### Solution
- CDC: Debezium captures legacy DB binlog/WAL → Kafka; new system consumes events or loads them into the new DB per entity; one-way to avoid dual-write drift.
- If dual-write is required (CDC not allowed): outbox pattern — write DB + event in one transaction; the other side uses idempotent upsert; do not manually write without rollback.
- Reconciliation: daily job compares count / total amount / hash by bucket (account + date); drift dashboard; auto-repair simple cases.
- Cutover: shadow-read first (read both, compare and log drift, do not return to user), migrate by user cohort with feature flag, finally a short freeze window (~15 minutes) to snapshot, switch, then reopen traffic.

### Trade-off & pitfall
- Dual-write without a full transaction → each failure on one side is a drift case; reconciliation is always required, with no exceptions.
- Timezone and decimal precision differences — float vs numeric or different scales (2 vs 4 decimal places) cause drift of a few cents per row; standardize before syncing.
- Cutover schema: add a new/old schema version flag to stay compatible during the first weeks of cutover.

> Senior tip: a large migration wins not in the technical plan but in the reconciliation dashboard — I always build a drift dashboard showing the number of drifted rows by day; CDC + outbox + shadow read is the durable foundation; a "perfect plan" without reconciliation often leads to more danger.`,
    follow: [
      'Shadow-read during migration: how to compare results reasonably without large overhead on production?',
      'How long should the final freeze window be and how is rollback designed if the switch fails immediately?'
    ],
  },
  'scenario-023': {
    q: 'Reconciliation with a partner shows discrepancies: transactions exist on our side but not on the partner side, and vice versa. How do you build the process?',
    a: `**Summary:** build a match engine: load the partner file/API, verify control total first, match by business key (ref_no, amount, date), classify into 4 groups (matched, amount mismatch, ours-only, theirs-only), queue discrepancies with aging SLA; identify the cause per group before auto-fixing; pending transactions go into a suspense account.

### Clarify requirements
- How does the partner send reconciliation (file, API), at what frequency? What is their cut-off time?
- Daily transaction volume, expected discrepancy rate, how many OPS staff to handle cases?
- Has the discrepancy been analyzed by cause (fee, rounding, FX, pending, fraud)?

### Investigate / Analyze
- Classify discrepancies by bin: matched clean, amount mismatch (fee, rounding, exchange rate), ours-only (not yet settled), theirs-only (suspicious); measure the value ratio of each bin.
- Check cut-off: our 23:58 transaction appears in the partner file the next day — common false positive; file resend on the same day easily overwrites the unique key.
- Confirm file control total (line count + total amount) before matching.

### Solution
- Import pipeline: load file, verify checksum + control total; staging unique (partner_id, ref_no, file_date) — file resend skips automatically thanks to ON CONFLICT DO NOTHING.
- Match engine:
~~~sql
-- ours-only: we have, partner does not
SELECT o.ref_no FROM our_tx o
LEFT JOIN partner_tx p USING (ref_no) WHERE p.ref_no IS NULL;
-- theirs-only and amount mismatch: FULL OUTER JOIN + amount comparison
~~~
- Queue discrepancies with aging SLA: T+1 must process at least 95%; prioritize by value (largest first); dashboard reports daily.
- Small-value auto-fix by threshold (e.g., discrepancy under 1,000 VND auto-recorded, with audit log); larger values require manual review + notes; each fix has an audit log (who fixed, reason).
- Pending unclear transactions: record in suspense account; by end of day reconciliation suspense must be zero or explained.

### Trade-off & pitfall
- Over-aggressive auto-fix can incorrectly record fees/bank charges — thresholds must be per partner and large values always require manual review.
- Match key must be normalized first: partner schema differences (ref 16 digits, zero padding...) — validator per schema version.
- Partner pending status settles after T+1 — do not put pending into discrepancy queue too early, wait for T+3 then review again.

> Senior tip: my goal for reconciliation: 99.9% match rate by transaction count but do not forget value — a discrepancy of 5 billion VND must be alerted immediately, not wait for month-end report; the reconciliation dashboard always has 2 KPIs: count match rate and value variance per day.`,
    follow: [
      'How is the suspense account designed in double-entry ledger and when does it return to zero?',
      'How do you detect partner schema file changes early before import succeeds?'
    ],
  },
  'scenario-024': {
    q: 'A log is found to contain sensitive customer information, and a secret (DB password) has been committed to git. How do you handle the security incident?',
    a: `**Summary:** a committed secret is considered exposed — rotate/revoke immediately within the first minutes, then clean git history (git filter-repo) and scan artifacts; PII in logs: redact at source (logback masking), purge stored logs, assess impact and notify according to regulations (Decree 13/GDPR); finally prevent: pre-commit scan, log schema, audit.

### Clarify requirements
- Only secret, or also real customer data (name, citizen ID, card number)? Which regulations apply (Decree 13, GDPR)?
- In which repo (private/public) is the secret, who has clone access, are there forks/mirrors?
- Is there an incident/security team process and ISMS (ISO 27001) to report?

### Investigate / Analyze
- Secret: scan git history with gitleaks/trufflehog — identify which credential, since when, any forks; check cloud access logs for unusual IP usage.
- PII logs: identify log repositories (ELK, Loki, CloudWatch), exposure period, affected users, data types.
- Safe assumption: scraping bots only need a few minutes on a public repo — always consider the data as read.

### Solution
- Secret (in order):
  1. **Rotate/Revoke** — revoke old credential, create new one, update vault/parameter store; restart service reading new config. Rotation first, clean history second.
  2. Clean history with {{git filter-repo --path service.env --invert-paths}} or BFG; force-push; clones must be re-cloned.
  3. Scan artifacts: docker image layers (credential can be in old layers), CI variable cache; revoke any unrotated credentials.
- PII logs:
  1. Add masking to logback (regex for citizen ID, card number, email); log only ID/hash, not full object.
  2. Purge old indexes in ELK or apply short retention; synchronize cleanup with backups.
  3. Impact assessment (who was exposed, what, since when) — decide user/authority notification according to Decree 13 / GDPR 72h.
- Prevent: pre-commit hook gitleaks, CI scan trufflehog, automated log redaction test in CI.

### Trade-off & pitfall
- Force-push does not guarantee full deletion: mirrors, forks, VCS caching — rotation is the only certain way to invalidate the old credential.
- Only fixing current logs while ignoring backup/index snapshots — PII remains by TTL; purge must apply to backups too.
- Masking regex easily misses unusual formats (13-digit vs 16-digit cards, old/new citizen IDs) — test with real datasets.

> Senior tip: the common wrong interview answer is "I delete the commit and it's done" — the correct answer: "rotate within the first minute because bots scan GitHub within minutes after commit; cleaning history is step two". There was an AWS credential used within 10 minutes after a repo went public; pre-commit + CI scan is the first defense.`,
    follow: [
      'How to detect a secret commit early before it is exploited (proactive alert)?',
      'PII in logs: mask at which layer (logback pattern vs Jackson serializer)?'
    ],
  },
  'scenario-025': {
    q: 'Design a double-entry accounting ledger for wallet/accounts: tables, constraints, and why not update balance directly?',
    a: `**Summary:** two tables: entry_groups (one transaction) and ledger_entries (debit/credit lines, append-only), plus account_balances table is unnecessary if derivable; constraints: total debit = total credit in group, amount > 0, unique txn_ref (idempotency); do not update balance directly because audit is lost, errors cannot be traced, and historical balances cannot be reconstructed.

### Clarify requirements
- Scope: simple internal wallet or multi-currency, multi-department (tax, revenue)?
- Daily transaction volume? Is point-in-time balance query required?
- Audit requirements: every adjustment must have a reversal entry, no direct update/delete?

### Investigate / Analyze
- Proposed schema:
~~~sql
CREATE TABLE ledger_entries (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entry_group_id uuid NOT NULL,
  account_id bigint NOT NULL,
  dc char(1) NOT NULL CHECK (dc IN ('D','C')),
  amount bigint NOT NULL CHECK (amount > 0),   -- minor units (VND: dong, USD: cents)
  memo text,
  created_at timestamptz NOT NULL
);
CREATE TABLE entry_groups (
  id uuid PRIMARY KEY,
  txn_ref varchar(64) UNIQUE,     -- idempotency: duplicate ref rejected
  created_at timestamptz NOT NULL
);
-- constraint total D = C per group: checked by trigger or reconciliation job
~~~
- Balance: derived from SUM (slow for large tables) or account_balances table updated atomically in the same transaction (insert 2 entries + update 2 balances)? In practice use balance table for fast query and reconciliation job comparing with SUM.
- Errors are not fixed directly: money only moves through entries; errors are corrected by reversal entry, no UPDATE, no DELETE.

### Solution
- Standard transaction (rowsAffected check):
~~~java
// BEGIN
// 1. INSERT entry_group (txn_ref unique) -> duplicate ref: rowsAffected 0, return old result
// 2. INSERT 2 entries (D for debit account, C for credit account) with same group_id
// 3. UPDATE accounts SET balance = balance - :amt WHERE id=:a AND balance >= :amt
//    UPDATE accounts SET balance = balance + :amt WHERE id=:b
//    -> rowsAffected = 0 rollback fully (not enough money / group lost)
// COMMIT
~~~
- Reconciliation balance: fill by group so total D = C:
~~~sql
SELECT entry_group_id,
       sum(CASE WHEN dc='D' THEN amount END) AS d,
       sum(CASE WHEN dc='C' THEN amount END) AS c
FROM ledger_entries GROUP BY 1 HAVING sum(
  CASE dc WHEN 'D' THEN amount ELSE -amount END) <> 0;
~~~
- Performance: index (account_id, created_at DESC) for each account statement query; partition entries by month; archive to warehouse after 6–12 months.

### Trade-off & pitfall
- Do not use float/double for money — BIGINT minor units (VND has exponent 0 according to ISO 4217 so store raw dong; USD store cents) or NUMERIC with fixed scale; each currency needs its standard scale and currency code saved.
- When updating two balances in the same transaction, always lock/update by ascending account_id so opposite-direction transfers do not deadlock.
- Updating balance in the same transaction with entries is normal (balance is just a derived cache) — but if outside the same transaction it drifts easily; reconciliation job compares SUM(entries) with balances.
- Large entries table — every query must include time/account conditions to avoid scanning the full table.

> Senior tip: my ledger rule: "append-only, with reconciliation, balance is derived cache". A daily reconciliation job that checks SUM(entries) matches accounts.balance for each account has saved me from many strange flow bugs; many balance errors are not in the ledger but in the calling flow before it.`,
    follow: [
      'How to query point-in-time balance from entry data efficiently with a large table?',
    ],
  },
  'scenario-026': {
    q: 'End-of-day reconciliation with NAPAS / partner: reconciliation file has pending and discrepancy transactions. How do you design the processing?',
    a: `**Summary:** 4-step process: (1) load reconciliation file with checksum + control total; (2) match by ref_no + amount + date, classify 4 groups (matched, amount mismatch, ours-only, theirs-only); (3) pending cases recorded in suspense and queued for OPS with aging SLA; (4) by end of day suspense must be zero or explained; dashboard tracks match rate.

### Clarify requirements
- What format does the partner send (CSV, fixed-width, ISO 20022) and at what time? Is there an inquiry API per transaction?
- Is there a separate pending/settlement branch? The partner settlement cut-off (23:30?) drives the processing.
- How many OPS staff handle cases each day? Is there an automatic refund for small values?

### Investigate / Analyze
- Classify by bin over the last 30 days: matched, amount mismatch (fee/rounding/FX), ours-only (settle not yet back), theirs-only (suspicious, fraud?); measure value ratio of each bin.
- Check cut-off: our 23:58 transaction enters the partner file T+1 is common; define a window to avoid false alarms.
- Confirm file uniqueness: resend file must not overwrite (unique key partner + file date + seq).

### Solution
- Pipeline:
  1. Import file, verify control total (line count, total amount); staging unique (partner, ref_no, file_date); encoding change must pass validator before import.
  2. Match engine on staging (FULL OUTER JOIN by ref_no, compare amount, date, tenant); 4 groups as above.
  3. Actions by group: large amount mismatch → OPS; ours-only → check pending settlement; theirs-only → partner inquiry API or correction file.
  4. Pending cases recorded in suspense by value; SLA T+1 must process ≥ 95% of discrepancy value.
- Small-value auto-fix by threshold (e.g., discrepancy < 1,000 VND auto-adjust with audit log); larger values manual.
- Dashboard highlights: match rate count, value variance, cases aging > 24/48/72h, pending reconciliation number; automatic alarm if exceeding threshold.
- Track correction files from partner: match corrected version against old file, keep file versioning fileDate + seq; compare data by file version.

### Trade-off & pitfall
- Match key must be normalized before comparison: partner ref often zero-padded differently — not normalizing causes many false positives.
- Do not put pending into discrepancy queue too early; partner settlement window T+3 must be reviewed again if still missing.
- USD vs VND rounding: VND has no sub-unit, USD has; multi-currency must standardize before matching.

> Senior tip: one KPI I always set for reconciliation: "suspense account balance to zero before 08:00"; if not, it signals a bug or needs early staff; the automatic match-rate dashboard saves the OPS team hours of manual processing each morning.`,
    follow: [
      'How is the suspense account designed in double-entry ledger and when does it return to zero?',
      'Which KPIs should a reconciliation processing dashboard show for the OPS team?'
    ],
  }
});
