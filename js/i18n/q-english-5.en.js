/*
 * English translation of js/data/q-english.js — task T225 (re-translated in T524). Format: js/core/i18n.js (content overlay).
 * ids: english-058 english-059 english-060 english-061 english-062 english-063
 */
App.i18n.content({
  'english-058': {
    q: 'What questions should you ask the interviewer at the end?',
    a: `**Summary:** Ask about success criteria, team health, and the real challenge; avoid questions whose answers are already on the website.

### Sample answer
Choose questions that are still unanswered and fit the interview stage. For example: "What would success look like in the first few months?" or "What technical challenge is the team prioritizing?" Ask about on-call expectations, compensation, or leave when the interviewer or process makes those topics appropriate; none is inherently off limits. You can close with: "Is there anything about my experience you would like me to clarify?" That invites useful discussion without pressuring the interviewer.

### Details and WHY
This is your last chance to make a good impression. Don't ask questions just to fill the time; ask the ones that show you genuinely want to understand the job and the culture of the company.
- **Success metrics:** asking about their expectations for the next six months helps you picture the standards the company holds people to.
- **Technical challenges:** understanding the team's biggest problem lets you see the reality on the ground (technical debt, infrastructure issues...).
- **Team health:** asking about on-call and work-life balance helps you judge whether this is a healthy environment.

Your final question should show professionalism, careful preparation, and the mindset of someone who truly wants to contribute over the long term.

### Useful phrases
- "What does success look like..."
- "What is the biggest challenge..."
- "How do you measure..."
- "Is there anything that concerns you..."

### Common mistakes for Vietnamese speakers
- Saying "I have no questions" — it signals a lack of initiative.
- Asking about salary or leave with a technical interviewer who does not handle those topics — save that for the recruiter or for when you are asked.
- Asking something whose answer is already on the website.`,
    follow: ['How do you close an interview professionally?', 'What follow-up email should you send?']
  },
  'english-059': {
    q: 'How do you clarify an ambiguous requirement with a stakeholder?',
    a: `**Summary:** Restate the goal in your own words, state your assumptions, and propose a small validation step before you start building.

### Sample answer
I would say: "Let me make sure I understand. The goal is to reduce failed payments by 20 percent this quarter. I'm assuming we mean failures caused by timeouts, not fraud declines, and that we're allowed to change the retry policy. Before I build anything, I'd like to spend two days analyzing the failure reasons and then share a one-page proposal. Does that match what you had in mind?" This avoids building the wrong thing and shows ownership.

### Details and WHY
Ambiguity is the enemy of productivity. Don't start building while the requirement is still unclear, because the cost of correcting it later is many times higher.
- **Restate the goal:** to make sure you and the stakeholder are looking in the same direction.
- **State assumptions:** assumptions help pin down the boundaries of the problem.
- **Propose a validation step:** instead of asking back "so how should we do this?", propose a small approach and let them confirm it.

This approach shows senior-engineer thinking: not merely doing the work, but optimizing the business value.

### Useful phrases
- "Let me make sure I understand..."
- "I assume that..."
- "Before I build, I will..."
- "Does that match..."

### Common mistakes for Vietnamese speakers
- Assuming and coding straight away, then having to redo everything.
- Asking "what do you want?" without proposing any option.
- Not writing decisions down, which leads to arguments later.`,
    follow: ['How do you handle conflicting stakeholders?', 'What if requirements change mid-sprint?']
  },
  'english-060': {
    q: 'How do you give and receive code review feedback?',
    a: `**Summary:** Comment on the code and its impact (not on the person), use questions, and separate blocking feedback from non-blocking nits.

### Sample answer
When giving feedback, focus on correctness, maintainability, and risk; let configured automation handle style where practical. Explain the impact and suggest a path forward, for example: "Could this query load more rows than expected? What does the plan look like for the largest tenant?" Mark severity using the team's review conventions rather than assuming every team uses the same labels. When receiving feedback, ask about the underlying concern, verify it, and explain your reasoning with evidence if you still disagree.

### Details and WHY
Code review is a shared learning process, not a fight between the reviewer and the author.
- **Giving feedback:** focus on the things that affect the system, such as performance, security, and maintainability. Use questions so the other person thinks for themselves instead of being told what to do.
- **Receiving feedback:** be open and treat it as a chance to improve both yourself and the code. Don't get defensive. If you disagree, argue with technical reasoning, not personal preference.

The ultimate goal is the quality of the product, not who wins.

### Useful phrases
- "Could this... become an issue..."
- "Nit: ..."
- "Blocking: ..."
- "The reason I chose... is..."

### Common mistakes for Vietnamese speakers
- Commenting "this is wrong" without any explanation.
- Making personal remarks instead of talking about the code.
- Staying silent when you disagree, then following along unhappily.`,
    follow: ['How do you review a large PR?', 'How do you handle a stubborn reviewer?']
  },
  'english-061': {
    q: 'Describe a weakness honestly in an interview.',
    a: `**Summary:** Name a real weakness that is not fatal for the role, show what you have done to improve, and back it with evidence of progress; avoid the humble-brag.

### Sample answer
"One thing I've been working on is speaking up early in design discussions. I used to keep my concerns to myself in meetings and raise them later in code review. On one project, I noticed a problem with the data model during the design review but didn't say anything, and we had to rework two weeks of code later.

Since then, I've changed two things. I read the design doc before the meeting and write down my questions, and I make a point of raising at least one of them during the discussion. My manager has noticed the difference — in my last review, she mentioned that I'm contributing much more in design sessions. I'm still more comfortable writing than speaking, especially in English, but it's getting easier."

(Choose your own real weakness; the example above is only a template for the structure.)

### Details and WHY
The interviewer does not ask this to catch you out; they want to see whether you have self-awareness and a drive to improve.
- **Real weakness:** don't say "I'm too perfect"; name a real weakness that does not put the role you are applying for at risk.
- **Improvement:** this is the most important part. What have you actually done to fix it?
- **Evidence:** show concrete progress.

This mindset shows you are an engineer who keeps learning and never stops working on yourself.

### Useful phrases
- "I used to..."
- "The impact was..."
- "I now..."
- "Evidence of progress is..."

### Common mistakes for Vietnamese speakers
- Saying "I work too hard" — it is a humble-brag and interviewers do not believe it.
- Choosing a weakness that is fatal for the role (for example, a backend developer saying they dislike databases).
- Offering no improvement action at all.`,
    follow: ['What is your greatest strength?', 'How do you handle feedback about a weakness?']
  },
  'english-062': {
    q: 'Tell me about a time you mentored a junior developer.',
    a: `**Summary:** Describe the gap the person you mentored had, how you supported them, and the progress they visibly made.

### Sample answer
"Last year a junior developer joined our team, and she was technically solid but nervous about anything touching production. She avoided on-call and asked someone else to deploy her changes.

First, I asked her what exactly worried her. It turned out she didn't know how to tell whether a deployment was healthy. So we paired on a few real releases, and I talked through what I was looking at — error rates, latency, and the logs — and why.

Next, I gave her a small, low-risk service to own, with a runbook, and I reviewed her first few deployments. After about two months, she joined the on-call rotation as a secondary, and by the end of the quarter she was handling incidents on that service on her own. She even updated the runbook herself.

What I learned is that the gap was confidence, not knowledge, so the right approach was safe practice, not more lectures."

### Details and WHY
Mentoring is not just "teaching technology"; it is about creating an environment where another person can grow.
- **Diagnose:** first you have to understand what the other person is missing (foundational knowledge, confidence, or time-management skills).
- **Structure:** don't do the work for them; create "safe opportunities" so they can try things themselves and draw their own lessons.
- **Measure:** effective mentoring is when the mentee can handle the work without you.

A good mentor knows when to step back and give the stage to someone else to shine.

### Useful phrases
- "The gap was..."
- "I paired with them on..."
- "I gave them ownership of..."
- "The result was..."

### Common mistakes for Vietnamese speakers
- Saying "I taught them everything" — it lacks humility.
- Having no numbers to prove the progress.
- Talking only in theory, with no concrete example.`,
    follow: ['How do you handle a mentee who resists feedback?', 'How do you balance mentoring with delivery?']
  },
  'english-063': {
    q: 'Describe a time you missed a deadline and how you handled it.',
    a: `**Summary:** Take responsibility early, report as soon as you see a sign of slippage, offer options (cut scope, change the order, move the date), and add a prevention step.

### Sample answer
"Last year I committed to integrating a new payment provider in three weeks. I underestimated it — I'd assumed their sandbox behaved like production, and it didn't.

At the end of the first week, I realized the date was at risk, because their webhook format was different from the documentation. I told my manager and the product owner that same day. I explained what was still uncertain and gave them three options: ship card payments on time and move e-wallets to the next sprint, delay everything by one week, or add another engineer — which I didn't recommend, because onboarding would take too long.

We chose the first option. Card payments went live on the original date, and e-wallets followed eight days later. No customer commitments were affected.

Since then, for any new external integration, I add a two-day spike to test the real API before I give an estimate."

### Useful phrases
- "I realized early that..."
- "I communicated immediately..."
- "I proposed..."
- "To prevent this..."

### Common mistakes for Vietnamese speakers
- Hiding it until the last minute and then reporting.
- Blaming other people or the requirements.
- Having no action to stop it from happening again.

### Suggested STAR structure
| Part | What to say | Length |
|---|---|---|
| Situation | The project, the deadline, who depends on it | 15 seconds |
| Task | The part you were responsible for, why it was late | 15 seconds |
| Action | When you found out, who you told, which options you offered | 60 seconds |
| Result | The real outcome, the lesson, the process change | 30 seconds |

### What the interviewer wants to hear
- **Ownership:** use "I" for your part of the mistake, not "we" to dodge responsibility.
- **Early detection:** you had warning signals (burndown, technical spikes) rather than a surprise on the last day.
- **Trade-off:** offer options with clear consequences, for example "ship the core flow on time and move reporting to the next sprint".
- **Prevention with numbers:** for example "since then I add a one-day spike for unknown integrations, and our estimate error dropped from about 40% to 15%".

> Senior tip: pick a story where the consequences were moderate and you stayed in control; avoid a customer-money incident unless you can clearly describe the recovery. Practice saying it out loud in under two minutes.`,
    follow: ['How do you estimate work more accurately?', 'How do you push back on an unrealistic deadline?']
  }
});
