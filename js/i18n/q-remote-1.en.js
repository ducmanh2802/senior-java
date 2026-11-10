/*
 * English translation of js/data/q-remote.js — task T989. Format: js/core/i18n.js (content overlay).
 * ids: remote-001 remote-002 remote-003 remote-004 remote-005
 */
App.i18n.content({

  'remote-001': {
    q: 'You are a Java backend developer with 4 years of experience. You just created an Upwork account and have no reviews yet. How do you build your profile and write proposals to win your first contract within 1–2 months?',
    a: `**Summary:** Clients on Upwork choose the **least risky person for their problem**, not the most skilled one. Without reviews, you compensate for the risk with a focused profile backed by evidence (portfolio, GitHub, numbers), and a short proposal that shows you read the job carefully and opens by solving the client's problem instead of introducing yourself.

### 1. Why newcomers struggle to land their first job
The client looks at the list of proposals and asks: "Will this person finish my work without costing me money and time?". What they use to judge is reviews, Job Success Score and hours worked. A newcomer has none of the three, so everything else must answer that question instead.

### 2. Profile: focused and with evidence
- **Title** says clearly what problem you solve, not a list of technologies: "Java Spring Boot Backend Engineer | REST APIs, PostgreSQL, AWS" is better than "Software Developer".
- **Overview**: the first two lines are what the client sees in search results, so say right away what you can help with; do not start with "Hello, my name is…".
- **Portfolio**: 2–3 projects with architecture screenshots or API docs, each project in 3 lines: problem → what you did → result with numbers. Personal projects on GitHub are fine too, as long as they have a decent README.
- **Specialized profile**: if Upwork lets you create multiple specialized profiles, make a separate one for Java backend; do not merge it with "I do mobile too".
- Identity verification, real photo, complete payment account: these are the cheapest trust signals.

~~~text
Title: Java / Spring Boot Backend Engineer | REST APIs, PostgreSQL, AWS
Overview (first 2 lines):
I build and fix Java backends that need to stay fast and reliable under real traffic.
4 years shipping Spring Boot services for e-commerce and fintech teams: APIs, payments, performance tuning.
~~~

### 3. Choosing which jobs to send proposals to
Each proposal costs **Connects** (bought with money), so choose carefully:
| Send | Skip |
|---|---|
| Job posted within 24 hours, few proposals | Already has many proposals |
| Client has payment verified, hiring history and good reviews | Client has not verified payment |
| Specific description (stack, problem, deliverable) | Vague description, "simple task, small budget" |
| Small job, clear scope (fix a bug, add an endpoint, optimize a query) | Big project that needs many reviews before being chosen |

Small, clearly scoped jobs are the most realistic way to get your first review.

### 4. Proposal: open with the client's problem
Clients usually read only the first 2–3 lines in the proposal list. A good structure:
1. One sentence showing you understand the problem (mention a specific detail from the job).
2. How you will do it (2–3 steps), plus one risk you spotted in advance.
3. Short evidence: similar work done, with a link.
4. One clarifying question, to start the conversation.

~~~text
Hi Mark, the timeouts you see on /orders after 10k rows look like an N+1 query in the
order-items mapping rather than a server sizing issue.
I would: 1) enable SQL logging to confirm the query count, 2) switch to a fetch join or
@BatchSize, 3) add an index on order_items(order_id) and measure p95 before/after.
I fixed the same pattern for an e-commerce API last year (p95 1.8 s -> 120 ms): <link>
Quick question: are you on Spring Data JPA or plain Hibernate?
~~~

### 5. Common mistakes
- Sending long copy-paste proposals for every job: clients notice right away.
- Quoting too low to "buy reviews": attracts difficult clients, and you get anchored at that price level.
- Exchanging or accepting payment outside the platform when the client suggests it: violates the terms, loses payment protection, and is a common scam sign.
- Not tracking your response rate: if you send about 20 proposals and nobody replies, you need to fix your profile or your writing, not just send more.

> Senior tip: track proposals in a simple table (job, date sent, Connects, response or not, reason). After 20–30 proposals, the data will tell you which job type and opening line work. Fees, Connects prices and Upwork policies change over time, so always check the official help page before pricing.`,
    follow: [
      'How do you set your starting hourly rate when you have no reviews, and when do you raise it?',
      'The client messages: "Let us continue on Telegram, I will pay you via crypto". How do you reply?',
      'After your first contract, what do you do to get a good review and be hired again?'
    ]
  },

  'remote-002': {
    q: 'You are a Java backend developer with 4 years in Vietnam, new to Upwork. What starting hourly rate should you set? Is setting a low rate to "buy reviews" beneficial or harmful, and when and how do you raise rates with existing and new clients?',
    a: `**Summary:** Hourly rate (the price per hour of work) is the amount you charge for each hour worked; on Upwork, the amount the client pays you after Upwork deducts its service fee will be lower than this number. For a Java developer with 4 years of experience and no reviews, choose a **sustainable** starting rate (enough to live on, enough time to do good work) based on market references, and absolutely do not race to the bottom on price to "buy reviews". Raise rates based on evidence (good reviews, measurable results) — with new clients, raise it directly on the profile; with existing clients, negotiate a clear rate increase with a reason.

### 1. Why the price you set has long-term effects
The price you set is not just money: it is a **signal** (clients judge capability from price) and an **anchor** (the level you accept today affects what the client expects tomorrow). Setting it too low to get reviews quickly usually brings three consequences: you must take many jobs to earn enough, so quality drops; you attract "price hunters" (usually demanding, difficult clients); and when you want to raise prices, even you hesitate because the client is used to the old level.

Terms to know (explained for the first time): **Hourly contract** — the client pays according to the hours you log with Upwork's time tracker; **Fixed-price contract** — paid by milestone (handover milestone), not by hours; **Service fee** — the amount Upwork keeps from what you earn on each contract; **Net rate** — the money in your pocket after platform fees, withdrawal fees and taxes (if any).

### 2. Market references and how to calculate your starting rate
Don't guess. Do 3 steps:
1. **Research**: find 10–15 Java/Spring Boot backend profiles with 3–7 years of experience, Southeast Asia or worldwide, and note the rates they charge. Write down low, median and high (for reference only, do not copy).
2. **Calculate your personal floor**: estimate your minimum monthly living costs (living, equipment, internet) plus non-billable time (unpaid time: writing proposals, meetings, learning). Example (assumed figures, replace with your own): you need 20 million VND/month, billable 80 hours/month → floor about 250,000 VND/hour. Convert to USD to set on Upwork (assumed rate 25,000 VND/USD) → about 10 USD/hour **before fees**.
3. **Deduct fees to get net**: the Upwork freelancer service fee **varies 0–15% per contract**, shown before you send a proposal or receive an offer, and fixed when the contract starts (at time of writing 2026-11-07, per support.upwork.com; check again before calculating). Example assuming a 10% fee: rate 20 USD/hour → you receive about 18 USD/hour before withdrawal fees/taxes. Make sure your **net rate** is still above your floor.

~~~text
Quick calculation example (assumed, replace with your numbers):
- Target net income: 1,200 USD/month
- Actual billable hours: 80 hours/month (the rest goes to proposals, meetings, learning)
- Assumed service fee: 10% → need gross ~1,333 USD/month
- Minimum starting rate: 1,333 / 80 ≈ 17 USD/hour
→ Set 18–22 USD/hour if your portfolio/evidence supports it; DO NOT set 5 USD/hour to "compete".
~~~

### 4. "Buying reviews" with low prices: good or bad?
| Approach | Short-term gain | Long-term harm (usually greater) |
|---|---|---|
| Set very low (below floor) to get the first job | Easy to win small jobs, get reviews sooner | Attracts price-hunting clients; burnout from working too many hours; hard to raise prices; "cheap = low quality" signal |
| Set a sustainable rate + quality proposal + small, clearly scoped jobs | Wins a little more slowly | Right-fit clients, quality reviews, easier to raise rates, sustainable |

Practical conclusion: **do not buy reviews with low prices**. "Buy" reviews instead by choosing small jobs with clear scope (fix a bug, add an endpoint, write tests) that you can do very well, deliver earlier than promised and communicate clearly. One 5-star review from a small, fairly paid job is worth more than three cheap jobs with difficult clients.

### 5. When and how to raise rates
- **Signs you should raise**: 2–3 good reviews, delivered on time, clients return or refer others; you have no bandwidth (too many invitations); skills proven (for example optimized API from 1.8s to 120ms).
- **With new clients**: raise it directly on the profile (for example from 20 to 25–28 USD/hour). Increasing 15–25% each time you have new evidence is reasonable; do not double in one step.
- **With existing clients (hourly contract)**: give advance notice, state the reason tied to value, propose an effective date. Respect the current contract.

~~~text
Sample rate-increase message to an existing client (in English, send 2–4 weeks ahead):
Subject: Rate update for upcoming work

Hi [Client Name],

I have really enjoyed working on [project/service name] over the past [X months]. As we plan the next phase,
I wanted to let you know that my hourly rate will change from $20 to $25 effective [date, at least 2 weeks out].

This reflects the additional responsibility I have taken on (e.g., performance tuning, on-call support) and the
results we achieved together (p95 latency reduced from 1.8s to 120ms).

I am happy to discuss the scope for the next milestones so we can plan the budget together. If you would like,
we can also define a fixed-price scope for [specific deliverable].

Best,
[Your Name]
~~~

### 6. Common mistakes
- Comparing your rate with US/European developers and lowering yours: the global market pays by value and risk, not nationality — but do not set imaginary prices without evidence either.
- Forgetting to deduct fees: setting 15 USD/hour, after service fee, withdrawal fee and tax you may keep much less.
- Misestimating fixed-price: for newcomers, if you are not sure about the scope, prefer hourly for the first job or split fixed-price into very small milestones.
- Not logging hours/evidence: when raising rates, you need numbers (response time, measurable results) to talk about.

### Checklist
- [ ] Research 10–15 Java/Spring Boot profiles at the same level for a reference range.
- [ ] Calculate your personal floor: (living costs + non-billable time) / billable hours.
- [ ] Set a sustainable starting rate, check net after service fee (varies 0–15% per contract, fixed when the contract starts — at time of writing; check again).
- [ ] Choose 2–3 small jobs with clear scope to get your first reviews instead of lowering prices.
- [ ] Prepare one case study with numbers (before/after) to use when raising rates.
- [ ] With existing clients, prepare the rate-increase message, give 2–4 weeks notice.
- [ ] After each contract, log: hours worked, results, feedback — use as evidence for the next rate increase.

> Senior tip: think in "effective hourly rate" (real income per hour, including time spent writing proposals, meetings and unpaid fixes). If your posted rate is 20 USD/hour but only 60% of your time is billable, your effective rate is only about 12 USD/hour. Track this number weekly; when the effective rate drops because you got better but your price stayed the same, that is when you have grounds to raise rates.`,
    follow: [
      'When should you choose fixed-price over hourly for a job, and how do you split milestones to reduce risk?',
      'An old client refuses a rate increase and threatens to find someone else. How do you negotiate while keeping the relationship?',
      'How do you calculate personal income tax for Upwork freelance income in Vietnam, and what documents do you need to keep?'
    ]
  },

  'remote-003': {
    q: 'You have 20 Connects in your account. Five new Java backend jobs have been posted. How do you read a job post to decide whether to send a proposal, and how do you evaluate "Connects spent / chance of winning"?',
    a: `**Summary:** Connects are "tickets" you use to send proposals (job applications) on Upwork; Connects cost money and expire, so choose your battles. Read a job post like a two-way risk assessment: **is the client trustworthy and able to hire?** and **do you have the right evidence to win?** Send only when both signals are good; if in doubt, save your Connects for a clearer opportunity.

### 1. Why you must be selective (Connects are a real cost)
On Upwork you buy Connects to send proposals: **0.15 USD per Connect**, minimum purchase 10; the Connects needed for each proposal **depend on the job** (some jobs cost 0 Connects); answering invitations (the client invites you) usually costs no Connect. Basic plan includes 10 Connects/month; Freelancer Plus is 19.99 USD/month with 100 Connects/month. Connects expire after 1 year (at time of writing 2026-11-07, per support.upwork.com; check again). Sending 20 low-quality proposals wastes money and time and discourages you; sending 5 well-matched proposals usually works better.

### 2. Client signals — read these before the technical requirements
| Signal | Good (worth considering) | Warning (consider skipping) |
|---|---|---|
| Payment verified | Verification badge present | Not verified: risk of not getting paid |
| Total spent / jobs hired | Has spent money, many completed contracts | New, never hired anyone: not necessarily bad but higher risk |
| Hire rate | Posts jobs and actually hires | Posts a lot, hires little: may just be price shopping |
| Reviews from other freelancers | Detailed reviews, good ratings, paid on time | Complaints about payment, scope creep, poor communication |
| Country / time zone | Some overlapping work hours or accepts asynchronous | 11–12 hours offset but demands constant real-time meetings (still workable if agreed clearly) |
| Recent invitations/interviews | Actively hiring | Job posted long ago, no activity |

How to read: open the client page, see "About the client" (total spent, number of hires, hire rate, country, payment verified) and reviews left by freelancers. **There is no perfect data** — a new client with verified payment, clear description and fast replies can still be a good opportunity.

### 3. Job scope signals and fit
- **Specific description**: names the stack (Spring Boot, PostgreSQL, AWS), the problem (slow API, concurrency bug, need an endpoint), desired output, timeline. This is a job you can estimate.
- **Vague description**: "build an app like Uber", "simple task, low budget", no stack/output. Risk of scope creep (the client keeps adding work beyond the agreement).
- **Fit with you**: do you have specific evidence (project, numbers) for exactly this problem? If the job needs production-grade Kafka and you have never used it, do not "bluff" — be honest or skip.

### 4. Calculating "Connects spent / chance of winning" (simple heuristic)
This is a quick estimate, not an exact formula. Goal: **only shoot when the expectation is reasonable**.

~~~text
Step 1 — Cost: how many Connects does this proposal need? (write the number shown on the job)
        Example: 12 Connects × 0.15 USD = 1.8 USD for one submission (at time of writing).

Step 2 — Rate your chance of winning (0–3 points each, be honest with yourself):
         (a) Skill/evidence fit: 0 = no fit, 3 = case study for exactly this problem
         (b) Client quality (verified, hiring history, reviews): 0–3
         (c) Competition/fit (number of proposals, required level): 0–3
         Total 7–9: send. 4–6: send only if you have very close evidence. 0–3: skip.

Step 3 — Decision: if you send, write a tailored proposal for that job; if not, keep your Connects.
~~~

Illustrative example (assumed): Job A needs 16 Connects, client verified + hired 12 times + clear description "fix N+1 query in Spring Data JPA", you have a p95 optimization case study — total 8/9 → **send**. Job B needs 8 Connects, client not verified, description "need Java developer ASAP", 50+ proposals — total 2/9 → **skip**, even though it costs fewer Connects.

### 5. Job evaluation notes template (ready to use)
~~~text
Job: [link/name] | Connects needed: [n] | Posted: [time] | Proposals: [estimate if visible]
Client: payment verified? [Y/N] | total spent: [...] | hires/hire rate: [...] | reviews: [summary]
Scope: [clear/vague] | Stack match: [Y/N, evidence I have: ...]
Score (fit + client + competition): [x]/9 → Decision: [SEND / SKIP] | Reason: [...]
~~~

### 6. Common mistakes
- Looking at each technical requirement and ignoring client signals: you may win the job but not get paid, or face scope creep.
- Seeing an "easy" job and sending many proposals: generic proposals almost never get replies, wasting Connects.
- Afraid to spend Connects so not sending good jobs: Connects are a small marketing budget; sending few but well-targeted is optimal.
- Trusting the displayed proposal count completely: the number can change; still prioritize fit and client quality.

### Checklist
- [ ] Check the client: payment verified, total spent, hire rate, freelancer reviews.
- [ ] Read the scope carefully: stack, problem, output, timeline — vague means ask to clarify or skip.
- [ ] Match your evidence against the exact problem in the job (do you have a case study/link?).
- [ ] Note the Connects needed for the proposal and quickly score the 3 criteria (fit, client, competition).
- [ ] Send only when the score is good enough; write a tailored proposal opening with the client's problem.
- [ ] Keep a tracking table (job, Connects, decision, result) to learn after 20 proposals.
- [ ] Check Connects prices/mechanics on the official Upwork page again (numbers change over time).

> Senior tip: treat Connects like a small advertising budget. Set a weekly limit (for example 40–60 Connects), only "invest" in jobs with good clients and high fit, then measure your response rate. If after 15–20 well-targeted proposals nobody replies, the problem is usually the first 2–3 lines of your proposal or your profile — fix the message before buying more Connects.`,
    follow: [
      'You receive an invite from a client with unverified payment and a vague description. How do you reply to keep the opportunity while reducing risk?',
      'How do you write the first 2–3 lines of a proposal to make the client keep reading while scrolling through dozens of proposals?',
      'Which metrics do you track and improve for the proposal → interview → contract conversion rate?'
    ]
  },

  'remote-004': {
    q: 'When looking for work on Upwork, you face these situations: (1) the client asks to move to Telegram/WhatsApp right away, (2) a strange "test task" file, (3) being asked to front/lend an account, (4) a suggestion to pay outside the platform or by crypto, (5) a check is sent then they demand the excess be refunded. How do you recognize, handle and refuse them?',
    a: `**Summary:** The situations above are **common scam/phishing patterns** targeting freelancers: the goal is to take your money, hijack your account, install malware, or pull you out of the platform's protection. Safety principle: **keep communication and payment on Upwork** (until the contract allows another channel under the terms), do not run files or click strange links, do not rent or lend accounts, and never "refund excess money". Refuse politely and clearly, and report (report) immediately on the platform.

### 1. Why keep everything on the platform (protection mechanisms)
Upwork has mechanisms to reduce risk: with an **hourly contract**, logged hours are tracked through the tool and payment protection terms apply; with a **fixed-price** contract, money is held by **milestone/escrow** (the client deposits money for each milestone, you receive it when the milestone is approved), depending on setup. When you move outside (outside chat, outside payment), you drop those layers of protection. Besides the risk of being scammed, deliberately moving payment outside to avoid fees usually violates the **anti-circumvention** terms — consequences can include account suspension. (Specific mechanisms and terms: see upwork.com/legal at the time you read; policies change over time.)

### 2. Five situations: warning signs, risks, safe handling
| Situation | Warning signs | Risk | Safe handling |
|---|---|---|---|
| Pushes to Telegram/WhatsApp/Zalo right away | No interview/no contract yet, urges channel change, vague reason | Avoids moderation/protection; leads to payment scam or malware install | Refuse politely, suggest talking on Upwork; if the contract is legitimate and both parties agree to another channel under the terms, consider it |
| Sends strange "test task" file | .zip/.exe/.scr file, project asks to run an unclear script/binary, strange Google Drive link, asks to disable antivirus | Malware, stolen cookies/passwords/crypto wallet, hijacked computer | DO NOT run strange files. Accept tests only as requirement descriptions/code review in your own environment; if you need to run code, use an isolated VM/container, read the code first |
| Asks you to lend your account / front for them | "Use your Upwork account to get work, share %", asks for ID/login | Account hijacking, money laundering, identity violation — you are responsible | Refuse directly, do not share account/ID, report |
| Payment outside the platform or via crypto | Suggests PayPal/crypto/bank transfer "to avoid fees", unusual advance payment | No payment protection, scam, violates terms | Accept payment only through an Upwork contract; refuse outside payment |
| Sends a check/money then asks to refund the excess | Sends a "mistaken" large amount, asks you to send back the excess quickly through another channel | Fake check/transfer reversed after days; you lose real money you sent back | Do not refund, do not transfer money. Report immediately; work only through the contract and official mechanisms |

### 3. Example "malicious test task" scenario (to recognize)
Assumed (illustrative situation): the client sends "coding_test.zip" with instructions "run {{npm install}} and {{npm start}} to see the bug". Inside is a postinstall script that downloads code from a strange server or reads wallet/SSH keys. Java developers see similar variants: a Maven/Gradle project with a strange plugin, or a "try it" JAR file. **Rule**: do not execute code you have not read on your main machine; open it in a virtual machine (VM — an isolated virtual computer) or container, and check dependencies/scripts first.

### 4. Polite English refusal templates (ready to use)
~~~text
Template 1 — Refusing to move chat off-platform / outside payment:
Hi [Name], thank you for reaching out. For both of our protection, I keep communication and payments on Upwork
as required by the platform policies. I am happy to continue discussing the project details here and, if it is a
good fit, start with an Upwork contract and clear milestones. Best, [Your Name]

Template 2 — Refusing to run unsafe files/tests:
Hi [Name], I do not run unreviewed executables or install scripts from unknown sources on my machine. If you would
like to evaluate my skills, I can: (a) complete a small, clearly scoped paid test via an Upwork contract, or
(b) review the requirements and share my approach/code in a repository you can inspect. Best, [Your Name]

Template 3 — Refusing to rent/front an account:
Hi [Name], I cannot share, rent, or let anyone else use my Upwork account. That would violate platform policies
and put both of us at risk. I can only work under my own account through an official Upwork contract. Best, [Your Name]

Template 4 — Refusing "refund excess" / urgent money transfer requests:
Hi [Name], I cannot send money or refunds outside the official Upwork contract and payment process. Please handle
any payment adjustments through Upwork support. I will pause work on this conversation now. Best, [Your Name]
~~~

### 5. Reporting and self-protection
- Use the **Report/Flag** button on the Upwork conversation or job post, with a short description and evidence (message screenshots, links). (Button location may change with the interface; look in the message/job menu.)
- **Do not** click strange login links, do not enter password/OTP outside the official site; turn on two-factor authentication (2FA — a security layer requiring a second code when logging in).
- If you already ran a suspicious file: disconnect from the network, scan for malware, change passwords from a clean device, check login sessions.
- Keep all evidence on Upwork; if you lost money, contact the platform's official support.

### 6. Common mistakes
- Thinking "just chatting on Telegram, nothing lost yet": this is the first step pulling you out of protection; many scams start here.
- Being afraid to refuse for fear of losing the job: a real, serious client accepts working under a contract.
- Running a "test project" to prove your skills: propose a small paid test under a contract, or code review in a repo.
- Refunding "excess money" because you see the money arrived: the transaction can be reversed later; only handle through official channels.

### Checklist
- [ ] Keep communication and payment on Upwork until the contract/terms allow otherwise.
- [ ] Refuse moving to Telegram/WhatsApp/crypto/off-platform; use the polite templates.
- [ ] Do not run strange .zip/.exe/script files; test code only in a VM/container after reading the code.
- [ ] Never rent/lend/let others front your Upwork account; do not share login credentials.
- [ ] Never refund "excess money" outside channels; every adjustment through official support/contract.
- [ ] Turn on 2FA for Upwork and email; report (Report/Flag) suspicious conversations with evidence.
- [ ] Check non-circumvention terms and safety policies on upwork.com/legal again (change over time).

> Senior tip: set one "immutable rule" for yourself: no Upwork contract = no work, no strange executable files, no money transfers outside. This simple rule eliminates most risks. When in doubt, slow down for 10 minutes to check the client, re-read the messages, and ask the community — scammers always create urgency to make you skip checks.`,
    follow: [
      'The client really wants to meet via Zoom/Google Meet after an Upwork contract exists. How do you handle it to comply with policy and stay convenient?',
      'You spot a suspicious dependency in the "test task" project (e.g. a package running postinstall). How do you check and report back to the client?',
      'If you accidentally click a phishing link faking the Upwork login page, what are the immediate steps in the first 30 minutes?'
    ]
  },

  'remote-005': {
    q: 'Sending proposals on Upwork in both cases, how do you write differently between a long-term job/large project (many months, many parts) and a small job (a few hours to a few days)? You use screening questions, attach what, and keep what length?',
    a: `**Summary:** Sending a proposal on Upwork in both cases, but you write differently: a small job needs a **short, specific, action-oriented proposal** (prove you understand the problem and can start). A long-term/large project needs a proposal that **shows systems thinking and risk reduction** (clarify scope, propose a roadmap/milestones, communication, assumptions). In both, screening questions (questions to screen) are used to clarify scope and show competence; attachments must be "on target" (1 case study/link close to the problem), and length should be just enough to read in 60–90 seconds.

### 1. Why the two job types need different writing
**Small job** (for example: fix a NullPointerException, add one REST endpoint, optimize one query): the client wants to know you can finish quickly, correctly, without creating more work. Decisions are usually fast.
**Long-term job / large project** (for example: build a payments module, migrate monolith to services, maintain backend for 6 months): the client buys **trust over time** — risk is higher (vague scope, mismatched expectations, someone disappearing). They need to see you know how to break down problems, communicate and manage changes.

Terms: **Screening questions** — questions the client requires answers to with the proposal to filter candidates; **Milestone** (handover milestone) — a piece of work with a clear output and time; **Scope** (scope) — what is and is not part of the work.

### 2. Proposal structure comparison
| Factor | Small job (a few hours–days) | Long-term job / large project (weeks–months) |
|---|---|---|
| Goal | Solve one problem, start fast | Show competence plus risk/scope management over time |
| Opening | Mention the exact problem in the job (1 sentence) | Mention the business goal/outcome and main risks (1–2 sentences) |
| Main content | 2–3 steps to do now, 1 technical risk | Phase-by-phase roadmap/milestones, assumptions, communication & reporting |
| Evidence | 1 link/case study very close to the problem | 1–2 similar case studies by scale/complexity + how you work with a team |
| Questions | 1 clarifying question to start | 2–3 questions to clarify scope, priorities, constraints (tech, deadline, stakeholder) |
| Price/estimate | Tight estimate (hours or small fixed) + conditions | Phase-by-phase scope estimate, state what changes the estimate |
| Length | 80–150 words | 180–300 words (still concise, broken into paragraphs) |

### 3. Example proposal for a small job
~~~text
Job (assumed): "Fix slow GET /orders endpoint in Spring Boot + PostgreSQL (p95 ~2s)."

Hi [Client],
The p95 ~2s on GET /orders often comes from N+1 queries when loading order items, not just missing indexes.

How I would handle it: 1) reproduce and log SQL to confirm query count, 2) fix mapping (fetch join or @BatchSize)
and add the right index, 3) measure p95 before/after and share the numbers.
I resolved a similar Spring Data JPA issue (1.8s -> 120ms): [link/case study].

Question: are you using Spring Data JPA or native queries, and can you share the current query plan (EXPLAIN)?

Best, [Your Name]
~~~

### 4. Example proposal for a long-term job / large project
~~~text
Job (assumed): "Build and maintain a payments backend module (Spring Boot, PostgreSQL) for 4–6 months."

Hi [Client],
A payments module needs correctness and auditability first (idempotency, clear state transitions), then scale.
The main risks I see are unclear edge cases (refunds/partial capture) and scope changes mid-build.

Proposed approach (phased): 
- Phase 1 (discovery, ~1 week): confirm requirements, payment states, idempotency keys, error handling; deliver a short spec.
- Phase 2 (MVP, ~2–3 weeks): core payment flow + tests + logging/metrics; milestone-based delivery.
- Phase 3 (hardening & maintenance): retries/webhooks, monitoring, and ongoing support.

Relevant work: I built Spring Boot APIs with PostgreSQL and payment integrations (idempotent APIs, audit logs): [link].
Communication: weekly progress update, decisions documented, and clear change requests when scope shifts.

Questions: 1) Which provider (Stripe/Adyen/other) and which flows (authorize/capture/refund)? 
2) Who approves requirement changes? 3) Do you prefer hourly or fixed-price milestones per phase?

Best, [Your Name]
~~~

### 5. Screening questions: use them to screen back and show competence
Screening questions are not only for the client to filter you — you use them to **clarify scope**. Answer short, structured, with real examples.
- Small job: ask one sharp question ("Can you share the EXPLAIN/query plan and Spring Boot version?") to avoid taking a blind job.
- Long-term job: ask about priorities, acceptance criteria (conditions to consider done), the decision maker, security/compliance constraints, and how scope changes are handled.
- If the screening question is "how long/how much" but the scope is vague: give a range with assumptions, do not commit to a hard number.

~~~text
Sample screening answer (when scope is unclear):
"Based on the description, a rough estimate is 2–3 weeks for an MVP, assuming: (1) a single payment provider,
(2) authorize+capture+refund flows, and (3) APIs only (no UI). The estimate may change after I review the current
codebase and edge cases. I suggest a 1-week paid discovery milestone to produce a clear spec and fixed milestones."
~~~

### 6. What to attach (and what not to)
- **Should**: 1–2 closest links (one-page case study, GitHub README, short technical article, demo). Name clearly: "Case study: reduced p95 1.8s→120ms (Spring/JPA/Postgres)".
- **Avoid**: attaching many generic files, long unrelated CVs, or confidential documents from previous employers. Do not send source code owned by another company.
- If you have no case study yet: write one page describing a personal project solving a real problem (problem → approach → measurable result).

### 7. Common mistakes
- Using one template for every job: clients notice, especially long-term jobs that need to see your own thinking.
- Big job with a hard deadline/price while scope is still unclear: you set your own trap.
- Proposal as long as an essay: readers skim; break into paragraphs and bullet points, go straight to the point.
- Skipping screening questions or answering emptily: this is the cheapest chance to stand out.

### Checklist
- [ ] Identify the job type: small (narrow fix/feature) or long-term/large project (multiple phases).
- [ ] Open with a specific detail from the job (problem or business goal).
- [ ] Small job: 2–3 action steps + 1 clarifying question. Long-term job: roadmap/milestones + assumptions + communication.
- [ ] Answer screening questions briefly with examples; if scope is unclear, give a range with assumptions.
- [ ] Attach 1–2 links/case studies close to the problem; no confidential documents.
- [ ] Keep length ~80–150 words (small) or ~180–300 words (large), easy to read in 60–90 seconds.
- [ ] Check again: does the proposal prove you read the job and reduce risk for the client?

> Senior tip: for large projects, propose a small paid **discovery milestone** (1–2 weeks) to nail requirements, architecture and estimates. It protects both sides: the client pays little to reduce big risk, you avoid committing wrongly. In the proposal, call it a way to "de-risk the project" — this is language senior clients understand and value highly.`,
    follow: [
      'The client asks for a fixed estimate for a large project but the documentation is vague. How do you answer without refusing outright while staying safe?',
      'How do you choose and write a one-page case study from a personal project to attach to a proposal?',
      'When should you decline a long-term job even if the client seems good (scope/ownership risk signs)?'
    ]
  },

});
