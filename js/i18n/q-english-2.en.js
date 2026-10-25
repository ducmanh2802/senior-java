/*
 * English translation of js/data/q-english.js — task T222. Format: js/core/i18n.js (content overlay).
 * ids: english-015 english-016 english-017 english-018 english-019 english-020 english-021 english-022 english-023 english-024 english-025 english-026
 */
App.i18n.content({
  'english-015': {
    q: `An API is slow in production. Walk me through how you would troubleshoot it.`,
    a: `**Summary:** Present in the order **measure → localize → confirm → fix → prevent**. Start with symptoms and numbers (p50/p95/p99, error rate, traffic), then go through layers: gateway, app (GC, thread pool, connection pool), downstream, database. Mention specific tools and a safe rule when operating in production.

### Sample answer
First I would define "slow" with numbers. Is it p99 or the average? Is it every request or one endpoint? Did it start suddenly or drift over weeks? I would pull the dashboard: latency percentiles, error rate, request rate, and the deploy timeline. The deploy timeline alone solves a surprising number of incidents.

Then I would localise the layer. If latency is high but CPU is low, we are waiting on something: a downstream call, a database lock, or a connection pool. If CPU is high, I look at GC logs and thread dumps. A few full thread dumps ten seconds apart tell me whether threads are blocked on a socket, waiting on a lock, or spinning. I use distributed tracing to find which span owns the time; that usually narrows five services down to one in a couple of minutes.

If it is the database, I check the slow query log, the execution plan, and whether the plan changed after a statistics update. I have seen a query go from ten milliseconds to two seconds because an index stopped being used once the data became skewed.

While investigating I keep production safe: read-only commands, no profiling on every node, and if the impact is severe I roll back first and investigate after. After the fix I add an alert on the actual symptom, for example p99 above one second for five minutes, not just on CPU.

### Useful phrases
- **define "slow" with numbers**: define "slow" with numbers
- **the deploy timeline alone solves a surprising number of incidents**: the deploy timeline alone solves a surprising number of incidents
- **we are waiting on something**: we are waiting on something
- **a few full thread dumps**: a few full thread dumps
- **which span owns the time**: which span owns the time
- **roll back first and investigate after**: roll back first and investigate after

> Senior tip: Don't jump straight to "I would add more servers" — that masks the symptom. Also don't say "I would restart the service" without explaining the risk. English: **latency** /ˈleɪtənsi/ not "la-tən-si"; distinguish **p99** "p ninety-nine". Use "slow query log" not "slow query logs" when referring to the tool.`,
    follow: [
      'How do you tell whether the bottleneck is the JVM or the database?',
      'What would you do if the problem only happens under load you cannot reproduce?',
      'Which metrics would you put on the dashboard to catch this earlier next time?',
    ],
  },
  'english-016': {
    q: `How do you use AI tools in your daily development work? What do you trust them with, and what do you not?`,
    a: `**Summary:** Answer with balance: **use it for real, specifically, with verification**. Mention appropriate tasks (writing tests, reading unfamiliar code, syntax conversion, regex suggestions, writing docs), tasks not to delegate (architecture decisions, financial logic, secrets, customer data), and **verification process**. Avoid the attitude "AI replaces developers".

### Sample answer
I use AI tools every day, but as a fast junior assistant, not as an authority. My most common use is tests: I give it a class and ask for edge cases I might have missed, then I rewrite the ones that do not fit. It is very good at generating the boring eighty percent, which frees me for the twenty percent that needs judgement.

I also use it to read unfamiliar code. When I join a new service, I ask it to summarise a package or explain a complex JPQL query, then I verify by reading the actual code. For boilerplate like mapping DTOs or writing a Dockerfile, it saves maybe thirty to forty minutes a day.

What I do not do is paste production data, customer information, credentials or proprietary business logic into a public model, and I do not let it make architectural decisions. It does not know our constraints, our traffic profile or our team. I also never merge generated code without reading every line, because the failure mode is confident, plausible code that passes a quick look and fails at the boundary.

The rule I follow is simple: AI can propose, but I am still the one who signs the commit. If I cannot explain a line to a reviewer, it does not go in.

### Useful phrases
- **as a fast junior assistant, not as an authority**: as a fast assistant, not an authoritative expert
- **edge cases I might have missed**: edge cases I might have missed
- **it saves maybe thirty minutes a day**: it saves maybe thirty minutes a day
- **confident, plausible code**: confident, plausible code
- **I never merge generated code without reading every line**: I never merge generated code without reading every line
- **I am the one who signs the commit**: I am the one who signs the commit

> Senior tip: Don't answer "I don't use AI" (sounds outdated) or "AI writes all my code" (sounds irresponsible). Mention **data boundaries** as a big plus with international companies, because they worry about compliance. Pronunciation **authority** /əˈθɒrəti/ stress on second syllable, and **proprietary** /prəˈpraɪətri/ — Vietnamese speakers often get stress wrong.`,
    follow: [
      'Can you give an example where AI gave you a wrong answer? How did you catch it?',
      'Does your company have a policy on AI tools and customer data?',
      'Do you think AI changes what a senior engineer should be good at?',
    ],
  },
  'english-017': {
    q: `When you are stuck on an interview problem, how do you keep talking aloud without rambling or staying silent?`,
    a: `**Summary:** This is a **meta** question: the interviewer wants to hear how you manage communication when stuck. Answer with a **3-step** structure: restate the problem in your own words → ask 1–2 clarifying questions with purpose → state assumptions before coding. Include real sample phrases and how to control length during think-aloud.

### Sample answer
I use a three-step habit. First, I repeat the problem in my own words: "So just to make sure I understand, you want me to return the top K merchants by volume, and K can be larger than the number of merchants." That buys me ten seconds and catches misunderstandings early, which is worth more than ten seconds.

Second, I ask at most two clarifying questions, and I explain why I am asking: "Is the input already sorted? That decides whether I need a heap or can just take the first K." A question with a reason sounds senior; a stream of questions sounds unprepared.

Third, I state my assumptions before writing code: "I will assume the list fits in memory and that we care about time more than space." Then I talk through the approach in three sentences, and only after that do I start typing. While coding I narrate decisions, not syntax: "I am using a map here because I need O(1) lookup by ID."

When I get stuck, I say so directly: "Let me think about the edge case for thirty seconds." Silence for half a minute is fine if I announced it; silence for three minutes is not. If I truly do not know something, I say "I have not used that API, but here is how I would find out" — that is a better answer than inventing one.

### Useful phrases
- **repeat the problem in my own words**: restate the problem in your own words to confirm understanding
- **at most two clarifying questions**: ask at most two clarifying questions with purpose
- **state my assumptions before writing code**: state assumptions before coding
- **let me think for thirty seconds**: say directly when you need thinking time
- **I have not used that API, but here is how I would find out**: admit unfamiliarity with a plan to learn

> Senior tip: The interviewer is testing **structured thinking under pressure**, not just syntax. Practice thinking aloud with a timer: speak every 20 seconds, either a decision, a doubt, or a plan. This turns silence into visible reasoning and shows senior-level self-awareness.`,
    follow: [
      'How do you balance explaining your reasoning with staying within time limits?',
      'Can you give an example where clarifying a requirement changed your approach?',
      'What do you do if the interviewer says your answer is wrong?',
    ],
  },
  'english-018': {
    q: `This is usually the last technical round. What questions do you prepare to ask the interviewer?`,
    a: `**Summary:** The final question is your **last chance to score points** — ask about real work, team, and decision-making, not salary/benefits in the technical round. Choose 3 questions that show you think like someone who **would work there**: on-call, tech debt, how success is measured, technical decision rights.

### Sample answer
I usually prepare five and ask three, depending on how the conversation went.

The first is about the reality of the work: "What does a typical on-call week look like for this team, and what caused the last incident?" That tells me more about engineering health than any architecture diagram. If the answer is "we get paged every night", I know what I am signing up for.

The second is about decisions: "Who decides when there is a disagreement about architecture, and can you give me an example from the last six months?" I want to know whether engineers have real influence or whether decisions come from above.

The third is about success: "How would you know in six months that you had hired the right person for this role?" That question is useful for me too, because it tells me exactly what they will evaluate me on.

### Useful phrases
- **what does a typical on-call week look like**: ask about on-call reality
- **who decides when there is disagreement about architecture**: ask about decision authority
- **how would you know you hired the right person**: ask about success metrics for the role

> Senior tip: Asking about the team and incidents shows **stakeholder awareness**, a lead-level trait. Avoid asking only about tech stack — that signals you care more about tools than outcomes. Also avoid asking salary here; save it for HR.`,
    follow: [
      'How do you decide which of your prepared questions to ask?',
      'What if the interviewer gives a vague answer to your team question?',
      'Can you ask about career growth, or is that too personal for this round?',
    ],
  },
  'english-019': {
    q: `What salary range are you targeting? How do you handle the compensation conversation?`,
    a: `**Summary:** Do not state a single number and do not say "up to you". The safe approach: **ask the budget for the role → propose a range based on the market → separate salary from benefits → state notice period clearly per contract**. Stay collaborative, not confrontational, and always confirm in writing afterward.

### Sample answer
I usually answer with a range and a reason, not a single number. Something like: "Based on my research for senior backend roles in Ho Chi Minh City with this level of ownership, I am targeting a range of fifty-five to sixty-five million VND gross per month. I am flexible depending on the whole package, especially the bonus and the learning opportunity, but that is the range where I can say yes quickly."

If they ask first, I politely turn it around once: "Could you share the budgeted range for the role? That would help me tell you honestly whether we are aligned." That is not a trick; it avoids wasting both sides' time.

On notice, I am transparent: "My contract requires forty-five days, and I would not leave before handing over properly. So if we sign this week, I could start in about seven weeks." I also mention that I would rather not use my remaining leave to shorten it, because a clean handover matters to me.

If the offer is below my range, I do not negotiate emotionally. I say what would make it work: a higher base, a signing bonus, or a review after six months. And I always ask for the offer in writing before I resign.

### Useful phrases
- **based on my research for senior backend roles**: reference market data for the role
- **I am targeting a range**: propose a range, not a fixed number
- **could you share the budgeted range**: politely ask for their range first
- **my contract requires forty-five days**: state notice period clearly
- **ask for the offer in writing**: confirm everything in writing

> Senior tip: Vietnamese candidates often over-explain salary reasoning — keep it to two sentences of evidence, then ask for alignment. Employers respect candidates who know their market value and have a clear handover plan. Always mention the whole package, not just base, to show senior-level total-compensation awareness.`,
    follow: [
      'How do you respond if the employer refuses to state a budget?',
      'What if they ask for your current salary?',
      'How do you negotiate when you really want the role?',
    ],
  },
  'english-020': {
    q: `Can you explain the CAP theorem and how you applied it when choosing between consistency and availability in a real system?`,
    a: `**Summary:** CAP states that when a network is partitioned, a distributed system must choose between Consistency (every read sees the latest write — linearizable) and Availability (every request to a living node gets a response). Partition is unavoidable, so the practical choice is CP or AP **during partition**. Eventual consistency chooses AP: data will become consistent after some time, not immediately.

### Sample answer
The CAP theorem says that when a network partition happens, a distributed system has to choose between consistency and availability. Since partitions **will** happen in production, the real choice is CP, where some requests fail so that nobody reads stale data, or AP, where every node keeps answering even if some answers are stale.

Eventual consistency means that if no new writes come in, all replicas will eventually converge to the same value. There is no fixed bound on how long that takes, and the trade-off is that readers may see stale data in the meantime.

In our payment gateway, we had a service that routed transactions to acquirers based on a rules engine stored in PostgreSQL and cached in Redis across two regions. We chose AP for the rules cache: reads from Redis were always available even if the cross-region link was down. If a rule changed in region A, it propagated to region B via a Kafka topic with at-least-once delivery. The cache TTL was five seconds, so the maximum inconsistency window was about five seconds plus replication lag.

One incident showed the cost: a rule disabling a high-risk acquirer was updated in region A, but the cache in region B still served the old rule for four seconds. During those four seconds, twenty transactions were routed to the disabled acquirer and failed. We fixed it by adding a synchronous invalidation webhook for critical rules, and by making the acquirer adapter idempotent so retries did not double-charge.

### Useful phrases
- **partition is unavoidable**: partition is unavoidable in production
- **CP vs AP during partition**: practical choice depends on partition, not normal operation
- **eventual consistency**: consistency achieved over time, not immediately
- **cache TTL of five seconds**: define inconsistency window with TTL
- **idempotent adapter**: prevent double processing on retry

> Senior tip: Many interview answers confuse CAP with "always consistent" — clarify that you are discussing behavior **during partition**, not normal operation. Mention a concrete TTL and a failure mode (e.g., stale rule, double charge) to show production experience, not just theory.`,
    follow: [
      'When would you choose CP over AP for a user-facing feature?',
      'How do you measure the cost of inconsistency in your system?',
      'What is the role of idempotency in an AP system?',
    ],
  },
  'english-021': {
    q: `Design a URL shortener service. What are the functional and non-functional requirements, and how do you generate short keys safely at scale?`,
    a: `**Summary:** A URL shortener needs: **unique mapping from key to original URL**, **fast redirect** (p99 < 50ms), **collision-free key generation**, and **horizontal scaling**. The core is designing the key space, choosing storage, and handling hot keys.

### Sample answer
**Functional requirements:** shorten a long URL to a short key (e.g., short.ly/abc123), redirect with {{301/302}}, optionally track clicks. **Non-functional:** high read throughput (100M+ redirects/day), low latency, durable, custom aliases optional.

**Key generation:** I would use base62 (a-z, A-Z, 0-9) with length 7, giving {{62^7}} ≈ 3.5 trillion combinations — enough for years. Two approaches: (1) generate random keys and rely on the unique index, retrying on the rare collision; (2) use a distributed ID generator like Snowflake and encode the ID in base62. I prefer (1) because it is simpler, the keys are not guessable, and with a good random source collisions are rare enough that a single retry handles them. For custom aliases, validate uniqueness at write time.

**Storage:** The mapping table is simple ({{key}}, {{long_url}}, {{created_at}}, {{owner_id}}, {{expires_at}}). A single PostgreSQL instance with a unique index on {{key}} easily handles hundreds of millions of rows. For the read-heavy redirect path, I would put a Redis cache in front with a 24-hour TTL. Cache key = short key, value = long URL. On cache miss, query Postgres and populate cache. Write path: insert to Postgres, invalidate cache (or rely on TTL).

**Scale / hot key:** The redirect endpoint is read-only and cacheable, so a CDN or edge cache handles most traffic. A hot key is handled naturally by the cache; if the cache fails, database read load is balanced by sharding by key hash. Rate limiting at the gateway prevents abuse.

### Useful phrases
- **base62 with length 7**: choose key space for years of growth
- **rely on unique index with retry**: simple collision handling
- **Redis cache with 24-hour TTL**: fast redirect path
- **hot key handled by cache and sharding**: scale reads without overloading DB

> Senior tip: Always mention the redirect code — 301 for permanent (SEO-friendly) vs 302 for temporary. In production, use 301 for short links that should never change, and include a click-tracking pipeline separate from the redirect path so analytics never slows the response.`,
    follow: [
      'How do you prevent malicious users from generating unlimited short links?',
      'What happens if the database fails but the cache is still warm?',
      'How would you design analytics for click tracking without hurting redirect latency?',
    ],
  },
  'english-022': {
    q: `How does Kafka guarantee ordering within a partition? What happens when a consumer crashes during processing, and how do offsets and at-least-once delivery interact?`,
    a: `**Summary:** Kafka guarantees ordering **within a partition** with monotonically increasing offsets. Producer sends with the same key → same partition → order preserved (with {{enable.idempotence=true}}, default since Kafka 3.0, retries do not reorder). Consumer crash: group rebalance occurs, partitions are reassigned to another consumer, continuing from the committed offset. Messages processed but not yet committed will be reprocessed (at-least-once). Need idempotent consumer or Kafka transactions to avoid duplicates.

### Sample answer
Kafka ordering guarantee is per partition. When you send messages with the same key, Kafka hashes the key to determine the partition, so all messages for that key go to the same partition and are appended in order. The broker assigns a monotonically increasing offset to each message within that partition, and consumers read the partition in offset order. On the producer side, idempotence (enabled by default since Kafka 3.0) makes sure retries do not reorder or duplicate messages.

If a consumer crashes, the group coordinator (a broker) detects it when heartbeats stop arriving within {{session.timeout.ms}} (45 seconds by default since Kafka 3.0; heartbeats are sent every 3 seconds). A consumer that is alive but stuck is kicked out when it exceeds {{max.poll.interval.ms}} (5 minutes by default). It triggers a rebalance: the partitions owned by the crashed consumer are reassigned to the remaining consumers in the group. The new consumer starts reading from the last committed offset of that partition.

The critical question is: **when do you commit offsets?** With {{enable.auto.commit=true}} (the default in the plain Kafka client, while Spring Kafka turns it off and commits for you), offsets are committed periodically during {{poll()}}, every 5 seconds by default. If the consumer crashes between processing and auto-commit, the new consumer will reprocess those messages — this is at-least-once delivery. If you commit before processing and the consumer crashes after commit but before finishing, you lose messages — at-most-once.

### Useful phrases
- **per partition ordering**: ordering is per partition, not global
- **idempotence by default**: retries do not reorder since Kafka 3.0
- **heartbeat timeout and rebalance**: crash detection and partition reassignment
- **commit after processing**: at-least-once requires idempotent handling

> Senior tip: Always mention the trade-off between commit timing and delivery guarantee. In production, use manual commit after processing with idempotent consumers, or Kafka transactions for exactly-once if the throughput cost is acceptable. Never assume auto-commit is safe for financial data.`,
    follow: [
      'What is the difference between partition-level ordering and global ordering?',
      'How does idempotence protect against duplicate messages?',
      'When would you use Kafka transactions over manual offset commit?',
    ],
  },
  'english-023': {
    q: `Explain SQL isolation levels, how they relate to real bugs (lost update, phantom read, write skew), and which defaults PostgreSQL and MySQL use.`,
    a: `**Summary:** SQL defines 4 isolation levels: Read Uncommitted, Read Committed, Repeatable Read, Serializable. Higher levels are safer but lower throughput due to lock/contention. PostgreSQL default is Read Committed, MySQL/InnoDB default is Repeatable Read. Common bugs: lost update (Read Committed), phantom read (Repeatable Read per SQL standard), write skew (snapshot isolation like PostgreSQL Repeatable Read still allows; only Serializable or explicit locks prevent it).

### Sample answer
The four standard isolation levels, from weakest to strongest:
1. **Read Uncommitted** — can read uncommitted changes from other transactions (dirty reads). Rarely used.
2. **Read Committed** (Postgres default) — only reads committed data. Prevents dirty reads, but allows non-repeatable reads (reading the same row twice returns different values) and phantom reads (a re-run query returns new rows).
3. **Repeatable Read** (MySQL default) — the SQL standard only requires it to prevent non-repeatable reads. In practice, **PostgreSQL implements it as snapshot isolation**, which also prevents phantom reads but still allows write skew. MySQL InnoDB uses a snapshot for plain reads and next-key locks for locking reads.
4. **Serializable** — fully serializable execution, typically via predicate locking or serializable snapshot isolation (SSI). Highest contention.

Common bugs: lost update occurs when two transactions read the same value and both write, overwriting each other — common at Read Committed. Phantom read occurs when a second query sees rows inserted by another transaction — prevented at Repeatable Read in Postgres, but the SQL standard allows it. Write skew is the hardest: two transactions read overlapping data and write non-overlapping fields based on their reads, causing inconsistency — allows at Repeatable Read in Postgres; only Serializable or explicit advisory locks prevent it.

### Useful phrases
- **PostgreSQL default Read Committed**: know engine defaults
- **snapshot isolation vs SQL Repeatable Read**: Postgres is stronger
- **write skew needs Serializable or locks**: do not assume Repeatable Read is enough

> Senior tip: Many senior engineers confuse Repeatable Read with full serializability. Always mention that PostgreSQL's Repeatable Read is snapshot isolation, which allows write skew — a production pitfall when two users update different fields of the same record. Use advisory locks or Serializable for critical financial updates.`,
    follow: [
      'How would you detect a lost update in production?',
      'When is it safe to use Read Committed instead of Repeatable Read?',
      'Can you give an example of write skew in a real system?',
    ],
  },
  'english-024': {
    q: `Describe a production incident you debugged using a structured method. What tools did you use, and what was the lesson for the team?`,
    a: `**Summary:** Use a STAR structure but focus on **systematic debugging process**: reproduce → collect evidence → hypothesize → verify → fix → prevent. Mention specific tools (logs, traces, metrics, heap dumps) and a lesson about process.

### Sample answer
**Situation:** In our payment reconciliation job, we started seeing duplicate settlement records for the same transaction — about 0.1% of volume but financially unacceptable. The job runs nightly, reads from Kafka, and writes to PostgreSQL.

**Task:** Find why duplicates occur and fix it without delaying the month-end close.

**Action:** First, I checked whether it was a Kafka redelivery issue. The consumer commits offsets after processing each batch, so a crash mid-batch could cause reprocessing. But there had been no consumer restarts or rebalances on the nights the duplicates appeared, so I ruled that out.

Next I looked at database logs and found the duplicate insert came from overlapping runs — two instances of the job started because a previous run had not finished when the cron triggered again. I confirmed with metrics: the job duration had increased from 2 hours to 3.5 hours after a schema change that added a full-table scan on a large table. The root cause was a missing index on the reconciliation status column.

I fixed by adding the index, reducing the job to 1.5 hours, and changing the cron to a lock-based scheduler with a 30-minute overlap guard. I also added an idempotency key check (transaction_id + batch_id) at the database level so even if two runs overlap, duplicates are rejected.

**Result:** Zero duplicates in the next three nights, job finished 30% faster, and we added a monitoring alert when job duration exceeds 2 hours.

### Useful phrases
- **reproduce first**: reproduce the issue, not just read logs
- **check for overlapping runs**: look at scheduling and duration
- **add database-level idempotency**: prevent duplicates even with overlap

> Senior tip: Always mention a prevention step that changes the process — a new metric, a lock, or a check — not just a code fix. Interviewers look for evidence that you prevent recurrence, not just solve once.`,
    follow: [
      'How do you decide when to stop investigating and start fixing?',
      'What metric would you have added to catch this earlier?',
      'Can you explain the difference between a root cause and a contributing factor?',
    ],
  },
  'english-025': {
    q: `How do you give a stand-up update to your team or manager? Give a real example of a good update with a blocker and the help you need.`,
    a: `**Summary:** Standard stand-up update: **what I did yesterday → what I do today → blocker (with specific help needed)**. Short (< 60 seconds), focus on **deliverable outcome**, not activity. Blocker states clearly **who can help** and the **deadline**.

### Sample answer
"Yesterday I finished the idempotency key validation for the refund API and opened PR #3421. Today I'll finish the webhook retry with exponential backoff. The code is done, but I can't test it end to end in staging until the dead-letter topic exists.

**Blocker:** The DLQ topic doesn't exist in the staging cluster yet. I need the platform team to create it with a 7-day retention period and monitoring alerts. @platform-team, could you pick this up today? We need it by tomorrow morning to unblock the deployment."

### Useful phrases
- **yesterday I finished ... and opened PR**: state completed deliverable with artifact
- **today I'll finish ...**: state next concrete step
- **I can't test ... because ...**: name blocker specifically
- **I need [person/team] to [action] by [time]**: request help with owner and deadline

> Senior tip: Senior engineers speak in **outcomes and constraints**, not tasks. Instead of "I'm working on the webhook", say "The retry logic is coded but cannot be validated because the DLQ is missing — I need platform by tomorrow." This shows ownership, transparency, and collaboration.`,
    follow: [
      'How do you handle a blocker that involves another team with different priorities?',
      'What do you do if you have nothing to report?',
      'How do you make stand-up updates useful for a remote team?',
    ],
  },
  'english-026': {
    q: `How do you communicate a project delay or bad news to a client or stakeholder? What structure do you follow?`,
    a: `**Summary:** Principle: **honest, early, with a plan, no blame**. Structure: fact (how long delayed) → root cause (brief, not overly technical) → impact → fix plan (with timeline) → commitment to report progress. Always contact proactively before the deadline.

### Sample answer
"Hi [Client Name], I want to give you an early heads-up. The payment reconciliation feature we planned to release this Friday will be delayed by approximately one week.

**Root cause:** During load testing, we found a race condition in the idempotency layer that could cause duplicate settlements under high concurrency. It does not show up in functional tests, only when many requests for the same payment arrive at the same time.

**Impact:** The new target date is next Friday, January 19. No other deliverables are affected.

**Plan:** We have added an advisory lock around the settlement step and are running 48 hours of stress tests before release. I will send you an update every Wednesday and Friday until we confirm the release.

**Commitment:** I will not let this delay go unreported again — if testing reveals anything else, I will message you within 24 hours."`,
    follow: [
      'How do you decide whether to delay versus release with a partial fix?',
      'What if the stakeholder asks for a detailed technical explanation?',
      'How do you rebuild trust after delivering bad news?',
    ],
  },
});
