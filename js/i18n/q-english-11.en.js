/*
 * English translation of js/data/q-english.js — task T678. Format: js/core/i18n.js (content overlay).
 * ids: english-103 english-104 english-105
 */
App.i18n.content({
  'english-103': {
    q: 'An interviewer asks: "Your design works today — what would you do differently if traffic grew ten times?" Answer in English by identifying bottlenecks, proposing an evolution plan, and explaining trade-offs.',
    a: `**Summary:** A model spoken answer for the "10x traffic" question — it tests whether you design to **evolve** a system instead of tearing it down and rebuilding. How to answer: identify the first bottleneck, give the scaling steps in order, and state the trade-offs clearly.

### Sample spoken answer (150-250 words)
"That's a great question. With ten times the traffic, I would not rewrite the system from scratch. I would find the first bottleneck and evolve the design step by step.

The first bottleneck is usually the database, because reads and writes both grow while a single primary node has limited capacity. My first move would be to add a cache for the hottest read paths and to introduce read replicas to offload read traffic. That buys time with relatively low complexity.

If traffic keeps growing, the next step is horizontal scaling of the stateless API layer behind a load balancer, so we can add instances instead of making one machine bigger. The trade-off is that we must keep session state out of the instances, for example in Redis or by using stateless tokens.

At ten times scale, a single database shard may still struggle with writes. Then I would consider sharding the data by a natural key, such as user ID, to spread write load. The downside is that cross-shard queries and transactions become much harder, so I would only shard when the simpler options are exhausted.

Throughout this, I would rely on metrics and load tests to confirm each bottleneck before making a change, because scaling the wrong component wastes effort."

### Term explanations (read this first so you do not stumble)
- **Bottleneck**: the slowest component that limits the whole system — like the narrow neck of a bottle controlling how fast it pours. Always ask "what breaks first?".
- **Order of evolution**: (1) cache + read replicas, (2) horizontal scaling of a stateless API, (3) database sharding. Move from simple to complex, not the other way around.
- **Vertical vs horizontal**: vertical (scale up) = one bigger machine — it has a hard ceiling and costs grow fast; horizontal (scale out) = many smaller machines — cheaper per unit but it demands that your code be stateless.
- **Shard trade-off**: queries that join across shards become hard and distributed transactions become complex (two-phase commit, compensating actions). Shard only when you truly must.
- **Stateless**: an instance keeps no local session state, so any instance can serve any request — which is exactly what makes horizontal scaling easy.

### Useful phrases
- **I would not rewrite the system from scratch; I would evolve it step by step**: growth is handled by incremental change, not a big-bang rewrite
- **The first bottleneck is usually...**: name the component that limits the system before proposing anything
- **I would rely on metrics and load tests to confirm each bottleneck**: decisions are driven by measurement, not guesswork

### Common mistakes Vietnamese speakers make
- Listing technologies — "Kafka, Kubernetes, Redis" — without saying which bottleneck each one solves; it sounds like buzzword bingo.
- Jumping straight to microservices or sharding while skipping the cheap wins: caching and read replicas.
- Forgetting to say "stateless" when describing horizontal scaling of the API layer — the interviewer will ask how sessions work.

> Senior tip: Anchor your answer on "find the bottleneck first" and "measure before changing". "I would load test to reproduce the ten-times scenario and fix the measured bottleneck, not the assumed one" — this single sentence shows you avoid blind optimisation and separates a senior from a memoriser.`,
    follow: [
      'How would you decide between adding read replicas and adding a cache first?',
      'What makes cross-shard transactions difficult, and what patterns can replace them?',
      'Which metrics would you watch to detect that the database is becoming the bottleneck?',
    ],
  },
  'english-104': {
    q: 'You are starting a system design interview. How do you open the conversation by clarifying functional and non-functional requirements in clear English before proposing any architecture?',
    a: `**Summary:** A model spoken answer for the **opening** of a system design interview: clarify functional requirements (what the system does) and non-functional requirements (how fast, how big, how reliable) before drawing any architecture. Goal: narrow the scope so you do not design in the wrong direction.

### Sample spoken answer (150-250 words)
"Before proposing a design, I'd like to spend a minute clarifying the requirements so we solve the right problem.

On the functional side, what are the core actions users must be able to do? For example, should we focus only on the main flow, or also include admin features, notifications, and reporting? Are there any important edge cases, like deletes, edits, or permissions?

On the non-functional side, what scale should we design for - how many users, and what is the expected requests per second at peak? How latency-sensitive is the system: do users expect a response in under two hundred milliseconds, or is a few seconds acceptable? What availability target do we need, and is the data allowed to be briefly inconsistent, or must it be strongly consistent?

I'd also ask about constraints: do we need to integrate with existing systems, are there compliance or data residency requirements, and is there a deadline or a team size that affects how complex the design can be?

Once we agree on the top priorities - for instance, correctness for payments and low latency for reads - I'll summarize the scope and then move to a high-level design. Does that sound reasonable?"

### Term explanations (read this first so you do not stumble)
- **Functional requirements**: describe **behaviour/features** — what a user can actually do ("upload a photo", "cancel an order"). They let you circle the core scope.
- **Non-functional requirements**: describe **quality attributes** — scale (number of users, requests per second), latency (how long a response takes), availability (how often the system is up, e.g. 99.9%), consistency (whether reads always see the latest write). These are what decide the architecture.
- **Constraints**: fixed limits you did not choose — integrating with legacy systems, compliance rules (GDPR for EU personal data, PCI-DSS for card payments), data residency (data must physically stay in a certain country).
- **Opening technique**: ask → listen → **summarize the scope back** → ask for confirmation ("Does that sound reasonable?") → only then draw. The summary step catches misunderstandings before they become an hour of wrong design.

### Useful phrases
- **Before proposing a design, I'd like to clarify the requirements**: buy one minute of clarification before spending fifty-five minutes of design
- **On the functional side... / On the non-functional side...**: a clean two-part structure the interviewer can follow
- **How latency-sensitive is the system?**: ask about response-time expectations with concrete numbers (two hundred milliseconds vs a few seconds)
- **Let me summarize the scope before moving to the high-level design**: replay the agreement back to the room

### Common mistakes Vietnamese speakers make
- Skipping clarification and drawing immediately — you then build for requirements the interviewer never gave.
- Mixing the two categories: "fast" is non-functional, "a user can upload a photo" is functional.
- Firing twenty questions one after another — ask 2-3 questions as a group, then summarize.

> Senior tip: Force an early priority order: "If we have to choose, is correctness or latency more important?" — it makes trade-offs surface up front (payments → correctness, feeds → latency). Close the opening with the scope summary: it is the verbal "contract" every later design decision is checked against, and it protects you when the interviewer later adds a surprise requirement.`,
    follow: [
      'What is the difference between latency and throughput, and which would you clarify for a streaming system?',
      'How do availability targets like 99.9% translate into allowed downtime?',
      'If the interviewer gives vague requirements, how would you proceed without getting stuck?',
    ],
  },
  'english-105': {
    q: 'During a system design interview, the interviewer challenges your choice and suggests a different approach. How do you respond: defend your trade-off, acknowledge valid points, and adapt your design without sounding defensive?',
    a: `**Summary:** A model spoken answer for the situation where **the interviewer pushes back** — it tests collaboration and trade-off thinking, not just knowledge. A four-step strategy: listen, summarize their point, defend your choice with reasons tied to the requirements, acknowledge what is valid, and adapt.

### Sample spoken answer (150-250 words)
"That's a fair point, and I can see why you would suggest that approach. Let me make sure I understand: you are proposing we use a message queue here instead of a synchronous call, mainly to decouple the services and absorb spikes. Is that right?

My original choice was a synchronous call because the user needs an immediate confirmation, and the dependency is usually fast. The downside, as you pointed out, is tighter coupling and a risk of cascading failures if the downstream service slows down.

Given that concern, I think we can combine both ideas. We can keep the request synchronous for the critical step that needs confirmation, but move the non-critical side effects, like sending notifications or updating analytics, to an asynchronous queue. That way we preserve the user experience while reducing coupling.

I also agree that if latency on the dependency becomes unpredictable, we should add a timeout and a circuit breaker so one slow service does not take down the whole flow.

So I would adapt the design in that direction. Does that address the risk you had in mind, or is there another failure mode you want me to consider?"

### Term explanations (read this first so you do not stumble)
- **The four-step structure**: (1) **Acknowledge** — concede the valid point; (2) **Clarify** — restate their idea in your own words; (3) **Defend with reasons** — justify your choice against the requirements, not against the person; (4) **Adapt** — merge the good parts and ask a follow-up question.
- **Synchronous vs asynchronous**: synchronous = you call and wait for the answer before continuing (like a phone call); asynchronous = you send the work away and carry on (like dropping a letter in a mailbox).
- **Decouple**: reduce how directly one service depends on another being alive and fast — a message queue lets the sender finish while the receiver catches up later.
- **Cascading failure**: one slow or failing service drags its callers down with it, and the outage spreads upstream like dominoes.
- **Circuit breaker**: a guard that stops calling a failing dependency once errors exceed a threshold (like a house fuse tripping), so the caller fails fast instead of piling up waiting threads; **timeout** = the maximum time you are willing to wait for one call.

### Useful phrases
- **That's a fair point, and I can see why you would suggest that**: concede the valid part before arguing anything
- **Let me make sure I understand your suggestion...**: restate their idea and get a yes before responding
- **My original choice was X because..., but the downside is...**: defend with a requirement-based reason, then name the weakness yourself
- **Given that concern, I think we can combine both ideas**: turn the challenge into a joint improvement
- **Does that address the risk you had in mind?**: close the loop and invite the next concern

### Common mistakes Vietnamese speakers make
- Over-defensive: "No, my design is correct" — you lose the collaboration score even when you are technically right.
- Agreeing instantly with every suggestion and abandoning your reasoning — that reads as having no opinions of your own. Balance: acknowledge + defend + adapt.
- Not restating the interviewer's point, so you answer a different question than the one they asked.

> Senior tip: Sometimes the interviewer suggests a worse approach on purpose, to see whether you can hold a well-reasoned position. If the requirements support your choice, say "I would stick with X in this case because..." and spell out the exact condition that would flip you to Y ("if the downstream latency became unpredictable, I would move to the queue"). The close: "it depends on the requirement, and here is the condition that would change my choice."`,
    follow: [
      'What would make you change your mind completely about your original design choice?',
      'How do you stay collaborative when you strongly disagree with a suggestion?',
      'Can you describe a time you adapted a design after a valid critique? What changed and why?',
    ],
  },
});
