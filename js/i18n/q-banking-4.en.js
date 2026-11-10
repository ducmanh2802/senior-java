/*
 * English translation of js/data/q-banking.js — task T1151. Format: js/core/i18n.js (content overlay).
 * ids: banking-021 banking-022
 */
App.i18n.content({

  'banking-021': {
    q: 'Split an e-wallet system into services by domain (account, ledger, payment, notification): where are the data boundaries, who owns the balance, and how do you keep things consistent when one step in the money flow fails?',
    a: `**Summary:** Split by **business capability**, not by technical layer: account manages the customer profile and the account status, ledger is the **only** place allowed to post entries and therefore owns the balance, payment coordinates the money flow and declares a transaction successful or failed, notification only informs and must not hold any money state. Inside one service use an ordinary database transaction; between services use a **saga** (a compensating step when something fails) plus an **outbox** (write the event inside the same transaction, then send it) and consumers that resist duplication. Do not use distributed 2PC transactions; instead accept eventual consistency for the notification and reporting parts, while the posting part stays strongly consistent.

### The data boundary table
| Service | Owns | API it provides | Events it emits |
|---|---|---|---|
| account | customer profile, documents, ACTIVE/FROZEN/CLOSED status, KYC tier, regulatory limits | read profile, lock/close account | AccountFrozen, KycUpgraded |
| ledger | double-entry accounts, append-only entry records, derived balances, applied exchange rates | debit/credit per accounting instruction, balance query | LedgerEntryPosted |
| payment | payment order, lifecycle state, partner references, refund instruction | create payment, reconciliation query | PaymentAuthorized, PaymentSettled, PaymentFailed |
| notification | message templates, delivery channels (push, SMS, OTT), sent log, customer preferences | send, reschedule, cancel | MessageDelivered, MessageFailed |

The immovable rule: **no service reads another service's tables**. If you need each other's data, call a synchronous API (when you must answer right away) or consume events and keep your own copy for reading (a read model) for your own screens. Breaking this rule is the fastest way to get a "distributed monolith": editing one table kills four services at once.

### Why the ledger must be separate
- The balance is the most sensitive data: it must be written under ACID transactions, append-only, auditable. If it sits in the same service as payment, every new payment feature (fees, discounts, instalments) makes people edit the logic that touches money.
- Separating the ledger lets many channels share one book: wallet, transfer, bills, refunds — they all just send one "accounting instruction" (debit account A X, credit account B X, plus a reference).
- The ledger must reject an unbalanced instruction (total debits different from total credits) and reject a duplicate reference. That is the last checkpoint before money goes wrong.

### Consistency between services: saga plus outbox
The "top up 500,000 VND from a card into the wallet" flow:
1. payment creates the transaction and calls the issuer for authorization (synchronous, because you must answer the customer immediately).
2. If the issuer approves, payment sends the accounting instruction to the ledger: debit the bank's intermediary account, credit the customer's wallet account.
3. The ledger posts it inside one database transaction and writes the event into the outbox **in that same transaction**.
4. payment answers the customer "top-up successful".
5. notification receives the LedgerEntryPosted event and sends the push. If notification dies, the money is **not** rolled back: the event is still in the outbox, it will be sent again, and the customer gets the notification a few tens of seconds late.
6. If the ledger rejects (unbalanced, account closed), payment moves to FAILED; if the issuer already held the money, the saga runs the compensating step, which is releasing the authorization — compensation is a business-level undo, not a database rollback.

~~~seq
title: Top up 500,000 VND from card into wallet
actors: Customer | Payment | Ledger | Outbox | Notification
Customer -> Payment: top up 500,000 VND from card
Payment -> Payment: request authorization from issuer
Payment -> Ledger: accounting instruction: debit intermediary, credit wallet
Ledger -> Ledger: check balance, append-only post
Ledger -> Outbox: write event in the same transaction as balance
Ledger --> Payment: posted, ledger entry LE-9931
Payment --> Customer: top-up successful
Outbox -> Notification: emit LedgerEntryPosted (retried)
Notification -> Customer: push "Your wallet +500,000"
~~~

**The dual-write problem:** if the code "updates the database then publishes to Kafka" sits on two consecutive lines, the publish can succeed while the transaction rolls back, or the other way round. The outbox solves it by writing the event as a row in the same transaction as the business data; then a worker steadily pushes the unsent rows onto the bus and marks them as sent.

~~~sql
CREATE TABLE outbox_event (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  aggregate_id VARCHAR(64) NOT NULL,        -- payment id: keeps ordering per money line
  event_type   VARCHAR(64) NOT NULL,        -- LedgerEntryPosted
  version      SMALLINT    NOT NULL,        -- schema version, to add fields without breaking anyone
  payload      JSONB       NOT NULL,
  occurred_at  TIMESTAMPTZ NOT NULL,
  sent_at      TIMESTAMPTZ                  -- NULL means not sent yet
);
CREATE INDEX ix_outbox_unsent ON outbox_event (id) WHERE sent_at IS NULL;

CREATE TABLE consumer_dedup (               -- receiver side, prevents duplicate processing
  consumer   VARCHAR(40) NOT NULL,
  event_id   BIGINT      NOT NULL,
  handled_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (consumer, event_id)
);
~~~

Consumers **must be idempotent** because the bus delivers at-least-once: check the dedup table by event id before processing. If you need ordering, partition by a business key (walletId or paymentId); do not expect global ordering.

### A central conductor or distributed coordination
| | With a conductor (orchestration) | Only pushing events (choreography) |
|---|---|---|
| Money flows, many steps | clear, traceable, refunds easy | hard to trace the intermediate state |
| Adding a new step | change the conductor | add a new service, little change to old ones |
| Monitoring | one place shows the whole picture | you need tracing to know what is happening |
| Fits | payments, withdrawals, reconciliation | notifications, integrations, search sync |

### Common mistakes
- Two services both keep a balance (payment adds its own balance column "to be quick") → they drift apart and nobody knows which number is right. This is failure number one of wallet systems.
- A notification failure rolls back the money transaction: wrong in principle, because the money has already been posted.
- Sharing one database between services "for convenience" — in substance it is one monolith, just drawn as four boxes.
- Events without a version; a schema change silently breaks consumers; or card numbers/PII stuffed into events turn every subscriber into a store of sensitive data.
- Publishing the event before the transaction commits: the consumer reads data that does not exist yet.
- Not defining what "success" means: payment reports success while the ledger has not posted anything. Settle it: success = the ledger has posted; every step after that only distributes information.

> Senior tip: The interviewer's real question is not "how many boxes can you draw" but two questions: "who owns the balance" and "who is allowed to declare a transaction successful". Answer concisely: the ledger owns the balance, payment owns the lifecycle state, everywhere else there are only read copies that are allowed to be a few seconds late. Then talk about the trade-off: for posting you choose consistency and accept a temporary drop in serving capacity; for information you choose capacity and accept consistency arriving later — that very distinction is why sagas and outboxes exist.

> Terms: A saga is a chain of local steps where each step has a compensating step to undo it at business level when a later step fails; it is not one transaction stretched across several databases. An outbox is a table that records the event inside the business transaction itself, so publishing is never lost and never happens before the data exists.
`,
    follow: [
      'Why should the payment service not store its own balance column, even only for fast display?',
      'The notification fails to send after the ledger has already posted: how does the system behave and what does the customer see?',
      'Do you choose orchestration or choreography for the withdraw-to-bank flow, and why?'
    ]
  },

  'banking-022': {
    q: 'What do SLA, SLO, RTO and RPO mean for a payment system and how do they relate to each other; which numbers must an active-passive design across two data centers be able to prove?',
    a: `**Summary:** An SLA is the commitment made to the customer (with penalty clauses), an SLO is the internal target, an SLI is how you actually measure. RTO (Recovery Time Objective) is **how long until you must serve again**, RPO (Recovery Point Objective) is **how much data you are allowed to lose**, both expressed in time. For a payment system the RPO for transactions already reported as successful must be 0 (money already posted may not be lost), while the RTO for the transaction-accepting flow is usually 5-15 minutes. Active-passive between two data centers is only worth something once you can **measure and rehearse** those two numbers, not when the diagram looks nice.

### Four concepts chained together by numbers
- **SLI (the indicator):** for example the share of payment transactions that respond successfully in under 2 seconds, measured from the customer side, not "the server is alive".
- **SLO (internal target):** "99.95% of the minutes in the month meet the SLI".
- **SLA (commitment):** the SLO plus the financial/legal consequences when it is breached.
- **Error budget (downtime budget):** the amount of time you are still allowed to be broken in the period; once the budget is spent you pause feature releases to pay back the reliability debt.

~~~java
static BigDecimal allowedMinutesPerMonth(BigDecimal availabilityPercent) {
    BigDecimal minutesInMonth = new BigDecimal("43200");                // 30 days
    BigDecimal allowance = BigDecimal.ONE.subtract(availabilityPercent.movePointLeft(2));
    return minutesInMonth.multiply(allowance).setScale(2, RoundingMode.HALF_UP);
}
// 99.9   -> 43.20 minutes  99.95  -> 21.60 minutes
// 99.99  ->  4.32 minutes  99.999 ->  0.43 minutes (about 26 seconds)
~~~

| Target | Downtime allowed per month | What it really means for payments |
|---|---|---|
| 99.9% | 43 minutes | one morning incident drains the budget |
| 99.95% | 21.6 minutes | matches an RTO of 15 minutes plus headroom |
| 99.99% | 4.3 minutes | forces automatic failover, no waiting for a human decision |
| 99.999% | 26 seconds | you almost have to be active-active, very expensive |

### RPO decides replication, RTO decides the procedure
**RPO = 0** means that at the moment data center A burns down, there is no transaction that was reported successful but has not yet reached another place. The only way is for the **posting log (the database log / the ledger) to be replicated synchronously** to B, and the customer is only answered after B confirms. The price must be said out loud: every write waits for the A-to-B link, so latency rises (a few ms up to a few tens of ms depending on the distance), and if the link breaks then A must **pause writes**, because it can no longer hold the RPO — the detail many teams leave out and then believe they have RPO 0.
An **RPO of a few seconds** is acceptable for data that is not money itself (logs, analytics, cache) because it can be rebuilt from another source.

**RTO is the sum of a chain of steps**, not "restart quickly":

| Step | Time budget |
|---|---|
| Detect the incident (monitoring + alerting) | 1-2 minutes |
| Confirm and decide to fail over (must be an authorised person) | 2-3 minutes |
| Switch the inbound routing (DNS or VIP) to DC B | 1-3 minutes |
| Promote the standby database to primary, check the log endpoint | 2-5 minutes |
| Warm up the application, caches, partner connections | 2-4 minutes |
| Smoke checks, then open to customers | 2-3 minutes |
| **Total** | **10-20 minutes** |

If the contract states RTO 5 minutes, the table above shows you must automate the decision step or cut somewhere else — that is where the business commitment and the architecture meet, and it is why you should bring this table into the interview.

### What pieces an active-passive two-data-center design needs
- **Routing:** a load balancer/DNS with a short TTL (or an anycast VIP) so the switch is fast, plus a step that verifies traffic really arrived at B.
- **Database:** the standby continuously receives the log; when promoting it you must check "has the last transaction been applied" before accepting writes.
- **Arbiter (quorum):** with only two DCs, if the link between them breaks, both think the other one is dead and both accept writes — split-brain, producing two versions of the same account's balance. You need a third party that only votes (a small node in a third site or in the cloud) to decide who may write.
- **Configuration parity:** schema, migration tooling and features must be identical. If DC B has not been upgraded to the same release, failover becomes a second disaster.
- **Runbook and rehearsals:** check each part every quarter (fail over one service), do a full run every year, and **measure the real duration** of each step. An RTO on paper that has never been rehearsed does not exist yet.
- **Failback:** the road back to A is usually forgotten; data produced at B must be synced in the reverse direction before you cut traffic back.

### How a failover unfolds
~~~seq
title: Failover from DC A to DC B
actors: Customer | Routing | DC A | Arbiter | DC B
Customer -> Routing: payment request
Routing -> DC A: forward the request
DC A --> Routing: no response
Arbiter -> DC A: liveness check, failed
Arbiter -> DC B: quorum agrees, treat DC A as dead
Routing -> DC B: point routing to DC B
DC B -> DC B: promote the DB standby to primary
DC B -> DC B: check last transaction was applied
DC B --> Routing: ready to serve
Customer -> Routing: next payment request
Routing -> DC B: serve, the customer does not know DC A died
~~~

### After failover: transactions "sent but never answered"
During the 10-20 minutes of disruption there are transactions that reached A while the response never got to the customer. The customer (and an attacker) will press again. The correct handling: store a **customer-supplied dedup key** (idempotency key) right from the start, and when you reopen, allow reconciliation by that key and return exactly the old result; for transactions whose outcome is uncertain, keep an "under reconciliation" state and reconcile with the partner. You may not "be safe by pretending it never happened" — the customer presses again and gets debited twice.

### External dependencies cap your SLA
Your 99.95% SLA cannot stand alone if the link to the interbank switching system, the SMS carrier, or the eKYC identity provider only reaches 99.5%. Availability of a chain is the product of its parts: 0.9995 × 0.9995 × 0.995 ≈ 0.994. From that number, renegotiate with the business: either add a fallback channel for the weak dependency, or narrow the scope of what the contract commits to.

### Common mistakes
- Measuring "the server is alive" (it answers a ping) instead of "the transaction succeeds": the real system is red because p95 tripled while the dashboard is still green.
- The documentation says RPO 0 while replication is configured asynchronously.
- Being proud of "nightly backups" when a restore has never once been verified.
- A DNS TTL of 300-3600 seconds makes a "5-minute failover" actually take 40 minutes, because customers still point to the old DC.
- Nobody is authorised to press the failover button, so the whole engineering room watches over Zoom.
- A cold cache after the switch makes p95 spike: the RTO for customer experience is longer than the RTO for infrastructure.

> Senior tip: Answer with three settled points: (1) the RPO for data already reported successful must be 0, so posting is replicated synchronously, and I accept the trade-off of higher latency plus pausing writes when the link is lost; (2) RTO is the sum of a chain of steps, each with a named owner, I allocate a time budget per step and rehearse to measure the real numbers; (3) the SLA is capped by external dependencies, so I compute it as a chain and renegotiate the scope of the commitment. A fourth point that earns credit: a resilient payment system is one that is **replayable** — a lost connection does not lose money because every transaction already has a unique reference and a reconciliation record.

> Terms: Split-brain is the situation where two copies both believe they are the primary and both accept writes, producing two different balance histories. Failback is the step of bringing traffic back to the original data center after it is repaired; it is usually harder than failover because the data produced in the meantime must be synced in the reverse direction.
`,
    follow: [
      'Why does RPO 0 for transactions already reported successful force synchronous replication, and what is the price?',
      'The link between the two data centers breaks: how must the system behave so there are not two versions of the balance?',
      'After a failover the customer complains "I pressed the transfer twice" — which data do you rely on to answer?'
    ]
  }

});
