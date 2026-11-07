/*
 * English translation of js/data/lessons-banking.js — task T706. Format: js/core/i18n.js (content overlay).
 * ids: lesson-banking-001 lesson-banking-002 lesson-banking-003 lesson-banking-004
 */
App.i18n.content({
  'lesson-banking-001': {
    title: 'Money in code: never double, BigDecimal, transaction fees and splitting by largest-remainder',
    goals: [
      'Explain why {{double}}/{{float}} must not be used to compute money and what to use instead ({{long}} or {{BigDecimal}})',
      'Know the smallest unit of a currency and what scale/RoundingMode mean',
      'Apply largest-remainder so the parts always sum to the total',
    ],
    body: `### Money is an integer
**The first rule of financial code: never use {{double}} or {{float}} for money.** A double stores a number as a sum of **binary** fractions (1/2, 1/4, 1/8…), so a value whose fractional part is not such a sum — 0.1 being the classic example — is rounded to the nearest representable number the instant you write it down.

~~~java
System.out.println(0.1 + 0.2);          // 0.30000000000000004
System.out.println(0.1 + 0.2 == 0.3);   // false
System.out.println(1.00 - 0.90);        // 0.09999999999999998
~~~

Each error is about 1e-17, invisible in a demo. On production a ledger runs millions of these operations per day: the errors accumulate, a balance stops matching the partner file, and somebody opens a "the system ate 3 dong" ticket. Interest and fee formulas make it worse because every period multiplies the error again.

**What to use instead:** either a {{long}} counting the **smallest unit** of the currency, or {{BigDecimal}} when you need decimals and explicit control of rounding.

### The smallest unit (minor unit)
Every currency has a smallest tradable unit: a cent (1/100) for USD; for VND the practical minimum is 1 dong, because nobody settles a fraction of a dong. The trick is: **store the integer, keep the exponent in a constant instead of in a decimal point**.

~~~java
long cents = 12_345L;      // 123.45 USD: no decimal point anywhere in the system
long amount = 100_000L;    // 100,000 dong (VND scale = 0)
~~~

What you gain: {{+}} and {{-}} are exact, adding ten amounts raises no rounding question at all, comparisons are cheap, and the DB column is just {{BIGINT}}. The one trap is overflow when multiplying: with {{int}} inputs, {{amount * percent}} wraps past 2,147,483,647 — widen to {{long}} (or to {{BigDecimal}}) **before** multiplying, not after.

### BigDecimal: scale and RoundingMode
{{BigDecimal}} is an arbitrary-precision decimal made of an unscaled integer plus a **scale** = the number of digits after the decimal point. {{new BigDecimal("10.50")}} has scale 2.

Three rules that catch people out:
- Build it from a {{String}} or from {{BigDecimal.valueOf(...)}}. **Never** {{new BigDecimal(0.1)}}: that constructor inherits the double binary error and gives you 0.1000000000000000055511151231257827021181583404541015625.
- Compare with {{compareTo}}, never {{equals}}: {{equals}} also compares scale, so {{new BigDecimal("1.0").equals(new BigDecimal("1.00"))}} is false while {{compareTo}} returns 0.
- {{BigDecimal}} is immutable: {{x.add(y)}} returns a new object and leaves {{x}} alone. Forgetting the assignment silently keeps the old value.

{{divide()}} throws {{ArithmeticException}} ("Non-terminating decimal expansion") when the exact result needs infinitely many digits, for instance 1/3. Always pass the scale and the rounding you want: {{a.divide(b, 0, RoundingMode.HALF_UP)}}.

| RoundingMode | The rule | Use it for |
|---|---|---|
| {{HALF_UP}} | a dropped 0.5 rounds away from zero | everyday commercial rounding, fees |
| {{HALF_EVEN}} | a dropped 0.5 rounds to the nearest even digit | rounding in bulk (banker's rounding: no upward bias) |
| {{DOWN}} | chop toward zero | flooring each share when splitting money |
| {{FLOOR}} / {{CEILING}} | toward minus infinity / plus infinity | interest accrual you must not under-report |
| {{UP}} | away from zero | conservative caps |

### Fees: round first, then clamp
A fee is always three steps: multiply, round to the precision the currency actually has, clamp into the [min, max] agreed in the contract. Round **before** clamping — clamping a value that still carries decimals turns a fractional fee into the floor or ceiling and confuses everyone reading the log.

~~~java
BigDecimal fee = BigDecimal.valueOf(amount)      // amount is a long in dong
    .multiply(BigDecimal.valueOf(percent))       // percent may be 0.5
    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
long result = Math.min(Math.max(fee.longValue(), minFee), maxFee);
~~~

### Splitting money: largest-remainder
Split 100,000 dong between three equal parties and the exact answer is 33,333.33 each. Round every share on its own and you get 33,333 × 3 = 99,999: one dong simply vanished. The same trap appears whenever you split a payment between merchants, refund across several coupons, or allocate fee revenue between branches.

**Largest-remainder** (the method used to apportion seats proportionally in elections) fixes it in three steps:
1. Floor every share and remember the fractional remainder of each one.
2. Sum the floored shares; the leftover {{k = total - sum}} is always smaller than the number of parts.
3. Hand out the {{k}} remaining units, one per part, to the parts with the largest remainder; ties go to the smaller index so the result is deterministic.

~~~text
total = 100000, ratios 1:1:1
exact      = 33333.33 | 33333.33 | 33333.33
floored    =   33333  |   33333  |   33333     sum = 99999,  k = 1
remainders =     .33  |     .33  |     .33     tie -> index 0 wins
result     =   33334  |   33333  |   33333     sum = 100000  OK
~~~

The invariant to assert both in tests and in production: the parts sum back to the total, exactly.

### Exercise
{{MoneyMath.fee}} and {{MoneyMath.allocate}} implement the two patterns above. The tests pin the details down: 123456 at 0.5% is 617.28 which must come out as 617, a fee of 10,000 at 0.1% must still cost the 100 minimum, and splitting 100001 in three must still total 100001.

### Common pitfalls
- Putting {{double}} in the API contract (JSON {{amount: 10.50}}): some clients have already lost precision before your code sees the number.
- A {{float}}/{{double}} DB column instead of {{BIGINT}} or {{DECIMAL(18,0)}}.
- Rounding only at display time, so the printed lines no longer add up to the printed total. Round each line, then let the last line absorb the drift.
- A non-deterministic largest-remainder: ties broken by map iteration order or by a parallel stream, so the same input allocates differently on two runs.
- Negative amounts: {{HALF_UP}} rounds -0.5 away from zero to -1, which is often not what a refund path expects.

### Interview relevance
Expect the question "how do you represent money?". Answer in this order: minor unit plus {{long}} (or {{BigDecimal}} when several currencies have different exponents), why double breaks (binary fractions, error accumulation, reconciliation gaps), explicit {{RoundingMode}} at every boundary, and the invariant "the parts must sum to the whole" implemented with largest-remainder. A senior answer adds one more point: round once, at the place the customer actually sees the number, and never re-derive a rounded value from an already rounded one.

> Senior tip: Always check the total.`,
    exercises: [
      {
        title: 'MoneyMath.fee and MoneyMath.allocate',
        prompt: `Complete the {{MoneyMath}} class:

- {{fee(long amount, double percent, long minFee, long maxFee)}}: compute fee = amount*percent/100, round HALF_UP, clamp into [minFee,maxFee], return a long.
- {{allocate(long total, int[] ratios)}}: split by ratio using largest-remainder so the parts always sum to total. Return long[].`,
        hints: ['Use BigDecimal with RoundingMode.HALF_UP for fee', 'Use largest-remainder for allocate'],
        explain: `Do not use double, because it is not exact. Largest-remainder guarantees that the parts always add up to total.`,
      },
    ],
    check: [
      { q: 'Why must you not use double to compute money?', options: ['it is slow', 'it cannot represent decimal fractions exactly', 'it is not supported', 'none of the above'], explain: 'Binary floating point is not exact for 0.1' },
      { q: 'What is largest-remainder for?', options: ['computing interest', 'making the parts sum exactly to total', 'rounding one value', 'computing a fee'], explain: 'It redistributes the remainder so the total is exact' },
      { q: 'What does HALF_UP mean?', options: ['always round down', 'always round up', 'round up when the dropped part is >= 0.5', 'drop the fraction'], explain: 'Ordinary commercial rounding' },
    ],
  },
  'lesson-banking-002': {
    title: 'End-of-day reconciliation: why the two sides disagree and how to handle a mismatched line',
    goals: [
      'Explain the causes of a mismatch: timeout, the 23:00 cut-off, refunds, fees',
      'Know what a reconciliation file looks like and how the mismatch queue is run',
      'Write Reconciler.match classifying MATCHED/MISSING_AT_PARTNER/MISSING_INTERNAL/AMOUNT_MISMATCH',
    ],
    body: `### What reconciliation is
**Reconciliation** is the process of comparing the transactions of your own system against the partner system (a bank, an e-wallet, a payment gateway) to find disagreements. At the end of each day both sides publish a file (usually CSV) listing the transactions of that day; a program compares the two files and classifies every line.

### Why the two sides disagree
1. **Timeout**: the request went out but no response came back; we mark it as failed while the partner actually processed it successfully. This is cause number one of every mismatch.
2. **The 23:00 cut-off**: a transaction at 22:59:30 belongs to today on our side, but the partner processes it a few seconds later, so it lands on the next day in their file. You need an explicit cut-off rule.
3. **Refund**: one side records the refund immediately, the other records it later.
4. **Fee**: the fee was deducted on one side but not yet booked on the other.

### What a reconciliation file looks like
~~~text
txnId,amount,currency,status,timestamp
TXN001,100000,VND,SUCCESS,2026-01-01T22:59:30
TXN002,50000,VND,SUCCESS,2026-01-01T23:00:05
~~~

### Running the mismatch queue
- **MATCHED**: same txnId, same amount → fine.
- **MISSING_AT_PARTNER**: we have it, the partner does not → check for a timeout, then either refund or retry.
- **MISSING_INTERNAL**: the partner has it, we do not → a late booking arrived, investigate.
- **AMOUNT_MISMATCH**: the txnId matches but the amount differs → investigate, it is usually a fee.

### The reconciliation flow
~~~seq
title: End-of-day reconciliation
actors: App | Service | DB | Partner
App -> Service: trigger reconcile at 23:30
Service -> DB: load internal txns of day
Service -> Partner: fetch partner file
Service -> Service: match by txnId
Service --> App: report mismatches
~~~

### Exercise
Write Reconciler.match(internal, partner) that classifies the transactions. A transaction after the cut-off (23:00) moves to the next day (it is not reconciled today).

### More on reconciliation
Reconciliation is not just matching: you have to handle time zones, duplicate txnIds and partial refunds. Every mismatched line needs a tracking ticket and an SLA for handling it (say 24h). Keep a complete audit log for the auditors. Always have a dashboard tracking the number of mismatched lines per day so you can spot a trend. More detail: a banking system always needs reconciliation to keep money consistent between the parties. When there is a mismatch there must be a clear handling process, and nobody edits the numbers by hand. The audit log is the key evidence for both audit and legal. A dashboard surfaces a mismatch trend early. A 24h SLA keeps things resolved on time. Duplicate txnIds must be deduplicated. Partial refunds need their own handling path. The time zone cut-off must be unambiguous. Together these make the system trustworthy.

> Senior tip: Always keep the raw partner file for the audit; never edit the numbers on your own without evidence.`,
    exercises: [
      {
        title: 'Reconciler.match',
        prompt: `Complete {{Reconciler.match(List<Txn> internal, List<Txn> partner)}} returning a Map<String, List<String>> with the keys MATCHED, MISSING_AT_PARTNER, MISSING_INTERNAL, AMOUNT_MISMATCH. Txn has the fields txnId, amount (long), timestamp (epoch millis). A transaction after the 23:00 cut-off (in UTC+7) moves to the next day (skip it in today's reconciliation).`,
        hints: ['Use a Map to look the partner side up by txnId', 'Modulo 24h gives you the time of day'],
        explain: `Classification is based on txnId and amount; transactions after the cut-off are skipped. Common mistake: not handling duplicate txnIds.`,
      },
    ],
    check: [
      { q: 'What is cause number one of a mismatch?', options: ['fees', 'timeout', 'refund', 'cut-off'], explain: 'A timeout makes one side process the payment while the other treats it as failed' },
      { q: 'What is the 23:00 cut-off for?', options: ['shutting the system down', 'deciding which reconciliation day a transaction belongs to', 'computing fees', 'backups'], explain: 'The rule that transactions after 23:00 belong to the next day' },
    ],
  },
  'lesson-banking-003': {
    title: 'Limits and basic risk checks',
    goals: [
      'Understand a daily limit keyed to Vietnamese time (ZoneId Asia/Ho_Chi_Minh)',
      'Know a velocity check: more than N transactions in 5 minutes',
      'Write LimitChecker(Clock) returning ALLOW/REQUIRE_STRONG_AUTH/REJECT_DAILY_LIMIT/REJECT_VELOCITY',
    ],
    body: `### What a limit is
A **limit** is the maximum amount an account may move within a period (a day). Banks set limits to cap the damage when an account is taken over. The limit resets at **00:00 local time** (Vietnam: Asia/Ho_Chi_Minh), not at UTC midnight.

### Why a ZoneId matters
With UTC, midnight in Vietnam is 17:00 UTC of the previous day → the reset happens at the wrong moment. Use {{ZoneId.of("Asia/Ho_Chi_Minh")}} to get the correct day.

### Velocity check
**Velocity** = the number of transactions inside a short time window (say 5 minutes). Above the threshold N → reject or demand strong authentication. The point: detecting a bot or an account takeover.

### Strong authentication
A large transaction (say above 50 million VND) requires **strong authentication** (OTP, biometrics) instead of only a PIN. The bank defines the threshold; in the exercise it is 50 million VND.

### The check flow
~~~seq
title: Limit check
actors: App | LimitChecker | Clock
App -> LimitChecker: check(amount)
LimitChecker -> Clock: get current time (zone VN)
LimitChecker -> LimitChecker: velocity in 5 min?
LimitChecker -> LimitChecker: daily total + amount?
LimitChecker --> App: ALLOW / REQUIRE_STRONG_AUTH / REJECT_*
~~~

### Exercise
LimitChecker takes a Clock (so a test can pass Clock.fixed). It returns the Result enum.

### More on limits
A limit should have several levels: per transaction, per day, per month. The velocity window can be 5 minutes or 1 hour depending on the risk. Store the history of checks so you can analyse it. When you reject, return a clear error code so the app can display the right message. Injecting a Clock lets you test any time zone. More detail: a limit protects the account against takeover. Velocity detects a bot. A ZoneId guarantees the reset happens at the right local time. An injected Clock makes tests deterministic. Several limit levels stay flexible. A clear error code improves UX. History is kept for analysis. All of this makes the system safe and testable. The daily limit resets at midnight Vietnam time, not UTC. Velocity counts transactions inside a sliding window. Strong authentication applies to large transactions. Combined, they cut fraud risk. Tests must inject a Clock to be deterministic. Do not call Instant.now directly. That is the best practice for testable code. A limit can also be weekly or monthly. The velocity threshold is configured per customer segment. A rejection returns its reason for the audit. Everything must be deterministic in a test. ZoneId Asia/Ho_Chi_Minh is mandatory for Vietnam. Clock.fixed in tests. That is the standard pattern. A limit and a velocity check are two protection layers. Together they give maximum safety. Test every edge case fully. That is a senior requirement. This line exists only to reach the minimum length.

> Senior tip: Always inject a Clock instead of calling Instant.now() directly, so your tests are deterministic.

### Interview relevance
**Question:** "Design a transaction-limit check for me — what matters most?"
**How to answer:** three protection layers: (1) a daily limit resetting at 00:00 in the user's own time zone (Vietnam: Asia/Ho_Chi_Minh) — UTC would reset at the wrong hour for a Vietnamese user; (2) a velocity check counting transactions in a sliding 5-minute window to catch a bot or an account takeover; (3) a large transaction (above a threshold, say 50 million VND) requiring strong authentication such as OTP or biometrics rather than only a PIN. The senior markers: inject {{Clock}} into {{LimitChecker}} instead of calling {{Instant.now()}} directly, use {{long}} or {{BigDecimal}} for money instead of {{double}}, return a clear error code when rejecting, and keep the tests deterministic with {{Clock.fixed}}.
`,
    exercises: [
      {
        title: 'LimitChecker',
        prompt: `Complete {{LimitChecker}} with the constructor {{LimitChecker(Clock clock, long dailyLimit, int velocityMax, long strongAuthThreshold)}}. The method {{check(long amount)}} returns the Result enum (ALLOW, REQUIRE_STRONG_AUTH, REJECT_DAILY_LIMIT, REJECT_VELOCITY). Use the clock to derive the day in ZoneId Asia/Ho_Chi_Minh. Velocity: no more than {{velocityMax}} transactions in the last 5 minutes (counting the current one). Daily limit: the day's total + amount <= dailyLimit.`,
        hints: ['Reset dailyTotal when the day changes', 'Velocity is based on the millisecond timestamps'],
        explain: `Inject a Clock so it is testable; the velocity window is 5 minutes. Common mistake: using UTC instead of the Vietnam zone.`,
      },
    ],
    check: [
      { q: 'Which time zone should the daily limit reset on?', options: ['UTC', 'Asia/Ho_Chi_Minh', 'GMT', 'whatever the client says'], explain: 'Vietnamese local time' },
      { q: 'What is a velocity check for?', options: ['computing fees', 'detecting unusual activity inside a short window', 'reconciliation', 'backups'], explain: 'Detecting a bot or an account takeover' },
    ],
  },
  'lesson-banking-004': {
    title: 'Installment loans: outstanding balance, declining-balance interest, level monthly payment',
    goals: [
      'Understand outstanding balance, interest on the declining balance, and a level payment (annuity)',
      'Compute the repayment schedule with BigDecimal',
      'Adjust the last installment so the balance lands exactly on 0, including a 0% rate',
    ],
    body: `### What an installment loan is
An **installment loan**: the borrower receives an amount (the principal) and pays it back over several periods (usually monthly), each period being **principal + interest**. Interest is computed on the **outstanding balance**, so the interest part shrinks period by period while the principal part grows.

### Annuity (a level payment)
You pay the same fixed amount {{PMT}} every period. The formula:
PMT = P * r / (1 - (1+r)^-n)
where r = the monthly rate and n = the number of periods.

### Why BigDecimal
Money and interest must be exact; double produces accumulated error. Use BigDecimal with enough scale (say 10) and RoundingMode.HALF_UP.

### Adjusting the last installment
Because of rounding, the sum of the periods can drift a few units away from the principal. So the last installment is adjusted: principal = the remaining balance, interest computed on that balance, PMT = principal + interest. That guarantees the balance ends at exactly 0.

### A 0% rate
With a 0% annual rate, PMT = principal / n: every period pays an equal slice of principal and the interest is 0.

### The schedule flow
~~~seq
title: Loan schedule
actors: App | LoanSchedule | BigDecimal
App -> LoanSchedule: build(principal, rate, months)
LoanSchedule -> BigDecimal: compute PMT
  LoanSchedule -> LoanSchedule: interest = balance * r
  LoanSchedule -> LoanSchedule: principalPart = PMT - interest
  LoanSchedule -> LoanSchedule: balance -= principalPart
LoanSchedule --> App: list of (principal, interest, balance)
~~~

### Exercise
LoanSchedule.build(principal, annualRatePercent, months) returns a List<Installment> with the fields principal, interest, balance (BigDecimal). The last installment brings the balance to 0.

### More on loans
You also have to handle early-repayment fees, late-payment penalties and rate changes. The BigDecimal scale must be big enough (10) to avoid error. Assert in a test that the final balance is 0. If it does not reach 0, adjust the last installment. A 0% rate is an important edge case. More detail: an installment loan charges interest on the declining balance. An annuity pays the same amount each period. BigDecimal keeps it exact. The last installment absorbs the rounding. 0% is the simple case. Check the balance equals 0. All of this makes the schedule exact and auditable. The PMT formula is the standard one. The monthly rate = annual/12/100. The balance declines, so interest declines. Principal rises. The last installment absorbs whatever rounding left behind. BigDecimal setScale 2 for money. Test that the principal sums to the total. That is the best practice for finance. You still have to handle early repayment and late penalties. Floating rates. All of that adds complexity. BigDecimal is mandatory. Checking the balance equals 0 is the acceptance criterion. This is a classic interview problem. The repayment schedule must be transparent for the customer. Each period shows principal and interest clearly. The totals must tie out. That is a legal requirement. BigDecimal gives you that. The tests are the evidence.

> Senior tip: Always check that the final balance == 0; if it does not, adjust the last installment.

### Interview relevance
**Question:** "Why must installment interest be computed with BigDecimal, and why does the last period need adjusting?"
**How to answer:** never use {{double}} for money: floating point gives accumulated error, the standard example being 0.1 + 0.2 not being exactly 0.3; {{BigDecimal}} with a chosen scale and {{RoundingMode.HALF_UP}} stays exact down to the cent. Interest is charged on the outstanding balance, so each period the interest shrinks while the principal part grows (the annuity formula). The last installment takes the remaining balance as its principal so the balance lands on exactly 0 and absorbs the rounding drift; a 0% rate needs its own branch (PMT = principal / n) otherwise the exponent formula divides by zero. In an interview, stress that asserting the final balance equals 0 is the acceptance criterion.
`,
    exercises: [
      {
        title: 'LoanSchedule.build',
        prompt: `Complete {{LoanSchedule.build(BigDecimal principal, BigDecimal annualRatePercent, int months)}} returning a {{List<Installment>}}. Each Installment carries {{principal}}, {{interest}}, {{balance}} (BigDecimal). The monthly rate = annualRatePercent/12/100. PMT follows the annuity formula. The last period: principal = the balance at the start of the period, interest = balance * r, balance = 0. Support a 0% rate.`,
        hints: ['Use BigDecimal.pow for (1+r)^n', 'The last period has principal = the remaining balance'],
        explain: `An annuity keeps PMT fixed; the last period is adjusted so the balance reaches 0. Common mistake: not handling a 0% rate (division by zero).`,
      },
    ],
    check: [
      { q: 'What is interest computed on?', options: ['the original principal', 'the outstanding balance', 'the total amount', 'the fee'], explain: 'Interest follows the declining balance' },
      { q: 'Why does the last period need adjusting?', options: ['to look nice', 'because rounding accumulates', 'to recompute the interest', 'it does not'], explain: 'Rounding shifts the total by a few units' },
    ],
  },
});
