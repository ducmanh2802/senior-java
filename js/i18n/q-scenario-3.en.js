/*
 * English translation of js/data/q-scenario.js — task T204. Format: js/core/i18n.js (content overlay).
 * ids: scenario-027 scenario-028 scenario-029 scenario-030 scenario-031 scenario-032 scenario-033 scenario-034 scenario-035 scenario-036 scenario-037 scenario-038 scenario-039 scenario-040 scenario-041 scenario-042 scenario-043
 */
App.i18n.content({
  'scenario-027': {
    q: 'A money transfer through a partner times out and the result is unknown (unknown state). How do you handle it?',
    a: `**Summary:** the core principle: a timeout does not mean failure — write PENDING into the ledger, then call the partner's inquiry API with backoff; if the partner has no inquiry API, use the reconciliation file as the authoritative source; only mark SETTLED when the partner confirms; FAILED and refund only when there is confirmation from the partner; alert when PENDING transactions hang too long.

### Clarify requirements
- Does the partner have an inquiry API? What is the settlement SLA (seconds/minutes)?
- What is the partner's settlement cut-off time (23:30?), and what is the legal regulation on refund when the state is unknown?
- What is the rate limit of the partner's inquiry API?

### Investigation / Analysis
- Draw the state machine: NEW → SENT → PENDING → (SETTLED | FAILED_CONFIRMED | REFUNDED); list which actor decides each transition.
- Observe transactions with PENDING > X minutes per day — is the partner overloaded or is it a network bug?
- Check the inquiry rate limit: if polling is dense, it may be blocked by the partner, killing the refund flow.

### Solution
- State machine + scheduled inquiry job:
~~~java
for (Tx t : job.repoPending()) {
  Result r = partnerApi.inquiry(t.refNo);     // idempotent
  switch (r.state()) {
    case SETTLED -> ledger.markSettled(t);        // transition PENDING -> SETTLED
    case FAILED  -> { if (r.canConfirm()) ledger.markFailedAndRefund(t); }
    case PENDING -> scheduleRetry(t, backoff()); // 1m, 5m, 15m, 1h, 6h...
  }
}
~~~
- Every transition has a condition (WHERE status = 'PENDING') to run only once; txn_ref is unique to prevent duplicates.
- If the partner has no inquiry API: wait for the T+1 reconciliation file as the authoritative source; before that, the transaction stays PENDING (do not decide failure on your own); when a user calls, respond with pending — do not say it failed.
- Refund (when the partner confirms failure): create a refund transaction with its own txn_ref, derived from the ledger; if the partner does not process the refund, record it as pending and handle it through reconciliation.
- Alarm: number of PENDING transactions exceeds threshold (e.g., > 5 in 10 minutes) — alert on-call immediately; the end-of-day reconciliation report must include all PENDING transactions.

### Trade-off & pitfall
- Do not mark FAILED based on timeout when the partner has not confirmed — if the money actually went through and you refund, you lose real money.
- Dense inquiry polling can be blocked by the partner (rate limit); always use backoff + jitter, and batch inquiry if the API supports it.
- Log enough detail for each case (ref, amount, each inquiry step) — in future disputes with the partner, you need a timeline down to the millisecond.

> Senior tip: the principle I always apply when designing payments is three certain states: SETTLED (money arrived), FAILED_CONFIRMED (partner confirmed), PENDING (unknown); any refund action must have partner confirmation — the safest approach is 'wait + inquiry', not deciding unilaterally.`,
    follow: [
      'Where is the state machine stored (separate status table vs ledger entries) and how do you check it if a crash happens between transitions?',
      'When the partner confirms failure and a refund is required: if the partner cannot process the refund, what is the next flow?'
    ]
  },
  'scenario-028': {
    q: 'Audit log and data change tracking (who changed what, when) must meet audit / State Bank requirements. How do you design it?',
    a: `**Summary:** three basic attributes: WHO (user/service, IP), WHAT (entity, before/after fields), WHEN (UTC) — stored in an append-only unmodifiable table (hash-chain or WORM storage), quickly traceable by entity + time; capture method: Hibernate interceptor/AOP that computes the diff automatically, or CDC (Debezium) from WAL — CDC is cleaner and does not miss anything.

### Clarify requirements
- Legal requirements: how long does the State Bank require retention (5 years or more), export format, query by entity/user/time?
- Who reads the audit: internal audit, external, regulators? How is audit read access separated from business permissions?
- Which layer must be audited: only API, or all DB-direct updates? Are login/logout and permission change actions required?

### Investigation / Analysis
- Assess current state: is WHO sufficient (user_id, IP, session), WHAT sufficient (entity, before/after), WHEN sufficient (UTC)?
- Performance: inline audit in the same transaction makes it heavy — CDC capture from WAL is the main approach; app-level bypass does not cover direct DB updates.
- Security: who has audit read access, is there a separate domain audit log, and is admin action already logged?

### Solution
- Standard audit_log schema:
~~~sql
CREATE TABLE audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ts timestamptz NOT NULL,              -- always UTC
  actor_id bigint, actor_type varchar(16), ip inet,
  entity_type varchar(64), entity_id varchar(64),
  action varchar(32),                   -- CREATE/UPDATE/DELETE/LOGIN...
  before jsonb, after jsonb,            -- structured diff
  request_id varchar(64),
  prev_hash bytea, hash bytea           -- anti-tamper hash chain
);
CREATE INDEX idx_audit_entity ON audit_log (entity_type, entity_id, ts DESC);
~~~
- Capture method: Hibernate interceptor (onPreUpdate/onPreInsert) computes the diff automatically, or Debezium CDC from WAL — cleaner and does not miss DB-direct updates; choose CDC when multiple systems write directly to the DB.
- Anti-tamper: hash chain (hash of current row = SHA-256(prev_hash + payload)) + daily verification job; or push old partitions to S3 Object Lock (WORM).
- Data age: hot 6 months in DB, rest 5+ years in S3 Glacier; export reports per State Bank requirements periodically.
- Separate permissions: only audit-reader role, separate read API, not the same business DB; access to it is also logged.

### Trade-off & pitfall
- Structured JSON diff can grow large (large documents with many changed fields) — store structured diff, not a full document dump.
- App-only capture (AOP) misses updates from jobs or direct SQL edits — CDC from WAL is the most reliable for WHAT/WHEN, but WAL does **not know WHO** (end user, IP): the app must write actor into columns ({{updated_by}}, {{request_id}}) so CDC carries it along, or combine with app-level audit; direct SQL updates only know the DB user.
- The hash chain requires a daily verification job; if the chain breaks and is not detected early, integrity is lost.

> Senior tip: the question I always ask when designing audit is "when the auditor arrives, how quickly can you answer?" — design queries by entity + user + time with the appropriate index; retention period must be determined by document type and applicable regulations; snapshot hash only supports detecting modifications, not replacing access control and storage procedures.`,
    follow: [
      'CDC audit log with Debezium: recovery when the topic lags too much — can events be lost?',
      'Hash-chain design and verification process: what steps follow if a hash does not match?'
    ]
  },
  'scenario-029': {
    q: 'Customer data security requirements in banking: at-rest/in-transit encryption, masking, authorization, OTP/2FA, PCI DSS. How do you design the overall approach?',
    a: `**Summary:** classify data first (PII, financial, credentials) then design in layers: at-rest encryption (KMS + TDE, envelope for sensitive fields), in-transit (TLS 1.2+ on every hop, optional mTLS), tokenization for card numbers (reduce PCI scope), masking in UI/log, RBAC least-privilege + audit, risk-based OTP/2FA. No single layer is enough — defense must be layered.

### Clarify requirements
- Data types: PII (name, national ID, phone), financial (card number, account number), behavior; define three sensitivity levels.
- Legal requirements: PCI DSS if cards are involved, Decree 13 for PII, State Bank storage regulations?
- Who accesses prod: how many devs/DBAs have access? Who is the internal app admin?

### Investigation / Analysis
- Scan all storage points: DB (TDE/EBS), object storage (S3 SSE-KMS), backups, logs, cache, data warehouse — has each layer been encrypted?
- Check the data path: does the internal API return data that is not needed? Does a full request body containing PII exist in logs without masking?
- Authentication: passwords (bcrypt/argon2), SMS OTP vs TOTP, risk-based (unfamiliar device requires OTP).

### Solution
- **At-rest:** KMS (AWS KMS) manages CMK + envelope encryption for very sensitive fields (national ID, credentials); DB enables TDE/encrypted EBS; backups encrypted with separate keys in a separate permission scope.
- **In-transit:** TLS 1.2+ with strong cipher on every hop, internal service-to-service mTLS (Istio/server cert) if needed; automatic certificate rotation.
- **Cardholder data:** tokenization via PSP — token replaces PAN at storage time; do not store PAN; storing CVV is strictly prohibited by PCI DSS; store account number with AES-256-GCM per record with its own KDF.
- **Access:** RBAC least-privilege; audit every access to sensitive data; just-in-time access for production DB (request permission, expires after 1 hour).
- **App:** masking in UI and logs ({{**** 5678}} for cards); OTP/2FA for large transactions (SMS + TOTP backup, anti-SIM-swap with device fingerprint, trusted device list).
- **Log:** standard log schema without PII/secrets; automatic regex scan for national ID/card on samples.

### Trade-off & pitfall
- Unencrypted backups/dumps are the most common mistake — backups and SQL dumps must follow the same encryption standard; verify down to every character.
- Cache (Redis) remains plaintext when DB is encrypted — use key-level encrypted serializer or encrypt the value before caching.
- Broad IAM (all devs read DB) breaks security from the inside — set a standard: "time-to-detect who read row X" as a security KPI.

> Senior tip: for banking, I always start with a data classification matrix; the common team mistake is encrypting the DB but leaving logs and cache in plaintext — add an automatic regex scan job for national IDs/cards on log samples before declaring it "secure"; pre-commit scan is only the first defense line.`,
    follow: [
      'Tokenization vs field-level encryption for card numbers — when to choose each?',
      'SMS OTP vs TOTP: what is the SIM-swap risk with SMS OTP, and what design should be chosen for Vietnamese banks?'
    ]
  },
  'scenario-030': {
    q: 'End-of-day batch calculates interest/fees for millions of accounts: must be correct, rerunnable (re-runnable), and not duplicate. How do you design it?',
    a: `**Summary:** three properties: correct (key = account_id + accrual_date is unique — rerunning does not duplicate), rerunnable (checkpoint by partition, restart from unfinished part), reconciliation (dry-run + total reconciliation report for accounting). Implement with Spring Batch chunk by partition, UPSERT with ON CONFLICT DO NOTHING, business_date provided by scheduler rather than now() per JVM.

### Clarify requirements
- Adjustment of interest formulas per State Bank regulations (calculated by daily balance, actual days, February rules, holidays)? Different account groups have different rules.
- SLA: run time (23:00?), is there a deadline (by 06:00 next morning the balance must be updated for linked systems)?
- Volume: millions of accounts × transactions per account; distribution by account type and region?

### Investigation / Analysis
- Prior team jobs: have they ever run with duplicates or calculated twice, and what was the concrete cause (restarted job, chunk committed then failed)?
- Measure each stage: reading data vs calculating per account — which is the bottleneck?

### Solution
- Spring Batch: chunk of 5,000–10,000 accounts by partition by id range (or region), step reader within each range; each record is read, calculated, and written atomically with the business key:
~~~sql
INSERT INTO interest_accrued (account_id, accrual_date, amount)
VALUES (?, ?, ?)
ON CONFLICT (account_id, accrual_date) DO NOTHING;
-- unique key prevents duplicate writes when rerunning
-- balance update also within the same chunk (check rowsAffected)
~~~
- Checkpoint: save completed partitions in a job_run table; restart runs only unfinished parts; the job does not use now() per JVM chunk but receives business_date from the scheduler parameter (prevents a pod crossing 00:00 so two chunks belong to different days).
- Dry-run mode: calculate interest but do not commit — print a total report by account type for accounting verification; if deviation exceeds threshold, block commit.
- After commit: reconcile record count + total value by range against the accounting report; alert immediately if there is a discrepancy.

### Trade-off & pitfall
- {{WHERE NOT EXISTS}} per row is slow — use staging / MERGE / ON CONFLICT for bulk.
- Updating the same account balance within one large transaction creates lock contention with online deposit flows — chunks lock by partition; keep chunks small to match the lock pattern.
- Business date must be provided by the scheduler (parameter), not taken from the JVM clock — avoid a pod crossing 00:00 causing two chunks to belong to different days.

> Senior tip: the most common error in interest jobs is rerunning: the business key (account_id + accrual_date) must be unique from the design day; my experience is to always set restart to read from the checkpoint table to continue correctly, and rely on UPSERT instead of counting from a list in the app.`,
    follow: [
      'If the batch fails at chunk 60 of 100 and an operator restarts it — where does it resume, and how is the checkpoint stored?',
      'If an account has a miscalculated interest (from a previous batch) — how is a reversal entry recorded in the same session?'
    ]
  },
  'scenario-031': {
    q: 'Payday: traffic spikes suddenly on both the bank partner API and the partner has a fixed cap. How do you prepare and respond?',
    a: `**Summary:** it cannot be solved by scaling alone — prepare three locks: (1) pre-scale infrastructure on schedule before the peak hour; (2) control incoming load: per-user rate limit, queue for non-blocking flows, waiting room when near saturation; (3) degraded mode with feature flags that disable non-essential features; the most important is to respect the partner quota (bank gateway/NAPAS) because it is a hard cap.

### Clarify requirements
- Traffic profile: peak RPS, duration, read/write ratio, which flow increases the most (transfer, balance lookup, statement)?
- Which features have absolute SLO (transfer, login), which can be temporarily disabled (export, recommendation)?
- What is the partner transfer TPS quota, and can it be increased by contract?

### Investigation / Analysis
- Load test with a 10x profile, not just per endpoint — need the end-to-end path: from user, through app, queue, to partner.
- Identify caps at each layer: LB connection, K8s node pool, DB connections, partner gateway TPS limit, ESP/SMS quota.
- Identify the real bottleneck: if DB connections are the bottleneck then scaling the app does not solve it; if the partner gateway is the cap, then designing a queue + backpressure between you and the partner is the main task.

### Solution
- **Pre-scale:** increase min replicas on schedule before peak time, pre-keep node pool capacity, warm up caches + connections; CDN for statics.
- **Incoming control:** per-user rate limit (token bucket) and tiered APIs: priority (1) transfer/login, (2) balance lookup, (3) non-essential features; when the partner gateway is near quota, put extra transfers into SQS and respond to the user "processing — SMS will be sent when complete".
- **Waiting room:** when near saturation, a queue with a sequence number and periodic progress updates for the user.
- **Degrade:** disable feature flags in order (recommendation → export → detailed history), keep login + balance + transfer.
- **Runbook + on-call:** pre-packaged config with pre-made decisions (which limits to increase, what to disable, which queue to open); SLO-based alerts; dashboard tracking partner quotas.

### Trade-off & pitfall
- The partner gateway limit is a hard cap — the design must follow it (queue by quota + tracker), not just scale your own infrastructure.
- Cache invalidation at the peak time can kill the site — hot config is precomputed by version key, not deleted at the crisis time.
- Partner quota tracking must be measured data (dashboard), not based on feeling — otherwise you will often exceed the limit before you know it.

> Senior tip: payday is not just a scaling problem but an incoming load control and partner quota problem — I once participated in a large bank release with a partner gateway fixed at 50 TPS: only a backpressure queue allowed the app to handle 200 TPS without missing the reconciliation deadline.`,
    follow: [
      'Per-user and per-account-group rate limit: how is the token bucket implemented — at the gateway or service, in detail?'
    ]
  },
  'scenario-032': {
    q: 'After a DB failover, the app still reports connection errors for several minutes: causes include JVM DNS cache and the connection pool holding dead connections. How do you handle it?',
    a: `**Summary:** After failover, the client may still be using the old resolved DNS address, or the JDBC connection may have been closed; these are two independent caches, and not all errors are due to the JVM DNS cache. Check DNS, driver, pool, and the error timing before choosing the recovery approach.

### Mechanism
- Java caches resolution results according to the security property networkaddress.cache.ttl; the default depends on the runtime/configuration, there is no universal default of 30 seconds. The driver, resolver, and proxy may also have their own caches.
- HikariCP uses JDBC4 Connection.isValid() if the driver supports it. By default the pool does not ping every connection on each borrow; a connection is validated when the pool suspects it has been idle long enough or when keepalive is configured.

### Solution
- Configure networkaddress.cache.ttl with the appropriate JDK security properties; there is no universally supported -Dnetworkaddress.cache.ttl default. Verify the actual resolver after changes.
- Only set connectionTestQuery if the driver does not support JDBC4; validationTimeout must be shorter than connectionTimeout. Set maxLifetime shorter than the connection lifetime imposed by the DB/proxy; it does not immediately handle an actively borrowed connection.
- After failover, evict bad connections softly so the pool creates new connections. PostgreSQL targetServerType=primary only selects the primary in a multi-host URL; it does not provide automatic failover or DNS refresh.
- DB endpoint health check returns 503 so the LB does not route traffic to the failing instance.

### Trade-off & pitfall
- A short DNS TTL increases DNS lookup overhead; balance it with the failover frequency.
- Pool recreation is a heavy operation; only do it when needed, not on every request.

> Senior tip: record the resolved hostname, resolved IP, SQLState, and connection age to distinguish old DNS from a dead socket before adjusting the TTL.`,
    follow: [
      'How to detect DB failover from the app side?',
      'When should a failover-aware JDBC driver be used?'
    ]
  },
  'scenario-033': {
    q: 'Container RSS increases even though heap is stable: glibc malloc arenas, direct memory, threads — how to diagnose and handle?',
    a: `**Summary:** RSS growing while heap is stable usually indicates off-heap: glibc malloc arenas holding memory for threads, direct ByteBuffer, thread stacks, Metaspace. Diagnose with native memory tracking and /proc; handle by adjusting MALLOC_ARENA_MAX, direct memory limit, and thread pool sizing.

### Mechanism
- glibc malloc uses multiple arenas to reduce contention; an arena is not one per thread. The limit depends on architecture/configuration (on 64-bit usually related to CPU count), not a fixed constant of 8x cores. Free memory may be kept for reuse, so RSS may not drop immediately.
- Direct memory: ByteBuffer.allocateDirect, Netty, NIO buffers are not in the heap.
- Thread stacks have reserved and committed areas that differ; -Xss does not mean RSS increases exactly 1 MB per thread.
- Metaspace: class loading, usually grows over time.

### Solution
- Try MALLOC_ARENA_MAX=2 or 4 if the process uses glibc; benchmark because reducing arenas can increase contention.
- Compare MaxDirectMemorySize with direct buffer needs. NMT is useful for tracked native JVM areas but does not cover all native library allocations; compare with smaps and buffer pools.
- Thread pool: limit thread count; use virtual threads (Java 21) for I/O-bound work.
- Monitor: jcmd <pid> VM.native_memory summary, /proc/<pid>/smaps.

### Trade-off & pitfall
- A low MALLOC_ARENA_MAX can increase arena contention → reduced throughput; test performance.
- A direct memory limit that is too low causes OOM when the Netty buffer pool is large.

> Senior tip: compare NMT, smaps, and thread count; if NMT does not fully explain RSS, continue checking the allocator and native libraries rather than concluding it is a Java leak.`,
    follow: [
      'What is the overhead of Native Memory Tracking?',
      'When should virtual threads be used?'
    ]
  },
  'scenario-034': {
    q: 'Batch import creates duplicate records because 2 requests run in parallel: race condition, unique constraint, upsert — how to handle?',
    a: `**Summary:** A race condition when inserting the same key from 2 threads → duplicate. Solution: unique constraint in DB + upsert (INSERT ... ON CONFLICT) or pessimistic lock; application-level check is not enough because of TOCTOU.

### Mechanism
- TOCTOU: check exists → insert has a gap between the two steps; 2 threads both pass the check → duplicate.
- DB unique constraint is the safety net; violation throws DataIntegrityViolationException.

### Solution
- Schema: unique index on the business key (email, external_id).
- PostgreSQL INSERT ... ON CONFLICT requires an appropriate unique constraint/index. MERGE exists from PostgreSQL 15 but has different concurrency semantics from ON CONFLICT; choose according to requirements and test under load.
- PostgreSQL marks the transaction failed after a unique violation until rollback/savepoint; handle at the transaction boundary appropriately, then re-read if the business allows.
- SELECT ... FOR UPDATE only locks an existing row; lock the parent or use an advisory lock if you need to serialize a new key, and still keep the unique constraint as the final protection.

### Trade-off & pitfall
- Upsert may overwrite unwanted data; use DO UPDATE SET only for the fields you want to update.
- Retry logic must be idempotent; otherwise it creates duplicates at another layer.

> Senior tip: define the semantics when different payloads share the same key (first-write-wins, last-write-wins, or reject); ON CONFLICT executes exactly the semantics you write.`,
    follow: [
      'Idempotency key pattern for API import?',
      'When to use pessimistic vs optimistic lock?'
    ]
  },
  'scenario-035': {
    q: 'Money discrepancy bug when splitting fees/interest across multiple periods due to rounding: distributing the remainder, BigDecimal — how to handle?',
    a: `**Summary:** Splitting money into N periods with rounding per period loses or gains a few units due to rounding. Solution: compute the total, distribute the remainder to the last period or distribute round-robin; always use BigDecimal with scale and RoundingMode.

### Mechanism
- 100.00 / 3 = 33.333 → round 33.33 × 3 = 99.99, missing 0.01.
- Distribution: compute each period = floor/round, remainder = total - sum, add to the last period (or distribute round-robin for fairness).

### Solution
- Use BigDecimal initialized from strings or integers by minor unit; choose scale according to currency and business rules. HALF_UP is not the universal rule; HALF_EVEN or contract rules may be needed.
- Choose a clear distribution rule: split to the smallest unit, compute the exact remainder, then distribute to some periods. Define both positive and negative amounts and rounding direction so the total always matches.
- Store input, rounding rule/version, and result for audit; the total of all periods must exactly equal the source total in the same units.

### Trade-off & pitfall
- HALF_UP vs HALF_EVEN (banker\'s) differ at .5; fintech usually uses HALF_UP.
- Audit trail must store input + output for reconciliation.

> Senior tip: test with amounts that do not divide evenly, negative amounts, and multiple currencies; the critical assertion is that the distributed total exactly equals the source total.`,
    follow: [
      'BigDecimal vs double for money?',
      'How to reconcile the total amount with the ledger?'
    ]
  },
  'scenario-036': {
    q: 'Partner SSL certificate expires / CA changes and breaks integration: truststore, certificate expiry monitoring — how to handle?',
    a: `**Summary:** The truststore contains the partner's CA certificates; when a certificate expires or the CA changes, TLS handshake fails. Solution: centrally managed and distributed truststore, expiry monitoring, non-downtime rotation, and a trust-all fallback only for dev.

### Mechanism
- The JVM truststore (cacerts) contains trusted CA certificates. When the server certificate chain does not match the truststore → SSLHandshakeException.
- Certificates have notBefore/notAfter; the JVM does not refresh them automatically.

### Solution
- Use a centrally managed and securely distributed truststore; a dedicated truststore is useful when you need to limit CA but is not mandatory for all apps. Do not commit private keys/secrets into the repo.
- Monitor expiry: alert at 30/14/7 days remaining; check with openssl s_client script.
- Rotation: distribute the new trust anchor before the partner switches if the CA changes. JSSE does not have a universal reload mechanism for all clients; only use reload if the specific client supports changing SSLContext, otherwise rolling restart.
- Dev: trust-all only in local/test profiles.

### Trade-off & pitfall
- Runtime truststore reload is complex; rolling restart is simpler and safer.
- Certificate pinning increases security but makes rotation harder; consider carefully.

> Senior tip: monitor both the chain and hostname/SAN, not only the leaf expiry date; practice rotation on staging before the certificate window changes.`,
    follow: [
      'Should certificate pinning be used?',
      'How to reload the truststore without a restart?'
    ]
  },
  'scenario-037': {
    q: 'JWT is randomly rejected due to clock skew between servers: clock skew, NTP, leeway — how to handle?',
    a: `**Summary:** JWT has exp/iat/nbf; if server clocks are skewed, a valid token is rejected randomly. Solution: NTP sync all servers, add leeway (clockSkew) in the validator, and use short-lived tokens with refresh.

### Mechanism
- The validator usually checks exp and nbf; iat is not always checked as a time condition unless the application adds a validator. Clock skew can cause a token to appear expired or not yet effective.

### Solution
- NTP sync all servers (chrony/systemd-timesyncd), monitor offset.
- New JJWT uses clockSkewSeconds(...); setAllowedClockSkewSeconds(...) is deprecated. Spring Security uses JwtTimestampValidator(Duration.ofSeconds(...)), there is no common clockSkew=60s property.
- Choose leeway according to measured deviation; it widens the acceptance of exp/nbf and extends the window for accepting expired tokens. Token lifetime/refresh is a separate decision, it does not fix clock skew.
- Log the rejection reason for debugging.

### Trade-off & pitfall
- Too large a leeway reduces security (an expired token is still accepted for N more seconds).
- NTP failure → clock drift; monitor NTP sync status.

> Senior tip: log the clock offset and the claim times checked (do not log the token); set skew according to the measured deviation and confirm with the actual validator.`,
    follow: [
      'How long should an access token lifetime be?',
      'Refresh token rotation pattern?'
    ]
  },
  'scenario-038': {
    q: 'Redis is full, eviction deletes session/lock: maxmemory-policy, separate clusters by purpose — how to handle?',
    a: `**Summary:** A single Redis instance shared for session, cache, and lock — when full, eviction deletes session/lock, causing logout/lost lock. Solution: separate Redis by purpose, set maxmemory-policy appropriate for each type, and monitor memory.

### Mechanism
- Redis has noeviction, allkeys-lru/lfu/random, and volatile-lru/lfu/random/ttl; volatile only selects keys with a TTL. With noeviction, write commands that need more memory will fail when the limit is reached.
- Session/lock should not be evicted; cache can be.

### Solution
- Separate deployments according to data loss requirements, latency, and eviction. Session may need persistence/HA according to policy, but persistence is not a backup. Lock needs TTL, appropriate fencing/consistency, and error handling on writes.
- Set maxmemory and maxmemory-policy per instance.
- Monitor memory, evicted_keys, OOM errors, and hit rate; set thresholds according to headroom and growth rate, do not assume 80% is the right threshold for every workload.
- Session: use Redis with persistence (RDB/AOF) and replicas.

### Trade-off & pitfall
- Multiple deployments increase complexity. Redis Cluster only supports database 0; logical DB indexes do not isolate resources, and key prefixes do not create separate eviction policies.
- A noeviction instance that fills up → write failures; scale before it fills.

> Senior tip: volatile policies can still evict session/lock keys that have a TTL; key prefixes do not protect keys from eviction.`,
    follow: [
      'Redis Cluster vs Sentinel for HA?',
      'Distributed lock with Redis Redlock?'
    ]
  },
  'scenario-039': {
    q: 'Elasticsearch data is out of sync with DB: synchronize using CDC (Debezium), reindex without downtime — how to handle?',
    a: `**Summary:** ES index is out of sync with DB due to a dual-write path (write DB + write ES) failing on one side. Solution: the single source of truth is the DB, CDC (Debezium) streams changes to ES; reindex without downtime using alias swap.

### Mechanism
- Dual write: app writes DB then writes ES; if ES fails → out of sync; if retry → duplicate.
- CDC: DB transaction log (binlog/WAL) → Debezium → Kafka → ES sink connector → ES. At-least-once, idempotent by document id.

### Solution
- App writes DB only; Debezium captures changes.
- ES document id = DB primary key → idempotent upsert.
- Reindex without downtime: create a new index with new mapping/settings, catch up with changes during backfill using CDC offset/checkpoint, confirm enough data is present, then switch the alias atomically through one _aliases request; only delete the old index after a rollback window.
- Handle deletes according to connector contract: Debezium can emit delete events and Kafka tombstones; the sink must map them to document deletion; otherwise deleted data remains in ES.

### Trade-off & pitfall
- CDC lag → ES is eventually consistent; the UI must tolerate stale data.
- Schema evolution: mapping changes require reindex; version mapping carefully.
- Debezium connector failure → lag grows; monitor lag.

> Senior tip: CDC reduces dual-write risk but still requires reconciliation, rebuild procedures, lag monitoring, and an alias-switch plan for concurrent changes.`,
    follow: [
      'Debezium vs application-level outbox?',
      'ES index alias swap procedure?'
    ]
  },
  'scenario-040': {
    q: 'Log costs spike after a release: log level, sampling, structured logging, PII in logs — how to handle?',
    a: `**Summary:** Log volume increases because debug level is still enabled, every request is logged, or large objects are logged. Solution: structured logging (JSON), sampling for high-volume flows, PII redaction, and environment-based log levels.

### Mechanism
- Common facade/backend log levels are TRACE < DEBUG < INFO < WARN < ERROR; production chooses the level based on the signal needed and cost, there is no one correct level for all packages.
- High-volume endpoints (health check, polling) log every request → large volume.
- PII in logs → compliance risk + storage cost.

### Solution
- Logback/Log4j2: profile-based level (dev DEBUG, prod INFO).
- Structured JSON logging (logstash encoder) for easy parsing.
- Sampling: log 1/N requests for high-volume endpoints; full log on errors.
- PII redaction: mask email/phone/card; do not log password/token.
- Set retention based on investigation needs, storage regulations, and budget; hot/warm/cold retention depends on workload.

### Trade-off & pitfall
- Sampling can miss rare errors; keep full logs when status >= 500.
- Structured logging helps query by field but serialization, ingestion, and storage costs depend on payload/volume; avoid large bodies and measure overhead.

> Senior tip: measure bytes/day and cost per service before/after changes; design sampling so that errors and necessary traces for investigation are preserved.`,
    follow: [
      'Structured logging with MDC context?',
      'Log aggregation pipeline (ELK/Loki)?'
    ]
  },
  'scenario-041': {
    q: 'Tomcat thread pool is exhausted because of blocking downstream service calls: diagnosis and isolation — how to handle?',
    a: `**Summary:** When a request thread is held in a slow downstream call, Tomcat may run out of workers to handle new requests; the default values depend on configuration. Diagnose with thread dumps and queue metrics, then limit wait time and isolate the dependency.

### Mechanism
- Tomcat: each request gets a thread; the thread blocks on I/O (HTTP call, DB) → pool is exhausted.
- In thread dumps, blocking socket reads often appear as RUNNABLE at native socket read; examine the stack trace and repeat dumps to confirm multiple workers are waiting on the same dependency. WAITING/TIMED_WAITING may indicate different locks/queues.

### Solution
- Configure connect, response/read, and pool-acquire timeouts on the specific HTTP client; choose based on the latency budget/SLO rather than a universal 2s/5s for all systems.
- Circuit breaker: Resilience4j CB opens when the failure rate is high → fail fast.
- Bulkhead limits concurrency per dependency; thread-pool bulkhead isolates blocking calls, while semaphore bulkhead limits calls without creating a separate pool.
- Retry with backoff + jitter; idempotency.
- Spring Boot 3.2+ supports virtual threads with JDK 21 and the appropriate configuration. They reduce the cost of threads waiting on I/O but do not increase downstream capacity; WebFlux is appropriate when the entire chain is non-blocking/reactive.

### Trade-off & pitfall
- Virtual threads do not solve a slow downstream; you still need timeout + CB.
- Thread-pool bulkhead consumes workers/queue; semaphore bulkhead does not isolate blocking threads. Choose based on call type and queue limits to avoid accumulating requests.

> Senior tip: compare active/max threads, request queue, latency, and timeout by route; dumps show where workers are waiting, metrics show the degree and timing of congestion.`,
    follow: [
      'Virtual threads vs reactive for Spring Boot?',
      'Resilience4j bulkhead config?'
    ]
  },
  'scenario-042': {
    q: 'A Spring service needs to call core banking T24/Flexcube but the partner model and transaction status are very different from the internal domain. How do you design the Anti-Corruption Layer to prevent legacy model leakage?',
    a: `**Summary:** Place the adapter at the integration boundary: translate the core banking request/response and error codes into the internal business model, keep protocol/vendor details inside one module. ACL does not hide semantic differences; contracts, observability, and state-handling rules are needed.

### Boundary
~~~java
interface FundsGateway {
    TransferResult transfer(TransferCommand command);
}

final class T24FundsAdapter implements FundsGateway {
    private final T24Client client;
    public TransferResult transfer(TransferCommand command) {
        var wire = client.debit(toLegacyRequest(command));
        return mapResult(wire); // vendor status/code does not escape the adapter
    }
}
~~~
The application service only uses {{TransferCommand}}/{{TransferResult}}. The adapter handles protocol, field mapping, timeout, correlation ID, code mapping, and unit/time conversions. If the vendor returns accepted/pending instead of success/fail, the domain model must keep a pending state rather than forcing it into a boolean.

### Contracts and errors
- Create a mapped error code table with owners: business error, validation error, temporary error, and unknown result.
- Consumer-driven contract tests or sandbox tests confirm wire format, charset, decimal scale, timezone, and version.
- Timeout after sending the request does not prove failure; query the status by reference before retrying.

### Trade-off & pitfall
| Option | Benefit | Cost |
|---|---|---|
| Thin adapter | Less code | Vendor model leaks easily |
| Clear ACL with domain | Isolates legacy changes | Mapping must be maintained |
| Vendor DTO throughout the system | Fast initially | Vendor schema becomes domain contract |

Do not retry all errors the same way; keep the redacted raw response for investigation, but do not log credentials/PII. Set timeout according to the latency budget and use a circuit breaker to protect threads, while still requiring reconciliation for pending.

> Senior tip: record metrics by operation, normalized result, and adapter version; when the core upgrades its version, canary a single flow before opening all traffic.`,
    follow: [
      'How do you represent UNKNOWN/PENDING state in the domain?',
      'How to version the adapter without downtime?'
    ]
  },
  'scenario-043': {
    q: 'The application sends a transfer order to core banking, the client times out before receiving a response. How do you distinguish safe retries from the risk of double debit?',
    a: `**Summary:** Timeout means an unknown result, not failure. Send a unique idempotency/reference through the entire path, store the local order status before calling, query the same reference or wait for a callback/reconciliation after timeout; only retry if the core guarantees idempotency according to the contract.

### State machine
{{CREATED → SENT → ACCEPTED/REJECTED}}; timeout creates state {{UNKNOWN}}, not moving straight to {{FAILED}}. The API client with the same key returns the stored result or the processing status. The unique constraint protects the key in the DB; the key is tied to a payload hash so a different content with the same key is rejected.

~~~java
@Transactional
TransferRecord reserve(String key, String payloadHash) {
    return repository.insertIfAbsent(key, payloadHash, "CREATED");
}
// Call partner outside the transaction; update SENT/UNKNOWN/FINAL with CAS/version.
~~~

### Recovery
1. Persist the intent/outbox within the business transaction.
2. The worker sends with a stable partner reference; records the attempt and timestamp.
3. Timeout: query the status API or wait for a message; do not generate a new reference.
4. The reconciliation job finds UNKNOWN orders past the threshold and handles them with audit.

### Trade-off & pitfall
- The partner's idempotency retention must be longer than the retry/reconciliation window.
- Do not keep the DB transaction open while making the network call; avoid holding locks/connections for a long time.
- Exactly-once across two independent systems cannot be achieved by retry alone; deduplication and durable state are required at both ends.
- If the partner does not support query/idempotency, automatic retries can create duplicates; switch to a controlled manual queue.

> Senior tip: the dashboard must separate timeout, reject, and unknown; track the number of UNKNOWN by age and ensure every record finally reaches a terminal state or an investigation case.`,
    follow: [
      'If the partner does not support an idempotency key, what is the risk-reduction method?',
      'Why should the DB transaction not be kept open during the core call?'
    ]
  }
});
