/*
 * English translation of js/data/q-english.js — task T986. Format: js/core/i18n.js (content overlay).
 * ids: english-142 english-143 english-144 english-145 english-146 english-147 english-148 english-149 english-150 english-151
 */
App.i18n.content({
  'english-142': {
    q: 'Tell me about a time you had a conflict with a teammate. How did you handle it?',
    a: `**Summary:** Choose a **work-related conflict** (design, priority, way of working), not a personal story. Tell it with **STAR**: what the two viewpoints were, how you **listened and learned the other person's reasoning**, how both sides **used data or experiments** to decide, the outcome, and **the relationship afterward**. Do not blame, do not say you "won".

### What the interviewer wants to hear
- You **separate the issue from the person**.
- You **listen** and can change your mind when there is evidence.
- You bring the argument back to **data, experiments, shared criteria**.
- The working relationship is **better or still fine** after the conflict.

### Model answer (60–90 seconds)
"In my last project, another senior engineer and I disagreed on how to handle notifications. He wanted to call the notification service synchronously from the order API, because it was simpler. I wanted to publish an event to Kafka, because notification outages had caused failed orders before.

The discussion became tense in a design review, so I suggested we talk one-on-one. I asked him what worried him about the event approach, and he explained that the team had little experience operating Kafka consumers, and he was afraid of silent failures. That was a fair point I hadn't considered.

We agreed on clear criteria — order success rate, latency, and operational effort — and ran a small proof of concept for one week. The event approach kept orders working when we stopped the notification service, and we addressed his concern by adding a dead-letter queue and a consumer-lag alert.

We went with that design, and he actually wrote the runbook for it. We've worked very well together since then, and we now use the same 'criteria first' approach for other design decisions."

### Short version (30 seconds)
"A colleague and I disagreed about synchronous calls versus Kafka for notifications. I asked about his concerns, we agreed on criteria and ran a one-week proof of concept. We chose the event approach with the safeguards he suggested, and he wrote the runbook."

### Real-life example
One candidate told the conflict story as "my teammate was wrong and finally the manager agreed with me" — the interviewer noted "low collaboration". When retelling the same story but focusing on asking the colleague's reasoning, agreeing on criteria and experimenting, with the detail "he wrote the runbook", the answer became a strength.

### Useful phrases
- "We disagreed on how to…"
- "I suggested we talk one-on-one."
- "I asked what worried him about…"
- "That was a fair point I hadn't considered."
- "We agreed on clear criteria: …"
- "We've worked well together since then."

### Common mistakes Vietnamese candidates make
- Telling a personal conflict story or speaking poorly of a colleague.
- Ending with "I was right" — end with the result for the team and the relationship instead.
- "We argued very much" → **"We had a strong disagreement."**
- "He don't agree with me" → **"He didn't agree with me."**
- Using "fight" for a work dispute → use **"disagreement"**, **"different views"**.

> Senior tip: The strongest conflict story is one where **you changed part of your viewpoint** because of the other person. It shows you decide by reason, not by ego.`,
    follow: [
      'How do you handle conflicts in code review?',
      'Tell me about a time you changed your mind after discussion.',
    ]
  },
  'english-143': {
    q: 'Describe a failure or mistake you made. What did you learn?',
    a: `**Summary:** Choose a **real mistake, with clear consequences**, but **well handled**. Tell the mistake briefly, spend most of the time on **how you fixed it**, the **root cause** (not just "I was careless") and **long-term changes** (process, tools). Take responsibility with "I", do not blame others.

### What the interviewer wants to hear
- You **dare to admit** the mistake and act quickly to reduce damage.
- You find the **systemic root cause**, not just blame yourself.
- You turn the lesson into **improvement for the whole team** (blameless postmortem).

### Model answer (60–90 seconds)
"A couple of years ago, I ran a database migration that added a unique index on the customer email column. It had passed in every test environment, so I ran it in production during a normal deployment.

It failed halfway, because production had about two hundred duplicate emails from an old import. The deployment got stuck, and the sign-up page was down for about twenty minutes until I rolled back the application.

I owned the mistake in the incident channel right away. After that, I cleaned up the duplicates together with the support team, because some of them belonged to real customers, and then reran the migration safely.

The root cause wasn't just that I forgot to check the data. Our process had no way to test migrations against production-like data. So I set up a nightly job that restores an anonymized production snapshot and runs all pending migrations against it. In the next six months, that job caught four risky migrations before they reached production.

What I learned is that 'it passed in staging' isn't evidence when the data is different — now I always ask what production data looks like."

### Short version (30 seconds)
"I ran a migration that failed in production because of duplicate data we didn't have in staging, and sign-up was down for twenty minutes. I rolled back, fixed the data, and then built a nightly job that tests migrations on anonymized production data. It caught four risky migrations in six months."

### Real-life example
One candidate chose a "mistake" like "I once forgot to update the documentation" — the interviewer rated it as avoidance. Another candidate told a real mistake with actual downtime but focused on how they handled it and the migration-check job; the interviewer asked follow-up about blameless postmortem and the candidate had examples ready — that is the conversation they want to lead to.

### Useful phrases
- "I owned the mistake right away."
- "The root cause wasn't just…; our process had no way to…"
- "To prevent it from happening again, I…"
- "What I learned is that…"
- "In a blameless postmortem, we focus on the system, not the person."

### Common mistakes Vietnamese candidates make
- Choosing a mistake that is too small or fake ("I work too hard").
- Spending too long on the mistake, too little on the fix and the lesson.
- "It's not my fault, the data was wrong" → **"I should have checked the production data first."**
- "I have learned many things" too vague → **"What I learned is that…"** + one specific lesson.
- Tense: "I run the migration and it fail" → **"I ran the migration, and it failed."**

> Senior tip: End the mistake story with **one mechanism** you created (job, checklist, alert) and **one number** about its effectiveness. A mistake with a prevention mechanism is one of the most convincing answers for Senior level.`,
    follow: [
      'How do you run a blameless postmortem?',
      'What process changes followed your last incident?',
    ]
  },
  'english-144': {
    q: 'Tell me about a time you disagreed with your manager.',
    a: `**Summary:** Disagreeing with your manager is normal; what they check is **how** you disagree: **privately, with data, proposing alternatives**, and **committing to the final decision** even if it is not your idea ("disagree and commit"). Choose a story about priority, deadline, or technical risk — not a personal one.

### What the interviewer wants to hear
- You **dare to speak up** when you see risk, not stay silent and follow along.
- You speak with **data and options**, not just opposition.
- You **respect the decision** and still give your best after agreeing.

### Model answer (60–90 seconds)
"Last year, my manager committed to launching a new loyalty feature in three weeks for a marketing campaign. After breaking down the work, I estimated it would take at least five weeks to do it safely, because it touched our payment reconciliation.

Instead of raising it in the team meeting, I asked for a short one-on-one. I showed him the task breakdown and the two risky parts, and I said, 'I understand the campaign date is fixed. Here are two options: we launch a smaller version in three weeks — points are calculated, but redemption comes two weeks later — or we keep the full scope and move the date.'

He explained that marketing had already paid for the campaign, so the date couldn't move. We went with the smaller version. I wasn't completely happy with it, but once we decided, I fully committed and made sure the team understood why.

The campaign launched on time without any payment issues, and the redemption part shipped two weeks later. My manager later told me the options made it much easier for him to negotiate with marketing."

### Short version (30 seconds)
"My manager committed to a three-week deadline I believed was unsafe. I raised it privately with a task breakdown and two options. We chose a smaller first release, I committed to that decision, and we launched on time without payment issues."

### Real-life example
One developer disagreed with the deadline during a meeting with the client present: "This is impossible." The manager lost face, and the relationship was tense for months. Another developer in a similar situation met privately, brought an estimate table and two scope-cut options — and was later assigned to lead the scope negotiation with the client.

### Useful phrases
- "I asked for a short one-on-one."
- "Here's what I'm worried about, and here's the data."
- "I see two options: … or …"
- "I understand the date is fixed, so…"
- "Once we decided, I fully committed."
- "Disagree and commit."

### Common mistakes Vietnamese candidates make
- Telling a story where you "won" against the manager — sounds hard to work with.
- Only opposing without proposing an option.
- "I told him it is impossible" → **"I explained why I thought the timeline was risky."**
- "My manager was wrong" → **"We had different views on the timeline."**
- Missing the outcome and the relationship afterward.

> Senior tip: always bring **at least two options** when disagreeing with your manager — one keeps the deadline but reduces scope; one keeps scope but changes the deadline. Managers rarely choose "do nothing", but they really need someone who helps them choose the least risky option.`,
    follow: [
      'How do you push back on unrealistic deadlines?',
      'When do you escalate?',
    ]
  },
  'english-145': {
    q: 'Describe a time you worked under a tight deadline.',
    a: `**Summary:** A good tight-deadline story shows three skills: **intentional scope cutting** (MVP — keep what matters most), **early risk reporting** to stakeholders, and **keeping quality where mistakes are not allowed** (money, data, security). The result is delivering the **important part** on time with a plan for the rest — not "everyone works overtime every night".

### What the interviewer wants to hear
- You can **prioritize** and know how to say "not now".
- You **communicate risks early**, not wait until the last day to report a delay.
- You do not sacrifice **core quality**.

### Model answer (60–90 seconds)
"Last year, a new regulation required us to add transaction limits for e-wallet users, and the deadline from the central bank was fixed — we had four weeks.

First, I listed everything the business had asked for and sorted it by 'required by regulation' versus 'nice to have'. The core rule — blocking transfers above the daily limit — was mandatory. The admin dashboard and custom limits for VIP users were not. I proposed delivering the core rule first and the rest in a second release, and the product owner agreed.

From day one, I posted a simple status every Friday: done, in progress, and risks. In the second week, I flagged that the core banking team needed three days to open a new API, and we escalated early, so it did not become a surprise.

We did not cut corners on testing the limit logic, because a mistake there would block real customers or break the regulation.

We went live two days before the deadline, with zero incidents. The dashboard and VIP limits followed three weeks later."

### Short version (30 seconds)
"We had four weeks to implement a regulatory transaction limit. I separated what the regulation required from nice-to-haves, delivered the core rule first, shared weekly risk updates, and escalated a dependency early. We went live two days early with no incidents."

### Real-life example
One team got a tight deadline and tried to build every feature, working overtime for three weeks straight; on the last day they were still late and had a limit calculation error on production. The next time, the team lead made a "must-have / can defer" table and sent weekly risk updates — they delivered the mandatory part on time and nobody had to work at night.

### Useful phrases
- "I sorted the requirements into must-have and nice-to-have."
- "I proposed delivering … first and … in a second release."
- "I flagged the risk early."
- "We didn't cut corners on…"
- "We went live two days before the deadline."

### Common mistakes Vietnamese candidates make
- Proud of overtime: "We worked until midnight every day" — emphasize **how you prioritized** instead of hours worked.
- "The deadline is very tight so we try our best" → **"The deadline was fixed, so I proposed…"**
- Reporting risk too late in the story.
- "We finish on time" → **"We finished on time / We went live on time."**

> Senior tip: use the phrase "must-have versus nice-to-have" and tell **who agreed** to cut scope (PO, customer). The interviewer wants to see you negotiate scope transparently, not quietly drop work on your own.`,
    follow: [
      'How do you scope an MVP?',
      'How do you communicate slip risk early?',
    ]
  },
  'english-146': {
    q: 'Tell me about a time you mentored a junior developer.',
    a: `**Summary:** This question (different from the general mentoring story) usually digs into **two skills**: **giving constructive feedback** and **measuring whether mentoring works**. Use the **SBI** framework (Situation – Behavior – Impact) for feedback, set **specific goals** together with the mentee, and measure by **what they can do on their own**, not by feeling.

### What the interviewer wants to hear
- You give feedback that is **specific, timely, private**, focused on behavior.
- You **set goals** together with the mentee.
- You have a **measure**: more independent, fewer review rounds, new responsibilities.

### Model answer (60–90 seconds)
"I mentored a mid-level developer who wanted to grow into a senior role. Technically he was solid, but in design discussions he often went straight into implementation details and lost the room.

We agreed on a clear goal for the quarter: lead one design review on his own. To give feedback, I used a simple structure — situation, behavior, impact. After one meeting I said, 'In today's design review, you spent the first ten minutes on the database schema before explaining the problem. The product manager got lost and the decision was postponed.' Then I asked what he thought, and we practiced starting with the problem and two options.

I also asked him to write a one-page design doc before each review, and I reviewed the first two.

To measure progress, we looked at concrete things: the number of review rounds on his designs, whether decisions were made in the first meeting, and feedback from the product manager. By the end of the quarter, he led two design reviews, both ended with a decision, and he was promoted to senior six months later."

### Short version (30 seconds)
"I mentored a mid-level developer toward a senior role. We set a concrete goal — leading a design review — and I gave feedback using situation, behavior, impact. We measured progress by decisions made in his reviews, and he was promoted six months later."

### SBI framework
| Part | Example |
|---|---|
| Situation | "In yesterday's sprint demo…" |
| Behavior | "…you skipped the error cases…" |
| Impact | "…so the client asked three follow-up questions and we ran out of time." |
| (Next step) | "What do you think? Next time, could we cover errors in the first slide?" |

### Real-life example
One senior gave feedback like "Your presentation was not good, you need to improve communication" — the junior did not know what to fix and lost motivation. When switching to SBI with specific examples and asking the recipient's opinion, the same junior proposed practicing the demo with the team before the next one and improved clearly after two times.

### Useful phrases
- "We agreed on a clear goal for the quarter."
- "In today's meeting, you… As a result, …"
- "What do you think?" / "How did it feel from your side?"
- "To measure progress, we looked at…"
- "By the end of the quarter, he was able to…"

### Common mistakes Vietnamese candidates make
- Vague feedback, commenting on personality: "You are not confident" → describe specific **behavior**.
- Giving negative feedback in front of the whole team → negative feedback should be **private**.
- No measure: "I think he improved" → **"His designs now need one review round instead of three."**
- "I gave him many feedbacks" → **"I gave him a lot of feedback"** (feedback is uncountable).

> Senior tip: "feedback" is an uncountable noun — say **"a piece of feedback"**, **"some feedback"**. The error "feedbacks" is very common and easily noticed in English interviews.`,
    follow: [
      'How do you give constructive feedback?',
      'How do you measure mentoring success?',
    ]
  },
  'english-147': {
    q: 'What was your biggest technical challenge?',
    a: `**Summary:** Choose a challenge with **real technical depth** and **numbers**: problem and impact → how you **measured and narrowed down** (profiling, tracing, testing hypotheses) → options and **why you chose** → measured result → what you would do differently. The interviewer grades **how you think**, not just the result.

### What the interviewer wants to hear
- You investigate **methodically**: measure first, hypothesize, verify.
- You understand the **underlying mechanism** (JVM, DB, network), not just random trying.
- You know **trade-offs** and self-evaluate.

### Model answer (60–90 seconds)
"My biggest technical challenge was a memory problem in our pricing service. Every few days, pods were killed with out-of-memory errors during peak hours, and each restart caused about a minute of failed requests.

The heap graphs looked normal, which was confusing. So instead of just increasing memory, I measured. I enabled Native Memory Tracking and compared it with the container's memory usage. The heap was stable at two gigabytes, but direct memory kept growing — about fifty megabytes an hour.

That pointed me to off-heap buffers. Using a heap dump and the netty metrics, I found that one HTTP client created a new connection pool for every request to a partner API and never closed it, so the native buffers piled up.

I fixed it by sharing a single client with a bounded pool and added a limit on direct memory so the problem would fail fast if it came back. I also added memory metrics for direct buffers to our dashboard.

After the fix, memory stayed flat for weeks and the restarts stopped. If I did it again, I'd add the native memory dashboard from the start — it would have saved us two weeks."

### Short version (30 seconds)
"Our pricing service kept getting OOM-killed, but the heap looked normal. I used Native Memory Tracking and found direct memory growing because an HTTP client created a new connection pool per request. Sharing one client fixed it, and the restarts stopped."

### Real-life example
One candidate answered "The biggest challenge was learning microservices" — too general, no mechanism. Another candidate told the off-heap leak story above; the interviewer asked follow-up for 15 minutes about Native Memory Tracking, direct buffer and container limits — and that was exactly the part where the candidate scored points.

### Useful phrases
- "Instead of just…, I measured first."
- "That pointed me to…"
- "My hypothesis was…, so I tested it by…"
- "I fixed it by… and added… so it would fail fast."
- "If I did it again, I'd…"

### Common mistakes Vietnamese candidates make
- Choosing a challenge that is too general or not your own.
- Telling the solution but skipping the investigation process.
- "The memory is leak" → **"There was a memory leak"** / **"Memory was leaking."**
- "I increase the RAM and it's OK" → explain why increasing RAM only masks the symptom.
- Unclear numbers: "fifty megabyte per hour" → **"about fifty megabytes an hour."**

> Senior tip: Prepare a technical story in the form "**misleading symptom → measured the right place → surprising root cause**". This structure naturally invites the interviewer to go deep into exactly the part you know best.`,
    follow: [
      'How did you profile and measure?',
      'What would you do differently?',
    ]
  },
  'english-148': {
    q: 'Why do you want to leave your current company?',
    a: `**Summary:** Answer in the direction of **"going to"** (what I'm looking for), not **"running away from"** (what I hate). Acknowledge the good at your current company, state **one clear professional reason** (system scale, role, field, international environment), and **connect that reason to the position you are applying for**. Do not speak poorly of your boss, colleagues, or old company.

### What the interviewer wants to hear
- You have **positive motivation**, not someone who will leave when things get hard.
- Your reason **matches** what they can offer.
- You are **professional**, not bringing negativity to the new place.

### Model answer (60–90 seconds)
"I've learned a lot at my current company. I joined as a mid-level developer, and over four years I've built and maintained the core order services for our e-commerce platform. I'm grateful for that.

But the system has become quite stable, and most of my work now is maintenance and small features. I'm looking for a role where I can work on larger-scale problems — systems with higher traffic, event-driven architecture, and stricter reliability requirements.

I'm also keen to work in an international team and use English every day, because I want to grow toward a lead role in a global environment.

That's why this position caught my attention. From the job description and our conversation, your payment platform handles millions of transactions a day, and the team is spread across three countries. That's exactly the kind of challenge I'm looking for next."

### Short version (30 seconds)
"I've grown a lot at my current company, but the system is now stable and mostly in maintenance. I'm looking for larger-scale, event-driven systems and an international team, and that's exactly what this role offers."

### If the real reason is negative
| Real reason | Professional way to say it |
|---|---|
| Low salary | "I'm looking for a role that reflects my current level of responsibility." |
| Difficult boss | "I'm looking for a team with a strong engineering culture and clear feedback." |
| Old technology | "I'd like to work with a more modern stack, like Java 21 and Kubernetes." |
| Too much overtime | "I'm looking for a more sustainable pace with good planning." |
| Layoff | "My team was affected by a restructuring. It was a business decision, and I'm proud of what we delivered." |

### Real-life example
One candidate answered "My manager doesn't respect developers and the salary is too low" — the interviewer worried the candidate would bring negative psychology to the team. With the same reason, rephrased in the "looking for" direction and connected to the position, the candidate was asked follow-up about event-driven experience — turning the conversation to their strength.

### Useful phrases
- "I've learned a lot at my current company."
- "I'm looking for a role where I can…"
- "I'm keen to…" / "I'd like to grow toward…"
- "That's why this position caught my attention."
- "That's exactly the kind of challenge I'm looking for."

### Common mistakes Vietnamese candidates make
- Speaking poorly of the old company, telling conflict details.
- Only talking about money.
- "I want to change environment" (literal translation) → **"I'm looking for a new challenge in a larger-scale environment."**
- "My company has no chance to promote" → **"There are limited opportunities to grow into a lead role."**

> Senior tip: prepare the answer in advance for the follow-up "What would make you stay?". Answer honestly but briefly ("a role with bigger technical scope") — it shows your reason is consistent, not just small talk.`,
    follow: [
      'What are you looking for in your next role?',
      'What would make you stay?',
    ]
  },
  'english-149': {
    q: 'What are your salary expectations?',
    a: `**Summary:** This question focuses on **two hard follow-ups**: when receiving a **low offer** and **what matters besides base salary**. Respond to a low offer with **thank you → confirm interest → data-based reason → specific proposal**, and know how to **negotiate the whole package** (bonus, remote, salary review, training, equipment). For remote work with a foreign company, state **currency, gross, contract type** clearly.

### What the interviewer wants to hear
- You are **calm and grounded**, not emotional.
- You are **flexible** about package structure, not just one number.
- You understand **total income**, not just monthly salary.

### Model answer (60–90 seconds)
When the offer is lower than expected:
"Thank you for the offer — I'm genuinely excited about the team and the product. The base salary is about fifteen percent below what I expected. Based on market data for senior Java roles and the on-call responsibility in this position, I was aiming for around 4,000 US dollars gross per month. Is there flexibility on the base?"

If they say the base salary is fixed:
"I understand. In that case, could we look at other parts of the package? For example, a sign-on bonus, a salary review after six months based on agreed goals, or a learning budget for certifications."

When asked what matters besides base salary:
"Besides the base salary, I care about the scope of the role, the quality of the engineering team, and room to grow. For a remote contract, I also look at payment terms, the currency, paid time off, and whether the company provides equipment."

### Short version (30 seconds)
"Thank you, I'm excited about the role. The offer is about fifteen percent below my expectation, based on market data and the on-call scope. Is there flexibility on the base? If not, could we discuss a sign-on bonus or an early salary review?"

### Offer comparison checklist
| Item | Question |
|---|---|
| Salary | Gross or net? Per month or year? How many months per year? |
| Bonus | Guaranteed or performance-based? Conditions? |
| Remote contract | Employee via EOR or contractor? Who pays tax and insurance? |
| Payment | Currency, receiving channel (Wise, bank transfer), conversion fees |
| Time | Paid time off, overlapping hours across time zones |
| Development | Learning budget, path to lead, salary review cycle |

### Real-life example
One developer accepted a remote offer of 3,200 USD/month right away because "it's already higher than salary in Vietnam". Later they found the contractor contract had no paid time off, they had to handle tax and insurance themselves — calculating out, it was lower than a 3,000 USD offer through EOR with full benefits. Next time, they asked clearly about the contract type and negotiated 12 additional paid days off plus an equipment budget.

### Useful phrases
- "I'm genuinely excited about the role."
- "The offer is a bit below what I expected."
- "Based on market data and the scope of the role, …"
- "Is there flexibility on the base salary?"
- "Could we look at other parts of the package?"
- "Could I have a day or two to review the full offer?"

### Common mistakes Vietnamese candidates make
- Accepting immediately or rejecting immediately, no negotiation.
- Not asking about gross/net or contract type when working remotely.
- "Can you give me more money?" → **"Is there any flexibility on the base salary?"**
- "Your offer is too low" → **"The offer is a bit below my expectations."**

> Senior tip: for remote work paid in USD, always convert to **annual net income** after tax, self-paid insurance, money transfer fees and unpaid days off. Two offers differing by 10% on paper can flip when fully calculated.`,
    follow: [
      'How do you handle a low offer?',
      'What matters more than base salary?',
    ]
  },
  'english-150': {
    q: 'What is your biggest weakness?',
    a: `**Summary:** This question usually comes with follow-ups **"How do you receive feedback?"** and **"What feedback have you acted on recently?"**. Choose a weakness you **discovered through feedback from others**, tell the **specific feedback**, **how you reacted**, **the change you made**, and **evidence of progress**. This way, one answer covers all three questions.

### What the interviewer wants to hear
- You **can hear difficult feedback** without being defensive.
- You **turn feedback into action** with a deadline.
- The weakness is real but **not a core skill** for the position.

### Model answer (60–90 seconds)
"One weakness I've been working on is estimating my work. I used to be too optimistic.

I realized it through feedback. In a retrospective last year, our product owner told me, quite directly, that my estimates were often off by fifty percent, and it made her planning with the client difficult. My first reaction was to explain why each task had been delayed, but I stopped and asked her for two examples instead. She was right — in both cases, I had ignored the time for testing and code review.

So I changed a few things. I started tracking my estimates against the actual time in a simple spreadsheet. I break tasks down until each part is less than a day, and I add testing and review as separate items. When something is uncertain, I give a range instead of a single number.

After two months, my estimates were within about fifteen percent most of the time, and the product owner mentioned it in my performance review. Since then, I ask for feedback on my estimates at the end of each sprint."

### Short version (30 seconds)
"I used to underestimate my tasks. Our product owner told me my estimates were often off by half. I asked for examples, started tracking estimates against actual time, and split tasks into smaller pieces. Within two months, I was usually within fifteen percent."

### How to receive difficult feedback (use when asked directly)
1. **Thank them** and stay calm — do not explain right away.
2. **Ask for specific examples** to understand correctly.
3. **Summarize** what you understood.
4. **Commit to one action** and schedule a follow-up check.

### Real-life example
One candidate answered "My weakness is I'm too perfect with code" then got stuck when asked "What feedback have you acted on recently?". Another candidate used the estimation story above — one answer covering the weakness, how they received feedback, and specific action; the interviewer moved to the next question after 90 seconds with a positive comment.

### Useful phrases
- "I realized it through feedback from…"
- "My first reaction was…, but I stopped and asked for examples."
- "She was right."
- "So I changed a few things: …"
- "Since then, I ask for feedback on…"

### Common mistakes Vietnamese candidates make
- Fake weakness or a core weakness for the position.
- Telling about feedback but no change action.
- "I received a feedback" → **"I received some feedback / a piece of feedback."**
- "I accepted it and improved" too vague → state **specific action** and **number**.

> Senior tip: connect the weakness to **one habit you maintain** (e.g., "I ask for feedback on my estimates every sprint"). A specific habit sounds more credible than any promise "I'm improving".`,
    follow: [
      'How do you receive feedback?',
      'What feedback have you acted on recently?',
    ]
  },
  'english-151': {
    q: 'What questions do you have for us?',
    a: `**Summary:** This question digs deeper than the usual closing question: **which questions show the real health of the team** (on-call, incidents, technical debt, turnover rate, decision-making) and **how to close the interview professionally** (summarize fit, ask about next steps, thank). Good questions help you decide and show you think like an insider.

### What the interviewer wants to hear
- You **evaluate the company seriously**, not just hoping to be hired.
- You ask what **people actually working there care about**.
- You **close confidently**, clearly.

### Questions to understand team health
| Want to know | Question |
|---|---|
| Operations, pressure | "How does on-call work, and how often do people get paged at night?" |
| Incident culture | "Can you tell me about the last major incident and what changed afterward?" |
| Technical debt | "How much of the team's time goes to technical debt versus new features?" |
| Decision-making | "How was the last big technical decision made?" |
| Team stability | "How long have most people on the team been here?" |
| Expectations | "What would make someone successful in this role after six months?" |

### Model answer (60–90 seconds)
"Yes, thank you. I have three questions.

First, can you tell me about the last major production incident and what changed afterward? I'm interested in how the team learns from problems.

Second, how much of the team's time goes to technical debt compared with new features, and who decides that balance?

And third, what would make someone in this role really successful after six months?

[After their answers — closing the interview]

Thank you, that's very helpful. From what you've described — the scale of the payment platform and the focus on reliability — this sounds like a strong match for my experience with Kafka and incident handling. I'm very interested in the role. Could you tell me about the next steps and the timeline?"

### Short version (30 seconds)
"Could you tell me about the last major incident and what changed afterward? And what would success look like in this role after six months? … Thank you — this sounds like a great match for my experience. What are the next steps?"

### Real-life example
One candidate asked "How was the last big technical decision made?" and heard the answer "the CTO decided in a meeting". Combined with the team having 4 out of 6 people joining in less than a year, the candidate understood the team had problems with autonomy and retention — and chose another offer. A good question protects you from a wrong choice.

### Useful phrases
- "I'm interested in how the team…"
- "Who decides that balance?"
- "From what you've described, this sounds like a strong match for…"
- "I'm very interested in the role."
- "Could you tell me about the next steps and the timeline?"
- "Is there anything else you need from me?"

### Common mistakes Vietnamese candidates make
- Ending abruptly: "OK, thank you, bye."
- Asking "test" questions that annoy the interviewer: "Why do people leave your company?" → **"How long have most people on the team been here?"**
- "What is the next step?" is fine but add timeline: **"What are the next steps and the timeline?"**
- Not taking notes on answers → lose information for comparing offers.

> Senior tip: record answers for the same set of questions at every company you interview with. After 3–4 interviews, this comparison table helps you choose an offer based on data rather than feeling — and prepare negotiation questions more accurately.`,
    follow: [
      'Which questions reveal team health?',
      'How do you close an interview?',
    ]
  },
});
