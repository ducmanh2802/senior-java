/*
 * English translation of js/data/q-banking.js — task T791. Format: js/core/i18n.js (content overlay).
 * ids: banking-023 banking-024 banking-025 banking-026 banking-027 banking-028
 */
App.i18n.content({

  'banking-023': {
    q: 'Why should a banking system not UPDATE the balance column directly in the accounts table when a transaction occurs, but instead use a ledger that records each entry (double-entry)? Explain with a race condition example (two transactions running at the same time competing to update the same account).',
    a: `**Summary:** Directly updating the balance (for example {{UPDATE accounts SET balance = balance - 100 WHERE id = ?}}) loses history, is hard to audit, and is error-prone when two transactions run at the same time and read the same old balance. A double-entry ledger (double-entry bookkeeping: each entry records at least 2 lines, one Debit side and one Credit side, total always zero) stores every change as an immutable (append-only) line, from which the balance can be recomputed at any time and discrepancies detected.

### What "directly updating the balance" means
The simplest approach when transferring money: read account A's balance, subtract 100,000, write it back. In SQL it looks like:
~~~sql
-- NAIVE approach: read then write (error-prone)
SELECT balance FROM accounts WHERE id = 'A';  -- reads 500.000
UPDATE accounts SET balance = 400000 WHERE id = 'A';  -- overwrites
~~~
Or more compactly in one statement: {{UPDATE accounts SET balance = balance - 100000 WHERE id = 'A'}}. This is fast but has 3 major problems.

### Problem 1 — Loss of history, cannot audit
After UPDATE, the old value (500.000) disappears. If a customer asks "how much did my account have this morning, who deducted money?", you have no line to answer from. Banks are supervised by regulators: every money movement must be traceable — who did it, when, why. Overwriting the balance violates this principle.

### Problem 2 — Race condition (simultaneous contention)
**Race condition** (contention condition): a wrong result because two processing threads read/write the same data and their execution order interleaves. Everyday example: two people both look at a wallet containing 500.000, each withdraws 400.000, both think "enough money" — total withdrawn 800.000 even though the wallet only has 500.000.

Concrete example on account A with 500.000 VND, two transactions running at nearly the same time:
~~~text
Time        Transaction T1 (withdraw 400.000)    Transaction T2 (withdraw 300.000)
t1          Read balance = 500.000
t2                                      Read balance = 500.000  (still 500k!)
t3          Check: 500k >= 400k -> OK
t4                                      Check: 500k >= 300k -> OK
t5          UPDATE balance = 500k - 400k = 100k
t6                                      UPDATE balance = 500k - 300k = 200k
Result: balance = 200.000, but actually 700.000 was withdrawn from 500.000 -> negative 200.000 hidden
~~~
The atomic (atomic, executes in one step at the DB level) statement {{UPDATE ... SET balance = balance - x}} reduces risk at t5/t6, but if the code splits into "read -> check -> write" as above it is still wrong. And even with an atomic statement, you still don't know which transaction ran first, there is no history.

### Problem 3 — Hard to reconcile and correct errors
If an interest batch runs wrong and UPDATEs 1 million accounts incorrectly, you have no way to "reverse" each entry accurately unless you only know the final balance. With a ledger, you add an adjusting entry (adjustment entry) and everything remains intact.

### How double-entry solves it
Each transfer of 100.000 from A to B creates 2 ledger lines in the same **DB transaction** (database transaction: a group of commands that either all succeed or all fail):
~~~sql
-- Ledger: only INSERT, never UPDATE/DELETE old lines
INSERT INTO ledger_entries(tx_id, account_id, direction, amount, created_at)
VALUES ('TX1', 'A', 'DEBIT',  100000, now());  -- A decreased
INSERT INTO ledger_entries(tx_id, account_id, direction, amount, created_at)
VALUES ('TX1', 'B', 'CREDIT', 100000, now());  -- B increased
~~~
- **DEBIT** (Debit) / **CREDIT** (Credit): the two sides of a double-entry entry. For a customer deposit account, recording Debit on account A means decreasing money in A, recording Credit on B means increasing money in B. The total of every entry in one tx always balances (Debit = Credit).
- Balance = total CREDIT - total DEBIT of the account (or store a "snapshot" balance table computed from the ledger, updated under control).
- Simultaneous check: use **SELECT ... FOR UPDATE** (lock the account row when reading to compute/check the balance) or the **optimistic locking** mechanism (optimistic lock: add a {{version}} column, UPDATE succeeds only if version matches) to fight race conditions.

~~~seq
title: Double-entry transfer in one DB transaction
actors: App | PaymentService | LedgerDB
App -> PaymentService: transfer 100000 from A to B
PaymentService -> LedgerDB: BEGIN
PaymentService -> LedgerDB: lock account A, compute balance from ledger
PaymentService -> LedgerDB: INSERT DEBIT A 100000
PaymentService -> LedgerDB: INSERT CREDIT B 100000
PaymentService -> LedgerDB: check sum = 0
PaymentService -> LedgerDB: COMMIT
PaymentService --> App: success, with tx_id to trace
~~~

### Common mistakes
- Still UPDATE balance directly "for speed" then INSERT ledger -> two data sources drift when an error occurs mid-way.
- INSERT 2 ledger lines but forget to wrap in one DB transaction -> lose one line, ledger does not balance.
- Computing balance by summing the entire ledger on every read on a large table -> slow; need a snapshot/balance table updated synchronously in the same transaction.
- Using {{double/float}} type for {{amount}} -> rounding error; always use {{BigDecimal}} or an integer in the smallest unit (see banking-027).

> Senior tip: In an interview, say clearly: "The balance is a *derived result* from the ledger, not the source of truth". The source of truth is the immutable entries. When asked how to fight race conditions, offer 2 choices: pessimistic lock {{SELECT FOR UPDATE}} on the account row (simple, safe, can bottleneck on hot accounts) or optimistic locking + retry (fewer locks, must handle conflicts). Don't forget: every money change must be inside a DB transaction and have a unique {{tx_id}} for idempotency.
  `,
    follow: [
      'How do pessimistic lock (SELECT FOR UPDATE) and optimistic lock (version/optimistic locking) differ, and when to choose which for a "hot" account?',
      'If you can only use an append-only ledger table, how do you compute and cache the current balance while still ensuring correctness?',
      'How is an adjusting entry (adjustment/reversal) written without breaking the immutability of the ledger?'
    ]
  },

  'banking-024': {
    q: 'How does end-of-day (EOD) reconciliation with Napas or payment partners take place? What are the common discrepancy types (break) and how is the processing done?',
    a: `**Summary:** Reconciliation is matching each transaction between your own books and the partner file/report (Napas, other banks, e-wallets) to ensure money recorded on both sides matches. Usually runs at end of day (EOD) or in batches: download partner file -> normalize -> match by key (transaction code, amount, time) -> classify discrepancies (break) -> investigate and adjust. Goal: no transaction is left "hanging" without an owner.

### What reconciliation is, why do it
**Reconciliation**: the process of comparing two independent records of the same event to find differences. Everyday example: at the end of a shift, a cashier counts the cash in the till and compares it with the amount on the computer — if there is a difference, they must find which transaction was wrong. In banking, "your till" is the ledger/core, "the partner's computer" is the file Napas sends.

Why can you not trust realtime responses 100%? Because of timeout/lost network: you send a transfer command, the partner may have already debited/credited but the response got lost (see banking-002/025). End-of-day reconciliation is the safety net that catches transactions with "unclear status".

### Typical reconciliation process
~~~seq
title: EOD reconciliation with Napas/partner
actors: CoreBank | ReconJob | PartnerFile | OpsTeam
CoreBank -> ReconJob: list of day T transactions (internal)
PartnerFile -> ReconJob: partner file of day T (CSV/XML/ISO)
ReconJob -> ReconJob: normalize format, map fields
ReconJob -> ReconJob: match by key (ref_id, amount, date)
ReconJob -> ReconJob: classify: MATCH / BREAK
ReconJob -> OpsTeam: report break + discrepancy details
OpsTeam -> CoreBank: investigate, send inquiry, adjust/reverse
~~~

### Matching key
Usually matched in multiple layers, from strict to loose:
1. **Unique reference code** (reference/trace number, e.g. {{RRN}} - Retrieval Reference Number, or {{STAN}} - Systems Trace Audit Number in card transactions): 1-1 matching is ideal.
2. **Amount + account + date**: used when the reference code format differs between the two sides.
3. **Amount + time range**: fuzzy matching, needs human approval.

### Common discrepancy types (break)
~~~text
Break type              Description                                      Handling
---------------------  -----------------------------------------  -----------------------------
On my side, not on DT  I recorded it but the partner does not have it  Investigate: did I record wrong? or has the partner not posted?
On DT, not on me        The partner has it but I do not              Investigate: timeout lost the response? add an entry
Match code, wrong amount Same transaction but amount differs          Check fees, rounding, exchange rate; adjust
Match code, wrong status I am PENDING, DT SUCCESS (or vice versa)    Run inquiry/confirm, update status
Duplicate              Same ref appears twice on one side             Check retry/idempotency, reverse the duplicate
~~~
**DT** = partner. **Inquiry** (query): send a question to the partner "what is the real status of transaction code X?".

### Simple data example
~~~text
My books (Core):  TX001  A->B  1.000.000  SUCCESS
                  TX002  C->D    500.000  PENDING  (timeout when calling Napas)
                  TX003  A->E    200.000  SUCCESS
Napas file:       TX001  A->B  1.000.000  SUCCESS
                  TX002  C->D    500.000  SUCCESS  (Napas processed it!)
                  TX004  F->G    300.000  SUCCESS  (I do not have it)
Result: TX001 MATCH; TX002 status mismatch -> inquiry/confirm then update; TX004 on DT, not on me -> urgent investigation
~~~

### Common mistakes
- Only comparing the day-end total without comparing each transaction -> the total can match by chance even though each entry is off.
- Matching key uses only amount -> many transactions with the same amount get matched wrongly.
- Not normalizing timezone/date format (I store UTC, partner sends local time) -> date mismatch, report "not found".
- Handling breaks entirely manually, with no tool/queue to track investigation status -> miss transactions hanging for days.
- Adjusting the ledger without maker-checker (see banking-026) -> fraud risk.

> Senior tip: Design reconciliation as a stateful pipeline: {{IMPORTED -> MATCHED -> BREAK_OPEN -> INVESTIGATING -> RESOLVED}}. Each break must have an owner, processing deadline (SLA), and action log. In an interview, stress: reconciliation is not just "reporting" but a mechanism to detect lost money; and every post-reconciliation adjustment must create a new entry on the ledger (append-only), never edit an old line.
  `,
    follow: [
      'How to design the reference key from the moment a transaction is created so that matching with Napas/partner is always 1-1?',
      'If the partner file arrives 2 days late or is sent duplicated, how does the reconciliation job handle it to be idempotent?',
      'When do you auto-resolve status and when do you require human approval?'
    ]
  },

  'banking-025': {
    q: 'When an interbank transfer via Napas/partner times out (no response received), how do you design the transaction status and investigation/refund process so that no money is lost and no money is duplicated?',
    a: `**Summary:** Timeout means *not knowing* the result, not failure. The transaction must move to an intermediate state (e.g. {{PENDING}} / {{UNKNOWN}}), never automatically retry debiting and never automatically refund immediately. Correct process: keep waiting state -> proactively investigate (inquiry) with the partner using the unique reference code -> update by result ({{SUCCESS}} / {{FAILED}}) -> only refund/reverse when failure is confirmed. Everything must be idempotent.

### What timeout is and why it is dangerous
**Timeout** (timeout): you send an HTTP request/message to Napas, after N seconds no response is received. Three possibilities may actually have happened:
1. Napas has not received the request -> money not debited on the other side yet.
2. Napas has processed successfully (money already sent to the receiving bank) but the response got lost on the way back.
3. Napas is still processing (very rare, but the system must account for it).

If you treat timeout = failure and let the customer send again (or automatically retry creating a new transaction), case (2) will cause the recipient to receive money twice or the sender to be debited twice. This is the most serious error in payments.

### Transaction state machine
~~~text
[INIT] --send request--> [SENT]
[SENT] --receive SUCCESS--> [SUCCESS] (done)
[SENT] --receive FAILED--> [FAILED]  (done, consider refund if hold)
[SENT] --timeout/network error--> [PENDING_UNKNOWN]
[PENDING_UNKNOWN] --inquiry: SUCCESS--> [SUCCESS]
[PENDING_UNKNOWN] --inquiry: FAILED--> [FAILED]
[PENDING_UNKNOWN] --inquiry: still UNKNOWN & past deadline--> [REVERSAL_PENDING] --confirm reverse--> [REVERSED]
~~~
**PENDING/UNKNOWN**: "hanging, not yet concluded" state. Money on the sending side may be **hold** (temporarily held) — not yet fully deducted from the available balance for other transactions, but not yet returned either.

~~~seq
title: Interbank transfer timeout and investigation
actors: CustomerApp | PaymentSvc | Napas | PartnerBank
CustomerApp -> PaymentSvc: transfer 5.000.000 to B
PaymentSvc -> PaymentSvc: create unique tx_id, hold A money, status SENT
PaymentSvc -> Napas: send transfer command (tx_id)
Napas -> PartnerBank: credit B
PartnerBank --> Napas: success
Napas --> PaymentSvc: timeout lost response
PaymentSvc -> PaymentSvc: switch status PENDING_UNKNOWN
PaymentSvc --> CustomerApp: Processing, please wait
PaymentSvc -> Napas: inquiry(tx_id) - investigate
Napas --> PaymentSvc: result SUCCESS
PaymentSvc -> PaymentSvc: update SUCCESS, commit debit of A
PaymentSvc --> CustomerApp: notify success
~~~

### Handling principles
- **No blind retry**: if you must resend at the technical layer, you must use the same {{tx_id}} and the partner must support idempotent (receive the same code -> return old result, do not process twice).
- **Idempotency key** (anti-duplicate key): a unique code attached to the customer's *intent* to transfer money. Generated on your side, sent along with Napas; stored uniquely in DB to block duplicate transactions when the customer clicks again.
- **Inquiry/investigation**: API or process to ask the partner for the final status of {{tx_id}}. Has an inquiry retry schedule (e.g. after 30s, 2m, 10m...) and a waiting time limit before escalating to manual handling.
- **Refund/reversal**: only performed when there is a {{FAILED}} confirmation from the partner or after the official investigation process concludes unsuccessfully. Refund by reversing entry on the ledger, clearly noting the original transaction reference.

~~~java
// Conceptual example: prevent duplicates with unique constraint + status check
@Transactional
public TransferResult createTransfer(String idempotencyKey, TransferCmd cmd) {
    // unique index on idempotency_key ensures 2 concurrent requests only 1 insert succeeds
    var existing = repo.findByIdempotencyKey(idempotencyKey);
    if (existing.isPresent()) return TransferResult.from(existing.get()); // return old result

    var tx = Transfer.pending(idempotencyKey, cmd); // initial status
    repo.save(tx);           // save before calling out
    try {
        var resp = napasClient.send(tx.getId(), cmd); // has configured timeout
        tx.applyResponse(resp); // SUCCESS or FAILED
    } catch (TimeoutException e) {
        tx.markPendingUnknown(); // DO NOT treat as FAILED
    }
    repo.save(tx);
    return TransferResult.from(tx);
}
~~~

### Common mistakes
- Catching {{Exception}} generally and setting {{FAILED}} -> timeout is handled as failure, causing wrong money reversal.
- Letting the customer click "Try again" to create a new transaction instead of looking up the old one via idempotency key.
- Not saving request/response and {{tx_id}} returned by the partner -> cannot investigate.
- Arbitrarily refunding after N minutes timeout without inquiry -> may refund wrongly when the partner has already processed successfully.
- {{PENDING_UNKNOWN}} hanging forever with no scan/escalation job -> customer money held indefinitely.

> Senior tip: Clearly distinguish 3 concepts when answering: *timeout* (not knowing the result), *technical retry* (resend with same idempotency key, safe if partner is idempotent) and *business retry* (create a new transfer request — only do when certain the old transaction failed). Stress "real money is safer than fast experience": better to tell the customer to wait for investigation than to refund/duplicate wrongly.
  `,
    follow: [
      'At which layers is idempotency ensured (client, your API, Napas/partner, DB) and what does each layer do?',
      'How do you design a periodic investigation job for PENDING_UNKNOWN transactions (frequency, backoff, limit, manual escalation)?',
      'When the partner confirms FAILED but you have already debited/held, what must the reversal flow ensure?'
    ]
  },

  'banking-026': {
    q: 'How are maker-checker (maker-checker) and audit trail implemented in banking systems? Describe the data model, approval flow, and separation of duties principles to prevent fraud.',
    a: `**Summary:** Maker-checker (four-eyes/dual control) requires one person to create the request (maker) and another to approve (checker) before the action takes effect — no one may approve their own creation. Audit trail is an immutable log recording *who did what, when, before/after value, from where*, serving traceability and compliance. Implementation needs: request state model, separation-of-duties checks in code, and append-only log that cannot be edited/deleted.

### Why maker-checker is needed
In banking, one operation (changing a limit, creating a special account, approving a refund, changing interest rate) can cause large damage. **Segregation of duties**: divide sensitive work among multiple people so one person cannot commit fraud alone. Everyday example: the person holding the till key and the person knowing the till code are two different people. Maker-checker is the technical implementation of this principle.

### Data model & state flow
~~~text
ApprovalRequest:
  id, action_type (REFUND/CHANGE_LIMIT/...), payload_json (content of proposal)
  status: DRAFT -> PENDING_APPROVAL -> APPROVED -> APPLIED  (or REJECTED / CANCELLED)
  maker_id, maker_at
  checker_id, checker_at, checker_comment
  applied_at, applied_by (usually system/job after APPROVED)
~~~
Core principle: **proposal payload** is stored frozen; when applied, the system uses exactly the approved payload, not maker data edited afterward.

~~~seq
title: Maker-checker flow for refund approval
actors: Maker | System | Checker | CoreLedger
Maker -> System: create REFUND request tx=TX9, amount 1.000.000
System -> System: save request status=PENDING_APPROVAL, maker_id=U1
Checker -> System: view request details
System -> System: check checker_id != maker_id
Checker -> System: APPROVE (comment)
System -> System: status=APPROVED, checker_id=U2
System -> CoreLedger: apply refund entry according to approved payload
CoreLedger --> System: refund tx successful, status=APPLIED
~~~

### Separation of duties (SoD) check in code
~~~java
public void approve(long requestId, User checker, String comment) {
    var req = repo.findPending(requestId).orElseThrow();
    if (req.getMakerId().equals(checker.getId())) {
        throw new BusinessException("Maker cannot approve their own request");
    }
    if (!checker.hasRole("APPROVER") || !checker.canApprove(req.getActionType(), req.getAmount())) {
        throw new AccessDeniedException("No permission to approve");
    }
    req.approve(checker.getId(), comment, Instant.now()); // record checker + time
    audit.log("APPROVE", checker, req.getId(), req.snapshot());
    repo.save(req);
}
~~~
Practical note: must handle the case where maker edits the request after sending -> edit must set status back to {{PENDING_APPROVAL}} and (depending on policy) may require re-approval; at the same time the checker must not approve a version changed from when they viewed it.

### Audit trail
**Audit trail**: an immutable record for each sensitive action. Minimum fields:
~~~text
audit_id, occurred_at, actor_id, actor_role, action,
resource_type, resource_id, before_json, after_json,
ip_address, user_agent, request_id/correlation_id, result (OK/DENY)
~~~
- **Immutable**: append only, no UPDATE/DELETE; separate DB permissions; usually pushed to a separate log store (WORM storage — Write Once Read Many: write once read many, no editing).
- **Correlation/request id**: code attached throughout a flow to trace every step.
- **Before/after**: know exactly which field changed from which value to which value.

### Authorization and approval thresholds
- **RBAC** (Role-Based Access Control): roles MAKER, CHECKER, ADMIN separate; system admin does not simultaneously have business approval rights over money.
- **Threshold**: refund < 5 million needs 1 checker, >= 5 million needs 2 checkers (dual approval) or higher level.
- **Conflict exclusion**: same team/direct relationship may be barred from cross-approval (depending on policy).

### Common mistakes
- Only hiding the "Approve" button on the UI but the API does not check {{maker_id != checker_id}} -> calling the API directly bypasses it.
- Allowing ADMIN to have all rights including creating and approving themselves -> breaks SoD.
- Audit log missing {{before/after}} or log being overwritten/edited -> loses legal value.
- Applying changes by reading current data instead of the approved payload -> maker edits data after approval, checker approves one thing and applies another.
- Not logging rejected actions (DENY) -> missing signs of probing/fraud.

> Senior tip: When interviewing, present three layers of protection: (1) *business* — state machine + SoD (maker != checker, correct role/threshold), (2) *data* — immutable payload, apply exactly the approved version, audit append-only, (3) *infrastructure* — separate DB/log permissions, anomaly monitoring. Maker-checker is not just "adding an approve button", it is an integrity constraint that must be enforced at the service/API layer, not trusting the UI.
  `,
    follow: [
      'If maker edits the request after checker has opened the approval screen, how should the system handle it so the checker does not approve the old content by mistake?',
      'How to design an audit trail to ensure immutability (no one can edit/delete), even a DBA?',
      'When is more than 2 approval levels (multi-level approval) needed and what criteria are tiered thresholds usually based on?'
    ]
  },

  'banking-027': {
    q: 'In the Vietnamese banking system, how do you handle monetary rounding with BigDecimal? Explain RoundingMode, the VND characteristic of having no decimal part, and the fee-sharing problem that produces remainders ("odd dong").',
    a: `**Summary:** Money must use {{BigDecimal}} (or an integer in the smallest unit), not {{double/float}} because binary does not represent decimals exactly ({{0.1 + 0.2 != 0.3}}). Choose {{RoundingMode}} (rounding rule) by business need and must be consistent. VND (Vietnamese dong) has no decimal part — every VND amount is an integer dong. When splitting fees/interest among multiple parties, division produces a remainder ("odd dong") that must be allocated purposefully so the sum of parts after division equals the original amount.

### Why not use double/float
{{double}} is stored by binary standard (IEEE 754) so many decimal numbers are only approximate. A small error but accumulated over millions of transactions becomes a real money discrepancy.
~~~java
System.out.println(0.1 + 0.2); // 0.30000000000000004
// Money: use BigDecimal, INITIALIZE FROM STRING (not from double)
BigDecimal a = new BigDecimal("0.1");
BigDecimal b = new BigDecimal("0.2");
System.out.println(a.add(b));   // 0.3 (accurate)
// Wrong: new BigDecimal(0.1) carries double's error
~~~

### RoundingMode — rounding rule
**RoundingMode** (rounding mode): when the result has more digits than allowed, round by which rule.
~~~text
Mode           Example (rounding to 0 decimal places)   Note
-------------  ---------------------------------------  ------------------------------
HALF_UP        2.5 -> 3,  2.4 -> 2,  -2.5 -> -3         Common "mathematical rounding"
HALF_EVEN      2.5 -> 2,  3.5 -> 4                      Banker's rounding, reduces accumulated bias
DOWN           2.9 -> 2, -2.9 -> -2                     Truncate toward 0
FLOOR          2.9 -> 2, -2.9 -> -3                     Always toward negative infinity
CEILING        2.1 -> 3, -2.9 -> -2                     Always toward positive infinity
UNNECESSARY    throw error if rounding is needed         Use to assert "must divide evenly"
~~~
Choosing which mode is a business decision: interest rounding favors whom, what the regulation says — must be unified and written in the spec. The {{divide}} operation on {{BigDecimal}} *must* specify scale + roundingMode if division may not be even, otherwise it throws {{ArithmeticException}}.

~~~java
BigDecimal fee = new BigDecimal("10000");
BigDecimal three = new BigDecimal("3");
// 10000 / 3: must specify rounding mode
BigDecimal each = fee.divide(three, 0, RoundingMode.DOWN); // 3333 (VND, 0 decimal places)
~~~

### VND characteristic: no decimal part
VND (dong) does not use subunits in normal electronic transactions — valid amounts are integers. Therefore:
- Store VND at {{scale = 0}} or use {{long}} in dong units.
- Round to 0 decimal places. Many banks/merchants also round to 100d/1,000d levels depending on business (must follow regulations).
- Different from USD (2 decimal places, cent unit) or JPY (0). If multi-currency system, {{scale}} depends on currency type.
~~~java
// VND: scale 0
BigDecimal vnd = new BigDecimal("123456.78").setScale(0, RoundingMode.HALF_UP); // 123457
// Or round to 1000d level
BigDecimal step = new BigDecimal("1000");
BigDecimal rounded = vnd.divide(step, 0, RoundingMode.HALF_UP).multiply(step); // 123000
~~~

### Fee/interest splitting problem that produces remainders (remainder allocation)
Split a 10,000 VND fee among 3 people: {{10000/3 = 3333}} remainder {{1}} dong. If each pays 3333, total collected 9999 — missing 1 dong (or conversely collected extra). In accounting, 1 dong must also balance.

Handling: allocate the remainder by a rule, transparent, deterministic:
~~~java
static List<BigDecimal> splitVnd(BigDecimal total, int parts) {
    BigDecimal[] div = total.divideAndRemainder(BigDecimal.valueOf(parts)); // [quotient, remainder]
    BigDecimal base = div[0].setScale(0, RoundingMode.DOWN); // base amount per part
    int remainder = div[1].intValueExact(); // remaining dong (0 <= remainder < parts)
    List<BigDecimal> result = new ArrayList<>(parts);
    for (int i = 0; i < parts; i++) {
        // add 1 dong to the first parts until remainder is exhausted (fixed rule)
        result.add(i < remainder ? base.add(BigDecimal.ONE) : base);
    }
    return result; // [3334, 3333, 3333], total = 10000
}
~~~
Allocation rule (first part gets remainder, or largest part gets remainder, or by stable ID order) must be specified and tested — must not "give a different result each run".

### Common mistakes
- Using {{double}} for money or {{new BigDecimal(0.1)}} (passing double) -> contaminated with error.
- Calling {{divide}} without passing {{RoundingMode}} -> {{ArithmeticException}} when division is not even, production error.
- Comparing {{BigDecimal}} with {{equals()}}: {{new BigDecimal("2.0").equals(new BigDecimal("2"))}} is {{false}} (different scale) -> use {{compareTo() == 0}}.
- Rounding VND to 2 decimal places or forgetting scale characteristic by currency type.
- Splitting fees forgetting the remainder -> ledger off, reconciliation does not match (break).
- Each module chooses a different {{RoundingMode}} -> same business yields two results.

> Senior tip: Set system-wide conventions from the start: (1) single money type ({{BigDecimal}} or {{long}} minor unit) and initialization method (always from {{String}}), (2) {{scale}} and {{RoundingMode}} for each business type (interest, fee, tax, display), (3) common division/remainder allocation function with unit tests. In code review, treat every {{double}} touching money as a blocker error.
  `,
    follow: [
      'What is the difference between equals() and compareTo() on BigDecimal, and why must money comparison use compareTo()?',
      'When to use HALF_EVEN (banker\'s rounding) instead of HALF_UP, and what problem does it solve when accumulating?',
      'If multi-currency system (VND scale 0, USD scale 2), how do you design a Money class/value object to avoid mixing scale?'
    ]
  },

  'banking-028': {
    q: 'What are EOD (End of Day - end-of-day processing) batch and cut-off time in banking? How do you design an EOD batch to run in correct order, safely when re-run (idempotent), and not corrupt data if interrupted mid-way?',
    a: `**Summary:** **Cut-off time** is the "book-closing" time point — transactions after this point are posted to the next business day. **EOD (End Of Day)** is a chain of batch jobs running after cut-off to summarize, compute interest/fees, reconcile, close balances, switch business date. Safe design needs: clear order dependencies, each step idempotent (re-running gives the same result as running once), checkpoint to restart from the failed step, and data isolated by business date.

### Cut-off time and business date
**Cut-off time**: a fixed time point. For example cut-off 23:00 — transaction 22:59 belongs to business date T, transaction 23:01 belongs to T+1 (even though same calendar day). **Business date** is the bank's "bookkeeping day", different from system date/time. Different channels have different cut-offs (internal transfer, Napas, international card) — spec must be clear for each type.

Why close? Interest, reports, reconciliation must be computed over a *closed* set of transactions (no changes). If computing while new transactions keep coming in, data is inconsistent.

### EOD typically includes these steps
~~~text
1. Pre-check   : confirm batch/online streams stopped receiving day T transactions, queues drained
2. Posting     : post remaining valid hanging transactions of day T
3. Interest/Fee: compute interest/fees by balance/business date T
4. Reconcile   : reconcile with Napas/partner (see banking-024)
5. GL/Balance  : summarize ledger, close end-of-day balance (closing balance)
6. Reporting   : generate management/compliance reports
7. Date switch : open business date T+1, update cut-off
~~~
Steps have **dependencies**: (5) needs (3) done; (7) runs only when (1)-(6) succeed. This is a **DAG** (Directed Acyclic Graph) of jobs.

### Safe design: idempotent + checkpoint
**Idempotent**: performing multiple times yields the same result as once. EOD batch *certainly* will need re-running (network error, DB crash, job timeout mid-way) — if re-running computes interest twice, customers get double interest, a disaster.

Techniques:
- **Mark by business date**: each interest/fee entry tags {{business_date=T}} and business lock (account+type+T). Before writing, check if it already exists ({{INSERT ... ON CONFLICT DO NOTHING}} or check unique key) -> re-running does not create duplicate entries.
- **Checkpoint/step state**: save {{eod_run(date=T, step=INTEREST, status=DONE)}}. On restart, read the last DONE step and continue to the next step, without re-running completed steps from the start (unless the step itself is idempotent).
- **Clear data scope**: job only processes transactions with {{business_date = T}}. Use snapshot/close flag so the dataset does not change during the run.
- **Safe processing unit**: process by account chunks; each chunk one transaction or with a rollback mechanism; log progress to know which chunks are done.

~~~java
// Idea: idempotent interest step by (account, businessDate)
public void accrueInterest(LocalDate bizDate, String accountId) {
    String key = accountId + "|INTEREST|" + bizDate; // unique business key
    if (ledgerRepo.existsByBusinessKey(key)) return;  // already ran -> skip (idempotent)
    BigDecimal interest = calcInterest(accountId, bizDate);
    ledgerRepo.appendEntry(key, accountId, "CREDIT", interest, bizDate); // append-only
}
~~~

### Cut-off and "in-between" transactions
- Transaction received at 23:00:01 (after cut-off) -> tags {{business_date = T+1}}, not included in EOD of T.
- Transaction waiting for Napas response at cut-off -> usually still belongs to send date (T) but status {{PENDING}}; EOD must have a step to process/mark hanging transactions for reconciliation the next day (see banking-025).

### Common mistakes
- Batch not idempotent: re-running interest/fees a second time -> duplicate entries, wrong balance.
- No checkpoint: error at step 5/7 must re-run from the start, slow and risky if earlier steps are not idempotent.
- Using system time instead of business date -> drift when running past midnight or when job is delayed.
- Multiple nodes running EOD for the same day at once -> contention, duplicate data; need **distributed lock** (distributed lock: only one node holds the lock to run) by {{business_date}}.
- Switching business date (step 7) before prior steps confirm done -> new day opens while old day data is not closed.

> Senior tip: Talk about EOD with a "design for failure" mindset: *assume the job will die mid-way and be re-run*. Then idempotency + checkpoint + business-date lock is mandatory, not optional. Also: separate **cut-off logic** (assigning business date) from EOD batch — cut-off is decided at transaction receipt time, EOD only processes the closed set. Mixing the two is the root cause of posting-date errors.
  `,
    follow: [
      'Which tool/mechanism should be used for distributed lock on EOD jobs by business_date and how to handle it when the node holding the lock dies (lock stuck)?',
      'How do you monitor (monitoring/alert) EOD: which metrics or conditions indicate "EOD today has a problem"?',
      'If an EOD step runs halfway (already wrote part of entries) then errors, how does idempotency ensure re-running does not duplicate at the detail level?'
    ]
  },

});
