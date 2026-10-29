/*
 * English translation of js/data/q-english.js — task T523. Format: js/core/i18n.js (content overlay).
 * ids: english-040 english-041 english-042 english-043 english-044 english-045 english-046 english-047 english-048 english-049 english-050 english-051 english-052 english-053 english-054 english-055 english-056 english-057
 */
App.i18n.content({
  'english-040': {
    q: 'How would you begin an English interview naturally?',
    a: `**Summary:** The opening has two parts: **brief small talk** (greeting, thanks, natural response to "How are you?") and a **60–90 second self-introduction**: who you are, what you are doing now, one standout achievement, and why this role interests you. Do not read your CV chronologically.

### Sample answer
*Small talk:*
"Hi, nice to meet you. Thanks for taking the time today."
*"How are you?"* — "I'm good, thanks — a little excited, to be honest. How about you?"

*"So, tell me about yourself."*
"Sure. I'm a backend engineer with about six years of experience, mostly with Java and Spring Boot. For the last three years I've been at a fintech company, working on the payment platform. I own the settlement service, and I'm part of the on-call rotation for it.

Recently I've been focusing on reliability. I led the move from synchronous calls to an event-driven flow with Kafka, which cut our timeout errors by about 70 percent.

I'm now looking for a role where I can work on larger-scale distributed systems and spend more time mentoring, which is why this position caught my attention."

### Useful phrases
- **Thanks for taking the time today.**
- **a little excited, to be honest** (natural, friendly)
- **I own the... service**
- **Recently I've been focusing on...**
- **That's why this position caught my attention.**

### Common mistakes for Vietnamese speakers
- **"I'm fine, thank you, and you?"** → sounds textbook. More natural: "I'm good, thanks. How about you?" / "Doing well, thanks!"
- Starting with "My name is..., I'm 30 years old, I graduated from..." → age and university not needed for senior.
- Speaking over 2 minutes → interviewer loses interest before asking anything.

> Senior tip: Prepare your intro using the **present → past → future** formula: what you do now, one quantified achievement, why you want this role. Practice until it feels natural but **don't memorize word-for-word** — sounding scripted loses points. Pronounce **experience** /ɪkˈspɪəriəns/, stress on "SPEE".`,
    follow: ['Why are you interested in this role specifically?', 'Which part of your current job do you enjoy the most?', 'What is one achievement you are most proud of?']
  },
  'english-041': {
    q: 'How would you close an interview professionally?',
    a: `**Summary:** Thank the interviewer, reference **one specific topic** from the conversation, briefly reaffirm interest, and ask about **next steps and timing**. Warm, professional, without asking "Did I pass?". After the interview, send a short thank-you email within 24 hours.

### Sample answer
"Thank you so much for your time today. I really enjoyed the discussion about how you're splitting the order service — it's a problem I've worked on before, and it made me even more interested in the role.

Could you tell me what the next steps in the process look like, and roughly when I might hear back?"

*Interviewer: "We'll get back to you within a week."*

"Great, that sounds good. Thanks again, and have a good rest of your day."

*Follow-up email (same day):*
"Hi Anna, thank you for the conversation today. I especially enjoyed discussing the order service migration. I'm excited about the role and look forward to hearing about the next steps. Best regards, Minh"

### Useful phrases
- **I really enjoyed the discussion about...**
- **It made me even more interested in the role.**
- **What do the next steps look like?**
- **roughly when I might hear back**
- **Have a good rest of your day.**

### Common mistakes for Vietnamese speakers
- **"Thank you for your listening."** → incorrect. Correct: **"Thank you for listening"** or "Thank you for your time".
- **"So... did I pass?"** → puts interviewer in an awkward spot.
- **"I hope I will have a chance to work with you."** → grammatically correct but stiff. More natural: "I'd love to work with the team" or "I look forward to hearing from you."

> Senior tip: Referencing a specific topic ("the order service migration") shows you truly listened and helps the interviewer remember you when writing feedback. Watch the grammar: **look forward to + V-ing** ("look forward to hearing"), not "look forward to hear".`,
    follow: ['What should you include in a follow-up email after the interview?', 'How do you follow up if you have not heard back after the promised date?', 'What would you say if the interviewer asks whether you have other offers?']
  },
  'english-042': {
    q: 'What questions would you ask the interviewer?',
    a: `**Summary:** At senior level, reverse questions are part of the evaluation. Pick 2–3 **open** questions (not yes/no), **suited to who is interviewing you** (engineer, manager, director), about success in the first six months, the team's real technical challenge, and how the team balances features with reliability. Ask one follow-up based on their answer.

### Sample answer
"Yes, I have a few. First, what would a successful first six months look like for someone in this role?

Second, what's the biggest technical challenge the team is dealing with right now — is it more about scale, reliability, or legacy code?

And how does the team balance feature work with tech debt and reliability work? Is there a dedicated budget for it, or is it negotiated sprint by sprint?"

*Interviewer: "Mostly legacy code — we're breaking up a monolith."*

"Interesting. How are you deciding which parts to extract first?"

If I'm talking to an engineer, I might also ask: "What does on-call look like, and how often do you get paged?" With a director, I'd rather ask about the team's priorities for the next year.

### Useful phrases
- **What would success look like in...?**
- **What's the biggest challenge the team is dealing with?**
- **Is it more about X, Y, or Z?**
- **How are you deciding...?**
- **What does on-call look like?**

### Common mistakes for Vietnamese speakers
- "No, I think everything is clear." → misses the chance to show engagement.
- Asking questions answered on the website ("What does your company do?").
- Asking yes/no questions ("Do you use microservices?") → hard to open a conversation. Use "How do you...?" instead.

> Senior tip: The follow-up question ("How are you deciding which parts to extract first?") scores highest — it turns the interview into a peer discussion. Their answers also help **you** evaluate the company: does the team have time for tech debt, is on-call overloaded?`,
    follow: ['What would you ask a hiring manager versus a peer engineer?', 'How do you use the answers to decide whether to accept an offer?', 'What red flags do you listen for in the answers?']
  },
  'english-043': {
    q: 'How would you discuss salary expectations?',
    a: `**Summary:** In the first round (recruiter screen), ask for the **budgeted range** first; if pressed, give a **researched range**, state **gross or net**, monthly or annual, and note it depends on the **total package**. Don't invent numbers, don't say "salary is not important to me".

### Sample answer
*Recruiter: "What are your salary expectations?"*

"That's a fair question. I'd like to understand the scope of the role a bit better before I give a precise number. Could you share the budgeted range for this position?"

*Recruiter: "We'd prefer to hear your number first."*

"Sure. Based on my research for senior backend roles in Ho Chi Minh City and on my current package, I'm looking for something in the range of X to Y million dong gross per month. That depends on the total package, of course — things like the bonus, the 13th-month salary, insurance, and remote flexibility. Is that roughly in line with your range?"

Notice that I say **gross** clearly. In Vietnam people often talk about net salary, while many international companies quote gross, so it's worth confirming that you're both talking about the same number.

### Useful phrases
- **Could you share the budgeted range?**
- **I'm looking for something in the range of...**
- **gross / net per month**
- **depending on the total package**
- **Is that roughly in line with your range?**

### Common mistakes for Vietnamese speakers
- "Salary is not important to me." → nobody believes it, and you lose negotiating leverage.
- "How much can you pay?" → sounds blunt. Use "Could you share the range?".
- Stating net when the company means gross (or vice versa) → huge gap when the offer arrives.

> Senior tip: Prepare three numbers in advance: your **walk-away minimum**, your **target**, and your **ask** (slightly above target). When stating a range, put your target at the **bottom of the range**, because companies often anchor near the bottom. Negotiate details after you have the offer — see english-057.`,
    follow: ['What would you say if the offer is below your range?', 'How do you answer when asked about your current salary?', 'Which benefits besides base salary matter most to you?']
  },
  'english-044': {
    q: 'How would you discuss your start date?',
    a: `**Summary:** State your **actual notice period** per contract, the earliest realistic start date, and commit to a **proper handover** for your current employer. If there's flexibility, state the conditions; don't promise "start immediately" unless you're certain.

### Sample answer
"My contract has a 30-day notice period, so if I sign this month, the earliest I could start would be around the beginning of next month.

I'd also like to leave my current team in good shape. I'm the main owner of our settlement service, so I want to do a proper handover — documentation and a couple of knowledge-transfer sessions.

If you need someone sooner, I can ask my manager whether a shorter notice period would be possible, but I don't want to promise that until I've talked to them. Is there a particular date you have in mind?"

### Useful phrases
- **notice period**
- **30 days' notice** (note the possessive **days'**)
- **the earliest I could start would be...**
- **a proper handover**
- **I don't want to promise that until...**

### Common mistakes for Vietnamese speakers
- "I can start immediately." while still employed → if untrue, the new company loses trust.
- "I will quit my job tomorrow." → sounds unprofessional; interviewer thinks you'll leave them the same way.
- Prepositions: "start **on** March 3rd" (specific day), "start **in** March" (month), "start **at the beginning of** next month".

> Senior tip: Mentioning handover is a positive signal: the new company sees you'll leave responsibly later too. Check your current contract's notice period and remaining leave days before answering — don't guess.`,
    follow: ['What if we need you to start in two weeks?', 'How would you plan the handover at your current job?', 'Do you have any planned time off in the next few months?']
  },
  'english-045': {
    q: 'Could you walk me through a recent Java project?',
    a: `**Summary:** Order: **what the project does, for whom, scale** → **brief tech stack** → **your role** → **one technical decision** (problem, solution, trade-off) → **quantified results** → invite interviewer to go deeper. About 2 minutes.

### Sample answer
"Sure. The most recent one is a loyalty points service for an e-commerce platform with about two million active users. It's a Spring Boot 3 service on Java 21, running on EKS, with PostgreSQL and Kafka.

The team was four engineers. I was the most senior, so I drove the design and owned the points ledger.

The most interesting decision was how to store balances. The first idea was a single balance column that we update in place, but that makes auditing and fixing mistakes really hard. I proposed an append-only ledger table instead — every earn or spend is a row — with a balance column that's updated in the same transaction, and a version column for optimistic locking to handle concurrent spends.

It cost us a bit more storage and a more complex history query. But when a promotion rule had a bug, we recomputed the affected balances from the ledger in an afternoon instead of guessing.

Since launch, it's handled peaks of around 1,500 writes per second during flash sales, with p99 latency under 100 milliseconds. I'm happy to go deeper into the data model or how we tested it."

### Useful phrases
- **The most recent one is...**
- **I drove the design and owned...**
- **The most interesting decision was...**
- **It cost us... But...**
- **I'm happy to go deeper into...**

### Common mistakes for Vietnamese speakers
- Listing tech stack for 1 minute ("Java, Spring, Hibernate, Redis, Kafka, Docker, Jenkins...") → nobody remembers. Name 3–4 main ones.
- No decision or trade-off → sounds like you just follow tickets.
- Mixing tenses: past for completed work ("I proposed"), present for current state ("It's a Spring Boot service"), present perfect for results to date ("it's handled peaks of...").

> Senior tip: Pick a decision where you can **explain the rejected alternative**. Senior interviewers almost always ask "Why not just use X?" — e.g., "Why not pessimistic locking?" or "Why not event sourcing?". Prepare 2–3 answers for those.`,
    follow: ['Why did you choose optimistic locking instead of a pessimistic lock?', 'How did you test the concurrent spend scenario?', 'What would you change if you built it again?']
  },
  'english-046': {
    q: 'Tell me about a production incident you helped resolve.',
    a: `**Summary:** Tell chronologically: **user impact → your role → evidence that found the cause → mitigation → signal confirming recovery → root-cause fix and prevention**. Use past tense, clarify your part, no confidential info.

### Sample answer
"One Friday evening, our order API started returning errors — about 15 percent of requests failed for roughly 40 minutes. I was the on-call engineer, so I was the first responder.

The first thing I checked was the database. It looked healthy — CPU was low — but the HikariCP metrics showed all 50 connections in use, and request threads were waiting for a connection until they timed out after 30 seconds. A thread dump confirmed it: most threads were inside a {{@Transactional}} method that called the fraud-check service over HTTP, and that service had slowed down to about eight seconds per call. So every slow call was holding a database connection the whole time.

To stop the bleeding, I lowered the HTTP client timeout to two seconds through our config and switched on the fallback that sends orders to manual fraud review. Errors dropped to almost zero within five minutes, and we confirmed recovery when the pending-connection count went back to zero.

The following week, I moved the remote call out of the transaction and added an alert for pool usage above 80 percent for five minutes. We wrote a blameless postmortem, and I presented it to the wider engineering team."

### Useful phrases
- **I was the first responder.**
- **The first thing I checked was...**
- **That pointed to... / A thread dump confirmed it.**
- **To stop the bleeding, ...**
- **We confirmed recovery when...**

### Common mistakes for Vietnamese speakers
- Wrong tense: "the API return error" → **"the API returned errors"**. The whole story is past tense.
- "The system was die." → incorrect. Correct: **"The system went down"** / "The service crashed".
- "I fixed the bug." without saying **how you knew** it was the cause → missing the evidence part, which interviewers care about most.

> Senior tip: Clearly separate **mitigation** (stop the bleeding now, e.g., lower timeout, enable fallback) and **root-cause fix** (move HTTP call out of transaction). Interviewers value "stop the bleeding first, cure later". Holding a network call inside {{@Transactional}} is a classic mistake that drains the connection pool — worth remembering.`,
    follow: ['How did you communicate with stakeholders during the incident?', 'Why is calling a remote service inside a transaction dangerous?', 'What did you change in your monitoring afterwards?']
  },
  'english-047': {
    q: 'How would you explain an architecture decision to a business stakeholder?',
    a: `**Summary:** Translate the architecture decision into **customer and business impact**: what problem exists today, what the user will see change, what it costs, and measure success with **one number**. Avoid terms like queue, worker, Kafka.

### Sample answer
"Right now, when a customer clicks Export, the system builds the whole report while they wait. For our bigger customers that takes more than a minute, so the request times out. That's where the 'failed export' tickets come from — about 120 of them last month.

What we're proposing is to build the report in the background. The customer clicks Export, sees a message saying 'Your report is being prepared', and gets an email when it's ready — usually within a couple of minutes.

For the business, that means no more failed exports and fewer support tickets. The cost is about three weeks of engineering time, and one small change in the experience: customers wait for a notification instead of getting the file right away.

We'll track one number: the percentage of exports that finish successfully. Today it's about 92 percent, and our goal is 99.5 percent. Does that trade-off work for you?"

### Useful phrases
- **Right now, when a customer..., ...**
- **That's where... come from.**
- **What we're proposing is...**
- **For the business, that means...**
- **We'll track one number: ...**

### Common mistakes for Vietnamese speakers
- Saying "we will add a message queue and async workers" → stakeholder doesn't know what that means for them.
- Only stating benefits, hiding costs (engineering time, UX change).
- No success metric → nobody knows if the project succeeded.

> Senior tip: Start from the **pain the stakeholder already knows** (support tickets, customer complaints), not from architecture. The closing question "Does that trade-off work for you?" gives them decision authority — they own the customer experience.`,
    follow: ['What if the stakeholder asks why we cannot just make the export faster?', 'How would you explain a delay in this project to the same stakeholder?', 'How do you choose the success metric?']
  },
  'english-048': {
    q: 'How do you make plural and past tense endings clearer?',
    a: `**Summary:** Vietnamese lacks final consonant clusters (/sts/, /kst/), so Vietnamese speakers tend to **drop -s and -ed endings** — "we deploy it last week" sounds like present tense. Learn the three pronunciations for each ending, practice in pairs, and record yourself to self-check.

### Sample answer
"Since my first language is Vietnamese, where words don't end in consonant clusters, I used to drop endings. I'd say 'we deploy it last week', and it sounded like present tense.

What helped was learning the three sounds for each ending and practicing in pairs: 'one request — two requests', 'we deploy — we deployed'. I also record myself explaining a past project, because that's full of past tense, and I listen only for endings. Now I slow down slightly on the ending, finish the sound, and then go back to my normal pace."

### Three ways to pronounce -s / -es
| Final sound of word | Pronounced as | Example |
|---|---|---|
| voiceless /p t k f θ/ | /s/ | requests, locks, chips |
| voiced, vowel | /z/ | logs, deploys, nodes, servers |
| /s z ʃ tʃ dʒ/ | /ɪz/ | caches, services, branches, pages |

### Three ways to pronounce -ed
| Final sound of word | Pronounced as | Example |
|---|---|---|
| voiceless /p k f s ʃ tʃ/ | /t/ | fixed /fɪkst/, pushed, stopped |
| voiced, vowel | /d/ | deployed, logged, configured |
| /t/ or /d/ | /ɪd/ | migrated, added, tested |

### Practice sentence
"Last week we **migrated** two **services**, **fixed** three **bugs**, and **deployed** the **changes** to all **regions**."

### Common mistakes for Vietnamese speakers
- Pronouncing "fixed" as "fix-ed" /fɪksɪd/ → wrong; only add /ɪd/ after /t/ and /d/.
- Dropping endings entirely → "two request", "we test it yesterday".
- Over-pronouncing, dragging "requests-sss" → sounds forced; just **complete the sound**, don't over-emphasize.

> Senior tip: Native interviewers understand Vietnamese accents, but missing -ed makes them **misunderstand the timeline**: "we deploy it" (habitual) vs "we deployed it" (completed). When describing completed projects, add a time marker ("last year", "in 2023") so the listener gets it right even if you miss the ending.`,
    follow: ['Which other sounds are hard for Vietnamese speakers in technical English?', 'How do you practice pronunciation without a teacher?', 'How do you keep your pace natural while finishing every ending?']
  },
  'english-049': {
    q: 'How do you pronounce unfamiliar technical terms?',
    a: `**Summary:** Check the canonical pronunciation (dictionary, project docs, or official conference talks), note the **stressed syllable**, then practice in a full sentence. If the team has its own convention, ask a colleague. Clear, consistent speech matters more than mimicking an accent.

### Sample answer
"First, I check how the creators or the community say it — many projects mention it in their docs or in conference talks. For example, nginx is 'engine-x', not 'n-jinx'. For normal English words, I use a dictionary with audio and pay attention to the stressed syllable, because wrong stress is what usually makes a word hard to recognize.

Then I practice the word in a full sentence, like 'We put a cache in front of the database', so it feels natural when I say it under pressure.

And if a team has its own way of saying something — some people say 'sequel', some say 'S-Q-L' — I just follow what my colleagues use. Both are fine."

### Commonly mispronounced words
| Word | Pronunciation | Note |
|---|---|---|
| cache | /kæʃ/ | sounds exactly like "cash", not "ca-shay" |
| queue | /kjuː/ | sounds like the letter "Q" |
| architecture | /ˈɑːrkɪtektʃər/ | "ch" pronounced /k/ |
| Kubernetes | /ˌkuːbərˈnetiːz/ | stress on "NET" |
| YAML | /ˈjæməl/ | rhymes with "camel" |
| JSON | /ˈdʒeɪsən/ | like the name "Jason" |
| Linux | /ˈlɪnəks/ | not "line-ux" |
| suite | /swiːt/ | like "sweet", not "suit" |
| Hibernate | /ˈhaɪbərneɪt/ | stress on first syllable "HI" |
| PostgreSQL | "post-gres-Q-L" | or just "Postgres" |

### Common mistakes for Vietnamese speakers
- Equal stress on every syllable, no word stress → native speakers struggle to recognize the word.
- Dropping final consonants: "cache" becomes "ca", "queue" becomes "kyu".
- Avoiding hard words by talking around them → just say it; if wrong, interviewer understands from context.

> Senior tip: Make a list of 20–30 terms you use most when describing your projects (tech names from your CV) and drill them until fluent. Interviewers hear these repeatedly in one session, so fixing them gives the highest ROI.`,
    follow: ['How do you handle it when you realize you mispronounced a word?', 'Which word stress mistakes make you hardest to understand?', 'How would you ask a colleague how to pronounce a term without sounding awkward?']
  },
  'english-050': {
    q: 'How do you describe completed work and current responsibilities?',
    a: `**Summary:** Use **present simple** for ongoing responsibilities, **past simple** for completed work (with time marker), **present perfect** for results to date (no specific time), **present continuous** for work in progress. Wrong tense makes the interviewer misunderstand what you've actually finished.

### Sample answer
"At my current company, I'm responsible for the payment gateway integration. I maintain the adapters for three acquirers, and I'm on the on-call rotation.

Before that, I worked on the merchant onboarding service, where I built the document upload flow for identity checks.

Right now I'm leading our migration to Spring Boot 3. We've moved six of our nine services so far, and we're planning to finish by the end of the quarter."

### Which tense to use?
| Intention | Tense | Example |
|---|---|---|
| Ongoing responsibility | Present simple | I **maintain** the adapters. |
| Completed work, specific time | Past simple | In 2023 I **built** the upload flow. |
| Result to date | Present perfect | We**'ve moved** six services so far. |
| In progress now | Present continuous | I**'m leading** the migration. |
| Started in past, still continuing | Present perfect continuous | I**'ve been working** here since 2021. |

### Common mistakes for Vietnamese speakers
- "I **have worked** on that project **in 2022**." → wrong; specific time marker requires past simple: **"I worked on that project in 2022."**
- "I **am working** here **since** 2021." → **"I've been working here since 2021."**
- "I responsible for..." / "I in charge of..." → missing verb: **"I'm responsible for..."**, **"I'm in charge of..."**.

> Senior tip: Be careful with **not-yet-finished** claims: saying "I migrated the system to Spring Boot 3" when only 6 of 9 services are done will be seen as exaggeration if probed. "We've moved six of nine so far" is both grammatically correct and honest.`,
    follow: ['What are you working on right now?', 'What is one thing you have achieved in your current role that you are proud of?', 'How has your role changed since you joined?']
  },
  'english-051': {
    q: 'How do you avoid common article mistakes?',
    a: `**Summary:** Vietnamese lacks articles, so Vietnamese speakers tend to **drop a/an/the**. Ask yourself two questions: (1) is the noun **countable and singular**? → needs a/an or the; (2) does the listener **already know which one**? → if yes, use the. Plural or uncountable nouns spoken generally take **no article**.

### Sample answer
"Vietnamese doesn't have articles, so I used to drop them — I'd say 'I fixed bug in payment service'. Now I ask myself two quick questions.

First: is it one countable thing? Then it needs an article. So it's 'I fixed **a** bug', not 'I fixed bug'.

Second: does the listener already know which one I mean? Then I use 'the'. For example: 'We added **a** cache last year. **The** cache cut our database load in half.' The first time it's 'a', because it's new information; after that it's 'the'.

If I'm talking about things in general, I usually don't need an article at all: 'Caches can return stale data', 'We store data in PostgreSQL'."

### Uncountable nouns common in IT
No "a" and no "-s": **information, feedback, advice, software, hardware, equipment, traffic, research, knowledge, documentation, code**.
- "some feedback" (not "some feedbacks")
- "a piece of code" or "some code" (not "a code" or "codes" when referring to source code)

### Quick fixes
| Wrong | Correct |
|---|---|
| I am backend developer. | I'm **a** backend developer. |
| I fixed bug in payment service. | I fixed **a** bug in **the** payment service. |
| Can you give me some feedbacks? | Can you give me some **feedback**? |
| We had a high traffic. | We had high traffic. / We had **a** traffic spike. |
| We use the Kafka. | We use Kafka. (but: **the** Kafka cluster) |

> Senior tip: Don't aim for perfection while speaking — missing articles rarely causes misunderstanding. Focus on fixing the **3 most frequent errors in your stories**: "I'm **a** ... engineer", "**the** + your service name", and uncountable nouns (feedback, code, information). Record your self-intro and count article errors — fastest way to improve.`,
    follow: ['When do you use "the" with technology or product names?', 'How do you practice grammar while speaking without slowing down too much?', 'Which grammar mistake do you most want to fix, and how?']
  },
  'english-052': {
    q: 'Walk me through a system you designed recently. (2-3 minutes)',
    a: `**Summary:** Follow **problem → key constraints (load, latency, consistency) → architecture → one trade-off → quantified results**. Don't tell it chronologically; use your real numbers (the example below is just a template).

### Sample answer
"Sure. Last year I redesigned our order placement flow. The problem was that the order API called payment, inventory and fraud services one after another, synchronously. At peak — around 300 orders per second during sales — p99 latency went above three seconds, and if any one service was slow, the whole order failed.

The key constraint was that we couldn't lose or double-charge an order. So the API now does just one thing synchronously: it saves the order and an outbox record in the same database transaction, and returns 'order received'. A small publisher reads the outbox and sends an event to Kafka. Payment and inventory consumers process it idempotently, using the order ID as the key. A saga coordinates the steps, and if payment fails, it releases the reserved stock — that's a compensating action, not a real rollback.

We kept the fraud check synchronous, because the business wanted to reject risky orders before accepting them.

The trade-off is that customers now see a 'pending' state for a few seconds, and we have to operate retries, consumer lag alerts and a nightly reconciliation job. In return, p99 for the order API dropped to about 250 milliseconds, and a slow inventory service no longer fails orders."

### Useful phrases
- "The main bottleneck was..."
- "The key constraint was..."
- "I traded X for Y because..."
- "The result was..."

### Common mistakes for Vietnamese speakers
- Telling it chronologically instead of problem → solution → result; listener loses the thread.
- Using "we did" for everything, without clarifying your specific role.
- Skipping the trade-off, making it sound like an advertisement.`,
    follow: ['What would you change if traffic doubled?', 'How did you test consistency?']
  },
  'english-053': {
    q: 'Tell me about a production incident you handled. (STAR, past tense)',
    a: `**Summary:** Tell it with STAR, **entirely in past tense**: Situation (user impact) → Task (your responsibility) → Action (evidence that found the cause, why you chose that mitigation) → Result (recovery time, any data impact) + prevention. Every number must match the real incident timeline.

### Sample answer
"**Situation:** After a routine deployment on a Tuesday morning, our notification service fell behind. Consumer lag on the order-events topic grew from almost zero to about 400,000 messages in an hour, so customers got their order confirmations up to 50 minutes late.

**Task:** I owned that service, so I led the investigation.

**Action:** The logs showed the consumer group rebalancing every few minutes. The new release had added a call to a template service for each message, so processing a batch of 500 records now took longer than {{max.poll.interval.ms}}, which is five minutes by default. Kafka treated the consumer as dead, rebalanced, and the next consumer got the same batch again — so we were stuck in a loop. To mitigate, I rolled back the release, because that was the fastest safe option and the change was backward compatible. Lag started dropping within ten minutes.

**Result:** We were fully caught up after about 40 minutes. Because the consumer was idempotent, the reprocessed messages didn't send duplicate emails — we checked that against the email provider's logs. Afterwards I reduced {{max.poll.records}}, cached the templates, and added an alert on consumer lag and on rebalance rate."

### Useful phrases
- "The symptom was..."
- "I first checked..."
- "The root cause turned out to be..."
- "To prevent recurrence, we..."

### Common mistakes for Vietnamese speakers
- Using present tense instead of past tense for a resolved incident.
- Saying "we fixed" without specifying what you personally did.
- Skipping the prevention part — interviewer doesn't see what you learned.`,
    follow: ['How did you communicate during the incident?', 'What would you do differently?']
  },
  'english-054': {
    q: 'Explain the trade-off between Kafka and REST to a non-technical manager.',
    a: `**Summary:** Compare by business impact — does the caller need an immediate answer, how coupled are the two systems, how are failures handled — with a simple everyday analogy.

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
    a: `**Summary:** Acknowledge the tech lead's point, state your concern with evidence, then propose a small experiment to decide together.

### Sample answer
I would say: "I see your point about shipping faster. My concern is that this migration may hold a lock on the orders table during peak traffic, based on the behavior we saw in testing. Could we check its lock behavior and duration on production-like data, then choose a rollout window or a safer migration plan? We could also put the application change behind a flag if that is compatible with the schema." This stays respectful, brings evidence, and offers concrete ways to reduce the risk — without pretending that a flag or a maintenance window removes it completely.

### Details and WHY
Disagreeing with a tech lead is normal in a healthy engineering environment. Tech leads prioritize system integrity, but sometimes they also face delivery pressure from management or clients. The key is how you present the disagreement: not "I'm right, you're wrong," but "I have a concern about a technical risk, let's solve it together."

If you feel your tech lead is deciding too hastily or without evidence, use the "Evidence-based disagreement" tactic:
- **Acknowledge:** Confirm you understand their reasoning (e.g., need for speed, cost savings). This makes them feel heard.
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
- Saying "I disagree" bluntly, which can sound confrontational.
- Stating only an opinion without evidence or alternatives.
- Staying silent, then complaining after the meeting.`,
    follow: ['What if the lead insists?', 'How do you handle being wrong?']
  },
  'english-056': {
    q: 'Why are you leaving your current role, and why this bank?',
    a: `**Summary:** Connect what you've learned at your current company to a goal that the new role offers; stay positive, don't complain. The "why this bank" part must be based on real information you've researched.

### Sample answer
"I've learned a lot in my current role, especially about building payment integrations and running services in production. But the product is quite stable now, and most of my work is maintenance. I'm looking for a place where I can work on larger-scale systems with stricter reliability requirements.

That's what attracted me to this bank. From the job description, the team is moving its core payment flows from a legacy platform to Spring Boot services, and that's exactly the kind of migration I'd like to contribute to — and I've done a smaller version of it before. I also like that the role includes mentoring. I'd be curious to hear how the team is planning that migration."

(Replace the details with your real information and the company's — don't invent a project or roadmap you haven't verified.)

### Details and WHY
This question tests your attitude and growth mindset. The interviewer does not want to hear reasons like "the manager is difficult" or "salary is low." They want a candidate with clear goals and a desire to contribute at a higher level.
- **Leaving:** Focus on what you've learned and why you're ready for the next step. If your current company has stabilized and lacks major technical challenges, state that neutrally.
- **Joining:** This is where you show you've researched the company. Highlight a technical aspect, product, or culture you truly admire or want to master.
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
- Failing to research the company, giving generic answers.`,
    follow: ['What would make you stay at your current job?', 'Where do you see yourself in 3 years?']
  },
  'english-057': {
    q: 'How do you answer salary expectation and negotiation questions?',
    a: `**Summary:** Give a well-researched range, anchor on total compensation, and ask about their band before committing.

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
  }
});