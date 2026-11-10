/*
 * English translation of js/data/q-remote.js — task T995. Format: js/core/i18n.js (content overlay).
 * ids: remote-029 remote-030 remote-031 remote-032
 */
App.i18n.content({

  'remote-029': {
    q: 'Workshop — pricing problem: you have a full-time salary (assumed) and want to switch to freelancing on Upwork. Calculate the hourly rate you need to set by working out your actual billable hours, deducting unpaid time, platform fees, withdrawal fees, taxes/insurance (as principles). Includes a sample calculation with assumed numbers.',
    a: `**Summary:** An hourly rate that "sounds fine" may not be enough to live on. You must calculate from the **target net income** divided by the **actual billable hours** (hours the client pays for), then work backwards through all costs: platform service fee, withdrawal/conversion fees, taxes and self-funded insurance (as principles). The sample calculation below shows why someone needing ~1,400 USD net/month may have to set a listed rate much higher than the "salary/hour" figure suggests.

### 1. Terms (explained from scratch)
- **Billable hours** (billable hours): hours you do work the client agrees to pay for (coding, agreed meetings, in-scope fixes). Not every working hour is billable.
- **Non-billable hours** (unpaid hours): writing proposals, interviewing, learning tech, profile marketing, accounting, waiting for replies, rest. You spend the time but cannot invoice it.
- **Gross** (revenue before deductions): contract money recorded before fees/taxes. **Net** (take-home): what you can actually spend.
- **Effective hourly rate** (real income per hour worked): net divided by total hours you put in (billable plus non-billable) — the "true" number to compare against a salary.
- **Service fee**: the portion the platform keeps from your earnings on a contract. On Upwork, the freelancer service fee **varies 0–15% per contract**, shown before you send a proposal/accept an offer and fixed once the contract starts (as of 2026-11-07, per support.upwork.com; **verify again**). Direct contracts have different levels (see the official page).

### 2. Sample calculation (ALL NUMBERS ARE ASSUMED — replace with yours)
~~~text
STEP A — Target monthly net income (assumed)
  Current full-time salary (reference):               30,000,000 VND/month
  + Value of benefits you must now self-fund
    (health insurance, sick/leave reserve):            3,000,000 VND/month
  + Equipment/learning/internet reserve:               2,000,000 VND/month
  ---------------------------------------------------------------
  Net income needed (after all fees/taxes):            35,000,000 VND/month
  Reference conversion (assumed 25,000 VND/USD):        ~1,400 USD/month
  (Exchange rate changes; use the rate you actually receive/convert at.)

STEP B — Actual billable hours per month (assumed)
  Working days: 22 days
  Hours/day (sustainable average): 8  → 176 hours/month
  Subtract non-billable:
    - Writing proposals/job hunting/interviews:     12 hours
    - Meetings, reports, out-of-scope chat:        10 hours
    - Learning, skill updates, profile fixes:        8 hours
    - Admin (invoicing, accounting), friction:      6 hours
    - Rest/sick reserve (converted):               12 hours
  ---------------------------------------------------------------
  Total non-billable:                               48 hours
  Actual billable hours:                     176 - 48 = 128 hours/month
  (Newcomers usually bill fewer hours because job hunting takes more time.)

STEP C — Work backwards through costs to the listed rate (assumed)
  Target net:                                         1,400 USD
  + Mandatory taxes/contributions (as principle):     ~10% of target net → +140 USD (ASSUMED; actual depends on residency/contract type/treaties — consult a tax professional)
  + Withdrawal/conversion fees (assumed):             ~1%                → +15 USD (depends on method; check actual)
  = Needed after platform fee:                        ~1,555 USD
  Platform service fee (assumed 10%):                 gross needed ≈ 1,555 / 0.90 = ~1,728 USD
  ---------------------------------------------------------------
  Minimum hourly rate (gross): 1,728 / 128  ≈ 13.5 USD/hour
  Rate you should set (rounded + risk cushion):       16–20 USD/hour (assumed)

Check effective rate:
  At 18 USD/hour, 128 billable hours, 10% service fee: gross 2,304 → after fee 2,074 → minus withdrawal/tax assumed leaves ~1,900 USD
  Effective rate over all 176 hours: 1,900 / 176 ≈ 10.8 USD/hour (the number to compare with your full-time hourly salary).
~~~

### 3. What the calculation means
- A "30 million VND/month salary" does not equal "7–8 USD/hour" on freelance, because freelance must self-fund non-billable time, benefits, the risk of no work, fees and taxes.
- When you are new, **billable hours may be only 60–100 hours/month** because job hunting takes more time → you need a higher rate or a planned period of lower income.
- The tax/insurance numbers above are **principle illustrations only**. Tax obligations and insurance for income from abroad/software services in Vietnam depend on residency status, contract type and current regulations — **consult a tax/accounting professional**; do not copy the percentages from this example.

### 4. Levers to improve (not just lowering price)
- Increase the **billable ratio**: proposal templates, onboarding process, fewer rambling meetings (fix the agenda), batch async questions.
- Increase **rate** when you have evidence: 2–3 good reviews, case studies with numbers, a niche specialty.
- Reduce **idle risk**: aim at repeat clients/retainers (monthly maintenance contracts — agreed blocks of hours/work).
- Choose the right contract type: fixed-price only when scope is clear and you can estimate confidently; hourly when discovery/risk is high.

### 5. Common mistakes
- Dividing monthly salary by 160 hours and setting that as the rate: ignores non-billable time, fees, taxes, insurance.
- Forgetting the service fee varies 0–15% and withdrawal fees: net ends up much lower than expected.
- No contingency reserve: freelance has high and low months.
- Working more hours to compensate for a low rate: burnout, quality drops, bad reviews.

### Checklist
- [ ] Define the target net/month (including benefit, equipment, rest reserves) — use your own numbers, not the sample.
- [ ] Estimate actual billable hours (subtract proposals, meetings, learning, admin, rest); newcomers should assume conservatively (60–100 hours).
- [ ] Work backwards: taxes/insurance (ask a professional) + withdrawal fees (actual method) + Upwork service fee (varies 0–15%/contract, fixed at start — as of this writing; verify).
- [ ] Minimum rate = (gross needed) / (billable hours); add a 15–25% risk cushion.
- [ ] Track effective hourly rate weekly (net / total hours spent) to know whether you are "working cheap".
- [ ] Plan rate increases at evidence milestones (reviews, case studies, repeat clients).

> Senior tip: manage freelance like a one-person business. The listed rate is the selling price; billable hours are supply capacity; fees/taxes/insurance are operating costs. If you do not know those three numbers, you are "guessing prices" rather than running a business. Keep a simple spreadsheet and update it monthly — it will let you decline low-priced jobs calmly, because you know your real floor based on facts.`,
    follow: [
      'If you only bill 40 hours in your first month, how do you adjust your income target, costs or job-hunting strategy (not just lower the rate)?',
      'How do you properly estimate taxes and insurance obligations for cross-border freelance income in Vietnam? Who should you ask and what records should you prepare?',
      'When does switching from hourly to a retainer (monthly package) stabilize income more, and how do you price that package?'
    ],
  },

  'remote-030': {
    q: 'Workshop — fixed-price estimation: a client asks you to "Build a REST API for a booking system" (assumed). Break down the work, estimate hours, add a risk buffer, split into milestones, and write Scope / Out of scope / Assumptions in English.',
    a: `**Summary:** With **fixed-price** (a flat-rate contract — paid by result/milestone, not by hour), the risk is on your side: if you estimate wrong or scope is vague, you do extra work unpaid. The safe approach is: clarify the minimum requirement (MVP), break work into small pieces to estimate, add a **risk buffer**, split into **milestones** (delivery milestones, each tied to acceptance criteria), and write clear Scope / Out of scope / Assumptions in English right in the proposal/contract.

### 1. Terms (explained from scratch)
- **Fixed-price / fixed-scope**: a fixed price for an agreed scope. Clients like it because costs are known; freelancers must control scope tightly.
- **Estimate**: a prediction of effort/hours/cost — not an absolute commitment if assumptions are wrong; hence assumptions must be recorded.
- **Buffer** (risk cushion): extra time/cost to cover hard-to-predict work (unclear requirements, integration bugs, small changes). Usually 15–30% depending on vagueness.
- **Milestone** (delivery milestone): splitting the project into small parts; each part has an output, acceptance criteria and payment. Reduces the risk of "working everything before getting paid".
- **MVP** (Minimum Viable Product — the smallest runnable version): the smallest set of features that meets the core goal, to avoid taking on "a full booking system".
- **Scope / Out of scope / Assumptions**: In scope / Out of scope / Assumptions — the three sections required to avoid disputes.

### 2. Step 1 — Clarify requirements (assumed reasonable ones)
"Build a REST API for a booking system" is very broad. Before quoting, pin down the minimum version. Assumptions (must be confirmed with the client): a simple booking service (one resource type, e.g., rooms/slots), users can book/cancel and view availability; no online payment, no complex multi-tenancy, no mobile app. Assumed stack: Java 17, Spring Boot 3.x, PostgreSQL, REST JSON, basic auth (JWT or API key) — **only assumptions for estimation**.

### 3. Step 2 — Break down work and estimate hours (assumed)
~~~text
WBS (Work Breakdown Structure) & estimates (assumed):

1. Clarify requirements + design API/data model            4 hours
   - confirm use cases, entities, booking states, double-booking rule
2. Project skeleton + config (DB, migrations, error format) 3 hours
3. Basic auth (login/token or API key)                   4 hours
4. Resource/slot management (minimal CRUD)                4 hours
5. Booking flow (create, view, cancel, overlap check)      8 hours
6. Validation, business errors, basic pagination/filter    4 hours
7. Testing (unit + integration for main flows)            6 hours
8. Documentation (OpenAPI/README, how to run)             3 hours
9. Staging deploy support + handover                      2 hours
---------------------------------------------------------------
Raw estimate total:                                      38 hours
Risk buffer (25%, because initial requirements are vague): +10 hours (rounded)
---------------------------------------------------------------
Total effort with cushion:                               ~48 hours

Cost conversion (assumed): 48 hours x 20 USD/hour = 960 USD (gross, excluding the platform fee you bear).
You might quote a fixed price per milestone totaling ~900–1,100 USD depending on the risk you accept.
(Note: Upwork freelancer service fee varies 0–15%/contract, fixed at start — as of 2026-11-07; verify. Hours/prices here are entirely assumed.)
~~~

### 4. Step 3 — Split into milestones tied to acceptance
| Milestone | Output | Acceptance criteria (example) | Price % (assumed) |
|---|---|---|---|
| M1 — Design & skeleton | API spec (endpoints + request/response), data model, runnable project, DB migration | Client approves spec; app starts; DB tables created | 20% |
| M2 — Auth + resource/slot | Auth endpoints + resource/slot CRUD, basic tests | API calls succeed per spec; error cases return clear codes | 25% |
| M3 — Core booking | Create/view/cancel booking, overlap prevention, validation | Main flow tests pass; no double booking under the agreed rule | 35% |
| M4 — Finish & handover | Extra tests, OpenAPI/README, staging deploy support, handover | Acceptance checklist passes; docs runnable; known issues listed | 20% |

Principle: small milestones, verifiable, **funded before work** (for fixed-price on Upwork, check the current escrow/milestone mechanism on the help page — it may change).

### 5. Step 4 — Write Scope / Out of scope / Assumptions (English, ready to use)
~~~text
Proposal / Scope section (booking REST API — assumed MVP)

Scope (included):
- REST API for a simple booking flow (assumed: single resource type, e.g., rooms or time slots).
- Authentication (assumed): basic JWT login or API key (to be confirmed).
- Resource/slot management: minimal CRUD/list endpoints as agreed in the API spec.
- Booking operations: create, view, cancel bookings with conflict/overlap checks based on agreed rules.
- Input validation, consistent error responses, and basic pagination/filtering where needed.
- Automated tests for core flows (unit/integration, agreed level).
- API documentation (OpenAPI/README) and a short handover/runbook.
- Support for deployment to the client's staging environment (access and environment details provided by client).

Out of scope (not included in this fixed price):
- Payment processing, invoicing, refunds, or third-party payment integrations.
- Mobile/web frontend or admin UI.
- Multi-tenant architecture, complex role hierarchies, or advanced permissions beyond the agreed auth.
- Notifications (email/SMS/push), calendar sync, or third-party integrations not listed above.
- Production operations/SLA, 24/7 on-call, or ongoing maintenance after handover (can be a separate contract).
- Data migration from an existing system unless specified and estimated separately.
- Features not described in the approved API spec/milestones.

Assumptions:
- Client provides timely access (staging, repo or delivery method, DB/environment) and one point of contact for decisions.
- Requirements will be clarified and the API spec approved before Milestone 2 implementation proceeds.
- "Booking conflict" rules, time zone handling, and booking states (e.g., pending/confirmed/cancelled) will be agreed in writing.
- Third-party services/accounts (if any) are provided and working; delays caused by missing access may affect timeline.
- Change requests (new features or changes to approved scope/rules) will be estimated separately and scheduled after approval.

Milestones, acceptance criteria, and timeline will be confirmed in the contract messages before work starts.
~~~

### 6. Common mistakes
- Quoting while requirements are still one sentence: almost certainly a loss or a dispute. Force MVP/spec clarification.
- No Out of scope section: clients assume "booking system" includes payments, email, an app — block that expectation.
- One large fixed-price chunk without milestones: very high payment risk and drift risk.
- Skipping the buffer: every dev estimate has uncertainty; a buffer is risk management, not "padding the price".
- Accepting "small" changes for free repeatedly: use change requests (re-estimate, approve, then do).

### Checklist
- [ ] Clarify MVP: who uses it, core flow, business rules (overlap, states, time zones), stack, auth.
- [ ] Write a WBS (small pieces), estimate hours per piece; add a 15–30% buffer depending on vagueness.
- [ ] Split into 3–5 milestones, each with output + acceptance criteria + payment share.
- [ ] Write clear Scope / Out of scope / Assumptions in English; get the client to confirm via message/contract.
- [ ] Check Upwork fixed-price/escrow/milestone mechanics (change over time; as of this writing service fee 0–15%/contract, fixed at start).
- [ ] Agree on the change-request process: out-of-scope change → re-estimate → approve → then do.

> Senior tip: fixed-price safety is not "guessing the hours right" but **turning a vague project into clear decisions**. If the client cannot answer about overlap rules, booking states or time zones, sell a small paid discovery/spec milestone first. Paying a few hundred USD to lock the spec is always cheaper than paying a few thousand USD (or losing a review) because you built the wrong thing.`,
    follow: [
      'If the client refuses milestones and wants to pay 100% only after everything is done, how do you negotiate or when should you decline?',
      'During M3 the client asks for "send a booking confirmation email". How do you handle the change request (sample English message)?',
      'Which technical risks of the booking problem (overlap, race condition, time zones) must be pinned in Assumptions to avoid disputes?'
    ],
  },

  'remote-031': {
    q: 'Workshop: your first week on your first Upwork contract (assumed). How do you run the kickoff call, obtain access (repo, environment), agree channels/hours, define the Definition of Done, and report on days 1–3–5? Includes sample messages.',
    a: `**Summary:** The first week decides most of the client's impression: they need to see you are **in control** (know what you need, ask the right questions, communicate clearly, deliver small but real). Run a short **kickoff** (kickoff meeting), get enough access, agree channels/hours/update cadence, align on the **Definition of Done** (definition of "done" — acceptance criteria), and send short reports on days 1, 3 and 5. The goal of week one: the environment runs + one small verifiable result.

### 1. Terms (explained from scratch)
- **Kickoff call** (kickoff meeting): the first meeting to align goals, scope, way of working, risks and next steps. Not just "saying hello".
- **Access** (access rights): access to the repo (source code), issue tracker (task management), staging/production environment (depending on role), docs, chat tools. Missing access is a blocker.
- **Definition of Done (DoD)**: the list of conditions for considering a task finished (e.g., code runs, tests pass, review done, docs updated, demoable). Without a DoD, "done" means something different to everyone.
- **Staging** (staging environment — a test environment close to production): where you check before real release.
- **Async update** (asynchronous update): a written report the client reads when free, suited to time-zone gaps.

### 2. Week-one goal (assumed, small Spring Boot job)
Assume you took a job "add an endpoint + fix a bug" in an existing Spring Boot service. Week one is not about "finishing everything", but achieving: (1) understand scope + DoD, (2) get the project running locally/staging, (3) deliver 1 small change with a test/demo, (4) set the communication rhythm.

### 3. Kickoff call: 20–30 minute agenda
~~~text
Kickoff agenda (send before the call):
1) Goal: what outcome matters most this week?
2) Scope & priorities: what is in scope now? what is explicitly out of scope?
3) Definition of Done: how will we verify each deliverable?
4) Access & setup: repo, branch strategy, staging, credentials/secrets process, issue tracker.
5) Communication: primary channel (on Upwork), meeting/overlap window, response-time expectation, update cadence.
6) Risks/blockers: missing info, dependencies, deadlines.
7) Next steps: what I will deliver by Day 3 and Day 5.
~~~

### 4. Requesting access — the right things, the safe way
~~~text
Sample access-request message (English, sent on Upwork after kickoff):
Hi [Client Name], thanks for the kickoff. To start smoothly, could you please help with access?

1) Source code: repo URL + permission (read/write to a feature branch) + branch/PR workflow.
2) Environment: staging URL and how to deploy/test there (or local setup steps if staging is not available).
3) Config/secrets: the safe way to get required env vars/credentials (please do NOT send secrets in plain chat;
    a secret manager or secure method is preferred).
4) Task tracking/docs: ticket/issue link, API spec, and any acceptance criteria.
5) Point of contact: who can unblock access or product questions?

I will confirm once I can run the project locally and will share a short Day 1 update.
Best, [Your Name]
~~~

Security note: do not request/receive production passwords unless needed; ask for least-privilege access; use a safe channel and process (see remote-025).

### 5. Aligning channels, hours, and DoD
~~~text
Sample working agreement + Definition of Done (English):
Working agreement (proposal for this contract):
- Primary communication: Upwork messages for decisions/scope/approvals (so we keep a clear record).
  (Optional calls: [tool/time], with a short written summary posted on Upwork.)
- Updates: brief async updates on Day 1, Day 3, Day 5 this week; then [daily/2–3 times per week] as agreed.
- Overlap window (if needed): [time range + both time zones] — I will propose options if this changes.
- Definition of Done for each task (unless we agree otherwise):
  (1) Implementation matches the agreed acceptance criteria.
  (2) Relevant automated tests added/updated and passing locally/CI as applicable.
  (3) No secrets committed; basic error handling/validation included where relevant.
  (4) Short note in PR/commit or message: what changed, how to test, known limitations.
  (5) Demo or steps to verify on staging/local.
- Scope changes: I will estimate impact (time/cost) and wait for your approval before implementing out-of-scope work.

Please let me know if you want to adjust any point.
~~~

### 6. Reports on Day 1 / Day 3 / Day 5 (short, with evidence)
~~~text
Day 1 update (assumed):
Subject/Message: Day 1 update — [contract/job name]
- Done today: confirmed scope/DoD; requested access (repo + staging). Reviewed README and API spec.
- In progress: waiting for staging credentials; setting up project locally with available info.
- Next: run service locally, reproduce the reported bug, share findings.
- Blockers: need staging/env access (requested above). No scope changes.

Day 3 update (assumed):
- Done: local setup complete; reproduced bug on endpoint /api/orders (timeout under condition X). Added failing test.
- Plan: implement fix (adjust query/batch fetching — to be confirmed after root cause), verify on staging.
- ETA for first deliverable: Day 5 (if no new blockers).
- Blockers/Questions: please confirm expected response shape for error case Y.

Day 5 update (assumed):
- Delivered: fix for [issue], PR/commit [ref if applicable], tests passing for the case. Steps to verify: [1-2-3].
- Result: local/staging check shows [measured outcome, e.g., endpoint responds within expected range — assumed if numbers available].
- Remaining: [small follow-up] — within/outside scope (clarify). Awaiting your review/feedback.
- Next week proposal: [items] if you approve.
~~~

### 7. Common first-week mistakes
- Going silent while waiting for access: the client thinks you are not working. Report blockers early and state exactly what you need.
- Receiving secrets over chat or hard-coding them: a security risk from day one.
- Not aligning on a DoD: at week's end you say "done", the client says "not what I meant".
- Doing too much before understanding scope: easy to drift and hard to accept.
- Many meetings but no written summary: decisions get forgotten or drift.

### Checklist
- [ ] Run a 20–30 minute kickoff with the agenda; post a summary of decisions on Upwork.
- [ ] Get enough access (repo, staging, task/docs, safe secrets process) and confirm when local/staging runs.
- [ ] Align on the primary channel (prefer Upwork for decisions), overlap hours (if needed), and report cadence.
- [ ] Agree on a Definition of Done per task (acceptance, tests, how to demo/verify, change notes).
- [ ] Send updates on Day 1–3–5: Done / In progress / Next / Blockers / Questions.
- [ ] Deliver at least one small verifiable result in the first week (small fix, PR, root-cause analysis, or short demo).

> Senior tip: in week one, **the speed of building trust** matters more than the speed of code. A client hiring a newcomer is buying "peace of mind". A clear Day 1 update while you are still waiting for access is better than three silent days followed by rushed code. Turn invisible work (reading code, setting up the environment, analysis) into tangible evidence: a summary message, a checklist, a reproduced bug test, or a short demo.`,
    follow: [
      'The client is slow to grant access for 3 days. How do you still create value and communicate without going out of scope?',
      'How does the Definition of Done for a "bug fix" API differ from a "new feature"? Give a concrete example.',
      'You discover the week-one requirement conflicts with an earlier message. How do you handle it and record the new decision on Upwork?'
    ],
  },

  'remote-032': {
    q: 'Workshop: you hit a bad review or a difficult client (constantly changing requirements, demanding free out-of-scope work, or going silent). How do you classify the situation, decide when to end the contract early, and respond to a public review professionally?',
    a: `**Summary:** A "difficult client" is not one type: constantly changing requirements, demanding free out-of-scope work, and going silent are three different problems that need different handling. Principle: **diagnose → set boundaries in writing → give clear options**; if the relationship is no longer safe or productive, end the contract early professionally. For a bad public review, respond briefly, honestly, without attacking, focused on facts and how you handled it — because the real readers are **future clients**.

### 1. Terms (explained from scratch)
- **Scope creep** (scope creep): new requests beyond the agreed scope. If unmanaged, you do extra work unpaid.
- **Change request** (change request): the process of proposing a change: describe the change → estimate time/cost → client approves → only then do it.
- **Off-platform** (off-platform): moving communication/payment outside Upwork — risk of violating terms and losing protection.
- **Public response** (public response): the freelancer's reply shown under a review; not a place to win an argument.
- **End contract** (end contract): closing the contract on the platform. An administrative step; it needs a clean handover and evidence preserved.

### 2. Classify three kinds of difficult client and how to handle them
| Type | Signs (assumed) | Goal | Concrete actions |
|---|---|---|---|
| (A) Constantly changing requirements | "Add this screen too", "tweak the booking rule", new request every day | Keep scope controlled without breaking the relationship | Remind of agreed scope/DoD; batch new requests into a change request (estimate + approval); prioritize via backlog |
| (B) Demanding free out-of-scope work | "This is quick, just do it", "other freelancers do it free" | Protect boundaries while staying polite | Respectfully decline the out-of-scope part; offer 2 options: (1) scope swap (drop lower-priority items) or (2) add a paid milestone/hours |
| (C) Silent / no response | No milestone approval, no answers, no access | Open up information, avoid working blind | Short async updates, list blockers and decisions needed; pause parts that depend on decisions; if it drags, clearly propose pausing/closing the contract |

### 3. Sample messages (English) for each type
~~~text
(A) Scope creep — new request:
Hi [Client Name], thanks for sharing the new idea about [new request].
Based on our agreed scope (Milestone [X]: [summary]), this item is outside the current scope.
I can help in one of these ways:
1) Change request: I estimate [Y hours / $Z] and can deliver by [date] after your approval.
2) Scope swap: if you prefer to keep the same budget/timeline, we can replace [lower-priority item] with this request.
I will wait for your confirmation before starting work on this new item. Best, [Your Name]
~~~
~~~text
(B) Demanding free work:
Hi [Client Name], I understand you would like [request] included. I want to be transparent: that work is not part of
the agreed scope/acceptance criteria for [milestone/contract].
I am happy to support it as a small additional milestone (estimate: [time/cost]) or we can adjust priorities within
the current scope. Please tell me which option you prefer, and I will proceed after your approval. Best, [Your Name]
~~~
~~~text
(C) Silence — surface blockers and next steps:
Hi [Client Name], quick check-in on [project]. I have completed [done] and shared [evidence/demo] on [date].
I am currently blocked on: [decision/access/feedback needed].
To keep progress predictable, I can: (1) continue with [non-blocked item, if any] within scope, and (2) pause work that
depends on your input until we confirm [specific question].
Could you please reply with [specific decision] by [reasonable date]? If priorities have changed, I am also open to
closing/pausing the contract with a clear handover. Best, [Your Name]
~~~

### 4. When to end the contract early (deliberately)
Ending early is not "running away" — it is a risk-management decision when: (1) scope keeps changing and the client refuses change requests; (2) you are repeatedly asked to do out-of-scope work for free; (3) missing access/decisions drag on so you cannot finish; (4) there are signs of violating terms (pushing payment/work off-platform); (5) communication is disrespectful or the environment is unsafe.
**Before closing**: send a handover (what was done, status, files/commits, next steps), resolve what you can within the agreed scope, keep all communication on Upwork. Do not keep doing unpaid out-of-scope work to "save the review".

### 5. Responding to a bad public review — principles
The readers are future clients. Goal: look professional, stick to facts, do not argue. Suggested structure (short): thank/acknowledge the experience → state objective facts (scope/what was delivered, without leaking secrets/NDA) → state how you tried to resolve it → wish them well. Avoid: personal attacks, long venting, leaking client data, blame.

~~~text
Sample public review response (assumed, neutral):
Thank you for the feedback. I am sorry to hear the outcome did not meet your expectations.
On this contract, I delivered [factual items within the agreed scope, e.g., milestones X–Y with demo/notes] and
communicated updates on Upwork. When concerns were raised, I offered [specific options: revision within scope /
a change request for additional features / a handover].
I appreciate the opportunity to work together and wish you success with the project.
~~~
~~~text
Sample when the core issue was scope (assumed):
Thank you for sharing your feedback. For this project, I completed the deliverables defined in the agreed scope
([brief factual summary]). Additional requests were discussed as out of scope, and I offered to estimate them as a
separate change request. I remain committed to clear communication and defined acceptance criteria in future work.
~~~

### 6. Consequences and protecting your profile (reality)
One bad review hurts trust, but a run of good contracts afterward rebalances the picture. Do not try to "erase" the emotion by arguing; invest in: tighter scope/DoD, reviews from well-fitting contracts, and a better first-week process (remote-031). On platform mechanisms around feedback/JSS: rules may change — check the Upwork help page; do not rely on unofficial "tricks".

### 7. Common mistakes
- Saying "ok" to everything to avoid conflict: scope debt explodes later.
- Arguing in a public review: you may be right, but you look unprofessional to new clients.
- Threatening, attacking, or moving work off-platform when tense.
- Ending a contract without a handover: hurts both sides and makes you look irresponsible.

### Checklist
- [ ] Classify the issue: scope creep (A), free out-of-scope demand (B), or silence/blocker (C).
- [ ] Reply in writing on Upwork: remind of scope/DoD, offer options (change request/scope swap/pause).
- [ ] Keep evidence: agreed scope, messages, delivery artifacts, demo (see remote-012).
- [ ] If ending early: announce clearly, send a handover, close the in-scope part possible, stay professional.
- [ ] Bad review: short, honest, no attacks, focused on facts and how you handled it.

> Senior tip: early in your freelance career, treat boundaries as a service to the client, not a fight. Clear scope, change requests and calm communication make projects predictable — that is what clients actually pay a senior for. A professional public response to a bad review often wins more future work than a perfect 5.0 with no hard situations, because it shows how you behave under pressure.`,
    follow: [
      'A client insists on "just one more small change" three times in a row. How do you stop the pattern without losing the relationship?',
      'How do you write a public review response that is honest but does not reveal confidential client information (NDA)?',
      'When ending a contract early, what should the handover include so the client can continue (and you leave professionally)?'
    ],
  }

});
