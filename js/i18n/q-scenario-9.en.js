App.i18n.content({
  'scenario-081': {
    q: 'A 1-year experience engineer runs {{CREATE INDEX}} on an {{orders}} table with 80 million rows at 10 AM, locking the table for writes for 40 minutes, preventing any orders. The manager wants a postmortem "clearly stating who did wrong to learn from it". How do you write a non-blameworthy postmortem and what do you say to the manager?',
    a: `**Summary:** blameless postmortem **does not mean no one is responsible**; it means asking "**what system allowed** a routine operation to cause a 40-minute outage?" instead of "who messed up?". Practical reason: when named, people hide information, and next time someone else will make the same mistake because the system hasn't changed. The postmortem includes: summary, impact with metrics, timeline, root cause and contributing factors, what went well, and **action items with owners and deadlines**. To the manager, I pivot the goal from "learning" to "**preventing it from happening again**", which is a system issue.

### Understand quickly
If a nurse injects the wrong medicine because two bottles have identical labels, firing the nurse doesn't make the hospital safer; changing the labels does. Aviation and medicine learned this early: punishing individuals makes incident reports disappear.

### Understand technique before writing
On PostgreSQL, {{CREATE INDEX}} usually takes a **write lock (INSERT/UPDATE/DELETE)** (reads still allowed) throughout the index build time; 80 million rows take 40 minutes. {{CREATE INDEX CONCURRENTLY}} doesn't block writes but is slower, cannot run in a transaction, and if it fails, it leaves an INVALID index that needs cleaning. Nothing in the process told the engineer this.

### Postmortem structure
~~~text
1. Summary: 10:02-10:43, order creation failed due to DDL lock on orders table.
2. Impact: ~3,100 failed orders, estimated 1.2 billion VND in delayed/lost revenue, 420 customer support tickets.
3. Timeline: 09:58 PR #1842 merged | 10:02 Flyway ran on deploy | 10:05 order creation error alert
   | 10:21 identified lock on orders | 10:43 index complete, auto-recovered.
4. Root cause and contributing factors (see below).
5. What went well: alert fired after 3 minutes; CS was informed at 10:12.
6. What went poorly / lucky: no safe way to cancel while running.
7. Action items: task, owner, deadline, ticket.
~~~

### Rewriting blame into system-oriented sentences
| Blame | Blameless |
|---|---|
| "An ran the migration wrong." | "Migration creating index without CONCURRENTLY was run automatically during peak hours." |
| "Reviewer didn't read carefully." | "Review checklist has no item about table locking; CI didn't detect locking commands on large tables." |
| "An lacks experience." | "DDL locking knowledge is only in the heads of 2 people; no documentation or inspection tools." |

### Contributing factors (always more than one)
1. Flyway ran migration during deploy, no separation for dangerous migrations.
2. No {{lock_timeout}}: if {{SET lock_timeout = '5s'}} was set, the migration would self-cancel instead of blocking for 40 minutes.
3. CI lacks linter for migrations (e.g., warning against CREATE INDEX without CONCURRENTLY on large tables).
4. Staging has 50 thousand rows, migration ran in 1 second so no one saw the risk.
5. Deployed at 10 AM peak hour.

### Good vs bad action items
- Bad: "Be more careful when writing migrations." (not measurable, no owner)
- Good: "Add migration check in CI to block CREATE INDEX without CONCURRENTLY, ALTER TABLE changing column types; owner: Huy; deadline: 15/11."
- Good: "Default lock_timeout 5s for user running migrations; owner: Lan; deadline: 08/11."

### Speaking to the manager: script
"I understand you want to ensure this doesn't happen again, and I do too. If the postmortem names An, next time the person who makes the mistake will remain silent for 20 minutes before reporting, and the incident will be longer. More importantly: anyone on the team could have run this exact migration, because nothing stops them. I propose the postmortem focus on 4 system changes, with owners and deadlines, and I will be responsible for tracking them. Regarding An's personal development, I will discuss it separately, not in the incident document."
Accountability remains: belongs to the **action item owner** and to you, the lead.

### Common mistakes
1. Postmortem has only one cause ("human error").
2. Action items have no owner/deadline, 3 months later no one has done them.
3. Postmortem meeting is like a trial; people involved are silent.
4. Not shared widely: other teams repeat the exact same mistake.

### 1-minute oral answer
"Blameless doesn't mean no one is responsible, it means asking what system allowed a routine operation to cause a 40-minute outage. There are at least four factors here: migration ran automatically during peak deploy, no lock_timeout, CI didn't check locking commands, staging was too small to see the risk. The postmortem includes impact with metrics, timeline, contributing factors, what went well, and action items with owners and deadlines. To the manager, I explain naming someone makes people hide errors, and anyone could have made this mistake; responsibility lies with the action item owner and me."

> Senior tip: I measure the quality of a blameless postmortem culture by the **rate of action items completed on time** and by the fact that the person who caused the incident **voluntarily** writes or presents it. When a junior stands up and tells "what I did and why I thought it was right at the time", that team is learning faster than any other team.`,
    follow: [
      "If a person repeats the same mistake after measures have been taken, how do you handle it differently?",
      "Why can '5 Whys' lead to wrong conclusions, and what do you supplement it with?",
      "How do you track that action items after a postmortem are actually done?"
    ]
  },
  'scenario-082': {
    q: 'Two seniors in your team have been arguing for 3 weeks about the refund flow design: one wants event-driven via Kafka, the other wants REST sync with outbox. PR has 60 comments, other members are waiting, sprint is delayed. You are the lead, how do you handle it?',
    a: `**Summary:** the problem is no longer technical but **lack of a decision-making mechanism**. I: (1) pull the debate out of the PR; (2) determine the type of decision (easy or hard to reverse) to know how much to invest; (3) agree on **criteria first, method later**, write as a short ADR; (4) if data is missing, make a time-boxed spike with measurement criteria; (5) clarify **who decides** and the deadline; (6) after the decision, "disagree and commit", record conditions to review later. In parallel, talk to each person individually.

### Understand quickly
Two good chefs arguing whether to steam or grill a dish; the kitchen waits. The head chef doesn't need to be better than both, just ask "what do customers need, in how long, what does the kitchen have", then decide, and commit to being responsible for that decision.

### Step 1: stop debating on PR
PR is for reviewing **code**, not for architecture decisions. 60 text comments is the worst channel for disagreement: loss of tone, everyone wants to win in front of the audience.
Script: "You both have good arguments. I'm stopping the discussion on the PR. On Thursday I have a 45-minute meeting, each of you writes 1 page using the same template before the meeting. At the end, there will be a decision."

### Step 2: decision type
| Type | Example | How to decide |
|---|---|---|
| Easy reverse (two-way door) | class name, internal library | person doing it decides, quick |
| Hard reverse (one-way door) | sync vs async for money flow, public event schema | ADR, criteria, spike if needed |
The refund flow is hard to reverse (impacts reconciliation, other teams consuming events), so it's worth 1–2 days of analysis, **not 3 weeks**.

### Step 3: criteria first, method later
Ask both to agree on criteria and weights **before** scoring methods; this step resolves most disagreements, because usually two people are optimizing for different things.
| Criteria (weight) | Kafka event-driven | REST + outbox |
|---|---|---|
| Correct money, no loss/dup (3) | 2 | 3 |
| Customer sees result immediately (2) | 1 | 3 |
| Other teams need to listen to refund events (2) | 3 | 2 (outbox still emits event) |
| Team operational capability (2) | 1 (Kafka not used in this team yet) | 3 |
| Total | 15 | 23 |
The table doesn't decide for you, but exposes where the real disagreement is.

### Step 4: if missing data, do a spike
"We don't know if the platform's Kafka cluster meets the 99.95% SLA. Minh has 3 days to measure, criteria is X; the result decides column 4."

### Step 5: who decides, and disagree and commit
- Make it clear from the start: "If we don't agree after the meeting, I will decide, because I'm responsible for this design."
- Record ADR: context, options, decision, consequences, **conditions for review** (e.g., when 3 more consumers need refund events, re-evaluate).
- To the "loser": "Your method isn't wrong; given current criteria, the other is more suitable. I've recorded review conditions in the ADR. I need you to help make the chosen method successful, and you review the outbox part because you understand the risk of losing events best."

### Step 6: speak individually
3-week arguments often have reasons beyond technical: want recognition, fear evaluation, want to learn new tech. Ask individually: "For you, what's most important in this design?" The answer helps you assign appropriate work (e.g., the person wanting Kafka can lead the POC for another less risky flow).

### Common mistakes
1. Letting the debate "die on its own": it doesn't die, it just becomes implicit.
2. Lead picks a side too early, without letting each side present.
3. Majority vote for hard technical decisions: the majority doesn't bear the responsibility.
4. Decide without recording; 6 months later re-arguing from scratch.

### 1-minute oral answer
"Three weeks of argument means a lack of decision-making mechanism, not a lack of ideas. I pull the argument out of the PR, schedule a meeting with a deadline, and make it clear if there's no consensus, I'll decide. The refund flow is a one-way door so it deserves analysis, but in days, not weeks. I have both sides agree on criteria and weights first, then score methods; missing data means a time-boxed spike. Once decided, record it in an ADR with review conditions, demand disagree and commit, and speak privately with the person not chosen to keep them motivated."`,
    follow: [
      "If you are one of the two sides arguing, how do you ensure fairness?",
      "What should an ADR contain, and where to store it so the team actually reads it?",
      "What do you do if the person not chosen continues to silently make the chosen method difficult?"
    ]
  },
  'scenario-083': {
    q: '6 weeks left until the launch of the installment payment feature, date promised to bank partners and marketing already running ads. Team of 5 has finished ~55% of work; at current speed, the rest needs 10 weeks. PM says "try to work overtime to make it". How do you handle it?',
    a: `**Summary:** report bad news **early, with data, with options**: build forecast from actual speed (not optimistic estimates), offer 3–4 choices with clear trade-offs (cut scope, move date, phased launch behind feature flag, add limited manpower), propose one option and let the decision-maker decide. Usually, the answer is **keep the date, cut scope** following MoSCoW: keep the "slice" that completes the core business flow, move the rest to phase 2. Don't accept "working overtime" as a plan, and don't cut quality (test, security, reconciliation) for money-related features.

### Understand quickly
Car 60 km from airport, plane takes off in 30 minutes, car runs at 60 km/h. "Try running faster" isn't a plan. Real options: change flights (move date), leave luggage to go by motorbike (cut scope), or send most important people first (phased launch).

### Step 1: data, not emotions
~~~text
Speed of last 4 sprints: 18, 22, 19, 21 points / 2 weeks -> avg ~20
Remaining: 100 points (includes average 10% overflow per sprint)
6 weeks = 3 sprints -> capacity ~60 points
Missing ~40 points, ~4 weeks
~~~
Overtime: 2 weeks can be 10–20% faster, after that errors increase, people tire, speed **decreases**. Adding people: per Brooks' Law, adding people in the final stage usually slows things down due to guidance and coordination; only effective if they know the codebase and get isolated work.

### Step 2: list scope by MoSCoW
| Category | Level | Note |
|---|---|---|
| Register installment 3/6/12 months, 1 bank partner | Must | contractual commitment |
| Reconciliation, refund, audit log | Must | money-related, don't cut |
| Installment 24 months | Should | few customers choose (~5% market data) |
| Admin page to self-configure fees | Could | temporarily config by file/DB, ops supports |
| Notification of due date via app | Could | use existing SMS in phase 1 |
| 2nd bank partner | Won't (phase 1) | |

### Step 3: options to present
| Option | Date | Scope | Risk |
|---|---|---|---|
| A. Keep date, cut Should/Could | on time | core flow complete | phase 2 in 4–5 weeks |
| B. Move 4 weeks | late | complete | breach partner commitment, ad spend |
| C. Keep date, keep scope, overtime | "on time" | complete | low quality on money features, outage risk |
| D. Launch for 10% customers behind feature flag, roll out gradually | on time | core flow | need marketing alignment |
Proposal: A combined with D.

### Script to talk to PM
"I want to report early so we have options. According to the last 4 sprints' speed, with current scope the team needs about 10 weeks, we have 6. Overtime only partially offsets and increases risk of errors in money flows. I have 4 options, I propose keeping the date, launching installment 3/6/12 months with one partner, full reconciliation; 24-month installment and admin page move to phase 2 in 4–5 weeks. You need to decide by Friday so the team can focus. I will update the forecast weekly."
If PM still forces: "I understand the pressure. If keeping the whole scope, I need to record the risk in writing and together we report upwards, because with money features, post-launch errors are more expensive than being a few weeks late."

### After decision
- Update plan and **clearly inform what is missing** in phase 1 for marketing, CS, partners.
- Hide unfinished parts behind a feature flag instead of long-lived branches.
- Track forecast weekly; if speed changes, report again, don't wait for the last week.

### Common mistakes
1. Report late in the last week: no choice left but to be late.
2. Bringing a problem without options, or options without a proposal.
3. Cutting test, review, reconciliation to stay on time: debt paid by production outages.
4. Promising "try" to avoid a difficult conversation.

### 1-minute oral answer
"I report early with data: actual speed of 4 sprints, remaining work, forecast missing weeks. Overtime is not a plan, adding people in final stage usually slows down. I rank scope by MoSCoW, keep reconciliation and security because they are money features, then present 3–4 options with trade-offs and a proposal, usually to keep the date, move Should/Could to phase 2, and open gradually by feature flag. The decision-maker decides; if they choose keeping whole scope, I record the risk in writing. Then update forecast weekly."

> Senior tip: I don't wait until late to talk about scope. From the beginning of the project, I agree with the PM on the list of Musts and the order of cutting; when data worsens, the conversation is just "activating the pre-agreed plan" instead of a tense negotiation.`,
    follow: [
      "How do you estimate and forecast completion dates when the team is new, without speed data?",
      "If leadership forces keeping both the date and scope, what do you do?",
      "How to keep team morale when having to cut work they have already started?"
    ]
  },
  'scenario-084': {
    q: 'Team gets 2 new engineers on a 400k lines legacy monolith (Spring 4, Java 8, ~15% test coverage, almost no docs). Two previous ones took over 3 months to have their first significant PR, one has resigned. How do you design onboarding?',
    a: `**Summary:** treat onboarding as a **product with metrics** (time to first PR, to 10th PR, to first on-call). Four pillars: (1) environment runnable in **one day** with one command; (2) minimal system map: context/container diagram, one request traversing the system, business glossary; (3) **real tiny tasks from week one** with buddy and pair programming, increasing difficulty; (4) newcomers **update documentation** when they find mistakes, so documentation improves with each onboarding round. With code lacking tests, teach them to write **characterization tests** before changing.

### Understand quickly
Dropping a newcomer into a strange city without a map, saying "just walk around and you'll get used to it", in 3 months they only know a few streets. Give a map of the center, a guide walking one main route, then assign tasks in side routes, they get around in a few weeks.

### Why 3 months
- Takes 1–2 weeks just to run the app (scattered configs, shared DB dependencies).
- Doesn't know where to start reading in 400k lines.
- Afraid to change because no tests: fix one, break another.
- No one assigned responsible for guidance; everyone is busy.

### Weekly plan
| Time | Goal | Measurable output |
|---|---|---|
| Days 1–2 | run app and tests local | {{docker compose up}} + a script, app runs with sample data |
| Week 1 | understand map | walk with buddy through "place order" request from controller to DB; first PR (fix log, add test) |
| Weeks 2–4 | real tiny tasks | 3–5 small bug PRs in one module, pair 2 sessions/week |
| Month 2 | moderate feature | one feature with short design, reviewed carefully |
| Month 3 | autonomous | on-call with old member (shadow), then reverse roles (reverse shadow) |

### Minimal documentation, not exhaustive documentation
- **Context and container diagrams** (C4 model): who does the system talk to, what blocks does it consist of.
- "Where does a request go": request flow through what classes/tables.
- Business glossary: "contract", "term", "settlement" in code named what.
- List of "danger zones": which modules have least tests, touching them requires asking whom.
- Rule: **newcomers update docs right when they see errors**, that's the ideal first PR.

### Safety techniques when changing legacy code
~~~java
// Characterization test: record CURRENT behavior (even strange behavior) before changing
@Test
void feeCalculation_currentBehavior() {
    FeeCalculator calc = new FeeCalculator();
    // Expected result taken from actual run, not specification
    assertEquals(new BigDecimal("15000"), calc.fee(new BigDecimal("1000000"), 3));
    assertEquals(new BigDecimal("0"), calc.fee(BigDecimal.ZERO, 3)); // existing edge behavior
}
// After having this test grid, newcomer refactors/fixes bug knowing immediately if they break behavior
~~~

### Buddy role
- One specific person, **20–30% reduced sprint load** in the first month; no reduction means buddy only on paper.
- Meet 15 mins every day in first week; rule "stuck over 30 mins, ask".
- Lead asks newcomer after 2 weeks and 6 weeks: "What slows you down most?" then fix that right.

### Common mistakes
1. First week "read code" with no goals: newcomer reads but remembers nothing.
2. Assigning large tasks early to "learn fast": failure, loss of confidence.
3. Writing an 80-page document once: outdated after 2 months.
4. Not measuring, so don't know if this onboarding round is better than the last.

### 1-minute oral answer
"I treat onboarding as a product with metrics: time to first PR, 10th PR, first on-call. First day must run app with one command. First week, buddy guides one request through the system with minimal C4 diagram and glossary, and newcomer has a small PR right away. Tasks increase gradually, pair programming; with code lacking tests, I teach writing characterization tests before changing. Buddy has reduced sprint load, newcomer updates docs when seeing errors, and I ask them what slows them down most to fix for the next round."

> Senior tip: each newcomer is a **free test opportunity** for the team's documentation and dev environment. I ask them to record everywhere they got stuck in the first 2 weeks; that list always points to real technical debt that old members have gotten so used to they no longer see.`,
    follow: [
      "How is characterization test different from unit test written by specification?",
      "How do you choose the first task for a newcomer in a legacy codebase?",
      "How do you measure onboarding effectiveness with metrics other than time to first PR?"
    ]
  },
  'scenario-085': {
    q: 'You are asked to review a 4,200-line PR changing payment retry logic, simultaneously refactoring packages and adding DB migrations. Author wants to merge before Friday afternoon release. How do you review and handle it to reduce risk?',
    a: `**Summary:** large PR mixing types of changes **cannot be reviewed effectively**: humans miss much more when forced to read thousands of lines at once. I suggest **splitting** (pure refactor, migration, behavior change), review by **risk** rather than file order (money logic, concurrency, idempotency, migration first), verify by running rather than just reading, and release high-risk parts to production under control (feature flag, canary, rollback plan). If not split in time, the behavior change part does not go into Friday's release.

### Understand quickly
Checking 4,200 lines at once is like proofreading a book in one sitting: eyes glaze, errors slip through. Common experience (e.g., SmartBear at Cisco) is review efficiency drops sharply when exceeding a few hundred lines each time and over an hour.

### Step 1: categorize changes
~~~bash
git diff --stat main...feature/payment-retry   # which files changed most
git diff -M --stat main...feature/payment-retry # -M: detect renamed/moved files
~~~
Usually: 3,300 lines are package moves/renames (low risk), 600 lines retry logic (high risk), 300 lines migration + test.

### Step 2: suggest splitting, with specific script
"This PR has three types of changes with very different risk levels. I suggest splitting: PR1 pure refactor, no behavior change, I'll approve quickly today; PR2 migration; PR3 retry logic. PR1 and PR2 can go into Friday's release. PR3 touches money, I need time to review carefully and want it run behind a feature flag. What do you think?"
The goal is reducing risk together, not blocking others; always offer the path forward.

### Step 3: review by risk
| Area | Must-ask questions |
|---|---|
| Payment retry | Does retry have **idempotency key**? Does unknown-result timeout double charge? Which errors retry, which don't (4xx business don't retry)? Backoff and limit? |
| Transaction | HTTP call inside {{@Transactional}}? Status saved before or after calling partner? |
| Concurrency | What if two instances retry one transaction? Locking or status to block? |
| Migration | Locks large table? Backward compatible with old code currently running during rolling deploy? |
| Observability | Metrics for retry count, correlation id in logs, alert when retries surge? |
| Test | Tests for timeout, mid-way error, duplicate request, not just happy path? |

### Step 4: verify by running
- Checkout branch, run tests, intentionally break an important line to see if test fails (if not, test protects nothing).
- For migrations: run on data copy of production size or at least estimate time and lock type.

### Step 5: release to production under control
- New retry logic behind **feature flag**, enable for 5% transactions, monitor success rate, retry count, duplicate transaction.
- Rollback plan written: disable flag; migration must be backward compatible to not need DB rollback.
- Don't release money changes on Friday afternoon when few people are on call, unless mandatory.

### Common mistakes
1. Approve "LGTM" because of shyness or too long to read.
2. Comment 80 points on naming while missing idempotency bugs.
3. Block PR without offering a path forward, causing tension.
4. Trusting green CI when tests only cover happy path.

### 1-minute oral answer
"A 4,200-line PR mixing refactor, migration, and money logic cannot be reviewed effectively. I look at diff stat to categorize, suggest splitting into pure refactor, migration, and behavior change, and offer a path forward: low-risk parts go into Friday's release, high-risk retry review carefully later. I review by risk: idempotency, transaction, concurrency, migration backward compatibility, tests for mid-way errors. I verify by running, intentionally breaking code to see if tests catch it. Finally, roll out new logic behind feature flag with small percentage and rollback plan."

> Senior tip: I split comments into "**blocking**" (correctness, safety, data) and "**suggestions**" (naming, style), clearly written at the top. The author knows exactly what to fix before merge, and I force myself to prioritize important things. Long-term, small PR is culture: I encourage stacked PRs and feature flags so no one has to choose between "large PR" and "3-week long-lived branch".`,
    follow: [
      "How to split a large change into multiple small PRs while still merging to main incrementally?",
      "How do you handle it when the author is senior and doesn't want to split the PR?",
      "What is the review checklist for code having retries calling payment partners?"
    ]
  },
  'scenario-086': {
    q: 'The only engineer who understands the payment reconciliation module is resigning, 4 weeks left. Module runs batch every night, 2-3 times/month has discrepancies to process manually, and only he knows how. How do you design knowledge transfer so there is no incident after he leaves?',
    a: `**Summary:** this is a "**bus factor = 1**" risk that has come true. 4-week plan based on **doing** not just meeting: week 1 inventory of knowledge and risks; week 2 the receiver **observes** (shadow) real work; week 3 **reverse shadow**: receiver does it, old member just observes; week 4 receiver processes, old member is just backup. Measurable output: runbooks for each type of discrepancy, receiver processes at least one real discrepancy independently, and at least **two** people know the module. In parallel, talk openly with the resigned member to have real cooperation.

### Understand quickly
Learning to drive by listening to 10 lectures, you are still hesitant on the road; sitting in the passenger seat observing, then switching to driving with the teacher sitting next to you, then driving alone, you truly learn. Operational knowledge is mostly **tacit knowledge**: the expert doesn't know what they know until asked in the right situation.

### Week 1: inventory
- List everything the module does: which jobs, when run, which tables read/written, which partner called, where config, what access rights.
- History of 6 months discrepancy cases: type, root cause, how processed, script used. Rank "top 5 most common discrepancy types".
- Check for rights/assets only one person has: partner SFTP, keys, cron on private machine, script in home folder. Transfer to team account **immediately week 1**.
- Choose **two** receivers (main, backup), not just one, to avoid recreating bus factor 1.

### Weeks 2–4: real work
| Week | Old member | Receiver | Output |
|---|---|---|---|
| 2 | does, says every step out loud | observes, writes runbook | draft runbook for 5 discrepancy types |
| 3 | observes, intervenes only if about to fail | does following runbook | runbook revised after each time |
| 4 | backup, not proactive | processes independently, including night batch | at least 1 real discrepancy processed independently |
If in 4 weeks no real discrepancy: rebuild a discrepancy case on staging with sample data to practice.

### Questions to reveal tacit knowledge
- "When was the last time you woke up at 3 AM because of this module, and what happened?"
- "What in the code would cause an error if someone 'cleaned up'?"
- "What's the first thing you check when total doesn't match? Why that?"
- "Which partner sends files late/wrong, who do you contact?"
Record/video the explanation (with consent), because asking again after they leave is not an option.

### Talk to resigned member: script
"Thanks for letting us know 4 weeks early. Reconciliation module is what you know best, and I want that after you leave, no one has to call you. I propose in these 4 weeks you reduce feature work, focusing on transferring to Minh and Ha according to this plan. What do you think is missing?"
Resigned member cooperates well when transfer is recognized as **core work**, not extra work after hours.

### Report to upper management
Clearly state risks remaining after 4 weeks (e.g., "types of discrepancy caused by partner changing file format only happens once a year, haven't been practiced") and propose a plan: paid support agreement for 1–2 months after leaving, if company and that person agree.

### Common mistakes
1. Only ask "write documentation": rushed docs lack what others really need.
2. Transfer to one single person, repeating the problem.
3. Forgot rights, keys, private cron: discovered when account locked on day off.
4. Receiver keeps same sprint load, no time to learn.

### 1-minute oral answer
"This is bus factor 1 come true. Week 1 I inventory: jobs, tables, partners, discrepancy types in 6 months, and transfer immediately every right, key, private cron to team account. I choose two receivers. Week 2 they observe old member do real work and write runbook, week 3 reverse roles, week 4 they process independently, old member just backup; no real case means rebuilding on staging to practice. I ask questions to reveal tacit knowledge and video record the explanation. With resigned member, I make transfer their core work. And I report remaining risks to management with contingency plans."

> Senior tip: the cheapest time to handle bus factor is **before** someone resigns. I rotate periodically every quarter: which module has only one person deployed, on-called, or reviewed? Then rotate on-call and cross-review for exactly those modules. The question "what if this person takes 3 weeks leave?" should have an answer before it becomes "resigns".`,
    follow: [
      "How do you measure team bus factor with available data (Git, on-call)?",
      "If the resigned member doesn't cooperate, what do you do?",
      "What sections does a good runbook for a reconciliation discrepancy case include?"
    ]
  }
});
