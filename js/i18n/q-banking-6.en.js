/*
 * English translation of js/data/q-banking.js — task T792. Format: js/core/i18n.js (content overlay).
 * ids: banking-029 banking-030
 */
App.i18n.content({

  'banking-029': {
    q: 'What is ISO 20022 and how do you standardize messages when integrating with banks/partners? Name the common message groups (pain/pacs/camt), the challenges of mapping data from legacy systems, and the migration strategy.',
    a: `**Summary:** **ISO 20022** is an international standard for financial messaging based on XML (with JSON/ASN.1 variants), using a common data model and a unified business dictionary, gradually replacing older/local standards (such as MT in SWIFT and many proprietary domestic formats). Real-world integration is a *mapping and standardization* problem: transforming core system data into ISO 20022 structures ({{pain/pacs/camt}}) and back, handling semantic differences, field length differences, and reference code differences. A safe strategy: an adapter/canonical model layer, parallel run, and validation through reconciliation.

### What ISO 20022 is (explained for beginners)
**ISO 20022**: a standard describing how electronic data is exchanged in finance. Instead of each party inventing its own format, the standard defines: (1) a *data dictionary* (name, meaning, type of each component such as amount, account, payer name) and (2) *messages* for each business process, expressed as XML Schema (XSD). Everyday analogy: instead of every company sending invoices in a different style, everyone agrees on one common template so machines can read them.

Compared to older standards (such as SWIFT MT, fixed-line text): ISO 20022 is richer in semantics, has a clear structure, carries more information (purpose codes, detailed beneficiary info) — better support for anti-money laundering (AML) and automation.

### Common message groups
Message names follow {{xxxx.nnn.nnn}} (4 letters + version):
~~~text
Group   Full name (meaning)          Common example                        Used when
-----  ---------------------------  -----------------------------------  -----------------------------
pain   Payments Initiation          pain.001 (Customer Credit Transfer   Initiating a credit transfer from a customer/business
                                    Initiation)
pacs   Payments Clearing&Settlement pacs.008 (FI to FI Customer Credit   Transfers between financial institutions
                                    Transfer), pacs.002 (Status Report)  (clearing/settlement), status reporting
camt   Cash Management             camt.053 (Bank to Customer           Statements, balance reports, movement notifications
                                    Statement), camt.054 (Debit/Credit
                                    Notification)
~~~
- **Clearing** (netting): netting obligations between parties. **Settlement**: actual money transfer to settle.
- Napas and modern payment systems are gradually moving to ISO 20022 (especially fast transfers), so new integrations usually touch the {{pacs/pain/camt}} groups.

### The mapping/standardization problem
The core system stores accounts, names, balances in its own model; the partner requires ISO 20022. You need a **mapping/adapter** layer:
~~~text
Core model  --(map)-->  Canonical/ISO 20022 model  --(serialize)-->  XML sent to partner
Core model  <--(map)--  Canonical/ISO 20022 model  <--(parse)-----   XML received back
~~~
**Canonical model** (internal standard model): an intermediate representation by your business semantics; avoids mapping N systems x N systems directly.

Real-world challenges:
- **Different semantics**: internal status codes {{SUCCESS/FAIL}} must map to ISO 20022 status codes (for example in {{pacs.002}}: {{ACCP}}, {{ACSC}}, {{RJCT}} with reason codes) — wrong mapping means wrong money result reported.
- **Field length/format**: core beneficiary name allows 200 chars, message accepts only 140; accented/special characters; structured vs free-text address.
- **Reference codes**: ISO 20022 has multiple id types ({{MsgId}}, {{InstrId}}, {{EndToEndId}}, {{TxId}}, {{UETR}}). Choose/keep stable the one used for reconciliation and tracing (see banking-024/025).
- **Currency and amounts**: decimal places, currency (VND scale 0 — banking-027) must follow message rules.
- **Mandatory/optional**: a field required by the partner but missing in core -> need a default-filling rule or reject the transaction upfront.

~~~seq
title: Luong tich hop gui pacs.008 qua lop chuan hoa
actors: CoreBank | Adapter | DoiTac
CoreBank -> Adapter: lenh chuyen tien (model noi bo)
Adapter -> Adapter: validate + map sang cau truc ISO 20022
Adapter -> Adapter: gan EndToEndId/TxId de truy vet
Adapter -> DoiTac: gui pacs.008 XML
DoiTac --> Adapter: pacs.002 status (ACSC/RJCT)
Adapter -> Adapter: map status + reason code ve model noi bo
Adapter --> CoreBank: cap nhat trang thai giao dich
~~~

### Safe migration strategy
- **Adapter/anti-corruption layer**: isolate ISO 20022 in one layer, don't let XML structure leak across the core.
- **Parallel run**: send/receive on both old and new channels (if applicable), compare results before cutting over.
- **Contract & validation**: validate XML against XSD + business rules; test with the partner's case set (certification/sandbox).
- **Version (variant)**: ISO 20022 has many versions and domestic "profiles" — lock the exact version/profile the partner requires, manage it as a versioned contract.
- **Observability & reconciliation**: log message ids, store messages (with sensitive data masked), reconcile daily to detect mapping errors.

### Common pitfalls
- Mapping "similar-looking" fields with different semantics (creation date vs value date, accepted vs settled) -> wrong business outcome.
- Generating a new {{EndToEndId}} on every retry -> loses reconciliation/tracing capability; trace code must stay stable per original transaction.
- Not handling reason codes on {{RJCT}} (rejected) -> only know "error" without the cause (wrong account, exceeded limit...).
- Hard-coding mappings scattered around -> hard to change when the partner upgrades version.

> Senior tip: At lead level, emphasize this is a *boundary management* and *data semantics* problem, not just "parsing XML". Three scoring points: (1) canonical model + adapter to isolate changes, (2) stable end-to-end reference code for idempotency/reconciliation/tracing, (3) parallel run + reconciliation before cutover. Always ask the partner: which profile/version they use, which fields are mandatory, which reason code set — never guess.
`,
    follow: [
      'How do EndToEndId, TxId, and MsgId differ in ISO 20022, and which code do you choose as the reconciliation/tracing key with the partner?',
      'How do you design the adapter layer so adding a new partner/payment channel does not require changing core business logic?',
      'When running the old channel and ISO 20022 in parallel, the two channels produce different results for the same transaction — how do you handle it?'
    ],
  },

  'banking-030': {
    q: 'How do you design a daily transaction limit for a digital bank so it withstands concurrent access, never allows exceeding the limit even when many transactions run at once, while still keeping good performance?',
    a: `**Summary:** A daily limit requires the total transactions of a customer within a business day not to exceed the threshold (for example 500 million/day). The challenge is **concurrency**: many concurrent requests read the same "how much used" and all see "enough remaining", causing the limit to be exceeded. Solution: update the limit using an *atomic* operation tied to the accept decision (check-and-reserve in one step), using DB atomic update/appropriate locking or a centralized counter (Redis atomic), plus idempotency so retries do not deduct the limit twice.

### The problem and why "read then write" fails
Suppose limit 10,000,000 VND/day, already used 9,000,000, remaining 1,000,000. Two transactions of 800,000 run concurrently:
~~~text
T1: read used = 9,000,000 -> remaining 1,000,000 >= 800,000 -> ACCEPT
T2: read used = 9,000,000 -> remaining 1,000,000 >= 800,000 -> ACCEPT  (at the same time!)
Result: total used 10,600,000 > 10,000,000 -> LIMIT EXCEEDED
~~~
This is the classic race condition (like banking-023). With high traffic (sales events, salary credits), the probability is high.

### Basic data model
~~~text
daily_limit_usage:
  customer_id, business_date, limit_type (TRANSFER/EWALLET/TOTAL)
  limit_amount   (the limit, may be snapshotted per day because limits can change)
  used_amount    (already used)
  reserved_amount (held for PENDING transactions)  -- depends on design
  updated_at, version
Business rule: used_amount + reserved_amount + new_amount <= limit_amount
~~~
Stored by {{(customer_id, business_date, limit_type)}} with a unique constraint. {{business_date}} follows the cut-off rule (banking-028), not blind server date/time.

### Approach 1 — Atomic update in DB (common, strong consistency)
Perform check and deduction in *one statement* so the DB guarantees atomicity:
~~~sql
-- Only update if enough limit remains (atomic check-and-set)
UPDATE daily_limit_usage
SET used_amount = used_amount + :amount, updated_at = now(), version = version + 1
WHERE customer_id = :cid AND business_date = :bdate AND limit_type = :type
  AND (used_amount + reserved_amount + :amount) <= limit_amount;

-- Check affected rows: 1 = success (reserved), 0 = exceeded limit -> reject
~~~
~~~java
int rows = jdbc.update(ATOMIC_RESERVE_SQL, amount, cid, bdate, type, amount);
if (rows == 0) throw new LimitExceededException("Daily limit exceeded");
~~~
Pros: consistent with the transaction DB; no extra infra. Note: ensure correct index; if one customer is extremely "hot", it can become a bottleneck (lock/contention on one row) — acceptable since limits are per customer.

### Approach 2 — Pessimistic lock on the limit row
{{SELECT ... FOR UPDATE}} the {{daily_limit_usage}} row of the customer, compute, then UPDATE within the same DB transaction. Safe, easy to understand, but reduces concurrency for the same customer (that customer's transactions queue up). Suitable for moderate traffic.

### Approach 3 — Centralized atomic counter (Redis) for very high traffic
Use Redis {{INCRBY}}/Lua script to check-and-increment atomically, extremely fast response; periodically/sync to DB for reconciliation and durability.
~~~text
Lua (runs atomically on Redis):
  current = GET key(cid,bdate,type) or 0
  if current + amount <= limit then current = current + amount; SET key current; return OK
  else return EXCEEDED
~~~
Risks: Redis is memory; need a durability strategy (persistence), handling data loss (fail-open vs fail-close — banks usually choose *fail-close*: if unsure about remaining limit, reject; safer than exceeding), and a DB reconciliation mechanism. More complex, only use when measured DB cannot keep up.

### Idempotency and reservation lifecycle
- Each transaction request has an {{idempotency_key}}. If the client retries with the same key, return the old result and **do not deduct the limit a second time**. Method: store mapping {{idempotency_key -> tx_id, amount_reserved}}; check before reserving.
- {{PENDING}} transaction: limit already reserved. {{SUCCESS}} -> convert reserved to used (or confirm). {{FAILED/REVERSED}} -> return it (decrease reserved/used). If {{PENDING}} hangs too long (timeout reconciliation, banking-025), need a controlled release job.
- Daily reset: when entering a new {{business_date}}, new day record {{used=0}} (create lazily on first transaction using {{INSERT ... ON CONFLICT DO NOTHING}}).

~~~seq
title: Reserve daily limit (atomic, prevent exceed)
actors: App | LimitService | DB | PaymentSvc
App -> LimitService: transfer 800000 (idempo_key=K1)
LimitService -> DB: check idempo_key K1 already processed?
DB --> LimitService: no
LimitService -> DB: UPDATE ... SET used=used+800000 WHERE used+800000<=limit
DB --> LimitService: 1 row (OK) or 0 row (exceeded)
LimitService -> PaymentSvc: OK -> continue transfer
LimitService --> App: success or reject "daily limit exceeded"
~~~

### Common pitfalls
- Separated check-then-act (read {{used}} in app, compare, then UPDATE adding) -> race condition exceeding limit.
- Non-idempotent retry -> each retry deducts more limit, customer locked out unfairly.
- Using calendar date instead of {{business_date}}/cut-off -> mismatch with books, wrong exactly at day boundary.
- Reserving on send but forgetting to release on {{FAILED/TIMEOUT}} confirmation failure -> limit "stuck".
- Choosing Redis without DB reconciliation and without defining behavior on Redis failure -> losing money or uncontrolled blocking.

> Senior tip: For this problem, a lead answer must balance *business correctness* and *scalability*: start from atomic DB update (correct, simple, sufficient for most cases because contention is per customer), introduce Redis/Lua only when data shows the bottleneck. Emphasize 3 invariants: (1) accept decision and limit deduction must be atomic, (2) every step has an idempotency key, (3) every intermediate state (PENDING/reserved) has an exit path (commit or release). Ask the interviewer back: is the limit by business day or calendar day, and are there cumulative limit types (total + per channel) — because that decides the data model.
`,
    follow: [
      'If a customer has multiple cumulative limit types (daily total + per-channel limit + new-beneficiary limit), how do you ensure all are updated atomically?',
      'When a transaction times out (PENDING_UNKNOWN), how long do you keep the reserved limit and what mechanism releases it safely without opening a gap to exceed the limit?',
      'Compare the trade-offs between atomic DB update and Redis Lua for this problem: at what threshold do you switch approaches and how do you verify?'
    ],
  },

});
