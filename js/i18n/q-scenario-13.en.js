/*
 * English translation of js/data/q-scenario.js — task T1197 redo. Format: js/core/i18n.js (content overlay).
 * ids: scenario-104 scenario-105 scenario-106 scenario-107 scenario-108
 */
App.i18n.content({
  'scenario-104': {
    q: 'How do you read a database schema to quickly understand the business when joining a new project?',
    a: `**Summary:** a database schema usually hides the business "language" inside it. Instead of reading every table, focus on the core tables, the relationships, the status columns and the history tables — that lets you reconstruct the business process without having to ask about everything.

### Real-world context
In an insurance project, the {{policies}} table has a {{status}} column with values PENDING/ACTIVE/LAPSED/CANCELLED/EXPIRED. The {{policy_status_history}} table shows the exact chain of state transitions. From that alone you already understand the policy approval process without reading a 100-page spec.

### How to read a schema
1. **Find the core "entities"**: look for tables that many FKs point to, or short-named tables with clear business meaning (orders, accounts, policies, claims). These are usually the aggregate root.
2. **Read the status column**: list every value it can take (enum or CHECK constraint), then find the matching history/audit table. That pair is the hidden state machine.
3. **Find the history tables**: {{*_history}}, {{audit_*}}, {{*_logs}} show who did what, when, and how the state changed.
4. **Analyse the relationships**: FKs are the business relationships (1:N, N:N). e.g. {{orders}} - {{order_items}} reveals the cart/order model.
5. **Read real data (read-only!)**: query a few sample rows on UAT/staging to see actual values, data formats, and whether test data is mixed in.

### Worked trace through a DB (bank transfer)
~~~text
accounts (id, account_no, balance, status)
  └─ transfers (id, from_account_id, to_account_id, amount, status, ref_no)
       ├─ transfer_status_history (transfer_id, old_status, new_status, changed_at, changed_by)
       └─ ledger_entries (transfer_id, account_id, dc, amount, entry_group_id)

State machine: PENDING → PROCESSING → COMPLETED / FAILED / REVERSED
Rule: only PENDING rows may be updated, COMPLETED is immutable
~~~

### Questions to ask while reading
- **Why does this column exist?** (e.g. {{effective_date}} vs {{created_at}})
- **When does it change?** (look for triggers, logs, history rows)
- **Is there an implicit rule?** (CHECK constraint, unique index, soft delete {{deleted_at}})
- **What does the data actually mean?** (code lists, enum mapping)

### Common mistakes
- **Reading only the DDL**: DDL never shows the real process. Always look at sample data too.
- **Skipping the history table**: it is often more informative than the main table for understanding "how the system is operated".
- **Assuming a relationship**: verify it with data (are there orphan records, for instance?) before drawing a conclusion.

### Sample interview answer
"Schema is the most honest document about the business, because code can lie but data cannot. I start from the largest and most-written tables, checked via DB statistics, because those are usually the core entities such as transactions or orders. I draw relationships through foreign keys, or through columns named xxx_id when no constraint exists. I pay special attention to status columns and their actual values with a GROUP BY query, because those are the business state machine; CHECK and UNIQUE constraints reveal invariant rules; timestamp and version columns reveal the lifecycle and how overwrites are prevented. I follow one real record through the tables, for example a money transfer from creation to posting. Wherever I see oddities like unused columns or status values not found in code, I write them down as questions for the business expert."

> Senior tip: One very effective technique is "reverse engineer from a transaction". Pick the most recent successful transaction in the main transaction table, trace every table it touches through FK/ref_no, and draw the relationships. After two or three such transactions you understand about 80% of the domain model.`,
    follow: [
      'How do you tell master/transaction business tables apart from configuration tables?',
      'Why are audit/history tables far more important than people imagine?'
    ]
  },
  'scenario-105': {
    q: 'What is Event Storming and how do you use it to understand a domain quickly when joining a new team?',
    a: `**Summary:** Event Storming (proposed by Alberto Brandolini) is a workshop technique where BA/PO/devs explore a domain together through "domain events" (important things that have already happened). When you join a new team you can run a 1-2 hour mini Event Storming to build a shared glossary and understand the process fast.

### Why use Event Storming?
Instead of reading a long spec, the whole team sticks notes on a board: everyone speaks in business language. The result is a domain map that both the technical side and the business side understand.

### Core concepts
- **Domain Event** (orange sticky): something that has already happened, e.g. {{PolicyIssued}}, {{ClaimSubmitted}}, {{PaymentAuthorized}}. Write it as a past-tense verb.
- **Command** (blue sticky): an action a user or a system wants to take, e.g. {{SubmitClaim}}, {{ApprovePolicy}}.
- **Actor** (yellow sticky): who issues the command, e.g. Customer, Underwriter, Admin.
- **Aggregate** (light yellow sticky): the group of entities that handles the command, e.g. Policy, Claim.
- **Policy/Rule** (purple sticky): a business rule that triggers an event, e.g. "if the amount > X, approval is required".
- **External System** (pink sticky): a system outside your boundary, e.g. Core Banking, SMS Gateway.

### Running a mini Event Storming (1-2 hours)
1. **Prepare**: multi-colour sticky notes, pens, a whiteboard or an online board. Invite the BA, the PO and whoever knows the business best.
2. **Brain dump of events**: everyone writes the important domain events in time order and sticks them on the board without debating yet.
3. **Build the timeline**: arrange them in the order things actually happen (happy path first, then exceptions).
4. **Add commands and actors**: for each event ask "Who caused this? With which command?" Then add the actors and commands.
5. **Find the hotspots**: the vague spots, the arguments, the complex exceptions — that is exactly what needs digging into.
6. **Output**: a timeline of domain events, a glossary, and a list of questions that still need clarifying.

### Worked example (insurance claims)
~~~text
[Actor: Customer] Command: ReportClaim 
  → Policy (aggregate) check: policy active?
    → Domain Event: ClaimSubmitted
      → Policy: Underwriter review
        → Command: AssessDamage
          → Domain Event: ClaimAssessed (approved/rejected)
            → External: PaymentSystem
              → Domain Event: ClaimPaid
~~~

### Common mistakes
- **Writing events in future tense**: wrong. They must have already happened (Issued, not Issue).
- **Only devs in the room**: without business people the output is useless.
- **Arguing too early**: phase 1 is brainstorming only, sorting comes later.
- **Too technical**: stay on the business side, do not talk about REST or queues right away.

### Sample interview answer
"Event Storming is a joint session of dev, BA and business, where everyone writes business events that have already happened, in past tense like 'order placed', 'payment confirmed', on orange sticky notes, then arranges them along a timeline. Then we add the commands that caused each event, the actors, the rules and external systems, and mark the spots of disagreement or open questions. When joining a new team I run a one-to-two-hour mini session for one important flow: it gives me the big picture much faster than reading documents, and more importantly it surfaces the places where the parties actually understand things differently. The output is a list of events, bounded contexts that can become domain boundaries, and open questions. I capture it and turn it into a short document the team keeps."

> Senior tip: You do not need a full Event Storming. Borrow 30 minutes from the BA/PO and sketch a timeline on paper or a board with the 5-10 most important events of the flow you are trying to learn. That is usually faster than reading a whole design document.`,
    follow: [
      'What is the difference between Event Storming and a Sequence Diagram?',
      'When should you use Event Storming instead of reading code to understand a domain?'
    ]
  },
  'scenario-106': {
    q: 'How do you ask BA/PO/business people effective questions when you do not understand the domain yet?',
    a: `**Summary:** the biggest mistake is asking "what does this system do?". Ask about concrete situations instead, based on real data or a trace you have already done. The goal is to extract business rules, not generic descriptions.

### Principles for asking questions
- **Specific beats general**: use the numbers, ref_no and statuses you actually see.
- **Ask about "why" and about exceptions**: much of what matters lives in the exception cases.
- **Propose first, then ask for confirmation**: far more effective than an open question.
- **Write it down immediately**: update your glossary and your personal runbook.

### Question patterns that work
| Situation | Bad question | Good question |
|---|---|---|
| Mid-trace | "How does a transfer work?" | "Why has transfer #TRF123 been in PENDING for two hours?" |
| You see a rule | "Are there any rules?" | "Why does a transaction above 100 million VND need an extra approval?" |
| Exceptions | "When is it rejected?" | "In which cases does the system refuse a transfer even though the balance is sufficient?" |
| Cut-off | "Is there a time limit?" | "If a customer transfers at 23:58, is it processed on that same day?" |
| Responsibility | "Who approves?" | "Who has the right to cancel a transaction that is already PENDING after it has been submitted?" |

### Strategy over time
- **Week 1**: focus on "the happy path + the main states". Sit with the BA/business people.
- **Week 2**: ask about exceptions taken from recent production incidents and tickets. That usually reveals the rules that matter most.
- **After that**: ask only when a question really blocks the task you are working on, so you do not wander.

### A realistic conversation
**You:** "I saw an AWAITING_APPROVAL status in the transfers table. When does it appear?"
**BA:** "When the amount exceeds the limit for that customer type. For example a regular customer has a limit of 50 million VND per day; above that an Approver must sign off."
**You:** "So who is the Approver? Is there an SLA for the approval?"
**BA:** "Usually the Team Leader, with a 30-minute SLA during office hours..."

### Real-world example
A new dev asked the BA "What is the refund logic?" — too broad a question, and got 20 minutes of generic explanation. Asked again with a concrete example: "A customer buys 3 items totalling 500k, uses a 50k coupon, and returns 1 item worth 200k — how much is refunded and how is the coupon handled?" — the BA had to stop and check, and discovered the business team itself had two different understandings (split the coupon proportionally vs deduct it entirely from the remaining items). The rule was pinned down in writing with 4 numeric examples, becoming test cases. Afterwards the dev used the pattern: "I understand it as ... is that right? And what about the case where ...?" and sent a summary after each session.

### Common mistakes
- **Asking ten things at once**: pick the one or two most important questions each time.
- **No context prepared**: always show the log, the DB row or the screenshot before you ask.
- **Forgetting to take notes**: right after the conversation, write it into your personal or team doc.

> Senior tip: The "show, don't ask" rule. Instead of asking "what is the flow?", draw the diagram you have already traced and ask "Does this match reality? What is missing?". That saves a huge amount of time for both sides.`,
    follow: [
      'How do you ask about complex rules without bothering the BA too much?',
      'When the BA answers vaguely, how do you get a clear answer?'
    ]
  },
  'scenario-107': {
    q: 'In an interview: "How would you quickly get to know a new domain?" — how do you answer to impress as a Senior?',
    a: `**Summary:** answer with a clear structure: your method (end-to-end trace), your tools (logs/DB/schema), your collaboration (BA/ops), and the outcome you expect. The most important part is a concrete example with numbers, plus a "learn it in order to operate it" mindset rather than only "learn it in order to code it".

### An effective answer structure
1. **Short opening**: state your view — understanding the business matters as much as understanding the technology
2. **Step-by-step method**: describe the process you actually follow
3. **Illustrative example**: pick one concrete situation
4. **Outcome**: name the benefit (fewer defects, better communication with the BA)
5. **Closing**: summarise briefly

### A full sample answer
*"First, I do not read the whole codebase. I pick the single most important business flow — say, a money transfer — and follow it from UI to database in order to draw a map. I shadow a BA running the real flow on UAT, and read the history tables to understand the state machine. At the same time I trace logs with a traceId to see each individual step. From that I build my own glossary and a list of questions about exceptions. My goal is that by the end of the first week I can explain that flow to somebody else without looking at code. This way I learn both the 'why' and the 'how', and I avoid wrong changes caused by not understanding the business."*

### What makes an impression
- **Practical**: talk about traces, logs, DB, not just "reading the documentation"
- **Collaborative**: stress working with BA/PO/business people
- **Senior thinking**: you care about exceptions, operations and maintenance
- **With an example**: if you have real experience, tell it briefly
- **A short English ending**: shows you can communicate internationally

### Short English version
*"I start by tracing one real transaction end-to-end - from UI to database. I shadow business users, read audit tables to understand state transitions, and ask targeted questions about edge cases. My goal is to build a mental map of the business rules first, so I can make safe changes later."*

### Common interview mistakes
- **Saying only "I read the documentation"**: too passive, not enough for a Senior role
- **Saying only "I read the code"**: shows purely technical thinking
- **Not mentioning exceptions**: lacks depth
- **Answering too long**: one to two minutes is enough

### Real-world example
Two candidates were asked the same question. Candidate A: "I will read the documentation and code very carefully" — the interviewer wrote "passive". Candidate B told a real story: joining an insurance project, in the first week tracing a claims file from app to DB via trace, running a 2-hour Event Storming with the business side, discovering 3 hidden rules inside stored procedures, and after 3 weeks fixing a claims-calculation bug left by the previous owner; also writing a flow document the team used for onboarding. The interviewer then asked about how the hidden rules were found — exactly the part B had prepared most. Lesson: a Senior answer has **a method + a story with measurable outcome + value left for the team**.

> Senior tip: what the interviewer wants to hear is "does this person know how to pick up a new domain quickly without depending on a mentor forever?". The answer above proves you are proactive, methodical, and interested in how the system really runs.`,
    follow: [
      'How do you adapt the answer to each company (a bank vs a product company)?',
      'What should you add if you have not joined many new projects before?'
    ]
  },
  'scenario-108': {
    q: 'When you join a new project you must quickly understand the hidden "business rules" — how do you discover them?',
    a: `**Summary:** business rules are usually not in the documentation — they hide in validation, state machines, calculation logic, cut-off times and limits. To find them fast you have to combine tracing code, reading DB constraints, looking at real error logs and asking the right people.

### Where hidden business rules live
1. **Validation in code**: if/else branches, {{@Valid}} annotations, custom validators. Read the service.validate() methods.
2. **Database constraints**: CHECK, UNIQUE, triggers — they often enforce the rules that really matter.
3. **State machine**: the allowed transitions reveal the approval process and the preconditions.
4. **Real errors**: look at production/staging logs for error codes — each error usually maps to one rule.
5. **Calculation logic**: fees, interest and exchange rates typically contain the complex rules.

### How to detect them
- **Trace a validation**: pick one request that was rejected (search logs for ERROR/VALIDATION_FAILED) and walk backwards through the code to see which check fired.
- **Read the constraints**: {{SELECT * FROM information_schema.check_constraints}} or look at the DDL files.
- **Analyse history**: scan the {{*_history}} tables that have many rows to spot patterns.
- **Ask about edge cases**: "When is a transaction refused even though all the basic conditions are met?"

### Worked example (transfer limits)
~~~text
Found in TransferService:
if (amount > dailyLimit && !customer.isVip) throw LimitExceeded
if (isAfterCutoff && !isSameDayAllowed) throw CutoffExceeded
if (toAccount.isFrozen) throw AccountFrozen

Rules:
- The limit depends on the customer tier
- Cut-off at 17:00 during office hours
- A frozen destination account cannot receive funds
~~~

### Recording the business rules
Keep your own glossary in the format: {{Rule ID}} | {{Description}} | {{Condition}} | {{Action}} | {{Source}}. For example:
- BR-001: transfers above 100 million VND need approval (Source: TransferService.java:45)
- BR-002: after 17:00 the transfer is not processed immediately (Source: config + code)

### Common mistakes
- **Trusting the spec completely**: the spec is usually stale, the code is the more accurate source.
- **Reading only the happy path**: validation is scattered, so it is easy to miss.
- **Not writing it down**: after one month you have forgotten the rules you found.

### Sample interview answer
"Hidden business rules usually live in the least-read places: nested if conditions in old code, stored procedures and triggers in the DB, table constraints and defaults, config files and parameter tables, batch jobs running at night, and in the heads of long-tenured people. I discover them in several ways. Read real data: the distribution of status or amount columns often reveals rules like limits or rounding. Read incident history and bug tickets, because many rules were born from a past incident. Write characterization tests against real data to capture current behaviour. And ask operations and customer-support staff about the special cases they handle by hand. Each rule I find I record with its source, examples and the person who confirmed it, in a shared team document."

> Senior tip: the golden rule is "code is the running specification". When spec and code disagree, trust the code (after confirming with the BA). And never skip recording the source (file:line) so you can look it up later.`,
    follow: [
      'How do you tell a core business rule apart from a technical validation?',
      'When a rule contradicts between spec and code, how do you handle it?'
    ]
  },
});
