/*
 * English translation of js/data/q-banking.js — task T968. Format: js/core/i18n.js (content overlay).
 * ids: banking-031 banking-032 banking-033 banking-034 banking-035 banking-036 banking-037 banking-038
 */
App.i18n.content({

  'banking-031': {
    q: "What is the difference between available balance and ledger balance, what is hold/authorization, and how is a hold released?",
    a: `**Summary:** Ledger balance is the total amount actually recorded in the account's ledger. Available balance is the amount the customer can actually use right now, equal to ledger balance minus amounts currently on hold. A hold is money temporarily locked — for example when paying by card or transferring money that is not finished yet — to prevent spending the same money twice. The hold is released when the transaction completes (capture), is cancelled (void), or expires, and the money becomes available again.

### What is ledger balance
Ledger balance is the figure on the ledger (the book that records every movement of money) of the account. Every successful transaction — deposit, withdrawal, transfer — adds or subtracts a line on the ledger, and the ledger balance updates immediately.
Example: customer A has 10,000,000 VND on the ledger. A withdraws 2,000,000 VND via ATM → the ledger records the subtraction → ledger balance becomes 8,000,000 VND. This is the accounting figure used for end-of-day reconciliation.
Ledger balance reflects "money that has actually moved in or out", but does not say "how much money the customer can use right now" if there are amounts on hold.

### What is available balance
Available balance = ledger balance - total amounts currently on hold - transactions being processed but not yet posted. This is the figure the system must check before allowing the customer to withdraw or transfer money.
Why not use ledger balance to decide spending? Because there can be money on the ledger that is being "reserved" for another transaction. If spending were allowed, the customer would spend the same money twice.
Example: account has 10,000,000 VND ledger balance. Customer uses card to buy goods for 2,000,000 VND, the bank places a hold of 2,000,000 VND. Ledger balance is still 10,000,000 VND (money has not actually left the account), but available balance is only 8,000,000 VND. If the customer tries to withdraw 9,000,000 VND, the system must reject it because available balance is only 8,000,000 VND.

| | Ledger balance | Available balance |
|---|---|---|
| Meaning | Total amount actually recorded on the ledger | Money the customer can use right now |
| Counts hold | No | Yes (subtracts holds) |
| Used for | Accounting reconciliation, reporting | Deciding whether to allow withdrawal or transfer |

### What is hold / authorization
Hold (money lock) is an amount temporarily locked on the account, not yet actually subtracted from the ledger but already unusable for other transactions. It happens when:
- Card payment: the bank locks the transaction amount to ensure money is still available when the merchant later sends a request to collect the money.
- Transfer not yet completed: money is locked until the counterparty confirms receipt.
- Fees, deposits, guarantees.

Each hold usually has an expiry time (for example 7 days for card transactions). If the merchant does not send a request to collect money within the time limit, the system automatically releases the hold and the money becomes available again.

~~~seq
title: Hold when paying by card
actors: Customer | Merchant | Acquirer | Network | Issuer
Customer -> Merchant: swipe card, buy 2 million
Merchant -> Acquirer: authorization request for 2 million
Acquirer -> Network: forward request to issuer
Network -> Issuer: check card and limit
Issuer -> Issuer: hold 2 million on limit
Issuer --> Network: approve, auth code
Network --> Acquirer: approve
Acquirer --> Merchant: success, print receipt
~~~

### How a hold is released
1. Transaction completed (capture): merchant sends capture request, hold becomes actual money subtraction; ledger balance and available balance both decrease.
2. Transaction cancelled (void): hold is released, money returns to available, ledger balance unchanged.
3. Hold expired: system automatically releases after time limit, money returns to available.

### Common mistakes
- Checking only ledger balance when allowing spending → customer spends more than available, balance can go negative.
- Hold without expiry → money locked forever, customer cannot use their own money.
- Released hold but available balance not updated → displayed balance wrong, customers complain.

> Senior tip: In the interview, emphasize that available balance (not ledger balance) is the source of truth for the system to decide whether to allow spending, and every hold must have a clear expiry plus an automatic release job. Example: ledger 10 million, hold 2 million, available 8 million.

> Term: Hold (money lock) is an amount temporarily locked in the account, not actually subtracted but unusable. Authorization is the step where the bank agrees to hold money for a card transaction that is not yet completed.
    `,
    follow: [
      "When the hold expires but the merchant has not captured, how to handle?",
      "Why is available balance more important than ledger balance when allowing spending?",
      "If hold and capture happen at the same time, how to avoid double spending?"
    ],
  },

  'banking-032': {
    q: "How to prevent double spending end-to-end from mobile to gateway to core banking: protection layers and processing order?",
    a: `**Summary:** To avoid double spending, each layer (mobile app, API gateway, business service, core banking) must have its own protection mechanism: mobile uses button disable and idempotency lock; gateway uses rate limiting and duplicate check; core uses a unique constraint and ACID transactions. Processing order: check the lock first, then process, save the result, then return. The idempotency key must be created by the customer and carried end-to-end from mobile to core.

### What is end-to-end
A money transfer transaction does not happen in one place; it goes through many layers: mobile app → API gateway → business service → core banking → database. Each layer can retry or resend a request. Without protection, a request lost in the network could be sent twice and money deducted twice.
Everyday example: customer taps "Transfer 5 million", the network glitches, the customer does not see the result so taps again. If the system does not check, two "transfer 5 million" commands reach core and money is deducted 10 million instead of 5 million.

### Protection layers
1. Mobile: disable the button immediately after the customer taps, create a unique idempotency lock (UUID), store it on the device so retries also use the old key.
2. API gateway: rate limit requests per customer, check duplicates by idempotency key in short-term cache; if the key exists, return the stored result without processing further.
3. Business service: check the key in the database; if already processed, return the old result; if not, process new.
4. Core banking: unique constraint on the idempotency key column, ACID transaction, check balance before deducting money.

### Processing order (step by step)
1. Customer confirms the transfer on mobile; the app creates key K (unique, e.g. UUID) and sends the request with K.
2. Gateway checks cache: if K exists → return the stored result, do not process again.
3. If K is not present, the gateway forwards the request to the business service.
4. The service checks the database: if K was already processed → return the old result.
5. If not, the service calls core banking to deduct money.
6. Core performs within one ACID transaction: check balance, deduct money, save K and the result.
7. Result returns: service → gateway → mobile.

Numerical example: customer transfers 5,000,000 VND, key K = "a1b2-c3d4". Network lost after sending, the customer sees "Retry" with the same key K. Gateway/service find K already processed → return the old "success" result, do not deduct another 5 million.

### Common mistakes
- Mobile creates a new key on each retry → cannot block duplicate requests, money may be deducted multiple times.
- Gateway cache expires before core finishes processing → request processed twice (duplicate).
- Core does not have a unique constraint on the key column → two requests with the same key both deduct money.
- Customer creates a new request instead of retrying the old one → creates a new transaction unrelated to the old key.

> Senior tip: In the interview, draw a diagram of the layers and point out which layer protects at which level. Emphasize that the idempotency key must be created by the customer (not the server) and carried end-to-end from mobile to core. For money, preventing duplicates matters more than not skipping a request.

> Term: Idempotency key is a unique ID attached to a request, used to detect that a request was resent (retry) and to process it only once.
    `,
    follow: [
      "If mobile loses network after sending the request, how to retry safely?",
      "Gateway cache expires before core finishes processing, how to handle?",
      "Core banking uses a unique constraint on which column?"
    ],
  },

  'banking-033': {
    q: "Automatic reconciliation: file matching, discrepancy handling, reporting, and the maker-checker process — how does it work?",
    a: `**Summary:** Automatic reconciliation matches our transactions with the counterparty's data (NAPAS, bank, payment gateway) by common reference code, classifies results (matched / only ours / only counterparty / amount or status mismatch), automatically processes discrepancy types with clear rules, and routes the rest to a queue for human handling under maker-checker: one person proposes an adjustment, another approves before posting.

### Why reconciliation is needed
Two systems record the same transaction independently, over a network that can time out, lose responses, process late across days, or refund partially. Without reconciliation, discrepancies accumulate silently: customer deducted but recipient did not receive, or bank paid out but did not debit. State Bank and card partner regulations also require daily reconciliation.

### Step-by-step process
1. Receive data: SFTP file or partner API; check integrity (signature, checksum, line count and total amount on the last line). Invalid file → stop and request resend — do not process half-baked.
2. Normalize to a common format (reference code, amount in the smallest unit, status, UTC time) then load into a staging table.
3. Match by reference code (not by amount + time):
~~~sql
SELECT coalesce(o.ref, p.ref) AS ref,
       CASE WHEN o.ref IS NULL THEN 'ONLY_PARTNER'
            WHEN p.ref IS NULL THEN 'ONLY_OURS'
            WHEN o.amount <> p.amount OR o.status <> p.status THEN 'MISMATCH'
            ELSE 'MATCHED' END AS result
FROM ours_day o FULL OUTER JOIN partner_day p ON o.ref = p.ref;
~~~
4. Automatically process groups with clear rules: our transaction stuck but partner reports success → complete; discrepancy due to day boundary → reconcile with the next day's data; fee difference per the known fee schedule → post a fee entry.
5. Manual queue for the rest, with full evidence (lines from both sides, status history, related logs).

### Maker-checker and reporting
| Role | Task | Constraint |
|---|---|---|
| Maker (investigation staff) | View discrepancy, propose adjustment, attach evidence | Cannot approve their own proposal |
| Checker (controller) | Approve or reject | Mandatory for amounts above the threshold |
| System | Post adjustment as a new entry, never edit the original transaction; full audit | No "manual edit" permission in the DB |

Daily report: number of transactions, match rate, number of discrepancies by type and by counterparty, age of unprocessed items; alert when the discrepancy count exceeds the normal level.

### Real-world example
A wallet reconciled manually via Excel with 3 partner banks: about 150 discrepancies per day, 2 staff working all morning, the oldest discrepancy pending for 47 days. After automation per the process above, 82% of discrepancies are processed automatically (mostly day-boundary issues and stuck transactions already confirmed successful by the partner), the rest go to the maker-checker queue with a 2-business-day SLA. One internal audit previously found a staff member who both proposed and self-approved an adjustment — the system now blocks this.

### Common mistakes
- Matching by amount and time → wrongly matches two transactions with the same amount.
- Editing the original transaction directly instead of posting an adjustment entry → lose the audit trail.
- Processing an incomplete or erroneous file → wrong results for the whole day.
- Not tracking discrepancy age → backlog accumulates monthly.

### Sample interview answer
"Automatic reconciliation in my work has five steps. Receive partner data and check integrity — for an invalid file, request resend rather than partial processing. Normalize to a common format then match by common reference code using a full outer join, yielding four groups: matched, only ours, only partner, amount or status mismatch. Automatically process groups with clear rules, such as stuck transactions confirmed successful by the partner or discrepancies due to day boundaries. The rest goes to a queue under maker-checker: one person proposes an adjustment with evidence, another approves, and the system blocks self-approval. Every adjustment is a new entry, never edits the original transaction, with full audit. Finally, a daily report by discrepancy type, by counterparty, and by age of unprocessed items."

> Senior tip: track root causes of discrepancies by week. Each recurring root cause group is an opportunity to automate or fix at the source system — the goal is an ever-shorter manual queue, not hiring more reconcilers.
    `,
    follow: [
      "If the partner file arrives 2 days late, how to handle?",
      "How to distinguish a real discrepancy from a parse error?",
      "Who has authority to approve balance adjustments?"
    ],
  },

  'banking-034': {
    q: "Modern core banking architecture vs mainframe: immutable ledger, event-driven, end-of-day batch, and trade-offs — how do they compare?",
    a: `**Summary:** Traditional core banking often runs on a mainframe with end-of-day batch processing and a mutable ledger that can be edited directly. Modern core banking uses an immutable (append-only) ledger, event-driven architecture, and independent services (microservices); end-of-day batch still exists but is lighter, only for summarizing and reconciling. Trade-off: modern is more flexible and near real-time but more complex; mainframe is stable and well-controlled but hard to change and hard to connect with new systems.

### Traditional mainframe
- Runs on a large host (e.g. IBM z/OS), processes large batches (batch) at end of day.
- The ledger can be edited directly (mutable), audit trail hard to trace.
- Stable, high transaction volume (high throughput), but hard to connect with new systems.

### Modern core banking system
- Immutable ledger: only new lines can be added, old lines are never edited or deleted; every change is an event.
- Event-driven: each transaction emits an event, related systems receive and react immediately (real-time).
- Microservices: core, payments, channels split into independent services.
- End-of-day batch still exists but is lighter, only summarizes data and reconciles.

| Criterion | Mainframe | Modern |
|---|---|---|
| Speed of change | Slow | Fast |
| Real-time | Hard | Easy |
| Complexity | Low (centralized) | High (distributed) |
| Audit | Hard | Easy (event log) |
| Upfront cost | High | Moderate |
| Operational risk | Low | Higher |

Numerical example: a large, stable bank with almost unchanged transactions may keep the mainframe for the ledger; a digital bank that needs to release new features continuously chooses modern architecture.

### Common mistakes
- Modernizing without keeping the audit trail → lose control.
- Event-driven without duplicate prevention → transactions processed twice.
- End-of-day batch still too heavy → congested at night.

### Real-world example
A bank kept its mainframe core (COBOL, 6-hour EOD batch every night) but needs 24/7 transfers and real-time balance on the app. Instead of replacing the core in one go (another bank's "big bang" project lasted 4 years and went double over budget), they did it step by step: built a new immutable ledger (each transaction is a double-entry bookkeeping entry, append-only, never edited) for wallet and payment accounts; the mainframe remains the official ledger, synchronized both ways via events and reconciled every hour; available balance on the app is calculated from the new ledger in real time, while the mainframe EOD batch only calculates interest and reports. After 18 months, 70% of transactions go through the new ledger; EOD batch time dropped from 6 hours to 2 hours because there is less work. Trade-off: extra systems to run and reconcile between two ledgers during the transition.

### Sample interview answer
"Traditional mainframe core banking is very stable, processes transactions well, but relies heavily on end-of-day batch, is hard to change, hard to integrate with 24/7 digital channels, and COBOL talent is increasingly scarce. Modern architecture aims for an immutable ledger based on double-entry bookkeeping — only add entries, never edit — real-time balances, communication via events, and services split by business domain such as accounts, payments, loans. EOD batch still exists for interest, fees, reports, but is lighter. The trade-off is distributed complexity: consistency between services, idempotency, reconciliation. In practice, few banks replace the core all at once; I support the strangler approach: build a new ledger for the parts needing real time, synchronize and reconcile with the old core, gradually shift business, always keep a rollback path."

> Senior tip: In the interview, emphasize that "modern is not always better". Mainframe still suits large, stable, rarely-changing banks; modern architecture suits when you need continuous new features and real-time processing. The choice depends on scale, budget, and the operations team.

> Term: Event-driven architecture is an architecture that processes events, where components react to events instead of calling each other directly.
    `,
    follow: [
      "When to keep mainframe instead of modernizing?",
      "How does an immutable ledger help audit compared to mutable?",
      "What are the risks of event-driven in banking?"
    ],
  },

  'banking-035': {
    q: "Security and compliance: PCI DSS, tokenization, HSM and immutable audit log in card systems — how do they work?",
    a: `**Summary:** Card systems must comply with PCI DSS (card data security standard by international card organizations). The most effective approach is scope reduction: the real card number (PAN) exists only in a tokenization vault, other systems keep only tokens; encryption keys and sensitive cryptographic operations (PIN, card keys) are in an HSM — tamper-resistant hardware; and every access to sensitive data is recorded in an immutable audit log.

### What PCI DSS requires (key points)
- Do not store sensitive authentication data after authorization: CVV/CVC, full magnetic stripe data, PIN — never store.
- PAN if stored must be unreadable (strong encryption, tokenization, or keyed hash); display is masked (usually the first 6 and last 4 digits).
- Encrypt in transit over the network (TLS), network segmentation for the card data environment (CDE), key management, need-to-know access control, access logging, vulnerability scanning and regular penetration testing. The current version is PCI DSS 4.0.x.
Every system that stores, processes or transmits PAN — and systems connected to them — is in scope for assessment. So reducing the number of places touching PAN is the biggest way to cut cost and risk.

### How tokenization works
~~~seq
title: Save card for later payment
actors: App | Gateway | Vault | HSM | Core
App -> Gateway: PAN (TLS, vault card entry page)
Gateway -> Vault: tokenize(PAN)
Vault -> HSM: encrypt PAN with HSM key
Vault --> Gateway: token tok_7f3a... + last 4 digits
Gateway -> Core: save token, do not save PAN
Core -> Vault: at payment: detokenize (only authorized service)
~~~
A token is a random string that cannot be reversed to PAN; only the vault (isolated network, tight permissions) can convert a token back to PAN. Core banking, CRM, data warehouse, logs only see the token → out of PCI scope.

### HSM
A hardware device (or cloud service such as AWS CloudHSM, KMS) keeps keys never leaving the device in plaintext, physically tamper-resistant, FIPS 140 certified. Used for: data encryption keys (usually the envelope encryption model: the data key is encrypted by the master key in the HSM), PIN generation and verification, chip card ARQC verification, message signing. Rotate keys periodically without decrypting all data thanks to envelope encryption.

### Immutable audit log
- Record who/when/what with card data (especially detokenize, view full PAN, change permissions).
- Store in immutable storage (WORM, e.g. S3 Object Lock), hash chain and periodic signing with a key the operations team cannot use; separation of duties: system administrators cannot delete logs.
- Do not write PAN or sensitive data into the audit log itself.

### Real-world example
A fintech preparing for its first PCI DSS audit: review found PAN in 6 places (transaction table, logs, partner export files, DB copy for analytics, cache, test environment). After 4 months moving to vault tokenization with HSM, centralized log masking, synthetic test data, the assessment scope shrank from 35 services to 4; detokenize only for 2 services with identity-based permissions and every call audited. The audit passed on the first attempt, and assessment cost was significantly reduced.

### Common mistakes
- Writing PAN or CVV into logs when debugging payment errors.
- Encrypting PAN but keeping the key in a config file next to the data.
- Copying real card data to the test environment.
- Tokenizing but granting wide detokenize permission to every service.

### Sample interview answer
"For card systems, I comply with PCI DSS by reducing scope as much as possible. The full card number is only entered through the vault page or SDK and stored only in the tokenization vault on an isolated network; other systems like core, CRM, data warehouse keep only tokens and the last 4 digits, so they are out of scope. Never store CVV, PIN, or full magnetic stripe data after authorization. Encryption keys are in HSM or KMS using envelope encryption, the master key never leaves the device, rotated periodically. HSM is also used for operations like PIN verification and chip card cryptogram verification. Every detokenize or sensitive data view is recorded in an immutable audit log with hash chain and separation of duties. Application logs are centrally masked, and the test environment uses synthetic data."

> Senior tip: draw the cardholder data flow diagram before every architecture change related to payments. A new service accidentally receiving PAN means that service and everything connected to it falls into PCI scope.

> Term: Tokenization replaces PAN with a random token that cannot be reversed to PAN; only the vault can detokenize.
    `,
    follow: [
      "Why is HSM safer than storing keys in a config file?",
      "How is tokenization different from encryption?",
      "How is immutable audit log implemented at the DB level?"
    ],
  },

  'banking-036': {
    q: "NAPAS 24/7 fast interbank transfer: pending/timeout status, inquiry, and end-of-day reconciliation — how are they handled?",
    a: `**Summary:** With 24/7 fast transfers via NAPAS, timeout does not mean failure — it only means the result is unknown. The transaction moves to pending inquiry status, the sender's money is temporarily held (not auto-refunded, no resend allowed), the system asks for status by unique transaction ID, and end-of-day reconciliation with the NAPAS file settles stuck transactions. Money is only refunded when there is confirmation of failure or the inquiry deadline per process.

### Why timeout is dangerous
When sending a command and receiving no response within the allowed time, there are three possibilities:
1. NAPAS has not received the command → money not sent.
2. NAPAS has processed successfully (recipient already credited) but the response was lost on the way back.
3. The transaction is being processed on one side.
If timeout is treated as failure and money refunded (or the customer allowed to resend), case 2 causes money sent twice or the bank loses money.

### Transaction state machine
~~~text
[SENDING] --success response--> [SUCCESS]
[SENDING] --failure response--> [FAILED] --> refund temporary hold
[SENDING] --timeout / network error--> [PENDING_INQUIRY]
[PENDING_INQUIRY] --inquiry: success--> [SUCCESS]
[PENDING_INQUIRY] --inquiry: failure--> [FAILED] --> refund
[PENDING_INQUIRY] --over deadline, still unclear--> [MANUAL_INVESTIGATION] --> inquiry/reconciliation with NAPAS
~~~
At PENDING_INQUIRY, money is temporarily held out of available balance but not officially debited; the app shows "processing".

### Inquiry by transaction ID
- Each command has a unique reference ID created by the sending bank and sent with the command — this is the key to ask status and to reconcile.
- Automatic status inquiry job with backoff (e.g. after 1, 5, 15, 60 minutes); result updates the state machine idempotently.
- Do not automatically resend the command on timeout, unless the channel guarantees duplicate prevention by reference ID.

### End-of-day reconciliation
The NAPAS reconciliation file is matched with the bank's ledger by reference ID: a stuck transaction that NAPAS reports as success → complete; the bank recorded success but NAPAS does not have it → open inquiry; unresolved items go to the formal inquiry process with a NAPAS deadline and maker-checker for every adjustment.

### Real-world example
A digital bank used to handle timeout by telling the customer "transaction failed" and refunding immediately; the customer transferred again and in many cases the recipient received twice because the first command actually succeeded — about 40 cases per week, taking days to claim back. Switching to the state machine above: 92% of timeout transactions are settled automatically within 15 minutes via status inquiry, the rest settled in end-of-day reconciliation; no more double transfers, "money deducted but not received" complaints dropped because the app shows the correct status.

### Common mistakes
- Treating timeout as failure and refunding immediately.
- Allowing the customer to resend while the transaction is stuck.
- No unique reference ID end-to-end → cannot inquire.
- Manually editing status in the DB instead of through an approval process.

### Sample interview answer
"With NAPAS 24/7, timeout means the result is unknown, because NAPAS may not have received the command, or may have processed successfully but the response was lost. So I do not treat timeout as failure: the transaction moves to pending inquiry status, the sender's money is temporarily held, the app shows processing and no resend is allowed. Every command has a unique reference ID; a job asks for status by that ID with backoff and updates the state machine idempotently: success → official debit, failure → refund the temporary hold. Items still unclear are settled in end-of-day reconciliation with the NAPAS file, or go into the formal inquiry process with a deadline and maker-checker. We never automatically resend the command, because that is the fastest way to send money twice."

> Senior tip: measure the rate of transactions falling into pending inquiry status by hour and by receiving bank. A sudden spike is usually the earliest sign of a partner-side incident — even before they notify.
    `,
    follow: [
      "Why not automatically retry on timeout?",
      "How does the transaction ID help inquiry?",
      "How is a transaction stuck over a month handled?"
    ],
  },

  'banking-037': {
    q: "Idempotency end-to-end from mobile to gateway to core: key design, storage, and retry handling at lead level?",
    a: `**Summary:** End-to-end idempotency means a user's payment intent produces exactly one result even if the request is resent at any layer (app retry, gateway retry, consumer receives duplicate). The key is created once by the client for each intent, carried end-to-end mobile → gateway → service → core (and to counterparties), stored durably with the result in the DB with a unique constraint, in the same transaction as business changes. For money, if the key store fails → fail-closed (reject), not fail-open.

### Key design
- The app generates a UUID when the user confirms the transaction (not on every request send), stores it locally so every retry uses the same key — even after the app is closed.
- The key is tied to the user and the content: the server also stores a hash of the request; same key but different content → reject (422), avoid key misuse.
- Each layer forwards the key (header Idempotency-Key), and the layer calling counterparties uses a key or reference derived from it so counterparties also prevent duplicates.

### Storage and processing
~~~sql
CREATE TABLE idempotency_keys (
  user_id     bigint NOT NULL,
  idem_key    uuid   NOT NULL,
  request_hash text  NOT NULL,
  status      text   NOT NULL,          -- IN_PROGRESS | DONE
  response    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, idem_key)
);
~~~
1. Start transaction, INSERT ... status = 'IN_PROGRESS'; duplicate key PK → read the old record.
2. Old record DONE → return the stored response exactly. IN_PROGRESS → return 409 (or 202 with status link) so the client asks again later.
3. Perform business logic (post entries…) and update status = 'DONE', response = ... in the same transaction; error rolls back both, the next retry is processed again.
Redis at the gateway can be a fast filter layer, but the DB is the source of truth — Redis losing data must not cause duplicate processing.

### TTL
Keep keys at least longer than the time the client may retry (the app may resend after hours when the network returns); for money transactions usually keep for many days or longer, cleanup by a time-partition job.

### When the key store fails
Cannot read/write keys → reject the request (fail-closed, return 503 so the client retries later). Fail-open (just process) may create duplicate transactions — with money, being a little slow is always better than deducting twice.

### Real-world example
A digital bank only prevented duplicates at the gateway with Redis TTL 5 minutes. When the app retried after 8 minutes (the user reopened the app in a weak signal area), the key had expired → the second transfer command was processed; about 30 duplicate transactions per month. One Redis failover losing data also caused mass duplicates. Redesigned per the model above with keys stored in the DB in the same transaction and kept for 30 days, key passed to core and counterparty: duplicate transactions dropped to 0, reconciliation confirmed over 3 months.

### Common mistakes
- The server generates the key instead of the client → every retry is a new key.
- Key and business write in two different transactions → gap for duplicate or loss.
- TTL too short vs actual app retry behavior.
- Not checking content hash → the same key used for a different transaction.

### Sample interview answer
"End-to-end idempotency means one payment intent yields exactly one result, no matter which layer retries. The client generates the key once when the user confirms, stores it so every retry uses the same key, and the key travels end-to-end from app through gateway, service to core and to counterparties. The server stores the key with content hash, status and response in the DB with a primary key by user and key, written in the same transaction as the entry: done → return the old response; in progress → return 409 or 202; same key with different content → reject. Redis is only a fast filter, the DB is the source of truth. TTL must be longer than actual app retry behavior, for money usually several days. And if the key store fails, fail-closed: reject the request, because being a little slow is still better than deducting twice."

> Senior tip: write an end-to-end test sending the same key at three times (immediately, concurrently, after 2 hours) and check the number of entries. This test catches almost every idempotency gap before customers find it.
    `,
    follow: [
      "What should the idempotency key TTL be for money transactions?",
      "If Redis (cache) fails, should the money system fail-closed or fail-open?",
      "How to handle duplicate-key requests in flight?"
    ],
  },

  'banking-038': {
    q: "Advanced security and compliance: card data encryption (tokenization, HSM), immutable audit log and PCI DSS in microservices architecture — how does it work?",
    a: `**Summary:** In microservices, protect card numbers by tokenization (replace PAN with a random token), encrypt and store keys in HSM, write append-only audit logs, and keep PCI DSS scope minimal: only the vault touches PAN, other services only keep tokens.

### Tokenization and HSM (explained from the start)
PAN is the real card number (16 digits), the most sensitive data: anyone with PAN can borrow the customer's card. Tokenization replaces PAN with a token — a random meaningless string (e.g. tok_abc123xyz), only the vault knows which token maps to which PAN.

The customer enters the card into the app, the app sends PAN over TLS to the vault; the vault uses the HSM to encrypt PAN, stores the encrypted PAN, and returns the token. The app stores the token, not PAN. Other services (payment, orders…) only store the token. When charging, payment sends the token to the vault; the vault decrypts to get PAN and then calls the payment gateway.

HSM is a hardware device that stores keys, encrypts/decrypts inside, keys never leave the device in plaintext.

### PCI DSS and assessment scope
PCI DSS is a mandatory security standard for entities that store, process or transmit PAN. PAN in many services = many services in assessment scope. Only the vault touches PAN → only the vault is in PCI DSS scope; other services only keep tokens, out of scope, reducing compliance cost.

### Immutable audit log (append-only / WORM)
Every access to PAN or token must be logged: who, when, what. The log is append-only: only add new lines, never edit or delete. Stored as WORM (write once, read many, cannot edit or delete), kept at least 7 years.

### Code example: Java vault service
~~~java
class CardVaultService {
    private final HsmClient hsm; // calls HSM
    private final TokenRepository tokens; // mapping token <-> encrypted PAN

    String issueToken(String pan) {
        String encryptedPan = hsm.encrypt(pan); // encrypts PAN with HSM
        String token = TokenGenerator.random(); // random token
        tokens.save(token, encryptedPan); // only vault can get PAN
        return token;
    }

    String detokenize(String token) {
        String encryptedPan = tokens.findByToken(token); // gets encrypted PAN
        return hsm.decrypt(encryptedPan); // decrypts with HSM, returns PAN
    }
}
~~~

### When to use and when not to
Use when the system stores PAN itself or must comply with PCI DSS. No need to build your own vault if only receiving payments via a third-party gateway (Stripe, MoMo, VNPAY) and not storing PAN.
Trade-off: storing PAN at each service is simple but PAN leakage puts the whole system in PCI DSS scope; tokenization + vault puts only the vault in PCI DSS scope, adds vault call latency; adding HSM protects keys in hardware but costs more.

### Common production pitfalls
- Other services write PAN into logs or extended fields → expands PCI DSS scope.
- Token without access control check → anyone with a token can call the vault to get PAN.
- Not using HSM → keys in config files, easy to leak when source is accessed.
- Logs can be edited → lose evidence during incidents.

### Real-world example (production)
Bank ABC processes 2,000 card transactions per second (QPS) at peak, latency under 200 ms. Previously payment stored PAN in plaintext, the whole payment system was in PCI DSS scope. After vault + tokenization: payment only stores tokens, only the vault touches PAN, scope narrowed to 3 vault servers. If another service is compromised, the attacker only has tokens, which are useless without calling the vault.

### Sample interview answer (about 60–90 seconds)
"In microservices architecture, I protect card numbers with tokenization: replace PAN with a random token, only the vault knows the mapping and can retrieve PAN when needed. Encrypt and store keys in HSM, keys never leave the device. Every access to PAN or token is logged append-only, stored WORM, kept at least 7 years. Only the vault is in PCI DSS scope, other services only keep tokens, out of scope, reducing compliance cost. If another service is compromised, the attacker only has tokens, useless without calling the vault. Recommendation: encrypt all data in transit, use WORM logs, never cache plaintext PAN. This solution reduces compliance scope, reduces incident risk, and keeps latency low under 200 ms."

> Term: PAN is the real card number (16 digits), the most sensitive data.
> Term: WORM is storage that is write once, read many, cannot be edited or deleted.

> Senior tip: Emphasize the "least exposure" principle: only the vault touches PAN, each other service only keeps tokens — how to reduce PCI DSS scope when a service is compromised. Always define what happens when the vault fails before production rollout.
    `,
    follow: [
      "Why should only the vault service be in PCI scope?",
      "What is the risk if a token is leaked vs PAN leaked?",
      "How is immutable audit log implemented at infrastructure level?"
    ],
  },

});
