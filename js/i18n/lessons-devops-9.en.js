/*
 * English translation of js/data/lessons-devops.js — task T757. Format: js/core/i18n.js (content overlay).
 * ids: lesson-devops-012
 */
App.i18n.content({
  'lesson-devops-012': {
    title: "Structured logging and correlation id: one-line JSON logs, MDC across a thread pool, levels per environment, never log PII",
    goals: [
      "Explain why one-line JSON logs serve you better than free-text logs when you run 30 Pods, and why the app only writes to stdout",
      "Say where the correlation id (traceId) is generated, how it is carried across services, and what question it lets you answer",
      "Understand ThreadLocal deeply enough to explain why MDC can both LOSE entries and LIE to you once a task jumps to a thread pool",
      "Write the wrapper that copies the context at submit time and cleans up in {{finally}}, and know why it must copy a snapshot instead of sharing the map",
      "Pick log levels per environment, change a level mid-incident, and name the 4 layers that shield PII from the logs",
    ],
    body: `### What a log line actually is, and why free-text logging blinds you during an incident

A log line is really just text the app prints while it is running, so the person operating the system can read what happened **after** it happened. The habit most people fall into is string concatenation:

~~~java
log.info("Order " + orderId + " failed for user " + userId);
// prints: 2026-05-04 10:15:32 INFO Order 8842 failed for user 5501
~~~

On one machine with one process that is usable enough. In production, with 30 Pods and 200 requests per second, it becomes a burden: to answer "how many orders failed in the last 15 minutes" you have to write a regex over text that was written for humans to read, and that regex breaks the moment somebody changes one word in the sentence. Unstructured logs have **no metrics**; with no metrics there is no early alerting, and the person who discovers the incident is the customer instead of your team.

### Structured logging: each log line is a one-line JSON object

**Structured logging** is a rule: every log line is an object with clearly named fields, printed on exactly one line. The common format is NDJSON (Newline Delimited JSON: one complete JSON object per line, the lines are not joined into one big array, so you can read it with {{grep}} and stream it line by line).

~~~json
{"timestamp":"2026-05-04T10:15:32.481Z","level":"ERROR","service":"order-service","traceId":"4bf92f3577b34da6a3ce929d0e0e4736","spanId":"00f067aa0ba902b7","orderId":"8842","errorCode":"PAYMENT_DECLINED","message":"payment declined"}
~~~

You gain three things:
- Filtering and counting on exact fields, for example {{errorCode = "PAYMENT_DECLINED"}}, instead of guessing where the words sit inside a sentence.
- Adding a new field without breaking the old ones; the whole company shares one schema, so a single dashboard works for 20 services.
- **The stack trace sits in one field** of the same object. This is a life-or-death detail: the log-shipping agent reads line by line, so an 80-line stack trace gets chopped into 80 separate records and loses its connection to the ERROR line that produced it.

On the JVM: Logback + a JSON encoder ({{logstash-logback-encoder}}), or Spring Boot 3.4+ where it is built in and switched on with {{logging.structured.format.console=ecs}}. The minimum field set should be agreed once for the whole company: {{timestamp}} (ISO-8601, **UTC**), {{level}}, {{service}}, {{version}}, {{traceId}}, {{spanId}}, {{message}}.

> Note: ECS (Elastic Common Schema) is only a naming convention for fields. The value of agreeing on names lies elsewhere: a query or a dashboard written once works for another team's service, including for a team that does not exist yet.

### Why the app writes to stdout only — do not manage log files inside a container

The 12-factor rule: the app writes to **stdout/stderr** and does not manage log files itself. Three very concrete reasons once you run on Kubernetes:
- A Pod is disposable: when the Pod is deleted, the log file sitting in its layer disappears with it. Mounting a PVC (PersistentVolumeClaim: a persistent disk slot attached to a Pod) is not the answer, because a PVC binds to **one** fixed Pod while a Deployment replaces Pods constantly.
- Node disk is a shared asset. The app writes and rotates its own files; when an incident makes log volume swell 20x, it fills the disk, kubelet eviction sweeps the whole node, and the fire spreads to other teams' Pods.
- The container runtime **already** writes the container's stdout to a JSON file on the node, with rotation built in, and that file is exactly what {{kubectl logs}} reads. An agent running as a **DaemonSet** (Fluent Bit, Vector, Grafana Alloy) reads that file, attaches extra metadata (namespace, pod, app label) and ships it to Loki or OpenSearch.

So "the app writes logs to a file" inside a container is an operational design error, not a personal preference.

### correlation id / traceId: the tracking number of one unit of processing

A **correlation id** — in the tracing world it is called a **traceId** — is a single unique identifier attached to **every** log line belonging to one unit of processing, even when that processing passes through 6 services. Think of the tracking number printed on every slip of a shipment: you do not need to know which warehouses it went through, you look up the number and the entire journey comes back.

~~~seq
title: One request carries the same traceId through four systems
actors: Client | Gateway | Order | Payment | Logs
Client -> Gateway: POST /orders with no traceparent header
Gateway -> Gateway: generate traceId then put it into MDC
Gateway -> Order: traceparent: 00-traceId-spanId-01
Order -> Payment: call payment, still the same traceId
Order --> Gateway: 502 PAYMENT_DECLINED
Payment --> Logs: every log line carries the traceId
note Logs..Logs: looking up one traceId returns the whole journey
~~~

The standard for carrying it between services is the **W3C traceparent** header, shaped {{00-<32 hex traceId>-<16 hex spanId>-<flags>}}; flags {{01}} means this trace is kept (sampled). The **traceId** never changes for the whole request, while the **spanId** identifies each individual step, so you can tell whether a log line belongs to the order-service step or the payment-service step. Spring Boot 3 uses **Micrometer Tracing** (a bridge onto OpenTelemetry or Brave): it generates or restores the traceId from the header by itself, puts it into the MDC by itself, and attaches the header automatically for instrumented clients (RestClient, WebClient, Feign, KafkaTemplate).

The thing you must be able to say in an interview: the traceId is generated at the **edge** (the gateway, or the first filter of the service being entered) and then **handed along**, it is not regenerated by each service. If every service mints its own, every service has its own private log world and nothing can be joined together.

### How MDC works: a Map attached to the thread

**MDC (Mapped Diagnostic Context)** in SLF4J/Logback, put simply, is a {{Map<String,String>}} **attached to the thread that is running**. The JSON encoder prints that whole map into every log line, so business code never has to write the traceId itself:

~~~java
// Servlet filter: runs on the thread handling this HTTP request
String incoming = request.getHeader("traceparent");
MDC.put("traceId", incoming != null ? extractTraceId(incoming) : newTraceId());
try {
    chain.doFilter(request, response);   // every log deep inside now automatically has the traceId
} finally {
    MDC.clear();                         // REQUIRED: this thread will serve another request
}
~~~

You need to understand the mechanism down to its root, because this is where everything breaks. MDC is built on **ThreadLocal**: a variable where **each thread has its own copy**, and one thread cannot see another thread's copy (the JVM keeps the values in a map stored inside the Thread object itself). Tomcat's "one request, one thread" model makes MDC look like magic: the request enters and leaves on the same thread, so the map is always the right one. The magic disappears as soon as your work jumps to a different thread — that is, when you use {{@Async}}, {{ExecutorService.submit}}, {{CompletableFuture.supplyAsync}}, {{parallelStream}}, {{@Scheduled}}, a Kafka/Rabbit listener (which runs on the container factory's threads), or a log appender that writes **asynchronously** ({{AsyncAppender}} has its own pool of threads).

### Why MDC is lost when crossing to another thread — and the second failure mode is even more dangerous

There are **two** ways it breaks, and a good interviewer will expect you to name both:
1. **Loss**: the worker thread has an empty map → the request's logs carry no traceId → you end up with a pile of ERROR lines and no idea which transaction they belong to.
2. **Contamination**: pool threads **outlive** the request. Request A leaves {{traceId=X}} behind, task B runs on that very thread and sets nothing → B's logs carry A's traceId. This is far more dangerous than loss, because it hands you a complete picture that is **wrong**: two transactions glued into one, and you spend 40 minutes investigating because the data looked believable. The root cause is still ThreadLocal: the value lives with the **thread**, not with the **request**, and a pool reuses threads.

The fix: **copy the map to the other thread and clean up after running**. With Spring's {{TaskDecorator}}:

~~~java
executor.setTaskDecorator(runnable -> {
    Map<String, String> captured = MDC.getCopyOfContextMap();       // a COPY, not the original map
    return () -> {
        Map<String, String> previous = MDC.getCopyOfContextMap();   // this thread may already be carrying someone else's work
        if (captured != null) MDC.setContextMap(captured); else MDC.clear();
        try {
            runnable.run();
        } finally {
            if (previous != null) MDC.setContextMap(previous); else MDC.clear();
        }
    };
});
~~~

Three details separate someone who has actually written this code from someone who only read a blog post about it:
- Use a **copy**. {{getCopyOfContextMap}} already returns a copy; if you hand-roll it and copy the **reference** to the original map, the worker's writes mutate the calling thread's context too, and two tasks running in parallel on one map is an unsolved race.
- Capture the context **at submit time**, not at run time. Reading MDC inside the task means reading the context of the thread running the task: empty, or the previous request's.
- **Restore in the {{finally}}**, do not {{clear}} unconditionally. {{clear}} also wipes the context of a nested working thread (for example the appender's own thread pool), while not cleaning at all leaves the traceId behind for the next request.

You don't have to write this yourself once a library is available: Micrometer **context-propagation** offers {{ContextSnapshot.setThreadLocals()}} and {{autoContextPropagation(runnable)}}, OpenTelemetry offers {{Context.current().wrap(runnable)}} (which also does exactly those three things: capture, set, restore). The exercise below asks you to write it correctly once, because "why is MDC lost on a thread pool" is still a classic interview question: it checks whether you understand ThreadLocal or merely know which API to call.

### Log level: choose it per environment, change it mid-flight without a deploy

The table below is the sane template (ordered from most to least expensive by the amount of text it generates):

| Level | When to use it | Real example |
|---|---|---|
| ERROR | a human must intervene, users are affected | payment failed, cannot connect to the DB |
| WARN | abnormal, but the system copes on its own | retry attempt 3 succeeded, fallback kicked in |
| INFO | a lifecycle milestone of a business flow | received order 8842, stock decremented, email sent |
| DEBUG | technical detail used for investigation | payload after mapping, a filter's decision |
| TRACE | every single step inside a loop | every frame of one WebSocket connection |

The per-environment template: DEV runs DEBUG for your own package; UAT runs INFO; PROD runs INFO (WARN if the service is too noisy). When an incident hits you **turn DEBUG on for exactly one logger** and then off, instead of changing the global level and redeploying:

~~~bash
curl -X POST http://pod:8080/actuator/loglevel/com.acme.payment -d '{"configuredLevel":"DEBUG"}' -H 'Content-Type: application/json'
~~~

> Note: DEBUG in production is not cheap. Logs are money and logs are risk: volume 10-50x higher makes the pipeline lag (you need those logs, but they arrive 5 minutes late — exactly while you are investigating), node disks fill up, alert noise multiplies, and the chance of leaking sensitive data rises precisely when the system is at its weakest. Put a **TTL** on DEBUG: drop back to INFO automatically after 30 minutes, because people always forget to turn it off after forgetting to turn it off.

One code habit that silently multiplies volume without anyone noticing: concatenating straight into the message builds the string **even when the level is off**, whereas passing the values as separate parameters (the marker form) only assembles the string when the level is actually enabled.

### Do not log PII: not even one field

**PII** (Personally Identifiable Information: information that identifies an individual — name, national ID card ({{cccd}}), phone number, email, address, card number, KYC documents). The hard rules:
- **Never** write: passwords, tokens/session ids, CVV/CVC, the full card PAN (only the last 4 digits, masked), national ID numbers, OCR images, the entire body of login/KYC endpoints.
- The reason is not only GDPR / VNeID-era compliance: logs get copied into many systems (ELK, S3, Grafana Cloud, the vendor's backups), **everybody has read access in order to debug**, and they are retained for 90 days. You lose control of the data the moment it enters a log, so there is no "sorry, we deleted it" option.
- PCI DSS forbids storing CVV after authorization, and the PAN must be hidden.

The leakiest places are the things you do **not** log directly:
- Logging the whole request object: passing a DTO into the log because it is convenient, while the DTO has a {{password}} or {{cccd}} field — Lombok's {{toString}} prints both of them in the clear.
- Exception messages carrying user input: {{IllegalArgumentException: invalid card 4111111111111111}}.
- Framework debug logging: raising {{logging.level.org.springframework.web}} to TRACE prints the entire request body.

Defend in several layers, because at some point a new dev will leak by accident:
1. **Mask at the source**: the DTO exposes only already-masked getters ({{getCardMasked()}} returns the {{****1111}} form), and no raw getter exists anywhere in the log path.
2. **The encoder layer**: a masking converter shared company-wide, driven by a list of sensitive keys (password, token, cccd, pan, cvv, email, phone).
3. **The pipeline layer**: an obfuscation processor in the OTel Collector, a card-number regex guard **before** the data is written to the store — this layer also rescues the services that have not been updated yet.
4. **Tests**: a unit test that logs an object holding every sensitive field and asserts the output string does **not** contain the raw value. This is the only thing that keeps the rule alive across years and across generations of devs.

### Production traps you will really hit
- **AsyncAppender drops all context**: the appender writes on its own thread without propagating MDC, or {{includeCallerData}} is switched on to get the source line name and is astronomically expensive (it has to take the stack trace of **every** log event).
- **{{MDC.clear()}} placed outside the finally**: a single exception leaves the context behind for the next request, and you now have a bug that only reproduces at 2am.
- **{{parallelStream}} and {{CompletableFuture}}**: it looks like synchronous code inside one method so you assume it is fine, but the work is actually running on the shared ForkJoinPool.
- **Logging inside a loop**: {{log.info}} for every row of a 100,000-record batch, which during an incident becomes 100,000 lines for **each** retry.
- **Setting the traceId and forgetting to remove it at the boundary**: a Kafka worker must read the traceId from the message header and put it into MDC at the **start** of each poll, then remove it at the **end** of the poll; skip the removal and two messages get glued into one.
- **A generic field name meaning something different in each service**: here {{user}}, there {{username}}, there {{userId}} — you cannot write a query at all; the fix is a shared schema (ECS) plus an internal starter.
- **No cap on message length**: a 500KB stack trace lands in the log store and indexing cost explodes. Truncate the string and set the limit at the appender.

### Interview notes
The question you always get: "How do your logs work in production, and why did my logs lose the traceId when I used {{@Async}}?" — answer along exactly this line: the app writes one-line JSON to stdout, a DaemonSet agent ships it to Loki/OpenSearch, every line carries {{timestamp}}/{{level}}/{{service}}/{{traceId}}/{{spanId}}; the traceId is generated at the edge and handed along through the {{traceparent}} header; MDC is a ThreadLocal map so it does **not** follow your work onto a pool thread — you must capture a copy **at submit time**, set it on the running thread, and restore it in the {{finally}}; if you do neither you both lose the traceId and pick up **contamination** from the previous request, and contamination is worse than loss because the data looks extremely trustworthy. Then talk about cost: levels chosen per environment, changing a level through Actuator with a TTL, markers instead of string concatenation, and PII blocked at 4 layers because you cannot delete data once it is already in the logs.

> Senior tip: Add {{version}} to every log line from day one. When a rollout breaks, the first question is always "which build is this error line from", and if the logs carry no {{version}} you have to deduce it from the timestamp plus the deploy calendar — 20 minutes for what was supposed to be a single field.`,
    exercises: [
      {
        title: "MdcExecutor: capture the context at submit, set it on the running thread, restore it in finally",
        prompt: `{{LogContext}} is already written in the starter (it is a minimal version of MDC: a map attached to the current thread) — **do not modify it**, it is there only so you can understand the behaviour. Your job is to implement the methods of {{MdcExecutor}} according to this contract:

- {{MdcExecutor(ExecutorService delegate)}}: throw {{IllegalArgumentException}} when delegate is null.
- {{static Runnable wrap(Runnable task)}}: throw {{IllegalArgumentException}} when task is null. It must capture {{LogContext.snapshot()}} **at the moment wrap is called**, not when the task runs. The Runnable it returns, whichever thread it later runs on, must: (1) save that thread's current context, (2) set the context to the snapshot just captured, (3) run the task, (4) in the {{finally}}, restore the context saved in (1) with {{LogContext.restore(previous)}}.
- {{static <T> Callable<T> wrapCallable(Callable<T> task)}}: the same contract as above, keeping the return value intact and letting exceptions propagate (the Future will wrap them in ExecutionException).
- {{execute(Runnable)}}, {{submit(Runnable)}}, {{submit(Callable)}}, {{shutdown()}} simply delegate, after passing through {{wrap}}/{{wrapCallable}}.

Three places where this exercise grades you:
- The snapshot must be a **copy**. If the calling thread and the running thread share one map object, a task that calls {{put}} also mutates the caller's context, and two parallel tasks overwrite each other.
- Capture **at wrap/submit time**. Reading the context inside the task body means reading the context of the thread running the task: empty, or holding the previous request's traceId.
- Restore in the {{finally}}. Not cleaning up means the pool thread leaves a traceId behind and the next request's log lines carry a wrong traceId; cleaning with {{clear}} instead of restoring deletes the context of a thread that is nested inside another.

The {{tests}} run every task through {{Executors.newSingleThreadExecutor()}} and then call {{future.get()}}, so the order is absolutely deterministic, there is no sleep and there is no race.`,
        hints: [
          'In wrap(Runnable): place {{LogContext.snapshot()}} OUTSIDE the lambda, directly in the body of wrap, so it executes on the calling thread and is captured before the task is ever delayed.',
          'Inside the returned lambda: first save {{Map<String, String> previous = LogContext.snapshot()}}, then {{LogContext.restore(captured)}}, run the task inside try, and call {{LogContext.restore(previous)}} in finally.',
          'submit(Callable) must go through wrapCallable, not through wrap: wrap returns a Runnable, so the task return value would be lost.',
          'The "null inputs" case: throw IllegalArgumentException on null in the constructor, in wrap and in wrapCallable; then execute/submit pass on their own because they call wrap.',
          'If the case "a task that throws is still restored to its previous state" FAILs, you almost certainly put {{restore}} outside the {{finally}} or forgot the {{finally}} entirely.',
        ],
        explain: `The four lines — capture, set, run, restore — are the entire content of a {{TaskDecorator}}, of {{ContextSnapshot}} in Micrometer context-propagation, and of {{Context.current().wrap(runnable)}} in OpenTelemetry. Writing it once in plain code is how you understand why those libraries exist, and why they **do not** work when you forget a step.

The two points in time are where most people get it wrong:
- {{LogContext.snapshot()}} placed **outside** the lambda runs immediately when {{wrap}} is called, i.e. on the calling thread, so it picks up the correct context. Placed **inside** the lambda it runs on a pool thread, at which moment the context is either empty or the previous request's leftovers — that is precisely the "my logs have no traceId" bug you hit the first time you use {{@Async}}.
- {{previous}} has to be saved **before** you overwrite the context, and restored in the {{finally}}. Restoring (instead of {{clear}}) is the correct move, because the thread may be nested inside somebody else's work: for example an asynchronous appender running sub-tasks on the very pool thread that is handling the request. {{finally}} is the only place that guarantees no leftover traceId after the task throws; without it, log lines **belonging to another user** carry the traceId of the transaction that just died.

Mistakes commonly made while writing this:
- Passing the **map pointer** instead of a copy ({{LogContext.restore(LogContext.snapshot())}} written this way is harmless, but sharing the original map makes the calling thread and the running thread overwrite each other).
- Forgetting {{wrapCallable}}, or having {{submit(Callable)}} accidentally call {{wrap(task)}}: it still compiles happily, but {{Future.get()}} always returns null because a Runnable has no return value.
- Using {{Thread.currentThread().getId()}} to "guess" which thread you are on: don't; the tests here run sequentially, so the behaviour must come from the context, not from the thread name.
- Cleaning up with {{LogContext.clear()}} instead of {{restore(previous)}}: passes every test in this exercise but is a real bug once you nest an executor inside an executor.

In an interview, the strongest answer is not the code but the two categories of failure: **lost context** (logs missing the traceId) and **contaminated context** (logs carrying another request's traceId). The second is scarier, because it raises no error signal at all — it produces data that looks completely believable and sends you investigating in the wrong direction until the shift is over.`,
      },
    ],
    check: [
      {
        options: [
          "Because stdout is faster than writing to a file",
          "Because a Pod is disposable — the file inside it is gone when the Pod is deleted — while node disk is shared and the app would fill it by itself; the runtime already stores stdout and there is an agent collecting it anyway",
          "Because Kubernetes does not allow mounting disks",
          "Because stdout automatically comes with a traceId",
        ],
        q: "Why should an app in a container write its logs to stdout instead of managing its own log files?",
        explain: "The chain is: the app only prints to stdout, the container runtime writes it to a file on the node with rotation built in, and a DaemonSet agent reads on from there and enriches it with metadata.",
      },
      {
        options: [
          "It has no traceId",
          "It carries traceId=X, i.e. wrong data that looks completely believable",
          "The app throws because the MDC is empty",
          "Logback generates a fresh traceId for B by itself",
        ],
        q: "Request A ran on a pool thread and left traceId=X behind. Request B runs on that same thread but sets no traceId. What do B's logs look like?",
        explain: "This is the \"contaminated context\" failure: ThreadLocal lives with the thread, not with the request, and a pool reuses its threads. It is more dangerous than losing the traceId, because you end up trusting fake data.",
      },
      {
        options: [
          "When the task starts running in the pool thread",
          "At submit/wrap time, on the calling thread",
          "When the appender writes the log",
          "No capture is needed, just set traceId = null",
        ],
        q: "When must you capture the MDC context when handing a task to a thread pool?",
        explain: "Reading the context inside the task means reading the context of the thread running the task (empty, or the previous request's), so you must capture it on the calling thread, right at wrap/submit time.",
      },
      {
        options: [
          "Because DEBUG prints more text: it costs pipeline money, delays the logs exactly while you are investigating, fills the disk and doubles the risk of leaking PII",
          "Because DEBUG makes the JVM slower and can cause OOM",
          "Because Spring does not allow changing the level at runtime",
          "Because DEBUG drops the stack trace",
        ],
        q: "Why is leaving DEBUG on permanently in production a bad idea?",
        explain: "Log volume is a real cost and a real security risk. If you want DEBUG, turn on exactly one logger through Actuator and attach a TTL so it turns itself off.",
      },
    ],
  },
});
