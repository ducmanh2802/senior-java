/*
 * English translation of js/data/q-spring-data.js — task T181. Format: js/core/i18n.js (content overlay).
 * ids: spring-028 spring-029 spring-030 spring-031 spring-032 spring-033 jpa-022 jpa-023 jpa-024 jpa-025 jpa-026 jpa-027
 * T1223: re-translated entries updated in Vietnamese source (spring-028..033, jpa-022..027).
 */
App.i18n.content({
  'spring-028': {
    q: 'Why does calling a {{@Transactional}} method from another method in the same bean usually not open a transaction? How do you handle self-invocation, and how do JDK proxy and CGLIB differ?',
    a: `**Summary:** Spring transactions are usually applied through an AOP proxy (a wrapper object Spring generates at startup; AOP = Aspect-Oriented Programming, meaning extra behaviour is woven around your method without editing it). The caller calls the proxy, a transaction interceptor inside the proxy opens the transaction, and only then does the call reach your real object, the target. When a method inside the target calls {{this.otherMethod()}}, the call goes straight into the real object and bypasses the proxy, so the annotation on the invoked method is never seen by the interceptor. A JDK proxy only exposes interfaces, while CGLIB creates a subclass that overrides methods, but neither of them can repair self-invocation.

### Call flow (step by step)
For an external call the flow is Controller → proxy → transaction interceptor → service target. The interceptor reads the method metadata (propagation, isolation, timeout, readOnly), obtains the transaction manager (the component that talks to the DataSource and issues BEGIN, COMMIT or ROLLBACK), decides whether to join a running transaction or start a new one, runs your method, and finally commits or rolls back based on the exception that escapes. Inside the target, {{this.saveAudit()}} never goes back through the proxy, so the propagation, isolation or timeout configured on that method is not applied independently.

### JDK proxy and CGLIB
| | JDK dynamic proxy | CGLIB subclass |
|---|---|---|
| Proxy type | Implements the bean's interfaces | Subclass of the concrete class |
| Requirement | The bean has at least one interface | The class is not final, the method is not final/private |
| Call through the interface | Yes | Yes (the subclass also implements the interface) |
| Internal self-call | Bypasses the interceptor | Bypasses the interceptor |

Boot by default usually uses CGLIB for Spring AOP, but you should not rely on the proxy type to cure a self-call. Final classes/methods and private methods still cannot be overridden in order to be advised, so an annotation placed on them silently does nothing.

### Maintainable ways to fix it
Extract the part that needs its own transaction into a separate bean, so the call goes through a dependency's proxy. Or place the transaction on a public entry point that wraps the entire use case. Self-injection or {{AopContext.currentProxy()}} can make the proxy get invoked again, but it creates coupling and makes the flow hard to read; only use it when the class boundary really cannot be changed.

### Production pitfalls
Tests that call the method directly on an object created with {{new}} have no transaction proxy, so they never prove the annotation works. Likewise, invoking an annotated method through a private method or from the constructor does not trigger the advice. Verify with integration tests that use a real transaction manager and observe commit/rollback, not merely by asserting that the annotation exists.

### Real-world example
Self-invocation affects more than {{@Transactional}}. A catalog service has {{getProduct(id)}} annotated {{@Cacheable("products")}} and a method {{getProducts(ids)}} that calls {{this.getProduct(id)}} in a loop → the cache is **never** used on that path; every 50-product listing page issues 50 queries, DB CPU hits 70% at peak even though the cache dashboard reports 95% hit rate (it only counts direct calls from the controller). Similarly, an internal {{@Async}} call runs **synchronously** on the request thread. Fix: extract {{ProductCacheFacade}} as a separate bean that holds the {{@Cacheable}} method and call it through that bean; add an integration test that counts queries to prove the cache takes effect. Peak DB CPU dropped to 30%.

### Sample interview answer
Spring applies transactions, caching and async through a proxy that wraps the bean. When a controller calls the service, the call goes through the proxy so the advice runs; but when a method inside the service calls another method of itself via this, the call goes straight to the real object and never crosses the proxy, so annotations such as Transactional, Cacheable or Async on the invoked method are ignored. This is true for both JDK proxies and CGLIB, because both only intercept calls entering from the outside. The most maintainable fix is to extract the part that needs the advice into a separate bean; you can also self-inject the bean through its proxy or use TransactionTemplate, but those are harder to read. I always keep an integration test that proves the annotation actually works, for example by counting queries or verifying a rollback.

> Senior tip: treat the transaction boundary as the public use-case boundary. A short service method, invoked through the bean's proxy, is usually safer than sprinkling annotations over internal helpers.`,
    follow: [
      'Why does {{@Transactional}} on a private method have no effect when a proxy is used?',
      'If extracting a separate bean does not fit, how do you verify the actual proxy of the bean?'
    ]
  },
  'spring-029': {
    q: 'A service uses {{Propagation.REQUIRES_NEW}} to write an audit record while the outer transaction updates an order. Why can the connection pool run dry, and how do you quantify the risk?',
    a: `**Summary:** {{REQUIRES_NEW}} suspends the current transaction and runs an independent transaction. If the outer transaction is holding a connection (a connection is a single open line to the database), the new transaction needs a different connection; with many concurrent requests, almost the whole pool can be held by outer transactions while everyone waits for a second connection, causing pool starvation (no connection left to borrow) or timeouts.

### Connections and transactions
With {{REQUIRED}} (the default propagation), a method in the same thread usually joins the running transaction, so no second connection is needed. With {{REQUIRES_NEW}}, Spring keeps the outer transaction's resource suspended, binds a new resource for the inner transaction, and restores the outer resource when the inner transaction ends. The independent transaction can commit the audit even if the outer one rolls back, but the price is concurrent connections and decoupled semantics.

Suppose the pool has 20 connections and 20 requests have each taken one connection for their outer transaction. If every request then calls {{REQUIRES_NEW}}, no connection is left for the inner transaction; all requests wait, and none can release its outer connection until the inner one completes. This is a resource deadlock at the application level even though the database shows no deadlock lock graph.

### Assessment and choices
- Estimate the maximum number of concurrent requests times the number of connections held in the outer scope; also consider flows that nest several {{REQUIRES_NEW}} levels.
- Keep transactions short; do not call slow services or perform network calls while holding a connection.
- If the audit must commit together with the business data, use the same transaction; if eventual consistency is acceptable, consider an outbox (a table where you write the event row inside the same business transaction, then a worker forwards it) written in the outer transaction.
- If an independent transaction is genuinely needed, set a timeout, monitor the pool's active/idle/pending metrics and load test with a limited pool size.

### Production pitfalls
Growing the pool without limit only moves the congestion to the database, where session count, memory and lock contention are also finite. A suspended outer transaction still holds its connection; suspension does not mean the connection has been returned to the pool. Also remember the inner commit does not roll back with the outer transaction, so the audit can record an action whose order was ultimately never committed.

### Quantifying the risk with numbers
Each request that uses REQUIRES_NEW needs **2 connections at the same time** (one suspended for the outer transaction, one for the new transaction). If the pool has P connections and T threads run concurrently and every thread can enter the REQUIRES_NEW branch, the condition where the pool **can deadlock** is T ≥ P: all P connections are held by outer transactions and no thread can obtain a second connection, so every thread waits until timeout. A rule of thumb (HikariCP wiki): minimum pool ≈ T × (connections each thread needs at once − 1) + 1. With T = 40 busy Tomcat threads each needing 2 connections, pool ≥ 41, while the database only allows 30 connections per pod — impossible, so the design must change.

### Real-world example
An order system wrote audit via REQUIRES_NEW with pool 20 and Tomcat 200 threads. Normally only ~10 concurrent requests ran fine; on a promotion day it reached 60 concurrent requests → 20 outer transactions held all 20 connections and each waited for a second → the service stalled for 30 seconds (Hikari timeout) then failed in waves, repeating in bursts. Fix: write the audit into an **outbox table in the same transaction** (the audit is only needed when the business succeeds), and for failure cases write the audit with {{@TransactionalEventListener(phase = AFTER_ROLLBACK)}} running after the connection is returned. At the same time, limit concurrency entering the order flow. No more system stalls.

### Sample interview answer
REQUIRES_NEW suspends the outer transaction but the outer transaction still holds its connection, and the new transaction needs another connection, so each request on that path needs two connections at once. When the number of concurrent threads reaches or exceeds the pool size, every connection can be held by outer transactions and nobody can get a second one, stalling the service until timeouts. I quantify it with the minimum-pool formula: threads times connections each thread needs minus one, plus one, then compare that to the database connection limit. Usually that shows the design should change: write the audit to an outbox in the same transaction, or use after-commit/after-rollback events, and limit concurrency at the entry instead of only growing the pool.

> Senior tip: use pending borrowers, acquisition latency and transaction duration metrics to catch this before the timeouts fire. If your pool is size N and every request can nest one level, exercise the concurrency scenario close to N; headroom must be designed and load tested, not guessed from average traffic.`,
    follow: [
      'When should the audit commit in the same transaction as the business data?',
      'How does the outbox pattern solve writing an event after the commit?'
    ]
  },
  'spring-030': {
    q: 'Where does Spring Boot 3 find auto-configuration, and how do you trace a bean that unexpectedly appears or fails to appear?',
    a: `**Summary:** Spring Boot 3 discovers auto-configuration (configuration that Boot applies automatically based on what it finds on the classpath) through the {{META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports}} metadata in the jars on the classpath. The imported classes still pass through conditions such as {{@ConditionalOnClass}}, {{@ConditionalOnMissingBean}} or {{@ConditionalOnProperty}}; therefore dependencies, properties and beans defined by the application together decide the outcome.

### Mechanism
{{@SpringBootApplication}} combines component scanning, auto-configuration enablement and configuration. Auto-configuration is not magic scanning of every class: the candidate list is imported, then the conditions are evaluated against the environment while the context is created. For example, datasource configuration only matches when the required JDBC classes exist, the properties validate, and the application has not provided its own replacement beans. The {{before}}/{{after}} ordering relationships let configurations cooperate.

### Systematic debugging
1. Confirm the dependency is actually on the runtime classpath, not only in compile scope.
2. Run the application with {{--debug}} to see the condition evaluation report: matched and negative matches with reasons.
3. Check the properties, active profiles, classpath, and beans of the same type defined manually.
4. If you write an internal starter, declare classes in {{AutoConfiguration.imports}}, use narrow conditions and provide {{@ConditionalOnMissingBean}} so overriding is possible.

Do not use component scanning to register auto-configuration from a library like an ordinary component. Boot 3 moved away from {{spring.factories}} for the auto-configuration list; the imports file is the mechanism to check when migrating an old starter.

### Production pitfalls
{{@ConditionalOnProperty}} by default requires the property to exist and not hold the value false; configuring {{matchIfMissing}} changes that default. Conditions based on classes can differ between test and production because transitively included dependencies differ. Excluding one auto-configuration to fix a symptom can remove a whole group of related beans.

### Under the hood: how auto-configuration conditions are evaluated
Spring Boot 3 reads the list of auto-configuration classes from {{META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports}} in every jar. Each class carries conditions: {{@ConditionalOnClass}} (is the class present on the classpath?), {{@ConditionalOnMissingBean}} (have you already declared a bean of that type yourself — if so, Boot **backs off**), {{@ConditionalOnProperty}}, {{@ConditionalOnWebApplication}}, and so on. Classes are ordered by {{@AutoConfiguration(before/after)}}. Tools to inspect the result: run with {{--debug}} (or {{debug=true}}) to print the **Condition Evaluation Report** — "Positive matches" and "Negative matches" with reasons; Actuator {{/actuator/conditions}} and {{/actuator/beans}} show the same information at runtime.

### Real-world example
After adding an internal library, a service suddenly serialized dates in the {{ObjectMapper}} as numeric timestamps instead of ISO strings — the mobile app displayed wrong dates. {{/actuator/beans}} showed an {{ObjectMapper}} bean coming from a configuration class in the new library; the Condition Evaluation Report recorded {{JacksonAutoConfiguration... Did not match: @ConditionalOnMissingBean found bean 'objectMapper'}}, meaning Boot backed off and every {{spring.jackson.*}} setting in application.yml **no longer took effect**. Fix: the internal library switched to providing a {{Jackson2ObjectMapperBuilderCustomizer}} (adding customisation on top of Boot's configuration) instead of creating its own ObjectMapper.

### Sample interview answer
Spring Boot 3 finds the auto-configuration list in each jar's AutoConfiguration.imports file, replacing spring.factories from Boot 2. Every auto-configuration class has conditions: ConditionalOnClass, ConditionalOnProperty, and most importantly ConditionalOnMissingBean, which means if I have already declared a bean of that type, Boot backs off. When a bean unexpectedly appears or disappears, I run with debug to read the Condition Evaluation Report, which lists which conditions matched, which did not and why, or I inspect actuator conditions and beans at runtime. A common mistake is a library declaring its own ObjectMapper or DataSource so Boot's configuration is silently disabled; the right approach is to use the customizers Boot provides instead of replacing the whole bean.

> Senior tip: when a bean is missing, look for the first negative match in the report instead of adding yet another {{@Bean}}. For shared starters, write context tests for both the dependency-present and dependency-absent cases plus an application-bean override, so the auto-configuration contract is explicitly verified.`,
    follow: [
      'Why should a Boot 3 starter not register auto-configuration via component scan?',
      'How do you design conditions so the application can override the default bean?'
    ]
  },
  'spring-031': {
    q: 'How do you design observability for a request that crosses multiple services, so logs, metrics and distributed traces are correlated using Micrometer Tracing?',
    a: `**Summary:** Use Micrometer Observation as the instrumentation abstraction (a common API to record "something happened"), Micrometer Tracing to create and propagate the trace/span context (a trace is the journey of one request across services; a span is one timed step inside it), plus a suitable registry/exporter to send data to the backend. Traces answer where a request went and which span was slow; metrics show overall trends, while logs carry event detail and should contain the trace ID for correlated lookup.

### Trace context
An inbound request creates or resumes a trace, and every outbound call creates a child span. HTTP instrumentation propagates context via standard headers such as W3C Trace Context ({{traceparent}} carries the traceId to the next service); message consumers need the context propagated through their own message metadata. If one service is not instrumented, or a proxy strips the headers, the trace breaks. Micrometer Tracing supports bridging to tracers such as OpenTelemetry or Brave depending on the dependency.

### Signal design
- **Metrics:** latency histograms, request/error counts, saturation; labels must have low cardinality (cardinality = how many distinct label values exist; too many, like one value per user, explodes memory and cost).
- **Traces:** instrument the important boundaries like HTTP, DB and messaging; sampling balances cost against investigative power.
- **Logs:** structured fields, trace/span IDs; never log tokens, PII or sensitive payloads.
- **Baggage:** only carry small, controlled metadata; do not use it as a place for large business data.

### Production pitfalls
Using userId, orderId or the full URL as a metric tag causes cardinality explosion and pushes memory/cost up. Low sampling can miss rare errors; tail-based sampling needs a compatible pipeline. Synchronous trace export or a full exporter queue can affect the app, so watch drops and exporter health. Manually instrumenting the same span repeatedly also makes traces noisy.

Measuring latency between services needs reasonably synchronized clocks, but the duration of a local span is more trustworthy than absolute timestamps. Do not treat traces as an audit log: sampling and retention mean traces do not guarantee every request is kept.

### Under the hood: how one request carries context across services
The Micrometer Observation API is the common layer: one {{Observation}} produces **both** a metric (timer) and a span (via Micrometer Tracing with an OpenTelemetry or Brave bridge). Spring Boot 3 auto-instruments the HTTP server, RestClient/WebClient/RestTemplate (when created from Spring's builder), and Kafka (when observation is enabled), with JDBC via an add-on library. The W3C {{traceparent}} header carries the traceId to the next service; traceId and spanId are placed into the **MDC** (Mapped Diagnostic Context, the per-thread key/value map your logger reads) so logs automatically include them. **Exemplars**: a histogram metric can attach the traceId of a sample request, so from a p99 graph in Grafana you can click straight into the trace of a slow request.

### Real-world example
A customer reported "checkout hangs for 10 seconds" with a timestamp. Before, the team had to grep logs across 5 services by time, taking ~45 minutes per incident. After standardising: every Spring Boot 3 service used Micrometer Tracing + OTLP export to Tempo, JSON logs carried traceId, error responses returned the traceId to the client, and Prometheus enabled exemplars. Next time, support sent the traceId from the error screen; the trace showed 9.2 seconds in the span calling the fraud service (3 retries with a 3-second timeout). Investigation time dropped to ~5 minutes; the team reduced the timeout and added a circuit breaker.

### Sample interview answer
I design it so the three signals are connected by traceId. In Spring Boot 3, Micrometer Observation produces both a metric and a span for each instrumented operation; I use Micrometer Tracing with an OpenTelemetry bridge, exporting over OTLP to Tempo or Jaeger. Context travels across services in the traceparent header, so HTTP clients must be created from Spring's builder, Kafka observation must be enabled, and async executors must wrap context propagation. traceId goes into the MDC so JSON logs carry it automatically, and I return the traceId in error responses so support can send it back. Metrics use histograms with exemplars so I can jump from a p99 chart to the trace of a slow request. I balance sampling against cost while keeping enough error and slow traces.

> Senior tip: start with RED metrics (rate, errors, duration), then trace the paths with real investigative value. Track ingest cost and cardinality as well; a beautiful dashboard with unbounded tags turns observability into an operational incident.`,
    follow: [
      'When do you choose head sampling versus tail sampling?',
      'Why should orderId not be used as a metric label?'
    ]
  },
  'spring-032': {
    q: 'A Spring Boot 3 application running blocking workloads wants to enable virtual threads via {{spring.threads.virtual.enabled}}. How do you assess the benefits, the limits and a rollout plan?',
    a: `**Summary:** From Spring Boot 3.2, running on Java 21+, setting {{spring.threads.virtual.enabled=true}} asks Spring Boot to use virtual threads (lightweight threads managed by the JVM, cheap to create in large numbers) in the supported integrations (Tomcat/Jetty request handling, the {{@Async}}/task executor, the scheduler, some messaging listeners). Virtual threads lower the thread cost of many concurrent blocking tasks, but they do not make the CPU faster, do not raise connection limits, and do not turn blocking code into non-blocking; you must verify the Boot version, pinning and downstream resources.

### The model
A platform thread is tied to an OS thread, so a large number of threads waiting on I/O consumes stack and scheduling resources. A virtual thread is mounted by the runtime onto a carrier thread (a platform thread borrowed for execution) while it runs, and usually unmounts during compatible blocking operations so the carrier can run something else. When it completes, it returns results like an ordinary thread, which makes it easy to keep imperative code. It pays off when the number of concurrent tasks is large and most of the time is spent waiting for I/O.

### Limits and rollout
- CPU-bound work is still bounded by the number of cores; millions of virtual threads do not increase compute throughput.
- JDBC pools, remote API quotas, file descriptors and memory are still limits. Throttle with semaphores/bulkheads and appropriately sized pools.
- Pinning (the virtual thread gets stuck on its carrier and cannot unmount): on Java 21–23, a virtual thread that blocks inside {{synchronized}} or inside a native frame keeps its carrier thread stuck with it; detect it with the JFR event {{jdk.VirtualThreadPinned}} (JFR = Java Flight Recorder, the profiler built into the JDK). JEP 491 (Java 24) removed pinning caused by {{synchronized}}, but native frames still pin.
- Verify the Boot version and which components use the virtual-thread executor; do not assume every scheduler or third-party library switches over by itself.
- Benchmark latency, throughput, heap, carrier utilization and downstream saturation before/after under representative load.

### Production pitfalls
Tuning thread count while ignoring the connection pool can create tens of thousands of tasks all waiting to grab a connection and push tail latency up. Thread-local caches can multiply memory per virtual thread if you spawn too many tasks. Do not use long synchronized blocks around I/O without evaluating the specific runtime/JDK.

### Real-world example
A profile lookup service (Spring MVC, JDBC, calling 3 internal APIs) ran Tomcat with 200 threads; at peak 400 concurrent requests the Tomcat queue grew long and p99 reached 2.3 seconds despite 35% CPU. Step-by-step rollout:
1. Upgraded to Java 21, ran {{-Djdk.tracePinnedThreads=full}} on staging with load tests → found pinning in an old client library using {{synchronized}} around I/O and in a hand-written cache using {{synchronized}} (replaced with {{ReentrantLock}}).
2. Checked downstream limits: Hikari pool 30 — with virtual threads, 400 concurrent requests would all contend for 30 connections; set a reasonable {{connectionTimeout}} and limited concurrency to external APIs with a semaphore.
3. Enabled {{spring.threads.virtual.enabled=true}} for 1 canary pod for 2 days and compared p99 and errors.
Result: p99 2.3s → 420ms with no increase in errors; the new bottleneck was the DB pool (as predicted), solved by optimising 2 heavy queries.

### Sample interview answer
Enabling spring.threads.virtual.enabled on Java 21 and Spring Boot 3.2+ makes Tomcat and Spring's executors run each request on a virtual thread, so when it waits on I/O the thread unmounts from its carrier and we can serve many concurrent requests while keeping blocking, imperative code. The benefit is largest for I/O-wait workloads like JDBC and HTTP; it does nothing for CPU-bound work. Limits: on Java 21, synchronized around I/O causes pinning, fixed from Java 24, and virtual threads do not add downstream capacity, so the DB pool and external API rate limits become the new bottlenecks and need concurrency limits. My rollout plan: detect pinning with JFR or tracePinnedThreads on staging, load test, review pools and heavy ThreadLocals, then enable on one canary pod and compare p99 and errors before rolling out everywhere.

> Senior tip: virtual threads scale the concurrency of blocking I/O; they are not a general speed-up button. Roll out behind a canary, keep concurrency limits at the dependency boundaries, and compare p95/p99 together with pool wait time, not just a lower CPU graph.`,
    follow: [
      'How do virtual threads differ from reactive programming?',
      'How do you detect a virtual thread being pinned in a real environment?'
    ]
  },
  'spring-033': {
    q: 'When deploying a new version, how do you design graceful shutdown for Spring Boot so in-flight requests are not lost while still meeting the orchestrator\'s deadline?',
    a: `**Summary:** Graceful shutdown stops accepting new requests, gives in-flight requests (requests already being processed) a window to complete, then closes resources in order. Spring Boot supports graceful shutdown for the embedded web server; you must coordinate readiness/load balancer behaviour, platform timeouts and stopping consumers/jobs to bound the total exit time.

### Sequence
When the shutdown signal arrives, the instance must quickly leave the traffic-serving endpoint (readiness false), the load balancer needs time to update, and then the server stops accepting new connections/requests gracefully. Running requests are drained within the configured window. The bean lifecycle stops workers and releases resources; finally the process exits before the orchestrator sends SIGKILL (the force-kill signal that cannot be handled).

### Design
- Web server graceful shutdown: {{server.shutdown=graceful}} (from Boot 3.4 this is the default; older versions default to {{immediate}}). The wait time per phase is {{spring.lifecycle.timeout-per-shutdown-phase}} (default 30s); set it from the real p99 of request duration.
- On Kubernetes, removing the pod from the Endpoints list happens in parallel with SIGTERM, so you usually add a {{preStop}} sleep of a few seconds so the load balancer stops sending traffic before the server stops accepting requests.
- The orchestrator's total grace period must exceed readiness propagation + drain window + consumer stop/cleanup, with buffer.
- For queue consumers, pause message intake, finish or nack so the broker redelivers; make the handling idempotent (safe to run twice without double effect) to avoid duplicates.
- Stop scheduled jobs and executors with a timeout; avoid cleanup that calls external services without bounds.
- Track termination reason, cut-off requests, drain time and the number of in-flight messages.

### Production pitfalls
If readiness flips only after the process has begun shutting down, the load balancer may keep sending traffic for a short while. A timeout that is too short kills requests; too long hangs the rollout or blows the deployment budget. Web server draining does not by itself handle transactions running on background executors or message listeners. Shutdown hooks are not guaranteed to run when the process is SIGKILLed or the host loses power.

### Under the hood: the sequence when Kubernetes stops a pod
1. The pod is marked Terminating; **in parallel**: kubelet sends SIGTERM to the container **and** the endpoint controller removes the pod from the Service/Endpoints — removal propagates to every node (kube-proxy, ingress) over a few seconds.
2. If the app stops accepting requests immediately on SIGTERM, requests still being routed to the pod during those seconds fail with "connection refused". So add a **{{preStop}} sleep of 5–10 seconds** to wait for endpoint removal to propagate.
3. Spring Boot with {{server.shutdown=graceful}}: stops accepting new requests, waits for in-flight requests to finish within {{spring.lifecycle.timeout-per-shutdown-phase}} (default 30 seconds), then closes the context (stops Kafka consumers, schedulers, closes pools).
4. The total time (preStop + shutdown) must be less than {{terminationGracePeriodSeconds}} (default 30 seconds), otherwise the pod is SIGKILLed.

### Real-world example
On every rolling update of a 12-pod payment service, ~0.8% of requests failed with 502 for 1–2 minutes. {{server.shutdown=graceful}} was already on but there was no preStop: the ingress kept sending requests to pods that had stopped accepting. Added {{preStop: sleep 10}}, {{terminationGracePeriodSeconds: 60}}, shutdown timeout 40 seconds, and a readiness probe on {{/actuator/health/readiness}} (Spring switches it to REFUSING_TRAFFIC when shutdown begins). Kafka consumers were stopped early and offsets committed before closing. Deploy-time errors dropped to 0 across 20 consecutive deploys.

### Sample interview answer
When Kubernetes stops a pod it sends SIGTERM and removes the pod from endpoints at the same time, but the removal takes a few seconds to propagate to ingress and kube-proxy, so during that window the pod can still receive new requests. I add a preStop sleep of about ten seconds to wait for propagation. Spring Boot with server.shutdown set to graceful stops accepting new requests, waits for in-flight requests to finish within timeout-per-shutdown-phase, then closes the context in order, including stopping consumers and committing offsets, stopping schedulers and closing pools. The readiness probe uses Actuator's readiness group so it reports not-ready when shutdown starts. Crucially, preStop plus shutdown time must be less than terminationGracePeriodSeconds or the pod is killed hard. I verify by running continuous load during a rolling update.

> Senior tip: base the grace period on the p99 request duration and the real deregistration time, then rehearse a rolling deploy under load. Graceful shutdown reduces disruption, but safe retries and idempotency remain the final protection layer for clients.`,
    follow: [
      'What ordering is needed for Kubernetes readiness and Spring graceful shutdown to coordinate?',
      'If a consumer is processing a message when shutdown starts, how do you guarantee no message loss?'
    ]
  },
  'jpa-022': {
    q: "How does Hibernate's persistence context track entities, when does dirty checking happen, and what does the flush order mean for a transaction that both inserts and updates?",
    a: `**Summary:** The persistence context (the in-memory workspace Hibernate uses inside a transaction/session) is an identity map (one in-memory object per row, so you never hold two copies of the same entity) and the unit that tracks managed entities. Hibernate keeps the loaded state as a snapshot (a copy of the column values as read from the DB); dirty checking compares entities at flush time to generate SQL; flushing synchronises changes down to the DB but is not the same as commit. Hibernate uses a defined action order, not necessarily the order of your Java statements.

### Lifecycle and dirty checking
A transient entity is a plain new object Hibernate does not know about yet; after {{persist}} it becomes managed. When an entity is loaded, Hibernate stores a snapshot plus an entry in the persistence context. Changing a Java field does not immediately emit SQL; at flush (usually before a query that needs synchronisation, or before commit) Hibernate detects the difference, creates the update and binds the values. A detached entity (persistence context closed, or {{detach}} called) is no longer tracked automatically.

A context holds exactly one instance per entity type and primary key: loading the same key twice returns the same managed object. This guarantees consistent identity within the transaction, but a large context keeps many objects and snapshots in memory.

### Flush order
Hibernate executes its action queue in groups (for example inserts, then updates, collection actions, then deletes) rather than preserving the order of the source code. The classic example: in the same transaction you {{remove}} a row whose {{code = 'VIP'}} and then {{persist}} a new row with the same {{code = 'VIP'}} (a unique column). At flush the INSERT runs before the DELETE, so the DB reports a unique constraint violation even though the Java code "deletes first, inserts later". The fix is to call {{flush()}} right after {{remove}}, or to update the old row instead of deleting and re-creating it. Database constraints remain the source of truth. If ordering dependencies exist, design the FK/associations correctly, flush deliberately, or split the transaction along business lines; do not rely on the order of repository calls.

### Production pitfalls
A bulk JPQL update/delete runs directly in the DB and bypasses dirty checking of entities already in the context, so managed objects can become stale; use clear/refresh appropriately after a bulk operation. Flush does not make data durable: a rollback still undoes the SQL. Changing large collections can create many snapshots/SQL statements and grow the heap.

### Real-world example
A transaction **deleted** an old config row and then **inserted** a new one with the same unique key ({{tenant_id, key}}). Code: {{repo.delete(old); repo.save(newOne);}} → {{duplicate key value violates unique constraint}}. Cause: Hibernate flushes by a fixed **action-type order** — INSERT first, then UPDATE, then collection element removals, then DELETE — not by the order you called. So the INSERT of the new row ran while the old row still existed. Fix: call {{flush()}} immediately after {{delete}} (forcing the DELETE to run first), or better **update** the existing row instead of deleting and inserting. A similar bug: {{@Transactional(readOnly = true)}} on a read service that then called a setter to "normalise display" — with readOnly, Spring sets Hibernate flush mode to MANUAL so nothing is written; but when someone removed readOnly, that "display-only" change was written to the DB.

### Sample interview answer
The persistence context keeps each managed entity together with a snapshot of its values at load time. Dirty checking happens at flush: Hibernate compares each entity to its snapshot and generates UPDATEs for what changed; flush happens before commit, before a query that could be affected when flush mode is AUTO, or when flush is called explicitly. Flush order is easy to miss: Hibernate executes by action type, INSERTs before UPDATEs before DELETEs, not by the order I called in code. The classic result is deleting then inserting a row with the same unique key in one transaction causing a duplicate key error, because the INSERT runs before the DELETE. I handle it by flushing after the delete, or better by updating the existing row instead of delete-then-insert.

> Senior tip: for large batches, flush and clear per chunk to bound the persistence context; inspect the SQL actually emitted and the transaction log instead of inferring from the number of {{save}} calls.`,
    follow: [
      'When does query auto-flush happen, and what surprises can it cause?',
      'How does a bulk update affect entities that are already managed?'
    ]
  },
  'jpa-023': {
    q: 'You hit {{LazyInitializationException}} after returning an entity from the service. How does Open Session in View fix the symptom, and why should you usually replace it with an explicit fetch plan?',
    a: `**Summary:** A lazy association (a related object Hibernate loads only when you first access it, not when it loads the main entity) can only be loaded while the persistence context is still open. If the service ends the transaction and the entity becomes detached before the serializer reads the association, Hibernate cannot run another query and throws {{LazyInitializationException}}. Open Session in View (OSIV, keeping the persistence context open for the whole HTTP request) keeps lazy access working, but it easily runs SQL outside the service and hides invisible N+1 (one query for the list plus one query per row).

### Cause along the flow
The repository loads the entity with lazy associations not initialised. The service transaction commits, the persistence context closes or the entity detaches. The controller/Jackson serialises the relations; the proxy needs the session to query, but the session is gone. This is not a random mapping bug but a fetch plan that does not match where the data is consumed.

### Step-by-step for beginners
- The persistence context (Session/EntityManager) is the temporary in-memory area that holds managed entities during a transaction. A lazy association is represented by a proxy; the proxy only runs a real DB query when you call a getter and the context is still open.
- When the transaction ends, the entity becomes detached. The proxy loses access to the session; calling a getter throws {{LazyInitializationException}}.
- OSIV (in Spring Boot the {{OpenEntityManagerInViewInterceptor}}, a web request interceptor; apps not using Boot may use an equivalent filter) opens the EntityManager from the start of the request until the response is finished, so the proxy can still query while rendering JSON. It fixes the symptom but not the fetch plan.

### Options
- Use DTO projections (small classes or records holding only the fields the API needs) for API responses: fetch only the needed columns and stop letting serialisation decide the SQL.
- Use a fetch join or {{@EntityGraph}} for the specific use case, and check the query count and pagination.
- Initialise the association inside the transaction if the logic genuinely needs it ({{Hibernate.initialize}}).
- Open Session in View can be useful in a simple server-rendered application, but you must understand the queries it generates at view time and control them with metrics/logs.

### Real-world example
Endpoint /orders/{id} returned an Order with items. At first the service loaded Order and the controller serialised it; items were lazy → LIE. Turning OSIV on removed the error but each request serialising 50 order items produced 51 queries and p99 latency 480ms. Switching to a DTO projection with JOIN FETCH items: 1 query, p99 35ms. Under 200 concurrent orders the connection pool went from 80% to 12% usage.

### Production pitfalls
Spring Boot **enables OSIV by default** ({{spring.jpa.open-in-view=true}}) and prints a warning at startup; for a REST API you should set {{false}} so fetch-plan mistakes surface early. Enabling OSIV does not keep the business transaction open; it only keeps the persistence context open, so lazy queries can run after the commit with a different transaction/autocommit depending on configuration. Serialising a list of 100 entities and then reading each collection can produce 101 queries. Returning entities also leaks internal structure and risks recursion on bidirectional associations.

### Sample interview answer
I hit LIE when the service returned a detached entity and the serialiser accessed a lazy association. The root cause is a fetch plan that does not match where the data is consumed. OSIV keeps the session open for the whole request so the proxy can still query, but that is patching the symptom: SQL runs in the view layer, N+1 is hidden, and the transaction no longer covers it. For a REST API I turn OSIV off, return DTO projections with an explicit fetch plan, and enable SQL statistics in tests to catch N+1. The exception disappearing does not prove the endpoint is efficient; I measure query count and latency.

> Senior tip: service APIs should return DTOs with a reviewed fetch plan. Enable SQL statistics or a datasource proxy in tests to catch N+1; the exception going away does not prove the endpoint is efficient.`,
    follow: [
      'Does OSIV keep the DB transaction open for the entire HTTP request?',
      'How do you detect N+1 arising during JSON serialization?'
    ]
  },
  'jpa-024': {
    q: 'Two requests concurrently modify an entity with {{@Version}}. How does optimistic locking work, and where should the retry live so it never overwrites newer data?',
    a: `**Summary:** Hibernate uses the version column in the update statement: the update only succeeds if the DB version still equals the version of the entity that was read. If another request committed first, the row count is 0 and Hibernate reports an optimistic lock conflict. A retry must rerun the whole use case in a new transaction, re-read the fresh data and make the business decision again; it must not merely resend the old update.

### Mechanism by example
Two transactions read a balance with version 7. T1 updates with the condition {{where id=? and version=7}}, bumps the version to 8 and commits. T2 also updates version 7; the condition does not match (the update returns 0 rows), so Hibernate throws {{StaleObjectStateException}}/JPA {{OptimisticLockException}} and Spring translates it into {{ObjectOptimisticLockingFailureException}} instead of silently overwriting. The version can be an integer or a timestamp; a numeric version usually expresses ordering more clearly.

### Step-by-step for beginners
- Optimistic locking assumes conflicts are rare and does not lock the DB row on read. It adds a version condition to the UPDATE.
- When two transactions read the same version and then both write, the one that commits later fails because the DB version has changed.
- The error is thrown at flush/commit and the transaction is marked rollback-only; there is no partial write.

### Safe retries
- Retry only transient/conflict errors, with a bounded number of attempts and jittered backoff.
- Catch the exception outside the transaction boundary so the failed transaction has rolled back; each attempt opens a new transaction.
- Re-read the state and check the business invariants before reapplying the command.
- For non-idempotent commands (deducting money, adding points), you need an idempotency key or a recorded command so the retry does not double the effect.

### Real-world example
Two cashiers edited the same order ORD-999 at version 12. Cashier A committed first → version 13. Cashier B flushed → OptimisticLockException. The system retried: re-read ORD-999 (version 13), applied B's change on the fresh state, committed. If it conflicted 3 times in a row, it returned 409 to the user. Measured: 0.3% of requests conflicted, 99.7% succeeded on the first retry.

### Production pitfalls
Retrying inside the same transaction, which is already marked rollback-only, usually cannot save the transaction. Blind retries can cause livelock when many clients contend for the same hot row; bound the attempts and return a conflict to the caller when you cannot reconcile automatically. Bulk updates/native SQL generally do not apply version semantics the way entity updates do.

### Sample interview answer
Optimistic locking adds the version column to the UPDATE with a condition matching the version that was read. The transaction that commits later fails with an OptimisticLockException instead of overwriting. The retry must live outside the transaction, open a new transaction, re-read the fresh state and reapply the logic; for non-idempotent operations I need an idempotency key. I cap the number of retries with backoff and return a conflict to the caller when it cannot be reconciled. Optimistic locking fits when conflicts are rare; a hot row with constant contention calls for measuring the conflict rate and considering a pessimistic lock or a conditional atomic update.

> Senior tip: use optimistic locking when conflicts are relatively rare; if a hot row is contended continuously, measure the conflict rate and consider serializing by key or a conditional atomic update instead of retrying forever.`,
    follow: [
      'Why does a retry need a new transaction?',
      'When is a pessimistic lock more reasonable than optimistic locking?'
    ]
  },
  'jpa-025': {
    q: 'A bulk insert with Hibernate does not reach the expected throughput. How do you configure batching, and why does the {{IDENTITY}} generation strategy usually break JDBC insert batching?',
    a: `**Summary:** Hibernate JDBC batching collects several prepared statements of the same shape and sends them as one batch (one network round trip instead of many; a round trip is one request-response to the database over the network); configuring {{hibernate.jdbc.batch_size}} and flushing/clearing per chunk reduces round trips and memory. With {{IDENTITY}}, the database has to create the row in order to return the generated key for each insert, so Hibernate usually must insert immediately to obtain the ID, and insert batching becomes limited or disabled.

### Configuration and writing data
Set a sensible batch size (commonly starting around a few dozen, then measure), turn on {{hibernate.order_inserts=true}}/{{hibernate.order_updates=true}} so statements for the same table are grouped, enable the driver's batch rewrite where available ({{reWriteBatchedInserts=true}} on PostgreSQL JDBC, {{rewriteBatchedStatements=true}} on MySQL Connector/J), and avoid SQL statement shapes that keep changing. The persistence context still holds entities, so process in chunks: persist N entities, flush, clear, then continue. Hibernate can sort inserts/updates by entity type to increase batch compatibility; verify via configuration and SQL logs on the real DB/driver.

### Step-by-step for beginners
- By default each persist + flush issues 1 INSERT and 1 network round trip to the DB. 100k rows = 100k round trips.
- Batching groups N statements of the same shape into one executeBatch, cutting round trips and parse overhead.
- order_inserts sorts entities by type so statements of the same shape sit next to each other, making them easier to batch.

### ID generation
Sequences allow obtaining the ID before the insert, so Hibernate can accumulate inserts; the sequence allocation/block size needs balancing between round trips and ID gaps. {{IDENTITY}} needs a DB-generated value after each row is inserted in order to assign it to the entity, which usually forces an early insert. Do not change the strategy just for batching: weigh portability, the schema and the semantics of the ID.

### Real-world example
Importing 100k users with batch_size=50, order_inserts=true and sequence allocationSize=50: 2000 batches, 4.2s instead of 48s (each insert round trip ~0.5ms). Heap stayed stable around ~120MB thanks to flush/clear every 1000. With IDENTITY: 100k round trips, 52s, heap growing.

### Production pitfalls
Batching reduces network round trips but not the number of index updates, WAL writes or constraint checks. Batches that are too large increase transaction duration, locks and the cost of a rollback. Mixed inserts for several entity types can fragment the batch. Batching may not work as expected if the code runs a query midway (causing a flush) or the driver configuration does not support it.

### Sample interview answer
Hibernate batching groups statements of the same shape via JDBC executeBatch; I configure batch_size, order_inserts/updates and the driver's batch rewrite. IDENTITY breaks batching because the DB generates the ID after the insert, so Hibernate must insert immediately to get the key. I use a sequence with allocationSize or a pooled optimizer to allocate IDs up front, which allows batching. I process in chunks with flush and clear to bound the persistence context. I measure batch count, heap, transaction time and DB latency, and I always test on the exact driver/version — I do not trust an H2 benchmark.

> Senior tip: measure batch execution count, heap, transaction time and DB write latency; compare against plain inserts on the same data. Always test on the exact JDBC driver/version and confirm the generated IDs are correct, because an H2 benchmark does not represent the production database.`,
    follow: [
      'Why must you clear the persistence context when importing millions of rows?',
      'How does sequence allocation affect round trips and ID gaps?'
    ]
  },
  'jpa-026': {
    q: 'A screen needs a paginated list of entities with lazy relations. How do you choose between {{@EntityGraph}} and JOIN FETCH, and how do you handle the HHH000104 warning?',
    a: `**Summary:** {{@EntityGraph}} declares a fetch plan (which associations to load) per use case, while JOIN FETCH writes the join directly in JPQL; both can remove N+1, but a collection fetch join combined with pagination duplicates SQL rows. Hibernate may then fetch the entire result set and paginate in memory, emitting the HHH000104 warning (Hibernate 5; Hibernate 6 changed the code to HHH90003004 with "applying in memory"), trading a database-side limit for heavy in-memory loading.

### How to choose
EntityGraph fits when you want repository queries to stay readable and choose the associations to fetch per method. Spring Data uses {{EntityGraphType.FETCH}} by default (an attribute not listed in the graph is treated as LAZY); {{LOAD}} keeps the fetch type declared in the mapping for attributes not listed. JOIN FETCH is useful when the query needs conditions/sorting tied to the association, but fetching two {{List}} collections (bags) at the same time hits {{MultipleBagFetchException}}, and even with {{Set}} it still creates a cartesian product with a huge number of rows.

### Step-by-step for beginners
- A fetch plan decides which associations are loaded together with the root query, avoiding N+1.
- A collection fetch join multiplies SQL rows by the number of children; the DB returns many rows for the same root.
- Hibernate paginates over SQL rows; if rows are multiplied, the page size no longer corresponds to the number of root entities.

### Safe pagination
1. Page over the root entity id with a bounded query and a stable ordering.
2. Run a second query that fetches the needed associations for that id set, using IN.
3. Restore the page order if the second query does not preserve it, and consider a separate count query.

You can set {{hibernate.query.fail_on_pagination_over_collection_fetch=true}} so Hibernate throws instead of silently paginating in memory. For to-many relations, batch fetching or DTO projection are also options depending on the response shape.

### Real-world example
An order list screen showed 20 root orders, each with 15 items. JOIN FETCH items produced 300 SQL rows and Hibernate warned HHH000104, loading everything into memory to page. Switching to two-query pagination: an ID query returning 20 rows, then an items query with WHERE order_id IN (...) → 2 queries, p99 40ms, heap stable.

### Production pitfalls
A page of 20 roots can turn into thousands of SQL rows if each root has many children; paginating rows is not the same as paginating roots. The warning is easy to ignore in a small test data set, but production heap/latency can jump suddenly. Sorting by a child column also needs a clear definition: when one root has multiple values, how is the order determined?

### Sample interview answer
EntityGraph declares the fetch plan per use case and keeps repository queries readable; JOIN FETCH puts the join directly in JPQL and is useful when I need conditions or sorting tied to the association. Both reduce N+1, but a collection fetch join multiplies SQL rows and pagination can trigger HHH000104, where Hibernate loads the whole result into memory. I use two-query pagination: page the root IDs first, then fetch associations for that ID set with IN, restoring order and using a separate count query. I enable fail_on_pagination_over_collection_fetch so it fails fast instead of silently paginating in memory.

> Senior tip: test with production-like volume and fan-out, and assert both the query count and that the SQL containing LIMIT/OFFSET actually reaches the DB. When you see HHH000104, fix the fetch plan before raising the heap or silencing the warning.`,
    follow: [
      'Why can fetch-joining one collection still make a page wrong?',
      'How do you design the count query for a page over data with to-many relations?'
    ]
  },
  'jpa-027': {
    q: "Hibernate's second-level cache can relieve database load, but when do you decide not to enable it, or to cache only some entities?",
    a: `**Summary:** The second-level cache (an optional cache shared across Sessions, outside the per-transaction persistence context) shares entity/collection caching across Sessions. It fits read-heavy, rarely changing data with a consistent invalidation strategy (a clear rule for who removes stale cached data and when); it should not be enabled broadly for mutable/hot data or for strict consistency requirements, where the cost of synchronisation and stale reads exceeds the benefit.

### Telling the caches apart
The first-level cache is the persistence context of a single Session and is always tied to the identity map. The second-level cache belongs to the SessionFactory and has its own provider/configuration. The query cache stores query results (usually a list of ID references); it does not replace the entity cache, and Hibernate invalidates every cached result of a table whenever a write hits that table through Hibernate (tracked by a table timestamp), so on a frequently written table the query cache almost always misses. A cache hit still requires checking the mapping, version and provider semantics.

### When to consider it
- Small reference catalogs (countries, currencies, categories), read frequently and updated rarely.
- Freshness that can be accepted under a clear policy, or a provider that offers coherence suitable for the topology.
- A measurable cache hit ratio, evictions, heap/network cost and reduced DB load.

Avoid, or be very cautious with, balances, order statuses that change constantly, sensitive tenant data, entities with large payloads, or many nodes without reliable invalidation. A distributed cache adds a network hop and operational burden; per-node local caches may return different data.

### Real-world example
A Country table with 250 rows, read 50k times/minute, updated once a week. Enabling L2 cache READ_WRITE: DB load dropped 92%, p99 8ms → 2ms. In contrast, an Order status table updated constantly: query cache hit ratio 3%, serialisation overhead increased p99 by 15ms → cache turned off, kept only indexes.

### Production pitfalls
Bulk SQL or updates from another application can leave the cache stale if Hibernate does not know about the invalidation. A cache stampede when keys expire simultaneously creates a sudden spike in DB load. The entity cache does not make a query fast by itself if the query still scans the DB to find IDs. Do not add a cache to mask a missing index or an unfixed N+1.

### Sample interview answer
The second-level cache shares entity and collection data across Sessions and fits read-heavy, rarely changing data with clear invalidation. The first-level cache is the per-session persistence context. The query cache stores ID lists and depends on the entity cache; Hibernate invalidates it by table timestamp whenever a write hits that table through Hibernate, so on a frequently written table it almost always misses. I start with one reference entity that has a concrete freshness SLA, enable statistics, and measure hit ratio and evictions. If I cannot describe who invalidates, when staleness is acceptable and how the hit ratio is measured, I do not enable that cache yet.

> Senior tip: start with one catalog entity that has a specific freshness SLA, enable statistics, and rehearse invalidation when writing from every path. If you cannot describe who invalidates, when staleness is acceptable and how the hit ratio is measured, that cache should not be enabled yet.`,
    follow: [
      'How do bulk updates/native SQL affect the second-level cache?',
      'How do local caches and distributed caches differ when running multiple nodes?'
    ]
  },
});
