/*
 * English translation of js/data/q-english.js — task T677. Format: js/core/i18n.js (content overlay).
 * ids: english-094 english-095 english-096 english-097 english-098 english-099 english-100 english-101 english-102
 */
App.i18n.content({
  'english-094': {
    q: 'A junior developer on your team has just caused a duplicate-payment bug in staging. Explain idempotency to them in simple English, using a banking example, and show how you would coach them.',
    a: `**Summary:** When you explain to someone new: **start in everyday life, carry one single example all the way through, and never introduce a term before the concept**. Coaching tone: describe the mechanism, then ask a question back — do not lecture one way.

### Sample answer
I would sit down with them and start away from the code.

"Imagine you order coffee and the app charges your card. The internet drops for a second. The app does not know whether the payment went through, so it tries again. Now the bank has received the same order twice. Idempotent means the second attempt does not create a second charge — the result of trying twice is the same as trying once. The word literally means: the same power, the same effect.

In our case, when the customer presses Pay, the app invents a unique number for that button press — we call it the idempotency key — and sends it with the request. Before we move any money, we look the key up in a table. Never seen: process the payment and save the result. Seen before: do not process anything; return the saved result. A unique constraint in the database is what makes that lookup race-proof, even if two copies of the same request arrive at exactly the same moment.

Here is the part people miss: GET requests are already safe to repeat, because they do not change anything — that is idempotent by design. Creating a payment is not. So the key has to represent the user action, the button press. If your retry logic generates a fresh key each time, you have built a machine for making duplicate payments, because every retry looks like a brand-new order."

Then I would ask them: "Given that, where in our code should the key be created — the app, the gateway, or the ledger service?" I would let them reason; that tells me whether they really got it.

### Term explanations (read this first so you do not stumble)
- **Idempotency key**: a unique string (usually a UUID) created by **the client side** for each *user action*; the server stores the key together with the result for a limited lifetime, for example twenty-four hours.
- Why the lookup is normally **a database unique constraint** and not "check first, then insert": two identical requests can slip between the check and the insert (that is a race); a unique constraint stops you at the storage layer, so one of the two inserts fails.
- **Idempotent by design**: GET, PUT and DELETE are safe to repeat according to HTTP semantics; POST is not — which is why a POST that creates money needs a key.
- **The key equals the unit of action**: the classic mistakes are generating a new key on every HTTP retry (it must stay fixed from the first press) or making the key only a hash of the body (then two genuinely separate but identical presses get merged into one).
- Timing: keys are usually kept for the reconciliation day, because "a retry one week later" is a new action, not the same action.

### Useful phrases
- **the result of trying twice is the same as trying once**: repeating the operation leaves the state unchanged
- **invents a unique number for that button press**: the client creates one id per press of the button
- **never seen: process it; seen before: return the saved result**: the two branches of the lookup
- **race-proof**: safe even when two identical requests land at the same instant
- **let me check whether you have got it**: turn a lecture into a coaching question

### Common mistakes Vietnamese speakers make
- "Explain about idempotency" — **explain** does not take "about": "explain idempotency".
- "It is very safe to repeat" — safe is not the same as idempotent; say "repeating it is harmless / has no extra effect".
- Talking too fast while coaching; use a pause instead: "The word literally means... — the same power, the same effect."
- "Do not make this mistake again" — that is a scolding tone; real coaching is "where in our code should the key be created?" (asking back to test understanding).

> Senior tip: In an interview, **how you explain to a junior** is graded as much as the content: an everyday example plus one question back shows that you coach rather than lecture. If it fits, own a bug in the story: "we shipped this exact bug once, and the dedup table is why it never reached production again" — that turns the concept into a real lesson. Pronunciation: **idempotent** /aɪˈdɛmpətənt/ stresses the second syllable; **button** /ˈbʌtn/.`,
    follow: [
      'Is a GET request idempotent by definition? Explain why or why not.',
      'How would you make a refund endpoint idempotent?',
      'What goes wrong if the client generates a new key for every HTTP retry?',
    ],
  },
  'english-095': {
    q: 'Walk me through your release process for a risky change to a payments service. What makes a release safe, and what happens when a deploy goes wrong?',
    a: `**Summary:** Answer along one axis: **"smaller dose + shorter time broken"** — small batches, release separated from deployment (feature flag), canary plus metrics making the decision, a rollback path that really exists, and one sentence about bank-specific process (change window, approval, post-release checks).

### Sample answer
For anything risky on a payments service, I optimise for two things: small batches and a short blast radius.

Before anything reaches production, the change passes automated tests, review, and staging with production-like data. Then we deploy with the new logic hidden behind a feature flag that starts at zero percent. Deploying and releasing are two separate moments — that is deliberate, because it means the risky part can be switched on gradually and switched off in seconds without a rollback of the code.

The flag starts with internal test accounts, then one percent of real traffic. We watch three numbers for about an hour: error rate, latency, and the specific business metric — for a transfer flow, the accepted-versus-completed ratio. If any of them breaks its band, we turn the flag off, which is the fast path back. Because the flag is a kill switch, rollback is minutes, not a redeploy.

We also care about the data side. Database changes are expand-and-contract: add the new column first, deploy code that works with both shapes, then remove the old one in a later release. That keeps every release rollback-safe even when rows changed.

In a bank there are extra guardrails: releases go through a change window, the change request records what we deploy, the risk, and the exact rollback plan, and after the release we verify with real test transactions. On the rare bad night, the call is simple: stop, turn the flag off, stabilise, and only then investigate. Fixing under pressure while money moves is how small incidents become large ones.

### Terms you need to know (explained from the ground up)
- **feature flag**: a switch that turns a feature on or off while the app is running, which separates *deploying the code* from *opening the feature*.
- **canary release**: letting a small slice of traffic through first (one percent, then five, then fifty, then one hundred) so a bug shows up in a tiny group before it reaches everybody.
- **blast radius**: how many customers are affected when a release breaks — you design so that this stays small.
- **expand-and-contract**: change the schema in two phases (add the new column and run it in parallel, then drop the old one) so old and new code can both live at the same time, which means a rollback cannot break the data.
- **change window / change request**: banks usually allow deploys only in fixed time frames and require a written ticket describing the risk and the exact rollback plan — change management driven by audit requirements.
- **kill switch**: turning a feature off immediately during an incident, without redeploying anything.

### Useful phrases
- **deploying and releasing are two separate moments**: shipping code and opening it to customers are different points in time
- **switched off in seconds without a rollback**: disabled fast, with no need to revert the code
- **the accepted-versus-completed ratio**: orders accepted versus orders actually finished
- **if any of them breaks its band, we turn the flag off**: when one metric leaves its agreed range, we disable the feature
- **stop, stabilise, then investigate**: the incident order of operations

### Common mistakes Vietnamese speakers make
- "We will deploy the code, then if have error we rollback" — the if-clause has no subject: "if there is an error, we roll back".
- Confusing **deploy** (putting the code on the server) with **release** (letting customers use it) — separating these two words in your answer is itself a maturity signal.
- "Rollback is easy" is too smooth: the interviewer wants to hear that **rollback is hard once the data has changed**, and the sample answers that up front with expand-and-contract.
- Reciting the whole pipeline in one breath (build, test, deploy...) instead of taking the *safety* angle — that drifts off the question asked.

> Senior tip: The line that earns points is "rollback is minutes, not a redeploy" — it shows you measure a process by **time to stability**, not by the number of steps. If the interview is with an organisation that has strict change management (a bank, a telco), add one sentence about the change request; it lands exactly in their language. Pronunciation: **rollback** /ˈrəʊlbæk/ stresses the first syllable; **stabilise** /ˈsteɪbəlaɪz/ (British; American spelling is stabilize).`,
    follow: [
      'How do you roll back a change that has already written new-shaped data to the database?',
      'What does your post-deploy verification look like for a payments release?',
      'How do you handle an emergency hotfix during a change freeze?',
    ],
  },
  'english-096': {
    q: 'Your release depends on an API from another team, and they have missed two commitments. How do you raise this to your product owner, and how do you talk to that team without damaging the relationship?',
    a: `**Summary:** Two sides of one problem: **with the product owner, raise the risk early with a way to unblock (mock, contract, dates); with the other team, talk engineer to engineer first — assume good intent, ask what is blocking, then lock it down in writing with a concrete date**. Escalation handles the risk, not the person.

### Sample answer
There are two conversations here, and I keep them separate.

With the other team, I start engineer to engineer, assuming good intent. I would say: "We planned around the transfers API for the fifteenth, and that has moved twice now. I understand priorities change — is something on your side blocking it? What I need to unblock is just the interface: if you can give me the contract and a stub or mock server, my team can build and test against it while you finish the real implementation. Could we agree on a date I can plan around, and write it in the ticket?" The mock request matters a lot: it turns a hard dependency into a soft one, and it is easy for them to give.

With my product owner, I raise the risk early and in business terms: "Our release is now blocked on another team's API. It has moved twice, so I would plan the date with a buffer of one week. Here is what we can do anyway: build against the mock and be ready two days after their API lands. I will update you every Friday, and I will tell you the day it gets worse, not the day it fails."

If two more dates slip, I escalate — and escalation, for me, is simply making the risk visible: a short message in the shared channel, tagging both managers, stating facts, dates, and impact, no adjectives about anyone. "The API is late twice, our release is at risk, here is what we need" — nobody can take that the wrong way. What damages relationships is blaming language, not visibility.

### Framework for handling a cross-team dependency
1. **Turn the hard dependency into a soft one**: ask for the **interface/contract plus a mock server** (a fake server that behaves exactly like the real API so you can code and test against it) — you wait less, and they feel less pressure.
2. **Lock it down in writing**: the date goes in the ticket, not only in chat — "in writing, in the ticket".
3. **Escalate the problem, not the person**: escalate *risk plus dates plus impact*, and drop adjectives about people ("they are slow" becomes "the API has moved twice").
4. **Give the product owner a way out**: early risk, a buffer, and a weekly update cadence; a PO hates being surprised more than being late.
5. **Protect the long-term relationship**: a bank is a place where you will meet the same team on the next project; winning an argument does not buy you a reliable partner.

### Useful phrases
- **assuming good intent**: I start from the assumption that they mean well
- **priorities change**: a neutral way to acknowledge that plans moved
- **what I need to unblock is just the interface**: naming the smallest thing that would free you
- **a date I can plan around**: a commitment you can actually build a plan on
- **I will tell you the day it gets worse**: I report early, not at the deadline
- **making the risk visible, not assigning blame**: the healthy definition of escalation

### Common mistakes Vietnamese speakers make
- "Team A is not responsible" — that sounds like an attack on their character; describe behaviour and numbers instead: "the date has moved twice".
- "I will complain to your boss" — wrong register; in workplace English you "raise a risk" or "escalate through the managers".
- "Please do me the API soon" — politeness in the wrong place; say "could you give me the contract by Friday?" (a clear ask plus a date).
- Staying silent, absorbing the block, and telling the product owner close to the deadline ("I did not want to bother you") — raising early is professionalism, not complaining.

> Senior tip: "I will tell you the day it gets worse, not the day it fails" is the sentence of someone who has really managed expectations; it buys more trust than any late apology. And always ask for the mock before you ask for the date — a mock is easier to agree to, and on its own it already removes half the risk. Pronunciation: **dependency** /dɪˈpɛndənsi/ stresses the second syllable; **escalate** /ˈɛskəleɪt/ stresses the first.`,
    follow: [
      'When exactly do you escalate to managers instead of solving it engineer to engineer?',
      'How do you protect your own team timeline while the other team is late?',
      'What would the written escalation message actually say?',
    ],
  },
  'english-097': {
    q: 'Describe how your service exchanges data with the core banking system or an external partner. How do you handle timeouts, retries, duplicates, and missing messages?',
    a: `**Summary:** Tell the story of **one real integration** built on the principle that the outside world is not trustworthy — every assumption can break. Four professional questions must have an answer: what if the call takes too long, is retrying safe, how do you detect duplicates, and how do you notice a message that never arrives.

### Sample answer
Our service moved settlement instructions to the core banking system through message queues rather than synchronous calls, because the core was available in defined windows and we could not afford to couple our uptime to theirs.

Outbound, we wrote a file per batch in ISO twenty-oh-two format into a queue; the core pulled it when it was ready. Inbound, results came back as per-transaction callbacks, correlated by a transaction reference we carried end to end.

Each of the four failure modes has a deliberate answer. Timeouts: we never wait forever — every call has a per-call budget, and if the partner misses it, the order simply stays pending; nothing is marked failed on a network blip, because "no answer" is not "no". Retries: with exponential backoff and a maximum number of attempts, and only on operations that are idempotent — the reference makes a re-send safe, the core deduplicates on it. Duplicates: deduplication on that reference, plus a unique database constraint — assume at-least-once delivery on both legs, because queues redeliver after consumer crashes. Missing messages: this is the sneaky one. A callback that never arrives looks identical to a slow one, so we poll the partner status API after a deadline, and nightly file-based reconciliation compares our ledger with the core statement and raises every unmatched item to the operations team.

Everything that exhausts its retries lands in a dead-letter queue with alerting, so humans see it while the amount is still small.

### The flow diagram (draw it so you can say it out loud)
~~~seq
title: Asynchronous integration with core banking
actors: Payments API | Queue | Core banking | Ops
Payments API -> Queue: Write the settlement instruction (batch)
Queue -> Core banking: Core pulls the instruction when ready
Core banking --> Payments API: Callback per instruction, matched on reference
Payments API -> Payments API: No callback seen -> call the status API
Core banking -> Queue: Instruction with a format error
Queue -> Ops: Dead-letter queue, with alerting
note Payments API..Ops: Nightly: reconcile files against the ledger
~~~

### Term explanations (read this first so you do not stumble)
- **core banking**: the central ledger system of a bank (it holds accounts and balances and runs the overnight batch); it is usually old and accepts instructions only inside defined windows — which is exactly why the integration has to be asynchronous.
- **ISO 20022**: the international standard format for payment messages (XML), replacing the older SWIFT messages; you do not need the details, only the fact that it is "the payment file standard".
- **"no answer" is not "no"**: a timeout does not prove the transaction failed — it may well have completed; so you must not mark it failed, you leave it pending and reconcile later.
- **correlation / transaction reference**: a unique id carried in both directions so a callback can be matched to the original instruction; the same value is the idempotency key for the core side.
- **at-least-once**: the default assumption that a queue can deliver twice (it redelivers after a consumer crash) — protect yourself with deduplication instead of hoping infrastructure gives you "exactly-once".
- **DLQ plus alerting**: the dead-letter queue is where messages that never get processed are parked; without alerting it quietly becomes a graveyard of instructions.

### Useful phrases
- **we could not afford to couple our uptime to theirs**: we cannot let their downtime drag us down
- **every call has a per-call budget**: each call gets its own timeout, measured in seconds
- **no answer is not a no**: silence does not mean rejection
- **the sneaky one is the missing message**: the silent failure is the hardest to notice
- **raises every unmatched item to operations**: sends each unmatched record to the ops team

### Common mistakes Vietnamese speakers make
- "If the system do not respond" — subject-verb agreement: "if it **does** not respond"; and after "if" you do not use will.
- "We wait the response for 30 minutes" — it is **wait for**; and a real timeout is seconds, not minutes, so give the number to show you have tuned it ("a five-second budget").
- Saying "we use Kafka to be reliable" — a tool does not create reliability; name the mechanisms: deduplication, retries, DLQ, reconciliation.
- Forgetting the **human** side: always finish with "then operations handle it before the customer notices" — a process only feels complete when someone runs it.

> Senior tip: The strongest sentence is admitting an operational assumption: "we assume at-least-once everywhere and make duplicates harmless" — expecting exactly-once is what people say before they have run production. If you have figures, drop one in: "reconciliation typically finds two to three exceptions a day, and the oldest open one took us eleven months to close" — it shows you know the ugly half of the system you built. Pronunciation: **queue** /kjuː/; **correlation** /ˌkɒrəˈleɪʃn/ stresses the third syllable.`,
    follow: [
      'Why should you only retry operations that are idempotent?',
      'How would you detect that the core silently lost a message that was neither delayed nor failed?',
      'What is a circuit breaker, and when can it make a bad situation worse?',
    ],
  },
  'english-098': {
    q: 'Walk me through how you would design a URL shortener in a system design interview. Speak it out loud: start with clarifying requirements, then give a rough capacity estimate, outline the high-level design, and discuss trade-offs.',
    a: `**Summary:** A model spoken answer showing how to **lead an English system design interview**: do not jump straight to drawing boxes; instead (1) clarify requirements, (2) estimate capacity out loud, (3) sketch the high-level design, (4) name the trade-offs and choose. The interviewer is grading your structured thinking, not only your knowledge.

### Sample spoken answer (150-250 words)
"Before I jump into the design, I'd like to clarify a few requirements. Are we focusing on shortening and redirecting URLs, or do we also need analytics like click counts? What is the expected scale - how many new links per day and how many redirects per second? And do short links expire?

Assuming roughly one hundred million new URLs per month and a read-to-write ratio of about one hundred to one, that gives us around forty writes per second on average, but reads could peak at roughly four thousand requests per second. Each mapping is small, say about five hundred bytes, so storage for five years is on the order of a few terabytes - very manageable.

At a high level, I'd put an API service behind a load balancer. A client posts a long URL; the service generates a short code, stores the mapping in a database, and returns it. A redirect request looks up the code and returns an HTTP 301 or 302.

The main trade-off is the short-code strategy. A hash of the URL is simple, but collisions need handling. A counter encoded in base62 avoids collisions, but it can leak ordering and needs coordination across instances. I'd go with a pre-generated key service or a database sequence with base62 encoding because it is predictable and collision-free. I'd also add a cache in front of the database since reads dominate, accepting that cache entries may be slightly stale for analytics but redirects stay correct."

### Term explanations (each spoken step, from the ground up)
- **Clarify requirements**: the very first step, and it shows you do not guess. Ask about scope (shortening only, or analytics too?), scale (new links per day, redirects per second?), and constraints (do links expire, are custom aliases allowed?).
- **Capacity estimate**: say "roughly" so you can move fast without pretending to be precise. About one hundred million new URLs per month works out to around forty writes per second on average; with a read-to-write ratio of one hundred to one, reads can peak near four thousand per second. Storage: five hundred bytes times one hundred million times twelve months times five years is roughly three terabytes.
- **High-level design**: a load balancer (it spreads incoming traffic across machines) in front of the API service, a database holding the code-to-URL mapping, and a cache such as Redis in front of the reads. A redirect answers with HTTP 301 (permanent, so the browser caches it) or 302 (temporary, which counts clicks more accurately).
- **Short-code trade-off**: hashing the URL is simple but produces **collisions** (two different URLs land on the same code), and you have to handle them; a counter encoded in base62 (digits plus a-z plus A-Z, sixty-two symbols) never collides, but it leaks the ordering of creation and needs coordination between instances.

### Answer structure (the speaking framework)
1. "Before I jump in, let me clarify..." (open)
2. "Assuming X, that gives us roughly Y..." (numbers)
3. "At a high level, I'd..." (design)
4. "The main trade-off is... I'd go with A because... accepting that..." (trade-off plus a decision)

### Useful phrases
- **Before I jump into the design, I'd like to clarify...**: open by asking, never by drawing boxes
- **Assuming roughly... that gives us around...**: state an assumption, then derive a number from it
- **on the order of a few terabytes**: a magnitude estimate, not a precise figure
- **The main trade-off is... I'd go with X because...**: name the tension, choose, and justify

### Common mistakes Vietnamese speakers make
- Jumping straight to "I will use Redis and MySQL" without asking about requirements — you lose the communication points.
- Reading numbers digit by digit: say "one hundred million per month" (natural), not "one zero zero million".
- Missing articles: "put API service behind load balancer" becomes "put **an** API service behind **a** load balancer".
- Forgetting the downside: saying only "I choose hash" without "the downside is collisions".

> Senior tip: Say the numbers and the units out loud ("forty writes per second") — it proves you think in back-of-the-envelope estimates. When asked about extreme scale, always close with "I'd start simple and evolve"; do not over-engineer from minute one.`,
    follow: [
      'How would you handle a custom short alias that a user requests but is already taken?',
      'If the system grows to ten times the traffic, what part of your design becomes the bottleneck first?',
      'Why might you choose HTTP 302 over 301 for redirects, and what is the cost of that choice?',
    ],
  },
  'english-099': {
    q: 'Explain why you chose eventual consistency for a part of your system. How would you justify that trade-off to an interviewer who pushes for strong consistency everywhere?',
    a: `**Summary:** A model spoken answer teaching how to **defend the eventual consistency trade-off** (replicas become identical again after a short delay) against strong consistency (every reader sees the same data immediately). The core move: tie the choice to a business requirement, admit the downside, and describe how you limit it.

### Sample spoken answer (150-250 words)
"I'd go with eventual consistency for the product catalog and search index because the business can tolerate a short delay, and the benefits are worth it.

By strong consistency I mean every read sees the latest write immediately. That usually requires coordination across nodes, like a distributed lock or a consensus protocol, which adds latency and reduces availability during partitions. Eventual consistency means replicas may return slightly stale data for a short window, but they converge to the same state once updates propagate.

For a catalog, if a price change shows up a few seconds later in search, that is acceptable. The checkout service, however, reads the authoritative price from the primary database at purchase time, so money is never wrong. So the trade-off is: we accept temporary staleness in read-heavy, non-critical paths to gain lower latency and higher availability.

To manage the downside, we set a clear expectation - updates may take up to five seconds to appear - and we use idempotent updates with versioning so out-of-order messages do not corrupt state. We also monitor replication lag and alert if it exceeds our threshold.

If the interviewer insists on strong consistency everywhere, I'd explain that it increases write latency and makes the system less resilient during network issues, which hurts the user experience more than a few seconds of staleness in this specific case."

### Term explanations (read this first so you do not stumble)
- **Strong consistency**: once a write commits, every reader anywhere sees the new value immediately. That needs coordination — a distributed lock or a consensus protocol such as Raft or Paxos — and the price is higher latency and less availability when the network partitions (that is the CAP theorem: you choose between consistency and availability during a partition).
- **Eventual consistency**: a replica may serve slightly out-of-date data for a short window, then it converges to the same value. Everyday example: you change your profile picture and your friends see it a few seconds later.
- **When to choose eventual**: read-heavy paths where being seconds out costs nothing (catalog, feed). **When not to**: balances, inventory deduction — use strong consistency, or read the authoritative source at the moment of the decision.
- **Limiting the damage**: idempotent updates, version numbers or timestamps so an older message that arrives late loses to the newer state, and watching replication lag (how far behind each replica is).

### Useful phrases
- **the business can tolerate a short delay**: the domain accepts seconds of staleness
- **money is never wrong**: the amount is always read from the authoritative source
- **The trade-off is: we accept X to gain Y**: name both sides explicitly instead of hedging

### Common mistakes Vietnamese speakers make
- Saying "eventual consistency is better" in general — tie it to a **specific use case** and say where it must not be used.
- Ignoring the money path: if you never say "checkout reads the authoritative source", the interviewer will push exactly there.

> Senior tip: Answer in the frame "it depends on the requirement, and here is the boundary" — draw the line between which paths are eventual and which are strong. "Money is never wrong" scores because it separates the read path from the decision path.`,
    follow: [
      'What is replication lag and how would you detect when it becomes a problem?',
      'Can you give an example where eventual consistency would be dangerous?',
      'How does the CAP theorem relate to choosing between strong and eventual consistency?',
    ],
  },
  'english-100': {
    q: 'An interviewer says "just add a cache" to fix a slow endpoint. How would you push back politely, explore the real problem, and explain the trade-offs of caching in English?',
    a: `**Summary:** A model spoken answer teaching how to **push back politely**. A cache (memory that stores results so reads are faster) is not a cure-all: find the root cause first, and if you do cache, state the trade-offs — invalidation, stale data, TTL, cache stampede.

### Sample spoken answer (150-250 words)
"That's a reasonable idea, and caching can definitely help with read latency. But before adding a cache, I'd like to understand why the endpoint is slow.

Is it slow because of an expensive database query, a missing index, too many network calls, or because we are recomputing the same result for many users? If the root cause is a bad query, adding a cache might hide the problem and make it harder to debug later. I'd first check metrics and traces to confirm the bottleneck.

If we do add a cache, there are a few trade-offs to discuss. The hardest part is cache invalidation - deciding when to evict or refresh an entry after the underlying data changes. If we get it wrong, users may see stale data. We also need to choose a TTL, a time to live, which is a balance between freshness and hit rate. Another risk is a cache stampede: when a popular key expires, many requests can hit the database at the same time.

So my suggestion would be: fix the obvious root cause first, then add a cache for the hot, read-heavy data with a clear invalidation strategy. I'd measure the improvement so we know it actually helped."

### Term explanations (read this first so you do not stumble)
- **Push back politely**: acknowledge the idea ("That's a reasonable idea"), then ask what is behind it — never reject flatly.
- **Root cause**: a cache hides the symptom instead of curing the disease (a bad query, a missing index, N-plus-one queries). Look at metrics and traces to find the bottleneck — the place where the time actually goes.
- **Cache invalidation**: when the underlying data changes, the cached entry must be deleted (evicted) or refreshed; get it wrong and users see stale data.
- **TTL (time to live)**: how long an entry is allowed to live. A short TTL means fresher data but a lower hit rate (more requests fall through to the database); a long TTL means speed but more staleness.
- **Cache stampede**: a hot key expires and many requests hit the database at the same instant. Limit it with a per-key lock (only one request rebuilds the entry) or by adding jitter so entries do not all expire together.

### Useful phrases
- **Adding a cache might hide the problem rather than fix it**: caching can mask the root cause
- **The hardest part is cache invalidation**: deciding when an entry has to be dropped or refreshed
- **fix the root cause first, then cache the hot path**: put your answer in that order

### Common mistakes Vietnamese speakers make
- Blunt pushback: "No, cache is not good" — you lose points. Use a softener: "I see the benefit, but...".
- Saying "cancel the cache" instead of "invalidate / evict / expire the cache entry".

> Senior tip: Use the frame (1) agree with the right part, (2) ask for the root cause using metrics, (3) name two or three trade-offs (invalidation, TTL, stampede), (4) measure before and after. "I'd measure the improvement" shows you decide with data.`,
    follow: [
      'How would you choose a TTL value for a cache entry?',
      'What strategies can prevent a cache stampede when a hot key expires?',
      'When is caching the wrong solution even if reads are slow?',
    ],
  },
  'english-101': {
    q: 'Explain a sequence diagram out loud to an interviewer: walk through the steps of a user login flow that involves a client, an API gateway, an auth service, and a database. Name the actors, the messages, and what happens on failure.',
    a: `**Summary:** A model spoken answer teaching how to **read a sequence diagram out loud** (a chart showing which components send which messages, in time order): name the actors, use clear verbs (sends, returns), follow the timeline, and cover the failure branch.

### Sample spoken answer (150-250 words)
"I'll walk you through the login sequence step by step. We have four actors: the client, the API gateway, the auth service, and the user database.

First, the client sends a login request with the username and password to the API gateway. The gateway forwards that request to the auth service.

Next, the auth service queries the user database to fetch the stored password hash for that username. The database returns the record. The auth service then verifies the password against the hash.

On the happy path, if the credentials are valid, the auth service generates a token, for example a JWT, and returns it to the gateway, which passes it back to the client. The client stores the token and includes it in future requests.

On the failure path, if the user is not found or the password does not match, the auth service returns an unauthorized error. Importantly, we return the same generic message in both cases so we do not reveal whether the username exists.

If the database is temporarily unavailable, the auth service returns a service-unavailable error, and the gateway may apply a short retry. I would also add a note for rate limiting at the gateway to slow down brute-force attempts."

### Sequence diagram (for practising out loud)
~~~seq
title: User login flow
actors: Client | API Gateway | Auth Service | User DB
Client -> API Gateway: POST /login (username, password)
API Gateway -> Auth Service: Forward login request
Auth Service -> User DB: Query user by username
User DB --> Auth Service: Return password hash
Auth Service -> Auth Service: Verify password against hash
Auth Service --> API Gateway: 200 OK + JWT token
API Gateway --> Client: Return token
note Auth Service..Client: Failure 401 generic; DB down 503
~~~

### Term explanations (read this first so you do not stumble)
- **Sequence diagram**: every **actor** (a participating component) is a vertical column, time runs from the top down, and each horizontal arrow is a **message**. A solid arrow is a request, a dashed arrow is the response.
- **How to narrate it**: (1) introduce the actors, (2) then "X sends Y to Z", "Z returns...", (3) split "on the happy path..." from "on the failure path...".
- **Terms**: API gateway (the front door of your system, where rate limiting lives), auth service (the component that verifies credentials), password hash (a one-way digest of the password — you store the hash, never the password itself), JWT (a signed, self-contained token that carries the claims inside it).
- **Security**: returning different messages for "user not found" and "wrong password" leaks which usernames exist (user enumeration). Always answer with one generic "invalid credentials".

### Useful phrases
- **I'll walk you through the sequence step by step**: signpost before you start speaking
- **On the happy path... / On the failure path...**: separate success from failure explicitly

### Common mistakes Vietnamese speakers make
- Narrating the diagram with repeated future forms ("the client will send...") — use the present simple: "the client sends...".
- Forgetting to name the actors first, and skipping the failure branch by describing only the happy path.

> Senior tip: Add "notes" out loud yourself: rate limiting, timeout, idempotency — that is what separates a mid answer from a senior one. Pause and ask "would you like me to go deeper into any step?" to turn a monologue into a conversation.`,
    follow: [
      'Where would you add rate limiting in this flow, and why at that point?',
      'How would the sequence change if you used refresh tokens in addition to access tokens?',
      'What would you log at each step without leaking sensitive information?',
    ],
  },
  'english-102': {
    q: 'Describe how you would do a back-of-the-envelope capacity estimation for a chat application during an interview. Speak through the numbers clearly: users, messages per second, storage, and bandwidth.',
    a: `**Summary:** A model spoken answer teaching how to do **capacity estimation (back-of-the-envelope, a quick mental calculation)** and how to read the numbers clearly in English. The target is an order of magnitude: state assumptions, calculate, then say what the result means for the design.

### Sample spoken answer (150-250 words)
"Let me do a quick back-of-the-envelope estimate. I'll state my assumptions first so we can adjust them.

Suppose we have ten million daily active users, and each user sends about twenty messages per day. That is two hundred million messages per day. Dividing by roughly eighty-six thousand seconds in a day gives around two thousand three hundred messages per second on average. Traffic is spiky, so I'd plan for a peak of about three times that, around seven thousand messages per second.

For storage, assume an average message is about three hundred bytes including metadata. Two hundred million messages per day times three hundred bytes is about sixty gigabytes per day. Over five years, that is roughly one hundred terabytes, which tells me we need sharded storage, not a single database.

For bandwidth, if seven thousand messages per second are delivered and each is about three hundred bytes, that is around two megabytes per second inbound, and potentially much higher outbound if messages fan out to group chats.

These numbers suggest: a message queue to absorb spikes, horizontally scalable storage with sharding by conversation ID, and attention to the fan-out problem for large groups."

### Term explanations (each calculation step)
- **Back-of-the-envelope**: a fast estimate you can write on the back of an envelope. It shows you can convert units and then draw an architecture conclusion from the result.
- **The formula**: users times actions per day gives the daily total; divide the daily total by 86,400 seconds and you get the average per second; multiply by a peak factor of two to five.
- **Rounding**: treat 86,400 as roughly one hundred thousand so you can do it in your head. Say "on the order of one hundred terabytes" when what you mean is a magnitude, not a figure.
- **From numbers to design**: around seven thousand messages per second at peak means a queue; roughly one hundred terabytes over five years means **sharding** (splitting rows across several databases by a key, here the conversation ID); large group chats mean heavy outbound bandwidth.
- **Terms**: DAU (daily active users), metadata (the extra data carried with each message: sender, timestamp, identifiers), sharding (partitioning storage across machines), fan-out (one message copied out to many recipients).

### Useful phrases (reading numbers and estimates aloud)
- **Let me do a quick back-of-the-envelope estimate**: I am about to calculate roughly, out loud
- **I'll state my assumptions first so we can adjust them**: make the inputs explicit so the interviewer can change them
- **Traffic is spiky, so I'd plan for a peak of about three times that**: the average is not the design point
- **on the order of one hundred terabytes**: a magnitude, stated as a magnitude

### Common mistakes Vietnamese speakers make
- Reading numbers digit by digit: "two zero zero million" is wrong; use "two hundred million". Keep the scale words straight: 1,000 is "a thousand", 1,000,000 is "a million", 1,000,000,000 is "a billion".
- Forgetting to say the assumptions. Always open with "Assuming...".
- Finishing the arithmetic without connecting it back to design — an estimate has to lead to a decision (a queue, sharding).

> Senior tip: Slow down when you read numbers and use "roughly / about / around / on the order of". A mental trick: one day is about one hundred thousand seconds. Be ready to adjust: "if it's fifty million users, we just double the numbers".`,
    follow: [
      'How would your storage estimate change if users can send images instead of just text?',
      'What is the fan-out problem in group chats and how does it affect bandwidth?',
      'If peak traffic is ten times the average, how would you absorb that spike?',
    ],
  },
});
