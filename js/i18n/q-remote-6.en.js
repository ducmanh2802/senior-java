/*
 * English translation of js/data/q-remote.js — task T994. Format: js/core/i18n.js (content overlay).
 * ids: remote-025 remote-026 remote-027 remote-028
 */
App.i18n.content({
  'remote-025': {
    q: 'You work remotely for a foreign company on your personal laptop and access the client\'s systems over VPN. How do you ensure security and compliance: personal device vs. company-issued device, VPN/2FA, customer data (GDPR at a principles level), NDA, and the risk of conflict of interest when working for multiple parties at the same time? How do you set up safe working rules?',
    a: `**Summary:** Working remotely for a foreign client means you become part of their attack surface (the points that can be attacked). You must reduce the risk of data leaks and unauthorized access by separating devices/work environments, using VPN (a virtual private network — an encrypted tunnel to access an internal network) and 2FA (two-factor authentication — signing in requires an additional code/second device), handling client data under the principle of minimum necessary knowledge, complying with an NDA (non-disclosure agreement), and being transparent about conflicts of interest (working for two parties with conflicting interests). These are general security/compliance principles and do not replace any company\'s security policy or legal advice.

### 1. Why developers must care (not just the security team)
A small mistake can have major consequences: committing a secret (password/API key) to a repo, exposing client data via a screenshot, losing a laptop without disk encryption, or sharing an account. At many companies, violating security/NDA can lead to contract termination and legal liability. Understanding the principles helps you work fast while staying safe.

### 2. Personal device vs. company-issued device
| Criterion | Company-issued device | Personal device (BYOD — Bring Your Own Device) |
|---|---|---|
| Management/security configuration | Often has policies, MDM (device management), patches, antivirus/EDR per company standards | You are responsible for configuring security to meet the client\'s requirements |
| Data separation | Easier to separate work/personal | Risk of mixing (client files next to personal files, unfamiliar browser extensions) |
| Personal privacy | Less privacy on a company device | More privacy, but you must still protect client data |
| If lost/damaged | Report following company process; remote access revocation is often available | You must still report immediately, revoke tokens/SSH keys/sessions, and remove access |
| Recommendation | Prefer if the client provides one | If using a personal device: create a separate profile/user for work, enable disk encryption, keep the OS updated, and limit unfamiliar software |

Practical rule: if you must use a personal machine, treat it as a "work machine" while handling the client\'s data/access — separate browser profiles, separate folders, and enable automatic screen lock.

### 3. VPN, 2FA, and access management
- **VPN**: creates an encrypted connection to internal networks/resources. Enable VPN when accessing internal systems as required; do not use unknown free VPNs to handle client data.
- **2FA (two-factor authentication)**: in addition to a password, you need a second factor (an OTP app that generates a 6-digit code that changes over time, or a security key). Enable 2FA for email, Git, cloud, chat tools, and Upwork/platform accounts.
- **Secret management**: do not hard-code passwords/API keys in code; use environment variables, a secret manager (a system for managing secrets), or the mechanism the client provides. Do not send secrets over regular chat.
- **Principle of least privilege**: only request the permissions you actually need to do the work; when the task is done, ask to have access revoked.

~~~text
Minimal daily technical security checklist:
- Disk encryption enabled; screen auto-locks after a few minutes; strong password/PIN.
- Operating system and browser kept up to date with security patches.
- 2FA enabled for email, Git hosting, VPN/SSO (if any), cloud console, and project tools.
- SSH keys/tokens: set a passphrase (if used), do not share; revoke immediately if you suspect exposure.
- Repo: do not commit .env/secrets; use .gitignore; scan for secrets if the company has tooling.
- Public Wi-Fi: avoid accessing sensitive systems; if you must, use a trusted VPN and be cautious of phishing sites.
~~~

### 4. Customer data and GDPR (principles, high-level overview)
**GDPR** (General Data Protection Regulation — the EU\'s personal data protection regulation) is a large legal framework; if the client has EU users or processes personal data related to the EU, they may need to comply. You do not need to become a GDPR lawyer, but you do need to understand the principles when coding/handling data:

- **Personal data**: information that can identify a person (name, email, address, phone number, ID, sometimes IP/combined data). Treat it as sensitive.
- **Data minimization**: only collect/view/store what is truly necessary for the purpose of the work.
- **Clear purpose**: do not use client data for anything else (e.g., copying it into a personal project).
- **Protection in storage/transit**: encrypt in transit (HTTPS/TLS), control access, and do not send real data over insecure channels.
- **Careful logging**: do not write sensitive personal data (passwords, tokens, full card numbers, health information...) to logs. Bad example: {{log.info("user password=" + password)}}. Good example: log event IDs, error codes, status — mask sensitive data.
- **Access/deletion rights (principle level)**: the system may need to support retrieving/deleting data upon valid request; follow the client\'s design/policies.

~~~text
Example of safe thinking when debugging (hypothetical):
You need to debug a payment error. DO NOT download the production database to your personal machine.
Instead: use logs/metrics with sensitive data masked, access a staging environment with synthetic data,
or request a safe query run by someone with the right permissions that returns only minimal information (e.g., count, status, timestamp).
~~~

### 5. NDA and information sharing
An **NDA** binds you to keep client information confidential (code, architecture, data, roadmap, business information). Practices:
- Do not share client screenshots/code/data on social media, blogs, or public portfolios unless you have explicit permission.
- When writing a case study, get permission and anonymize: remove the company name, sensitive figures, and identifying details; keep only general technical lessons if allowed.
- Do not discuss the client\'s internal details in public places.

### 6. Conflict of interest when working for multiple parties
Working for multiple clients at the same time can be legal for a contractor, but it carries conflict-of-interest risks:
- **Direct competition**: working for two competitors in the same domain, using sensitive knowledge from one side for the other — often prohibited by NDA/contract.
- **Overlapping hours/depleted capacity**: committing full-time to two parties or letting quality drop.
- **Reusing assets without permission**: copying proprietary code/documents from client A to client B.

~~~text
Conflict-of-interest self-check (before accepting a new job):
- Does my current contract allow taking on additional, non-conflicting work? Are there exclusivity/time restrictions?
- Is the new client a direct competitor or in the same sensitive product space as my current client?
- Do I have enough time/capacity without affecting existing commitments?
- Can I describe my experience in general terms without using/ disclosing the former client\'s secrets or source code?
If in doubt: ask clearly in writing, or decline to protect your reputation and comply with the contract.
~~~

### 7. Common mistakes
- Committing a {{.env}} file or an API key to Git: secrets leak even in a private repo if shared incorrectly; rotate the key immediately if exposed.
- Sending production data over personal email/chat to "debug quickly": violates data controls.
- Using the same laptop/profile for multiple clients without separation: increases the risk of cross-leaking data/documents.
- Taking two competing jobs because "the clients won\'t know": legal risk and reputation damage.
- Thinking "GDPR is the lawyer\'s job, developers aren\'t involved": developers decide what gets logged, stored, displayed, and accessed.

### Checklist
- [ ] Separate work environments: a company-issued device if available; if using a personal one, a separate profile/user, disk encryption, and screen lock.
- [ ] Enable 2FA for all work-related accounts; use VPN per the client\'s policy; manage secrets safely (no hard-coding, no committing).
- [ ] Apply least privilege: only request necessary permissions; ask to revoke them when the task is done.
- [ ] Handle personal data under the minimization principle: do not copy real data outside, mask sensitive data in logs, use staging/synthetic data when debugging.
- [ ] Comply with the NDA: do not share the client\'s code/documents/data; get permission before publishing a public case study.
- [ ] Check for conflicts of interest before taking on additional work; be transparent and comply with contract terms.
- [ ] If you suspect an incident (lost device, leaked secret, phishing click): report immediately to the client/relevant parties, revoke access, and rotate secrets.

> Senior tip: security and compliance are not obstacles to work around — they are part of "professional quality" when working remotely for international clients. Build safe default habits (2FA, no committing secrets, no taking real data outside, read the NDA) so you don\'t have to re-decide each time. When you face an ambiguous situation (e.g., a client asks you to send a user-data export over a non-standard channel), pause, ask for confirmation in writing, and choose the approach with access controls — being a bit safer today is always cheaper than handling a data leak tomorrow.`,
    follow: [
      'You accidentally committed an API key to a private repo and pushed it. How do you handle the incident in the first 30 minutes and afterward to prevent recurrence?',
      'A client asks you to export a list of real user emails for a "quick check" and send it via Slack. How do you respond and propose a safer alternative?',
      'You are a contractor for company A and receive an offer from company B in the same domain. How do you assess the conflict of interest and decide?'
    ]
  },
  'remote-026': {
    q: 'Workshop: dissect a (hypothetical) Upwork profile of a Java developer full of mistakes. Point out each mistake, rewrite a complete profile in English, and explain why the new version is better.',
    a: `**Summary:** Hands-on exercise: a "bad" profile typically lists generic technologies, talks about the person instead of value to the client, has no evidence, and leaves risk signals (not specialized, no clear outcomes). A "good" profile picks a **niche** (a narrow area you solve very clearly), opens with the problem the client faces, provides measurable evidence, and uses the keywords clients search for. We\'ll go step by step: review the original profile → list the mistakes → rewrite it → compare.

### 1. Terms to know (first appearance)
- **Profile**: the page introducing you on the platform, including title, overview, skills, portfolio, and experience; it is the "landing page" when a client views you.
- **Title** (professional headline): the short line shown next to your name; it affects whether you appear in search and whether people click.
- **Overview** (introduction): the description; the first 2–3 lines often appear in search results, so they must "hook" the problem right away.
- **Portfolio**: sample projects describing the problem → what you did → the result; these can be company projects (anonymized if under NDA), personal projects, or case studies.
- **Niche**: the narrow set of clients/problems you target (e.g., "optimizing Spring Boot API + PostgreSQL performance") instead of "doing everything." A niche helps clients see you as "the right person."
- **Keyword**: words clients type when searching (Spring Boot, REST API, PostgreSQL, performance tuning). Use them naturally in the title/overview/skills.

### 2. Hypothetical profile (with mistakes) — for analysis
Assume this is the profile of a Java developer with 4 years of experience in Vietnam (the person and content are entirely hypothetical, not a real person):

~~~text
[ORIGINAL PROFILE — HYPOTHETICAL, WITH MISTAKES]

Title:
Full-Stack Developer | Java | React | Node | Python | AWS | Docker

Overview:
Hello, my name is Nam. I am a hardworking and passionate software developer with 4 years of experience.
I can do backend and frontend. I know Java, Spring, Spring Boot, Hibernate, MySQL, PostgreSQL, MongoDB,
React, Node.js, Python, Docker, Kubernetes, AWS, Microservices, REST API, GraphQL and many more.
I always try my best to finish the job on time. I am a fast learner and good team player.
I am looking for long-term projects. Please give me a chance, I will not disappoint you.

Skills: Java, JavaScript, Python, React, Spring, SQL, AWS, Docker

Portfolio: (empty)

Employment history: "Backend Developer at a software company" (no results described)
~~~

### 3. Dissecting each mistake
| Section | Mistake | Why it hurts | How to fix |
|---|---|---|---|
| Title | Lists too many technologies, no niche | A client with "fix slow Spring Boot API" doesn\'t see "the right person"; looks like doing everything but nothing deeply | Pick 1 clear niche (Java/Spring Boot backend) + 2–3 core capabilities clients search for |
| Overview opening | Starts with "Hello, my name is…" | The first 2 lines appear in search results — wasted, no value for the client | Lines 1–2: what problem you solve, for whom, and with what outcome |
| Overview content | Long technology list ("and many more") | Proves nothing; clients don\'t know what you used those things for | 2–3 areas you\'re strong in + evidence (projects, numbers) for each |
| Tone | "hardworking, try my best, give me a chance" | Talks about your effort, not reducing risk for the client; sounds lacking in confidence | Talk about process, clear commitments (scope, communication, testing) and results achieved |
| Portfolio | Empty | No evidence → high risk for someone with no reviews | Add 2–3 case studies (anonymized if needed): problem → solution → measurable result |
| Skills | Too broad, not aligned with the niche | Inconsistent signal with the title | Keep skills aligned with the Java backend niche; drop things you don\'t want jobs for |
| Employment | No results | "Worked at a software company" says nothing about the value you created | Write by outcomes: "Built/optimized X, achieved Y" |

### 4. Complete rewrite (English, ready to use)
~~~text
[TITLE]
Java Spring Boot Backend Engineer | REST APIs, PostgreSQL, Performance & Reliability

[OVERVIEW]
I help teams fix and build Java backends that stay fast and reliable in production.
Over 4 years, I have shipped and maintained Spring Boot services for web products: REST APIs,
database-heavy features, and performance issues that show up under real traffic.

What I do best (with examples):
- Backend APIs (Spring Boot 3.x, Java 17): design and implement REST endpoints, validation,
  pagination, and error handling that are easy for frontend/mobile teams to integrate.
  Example (anonymized): built booking-style CRUD APIs with clear request/response contracts and tests.
- PostgreSQL performance: find slow queries (N+1, missing indexes, heavy joins) and fix them with
  measurable results. Example (assumed numbers): reduced p95 response time from 1.8s to 140ms on a
  read endpoint by fixing N+1 queries and adding the right index.
- Reliability and debugging: reproduce issues, read logs/stack traces, add tests, and deliver a clear
  root-cause explanation with a safe fix.

How I work (remote-friendly):
- I confirm scope and acceptance criteria (what "done" means) before coding.
- I share short progress updates and demo what is done (async updates work well across time zones).
- I deliver tested code, a short README/run notes, and a clear handover.

If you have a slow endpoint, a bug in a Spring Boot service, or need a well-tested API feature,
send me the context (stack, logs/error, expected behavior) and I will propose a practical plan.

[SKILLS — pick a group aligned with the niche]
Java, Spring Boot, REST APIs, PostgreSQL, JPA/Hibernate, SQL, JUnit, Git, Docker (basic)

[PORTFOLIO CASE STUDY 1 — anonymized, assumed numbers clearly noted]
Title: Fixing a slow orders API (Spring Boot + PostgreSQL) — anonymized case study
Problem: A paginated orders endpoint became slow as data grew (assumed: p95 ~1.8s at ~50k rows).
Work: Enabled SQL logging to confirm query count, removed N+1 by using a fetch join/batch fetching,
      added an index on the foreign key, and verified with before/after measurements.
Result (assumed): p95 improved to ~140ms; added tests for the endpoint behavior.
My role: analysis, implementation, testing, and handover notes.

[PORTFOLIO CASE STUDY 2 — a personal/simulated project is fine if honest]
Title: Booking-style REST API (personal project)
Problem: Practice project to design a small booking workflow with clean API contracts.
Work: Implemented CRUD endpoints, input validation, pagination, and integration tests with a local DB.
Result: Working demo repository with README and sample requests.
Note: Personal/learning project (shared to demonstrate approach and code quality).
~~~

### 5. Why the new version is better (from the client\'s perspective)
- **Clear**: the client knows what you do (Spring Boot backend, APIs, PostgreSQL, performance) within 5 seconds.
- **Risk-reducing**: there is a process (scope, acceptance criteria, updates, tests, handover) — the client can picture you working in a controlled way.
- **Evidence-backed**: case studies state problem → action → result; assumed numbers are honestly noted.
- **Client\'s language**: uses the keywords they search for and talks about "fix slow endpoint/bug/ship tested API" instead of "I try my best."

### 6. Common mistakes when fixing a profile
- Rewriting it but still listing 15 technologies: the niche is not truly narrow.
- Fabricating numbers/results: very risky (the client may dig deeper; you lose credibility if exposed). If something is assumed or a personal project, say so clearly.
- Copying a sample overview from the internet: easy to duplicate, lacking your personality and real evidence.
- Leaving the portfolio empty because "I don\'t have polished projects": a small, honest case study with a README is better than nothing.

### Checklist
- [ ] Pick 1 main niche (e.g., Spring Boot REST + PostgreSQL performance/bug fixing) and reflect it in the title.
- [ ] Write the first 2 overview lines with the formula: who you help + what problem you solve + brief evidence.
- [ ] Replace "hardworking/give me a chance" with a working process and concrete commitments (scope, updates, tests, handover).
- [ ] Create 2 portfolio case studies with the structure Problem → Work done → Result (real numbers; if assumed, state it clearly).
- [ ] Adjust skills to match the niche; drop skills you don\'t want jobs for.
- [ ] Check English spelling and read it as a client: "would I dare hire this person for job X?"

> Senior tip: a profile is not a CV listing everything you know — it is a **value proposition** for a specific group of clients. For a newcomer with no reviews, substitute evidence includes: honest case studies, a repo with a README, a clearly described working process, and fast/professional responses. Once you have 2–3 good reviews, update your profile to reflect proven capabilities rather than keeping the "give me a chance" version.`,
    follow: [
      'If you have no company projects you are allowed to publish (due to NDA), how do you create a portfolio case study that is still honest and safe?',
      'Should you use one general profile or multiple Specialized Profiles on Upwork, and when should you split them?',
      'Where do the first two overview lines appear on Upwork, and how would you A/B test (try two versions of) that content in practice?'
    ]
  },
  'remote-027': {
    q: 'Workshop: for the same hypothetical job post "fix a slow Spring Boot API error", there are 3 proposals (bad, average, good). Score them against criteria and explain why the good one wins.',
    a: `**Summary:** For the same job, the winning proposal is usually not the longest or the cheapest, but the one that **reduces risk fastest**: it proves the job was read, offers a reasonable hypothesis, states concrete steps, asks the right clarifying questions, and provides relevant evidence. We\'ll score 3 proposals against a rubric (criteria table) to make the differences clear. (The job post, proposals, names, and numbers are all hypothetical for practice.)

### 1. Terms to know
- **Job post**: the listing describing the work the client needs, scope, stack, budget/timeline (if any).
- **Proposal**: the application you submit with your rate/terms; it is your first "sales" touchpoint.
- **Rubric** (scoring criteria table): a list of criteria with a scoring scale to evaluate fairly and avoid judging by gut feel.
- **Hypothesis**: a guessed cause based on signals (e.g., a slow API might be due to an N+1 query — running N repeated queries for N child records); a hypothesis must be verified, not asserted with certainty before seeing the system.

### 2. Hypothetical job post
~~~text
[JOB POST — HYPOTHETICAL]
Title: Fix slow Spring Boot REST API endpoint (PostgreSQL)
Description:
We have a Spring Boot 3 (Java 17) REST API. The endpoint GET /api/orders becomes very slow when
the orders table grows (pagination is used, but response time is still bad). Stack: Spring Boot,
Spring Data JPA (Hibernate), PostgreSQL, deployed on a Linux VM. We can provide logs and DB access
to a staging environment.
Goal: find the root cause and fix it, with before/after measurements.
Budget: open to hourly or a small fixed-price milestone. Prefer someone who can start this week.
~~~

### 3. Three hypothetical proposals
~~~text
[PROPOSAL A — BAD (copy-paste, generic)]
Dear Sir/Madam,
I am a highly skilled full-stack developer with 4+ years of experience in Java, Spring Boot, React,
Node.js, Python, AWS, Docker, Kubernetes and databases. I can do any task quickly and perfectly.
I have read your job description and I am very interested. I can fix your issue fast.
My rate is very low and I am available 24/7. Please hire me, I will not disappoint you.
Thanks.
~~~

~~~text
[PROPOSAL B — AVERAGE (good intent but lacks specifics)]
Hi, I have 4 years of experience with Spring Boot and PostgreSQL. I have fixed slow APIs before.
I can check your code and database and make the endpoint faster. I can start this week.
My hourly rate is $20. Let me know if you want to discuss.
~~~

~~~text
[PROPOSAL C — GOOD (risk-reducing, specific, evidence-backed)]
Hi — slow GET /api/orders with Spring Boot 3 + Spring Data JPA/PostgreSQL often comes from N+1
queries (Hibernate runs one query per related row), missing indexes, or fetching too much data for
pagination. I would confirm the cause before changing code.

Plan (small, measurable):
1) Reproduce on staging and measure baseline (p95 latency, query count) with SQL logging enabled.
2) Find root cause: check generated SQL, EXPLAIN/ANALYZE on the slow query, and entity mappings.
3) Fix safely (examples: fetch join/batch fetching, add the right index, adjust DTO/projection),
   then measure before/after and add a test for the endpoint behavior.

Relevant example (anonymized, assumed numbers): I fixed a similar paginated orders endpoint where p95
dropped from ~1.8s to ~140ms after removing N+1 queries and adding an index.

Question: can you share staging access, the entity/mapping for Order and its relations, and whether
the slowdown happens on all pages or specific filters/sorts?
If helpful, I can start with a short paid investigation milestone to deliver the root-cause report
and fix plan.
~~~

### 4. Scoring against a rubric (0–2 points per criterion, 12 max)
| Criterion | A (bad) | B (average) | C (good) | Notes |
|---|---|---|---|---|
| Proves the job was read (mentions the right stack/problem) | 0 | 1 | 2 | C mentions GET /api/orders, Spring Boot 3, JPA/Hibernate, PostgreSQL, staging, before/after measurement |
| Reasonable hypothesis/approach | 0 | 1 | 2 | C cites N+1/index/fetching too much and emphasizes "confirm before changing code" — the right technical attitude |
| Concrete, measurable steps | 0 | 1 | 2 | C has 3 steps + baseline p95/query count + EXPLAIN/ANALYZE + test |
| Relevant evidence | 0 | 1 | 2 | A boasts a list; B speaks generally; C has an anonymized case, clearly noting assumed numbers |
| Quality clarifying questions | 0 | 0 | 2 | C asks for exactly what\'s needed to diagnose (staging, mappings, when it\'s slow) — opens a technical conversation |
| Professional, risk-reducing tone | 0 | 1 | 2 | A begs "please hire me/24-7/very low rate"; C talks about process, measurement, an investigation milestone |
| **Total** | **0/12** | **5/12** | **12/12** | (illustrative scores under this rubric) |

### 5. Why C wins (the client\'s perspective)
- **Sees the right problem**: mentions the exact endpoint and stack → not copy-paste.
- **Credible technically**: cites common causes (N+1 — explained briefly in parentheses) but does not jump to conclusions; proposes measuring a baseline and using EXPLAIN/ANALYZE (a DB tool that shows a query\'s execution plan).
- **Reduces cost risk**: proposes a small paid investigation milestone to deliver a root-cause report before committing to a big fix — easy for the client to agree to.
- **Easy to respond to**: the closing questions are specific; the client only needs to provide information and the conversation moves forward.

### 6. How to lift proposal B toward C (quick fixes)
~~~text
Draft improvements for B (ideas):
- Add an opening line mentioning GET /api/orders + Spring Data JPA/Hibernate + PostgreSQL.
- Change "check your code and database" into 3 steps: baseline (p95, SQL log) → root cause (N+1/index/EXPLAIN) → fix + before/after + test.
- Add 1 specific (anonymized) piece of evidence and 1–2 clarifying questions (relationship mappings, which filters/sorts are slow).
- Remove generic lines; keep it short (150–250 words).
~~~

### 7. Common mistakes
- Writing a proposal like a CV: listing every technology you know instead of solving this job.
- Asserting the cause before seeing the system: "it\'s definitely a missing index" — unprofessional; say "it might be" and explain how to confirm.
- Only saying "I can fix it fast": fast with no plan = risk.
- Skipping clarifying questions: you miss the chance to turn the proposal into a conversation.

### Checklist
- [ ] Read the job post and highlight 3 specific details (endpoint/stack/goal/constraints) to echo in the opening line.
- [ ] State 1–2 reasonable hypotheses and how to verify them (baseline, logs, EXPLAIN/ANALYZE) — do not jump to conclusions.
- [ ] Write a 2–4 step plan with measurable outputs (before/after, tests, root-cause report).
- [ ] Provide 1 relevant piece of evidence (anonymized case); clearly note if numbers are assumed.
- [ ] End with 1–2 clarifying questions to open a conversation; propose a small investigation milestone if scope is unclear.
- [ ] Self-score your proposal against the rubric (read carefully? plan? evidence? questions?) before sending.

> Senior tip: a good proposal is a **mini design doc for the first step**, not self-advertising. For a performance-fix job, clients fear two things: (1) someone guessing and breaking more, and (2) spending money without knowing it got better. If you show you will measure a baseline, find a root cause with evidence, and compare before/after, you are selling "certainty" — something worth paying more for than "I code fast." (Service fees, Connects, and proposal-submission details change over time; check Upwork at the time of writing.)`,
    follow: [
      'How would you adjust proposal C if the client demands fixed-price upfront and does not want to pay for a separate investigation step?',
      'What criteria are missing from the rubric above (e.g., security, time-zone communication, rollback risk)? Add criteria and re-score.',
      'If the job post is very short and vague, can you still write a specific proposal? Describe your strategy for questions and safe assumptions.'
    ]
  },
  'remote-028': {
    q: 'Workshop: you have 40 Connects (hypothetical) and see 5 hypothetical Java backend job posts. Each job has good/bad signals about the client, scope, and budget. Decide whether to send or skip, estimate how many Connects are worth spending, and explain your reasoning.',
    a: `**Summary:** The goal is not "send as many as possible" but to **maximize expected value per Connect**: pick jobs with a trustworthy client, clear scope, high fit, and manageable competition. For the 5 hypothetical jobs below, we\'ll mark SEND/SKIP, estimate the Connect cost (only an estimate because the number of Connects per proposal varies by job), and give reasons. (All jobs, names, and numbers are hypothetical.)

### 1. Terms and Connects mechanics (explained from first principles)
- **Connects**: the "tickets" used to send proposals. You buy Connects and spend them when submitting a proposal; the number of Connects required per proposal **varies by job** (it can differ, and some jobs cost 0 Connects). Responding to an invite (when a client reaches out to you) usually costs no Connects. (As of 2026-11-07: $0.15 USD/Connect, minimum purchase 10; Basic plan 10 Connects/month, Freelancer Plus $19.99/month includes 100 Connects/month; Connects expire after 1 year. Source: support.upwork.com/upwork.com. **Check again on Upwork because this may change.**)
- **Hire rate**: the share of jobs a client posts that they actually hire for — a signal of whether they "buy" or just research.
- **Payment verified**: the client has verified a payment method — reduces the risk of not being paid.
- **Scope creep**: the client keeps adding work beyond the original agreement.

Because the Connects/proposal count varies by job and changes over time, this exercise uses **illustrative estimates** (e.g., 6–16 Connects/proposal depending on competition/job type). In a real decision, look at the number Upwork displays before you send.

### 2. Five hypothetical job posts
~~~text
JOB 1 — "Fix N+1 query in Spring Boot orders API" (posted 3 hours ago)
Client: payment verified, hired 12 times, ~$8,500 spent, ~60% hire rate, good freelancer reviews.
Scope: clear (GET /orders slow, stack Spring Boot + JPA + PostgreSQL, staging + logs available).
Budget: hourly, reasonable displayed range. Proposals: ~8. Time zone: 2–3 hours overlap with Vietnam.
~~~
~~~text
JOB 2 — "Build the next Uber for pets" (posted 1 day ago)
Client: payment verified but new, 0 hires, $0 spent.
Scope: very vague, many platforms (mobile/web/backend), "small budget to start".
Budget: very low fixed-price relative to scope. Proposals: ~45.
~~~
~~~text
JOB 3 — "Add pagination + fix bug in existing Spring Boot REST API" (posted 5 hours ago)
Client: payment verified, hired 2 times, ~$600 spent, short but positive reviews.
Scope: fairly clear (2 specific tasks), repo available, Java 17/Spring Boot 3. Needed in 3–5 days.
Budget: small fixed-price, tight scope if limited to exactly 2 tasks. Proposals: ~12.
~~~
~~~text
JOB 4 — "Java developer needed ASAP" (posted 6 days ago)
Client: payment not verified, 0 hires, 2-line description, asks to "work on WhatsApp/Telegram".
Scope: unclear, signal of moving communication/payment off the platform.
Budget: unclear. Proposals: ~30. Recent activity: none visible.
~~~
~~~text
JOB 5 — "Migrate legacy SOAP service to REST (Spring Boot), need senior advice" (posted 8 hours ago)
Client: payment verified, 20+ hires, ~$40k spent, ~50% hire rate, detailed reviews.
Scope: moderately clear (migrate 1 service), needs migration experience; WSDL and endpoint list provided.
Budget: hourly, open to discovery. Proposals: ~18. Requires: good communication, discussion-hour overlap.
~~~

### 3. Decisions and Connect estimates (hypothetical)
| Job | Decision | Estimated Connects (illustrative) | Win likelihood (feel) | Short reason |
|---|---|---|---|---|
| 1 | **SEND (high priority)** | ~8–12 | High if the proposal is good | Strong client, very clear scope, niche fit (JPA/performance), moderate competition, staging available |
| 2 | **SKIP** | 0 (save) | Very low | Huge vague scope, budget/scope mismatch, unproven new client, high competition |
| 3 | **SEND (medium priority)** | ~6–10 | Medium–fair | Small clear job (good for earning a review), client has history; lock down the 2-task scope to avoid scope creep |
| 4 | **SKIP + be cautious** | 0 | Not worth it | Not verified, unclear scope, requests off-platform channels (WhatsApp/Telegram) — a risk/circumvention signal |
| 5 | **SEND selectively** | ~10–16 | Medium | Excellent client, valuable job; but you must prove migration/SOAP→REST experience and communication; if you lack evidence, prioritize jobs 1,3 |

Total hypothetical Connects if sending 1,3,5: ~24–38 (within 40). If you are new and need a review quickly, a safer strategy is to **send 1 and 3** first and keep Connects in reserve.

### 4. A simple "worth spending Connects?" framework
Before hitting send, self-score 4 questions (0/1/2 each): (1) Is the client trustworthy? (2) Is the scope clear enough to estimate? (3) Do I have directly matching evidence? (4) Is the competition/Connect cost acceptable?
- 7–8 points: send, invest in a high-quality proposal.
- 5–6 points: send only if you have a strong angle or the job helps you get a review/portfolio piece.
- ≤4 points: skip.

~~~text
Quick application:
Job 1: (2,2,2,2)=8 → SEND.  Job 2: (1,0,0,0)=1 → SKIP.  Job 3: (2,2,1,1)=6 → SEND conditionally (lock scope).
Job 4: (0,0,0,0)=0 → SKIP.  Job 5: (2,1,1,1)=5 → SEND if you have migration evidence; otherwise SKIP.
~~~

### 5. Risks to call out in the proposal (when you send)
- **Job 1**: confirm the cause of slowness with measurement (p95, SQL log, EXPLAIN) before fixing — avoid "guessing."
- **Job 3**: list the exact 2 tasks in scope and state "changes beyond these 2 tasks will be re-estimated" to prevent scope creep.
- **Job 5**: propose a short discovery (audit WSDL, mapping, compatibility risks) before committing to a full migration timeline.

### 6. Common mistakes
- Sending to job 2 because of "dream big project": usually burns Connects and time.
- Ignoring the off-platform channel signal (job 4): violates platform terms and carries fraud/payment risk.
- Looking at budget but ignoring scope: small fixed-price + vague scope = doing the extra work for free.
- Not tracking results: after 10–20 proposals, review which job types get responses and adjust your filters.

### Checklist
- [ ] Check the client: payment verified, hire/spend history, hire rate, reviews (read negative ones too).
- [ ] Check the scope: specific enough to estimate? clear deliverables? stack fits you?
- [ ] Look at the Connects count shown before sending (varies by job; platform numbers change — check again).
- [ ] Quick-score the 4 criteria (client/scope/fit/competition) and send only when ≥5–6 points.
- [ ] For chosen jobs: write a proposal that echoes job details, states a plan + risks + clarifying questions.
- [ ] Record decisions (send/skip/reason) to learn from your response rate after 2–4 weeks.

> Senior tip: Connects are a measurable investment cost, not lottery tickets. Manage them like an **experiment budget**: pick a narrow lane (Java/Spring Boot + PostgreSQL/performance/bugfix), send fewer but higher-quality proposals, and measure view → response → interview → win rates. When the data shows a job type never responds, stop "burning" Connects on it, even if the jobs look attractive. (The Connect/fee numbers in this exercise are illustrative or as of the time of writing; always check Upwork.)`,
    follow: [
      'How would you respond if job 4 messages you privately and pushes you to contact them on Telegram to "discuss quickly"?',
      'For job 3 (small fixed-price, 2 tasks), how would you write the scope-lock statement in the proposal and in the first message?',
      'If, after 15 high-quality proposals to jobs like 1 and 3, your response rate is still near zero, which variables would you change first?'
    ]
  },
});
