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
    a: `**Summary:** Leading across teams means: **build consensus → design together → slice the work → track progress → communicate continuously**. Show influence without authority (getting people to move without being their manager), how you handled conflicting priorities, and the delivered outcome.

### Sample answer
**Context:** Our company ran three separate payment services (Vietnam, Singapore, Indonesia), each with its own reconciliation logic (matching internal records with the payment provider's records), acquirer adapters (code that talks to different payment processors), and settlement flow (the process of moving the actual money). The same bugs had to be fixed three times, onboarding a new acquirer took six weeks per country, and each country team had almost no visibility into the other two codebases.

**Initiative:** I proposed a **Payment Platform Unification** — extract common domain (reconciliation, settlement, idempotency, webhook delivery) into a shared library, and build a **Payment Orchestrator** service (a central service that coordinates the steps) that all three countries call. The orchestrator handles routing, retry, and settlement; country-specific logic stays in thin adapters.

**How I led it:**
1. **Build the coalition:** I met 1:1 with each country's tech lead and the EMs and listened to their concerns (Singapore worried about latency, Indonesia about compliance). Then I wrote a **shared vision doc** with clear success criteria: onboarding a new acquirer in under two weeks, no more duplicate bug fixes, and a single on-call rotation.
2. **Design together:** I ran a two-day design workshop, followed by an RFC (Request for Comments, a written design proposal the team reviews). We agreed on a shared library in Java 17, gRPC between the country services and the orchestrator, and feature flags (switches that let us turn features on/off without deploying) for a gradual rollout. I wrote the RFC, got about 15 comments, and revised it twice.
3. **Slice the work:** We split it into three phases — (a) shared library + contract tests, (b) orchestrator service + Vietnam migration, (c) Singapore + Indonesia migration. Each phase had clear exit criteria and a rollback plan.
4. **Governance:** We held a weekly sync with all tech leads. A Jira epic tracked migration progress, and a shared Grafana dashboard showed error rate and p99 latency. If a country team was blocked for more than a week, I escalated to the EMs with data.
5. **Communication:** We ran a demo for stakeholders every two weeks and sent a monthly update to all engineers with progress and lessons learned.

**Result:** Nine months later, all three countries had migrated. Onboarding a new acquirer dropped from six weeks to ten days. We no longer fixed the same reconciliation bug three times, and on-call was consolidated into a single rotation with shared runbooks.

**What I learned:** I'd say technical design was maybe 30% of the work; **alignment and trust were the other 70%**. If I had pushed the design without 1:1s, Singapore would have blocked. The feature flag strategy let us prove value incrementally without big-bang risk (the risk of changing everything at once).

### Useful phrases
- **influence without authority**: getting people to act without being their manager
- **consensus building**: getting stakeholders to agree
- **feature flag**: a switch to enable/disable a feature without deploying
- **gradual rollout**: releasing changes step by step
- **rollback plan**: a plan to safely revert if things go wrong
- **big-bang risk**: the risk of changing everything in one release

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through STAR in order. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence about what you learned, because interviewers listen for growth. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for Vietnamese speakers
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: Cross-team initiatives often fail because there is **no executive sponsor** (a senior leader who backs it) or **no clear exit criteria**. Always have: (1) a sponsor from VP/CTO level, (2) success metrics with numbers, (3) a rollback plan for each phase. Do not try to "standardize everything" — let each team keep autonomy in adapters, and only standardize the core domain. Pronounce **initiative** /ɪˈnɪʃətɪv/ with stress on the second syllable (-ni-).`,
    follow: [
      'How did you handle a team that refused to migrate?',
      'What would you do differently if you had to do it again?',
      'How do you balance standardization with team autonomy?',
    ],
  },
  'english-035': {
    q: `How do you structure an answer when you need a moment?`,
    a: `**Summary:** A 3–5 second pause is normal. Use one natural "buy time" phrase, state your **answer structure** first (for example "two angles"), then answer each part and stop when you are done. A short silence is far better than stretching out "uhm...".

### Sample answer
If the question is complex, I'm comfortable taking a short pause. I'll say something like, "That's a good question — let me think about it for a second." Then I give a structure before the details, because that helps me and the interviewer.

For example, if someone asks, "How would you split a monolithic database?", I might say: "Let me look at it from two angles: first, how to find the boundaries, and second, how to migrate the data safely without downtime." Then I go through each part and stop when I've covered both.

If I lose my train of thought (forget what I was about to say), I just say, "Sorry, let me go back to the main point," and continue. I'd rather have a three-second pause than fill the silence with "um" and "uh".

### Useful phrases
- **Let me think about that for a second.**: a polite way to pause
- **Let me look at it from two angles.**: signals a clear structure
- **There are three things I'd consider.**: sets expectations for the listener
- **Let me go back to the main point.**: recovers after going off track
- **lose my train of thought**: forget the idea you were explaining

### Common mistakes for Vietnamese speakers
- Filling silence with "uhm" repeatedly.
- Saying "Wait." or "Wait a minute." → sounds abrupt, like giving an order. Use **"Give me a second"** or **"Let me think"**.
- Promising "three points" but only giving two → count on your fingers while speaking if it helps.

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through STAR in order. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence about what you learned, because interviewers listen for growth. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for Vietnamese speakers
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: Use the "buy time" phrase only **once per question**; repeating it sounds evasive. Practice with a timer: state your structure in the first 10 seconds, then spend about 30–45 seconds per point. For a large system design question, it is perfectly acceptable to ask: "Could I take a minute to sketch my thoughts?"`,
    follow: [
      'What do you do if you completely blank on a question?',
      'How long is too long for a pause in an interview?',
      'How do you get back on track after going off topic?',
    ],
  },

  'english-036': {
    q: `How do you keep a technical explanation easy to follow?`,
    a: `**Summary:** Three habits: **lead with the conclusion**, explain the mechanism in **numbered steps** (first, then, finally), and **check in with the listener** using natural questions instead of "Do you understand?". Stay at one level of detail; do not jump back and forth between high-level overview and code details.

### Sample answer
I try to keep three habits. First, I give the short version up front. Second, I walk through the mechanism step by step. And third, I check in with the listener before going deeper.

For example, if I'm explaining our product cache (a fast temporary store that avoids hitting the database every time), I'd say: "The short version is: we put Redis (an in-memory data store, meaning it keeps data in RAM for very fast reads) in front of the product service, and it cut database reads by about 80 percent. Here's how it works. First, the service checks Redis. If the product is there — that's a cache hit (the data was found in cache) — we return it in about a millisecond. If it isn't, we read it from Postgres (our relational database), store it in Redis with a ten-minute TTL (time to live, meaning the cached entry expires after 10 minutes), and return it. The tricky part is freshness: when a price changes, we delete the key, so the next read loads the new value."

Then I ask, "Does that level of detail work, or should I go deeper into how we handle invalidation (removing or updating stale cache entries)?" That way the interviewer decides where to zoom in.

### Useful phrases
- **The short version is...**: gives the conclusion up front
- **Here's how it works.**: signals a step-by-step explanation
- **The tricky part is...**: highlights the pitfall or hard part
- **Does that make sense so far?**: a polite check-in
- **Should I go deeper into...?**: lets the listener choose the depth

### Common mistakes for Vietnamese speakers
- Asking **"Do you understand?"** → can sound like you are testing the listener and may feel rude. Use "Does that make sense?" or "Is that clear so far?".
- Packing many technical terms into one sentence ("we use write-behind cache-aside with TTL-based eviction").
- Skipping connectors → the listener cannot tell which step you are on. Use "First... Then... Finally...".

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through STAR in order. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence about what you learned, because interviewers listen for growth. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for Vietnamese speakers
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: A specific number ("about 80 percent", "about a millisecond") helps the listener picture the impact far better than adjectives ("very fast", "much better"). With a technical interviewer, the phrase "The tricky part is..." is where you earn points: it shows you understand pitfalls, not just the happy path.`,
    follow: [
      'How would you explain the same cache to a product manager?',
      'What happens if the cache delete fails after the price update?',
      'How do you know when you are going into too much detail?',
    ],
  },


  'english-032': {
    q: `Tell me about a project where you had measurable impact.`,
    a: `**Summary:** Tell it as **problem → my contribution → measurable result → trade-off**. The numbers must be real, with a baseline (before/after), a time window, and how you measured. Separate "I" (what you did) from "we" (what the team did), and be honest if other factors also affected the result.

### Sample answer
Sure. Last year our checkout API had a p99 latency (the response time slower than 99% of requests — a common way to measure "worst typical" performance) of about 1.8 seconds at peak, and the funnel data (the steps users take before buying) showed that slow checkouts lined up with abandoned carts. I owned the investigation. Profiling with JFR (Java Flight Recorder, a built-in Java tool that records what the JVM is doing) showed that most of the time went into three sequential calls — pricing, inventory and promotions.

I proposed running those calls in parallel with {{CompletableFuture}} on a dedicated, bounded executor (a fixed-size pool of threads so we do not overload the system), and caching promotion rules for 60 seconds, because they rarely change. I wrote the change and the load tests; a teammate handled cache invalidation (clearing stale cached data) on the admin side.

We rolled it out over two weeks behind a feature flag (a switch to turn the change on/off without redeploying). p99 dropped to around 650 milliseconds, and checkout conversion went up by roughly 2 percent the following month. To be fair, marketing ran a campaign at the same time, so I'm confident about the latency gain but I'd only claim part of the conversion gain. The trade-off was that a promotion change could take up to a minute to show up, which the business was happy to accept.

### Useful phrases
- **I owned the investigation**: I was responsible for the investigation
- **lined up with / correlated with**: happened at the same time as / was related to
- **We rolled it out behind a feature flag**: we released it gradually using a feature flag
- **dropped from X to Y / went up by X percent**: decreased from X to Y / increased by X percent
- **To be fair, ...**: acknowledging another factor honestly

### Common mistakes for Vietnamese speakers
- Saying "I improved performance a lot" without numbers → always give concrete numbers: "from 1.8 seconds to 650 milliseconds".
- Wrong prepositions: "increase 2%" → **"increased by 2 percent"**; "reduce from 10 to 5" → **"reduced from 10 to 5"** (use -ed for past results).
- Using "we" for everything → the interviewer cannot tell what you did. Use "I" for your own work, "we" for team work.

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through STAR in order. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence about what you learned, because interviewers listen for growth. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for Vietnamese speakers
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: Senior interviewers often follow up with "How did you measure that?" and "What else could explain the change?". Saying upfront "To be fair, marketing ran a campaign..." makes you far more credible than claiming a big number. Prepare 2–3 stories with real numbers and note the source (which dashboard, which time window).`,
    follow: [
      'How did you measure the impact, and what else could explain the change?',
      'What would you have done if the latency improvement had not moved the business metric?',
      'What was the hardest part to get agreement on?',
    ],
  },

  'english-033': {
    q: `How do you explain a recommendation clearly?`,
    a: `**Summary:** Lead with the **recommendation first** (bottom line up front), then give the main reasons, the cost, the alternative, and the next step. Vietnamese speakers often give long context before the conclusion; in an English interview, the listener wants to know your recommendation right away.

### Sample answer
I put the recommendation in the first sentence, and then I support it. For example:

"My recommendation is to move PDF report generation to a background job (work that runs after the request returns, not while the user waits). The main reason is that our largest reports take around 40 seconds, which is longer than the gateway timeout (the maximum time the gateway will wait before giving up), so users see an error even when the report is actually generated. The cost is a few extra moving parts: a queue (a buffer where jobs wait to be processed), a job-status endpoint, and retry handling. I think that's worth it, because export failures are our second most common support ticket. The alternative would be to raise the timeout, but that just moves the problem and ties up threads (keeps server threads busy doing nothing). I'd suggest we try it with our three biggest customers first and watch the export success rate."

So the order is always the same: what I recommend, why, what it costs, what the alternative is, and how we'll know it worked.

### Useful phrases
- **My recommendation is to...**: states your recommendation clearly
- **The main reason is that...**: gives the key reason
- **The cost is... / The downside is...**: names the trade-off
- **The alternative would be..., but...**: shows you considered other options
- **I'd suggest we start with...**: proposes a safe first step

### Common mistakes for Vietnamese speakers
- Giving 2–3 minutes of context before the recommendation → the listener loses patience.
- Hedging too much: "Maybe we can possibly consider..." → sounds unsure. Be direct: **"I recommend..."**, "I'd suggest...".
- Starting every sentence with "I think". Use it once for a personal opinion; that is enough.

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through STAR in order. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence about what you learned, because interviewers listen for growth. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for Vietnamese speakers
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: When the listener is a manager, tie each reason to a business number (ticket count, error rate, cost). End with a **success metric** ("watch the export success rate") — that signals you think like an owner, not just a coder.`,
    follow: [
      'What would you do if your manager chose the alternative instead?',
      'How do you present a recommendation when you are not fully sure?',
      'How do you adapt the explanation for an engineer versus a business stakeholder?',
    ],
  },


  'english-034': {
    q: `When would you choose synchronous or asynchronous processing?`,
    a: `**Summary:** Synchronous (sync, the caller waits for the result before continuing) when the caller **needs the result right now**. Asynchronous (async, the caller continues and the work finishes later) when the work can **happen later**. Async decouples services and absorbs traffic spikes, but it adds operational cost: at-least-once delivery (a message may be delivered more than once), idempotency (handling duplicates safely), dead-letter queue (a place to park messages that keep failing), consumer lag monitoring, and eventual consistency (data becomes consistent after a delay, not immediately).

### Sample answer
I start from what the caller actually needs. If the user can't continue without the result — for example, checking whether a payment was authorized — I keep it synchronous. But I protect that call with a tight timeout (a limit on how long we wait), a small retry budget and a circuit breaker (a mechanism that stops calling a failing dependency to prevent cascading failures), so one slow dependency doesn't drag down the whole request.

If the work can wait — sending the receipt email, updating the search index, generating a report — I move it to a queue like Kafka (a distributed event streaming platform) or SQS (Amazon's managed message queue). That decouples the services and smooths out traffic spikes, but it isn't free. Most setups give you at-least-once delivery, so consumers (services that read messages) have to be idempotent; I usually store the processed message ID or use a unique key in the database. You also need a dead-letter queue, alerts on consumer lag (how far behind the consumer is), and a way for the user to see that something is still pending.

One more thing: if I publish an event after a database write, I use the transactional outbox pattern (write the event to an "outbox" table in the same database transaction, then publish it separately), so we don't lose the event if the service crashes between the commit and the publish.

So my rule of thumb is: synchronous for what the user is waiting on, asynchronous for the rest — as long as the team is ready to operate it.

### Useful phrases
- **I start from what the caller actually needs**: focus on the real requirement
- **drag down / take down**: slow down or crash
- **it isn't free**: it has a cost
- **smooth out traffic spikes**: handle sudden bursts of traffic more evenly
- **rule of thumb**: a practical guideline based on experience

### Pronunciation
- **asynchronous** /eɪˈsɪŋkrənəs/: stress the second syllable "SYN".
- **queue** /kjuː/: sounds like the letter "Q".
- **idempotent** /ˌaɪdəmˈpoʊtənt/ (common in US English) or /ɪˈdempətənt/.

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through STAR in order. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence about what you learned, because interviewers listen for growth. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for Vietnamese speakers
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: Virtual threads (Java 21) make synchronous calls cheaper in terms of thread resources, but they do **not** solve coupling: if service B is down, the request still fails. Do not choose async just because "it is faster" — choose it because the work can truly happen later and the team is ready to operate a queue.`,
    follow: [
      'How do you make a Kafka consumer idempotent?',
      'How do you show the user the status of an asynchronous job?',
      'What problem does the transactional outbox pattern solve?',
    ],
  },


  'english-035': {
    q: `How do you structure an answer when you need a moment?`,
    a: `**Summary:** A 3–5 second pause is normal. Use one natural "buy time" phrase, state your **answer structure** first (for example "two angles"), then answer each part and stop when you are done. A short silence is far better than stretching out "uhm...".

### Sample answer
If the question is complex, I'm comfortable taking a short pause. I'll say something like, "That's a good question — let me think about it for a second." Then I give a structure before the details, because that helps me and the interviewer.

For example, if someone asks, "How would you split a monolithic database?", I might say: "Let me look at it from two angles: first, how to find the boundaries, and second, how to migrate the data safely without downtime." Then I go through each part and stop when I've covered both.

If I lose my train of thought (forget what I was about to say), I just say, "Sorry, let me go back to the main point," and continue. I'd rather have a three-second pause than fill the silence with "um" and "uh".

### Useful phrases
- **Let me think about that for a second.**: a polite way to pause
- **Let me look at it from two angles.**: signals a clear structure
- **There are three things I'd consider.**: sets expectations for the listener
- **Let me go back to the main point.**: recovers after going off track
- **lose my train of thought**: forget the idea you were explaining

### Common mistakes for Vietnamese speakers
- Filling silence with "uhm" repeatedly.
- Saying "Wait." or "Wait a minute." → sounds abrupt, like giving an order. Use **"Give me a second"** or **"Let me think"**.
- Promising "three points" but only giving two → count on your fingers while speaking if it helps.

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through STAR in order. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence about what you learned, because interviewers listen for growth. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for Vietnamese speakers
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: Use the "buy time" phrase only **once per question**; repeating it sounds evasive. Practice with a timer: state your structure in the first 10 seconds, then spend about 30–45 seconds per point. For a large system design question, it is perfectly acceptable to ask: "Could I take a minute to sketch my thoughts?"`,
    follow: [
      'What do you do if you completely blank on a question?',
      'How long is too long for a pause in an interview?',
      'How do you get back on track after going off topic?',
    ],
  },

  'english-036': {
    q: `How do you keep a technical explanation easy to follow?`,
    a: `**Summary:** Three habits: **lead with the conclusion**, explain the mechanism in **numbered steps** (first, then, finally), and **check in with the listener** using natural questions instead of "Do you understand?". Stay at one level of detail; do not jump back and forth between high-level overview and code details.

### Sample answer
I try to keep three habits. First, I give the short version up front. Second, I walk through the mechanism step by step. And third, I check in with the listener before going deeper.

For example, if I'm explaining our product cache (a fast temporary store that avoids hitting the database every time), I'd say: "The short version is: we put Redis (an in-memory data store, meaning it keeps data in RAM for very fast reads) in front of the product service, and it cut database reads by about 80 percent. Here's how it works. First, the service checks Redis. If the product is there — that's a cache hit (the data was found in cache) — we return it in about a millisecond. If it isn't, we read it from Postgres (our relational database), store it in Redis with a ten-minute TTL (time to live, meaning the cached entry expires after 10 minutes), and return it. The tricky part is freshness: when a price changes, we delete the key, so the next read loads the new value."

Then I ask, "Does that level of detail work, or should I go deeper into how we handle invalidation (removing or updating stale cache entries)?" That way the interviewer decides where to zoom in.

### Useful phrases
- **The short version is...**: gives the conclusion up front
- **Here's how it works.**: signals a step-by-step explanation
- **The tricky part is...**: highlights the pitfall or hard part
- **Does that make sense so far?**: a polite check-in
- **Should I go deeper into...?**: lets the listener choose the depth

### Common mistakes for Vietnamese speakers
- Asking **"Do you understand?"** → can sound like you are testing the listener and may feel rude. Use "Does that make sense?" or "Is that clear so far?".
- Packing many technical terms into one sentence ("we use write-behind cache-aside with TTL-based eviction").
- Skipping connectors → the listener cannot tell which step you are on. Use "First... Then... Finally...".

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through STAR in order. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence about what you learned, because interviewers listen for growth. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for Vietnamese speakers
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: A specific number ("about 80 percent", "about a millisecond") helps the listener picture the impact far better than adjectives ("very fast", "much better"). With a technical interviewer, the phrase "The tricky part is..." is where you earn points: it shows you understand pitfalls, not just the happy path.`,
    follow: [
      'How would you explain the same cache to a product manager?',
      'What happens if the cache delete fails after the price update?',
      'How do you know when you are going into too much detail?',
    ],
  },


  'english-037': {
    q: `What would you say if you did not hear a question?`,
    a: `**Summary:** Say clearly that you did not hear, ask them to repeat **the specific part you missed**, or **paraphrase** what you heard to confirm. Do not guess and answer the wrong question — that costs more points than asking once.

### Sample answer
It depends on what I missed. If the connection drops, I just say so: "Sorry, you cut out for a second — could you repeat the last part of the question?"

If I caught most of it, I paraphrase it to confirm: "I think I got most of that. Are you asking how I'd handle duplicate messages after a consumer restarts?" That's quicker than asking them to repeat everything, and it shows I was listening.

If it's just one word, I ask about that word: "Sorry, I didn't quite catch the last word — did you say 'rebalance'?"

And if the audio keeps breaking up, I suggest a fix rather than struggling through it: "The audio is a bit choppy on my side. Would it help if I turned off my video?"

### Useful phrases
- **You cut out / You broke up for a second.**: your audio dropped briefly
- **I didn't quite catch that.**: I did not hear that clearly
- **Could you repeat the last part?**: ask to repeat only the part you missed
- **Are you asking...?**: paraphrase to confirm
- **The audio is a bit choppy.**: the sound keeps breaking up

### Common mistakes for Vietnamese speakers
- Saying **"What?"** or "Huh?" → sounds impolite. "Pardon?" is correct but a bit formal; "Sorry?" is more natural.
- **"Can you repeat again?"** → redundant (repeat already means "again"). Say **"Could you repeat that?"** or **"Could you say that again?"**.
- Being afraid to ask and guessing the question → you may answer the wrong thing.

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through STAR in order. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence about what you learned, because interviewers listen for growth. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for Vietnamese speakers
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: Before an online interview, check your headset, microphone, and network; wired headphones are usually safer. Asking to repeat **once** is completely normal — native speakers do it too. If you keep having to ask, suggest switching channels (turn off video, call again) instead of guessing.`,
    follow: [
      'What if you still do not understand after they repeat the question?',
      'How do you handle an interviewer with a strong accent?',
      'How do you confirm a long, multi-part question?',
    ],
  },

  'english-038': {
    q: `How do you respond about a technology you have not used?`,
    a: `**Summary:** Be honest in the first sentence ("Not in production"), connect to the **closest experience** you do have, briefly show what you **understand conceptually**, then describe **how you would learn it** (docs, a small proof of concept, risks to watch). Do not make things up, and do not just say "I don't know" and stop.

### Sample answer
*Interviewer: "Have you worked with Kubernetes operators?"*

"Not in production, no. I've deployed our services to Kubernetes (a platform for running and managing containerized applications) with Helm charts (packaged Kubernetes configuration templates) and set up readiness and liveness probes (health checks Kubernetes uses to know if a container is ready or still alive), but I haven't written an operator myself.

From what I understand, an operator is a controller (a program that watches resources and reacts to changes) that watches a custom resource (a user-defined Kubernetes object) and keeps reconciling (repeatedly adjusting) the actual state of the cluster toward the desired state — similar in spirit to how the Deployment controller manages ReplicaSets.

If I needed to build one, I'd start with the official docs and the Java Operator SDK, build a small proof of concept (a minimal prototype to test the idea) for one resource, and pay close attention to how it behaves when reconciliation fails halfway. I'd expect to be productive within a couple of weeks, and I'd ask someone who's run operators in production to review the design."

### Useful phrases
- **Not in production, no.**: honest about the gap
- **The closest thing I've done is...**: bridges to relevant experience
- **From what I understand, ...**: shows conceptual knowledge while staying honest
- **The way I'd get up to speed is...**: gives a concrete learning plan
- **similar in spirit to...**: connects a new idea to something familiar

### Common mistakes for Vietnamese speakers
- Saying "I don't know." and stopping → you miss the chance to show your thinking.
- Making up experience → two follow-up questions will expose it and destroy credibility.
- Vague claims like "I can learn anything quickly" → no evidence. Give a **specific learning plan**.

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through STAR in order. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence about what you learned, because interviewers listen for growth. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for Vietnamese speakers
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: A senior engineer does not need to know every technology, but must show how to **evaluate risk** when adopting something new: "what happens when it fails", "who will operate it", "how do we roll back". The phrase "From what I understand..." is both honest and gives the interviewer room to correct you if needed.`,
    follow: [
      'How would you decide whether the team should adopt this technology?',
      'Tell me about a time you had to learn a new technology quickly.',
      'What are the risks of introducing a technology nobody on the team knows?',
    ],
  },

  'english-039': {
    q: `What if you realize you misstated a technical detail?`,
    a: `**Summary:** Correct it **as soon as you notice**, briefly and without over-apologizing: state what you said, what is correct, and whether your conclusion changes. Self-correcting is a positive signal of honesty and deep understanding.

### Sample answer
I correct it as soon as I notice — briefly, and without making a big deal of it. For example:

"Sorry, let me correct something I said earlier. I said Kafka (a distributed event streaming platform) gives us exactly-once delivery (each message is processed exactly one time, no duplicates, no loss) by default — that's not accurate. On the consumer side (the service that reads messages), the default is effectively at-least-once: if a consumer crashes after processing a message but before committing the offset (the marker of how far it has read), it will get that message again. Kafka does support exactly-once semantics with idempotent producers and transactions, but that only covers reads and writes inside Kafka. Once the consumer writes to an external database, we still need idempotent processing.

The good news is that it doesn't change my design, because the consumer already uses an idempotency key (a unique ID used to detect and ignore duplicates) — but I wanted to be precise."

### Useful phrases
- **Let me correct something I said earlier.**: a clear, calm correction
- **What I meant was...**: clarifies your intent
- **To be precise, ...**: signals a careful technical correction
- **That doesn't change my conclusion, because...**: tells the listener the impact
- **That changes things a bit — ...**: honest if the correction matters

### Common mistakes for Vietnamese speakers
- Ignoring it and hoping the interviewer did not notice → if they did, you lose twice the points.
- Over-apologizing: "I'm so sorry, I'm very bad at this" → hurts credibility. One **"Sorry"** is enough.
- Correcting without saying whether the conclusion changes → the listener has to guess.

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through STAR in order. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence about what you learned, because interviewers listen for growth. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for Vietnamese speakers
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: The Kafka example above comes up a lot: since Kafka 3.0 the producer enables idempotence by default (it prevents duplicates caused by producer retries), but that does **not** stop the consumer from receiving duplicates. Knowing easily-confused details like this lets you correct yourself in time and earn "deep understanding" points.`,
    follow: [
      'How does Kafka achieve exactly-once semantics inside a stream processing pipeline?',
      'Tell me about a time you were wrong about a technical decision.',
      'How do you handle it when a colleague misstates something in a meeting?',
    ],
  },

});
