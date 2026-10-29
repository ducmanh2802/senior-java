/*
 * English translation of js/data/q-soft.js — task T217. Format: js/core/i18n.js (content overlay).
 * ids: behavioral-001 behavioral-002 behavioral-003 behavioral-004 behavioral-005 behavioral-006 behavioral-007 behavioral-008 behavioral-009
 */
App.i18n.content({
  'behavioral-001': {
    q: `Tell me about the most critical production incident you have handled. What did you do, what was the outcome, and what did you change afterward so it would not recur?`,
    a: `**Summary:** This question is not asking "have you ever faced an incident" but evaluating **reflex under pressure, personal ownership, root-cause capability, and post-incident discipline**. A strong answer always has four parts: a specific context, your specific actions, **measurable before/after numbers**, and a process change that was actually adopted (not a promise in the air).

### What the interviewer wants to assess
- **Root-cause analysis mindset**: do you stop at "config error" or trace back to the design / synchronization condition that caused it.
- **Personal role**: did you lead or just follow? Common follow-up: "who decided rollback at that moment, you or the manager?"
- **Communication under pressure**: did you update stakeholders and the whole team, or handle silently alone.
- **Systems thinking**: after the incident, did you change at process / monitoring / architecture level, not just repair what broke.
- **Honesty**: many candidates tell an incident that was entirely someone else’s fault — that is a negative signal.

### STAR framework for this question
- **S — Situation**: system context, scale, time, who was on call, impact severity.
- **T — Task**: your specific role and responsibility during the incident.
- **A — Action**: the sequence of actions in order — **what first, then what**, and what data you used to decide.
- **R — Result**: quantified outcome (SLO, MTTR, affected users) + lasting change.

### Sample answer (prepare your own)
> "The most serious incident I handled directly was last March, on the payment service of an e-commerce platform. At 14:05 during peak traffic, after deploying an updated library and a connection-pool configuration, the 5xx error rate jumped from 0.2% to 38% within 6 minutes, affecting about 12,000 orders over 47 minutes.
> The very first thing I did was **stop deep investigation and cut damage**: rolled back the deploy within 4 minutes, and simultaneously enabled a temporary alert for the failing endpoint so the team focused only on the fire. Once the service stabilized again (total MTTR 41 minutes), only then did I investigate.
> The root cause was not the library itself: the cart-read flow had an N+1 query, six queries per order — code I wrote two months earlier that had never caused issues at normal load; the new config reduced the connection-pool size, so at peak demand connections surged 6x and the pool drained. The lesson was not "avoid library X" but **every resource-config change must come with a safety limit**.
> Afterward I proposed and the team agreed on three things: add a circuit breaker for slow dependencies, move the connection pool to environment-scoped config with limits, and require load testing before any deploy that changes resources. In the following 6 months there was no more P1 incident due to resource exhaustion; average MTTR dropped from 52 minutes to 14 minutes."

### Things to avoid
- **Blaming** others or saying "it was an infra-layer error, not my part" — the interviewer will think you do not take ownership.
- **Long stories without numbers**: "system was slow, the team handled it for a while" has zero value.
- **Describing actions without results**: must have before/after.
`,
    follow: [`What if the incident happened at 2 AM and you were not on call — how did you learn about it?`, `Have you ever had to decide on rollback when real money was at stake? What was your decision criteria?`, `After the incident, what did you do to make sure the postmortem did not become a blame-finding ritual?`]
  }
  ,
'behavioral-002': {
    q: `Have you ever disagreed with a tech lead, architect, or PM? How did you handle it, and what was the outcome?`,
    a: `**Summary:** The interviewer is not asking "have you ever disagreed" but assessing **whether you argue with data and product benefit rather than personal temper**, and most importantly **whether you still commit to the final decision** after discussion. A strong answer shows maturity: I persuaded, or I could not persuade but still executed fully and still proposed a measurement plan.

### What the interviewer wants to assess
- **Influence without authority**: can you persuade the person with decision rights?
- **Argument quality**: do you use numbers, demos, or only emotion?
- **Empathy**: do you understand the other side?
- **Professionalism when losing**: this is the question many candidates answer worst.
- **Specificity**: are there real numbers and outcomes?

### STAR framework for this question
- **S — Situation**: who proposed what, what was the pressure (deadline, client).
- **T — Task**: what you had to do — challenge the decision while keeping the working relationship.
- **A — Action**: how you gathered evidence, proposed alternatives, and presented.
- **R — Result**: what the final decision was, the numbers, whether the relationship stayed good.

### Sample answer
> "There was one very clear case. My tech lead proposed putting all cart data into Redis cache to reduce Postgres load. His reason was fully reasonable: cart queries accounted for 40% of total DB load and were slowing other flows.
> I did not oppose the problem; I opposed **the solution**. I proposed measuring first: build a trial with 5% real traffic over 3 days. Result: cache hit rate was only 18% because cart data changes continuously (cart edited 3–4 times per minute), and serialization time when reading from cache raised the read-flow p99 by 12 ms — meaning total latency barely decreased, while the infra team had to operate an additional Redis cluster. While measuring, I also checked {{pg_stat_statements}} and found 2/3 of cart load came from a query missing an index and an API header that called cart item count on **every** page.
> I presented with exactly this sentence: 'your proposal targets 40% DB load, but with 18% hit rate DB load drops little, latency is almost unchanged, and we add 3 new failure sources including cache staleness'. The tech lead agreed to stop, and the team chose a second direction: add a composite index for that query and return the cart item count in the cart response itself instead of a separate call. Result after 2 weeks: total DB load dropped about 28% **without** new infrastructure, cart API p99 dropped from 380 ms to 210 ms. The tech lead later invited me to review subsequent cache proposals together.
> What I learned: if I had only said 'this approach is not good', the meeting would end with him still doing what he wanted. Evidence is what turns disagreement into a shared decision."

### Preparing a "losing" story
A good interviewer will follow up: "have you ever failed to persuade?" Short example: "I wanted to extract payment into a separate service; the architect wanted to keep it in the monolith for two more quarters because the team only had 4 people. I presented my case, he kept his decision. I recorded the rationale and the condition for revisiting (when blocked deploys due to other modules exceed 2/month) in an ADR, then did my assigned work in the monolith to the best of my ability, including writing package boundaries to make future extraction easy. Six months later that condition was met, and extraction took 3 weeks instead of the estimated 2 months because boundaries were already in place." This is **disagree and commit**: argue clearly, then commit fully, and leave a way to measure for a revisit.

### Things to avoid
- **Stories without evidence**: "I think that will be slow" — have numbers or say clearly how you measured.
- **Personal attack or saying "my manager was wrong"**: even if right, the tone decides the outcome.
- **Putting yourself above others**: "I warned you" is the answer of someone who does not know how to take responsibility.
- **Stories ending at "I won"**: the interviewer wants to know how you handle **both winning and losing**.
- **Ignoring the human side**: a disagreement story without details on how you protected the working relationship will lack conviction.

> Senior tip: prepare **two versions** of the same event: one for a senior role and one for a lead role. At senior level, you focus on **clarifying the issue and presenting evidence**; at lead level, you focus on **presenting trade-offs with opportunity cost and making the call when consensus is impossible**. Same event, completely different expectations.

`,
    follow: [`Have you ever **failed** to persuade someone? How did you handle that?`, `With a PM, what is the difference between opposing a solution and opposing the goal?`, `If the final decision went against you and then an incident occurred, how did you handle it?`]
  }
  ,
  'behavioral-003': {
    q: `How have you mentored a junior? Specifically, what did you do to help them improve, and how did you measure that?`,
    a: `**Summary:** The interviewer wants to see whether you have **the ability to replicate your own capability** — this is the core criterion to move from senior to lead / tech lead. A strong answer does not tell a story "I often reviewed code for them," but tells a **system with schedule, measurement, and results**.

### What the interviewer wants to assess
- **Systematic method**: is it planned or just "help when asked"?
- **Ability to explain**: do you explain **why** rather than just giving answers?
- **Capability analysis**: do you find the right weakness, or just teach by habit?
- **Measurement ability**: mentoring without measurement is unmanageable.
- **Patience and mindset** — do you treat teaching as part of the job rather than a side task?

### STAR framework for this question
- **S — Situation**: who was mentored, team context, specific weakness.
- **T — Task**: your goal — not "teach code" but a specific skill.
- **A — Action**: the concrete activities you organized and how you measured.
- **R — Result**: change metrics and evidence that capability grew.

### Sample answer
> "Last year I mentored an engineer with 8 months of experience, assigned to a payment module. The problem was not knowledge — they could write code — but **they were not confident finding issues in their own code**, and PRs often needed 2–3 revision rounds.
> I did not start by teaching Java or frameworks. I did three things: (1) set a concrete goal of "be able to self-review PRs before sending," (2) play **reverse review**: each week I sent back their PR with **the count** of issues I found (not just the spots), so they could find them themselves and compare — if I just fixed directly, they would only learn "this line was fixed," not how to find; (3) each month two 1-on-1 meetings, where I asked only one question: "this month, what did you catch by yourself that you did not catch before?" The answer to that question was the progress metric.
> After 5 months: average PR revision rounds dropped from 2.8 to 1.1; my review time for them dropped from an average of 2 days to 4 hours; and they could independently write 4 new modules without me pre-checking. After that they were transferred to lead a small group of 3 people.
> The lesson I drew: mentoring is not talking a lot, but **designing so the learner creates their own feedback**; I play the role of asking questions and providing feedback at the right time."

### Things to avoid
- **Unverifiable numbers**: "I mentored 5 people, they all became senior" — interviewer will ask specifically.
- **Mentoring by "doing for them"**: the learner will not improve and you become a bottleneck.
- **Teaching only knowledge, not working method**: a good engineer who does not prioritize, estimate, or communicate will still not advance.
`,
    follow: [`How do you measure mentoring effectiveness beyond subjective feeling?`, `How do you mentor someone with a different personality (e.g., introverted, prefers working alone)?`, `Have you ever had to tell someone they were not a fit for the role? How did you handle it?`]
  }
  ,
  'behavioral-004': {
    q: `Tell me about a technical decision of yours that was wrong, and what you learned from it. What did you do to prevent it from recurring?`,
    a: `**Summary:** This question measures **intelligence and learning ability**, not technical skill. A good answer admits a **specific error with numbers**, points out the **link between the wrong decision and measurable impact**, and describes a **process mechanism that was adopted to prevent recurrence**. Answering "I have never been wrong" is the worst answer.

### What the interviewer wants to assess
- **Humility and honesty**: can you recognize your own limits?
- **Self-error analysis**: can you trace which layer of the process failed?
- **Systems thinking**: do you fix personally or fix so the whole team does not repeat?
- **No blame**: taking responsibility + solution is the behavior of a trustworthy person.
- **Maturity level**: one well-handled error at senior level is stronger evidence than many junior-level errors.

### STAR framework for this question
- **S — Situation**: decision context, constraints at the time, what information you had / did not have.
- **T — Task**: what decision you made and what you believed at the time.
- **A — Action**: what happened, how you handled it, and how deeply you traced the process gap.
- **R — Result**: actual damage, how you recovered, and the prevention mechanism adopted (possibly after the fact).

### Sample answer
> "My clearest wrong decision was moving inventory-check flow to read from a Postgres read replica. At the time it sounded very reasonable: inventory is written heavily and read heavily, and we had DB-read pressure at the peak. I also checked data: 80% of queries were reads.
> What I **did not** check was replication lag at exactly the peak time. At normal load lag was 200–300 ms, so everything passed tests. But during a large sale, when writes surged, lag reached 4 seconds. The result: the system sold out of stock — oversell rate hit 0.7%, requiring refunds for 1,900 orders.
> After the incident I fixed by reading inventory from primary with true read consistency, or accepting oversell and compensating with reserve inventory — depending on business. But more importantly I identified the gap in my own process: my architecture decision was **based only on average-load data**, and there was no question forcing me to consider behavior under variable load.
> From then on I proposed and the team adopted two things: every infrastructure decision must include a "behavior under surge load" section in the design doc, and load testing is required before moving a feature to the main path. Since then I have never made a decision without corresponding load data."

### Things to avoid
- **Choosing too small an error**: "I forgot to import a class" makes the answer thin.
- **Choosing too large / dramatic an error**: telling a sensational incident that you actually only heard about — easy to drill down.
- **Ending with "the lesson is to be more careful"**: this has no value; say clearly how you **changed the process**.
`,
    follow: [`How do you distinguish a wrong decision from a correct decision that was lucky?`, `Do you use Architecture Decision Records (ADR)? How did they help with this?`, `How long do you consider a wrong decision acceptable before accepting it?`]
  }
  ,
  'behavioral-005': {
    q: `How do you estimate work when the deadline is tight? When scope does not fit, how do you negotiate with the PM?`,
    a: `**Summary:** The interviewer wants to know whether you **negotiate instead of "agreeing just to please"**. A strong answer shows three things: estimation **with basis and uncertainty points**, a **structured scope-cut option** (not "just finish it"), and being **transparent about risk from the start** rather than when nearly overdue.

### What the interviewer wants to assess
- **Breakdown and estimation skill**: do you split work, evaluate risk, not just provide a random number?
- **Negotiation mindset**: do you defend technical quality without becoming a progress blocker?
- **Early risk honesty**: reporting early is a skill; hiding and reporting late is a failure.
- **Business understanding**: do you know the trade-off between "enough features" and "good experience"?
- **Communication with non-technical PM**: explain risk in business language.

### STAR framework for this question
- **S — Situation**: deadline source (client, event, commitment), pressure level.
- **T — Task**: what was assigned, what your initial estimate was.
- **A — Action**: how you broke it down, proposed scope cuts, discussed with the PM.
- **R — Result**: what was delivered, what risk remained, lessons on estimation.

### Sample answer
> "A typical case: the PM committed to a client for a 'consolidated report export' feature before the mid-month meeting — about 12 days. When I received the work, the backlog had 3 related items totaling 21 points — more than 2 engineers could do in 10 working days.
> I did three things. First: break each item into small tasks to expose uncertainty — the hardest part was not file export, but **defining which report each role could see**, and that required the client to answer. Second: measure actual team speed using previous sprint data (average velocity of 2 people about 13 points per 2 weeks) instead of intuition. Third: meet the PM **before** hard commitment, presenting 3 options.
> The option I proposed and that was chosen: deliver **one** report only for the manager role, using an existing filter from the old reporting system instead of building a new aggregate; and push detailed reporting to the next sprint with a clear milestone in the release note. I committed to 13/21 points before the deadline, 8 points with clear milestones. Most importantly, I proposed pinning a midpoint milestone with the client to review.
> Result: delivered 13/21 points on time, no P1 incident, the client could use it immediately, and no unexpected requests appeared. Lesson: when the deadline is tight, what needs negotiation is not time but **scope and priority order**, and that must happen at the start of the cycle, not when already near overdue."

### Things to avoid
- **Committing without knowing**: "just assign it, I can do it" — this is the fastest way to lose trust.
- **Estimating by intuition** then hard-committing: no basis to defend the number.
- **Not reporting risk early**: reporting risk on the last day is almost always worse than reporting early.
`,
    follow: [`Do you use story points, and do they really help?`, `When the PM does not agree to cut scope, what options do you have besides overworking?`, `Have your estimates ever been way off? How did you calibrate your estimation?`]
  }
  ,
'behavioral-006': {
    q: `Business only wants to ship features, but your team is buried under technical debt. How do you handle this situation?`,
    a: `**Summary:** At the lead level, the key is **valuing technical debt in business units** (money, time, risk), not "code is hard to read." Then you must propose a **fixed resource mechanism** — usually a 20% budget each sprint — so reducing debt becomes a process, not dependent on who has enthusiasm.

### What the interviewer wants to assess
- **Business thinking**: can you translate technical problems into revenue / risk impact?
- **Ability to propose process change**, not just "do more work".
- **Commitment discipline**: do you have the patience to keep the debt budget through many sprints?
- **Honesty**: technical debt always exists; the question is whether you manage it or just complain.
- **Allocation thinking**: know which should be fixed now and which should be recorded and accepted.

### STAR framework for this question
- **S — Situation**: specific debt state and business context (deadline, customer, cost).
- **T — Task**: your task is not "solve all debt" but "prevent debt from continuing to accumulate and reduce the largest risk".
- **A — Action**: how you measured, presented, proposed mechanism.
- **R — Result**: before/after numbers, and whether the process survived after you left.

### Sample answer
> "I once led a 3-year-old service. When I joined, the product backlog proposed adding ~40 story points each sprint, while engineers could only do 25–28 points — meaning every sprint silently turned 12 points into debt.
> I did not propose 'do less feature to pay debt,' because that is an argument PM will reject. I measured first. I took APM and error-log data, and found a very clear link: **revenue reports** accounted for 35% of total system query time, running on a table of 80 million records with 3 sub-queries per load. p95 for this screen was 4.2 seconds; 240 staff used it daily and 30% had to close and reopen the tab.
> I presented to the PM in their language: 'this screen takes 4.2 seconds, 240 users daily, every second of waiting is a sales staff who cannot call a customer.' The specific proposal: dedicate **20% capacity each sprint** to technical debt — about 5–6 points — and commit to providing data after 2 sprints. We fixed by moving reports to a daily-updated aggregate table instead of direct joins.
> After 2 sprints: p95 dropped from 4.2 s to 0.9 s; P1 tickets related to the report screen dropped 70%; and most importantly, **the 20% budget became a team convention**, so when I moved to another role afterward, it still held — the next sprint still dedicated 5 points to debt.
> Lesson: technical debt does not convince anyone with only technical terms, and does not disappear without a fixed capacity budget. Before I joined, the team had tried both ways: requesting more people did not work, and proposing feature cuts was rejected."

### Things to avoid
- **Complaining with technical terms**: "legacy code is hard to maintain" does not change the decision-maker's mind.
- **Giving debt numbers without source**: "still have 5000 lines of technical debt" — no one acts on that number.
- **Only saying 'need more people'**: this makes you sound like you control nothing.
- **Promising 'will clean up later'**: without a concrete budget, debt just gets pushed to the next sprint.
- **Arguing technical principles instead of product goals**: e.g., debating which framework to use.
- **Not stating clearly what you measured** before proposing.

> Senior tip: prepare **one conversion formula** you use to speak about technical debt to non-technical people — e.g., '3.3 seconds excess wait × 240 staff × ~50 report opens per day ≈ 11 staff-hours lost daily'. Show the math so listeners can verify it themselves. One sentence like that persuades better than an entire architecture slide.

`,
    follow: [`How do you value technical debt besides "hours to fix"?`, `If business continuously breaks the 20% agreement, what do you do?`, `Have you ever had to accept technical debt and record it rather than fix it?`]
  }
  ,
'behavioral-007': {
    q: `Tell me about a large project or migration you led from start to finish. What did you do to make it successful?`,
    a: `**Summary:** This question is a test of **leadership at project level**: ability to split work, plan with risk, keep information flowing, and — an often-overlooked factor — **handle when the plan goes wrong**. A strong answer always includes a section on "where the initial plan was wrong and how I corrected it."

### What the interviewer wants to assess
- **Breakdown and planning thinking**: do you have clear completion criteria for each phase?
- **Risk management**: what risks did you identify, prepare for, and which actually happened?
- **Cross-role coordination**: dev, QA, DBA, DevOps, product.
- **Communication**: do you actively report progress and risk?
- **Decision-making with incomplete information**.

### STAR framework for this question
- **S — Situation**: project description, scale, deadline, technical and organizational constraints.
- **T — Task**: which part you were responsible for, who the stakeholders were.
- **A — Action**: how you split phases, handled risk, decided when the plan changed.
- **R — Result**: quantified result, and which parts did not reach the goal.

### Sample answer
> "Last year I led splitting a monolith order service (~400,000 lines) into 4 services. The biggest constraint: **no downtime allowed**, and the system was running during sale season with traffic 8x normal.
> I began by **clarifying the goal before planning**: not 'split everything,' but 'split the most painful part and reduce release risk.' I proposed starting with the report module because it was independent, had few users, but was causing pain. Then I divided into 5 phases with completion criteria expressed in numbers: measure what, shift what percentage of traffic, and under what conditions to roll back.
> Three risks I anticipated and prepared for: (1) shared data across modules → solved with **dual-write with on/off flags and backfill process**; (2) deploy during sale season → locked deployment windows before sale season, with feature flags to disable; (3) team unfamiliar with the new service → I spent the first 2 weeks on **training and writing runbooks**, not asking anyone to write production code before understanding the old system.
> The initial plan was **wrong in one place**: I estimated data synchronization history backfill at 3 days, but it actually took 11 days due to data type inconsistencies from multiple sources. When discovered, I stopped the backfill phase, proposed a new option: only backfill the last 6 months and keep old data in the monolith, reading via API when needed. This delayed that phase by about 1 week, but still stayed within the buffer, so the launch milestone was preserved.
> Result: 4 services split and running in production, **zero downtime** throughout, endpoint count in monolith dropped from 210 to 47, deployment time for a small change dropped from 25 minutes to 4 minutes. Not fully achieved: payment module was not split — it remains in the monolith and is a recorded debt with the reason and risk assessment."

### Things to avoid
- **Using "I" for everything**: you need to clearly state your part and the team's part; interviewer wants to know you led, not that you did everything.
- **Only describing the plan, no results**: need before/after numbers.
- **Hiding the failure part**: a 100% perfect story makes interviewers suspicious; the part "plan was wrong and how I fixed it" is actually the most convincing.
- **Not mentioning risk and people**: if there's nothing about how you handled risk, the answer lacks the depth expected of a lead role.
- **Throwing numbers without source**: "300% performance increase" without saying how it was measured will get challenged.

> Senior tip: prepare the story in **a 3-part slide structure**: goals and constraints, phased plan with risks, and results with the unmet parts. A structured story makes you sound like you are **managing**, not just storytelling — and that is exactly what they are looking for in a lead candidate.

`,
    follow: [`How do you estimate work when a project has unclear parts?`, `If a team member opposes your plan, how do you handle it?`, `Have you ever had to stop a project midway, and what was the basis for that decision?`]
  }
  ,
  'behavioral-008': {
    q: `How do you work with non-technical stakeholders (business, CS, operations)? Give a concrete example.`,
    a: `**Summary:** The interviewer wants to know whether you can **translate technical requirements into business value**. At senior level, you are expected to **find the right question before anyone asks**, and use data to discuss instead of technical jargon.

### What the interviewer wants to assess
- **Translation skill**: can you explain technical issues without technical words?
- **Understanding the goal before the solution**: do you ask "what is the business problem" first?
- **Trade-off thinking**: do you present choices with cost and time trade-offs?
- **Interest in real users**: do you go to the customer / CS side to understand?
- **Risk communication**: say clearly what is uncertain while still providing a choice.

### STAR framework for this question
- **S — Situation**: who made the request, what they care about, time constraints.
- **T — Task**: what you need to do is understand the real problem, not just do exactly as requested.
- **A — Action**: what you asked, measured, proposed, and how you presented choices.
- **R — Result**: did the result meet their expectations, and what were the numbers?

### Sample answer
> "A very typical example: the customer care team reported that "customers do not see order status updates in time." Initially the request was understood as "need real-time within 5 seconds." If I jumped in and proposed a real-time architecture, it would take months and not solve the right problem.
> Before doing anything I did three things. First: ask back — "what do customers wait for, and how long do they wait?" Answer: customers call to ask status because they get no notification; 80% of orders update within 2 minutes, and orders that take longer than 5 minutes are special cases (exchange, pending verification). Second: observe reality — read logs and ask 5 customers who were calling — and discover the problem is not latency but **lack of proactive notification**. Third: report back with data: "we do not need 5-second real-time; we need notification within 30 seconds."
> I proposed 2 phases: Phase 1 in this sprint — send notifications via Zalo ZNS / email when order status changes, handling time 1–2 days, reducing 60% of status-check calls; Phase 2 later, if data shows real need, then build real-time via WebSocket.
> After 3 weeks: status-check calls dropped 58%, CS team saved about 120 hours per week, and **no** real-time infrastructure investment was made. The original request of CS was not met literally, but their problem was solved — and that is what I told them clearly from the start."

### Things to avoid
- **Answering with technical terms**: "we will use WebSocket and Kafka" — non-technical people hear only noise.
- **Jumping to the solution before understanding the problem**: this is the most common error and the reason many features are deleted after being built.
- **Promising "real-time" for everything** then not delivering on time: loses trust.
`,
    follow: [`Have you ever had to say "no" to a business request? How did you say it?`, `How do you know the real priority of a request when everyone says "urgent"?`, `What tools or rituals do you use to track whether a stakeholder request is handled?`]
  }
  ,
  'behavioral-009': {
    q: `Why do you want to move up to senior / lead? What is your weakness, and what are you doing to improve it?`,
    a: `**Summary:** This question asks **self-awareness level**. A good answer has three conditions: the reason for promotion must be **specific and tied to real contribution**, the weakness must be **real** (not a fake weakness), and there must be **concrete actions with evidence of progress**.

### What the interviewer wants to assess
- **Sustainable motivation**: do you want to move up for salary, or for work with different value?
- **Self-awareness**: can you see your real weakness?
- **Improvement ability**: do you know how to fix it, or just complain?
- **Consistency**: does the promotion reason match behaviors in your CV?
- **Maturity**: the chosen weakness should be truly relevant to the target position.

### STAR framework (mapped)
- **S — Situation**: where you are now, what real contribution you have made, and what makes you feel change is needed.
- **T — Task**: your goal for this position (skills, influence scope, problem type).
- **A — Action**: what concrete actions you have taken toward the goal.
- **R — Result**: quantitative evidence of how you have changed.
- **Weakness**: observed behavior → consequence → fix action → progress evidence.
- **Reverse question**: what feedback do you want from me about this?

### Sample answer
> "Reason: for three years I was a senior in an 8-person team, and most of my work was incident handling and review. I realized I enjoy most the moment of **designing so an incident does not happen** — for example, when I introduced retry with jitter and circuit breaker, timeout errors dropped significantly. I want to move to lead because I want to **replicate** that: help the whole team have good design standards instead of only my own contribution. I also like working with stakeholders and leading technical decisions — that is why I applied for this role, not a senior role elsewhere.
> Weakness: what I need to improve is **risk assessment when planning**. Before I often committed time based on my own estimates without considering external dependencies, and once a plan slipped 3 weeks because another team was busy.
> How I fix: since then every plan I make includes a "risks and assumptions" section with at least 3 clearly written assumptions, and I send the plan early to owners of dependent teams so they can respond before I commit to the client. In the last 4 sprints I have planned 6 projects and **no project has missed its milestone** — previously about 1 in 3 slipped.
> I also want to hear your opinion: from your observation, which weakness of mine would most affect whether I can take on this role?"

### Things to avoid
- **Fake weakness**: "I work too hard," "I am too perfectionist" — no one believes it and interviewers have heard it too many times.
`,
    follow: [`What do you think would make you fail in this role?`, `If after 6 months I evaluate that you have not met expectations, what do you want me to tell you?`, `Have you ever been rejected for a position? What did you do differently afterward?`]
  }
});