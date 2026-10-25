/*
 * English translation of js/data/q-english.js — task T225. Format: js/core/i18n.js (content overlay).
 * ids: english-058 english-059 english-060 english-061 english-062 english-063
 */
App.i18n.content({
  'english-058': {
    q: 'What questions should you ask the interviewer at the end?',
    a: `**Summary:** Ask about success metrics, team health, and the real challenge; avoid questions answered on the website.

### Sample answer
Choose questions that are still unanswered and fit the interview stage. For example: "What would success look like in the first few months?" or "What technical challenge is the team prioritizing?" Ask about on-call expectations, compensation, or leave when the interviewer or process makes those topics appropriate; none is inherently off limits. You can close with: "Is there anything about my experience you would like me to clarify?" That invites useful discussion without pressuring the interviewer.

### Useful phrases
- "What does success look like..."
- "What is the biggest challenge..."
- "How do you measure..."
- "Is there anything that concerns you..."

### Interview notes
- Avoid saying "I have no questions" — it shows lack of interest.
- Do not ask about salary/leave in the technical rounds.
- Avoid questions already answered on the website.`,
    follow: ['How do you close an interview professionally?', 'What follow-up email should you send?']
  },
  'english-059': {
    q: 'How do you clarify an ambiguous requirement with a stakeholder?',
    a: `**Summary:** Restate the goal, list assumptions, and propose a small validation step before building.

### Sample answer
I would say: "Let me make sure I understand. The goal is to reduce failed payments by 20% this quarter. I assume we mean failed due to timeout, not fraud, and that we can change the retry policy. Before I build, I will run a 2-day analysis of failure reasons and share a one-page proposal. Does that match your expectation?" This avoids building the wrong thing and shows ownership.

### Useful phrases
- "Let me make sure I understand..."
- "I assume that..."
- "Before I build, I will..."
- "Does that match..."

### Interview notes
- Avoid assuming requirements without confirmation; it often leads to rework.
- Never ask "What do you want?" without proposing a solution.
- Always document decisions to avoid future disputes.`,
    follow: ['How do you handle conflicting stakeholders?', 'What if requirements change mid-sprint?']
  },
  'english-060': {
    q: 'How do you give and receive code review feedback?',
    a: `**Summary:** Focus on code and impact, ask questions, and separate blocking from non-blocking comments.

### Sample answer
When giving feedback, focus on correctness, maintainability, and risk; let configured automation handle style where practical. Explain the impact and suggest a path forward, for example: "Could this query load more rows than expected? What does the plan look like for the largest tenant?" Mark severity using the team's review conventions rather than assuming every team uses the same labels. When receiving feedback, ask about the underlying concern, verify it, and explain your reasoning with evidence if you still disagree.

### Useful phrases
- "Could this... become an issue..."
- "Nit: ..."
- "Blocking: ..."
- "The reason I chose... is..."

### Interview notes
- Avoid critical comments without explanation.
- Keep comments professional and focused on code, not the person.
- Do not remain silent when you disagree; explain your reasoning politely.`,
    follow: ['How do you review a large PR?', 'How do you handle a stubborn reviewer?']
  },
  'english-061': {
    q: 'Describe a weakness honestly in an interview.',
    a: `**Summary:** Name a real but non-fatal weakness, show evidence of improvement, and avoid humble-brag.

### Sample answer
I used to [truthful, relevant weakness]. In [brief real example], it affected [specific outcome]. I changed my approach by [concrete action], and I check whether it is working through [evidence you can support]. I am still improving, especially when [honest context]. Avoid claiming a weakness or result that is not yours; choose something real that does not undermine a core requirement of the role.

### Useful phrases
- "I used to..."
- "The impact was..."
- "I now..."
- "Evidence of progress is..."

### Interview notes
- Avoid "I work too hard" — it sounds like a humble-brag and interviewers don't trust it.
- Never choose a weakness that is critical for the role (e.g., a backend developer saying they dislike databases).
- Always show a clear path of improvement.`,
    follow: ['What is your greatest strength?', 'How do you handle feedback about a weakness?']
  },
  'english-062': {
    q: 'Tell me about a time you mentored a junior developer.',
    a: `**Summary:** Describe the gap, your approach, and measurable growth of the mentee.

### Sample answer
A junior teammate was building confidence in [specific skill]. I asked what they had tried, then paired on a real task and made my reasoning visible. Next I gave them an appropriately scoped task with a runbook and review support, so they could take ownership without being left alone with production risk. We checked progress through [specific evidence, with permission to share it]. The lesson was to adjust support to the person and create safe opportunities to practice; use a real example and do not disclose confidential details.

### Useful phrases
- "The gap was..."
- "I paired with them on..."
- "I gave them ownership of..."
- "The result was..."

### Interview notes
- Avoid claiming you taught them "everything" — it lacks humility.
- Use quantitative data if possible to demonstrate progress.
- Provide a concrete example, not just abstract theory.`,
    follow: ['How do you handle a mentee who resists feedback?', 'How do you balance mentoring with delivery?']
  },
  'english-063': {
    q: 'Describe a time you missed a deadline and how you handled it.',
    a: `**Summary:** Own the miss early, communicate, renegotiate scope, and add a prevention.

### Sample answer
I underestimated [real task] and realized [when] that the date was at risk. I told the relevant people as soon as I had evidence, explained the remaining uncertainty, and offered options such as reducing scope, changing sequencing, or moving the date. We agreed on [actual outcome and impact]. Afterward I changed [estimation or discovery practice] and checked whether it reduced surprises on later work. Take responsibility for your estimate while being clear about external dependencies; do not promise that no customer was affected unless that is known.

### Useful phrases
- "I realized early that..."
- "I communicated immediately..."
- "I proposed..."
- "To prevent this..."

### Interview notes
- Communicate the risk as soon as you detect it; do not wait until the deadline.
- Do not blame others or external requirements.
- Show a clear prevention plan.`,
    follow: ['How do you estimate work more accurately?', 'How do you push back on an unrealistic deadline?']
  }
});
