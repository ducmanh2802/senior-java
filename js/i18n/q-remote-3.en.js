/*
 * English translation of js/data/q-remote.js — task T991. Format: js/core/i18n.js (content overlay).
 * ids: remote-011 remote-012 remote-013 remote-014 remote-015
 */
App.i18n.content({
  'remote-011': {
    q: 'You are working on a fixed-price contract on Upwork. Midway through, the client messages: "Can you add one more small feature? It should be quick." How do you recognize scope creep, and how do you respond to keep the relationship positive without doing unpaid work — including sample email/messages asking for an additional milestone or a change request?',
    a: `**Summary:** **Scope creep** is when new work is gradually added to a contract without updating time, price, or acceptance criteria. "Small" is only a feeling — in backend work, something that seems small can touch the DB, authentication, tests, and migrations. The professional approach: acknowledge the need, assess impact, propose a **change request** (a change with an estimate) or a new milestone, and get written confirmation on Upwork before doing the work.

### 1. Why "adding one small thing" causes harm
Readers need to understand the mechanism: a fixed-price contract is an **exchange of scope for a fixed price**. When scope increases but price/time stays the same, you reduce your effective hourly rate and delay milestones you already promised. If you accept unpaid work once, the expectation "we can add more next time too" will repeat — this is how scope creep erodes a project.

Illustrative example (hypothetical): you accept a fixed-price of 800 USD for 4 endpoints, estimated at 20 hours (40 USD/hour). The client adds "a small CSV export button" — it sounds small, but it requires querying large data, pagination/streaming, access control, tests, and handling Vietnamese characters. It actually takes 6 more hours. You still receive 800 USD → about 30.8 USD/hour. Add a few cases like this and the project becomes a time loss.

### 2. Recognizing scope creep (signals)
| Signal | Example | How to read it |
|---|---|---|
| Work not in the agreed spec/milestone | "Also add Excel export" | Outside the priced scope |
| Changing behavior that was already accepted | "Change the checkout price calculation logic" | A requirement change, not a bug fix within scope |
| Expanding audience/context | "This API now also needs to work for the mobile app" | Adds constraints (auth, performance, versioning) |
| "It is quick", "just a few minutes" | Emotional pressure, no estimate | Needs technical assessment, do not promise quickly |
| Bundling many "small" changes | 5 small changes in a row | Total impact is large, calculate together |

Distinction: a **bug within the agreed scope** (behavior that does not match acceptance criteria) is usually your responsibility to fix in that milestone. A **new feature/change** is a change request.

### 3. A 5-step process (keep the relationship, keep boundaries)
1. **Acknowledge positively**: thank them and show you understand the need. Do not react defensively.
2. **Clarify the request**: ask about inputs/outputs, who uses it, what data, and priority. "Small" or "large" lies in the details.
3. **Assess impact**: time, risks (DB, security, tests), and impact on the current milestone.
4. **Propose options in writing on Upwork**: (a) add a new milestone/new price, (b) swap an equivalent part of the scope, or (c) schedule it for a later phase. State assumptions.
5. **Get confirmation before starting**: only begin when the client agrees (and for fixed-price, the new milestone is funded in escrow if applicable).

~~~seq
title: Handling an additional work request (change request)
actors: Client | Freelancer | Upwork (Escrow)
Client -> Freelancer: "Add a small feature X"
Freelancer -> Freelancer: Clarify + assess impact
Freelancer -> Client: Propose change request (price/hours, milestone, assumptions)
Client -> Freelancer: Confirm the option
Client -> Upwork (Escrow): Fund the new milestone (if fixed-price)
Upwork (Escrow) --> Freelancer: New milestone funded
Freelancer -> Client: Deliver X + request approval
~~~

### 4. Sample English email/messages (polite, clear)
~~~text
Template A — Ask for clarification + say you will estimate (first response):
Hi [Client Name],
Thanks for sharing this idea — I understand you would like to add [feature, e.g., CSV export for orders].
To make sure I estimate it correctly, could you confirm:
1) Which data/fields should be included, and any filters (date range, status)?
2) Who will use it and how often (download size can affect the approach)?
3) Is this needed in the current milestone, or can it be scheduled next?
I will review the impact on the database, API, and tests and send you a clear estimate shortly.
Best, [Your Name]
~~~

~~~text
Template B — Propose a change request / new milestone (fixed-price):
Hi [Client Name],
I reviewed the request to add [CSV export for orders]. This is outside the scope we confirmed for Milestone [2]
([current scope summary]).
Impact (estimate): ~5–7 hours, including query/streaming for large data, permission checks, and tests.
Assumptions: export up to [50,000 rows], fields [A,B,C], available to [admin role].
I can offer two options:
- Option 1 (recommended): Add Milestone [3b] "CSV export" — fixed price $[280] (estimate-based), delivery in [3 business days] after the milestone is funded.
- Option 2: Swap it with [lower-priority item Y] from the current scope (no price change), and move Y to a later milestone.
If you choose Option 1, please create/fund the new milestone on Upwork and I will start right after it is funded.
Best, [Your Name]
~~~

~~~text
Template C — If it is a truly tiny change you choose to include as a courtesy (intentional, limited):
Hi [Client Name],
I can include [very small change, e.g., renaming a field label in the API response] within the current milestone
as a quick courtesy update (about [20–30 minutes]). I will apply it now.
For any additional features beyond this, I will send a short change request with time/cost so we can plan it clearly.
Best, [Your Name]
~~~

Use Template C only when you **actively choose** to gift a truly very small change; state "this time" clearly to avoid setting a precedent.

### 5. Common mistakes
- **Saying "OK" immediately in chat** and only estimating later: you have already committed yourself.
- **Staying silent and doing unpaid work** to avoid conflict: resentment builds up and the original milestone slips.
- **Arguing emotionally** ("this is not small"): provide concrete technical impact (DB, tests, security, time).
- **Starting work before the new milestone is funded** (fixed-price): the same risk as in remote-010.
- **Not distinguishing bugs from features**: fixing a bug within scope is your responsibility; changing requirements is a change request.

### Checklist
- [ ] Identify: is the new work inside the agreed spec/acceptance criteria?
- [ ] Acknowledge the need and clarify (inputs/outputs, who uses it, priority, data).
- [ ] Assess impact: estimated hours, DB/security/tests, and impact on the current milestone.
- [ ] Reply in writing on Upwork: state assumptions + 1–2 options (new milestone/swap scope/do later).
- [ ] Only start after the client confirms; for fixed-price, the new milestone must be funded in escrow.
- [ ] Keep a collaborative tone based on concrete impact (no attacks, no guessing motives).
- [ ] Keep all communication on Upwork as evidence of scope.

> Senior tip: add a "change rule" to the scope confirmation message at the very start of the project (see remote-010). When scope creep happens, you are simply **enforcing a process already agreed on**, not asking for extra money. Saying "I can do that — here is the impact and options" is both professional and relationship-friendly, because you are helping the client make an informed decision.`,
    follow: [
      'The client says: "The previous freelancer did these things for free." How do you respond while staying respectful and keeping boundaries?',
      'How do you write the initial spec/acceptance criteria to reduce arguments about "is this a bug or a new feature"?',
      'If you already accepted out-of-scope work and now cannot meet the original milestone, how do you recover the plan and communicate?'
    ]
  },
  'remote-012': {
    q: 'You are working on a contract on Upwork. The client is slow to approve a milestone (fixed-price), does not respond, or requests a refund / opens a dispute. What process do you follow, how do you keep evidence (on-platform messages, commits, demos), and what sample messages do you use to communicate?',
    a: `**Summary:** When payment gets stuck, the goal is to **resolve it in a structured, evidence-based way**, not to argue emotionally. For fixed-price, understand the escrow/milestone mechanism and response timelines under the policy; for hourly, keep the work diary and clear notes. All important communication must stay **on Upwork** (messages, contract, milestones). Keep evidence: the agreed requirements, acceptance criteria, deliverables (commit/tag, demo video, run instructions), and timestamps. If a dispute is opened, present the facts concisely with references to evidence. (Dispute/refund mechanisms have specific procedures and conditions that change over time — always check Upwork's support pages.)

### 1. Why you must "work on paper" from the start
A **dispute** is when the two sides cannot resolve things themselves and need the platform's resolution process. The platform can only see what is recorded: the contract, milestones, messages on Upwork, files sent through the platform, and the evidence you provide. Off-platform messages, verbal promises, or "I already did it" without an artefact (a delivered product) are all weak in a dispute.

Terminology: **Refund** — returning money (often related to escrow/milestone funds not released according to the agreement or a dispute outcome); **Evidence** — documents showing you delivered according to the agreed scope/acceptance criteria; **Escrow** — milestone funds deposited but not yet released until approval or according to the handling outcome.

### 2. Three situations and how to handle them
| Situation | Risk | Priority actions |
|---|---|---|
| Client is slow to approve a milestone (fixed-price) | Money is stuck, you do not know if there is an issue | Follow up politely on Upwork, resend delivery evidence, ask clearly why it has not been approved; restate the agreed acceptance criteria |
| Client does not respond | The project stalls, acceptance cannot happen | Message on a cadence (e.g., after 2, 5, 7 business days — choose a reasonable cadence), summarize status and request a specific response; avoid continuing on a new unfunded/unconfirmed milestone |
| Client requests a refund / opens a dispute | Loss of income, potential account impact if handled poorly | Stay calm, compile evidence in chronological order, reply on Upwork concisely and with justification; follow the official support process |

About "automatic" actions when the client does not respond: Upwork may have mechanisms/time windows related to milestones and responses, but details change — **do not assume**; check Upwork's support pages for your contract type at the time it happens.

### 3. Evidence to keep (from the moment you work, not when a dispute starts)
- **Scope & acceptance criteria**: messages/spec on Upwork confirming in/out of scope (see remote-010).
- **Communication history on Upwork**: all change requests, confirmations, responses — keep them on the platform. If you have a call, post a summary message back to Upwork.
- **Delivery artefacts**: commit hash/tag, pull request/branch (if using a shared repo), a build or run instructions, screenshots of results, files sent via Upwork.
- **Timestamped demo**: a short screen-recording video showing the feature meets acceptance criteria; note the date and milestone.
- **For hourly**: work diary + clear notes describing the work (tied to which requirement). Avoid time blocks with no notes.

~~~text
Example "delivery evidence" structure sent on Upwork when submitting a milestone:
Hi [Client], Milestone [2] is ready for your review.
- Scope delivered (per agreed acceptance criteria): [endpoint A, B, migration, tests].
- Evidence: commit/tag [abc123], demo video [link/file sent via Upwork], README run steps [section/link].
- How to verify: [3 bullet steps to test].
- Out of scope (unchanged): [X, Y].
If anything does not match the agreed criteria, please tell me the specific case and I will address it.
Thanks, [Your Name]
~~~

### 4. Sample communication messages (English, kept on Upwork)
~~~text
Template 1 — Follow up on milestone approval (polite, evidence-based):
Hi [Client Name], just following up on Milestone [2] submitted on [date]. I shared the deliverables and a short demo
here: [message link/summary]. Could you please review it against the agreed acceptance criteria and let me know if
you approve it or if there is a specific issue I should fix? Thanks, [Your Name]
~~~

~~~text
Template 2 — Client not responding (summarize status, request a clear action):
Hi [Client Name], I wanted to check in because I have not heard back since [date]. Current status: Milestone [2] was
submitted on [date] with [demo/commit]. I am paused on out-of-scope changes until we confirm priorities.
Could you please reply with: (1) approval of Milestone [2], or (2) specific feedback tied to the acceptance criteria?
I am happy to jump on a short call if that helps. Best, [Your Name]
~~~

~~~text
Template 3 — Responding to a refund request (calm, anchored to scope/evidence):
Hi [Client Name], I understand your concern. I would like to resolve this fairly and based on the agreed scope.
For Milestone [2] (accepted scope: [summary]), I delivered [items] with evidence here: [commit/demo/message].
If there is a specific part that does not meet the agreed acceptance criteria, please point it out and I will fix it.
I prefer to resolve this between us on Upwork; if needed, I can also provide a clear timeline for the fixes.
Best, [Your Name]
~~~

~~~text
Template 4 — When a dispute has been opened (concise, structured presentation):
Summary: I delivered Milestone [2] per the agreed scope on [date].
Agreed scope/criteria: [bullet points or reference to Upwork messages].
Delivered evidence: [commit/tag], [demo video/file], [how to verify].
Client concern: [state their claim factually].
My response: [which criteria are met; any specific issue I offered to fix and when].
I am willing to [fix specific issue] within [X days] if it is within the agreed scope.
~~~

### 5. Common mistakes
- **Moving the argument to off-platform chat**: you lose the official evidence trail.
- **Replying while angry**: hostile words make things worse; draft, wait, then send a fact-based version.
- **Having no acceptance criteria**: the dispute becomes "feelings" on each side.
- **Continuing to do unpaid out-of-scope work to "appease"** while payment is in dispute: high risk, does not solve the root cause.
- **Threatening or violating terms**: always stay professional and follow Upwork's process.

### 6. Prevention for next time
- Confirm scope + acceptance criteria + change request rule before starting (remote-010, remote-011).
- Small milestones, frequent deliveries, a demo at the end of each checkpoint.
- Only start a funded milestone (fixed-price); for hourly, write clear work diary notes.

### Checklist
- [ ] Keep all important communication, scope confirmations, and acceptance on Upwork.
- [ ] Submit milestones with evidence: commit/tag, demo, verification steps against acceptance criteria.
- [ ] Follow up on approval/no response with polite messages that include timestamps and a clear requested action.
- [ ] When asked for a refund: respond calmly, anchor to the agreed scope, and ask them to point out which criterion is not met.
- [ ] If a dispute is opened: compile a timeline + evidence, present it concisely and truthfully, follow Upwork's support process.
- [ ] Do not move payment/disputes off-platform; do not do extra out-of-scope work without agreement.
- [ ] Check current escrow/dispute/Payment Protection mechanisms on Upwork's support pages (they change over time).

> Senior tip: the best evidence is created **before** a dispute, not during one. A simple habit: at the end of each workday send a 3-line update on Upwork (done, next, blockers) and at the end of each milestone send a demo + how to verify. When there is a problem, you do not have to "prove you worked" — you just point to the trail you already left.`,
    follow: [
      'The client requests a refund because "the quality is not what I expected" but does not point to any specific acceptance criterion that was violated. How do you handle it?',
      'On an hourly contract, the client disputes a block of hours in the work diary. How do you prepare evidence and respond?',
      'When should you proactively pause/end a project to limit damage, and how do you do it while staying professional?'
    ]
  },
  'remote-013': {
    q: 'How do Job Success Score (JSS) and reviews affect your chances of getting work on Upwork? At a mechanism level (no need to know the internal formula), what can affect JSS — for example, a contract ending with no feedback or a long contract with no activity? How do you close a contract at the right time and ask for a review politely?',
    a: `**Summary:** **Job Success Score (JSS)** is a score that reflects your history of success on Upwork (calculated by the platform's mechanism, which can change). Public reviews and **private feedback** are both important signals; contracts that end poorly, stay inactive for a long time, or show signs of a bad relationship can have a negative effect at the mechanism level. The best way to protect JSS is to deliver within scope, communicate clearly, proactively close contracts when the work is complete (or when you should stop), and ask for a review **politely, without pressure**.

### 1. Why JSS and reviews matter
Clients use JSS/reviews as a quick risk filter: the score and history help them guess "will working with this person go well?". JSS is not something you "optimize with tricks" in a day — it reflects a **pattern of behavior** across many contracts. Because the internal formula can change and is not fully public, the right answer is to understand the **mechanisms and principles**, not to claim specific numbers/thresholds/algorithms if you have not checked the official pages.

Terminology: **Feedback** — an evaluation after a contract, which may include a star rating and comments; **Public feedback** — shown on the profile; **Private feedback** — sent to the platform, clients are often asked for it in addition to the public part (specific mechanism per Upwork); **Contract** — the work agreement through Upwork.

### 2. What can affect it (at a mechanism level) — and how to read it correctly
| Situation | Why it can affect things | What you should do |
|---|---|---|
| Contract ends with a good outcome, both sides satisfied | A signal of a successful relationship | Deliver clearly, confirm completion, ask for a review politely |
| Contract ends with no public feedback | Missing a public signal; private feedback (if any) may still be a signal under the mechanism | Still close the contract properly; ask for a review gently but accept that the client has the right not to leave one |
| Long contract but inactive for a long time | May be seen as a "hanging" contract that delivers no value; some inactive contracts may be closed automatically under policy | Proactively discuss: pause, set the next date, or close if it is truly done/no more work |
| Ends in a dispute, refund, or unmet expectations | A strong negative signal | Prevent with scope/acceptance criteria; handle disputes calmly, based on evidence (remote-012) |
| Client leaves a low review or negative feedback | Directly affects how future clients perceive you | Respond professionally (if you reply publicly), learn from it; do not argue publicly |

**Do not guess the formula:** for example "X months inactive deducts Y points" — if you cannot verify it on Upwork's support pages at the current time, describe the mechanism ("an inactive contract may be closed under policy and may affect success metrics") instead of inventing numbers.

### 3. Closing a contract at the right time
Closing a contract (end/close contract) is not "cutting ties" — it is housekeeping so the work status is reflected correctly.
- **Close when**: the milestone/scope is complete and delivered; or both sides agree to stop; or there is no more work and you have confirmed with the client.
- **Do not leave it open indefinitely**: an open contract with no work/no clear communication can cause confusion.
- **Before closing**: send a short summary (what was delivered, links/commits/docs, any remaining work if applicable), and ask the client to confirm completion.
- Specific UI steps (End Contract button, who closes) can change — follow the current instructions in Upwork.

~~~text
Sample summary message before closing a contract (English, on Upwork):
Hi [Client Name],
We have completed the agreed scope for [project/milestones 1–2]: [brief deliverables].
Handover: [repo/tag/commit], [README/demo link or file], and notes: [known limitations or next steps if any].
If everything looks good, I will go ahead and close the contract on Upwork. Please let me know if there is anything
within the agreed scope that still needs attention. It was great working with you — and if you are open to it,
I would really appreciate your feedback on the contract. Best, [Your Name]
~~~

### 4. Asking for a review politely (without pressure)
Principle: **ask once, clearly, easy to decline**. The client has no obligation to leave a review; forcing it or hinting at "a 5-star review" is unprofessional and can backfire.

~~~text
Sample review request (short, polite):
Hi [Client Name], thank you again for the collaboration on [project]. If you have a moment, your honest feedback on
the Upwork contract would mean a lot to me and helps me improve. Either way, I appreciate your time. Best, [Your Name]
~~~

~~~text
Sample when the client is satisfied and may need you again (no review pressure):
Hi [Client Name], I am glad we delivered [result, e.g., reduced p95 latency and completed the agreed milestones].
If you need help with [related area] in the future, I would be happy to support. Thanks again, [Your Name]
~~~

~~~text
Sample if the contract ends early but you want to stay professional:
Hi [Client Name], thank you for the opportunity to work on [project]. I have shared [handover/status] so you have
everything completed so far. If you would like to revisit this later, I am open to discussing a new contract with
a clear scope. Wishing you the best with the project. Best, [Your Name]
~~~

### 5. Common mistakes
- **Buying/begging for reviews**: asking for a review in exchange for a discount, or doing free out-of-scope work just to get 5 stars — risks quality and expectations.
- **Leaving a contract open "just in case"** even though there is no more work: creates an unclear state.
- **Reacting angrily in public** to a bad review: future clients see your attitude.
- **Believing "JSS hack tips"** from unofficial sources: mechanisms change, and fraudulent behavior risks your account.
- **Focusing only on coding and forgetting communication**: many poor ratings come from unmanaged expectations, not from technical skill.

### Checklist
- [ ] Understand JSS/reviews at the mechanism level; do not claim formulas/thresholds without checking Upwork's official pages.
- [ ] Manage expectations: confirm scope, share progress updates, handle changes with a change request.
- [ ] Before closing a contract: send a handover summary (delivered, evidence, any remaining work) and ask for confirmation.
- [ ] Close the contract when complete or when both sides agree to stop; avoid leaving it inactive.
- [ ] Ask for a review once, politely and honestly; accept it if the client does not leave one.
- [ ] If you see signs of dissatisfaction, address them early on Upwork with a concrete solution within scope.
- [ ] Check current JSS, feedback, and automatic contract-closure definitions/policies on Upwork's support pages (they change over time).

> Senior tip: the most sustainable way to "protect JSS" is to **create no negative surprises**. A short weekly update, a demo for each milestone, a change request for every scope change — clients rarely leave bad ratings when they always know what is happening and are consulted before decisions that affect time/money. JSS is a side effect of good expectation management.`,
    follow: [
      'The client is verbally happy but does not leave a review after you asked once. Should you ask again, and what do you do next?',
      'You have a long-term hourly contract but there has been no work for 3 weeks. How do you handle it with the client and decide whether to close or keep the contract?',
      'How do you respond publicly (if applicable) to a negative review while staying professional and trustworthy to future clients?'
    ]
  },
  'remote-014': {
    q: 'You are a freelancer in Vietnam (UTC+7) working with a client in the US or Europe, 7–12 hours apart. How do you set up a daily working process: async progress reporting, short demo videos (Loom), arranging overlap hours, and choosing communication channels within the platform?',
    a: `**Summary:** Working across a 7–12 hour gap succeeds or fails on disciplined **async** (asynchronous — no need for both sides to be online at the same time), not on staying up late every day. Set up: clear written progress updates using a template, send short screen-recording demo videos (e.g., Loom — a screen-recording tool that shares a link; use an equivalent tool if you prefer) for anything that needs to be seen, keep a small fixed **overlap** window for things that truly require realtime, and prioritize communication channels **on Upwork** for important exchanges to keep evidence; use off-platform channels only when consistent with terms/the contract.

### 1. Why time zones are a communication problem, not an endurance problem
A 7–12 hour gap means that when you are working, the client is sleeping (or vice versa). If every question requires a round of "ask → sleep → answer → sleep", a 2-hour task can stretch into 3 days. The solution is not "be online 24/7" but to: **reduce back-and-forth** with complete information, **bundle realtime** into a small window, and **make decisions clear** in writing.

Terminology: **Async / asynchronous** — communication that does not require an immediate response; **Overlap** — the time window when both sides can be online; **Handoff** — an end-of-day summary so the other person can continue or understand the context; **Blocker** — something that prevents you from making progress without a decision or information.

### 2. Designing an overlap window (concrete examples)
Assumption: you are in Vietnam (UTC+7). The client is in New York (UTC-4 in summer, ~11 hours apart) or in Berlin (UTC+2 in summer, ~5 hours apart). You do not need overlap every day — only when needed.

| Client | Time difference (example) | Feasible overlap suggestion | Notes |
|---|---|---|---|
| US East Coast (New York) | ~11 hours | 20:30–21:30 VN (9:30–10:30 NY morning) or 7:00–8:00 VN (20:00–21:00 NY previous evening) | Pick 2–3 sessions/week, fixed; avoid turning it into a daily meeting |
| Western Europe (Berlin) | ~5 hours | 15:00–17:00 VN (10:00–12:00 Berlin) | Easier to overlap within slightly shifted business hours |

The time difference changes with **daylight saving time** (some countries shift clocks seasonally). Always state time zones clearly in invitations (e.g., "9:00 AM New York time / 8:00 PM Vietnam time") and use a time zone converter.

### 3. Daily async progress updates (a 5-line template)
Goal: the client reads it in 60 seconds and knows (1) what is done, (2) what is in progress, (3) what decision they need to make.

~~~text
Sample async update (sent via Upwork Messages or an agreed channel):
Subject/First line: Daily update — [Project] — [YYYY-MM-DD, Vietnam time]

1) Done since last update:
   - Implemented GET/POST /orders with validation (commit abc123).
2) In progress (next 24h):
   - Add order status transitions + basic tests.
3) Blockers / needs your input (if any):
   - Please confirm: should "cancelled" orders be editable? (Option A: no, Option B: admin only). I can proceed with A unless you prefer B.
4) Risks / scope notes:
   - None today. (Or: CSV export was requested — I sent a change request separately.)
5) Demo/evidence:
   - 2-min Loom video: [link] showing create/list order flow.

Thanks, [Your Name]
~~~

Golden rule: if there is a blocker, **offer a default choice** ("I will proceed with A unless you prefer B by [time]") so you do not get stuck waiting, unless the decision is high-risk.

### 4. Short demo videos (Loom or an equivalent tool)
A short video replaces a long meeting: the client watches when they are free. **Loom** is a popular tool for recording your screen + voice and sharing a link; you can use an equivalent tool (built-in screen recording, or another tool) as long as the client can view it easily.

~~~text
Checklist for a 2–4 minute demo:
- Opening 10 seconds: "This is [name], update for [milestone/date]. Goal of this demo: [what you will show]."
- Show only the relevant screen; zoom in on text if needed.
- Walk through acceptance criteria: "Criterion 1: create order → here is the request/response... Criterion 2: ..."
- If something is limited/not done: state clearly "Out of scope / next: ..."
- Closing 10 seconds: "Blockers: [none or question]. Next I will: [...]"
- Name the video clearly: 2026-05-07-orders-milestone2-demo
~~~

Security note: do not record secrets, API keys, or sensitive real client data. Use sample data.

### 5. Communication channels: prioritize within the platform
- **On Upwork (Messages/contract context)**: use for scope confirmations, changes, acceptance, payment issues, and post-call summaries — because you need evidence and to comply with terms. (See remote-004 on risks of moving off-platform and non-circumvention.)
- **Off-platform channels (Slack/Email/Zoom/Meet)**: can be convenient for daily work **if** the contract/terms allow it and both sides agree; you should still post summaries of important decisions back to Upwork.
- **Practical rule**: "If losing this message would matter in a dispute, put it on Upwork."

~~~text
Sample communication workflow proposal (sent at project start):
Hi [Client], since we are [11] hours apart, I suggest an async-first workflow:
- Daily written update on Upwork (done / next / blockers / demo link) by [9:00 AM your time].
- Short Loom/video demo at the end of each milestone or when a feature is ready.
- One optional [30-min] overlap call per week at [time + both time zones] for decisions that are hard to resolve async.
- I will post key decisions and scope confirmations back on Upwork for clarity.
Does this work for you? Best, [Your Name]
~~~

### 6. Common mistakes
- **Regularly staying up late** to "make it convenient for the client": not sustainable, lowers quality, leads to burnout.
- **Vague updates** ("still working on it"): the client cannot see risks or what decisions are needed.
- **Asking small questions one by one** throughout the day: bundle them into one clear list.
- **Only talking on calls, never summarizing**: verbal decisions get forgotten or interpreted differently.
- **Sending a 20-minute video**: the client will not watch it; 2–4 minutes, anchored to acceptance criteria.

### Checklist
- [ ] Agree on time zones, time conventions (state both time zones), and awareness of daylight saving time (DST).
- [ ] Propose async-first: daily written updates using the template (done/next/blockers/demo).
- [ ] When there is a blocker, offer options + a time-boxed default (except for high-risk decisions).
- [ ] Send a short 2–4 minute demo video for features/milestones; do not expose secrets/sensitive data.
- [ ] Set 1–2 fixed overlap sessions/week only for things that need realtime; send an agenda beforehand.
- [ ] Keep important exchanges and scope/decision confirmations on Upwork; post post-call summaries to Upwork.
- [ ] Check Upwork's terms on communication channels/non-circumvention before using off-platform channels (they change over time).

> Senior tip: being good at async is a senior skill, not "second-class remote work". Write updates as if you are helping a smart teammate continue the work while you are away: enough context, clear decisions, evidence attached. Clients across time zones often value freelancers who help them **not have to watch the clock** — and that is why they are willing to pay more for structured communicators.`,
    follow: [
      'The client asks for a realtime meeting every day despite an 11-hour gap. How do you negotiate the process while still respecting them?',
      'You have a blocker that needs a decision urgently but the client is asleep for another 8 hours. How do you handle it while still making safe progress?',
      'How do you write an end-of-week handoff for an unfinished backend task so someone else (or you next week) can continue quickly?'
    ]
  },
  'remote-015': {
    q: 'You are a Java freelancer in Vietnam receiving payments from Upwork (USD). What common methods can you use to withdraw money to Vietnam (at a mechanism level), what fees/exchange rates arise at each step, what are the general principles for declaring personal income tax (PIT/TNCN), and how do you keep records?',
    a: `**Summary:** Money you earn on Upwork usually flows through several steps: **client pays → Upwork processes (service fee deducted) → available balance → you withdraw to Vietnam using your chosen method**. Each step may involve fees or exchange-rate differences. Specific withdrawal methods, fees, timing, and availability **change over time and by country** — always check Upwork's official pages (Get Paid / Fees) and your bank/partner's conditions at the time you withdraw. For taxes in Vietnam: the general principle is that foreign-sourced income may be subject to PIT declaration/payment; keep complete records and ask a tax/accounting professional, **do not guess tax rates**.

### 1. Why you must understand the "money chain", not just the contract number
Many new freelancers see a 25 USD/hour rate and think that is what lands in their pocket. In reality, net income is affected by: Upwork's service fee, withdrawal/partner fees, the USD→VND exchange-rate difference, and tax obligations (if any). Understanding each step helps you price correctly (see remote-002) and avoid surprises.

Terminology: **Available balance** — money that has cleared and can be withdrawn; **Withdrawal method** — how you transfer your balance out of Upwork; **Exchange rate / FX** — the conversion rate between USD and VND, which may include a spread between a reference rate and the rate actually applied; **PIT / TNCN** (Personal Income Tax) — tax on personal income under applicable law.

### 2. The steps money takes (mechanism)
~~~seq
title: Money flow from client to a freelancer in Vietnam (mechanism)
actors: Client | Upwork | Withdrawal method | VN Bank
Client -> Upwork: Payment (hourly/fixed-price milestone)
Upwork -> Upwork: Deduct freelancer service fee (per contract)
Upwork --> Freelancer: Available balance (USD)
Freelancer -> Withdrawal method: Request withdrawal
Withdrawal method -> VN Bank: Transfer VND/USD per method
VN Bank --> Freelancer: Funds arrive in account (after fees/FX)
note Upwork..VN Bank: Each step may involve fees, processing time, and exchange-rate differences
~~~

### 3. Common withdrawal methods (mechanism-level — check official pages)
Upwork may support groups of methods such as: **bank transfer** (direct to a local bank using the details you provide), **transfer via a payment service/partner** (e.g., a wallet or intermediary service supported by Upwork at a given time), or other options depending on the country. Specific partner names, fixed/percentage fees, processing time, limits, and the currency you receive (USD or VND) **change**.

**How to check correctly:** go to "Get Paid" / "Payment methods" and "Fees" in your Upwork account and read the conditions that apply to Vietnam at the current time. Do not rely on old articles because partners and fees may have changed.

| What to check | Question to ask yourself | Why it matters |
|---|---|---|
| Fee per withdrawal | Fixed or %? who charges it (Upwork/partner/receiving bank)? | Many small withdrawals can cost more in fees |
| Exchange rate | When is the rate applied? is there a spread vs. a reference rate? | FX spread is a common "hidden fee" |
| Processing time | A few hours, a few business days? | Affects cash-flow planning |
| Currency received | Do you receive USD or VND in the account? | Affects conversion and reporting |
| Limits/frequency | Minimum/maximum per withdrawal, number of withdrawals? | Plan whether to batch or withdraw often |

### 4. Illustrative money-flow example (hypothetical, mechanism only)
~~~text
Example (HYPOTHETICAL — replace with your actual numbers/conditions):
- Fixed-price milestone contract: 500 USD
- Freelancer service fee (assumed 10% — actual varies 0–15% per contract, fixed when it starts; at time of writing, check again): -50 USD
- Available balance: 450 USD
- Withdrawal fee (assumed, by method/partner): -1 USD  (check the actual fee)
- Amount converted: 449 USD
- Applied exchange rate (assumed): 25,400 VND/USD  (actual rates change continuously)
- Amount received (estimate): ~11,404,600 VND (before PIT/TNCN if you have an obligation)

Note: if the applied rate is 100 VND/USD below a reference rate, you "lose" an extra ~44,900 VND on 449 USD — that is the FX spread.
~~~

### 5. General principles for PIT/TNCN in Vietnam (not tax advice)
- Income you earn (including from overseas clients through platforms like Upwork) **may be subject to personal income tax declaration/payment** under Vietnamese law. Specific rules depend on residency status, the nature of income, total income, and the regulations in force.
- **Do not guess tax rates** or calculation methods based on general articles. Tax is a detailed area and can change.
- The right action: **ask a tax/accounting professional** (or the tax authority/official portals) to determine the declaration/payment obligations that fit your case; file on time if you have an obligation.
- Keep complete records for filing and for explanation if needed.

### 6. Keeping records (very important)
~~~text
Suggested records folder (keep safe copies, back them up):
- Upwork contract/offer: job description, price, start/end dates.
- Upwork transaction history: earnings per contract, service fees, balance.
- Withdrawal receipts: withdrawal date, USD amount, fees, method.
- VN bank statements: VND amount received, date received, transaction description.
- Invoices/related documents (if there is a valid separate agreement) and exchanges confirming scope/acceptance.
- Notes on the applied exchange rate (if the system shows it) at the time of withdrawal.
~~~

Name files clearly (e.g., {{2026-05-upwork-withdrawal-449usd.pdf}}) so they are easy to reconcile when filing.

### 7. Common mistakes
- **Not factoring fees/FX into pricing**: the rate looks high but net is much lower.
- **Withdrawing in many small amounts** when there is a fixed fee per withdrawal: unnecessary fee cost (check the actual fee mechanism).
- **Throwing away records** or relying only on memory: when you need to file/explain, the documentation is missing.
- **Following "tax tips" online and acting on them**: legal risk; each case is different.
- **Not checking official pages again**: Upwork methods/fees/partners change.

### Checklist
- [ ] Understand the money chain: contract earnings → Upwork service fee deducted → available balance → withdrawal (fees + FX) → received in VN.
- [ ] Check withdrawal methods available for Vietnam, fees, timing, and currency received on Upwork's official pages (Get Paid/Fees).
- [ ] Choose a withdrawal frequency that fits fee optimization (based on the actual fee mechanism, no assumptions).
- [ ] Account for Upwork's service fee (0–15% per contract, fixed when it starts — at time of writing; check again) when pricing.
- [ ] Keep records: contracts, transaction history, withdrawal receipts, bank statements, exchange-rate notes.
- [ ] Confirm PIT/TNCN declaration/payment obligations with a tax/accounting professional; file on time if you have an obligation.
- [ ] Do not guess tax rates; check current regulations from official sources/professionals.

> Senior tip: run freelancing like a "small business": each month reconcile three numbers — gross (on the contract), after platform fees, and actual VND received after withdrawal/FX — then set aside a reserve for taxes and slow months. Saving records right when a transaction happens (5 minutes) is far cheaper than reconstructing a whole year of paperwork at filing time. And before any tax decision, a conversation with a trusted professional is worth more than dozens of online comments.`,
    follow: [
      'Upwork\'s service fee varies by contract (0–15%). How do you reflect this in hourly and fixed-price quotes?',
      'How often should you withdraw (weekly/monthly/in larger batches) to balance fees, exchange rates, and cash-flow needs?',
      'What records are typically needed when working with an accountant to declare freelance income from overseas?'
    ]
  }
});
