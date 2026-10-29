/*
 * English translation of js/data/q-scenario.js — task T484. Format: js/core/i18n.js (content overlay).
 * ids: scenario-081 scenario-082 scenario-083 scenario-084 scenario-085 scenario-086
 */
App.i18n.content({
  'scenario-081': {
    q: 'An engineer with 1 year of experience runs a {{CREATE INDEX}} migration on the {{orders}} table with 80 million rows at 10 a.m.; it blocks writes to the table for 40 minutes and nobody can place an order. The department head wants a postmortem that "states clearly who did wrong so we can learn from it". How do you write a blameless postmortem, and what do you say to the department head?',
    a: `**Summary:** a blameless postmortem **does not mean nobody is accountable**; it means asking "**which system allowed** an ordinary operation to take the service down for 40 minutes?" instead of "who is at fault?". The practical reason: when people are named, everyone hides information, and next time someone else makes exactly the same mistake because the system has not changed. A postmortem contains: summary, quantified impact, timeline, root cause and contributing factors, what went well, and **action items with an owner and a deadline**. With the department head, I shift the goal from "learn a lesson" to "**make it impossible for anyone to repeat**", and that is the job of the system.

### Understand quickly
If a nurse gives the wrong injection because two medicine bottles have identical labels, firing the nurse does not make the hospital safer; changing the labels does. Aviation and medicine learned this early: punishing individuals makes incident reports disappear.

### Understand the technical part before writing
On PostgreSQL, {{CREATE INDEX}} normally takes a lock that blocks **INSERT/UPDATE/DELETE** (reads are still allowed) for the whole time the index is being built; 80 million rows take 40 minutes. {{CREATE INDEX CONCURRENTLY}} does not block writes, but it is slower, cannot run inside a transaction, and if it fails it leaves an INVALID index behind that has to be cleaned up. Nothing in the process told the engineer any of this.

### Postmortem structure
~~~text
1. Summary: 10:02-10:43, orders could not be created because a migration locked the orders table.
2. Impact: ~3,100 failed orders, an estimated 1.2 billion VND of revenue delayed or lost, 420 support tickets.
3. Timeline: 09:58 merge PR #1842 | 10:02 Flyway runs during the deploy | 10:05 alert on order-creation errors
   | 10:21 the lock on orders is identified | 10:43 the index finishes, service recovers by itself.
4. Root cause and contributing factors (see below).
5. What went well: the alert fired after 3 minutes; support was informed at 10:12.
6. What did not go well / luck: there was no safe way to cancel the build once it was running.
7. Action items: task, owner, deadline, ticket.
~~~

### Rewriting blame into statements about the system
| Blame | Blameless |
|---|---|
| "An ran the migration wrong." | "A non-CONCURRENTLY index migration was run automatically during a deploy at peak hours." |
| "The reviewer did not read carefully." | "The review checklist has no item about table locks; CI does not detect locking statements on large tables." |
| "An lacks experience." | "Knowledge about DDL locks lives in the heads of 2 people; there is no documentation or checking tool." |

### Contributing factors (more than one, always)
1. Flyway runs migrations during the deploy and does not separate out dangerous migrations.
2. There is no {{lock_timeout}}: with {{SET lock_timeout = '5s'}} the migration would cancel itself instead of blocking for 40 minutes.
3. CI has no linter for migrations (for example, warning about CREATE INDEX without CONCURRENTLY on a large table).
4. Staging has 50 thousand rows and the migration runs in 1 second, so nobody saw the risk.
5. The deploy happened at 10 a.m., during peak hours.

### Good and bad action items
- Bad: "Be more careful when writing migrations." (not measurable, nobody owns it)
- Good: "Add a CI migration check that blocks CREATE INDEX without CONCURRENTLY and ALTER TABLE column type changes; owner: Huy; deadline: 15/11."
- Good: "Default lock_timeout of 5s for the user that runs migrations; owner: Lan; deadline: 08/11."

### Talking to the department head: a script
"I understand you want to be sure this does not happen again, and so do I. If the postmortem names An, next time the person who makes a mistake will stay silent for 20 minutes before reporting it, and the incident will last longer. More important: anyone on the team could have run exactly this migration, because nothing stopped them. I propose a postmortem focused on 4 system changes, each with an owner and a deadline, and I will be accountable for following them up. As for An's personal development, I will talk to them privately, not through an incident document."
Accountability still exists: it belongs to the **owner of each action item** and to you, the lead.

### Common mistakes
1. The postmortem has a single cause ("human error").
2. Action items have no owner or deadline; three months later nobody has done them.
3. The postmortem meeting feels like a trial; the people involved stay silent.
4. Not shared widely: another team repeats exactly the same mistake.

### One-minute verbal answer
"Blameless does not mean nobody is accountable; it means asking which system allowed an ordinary operation to take the service down for 40 minutes. Here there are at least four factors: migrations run automatically during a peak-hour deploy, there is no lock_timeout, CI does not check for table-locking statements, and staging is too small to show the risk. The postmortem contains quantified impact, a timeline, the contributing factors, what went well, and action items with owners and deadlines. With the department head, I explain that naming people makes them hide mistakes and that anyone could have made this one; accountability lies with the action-item owners and with me."

> Senior tip: I measure the quality of a postmortem culture by the **percentage of action items completed on time** and by whether the person who caused the incident **volunteers** to write or present the postmortem. When a junior stands up and explains "what I did and why I thought it was right at the time", that team is learning faster than any other.`,
    follow: [
      'If a person repeats the same mistake after measures have been put in place, how do you handle it differently?',
      'Why can "5 Whys" lead to a wrong conclusion, and what do you add to it?',
      'How do you track that postmortem action items actually get done?'
    ]
  },
  'scenario-082': {
    q: 'Two seniors on your team have been arguing for 3 weeks about the design of the refund flow: one wants event-driven over Kafka, the other wants a synchronous REST call with an outbox. The PR has 60 back-and-forth comments, the rest of the team is waiting, and the sprint is late. As the lead, what do you do?',
    a: `**Summary:** the problem is no longer technical but a **missing decision-making mechanism**. I: (1) take the debate out of the PR; (2) classify the decision (easy or hard to reverse) to know how much investment it deserves; (3) agree on **criteria first, options second**, written up as a short ADR; (4) if data is missing, run a time-boxed spike with measurable criteria; (5) state clearly **who decides** and by when; (6) after the decision, "disagree and commit", recording the conditions to revisit it. In parallel, talk to each person privately.

### Understand quickly
Two good chefs argue about whether a dish should be steamed or grilled; the whole kitchen waits. The head chef does not need to be better than both, only to ask "what does the customer need, by when, and what do we have", then decide, and commit to owning that decision.

### Step 1: stop the debate on the PR
A PR is where **code** is reviewed, not where architecture is decided. 60 text comments are the worst channel for disagreement: tone is lost, and everyone wants to win in front of an audience.
What to say: "You both have good arguments. I am stopping the discussion on the PR. On Thursday I will hold a 45-minute meeting; each of you writes 1 page using the same template before the meeting. We will have a decision at the end."

### Step 2: the type of decision
| Type | Example | How to decide |
|---|---|---|
| Easy to reverse (two-way door) | class name, internal library | the person doing the work decides, quickly |
| Hard to reverse (one-way door) | sync vs async for the money flow, public event schema | ADR, criteria, possibly a spike |
The refund flow is hard to reverse (it affects reconciliation and other teams consume the events), so it deserves 1–2 days of analysis, **not 3 weeks**.

### Step 3: criteria first, options second
Ask both to agree on the criteria and weights **before** scoring the options; this step resolves most disagreements, because usually the two people are optimizing for two different things.
| Criterion (weight) | Kafka event-driven | REST + outbox |
|---|---|---|
| Money correctness, nothing lost or duplicated (3) | 2 | 3 |
| Customer sees the result immediately (2) | 1 | 3 |
| Other teams need to hear refund events (2) | 3 | 2 (the outbox still emits events) |
| The team can already operate it (2) | 1 (no Kafka in this team yet) | 3 |
| Total | 15 | 23 |
The table does not make the decision for you, but it exposes exactly where the real disagreement is.

### Step 4: if data is missing, spike
"We do not know whether the platform Kafka cluster meets a 99.95% SLA. Minh has 3 days to measure it, the criterion is X; the result decides column 4."

### Step 5: who decides, and disagree and commit
- State it from the start: "If we do not reach agreement after the meeting, I will decide, because I am accountable for this design."
- Write an ADR: context, options, decision, consequences, **revisit conditions** (for example: when 3 more consumers need refund events, re-evaluate).
- To the person who "lost": "Your option is not wrong; given the current criteria, the other one fits better. I will record the revisit conditions in the ADR. I need you to help make the chosen option succeed, and I want you to review the outbox part because you understand the risk of losing events best."

### Step 6: talk privately
A 3-week argument usually has non-technical reasons: wanting recognition, worrying about being undervalued, wanting to learn a new technology. Ask privately: "What matters most to you in this design?" The answer helps you assign work that fits (for example, the person who wants Kafka can lead a POC for another, lower-risk flow).

### Common mistakes
1. Letting the argument "end by itself": it does not end, it just goes underground.
2. The lead picks a side early, without letting each side present.
3. Majority voting on a hard technical decision: the majority is not accountable.
4. Not writing the decision down; 6 months later the debate starts over from scratch.

### One-minute verbal answer
"Three weeks of debate means a missing decision mechanism, not a lack of ideas. I take the debate out of the PR, schedule a meeting with a deadline, and state that if we do not agree, I decide. The refund flow is a hard-to-reverse decision, so it deserves analysis, but counted in days, not weeks. I have both sides agree on criteria and weights first, and only then score the options; whatever data is missing becomes a time-boxed spike. Once decided, I write an ADR with revisit conditions, ask for disagree and commit, and talk privately with the person who was not chosen to keep their motivation."

> Senior tip: I introduce into the team the rule "**if a debate goes past 2 rounds of comments, move it to a face-to-face meeting**" plus a one-page ADR template. Most long technical disagreements happen because two people are optimizing for two different criteria and nobody says so out loud; forcing the criteria to be written first resolves more than any debate about technology.`,
    follow: [
      'If you were one of the two people arguing, how would you make sure the process is fair?',
      'What should an ADR contain, and where should it live so the team actually reads it?',
      'What do you do if the person who was not chosen keeps quietly undermining the chosen option?'
    ]
  },
  'scenario-083': {
    q: 'There are 6 weeks left until the launch date of an instalment-payment feature, a date already promised to a banking partner and already advertised by marketing. The 5-person team has finished about 55% of the work; at the actual pace, the rest needs 10 weeks. The PM still says "if we put in extra hours we will make it". How do you handle it?',
    a: `**Summary:** report bad news **early, with numbers, and with options**: build a forecast from actual velocity (not optimistic estimates), present 3–4 choices with clear trade-offs (cut scope, move the date, launch partially behind a feature flag, add people with limits), recommend one option, and leave the decision to whoever has the authority. Usually the answer is **keep the date and cut scope** using MoSCoW: keep the "slice" that covers the main business flow end to end, move the rest to a second release. Do not accept "working extra hours" as a plan, and do not cut quality (tests, security, reconciliation) on a feature that involves money.

### Understand quickly
The car is 60 km from the airport, the plane takes off in 30 minutes, and the car can only do 60 km/h. "Try to drive faster" is not a plan. The real options: change the flight (move the date), leave some luggage behind and take a motorbike (cut scope), or send the most important person ahead (launch partially).

### Step 1: numbers, not feelings
~~~text
Velocity of the last 4 sprints: 18, 22, 19, 21 points / 2 weeks -> average ~20
Remaining: 100 points (already includes the average 10% of unplanned work per sprint)
6 weeks = 3 sprints -> capacity ~60 points
Short by ~40 points, equivalent to ~4 weeks
~~~
Overtime: the first 2 weeks may be 10–20% faster, after that defects go up, people get tired, and velocity **drops**. Adding new people: by Brooks's law, adding people late usually makes things slower because of onboarding and coordination; it only helps if the person already knows the codebase and takes a separate slice of work.

### Step 2: list the scope using MoSCoW
| Item | Level | Note |
|---|---|---|
| Instalment registration for 3/6/12 months, 1 partner bank | Must | contractual commitment |
| Reconciliation, refunds, audit log | Must | money-related, cannot be cut |
| 24-month instalments | Should | few customers choose it (market data ~5%) |
| Admin page to configure the fee schedule | Could | configure temporarily via file/DB, with ops support |
| Due-date reminders through the app | Could | use the existing SMS channel in release 1 |
| A second partner bank | Won't (release 1) | |

### Step 3: options to present
| Option | Date | Scope | Risk |
|---|---|---|---|
| A. Keep the date, cut Should/Could | on time | main flow complete | release 2 after 4–5 weeks |
| B. Move by 4 weeks | late | complete | broken partner commitment, wasted ad spend |
| C. Keep the date and the scope, work overtime | "on time" | complete on paper | low quality on a money feature, high incident risk |
| D. Launch to 10% of customers behind a feature flag, ramp up gradually | on time | main flow | needs alignment with marketing |
Recommendation: A combined with D.

### Script for talking to the PM
"I want to report this early so we still have options. Based on the last 4 sprints, with the current scope the team needs about 10 weeks and we have 6. Overtime only covers a small part of the gap and increases the risk of defects in the money flow. I have 4 options; I recommend keeping the date and launching instalment registration for 3/6/12 months with one bank, with full reconciliation; 24-month instalments and the admin page move to release 2, 4–5 weeks later. You need to decide by Friday so the team can focus. I will update the forecast every week."
If the PM still pushes: "I understand the pressure. If we keep the full scope, I need the risk recorded in writing and I need you to escalate it together with me, because for a money feature, a post-launch defect costs more than being late by a few weeks."

### After the decision
- Update the plan and **communicate clearly what is not included** in release 1 to marketing, customer support, and the partner.
- Hide unfinished parts behind feature flags instead of keeping a long-lived branch.
- Track the forecast weekly; if velocity changes, report again, do not wait for the last week.

### Common mistakes
1. Reporting late, in the final week: no option left except being late.
2. Presenting a problem without options, or options without a recommendation.
3. Cutting tests, reviews, and reconciliation to make the date: the debt is paid back with production incidents.
4. Promising "we will try" to avoid the hard conversation.

### One-minute verbal answer
"I report early with numbers: the actual velocity over the last 4 sprints, the remaining work, how many weeks we are short. Overtime is not a plan, and adding people late usually slows things down. I rank the scope with MoSCoW, keep reconciliation and security because it is a money feature, then present 3–4 options with trade-offs and one recommendation, usually keeping the date, moving Should/Could items to release 2, and ramping up behind a feature flag. The decision belongs to whoever has the authority; if they choose to keep the full scope, I record the risk in writing. After that I update the forecast weekly."

> Senior tip: I do not wait until we are late to talk about scope. From the start of the project, I agree with the PM on the list of Musts and the order in which things get cut; when the numbers get worse, the conversation becomes just "activating the plan we already agreed on" instead of a tense negotiation.`,
    follow: [
      'How do you estimate and forecast a completion date for a new team that has no velocity data yet?',
      'If leadership insists on keeping both the date and the scope, what do you do?',
      'How do you keep the team motivated when work they are halfway through has to be cut?'
    ]
  },
  'scenario-084': {
    q: 'Your team takes on 2 new engineers for a 400-thousand-line legacy monolith (Spring 4, Java 8, almost no documentation, 15% test coverage). The previous two took more than 3 months to land their first meaningful PR, and one of them quit. How do you design the onboarding?',
    a: `**Summary:** treat onboarding as a **product with metrics** (time to first PR, time to 10th PR, time to first on-call shift). Four pillars: (1) the environment runs within **one day** using a single command; (2) a minimal system map: a context/container diagram, one request travelling through the system, a business glossary; (3) **small real work from the first week** with a buddy and pair programming, with difficulty increasing over time; (4) newcomers **update the documentation** when they find it wrong, so the docs get better with every onboarding. On an under-tested codebase, teach them to write **characterization tests** before changing anything.

### Understand quickly
Dropping a newcomer into an unfamiliar city without a map and saying "walk around and you will get used to it" means that 3 months later they only know a few streets. Give them a map of the centre, someone who walks the main route with them, then hand them trips on the side streets, and within a few weeks they can get around alone.

### Why 3 months
- 1–2 weeks just to get the app running (scattered configuration, shared database dependencies).
- No idea where to start reading in 400 thousand lines.
- Afraid to change anything because there are no tests: fix one place, break another.
- Nobody is assigned responsibility for mentoring; everyone is busy.

### Week-by-week plan
| Time | Goal | Measurable output |
|---|---|---|
| Day 1–2 | run the app and the tests locally | {{docker compose up}} plus one script, the app runs with sample data |
| Week 1 | understand the map | walk one "place order" request with the buddy, from controller to DB; first PR (fix a log, add a test) |
| Weeks 2–4 | small real work | 3–5 small bug-fix PRs in one module, pair twice a week |
| Month 2 | a medium feature | one feature with a short design, reviewed carefully |
| Month 3 | autonomy | on call together with an experienced person (shadow), then swap roles (reverse shadow) |

### Minimal documentation, not complete documentation
- **Context and container diagrams** (following the C4 model): who the system talks to, and what blocks it consists of.
- "Where one request goes": which classes and tables the order flow passes through.
- Business glossary: what "contract", "period", "settlement" are called in the code.
- A list of "danger zones": which modules have few tests, and who to ask before touching them.
- The rule: **newcomers fix documentation as soon as they see it is wrong**, and that is the ideal first PR.

### Safe techniques for changing legacy code
~~~java
// Characterization test: record the CURRENT behavior (including odd behavior) before changing anything
@Test
void feeCalculation_currentBehavior() {
    FeeCalculator calc = new FeeCalculator();
    // Expected values come from actual run results, not from a specification
    assertEquals(new BigDecimal("15000"), calc.fee(new BigDecimal("1000000"), 3));
    assertEquals(new BigDecimal("0"), calc.fee(BigDecimal.ZERO, 3)); // existing edge-case behavior
}
// With this safety net in place, a newcomer can refactor or fix a bug and know immediately if behavior changed
~~~

### The buddy role
- One specific person whose sprint load is **reduced by 20–30%** in the first month; without that reduction the buddy exists only on paper.
- Meet for 15 minutes every day during the first week; rule: "if you are stuck for more than 30 minutes, ask".
- The lead asks the newcomer after 2 weeks and after 6 weeks: "What slows you down the most?" and then fixes exactly that.

### Common mistakes
1. "Read the code" with no goal in the first week: the newcomer reads and remembers nothing.
2. Assigning a big task early to "learn fast": it fails and confidence drops.
3. Writing an 80-page documentation set in one go: outdated after 2 months.
4. Not measuring, so you never know whether this onboarding was better than the last one.

### One-minute verbal answer
"I treat onboarding as a product with metrics: time to first PR, to the 10th PR, to the first on-call shift. On day one the app must run with one command. In week one the buddy walks one request through the system with a minimal C4 diagram and a business glossary, and the newcomer lands a small PR straight away. Work gets harder gradually, with pair programming; on an under-tested codebase, I teach characterization tests before any change. The buddy gets a real load reduction, newcomers fix documentation when they see it is wrong, and I ask them what slows them down most so I can fix it for the next round."

> Senior tip: every newcomer is a **free test opportunity** for the team's documentation and dev environment. I ask them to write down everything they get stuck on during the first 2 weeks; that list always points to real technical debt that old-timers have grown so used to that they no longer see it.`,
    follow: [
      'How does a characterization test differ from a unit test written from a specification?',
      'What criteria do you use to pick the first task for a newcomer in a legacy codebase?',
      'What metrics do you use to measure onboarding effectiveness beyond time to first PR?'
    ]
  },
  'scenario-085': {
    q: 'You are asked to review a 4,200-line PR that at the same time changes payment retry logic, refactors packages, and adds a DB migration. The author wants to merge before the Friday afternoon release. How do you review it and manage the risk?',
    a: `**Summary:** a large PR that mixes several kinds of change **cannot be reviewed effectively**: people miss far more when they have to read thousands of lines at once. I propose **splitting** it (pure refactor, migration, behaviour change), reviewing by **risk** rather than by file order (money logic, concurrency, idempotency, migration first), verifying by running rather than only reading, and putting the risky part into production in a controlled way (feature flag, canary, rollback plan). If it cannot be split in time, the behaviour change does not ship on Friday.

### Understand quickly
Reviewing 4,200 lines in one go is like proofreading a whole book in one sitting: the eyes skim and errors slip through. The widely cited experience (for example SmartBear's study at Cisco) is that review effectiveness drops sharply beyond a few hundred lines per session and beyond about an hour.

### Step 1: classify the changes
~~~bash
git diff --stat main...feature/payment-retry   # which files changed the most
git diff -M --stat main...feature/payment-retry # -M: detect files that were only renamed/moved
~~~
Typically you find: 3,300 lines are package moves and renames (low risk), 600 lines are retry logic (high risk), 300 lines are the migration plus tests.

### Step 2: propose a split, with specific wording
"This PR has three kinds of change with very different risk levels. I suggest splitting it: PR1 pure refactor with no behaviour change, which I can approve quickly today; PR2 the migration; PR3 the retry logic. PR1 and PR2 can ship on Friday. PR3 touches money, so I need time to review it carefully and I want it to run behind a feature flag. What do you think?"
The goal is to reduce risk together, not to block someone; always offer a way forward.

### Step 3: review by risk
| Area | Mandatory questions |
|---|---|
| Payment retry | Does the retry have an **idempotency key**? Can a timeout with an unknown result debit the customer twice? Which errors are retried and which are not (business 4xx should not be retried)? Is there backoff and a retry cap? |
| Transaction | Is an HTTP call made inside {{@Transactional}}? Is state saved before or after the partner call? |
| Concurrency | What happens when two instances retry the same transaction? Is there a lock or a state guard? |
| Migration | Does it lock a large table? Is it backwards compatible with the old code still running during a rolling deploy? |
| Observability | Are there metrics for the number of retries, do the logs carry a correlation id, is there an alert when retries spike? |
| Tests | Are there tests for timeouts, mid-way failures, and duplicate requests, not just the happy path? |

### Step 4: verify by running
- Check out the branch, run the tests, deliberately break one important line to see whether a test fails (if none fails, the tests are not protecting anything).
- For the migration: run it on a copy of production-sized data, or at least estimate the duration and the type of lock.

### Step 5: release to production in a controlled way
- The new retry logic behind a **feature flag**, enabled for 5% of transactions, monitoring the success rate, the retry count, and duplicate transactions.
- Write the rollback plan in advance: turn the flag off; the migration must be backwards compatible so that no DB rollback is needed.
- Do not ship money changes on Friday afternoon when few people are on call over the weekend, unless it is unavoidable.

### Common mistakes
1. Approving with "LGTM" out of reluctance or because it is too long to read.
2. Leaving 80 comments about naming while missing an idempotency bug.
3. Blocking the PR without offering a way forward, creating tension.
4. Trusting a green CI when the tests only cover the happy path.

### One-minute verbal answer
"A 4,200-line PR mixing a refactor, a migration, and money logic cannot be reviewed effectively by anyone. I look at the diff stat to classify it, propose splitting it into a pure refactor, the migration, and the behaviour change, and offer a way forward: the low-risk parts ship on Friday, the retry part gets a careful review afterwards. I review by risk: idempotency, transactions, concurrency, migration backwards compatibility, tests for mid-way failures. I run it and deliberately break the code to see whether the tests catch it. Finally, the new logic goes out behind a feature flag at a small percentage, with a rollback plan."

> Senior tip: I split comments into "**blocking**" (correctness, safety, data) and "**suggestion**" (naming, style), and say which is which at the top of each comment. The author knows exactly what must be fixed before merging, and the reviewer is forced to prioritise what matters. In the long run, small PRs are a culture: I encourage stacked PRs and feature flags so that nobody has to choose between "a big PR" and "a branch that lives for 3 weeks".`,
    follow: [
      'How do you split a large change into several small PRs that can still be merged into main piece by piece?',
      'How do you handle it when the author is more senior than you and does not want to split the PR?',
      'What should a review checklist for code that retries partner payment calls contain?'
    ]
  },
  'scenario-086': {
    q: 'The only engineer who understands the payment reconciliation module has just resigned, with 4 weeks left. The module runs a nightly batch, 2–3 times a month the totals do not match and someone has to fix it by hand, and only they know how. How do you plan the knowledge transfer so that there is no incident after they leave?',
    a: `**Summary:** this is the "**bus factor = 1**" risk becoming reality. The 4-week plan is built on **doing the real work**, not just meetings: week 1, inventory the knowledge and the risks; week 2, the successor **observes** (shadow) every real task; week 3, **swap roles** (reverse shadow): the successor does the work while the outgoing engineer only observes; week 4, the successor handles everything and the outgoing engineer is only a fallback. Measurable outputs: a runbook for each type of mismatch, the successor having handled at least one real mismatch alone, and at least **two** people who understand the module. In parallel, have a straight conversation with the person who is leaving so that you get genuine cooperation.

### Understand quickly
You cannot learn to drive by listening to 10 lectures; you will still be clumsy on the road. Sitting in the passenger seat to observe, then taking the wheel with an instructor beside you, then driving alone — only then do you really learn. Operational knowledge is largely **tacit**: an expert does not know what they know until someone asks the right question in the right situation.

### Week 1: inventory
- A list of everything the module does: which jobs, when they run, which tables they read and write, which partners they call, where the configuration lives, which permissions are needed.
- The last 6 months of mismatch incidents: the type, the cause, how it was handled, the scripts that were run. From that, rank the "5 most common incident types".
- Check the permissions and assets that only one person has: partner SFTP accounts, keys, cron entries on a personal machine, scripts in a home directory. Move them to team accounts **in week 1**.
- Choose **two** successors (one primary, one secondary), not just one, so that you do not recreate a bus factor of 1.

### Weeks 2–4: do the real work
| Week | Outgoing engineer | Successor | Output |
|---|---|---|---|
| 2 | does the work, narrating each step | observes, writes the runbook | draft runbook for the 5 mismatch types |
| 3 | observes, intervenes only when something is about to go wrong | works from the runbook | runbook corrected after each run |
| 4 | fallback only, does not step in proactively | handles it alone, including being on call for the nightly batch | at least 1 real mismatch handled independently |
If no real mismatch happens within the 4 weeks: recreate one in staging with sample data for practice.

### Questions that surface tacit knowledge
- "When was the last time you woke up at 3 a.m. because of this module, and what happened?"
- "What in the code would break if a newcomer 'tidied it up'?"
- "What do you check first when the totals do not match? Why that first?"
- "Which partner often sends late or wrong files, and who do you contact?"
Record audio or video of the walkthrough (with consent), because asking again after the person has left is not an option.

### Talking to the person who is leaving: a script
"Thank you for giving 4 weeks' notice. The reconciliation module is what you understand best, and I want nobody to have to call you after you leave. I suggest that during these 4 weeks you reduce feature work and focus on handing over to Minh and Hà following this plan. What do you think is missing?"
A departing person cooperates well when the handover is recognised as **their main work**, not as something added on after hours.

### Escalating upwards
State the residual risk clearly after the 4 weeks (for example: "a mismatch caused by a partner changing their file format happens only once a year; we have not been able to practise it") and propose options: a paid support arrangement for 1–2 months after departure, if both the company and the person agree.

### Common mistakes
1. Only asking for "write documentation": rushed documentation does not cover what others actually need.
2. Handing over to a single person, recreating the same problem.
3. Forgetting access, keys, and personal cron jobs: discovered when the account is locked on the day they leave.
4. The successor keeps their full sprint load and has no time to learn.

### One-minute verbal answer
"This is a bus factor of 1 that has become reality. In week one I take inventory: jobs, tables, partners, the types of mismatch over the last 6 months, and I immediately move every personal permission, key, and cron job to team accounts. I pick two successors. In week 2 they observe the outgoing engineer doing real work and write the runbook, in week 3 we swap roles, in week 4 they handle it alone while the outgoing engineer is only a fallback; if no real incident occurs, we recreate one in staging. I ask questions that surface tacit knowledge and record the walkthrough. With the person leaving, I make the handover their main work. And I escalate the residual risk along with a fallback plan."

> Senior tip: the cheapest time to deal with bus factor is **before** anyone resigns. I do a quarterly review: which modules have only ever been deployed by one person, only ever been on call for one person, or only ever reviewed by one person? Then I rotate on-call and cross-review for exactly those modules. The question "what if this person takes 3 weeks of leave?" should have an answer before it becomes "what if this person resigns?".`,
    follow: [
      'How do you measure the bus factor of a team using the data you already have (Git, on-call)?',
      'What do you do if the person who is leaving does not cooperate?',
      'What does a good runbook for a reconciliation mismatch contain?'
    ]
  }
});
