/*
 * English translation of js/data/q-remote.js — task T997. Format: js/core/i18n.js (content overlay).
 * ids: remote-038 remote-039 remote-040 remote-041 remote-042 remote-043 remote-044 remote-045 remote-046
 */
App.i18n.content({
  'remote-038': {
    q: 'What does a toolkit for a remote Java freelancer include: time tracking, task management, invoicing, password management, backups, and a handover process? Should you use a separate machine for each client?',
    a: `**Summary:** A professional freelancer runs a personal "operating system": tools for **time tracking**, **task management** (work to do), **invoicing/records**, **password management** (a password manager — a tool that stores passwords/secrets securely), **backups**, and a **handover process** (handover — README/runbook, how to run the system, how to get access). The goal is not to use many apps, but to make work measurable, prevent data loss, avoid leaking secrets, and let the client take over when the engagement ends. Using "a separate physical machine for each client" is usually impractical; instead use separated accounts/browsers/profiles, disk encryption, and compliance with the client's/contract's security requirements.

### 1. Why you need a toolkit (not "toys")
When you are an employee, the company handles processes and tools. When you freelance, you are the whole operations team: forgetting to log hours → losing proof/money; losing files → missing deadlines; leaking passwords → a security incident; a poor handover → losing the client/reputation. A toolkit makes quality repeatable.

### 2. Tool groups and their roles
| Group | What it does | Example functions (brand-agnostic) | Notes |
|---|---|---|---|
| Time tracking | Record hours worked (especially on hourly contracts), attach tasks/descriptions | Start/stop timer, notes, export reports | Be honest; describe clearly so the client understands the value |
| Task management | Know what you are doing, what is next, what is blocked | Board/list (to do → doing → done), deadlines, priorities | A single "source of truth"; update asynchronously |
| Invoicing & records | Issue invoices, track paid/unpaid, store files | Invoice number, due date, store PDFs/receipts | Match the SOW/milestones; keep for taxes/disputes |
| Password management | Store passwords/2FA/secrets securely, avoid password reuse | Encrypted vault, strong password generation, secure sharing (if needed) | Enable 2FA for important accounts; do not send secrets over normal chat |
| Backups | Protect against data loss (broken machine, accidental deletion) | Back up code (git remote), documents, encrypted copies; test restores | "Having a backup" is not enough — you must test recovery |
| Notes/documentation | Decisions, context, runbooks | Markdown/docs, links to tickets/PRs | Helps handover and helps you remember later |

### 3. The handover process — step by step
A handover is when the client (or another developer) takes over without needing you by their side.

~~~text
Handover checklist (English/Vietnamese, depending on the client; hypothetical):
1) README: what the project does, a short architecture overview, how to run locally/staging, required environment variables (do NOT write secrets).
2) Runbook: how to deploy, how to roll back, how to view logs/metrics, how to handle common incidents.
3) Secrets/access: hand over through the secure channel the client requires (vault/secret manager), revoke access you no longer need.
4) Status: what is completed (link PRs/tickets), what remains (backlog), known issues.
5) Testing: how to run tests, critical tests; CI status.
6) Handover meeting: 20–30 minute walkthrough + notes of Q&A.
~~~

~~~text
Handover message template (English):
Hi [Name], I have prepared the handover for [project]:
- README & setup: [link]
- Runbook (deploy/rollback/logs): [link]
- Completed items: [PRs/tickets]. Open items/known issues: [list]
- Access/secrets: [handled per agreed secure process]. I can join a 30-min walkthrough on [times].
Please let me know if anything is missing.
~~~

### 4. Should you use a separate machine for each client?
- **One physical machine per client**: safe in terms of separation but expensive, hard to maintain, and usually unnecessary unless a contract/specific security policy requires a provided/controlled device.
- **Recommended in practice (at the mechanism level)**: disk encryption, screen lock, keep the OS updated; use **separate browser profiles/system accounts** per client (reduces cookie/login mixing); use **separate repos/workspaces**; keep secrets in a password manager/secret manager, never hard-code them; enable 2FA; follow the client's policy (some clients provide a machine/VDI — Virtual Desktop Infrastructure, a remotely hosted virtual desktop). If the client requires a managed device (MDM) or VDI, comply per the contract.
- Always read the NDA/security policy: some domains (finance, healthcare) have strict requirements.

### 5. Example "one operating day" (hypothetical)
~~~text
Morning: open the task board → pick 1 priority item → start the time tracker with the description "Fix N+1 on GET /orders (SOW#1)".
During the day: small commits, PRs with descriptions; fetch secrets from the password manager/vault, do not paste them into chat.
End of day: post an async update (Done/Next/Blocked) on the agreed channel; export the time log (if hourly).
End of week: prepare the milestone/hourly invoice from the log + SOW; store records; verify repo/docs backups.
~~~

### 6. Common mistakes
- Reusing one password everywhere; sending passwords over normal chat/email.
- No git remote/backup: a broken machine means losing history.
- Vague time logs ("coding 8h"): the client does not understand and disputes are easy; attach a task description.
- No handover: when the engagement ends, the client is stuck → bad review/relationship.
- Installing too many tools and then abandoning them: choose a minimal set you will actually maintain.

### Checklist
- [ ] Time tracking (if hourly or to measure performance): track hours + descriptions tied to tasks/SOW.
- [ ] One task management system (source of truth) + a habit of async updates.
- [ ] Invoice/records process: numbering, store PDFs, match the contract; keep payment statements.
- [ ] Password manager + 2FA; secrets never in code/chat; follow the client's secure sharing method.
- [ ] Backups: git remote + document backups; periodically test recovery.
- [ ] A reusable handover template (README/runbook/status/secure access) for every project.
- [ ] Separation per client (profiles/accounts/workspaces/encryption); use VDI/a client-provided machine if the contract requires it.

> Senior tip: a toolkit does not create professionalism — **the discipline to use it** does. A freelancer who sends clear invoices, logs hours honestly, keeps secrets safe, and delivers a clean handover will be trusted with larger work (and paid better) even with comparable coding skills. Optimize for "few things, used consistently," and make handover your default habit.`,
    follow: [
      'You work hourly but forgot to track time for 2 days. How do you handle it transparently with the client and prevent it from happening again?',
      'The client asks you to install a screen/device monitoring tool you do not fully understand. How do you assess the security/privacy risks and negotiate?',
      'Draft a minimal README/runbook for a Spring Boot + PostgreSQL service so another developer can take over in 1 hour.'
    ]
  },

  'remote-039': {
    q: 'You are freelancing for multiple clients at the same time. How do you plan your schedule, avoid missed deadlines, communicate when priorities conflict, and set hour limits to avoid burnout?',
    a: `**Summary:** Working with multiple clients means you are running several "commitments" in parallel. The main risks are missed deadlines, lower quality, and burnout (burnout — prolonged physical/mental exhaustion from sustained overload). The solution: **plan around real capacity** (capacity — the number of hours you can actually do good work), give each client clear goals/boundaries, make priorities transparent when conflicts happen, and say "no/not now" based on data (not gut feeling). Communicating early when there is a collision is always cheaper than apologizing late.

### 1. Core terms
- **Capacity**: the hours/energy you can spend on billable work (paid) and non-billable work (estimates, meetings, learning) each week — realistic, not aspirational.
- **Context switching**: jumping between multiple projects/clients reduces performance and increases mistakes. Every "jump" has a hidden cost.
- **WIP (Work In Progress)**: the number of items you are working on at the same time. High WIP → everything slows down.
- **Burnout**: prolonged exhaustion; signs: chronic fatigue, loss of focus, poor sleep, irritability, declining quality. It is not fixed by "pushing harder over the weekend."

### 2. Scheduling around capacity (step-by-step example)
Step 1 — Calculate real capacity (hypothetical): you have 30 hours/week for freelance (outside other work/life). Subtract ~20% for meetings, chat, context, and surprises → ~24 hours of "deep work." Do not sell 30 hours.
Step 2 — Assign an "hour budget" to each client based on commitments (SOW/retainer). Example: Client A 12h/week, Client B 8h/week, 4h buffer.
Step 3 — Use time blocks to reduce context switching. Example: A on Mon/Wed mornings, B on Tue/Thu mornings; afternoons for review/meetings/buffer.
Step 4 — Keep WIP low: 1–2 important items per day, do not open 6 tasks across 3 clients at once.

~~~text
Example weekly schedule (hypothetical, UTC+7):
Mon 08:30-11:30 Client A (deep work) | 13:30-15:00 messages/review | 15:00-16:00 buffer
Tue 08:30-11:30 Client B (deep work) | 13:30-15:00 Client A small tasks
Wed 08:30-11:30 Client A (deep work) | 13:30-15:00 calls/demos
Thu 08:30-11:30 Client B (deep work) | 13:30-15:00 admin/invoice/learning
Fri 08:30-10:30 wrap-up, handover notes | 10:30-12:00 buffer/overflow (do not plan 100% tight)
Rule: do not accept ad-hoc meetings in deep-work blocks except for incidents agreed in advance.
~~~

### 3. Avoiding missed deadlines
- **Realistic commitments**: promise delivery dates based on capacity + buffer, not the date the client "wants to hear." If needed, propose a smaller scope.
- **Small milestones**: deliver in parts early to surface risk; do not pile everything up at the end.
- **Early warning**: when you see a risk of delay (missing access, wrong estimate, illness), report it immediately with options (reduce scope, move the date, add help if both sides agree). Silence until the deadline is the worst outcome.
- **Clear Definition of Done**: avoid being "done" forever because the criteria are vague.

### 4. Priority conflicts: transparent communication
Conflicts happen when two clients both need something urgent at the same time. Do not silently sacrifice one side.

~~~text
Priority-conflict message template (English, honest, no blame):
Hi [Client A], I want to flag a scheduling conflict: I have a committed deliverable for [date] and [Client B request]
also came in as urgent. My available capacity this week is [X hours] already allocated as agreed.
Options: (1) I deliver [Client A item] by [date] as planned and start [new request] on [date]; or (2) if [new request]
is higher priority, we move [lower item] to [new date] with your confirmation. I can recommend option (1/2) because
[reason]. Please let me know which you prefer.
~~~

Principles: reference existing commitments (SOW/retainer), present options + impact, ask for a decision. Do not promise both if you lack capacity. Do not speak badly about the other client.

### 5. Hour limits and preventing burnout
- Set a **weekly hour cap** and a cap on simultaneous active clients (hypothetical example: at most 2 active clients or 25 billable hours) — the number is up to you, but you must have one.
- Keep a **buffer** (do not schedule 100%). Keep **days/time off**.
- Watch for burnout signs: if you are exhausted for 2 weeks in a row, reduce WIP, renegotiate scope, or pause taking new work.
- A client's "urgent" is not automatically your urgent: check the contract/SLA; work outside hours/scope needs agreement (fee/priority swap).

### 6. Common mistakes
- Taking on more clients out of fear of having no work: overload → miss deadlines for both → lose both.
- Not saying "no": leads to false promises.
- Reactive work (replying to every message instantly): breaks deep work. Set response-time expectations.
- Dropping the buffer: one small production bug can collapse the whole schedule.
- Measuring success by hours, not by outcomes/sustainable capacity.

### Checklist
- [ ] Calculate real capacity (hours/week) and caps on clients/WIP; commit only within capacity.
- [ ] Each client has a clear SOW/retainer (scope, hours, priorities, response time).
- [ ] Time block per client to reduce context switching; keep a buffer.
- [ ] Report delay risks early with options (scope/date/priority).
- [ ] On priority conflicts: message transparently, offer options + impact, ask for confirmation.
- [ ] Set hour limits and time off; watch for burnout signs and adjust load.

> Senior tip: the real strength of an experienced multi-client freelancer is not "working 60 hours/week" but **keeping promises consistently**. Someone who works 20 hours but always delivers on time, communicates clearly, and knows when to decline has higher long-term value than someone who accepts everything and then collapses. Protect your capacity like you protect your reputation — because they are the same thing.`,
    follow: [
      'Client A and Client B both report an "urgent" issue the same morning. What criteria do you use to decide the order, and how do you communicate it?',
      'You realize you have oversold your capacity by 30% this month. How do you adjust commitments and client expectations without burning the relationship?',
      'How do you design a retainer (weekly hour package) to reduce priority conflicts compared with taking many ad-hoc jobs?'
    ]
  },

  'remote-040': {
    q: '(lead) You want to move from a freelancer who "sells hours" to selling services: productize (a fixed-scope package like "API performance audit"), a monthly retainer, or hiring help/forming a small team. How do you design it, how do you price it at the mechanism level, and what are the quality/legal risks?',
    a: `**Summary:** To "productize" (turn a custom service into a fixed-scope, repeatable package) and a **retainer** (a recurring monthly fee for capacity/availability) helps you move beyond pure hourly selling: the client buys **clear outcomes/scope**, and you gain leverage if your process is solid. Hiring help/forming a small team increases capacity but creates **quality** risks (you own the output) and **legal/contract** risks (subcontracting, confidentiality, IP, who signs with the client). Design it with: bounded scope, a repeatable process, value/capacity-based pricing (do not invent market numbers), and clear contracts/operations.

### 1. Core terms
- **Productized service**: a service with fixed scope, inputs/outputs, timeline, and a fixed or tiered price. Example: "API Performance Audit for Spring Boot" — not "do anything on an hourly basis."
- **Retainer**: the client pays periodically (monthly) to reserve a level of availability/capacity/service (e.g., X support hours + response within Y business days). Different from a one-off project.
- **Subcontracting**: you hire someone else to do part of the work; the client still contracts with you → you are responsible for quality, deadlines, and confidentiality.
- **Leverage**: increasing revenue/impact without linearly increasing the hours you personally work — achieved through process, packages, or a team.

### 2. Three transition models (mechanism comparison)
| Model | What you sell | Advantages | Main risks | When it fits |
|---|---|---|---|---|
| Productized service (fixed package) | A result within a fixed scope (audit, small migration, CI setup) | Easy to sell, repeatable process, value-based pricing | Wrong scoping → hour loss; client asks for extras outside the package | You have repeated the same work enough times |
| Monthly retainer | Monthly capacity/availability (hours, response SLA, maintenance) | More predictable income; long-term relationship | Treated as "do anything"; overcommitting capacity | You have trusted clients with ongoing needs |
| Hiring help/a small team | Team capacity under your brand/commitment | Take larger work; leverage | Uneven quality, confidentiality/IP risk, more complex management/legal | Stable pipeline + process + clear contracts |

### 3. Designing an "API performance audit" package (example, hypothetical)
~~~text
Package: Spring Boot API Performance Audit (productized, hypothetical)
Client-provided inputs: read access to staging/logs/metrics (or anonymized data), a list of slow endpoints, goals.
Scope (in): up to N endpoints, p95/p99 analysis, DB queries (EXPLAIN), basic thread/connection pool review,
a report of root causes + prioritized recommendations.
Out of scope (out): large architecture rewrites, third-party infrastructure optimization, direct production code
changes (can be offered as an add-on).
Deliverables: report (PDF/doc) + a 60-minute review call + a proposed change list (quick wins vs long-term).
Timeline: e.g., X business days after access is granted (set by you based on capacity).
Price: fixed package (set by value/implicit hours + risk; do not invent public market numbers). Deposit before start.
Scope changes: handled via a change request.
~~~

### 4. Pricing at the mechanism level (no invented numbers)
- **Value-based**: what does the client save/earn (reduced downtime, faster response time affecting conversion)? Price reflects part of that value, not just hours.
- **Capacity + risk**: for a retainer, tie price to the capacity you reserve and response time; include non-billable hours, taxes/fees, and buffer.
- **Tiered packages** (good/better/best): e.g., read-only audit vs audit + help implementing 1 fix — lets the client self-select.
- Always know your **floor** from costs + taxes + real time (see the rate/capacity questions). A fixed package loses money if scope overruns.

### 5. Quality and legal risks when hiring help
- **Quality**: someone else's output carries your name/commitment. Mitigate with: code review process, Definition of Done, checklists, least-privilege access, and do not hand off parts you cannot control.
- **Confidentiality/NDA**: the client signs an NDA with you; if you use a subcontractor, your contract with them must impose equivalent confidentiality duties and be permitted by the original contract. Many NDAs forbid sharing data with third parties without written consent — **read the contract**.
- **IP**: be clear who owns code produced by the helper; tie it to payment; avoid ambiguity.
- **Worker classification/taxes** (general principle): hiring someone in Vietnam vs abroad has different legal/tax consequences — **consult a legal/tax professional**, do not guess.
- **Platform dependency**: if you find clients through Upwork, having someone else do the work for you may be limited by platform terms — check the official terms at the time you do it.

### 6. Common mistakes
- "Productized" but the scope is still vague: it becomes an hourly project in disguise, and you lose money.
- An unlimited retainer: the client treats it as all-you-can-eat requests.
- Hiring people before you have a process/DoD: quality breaks and you become a firefighting bottleneck.
- Sharing the client's repo/data with a collaborator without checking the NDA/contract.
- Pricing only by looking at competitors (unverified numbers): ignoring your own costs/risks.

### Checklist
- [ ] Pick 1 service you have repeated; write the package: inputs, in/out, deliverables, timeline, scope changes.
- [ ] Price by value/capacity + know your cost floor; add a deposit and a change-request process.
- [ ] Retainer: specify capacity, response time, out of scope, reporting; review capacity periodically.
- [ ] Before subcontracting: have a process/DoD/review; check the original NDA/contract on sharing/third parties.
- [ ] Contract with collaborators: scope, confidentiality, IP, payment, termination (consult a lawyer when needed).
- [ ] Track quality (reviews, recurring defects, client feedback) — leverage is only sustainable when quality is.

> Senior tip: productizing and retainers are an **operations** problem, not just a pricing problem. Any package where you cannot describe "what done means" and cannot repeat the process should not be packaged yet — sell it as a tightly scoped project first. And only scale the team when you can control quality without doing everything yourself; otherwise you are buying revenue with your reputation.`,
    follow: [
      'A client wants to buy a fixed audit package but keeps adding endpoints outside scope. How do you use a change request and package structure to handle it?',
      'You want to hire another freelancer to handle 20% of the tasks. Which clauses do you check in the NDA/contract with the client and with the subcontractor before sharing access?',
      'When is a retainer less attractive than a milestone-based project for you, considering capacity risk and cash flow?'
    ]
  },

  'remote-041': {
    q: '(lead) What are the career risks of a remote freelancer: dependence on one client, uneven income (how many months of emergency fund), self-funded insurance, skills falling behind, isolation? How do you build a contingency plan?',
    a: `**Summary:** Freelancing trades the stability of "a monthly salary from one place" for freedom and volatility. The core risks: **dependence on one client** (losing them = losing most of your income), **uneven income** (you need an emergency fund), **self-funded insurance/benefits** (different from being an employee), **skills falling behind** (no one forces you to learn), and **isolation** (lack of peers/feedback). Reduce risk with a diversified client/channel mix, a cash buffer, disciplined learning and community, and a contingency plan written down in advance — not after a crisis.

### 1. Core terms
- **Concentration risk**: too much income depends on one source (one client, one platform). If that source has a problem → you take a big hit.
- **Emergency fund**: cash/highly liquid assets reserved for living expenses when income drops suddenly. "How many months" depends on fixed costs, dependents, and income volatility — there is no single right number for everyone.
- **Runway**: how long you can "survive" if income falls to 0 (emergency fund / monthly expenses).
- **Upskilling**: proactively improving your skills so you do not become outdated.
- **Isolation**: working alone with little professional/social interaction — it affects mental health and decision quality.

### 2. Risk map and mitigations
| Risk | Symptom (hypothetical) | Mitigation | Warning signal |
|---|---|---|---|
| Dependence on 1 client | 80–100% of income from one place; they cut scope/end the contract | Diversify to 2–3 sources; keep warm channels (LinkedIn/referrals); add a small second retainer when you have capacity | You are afraid to say "no"; no pipeline |
| Uneven income | High months and low months; late payments | Emergency fund; deposits/milestones; price by real net; conservative cash-flow forecasting | You do not know how you will cover next month's expenses |
| Self-funded insurance/benefits | No employee package; illness/accident risk | Research suitable insurance (health/accident/income — based on needs); include this cost in your rate; **consult a professional** | "Hoping for the best," no protection fund set aside |
| Skills falling behind | Only repetitive work, no learning; stack changes fast | A regular learning plan (e.g., 3–5h/week), small/open-source projects, new case studies | Not confident taking new work; weak in interviews |
| Isolation | Little technical exchange, low motivation, one-sided decisions | Community (meetups/online), peer review, mentor/fellow freelancers, knowledge sharing | A whole week passes with no technical discussion with anyone |

### 3. Emergency fund: how to think about it (no "standard" number)
- Calculate **fixed monthly expenses** (housing, food, family, mandatory payments). Freelance income is volatile, so the fund often needs to be **larger** than what feels safe for someone with a stable salary.
- Set a target runway based on: the average time to land a new contract (estimated from your history), dependents, and health risks. Many people aim for a range of several months to many months; the exact number is a personal decision — plan conservatively.
- A buffer is not only money: **pipeline** (opportunities you are discussing), **sellable skills**, **relationships** (referrals). That is your "career buffer."

~~~text
Planning exercise (hypothetical, fill in your own numbers):
1) Fixed monthly expenses: [your number]  → current runway = fund / expenses = [__ months]
2) Income sources: Client A __%, Client B __%, other __%  → concentration risk if one source > 50%?
3) Pipeline for the next 30 days: [number of real opportunities, rough probability]  → if Client A stops, runway + pipeline = ?
4) Buffer target: [__ months runway] + [__ opportunities in pipeline] before taking big risks (e.g., a long break).
5) Actions this quarter: grow the fund by __, open 1 second channel/client, lock in 1 new skill with proof.
~~~

### 4. Insurance and obligations (general principle)
- Employees often receive benefits handled by the company (depending on location); freelancers usually arrange/pay for them themselves. Insurance types (health, accident, statutory coverage) and tax/social-insurance obligations depend on your personal situation and Vietnamese law — **consult a professional/accountant/licensed agent**. Include this cost in your rate/capacity (see the rate calculation questions).
- Do not treat "young and healthy" as a plan.

### 5. Preventing stagnation and isolation
- **A fixed learning schedule**: tied to career goals (e.g., "Spring Boot performance + PostgreSQL + 1 cloud topic" this quarter) and producing proof (a short write-up, an open-source PR, an anonymized case study).
- **Community**: tech groups, meetups, forums; set a goal of 1 quality interaction/week (ask/answer/review).
- **Peers**: find 1–2 people at a similar level to exchange proposals, review designs, do mock interviews — reduces isolation and improves quality.

### 6. A contingency plan (written down)
~~~text
Contingency playbook (hypothetical):
- If you lose a major client: (1) cut non-essential costs; (2) activate outreach/referrals within 48h; (3) prioritize small jobs to keep cash flow; (4) do not slash your rate below the floor unless you have a clear strategy.
- If you are sick/interrupted: notify clients early, propose moving the deadline/reducing scope/handover support; use buffer/emergency fund.
- If you are burned out: reduce WIP, pause taking new work, restore health before optimizing revenue.
- If income stays below your floor for 3 months: diagnose the cause (channel, niche, proof, price), activate a backup channel or consider a part-time contract/temporary pivot.
~~~

### Checklist
- [ ] Calculate fixed expenses and runway; set an emergency-fund target that fits your situation (review quarterly).
- [ ] Measure concentration risk: do not let 1 client/1 channel dominate all income long term.
- [ ] Deposits/milestones + keep records + conservative cash-flow forecasting.
- [ ] Research suitable insurance/taxes with a professional; budget this into your personal business costs.
- [ ] A regular upskilling schedule + new proof (case study/PR); join a community/peers to reduce isolation.
- [ ] Write a contingency playbook (lost client, illness, burnout, income drop) and review it every 6 months.

> Senior tip: a sustainable freelancer runs their career like a one-person small business (solopreneur): revenue is only part of it; risk and resilience determine whether you last 5 years or 5 months. Track three simple metrics every month — **runway (months)**, **% of income from the largest source**, and **a pipeline of real opportunities** — and act when a metric worsens, not when you are already in crisis.`,
    follow: [
      '70% of your income comes from a single retainer client. What concrete steps do you take over the next 90 days to reduce concentration risk without damaging the relationship?',
      'You want to take 4 weeks off with no project work. How do you prepare financially, manage commitments with clients, and plan your return?',
      'How do you distinguish a "normal temporary low-income period" from a signal that you need to change your niche/channel/strategy?'
    ]
  },

  'remote-042': {
    q: 'An overall map of job sources for a Java developer in Vietnam: what are the 5 source groups and when should you choose each one?',
    a: `**Summary:** There is no single "best" source; each group fits a different stage. A developer new to remote work should pick 2–3 main sources instead of spreading themselves thin everywhere.

### 5 source groups

| Group | Examples | Who it fits | Competition | Time to get a job | Relative income | Risk |
|---|---|---|---|---|---|---|
| (a) Vietnam IT job boards | ITviec, TopDev, VietnamWorks, TopCV | Devs not yet remote who want a Vietnamese company | Low–medium | Fast | Low–medium | Low |
| (b) LinkedIn + recruiters/headhunters | LinkedIn Jobs, InMail from recruiters | Devs who want a foreign company and have a strong profile | Medium | Medium | Medium–high | Low |
| (c) International remote job boards | We Work Remotely, Remote OK, Remotive, Wellfound | Devs with strong English who are confident working remote | High | Slow–medium | High | Medium |
| (d) Vetted engineer networks + freelance marketplaces | Toptal, Arc, Turing, Upwork | Devs who want higher rates and are ready for screening tests | Very high | Slow (screening rounds) | Highest | Medium–high |
| (e) Communities & referrals | Hacker News "Who is hiring", Reddit, Discord/Slack, open source | Devs with a network who can write/share | Low (if you have a referral) | Fastest | Variable | Depends on network |

### Choosing 2–3 sources by stage

- **Stage 0 (not yet remote, weak English)**: (a) + prepare English; use the app at #/speak and #/interview.
- **Stage 1 (English is OK, no remote experience yet)**: (b) LinkedIn + (a) hybrid remote.
- **Stage 2 (full-time remote)**: (c) + (b) foreign recruiters.
- **Stage 3 (freelance/high rate)**: (d) + (e) referrals.

### Common mistakes

- Spreading your CV across all 5 groups at once → not enough time to follow up on each application.
- Using only source (c) when your English is still weak → rejected at the CV stage.
- Ignoring (e) because you think "I have no network" → a network can be built through small contributions.

### Checklist
- [ ] Identify your current stage (0–3) and choose 2–3 main sources.
- [ ] Create accounts on the chosen sources and complete a minimum viable profile.
- [ ] Set a weekly application target per source.
- [ ] Track applications in #/jobs, "Jobs I track" tab.
- [ ] Review each month which source is most effective.

> Senior tip: treat job search like a portfolio: diversify sources but focus on the 2–3 channels that deliver the highest conversion for you; measure conversion per source instead of guessing.`,
    follow: [
      'If you could choose only 1 source for the next 3 months, which one would you pick and why?',
      'How do you evaluate whether a source is "effective" beyond the number of applications submitted?',
      'When should you drop a source and move to a different group?'
    ]
  },

  'remote-043': {
    q: 'How to use LinkedIn effectively so foreign recruiters can find you: headline, About, Open to Work, skills, posts, and replying to InMail',
    a: `**Summary:** LinkedIn is a search tool for recruiters; your profile must contain the keywords they search for and a clear "open to work" signal.

### Headline

- Not just a job title; add your stack and value: "Senior Java Backend Engineer | Spring Boot, Kafka, AWS | Remote-friendly".
- Important keywords: Java, Spring Boot, Microservices, AWS... recruiters search by keyword.

### About

- 3–5 sentences: experience, domain, achievements with numbers, what you want (remote, timezone).
- Avoid empty buzzwords; include concrete examples.

### Open to Work

- **Public** (green frame): visible to everyone, including your current manager → risk.
- **Recruiters only** (hidden): safer; recruiters can still see it; recommended if you are currently employed.
- Set job titles, locations (remote), start date.

### Skills & endorsements

- List core skills; pin the top 3; ask colleagues for endorsements.

### Posts/sharing

- 1 post/month about a technical experience → increases visibility and credibility.

### Replying to InMail (English templates)

Interested:
~~~text
Hi [Name], thanks for reaching out. I'm open to discussing [role]. Could you share more about the team, tech stack, and compensation range? I'm available [days/times] for a quick call.
~~~

Not interested now:
~~~text
Thanks for reaching out. I'm not actively looking right now, but I'd be happy to stay connected and revisit in [X months].
~~~

Asking for salary first:
~~~text
Thanks for the message. Before we proceed, could you share the compensation range and whether the role is employee or contractor? This helps both sides save time.
~~~

### Checklist
- [ ] Write a headline with keywords + value.
- [ ] Complete the About section with numbers.
- [ ] Turn on Open to Work in recruiters-only mode.
- [ ] Pin top skills.
- [ ] Prepare 3 InMail reply templates.
- [ ] Post once a month.

> Senior tip: recruiters scan a profile in ~10 seconds; put the important information (stack, level, remote) in the headline and the first line of About, not buried at the bottom.`,
    follow: [
      'You are currently employed and worried your manager will see Open to Work. How do you configure it?',
      'How long should your headline be and which keywords should it contain?',
      'When should you decline an InMail, and when should you negotiate for more information?'
    ]
  },

  'remote-044': {
    q: 'Reading international remote job postings: worldwide remote vs timezone/country restrictions, "remote-first" vs "remote-friendly", contractor vs employee, filtering spam/scams, and tracking applications',
    a: `**Summary:** Not all "remote" roles are the same; you must read the conditions carefully before applying to avoid wasted time and legal risk.

### Variants of "remote"

- **Remote worldwide/anywhere**: work from anywhere; often contractor.
- **Remote within region/timezone**: limited to certain timezones/countries (e.g., US hours, EU hours) → a developer in Vietnam may be excluded if there is no overlap.
- **Remote-first**: the company designs its processes for remote work (async, docs, fewer meetings).
- **Remote-friendly**: remote is allowed but processes still revolve around a central office → you can easily become a "second-class citizen."

### Contractor vs Employee

| | Employee | Contractor |
|---|---|---|
| Insurance/benefits | Provided | Self-managed |
| Taxes | Withheld by the company | Self-filed |
| Stability | Higher | Lower, but more flexible |
| Rate | Lower gross | Higher to compensate for risk |

### Filtering spam/scams

- Red flags: paying a fee to apply, unrealistic salary, no company name, contact via Telegram/WhatsApp, requesting bank details early.
- Verify: company website, LinkedIn employees, Glassdoor/Blind, email domain.

### Tracking applications

- Use #/jobs, "Jobs I track" tab: save the link, status, application date, follow-up date.
- Create a secondary spreadsheet: company, position, source, date, status, next action.

### Checklist
- [ ] Read remote/timezone/country conditions carefully before applying.
- [ ] Determine contractor vs employee and the tax/insurance impact.
- [ ] Check for scam red flags.
- [ ] Save the application in #/jobs and set a follow-up date.
- [ ] Send a follow-up after 1–2 weeks if there is no response.

> Senior tip: treat each application like a mini-project: it has an owner (you), a deadline (follow-up), and a metric (response/interview); if a source converts below 5% after 20 applications, change the source or the CV.`,
    follow: [
      'How do you tell a truly "remote-first" company from one that is only "remote-friendly" as marketing?',
      'When does a higher contractor rate actually end up worse than an employee package in total benefits?',
      'You spot a job posting with red flags. How do you handle it, and should you warn the community?'
    ]
  },

  'remote-045': {
    q: 'Vetted engineer networks (Toptal/Arc/Turing): their model, screening rounds, how to prepare, and pros/cons',
    a: `**Summary:** These platforms are not job boards; they act as an "engineer agency" with a rigorous selection process, then match you with clients. Rates are high, but you must pass the tests.

### How the model works

1. You apply → screening (CV, English).
2. Technical rounds: algorithms, live coding, system design.
3. If you pass → you enter the pool → matched with clients based on demand.
4. The client interviews you as well (usually lighter) → the project starts.
5. The platform takes a % of the rate (often not disclosed precisely).

### Common screening rounds

- English (speaking/writing) — to communicate with clients.
- Algorithms/data structures — use the app at #/algo.
- Live coding — solve problems in real time.
- A small project or portfolio — to prove real-world experience.
- System design (for senior roles).

### Preparing with the app

- #/algo: practice patterns, use the timer.
- #/interview: multi-turn AI interviews with feedback.
- #/speak: practice spoken English, measure WPM/fillers.
- #/career: review your CV, STAR for experience stories.

### Pros and cons

| Pros | Cons |
|---|---|
| High rates, quality clients | Hard screening, low pass rate |
| No need to find clients yourself | Platform dependency, lock-in |
| Payment/contract support | Commission %, limited price control |
| Credibility after passing | Long onboarding time |

### Compared to finding clients yourself

- Finding clients yourself: price freedom, build your own brand, but it takes time for sales/marketing.
- Through a platform: faster to get work if you pass, but the rate is shared and you have less freedom.

### Checklist
- [ ] Choose 1–2 platforms that fit your stack (Java/Spring).
- [ ] Practice algorithms for 2–3 weeks before applying (#/algo).
- [ ] Practice spoken English (#/speak) and interviews (#/interview).
- [ ] Prepare a portfolio/case studies with numbers.
- [ ] Read the terms carefully (commission, non-compete, exclusivity).

> Senior tip: these platforms test "communication + technical skills," not just code; a strong developer with weak English can still fail. Invest in #/speak before you submit your application.`,
    follow: [
      'You fail Toptal\'s algorithm round. How do you retrain over 4 weeks?',
      'When should you choose a vetted platform instead of finding clients yourself?',
      'How do you avoid lock-in and keep your ability to negotiate rates?'
    ]
  },

  'remote-046': {
    q: 'Communities and referrals: why referrals have the highest success rate, and how to build a network through open source, blogging, and meetups',
    a: `**Summary:** Referrals work because they reduce risk for the hiring side; you build a network by giving value first, not by asking for favors.

### Why referrals convert so well

- A referred candidate is "vouched for" → many CV screening rounds are skipped.
- Recruiters trust people they know more than anonymous job board applicants.
- Referred candidates often fit the culture better (introduced by someone who understands the company).

### Building relationships through open source

- Contribute small PRs to Java libraries you use (Spring, Hibernate, Kafka client): fix docs, tests, small bugs.
- Each PR is a public "portfolio entry" and a chance to meet maintainers.
- You do not need large PRs; consistency matters more than size.

### Writing technical blog posts

- 1 post/month: a debugging story, a benchmark, a lesson learned.
- Publish on dev.to/Medium/LinkedIn; share in communities.
- A blog helps recruiters and peers remember you when there is an opening.

### Meetups & online communities

- Join Discord/Slack communities for Java/Spring; answer questions.
- Local meetups: give a short talk (lightning talk) about a real experience.
- Goal: become a "familiar face" in your niche.

### A referral request message template (not pushy)

~~~text
Hi [Name], I saw [Company] is hiring for [role]. I've been following your work on [topic] and learned a lot. Would you be open to referring me, or sharing what the team looks for? No pressure at all — I'm happy to chat first. Thanks!
~~~

Principles: ask for a referral after you already have a relationship; always give the other person an easy way to decline politely; do not spam.

### Checklist
- [ ] Pick 1 Java library you use and find a "good first issue."
- [ ] Submit 1 small PR this month.
- [ ] Write 1 technical blog post.
- [ ] Join 1 online community and answer 5 questions.
- [ ] List 10 people who could refer you and reach out to each with the template above.

> Senior tip: a network is not "people you know"; it is the total value you have given to the community. Start by helping others answer questions — reciprocity will follow naturally.`,
    follow: [
      'You have no network at all. In 90 days, how do you build a network from zero?',
      'When is asking for a referral too early and likely to damage the relationship?',
      'How do you measure the "effectiveness" of community activity against the goal of finding a job?'
    ]
  }
});
