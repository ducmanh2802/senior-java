(function () {
  'use strict';
  App.i18n.content({
    'qz-english-001': {
      q: 'An interviewer asks in-depth about a technology you **have not used in practice** (e.g., Kafka transactions). Which English response is the most natural and professional?',
      options: [
        "I don't know.",
        'Sorry, I am not knowing about this topic.',
        'That is not my responsibility in my current team, so I never touch it.',
        "I haven't used Kafka transactions in production, but let me reason through how I'd expect them to work, and please correct me if I'm off."
      ],
      explain: `**Correct answer: "I haven't used Kafka transactions in production, but let me reason through…"**

### Why this is correct
- **Honest** about the limits of your experience ("haven't used… in production") but **does not close the conversation**.
- Transitions to demonstrating **your thinking process** ("let me reason through"), which is what the interviewer actually wants to evaluate.
- "Please correct me if I'm off" is polite and invites interaction from the interviewer.
- Grammar: The **present perfect** ("haven't used") is correct for experience up to the present, without a specific time marker.

### Why the other options are incorrect
- **"I don't know."**: Grammatically correct but too abrupt; it ends the question and reveals nothing about your capability. If you really don't know, you should add something you *do* know that is related or explain how you would find out.
- **"I am not knowing"**: Grammatically incorrect. {{know}} is a **stative verb**, so it is not used in continuous tenses. Correct: "I don't know much about…".
- **"That is not my responsibility…"**: Grammatically correct but **wrong attitude/register**: it sounds defensive and lacks curiosity. "Never touch it" makes the interviewer think you limit yourself to a narrow scope.

> Senior tip: Memorize a few "safety" phrases to avoid freezing: "I haven't worked with that directly, but…", "My understanding is… — is that in line with what you've seen?", "I'd need to check the docs on the exact API, but conceptually…". Being able to say the opening sentence fluently gives you a few seconds to think.`
    },
    'qz-english-002': {
      q: 'You are not sure which aspect the interviewer is asking about. Which is the most natural and polite way to **ask for clarification**?',
      options: [
        'Just to make sure I understand: are you asking about the read path or the write path?',
        'Can you repeat again the question?',
        'What do you mean? Your question is not clear.',
        'Please explain me the question.'
      ],
      explain: `**Correct answer: "Just to make sure I understand: are you asking about the read path or the write path?"**

### Why this is correct
- "Just to make sure I understand" is a standard opening phrase, taking responsibility for the understanding on your end, which is very polite.
- The question is **specific** and offers two options: it shows the interviewer you analyzed the question, saw two directions, and helps them answer quickly.
- Correct grammar: "are you asking about…" uses the present continuous correctly for an action in progress.

### Why the other options are incorrect
- **"Can you repeat again the question?"**: Two errors. "Repeat" already means "do again," so adding "again" is redundant. Also, the word order is unnatural (the object must stand right next to the verb: "repeat the question"). Natural: "Could you repeat the question, please?"
- **"What do you mean? Your question is not clear."**: Grammatically correct but **blames the questioner**, with a sharp tone. In an interview, this register creates a bad impression.
- **"Please explain me the question."**: Incorrect structure. {{explain}} does not use the two-object structure like "give me something"; it must be "explain something **to** me": "Could you explain the question to me?" or better, "Could you clarify what you mean by…?"

> Senior tip: Asking for clarification is a **plus**, not a minus, especially with ambiguous system design questions. Native speakers often make questions open-ended on purpose. Use "Could you clarify…", "When you say X, do you mean…?", and restate your assumption: "I'll assume… unless you'd like me to consider…".`
    },
    'qz-english-003': {
      q: 'Interviewer: "Why did you choose eventual consistency?" Which explanation of the **trade-off** is the most natural and correct?',
      options: [
        'Eventual consistency is more better for scaling, so we used it.',
        "We went with eventual consistency because it let us scale writes, at the cost of users occasionally seeing data that's a few seconds stale.",
        'Despite of the stale data, we chose eventual consistency.',
        'We chose eventual consistency because it is the best approach.'
      ],
      explain: `**Correct answer: "We went with eventual consistency because it let us scale writes, at the cost of…"**

### Why this is correct
- States **both the benefit and the cost**: This captures the true essence of a trade-off.
- "**at the cost of** + noun/V-ing" is the standard phrase for mentioning the price paid. Similar phrases: "the trade-off is…", "the downside is…", "in exchange for…".
- "**went with**" is natural in spoken English for a choice; "let us scale" uses {{let + object + bare infinitive}} correctly.
- Including a specific number ("a few seconds stale") makes the answer credible.

### Why the other options are incorrect
- **"more better"**: **Double comparative** error. "Better" is already the comparative form of "good"; do not add "more." Correct: "better for scaling."
- **"Despite of"**: Incorrect preposition. Use "**despite** the stale data" or "**in spite of** the stale data." Also, this option only states a disadvantage, not why it was chosen.
- **"because it is the best approach"**: Grammatically correct but **lacks content**: it doesn't say what is better, or what the trade-off is. The interviewer will judge the candidate as not understanding the trade-offs; in system design, there is no "best," only "best for these constraints."

> Senior tip: Practice the structure: "We chose **X** over **Y** because **[constraint]**. The trade-off is **[cost]**, which we mitigated by **[action]**." For example: "…which we mitigated by reading your own writes from the primary for the user who just made the change."`
    },
    'qz-english-004': {
      q: 'You want to describe an achievement **you completed last year**. Which sentence is grammatically correct and most natural?',
      options: [
        'I have led the migration to Kubernetes last year.',
        'Last year I am responsible for lead the migration to Kubernetes.',
        'I led our migration to Kubernetes last year, which cut deployment time from 40 minutes to 8.',
        'I was leaded the migration to Kubernetes last year.'
      ],
      explain: `**Correct answer: "I led our migration to Kubernetes last year, which cut deployment time from 40 minutes to 8."**

### Why this is correct
- There is a specific past time marker ("last year") → use **past simple**: {{led}} (the irregular past of {{lead}}).
- The relative clause "**, which cut…**" connects the result immediately to the action, following the spirit of STAR (action + result).
- Subject "I" and strong verb "led" show clear personal ownership.

### Why the other options are incorrect
- **"I have led… last year"**: Incorrect tense. Present perfect **is not used** with a specific past time marker (last year, in 2023, two months ago). You can say "I have led two migrations" (no marker), but with "last year" it must be "I led."
- **"Last year I am responsible for lead…"**: Two errors: present tense for something last year (must be "was"), and after the preposition "for" you must use V-ing ("responsible for **leading**"). Also, "was responsible for" is weaker than "led" because it describes responsibility, not action.
- **"I was leaded"**: "lead" is an irregular verb (lead – led – led), there is no "leaded" in this sense; and the "was + V3" structure is **passive**, changing the meaning to "I was being led."

> Senior tip: When describing achievements in English, prioritize strong verbs in past simple (led, designed, cut, reduced, migrated, introduced) rather than "was responsible for" or "was involved in." Short sentences with quantitative results sound much more confident.`
    },
    'qz-english-005': {
      q: 'In a system design round, the interviewer suggests two services share a database and you **disagree**. Which expression shows disagreement most politely and professionally?',
      options: [
        "I see your point. My concern is that a shared database would couple the two services' release cycles. Would an outbox-based approach work here instead?",
        'You are wrong, a shared database is a bad idea.',
        'I am agree with you, but I think a shared database is not good.',
        'With all due respect, that idea makes no sense at all.'
      ],
      explain: `**Correct answer: "I see your point. My concern is that… Would an outbox-based approach work here instead?"**

### Why this is correct
The framework for polite disagreement includes 3 steps, and this answer has all of them:
1. **Acknowledge** the other person's view: "I see your point."
2. **State a specific concern** instead of judging: "My concern is that…" (focuses on the technical issue: coupling release cycles).
3. **Propose an alternative as a question**: "Would… work here instead?" opens the discussion, it is not forceful.

Grammar: The plural possessive "the two services' release cycles" (apostrophe after s) is correct.

### Why the other options are incorrect
- **"You are wrong…"**: Grammatically correct but **too direct**, attacking the person instead of discussing the idea. In an international work culture, especially when speaking to an interviewer, this register is very tactless.
- **"I am agree"**: Incorrect grammar. {{agree}} is a verb, not an adjective, so it is not used with "am." Correct: "I agree with you." This sentence is also contradictory: "agree" followed by "not good"; if you partly agree, say "I partly agree, but…".
- **"With all due respect, that idea makes no sense"**: "with all due respect" in native English often signals an upcoming criticism, combined with "makes no sense at all" it sounds **sarcastic**. It offers no reasoning or alternative.

> Senior tip: In system design interviews, the interviewer sometimes intentionally suggests a sub-optimal solution to see if you have the courage to counter it with reasoning. Phrases you should memorize: "My concern with that is…", "One risk I see is…", "Have we considered…?", "I'd lean towards X because…".`
    },
    'qz-english-006': {
      q: 'At the end of the interview, the interviewer asks "Do you have any questions for us?". Which question is best in terms of both grammar and content?',
      options: [
        'How much holidays do I get per year?',
        'What does your company do?',
        'Can you tell me what is the on-call process?',
        'How does the team decide when to pay down technical debt versus ship new features?'
      ],
      explain: `**Correct answer: "How does the team decide when to pay down technical debt versus ship new features?"**

### Why this is correct
- **Content**: Asking about how the team makes decisions shows you care about technical quality and work culture, which is appropriate for a senior candidate. The interviewer's answer also helps you evaluate the company.
- **Grammar**: Present simple question with auxiliary verb "does" is correct; "pay down technical debt" is a natural collocation; "versus" is used to contrast the two options.

### Why the other options are incorrect
- **"How much holidays"**: Incorrect grammar: "holidays" is a **countable** plural noun so "how many" should be used. More natural: "How much paid time off do we get?" (PTO is an uncountable noun). As for content, save this for the HR round; asking the technical interviewer makes an impression that you only care about benefits.
- **"What does your company do?"**: Grammatically correct but shows you **did not research** the company before the interview, a big negative.
- **"Can you tell me what is the on-call process?"**: **Indirect question** (embedded question) error. After "Can you tell me…," the question part must use the affirmative sentence order: "Can you tell me what **the on-call process is**?" Many Vietnamese learners make this mistake. The content of the question is fine.

> Senior tip: Prepare 3–4 questions for each interviewer: for an engineer, ask about code reviews, deployment, incidents; for a manager, ask about expectations for the first 6 months, performance evaluation. "What would success look like for this role in the first six months?" is a question that always works.`
    },
    'qz-english-007': {
      q: 'Interviewer: "Tell me about a mistake you made." Which sentence is **grammatically correct and demonstrates best ownership**?',
      options: [
        'The mistake was happened because of the QA team.',
        'Mistakes were made, but finally everything was okay.',
        'I made a mistake in a migration script that caused 20 minutes of downtime. I owned the incident, rolled back, and added a dry-run step to our pipeline.',
        'I did a big mistake in the migration script, but I fixed it very fast.'
      ],
      explain: `**Correct answer: "I made a mistake in a migration script that caused 20 minutes of downtime. I owned the incident…"**

### Why this is correct
- Standard collocation: **make a mistake**.
- Subject "I" in the **active** voice, showing clear responsibility; "I owned the incident" is a very natural way of speaking in technical environments.
- Parallel past simple verb chain "owned, rolled back, and added" is concise and coherent, with specific impact (20 minutes) and preventive action.

### Why the other options are incorrect
- **"The mistake was happened"**: Incorrect grammar. {{happen}} is an **intransitive verb**, it does not have a passive form. Correct: "The mistake happened…". Furthermore, "because of the QA team" is blaming others.
- **"Mistakes were made"**: Grammatically correct, but this is a **famous phrase for evading responsibility** (it doesn't say who caused it). Native speakers recognize this immediately. "Finally" is not used correctly here: to say "in the end everything was okay," "in the end" is more natural; "finally" usually emphasizes something occurring after a period of waiting.
- **"I did a big mistake"**: Incorrect collocation, in English you **make** a mistake, you don't "do a mistake" (an error due to translating from Vietnamese "làm sai"). Also "fixed it very fast" has no impact, no preventive action.

> Senior tip: Some collocations often misused in interviews: **make** a decision / a mistake / progress; **do** research / a review / your best; **take** ownership / responsibility / a risk; **raise** a concern; **meet** a deadline (not "catch a deadline").`
    },
    'qz-english-008': {
      q: 'You need a few seconds to think before answering a difficult question. Which is the most natural and professional?',
      options: [
        'Wait me a second.',
        "That's an interesting one. Let me take a moment to think it through.",
        'Give me a time to think.',
        'Ehh... uhm... so... yeah, well...'
      ],
      explain: `**Correct answer: "That's an interesting one. Let me take a moment to think it through."**

### Why this is correct
- "**Let me take a moment**" is a polite, proactive way to ask for time, letting the interviewer know the subsequent silence is intentional.
- "**think it through**" (phrasal verb: think thoroughly) shows you will give a structured answer.
- "That's an interesting one" acknowledges the question, creating another natural beat.

### Why the other options are incorrect
- **"Wait me a second"**: Incorrect grammar. {{wait}} needs the preposition **for**: "wait for me." But even "Wait for me a second" sounds like an order. More natural: "Give me a second" or "Just a second."
- **"Give me a time to think"**: Incorrect article. "Time" is an uncountable noun, so don't use "a." Correct: "Give me **some** time" or "Give me **a moment**." This raw imperative sentence is also a bit abrupt.
- **"Ehh... uhm... so... yeah, well..."**: A string of filler words makes you sound confused and lacking confidence. 3–5 seconds of intentional silence after a good opening phrase is much better than filling it with meaningless sounds.

> Senior tip: With system design questions, you can ask for time naturally by stating the structure: "Let me first clarify the requirements, then sketch the high-level design." You get time to think, while showing methodical thinking.`
    },
    'qz-devops-003': {
      q: 'Deployment runs normally but HPA never scales even though Pod CPU is high. What is the most common cause and the correct fix?',
      options: [
        'HPA only works with Prometheus, so you must install Prometheus instead of metrics-server',
        'Deployment must use Recreate strategy instead of RollingUpdate for HPA to read the metric',
        'Must set minReplicas to 0 for HPA to enable load-based scaling mode',
        'Container does not declare CPU request so HPA has no denominator to calculate utilization; must declare reasonable requests and check metrics-server'
      ],
      explain: `**Correct answer: missing CPU request prevents HPA from calculating utilization.**

HPA of the resource metric type uses the formula: **utilization = actual usage / container's average request**. If the container does not declare {{resources.requests.cpu}}, the denominator does not exist, HPA cannot calculate the percentage and usually reports an inability to get the metric instead of scaling. Furthermore, the cluster must have **metrics-server** (or an adapter for custom metrics) and the Pod must run long enough for metrics to stabilize.

### Why the other options are incorrect
- **Need Prometheus instead of metrics-server**: Not required. HPA reads resource metrics via metrics API; Prometheus + prometheus-adapter is only needed when scaling based on custom metrics like queue length.
- **minReplicas to 0**: Standard HPA requires at least 1 replica. Scaling to 0 requires a separate feature gate and external metrics, unrelated to CPU not being received.
- **Must use Recreate**: Rollout strategy does not affect HPA reading metrics. Recreate also causes downtime, not a condition for HPA.

### Quick cluster check
~~~bash
kubectl top pods -n my-ns
kubectl describe hpa my-api -n my-ns
kubectl get deployment my-api -o jsonpath="{.spec.template.spec.containers[0].resources}"
~~~
If {{kubectl top}} fails, the fault is in metrics-server; if top runs but HPA reports unknown, it's usually due to missing requests or a recently restarted container.

> Senior tip: Don't set CPU request too low just to make HPA "more sensitive" — request also determines scheduling and QoS. Right-size based on actual p95, use VPA in recommend mode to get data, and for I/O-bound workloads, scale based on latency or queue length instead of just CPU.`
    },
    'qz-devops-004': {
      q: 'Every Java source code change takes nearly 10 minutes to Docker build because it re-downloads all Maven dependencies. What is the best improvement?',
      options: [
        'COPY all source first then run mvn package so Docker can cache the source',
        'Always build with --no-cache to avoid using old layers and ensure a clean build',
        'Layer separation: copy pom.xml and download dependencies first, then copy source and build; use multi-stage so the final image only contains JRE and jar',
        'Build in advance on the dev machine then copy the target folder into the image so CI doesn\'t have to build'
      ],
      explain: `**Correct answer: separate layers by frequency of change and use multi-stage build.**

Docker cache invalidates a layer and **all layers after it** when the input content changes. If you copy the source first then run Maven, every Java file change causes the dependency download step to re-run from scratch. Reverse the order: copy {{pom.xml}} (or all multi-module poms) and run the dependency download step first; source changes only invalidate the following layers, so dependencies remain in cache. Multi-stage helps the runtime image not contain Maven, JDK, and source, reducing size and attack surface.

### Why the other options are incorrect
- **Copy source first**: This is the cause of the slowness. Every source change invalidates the dependency cache.
- **--no-cache**: Disabling cache goes against the goal, making the build even slower and losing the benefit of reproducibility.
- **Build on dev machine then copy target**: Image depends on the build environment, is not reproducible on CI, easily includes junk files, and you lose control over the toolchain.

### Simplified Dockerfile
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

> Senior tip: With BuildKit, use a cache mount for the {{/root/.m2}} directory to reuse dependencies between builds even when pom changes. And pin the base image by digest or specific tag, don't use {{latest}}, otherwise "clean" builds can still differ between runs.`
    },
    'qz-devops-005': {
      q: 'You want to switch from blue-green to canary for a service with database schema changes. What is the most important prerequisite?',
      options: [
        'Delete old data before deploying canary to avoid schema conflicts',
        'Canary only works when the service has no database',
        'Must deploy all instances at once so the schema is always synchronized',
        'Migration must be backward compatible following expand-contract so old and new versions run on the schema simultaneously during transition, along with metrics and automatic rollback'
      ],
      explain: `**Correct answer: backward compatible migration following expand-contract.**

In canary, old and new versions **run simultaneously** on the same database. Therefore, the schema must be the intersection of the two versions: add new columns/tables (expand), backfill data, make new code read/write compatible, only delete columns/things not used when the old version is gone (contract). Changes that break compatibility like renaming columns, changing types, adding NOT NULL without default will break the old version as soon as canary receives traffic.

### Why the other options are incorrect
- **Delete old data first**: Destroys data and doesn't solve compatibility; the old version is still running and will fail.
- **Canary cannot be used with database**: Incorrect; canary still works provided the schema is backward compatible; this is a migration problem, not a limitation of canary.
- **Deploy all at once**: This is big-bang, losing the very benefit of canary to reduce risk, and there is still a period when two versions run simultaneously during rollout.

### Safe Sequence
1. **Expand**: Add nullable column or new table, do not change columns currently in use.
2. **Dual write/read** and backfill in batches, monitor lag.
3. **Rollout canary** 1–5–25–100%, compare error rate, latency, business metrics with baseline.
4. **Contract**: After the old version is completely gone, delete the leftover part.

> Senior tip: Always design migrations to be **roll-backable in minutes**. With PostgreSQL, adding a nullable column is almost instantaneous, while adding default for a huge table might rewrite the table in older versions — check specific versions. Do not combine migration and code deployment into one inseparable step.`
    },
    'qz-devops-006': {
      q: 'The test suite on CI is green sometimes, red other times (flaky). What is the correct way to handle this?',
      options: [
        'Isolate test: each test creates its own data with unique id or rollbacks transaction, does not depend on run order; replace sleep with conditional wait; reproduce by running in a loop then fix the root cause, do not blindly retry',
        'Enable retry 3 times in CI so the pipeline is always green',
        'Increase timeout of the entire test to 10 minutes',
        'Run tests in parallel more to be faster and encounter fewer errors'
      ],
      explain: `**Correct answer: find and eliminate the root cause of the flaky test.**

Flaky tests often come from **shared state** between tests (same database, same user, same file), **dependency on run order**, **real time** (sleep, timezone), **asynchrony** (threads, late message arrival), **fixed ports**, or **non-seeded random data**. The fix is to make the test independent and deterministic: unique data, transaction rollback or cleanup, inject {{Clock}}, use {{Awaitility}} instead of sleep, dynamic port allocation. Then run in a loop many times to confirm it no longer flakes.

### Why the other options are incorrect
- **Retry in CI**: Masks the real error, makes a false-green pipeline and increases time; the user still encounters the error in production.
- **Increase timeout**: Only makes the test slower, doesn't fix the cause; some errors become even harder to see.
- **Run in parallel more**: For tests sharing state, parallelism causes more conflicts and makes flakiness worse.

### Handling Process
- Label the test **flaky** and put it in a tracker, do not delete silently.
- Run the test in isolation in a loop 50–100 times to reproduce.
- Read logs at the time of failure, find shared resources or time assumptions.
- Fix the root cause, then run many times before removing the label.

> Senior tip: Measure the **flake rate** weekly and set alert thresholds. One 1% flaky test in a suite of 100 tests makes the pipeline fail about 63% of runs (1 - 0.99^100), so even small flakes are very expensive. And don't use {{Thread.sleep}} in tests — if you must wait, wait for a condition with a clear timeout and log the reason.`
    },
    'qz-devops-007': {
      q: 'Pod Java is OOMKilled even though -Xmx is set lower than the container memory limit. What is the cause and correct fix?',
      options: [
        'OOMKilled only relates to heap, so just set -Xmx equal to memory limit is enough',
        'Must turn off swap in the container because swap is the only cause of OOMKilled',
        'Besides heap, there is metaspace, code cache, thread stack, direct/native memory and JVM overhead; need to set limit with headroom, use appropriate MaxRAMPercentage and monitor RSS/NMT',
        'Set -Xms larger than -Xmx so JVM pre-allocates all memory'
      ],
      explain: `**Correct answer: container memory limit includes many memory regions outside the Java heap.**

{{-Xmx}} only limits the **heap**. The Java process also uses **metaspace**, **code cache**, **thread stack** (usually 512 KB–1 MB per thread), **direct buffer** (Netty, NIO, JDBC driver), **memory-mapped file**, internal JVM structures, native libraries, and the allocator. If the total exceeds the limit, the kernel sends SIGKILL and Kubernetes records {{OOMKilled}} — no heap dump is generated because the JVM cannot react in time. Therefore, need to set a limit with headroom (heap usually occupies 60–75% of limit), use {{-XX:MaxRAMPercentage}} for JVM to auto-calculate based on container limit, limit direct memory if using Netty, and monitor actual RSS via metrics.

### Why the other options are incorrect
- **Just set -Xmx equal to limit**: Leaves out the entire region outside the heap, making it even more likely to be killed.
- **Turn off swap**: Swap is not the cause of OOMKilled of the container; turning off swap doesn't solve the process exceeding the limit.
- **-Xms larger than -Xmx**: Invalid configuration, JVM refuses to start.

### Investigation methods
~~~bash
kubectl describe pod my-api | grep -A3 "Last State"
kubectl exec my-api -- jcmd 1 VM.native_memory summary
~~~
Compare **RSS** with the limit, look at direct buffer and number of threads. If RSS increases with load, find the leak (buffer, ThreadLocal, unbounded cache) before just increasing the limit.

> Senior tip: Set {{-XX:MaxRAMPercentage=75}} instead of hard-coding {{-Xmx}} so the same image runs with multiple limit levels. With Netty, set {{-XX:MaxDirectMemorySize}} and check the leak detector. Don't set limit at the average usage level — need headroom for peak load and native parts.`
    },
    'qz-devops-008': {
      q: 'You discover an API key baked into a Docker image pushed to the registry. What is the correct and most sufficient action?',
      options: [
        'Delete the latest tag, the old image will automatically become unavailable',
        'Rotate and revoke the key immediately, stop using that image, move secret to runtime (secret manager/env), add secret scan to CI and treat the exposed key as compromised',
        'Add a new layer overwriting the file containing the secret because the old layer has been masked',
        'Just rename the environment variable in Dockerfile'
      ],
      explain: `**Correct answer: rotate key first, then fix the process so secret does not enter the image.**

Image and registry store **all layers**, including layers overwritten by later layers. Anyone who pulls the image can use {{docker history}} or extract the layer to get the secret. Deleting a tag does not delete existing digests; those who have pulled or cached it still hold a copy. Therefore the first action is **revoke the key** (treat as compromised), then delete the image/digest according to policy, and fix how secrets are injected: read from secret manager or environment variable at runtime, do not COPY files or use {{ARG}} for secrets.

### Why the other options are incorrect
- **Delete latest tag**: Only removes one label; the old digest still exists and pulled copies remain usable. Key is still exposed.
- **Add overwriting layer**: The old layer still lies in the image; data once written cannot be deleted.
- **Rename environment variable**: The secret value still exists in the image/history, not reducing risk.

### Prevention
- Enable **secret scanning** for repo, image and commit history.
- Use BuildKit secret mount or secret manager, do not use {{ARG}}/{{ENV}} for secrets.
- Add CI blocking step when key pattern is detected.
- Limit registry permissions and audit who pulled the image.

> Senior tip: When a secret lands in an image, its lifespan starts from the time of push, not the time you discover it. Design short-lived keys that can be rotated, and log key usage to detect anomalies. Don't just delete the commit or tag and consider it done.`
    },
    'qz-kotlin-003': {
      q: 'A coroutine calls blocking JDBC in launch(Dispatchers.Default) reducing application throughput. What is the correct fix?',
      options: [
        'Switch to GlobalScope.launch to not be limited by dispatcher',
        'Add Thread.sleep(0) after the call to yield CPU to other coroutines',
        'Increase number of Dispatchers.Default threads with system property',
        'Wrap blocking call in withContext(Dispatchers.IO) or use suitable async client, keeping structured concurrency and cancellation handling'
      ],
      explain: `**Correct answer: move blocking part to dispatcher dedicated to I/O.**

{{Dispatchers.Default}} is designed for **CPU-bound** work, the number of threads is limited by core count (minimum 2). A blocking JDBC call will **occupy a thread** for the entire I/O waiting duration, exhausting the pool and making other coroutines starve for threads even if CPU is idle. {{Dispatchers.IO}} has a larger and elastic pool, suitable for blocking I/O; or use reactive/async driver if available. Equally important is keeping **structured concurrency**: use {{withContext}} inside the current scope so errors and cancellation propagate correctly.

### Why the other options are incorrect
- **GlobalScope.launch**: Escapes the parent scope so it is not canceled when the request ends, easily leaking coroutines and losing error propagation.
- **Thread.sleep(0)**: Does not yield thread in a meaningful way; thread remains busy and other coroutines still wait.
- **Increase Default threads**: Cheating the symptom, creates too many threads, wastes memory and contention; Default is not intended for blocking.

### Notes on Dispatchers.IO
- The IO pool also has a limit (default 64 threads or core count, whichever is larger), so if the database pool only has 10 connections, running 64 concurrent calls is useless. Use {{limitedParallelism(10)}} to match the connection pool.
- JDBC does not support cancellation; can wrap with {{runInterruptible}} if the driver reacts to interrupt, but must verify in practice.
- On Java 21 can use virtual threads for blocking tasks, but still need to limit based on actual resources.

> Senior tip: The rule is **blocking goes with IO, computation goes with Default**. Set timeout for every external call and measure wait time; if you see coroutines waiting for threads instead of waiting for I/O, that is a sign the dispatcher is being used incorrectly.`
    },
    'qz-kotlin-004': {
      q: 'When should Sequence be used instead of List in Kotlin?',
      options: [
        'For long transformation chains on large collections and when only the final result is needed, to avoid creating intermediate collections; but not when multiple traversals are needed or indexed access is required',
        'Always use Sequence because it is faster than List in all cases',
        'Sequence caches results so only calculates once',
        'Sequence only works with small collections because it is slower than List'
      ],
      explain: `**Correct answer: Sequence is suitable for lazy pipelines on large data, used once.**

{{Sequence}} performs transformations **lazily**: each element goes through the entire {{map/filter}} chain before moving to the next element, creating no intermediate list. With large data or chains with many steps, this method saves memory and can **stop early** when encountering {{first()}}, {{find()}}, {{take(n)}}. But sequence is **cold**: every traversal will recalculate from scratch, and indexed access is inefficient because it must traverse sequentially.

### Why the other options are incorrect
- **Always faster than List**: For small collections, the overhead of creating lambdas and iterators of sequence can be larger than looping over a list; list is also better optimized.
- **Cache results**: Sequence does not cache; to reuse, must call {{toList()}} and hold the result.
- **Only use for small collections**: Contrary, sequence leverages benefits with large data or infinite sources.

### When to choose what
| Situation | Should use |
|---|---|
| Large data, many steps, only final result needed | Sequence |
| Multiple traversals needed, indexed access, small size | List |
| Infinite source or read gradually from file | Sequence |
| Need parallelization | Java parallel stream or coroutine, not Sequence |

> Senior tip: Don't optimize too early. Measure first; if profiler shows many intermediate collections and memory increasing sharply then switch to sequence. And remember Sequence is different from Java {{Stream}}: stream is used once, sequence can be repeated (though must calculate again).`
    },
    'qz-kotlin-005': {
      q: 'You need to write a generic function taking type T and knowing Class of T at runtime to deserialize JSON. What is the correct way in Kotlin?',
      options: [
        'Use reified type parameter in inline function for compiler to insert the actual type; if cannot inline then pass KClass or TypeReference explicitly',
        'Use T::class directly in every generic function, including non-inline functions',
        'Cast (T) Any() then read javaClass to get actual type',
        'Kotlin preserves type token for every generic so nothing extra needed'
      ],
      explain: `**Correct answer: use reified in inline function, or pass type token explicitly.**

On JVM, generic is subject to **type erasure**: inside the function, {{T}} no longer exists at runtime. Kotlin allows {{inline fun <reified T> ...}} for the compiler to **insert the actual type** at the call site, thanks to which {{T::class}}, {{is T}}, or {{typeOf<T>()}} can be used. In exchange, inline increases bytecode and cannot be used for virtual functions/interface methods. When cannot inline, pass clearly {{KClass<T>}} or use {{TypeReference}}/{{ParameterizedTypeReference}} of the JSON library to keep generic information.

### Why the other options are incorrect
- **T::class in every generic function**: Only valid when {{T}} is reified in inline function; if not, compiler reports error.
- **Cast (T) Any()**: Creates object of type Any, does not carry T information; reading {{javaClass}} only returns {{Any}}, and casting can throw ClassCastException.
- **Kotlin preserves type token**: Incorrect; Kotlin is also subject to type erasure like Java.

### Example
~~~kotlin
inline fun <reified T> fromJson(json: String): T =
    jacksonObjectMapper().readValue(json, T::class.java)

// Cannot inline: pass token explicitly
fun <T> fromJson(json: String, type: TypeReference<T>): T =
    jacksonObjectMapper().readValue(json, type)
~~~
With nested generics like {{List<Order>}}, {{T::class.java}} is not enough; need {{TypeReference}} or {{typeOf<List<Order>>()}}.

> Senior tip: Prioritize passing type tokens at the **boundary** (HTTP client, repository) instead of scattering reified everywhere. Reified is convenient but makes code bloated and hard to debug; with Jackson, a {{TypeReference}} placed correctly is often clearer.`
    },
    'qz-kotlin-006': {
      q: 'An lateinit var property in a singleton is read from multiple threads. What is the main risk?',
      options: [
        'lateinit is automatically thread-safe thanks to the lateinit keyword',
        'lateinit does not allow nullable type so there is no risk',
        'No guarantee of visibility or initialized once: other threads can read before assignment and throw UninitializedPropertyAccessException, or see value not safely published',
        'lateinit only causes error when property is primitive type'
      ],
      explain: `**Correct answer: lateinit is not synchronized and does not guarantee safe publication.**

{{lateinit var}} is compiled into a regular field accompanied by a null check each read; it **adds no** {{volatile}}, lock, or initialized-once mechanism. If thread A assigns value while thread B reads, B can:
- read before A assigns and get {{UninitializedPropertyAccessException}}, or
- see the reference but not the full state inside the object due to missing happens-before relationship.

Checking {{isInitialized}} is also not atomic with the read immediately after.

### Why the other options are incorrect
- **Automatically thread-safe**: No synchronization mechanism is generated.
- **Not nullable so no risk**: Nullability of type is not related to thread safety; risk lies in time of assignment and visibility.
- **Only error with primitive**: lateinit does not apply to primitive; error happens with all unassigned reference types.

### Correct approach
- Initialize in constructor or initialization function running before object sharing.
- Use {{by lazy}} (default SYNCHRONIZED) for safe initialized-once.
- If must assign later, use {{@Volatile}} with double-checked locking or a safe publication mechanism.
- With dependency injection, let the framework manage lifecycle instead of self-assigning in singleton.

> Senior tip: lateinit is suitable for **test setup** or framework calling clear lifecycle, not for arbitrary shared state. If you find yourself having to check {{isInitialized}} in production code, that is usually a sign to switch to constructor injection or controlled lazy.`
    },
    'qz-kotlin-007': {
      q: 'What synchronization mode does by lazy use by default, and when should you switch to other modes?',
      options: [
        'PUBLICATION, safe for all cases and never calculates twice',
        'SYNCHRONIZED: only one thread calculates, others wait; use NONE when certain only one thread accesses to skip lock cost, but can calculate multiple times if multithreaded',
        'NONE is default and not thread-safe',
        'Lazy only supports NONE so must self-synchronize externally'
      ],
      explain: `**Correct answer: default is SYNCHRONIZED; NONE only use when certain it is single-threaded.**

Kotlin provides three modes:
- **SYNCHRONIZED** (default): lock around initialization, only one thread calculates, other threads wait. Safe but has lock cost on the first access.
- **PUBLICATION**: multiple threads can calculate together, which thread publishes first wins; other threads might have calculated and discarded results. No lock so faster in contention, but initializer can run multiple times — only use when initializer has no side effects and is acceptable.
- **NONE**: not synchronized; fastest but not thread-safe if multiple threads access.

### Why the other options are incorrect
- **PUBLICATION default and never calculates twice**: wrong both parts; PUBLICATION can calculate multiple times.
- **NONE is default**: wrong, default is SYNCHRONIZED.
- **Only supports NONE**: wrong, has enough three modes.

### Practical notes
- If initializer throws exception, subsequent access will **try again** (with SYNCHRONIZED) instead of caching exception.
- With singleton managed by DI container, often don't need lazy; let container decide scope.
- Measure before switching to NONE: one-time lock cost is usually negligible compared to risk of race.

> Senior tip: Don't choose NONE just because it is "faster." In Android, lazy attached to UI thread often uses NONE intentionally; in backend multithreaded, keep SYNCHRONIZED unless proven only one thread accesses. And remember lazy only solves initialization, doesn't protect object from mutation after.`
    }
  });
})();
