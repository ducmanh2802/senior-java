/*
 * English translation of js/data/q-english.js — task T224. Format: js/core/i18n.js (content overlay).
 * ids: english-040 english-041 english-042 english-043 english-044 english-045 english-046 english-047 english-048 english-049 english-050 english-051 english-052 english-053 english-054 english-055 english-056 english-057
 */
App.i18n.content({
  'english-040': {
    q: 'How would you begin an English interview naturally?',
    a: `**Summary:** I greet the interviewer, thank them for their time, and give a short introduction tied to the role: ?I am a backend engineer focused on Java services and reliability. I was interested in this role because ?? I use genuine details rather than a memorized biography.`,
    follow: ['What would you change if a key constraint were different?', 'How would you measure whether your approach worked?']
  },
  'english-041': {
    q: 'How would you close an interview professionally?',
    a: `**Summary:** I thank the interviewer, refer to one specific topic from our discussion, briefly reinforce my interest, and ask about next steps and timing. I keep it warm and professional without presuming the outcome.`,
    follow: ['What would you change if a key constraint were different?', 'How would you measure whether your approach worked?']
  },
  'english-042': {
    q: 'What questions would you ask the interviewer?',
    a: `**Summary:** I ask about success in the first six months, the team?s current technical challenge, and how it balances feature delivery with reliability work. I choose questions not already answered and use follow-ups to understand the real expectations.`,
    follow: ['What would you change if a key constraint were different?', 'How would you measure whether your approach worked?']
  },
  'english-043': {
    q: 'How would you discuss salary expectations?',
    a: `**Summary:** I explain that I am seeking compensation appropriate to the role?s scope and market, ask about the full package, and share a researched range if appropriate. I clarify currency and pay period, stay open to discussion, and do not invent figures.`,
    follow: ['What would you change if a key constraint were different?', 'How would you measure whether your approach worked?']
  },
  'english-044': {
    q: 'How would you discuss your start date?',
    a: `**Summary:** I state my actual notice period and earliest realistic date, including any handover commitments. I distinguish the earliest date from a preferred date and confirm the timing before promising it.`,
    follow: ['What would you change if a key constraint were different?', 'How would you measure whether your approach worked?']
  },
  'english-045': {
    q: 'Could you walk me through a recent Java project?',
    a: `**Summary:** I give the project purpose and users, clarify my scope versus the team?s work, then explain one decision, its constraint and trade-off, and an outcome supported by a real metric. I can then invite questions about design or delivery.`,
    follow: ['What would you change if a key constraint were different?', 'How would you measure whether your approach worked?']
  },
  'english-046': {
    q: 'Tell me about a production incident you helped resolve.',
    a: `**Summary:** I describe customer impact, my role, the evidence used to find the cause, mitigation, and the signal that confirmed recovery. I finish with a concrete prevention action, distinguish team work from my contribution, and protect confidential details.`,
    follow: ['What would you change if a key constraint were different?', 'How would you measure whether your approach worked?']
  },
  'english-047': {
    q: 'How would you explain an architecture decision to a business stakeholder?',
    a: `**Summary:** I translate the architecture choice into customer and business effects. For background report generation, for example, asynchronous work can make requests responsive, while requiring job tracking, safe retries, and a clear failure experience. I name the measure we monitor.`,
    follow: ['What would you change if a key constraint were different?', 'How would you measure whether your approach worked?']
  },
  'english-048': {
    q: 'How do you make plural and past tense endings clearer?',
    a: `**Summary:** I practice endings in short pairs: ?one request? and ?several requests?; ?we deploy? and ?we deployed.? Final s and regular past-tense endings vary by surrounding sounds. I slow slightly, finish the sound, then return to a natural pace without exaggerating it.`,
    follow: ['What would you change if a key constraint were different?', 'How would you measure whether your approach worked?']
  },
  'english-049': {
    q: 'How do you pronounce unfamiliar technical terms?',
    a: `**Summary:** I check a reliable dictionary or the product?s own material, notice the stressed syllable, and practice the term in a sentence. If usage is team-specific, I ask how colleagues say it. Clear, consistent speech matters more than imitating an accent.`,
    follow: ['What would you change if a key constraint were different?', 'How would you measure whether your approach worked?']
  },
  'english-050': {
    q: 'How do you describe completed work and current responsibilities?',
    a: `**Summary:** I use present tense for current responsibilities and past tense for completed work. I give a concrete example for each, make ownership clear, and verify the project timeline so my wording does not imply ongoing work is finished.`,
    follow: ['What would you change if a key constraint were different?', 'How would you measure whether your approach worked?']
  },
  'english-051': {
    q: 'How do you avoid common article mistakes?',
    a: `**Summary:** I check whether a noun is singular and countable, already identified, or general. I introduce one item with a or an, use the for a specific known item, and often use no article for plural or uncountable nouns discussed generally, such as ?information.?`,
    follow: ['What would you change if a key constraint were different?', 'How would you measure whether your approach worked?']
  },
  'english-052': {
    q: 'Walk me through a system you designed recently. (2-3 minutes)',
    a: `**Summary:** I will describe the problem, the key constraints, the architecture, and one trade-off I made.

### Sample answer
I will describe the problem, the key constraints, the architecture, and one trade-off I made.

### Useful phrases
- "The main bottleneck was..."
- "The key constraint was..."
- "I traded X for Y because..."
- "The result was..."

### Common mistakes for Vietnamese speakers
- Focusing on chronological order instead of problem -> solution -> result.
- Using "we did" for everything, without clarifying your specific role.
- Skipping trade-offs, making the explanation sound like an advertisement.`,
    follow: ['What would you change if traffic doubled?', 'How did you test consistency?']
  },
  'english-053': {
    q: 'Tell me about a production incident you handled. (STAR, past tense)',
    a: `**Summary:** Use STAR with concrete numbers and your own action, then end with the prevention you added.

### Sample answer
Use a real incident and verify every number against the incident timeline. Structure it as: Situation and user impact; Task and your responsibility; Action, including the evidence that identified the cause and why you chose mitigation; Result, including recovery time and any data impact. For example, if database connections were exhausted, check pool metrics and database activity before concluding that a query or missing index caused it. A rollback may restore service faster than a schema change, but confirm compatibility and reversibility first. Follow up with a prevention tied to the cause, such as a representative query plan review or an alert based on sustained pool saturation and request failures. Do not claim “no data loss” unless reconciliation or other evidence supports it.

### Useful phrases
- "The symptom was..."
- "I first checked..."
- "The root cause turned out to be..."
- "To prevent recurrence, we..."

### Common mistakes for Vietnamese speakers
- Using present tense instead of past tense for resolved incidents.
- Saying "we fixed" without specifying your concrete actions.
- Skipping the prevention part, missing the opportunity to show what you learned.`,
    follow: ['How did you communicate during the incident?', 'What would you do differently?']
  },
  'english-054': {
    q: 'Explain the trade-off between Kafka and REST to a non-technical manager.',
    a: `**Summary:** Compare by business impact: speed, coupling, and failure handling, using a simple analogy.

### Sample answer
REST is like asking a colleague a question and waiting for the reply: it fits when the caller needs an immediate result, but the caller depends on the other service being reachable and responsive. Kafka is closer to leaving a durable message for another team to process: the producer and consumer can work at different times, which can absorb bursts when the system is provisioned and monitored for them. It does not guarantee that either service cannot fail, and it adds operational work such as retries, duplicate handling, lag monitoring, and eventual consistency. I would choose based on whether the business needs an immediate answer and whether asynchronous processing is acceptable, not on traffic peaks alone.

### Useful phrases
- "Think of it as..."
- "The benefit is...; the cost is..."
- "For this case, X fits because..."
- "We can revisit if..."

### Common mistakes for Vietnamese speakers
- Using technical jargon (throughput, partition, consumer group) with non-technical staff.
- Stating only benefits, ignoring the operational cost.
- Failing to give concrete examples from company systems.`,
    follow: ['How do you monitor Kafka lag?', 'When would you switch back to REST?']
  },
  'english-055': {
    q: 'How would you politely disagree with your tech lead?',
    a: `**Summary:** Acknowledge, state your concern with evidence, and offer a small experiment to decide.
  
### Sample answer
I would say: "I see your point about shipping faster. My concern is that this migration may hold a lock on the orders table during peak traffic, based on the behavior we saw in testing. Could we check its lock behavior and duration on production-like data, then choose a rollout window or a safer migration plan? We could also put the application change behind a flag if that is compatible with the schema." This keeps respect, brings evidence, and proposes concrete ways to reduce risk without promising that a flag or maintenance window removes it.

### Details and WHY
Disagreeing with a tech lead is normal in a healthy engineering environment. Tech leads prioritize system integrity, but sometimes they face pressure on delivery schedules. The key is how you present your disagreement: not "I am right, you are wrong," but "I have a concern about a technical risk, let us solve it together."

If you feel your tech lead is making a decision too hastily or without evidence, use the "Evidence-based disagreement" tactic:
- **Acknowledge:** Confirm that you understand their reasoning (e.g., need for speed, cost savings). This makes them feel heard.
- **State concern:** Present the disagreement based on technical data, not personal opinion.
- **Propose experiment:** Instead of a long debate, propose a concrete way to measure or a small spike to test your concern.

This protects the team's technical standards while maintaining a good relationship. If the lead insists, ask to document the risk in the design or Jira to monitor it. That shows responsibility while still respecting their authority.

> Senior tip: Never argue aggressively in a meeting with many stakeholders. If the disagreement becomes tense, proactively suggest discussing it separately: "Let's take this offline and compare the data."

### Useful phrases
- "I see your point, and..."
- "My concern is..."
- "Based on..."
- "Could we try... and measure..."

### Common mistakes for Vietnamese speakers
- Disagreeing bluntly ("I disagree"), which can sound confrontational.
- Stating only an opinion without evidence or alternatives.
- Staying silent, then complaining after the meeting.`,
    follow: ['What if the lead insists?', 'How do you handle being wrong?']
  },
  'english-056': {
    q: 'Why are you leaving your current role, and why this bank?',
    a: `**Summary:** Connect past growth to a future goal that this role offers; avoid complaining.

### Sample answer
I have learned a lot in my current role, especially about [relevant skill or domain]. I am now looking for [specific responsibility or challenge], and this role interests me because [verified detail from the job description or company research]. I would like to understand how the team approaches [relevant goal]. Keep the reason for moving truthful and constructive; do not invent a project, roadmap, or career path you have not verified.

### Details and WHY
This question tests your attitude and growth mindset. The interviewer does not want to hear reasons like "the manager is difficult" or "salary is low." They want a candidate with clear goals and a desire to contribute at a higher level.
- **Leaving:** Focus on what you have learned and why you are ready for the next step. If your current company has stabilized and lacks major technical challenges, state that neutrally.
- **Joining:** This is where you show you have researched the company. Highlight a technical aspect, product, or culture you truly admire or want to master.
- **Avoiding mistakes:** Never criticize former bosses or teammates.

Preparing thoroughly for this question helps you demonstrate professionalism and clear direction.

### Useful phrases
- "I have learned a lot, but..."
- "What excites me about this role is..."
- "I am looking for..."
- "This role fits because..."

### Common mistakes for Vietnamese speakers
- Complaining about the former manager or company, which sounds negative.
- Stating "for higher salary" as the main reason.
- Failing to research the company, providing generic answers.`,
    follow: ['What would make you stay at your current job?', 'Where do you see yourself in 3 years?']
  },
  'english-057': {
    q: 'How do you answer salary expectation and negotiation questions?',
    a: `**Summary:** Give a researched range, anchor on total compensation, and ask about their band before committing.

### Sample answer
I would say: "Based on comparable roles, my experience, and the responsibilities we have discussed, I am targeting a total compensation range of [your researched range]. I am open to discussing the mix of base pay and any benefits or variable compensation that apply to this role. Could you share the budgeted range for the position?" Research the relevant location and level; do not assume equity or a bonus is part of the package.

### Details and WHY
Salary negotiation is a skill that demonstrates confidence and an understanding of your market value.
- **Market research:** Know the salary level for similar positions and experience levels in that area before the interview.
- **Range vs. Number:** Provide a range rather than a fixed number to remain flexible.
- **Total compensation:** Basic salary is only one part; consider bonuses, equity, allowances, and growth opportunities.
- **Ask back:** If they ask too early, ask for their budgeted range to see if you are aligned, avoiding wasted time.

This is not haggling; it is negotiation based on value and the market. Always maintain a cooperative and professional attitude.

### Useful phrases
- "Based on market data..."
- "I am targeting a range of..."
- "I am flexible on the mix..."
- "Could you share the band?"

### Common mistakes for Vietnamese speakers
- Offering a range too low because of hesitation, then regretting it.
- Saying "whatever you think is fair" → losing leverage.
- Stating only base salary, missing bonuses, equity, or remote allowance.`,
    follow: ['How do you handle a low offer?', 'When do you negotiate beyond salary?']
  },
});
