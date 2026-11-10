/*
 * English translation of js/data/q-banking.js — task T1149. Format: js/core/i18n.js (content overlay).
 * ids: banking-009 banking-010 banking-011 banking-012 banking-013 banking-014 banking-015
 */
App.i18n.content({

  'banking-009': {
    q: 'What is PCI DSS, essentially, when handling card numbers? Why must CVV never be stored, what is tokenization, and how do you mask card numbers in logs?',
    a: `**Summary:** PCI DSS is the security standard for every organisation that stores, processes or transmits payment card numbers, aimed at protecting card data from theft. The key principles: never store the CVV (the 3-digit security code on the back of the card), use tokenization to replace the real card number with a substitute code, and mask the card number whenever you write a log. Developers need to understand these rules to build safe card systems.

### What PCI DSS is (explained from scratch)
PCI DSS (Payment Card Industry Data Security Standard) is a set of security rules that every organisation handling cards (banks, shops, payment technology companies) must follow. It is not a law, but it is a requirement imposed by the card schemes (Visa, Mastercard...). A violating organisation can be fined, have its card services suspended, or be publicly named when cards are compromised.

PCI DSS covers many requirements (user identification, data encryption, access restriction, network protection...). What a developer needs to know are the requirements that touch code directly: never store CVV, encrypt card numbers, mask cards in logs, restrict access.

### Never store the CVV
CVV (Card Verification Value) is the 3 digits (or 4 on American Express) printed on the back of the card, used to verify that an online buyer actually has the card in hand. PCI DSS absolutely forbids storing the CVV after the payment has been authorised, because if the CVV is not stored, an attacker who obtains card numbers still cannot buy online (a CVV would be needed). If the system is breached and card numbers leak but CVVs do not, the risk is much lower.

Example: a customer enters their card number and CVV to make a purchase. Once the payment is confirmed, the system stores the card number (encrypted/tokenised) but not the CVV. Next time the customer buys, the system can either ask them to re-enter the CVV, or use the token to pay without the card at all.

### What tokenization is
Tokenization replaces the real card number (PAN - Primary Account Number) with a random substitute code (a token) that has no mathematical relationship to the card number. The token lives inside your system; the real card number lives in an isolated, heavily protected system called a vault.

Example: the real card number 1234 5678 9012 3456 is replaced by the token "tok_abc123xyz". The banking system stores the token in its database; when a payment must be executed, it sends the token to the vault, which returns the real card number (or performs the payment directly) for processing. If the bank's database is breached, the attacker only gets tokens, which cannot be turned back into real card numbers without the vault's keys.

A token is different from encryption: encryption needs a key to decrypt, a token does not (you need the vault system to map it back).

### Masking card numbers in logs
System logs must never contain a full card number. If you need to log something for troubleshooting, record only the last 4 digits, or mask everything except the last 4.

Wrong log example: "Card transaction 1234 5678 9012 3456 succeeded" → the card number leaks.
Right log example: "Card transaction **** **** **** 3456 succeeded" → safe.

~~~seq
title: Card payment with token and masked log
actors: Customer | Payment system | Token Vault | Log
Customer -> Payment system: enter card number, pay
Payment system -> Token Vault: exchange card number for token
Token Vault --> Payment system: return token tok_abc123
Payment system -> Log: log card **** **** **** 3456 succeeded
Log --> Payment system: written
~~~

### Common mistakes
- Storing the CVV in the database → a PCI DSS violation; if it leaks, attackers can buy online.
- Storing real card numbers as raw plaintext → if leaked, every card is stolen.
- Writing full card numbers into logs for debugging → card confidentiality is lost.
- Tokens stored unencrypted or kept in an unprotected system → the attacker gets both the token and the card number.
- Staff able to view full card numbers in the admin tool → violates least privilege.

> Senior tip: In an interview, say that PCI DSS is not just "encryption" but "minimising the sensitive data the system needs to store". Emphasise that the real card number only needs to live in one place, and every other system stores tokens. If you can, mention a system you built or know of (for example using a bank's payment service or a PCI-certified tokenization provider).

> Term: PAN (Primary Account Number) is the card number printed on the card (16 digits), the data protected by PCI DSS.
`,
    follow: [
      'Why is storing the CVV forbidden after payment authorisation?',
      'How does a token differ from encryption, and when do you use which?',
      'How must logs mask card numbers to be safe?'
    ]
  },

  'banking-010': {
    q: 'What are the ISO 8583 (cards) and ISO 20022 (payments) messaging standards at a conceptual level, and what are their basic differences?',
    a: `**Summary:** ISO 8583 is a messaging standard used for payment-card transactions (cash withdrawal, purchases at ATM/POS), designed for low latency and immediate processing. ISO 20022 is a general messaging standard for payments (transfers, collections, international payments), using XML/JSON formats that carry much richer information. Both are real industry standards, not invented by any single bank, and developers need to know them to work with card and payment systems.

### What ISO 8583 is (explained from scratch)
ISO 8583 is the messaging standard for card transactions (payment, cash withdrawal, balance inquiry) between the card, the card reader (POS/ATM), the bank's card system and the card networks (Visa, Mastercard...). It was designed to process fast, carry little data, and run at high throughput (each transaction completes in a few seconds).

An ISO 8583 message has this structure: an MTI (Message Type Identifier - message type, 4 digits) plus data fields (data elements, each identified by a number). For example:
- MTI 0100: financial transaction request (payment/withdrawal).
- MTI 0110: response to a financial transaction request.
- MTI 0400: reversal request.
- Field 2: card number (PAN).
- Field 3: processing code (transaction type).
- Field 4: amount.
- Field 11: system trace audit number (STAN, a sequence number).
- Field 41: card reader (terminal ID).
- Field 49: currency code.

Example: a customer withdraws 2,000,000 at an ATM. The card reader sends an ISO 8583 message with MTI 0100, field 2 carrying the card number, field 4 carrying 2000000, field 49 carrying VND. The bank replies with MTI 0110 and a response code (for instance 00 = approved).

### What ISO 20022 is
ISO 20022 is a general messaging standard for payments (transfers, collections, international payments...). It uses XML or JSON and carries very detailed information (sender name, beneficiary name, addresses, payment purpose, reference codes...). ISO 20022 has been adopted by many banks and international payment systems, including the instant-payment rails in Vietnam (NAPAS led the migration to ISO 20022 for domestic transfers).

An example ISO 20022 message can contain: sender name "Nguyen Van A", the sending account, beneficiary name "Tran Thi B", the receiving account, the amount, the purpose "Payment for invoice 123", currency VND.

### The basic differences
| Criterion | ISO 8583 | ISO 20022 |
|---|---|---|
| Scope | Card transactions (ATM/POS) | General payments (transfers, collections...) |
| Format | Numbered fields (binary/ASCII text) | XML or JSON |
| Information | Little, only what is needed | Rich, detailed sender/beneficiary, purpose |
| Speed | Fast, real-time processing | Carries more data, often processed in batches |
| Typical use | Cash withdrawal, card purchases | Interbank transfers, international payments |

Example: withdrawing cash at an ATM uses ISO 8583 (fast, little data). Transferring 200 million via NAPAS may use ISO 20022 (detailed, with a payment purpose).

~~~seq
title: ATM withdrawal using ISO 8583
actors: Customer | ATM | Card system | Card network | Bank
Customer -> ATM: insert card, enter PIN, withdraw 2 million
ATM -> Card system: send ISO 8583 message MTI 0100
Card system -> Card network: forward the request
Card network -> Bank: check account and balance
Bank --> Card network: reply MTI 0110, code 00 approved
Card network --> Card system: forward the result
Card system --> ATM: allow withdrawal
ATM --> Customer: dispense 2 million, print receipt
~~~

### Common mistakes
- Treating ISO 8583 and ISO 20022 as the same thing → they are two different standards for different uses.
- Filling in the wrong ISO 8583 field (you must know what each field means) → wrong data sent, the partner bank rejects the message.
- Assuming ISO 20022 is simple (just an amount and an account) → missing data, the transaction gets rejected.
- Not keeping up when the standard changes (ISO 20022 has many versions) → the old system breaks when connecting to new partners.

> Senior tip: In an interview, there is no need to cover the whole standard (hundreds of pages). Know this clearly: ISO 8583 for cards, ISO 20022 for general payments, one built on numbered fields (ISO 8583) and the other on XML/JSON (ISO 20022), and a developer must map data from the bank's internal systems onto the external standard when sending to partners. If you can, mention a messaging system you have worked with (for example a card system or a remittance system) and the standard it used.

> Term: MTI (Message Type Identifier) is the 4 digits at the start of an ISO 8583 message saying what kind of message it is (payment request, response, reversal...).
`,
    follow: [
      'Where do ISO 8583 and ISO 20022 differ, and what is each used for?',
      'What is an MTI, and some commonly seen MTI values?',
      'Why is ISO 20022 preferred for international payments?'
    ]
  },

  'banking-011': {
    q: 'Computing interest on deposits/loans in code: using BigDecimal, day-count conventions (actual/365), and how to round?',
    a: `**Summary:** Money in Java code must use BigDecimal, never double, because double suffers from binary rounding error (0.1 + 0.2 does not equal exactly 0.3). Interest calculation requires a fixed day-count convention (for example actual/365: divide the real number of days by 365) and a rounding rule (usually round to 2 decimal places with HALF_UP). A developer must write interest code that is explicit, auditable and free of accumulated rounding error.

### What money in code is (explained from scratch)
Java has two main ways to store real numbers: double and BigDecimal. double stores real numbers in binary format, and some decimals cannot be represented exactly (for example 0.1 + 0.2 = 0.30000000000000004). Why? Because double stores 0.1 as an approximation, not exactly. For money, this tiny error is unacceptable — being off by one dong is still a bug.

BigDecimal stores a real number as a large integer plus a decimal-point position, so every decimal digit is computed exactly. That is why banks use BigDecimal for all money arithmetic (balances, interest, fees).

### Computing deposit/loan interest
Simple-interest formula: Interest = Balance × Rate × Days / 365 (the actual/365 convention).
- Balance: the money remaining in the deposit account or the loan.
- Rate: the annual percentage (for example 6% per year).
- Days: the number of days the money was deposited or borrowed (from date to date).
- 365: days in a year (the actual/365 convention, used in Vietnam and many countries).

Example: deposit 100 million, rate 6% per year, term 30 days.
Interest = 100,000,000 × 0.06 × 30 / 365 = 493,150.68... VND.
Rounded to 2 decimal places: 493,150.68 VND.

### Rounding money
Money must be rounded to 2 decimal places (the smallest currency unit). BigDecimal provides setScale(2, RoundingMode.HALF_UP) to round to 2 digits, rounding up when the third digit is >= 5.

Important rounding rules:
- Always round after each interest computation; never carry an unrounded balance forward in between.
- With many transactions, the sum of the per-transaction rounded interest must equal the total interest of the period (otherwise the difference must be adjusted).
- Never round twice (double rounding), because it introduces error.

~~~seq
title: Computing deposit interest with BigDecimal
actors: App | Interest | DB | App
App -> Interest: compute on 100 million, 6% per year, 30 days
Interest -> DB: read balance, rate, days
DB --> Interest: balance 100 million, 6%, 30 days
Interest --> App: 493,150.68 VND (rounded)
App --> Customer: show the interest amount
~~~

~~~java
public class InterestCalculator {
    public static BigDecimal calculateInterest(BigDecimal principal, BigDecimal annualRate, int days) {
        // Interest = principal * rate * days / 365
        BigDecimal interest = principal
            .multiply(annualRate)
            .multiply(BigDecimal.valueOf(days))
            .divide(BigDecimal.valueOf(365), 10, RoundingMode.HALF_UP);
        return interest.setScale(2, RoundingMode.HALF_UP);
    }
}
~~~

The code above keeps interest to 10 decimal places in between, then rounds to 2 digits in the final step. The division by 365 uses divide with a high scale so no precision is lost in the middle.

### The day-count convention (actual/365)
Actual/365 means dividing the real number of days (from date to date, counting both endpoints if the rule allows) by 365. Other conventions exist (actual/360, 30/360...) but actual/365 is the common one in Vietnam. A developer must know the product's convention and use one convention consistently across all computations, never mixing them.

Example: a deposit from 1/1 to 31/1 spans 31 days. Interest = balance × 6% × 31 / 365.

### Common mistakes
- Using double for money → rounding error, accounts off by one dong, auditors refuse to accept it.
- Rounding at intermediate steps, not only at the final step → the total money is wrong.
- Not recording the day-count convention (actual/365 or 360) → interest mismatches when comparing with the old system.
- Accruing interest by calendar days without excluding weekends/holidays when the rule counts working days only → wrong day count.

> Senior tip: In an interview, draw the interest formula on paper: Interest = Balance × Rate × Days / 365, and state that BigDecimal is mandatory. Emphasise that division in BigDecimal requires an explicit scale and RoundingMode, otherwise it throws ArithmeticException when the division is not exact. If you can, cite the classic double error (0.1 + 0.2) as evidence.

> Term: RoundingMode (rounding mode) is the rule that decides how the digit at the rounding position is handled (for example HALF_UP = round up if the next digit is >= 5).
`,
    follow: [
      'Why must money in Java use BigDecimal instead of double?',
      'What is the actual/365 convention, and how does it differ from 360?',
      'How must rounding be handled to avoid accumulated error?'
    ]
  },

  'banking-012': {
    q: 'When the core bank is under night maintenance, what must the system do so customers are not affected: queues, store-and-forward, and how do you notify customers?',
    a: `**Summary:** When core banking is under night maintenance, customer transactions cannot be processed immediately. The system needs a queue to hold requests, a store-and-forward mechanism (persist first, then send when the core is back) so no transaction is lost, and advance notice to customers so they know which services are unavailable and for how long. Developers must design these pieces so the system stays available and customers are never surprised.

### What night core-banking maintenance is (explained from scratch)
Core banking needs maintenance (bug fixes, software upgrades, data backup) that cannot be done during business hours, so it usually runs at night when customers transact little. During the maintenance window the core does not accept or process new transactions. If customers still use the app to transfer money, withdraw cash or pay bills, the system must have a way to handle those requests until the core returns.

### The queue
A queue is where transaction requests are stored while the core is under maintenance. The customer submits a request (transfer, top-up...); instead of returning an error right away, the system stores it in the queue and replies "your request has been accepted and will be processed later". When the core is back, the system pulls requests from the queue and processes them.

The queue must:
- Persist requests to disk or a database, not just cache memory (so a power cut does not lose them).
- Process in arrival order (first in, first out).
- Have a size limit (if too many requests pile up, tell the customer the service is at capacity).

Example: 1,000 customers transfer money during a 2-hour maintenance window. All of them are stored in the queue. After the maintenance, the system processes the 1,000 transactions from the queue.

### Store-and-forward
Store-and-forward means persisting the transaction request at an intermediate system first, then forwarding it to the core when the core is ready. It is the hardened version of a queue: it guarantees the request survives even if the middle system loses power or the core stops.

The flow:
1. The customer sends the request to the intermediate system (API gateway or a service).
2. The intermediate system persists the request into a database (store).
3. It returns an "accepted" acknowledgement to the customer.
4. When the core is back, the intermediate system reads requests from the database and sends them to the core (forward).
5. After the core processes a request successfully, the request is deleted from the database.

If the core is still under maintenance, the system retries sending after a delay — but it must never debit the customer twice (see the idempotency lesson).

~~~seq
title: Store-and-forward during core maintenance
actors: Customer | API Gateway | Queue DB | Core | Customer
Customer -> API Gateway: transfer request for 2 million
API Gateway -> Queue DB: save request, status processing
Queue DB --> API Gateway: saved
API Gateway --> Customer: accepted, will process later
Core --> API Gateway: ready again
API Gateway -> Queue DB: fetch requests still processing
API Gateway -> Core: send the transfer request
Core --> API Gateway: success
API Gateway -> Queue DB: delete the request
API Gateway --> Customer: notified the transfer completed
~~~

### Notifying customers
Developers must notify customers before the core maintenance window (via email, SMS, in-app notice):
- The maintenance time (start and expected end).
- The services that will be unavailable (transfers, withdrawals, balance checks...).
- How to get help if needed.
- Thanks for the customer's patience.

During the window, if a customer attempts a transaction, the system must immediately say "the system is under maintenance, your request has been saved and will be processed later". After it ends, notify each outcome — success or failure.

SMS example: "Bank ABC will maintain its systems from 23:00 until 01:00 tomorrow. Transfers and withdrawals are temporarily unavailable. Your requests have been saved and will be processed once maintenance is complete."

### Common mistakes
- Not persisting requests during core maintenance → requests are lost, customers complain.
- Automatic retries that debit multiple times → the customer loses money, an idempotency violation.
- Notifying customers late → confusion, calls flooding the contact centre.
- An unbounded queue → the system is overwhelmed when many customers transact at once.
- No notification after completion → the customer never knows whether the transaction succeeded.

> Senior tip: In an interview, say the system never outright rejects a customer request just because the core is under maintenance. The queue and store-and-forward guarantee requests are not lost; customer notice guarantees nobody is surprised. Emphasise that after maintenance the system must process the backlog and report results to customers — it must not silently drop anything.

> Term: Backlog is the set of requests already persisted but not yet processed, which must be handled after the system returns to normal.
`,
    follow: [
      'Why persist requests in a database instead of keeping them only in memory?',
      'How does store-and-forward differ from an ordinary queue?',
      'After maintenance ends, how do you process the backlog of queued requests?'
    ]
  },

  'banking-013': {
    q: 'When a customer swipes a card, why is the money only "held" and not actually moved? How do the four steps authorization, capture, settlement and chargeback unfold?',
    a: `**Summary:** When a customer swipes a card, the bank does not move real money yet — it only **freezes (holds)** an amount against the limit or account, which is the *authorization* step. Money only moves once the merchant sends a *capture* order and then *settlement* (batch money transfer between banks) runs. If the customer disputes, the transaction can end in a *chargeback* — the issuing bank claws the money back. Because these four steps are decoupled and the last two run in batches, customers see money "held" for anywhere between 1 and 7 days.

### The parties in a card transaction
| Party | Role | Example |
|---|---|---|
| Cardholder | the person using the card to pay | a customer buying goods |
| Merchant | the place accepting card payment | a supermarket, website, hotel |
| Acquirer | the merchant's bank, routes money to the merchant | Bank B |
| Issuer | the bank that issued the card, manages the cardholder's money/limit | Bank A |
| Card network | the network linking acquirer and issuer, sets message standards, fees and dispute rules | Visa, Mastercard |

### Step 1 — authorization: ask permission and hold the money
The POS terminal or website asks "can this customer pay 2,000,000 VND?" to the acquirer; the acquirer passes it through the network, and the network forwards it to the issuer. The issuer checks three things:
1. The card is valid, not locked, not on a blocklist.
2. Enough limit remains: a credit card with a 20-million limit that has used 15 million leaves 5 million available — a 6-million purchase is declined with an "over limit" code.
3. The transaction's fraud score.
If all pass, the issuer deducts from the **available balance** and returns an approval plus an *auth code*. The money still sits at the issuer; it is only "marked as held". The customer opens the app and sees a "pending transaction" line — that is the hold, not money already gone.

### Step 2 — capture: the merchant confirms it wants real money
Hours or days later the merchant sends a capture order for part or all of the authorised amount. Example: a hotel authorises 3 million at check-in; the guest stays one night costing 1,500,000 → the merchant captures 1,500,000 and the remaining 1,500,000 is released. That is why the system must support *partial capture* and *multiple capture* on one authorisation, and must **never allow capture above the authorised amount**.

### Step 3 — settlement: the money actually moves
At the end of the day the merchant bundles the captures into one file sent to the acquirer (the settlement file). The network computes the net position between its members, the issuer transfers real money to the acquirer, and the acquirer pays the merchant minus the merchant fee (MDR). Money typically lands in the merchant's account at T+1 or T+2, where T is the day the settlement file was submitted.

### Step 4 — chargeback: clawing the money back
The customer calls the issuer to dispute: goods never received, goods not as described, or "I never made this card payment" (fraud). The issuer initiates a chargeback; the money is pulled back from the acquirer and then from the merchant, plus a fee. The merchant has the right of *representment* — submitting evidence (a signed bill, delivery photos, device logs) to rebut. A voluntary refund and a chargeback are two different paths: a refund is done by the merchant with no penalty; a chargeback is forced by the banks, counts against the merchant's chargeback ratio, and once the ratio crosses the threshold the card network can terminate the merchant's contract.

### The full flow
~~~seq
title: Card swipe - auth, capture, settlement
actors: Cardholder | Merchant | Acquirer | Network | Issuer
Cardholder -> Merchant: swipe card for 2,000,000 VND
Merchant -> Acquirer: create authorization request
Acquirer -> Network: forward request to issuer
Network -> Issuer: check card and limit
Issuer -> Issuer: hold 2,000,000 against the limit
Issuer --> Network: approve with auth code
Network --> Acquirer: approve
Acquirer --> Merchant: success, print receipt
note Merchant..Issuer: next day merchant sends capture file
Merchant -> Acquirer: capture the full 2,000,000
Acquirer -> Network: settlement at end of day
Network -> Issuer: request real money transfer
Issuer --> Network: debit the customer account
Network --> Acquirer: money arrives, minus MDR fee
Acquirer --> Merchant: pay the merchant at T+1
~~~

### The developer's side: state machine and the hold table
Typical states: CREATED, AUTHORIZED, PARTIALLY_CAPTURED, CAPTURED, SETTLED, REFUNDED, CHARGEBACKED, AUTH_EXPIRED. Every state transition must record the id of the previous step (the auth id for capture, the capture id for settlement) — otherwise, when a dispute arrives, you cannot trace where the "2 million" actually sits.

~~~java
record Hold(String paymentId, BigDecimal authorized, BigDecimal captured, Instant expiresAt) {}

BigDecimal capturable(Hold h, BigDecimal requested, Instant now) {
    if (h == null || h.expiresAt().isBefore(now)) return BigDecimal.ZERO;
    BigDecimal remaining = h.authorized().subtract(h.captured());
    return remaining.min(requested);      // capture can never exceed what is still held
}
~~~

### Why money stays "held" for days — the real causes
- Authorisations expire: if the merchant forgets to capture, the hold is released after a few days (hotels, fuel stations, car rentals hold longer because the final amount is not yet known).
- Capture and settlement run as end-of-day batches, not in real time.
- Cross-border transactions: the held amount is an estimate at an indicative exchange rate; the actual captured figure can differ by tens of thousands of dong, so the app must show it as "temporarily held".

### Common mistakes
- Allowing capture above the authorised amount, or not accumulating partial captures → the customer is debited more than they agreed to.
- Not storing the auth id → capture becomes impossible, the hold hangs until expiry, the merchant loses money.
- Treating refund and chargeback as one state → you cannot tell who holds the money or who pays the fee.
- Processing a settlement file twice → the merchant gets paid twice; you must lock duplicates with an idempotency key on the transaction id inside the file.

> Senior tip: In an interview, state clearly that "the customer's money only leaves the issuer at settlement; everything before that is just a placeholder in the books". Add two things that score well: (1) holds must expire and a job must release them, (2) the chargeback ratio is existential for a merchant, so the system must capture evidence (proof of delivery, signature, device logs) at the moment the transaction happens, not when the dispute arrives.

> Term: Hold is the part of the available balance temporarily marked unavailable, not yet booked as a final transaction. MDR (Merchant Discount Rate) is the fee the merchant pays on each card transaction, deducted right at the settlement step.
`,
    follow: [
      'Why must capture never exceed the authorized amount, and how do partial captures accumulate?',
      'How do refund and chargeback differ in the ledger and in the processing flow?',
      'If the hold expires and the merchant never captured, what must the system do so the customer does not complain?'
    ]
  },

  'banking-014': {
    q: 'How does a QR-code payment (VietQR) work, from the moment the customer scans to the money landing in the account of the seller? Where do static and dynamic QRs differ, and why is a "transfer successful" screenshot not evidence?',
    a: `**Summary:** A payment QR code is essentially just "a pre-filled transfer form": beneficiary bank, account number, name, amount, transfer content. The customer's banking app scans it, reads those fields and initiates a 24/7 instant transfer. The order passes through the switching system (in Vietnam, NAPAS), the money lands in the seller's account, and the seller gets a credit notification via the app or a webhook. The QR holds no money and proves nothing — only the bank's ledger can prove payment.

### Static QR vs dynamic QR
| | Static QR | Dynamic QR |
|---|---|---|
| Where shown | printed, stuck at the counter | POS screen, checkout page |
| Amount | none, the customer types it in | present, generated per order |
| Order code | not attached | attached to one specific order |
| Expiry | never | usually a few minutes |
| Main risk | a fraudster sticks their own QR over the shop's | lower, but expiry must be handled |
| Used by | small eateries, grocery shops | shops with a POS, e-commerce |

A static QR is convenient but leaky: the customer enters the amount by hand so it can be wrong, and because the QR is not tied to an order, the seller must guess "the 87,000 VND received at 19:03 — which table is that for". A dynamic QR is generated with transfer content containing the order code, which enables automatic reconciliation.

### What is inside the QR
The common standard is EMVCo QR, whose fields are written in TLV form (Tag-Length-Value: each field is a tag number, a length, then the value, concatenated into one string with no spaces). Typical tags:
- Tag 26 (merchant account information): the **BIN** — the leading digits identifying the beneficiary bank — and the seller's account number.
- Tag 52: MCC, the merchant category code (retail, supermarket, hotel...).
- Tag 53: currency code per ISO 4217, VND is 704. Tag 54: the amount (present only on dynamic QRs).
- Tags 59, 60, 61: seller's name, city, postal code. Tag 58: country (VN).
- Tag 62: additional data, usually carrying the order code — the crux of automatic reconciliation.
- Tag 63: CRC, the last 4 check characters of the string, which catch a truncated or tampered QR.

~~~text
Example illustrating the TLV structure (not a real bank payload):
00 02 01            : version
01 02 12            : QR type (12 = goods/services payment)
26 26 0010 970436 0114 1028394056 : beneficiary bank BIN + account number
52 04 5311          : MCC of a retail store
53 03 704           : currency VND
54 06 250.00        : amount
59 15 CUA HANG A    : seller name
60 06 HA NOI        : city
58 02 VN            : country
62 17 01 13 A123456 : order code (nested tag inside)
63 04 B7F2          : CRC
~~~

The amount in the QR is only a **suggestion**; the customer can still change it (with a static QR), or the app still shows a confirmation screen. That is why the seller must never take the QR amount as proof of payment received — only the amount recorded in the ledger counts.

### The flow from the customer's app to the seller's account
~~~seq
title: Customer scans a VietQR to pay 250,000
actors: Customer | Customer app | NAPAS | Seller core | Seller POS
Customer -> Customer app: open app, scan QR
Customer app -> Customer app: parse TLV, show name and amount
Customer -> Customer app: confirm "Send 250,000"
Customer app -> NAPAS: 24/7 instant transfer order
NAPAS -> Seller core: credit the seller account
Seller core --> NAPAS: balance updated
NAPAS --> Customer app: success with reference code
Customer app --> Customer: show "Sent"
Seller core -> Seller POS: credit webhook
Seller POS -> Seller POS: reconcile, confirm order A123456
~~~

### Why you must reconcile, not trust a screenshot
A customer sending the seller a screenshot of "Transaction successful" is a widespread scam: images are trivially faked, while the money has not moved. The correct flow for the seller's system:
1. Create the order with status AWAITING_PAYMENT and generate a dynamic QR tied to the order code.
2. Receive a credit webhook **or** proactively call the lookup API by reference code.
3. Verify: the right amount, the right beneficiary account, the right order code, and the reference has never been used for another order.
4. Only then move the order to PAID and allow delivery.
5. If the webhook has not arrived after N minutes: do not cancel the order immediately — investigate first, because the transaction may still be pending.

Webhooks can always be delivered twice (the bank side retries), so the handler must be idempotent: a lock keyed on the reference code; a second delivery just returns the same result as the first.

### Minimum data design
~~~sql
CREATE TABLE merchant_order (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_code    VARCHAR(32)  NOT NULL UNIQUE,      -- order code printed in the transfer content
  amount        NUMERIC(20,0) NOT NULL,            -- VND, no decimals
  status        VARCHAR(20)  NOT NULL,             -- AWAITING | PAID | EXPIRED | CANCELLED
  qr_expires_at TIMESTAMPTZ,
  paid_ref      VARCHAR(64)  UNIQUE,               -- NAPAS reference code, blocks double confirmation
  paid_at       TIMESTAMPTZ
);
~~~

### Common mistakes
- Confirming payment without a bank-side acknowledgement (trusting only the customer's word) → goods and money lost.
- Not tying the transfer content to an order code → the seller must eyeball amounts and guess which order it is, reconciling by hand and recording the wrong order.
- Using decimal numbers for VND everywhere, then rounding away during reconciliation.
- Dynamic QRs with no expiry → a fraudster keeps a paid order's QR and reuses it.
- Treating webhooks as absolutely trusted, without verifying signature/origin and without handling duplicates.

> Senior tip: Say in the interview that the QR is only an **initiation channel**, while the **deciding channel** is the switching system and the ledger. So the design must have three things: a unique order code in the transfer content, an "awaiting confirmation" state instead of jumping straight to "success" when the customer reports, and a proactive lookup job in case a webhook gets lost. This is exactly the idempotency-and-reconciliation lesson applied to a very everyday flow.

> Term: BIN (Bank Identification Number) is the first 6 digits of a number sequence, used to identify a bank — here, the beneficiary bank. A webhook is system A proactively calling system B's API when an event happens, instead of B constantly polling A.
`,
    follow: [
      'Why must an order never be confirmed from a "transfer successful" screenshot sent by the customer alone?',
      'What data does a dynamic QR need for automatic reconciliation, and how do you handle QR expiry?',
      'The credit webhook is delivered twice — how should the system of the seller behave?'
    ]
  },

  'banking-015': {
    q: 'Designing recurring automatic collection (electricity bills, insurance): where is the collection mandate stored, how does the schedule run, how do you retry when the account is short of funds, and how do you notify the customer?',
    a: `**Summary:** Auto-debit is when a customer signs a **collection mandate** (direct-debit authorisation) allowing one party to collect money from their account periodically. The system generates a collection schedule; on the due date a job creates the transaction and debits the account; if funds are short it retries a few times per the configured policy, then marks the item overdue — and the customer is notified at all three moments: before the collection, when it succeeds, when it fails. The whole thing must guarantee each period is collected exactly once, even when the job re-runs.

### The three data objects you must have
1. **Mandate (the authorisation):** who allows whom to collect, how much per collection, when it starts and ends, together with proof of the customer's consent (timestamp, IP, signing OTP). A mandate has states ACTIVE, SUSPENDED, REVOKED — the customer may withdraw the authorisation at any time, and the job **must check this state right before collecting**, not only when scheduling.
2. **Collection period (schedule/run):** one row per period, for example June 2026, with the expected amount and the due date.
3. **Attempt:** every time the debit is fired is an attempt, with its own transaction reference.

### Scheduling: traps that look small but cost real money
- **Day 31:** the customer picks day 31, but February has no 31st. There must be a rule: clamp to the last day of the month, or roll to the next month.
- **Holidays:** the due date lands on a Saturday, Sunday or public holiday. The rule must pick one: collect earlier (roll back), later (roll forward) or skip — each business line chooses differently, and the code must never improvise.
- **Time zones:** run the job at 00:30 Vietnam time; do not take the server's clock from another time zone.
- **Multiple instances:** if the app runs 3 pods and all 3 carry @Scheduled, one period gets collected 3 times. You need one of three things: a lock table (ShedLock), electing a single leader instance, or sharding by mandate id.

~~~java
static LocalDate dueDate(int year, int month, int dayOfMonth, WeekendRule rule) {
    int capped = Math.min(dayOfMonth, YearMonth.of(year, month).lengthOfMonth());
    LocalDate due = LocalDate.of(year, month, capped);      // day 31 -> 28/29/30 in February
    boolean weekend = due.getDayOfWeek() == DayOfWeek.SATURDAY || due.getDayOfWeek() == DayOfWeek.SUNDAY;
    if (rule == WeekendRule.IGNORE || !weekend) return due;
    return switch (rule) {
        case NEXT_WORKING_DAY -> due.plusDays(due.getDayOfWeek() == DayOfWeek.SATURDAY ? 2 : 1);
        case PREV_WORKING_DAY -> due.minusDays(due.getDayOfWeek() == DayOfWeek.SUNDAY ? 2 : 1);
        default -> due;
    };
}
~~~

### The lock against double collection
Each period must have a **unique natural key**: (mandate id + period). Put a unique constraint in the database; do not rely only on an if-check in code, because two threads can pass the same if at the same moment.

~~~sql
CREATE TABLE debit_run (
  mandate_id  BIGINT       NOT NULL REFERENCES debit_mandate(id),
  period_key  VARCHAR(10)  NOT NULL,          -- '2026-06'
  due_date    DATE         NOT NULL,
  amount      NUMERIC(20,2) NOT NULL,
  status      VARCHAR(16)  NOT NULL,          -- PENDING | SUCCESS | INSUFFICIENT | ABANDONED
  attempts    SMALLINT     NOT NULL DEFAULT 0,
  PRIMARY KEY (mandate_id, period_key)        -- one period is collected only once
);
~~~

### Retrying when funds are short
Insufficient funds is an error **worth waiting on**, not a technical fault, so do not retry aggressively:
- Attempt 1 on the due day. If "insufficient balance", attempt 2 one day later, attempt 3 two days after that (at most 3 attempts per period, configurable).
- Each attempt is a new transaction with a new reference, but **still the same period** → as soon as one attempt succeeds, the remaining attempts must be cancelled; never collect a second time.
- Attempts exhausted: mark ABANDONED, post the overdue amount per the contract, notify the collecting party, inform the customer.
- If it is bank maintenance or a network error (a technical fault), retry fast with backoff and **do not** count it against the business retry limit.

### Notifying the customer
- Before the collection (T-2): "Upcoming debit: 450,000 VND on 05/06 under your authorisation." This is the most important notice for cutting complaints.
- On success: the amount, the transaction code, the name of the collecting party.
- On failure: the reason, the deadline to top up so a retry can run, and how to cancel the mandate.
- Always let the customer view and revoke the mandate in the app; if they must call the contact centre to cancel, you are sitting on a stream of complaints.

### Common mistakes
- Re-running the job after an incident without a natural key → the customer is charged twice for the same period.
- Checking the mandate when scheduling but not when collecting → debiting an authorisation that has already been revoked.
- Retrying like "every 5 minutes until it works" → thousands of duplicate transactions and the customer is debited at midnight.
- Hard-coding day 31 → February generates no period at all, and the collector collects nothing for a whole month.
- Only informing the customer after the money was taken → complaints and drawn-out refunds.

> Senior tip: The question that separates seniors here is "is your job safe to re-run" (re-runnable). Answer in order: a natural key (mandate, period) in the database, a mandate-state check right before posting to the ledger, business retries separated from technical retries, and a notice issued before each collection. Add one practical point: the collected amount can change (electricity use varies month to month), so the mandate must carry an amount cap and the system must refuse any collection above it.

> Term: Mandate (direct-debit authorisation) is the paper or e-consent allowing an organisation to debit a customer's account periodically. Period key is the string identifying one collection period, for example '2026-06'.
`,
    follow: [
      'The auto-debit job runs on 3 instances — how do you prevent double collection?',
      'Where does the design distinguish a retry for insufficient funds from a retry for a network fault?',
      'The customer revokes the mandate mid-way: which periods may still be collected, and what evidence must be kept?'
    ]
  }

});
