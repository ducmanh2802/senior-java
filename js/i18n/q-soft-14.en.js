/*
 * English translation of js/data/q-soft.js — task T984. Format: js/core/i18n.js (content overlay).
 * ids: testing-048 behavioral-045 behavioral-046 behavioral-047 behavioral-048 behavioral-049 behavioral-050
 */
App.i18n.content({
  'testing-048': {
    q: `(Lead) You cannot test every scenario before deploying. How do canary release, synthetic monitoring, and feature flags turn production into a safe controlled testing layer?`,
    a: `**Summary:** No test environment matches production exactly in data, load, and integrations. That is why mature teams treat **production as the final controlled testing layer**: canary sends the new version to a small slice of traffic and **automatically compares** metrics against the old version to decide whether to proceed or rollback; synthetic monitoring runs simulated user scenarios continuously; feature flags separate deployment from release and allow instant toggling off. Prerequisites: good observability and fast rollback.

### Canary with automatic analysis

The new version receives 5% of traffic and runs for a while; the system compares error rate, p95/p99 latency, and business metrics (payment success rate) between canary and the stable version. If thresholds are exceeded, it rolls back automatically — no one needs to be woken up at 2 a.m. Example with Argo Rollouts:

~~~yaml
strategy:
  canary:
    steps:
      - setWeight: 5
      - pause: {duration: 10m}
      - analysis:
          templates:
            - templateName: error-rate-and-p99   # query Prometheus, rollback if fails
      - setWeight: 25
      - pause: {duration: 10m}
      - setWeight: 100
~~~

**Key point:** compare **canary against the baseline at the same time**, not against absolute thresholds, because traffic changes by hour. With 5% traffic there are few requests, so you need enough time for the data to be statistically meaningful.

### Synthetic monitoring

Automated scripts (log in, search products, place test orders) run every few minutes from multiple regions, e.g. CloudWatch Synthetics or k6/Playwright scripts on a schedule. They detect errors **before real users encounter them**, even at low traffic like midnight. Synthetic accounts must be tagged to be excluded from revenue reports and must not trigger real orders or real charges.

### Feature flag

Deploy code in the off state, then turn it on gradually by group: internal staff → 1% → 10% → 100%. When there is an error, turn off the flag in a few seconds instead of rolling back the deploy. Each flag needs an owner and an expiration; flags that live forever become technical debt and create combinations no one tests.

### Real-world example

An e-commerce platform deploys a new version of the pricing service. All staging tests pass. Canary at 5% shows after 8 minutes that the canary group's order success rate is 2.3 percentage points lower than the stable version, while HTTP error rate is unchanged: the new version returns wrong prices for products with multiple discount layers, so customers abandon their carts. Automatic analysis based on business metrics rolls back after 10 minutes; about 1,800 page views are affected instead of all users. From then on the team adds business metrics to every analysis template and adds a synthetic scenario "cart with multiple discounts".

### Common mistakes

- Canary without automatic analysis: someone has to watch the dashboard, easy to miss things.
- Only looking at HTTP error rate: business errors (wrong price, returns 200 but wrong data) slip through.
- DB migration not backward compatible: rolling back code but the schema has changed, canary is meaningless.
- Synthetic uses real accounts or is not tagged: corrupts business data, may create real orders.

### Sample interview answer

"I treat production as the final controlled testing layer, because staging never matches production exactly in data and load. There are three main tools. Canary sends the new version to a small slice of traffic and automatically compares against the stable version — not just error rate and latency but also business metrics such as payment success rate; if thresholds are exceeded, it rolls back automatically. Synthetic monitoring runs simulated user journeys every few minutes, detecting errors even at low traffic, with test accounts tagged so they don't affect metrics or create real transactions. Feature flags separate deployment from release, rolling out gradually by group and switching off in seconds; each flag has an owner and an expiration. Prerequisites: good enough observability, backward-compatible migrations, and fast rollback."

> Senior tip: canary is only safe when **schema changes are backward compatible** (expand → migrate → contract). Add the question "does the old version run with the new schema?" to the review checklist for every PR with migration; if the answer is no, neither canary nor rollback can save you.`,
    follow: [
      'Which metrics should automatic canary analysis compare, and why compare against the baseline at the same time?',
      'How do synthetic monitoring and RUM differ, and how do you use both?',
      'Who is authorized to remove feature flags, and how do you prevent permanent flags from becoming technical debt?'
    ],
  },
  'behavioral-045': {
    q: 'A team member keeps underperforming: missing deadlines, low code quality, affecting the whole sprint. You are a senior, not their direct manager. How do you handle it to improve the situation without breaking relationships or dumping burden on others?',
    a: `**Summary:** Handling underperformance (performance issue — when work results continuously fail to meet agreed expectations) needs a structured process: record specific behavior with data, 1-1 conversation to find the root cause, an improvement plan with measurable targets and timeframes, proactive support, then escalate with evidence if there is no progress. The goal is not to "punish" but to help that person succeed or make a fair decision for the team.

### Terms to understand

- **1-1 (one-on-one):** regular private conversation between two people. Everyday example: like a private talk between a homeroom teacher and a student, not a criticism in front of the class.
- **PIP (Performance Improvement Plan — improvement plan):** a document stating expectations, measurable goals, support provided, and evaluation milestones. Not every company in Vietnam uses the name PIP, but the principle (clear expectations + milestone + support) still applies.
- **Root cause:** the real reason behind the behavior, not the symptom. Example: late delivery (symptom) may be due to not knowing how to estimate, being blocked by dependencies, or personal issues.

### Real-world context (product company/bank in Vietnam)

A team of 7 developers builds a digital lending system (lending via app). One dev with 2 years of experience, over 3 consecutive sprints: completes 40% of committed story points (team average 85%), 6 out of 9 pull requests (PR — code merge requests) need revision over more than 2 rounds, and 2 logic bugs slip through staging (test environment before production). Others start having to "patch" to help, and morale (team spirit) drops.

### Step-by-step approach (STAR framework when telling the story)

**S — Situation (context):** State specific data, avoid feelings. Collect over 2–3 weeks: completion rate, number of review rounds, repeated error types, impact (tasks shifted, others working overtime).

**T — Task (responsibility):** In the senior role, responsibility is to protect team quality and progress while supporting colleagues — not to replace the manager, but to provide information and act within your scope.

**A — Action:**

1. **Prepare objective evidence:** 3-sprint tracking table (committed vs completed stories, cycle time, reasons PRs are returned). Do not use labeling language ("lazy", "weak").
2. **Private, early 1-1 conversation:** use the SBI model (Situation-Behavior-Impact). Example: "In sprints 12 and 13, 5 of your tasks were 2–3 days late vs. commitment, causing 2 dependent tasks of Mr. B to be rushed at the end of the sprint. I want to understand what is making it hard for you to complete?"
3. **Find root cause:** listen first. In the example: they are afraid to ask when stuck on interest calculation requirements (banking domain), spending 1–2 days figuring it out alone; also estimates are too optimistic.
4. **Create a 4-week improvement plan with measurable targets:**
   - Complete ≥ 75% of committed story points (reduce scope by less than 20% in the first 2 sprints).
   - PR: at most 1 revision round for basic convention/logic errors (use the shared review checklist).
   - Ask early: if stuck > 2 hours, ping on the team channel or ask a mentor.
   - Support: pair programming (two people working on one task together) 2 sessions/week in the first 2 weeks; lending domain documents; early review (draft PR after day 1).
5. **Weekly tracking:** 15-minute check-ins, record specific progress. Adjust support if needed.
6. **Transparent escalation if no improvement:** after 4 weeks, if only 50% of targets are met, report to engineering manager/tech lead with data, propose options (extend support, change to suitable task, or HR process if the company has one). Tell them upfront: "If after 4 weeks targets are not met, I will need to discuss further with the manager to find a solution."

### Before/after data example

| Metric | 3 sprints before | After 4 weeks of improvement |
| Commitment completion | 40% | 78% |
| Average PR revision rounds | 2.7 | 1.2 |
| Bugs escaping staging (by them) | 2 | 0 |
| Time blocked from not asking | ~6 h/sprint | ~1 h/sprint |

### Trade-off table when handling

| Approach | Pros | Cons | When to use |
| Stay silent, absorb it yourself | Avoids short-term conflict | Team burns out, problem spreads | Should not |
| Public criticism | Fast | Loses trust, defensiveness | Should not |
| 1-1 + measurable plan + support | Fair, chance to improve | Takes senior time | Default |
| Escalate immediately without support | Fast for manager | Lack of info, unfair if cause is environment | When serious behavior (fraud, sabotage) |

### Pitfalls (common mistakes)

- **Only talking about feelings:** "You are slow" — not convincing. Must have data and examples.
- **Not finding root cause:** pushing deadlines without teaching estimation/domain → recurs.
- **Supporting endlessly without boundaries:** senior becomes a bottleneck; the plan needs milestones and exit criteria.
- **Hiding from manager too long:** when the problem affects the sprint multiple times, the manager needs to know early to reallocate.

### Signals interviewers look for

- You separate **behavior** from the **person**, use data, have empathy (understanding the other person's difficulties) but keep standards.
- You show ownership (sense of responsibility) in the senior role: act within your sphere of influence, escalate at the right time.
- Results backed by data; you also mention the case of no improvement (honest).

> Senior tip: In outsourcing/Vietnamese bank environments, record important exchanges via short message/email (summary of goal + milestone) for transparency. Also ask what support they need — sometimes "underperformance" is due to missing system access, unclear business documents, or too many meetings. Fixing the system is also a senior responsibility.`,
    follow: [
      'If they react defensively or think you are targeting them, how will you adjust your way of speaking?',
      'When do you decide to propose moving them to a more suitable task instead of continuing the improvement plan?',
      'How do you ensure other team members do not feel unfair when you spend time supporting one person?'
    ],
  },
  'behavioral-046': {
    q: 'A PM (Product Manager — responsible for feature prioritization and deadlines) sets a deadline you consider unrealistic: impossible to complete with safe quality. How do you push back while keeping a cooperative relationship and not being seen as "unable to do it"?',
    a: `**Summary:** Pushing back on a deadline is not saying "no" but **data-driven negotiation**: clarify scope and success criteria, provide evidence-based estimates, point out specific risks (security, tech debt, production bugs), and propose options (cut scope, phase releases, add people if feasible). The goal is the best business outcome within real constraints, not winning an argument.

### Terms to understand

- **Scope:** what is done in this release. Everyday example: a birthday party — scope could be "cake + 10 friends" not "cake + 50 friends + a band".
- **MVP (Minimum Viable Product):** the smallest part sufficient to validate value or meet core requirements.
- **Tech debt:** a temporary quick fix now that causes repair/slowdown costs later. Example: taking a muddy shortcut — fast today, must be repaired when it rains.
- **Trade-off:** choosing one thing means reducing another (time/quality/scope/cost).

### Real-world context (VN 2025–2026)

A product fintech or digital bank needs to launch a biometric authentication feature (biometric — using fingerprint/face) before a 3-week marketing campaign. The PM requires "all flows, including OTP fallback" within 2 weeks. Team of 4 backend + 2 mobile; the system must integrate an eKYC provider (electronic identity) and meet security/audit requirements.

### Multi-party negotiation flow (simplified)

~~~seq
title: Deadline negotiation for biometric feature
actors: PM | Tech Lead | Team | Security
PM -> Tech Lead: Request launching all features within 2 weeks
Tech Lead -> Team: Break down work, estimate 3 points
Team --> Tech Lead: Need ~4.5 weeks if enough testing/security
Tech Lead -> Security: Confirm minimum audit and pen-test requirements
Security --> Tech Lead: Mandatory review + test of sensitive flows
Tech Lead -> PM: Present data, risks, 3 options
PM -> Tech Lead: Choose MVP 2-phase option
Tech Lead -> Team: Finalize phase-1 scope + done criteria
~~~

### Step-by-step approach

**S:** PM committed to a 2-week deadline with marketing. Team's rough estimate shows 4–5 weeks for a safe enough version.

**T:** In the lead role, you must protect quality/system and help PM make fully informed decisions.

**A:**

1. **Do not react emotionally:** avoid "impossible". Schedule 30–60 minutes to clarify: real business goal (demo? open to 100% of users? meet partner?), success criteria, what must be ready that day.
2. **Break down and estimate transparently:** split epic (large feature group) into small stories; estimate by range (best/likely/worst) or story points based on team history. Example: eKYC integration 5 days, biometric flow 6 days, OTP fallback 4 days, security testing + audit log 4 days, hardening + bugfix 3 days = ~22 person-days, not counting provider dependencies.
3. **State risks in business + technical language:** "If we cut security testing and audit log, there is a risk of biometric data leakage and failing audit requirements; incident handling costs may exceed a 1–2 week delay." Avoid just saying "dirty code".
4. **Propose options, not just problems:**
   - **Option A (MVP 2 weeks):** turn on biometrics for 5% internal/beta users, with OTP fallback, minimum audit log, feature flag (on/off toggle) to turn off quickly. Phase 2 (+2 weeks): expand + optimize.
   - **Option B (3 weeks):** cut secondary features (e.g. multi-device management), keep the main flow safe.
   - **Option C (keep 2 weeks, high risk):** only if accepting reduced testing scope and having a rollback plan (revert to previous version) + war room (on-call incident team) — PM/leadership must sign off on the risk.
5. **Finalize in writing:** chosen scope, delays, accepted risks, decision maker. Update backlog and notify stakeholders (interested parties).

### Example figures (illustrative when interviewing)

- Team capacity: ~40 story points/sprint (2 weeks). PM request equals ~75 points.
- MVP option: 38 points phase 1, 37 points phase 2.
- Result: beta launch on the marketing week, 0 serious security incidents, open to 100% after 12 days with authentication error rate < 0.3%.

### Pitfalls

- **Saying "no" empty-handed:** no data → seen as lacking competence.
- **Promising "will try" then breaking the promise:** worse than an early, evidence-based refusal.
- **Hiding security/banking risks:** in fintech, mistakes may violate regulations.
- **Not recording decisions:** when an incident happens, arguing "who agreed".

### Signals interviewers look for

- You negotiate with data, understand business goals, offer choices.
- You keep quality boundaries (especially security) but are flexible on scope.
- You communicate clearly, respect PM, finalize responsibility transparently.

> Senior tip: Prepare "three numbers" before every deadline negotiation: (1) estimate by scope, (2) real team capacity (minus meetings/leave/maintenance), (3) biggest risk if corners are cut. In Vietnamese outsourcing companies, add the question: is this deadline tied to a contract/late penalty or just an internal wish? The answer determines the level of flexibility.`,
    follow: [
      'If the PM still pushes the deadline and leadership agrees too, how do you protect the team and system?',
      'How do you estimate when there are dependencies on other teams or external providers that have not committed to timing?',
      'When do you accept short-term workload intensification, and what is the boundary you will not cross?'
    ],
  },
  'behavioral-047': {
    q: 'The system has a lot of tech debt but leadership prioritizes new features. How do you convince leadership to invest time in paying down tech debt so they agree?',
    a: `**Summary:** Leadership usually does not decide because of "bad code" but because of **business impact**: incident risk, operating costs, slower delivery, difficulty hiring/retaining people. Turn tech debt into a measurable problem (incident frequency, handling hours, lead time, infrastructure cost), propose a small measurable plan, and tie it to business goals.

### Terms to understand

- **ROI (Return on Investment):** benefit gained compared to cost spent. Everyday example: fixing a leaking roof costs 10 million but avoids 30 million of damaged goods when it rains.
- **Lead time:** time from starting a change until it runs on production. Increasing lead time is usually a sign the system/process is slowing things down.
- **Incident:** an error affecting users or operations (broken API, slow, wrong data).
- **Refactor:** improving code structure without changing external behavior, to make it easier to maintain/extend.

### Real-world context

An e-commerce company or bank with a monolith/modular Java Spring Boot 3.x running 4–5 years: slow builds, flaky tests (sometimes pass sometimes fail, unstable), payment module hard to change, each new feature takes double the estimate. Leadership wants to push 3 revenue features this quarter.

### Persuasion flow (stakeholders)

~~~seq
title: Presenting tech debt investment
actors: Tech Lead | Engineering Manager | Product Lead | CTO
Tech Lead -> Engineering Manager: Collect incident, lead time, cost data
Engineering Manager -> Product Lead: Tie tech debt to roadmap risk
Product Lead --> Engineering Manager: Confirm which features are delayed due to debt
Engineering Manager -> CTO: Propose 20% capacity/sprint + measurable goals
CTO --> Engineering Manager: Approve 1-quarter pilot
Tech Lead -> Engineering Manager: Report results every month
~~~

### Step-by-step approach

**S:** 40% of backend team time is spent fixing regression bugs (bugs where old features break again) and handling incidents; average feature lead time rose from 8 to 19 days over 6 months.

**T:** Lead needs to turn the technical issue into an approvable investment decision.

**A:**

1. **Measure, don't just complain:**
   - Incidents related to module X: 6 per quarter, average 4 hours handling each.
   - PRs waiting due to flaky tests/build: 18%.
   - Onboarding time for a new dev on the module: 6 weeks.
   - Estimated cost: engineer hours + customer impact (if there is an SLA — service level commitment).
2. **Choose 1–2 high-leverage debts:** do not ask to "rewrite the whole system". Example: stabilize payment integration tests + split the adapter layer for the payment gateway.
3. **Propose a small investment package with milestones:**
   - Dedicate 15–20% of capacity each sprint (e.g. 1 day/week/dev or 1 tech debt story/sprint) for 6–8 weeks.
   - Goals: reduce flaky tests from 18% to < 5%; reduce time to add a new payment method from 15 days to 7 days.
4. **Tie to roadmap:** "If we don't handle the payment module, next quarter's e-wallet feature risks a 3–4 week delay." Speak their language.
5. **Pilot and report:** after 4 weeks report progress, before/after metrics, adjust. Small successes build trust for further investment.

### Example figures (illustrative)

| Metric | Before | 8-week target | After 8 weeks (example) |
| Flaky tests blocking PR | 18% | < 5% | 4% |
| Payment module incidents/quarter | 6 | ≤ 3 | 2 |
| Lead time for payment changes | 15 days | ≤ 8 days | 7 days |
| CI build time | 28 minutes | < 15 minutes | 14 minutes |

### Pitfalls

- **Asking for a vague "big refactor":** sounds like bottomless cost.
- **Only mentioning code smell:** leadership does not see money/risk.
- **Not measuring beforehand:** cannot prove improvement.
- **Fighting for 100% time for tech debt:** unrealistic when the company needs features.

### Signals interviewers look for

- System and business thinking, not just technical.
- Ability to manage up with data and a feasible plan.
- Knows how to prioritize tech debt by impact, accepts trade-offs.

> Senior tip: Use the "risk + speed + cost" framework. Pick a relatable story: "Last time a payment incident took 6 hours and affected X orders — root cause related to this hard-to-test code; investing 3 weeks will reduce recurrence probability." One real incident (if allowed to share) convinces more than 20 theory slides.`,
    follow: [
      'Which tech debt do you prioritize first when resources are limited?',
      'If leadership only agrees to 10% of the time, where do you use that 10% for maximum impact?',
      'How do you prevent a "tech debt sprint" from becoming a dumping ground for jobs no one wants?'
    ],
  },
  'behavioral-048': {
    q: 'You are mentoring a junior (inexperienced programmer). How do you build a plan to help them grow, and how do you know the mentoring is effective?',
    a: `**Summary:** Effective mentoring is not answering every question to help the junior, but **creating self-solving ability**: assess starting point, set skill goals by phase, assign tasks of gradually increasing difficulty, give specific feedback via code review/1-1, and measure progress through observable behavior. A good mentor reduces dependency over time.

### Terms to understand

- **Mentoring:** long-term guidance on skills, thinking, and working methods. Different from short-term coaching for a specific issue, but the two concepts can overlap.
- **Pair programming:** two people working on one task together (one types, one observes/gives input or they take turns) to transfer knowledge.
- **Code review:** evaluating code before merging. A teaching opportunity if focused on "why", not just "fix it like this".
- **Stretch assignment:** a task slightly beyond current ability but with support, helping fast learning. Everyday example: practicing running 3 km when used to 2 km, with someone running alongside.

### Real-world context

A junior graduated 6 months ago joins a Java Spring Boot team at a large outsourcing company or product company. They can do basic CRUD (create/read/update/delete) but struggle with debugging transaction (DB transaction) errors, writing tests, and estimating tasks.

### Step-by-step approach

**S:** The junior completes small tasks but needs continuous support; PRs often lack tests and error handling; you are the senior assigned to support.

**T:** Help the junior confidently handle medium tasks within 2–3 months, reducing the time you must intervene directly.

**A:**

1. **Assess baseline (current foundation):** observe 1–2 weeks or pair for 2 sessions. Identify strengths/weaknesses: Java core, Spring, SQL, Git, communication, debugging. Ask about the junior's goals.
2. **Set 30-60-90 day goals (example):**
   - 30 days: master team processes (Git flow, CI — continuous integration), write basic unit tests, run and read error logs independently.
   - 60 days: complete small stories independently, understand basic transaction/JPA in the team context, estimate with justification.
   - 90 days: handle simple production bugs with light guidance, review others' PRs at convention level.
3. **Assign gradually increasing tasks:** start with tasks with clear boundaries and acceptance criteria. Then add complexity: API integration, error handling, basic performance.
4. **Specific and timely feedback:**
   - Code review: explain "why use {{@Transactional}} at the service boundary, not the repository" (concept example) along with internal documentation.
   - Praise specific behavior: "You proactively added tests for the null case — great."
5. **Create a safe space to ask:** agree on "stuck for 30 minutes then ask", clear asking channel, no mocking basic questions.
6. **Track and adjust:** weekly 1-1 of 20–30 minutes: progress, difficulties, two-way feedback. Record milestones achieved.

### Example data

| Milestone | Before | After 8 weeks (example) |
| Tasks completed independently per sprint on average | 0–1 | 2 |
| Average PR revision rounds | 3 | 1.5 |
| Share of PRs with appropriate tests | 20% | 70% |
| Times senior must "do it for them" | 4/sprint | 1/sprint |
| Confidence presenting solution (self-rated 1–5) | 2 | 4 |

### Pitfalls

- **Doing it for them to be fast:** junior doesn't learn, senior gets overloaded.
- **Only assigning easy tasks forever:** no development.
- **Vague feedback:** "code is not good" — not actionable (doesn't know how to fix).
- **Not respecting learning pace:** everyone is different; need patience but still clear expectations.

### Signals interviewers look for

- You have a method (plan, goals, feedback), not ad-hoc mentoring.
- You measure effectiveness by junior's growth and reduced dependency.
- You show the lead/senior role: scaling team capability.

> Senior tip: Ask the junior to explain the solution in their own words ("teach-back" — teach back). If they can explain why, the knowledge belongs to them. Also have the junior record technical decisions — learning while creating documentation for the team.`,
    follow: [
      'How do you handle it when the junior keeps making the same mistake after multiple feedback sessions?',
      'How do you balance mentoring time with your own deliverable (product to ship) deadlines?',
      'How do you distinguish mentoring from micromanagement (excessive detailed interference)?'
    ],
  },
  'behavioral-049': {
    q: 'You are participating in interviewing a Java backend developer. How do you design and conduct the interview to assess ability correctly, fairly, and make a reliable hiring decision?',
    a: `**Summary:** Effective hiring interviews need **structure**: identify competencies to assess by role (technical, problem solving, communication, behavior), use consistent questions/rubric (scoring criteria table), collect signals from multiple angles, and reduce bias (bias — evaluation skewed by subjective impression). The goal is not to find someone "like me" but someone who meets the job requirements.

### Terms to understand

- **Rubric:** a table describing score levels for each criterion (e.g. 1–4: not met/basic/met/exceeds). Everyday example: exam grading rubric, everyone grades on the same scale.
- **Structured interview:** the same criteria/core questions for all candidates in the same position, enabling fair comparison.
- **Signal:** observable evidence of ability (how they analyze, trade-offs, clear code). Different from "feeling" (gut feeling).
- **Bias:** prejudice such as "same school as me", "speaks fluently so is good", "halo effect" (one strong point hides weak points).

### Real-world context (VN 2025–2026)

Hiring senior/mid Java for a product team or bank: needs Spring Boot, SQL, working with legacy, communicating with QA/PM. Technical interview 60–75 minutes, you are the lead/owner of the technical round.

### Multi-party process

~~~seq
title: Structured technical interview process
actors: Recruiter | Hiring Manager | Interviewer | Candidate
Recruiter -> Hiring Manager: Profiles meet basic requirements
Hiring Manager -> Interviewer: Share JD, must-have/nice-to-have criteria
Interviewer -> Candidate: Introduce interview structure
Candidate -> Interviewer: Answer technical and behavioral questions
Interviewer -> Hiring Manager: Evaluation sheet by rubric + evidence
Hiring Manager -> Recruiter: Offer/no/next round decision
~~~

### Step-by-step approach

**S:** The team needs to hire someone who can onboard quickly, work with the existing Spring Boot system, and take responsibility for quality.

**T:** You design the interview round to make an evidence-based "hire/no hire" decision.

**A:**

1. **Link to Job Description (JD):** identify 4–5 core competencies: practical Java/Spring, basic API/DB design, debugging/problem solving, testing/quality mindset, communication.
2. **Design session structure:**
   - 5 minutes: introduction, make the candidate comfortable.
   - 15 minutes: real experience (projects, role, technical decisions).
   - 25 minutes: appropriate technical exercise (small code review, simple API design, or debug scenario) — allows follow-up questions, no meaningless trivia puzzles.
   - 10 minutes: behavioral/situational (incident handling, disagreement, deadline).
   - 5 minutes: candidate's reverse questions.
3. **Use a rubric:** each criterion has a description of levels 1–4 and behavior examples. Note evidence ("explains index trade-off", "has not mentioned how to rollback").
4. **Reduce bias:** do not ask non-job-related information; evaluate by criteria; if multiple interviewers, consolidate independently before discussing.
5. **State decision clearly:** hire/no hire/lean with rubric-linked reasons. Avoid "this person is fine but I don't know why" — must have evidence.

### Compact rubric example

| Criterion | Level | Signal |
| Java/Spring | 3/4 | Understands request flow, basic transaction, can name common errors |
| Problem solving | 3/4 | Asks clarifying questions, breaks into steps, considers trade-offs |
| Quality | 2/4 | Knows testing but has not proactively proposed a testing strategy |
| Communication | 3/4 | Explains clearly, admits what they don't know |

### Pitfalls

- **Asking unrealistic algorithm puzzles** for CRUD/business backend roles if JD doesn't require it.
- **Relying only on feeling:** "chemistry" is important but doesn't replace ability.
- **One interviewer decides everything** without criteria.
- **Not giving the candidate context:** doing the exercise in silence then scoring "poor communication".

### Signals interviewers (here you, when telling your story to the interviewer interviewing you) need to show

- You hire systematically, fairly, protecting team quality.
- You look for evidence, know how to limit bias, respect candidates.
- You link hiring criteria to the team's real needs.

> Senior tip: At the end of the interview, ask yourself: "If someone else reads my notes, do they see specific evidence?" Good notes help the hiring manager decide and help the team improve the hiring process. For a good candidate who doesn't fit this role, note clearly "better fit for another role" — this is how you build your employer brand.`,
    follow: [
      'How do you handle it when a candidate is technically strong but shows a dismissive attitude toward QA/colleagues?',
      'How do you evaluate a senior candidate when they don\'t remember syntax details but have good thinking?',
      'How do you balance "current competence" and "learning ability"?'
    ],
  },
  'behavioral-050': {
    q: 'Two seniors in the team have a heated conflict over design (e.g., choosing synchronous REST architecture or event-driven with message broker). You are the lead, how do you guide the team to a decision without embarrassing anyone and still ensuring technical quality?',
    a: `**Summary:** Design conflicts between two seniors usually stem from **different priorities** (simplicity, scalability, operational risk) not just absolute right/wrong. The lead needs to turn emotional debate into a criteria-based decision: clarify context and constraints, gather evidence, use an evaluation framework (trade-offs, ADR — Architecture Decision Record), small experiments if needed, then make the decision and record responsibility.

### Terms to understand

- **Synchronous:** the caller waits for an immediate response. Everyday example: phone call — you wait for the other person to answer.
- **Event-driven:** the system emits events, others process them later via a message broker (message-middleware software like Kafka/RabbitMQ — short explanation: like a post office receiving letters and delivering to recipients when ready).
- **ADR (Architecture Decision Record):** a short document recording an architecture decision: context, choice, rationale, consequences.
- **Consensus:** everyone supports; **consent** (acceptable): you may not choose your favorite option but accept it for clear reasons. Large teams rarely achieve full consensus.

### Real-world context

A team building an order processing module: Senior A wants synchronous REST because it's simple and easy to debug; Senior B wants event-driven to decouple services and handle sale traffic spikes. They argue for 2 sessions, other teams are blocked.

### Decision-making flow

~~~seq
title: Leading design decisions when two seniors disagree
actors: Lead | Senior A | Senior B | Team
Lead -> Senior A: Invite to present option + risks
Lead -> Senior B: Invite to present option + risks
Senior A -> Lead: Criteria: simplicity, easy operation
Senior B -> Lead: Criteria: extensibility, reduced coupling
Lead -> Team: Agree on evaluation criteria and constraints
Lead -> Senior A: Propose pilot/ADR by criteria
Lead -> Senior B: Confirm acceptable conditions
Lead -> Team: Announce decision + ADR + review plan
~~~

### Step-by-step approach

**S:** Two seniors argue publicly, starting indirect personal attacks; the sprint is delayed.

**T:** The lead needs to make a timely decision, keeping respect, based on system goals.

**A:**

1. **De-escalate and separate people from the problem:** stop the drawn-out argument, schedule a structured 45–60 minute design session. Remind of the principle: critique ideas, not people.
2. **Clarify shared constraints:** SLA (response time/availability commitment), current and expected traffic (e.g. 200 req/s normal, 1500 req/s sale), does the ops team know Kafka, phase-1 deadline.
3. **Ask each side to present using the same framework:**
   - Suitable context.
   - Operating cost (monitoring, retry, idempotency — handling duplicates: calling multiple times gives the same result as calling once).
   - Biggest risk and mitigation.
   - Effort estimate.
4. **Evaluate by agreed criteria:** e.g. scorecard (simplicity 30%, load handling 25%, delivery risk 25%, operational capability 20%).
5. **Look for a hybrid option if reasonable:** phase 1 uses synchronous REST for the core flow + outbox/event for secondary tasks (sending email, updating analytics) to reduce risk while still learning gradually. Choose only if the team can operate it.
6. **Make the decision and take responsibility:** lead announces the decision, explains the rationale, records the ADR. Thank both; clearly record the contribution of the unchosen option (e.g. add to technical backlog).
7. **Set a review point:** after 4–6 weeks measure latency, errors, operational complexity; be ready to adjust.

### Example criteria (illustrative)

| Criterion | REST sync | Event-driven | Notes |
| Initial simplicity | High | Low | Team has no broker experience |
| Handling sudden load | Medium | High | Needs queue/buffer |
| Debug/trace | Easier | Harder | Needs distributed tracing |
| Phase-1 launch time | 3 weeks | 6 weeks | Marketing needs phase 1 |

### Pitfalls

- **Letting the argument drag on indefinitely:** wastes opportunity cost.
- **Voting by feeling:** design needs technical criteria and constraints.
- **Lead avoiding the decision:** team loses direction.
- **Choosing people, not solutions:** creates factions.

### Signals interviewers look for

- Facilitation (discussion moderation) and decision-making ability.
- Respect senior expertise, but keep the common goal.
- Uses evidence, documentation (ADR), and review mechanisms.

> Senior tip: When two seniors disagree, ask: "What condition would make you change your mind?" This forces each side to state testable assumptions. Also determine "reversible vs irreversible decision": easily reversible decisions should be settled quickly, hard-to-reverse ones need more evidence.`,
    follow: [
      'If after the decision, a senior still does not cooperate or speaks badly about the solution, how do you handle it?',
      'What do you do when data is insufficient to prove which option is better in a short time?',
      'How do you acknowledge the contribution of the person whose idea was not chosen so they stay engaged?'
    ],
  },
});
