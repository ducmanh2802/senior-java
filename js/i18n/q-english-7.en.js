/*
 * English translation of js/data/q-english.js — task T407. Format: js/core/i18n.js (content overlay).
 * ids: english-064 english-065 english-066 english-067 english-068 english-069 english-070 english-071
 */
App.i18n.content({
  'english-064': {
    q: 'Explain how virtual threads work in Java 21. When would you use them, and what are the trade-offs compared to platform threads?',
    a: `**Summary:** Virtual threads (Project Loom) are lightweight threads managed by the JVM rather than the OS. When blocked (for example, on I/O), the JVM automatically unmounts the virtual thread from its carrier (platform thread) and mounts it again when the I/O completes, freeing the carrier for other work. They are well suited to high-concurrency, I/O-bound workloads; they do not help with CPU-bound work (the number of cores stays the same), and on Java 21 {{synchronized}} can pin the carrier.

### Sample answer
Virtual threads, which became final in Java 21 through JEP 444, are lightweight threads managed by the JVM rather than the operating system. A platform thread maps one-to-one to an OS thread and usually reserves around a megabyte of stack, so you can only have a few thousand of them. A virtual thread's stack lives on the heap and starts at a few kilobytes, so you can easily have hundreds of thousands.

Here's how it works: virtual threads run on a small pool of carrier threads — a work-stealing ForkJoinPool, roughly one carrier per CPU core. When a virtual thread hits a blocking call, like a JDBC query or an HTTP request, the JVM unmounts it and saves its stack to the heap, and the carrier picks up another virtual thread. When the I/O completes, the virtual thread is scheduled again, possibly on a different carrier.

I'd use them for high-concurrency, I/O-bound services — for example, a Spring Boot 3.2 app that calls several downstream APIs; you just set {{spring.threads.virtual.enabled=true}}. The trade-offs: CPU-bound work doesn't get faster, because you still have the same number of cores. On Java 21, blocking inside a {{synchronized}} block pins the virtual thread to its carrier, so I'd use {{ReentrantLock}} on hot paths — this was fixed in JDK 24. And you shouldn't pool virtual threads or cache expensive objects in {{ThreadLocal}}, because each task gets a new thread. Finally, the bottleneck often moves to the database: a million virtual threads still share a connection pool of, say, 50.

### Useful phrases
- **managed by the JVM rather than the OS**: managed by the JVM instead of the operating system
- **unmount from / mount on a carrier**: detach from / attach to a carrier thread
- **pinned to its carrier**: stuck to its carrier (unable to release it when blocked)
- **the bottleneck moves to the database**: the database becomes the bottleneck

> Senior tip: Do not just say "virtual threads are faster" — they improve **throughput** while waiting for I/O; they do not make an individual request faster. On Java 21, {{synchronized}} around a blocking call pins the carrier; use {{ReentrantLock}} or upgrade to JDK 24+ (JEP 491). Monitor pinning with the JFR event {{jdk.VirtualThreadPinned}}. Also remember to limit concurrency toward finite resources (DB pools, external APIs) with a {{Semaphore}}.

### Common mistakes Vietnamese speakers make
- Confusing virtual threads with a thread pool.
- Overlooking the pinned-carrier issue.`,
    follow: [
      'How does a virtual thread interact with ThreadLocal variables?',
      'What is a "pinned" virtual thread, and how do you avoid it?',
      'Can you replace all platform threads in a Spring Boot service with virtual threads?',
    ],
  },
  'english-065': {
    q: 'In a system design round, how do you politely clarify ambiguous requirements before you start designing?',
    a: `**Summary:** Do not start designing before you clearly understand the requirements. Use this structure: restate the problem in your own words → ask 1–2 questions with reasons → state your assumptions → propose the next step.

### Sample answer
Before I draw any boxes, I play the problem back in my own words: "So we need a system that processes about a thousand orders per second, goes multi-region within six months, and stays under fifty thousand dollars a month — did I miss anything?" That buys me a few seconds and catches misunderstandings early.

Then I ask a few clarifying questions, each with a reason: "Do clients retry failed requests? If they do, I'll need idempotency keys to avoid duplicate orders." Or: "Is a thousand per second the average or the peak? That changes how much headroom I plan for."

Next, I state my assumptions out loud: "I'll assume the thousand is peak traffic, latency matters more than cost, and we already run on Kubernetes. Please stop me if any of that is wrong." Then I sketch a high-level design and check that we're aligned before going deeper.

### Useful phrases
- **play the problem back in my own words**: restate the problem in my own words
- **That buys me a few seconds.**: that gives me a few extra seconds to think
- **each question comes with a reason**: every question includes a reason
- **Please stop me if any of that is wrong.**: please interrupt me if any of that is incorrect

> Senior tip: Do not start with tools. Ask about scope, scale, latency, budget, and constraints first. If you do not understand, say: "Could you clarify what you mean by 'scalable'?"

### Common mistakes Vietnamese speakers make
- Saying "Can you repeat again?" (redundant; say "Could you say that again?").
- Asking 10 questions all at once → ask the 3–5 most important questions instead (scale, consistency, latency) and state the rest as assumptions.`,
    follow: [
      'What if the interviewer says "just design it"?',
      'How many clarifying questions is too many?',
      'How do you handle a wrong assumption?',
    ],
  },
  'english-066': {
    q: 'How do you explain a trade-off between two technical options to a non-technical stakeholder?',
    a: `**Summary:** Avoid technical jargon. Use an analogy or everyday example, clear costs, and a specific proposal. End with a recommendation rather than stopping at "it depends". Stakeholders need to make a decision, not learn architecture.

### Sample answer
I start with a concrete analogy: "A monolith is like one big restaurant kitchen; microservices are like a row of food trucks. Food trucks can grow independently, but you have to manage many more of them."

Then I put numbers on it: "We're a team of eight, and we deploy six times a week without problems. Splitting into services would mean extra infrastructure, monitoring and on-call — I'd estimate that takes a quarter or more of our time for the first few months, before we ship any new feature. Splitting pays off when you have several teams that block each other, or when one part of the system needs ten times more capacity than the rest. We're not there yet.

So I recommend we keep the monolith but enforce clear module boundaries. That way, if we do need to split later, it's a few weeks of work, not a two-year rewrite."

### Useful phrases
- **put numbers on it**
- **operational overhead**
- **clear module boundaries**
- **not a two-year rewrite**

> Senior tip: Do not say "it depends" and stop there — the stakeholder needs a recommendation. If you are genuinely unsure, say: "Based on the data I have, I recommend X. If the team size doubles, we should revisit Y." Also, do not teach them the definitions again — they hired you to make decisions, not to teach them architecture. Always end with a question: "Does that match your understanding of the business priority?"

### Common mistakes Vietnamese speakers make
- Mixing Vietnamese and English when explaining something to a foreign stakeholder.
- Mentioning only the benefits without clearly stating the costs.
- Ending with "it depends" without giving a recommendation.`,
    follow: [
      'How do you explain latency to a PM?',
      'What if the stakeholder insists on microservices?',
      'How do you handle a wrong technical term?',
    ],
  },
  'english-067': {
    q: 'How do you handle interviewer pushback or challenge during system design?',
    a: `**Summary:** Do not get defensive. Use this structure: acknowledge the valid point → clarify the challenge → adjust or provide evidence → propose a way to test it. This shows that you can collaborate under pressure and are willing to adapt your design based on new data.

### Sample answer
First, I listen to the whole challenge and acknowledge what's valid: "That's a fair challenge — read replicas help with read load, but they don't help if the primary goes down." Then I ask what the concern really is: "Are you more worried about cost, complexity, or a specific failure mode? My answer would be different depending on the main risk."

Next, I either bring evidence or adjust the design: "If the main concern is cost, I'd keep one primary database and add a cache for the hot reads, with a short TTL. If it's availability, then a standby in a second availability zone with automatic failover is worth the extra cost — for example, Multi-AZ on RDS. With a 99.9 percent uptime target, I'd lean towards the standby, because a single-zone database makes that target hard to meet."

If they push further: "I see your point. Let me adjust: we start with a single region and a Multi-AZ database, add connection pool limits and circuit breakers, and write a runbook for failover. We revisit multi-region once we have real traffic data. Would that work?"

### Useful phrases
- **that is a fair challenge**
- **does that match your understanding of the risk?**
- **I will adjust the design**
- **revisit after real traffic data**
- **clear upgrade path**

> Senior tip: Do not say "you are wrong" or "that will not work" — that is the fastest way to lose points. Always use phrases such as "That is a valid concern", "Let me think about that", or "I had not considered that failure mode". If you genuinely do not know, say: "That is an interesting scenario. I would test it with a load test before committing, and note it as a risk." The interviewer is assessing your ability to learn and adapt.

### Common mistakes Vietnamese speakers make
- Saying "no, that is wrong" or "you do not understand" (very risky)
- Being overly defensive and refusing to adjust the design
- Failing to provide concrete evidence when challenged`,
    follow: [
      'What if the interviewer keeps challenging every part?',
      'How do you know when to stand firm and when to adjust?',
      'What is the best way to say you do not know?',
    ],
  },
  'english-068': {
    q: 'How do you politely say you do not understand the technical question or you do not know the answer?',
    a: `**Summary:** Do not bluff and do not stay silent. Use this structure: acknowledge + briefly explain why + describe how you would find out + offer a tentative direction (if you have one). This demonstrates honesty, problem-solving ability, and accountability.

### Sample answer
If the question is unclear: "Could you clarify what you mean by 'scalable' here? Do you mean handling more traffic, more data, or more teams working on it? Once I know that, I can give you a more concrete answer."

If I don't know the technology: "I want to be honest — I haven't used eBPF in production, so I can't give you numbers I'm confident about. Here's how I'd approach it: read the docs, run a small benchmark against our current iptables setup, and talk to the platform team. In the meantime, I can walk you through how we handle it today. Would that be useful?"

Either way, I show a method — check the docs, measure, ask someone with experience, and offer a temporary answer. That turns a gap into evidence of how I solve problems.

### Useful phrases
- **could you please clarify**
- **I want to be honest**
- **here is how I would approach it**
- **would that work for you?**
- **in the meantime**

> Senior tip: Do not say "I would Google it" — it sounds unprofessional. Give concrete steps and an estimated timeframe: "Concrete answer by tomorrow morning." If it is fundamental knowledge you should know (for example, "How does a HashMap work?"), do not simply say you do not know — state what you remember and say you will verify the rest: "I know the spread function and load factor; I will verify the exact treeify threshold and confirm with the Java 21 source."

### Common mistakes Vietnamese speakers make
- Saying "I do not know" and stopping without adding anything else
- Making up an answer and getting caught — completely losing credibility
- Using "Can you repeat again?" (redundant; say "Could you say that again?")`,
    follow: [
      'How do you handle it when the interviewer insists you guess anyway?',
      'How do you handle a question about a fundamental concept you should know?',
      'Have you ever pretended to know something and got caught? What did you learn?',
    ],
  },
  'english-069': {
    q: 'Walk me through how you explain the concept of eventual consistency to a product manager, using a concrete example.',
    a: `**Summary:** Avoid distributed-systems jargon. Use an everyday example (online shopping), explain the mechanism simply (copies gradually synchronize), state the concrete costs and benefits, then end with a question to confirm the PM's understanding.

### Sample answer
I would start with a real-world analogy: "Imagine you and a friend both update the same shared shopping list from different phones at the same time. Your phone shows 'milk' and your friend's shows 'bread.' For a few seconds, each of you sees a slightly different list. But as soon as both phones sync, you both see 'milk and bread.' That is eventual consistency: everyone sees the same list eventually, but not instantly."

Then I explain the business implication: "In our payment system, we have two data centers — one in Vietnam and one in Singapore. When a user updates their profile in Vietnam, the Singapore copy might lag by about two seconds. That means if the same user tries to log in from Singapore immediately after the update, they might see the old profile for a moment. The benefit is that the system stays available even if the network link between Vietnam and Singapore is temporarily down. The cost is that we must design features that can tolerate a brief delay."

Then I make it concrete: "For a financial transaction, eventual consistency is dangerous — you never want a payment to appear completed in Vietnam but missing in Singapore. That is why we use a strong consistency model for payments, with a single source of truth database. But for user preferences, notifications, or analytics, eventual consistency is fine because a two-second delay does not affect the business."

Finally, I ask: "Does that match the kind of delay your feature can tolerate?" This turns the explanation into a design decision rather than a lecture.

### Useful phrases
- **everyone sees the same list eventually**
- **the system stays available even if**
- **a brief delay does not affect the business**
- **does that match the kind of delay your feature can tolerate?**

> Senior tip: Start from the **pain the PM already knows** (support tickets, customer complaints), not from architecture. Ending with "Does that match the kind of delay your feature can tolerate?" gives them decision authority — they own the customer experience.

### Common mistakes Vietnamese speakers make
- Using terms like "replica", "consistency window", "vector clock" with a non-technical person.
- Explaining the mechanism without connecting it to a business trade-off.
- Not asking a confirming question at the end.`,
    follow: [
      'How would you explain strong consistency to the same manager?',
      'What is the business cost if the consistency window is violated?',
      'How do you decide which parts of the system need strong consistency?',
    ],
  },
  'english-070': {
    q: 'How do you estimate the number of servers or services needed for a new feature and explain the numbers to the team?',
    a: `**Summary:** Do not guess. Use real data from the current system (QPS, latency, data size) → calculate using a simple formula → add a 30% buffer → state your assumptions clearly. Explain everything in plain language.

### Sample answer
First, I collect baseline numbers from a similar service we already run: peak requests per second, average latency, and — most importantly — how much traffic one instance can handle. I get that last number from a load test, not from a formula. Say one 4-core instance handles about 250 requests per second before CPU reaches 70 percent or p99 latency goes over our target.

Then I do the math. If the new feature needs to handle 1,000 requests per second at peak, that's 1,000 divided by 250, so 4 instances. I add about 30 percent headroom for spikes, deployments and losing one instance: 4 times 1.3 is 5.2, so I'd round up to 6, spread across availability zones.

I use Little's Law to check the database side. Concurrency equals throughput times time. If each request holds a database connection for about 10 milliseconds, then 1,000 per second times 0.01 seconds is about 10 connections busy on average. So a pool of 10 to 15 per instance is plenty, and 6 instances means at most 90 connections — well under our database limit of 500.

Then I explain it to the team: "We need 6 instances, based on a load test and 30 percent headroom. If traffic grows 50 percent next quarter, we'll need about 8. If we cut the CPU cost per request in half, we could drop to 3 or 4. These are estimates — once we're in staging, I'll rerun the load test and adjust."

This shows the number comes from data, not guesswork, and it makes the assumptions easy to challenge.

### Useful phrases
- **peak requests per second**: the number of requests per second at peak traffic
- **headroom**: spare capacity kept in reserve
- **round up to**: round up to
- **concurrency equals throughput times time** (Little's Law)
- **makes the assumptions easy to challenge**: helps others question the assumptions easily

> Senior tip: The number is only as good as the load test. If you don't have a similar service, say so: "We don't have a direct comparison, so I'll build a spike to measure throughput on a single instance first." A guess with a clear label ("this is a rough estimate with wide error bars") is better than a fake precise number.

### Common mistakes Vietnamese speakers make
- Giving a precise number like "we need exactly 7 servers" without saying where it came from.
- Forgetting to check the downstream bottleneck (database, external API) and only sizing the app tier.
- Not explaining the assumptions so the team cannot challenge them.`,
    follow: [
      'How would you adjust the estimate if processing time improved by 50%?',
      'What if the database becomes the bottleneck before the servers?',
      'How do you explain this to a manager who only cares about cost?',
    ],
  },
  'english-071': {
    q: 'How do you politely ask for clarification when you do not understand an English interview question?',
    a: `**Summary:** Do not say "What?" or stay silent. Use a polite question and give a reason so the interviewer can see that you are trying to understand, not listening carelessly. Always restate the part you understood first to confirm it.

### Sample answer
If I miss part of the question, I say: "Could you please repeat the last part? I want to make sure I answer the right thing." If the vocabulary is unfamiliar, I say: "Could you clarify what you mean by 'idempotency'? My understanding is that repeating the same request has the same effect as sending it once — but are you asking about it from the API design side or the database side?"

Then I repeat the full question back: "So just to make sure I understand: you want me to explain how I would make a POST endpoint idempotent, considering both the client-sent key and the server-side state. Is that correct?" That shows I listened, I am precise, and I value accuracy over speed.

If the interviewer uses an idiom I do not know, I ask politely: "I am not familiar with that phrase — could you explain what 'move the needle' means in this context?" This is better than pretending to understand and answering the wrong question.

### Useful phrases
- **could you please repeat the last part**
- **I want to make sure I answer the right thing**
- **could you clarify what you mean by**
- **just to make sure I understand**
- **I am not familiar with that phrase**

> Senior tip: Do not say "Can you repeat again?" — this redundant wording is a very common mistake ("repeat" already means "say again"). The correct forms are "Could you say that again?" or "Could you repeat that?". Also, do not say "Sorry, my English is not good" — that undermines your credibility. Instead, say: "Could you speak a little slower? I want to make sure I understand every detail."

### Common mistakes Vietnamese speakers make
- Saying "Can you repeat again?" (redundant)
- Saying "Sorry, my English is bad" (undermines credibility)
- Staying silent, then guessing and answering completely incorrectly`,
    follow: [
      'How do you handle a very fast-talking interviewer?',
      'What if the interviewer uses a lot of idioms?',
      'How do you confirm your understanding without sounding slow?',
    ],
  },
});