/*
 * English translation of js/data/q-soft.js — task T738. Format: js/core/i18n.js (content overlay).
 * ids: behavioral-031 behavioral-032 behavioral-033 behavioral-034 behavioral-035 behavioral-036 behavioral-037 behavioral-038
 */
App.i18n.content({
  'behavioral-031': {
    q: 'Tell me about the project you are most proud of (or the one you take pride in). What was your role, what was the biggest challenge, and what were the results?',
    a: `**Summary:** This question sounds like "tell a success story" but the interviewer is really examining **the part you actually did** (ownership — meaning you own a part end-to-end), how you overcame challenges, and whether you measured results with numbers. A strong answer chooses a project **of moderate difficulty** (enough to show senior ability for 4–6 years of experience), states your personal role clearly, and gives before/after numbers.

### What the interviewer wants to hear (and why)
- **Role scope:** are you the person executing a piece, or the one designing/coordinating? With 4–6 years of experience, they expect you to have led part of something (a module, a flow, or 2–3 people), not just "receive a ticket and code".
- **Why you chose this project:** choosing it because it is technically hardest is not always best; choosing one with clear impact (reducing errors, increasing revenue, shortening time) is often more convincing.
- **How you handled difficulty:** "difficulty" must be specific (technical constraints, deadlines, dependencies on other teams) with actions you took, not just complaining.
- **Results measured with numbers:** metrics (latency — response time; error rate; processing time; number of users) prove impact. Without numbers, use a proxy (estimate, stakeholder feedback) but be honest.

### STAR answer framework (step by step)
STAR is a storytelling framework: **S**ituation (context), **T**ask (your role/task), **A**ction (specific actions you took), **R**esult (results measured).
1. **S — Context (20–30 seconds):** what system, what scale, what business problem. Example: "an order processing service for an e-commerce platform, ~8,000 orders/hour at peak".
2. **T — Your role:** clearly state the part you own. "I was the lead backend engineer, designing the payment confirmation flow and coordinating with 1 frontend + 1 QA."
3. **A — Difficulty and action:** pick 2–3 major difficulties, each tied to an action. Go in chronological order: detect → analyse → decide (with trade-offs) → implement → verify.
4. **R — Result:** before/after with numbers. Add a short lesson (1 sentence) showing your growth.

### Sample answer (Java dev 4–6 years)
> **S:** "The project I am most proud of is splitting the promotional notification flow out of the order system at an e-commerce company. Previously, each campaign sending 200,000 emails/SMS slowed the order API badly at peak times."
> **T:** "I was responsible for designing and implementing the backend part: splitting the notification sending job into a separate flow, ensuring it did not affect order transactions. Team of 4 people, I led the technical part with 1 mid-level developer supporting."
> **A:** "First difficulty was not losing scheduled notifications. I designed an outbox table (a temporary table storing events to be processed, read later to send — preventing data loss when the process fails) and a job running in batches of 500 records, with an idempotency key (key to prevent duplicate sending: the same key is processed only once). Second difficulty was running in parallel with the old system for 2 weeks: I used a feature flag (a flag to turn a feature on/off by configuration, without redeploying) to gradually shift 10% → 50% → 100% traffic, with a dashboard monitoring the success rate."
> **R:** "Order API p95 (the response time below which 95% of requests fall) during campaigns dropped from 1.8 seconds to 320 ms, notification success rate 99.7%, no lost-notification complaints in the first 3 months. My lesson was that for risky changes, gradual rollout and metric observation matter more than writing code fast."

### Self-check table before telling
| Item | Met | Not met |
|---|---|---|
| Personal role clear | "I designed/implemented/decided…" | "Our team…" throughout the story |
| Specific difficulty | named technical/process constraint | "project was very difficult, lots of pressure" |
| Before/after numbers | real numbers or honest proxy | only "feels better" |
| Lesson | 1 sentence applicable | none or empty |

### Common mistakes
- **Telling a project too big but role unclear:** "core banking project for 2 years" but not saying what part you did → the interviewer cannot assess your ability.
- **All tech, no impact:** listing technologies (Kafka, Redis, Kubernetes) without saying what problem they solved.
- **Inflated results:** "increased performance 10x" without explaining how measured → deep questioning will expose it.
- **Choosing a failed project without learning:** you can tell a hard project, but must have "what I did to save/mitigate" and "what I changed after".
- **Too much context:** spending 3 minutes describing the company, 30 seconds about you. Reverse it.

> Senior tip: prepare **one "proud project" and one "failed project with a lesson"** using the same STAR framework. Many Vietnamese company interview rounds (tech lead, manager) will ask variants of this question ("hardest project", "thing you are most proud of"); you only need to change the emphasis, not prepare new stories.`,
    follow: [
      'If you did the project again today, which technical decision would you change and why?',
      'In that project, which part depended on other people, and how did you handle dependency risk?',
      'What metric did you use to measure the "success" of that project after go-live (going live, running for real users)?'
    ],
  },
  'behavioral-032': {
    q: 'Why do you want to quit / leave your current company? If they try to keep you (counter-offer — a proposal to increase salary/conditions to make you stay), how would you answer?',
    a: `**Summary:** The goal of this question is to test **professionalism and real motivation**: are you leaving because you are pulled toward something better (pull) or just running away from a problem (push)? A good answer is short, honest but without speaking ill of the former company/people, and connects your reason for leaving to **what you are looking for at the new company**. For a counter-offer, the answer should show you have thought carefully, not just emotional negotiation.

### What the interviewer wants to hear
- **Motivation:** you want to learn new technology, larger scale, a different domain, a clearer career path — or just bored/low salary? "Toward" motivation is more believable.
- **Risk to them:** if you speak ill of your former boss, they worry you will speak ill of them later. If the reason is vague, they worry you will leave quickly.
- **Stability:** they combine this with your job-hopping history (see the tenure question). Be consistent.
- **Fit:** does your reason for leaving get solved by the new company? (e.g., leaving because you want to work on product, but the new company is short-term outsourcing → mismatch.)

### 3-part answer structure (30–60 seconds)
1. **One positive sentence about the old company (1 sentence):** "I learned a lot about … at my current company." Not fake, but start neutral.
2. **Reason for leaving — toward (1–2 sentences):** focus on opportunity: scope of work, system scale, domain (business field), technology you want to deepen, career path. Avoid listing complaints.
3. **Bridge to the new company (1 sentence):** "That is why I am looking for a position where I can … — what I see in this role."

### Sample answer (Java dev 4–6 years)
> "I learned a lot about API development and team workflows at my current company, especially operating Spring Boot services over the last 2 years. The reason I want to change is that I am looking for an opportunity to work with higher-traffic systems and get more involved in design (e.g., asynchronous processing, data optimization), while my current scope is mainly maintaining features. This role matches that direction, so I applied."

### Reasons to say / not to say
| Say (expressed well) | Don't say (even if true) |
|---|---|
| Want to try a different scale/technology/domain | "Bad boss, toxic colleagues" |
| Want a clearer technical path, mentoring/being mentored | "Chaotic company, no process" |
| No more room to grow in current scope | "Under pressure, not recognized" |
| Changing direction (product/outsource, domain) | "Salary too low" (if mentioning salary, tie it to market value/total compensation, do not complain) |
| Company restructuring/project closed (if true) — say honestly and briefly | Detailed internal drama |

### If asked about a counter-offer
- **Principle:** if your reason for leaving is only salary, a counter-offer might solve it; but if the reason is scope, culture, career path, a higher salary usually just "buys" a few more months. Answer showing you have analysed this.
- **How to say:** "I appreciate the offer to stay, but my decision is based on career direction (scope/scale/learning) not just income. I want to move on in good faith and hand over fully." Keep a respectful tone, do not hard-close if you have not decided — but do not seem easily swayed by money either.
- **Reality:** many counter-offers come with higher expectations; consider carefully on your own, but do not turn the interview answer into bargaining.

### Common mistakes
- **Speaking ill in detail:** telling stories about bad boss/team → the interviewer worries about risk.
- **Lying about a reason that is easy to check:** "company is closing" while LinkedIn shows otherwise; only say what is verifiable.
- **Only talking about salary:** making yourself look like someone who only chases money; if salary is part, put it in the "total compensation and opportunity" picture.
- **Answering too long:** turning a 1-minute answer into a 5-minute story of hardship.
- **Contradicting your CV:** if you left after 6 months, give a consistent explanation (project ended, trial did not fit, restructuring) — do not dodge.

> Senior tip: write a ready "reason for leaving" answer for **each** job change on your CV, each at most 2 sentences. When the interviewer follows up ("and the time before that?"), you will be consistent and calm instead of improvising.`,
    follow: [
      'What at your current company could make you stay if it changed?',
      'What do you look for in a direct manager at the new company?',
      'If you get an offer here, how do you plan to hand over your current work?'
    ],
  },
  'behavioral-033': {
    q: 'What are your greatest strength and greatest weakness? Give specific examples.',
    a: `**Summary:** This question tests **self-awareness** (understanding where you are good/not good) and **constructive honesty**. Strengths must be work-related with evidence; weaknesses must be real weaknesses (not a disguised strength like "I am too perfectionist") but accompanied by **actions you are taking to improve** and an example showing progress.

### What the interviewer wants to hear
- **Strength:** is it relevant to the Java backend/senior role? Is there an example proving it? Someone saying "hardworking" without an example is weak.
- **Weakness:** do you dare to look straight at your own limitations? More importantly: do you have an improvement mechanism (active learning, asking for feedback, changing habits)?
- **Fit:** does your strength/weakness reveal risk for this role? (e.g., weak communication but the role requires coordinating many teams.)

### How to choose a strength (for Java dev 4–6 years)
Choose 1 **specific, work-related** strength, avoid generic ones.
- Good examples: "root-cause analysis during incidents", "designing clear, easy-to-integrate APIs", "breaking down complex problems and estimating realistically", "writing documentation/knowledge for the team to reuse".
- Structure: **name the strength → short example (context, action) → result/impact**.
- Avoid: "I learn fast", "I am hardworking" — everyone says these, they do not differentiate.

### How to choose a weakness (avoid traps)
| Trap | Example | Why bad |
|---|---|---|
| Disguised strength as weakness | "I am too perfectionist, work too much" | Interviewer hears this daily, does not believe |
| Fatal weakness for the role | "I do not like communicating with anyone" (role requires coordination) | Eliminating yourself |
| Weakness with no improvement | "I often forget" then stop | Shows no initiative |
| Vague weakness | "I still have a lot to learn" | No information |

Choose a **real but manageable** weakness, and always have: example + impact + improvement action + sign of progress.

### Sample answer
> **Strength:** "My strength is handling incidents methodically. For example, when the payment API latency increased, instead of guessing, I checked layer by layer: metrics (indicators like latency, errors), logs, then traced to the database, and pinpointed the cause as a query missing an index. With this approach, the team often asks me to support when incidents are vague, and the time to find the root cause dropped significantly compared to random guessing."
>
> **Weakness:** "The weakness I am improving is the habit of taking on more work before fully assessing my current load — I like to help the team, so I sometimes commit too early. Once I took on two tasks simultaneously and had to ask to move an internal milestone by 1 day. After that I changed: before taking on new work, I write down what I am doing, estimate time, and confirm priority with the person assigning it. Recently I have used a weekly checklist and raise risks early when I see a delay risk; in the last 2 quarters I have not had to move milestones due to overcommitting."

### How to say it naturally (avoid sounding memorised)
- Keep it short: each part 30–45 seconds, total ~1.5 minutes.
- Use real examples from you; if using the sample, replace with your own numbers/situation.
- Keep a calm tone, do not over-blame yourself on the weakness part.

### Common mistakes
- **No example:** just declaring "my strength is responsibility" without proof.
- **Turning weakness into a "flex":** sounds very insincere.
- **Naming a weakness directly related to the role's core skill** without a clear improvement path.
- **Preparing one-dimensionally:** only thinking about technical strengths; for senior roles, strengths in collaborating/helping others are also valuable if evidenced.

> Senior tip: before the interview, ask 1–2 recent colleagues or your nearest manager for honest feedback: "Where do you see me strong, and what do I need to improve?" You will have more authentic examples, and your answer will match what references can say about you.`,
    follow: [
      'Would colleagues or your manager describe your strength differently from how you just said?',
      'What feedback have you received recently that you initially disagreed with, and how did you handle it afterwards?',
      'What skill are you learning in the next 3–6 months to overcome that weakness?'
    ],
  },
  'behavioral-034': {
    q: 'Tell me about a mistake you made at work that affected others (colleagues, customers, other teams). How did you handle it and what lesson did you learn?',
    a: `**Summary:** This question is about **responsibility and maturity**. The interviewer wants to see that you dare to own your part, act to limit damage immediately, communicate transparently, and change so the mistake does not repeat. A "moderate" mistake (real impact but you controlled it) told via STAR is stronger than avoiding it or telling a tiny mistake.

### What the interviewer wants to hear
- **Ownership:** do you say "I did…" or blame the process/other people?
- **Mini crisis handling:** when you discover a mistake, do you prioritize hiding it or fixing and informing?
- **Impact on others:** do you recognise the impact on colleagues/customers (not just on the code)?
- **Lesson into action:** changes to process, checklist, test, review — not just "I will be more careful next time."

### Which mistake to tell
- **Should:** a mistake with clear impact (made another team wait, broke part of a function, delayed a release) that you detected/handled; a mistake showing you work at a responsible level (deploy, data change, technical decision).
- **Avoid:** a mistake too serious causing unresolved major damage (unless you have a very clear recovery story) — may worry the interviewer. Also avoid too small mistakes ("forgot formatting") — they prove nothing.
- **Never:** blaming others entirely.

### STAR framework
1. **S:** context, what you were doing, who was affected.
2. **T:** your responsibility.
3. **A (2 parts):** (a) the specific mistake you made; (b) immediate fix action: who you informed, what you did to limit damage, how long.
4. **R:** result after handling + long-term change (guardrail — a barrier to prevent recurrence: test, checklist, review, alert).

### Sample answer (Java dev 4–6 years)
> **S:** "When I changed an internal API to add a required field to the order creation flow, the mobile team was integrating in parallel and had a release that week."
> **T:** "I was responsible for the backend API and needed to ensure the change did not break clients in use."
> **A:** "My mistake was merging the change and only announcing it on the project chat channel without confirming the mobile team had updated; I also did not version (versioning the API — keeping the old version compatible for a period). As a result, the mobile team's staging environment hit validation errors, and they lost nearly half a day waiting. When I found out, I proactively apologised on the project channel, explained the cause, and within 2 hours I changed it: the new field became optional (not required) in the current version, with a default value, and I opened a new version with the required field plus migration documentation (instructions for conversion). I coordinated with QA to re-test the old flow."
> **R:** "The mobile team released on schedule. Afterwards I proposed a convention: breaking changes (compatibility-breaking — old clients will fail) must have direct notice to the client owner, with a deprecation period (stopping support for the old version), and add contract tests (API contract testing between both sides) for shared endpoints. Since then, similar API changes have not had such incidents."

### Common mistakes when answering
- **"My mistake was trusting others too much":** sounds like disguised blame.
- **Not stating impact on others:** missing the focus of the question.
- **Just apologising, no concrete action:** missing part (b) of Action.
- **Vague lesson:** "I will be more careful" — not measurable, not convincing. Say the specific change (added a review step, test, checklist, notification).
- **Telling someone else's mistake:** the interviewer asks about **you**.

> Senior tip: choose a story where you can clearly state the **"barrier" added afterwards** (test, alert, review convention, runbook). That is proof you turned a mistake into systemic improvement — exactly what is expected at senior level.`,
    follow: [
      'Who did you inform first about the mistake, and how did you choose the timing/message?',
      'If a colleague made a similar mistake, how would you react to both fix it and keep psychological safety?',
      'How do you know the "barrier" you added really prevents the mistake from repeating?'
    ],
  },
  'behavioral-035': {
    q: 'When you receive multiple "urgent" tasks at the same time from different sides (boss, PM, other teams), how do you prioritise and communicate?',
    a: `**Summary:** This question tests the ability to **prioritise based on impact**, manage expectations (what others expect), and communicate transparently when you cannot do everything at once. A good answer is not "I will try to do all" but: clarify context → assess impact/risk → propose order and options (cut scope, ask for help) → confirm in writing.

### What the interviewer wants to hear
- **Prioritisation criteria:** do you use gut feeling ("whoever shouts loudest") or criteria (customer impact, production risk, contract commitment, dependency blocking others, cost of delay)?
- **Ability to say "not now" professionally:** seniors neither stay silent then miss deadlines, nor make empty promises.
- **Transparency:** do you clarify trade-offs for stakeholders?
- **Proactive coordination:** do you look for resources/solutions instead of taking it all alone?

### 5-step handling framework
1. **Clarify each task (5–10 minutes):** what does "urgent" mean? real deadline when, consequence if late, Definition of Done? Many "urgent" tasks are actually different levels of urgent.
2. **Assess by a simple matrix:**
| Criterion | Question |
|---|---|
| Impact | How many users/money/systems affected if late? |
| Risk | Would it cause a production incident or break a commitment? |
| Dependency | Is another team blocked? |
| Effort | How long? Can a small part be delivered early? |
3. **Propose order and options:** e.g. do A first (production risk, ~3 hours); for B deliver a minimal version today and promise the full part after the demo; for C schedule 30 minutes tomorrow morning or ask for help.
4. **Confirm with the person who can prioritise:** if both sides are "important", escalate to the manager/PM to decide — with your proposal, not dumping the problem empty-handed.
5. **Update progress:** when things change, warn early (early warning) instead of waiting until near the deadline.

### Sample answer (Java dev 4–6 years)
> "One morning I received at the same time: (1) a payment bug causing intermittent errors for a group of users, (2) PM needing a new API for a demo tomorrow afternoon, (3) another team asking me to review an integration. I quickly asked each side: bug (1) affects real transactions and needs a hotfix; demo (2) can use mock data if the full API is not ready; (3) does not block their release today.
> I proposed: priority (1) first because of production risk, ~3 hours; for (2) I would deliver a minimal API version (endpoint + sample data) that day and promise the full part after the demo; for (3) I would schedule 30 minutes the next morning. I confirmed the order and reasons on the shared channel so all sides saw them. Result: hotfix done before noon, demo ran, and no side was surprised."

### Common mistakes
- **Taking everything and saying nothing:** leads to multiple delays and lost trust.
- **Prioritising by loudest voice:** ignoring real risk.
- **Not clarifying:** "urgent" without knowing deadline/impact → wrong priority.
- **Not confirming in writing:** later each side remembers differently.
- **Trying to do it all alone when escalation is needed:** seniors know when to escalate to a decision-maker.

> Senior tip: in your answer, mention a sentence like "I will confirm the priority order again via a short message/email". This small detail shows you manage communication risk — a common source of incidents in multi-stakeholder environments.`,
    follow: [
      'If your direct manager and PM give conflicting priorities, what do you do?',
      'How do you say "no" or "not yet" while keeping a cooperative relationship?',
      'What tool/method do you use to track work in progress and avoid dropping tasks?'
    ],
  },
  'behavioral-036': {
    q: 'Tell me about a time you led (lead) a project or a technical effort to solve an important problem. How did you organise the work, make decisions, and measure results?',
    a: `**Summary:** For senior/lead roles, the interviewer wants to see that you not only code well but also **identify the right problem, organise people and work, make decisions with trade-offs, manage risk, and measure results**. A strong answer uses STAR but emphasises the **T (lead scope)** and **A (how you coordinated/decided)**, not just personal technical skill.

### What the interviewer wants to hear
- **Lead scope:** what did you lead — 2 people for 2 weeks, or a cross-team initiative? Clear scope so they assess the right level.
- **What problem you solved:** the root problem, not just symptoms. E.g. "slow releases" → root cause is process/lack of automation/lack of ownership?
- **How you organised:** task breakdown, milestones, roles, communication channels, tracking.
- **How you decided:** when choosing, what data/criteria? Who participated in the decision?
- **Results and sustainability:** after finishing, were results maintained?

### Extended STAR framework for lead
1. **S:** business/technical problem, impact, constraints (time, manpower).
2. **T:** you were assigned/proposed to lead; measurable goal.
3. **A:**
   - Clarify problem and scope (in/out of scope).
   - Plan: break into milestones, assign by capability, identify dependencies.
   - Coordinate: short meetings, risk updates, unblocking.
   - Technical/process decisions: state options, trade-offs, selection criteria.
   - Quality control: review, test, safe rollout.
4. **R:** before/after numbers, impact, lessons.

### Sample answer (Java dev 5 years, leading an improvement initiative)
> **S:** "My team took an average of 4 days to release a small bug fix because of manual testing and scattered deployment, causing slow response to customers."
> **T:** "I proposed and was assigned to lead a 6-week initiative with 3 people (2 backend, 1 QA) to cut release time without increasing production errors."
> **A:** "First, I aligned the team on a measurable goal: bring lead time (time from merge to running on production) down to under 1 day for small changes. I split the work into 3 milestones: (1) standardise the CI pipeline to run tests automatically, (2) add smoke tests (quick checks of critical flows) after deployment, (3) document the release checklist. I assigned based on strengths: the CI-savvy person took milestone 1, QA and I designed the smoke tests. Daily 10-minute blocker updates; the biggest risk was flaky tests (tests that pass/fail unstably) — I prioritised fixing 5 noisy tests before turning on the gate. When choosing deployment strategy, I compared direct deployment vs canary (gradual rollout to part of traffic); given team size and risk, I chose deployment with fast rollback and smoke tests, not complex canary yet."
> **R:** "After 6 weeks, lead time for small changes dropped from ~4 days to ~6 working hours, and for 2 months there were no incidents from the new release process. Lesson: effective lead means setting a measurable goal and removing risks early — not doing everything yourself."

### Common mistakes
- **Saying "I led" but only telling personal work:** lacks organising/delegating/deciding parts.
- **No measurable goal:** "project successful" without saying how success is measured.
- **Skipping conflicts/dependencies:** real projects always have snags; telling how you unblocked shows lead ability.
- **Taking all credit:** not mentioning team contributions — senior/lead interviewers notice.

> Senior tip: if you have never held the lead title, you can still tell a **situational lead** story (incident, small migration, process improvement). Be honest about scope ("I led part X with 2 people") — accurate beats inflated.`,
    follow: [
      'What was the hardest decision in that project, and whose opinion did you seek before deciding?',
      'If a team member did not finish their part on time, how would you handle it without harming the relationship?',
      'What did you do to keep the initiative\'s results after you left the lead role?'
    ],
  },
  'behavioral-037': {
    q: "If your boss/lead assigns you a task you've never done (new technology, unfamiliar area), how would you approach it?",
    a: `**Summary:** This question tests **fast learning ability, problem-solving thinking, and risk management when inexperienced**. A good answer is neither "I will figure it all out myself" (risky, slow, wrong direction) nor "I can't do it" — but: clarify goal/success criteria → quick survey → break down, do a pilot → get early feedback → document knowledge.

### What the interviewer wants to hear
- **Structured learning:** where do you start (official docs, small examples, experienced people)?
- **Risk management:** do you clarify deadline, scope, and report early if you see you will not make it?
- **Proactive but knows when to ask:** ask the right person, the right question, after trying basics yourself.
- **Communicating expectations:** do you confirm what "done" means?

### 6-step approach
1. **Clarify requirements (before deep learning):** business goal, specific output, deadline, constraints (security, performance), acceptance criteria. Ask: "What is good enough for the first version?"
2. **Quick survey (time-box — time-limited):** spend 1–4 hours reading an overview: core concepts, flow, minimal runnable example. Prioritise official documentation and runnable examples.
3. **Small plan:** break into verification steps (spike/POC — a small experiment to prove the direction). Rough estimate and state risks.
4. **Execute in short feedback loops:** do a small part → run it → get early review/feedback (do not wait until the end to show).
5. **Ask for help prepared:** when asking, bring: what you tried, result/error, your hypothesis. This respects the helper's time.
6. **Wrap up:** record decisions, steps taken, errors encountered, so next time is faster and share with the team.

### Sample answer (Java dev 4–6 years)
> "If I were assigned to implement a part integrating with a message queue (an asynchronous message transfer system, e.g. Kafka/RabbitMQ) that I have never done in practice, I would start by clarifying: what messages need sending/receiving, data loss/latency requirements, and deadline. Then I would spend half a day reading official docs and running a tiny local example: send one message, receive and log it. Next I would propose a 1–2 day POC for a simple flow, with logs and error-checking, and ask the lead for early review. If I hit unclear points about configuration or operations, I would ask a colleague who has used it, bringing what I have already tried. I would also flag early if the estimate looks like it will miss the deadline so we can adjust scope."

### Common mistakes
- **"I will learn everything then do":** sounds diligent but risky — easy to learn the wrong direction.
- **Staying silent when stuck:** only reporting near the deadline that you cannot make it.
- **Asking unprepared:** "help me do it" without saying what you tried.
- **Skipping success criteria:** technically done but does not meet the need.
- **No early feedback:** going far down the wrong path.

### Real-world example
A backend developer was assigned to build a data sync pipeline from PostgreSQL to OpenSearch using CDC (Debezium + Kafka Connect) within 3 weeks — never used either before. Day 1: clarify success criteria (latency under 5 seconds, no lost events on restart) and who in the company has used Kafka Connect. Days 2–3: read official docs, run an example with Docker Compose locally. End of week 1: demo one working table and report risks seen (initial snapshot is slow with a 50-million-row table, need to change replication slot configuration managed by the DBA). Week 2: work with the DBA on the replication slot, add lag monitoring. Week 3: rehearse connector restart, confirm no lost events, write a 2-page operations doc. Finished 2 days late but reported from end of week 1 so no one was surprised; the doc later helped the next person handle a new table in 1 day.

### Interview sample answer
"First I clarify the goal and success criteria, deadline, and what is required versus what can be dropped — without a clear destination, learning any amount can still go the wrong direction. Next I do a quick survey for one or two days: read official docs, run a small example, and ask who in the company has done similar work so I do not repeat their mistakes. Then I break the work into small milestones, build something runnable as early as possible — usually in the first week — to get feedback and expose real risks. I report progress and risks early, even when I see a delay, so the lead has time to adjust scope or add people. Finally I write down what I learned as a short doc for the team. That way I learn fast and do not let inexperience become a project risk."

> Senior tip: in the interview, emphasise "I will time-box the learning and set an early checkpoint". This shows controlled work — very valuable when assigned unfamiliar tasks.`,
    follow: [
      'How do you decide between figuring it out yourself and asking early to avoid wasting time?',
      'If after surveying you find the requirement not feasible within the deadline, how do you negotiate?',
      'How do you document new knowledge so others do not have to learn from scratch?'
    ],
  },
  'behavioral-038': {
    q: 'Have you ever disagreed or had conflict with your direct manager? How did you handle it to keep both respect and protect quality/commitment?',
    a: `**Summary:** Conflict with a manager is more sensitive than peer conflict because of **power and expectation differences**. The interviewer wants to see you stay calm, focus on the issue (not attack personally), use data/impact to discuss, respect the final decision after presenting clearly, and know when to escalate (go to a higher level) professionally.

### What the interviewer wants to hear
- **Respect + frankness:** can you state a different view without confronting attitude?
- **Preparation:** do you bring data, options, risk — or just emotions?
- **Outcome:** how was the issue resolved? how was the working relationship afterwards?
- **Boundaries:** when do you comply with the decision, when do you escalate (e.g. security/legal/ethical risks)?

### Levels of disagreement
| Level | Example | Handling |
|---|---|---|
| Disagree on approach | choose solution A/B | Present trade-offs, propose, accept decision |
| Disagree on priority/deadline | commitment hard to meet | State risk, propose cutting scope/changing date, confirm in writing |
| Serious issue | asked to hide errors, skip security | State risk clearly, refuse the violating part, escalate via proper channel |

### STAR answer framework
1. **S:** context (project, pressure), what the disagreement was (stay neutral, do not assign bad motives).
2. **T:** shared goal (deliver on time, system safety, quality) — show you are on the same side.
3. **A:**
   - Ask for a private 1-on-1, choose a suitable time.
   - Describe the issue with observation/impact: "I am worried if we do X, risk Y (impacting Z)".
   - Give 2–3 options with trade-offs and recommendation.
   - Listen to the manager's constraints (pressure from above, customer commitment).
   - Agree on direction; if still different, ask "what conditions would make us reconsider?" or accept and execute well, while noting the risk.
4. **R:** result, and relationship/cooperation afterwards.

### Sample answer (Java dev 5 years)
> **S:** "My manager wanted to push a large change to production before the end of the week to meet a demo commitment, while I saw that the data migration (upgrading data structure) did not have a clear rollback plan (going back when errors occur)."
> **T:** "Both of us wanted to meet the demo, but I also had to reduce the risk of data disruption."
> **A:** "I asked for a private 1-on-1 and presented the specific risk: if the migration fails midway, recovery could take hours because there is no clear rollback script; I gave data: this part affects a table with millions of rows. I proposed 2 options: (1) demo on a staging environment with production-like data and move migration to early next week with a maintenance window; (2) if production must be done, separate the safe part for the demo and run migration later with a tested rollback script. The manager felt commitment pressure, so I helped draft the message to explain to stakeholders. We agreed on option (1) for the demo and scheduled migration with rollback."
> **R:** "The demo went as planned, and the migration ran safely the following week in 20 minutes. Afterwards, the team added a rollback checklist for data changes. The relationship with my manager remained good because I focused on risk and solution, not emotional opposition."

### Common mistakes
- **Bad-mouthing the manager in the interview:** even if true, it is a risk signal to the hiring company.
- **Telling a "I won" story:** "I proved the boss wrong" — sounds uncooperative.
- **No outcome:** just telling the argument.
- **Avoiding conflict entirely:** saying "I have never disagreed" — hard to believe for a senior role.
- **Not listening to the manager's constraints:** the manager is under pressure you do not see.

> Senior tip: choose a story with a **clear shared goal** (both want the project to succeed). When you tell it as "solving the problem together" rather than "me fighting my boss", the interviewer sees maturity in organisational communication.`,
    follow: [
      'If after discussion the manager still decides the way you think is risky (but not violating ethics/law), what do you do?',
      'Do you discuss disagreement via message or in person/1-on-1? Why?',
      'Have you ever realised you were wrong after challenging your manager? How did you handle it?'
    ],
  },
});
