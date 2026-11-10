/*
 * English translation of js/data/q-remote.js — task T998. Format: js/core/i18n.js (content overlay).
 * ids: remote-047 remote-048 remote-049 remote-050 remote-051 remote-052 remote-053 remote-054 remote-055 remote-056 remote-057 remote-058
 */
App.i18n.content({
  'remote-047': {
    q: 'How do you run a weekly job search like a pipeline: target number of applications/proposals, source allocation, track conversion at each stage, and when to change tactics?',
    a: `**Summary:** Treat job search as a sales pipeline with weekly KPIs, measure conversion at each stage, and adjust tactics based on data, not feelings.

### Weekly target for applications/proposals

- Example baseline: 10–15 CV applications (full-time) or 5–8 proposals (freelance) per week.
- Split by source: 40% LinkedIn/recruiters, 30% remote job boards, 20% network/referrals, 10% curated platforms.
- Adjust based on actual conversion.

### Track conversion at each stage

| Stage | Metric | Reference target |
|---|---|---|
| Applied → Response | Response rate | ≥ 10–15% |
| Response → Interview | Interview rate | ≥ 30–50% |
| Interview → Offer | Offer rate | ≥ 20–30% |
| Proposal → Win (freelance) | Win rate | ≥ 10–20% |

### Sample tracking table

| Week | Source | Applied | Responses | Interviews | Offers | Conversion |
|---|---|---|---|---|---|---|
| W1 | LinkedIn | 6 | 1 | 0 | 0 | 16% |
| W1 | Remote board | 4 | 0 | 0 | 0 | 0% |
| W1 | Referral | 2 | 2 | 1 | 0 | 100% |

### When to change tactics

- Response rate < 5% after 20+ applications → review your CV/cover letter, keywords, target roles.
- Interview rate low → practice interview answers (#/interview), STAR (#/career).
- Offer rate low → practice system design, coding, negotiation.
- One source has high conversion → increase allocation to that source.
- Stuck > 4 weeks → change niche, level, or remote region.

### Checklist
- [ ] Set weekly KPIs and source allocation.
- [ ] Create a conversion tracking table.
- [ ] Review every Sunday: adjust allocation.
- [ ] If stuck for 4 weeks, change tactics and record why.
- [ ] Use #/jobs to track each application and follow-up.

> Senior tip: job search is an optimization problem: measure, adjust, iterate. Successful people are not those who apply the most, but those who learn fastest from their own data.`,
    follow: [
      'You have 10 hours/week for job search. How do you allocate time between applying, practicing, and networking?',
      'When conversion at one stage is low, how do you debug the pipeline (CV, interview, negotiation)?',
      'How do you avoid burnout when a job search drags on for months?'
    ]
  },
  'remote-048': {
    q: 'A technical skill matrix for remote Java backend by level (mid / senior / lead): what does "proficient" mean for each skill, and where to study in the app?',
    a: `**Summary:** Remote Java backend requires a foundation in Java 17/21 + Spring Boot 3 + SQL/JPA + REST + testing + Git + Docker + CI/CD + one cloud. Kafka/Redis/K8s/observability/security are common; system design/AWS cert/Kotlin/AI are differentiators. Each skill has a clear "proficient" criterion and a corresponding study topic in the app.

### 1. Must-have

| Skill | "Proficient" means | Study at |
|---|---|---|
| Java 17/21 | Use record, sealed, pattern matching, virtual threads (Java 21) in the right places; understand the memory model | #/bank/core, #/bank/jvm |
| Spring Boot 3 | Build a REST service yourself, configure profiles, actuator, test slices | #/bank/spring |
| SQL + JPA | Write queries, indexes, transactions, avoid N+1, Flyway migrations | #/bank/db |
| REST API | Design endpoints, status codes, versioning, error format | #/bank/api |
| Testing | Unit + integration (Testcontainers), reasonable coverage | #/bank/testing |
| Git | Branch, PR, rebase, resolve conflicts | #/bank/git |
| Docker | Multi-stage Dockerfile, compose | #/bank/docker |
| CI/CD | Build/test/deploy pipeline | #/bank/cicd |
| One cloud | Deploy app + DB + storage on AWS/GCP/Azure | #/bank/aws |

### 2. Common nice-to-haves

- Kafka: producer/consumer, consumer group, retry/DLQ. Study #/bank/kafka.
- Redis: cache, distributed lock, TTL. Study #/bank/redis.
- Kubernetes: deployment, service, configmap, probe. Study #/bank/k8s.
- Observability: metrics, tracing, structured logs. Study #/bank/observability.
- Basic security: JWT, OAuth2, OWASP Top 10. Study #/bank/security.

### 3. Differentiators (lead/architect)

- System design: capacity, trade-offs, caching strategy. Study #/bank/sd.
- AWS cert: Solutions Architect Associate.
- Kotlin: coroutines, null safety.
- AI/LLM: call APIs, basic RAG. Study #/bank/ai.

### Checklist
- [ ] Self-assess the must-have table: proficient/not yet for each row.
- [ ] List the 3 "not yet" skills with highest priority.
- [ ] For each "not yet" skill: set a 2-week goal + exercise.
- [ ] Use #/learn to track lessons by topic.
- [ ] Reassess after 4 weeks.

> Senior tip: remote employers do not need you to know everything; they need you to be "ready to ship the first feature in the first 2 weeks". Must-haves are the gate, nice-to-haves are leverage for rate negotiation.`,
    follow: [
      'You are at mid level. Which must-have skill are you weakest at, and what is your 4-week plan to close the gap?',
      'When do Kafka/Redis/K8s become "must-have" instead of nice-to-have (based on JD)?',
      'How do you prove you are "proficient" in a skill when you have no production experience?'
    ]
  },
  'remote-049': {
    q: 'What level of English is "good enough" for remote work? Break it down by situation, a 3-month practice plan using the app and outside it, and common mistakes Vietnamese speakers make.',
    a: `**Summary:** Remote English does not need to be "perfect"; it needs to be sufficient for each situation: reading docs (B2), writing Slack/PR/email (B1+), standup (B1), demo (B2), interview (B2), negotiation (B2+). 3-month plan: 30-45 minutes daily combining #/bank/english, #/speak, and #/interview in English.

### Required level by situation

| Situation | Sufficient level | Notes |
|---|---|---|
| Reading docs/APIs | B2 | Look up words; no need to translate every sentence |
| Writing Slack/PR/email | B1+ | Short, clear, correct terminology |
| Standup | B1 | 3 sentences: done/doing/blocker |
| Demo | B2 | Explain flow + trade-offs |
| Interview | B2 | Behavioral + technical questions |
| Rate negotiation | B2+ | Polite but clear |

### 3-month plan (in the app)

- Weeks 1-4: #/bank/english 10 questions/day; #/speak read aloud 5 minutes.
- Weeks 5-8: #/interview in English mode (15 minutes/week); record and listen back.
- Weeks 9-12: write 1 email/PR/week in English; have AI grade it in the app.

### Outside the app

- Watch technical videos in English (Devoxx, Spring I/O) with English subtitles.
- Read 1 blog post/day (baeldung, vladmihalcea).
- Join English-speaking Discord/Slack communities.

### Common mistakes Vietnamese speakers make

- Word-by-word translation → long, hard-to-understand sentences. Write short instead.
- Afraid to ask for clarification when you do not understand. Use "Could you rephrase?".
- Mispronouncing technology names (Kafka, Redis). Practice pronunciation of tech terms.
- Emails too formal. Remote teams prefer short emails with bullets.

### Checklist
- [ ] Self-assess your current level across the 6 situations in the table.
- [ ] Pick the 2 weakest situations as 3-month goals.
- [ ] Schedule 30 minutes/day in the app.
- [ ] Record 1 standup/week and listen back.
- [ ] Write 1 email/PR in English/week.

> Senior tip: remote interviewers do not grade your accent; they grade "can you convey your meaning and ask the right questions". Practice clarity, not accent.`,
    follow: [
      'How do you self-assess whether you are at B1 or B2? What is your evidence?',
      'How do you practice writing concise but complete emails/PRs?',
      'When you do not understand someone in a meeting, how do you handle it?'
    ]
  },
  'remote-050': {
    q: 'Remote work skills (not code): async communication, time management, estimation and early risk escalation, proactively asking when blocked, documentation. How do interviewers test these?',
    a: `**Summary:** Remote = working across time zones/offices, so async written communication, time management, estimation, escalation, and documentation matter as much as code. Interviewers test via behavioral questions and small tasks (write an update, estimate a story).

### 1. Asynchronous written communication

- Write updates in the format: Done / Doing / Blocker / Next.
- Each message has enough context for others to reply without asking follow-ups.
- Use threads; avoid spamming channels.

### 2. Time management

- Block calendar for deep work.
- Write a daily standup in advance; do not improvise.
- Avoid multitasking; use Pomodoro.

### 3. Estimation and early risk reporting

- Estimate in story points or hours; always include confidence.
- If you will be late, report early (not on the deadline day).
- State impact and mitigation.

### 4. Proactively ask when blocked

- Before asking: what you tried, what you read, your hypothesis.
- Ask in a public channel so the team learns.
- Do not stay silent and wait.

### 5. Documentation

- README, ADR, runbook.
- Decision log: why you chose X.
- Onboarding doc for new people.

### How interviewers test this

- Behavioral questions: "Tell me about a time you were blocked and how you handled it".
- Task: write a 5-line update for a scenario.
- Pair programming: observe how you ask questions and take notes.
- Study with #/career (STAR).

### Good/bad examples

- Good: "Done: API auth. Doing: tests. Blocker: missing prod secret, pinged DevOps, ETA +1 day."
- Bad: "working on it, not done yet" (no context, no ETA).

### Checklist
- [ ] Write a personal update template (Done/Doing/Blocker/Next).
- [ ] Create an ADR for a recent decision.
- [ ] Practice 3 STAR behavioral answers in #/career.
- [ ] Set a routine for reporting risks early.
- [ ] Write a README for a personal project.

> Senior tip: remote employers hire you because you "reduce management load", not because you code fast. People who can self-manage are the ones who earn trust.`,
    follow: [
      'Tell me about a time you were blocked and how you handled it (STAR).',
      'How do you write an async update so others do not need to ask follow-ups?',
      'When should you escalate instead of handling it yourself?'
    ]
  },
  'remote-051': {
    q: '"Business" skills for freelancers: sales, pricing, negotiation, contracts and money, client care. Which to learn first? Common first mistakes?',
    a: `**Summary:** A Java freelancer needs sales (finding clients, proposals), pricing, negotiation, contract/money management, and client care. Learn in this order: niche positioning → find clients → proposals → negotiation → contracts → delivery → follow-up. First mistakes: selling hours instead of value, no contract, underpricing.

### 1. Sales (finding clients + proposals)

- Sources: Upwork, Toptal, LinkedIn, referrals, cold outreach.
- Proposal: pain point + solution + proof + timeline + price anchor.
- Do not copy templates; personalize the first 2 lines.

### 2. Pricing

- Hourly vs fixed-price vs retainer.
- Price by value when possible.
- Rate floor: cost of living + tax + non-billable hours.

### 3. Negotiation

- Do not cut price first; reduce scope.
- Anchoring: present the higher option first.
- Silence after stating the price.

### 4. Contracts and money

- Scope, deliverables, acceptance criteria, payment terms (milestones).
- Invoice on time; track overdue payments.
- IP and confidentiality.

### 5. Client care

- Weekly updates, incremental demos.
- Ask for feedback; request testimonials.
- Upsell maintenance/support.

### Learning order (priority)

1. Niche positioning + portfolio (to have proof).
2. Proposal writing.
3. Negotiation & contracts.
4. Client care & upsell.

### Common mistakes devs make when selling for the first time

- Underpricing out of fear of losing clients.
- No contract → scope creep.
- Selling hours instead of outcomes.
- Not tracking cash flow.
- Accepting clients who are a poor fit.

### Checklist
- [ ] Write a 1-page proposal template for your niche.
- [ ] Set a rate floor (a number) and never go below it.
- [ ] Prepare a contract template (scope, milestones, IP).
- [ ] Practice 3 responses to "too expensive".
- [ ] Track cash flow weekly.

> Senior tip: sales is a skill; great devs often sell poorly because they are hesitant. Practice by selling to 5 small clients before targeting big ones.`,
    follow: [
      'When a client says "too expensive", how do you respond?',
      'Fixed-price vs hourly: when do you choose which?',
      'How do you avoid scope creep in a contract?'
    ]
  },
  'remote-052': {
    q: 'Self-assess and plan to close gaps: collect 15-20 remote Java JDs, count skills, compare with yourself, build an 8-12 week plan; use 🤖 Analyze JD in #/jobs.',
    a: `**Summary:** Collect 15-20 remote Java JDs, count skill frequency, compare with yourself, create an 8-12 week plan. Use the 🤖 Analyze JD button in #/jobs to automate: paste JD → get must-haves/nice-to-haves + likely questions + prep tips.

### 5-step process

1. Collect: save 15-20 JDs (text) to a file.
2. Count: tally skill frequency (Java 17, Spring Boot, Kafka, AWS, K8s...).
3. Compare with yourself: a "have / do not have / need to improve" table.
4. Prioritize: top 5 most frequent skills you do not have.
5. Plan: 1-2 weeks per skill, with exercises + a mini project.

### Sample self-assessment table

| Skill | JD frequency | Me | Gap | Priority |
|---|---|---|---|---|
| Java 17/21 | 18/20 | Have | - | - |
| Spring Boot | 20/20 | Have | - | - |
| Kafka | 12/20 | No | High | 1 |
| AWS | 14/20 | Basic | Medium | 2 |
| K8s | 10/20 | No | Medium | 3 |

### Using 🤖 Analyze JD (#/jobs)

- Paste JD into #/jobs → AI returns role, level, domain, must_have (weight 1-3), nice_to_have, likely_questions, prep_tips.
- Repeat for 5-10 JDs, aggregate high-weight must_haves.
- Compare with your self-assessment table.

### 8-12 week plan (example)

- Weeks 1-2: Kafka basics + mini producer/consumer project.
- Weeks 3-4: AWS deploy (EC2/RDS/S3).
- Weeks 5-6: K8s app deploy.
- Weeks 7-8: Observability (metrics/tracing).
- Weeks 9-12: Consolidated mini project + CV update.

### Checklist
- [ ] Collect ≥ 15 remote Java JDs.
- [ ] Tally skills, create the table.
- [ ] Run 🤖 Analyze JD for ≥ 5 JDs.
- [ ] Pick top 3 gaps and set 4-week goals.
- [ ] Review every 2 weeks, adjust.

> Senior tip: JDs are the "exam"; do not guess the market. 15 JDs are enough to see patterns; 50 JDs mostly add noise.`,
    follow: [
      'Which sources will you collect JDs from (to avoid bias)?',
      'When a JD asks for 10 skills, which one do you learn first?',
      'How do you measure progress after 4 weeks?'
    ]
  },
  'remote-053': {
    q: '(lead) A portfolio that proves skills when you have no reviews: 2-3 personal projects targeting real client needs, case studies, README, demo video; when do you need an AWS certification?',
    a: `**Summary:** Without reviews, your portfolio must "speak for you". 2-3 personal projects targeting real client needs (API with rate limiting + observability + CI/CD + cloud deploy), write case studies, a clear README, demo video. An AWS cert is useful when targeting enterprise/cloud-heavy roles; not required for small freelance gigs.

### 1. Choose projects targeting real needs

- Production-like API: auth, rate limiting, pagination, error format.
- Observability: metrics, tracing, structured logs.
- CI/CD: test + deploy pipeline.
- Cloud deploy: AWS/GCP/Azure.
- README + architecture diagram.

### 2. Case study

- Problem → Solution → Architecture → Trade-offs → Results (numbers).
- State decisions and reasoning.
- Lessons learned.

### 3. Demo video (3-5 minutes)

- Show the flow, not the code.
- Explain the "why" behind each decision.
- Upload as unlisted YouTube + link in README.

### 4. When do you need an AWS cert

- Targeting enterprise/agency cloud-heavy roles: a cert helps pass HR filters.
- Small freelance: portfolio + real deploy is enough.
- A cert does not replace experience; but it is a signal.

### 5. Quantity and quality

- 2-3 strong projects beat 10 shallow ones.
- Each project has README + tests + live deploy.
- Clean code, clear commit history.

### Checklist
- [ ] Choose 2 projects targeting your target clients' needs.
- [ ] Each project: README + tests + deploy + demo video.
- [ ] Write a case study for 1 project (problem→result).
- [ ] Decide whether you need an AWS cert based on target role.
- [ ] Put portfolio links in your CV and LinkedIn.

> Senior tip: a good portfolio = "a client can tell you can solve their problem just by looking". It is not a showcase of fancy tech, but evidence that you can ship.`,
    follow: [
      'What criteria do clients use to evaluate a portfolio?',
      'When should you invest in an AWS cert instead of a real project?',
      'How do you turn a personal project into a case study with numbers?'
    ]
  },
  'remote-054': {
    q: 'The freelance market for Java devs today: fewer jobs, or just a shift? How are small, simple jobs (CRUD, scripts) being replaced by AI, what about complex jobs, and what does that mean for newcomers?',
    a: `**Summary:** The market is not uniformly "fewer jobs" — it is **shifting**. According to the research "Who Is AI Replacing? The Impact of Generative AI on Online Freelancing Platforms" (Management Science, 2025; ~2 million job posts, 61 countries, 7/2021–7/2023), job posts for work that is easy to automate (writing, coding) **dropped by about 21%** in the 8 months after ChatGPT launched. Competition increased, but the remaining jobs are **more complex and pay more**. For newcomers, the key is not "competing with AI to do cheap CRUD", but learning to solve problems complex enough that clients still need a human.

### 1. A shift, not a complete disappearance
First, understand a concept: **automation** means using tools (today, AI code generation) to replace part of the work. When the cost of doing a simple task drops sharply thanks to AI, demand to "pay someone to do that simple task" also drops. However, demand for solving complex problems with many business constraints remains — and often increases in value.

The research above shows a clear trend: job categories easy to automate dropped significantly in volume. At the same time, the remaining jobs became more complex and tended to pay more. That is why we say "shift" rather than "simply drying up".

### 2. Which jobs are hit hardest, which still have value
| Job type | Impact level | Explanation |
|---|---|---|
| Simple CRUD (add/edit/delete tables, very basic APIs) | High | AI can generate it quickly; clients can also do it themselves with tools. Very easy to compete on price. |
| Scripts, simple reports, data formatting | High | Clear scope, clear input/output, few system constraints. |
| System integration (REST + DB + queue, sync/async handling) | Lower | Requires context, error handling, retries, idempotent behavior (idempotent = the same request executed multiple times does not cause incorrect changes). |
| Performance, query optimization, cloud cost reduction | Low | Requires measurement (latency = delay, p95 = 95% of requests faster than this number), bottleneck analysis. |
| Security, authorization, payment processing | Low | Mistakes have financial/legal consequences; requires production experience. |
| Architecture, refactoring legacy systems, AI integration | Low, rising value | Requires trade-off evaluation, affects multiple services, reduces client risk. |

### 3. What this means for newcomers
If you are just starting out, the biggest mistake is trying to "compete by hours" with others on cheap CRUD jobs. Instead, build proof for more complex problems, even on personal projects:

- **Instead of a "to-do app"**: build an "order service" that simulates reality (validation, transactions, idempotency key, error handling).
- **Learn to measure**: use logs, measure p95 before/after query optimization, record numbers in the README.
- **Learn integration**: understand how services communicate (REST, events), not just writing isolated endpoints.
- **Learn production mindset**: think about logging, config, deploy, rollback instead of only "it runs locally".

### 4. Checklist
- [ ] Distinguish "work easy to automate" vs "complex business problems".
- [ ] Take a simple CRUD project and extend it into a problem with trade-offs (e.g., add transactions + concurrency handling).
- [ ] Learn latency, p95, bottleneck concepts and record numbers when optimizing.
- [ ] Find 3 Java jobs on Upwork/LinkedIn and classify them using the table above to see real trends.
- [ ] Set a goal: in the next 2 months, have 1 case study with measured numbers instead of just "a project on GitHub".

> Senior tip: AI is a tool, not your only competitor. Clients hire you not to "write code for them", but to **reduce risk** and **solve problems** they do not have the time or experience to handle. If you help clients save money/reduce production errors, you will be far less affected than someone who only "types code to spec".`,
    follow: [
      'Why are the remaining jobs more complex and higher-paying according to the research?',
      'How can a new Java dev start from "simple jobs" and still progress toward "complex jobs"?',
      'When will a client choose to hire a person instead of using AI to solve a problem?'
    ]
  },
  'remote-055': {
    q: 'How to find good, less competitive jobs on Upwork: how to get client invites, filter clients with good spend history and hire rate, jobs with screening questions, send proposals early, pick jobs needing rare skills, and leverage the GMT+7 time zone advantage?',
    a: `**Summary:** Instead of sending hundreds of proposals to crowded jobs, optimize to **get invited** and only apply to carefully filtered jobs. The goal is "fewer competitors, higher odds". The biggest advantage of GMT+7 devs is being able to respond early during hours when clients in Australia/Singapore/Japan/Europe morning need quick discussions.

### 1. Why "invite" matters more than mass applying
On Upwork, an **invite** means the client actively found your profile and invited you to propose. Advantages:
- Often costs few or no Connects.
- Far fewer competitors than public jobs with dozens of proposals.
- Higher response rate because the client was already interested.

To increase invite chances, your profile must be **narrow and evidence-backed** (see remote-001). The title should state "what problem you solve", not "fullstack developer".

### 2. Filter clients: spend history and hire rate
When viewing a job, do not only read the technical description. Check "About the client":

| Metric | Meaning | Action |
|---|---|---|
| Payment verified | Payment method verified | Prefer if other metrics are good. |
| Total spent | Total money spent on Upwork | Higher usually means they are used to the platform and have a real budget. |
| Hire rate | Hires / jobs posted | High (e.g., > 50–70%) means they actually hire, not just price-shopping. |
| Avg hourly rate paid / feedback | Rates they paid and reviews | Helps gauge whether they fit your rate range. |
| Country/timezone | Time zone | Prefer if there is partial overlap with GMT+7. |

### 3. Spotting jobs that are "less competitive"
No absolute formula, but there are signs:

- **Long, specific description**: the client has thought it through; fewer people can send generic copy-paste proposals.
- **Has screening questions**: questions like "What similar work have you done?" force applicants to read carefully. Many skip careful answers and get filtered out naturally.
- **Requires a rare skill combination**: e.g., "Spring Boot + Kafka + AWS + PostgreSQL" rather than just "Java Developer".
- **Clear scope**: a specific bug fix, an endpoint with a clear description, refactoring a well-defined module.
- **Newly posted (within 1–3 hours)**: applying early is a big advantage. After a few hours, jobs often accumulate many proposals.

### 4. Flow diagram: from finding jobs to getting invited
Use a ~~~seq block to visualize the multi-party process:

~~~seq
title: Finding less competitive jobs (Upwork)
actors: Freelancer \| Upwork \| Client
Freelancer -> Upwork: Update narrow profile + proof (case study with numbers)
Client -> Upwork: Post job (with screening questions, rare skill requirements)
Upwork -> Freelancer: Suggest jobs (search results)
Freelancer -> Upwork: Filter client (spent/hire rate/payment verified) + send proposal early
Client -> Upwork: View profile/proposal (prefer those who understand the problem)
Client -> Freelancer: Send invite (if impressed)
Freelancer -> Client: Respond quickly (GMT+7 advantage)
~~~

### 5. Leveraging the GMT+7 time zone advantage
Clients in Australia (AEST/AEDT), Singapore (SGT), Japan (JST), and some European morning clients value fast responses while they are working. If you are online and reply within 1–2 hours after they message, you have a clear edge over applicants in other time zones who are offline.

Practical tips:
- Prioritize recently posted jobs where the client is online.
- In your proposal, you can briefly say: "I can respond quickly during your working hours (GMT+7 overlap)" but **do not** promise 24/7.
- Be proactive in early discussions; ask clarifying scope questions instead of waiting for the client to explain everything.

### 6. Checklist
- [ ] Rewrite your profile title in the form "Solve problem X using Y".
- [ ] Create a personal filter: jobs < 24h, payment verified, has screening questions, or requires rare skills.
- [ ] Spend 20–30 minutes/day filtering; do not send 20 unselective proposals.
- [ ] Prepare a template for answering screening questions (customized per job).
- [ ] Track invites received rather than only proposals sent.
- [ ] Use GMT+7 morning hours to respond quickly.

> Senior tip: "Volume" wins in price auctions. "Quality filtering + response speed + relevant proof" wins the "get invited" game. Track the 2 most important metrics: **invite/proposal rate** and **response/invite rate**. If both are low, fix your profile/proposal — do not blindly increase volume.`,
    follow: [
      'How do you increase the rate of being invited by clients instead of only sending proposals?',
      'When do screening questions actually signal a "less competitive" job?',
      'How can you leverage the GMT+7 time zone advantage without creating pressure to be "online 24/7"?'
    ]
  },
  'remote-056': {
    q: 'Java niches with fewer competitors that remote clients need: legacy upgrades (Java 8 → 17/21, Spring Boot 2 → 3, javax → jakarta), performance and cloud cost optimization, payment integration, production incident fixes, rescuing stalled projects/AI prototypes that need to go to production, integrating LLMs into Java (Spring AI, LangChain4j, RAG). Who are the clients, what keywords to search, and what proof is needed?',
    a: `**Summary:** Instead of "Java backend generalist", pick **1 narrow niche** that few devs focus on but clients actually need. Each niche has a specific pain point, clients are willing to pay more to reduce risk, and you can prove it with a small case study rather than 5 years of experience across everything.

### 1. Low-competition niches and real demand
| Niche | Typical clients | Pain point | Common search keywords | What proof is needed |
|---|---|---|---|---|
| **Legacy upgrade** (Java 8→17/21, Spring Boot 2→3, javax→jakarta) | SMEs/agencies with systems running 5–10 years | Legacy systems are hard to maintain, cannot use new libraries, security risk. | "java upgrade", "spring boot 3 migration", "jakarta migration" | Migration checklist, bugs fixed (logs), test coverage after upgrade, or a write-up/case study in a repo. |
| **Performance & cloud cost optimization** | Startups/e-commerce with growing traffic or high AWS bills | Slow APIs, N+1 queries, unusually rising DB/EC2/ElastiCache costs. | "performance tuning", "sql optimization", "aws cost optimization java" | Before/after: p95 latency, query count, estimated cost (e.g., 40% query time reduction). Record numbers. |
| **Payment integration** | E-commerce, marketplaces, SaaS | Need Stripe/PayPal/VNPay/Momo integration, webhook handling, idempotency, refunds. | "stripe integration java", "payment webhook", "idempotent api" | Webhook flow demo, idempotency tests, duplicate event handling. |
| **Production incident fixes** | All kinds, often urgent | Outage (system down), memory leak, deadlock, timeout. Need someone to fix immediately. | "java production bug", "fix memory leak", "api timeout fix" | Debug experience: thread dump/jstack, heap dump, log analysis. Write a "symptoms → root cause → fix → result" case study. |
| **Rescuing stalled projects / AI prototypes to production** | Founders/startups who rushed with AI-generated code | AI-generated code runs locally but has auth, transaction, validation bugs, missing tests, hard to deploy. | "ai generated code review", "mvp to production java", "refactor spring boot" | Point out real bugs in AI code, fix to pass tests/security checks, add config/deploy. |
| **LLM integration into Java (Spring AI, LangChain4j, RAG)** | Startups wanting to add chatbot/RAG to existing Java products | Want to use LLMs but do not know how to integrate safely (rate limits, cost, PII). | "spring ai integration", "langchain4j", "rag java" | Small demo: RAG with a vector DB (e.g., pgvector), simple prompt guard, usage/cost logging. | 

### 2. How to start with one niche
Do not learn all 6 at once. Pick **1** in this order:

1. **Check current ability**: which niche have you partially done (debugging, query optimization)?
2. **Find proof**: build a mini project for that niche, write a full case study.
3. **Adjust profile**: change title and overview to "Java [niche] Engineer | [problem you solve]".
4. **Find jobs**: use the keywords above and filter using the criteria in remote-055.

### 3. Short case study example (template)
~~~text
Niche: Performance optimization
Problem: /orders API slow (p95 ~1.8s) due to N+1 query
Solution: fetch join + @BatchSize + index(order_items.order_id)
Result: p95 ~120ms (-93%), query count reduced from ~150 to 2/page
~~~
This is something clients notice immediately, far stronger than "good at Spring Boot".

### 4. Checklist
- [ ] Pick **ONLY 1** niche to start with in the next 30 days.
- [ ] Create a case study with numbers for that niche (before/after).
- [ ] Update your Upwork profile to match the niche (title + overview + portfolio).
- [ ] Find 5 real jobs with niche keywords and analyze whether your profile fits.
- [ ] Learn enough to answer 3 interview questions about that niche concretely.

> Senior tip: "Generalists" struggle to win auctions. "Specialists" are harder to replace with cheap AI. If a client searches for "java spring boot 3 migration" and you have a real migration case study, you have eliminated 90% of competitors through specificity alone. Choose a niche based on **real client pain**, not on "the hottest technology".`,
    follow: [
      'Why is "rescuing stalled projects written with AI" an opportunity for traditional Java devs?',
      'How do you prove "production incident fix" experience when you have never been on-call?',
      'When starting a new niche, do you prioritize theory or building a case study first? Why?'
    ]
  },
  'remote-057': {
    q: 'Using AI to freelance faster and better (not to mass-send proposals): research jobs, draft a proposal outline then rewrite it yourself, generate tests, review code, write documentation; ethical and security boundaries (do not upload client source/data to AI tools without permission); can clients tell a proposal was written by AI?',
    a: `**Summary:** The purpose of using AI is to **improve quality and save time** on real work, NOT to automate spam. AI helps you read faster, think clearly, and catch mistakes. The most important boundary: **client data security**. Many clients can spot an AI proposal if it is too generic, lacks specifics, and does not reference concrete details from the job.

### 1. Using AI the right way for freelancing
| Task | Effective use | Caution |
|---|---|---|
| **Job research** | Ask AI to summarize the job: problem, requirements, potential risks, questions to clarify. | Always read the original job; do not rely only on the summary. |
| **Drafting a proposal** | Use AI to create an **outline**: understand problem → solution → proof → question. Then **rewrite in your own voice**. | Leaving AI-generated text as-is is often generic and easy to detect. |
| **Generate unit tests** | Generate tests for complex logic, then review and adjust to match business rules. | Always run tests; understand why they pass/fail. |
| **Code review** | Ask AI to find potential bugs, code smells, edge cases. Then verify yourself. | AI can miss production context. |
| **Writing documentation** | Write README, API docs, ADR from code you wrote. | Only share files/code you have the right to share. |

### 2. Ethical and security boundaries
This part is **mandatory**:

- **Do not upload client source code** to public AI tools without clear permission. If the client has an NDA (Non-Disclosure Agreement) or specific policies, follow them strictly.
- **Do not share sensitive data**: API keys, tokens, connection strings, user information, financial data.
- **Anonymize**: if you need to ask AI about a problem, **anonymize** it — replace real class/business names with placeholders, remove real values.
- **Check terms**: some clients ban AI entirely; some allow it for assistance. Ask if unsure.
- **You are responsible**: AI can be wrong; you are the one delivering code to the client, not the AI.

### 3. Can clients tell a proposal was written by AI?
Yes, if done poorly. Easy-to-spot signs:

| Sign | Why it raises suspicion | How to fix |
|---|---|---|
| Too generic: "I am a skilled developer..." | Everyone writes that | Open with a **specific detail** from the job (feature name, described problem). |
| Perfect structure but no proof | Looks like an AI template | Add **1 short case study with numbers** relevant to the job. |
| Overly flowery, unnatural vocabulary | Not how people actually write | Read aloud and shorten sentences. |
| Does not answer screening questions on point | AI did not read carefully | Fully customize answers to the client's requirements. |

Good clients care most about whether you **understand their problem**, not "did you use AI". If you use AI to rewrite more concisely and clearly, that is reasonable. If you use AI to mass-generate non-personalized proposals, that is a mistake.

### 4. A safe 3-step process
1. **Prepare**: read the job carefully; note 2–3 points the client cares about most.
2. **AI assist**: ask AI to analyze, create an outline, suggest ideas. **Do not** paste the entire job + profile + private info.
3. **Rewrite**: write in your own language, add specific proof, answer screening questions, do a final check.

### 5. Checklist
- [ ] Only use AI as an **assistant**, not as an **agent** sending proposals.
- [ ] Always anonymize data before asking AI.
- [ ] Every proposal must include at least **1 specific detail** from the job that only a careful reader would mention.
- [ ] Create a personal rule: "Do I clearly understand the solution I am proposing?" — if not, do not send it.
- [ ] Check client policy/NDA before using AI with any files.
- [ ] Prefer using AI for tasks that contain no sensitive information (summaries, test skeletons, docs).

> Senior tip: In the future, "knowing how to use AI safely and effectively" will be a highly valued skill. The differentiator is **ethics + security**. A dev who uses AI the right way while protecting client data will be far more trustworthy than a dev who is only good at coding.`,
    follow: [
      'When is using AI assistance reasonable, and when is it unethical in freelancing?',
      'How do you avoid uploading client source code to AI while still getting debugging help?',
      'Why do clients care more about "understanding the problem" than "whether you used AI"?'
    ]
  },
  'remote-058': {
    q: '(lead) A sustainable 2–3 year strategy for remote freelancing: position yourself as a business problem solver (not "coding by the hour"), build long-term clients and referrals, diversify channels (Upwork + LinkedIn + network), keep up with AI skills, set periodic checkpoints. How do you reduce dependence on bidding?',
    a: `**Summary:** The ultimate goal is not "get the most jobs", but to **build a stable client base**. Instead of bidding on low prices every month, position yourself as "someone who solves specific business problems", move from hourly to retainer (monthly contract), build referrals, and diversify channels so you do not depend entirely on Upwork.

### 1. Shift from "code typer" to "business problem solver"
Clients pay the most to people who help them **reduce losses or increase revenue**.

| Mindset | Example phrasing | Value |
|---|---|---|
| "I write Java code" | "I am a Java developer" | Low, easy to compare on price |
| "I fix slow APIs" | "I fix slow Java APIs to reduce cart abandonment" | Higher, tied to revenue |
| "I help cut cloud costs" | "I help e-commerce teams cut AWS costs by optimizing Java services" | Very high, tied to savings |

Always ask: **"How does this problem affect the client in money/time/risk?"** and answer in that business language.

### 2. Build long-term clients and referrals
The goal is to have **1–2 loyal clients** paying steadily each month instead of 5 new clients every month.

- **Deliver beyond expectations**: report clear results (numbers) after each milestone.
- **Proactively suggest improvements**: after fixing a bug, propose a small improvement to prevent similar issues.
- **Move to retainer**: instead of "this hour for that task", propose a monthly package (e.g., maintenance + small improvements) at a reasonable fixed price.
- **Ask for referrals naturally**: after a successful engagement, ask "If you know anyone facing a similar problem, could you refer me? I would really appreciate it."

### 3. Diversify channels to reduce dependence on bidding
Do not put all your eggs in one basket.

| Channel | Advantage | Ramp-up time | Notes |
|---|---|---|---|
| **Upwork** | Has traffic, easy to start | Medium | Still useful but should not be your only channel. |
| **LinkedIn** | Build brand, clients find you | Long-term | Write short posts about case studies (problem → solution → result) in English. |
| **Personal network** | Highest success rate, no bidding | Long-term | Talk to acquaintances, former colleagues, friends in the industry. |
| **Communities** | Build credibility | Long-term | Answer helpful questions in Java/Backend communities (no spam). |

### 4. Keep up with AI skills and set periodic checkpoints
AI is changing how work gets done. Leads need to stay ahead, not just follow.

- **Learn AI integration**: understand Spring AI/LangChain4j, safe usage, know when to use AI and when to code by hand.
- **Learn to evaluate AI-generated code**: the skill of "reviewing and fixing AI-generated code for production" is increasingly important (as noted in remote-056).
- **Measure continuously**: track key metrics.

### 5. Periodic checkpoints (2–3 year roadmap)
| Time | Goal | Metrics |
|---|---|---|
| **3 months** | Pick 1 niche, have 1 case study with numbers | Profile aligned to niche, invite/proposal rate improving |
| **6 months** | Have 1 long-term client or small retainer | % income from repeat clients >= 30% |
| **12 months** | Diversify channels, get at least 1 referral | % income not from bidding > 40% |
| **18–24 months** | Shift mainly to retainers/referrals | % income from retainers >= 60%, Upwork dependence < 40% |
| **24–36 months** | Focus on business value, rate increases clearly | Effective hourly rate up >= 40–60% vs start |

### 6. Checklist
- [ ] Rewrite your "value proposition" in terms of solving business problems.
- [ ] Pick 1 LinkedIn action: write 1 case study post in the next 7 days.
- [ ] Talk to at least 1 acquaintance about your niche (do not ask for a job, just share).
- [ ] List 3 potential clients who could become retainers.
- [ ] Schedule 3-month/6-month reviews to reassess strategy.
- [ ] Track % income by source (Upwork / LinkedIn / Referral / Other).

> Senior tip: True freedom in freelancing is not "working whenever you want", but **not being forced to accept any job just because you ran out of money**. To achieve that, you need to build "demand" instead of only chasing "supply" (job lists). Investing in positioning, relationships, and referrals today will pay off the most in the next 2–3 years.`,
    follow: [
      'How do you naturally transition from an hourly contract to a retainer with an existing client?',
      'Why is LinkedIn often more effective than sending 100 more proposals?',
      'What metrics would you use to measure "sustainable success", not just "total income"?'
    ]
  }
});
