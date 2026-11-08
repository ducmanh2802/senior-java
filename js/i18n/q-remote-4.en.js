/*
 * English translation of js/data/q-remote.js — task T992. Format: js/core/i18n.js (content overlay).
 * ids: remote-016 remote-017 remote-018 remote-019
 */
App.i18n.content({
  'remote-016': {
    q: `After doing good work on Upwork, the client messages: "Let's work directly together, skip Upwork to save fees". How do you handle it? Explain the non-circumvention clause at the mechanism level, the risks of violation, when off-platform work can be legitimate (check Upwork's site), and provide sample responses in English.`,
    a: `**Summary:** The proposal to "skip Upwork to save fees" directly touches the **non-circumvention** clause (terms that restrict taking payment/work relationships off-platform to avoid platform mechanisms and fees) and makes you lose the protection layers (escrow, dispute process, on-platform evidence). Risks include: not getting paid without protection, violating terms (which may affect your account), and contract/tax complications. Correct handling: reply politely but clearly, keep everything on Upwork; if you want to work off-platform later, only consider it when meeting conditions/conversion programs Upwork allows at that time — **you must check Upwork's official site**, do not guess.

### 1. Why the client proposes it (and why it sounds appealing)
The client sees platform fees and wants to pay less; the freelancer also sees the service fee being deducted. But "saving fees" looks at only one side of the cost. The extra risks you take on: no escrow/work-diary protection per the platform mechanism, hard to prove the agreement if a dispute arises, and risk of violating terms. For a Vietnamese developer new to freelancing, losing a large payment or getting the account suspended can be more serious than the fees saved.

Terms: **Non-circumvention** — clause aimed at preventing deliberately bypassing the platform to avoid obligations/fees; **Circumvention** — taking transactions/relationships off-platform to bypass the platform; **Opt-out / conversion program** (if any) — official mechanism Upwork may provide to take contract relationships off-platform under certain conditions and fees/processes (name, conditions, costs change — must check the official site).

### 2. Mechanism and risks (principle level)
| Aspect | On Upwork | "Work directly, skip Upwork" (circumvention) |
|---|---|---|
| Payment | Per contract: hourly/work diary or fixed-price/escrow per mechanism | You collect payment yourself — risk of non-payment, late payment, no platform dispute process |
| Evidence | Messages, contract, milestone, diary on the platform | Loose (off-platform chat, verbal promises) unless you draft a contract/evidence yourself |
| Terms compliance | Follow platform process | May violate non-circumvention → risk affecting account/platform relationship (specific consequences per current terms) |
| Tax/contract | You still manage tax yourself; but there is a clear transaction history | You still must declare and comply with the law; you must draft the contract and evidence yourself |
| Long-term relationship | Review/JSS history accumulated | Lose platform profile benefits; relationship depends entirely on trust/private contract |

**Warning:** There is no "safe circumvention". If you are interested in off-platform work, the right path is **the official mechanism allowed by Upwork** (if it exists at that time), with clear conditions and costs.

### 3. When can off-platform work be legitimate? (only via the official mechanism)
Upwork may have (or may have had) a program/mechanism allowing contracts to be moved off-platform under certain conditions. However: program name, eligibility conditions, applicable contract types, conversion fees, eligibility timing, and the process **change over time**. So:
- **Must check** Upwork's official site (Legal/Terms, Help/Support sections about taking contracts off-platform or conversion) at the time you need it.
- If not found or not eligible: **do not** take it off-platform yourself.
- If eligible: follow the official process, keep confirmation evidence, and still draft a clear contract/payment terms outside.

### 4. Sample responses in English (polite, clear boundaries, keep the relationship)
~~~text
Sample 1 — Decline the bypass proposal, propose continuing on Upwork:
Hi [Client Name],
Thank you for trusting me with this work — I really value our collaboration. I would like to keep our contract,
communication, and payments on Upwork so we both stay aligned with Upwork policies and keep the platform protections
in place (clear milestones/records and a straightforward process if any issue comes up).
I am happy to discuss how we can make the collaboration efficient on Upwork (for example, clear milestones, weekly
updates, or a longer-term contract). Would you like me to propose a plan for the next phase here?
Best, [Your Name]
~~~

~~~text
Sample 2 — Client repeats/applies light pressure, you keep the boundary firmly but respectfully:
Hi [Client Name],
I understand you are looking to reduce costs. I need to keep our payments and communication on Upwork in line with
platform policies, so I cannot take this work off-platform. I can continue delivering through an Upwork contract and
focus on clear scope and milestones to keep the project predictable. If that works for you, I would be glad to
continue. Best, [Your Name]
~~~

~~~text
Sample 3 — You want to check legitimacy (no promise upfront):
Hi [Client Name],
I appreciate the offer to work together long term. I can only consider any off-platform arrangement if it is done
through an official Upwork process and meets the current Upwork requirements. I will review Upwork's current policies
and get back to you. In the meantime, let us continue our work on Upwork under the existing contract.
Best, [Your Name]
~~~

### 5. Common mistakes
- **Agreeing right away for fear of losing the client**: trading one client for account risk plus non-payment risk.
- **Trusting "I will make sure you are paid"** without a contract/protection: goodwill does not replace a mechanism.
- **Discussing fee-dodging details in Upwork Messages**: creates a bad trail; keep communication professional.
- **Thinking "working together for a while means it's safe"**: terms still apply; check the official mechanism.
- **If off-platform work is legitimate but without a private contract**: you still need a private contract, payment terms, scope/acceptance criteria, and tax evidence.

### Checklist
- [ ] Identify a proposal to move payment/work off-platform to bypass Upwork as a non-circumvention/risk issue.
- [ ] Decline politely and clearly; propose continuing on Upwork with an effective collaboration plan.
- [ ] Keep all exchanges on Upwork; do not discuss how to bypass terms.
- [ ] If considering off-platform work: only via Upwork's official mechanism/program (if any) and **check Upwork's current site**.
- [ ] If there is a legitimate off-platform contract: you still need a private contract, payment terms, scope/acceptance criteria, and evidence.
- [ ] Continue declaring/complying with tax obligations in Vietnam; ask an expert when needed.
- [ ] Protect your account: do not share login information, keep communication professional.

> Senior tip: at lead level, a good answer is not just "no" — it is **offering a better option**. Shift the conversation from "dodging fees" to "reducing risk and speeding up": clear milestones, async updates, an Upwork retainer package, or a fast acceptance process. A mature client respects someone who protects both sides with a transparent process; a client who wants to dodge fees at any cost is usually a risky client when it comes to payment.`,
    follow: [
      'The client says they already have an "Upwork conversion program" and sends you a strange link to process it. How do you check its legitimacy?',
      'You and the client are eligible for off-platform work via Upwork\'s official mechanism (hypothetically). What contract and payment process do you need to prepare on your own?',
      'If you have already discussed off-platform payment on Upwork, what should you do next to reduce risk?'
    ]
  },
  'remote-017': {
    q: `You want to grow from a solo Upwork freelancer into a long-term client partner (retainer/monthly contract) or build a small agency. How do you design a retainer, NDA, IP ownership terms, and handover (README/runbook), and how do you maintain quality when taking on multiple clients at once?`,
    a: `**Summary:** Moving from freelancer to **retainer** (monthly/hourly-package service maintenance contract) or **agency** (service-providing team) is the step from "selling billable hours" to "selling results and operational capability". You need: a retainer package with clear scope and boundaries, an **NDA** (non-disclosure agreement) when handling sensitive information, **IP ownership** (intellectual property/source code ownership) terms finalized in writing, a handover process (README/runbook) so you are not personally indispensable, and a quality/capacity management system when running multiple clients. (The contract/legal samples below are a reference framework for discussion — not a substitute for legal advice.)

### 1. Why the model needs to change when you "grow up"
On small jobs, you optimize each delivery. On a retainer or agency, you optimize **repeat reliability**: the client buys peace of mind ("the system is taken care of every month"). Risks change too: overcommit (taking on too much), uneven quality, dependence on one person, and legal/security risks when touching data and source code from multiple sides.

Terms: **Retainer** — agreement to pay a fixed fee periodically (usually monthly) to retain a service level/capacity; **NDA (Non-Disclosure Agreement)** — agreement to keep information confidential; **IP (Intellectual Property)** — intellectual property rights, here usually source code/documents created in the project; **Runbook** — document guiding operations/incident handling step by step; **SLA (Service Level Agreement)** — service level commitment (response/handling time) if any; **Capacity** — the number of hours/work you can actually do with quality each week.

### 2. Designing a retainer (monthly package) with clear boundaries
Retainers often fail because they "cover everything" without limits. Define: what is included, what is not included, capacity, prioritization, and how out-of-scope work is priced.

| Component | Need to specify | Example (hypothetical) |
|---|---|---|
| Service scope | Type of work included | Spring Boot backend maintenance, bug fixes, small improvements, PR reviews |
| Capacity | Hours/month or equivalent requests | 20 hours/month, tracked transparently |
| Response time | When you respond/schedule (do not promise 24/7 if you do not have it) | Respond within 1 business day; urgent production bugs prioritized within the agreed window |
| Out of scope | Work billed separately (change request) | New large features, major migrations, 24/7 on-call — separate quote |
| Reporting | Update cadence | Weekly update + monthly summary (hours used, completed work, backlog) |
| Rollover/expiry rules | Do unused hours carry over to next month? | Hypothetical: no rollover (or yes, max X hours) — finalize upfront |
| Change/termination terms | Notice period | 14–30 days notice (hypothetical) to adjust or stop |

Retainer proposal template (send on Upwork, in English):
~~~text
Hi [Client],
Proposal: Monthly backend retainer (Java/Spring Boot)
- Scope: maintenance, bug fixes, small improvements, code reviews for [system].
- Capacity: up to [20] hours/month, tracked and reported weekly.
- Response: I acknowledge new requests within [1 business day] (Vietnam time). Urgent production issues are prioritized
  within the agreed window: [define hours/days].
- Out of scope (separate estimate/change request): new large features, major migrations, 24/7 on-call.
- Reporting: weekly status update + monthly summary (hours used, completed work, backlog).
- Terms: starts [date], billed monthly via Upwork contract; changes/cancellation with [14] days notice.
Assumptions: you provide access, timely feedback, and a single point of contact for priorities.
Best, [Your Name]
~~~

### 3. NDA, IP ownership, and terms to finalize
**NDA (confidentiality):** if you access client data, business information, or internal systems, an NDA is normal. Read carefully: scope of confidential information, duration, post-termination obligations, and exceptions (already public information, information you already lawfully knew).

**IP ownership**: who owns the code/documents created? Common models: (a) transfer IP to the client after full payment; (b) the client owns specific deliverables but you retain rights to your own pre-existing/background IP (tools/libraries) — must be defined clearly. Do not assume; finalize in writing in the contract/statement of work.

Points to ask and finalize on IP/handover (checklist):
~~~text
- When does ownership transfer? (usually: after full payment for the relevant part)
- How are "pre-existing IP" (tools/sample code you already had before the project) handled? Is a license granted to the client to use them?
- Third-party/open-source libraries: comply with licenses (MIT/Apache/GPL...)? Who is responsible for checking compatibility?
- Does the client receive the full repo, documents, credential handover, and access to related infrastructure?
- Note: specific terms depend on applicable law and contract — consult a lawyer/expert when value/risk is high.
~~~

**Legal note:** this is a framework so you know what to ask. For high-value contracts, sensitive NDAs, or IP disputes, consult an appropriate lawyer/legal expert. Do not sign terms you do not understand.

### 4. Handover: README and runbook (so you are not personally indispensable)
Good handover is a sign of a mature lead/agency owner. Goal: someone else (or the client themselves) can run, operate at a basic level, and know what to do when an incident occurs.

Minimum README/runbook structure:
~~~text
README.md
- Purpose of the system, high-level architecture (main components)
- Requirements: Java/SDK, DB, environment variables (DO NOT write real secrets)
- How to run locally, run tests, build
- Configuration: sample file (application-example.yml), explanation of important variables

RUNBOOK.md
- Operational actions: deploy/rollback (high level if infrastructure is managed by client), restart, health checks
- Common incidents: symptom → how to check logs/metrics → action to take → when to escalate
- Contacts/ownership: who receives alerts, contact channel, support hours (per retainer/SLA)
- List of dependencies/external services (DB, queue, provider) and where to check status
~~~

### 5. Maintaining quality when taking multiple clients (agency/capacity)
Taking multiple clients without a system will ruin every contract at once.
- **Capacity management**: calculate the real hours you can work each week (minus full-time if any, minus meetings, minus buffer). Only commit to a retainer within capacity. Hypothetical example: 15 hours/week free → max ~60 hours/month, do not sell 100 hours.
- **Transparent prioritization**: a shared backlog per client (or clear owner), priorities confirmed by the client; when overloaded, communicate early.
- **Quality standard**: PR/review checklist, mandatory tests, basic logs/metrics, no-commit-secret rule.
- **Regular communication**: weekly updates, demos when there is output, report risks early (do not wait until near deadline).
- **Separate context**: each client has its own channel/documents/access set; absolutely do not leak source code, data, or secrets between clients (especially with NDAs).
- **When running an agency**: define roles (who talks to the client, who codes/reviews), member onboarding process, and shared responsibility for quality. Check Upwork's agency profile mechanism/terms (change over time) before operating.

Weekly retainer update sample:
~~~text
Week of [date] — [Client/Project]
- Hours used: [6/20] this month to date: [12/20]
- Completed: [#123 fixed timeout on /orders, deployed to staging]
- In progress: [#130 add idempotency key — ETA Thu]
- Needs decision: [confirm retry policy: 3 attempts or 5?]
- Risks/capacity: [none] / [approaching monthly cap; next requests may move to next month or change request]
~~~

### 6. Common mistakes
- **"Unlimited" retainer**: you become a free IT department; must have capacity and out-of-scope rules.
- **Not finalizing IP/NDA**: disputes over code ownership or information leaks.
- **Handover = sending a zip file**: without README/runbook, the system "dies" when you are away.

### Checklist
- [ ] Design retainer: scope, capacity (hours/month), response time, out-of-scope, reporting, change/termination rules.
- [ ] Finalize NDA and IP ownership in writing; clarify pre-existing IP and open-source licenses.
- [ ] Prepare handover: README (run/test/configure, no secrets) + runbook (operations, incidents, escalation).
- [ ] Manage real capacity; only commit within your ability to deliver quality.
- [ ] Set communication cadence: weekly updates, monthly summary, early risk/capacity alerts.
- [ ] Strictly separate data/code/credentials between clients; comply with NDAs.
- [ ] High-value/risk contracts: consult a lawyer/expert; check Upwork's official agency mechanism (changes over time).

> Senior tip: a sustainable agency or retainer is built on **your own replaceability in operations**. If everything is only in your head, you do not have an agency — you have a bottleneck. Invest early in runbooks, quality checklists, and clear scope boundaries: that is what lets you serve many clients without damaging your reputation. And when in doubt about NDA/IP, the cost of asking a lawyer early is usually much less than a source code ownership dispute.`,
    follow: [
      'The client wants a retainer but requires 24/7 response time at a low fee. How do you negotiate and define a realistic SLA?',
      'You hand over a project you worked on for 6 months to another team (or for the client to self-operate). How do you prepare documents and the handover session?',
      'When expanding from a solo freelancer to 2–3 collaborators, how do you control code quality and security (NDA, repo access)?'
    ]
  },
  'remote-018': {
    q: `Besides Upwork, you are a 4-year Java developer in Vietnam wanting to work remotely for a foreign company. What are the common paths (direct hire, vetted developer platforms, Vietnamese companies working for foreign clients, contractor via EOR)? Compare income, stability, and entry process to choose the suitable path?`,
    a: `**Summary:** Not only marketplaces like Upwork — you can go direct hire, via vetted platforms (platforms that carefully screen before introducing candidates), work at a Vietnamese company but on projects for foreign clients (outsourcing/ODC — offshore development center), or work as a contractor (independent contractor — working under a service contract, not an employee) via EOR (Employer of Record — an entity that is the legal employer on your behalf in your country). Each path trades off differently between potential income, stability, freedom, and application difficulty.

### 1. Why you need to know multiple paths
Many people think "remote for foreign companies = Upwork". In reality, Upwork is just one channel, and there are other channels better suited if you want stable monthly income, want to avoid constantly hunting for jobs, or want to work on a product team long-term. Understanding the big picture helps you choose a strategy: where to start, how to prepare your profile, and what trade-offs to accept.

### 2. Four common paths (mechanism comparison)
| Path | Who you are legally/contractually | How to find opportunities | Income (trend) | Stability | Entry process (typical) |
|---|---|---|---|---|---|
| Direct hire (remote) | Employee or contractor signing directly with a foreign company | LinkedIn, company careers page, referral | Usually higher than outsourcing; depends on market/role/listed salary | High if employee; average if project-based contractor | 3–6 rounds: CV/HR screen → technical (coding/system design) → culture/team → offer |
| Vetted developer platform | Usually contractor via platform; platform stands between you and client | Register, pass platform test/interview to enter "pool" | Average–high; platform may keep fees/commission (varies) | Average: may have bench periods waiting for projects | Pass platform screening (English test, coding, interview) → client matching → client interview |
| Vietnamese company working for foreign clients (outsourcing/ODC) | Employee of a Vietnamese company | Apply to outsourcing/product companies in VN | Usually lower than direct hire for same level; salary per VN market + project allowance (varies by company) | Higher than freelance: monthly salary, social insurance per VN law (varies by contract) | Interview with Vietnamese company (1–3 rounds) + sometimes client interview |
| Contractor via EOR | Contractor on local paperwork with EOR as legal employer; working for a foreign company | Foreign company hires you, uses EOR to legally employ you in VN | Usually at international contractor/remote rates; EOR charges service fees to the company (affects total package) | Average–high: depends on contract duration and termination terms | Similar to direct hire, plus onboarding via EOR (paperwork, local contract) |

Important note: the table describes **mechanisms and trends**, not specific salary figures because salary levels change by year, location, company, experience, and negotiation ability. Do not trust "certain" numbers from unofficial sources; survey multiple sources (salary reports, job posts with ranges, verified community shares) and negotiate yourself.

### 3. Deep dive into each path: how it works, concrete examples
**(a) Direct hire (LinkedIn / careers page / referral)**
- What: you apply directly to "Remote" or "Distributed" positions at foreign companies.
- Why: skip intermediaries, usually more competitive salary/benefits, learn international product processes.
- How: optimize LinkedIn (clear Java/Spring Boot role headline, result-numbered bullets), turn on "Open to Work" (if suitable), find jobs on careers pages, get referrals from people in the industry (referral — internal introduction, usually increases CV view rate).
- Example (hypothetical): you see a "Senior Backend Engineer, Remote (APAC timezone overlap)" position. Your CV states: "Reduced orders API p95 from 1.8s to 120ms via JPA + PostgreSQL index optimization" — this is measurable evidence, stronger than "has performance optimization experience".

Sample LinkedIn message to recruiter/hiring manager (short, in English):
~~~text
Hi [Name], I saw the [Senior Java Backend, Remote] role at [Company]. I am a Java/Spring Boot engineer (4 years)
with experience building and tuning REST APIs and PostgreSQL-backed services (e.g., reduced p95 from 1.8s to 120ms
on an orders API). I am based in Vietnam (UTC+7) and can overlap [X hours] with [team timezone]. If helpful, here is
my CV/portfolio: [link]. Best, [Your Name]
~~~

**(b) Vetted developer platform**
- What: the platform interviews/screens you first; when you pass, they introduce you to client projects. (Names and mechanisms vary and change; read the official site of the platform you care about.)
- Why: they help you access foreign clients without constantly marketing yourself; the screening process is also a "capability signal".
- How it works: you register → take tests (coding, English, sometimes system design) → interview → enter the list → project matching → final client interview. There may be a waiting period for a project.
- Example (hypothetical): you pass a Java coding round + English interview, 3 weeks later are matched with a 3-month fintech project, working 40 hours/week on VN time with EU overlap.

**(c) Vietnamese company working for foreign clients (outsourcing/ODC)**
- What: you are an employee of a Vietnamese company; the company signs a contract with a foreign client; you work on that client's project.
- Why: easier entry for those not yet confident in English/international interviews; has team/mentor/process environment; stable monthly income.
- How it works: you interview at the Vietnamese company; then you may be "staffed" onto a client project (client interview — the client interviews further to accept you into the project).
- Example (hypothetical): company A (VN) has a project for a Japan/US/EU client; you join the Java team, meet with the client in English 2–3 times/week, and communicate internally the rest of the time.

**(d) Contractor via EOR (Employer of Record)**
- What: a foreign company wants to "hire" you but has no legal entity in Vietnam. EOR is a locally-licensed entity that signs employment/contracts under local law and handles administrative procedures on its own behalf; you actually work for the foreign company.
- Why: helps the foreign company hire you quickly and comply with local law; you have a clear contract in Vietnam (depends on model).
- How it works: you pass the foreign company's interview → the company selects an EOR → EOR onboards you (signs contract, collects documents) → you work daily with the foreign company's team.
- Example (hypothetical): company B (Singapore) hires you as a backend contractor; they use an EOR to sign a contract in Vietnam; you receive salary via EOR's process and report to company B's engineering manager.

### 4. Common mistakes
- Applying indiscriminately in bulk: generic CV, not mentioning the job's stack/requirements → low response rate.
- Thinking outsourcing is "completely inferior": for newcomers to remote work, it can be a good stepping stone to practice English, processes, and accumulate international projects.
- Not asking clearly about contract type (employee or contractor, who is the legal employer, who pays, probation, termination): leads to surprises about tax, insurance, benefits.
- Believing "one salary number fits all": always ask for the range, understand the total package (gross/net, benefits, equipment, time off) and compare on the same basis.

### 5. Red flags when job hunting (outside Upwork)
- Requests to transfer money upfront ("holding fee", training fee, buying equipment via strange accounts).
- Sending an "offer" before technical interviews or clear job discussions.
- Requests to install strange software, run unclear-source files/scripts "test tasks".
- Vague contract: not specifying who pays, scope of work, termination method, source code ownership.
- Spoofed emails/domains of real companies: always verify the company's official domain.

### Checklist
- [ ] Define your 6–12 month goal: prioritize stability (monthly salary) or flexibility/potential income (contractor)?
- [ ] Prepare English profile: 1–2 page CV with measurable results, synced LinkedIn, 2–3 case studies (problem → action → result).
- [ ] Choose 1–2 paths to start (e.g., VN outsourcing + direct remote applications) instead of spreading thin.
- [ ] For each opportunity, ask clearly: contract type, who is the legal employer/who pays, timezone overlap, job expectations, interview process.
- [ ] Practice a 60–90 second self-introduction in English + 2 STAR stories with numbers.
- [ ] Check scam signals: no upfront money transfers, no strange files, verify company email/domain.
- [ ] Keep an application tracking sheet (company, channel, date, status, response) to improve after every 10–15 applications.

> Senior tip: choose the path based on your **real constraints**, not glamour. If your communication English is still weak, a position at a Vietnamese company working on foreign projects may help you safely accumulate international experience; if you are confident in interviews and have strong case studies, direct hire/EOR usually offers better income leverage. Whichever path you take, the deciding factor is evidence that you produce measurable results (reduce latency, reduce bugs, deliver on time) — that is the common language of every market.`,
    follow: [
      'You have 4 years of Java but are not confident speaking English. Which path should you choose first to both earn income and practice international interviews?',
      'When a foreign company offers contractor via EOR, what terms do you need to ask before signing?',
      'How do you distinguish a real remote direct-hire job from a scam invitation impersonating a well-known company?'
    ]
  },
  'remote-019': {
    q: `You received a remote offer from a foreign company: one side proposes contractor (independent contractor), the other proposes hiring you via EOR (Employer of Record — an entity that is the legal employer on your behalf in Vietnam). How do you compare contract, insurance/leave, equipment, tax (general principles)? How do you issue monthly invoices (payment request invoices) — is there a minimal English invoice template?`,
    a: `**Summary:** Contractor and employee via EOR differ mainly in **who is the legal employer, who bears benefit/insurance obligations under local law, and how much administrative responsibility you have**. Contractors are usually more flexible but you handle more things yourself (service contract, invoices, tax, voluntary/private insurance); via EOR, you have a local contract managed by EOR, benefits depend on the EOR package/agreement. Either way, read the contract carefully, finalize payment method, and understand the general principles of tax in Vietnam (declaring income, keeping evidence) — ask tax/labor experts for your specific case.

### 1. Why you must distinguish clearly before accepting an offer
Many people only look at the "monthly salary" number. But two offers at the same pay can give you very different rights and obligations: who pays when you take sick leave, who buys the laptop, whether you get insurance contributions, how you issue invoices, and how tax is calculated. Confusion can lead to lost benefits or tax obligation violations.

Terms: **Contractor** — provides services under a contract, usually manages their own time/working method, not an employee; **EOR (Employer of Record)** — a third-party company that is the legal "employer" in your country, handling contracts, salary payment, administrative procedures per agreement; **Invoice** — document you send to request payment for services/time worked; **Gross/Net** — gross is before deductions, net is the actual amount received (ask each side which meaning they use).

### 2. Overview comparison
| Criterion | Contractor (sign directly with foreign company) | Via EOR (EOR is legal employer in VN) |
|---|---|---|
| Legal contracting party | You (or your company/person) and the foreign company | Usually you and EOR (local contract) per agreement with the foreign company |
| Relationship nature | Service contract/B2B or individual-company (depends on structure) | Closer to local employment relationship managed by EOR (depends on model/package) |
| Insurance, leave | Usually not automatic; you negotiate or buy/pay yourself | Depends on EOR package and law/agreement: may have social insurance/benefits per regulations; ask clearly |
| Equipment (laptop, monitor) | Negotiate: company provides, allowance, or you prepare yourself | Negotiate per company/EOR policy; ask clearly before start date |
| Payment method | Per invoice/milestone/hours into your designated account (transfer fees may apply) | Usually EOR pays per cycle; EOR's internal process |
| Admin/tax | You are more proactive: issue invoices, declare tax per VN rules for relevant income | EOR may support withholding/declaration depending on package; you still must understand your obligations |
| Flexibility | Higher (can work for multiple clients if contract allows, no conflict) | Usually tied to one company; conflict-of-interest/outside-work rules depend on contract |

Note: "usually" does not mean always. Everything depends on the specific contract and applicable law. Read carefully, confirm important points in writing (email).

### 3. Contract: terms to look at
- **Scope of work**: what you do, what the output is, acceptance criteria. Avoid "do everything related to backend".
- **Time and termination**: duration, notice period (e.g., 14/30 days, depending on agreement), immediate termination conditions.
- **Payment**: unit price/hour or monthly package, pay cycle (weekly/biweekly/monthly), currency, who bears transfer fees, when invoices are paid.
- **Confidentiality and IP**: NDA, who owns source code/documents created, post-termination terms.
- **Conflict of interest**: can you take on other clients? any industry/competition restrictions?
- **Governing law/dispute resolution**: which country's law governs the contract (if stated). This is complex — for high-value contracts, consult an expert.

Questions to send by email before signing (in English):
~~~text
Hi [Name],
Before signing, could you please clarify in writing:
1) Contract type and parties (direct contractor or via which EOR/entity in Vietnam)?
2) Payment: rate/salary, currency, pay cycle, invoicing process, and who covers transfer fees?
3) Benefits: paid leave, sick leave, insurance/social contributions (if via EOR, what is included)?
4) Equipment: do you provide a laptop/budget, or should I use my own?
5) Termination: notice period and conditions?
6) IP ownership and NDA/confidentiality terms?
7) Am I allowed to take other non-conflicting work (if contractor)?
Thank you, [Your Name]
~~~

### 4. Tax and law in Vietnam (general principles, not advice)
Tax and insurance are fields that change with regulations and depend on personal circumstances. You should follow safe principles:
- **Income declaration**: income from abroad or from service provision generally still has declaration/payment obligations under current Vietnamese regulations. Do not assume "money from abroad doesn't need declaring".
- **Keep evidence**: contracts, invoices, bank statements/payment receipts, payment confirmation emails — for cross-checking when declaring.
- **Distinguish forms**: obligations may differ between income from employment contracts (via EOR with withholding depending on package) and income from service/individual activities. Ask clearly what the EOR withholds, and what you still must declare yourself.
- **Ask experts**: consult accountants/tax agents or tax authorities for your case. Do not rely on group chat rumors to decide tax rates or declaration methods.

### 5. Monthly invoice (minimal template, English)
An invoice is a payment request document. As a contractor, you usually send invoices at month-end (or per milestone). Ask the client what information they need (contract/PO number — purchase order; company address; tax ID if any).

~~~text
INVOICE

Invoice No: INV-2026-05
Invoice Date: 2026-05-31
Due Date: 2026-06-07 (Net 7)   ; "Net 7" = payment within 7 days, per agreement

From (Contractor):
[Your Full Name]
[Address, City, Vietnam]
Email: [you@example.com]
[Tax/ID if applicable]

Bill To (Client):
[Client/Company Name]
[Company Address]
[Contact email]

Description of Services                          Qty/Hours    Rate (USD)    Amount (USD)
-------------------------------------------------------------------------------------------
Java Backend Development - May 2026               80 hours       25.00        2,000.00
(Project: [Project/Contract ref], tasks: API maintenance, bug fixes, performance tuning)

                                                           Subtotal:        2,000.00
                                                           Total Due:       2,000.00 USD

Payment Instructions:
Bank: [Bank Name]
Account Name: [Your Name]
Account No / IBAN: [Number]
SWIFT/BIC: [Code]
Reference: INV-2026-05

Notes: Thank you for your business. Please include the invoice number in the payment reference.
~~~

Example illustration (hypothetical): you work 80 hours × 25 USD/hour = 2,000 USD gross. The actual amount received still depends on transfer fees and your tax obligations — calculate separately, do not treat gross as net.

### 6. Common mistakes
- Not distinguishing contractor and EOR: thinking an offer is "an employee with full benefits" but it's actually a service contract where you handle everything yourself.
- Not asking about leave/sick days: contractors usually "don't work, don't get paid"; if you need long leave, income is affected.
- Invoices missing information (no invoice number, no service period, no contract reference): client accounting pays slowly or returns it for correction.
- Ignoring tax until year-end: lumping it all together causes shock and penalty risk; track income and evidence monthly.
- Signing vague NDA/IP: unclear whether you can reuse experience/generic code samples (not containing client secrets).

### Checklist
- [ ] Clearly identify the form: direct contractor or via EOR? who is the contracting party, who pays?
- [ ] Read and ask clearly: scope, payment (rate, cycle, currency, fees), leave/sick days, equipment, notice period, NDA/IP.
- [ ] If via EOR: ask about the specific benefits/insurance package and what EOR withholds/supports in declaration.
- [ ] Prepare an invoice template (number, date, service period, reference, payment instructions) and a monthly sending process.
- [ ] Track income and keep evidence (contract, invoice, bank statements). Declare tax per principles; ask Vietnamese tax experts.
- [ ] Check conflict of interest: does the contract allow additional non-conflicting work?
- [ ] All important agreements (salary, leave, equipment, termination) must be in writing (email/contract).

> Senior tip: when comparing two offers, convert to "total net package and risk", not just the headline number. A contractor offer with a higher rate but no leave, self-purchased equipment, self-handled insurance/admin may be less attractive than a slightly lower but clear and stable EOR offer. Make a table: gross income → deduct fees/insurance/equipment differences/unpaid time → estimate net and risk level; then decide based on your situation.`,
    follow: [
      'You are a contractor and get sick for 1 week. How do you notify the client and handle payment/handover professionally?',
      'The client pays an invoice 3 weeks late despite the Net 7 terms. How do you follow up in English while keeping the relationship?',
      'When working via EOR, what do you ask to know what insurance/tax the EOR has handled and what you still must declare yourself in Vietnam?'
    ]
  }
});
