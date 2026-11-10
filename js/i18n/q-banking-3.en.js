/*
 * English translation of js/data/q-banking.js — task T663. Format: js/core/i18n.js (content overlay).
 * ids: banking-016 banking-017 banking-018 banking-019 banking-020
 */
App.i18n.content({

  'banking-016': {
    q: 'A real-time fraud detection system runs when a customer swipes a card or transfers money: how does a rule engine differ from an ML model, what latency budget is reasonable, and how do you handle false positives without losing customers?',
    a: `**Summary:** A real-time fraud detection system answers one question within a few hundred milliseconds: "allow, challenge the customer for extra verification, or block?". The three decision layers usually run in parallel: a **rule engine** (hard rules, explainable), an **ML model** (scores fraud probability 0-1, catches subtle patterns) and **lists** (whitelist/blacklist). Because it sits directly on the transaction path it may only consume a small share of the time budget; if it times out there must be an explicit policy on whether to allow the transaction (fail open) or block it (fail closed). A false positive — blocking a legitimate transaction — is a real cost, so there must be an in-app path to unblock immediately.

### The three decision layers
| Layer | Example | Pros | Cons |
|---|---|---|---|
| Hard rule | "the card transacted in Hanoi 10 minutes ago, now it is swiped abroad" (impossible travel) | explainable, toggled instantly, needs no historical data | easily bypassed by fraudsters who dodge the rule, many conflicting rules to maintain |
| ML model | fraud-probability score based on velocity, behaviour, device, merchant history | catches complex patterns, adapts | hard to explain, needs labelled data, has compute latency |
| Lists | whitelist of verified phone numbers, blacklist of merchants | fast, definitive | the data must be updated continuously |
Combine them: rules cover the clear-cut cases, the model scores the rest, lists protect known-good customers. The final score is compared with thresholds → approve / challenge / block.

### Latency: you only have a few hundred milliseconds
Split the time budget for a card transaction, totalling about 2000 ms so the customer still accepts it:
- Gateway + security checks: 100 ms
- Account/limit check in the core: 300-500 ms
- **Fraud decision: 150-300 ms**
- Channel response + writing logs: 100 ms
So the decision service must read data pre-computed in memory (Redis, feature cache); it may not do heavy synchronous computation. The common pattern:
1. The transaction flow calls the decision service synchronously with a short timeout (e.g. 200 ms).
2. In parallel, the transaction event is pushed onto a queue (Kafka) to update sliding-window features for the next time — the heavy work runs **asynchronously** and never blocks the customer.
3. A large model can run over the stream and write its score out to a cache; the request only reads that score.

**When the decision times out:** you must choose a policy, never leave it implicit. Fail open (allow through) loses money if fraudsters exploit the outage window; fail closed (block) loses revenue and customers. In practice it is usually a blend: below a certain amount fail open, large or cross-border transactions fail closed or require verification.

### False positives and false negatives
- **False positive (FP):** blocking a customer's legitimate transaction. Cost: call-center calls, lost revenue, the customer switching to another bank.
- **False negative (FN):** letting a fraudulent transaction through. Cost: reimbursement money, investigation fees.
- Fraud data is very rare (usually under 1% of transactions), so simply blocking a random 1% makes the "recall" metric look great while false positives become a disaster. That is why you must reason in terms of **expected cost**: number of FPs times the cost of losing a customer, plus number of FNs times the average loss per case — not just accuracy.
- Softening the blow of FPs: instead of blocking, use **step-up authentication** (require the customer to verify via OTP or an in-app push confirmation). A real customer confirms and the transaction goes through immediately; a fraudster never receives the OTP. Reserve block for scores that are extremely high.
- There must be a one-tap dispute channel: the customer presses "This was me" in the app, the system unblocks and records a "legit" label that improves the model.

### Features and explainability
Common features: transaction count within 5/30/60 minutes (velocity), total amount in the day, geographic distance from the previous transaction, whether the device/IP is new, merchant category code (MCC) and its historical dispute rate, time of day (3 a.m.), unusual odd amounts. When the model outputs a high score, you must extract the **reasons** (which features pushed the score up) so investigators and the customer can understand it.

~~~java
interface Rule { String name(); int score(); boolean matches(TxContext ctx); }

record Decision(boolean allow, boolean challenge, List<String> hits) {}

Decision decide(List<Rule> rules, TxContext ctx, int challengeAt, int blockAt) {
    List<String> hits = new ArrayList<>();
    int score = 0;
    for (Rule r : rules) {
        if (r.matches(ctx)) { hits.add(r.name()); score += r.score(); }
    }
    if (score >= blockAt)     return new Decision(false, false, hits);   // block
    if (score >= challengeAt) return new Decision(true, true, hits);     // force extra verification
    return new Decision(true, false, hits);
}
~~~

### Feedback loop and case management
Blocked or held transactions go into a queue for staff to review (case management). The staff conclusion — "real fraud" or "real customer" — is exactly the training label for the next retrain. Without this loop the model decays within months because fraudsters change their tricks.

### Common mistakes
- Recomputing all features while waiting for the decision → too slow, transactions time out en masse.
- Counting velocity in Redis but forgetting TTLs or forgetting per-time-window keys → memory bloat and wrong numbers.
- Two concurrent transactions incrementing one counter with read-then-add-then-write → lost updates, missed fraud; you must use an atomic command (INCR) or Lua.
- Not capturing a feature snapshot at decision time → later you cannot reproduce why a customer was blocked and cannot explain it.
- Changing thresholds without notice, without a grey release → the block rate spikes overnight.

> Senior tip: In an interview, answer in this order: (1) the decision is synchronous but only reads pre-computed data, the heavy work runs asynchronously; (2) there is always a policy for when the fraud service fails, with amount thresholds; (3) prefer a step-up challenge over a block to reduce FPs; (4) log the reason for every decision. Add: fraud is a cat-and-mouse game, the system's value lies in the feedback loop and the ability to toggle rules within minutes — not in having the fanciest model.

> Terms: Velocity is the transaction rate (how many transactions, how much money within a short time window). Step-up authentication forces one extra verification step (OTP, push confirmation) inside the transaction itself instead of outright refusal.

  `,
    follow: [
      'The fraud service times out at 300 ms — do you allow the transaction or block it? What does the decision depend on?',
      'How do you reduce false positives without increasing false negatives?',
      'The model outputs a score of 0.92 — how do you explain it to the customer and to the compliance department?'
    ]
  },

  'banking-017': {
    q: 'Where exactly is SMS OTP weak? How do smart OTP (TOTP) and transaction signing work, and how does device binding help with transaction authentication?',
    a: `**Summary:** OTP (one-time password) is a short-lived single-use password. SMS OTP is weak because it only proves "the holder of this phone number", and phone numbers can be taken over (SIM swap); moreover the code sent over SMS **is not bound to the transaction content** — if an attacker changes the amount after the customer receives the OTP, the system still accepts it. Smart OTP runs inside the app using the TOTP algorithm (no network needed), while **transaction signing** computes the code over the actual amount and beneficiary account, so changing any single character invalidates the code. Device binding restricts which devices are allowed to confirm.

### Why SMS OTP is weak — each attack explained
1. **SIM swap (SIM takeover):** an attacker uses forged documents or bribery to go to the carrier and request a "SIM reissue" for the victim's number. The real SIM is deactivated and every OTP flows to the attacker's phone. This is the most common attack and has nothing to do with the bank's own security.
2. **Interception on the cellular signalling channel:** the mobile network's signalling infrastructure (SS7) has been exploited before; text messages can be read at the network layer.
3. **Social engineering:** someone calls pretending to be the bank's call center and says "read out the 6 digits you just received so I can cross-check". The OTP has no idea who is reading it aloud.
4. **No binding to the transaction:** the SMS only says "Your OTP is 123456 for verification". That code works for transferring 5 million just as well as for 500 million → once an attacker has hijacked the session they can edit the amount, and the customer still nods and submits because the code is still valid.
5. **Dependence on coverage and the carrier:** customers abroad or hit by delivery failures cannot authenticate, which generates complaints.

SMS OTP is still useful as a "better than nothing" layer and as a fallback channel, but do not treat it as strong authentication for large transactions.

### TOTP — how Smart OTP works
TOTP (RFC 6238) = HMAC-SHA1(secret, time counter), take a few bits and reduce them to 6 digits. The app and the server both hold the same **secret** (a private key, usually transferred to the app via a QR code at activation) and both know the current time, so each side independently computes the same code for the same 30-second window. No internet needed, no carrier needed.

~~~java
static String totp(byte[] secret, long epochSeconds) throws Exception {
    long counter = epochSeconds / 30;                     // 30-second window
    byte[] data = new byte[8];
    for (int i = 7; i >= 0; i--) { data[i] = (byte) counter; counter >>>= 8; }
    Mac mac = Mac.getInstance("HmacSHA1");
    mac.init(new SecretKeySpec(secret, "HmacSHA1"));
    byte[] h = mac.doFinal(data);
    int off = h[h.length - 1] & 0x0F;                     // dynamic truncation
    int bin = ((h[off] & 0x7F) << 24) | ((h[off + 1] & 0xFF) << 16)
            | ((h[off + 2] & 0xFF) << 8) | (h[off + 3] & 0xFF);
    return String.format("%06d", bin % 1_000_000);
}
~~~

The server usually checks the previous and next window as well (±1) to tolerate clock drift, but it must **not** check five windows wide: every extra window open is extra time an attacker can use a stolen code.

### Transaction signing: the code "locks in" the transaction content
Instead of a free-floating OTP, the device computes a code over a signed string containing **amount + beneficiary account + transaction id**; the server recomputes it over exactly the content it is about to execute and compares. The result:
- The amount is changed after the customer has signed → the code no longer matches → rejected.
- The customer sees the text "You are transferring 5,000,000 VND to 0987654321" right at the code-entry screen, so they cannot be tricked into signing blind.
This is the basis of **strong customer authentication (SCA)**: combining "something you have" (the device, a key in the Keystore/Secure Enclave) + "something you know" (PIN/biometrics) + "this exact transaction".

### Device binding
First-time activation ties the account to one device: store the device identifier and the **public key** generated by the device (the private key stays inside the Android Keystore / iOS Secure Enclave and cannot be exported). From then on:
- Push confirmations are sent only to bound devices.
- Changing phones requires a re-enroll procedure, usually with OTP + documents or remote verification, plus a notification to the old device.
- If the device is rooted/jailbroken, lower its trust level (balance viewing only, no transfers).
- Record fingerprints to detect "one account, 4 devices within 10 minutes".

### Deployment rules developers often forget
- An OTP/signed code must be **single-use**: store its used state even while it is still valid.
- Compare codes in constant time (MessageDigest.isEqual), never with ==.
- Limit the number of attempts (5) and lock temporarily; a 6-digit code has only 1 million combinations, and with unlimited tries it can be exhausted within hours.
- Never log OTPs, never send an OTP over another channel for "convenience", never return an OTP in an API response for testing.
- The TOTP secret must be encrypted at rest (KMS), and customers must be able to reset it when they lose their phone.

### Common mistakes
- Allowing the OTP of one transaction to be reused for another (no amount binding) → the classic hole behind real money-loss incidents.
- Setting a 10-minute OTP validity to "reduce complaints" → a far too wide window for attackers.
- Skipping the mandate/device-status check when a customer changes phones because "the app says it works".
- Sending the OTP as soon as the customer opens the screen, before the concrete transaction is known → the binding is pointless.

> Senior tip: In an interview, do not just say "SMS OTP is weak because of SIM swap". State three layers: (1) the OTP must be bound to the transaction content (amount + beneficiary), (2) the "something you have" factor must be a key in device hardware, not a phone number, (3) every process needs a fallback path for customers who lose their phone without becoming a backdoor for attackers. Add one number: 6-digit code + 5 attempts + 15-minute lock is a reasonable configuration; 1 million combinations divided by 5 attempts gives a 0.0005% guess probability.

> Terms: A secret (private key) is a byte string known only to the device and the server, used to generate TOTP. Keystore/Secure Enclave is a dedicated key-storage area on the phone from which the key cannot be extracted even with root access.

  `,
    follow: [
      'How does a SIM swap happen, and how does the bank limit damage when a customer phone number is taken over?',
      'Why must an OTP be bound to the amount and beneficiary account, and when does the server check that?',
      'A customer loses their phone — how must the Smart OTP reset process be designed so it does not become a backdoor?'
    ]
  },

  'banking-018': {
    q: 'Term deposits: how is interest calculated and booked, how do you handle an early withdrawal (break), and what must you watch out for with automatic renewal?',
    a: `**Summary:** A customer deposits 100 million into a 12-month term at 5.5% per year. Daily interest = balance × annual rate × actual days / day-count basis (usually 365), and the bank **accrues interest daily** into the ledger even before paying it to the customer. Early break: the customer usually receives interest only at the non-term rate (very low, e.g. 0.2%/year) for the days actually deposited, and any interest already paid ahead (if paid at the start of the term or monthly) must be clawed back. Automatic renewal means that on the maturity date the system opens a new term at the rate card **of that day** and must notify the customer beforehand.

### Three concepts to clarify before writing code
- **Term:** the period the money is contractually "locked", e.g. 6 months, counted from the deposit date to the maturity date.
- **Nominal annual rate:** the number 5.5%/year does not mechanically mean you receive 2.75% for 6 months — you must convert it to the actual days deposited.
- **Day count convention:** the agreement on "how many days a year has". actual/365 means dividing real days by 365; actual/360 yields slightly more interest because the denominator is smaller. Pick one, use it consistently, and write it into the contract.

### Computing interest with real numbers
Deposit 100,000,000 VND at 5.5%/year for a 90-day term, basis actual/365:
- Interest = 100,000,000 × 0.055 × 90 / 365 = **1,356,164** VND (rounded to VND per policy).
- With actual/360: 1,375,000 VND — a difference of 18,836 VND just from changing the denominator.
- Depositing the same amount for 12 months with interest paid at maturity, the customer actually receives about 5,500,000 if interest is not capitalised; if interest is capitalised quarterly the customer receives a bit more (compound interest).

~~~java
static final BigDecimal DAYS_IN_YEAR = new BigDecimal("365");

BigDecimal accruedInterest(BigDecimal principal, BigDecimal annualRate,
                           long actualDays, int scale, RoundingMode mode) {
    BigDecimal raw = principal.multiply(annualRate)
                              .multiply(new BigDecimal(actualDays))
                              .divide(DAYS_IN_YEAR, 10, RoundingMode.HALF_UP);  // keep precision while accruing
    return raw.setScale(scale, mode);      // round only when booking / paying out
}
~~~

Two easy mistakes: using **double** (a one-in-a-billion drift after millions of computations), and rounding at **every step** instead of keeping a long scale and rounding only at recognition.

### Daily accrual — why it must be done
Interest owed to customers is a **liability** of the bank, accruing by the day, not appearing only at maturity. Accounting must recognise it steadily so the ledger is correct: at each end-of-day cycle, compute the day's accrued interest and post "interest expense / accrued interest payable". When interest is actually paid to the customer, the accrued part is settled and only the difference is booked. Skip this and your daily P&L report jumps on maturity day and auditors will not accept it.

### Early break — business first, then code
1. The customer requests withdrawal before maturity, e.g. after 47 days of a 90-day term.
2. Recompute interest at the **non-term rate** for the 47 actual days: 100,000,000 × 0.002 × 47/365 ≈ 25,753 VND (versus 708,219 VND if those 47 days had earned 5.5%/year — the customer clearly sees why withdrawing early loses money).
3. If the bank has already paid interest ahead (paid at term start or monthly), the **overpaid interest must be clawed back**: deducted from principal, or booked as a negative adjustment entry. Forgetting this step is a real loss.
4. Apply the early-break fee if the contract stipulates one (usually a percentage of principal or of interest, depending on the deposit date) — it must be configuration data effective by date, not hard-coded.
5. Book it: credit principal + actual interest to the customer's settlement account, close the savings record with status CLOSED, and **keep** all old records untouched (append-only) so you can still answer questions 10 years later.

Comparison of interest-payment modes:
| Mode | Pros | Downsides for the customer | Early break |
|---|---|---|---|
| At maturity | simple, implicit compounding at maturity | no cash during the term | just recompute, nothing to claw back |
| Up front (discounted) | receive the interest immediately | it is deducted ahead, an early break loses heavily | must claw back the interest not yet fully "earned" |
| Monthly | steady cash flow | no capitalisation so interest is lower | must claw back interest paid in previous months |

### Automatic renewal (auto-renewal)
- Choose the mode: renew principal (principal rolls to the new term, interest paid to the settlement account), renew principal + interest (interest capitalised), or no renewal (everything moves back to the settlement account).
- The renewal rate = the rate card **on maturity day**, not the old rate — but the customer must be notified in advance (T-1 or earlier), because when market rates fall the customer is entitled to decide otherwise.
- Maturity date falling on a holiday: the rule must be explicit (roll to the next business day, and whether that extra day accrues interest).
- The renewal job runs inside EOD and must be idempotent per (savings record, new term) — re-running it must not open two terms.

### Common mistakes
- Treating the interest rate as one global number with **no per-date version**: a customer who deposited in 2023 at 7.5% gets re-priced to the new 4.2% → mass complaints.
- Storing rates as double, or dividing before multiplying — a few dozen thousand VND wrong per record; with 2 million records that is real money.
- Partial break: the new principal correctly becomes 0 for the withdrawn part, but interest of the withdrawn part is computed for the whole term.
- Computing the maturity date by adding months to a LocalDate and forgetting the day-31 case.
- Clawing back paid interest without an adjustment entry, just "subtracting a bit" → the ledger drifts and reconciliation turns red.

> Senior tip: This question earns points in two places: (1) clearly separate three things — the contractual rate (immutable, stored with the deposit date), the market rate card (changes over time), and the rounding/fee policy (configuration); (2) be able to describe daily interest accrual, because that is where purely technical developers drop the ball. Proactively say "I would store the rate version and freeze the formula by date" — that is exactly what banks started doing after interest-rate complaint incidents.

> Terms: Day count convention is the agreement on how to convert an annual rate to the actual days deposited, e.g. actual/365. Accrual is recognising interest cost that has already been incurred but not yet paid.

  `,
    follow: [
      'Why must interest be accrued daily instead of waiting until maturity to recognise it?',
      'A customer breaks a term after having received monthly interest — how do you handle the interest already paid?',
      'Market rates change — how do you guarantee an old deposit record still computes the interest it promised?'
    ]
  },

  'banking-019': {
    q: 'A system has multiple currencies and exchange rates: what must each transaction store, why must you never recompute the rate at query time, and how do you round conversions so that totals still add up?',
    a: `**Summary:** Three rules to live by: (1) an amount is always a **(value, currency) pair**, never split apart; (2) any transaction involving conversion must **store the exchange-rate snapshot** (rate, source, quote id, timestamp) at the moment it executes — if you recompute it when a report is viewed the numbers will change and you cannot explain them; (3) round according to the **decimal places of each currency** and round only in the final step, with the remainder allocated into adjustment lines so no money "falls out" of the total.

### Why the exchange rate must be stored per transaction
Rates change by the minute. A customer sends 100 USD at 10:00 at a rate of 25,400 VND/USD and the bank charges them 2,540,000 VND. At 16:00 the rate is 25,650. If the system stored only "100 USD" and multiplied by the current rate when printing a statement:
- The customer sees an amount different from what was actually deducted → they complain, and you are wrong.
- Reconciliation against the ledger fails, because the ledger recorded 2,540,000.
- Auditors and regulators demand proof of "which rate applied to this transaction" and will not accept a number derived after the fact.
So the FX transaction table must hold: amount_original, currency_original, amount_credited, currency_credited, fx_rate, fx_rate_source, quote_id, quoted_at, fee.

| Field | Example | Role |
|---|---|---|
| amount_original + currency | 100.00, USD | the amount the customer sees and agrees to |
| fx_rate | 25,400 | the rate actually applied |
| fx_rate_source + quote_id | head office published, QR-20260605-00123 | traceable: who quoted it, when |
| amount_credited + currency | 2,540,000, VND | the amount actually booked |
| effective_at | 2026-06-05T10:00:03+07:00 | lets you replay the exact version of the rate table |

### Bid, mid, ask and spread — read the business before the code
A bank always quotes two prices: **bid** (the bank buys in) and **ask** (the bank sells out). The middle of the two is the **mid**, used only for news reporting and internal calculations, **never** to charge a customer. For 100 USD:
- The customer sells 100 USD to the bank: receives 100 × 25,100 (bid) = 2,510,000.
- The customer buys 100 USD: pays 100 × 25,700 (ask) = 2,570,000.
- The 60,000 VND difference is called the spread, and it is the bank's revenue.
Mistakenly using mid for a real transaction is a serious business error, typically exposed during end-of-day reconciliation with head office.

### Different decimal places across currencies
Per ISO 4217 each currency has its own "exponent": VND and JPY are 0 (no smaller trading unit), USD and EUR are 2, some Gulf currencies such as BHD and KWD are 3.
- Never add 12.5 JPY to 12.50 USD and treat it as one number.
- Never hard-code "2 decimal places" inside a fee calculation.
- The conversion function must take its scale from the **target currency**, not from the source currency.

~~~java
record Money(BigDecimal amount, String currency) {
    private static final Map<String, Integer> EXPONENT = Map.of("VND", 0, "USD", 2, "JPY", 0, "BHD", 3);

    Money plus(Money other) {
        if (!currency.equals(other.currency))
            throw new IllegalStateException("Adding two different currencies: " + currency + " and " + other.currency);
        return new Money(amount.add(other.amount), currency);
    }

    Money convertedTo(String targetCode, BigDecimal rate) {   // round by the target currency decimals
        BigDecimal raw = amount.multiply(rate);
        int scale = EXPONENT.get(targetCode);
        return new Money(raw.setScale(scale, RoundingMode.HALF_EVEN), targetCode);
    }
}
~~~

### Rounding and the "one unit goes missing" problem
- HALF_UP (0.5 rounds up) is the common convention toward customers; HALF_EVEN (round to even) is used when very many lines must be summed, because errors in both directions cancel out instead of always accumulating upward. Pick one, document it, use it consistently.
- Round **once, at the output**; rounding intermediate values and then adding continues to drift by a few units per thousand transactions.
- Splitting 100 USD evenly among 3 people: 33.33 + 33.33 + 33.33 = 99.99, short by 0.01. The remainder must be allocated.

~~~java
static List<BigDecimal> splitEvenly(BigDecimal total, int parts, int scale) {   // non-negative amount
    long minor = total.movePointRight(scale).longValueExact();   // to the smallest unit: cents, dong
    long each = Math.floorDiv(minor, parts);
    long residual = minor - each * parts;                        // the part not divisible
    List<BigDecimal> out = new ArrayList<>();
    for (int i = 0; i < parts; i++)
        out.add(BigDecimal.valueOf(each + (i < residual ? 1 : 0)).movePointLeft(scale));
    return out;   // the parts always sum back to total
}
~~~

### Multi-step conversion and cross rates
VND → EUR usually goes through USD (a cross rate). Two risks: rounding at each step skews the result, and rate arcs that are not internally consistent (USD/EUR × EUR/VND differs from USD/VND). In practice, head office publishes a daily rate table per currency pair; the system should **pick an existing pair** instead of deriving one, and if derivation is unavoidable, compute with long-scale BigDecimal and round only when producing the money amount.

### End-of-day revaluation of foreign-currency balances
The bank holds foreign-currency balances (e.g. 10 million USD in a deposit account). At day end the rate has moved, so the VND-equivalent value moves too. Accountants call this **revaluation**: post an unrealized gain/loss entry so the balance sheet reflects current value, and reverse that entry at the start of the next day.

~~~text
Revaluation 2026-06-05, position 10,000,000 USD
End-of-day rate: 25,400 -> 25,650 VND/USD
VND value:       254,000,000,000 -> 256,500,000,000
Entry: debit "unrealized FX difference" 2,500,000,000
       credit "revalued foreign-currency assets" 2,500,000,000
Next day: reverse this entry (reversal).
~~~

Multi-currency management reports must state the **reporting currency** and the rate used (opening end-of-day, period average, or closing) — the same dataset under two choices yields two different numbers, and the reader must know which one they are looking at.

### Common mistakes
- Storing amounts as double or as a long "VND count" and assuming every currency behaves the same.
- An amount column with no currency column beside it — after six months nobody dares to sum them.
- Converting twice (the customer sees one number on the confirmation screen and another in the statement).
- Computing the rate at read time (JOIN today's rate table) instead of at write time — last month's report changes every day.
- Rounding at each detail line and then summing, so the total differs from rounding at invoice level; there must be a remainder-adjustment line.

> Senior tip: The answer that earns points proactively names three things: "money is a value-currency pair", "every transaction stores the rate and its source at the time of execution", and "round once, with a remainder-adjustment line so totals always reconcile". Add the business context: FX difference is a real P&L item, managed with limits by a dealing room (treasury), so your code is only ever allowed to apply rates — never to invent them.

> Terms: An exchange-rate snapshot is the record of the rate value used at transaction time, so the exact amounts can be reproduced later. Revaluation is recomputing the value of foreign-currency items at the current rate for reporting.

  `,
    follow: [
      'Why store the rate and its source per transaction instead of looking up the rate table when needed?',
      'Splitting one amount into 3 parts — how is the rounding remainder handled so the total still matches?',
      'A management report has many currencies: which reporting currency and rate do you pick, and how do you annotate it?'
    ]
  },

  'banking-020': {
    q: 'When replacing a core banking system, how do you migrate account and balance data: classifying the data, running multiple dry runs, reconciling balances and resolving differences before cut-over?',
    a: `**Summary:** A core banking migration moves customers, accounts, balances, products, interest terms and mandates from the old system to the new one, under one absolute requirement: **every single unit of balance must match**. The safe method is running many dry runs on real data, reconciling automatically at three levels (totals, groups, per account), then cutting over in a weekend window with quantitative go/no-go criteria and a rollback plan. The reconciliation tool must be written **before** the migration tool, because it is what decides whether you are allowed to cut over.

### Classify the data to migrate — and decide what not to migrate
| Group | Content | Typical decision |
|---|---|---|
| Master data | customers, identity documents, group relationships, addresses | migrate in full, including KYC data and expiry dates |
| Accounts & balances | account number, type, status, opening balance, value date | migrate in full, balances must match absolutely |
| Transaction history | hundreds of millions of rows | usually only the balance snapshot + the last 12-24 months; older data stays in the archive (data warehouse) and is queried via an API |
| Contract terms | rates by date, fee schedule, terms, renewal | migrate with **point-in-time versions**, not just current values |
| In-flight state | card holds, pending transactions, accrued-but-unpaid interest, issued cheques | the easiest to miss — needs its own inventory and its own reconciliation |
| Mandates, limits, restrictions | mandates, collection/payment orders, legal freezes | must be migrated; missing one is a violation |

Full history or not is a cost trade-off: migrating 300 million rows costs extra hours and storage, while regulation and the business usually only require "lookup when the customer asks". State clearly who decides (the compliance function) instead of deciding by default.

### The 4-step pipeline and the dry runs
Extract → Transform → Load → Reconcile.
- **Transform** is where discrepancies are born: old product code A-101 maps to new product SAV_12; DD/MM/YYYY dates must become ISO; unusual negative balances must be resolved or explained.
- Run **dry runs** many times on a copy of real data (PII-masked if the environment lacks the required security level), and measure **throughput** each time: e.g. 2 million accounts written at 5,000 rows/second take ~7 minutes for balances, but 300 million history rows at 20,000 rows/second is ~4 hours — versus a 48-hour cut-over window there is room, but not twice as much.
- Every run must leave a reconciliation report, and the **number of discrepancies must trend to zero** across runs — not "oh, this one can be skipped".

### Balance reconciliation at three levels
1. **Totals:** the sum of customer account balances must equal the offsetting ledger (GL) balance. Fastest check, weakest one.
2. **Groups:** by branch, product type, currency, segment.
3. **Per account:** compare old balance and new balance by key, expecting **zero difference**.

The classic trap: comparing only totals. Short 1 billion in account A and over 1 billion in account B, and the grand total still looks perfect. That is why level 3 is mandatory, not optional.

~~~text
Final dry run #4 summary  (all 2,113,402 accounts)
MATCH            2,113,398
EXPLAINED             4   (3 dormant accounts manually reconciled, 1 fee order - already on file)
UNEXPLAINED           0   <-- the condition required to cut over: must be zero
GL total vs balance total:  difference 0
Unexpected negative balances: 0
Accounts with unmapped product: 0
~~~

~~~java
record AccountDiff(String accountNo, BigDecimal oldBalance, BigDecimal newBalance) {
    BigDecimal delta() { return newBalance.subtract(oldBalance); }
}

static String classify(AccountDiff d, Map<String, String> approvedExceptions) {
    BigDecimal delta = d.delta();
    if (delta.signum() == 0) return "MATCH";
    String note = approvedExceptions.get(d.accountNo());
    return note != null ? "EXPLAINED: " + note : "UNEXPLAINED";   // any UNEXPLAINED left and you must not cut
}
~~~

### Parallel running — the variants and their risks
- **Offline replay (safest):** take transaction files and EOD results from the old core, load them into the new core in an isolated environment, compare outputs. The new core never touches real data and customers see nothing.
- **Shadow write:** real transactions are also written into the new core for checking, while customers are still served by the old core. Risk: two places writing, easy to drift while logic is not yet equivalent; you must disable anything that generates duplicate reference numbers.
- **True parallel run:** both cores process live for a few EOD cycles, reconciled daily. The most expensive, but the only way to expose differences in holiday handling, interest rounding and fees.
The biggest shared risk: **two sources of truth for balances**. If you must choose, use replay for the long phase and only move to shadow when nearly done.

### Cut-over and the point of no return
A typical runbook: freeze channels (stop accepting transactions), run the final EOD on the old core, migrate the delta, reconcile, decide go/no-go against pre-agreed criteria (UNEXPLAINED count = 0, 100% accounts matched, pending batches resolved), switch the new core on, run smoke tests (open the app, view a balance, make an internal transfer, look up one old transaction), then open to customers.
- The **point of no return** is when the new core begins writing real transactions; rolling back afterwards means migrating in reverse and reconciling everything again.
- Go/no-go criteria must be **numbers**, owned by one person with decision authority, written beforehand — otherwise at 3 a.m. everyone finds a reason to "just keep going".

### Dirty data and the exception queue
Old data always has problems: missing birth dates, duplicate identity documents, "ghost" accounts without owners, negative balances tolerated by old business rules. The correct handling is an **exception queue**: each bad record is captured, classified, and assigned to someone to fix **in the old system** (the source of the data), then re-run. Never "fix" things during migration by filling in arbitrary defaults — you would migrate both the error and the fabrication.

### Common mistakes
- Migrating once and believing you are done, never repeating to check that the tooling is deterministic.
- Comparing totals but not per-account balances; two errors cancelling each other out.
- Forgetting in-flight state: card holds, accrued interest, uncleared cheques → after cut-over, customers genuinely "lose" money.
- Not storing the old-id → new-id mapping; five years later nobody can trace a transaction from the old-core era.
- Not freezing data while migrating the delta → transactions created inside the window are lost.
- Rollback existing only on paper, never rehearsed.

> Senior tip: Present this answer as risk management, not as a data-copying exercise: "I write the reconciliation tool first, because the match rate is the only definition of done". Name the three numbers you track across every dry run: the UNEXPLAINED account count (must reach 0), the full-run duration versus the cut-over window, and the number of records dumped into the exception queue (must shrink). Add: after cut-over there is still a few-weeks "hypercare" phase, because migration bugs surface gradually as customers hit rare business flows.

> Terms: A dry run is executing the whole migration procedure on a copy of real data without serving customers, to measure duration and find discrepancies. EOD (end of day) is the end-of-day batch cycle, where balances and the ledger are locked for the day.

  `,
    follow: [
      'Why reconcile down to every account instead of only comparing total balances against the ledger?',
      'How do shadow write and offline replay differ in risk — which do you pick for which phase?',
      'On cut-over night, 3 UNEXPLAINED accounts worth 50,000 VND remain — what do you decide?'
    ]
  },

});
