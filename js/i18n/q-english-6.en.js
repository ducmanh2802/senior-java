/*
 * English translation of js/data/q-english.js — task T406. Format: js/core/i18n.js (content overlay).
 * ids: english-001 english-002 english-003 english-004 english-005 english-006 english-007 english-008 english-009 english-010 english-011 english-012 english-013 english-014
 */
App.i18n.content({
  'english-001': {
    q: 'Tell me about yourself. Give the short version you would use at the start of a Senior Java backend interview.',
    a: `**Summary:** The interviewer does not need your full life story; they want to know who you are, where your strengths lie, and why you are here. Use this 60–90 second structure: **present (role + domain + scale) → past (1–2 quantified achievements) → why you applied**. Do not start with your university graduation.

### Sample answer
Thanks for having me. I am a backend engineer with seven years of experience, and for the last three years I have been working on a payments platform at a fintech company here in Vietnam. The platform handles about two million transactions a day across roughly twenty Spring Boot services, and I own the payment orchestration and reconciliation services end to end, from design and code review to running them on Kubernetes.

Before that I was a Java developer on a logistics product, where I led the migration of a legacy monolith from Java 8 and Spring 3 to Java 17 and Spring Boot 3. That project removed about forty percent of our old XML configuration and cut deployment time from forty minutes to eight.

What I enjoy most is the part where correctness and performance meet: idempotency, retries, reconciliation. That is exactly why I am interested in this role. Your team is moving into multi-region payments, and that is the problem I want to spend the next few years on. I am also comfortable working in English, since my current team has engineers in Singapore and India, and all our design reviews are in English.

### Useful phrases
- **I specialize in**: I focus on a particular area
- **end-to-end ownership**: responsibility for everything from design through operations
- **I led the migration of**: I was in charge of moving
- **which brings me to why I am here**: and that explains why I applied
- **hands-on**: directly doing the work, not just managing
- **I own the service end to end**: I am responsible for the entire service

> Tip: Vietnamese speakers often write "I have 7 years experiences" — this is incorrect because **experience** is uncountable when referring to professional experience: use "seven years of experience". Also, do not literally translate "I am very happy to be interviewed"; it sounds stiff. Use "Thanks for having me" instead. Practise speaking it aloud and time yourself: anything over two minutes costs you points.`,
    follow: [
      'Which part of that payments platform did you personally design, and which part did you inherit?',
      'You mentioned the migration to Java 17 — what was the hardest technical risk there?',
      'Why did you choose the payments domain in the first place?',
    ],
  },
  'english-002': {
    q: 'Walk me through your current project and its architecture. How would you explain it to another backend engineer?',
    a: `**Summary:** Answer in layers rather than listing technologies: **business problem → main components + request flow → data/infrastructure → scale + pain points**. Include 2–3 figures (QPS, data size, p99) and one architectural decision for which you were personally responsible.

### Sample answer
Sure. The product is a B2B payment gateway. A merchant calls our API to charge a customer, and we route that charge to one of several acquirers depending on card network, currency and success-rate history.

Architecturally we have three layers. The edge is an API gateway that terminates TLS, applies rate limits per merchant and forwards to our payment API. The payment API is a Spring Boot 3 service that validates the request, writes a payment record with status PENDING, and publishes an event to Kafka. Downstream, orchestration workers consume that event and call the acquirer adapter; each adapter is a thin module with its own retry and circuit-breaker policy via Resilience4j. The result is written back and a second event drives webhooks and reconciliation.

Data-wise, PostgreSQL is the source of truth for payment state, Redis holds idempotency keys for twenty-four hours, and we keep an immutable audit trail in S3 through a Debezium change-data-capture pipeline. We run about 400 requests per second at peak, p99 of the synchronous path is around 180 milliseconds, and the whole system is on EKS across two availability zones.

The part I own is the orchestration layer. The key design decision was to make every state transition idempotent and append-only, because with money you cannot rely on exactly-once delivery. The main pain point today is that webhook retries can storm a small merchant after an outage, which we are fixing with per-merchant backpressure.

### Useful phrases
- **at a high level**: from an overall perspective
- **the source of truth is**: the authoritative data source is
- **the synchronous path**: the synchronous processing flow
- **the main pain point**: the primary problem
- **we are fixing that with**: we are addressing that by using
- **per-merchant rate limiting**: limiting request rates separately for each merchant

> Tip: Do not recite technology names like a CV ("we use Kafka, Redis, Postgres, Kubernetes, Grafana..."). The interviewer will immediately ask "why". Every technology you mention should come with a **reason** and a **trade-off**. Be careful with tenses: use the present for a current project ("we run", "we have") and the past for an old project ("we ran", "we had"); do not mix the two when discussing the same system.`,
    follow: [
      'Why did you use Kafka between the API and the orchestration workers instead of a synchronous call?',
      'How do you keep the database and the event stream consistent if the broker is briefly unavailable?',
      'If traffic grew ten times, which component would break first?',
    ],
  },
  'english-003': {
    q: 'Why are you leaving your current job, and why do you want to join us?',
    a: `**Summary:** This question tests your **attitude**, not your reason. Use this structure: a neutral, future-focused reason (**wanting to learn or take on more responsibility**), then connect it to something specific at the new company. Never speak badly about your manager, colleagues, or previous product.

### Sample answer
I am not leaving because of a problem with my team. I have learned a lot there, and I am genuinely grateful for the trust they gave me. But the platform has reached a stable phase. Most of my work now is maintenance and small improvements, and the architecture is unlikely to change in the next two years.

I want to be in the room when the hard decisions are made again: choosing a consistency model, designing for multi-region, owning a service that is still growing. That is the kind of work I do best, and I miss it.

I am also specifically interested in your company because of the way you handle payment reliability. I read your engineering blog post about idempotency keys and webhook delivery, and the approach is very close to what I built, but at a much larger scale. I think I can contribute quickly on the orchestration side, and I would learn a lot from the multi-region work you are starting. So it is a good match in both directions: you get someone who has already made these mistakes, and I get to work on problems I have not solved yet.

### Useful phrases
- **I am not leaving because of a problem with**: my departure is not caused by an issue with
- **the platform has reached a stable phase**: the platform has entered a period of stability
- **I want to be in the room when**: I want to be present and involved when
- **that is the kind of work I do best**: that is the type of work at which I perform best
- **a good match in both directions**: a good fit for both sides
- **I would learn a lot from**: I would gain a great deal of knowledge from

> Tip: Saying "I want to leave because my manager is toxic" is interview suicide, even if it is true. Vietnamese candidates also often use "I want to find a new challenge", which is too generic — replace it with **a specific type of work** (multi-region, platform scale, leading a team). Watch your prepositions: "interested **in**" and "grateful **for**", not "interested on".`,
    follow: [
      'What would make you stay if your current company offered you a counter-offer?',
      'What do you know about our engineering culture?',
      'What kind of work do you explicitly not want to do?',
    ],
  },
  'english-004': {
    q: 'What are your strengths and weaknesses? Please give a concrete example for each.',
    a: `**Summary:** Choose **one strength relevant to the role** (supported by quantified evidence) and **one genuine weakness that does not undermine the role**, together with the action you are taking to improve it. Do not use a fake weakness such as "I work too hard" — interviewers hear that every week.

### Sample answer
My main strength is turning a vague reliability problem into something measurable. For example, our payment callback had a one percent failure rate that nobody could explain. I added structured logging with a correlation ID across three services, built a dashboard, and within two weeks we found that a specific acquirer was timing out at exactly five seconds because of a client-side default. We changed the timeout and the failure rate dropped to under 0.1 percent. I like that kind of work: instrument first, then guess.

My weakness is that I used to take too much on myself. In my previous team I would rather fix a flaky test at midnight than ask for help, because I thought asking would slow the team down. It did the opposite: I became a bottleneck, and one release slipped by a week because only I understood the reconciliation job. Since then I have deliberately paired with juniors on that area, written runbooks, and now I ask for help earlier. I still catch myself doing it, but I have a rule: if a task blocks someone else for more than half a day, I ask.

### Useful phrases
- **my main strength is**: the area in which I am strongest is
- **turning a vague problem into something measurable**: making an unclear problem quantifiable
- **instrument first, then guess**: gather measurements before forming hypotheses
- **I became a bottleneck**: I became the constraint slowing everyone else down
- **I have deliberately paired with**: I have intentionally worked together with
- **I catch myself doing it**: I notice myself falling into that habit

> Tip: Do not mention a weakness without both a **corrective action** and a **result**. Also avoid a weakness that is fatal for the position ("I am bad at debugging", "I don't like code review"). For pronunciation, **strength** combines /str/ + /ŋθ/ and is very difficult; Vietnamese speakers often say "s-tren". Practise each sound slowly, or use "what I do well" if you are worried about stumbling.`,
    follow: [
      'Can you give me an example where that weakness actually caused a problem?',
      'What feedback did you receive in your last performance review?',
      'Which strength would your teammates mention first?',
    ],
  },
  'english-005': {
    q: 'Where do you see yourself in five years?',
    a: `**Summary:** The interviewer wants to know whether you are **likely to stay** and whether your development goals fit the company's career path. Answer in terms of the **capabilities you want to build** (technical leadership, depth) rather than a specific job title, and show that you want to invest in the company where you are interviewing.

### Sample answer
In five years I would like to be the person other engineers come to for the hardest reliability problems in this domain. Technically, that means going deeper than I am now: I want to understand distributed transactions and consensus well enough to make trade-offs without guessing, and I want to have designed at least one system that runs across regions.

In terms of role, I expect to be leading a small team or to be the tech lead of one service area, but I want to keep writing code. I have seen tech leads who stop coding and slowly lose credibility in design reviews, and I do not want that. I would rather lead by being the most useful engineer in the room.

I am also realistic: five years is long, and plans change. What I can promise is that I will keep going deeper in backend and distributed systems rather than jumping between stacks. This company is a good place for that because the problems here are real: money, latency, correctness. So the short answer is: more depth, some leadership, and still hands-on.

### Useful phrases
- **the person other engineers come to for**: the person colleagues seek out for
- **going deeper than I am now**: developing more expertise than I currently have
- **make trade-offs without guessing**: evaluate trade-offs on an informed basis
- **tech lead of one service area**: technical leader for a particular group of services
- **lead by being the most useful engineer**: lead through practical contribution
- **I am realistic: plans change**: I recognise that circumstances and plans evolve

> Tip: Avoid "I want to be a manager in two years" if the JD is for an IC role, and avoid "I want your job" — it sounds tactless. Vietnamese speakers often say "in 5 years I will be manager" (missing **a**); use "a manager" when referring to one role. Also note that **five years** is pronounced /faɪv jɪərz/, with linking that sounds like "faiv-iearz".`,
    follow: [
      'Would you rather grow as an individual contributor or as a manager?',
      'What skill are you actively working on right now?',
      'What would make you consider leaving this company in the future?',
    ],
  },
  'english-006': {
    q: 'Tell me about a time you handled a production incident. What happened, what did you do, and what did you change afterwards?',
    a: `**Summary:** Use **STAR**, but focus on **A (action) and R (result + follow-up)**. Quantify the impact, state your specific role (do not say "we" throughout), describe one difficult decision during the incident, and explain the **preventive action taken afterwards**.

### Sample answer
**Situation:** On a Friday evening our payment API started returning 500s for about thirty percent of card payments. Roughly twelve thousand transactions failed in twenty minutes, and the on-call engineer was a junior who had joined three months earlier.

**Task:** I was the senior on call for the week. My job was to stop the bleeding first, then find the cause.

**Action:** I joined the incident bridge, took the communication role so the junior could focus on debugging, and posted updates every five minutes in the incident channel. We saw that errors started right after a config rollout, so I made the call to roll back the config rather than debug forward. That was a judgement call: rollback meant losing the new routing rule for a few hours, but it was clearly safer than continuing to fail payments. Rollback took four minutes and the error rate went back to normal.

**Result:** We lost about twelve thousand transactions, but we replayed them from Kafka the next morning, so no merchant actually lost money. In the postmortem I found the root cause: a new routing rule matched an empty currency field. I added a validation test for every rule and a canary step that sends one percent of traffic for ten minutes before full rollout. We have not had a config-related incident since.

### Useful phrases
- **stop the bleeding first**: contain the immediate damage before anything else
- **I took the communication role**: I assumed responsibility for incident communications
- **I made the call to roll back**: I decided to perform a rollback
- **we replayed them from Kafka**: we reprocessed them using the Kafka events
- **no merchant actually lost money**: the failures caused no actual financial loss to merchants
- **we have not had an incident since**: no further incident has occurred since then

> Tip: Do not describe an incident in which **you were merely an observer**; the interviewer will immediately probe "what did **you** do?". Do not hide the damage either — give the real figures, then show that you brought the situation under control. The past tense is essential: "we **saw**" and "I **made** the call", not the present tense. Practise saying "twelve thousand" fluently instead of reading out each digit.`,
    follow: [
      'What would you have done differently if the rollback had not worked?',
      'Who else was involved, and how did you divide the work?',
      'How do you decide when to roll back versus debug forward?',
    ],
  },
  'english-007': {
    q: 'Tell me about a disagreement with a teammate or a manager. How did you handle it?',
    a: `**Summary:** Choose a disagreement about **technology or priorities**, not a personal conflict. Structure your answer as context → the two viewpoints → **how you gathered data to resolve it** → the outcome → what you learned. Bonus points come from preserving the relationship while still upholding technical standards.

### Sample answer
We had a disagreement about whether to introduce a shared library for our service-to-service authentication. My tech lead wanted every team to copy a small filter class into each service; I wanted a versioned shared library. His argument was speed and autonomy: teams would not be blocked by library releases. Mine was consistency and security: a copied filter means a security patch has to be applied in nine places.

It got a bit tense in the design review, and I could feel myself pushing too hard. So I stopped arguing in the meeting and asked for one week to collect data. I checked our git history and found that the copied filter already existed in nine services with four slightly different implementations, and one of them had a bug that skipped token expiry. That was the evidence I needed.

I wrote a short document with three options, the cost of each, and a recommendation: a shared library with a documented upgrade path, plus an automated check that fails the build if a service uses a copied filter. My lead agreed, mainly because the bug made the risk concrete. The library shipped two weeks later.

What I took from it is that arguing about principles rarely works; arguing about evidence usually does. And I should have brought data to the first meeting instead of debating.

### Useful phrases
- **we had a disagreement about**: we held different views on
- **his argument was**: the reasoning he gave was
- **it got a bit tense**: the discussion became somewhat strained
- **I stopped arguing and asked for time to collect data**: I paused the debate so I could gather evidence
- **the bug made the risk concrete**: the bug turned an abstract risk into a demonstrable problem
- **what I took from it is**: the lesson I learned was

> Tip: Do not take the stance "I was right and my boss was wrong" — the interviewer will suspect that you are difficult to work with. Also, do not say "I disagreed with my manager" without explaining **how you spoke to them privately first**. A common grammar mistake is "discuss about"; the correct form is "discuss" + a direct object. Use "disagree with someone **about/on** something".`,
    follow: [
      'What would you have done if your lead had still said no?',
      'How do you disagree with someone more senior than you without damaging the relationship?',
      'Have you ever changed your mind after a disagreement?',
    ],
  },
  'english-008': {
    q: 'Describe a time you mentored someone. How did you structure it, and what was the outcome?',
    a: `**Summary:** Mentoring is not simply "teaching knowledge"; it means **designing a learning experience + transferring ownership in a controlled way**. Tell the story in this order: where the mentee started → what gap you diagnosed → the specific plan → the quantified outcome → what you learned about leadership.

### Sample answer
I mentored a mid-level engineer, Linh, who joined my team with strong Java but almost no production experience. She was smart and fast, but her first on-call week went badly: she escalated everything and apologised for it. The problem was not knowledge, it was confidence and a mental model of the system.

We agreed on a twelve-week plan. First, I had her draw the service topology from memory every week; the gaps in her drawing told us exactly what to explain. Second, I paired with her on two incidents, but with reversed roles: she led, I only asked questions and never touched the keyboard. Third, I gave her a small but real ownership area, the reconciliation report, including talking to the finance team directly.

The turning point was week six, when she found a bug in the retry logic that I had missed in review. That did more for her confidence than any feedback I gave.

By the end of the quarter she was handling on-call alone, and her escalation rate dropped from roughly eight per week to two. She is now the person who onboards new joiners on that service. For me the lesson was that mentoring is mostly about removing yourself at the right pace, not about explaining more.

### Useful phrases
- **I mentored someone**: I provided ongoing guidance to someone
- **a mental model of the system**: an internal understanding of how the system fits together
- **we agreed on a twelve-week plan**: we settled on a plan lasting twelve weeks
- **with reversed roles**: with each person taking the other's usual role
- **the turning point was**: the moment when things began to change was
- **removing yourself at the right pace**: gradually stepping back at an appropriate rate

> Tip: Do not describe mentoring as "I just told them to read the documentation". You need a **plan**, a **way to measure progress**, and an **outcome**. When **mentor** is a verb, it takes a direct object: "I mentored her", not "I mentored for her" or "mentored to her" (only the noun form uses "a mentor to someone"). Also, do not use "teach" for the entire process — teaching develops a specific skill, while mentoring is broader.`,
    follow: [
      'How did you measure whether the mentoring was working?',
      'What would you do differently with a mentee who was not improving?',
      'How do you balance mentoring with your own delivery work?',
    ],
  },
  'english-009': {
    q: 'Tell me about a technical decision you regret. What did you learn from it?',
    a: `**Summary:** Choose a **real decision with measurable consequences**, but not a catastrophe. Structure your answer as context + decision → the incorrect assumption → the consequences → how you fixed it → **the principle you have applied since**. The interviewer is assessing your capacity for self-reflection, not the fact that you once made a mistake.

### Sample answer
About three years ago we had to add full-text search to an internal order tool. The obvious choice was Elasticsearch, but I argued for Postgres full-text search because we already ran Postgres and I did not want another stateful system to operate. On paper that was a reasonable trade-off: fewer moving parts, no sync pipeline, one source of truth.

The mistake was that I made the decision based on our current volume, about two hundred thousand orders, and did not model growth. Within a year we were at four million orders, and the queries started taking two to three seconds because our GIN index no longer fit comfortably in memory. Worse, the ranking quality was poor for Vietnamese text, and fixing it meant custom dictionaries and a lot of tuning.

We eventually moved to Elasticsearch anyway, which meant we paid both the migration cost and the operational cost I had tried to avoid. The migration took six weeks.

What I learned is to write down the assumption behind a decision and the number at which it breaks. Now, in design docs, I always add a section called "when this stops working", with concrete thresholds. It is a small habit, but it has caught two bad decisions since then.

### Useful phrases
- **the obvious choice was**: the most apparent option was
- **on paper that was a reasonable trade-off**: theoretically, that was a sensible compromise
- **I made the decision based on our current volume**: I based the decision on the amount of data we had at the time
- **which meant we paid both costs**: as a result, we incurred both types of cost
- **the assumption behind a decision**: the premise on which a decision rests
- **when this stops working**: the point at which this approach is no longer effective

> Tip: Do not choose a "regret" caused by someone else's mistake, and do not choose something too trivial ("I used the wrong variable name"). Also, do not say "I regret **to** choose" — use a gerund after regret when talking about something you did: "I regret choosing Postgres full-text search", or simply "I regret that decision". Stress the second syllable of **regret**.`,
    follow: [
      'At what point did you realise the decision was wrong?',
      'How did you convince the team to migrate after arguing against Elasticsearch?',
      'How do you make decisions when you cannot predict growth?',
    ],
  },
  'english-010': {
    q: 'How do you handle tight deadlines and changing requirements?',
    a: `**Summary:** Do not answer "I work overtime". The interviewer wants to see a **process**: clarify scope, break work down, communicate risks early, and negotiate trade-offs. Give an example with a **priority table** or **figures** to demonstrate that you manage the situation rather than merely enduring it.

### Sample answer
My first move is always to separate the deadline from the scope, because usually only one of them is truly fixed. If the deadline is a regulatory date, it is fixed and scope has to move. If it is a demo date, maybe we can ship a narrower slice.

On my last project we had six weeks to deliver a merchant onboarding flow before a partner launch. Two weeks in, the partner added a requirement: support for three document types instead of one. My instinct was to say yes and work harder, but instead I did a quick impact estimate: the extra types added about nine days, which we did not have.

So I went to the product owner with three options: drop the reporting dashboard from the release, delay the launch by two weeks, or support one extra document type now and the others three weeks later. I also showed which option carried the most risk for the partner. We chose the third one, and I wrote it down in the release notes so nobody was surprised.

We shipped on time. The part I am proudest of is not the delivery, it is that nobody worked a weekend. The way I see it, a deadline is a constraint to design around, not a reason to skip the conversation.

### Useful phrases
- **my first move is to**: the first thing I do is
- **separate the deadline from the scope**: consider the deadline and scope as independent variables
- **added about nine days**: required approximately nine additional working days
- **I went to the product owner with three options**: I presented the product owner with three alternatives
- **nobody was surprised**: everyone knew what to expect
- **a constraint to design around**: a limitation that the solution must accommodate

> Tip: Avoid saying "I work well under pressure" without an example — it is an empty cliché. Vietnamese speakers often translate "run deadline" literally, which is incorrect; use "meet a deadline" or "work to a tight deadline". Also, pronounce **deadline** /ˈdedlaɪn/, not "det-lai".`,
    follow: [
      'What do you do when the product owner refuses to cut scope?',
      'How do you communicate a slipping deadline without losing trust?',
      'Have you ever said no to a deadline? What happened?',
    ],
  },
  'english-011': {
    q: 'Explain how HashMap works internally in Java. Why is the average lookup O(1), and what happens when two keys collide?',
    a: `**Summary:** Follow this sequence: **hash → spread → index → bucket → collision → treeify → resize**. Include the key figures (load factor 0.75, treeify 8, untreeify 6, minimum capacity 64) and explain **why** each mechanism exists. Finish with the worst case and its implications for choosing the initial capacity.

### Sample answer
A HashMap is an array of buckets. When you call put, Java takes the key hash, applies a spread function that XORs the high bits into the low bits, and computes the index as the hash AND the array length minus one. That AND works because capacity is always a power of two, making it a cheaper modulo. That is the O(1) path: compute an index and look in one bucket.

Collisions happen when two different keys land in the same bucket. Java 8 and later store them first in a linked list. When a bucket reaches eight entries **and** the table has at least sixty-four buckets, it converts that bucket into a red-black tree, so lookup degrades to O(log n) instead of O(n). If the table is smaller than sixty-four, it resizes instead of treeifying, because resizing is the cheaper fix at that size.

The other important mechanism is resizing. The default load factor is 0.75, so when the map is 75 percent full, capacity doubles and every entry is redistributed. In Java 8 that redistribution is clever: each entry either stays at the same index or moves to index plus the old capacity, so you do not need to recompute hashes.

The worst case is still O(n) if all keys have the same hash and do not implement Comparable, because the tree cannot order them and a lookup may have to search both subtrees. So if you know the size, create the map with the right initial capacity to avoid repeated resizing.

### Useful phrases
- **an array of buckets**: an array in which each slot holds a group of entries
- **the spread function**: the function that mixes hash bits to improve distribution
- **equivalent to a modulo but cheaper**: produces the same kind of index calculation at lower cost
- **collisions happen when**: different keys map to the same location when
- **degrades to O(log n)**: its performance falls from constant time to O(log n)
- **redistributed**: assigned to locations again

> Tip: Do not say "HashMap uses hashCode to find the index" and stop there — omitting the spread function and power-of-two capacity costs you points. Also, do not confuse **load factor** with **capacity**. In English, "hash" is pronounced /hæʃ/, and **collision** is stressed on the second syllable /kəˈlɪʒn/; many candidates say "co-li-sion", which sounds very unnatural.`,
    follow: [
      'What happens if two keys have the same hashCode but are not equal?',
      'Why is the initial capacity of a HashMap not just set to the expected size?',
      'How does ConcurrentHashMap differ internally from HashMap?',
    ],
  },
  'english-012': {
    q: 'Explain the difference between optimistic and pessimistic locking. When would you choose one over the other?',
    a: `**Summary:** Explain the **mechanism** (version check vs holding a database lock), the **cost** (retry vs waiting/blocking), **when to use each** (low vs high contention, whether the business operation can be retried), and the **pitfalls** (lost update, deadlock, lock escalation). Use a JPA/Hibernate example because that is a real-world setting.

### Sample answer
Pessimistic locking means you take a lock in the database before you read the row, for example with SELECT FOR UPDATE. In JPA you use LockModeType.PESSIMISTIC_WRITE. Other transactions that try to update the same row block until you commit, so you are guaranteed that nobody changes the data under you. The cost is waiting, and under high contention you get long queues and sometimes deadlocks.

Optimistic locking does not lock anything. You read the row with a version column, and when you update, you include the version in the WHERE clause. If someone else updated the row in between, zero rows are affected and Hibernate throws an OptimisticLockException; your application retries or asks the user to reload. With JPA you just annotate a field with @Version. The cost is that you must handle retries, and retries can be expensive if they hit external systems.

My rule of thumb: optimistic by default, because most rows are not contended and locks are a scalability tax. I switch to pessimistic when the operation cannot be retried safely or when contention is genuinely high, for example decrementing a limited inventory counter or generating a sequential number. I also keep transactions short, because a pessimistic lock is only as short as the transaction holding it.

One pitfall: optimistic locking does not protect you across multiple rows unless you design it that way, and a retry that replays a payment can double-charge unless the operation is idempotent.

### Useful phrases
- **take a lock in the database**: acquire a database lock
- **other transactions block until you commit**: other transactions wait until your transaction commits
- **under high contention**: when many transactions compete for the same data
- **zero rows are affected**: the update matches and changes no rows
- **my rule of thumb**: my general practical guideline
- **a lock is only as short as the transaction**: the lock lasts as long as its holding transaction

> Tip: Do not claim that optimistic locking is unconditionally "faster" — it is fast under low contention, but a retry storm can be worse. Also, do not confuse **optimistic** (expecting a favourable outcome) with **optimal** (best possible); they differ in both meaning and pronunciation. Use the correct prepositions: "lock **on** a row" and "contend **for** a row".`,
    follow: [
      'How do you implement retry with optimistic locking in Spring without duplicating side effects?',
      'What causes a deadlock with pessimistic locking, and how do you reduce it?',
      'How would you protect a counter that thousands of requests update per second?',
    ],
  },
  'english-013': {
    q: 'How would you design a scalable REST API? And how do you make a create endpoint idempotent?',
    a: `**Summary:** Answer in two parts. **Design:** stateless, resource-oriented, pagination, versioning, rate limiting, caching, and asynchronous processing for long-running tasks. **Idempotency:** the client sends an Idempotency-Key, and the server stores the key + fingerprint + response in a table with a unique constraint, returning the previous response when the key repeats. Mention both race conditions and TTL.

### Sample answer
I would start with the contract, not the framework. Resources are nouns, verbs come from HTTP methods, and errors are consistent: a problem-details body with a stable error code, so clients do not parse English messages. Every list endpoint needs cursor pagination rather than offset, because offset gets slower and inconsistent as the table grows.

For scalability, the API tier stays stateless so it can scale horizontally. Rate limiting is per client and per endpoint at the gateway. Read-heavy endpoints get caching with clear invalidation, and long-running operations return 202 with a status URL instead of holding the connection. Versioning is in the path for breaking changes only; additive changes do not need it.

For idempotency, the client sends an Idempotency-Key header, usually a UUID. On the first request the server inserts a row with that key, a hash of the request body, and the status IN_PROGRESS, using a unique constraint on the key. If the insert fails because the key exists, we inspect the stored row: a different body hash means 422; a stored response is replayed exactly; in-progress means 409 and the client retries later. When the operation finishes, we store the response body and status, and expire the row after twenty-four hours.

The subtle part is that the insert and the business transaction must not leave a half-written state, so we use the same transaction or a state machine with recovery. The key must also be scoped per client, or one tenant can block another.

### Useful phrases
- **I would start with the contract, not the framework**: I would define the API agreement before choosing implementation tools
- **cursor pagination rather than offset**: paginate from a position marker instead of a row offset
- **the API tier stays stateless**: the API layer retains no client session state
- **additive changes**: backward-compatible additions to the API
- **replay it exactly**: return precisely the same stored response
- **scoped per client**: isolated within each client's namespace

> Tip: Do not mention "idempotent" and explain it only with a PUT example; the interviewer asks about POST because that is the difficult case. Do not overlook the **race condition** either — two requests with the same key arriving simultaneously is almost guaranteed to be the follow-up question. Pronounce **idempotent** /ˌaɪdəmˈpoʊtənt/ (not "i-dem-po-tent") and **pagination** /ˌpædʒɪˈneɪʃn/.`,
    follow: [
      'What happens if the first request with an idempotency key crashes before it stores the result?',
      'How would you handle idempotency across two services in a saga?',
      'Why not just use a database unique constraint on a business key instead?',
    ],
  },
  'english-014': {
    q: 'A non-technical stakeholder asks why we should not split everything into microservices. How would you explain the trade-offs without jargon?',
    a: `**Summary:** This is a test of **communication**, not architecture. Avoid jargon; use **an analogy + costs + conditions**. Explain when a monolith works well and when microservices are worthwhile (multiple teams, different scaling needs, independent deployment), and always frame the answer in terms of **money/time/risk**.

### Sample answer
I would use a building analogy. A monolith is one office with one front door, one security desk and one electricity bill. Everybody works in the same building, so it is cheap to run and easy to change the layout. Microservices are separate buildings, each with its own front door, security desk and utility bill. That is great when you have many teams that need to enter and leave without waiting for each other, but you now pay for every door, every guard and every connection between buildings.

Then I would put numbers on it. Today we have one team of eight engineers and about six deployments a week. Splitting into ten services would give us ten pipelines, ten sets of alerts, ten on-call rotations and a network hop between every step. In my experience that adds roughly twenty to thirty percent operational overhead before we write a single feature, and it makes debugging slower because one request crosses five systems.

I would also be clear about when the split does pay off: when one part needs to scale very differently, when releases block each other every week, or when separate teams keep stepping on each other's code. We are not there yet. So my recommendation is to keep the monolith but enforce clear module boundaries, so that when we do need to split, it is a two-week change rather than a two-year rewrite.

### Useful phrases
- **I would use a building analogy**: I would explain the idea by comparing it with buildings
- **put numbers on it**: quantify the impact with concrete figures
- **operational overhead**: the additional ongoing cost of running the system
- **before we write a single feature**: before delivering any new functionality at all
- **when the split does pay off**: when separating the system produces benefits that justify its costs
- **enforce clear module boundaries**: maintain strict, well-defined separation between modules

> Tip: Vietnamese speakers often treat "microservice" as a singular noun and say "split into microservice" — in English, use "split into microservices" (plural). Avoid saying "it depends" and stopping there; the stakeholder needs **a recommendation**. And do not reteach definitions — they are asking in order to make a decision, not to learn architecture.`,
    follow: [
      'How would you know the moment has come to split the monolith?',
      'What would you say if the stakeholder had already promised microservices to the board?',
      'How do you explain the cost of a network call to someone who only thinks in money?',
    ],
  },
});
