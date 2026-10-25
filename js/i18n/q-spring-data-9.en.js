/*
 * English translation of js/data/q-spring-data.js — task T181. Format: js/core/i18n.js (content overlay).
 * ids: spring-028 spring-029 spring-030 spring-031 spring-032 spring-033 jpa-022 jpa-023 jpa-024 jpa-025 jpa-026 jpa-027
 */
App.i18n.content({
  'spring-028': {
    q: 'Why does calling a {{@Transactional}} method from another method in the same bean usually not open a transaction? How do you handle self-invocation, and how do JDK proxy and CGLIB differ?',
    a: `**Summary:** Spring transactions are usually applied through an AOP proxy: the caller invokes the proxy, an interceptor opens the transaction and only then delegates into the target. When a method inside the target calls {{this.otherMethod()}}, the call goes straight into the real object and bypasses the proxy; the annotation on the invoked method is never processed by the interceptor. The JDK proxy only exposes interfaces, while CGLIB creates a subclass that overrides methods, but neither can fix self-invocation.

### Call flow
For an external call, the flow is Controller → proxy → transaction interceptor → service target. The interceptor reads the metadata, obtains the transaction manager, decides to join or create a transaction, then commits or rolls back based on the exception. Inside the target, {{this.saveAudit()}} never goes back through the proxy, so the propagation, isolation or timeout of that method is not applied independently.

### JDK proxy and CGLIB
| | JDK dynamic proxy | CGLIB subclass |
|---|---|---|
| Proxy type | Interface | Subclass of the concrete class |
| Requirement | Has an interface | Class not final, method not final/private |
| Call through interface | Yes | Possible |
| Internal self-call | Bypasses the interceptor | Bypasses the interceptor |

Boot by default usually uses CGLIB for Spring AOP, but you should not rely on the proxy type to cure a self-call. Final classes/methods and private methods still cannot be overridden in order to be advised.

### Maintainable ways to fix it
Extract the part that needs a transaction into a separate bean, so the call goes through a dependency's proxy. Or place the transaction on a public entry point that wraps the entire use case. Self-injection or {{AopContext.currentProxy()}} can make the proxy get invoked again, but it creates coupling and makes the flow hard to read; only use it when the class boundary cannot be changed.

### Production pitfalls
Tests that call the method directly on an object created with {{new}} have no transaction proxy. Likewise, invoking an annotated method through a private method or from the constructor does not trigger the advice. Verify with integration tests that use a real transaction manager and observe commit/rollback, not merely by asserting that the annotation exists.

> Senior tip: treat the transaction boundary as the public use-case boundary. A short service method, invoked through the bean's proxy, is usually safer than sprinkling annotations over internal helpers.`,
    follow: [
      'Why does {{@Transactional}} on a private method have no effect when a proxy is used?',
      'If extracting a separate bean does not fit, how do you verify the actual proxy of the bean?'
    ]
  },
  'spring-029': {
    q: 'A service uses {{Propagation.REQUIRES_NEW}} to write an audit record while the outer transaction updates an order. Why can the connection pool run dry, and how do you quantify the risk?',
    a: `**Summary:** {{REQUIRES_NEW}} suspends the current transaction and runs an independent transaction. If the outer transaction is holding a connection, the new transaction needs a different connection; with many concurrent requests, almost the whole pool can be held by outer transactions while everyone waits for a second connection, causing pool starvation or timeouts.

### Connections and transactions
With {{REQUIRED}}, a method in the same thread usually joins the running transaction, so no second connection is needed. With {{REQUIRES_NEW}}, Spring keeps the outer transaction's resource suspended, binds a new resource for the inner transaction, and restores the outer resource when the inner transaction ends. The independent transaction can commit the audit even if the outer one rolls back, but the price is concurrent connections and decoupled semantics.

Suppose the pool has 20 connections and 20 requests have each taken one connection for their outer transaction. If every request then calls {{REQUIRES_NEW}}, no connection is left for the inner transaction; all requests wait, and none can release its outer connection until the inner one completes. This is a resource deadlock at the application level even though the database shows no deadlock lock graph.

### Assessment and choices
- Estimate the maximum number of concurrent requests times the number of connections held in the outer scope; also consider flows that nest several {{REQUIRES_NEW}} levels.
- Keep transactions short; do not call slow services or perform network calls while holding a connection.
- If the audit must commit together with the business data, use the same transaction; if eventual consistency is acceptable, consider an outbox written in the outer transaction and forwarded by a worker.
- If an independent transaction is genuinely needed, set a timeout, monitor the pool's active/idle/pending metrics and load test with a limited pool size.

### Production pitfalls
Growing the pool without limit only moves the congestion to the database, where session count, memory and lock contention are also finite. A suspended outer transaction still holds its connection; suspension does not mean the connection has been returned to the pool. Also remember the inner commit does not roll back with the outer transaction, so the audit can record an action whose order was ultimately never committed.

> Senior tip: use pending borrowers, acquisition latency and transaction duration metrics to catch this before the timeouts fire. If your pool is size N and every request can nest one level, exercise the concurrency scenario close to N; headroom must be designed and load tested, not guessed from average traffic.`,
    follow: [
      'When should the audit commit in the same transaction as the business data?',
      'How does the outbox pattern solve writing an event after the commit?'
    ]
  },
  'spring-030': {
    q: 'Where does Spring Boot 3 find auto-configuration, and how do you trace a bean that unexpectedly appears or fails to appear?',
    a: `**Summary:** Spring Boot 3 discovers auto-configuration through the {{META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports}} metadata in the jars on the classpath. The imported classes still pass through conditions such as {{@ConditionalOnClass}}, {{@ConditionalOnMissingBean}} or {{@ConditionalOnProperty}}; therefore dependencies, properties and beans defined by the application together decide the outcome.

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

> Senior tip: when a bean is missing, look for the first negative match in the report instead of adding yet another {{@Bean}}. For shared starters, write context tests for both the dependency-present and dependency-absent cases plus an application-bean override, so the auto-configuration contract is explicitly verified.`,
    follow: [
      'Why should a Boot 3 starter not register auto-configuration via component scan?',
      'How do you design conditions so the application can override the default bean?'
    ]
  },
  'spring-031': {
    q: 'How do you design observability for a request that crosses multiple services, so logs, metrics and distributed traces are correlated using Micrometer Tracing?',
    a: `**Summary:** Use Micrometer Observation as the instrumentation abstraction, Micrometer Tracing to create and propagate the trace/span context, plus a suitable registry/exporter to send data to the backend. Traces answer where a request went and which span was slow; metrics show overall trends, while logs carry event detail and should contain the trace ID for correlated lookup.

### Trace context
An inbound request creates or resumes a trace, and every outbound call creates a child span. HTTP instrumentation propagates context via standard headers such as W3C Trace Context; message consumers need the context propagated through their own message metadata. If one service is not instrumented, or a proxy strips the headers, the trace breaks. Micrometer Tracing supports bridging to tracers such as OpenTelemetry or Brave depending on the dependency.

### Signal design
- **Metrics:** latency histograms, request/error counts, saturation; labels must have low cardinality.
- **Traces:** instrument the important boundaries like HTTP, DB and messaging; sampling balances cost against investigative power.
- **Logs:** structured fields, trace/span IDs; never log tokens, PII or sensitive payloads.
- **Baggage:** only carry small, controlled metadata; do not use it as a place for large business data.

### Production pitfalls
Using userId, orderId or the full URL as a metric tag causes cardinality explosion and pushes memory/cost up. Low sampling can miss rare errors; tail-based sampling needs a compatible pipeline. Synchronous trace export or a full exporter queue can affect the app, so watch drops and exporter health. Manually instrumenting the same span repeatedly also makes traces noisy.

Measuring latency between services needs reasonably synchronized clocks, but the duration of a local span is more trustworthy than absolute timestamps. Do not treat traces as an audit log: sampling and retention mean traces do not guarantee every request is kept.

> Senior tip: start with RED metrics (rate, errors, duration), then trace the paths with real investigative value. Track ingest cost and cardinality as well; a beautiful dashboard with unbounded tags turns observability into an operational incident.`,
    follow: [
      'When do you choose head sampling versus tail sampling?',
      'Why should orderId not be used as a metric label?'
    ]
  },
  'spring-032': {
    q: 'A Spring Boot 3 application running blocking workloads wants to enable virtual threads via {{spring.threads.virtual.enabled}}. How do you assess the benefits, the limits and a rollout plan?',
    a: `**Summary:** On Java 21+, setting {{spring.threads.virtual.enabled=true}} asks Spring Boot to use virtual threads in the supported integrations. Virtual threads lower the thread cost of many concurrent blocking tasks, but they do not make the CPU faster, do not raise connection limits, and do not turn blocking code into non-blocking; you must verify the Boot version, pinning and downstream resources.

### The model
A platform thread is tied to an OS thread, so a large number of threads waiting on I/O consumes stack and scheduling resources. A virtual thread is mounted by the runtime onto a carrier thread while running and usually unmounts during compatible blocking operations. When it completes, it returns results like an ordinary thread, which makes it easy to keep imperative code. It pays off when the number of concurrent tasks is large and most of the time is spent waiting for I/O.

### Limits and rollout
- CPU-bound work is still bounded by cores; millions of virtual threads do not increase compute throughput.
- JDBC pools, remote API quotas, file descriptors and memory are still limits. Throttle with semaphores/bulkheads and appropriately sized pools.
- Pinning can occur in some synchronized/native regions while a virtual thread blocks; check the JDK documentation and the diagnostics of the runtime's JFR.
- Verify the Boot version and which components use the virtual-thread executor; do not assume every scheduler or third-party library switches over by itself.
- Benchmark latency, throughput, heap, carrier utilization and downstream saturation before/after under representative load.

### Production pitfalls
Tuning thread count while ignoring the connection pool can create tens of thousands of tasks all waiting to grab a connection and push tail latency up. Thread-local caches can multiply memory per virtual thread if you spawn too many tasks. Do not use long synchronized blocks around I/O without evaluating the specific runtime/JDK.

> Senior tip: virtual threads scale the concurrency of blocking I/O; they are not a general speed-up button. Roll out behind a canary, keep concurrency limits at the dependency boundaries, and compare p95/p99 together with pool wait time, not just a lower CPU graph.`,
    follow: [
      'How do virtual threads differ from reactive programming?',
      'How do you detect a virtual thread being pinned in a real environment?'
    ]
  },
  'spring-033': {
    q: 'When deploying a new version, how do you design graceful shutdown for Spring Boot so in-flight requests are not lost while still meeting the orchestrator\'s deadline?',
    a: `**Summary:** Graceful shutdown stops accepting new requests, gives in-flight requests a window to complete, then closes resources in order. Spring Boot supports graceful shutdown for the embedded web server; you must coordinate readiness/load balancer behavior, platform timeouts and stopping consumers/jobs to bound the total exit time.

### Sequence
When the shutdown signal arrives, the instance must quickly leave the traffic-serving endpoint (readiness false), the load balancer needs time to update, and then the server stops accepting new connections/requests gracefully. Running requests are drained within the configured window. The bean lifecycle stops workers and releases resources; finally the process exits before the orchestrator sends SIGKILL.

### Design
- Enable Boot's graceful shutdown and set the shutdown phase timeout based on real request durations.
- The orchestrator's total grace period must exceed readiness propagation + drain window + consumer stop/cleanup, with buffer.
- For queue consumers, pause message intake, finish or nack so the broker redelivers; make the handling idempotent to avoid duplicates.
- Stop scheduled jobs and executors with a timeout; avoid cleanup that calls external services without bounds.
- Track termination reason, cut-off requests, drain time and the number of in-flight messages.

### Production pitfalls
If readiness flips only after the process has begun shutting down, the load balancer may keep sending traffic for a short while. A timeout that is too short kills requests; too long hangs the rollout or blows the deployment budget. Web server draining does not by itself handle transactions running on background executors or message listeners. Shutdown hooks are not guaranteed to run when the process is SIGKILLed or the host loses power.

> Senior tip: base the grace period on the p99 request duration and the real deregistration time, then rehearse a rolling deploy under load. Graceful shutdown reduces disruption, but safe retries and idempotency remain the final protection layer for clients.`,
    follow: [
      'What ordering is needed for Kubernetes readiness and Spring graceful shutdown to coordinate?',
      'If a consumer is processing a message when shutdown starts, how do you guarantee no message loss?'
    ]
  },
  'jpa-022': {
    q: 'How does Hibernate\'s persistence context track entities, when does dirty checking happen, and what does the flush order mean for a transaction that both inserts and updates?',
    a: `**Summary:** The persistence context is an identity map and the unit that tracks managed entities within a transaction/session. Hibernate keeps the loaded state (snapshot); dirty checking compares entities at flush time to generate SQL; flushing synchronizes changes down to the DB but is not the same as commit. Hibernate uses a defined action order, not necessarily the order of the Java statements.

### Lifecycle and dirty checking
A transient entity is unmanaged; after {{persist}} it becomes managed. When an entity is loaded, Hibernate stores a snapshot plus an entry in the persistence context. Changing a Java field does not immediately emit SQL; at flush (usually before a query that needs synchronization or before commit), Hibernate detects the difference, creates the update and binds the values. A detached entity is no longer tracked automatically.

A context holds exactly one instance per entity type and primary key: loading the same key twice returns the same managed object. This guarantees consistent identity within the transaction, but a large context keeps many objects and snapshots in memory.

### Flush order
Hibernate executes its action queue in groups (for example inserts, updates, collection actions, deletes) rather than preserving the order of the source code. Database constraints remain the source of truth. If ordering dependencies exist, design the FK/associations correctly, flush deliberately, or split the transaction along business lines; do not rely on the order of repository calls.

### Production pitfalls
A bulk JPQL update/delete runs directly in the DB and bypasses dirty checking of entities already in the context, so managed objects can become stale; use clear/refresh appropriately after a bulk operation. Flush does not make data durable: a rollback still undoes the SQL. Changing large collections can create many snapshots/SQL statements and grow the heap.

> Senior tip: for large batches, flush and clear per chunk to bound the persistence context; inspect the SQL actually emitted and the transaction log instead of inferring from the number of {{save}} calls.`,
    follow: [
      'When does query auto-flush happen, and what surprises can it cause?',
      'How does a bulk update affect entities that are already managed?'
    ]
  },
  'jpa-023': {
    q: 'You hit {{LazyInitializationException}} after returning an entity from the service. How does Open Session in View fix the symptom, and why should you usually replace it with an explicit fetch plan?',
    a: `**Summary:** A lazy association is only loaded when accessed while the persistence context is still open. If the service ends the transaction and the entity detaches before the serializer reads the association, Hibernate cannot run another query and throws {{LazyInitializationException}}. Open Session in View keeps the session open for the whole request so lazy access still works, but it easily generates SQL outside the service and hides invisible N+1.

### Cause along the flow
The repository loads the entity with lazy associations not initialized. The service transaction commits, the persistence context closes or the entity detaches. The controller/Jackson serializes the relations; the proxy needs the session in order to query, but the session is gone. This is not a random mapping bug but a fetch plan that does not match where the data is consumed.

### Options
- Use DTO projections for API responses: fetch only the needed columns and stop letting serialization decide the SQL.
- Use a fetch join or {{@EntityGraph}} for the specific use case, and check the query count and pagination.
- Initialize the association inside the transaction if the logic genuinely needs it.
- Open Session in View can be useful in a simple server-rendered application, but you must understand the queries it generates at view time and control them with metrics/logs.

### Production pitfalls
Enabling OSIV does not guarantee the business transaction stays open; it only keeps the persistence context open, so lazy queries can run after the commit with a different transaction/autocommit depending on configuration. Serializing a list of 100 entities and then reading each collection can produce 101 queries. Returning entities also leaks internal structure and risks recursion on bidirectional associations.

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
Two transactions read a balance with version 7. T1 updates with the condition {{where id=? and version=7}}, bumps the version to 8 and commits. T2 also updates version 7; the condition does not match, and Hibernate raises a conflict instead of silently overwriting. The version can be an integer or a timestamp; a numeric version usually expresses ordering more clearly.

### Safe retries
- Retry only transient/conflict errors, with a bounded number of attempts and jittered backoff.
- Catch the exception outside the transaction boundary so the failed transaction has rolled back; each attempt opens a new transaction.
- Re-read the state and check the business invariants before reapplying the command.
- For non-idempotent commands (deducting money, adding points), you need an idempotency key or a recorded command so the retry does not double the effect.

### Production pitfalls
Retrying inside the same transaction, which is already marked rollback-only, usually cannot save the transaction. Blind retries can cause livelock when many clients contend for the same hot row; bound the attempts and return a conflict to the caller when you cannot reconcile automatically. Bulk updates/native SQL generally do not apply version semantics the way entity updates do.

> Senior tip: use optimistic locking when conflicts are relatively rare; if a hot row is contended continuously, measure the conflict rate and consider serializing by key or a conditional atomic update instead of retrying forever.`,
    follow: [
      'Why does a retry need a new transaction?',
      'When is a pessimistic lock more reasonable than optimistic locking?'
    ]
  },
  'jpa-025': {
    q: 'A bulk insert with Hibernate does not reach the expected throughput. How do you configure batching, and why does the {{IDENTITY}} generation strategy usually break JDBC insert batching?',
    a: `**Summary:** Hibernate JDBC batching collects several prepared statements of the same shape and sends them as a batch; configuring {{hibernate.jdbc.batch_size}} and flushing/clearing per chunk reduces round trips and memory. With {{IDENTITY}}, the database has to create the row in order to return the generated key for each insert, so Hibernate usually must insert immediately to obtain the ID, and insert batching becomes limited or disabled.

### Configuration and writing data
Set a sensible batch size (commonly starting around a few dozen, then measure), make sure the driver supports batch rewrites where available, and avoid SQL statement shapes that keep changing. The persistence context still holds entities, so process in chunks: persist N entities, flush, clear, then continue. Hibernate can sort inserts/updates by entity type to increase batch compatibility; verify via configuration and SQL logs on the real DB/driver.

### ID generation
Sequences allow obtaining the ID before the insert, so Hibernate can accumulate inserts; the sequence allocation/block size needs balancing between round trips and ID gaps. {{IDENTITY}} needs a DB-generated value after each row is inserted in order to assign it to the entity, which usually forces an early insert. Do not change the strategy just for batching: weigh portability, the schema and the semantics of the ID.

### Production pitfalls
Batching reduces network round trips but not the number of index updates, WAL writes or constraint checks. Batches that are too large increase transaction duration, locks and the cost of a rollback. Mixed inserts for several entity types can fragment the batch. Batching may not work as expected if the code runs a query midway (causing a flush) or the driver configuration does not support it.

> Senior tip: measure batch execution count, heap, transaction time and DB write latency; compare against plain inserts on the same data. Always test on the exact JDBC driver/version and confirm the generated IDs are correct, because an H2 benchmark does not represent the production database.`,
    follow: [
      'Why must you clear the persistence context when importing millions of rows?',
      'How does sequence allocation affect round trips and ID gaps?'
    ]
  },
  'jpa-026': {
    q: 'A screen needs a paginated list of entities with lazy relations. How do you choose between {{@EntityGraph}} and JOIN FETCH, and how do you handle the HHH000104 warning?',
    a: `**Summary:** {{@EntityGraph}} declares a fetch plan per use case, while JOIN FETCH writes the join directly in JPQL; both can remove N+1, but a collection fetch join combined with pagination duplicates SQL rows. Hibernate may then fetch the entire result set and paginate in memory, emitting the HHH000104 warning, trading a database-side limit for heavy in-memory loading.

### How to choose
EntityGraph fits when you want repository queries to stay readable and pick the associations to fetch at runtime; check whether the graph is fetch or load semantics per the mapping. JOIN FETCH is useful when the query needs conditions/sorting tied to the association, but you cannot fetch several bag collections arbitrarily because of duplicates/cartesian explosion.

### Safe pagination
1. Page over the root entity id with a bounded query and a stable ordering.
2. Run a second query that fetches the needed associations for that id set, using IN.
3. Restore the page order if the second query does not preserve it, and consider a separate count query.

Hibernate can be configured to fail when paginating a collection fetch instead of silently paginating in memory. For to-many relations, batch fetching or DTO projection are also options depending on the response shape.

### Production pitfalls
A page of 20 roots can turn into thousands of SQL rows if each root has many children; paginating rows is not the same as paginating roots. The warning is easy to ignore in a small test data set, but production heap/latency can jump suddenly. Sorting by a child column also needs a clear definition: when one root has multiple values, how is the order determined?

> Senior tip: test with production-like volume and fan-out, and assert both the query count and that the SQL containing LIMIT/OFFSET actually reaches the DB. When you see HHH000104, fix the fetch plan before raising the heap or silencing the warning.`,
    follow: [
      'Why can fetch-joining one collection still make a page wrong?',
      'How do you design the count query for a page over data with to-many relations?'
    ]
  },
  'jpa-027': {
    q: 'Hibernate\'s second-level cache can relieve database load, but when do you decide not to enable it, or to cache only some entities?',
    a: `**Summary:** The second-level cache lives outside the persistence context and shares entity/collection caching across Sessions. It fits read-heavy, rarely changing data with a consistent invalidation strategy; it should not be enabled broadly for mutable/hot data or for strict consistency requirements, where the cost of synchronization and stale reads exceeds the benefit.

### Telling the caches apart
The first-level cache is the persistence context of a single Session and is always tied to the identity map. The second-level cache belongs to the SessionFactory and has its own provider/configuration. The query cache stores query results (usually ID references); it does not replace the entity cache and must be invalidated when the related data changes. A cache hit still requires checking the mapping, version and provider semantics.

### When to consider it
- Small reference catalogs, read frequently and updated rarely.
- Freshness that can be accepted under a clear policy, or a provider that offers coherence suitable for the topology.
- A measurable cache hit ratio, evictions, heap/network cost and reduced DB load.

Avoid, or be very cautious with, balances, order statuses that change constantly, sensitive tenant data, entities with large payloads, or many nodes without reliable invalidation. A distributed cache adds a network hop and operational burden; per-node local caches may return different data.

### Production pitfalls
Bulk SQL or updates from another application can leave the cache stale if Hibernate does not know about the invalidation. A cache stampede when keys expire simultaneously creates a sudden spike in DB load. The entity cache does not make a query fast by itself if the query still scans the DB to find IDs. Do not add a cache to mask a missing index or an unfixed N+1.

> Senior tip: start with one catalog entity that has a specific freshness SLA, enable statistics, and rehearse invalidation when writing from every path. If you cannot describe who invalidates, when staleness is acceptable and how the hit ratio is measured, that cache should not be enabled yet.`,
    follow: [
      'How do bulk updates/native SQL affect the second-level cache?',
      'How do local caches and distributed caches differ when running multiple nodes?'
    ]
  },
});
