/*
 * English translation of js/data/q-soft.js — task T219. Format: js/core/i18n.js (content overlay).
 * ids: testing-016 behavioral-013 behavioral-014 behavioral-015 behavioral-016 behavioral-017 behavioral-018 behavioral-019
 */
App.i18n.content({
  'testing-016': {
    q: 'How do you test the system\'s resilience — injecting network failures, timeouts, downstream service crashes, Kafka broker disconnections? What do you do in the staging environment, and which tools do you use (WireMock, Resilience4j, Toxiproxy)?',
    a: `**Summary:** Resilience testing has **three layers**: unit tests for fallback/retry-limit logic with fake dependencies, integration tests with **WireMock** to reproduce timeouts, 5xx responses, and real connection resets, and **chaos tests in staging** with Toxiproxy to cut the network and kill pods. A non-negotiable principle: every fault injection must be tied to a **steady-state hypothesis** and an **abort condition** — without those two, chaos testing is just causing disorder.

### Three layers of resilience testing
| Layer | Tool | Simulated impact | Question it answers |
|---|---|---|---|
| Unit | fake client, fake clock | throw exception, return error | is fallback logic and the retry limit correct |
| Integration | WireMock | 500, delay, connection reset | does the breaker open correctly, is the timeout enforced |
| Staging / chaos | Toxiproxy, kill pod | real network loss, broker crash | can the system still serve when a dependency dies |

### Integration layer — WireMock + Resilience4j
~~~java
@Test void breaker_opens_after_repeated_failures() {
    var server = new WireMockServer(0);                 // random port
    server.start();
    server.stubFor(get("/api/inventory").willReturn(serverError()));   // downstream returns 500
    var client = RestClient.create("http://localhost:" + server.port());
    var breaker = CircuitBreaker.of("inventory", CircuitBreakerConfig.custom()
        .slidingWindowSize(4).minimumNumberOfCalls(4)   // by default it needs 100 calls before evaluating
        .failureRateThreshold(50).build());
    Supplier<String> guarded = CircuitBreaker.decorateSupplier(breaker,
        () -> client.get().uri("/api/inventory").retrieve().body(String.class));

    for (int i = 0; i < 4; i++)                         // 4 real 500s over HTTP
        assertThrows(HttpServerErrorException.class, guarded::get);
    assertThat(breaker.getState()).isEqualTo(CircuitBreaker.State.OPEN);
    assertThrows(CallNotPermittedException.class, guarded::get);  // blocked, nothing is called downstream
    server.verify(4, getRequestedFor(urlEqualTo("/api/inventory")));
    server.stop();
}
~~~
- WireMock also simulates {{withFixedDelay}} to create **real timeouts** and {{Fault.CONNECTION_RESET_BY_PEER}} to simulate a connection dropping mid-way — the two most common failures in production.
- With resilience4j-spring-boot3 (also where Spring Cloud CircuitBreaker reads its config from), thresholds are set through the property {{resilience4j.circuitbreaker.instances.inventory.sliding-window-size}}.
- To inject network faults right inside an integration test, Testcontainers offers a {{ToxiproxyContainer}} placed between the app and the Postgres/Kafka containers.
- **Always assert the fallback behavior too** (return cached data, return an empty list, return an error with a clear code), not only that the breaker is OPEN.

### Staging layer — Toxiproxy to inject real network faults
Toxiproxy is a TCP proxy standing between the service and Postgres: the app connects to the proxy, the proxy forwards to Postgres, and you can turn "toxics" on and off through its API at any moment: {{latency}}, {{bandwidth}}, {{timeout}}, {{reset_peer}}, {{slow_close}}, {{slicer}} — enough to simulate almost any network incident without changing application code.

### Chaos scenarios you should have in staging
1. **Latency**: add 800 ms to Postgres ⇒ is the client timeout appropriate, can the connection pool still cope?
2. **Connection loss**: {{reset_peer}} while a write is in progress ⇒ does the transaction roll back correctly?
3. **Broker crash**: stop the Kafka container ⇒ does the consumer retry, is there a DLT, does the service survive?
4. **Pod killed**: delete a pod while an order is being processed ⇒ is the order left half-processed or processed twice, does graceful shutdown work?

### Running chaos safely
- Write the **steady-state hypothesis** first: "when Postgres gets 800 ms slower, the order API still has p99 under 2 seconds and an error rate under 1%; any request that exceeds the timeout must get a clear 503 instead of hanging".
- Write the **abort condition**: "if the error rate goes above 5% for 2 minutes, stop immediately and roll back".
- Have a **watcher** following the dashboard with debugging commands ready; only run in **staging** with simulated data — production needs permission and a small time window.

### Common pitfalls
- **Retry without jitter** ⇒ when the downstream recovers, all clients retry at the same instant and kill it a second time.
- **Circuit breaker without a fallback** ⇒ errors propagate straight from the failing service upstream; add a **bulkhead** to cap the number of waiting requests.
- **The downstream timeout being larger than the timeout upstream sets for itself** (e.g. the gateway waits 3 seconds, but the service waits 10 seconds for the DB) ⇒ the gateway has already given up and returned an error to the user, yet the service still holds a thread + connection for 7 more seconds for a result nobody will take. Timeouts must shrink as you go deeper into the call chain.
- **Writing "resilience tests" by just mocking a 500 response** ⇒ a mock cannot reproduce pool exhaustion, blocked threads, or DNS failure.

> Senior tip: measure the **SLO before and after** every resilience config change. For example "adding a circuit breaker with a 50% error threshold over a 20-call window and a fallback returning the old cache ⇒ p99 of the order API dropped from 4.2 seconds to 300 ms". That number turns a config decision into something you can defend in front of your boss and your team.`,
    follow: [
        'How do you define the steady-state hypothesis and abort condition for each service?',
        'How do you control the blast radius when running chaos in staging with near-real data?',
        'Do you automate chaos test runs on a schedule (nightly), and how do you handle the results?'
    ]
  },
  'behavioral-013': {
    q: 'Tell us about a time you had to work with a team member who was performing poorly or lacked responsibility. How did you handle it while maintaining a working relationship and without hurting the team?',
    a: `**Summary:** This measures **people management**: distinguishing the root cause before concluding, setting measurable criteria, and knowing when to escalate. A strong answer does not end with "I reported it to management" (sounds like tattling), but with a process that includes data and **observable results** — even if the person didn\'t change.

### Interviewer objectives
- **Distinguish causes**: incompetence, lack of motivation, or personal issues — each needs a different approach.
- **Support before concluding**: have you tried supporting and measuring results?
- **Non-confrontational communication**: describe behavior, don\'t label personality.
- **Knowing when to escalate**, with evidence not feelings, and **honesty** about your own part.

### Three steps to process
1. **Record specific behavior**, with timestamps and measurable impact.
2. **Understand the cause** through questions, not ready-made conclusions.
3. **Set specific criteria + support + timeframe** (usually 4–8 weeks), then **follow up periodically**; if no improvement, escalate with evidence.

### Signs to distinguish causes
- **Does well with guidance, fails when autonomous** ⇒ lack of confidence, doesn\'t grasp the domain: mentoring, assign tasks with gradually increasing difficulty.
- **Still tries but fails standards, or tasks are increasingly ignored** ⇒ lack of competence or time management: training, clarify standards, coach estimation.
- **No response, absent from meetings, complaining/blaming** ⇒ lack of motivation or personal issues: 1-1 exchange, dig deeper.

### Communication approach — SBI model
State the **behavior** (S: situation, B: behavior, I: impact), then clear the path for them: "In the last 3 sprints, there were 4 instances where your PR had to be revised for missing tests, making me wait an extra day for merge, and causing 2 bugs to reach staging. What can I do to support you?". Don\'t say "You lack responsibility" — that\'s a personality label, not a behavior.

### Sample answer
> "In the payment team, there was an engineer with about 1 year of experience. Initially, I thought this was a skill issue because their PRs were returned by me with the reason 'missing tests'. After that happened three times, I suspected the problem was elsewhere.
> I did two things. One: invited them for 30 minutes and asked one question — 'What makes writing tests hardest for you with this module?'. The answer: they didn\'t know where to start because the payment flow has many branches, each time re-reading old code takes half a day. So this was a **context and guidance issue**, not responsibility. Two: for two weeks, I reviewed their PRs beforehand and recorded **types of tests** still missing for them to use as a template.
> After 4 weeks, the number of revision rounds due to missing tests dropped from an average of 3.2 to 1.1; they wrote tests for the refund flow without my prior review. The following month, they led onboarding for a newcomer.
> Lesson: before concluding someone lacks responsibility, assume they lack context or guidance and then test that assumption. In another team, I labeled too quickly and lost a great person."

### When to escalate
- Needs **evidence**: behavior + time + measurable impact, not "I think they are careless".
- Speak to the person\'s direct leader, with records; if related to behavior/professional ethics, report to HR according to procedure. Propose with: keep and guide, or rotate to a suitable position.

### Things to avoid
- **Labeling personality** ("lazy", "irresponsible"): unmeasurable, unfixable, and not in formal records.
- **Giving feedback in front of the whole team** or **reporting to above the first time**: causes loss of face, kills support chances, and ruins trust.
- **Doing the work for them** to "help", or **letting issues drag on for months**: sets a precedent of mistrust and finally accepts risk by silence.

> Senior tip: prepare **two versions**: one successful case (you helped them improve, with before/after numbers), and one **unsuccessful** case (you did your part but results didn\'t change, and you handled it correctly by the book). The second version is more convincing as it shows you understand the boundary between "my job" and "not my job".`
  },
  'behavioral-014': {
    q: 'You need to convince another team to change how they work, but you aren\'t their lead and don\'t have decision authority. What do you do?',
    a: `**Summary:** Influence without authority is built on: **common benefit + evidence + lower barriers for them + relationships + small precedents with results**. You don\'t convince with rank, but by making your proposal **cheap and beneficial to the other person**, then let the results do the talking.

### Interviewer objectives
- Do you understand the goals and constraints of the other team, or just speak for what you need?
- Can you bring **benefits to them** not just benefits to your project?
- Do you have evidence or only emotion-based arguments?
- Is the change **sustainable** after you leave the project?
- Do you know when to escalate, or just silently suffer?

### Five principles
1. **Find common ground first**: the first sentence is "what is hardest for you", not "I need you to do what".
2. **Use data they can verify**: metrics from systems they also see, tied to things they care about, not metrics serving only your side.
3. **Propose solutions beneficial to them**: reduce work or risk for them, don\'t just add work.
4. **Start with a small, reversible pilot**: pilot with one group before proposing globally.
5. **Create a precedent**: when others see results, they follow naturally — that is the most sustainable influence.

### Sample answer
> "A case I had to advocate for was wanting the Mobile team to include an idempotency key in the header when calling the order API. They opposed, thinking it was backend detail, Mobile only needs to send the body.
> I didn\'t start by explaining why it mattered — but with a question: 'In the past 3 months, how many times did Mobile retry an order and create a duplicate?'. They didn\'t know. I pulled numbers from the API gateway logs (Mobile could also access): in 3 months, 1,240 order requests were sent repeatedly within 5 seconds, creating 38 duplicate orders that CSKH had to manually cancel and refund. That number is what **they** cared about, not what I needed.
> I proposed a cheap change for them: add a field to the existing request wrapper of mobile, so every screen automatically has it, no need to fix every spot, and the rest is on my side. After the new app release and backend returned the same result as the first request when meeting a duplicate key, 6 consecutive weeks had no duplicate orders.
> Sustainable result: after that, Mobile proactively asked the backend what to send for other APIs. I don\'t need decision authority — I need them to see the benefits and not have to spend extra effort."

### When persuasion fails
- **Bring the issue to the place where actual decisions happen**: a common meeting with authorized people, instead of arguing privately.
- **Put it in writing**: evidence + proposal + milestone for decision. Writing turns verbal talk into an issue with an owner and decision deadline.
- **Prepare alternatives**: reduce dependence on that change, instead of waiting.
- **Choose influential people**: convince one person to agree first, then use that person to spread it.

### Things to avoid
- **Arguing by hierarchy**: "the other team must do it" — you lose both the issue and the relationship.
- **Ultimatums or threats**: if you have to use threats, you\'ve failed at influence.
- **Ignoring their pain points**: if they are crushed by deadlines, a "better" proposal isn\'t worth their time.
- **Proposals without evidence**: "experience shows" doesn\'t convince great engineers.
- **Silently suffering then screaming after 3 months**: by then the issue isn\'t technical but trust.
- **Trying to convince people without decision authority**: find the empowered person from the start.

> Senior tip: before trying to convince anyone, answer three questions: **what pain do they have, what do they fear losing, and how does my proposal reduce that pain**. If you can\'t answer the third, you aren\'t solving a problem — you\'re trying to convince, and will fail precisely because of that.`
  },
  'behavioral-015': {
    q: 'Tell us about a time you missed a deadline or failed a commitment to a customer or team. How did you report the bad news, to whom, and when? What did you do to fix it?',
    a: `**Summary:** How you report bad news is evaluated higher than the news itself. Principles: **report early, report specifically, report with options, report to the right person, and report clearly once**. Stakeholders accept bad news early; they don\'t accept discovering they were ignored until the last minute.

### Interviewer objectives
- **Honesty**: admit failure or paint a perfect story?
- **Early or late**: is there still time for others to act?
- **Options or not**: do you bring problems or options?
- **Right person**: do you know who needs to know and who doesn\'t?
- **Accountability vs blaming**: do you accept your part?
- **Process change**: how do you promise to behave differently?

### Four sentences in a bad news report
| Part | Say what | Example |
|---|---|---|
| Situation | truth, short, no beating around the bush | "the 8 AM Friday milestone will not be met" |
| Impact | who is affected, to what extent | "the daily settlement will miss 2 days of data" |
| Options | specific option you propose | "switch to weekly reports in 2 weeks, then run backfill" |
| Need | what you need from them | "permission to read old transaction tables, needed in 2 days" |

### Who to report to
| Audience | When | Say what |
|---|---|---|
| Directly affected (customer, PM, ops) | immediately when sure it\'s not on time | situation, impact, options |
| Your team | immediately after | what you need them to do now |
| Priority decision maker | when option needs scope or resource change | proposal with clear recommendation |
| Indirect stakeholders | only when affected | avoid spreading unverified news |

### Sample answer
> "End of last year I committed to operations that settlement reports would be ready daily at 8 AM for them to use for daily closing. I volunteered because I thought it would take a week.
> I didn\'t meet it. The real reason wasn\'t a major incident but accumulation: I **didn\'t check assumptions about historical data** before committing — the previous year\'s transaction table had 3 different formats; normalization required access to the finance team\'s old system, which by process takes ~5 days waiting; and that sprint also had 2 other urgent tasks.
> Monday afternoon of the week of the milestone, I was sure I wouldn\'t make it by Friday. This was the week\'s most important decision: I could stay silent to still have a chance, but if Friday still wasn\'t done, ops would close with missing data and have to redo the whole sheet — cost far higher than rescheduling.
> Immediately I met the ops lead and PM, said those four sentences, then followed up with a summary email. Result: ops agreed to move to weekly reports for 2 weeks, PM helped expedite the access in 2 days, and daily reports ran again from Monday. Quarterly closing was not off.
> I also admitted I should have reported when I knew I had to wait for access, not when sure of missing it. Afterward I changed how I commit: before promising, I check **input assumptions** and **needed access**, and I commit with an intermediate milestone — early commitment to testing on partial data instead of final result commitment.
> Lesson: how you report bad news is more important than the news."

### Things to avoid
- **Reporting too late** — when it has happened, the information has no value.
- **Reporting "all is well" then silent**: fastest way to lose trust.
- **Bringing a problem without an option**: forcing others to think for you.
- **Reporting to the whole company**: creates rumors, lose control.
- **Multiple inconsistent reports**: loses trust in information reliability.
- **Blaming**: even when the root cause is infrastructure, you are the person who accepted the commitment.
- **Hiding by sending a "nearly correct" report**: discovered very quickly and far worse than just saying it straight.

> Senior tip: prepare **three versions**: bad news due to your fault, bad news due to external causes, and a time you **detected early** risk and reported before it happened. The third version is often the most impressive, showing you have an early warning system, not just reacting when things break.`
  },
  'behavioral-016': {
    q: 'Your project progress is blocked by another team and you cannot decide on your own. What do you do to unblock the situation without ruining the relationship and without losing credibility?',
    a: `**Summary:** As a lead, being blocked by another team is everyday life, and the real question is whether you **call the problem by its right name**. An effective process: **quantify the block → find the person actually accountable → understand their constraints → propose an option that benefits them → separate out what you can do yourself → escalate with evidence and a decision milestone**. The key point: escalate to **ask for a decision**, not to report someone.

### What the interviewer is assessing
- Can you tell "blocked because of priority" apart from "blocked because of incompetence"?
- Do you proactively look for a way to unblock instead of waiting?
- Can you bring an option that helps **both sides**, or do you just pass the ball?
- Do you escalate in the right order and in the right way?
- Do you know when to stop persuading and move to making a decision?

### Five steps to unblock
1. **Quantify the specific block**: not "the Platform team is slow" but "item X needs 5 person-days and depends on item Y". Without numbers there is no negotiation.
2. **Find the person with decision power** over that item, not the person who replies to emails.
3. **Understand their constraints**: what they are busy with, who is pushing them, what they need in order to prioritize you.
4. **Propose an option that benefits them**: split the work, lend people or resources, or take the heaviest preparation work on your own side.
5. **Separate out what you can do yourself** so the project keeps moving while you wait.

### Sample answer
> "On the project launching a new payment method, my progress was blocked by the Platform team: they needed to rewrite the signature validation class to support the new algorithm, and their backlog was already full through Q2.
> First I quantified the block: not 'their team is slow', but 'the validation item takes 5 person-days and needs 2 days of internal review'. Knowing that clearly is what let me go to the right person with the right problem.
> I went to see their tech lead before seeing my own lead, and asked two questions: 'Is this really a high priority for you, and if not, what matters more to you?'. The real answer: they were also under a B2B contract deadline and could not prioritize me.
> From there I proposed splitting the work: I took 2 person-days from an engineer on my side, wrote the test-vector set and the sample signatures myself — that is, the input they needed — and then asked them to do only the core part. The work on their side dropped from 5 to 2 person-days — small enough that their tech lead could slot it into the middle of a sprint without missing the B2B commitment. The part I did was tests and sample data, without touching their code, so it created no ownership conflict.
> Result: the feature shipped on the milestone we had committed to the customer. After that I proposed a process change: every item that blocks progress must have a commitment milestone **in writing** from the team being depended on, and be put on a dependency board so the whole team can see it."

### Escalating in the right order
1. Talk directly to the owner (the relationship channel first).
2. Bring it to a joint meeting with a neutral party both sides trust.
3. Put it in writing: describe the block, the impact on progress in days, the options already tried, a concrete proposal, and the **milestone at which a decision is needed**.
4. Escalate to management when the priority or resource decision is beyond your reach.
Principle: escalate **with data and options**, not to "report someone". The opening sentence should be "I have determined this is a priority issue, not a competence issue. I have tried two directions, and I need you to decide which one before date X".

### Things to avoid
- **Reporting upwards immediately**, skipping the person who could solve it in 5 minutes.
- **Blaming** ("that team is slow") — it damages your credibility and helps nothing.
- **Suffering in silence** and then shouting after it is already late: by then you have lost even the right to propose.
- **Doing another team's work on your own**: creates technical debt and conflict.
- **Issuing ultimatums or threats**: you lose the relationship while the problem remains.
- **Constantly changing your proposal** without explaining why — people will stop trusting any of your proposals.

> Senior tip: a strong answer to this question is not "I got the block resolved" — because often you cannot. What is assessed is whether you **called the problem by its right name**, **tried what was within your reach**, **brought a concrete option**, and **knew when a decision from above was needed** instead of just persuading forever.`,
    follow: [
        'What do you do when the owner on the other side also has no authority to prioritize you?',
        'Have you ever had to escalate and been turned down? How did you handle it?',
        'How do you measure the size of the block so you can report progress upward honestly?'
    ]
  },
  'behavioral-017': {
    q: 'Tell us about a time you received tough feedback — not praise. How did you react, and what changed afterward?',
    a: `**Summary:** This measures **reflex** and **ability to learn**. What is evaluated most is not whether the advice was right, but your reaction in the first 5 seconds and whether you **made measurable changes in behavior**. A strong answer admits the specific error, **separates content from emotion**, then describes changes with metrics.

### Interviewer objectives
- Can you **really listen** and **self-reflect**, or just wait for your turn to talk?
- Do you turn feedback into **specific actions**?
- Do you keep a working relationship after being corrected?
- Honesty: are there times you reacted wrong?

### Three common negative reactions
| Reaction | Manifestation | Consequence |
|---|---|---|
| Defensive | explaining, justifying, changing topic | no one dares tell you the truth anymore |
| Silent | "okay, I\'ll note it" then change nothing | you don\'t know where you misunderstood |
| Counter-attack | proving the speaker wrong | relationship ruined, nothing left to learn |

### Five steps to handle
1. **Pause** for a few seconds, don\'t react immediately — especially when the first reaction is hot.
2. **Confirm you understand**: "You want me to prioritize readability over speed, right?"
3. **Ask for specific criteria**: "Specifically what would you like to see different in my PR?" — vague advice cannot be fixed.
4. **Separate content from person**: feedback is on behavior ("this PR is hard to read") not on person.
5. **Close with action + milestone + measure**, then follow up after 1–2 months.

### Sample answer
> "The toughest feedback I received was from the tech lead in a PR review: 'Your code is fast, but every time I re-read it I don\'t understand what\'s happening; I\'d rather rewrite it myself than try to understand'. That hurt because it was true, and because I was proud of my speed.
> My first reaction was defensive: I explained there were many cases to handle in one pass, and separating would create many classes. Tech lead just nodded: 'Sure, separate, but I want to be able to read it'. The conversation ended there, and I realized I had turned advice into a debate about architecture — not because I was wrong, but because I argued instead of clarifying.
> I did three things. One: **took data instead of arguing**. I measured in 2 weeks — my average function length was 78 lines, team average 24. What I called 'many cases' were actually functions holding 6 responsibilities. Two: asked straight the question I should have asked at first — 'what do you want me to optimize: speed or readability?'. The answer was readability, because after 6 months someone else has to fix my code. Three: set specific criteria — new functions no more than 30 lines, function name states responsibility clearly, no nested ifs deeper than 2 levels.
> Result after 3 months: average function length 26 lines; PR revision rounds dropped from 3.1 to 1.4; and once I detected a 90-line function in my PR and split it before sending. More important than numbers: since then I ask 'is this readable after 6 months' before every major task.
> Lesson: tough feedback often **has part of the truth**, even if the delivery makes you uncomfortable. My task is to separate those two."

### Reliable feedback sources
- **Daily code reviews** — closest, most specific, but easily misunderstood as personal criticism.
- **Incident postmortems** — usually points out what system made you err, very emotionally clean.
- **1-1 with lead** — best place to talk about impact and long-term direction.

### Things to avoid
- **Saying "you are right, I\'ll fix"** then changing nothing — next time no one will give you feedback.
- **Fixing once then acting like you\'ve improved**: sustainable change must be visible for 3 months after.
- **Counter-arguing technically immediately**, even when right: right technically but wrong in reception.
- **Concluding "I already knew"**: loses the very information you need.
- **Getting hurt by feedback on personal behavior** — separate the behavior part out.

> Senior tip: prepare **the most recent feedback** (within 3 months) and tell what you did differently. Interviewers value honesty over perfect stories — the type "I never received feedback that made me uncomfortable" is almost certainly going to be dug deep into.`
  },
  'behavioral-018': {
    q: 'You have worked with overseas clients (Japan, Europe, USA). How do cultural differences, communication, and time zones affect your work and technical design? Give a specific example.',
    a: `**Summary:** Working with overseas clients doesn\'t demand you become someone else, but demands you **adjust working processes**: write decisions asynchronously, set milestones by partner time zone, and design APIs by international standards. The hardest part is **how to respond**.

### Interviewer objectives
- Do you **understand and adapt** to cultural differences, and move communication to asynchronous (writing, recorded decisions)?
- Do you proactively account for time zones, handover processes, and local compliance, without **generalizing** like "Japanese are like X"?

### Communication trends to adapt
| Point | Japan (B2B) | Europe | USA |
|---|---|---|---|
| Decision | prioritize official documents, many approval rounds | by process and role | by data, fast decisions |
| Feedback | indirect; "will consider" is not yes; values early reporting (Hō-Ren-Sō) | direct on work, indirect on person | direct, both praise and critique |
| Documentation | very important, especially API docs | mandatory for audit | needed for scale, values speed |
| Commitments | stable, changing needs notice | follow signed commitments | flexible, MVP is reasonable |

Treat these as **tendencies to adapt**, not laws about people. The safe approach is **ask again**.

### Technical design influence
- **API contracts**: clear versions, OpenAPI docs, commitment not to break contracts long enough for partners to update clients.
- **Data compliance**: Japan uses APPI, Europe GDPR, California CCPA — affects storage location, duration, and deletion rights.
- **Time zones**: always store UTC, display by user time zone; "today" criteria by business time zone of the market.

### Time zone influence on operations
- **Shift handover**: clear runbooks, access rights not dependent on person in other time zone; **deployment window** shouldn\'t fall into partner work hours.
- **Incidents**: have staff on call by customer hours, alerts to their specified points of contact.
- **Asynchronous exchange**: decisions are in docs not meetings — meetings only occur when two time zones overlap.

### Sample answer
> "I led integration with a retail partner in Japan. Initially everything went through email — and I made a clear mistake: I sent isolated questions at 16:00 VN time, 18:00 Japan time, when they were off. Each Q&A round took an entire day, they needed internal approval before official replies, so a question about data format took nearly 2 weeks to settle.
> I changed three things. One, schedule: every meeting with partners was at 9 or 10 Japan time, 7 or 8 VN time — I accepted waking early instead of pushing their schedule. Two, convert decisions to asynchronous writing: a shared Q&A table, grouped by topic, each row with owner, deadline, and confirm status — I didn\'t take silence as yes, because Japan side often needed internal approval before official reply. Three, technical: moved API to have OpenAPI docs and commitment not to break contracts for 6 months, because partner needed time to approve clients.
> Result: Q&A rounds per integration request dropped from avg 6 to 2, and no request had to be redone because of misunderstanding. I also learned: polite 'no problem' answers aren\'t always commitment, so I always ask again with a specific question with date/time, e.g. 'I send API docs at 10 AM Tuesday Japan time, can you confirm this schedule?'"

### Things to avoid
- **Sending machine translations without proofreading** and **using internal idioms/abbreviations**: very easy to misunderstand; write short, clear sentences, with specific examples.
- **Guessing "Japanese are slow to decide"** or **ignoring local compliance**: bad impression and contract risk.
- **Flexible scheduling to the point you have to be online at 11 PM**: solve with asynchronous documentation.

> Senior tip: the simplest and most effective tool when working across time zones is **three principles**: write every decision into docs, set deadlines by reader time zone, and always end with a specific question with date/time. Those three things eliminate most time zone mismatch incidents, without needing to "learn cultural communication" in general.`
  },
  'behavioral-019': {
    q: 'As a senior/lead, how do you interview candidates? How do you design the interview loop, and what criteria do you evaluate candidates on?',
    a: `**Summary:** The interviewer's role is **assessing competence through observable evidence**, not just getting through the questions. A good interview loop has **grading criteria written in advance**, every question tied to a **signal to look for**, and scores based on evidence. The hardest part is **keeping consistency across several interviewers** in the same decision.

### What the interviewer is assessing
- Can you **design a hiring process** instead of saying "I ask a few questions and go by feel"?
- Can you tell a strong candidate apart from a candidate who **talks well**, and do you prepare grading criteria **before** the interview?
- Can you handle disagreement between interviewers professionally?
- Do you assess the **risk of a bad hire** (cost, impact on progress and team morale)?

### Designing the interview loop
| Round | Goal | Format | Signal to look for | Interviewer |
|---|---|---|---|---|
| 0. Screening | experience, salary, availability | 20–30 min | motivation, salary expectation, reason for leaving | recruiter or tech lead |
| 1. Technical fundamentals | depth of knowledge, analytical thinking | 45 min, ask about systems they have built | how they break the problem down, talk about trade-offs | senior dev |
| 2. Coding round | write real code while the interviewer watches | 60 min, a problem with edge cases | breaking into steps, handling edge cases, communication | senior dev |
| 3. System design | design at large scale | 45 min | trade-offs, measurement, operations, cost | tech lead or architect |
| 4. Culture and role | working style, handling situations | 30 min | sense of responsibility, how they respond to feedback | lead or manager |

### Rubric — write it before, grade after
Each criterion needs **3 levels**, each described by observable behavior.
| Criterion | Below level | At level | Above level |
|---|---|---|---|
| Problem solving | needs to be led by the hand | breaks the problem down and asks the right questions | changes direction when new information arrives |
| Systems thinking | only talks about CRUD | understands the trade-offs of the choice | states operational risk and how to measure it |
| Code quality | runs but is messy | clear, with tests | also handles error paths and boundaries |
| Communication | answers a different question | answers correctly and concretely | adjusts the presentation to the listener |

### Open questions and the signals that go with them
- "Tell me about a time you had to undo a technical decision that had the biggest impact. What did you do?" → signal: admits the mistake, has numbers, has a process change.
- "Tell me about a time you worked with a non-technical stakeholder. How did you translate the problem into their language?" → signal: translates into business value.
- "What did you do when you knew you would miss a deadline?" → signal: reports early, has an option.

### Preparation and grading process
1. **Before the interview**: read the CV, pick the 2–3 most important criteria, lock in the signal to look for.
2. **During the interview**: open with open-ended questions, let the candidate talk for most of the time, do not lead.
3. **Right after the interview, within 15 minutes**: record the evidence and grade by the rubric — **before** looking at anyone else's score.
4. **Debrief**: compare evidence, not feelings; when there is disagreement, the dissenter must bring evidence.
5. **Decision**: based on evidence and risk, not on the overall impression.

### Sample answer (STAR)
> "Last year my team needed to hire 3 backend seniors. **S**: the old process was that each person asked whatever they liked and then the debrief ran on feelings; in 6 months, 2 hires failed probation because they could not design a feature on their own. **T**: I was assigned to redo the technical round. **A**: I wrote a rubric with the 4 criteria in the table above, each round got one fixed exercise (the coding exercise was realistic: add idempotency to an existing payment API with code already in place, instead of a puzzle-style algorithm), required every interviewer to submit a score with evidence before entering the debrief, and had the 4 people on the team run mock interviews with each other for 2 sessions to align on how to grade. **R**: the time from round 1 to offer dropped from 5 to 3 weeks; the spread of scores between interviewers narrowed clearly (before, there were cases where one gave 1 and another gave 4); all 3 people hired that cycle passed probation. What I have not done yet is go back after 1 year and check whether interview scores correlate with actual performance."

### Things to avoid
- **Asking "how many years of experience do you have"**: it cannot separate strong people from people who are just coasting.
- **Leading too much** so the candidate feels "great": you are measuring comfort, not competence.
- **Asking for opinions instead of actions**: "what do you think about Kafka" cannot tell candidates apart; "how do you handle it when Kafka fails" can.
- **Vibe check**: a feeling of "fitting in" is a weak signal and tends to exclude minority groups.
- **Not grading by the rubric**, or letting other people's scores sway your own.
- **Not reading the CV beforehand**: asking back what is already written wastes both sides' time.
- **Pushing candidates to tell confidential details of their current company** (business numbers, sensitive internal architecture): a candidate who is willing to tell is a bad signal about security mindset, and you create legal risk.

> Senior tip: a good interviewer does not try to prove they are smart, but tries to make the candidate feel **fairly evaluated and given the best chance to perform** — even when they answer wrong. If candidates feel they are "sitting an exam", they will act, and you will hire the person who is good at acting.`,
    follow: [
        'What do you do when one interviewer on the team gives a score that is completely out of line with the others?',
        'Do you have a criterion for deciding a candidate is "good enough" for this position?',
        'How do you hire strong candidates when the market is highly competitive and candidates have many options?'
    ]
  }
});
