/*
 * English translation of js/data/q-english.js — task T987. Format: js/core/i18n.js (content overlay).
 * ids: english-152 english-153 english-154 english-155 english-156 english-157
 */
App.i18n.content({
  'english-152': {
    q: 'You have a discovery call with a new freelance client. What questions do you ask to clarify requirements, how do you paraphrase to confirm understanding, and how do you close the call with clear next steps?',
    a: `**Summary:** A successful **discovery call** (an exploratory call: the first call to understand what the client needs before quoting or writing code) has 3 parts: (1) ask the right questions to clarify goals, scope, and constraints; (2) **paraphrase** (restate in your own words) to confirm you understood correctly; (3) close with specific **next steps** (what happens next) and timelines. Speak slowly, avoid jargon, and follow up with a written summary after the call.

### Sample spoken answer (ready to use)
"Thank you for taking the time to meet today. Before we talk about solutions, I would like to understand your goals and the current situation.

To clarify the requirements, I would ask a few questions. First, what problem are you trying to solve, and who will use this product? Second, what does success look like - for example, faster processing, fewer errors, or more users? Third, what are the constraints: budget range, deadline, existing systems we must integrate with, and any security or compliance needs? Fourth, what is already built, and what is the highest priority for the first release?

After they answer, I paraphrase to confirm. I would say: 'Let me make sure I understand correctly. You need an internal dashboard for your operations team to track orders in near real time. The first version should show today orders, status, and basic filters. You already have a PostgreSQL database, and you want this delivered in six weeks. Is that accurate, or did I miss anything?'

To close the call, I propose clear next steps: 'Based on what we discussed, I will send a short summary of the requirements and my assumptions today. By Wednesday, I will share a rough estimate with scope, timeline, risks, and two options if needed. After you review it, we can schedule a 20-minute follow-up to confirm the plan. Does that timeline work for you?'"

### Discovery call structure (step by step)
### 1) Opening: set the goal of the call
- **What:** State clearly that you want to understand the problem, not jump into solutions.
- **Why it matters:** Clients often describe a solution ("build me an app") rather than the problem; if you misunderstand from the start, you will build the wrong thing.
- **Useful phrase:** "My goal today is to understand your needs so I can propose the right approach."

### 2) Ask to clarify (by group)
| Group | Sample questions | Purpose |
|---|---|---|
| Goals | "What problem are we solving?" "What does success look like in three months?" | Avoid building features no one uses |
| Users | "Who will use this day to day?" "How technical are they?" | Decide UI/workflow complexity |
| Scope | "What must be in the first release?" "What can wait?" | Prevent **scope creep** (scope expanding: work keeps being added beyond the agreement) |
| Constraints | "What is the deadline and budget range?" "Any systems we must integrate with?" | Assess feasibility |
| Risks | "What has been tried before?" "What worries you most?" | Surface pitfalls early |

### 3) Paraphrase: confirm understanding
- **What:** Restate the requirements in your own words, then ask "Did I get that right?"
- **Why it matters:** English may not be the first language for either side, time zones and contexts differ - misunderstandings are easy. Paraphrasing turns assumptions into shared understanding.
- **Technique:** Use numbers, role names, and specific deadlines. Avoid repeating the client's exact words (it sounds like a parrot and does not prove you understood).
- **Example:** "So, if I understand correctly, you need X for Y users by Z date, and A is out of scope for now. Is that right?"

### 4) Close with next steps
- **What:** Who does what, by when, through which channel (email, Slack, document).
- **Why it matters:** A call without next steps often "dies" - no one knows what comes next. In freelance/remote work, next steps act as a temporary verbal agreement.
- **Example:** "I will send a written summary today. I will share an estimate by Wednesday. Can we book a 20-minute follow-up on Thursday?"

### Useful phrases
- **discovery call**: an exploratory call to understand needs
- **clarify the requirements**: make the requirements clear
- **paraphrase / confirm my understanding**: restate / confirm I understood correctly
- **assumptions and constraints**: assumptions and constraints
- **out of scope for the first release**: outside the scope of the first release
- **next steps and timeline**: next steps and timeline
- **written summary**: a written summary

### Common mistakes (especially for non-native speakers)
- **Jumping into solutions too early:** The client has barely finished and you are already talking about Spring Boot and microservices. Ask about the problem first. A useful phrase: "Before suggesting a solution, could I ask a few questions?"
- **Not paraphrasing:** Staying silent and nodding because you feel hesitant. If you are unsure, ask: "Could you clarify what you mean by 'real time'?"
- **Translating word for word:** "I will do for you quickly" sounds vague. Be specific: "I can deliver a first version in two weeks."
- **Ending vaguely:** "I will contact you later" - when? Say "I will email you the summary by 5 PM Vietnam time today."
- **Too formal or too casual:** Avoid old-fashioned "Dear Sir" on a call; avoid "yeah no worries bro." Stay polite and clear: "Thank you" / "That makes sense" / "I appreciate your time."

### Short spoken version (30-45 seconds)
"Thanks for your time today. I would like to ask a few questions about your goals, users, deadline, and constraints. Let me confirm: you need X for Y, delivered by Z, and A is out of scope for now - is that correct? I will send a written summary today and a rough estimate by Wednesday. Can we schedule a short follow-up on Thursday?"

### Written version (email/Slack after the call)
"Hi [Name], thank you for the discovery call today. Here is my understanding: Goal - [goal]. Users - [users]. First release scope - [scope]. Out of scope for now - [items]. Constraints - [deadline/budget/integrations]. Assumptions - [assumptions]. Next steps: I will share a rough estimate by [date]. Please reply if anything above is incorrect. Best, [Your Name]"

> Senior tip: In freelance/remote work, a discovery call is not only about gathering requirements - it is also a chance to assess the "health" of the client: do they answer clearly, do they respect boundaries, and who is the decision maker? Write down assumptions immediately after the call - many scope disputes later come from things that were only said verbally.`,
    follow: [
      'How do you handle a client who gives vague answers like "make it fast and modern"?',
      'What red flags would you look for during a discovery call with a new client?',
      'How would you paraphrase if you are not sure you understood a technical constraint?',
    ],
  },
  'english-153': {
    q: 'How do you give a time and cost estimate to a non-technical client, including assumptions and risks, without sounding vague or overconfident?',
    a: `**Summary:** A good **estimate** (a prediction of time/cost based on current information, not a guaranteed commitment) for a non-technical client should include: clear scope, assumptions, risks, and a range rather than a single number. Explain in terms of business outcomes, state what can change the estimate, and propose ways to reduce risk (phased delivery, early validation).

### Sample spoken answer (ready to use)
"Based on what we discussed, here is my estimate for the first release.

The scope includes user login, the orders dashboard, and CSV export. I estimate this will take about four to six weeks and cost between X and Y. I am giving a range because the final effort depends on a few assumptions.

My assumptions are: we will use your existing PostgreSQL database; your team can provide API access or sample data within the first week; and the design will be based on a simple template, not a fully custom design. If any of these change, the timeline and cost may change as well.

The main risks are integration delays, unclear requirements, and data quality issues. For example, if the database structure is different from what we expect, connecting the dashboard may take longer. To reduce risk, I suggest we start with a one-week discovery and prototype. After that, I can confirm a more precise estimate.

I will also flag any scope changes early, so there are no surprises. Would you like me to send this estimate in writing with the assumptions listed clearly?"

### Estimate structure that is easy for non-technical clients to understand
### 1) State the scope first
- **What:** List what is included in the estimate and what is not.
- **Why it matters:** A client hears "6 weeks" but may assume it includes everything. Vague scope is the root of disputes.
- **Example:** "This estimate covers A, B, and C. It does not include mobile apps, payment integration, or data migration."

### 2) Give a range, not a single number
- **What:** "4 to 6 weeks" instead of "5 weeks".
- **Why it matters:** Software has uncertainty. A single number sets the wrong expectation; when you slip, the client loses trust. A range shows controlled honesty.
- **Everyday analogy:** Like a contractor saying "2 to 3 days depending on the condition of the pipes after we open the wall" - they do not yet know what is hidden.

### 3) List assumptions
- **What:** Things you treat as true for the estimate to hold.
- **Why it matters:** When an assumption is wrong, the estimate is wrong - and that is not "you working slowly", it is changed input.
- **Example assumptions:** the client provides access on time; there is a single decision maker; requirements do not change after sign-off; sample data is available.

### 4) State risks and mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Unclear requirements | Rework, delay | Write a summary + get confirmation before coding |
| Legacy system integration | Time increases | Verify access/data in week 1 |
| Dirty/missing data | Wrong export/dashboard | Get sample data early |
| Mid-stream feature additions | **Scope creep** | Route every change through an impact assessment |

### 5) Propose next steps
- Break it down: discovery/prototype → firmer estimate → implementation.
- Send it in writing: non-technical clients need a document they can reread and discuss internally.

### Useful phrases
- **rough estimate / detailed estimate**: a rough estimate / a detailed estimate
- **range (four to six weeks)**: a range (four to six weeks)
- **assumptions**: assumptions
- **dependencies**: dependencies (things another party must finish first)
- **risk and mitigation**: risk and mitigation
- **flag scope changes early**: flag scope changes early
- **no surprises**: no surprises

### Common mistakes (especially for non-native speakers)
- **Giving a single number to "sound sure":** "It will take 10 days" and then you hit a risk. Use a range and explain it.
- **Using too much jargon:** "We need to refactor the microservice and set up CI/CD" will confuse a non-technical client. Talk about outcomes: "We need about one week to connect to your existing system safely."
- **Not writing assumptions down:** Assumptions said only verbally get forgotten. Always send them in writing.
- **Avoiding risk talk to avoid losing the client:** Mature clients appreciate transparency. Stating risks with mitigations shows experience.
- **Translating word for word:** "I think maybe can finish fast" sounds unconfident. Say: "My current estimate is four to six weeks, based on these assumptions."

### Short spoken version (30-45 seconds)
"For the scope we discussed - A, B, and C - I estimate four to six weeks, in the range of X to Y. This assumes we get system access and sample data in week one and the scope stays the same. The main risks are integration delays and unclear requirements. I suggest a one-week discovery first so I can confirm a more precise estimate. I will send the details in writing today."

### Written version (email/Slack)
"Subject: Estimate for [Project] - first release. Scope: [A, B, C]. Out of scope: [items]. Estimate: [time range], [cost range]. Assumptions: [1-3]. Risks: [1-3] with mitigation. Next step: confirm scope and schedule a one-week discovery starting [date]. Any scope change will be reviewed for impact on timeline and cost before work begins."

> Senior tip: Do not negotiate by silently cutting quality (dropping tests, skipping error handling) - that technical debt will come back and delay you more. When a client wants it cheaper or faster, negotiate on **scope**: "If we need to fit two weeks, I recommend we deliver only A and B first, and move C to phase two." Always label it "estimate, not a fixed commitment" unless you have signed a fixed-price contract with a locked scope.`,
    follow: [
      'How would you respond if the client says your estimate is too high and asks you to cut it in half?',
      'What is the difference between a fixed-price estimate and a time-and-materials estimate, and how would you explain it?',
      'How do you update an estimate when a key assumption turns out to be wrong?',
    ],
  },
  'english-154': {
    q: 'A client keeps adding new requests outside the agreed scope (scope creep). How do you push back politely while keeping a good relationship?',
    a: `**Summary:** **Scope creep** (scope expanding: the client keeps adding new work beyond what was agreed) is common in freelance/remote work. Pushing back politely is not saying a blunt "No" - it is: acknowledge the need, point out the impact on time/cost/scope, and offer clear options (move to a later phase, swap priorities, or quote it separately). Always ground the conversation in a written agreement.

### Sample spoken answer (ready to use)
"I understand why this feature would be useful, and I can see how it could help your team.

At the same time, this request is outside the scope we agreed on for the current release. Adding it now would affect the timeline and the cost. If we include it in this phase, I estimate it would add about one extra week.

I can suggest three options. Option one: we keep the current scope and deliver on the planned date, and I add this request to phase two. Option two: we replace a lower-priority item in the current scope with this new request, so the timeline stays similar. Option three: I prepare a separate estimate for this feature, and we treat it as an additional piece of work.

Which option works best for you? I can send a short summary of the impact so you can decide."

### Breaking it down (why say it this way)
### 1) Acknowledge first
- **What:** "I understand why..." / "That makes sense..."
- **Why it matters:** The client does not feel rejected; the conversation stays collaborative. Everyday analogy: like a doctor listening to the symptoms before saying "this medicine is not the right fit."
- **Note:** Acknowledging the need is not the same as agreeing to do it for free.

### 2) State the facts based on the agreement
- **What:** "This is outside the scope we agreed on for the current release."
- **Why it matters:** It brings the conversation back to the agreed scope, not to emotions. If you have a document (proposal, confirmation email), reference it gently: "Based on the scope we confirmed on [date]..."
- **Terms:** **scope** = the boundaries of the work; **deliverable** = something you hand over.

### 3) State the impact
- **What:** Time, cost, quality risk.
- **Why it matters:** A non-technical client may think "just a small change." You need to translate the impact: "It also affects testing and the release date."

### 4) Offer options, not just "No"
| Option | When it fits | Sample phrase |
|---|---|---|
| Move to phase 2 | Useful but not urgent | "We can schedule it for the next release." |
| Swap priorities | Fixed deadline | "We can replace item C with this, if C can wait." |
| Quote separately (change request) | Client wants it now | "I can send a separate estimate for this work." |

### 5) Ask for a decision and confirm in writing
- "Which option do you prefer?" - it puts the trade-off decision back to the client (they choose the trade-off).
- After the call: send an email summarizing the chosen option to avoid misunderstandings.

### Useful phrases
- **scope creep**: scope expanding beyond what was agreed
- **outside the agreed scope**: outside the agreed scope
- **impact on timeline and cost**: impact on timeline and cost
- **change request**: a request to change scope (usually with an impact assessment)
- **trade-off / prioritize**: trade-off / prioritize
- **phase two / next release**: phase two / next release
- **keep the relationship positive**: keep the relationship positive

### Common mistakes (especially for non-native speakers)
- **Saying "Yes" right away to avoid friction:** You agree verbally to keep the peace, then overload yourself and miss the deadline - in the end the relationship suffers more. Be polite but clear.
- **Saying a hard "No":** "I cannot do that. It is not in scope." - correct in meaning but sounds confrontational. Add an acknowledgment + options.
- **Not stating concrete impact:** "It will take more time" is vague. Say "about one extra week" or "I need to review and send an estimate by tomorrow."
- **Only verbal:** The client forgets and asks again next week. Always confirm the chosen option by email/Slack.
- **Translating word for word:** "I very busy cannot add more" (bad grammar, sounds rude). Say: "I want to make sure we deliver the current scope with good quality. Adding this now would affect the timeline."

### Short spoken version (30-45 seconds)
"I understand why this would be helpful. This request is outside the scope we agreed on, so adding it now would affect the timeline and cost. I can suggest three options: move it to phase two, replace a lower-priority item, or treat it as a separate change request with a new estimate. Which option works best for you?"

### Written version (email/Slack)
"Hi [Name], thanks for sharing the request about [feature]. I see the value. Since this is outside the current agreed scope, it would affect our timeline/cost. Options: (1) keep current scope and deliver on [date], add this to phase two; (2) swap it with [lower-priority item]; (3) I send a separate estimate for this change request. Please let me know your preferred option, and I will confirm the plan in writing."

> Senior tip: Preventing scope creep is better than curing it: in the discovery call (english-152), clearly document "in scope / out of scope" and how change requests are handled. When a client gets used to adding "small things," bundle the small changes and report the cumulative impact - many small changes still delay a release. Keep a collaborative tone ("help you choose the best option") rather than a defensive one.`,
    follow: [
      'What if the client says "it is just a small change, can you do it quickly for free"?',
      'How do you document and track scope changes in a remote freelance project?',
      'How would you handle scope creep when there is no written contract or scope document?',
    ],
  },
  'english-155': {
    q: 'You need to deliver bad news to a non-technical client: either a delayed deadline or a serious production bug. How do you explain it clearly, take responsibility, and propose a plan?',
    a: `**Summary:** Bad news (a delayed deadline or a serious **production bug**: an issue in the live system serving real users) must be delivered **early, clearly, and with ownership**. For a non-technical client: lead with impact, give a short plain-language cause, avoid blame, and propose an action plan with timelines + how you will update them. The goal: the client trusts that you are in control of the situation.

### Sample spoken answer - delayed deadline
"Hi [Name], I want to give you an early update. We will not be able to release on Friday as planned. I expect we will need about five more business days, with a new target of next Friday.

The reason is that during final testing we found an issue that could cause some orders to be processed twice in rare cases. I know this is disappointing, and I take responsibility for not catching this risk earlier.

The impact is limited to the release date. The work already completed is still valid, and no customer data has been affected. Our plan is: fix the issue by Tuesday, re-test the full payment flow by Thursday, and release on Friday. I will send you a short progress update every day at 4 PM your time until release.

I chose to delay rather than release with this risk, because incorrect orders would create a bigger problem for your customers. Please let me know if this new date affects any plans on your side, and I will help adjust."

### Sample spoken answer - serious production bug
"Hi [Name], I need to inform you about a production issue we found today.

What happened: between 9:10 and 9:40 AM, some customers may have seen an error when submitting orders. About 3 percent of order attempts were affected. We have already applied a temporary fix, and the system is stable now.

What this means for your business: some customers may need to retry their order. We are checking logs to confirm whether any order was charged twice or lost. I will share a confirmed impact report within two hours.

Why it happened, in simple terms: a change we released this morning exposed a weakness in how the system handles repeated requests. I am responsible for the release process, and I should have added a stronger safety check.

Next steps: finish the impact check, send you the confirmed numbers, apply a permanent fix today, and add extra checks so this type of issue is caught before release. I will update you every 30 minutes until the impact check is complete. Do you want me to also prepare a short message you can share with affected customers?"

### Bad-news structure (step by step)
### 1) Be direct, be early
- **What:** "I want to give you an early update." / "I need to inform you about an issue."
- **Why it matters:** Clients hate last-minute surprises. Early notice gives them time to adjust plans (marketing, operations).

### 2) Lead with impact, technical details after
- **What:** Who is affected, how many, for how long, and whether data/money is safe.
- **Why it matters:** A non-technical client cares about "how does this affect my business?" Avoid opening with a stack trace or library names.

### 3) Give a short cause, no blame
- **What:** One or two sentences in plain language. "A change exposed a weakness in how the system handles repeated requests."
- **Why it matters:** Blaming (another team, the client, "the server") destroys trust. Own the parts you control.
- **Term:** **root cause** (the underlying cause) can come later in a detailed report; when delivering bad news, prioritize clarity.

### 4) Plan + timeline + update cadence
- What actions, by when, who confirms.
- "I will update you every 30 minutes / daily at 4 PM." - a predictable update cadence reduces client anxiety.

### Table: say this / avoid this
| Situation | Avoid | Say instead |
|---|---|---|
| You do not know everything yet | "I don't know, maybe server problem" | "We have stabilized the system. I am confirming the exact impact and will report back in two hours." |
| It was your mistake | "Someone on my team made a mistake" | "I take responsibility for the release process." |
| Client is panicking | "This is very serious!!!" (alarming) | "The system is stable now. Here is the confirmed impact and our next steps." |
| Deep technical detail | "NullPointerException in the idempotency interceptor" | "The system sometimes processed the same request twice." |

### Useful phrases
- **early update / heads-up**: an early update / a heads-up
- **production issue / outage**: an issue in the live system / a service outage
- **impact**: impact
- **temporary fix / permanent fix**: a temporary fix / a permanent fix
- **take responsibility**: take responsibility
- **confirmed numbers**: confirmed numbers
- **next update at...**: next update at...

### Common mistakes (especially for non-native speakers)
- **Hiding bad news until the last minute:** Hoping to "fix it in time" and staying silent - when it really slips, the client has no time to react.
- **Blaming others:** "The QA did not test enough" / "The client changed requirements" - even if partly true, when delivering bad news focus on the solution and what you control.
- **Apologizing too much, no plan:** Repeating "I am so sorry sorry sorry" sounds out of control. Apologize once, briefly, then move to action.
- **Using alarming jargon:** "database corrupted" when it is actually just a slow query - be accurate but easy to understand.
- **Mixing tenses:** Describe past events with past tense: "The issue started at 9:10 AM and affected 3 percent of requests." Plans use future/present: "We will send an update every 30 minutes."

### Short spoken version (30-45 seconds)
"Hi [Name], early update: we found a production issue affecting about 3 percent of orders between 9:10 and 9:40 AM. We have applied a temporary fix and the system is stable now. I am confirming the exact impact and will send a report within two hours. Next, we will apply a permanent fix today and add checks to prevent this. I will update you every 30 minutes until the impact check is done."

### Written version (email/Slack)
"Subject: Production update - [service] [date/time]. Summary: [impact, who affected, time window]. Current status: stable / mitigated at [time]. Confirmed impact: [numbers or 'checking, update by HH:MM']. Cause (plain language): [1-2 sentences]. Actions: (1) [done], (2) [in progress, ETA], (3) [prevention]. Next update: [time]. I take responsibility for [part you own] and will keep you informed."

> Senior tip: During a production bug, separate the 3 questions clients always ask: "Is the system stable now?", "Are customers/money/data affected?", "When will we have confirmed numbers?" Answer those 3 in the first 30 seconds. Do not guess numbers - "checking, confirmed report by 11:30" is better than guessing wrong and having to correct yourself later.`,
    follow: [
      'How would you answer if the client asks "Can you guarantee this will never happen again"?',
      'What should you do if you do not yet know the full impact but the client is demanding details now?',
      'How do you follow up after the incident is resolved to rebuild trust?',
    ],
  },
  'english-156': {
    q: 'How do you write a clear daily async update and a weekly report for a remote client or team?',
    a: `**Summary:** Working **remote** (from a different location, not in the same office) and **async** (asynchronous: no immediate reply required; others read when they are online) requires clear written updates. A **daily update** should be short: done, next, blockers. A **weekly report** summarizes progress, risks, decisions needed from the client, and next week's plan. Write so the reader can understand without scheduling another meeting.

### Sample spoken answer (explaining how you do it)
"For daily updates, I keep them short and predictable so the client can scan them quickly. I usually share three parts: what I completed yesterday, what I plan to do today, and whether I have any blockers. If there is a blocker, I also say what I need and by when.

For weekly reports, I focus on outcomes, not just activity. I summarize what was delivered, what is in progress, what risks or decisions need attention, and the plan for next week. I include links to demos, pull requests, or documents so the client can verify progress without a meeting."

### Sample daily async update (Slack/email)
"Daily update - [Date] - [Project]
- Done yesterday: Completed the order filter API and added tests for date range and status. PR: [link].
- Plan today: Connect the dashboard table to the new API and handle empty/error states.
- Blockers: I need sample data for cancelled orders to verify the filter. Could you share it by 2 PM UTC today? If not, I will proceed with mock data and note the assumption.
- ETA / risk: Still on track for Friday demo."

### Sample weekly report
"Weekly report - [Week of Date] - [Project]

1. Summary
- Goal this week: deliver the first version of the orders dashboard.
- Status: On track / At risk / Delayed (choose one). Current progress: about 70 percent of phase 1.

2. Completed this week
- Orders list with filters (status, date range).
- CSV export for the current view.
- Basic error handling and loading states.
- Demo link: [link].

3. In progress
- Role-based access (admin vs viewer): 60 percent, target completion Wednesday next week.

4. Risks and blockers
- Risk: Production database access is still pending. Impact: may delay final integration testing by 2 days. Mitigation: I am using staging data now; need access by Tuesday.
- Decision needed: Should cancelled orders be visible to viewer role? Please confirm by Monday.

5. Plan for next week
- Finish role-based access.
- Run integration testing with production-like data.
- Prepare release checklist and handover notes.

6. Time / budget note (if relevant)
- Hours used this week: X. Estimated remaining for phase 1: Y."

### First principles: why async updates matter
- **What:** A written message/report meant to be read later, without a meeting.
- **Why it matters:** The client may be in a different time zone (e.g., the US is 11-12 hours behind Vietnam). If everything requires a meeting, the project slows down and everyone gets tired. A good update creates **visibility** (line of sight: the client can see work is moving).
- **Everyday analogy:** Like a progress board posted at a construction site entrance - the owner can still see what was done today when they come home from work.
- **Common pitfall:** Only reporting "working on it" (vague) or writing something too long (no one reads it). Be specific, include links, include an ETA.

### Useful phrases
- **async update**: an asynchronous update
- **on track / at risk / delayed**: on track / at risk / delayed
- **blocker**: something blocking progress (needs someone else to unblock)
- **ETA (estimated time of arrival)**: estimated time of completion
- **decision needed**: a decision needed (from the client/manager)
- **action item**: a specific task to do
- **demo / deliverable**: a demo / a deliverable

### Common mistakes (especially for non-native speakers)
- **Writing "I am working on it" every day:** The client does not know what "it" is or how far along you are. State concrete outcomes: "Completed X, tested Y."
- **Not raising blockers early:** You struggle alone for 3 days, then report a delay. Raise blockers immediately, with what you need.
- **Weekly report only lists what was done:** Clients also need risks and decisions. Add "Decision needed by Monday."
- **Wrong tenses:** Use past tense for completed work: "Completed / Fixed / Sent". Use future/present for plans: "I will connect..." / "Plan today: connect..."
- **Overly formal or copy-pasting a stiff template:** Write naturally and clearly. Avoid empty filler like "I hope this email finds you well" in a daily update - get straight to the point.

### Short spoken version (if a client asks how you report)
"I send a short daily async update with what I finished, what I plan next, and any blockers with what I need. Every week I send a report with progress, risks, decisions needed, and next week's plan, plus links to demos or pull requests so you can review without an extra meeting."

### Written version (very short chat when busy)
"Update [date]: Done - [result + link]. Today - [task]. Blocker - [none / need X by Y]. ETA - on track for [date]."

> Senior tip: Send your update at the same time every day (in the client's time zone) to build a habit - the client will not need to ask "how is it going?". In a weekly report, always include a "Decision needed" section, even if it is "None this week" - it shows the client you are proactively managing risk, not just writing code.`,
    follow: [
      'What should you do when you have no visible progress to report because you were debugging all day?',
      'How do you write an update when you missed the planned goal for the week?',
      'How would you adjust your update style for a very technical CTO versus a non-technical founder?',
    ],
  },
  'english-157': {
    q: 'You receive harsh feedback from a client or an uncomfortable code review comment. How do you respond professionally in English and move the work forward?',
    a: `**Summary:** A professional response to harsh feedback is built on 4 steps: **pause** (stop; do not reply hot), **clarify** (make the specific issue clear), **respond to the issue, not the tone** (address the problem, not the attitude), and **commit to action** (commit to concrete next steps). The goal is to protect the quality of the work and the relationship, not to "win" an argument.

### Sample spoken answer (when feedback comes in a call)
"Thank you for sharing this feedback. I can hear that this caused frustration, and I want to understand it clearly so I can fix it.

Could you help me pinpoint the main issues? For example, is the concern about the missed deadline, the quality of the release, or the way I communicated updates? I want to make sure I address the right problem.

If the issue is [specific issue], I agree that it is not acceptable. Here is what I propose: I will [action 1] by [time], [action 2] by [time], and I will update you at [time]. If I misunderstood anything, please correct me."

### Sample written response (email/Slack, when feedback is harsh)
"Hi [Name], thank you for the feedback. I understand your concern about [specific issue]. I would like to address it directly.

What I understand: [paraphrase the concern in neutral language]. What I will do: (1) [action] by [time], (2) [action] by [time]. What I need from you (if anything): [clarification/data/decision]. I will send the next update at [time]. If I missed part of your concern, please let me know and I will adjust the plan."

### Sample uncomfortable code review response (public comment)
- Original comment (uncomfortable): "This code is terrible. Did you even test it?"
- Professional reply: "Thanks for reviewing. You are right that this path needs stronger testing. I missed the case where [case]. I will add tests for [cases] and refactor [part] to make the logic clearer. I will push an update today. If you see other risky cases, I would appreciate specific examples so I can cover them."

### Step by step
### 1) Pause
- **What:** Do not reply immediately when you are upset. In chat: wait 10-20 minutes, then reread.
- **Why it matters:** Emotional reactions make things worse. Remote work has no facial cues or tone of voice - written text is easy to read more harshly than you intended.
- **Everyday analogy:** Like getting honked at in traffic - honking back immediately escalates the situation.

### 2) Clarify
- **What:** Separate emotion from facts. Ask for specific examples.
- **Sample phrases:** "Could you share a specific example?" / "Which part of the deliverable did not meet your expectations?"
- **Why it matters:** Vague feedback ("this is bad") cannot be fixed. Specific feedback ("the report misses cancelled orders") is actionable.

### 3) Respond to the issue, not the tone
- **What:** Do not write "Your tone is rude" while you are still trying to resolve the work.
- **Why it matters:** Arguing about tone often derails the conversation. If there is a real problem, fixing the problem reduces tension. (If disrespectful behavior repeats and crosses boundaries, that is a different issue - address it separately, calmly, with evidence.)
- **Technique:** **Paraphrase** the concern in neutral language.

### 4) Commit to action
- State what you will do, by when, and how you will update. Concrete actions rebuild trust faster than long explanations.

### Useful phrases
- **I appreciate the feedback**: I appreciate the feedback
- **I want to understand the concern clearly**: I want to understand the concern clearly
- **Could you share a specific example?**: Could you share a specific example?
- **You are right that...**: You are right that... (acknowledge the valid part)
- **Here is what I will do...**: Here is what I will do...
- **If I misunderstood, please correct me**: If I misunderstood, please correct me

### Common mistakes (especially for non-native speakers)
- **Getting defensive:** "But you did not give me clear requirements" - even if partly true, saying it right when receiving feedback sounds like blame-shifting. Address the issue first; discuss process later when things are calm.
- **Going silent out of fear:** Not replying makes the client think you have dropped the ball. At minimum, acknowledge: "I have received your feedback and I will respond with a plan by 3 PM."
- **Translating word for word:** "You say wrong with me" (incorrect). Say: "I see it differently, but I may be missing context. Could we review the example together?"
- **Vague apologies:** "Sorry for everything" - unclear what you will fix. Apologize specifically if you were wrong: "I am sorry I missed the update yesterday."
- **Too emotional in writing:** ALL CAPS, lots of exclamation marks, or long accusatory sentences. Remote text has no voice - keep it short and neutral.

### Short spoken version (30-45 seconds)
"Thank you for the feedback. I want to understand the main concern clearly - could you point to a specific example? If the issue is [issue], I agree it needs to be fixed. I will [action] by [time] and update you at [time]. Please let me know if I missed anything."

### Written version (short Slack)
"Thanks for the feedback. I understand the concern is [issue]. I will [action] by [time] and share an update at [time]. If I missed part of your point, please share a specific example and I will address it."

> Senior tip: Distinguish between "hard-to-hear but valid feedback" and "repeated disrespectful behavior." For the former, focus on fixing the work and learning. For the latter, stay calm, respond to the work in writing (to keep a record), and if needed set a boundary privately: "I want to resolve this. I can do my best work when we keep the discussion focused on the issue." Do not get into long public arguments.`,
    follow: [
      'How would you respond if the client\'s harsh feedback is based on a misunderstanding of what was agreed?',
      'What do you do if a code reviewer repeatedly leaves sarcastic or personal comments?',
      'How can you ask for clearer, more actionable feedback without sounding defensive?',
    ],
  },
});
