/*
 * English translation of js/data/q-scenario.js — task T967. Format: js/core/i18n.js (content overlay).
 * ids: scenario-125 scenario-126 scenario-127 scenario-128 scenario-129 scenario-130
 */
App.i18n.content({
  'scenario-125': {
    q: '(Case study – business) A product owner (PO) hands over a one-line ticket: "Allow customers to cancel orders on the app." How do you clarify requirements before coding, and what hidden business rules must you uncover?',
    a: `**Summary:** A one-line ticket hides a whole **state machine** and many related systems. Before coding, I (1) draw the **order lifecycle** and ask "cancellation allowed in which states", (2) trace **money, goods, points, promotions** on cancellation, (3) ask **who is affected** (warehouse, shipping, accounting, customer service, seller), (4) nail it down with **concrete examples with numbers** and acceptance criteria. AI can write the function {{cancelOrder()}}; it does not know that cancelling an order already handed to the carrier incurs a 25.000 dong return fee borne by the company.

### Step 1 — Draw the lifecycle and ask per state
~~~text
CREATED → PAID → CONFIRMED → PACKED → HANDED_TO_CARRIER → DELIVERED
                    ↘ CANCELLED (allowed in which states? who can?)
~~~
Questions for the PO: up to which state is cancellation allowed? What happens after packing? Can a multi-seller order be partially cancelled? Is there a time limit (e.g. within 30 minutes after placing)?

### Step 2 — Trace money, goods, and benefits
| Aspect | Hidden question |
|---|---|
| Money | Refund via which channel (card, wallet, uncollected COD)? How long? Who bears the payment gateway fee already lost? |
| Promotion | Is a used voucher returned? Order uses "buy 2 get 1 free", cancels one item — how to recalculate? |
| Points | Are earned points deducted? Are used points refunded? |
| Inventory | Is stock returned immediately or after checking returned goods? |
| Shipping | If already handed over, must call the carrier cancel API, may incur fee |
| Accounting | E-invoice already issued — must issue adjustment/cancellation e-invoice per regulation |
| Fraud | Customer places then cancels repeatedly to keep promo items? Need a cancellation limit |

### Step 3 — Ask the stakeholders
Warehouse, shipping, accounting, customer service, seller team — 15 minutes each. Most hidden rules are here, not in documents.

### Step 4 — Nail it down with examples
~~~text
Example 3: Order with 2 items (A 300k, B 200k), voucher 50k off entire order, paid by card 450k,
status CONFIRMED. Customer cancels item B.
→ Refund: 200k − 50k × (200/500) = 180k to card within 5–7 business days; voucher not returned
because the order is still valid; return B's stock immediately; deduct points corresponding to 180k.
~~~
Each example is confirmed by PO and accounting, and becomes an automated test case.

### Real-world example
At one e-commerce platform, the first version of order cancellation was built in 3 days straight from the ticket. After 2 weeks: 1.300 orders cancelled after handover to the carrier (return fee about 30 million dong), vouchers refunded even for partially cancelled orders (loss about 45 million), accounting found 400 e-invoices not adjusted. The redo started with 2 requirement-clarification sessions with 5 parties, producing 14 rules and 22 examples; it took 2 weeks but there were no incidents after launch.

### Why this is an AI-hard skill
The needed information is **not in the prompt or in the code**: it is in the heads of the departments, in the contract with the carrier, in e-invoice regulations. Someone who can do this must know **who to ask, what to ask, and recognize where the parties understand differently**.

### Sample interview answer
"For a one-line ticket like allowing customers to cancel orders, I do not code right away. I draw the order lifecycle and ask which states allow cancellation, who can cancel, whether there is a time limit. Then I trace money, goods, and benefits: refund via which channel and who bears the fee, how voucher and points are handled, when stock is returned, what happens if the order was already handed to the carrier, how the e-invoice needs adjustment. I meet briefly each stakeholder — warehouse, shipping, accounting, customer service — because most hidden rules are with them. Finally I nail it down with concrete-number examples, confirmed by PO and accounting, and turn them into automated tests. In my previous project, skipping this step made the first version cause a loss of nearly a hundred million within two weeks."

> Senior tip: for every feature touching money, ask one fixed question: "If this operation is reversed (cancel, refund, adjust), which numbers in the system must change?". The list of answers is the real scope of the ticket.`,
    follow: [
      'What do you do when PO and accounting give two conflicting rules?',
      'How do you estimate this ticket when requirements are not fully clear?',
      'How to turn business examples into maintainable automated tests?'
    ]
  },
  'scenario-126': {
    q: '(Case study – architecture decision) The executive board wants to launch "buy now pay later" within 6 weeks to beat competitors. The current system has no credit subsystem. How do you lay out options, analyze risks and make a recommendation — and how do you take responsibility for that recommendation?',
    a: `**Summary:** The Lead's job is not to say "can't make it" or "okay", but to **lay out 2–3 feasible options**, each stating **scope, risk, cost, and the price to pay later**, then **recommend one option** with success conditions and a stop point. The decision is recorded as an **ADR**, has an approver, and I track the risks raised after launch. AI can list options; it does not know which partner signed the contract, which team is overloaded, and it does not take responsibility when the recommendation is wrong.

### Step 1 — Clarify what "success" means
- Business goal: be on the market before Tet (Lunar New Year)? how many customers? max limit per customer?
- Non-negotiable constraints: lending license (is the company allowed, or must go through a financial partner?), customer data regulations, reconciliation.

### Step 2 — Three options
| | A. Integrate BNPL partner (partner provides credit) | B. Build minimal version on current system | C. Build full credit subsystem |
|---|---|---|---|
| Scope within 6 weeks | Checkout calls partner, gets result, reconciles | Fixed limit for trusted customer group, single installment | Scoring, multiple installments, dunning, recovery |
| Legal risk | Low (partner has license) | High if no lending license | High |
| Bad debt risk | Partner bears | Company bears | Company bears |
| Revenue | Low commission fee | Higher | Highest in the long run |
| Make 6 weeks | Yes (if partner API ready) | Tight deadline, large technical debt | No |
| Price later | Depend on partner | Must rewrite | — |

### Step 3 — Conditional recommendation
"I recommend **A** to launch on time, while simultaneously surveying legal and designing **C** to run in parallel for 6 months. Do not choose B because of legal risk and bad debt the company bears without scoring capability." With: **success conditions** (partner confirms API and test environment in week 1), **stop point** (if no test environment by week 2, delay launch or reduce scope), **metrics to track** (approval rate, payment completion rate, complaints).

### Step 4 — Record and take responsibility
- ADR: context, options, decision, consequences, review date; approver (CTO, legal, risk).
- After launch, periodic report on raised risks; if assumptions wrong, I am the first to propose adjustment.

### Real-world example
An e-commerce platform faced exactly this requirement. The engineering team initially proposed building in-house (option C, 5 months); the board pushed for B in 6 weeks. The Lead presented the table above with legal's opinion: the company has no lending license, so B carries penalty risk. The board chose A with a financial partner; launched after 5 weeks, checkout conversion rose 9% for orders over 2 million. After 8 months, based on repayment behavior data obtained through the partner, the company built its own subsystem with much lower risk.

### Why this is an AI-hard skill
The decision depends on **non-public information** (contracts, licenses, team capability, leadership's risk appetite) and needs **one person accountable** to the board and regulators.

### Sample interview answer
"When pushed on a deadline, I do not say yes or no; I lay out two or three feasible options. First I clarify what success means and the non-negotiable constraints, such as the lending license. For buy now pay later, I compare three directions: integrate a licensed partner, build a minimal version bearing the risk ourselves, or build a full credit subsystem; each direction has scope, legal risk, bad debt risk, revenue, ability to meet the deadline, and the price to pay later. I recommend one option with success conditions, a stop point, and metrics to track, recorded as an ADR with an approver from legal and risk. After launch, I track the stated assumptions and proactively propose adjustments if they are wrong."

> Senior tip: always include a **"stop point"** in the recommendation: a specific condition that, if not met by date X, leads to scope cut or deadline delay. It turns the "can we make it" debate into a controlled plan that leadership easily agrees to.`,
    follow: [
      'How do you present technical risk to a board without technical background?',
      'If the board still chooses an option I do not recommend, what do I do?',
      'What sections does my ADR have and where is it stored?'
    ]
  },
  'scenario-127': {
    q: '(Case study – incident command) 21:05 Friday, payment failure rate jumps from 0.5% to 30%. Three hypotheses: the 20:30 deploy, the partner payment gateway is slow, and the DB is running a maintenance job. You are the incident commander. How do you coordinate, decide, and communicate in the first 60 minutes?',
    a: `**Summary:** The incident commander **does not go debug themselves** — they **coordinate**: assign roles, have hypotheses checked **in parallel**, prioritize **limiting damage** before finding the root cause, make decisions with incomplete information (rollback is reversible and cheap), and **communicate regularly** with stakeholders. AI can suggest hypotheses; it cannot call the partner at 9 PM, cannot decide to stop a DBA's job, and does not take responsibility for the decision.

### 0–10 minutes: organize
- Open incident channel, declare severity (P1: direct revenue impact), take the **commander** role.
- Assign roles: **technical investigators** (2 people, one hypothesis each), **liaison** (update customer service, management, partner), **scribe** (timeline).
- Quick check "what changed recently": 20:30 deploy, DB maintenance job 20:45 (who turned it on?), payment gateway dashboard.

### 10–25 minutes: check in parallel, reduce damage early
| Hypothesis | Quick check | Damage-limiting action |
|---|---|---|
| 20:30 deploy | Did errors start around 20:30? Are errors concentrated on the new-version pods? | Rollback (5 minutes, reversible) |
| Partner payment gateway slow | Latency and error codes from partner; their status page | Shift some traffic to backup gateway if available |
| DB maintenance job | Lock wait, DB CPU, slow queries since 20:45 | Pause the job (needs DBA approval) |
Principle: **cheap and reversible** actions are done as soon as there is a sign, without waiting for 100% certainty.

### 25–60 minutes: decide and confirm
In this example: errors rose from 20:47 (not matching 20:30) and only at the transaction-write step; lock wait increased sharply; a DBA mistakenly turned on the "VACUUM FULL" job on the transactions table instead of the log table. Decision: pause the job (DBA confirmed safe), do not rollback the deploy. 21:31 failure rate back to 0.6%. Continue monitoring 30 minutes before closing the incident; failed transactions in the window are listed for customer service to proactively contact.

### Communication
- Update every 15 minutes with the template: **impact — what we're doing — when the next update is**. Do not guess the root cause before confirmation.
- Customer service gets a canned answer for customers; management gets impact estimate (number of transactions, amount).

### After the incident
Blameless postmortem within 3 days: why could a heavy command run on the transactions table at peak hour without warning? Actions: maintenance jobs must be approved, block big table-locking commands by permission, alert on lock wait.

### Why this is an AI-hard skill
Information is scattered among people and systems, requires **decision-making under pressure with incomplete data**, requires **authority** to stop another team's work, and requires **communication** with customers, partners, leadership.

### Sample interview answer
"As the incident commander, the first thing I do is organize, not debug myself: open the incident channel, declare severity, assign roles — investigators for each hypothesis, liaison, and scribe for the timeline. Hypotheses are checked in parallel with quick questions: did errors start around deploy time, where are the errors, did the partner report an incident, does the DB have lock wait. I prioritize damage limitation: cheap and reversible actions like rollback or pausing a job are done as soon as there's a sign. I update every 15 minutes with the template — impact, what we're doing, next update time — and don't guess the root cause before confirmation. Then a blameless postmortem with specific actions so it doesn't recur."

> Senior tip: ask **"what changed in the last 2 hours?"** right in the first minute, and ask people too (who ran what, who turned on what), not just the deploy history. Many major incidents start from a manual action not in any monitoring system.`,
    follow: [
      'When do you choose rollback, and when fix forward?',
      'How do you write a blameless postmortem when the error is clearly the fault of one person?',
      'How to reduce mean time to detect (MTTD) for the payment flow?'
    ]
  },
  'scenario-128': {
    q: '(Case study – money and compliance) Internal audit found the total customer wallet balance off by 38 million dong versus the accounting ledger (0.02%). How do you find the cause and adjust the data so it is both correct and accepted by audit?',
    a: `**Summary:** With money, **how you fix matters as much as the result**: never run {{UPDATE}} directly on balances. I (1) **scope the variance** by date/transaction type/wallet via reconciliation, (2) find the **root cause** from data (logs, events, journal entries), (3) **fix the root cause** in code, (4) adjust figures via **adjusting journal entries** with reason, evidence and **maker-checker**, (5) prove to audit with **before/after reconciliation reports** and prevention process.

### Step 1 — Scope it
Invariant to be correct: for each wallet, **balance = sum of journal entries** of that wallet. Run reconciliation:
~~~sql
SELECT w.id, w.balance, coalesce(sum(e.amount), 0) AS ledger_sum,
       w.balance - coalesce(sum(e.amount), 0) AS diff
FROM wallet w LEFT JOIN ledger_entry e ON e.wallet_id = w.id
GROUP BY w.id, w.balance
HAVING w.balance <> coalesce(sum(e.amount), 0);
~~~
Result: 412 wallets off; group by last entry date → concentrated from 14/10; group by transaction type → almost all **partial refunds**.

### Step 2 — Root cause
From 14/10, a partial-refund fix **updates the balance** but writes **journal entries at the original transaction amount** instead of the refund amount (or vice versa) when the order has a voucher. Reproduced with a test on data of the 3 off wallets. Checked further: no sign of fraud (no wallet withdrew abnormally after being over-credited).

### Step 3 — Fix the root cause
Code fix, add tests with voucher examples, add **invariant check** in code: every balance change must go with a journal entry of the same amount in the same transaction (or better: balance is **derived from** the ledger / updated by a single place).

### Step 4 — Controlled adjustment
- Do not edit original transactions, no manual {{UPDATE}} of balances. Create **adjusting journal entries** per wallet: amount, reason ("adjust partial refund error 14/10–02/11, ticket INC-2291"), link to original transaction.
- **Maker** (engineer/ops) creates the adjustment batch from a reviewed script; **checker** (accounting/controller) approves; system applies and audits.
- For wallets **over-credited** that the customer already spent: per policy and legal (clawback, or company bears) — this is a business decision, not engineering's.

### Step 5 — Prove it
Re-run reconciliation: 0 wallets off. Send to audit: describe cause, scope (number of wallets, amount, period), list of approved adjusting entries, before/after reconciliation evidence, prevention action (daily automated reconciliation with alert).

### Real-world example
Last time the company had a similar variance, an engineer "fixed" balances directly with a script overnight "to be quick". Audit rejected it because there was no trace and no approval; the company had to rebuild the entire history from logs, taking 3 weeks. This time, following the process above, from detection to audit closing the file took 6 days; daily automated reconciliation was turned on, and the next variance (2 months later, due to a different bug) was detected within 18 hours with 3 wallets.

### Why this is an AI-hard skill
Requires understanding **double-entry bookkeeping, audit regulations, approval segregation of duties**, weighing **customer policy**, and bearing **legal responsibility** for financial data.

### Sample interview answer
"For a balance variance, how you fix matters as much as the result, so I never update balances directly. First I scope it with the invariant reconciliation: each wallet's balance must equal the sum of its journal entries; group off wallets by date and transaction type to find the start point — here, partial refunds from a specific date. Then reproduce with a test and fix the root cause in code, add the invariant check. Data is adjusted via adjusting journal entries with reason, linked to the original transaction, through maker-checker: creator different from approver, with audit. If the customer already spent the over-credited amount, that is a business and legal decision. Finally I prove it to audit with before/after reconciliation, and turn on daily automated reconciliation."

> Senior tip: design so a variance **cannot happen silently**: balances change in only one place in code, in the same transaction as the journal entry, and a daily reconciliation job alerts even on a difference of one dong.`,
    follow: [
      'Why not edit the original transaction directly even when you know it is wrong?',
      'How do you design so balance and ledger never drift apart?',
      'When the customer already spent the over-credited amount, what are the handling options?'
    ]
  },
  'scenario-129': {
    q: '(Case study – controlling AI-written code) The team uses an AI coding assistant, PR speed doubled, but production incidents rose 40% in the last 3 months. You are tasked "keep the speed, reduce incidents". How do you analyze and design the process?',
    a: `**Summary:** AI makes the team **write code faster than it can understand and control**. I analyze **what type of incidents** leak to production (usually not syntax errors but errors at **boundaries**: concurrency, transactions, retry, security, real data), then place **automated safety nets** exactly for those types (tests, static analysis, architecture rule checks), change **how we review** (risk-based review, author must explain the code), and keep **PRs small**. The goal is not to ban AI but to make people focus review where AI tends to be wrong.

### Step 1 — Analyze incident data
Label 31 incidents over 3 months by root cause:
| Error type | Count | Example |
|---|---|---|
| Concurrency / race | 8 | "get then put" on shared map, check-then-act on balance |
| Transaction / proxy | 6 | Internal {{@Transactional}} call, HTTP call inside transaction |
| Retry / idempotency | 5 | Retrying non-idempotent action → duplicate transaction |
| Security / data | 4 | Logging full request with phone number, missing ownership check (BOLA) |
| Performance | 5 | N+1, loading entire table into memory |
| Other | 3 | |
Comment: 90% are errors that **code "looks right"** and unit tests with mocks still pass.

### Step 2 — Automated safety nets for exactly those error types
- **Real integration tests** (Testcontainers) for repositories and money flows; concurrency tests for balance/stock operations.
- **Static analysis** with rules for common errors (SpotBugs, Error Prone, Sonar): {{SimpleDateFormat}} static, comparing wrappers with {{==}}, resources not closed.
- **ArchUnit**: ban calling HTTP client inside class with {{@Transactional}}, ban {{@Data}} on entity, ban logging request object directly.
- **Automated security test**: user A accessing user B's resource must get 404.
- **Count queries** in tests for list APIs.

### Step 3 — Change the review
- PR max about 400 lines; PR mostly AI-generated must state so in the description.
- **Risk-based checklist**: PR touching money, permissions, personal data, concurrency → requires senior reviewer and questions "what if two requests at the same time? what if retry? what if error midway?".
- **Author must explain** every line: if they can't explain why {{REQUIRES_NEW}} is used here, the PR is not ready.

### Step 4 — Measure
Track incident rate per deploy, time from commit to production, PR rejection rate due to high risk.

### Real-world example
After 3 months of applying: incidents dropped 55% vs the peak (lower than even before using AI), PR speed only fell about 10% vs the peak. The automated net blocks an average of 6 high-risk errors per week before reaching the reviewer. Two juniors shared that having to explain AI-generated code helps them learn faster instead of just accepting suggestions.

### Why this is an AI-hard skill
AI increases the volume of code needing control; someone with production experience knows **where code looks right but is wrong** and can design a control system for the whole team.

### Sample interview answer
"I don't ban AI; I start from data: label incidents by error type. Usually most are errors where code looks right but is wrong at the boundaries: race condition, transaction via proxy, non-idempotent retry, missing ownership check, logging sensitive data, N+1. Then I place automated safety nets for exactly those: real integration tests and concurrency tests, static analysis, ArchUnit banning dangerous patterns, security tests like user A accessing user B's data, query counting. Review is risk-based: small PRs, PRs touching money, permissions or personal data need a senior reviewer with a checklist, and the author must explain every line. Then re-measure the incident rate per deploy to know whether the process works."

> Senior tip: add three mandatory questions to the PR template for stateful changes: "What if two requests at the same time? What if retry? What if error midway?". These three catch most errors both people and AI tend to miss.`,
    follow: [
      'How to measure the real effectiveness of an AI coding assistant with the team?',
      'Which ArchUnit rule do you add first, and why?',
      'How do you guide juniors to use AI while still learning foundational skills?'
    ]
  },
  'scenario-130': {
    q: '(Case study – infrastructure operations) A small Terraform change (renaming an RDS parameter suggested by AI "for standardization") got merged; terraform plan had a "must be replaced" line but no one read it closely. The pipeline apply almost deleted and recreated the production DB. How do you handle it and redesign the infrastructure change process?',
    a: `**Summary:** Infrastructure changes have **large blast radius** and many **non-reversible** operations (delete DB, change network, change IAM). A safe process needs multiple layers: **protect critical resources in code** ({{prevent_destroy}}, deletion protection), **automatically check plans** with policy-as-code (block every destroy/replace on critical resources), **reviewers read the plan**, not just the code diff, **split state and permissions** by environment, and **verified backups**. This time we were lucky thanks to deletion protection; the process must not depend on luck.

### What happened
Renaming an attribute that the provider treats as **ForceNew** (e.g. instance identifier) makes Terraform plan **delete then create**. The code diff was just one line renaming — reviewer read code and approved. The plan line {{-/+ resource ... must be replaced}} sat among 300 lines of output. Apply was blocked because RDS has {{deletion_protection = true}} — otherwise the DB would be deleted (final snapshot depends on config) and the system down for hours.

### Immediate handling
1. Pause pipeline, lock state, confirm no resource was partially changed.
2. Revert the change; if renaming is truly needed, use a non-recreate method ({{moved}} block or {{terraform state mv}} when only changing the address in code; or accept keeping the old name).
3. Blameless postmortem: why did a change with "replace" on a production DB reach the apply step?

### Redesigned process
| Layer | Measure |
|---|---|
| In code | {{prevent_destroy = true}} (in lifecycle block) for DB, data bucket, KMS key; deletion protection of the service enabled by default |
| Automated plan check | Export plan to JSON, check with OPA/Conftest (or Sentinel): block every delete/replace on critical resource types at prod unless a special approval label |
| Reviewer visibility | Bot posts plan summary on PR: create/modify/delete counts, highlights every replace/destroy |
| Permissions and scope | State split by environment and layer (network, data, application); prod apply role only runs from pipeline, needs manual approval |
| Final safety net | AWS Backup with Vault Lock, periodic restore drills; SCP blocks deleting critically-tagged resources outside the process |
| AI-suggested changes | Treated like any other change: no exception for "just renaming for standardization" |

### Real-world example
After the incident, the team turned on policy-as-code in the pipeline: in the first month it blocked 3 changes with replace on critical resources (one subnet, one shared security group, one Aurora cluster), all from changes thought harmless. Infra PR review time dropped because the bot summarizes the plan, reviewers focus only on highlighted parts. No serious infrastructure incidents in the next 9 months.

### Why this is an AI-hard skill
AI can write Terraform; it does not take responsibility for the **blast radius** of an apply on production and cannot design a control system suited to the organization's risk. The operator must understand **which operation is reversible, which is not**.

### Sample interview answer
"Infra changes are dangerous because of large blast radius and many non-reversible operations, so I do not let safety depend on the reviewer carefully reading a long plan. I set up multiple layers: critical resources have {{prevent_destroy}} and deletion protection in code; plan exported to JSON and automatically checked with OPA or Conftest to block every delete or recreate on critical resources in production; a bot posts the plan summary to PR and highlights every replace; state split by environment and layer; production apply runs only from the pipeline with approval; and backup with Vault Lock that has been restore-tested. When only renaming in code, I use the {{moved}} block instead of letting Terraform recreate the resource. AI-suggested changes go through the same process, no exceptions."

> Senior tip: add a pipeline step to **count "destroy" and "replace" in the plan**; if non-zero in production, the pipeline stops and requires a separate approval stating the reason. One simple script line blocks the costliest type of Infrastructure as Code incident.`,
    follow: [
      'What does the moved block in Terraform solve?',
      'How do you write an OPA/Conftest policy blocking destroy on critical resources?',
      'What is the benefit of splitting Terraform state by environment and by layer?'
    ]
  },
});
