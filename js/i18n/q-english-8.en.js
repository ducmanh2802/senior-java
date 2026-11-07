/*
 * English translation of js/data/q-english.js — task T675. Format: js/core/i18n.js (content overlay).
 * ids: english-072 english-073 english-074 english-075 english-076 english-077 english-078 english-079 english-080
 */
App.i18n.content({
  'english-072': {
    q: 'I see your last role ended recently. Why are you looking for a new job right now? (You were affected by a layoff.)',
    a: `**Summary:** Tell the truth in **1–2 sentences, neutral, without emotion** ("the company closed the product line, the whole team was affected"), immediately offer **one piece of evidence that you are still valuable** (you were kept on for the handover, one result with numbers), then **turn toward the future** and connect it to this exact role. Keep the whole answer under 60 seconds.

### Sample answer
My last role ended in September because the company closed its payments product line, and the whole team of twelve engineers was affected. It was a business decision about the product, not about individual performance. In fact, I was asked to stay an extra month to hand over the settlement service to the core platform team, which I did.

I'm proud of what we built there. I owned the Spring Boot services that handled refunds, and we cut the average refund time from two days to under four hours.

So now I'm looking for a team where I can do the same kind of work at a larger scale: Java backend, transaction-heavy systems, and real ownership in production. That's why this role caught my attention. Your job description mentions rebuilding the ledger service, and that's exactly where my experience fits.

I'm actively interviewing, and I could start within two weeks.

### Why this answer works
When the interviewer learns you were just laid off, they usually carry **three unspoken worries** they will not ask about directly. A good answer handles all three without being asked:

| The unspoken worry | The sentence in the sample that handles it |
|---|---|
| Were you the one picked because you performed badly? | "the whole team was affected", "a business decision about the product" |
| Are you bitter, will you badmouth your old company? | A neutral tone, "I'm proud of what we built" |
| Are you desperate, about to accept anything and then leave? | Naming the kind of work you want and the reason you chose **this** company |

Three-part structure:
1. **A short fact** (1–2 sentences). The longer you explain, the more it sounds like you are making excuses.
2. **Evidence of value**: being asked to stay for the handover is a very strong signal that you were not cut for performance. Add one result number.
3. **Forward-looking**: the work you want + a specific point from the JD. This part should take most of the time.

If the layoff cut only **part** of the team (for example 30%), do not claim the whole team. Say: "The company reduced engineering by about thirty percent across all teams, and my role was one of them." That sentence is still neutral and still true.

### Useful phrases
- **my role was affected by a restructuring**: my position was hit by the reorganisation
- **my position was eliminated**: my job was cut, not because of my performance
- **it was a business decision, not about performance**: the company decided about the product, not about me
- **I was asked to stay to hand over**: they invited me to remain in order to transfer my work
- **that's exactly where my experience fits**: that is precisely where my background applies
- **I'm actively interviewing**: I am interviewing elsewhere right now (implying: you have other options)

### Common mistakes Vietnamese speakers make
- Saying **"I was fired"** when you mean you were laid off. "Fired" means **dismissed for personal fault**. The correct wording is **"I was laid off"** or "my position was eliminated".
- Telling the story of how badly the old company was run, how the CEO chose the wrong strategy: even if it is true, the interviewer only hears "this person blames others".
- Lying about still being employed. Reference checks, social insurance records or LinkedIn will expose it, and then you lose the offer because of **honesty**, not because of the layoff.
- **"I'm open to anything"** sounds desperate. Name the kind of work you actually want.
- Tense: "My company close the team" → **"My company closed the team"**; the event is finished, so use the past tense.

> Senior tip: In 2025–2026 a layoff is normal; interviewers have heard it dozens of times and do not judge you for it — they judge **how you tell it**. Rehearse this part out loud ten times, keep it under 60 seconds on a timer, until your voice is completely calm. Line up one reference (your former tech lead) who agrees to confirm "he was affected by the project cut". One confirming word from an outsider is stronger than any amount of self-justification.`,
    follow: [
      'Why do you think your role was selected and not others?',
      'What did you learn from going through a layoff?',
      'Are you also interviewing with other companies right now?',
    ],
  },
  'english-073': {
    q: 'I see a gap of about eight months in your CV. What have you been doing during that time?',
    a: `**Summary:** Do not apologise, do not dodge it. **Acknowledge it right away**, present the gap as **a deliberate plan**, show **concrete verifiable output** (a repo, a certification, a freelance project), keep any personal reason to one sentence, and finish by stating that you are ready to commit to a full-time team for the long term.

### Sample answer
That's right. After my role was cut in March, I made a deliberate decision not to jump into the first offer. I gave myself a plan for the gap, and I can show you what came out of it.

First, I closed the skill gaps I kept noticing at work. I upgraded a side project from Java 11 to Java 21 and Spring Boot 3, deployed it on AWS with Terraform, and wrote two blog posts about the migration problems I hit, like the javax-to-jakarta package change. The code and the posts are on my GitHub.

Second, I did about three months of freelance work for a logistics startup. I built their order-tracking API, and it's still running in production.

I also took six weeks for a family matter, which is now fully resolved.

So I'm not rusty. If anything, I'm more up to date than I was a year ago, and I'm ready to commit to a full-time team for the long term.

### Why this answer works
The interviewer asks about the gap because of three concerns:
1. **Skills going stale (rusty)**: after 8 months away from production code, can you still keep up?
2. **A market signal**: why did nobody hire you in 8 months? Is there something wrong with you?
3. **Stability**: is that personal reason over, or will it make you quit halfway?

The sample answer addresses all three: (1) a Java 21, Spring Boot 3, AWS project **verifiable on GitHub**; (2) "deliberate decision" turns waiting time into a choice you made on purpose; (3) "fully resolved" and "ready to commit for the long term".

Wording for each type of real reason:

| The real reason | A short, honest way to say it |
|---|---|
| A slow job search after a layoff | "The market was slow, so I used the time to upgrade my skills. Here is what I built." |
| Family / health | "I took time off for a family matter. It's fully resolved now." (no further details) |
| Self-study, certifications | "I studied for the AWS Solutions Architect Associate exam and passed it in June." |
| Freelance, own startup | "I worked as a freelancer. I can walk you through one of the systems I built." |

The rule: **the shorter the personal reason, the better**; **the more detailed the output, the better**. The interviewer does not need to know which illness; they need to know that you are ready.

### Useful phrases
- **I made a deliberate decision to**: I chose this on purpose, it was not an accident
- **I closed the skill gaps I kept noticing**: I filled the holes in my skills that I kept running into at work
- **it's still running in production**: that system is live today, serving real users
- **a family matter, which is now fully resolved**: a family issue, settled completely
- **I'm not rusty**: my skills have not gone stale
- **ready to commit for the long term**: prepared to stay for years, not to leave after a few months

### Common mistakes Vietnamese speakers make
- Opening with **"Sorry, I know it's not good..."**. Apologising turns a neutral fact into a weakness.
- Answering **"I just relaxed"** or "I was looking for a job" with nothing concrete to show.
- Giving too many medical or family details: it makes people uncomfortable and pulls the focus away.
- Inventing a company to cover the gap. Many companies in Vietnam check social insurance history or call references; getting caught means losing the offer on the spot.
- Wrong preposition: "during eight months" → **"for eight months"** (a length of time) or "during that time".

> Senior tip: If you are in a gap right now, **keep a gap journal** starting today: one line per week about commits, articles, certifications, small projects. In the interview you then have real figures to tell ("12 posts, 1 certification, 1 production API"). One repo with a good README, passing tests and green CI is more convincing than any explanation. Senior interviewers often open GitHub during the interview itself, so make sure every repo you mention is genuinely tidy.`,
    follow: [
      'Why did it take eight months to find a new role?',
      'Can you walk me through the side project you mentioned?',
      'How would you get back up to speed in a new codebase in your first month?',
    ],
  },
  'english-074': {
    q: 'Why should we hire you over the other candidates?',
    a: `**Summary:** Do not compare yourself with the other candidates (you know nothing about them). **Map your evidence onto the exact problem in the JD**: two before/after results with numbers, one point about ownership/operations, then close with a single summary line — "if you need X, I have done X". Be ready to be pushed on every number.

### Sample answer
I can't speak for the other candidates, but I can tell you what I'd bring in the first six months.

Your job description mentions two problems: slow checkout during sales campaigns and a monolith that's hard to change. I've solved both before. At my last company, our order service fell over during every flash sale. I led the work to cache the product catalog in Redis and move stock reservation to a Kafka-based flow. Peak throughput went from about 800 to 5,000 requests per second, and p99 latency dropped from two seconds to around 300 milliseconds.

I also helped split our payment module out of a Spring monolith using the strangler fig pattern. No big-bang rewrite, no downtime, and it took four months with a team of five.

Beyond the code, I'm the person who writes the runbook and fixes the alert after an incident. That's why I was the on-call lead for two years.

So if you need someone who can deliver on those exact problems quickly, I think I'm a strong fit.

### Why this answer works
This question really means: **"Connect your experience to our pain."** In layoff times every senior opening gets hundreds of applications, so generic lines like "hard-working, fast learner" do not separate you from anyone else.

How to prepare (do this before the interview, about 30 minutes):
1. Read the JD and underline **2–3 business/technical problems** (scale, legacy code, reliability, cost).
2. For each problem, choose one of your stories that has **numbers before and after** (throughput, latency, error rate, deploy time, cloud cost).
3. Add one pillar **outside code**: on-call, mentoring, writing documentation, coordinating across teams. This is what distinguishes senior from mid.
4. Close with one summary sentence, and do not drag it out.

| Weak sentence | Strong sentence |
|---|---|
| "I'm hard-working and I learn fast." | "I cut p99 latency from 2 seconds to 300 milliseconds during flash sales." |
| "I have experience with microservices." | "I split payments out of a monolith in four months with zero downtime." |
| "I'm a team player." | "I was on-call lead for two years and wrote our incident runbooks." |
| "I'm better than other candidates." | "I can't speak for others, but here's what I'd bring." |

**Your numbers must be defensible.** The interviewer will almost certainly follow up with: "How did you measure p99?", "What was your part, and what was the team's?". You need to be able to answer: measured with Micrometer + Prometheus/Grafana, comparing the two sale events before and after, my part was designing the cache and reviewing the reservation code. If you do not remember exactly, use **"roughly"** or "about" — never invent a precise-looking number like "4,873".

### Useful phrases
- **I can't speak for the other candidates, but**: I have no way of judging the others, but
- **what I'd bring in the first six months**: what I would deliver in the first half year
- **your job description mentions**: the JD you published mentions
- **I've solved both before**: I have already dealt with both of these problems
- **deliver on those exact problems**: get results on precisely those issues
- **a strong fit**: a very good match

### Common mistakes Vietnamese speakers make
- Being too modest: "I think maybe I am not the best, but I will try my best." International interview culture expects you to be **confident, with evidence**.
- Using "we" for everything: the interviewer cannot tell what you personally did. Use **"I led", "I designed"** for your part, and "we" for the team's outcome.
- Listing technologies ("Java, Spring, Kafka, Redis, Docker...") instead of results.
- Misreading numbers: "5,000" is **"five thousand"**, "p99" is read **"p ninety-nine"**, and "300 milliseconds" is never said as "300 mili".

> Senior tip: Keep a written "brag document": 5–7 achievements, each with the context, what you did, the metric, and how it was measured. Before each interview, pick the 2–3 that best match the JD. At senior level, interviewers rate **"Here's the trade-off we accepted"** very highly. For example: "Caching gave us speed, but we accepted that prices could be up to 30 seconds stale." A result with a price attached to it sounds far more real than a flawless success story.`,
    follow: [
      'How did you measure the p99 latency before and after?',
      'What part of that project was yours, and what did the team do?',
      'What would you do differently if you started that project again?',
    ],
  },
  'english-075': {
    q: 'A lot of code is now written with AI assistants. How do you make sure AI-generated code is correct before it reaches production? Give me a real example.',
    a: `**Summary:** Answer with a **verification process**, not with an attitude. Treat AI code like **a pull request from a new teammate**: write or review the tests first, read every line, and let the pipeline (static analysis, integration test, load test) catch the errors. Include **one real example** where you caught a bug in AI-generated code, plus the cost had it reached production.

### Sample answer
I treat AI-generated code exactly like a pull request from a new teammate: useful, but unproven until it passes the same checks as everything else.

My process has three steps. First, I write or review the tests before I trust the implementation, especially edge cases like null input, empty lists, time zones and concurrent access. Second, I read every line and ask myself, "Can I explain why this is correct?" If I can't, I rewrite it. Third, I let the pipeline do its job: static analysis, integration tests with Testcontainers against a real PostgreSQL, and a load test for anything on a hot path.

Here's a real example. I asked an assistant to add retry logic to a payment call. The code looked clean, but it retried on every exception, including a read timeout after the payment had actually succeeded. That would have charged some customers twice. I caught it because my test simulated a timeout on a successful call. The fix was to send an idempotency key and retry only on errors that were safe to retry.

So AI makes me faster, but the responsibility for correctness stays with me.

### Why this answer works
By 2026 almost every team uses AI. The question is no longer "do you use it" but **"do you know how to control its quality"**. Employers are cutting the people who do repetitive work and keeping the people who can **evaluate, review and take responsibility**. So your answer has to show that you are the one in control, not the one pressing Accept.

Where AI typically goes wrong in Java backend code (naming 1–2 of these already shows experience):

| Type of bug | A concrete example | How to catch it |
|---|---|---|
| Non-idempotent retry | Retrying a payment call after a timeout → the customer gets charged twice | A test that simulates a timeout on a call that already succeeded; an idempotency key |
| Transaction | Calling a {{@Transactional}} method from the same class (self-invocation), so the proxy never runs | An integration test that checks the rollback really happens |
| Concurrency | A {{HashMap}} shared between several threads | Review + a multi-threaded test repeated many times |
| Old / non-existent API | {{javax.persistence}} on Spring Boot 3 (it has to be {{jakarta}}), or a suggested {{WebSecurityConfigurerAdapter}}, which was removed in Spring Security 6 | Compile it + read the official docs |
| Missing bounds | A cache with no size or expiry, a query with no pagination | Load test, review checklist |

The example in the sample answer is strong because it has all **four elements**: code that looks right → a subtle bug → a business consequence (charging twice) → how it was caught by the process (the test), not by luck.

### Useful phrases
- **unproven until it passes the same checks**: not trustworthy until it clears exactly the same gates
- **Can I explain why this is correct?**: am I able to justify why it is right?
- **on a hot path**: on a code path that runs very often and is performance-sensitive
- **retry only on errors that are safe to retry**: retry only where retrying cannot duplicate the work
- **the responsibility for correctness stays with me**: I still own the correctness, not the tool

### Common mistakes Vietnamese speakers make
- A generic "I always check carefully" with no process and no example.
- Boasting about productivity, "AI writes 80 percent of my code", without saying how you control it; the interviewer hears "risk".
- Confusing the wording: "AI-generated code" (code produced by AI), not "AI-generating code".
- Missing article: "I asked assistant to add retry" → **"I asked an assistant to add retry logic"**.

> Senior tip: At senior/lead level, add one sentence about **team-level rules**, not only your personal habits: "In my team, AI-assisted pull requests go through the same review bar, and anything touching money, security or concurrency needs a second reviewer." If you have numbers (for instance: test-writing time down about 30 percent, no increase in bugs reaching production), state them. That is evidence you use AI to **raise productivity in a controlled way**, which is exactly what companies look for while cutting headcount.`,
    follow: [
      'Have you ever merged AI-generated code that later caused a bug?',
      'How would you set rules for AI usage in a team of junior developers?',
      'Which tasks do you think AI still cannot do well in backend development?',
    ],
  },
  'english-076': {
    q: 'Walk me through a production incident you owned, step by step: the timeline, the impact, the root cause, the fix, and what you changed to prevent it.',
    a: `**Summary:** Tell it like **a postmortem spoken out loud**, in exactly 5 parts and this order: **detection + timestamps → impact with numbers → mitigation → root cause with evidence → the fix and prevention**. Use concrete times so the story has rhythm, say "I" for your own part, and keep a blameless tone.

### Sample answer
At 10:05 on a Monday, we got an alert: the pricing service had restarted fourteen times in twenty minutes. The JVM was throwing OutOfMemoryError, health checks were failing, and Kubernetes kept restarting the pods.

The impact was that, for about fifty minutes, roughly thirty percent of price requests from the mobile app failed, and we estimated around two thousand abandoned checkouts.

At 10:15, I checked the deploy history and saw a release at 9:40. Since the timing matched, I rolled back instead of debugging live. Errors dropped to zero by 10:30.

Afterwards, I analysed the heap dump we had captured on the crash. A new in-memory cache used a ConcurrentHashMap keyed by user and product, with no size limit and no expiry. Under real traffic, it grew until the heap was full.

We replaced it with a Caffeine cache with a maximum size and a ten-minute expiry, and load-tested it with production-like traffic. To prevent it happening again, we added an alert on heap usage after GC and a review rule: every cache needs a size limit and an expiry.

### Why this answer works
The incident question is **almost certain** to appear in a senior round, because it shows how you behave under pressure. Interviewers score five signals:

| Part | What the interviewer is checking | Sentence in the sample |
|---|---|---|
| Detection | Did you find out through monitoring, or did a customer report it? | "we got an alert" |
| Impact | Do you think in users and business terms? | "30 percent of price requests", "2,000 abandoned checkouts" |
| Mitigation | Do you know "stop the bleeding first, treat later"? | "I rolled back instead of debugging live" |
| Root cause | Do you have evidence, or just a guess? | "heap dump", "no size limit and no expiry" |
| Prevention | Did you fix the system and the process, not only the code? | alert + review rule |

A few small technical details make the story believable:
- **Roll back before debugging**: when the deploy time matches the failure time, a rollback is the fastest way to reduce damage. Debugging live on a production system that is on fire is a common mistake.
- **A heap dump at crash time**: the JVM can write a heap dump automatically when it hits OutOfMemoryError, using {{-XX:+HeapDumpOnOutOfMemoryError}}. Mentioning it shows you had already prepared for an incident.
- **"Heap usage after GC"**: the heap before GC always fluctuates; it is the heap **after GC** creeping upwards that signals a leak. Technical interviewers reward this point.

If you get interrupted with "Why not just give the pods more memory?", answer: "That would only delay the crash, because the cache had no upper bound. More memory would have hidden the bug for a few more hours."

### Useful phrases
- **we got an alert**: monitoring sent us a notification
- **the timing matched**: the two points in time lined up
- **I rolled back instead of debugging live**: I reverted the release rather than debug in production
- **production-like traffic**: load shaped like real traffic
- **to prevent it happening again**: so that it cannot recur

### Common mistakes Vietnamese speakers make
- Confusing the noun and the verb: **"a rollback"** (noun, one word) but **"to roll back"** (verb, two words). Same pattern as "a setup" / "to set up".
- Reading the clock: "10:05" is **"ten oh five"**, never "ten zero five".
- Blaming someone: "My colleague deployed a bad version." → say **"a release introduced a cache without limits"**. Blameless is the international standard.
- Telling an incident story with no impact numbers: the interviewer cannot tell whether it was a small glitch or a major outage.

> Senior tip: Prepare **two versions**: the 2-minute one (as above) and a 5-minute one (adding how you communicated with stakeholders, who acted as incident commander, and how the postmortem was written). Start with the 2-minute version, then ask "Would you like me to go deeper into the root cause analysis?". The interviewer picks the part they care about, and you avoid rambling for 10 minutes.`,
    follow: [
      'Why did you roll back instead of fixing forward?',
      'How did you communicate with the business while the incident was happening?',
      'Why did your tests not catch the memory problem before release?',
    ],
  },
  'english-077': {
    q: 'A product manager asks why the sales dashboard is not real-time. Explain the technical trade-off you made, in business terms.',
    a: `**Summary:** Translate the trade-off into **business units**: time (engineer-weeks), money (cloud cost per month), operational risk (who has to watch it at night), and the **real benefit** for how users make decisions. End with **a clear recommendation + the condition to revisit + a confirming question**. Never say "it's impossible".

### Sample answer
Good question. We chose to refresh the dashboard every fifteen minutes instead of in real time, and the reason is mostly cost and risk, not technology.

Right now, the dashboard reads from a copy of our database that updates every fifteen minutes. To make it real-time, we'd need a streaming pipeline, basically a system that copies every single order the moment it happens. That's about six weeks of work for two engineers, plus roughly fifteen hundred dollars a month in extra cloud costs, and one more system that someone has to watch at night.

What would we get for that? Today, the sales team checks the dashboard a few times a day to plan promotions. A fifteen-minute delay doesn't change any of those decisions.

So my recommendation is to keep it as it is and show a clear "last updated at 10:45" label, so nobody is confused. If we start running flash sales where people need to react within minutes, that changes the picture, and I'd be happy to revisit it.

Does that match how your team uses the dashboard?

### Why this answer works
This is another angle on "explain a trade-off to a non-technical person": you are **saying no to a request** while keeping the relationship intact. A 5-step frame:
1. **State the decision** in the very first sentence (fifteen minutes, not real-time).
2. **The cost of doing it differently**, converted into things a PM understands: engineer-weeks, money per month, operational load.
3. **The real benefit**: would users make different decisions? If not, real-time is only cost.
4. **A recommendation + the cheap fix** for the actual problem (the "last updated" label solves the confusion).
5. **A revisit condition + a confirming question**, which turns a refusal into a shared decision.

A dictionary for "translating" the jargon:

| Technical term | How you say it to a PM |
|---|---|
| Read replica / reporting database | "a copy of our database" |
| CDC pipeline (Debezium + Kafka) | "a system that copies every order the moment it happens" |
| Operational overhead, on-call | "one more system someone has to watch at night" |
| Data freshness / staleness | "the numbers can be up to fifteen minutes old" |
| Eventual consistency | "the dashboard catches up a few minutes later" |

Technically, genuine real-time usually needs change data capture from the database's own log (for example Debezium reading the PostgreSQL WAL), pushed through Kafka into an analytics store. Every component then needs monitoring, upgrading and failure handling. You know all this, but **you do not need to say it** to a PM unless they ask.

### Useful phrases
- **the reason is mostly cost and risk, not technology**: what is stopping us is money and exposure, not capability
- **What would we get for that?**: what benefit do we buy with that spend?
- **that changes the picture**: that would change the trade-off
- **I'd be happy to revisit it**: I would gladly look at it again
- **Does that match how your team uses it?**: does that fit the way your team actually uses it?

### Common mistakes Vietnamese speakers make
- Saying **"It's impossible"** or "It's too difficult": it sounds like refusing to do the work. Everything can be built; the question is **what it costs**.
- Lecturing about CDC, Kafka and WAL to someone who does not need that.
- No numbers: "it costs a lot" instead of "about six weeks and fifteen hundred dollars a month".
- Misreading money: "$1,500" is said **"fifteen hundred dollars"** or "one thousand five hundred dollars", never "one thousand and five hundreds dollar".

> Senior tip: In cost-cutting times, **cost thinking (FinOps)** is a strong hiring signal: companies want seniors who ask "is it worth the money?" before building anything. After the conversation, put a **freshness SLA** in writing ("dashboard data is at most 15 minutes old") so that nobody can later claim "the numbers are wrong". When this question comes up in an interview, add the outcome: "The PM agreed, we added the label in one day, and the request never came back."`,
    follow: [
      'What if the CEO insists on real-time anyway?',
      'How did you estimate the six weeks and the monthly cost?',
      'Tell me about a time you said no to a stakeholder and were wrong.',
    ],
  },
  'english-078': {
    q: "We'd like to make you an offer, but it's about fifteen percent below the range you gave us. How do you respond? And what do you say if we ask what you were earning before?",
    a: `**Summary:** Four steps: **thank them + confirm you want the job → state the gap together with the market reason → ask whether there is flexibility, and if not propose alternatives (signing bonus, a post-probation review with criteria written into the offer) → ask for time to answer**. About your previous pay: politely shift the focus onto the value of the new role; do not lie, and do not invent another offer.

### Sample answer
First of all, thank you. I'm really excited about the role and the team, and I'd like to find a way to make this work.

To be transparent, the offer is about fifteen percent below the range I mentioned, which I based on market data for senior backend roles with on-call responsibility. Is there any flexibility on the base salary?

If the base is fixed because of your salary bands, I'm open to other options: a signing bonus, or a salary review after probation with clear criteria written into the offer.

About my previous salary, I'd prefer to focus on the value of this role rather than my last package, because the scope here is quite different. What I can say is that my expectation is in line with what similar roles pay in the market.

Could I have until Friday to think it over? I'd like to give you a clear answer rather than a quick one.

### Why this answer works
After a layoff, many people accept any offer straight away out of fear. But once a company says "we'd like to make you an offer", **they have already chosen you**, and a politely worded negotiation almost never costs you the offer. The sample keeps the right spirit: **cooperative, not confrontational**:

| Step | Purpose |
|---|---|
| Thanks + wanting to make it work | Tells them you are not looking for an excuse to refuse |
| The gap + the reason | A number based on the market and the scope of the work, not on your personal needs |
| Ask about flexibility, then offer alternatives | Gives HR several levers when base pay is locked by the salary band |
| Ask for time | Avoids an emotional decision and gives you time to compare options |

Typical company responses and how to reply to them:
- "This is our final offer." → "I understand. Could we agree on a review after probation, with the criteria in writing?"
- "Other candidates accepted this range." → "That's fair. My range reflects the on-call and ownership scope we discussed."
- "What were you earning before?" → shift the focus as the sample does. If they ask a second time and your previous pay is **not lower** than what you are asking for, you can tell the truth along with the structure (gross, 13th-month bonus, allowances). Never lie: some companies ask for payslips or social insurance confirmation.

The layoff situation: if you have **no other offer**, do not invent one ("I have another offer at 70 million"). HR may ask which company it is from, or tell you to go and take that offer, and you lose credibility. You are still entitled to negotiate purely on **market data and the scope of the work**.

### Useful phrases
- **I'd like to find a way to make this work**: I want us to reach an agreement rather than walk away
- **to be transparent**: to put it openly on the table
- **is there any flexibility on the base salary?**: is the base figure negotiable at all?
- **written into the offer**: recorded in the written offer letter
- **in line with what similar roles pay**: comparable to what similar positions pay
- **think it over**: take time to consider it carefully

### Common mistakes Vietnamese speakers make
- Answering **"OK, no problem"** immediately out of discomfort: you throw away the one negotiation window you get.
- Personal reasons: "I need more because I have a house loan." HR pays for **the value of the job**, not for your spending needs.
- Ultimatums: "If you can't pay 65, I won't join." That sounds like a threat.
- Accepting the verbal promise "we'll review in six months" with **nothing in writing** and no criteria.
- Wrong wording: "I want to negotiate the salary more high" → **"I'd like to discuss the salary"** or "Could we get closer to my range?".

> Senior tip: Negotiate **one round** only, putting every ask into one message ("base X, or base Y plus signing bonus Z"). Dragging it over several rounds tires HR out and costs you goodwill with the hiring manager. In many companies pay is capped by the band, so **moving up a level** (Senior I → Senior II) is sometimes easier than a raise inside the same level; ask: "Is there any room to discuss the level, given the scope we talked about?" Everything agreed must appear in the offer letter before you resign from your current job or decline another offer.`,
    follow: [
      'What is the lowest number you would accept?',
      'How do you compare an offer with a higher base against one with a bigger bonus?',
      'What would you do if they withdrew the offer after you negotiated?',
    ],
  },
  'english-079': {
    q: 'Do you have any questions for us? (Use them to check the health of the team and the role without sounding negative.)',
    a: `**Summary:** In layoff times, the reverse-question part is when **you vet the company**: is this a new headcount or a backfill, is the budget and roadmap already approved, has the team changed size, what measures success after 90 days. The trick is to **frame each question with your wish to stay long**, so it sounds like commitment rather than suspicion.

### Sample answer
Yes, thank you. I have a few questions.

First, is this a new position or a replacement for someone who left? And has the team changed in size over the last year? I'm asking because I'd like to understand where the team is heading.

Second, what does the roadmap look like for the next six to twelve months? For example, is the budget for the ledger migration already approved?

Third, what would success look like for me after ninety days and after six months? That would help me focus on the right things from day one.

And finally, how is the team using AI tools today, and has that changed how you plan work or hire?

The reason I'm asking all this is that I'm looking for a place where I can stay and grow for several years, not just my next job. So I really appreciate any detail you can share.

### Why this answer works
Your questions give you **information** and give the interviewer a **signal** about how you think. A senior who asks about budget, roadmap and success criteria thinks like someone accountable for outcomes, not just someone picking up tickets.

How to read the answers:

| Question | A good answer | A signal to be careful about |
|---|---|---|
| New position or replacement? | "New headcount, approved in Q3 for the ledger project." | Beating around the bush, "it's complicated" |
| Has the team changed in size? | Clear numbers and a stated reason | Several people just left, with no explanation |
| Is the budget approved? | Names a sponsor and milestones | "We're still waiting for approval" |
| Success after 90 days? | Specific, measurable goals | Nobody is able to answer |
| AI tools? | Rules exist, results are measured | "We expect AI to replace part of the team" |

One vague answer **does not prove** the company has a problem, but it is a reason to ask more in later rounds, cross-check with the recruiter, and keep interviewing elsewhere in parallel.

Ask the right person:
- **Recruiter/HR**: the process, probation, onsite/hybrid setup, offer structure.
- **Hiring manager**: headcount, budget, roadmap, 90-day criteria.
- **An engineer on the team**: on-call, code quality, what the day-to-day is really like.

For an outsourcing company, add: "How long is the current client contract, and what happens if the client stops the project?" That asks indirectly about the bench policy.

### Useful phrases
- **is this a new position or a replacement?**: is this brand-new headcount, or filling a seat someone vacated?
- **where the team is heading**: which direction the team is moving in
- **what would success look like after ninety days?**: how would you judge that I did this well in three months?
- **from day one**: right from the first day
- **stay and grow for several years**: remain and develop there over multiple years

### Common mistakes Vietnamese speakers make
- Answering **"No, I have no questions"**: the interviewer hears "not interested".
- Asking point-blank **"Will there be layoffs?"**: nobody will answer "yes", and it puts the interviewer in an awkward position. Questions about headcount and budget give you the same information.
- Raising salary and annual leave in the technical round: save those for HR.
- Reading out a list of 10 questions: pick the 3–4 that fit the person sitting in front of you.
- Indirect-question grammar: "Can you tell me what is the roadmap?" → **"Can you tell me what the roadmap is?"** (an indirect question keeps normal statement word order, no inversion).

> Senior tip: Write down what **each** interviewer said and compare the answers after the interview. If the hiring manager says "new headcount" while an engineer on the team says "we're replacing two people who left last month", that is valuable information. Ask the headcount question **after** you have gone well in the technical part, and always attach the reason "I'm looking for the long term". That reason turns a sensitive question into a sign of commitment.`,
    follow: [
      'Why is it important for you to know if the position is new?',
      'What would make you decline an offer from us?',
      'What did you not like about how your last company handled the layoff?',
    ],
  },
  'english-080': {
    q: 'Walk me through a production incident you led on a Java service running on Kubernetes. How did you communicate during it?',
    a: `**Summary:** Tell it along the timeline: detection → impact assessment → emergency action → communication → RCA → prevention. State your role clearly, give the numbers, and describe how you kept everyone calm. The interviewer is judging **leadership under pressure**, not plain technical knowledge.

### Sample answer
At 2:14 a.m. our alerting fired: the payment orchestration service on EKS had a 40 percent error rate on the checkout endpoint. I was the on-call senior and I became incident commander within the first three minutes.

My first action was not to debug but to declare severity and open the incident channel. I posted: "SEV-1, checkout errors, I am IC, joining now." Then I assigned roles: one engineer investigated, one handled customer support, I owned communication. I posted updates every five minutes even when there was nothing new, because silence makes people panic.

We found that a new deployment had increased memory per pod, causing OOM kills and a restart loop. At 2:27 I made the call to roll back rather than scale out, because rollback was four minutes and scaling meant guessing the right size under load. Rollback completed at 2:31 and errors dropped to zero.

Afterwards I wrote the postmortem the same day: timeline, root cause, five whys, and three action items with owners and dates. I also pushed for a canary deployment with automatic rollback on error-rate thresholds, which we shipped two weeks later. We have not had a deployment-related SEV-1 since.

### Useful phrases
- **I became incident commander**: I took the IC role for the incident
- **I assigned roles**: I gave each person a clearly defined job
- **silence makes people panic**: not updating anyone makes everyone anxious
- **I made the call to roll back**: I decided to revert the deployment
- **with owners and dates**: each action item has a named owner and a deadline

> Senior tip: Do not tell an incident as a dry technical story — the interviewer wants to see you **coordinating people**. Avoid saying "we fixed it" throughout; use "I" for your own decisions. Pronunciation: **commander** /kəˈmɑːndər/, and **postmortem** /poʊstˈmɔːrtəm/, with the stress on the second syllable.`,
    follow: [
      'What would you have done if the rollback had not fixed the problem?',
      'How do you decide the severity level of an incident?',
      'How do you run a blameless postmortem without it feeling like a formality?',
    ],
  },
});
