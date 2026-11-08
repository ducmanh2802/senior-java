/*
 * English translation of js/data/lessons-banking.js — task T707. Format: js/core/i18n.js (content overlay).
 * ids: lesson-banking-005
 */
App.i18n.content({
  'lesson-banking-005': {
    title: 'The double-entry ledger: debit/credit entries, balanced transactions, append-only, and refunds by reversal',
    goals: [
      'Explain what double-entry bookkeeping is and why every transaction must have total debits equal to total credits',
      'Compute a balance as the sum of entries instead of a stored number, and why the ledger may only be appended to (append-only)',
      'Use txId as the idempotency key so a retry never creates money a second time, and refund with a reversal entry',
      'Write a {{Ledger}} class with {{post}}, {{balance}} and {{reverse}} that satisfies the invariants above',
    ],
    body: `### A true story: "the money was deducted but the app showed an error"

Lan transfers 100,000 dong to Minh. The app spins and then reports "Connection timeout". She reopens it: her account **has already been debited 101,100 dong** (100,000 transferred + 1,100 fee), while Minh sees nothing yet. Three questions arise: where is the money right now, who is holding it, and if we refund it, how do we book it without losing the trail?

If each account stores just one number {{balance}} and the code does {{balance = balance - 101100}}, then after the incident **nobody can prove** where the figure 48,900 came from: the UPDATE statement already overwrote the evidence. A **double-entry ledger** guards against this with one principle: **never treat the balance as the source data**. Store only **entries** — each entry records one movement of money in or out — and let the balance be the **sum of the entries**.

Everyday analogy: two people lend each other money but only one of them keeps a notebook — sooner or later they will argue. Double-entry bookkeeping requires **every dong to be written twice**: once as "going out" (**Debit / Nợ**) and once as "coming in" (**Credit / Có**), in two different accounts, inside **the same transaction**. No money ever "flies" through mid-air.

### Debit and credit: from the bank's side, not yours

**Definition**: a *debit* is an entry recording money **leaving** that account; a *credit* is an entry recording money **entering** that account (the convention used in this lesson, aligned with the direction of a customer's balance).

> Note: accounting textbooks say "customer deposits are credits on the bank's balance sheet" because **the bank owes you money** — your account is a *liability* of the bank. Don't try to memorize "is a Debit good or bad": remember the convention of the system you are working on and write it down clearly in the docs. What matters is that conventions stay **consistent across the whole system**.

### Example table: Lan transfers 100,000 dong to Minh, fee 1,100 dong

| txId | Account | Debit (out) | Credit (in) |
|---|---|---|---|
| T1 | CA/lan (customer) | 101,100 | |
| T1 | CA/minh (customer) | | 100,000 |
| T1 | SYS/fee (internal) | | 1,100 |
| **Total** | | **101,100** | **101,100** |

Total debits equal total credits — that is a **balanced transaction**. If the two columns differ by a single dong, either the math is wrong or somebody skimmed money: the system must **refuse to book it** right there, throw {{IllegalArgumentException}}, not "record it for now and reconcile later".

In code, one transaction is a list of entries, and the txId sits outside as the name:

~~~java
// T1: Lan transfers 100,000 dong to Minh, fee 1,100 dong — three entries, one transaction
List<Entry> t1 = List.of(
    new Entry("CA/lan",  101_100, true),    // Debit: money leaves Lan's wallet (fee included)
    new Entry("CA/minh", 100_000, false),   // Credit: money lands in Minh's account
    new Entry("SYS/fee",   1_100, false)    // Credit: the 1,100 dong fee becomes bank revenue
);
// total debits 101,100 == total credits 101,100  =>  balanced  =>  ledger.post("T1", t1) accepts it
~~~

### Customer accounts and internal accounts

Every ledger has two kinds of accounts:
- **Customer accounts** ({{CA/...}}): wallets, payment accounts. **They must not go negative**, because a negative balance means the bank lent beyond the approved limit. A posting that drives one negative ⇒ {{IllegalStateException}}.
- **Internal / suspense accounts** ({{SYS/...}}): fees, the pending-reconciliation account (suspense), opening balances. **They may go negative**, because they reflect the bank's own cash flow, not some depositor's money.

Looking at the table above: if you had only Lan and Minh, total debits 101,100 ≠ total credits 100,000 — 1,100 would be missing. The {{SYS/fee}} account is exactly the "place" for that 1,100 dong. This is why double-entry is mandatory: **every dong must have an owner at every moment**, even while it is in transit.

### Balance = sum of entries

The only formula: {{balance(acc) = sum(credits) - sum(debits)}} over every entry of that account. Because the balance is **derived** from entries, you can always rebuild it for verification, and an end-of-day check comparing "the balance the app displays" against "the sum of entries" instantly catches anyone editing by hand. In code people still keep a running balance for speed, but it is only a **cache** of the sum, never the source of truth.

### Append-only: no UPDATE, no DELETE

The ledger only **appends**. To fix a mistake you **add a new entry**, you never delete the old one. Reasons:
1. **Audit evidence**: banks get inspected; you must answer "how was this balance formed, by which transactions, at what time, by whom".
2. **No overwrite races**: two threads adding/subtracting the same number lose money; appending rows does not conflict.
3. **History is never lost**: a complaint filed two years later is still traceable.

### A refund = a reversal entry, not a deletion

To refund transaction T1, post a new transaction {{T1:R}} with **the debits/credits flipped**:

| txId | Account | Debit | Credit |
|---|---|---|---|
| T1:R | CA/lan | | 101,100 |
| T1:R | CA/minh | 100,000 | |
| T1:R | SYS/fee | 1,100 | |

After T1 and T1:R the balances return to where they were, but **the ledger grew by two transactions** — the trail "once sent, then refunded" stays intact. A reversal **may be applied only once**: calling refund twice is a donation. The second call must be a no-op (return {{false}}) and record nothing.

And a reversal **can be refused**: if Minh already spent the 100,000 dong, clawing 100,000 dong back would make {{CA/minh}} negative ⇒ {{IllegalStateException}}. At that point you do not "force" the ledger; the money stays in a suspense account and the case moves to the **inquiry** process with the receiving bank. This is how the real business works.

### txId: why a retry does not create money twice

On a timeout, the app or gateway will **retry with the same txId** (the transaction identifier generated by the initiating side; in English this is called an *idempotency key* — a key such that "sending N times still yields one result"). The ledger treats txId as a **unique key**: already present ⇒ **skip**, return {{false}}, even if the resent content differs. Without this mechanism, one double button-click or one callback delivered twice becomes a real second payout.

> Senior tip: Never trust the balance figure currently displayed; at end of day compare the **sum of entries** with **the balance actually served to the app** for every account. On production, most multi-billion incidents are discovered by exactly that comparison, not by error logs.

### Interview connection
**Question:** "Why does core banking use a double-entry ledger instead of a single balance column?"
**How to answer:** Three reasons, in interview priority order: (1) the **balanced invariant** — every transaction's total debits equal total credits, so no dong can "fly away", and a 1,100-dong fee must have an internal account receiving it; (2) **append-only** — balances are derived from the sum of entries so they can be rebuilt and audited, there is no UPDATE overwriting evidence, and it also avoids losing money when two threads write at once; (3) **refunds by reversal entry** tied to txId idempotency, so a timeout retry cannot pay out twice. Add the senior point: a reversal applies only once, and a reversal can fail if the payee has already spent the money — then you escalate to an inquiry, you never edit the balance by hand. Continue with lesson 6 on the transfer lifecycle to connect the ledger to the timeout/callback flow.`,
    exercises: [
      {
        title: 'Ledger: post / balance / reverse',
        prompt: `Write a {{Ledger}} class that books entries following **double-entry accounting**. An {{Entry}} has {{account}} (prefix {{CA/}} = customer account, {{SYS/}} = internal account), {{amount}} (long, always positive, in whole dong) and {{debit}} ({{true}} = money going out, {{false}} = money coming in).

Mandatory rules:
1. {{post(String txId, List<Entry> entries)}} returns {{boolean}}. Total debits must **equal** total credits, {{entries}} must hold at least 2 entries and every {{amount > 0}}; any violation ⇒ throw {{IllegalArgumentException}} and **record nothing**.
2. An account's balance = sum of credits − sum of debits. If a **customer** account ({{CA/}}) would go **negative** after the posting ⇒ throw {{IllegalStateException}}, and the transaction must **fail atomically** (no half-written entries). {{SYS/}} accounts may go negative.
3. A {{txId}} that was already posted ⇒ **no-op**, return {{false}}, even if the entries resent are different. Success ⇒ return {{true}}.
4. {{balance(String account)}} returns the balance; an account with no entries yet ⇒ 0.
5. {{reverse(String txId)}}: {{txId}} does not exist ⇒ throw {{IllegalArgumentException}}; already reversed ⇒ no-op returning {{false}}; otherwise post the flipped transaction {{txId + ":R"}} with debits/credits inverted (it may throw {{IllegalStateException}} if a customer account would go negative) and return {{true}}.
6. {{txCount()}} is already provided: counts posted transactions, used to prove the ledger only **appends**.`,
        hints: [
          'Do not write anything yet: sum debits and credits first, compare the two totals, then compute each account delta into a temporary Map.',
          'The delta of an account = credits minus debits ({{signed = debit ? -amount : amount}}); then check which {{CA/}} accounts would go negative before applying anything.',
          'reverse: flip the debit flag of every original entry and post it under a new txId ({{txId + ":R"}}); remember the set of reversed txIds so the next call returns false.',
          'Validate fully before writing ⇒ failure is atomic; if you interleave writes with checks, a rejected transaction leaves a half-booked ledger.',
        ],
        explain: `Four invariants, each tested separately: **debit/credit balance** ({{T2}} is rejected with {{IllegalArgumentException}}), **customer accounts never negative** ({{T3}} ⇒ {{IllegalStateException}}), **txId idempotency** (re-posting {{T1}} returns false even with different entries), **refund once only** (the second {{reverse("T1")}} returns false).

The easiest mistake when writing this: checking balances **inside the writing loop**. That leaves a broken ledger when the second entry gets rejected. Split it into **three phases**: (1) validate + sum totals, (2) simulate the deltas and check the constraints, (3) only when everything is fine, apply to {{balances}} and {{txLog}}.

{{reverse}} illustrates "fix by appending": balances go back to the old values but {{txCount}} grows. The "late reversal refused" test shows the real limit of refunds — once the payee has spent the money, the ledger refuses because {{CA/minh}} would go negative, and the case must move to the inquiry process (lesson 6).

Classic interview red flags: using {{double}} for amount (drifting rounding), allowing a negative {{amount}} to "automatically become a reversal" (breaks the balanced invariant), and updating the balance with {{UPDATE}} (destroys the audit trail).`,
      },
    ],
    check: [
      {
        q: 'When is a double-entry transaction accepted?',
        options: ['total debits greater than total credits', 'total debits equal total credits', 'a single entry is enough', 'the sender balance is positive'],
        explain: 'The balanced invariant: every dong leaving must have a receiver; a discrepancy of even 1 dong is a bug, and the system refuses to post',
      },
      {
        q: 'Why is the ledger designed as append-only (entries only ever added)?',
        options: ['so the file grows steadily', 'because it is faster than UPDATE', 'to keep audit evidence and let balances be rebuilt', 'because the accounts table forbids UPDATE'],
        explain: 'Balances are derived from the sum of entries; UPDATE erases the trail and loses money under concurrent writes',
      },
      {
        q: 'The app timed out and resends the same txId. What must the ledger do?',
        options: ['post it again', 'no-op and return false', 'throw a runtime error as a warning', 'delete the old entries and write new ones'],
        explain: 'txId is the idempotency key; posting twice means paying out twice',
      },
      {
        q: 'What is a refund (reversal) in a double-entry ledger?',
        options: ['edit the balance column by hand', 'delete the original entries', 'post new entries with debits/credits flipped, exactly once', 'set the transaction status to CANCELLED'],
        explain: 'The ledger grows while balances return to their old values, and the trail "once sent, once refunded" stays visible',
      },
    ],
  },
});
