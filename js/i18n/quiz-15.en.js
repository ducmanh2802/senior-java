/*
 * English translation of js/data/quiz.js — task T412. Format: js/core/i18n.js (content overlay).
 * ids: qz-english-001 qz-english-002 qz-english-003 qz-english-004 qz-english-005 qz-english-006 qz-english-007 qz-english-008 qz-devops-003 qz-devops-004 qz-devops-005 qz-devops-006 qz-devops-007 qz-devops-008 qz-kotlin-003 qz-kotlin-004 qz-kotlin-005 qz-kotlin-006 qz-kotlin-007
 */
App.i18n.content({
  'qz-english-001': {
    q: 'The interviewer asks in depth about a technology you **have not used in practice** (for example, Kafka transactions). Which English answer is the most natural and professional?',
    options: [
      "I don't know.",
      'Sorry, I am not knowing about this topic.',
      'That is not my responsibility in my current team, so I never touch it.',
      "I haven't used Kafka transactions in production, but let me reason through how I'd expect them to work, and please correct me if I'm off."
    ],
    explain: `**Correct answer: "I haven't used Kafka transactions in production, but let me reason through…"**

### Why this is correct
- It is **honest** about the limits of your experience ("haven't used… in production") but **does not close the conversation**.
- It shifts to demonstrating **your reasoning** ("let me reason through"), which is what the interviewer wants to assess.
- "Please correct me if I'm off" politely invites the interviewer to engage; "off" here means "wrong" or "off track".
- Grammar: the **present perfect** ({{haven't used}}) is correct for experience up to the present, with no specific time reference.

### Why the other options are wrong
- **"I don't know."**: grammatically correct but too abrupt; it ends the question without showing the interviewer anything. If you really do not know, add something related that you do know or explain how you would find out.
- **"I am not knowing"**: grammatically incorrect. {{know}} is a **stative verb** (a verb describing a state), so it is not used in the continuous form. The correct version is "I don't know much about…". This is a very common mistake among Vietnamese speakers who translate the Vietnamese progressive marker word for word.
- **"That is not my responsibility…"**: grammatically correct but the wrong **attitude/register**: it sounds defensive and lacking in curiosity. "Never touch it" also makes the interviewer think you confine yourself to a narrow scope.

> Senior tip: memorize a few fallback phrases so you do not freeze: "I haven't worked with that directly, but…", "My understanding is… — is that in line with what you've seen?", "I'd need to check the docs on the exact API, but conceptually…". Delivering the opening smoothly buys you a few extra seconds to think.`
  },
  'qz-english-002': {
    q: 'You are not sure which aspect the interviewer is asking about. Which sentence is the most natural and polite way to **ask for clarification**?',
    options: [
      'Just to make sure I understand: are you asking about the read path or the write path?',
      'Can you repeat again the question?',
      'What do you mean? Your question is not clear.',
      'Please explain me the question.'
    ],
    explain: `**Correct answer: "Just to make sure I understand: are you asking about the read path or the write path?"**

### Why this is correct
- "Just to make sure I understand" is a standard opening that takes responsibility for understanding on your side and is very polite.
- The question is **specific** and offers two choices: it shows the interviewer that you have analyzed the question and identified two directions, and it helps them answer quickly.
- The grammar is correct: "are you asking about…" uses the present continuous for an action happening now.

### Why the other options are wrong
- **"Can you repeat again the question?"**: two errors. "Repeat" already means "do again", so adding "again" is redundant; and the word order is unnatural (the object must stay close to the verb: "repeat the question"). A natural version is "Could you repeat the question, please?"
- **"What do you mean? Your question is not clear."**: grammatically correct but it **blames** the questioner and sounds harsh. This register makes a poor impression in an interview.
- **"Please explain me the question."**: incorrect structure. {{explain}} does not take two objects like "give me something"; it must be "explain something **to** me": "Could you explain the question to me?" or, better, "Could you clarify what you mean by…?"

> Senior tip: asking for clarification is a **plus**, not a minus, especially for an ambiguous system design question. Native-speaking interviewers often deliberately leave questions open-ended. Use "Could you clarify…", "When you say X, do you mean…?" and state your assumptions: "I'll assume… unless you'd like me to consider…".`
  },
  'qz-english-003': {
    q: 'Interviewer: "Why did you choose eventual consistency?" Which sentence explains the **trade-off** most naturally and accurately?',
    options: [
      'Eventual consistency is more better for scaling, so we used it.',
      "We went with eventual consistency because it let us scale writes, at the cost of users occasionally seeing data that's a few seconds stale.",
      'Despite of the stale data, we chose eventual consistency.',
      'We chose eventual consistency because it is the best approach.'
    ],
    explain: `**Correct answer: "We went with eventual consistency because it let us scale writes, at the cost of…"**

### Why this is correct
- It states **both the benefit and the cost**, which is the essence of a trade-off answer.
- "**at the cost of** + noun/V-ing" is a standard phrase for describing the price paid. Similar phrases include "the trade-off is…", "the downside is…", and "in exchange for…".
- "**went with**" sounds natural in speech when discussing a choice; "let us scale" correctly uses {{let + object + bare infinitive}}.
- A specific figure ("a few seconds stale") makes the answer credible.

### Why the other options are wrong
- **"more better"**: a **double comparative** error. "Better" is already the comparative form of "good"; do not add "more". Correct: "better for scaling".
- **"Despite of"**: incorrect preposition. Use "**despite** the stale data" or "**in spite of** the stale data". The sentence also mentions only the drawback, not the reason for the choice.
- **"because it is the best approach"**: grammatically correct but **content-free**: it says neither how it is better nor what was traded off. The interviewer will conclude that the candidate does not understand trade-offs; in system design there is no "best", only "best for these constraints".

> Senior tip: practise this frame: "We chose **X** over **Y** because **[constraint]**. The trade-off is **[cost]**, which we mitigated by **[action]**." Another example: "…which we mitigated by reading your own writes from the primary for the user who just made the change."`
  },
  'qz-english-004': {
    q: 'You want to describe an achievement that **was completed last year**. Which sentence is the most grammatically correct and natural?',
    options: [
      'I have led the migration to Kubernetes last year.',
      'Last year I am responsible for lead the migration to Kubernetes.',
      'I led our migration to Kubernetes last year, which cut deployment time from 40 minutes to 8.',
      'I was leaded the migration to Kubernetes last year.'
    ],
    explain: `**Correct answer: "I led our migration to Kubernetes last year, which cut deployment time from 40 minutes to 8."**

### Why this is correct
- There is a specific past time reference ("last year") → use the **past simple**: {{led}} (the irregular past form of {{lead}}).
- The relative clause "**, which cut…**" attaches the result directly to the action, following the spirit of STAR (action + result).
- The subject "I" and the strong verb "led" make your individual role clear.

### Why the other options are wrong
- **"I have led… last year"**: wrong tense. The present perfect does **not** go with a specific past time reference (last year, in 2023, two months ago). You can say "I have led two migrations" (no time reference), but with "last year" it must be "I led".
- **"Last year I am responsible for lead…"**: two errors: the present tense for something last year (it should be "was"), and after the preposition "for" you need V-ing ("responsible for **leading**"). "Was responsible for" is also weaker than "led" because it describes responsibility rather than action.
- **"I was leaded"**: "lead" is an irregular verb (lead – led – led); there is no "leaded" in this sense, and the "was + V3" structure is **passive**, which would mean "I was led".

> Senior tip: when describing achievements in English, favour strong verbs in the past simple (led, designed, cut, reduced, migrated, introduced) over "was responsible for" or "was involved in". A short sentence with a measured result sounds much more confident.`
  },
  'qz-english-005': {
    q: 'In a system design round, the interviewer suggests that two services share one database, and you **disagree**. Which sentence expresses disagreement most politely and professionally?',
    options: [
      "I see your point. My concern is that a shared database would couple the two services' release cycles. Would an outbox-based approach work here instead?",
      'You are wrong, a shared database is a bad idea.',
      'I am agree with you, but I think a shared database is not good.',
      'With all due respect, that idea makes no sense at all.'
    ],
    explain: `**Correct answer: "I see your point. My concern is that… Would an outbox-based approach work here instead?"**

### Why this is correct
A polite disagreement has three steps, and this sentence contains all of them:
1. **Acknowledge** the other person's viewpoint: "I see your point."
2. **State a specific concern** rather than passing judgment: "My concern is that…" (focusing on the technical issue: coupling release cycles).
3. **Offer an alternative as a question**: "Would… work here instead?" opens a discussion instead of imposing an answer.

Grammar: the plural possessive "the two services' release cycles" (apostrophe after the s) is correct.

### Why the other options are wrong
- **"You are wrong…"**: grammatically correct but **too blunt**, attacking the person instead of discussing the idea. In international work cultures, especially when speaking to an interviewer, this register is very tactless.
- **"I am agree"**: grammatically incorrect. {{agree}} is a verb, not an adjective, so it does not go with "am". Correct: "I agree with you". The sentence is also contradictory: "agree" followed by "not good"; to agree partially, say "I partly agree, but…".
- **"With all due respect, that idea makes no sense"**: in native English, "with all due respect" often signals that criticism is coming, and combined with "makes no sense at all" it sounds **sarcastic**. It gives neither a reason nor an alternative.

> Senior tip: in a system design interview, the interviewer sometimes deliberately offers a flawed suggestion to see whether you can push back with sound reasoning. Useful phrases to memorize: "My concern with that is…", "One risk I see is…", "Have we considered…?", "I'd lean towards X because…".`
  },
  'qz-english-006': {
    q: 'At the end of the interview, the interviewer asks "Do you have any questions for us?". Which question is best in both grammar and content?',
    options: [
      'How much holidays do I get per year?',
      'What does your company do?',
      'Can you tell me what is the on-call process?',
      'How does the team decide when to pay down technical debt versus ship new features?'
    ],
    explain: `**Correct answer: "How does the team decide when to pay down technical debt versus ship new features?"**

### Why this is correct
- **Content**: asking how the team makes decisions shows that you care about engineering quality and work culture, which is appropriate for a Senior candidate. The interviewer's answer also helps you evaluate the company.
- **Grammar**: the present-simple question correctly uses the auxiliary "does"; "pay down technical debt" is a natural collocation; "versus" contrasts two choices.

### Why the other options are wrong
- **"How much holidays"**: grammatically incorrect: "holidays" is a plural **countable** noun, so it requires "how many". More natural: "How much paid time off do we get?" (PTO is uncountable). In terms of content, save this question for the HR round; asking a technical interviewer may give the impression that you care only about benefits.
- **"What does your company do?"**: grammatically correct but shows that you **did not research** the company before the interview, which is a major negative.
- **"Can you tell me what is the on-call process?"**: an **embedded question** error. After "Can you tell me…", the question part must use statement word order: "Can you tell me what **the on-call process is**?" Vietnamese speakers make this mistake very often. The content of the question is good.

> Senior tip: prepare 3–4 questions for each interviewer: ask an engineer about code review, deployment, and incidents; ask a manager about expectations for the first six months and how performance is evaluated. "What would success look like for this role in the first six months?" always works.`
  },
  'qz-english-007': {
    q: 'Interviewer: "Tell me about a mistake you made." Which answer is **grammatically correct and demonstrates ownership** best?',
    options: [
      'The mistake was happened because of the QA team.',
      'Mistakes were made, but finally everything was okay.',
      'I made a mistake in a migration script that caused 20 minutes of downtime. I owned the incident, rolled back, and added a dry-run step to our pipeline.',
      'I did a big mistake in the migration script, but I fixed it very fast.'
    ],
    explain: `**Correct answer: "I made a mistake in a migration script that caused 20 minutes of downtime. I owned the incident…"**

### Why this is correct
- Standard collocation: **make a mistake**.
- The subject "I" in the **active** voice demonstrates clear responsibility; "I owned the incident" is very natural in an engineering environment.
- The parallel past-simple verbs "owned, rolled back, and added" are concise and coherent, with a concrete impact (20 minutes) and a preventive action.

### Why the other options are wrong
- **"The mistake was happened"**: grammatically incorrect. {{happen}} is an **intransitive verb** and has no passive form. Correct: "The mistake happened…". In addition, "because of the QA team" shifts blame.
- **"Mistakes were made"**: grammatically correct, but this passive phrase is **notorious for avoiding responsibility** (it does not say who caused them). Native speakers recognize this immediately. "Finally" is also not quite right: to say "everything was okay in the end", "in the end" is more natural; "finally" usually emphasizes that something happened after a period of waiting.
- **"I did a big mistake"**: wrong collocation; in English you "**make** a mistake", not "do a mistake" (an error caused by translating "làm sai" literally). "Fixed it very fast" also gives no impact and no prevention.

> Senior tip: common collocations that often go wrong in interviews: **make** a decision / a mistake / progress; **do** research / a review / your best; **take** ownership / responsibility / a risk; **raise** a concern; **meet** a deadline (not "catch a deadline").`
  },
  'qz-english-008': {
    q: 'You need a few seconds to think before answering a difficult question. Which sentence is the most natural and professional?',
    options: [
      'Wait me a second.',
      "That's an interesting one. Let me take a moment to think it through.",
      'Give me a time to think.',
      'Ehh... uhm... so... yeah, well...'
    ],
    explain: `**Correct answer: "That's an interesting one. Let me take a moment to think it through."**

### Why this is correct
- "**Let me take a moment**" is a polite, proactive way to ask for time, letting the interviewer know that the silence that follows is intentional.
- "**think it through**" (a phrasal verb meaning to consider something thoroughly) shows that you will give a structured answer.
- "That's an interesting one" acknowledges the question and creates a natural pause.

### Why the other options are wrong
- **"Wait me a second"**: grammatically incorrect. {{wait}} needs the preposition **for**: "wait for me". But even "Wait for me a second" sounds like an order. More natural: "Give me a second" or "Just a second".
- **"Give me a time to think"**: wrong article. "Time" is an uncountable noun, so it cannot take "a". Correct: "Give me **some** time" or "Give me **a moment**". This bare imperative also sounds somewhat abrupt.
- **"Ehh... uhm... so... yeah, well..."**: a long string of filler words makes you sound flustered and lacking in confidence. A deliberate 3–5 seconds of silence after asking for time is much better than filling the gap with meaningless sounds.

> Senior tip: for a system design question, you can buy time naturally by stating your structure: "Let me first clarify the requirements, then sketch the high-level design." You get time to think while demonstrating a methodical approach.`
  },
  'qz-devops-003': {
    q: 'The Deployment is running normally, but the HPA never scales even though Pod CPU usage rises sharply. What is the most common cause and the correct fix?',
    options: [
      'The HPA only works with Prometheus, so Prometheus must be installed instead of metrics-server',
      'The Deployment must use the Recreate strategy instead of RollingUpdate for the HPA to read metrics',
      'minReplicas must be set to 0 for the HPA to enable load-based scaling',
      'The container has no CPU request, so the HPA has no denominator for calculating utilization percentage; declare appropriate requests and check metrics-server'
    ],
    explain: `**Correct answer: a missing CPU request prevents the HPA from calculating utilization.**

For resource metrics, the HPA uses the formula: **utilization = actual usage / average container request**. If the container does not declare {{resources.requests.cpu}}, there is no denominator, so the HPA cannot calculate a percentage and typically reports that it cannot retrieve the metric instead of scaling. The cluster must also have **metrics-server** (or an adapter for custom metrics), and the Pod must have been running long enough for the metric to stabilize.

### Why the other options are wrong
- **Prometheus is required instead of metrics-server**: not true. The HPA reads resource metrics through the metrics API; Prometheus + prometheus-adapter is needed only when scaling on a custom metric such as queue length.
- **minReplicas set to 0**: a standard HPA requires at least 1 replica. Scaling to zero requires a separate feature gate and an external metric, and is unrelated to CPU not being recognized.
- **Recreate is required**: the rollout strategy does not affect whether the HPA can read metrics. Recreate also causes downtime and is not an HPA requirement.

### Quick checks on the cluster
~~~bash
kubectl top pods -n my-ns
kubectl describe hpa my-api -n my-ns
kubectl get deployment my-api -o jsonpath="{.spec.template.spec.containers[0].resources}"
~~~
If {{kubectl top}} fails, the problem is with metrics-server; if top works but the HPA reports unknown, the cause is usually a missing request or a container that has just restarted.

> Senior tip: do not set the CPU request too low just to make the HPA more "sensitive" — the request also determines scheduling and QoS. Right-size it from actual p95 usage, use the VPA in recommendation mode to obtain figures, and for I/O-bound workloads scale on latency or queue length rather than CPU alone.`
  },
  'qz-devops-004': {
    q: 'Every time you change one Java line, the Docker build takes nearly 10 minutes because it downloads all Maven dependencies again. What is the best improvement?',
    options: [
      'COPY the entire source first and then run mvn package so Docker can cache the source',
      'Always build with --no-cache to avoid old layers and ensure a clean build',
      'Separate the layers: copy pom.xml and download dependencies first, then copy the source and build; use multi-stage so the final image contains only the JRE and jar',
      'Build on the development machine first and copy the whole target directory into the image so CI does not have to build'
    ],
    explain: `**Correct answer: separate layers by how often they change and use a multi-stage build.**

Docker invalidates a layer and **every layer after it** when its input changes. If you copy the source before running Maven, changing just one Java file makes the dependency-download step run again from scratch. Reverse the order: copy {{pom.xml}} (or all poms for a multi-module project) and run the dependency-download step first; source changes then invalidate only later layers, so dependencies remain cached. Multi-stage keeps Maven, the JDK, and source code out of the runtime image, reducing its size and attack surface.

### Why the other options are wrong
- **Copy source first**: this is exactly what causes the slowdown. Every source change invalidates the dependency cache.
- **--no-cache**: disabling cache works against the goal, makes the build even slower, and provides no reusable benefit.
- **Build on a development machine and copy target**: the image depends on the builder's environment, cannot be reproduced on CI, may include stray files, and gives no control over the toolchain.

### Abbreviated Dockerfile example
~~~text
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B package -DskipTests

FROM eclipse-temurin:17-jre
COPY --from=build /app/target/app.jar /app.jar
ENTRYPOINT ["java","-jar","/app.jar"]
~~~

> Senior tip: with BuildKit, use a cache mount for {{/root/.m2}} so dependencies are reused between builds even when the pom changes. Pin base images by digest or a specific tag rather than {{latest}}; otherwise even "clean" builds can differ between runs.`
  },
  'qz-devops-005': {
    q: 'You want to move from blue-green to canary deployment for a service with a database schema change. What is the most important prerequisite?',
    options: [
      'Delete old data before deploying the canary to avoid schema conflicts',
      'Canary can be used only when the service has no database',
      'All instances must be deployed at once so the schema always stays in sync',
      'The migration must be backward-compatible using expand-contract so old and new versions can run on the schema during the transition, with metrics and automated rollback'
    ],
    explain: `**Correct answer: a backward-compatible migration using expand-contract.**

In a canary deployment, the old and new versions **run simultaneously** against the same database. The schema must therefore be compatible with **both** versions: add new columns/tables (expand), backfill data, make the new code read/write compatibly, and remove unused columns/tables (contract) only after the old version has completely stopped running. Breaking changes such as renaming a column, changing its type, or adding NOT NULL without a default will break the old version as soon as the canary receives traffic.

### Why the other options are wrong
- **Delete old data first**: this destroys data and does not solve compatibility; the old version is still running and will fail.
- **Canary cannot be used with a database**: false; canary works as long as the schema is backward-compatible. This is a migration problem, not a canary limitation.
- **Deploy everything at once**: that is big-bang deployment, which loses the very risk-reduction benefit of canary, and the two versions still run in parallel for a period during rollout.

### Safe sequence
1. **Expand**: add a nullable column or a new table without changing columns in use.
2. **Dual write/read** and backfill in batches while monitoring lag.
3. **Canary rollout** at 1–5–25–100%, comparing error rate, latency, and business metrics against the baseline.
4. **Contract**: remove the leftovers only after the old version has completely stopped.

> Senior tip: always design migrations so they can be **rolled back within minutes**. In PostgreSQL, adding a nullable column is nearly instantaneous; adding a column with a constant default is also instantaneous from PostgreSQL 11, but on older versions (or with a volatile default such as {{random()}}) it rewrites the whole table — check the specific version. Do not bundle the migration and code deployment into one inseparable step.`
  },
  'qz-devops-006': {
    q: 'The test suite on CI is sometimes green and sometimes red, but passes when rerun. What is the best way to handle this?',
    options: [
      'Isolate tests: each test creates its own data with unique ids or rolls back its transaction, with no order dependency; replace sleep with condition-based waiting; reproduce by running repeatedly and fix the root cause rather than blindly retrying',
      'Enable 3 retries in CI so the pipeline is always green',
      'Increase the timeout for the entire test suite to 10 minutes',
      'Run more tests in parallel to make them faster and less error-prone'
    ],
    explain: `**Correct answer: find and eliminate the root cause of the flaky test.**

Flaky tests usually come from **shared state** between tests (the same database, user, or file), **execution-order dependencies**, **real time** (sleep, time zones), **asynchrony** (threads, late-arriving messages), **fixed ports**, or **unseeded random data**. The fix is to make tests independent and deterministic: separate data, transaction rollback or cleanup, an injected {{Clock}}, {{Awaitility}} instead of sleep, and dynamically allocated ports. Then run them repeatedly to confirm the flakiness is gone.

### Why the other options are wrong
- **Retrying in CI**: hides real defects, produces a falsely green pipeline, and increases runtime; if the flake comes from a race condition in the code (rather than in the test), users still hit the bug in production.
- **Increasing the timeout**: only makes tests slower without fixing the cause; some failures become even harder to spot.
- **Running more tests in parallel**: with tests that share state, parallelism creates more conflicts and worse flakiness.

### Troubleshooting process
- Label the test **flaky** and add it to a tracking list; do not silently delete it.
- Run that test alone 50–100 times to reproduce the failure.
- Read the logs at the failure time and look for shared resources or assumptions about time.
- Fix the root cause, then rerun it many times before removing the label.

> Senior tip: measure the **flake rate** weekly and set an alert threshold. If a suite has 100 tests and each is flaky 1% of the time, the pipeline goes red roughly 63% of runs (1 - 0.99^100), so even small flakes are very costly. And do not use {{Thread.sleep}} in tests — if you must wait, wait on a condition with a clear timeout.`
  },
  'qz-devops-007': {
    q: 'A Java Pod is OOMKilled even though -Xmx is set below the container memory limit. What is the cause and the correct way to handle it?',
    options: [
      'OOMKilled only concerns the heap, so simply increasing -Xmx to equal the memory limit is enough',
      'Swap must be disabled in the container because swap is the only cause of OOMKilled',
      'Besides the heap there are metaspace, code cache, thread stacks, direct/native memory, and JVM overhead; set a limit with headroom, use MaxRAMPercentage appropriately, and monitor RSS/NMT',
      'Set -Xms larger than -Xmx so the JVM reserves all memory up front'
    ],
    explain: `**Correct answer: the container memory limit covers many memory regions beyond the Java heap.**

{{-Xmx}} limits only the **heap**. A Java process also uses **metaspace**, **code cache**, **thread stacks** (typically 512 KB–1 MB per thread), **direct buffers** (Netty, NIO, JDBC drivers), **memory-mapped files**, internal JVM structures, native libraries, and the allocator. If the total exceeds the limit, the kernel sends SIGKILL and Kubernetes records {{OOMKilled}} — there is no heap dump because the JVM has no chance to react. You therefore need a limit with headroom (heap typically 60–75% of the limit), use {{-XX:MaxRAMPercentage}} so the JVM calculates from the container limit, cap direct memory when using Netty, and monitor actual RSS through metrics.

### Why the other options are wrong
- **Just increase -Xmx to the limit**: this leaves no room for any off-heap region and makes an OOM kill even more likely.
- **Disable swap**: swap is not the cause of a container OOMKilled; disabling it does not stop the process from exceeding its limit.
- **-Xms larger than -Xmx**: an invalid configuration; the JVM refuses to start.

### How to investigate
~~~bash
kubectl describe pod my-api | grep -A3 "Last State"
kubectl exec my-api -- jcmd 1 VM.native_memory summary
~~~
The {{VM.native_memory}} command works only when the JVM was started with {{-XX:NativeMemoryTracking=summary}} (which adds a few percent overhead). Compare **RSS** with the limit and inspect direct buffers and thread count. If RSS grows steadily with load, look for a leak (buffers, ThreadLocal, an unbounded cache) before simply raising the limit.

> Senior tip: set {{-XX:MaxRAMPercentage=75}} instead of hard-coding {{-Xmx}} so the same image works with different limits. With Netty, also set {{-XX:MaxDirectMemorySize}} and check the leak detector. Do not set the limit close to average usage — leave headroom for load peaks and native memory.`
  },
  'qz-devops-008': {
    q: 'You discover an API key baked into a Docker image that has already been pushed to a registry. Which action is the most correct and complete?',
    options: [
      'Delete the latest tag; the old image will automatically become undownloadable',
      'Rotate and revoke the key immediately, stop using that image, move the secret to runtime (secret manager/env), add secret scanning to CI, and treat the exposed key as compromised',
      'Adding a new layer that overwrites the file containing the secret is enough because the old layer is hidden',
      'Simply rename the environment variable in the Dockerfile'
    ],
    explain: `**Correct answer: rotate the key first, then fix the process so secrets never enter images.**

Images and registries store **every layer**, including layers overwritten by later ones. Anyone who can pull the image can use {{docker history}} or unpack the layers to retrieve the secret. Deleting a tag does not delete existing digests; anyone who has already pulled or cached it still has a copy. The first step is therefore to **revoke the key** (treat it as exposed), then delete the image/digest according to policy, and fix secret injection: read from a secret manager or environment variables at runtime, and never COPY a file or use {{ARG}} for secrets.

### Why the other options are wrong
- **Delete the latest tag**: this removes only a label; the old digest still exists and pulled copies still work. The key remains exposed.
- **Add an overwriting layer**: the old layer is still in the image; data already written cannot be erased this way.
- **Rename the environment variable**: the secret value remains in the image/history, so the risk is unchanged.

### Prevention
- Enable **secret scanning** for the repository, images, and commit history.
- Use BuildKit secret mounts or a secret manager; never use {{ARG}}/{{ENV}} for secrets.
- Add a CI step that fails when a key pattern is detected.
- Restrict registry permissions and audit who has pulled the image.

> Senior tip: when a secret lands in an image, its exposure begins at push time, not when you discover it. Design keys to be short-lived and rotatable, and log key usage to detect anomalies. Do not just delete the commit or the tag and consider the incident closed.`
  },
  'qz-kotlin-003': {
    q: 'A coroutine makes a blocking JDBC call inside launch(Dispatchers.Default), reducing throughput across the whole application. What is the best fix?',
    options: [
      'Switch to GlobalScope.launch so it is not limited by the dispatcher',
      'Add Thread.sleep(0) after the call to yield the CPU to other coroutines',
      'Increase the thread count of Dispatchers.Default with a system property',
      'Wrap the blocking call in withContext(Dispatchers.IO) or use an appropriate async client, while keeping structured concurrency and handling cancellation'
    ],
    explain: `**Correct answer: move the blocking work to the dispatcher intended for I/O.**

{{Dispatchers.Default}} is designed for **CPU-bound** work, with a thread count limited by the number of cores (minimum 2). A blocking JDBC call **occupies a thread** for the entire I/O wait, exhausting the pool and starving other coroutines of threads even while the CPU is idle. {{Dispatchers.IO}} has a larger, elastic pool suited to blocking I/O; alternatively, use a reactive/async driver if available. Just as important is keeping **structured concurrency**: use {{withContext}} inside the current scope so errors and cancellation propagate correctly.

### Why the other options are wrong
- **GlobalScope.launch**: escapes the parent scope, so it is not cancelled when the request ends, making coroutine leaks likely and losing error propagation.
- **Thread.sleep(0)**: does not yield the thread in any meaningful way; the thread remains busy and other coroutines still wait.
- **Increasing Default threads**: masks the symptom, creates too many threads, and costs memory and contention; Default is not intended for blocking work.

### Notes when using Dispatchers.IO
- The IO pool also has a limit (64 threads or the number of cores, whichever is greater, by default), so if the database pool has only 10 connections, running 64 calls in parallel is pointless. Use {{limitedParallelism(10)}} to match the connection pool.
- A blocking JDBC call does not respond to coroutine cancellation; you can wrap it in {{runInterruptible}} if the driver responds to interrupts, or set {{Statement.setQueryTimeout}}, but you must verify this in practice.
- On Java 21, virtual threads can be used for blocking tasks, but you still need to bound concurrency according to real resources.

> Senior tip: the rule is **blocking goes with IO, computation goes with Default**. Set a timeout on every outbound call and measure waiting time; if coroutines are waiting for threads rather than I/O, that is a sign the dispatcher is being misused.`
  },
  'qz-kotlin-004': {
    q: 'When should you use Sequence instead of List in Kotlin?',
    options: [
      'For a long transformation chain on a large collection when only the final result is needed, to avoid intermediate collections; but not when you need to iterate multiple times or access by index',
      'Always use Sequence because it is faster than List in every case',
      'Sequence caches results so it computes only once',
      'Sequence works only with small collections because it is slower than List'
    ],
    explain: `**Correct answer: Sequence suits a lazy pipeline over large data that is consumed once.**

{{Sequence}} performs transformations **lazily**: each element passes through the whole {{map/filter}} chain before the next element, with no intermediate lists. For large data or a multi-step chain, this saves memory and can **stop early** at {{first()}}, {{find()}}, or {{take(n)}}. But a sequence is **cold**: each iteration recomputes from the beginning, and index access is inefficient because it requires sequential traversal.

### Why the other options are wrong
- **Always faster than List**: with a small collection, the cost of creating sequence lambdas and iterators can exceed a loop over a list; lists are also better optimized.
- **Caches results**: a sequence does not cache; to reuse the result you must call {{toList()}} and keep it.
- **Only for small collections**: the opposite is true — sequences show their advantage with large data or infinite sources.

### Which one to choose
| Situation | Recommended |
|---|---|
| Large data, many steps, only the final result needed | Sequence |
| Multiple iterations, index access, small size | List |
| Infinite source or incremental file reading | Sequence |
| Parallel processing needed | Java parallel stream or coroutines, not Sequence |

> Senior tip: do not optimize prematurely. Measure first; switch to a sequence only when a profiler shows many intermediate collections and memory spikes. Also remember that Sequence differs from Java {{Stream}}: a stream can be used only once, while most sequences can be iterated again (though recomputed); the exceptions are sequences built from an iterator or with {{constrainOnce()}}.`
  },
  'qz-kotlin-005': {
    q: 'You need to write a generic function that takes type T and knows the Class of T at runtime to deserialize JSON. What is the correct approach in Kotlin?',
    options: [
      'Use a reified type parameter in an inline function so the compiler substitutes the actual type; if inlining is not possible, pass a KClass or TypeReference explicitly',
      'Use T::class directly in any generic function, including non-inline functions',
      'Create Any() as T and read javaClass to get the actual type',
      'Kotlin automatically retains a type token for every generic, so nothing extra is needed'
    ],
    explain: `**Correct answer: use reified in an inline function, or pass a type token explicitly.**

On the JVM, generics undergo **type erasure**: inside the function, {{T}} no longer exists at runtime. Kotlin allows {{inline fun <reified T> ...}} so the compiler **substitutes the actual type** at the call site, enabling {{T::class}}, {{is T}}, or {{typeOf<T>()}}. In return, inlining increases bytecode size and cannot be used for virtual functions/interface methods. When inlining is not possible, pass {{KClass<T>}} explicitly or use the JSON library's {{TypeReference}}/{{ParameterizedTypeReference}} to retain generic type information.

### Why the other options are wrong
- **T::class in any generic function**: valid only when {{T}} is reified in an inline function; otherwise the compiler reports an error.
- **Any() as T**: creates an Any object that carries no information about T; this is an unchecked cast (not checked immediately because of erasure), {{javaClass}} returns only {{java.lang.Object}}, and a ClassCastException will surface later where the value is used.
- **Kotlin retains type tokens automatically**: incorrect; Kotlin is subject to type erasure just like Java.

### Example
~~~kotlin
inline fun <reified T> fromJson(json: String): T =
    jacksonObjectMapper().readValue(json, T::class.java)

// Cannot inline: pass the token explicitly
fun <T> fromJson(json: String, type: TypeReference<T>): T =
    jacksonObjectMapper().readValue(json, type)
~~~

For nested generics such as {{List<Order>}}, {{T::class.java}} is not enough; you need {{TypeReference}} or {{typeOf<List<Order>>()}}.

> Senior tip: prefer passing a type token at **boundaries** (HTTP client, repository) rather than scattering reified everywhere. Reified is convenient but bloats code and makes debugging harder; with Jackson, one well-placed {{TypeReference}} is often clearer.`
  },
  'qz-kotlin-006': {
    q: 'A lateinit var property in a singleton is read from multiple threads. What is the main risk?',
    options: [
      'lateinit is automatically thread-safe thanks to the lateinit keyword',
      'lateinit does not allow nullable types, so there is no risk',
      'There is no visibility or one-time initialization guarantee: another thread can read before assignment and throw UninitializedPropertyAccessException, or see a value that has not been safely published',
      'lateinit causes errors only when the property is a primitive type'
    ],
    explain: `**Correct answer: lateinit provides no synchronization and no safe-publication guarantee.**

{{lateinit var}} compiles to an ordinary field with a null check on every read; it does **not add** {{volatile}}, locking, or any one-time initialization mechanism. If thread A assigns a value while thread B reads, B can:
- read before A assigns and get {{UninitializedPropertyAccessException}}, or
- see the reference but not the object's fully initialized internal state because there is no happens-before relationship.

Checking {{isInitialized}} is also not atomic with the read that immediately follows it.

### Why the other options are wrong
- **Automatically thread-safe**: no synchronization mechanism is generated.
- **Non-nullable, therefore no risk**: type nullability has nothing to do with thread safety; the risk lies in the timing of assignment and visibility.
- **Only fails with primitives**: lateinit does not apply to primitives; the failure occurs with any reference type that has not been assigned.

### The right approach
- Initialize in the constructor or in an initialization function that runs before the object is shared.
- Use {{by lazy}} (SYNCHRONIZED by default) for safe one-time initialization.
- If late assignment is unavoidable, use {{@Volatile}} with double-checked locking or another safe-publication mechanism.
- With dependency injection, let the framework manage the lifecycle instead of assigning inside a singleton yourself.

> Senior tip: lateinit suits **test setup** or a framework with a clear lifecycle callback, not ad-hoc shared state. If you find yourself checking {{isInitialized}} in production code, that is usually a sign to switch to constructor injection or controlled lazy initialization.`
  },
  'qz-kotlin-007': {
    q: 'Which synchronization mode does by lazy use by default, and when should you switch to another mode?',
    options: [
      'PUBLICATION, safe in every case and never computes twice',
      'SYNCHRONIZED: only one thread computes while the others wait; use NONE when you are certain only one thread accesses it to avoid locking overhead, but it may compute multiple times under multithreading',
      'NONE is the default and is not thread-safe',
      'Lazy supports only NONE, so you must synchronize externally yourself'
    ],
    explain: `**Correct answer: the default is SYNCHRONIZED; use NONE only when single-threaded access is certain.**

Kotlin provides three modes:
- **SYNCHRONIZED** (default): locks around initialization; only one thread computes while the others wait. Safe, but with locking overhead on first access.
- **PUBLICATION**: several threads may compute concurrently; whichever publishes first wins, and the others may have finished computing and discard their results. With no lock it is faster under contention, but the initializer can run multiple times — use it only when the initializer has no side effects and this is acceptable.
- **NONE**: no synchronization; fastest, but unsafe if multiple threads access it.

### Why the other options are wrong
- **PUBLICATION by default and never computes twice**: both claims are wrong; PUBLICATION can compute multiple times.
- **NONE is the default**: wrong; the default is SYNCHRONIZED.
- **Only NONE is supported**: wrong; all three modes are available.

### Practical notes
- If the initializer throws an exception, the next access **retries** (with SYNCHRONIZED) rather than caching the exception.
- For a singleton managed by a DI container, lazy is usually unnecessary; let the container decide the scope.
- Measure before switching to NONE: one-time locking overhead is usually negligible compared with the risk of a race.

> Senior tip: do not choose NONE just because it is "faster". On Android, lazy tied to the UI thread often uses NONE deliberately; in a multithreaded backend, keep SYNCHRONIZED unless you have proven that only one thread accesses it. And remember that lazy solves only initialization — it does not protect the object from later mutation.`
  }
});
