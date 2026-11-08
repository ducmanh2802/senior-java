App.i18n.content({
  'remote-006': {
    q: 'A client invites you to a video call interview for a Java backend job on Upwork. How do you prepare, open the call, handle situations where you cannot hear clearly, present your solution and estimate, and close with clear next steps?',
    a: `**Summary:** A video call interview with an Upwork client is a **two-way discovery**: the client evaluates whether you can solve their problem, and you evaluate whether the job is clear and worth doing. Prepare by reading the job carefully, preparing 2–3 result stories (with numbers), and questions to clarify scope. On the call: open briefly, proactively ask for clarification when you cannot hear clearly (this is normal), present your solution using the structure "problem → approach → risks → estimate with assumptions", and always close with concrete next steps before ending.

### 1. Why preparation decides the outcome
Many technically strong developers "drift" on calls because they ramble or do not ask about scope. The client does not need a lecture; they need to see that you: (a) understand the problem, (b) have a practical approach, (c) communicate clearly. Spending 30–45 minutes preparing often improves your chances significantly.

### 2. Before the call (30–45 minutes)
- **Re-read**: the job post, the proposal you sent, prior messages, and the client/company profile (what product they build, their scale).
- **Prepare 2 "mini case studies"**: 60–90 seconds each, using the structure Situation → Action → Result with numbers (e.g., "Spring Boot API p95 1.8s → analyzed queries → added fetch join + index → 120ms").
- **Prepare clarifying questions**: business goal, definition of "done", stack/versions, who makes decisions, deadline, communication style (async — no realtime required; or regular meetings).
- **Environment**: stable internet, clear headset/mic, tidy background, open relevant IDE/docs (only if you need to share screen), turn off notifications. Check the timezone and send a time confirmation.

### 3. Opening the call (30–60 seconds)
~~~text
Sample opening (English):
"Hi [Name], nice to meet you. I am [Your Name], a Java/Spring Boot backend engineer. I have read your post about
[briefly restate the problem, e.g., reducing latency on the /orders API]. Before I suggest an approach, could I ask
a few quick questions to make sure I understand the context and priorities?"

(short, restates the problem correctly, asks permission to ask — shows you are not guessing)
~~~

### 4. When you cannot hear clearly (very normal for Vietnamese speakers using English)
Not hearing clearly is **not a penalty** if you handle it proactively. Do not guess and answer incorrectly.

~~~text
Polite, professional phrases to ask for repetition / clarification:
- "Sorry, I did not catch that last part. Could you say it again, please?"
- "Just to make sure I understood: you mean [paraphrase what you heard]. Is that right?"
- "Could you please speak a little more slowly? I want to make sure I address your question correctly."
- "Would you mind typing that term/name in the chat? I want to get it exactly right."
- "Let me summarize what I heard: [summary]. Did I miss anything?"

(Paraphrase — restating in your own words — is a strong technique: it confirms understanding and shows the client you are listening.)
~~~

### 5. Presenting the solution and estimate (clear structure)
Avoid jumping straight into code details. Use a 4-part structure:
1. **Problem/Goal**: "As I understand it, the goal is … and success means …"
2. **Approach**: 2–4 steps, naming tools/techniques at the right level (fetch join, index, caching, idempotency key — depending on the job).
3. **Risks/Assumptions**: "This assumes …; a risk is … so I would …"
4. **Estimate with assumptions**: give a range, tied to assumptions; propose a small discovery milestone if things are still unclear.

~~~text
Sample answer (hypothetical, API optimization job):
"Goal: bring GET /orders p95 under 300ms.
Approach: (1) reproduce and capture the SQL/query plan, (2) fix likely N+1 with a fetch join or @BatchSize and add
a supporting index, (3) verify with before/after metrics and add a regression test.
Risks: if the bottleneck is elsewhere (e.g., network or a downstream call), step 1 will show it.
Estimate: roughly 4–8 hours assuming I can access logs and the schema; if the scope is larger, I suggest a small
paid investigation milestone first. Does that align with what you need?"
~~~

### 6. Closing with next steps (do not let the call end vaguely)
~~~text
Sample closing:
"Thank you for your time. As a next step, would you like me to send: (1) a short written summary of the approach
and assumptions, and (2) a proposed milestone/estimate on Upwork? If you share [logs/schema/access details],
I can start with the investigation milestone. What timeline are you aiming for?"
~~~

After the call: send a summary message on Upwork (thank you, summary of approach, assumptions, next steps, estimate). This creates a clear paper trail and shows professionalism.

### 7. Common mistakes
- Talking too much about yourself ("I have 4 years of Java, I know Spring, Docker…") instead of the client's problem.
- Guessing when you cannot hear clearly: leads to wrong answers; asking for repetition is always better.
- Committing to a hard deadline/price without enough information: give a range + assumptions.
- Not asking questions back: you also need to evaluate the client (is the scope clear, how responsive are they, are expectations realistic).
- Ending the call with no next steps: the opportunity cools down quickly.

### Checklist
- [ ] Re-read the job/proposal/messages; prepare 2 mini case studies with numbers (60–90 seconds each).
- [ ] Prepare 4–6 clarifying questions: goal, definition of done, stack, decision maker, deadline, communication.
- [ ] Technical check: internet, mic/headset, camera/background, timezone; turn off notifications.
- [ ] Short opening: restate the problem correctly + ask permission to ask. If you cannot hear clearly: ask to repeat/paraphrase, do not guess.
- [ ] Present: problem → approach (2–4 steps) → risks/assumptions → estimate as a range.
- [ ] Close with concrete next steps (send summary, milestone, timeline); after the call, send a summary on Upwork.
- [ ] Evaluate the client in return: scope, expectations, responsiveness — politely decline if there are bad signals.

> Senior tip: treat the last 5 minutes as the most important. A post-call summary (3–5 bullets: what you understood, what you will do, assumptions, estimate, next steps) sent on Upwork is often what makes the client choose you — because it shows you work in a structured way and reduce risk for them, which is exactly what they are buying when they hire a senior.`,
    follow: [
      'The client asks you to live-code or share your screen to debug on the call. How do you prepare and handle it?',
      'How do you estimate a backend task (e.g., adding an API + DB migration) to provide a reasonable range?',
      'When the client and you are 11 time zones apart, how do you propose an async (no realtime meetings) communication workflow?'
    ]
  },
  'remote-007': {
    q: 'You are a new freelancer on Upwork. How should you use (or avoid) these features: Boosted proposal, Availability badge, profile visibility, Upwork Academy/skill tests? Which ones are worth the money for a beginner?',
    a: `**Summary:** These features all aim to increase **visibility** or provide a **trust signal**, but they do not replace the core fundamentals: a clear profile, proposals tailored to the job, and real proof of work. For beginners, the most "worth it" investments are usually: completing your profile/portfolio, using Upwork Academy (learning how the platform works — often free) to avoid costly mistakes, and **saving Connects** for jobs that truly match. Avoid paying to boost when your proposal/profile is still weak. (Feature names, pricing, and conditions change; this describes the mechanisms — check the official pages when you use them.)

### 1. Why you need to understand the mechanism (not chase buttons)
Upwork sells ways to stand out in a crowd. The right question is not "should I click it?" but: **what does this button amplify?** If your proposal/profile is not convincing, amplification only helps you get ignored faster (and costs money/Connects).

Terminology: **Visibility** — how much your profile/proposal is shown to clients; **Signal** — evidence that helps clients trust you (reviews, history, verification, badges); **Boost/Bid** — spending extra Connects to push your proposal higher in the list.

### 2. Each feature: mechanism, when to consider, risks
| Feature | Mechanism (described) | Beginners should use when | Risks / Notes |
|---|---|---|---|
| Boosted proposal (bidding Connects) | You add extra Connects so your proposal has a chance to appear in a higher position; it is a relative auction with others | You are a **very strong match** for the job, the client is good quality, and your proposal is tailored; treat extra Connects as a controlled experiment cost | Burns Connects quickly; cannot save a generic proposal; a higher position does not guarantee you win. Value depends on bid level and competition (changes over time). |
| Availability badge (available now badge) | Shows you are ready to take work (often a paid, recurring feature; conditions change) | You are truly free, respond quickly, and already have a solid profile/proposal | Recurring cost; meaningless if you do not respond quickly or do not have matching jobs. Check current pricing/conditions before turning it on. |
| Profile visibility (profile display settings) | Adjusts how your profile appears in search/invitations (options may include on/off or different levels over time) | Always keep information accurate; if you are busy, adjust to reflect reality | Do not turn it off when you need jobs; do not keep a "public" profile with outdated information. Labels/mechanics may change in the UI. |
| Upwork Academy / guides & skill tests | Learning resources for using the platform; some tests/skills may add a signal to your profile (depending on the time) | **Use early**: learn policies, how to write proposals, how to avoid costly violations; take tests/badges only if you do well and they are relevant | Free/low-cost learning is usually worth it; skill tests do not replace real reviews. Check whether the feature still exists/has been renamed. |

### 3. Priority order for beginners (most worth it → lower priority)
~~~text
Priority 1 (almost always worth it): Fundamentals
- Focused, clear-value profile; 2–3 case studies/portfolio items with numbers; verified account; clear photo/expertise.
- Read policies (avoid non-circumvention, understand escrow/hourly protection mechanisms).

Priority 2 (worth it if free/low cost): Learn the mechanics
- Upwork Academy / official guides to avoid mistakes that waste Connects and violate policies.

Priority 3 (consider with control): Boosted proposal
- Only when: very strong job match + good client + tailored proposal. Set an experimental Connects budget and measure results.

Priority 4 (usually NOT needed early): Recurring paid badges (e.g., Availability)
- Only when you already have a flow of invitations/are truly free and respond very quickly. Check current pricing/conditions.
~~~

### 4. Example decision (hypothetical)
You have 40 Connects/week. Job A (verified client, clear scope, strong match to your case study) needs 12 Connects to submit normally; boosting may cost extra Connects. Reasonable decision: submit a tailored proposal first; if this is a rare opportunity and you want to experiment, boost by **a small, capped amount** and record the result. Job B (vague, weak client): **do not submit, do not boost** — boosting does not turn a bad job into a good one.

~~~text
Sample boost experiment log (to evaluate yourself):
Job: [link] | Regular Connects: [n] | Extra boost Connects: [n] | Why strong match: [...]
Result: [no response / interview / won] | Takeaway: repeat boost for this type of job or not?
~~~

### 5. Common mistakes
- Buying badges/boosts instead of fixing profile and proposals: "pouring gas into a car that will not start".
- Boosting every proposal: burns Connects (remember Connects have a cost, e.g., 0.15 USD/Connect at the time of writing 2026-11-07; check again) without improving win rate.
- Turning on "available" but replying to clients 1–2 days later: loses trust signals.
- Treating skill tests as a "golden ticket": they may help a little, but real reviews and project results are the stronger proof.

### Checklist
- [ ] Complete profile, portfolio/case studies with numbers, and verify your account before spending extra money.
- [ ] Learn policies and mechanics through official resources (Upwork Academy/guides) to avoid violations.
- [ ] Only consider Boosted proposal for very strong match + good client + tailored proposal; set a Connects limit.
- [ ] Turn on recurring paid badges/features only when you are truly free and respond quickly; check current pricing/conditions.
- [ ] Track results (proposal → response → interview → won) to see which features actually help.
- [ ] Do not use boosts/badges to compensate for generic proposals or scope you cannot deliver.
- [ ] Re-check feature names, pricing, and conditions on Upwork's official pages (they change over time).

> Senior tip: for beginners, the highest ROI (return on investment) almost always comes from **one good case study + one proposal written to the right problem** for a small, matching job. Treat every paid feature as "leverage" to use only after the fundamentals are solid; if you must choose one thing today, rewrite the first 2–3 lines of your profile and one tailored sample proposal instead of buying more visibility.`,
    follow: [
      'You tried Boosted proposal 5 times but got no response. In what order do you analyze the causes?',
      'When does the Availability badge become more worth considering (at what stage of the freelance journey)?',
      'How can you make your profile appear better in client search without relying on paid features?'
    ]
  },
  'remote-008': {
    q: 'You have no clients/no reviews on Upwork. How do you build a portfolio that convinces clients: choose sample projects that solve real problems, write a 1-page case study, and prepare a GitHub README?',
    a: `**Summary:** When you have no reviews, your portfolio is **substitute proof**: it shows clients you have solved problems similar to theirs. Do not build "just for show" projects (copied CRUD tutorials). Choose 2–3 sample projects tied to **real problems** (optimizing a slow API, handling payment idempotency in a sandbox, building a reliable background job), write a 1-page case study for each using the structure Problem → Constraints → Approach → Measured results → Lessons, and make the GitHub README clear enough that someone can run/understand it in 5 minutes.

### 1. Why a "real problem" portfolio beats a "technology demo" portfolio
Clients hire you to reduce risk and create results, not to admire a framework list. A small project with: a clear problem, technical decisions with reasons, before/after numbers, and clean code — is **more convincing** than a large app that is just a form CRUD. With 4 years of Java experience, you have an advantage: pick practical backend problems you have encountered or are very likely to encounter in Upwork jobs.

Terminology: **Case study** — a short write-up about a problem you solved, your approach, and the results; **Sandbox** — a test environment provided by a third party (e.g., Stripe test mode) for integration without using real money; **Idempotency** — calling the same operation multiple times (due to retries/network errors) but applying the result only once (critical for payments).

### 2. Choose 2–3 sample projects (suggestions aligned with Java backend jobs)
Pick projects you can explain deeply when questioned. Examples (implement them yourself, use numbers you actually measure on your machine):
| Sample project | Real problem it solves | Skills clients often look for | Evidence to include |
|---|---|---|---|
| Optimize a slow API (Spring Boot + PostgreSQL) | Endpoint p95 is high due to N+1 queries/missing index | Spring Data JPA, SQL, profiling | Before/after logs/EXPLAIN, before/after p95 (your measurements) |
| Payment integration in sandbox (Stripe/PayPal test mode) | Handle callbacks/webhooks, avoid duplicate transactions on retry | REST, idempotency key, webhook security, state design | Flow diagram, idempotent test cases, state description |
| Reliable background job (simple scheduler/queue) | Process background tasks, retry, do not lose work on failure | Basic concurrency, retry/backoff, logging | Retry mechanism description, illustrative logs, deterministic tests |

Note: use **sandbox/test mode** for third-party integrations; **do not** use real secret keys, **do not** commit secrets to GitHub. State clearly in the README: "Uses Stripe test mode / sandbox; no real payments."

### 3. 1-page case study structure (ready-to-use template)
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

Write honestly: if the numbers were measured on your machine with a seeded dataset, state clearly "measured locally with a seeded dataset" — honesty builds more trust than exaggeration.

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

README principles: state the problem it solves, how to run it, where to look for the important parts, and safety notes (no secrets). A repo that does not run or has no instructions is weak evidence.

### 5. Common mistakes
- Copying a tutorial and calling it a portfolio: a client or interviewer will expose it quickly when they ask in depth.
- No numbers: "made it faster" is weaker than "p95 1.8s → 120ms (measured locally, dataset X)".
- Committing secrets/API keys: dangerous and unprofessional. Use environment variables and example files.
- A case study that only lists technologies, not decisions: explain **why** you chose fetch join/@BatchSize/index.
- Too many unfinished projects: 2 complete projects with READMEs and numbers are better than 8 abandoned repos.

### Checklist
- [ ] Choose 2–3 sample projects tied to real backend problems (API performance, payment idempotency in sandbox, background jobs…).
- [ ] Each project has measured results (before/after) and clearly states measurement conditions (local/sandbox/dataset).
- [ ] Write a 1-page case study: Problem → Constraints → Approach → Results → Next steps → Links.
- [ ] README: problem description, tech, 5-minute run steps, where to find key code, safety notes.
- [ ] Do not commit real secrets/keys; use environment variables and example config files; use sandbox for third-party integrations.
- [ ] Add portfolio/case study links to your Upwork profile and to proposals for relevant jobs.
- [ ] Practice explaining each project verbally in 60–90 seconds (clients may ask in depth on a call).

> Senior tip: optimize your portfolio for the question clients actually think: "Have you solved a problem like mine, and did you measure the result?" A small repo with tests, a clear README, and an honest case study (including its limitations) creates a much stronger senior signal than many half-finished "full-stack" repos. Quality of evidence matters more than number of projects.`,
    follow: [
      'How do you turn a company project (where you cannot share code) into an honest portfolio case study without violating security/NDA?',
      'When a client asks in depth about a portfolio project on a call, how do you present your technical decisions and trade-offs?',
      'How do you measure and present "p95 latency" before/after optimization so the numbers are credible?'
    ]
  },
  'remote-009': {
    q: 'You are a Java developer working full-time in Vietnam and want to start freelancing on Upwork. How do you build a strategy for the first 6 months: goals for contracts/reviews, when to move from small jobs to long-term contracts, when to consider an agency profile, and how to balance with full-time work (employment contract rules about side work/confidentiality)?',
    a: `**Summary:** A strategy for the first 6 months is not "earn a lot right away", but to **build proof + a sustainable work process** without burning bridges with your full-time job. Set phased goals (small, clear-scope jobs → quality reviews → long-term contracts), move between phases based on signals (reviews, rehire rate, effective rate), and only consider an **agency profile** when you can deliver reliably and understand management responsibilities. In parallel, check your employment contract and confidentiality/conflict-of-interest obligations before accepting any outside job.

### 1. Why you need a strategy (and why you must account for full-time constraints)
Part-time freelancing often fails for two reasons: (a) taking random work so you do not accumulate reviews/expertise, (b) time conflicts or violating your employment/confidentiality obligations with your current company. Lead-level thinking here means **managing reputation and legal risk** before optimizing income.

Terminology: **Agency profile** — an account/organization type on Upwork that allows working as a team under an agency name (mechanisms, fees, conditions change; check the official pages); **NDA/Confidentiality** — an agreement not to disclose confidential information; **Conflict of interest** — outside work that negatively affects or competes with the company you work for.

### 2. Check full-time constraints BEFORE accepting any job (required)
**General principles (not legal advice):** read your employment contract, internal policies, NDA, and outside employment/moonlighting policy carefully. Many companies require written permission, prohibit working for competitors, or prohibit using company assets/time/confidential information for outside work. When in doubt, ask HR/your manager or a legal professional. **Do not** use your full-time company's code, documents, data, devices, or working hours for freelance work.

~~~text
Self-check questions (answer honestly before bidding a job):
- Does my employment contract/NDA prohibit or require permission for side work?
- Does this freelance job compete with or conflict with my company's products, customers, or domain?
- What time (outside work hours) can I realistically use without hurting full-time performance?
- Am I bringing any confidential information/codebase from my company into the outside project? (If yes -> STOP)
- Can I commit to deadlines/communication without missing full-time on-call/meetings?
~~~

### 3. 6-month roadmap (phased goals, hypothetical numbers for reference)
Contract/review counts are **directional goals**, not promises — they depend on skills, time, and the market. Adjust to reality.
| Phase | Main goal | Preferred job type | Signal to move to next phase |
|---|---|---|---|
| Months 1–2: Foundation | Complete profile + portfolio; send proposals consistently, learn from responses | Small, clear-scope jobs (bug fix, 1 endpoint, query optimization), 5–15 hours/job | Getting responses/interviews; clear delivery process |
| Months 3–4: Proof | 2–4 completed contracts, 2+ good reviews (hypothetical goal) | Still small/medium jobs; start getting rehired by past clients if possible | Good reviews, on-time delivery, interview/rehire rate increases |
| Months 5–6: Stability & selectivity | 1 long-term part-time contract OR a stream of quality small jobs; improved effective rate | Gradually move to retainer/long-term contracts (maintenance, recurring development) if suitable | You can predict weekly hours, clients trust you, no impact on full-time work |

~~~text
Example time allocation (hypothetical, part-time alongside full-time):
- Weekly: 6–10 freelance hours (outside work hours), in fixed blocks (e.g., Tue/Thu evenings + 3h weekend).
- Do not accept jobs requiring heavy overlap with Vietnam business hours if your full-time company needs you then.
- Each week: at most 3–5 quality proposals (do not blast), 1 deep work delivery block.
~~~

### 4. When to move from small jobs to long-term contracts
Move when you have **enough signals**, not because you are impatient:
- You have delivered 2–3 small jobs on time, have good reviews, and (ideally) 1 client wants to hire you again.
- You can estimate your own speed and have stable weekly **bandwidth**.
- The long-term contract has clear scope and communication cadence (weekly updates, milestones/retainer). Avoid long-term contracts that are vague but demand being online all day.
- With a full-time job: prefer a **part-time retainer** (fixed hours/week package, e.g., 5–8 hours/week) over a full-time freelance contract.

### 5. When to consider an agency profile
**Usually NOT in months 1–6** if you work alone. An agency profile fits when: you have a repeatable delivery process, trusted collaborators, the ability to sell/coordinate, and you accept responsibility for the whole team's quality/payments. Risks: operational complexity, profit sharing, one member damaging shared reputation. Agency mechanisms/conditions/fees on Upwork change — check the official pages before creating one. Practical advice: **become a stable individual freelancer first**, then think about an agency.

### 6. Common mistakes
- Taking on more work than you have time for: missed deadlines, bad reviews, burnout — affects your full-time job too.
- Freelancing for a competitor or using company assets/confidential information: serious disciplinary/legal risk.
- Jumping to long-term/full-time freelance contracts too early without proof and without time control.
- Measuring success only by month-1 revenue: the first 6 months are for accumulating signals (reviews, process, case studies).

### Checklist
- [ ] Read your employment contract/NDA/policies on side work and conflicts of interest; get written permission if required. Do not use company assets/confidential information/hours.
- [ ] Choose fixed freelance hours/week (e.g., 6–10 hours) and job types that fit part-time work, avoiding overlap.
- [ ] Months 1–2: complete profile/portfolio, target small clear-scope jobs, measure proposal response rate.
- [ ] Months 3–4: prioritize 2–4 completed contracts with good reviews; write case studies with numbers.
- [ ] Months 5–6: move to long-term/retainer contracts only when you have signals (reviews, rehiring, predictable time).
- [ ] Do not rush into an agency profile: consider it only when you can deliver as a team and understand official mechanisms/conditions.
- [ ] Declare income from abroad according to Vietnam tax regulations and keep records; ask a tax/accounting professional when needed (do not guess tax rates).

> Senior tip: from a lead perspective, the goal of the first 6 months is a **career option**, not a "side gig to top up salary". An Upwork profile with 3–5 real reviews, a few measured case studies, and disciplined communication/delivery habits — has far more long-term value than chasing a few hundred dollars early while trading away reputation or violating your full-time contract. Protect your reputation and compliance first, optimize income later.`,
    follow: [
      'You discover a potential Upwork job in the same domain as your full-time company. How do you assess the conflict of interest and decide whether to accept or decline?',
      'When a long-term client suddenly asks for more hours during a week you have a full-time deadline, how do you negotiate and prioritize?',
      'Which metrics indicate you are ready to move from an individual freelancer to starting an agency (or hiring collaborators)?'
    ]
  },
  'remote-010': {
    q: 'You receive a 4-week Java backend project on Upwork (build a REST API for order management for a small shop). Should you choose hourly or fixed-price (by milestone)? How does payment protection work for each type, how do you split milestones, and what must you do before writing the first line of code?',
    a: `**Summary:** **Hourly** (paid by the hour) fits when scope is unclear because you are paid for actual time tracked; **fixed-price** (package price) fits when scope is clear and deliverables are measurable — you split it into **milestones** (a checkpoint: a part of the work with a deliverable and a delivery point) and use **escrow** (the client funds money for each milestone before you do that part, and you receive it when the milestone is approved). For a 4-week project that can be described clearly, fixed-price split into small milestones often balances risk; but before coding, you must confirm scope, acceptance criteria, assumptions, and communication channels in writing.

### 1. Why choosing the wrong contract type is dangerous
Choosing the contract type means choosing **who bears the risk when estimates are wrong**. If scope is vague and you accept fixed-price, you "burn" extra hours for free. If scope is already clear and you insist on hourly for every small thing, the client may worry about cost control. A common mistake for new freelancers is accepting fixed-price for a vague description ("build an API for my shop") and then getting unlimited extra work.

Terminology (explained on first use):
- **Work diary / time tracker**: the Upwork app that records hours for hourly contracts, including activity (screenshots, activity level) to support payment protection under the program's conditions.
- **Escrow**: for fixed-price, the client "funds" money into each milestone before you work on that part; the money is held and released to you when the client approves the milestone.
- **Acceptance criteria**: specific conditions for considering a deliverable "done" (e.g., endpoint returns correct error codes, has tests, has documentation).
- **Scope**: what work is in the project and what is not.

### 2. Comparing hourly and fixed-price (mechanisms, not just feelings)
| Criterion | Hourly (paid by the hour) | Fixed-price (package by milestone) |
|---|---|---|
| When it fits | Unclear scope, discovery needed, maintenance, ongoing support, client changes mind often | Clear scope, measurable deliverables, can be split into delivery checkpoints |
| How you get paid | By hours tracked via time tracker/work diary | Per milestone when approved (money was funded into escrow) |
| Payment protection (mechanism) | Hours tracked through the official tool and meeting the conditions of the hourly protection program (read current conditions on Upwork's site) | Client funds escrow for the milestone; you should only start work once the milestone is funded |
| Main risk to you | Client disputes hours if notes are unclear; variable income | Wrong estimate or scope creep → unpaid extra work |
| Main risk to client | Hard to control total cost if scope drifts | Worry about receiving work that does not meet expectations if acceptance criteria are vague |
| Transparency | Hour log + work notes | Delivery checkpoints + acceptance criteria + demo/evidence |

Important note: payment protection (Payment Protection) has specific rules and can change — always read Upwork's official page at the time you sign the contract. Do not assume "using hourly automatically protects every hour".

### 3. Example milestone split for a 4-week backend project (hypothetical)
Assumption: a small shop needs a REST API for order management (create/view/update order status), simple token login, PostgreSQL, delivery in 4 weeks. Hypothetical total 2,000 USD fixed-price (you calculate based on your rate and estimate; this number only illustrates how to split checkpoints).

~~~text
Milestone 1 — Discovery & design (Week 1) — 300 USD
  Deliverable: a short spec including endpoint list, order status flow, DB schema sketch, assumptions/out of scope.
  Acceptance: client confirms the spec in an Upwork message; no major feature coding yet.
  Why: align understanding first, reduce risk of building the wrong thing.

Milestone 2 — Core API + DB (Week 2) — 700 USD
  Deliverable: CRUD endpoints for orders + DB migrations + basic tests that run; short demo.
  Acceptance: main flows run according to spec; provide repo/branch link or delivery files as agreed.

Milestone 3 — Authentication + error handling (Week 3) — 600 USD
  Deliverable: login/token, basic authorization, consistent error/validation codes, additional tests.
  Acceptance: main error cases return correct codes; demo login → call API flow.

Milestone 4 — Polish, docs & handover (Week 4) — 400 USD
  Deliverable: README with run steps, configuration guide, fixes for issues found within agreed scope, handover.
  Acceptance: client can run it following the README (or you demo) and confirms milestone completion.
~~~

~~~seq
title: Fixed-price flow by milestone (escrow)
actors: Client | Upwork (Escrow) | Freelancer
Client -> Upwork (Escrow): Fund Milestone 1
Upwork (Escrow) --> Freelancer: Notification milestone is funded
Freelancer -> Freelancer: Do work, deliver output + demo
Freelancer -> Client: Submit Milestone 1 for approval
Client -> Upwork (Escrow): Approve
Upwork (Escrow) -> Freelancer: Release Milestone 1 payment
note Client..Freelancer: Repeat for each milestone; only start when the milestone is funded
~~~

Milestone principles: each checkpoint must have a **verifiable deliverable** (not "50% done"), money tied to delivered value, and **do not start work on a fixed-price milestone that has not been funded in escrow**.

### 4. What you must do BEFORE writing the first line of code
1. **Confirm scope in writing on Upwork**: list features in scope and out of scope (e.g., "no mobile app, no real payment gateway integration").
2. **Acceptance criteria** for each milestone (specific deliverables, how to verify).
3. **Assumptions**: what the client will provide, how fast they respond, what the deployment environment looks like.
4. **Change rule**: work added outside scope will be re-estimated/quoted (change request) — state this clearly from the start.
5. **Communication channel and cadence**: how many progress updates per week, overlap hours, demo at the end of each milestone.
6. **Basic technical setup**: repo, branches, how to run, where secrets are stored (do not send secrets in chat), delivery format.
7. **For fixed-price**: confirm milestone 1 is funded in escrow. For hourly: agree on how you will write work diary notes.

~~~text
Sample message to confirm scope before starting (English, sent on Upwork):
Hi [Client], before I start, I would like to confirm the scope and milestones so we stay aligned:
- In scope: [endpoints/features], PostgreSQL schema, basic auth token, README and handover.
- Out of scope: [mobile app, real payment gateway integration, production DevOps], unless we add a change request.
- Assumptions: you will provide [sample data/requirements feedback] within [2 business days].
- Milestones & acceptance criteria: [paste milestone list]. I will start Milestone 1 once it is funded in escrow.
Please reply with "confirmed" or any changes you would like. Thanks, [Your Name]
~~~

### 5. Common mistakes
- **Starting to code before the milestone is funded** (fixed-price): you take the risk if the client changes their mind or does not approve.
- **Vague milestones** ("complete 50% of backend"): not verifiable, easy to dispute.
- **Not stating what is out of scope**: everything the client thinks of later is treated as "obviously included".
- **Choosing hourly but not writing work diary notes**: in a dispute, you lack evidence of work.
- **Estimating fixed-price for the ideal scenario**: always add buffer for clarifying requirements, fixing bugs, and waiting for feedback.

### Checklist
- [ ] Determine whether scope is clear or vague: vague → prefer hourly or a paid discovery milestone first.
- [ ] If fixed-price: split into 3–5 milestones, each with deliverable + acceptance criteria + amount.
- [ ] Only start a fixed-price milestone after escrow is funded.
- [ ] Confirm in writing on Upwork: in/out of scope, assumptions, change request rule, communication cadence.
- [ ] Agree on delivery method (repo, demo, README) and safe secret storage.
- [ ] If hourly: use the official time tracker and write clear work notes for each time block.
- [ ] Check current Payment Protection/escrow conditions on Upwork's site (policies change over time).

> Senior tip: for a 4-week project, a short **discovery milestone** (spec + design + assumptions) for a small fee is the cheapest way to buy clarity. If after milestone 1 you see the real scope is twice as large, you have evidence to re-quote before committing to the whole project. Do not use coding speed to compensate for a vague spec — scope debt is always more expensive than technical debt.`,
    follow: [
      'The client wants fixed-price but refuses to fund escrow first, promising "I will pay when it is done". How do you handle it?',
      'When do you switch a well-running hourly contract to fixed-price by phase (or the other way around)?',
      'How do you estimate a backend milestone (API + migration + tests) to reduce the risk of mispricing?'
    ]
  }
});