/*
 * English translation of js/data/q-english.js — task T676. Format: js/core/i18n.js (content overlay).
 * ids: english-081 english-082 english-083 english-084 english-085 english-086 english-087 english-088 english-089 english-090 english-091 english-092 english-093
 */
App.i18n.content({
  'english-081': {
    q: 'How would you explain garbage collection in the JVM to a junior developer who has never seen a GC log?',
    a: `**Summary:** Start from an everyday analogy (tidying a room), then move concept → mechanism → example → common mistakes. Keep the English simple and never use a term you have not explained. The goal is that the listener understands **why** there is a pause and **when** they should worry.

### Sample answer
I would start with an analogy: imagine your desk is the heap, and the objects you use are papers on it. Garbage collection is the moment you stop working, throw away the papers you no longer need, and tidy the rest. The reason we need it is that Java does not ask you to free memory by hand; the JVM reclaims it automatically when no reference points to an object anymore.

Then I would explain the generations. New objects go into the young generation, specifically Eden. Most objects die quickly, so the JVM cleans Eden often and cheaply; survivors move to Survivor spaces and eventually to the old generation. Old generation collection is rarer but more expensive, which is why a long pause usually comes from there.

I would show one simple GC log line and decode it: "GC pause 45 ms, 200 MB to 80 MB" means it freed 120 MB in 45 milliseconds. Then the practical advice: if you see frequent long pauses, look for memory leaks, oversized caches, or objects that live too long. Do not tune GC flags before you measure.

### Useful phrases
- **throw away the papers you no longer need**: discard the sheets you are not using any more
- **reclaimed automatically**: taken back by the JVM without you asking for it
- **most objects die quickly**: the majority of objects stop being referenced almost immediately
- **a long pause usually comes from there**: the long stop-the-world stop normally originates in the old generation
- **do not tune before you measure**: change GC flags only after you have data

> Senior tip: When you explain something technical to a junior, **your precision has to be higher than usual**, because they will memorise your wording verbatim. Do not say "GC deletes objects you don't use"; say "GC deletes objects that are no longer referenced". Pronunciation: **heap** /hiːp/, **pause** /pɔːz/, and **reclaim** /rɪˈkleɪm/ with the stress on the second syllable.`,
    follow: [
      'What is the difference between minor and major GC?',
      'How would you explain G1GC to someone who only knows Serial GC?',
      'What metric would you show a junior to prove GC is healthy?',
    ],
  },
  'english-082': {
    q: 'How would you explain a technical trade-off to a non-technical product manager so they can make a decision?',
    a: `**Summary:** Do not use architecture vocabulary; use **options + cost + risk + a recommendation**. Talk in terms of money, time, and risk to the user. Always finish with one clear recommendation, never "it depends".

### Sample answer
I would avoid architecture words entirely. Instead I structure it as three options with a price tag and a risk.

Take the example of adding search to an order tool. Option one: use Postgres full-text search. It is free, ships in two weeks, and works well up to about two million orders. Option two: Elasticsearch. It gives better ranking and scales further, but costs a new system to operate, roughly one engineer-week per month, and ships in six weeks. Option three: a managed search service. Fastest to ship, but we pay per query and lose control of data residency.

Then I translate to business impact: "Option one means we can launch with the partner next month but may need to migrate later. Option two means a better experience but a six-week delay and a new on-call rotation. Option three is the lowest risk to our timeline but the highest monthly cost."

I end with a recommendation and a condition: "I recommend option one now, with a trigger: if search traffic exceeds ten thousand queries a day or latency crosses two seconds, we revisit." That gives the PM a decision and a clear rule for revisiting it.

### Useful phrases
- **with a price tag and a risk**: each option stated together with what it costs and what can go wrong
- **we lose control of data residency**: we can no longer decide which country our data physically sits in
- **the lowest risk to our timeline**: the option that threatens the schedule the least
- **a trigger to revisit**: a condition agreed in advance that makes us re-open the decision
- **I end with a recommendation**: I close by naming the option I would choose, not an open question

> Senior tip: A PM does not need to know what a GIN index or an inverted index is; they need **money, time, and risk**. Do not say "it depends" and stop there — that is how you dodge responsibility. Always give one recommendation with an explicit condition. Pronunciation: **residency** /rɪˈzɪdənsi/, and **trade-off** is read /ˈtreɪd ɒf/ (noun) or /ˈtreɪd ɒf/ (verb).`,
    follow: [
      'What if the PM insists on the most expensive option?',
      'How do you handle a trade-off where the cost is hard to quantify?',
      'How do you document a decision once it is made?',
    ],
  },
  'english-083': {
    q: 'Tell me about a time you pushed back on a deadline. How did you say it, and what was the outcome?',
    a: `**Summary:** Pushing back is not "refusing", it is **bringing data + alternative plans**. Structure: the situation → why the deadline is not feasible → what you proposed → the result. Tone: collaborative, never defensive.

### Sample answer
Two months ago our team was asked to deliver a merchant onboarding flow in four weeks instead of the six we had planned. I did not say "that is impossible" in the meeting. I took one day to break the work down and came back with numbers: the full scope needed about twenty-two engineer-days and we had roughly fourteen available, including testing.

I went to the product owner with three options. Option one: ship the core flow in four weeks without the reporting dashboard. Option two: keep the full scope and move the launch by two weeks. Option three: ship one additional document type now and the other two three weeks later. I also showed the risk of each, including that option one would leave merchants unable to reconcile their own reports.

We chose option three. I wrote the decision into the release notes so nobody was surprised, and I added a weekly checkpoint so we could catch slippage early. We shipped on time and nobody worked a weekend. The PO later told me she appreciated that I brought options instead of just a problem.

### Useful phrases
- **I did not say "that is impossible"**: I avoided a flat refusal in front of the room
- **I came back with numbers**: I returned with an estimate, not with an opinion
- **I brought options instead of just a problem**: I offered choices rather than only bad news
- **nobody was surprised**: everyone had been told before it happened
- **a weekly checkpoint**: a short status review every week to catch slippage early

> Senior tip: Do not say "I pushed back" without describing **how you said it** — the interviewer is looking for the soft skill. Avoid a bare "no"; always pair it with "yes, if..." or "yes, but...". Pronunciation: **push back** is a phrasal verb, with light stress on both "push" and "back"; **scope** /skoʊp/ is one syllable, do not add a vowel sound at the end.`,
    follow: [
      'What if the product owner refused to cut scope?',
      'How do you communicate a slipping deadline without losing trust?',
      'Have you ever said no to a deadline and regretted it?',
    ],
  },
  'english-084': {
    q: 'Describe your CI/CD pipeline and one thing you would improve in it.',
    a: `**Summary:** Describe the pipeline by **stages** (build → test → security → deploy → verify), name the tools you really use and how long each stage takes, and give **one specific improvement** with its reason and its cost. Avoid listing technologies you never explain.

### Sample answer
Our pipeline runs on GitHub Actions. On every pull request we run unit tests, a SonarQube scan, and a Docker build. On merge to main, we build the image, push it to ECR, and deploy to staging automatically. Production deploy is manual but one-click, after a smoke test suite passes. Total time from merge to production is about twelve minutes.

The thing I would improve is test feedback speed. Right now the full suite takes eight minutes, and developers context-switch while waiting. I would split tests into a fast tier that runs on every commit, under two minutes, and a slow tier that runs nightly. I would also add flaky-test detection: if a test fails once and passes on retry, quarantine it and alert the owner instead of silently passing.

The second improvement is rollback. Today rollback is manual and takes about five minutes. I would add automated rollback on a spike in error rate or latency after deploy, using Argo Rollouts with a canary step at ten percent of traffic for five minutes.

### Useful phrases
- **on every pull request**: triggered by each PR, before anything is merged
- **one-click deploy**: a single button press, but still a human decision
- **context-switch while waiting**: lose focus on the task in hand while the suite runs
- **quarantine it**: move the unreliable test aside so it no longer blocks anybody
- **automated rollback on a spike**: the system reverts the deploy by itself when error rate or latency jumps

> Senior tip: Do not just list tools ("we use Jenkins, Docker, Kubernetes"); the interviewer asks "what would you improve" to see whether you have **a systems view**. Every improvement should come with a **measurable reason** (time, risk) and a **cost**. Pronunciation: **pipeline** /ˈpaɪplaɪn/, and **quarantine** /ˈkwɒrəntiːn/ with the stress on the first syllable.`,
    follow: [
      'How do you handle secrets in your CI/CD pipeline?',
      'What is your strategy for database migrations in CI/CD?',
      'How would you reduce flaky tests in a large suite?',
    ],
  },
  'english-085': {
    q: 'How do you review a pull request? What do you look for, and how do you give feedback?',
    a: `**Summary:** Review in **priority order**: correctness → design → readability → style. Say concretely what you check (edge cases, transactions, concurrency, SQL, security) and **how you write comments** (ask instead of order, suggest, separate blocking from non-blocking). Finish with examples of a good and a bad comment.

### Sample answer
I read the PR description first to understand the intent, then I look at the diff in this order: correctness, design, readability, style. Style is automated by the linter, so I rarely comment on it.

For correctness I check edge cases: null inputs, empty collections, boundary values, and what happens under concurrency. For a database change I check the migration is reversible and that there is no N+1 query introduced. For a new endpoint I check authentication, authorisation, input validation, and error responses.

I write comments as questions or suggestions, not commands, and I label them. "Blocking: this can lose money if retried" versus "Nit: rename this variable." I also praise good code explicitly, because review should not only be criticism.

If I disagree with the approach, I ask for a short call rather than a long thread. Written arguments escalate quickly; a five-minute conversation usually resolves them.

### Useful phrases
- **I read the description first**: I look at the intent before I look at the diff
- **I label them**: I put a category word in front of each comment
- **this can lose money if retried**: a duplicate charge could hit a real customer account
- **I praise good code explicitly**: I say out loud what is good, not only what is wrong
- **a long thread**: an ever-growing comment chain between two people

> Senior tip: Do not review the diff top to bottom; reading the **intent first** stops you from wasting time on irrelevant detail. Separate **blocking** from **non-blocking** clearly so the author knows exactly what must change. Pronunciation: **authorisation** (UK) vs **authorization** (US) — pick one and stay consistent; **nit** /nɪt/ is short for nitpick.`,
    follow: [
      'How do you handle a PR that is too large to review well?',
      'What do you do when you disagree with a reviewer?',
      'How do you review code written by someone more senior than you?',
    ],
  },
  'english-086': {
    q: 'You were laid off recently. How do you explain that in an interview without sounding defensive?',
    a: `**Summary:** Say it **briefly, neutrally, and pointed toward the future**. Name the organisational reason (restructuring, budget cut), avoid negative details, and move quickly to what you are doing now and what you want next. Do not invent a story and do not complain.

### Sample answer
My previous company went through a restructuring in the engineering organisation. The payments team I was on was affected, and about twenty percent of the engineering staff were let go, including me. It was a business decision driven by budget, not by performance, and I left on good terms with my manager.

Since then I have used the time deliberately: I finished a course on distributed systems, contributed to an open-source reconciliation library, and started interviewing. I am also clear about what I want next, which is a senior backend role where I can own a service end to end, ideally in a domain with real reliability challenges.

I am not looking for just any job; I am looking for a team where I can stay for a few years. That is why I am particularly interested in your company.

### Useful phrases
- **went through a restructuring**: the company reorganised and cut roles
- **driven by budget, not by performance**: caused by money, not by how well you worked
- **I left on good terms**: the split stayed friendly on both sides
- **I am clear about what I want next**: I know the specific kind of role I am targeting
- **I am not looking for just any job**: I am selective, not desperate

> Senior tip: Do not recount negative details about the old company — the interviewer will suspect that you were the problem. Also do not say "I was laid off" and then go silent; always attach **the action you are taking now** to show initiative. Pronunciation: **layoff** /ˈleɪɒf/ stresses the first syllable, and **restructuring** /riːˈstrʌktʃərɪŋ/ stresses the second.`,
    follow: [
      'What did you learn from the experience of being laid off?',
      'How long have you been looking, and what have you done in the meantime?',
      'What would make you leave your next company voluntarily?',
    ],
  },
  'english-087': {
    q: 'How do you ask for a raise or promotion in English? Walk me through how you would prepare and what you would say.',
    a: `**Summary:** Prepare **evidence with numbers**, choose the timing (right after a big win, not during a hard quarter), and use a **collaborative** tone: state your contribution → state what you want → ask for feedback → agree on a milestone. Avoid ultimatums.

### Sample answer
I would prepare a one-page document with three sections: what I delivered in the last six months with numbers, what I plan to deliver in the next six, and the gap between my current compensation and the market range for my role.

The conversation itself I would keep collaborative. I would open with: "I would like to talk about my role and compensation. Over the last two quarters I led the migration that cut deployment time by forty percent and mentored two engineers to on-call readiness. I am looking for a move to senior-two and a compensation adjustment to around X. What would need to be true for that to happen?"

Then I listen. If the answer is "not now", I ask what the path looks like and by when, and I write it down. I do not threaten to leave. An ultimatum usually backfires because even if they pay, trust is damaged.

### Useful phrases
- **I would like to talk about my role and compensation**: an opener that names the topic without demanding anything
- **what would need to be true**: which conditions must be met for that to happen
- **I write it down**: I record the agreed path so it is not forgotten later
- **an ultimatum usually backfires**: a threat normally produces the opposite result
- **trust is damaged**: the relationship loses its foundation even if you get the money

> Senior tip: Do not say "I deserve a raise" — it sounds like you are claiming an entitlement. Use **"I am looking for"** and **"what would need to be true"** to turn a demand into a conversation. Timing matters: ask after a large achievement, not in the middle of a difficult quarter. Pronunciation: **compensation** /ˌkɒmpenˈseɪʃn/ stresses the third syllable, and **adjustment** /əˈdʒʌstmənt/ stresses the second.`,
    follow: [
      'What if your manager says the budget is frozen?',
      'How do you research the market range for your role?',
      'Would you accept a promotion without a pay increase?',
    ],
  },
  'english-088': {
    q: 'Give me your closing pitch: how would you wrap up an interview and leave a strong final impression?',
    a: `**Summary:** Close with **a short recap of what you bring + what you want to learn + one final question**. Keep it under 60 seconds, confident but not boastful. Do not replay the whole interview.

### Sample answer
I would close with three sentences. First, a summary of fit: "From what we discussed, I think I can contribute quickly on the orchestration and reliability side, because that is exactly the work I have been doing for the last three years."

Second, what I want to learn: "I am also excited about the multi-region work you mentioned, because that is the problem I want to grow into next."

Third, a closing question: "Is there anything about my background that makes you hesitate, so I can address it now?" That question shows confidence and gives you a chance to fix a concern on the spot.

Then I thank them, ask about next steps and timeline, and follow up with a short thank-you email the same day referencing one specific thing we discussed.

### Useful phrases
- **I can contribute quickly on**: I can be useful in that area almost immediately
- **that is the problem I want to grow into**: that is the area I want to develop into next
- **makes you hesitate**: gives you a reason to doubt
- **address it now**: answer the concern while you are still in the room
- **follow up with a short email**: send a brief message after the interview

> Senior tip: Do not end with "I think I did well" — that is self-grading and sounds weak. Do not brag at length either; 60 seconds is enough. "Is there anything that makes you hesitate?" is powerful because it **invites the objection** and gives you the chance to fix it on the spot. Pronunciation: **hesitate** /ˈhezɪteɪt/ stresses the first syllable, and **fit** /fɪt/ in this context means how well you match the role.`,
    follow: [
      'What would you do if the interviewer says they have a concern about your experience?',
      'Is it appropriate to ask about next steps at the end?',
      'How do you write a good thank-you email after an interview?',
    ],
  },
  'english-089': {
    q: 'You did not understand or did not hear the interviewer\'s question. How do you ask them to repeat or clarify politely in English?',
    a: `**Summary:** Use a polite set phrase, keep it short, and **name the reason** (audio, wording) instead of only saying "what?". After they repeat, confirm the question in your own words to prove you understood. Do not ask for repetition too many times.

### Sample answer
I would never say "What?" or "Sorry, I don't understand" on repeat. Instead I use one of these, depending on the situation.

If I did not hear: "I am sorry, I did not catch that last part. Could you say it again?" Or "The connection dropped for a second. Could you repeat the question?"

If I heard but did not understand: "Just to make sure I follow, are you asking about X or Y?" Or "Could you clarify what you mean by 'scale' in this context?"

After they repeat, I confirm in my own words: "So you are asking whether I would use a cache here. Is that right?" That shows I am engaged and prevents me from answering the wrong question.

If I still do not understand after one repeat, I say so honestly: "I want to make sure I answer the right thing. Let me rephrase what I heard, and you can correct me." That is better than guessing and talking for two minutes about the wrong topic.

### Useful phrases
- **I did not catch that**: I did not hear that part clearly
- **could you say it again**: a polite request to repeat the question
- **just to make sure I follow**: so that I am sure I am tracking your question
- **are you asking about X or Y**: offering two readings so the interviewer picks one
- **let me rephrase what I heard**: I restate it in my own words and you correct me

> Senior tip: Vietnamese speakers often say "Can you repeat again?" — that is wrong, because "repeat" already contains "again"; say "Could you repeat that?" or "Could you say that again?". Also avoid repeating "I don't understand"; "Could you clarify...?" sounds more professional. Pronunciation: **clarify** /ˈklærɪfaɪ/ stresses the first syllable, and **rephrase** /riːˈfreɪz/ stresses the second.`,
    follow: [
      'What do you do if the interviewer gives a hint you still do not understand?',
      'How many times is it acceptable to ask for repetition in one interview?',
      'How do you handle a question you genuinely cannot answer?',
    ],
  },
  'english-090': {
    q: 'Walk me through how a money transfer works in the system you built, from the moment the customer presses Pay until the money arrives. Explain it so a new engineer could follow.',
    a: `**Summary:** Narrate **the flow of one transaction**, do not list technologies: at each step say which system receives what, what it writes, where it can break, and which mechanism catches it. The interviewer is judging how well you understand the system you built, not your memory of tool names.

### Sample answer
Sure, let me follow one transfer end to end.

It starts when the customer presses Pay in the mobile app. The app calls our payments API with the amount, the destination, and a header called Idempotency-Key. That key is generated once per user action, so if the app retries after a timeout, the server recognises the retry and returns the original result instead of moving the money twice.

The API validates the request: limits, account status, and a quick balance check. Then it writes the transfer to our ledger, which is the accounting heart of the system. We use double-entry bookkeeping, so every movement is two postings: a debit on the customer account and a credit on the destination or on an internal suspense account. Both postings go into one database transaction, so the books can never be half-applied.

At that point we reply Accepted, not Completed, because the external leg is asynchronous. The instruction is pushed to the core banking system over a queue, and the core sends a callback later with the final status. On success we notify the customer; on failure we post a reversal, a compensating entry that puts the balance back.

If anything stays pending overnight, our daily reconciliation job compares our ledger with the core statement and flags mismatches for the operations team before the customer complains.

### The flow to remember (if you can draw this diagram, you can say it out loud)
~~~seq
title: One transfer instruction from app to core
actors: App | Payments API | Ledger | Core banking
App -> Payments API: POST transfer + Idempotency-Key
Payments API -> Payments API: Duplicate key? Return the stored result
Payments API -> Ledger: Write the debit and the credit in one transaction
Ledger --> Payments API: transferId in PENDING state
Payments API --> App: 202 Accepted
Payments API -> Core banking: Send the instruction over a queue
Core banking --> Payments API: Callback SUCCESS or FAILED
Payments API -> Ledger: Write a reversal if it failed
note App..Core banking: Stuck overnight -> daily reconciliation finds it
~~~

### Term explanations (read this first so you do not stumble)
- **ledger**: the table that records every movement of money; each row is one posting, old rows are never edited, only new rows are appended — that is what gives you an audit history.
- **double-entry**: every transaction is written on both sides, a debit and a credit, and the two always sum to zero; if one side is missing you detect it immediately.
- **idempotency key**: a unique string for one press of the Pay button; the server stores the key together with its result, and when an identical request arrives again it returns the stored result.
- **suspense account**: a holding account for money whose destination is not yet decided, so the money cannot simply evaporate.
- **reversal / compensating entry**: an extra posting in the opposite direction, written when a later step fails.
- **reconciliation**: a daily job that compares our ledger against the core statement and flags any mismatch for the operations team.

### Useful phrases
- **let me follow one transfer end to end**: let me trace a single transaction from start to finish
- **the accounting heart of the system**: the part of the system where money is actually recorded
- **the books can never be half-applied**: the ledger is never left in a half-written state
- **the external leg is asynchronous**: the step that leaves our own system finishes later, through a callback
- **a compensating entry that puts the balance back**: an opposite posting that restores the customer's money

### Common mistakes Vietnamese speakers make
- Saying "This is double-entry bookkeeping is a method..." — a second **is** sneaks in; split it into two sentences.
- "The money will not lost" — the passive form is wrong; the correct version is "the money is never lost".
- Countable nouns losing their article: "it is ledger" → "it is **a** ledger"; "we use queue" → "we use **a** queue".
- Mixing up statuses and saying "OK, Completed"; natural English is "we reply Accepted, not Completed".

> Senior tip: An answer that contains **an explicit intermediate state** (PENDING, then SUCCESS/FAILED) proves you have run a real system, because newcomers usually assume every API returns the final result immediately. Add a number if you have one: "reconciliation runs at 2 a.m. and typically clears under ten exceptions a day". Pronunciation: **ledger** /ˈledʒə/ stresses the first syllable, **reconciliation** /rɪˌkɒnsɪliˈeɪʃn/ stresses the fourth.`,
    follow: [
      'Why do you return Accepted instead of waiting for the core system callback?',
      'What happens if the callback never arrives at all?',
      'How would your answer change if the destination is another bank?',
    ],
  },
  'english-091': {
    q: 'In that transfer flow, how do you guarantee the same payment is never executed twice, and that money is never lost if a step fails halfway? Explain your reasoning out loud.',
    a: `**Summary:** Answer as **three lines of defence**: duplicate protection at the front door (idempotency key + unique constraint), atomic ledger writes inside the database (a transaction), and safety across the asynchronous boundary (outbox, capped retries, reversal, reconciliation). Say clearly which line catches which failure.

### Sample answer
I think about it as three lines of defence.

The first one stops duplicates at the front door. Every request carries a unique key generated by the client. We store that key in a table with a unique database constraint, together with the result. When a retry arrives, the insert fails on the constraint, we read the stored result, and we return it — so the user pressing Pay twice still moves the money once.

The second line is inside the database. The transfer record and both ledger postings are written in a single ACID transaction. It either commits fully or not at all, so the books can never be half-updated, even if the process crashes mid-request.

The third line covers the gap between our service and the outside world, which is where things actually go wrong. We use a transactional outbox: the message for the core system is inserted in the same transaction as the ledger entries, and a separate publisher ships it afterwards. If the service dies before publishing, the message is still there and gets picked up. Retries use exponential backoff with a ceiling; after the last attempt the order goes to a dead-letter queue and stays pending, it does not disappear. And the net underneath everything is reconciliation: every night we match our ledger against the core statement, so anything still unmatched is found by us, not by a customer complaint.

### Three lines of defence, explained from the ground up
- **unique constraint**: a database rule that says "this value must not repeat" — the cheapest and most trustworthy duplicate blocker, because it still wins against a race between two requests that arrive at the same instant.
- **ACID transaction**: a group of operations that either all commit or all roll back; no half-finished state is ever visible to anybody.
- **transactional outbox**: instead of calling the external system directly (you already sent the message, then the transaction rolled back → an instruction for money that does not exist), you write the pending message into an outbox table **inside the same transaction**, and a background process picks it up and sends it. Crash halfway and the instruction is still there.
- **exponential backoff + ceiling**: retries with widening gaps (1s, 2s, 4s...), capped at a maximum number of attempts so you do not flood a system that is already failing.
- **dead-letter queue (DLQ)**: the box that holds instructions which failed on the last attempt, with an alert so operations can deal with them.
- **reconciliation**: the final net — it assumes every other mechanism can leak, and compares the two sides' figures every day.

### Useful phrases
- **three lines of defence**: three independent layers, each catching what the previous one missed
- **stops duplicates at the front door**: blocks repeated requests before any business logic runs
- **the insert fails on the constraint**: the write is rejected by the database rule
- **it either commits fully or not at all**: there is no half-written result
- **anything still unmatched is found by us**: we discover the discrepancy before the customer does

### Common mistakes Vietnamese speakers make
- "We are ensuring that money is not lost" — the continuous form is unnatural here; use "we ensure / we make sure".
- "the insert will fail" when describing a system you already built: use the past tense for your own experience ("the insert failed") and the present simple for the principle ("the insert fails").
- "money are lost" — **money** is uncountable, it is always "money is".
- Overclaiming: do not say "guarantee one hundred percent exactly-once"; say "at-least-once delivery plus deduplication makes it effectively exactly-once" — that is the mature answer.

> Senior tip: The line that earns you the points is "the order stays pending, it does not disappear" — it shows you design for **the in-between state** (pending), the one textbooks ignore but production is full of. If you have been on-call, add a real number: "we typically see two to three outbox replays a week after core maintenance windows". Pronunciation: **idempotency** /aɪˌdɛmpəˈtɛnsi/ stresses the fourth syllable, **transactional** /trænˈzæktʃənəl/ stresses the second.`,
    follow: [
      'What is the difference between at-least-once and exactly-once delivery, and which do you rely on?',
      'What do you do with an item that has been in the dead-letter queue for two days?',
      'Tell me about a real mismatch your reconciliation job found.',
    ],
  },
  'english-092': {
    q: 'Tell me about a time you joined a project with a large legacy codebase, for example core banking software with little documentation. How did you get productive?',
    a: `**Summary:** This is a question about **how you teach yourself inside a complex environment**, not about code. Structure: a step-by-step approach (logs, DB, the flow before reading code) → create a small win to earn trust → turn what you learned into documentation for the people who come after you.

### Sample answer
When I joined the payments team, the service had roughly three hundred thousand lines of Java, a lot of it written over eight years, and the wiki was badly out of date. I gave myself a rule: understand one complete flow before I touch anything.

Week one, I did not read code line by line. I created a test customer, ran one real transfer through the staging environment, and followed it through the logs and the database tables. That gave me the shape of the system — which service calls which, and where the ledger is written. Then, and only then, I read the classes behind that path.

Week two and three, I picked small, low-risk tasks: adding logging where a step was silent, renaming misleading variables, and fixing two bugs one level deep. Each task forced me into a new corner of the codebase, and because the changes were small, the blast radius was small too.

I also asked questions in a targeted way. Instead of saying "how does this work?", which is too big, I said "I traced the transfer up to the ledger posting — is the reversal handled here or by the batch job?" People answer specific questions happily, and I earned trust quickly.

I documented as I learned: I drew the transfer sequence diagram and wrote a one-page onboarding note. When the next junior joined, she was productive in three days instead of three weeks, and I think that was the most useful thing I did in that period.

### Why this sample works
- **understand one complete flow before touching anything**: the golden rule with legacy code — follow one real path (test data + logs + DB) instead of reading random classes.
- **blast radius**: how much damage a broken change can cause; using this term shows production thinking.
- A specific question beats a broad one: it proves you already traced the code yourself ("I traced X up to Y"), and only someone experienced asks like that.
- Close with **a legacy for the people after you** (the onboarding note) — that is exactly the senior bar: making the system easier for the team.

### Useful phrases
- **a lot of it had accumulated over eight years**: most of the code was layered on bit by bit across eight years
- **the wiki was badly out of date**: the documentation no longer described the running system
- **I gave myself a rule**: I set a personal constraint before starting
- **that gave me the shape of the system**: from that I could see the overall structure
- **one level deep**: a shallow bug, close to the surface

### Common mistakes Vietnamese speakers make
- "I will create a test account and follow the log" — a past story needs "I created... followed..."; wrong tense is the single most common error in STAR answers.
- "Although the code was old, but I still learned fast" — never use "although" and "but" in the same sentence.
- Badmouthing the old system ("the code was terrible") — stay neutral: "the service had grown over many years and the documentation lagged behind".
- "I studied the whole source code in one week" — nobody believes it; a step-by-step strategy is more convincing than a prodigy story.

> Senior tip: Close with an impact you can measure ("the next junior was productive in three days instead of three weeks") — that is how you turn an apprentice story into evidence of leadership. Legacy code is not a topic for showing how fast you learn, it is a topic for showing your **method**. Pronunciation: **legacy** /ˈlɛɡəsi/ stresses the first syllable; **productive** /prəˈdʌktɪv/ stresses the second.`,
    follow: [
      'What would you do differently if you joined another legacy system tomorrow?',
      'How do you decide which parts of the legacy system are worth rewriting?',
      'How did you earn trust with engineers who had owned that codebase for years?',
    ],
  },
  'english-093': {
    q: 'You found a risk of duplicate payments under heavy load, and fixing it will delay the feature the business asked for. How do you explain this risk to a non-technical product owner in English and get a decision?',
    a: `**Summary:** Translate the technical risk into **business language**: what can break, how much money/customers/reputation it costs, how likely it is — then give **two or three options, each with its price**, plus one recommendation. No scare tactics, no hiding, and never ask "fix or not fix" — ask "which way of fixing".

### Sample answer
I would ask for ten minutes and keep it in business language.

I would open with the problem, not the technology: "Under heavy load, the same payment could be processed twice. The customer would see money leave their account twice, and we would have to refund and apologise. For a bank, that is not just a bug, it is a trust event."

Then the numbers, honestly labelled as estimates: "Based on our peak traffic, I would put the likelihood at maybe one or two cases per thousand transfers on a peak day. The fix itself is about a week of work."

Then the options, because a product owner decides between options, not between yes and no. "Option one: we delay the feature by a week and close the risk now. Option two: we ship on time with a safety net — a nightly reconciliation job that catches double payments automatically and refunds them within a day, while we build the real fix next sprint. Option three: we do nothing, and I do not recommend that, because our peak season starts in six weeks and the volume doubles."

My recommendation is option two: the business gets the date, and the customer gets a net. I would also say clearly: "If we ship without either the fix or the net, I want that decision written down, with the reasoning." That sentence is not politics — it protects the product owner too, because a written decision forces everyone to think seriously.

And I would close by asking, "Which option feels right for you?" to keep it a conversation.

### Answer framework (works for any technical risk)
1. **Consequences in plain words, not jargon**: describe the customer experience ("money leaves the account twice") instead of "missing idempotency key".
2. **Honest quantification**: probability × impact, and say out loud that it is an estimate. If you have no real number, give a range ("one to two in a thousand"); never invent a figure that sounds exact.
3. **Options, not an ultimatum**: every option carries a price (time, residual risk). A PO is trained to choose between options.
4. **A clear recommendation**: a senior does not only list — you pick one and you explain why.
5. **Put the decision in writing**: said lightly but firmly — "written down, with the reasoning".

### Useful phrases
- **it is not just a bug, it is a trust event**: not a defect alone, an incident that damages customer trust
- **honestly labelled as estimates**: clearly stated as an estimate, not a measured fact
- **the cost of doing nothing is...**: naming the price of the "take no action" option
- **a safety net that catches double payments**: a mechanism that detects and repairs duplicates even if the bug ships
- **I want that decision written down**: I ask for the decision to be recorded in text
- **which option feels right for you**: handing the choice back to the business

### Common mistakes Vietnamese speakers make
- "I think this system have a risk" — subject-verb agreement is wrong: "this system **has** a risk"; better: "there is a risk of...".
- Using jargon with a PO: "the endpoint is not idempotent under concurrency" — replace it with the real consequence.
- "If we don't fix, will appear incident" — the subject and the object are missing; correct: "if we do not fix it, we will have an incident".
- A blaming or threatening tone ("this is because the team rushed") — stay neutral and oriented toward the decision.

> Senior tip: The strongest line in the sample is "that decision is written down, with the reasoning" — it is both a governance discipline (especially in a bank, where auditors read everything) and protection for you; but say it in a collaborative tone, never like an ultimatum. Pronunciation: **risk** /rɪsk/ (one syllable, not "ris-ker"); **recommend** /ˌrɛkəˈmɛnd/ stresses the third syllable.`,
    follow: [
      'What if the product owner still chooses to ship without the fix or the net?',
      'How do you keep technical debt from piling up again after this decision?',
      'How would you present the same risk to your engineering manager instead?',
    ],
  },
});
