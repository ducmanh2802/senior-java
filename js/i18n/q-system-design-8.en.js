/*
 * English translation of js/data/q-system-design.js — task T201. Format: js/core/i18n.js (content overlay).
 * ids: design-025 design-026 design-027
 */
App.i18n.content({
  'design-025': {
    q: 'Design monthly statement generation for 10 million accounts. The statement must match the ledger, be safe to re-run, load privately, and not affect online transactions.',
    a: `**Summary:** Lock a consistent period snapshot using a defined watermark, divide the workload evenly, generate an immutable artifact with manifest/checksum. Retry uses the same logical job and only publishes atomically after validation; ledger corrections publish a versioned adjustment rather than silently editing the old file.

### Requirements and sizing assumptions
- Assumption: 10 million accounts, 20% active, 40 postings/account: 80 million lines. At 150 bytes/line, about 12 GB raw data excluding PDF/compression. Benchmark against real schema.
- Must complete within 6 hours after period close; queries must not exhaust the primary. Opening + postings within the period = closing with the same cut-off, timezone, and currency.
- API reports status, customers only download their own statements; private bucket and short-lived signed URL.

### API and data model
- {{POST /statement-jobs}} creates a period job; {{GET /statements/:account/:period}} returns metadata/status; download API verifies ownership then creates a signed URL.
- Job stores period, watermark, partition, attempt/status. Manifest stores account, period, ledger watermark, row count, checksum, object key, version/generatedAt.
- Ledger index by (account_id, booking_time, entry_id); time-based partitioning helps pruning but account queries still need an index. Avoid too many small partitions.

### Architecture and flow
~~~text
Scheduler -> Job table -> workers -> read replica / snapshot
                              | validate totals
                              v
                    temp object -> checksum -> manifest publish
~~~
1. Lock the period using a defined watermark after closing the accounting period: don't accept additional postings with a booking date in the old period, and wait for in-flight transactions to commit. Don't rely only on timestamp or {{max(id)}}: late-arriving transactions may have an old booking time, and PostgreSQL sequences assign numbers before commit, so a smaller id may commit after a larger one.
2. Divide by hash(accountId) or balanced range; workers claim jobs with an expiring lease, use keyset pagination instead of large OFFSET.
3. Consistency comes from reading the closed-period watermark (old period data doesn't change), so each account reads in a short transaction; avoid a long REPEATABLE READ transaction lasting hours because it holds xmin, causing bloat or being killed by conflict with recovery on the replica. If the replica hasn't replayed to the watermark (compare {{pg_last_wal_replay_lsn()}} with {{pg_current_wal_lsn()}} recorded at period close), wait or choose another source; don't mix opening and closing from different points in time.
4. Render to a temporary object key per job+attempt. Check row count/arithmetic/checksum then publish the manifest version; partial files are never exposed.
5. API verifies ownership, signs URL with short TTL; encryption, access audit, and lifecycle cleanup for temporary files.

### Retry, consistency, and operations
- Worker dies: lease expires, new worker reruns the logical job; old attempt objects are cleaned up. Unique (account, period, version) keeps version history; partial unique index (account, period) WHERE is_current prevents two current statements. Publish checks the fencing token (current attempt) so an old worker that lost its lease but is still running can't overwrite.
- Ledger correction after publication: create an adjustment version with reason and link to the previous version. Don't erase traces or silently overwrite.
- Control concurrency according to replica CPU/IO and queue age; pause when online workload exceeds threshold. Checkpoint per account so retry doesn't rerun the whole period.
- Checksum proves the file hasn't changed, not that the content is correct; must compare arithmetic, count, and ledger totals. PII data needs retention/access policy confirmed by business.
- Physical snapshot is costly in storage but reproducible; dynamic query is cheaper but results change with corrections. Choose based on audit/business requirement, not guessing retention periods.

### Deep-dive questions
- How are late-booking transactions across the month boundary reflected?
- Once a PDF is published and a missing posting is found, how does versioning work?
- How do you prevent large business accounts from slowing down every partition?

> Senior tip: the dashboard should show completion percentile per partition, replica lag at the watermark, mismatch count, and the age of the oldest job. The total number of successful jobs hides a partition that is always slow.`,
    follow: ['Which snapshot isolation fits when the ledger is continuously written?', 'How do you clean up temporary objects when a worker dies?', 'How do you exactly reproduce a published statement?'],
  },
  'design-026': {
    q: 'After changing a fraud rule, the model blocks many real customers. Design governance for rules, rollout, measuring false positives, and analyst override while keeping real-time decisions under 100 ms.',
    a: `**Summary:** The real-time runtime uses an immutable, versioned, and pre-warmed rule bundle; governance/rollout lives outside the request path. Replay, shadow, and canary detect impact before scaling; decisions store reason, feature freshness, and version for explanation, rollback, or quick kill switch.

### Requirements and load assumptions
- Assumption: 15 million transactions/day, peak 2,000 TPS, all fraud checks p99 ≤ 100 ms, engine portion 30 ms. This is a sizing assumption.
- Output approve/challenge/decline. False positive loses customers; false negative causes losses; don't optimize a single metric like AUC alone.
- Decision must be traceable to input, model/rule version, threshold, and publisher.

### Data and API
- Payment calls {{POST /risk/decision}} with transactionId, amount, beneficiary/merchant, and device context; returns action, reason codes, decisionId, policy version.
- Rule bundle is immutable with version, effectiveAt, owner, approvals, checksum. Decision log stores version, feature freshness, latency, and action; limit PII.
- Online feature store keeps velocity by account/device/beneficiary, with event-time window and updatedAt. Missing/stale features must be represented separately, don't treat null as zero automatically.

### Architecture and rollout
~~~text
Payment -> Risk gateway -> bounded feature read -> rules + model -> decision
Events -> stream aggregates -> online feature store
Analyst labels -> case system -> evaluation -> approved bundle
~~~
1. The online path has a tight timeout and a locally cached bundle. Don't call the data warehouse or any unbounded-latency service.
2. Hard safety rules first, scoring/rule next; map score to action. Decision log goes to an async durable buffer; don't let the log sink block payment.
3. Offline replay must reconstruct point-in-time features (to avoid label leakage), then shadow mode, small canary cohort, gradual scaling. Compare latency, approval, challenge, complaint, and matured loss.
4. Analyst reviews cases per SLA; labels have source and confidence. Chargeback (cards) and complaints/inquiry (transfers) arrive many weeks later, so the dashboard separates early proxies (challenge rate) from matured loss.

### False positive and failure mode
- Don't treat every decline as fraud. Measure on verified/label samples, cohorts by channel, merchant, device, new/existing customers; report confidence intervals and label delay.
- Bundle has kill switch/rollback by version. Fallback when feature store is slow is a risk-owner-approved policy: challenge, decline, or capped approval by exposure; the platform should not choose on its own.
- Analyst override needs role access, reason, audit, expiry; don't allow bypassing hard controls indefinitely.
- Shadow mode consumes compute; limit traffic. Replay data must use features at the decision time. Monitor drift, missingness, and seasonal changes.
- Rules are easy to explain/update but get evaded; models catch complex combinations but are hard to explain. Combine both and measure results by cohort.

### Trade-offs and deep questions
- Challenge threshold depends on expected loss, friction cost, and review capacity, not only precision.
- If the audit sink can't be written, policy may require fail-closed for some transactions; the decision depends on risk appetite and internal regulations that have been verified.
- How do you distinguish drift from seasonality? What exposure cap does the fallback approve have? How can analysts create rules while maintaining control?

> Senior tip: rollout guardrails include challenge/decline rate by cohort and p99 latency. A model with better AUC but blocking customers who receive salary on a fixed date is still a bad rollout.`,
    follow: ['How is false positive measured when labels arrive after many weeks?', 'How do you roll back a rule without restarting the whole system?', 'When does a missing feature make the decision need to be fail-closed?'],
  },
  'design-027': {
    q: 'Design loyalty points and cashback between a bank, merchants, and partners. How do you prevent duplicate accrual, handle expiry, refunds, and reconciliation when partner files arrive late?',
    a: `**Summary:** Points need a separate append-only ledger, with pending/available lots and event accrual, redemption, expiry, reversal. Deduplicate by business event ID, version earn rules, and reconcile settlement batches; repeated webhooks must never accrue points twice.

### Requirements and sizing assumptions
- Assumption: 4 million members, 10 million transactions/day (~116/s, peak 2,000/s), each event creates 1–3 postings. This is a sizing assumption.
- Points have economic value: need audit, transparent expiry policy, explainable balance. Separate pending points from available points; real-cash cashback uses a separate cash ledger.
- Refunds may occur after redemption; policy must handle negative balance/recovery in a later period/manual review.

### API and data model
- {{POST /loyalty/events}} receives eventId, memberId, merchantId, orderId, type, amountMinor, currency; {{GET /points/balance}} returns available/pending/expiringSoon; redemption has an idempotency key.
- {{points_event}} unique (partner, event_id), stores payload hash to detect same ID with different content; {{points_lot}} stores earned/remaining/expiresAt/source; {{points_posting}} appends accrue/redeem/expire/reverse; {{partner_batch}} stores checksum/period/status.
- Earn rule version includes rate, rounding, eligible category, cap; posting records ruleVersion. Don't trust the point total sent by the merchant without validation.

### Flow
~~~text
Merchant -> adapter -> inbox dedupe -> pending points lot
Settlement file -> matcher -> activate / exception case
Redemption -> reserve lots -> confirm -> posting
Refund -> reversal posting -> balance policy
~~~
1. Receive webhook/file into a durable inbox; verify signature, deduplicate event ID/hash. Same ID with different payload is an exception/security alert.
2. Create a pending lot according to the rule at the time of the transaction; activate after settlement or when the return period ends. Don't depend on events arriving in order.
3. Redemption selects lots by policy (e.g., earliest expiry first), reserves with conditional update/transaction, then confirms/cancels. Retry with the same key doesn't create a new redemption.
4. Expiry worker processes by expiry date; only expires remaining with lock/conditional update. Unique expiry reference makes retry safe.
5. Refund creates a reversal linked to the source transaction; if points have been spent, apply the negative-balance/recovery/manual case policy, don't delete old postings.

### Consistency, reconciliation, and trade-offs
- At-least-once consumer; unique constraint and inbox+posting transaction ensure each event accrues only once. Outbox publishes balance-changed; app cache is a projection.
- Match batch by partner, order, amount, and expected points. Late file keeps pending; mismatch creates an exception with SLA, don't guess success.
- Expiry index/bucket avoids scanning every lot. Partition by member hash supports balance; expiry by time needs a separate index/queue.
- Rate/velocity cap per member/merchant, refund ratio and fraud review prevent farming. Materialized balance is fast to read but needs reconciliation/rebuild; computing from the ledger is simpler but more expensive.
- Repeated batch ID with different checksum must go to quarantine. Partner settlement may be missing, duplicated, or from the wrong period; store the immutable raw file and matcher result for audit.

### Deep questions
- A refund after 30 days but the customer already spent the points: how is it handled?
- Same batch ID but different checksum: who decides?
- How is expiry and redemption competing for the same lot serialized?

> Senior tip: monitor liability by expiry bucket, orphan event, batch mismatch, and negative balance. A spike in points about to expire may be due to a timezone/job retry error rather than a marketing campaign.`,
    follow: ['How long are pending points kept when settlement is delayed?', 'Is a negative balance allowed and who approves it?', 'How do you rebuild the balance after an earn-rule bug?'],
  },
});
