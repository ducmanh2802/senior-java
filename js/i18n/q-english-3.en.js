/*
 * English translation of js/data/q-english.js — task T223. Format: js/core/i18n.js (content overlay).
 * ids: english-027 english-028 english-029 english-030 english-031 english-032 english-033 english-034 english-035 english-036 english-037 english-038 english-039
 */
App.i18n.content({
  'english-027': {
    q: `How do you write and respond to code review comments politely in English?`,
    a: `**Summary:** Code review is not personal criticism — it is **improving code together**. Principles: ask instead of criticizing, explain reasons, propose rather than command, thank the reviewer. When receiving review: don’t defend, ask if unclear, acknowledge good points.

### Sample answer
**Writing comments (as reviewer):**
- Instead of: "This is wrong. Fix it." → **Say:** "I think this might have a race condition if two requests come in simultaneously. Could we use a {{ConcurrentHashMap}} or add synchronization here?"
- Instead of: "Variable name is bad." → **Say:** "Would {{paymentId}} be clearer than {{pid}}? It reads better in the logs."
- Instead of: "Why did you do it this way?" → **Say:** "I am curious about the design choice here — was there a reason to use composition over inheritance?"
- Always add: "Thanks for the PR!" or "Good catch on the edge case!"

**Responding to comments (as author):**
- Agree: "Great point. I will update to use {{ConcurrentHashMap}}."
- Disagree politely: "I considered that, but this map is only written once at startup and is read-only afterwards, so there are no concurrent writes. I'll add a comment to make that explicit. What do you think?"
- Clarify: "I am not sure I follow — could you elaborate on the race condition scenario?"
- Partial: "Good catch on the null check. I will add that. For the naming, I prefer {{pid}} because it matches the database column, but happy to change if the team has a convention."

**Useful templates:**
- "Nit: {{...}}" — minor style suggestion (non-blocking)
- "Question: {{...}}" — asking for clarification
- "Suggestion: {{...}}" — optional improvement
- "Blocking: {{...}}" — must fix before merge

### Useful phrases
- **nitpick / nit**: minor style suggestion
- **blocking comment**: mandatory fix comment
- **trade-off**: trade-off
- **elaborate**: explain in more detail
- **happy to change**: willing to change
- **thanks for catching that**: thanks for catching that

> Senior tip: Many Vietnamese engineers write comments like **"You should..."** — this sounds like an order. Use **"Could we..."**, **"Would it be better to..."**, **"Have you considered..."**. When pushing back, avoid **"I agree, but..."** — the listener only remembers the part after "but". Split into two sentences: **"That makes sense. One concern I have is..."** or **"Good point. Have we also considered...?"**. Always end with **"Thanks!"** or **"Appreciate the review!"**.`,
    follow: [
      'How do you handle a reviewer who is consistently rude or dismissive?',
      'What do you do when you strongly disagree with a senior engineer\'s comment?',
      'How do you review code in a language or framework you are not familiar with?',
    ],
  },

  'english-028': {
    q: `How do you answer when you do not know the answer to a technical question?`,
    a: `**Summary:** Don't make it up, don't stay silent. Structure: **admit you don't know → explain how you will find out → offer a temporary direction (if any) → commit to a follow-up**. This shows honesty, problem-solving thinking and responsibility.

### Sample answer
"That is a great question, and I want to be honest — I have not worked directly with {{eBPF}} in production, so I cannot give you a confident answer on the performance overhead.

Here is how I would approach it: First, I would check our internal wiki and the team's architecture decision records to see if anyone has evaluated it. Second, I would run a quick benchmark in a test environment with our workload profile. Third, I would reach out to the platform team — they have experience with {{Cilium}} which uses eBPF under the hood.

In the meantime, if we need to unblock the design discussion, I can share what I know about the setup we use today, iptables-based kube-proxy, and its trade-offs. I can have a concrete answer with data by the end of the day tomorrow. Would that work for you?"

### Useful phrases
- **that is a great question**: that is a great question
- **I want to be honest**: I want to be honest
- **I have not worked directly with**: I have not worked directly with
- **here is how I would approach it**: here is how I would approach it
- **in the meantime**: in the meantime
- **unblock the design discussion**: unblock the design discussion
- **I can have a concrete answer by**: I can have a concrete answer by

> Senior tip: The interviewer asks this to test **integrity** and **problem-solving**, not knowledge. Absolutely **do not say "I don't know" and stop**. Also don't say "I would Google it" — too lazy. List **specific steps**: which docs, who to ask, how to benchmark, when you will have results. If you have adjacent knowledge, share briefly to show you are not completely blind. **follow-up** (with hyphen) is a noun/adjective, stress the first syllable /ˈfɒləʊ ʌp/; the verb is separate **follow up** ("I will follow up tomorrow"). Don't pronounce it "fo-lo-up".`,
    follow: [
      'What if the interviewer pressures you to guess anyway?',
      'How do you handle a question about a fundamental concept you should know (e.g., "How does HashMap work?")?',
      'Have you ever pretended to know something and got caught? What did you learn?',
    ],
  },

  'english-029': {
    q: `Explain how garbage collection works in the JVM to a junior developer.`,
    a: `**Summary:** Explain using the **generational hypothesis**: young objects die early, old objects live long. Heap is split into Young (Eden + 2 Survivor) and Old. Minor GC (Young) is fast and frequent; Major/Full GC (Old) is slow and rare. G1/ZGC/Shenandoah use region-based concurrent marking to reduce pauses.

### Sample answer
Think of the heap as two generations: **Young** and **Old**. The generational hypothesis says: most objects die young, so we should collect the young generation often and the old generation rarely.

**Young Generation:** Split into Eden (where new objects are born) and two Survivor spaces (S0, S1). When Eden fills up, a **Minor GC** runs: live objects are copied to a Survivor space, dead objects are discarded. Objects that survive several Minor GCs (the tenuring threshold, at most 15) are **promoted** to the Old Generation.

**Old Generation:** Holds long-lived objects. When it fills up, the old generation has to be collected too. A **Full GC** is the worst case: it stops the application and compacts the whole heap, which can take seconds on a large heap.

**GC Algorithms:**
- **Serial/Parallel (throughput collectors):** Stop-the-world, single or multi-threaded. Good for batch, bad for low-latency.
- **CMS (Concurrent Mark Sweep):** Deprecated in Java 9 and removed in Java 14. It marked concurrently but did not compact, so the old generation fragmented over time.
- **G1 (Garbage First, default since Java 9):** Heap divided into ~2000 regions. Prioritizes regions with most garbage. Concurrent marking, stop-the-world evacuation pauses. Target pause time configurable (default 200ms).
- **ZGC / Shenandoah (low-latency, production-ready since Java 15):** They move objects concurrently using load barriers (ZGC also uses colored pointers). Pauses are typically around a millisecond, even for multi-terabyte heaps. Generational ZGC arrived in Java 21. Trade-off: more CPU and memory overhead.

**Key concepts for a junior:**
- **Allocation is fast** (a pointer bump in Eden). **Freeing dead young objects is almost free**, because a copying collector only touches the live ones.
- **Finalizers are evil** — unpredictable, delay GC. Use {{try-with-resources}} or {{Cleaner}} API.
- **Memory leak in Java** = unintentional object retention (static collections, listeners not removed, ThreadLocal). GC cannot collect reachable objects.

**Production tips:** Monitor {{GC pause time (p99)}}, {{allocation rate}}, {{promotion rate}}. A high promotion rate often means medium-lived objects are promoted too early and then die in the Old Gen; give the Young Gen more room or reduce those allocations. Use {{-Xlog:gc*}} for unified logging (Java 9+).

### Useful phrases
- **generational hypothesis**: generational hypothesis
- **pointer bump**: allocation by pointer bump (very fast)
- **promotion**: promotion (to Old Gen)
- **stop-the-world**: stop-the-world (pause all threads)
- **colored pointers**: colored pointers (ZGC)
- **allocation rate**: memory allocation rate

> Senior tip: Don't just list GC names (Serial, Parallel, CMS, G1, ZGC) and stop. Explain **why choose which for which use case**: Low-latency trading → ZGC/Shenandoah; High-throughput batch → Parallel/G1; General web app → G1 (default). Warning: with G1, **humongous objects** (≥ 50% of region size) are allocated directly into consecutive regions and cannot be moved during evacuation — many such objects cause fragmentation and can lead to Full GC; consider increasing {{-XX:G1HeapRegionSize}} or reducing large arrays/buffers. Always test with production-like data size, not just hello world.`,
    follow: [
      'How does G1 decide which regions to collect first?',
      'What is a "humongous object" in G1 and why is it problematic?',
      'When would you choose ZGC over G1, and what is the CPU cost?',
    ],
  },

  'english-030': {
    q: `Describe your role in Agile/Scrum ceremonies and how you improve the process.`,
    a: `**Summary:** Don't just list meetings. Say: **what role you play** (facilitator, contributor, challenger), **what you improve** (cut meetings, change format, add metrics), **measurable results**. A senior engineer proactively improves the process, not just complies.

### Sample answer
In my current team of eight (5 devs, 1 QA, 1 PO, 1 SM), I act as the **tech lead**. My role in each ceremony:

**Sprint Planning:** I prepare the technical breakdown *before* the meeting — each story has a design note, API contract draft, and effort estimate. During planning, I challenge scope: "This story has two independent parts; can we split so we deliver value earlier?" I also flag dependencies on other teams early. As a result, planning went down from three hours to about an hour and a half, and we commit to fewer but clearer stories.

**Daily Stand-up:** I keep it under 10 minutes by requiring updates in the format: what I did, what I will do, blockers only. If a discussion starts, I say "Let's take it offline" so the rest of the team isn't blocked.

**Sprint Review:** I demo the critical technical change, not just feature screenshots — for example, how the new caching layer reduced p99 latency by 40%. I also ask the PO: "Did the acceptance criteria capture the performance requirement?"

**Retrospective:** I propose one concrete action per retro: for example, "We will add an integration test for the external API before deployment" instead of vague "we should improve testing." We track it on the board and review next sprint.

**How I improve the process:**
- Replaced story-point estimation with **throughput (stories/week)** because points were noisy.
- Added a **tech-debt Friday** (every second Friday) to refactor critical paths rather than letting debt accumulate.
- Measured result: cycle time dropped from 8 days to 3.5 days; bug escape rate dropped from 12% to 4%.

### Useful phrases
- **tech lead**: tech lead
- **challenge scope**: challenge scope
- **flag dependencies**: flag dependencies
- **take it offline**: take it offline
- **cycle time**: cycle time (from start coding to deploy)
- **definition of ready / done**: definition of ready / done
- **tech debt Friday**: tech debt Friday

> Senior tip: The interviewer wants to hear **that you proactively improve**, not "I attend fully." Give **before/after metrics** (cycle time, bug rate, meeting hours). Don't worship Scrum — say clearly: "We dropped estimation in story points because it was noisy; we use throughput (stories/week) instead." That shows **pragmatism**.`,
    follow: [
      'How do you handle a PO who keeps adding scope mid-sprint?',
      'What would you do if the team resists a process change you propose?',
      'How do you measure whether a retrospective action item actually worked?',
    ],
  },

  'english-031': {
    q: `Tell me about a time you led a technical initiative across teams.`,
    a: `**Summary:** Leading across teams: **build consensus → design together → slice the work → track progress → communicate continuously**. You must show influence without authority, handle conflicts over priorities, and deliver results.

### Sample answer
**Context:** Our company ran three separate payment services (Vietnam, Singapore, Indonesia), each with its own reconciliation logic, acquirer adapters, and settlement flow. The same bugs had to be fixed three times, onboarding a new acquirer took six weeks per country, and each country team had almost no visibility into the other two codebases.

**Initiative:** I proposed a **Payment Platform Unification** — extract common domain (reconciliation, settlement, idempotency, webhook delivery) into a shared library, and build a **Payment Orchestrator** service that all three countries call. The orchestrator handles routing, retry, and settlement; country-specific logic stays in thin adapters.

**How I led it:**
1. **Build the coalition:** I met 1:1 with each country's tech lead and the EMs and listened to their concerns (Singapore worried about latency, Indonesia about compliance). Then I wrote a **shared vision doc** with clear success criteria: onboarding a new acquirer in under two weeks, no more duplicate bug fixes, and a single on-call rotation.
2. **Design together:** I ran a two-day design workshop, followed by an RFC. We agreed on a shared library in Java 17, gRPC between the country services and the orchestrator, and feature flags for a gradual rollout. I wrote the RFC, got about 15 comments, and revised it twice.
3. **Slice the work:** We split it into three phases — (a) shared library + contract tests, (b) orchestrator service + Vietnam migration, (c) Singapore + Indonesia migration. Each phase had clear exit criteria and a rollback plan.
4. **Governance:** We held a weekly sync with all tech leads. A Jira epic tracked migration progress, and a shared Grafana dashboard showed error rate and p99 latency. If a country team was blocked for more than a week, I escalated to the EMs with data.
5. **Communication:** We ran a demo for stakeholders every two weeks and sent a monthly update to all engineers with progress and lessons learned.

**Result:** Nine months later, all three countries had migrated. Onboarding a new acquirer dropped from six weeks to ten days. We no longer fixed the same reconciliation bug three times, and on-call was consolidated into a single rotation with shared runbooks.

**What I learned:** I'd say technical design was maybe 30% of the work; **alignment and trust were the other 70%**. If I had pushed the design without 1:1s, Singapore would have blocked. The feature flag strategy let us prove value incrementally without big-bang risk.

### Useful phrases
- **influence without authority**: getting other teams to follow a direction when you are not their manager
- **consensus building**: getting everyone to agree before the work starts
- **feature flag**: a toggle that turns a feature on or off without redeploying
- **gradual rollout**: releasing to more and more users step by step
- **rollback plan**: how to return to the previous version safely
- **big-bang risk**: the risk of switching everything over in one go

> Senior tip: Across-team initiatives usually fail because there is **no executive sponsor** or **no clear exit criteria**. Always have: (1) a sponsor at VP/CTO level, (2) success metrics with numbers, (3) a rollback plan for each phase. Don't try to "standardize everything" — let each team keep autonomy in its adapters and unify only the core domain. Pronounce **initiative** /ɪˈnɪʃətɪv/ with the stress on the second syllable (-ni-).`,
    follow: [
      'How did you handle a team that refused to migrate?',
      'What would you do differently if you had to do it again?',
      'How do you balance standardization with team autonomy?',
    ],
  },

  'english-032': {
    q: `Tell me about a project where you had measurable impact.`,
    a: `**Summary:** Tell it in this frame: **problem → my part → measured result → trade-off**. The numbers must be real, with a baseline (before and after), a time window and how it was measured; separate "I" (what you did) from "we" (what the team did), and be honest when other factors also influenced the result.

### Sample answer
Sure. Last year our checkout API had a p99 latency of about 1.8 seconds at peak, and the funnel data showed that slow checkouts lined up with abandoned carts. I owned the investigation. Profiling with JFR showed that most of the time went into three sequential calls — pricing, inventory and promotions.

I proposed running those calls in parallel with {{CompletableFuture}} on a dedicated, bounded executor, and caching promotion rules for 60 seconds, because they rarely change. I wrote the change and the load tests; a teammate handled cache invalidation on the admin side.

We rolled it out over two weeks behind a feature flag. p99 dropped to around 650 milliseconds, and checkout conversion went up by roughly 2 percent the following month. To be fair, marketing ran a campaign at the same time, so I'm confident about the latency gain but I'd only claim part of the conversion gain. The trade-off was that a promotion change could take up to a minute to show up, which the business was happy to accept.

### Useful phrases
- **I owned the investigation**: I was the main person responsible for the investigation
- **lined up with / correlated with**: coincided with, moved together with
- **We rolled it out behind a feature flag**: we released it gradually behind a toggle
- **dropped from X to Y / went up by X percent**: fell from X to Y / increased by X percent
- **To be fair, ...**: in fairness (used when you acknowledge other factors)

### Common mistakes for Vietnamese speakers
- Speaking vaguely ("I improved performance a lot") → always give the number: "from 1.8 seconds to 650 milliseconds".
- Wrong prepositions: "increase 2%" → **"increased by 2 percent"**; "reduce from 10 to 5" → **"reduced from 10 to 5"** (keep the -ed ending because it is past tense).
- Using "we" for everything → the interviewer cannot tell what you did. Use "I" for your part and "we" for the team's part.

> Senior tip: Senior interviewers often follow up with "How did you measure that?" and "What else could explain the change?". Volunteering the caveat yourself — "To be fair, marketing ran a campaign..." — makes you far more credible than showing off a big number. Prepare two or three stories with real numbers, and write down the source (which dashboard, which time window).`,
    follow: ['How did you measure the impact, and what else could explain the change?', 'What would you have done if the latency improvement had not moved the business metric?', 'What was the hardest part to get agreement on?'],
  },

  'english-033': {
    q: `How do you explain a recommendation clearly?`,
    a: `**Summary:** Give the **recommendation first** (bottom line up front), then the main reason, the cost, the alternative and the next step. Vietnamese speakers often tell a long background story before reaching the conclusion; in an English interview the listener wants to know what you recommend straight away.

### Sample answer
I put the recommendation in the first sentence, and then I support it. For example:

"My recommendation is to move PDF report generation to a background job. The main reason is that our largest reports take around 40 seconds, which is longer than the gateway timeout, so users see an error even when the report is actually generated. The cost is a few extra moving parts: a queue, a job-status endpoint, and retry handling. I think that's worth it, because export failures are our second most common support ticket. The alternative would be to raise the timeout, but that just moves the problem and ties up threads. I'd suggest we try it with our three biggest customers first and watch the export success rate."

So the order is always the same: what I recommend, why, what it costs, what the alternative is, and how we'll know it worked.

### Useful phrases
- **My recommendation is to...**: I suggest that we...
- **The main reason is that...**: the main reason is that...
- **The cost is... / The downside is...**: the price we pay is...
- **The alternative would be..., but...**: the other option would be..., but...
- **I'd suggest we start with...**: I suggest we begin with...

### Common mistakes for Vietnamese speakers
- Telling two or three minutes of background before stating the recommendation → the listener loses patience.
- Hedging too much: "Maybe we can possibly consider..." → it sounds unsure. Say it directly: **"I recommend..."**, "I'd suggest...".
- Starting every sentence with "I think". Once, for the personal opinion, is enough.

> Senior tip: When the listener is a manager, tie each reason to a business number (ticket count, error rate, cost). Finish with a **success criterion** ("watch the export success rate") — that signals you think like an owner, not just someone who writes code.`,
    follow: ['What would you do if your manager chose the alternative instead?', 'How do you present a recommendation when you are not fully sure?', 'How do you adapt the explanation for an engineer versus a business stakeholder?'],
  },

  'english-034': {
    q: `When would you choose synchronous or asynchronous processing?`,
    a: `**Summary:** Go synchronous when the caller **needs the result immediately** in order to continue; go asynchronous when the work **can be done later**. Async decouples services and absorbs traffic peaks, but it brings operational costs: at-least-once delivery, idempotency, a dead-letter queue, consumer-lag monitoring and eventual consistency.

### Sample answer
I start from what the caller actually needs. If the user can't continue without the result — for example, checking whether a payment was authorized — I keep it synchronous. But I protect that call with a tight timeout, a small retry budget and a circuit breaker, so one slow dependency doesn't drag down the whole request.

If the work can wait — sending the receipt email, updating the search index, generating a report — I move it to a queue like Kafka or SQS. That decouples the services and smooths out traffic spikes, but it isn't free. Most setups give you at-least-once delivery, so consumers have to be idempotent; I usually store the processed message ID or use a unique key in the database. You also need a dead-letter queue, alerts on consumer lag, and a way for the user to see that something is still pending.

One more thing: if I publish an event after a database write, I use the transactional outbox pattern, so we don't lose the event if the service crashes between the commit and the publish.

So my rule of thumb is: synchronous for what the user is waiting on, asynchronous for the rest — as long as the team is ready to operate it.

### Useful phrases
- **I start from what the caller actually needs**: I start from what the caller really needs
- **drag down / take down**: slow down / bring down
- **it isn't free**: it is not free; there is a price to pay
- **smooth out traffic spikes**: flatten the load peaks
- **rule of thumb**: a practical rule based on experience

### Pronunciation
- **asynchronous** /eɪˈsɪŋkrənəs/: stress the second syllable, "SYN".
- **queue** /kjuː/: pronounced like the letter "Q", not "kway-oh".
- **idempotent** /ˌaɪdəmˈpoʊtənt/ (common in the US) or /ɪˈdempətənt/.

> Senior tip: Virtual threads (Java 21) make synchronous calls cheaper in terms of thread resources, but they do **not** solve the coupling problem: if service B is down, the request still fails. Don't choose async just because "it is faster" — choose it because the work really can be done later and the team is able to operate the queue.`,
    follow: ['How do you make a Kafka consumer idempotent?', 'How do you show the user the status of an asynchronous job?', 'What problem does the transactional outbox pattern solve?'],
  },

  'english-035': {
    q: `How do you structure an answer when you need a moment?`,
    a: `**Summary:** Pausing for three to five seconds is normal. Use one natural "buying time" sentence, state the **structure of your answer** up front (for example "two angles"), then answer each part and stop once you have covered them. A short silence is far better than a long chain of "um... uh...".

### Sample answer
If the question is complex, I'm comfortable taking a short pause. I'll say something like, "That's a good question — let me think about it for a second." Then I give a structure before the details, because that helps me and the interviewer.

For example, if someone asks, "How would you split a monolithic database?", I might say: "Let me look at it from two angles: first, how to find the boundaries, and second, how to migrate the data safely without downtime." Then I go through each part and stop when I've covered both.

If I lose my train of thought, I just say, "Sorry, let me go back to the main point," and continue. I'd rather have a three-second pause than fill the silence with "um" and "uh".

### Useful phrases
- **Let me think about that for a second.**: give me a moment to think
- **Let me look at it from two angles.**: I will look at it from two angles
- **There are three things I'd consider.**: there are three things I would consider
- **Let me go back to the main point.**: let me return to the main point
- **lose my train of thought**: forget what I was in the middle of saying

### Common mistakes for Vietnamese speakers
- Filling the silence with Vietnamese filler sounds or a stream of "um" and "uh".
- Saying **"Wait."** or "Wait a minute." → it sounds blunt, almost like an order. Use **"Give me a second"** or **"Let me think"**.
- Promising "three points" but only making two → count them on your fingers as you speak.

> Senior tip: Use the "buying time" sentence **once** per question; repeating it sounds evasive. Practice with a timer: set the frame in the first 10 seconds, then spend 30–45 seconds on each point. For a big system-design question you can ask for more time: "Could I take a minute to sketch my thoughts?" — that is perfectly acceptable.`,
    follow: ['What do you do if you completely blank on a question?', 'How long is too long for a pause in an interview?', 'How do you get back on track after going off topic?'],
  },

  'english-036': {
    q: `How do you keep a technical explanation easy to follow?`,
    a: `**Summary:** Three habits: **state the conclusion first**, explain the mechanism in **numbered steps** (first, then, finally), and **check in with the listener** using a natural question instead of "Do you understand?". Stay at one level of detail; don't jump back and forth between the big picture and code-level detail.

### Sample answer
I try to keep three habits. First, I give the short version up front. Second, I walk through the mechanism step by step. And third, I check in with the listener before going deeper.

For example, if I'm explaining our product cache, I'd say: "The short version is: we put Redis in front of the product service, and it cut database reads by about 80 percent. Here's how it works. First, the service checks Redis. If the product is there — that's a cache hit — we return it in about a millisecond. If it isn't, we read it from Postgres, store it in Redis with a ten-minute TTL, and return it. The tricky part is freshness: when a price changes, we delete the key, so the next read loads the new value."

Then I ask, "Does that level of detail work, or should I go deeper into how we handle invalidation?" That way the interviewer decides where to zoom in.

### Useful phrases
- **The short version is...**: in short...
- **Here's how it works.**: this is how it works
- **The tricky part is...**: the hard part is...
- **Does that make sense so far?**: is that clear at this point?
- **Should I go deeper into...?**: would you like me to go deeper into...?

### Common mistakes for Vietnamese speakers
- Asking **"Do you understand?"** → it sounds like you are testing the listener and can come across as rude. Use "Does that make sense?" or "Is that clear so far?".
- Stacking many terms in one sentence ("we use write-behind cache-aside with TTL-based eviction").
- No linking words → the listener loses track of which step you are on. Use "First... Then... Finally...".

> Senior tip: One concrete number ("about 80 percent", "about a millisecond") helps the listener picture things better than any adjective ("very fast", "much better"). With a technical interviewer, "The tricky part is..." is where you score points: it shows you understand the pitfalls, not just the happy path.`,
    follow: ['How would you explain the same cache to a product manager?', 'What happens if the cache delete fails after the price update?', 'How do you know when you are going into too much detail?'],
  },

  'english-037': {
    q: `What would you say if you did not hear a question?`,
    a: `**Summary:** Say plainly that you did not hear clearly, ask them to repeat **just the part you missed**, or **paraphrase** what you did hear to confirm it. Never guess and answer the wrong question — that costs far more points than asking once.

### Sample answer
It depends on what I missed. If the connection drops, I just say so: "Sorry, you cut out for a second — could you repeat the last part of the question?"

If I caught most of it, I paraphrase it to confirm: "I think I got most of that. Are you asking how I'd handle duplicate messages after a consumer restarts?" That's quicker than asking them to repeat everything, and it shows I was listening.

If it's just one word, I ask about that word: "Sorry, I didn't quite catch the last word — did you say 'rebalance'?"

And if the audio keeps breaking up, I suggest a fix rather than struggling through it: "The audio is a bit choppy on my side. Would it help if I turned off my video?"

### Useful phrases
- **You cut out / You broke up for a second.**: your audio dropped for a moment
- **I didn't quite catch that.**: I did not hear that clearly
- **Could you repeat the last part?**: could you say the last part again?
- **Are you asking...?**: do you mean...?
- **The audio is a bit choppy.**: the sound keeps breaking up

### Common mistakes for Vietnamese speakers
- Saying **"What?"** or "Huh?" → rude. "Pardon?" is correct but rather formal; "Sorry?" sounds more natural.
- **"Can you repeat again?"** → redundant (repeat already means "again"). Say **"Could you repeat that?"** or **"Could you say that again?"**.
- Being too shy to ask, guessing instead, and then answering the wrong question.

> Senior tip: Before an online interview, check your headset, microphone and network; a wired headset is safest. Asking once is completely normal — native speakers do it too. If you have to keep asking, propose a fix (turn off the video, call back) instead of trying to guess.`,
    follow: ['What if you still do not understand after they repeat the question?', 'How do you handle an interviewer with a strong accent?', 'How do you confirm a long, multi-part question?'],
  },

  'english-038': {
    q: `How do you respond about a technology you have not used?`,
    a: `**Summary:** Answer honestly in the first sentence ("Not in production"), move to the **closest experience** you do have, briefly say how you **understand the concept**, then describe **how you would learn it** (docs, a small proof of concept, the risks to watch). Don't make things up, and don't just say "I don't know" and stop.

### Sample answer
*Interviewer: "Have you worked with Kubernetes operators?"*

"Not in production, no. I've deployed our services to Kubernetes with Helm charts and set up readiness and liveness probes, but I haven't written an operator myself.

From what I understand, an operator is a controller that watches a custom resource and keeps reconciling the actual state of the cluster toward the desired state — similar in spirit to how the Deployment controller manages ReplicaSets.

If I needed to build one, I'd start with the official docs and the Java Operator SDK, build a small proof of concept for one resource, and pay close attention to how it behaves when reconciliation fails halfway. I'd expect to be productive within a couple of weeks, and I'd ask someone who's run operators in production to review the design."

### Useful phrases
- **Not in production, no.**: I have not used it in production
- **The closest thing I've done is...**: the nearest thing I have done is...
- **From what I understand, ...**: as far as I understand...
- **The way I'd get up to speed is...**: the way I would get up to speed is...
- **similar in spirit to...**: the same idea as...

### Common mistakes for Vietnamese speakers
- "I don't know." and then silence → you lose the chance to show how you think.
- Inventing experience → two follow-up questions expose it and you lose all credibility.
- A vague "I can learn anything quickly" → no evidence. Give a **concrete learning plan**.

> Senior tip: A senior engineer does not need to know every technology, but must show how they **assess the risk** of adopting something new: "what happens when it fails", "who will operate it", "how do we roll back". "From what I understand..." is both honest and an invitation for the interviewer to correct you if you got something wrong.`,
    follow: ['How would you decide whether the team should adopt this technology?', 'Tell me about a time you had to learn a new technology quickly.', 'What are the risks of introducing a technology nobody on the team knows?'],
  },

  'english-039': {
    q: `What if you realize you misstated a technical detail?`,
    a: `**Summary:** Correct it **the moment you notice** — briefly, without over-apologizing: say what you said, what is actually true, and whether your conclusion changes. Correcting yourself is a good signal of honesty and depth of understanding.

### Sample answer
I correct it as soon as I notice — briefly, and without making a big deal of it. For example:

"Sorry, let me correct something I said earlier. I said Kafka gives us exactly-once delivery by default — that's not accurate. On the consumer side, the default is effectively at-least-once: if a consumer crashes after processing a message but before committing the offset, it will get that message again. Kafka does support exactly-once semantics with idempotent producers and transactions, but that only covers reads and writes inside Kafka. Once the consumer writes to an external database, we still need idempotent processing.

The good news is that it doesn't change my design, because the consumer already uses an idempotency key — but I wanted to be precise."

### Useful phrases
- **Let me correct something I said earlier.**: let me take back one thing I said
- **What I meant was...**: I meant...
- **To be precise, ...**: to be precise...
- **That doesn't change my conclusion, because...**: that does not change my conclusion because...
- **That changes things a bit — ...**: that changes things a little...

### Common mistakes for Vietnamese speakers
- Ignoring it and hoping the interviewer did not notice → if they did, you lose twice as many points.
- Over-apologizing: "I'm so sorry, I'm very bad at this" → it lowers your credibility. A single **"Sorry"** is enough.
- Correcting the detail but not saying whether the conclusion changes → the listener has to guess.

> Senior tip: The Kafka example above comes up a lot: since Kafka 3.0 the producer enables idempotence by default (it prevents duplicates caused by producer retries), but that does **not** stop the consumer from receiving duplicates. Knowing the easily-confused details like this lets you correct yourself in time and earn "deep understanding" points.`,
    follow: ['How does Kafka achieve exactly-once semantics inside a stream processing pipeline?', 'Tell me about a time you were wrong about a technical decision.', 'How do you handle it when a colleague misstates something in a meeting?'],
  },

});
