/*
 * English translation of js/data/q-english.js — task T740/T1163. Format: js/core/i18n.js (content overlay).
 * ids: english-106 english-107 english-108 english-109 english-110 english-111 english-112 english-113
 */
App.i18n.content({
  'english-106': {
    q: 'Explain a production bug to a non-technical Product Owner. The bug caused some users to be charged twice. How do you communicate clearly without blaming anyone?',
    a: `**Summary:** A sample answer for explaining a bug to a **non-technical PO/PM** (Product Owner/Product Manager — people who decide product priorities but may not write code). Goal: clearly state what happened (user impact), what you are doing to reduce harm, when it will be done, and next steps — **no difficult jargon, no blame**. Use everyday analogies for technical concepts (for example, "sent the confirmation twice" instead of "retry storm").

### Sample spoken answer (ready to say)
"Thanks for making time. I want to give you a clear update about an issue we found this morning. Some customers were charged twice for the same order — about 120 orders between 9:10 and 9:40. I am really sorry for the impact on those customers.

Here is what happened in simple terms: when a customer paid, our system sends a payment request and waits for a confirmation. In some cases the confirmation came back slowly, so the system thought the payment did not go through and sent the request again. That second request created an extra charge.

Right now we have stopped the problem from happening to new orders, and we are identifying every affected customer. Our plan is to refund the duplicate charges automatically and send an apology message with the refund timeline. I expect the full refund list to be ready by 3 p.m. today, and I can confirm once the refunds are completed.

I will also follow up with a short summary of what we will change so this does not happen again. If you need, I can help you prepare the message to customers or support."

### Concept breakdown (for someone new to this)
- **Non-technical communication**: the goal is to help them make decisions (notify customers, prioritize work), not to teach them to code. Speak in this order: **impact → simple cause → mitigation (what you are doing now) → timeline (when it will be done) → next step**.
- **Terms you need to "translate"**:
  - {{idempotency}} (idempotent behavior — sending the same request multiple times but producing only one result): like pressing an elevator button many times but still calling only one elevator.
  - {{retry}} (try again): the system automatically sends the request again when it thinks the previous attempt failed.
  - {{race condition / timeout}} (things happening in a tricky order / waiting too long): do not name these terms; say "the confirmation arrived slowly, so the system thought it had not succeeded".
- **Blameless** (no blaming): say "the system sent..." instead of "the developer forgot..." — the PO needs solutions, not a culprit in this meeting.

### Useful phrases
- **I want to give you a clear update**: I want to update you clearly
- **Here is what happened in simple terms**: Here is what happened, explained simply
- **The impact was... / About X users were affected**: The impact was... / About X users were affected
- **We have stopped the problem from happening to new orders**: We have prevented the issue for new orders
- **I expect ... by 3 p.m., and I will confirm once it is done**: I expect ... by 3 p.m., and I will confirm when it is complete
- **I will follow up with a short summary**: I will send a short summary afterward

### Vocabulary
- **duplicate charge**: a customer charged twice
- **refund**: return money to the customer
- **affected customers**: customers impacted by the issue
- **mitigation**: actions taken to reduce harm
- **root cause**: the underlying reason (used later, after investigation)
- **timeline**: expected time milestones

### Common mistakes for Vietnamese speakers
- Blaming: "The payment team made a mistake" — this creates defensiveness. Say "we found an issue in the payment flow".
- Too technical: using {{transaction}}, {{idempotency key}}, {{distributed lock}} (a lock across multiple servers) right away — the PO cannot make decisions. Explain concepts with everyday examples if needed.
- No timeline: only saying "we are fixing it" — the PO does not know when to notify customers. Always include a time or "I will update you by...".
- Saying "It's not my fault" or apologizing too vaguely; apologize for the **impact** on customers, then focus on actions.

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through in order: impact, simple cause, mitigation, timeline, and next step. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence about what you will change so it does not happen again. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for Vietnamese speakers
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: When speaking to a PO, prepare three layers of information: 30 seconds (impact + what you are doing now), 2 minutes (simple cause + timeline), and a separate technical summary for engineers. If the PO asks "why did it happen?", answer briefly and offer: "I can share a technical summary after we finish the refunds." Prioritize **customer trust** and **clear decisions** before deep technical detail.`,
    follow: [
      'The PO asks "Can we be sure it will not happen again today?" How do you answer honestly without over-promising?',
      'How would you explain the difference between a fix now and a long-term prevention to a non-technical stakeholder?',
      'What information do you include in a customer-facing apology message after a duplicate charge bug?',
    ]
  },
  'english-107': {
    q: 'Present a test strategy for a new Java backend feature to your team and product stakeholders. How do you explain what will be tested, what will not, and why?',
    a: `**Summary:** A sample way to present a **test strategy** (a test strategy is a plan for choosing which types of tests to run, where to run them, and which risks you accept). Speak in four parts: **main risks → test pyramid → in scope/out of scope → release signal**. For non-technical people, translate "unit/integration/e2e" into "check each part / check parts working together / check like a real user".

### Sample spoken answer
"I would like to walk you through the test strategy for the new refund feature. The goal is to release with confidence without slowing the team down.

First, the main risks: charging or refunding the wrong amount, refunding twice, and breaking the existing payment flow. So our tests focus on correctness and safety.

Second, how we test. We will write unit tests for the refund calculation and business rules — that means we check each small piece of logic in isolation, for example tax rounding and partial refunds. We will add integration tests for the database and the payment provider adapter — that checks the parts working together with real components. We will keep a small number of end-to-end tests for the full user journey, because they are slower and more fragile.

Third, what is in scope and out of scope. In scope: happy path, duplicate refund requests, invalid amounts, permission checks, and failure from the payment provider. Out of scope for this release: performance testing at very high traffic and rare edge cases in old currencies; we will track those as follow-up tasks because the risk is lower.

Finally, our release signal: all automated tests pass, the critical scenarios are reviewed, and we run a manual check on staging with production-like data. If any critical test fails, we do not release. I can share a short checklist after this meeting."

### Concept breakdown
- **Test strategy**: this is not a list of every test case; it is a decision about **where to invest effort** to reduce the biggest risks. Like buying insurance: protect what would cause the most damage first.
- **Test pyramid** (testing pyramid): many {{unit test}} (fast, cheap tests that check a single function/class in isolation), fewer {{integration test}} (tests that check multiple components connected together: database, message queue, external APIs), and very few {{end-to-end (E2E) test}} (tests that run like a real user through the whole system — slow, and brittle when UI or infrastructure changes).
- **In scope / out of scope**: state this clearly so stakeholders do not expect "everything has been tested". Out-of-scope items must have a risk reason or a follow-up plan.
- **Release signal**: clear conditions for deciding "safe enough to release".

### Useful phrases
- **I would like to walk you through the test strategy**: I would like to present the test strategy
- **The main risks are... so our tests focus on...**: The main risks are... so our tests focus on...
- **We check each small piece of logic in isolation**: We test each small piece of logic separately
- **In scope / out of scope for this release**: Included / not included in this release
- **Our release signal is...**: Our condition for release is...
- **If any critical test fails, we do not release**: If any critical test fails, we will not release

### Vocabulary
- **coverage**: how much is covered by tests (do not use it as the only goal)
- **happy path**: the normal successful flow
- **edge case**: a rare or boundary scenario
- **staging**: an environment close to production for pre-release checks
- **regression**: a bug that returns in a feature that used to work
- **fragile test**: a test that breaks easily even when functionality has not changed

### Common mistakes for Vietnamese speakers
- Only saying "we will write unit tests" without mentioning **risk** — stakeholders cannot tell whether this is enough.
- Using jargon continuously: "JUnit, Mockito, Testcontainers, contract test" with a PO — translate the purpose ("test with a real database" instead of only naming tools).
- Promising "100% coverage" — easy to misunderstand; high coverage does not mean no bugs. Say "we cover the critical risks and core flows".
- Not stating out of scope — when a rare-case bug appears after release, others may think "it was already tested".

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through in order: main risks, how you test (test pyramid), what is in and out of scope, and the release signal. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence about what you learned or how you would adjust next time. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for Vietnamese speakers
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: When presenting a test strategy, always connect **test type ↔ risk ↔ cost**. For example: "We keep E2E tests small because they are slow; we catch most logic bugs earlier with unit tests." For stakeholders, end with a decision-making question: "Given these risks and this plan, are you comfortable releasing if the checklist passes?"`,
    follow: [
      'A stakeholder asks why we do not write end-to-end tests for every scenario. How do you explain the trade-off?',
      'How do you decide the minimum test set required before a risky database migration release?',
      'What would you change in the strategy if the team has very little time before the deadline?',
    ]
  },
  'english-108': {
    q: 'Write or read out a clear bug report in a standup or ticket discussion. What information must be included so another engineer can reproduce and fix it quickly?',
    a: `**Summary:** A good **bug report** helps others **reproduce** (make the bug happen again by following the same steps) and fix it quickly. Required structure: **clear title → environment → steps to reproduce → expected vs actual → evidence (log/screenshot/request id) → impact/severity**. Missing reproduction steps is the number one reason bugs become "cannot reproduce".

### Sample spoken answer (reading a bug report)
"I want to report a bug in the refund API. Title: duplicate refund created when the client retries after timeout.

Environment: staging, service version 1.14.2, tested today around 10:20 UTC with the test merchant account.

Steps to reproduce: first, create a completed payment for 100 dollars. Second, send a refund request for 50 dollars. Third, simulate a timeout on the client side and send the same refund request again within 5 seconds.

Expected result: the system should create only one refund, or return the existing refund result.

Actual result: two refund records are created, and the customer balance is reduced by 100 dollars.

Evidence: I attached the two request IDs, the API responses, and a log screenshot showing both requests were processed. I can also share the correlation ID.

Impact: high, because it can cause incorrect refunds in production. I suggest we block the release until we confirm the fix."

### Concept breakdown
- **Reproduce**: repeat the exact steps so the bug appears again. If it cannot be reproduced, the engineer has to guess — which wastes time and can lead to the wrong fix.
- **Expected vs actual**: "expected" is what the system **should** do (according to requirements), "actual" is what it **actually** does. This pair helps the reader see the failure immediately.
- **Evidence**: logs, screenshots, {{correlation ID / request ID}} (an identifier used to trace one request across multiple services), stack trace (the error chain a program prints when it crashes). Evidence reduces "it works on my machine" debates.
- **Severity/impact**: how many users are affected, whether money/data is at risk, and whether there is a workaround — this helps prioritize the fix.

### Bug report template (short)
~~~text
Title: <what is broken> when <condition>
Environment: <env, version, time, account>
Steps to reproduce: 1) ... 2) ... 3) ...
Expected: ...
Actual: ...
Evidence: <logs, request IDs, screenshots>
Impact: <users, money/data risk, workaround>
~~~

### Useful phrases
- **Steps to reproduce are as follows**: The steps to reproduce are as follows
- **The expected result is... but the actual result is...**: The expected result is... but the actual result is...
- **I attached the request ID and logs as evidence**: I attached the request ID and logs as evidence
- **The impact is high because...**: The impact is high because...
- **I suggest we block the release until...**: I suggest we block the release until...
- **I cannot reproduce it consistently yet**: I cannot reproduce it consistently yet

### Vocabulary
- **workaround**: a temporary way to avoid the bug
- **intermittent**: the bug happens sometimes, not always
- **regression**: a previously working feature breaks again
- **cannot reproduce**: unable to reproduce the issue
- **stack trace**: the error chain printed by a program when it crashes

### Common mistakes for Vietnamese speakers
- Writing "It does not work" / "Payment is broken" — with no steps, expected/actual. The fixer has to ask follow-up questions repeatedly.
- Omitting environment/version: the bug may happen only on staging or a new version — missing this causes "cannot reproduce".
- Confusing expected with personal preference; expected should be based on requirements/tickets.
- Not including request ID/correlation ID when the system has logs — engineers have to search logs manually.
- Using "you" to blame: "You broke the refund" — write neutrally: "The refund flow returns 500 when...".

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through in order: title, environment, steps to reproduce, expected vs actual, evidence, and impact. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence about what you recommend next. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for Vietnamese speakers
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: A good bug report saves hours for the whole team. If the bug is **intermittent** (happens sometimes), record the frequency ("3 out of 10 attempts"), timing, data used, and any signals (high CPU, timeout, concurrent requests). For money/data bugs, always state impact and recommend whether to **stop the release / rollback** — that is senior-level thinking.`,
    follow: [
      'How do you report an intermittent bug that you cannot reproduce reliably?',
      'What is the difference between severity and priority in a bug ticket, and how would you explain it to a PM?',
      'What extra evidence would you collect for a bug that only happens in production?',
    ]
  },
  'english-109': {
    q: 'Talk about a flaky test in the daily standup. How do you explain the problem, the risk, and what you will do next without sounding like you are making excuses?',
    a: `**Summary:** A **flaky test** (an unstable test — it passes or fails sometimes even when the code has not changed) is a pipeline quality problem, not a small issue to "rerun until it passes". In standup, speak briefly in this order: **symptom → risk → concrete action + time**. Avoid silently rerunning (hiding the problem) and avoid long technical explanations.

### Sample spoken answer (standup)
"Yesterday I worked on the refund feature tests. I want to flag one issue: the integration test for payment timeout is flaky. It failed twice on the CI pipeline but passed when I reran it locally.

The risk is that flaky tests reduce trust in our test suite. If people get used to rerunning until it passes, we might miss a real failure.

Today I will investigate the root cause. My first guess is that the test depends on timing or shared test data, but I need to confirm. I will timebox the investigation to two hours. If I cannot find the cause quickly, I will temporarily quarantine the test, create a ticket with the evidence, and keep the release gate on the stable tests. I will update the team before the end of the day."

### Concept breakdown
- **Flaky test** (unstable test): the result is not reliable — common causes: dependence on real time ({{sleep}}, timeout), test execution order, shared data, network/infrastructure, race conditions in tests. Everyday analogy: a scale that sometimes shows 70 kg and sometimes 71 kg — you do not know whether you gained weight or the scale is broken.
- **CI pipeline** (an automated pipeline that runs build/tests when new code is added): a flaky test makes the pipeline red for the wrong reason, causing the team to wait or press rerun.
- **Quarantine** (isolate a test): move a flaky test out of the release-blocking test set, but you **must** create a ticket and assign an owner to fix it — it is not a permanent deletion.
- **Timebox** (limit time): decide in advance "I will investigate for 2 hours" to avoid going down a rabbit hole.

### Useful phrases
- **I want to flag one issue**: I want to raise one issue
- **The test is flaky — it failed on CI but passed when I reran it**: The test is flaky — it failed on CI but passed when I reran it
- **The risk is that it reduces trust in our test suite**: The risk is that it reduces trust in our test suite
- **I will timebox the investigation to two hours**: I will limit the investigation to two hours
- **If I cannot find the cause, I will quarantine the test and create a ticket**: If I cannot find the cause, I will quarantine the test and create a ticket
- **I will update the team before the end of the day**: I will update the team before the end of the day

### Vocabulary
- **rerun**: run again
- **root cause**: the underlying cause
- **shared state / test data**: state/data shared between tests
- **timing dependency**: dependence on timing
- **release gate**: a condition that blocks or allows a release

### Common mistakes for Vietnamese speakers
- Sounding like a personal apology: "Sorry, my test is bad" — standup needs **problem + plan**, not a long self-blame. But do not blame the tool either: "CI is unstable".
- "I just reran it and it passed" as a solution — rerunning hides the symptom and trains the team to accept a red pipeline.
- Explaining too much technical detail in standup (thread dump, Mockito details) — standup is only 1–2 minutes per person; suggest: "I can share details after standup".
- No next step/time: "I will look into it" — vague. Say clearly **what you will do today and when you will update**.

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through in order: symptom, risk, and concrete next steps with a timebox. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence about when you will update the team. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for Vietnamese speakers
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: Distinguish a **flaky test** from a **real failure**. Before quarantining, quickly check: did other tests fail on the same commit, was there an infrastructure change, and does rerunning produce the same error? Team rule: "never ignore a red pipeline". If you must quarantine, the ticket must have an owner, evidence (CI run link), and conditions for bringing the test back.`,
    follow: [
      'A teammate says "just rerun the pipeline so we can release". How do you respond?',
      'What are common causes of flaky integration tests in a Java/Spring project?',
      'When is it acceptable to quarantine a flaky test, and what must you record in the ticket?',
    ]
  },
  'english-110': {
    q: 'Explain to stakeholders why a release is delayed because of quality issues. How do you stay honest, calm, and constructive?',
    a: `**Summary:** When you **delay a release due to quality**, stakeholders need to know: **what the issue is, the risk of releasing, options, the new timeline, and what decision you need from them**. Avoid hiding the problem, avoid blaming, and avoid promising a new date before you assess impact. Structure: status → business risk → options → recommendation + timeline.

### Sample spoken answer
"I need to share an update about tomorrow's release. We found a quality issue during final testing: under certain retry conditions, the system can create duplicate records. It does not affect every user, but the risk is serious because it involves customer data.

If we release as planned, we could create incorrect records that are expensive to fix and could affect customer trust. Because of that, I do not recommend releasing tomorrow.

We have three options. Option one: delay the release by two days, fix the issue, and rerun the critical tests — this is the safest option. Option two: release without the new retry feature and keep the rest of the changes, if the product agrees to reduce scope. Option three: release on time with a manual workaround, but I do not recommend this because the workaround is easy to miss.

My recommendation is option one. I can confirm the new release date by 4 p.m. today after the team finishes the impact check. I understand this affects the plan, and I will keep you updated with clear progress."

### Concept breakdown
- **Quality issue**: a bug or risk that makes the software unreliable in important scenarios (money loss, data loss, incorrect results, security). It is not "the code is not pretty".
- **Speak in business risk terms**: stakeholders do not decide based on "null pointer exception"; they decide based on "customers may get duplicate records". Translate technical failures into consequences.
- **Options**: offer 2–3 choices with trade-offs (delay / reduce scope / workaround) so stakeholders can participate in the decision instead of only receiving bad news.
- **Under-promise, over-deliver**: promise a new date only after checking impact; if you are not sure yet, say "I will confirm the new date by...".

### Useful phrases
- **I need to share an update about the release**: I need to share an update about the release
- **We found a quality issue during final testing**: We found a quality issue during final testing
- **If we release as planned, the risk is...**: If we release as planned, the risk is...
- **I do not recommend releasing tomorrow**: I do not recommend releasing tomorrow
- **We have three options**: We have three options
- **I can confirm the new release date by...**: I can confirm the new release date by...
- **I understand this affects the plan, and I will keep you updated**: I understand this affects the plan, and I will keep you updated

### Vocabulary
- **delay / postpone**: move to a later time
- **scope**: the set of features included
- **workaround**: a temporary solution
- **rollback**: return to a previous version
- **impact check**: assessment of how wide the impact is
- **critical test**: an important test that blocks release if it fails

### Common mistakes for Vietnamese speakers
- Reporting late or hiding the issue: hoping to "fix it overnight" and only speaking up in the morning — stakeholders lose the chance to respond.
- Blaming: "QA found bugs too late" / "The requirement was unclear" — in a delay update, focus on the **decision now**.
- Only stating the problem with no options: the meeting becomes complaining. Always include a recommendation.
- Promising an optimistic new date: "We can fix it tomorrow" before investigation — you lose trust a second time.
- Speaking too indirectly in English: using "actually, basically, maybe" too often weakens the message. Be direct and calm.

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through in order: status, business risk, options with trade-offs, and your recommendation with a timeline. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence showing you will keep stakeholders updated. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for Vietnamese speakers
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: Delaying for quality is a courageous decision if you bring **evidence + risk + options**. Be clear about the difference: a blocker bug (must stop release) versus an issue that can be temporarily accepted. After the event, propose process improvements (earlier testing, staging closer to production, release checklist) — but do not turn the delay announcement into a retrospective.`,
    follow: [
      'The stakeholder insists on releasing on time because of a marketing campaign. How do you respond?',
      'How do you explain the cost of releasing a known bug versus delaying two days?',
      'What would you prepare before this meeting so you can answer tough questions confidently?',
    ]
  },
  'english-111': {
    q: 'In a pull request review, you see missing tests for an important code path. How do you give feedback that is clear, respectful, and focused on quality?',
    a: `**Summary:** PR (pull request — a request to merge code changes into the main branch) review feedback about missing tests should be **specific, non-personal, and tied to risk**. Formula: appreciate good parts (if any) → point out exactly which **code path** lacks tests → explain the risk → suggest concrete test cases → ask back ("what do you think?"). The goal is to improve code quality, not to "win" an argument.

### Sample spoken/written answer
"Thanks for working on this change — the refactor makes the payment flow easier to read.

I have one concern about test coverage. The new branch for retry after timeout does not seem to have an automated test. That path is important because it can affect duplicate payments if the retry logic changes later.

Could we add tests for these cases? For example: 1) the provider times out and the request is retried once, 2) the same request is sent again with the same idempotency key, and 3) the provider returns an error after timeout. I think the first two are critical before merging.

If adding all of them is too much for this PR, could we at least cover case 1 and 2, and create a follow-up ticket for case 3? What do you think?"

### Concept breakdown
- **Pull request (PR) review**: someone else reads the changes before merging into the main branch. Goals: catch bugs, share knowledge, and maintain quality standards.
- **Code path** (an execution path through code): a scenario that runs through certain lines of code — for example, the "timeout then retry" path is different from the "success immediately" path. Missing tests on an important path means future changes can break it without anyone noticing ({{regression}} — a bug returning).
- **Actionable feedback**: clearly stating "which test cases to add" is better than saying "please add more tests".
- **Tone**: use "could we...", "I suggest...", "what do you think?" instead of "you must..." / "this is wrong". But for high-risk areas (money, security), still be clear: "I think this is a blocker before merging".

### Useful phrases
- **Thanks for working on this change**: Thanks for working on this change
- **I have one concern about test coverage**: I have one concern about test coverage
- **This code path is important because...**: This code path is important because...
- **Could we add tests for these cases?**: Could we add tests for these cases?
- **I think the first two are critical before merging**: I think the first two are critical before merging
- **What do you think? / Does that make sense?**: What do you think? / Does that make sense?

### Vocabulary
- **merge**: combine code into a branch
- **blocker**: an issue that must be fixed before continuing
- **nit / nitpick**: a small comment that does not block merging
- **regression**: a bug that returns
- **coverage**: how much is covered by tests
- **follow-up ticket**: a ticket for work to do later

### Common mistakes for Vietnamese speakers
- Vague feedback: "Please add tests" — the author does not know which tests to add. List 2–3 concrete cases.
- Personal attacks: "You always forget tests" / "This is careless" — creates defensiveness. Talk about the **code/change**, not the **person**.
- Staying silent and complaining later: noticing missing tests but avoiding the comment, then blaming after a production issue. Review time is the time to speak up.
- Being rigid about everything: turning every nit into a blocker — the team gets tired. Clearly separate blockers (high risk) from suggestions.
- Agreeing to merge because "we are in a rush": for paths involving money/data, state the risk clearly and suggest reducing PR scope.

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through in order: appreciation, the specific missing code path and risk, concrete test cases, and a practical compromise if needed. Keep each part to one or two sentences and land on a concrete number or outcome. End with an open question to keep the discussion collaborative. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for Vietnamese speakers
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: Use the standard "kind, specific, and firm on risk". For important code paths (payment, permission, data migration), missing tests can be a **merge blocker** — say it directly but respectfully. If the author gives a reasonable explanation (for example, the path is already tested at another layer), check the evidence instead of holding your opinion for ego. The final goal: code that is safe in production, and a team that learns what deserves tests.`,
    follow: [
      'The author replies "we do not have time to add tests in this sprint". How do you handle it?',
      'How do you decide whether missing tests should block a merge or can be a follow-up?',
      'How would you give the same feedback in a written PR comment versus in a live call?',
    ]
  },
  'english-112': {
    q: 'Communicate during a production incident and in the postmortem meeting. How do you update stakeholders during the incident and speak constructively afterward?',
    a: `**Summary:** Two different contexts: **during an incident** (while the issue is happening in production — the real system used by real users) you need short, regular updates based on known facts — impact, actions, and the next update time. **In the postmortem** (a meeting after the incident to learn) you need a **blameless** tone, a timeline, root cause, and action items with owners. Do not mix the two tones: an incident is not the time for deep analysis, and a postmortem is not the time to claim credit.

### Sample spoken answer (during incident)
"Incident update at 14:10. The checkout API is returning errors for about 20 percent of requests, starting at 13:55. Payments team is investigating. We have rolled back the last configuration change, but the error rate is still high. Next steps: check database connections and recent traffic. I will post the next update in 10 minutes or sooner if we find the cause."

### Sample spoken answer (postmortem)
"Thanks everyone for joining the postmortem. The purpose is to understand what happened and prevent it from happening again — this is blameless.

Timeline: at 13:55 alerts fired for checkout errors. At 14:05 we rolled back the config change, but errors continued. At 14:18 we found the database connection pool was exhausted because a new query held connections longer under peak traffic. At 14:25 we increased the pool limit as a temporary mitigation, and by 14:35 the error rate returned to normal.

Impact: about 20 percent of checkout requests failed for 40 minutes.

Root cause: the new query was missing an index, and our staging test did not use production-like data volume.

Action items: add the missing index and verify the query plan; add a staging test with larger data; set an alert for connection pool saturation; review connection timeout settings. Each item needs an owner and a due date. What did we miss in this timeline?"

### Concept breakdown
- **Production incident**: the real system is failing and affecting real users. At this time, priorities are: reduce impact and communicate clearly. Everyday analogy: like a fire alarm — people need evacuation information and status, not a debate about who forgot to turn off the stove.
- **Postmortem** (after-action review): a meeting after the incident is stable, with the goal of learning and prevention. **Blameless** means focusing on systems/processes (missing tests, missing alerts, risky changes) instead of punishing individuals — because if people fear blame, they will hide important information.
- **Mitigation vs fix** (reduce harm vs fix root cause): mitigation is a fast action to reduce pain (rollback, increase pool, use a feature flag to disable a feature). A fix/root cause addresses why it happened so it does not recur.

### Useful phrases
- **Incident update at [time]**: Incident update at [time]
- **The impact is... starting at...**: The impact is... starting at...
- **Next steps are... I will post the next update in 10 minutes**: Next steps are... I will post the next update in 10 minutes
- **The purpose of this postmortem is to learn, not to blame**: The purpose of this postmortem is to learn, not to blame
- **Temporary mitigation / root cause / action item**: Temporary mitigation / root cause / action item
- **Each action item needs an owner and a due date**: Each action item needs an owner and a due date

### Vocabulary
- **impact**: how much users/systems were affected
- **timeline**: sequence of events over time
- **mitigation**: actions to reduce harm
- **root cause**: the underlying cause
- **action item**: a task to be done
- **owner / due date**: person responsible / deadline
- **connection pool exhausted**: no available connections left in the pool (a pool is a group of reusable database connections; exhausted means all are in use)

### Common mistakes for Vietnamese speakers
- During an incident, speaking at length or guessing: "maybe database, maybe network" without evidence — creates panic. State what you know, what you are checking, and when the next update will be.
- Staying silent too long: stakeholders fill the gap with assumptions. Even without a root cause, update on a regular cadence.
- Blaming in a postmortem: "Developer X deployed a bad query" — others will hide mistakes later. Say "a query was deployed without an index check".
- Vague action items: "improve testing" — nobody does it. Each item needs an owner, due date, and measurable outcome.
- Mixing in defensive emotions: "I already warned the team" — save it for later, or include it in the timeline as a fact if relevant.

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through in order. For an incident: impact, actions taken, next steps, and next update time. For a postmortem: purpose, timeline, impact, root cause, and action items with owners. Keep each part to one or two sentences and land on a concrete number or outcome. End with one sentence showing what you learned or what question you want the team to answer. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for Vietnamese speakers
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: During an incident, use one primary update channel (incident channel/doc) and, if possible, one communication coordinator — to avoid conflicting messages. In a postmortem, the strongest question is "what made this possible?" rather than "who did this?". Good systems assume humans will make mistakes and add **guardrails** (alerts, tests, reviews, easy rollback) so mistakes do not become disasters.`,
    follow: [
      'During an incident, a stakeholder asks for a root cause immediately. How do you respond?',
      'How do you keep a postmortem blameless when someone clearly made a risky change?',
      'What makes an action item effective, and what makes it easy to ignore?',
    ]
  },
  'english-113': {
    q: 'Persuade your team or manager to invest in test automation. How do you make a practical business case, not just a technical argument?',
    a: `**Summary:** To persuade others to invest in **test automation** (using code/tools to run tests automatically instead of repeating manual clicks), you need to speak in terms of **current cost + risk + measurable benefit + a small plan**. Avoid slogans like "automation is good". Propose starting small (a pilot) to reduce concerns about time.

### Sample spoken answer
"I would like to propose a small investment in test automation for the payment and refund flows.

Right now, before each release we spend about one and a half days on manual regression checks. Even with that effort, we still miss issues because some cases are hard to repeat by hand, such as retries, timeouts, and duplicate requests. Last quarter we had two production bugs in these flows, and each one took several hours to investigate and fix.

My proposal is not to automate everything. I suggest we start with a pilot: automate the top 10 critical scenarios in payment and refund over the next two sprints. These tests would run automatically on every pull request, so we get feedback in minutes instead of waiting for manual testing.

The expected benefit is faster and safer releases: less repeated manual work, earlier bug detection, and lower risk in high-impact flows. The cost is some upfront time from the team, so I propose we allocate a fixed amount, for example 20 percent of sprint capacity for two sprints.

We can measure success by three things: time spent on manual regression for those flows, number of bugs found before release, and CI feedback time. If the pilot works, we can expand it. If not, we stop and review what we learned. Could we agree on the pilot scope this week?"

### Concept breakdown
- **Test automation**: writing scripts so machines run repeated checks. Everyday analogy: instead of manually checking 50 items every time you ship goods, you build a scanner that checks the important items each time — it takes effort to build the scanner at first, but saves time later.
- **Manual regression** (manual regression testing): after adding or changing code, a tester clicks through old features to make sure nothing is broken. It is repetitive, time-consuming, and easy to miss cases.
- **Business case** (an argument based on business value): do not only say "JUnit is good"; say "how many person-hours are spent, what is the risk of production bugs affecting customers/money, and how much can automation reduce that".
- **Pilot** (a small trial): do a narrow scope first to prove value, avoiding a large proposal that scares people about time cost.

### Useful phrases
- **I would like to propose a small investment in...**: I would like to propose a small investment in...
- **Right now we spend about... on manual regression checks**: Right now we spend about... on manual regression checks
- **My proposal is not to automate everything**: My proposal is not to automate everything
- **I suggest we start with a pilot**: I suggest we start with a pilot
- **We can measure success by...**: We can measure success by...
- **The cost is some upfront time, so I propose we allocate...**: The cost is some upfront time, so I propose we allocate...

### Vocabulary
- **automation**: making processes run automatically
- **upfront cost**: initial cost/time investment
- **return on investment (ROI)**: benefit compared to investment cost
- **regression**: a bug returning in existing functionality
- **pilot**: a small trial
- **sprint capacity**: the team's available work capacity in a sprint
- **CI feedback time**: time to get feedback from CI (continuous integration — an automated build/test pipeline)

### Common mistakes for Vietnamese speakers
- Only making a technical argument: "We should use Selenium/Cypress/JUnit 5" — managers need business reasons and scope. Tools are details for later.
- Proposing something too large: "automate all tests this quarter" — sounds unrealistic. A pilot of 10 critical cases is more convincing.
- Not mentioning cost: automation requires upfront time and maintenance. If you hide it, listeners will doubt you. Be clear about trade-offs.
- Overpromising: "no more bugs" — automation reduces risk; it does not eliminate all bugs.
- Using "you should" repeatedly — sounds commanding. Use "I suggest / could we / my proposal".

### Full sample answer (60-90 seconds)
Start with the one-line summary, then walk through in order: current cost and risk, a small pilot proposal, expected benefit, upfront cost, and how you will measure success. Keep each part to one or two sentences and land on a concrete number or outcome. End with a clear ask, such as agreeing on pilot scope. Practice aloud until it fits 90 seconds; record yourself and cut filler words.

### Vocabulary and phrases to reuse
- "I took ownership of..." / "I proposed..." / "The trade-off was..." / "As a result..." / "Since then, I have...".
- Avoid vague "we did"; name your specific contribution and the data you used.

### Delivery tips for Vietnamese speakers
- Slow down on numbers and proper nouns; English interviewers need time to parse them.
- Use short sentences; long compound sentences are hard to follow when nervous.
- If you lose a word, paraphrase instead of stopping; fluency beats perfect grammar.

> Senior tip: Choose a pilot where **risk is high + repetition is frequent + behavior is relatively stable** (for example, payment/refund happy path + duplicate/idempotency cases). Avoid automating UI too early if the UI changes often — maintenance cost will kill trust. When reporting pilot results, use concrete numbers (CI minutes, reduced manual test hours, bugs caught before release) — that is the language stakeholders understand.`,
    follow: [
      'Your manager says "we do not have time for automation because we need features". How do you respond?',
      'Which test cases would you automate first, and which would you keep manual?',
      'How do you measure whether the automation pilot is successful after two sprints?',
    ]
  },
});
