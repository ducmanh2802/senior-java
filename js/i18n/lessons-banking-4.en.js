/*
 * English translation of js/data/lessons-banking.js — task T1037. Format: js/core/i18n.js (content overlay).
 * ids: lesson-banking-007
 */
App.i18n.content({
  'lesson-banking-007': {
    title: 'Available balance and holds: authorization, partial capture, release and BigDecimal rounding',
    goals: [
      'Tell ledger balance apart from available balance and why the app must show both',
      'Describe the lifecycle of a hold: authorise → capture (possibly less than the held amount) / release / expiry, and when the locked money is released',
      'Use BigDecimal correctly for VND money: build from a string, setScale(0, RoundingMode), round once at the boundary, compare with compareTo',
      'Write a {{HoldLedger}} class with {{authorise}}, {{capture}}, {{release}}, {{availableBalance}}, {{ledgerBalance}} satisfying the invariants above',
    ],
    body: `### A real story: "my account still has 12 million but I can only spend 8 million"

Miss Lan swipes her card at a hotel, estimated bill 300,000 VND per night. The receptionist says: "We hold 4,000,000 VND in case you use the minibar; we only settle the real amount when you check out." The bank sends an SMS: "You just paid 4,000,000 VND." Miss Lan opens the app: **Balance: 12,000,000 VND**, **Available balance: 8,000,000 VND**. Nobody charged her twice and nobody displayed a wrong number — the two figures just answer two different questions. This lesson teaches how to code those two figures and why VND money with odd cents forces you to use BigDecimal.

### Two numbers for one account

- **Ledger balance**: money **already settled**. It only changes on a real entry (money in/out that has settled). This is the legal figure: used for statements, end-of-day reconciliation (lesson 2) and the double-entry ledger (lesson 5).
- **Available balance** = ledger balance − **total money currently on hold**. This is the "how much can you still spend" figure, and it is what decides whether a new transaction is accepted.

A **hold (authorization)** is a promise from the bank to the merchant: "this account has X dong, I lock X, do not let that part be spent." The money stays in the account and goes nowhere.

Everyday analogy: a parking lot reserves a spot for you over the phone. That spot shows as "taken" on the board (available drops), but you have not paid yet (ledger unchanged). If the lot recorded "paid" the moment it reserved, every change of mind would need a refund — one more money movement, one more chance for a mismatch.

Progression in the example above:

| Time | Ledger balance | Open hold | Available |
|---|---|---|---|
| Start of day | 12,000,000 | 0 | 12,000,000 |
| Hotel holds 4,000,000 | 12,000,000 | 4,000,000 | 8,000,000 |
| Miss Lan buys a book online 200,000 (charged now) | 11,800,000 | 4,000,000 | 7,800,000 |
| Hotel settles real 3,000,000, releases 1,000,000 | 8,800,000 | 0 | 8,800,000 |

The first and fourth rows show the most common mistake: **a hold does not change the ledger balance**, it only locks part of the available balance.

### Why card business forces a two-phase design

When a card is swiped, three things happen at three different times:

1. **Authorization** — within about 1 second: the merchant asks "does this account have 4 million?", the bank answers yes/no and creates a hold. The merchant needs the answer **immediately** to print the receipt and run the terminal; otherwise the customer walks away.
2. **Capture / settlement** — usually **end of day**, run in **batches**: the merchant groups hundreds of transactions into one file sent to the card network, and only then does the bank really move the money. The real amount can **differ** from the held amount: the hotel only uses 3,000,000, the restaurant adds 5% **tip**, the gas station charges less than locked.
3. **Chargeback** — money goes back the other way plus a penalty fee. Dispute handling is covered in lesson 6.

Because capture arrives **late** and is **often smaller** than the held amount, code must support **partial capture** (settling part) and **auto-releasing the difference**. Forgetting the release is the classic bug: hold 4,000,000, capture 3,000,000, the remaining 1,000,000 stays locked forever. The customer calls support asking "where is my money", and operations must release holds by hand.

Four verbs of a hold:

| Verb | Business meaning | Ledger | Hold | Available |
|---|---|---|---|---|
| {{authorise}} | lock money, nothing spent yet | unchanged | open +amount | −amount |
| {{capture}} | settle the real amount (≤ held) | −actual | close, auto-release the difference | equals ledger |
| {{release}} | cancel the promise, spend nothing | unchanged | close | +amount |
| expiry | automatic {{release}} after N days | unchanged | close | +amount |

### BigDecimal: why money with odd cents needs it

**BigDecimal** represents a decimal number **exactly**, as two parts: an integer ({{unscaledValue}}) and the number of digits after the decimal point ({{scale}}). 1234.56 is stored as 123456 with scale 2, so there is no binary rounding.

~~~java
BigDecimal a = new BigDecimal("0.1");      // built FROM A STRING
BigDecimal b = new BigDecimal("0.2");
System.out.println(a.add(b));              // 0.3  -> exact
System.out.println(0.1 + 0.2 == 0.3);      // false -> binary floating point cannot represent 0.1
~~~

> Note: {{new BigDecimal("0.1")}} is completely different from {{new BigDecimal(0.1)}}. The latter takes a {{double}} and bakes its binary noise straight into your arithmetic (0.1000000000000000055511151231257827021181583488...). You think you are using BigDecimal but you are still using double. Always initialize **from a string**, or use {{BigDecimal.valueOf(double)}} (which goes through the string, so it is safe).

**Scale and rounding**: {{setScale(n, RoundingMode)}} returns a **new** number with n decimal places (BigDecimal is immutable — no method mutates the original). Common modes:

| RoundingMode | 0.5 becomes | Use when |
|---|---|---|
| {{HALF_UP}} | 1 | rounding money for customers by the "4 down, 5 up" rule (0–4 down, 5–9 up) — the standard in Vietnam |
| {{HALF_EVEN}} | 0 | computing interest over millions of records: round to the nearest even digit so error does not accumulate one way |
| {{DOWN}} | 0 | splitting money by ratio, so the allocated parts never exceed the total (lesson 1) |
| {{UP}} | 1 | computing the maximum number of repayment periods: better a little extra than a shortfall |
| {{FLOOR}} / {{CEILING}} | 0 / 1 | when the constraint is "must not go negative" / "must be enough" |

**VND specifics**: in payments, Vietnamese dong has no sub-unit smaller than 1 dong. Therefore every stored and displayed amount **must have scale 0**. Balances, holds and fees are whole dong; fractional parts only arise temporarily while computing fees or exchange rates.

**Round at the boundary, not along the way.** If you round at every intermediate step and then sum, errors accumulate: 1,000 transactions each off by 0.5 dong is 500 dong evaporated, and 500 dong is exactly one break line that must be explained during end-of-day reconciliation (lesson 2). Safe approach: compute with high scale (8–10 digits), then {{setScale(0, HALF_UP)}} **once** when writing to the ledger or showing to the customer.

**The equals trap**: BigDecimal compares both value and scale, so two amounts equal in money but written differently surprise you.

~~~java
new BigDecimal("1.0").equals(new BigDecimal("1.00"));    // false, because scale differs
new BigDecimal("1.0").compareTo(new BigDecimal("1.00")); // 0, equal in value
~~~

So every money comparison uses {{compareTo}}, never {{equals}}. "Is there enough money?" is {{available.compareTo(amount) >= 0}}, and {{signum()}} (the sign of the number) is the concise way to tell negative/positive/zero.

### Four invariants of the hold ledger

1. **Cannot spend what is held**: {{authorise}} only succeeds when available balance is enough; otherwise reject and **write nothing** (same principle as lesson 5).
2. **Capture cannot exceed the promise**: {{capture}} larger than the held amount must be rejected. The card scheme allows a small overage (tip), but that must be an explicit, configured business rule — not a side effect of forgetting the check.
3. **Each holdId closes only once**: a second capture or release is a no-op returning {{false}}. This is idempotency (lessons 5 and 6) — the card infrastructure resends settlement files many times.
4. **Available balance is always derivable**: {{available = ledger − sum of open holds}}. It is a **derived** value, not source data.

### Lifecycle of a card swipe

~~~seq
title: Card swipe: hold today, settle tomorrow
actors: App | Hotel | CardScheme | HoldLedger
App -> Hotel: bill 300,000, receptionist holds 4,000,000
Hotel -> CardScheme: authorization holdId H1 amount 4,000,000
CardScheme -> HoldLedger: authorise(H1, CA/lan, 4,000,000)
HoldLedger -> HoldLedger: is 12,000,000 available enough?
HoldLedger --> CardScheme: OK, available now 8,000,000
CardScheme --> Hotel: approved, print receipt for guest
note HoldLedger: ledger balance still 12,000,000
Hotel -> CardScheme: end-of-day settlement: real 3,000,000
CardScheme -> HoldLedger: capture(H1, 3,000,000)
HoldLedger -> HoldLedger: ledger now 8,800,000, close H1, release 1,000,000
HoldLedger --> App: SMS hotel settled 3,000,000
~~~

### Common production mistakes

1. **Showing only one number** (usually the ledger balance) ⇒ the customer spends money already promised to the hotel; the second transaction is rejected even though the app just said "enough funds".
2. **No hold-expiry job** ⇒ money locked for days or weeks. A hold must always carry an expiry date and the app must state "will be released after X days".
3. **Partial capture without releasing the difference** ⇒ ghost holds stay forever; this is the #1 complaint source in hotels and car rental.
4. **Charging at authorise time**, then settling again ⇒ double charge. Same root cause as duplicate callbacks in lesson 6: one business fact must be recorded once.
5. **Using {{double}} for money**, or **comparing money with {{equals}}**.
6. **Rounding at every computation step** ⇒ the total no longer matches what the customer was charged, and that gap leaks into end-of-day reconciliation.
7. **Storing an available-balance column in the account table** ⇒ after one broken transaction it drifts from (ledger − holds). A nightly "rebuild available balance" job is not a fix; it is evidence of a design flaw.

> Senior tip: Set a **hold limit** by merchant category (hotels and car rental may hold several times the estimated bill, restaurants may not), and always print **three figures** on the statement: ledger balance, total open holds, available balance — plus a list of "transactions pending settlement" with merchant name and expiry date. When the customer asks "why do I have 12 million but can only spend 8 million?", the answer must be visible on screen, with no call to support needed.

### Interview link

**Question:** "A card swipe shows as charged in the app but the statement does not show the money gone yet. How do you design balances?"
**Answer:** State immediately that an account has **two balances**: ledger balance (settled money, used for statements and reconciliation) and available balance (ledger minus open holds, used to decide new transactions). A card swipe is **two phases**: authorization creates a hold to lock money within 1 second for the merchant, settlement at end of day really moves the money, and the settled amount can be smaller than the held amount (hotel, minibar, tip) so {{capture}} must accept the **real amount** and **auto-release the difference**; plus a hold-expiry job so money is never locked forever. On the arithmetic: use {{BigDecimal}} built from a string, {{setScale(0, RoundingMode.HALF_UP)}} for VND, round only once at the boundary when writing to the ledger, compare with {{compareTo}} because {{equals}} compares scale too. Senior points: do not store the available balance as a column but derive it, use holdId as an idempotency key so a resent settlement file does not settle twice, and reject a capture that exceeds the held amount unless there is an explicit, configured business rule.`,
    exercises: [
      {
        title: 'HoldLedger: authorise / capture / release with BigDecimal',
        prompt: `Write a {{HoldLedger}} class managing the **ledger balance** and the **currently open holds** for a payer-side account. Money uses {{BigDecimal}}, in VND dong.

Mandatory rules:

1. **Every incoming amount is normalized to scale 0 using {{setScale(0, RoundingMode.HALF_UP)}}** right at the boundary ({{deposit}}, {{authorise}}, {{capture}}). {{ledgerBalance}} and {{availableBalance}} also return numbers with scale 0. An account with no transactions has balance 0.
2. {{deposit(account, amount)}}: if {{amount}} is negative after rounding ⇒ throw {{IllegalArgumentException}}; otherwise add to the ledger balance.
3. {{authorise(holdId, account, amount)}}: if {{amount}} rounds to 0 or negative ⇒ throw {{IllegalArgumentException}}. If the held money **would exceed the available balance** ⇒ not enough, throw {{IllegalStateException}} and **write nothing**. If {{holdId}} already exists (open **or** previously closed) ⇒ no-op returning {{false}}, changing nothing. On success ⇒ open the hold, return {{true}}. A hold does not change the ledger balance.
4. {{capture(holdId, actual)}}: if {{actual}} rounds to a negative ⇒ throw {{IllegalArgumentException}}. If {{holdId}} never existed ⇒ throw {{IllegalArgumentException}}. If the hold is already closed ⇒ no-op returning {{false}}. If {{actual}} is larger than the held amount ⇒ throw {{IllegalArgumentException}} and the hold **stays open**. Otherwise: subtract {{actual}} from the ledger balance, close the hold (the difference between held and {{actual}} is naturally released), return {{true}}.
5. {{release(holdId)}}: never existed ⇒ throw {{IllegalArgumentException}}; already closed ⇒ return {{false}}; open ⇒ close it, **ledger balance unchanged**, return {{true}}.
6. {{availableBalance(account)}} = {{ledgerBalance(account)}} minus the sum of **open** holds for that account.

Suggested layout: three data structures — a map of ledger balances, a map of open holds ({{holdId}} → {"account, amount"}), and a set of {{holdId}} already closed. Write a separate rounding function and call it at every entry point.`,
        hints: [
          'Write a dedicated {{vnd(BigDecimal)}} function that does {{setScale(0, RoundingMode.HALF_UP)}} and call it at the **entry point** of every method that takes money — that way returned balances always have scale 0 without fixing them at the end.',
          'Do not compare money with {{equals}} and do not compare BigDecimal produced by division: use {{compareTo}} (returns 0 when two values are equal) and {{signum()}} (negative/positive/zero).',
          '{{authorise}} must check {{availableBalance(account).compareTo(v) < 0}} **before** writing the hold; checking after writing leaves a ghost hold when rejected.',
          '{{capture}} must distinguish three cases: holdId never seen (throw), holdId **already closed** (no-op {{false}}), holdId open (settle). So you must remember the set of closed holdIds, not delete them on close.',
          'The difference on a partial capture **needs no add/subtract**: just remove the open hold, because {{availableBalance}} is recomputed as ledger minus sum of open holds.',
        ],
        explain: `Four things the tests check individually, and four things an interviewer wants to hear:

1. **Holds do not touch the ledger balance.** After {{authorise("H1", "CA/lan", 4,000,000)}}, {{ledgerBalance}} is still 12,000,000 but {{availableBalance}} is 8,000,000. Money only really leaves on {{capture}}.
2. **Round once, at the boundary.** 3,000,000.4 becomes 3,000,000 ({{HALF_UP}} drops when the fractional digit is 4), 1,999,999.5 becomes 2,000,000 (5 rounds up). That is why the two holds of {{CA/vi}} sum to exactly 800,000 and each {{capture}} matches its hold exactly — if we rounded *after* holding the fractional amount, the two paths "400,000.5" and "399,999.6" would yield different balances and settlement would not match.
3. **{{capture}} smaller than the held amount auto-releases the difference.** Hotel holds 4,000,000 and settles 3,000,000: ledger drops by 3,000,000, hold closes, 1,000,000 is no longer locked. No separate {{release}} call is needed — which is why {{release}} and {{capture}} **both mark the hold as closed** in the {{closedHolds}} set.
4. **{{holdId}} is used only once, even on retry.** A second {{capture}} returns {{false}} and charges nothing extra; {{authorise}} again with the same {{holdId}} after the hold is closed also returns {{false}}. This idempotency protects the system from a settlement file being sent twice (see lessons 5 and 6).

The most common mistake when writing this is **forgetting the closed-holds set** and keeping only the open-holds map: then a second {{capture("H1")}} becomes "holdId not found" ⇒ throws {{IllegalArgumentException}} instead of being a no-op, and the merchant's app retries forever. Second mistake: returning an **unrounded** balance (e.g. 3000000.4) — the {{scale}} test catches it immediately. Third mistake: allowing {{capture}} to exceed the held amount "for flexibility": the card scheme allows that within a small configured percentage, but by default it must be rejected, because spending more than was locked means spending more than was promised.`,
      },
    ],
    check: [
      { q: 'What is the difference between ledger balance and available balance?', options: ['There is no difference, just two names', 'Ledger subtracts holds twice, available once', 'Available is money already paid to the merchant, ledger is what remains', 'Ledger is settled money; available equals ledger minus total open holds'], answer: 3, explain: 'A hold only locks money, it does not move it. Money leaves the ledger at the capture/settlement step, so available = ledger − open holds' },
      { q: 'A hotel holds 4,000,000 VND but settles only 3,000,000 VND. What must the system do?', options: ['Settle 3,000,000 and keep the 4,000,000 hold in case of later charges', 'Settle 4,000,000 because that was promised to the merchant', 'Settle 3,000,000, close the hold and auto-release 1,000,000 to the customer', 'Wait for the customer to call support to release the money'], answer: 2, explain: 'Partial capture is the industry standard for cards; forgetting to release the difference is the #1 complaint source in hotels and car rental' },
      { q: 'Why must money be compared with compareTo instead of equals on BigDecimal?', options: ['compareTo is faster because it allocates no memory', 'equals compares both value and scale, so "1.0" is not equals to "1.00" even though the money is the same', 'compareTo rounds for you so setScale is unnecessary', 'equals only works for integers'], answer: 1, explain: 'BigDecimal carries precision (scale). equals means "value + representation"; to compare money you must use compareTo' },
      { q: 'Why round only once, at write time or display time?', options: ['Because setScale is slow', 'Because rounding many times changes the scale', 'Because BigDecimal forbids rounding twice', 'Because per-step error accumulates into real money loss that breaks reconciliation'], answer: 3, explain: '1,000 steps off by 0.5 dong is 500 dong evaporated — enough to create a break line that must be explained during end-of-day reconciliation' },
    ],
  },
});
