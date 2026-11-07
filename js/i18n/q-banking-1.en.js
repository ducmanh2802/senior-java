/*
 * English translation of js/data/q-banking.js — task T661. Format: js/core/i18n.js (content overlay).
 * ids: banking-001 banking-002 banking-003 banking-004 banking-005 banking-006 banking-007 banking-008
 */
App.i18n.content({

  'banking-001': {
    q: 'What is core banking, and how do the surrounding systems — digital channels, cards, payments, CRM — talk to the core? Why does the core usually have to run an end-of-day (EOD) batch?',
    a: `**Summary:** Core banking is the bank's central system: it stores the account ledger of every customer (balance, transaction history) and it is the only place that decides "how much money this account still has". Digital channels (mobile app, internet banking), the card system, the payment system and CRM call into the core to look up a balance, debit money or credit money. The core usually runs one end-of-day batch (End of Day, EOD) to reconcile, compute interest and close the books, because pushing thousands of transactions through the full accounting logic at the same instant in real time would be too heavy and too easy to get wrong.

### What core banking is (explained from scratch)
Think of the handwritten ledger of a small grocery shop: every time something is sold, the owner writes one line "received 50,000 VND". Core banking is exactly that ledger, but electronic, for the whole bank, serving millions of customers and correct down to the last dong. Each customer has one or more accounts (savings, current/checking, term deposit...); each account has a balance and a list of transactions.
- **Balance:** how much money the account holds right now, updated after every successful transaction.
- **Transaction:** one movement of money, for example "deposit 1,000,000", "debit 200,000", "send 500,000 to another account".
- **Ledger:** the book that keeps every record about money; old lines are never deleted, only new lines are added.
Example: customer A has an account with a balance of 10,000,000. A uses the app to send 2,000,000 to B. The core must check that A has enough money, then debit 2,000,000 at A and credit 2,000,000 at B; if one side fails then both sides must fail (A must never be debited while B never receives).

### The surrounding systems and how they call the core
A bank does not consist of the core alone. There are many specialised systems, each doing one job, and they call into the core whenever they need to touch money:
- **Digital channels:** mobile app, internet banking. This is the window the customer interacts with.
- **Card system:** manages debit and credit cards, checks the limit when a payment is authorised.
- **Payment system:** handles internal transfers, interbank transfers and bill payments.
- **CRM:** stores customer information (name, address, contact history); it does not store account balances.

The typical flow of "check the balance in the app":
1. The customer opens the app and taps "View balance".
2. The app sends the request over the Internet to the API Gateway (the front door of the bank: it checks security and applies rate limiting).
3. The gateway forwards it to the account service (the microservice that owns account business logic).
4. The account service calls core banking through a normalised interface (usually a message queue or an internal API) and asks "what is the balance of customer A".
5. The core reads the balance from the database and returns it: service → gateway → app displays it to the customer.

~~~seq
title: Customer checks the balance in the app
actors: Customer | App | Gateway | Core | DB
Customer -> App: open app, tap view balance
App -> Gateway: GET account balance
Gateway -> Core: query balance of customer A
Core -> DB: read balance
DB --> Core: return 10,000,000 VND
Core --> Gateway: 10,000,000 VND
Gateway --> App: 200 OK + balance
App --> Customer: show 10,000,000 VND
~~~

### Why the core usually runs an end-of-day (EOD) batch
A bank processes millions of transactions a day. If every single transaction had to update the whole ledger and run heavy calculations immediately, the system would be overloaded. So many banks split the work into two tracks:
- **Online (daytime):** only the minimum, urgent work — check the balance, debit or credit money for the real transaction. Fast, and it barely touches historical data.
- **End-of-day batch (EOD):** after the counters close, one big run over all the data of today:
  + Summarise the money each customer received.
  + Compute interest for deposits and loans.
  + Reconcile internal transactions and transactions with partner banks.
  + Close the day's books and roll the data over to the next day.

Example with numbers: an average bank has 500,000 transactions per day, and EOD must process all of them plus compute interest for 2 million term deposits; running that batch at night does not disturb any customer.

### Common mistakes
- Letting a digital channel write directly into the core's balance table, bypassing the business checks → wrong balances, loss of control.
- Not separating online traffic from batch work, running heavy calculations at peak hours → the system slows down and customers cannot open the app.
- Forgetting to handle holidays in the EOD calendar → next-day reports are wrong and interest is computed wrong.
- Posting the ledger side backwards (debit vs credit) → you have to restore from backup and lose hours.

> Senior tip: In an interview, stress that core banking is not "just one database": it is the system where the bank's data integrity matters most, every balance change must go through an ACID transaction and must tie back to the accounting ledger every single day.

> Term: ACID is the set of four properties (Atomicity, Consistency, Isolation, Durability) that guarantee a transaction is correct and never left half-done, even if the machine loses power in the middle of it.

  `,
    follow: [
      'When core banking is overloaded, which part would you move to batch and which part must stay online?',
      'Why must CRM or a digital channel never update the balance directly in the core tables?',
      'If EOD runs late and crosses midnight, how are the transactions of the following day affected?'
    ]
  },

  'banking-002': {
    q: 'How does a 24/7 instant interbank transfer (through NAPAS) work at a conceptual level? When the transaction times out, how do you handle it — and why must you not automatically retry the debit?',
    a: `**Summary:** A 24/7 instant interbank transfer is a service that lets a customer send money from one bank to another at any moment, including weekends and holidays, with the money usually arriving immediately or within a few seconds. In Vietnam this runs through NAPAS (an interbank payment switching centre). When a transaction times out, a developer must NOT automatically retry the debit, because the money may already have been taken from the sending side while the acknowledgement never arrived; the correct handling is to investigate (reconcile) and refund if needed.

### What a 24/7 interbank transfer is (explained from scratch)
Normally, transfers between banks are only processed during office hours (7 a.m. to 4 p.m., Monday to Friday). A customer who wants to send money at 10 p.m. on Saturday or on a Sunday simply cannot. The 24/7 instant transfer service removes that barrier: customers can send money at any time, and it usually arrives immediately or within seconds.

In Vietnam this runs through NAPAS (Napas — the interbank payment switching centre). NAPAS plays the role of an "electronic post office" between banks: a bank sends the transaction message to NAPAS, NAPAS validates it and moves the money to the receiving bank, then reports the result back to the sending bank.

The parties involved:
- Sending bank: the bank of the person sending money.
- Receiving bank: the bank of the beneficiary.
- NAPAS: the switching centre between banks — it checks the account lists, routes the message and settles the funds.
- The sending customer and the receiving customer.

~~~seq
title: 24/7 interbank transfer through NAPAS
actors: Sender | Sending bank | NAPAS | Receiving bank | Recipient
Sender -> Sending bank: request transfer of 5,000,000 VND
Sending bank -> NAPAS: send the transaction message
NAPAS -> Receiving bank: validate account and credit balance
Receiving bank --> NAPAS: accepted, money credited
NAPAS --> Sending bank: success notification
Sending bank --> Sender: transfer completed
Receiving bank --> Recipient: money received
~~~

### How to handle a timeout
A timeout is when a request is sent but no response comes back within the allowed window (for example 10 seconds). There are many causes: the network is slow, NAPAS is overloaded, the receiving bank lost power, or the account address is wrong.

On a timeout, the developer must NOT automatically retry (resend the request) and must NOT automatically debit again, because:
1. The money may already have been debited at the sending bank while the notification got lost — retrying would charge the customer twice.
2. The money may already have been credited at the receiving bank while the response got lost — retrying would pay the beneficiary twice.
3. The receiving bank may have approved the transaction but not finished updating the balance — a retry corrupts the state.

The correct handling:
- Step 1: no automatic retry. Mark the transaction as "under investigation" (pending).
- Step 2: Investigate: the sending bank queries NAPAS or the receiving bank again to see whether the transaction actually happened, using the unique reference code.
- Step 3: If it did happen → set the status to "success" and notify the customer.
- Step 4: If it did not happen and the allowed window has passed → refund the sending customer's account (if money was already taken) and report the failure.
- Step 5: If it still cannot be determined after a number of investigations → hand it to a human officer, and the customer is contacted with the outcome.

Example with numbers: a customer sends 5,000,000 at 20:00 and the system times out after 10 seconds. The developer does not resend the debit. After 30 seconds the investigation shows the money was already credited at the receiving bank → the status becomes "success" and an SMS goes to the customer. If after 24 hours the state is still unknown → refund the 5,000,000 to A and open a ticket.

### Common mistakes
- Automatically retrying on timeout → money debited or credited multiple times, broken account balances.
- Forgetting to persist the unique reference (transaction ID), so nothing can be investigated later → the transaction disappears inside the system and can never be traced back.
- Notifying the customer of failure right at the timeout, before the investigation is done → the customer panics and calls the call centre.
- No limit on the number of investigation rounds → the transaction stays floating in the system for months and never reaches an end state.

> Senior tip: The heart of interbank transfer is "one transaction, one unique reference code, never retry automatically on error". In an interview, stress this: if you cannot accept the risk that the money was already processed on the other side, then you are not allowed to retry. A developer must distinguish "at-most-once" (sent at most once, may be lost) from "at-least-once" (sent at least once, may be duplicated) and pick the right mode.

> Term: Transaction ID is the unique string attached to every transaction, generated by the sending bank and carried along to NAPAS and to the receiving bank so the transaction can be looked up later.

  `,
    follow: [
      'Why is an automatic retry forbidden when an interbank transaction times out?',
      'How does a unique reference code help you investigate a transaction?',
      'A transaction has been under investigation for more than a month — what do you do?'
    ]
  },

  'banking-003': {
    q: 'When designing a double-entry accounting ledger for a wallet/account, why must it be append-only, and how is each transaction written so that the ledger always balances?',
    a: `**Summary:** A double-entry ledger stores every movement of money as bookkeeping lines: each transaction produces at least two lines (one side debited, one side credited) whose sum is zero, so the ledger always balances. The ledger must be append-only: you may only add new lines, never edit or delete an old one, so that there is a complete history for auditing and for recovery when something goes wrong.

### What a double-entry ledger is (explained from scratch)
In a money system, every operation ("A sends 2,000,000 to B", "A deposits 1,000,000", "B withdraws 500,000") has to be recorded so you can answer later: "how much is left in account A?", "where did A's money go?". If you only store the final balance ("A has 3,000,000"), then when you need to fix a bug or run an audit you have no idea where the money went.

A double-entry ledger solves this by storing each movement as a line (an entry), not just the balance. Every transaction creates at least two lines:
- One debit line (money out) on one account.
- One credit line (money in) on another account.
- The sum of the amounts of all lines in one transaction must be zero (it balances).

Example of transferring 2,000,000 VND from A to B (two accounts in the same bank):
- Line 1: account A, -2,000,000 (debit A)
- Line 2: account B, +2,000,000 (credit B)
- Sum: -2,000,000 + 2,000,000 = 0. Balanced.

After the transaction, balance of A = old balance - 2,000,000 and balance of B = old balance + 2,000,000. If the sum is not zero, there is a bug in the code and the system must automatically reject the transaction.

~~~seq
title: Writing a transfer into the double-entry ledger
actors: App | Service | LedgerDB
App -> Service: transfer 2,000,000 from A to B
Service -> LedgerDB: write line 1: A -2,000,000
Service -> LedgerDB: write line 2: B +2,000,000
LedgerDB --> Service: sum is 0, commit
Service --> App: success
~~~

### Why it must be append-only (add only, never edit/delete)
Append-only means that once a line is written into the ledger it is kept forever. You are not allowed to delete a wrong line, and you are not allowed to edit the amount of an old line. If something is wrong, you write a NEW line that reverses it (a reversing entry).

Example: an officer mistypes — A is debited 2,000,000 but the credit went to the wrong B. The error is discovered later, so you add:
- Line 3: account A, +2,000,000 (money returned to A)
- Line 4: account B, -2,000,000 (money taken back from B)
The sum of lines 3 and 4 is also zero. The balances of A and B go back to what they were, but the history still shows 4 lines, so anyone can see when the error happened and how it was fixed.

Why append-only matters:
1. Audit trail: you can tell who changed what, and when — critical for auditors and for legal disputes.
2. Error recovery: if the code has a bug that writes wrong balances, you can replay the whole history to find it instead of restoring from backup.
3. No data loss: if an account is deleted by mistake, the transaction history is still there so it can be rebuilt.

### How to do it in code (Java 17)
Use BigDecimal for money, never double (double has rounding error — for instance 0.1 + 0.2 is not exactly 0.3). Each entry stores: transaction id, account id, amount, direction (debit/credit), timestamp, who performed it, and the reason.

~~~java
public class LedgerEntry {
    private final String transactionId;
    private final String accountId;
    private final BigDecimal amount;      // positive = credit, negative = debit
    private final String direction;       // DEBIT or CREDIT
    private final Instant createdAt;
    private final String createdBy;
    // constructor, getters ...
}
~~~

When processing a transaction, the service must:
1. Check that the account has enough money (for a debit).
2. Write all entries of the transaction inside one database transaction (ACID): either all of them succeed or all of them fail.
3. Sum the amounts; if the sum is not 0, roll back and raise an error.
4. Update account balances by aggregating the sum of amounts per account.

### Common mistakes
- Using double to store money → rounding error, accounts off by 1 or 2 dong, auditors reject it.
- Editing or deleting old ledger lines when something is wrong → history is lost, you can no longer tell where the error came from.
- Writing a single line per transaction (not double-entry) → balances drift and the balance check is impossible.
- Not wrapping the writes in one DB transaction → one side commits, the other fails, and money disappears.

> Senior tip: In an interview, draw the ledger on paper: a table with the columns transaction_id, account_id, amount, direction, created_at. Each transaction is one "frame" with two ends (out on one side, in on the other) whose sum is 0. Give a real example: an officer mistyped an amount, and you corrected it with a reversing entry instead of deleting the old line.

> Term: Reversing entry is a new ledger line with the amount opposite to the wrong line — it undoes the error without deleting any old data.

  `,
    follow: [
      'Why must the ledger be append-only instead of editing the balance directly?',
      'How many lines does a single money transfer write into the ledger at minimum?',
      'You discover a wrong amount 3 days later — how do you fix it without losing history?'
    ]
  },

  'banking-004': {
    q: 'What is idempotency? How do you apply it to a money-transfer API and to callbacks from a partner (for example NAPAS) to avoid duplicate processing?',
    a: `**Summary:** Idempotency is the property of an operation that can be performed many times while the result stays the same as if it had been performed once. For a transfer API, the client sends a unique idempotency key; the server remembers which keys it has already processed and, when it sees a duplicate key, returns the previous result instead of debiting twice. For callbacks from a partner, the server also checks the transaction code before updating anything, so money is not credited repeatedly when the partner resends the callback.

### What idempotency is (explained from scratch)
In a money system, networks fail, clients resend requests after not receiving a response, and partners resend notifications several times. If an operation is not idempotent (not safe to repeat), resending causes real damage: money debited twice, money credited twice, an order processed twice.

Idempotency means: if you perform the same operation twice, the result of the first and the second call is the same, and the system is not changed any further. Example: the customer taps the "send money" button twice very quickly and the account is debited only once.

### Idempotency for the transfer API
When the client calls the transfer API, it creates a unique idempotency key (usually a UUID) and sends it in a header or in the body. The server receives the request and:
1. Checks whether the key has already been processed (stored in a database table with a unique index).
2. Already processed → return the previous result (status, amount, transaction code), without any extra debit.
3. Not processed yet → perform the transfer, save the key with its result, return it to the client.

Example: the customer calls POST /transfers with idempotency-key: "abc-123", amount 2,000,000. The server debits the money and stores "abc-123 processed, success". The customer's connection drops, so the client calls again with the same key "abc-123". The server finds the key already present, returns the old "success" and does not debit another 2,000,000.

~~~seq
title: Idempotent transfer API
actors: Client | API Server | IdempotencyDB | Core
Client -> API Server: POST /transfers, key abc-123, 2M
API Server -> IdempotencyDB: is key abc-123 used?
IdempotencyDB --> API Server: not yet
API Server -> Core: debit 2,000,000
Core --> API Server: ok
API Server -> IdempotencyDB: store key abc-123, success
API Server --> Client: 200 success
Client -> API Server: POST /transfers, key abc-123, 2M (network back)
API Server -> IdempotencyDB: check key abc-123
IdempotencyDB --> API Server: exists, success
API Server --> Client: 200 success (no extra debit)
~~~

### Idempotency for callbacks from a partner
A callback is when a partner (for example NAPAS) pushes a notification to your bank confirming that a transaction actually happened (money arrived, a bill was paid...). The partner may call back several times if it never received a success response from your bank.

Your bank handles the callback as follows:
1. Extract the transaction code (transaction ID) from the callback payload.
2. Check whether that code has already been processed (stored in a processed-callback table).
3. Already processed → return 200 OK immediately, do nothing else.
4. Not processed → update the balance/transaction status, record it as processed, return 200 OK.

Example: NAPAS sends the callback "transaction G123 succeeded, credit 2,000,000 to account B". The bank updates the balance of B and stores "G123 processed". NAPAS loses the connection and sends callback G123 again. The bank finds G123 already processed, returns 200 OK and does not credit another 2,000,000.

### Common mistakes
- No idempotency key at all, or the client generates a random key on every attempt → duplicates cannot be blocked.
- Storing the key but not checking it before processing → duplicates still happen.
- The callback path does not check the transaction code and credits money on the second delivery → the beneficiary receives extra money.
- The idempotency key expires too quickly (say after 1 minute) while the client retries after 2 minutes → the duplicate slips through again.
- Two different transactions reusing the same idempotency key → the second one is wrongly rejected.

> Senior tip: The idempotency key must be generated by the client (never randomly by the server), because only the client knows when it is re-sending the same old request after a network recovery. The key must live in a database with a unique constraint, not only in a cache — when the server restarts, cache contents are gone and duplicates come back.

> Term: Unique constraint is a database rule that forbids two rows from having the same value in a column (or set of columns), for example forbidding two rows with the same idempotency_key.

  `,
    follow: [
      'Why must the idempotency key be created by the client and not by the server?',
      'What must a partner callback check before it is allowed to update a balance?',
      'The idempotency key has expired but the client retries — how do you handle that?'
    ]
  },

  'banking-005': {
    q: 'What is end-of-day reconciliation, where do the discrepancies come from, and what is the process when a discrepancy is found?',
    a: `**Summary:** End-of-day reconciliation is the process of comparing your bank's ledger against the books of each counterparty (NAPAS, other banks, card switches) to find mismatched amounts (money in without the document, money out without the document, wrong amount). Discrepancies usually come from timed-out transactions, system failures, or transactions recorded by only one side. When one is found, the developer must investigate the cause, adjust the ledger if needed and report it to management.

### What end-of-day reconciliation is (explained from scratch)
Every day a bank has hundreds or thousands of transactions coming in and going out. Overnight, the bank must check whether "the money we received" matches "the money the counterparty owes us", and whether "the money we sent" matches "the money the counterparty received". This nightly check is called end-of-day reconciliation.

Reconciliation does not only compare totals; it also checks every transaction in detail: transaction code, amount, timestamp, sending account, receiving account. When the two sides report different figures → there is a discrepancy that must be handled.

Typical sources of discrepancies:
- Timed-out transaction: the sending bank already debited but the notification was lost, and the receiving bank does not know yet → the money is "lost" between the two sides.
- System failure: network outage, slow server, a bug that records the wrong amount.
- Unmatched transaction: one side wrote the transaction, the other has not (for example an officer typed the wrong account code).
- Holidays and maintenance windows: the system is down, transactions are delayed, and they only match on the next day.

### The process when a discrepancy is found
1. Produce a discrepancy report: the system automatically generates the list of transactions that do not match between the two sides, with amounts and transaction codes.
2. Investigate: an officer (or a developer with a script) checks each mismatched item:
   - Read the transaction logs on both sides.
   - Check whether the account was actually debited/credited.
   - Determine which side is at fault.
3. Adjust the ledger (if needed): if the money was sent but never credited, credit the receiving account. If the money was credited but never debited, debit the sending account (or contact the customer for a refund).
4. Report: send the report to accounting and to risk management, recording the root cause and the fix.
5. Prevent: if the discrepancy is large or keeps recurring, find the root cause and fix the code/system.

Example with numbers: bank A sends 100 transactions to bank B through NAPAS, totalling 500,000,000. B reports receiving 99 transactions, totalling 495,000,000. One item of 5,000,000 is missing. The investigation shows that this transaction timed out: the money was already debited at A but the notification was lost, and B never heard about it. Handling: credit the 5,000,000 to the beneficiary account at B, update the transaction status, notify both customers.

~~~seq
title: End-of-day reconciliation and discrepancy handling
actors: Bank A | NAPAS | Bank B | Recon staff
Bank A -> NAPAS: send 100 transactions, 500M
NAPAS -> Bank B: forward the funds
Bank B --> NAPAS: received 99 transactions, 495M
NAPAS --> Bank A: report 99/100, 5M discrepancy
Recon staff -> Bank A: check logs of the mismatched item
Recon staff -> Bank B: confirm the 5M was not received
Recon staff -> Bank B: credit 5M to the beneficiary account
Recon staff --> Bank A: report the outcome
~~~

### Common mistakes
- Reconciling only the grand total without checking each transaction → many small mismatches slip through the net.
- Investigating but never recording the cause → the same bug reappears the next day.
- Ledger adjustments approved by one person (no maker-checker) → an officer can change amounts at will, a fraud risk.
- Reporting discrepancies late → customers complain and the bank loses reputation.
- No deadline for resolving a discrepancy → transactions float in the system for months and reports stay wrong.

> Senior tip: In an interview, say that end-of-day reconciliation is "our last line of defence" for detecting errors, and that a developer must build systems that detect discrepancies automatically instead of waiting for a customer to complain. Stress that the goal is not just "making the numbers match" but "finding out what is wrong and fixing it at the source".

> Term: Discrepancy is the gap between two numbers that should be equal — for example bank A records 500,000,000 while bank B records 495,000,000, a discrepancy of 5,000,000.

  `,
    follow: [
      'Why is reconciling the totals alone not enough, and why must each transaction be checked?',
      'Timed-out transactions are the most common source of discrepancies — how do you handle them?',
      'What approval rules does a ledger adjustment need in order to prevent fraud?'
    ]
  },

  'banking-006': {
    q: 'How do cut-off time, working days and holidays affect transactions and interest calculation?',
    a: `**Summary:** Cut-off time is the hour at the end of a day after which the bank still accepts a transaction but books it as belonging to the next working day. A working day is a day the bank is open and processes transactions, while on holidays (national holidays, Tet) the bank is closed: no new transactions are processed. A developer must understand these rules to compute the value date, the balance and the interest correctly.

### What cut-off time is (explained from scratch)
Cut-off time is a boundary hour within a day: after it, new transactions are still accepted but are treated as belonging to the next day. Each bank has a different cut-off for each transaction type (for example internal transfer cut-off at 16:00, interbank transfer cut-off at 14:00, deposit cut-off at 15:00).

Example: a customer transfers 5,000,000 at 16:30 and the cut-off is 16:00. The bank accepts the transaction but books it as tomorrow's. The beneficiary may get the money tomorrow, not today.

Why a cut-off is needed: the bank needs time to process, check and close the day's books. Without a cut-off, transactions arriving in the middle of the night would still be processed, the system would be overloaded and the books could never be closed.

### Working days and holidays
A working day is a day the bank is open and processes transactions (Monday to Friday, excluding holidays). A holiday is a day the bank is closed (national holidays, Tet, public observances...). On a holiday, no new transaction is processed and no balance update is posted.

When counting days for interest or for a due date, you either count only working days or count calendar days, depending on the product. Term deposits usually accrue interest monthly; if the interest payment date falls on a holiday, the interest is credited on the nearest working day.

### Impact on transactions and interest
1. Value date: the day on which the transaction's money is actually counted and posted to the account. If a transaction misses the cut-off or lands on a holiday, the value date is pushed to the next working day.
2. Interest: deposit or loan interest is computed over the number of days the money was deposited or borrowed. If a holiday falls inside the period, that holiday is still counted in the number of days (money keeps accruing over holidays), but no new transaction is processed.
3. Balance: the balance shown to the customer is only updated after the transaction has been processed. For a transaction after the cut-off, the displayed balance may not change until the next working day.

Example with numbers: a customer deposits 100,000,000 on a Sunday (a rest day, past the cut-off). The bank accepts the transaction and sets the value date to the first working day of the following week. Interest starts accruing from the value date, not from the Sunday.

~~~seq
title: Transaction on a holiday, after the cut-off
actors: Customer | App | Bank | Processing system
Customer -> App: send 100M at 23:00 on a Sunday
App -> Bank: submit the transaction
Bank -> Processing system: accept, value date = first working day next week
Processing system --> Bank: accepted
Bank --> Customer: accepted, credited on the next working day
~~~

### Common mistakes
- Computing the transaction date from "today" without checking cut-off and holidays → wrong value date, wrong interest.
- Confusing working days with calendar days → wrong balances and customer complaints.
- Accruing interest on holidays like a normal day for a product that only accrues on working days → the interest amount is wrong.
- Telling the customer the money has been credited while the value date has not arrived → the customer is confused and calls the hotline.

> Senior tip: In an interview, draw a lookup table of transaction types with their cut-off and day-counting rules (for example: internal transfer cut-off 16:00, value date = today if before cut-off, next day if after cut-off). Stress that a developer must never compute dates ad hoc: there must be one shared working-day/date service used by the whole system.

> Term: Value date is the day on which the transaction's money is posted to the account and starts accruing interest; it is not necessarily the day the customer received the notification.

  `,
    follow: [
      'Which date does a transaction after the cut-off belong to, and when does the money actually arrive?',
      'Do deposits accrue interest over holidays, and how is that handled?',
      'Why do you need one shared date-calculation layer instead of each screen computing dates on its own?'
    ]
  },

  'banking-007': {
    q: 'What is maker-checker (four-eyes), what does the audit trail record, and how is role-based authorisation designed in the back office?',
    a: `**Summary:** Maker-checker (four-eyes principle) is a process where two people take part in one sensitive operation: the first person (the maker) creates it, the second (the checker) approves or rejects it before it takes effect. The audit trail is the log that records who did what, when and from where. Role-based access control (RBAC) ensures each officer can only work inside the scope of their position, so no single person can run an entire money process alone.

### What maker-checker is (explained from scratch)
In a bank, operations that touch money (large transfers, changing a card limit, opening a VIP account...) must not be performed by one officer alone. Two people are required:
- Maker: the officer who creates the request (for example "transfer 500,000,000 to account X"); this request is not effective yet.
- Checker: a different officer (from the control function) who reviews the request, approves it if correct or rejects it if not. The money only moves once the checker has approved.

The reason is simple: if one person does everything, fraud and data-entry errors easily happen. Example: the maker mistypes 500,000,000 as 5,000,000,000, and the checker notices and rejects it.

Separation of duties: an officer must never be both the maker and the checker of the same request — if the system allows it, that is a dangerous defect.

### What the audit trail records
The audit trail stores every detail of each important action in the system. Each log line must record:
- Who (officer id and name).
- What (the action: create, approve, reject, edit, delete).
- When (a precise timestamp, for example 2024-03-15 14:32:10).
- From where (IP address, machine, browser).
- Before and after (the old value and the new value — for example an amount edited from 100,000,000 to 200,000,000).
- Reason (if any).

Example of an officer editing a card limit:
- Mai, edit card limit, 14:32:10, IP 10.0.0.5, old limit 50,000,000, new limit 100,000,000, reason "urgent customer request".

The audit trail must never be deleted, edited or hidden. Even the highest-privileged user (admin) cannot delete logs. This guarantees transparency and lets you answer questions when an incident or a dispute occurs.

### Role-based access control (RBAC)
The bank's back office has many functions (finance, audit, customer care, risk management...). Each officer is assigned one or more roles, and each role has different permissions:
- Teller: deposits and withdrawals, view customer balances; cannot change limits.
- Control officer: approves transfer requests; cannot create them.
- Manager: approves large money requests, views reports; cannot touch money directly.
- Accountant: views ledger reports; cannot approve transfers.
- System admin: manages officer accounts; may not view customer balances or approve transactions.

Permissions must be checked on every action, not only at login. Example: a teller clicks "approve transfer" and the system must refuse immediately.

~~~seq
title: Maker-checker transfer in the back office
actors: Maker | Checker | System | Audit log
Maker -> System: create a request to transfer 500M
System --> Maker: saved, status pending approval
Maker --> Checker: notification of a new request
Checker -> System: review the request and the account
Checker -> System: approve the request
System --> Checker: approved, money transferred
System -> Audit log: record (Mai, approved, 14:32, 500M)
~~~

### Common mistakes
- The same officer is both maker and checker → no real control, fraud becomes easy.
- The checker approves without verifying the account → wrong transfers go through and money is lost.
- The audit trail omits the IP address or the timestamp → you cannot tell where the problem originated.
- Over-broad roles (one officer holding many roles) → the same person can change a limit and approve it.
- No permission check per request → after login an officer can open pages they are not allowed to use.

> Senior tip: In an interview, say that maker-checker is not just "two people" but "two people who must never be the same person", and that the audit trail must keep enough detail to reconstruct any transaction. Stress that RBAC must be enforced on every request, not only at login, and that officers should be granted the minimum rights needed to do their job (least privilege).

> Term: Least privilege is the rule of giving each officer only the permissions required for their work and nothing extra, in order to limit risk.

  `,
    follow: [
      'Why must one officer never be both the maker and the checker of the same request?',
      'What must the audit trail record in order to be trustworthy?',
      'An officer tries to exceed their permissions — how does the system detect it?'
    ]
  },

  'banking-008': {
    q: 'What do KYC/eKYC and AML mean at the level a developer needs to know, which data is sensitive, and how do you store and mask customer information?',
    a: `**Summary:** KYC (Know Your Customer) is verifying a customer's identity when the account is opened; eKYC does that with technology (photographing the ID card, scanning the face). AML (Anti-Money Laundering) is preventing money laundering — making dirty money look clean. A developer needs to know which data is sensitive (ID number, phone number, address, transaction history), how to store it safely (encryption) and how to mask it when displaying it or writing logs, so that no confidential information leaks.

### What KYC/eKYC and AML are (explained from scratch)
KYC (Know Your Customer) is the process of verifying a customer's identity when they open a bank account: an officer checks the ID card/CCCD, the address, the employment, the occupation..., in order to know who the customer is and how risky they are.

eKYC (electronic KYC) is doing KYC with technology: the customer photographs their ID card and takes a selfie; the system automatically compares the selfie with the photo on the ID card and checks whether the ID is forged. The customer does not need to visit a branch.

AML (Anti-Money Laundering) is the process of detecting and preventing the use of money from illegal activity (drugs, fraud, corruption...) and turning it into "clean" money. The bank must monitor large transactions and unusual patterns, and report to the regulator when something looks suspicious.

A developer does not have to be a compliance lawyer, but must know: which data must be protected, how it is stored, and how it is masked when displayed.

### Sensitive data
- ID card / CCCD number (the national identity document number).
- Full name, date of birth, permanent address.
- Phone number, email address.
- Account number, credit card number.
- Transaction history (which transaction, when, how much).
- Employment and income information.

If this data leaks, an attacker can commit account takeover fraud, forge cards, or impersonate the customer.

### How to store it and how to mask it
1. Encrypt at rest: passwords, ID numbers and card numbers must be encrypted (for example AES, or a hash such as BCrypt for passwords) before being written to the database. Never store sensitive information as plain text.
2. Mask when displaying: if an officer needs to see a card number, show only the last 4 digits and replace the rest with asterisks (for example 1234 **** **** 5678). Mask the middle digits of a phone number (for example 090****1234). Mask part of the ID number (for example 123*******89).
3. Never put sensitive data into logs: system logs must not contain card numbers, ID numbers or passwords. If you must log, record only the customer id or an already masked account number.
4. Restrict access: only authorised officers may view sensitive data (already masked), and each view is written to an audit trail.

Example of card display:
- Raw card number: 1234 5678 9012 3456
- Masked card number: **** **** **** 3456

~~~seq
title: Officer views masked customer information
actors: Officer | System | Database
Officer -> System: view account of customer A
System -> Database: fetch the customer record
Database --> System: encrypted ID number, masked card number
System --> Officer: name shown, ID masked, card masked
~~~

### Common mistakes
- Storing passwords as plain text → if the database leaks, every password is stolen.
- Showing the full card number or ID number on screen or printing it on a receipt → confidential information leaks.
- Logging card numbers while debugging → the log file is retained somewhere and an attacker can read the cards.
- Not masking phone numbers when notifying one customer to another → contact details leak.
- A teller can see the complete ID number → violates least privilege.

> Senior tip: In an interview, say that a developer need not be a compliance expert but must know "which data must be masked, where it is stored, and who may see it". Stress that masking must be applied on every surface: screens, receipts, email, SMS, logs and the payloads returned by APIs. If you can, give a concrete card-masking rule (for example only the last 4 digits of the card are ever sent over SMS).

> Term: Masking is replacing part of sensitive data with another character (for example * or #) so nobody can read the complete value, while the original data is still stored safely for use when it is genuinely needed.

  `,
    follow: [
      'Which data in a bank must be encrypted before it is written to the database?',
      'How must a card number be masked when an officer views it?',
      'Why is it forbidden to put a card number into system logs?'
    ]
  },

});
