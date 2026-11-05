/*
 * English translation of js/data/q-soft.js — task T672. Format: js/core/i18n.js (content overlay).
 * ids: behavioral-021 behavioral-022 behavioral-023 behavioral-024 behavioral-025 behavioral-026 behavioral-027 behavioral-028 behavioral-029 behavioral-030
 */
App.i18n.content({
  'behavioral-021': {
    q: 'The interviewer asks a question you genuinely do not know, for example "How does ZGC differ from G1 in the way it keeps pauses short?". How do you answer so you still score points, instead of going silent or guessing blindly?',
    a: `**Summary:** Not knowing one question is normal; **making it up** or **going silent** is what loses points. Follow 4 steps: **state the boundary of your knowledge → state the part you know for sure → reason out loud from first principles → propose how you would verify**. The interviewer is grading how you think when you meet something new, because that is the work you will do every day.

### What the interviewer is assessing
- **Honesty about limits**: someone who dares to say "I have not used it" will not hide risks on production.
- **Ability to reason**: starting from solid fundamentals, can you reach a plausible hypothesis.
- **How you learn**: when you meet something unknown, do you go to the docs and measure, or do you guess.
- A good interviewer **deliberately** pushes to the edge of your knowledge. Being asked a question you cannot answer usually means you answered the previous ones well.

### Classifying the levels of "I do not know"
| Level | What to say |
|---|---|
| Know a comparable technology | "I have not used X, but I have used Y. If X is like Y in respect A, then..." |
| Know the concept, not the details | "I remember the principle being..., but I would look up the exact parameter names in the docs." |
| Only a vague idea | "I have only read about it, so let me reason it out and please correct me if I am wrong." |
| Completely unknown | "I have not come across this concept. Could you give me an example of the context where it shows up?" |

The principle is to **keep "known for sure" clearly separate from "reasoned out"**. Prefacing the inferred part with "my guess is" stops the interviewer from treating it as a wrong assertion.

### Sample answer
> "I have never run ZGC on production, so let me separate what I know for sure from what I am inferring.
> What I know for sure: G1 stops the application to evacuate regions, that is, to copy live objects to a new place, so pause time grows with the amount of live data that has to be copied. ZGC targets pauses under one millisecond, independent of heap size.
> From that I reason: to get pauses that short, ZGC has to move objects **while the application keeps running**. So there must be a mechanism that lets an application thread reading a reference to an object that is being moved still get the correct address. My guess is some kind of barrier inserted at reference read time, and the price is extra CPU spent by the application.
> If I had to choose for my team's service, I would not choose on theory. I would run a load test with the same heap, compare p99 latency, throughput and CPU between G1 and ZGC, and only then decide."

That reasoning is in the right direction: ZGC uses **load barriers** and **colored pointers** so relocation can happen concurrently, and it pays for that with extra CPU. Even if you get the detail wrong, the line of argument still earns points.

### Things to avoid
- **Confident fabrication**: the interviewer knows the answer, and a single invented sentence makes them doubt everything you said before it.
- **"I don't know" and then silence**: you throw away the chance to show how you think.
- **Apologising repeatedly**, putting yourself down ("I am really weak on this"): one honest acknowledgement is enough.
- **Steering to another topic too obviously**: "I don't know ZGC but I know Kafka very well...".
- **Thinking in silence for more than 20-30 seconds** without saying anything: say "Give me 30 seconds to organise my thoughts."

> Senior tip: After each interview, within one hour, write down **every question you could not answer** and look up the answer that same evening. After 5-6 interviews, that list is the revision plan that matches the real market most closely. During an interview, use a 3-level scale to place yourself: "have run it on production", "have read about it and tried it", "only know the concept". People who state their real level are trusted more than people who act like they know everything.`,
    follow: [
      'If the interviewer keeps digging into exactly the part you just admitted you do not know, how do you handle it?',
      'Describe a time you had to learn a completely new technology quickly to deal with an urgent problem.',
      'How do you tell "reasonable inference" apart from "guessing blindly" when you answer?',
    ],
  },
  'behavioral-022': {
    q: 'A 45-minute system design round: which signals is the interviewer actually grading? If you only finish the requirements and API part at minute 25, or the interviewer pulls you in another direction, how do you get the rhythm back?',
    a: `**Summary:** The interviewer grades against a rubric of **scoping clearly, estimates that drive decisions, the overall design, depth at one bottleneck, trade-offs and failure modes, and who is steering**. Control the pace with **time boxes said out loud, a check-in roughly every 10 minutes, a "parking lot" for details**, and when you fall behind, **compress on purpose** instead of trying to cover everything.

### What the interviewer is assessing
The common rubric (the labels differ by company, the substance does not):

| Signal | What a mid does | What a senior does |
|---|---|---|
| Clarify scope | Starts drawing immediately | Locks 3-5 use cases, states what is **not** in scope |
| Estimation | Computes QPS and leaves it there | Uses the numbers to **choose** technology ("200 writes/s means one Postgres is enough") |
| Overall design | Lists Kafka, Redis, K8s | Every box has a reason to exist |
| Depth | Names techniques | Explains mechanics: where the idempotency key is stored, what the TTL is |
| Trade-offs, failures | Never mentions them | "If Redis dies then...", "the price of eventual consistency is..." |
| Steering | Waits for the interviewer to ask | Proposes the next step, asks for the interviewer's input |

The standard time allocation is already in the 45-minute system design question in the Design section. This question focuses on **keeping the rhythm and recovering from being behind**.

### Tactics to keep the rhythm
1. **Say the time boxes out loud**: "I will spend about 5 minutes clarifying requirements, then a quick estimation."
2. **Parking lot**: a corner of the board labelled "later: rate limit, GDPR". When you get dragged into detail: "Let me park this point and come back to it if there is time."
3. **Check in roughly every 10 minutes**: "Up to here, would you rather I go deep on the write path or the read path?"
4. **The interviewer pulling you in another direction is a hint**, not a nuisance. Follow it immediately: they are handing you a chance to score on a rubric item you have not covered yet.

### When you fall behind: compress on purpose
> "I notice I have spent a lot of time on the API. To reach the important parts in time, I will sketch the overall flow in 3 minutes, then go deep on the single riskiest thing, which is preventing a double debit. I will leave analytics out of scope for now."

That sentence turns a timing mistake into an **ownership signal**: you know how to prioritise and how to cut scope. That is exactly the senior skill you need when a real project slips.

When the interviewer challenges your design: do not defend it at all costs. "You are right, at 10x traffic a single write database becomes the bottleneck. I would partition by merchant_id, and the price is that cross-merchant queries have to go through the analytics store."

### Things to avoid
- **A 20-minute monologue** without asking the interviewer anything.
- Designing for Google scale when the prompt has 1,000 users: over-engineering is penalised too.
- Ignoring the interviewer's hint to carry on with your own plan.
- Picking the deep dive on the part you know best instead of the **riskiest** part of the system.
- Running out of time with no summary and not a single failure mode mentioned.

> Senior tip: Practise with a real timer: set 45 minutes, record yourself, listen back and mark every place where you rambled. After 3-4 runs you will see you are always slow in the same place (usually requirements clarification or the API). Prepare **3 signature deep dives** that fit many prompts: idempotency + retry, cache invalidation + stampede, and the outbox pattern for writing to the DB and publishing events consistently. Every prompt has a place where at least one of them belongs.`,
    follow: [
      'If the interviewer stays completely silent for the whole round, how do you know you are on the right track?',
      'What criteria do you use to choose the deep dive point?',
      'The interviewer says your design is too complex. How do you respond?',
    ],
  },
  'behavioral-023': {
    q: 'Live coding round: you get stuck after 10 minutes, no optimal solution yet. How do you communicate, when do you write the brute force, how do you test it yourself, and when should you ask for a hint?',
    a: `**Summary:** Live coding grades the **process**, not only the result. When you are stuck: **say out loud what you have tried → write a brute force that is correct first → test it yourself with a small example → look for the repeated work to optimise → if you have been silent for 3-5 minutes, summarise and ask for a hint**. A correct O(n²) solution with tests and an explained optimisation path usually scores higher than an unfinished O(n) solution.

### What the interviewer is assessing
Most companies grade on 4 axes:
- **Problem solving**: clarifying the prompt, finding a direction, recognising the complexity.
- **Communication**: can the interviewer follow your thinking.
- **Code quality**: variable names, structure, edge-case handling.
- **Testing**: do you check your own work before saying "done".
Fifteen minutes of silence followed by correct code still loses points on the communication axis.

### Time tactics (a 30-40 minute problem)
| Minute | What to do |
|---|---|
| 0-5 | Restate the problem, ask about constraints (how big is n, negative numbers, duplicates), work one example by hand |
| 5-10 | State the brute force and its complexity, even before writing it |
| 10-25 | Write the code (the brute force if no better direction after about 5 minutes of thinking) |
| 25-35 | Manual dry-run, edge cases, fix bugs, discuss the optimisation |

### Sentences to use when you are stuck
> "I am thinking along the lines of sorting first and then using two pointers, but that loses the original position of each element. To make sure I have something correct, I will write the two-loop O(n²) version first, then optimise it."
> "I tried sorting and I tried a sliding window, but both get blocked by needing to remember what I have already seen. Could you hint at which data structure I should be thinking about?"

The second sentence is how you **ask for a hint properly**: it shows what you already tried and where you got blocked. A hint costs far fewer points than an hour of silence.

### From brute force to the optimised version
The magic question: **"what is the inner loop searching for that I have already seen?"** If the answer is "yes", a {{HashMap}} or {{HashSet}} usually replaces that loop.
~~~java
// Brute force O(n^2): for each i, find j such that nums[i] + nums[j] == target
// Optimised O(n): remember the numbers already seen -> their index
Map<Integer, Integer> seen = new HashMap<>();
for (int i = 0; i < nums.length; i++) {
    Integer j = seen.get(target - nums[i]); // have we seen the complement yet?
    if (j != null) return new int[]{j, i};
    seen.put(nums[i], i);                   // put AFTER the check so an element never pairs with itself
}
return new int[0];
~~~

### Test before you say "done"
Dry-run a small example and state each variable value out loud. Then check the edges: empty array, one element, duplicate elements, negative numbers, {{int}} overflow (use {{long}} when accumulating). Finding your own bug is a **plus**, not a minus.

### Things to avoid
- Jumping into code before agreeing on an example and the constraints.
- Coding in long silence, or deleting everything and rewriting without explaining why.
- Arguing with the interviewer's hint or ignoring it.
- Variable names {{a}}, {{b}}, {{tmp2}}; not extracting a method when the logic gets long.
- Saying "this code works" without a single dry-run.

> Senior tip: Know the Java API you use constantly by heart so you never spend time looking it up: {{getOrDefault}}, {{merge}}, {{computeIfAbsent}} on Map; {{ArrayDeque}} as stack/queue (do not use the old {{Stack}}); {{PriorityQueue}} with a comparator; {{Arrays.sort}}, {{StringBuilder}}. Practise "thinking out loud" by recording yourself solving problems: it feels very awkward at first, and after about 10 problems it becomes a reflex.`,
    follow: [
      'If the interviewer gives you a hint and you still do not understand it, what do you say?',
      'What do you do when you discover a big bug with only 3 minutes left?',
      'The interviewer allows no IDE and the code will not be run. How do you check yourself?',
    ],
  },
  'behavioral-024': {
    q: 'The same technical question — where exactly do a mid answer and a senior/lead answer differ? How do you show "seniority" while answering, for example on "How would you cache the product catalogue?"',
    a: `**Summary:** Seniority is not about knowing more technology names, it is in the **5 layers** attached to the answer: **context and assumptions, trade-offs with a stated price, numbers, operations (metrics, alerting, incidents), and risk with the way back**. A lead adds one more layer: **impact on the team and the rollout path**.

### What the interviewer is assessing
They have heard hundreds of "use Redis, TTL 10 minutes" answers. What they are looking for is: do you **ask the right question before answering**, do you know **what is going to break**, and have you actually **operated** what you design.

### Comparing answers to the same question
**A mid answer** (correct but thin):
> "Use Spring Cache with Redis, put @Cacheable on the method that loads the product, TTL 10 minutes. On update, @CacheEvict."

**A senior answer**:
> "First I ask about the read/write ratio and how stale the data is allowed to be. Say 2,000 requests/s of reads, a few dozen edits per hour, and price allowed to be at most 30 seconds stale.
> I use cache-aside with Redis, TTL 5 minutes plus random jitter so many keys do not expire at the same instant. When a product is edited, I evict the key after the transaction commits, never before, so another request cannot reload stale data. **Price** specifically is never cached long: TTL 30 seconds, because a wrong price costs money.
> For hot keys I prevent a stampede by letting only one request repopulate on a miss. I measure hit rate, Redis latency and the miss count; a hit rate under 80% is a sign the key choice is wrong.
> If Redis dies, the service reads straight from the database but with bounded concurrency, so the database does not go down with it. The price of this whole design is that data may be tens of seconds stale, plus one more system to be on call for."

**A lead adds**: "I would ship it behind a feature flag, turn it on for 10% of traffic, and compare p99 and DB load over a week. The team has never operated Redis, so I would use a managed service and write the runbook before turning it on to 100%."

### The 5-layer seniority table
| Layer | Opening sentence that works |
|---|---|
| Context, assumptions | "First I need to know...", "Assume that..." |
| Trade-off with a price | "I choose X because..., the price is..." |
| Numbers | "At a scale of 2,000 requests/s..." |
| Operations | "I measure..., I alert when..., the runbook covers..." |
| Risk, way back | "If Y fails then...", "this decision can be reversed by..." |

One tip for leads: separate **reversible** decisions (which cache library, what TTL) from **hard-to-reverse** ones (changing the primary database, changing a published event format). Reversible ones: decide quickly and measure. Hard-to-reverse ones: need a prototype, an ADR, and a named reviewer.

### Things to avoid
- **"It depends" and stopping there**: you have to say what it depends on and what you would pick in each case.
- **Listing technology names** (Redis, Kafka, Kubernetes) like a shopping list, with no reason attached.
- **Over-engineering** to look senior: multi-region for a 200-user internal system.
- Invented numbers you cannot defend when someone asks "measured how?".
- Describing only the happy path, never what happens when a component fails.

> Senior tip: Practise by taking 10 familiar technical questions, writing your "mid" answer first, then forcing yourself to attach all 5 layers. The senior answer is usually **less than a minute longer**, because what you add is short sentences carrying information, not a lecture. Real experience lands strongest as one sentence like "last time we hit exactly this bug": it proves you have operated the system, not just read about it.`,
    follow: [
      'How do you show seniority when you have never worked on a large-scale system?',
      'When is the "simple" answer actually the most senior answer?',
      'How do you tell reversible and hard-to-reverse decisions apart in a real project?',
    ],
  },
  'behavioral-025': {
    q: '"Tell me about the hardest project you have worked on." Which project do you pick, what structure do you tell it in, and how do you prepare for the 3 layers of follow-up questions the interviewer will definitely ask?',
    a: `**Summary:** Pick a project that is **recent, where you held a central role, with real technical difficulty and a result you can put a number on**. Tell it as STAR with roughly **20% context, 60% your own actions, 20% result and lessons**. Prepare the **3 layers of depth** in advance: why you chose that approach, the detailed mechanics, and what if you did it again or at 10x the scale.

### What the interviewer is assessing
- **The hardest thing you have handled**: this is the ceiling measurement of your ability.
- **Your real role**: which part was yours, which part belonged to the team.
- **Depth**: do you understand the mechanism, or did you reuse somebody else's design.
- **Self-awareness**: looking back, do you see something you would do differently.
This question usually takes 15-20 minutes because the interviewer digs continuously; the story is your "home ground", so preparing it well is a large advantage.

### Criteria for choosing the project
| Criterion | Why |
|---|---|
| Within the last 2-3 years | Details are still clear, the technology is still current |
| You designed it or led a large part of it | You can answer every "why" |
| Real constraints: large data, zero downtime, money, deadline | Difficulty comes from constraints, not from the count of technologies |
| Numbers before/after | Evidence for the result |
| At least one mistake you then fixed | A real story always has a stumble in it |

### Sample answer (the 2-minute version)
> "The hardest project was splitting the payment flow out of a Spring Boot monolith at an e-wallet company, while the system was handling about 300 transactions per second and could not be stopped.
> I designed the split and personally built the data-consistency part. The hardest bit was writing the transaction into the database and publishing an event to Kafka without losing the event if the service died in between. I used the outbox pattern: write the event into an outbox table inside the same transaction, then a separate process reads that table and pushes it to Kafka. The consumer side processes idempotently by transaction id.
> On the first trial run, outbox lag reached 40 seconds because the table-scanning query had no suitable index. I added an index on status and time, deleted already-sent rows in batches, and lag dropped below 1 second.
> After 4 months of shifting traffic by percentage, we had 0 lost-transaction incidents, and deploying the payment flow went from 2 hours down to 15 minutes."

### Preparing the 3 layers of depth
1. **Why (the decisions)**: "Why not 2PC?", "Why not Debezium?", "Why split payment first rather than another module?"
2. **Mechanics (the detail)**: "What if the outbox reader runs as 2 instances?", "Where is the idempotency key stored, what is the unique constraint?", "Is event order guaranteed?"
3. **Retrospective, expansion**: "What would you change doing it again?", "At 10x traffic, what breaks first?", "What did the team learn?"
Write short answers for about 10 questions like these in advance. If they hit a part you did not personally build, say so honestly: "A colleague of mine did that part, I understand it at the level of..."

### Things to avoid
- Choosing a project where you only did a small piece: the second layer of depth exposes it right away.
- Using "we" for everything: the interviewer has no idea what you did.
- Spending 5 minutes on the company and product background.
- A perfect story with no mistake in it: it sounds like reading slides back.
- No numbers, or numbers you cannot say how they were measured.

> Senior tip: Write the story on paper in two versions: a 2-minute one and a 10-minute one. Ask a friend to keep asking "why?" five times on each decision; every place you hesitate is a place you need to revise. Prepare **2 projects** of different kinds (one on performance/scale, one on data consistency or a migration) so you can pick the one that matches the JD.`,
    follow: [
      'If the most interesting project of yours is under NDA, how do you tell it without leaking information?',
      'In that project, which decision did you argue about most with the team?',
      'If you started again today with Java 21 and Spring Boot 3, what would you change?',
    ],
  },
  'behavioral-026': {
    q: 'Interviewer role-play: "I am the architect. I want every new service to use event sourcing. You think that does not fit your team of 5. Persuade me right now." How do you handle this role-play?',
    a: `**Summary:** This is a test of **arguing live under pressure**, which is different from recounting a past disagreement. Follow 5 steps: **acknowledge the other side's goal → ask to understand the motive → put costs and data on the table → propose a narrow scope or an experiment → close on criteria and commit to the final decision**. Keep a calm tone while the interviewer deliberately stays hard.

### What the interviewer is assessing
- **Whether you can hold a position** when pressured (not nodding along immediately).
- **Whether you listen**, or just wait for your turn to talk.
- **What you argue with**: cost, risk, data, or personal preference.
- **Whether you know when to stop** and commit when the decision goes against you.
The interviewer usually **takes a deliberately extreme position** and pushes back 2-3 times. They do not need you to win; they are watching how you behave.

### Sample dialogue
> **You:** "I understand your goal: a complete change history for audit, and the ability to rebuild state. For a financial system that is the right goal. Let me ask: does the requirement come from audit, from a need to replay data, or from wanting one consistent architecture?"
> **Interviewer:** "All three. And I do not want each team doing its own thing."
> **You:** "I agree that we need consistency. What worries me is the cost for a team of 5: event sourcing brings event versioning, snapshots, a projection for every read screen, and handling when a projection drifts out of sync. My estimate is that each service would take roughly 30-40% more development time in the early phase, while 3 of the 4 services we are about to build are just configuration CRUD.
> Here is what I propose: use event sourcing for the **ledger**, where audit and replay genuinely pay off. The remaining services use an audit table plus an outbox to publish events, so we still have history and they still integrate. In 2 months we review the ledger's development time and its defect count and decide whether to widen it."
> **Interviewer:** "No. I still want everything on event sourcing."
> **You:** "I understand. This is your decision and I will carry it out seriously. I would like the schedule risk recorded in an ADR, and I am asking that the team get one event schema design review before we start, so we reduce that risk."

### Why this approach works
| Step | Effect |
|---|---|
| Acknowledge the goal | Lowers the other side's defences, shows you understand the problem |
| Ask about the motive | Usually reveals a real need that is narrower than the proposed solution |
| Concrete cost | Moves the discussion from "like it or not" to "worth it or not" |
| Narrow scope + experiment | Gives the other side a way out without losing face |
| Disagree and commit + ADR | Shows professionalism when you lose |

### Things to avoid
- **Agreeing immediately** out of discomfort: you lose the "has a position" credit.
- **Arguing head-to-head**, raising your voice, repeating the same argument after it was rejected.
- Arguing from preference: "I find event sourcing too complicated."
- Threatening to escalate ("I will tell the CTO") on the very first turn.
- Breaking character: "Actually, in real life I would...". Stay in role until the end.

> Senior tip: Use the **summarise the other side** sentence before you counter: "If I understand you correctly, what you need most is...". It buys you thinking time and shows the interviewer you really listened. At lead level, close with a concrete action (ADR, review, a re-evaluation date) — that shows you know how to turn disagreement into a process instead of a personal conflict.`,
    follow: [
      'If after 2 months the data proves you were wrong, what do you say to the team?',
      'When do you escalate a disagreement to a higher level instead of disagreeing and committing?',
      'What sections would your ADR for this decision contain?',
    ],
  },
  'behavioral-027': {
    q: 'A company sends a take-home: "build an ordering API with stock management, 4-6 hours". How do you choose the scope, what about the README and tests, and what does the reviewer actually look at?',
    a: `**Summary:** A take-home grades **decision-making and the quality of your everyday work**, not the number of features. Do **less but solid**: it runs with one command, the business logic is correct in the edge cases (out of stock, concurrent orders, duplicate submission), the tests mean something real, and one README explains **assumptions, trade-offs, and what you did not do**.

### What the reviewer is assessing
Reviewers usually spend 20-40 minutes on each submission, in this order:
1. **Does it run**: clone it, follow the README. If it does not run, many companies stop grading there.
2. **Business logic correct in the hard case**: what happens when two people order the last item at the same time?
3. **Readable code**: package structure, naming, error handling.
4. **Tests**: is there a test for the important logic, and does that test actually check something?
5. **README**: did you think about trade-offs.
After that there is usually a **defence session**: they ask why you did it that way, and ask you to change one thing live.

### Choosing the scope
- Ask back if the prompt is vague, or state the assumption clearly in the README.
- One Spring Boot service, PostgreSQL, running through Docker Compose. **No** microservices, Kafka, Kubernetes unless the prompt asks for them.
- Spend the time on the hardest part: decrementing stock safely when orders arrive concurrently.
~~~java
// Atomic stock decrement with one conditional UPDATE,
// instead of reading then subtracting in Java (two requests would both read 1 left)
@Modifying
@Query("update Product p set p.stock = p.stock - :qty where p.id = :id and p.stock >= :qty")
int decreaseStock(@Param("id") long id, @Param("qty") int qty);
// Returns 0 -> not enough stock -> throw OutOfStockException -> HTTP 409
~~~
- Consistent error handling: Spring Framework 6 ships {{ProblemDetail}} (the RFC 7807 standard) for error responses.
- Duplicate submission protection: an {{Idempotency-Key}} header plus a unique constraint, if there is time.

### Sample README
~~~text
## Run
docker compose up -d && ./mvnw spring-boot:run

## Assumptions
- One currency, no partial shipment, stock is per product (no warehouse).

## Design decisions
- Atomic conditional UPDATE for stock instead of pessimistic lock: simpler, no lock held across calls.

## Not done (would do with more time)
- Auth, pagination on GET /orders, outbox for order events.

## Tests
./mvnw test  (unit + Testcontainers PostgreSQL, includes a 50-thread oversell test)
~~~

### Tests worth having
- Unit tests for the pricing logic, asserting the order state.
- Integration tests with Testcontainers PostgreSQL for the main ordering flow.
- **One concurrency test**: 50 threads ordering a product that has 10 left, asserting that exactly 10 orders succeed and stock ends at 0. That test says more than any explanation.

### Things to avoid
- Over-engineering to impress: the reviewer reads it as "cannot prioritise".
- No README, or a README that is only the default template.
- A single commit "done"; a meaningful commit history is better.
- Committing an {{.env}} file with passwords, the {{target}} folder, IDE files.
- Using AI-generated code you do not understand: the defence session will expose it immediately.
- Taking three times the suggested time without saying so: writing the real time in the README is honest and is rated highly.

> Senior tip: Before submitting, clone the repo into a fresh directory and follow the README exactly like a stranger would. Many submissions are rejected just because of a missing environment variable or the wrong Java version. In the defence session, raise the weak points of your own submission ("at high traffic I would change this part") before the reviewer asks: that is a very clear senior signal.`,
    follow: [
      'If the prompt says 4 hours but you know it needs 10 to do well, what do you do?',
      'In the defence session, the reviewer asks you to add order cancellation on the spot. How do you approach it?',
      'Why did you choose a conditional UPDATE instead of optimistic locking with @Version?',
    ],
  },
  'behavioral-028': {
    q: 'The round with the engineering manager/HR in a layoff era: how do you answer "How long will you stay?", "Why does your CV show 3 companies in 4 years?", "Where else are you interviewing?", and how do you read the signals that a company is in trouble?',
    a: `**Summary:** In this round the company worries about **whether you will stay**, while you need to find out **whether the company is stable**. Answer with **a consistent reason plus evidence**, not with empty promises. At the same time, watch for the risk signals: hiring to replace someone who just left, interviews postponed again and again, a vague scope of work, a big but uncertain bonus, being pushed to accept an offer within 24 hours.

### What the interviewer is assessing
- **Early-departure risk**: hiring one senior takes months; losing them after 6 months is a heavy loss.
- **Real motivation**: did you choose them, or do you simply need any job.
- **Maturity**: how you talk about former employers and about your own decisions.

### Common questions and how to answer
**"How long will you stay?"**
> "I am looking for a place I can be at for at least 3-4 years, because the work I want to do — owning a payment system from design through to running it in production — needs that much time. At my last company I stayed 3 years and left only because the project was shut down."
Evidence (how long you were at the previous company, why you left) is more convincing than the promise "I will stay here a long time".

**"Why does your CV show 3 companies in 4 years?"**
> "The first move was from outsourcing to a product company because I wanted to operate the systems I wrote. The second time, the company cut staff after losing funding. I understand it looks like job-hopping on paper, so this time I am choosing more carefully, and that is also why I am asking about the roadmap and the team budget."
One sentence per move, neutral reasons, then show that you have learned from it.

**"Where else are you interviewing?"**
> "I am in the final round with another fintech company. I would rather not name it, but I can say that I prioritise this role because of the scope of work. If there is any deadline I need to be aware of, I will tell you early."
Be honest that other processes exist (if they really do), no need to name them, and do not invent any.

**Salary expectations**: give a range based on the market; the details are in the dedicated question about salary and offers.

### Reading the signals that a company is in trouble
| Signal | Ask further |
|---|---|
| No clear answer on new headcount versus backfill | "Has the team changed size in the last 12 months?" |
| Interview slots moved several times, "waiting for approval" | "Is the budget for this position already approved?" |
| Very broad JD: backend, DevOps, data, "wear many hats" | "What will I spend most of my time on in the first three months?" |
| Low base salary, a promised high bonus | "How many months did the bonus actually pay out over the last 2 years?" |
| Pressure to accept in 24 hours, wanting you to start before signing | "I need a written offer before I hand in my notice." |
A single signal does not prove the company has problems; several at the same time is a reason to ask more carefully and to keep other processes running in parallel.

### Things to avoid
- Promising "I will work here forever": nobody believes it.
- Sounding desperate ("I will take any salary").
- Bad-mouthing a former employer or a former manager.
- Inventing another offer to apply pressure.
- Handing in your notice at the current job on a verbal offer alone.

> Senior tip: Before this round, look at the company's LinkedIn page: is headcount growing or shrinking, have many engineers left in the last 6 months, have old job postings been refilled. If possible, message an engineer who works there now. And only ever leave your previous job after an **officially signed offer**, having checked salary, start date, probation terms and work arrangement.`,
    follow: [
      'How do you answer if asked "Have you ever been let go for performance?"',
      'The company just laid off 20% but is still hiring for your role. What do you ask in order to decide?',
      'If the manager asks your current salary directly, how do you answer?',
    ],
  },
  'behavioral-029': {
    q: 'You have 2 weeks before a Senior Java interview at a company you really want to join, and you are still working full time. How do you plan the revision?',
    a: `**Summary:** Revise **against the JD, not broadly**. On day one, turn the JD into a weighted list of topics plus your own gaps; split the middle 10 days across core technical topics, algorithms, system design and STAR stories; book **2 mock sessions** to measure yourself; the last 2 days are light review, company research and rest. Roughly 2-3 hours per workday, 5-6 hours at the weekend.

### What the company is assessing
The company grades exactly what the JD says, plus a few classics for the senior level (concurrency, transactions, system design, production incidents). Covering the 70% that matters beats skimming 100% of Java.

### Day 1: analyse the JD
Underline each skill, weight it 1-3 by how much the JD emphasises it, and rate where you are now:
| Skill in the JD | Weight | Your current level (1-5) | Priority |
|---|---|---|---|
| Spring Boot, microservices | 3 | 4 | Quick pass |
| Kafka, event processing | 3 | 2 | **Deep revision** |
| PostgreSQL, query tuning | 2 | 3 | Medium |
| AWS | 1 | 2 | Key concepts only |
High weight plus low level is where you put the most hours.

### The 14-day schedule
| Day | Main content | In parallel every day |
|---|---|---|
| 1 | JD analysis, gap list, choose the questions | |
| 2-6 | Highest-priority topics (Kafka, concurrency, transactions) | 1-2 algorithm problems, due flashcards |
| 7 | **Mock 1**: 1 hour technical + 30 minutes behavioural | Write down the weak answers |
| 8-9 | System design: 2 prompts close to the company's domain | |
| 10 | Write 6-8 STAR stories | |
| 11 | **Mock 2**, focused on the weak points from Mock 1 | |
| 12 | Company research: product, engineering blog, recent news | |
| 13 | Light note review, prepare the questions you will ask back, check equipment | |
| 14 | Rest, sleep enough | |

### The minimum STAR story set
A production incident, a technical disagreement, one failure, the hardest project, one time you led or mentored, one time you improved something on your own initiative. Each story should be usable for 2-3 different questions.

### Company research
- The product, the business model, the main customers.
- Engineering blog, conference talks, public repos: know what they use and what problems they are wrestling with.
- Recent news: funding, results, restructuring.
- The interviewers on LinkedIn: which area they work in, so you can predict the questions.

### Things to avoid
- Revising all of Java from the beginning: the 2 weeks are gone before you touch what the JD emphasises.
- Only reading, never **speaking out loud**: understanding is nothing like answering fluently.
- Skipping mocks because you feel shy: a mock is the only way to discover that you ramble or hesitate.
- Staying up late the night before: working memory drops visibly when you lack sleep.
- Ignoring behavioural questions because "being good technically is enough".

> Senior tip: Use the questions in this app's own bank: filter by the topics in the JD, answer out loud in 2 minutes before opening the reference answer, self-grade Known / Needs review. The spaced-repetition schedule brings the weak ones back exactly when they are due. If you have several interviews in the same month, repeat the JD → gaps → mock cycle for each company; the shared part (STAR, concurrency) gets stronger with every round.`,
    follow: [
      'If only 3 days are left, what do you cut?',
      'Where do you find people to mock interview with, and what criteria do you ask them to grade on?',
      'How do you balance revision with your current job without burning out?',
    ],
  },
  'behavioral-030': {
    q: 'After the interview: how do you follow up, how do you handle being rejected, how do you ask for feedback so that you get an honest answer, and what do you do when two offers have different deadlines?',
    a: `**Summary:** After an interview there are 4 jobs: **retro yourself within 1 hour**, a **short thank-you email within 24 hours**; when rejected, **reply politely and ask for feedback with one specific question**; with several offers, **align the deadlines honestly**, compare on a total package table, then negotiate with the one you want most.

### What the interviewer is assessing
This question comes up in HR rounds, or when you are asked how you manage your career. But more importantly, this is the stage where **many candidates throw away their own chances**, by staying silent too long, reacting badly to a rejection, or accepting an offer and then withdrawing.

### 1. Retro within 1 hour
Write down immediately: the questions that were asked, which answers were weak, the unexpected follow-ups, your impression of the team. After a few interviews, this list tells you exactly what to revise.

### 2. The thank-you email
Short, specific, no pleading. At foreign companies it is usually written in English:
~~~text
Hi Minh, thank you for the conversation today. I enjoyed discussing
how your team handles payment retries, especially the idempotency
design. It made me even more interested in the role.
I look forward to hearing about the next steps.
~~~
If the promised date passes with no news, follow up **once** after 3-5 working days.

### 3. Being rejected
> "Thank you for letting me know. I am disappointed but I respect the decision. If possible, could you share the one thing I should improve most, for example in the system design round? I am still very interested in the company and hope to apply again."
A question that is **specific and asks for only one thing** gets answered far more often than "could you give me some feedback". Many companies have a policy of not sharing details; do not push them. A polite reply keeps the door open: recruiters usually remember a candidate who reached the final round and contact them first when a new role opens.

### 4. Two offers, different deadlines
Example: offer A (the one you like less) is due on Friday; company B (the one you like more) still has a final round left.
- To **B**: "I have just received an offer with a Friday deadline. I prioritise the role with you — could the final round be moved up?" That is true information, and a company that wants you will usually speed up.
- To **A**: "Thank you. Could I have 3-5 more days so that I can decide properly?" A short extension is usually granted.
Compare on the total package, not just base salary:
| Criterion | Offer A | Offer B |
|---|---|---|
| Gross salary, guaranteed bonus versus uncertain bonus | | |
| Which salary base the insurance is paid on | | |
| Team stability: new headcount, approved budget | | |
| Scope of work, learning opportunities | | |
| Probation: length, % of salary, criteria | | |
| Hybrid/remote, commute time | | |
Once you have chosen, negotiate **one round** with the one you picked using the real offer, then decline the other politely and early.

### Things to avoid
- Going silent for weeks before answering an offer.
- Reacting bitterly or arguing back after a rejection.
- Inventing another offer to force the price up.
- Accepting offer A "to be safe" then withdrawing when B arrives: legal, but it costs you reputation, and the IT recruiting circle in Vietnam is quite small.
- Resigning from your current job before a formally signed offer.

> Senior tip: Keep a process tracker: company, current round, promised feedback date, contact person, offer deadline. When you interview at several places at once, try to arrange the schedule so the final rounds fall within the same 1-2 weeks; having offers arrive at the same time is the single biggest negotiation advantage, and it is completely honest.`,
    follow: [
      'Should you tell company A that you are waiting for company B to report its result?',
      'How do you handle a counter-offer from your current employer?',
      'Rejected in the final round three times in a row — how do you analyse the cause?',
    ],
  },
});
