App.i18n.content({
  'english-001': {
    q: 'Tell me about yourself. Give the short version you would use at the start of a Senior Java backend interview.',
    a: `**Summary:** The interviewer does not need a full biography; they want to know who you are, what you are strong at, and why you are here. The 60–90 second formula: **present (role + domain + scale) → past (1–2 numbered achievements) → why you are applying**. Do not start from university.

### Sample answer
Thanks for having me. I am a backend engineer with seven years of experience, and for the last three years I have been working on a payments platform at a fintech company here in Vietnam. The platform handles about two million transactions a day across roughly twenty Spring Boot services, and I own the payment orchestration and reconciliation services end to end, from design and code review to running them on Kubernetes.

Before that I was a Java developer on a logistics product, where I led the migration of a legacy monolith from Java 8 and Spring 3 to Java 17 and Spring Boot 3. That project removed about forty percent of our old XML configuration and cut deployment time from forty minutes to eight.

What I enjoy most is the part where correctness and performance meet: idempotency, retries, reconciliation. That is exactly why I am interested in this role. Your team is moving into multi-region payments, and that is the problem I want to spend the next few years on. I am also comfortable working in English, since my current team has engineers in Singapore and India, and all our design reviews are in English.

### Useful phrases
- **I specialize in**: I focus on this area
- **end-to-end ownership**: owning the full cycle from design to operation
- **I led the migration of**: I spearheaded the transition of
- **which brings me to why I am here**: and that is why I am here
- **hands-on**: directly working on technical tasks, not just managing
- **I own the service end to end**: I am responsible for the entire service lifecycle

> Senior tip: Vietnamese candidates often write "I have 7 years experiences" — this is wrong, because **experience** is uncountable: "seven years of experience". Also, do not translate "I am very happy to be interviewed" literally; it sounds stiff. Use "Thanks for having me" instead. Practice out loud and time yourself: anything over 2 minutes loses points.`,
    follow: [
        'Which part of that payments platform did you personally design, and which part did you inherit?',
        'You mentioned the migration to Java 17 — what was the hardest technical risk there?',
        'Why did you choose the payments domain in the first place?',
    ]
  },
  'english-002': {
    q: 'Walk me through your current project and its architecture. How would you explain it to another backend engineer?',
    a: `**Summary:** Answer in layers, do not list technologies: **business problem → main components + request flow → data/infrastructure → scale + pain points**. Mention 2–3 numbers (QPS, data size, p99) and an architectural decision you were directly responsible for.

### Sample answer
Sure. The product is a B2B payment gateway. A merchant calls our API to charge a customer, and we route that charge to one of several acquirers depending on card network, currency and success-rate history.

Architecturally we have three layers. The edge is an API gateway that terminates TLS, applies rate limits per merchant and forwards to our payment API. The payment API is a Spring Boot 3 service that validates the request, writes a payment record with status PENDING, and publishes an event to Kafka. Downstream, orchestration workers consume that event and call the acquirer adapter; each adapter is a thin module with its own retry and circuit-breaker policy via Resilience4j. The result is written back and a second event drives webhooks and reconciliation.

Data-wise, PostgreSQL is the source of truth for payment state, Redis holds idempotency keys for twenty-four hours, and we keep an immutable audit trail in S3 through a Debezium change-data-capture pipeline. We run about 400 requests per second at peak, p99 of the synchronous path is around 180 milliseconds, and the whole system is on EKS across two availability zones.

The part I own is the orchestration layer. The key design decision was to make every state transition idempotent and append-only, because with money you cannot rely on exactly-once delivery. The main pain point today is that webhook retries can storm a small merchant after an outage, which we are fixing with per-merchant backpressure.

### Useful phrases
- **at a high level**: at a high level
- **the source of truth is**: the source of truth is
- **the synchronous path**: the synchronous path
- **the main pain point**: the main pain point
- **we are fixing that with**: we are fixing that with
- **per-merchant rate limiting**: per-merchant rate limiting

> Senior tip: Do not read technology names like a CV ("we use Kafka, Redis, Postgres, Kubernetes, Grafana..."). The interviewer will ask "why" immediately. Each technology mentioned must include **the reason** and **the trade-offs**. Be careful with tenses: current project uses present tense ("we run", "we have"), old projects use past tense ("we ran", "we had"); do not mix tenses when talking about the same system.`,
    follow: [
        'Why did you use Kafka between the API and the orchestration workers instead of a synchronous call?',
        'How do you keep the database and the event stream consistent if the broker is briefly unavailable?',
        'If traffic grew ten times, which component would break first?',
    ]
  },
  'english-003': {
    q: 'Why are you leaving your current job, and why do you want to join us?',
    a: `**Summary:** This checks **attitude**, not reasons. Formula: neutral reason, future-oriented (**want to learn/take on more**), then connect to something specific at the new company. Do not speak poorly of your old boss, colleagues, or products.

### Sample answer
I am not leaving because of a problem with my team. I have learned a lot there, and I am genuinely grateful for the trust they gave me. But the platform has reached a stable phase. Most of my work now is maintenance and small improvements, and the architecture is unlikely to change in the next two years.

I want to be in the room when the hard decisions are made again: choosing a consistency model, designing for multi-region, owning a service that is still growing. That is the kind of work I do best, and I miss it.

I am also specifically interested in your company because of the way you handle payment reliability. I read your engineering blog post about idempotency keys and webhook delivery, and the approach is very close to what I built, but at a much larger scale. I think I can contribute quickly on the orchestration side, and I would learn a lot from the multi-region work you are starting. So it is a good match in both directions: you get someone who has already made these mistakes, and I get to work on problems I have not solved yet.

### Useful phrases
- **I am not leaving because of a problem with**: I am not leaving because of a problem with
- **the platform has reached a stable phase**: the platform has reached a stable phase
- **I want to be in the room when**: I want to be in the room when
- **that is the kind of work I do best**: that is the kind of work I do best
- **a good match in both directions**: a good match in both directions
- **I would learn a lot from**: I would learn a lot from

> Senior tip: Saying "I want to leave because my manager is toxic" is career suicide in interviews, even if true. Also, avoid generalities like "I want to find a new challenge" — replace it with **a specific type of work** (multi-region, platform scale, leading a team). Note the prepositions: "interested **in**", "grateful **for**", not "interested on".`,
    follow: [
        'What would make you stay if your current company offered you a counter-offer?',
        'What do you know about our engineering culture?',
        'What kind of work do you explicitly not want to do?',
    ]
  },
  'english-004': {
    q: 'What are your strengths and weaknesses? Please give a concrete example for each.',
    a: `**Summary:** Choose **1 strength related to the role** (with proof + numbers) and **1 real but non-fatal weakness**, plus the action you are taking to fix it. Do not use fake weaknesses like "I work too hard" — interviewers hear that every week.

### Sample answer
My main strength is turning a vague reliability problem into something measurable. For example, our payment callback had a one percent failure rate that nobody could explain. I added structured logging with a correlation ID across three services, built a dashboard, and within two weeks we found that a specific acquirer was timing out at exactly five seconds because of a client-side default. We changed the timeout and the failure rate dropped to under 0.1 percent. I like that kind of work: instrument first, then guess.

My weakness is that I used to take too much on myself. In my previous team I would rather fix a flaky test at midnight than ask for help, because I thought asking would slow the team down. It did the opposite: I became a bottleneck, and one release slipped by a week because only I understood the reconciliation job. Since then I have deliberately paired with juniors on that area, written runbooks, and now I ask for help earlier. I still catch myself doing it, but I have a rule: if a task blocks someone else for more than half a day, I ask.

### Useful phrases
- **my main strength is**: my main strength is
- **turning a vague problem into something measurable**: turning a vague problem into something measurable
- **instrument first, then guess**: instrument first, then guess
- **I became a bottleneck**: I became a bottleneck
- **I have deliberately paired with**: I have deliberately paired with
- **I catch myself doing it**: I catch myself doing it

> Senior tip: Do not state a weakness without **an action to fix it** and **a result**. Also, do not choose a weakness that is fatal to the position ("I am bad at debugging", "I don't like code review"). Regarding pronunciation: **strength** has a very difficult /str/ + /ŋθ/ cluster; practice each sound slowly or use "what I do well" if you are afraid of stumbling.`,
    follow: [
        'Can you give me an example where that weakness actually caused a problem?',
        'What feedback did you receive in your last performance review?',
        'Which strength would your teammates mention first?',
    ]
  },
  'english-005': {
    q: 'Where do you see yourself in five years?',
    a: `**Summary:** The interviewer wants to know if you **will stay long-term** and if your development path aligns with the company's. Answer according to **competencies you want to achieve** (technical leadership, depth) instead of a specific job title; show you are invested in the place you are interviewing.

### Sample answer
In five years I would like to be the person other engineers come to for the hardest reliability problems in this domain. Technically, that means going deeper than I am now: I want to understand distributed transactions and consensus well enough to make trade-offs without guessing, and I want to have designed at least one system that runs across regions.

In terms of role, I expect to be leading a small team or to be the tech lead of one service area, but I want to keep writing code. I have seen tech leads who stop coding and slowly lose credibility in design reviews, and I do not want that. I would rather lead by being the most useful engineer in the room.

I am also realistic: five years is long, and plans change. What I can promise is that I will keep going deeper in backend and distributed systems rather than jumping between stacks. This company is a good place for that because the problems here are real: money, latency, correctness. So the short answer is: more depth, some leadership, and still hands-on.

### Useful phrases
- **the person other engineers come to for**: the person other engineers come to for
- **going deeper than I am now**: going deeper than I am now
- **make trade-offs without guessing**: make trade-offs without guessing
- **tech lead of one service area**: tech lead of one service area
- **lead by being the most useful engineer**: lead by being the most useful engineer
- **I am realistic: plans change**: I am realistic: plans change

> Senior tip: Avoid "I want to be a manager in two years" if the JD is for an IC role, and avoid "I want your job" — it sounds unrefined. Also, be careful with plurals: "in five years" is correct. Also pay attention to **five years**, read as /faɪv jɪərz/.`,
    follow: [
        'Would you rather grow as an individual contributor or as a manager?',
        'What skill are you actively working on right now?',
        'What would make you consider leaving this company in the future?',
    ]
  },
  'english-006': {
    q: 'Tell me about a time you handled a production incident. What happened, what did you do, and what did you change afterwards?',
    a: `**Summary:** Use **STAR** but focus on **A (action) and R (result + follow-up)**. State the impact with numbers, your specific role (do not say "we" the whole time), a difficult decision made during the incident, and **preventive action afterward**.

### Sample answer
**Situation:** On a Friday evening our payment API started returning 500s for about thirty percent of card payments. Roughly twelve thousand transactions failed in twenty minutes, and the on-call engineer was a junior who had joined three months earlier.

**Task:** I was the senior on call for the week. My job was to stop the bleeding first, then find the cause.

**Action:** I joined the incident bridge, took the communication role so the junior could focus on debugging, and posted updates every five minutes in the incident channel. We saw that errors started right after a config rollout, so I made the call to roll back the config rather than debug forward. That was a judgement call: rollback meant losing the new routing rule for a few hours, but it was clearly safer than continuing to fail payments. Rollback took four minutes and the error rate went back to normal.

**Result:** We lost about twelve thousand transactions, but we replayed them from Kafka the next morning, so no merchant actually lost money. In the postmortem I found the root cause: a new routing rule matched an empty currency field. I added a validation test for every rule and a canary step that sends one percent of traffic for ten minutes before full rollout. We have not had a config-related incident since.

### Useful phrases
- **stop the bleeding first**: stop the bleeding first
- **I took the communication role**: I took the communication role
- **I made the call to roll back**: I made the call to roll back
- **we replayed them from Kafka**: we replayed them from Kafka
- **no merchant actually lost money**: no merchant actually lost money
- **we have not had an incident since**: we have not had an incident since

> Senior tip: Do not tell an incident story where **you were just an observer**; the interviewer will immediately dig with "what did **you** do?". Do not hide the damage — state the real numbers and then show that you were in control. Past tense is mandatory: "we **saw**", "I **made** the call", do not use present tense. Practice saying "twelve thousand" fluently, do not read each digit.`,
    follow: [
        'What would you have done differently if the rollback had not worked?',
        'Who else was involved, and how did you divide the work?',
        'How do you decide when to roll back versus debug forward?',
    ]
  },
  'english-007': {
    q: 'Tell me about a disagreement with a teammate or a manager. How did you handle it?',
    a: `**Summary:** Choose a **technical/priority conflict**, not a personal one. Structure: context → two viewpoints → **how you found data to resolve it** → result → what you learned. A plus point is keeping the relationship while maintaining technical standards.

### Sample answer
We had a disagreement about whether to introduce a shared library for our service-to-service authentication. My tech lead wanted every team to copy a small filter class into each service; I wanted a versioned shared library. His argument was speed and autonomy: teams would not be blocked by library releases. Mine was consistency and security: a copied filter means a security patch has to be applied in nine places.

It got a bit tense in the design review, and I could feel myself pushing too hard. So I stopped arguing in the meeting and asked for one week to collect data. I checked our git history and found that the copied filter already existed in nine services with four slightly different implementations, and one of them had a bug that skipped token expiry. That was the evidence I needed.

I wrote a short document with three options, the cost of each, and a recommendation: a shared library with a documented upgrade path, plus an automated check that fails the build if a service uses a copied filter. My lead agreed, mainly because the bug made the risk concrete. The library shipped two weeks later.

What I took from it is that arguing about principles rarely works; arguing about evidence usually does. And I should have brought data to the first meeting instead of debating.

### Useful phrases
- **we had a disagreement about**: we had a disagreement about
- **his argument was**: his argument was
- **it got a bit tense**: it got a bit tense
- **I stopped arguing and asked for time to collect data**: I stopped arguing and asked for time to collect data
- **the bug made the risk concrete**: the bug made the risk concrete
- **what I took from it is**: what I took from it is

> Senior tip: Do not choose the "I was right, my boss was wrong" side — the interviewer will suspect you are hard to work with. Do not say "I disagreed with my manager" without mentioning **how you spoke privately** first. Common grammar mistake: "discuss about" is wrong, the correct is "discuss" + direct object; "disagree with someone **about/on** something".`,
    follow: [
        'What would you have done if your lead had still said no?',
        'How do you disagree with someone more senior than you without damaging the relationship?',
        'Have you ever changed your mind after a disagreement?',
    ]
  },
  'english-008': {
    q: 'Describe a time you mentored someone. How did you structure it, and what was the outcome?',
    a: `**Summary:** Mentoring is not "teaching knowledge" but **designing a learning experience + granting controlled ownership**. Tell it as: where the mentee was → what you diagnosed they were missing → specific plan → quantitative results → what you learned about leadership.

### Sample answer
I mentored a mid-level engineer, Linh, who joined my team with strong Java but almost no production experience. She was smart and fast, but her first on-call week went badly: she escalated everything and apologised for it. The problem was not knowledge, it was confidence and a mental model of the system.

We agreed on a twelve-week plan. First, I had her draw the service topology from memory every week; the gaps in her drawing told us exactly what to explain. Second, I paired with her on two incidents, but with reversed roles: she led, I only asked questions and never touched the keyboard. Third, I gave her a small but real ownership area, the reconciliation report, including talking to the finance team directly.

The turning point was week six, when she found a bug in the retry logic that I had missed in review. That did more for her confidence than any feedback I gave.

By the end of the quarter she was handling on-call alone, and her escalation rate dropped from roughly eight per week to two. She is now the person who onboards new joiners on that service. For me the lesson was that mentoring is mostly about removing yourself at the right pace, not about explaining more.

### Useful phrases
- **I mentored someone**: I mentored someone
- **a mental model of the system**: a mental model of the system
- **we agreed on a twelve-week plan**: we agreed on a twelve-week plan
- **with reversed roles**: with reversed roles
- **the turning point was**: the turning point was
- **removing yourself at the right pace**: removing yourself at the right pace

> Senior tip: Do not describe mentoring as "I just told them to read the documentation". You need a **plan**, **way to measure progress**, and **results**. **mentor** as a verb takes a direct object: "I mentored her", do not say "I mentored for her" or "mentored to her" (only use "to" if it is a noun, like "a mentor to someone"); do not use "teach" for the whole process — teach is for specific skills, mentoring is broader.`,
    follow: [
        'How did you measure whether the mentoring was working?',
        'What would you do differently with a mentee who was not improving?',
        'How do you balance mentoring with your own delivery work?',
    ]
  },
  'english-009': {
    q: 'Tell me about a technical decision you regret. What did you learn from it?',
    a: `**Summary:** Choose a **real decision, with measurable consequences**, but not a disaster. Structure: context + decision → wrong assumption → consequences → how you fixed it → **principle you applied afterward**. What the interviewer evaluates is your ability to self-reflect, not the fact that you made a mistake.

### Sample answer
About three years ago we had to add full-text search to an internal order tool. The obvious choice was Elasticsearch, but I argued for Postgres full-text search because we already ran Postgres and I did not want another stateful system to operate. On paper that was a reasonable trade-off: fewer moving parts, no sync pipeline, one source of truth.

The mistake was that I made the decision based on our current volume, about two hundred thousand orders, and did not model growth. Within a year we were at four million orders, and the queries started taking two to three seconds because our GIN index no longer fit comfortably in memory. Worse, the ranking quality was poor for Vietnamese text, and fixing it meant custom dictionaries and a lot of tuning.

We eventually moved to Elasticsearch anyway, which meant we paid both the migration cost and the operational cost I had tried to avoid. The migration took six weeks.

What I learned is to write down the assumption behind a decision and the number at which it breaks. Now, in design docs, I always add a section called "when this stops working", with concrete thresholds. It is a small habit, but it has caught two bad decisions since then.

### Useful phrases
- **the obvious choice was**: the obvious choice was
- **on paper that was a reasonable trade-off**: on paper that was a reasonable trade-off
- **I made the decision based on our current volume**: I made the decision based on our current volume
- **which meant we paid both costs**: which meant we paid both costs
- **the assumption behind a decision**: the assumption behind a decision
- **when this stops working**: when this stops working

> Senior tip: Do not choose a "regret" that was caused by someone else's mistake, and do not choose a mistake that is too small ("I used the wrong variable name"). Do not say "I regret **to** choose" — after regret use V-ing when talking about something you have already done: "I regret choosing Postgres full-text search" or simply "I regret that decision". Pronounce **regret** by stressing the second syllable.`,
    follow: [
        'At what point did you realise the decision was wrong?',
        'How did you convince the team to migrate after arguing against Elasticsearch?',
        'How do you make decisions when you cannot predict growth?',
    ]
  },
  'english-010': {
    q: 'How do you handle tight deadlines and changing requirements?',
    a: `**Summary:** Do not answer "I work overtime". The interviewer wants to see **process**: clarify scope, break it down, voice risks early, negotiate trade-offs. Tell an example with a **priority table** or **numbers** to prove that you do not just endure but control the situation.

### Sample answer
My first move is always to separate the deadline from the scope, because usually only one of them is truly fixed. If the deadline is a regulatory date, it is fixed and scope has to move. If it is a demo date, maybe we can ship a narrower slice.

On my last project we had six weeks to deliver a merchant onboarding flow before a partner launch. Two weeks in, the partner added a requirement: support for three document types instead of one. My instinct was to say yes and work harder, but instead I did a quick impact estimate: the extra types added about nine days, which we did not have.

So I went to the product owner with three options: drop the reporting dashboard from the release, delay the launch by two weeks, or support one extra document type now and the others three weeks later. I also showed which option carried the most risk for the partner. We chose the third one, and I wrote it down in the release notes so nobody was surprised.

We shipped on time. The part I am proudest of is not the delivery, it is that nobody worked a weekend. The way I see it, a deadline is a constraint to design around, not a reason to skip the conversation.

### Useful phrases
- **my first move is to**: my first move is to
- **separate the deadline from the scope**: separate the deadline from the scope
- **added about nine days**: added about nine days
- **I went to the product owner with three options**: I went to the product owner with three options
- **nobody was surprised**: nobody was surprised
- **a constraint to design around**: a constraint to design around

> Senior tip: Avoid "I work well under pressure" without an example — it is cliché. Also, avoid literal translations of idioms; instead of saying "run deadline", use "meet a deadline" or "work to a tight deadline". Also pay attention to pronunciation of **deadline** /ˈdedlaɪn/.`,
    follow: [
        'What do you do when the product owner refuses to cut scope?',
        'How do you communicate a slipping deadline without losing trust?',
        'Have you ever said no to a deadline? What happened?',
    ]
  },
  'english-011': {
    q: 'Explain how HashMap works internally in Java. Why is the average lookup O(1), and what happens when two keys collide?',
    a: `**Summary:** Follow the chain: **hash → spread → index → bucket → collision → treeify → resize**. Mention key figures (load factor 0.75, treeify 8, untreeify 6, min capacity 64) and explain **why** each mechanism exists. End with the worst case and its impact on initial choices.

### Sample answer
A HashMap is an array of buckets. When you call put, Java takes the key hash, applies a spread function that XORs the high bits into the low bits, and computes the index as the hash AND the array length minus one. That AND works because capacity is always a power of two, making it a cheaper modulo. That is the O(1) path: compute an index and look in one bucket.

Collisions happen when two different keys land in the same bucket. Java 8 and later store them first in a linked list. When a bucket reaches eight entries **and** the table has at least sixty-four buckets, it converts that bucket into a red-black tree, so lookup degrades to O(log n) instead of O(n). If the table is smaller than sixty-four, it resizes instead of treeifying, because resizing is the cheaper fix at that size.

The other important mechanism is resizing. The default load factor is 0.75, so when the map is 75 percent full, capacity doubles and every entry is redistributed. In Java 8 that redistribution is clever: each entry either stays at the same index or moves to index plus the old capacity, so you do not need to recompute hashes.

The worst case is still O(n) if all keys have the same hash and do not implement Comparable, because the tree cannot order them and a lookup may have to search both subtrees. So if you know the size, create the map with the right initial capacity to avoid repeated resizing.

### Useful phrases
- **an array of buckets**: an array of buckets
- **the spread function**: the spread function
- **equivalent to a modulo but cheaper**: equivalent to a modulo but cheaper
- **collisions happen when**: collisions happen when
- **degrades to O(log n)**: degrades to O(log n)
- **redistributed**: redistributed

> Senior tip: Do not say "HashMap uses hashCode to find the index" and stop — missing the spread function and power-of-two explanation loses points. Do not confuse **load factor** with **capacity**. English: **hash** is read /hæʃ/, and **collision** stresses the second syllable /kəˈlɪʒn/.`,
    follow: [
        'What happens if two keys have the same hashCode but are not equal?',
        'Why is the initial capacity of a HashMap not just set to the expected size?',
        'How does ConcurrentHashMap differ internally from HashMap?',
    ]
  },
  'english-012': {
    q: 'Explain the difference between optimistic and pessimistic locking. When would you choose one over the other?',
    a: `**Summary:** Clearly state the **mechanism** (version check vs holding DB lock), **cost** (retry vs waiting/blocking), **when to use** (low vs high contention, business can retry vs cannot), and **pitfalls** (lost update, deadlock, lock escalation). Use JPA/Hibernate as the example environment because it is real-world.

### Sample answer
Pessimistic locking means you take a lock in the database before you read the row, for example with SELECT FOR UPDATE. In JPA you use LockModeType.PESSIMISTIC_WRITE. Other transactions that try to update the same row block until you commit, so you are guaranteed that nobody changes the data under you. The cost is waiting, and under high contention you get long queues and sometimes deadlocks.

Optimistic locking does not lock anything. You read the row with a version column, and when you update, you include the version in the WHERE clause. If someone else updated the row in between, zero rows are affected and Hibernate throws an OptimisticLockException; your application retries or asks the user to reload. With JPA you just annotate a field with @Version. The cost is that you must handle retries, and retries can be expensive if they hit external systems.

My rule of thumb: optimistic by default, because most rows are not contended and locks are a scalability tax. I switch to pessimistic when the operation cannot be retried safely or when contention is genuinely high, for example decrementing a limited inventory counter or generating a sequential number. I also keep transactions short, because a pessimistic lock is only as short as the transaction holding it.

One pitfall: optimistic locking does not protect you across multiple rows unless you design it that way, and a retry that replays a payment can double-charge unless the operation is idempotent.

### Useful phrases
- **take a lock in the database**: take a lock in the database
- **other transactions block until you commit**: other transactions block until you commit
- **under high contention**: under high contention
- **zero rows are affected**: zero rows are affected
- **my rule of thumb**: my rule of thumb
- **a lock is only as short as the transaction**: a lock is only as short as the transaction

> Senior tip: Do not say optimistic locking is "faster" in absolute terms — it is faster when contention is low, but retry storms can be worse. Also, note that "optimistic" and "optimal" are different words. Use prepositions correctly: "lock **on** a row", "contend **for** a row".`,
    follow: [
        'How do you implement retry with optimistic locking in Spring without duplicating side effects?',
        'What causes a deadlock with pessimistic locking, and how do you reduce it?',
        'How would you protect a counter that thousands of requests update per second?',
    ]
  },
  'english-013': {
    q: 'How would you design a scalable REST API? And how do you make a create endpoint idempotent?',
    a: `**Summary:** Answer in two parts. **Design:** stateless, resource-oriented, pagination, versioning, rate limit, cache, async for long tasks. **Idempotency:** client sends Idempotency-Key, server stores key + fingerprint + response in a table with unique constraint, returns old response on collision. Mention both race conditions and TTL.

### Sample answer
I would start with the contract, not the framework. Resources are nouns, verbs come from HTTP methods, and errors are consistent: a problem-details body with a stable error code, so clients do not parse English messages. Every list endpoint needs cursor pagination rather than offset, because offset gets slower and inconsistent as the table grows.

For scalability, the API tier stays stateless so it can scale horizontally. Rate limiting is per client and per endpoint at the gateway. Read-heavy endpoints get caching with clear invalidation, and long-running operations return 202 with a status URL instead of holding the connection. Versioning is in the path for breaking changes only; additive changes do not need it.

For idempotency, the client sends an Idempotency-Key header, usually a UUID. On the first request the server inserts a row with that key, a hash of the request body, and the status IN_PROGRESS, using a unique constraint on the key. If the insert fails because the key exists, we inspect the stored row: a different body hash means 422; a stored response is replayed exactly; in-progress means 409 and the client retries later. When the operation finishes, we store the response body and status, and expire the row after twenty-four hours.

The subtle part is that the insert and the business transaction must not leave a half-written state, so we use the same transaction or a state machine with recovery. The key must also be scoped per client, or one tenant can block another.

### Useful phrases
- **I would start with the contract, not the framework**: I would start with the contract, not the framework
- **cursor pagination rather than offset**: cursor pagination rather than offset
- **the API tier stays stateless**: the API tier stays stateless
- **additive changes**: additive changes
- **replay it exactly**: replay it exactly
- **scoped per client**: scoped per client

> Senior tip: Do not say "idempotent" and only explain it with PUT examples — interviewers ask about POST because that is where it is difficult. Do not ignore **race conditions** — two requests with the same key arriving at the same time is almost certainly the next question. Pronounce **idempotent** /ˌaɪdəmˈpoʊtənt/, and **pagination** /ˌpædʒɪˈneɪʃn/.`,
    follow: [
        'What happens if the first request with an idempotency key crashes before it stores the result?',
        'How would you handle idempotency across two services in a saga?',
        'Why not just use a database unique constraint on a business key instead?',
    ]
  },
  'english-014': {
    q: 'A non-technical stakeholder asks why we should not split everything into microservices. How would you explain the trade-offs without jargon?',
    a: `**Summary:** This is a **communication** test, not an architecture one. Avoid jargon; use **analogies + costs + conditions**. State when a monolith is good, when microservices are worth it (many teams, different scaling needs, independent deployment), and always convert it to **money/time/risk**.

### Sample answer
I would use a building analogy. A monolith is one office with one front door, one security desk and one electricity bill. Everybody works in the same building, so it is cheap to run and easy to change the layout. Microservices are separate buildings, each with its own front door, security desk and utility bill. That is great when you have many teams that need to enter and leave without waiting for each other, but you now pay for every door, every guard and every connection between buildings.

Then I would put numbers on it. Today we have one team of eight engineers and about six deployments a week. Splitting into ten services would give us ten pipelines, ten sets of alerts, ten on-call rotations and a network hop between every step. In my experience that adds roughly twenty to thirty percent operational overhead before we write a single feature, and it makes debugging slower because one request crosses five systems.

I would also be clear about when the split does pay off: when one part needs to scale very differently, when releases block each other every week, or when separate teams keep stepping on each other's code. We are not there yet. So my recommendation is to keep the monolith but enforce clear module boundaries, so that when we do need to split, it is a two-week change rather than a two-year rewrite.

### Useful phrases
- **I would use a building analogy**: I would use a building analogy
- **put numbers on it**: put numbers on it
- **operational overhead**: operational overhead
- **before we write a single feature**: before we write a single feature
- **when the split does pay off**: when the split does pay off
- **enforce clear module boundaries**: enforce clear module boundaries

> Senior tip: When speaking English, remember to use the plural form "microservices" (e.g., "split into microservices"). Avoid saying "it depends" and stop; stakeholders need **a recommendation**. Also, do not re-teach the definition — they are asking to make a decision, not to learn architecture.`,
    follow: [
        'How would you know the moment has come to split the monolith?',
        'What would you say if the stakeholder had already promised microservices to the board?',
        'How do you explain the cost of a network call to someone who only thinks in money?',
    ]
  }
});
