/*
 * English translation of js/data/q-remote.js — task T1052. Format: js/core/i18n.js (content overlay).
 * ids: remote-006 remote-007 remote-008 remote-009 remote-010
 */
App.i18n.content({
  'remote-006': {
    q: 'A client invites you to a video call interview for a Java backend job on Upwork. How do you prepare, how do you open, how do you handle not hearing clearly, how do you present the solution and estimate, and how do you close with the next step?',
    a: `**Summary:** A video call interview (video call) with an Upwork client is a **two-way discovery session**: the client assesses whether you can solve their problem, you assess whether the job is clear and worth doing. Prepare by reading the job carefully, preparing 2–3 result stories (with numbers), and questions to clarify scope. On the call: open briefly, proactively ask to repeat when you don't hear clearly (that's normal), present the solution with structure "problem → approach → risks → estimate with assumptions", and always close with a concrete next step before ending.

### 1. Why preparation decides
Many devs strong technically but "drift" on the call because they ramble or don't ask back about scope. The client doesn't need a lecture; they need to see you: (a) understand the problem, (b) have a practical approach, (c) communicate clearly. 30–45 minutes of preparation usually increases your chances clearly.

### 2. Prepare before the call (30–45 minutes)
- **Re-read**: the job post, the proposal you sent, previous messages, the client/company profile (product they build, scale).
- **Prepare 2 "mini case studies"**: each 60–90 seconds, structure Situation → Action → Result with numbers (example: "Spring Boot API p95 1.8s -> analyzed query -> added fetch join + index -> 120ms").
- **Prepare clarifying questions**: business goal, "done" criteria, stack/version, who decides, deadline, communication style (async — no real-time needed; or frequent meetings).
- **Environment**: stable internet, clear headset/mic, tidy background, IDE/docs open in advance (only if sharing screen), turn off notifications. Check time zone and send call time confirmation.

### 3. Open the call (30–60 seconds)
~~~text
Opening sample (English):
"Hi [Name], nice to meet you. I am [Your Name], a Java/Spring Boot backend engineer. I have read your post about
[briefly restate the problem, e.g., reducing latency on the /orders API]. Before I suggest an approach, could I ask
a few quick questions to make sure I understand the context and priorities?"

(brief, restates the problem correctly, asks permission to ask — shows you don't guess)
~~~

### 4. When you don't hear clearly
Not hearing clearly **is not a penalty** if you handle it proactively. Don't guess and then answer wrong.

~~~text
Polite/professional samples to ask for repetition / clarification:
- "Sorry, I did not catch that last part. Could you say it again, please?"
- "Just to make sure I understood: you mean [paraphrase what you heard]. Is that right?"
- "Could you please speak a little more slowly? I want to make sure I address your question correctly."
- "Would you mind typing that term/name in the chat? I want to get it exactly right."
- "Let me summarize what I heard: [summary]. Did I miss anything?"

(Paraphrase — restating in your own words — is a powerful technique: it confirms understanding and shows the client you are listening.)
~~~

### 5. Present solution and estimate
Don't jump straight into code details. Use a 4-part structure:
1. **Problem/Goal**: "As I understand it, the goal is … and success means …"
2. **Approach**: 2–4 steps, state tools/techniques at an appropriate level (fetch join, index, caching, idempotency key — depending on the job).
3. **Risks/Assumptions**: "This assumes …; a risk is … so I would …"
4. **Estimate with assumptions**: state a range, tie it to assumptions; suggest a small paid investigation milestone first if unclear.

~~~text
Example answer (assumed, API optimization job):
"Goal: bring GET /orders p95 under 300ms.
Approach: (1) reproduce and capture the SQL/query plan, (2) fix likely N+1 with a fetch join or @BatchSize and add
a supporting index, (3) verify with before/after metrics and add a regression test.
Risks: if the bottleneck is elsewhere (e.g., network or a downstream call), step 1 will show it.
Estimate: roughly 4–8 hours assuming I can access logs and the schema; if the scope is larger, I suggest a small
paid investigation milestone first. Does that align with what you need?"
~~~

### 6. Close with the next step (don't let the call end vaguely)
~~~text
Sample closing at end of call:
"Thank you for your time. As a next step, would you like me to send: (1) a short written summary of the approach
and assumptions, and (2) a proposed milestone/estimate on Upwork? If you share [logs/schema/access details],
I can start with the investigation milestone. What timeline are you aiming for?"
~~~

After the call: send a summary message on Upwork (thank you, summary of approach, assumptions, next step, estimate). This creates a clear "paper trail" and shows professionalism.

### 7. Common mistakes
- Talking too much about yourself ("I have 4 years of Java, know Spring, Docker…") instead of talking about the client's problem.
- Guessing when you don't hear clearly: leads to off-target answers; asking to repeat is always better.
- Committing to a hard deadline/price before having enough information: state a range + assumptions.
- Not asking back: you also need to assess the client (is scope clear, how do they respond, are expectations realistic?).
- Ending the call without a next step: the opportunity cools off quickly.

### Checklist
- [ ] Re-read job/proposal/messages; prepare 2 mini case studies with numbers (60–90 seconds each).
- [ ] Prepare 4–6 clarifying questions: goal, done criteria, stack, decision maker, deadline, communication.
- [ ] Check tech: internet, mic/headset, camera/background, time zone; turn off notifications.
- [ ] Open briefly: restate the problem correctly + ask permission to ask. When you don't hear clearly: ask to repeat / paraphrase, don't guess.
- [ ] Present: problem → approach (2–4 steps) → risks/assumptions → estimate as a range.
- [ ] Close with a concrete next step (send summary, milestone, timeline); after the call, send a summary message on Upwork.
- [ ] Assess the client back: scope, expectations, responsiveness — politely decline if signals are bad.

> Senior tip: Treat the last 5 minutes as the most important. A post-call summary on Upwork (3–5 bullets: what you understood, what you will do, assumptions, estimate, next step) is often what makes the client choose you — because it shows you work with structure and reduce risk for them, exactly what they buy when hiring a senior.`,
    follow: [
      'The client asks you to live-code or share your screen to debug right on the call. How do you prepare and handle it?',
      'How do you estimate a backend task (e.g., add an API + DB migration) to give a reasonable range?',
      'When you and the client are 11 time zones apart, how do you propose an async communication process (no real-time meetings)?'
    ]
  },
  'remote-007': {
    q: 'You are a new freelancer on Upwork. How should you use (or avoid) these features: Boosted proposal, Availability badge, profile visibility, Upwork Academy/skill test? Which are worth it for a beginner?',
    a: `**Summary:** These features all aim to **increase visibility** or **trust signals**, but they don't replace core capability: a clear profile, job-targeted proposal, real evidence. For a beginner, the most "worth it" things are usually: complete your profile/portfolio, use Upwork Academy (learn platform mechanics — usually free) to avoid costly mistakes, and **save Connects** for jobs that truly match. Avoid paying to boost when your proposal/profile is still weak. (Feature names, prices, and terms change; describe by mechanism, check the official page at time of use.)

### 1. Why understand the mechanism (don't chase buttons)
Upwork sells ways to stand out in the crowd. The right question is not "should I click?" but **what does this button amplify?** If your proposal/profile isn't convincing, amplifying just helps you get skipped faster (and costs money/Connects).

Terms: **Visibility** — how much your profile/proposal is seen by clients; **Signal** — signs that help the client trust you (reviews, history, verification, badge); **Boost/Bid** — using extra Connects to push your proposal to a higher position in the list.

### 2. Each feature: mechanism, when to consider, risks
| Feature | Mechanism (description) | Beginners should use when | Risks / Notes |
|---|---|---|---|
| Boosted proposal (Connects bidding) | You add extra Connects so your proposal has a chance to appear higher; bidding is relative to others | You **strongly match** the job, client quality is good, proposal is tailored; treat extra Connects as a controlled trial cost | Burns Connects fast; doesn't rescue a generic proposal; position advantage doesn't guarantee winning. Value depends on bid level and competitors (changes). |
| Availability badge | Shows you're available to take work (usually a recurring paid feature, terms change) | You're truly available, respond quickly, and already have a solid profile/proposal | Costs money periodically; meaningless if you don't respond quickly or have no suitable jobs. Check current cost/terms before turning on. |
| Profile visibility | Adjusts how much your profile appears in search/invites (options may include on/off or different levels over time) | Always keep info accurate; if busy, adjust to reflect reality | Don't turn off when you need a job; don't leave profile "public" with outdated info. Mechanism/labels may change with the UI. |
| Upwork Academy / guides & skill tests | Resources to learn how to use the platform; some tests/skills add extra signals to your profile (depending on time) | **Use early**: learn policies, how to write proposals, how to avoid violations; do tests/badges only when you do well and they're relevant | Free/low-cost learning is usually worth it; skill tests don't replace real reviews. Check if the feature still exists/renamed. |

### 3. Priority order for beginners (most worth it → lowest priority)
~~~text
Priority 1 (almost always worth it): Basic foundation
- Narrow, clear value profile; 2–3 case studies/portfolio with numbers; account verification; clear photo/specialty.
- Read policies (avoid non-circumvention, know escrow/hourly protection mechanisms).

Priority 2 (worth it if free/low cost): Learn the mechanism
- Upwork Academy / official guides to avoid Connects-wasting mistakes and violations.

Priority 3 (consider with control): Boosted proposal
- Only when: job matches very well + good client + tailored proposal. Set a trial Connects budget, measure results.

Priority 4 (usually NOT needed yet when new): Paid recurring badge (e.g., Availability)
- Only when you already have an invite flow / are truly available and respond very quickly. Check current price/terms.
~~~

### 4. Example decision (assumed)
You have 40 Connects/week. Job A (verified client, clear scope, matches your case study very well) needs 12 Connects to send normally; extra boost may cost more Connects. Reasonable decision: send the tailored proposal first; if this is a rare opportunity and you want to try, boost **one small limited level** and record the result. Job B (vague, weak client): **do not send, do not boost** — boost doesn't turn a bad job into a good job.

~~~text
Boost trial record sample (for self-assessment):
Job: [link] | Normal Connects: [n] | Extra boost Connects: [n] | Reason for strong match: [...]
Result: [no response / interview / hired] | Takeaway: should I repeat boost for this type of job?
~~~

### 5. Common mistakes
- Buying badge/boost instead of fixing profile and proposal: "pouring gas into a car that won't start".
- Boosting every proposal: burns Connects (remember Connects have value, e.g. 0.15 USD/Connect at time of writing 2026-11-07; recheck) without improving win rate.
- Turning on "available" but replying to clients after 1–2 days: loses trust signal.
- Treating skill test as a "golden ticket": it can help a little, but real reviews and project results are strong evidence.

### Checklist
- [ ] Complete profile, portfolio/case study with numbers, verify account before spending extra money.
- [ ] Learn policies and mechanisms via official resources (Upwork Academy/guides) to avoid violations.
- [ ] Only consider Boosted proposal for job matching very well + good client + tailored proposal; set Connects limit.
- [ ] Turn on paid badge/recurring feature only when you're truly available and respond quickly; check current price/terms.
- [ ] Track results (proposal → response → interview → hired) to know which feature actually helps.
- [ ] Don't use boost/badge to make up for a generic proposal or a scope you can't do.
- [ ] Recheck feature names, prices, terms on the official Upwork page (change over time).

> Senior tip: for beginners, ROI (return on cost) almost always comes highest from **a good case study + a problem-targeted proposal** for a suitable small job. Treat every paid feature as a "lever" to use only after the foundation is good; if you must choose one thing today, rewrite the first 2–3 lines of your profile and a tailored proposal sample instead of buying more visibility.`,
    follow: [
      'You tried Boosted proposal 5 times but got no response. How do you analyze the root cause in what order?',
      'When does the Availability badge become worth considering (at what stage of the freelance journey)?',
      'How do you make your profile appear better in client search without relying on paid features?'
    ]
  },
  'remote-008': {
    q: 'You have no clients / no reviews on Upwork. How do you build a portfolio to convince clients: choose sample projects solving real problems, write a 1-page case study, and prepare a GitHub README how?',
    a: `**Summary:** When you have no reviews, the portfolio is **substitute evidence**: it shows the client you've solved problems like theirs. Don't make projects "just to have them" (copied CRUD tutorials). Choose 2–3 sample projects tied to **real problems** (optimize a slow API, handle payment idempotency in sandbox, handle reliable background jobs), write a 1-page case study per project with structure Problem → Constraints → Approach → Measured Results → Lesson, and a GitHub README clear enough for others to run/understand in 5 minutes.

### 1. Why a "real problem-solving" portfolio beats a "tech demo" portfolio
Clients hire you to reduce risk and produce results, not to admire a list of frameworks. A small project with: clear problem, justified technical decisions, before/after numbers, clean code — **convinces more than** a big app that's just a CRUD form. As a Java dev with 4 years, you have an advantage: choose real backend problems you've encountered or that easily come up in Upwork jobs.

Terms: **Case study** — a short article telling about a problem you solved, how, and the result; **Sandbox** — a third-party simulated environment (e.g. Stripe test mode) to integrate without using real money; **Idempotency** — calling the same operation multiple times (due to retry/network errors) but the result applies only once (very important for payments).

### 2. Choose 2–3 sample projects (suggestions close to Java backend jobs)
Choose a project you can explain deeply when asked. Examples (you implement yourself, using real measurements on your machine):
| Sample project | Real problem it solves | Skills clients often look for | Evidence to have |
|---|---|---|---|
| Optimize a slow API (Spring Boot + PostgreSQL) | Endpoint high p95 due to N+1 query/missing index | Spring Data JPA, SQL, profiling | Before/after log/EXPLAIN, before/after p95 (your measurements) |
| Payment sandbox integration (Stripe/PayPal test mode) | Handle callback/webhook, avoid duplicate transactions on retry | REST, idempotency key, webhook security, state design | Flow diagram, idempotent test case, state description |
| Reliable background job (simple scheduler/queue) | Handle background tasks, retry, don't lose work on error | Basic concurrency, retry/backoff, logging | Retry mechanism description, illustrative log, deterministic test |

Note: use **sandbox/test mode** for third-party integrations; **do not** use real secret keys, **do not** commit secrets to GitHub. State clearly in README: "Uses Stripe test mode / sandbox; no real payments."

### 3. Structure of a 1-page case study (ready-to-use sample)
~~~text
Title: Fixing a Slow Orders API (Spring Boot + PostgreSQL)
1) Problem
   - Context: Orders endpoint returned order + items for a dashboard.
   - Symptom: p95 latency ~1.8s at ~10k rows (measured locally with a seeded dataset).

2) Constraints
   - Keep API response shape unchanged; PostgreSQL; Spring Data JPA.

3) Approach
   - Reproduced and logged SQL -> found N+1 queries (1 query for orders + N for items).
   - Replaced lazy N+1 with a fetch join / @BatchSize; added index on order_items(order_id).
   - Verified with EXPLAIN and before/after latency measurements.

4) Results (measured)
   - p95: 1.8s -> 120ms (same dataset/machine). Query count: 101 -> 2. (Example numbers from my test.)

5) What I would do next in production
   - Add monitoring (p95, query count), regression test, and review pagination/caching.

6) Links: GitHub repo, short demo or screenshots.
~~~

Write honestly: if numbers are measured on your machine with a fake dataset, state clearly "measured locally with a seeded dataset" — honesty builds more trust than exaggeration.

### 4. GitHub README: clear enough to understand and run in 5 minutes
~~~text
# Orders API Latency Fix (Spring Boot + PostgreSQL)
## What this solves
Fixes N+1 query latency on GET /orders (demo): p95 1.8s -> 120ms on a seeded local dataset.

## Tech
Java 17, Spring Boot 3.x, Spring Data JPA, PostgreSQL, (Testcontainers/Docker optional)

## How to run
1. Start PostgreSQL (docker compose up -d)  OR use your local DB
2. Copy application-example.yml -> application.yml and set DB credentials (no secrets committed)
3. ./mvnw test   (or: mvn test)
4. ./mvnw spring-boot:run

## What to look at
- src/.../OrderRepository: fetch join / batch fetching
- src/main/resources/db/migration or schema.sql: index on order_items(order_id)
- docs/case-study.md: problem -> approach -> before/after metrics

## Safety / notes
No production secrets. Payment examples (if any) use sandbox/test mode only.
~~~

README principle: state the problem it solves, how to run, where to see key points, and safety notes (no secrets). A repo that doesn't run or has no guide = weak evidence.

### 5. Common mistakes
- Copying a tutorial and calling it a portfolio: client or interviewer asking deeply reveals it immediately.
- No numbers: "made it faster" is weaker than "p95 1.8s -> 120ms (measured locally, dataset X)".
- Committing secret/API key: dangerous and looks unprofessional. Use environment variables, example files.
- Case study only tells technology, not decisions: say **why** you chose fetch join/@BatchSize/index.
- Too many unfinished projects: 2 complete projects with README and numbers are better than 8 abandoned repos.

### Checklist
- [ ] Choose 2–3 sample projects tied to real backend problems (API performance, payment idempotency sandbox, background job...).
- [ ] Each project has measured results (before/after) and states measurement conditions (local/sandbox/dataset).
- [ ] Write a 1-page case study: Problem → Constraints → Approach → Results → Next step → Link.
- [ ] README: describe problem, tech, how to run in 5 minutes, where to see key code, safety notes.
- [ ] Don't commit real secrets/keys; use env vars and example config files; third-party integration uses sandbox.
- [ ] Add portfolio/case study links to your Upwork profile and to proposals for related jobs.
- [ ] Practice explaining each project out loud in 60–90 seconds (client may ask deeply on the call).

> Senior tip: optimize your portfolio for the question the client actually thinks: "Have you solved a problem like mine, and did you measure results?" A small repo with tests, clear README, and honest case study (including limitations) sends a stronger senior signal than many half-baked "full-stack" repos. Evidence quality matters more than project count.`,
    follow: [
      'How do you turn a company project (code cannot be disclosed) into an honest portfolio case study without violating security/NDA?',
      'When the client asks deeply about your portfolio project on the call, how do you present technical decisions and trade-offs?',
      'How do you measure and present "p95 latency" before/after optimization so the numbers are trustworthy?'
    ]
  },
  'remote-009': {
    q: 'You are a Java dev working full-time in Vietnam and want to start freelancing on Upwork. How do you build a 6-month strategy: contract/review targets, when to move from small jobs to long-term contracts, when to consider an agency profile, and how to balance with full-time (employment contract on side work/security)?',
    a: `**Summary:** The first 6-month strategy is not "find a lot right away", but **build evidence + a sustainable working process** without burning bridges with your full-time job. Set targets by phase (small clear-scope job → quality review → long-term contract), change phases based on signals (review, invite-back rate, effective rate), only consider an **agency profile** when you have stable delivery capability and understand management responsibility. At the same time, check your employment contract and security/conflict-of-interest obligations before taking any outside job.

### 1. Why you need a strategy (and why you must consider full-time constraints)
Part-time freelance often fails for two reasons: (a) taking random jobs so you don't accumulate reviews/expertise, (b) time conflicts or violating employment contract/security obligations with your current company. Lead-level thinking here is **managing reputation and legal risk** before optimizing income.

Terms: **Agency profile** — an account/organization type on Upwork allowing work as a team under an agency name (mechanism, fees, terms change; check official page); **NDA/Confidentiality** — agreement not to disclose confidential information; **Conflict of interest** — outside work causing adverse effects or competing with your current company.

### 2. Check full-time constraints BEFORE taking a job (mandatory)
**General principle (not legal advice):** read your employment contract, work rules, NDA, and the company's outside employment/moonlighting policy carefully. Many companies require written permission, ban working for competitors, or ban using company assets/time/confidential info for outside work. If unsure, ask HR/manager or a legal expert. **Do not** use code, documents, data, devices, or full-time work hours for freelancing.

~~~text
Self-check questions (answer honestly before bidding):
- Does the employment contract/NDA ban or require permission for outside work?
- Does this freelance job compete with or conflict with my company's product, customers, or field?
- Do I have time outside work hours without affecting full-time performance?
- Am I taking company confidential information/source code into outside projects? (If yes -> STOP)
- Can I commit to deadlines/communication without missing on-call/meetings for my full-time job?
~~~

### 3. 6-month roadmap (targets by phase, assumed numbers for reference)
Number of contracts/reviews are **directional targets**, not commitments — depend on skills, time, market. Adjust to reality.
| Phase | Main target | Job types to prioritize | Signals to change phase |
|---|---|---|---|
| Months 1–2: Foundation | Profile + portfolio done; send proposals regularly, learn from feedback | Small jobs, clear scope (fix bug, 1 endpoint, query optimization), 5–15 hours/job | Response/interview received; delivery process clear |
| Months 3–4: Evidence | 2–4 contracts completed, 2+ good reviews (assumed target) | Still small/medium jobs; start getting rehired by old clients if any | Good reviews, on-time delivery, invite-back/interview rate increases |
| Months 5–6: Stability & selection | 1 long-term part-time contract OR a chain of quality small jobs; effective rate improves | Gradually shift to retainer/long-term contract (maintenance, regular development) if suitable | You can predict weekly hours, reliable client, no impact on full-time |

~~~text
Example time allocation (assumed, part-time next to full-time):
- Week: 6–10 freelance hours (outside work hours), fixed block (e.g., Tue/Thu evenings + 3h weekend).
- Don't take jobs needing heavy overlap with Vietnam business hours if your full-time company needs you then.
- Each week: max 3–5 quality proposals (no mass sending), 1 deep delivery block.
~~~

### 4. When to move from small jobs to long-term contracts
Change when you have **enough signals**, not because of excitement:
- You've delivered 2–3 small jobs on time, with good reviews and (ideally) 1 client wants to rehire.
- You know your speed and still have stable weekly "bandwidth" (time capacity).
- The long-term contract has clear scope and communication schedule (weekly updates, milestone/retainer). Avoid long-term but vague + requiring online all day.
- With full-time: prioritize a **part-time retainer** (fixed hours/week package, e.g. 5–8 hours/week) over a full-time freelance contract.

### 5. When to consider an agency profile
**Usually NOT months 1–6** if you work alone. An agency profile suits when: you have a repeatable delivery process, reliable collaborators, sales/coordination ability, and accept responsibility for the whole team's quality/payment. Risks: operational complexity, profit sharing, one member damaging shared reputation. Upwork agency mechanism/terms/fees change — check the official page before creating. Practical advice: **become a stable individual freelancer first**, then think about agency.

### 6. Common mistakes
- Taking more work than you actually have time for: missed deadlines, bad reviews, burnout — affecting full-time too.
- Freelancing for competitors or using company assets/confidential info: serious disciplinary/legal risk.
- Jumping into long-term/full-time freelance too early without evidence and time control.
- Measuring success only by month-1 revenue: the first 6 months are a signal accumulation phase (reviews, process, case studies).

### Checklist
- [ ] Read employment contract/NDA/rules on outside work and conflict of interest; get written permission if needed. Don't use company assets/confidential info/hours.
- [ ] Choose a fixed weekly freelance block (e.g. 6–10 hours) and part-time-suitable job types, avoid overlap.
- [ ] Months 1–2: complete profile/portfolio, target small clear-scope jobs, measure proposal response rate.
- [ ] Months 3–4: prioritize 2–4 completed contracts with good reviews; record case studies with numbers.
- [ ] Months 5–6: only move to long-term/retainer when signals exist (reviews, re-invites, predictable hours).
- [ ] Don't rush agency profile: only consider when you have team delivery capability and understand official mechanisms/terms.
- [ ] Declare foreign income per Vietnam tax rules and keep documents; ask a tax/accounting expert when needed (don't guess tax rates yourself).

> Senior tip: from a lead perspective, the first 6-month goal is a **career option**, not "a side job to supplement salary". An Upwork profile with 3–5 real reviews, a few measured case studies, and disciplined communication/delivery habits — long-term value is much greater than trying to earn a few hundred extra dollars early but trading reputation or violating your full-time contract. Protect reputation and comply first, optimize income later.`,
    follow: [
      'You find a potential Upwork job in the same field as your full-time company. How do you assess conflict of interest and decide to accept or decline?',
      'When a long-term client suddenly asks for more hours in a week with a full-time deadline, how do you negotiate and prioritize?',
      'Which indicators show you\'re ready to move from individual freelancer to starting an agency (or hiring collaborators)?'
    ]
  },
  'remote-010': {
    q: 'You receive a 4-week Java backend project on Upwork (build a REST order management API for a small shop). Should you choose hourly (pay per hour) or fixed-price (lump sum per milestone)? How does payment protection work for each type, how do you split milestones, and what must you do before writing the first line of code?',
    a: `**Summary:** **Hourly** (pay-per-hour contract) suits when scope is unclear because you're paid for actual logged time; **fixed-price** (lump-sum contract) suits when scope is clear and output measurable — you split into **milestones** (a milestone: a part of work with a deliverable and handover time) and use **escrow** (client deposits money for each milestone before you do the part; you get paid when the milestone is approved). For a describable 4-week project, fixed-price split into small milestones usually balances risk; but before coding, you must lock scope, acceptance criteria, assumptions, and communication channel in writing.

### 1. Why choosing the wrong contract type is dangerous
Choosing a contract type means choosing **who bears the risk when estimation is wrong**. If scope is vague and you take fixed-price, you "burn" extra hours without pay. If scope is clear and you demand hourly for every small thing, the client may worry about uncontrolled costs. For new freelancers, a common mistake is taking fixed-price on a vague description ("build an API for my shop") then getting unlimited extra work.

Terms (explained first time):
- **Work diary / time tracker**: Upwork app logging work hours for hourly contracts, with activity (screenshots, activity level) to support payment protection under program terms.
- **Escrow**: with fixed-price, the client "deposits" money into each milestone before you do that part; money is held and transferred to you when the client approves the milestone.
- **Acceptance criteria**: specific conditions to consider a deliverable "done" (e.g., endpoint returns correct error codes, has tests, has documentation).
- **Scope**: what belongs to the project, what doesn't.

### 2. Hourly vs fixed-price comparison (mechanism, not just feeling)
| Criteria | Hourly | Fixed-price (per milestone) |
|---|---|---|
| Suitable when | Scope unclear, need discovery, maintenance, ongoing support, client changes mind often | Scope clear, output measurable, can split into handover milestones |
| How you get paid | Per logged hour via time tracker/work diary | Per milestone when approved (money already escrowed) |
| Payment protection (mechanism) | Hours logged via official tool and meet hourly protection program terms (read current terms on Upwork page) | Client deposits escrow for milestone; you only start when milestone is funded |
| Main risk to you | Client disputes hours if no clear notes; income fluctuates | Wrong estimation or scope creep → extra work for free |
| Main risk to client | Hard to control total cost if scope drifts | Worry about not getting expected results if acceptance criteria vague |
| Transparency | Hour log + work notes | Handover milestone + acceptance criteria + demo/evidence |

Important note: Payment Protection terms are specific and may change — always read Upwork's official page when you sign the contract. Don't assume "using hourly automatically protects every hour".

### 3. Example milestone split for a 4-week backend project (assumed)
Assumed: a small shop needs a REST order management API (create/view/update order status), simple token login, PostgreSQL, delivery in 4 weeks. Assumed total 2,000 USD fixed-price (calculate yourself by rate and estimate; this number is only to illustrate milestone splitting).

~~~text
Milestone 1 — Discovery & design (Week 1) — 300 USD
  Output: short document (spec) including endpoint list, order status flow, DB schema, assumptions/out of scope.
  Acceptance: client confirms spec in an Upwork message; no major feature code yet.
  Reason: agree on understanding first, reduce risk of building the wrong thing.

Milestone 2 — Core API + DB (Week 2) — 700 USD
  Output: order CRUD endpoints + DB migration + basic tests running; short demo.
  Acceptance: main flows work per spec; provide repo/branch link or handover files as agreed.

Milestone 3 — Authentication + error control (Week 3) — 600 USD
  Output: login/token, basic authorization, consistent error codes/validation, extra tests.
  Acceptance: main error cases return correct codes; demo login -> call API flow.

Milestone 4 — Polish, docs & handover (Week 4) — 400 USD
  Output: README how to run, config guide, fix bugs found within locked scope, handover.
  Acceptance: client can run per README (or you demo) and confirms milestone complete.
~~~

~~~seq
title: Fixed-price milestone flow (escrow)
actors: Client | Upwork (Escrow) | Freelancer
Client -> Upwork (Escrow): Deposit Milestone 1 (fund)
Upwork (Escrow) --> Freelancer: Notify that milestone is funded
Freelancer -> Freelancer: Work, send output + demo
Freelancer -> Client: Send approval request for Milestone 1
Client -> Upwork (Escrow): Approve
Upwork (Escrow) -> Freelancer: Release Milestone 1 payment
note Client..Freelancer: Repeat for each milestone; only start when milestone is funded
~~~

Milestone splitting principle: each milestone must have a **verifiable output** (not "50% done"), money tied to handover value, and **don't start an unfunded milestone**.

### 4. What to do BEFORE writing the first line of code
1. **Lock scope in writing on Upwork**: list features in and out of scope (e.g. "no mobile app, no real payment gateway integration").
2. **Acceptance criteria** for each milestone (specific output, how to verify).
3. **Assumptions**: what info the client provides, response time, deployment environment.
4. **Change rule**: adding out-of-scope work will be re-quoted/re-estimated (change request) — say so upfront.
5. **Channel and communication cadence**: progress updates how many times/week, overlapping hours, end-of-milestone demo.
6. **Technical basics**: repo, branch, how to run, where to store secrets (don't send secrets via chat), handover format.
7. **For fixed-price**: confirm Milestone 1 is funded in escrow. For hourly: agree on work diary note format.

~~~text
Sample scope-lock message before starting (English, send on Upwork):
Hi [Client], before I start, I would like to confirm the scope and milestones so we stay aligned:
- In scope: [endpoints/features], PostgreSQL schema, basic auth token, README and handover.
- Out of scope: [mobile app, real payment gateway integration, production DevOps], unless we add a change request.
- Assumptions: you will provide [sample data/requirements feedback] within [2 business days].
- Milestones & acceptance criteria: [paste milestone list]. I will start Milestone 1 once it is funded in escrow.
Please reply with "confirmed" or any changes you would like. Thanks, [Your Name]
~~~

### 5. Common mistakes
- **Starting to code before funding the milestone** (fixed-price): you bear the risk if the client changes their mind or doesn't approve.
- **Vague milestone** ("complete 50% of backend"): unverifiable, easy to dispute.
- **Not writing down out-of-scope**: everything the client thinks of is treated as "of course included".
- **Choosing hourly but not writing work diary notes**: in a dispute, you lack evidence of work.
- **Estimating fixed-price per ideal scenario**: always add buffer for clarifying requirements, bug fixes, waiting for responses.

### Checklist
- [ ] Determine if scope is clear or vague: vague → prioritize hourly or a discovery milestone first.
- [ ] If fixed-price: split into 3–5 milestones, each with output + acceptance criteria + amount.
- [ ] Only start a fixed-price milestone after escrow is funded.
- [ ] Lock in writing on Upwork: in/out of scope, assumptions, change request rule, communication cadence.
- [ ] Agree on handover method (repo, demo, README) and safe secret storage.
- [ ] If hourly: use the official time tracker and write clear work notes per hour block.
- [ ] Check current Payment Protection/escrow terms on Upwork (policies change over time).

> Senior tip: for a 4-week project, a short **discovery milestone** (spec + design + assumptions) for a small fee is the cheapest way to buy clarity. If after milestone 1 you see the real scope is double, you have evidence to re-quote before committing to everything. Don't use coding speed to make up for a vague spec — scope debt is always more expensive than technical debt.`,
    follow: [
      'The client wants fixed-price but refuses to fund escrow upfront, promising "will pay when done". How do you handle it?',
      'When do you switch a well-running hourly contract to fixed-price by phase (or vice versa)?',
      'How do you estimate a backend milestone (API + migration + test) to reduce wrong-quote risk?'
    ]
  }
});
