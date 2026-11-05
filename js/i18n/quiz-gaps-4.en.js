/*
 * English translation of js/data/quiz-gaps.js — task T683. Format: js/core/i18n.js (content overlay).
 * ids: qz-kotlin-018 qz-kotlin-019 qz-kotlin-020 qz-banking-001 qz-banking-002 qz-banking-003 qz-banking-004 qz-banking-005 qz-banking-006 qz-banking-007 qz-banking-008 qz-banking-009 qz-banking-010 qz-banking-011 qz-banking-012 qz-behavioral-015 qz-behavioral-016 qz-behavioral-017 qz-behavioral-018 qz-behavioral-019
 */
App.i18n.content({

'qz-kotlin-018': {
  q: `A Kotlin module is called from legacy Java code. Which statements are **correct**? (Choose 2)`,
  options: [
    'Function with default parameters: Java must pass all arguments unless the Kotlin function has @JvmOverloads',
    'Top-level function in Utils.kt is called from Java as Utils.format(...)',
    'Function in companion object of Foo is called from Java via Foo.Companion.bar(); add @JvmStatic to call Foo.bar()',
    'Kotlin function throwing IOException is called from Java in try { } catch (IOException e) normally without any extra declaration'
  ],
  explain: `**Correct answer: options 1 and 3.**

### Why correct
- **Default argument**: Java has no concept of default parameters. The compiler only generates one method with all parameters (plus an internal synthetic method). {{@JvmOverloads}} generates additional overloads that omit default parameters from the end.
- **Companion**: companion object is a real object (static field {{Companion}}), so Java calls {{Foo.Companion.bar()}}. {{@JvmStatic}} generates an additional static method on Foo.

### Why others are wrong
- **Utils.format**: top-level function lives in class {{UtilsKt}}, so Java calls {{UtilsKt.format(...)}}. To change the name use {{@file:JvmName("Utils")}} at the top of the file.
- **Catch IOException**: Kotlin has no checked exceptions, so the generated method does not declare {{throws IOException}}. The Java compiler will error "exception IOException is never thrown in body of corresponding try statement". Must add {{@Throws(IOException::class)}} on the Kotlin side.

### Other interop annotations
{{@JvmField}} (expose field instead of getter/setter), {{@JvmName}} (rename when signatures clash after type erasure).

> Senior tip: when gradually migrating a Java codebase to Kotlin, write a few Java tests that call the public Kotlin API; that's the cheapest way to keep the API friendly to the Java side.`
},

'qz-kotlin-019': {
  q: `What does the following Kotlin code print?
~~~java
data class Cart(val items: MutableList<String>)

val a = Cart(mutableListOf("x"))
val b = a.copy()
b.items.add("y")
println(a.items)
~~~`,
  options: [
    '[x]',
    '[x, y]',
    'Compilation error because items is val',
    '[y]'
  ],
  explain: `**Correct answer: [x, y].**

### Mechanism
{{copy()}} of a data class creates a new object by calling the constructor with **the same references** of the properties (shallow copy). {{b.items}} and {{a.items}} are the **same** MutableList, so adding "y" via b is visible to a.

{{val}} only means the **reference** cannot be reassigned ({{b.items = ...}} is an error), it does **not** mean the object inside is immutable.

### Why others are wrong
- **[x]**: would only be true if copy were a deep copy, but Kotlin does not deep copy automatically.
- **Compilation error**: calling {{add()}} on the list mutates its contents, not reassigning the val property.
- **[y]**: copy does not create a new empty list.

### Correct approach
- Use {{List}} (read-only) and create a new list when changing:
~~~java
data class Cart(val items: List<String>)
val b = a.copy(items = a.items + "y")   // new list, a unchanged
~~~
- Or manually copy on copy: {{a.copy(items = a.items.toMutableList())}}.

> Senior tip: data class containing a mutable collection has both the sharing bug above and a hashCode that changes with contents, very dangerous when used as a Map key or in UI/Redux-style store state. Default to val + read-only type.`
},

'qz-kotlin-020': {
  q: `The following job does heavy computation; calling {{job.cancel()}} but the loop runs to completion. Which changes help it **actually stop when cancelled**? (Choose 2)
~~~java
val job = scope.launch(Dispatchers.Default) {
    for (i in 0 until 1_000_000_000) {
        heavyCompute(i)   // regular function, not suspend
    }
}
~~~`,
  options: [
    'Call ensureActive() (or check isActive) periodically inside the loop',
    'Wrap loop body in try { } catch (e: Exception) { }',
    'Call yield() periodically inside the loop',
    'Call Thread.sleep(1) in each iteration',
    'Switch to Dispatchers.IO'
  ],
  explain: `**Correct answer: ensureActive()/isActive and yield().**

### Mechanism: cancellation is cooperative
{{cancel()}} does not stop the thread. It only transitions the Job to "cancelling" state; the coroutine stops when it **checks** that state itself. kotlinx.coroutines suspend functions ({{delay}}, {{yield}}, {{withContext}}, {{await}}…) check and throw {{CancellationException}}. A loop calling only regular functions never hits a cancellation point.
- {{ensureActive()}}: throws CancellationException if the Job is cancelled; {{isActive}} to manually break the loop.
- {{yield()}}: a suspension point that checks cancellation, and also yields the thread to other coroutines on the same dispatcher.

### Why others are wrong
- **try/catch Exception**: does not create a cancellation point; worse, if there are suspend functions inside it **swallows** the CancellationException, making the coroutine continue as if not cancelled. (Same trap with {{runCatching}}.)
- **Thread.sleep**: blocks the thread, not a suspension point, knows nothing about the Job.
- **Dispatchers.IO**: only changes the thread pool running the code, does not change the cancellation mechanism.

> Senior tip: in a hot loop, call {{ensureActive()}} every N iterations (e.g., 10k) instead of every iteration so the check overhead stays negligible; and always rethrow CancellationException if you must catch broadly.`
},

'qz-banking-001': {
  q: 'A user taps "Transfer 1 million" in the app. The service debits the account in core banking and only then publishes a Kafka event, but the service crashes halfway. Which consequence actually happens, and what is the correct way to handle it?',
  options: [
    'No consequence, because Kafka replays the event automatically after the service restarts',
    'The money was debited but the event was never published, so downstream systems know nothing about the transaction; the fix is the outbox pattern: write the event into the same DB transaction, then relay it to Kafka',
    'Core banking rolls back on its own if the service does not send an ACK within 30 seconds',
    'Just raise the Kafka producer timeout to 60 seconds'
  ],
  explain: `**Correct answer: the transactional outbox pattern.**

### Why correct
"Debit the money in the DB" and "publish to Kafka" are two separate operations; no simple approach can make them atomic as a pair. If the service finishes the DB commit (the money is already debited) and only then starts publishing to Kafka, but crashes before the publish completes, then the DB is committed while Kafka has received nothing, so the event is lost. Downstream systems (for example the receivables bookkeeper or the reporting system) never learn that the transaction happened: the money left one account but was never recorded on the other side.

The **outbox pattern** solves this by never publishing directly. The service writes both the transaction and a "event to be sent" row into **the same DB transaction** — the outbox table. Because they share one transaction, either both succeed or both roll back: if the crash happens before the commit, the money was not debited; if the commit succeeds, the event is already sitting in the outbox. Afterwards a relay (a job or a separate service) reads the outbox table, publishes each event to Kafka, and deletes it or marks it as sent. Since the relay itself can crash and restart, the events must be **idempotent** (each carries a key, so the producer can be configured with producer idempotence and the consumer de-duplicates).

### Why the other options are wrong
- **Kafka replay**: replay only re-delivers events that already exist on the topic. This event was never published, so replay has nothing to resend.
- **Core banking auto-rollback after 30s**: core banking is an ACID system; it has no knowledge of what another service intends to do. It will not roll back an already committed transaction just because some other service failed to send an ACK.
- **Raise the producer timeout to 60s**: it only postpones how long you wait before a publish is declared failed; it does not address a crash in the middle. Crash after a successful publish and the record is still inconsistent; crash before it and the event is still lost.

### Detailed implementation
1. The service opens a transaction, does UPDATE on the balance + INSERT into the outbox (columns event_type, payload, status=PENDING) in that same transaction, then commits.
2. The relay polls {{WHERE status=PENDING}}, publishes each row to Kafka, then UPDATE status=SENT in the relay's own transaction.
3. The Kafka consumer uses the idempotency key so it never processes the same event twice.

> Senior tip: the outbox pattern is the standard answer for making "DB transaction + messaging" atomic. Alternatives: the Kafka transactional producer (transactional id), which only works when both the producer and the broker are Kafka; and 2PC (two-phase commit), which is heavier and easy to leave hanging. In an interview, draw a small table comparing the three: dual-write (broken), outbox (correct), 2PC (complex).`
},

'qz-banking-002': {
  q: 'Which journal entries does a refund transaction need in order to be correct? (Choose 2)',
  options: [
    'Delete the original transaction from the transactions table',
    'Create a reversal entry recording the refunded amount',
    'Update the original transaction status to REFUNDED',
    'Delete the audit log to save storage space'
  ],
  explain: `**Correct answer: create a reversal entry + update the original transaction status to REFUNDED.**

### Why correct
An accounting ledger is **append-only**: once a row has been written it must never be deleted or edited. When a customer is refunded, you cannot delete the row "A debited 2 million", because that row is legal and audit history. Instead you write a new row — the reversal entry — carrying the opposite amount (A credited 2 million), and you flag the original transaction as REFUNDED so queries stay easy. Account A's balance returns to what it was, while the history still keeps both rows for inspection.

Example: A transfers 2 million to B (row 1: A -2m, row 2: B +2m). Then the refund: row 3: A +2m, row 4: B -2m. Rows 3+4 sum to 0, the balances of A and B are back to the starting values, and the history still contains all 4 rows.

### Why the other options are wrong
- **Deleting the original transaction**: the audit trail is gone, the transaction can no longer be audited, and it violates financial regulations.
- **Deleting the audit log**: the same problem — a compliance breach that also destroys the evidence.

> Senior tip: in an interview, say "append-only ledger" and draw those four rows on paper to show the balance returns to the original value. That is the difference between a money system and an order system (orders can be deleted, money never can).`
},

'qz-banking-003': {
  q: 'What do the cut-off time and the business day mean for batch processing in a bank?',
  options: [
    'The cut-off is the moment the branch closes its doors, it has nothing to do with batch',
    'After the cut-off, transactions are posted to the next business day; the EOD batch processes only the transactions of the current business day',
    'The cut-off only applies to credit cards',
    'A business day is just a calendar day, holidays are not excluded'
  ],
  explain: `**Correct answer: the cut-off decides the posting date (value date), and the EOD batch closes only the current business day.**

### Why correct
The cut-off time is a fixed moment within the day. A transaction received before the cut-off is posted to the **current business day**; a transaction received after it is posted to the **next business day** (value date = the next business day). The EOD (End of Day) batch runs after the cut-off and totals/locks the ledger **only for transactions belonging to the current business day**. It does not process transactions that slipped past the cut-off, because those are not officially part of today yet.

Example: cut-off is 15:30. A customer transfers at 15:29 → value date = today, EOD totals it. A customer transfers at 15:31 → value date = tomorrow's business day, and today's EOD never sees that transaction.

### Why the other options are wrong
- **Cut-off is only branch closing time, unrelated to batch**: the cut-off is not when the shop shuts (a shop can still take orders afterwards); it is a **technical** marker used to decide which value date a transaction belongs to, and it determines exactly which transactions the EOD batch will process.
- **Cut-off only applies to credit cards**: it applies to every transaction type (transfers, top-ups, bill payments, cards…), because each product may define its own cut-off.
- **A business day is a calendar day with no holidays**: a business day excludes weekends and national holidays, while a calendar day always counts all 365 days. Confusing them makes a developer compute interest wrongly and post transactions late.

> Senior tip: the system should have one shared BusinessDayService for the whole platform; never let each screen do its own date arithmetic. Cut-off and business-day rules differ per product (savings, lending, cards), so ask for the specification before writing code.`
},

'qz-banking-004': {
  q: 'A callback from a partner bank arrives twice with the same transaction code (idempotency key). How should the service handle it?',
  options: [
    'Process both, since the two attempts might carry different amounts',
    'If the idempotency key already exists, return the stored result and do not process again',
    'Reject the second one with HTTP 409',
    'Write a log line and silently drop it without responding'
  ],
  explain: `**Correct answer: check the idempotency key; if it already exists, return the previous result and do not process again.**

### Why correct
A callback from a partner (for example NAPAS or a switch) is a kind of server-to-server webhook. The partner must be able to send it **idempotently**: if it sends the same callback several times (because of a timeout, a retry, or a duplicated network packet), your system processes it **exactly once** and never debits or credits twice.

The correct way: every callback carries an **idempotency key** (usually the transaction ID, or a UUID generated by the partner). On receipt:
1. Extract the key.
2. Look it up in the DB (a processed_callbacks table or the transactions table) to see whether it has already been handled.
3. If already handled → return 200 OK immediately and do nothing else (return the stored result).
4. If not handled → process it (update balance and status), store key + result, return 200 OK.

Important: the check and the key insert must happen in **the same transaction** as the balance update, otherwise you get a race condition (see qz-banking-011).

### Why the other options are wrong
- **Process both, the amounts may differ**: two callbacks with the same key are by definition the same transaction; the amount never changes between retries. Processing both debits or credits twice.
- **Reject the second with HTTP 409**: 409 Conflict says "there is a conflict", so the partner will retry (retrying is the standard behaviour whenever it does not get a 2xx) and keep getting rejected, leaving the transaction stuck.
- **Log and drop without responding**: the partner cannot tell whether it succeeded, so it retries indefinitely or treats it as a failure, and the transaction never gets updated.

> Senior tip: put a unique constraint on the idempotency key and use INSERT ... ON CONFLICT DO NOTHING (PostgreSQL) to make the check-and-insert atomic. Give the key a TTL (for example 7 days) so the table does not grow forever. If the partner has no key, ask them to add one — it is a hard requirement for a safe integration.`
},

'qz-banking-005': {
  q: 'When reconciling between core banking and a partner bank, which kinds of mismatched lines occur most often? (Choose 3)',
  options: [
    'Transaction present in core but not yet on the partner side (timing)',
    'Transaction present on the partner side but not yet in core',
    'Amount differences caused by rounding',
    'Customer names differing in capitalisation'
  ],
  explain: `**Correct answer: timing in both directions + amount differences from rounding. Different name capitalisation is not a common source of mismatch.**

### Why correct
Reconciliation is the job of comparing the ledgers of two sides (core banking versus a partner such as NAPAS or a switch) to find "unmatched transactions". The three usual sources of mismatch:

1. **Timing (latency)**: core has already recorded the transaction and debited the money, but the partner has not sent its reconciliation file yet (or the other way round) because of network lag, the file not being generated, or the partner's batch not having run. This is the **most common** source.
2. **Amount differences from rounding**: when currency is converted, an exchange rate is applied, or a fee is deducted, core may hold 1000.123 while the partner rounded to 1000.12, producing a gap of 0.01–0.03. This is **very common** whenever exchange rates and fees are involved.
3. **Present on one side only**: core recorded it but the partner never received it (or the partner recorded it but core has not seen it), caused by a timeout, a lost message, or one side crashing.

### Why the remaining option is wrong
- **Customer names differing in capitalisation**: banking reconciliation matches on **amount and transaction ID**, never on customer name. Names can differ because of data-entry habits (for example the diacritic form of a Vietnamese name versus its plain ASCII spelling), but that does not affect amount matching — both sides match on key and amount.

> Senior tip: the reconciliation job runs daily (or per batch) and automatically routes unmatched lines into a queue for staff to work on. Use an aging report to prioritise lines that have been unmatched for a long time (for example over 24h). Never delete an unmatched line — record a reversal entry or adjust it through the maker-checker process.`
},

'qz-banking-006': {
  q: 'Which Java data type should be used for money and rounding in banking transactions?',
  options: [
    'float or double, for simplicity',
    'BigDecimal with a fixed scale',
    'long storing the amount in the smallest unit (cents)',
    'String, then parse whenever it is needed'
  ],
  explain: `**Correct answer: BigDecimal with a fixed scale.**

### Why correct
In banking, money is a decimal number with a fixed number of decimal digits (dong, cents) and it must be **exactly right** — it cannot carry the drift that float/double introduce. BigDecimal is Java's class for arbitrary-precision decimals: it stores a significand (the integer part of the value) plus a scale (how many digits sit after the decimal point), and every add/subtract/multiply is exact, while divide is exact as long as you supply a rounding rule.

Example: {{new BigDecimal("0.1").add(new BigDecimal("0.2"))}} gives exactly {{0.3}}, whereas {{0.1 + 0.2}} gives {{0.30000000000000004}}. With a fixed scale (for example {{scale = 2}}) every amount has exactly two decimal digits, which makes values easy to compare, easy to format, and easy to validate.

### Why the other options are wrong
- **float/double**: these are binary decimals (IEEE 754) and cannot represent 0.1 exactly. After many operations the error accumulates and can shift a ledger by 1–2 units, which is unacceptable in accounting. Also, comparing doubles with {{==}} is wrong; you must use {{compareTo}}.
- **long in the smallest unit (cents)**: this is a legitimate high-performance choice (fast, memory-lean) used in some modern systems, but it **depends on a specific unit** (cent, xu) and unit conversions are easy to get wrong. It is not a "money type", it is an integer type plus a convention. In a banking interview BigDecimal is the standard answer; long minor units is an optimisation you may apply once the concept is already correct.
- **String and parse on demand**: you cannot compute on it directly, you must parse again and again, format errors are easy, and it carries none of the semantics of money.

> Senior tip: use {{BigDecimal}} with {{setScale(2, RoundingMode.HALF_UP)}} when formatting for display, and compare with {{compareTo}} rather than {{equals}} (because {{new BigDecimal("2.0").equals(new BigDecimal("2.00"))}} is false). If the system needs real throughput (e.g. 10k transactions/second) you can store {{long}} minor units, but keep a conversion/display layer that renders them through BigDecimal.`
},

'qz-banking-007': {
  q: 'To comply with PCI-DSS in application logs, how should the card PAN be handled?',
  options: [
    'Log the full PAN, it makes debugging easier',
    'Mask the PAN, keep only the first 6 and last 4 digits, and never log the CVV',
    'Encode the PAN with Base64',
    'Hash the PAN with MD5'
  ],
  explain: `**Correct answer: mask the PAN, keep only the first 6 and last 4 digits, and never log the CVV.**

### Why correct
PCI DSS (Payment Card Industry Data Security Standard) is the mandatory security standard for any system that processes, stores, or transmits payment card numbers. Requirement 3 of PCI DSS says:

- **Never store the PAN (Primary Account Number — the full card number) in plain text**, in a DB, a log, a backup, or memory.
- **Display at most the first 6 digits + the last 4 digits** of a PAN, masking the middle with * (for example 123456 **** **** 3456). That lets staff identify which card was used without reading the whole number.
- **The CVV (Card Verification Value — the 3 digits on the back) must NEVER be stored**, in any form, even encrypted. Once the transaction has been authorised, the CVV must be wiped from memory immediately.

Example: a correct log line is "Card transaction **** **** **** 3456 succeeded", never "123456******3456" and never the full number.

### Why the other options are wrong
- **Log the full PAN for debugging**: a direct violation of PCI DSS Requirement 3.1; if the logs leak, every card in them is stolen.
- **Encode the PAN with Base64**: Base64 is not encryption — it is only an encoding that lets binary data travel as text. Anyone holding the Base64 string can decode it back to the original card number. Use AES encryption or tokenization instead.
- **Hash the PAN with MD5**: MD5 is a one-way hash, so the value cannot be recovered. It still fails PCI DSS because (a) MD5 is not safe (collisions), (b) a hash never lets you recover the number when you legitimately need it (for example for a refund), and (c) PCI DSS requires encryption or a token, not a hash.

> Senior tip: use a centralised masking service or library (a PCI-compliant masking library) so cards are masked everywhere: UI, email, SMS, logs, API responses. When integrating with a payment gateway, prefer tokenization (replace the card with a token) over storing the PAN at all.`
},

'qz-banking-008': {
  q: 'What does maker-checker (four-eyes) require in banking operations?',
  options: [
    'One person performs the work and approves it themselves',
    'The person who creates the transaction (maker) and the person who approves it (checker) must be two different people',
    'The checker only needs to read the log, no approval before execution',
    'It applies only to transactions above 1 billion'
  ],
  explain: `**Correct answer: the maker who creates the transaction and the checker who approves it must be two different people.**

### Why correct
Maker-checker (four-eyes) is one of the most important internal-control principles in banking. The idea: **no single person may complete an operation that moves money**.

- **Maker**: initiates the transaction (for example "move 500 million from A to B"), but the transaction sits in state PENDING and has no effect yet.
- **Checker**: a **different** employee who holds approval rights. The checker re-examines the details (amount, accounts, reason) and either approves or rejects. The money only moves once the checker approves.

The reasoning: if one person does both, that person can commit fraud (enter a wrong amount, send money to a personal account) and approve it themselves to cover it up. With two different people, fraud requires both of them to collude, so the risk drops dramatically.

### Why the other options are wrong
- **One person does it and self-approves**: control is lost — it invites fraud and lets a single mistake through (typing 500 million as 5000 million).
- **Checker only reads the log, no pre-approval**: this is not pre-approval. The checker must review and authorise **before** the transaction executes; reading the log afterwards is insufficient.
- **Only applies above 1 billion**: many banks apply maker-checker to **all** sensitive operations (transfers, limit changes, account opening, refunds), regardless of amount. There may be monetary thresholds for some flows, but the rule is not "only above 1 billion".

> Senior tip: in an interview, stress that "maker and checker must never be the same person" and that the system persists maker_id + checker_id in the audit trail. Do not confuse maker-checker with 2PC (two-phase commit): maker-checker is a business process, 2PC is a distributed-commit mechanism.`
},

'qz-banking-009': {
  q: 'The money was debited but the app reports an error (timeout). What should the system do to keep things consistent?',
  options: [
    'Refund the customer automatically and immediately',
    'Return a PENDING status and allow the transaction status to be queried by idempotency key',
    'Ask the customer to tap again, the system will debit again',
    'Delete the transaction from the DB'
  ],
  explain: `**Correct answer: set the status to PENDING and expose a transaction-status query API keyed by the idempotency key.**

### Why correct
On a timeout there are two possibilities: (a) the transaction actually succeeded on the server but the response was lost on the way back, or (b) the transaction was never finished. The developer **cannot tell** which one it is — and the crucial point is that you **must not retry automatically**, because if it is case (a) a retry debits the customer twice.

The correct handling:
1. On timeout, the system marks the transaction **PENDING** (outcome not yet known).
2. The client shows "Your transaction is being processed, please wait" and must not let the user tap again.
3. The system exposes **GET /transactions/{idempotency_key}/status** so the client can poll or look it up later.
4. Once the backend determines the real outcome (success or failure), it updates the status and notifies the client.

### Why the other options are wrong
- **Automatic instant refund**: if the transaction did succeed, refunding means money was debited and then returned, so the balance ends up unchanged but the history is muddled and the customer panics. If the transaction never succeeded, a refund is not needed at all.
- **Ask the customer to tap again, we debit again**: that is a retry. If the first attempt already succeeded, debiting again takes money twice.
- **Delete the transaction from the DB**: the audit trail is gone, reconciliation later becomes impossible, and it violates financial regulations.

> Senior tip: a "get transaction status" API is mandatory in every payment flow. Design the idempotency key from the start (the client generates a UUID) and store key + status + result in one transaction. If the backend uses Kafka or an outbox, the consumer updates the status when the event is finally processed.`
},

'qz-banking-010': {
  q: 'To make a money transfer atomic between two accounts, which measures are correct? (Choose 2)',
  options: [
    'Use one DB transaction covering both UPDATEs',
    'Use a distributed lock per account',
    'Send a confirmation email before debiting',
    'Write the transaction to a text log file'
  ],
  explain: `**Correct answer: one DB transaction covering both UPDATEs + a distributed lock per account.**

### Why correct
**DB transaction (ACID)**: if accounts A and B live in the same database (one PostgreSQL instance, say), a single transaction can UPDATE both rows. If either UPDATE fails (for example A has insufficient funds), the transaction rolls back, so neither UPDATE is written. That is the simple and correct way to get atomicity — either everything happens or nothing does.

**Distributed lock**: if the system runs several instances (say two service pods in parallel), two requests targeting account A can land on different instances. A DB transaction guarantees atomicity **within one DB**, not **across instances**. A distributed lock (for example a Redis lock keyed by accountId) ensures only one instance works on account A at a time, which prevents the race condition.

### Why the other options are wrong
- **Confirmation email before debiting**: email has nothing to do with DB atomicity. It is an asynchronous action that can be lost, and it cannot be used to roll a transaction back.
- **Log the transaction to a text file**: a plain file has no transaction, no rollback, and no locking, so it cannot guarantee atomicity.

> Senior tip: in an interview, separate the cases clearly: same DB → transaction; several DBs/microservices → saga + compensating transaction (A is debited, an event is sent, B is credited; if crediting B fails, refund A). A distributed lock is the short-term fix, a saga is the long-term answer for microservices.`
},

'qz-banking-011': {
  q: 'Idempotency keys are stored in a DB table with a unique constraint. Two requests with the same key arrive concurrently and there is no race-condition prevention. What happens, and what is the correct fix?',
  options: [
    'The unique constraint error is thrown, so the second request is rejected with an exception',
    'Both requests check that the key does not exist yet (both see nothing), both proceed → the money is debited twice (race condition)',
    'The two requests are queued and processed one after the other automatically, no defensive code needed',
    'The database automatically locks and lets only one request through while the other waits'
  ],
  explain: `**Correct answer: race condition — both see the key as absent, and both process.**

### Why correct
A unique constraint only guarantees that **once an insert has completed**, no other row with the same key can be inserted. But if both requests run {{SELECT ... WHERE key = ?}} first (both find nothing) and then both {{INSERT}}, one INSERT succeeds and the other throws a duplicate-key exception — yet **the money has already been debited twice**, because both requests ran the debit logic before inserting the key. This is the classic race condition: check-then-act is not atomic.

### Why the other options are wrong
- **Unique constraint throws, second request rejected**: it is true that the second request throws a duplicate-key error, but it had **already debited the money** before throwing. The money is gone twice; the client just never got a response. Throwing does not refund anything.
- **A queue handles it automatically**: without an external message queue, two requests hitting the same instance still run on two threads in parallel, and the DB does not queue your requests in the order you wish.
- **The DB locks automatically**: a DB takes row locks for UPDATE and SELECT FOR UPDATE, but a plain {{SELECT WHERE key=?}} usually locks nothing; the planner may well choose a non-locking scan.

### The correct fix
1. Use {{SELECT ... FOR UPDATE}}, or a stored procedure that takes a row lock, so the check-and-insert is serialised.
2. Or use {{INSERT ... ON CONFLICT DO NOTHING}} (PostgreSQL) and then inspect the affected-row count: if zero rows were inserted (the key already existed), roll back or return the stored result.
3. Or take a distributed lock (Redis lock keyed by the idempotency key) before check-and-insert.

> Senior tip: the idempotency key insert (guarded by the unique constraint) must happen inside the same transaction as the debit, or you must lock the row with SELECT FOR UPDATE before checking. Never leave a non-atomic check-then-act on money.`
},

'qz-banking-012': {
  q: 'In reconciliation, how should a timing mismatch (present in core, not yet on the partner side) be handled?',
  options: [
    'Raise an alarm immediately and roll the transaction back',
    'Put it in the unmatched queue, wait for the partner to send it later, and match it automatically when it appears',
    'Delete the row from core',
    'Ask the customer to contact the bank'
  ],
  explain: `**Correct answer: an unmatched queue.**

### Why correct
A timing mismatch (the transaction exists in core but not yet on the partner side, or the reverse) is **common and self-healing**. Core has already recorded the transaction and debited the money, while the partner has not sent its reconciliation file yet (the file has not been generated, the network is slow, or the partner's batch has not run). The reconciliation job therefore sees a line in core and no line on the partner side — one "unmatched" record.

Do not alarm immediately and do not roll back (core already committed and the money is already debited). Instead:
1. The system automatically **pushes the line into the unmatched queue** with: transaction code, amount, timestamp, and direction (core-recorded / partner-not-yet-sent).
2. The reconciliation job polls the queue and waits for the partner's next file. When the new file arrives, it automatically **matches** the unmatched line against a line in the partner file.
3. If the match succeeds → mark it matched and remove it from the queue.
4. If after an SLA window (say 24h, 48h) nothing matches → **escalate** (notify staff to check manually).

### Why the other options are wrong
- **Alarm and roll back immediately**: core has committed, so a rollback is no longer possible (ACID). Alarming right away leaves the transaction hanging and the customer clueless about its status.
- **Delete the row from core**: the audit trail is lost, later reconciliation becomes impossible, and it violates financial regulations.
- **Tell the customer to contact the bank**: the customer has no technical information to report; reconciliation is the system's job, not the customer's.

> Senior tip: build a reconciliation dashboard with an aging report (bucket unmatched lines by age: 0–2h, 2–24h, over 24h) so the oldest lines get handled first. The unmatched queue should live on a message queue (Kafka/RabbitMQ) so it scales and nothing is lost when a server restarts.`
},

'qz-behavioral-015': {
  q: 'A tech lead wants to apply a complex design pattern (for example event sourcing) to a small internal feature, but you worry the operational risk is far greater than the need. What is the best way to respond?',
  options: [
    'Agree immediately so the lead is not put on the spot, then quietly implement a simpler approach without telling anyone.',
    'Object directly in the meeting and say the pattern is too complex and should not be used for a small feature.',
    'Acknowledge the view of the lead, then raise the concrete concerns (small feature, the team has no event-sourcing experience, operations get more complex). Propose a 2-day spike to compare with the current approach, and let the lead make the final call.',
    'Ignore it and do it your own way, because you are more senior than the lead.'
  ],
  explain: `**Correct answer: option 2.**

### Why correct
This response follows the three steps of a polite disagreement: acknowledge the lead's position, raise specific concerns about the technical issue (without judging the person), and propose a way to verify with data (a 2-day spike) before letting the lead make the final decision. It shows engineering judgement, respect, and ownership — exactly the Senior level.

### Why the other options are wrong
- **Option 0**: agreeing outwardly while doing something different behind the scenes destroys trust, and the lead never gets a chance to correct the wrong direction.
- **Option 1**: judging the pattern as too complex attacks the person who proposed it instead of discussing the problem, creating unnecessary confrontation.
- **Option 3**: trying to overpower with seniority bypasses the team's decision process and damages the working relationship.

> Senior tip: when disagreeing with someone more senior, use the frame "I understand your point, here is my concern, and here is how we could test it (X)". Always argue about the idea, never about the person.`
},

'qz-behavioral-016': {
  q: 'Your manager asks for a new feature in 3 weeks, but you estimate at least 6 weeks because the third-party system has no integration documentation. What is the best way to handle it?',
  options: [
    'Take the job and work overtime every week trying to hit 3 weeks, without saying anything until the deadline arrives.',
    'Refuse flatly: "3 weeks is impossible, I need 6 weeks", and do nothing until the manager agrees.',
    'Report the 6-week estimate early with the reason, and offer 2 options: move the deadline, or cut scope (ship a simple integration first, upgrade later). The manager chooses to push the deadline by one week and cut scope, and the feature ships on the new date.',
    'Build to the 3-week plan and hope the third-party documentation appears in time.'
  ],
  explain: `**Correct answer: option 2.**

### Why correct
This answer shows a mature response to an unrealistic deadline: you admit your own estimate could be wrong, you state the objective cause without blaming others, you escalate early (instead of waiting until the last day), and you present choices with their trade-offs so the decision-maker can decide. It ends with a concrete outcome and a process change so the situation does not repeat.

### Why the other options are wrong
- **Option 0**: accepting and grinding overtime is not sustainable, quality usually drops, and you hide the capacity problem from your manager.
- **Option 1**: a flat refusal offers no solution and no trade-off, so the manager has no data to decide on.
- **Option 3**: hoping is not a plan. If the third-party documentation does not arrive in time, the feature will be late or broken.

> Senior tip: the key sentence is "I escalated early, together with options". Bad news delivered early still leaves choices; bad news delivered late leaves only consequences.`
},

'qz-behavioral-017': {
  q: 'You accidentally applied a wrong cache configuration change that overloaded the database and caused roughly 15 minutes of service disruption during peak hours. What is the best answer when an interviewer asks about this incident?',
  options: [
    'The old cache system was unstable, so it was not your fault and there is no need to investigate further.',
    'You own it: you changed the cache TTL without validating it in staging, which overloaded the DB. You restored the configuration immediately, monitored the DB with the on-call engineer, then wrote a postmortem and added a config-review step before anything reaches production.',
    'Report to the manager that the incident was caused by infrastructure, and leave your prior appointment before the problem is resolved.',
    'You always check carefully before deploying, so this incident cannot possibly have been caused by you.'
  ],
  explain: `**Correct answer: option 1.**

### Why correct
This answer shows clear ownership ("I take responsibility"), precise technical detail (the cache TTL change was not validated in staging), disciplined incident handling (restore, monitor, communicate), and systemic prevention (postmortem, added config-review step). That is the signature of a Senior engineer who is accountable.

### Why the other options are wrong
- **Option 0**: denying responsibility and blaming the system. The question asks about an incident you caused, so denial reads as a red flag.
- **Option 2**: walking away before the issue is resolved is unprofessional and dumps extra work on colleagues.
- **Option 3**: an assumption disconnected from reality. Every engineer who has run production long enough has caused an incident; claiming the opposite makes the interviewer doubt your honesty.

> Senior tip: narrate the incident in postmortem form: impact → detection → mitigation → root cause → preventive actions. Blameless means not attributing fault to an individual; it does not mean nobody owns the problem.`
},

'qz-behavioral-018': {
  q: 'A teammate repeatedly fails to finish their assigned work and it is affecting the whole sprint. What is the best way to handle it?',
  options: [
    'Take over all of their work and do it yourself so the sprint is not late, without telling anyone.',
    'Set up a 1-1 to understand the cause (for example overload, unclear requirements, personal issues), offer help or split the work into smaller pieces, and set clear expectations; if there is still no improvement, raise it transparently with the lead.',
    'Report to the lead right away that this colleague does not work, and propose moving them out of the team.',
    'Ignore it, since your own work is done on time and it is not your problem.'
  ],
  explain: `**Correct answer: option 1.**

### Why correct
This approach prioritises understanding before acting: a 1-1 to find the real cause (overload, unclear requirements, or a personal issue), then appropriate support, splitting the work into smaller pieces, and setting clear expectations. If nothing improves, you raise it transparently with the lead. It demonstrates empathy, management capability, and ownership of the team's outcome.

### Why the other options are wrong
- **Option 0**: hero mode. The sprint stays on time in the short run, but the colleague never improves and you become the bottleneck, while the capacity problem stays hidden.
- **Option 2**: it skips every attempt to help and labels the person as "not working" before understanding the cause. It shows a lack of empathy and of team spirit.
- **Option 3**: it ignores the impact on the shared outcome. At Senior level the interviewer wants to see you accountable for the team's result, not only for your own tickets.

> Senior tip: when talking about other people in an answer, stay respectful (no names, no disparagement) and emphasise their outcome, not your heroics.`
},

'qz-behavioral-019': {
  q: 'Your manager assigns "optimise the reporting system" without saying what the goal is, which metric must improve, or the deadline. What is the best way to respond?',
  options: [
    'Start writing optimisation code straight away based on your own interpretation, to look proactive, without asking anything.',
    'Say the task is too vague and you cannot do it because there are no clear requirements.',
    'Ask clarifying questions: is the goal to reduce report generation time or to reduce DB load? How long does it take today, and what is the target? Who consumes these reports? Then write a short scope summary and confirm it with the manager before starting.',
    'Hand it to another team member because they somehow seem to know the requirements better.'
  ],
  explain: `**Correct answer: option 2.**

### Why correct
When handed a vague task, the right move is to clarify before acting: ask concrete questions about the goal, the metric, the users, and the deadline. Then summarise the scope and confirm it with the manager. This avoids building in the wrong direction, avoids wasted time, and demonstrates Senior analytical thinking.

### Why the other options are wrong
- **Option 0**: building on your own interpretation without clarifying can go the wrong way, waste effort, and force a rewrite from scratch.
- **Option 1**: refusing without proposing anything reads as passive and as unable to deal with ambiguity.
- **Option 3**: passing it to someone else does not resolve the ambiguity, it just shifts the burden to another colleague.

> Senior tip: a vague task is a chance to show analytical skill. Write a short scope summary (goal, metric, in scope, out of scope, deadline) and get the manager to confirm it before you write any code.`
}

});
