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
    a: `**Summary:** Lead across teams: **build consensus → design together → slice work → track progress → communicate continuously**. Show influence without authority, handle conflict with priority, and deliver results.

### Sample answer
**Context:** Our company ran three separate payment services (Vietnam, Singapore, Indonesia), each with its own reconciliation logic, acquirer adapters, and settlement flow. The same bugs had to be fixed three times, onboarding a new acquirer took six weeks per country, and each country team had almost no visibility into the other two codebases.

**Initiative:** I proposed a **Payment Platform Unification** — extract common domain (reconciliation, settlement, idempotency, webhook delivery) into a shared library, and build a **Payment Orchestrator** service that all three countries call. The orchestrator handles routing, retry, and settlement; country-specific logic stays in thin adapters.

**How I led it:**
1. **Build the coalition:** I met 1:1 with each country's tech lead and the EMs and listened to their concerns (Singapore worried about latency, Indonesia about compliance). Documented a **shared vision doc** with success criteria: onboarding time < 2 weeks, zero duplicate bugs, single on-call rotation.
2. **Design together:** Ran a 2-day design workshop (RFC process). We agreed on: shared library in Java 17, gRPC for orchestrator communication, feature flags for gradual rollout. I wrote the RFC, received 15 comments, and revised it twice.
3. **Slice the work:** Broke into 3 phases — (a) shared library + contract tests, (b) orchestrator service + Vietnam migration, (c) Singapore + Indonesia migration. Each phase had clear exit criteria and a rollback plan.
4. **Governance:** We held a weekly sync with all tech leads. A Jira epic tracked migration progress, and a shared Grafana dashboard showed error rate and p99 latency. If a country team was blocked for more than a week, I escalated to the EMs with data.
5. **Communication:** We ran a demo for stakeholders every two weeks and sent a monthly update to all engineers with progress and lessons learned.

**Result:** Nine months later, all three countries had migrated. Onboarding a new acquirer dropped from six weeks to ten days. We no longer fixed the same reconciliation bug three times, and on-call was consolidated into a single rotation with shared runbooks.

**What I learned:** I'd say technical design was maybe 30% of the work; **alignment and trust were the other 70%**. If I had pushed the design without 1:1s, Singapore would have blocked. The feature flag strategy let us prove value incrementally without big-bang risk.

### Useful phrases
- **influence without authority**: influence without authority
- **consensus building**: consensus building
- **feature flag**: feature flag
- **gradual rollout**: gradual rollout
- **rollback plan**: rollback plan
- **big-bang risk**: big-bang risk

> Senior tip: Across-team initiatives usually fail due to **no executive sponsor** or **no clear exit criteria**. Always have: (1) sponsor from VP/CTO, (2) success metrics with numbers, (3) rollback plan for each phase. Don't try to "standardize everything" — let each team keep autonomy in adapters, only unify the core domain. Pronounce **initiative** /ɪˈnɪʃətɪv/ with stress on the second syllable (-ni-).`,
    follow: [
      'How did you handle a team that refused to migrate?',
      'What would you do differently if you had to do it again?',
      'How do you balance standardization with team autonomy?',
    ],
  },

  'english-032': {
    q: `Tell me about a project where you had measurable impact.`,
    a: `**Summary:** I describe the problem, my contribution, and a measured outcome. I identify the metric and time window, distinguish my work from the team?s work, and explain the trade-off. I never invent impact figures.

### Sample answer
I describe the problem, my contribution, and a measured outcome. I identify the metric and time window, distinguish my work from the team?s work, and explain the trade-off. I never invent impact figures.

### Practice
Answer in your own words and use a real example where the question asks about experience. Keep the first response concise, then expand when the interviewer asks a follow-up.

> Senior tip: Be precise about what you know, what you did, and what evidence supports your statement.

### Build a natural spoken answer
Treat the sample as a model for organization, not as a script to memorize. First answer the question in one sentence. Add only the context the listener needs, then give a reason, example, or next step that directly supports your point. Use signposts such as ?The main reason is?,? ?For example?,? and ?The trade-off is??. These short phrases help the interviewer follow your reasoning and give you a moment to plan the next sentence. Prefer familiar words and specific verbs over long abstract phrases. If you need a detail you do not have, say what you would verify instead of guessing. Keep confidential names, customer data, and internal figures out of the example.

### Follow-up practice
Record a short response, listen once for whether the main point appears early, and listen again for one language habit to improve. Do not try to correct pronunciation, grammar, vocabulary, and pace all at once. Then answer a likely follow-up in two or three sentences. For experience questions, prepare a truthful example and be ready to explain your own contribution. For hypothetical questions, state the assumptions that affect your choice. End when the question is answered; invite a deeper discussion only when a useful detail remains. This makes the response concise without sounding abrupt and helps you adapt if the interviewer changes a constraint.

> Senior tip: Clear structure and accurate details make spoken English easier to follow than speed or elaborate vocabulary.`,
    follow: ['What would you change if a key constraint were different?', 'How would you measure whether your approach worked?'],
  },

  'english-033': {
    q: `How do you explain a recommendation clearly?`,
    a: `**Summary:** I state the recommendation first, connect it to the key constraint, and explain one benefit and one cost. For example, I would keep a request synchronous when its caller needs the result immediately; otherwise I would evaluate asynchronous processing and its recovery requirements.

### Sample answer
I state the recommendation first, connect it to the key constraint, and explain one benefit and one cost. For example, I would keep a request synchronous when its caller needs the result immediately; otherwise I would evaluate asynchronous processing and its recovery requirements.

### Practice
Answer in your own words and use a real example where the question asks about experience. Keep the first response concise, then expand when the interviewer asks a follow-up.

> Senior tip: Be precise about what you know, what you did, and what evidence supports your statement.

### Build a natural spoken answer
Treat the sample as a model for organization, not as a script to memorize. First answer the question in one sentence. Add only the context the listener needs, then give a reason, example, or next step that directly supports your point. Use signposts such as ?The main reason is?,? ?For example?,? and ?The trade-off is??. These short phrases help the interviewer follow your reasoning and give you a moment to plan the next sentence. Prefer familiar words and specific verbs over long abstract phrases. If you need a detail you do not have, say what you would verify instead of guessing. Keep confidential names, customer data, and internal figures out of the example.

### Follow-up practice
Record a short response, listen once for whether the main point appears early, and listen again for one language habit to improve. Do not try to correct pronunciation, grammar, vocabulary, and pace all at once. Then answer a likely follow-up in two or three sentences. For experience questions, prepare a truthful example and be ready to explain your own contribution. For hypothetical questions, state the assumptions that affect your choice. End when the question is answered; invite a deeper discussion only when a useful detail remains. This makes the response concise without sounding abrupt and helps you adapt if the interviewer changes a constraint.

> Senior tip: Clear structure and accurate details make spoken English easier to follow than speed or elaborate vocabulary.`,
    follow: ['What would you change if a key constraint were different?', 'How would you measure whether your approach worked?'],
  },

  'english-034': {
    q: `When would you choose synchronous or asynchronous processing?`,
    a: `**Summary:** I use synchronous processing when the caller needs an immediate result and latency and availability budgets permit it. I consider asynchronous processing for deferrable work, while planning for eventual consistency, duplicate delivery, bounded retries, idempotency, and queue monitoring.

### Sample answer
I use synchronous processing when the caller needs an immediate result and latency and availability budgets permit it. I consider asynchronous processing for deferrable work, while planning for eventual consistency, duplicate delivery, bounded retries, idempotency, and queue monitoring.

### Practice
Answer in your own words and use a real example where the question asks about experience. Keep the first response concise, then expand when the interviewer asks a follow-up.

> Senior tip: Be precise about what you know, what you did, and what evidence supports your statement.

### Build a natural spoken answer
Treat the sample as a model for organization, not as a script to memorize. First answer the question in one sentence. Add only the context the listener needs, then give a reason, example, or next step that directly supports your point. Use signposts such as ?The main reason is?,? ?For example?,? and ?The trade-off is??. These short phrases help the interviewer follow your reasoning and give you a moment to plan the next sentence. Prefer familiar words and specific verbs over long abstract phrases. If you need a detail you do not have, say what you would verify instead of guessing. Keep confidential names, customer data, and internal figures out of the example.

### Follow-up practice
Record a short response, listen once for whether the main point appears early, and listen again for one language habit to improve. Do not try to correct pronunciation, grammar, vocabulary, and pace all at once. Then answer a likely follow-up in two or three sentences. For experience questions, prepare a truthful example and be ready to explain your own contribution. For hypothetical questions, state the assumptions that affect your choice. End when the question is answered; invite a deeper discussion only when a useful detail remains. This makes the response concise without sounding abrupt and helps you adapt if the interviewer changes a constraint.

> Senior tip: Clear structure and accurate details make spoken English easier to follow than speed or elaborate vocabulary.`,
    follow: ['What would you change if a key constraint were different?', 'How would you measure whether your approach worked?'],
  },

  'english-035': {
    q: `How do you structure an answer when you need a moment?`,
    a: `**Summary:** I take a brief pause and say, ?Let me organize my thoughts. I would look at this from two angles.? Then I answer directly, explain my reasoning, and stop when I have addressed the question. A short pause is better than filling the silence with repeated fillers.

### Sample answer
I take a brief pause and say, ?Let me organize my thoughts. I would look at this from two angles.? Then I answer directly, explain my reasoning, and stop when I have addressed the question. A short pause is better than filling the silence with repeated fillers.

### Practice
Answer in your own words and use a real example where the question asks about experience. Keep the first response concise, then expand when the interviewer asks a follow-up.

> Senior tip: Be precise about what you know, what you did, and what evidence supports your statement.

### Build a natural spoken answer
Treat the sample as a model for organization, not as a script to memorize. First answer the question in one sentence. Add only the context the listener needs, then give a reason, example, or next step that directly supports your point. Use signposts such as ?The main reason is?,? ?For example?,? and ?The trade-off is??. These short phrases help the interviewer follow your reasoning and give you a moment to plan the next sentence. Prefer familiar words and specific verbs over long abstract phrases. If you need a detail you do not have, say what you would verify instead of guessing. Keep confidential names, customer data, and internal figures out of the example.

### Follow-up practice
Record a short response, listen once for whether the main point appears early, and listen again for one language habit to improve. Do not try to correct pronunciation, grammar, vocabulary, and pace all at once. Then answer a likely follow-up in two or three sentences. For experience questions, prepare a truthful example and be ready to explain your own contribution. For hypothetical questions, state the assumptions that affect your choice. End when the question is answered; invite a deeper discussion only when a useful detail remains. This makes the response concise without sounding abrupt and helps you adapt if the interviewer changes a constraint.

> Senior tip: Clear structure and accurate details make spoken English easier to follow than speed or elaborate vocabulary.`,
    follow: ['What would you change if a key constraint were different?', 'How would you measure whether your approach worked?'],
  },

  'english-036': {
    q: `How do you keep a technical explanation easy to follow?`,
    a: `**Summary:** I start with the conclusion, give only the necessary context, and explain the mechanism in ordered steps. For caching, for example, I explain that a stored copy can reduce repeated database reads, then cover freshness and invalidation because they are the main trade-offs.

### Sample answer
I start with the conclusion, give only the necessary context, and explain the mechanism in ordered steps. For caching, for example, I explain that a stored copy can reduce repeated database reads, then cover freshness and invalidation because they are the main trade-offs.

### Practice
Answer in your own words and use a real example where the question asks about experience. Keep the first response concise, then expand when the interviewer asks a follow-up.

> Senior tip: Be precise about what you know, what you did, and what evidence supports your statement.

### Build a natural spoken answer
Treat the sample as a model for organization, not as a script to memorize. First answer the question in one sentence. Add only the context the listener needs, then give a reason, example, or next step that directly supports your point. Use signposts such as ?The main reason is?,? ?For example?,? and ?The trade-off is??. These short phrases help the interviewer follow your reasoning and give you a moment to plan the next sentence. Prefer familiar words and specific verbs over long abstract phrases. If you need a detail you do not have, say what you would verify instead of guessing. Keep confidential names, customer data, and internal figures out of the example.

### Follow-up practice
Record a short response, listen once for whether the main point appears early, and listen again for one language habit to improve. Do not try to correct pronunciation, grammar, vocabulary, and pace all at once. Then answer a likely follow-up in two or three sentences. For experience questions, prepare a truthful example and be ready to explain your own contribution. For hypothetical questions, state the assumptions that affect your choice. End when the question is answered; invite a deeper discussion only when a useful detail remains. This makes the response concise without sounding abrupt and helps you adapt if the interviewer changes a constraint.

> Senior tip: Clear structure and accurate details make spoken English easier to follow than speed or elaborate vocabulary.`,
    follow: ['What would you change if a key constraint were different?', 'How would you measure whether your approach worked?'],
  },

  'english-037': {
    q: `What would you say if you did not hear a question?`,
    a: `**Summary:** I say, ?Could you repeat the last part of the question, please?? If I caught part of it, I paraphrase it: ?Are you asking how I would handle duplicate messages after a consumer restart?? I confirm before answering rather than guessing.

### Sample answer
I say, ?Could you repeat the last part of the question, please?? If I caught part of it, I paraphrase it: ?Are you asking how I would handle duplicate messages after a consumer restart?? I confirm before answering rather than guessing.

### Practice
Answer in your own words and use a real example where the question asks about experience. Keep the first response concise, then expand when the interviewer asks a follow-up.

> Senior tip: Be precise about what you know, what you did, and what evidence supports your statement.

### Build a natural spoken answer
Treat the sample as a model for organization, not as a script to memorize. First answer the question in one sentence. Add only the context the listener needs, then give a reason, example, or next step that directly supports your point. Use signposts such as ?The main reason is?,? ?For example?,? and ?The trade-off is??. These short phrases help the interviewer follow your reasoning and give you a moment to plan the next sentence. Prefer familiar words and specific verbs over long abstract phrases. If you need a detail you do not have, say what you would verify instead of guessing. Keep confidential names, customer data, and internal figures out of the example.

### Follow-up practice
Record a short response, listen once for whether the main point appears early, and listen again for one language habit to improve. Do not try to correct pronunciation, grammar, vocabulary, and pace all at once. Then answer a likely follow-up in two or three sentences. For experience questions, prepare a truthful example and be ready to explain your own contribution. For hypothetical questions, state the assumptions that affect your choice. End when the question is answered; invite a deeper discussion only when a useful detail remains. This makes the response concise without sounding abrupt and helps you adapt if the interviewer changes a constraint.

> Senior tip: Clear structure and accurate details make spoken English easier to follow than speed or elaborate vocabulary.`,
    follow: ['What would you change if a key constraint were different?', 'How would you measure whether your approach worked?'],
  },

  'english-038': {
    q: `How do you respond about a technology you have not used?`,
    a: `**Summary:** I am transparent that I have not used the technology in production. I connect relevant experience to its underlying concepts, explain how I would evaluate it through documentation and a small proof of concept, and state what I would need to learn.

### Sample answer
I am transparent that I have not used the technology in production. I connect relevant experience to its underlying concepts, explain how I would evaluate it through documentation and a small proof of concept, and state what I would need to learn.

### Practice
Answer in your own words and use a real example where the question asks about experience. Keep the first response concise, then expand when the interviewer asks a follow-up.

> Senior tip: Be precise about what you know, what you did, and what evidence supports your statement.

### Build a natural spoken answer
Treat the sample as a model for organization, not as a script to memorize. First answer the question in one sentence. Add only the context the listener needs, then give a reason, example, or next step that directly supports your point. Use signposts such as ?The main reason is?,? ?For example?,? and ?The trade-off is??. These short phrases help the interviewer follow your reasoning and give you a moment to plan the next sentence. Prefer familiar words and specific verbs over long abstract phrases. If you need a detail you do not have, say what you would verify instead of guessing. Keep confidential names, customer data, and internal figures out of the example.

### Follow-up practice
Record a short response, listen once for whether the main point appears early, and listen again for one language habit to improve. Do not try to correct pronunciation, grammar, vocabulary, and pace all at once. Then answer a likely follow-up in two or three sentences. For experience questions, prepare a truthful example and be ready to explain your own contribution. For hypothetical questions, state the assumptions that affect your choice. End when the question is answered; invite a deeper discussion only when a useful detail remains. This makes the response concise without sounding abrupt and helps you adapt if the interviewer changes a constraint.

> Senior tip: Clear structure and accurate details make spoken English easier to follow than speed or elaborate vocabulary.`,
    follow: ['What would you change if a key constraint were different?', 'How would you measure whether your approach worked?'],
  },

  'english-039': {
    q: `What if you realize you misstated a technical detail?`,
    a: `**Summary:** I correct the detail promptly: ?I want to correct one point. I said exactly-once delivery, but I meant at-least-once delivery.? I then explain that duplicate delivery is possible and consumers need idempotent processing, and clarify whether my conclusion changes.

### Sample answer
I correct the detail promptly: ?I want to correct one point. I said exactly-once delivery, but I meant at-least-once delivery.? I then explain that duplicate delivery is possible and consumers need idempotent processing, and clarify whether my conclusion changes.

### Practice
Answer in your own words and use a real example where the question asks about experience. Keep the first response concise, then expand when the interviewer asks a follow-up.

> Senior tip: Be precise about what you know, what you did, and what evidence supports your statement.

### Build a natural spoken answer
Treat the sample as a model for organization, not as a script to memorize. First answer the question in one sentence. Add only the context the listener needs, then give a reason, example, or next step that directly supports your point. Use signposts such as ?The main reason is?,? ?For example?,? and ?The trade-off is??. These short phrases help the interviewer follow your reasoning and give you a moment to plan the next sentence. Prefer familiar words and specific verbs over long abstract phrases. If you need a detail you do not have, say what you would verify instead of guessing. Keep confidential names, customer data, and internal figures out of the example.

### Follow-up practice
Record a short response, listen once for whether the main point appears early, and listen again for one language habit to improve. Do not try to correct pronunciation, grammar, vocabulary, and pace all at once. Then answer a likely follow-up in two or three sentences. For experience questions, prepare a truthful example and be ready to explain your own contribution. For hypothetical questions, state the assumptions that affect your choice. End when the question is answered; invite a deeper discussion only when a useful detail remains. This makes the response concise without sounding abrupt and helps you adapt if the interviewer changes a constraint.

> Senior tip: Clear structure and accurate details make spoken English easier to follow than speed or elaborate vocabulary.`,
    follow: ['What would you change if a key constraint were different?', 'How would you measure whether your approach worked?'],
  },

});
