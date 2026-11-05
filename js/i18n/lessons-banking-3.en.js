/*
 * English translation of js/data/lessons-banking.js — task T708. Format: js/core/i18n.js (content overlay).
 * ids: lesson-banking-006
 */
App.i18n.content({
  'lesson-banking-006': {
    title: 'The interbank transfer lifecycle: PENDING/TIMEOUT/SUCCESS/FAILED, duplicate callbacks, and inquiry reconciliation',
    goals: [
      'Tell TIMEOUT apart from FAILED and explain why "not known yet" must never be handled like "known for sure"',
      'Read the state-transition table of a NAPAS transfer and the role of NEEDS_INQUIRY',
      'Explain why a duplicate callback must be a no-op and why a late SUCCESS must not credit money automatically',
      'Write {{TransferStateMachine}} that only allows legal transitions and throws {{IllegalStateException}} otherwise',
    ],
    body: `### A true story: the money already landed somewhere else, the app still shows red

At 8:59 a.m. Minh makes a transfer in the app. The app reports "Transaction unsuccessful, the money will be refunded within 3–5 working days". At 9:00 he opens the receiving bank's app: **the money is already there**. At 10:30 he gets an SMS "transaction successful". Meanwhile Lan (the sender) was debited at 8:59 and her app **still reports an error**. Nobody stole anybody's money — it happens only because two systems **knew different things at different moments**, and Lan's app displays a **state**, not **the truth**.

An interbank transfer goes through a **switching hub** (switching = collecting orders from many banks and forwarding each one to the right receiving bank; in Vietnam this role is played by **NAPAS** — the Vietnam National Payment Corporation), so the business is not "success / failure" but a **state machine**: a finite set of states plus a table that says which state may move to which state when which event arrives.

> Term: *state machine* = an object that stands in exactly one state at a time, and every single move must match the table. Everyday example: a traffic light has 3 states; there is no "red → green" step if the table says it must pass through "yellow".

### Five states, three groups of meaning

| State | Meaning | Who knows it | Final yet |
|---|---|---|---|
| {{PENDING}} | the sender side has been debited, we are waiting for the receiving side to answer | sending bank | no |
| {{TIMEOUT}} | **the waiting deadline passed with no answer** | sending bank | no |
| {{SUCCESS}} | the partner confirms the money has been credited | both sides | yes |
| {{FAILED}} | the partner states it did **not** accept the money (wrong account number, receiving bank refused) | both sides | yes |
| {{NEEDS_INQUIRY}} | contradictory results came in and the operations team must reconcile them | operations | no |

The core difference, and also the interview answer that earns points:

- **FAILED = knowledge**: the partner says "I am not accepting it". Refunding is the correct action.
- **TIMEOUT = absence of knowledge**: we merely ran out of patience, while the truth is still out there and has not come back. Treating TIMEOUT as FAILED and refunding is **printing money twice**: if the partner actually credited the beneficiary, we have refunded the sender **and** the receiver still holds the money ⇒ the bank takes the loss, and the two ledgers drift apart (see lesson 5).

That is why TIMEOUT **must never auto-refund**. It opens one of two paths: either a late callback/event arrives, or an **inquiry** (a formal question to the partner asking what really happened to this order) is raised.

### Late callbacks and the road to NEEDS_INQUIRY

The switching hub or the receiving bank answers after 40 seconds, while the app has been showing "error" since second 5. That {{SUCCESS}} callback **must not** quietly turn {{TIMEOUT}} straight into {{SUCCESS}} and credit the money, because between the timeout and this moment any of these could have happened: operations issued a manual refund, another callback arrived, or the user already pressed "transfer again". A safe system moves to {{NEEDS_INQUIRY}} — the state "a new result just arrived but it is not trustworthy enough to apply on its own; a human must reconcile it". After the inquiry is settled, operations fires one of two closing events: {{CONFIRM_SUCCESS}} or {{CONFIRM_FAILURE}}.

### Duplicate callbacks: the silent killer

Nobody sends a callback exactly once. Payment infrastructure retries with backoff (pushing the retries further apart: retry after 1s, then 5s, then 30s): the same "SUCCESS" message can arrive many times, or arrive both via a callback and via an inquiry. If you write:

~~~java
// WRONG: every callback posts to the ledger
void onCallback(Callback c) {
    ledger.post(newTxId(), entriesFor(c));   // callback arrives twice = money credited twice
}
~~~

then one flaky network beat is enough to print money out of thin air. The rule: **callback handling must be idempotent** — if it duplicates an event already applied, it is a **no-op** (no state change, nothing extra recorded, no repeated notification). In the exercise, "{{SUCCESS}} already applied and another {{SUCCESS}} comes in}" is a silent no-op, while "{{SUCCESS}} already applied and now {{FAILED}} comes in" is a **real contradiction** ⇒ throw {{IllegalStateException}} so that a human gets dragged out of bed at 2 a.m.

### Why "my money was deducted but the app says error" — look at the ledger

Connecting to lesson 5: when the transfer order arrives, the sending bank immediately records one **balanced** transaction that pulls the money away from the sender and parks it in a **suspense account** (a holding account for money whose final home is not decided yet, {{SYS/suspense}}):

| txId | Account | Debit | Credit |
|---|---|---|---|
| T1 | CA/lan | 101,100 | |
| T1 | SYS/suspense | | 100,000 |
| T1 | SYS/fee | | 1,100 |

At timeout the money is not "lost": it **is sitting in suspense**, and the ledger knows exactly that. When {{SUCCESS}} comes back ⇒ credit {{CA/minh}} and pull the amount out of suspense. When {{FAILED}} comes back ⇒ a reversal entry puts the money back into {{CA/lan}}. When nothing comes back ⇒ it stays parked, waiting for an inquiry. The app shows "error" only because it maps {{TIMEOUT}} to the message "not completed yet, your money is being processed / will be refunded within X days" — not to "your money is gone".

### The flow of one transfer order

~~~seq
title: An interbank transfer that times out
actors: App | BankAPI | Switch | ReceivingBank
App -> BankAPI: POST /transfers with txId=T1
BankAPI -> BankAPI: post ledger entries, money sits in SYS/suspense
BankAPI -> Switch: open a NAPAS session
Switch -> ReceivingBank: transfer 100,000 dong to CA/minh
note BankAPI: 5 seconds gone, no reply yet
BankAPI --> App: TIMEOUT: show error, money already debited
Switch --> BankAPI: late SUCCESS callback (second 40)
BankAPI -> BankAPI: TIMEOUT moves to NEEDS_INQUIRY
App -> BankAPI: GET /transfers/T1 to re-check
BankAPI -> Switch: inquiry for T1
Switch --> BankAPI: official result: SUCCESS
BankAPI --> App: SUCCESS after operations confirms
~~~

### The transition table used by the exercise

| From | Event | To |
|---|---|---|
| {{PENDING}} | {{SUCCESS}} / {{FAILED}} / {{TIMEOUT}} | {{SUCCESS}} / {{FAILED}} / {{TIMEOUT}} |
| {{PENDING}} | {{CONFIRM_SUCCESS}} / {{CONFIRM_FAILURE}} | throw {{IllegalStateException}} (no jumping ahead, there is no inquiry result yet) |
| {{TIMEOUT}} | {{TIMEOUT}} | no-op (duplicate callback) |
| {{TIMEOUT}} | {{SUCCESS}} | {{NEEDS_INQUIRY}} (late result: do not credit on your own) |
| {{TIMEOUT}} | {{FAILED}} | {{FAILED}} (the partner states it did not accept ⇒ refund is safe) |
| {{NEEDS_INQUIRY}} | {{SUCCESS}} / {{FAILED}} / {{TIMEOUT}} | no-op (duplicate, waiting for a human) |
| {{NEEDS_INQUIRY}} | {{CONFIRM_SUCCESS}} / {{CONFIRM_FAILURE}} | {{SUCCESS}} / {{FAILED}} |
| {{SUCCESS}} | {{SUCCESS}} | no-op |
| {{SUCCESS}} | any other event | throw {{IllegalStateException}} |
| {{FAILED}} | {{FAILED}} | no-op |
| {{FAILED}} | any other event | throw {{IllegalStateException}} |

The table collapses into a single rule: **an event whose target equals the current state ⇒ no-op; an event absent from the table ⇒ throw; every real move ⇒ write one history row**.

### Mistakes you actually meet on production
1. **Mapping TIMEOUT to FAILED** "to keep the model tidy" ⇒ the money is refunded while the receiver already has it.
2. **Not storing the transition history** ⇒ when a complaint lands, you cannot prove what the app knew, and when it knew it.
3. **A callback handler that is not idempotent** ⇒ money credited twice, OTP sent twice, SMS sent twice for the same transaction.
4. **Scattering if/else across every callback** instead of one central transition table ⇒ adding one new state means editing many places, and the place you forget is exactly the hole.
5. **No timeout on the outbound call**: waiting until the partner replies while the partner is also waiting for you ⇒ both sides hang in parallel. The standard is a short timeout on your side plus an inquiry.

> Senior tip: Set an **inquiry SLA** from the numbers of the regulation you are actually subject to (the maximum accepted delay for a late reply, and the refund promise shown to customers, which is usually written in the product documentation), plus **an alert on how many orders sit in NEEDS_INQUIRY**. One or two stuck orders is normal; a curve that starts climbing means the partner or the switching hub has a problem — that is an incident, not business as usual.

### Interview connection
**Question:** "A customer's transfer timed out, and the receiving bank reports SUCCESS late. How do you handle it?"
**How to answer:** First state firmly that **a timeout is missing information, not a failure**, so you must never refund automatically — otherwise the money would be in the receiver's account and back in the sender's account at the same time. Then the design: the money of a pending order lives in a **suspense account** on the double-entry ledger (lesson 5), so it is always traceable; the state moves {{PENDING → TIMEOUT}} and then {{TIMEOUT → NEEDS_INQUIRY}} when the late {{SUCCESS}} arrives, i.e. **no credit on your own initiative** — the order goes into the inquiry queue ({{inquiry}}) sent to the switching hub; once the official result is back, operations fires {{CONFIRM_SUCCESS}} or {{CONFIRM_FAILURE}} to close it. Callbacks must be **idempotent**: a duplicate of an applied event is a no-op, while a contradiction (already SUCCESS, now FAILED) throws {{IllegalStateException}} and alerts. Points added to your answer: mentioning {{txId}} as the idempotency key, an inquiry SLA, and metrics alerting on the number of orders stuck in {{NEEDS_INQUIRY}}`,
    exercises: [
      {
        title: 'TransferStateMachine.apply',
        prompt: `Write {{TransferStateMachine}} for one interbank transfer order. The initial state is {{PENDING}}. The transition table **exactly as in the lesson**:

- {{PENDING}} + {{SUCCESS}} / {{FAILED}} / {{TIMEOUT}} ⇒ {{SUCCESS}} / {{FAILED}} / {{TIMEOUT}}.
- {{TIMEOUT}} + {{SUCCESS}} ⇒ {{NEEDS_INQUIRY}} (a late result, no automatic credit). {{TIMEOUT}} + {{FAILED}} ⇒ {{FAILED}}.
- {{NEEDS_INQUIRY}} + {{CONFIRM_SUCCESS}} ⇒ {{SUCCESS}}; + {{CONFIRM_FAILURE}} ⇒ {{FAILED}}.
- An event whose target state **equals** the current state ⇒ **no-op** (duplicate callback): no state change, no history row, **no exception thrown**.
- Every event that is not in the table (for example {{PENDING}} + {{CONFIRM_SUCCESS}}, {{SUCCESS}} + {{FAILED}}, {{FAILED}} + {{SUCCESS}}) ⇒ throw {{IllegalStateException}} and **change nothing at all**.
- {{event == null}} ⇒ throw {{IllegalArgumentException}}.
- For each real state change, append one row to the history in this shape: {{FROM --EVENT--> TO}} (for example {{TIMEOUT --SUCCESS--> NEEDS_INQUIRY}}).

{{state()}} and {{history()}} are already given; you only write {{apply(Event)}}. Hint: extract one {{next(State from, Event e)}} method that returns the target state, or {{null}} when the move is not legal — the whole table logic then lives in a single place.`,
        hints: [
          'Do not write long if-else chains scattered around; put the table into one {{next(from, event)}} method that returns the target state or null.',
          'A no-op is exactly the case where {{next}} returns the very same {{from}}: test {{to == from}} and {{return}} **before** writing any history.',
          'Throw {{IllegalStateException}} when there is no transition, and remember **not** to touch {{state}} or {{history}} in the error branch.',
          'The hardest part: {{TIMEOUT}} + {{SUCCESS}} must go to {{NEEDS_INQUIRY}}, while {{PENDING}} + {{SUCCESS}} goes straight to {{SUCCESS}}.',
        ],
        explain: `The state machine has **one door in**, {{apply}}, so every piece of behaviour lives in the {{next}} table — that is the habit this lesson wants you to keep: adding a new state means editing one place only.

The tests form three separate groups: (1) **idempotent no-op** — the same callback arriving twice leaves both state and history still; (2) **late result** — {{TIMEOUT --SUCCESS--> NEEDS_INQUIRY}}, never {{TIMEOUT → SUCCESS}} directly, because the money is still parked in suspense awaiting an inquiry; (3) **terminal states** — {{SUCCESS}} and {{FAILED}} accept only the very event that carried them there, everything else throws {{IllegalStateException}} so the alerting can fire.

{{history}} is not a "nice to have": when a customer complains "the app showed an error, so where did my money go", the row {{PENDING --TIMEOUT--> TIMEOUT}} followed by {{TIMEOUT --SUCCESS--> NEEDS_INQUIRY}} with their timestamps is precisely the operational and legal evidence.

The classic mistakes when writing this: letting {{NEEDS_INQUIRY + SUCCESS}} jump straight to {{SUCCESS}} (crediting money that was never reconciled), or using one generic {{Exception}} for both "duplicate" and "illegal" — the business needs them separated: a duplicate is normal, an illegal move is an incident.`,
      },
    ],
    check: [
      {
        q: `What is the difference between TIMEOUT and FAILED?`,
        options: [`No difference, both get refunded`, `TIMEOUT means the result is still unknown, FAILED means the partner states it did not accept the money`, `TIMEOUT is always more serious than FAILED`, `FAILED never requires a refund`],
        explain: 'Treating TIMEOUT as FAILED refunds the sender while the receiver may already have been credited, so the same money goes out twice',
      },
      {
        q: 'A SUCCESS callback arrives while the transaction is in TIMEOUT. What is the safe action?',
        options: ['Switch straight to SUCCESS and credit the receiver', 'Ignore it and wait for the customer to phone the hotline', 'Move to NEEDS_INQUIRY and run an inquiry, crediting only after confirmation', 'Throw an error and revert everything'],
        explain: 'A late result is not trustworthy enough to be applied on its own; it must be reconciled through the inquiry and only then closed with CONFIRM_SUCCESS',
      },
      {
        q: `The system receives a SUCCESS callback for the third time for a txId that is already SUCCESS. What must it do?`,
        options: [`Throw IllegalStateException`, `No-op: no state change, no history row`, `Post one more Credit entry`, `Call the partner again to confirm`],
        explain: `Callback handling is required to be idempotent; a duplicate of an already applied event is a normal situation caused by retries`,
      },
      {
        q: `While the result is still pending, where is the sender's money (in the double-entry ledger)?`,
        options: [`In the receiver's account`, `Already cancelled, so it is back with the sender`, `In the bank's suspense account`, `Recorded nowhere`],
        explain: `The balanced entry moves the money from CA/sender into SYS/suspense, so it stays traceable and no money ever disappears`,
      },
    ],
  },
});
