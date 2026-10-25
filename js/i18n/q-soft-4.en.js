/*
 * English translation of js/data/q-soft.js — task T219. Format: js/core/i18n.js (content overlay).
 * ids: testing-016 behavioral-013 behavioral-014 behavioral-015 behavioral-016 behavioral-017 behavioral-018 behavioral-019
 */
App.i18n.content({
  'testing-016': {
    q: 'How do you test the system\'s resilience — injecting network failures, timeouts, downstream service crashes, Kafka connection losses? What do you do in staging environments, and what tools do you use (WireMock, Resilience4j, Toxiproxy)?',
    a: `**Summary:** Resilience testing has **three layers**: unit tests for fallback/retry logic with fake dependencies, integration tests with **WireMock** to reproduce timeouts, 5xx errors, and connection resets, and **chaos tests in staging** with Toxiproxy to simulate network partitions and pod kills. Fundamental principle: every fault injection must be tied to a **steady-state hypothesis** and an **abort condition** — without them, chaos testing is just causing disorder.

### Three layers of resilience testing
| Layer | Tool | Simulated impact | Answers |
|---|---|---|---|
| Unit | fake client, fake clock | throw exception, return error | Is fallback/retry logic correct? |
| Integration | WireMock | 500, delay, connection reset | Is the circuit breaker opening correctly? Are timeouts handled? |
| Staging / chaos | Toxiproxy, kill pod | real network loss, broker crash | Does the system survive dependency failures? |

### Integration layer — WireMock + Resilience4j
~~~java
@Test void breaker_opens_after_repeated_failures() {
    var server = new WireMockServer(0);                 // random port
    server.start();
    server.stubFor(get("/api/inventory").willReturn(serverError()));   // downstream returns 500
    var client = RestClient.create("http://localhost:" + server.port());
    var breaker = CircuitBreaker.of("inventory", CircuitBreakerConfig.custom()
        .slidingWindowSize(4).minimumNumberOfCalls(4)   // default requires 100 calls to evaluate
        .failureRateThreshold(50).build());
    Supplier<String> guarded = CircuitBreaker.decorateSupplier(breaker,
        () -> client.get().uri("/api/inventory").retrieve().body(String.class));

    for (int i = 0; i < 4; i++)                         // 4 actual 500s over HTTP
        assertThrows(HttpServerErrorException.class, guarded::get);
    assertThat(breaker.getState()).isEqualTo(CircuitBreaker.State.OPEN);
    assertThrows(CallNotPermittedException.class, guarded::get);  // blocked, call not made
    server.verify(4, getRequestedFor(urlEqualTo("/api/inventory")));
    server.stop();
}
~~~
- WireMock also simulates {{withFixedDelay}} to create **real timeouts** and {{Fault.CONNECTION_RESET_BY_PEER}} to simulate partial connection loss — the two most common errors in production.
- With resilience4j-spring-boot3 (also where Spring Cloud CircuitBreaker reads config), thresholds are set via property {{resilience4j.circuitbreaker.instances.inventory.sliding-window-size}}.
- To inject network faults directly in integration tests, Testcontainers has a {{ToxiproxyContainer}} placed between the app and Postgres/Kafka containers.
- **Always assert both fallback behavior** (return cache, empty list, clear error code), not just that the breaker is OPEN.

### Staging layer — Toxiproxy to inject real network faults
Toxiproxy sits between the service and Postgres: define a proxy pointing to Postgres and enable "poisons" on the fly: {{latency}}, {{bandwidth}}, {{timeout}}, {{reset_peer}}, {{slow_close}}, {{slicer}} — sufficient to simulate almost any network event without changing application code.

### Chaos scenarios to have in staging
1. **Latency**: add 800 ms to Postgres ⇒ is the client timeout appropriate, can the connection pool handle it?
2. **Connection loss**: {{reset_peer}} during a write ⇒ does the transaction rollback correctly?
3. **Broker crash**: stop Kafka container ⇒ does the consumer retry, have DLT, does the service survive?
4. **Pod kill**: delete pod while processing an order ⇒ is order processing partial or duplicated, does graceful shutdown work?

### Ordered and safe chaos procedure
- Write a **steady-state hypothesis** first: "when Postgres lags by 800 ms, the order API returns 503 within 2 seconds and error rate is below 1%".
- Write an **abort condition**: "if error rate exceeds 5% for 2 minutes, stop immediately and rollback".
- Have a **monitor** watching the dashboard and debug commands ready; run only in **staging** with simulated data, production needs permission and small time windows.

### Common pitfalls
- **Retry without jitter** ⇒ when downstream recovers, all clients retry simultaneously and kill it a second time.
- **Circuit breaker without fallback** ⇒ errors propagate directly from the faulty service upstream; add **bulkhead** to limit concurrent requests.
- **Client timeout larger than caller timeout** ⇒ caller runs out of time before client can return an error, and the thread remains blocked.
- **Writing "resilience tests" by mocking a 500 return** ⇒ mocks don\'t simulate pool exhaustion, blocked threads, or DNS failures.

> Senior tip: measure **SLO before and after** every resilience configuration change. E.g., "adding circuit breaker with 50% error threshold over 20 calls, fallback returning cache ⇒ API p99 order reduced from 4.2 seconds to 300 ms". This number turns a config decision into one defensible to the boss and the team.`,
    follow: [
        'How do you define the steady-state hypothesis and abort condition for each service?',
        'How do you control blast radius when running chaos in staging with near-production data?',
        'Do you automate chaos test runs by schedule (nightly), and how do you handle results?'
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
    q: 'Project progress is blocked by another team and you cannot decide alone. What do you do to unblock without ruining relationships and without losing credibility?',
    a: `**Summary:** Being blocked by other teams is daily life, and the real question is do you **call the problem by its name**. Effective process: **quantify the block → find the owner → understand their constraints → propose beneficial options → decouple what you can do yourself → escalate with evidence and decision milestones**. Key point: escalate to **ask for a decision**, not to tattle.

### Interviewer objectives
- Do you distinguish between "blocked due to priority" and "blocked due to lack of competence"?
- Are you proactively unblocking instead of waiting?
- Do you bring options beneficial to **both sides**, or just push the ball?
- Do you escalate in the right order and way?
- Do you know when to stop persuading and turn to deciding?

### Five steps to unblock
1. **Quantify specific blocking**: not "Platform team is slow" but "Item X needs 5 person-days and depends on Item Y". No numbers, no negotiation.
2. **Find the owner** of that item, not the person who replies to emails.
3. **Understand their constraints**: what they are busy with, who is pushing them, what they need to prioritize you.
4. **Propose beneficial options**: share work, lend staff or resources, or take the heaviest prep work yourself.
5. **Decouple what you can do yourself** to keep the project moving while waiting.

### Sample answer
> "In the new payment method launch project, my progress was blocked by the Platform team: they needed to rewrite the signature validation class to support new algorithms, and their backlog was full through Q2.
> Step one, I quantified the block: not 'their team is slow', but 'validation item takes 5 person-days and needs 2 days of internal review'. Knowing that clearly, I could find the right person and problem.
> I met their tech lead before the lead of my side, and asked two questions: 'Is this really a high priority for you, and if not, what matters more to you?'. Real answer: they were also on an B2B contract deadline and couldn\'t prioritize mine.
> From there I proposed sharing parts: I took 2 person-days from my side, wrote the test vectors and sample signatures myself — the input they needed — then asked them to only do the core part. Waiting time dropped from 5 days to 2, and the part I wrote was outside their code so it didn\'t create technical debt.
> Result: feature launched on time. Afterward, I proposed a process change: every blocking item must have a commitment milestone **in writing** from the dependent team and put on a dependency board so the whole team sees it."

### Proper escalation order
1. Talk directly to owner (relational channel first).
2. Bring to a common meeting with a trusted neutral party on both sides.
3. Put it in writing: describe block, progress impact in days, tried options, specific proposal, and **milestone requiring decision**.
4. Escalate to management when priority or resource decisions are beyond your reach.
Principle: escalate **with data and options**, not to "tattle on someone". Opening sentence should be "I have identified this as a priority issue, not a competence issue. I tried two directions, need you to decide which one by date X".

### Things to avoid
- **Reporting upwards immediately**, skipping those who could solve in 5 minutes.
- **Blaming** ("team is slow") — loses credibility and helps nothing.
- **Silently suffering then screaming when late**: then you lose both leverage and proposal right.
- **Doing the team\'s work yourself**: creates technical debt and conflict.
- **Ultimatums or threats**: loses relationship while the issue remains.
- **Changing proposals constantly** without explanation — they no longer trust any proposal of yours.

> Senior tip: a strong answer for this isn\'t "I solved the block" — because sometimes you can\'t. What\'s evaluated is that you **called the problem by its name**, **tried what was in your power**, **brought a specific option**, and **knew when to require an upward decision** instead of just persuading forever.`
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
    q: 'As a senior/lead, how do you interview candidates? How do you design the interview round, and what criteria do you base evaluation on?',
    a: `**Summary:** The role of the interviewer is **assessing competence via observable evidence**, not just asking questions. A good interview round has **pre-written grading criteria**, every question tied to a **signal to find**, and scores based on evidence. The hardest part is **consistency between interviewers** in the same decision.

### Interviewer objectives
- Do you **design the hiring process** instead of saying "I ask a few questions then feel it"?
- Can you distinguish great candidates from **great talkers**, and prepare grading criteria **before** the interview?
- Can you handle disagreement between interviewers professionally?
- Do you evaluate **risk of hiring wrong** (cost, impact on progress and team morale)?

### Interview round design
| Round | Goal | Format | Signal to find | Interviewer |
|---|---|---|---|---|
| 0. Screening | experience, salary, availability | 20–30m | motivation, salary expectation, reason for leaving | recruiter or tech lead |
| 1. Tech basics | knowledge depth, analytical mind | 45m, ask about built systems | decomposing, tradeoff talk | senior dev |
| 2. Coding | real code under eyes | 60m, problem with edge cases | decomposition, edge handling, communication | senior dev |
| 3. System design | design at scale | 45m | tradeoff, measurement, operation, cost | tech lead or architect |
| 4. Culture/Role | working style, situation handling | 30m | responsibility, feedback approach | lead or manager |

### Rubric — write before, grade after
Each criterion needs **3 levels** described by observable behavior.
| Criterion | Below level | At level | Above level |
|---|---|---|---|
| Problem solving | needs hand-holding | decomposes and asks right questions | redirects with new information |
| Systems thinking | CRUD only | knows tradeoff of choices | states operational risk and measurement |
| Code quality | runs but messy | clear, with tests | handles edge cases and boundaries |
| Communication | answers off-topic | answers correctly and specifically | adjusts presentation to listener |

### Open questions and accompanying signals
- "Tell me about the time you had to fix a technical decision that had a major impact. What did you do?" → signal: admit error, have data, have process change.
- "Once you had to work with a non-technical stakeholder. How did you translate the issue to their language?" → signal: translates to business value.
- "What did you do when you knew you would miss a deadline?" → signal: report early, have option.

### Preparation and grading process
1. **Before interview**: read CV, select 2–3 most important criteria, confirm signal to find.
2. **During interview**: open with open questions, let candidate talk most, do not lead.
3. **Right after interview, in 15 mins**: record evidence and grade by rubric — **before** seeing others\' grades.
4. **Debrief**: compare evidence, not feelings; when disagreeing, the dissenter must bring evidence.
5. **Decision**: based on evidence and risk, not overall impression.

### Things to avoid
- **Asking "how many years of experience"**: cannot distinguish great people from average people.
- **Leading too much** so the candidate feels "great": you are measuring comfort, not competence.
- **Asking for opinion instead of action**: "what do you think about Kafka" cannot distinguish; "how do you handle Kafka failure" does.
- **Vibe check**: feeling "compatible" is a weak signal, tends to exclude minorities.
- **Not grading by rubric**, or letting others\' grades sway your own.
- **Not reading CV beforehand**: asking back what\'s already written, wasting time.
- **Forcing candidates to tell current company secrets** (business data, sensitive architecture): candidate telling is a bad signal on security mindset, and you create legal risk.

> Senior tip: great interviewers don\'t try to prove they are smart, but try to make the candidate feel **fairly evaluated and having the best opportunity to perform** — even when they answer wrong. If candidates feel they are "taking a test", they will perform, and you will hire the great actor.`
  }
});
