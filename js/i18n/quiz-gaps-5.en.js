/*
 * English translation of js/data/quiz-gaps.js — task T684. Format: js/core/i18n.js (content overlay).
 * ids: qz-english-023 qz-english-024 qz-english-025 qz-english-026 qz-english-027
 */
App.i18n.content({

  'qz-english-023': {
    q: `A teammate asks you to take on an urgent task, but you are already at full capacity. Which 2 responses are polite and professional? (Choose 2)`,
    options: [
      `I'd like to help, but I'm at full capacity this sprint. Can we discuss priority with our lead, or can this wait until next week?`,
      'No, I am too busy. Ask someone else.',
      `I can take it, but something else will have to slip. Which of my current tasks should I deprioritize?`,
      'Sure, I will do it even if I have to work all weekend.'
    ],
    explain: `**Correct answer: options 0 and 2.**

### Why correct
Both politely decline the request while offering an alternative. Option 0 states that you are at full capacity right now and proposes either discussing priority with the lead or postponing the work to next week. Option 2 accepts the task but is transparent about the trade-off (other work will slip) and asks which of the current tasks should be deprioritized.

### Why the other options are wrong
- **Option 1**: "No, I am too busy. Ask someone else." is grammatically correct but too blunt, impolite, and offers no alternative. In an international workplace this leaves a bad impression.
- **Option 3**: agreeing to do it even if it means working the whole weekend is not sustainable, easily leads to burnout and lower quality. It also hides the capacity problem from management.

> Senior tip: when declining a request, use the structure "I'd like to help, but…" + a concrete reason + an alternative suggestion or a priority question. Avoid a flat refusal, and avoid agreeing to everything until you are overloaded.`
  },

  'qz-english-024': {
    q: `You realize you will not finish a task by the agreed deadline. Which message is best to send to your manager?`,
    options: [
      'I will not finish on time.',
      `I'm flagging a risk: the third-party API integration is taking longer than expected. I expect to finish by Thursday instead of Wednesday. I can either deliver a simpler version by Wednesday or the full version by Thursday — which do you prefer?`,
      'Sorry, I am late. The other team did not give me the documentation.',
      'I think the deadline was unrealistic from the start.'
    ],
    explain: `**Correct answer: option 1.**

### Why correct
This answer raises the alarm early (flagging a risk), gives a concrete cause (the third-party API integration is taking longer than expected), proposes a new expected date (Thursday instead of Wednesday), and offers two options with a trade-off (a simpler version by Wednesday or the full version by Thursday) so the manager can decide. This is exactly how a senior engineer communicates.

### Why the other options are wrong
- **Option 0**: "I will not finish on time." only delivers bad news with no cause, no new date, and no solution. The manager does not have enough information to decide anything.
- **Option 2**: blames another team ("The other team did not give me the documentation") and gives neither a new completion date nor a plan.
- **Option 3**: judges the deadline as unrealistic from the start but offers no solution or next step. It sounds like making excuses rather than handling the problem.

> Senior tip: when reporting a slip, report early, give an objective cause (no blaming), propose a new date, and offer at least one trade-off option so your manager can decide quickly.`
  },

  'qz-english-025': {
    q: `You did not hear the interviewer clearly because of a bad connection. Which response is most natural and polite?`,
    options: [
      'What? Say that again.',
      'I did not understand. Your English is unclear.',
      `Sorry, I think the connection cut out. Could you repeat the last part, please?`,
      'I will answer anyway, even though I did not hear the question.'
    ],
    explain: `**Correct answer: option 2.**

### Why correct
"Sorry, I think the connection cut out. Could you repeat the last part, please?" blames the connection (not the speaker), uses the polite form "Could you repeat… please?", and specifies exactly which part needs repeating ("the last part"). This is the natural and professional way to handle a remote interview.

### Why the other options are wrong
- **Option 0**: "What? Say that again." is too rude, impolite, and does not attribute the problem to the connection.
- **Option 1**: "I did not understand. Your English is unclear." blames the speaker (their English is unclear), which creates a bad impression and is unprofessional.
- **Option 3**: answering without having heard the question clearly easily leads to answering the wrong thing, and makes the interviewer think you do not listen or do not bother to clarify.

> Senior tip: if the connection makes you miss something, blame the connection instead of the other person, then ask them to repeat the specific part. Asking for clarification is a plus, not a minus.`
  },

  'qz-english-026': {
    q: `You need to summarize a production incident to a non-technical stakeholder. Which 2 elements should you include? (Choose 2)`,
    options: [
      'The exact SQL query that failed and the stack trace.',
      'What happened, how long it lasted, and how it affected users (in plain language).',
      'What we are doing to fix it and how we will prevent it from happening again.',
      'The names of the engineers who caused the incident.'
    ],
    explain: `**Correct answer: options 1 and 2.**

### Why correct
When summarizing an incident for a non-technical stakeholder, focus on: (1) what happened, how long it lasted, and how it affected users (in everyday language, without deep technical jargon), and (2) what the team is doing to fix it and how you will prevent a recurrence. This helps the stakeholder understand the situation and trust the team.

### Why the other options are wrong
- **Option 0**: the failing SQL query and the stack trace are far too technical; a non-technical stakeholder neither understands them nor needs them.
- **Option 3**: naming the engineers who caused the incident violates the blameless principle (no blaming individuals) and does not help resolve the incident.

> Senior tip: stakeholders care about business impact (how users were affected, how long the outage lasted) and the corrective actions, not technical details. Use simple language and avoid unnecessary jargon.`
  },

  'qz-english-027': {
    q: `Interviewer asks "What is your greatest weakness?". Which answer is honest and professional?`,
    options: [
      'I do not have any weaknesses.',
      'I work too hard and care too much about my code.',
      `I used to hesitate to speak up in meetings when I disagreed with a senior colleague. I have been working on this by preparing my points in advance and using phrases like 'I see your point, and I have a concern…'. Last month I raised a risk about the database change that saved us from downtime.`,
      'I am not good at English, so I cannot communicate well.'
    ],
    explain: `**Correct answer: option 2.**

### Why correct
This answer is honest about a real weakness (hesitating to speak up when disagreeing with a senior), but it also states the improvement actions underway (preparing points in advance, using polite phrases such as "I see your point, and I have a concern…") and a concrete result (last month you raised a risk about a database change that prevented downtime). This is the professional way to answer the interview question.

### Why the other options are wrong
- **Option 0**: "I do not have any weaknesses." is dishonest and shows a lack of self-awareness. Everyone has weaknesses.
- **Option 1**: "I work too hard and care too much about my code." is a fake weakness (a humble-brag); interviewers have heard it hundreds of times and read it as dodging the question.
- **Option 3**: "I am not good at English, so I cannot communicate well." is a core weakness for a role that requires communication, and it offers no improvement action. It can make the interviewer worry about your ability to do the job.

> Senior tip: when talking about a weakness, pick a real one that is not a core skill for the role, then state the improvement actions underway and the results achieved. Avoid fake weaknesses, and avoid weaknesses that directly hit the main job.`
  }

});
