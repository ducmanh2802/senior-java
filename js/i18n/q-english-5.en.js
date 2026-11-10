/*
 * English translation of js/data/q-english.js — task T225 (re-translated in T524, T1171). Format: js/core/i18n.js (content overlay).
 * ids: english-058 english-059 english-060 english-061 english-062 english-063
 */
App.i18n.content({
  'english-058': {
    q: 'What questions should you ask the interviewer at the end?',
    a: `**Summary:** Questions at the end are **part of the evaluation**. Choose 2–3 questions that show you think like someone who will do the job (team, ways of working, real challenges, expectations for the first 90 days), plus questions you **truly need answered** to make a decision. Avoid questions whose answers are already on the website, and avoid focusing only on salary or time off in a technical round.

### What the interviewer wants to hear
- You **genuinely care** about the work, not just the offer.
- You know how to **ask the right person**: technical topics with engineers, career growth with a manager, benefits with HR.
- Your questions show that you have already **pictured yourself** in the role.

### Model answer (60–90 seconds)
"Yes, I have a few questions.

First, what would success look like for this role in the first three months? What would you expect me to have delivered or learned by then?

Second, what's the biggest technical challenge the team is facing right now? For example, is it scaling, reliability, or paying down technical debt?

And third, how does the team handle production issues? Is there an on-call rotation, and how are postmortems done?

If there's time, I'd also love to know how decisions about architecture are made — is it mostly within the team, or is there a central architecture group?"

### Questions by interviewer
| Interviewer | Good question to ask |
|---|---|
| Engineer | "What does a typical deployment look like, from merge to production?" |
| Tech lead | "What's one thing you'd like to change about how the team works?" |
| Engineering manager | "How do you support engineers who want to grow into a lead role?" |
| HR | "What are the next steps, and when can I expect to hear back?" |

### Short version (30 seconds)
"What would success look like in the first three months? And what's the biggest technical challenge the team is facing right now?"

### Real-life example
One candidate asked, "What does your company do?" — information that was already on the homepage — and left an impression of poor preparation. Another candidate asked, "How does the team handle on-call, and what was the last major incident like?" and got 10 minutes of honest sharing about the system; the interviewer wrote in the feedback, "asks the right questions, thinks like an owner." The answer also helped the candidate learn that the team had serious operational issues — important information for negotiation and decision-making.

### Useful phrases
- "What would success look like in the first 90 days?"
- "What's the biggest challenge the team is facing right now?"
- "How are technical decisions made here?"
- "What do you enjoy most about working here?"
- "Is there anything about my background that you'd like me to clarify?"
- "What are the next steps in the process?"

### Common mistakes for Vietnamese speakers
- "No, I don't have any questions" → it sounds like you do not care; always prepare at least 2 questions.
- Questions that are too long and pack in too many ideas → ask one short question at a time.
- "Can you tell me about the salary and OT?" in a technical round → save that for HR.
- "What is the challenge of team?" → **"What's the biggest challenge the team is facing?"**
- "How many people in team?" → **"How many people are on the team?"**

> Senior tip: the question "Is there anything about my background that you'd like me to clarify?" gives you a chance to fix a wrong impression **right in the interview** — many candidates recover points with this question.`,
    follow: ['How do you close an interview professionally?', 'What follow-up email should you send?']
  },
  'english-059': {
    q: 'How do you clarify an ambiguous requirement with a stakeholder?',
    a: `**Summary:** When a requirement is vague, do not guess and do not ask "What do you mean?". **Restate what you understood**, ask about the **goal and the users**, give **concrete examples / edge cases** for them to choose from, then **confirm in writing** (acceptance criteria). In an interview, tell a real situation following those steps.

### What the interviewer wants to hear
- You ask about the **"why"** (business goal) before the **"how"**.
- You turn a vague requirement into something **verifiable**.
- You communicate respectfully with non-technical people and **write down the agreement**.

### Model answer (60–90 seconds)
"Last quarter, our product manager asked for 'a faster export feature'. That could mean many things, so I set up a short call.

First, I repeated what I understood: 'Just to make sure I understand correctly, customers find the CSV export too slow — is that right?' Then I asked about the goal: who uses it, how big the files are, and what 'fast enough' means for them.

It turned out the real problem was that exports over 100,000 rows timed out after 30 seconds, and finance needed them every Monday. So I offered two options with examples: make the export run in the background and email a download link, or limit exports to one month of data. The PM chose the background option.

After the call, I wrote the acceptance criteria in the ticket — for example, 'an export of 500,000 rows completes within five minutes and the user receives an email' — and asked the PM to confirm. That saved us from building the wrong thing, and the feature shipped in one sprint."

### Short version (30 seconds)
"When a requirement is vague, I restate what I understood, ask about the goal and the users, offer concrete options with examples, and then confirm the acceptance criteria in writing. That way we build the right thing the first time."

### Real-life example
A team received the requirement "add search to the admin page" and built full-text search with Elasticsearch, which took 3 weeks. What users actually needed was to search by **exact order ID** — a simple indexed query was enough. After that, the team adopted a rule: every vague ticket must have at least 2 input/output examples confirmed by the requester before estimation.

### Useful phrases
- "Just to make sure I understand correctly, …"
- "What problem are we trying to solve for the user?"
- "Could you give me an example of…?"
- "What would 'fast enough' look like for you?"
- "We have two options: … Which one fits better?"
- "I'll write this down in the ticket — could you confirm it?"

### Common mistakes for Vietnamese speakers
- "What do you mean?" can sound blunt → **"Could you tell me a bit more about…?"**
- Staying silent and building based on your own interpretation because you are afraid to ask.
- Asking overly technical questions to a PM: "Should we use async processing?" → **"Is it OK if the export arrives by email a few minutes later?"**
- "I want to confirm again your requirement" → **"I'd like to confirm the requirement."**

> Senior tip: the habit of "rewriting the requirement into 2–3 concrete examples and asking for confirmation" takes 10 minutes but saves weeks of rework. Mention it in interviews with a real example — interviewers love the number "saved us X weeks".`,
    follow: ['How do you handle conflicting stakeholders?', 'What if requirements change mid-sprint?']
  },
  'english-060': {
    q: 'How do you give and receive code review feedback?',
    a: `**Summary:** When **giving** feedback: talk about the **code and its impact**, not the person; clearly separate **blocking** issues from **suggestions**; ask questions instead of giving orders when you are not sure. When **receiving** feedback: thank the reviewer, ask for clarification if you do not understand, fix the issue or explain your reasoning with data, and do not get defensive. In an interview, give a principle plus a concrete example.

### What the interviewer wants to hear
- You review to **improve the code and help others grow**, not to show off.
- You know how to **prioritize** (correctness, security, maintainability) over personal preference.
- You **handle disagreement** professionally.

### Model answer (60–90 seconds)
"When I give feedback, I focus on the code and its impact, not on the person. I usually label my comments: 'blocking' for things like a missing transaction or a security issue, and 'nit' or 'suggestion' for style. If I'm not sure, I ask a question instead of giving an order — for example, 'What happens if this list is empty?' I also try to point out something done well, so the review doesn't feel like a list of mistakes.

When I receive feedback, I start from the assumption that the reviewer is trying to help. If I don't understand a comment, I ask for an example. If I disagree, I explain my reasons with data, and if we still can't agree after two rounds, we jump on a quick call instead of writing long threads.

For example, a colleague once pointed out that my retry logic could charge a customer twice. My first reaction was to defend it, but he was right. I added an idempotency key and thanked him in the PR. Since then, I've added 'retries on payment calls' to our review checklist."

### Short version (30 seconds)
"I give feedback on the code, not the person, and I label comments as blocking or suggestions. When I receive feedback, I assume good intent, ask questions if I'm unsure, and move long debates to a quick call."

### Real-life example
A team had harsh reviews with comments like "This is wrong. Rewrite." Juniors were afraid to open PRs, so PRs piled up and grew large. The team agreed on label conventions (blocking / suggestion / nit / question) and a rule: "if a debate goes past 2 rounds, take a 10-minute call." After 2 months, the average PR size was cut in half, and review wait time dropped from 2 days to 6 hours.

### Useful phrases
- "Blocking: this needs a transaction, otherwise…"
- "Suggestion / nit: we could extract this into a method."
- "What happens if…?" / "Have you considered…?"
- "Nice approach here — much easier to read."
- "Good catch, thanks! I'll fix it."
- "I see your point. My concern is… Could we discuss it quickly on a call?"

### Common mistakes for Vietnamese speakers
- Writing too briefly, which sounds like an order: "Change this." → **"Could we change this to…? It avoids…"**
- Using "you" to blame: "You forgot the null check" → **"This could throw an NPE when the list is empty."**
- When receiving feedback: "No, it's correct" → **"I chose this because… but I'm open to changing it."**
- "Thanks for your review my code" → **"Thanks for reviewing my code."**

> Senior tip: in an interview, mention a **review checklist** you created or improved (transactions, idempotency, logging sensitive data, migrations). It shows that you turn review experience into an asset for the whole team.`,
    follow: ['How do you review a large PR?', 'How do you handle a stubborn reviewer?']
  },
  'english-061': {
    q: 'Describe a weakness honestly in an interview.',
    a: `**Summary:** Choose a **real** weakness that is **not a core skill** for the role, show how you **noticed it**, what **concrete steps** you are taking to improve, and what **progress** you have made (with evidence). Avoid "I'm a perfectionist" or "I work too hard" — interviewers hear these hundreds of times and see them as avoidance.

### What the interviewer wants to hear
- You have **self-awareness**.
- You **actively improve**, with actions and measurable results.
- The weakness does **not break** the role you are applying for.

### Model answer (60–90 seconds)
"One weakness I've been working on is that I used to take on too much work myself instead of delegating. As I became more senior, I'd often fix things quickly on my own because it felt faster.

I realized it was a problem during a release last year. I was the only person who understood our payment reconciliation job, and when I got sick for three days, the team was blocked.

Since then, I've made a few concrete changes. When I pick up a complex task, I pair with a teammate for at least part of it. I write a short runbook for every job I own. And in sprint planning, I deliberately give the tasks I know best to someone else and offer to review instead.

It's still something I watch, but the results are clear: two other engineers can now handle the reconciliation job, and in our last retrospective the team said knowledge sharing had improved a lot."

### Short version (30 seconds)
"I used to do too much myself instead of delegating. After I became a bottleneck during a release, I started pairing, writing runbooks and handing my familiar tasks to teammates. Now two other engineers can run the jobs I used to own alone."

### "Safe" weaknesses that can still be real
| Weakness | Improvement you can describe |
|---|---|
| Hesitant to speak in large meetings / in English | Prepare 3 points in advance, practice speaking weekly, volunteer to present demos |
| Taking on too much, not delegating | Pairing, runbooks, give tasks you know well to others |
| Overly optimistic estimates | Track estimates vs. actuals, add buffer, break work into smaller tasks |
| Going too deep into technical details | Set a timebox, ask "what's the decision we need?" |

### Real-life example
A candidate answered, "My weakness is I'm too detail-oriented" — the interviewer followed up with "Give me an example where that hurt your team" and the candidate got stuck. Next time, they chose a real weakness about **presenting in English**, described joining a weekly speaking group and volunteering to do sprint demos — with a result: "I've presented four sprint demos to our client in English this quarter." The feedback noted "self-aware and proactive."

### Useful phrases
- "One area I've been working on is…"
- "I realized it was a problem when…"
- "Since then, I've made a few concrete changes: …"
- "It's still something I keep an eye on, but…"
- "The result is that…"

### Common mistakes for Vietnamese speakers
- Choosing a weakness that is core to the role ("I'm not good at Java" for a Senior Java position).
- Stating the weakness without any improvement action.
- "My weakness is I am shy" is too vague → describe a specific situation and how you addressed it.
- "I am improving it by myself" → **"I've been improving it by…"** (+ concrete actions).

> Senior tip: choose a weakness with a **progress story backed by numbers or feedback from others**. Interviewers do not score the weakness — they score your ability to fix it.`,
    follow: ['What is your greatest strength?', 'How do you handle feedback about a weakness?']
  },
  'english-062': {
    q: 'Tell me about a time you mentored a junior developer.',
    a: `**Summary:** Tell the story using **STAR**, with the focus on **how the person you mentored improved**, not on how good you are. Be clear about their **starting point**, the **methods** you used (pairing, reviews with explanations, gradually harder tasks, 1:1s), and **measurable results** (what they can do on their own now, what responsibilities they took on).

### What the interviewer wants to hear
- You **adapt your teaching** to each person.
- You **gradually give ownership** instead of doing the work for them.
- You measure progress with **concrete outcomes**, not just impressions.

### Model answer (60–90 seconds)
"Last year, a junior developer joined our team straight from university. She was strong in algorithms but had never worked with Spring Boot or production systems, and her first pull requests took a week to merge because of many review rounds.

I suggested a simple plan. For the first month, we paired for an hour every day on real tickets, and I explained the 'why' behind our patterns — for example, why we use transactions in the service layer and not in controllers. In code reviews, I wrote fewer but longer comments with links to examples, instead of many short corrections. Every two weeks, we had a short one-on-one to choose the next skill — testing, then SQL performance, then on-call.

I also gave her tasks that were slightly harder each time, and I resisted the urge to fix things myself.

After four months, her PRs were usually merged in one or two rounds. After six months, she joined the on-call rotation, and she later led a small feature that cut our report generation time by half. Now she mentors our newest intern."

### Short version (30 seconds)
"I mentored a junior who had never worked with Spring or production systems. We paired daily for a month, I explained the reasons behind our patterns, and I gave her slightly harder tasks each sprint. After six months, she was on the on-call rotation and leading a small feature."

### Real-life example
A senior "mentored" by fixing the junior's code directly in PRs "to be fast." After 6 months, the junior still could not handle an average task alone. When they switched to pairing with explanations, gradually harder tasks, and letting the junior fix issues based on review comments, the junior was able to handle level-2 incident tickets on their own after just one quarter — and the senior was rated highly on "growing others" in the performance review.

### Useful phrases
- "When she joined, she was strong in… but had never…"
- "I suggested a simple plan: …"
- "I explained the 'why' behind…"
- "I gave her slightly harder tasks each time."
- "I resisted the urge to fix things myself."
- "After six months, she was able to…"

### Common mistakes for Vietnamese speakers
- Talking more about yourself than about the person you mentored.
- No results: "I helped him a lot" → **"After three months, he could handle on-call alone."**
- "I teach him every day" (tense error) → **"I taught him / We paired every day."**
- "She has improved very much" → **"She improved a lot"** or **"Her PRs went from five review rounds to one or two."**

> Senior tip: keep a short note about the people you have mentored (starting point, approach, results). When interviewing for a Lead role, you will have 2–3 stories ready with real numbers instead of vague memories.`,
    follow: ['How do you handle a mentee who resists feedback?', 'How do you balance mentoring with delivery?']
  },
  'english-063': {
    q: 'Describe a time you missed a deadline and how you handled it.',
    a: `**Summary:** Take responsibility early, report as soon as you see signs of slippage, offer options (cut scope, change the order, move the date), and add a prevention step.

### What the interviewer wants to hear
- **Ownership:** use "I" for your part of the mistake, not "we" to avoid responsibility.
- **Early detection:** you had warning signals (burndown, technical spike) rather than a surprise on the last day.
- **Trade-off:** you offered options with clear consequences, for example "ship the core flow on time and move reporting to the next sprint".
- **Prevention with numbers:** for example "since then I add a one-day spike for unknown integrations, and our estimate error dropped from about 40% to 15%".

### Model answer (60–90 seconds)
"Last year I committed to integrating a new payment provider in three weeks. I underestimated it — I'd assumed their sandbox behaved like production, and it didn't.

At the end of the first week, I realized the date was at risk, because their webhook format was different from the documentation. I told my manager and the product owner that same day. I explained what was still uncertain and gave them three options: ship card payments on time and move e-wallets to the next sprint, delay everything by one week, or add another engineer — which I didn't recommend, because onboarding would take too long.

We chose the first option. Card payments went live on the original date, and e-wallets followed eight days later. No customer commitments were affected.

Since then, for any new external integration, I add a two-day spike to test the real API before I give an estimate."

### Suggested STAR structure
| Part | What to say | Length |
|---|---|---|
| Situation | The project, the deadline, who depends on it | 15 seconds |
| Task | The part you were responsible for, why it was late | 15 seconds |
| Action | When you found out, who you told, which options you offered | 60 seconds |
| Result | The real outcome, the lesson, the process change | 30 seconds |

### Real-life example
An engineer discovered mid-sprint that a third-party API limit made the original plan impossible. Instead of staying quiet, they raised it in the next stand-up, showed the data (rate limit vs. required volume), and proposed two options: batch requests and ship the full feature 4 days late, or ship a reduced version on time. The team chose the reduced version, communicated it to the customer, and later added a "third-party limits check" step to their estimation checklist, cutting similar surprises significantly.

### Useful phrases
- "I realized early that..."
- "I communicated immediately..."
- "I proposed..."
- "The trade-off was..."
- "As a result..."
- "To prevent this, since then I..."

### Common mistakes for Vietnamese speakers
- Hiding it until the last minute and then reporting.
- Blaming other people or the requirements.
- No action to prevent it from happening again.
- "I and my team miss the deadline" → **"I missed the deadline"** (take ownership) or **"Our team missed the deadline, and my part was…"**
- Speaking vaguely without numbers or a clear outcome.

> Senior tip: choose a story where the consequences were moderate and you stayed in control; avoid a customer-money incident unless you can clearly describe the recovery. Practice saying it out loud in under two minutes.`,
    follow: ['How do you estimate work more accurately?', 'How do you push back on an unrealistic deadline?']
  }
});
