/*
 * English translation of js/data/quiz.js — task T679. Format: js/core/i18n.js (content overlay).
 * ids: qz-english-009 qz-english-010 qz-english-011 qz-english-012 qz-english-013 qz-english-014 qz-english-015 qz-english-016 qz-english-017 qz-english-018 qz-english-019 qz-english-020 qz-english-021 qz-english-022 qz-behavioral-009 qz-behavioral-010 qz-behavioral-011 qz-behavioral-012 qz-behavioral-013 qz-behavioral-014
 */
App.i18n.content({
  'qz-english-009': {
    q: 'You left that company in 2022. Which sentence is correct?',
    options: [
      'I have worked there for three years.',
      'I worked there for three years.',
      'I am working there for three years.',
      'I will work there for three years.'
    ],
    explain: `**Correct answer: I worked there for three years.**

### Why this is correct
You mention an explicit past time reference (in 2022) and the job has **finished** (you left the company), so use the **past simple**: {{worked}}. This tense is used for something completed at a definite moment in the past (last year, in 2021, two years ago).

### Why the other options are wrong
- **I have worked there for three years**: the present perfect (has/have + V3) describes experience measured up to now and usually **does not combine with a definite past time marker** such as "in 2022". If you still worked there, the natural sentence is I have worked there for three years (with no past time marker).
- **I am working**: the present continuous talks about something happening right now, which cannot apply to a company you already left.
- **I will work**: the future tense, the opposite meaning.

> Senior tip: the rule to memorise: with a clear past time marker (last year, in 2021, ago) use the past simple; with no marker and an emphasis on the link to the present, use the present perfect.`
  },
  'qz-english-010': {
    q: 'Which sentence is correct in an IT meeting?',
    options: [
      'We need to discuss about the requirements.',
      'We need to discuss the requirements.',
      'We need discussion about the requirements.',
      'We need to talking about the requirements.'
    ],
    explain: `**Correct answer: We need to discuss the requirements.**

### Why this is correct
The verb **discuss** already carries the meaning "talk about something", so it takes the object directly and **needs no preposition**. "Discuss about" is a word-for-word translation from Vietnamese — one of the most common false friends (pairs of words that look equivalent but are not) for Vietnamese learners. Correct forms: discuss the requirements, discuss the issue, discuss the design.

### Why the other options are wrong
- **discuss about**: wrong; discuss already includes the idea of "about", so adding about is redundant and ungrammatical.
- **discussion about**: as a noun, discussion does go with about, but after "need to" you must use a bare infinitive verb (discuss), not a noun.
- **need to talking**: after "to" you need the base form (talk), not V-ing.

> Senior tip: several other verbs have the same trap: mention (no about), explain (explain something **to** someone, never "explain me"), reach (no to). Learn verbs together with their prepositions instead of in isolation.`
  },
  'qz-english-011': {
    q: 'Complete the sentence naturally: "She ______ the payment module."',
    options: [
      'is responsible the payment module',
      'is responsible for the payment module',
      'is responsible with the payment module',
      'is responsible of the payment module'
    ],
    explain: `**Correct answer: is responsible for the payment module.**

### Why this is correct
**Responsible for** is the standard collocation (a fixed pair of words that native speakers use) for "to be in charge of / accountable for". Examples: I am responsible for backend APIs, Who is responsible for this incident?. It is followed by a noun or by V-ing (responsible for managing the team).

### Why the other options are wrong
- **responsible the payment module**: the preposition for is missing, so the sentence is incomplete.
- **responsible with / responsible of**: neither is a standard English collocation; with responsible only **for** (the thing you own) and **to** (the person you report to, as in "responsible to the manager") work.
- Every wrong option makes the sentence sound unnatural or ungrammatical in an international workplace.

> Senior tip: collocations are what decides how natural a sentence sounds. Related phrases worth knowing: in charge of (roughly the same meaning as responsible for), accountable for (a higher, ownership-of-outcomes level of responsibility, used when you answer for the final result).`
  },
  'qz-english-012': {
    q: 'Which word fits: "Can you give me some ______ on my system design?"',
    options: [
      'advices',
      'advise',
      'advice',
      'an advice'
    ],
    explain: `**Correct answer: advice.**

### Why this is correct
**Advice** is an uncountable noun (a noun you cannot count and therefore never pluralise and never put "a/an" in front of); it means the guidance you give someone. It has no plural form and takes no a/an: you cannot say "an advice" or "advices". The phrase give someone advice is standard. Example: Can you give me some advice on my system design? / I need your advice.

### Why the other options are wrong
- **advices**: wrong, advice has no plural.
- **advise**: this is the **verb** (to advise someone), for example I advise you to check the logs. The gap after "some" needs a noun.
- **an advice**: advice is uncountable, so no article a/an. To count it, use a piece of advice / a piece of feedback.

> Senior tip: the same kind of confusing pair: practice (noun, BrE) vs practise (verb, BrE), license (noun) vs licence. The important point: advice is always the noun, advise is always the verb, in both British and American English.`
  },
  'qz-english-013': {
    q: 'Complete naturally: "The tech lead asked the team to ______ a decision by Friday."',
    options: [
      'make',
      'do',
      'take',
      'give'
    ],
    explain: `**Correct answer: make.**

### Why this is correct
**Make a decision** is a fixed collocation in English (to decide). Other important collocations with make: make a plan, make a suggestion, make progress, make a mistake. In an IT context: We need to make a decision on the database by Friday.

### Why the other options are wrong
- **do a decision**: do goes with general tasks (do homework, do the task), never with decision.
- **take a decision**: understandable, but noticeably less natural than make in spoken IT English; take pairs with take a look, take a break, take responsibility.
- **give a decision**: not a standard collocation.

> Senior tip: collocations are the key to sounding natural when you speak and write. Memorise also: raise a concern, meet a deadline (never "catch a deadline"), take ownership, pay down technical debt, reach a consensus.`
  },
  'qz-english-014': {
    q: 'Complete naturally: "During standup, I want to ______ a concern about the API latency."',
    options: [
      'raise',
      'rise',
      'lift',
      'create'
    ],
    explain: `**Correct answer: raise.**

### Why this is correct
**Raise a concern** is the standard collocation, meaning "bring a worry / an issue worth attention to the table". It is the professional way to flag a project risk without creating confrontation. Example: I would like to raise a concern about the rollback plan.

### Why the other options are wrong
- **rise**: an intransitive verb (a verb that cannot take an object), so nothing can follow it as an object (the sun rises, prices rise); you cannot say "rise a concern".
- **lift**: means to physically pick something up; it is not used for abstract things like this.
- **create a concern**: understandable but not a natural collocation; create is used with create an issue, create a problem.

> Senior tip: collocations that work well in an interview: make a decision, raise a concern, meet a deadline, take ownership, pay down technical debt. Learn phrases, not single words.`
  },
  'qz-english-015': {
    q: 'Interviewer suggests using one shared database for two services, and you disagree. Which 2 responses are polite and professional? (Choose 2)',
    options: [
      "I see your point. My concern is that a shared database couples the two services' release cycles.",
      'You are wrong, a shared database is a bad idea.',
      "I understand, but I'm worried about data ownership. Would separate schemas work better?",
      'With all due respect, that idea makes no sense at all.'
    ],
    explain: `**Correct answer: 0 and 2.**

### Why this is correct
Both follow the polite-disagreement frame: acknowledge the other person's view → state a concrete concern about the technical problem → offer an alternative as a question. "I see your point" and "I understand" signal respect; "My concern is that…" and "I'm worried about…" attack the problem, not the person; "Would… work better?" opens the discussion instead of closing it.

### Why the other options are wrong
- **You are wrong…**: grammatically fine but far too blunt — it attacks the person instead of the idea. In an international work culture, and especially toward an interviewer, this register leaves a very bad impression.
- **With all due respect… makes no sense**: among native speakers, "with all due respect" usually signals that criticism is about to follow; combined with "makes no sense at all" it sounds sarcastic and offers neither a reason nor an alternative.

> Senior tip: phrases worth memorising for a system design interview: My concern with that is…, One risk I see is…, Have we considered…?, I would lean towards X because…, What if we…?. Always argue about ideas, never about people.`
  },
  'qz-english-016': {
    q: 'You did not hear the interviewer clearly. Which 2 ways to ask them to repeat or clarify are natural and polite? (Choose 2)',
    options: [
      'Could you repeat the question, please?',
      'Can you repeat again the question?',
      "Just to make sure I understand: are you asking about the read path or the write path?",
      'What do you mean? Your question is not clear.'
    ],
    explain: `**Correct answer: 0 and 2.**

### Why this is correct
"Could you repeat the question, please?" is the standard, polite structure (could is softer than can, and "please" at the end is the neutral placement in this pattern). "Just to make sure I understand…" takes the responsibility for understanding onto your own side, then offers two concrete choices (read path / write path) so the interviewer can answer quickly — a very common move in system design rounds.

### Why the other options are wrong
- **Can you repeat again the question?**: two errors. "Repeat" already means "do again", so "again" is redundant; and the word order is unnatural (the object must stay next to the verb). The natural sentence is "Could you repeat the question, please?".
- **What do you mean? Your question is not clear.**: grammatically correct but it blames the questioner and sounds harsh. In an interview this register makes a bad impression.

> Senior tip: asking for clarification is a plus, not a minus, especially for an ambiguous system design question. Useful phrases: Could you clarify what you mean by…?, When you say X, do you mean…?, I will assume… unless you would like me to consider…, Did I get that right?.`
  },
  'qz-english-017': {
    q: 'Choose the correct sentence for a finished project last year.',
    options: [
      'I have led the migration to Kubernetes last year.',
      'I led our migration to Kubernetes last year.',
      'Last year I am responsible for leading the migration.',
      'I was leaded the migration to Kubernetes last year.'
    ],
    explain: `**Correct answer: I led our migration to Kubernetes last year.**

### Why this is correct
There is an explicit past time reference (last year) → use the **past simple**: {{led}} (the irregular past form of {{lead}}). The clause is clear, uses a strong verb, and states your individual role — exactly the spirit of STAR when you tell about an achievement.

### Why the other options are wrong
- **I have led… last year**: the present perfect cannot go with a definite past time marker. You can say I have led two migrations (no marker), but with "last year" it has to be the past simple.
- **Last year I am responsible…**: present tense for something that happened last year (it should be "was"), and after "for" you need V-ing (responsible for leading). It is also weaker than "led" because it names a responsibility, not an action.
- **I was leaded**: "lead" is irregular (lead – led – led), there is no "leaded"; "was led" is passive and would mean somebody else led you.

> Senior tip: when you describe achievements, prefer strong verbs in the past simple (led, designed, built, cut, reduced, migrated) over "was responsible for" or "was involved in". A short sentence with a measured number sounds more confident.`
  },
  'qz-english-018': {
    q: 'Complete naturally: "He is very good ______ writing complex SQL queries."',
    options: [
      'at',
      'in',
      'on',
      'with'
    ],
    explain: `**Correct answer: at.**

### Why this is correct
**Good at** is the standard collocation for "skilled / competent at something", and it is followed by a noun or V-ing: good at writing SQL, good at debugging, good at system design. Example: She is very good at optimizing queries.

### Why the other options are wrong
- **good in**: used for school subjects or environments (good in math, good in English), not for a specific skill.
- **good on**: not a standard collocation in this meaning.
- **good with**: used for people or tools (good with people, good with Java); it does not take V-ing to describe a skill.

> Senior tip: prepositions change the meaning entirely. Compare: interested in, good at, responsible for, depend on. Learn prepositions together with the verb or adjective they belong to, never in isolation.`
  },
  'qz-english-019': {
    q: 'Complete naturally: "I look forward to ______ from you."',
    options: [
      'hear',
      'hearing',
      'to hear',
      'have heard'
    ],
    explain: `**Correct answer: hearing.**

### Why this is correct
In the phrase **look forward to**, the word "to" is a **preposition**, not the "to" of an infinitive, so it must be followed by V-ing: look forward to hearing, look forward to meeting, look forward to working with you. This is one of the most common closing lines in emails and at the end of an interview.

### Why the other options are wrong
- **hear**: after the preposition "to" you need V-ing.
- **to hear**: wrong structure (two "to" in a row), and the "to" after "forward" is a preposition here.
- **have heard**: the present perfect does not fit the meaning of expecting something in the future.

> Senior tip: the other side of look forward to: after its "to" comes V-ing, but in want to hear or need to discuss the "to" is part of the infinitive and takes the base form. The way to keep them apart: look forward to = expect something (noun/V-ing).`
  },
  'qz-english-020': {
    q: 'Choose 2 phrases that use the correct preposition with "depends". (Choose 2)',
    options: [
      'The result depends on the traffic.',
      'The result depends of the traffic.',
      'The delivery depends on the database configuration.',
      'The delivery depends in the database configuration.'
    ],
    explain: `**Correct answer: 0 and 2.**

### Why this is correct
**Depend on** is the standard collocation: to be determined by something. Both correct sentences use "on": The result depends on the traffic and The delivery depends on the database configuration.

### Why the other options are wrong
- **depends of**: wrong preposition, it does not exist in standard English (a direct translation error from Vietnamese).
- **depends in**: wrong; "in" is used for places or times (in Vietnam, in 2024), never with depend.

> Senior tip: prepositions are the weakest spot for Vietnamese speakers because of literal translation. The pairs to memorise: depend on, interested in, good at, responsible for, discuss something (with no about).`
  },
  'qz-english-021': {
    q: 'Complete naturally: "I am ______ event-driven architecture."',
    options: [
      'interested on',
      'interested in',
      'interesting in',
      'interested with'
    ],
    explain: `**Correct answer: interested in.**

### Why this is correct
**Interested in** is the standard structure: to have curiosity or enthusiasm about something. After "interested" the preposition must be "in". Example: I am interested in distributed systems and event-driven architecture.

### Why the other options are wrong
- **interested on / interested with**: wrong prepositions, neither is a standard collocation.
- **interesting in**: "interesting" describes the thing that arouses interest in others (the lecture is interesting), while "interested" describes the feeling of the person involved (I am interested). The two are not interchangeable.

> Senior tip: the -ed vs -ing split: bored / boring, tired / tiring, excited / exciting. -ed describes how a person feels (I am interested), -ing describes the quality of the thing (The topic is interesting).`
  },
  'qz-english-022': {
    q: 'Choose 2 correct sentences about a past habit that no longer exists. (Choose 2)',
    options: [
      'We used to use Jenkins for CI/CD.',
      'We are used to using Jenkins.',
      'We would deploy every Friday when I was there.',
      'We use to deploy every Friday.'
    ],
    explain: `**Correct answer: 0 and 2.**

### Why this is correct
Both **used to + base verb** and **would + base verb** describe a past habit that no longer happens: We used to use Jenkins (we used Jenkins back then, we do not any more), We would deploy every Friday (every Friday ended with a deployment). "Would" only works for repeated actions, not for states.

### Why the other options are wrong
- **We are used to using Jenkins**: this is "be used to" = to be accustomed to, a completely different meaning (we are comfortable using Jenkins); it says nothing about a discontinued past habit.
- **We use to deploy**: the past tense is missing; the correct affirmative form is used to deploy (the base form "use to" only appears after did / didn't: Did you use to…?).

> Senior tip: in an interview, use used to / would to set the scene of a previous job (for example We used to deploy manually, now we use CI/CD). It adds context to the story and shows the change over time, which interviewers value.`
  },
  'qz-behavioral-009': {
    q: 'Interviewer: "Tell me about a time you disagreed with a colleague about a technical decision." Which is the best STAR answer?',
    options: [
      'My old lead wanted to use MongoDB just because he liked new technology, while clearly not understanding the problem. I had to escalate to the CTO and in the end I was right.',
      'Our team argues a lot, but we always discuss things openly and find the best solution for the project together.',
      'Another senior and I disagreed over MongoDB vs PostgreSQL for the billing module, and we had to decide within a week. I proposed we agree on the criteria first (transactions, reporting, operations), each of us ran a 2-day spike against real data, and I acknowledged the other option\'s strength on flexible schema. The team picked PostgreSQL with a JSONB column, we were both on board, the module went to production on time and had no reconciliation bugs for 6 months. The lesson: agree on the criteria before arguing about the solution.',
      'When there is a disagreement, I listen, I bring data, and I always respect the team\'s final decision.'
    ],
    explain: `**Correct answer: option 2 (MongoDB vs PostgreSQL).**

### Why this is correct
This answer has the full STAR structure: S/T is the billing module under pressure to decide within a week; A is the candidate's own action (proposing criteria, running spikes, crediting the other option's strengths) that resolves the disagreement with data rather than with ego; R has numbers (on time, 6 months with no reconciliation errors), both parties in agreement, and the final design combining JSONB; and it closes with a lesson learned — what a Senior/Lead interviewer looks for.

### Why the other options are wrong
- **Escalating to the CTO and claiming "I was right"**: the classic mistake — blaming, putting a colleague down, escalating instead of resolving, and measuring success by "I won".
- **Our team argues… openly**: generic, uses "we" so nobody knows what you personally did, no concrete situation, no result.
- **"When there is a disagreement, I would…"**: a hypothetical answer to a behavioural question (tell me about a time), so the interviewer concludes you have no real example.

> Senior tip: prepare 6–8 STAR stories from real projects, each 1.5–2 minutes, and reuse them across many questions. Roughly 60% of the airtime should go to the Action part.`
  },
  'qz-behavioral-010': {
    q: 'Interviewer: "Tell me about a time you missed a deadline." Which answer should you AVOID most (it contains a red flag)?',
    options: [
      'The project slipped 3 weeks because the QA team tested too slowly and product kept changing the requirements. My part of the work was finished on time.',
      'I estimated the payment-gateway integration at 2 weeks, and mid-sprint we found the partner sandbox had no refund webhook. That same day I told the PM the new estimate plus 2 options: slip by 1 week, or go live on schedule and handle refunds manually at first. The PM chose option 2, we went live on the planned day and the automated refunds shipped 8 days later.',
      'I submitted the design one day late because I underestimated the review time. I flagged it to the PM early, delivered the next day, and since then I break tasks into small milestones with check-in dates.',
      'When I can see I will not make it, I always raise it early and propose a scope cut so the most important milestone still lands.'
    ],
    explain: `**Correct answer: option 0 (it is blame-shifting and contains a red flag).**

### Why option 0 is a red flag
It **blames** QA and product and detaches the speaker from the shared outcome (my part was on time). At a Senior level, the interviewer wants to see that you own the team's result and that you did something when you saw QA being slow or requirements changing. This is the kind of answer that makes a hiring manager worried.

### Why the other options are not red flags
- **Option 1**: a proper STAR — admits the bad estimate, raised it early, offered options with their trade-offs, has a numeric result (went live on the planned day, full feature 8 days later) and a process change (always spike third-party integrations in the first week).
- **Option 2**: admits the underestimate, informed early, delivered, and improved the process (small milestones with check-ins).
- **Option 3**: raises it early and proposes a scope cut — a mature way to handle a time constraint.

> Senior tip: the key sentence in any missed-deadline answer is "I raised it early, together with options". Bad news delivered early still leaves choices; bad news delivered late leaves only consequences.`
  },
  'qz-behavioral-011': {
    q: 'Interviewer: "Tell me about a production incident you caused yourself." Which is the best STAR answer?',
    options: [
      'That bug was actually caused by staging being different from production, so nobody could have caught it beforehand; it is not any individual\'s fault.',
      'We hit a big incident, the whole team jumped on an emergency call and fixed it very fast, and afterwards everything went back to normal.',
      'I deployed a migration that created an index without CONCURRENTLY on the orders table of 80 million rows, blocking writes for about 12 minutes during peak hours. I took ownership of the incident: stopped the pipeline, cancelled the statement together with the on-call engineer, updated the incident channel every 5 minutes, then rebuilt the index with CREATE INDEX CONCURRENTLY outside peak hours. Afterwards I wrote a blameless postmortem and added a lint rule that blocks non-CONCURRENT index creation on large tables; a year later this bug has not recurred.',
      'I always test very thoroughly before deploying, so I would never cause a production incident myself.'
    ],
    explain: `**Correct answer: option 2 (the migration creating an index on an 80-million-row table).**

### Why this is correct
- **Clear ownership**: "I deployed", "I took ownership". No dodging, no blaming.
- **Enough technical detail, and accurate**: a plain CREATE INDEX holds a lock that blocks INSERT/UPDATE/DELETE on the table for the whole build; CREATE INDEX CONCURRENTLY does not block writes (in exchange it builds more slowly and cannot run inside a transaction block). A technical interviewer will believe this is a real story.
- **Well-run incident handling**: mitigate the impact first, communicate on a cadence, only then fix the root cause.
- **Systemic prevention** (a lint rule) instead of "I will be more careful next time", plus a result over time (a year later this bug has not recurred).

### Why the other options are wrong
- **Because staging differs from production… nobody's fault**: the question asks for an incident you caused; answering by denying responsibility is a bad signal. "Blameless" in a postmortem means not attributing fault to a person, not that nobody owns the problem.
- **We… fixed it very fast**: it is impossible to tell what the incident was, what you did, how big the impact was, or what you learned. "We" is used to hide the individual role.
- **I always test carefully… would never happen**: both hypothetical and unrealistic. Every engineer who has worked on production long enough has caused an incident; claiming the opposite makes the interviewer doubt either your experience or your honesty.

> Senior tip: tell an incident story along the postmortem frame: impact → detection → mitigation → root cause → preventive actions. Lead-level interviewers pay particular attention to the detection part: if a customer reported it before your monitoring did, also say which alert you added afterwards.`
  },
  'qz-behavioral-012': {
    q: 'Interviewer: "Tell me about some hard-to-hear feedback you received." Which answer should you AVOID most (it contains a red flag)?',
    options: [
      'My manager said my design documents were too long, so stakeholders did not read them. At first I felt a bit annoyed, but I asked for 2 concrete examples and 2 documents that were well received. I switched to a one-page format: problem, options, trade-offs, the decision needed, details moved to an appendix, and I asked my manager to review the next 3 documents. Time-to-approval dropped from about 2 weeks to 4 days, and that format became the team template.',
      'I explained to my manager that long documents were necessary because the system is complex, and after that conversation he came to understand my point of view.',
      'I got feedback that my estimates were too optimistic, so I started breaking tasks into small milestones with check-in dates and always adding a 20% safety buffer. After 3 sprints, my accuracy went up from 50% to 85%.',
      'I usually ask my lead to review documents before I send them to stakeholders, to avoid length feedback, and I also attach a one-page summary.'
    ],
    explain: `**Correct answer: option 1 (defensive, dismisses the feedback).**

### Why option 1 is a red flag
The **defensive** reaction: the story is really the candidate rejecting the feedback (long documents are necessary, and the manager eventually understood my view). The interviewer will worry that this person is hard to coach and does not take input well.

### Why the other options are not red flags
- **Option 0**: honest about the emotion (a bit annoyed), but the actions are proactive (asking for concrete examples, finding good templates, changing the practice, inviting the reviewer to check the result), the outcome is measurable (2 weeks → 4 days) and it spread to the whole team (the template). This is a Senior/Lead-level signal.
- **Option 2**: accepts the feedback, has concrete actions (milestones, a 20% buffer) and a numeric result (50% → 85%).
- **Option 3**: has a preventive measure (lead review, one-page summary) — handling it before feedback even occurs.

> Senior tip: pick feedback that was genuinely valuable and about a skill that is not the absolute core of the role (communication, estimation, delegation), then prove the change with numbers. Ending with how you now actively ask for feedback (for example after every design review) earns extra points.`
  },
  'qz-behavioral-013': {
    q: 'Interviewer: "Tell me about a time you helped a team member who was struggling with their performance." Which is the best STAR answer?',
    options: [
      'A junior had been with us for 3 months; their PRs were sent back 4–5 rounds and tasks often slipped. I set up a 1-1 and found they were afraid to ask questions and did not yet understand the payments domain. I wrote a review checklist, we pair programmed twice a week for a month, and I gave them small tasks with a clearly bounded scope first. After 2 months the average number of review rounds was down to 1–2 and they delivered a small feature end-to-end on their own. What I learned: the problem is usually in the context, not in the person\'s ability.',
      'They worked slowly, so I took the hard tasks back and did them myself to be fast, and left them the easier work; that way the team\'s sprints were always on time.',
      'I told the manager that they were not up to the job and suggested moving them to another team so our delivery would not be affected.',
      'I love mentoring. I regularly share knowledge about Spring, JPA, Kafka, clean code and design patterns with the juniors, and I also run a monthly tech talk so the whole team can learn.'
    ],
    explain: `**Correct answer: option 0 (the 1-1, the checklist and pair programming with the junior).**

### Why this is correct
- **Diagnosis before action**: a 1-1 to find the cause (afraid to ask, missing domain knowledge), not an assumption of "weak engineer".
- **Structured actions that match the cause**: a checklist (removes repeated mistakes), pair programming (transfers domain knowledge), small tasks (creates an early win).
- **Measurable result** (4–5 rounds → 1–2 rounds, delivering a feature alone) and a lesson about how you read people.

### Why the other options are wrong
- **Taking the hard tasks back and doing them yourself**: hero mode. The sprint stays green short term, but the junior does not grow and the senior becomes the bottleneck. A Lead-level interviewer reads this as an inability to develop other people.
- **Telling the manager to move them to another team**: skips every attempt to help, labels the person as incapable before looking for the cause. Shows a lack of empathy and team spirit.
- **I love mentoring… tech talks**: it sounds positive but misses the question: the question is about one specific person who was struggling, the answer lists generic activities, with no situation and no result.

> Senior tip: when telling a story about another person, stay respectful (no names, no put-downs) and highlight their outcome, not your merit. If the story ends with the person still not improving, tell how you worked with the manager transparently and fairly; that is also a good answer.`
  },
  'qz-behavioral-014': {
    q: 'Interviewer: "Tell me about a time two stakeholders both asked for something urgent and you could only do one." Choose the 2 answers that contain a RED FLAG (to be avoided). (Choose 2)',
    options: [
      'I took both and worked overtime all week to finish them, because I did not want to disappoint anyone.',
      'Sales needed a quoting API for a big customer within 5 days while Ops asked me to fix a reconciliation job whose numbers had drifted. I estimated both and asked each side what the impact of a 1-week delay would be: the quoting work could lose a contract worth roughly 200 thousand USD, the reconciliation could be handled manually for a while. I gave the comparison table to the engineering manager and both sides agreed: API first, Ops runs a temporary script I wrote in 2 hours. Both items were done within 8 days and no contract was lost.',
      'I asked each side what the impact of a 1-week delay would be, then sent a prioritisation proposal to the engineering manager so both sides could decide together.',
      'I chose Sales\' work because they bring in revenue, and for Ops I just said I was busy and let them figure it out themselves.'
    ],
    explain: `**Correct answer: options 0 and 3 (both contain a red flag).**

### Why options 0 and 3 are red flags
- **Option 0**: taking both and working overtime all week — no ability to say no or to negotiate; it is not sustainable, quality tends to drop, and it hides the capacity problem from your management.
- **Option 3**: choosing Sales because of revenue and leaving Ops to fend for themselves — a unilateral decision with poor communication, it damages the relationship with Ops, and there is no result about the impact of the reconciliation drifting.

### Why the other options are not red flags
- **Option 1**: a proper STAR — decision based on impact (asking concretely what is lost with a 1-week delay), transparent and routed to the right decision maker (the comparison table to the EM, both sides agreeing), damage reduced for the side that got deferred (a 2-hour temporary script), with a concrete result.
- **Option 2**: asks each side for the impact, then sends a prioritisation proposal to the manager — a transparent approach, owning the job of providing the data so the person with authority can decide quickly.

> Senior tip: at Senior level and above, the sentence "it was not my call alone to set the priority, but I own giving enough data so the person with authority can decide fast" shows exactly the right altitude. Adding how you kept the deferred side posted afterwards is an extra plus.`
  },
});
