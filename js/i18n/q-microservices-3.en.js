/*
 * English translation of js/data/q-microservices.js — task T192. Format: js/core/i18n.js (content overlay).
 * ids: microservices-021 microservices-022 microservices-023 microservices-024 microservices-025 microservices-026 microservices-027 microservices-028 microservices-029
 */
App.i18n.content({
  'microservices-021': {
    q: `Your team uses JSON for Kafka events and runs into errors when adding a new field that the old consumer can't read. Explain Schema Registry (Avro/Protobuf), backward vs forward compatibility, and the safe rules for evolving schemas.`,
    a: `**Summary:** JSON has no contract ⇒ producers add a field, older consumers crash on the missing field or read a null with the wrong meaning. **Schema Registry** stores schemas by version and checks compatibility before registering. **Backward compatibility** (the default): consumers reading the new schema can read data written by the old schema — **deploy consumers first**; **forward compatibility**: consumers reading the old schema can read data written by the new schema — **deploy producers first**.

### Why JSON isn't enough
- No validation at produce time ⇒ garbage enters the topic and consumers find it late.
- No evolution rules ⇒ one team adds {{phone}} as a string type, another adds {{phone}} as an object type ⇒ a silent conflict.
- Consumers must defensive coding (nullable everywhere) ⇒ code branches, easy to slip bugs.

### Avro / Protobuf + Schema Registry
- **Avro**: schema is JSON, compact binary, supports unions/nullability, strong logic compatibility. Uses Confluent Schema Registry (REST API), client serializers fetch and cache the schema ID (magic byte + 4 bytes ID).
- **Protobuf**: {{.proto}} files, typed codegen for Java/Go/Python, backward/forward compatibility via field number (never reuse a number, never change a field type; delete a field and {{reserved}} the number). proto3 drops {{required}}, every field becomes optional. Confluent Schema Registry supports Protobuf and JSON Schema from Confluent Platform 5.5.

~~~java
// Avro serializer config
props.put("value.serializer", io.confluent.kafka.serializers.KafkaAvroSerializer.class);
props.put("schema.registry.url", "http://sr:8081");
props.put("auto.register.schemas", "false");  // register in CI, production only
~~~

### Compatibility modes (Confluent)
| Mode | Who deploys first | What's allowed | What's forbidden |
|---|---|---|---|
| **BACKWARD** (default) | **Consumer** | Delete a field, add a field **with a default** | Add a field without a default, change an incompatible type, rename (no aliases) |
| FORWARD | **Producer** | Add a field, delete a field **with a default** | Delete a field without a default, change an incompatible type |
| FULL | Either order | Only add/delete fields **with a default** (satisfies both conditions) | Anything BACKWARD or FORWARD forbids |
| NONE | - | Any changes | No check (dangerous) |

The {{*_TRANSITIVE}} modes check against **every** historical version, not just the immediately preceding one.

**Golden rule**: only add optional/default fields; never delete/change types/rename. To "delete" ⇒ add the new field, deprecate the old one, clean up after N releases.

### Deployment order by compatibility
- **BACKWARD** (most common): Consumer v2 (new schema) deploys first → Producer v2 deploys later. Consumer v2 still reads data v1 still in the topic (the new field takes its default).
- **FORWARD**: Producer v2 deploys first → Consumer v2 deploys later. Consumer v1 still reads data v2 (ignores the new field, takes defaults per its own schema).
- Producer and consumers deploy independently, no control over order ⇒ choose **FULL** (or FULL_TRANSITIVE).

### A breaking change and the migration plan
1. Register the new schema with compatibility=NONE (or disable the check temporarily).
2. Deploy consumers reading **both** (union types / upcast logic).
3. Deploy producers writing the new schema.
4. Once no old data remains ⇒ turn the compatibility back on, clean up old readers.

> Senior tip: CI/CD **must** run a compatibility check (e.g. the {{test-compatibility}} goal of the {{kafka-schema-registry-maven-plugin}}, or call REST {{/compatibility/subjects/.../versions/latest}}) before merge. A PR changing {{.avsc}}/.proto that fails the check = does not merge. Without exceptions, production is not the place to test schemas.`,
    follow: [`How do Avro union types handle nullability versus Protobuf optional fields?`, `When do you choose FORWARD instead of BACKWARD?`, `How does the Schema Registry stay HA and how does a producer cache the schema ID?`]
  },
  'microservices-022': {
    q: `Compare the Inbox pattern and the Outbox pattern to achieve an exactly-once effect when consuming events. How do you implement an idempotent consumer using a processed_message table?`,
    a: `**Summary:** **Outbox** solves atomicity of **write DB + publish event** at the producer side; **Inbox** solves atomicity of **consume event + write DB** at the consumer side. Both aim for the same thing: the side effect happens exactly once. Inbox inserts into a {{processed_msg(msg_id PK, processed_at)}} table in the same transaction as the business write — duplicate messages ⇒ PK conflict ⇒ skipped.

### Outbox vs Inbox — the two ends of the pipe
| | Outbox (Producer) | Inbox (Consumer) |
|---|---|---|
| Problem | Write DB succeeds, publish event fails/lost | Consume event, write DB fails/lost, or duplicate processing |
| Solution | Write the business row + outbox row **in one transaction** | Insert processed_msg + business row **in one transaction** |
| Relay | Polling / CDC (Debezium) pushes out to the broker | No relay needed — the consumer dedups itself |
| At-least-once → Exactly-once effect | Producer idempotent + consumer idempotent | **Consumer idempotency is mandatory** |

### Inbox pattern implementation
~~~sql
CREATE TABLE processed_message (
    msg_id VARCHAR(255) PRIMARY KEY,   -- Kafka offset/partition or event ID
    processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_payment (
    order_id VARCHAR(64) PRIMARY KEY,
    amount DECIMAL(19,2),
    status VARCHAR(20)
);
~~~

~~~java
@Transactional
public void handlePayment(PaymentEvent evt) {
    // 1. Try insert processed_message — duplicate key => exception => skip (MySQL; see the pitfall for PostgreSQL)
    try {
        jdbc.update("INSERT INTO processed_message(msg_id) VALUES (?)", evt.msgId());
    } catch (DuplicateKeyException e) {
        log.info("Duplicate event ignored: {}", evt.msgId());
        return;  // already processed, idempotent
    }

    // 2. Write business logic (in the same transaction)
    jdbc.update(
        "INSERT INTO order_payment(order_id, amount, status) VALUES (?, ?, 'PAID') " +
        "ON DUPLICATE KEY UPDATE amount=amount, status='PAID'",
        evt.orderId(), evt.amount()
    );
}
~~~
- **msg_id**: use {{topic-partition-offset}} (unique within Kafka) or {{eventId}} from the payload (if the producer guarantees uniqueness).
- **Same transaction** is mandatory: splitting two transactions ⇒ a crash between the steps duplicates or loses.
- **Natural-key upsert** (INSERT ... ON DUPLICATE KEY UPDATE) replaces the processed_message table when the business key is unique (e.g. {{order_id}} unique within payment) — drops one table and one insert.

### Compare with Outbox
- Outbox is **required** when a service both writes DB and publishes events: no shared transaction between the DB and the broker (dual write) ⇒ write the event into the outbox table in one transaction then relay later.
- Inbox is **required** when the consumer cannot control the producer (3rd party, legacy) — the producer has no outbox.
- If you control **both ends**: Outbox + Inbox = end-to-end exactly-once effect (even though the broker is only at-least-once).

### Pitfall
- The processed_message table bloats infinitely ⇒ a job cleans old rows (TTL 7–30 days) and partitions by day.
- If msg_id is {{topic-partition-offset}}: it only catches **the consumer re-reading the same record**; a duplicated producer (non-idempotent retry, outbox relay publishing twice) creates a **new** record ⇒ slips through. Mirroring or restoring topics also changes offsets ⇒ use an event ID the producer generates in the payload/header instead.
- PostgreSQL: a duplicate-key error aborts **the whole transaction** — catching the exception and continuing to run other SQL lines gives "current transaction is aborted". Use {{INSERT ... ON CONFLICT (msg_id) DO NOTHING}} and check that the affected rows count == 0 instead of catching exceptions.
- **Transaction timeout**: inserting processed_msg + the business write must be fast; avoid calling external APIs inside the transaction.

> Senior tip: Inbox table is cheap insurance — always add it when consuming events from other teams. One INSERT + one index lookup buys you peace of mind, no double-charge.`,
    follow: [`Should msg_id come from the Kafka offset or an event ID from the payload, and what are their trade-offs?`, `How does the Inbox pattern handle transaction timeout (DB lock) at high volume?`, `When is natural-key upsert a good replacement for the processed_message table, and when is it not?`]
  },
  'microservices-023': {
    q: `Your system uses choreography (event-driven), but the order flow spans 6 services, debugging is painful, and services timeout each other. When do you migrate to orchestration (Temporal/Camunda), and compare the two ways on observability, compensation, and versioning?`,
    a: `**Summary:** **Choreography**: services emit events themselves, nobody orchestrates — simple at first, but flows longer than 3–4 services become "spaghetti events", hard to trace the whole picture, compensations scattered. **Orchestration**: a **workflow engine** (Temporal, Camunda, Spring StateMachine) orchestrates every step, state centralized, observability is good, compensation has a direction. Migrate when the flow is complex, cross-team, needs centralized timeout/retry, or an audit trail is mandatory.

### Choreography — enough and overloaded
- **Enough**: ≤ 3 services, linear flows, same team, little branching, no human-in-the-loop needed.
- **Overloaded**: fan-out/fan-in complex, many conditional branches, need external signals (OTP, manual approval), compensations must undo several steps backwards, teams split across boundaries, nobody owns end-to-end responsibility.
- Observability: you need distributed tracing to see the flow; one failed event without knowing which flow it belongs to.
- Versioning: adding a step = adding consumers, producers do not know; changing an event schema = must update all consumers together.

### Orchestration — Temporal vs Camunda 8 (Zeebe) vs self-written
| | Temporal | Camunda 8 (Zeebe) | Spring StateMachine / self-written |
|---|---|---|---|
| Model | Code-first (Java SDK, workflow = code) | BPMN diagram + FEEL expression | Java code / config |
| State | Integrated event sourcing, full history | Persisted variable + incidents | Self-managed (DB table) |
| Durability | Built-in retry, timeout, heartbeat | Built-in, needs exporter config | Implemented manually |
| Scaling | Horizontal (workers poll) | Horizontal (Zeebe broker) | Implementation-dependent |
| Team fit | Backend-heavy, prefers code | Business analyst + developers share a BPMN | Small team, simple flows |
| Lock-in | Temporal server (self-host/SaaS) | Camunda SaaS/self-host | None |

- **Temporal**: workflows written in Java (or Go/TypeScript), **deterministic execution** — replay from history to recover, support **activity heartbeats** for long-running, **continue-as-new** for long workflows. Fit: payment flows, loan origination, order fulfillment.
- **Camunda 8 (Zeebe)**: BPMN 2.0, non-blocking, gRPC gateway. Fit when you need a business analyst to draw diagrams and version process code separately.

### Compensation in orchestration
Each step defines a **compensation handler** (rollback action), which runs in reverse order on failure.
Temporal (Java SDK, class {{io.temporal.workflow.Saga}}):
~~~java
Saga saga = new Saga(new Saga.Options.Builder().build());
try {
    activities.reserveStock(orderId);
    saga.addCompensation(activities::releaseStock, orderId);   // register compensation for step 1
    activities.chargePayment(orderId);
    saga.addCompensation(activities::refundPayment, orderId); // register compensation for step 2
} catch (ActivityFailure e) {
    saga.compensate();  // run compensations in reverse order (LIFO)
    throw e;
}
~~~
- Camunda: boundary event / compensation trigger on the diagram.
- Compensation is better than choreography: **ordering is guaranteed**, compensation has its own timeout, retry compensation separately, visible state "compensating".

### When you do not need a workflow engine
- Flows < 3 services, linear, no branching, no human tasks.
- The team lacks experience operating engines — Temporal/Camunda adds a component that must be monitored, upgraded, backed up.
- You only need a simple saga: Spring StateMachine + a state table is enough.

> Senior tip: do not fear "adding an engine" — the ops cost of running Temporal/Camunda is usually **lower than the cost of debugging choreography at 3 AM**. Choose an engine when the cost of confusion > the cost of infrastructure.`,
    follow: [`How do you test Temporal workflow determinism concretely?`, `How does Camunda BPMN versioning differ from normal code versioning?`, `When do you choose Spring StateMachine instead of a dedicated engine?`]
  },
  'microservices-024': {
    q: `Deploying Spring Boot 3 onto Kubernetes: how do you configure liveness, readiness, and startup probes? Explain resource requests/limits, graceful shutdown with the preStop hook, and why not using a liveness probe for slow startups.`,
    a: `**Summary:** The **startup probe** covers apps that boot slowly (JVM warmup, DB migrations, cache loading); the **readiness probe** covers ready to accept traffic; the **liveness probe** only detects deadlocks/OOM — never use liveness for slow startup. Requests/limits for CPU/RAM must be based on real benchmarks. Graceful shutdown: {{preStop}} sleep + {{terminationGracePeriodSeconds}} + Spring {{server.shutdown=graceful}} so requests being processed finish.

### The three probes — different purposes
| Probe | Purpose | Fail result | When to use |
|---|---|---|---|
| **Startup** | App is starting, not yet ready for readiness | **Kill the pod, restart** (per restartPolicy) | Always use for Java (JVM warmup, Flyway migrate, cache load) |
| **Readiness** | App is ready to accept requests | **Remove from Service endpoints** (no new traffic) | Always use — app is warm (warm-up done, dependencies vital to itself) |
| **Liveness** | App deadlock, OOM, stuck | **Kill the pod, restart** | Only detect fatal — HTTP 200 on {{/actuator/health/liveness}} (do NOT check the DB!) |

- The **startup probe** protects readiness/liveness from being evaluated while the app is starting: {{failureThreshold * periodSeconds}} > max boot time (e.g. 300s for an app doing DB migrations).
- The **readiness probe** should check: DB ping, Redis ping, Kafka connection — *not* downstream services (avoid cascade failure).
- The **liveness probe** **must NOT** check dependencies — if the DB dies, liveness fails ⇒ restart the pod ⇒ the DB dies worse. Only check the app's internal state via a light endpoint like {{/actuator/health/liveness}} (Spring Boot turns on this probe group automatically on Kubernetes).

### Resource requests/limits — Java-specific
~~~yaml
resources:
  requests:
    memory: "1Gi"      # Heap (Xmx) + Metaspace + CodeCache + ThreadStack + DirectMemory + OS
    cpu: "500m"
  limits:
    memory: "1.5Gi"    # Limit > Request to absorb bursts, but not too far out (Burstable QoS)
    cpu: "1000m"
~~~
- **Memory**: {{-Xmx}} ~= 70% of the limit (e.g. limit 1.5Gi ⇒ Xmx 1G). The rest goes to Metaspace (~256M), CodeCache (~240M), Thread stacks (1M/thread × 200 = 200M), Direct buffers, GC overhead.
- **CPU**: Request = baseline throughput; Limit = burst ceiling. Java GC uses CPU — a too-tight limit ⇒ GC throttling ⇒ latency spikes.
- **QoS class**: Every container with request==limit for both CPU and memory ⇒ Guaranteed (evicted **last** when the node runs out of resources). Request < Limit ⇒ Burstable. Nothing set ⇒ BestEffort (easy to be killed).

### Graceful shutdown — don't drop requests
1. **Spring Boot 3**: {{server.shutdown=graceful}} (defaults from Boot 3.4) + {{spring.lifecycle.timeout-per-shutdown-phase=30s}} — Tomcat/Jetty/Undertow/Netty stop accepting new requests, wait for in-flight requests to finish.
2. **preStop hook**: when the pod moves to Terminating, removing it from the EndpointSlice and the kubelet stopping the container happen **simultaneously**; kube-proxy/ingress needs a few seconds to update. preStop keeps the app running normally during that window, SIGTERM only arrives **after** preStop completes.

~~~yaml
lifecycle:
  preStop:
    exec:
      command: ["sh", "-c", "sleep 10"]
terminationGracePeriodSeconds: 40
~~~
- Sequence: pod Terminating → (simultaneously) remove endpoint + run preStop (sleep 10s) → **SIGTERM** → Spring graceful shutdown (wait for requests to finish, max 30s) → SIGKILL if total time (measured from when preStop began) exceeds 40s.
- The {{sh -c sleep}} command needs an image with a shell (distroless does not); Kubernetes recently got a native {{sleep}} action for preStop.
- {{terminationGracePeriodSeconds}} ≥ {{preStopSleep}} + {{shutdownPhaseTimeout}} + buffer.

### Pitfalls
- A liveness probe checking the DB ⇒ the DB slows ⇒ pod restart loop ⇒ cascade.
- No startup probe with a short {{initialDelaySeconds}} on liveness ⇒ app not fully booted is killed by liveness ⇒ **restart loop** (CrashLoopBackOff). Readiness failing at boot is fine — the pod simply hasn't accepted traffic yet.
- {{-Xmx}} set from the memory limit ⇒ OOMKilled when off-heap grows. Use {{-XX:MaxRAMPercentage=70}} instead of hard-coding.
- No {{preStop}} ⇒ the app receives SIGTERM and stops accepting connections while kube-proxy/ingress **still routes** traffic to the pod ⇒ 502/connection-refused errors during deploy.

> Senior tip: always load-test to find a real {{XmxValue}} (stable heap after a Full GC) and size requests/limits accordingly. Don't guess — Java memory is not only the heap.`,
    follow: [`How do you compute {{failureThreshold * periodSeconds}} for an app running 200 Flyway scripts?`, `What risks does a readiness probe checking a downstream service pose?`, `Spring Boot's {{terminationGracePeriodSeconds}} defaults to 30s; how much do you increase it for an app handling slow requests?`]
  },
  'microservices-025': {
    q: `A request from a client travels through 5 services (A→B→C→D→E), each with a 5s timeout. Explain timeout budgets, deadline propagation, and why the timeout must shrink going deeper (deeper hops get shorter timeouts).`,
    a: `**Summary:** **Timeout budget** = the total time the client accepts (e.g. 5s). Each hop needs its own deadline, **total deadline ≤ budget**. **Deadline propagation**: the client sends an absolute deadline (or remaining time) through a header, each service subtracts the time already spent before passing it on. Deeper hops have shorter timeouts so: (1) reserve for retries, (2) avoid head-of-line blocking, (3) fail fast before stalling upstream resources.

### The problem: a fixed timeout for every hop
- Client timeout 5s, each of A→B→C→D→E 5s ⇒ worst case 25s (5 hops × 5s).
- 3 retries at B ⇒ B alone could spend 15s ⇒ the client timed out but the downstream keeps burning CPU.
- No deadline propagation ⇒ service D does not know the client timed out, finishes processing then returns nobody.

### Deadline propagation (Google gRPC / Envoy / Spring Cloud)
The client puts an **absolute deadline** (timestamp) or **remaining time** (ms) into a header: {{x-deadline-ms}} or {{grpc-timeout}}.
- Each service:
long remaining = deadline - System.currentTimeMillis();
if (remaining <= 0) return ResponseEntity.status(504).build(); // budget exhausted: fail fast, don't call downstream
- The service uses {{remaining}} as the timeout for the downstream call, subtracting a **safety margin** (e.g. 100ms) for network/serialization overhead.
- Spring does not ship a built-in deadline mechanism for HTTP: write a filter to read the header, store it in the request context (MDC/Reactor Context), then {{ClientHttpRequestInterceptor}} / {{ExchangeFilterFunction}} attach the header and timeout to the downstream call; gRPC: {{Context}} propagates the deadline automatically (header {{grpc-timeout}}).

### Timeout shrinking going deeper (tapered timeout)
| Hop | Service | Timeout | Why |
|---|---|---|---|
| 1 (edge) | API Gateway / BFF | 4.5s | Closest to the client, needs buffer for retries + response |
| 2 | Orchestration / API composition | 3.5s | Needs time to aggregate, concurrent calls |
| 3 | Core domain (Order, Payment) | 2.5s | Core business logic, local DB |
| 4 | Infrastructure (Cache, Queue) | 1.5s | Fast path, minimal logic |
| 5 (leaf) | External / Legacy | 1.0s | Not controlled, fail fast |

- The table above is an example. **Principle**: the timeout of hop i < the timeout of hop i−1 minus the time spent locally and the times × the timeout of each retry; the real numbers come from p99 latency measurements.
- **Retry budget**: only reserve ~10–20% budget for retries, only retry at **one** layer — retrying everywhere multiplies the layers (3 layers × 3 retries = 27 calls to the leaf).

### Pitfall
- No deadline propagation ⇒ "zombie request": the client cancels, the downstream keeps running ⇒ waste, skewed metrics.
- A too-deep timeout ⇒ one leaf slow drags the chain timeout, draining the upstream thread pool.
- Clock skew between services ⇒ deadlines computed wrong ⇒ use **remaining time (ms)** instead of an absolute timestamp, or sync NTP tightly.

> Senior tip: measure **timeout budget usage** by percentile (p50, p95, p99) at each hop. If p99 on hop 3 already eats 80% of the budget, you must tune hop 3 or reduce the budget for hops 1–2. Without this metric you are blind to your budgets.`,
    follow: [`How does deadline propagation work over Kafka (async)?`, `When do you prefer an absolute deadline timestamp over remaining time?`, `Where do you put retry handling for a leaf (external API) that times out often?`]
  },
  'microservices-026': {
    q: `One downstream (payment) clogs the upstream's (order) thread pool; other requests (catalog, user) are also waiting. You apply the Bulkhead pattern: thread-pool isolation vs semaphore isolation, configured how?`,
    a: `**Summary:** **Bulkhead** = isolate resource pools per dependency, so one downstream slowdown/error doesn't spill to other services. **Thread-pool isolation**: every dependency gets its own pool threads, queue, and context-switch overhead — fits blocking I/O (JDBC, sync HTTP). **Semaphore isolation**: counts concurrent calls only, no queue, lightweight — fits non-blocking (WebClient, R2DBC). Size max concurrency based on Little's Law: concurrency = throughput × latency (use the mean; switch to p99 for headroom).

### Why Bulkhead is needed
- The order service calls Payment, Catalog, User on the same pool of 200 threads.
- Payment is slow (DB lock 30s) ⇒ 200 threads stuck at Payment ⇒ Catalog, User requests queue ⇒ timeout ⇒ cascade failure.
- Bulkhead: Payment 25 threads, Catalog 50, User 50 ⇒ Payment slow only kills 25 threads; Catalog, User still run.

### Thread-pool isolation (Resilience4j Bulkhead)
~~~yaml
resilience4j:
  thread-pool-bulkhead:              # different key from the semaphore bulkhead
    instances:
      paymentApi:
        maxThreadPoolSize: 25
        coreThreadPoolSize: 10
        queueCapacity: 50              # requests queued when the pool is full
        keepAliveDuration: 60s
      catalogApi:
        maxThreadPoolSize: 50
        coreThreadPoolSize: 20
        queueCapacity: 100
~~~
- Java: {{@Bulkhead(name = "paymentApi", type = Type.THREADPOOL)}} — the call runs on its own pool, the method returns {{CompletableFuture}}/{{CompletionStage}} (async on the dedicated pool). Queue full + pool full ⇒ {{BulkheadFullException}}.
- Pros: queue buffer for spikes, caller thread not blocked; combine {{@TimeLimiter}} to cut calls that take too long. (No timeout configured for waiting inside the queue.)
- Cons: thread + context-switch overhead, ~1MB memory per thread stack, complex tuning (core/max/queue).

### Semaphore isolation (Resilience4j default)
~~~yaml
resilience4j:
  bulkhead:
    instances:
      paymentApi:
        maxConcurrentCalls: 25         # semaphore permits
        maxWaitDuration: 0             # default 0: no permit => reject immediately
      catalogApi:
        maxConcurrentCalls: 50
~~~
- Java: {{@Bulkhead(name = "paymentApi", type = Type.SEMAPHORE)}} — caller acquires the permit directly, runs the call, releases.
- Pros: zero overhead, fits reactive/non-blocking (WebClient, R2DBC), scales naturally with the event loop.
- Cons: **no queue** — no permit ⇒ caller waits up to {{maxWaitDuration}} (default 0 = reject immediately, throw {{BulkheadFullException}}), caller must fall back itself.

### Which to choose?
| Condition | Pick |
|---|---|
| Blocking I/O (RestTemplate, JDBC, blocking gRPC stubs) | **Thread pool** |
| Non-blocking (WebClient, R2DBC, async gRPC stubs) | **Semaphore** |
| Need a queue buffer for burst traffic | **Thread pool** |
| Extreme-low latency, high throughput, reactive stack | **Semaphore** |
| Legacy code synchronous, no desire to switch to async | **Thread pool** |

### Sizing via Little's Law
~~~text
Concurrency = Throughput (req/s) * Latency (s) p99
~~~
- Payment: 100 req/s × 0.8s p99 = 80 concurrent ⇒ set max 100 (buffer 25%).
- Catalog: 500 req/s × 0.05s p99 = 25 concurrent ⇒ set max 35.
- Always set **maxConcurrentCalls ≤ the server's thread pool size** (Tomcat's default 200) so you never DOS yourself.

> Senior tip: bulkhead config is **not set once, forget forever**. Have a dashboard: {{resilience4j.bulkhead.available.concurrent.calls}} / {{resilience4j.bulkhead.max.allowed.concurrent.calls}} per dependency. If available is usually < 10% of max ⇒ raise max or tune the downstream latency. If it is always ≈ max ⇒ you are over-provisioning.`,
    follow: [`Does a thread-pool bulkhead's queueCapacity timeout requests that wait too long?`, `When the semaphore bulkhead rejects due to being full — how do you fall back gracefully?`, `Does the Bulkhead combine with a Circuit Breaker: frees up permits when the breaker opens?`]
  },
  'microservices-027': {
    q: `A 15-service system, the team complains "any change forces deploying 5 services at once", high latency from repeating HTTP calls. What are the signs of over-splitting bounded contexts (chatty services, distributed monolith), and how do you merge/split?`,
    a: `**Summary:** **Chatty services** = many calls over the network for a simple business operation; **distributed monolith** = services split physically but coupled logically (shared DB, sync call chains, deployed together). Signs: fan-out > 3 for one use case, shared DB, cyclic dependency, teams must align releases. Solution: merge services with tight coupling, split those with clear boundaries, use API composition/CQRS for cross-service queries.

### Signs of over-splitting (service smells)
| Smell | Symptoms | Root cause |
|---|---|---|
| **Chatty** | 1 request from client → 10+ internal calls, p99 > 2s | Boundary too thin, missing aggregate API |
| **Distributed monolith** | Deploying 5 services together, rolling back 1 pulls 4 with it | Shared DB, sync call chains, cyclic dependencies |
| **Data coupling** | 3 services read/write the {{customer}} table | No owner defined for the data |
| **Temporal coupling** | Service A waits for B to finish before running, cannot run in parallel | Sync calls instead of events |
| **Team friction** | Team X blocks team Y's release because they share code/models | No clear bounded context |

### Analyze the dependency graph
- Draw a **service dependency graph** (call graph from traces): node = service, edge = call (sync/async).
- A **cycle** is almost certainly a distributed monolith (A→B→C→A).
- High fan-out from one service = candidate for an API Gateway/BFF aggregate.
- Shared DB = hidden edge, must detect via connection-pool metrics or audit logs.

### Merge / split strategies
**Merge when:**
- Two services always deploy together, share a DB, repeat sync calls.
- The coupling is **functional** (one bounded context), not technical.
- Example: {{Order}} + {{OrderItem}} + {{OrderHistory}} → merge into {{Order Service}}.

**Split when:**
- A service has 2+ bounded contexts inside it (e.g. {{UserService}} does both auth and profile).
- Different scale profiles (payment needs high availability, catalog can go down 5 minutes).
- Different team ownership, conflicting release cadences.

### Cross-service query — no cross-DB joins
- **API Composition (BFF/Gateway)**: aggregate at the edge, fits fewer reads, latency acceptable.
- **CQRS Read Model**: build a denormalized view table/Elasticsearch from events, O(1) queries, fits many reads, more complex.
- **Data Lake/OLAP**: for reporting, analytics, not for the transactional path.

> Senior tip: don't split services by **entity/CRUD** (UserService, ProductService, OrderService just wrap tables) — split by **business capability / subdomain** (Ordering, Fulfillment, Billing), each service owns one whole process and its data. Entity services lead to chatty; but splitting until one service per verb per use case becomes microservice hell.`,
    follow: [`How do you detect shared DB in production when there is no documentation?`, `When merging 2 services, how do you migrate data to do it zero-downtime?`, `Where do you break the cycle A→B→C→A?`]
  },
  'microservices-028': {
    q: `The dashboard needs to show orders + customers + payments + inventory — the data is spread across 4 services. Compare API Composition, CQRS Read Model, and Data Lake. When do you pick which, the trade-off of latency vs consistency vs effort?`,
    a: `**Summary:** **API Composition** (BFF/Gateway) merges responses at runtime — simple, the freshest data of each service, latency = sum of the calls (parallel calls ≈ slowest single call). **CQRS Read Model** builds denormalized views from events — fast queries O(1), but requires effort for projection, replay, and schema, eventual consistency is clear. **Data Lake/OLAP** is for analytics/reporting — not for the transactional path. Choose by read/write ratio, latency SLA, team capacity.

### Compare the three approaches
| Criterion | API Composition | CQRS Read Model | Data Lake / OLAP |
|---|---|---|---|
| **Latency** | Sum of the calls (50–500ms) | Very fast (5–20ms) | N/A (batch) |
| **Consistency** | Near real-time (if no cache) but not a consistent snapshot across services | Eventual (per projection lag) | Eventual (batch delay) |
| **Build effort** | Low (aggregate code) | High (projection, replay, schema) | Medium (pipeline, modeling) |
| **Ops effort** | Low | High (monitor lag, rebuild) | Medium |
| **Fit** | Internal dashboards, read ratio < 10× | Customer-facing dashboards, read ratio > 50× | Reporting, BI, ML training |
| **Schema changes** | Easy (change just the aggregator) | Hard (must migrate the view, replay) | Easy (schema-on-read) |

### API Composition (BFF pattern)
~~~java
@GetMapping("/dashboard/orders/{id}")
public OrderDashboardDto getDashboard(@PathVariable String id) {
    var order = orderClient.get(id);           // 50ms
    var customer = customerClient.get(order.customerId()); // 30ms
    var payment = paymentClient.getByOrder(id); // 40ms
    var inventory = inventoryClient.getReserved(id); // 30ms
    return new OrderDashboardDto(order, customer, payment, inventory);
}
~~~
- Use **parallel calls** (CompletableFuture/WebClient) to cut latency.
- **Timeout budget**: set a timeout for each call, graceful fallback (partial data).
- **Caching**: cache responses 10–60s for dashboards that change less often.

### CQRS Read Model (Materialized view)
- Events: {{OrderPlaced}}, {{PaymentCaptured}}, {{ItemShipped}} → the projection updates {{order_dashboard_view}}.
- Query: {{SELECT * FROM order_dashboard_view WHERE id = ?}} — a single row, no joins.
- **Projection lag**: monitor {{projection_lag_ms}} (event time → view updated). Alert if > 5s.
- **Rebuild tool**: required script to replay from scratch or from a checkpoint.

### When to pick which
- **Read/Write < 10:1**, latency budget > 200ms, small team → **API Composition**.
- **Read/Write > 50:1**, latency budget < 50ms, team ready to invest in projection → **CQRS Read Model**.
- **Analytics, historical, ad-hoc query**, real-time not needed → **Data Lake** (Iceberg/Delta Lake + Trino/StarRocks).
- **Combine**: API Composition for the transactional path, CQRS for the high-traffic dashboard, Data Lake for BI.

> Senior tip: don't build a CQRS view for everything — start with API Composition + cache. Only add projection when a metric proves it matters (p99 read latency > SLA, read throughput draining CPU). Over-engineering CQRS is the most expensive debt in microservices.`,
    follow: [`How does partial failure (one service down) fall back in API Composition?`, `How do you monitor the CQRS projection lag by metric, and what alert threshold?`, `Can a Data Lake power a real-time dashboard? Why or why not?`]
  },
  'microservices-029': {
    q: `A topic has 12 partitions but the team expects every event of a single order to keep the right order. How do you choose the key and the number of partitions, and what is Kafka's ordering guarantee?`,
    a: `**Summary:** Kafka only guarantees ordering within one partition. Use {{orderId}} as the key so events of the same order land in the same partition; increasing partitions may change the key→partition mapping, so weigh it when ordering must hold over time.

### From key to ordering
The producer serializes the key then the partitioner picks a partition (usually hash the key modulo the number of partitions). The broker appends the record to the log of that partition; the consumer reads by ascending offset. Because events sharing a key land in the same log and are observed in the order they were written, events sharing a key share ordering.

~~~text
order-42: Created -> Paid -> Shipped   (partition 7)
order-99: Created -> Paid             (partition 2)
~~~
Ordering applies only within a partition, there is no global order between partition 7 and 2. Records without a key load evenly, but events of the same aggregate may run concurrently and flip ordering.

### Choosing the key and partition count
- Choose the key by the unit to serialize: {{accountId}} for account balances, {{orderId}} for the order lifecycle. Avoid keys that are time-based or constant because they create hot partitions.
- Partition is the read unit that maximizes concurrency in one consumer group; 12 partitions do not yield 12 useful consumers if most traffic lands on one key.
- Adding partitions increases concurrency but changes the hash mapping of newer keys. Old records sit on the old partition, newer records may land elsewhere; there is no longer one contiguous ordering line for that key.
- If you need to change the partition count safely, use a new topic version with a migration/replay plan, or a custom partitioner with a stable version; do not assume increasing partitions always holds.

### Common mistakes
A consumer processes a record out of order then commits a higher offset for a not-yet-finished record: the broker retains the original ordering but the business effect is flipped. Or several producers concurrently send the same key without coordinated retries, making the time-based order not guaranteed as expected.

> Senior tip: track the record distribution across partitions before increasing partitions. For payments, watch the hot key and the partition latency; bumping the total partition count does nothing for one merchant that dominates the traffic.`,
    follow: [`If one key consumes 30% of the traffic, how do you preserve ordering while reducing the hot partition?`, `How does increasing the partition count affect consumers and ordering?`]
  },
});
