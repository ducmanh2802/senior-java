/*
 * English translation of js/data/q-microservices.js — task T190. Format: js/core/i18n.js (content overlay).
 * ids: microservices-001 microservices-002 microservices-003 microservices-004 microservices-005 microservices-006 microservices-007 microservices-008 microservices-009 microservices-010
 */
App.i18n.content({
  'microservices-001': {
    q: `Team of 5, an unstable domain, a 3-month deadline. Would you advise a monolith, a modular monolith, or microservices? List the situations where you would advise AGAINST splitting services.`,
    a: `**Summary:** with an unstable domain and a small team, start with a **modular monolith** — a single process split into modules along clear boundaries; split into microservices only with real evidence of a need for independent scaling or conflicting release cadences between teams.

### Quick comparison
| Criterion | Classic monolith | Modular monolith | Microservices |
|---|---|---|---|
| Operational cost | lowest | low | high: pipeline, deploy, network, monitoring per service |
| Boundaries | vague, drift over time | enforced by packages + architecture tests | enforced by API contract + separate schema |
| Scaling | entire application | entire application | per service, per table |
| Transactions | ACID for free | ACID for free | you handle saga/outbox/compensation yourself |
| Team deploy independence | low | medium | high |

### When NOT to split
- **The domain is still changing**: every model change also means contract changes + migration for 2 DBs. The cost of splitting outweighs the benefit; wait until the boundary has "not changed for 3 consecutive months".
- **Team below ~8–10 people**: a 5-person team carrying 8 services = 0.6 person per service, most of the time spent babysitting infra instead of building product.
- **No CI/CD, containers, observability yet**: splitting services without a deploy/rollback pipeline, tracing, or centralized logging just increases downtime.
- **The business needs strong transactions across entities**: a monolith gives you ACID for free; splitting means you take on saga, outbox, idempotency yourself.
- **No product-market fit yet**: change cost matters more than scale cost.

### Signs you ARE ready to split
- A module always changes independently and drags the whole system into each deploy.
- The module needs different resources/profiles (large memory, GPU, high blast radius like payments).
- Two teams argue about release schedules, or one team blocks another team's release.
- Already in place: infrastructure as code, blue-green deploy, distributed tracing, centralized logs.

### A realistic modular monolith
Split packages by bounded context, modules depend only through public interfaces, touching another module's tables is forbidden — verified with ArchUnit:

~~~java
@ArchTest
static void order_does_not_reach_into_payment(JavaClasses classes) {
    noClasses().that().resideInAPackage("..order..")
        .should().dependOnClassesThat().resideInAPackage("..payment.internal..") // only through the public API
        .check(classes);
}
~~~

Each module has its own schema inside one shared DB instance. When you later split into services, you migrate exactly that schema to a new DB — the code mostly changes the connection and adds an API layer.

> Senior tip: the real cost of microservices is not in the code but in ops — every service adds a dashboard, a pipeline, an on-call runbook. Split by real pain, not by CV.`,
    follow: [`If you are forced to split one module out early, which module do you pick and by what criteria?`, `How does a modular monolith differ from SOA (ESB) in terms of centralization?`, `How do you use ArchUnit/JPMS to enforce module boundaries in CI?`]
  },
  'microservices-002': {
    q: `Two teams share one database schema to avoid calling each other's APIs. Explain why this is risky and how you use DDD to determine the service boundary.`,
    a: `**Summary:** **database-per-service** is not about saving network connections but about preserving independence: each service owns its own data, other services only read through API/events. The right boundary in DDD is the **bounded context** — the place where a word has exactly one meaning.

### Why sharing a DB is hidden coupling
- Team B changes the schema (renames a column, splits a table, changes a type) without team A knowing ⇒ "unexplained" downtime. No compile-time constraint exists, only a runtime one.
- Cross-service query joins: the code is compact, sure, but now two deployments must keep their schemas in sync at all times — you have just rebuilt a distributed monolith at the data layer.
- Scaling becomes meaningless: two services on one DB instance means the bottleneck is still that DB; you cannot scale reads/writes independently.
- Blast radius: one naive full scan by service A slows the shared DB ⇒ service B dies along with it although it touched nothing.

~~~text
Order Service                   Payment Service
+------------------+            +------------------+
| orders (schema)  |  REST/evt  | payments (schema)|
+------------------+ <--------> +------------------+
      do not read each other's tables, only read via API/event
~~~

### Finding boundaries with DDD
1. **Event storming** with the business actors: draw the domain events (OrderPlaced, PaymentCaptured, ItemShipped) → group the related commands/events into one context.
2. **Ubiquitous language**: one language per context. "Customer" in Sales is the buyer, in Shipping the receiver; "Product" in Catalog is the display item, in Inventory the SKU in stock. Two different meanings = two contexts.
3. **Context mapping**: determine the relationship — customer-supplier, conformist, or anti-corruption layer. Avoid shared kernel (reeks of coupling again); use it only when both sides keep a strict contract.

### Cross-service data access
- Reads: **API composition** (merge results at the application layer) or a **CQRS read model** (build a separate read table, updated by events). No cross-service SQL joins.
- Writes: never update another service's table; publish an event so that service updates its own data.
- Static reference data (country tables, catalogs): replicate it in, or extract it into a reference service — but with a single source of truth.

### Production pitfalls
- Splitting too thin: 30 services, every request composed across 10 hops ⇒ latency multiplied, hard to debug. A wrong boundary hurts even more than a monolith.
- "We just promise not to touch each other's DB" — an agreement that cannot be enforced. Enforce it with contract tests, or at minimum check audit logs / connection-pool metrics to see which service connects to whose DB.

> Senior tip: the biggest red flag is "2 services always deploy together" — in that case they are one service; merge them instead of pretending to split.`,
    follow: [`If two bounded contexts both need customer data, do you pick shared kernel or an anti-corruption layer? Why?`, `How do API composition and a CQRS read model differ, and which costs more?`, `How do you detect a service quietly querying another service's DB in production?`]
  },
  'microservices-003': {
    q: `When integrating with 20 other services, do you choose synchronous REST/gRPC or asynchronous messaging? Compare along three kinds of coupling: time, availability, and data.`,
    a: `**Summary:** synchronous fits **queries / need the result now** (low latency, easy to debug); asynchronous fits **events / failure paths that must survive the other side dying**. The real question is not "REST or Kafka" but "who needs the result immediately and who can accept waiting?".

### Three kinds of coupling
| | Synchronous (REST/gRPC) | Asynchronous (queue/topic) |
|---|---|---|
| **Time** | the caller waits; both processes must run at the same time | the two sides are decoupled in time, a buffer absorbs spikes |
| **Availability** | A dies, B fails along (accidentally creating tight coupling) | A dies, messages stay in the broker, B processes them when it recovers |
| **Data/form** | returns exactly the schema you asked for | only already-published events are shared, each side interprets them itself |

- **Availability coupling** is the scariest one: 20 services in a synchronous chain A→B→C→D means the success probability = the product of every link's probability. The more hops, the more fragile.
- **Data coupling**: REST returns exactly the fields you need (tight, contracts must stay in sync); an event is only a fact that happened, subscribers add their own logic.

### REST or gRPC for synchronous calls
- **REST/JSON**: readable, testable with curl, it is the HTTP standard, fits edge/public APIs.
- **gRPC**: binary protobuf, HTTP/2 multiplexing, payloads several times smaller, typed codegen from {{.proto}}, streaming support — fits internal service-to-service. Limitations: cannot be called directly from a regular browser (needs grpc-web/Envoy), hard to debug by eye, schema changes must follow protobuf's backward-compatible rules (never reuse a field number, never change a field type).
- In Spring Boot 3 there is {{grpc-spring-boot-starter}} (net.devh or LogNet) or the official Spring gRPC project; on Kubernetes, Envoy/Istio usually handles the protocol translation.

### When asynchronous
- Side-effect reactions (send an email, write an audit record, invalidate a cache) — the caller does not need the result.
- Long-running business (an order takes 30s to process) — return 202 Accepted + a status to poll.
- Several consumers handle one event, or you need to keep events for replay.

### Common traps
- **Using a queue as RPC**: push the request into a queue and wait on a reply topic — you just built distributed RPC with double the latency and complexity.
- **Long event chains**: order.created → payment.started → ... nobody sees the big picture and events loop back into cycles. If 3 services must keep "talking" to complete one step, consider orchestration.
- Asynchronous = **eventual consistency**: the UI must show "processing"; never assume a successful write is immediately visible.

> Senior tip: synchronous always needs a timeout (under 1 second for internal calls); asynchronous always needs idempotency + an ordering strategy. Missing either one and you are not done.`,
    follow: [`If you pick gRPC, how do you handle contract versioning between client and server?`, `When does an asynchronous system still need to return a synchronous response to the user?`, `How do you set timeouts for a chain A calls B calls C so the budget is not swallowed whole?`]
  },
  'microservices-004': {
    q: `One business operation must write data in 3 different services. Why not use 2PC? How do you design a Saga with choreography and with orchestration, and how does compensation handle failures?`,
    a: `**Summary:** 2PC (two-phase commit) makes every participant hold locks and wait for the coordinator — in a distributed environment with partitions we **trade availability for consistency**; the performance cost and the risk of stuck locks are far too high for online workloads. Use a **Saga** instead: a chain of local transactions, each step having a compensation to back out.

### How 2PC works and where it breaks
~~~text
Coordinator: PREPARE ──► all participants "freeze" (hold locks, write redo/undo logs)
            ◄── VOTE yes/no
            COMMIT (or fall back to ROLLBACK)
~~~
- Problem 1: **blocking** — a participant hangs indefinitely if the coordinator dies halfway (commit or rollback unknown) ⇒ locks are held ⇒ queues of blocked work pile up, the DB bloats.
- Problem 2: each phase costs at least one round-trip plus an fsync of the log; throughput drops sharply (XA often delivers only a small fraction of a local transaction's throughput).
- Problem 3: CAP — during a network partition you are either unavailable or inconsistent; online payment systems choose availability, so 2PC across regions is out.

### Saga: 10 steps, 10 local transactions
~~~text
ReserveStock ─► ChargePayment ─► CreateShipment ─► SendInvoice
     │ fail          │ fail            │ fail
     ▼               ▼                 ▼
 ReleaseStock ◄── RefundPayment ◄── CancelShipment   (compensation)
~~~
Each step: **read state → validate → write a local tx → publish an event/command**. If step N fails unrecoverably, run compensations from N-1 back to 0.

### Choreography vs Orchestration
| | Choreography (events) | Orchestration (saga center) |
|---|---|---|
| Coordination | none; every service reacts on its own | one orchestrator commands each step |
| Coupling | adding a service only adds a consumer | the orchestrator knows every step (grows over time) |
| Observability | the flow is hard to see, you need tracing | each step's state is visible immediately |
| SPOF | none | the orchestrator must be HA (state in DB/Redis) |
| Fits | ≤ 3–4 services, short flows, same team | long flows, many steps, cross-team, centralized timeout/retry needed |

Java tooling: choreography uses Kafka/Spring Cloud Stream listeners; orchestration uses Camunda/Flowable, Temporal (Java SDK), or Spring StateMachine plus a saga state table.

### Compensation — the part everyone underestimates
- **It is not a rollback**: a business fact already happened (money was debited) and must be offset by a business action (refund, an apology voucher), often needing a human approval.
- Compensation itself can fail ⇒ it must be **idempotent + retry + DLQ + alerting for manual handling**.
- Missing **isolation**: two sagas both read "quantity remaining: 1" and both reserve ⇒ you need semantic locking (mark as reserved instead of subtracting immediately), reservations with TTL, or a pivot transaction (a mid-flow step — once it succeeds, treat the whole saga as "committed").

> Senior tip: always store the **saga log** (the state of each step) in the same DB as the orchestrator, so after a crash you know exactly which step you were in. No log = nobody dares to restart.`,
    follow: [`A saga has no isolation — how do you concretely prevent overselling in code?`, `When would you choose choreography over orchestration even with 4 services in the flow?`, `How do Temporal/Camunda differ from hand-rolling an orchestrator with Spring?`]
  },
  'microservices-005': {
    q: `Your application writes to the database and publishes an event to Kafka at the same time. Why is this the dual-write problem? How do you solve it with Transactional Outbox + CDC (Debezium)?`,
    a: `**Summary:** writing to the DB and then publishing the event (or the other way around) is **two transactions over two resources with no shared atomicity** — a crash in between loses the event or creates a "phantom" event. Solution: write the business row **and** the event record into an outbox table **in the same transaction**, then a separate process (relay/CDC) reads the outbox and pushes to the broker.

### How dual-write loses data
~~~text
Wrong way A:  db.commit()  ──► crash ──► the event is NEVER sent
Wrong way B:  publish ok   ──► tx.rollback() ──► phantom event: no order exists yet "created" was announced
~~~
No transaction manager coordinates a DB and Kafka (and nobody wants XA with a broker). And {{@TransactionalEventListener(AFTER_COMMIT)}} still breaks: the commit goes through, the process dies before publishing — the event is lost forever and no log line tells you.

### Outbox step by step
~~~java
@Transactional
public void placeOrder(OrderCmd cmd) {
    Order agg = Order.create(cmd);
    orderRepo.save(agg);                       // one transaction with the outbox
    outboxRepo.save(OutboxEvent.of(agg.getId(), // aggregateId => use it as the Kafka key
        "order.created", mapper.writeValueAsString(agg)));
}
~~~
- **One transaction**: either both writes happen or neither — no more middle ground.
- The publisher reads the outbox, sends to Kafka, then marks it sent. Two styles:
  - **Polling**: {{@Scheduled}} reads the table with {{SELECT ... FOR UPDATE SKIP LOCKED}} — simple, ~100ms–1s latency, adds load to the DB.
  - **CDC (Debezium)**: reads the Postgres WAL/replication slot (or the MySQL binlog) ⇒ no extra query load, ~ms latency, no domain code changes. Debezium's outbox event router turns the row into an event with the envelope {{aggregateType/aggregateId/payload}} and **sets the Kafka key = aggregateId automatically** to keep ordering per aggregate.

### Architecture
~~~text
App ─► [orders DB] ─(logical replication)─► Debezium (Kafka Connect)
                                │                 │
                                ▼                 ▼
                          business row      topic: order.created
                                                    │
                                              consumer (idempotent)
~~~

### Production pitfalls
- The outbox bloats: you need a job cleaning sent rows (keep 7–30 days) and tombstone filtering when deleting rows.
- It is still **at-least-once**: Debezium crashing halfway re-sends ⇒ the consumer must be idempotent, no way around it.
- Ordering: partition by {{aggregateId}} so every event of one order lands in the same partition.
- "Just publish, do not save" is forbidden in code review — it is an architecture violation; block it with an integration test.

> Senior tip: using CDC for the outbox is normal, but it adds one more component (a Kafka Connect cluster) that must be monitored like a real service — connector lag is business lag.`,
    follow: [`Are the outbox and the event table in the domain model the same thing, and which schema should they live in?`, `Debezium publishes to the broker while the broker is down — how do you proceed?`, `How does polling the outbox with SKIP LOCKED behave when multiple app instances run?`]
  },
  'microservices-006': {
    q: `How do you achieve "efficient exactly-once" when a consumer crashes halfway? Explain client-side idempotency keys, consumer-side dedup, and why exactly-once end-to-end is impossible.`,
    a: `**Summary:** exactly-once over a network is impossible (a variant of the two-generals problem: you cannot distinguish "lost" from "slow"). What we actually build is **at-least-once + an idempotent consumer = exactly-once effect**: a message may arrive twice but its effect happens once.

### The three semantics
| Semantics | How you achieve it | Consequence |
|---|---|---|
| At-most-once | process immediately on receipt, never retry | messages lost on failure |
| At-least-once | retry until acknowledged | **duplicates** — the Kafka/RabbitMQ default |
| Exactly-once (end-to-end) | the broker alone cannot deliver it | idempotency needed at both ends |

Kafka has "exactly-once" **within the broker's scope**: an idempotent producer ({{enable.idempotence=true}} avoids loops caused by retries within a session) + a transactional producer (committing offsets together with messages in one transaction) + a consumer with {{isolation.level=read_committed}}. But if the side effect is outside Kafka (a DB write, an HTTP call), it knows nothing — the loop still closes in the application.

### 1) The client-side idempotency key
The client generates a UUID and sends it in the {{Idempotency-Key}} header; the server stores key + response (unique key):

~~~java
@Transactional
public Receipt charge(String key, ChargeCmd cmd) {
    // unique constraint in the DB: 2 requests with the same key => exception => return the stored response
    if (cache.contains(key)) return cache.response(key);
    Receipt r = payments.charge(cmd);           // side effect
    cache.save(key, r);                         // committed in the same transaction if DB-backed
    return r;
}
~~~
- Store it **along with the response** so duplicates return the old result (HTTP 200/409 by convention) without re-running the side effect.
- Constraints: the key is **scoped per endpoint + customer**, has a TTL (e.g. 24h); the same key with a different payload ⇒ return 422 (do not silently proceed).
- POST is not idempotent by spec, PUT/DELETE are — but in a distributed system you should still key every command that creates money.

### 2) The idempotent consumer — the "exactly-once effect"
- **Dedup by message id**: a {{processed_msg(msg_id PK)}} table; insert before processing, a conflict ⇒ skip. Run it **in the same transaction** as the business write, otherwise a crash between the two steps still duplicates.
- **Natural-key upsert**: when the business defines the uniqueness you do not need a dedup table:
~~~sql
INSERT INTO ledger(order_id, amount) VALUES (:id, :amt)
ON CONFLICT (order_id) DO NOTHING;   -- MySQL: ON DUPLICATE KEY UPDATE id=id
~~~
- "Already processed" must be a **business behavior**, not just a technical flag: return the same old result (the true spirit of idempotency).

### 3) Traps
- Retrying **at multiple layers** at once (client + framework + broker) ⇒ x3 the copies, the dedup table bloats.
- An asymmetric consumer: the side effect is outside the DB (a third-party API call) while the dedup flag commits afterwards ⇒ a crash in between = a real duplicate charge.
- A dedup TTL too short compared with the broker's worst-case delay (a message can circle for an hour) ⇒ duplicates come back.

> Senior tip: metric = the number of duplicate records / "duplicate suppressed" per minute. This number is never 0 in a healthy system; being 0 means you never enabled retry, not that you achieved exactly-once.`,
    follow: [`Should the idempotency key live in Redis or in the DB, and why?`, `If the side effect is a third-party REST call that supports no idempotency, what do you do?`, `Commit offsets before or after processing? What does each choice trade?`]
  },
  'microservices-007': {
    q: `How do you configure resilience for a service that calls 10 downstreams with Resilience4j (Spring Boot 3)? The order of applying timeout, retry, circuit breaker, bulkhead, fallback — and why.`,
    a: `**Summary:** an unmovable rule — **every network call has a timeout**; retries only for idempotent operations, with jitter and a bounded number of attempts; a circuit breaker **fails fast** once a dependency has gone weak; a bulkhead keeps one dead dependency from dragging down the whole thread pool.

### Order and reasoning
~~~text
caller → [bulkhead] → [retry] → [circuit breaker] → [timeout] → downstream
~~~
> Note: with annotations, Resilience4j has its own default aspect order: Retry ( CircuitBreaker ( RateLimiter ( TimeLimiter ( Bulkhead ( call ) ) ) ) ) — change it via properties like {{circuitBreakerAspectOrder}}, {{retryAspectOrder}}... or use the functional API (Decorators).
- **Timeout innermost, applied per attempt** (never wait unbounded). Resilience4j does not time out ordinary calls by itself — combine {{@TimeLimiter}} (async) or the HTTP client timeout (Spring Boot 3 RestClient/WebClient).
- **Retry sits outside the circuit breaker**: every repeat is counted by the breaker; and while the breaker is OPEN, retry receives {{CallNotPermittedException}} — configure retry to skip that exception so you do not kick the dying service again.
- **Bulkhead** prevents 10 callers from consuming every thread: semaphore (light, caps concurrent calls) or thread pool (full isolation, plus queuing latency).
- **Fallback** runs last: a stale cache, a default value, answer "processing" — the fallback **itself must not make network calls** (unless it has its own timeout).

~~~java
@Service
class PaymentClient {
    @CircuitBreaker(name = "paymentApi", fallbackMethod = "fallback")
    @Bulkhead(name = "paymentApi")
    public Receipt charge(ChargeCmd cmd) {
        return rest.postForObject("/charges", cmd, Receipt.class); // RestTemplate, HTTP client timeout 800ms
    }
    private Receipt fallback(ChargeCmd cmd, Throwable t) {   // Throwable param => wired automatically by resilience4j
        return Receipt.pending(cmd.orderId());              // degrade, do NOT call any other API
    }
}
~~~

~~~yaml
resilience4j:
  circuitbreaker:
    instances:
      paymentApi:
        slidingWindowSize: 100          # window of the last 100 calls (count-based)
        slowCallDurationThreshold: 2s   # calls slower than 2s count as failures too
        slowCallRateThreshold: 50
        failureRateThreshold: 50        # open the circuit above 50% failures
        waitDurationInOpenState: 30s    # rest 30s then allow retries
        permittedNumberOfCallsInHalfOpenState: 10
  retry:
    instances:
      paymentApi:
        maxAttempts: 3
        waitDuration: 200ms
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2
        enableRandomizedWait: true      # jitter - keep clients from waking in lockstep
        randomizedWaitFactor: 0.5
  bulkhead:
    instances:
      paymentApi:
        maxConcurrentCalls: 25          # <= ~1/4 of the service's request threads
~~~

### Configuration rules
- **Timeout < the request's overall deadline**: if the whole request gets 5s and a single call gets 5s, the budget is meaningless.
- Retry: only retry **transient** errors (connect, 503, timeout) — never retry 400/401 (your own fault; retrying just adds load).
- **A fallback must not hide the incident**: still record metrics/logs for the exception; if the fallback rate > 5%, that is an alarm, not "acceptable".
- The bulkhead is bounded by available threads, not by desired throughput.

> Senior tip: run fault-injection experiments (chaos test: kill 1 pod, cut the network) before production. A resilience config reads well but nobody trusts it until you have seen it save the cluster once.`,
    follow: [`Should retry sit outside or inside the circuit breaker? How do you defend your choice?`, `When does a semaphore bulkhead differ from a thread pool, and what are each one's drawbacks?`, `What risks does a stale-cache fallback carry with financial data?`]
  },
  'microservices-008': {
    q: `Last night one dependency slowed down, every service timed out and the cluster died with it. What does that retry storm/cascading failure look like? How do you prevent it?`,
    a: `**Summary:** **retry amplification** — every client retrying 3 times hands the dependency 4× the load; add wrong jitter (synchronized retries) and overly long timeouts (stuck threads) ⇒ the upstream's **thread pool drains**, and innocent services die although nothing is wrong with them. It is the number-one cause of spreading outages.

### The incident, step by step
~~~text
1. Dependency B gets slow (GC pause, DB lock) ⇒ response time goes 2s → 20s
2. A has a 30s timeout (way too long) + 3 retries ⇒ each request holds a thread for 90s
3. A's thread pool of 200 is stuck ⇒ new requests queue up ⇒ A "dies" although it has capacity
4. C, D call A with the same pattern ⇒ it spreads across the whole cluster (cascading failure)
5. Health checks get slow ⇒ the orchestrator restarts everything ⇒ restart storm, in-flight state lost
~~~

### Prevention
1. **Short timeout + overall deadline**: total retry time must fit within the request's deadline budget. Past the deadline, **do not retry** — it only eats the resources of whoever comes after you.
2. **Jitter is mandatory**: delay = random(0, min(cap, base × 2^attempt)). No jitter = synchronized retries (thundering herd) landing exactly when B has just recovered, and it falls over again.
3. **Retry budget**: only allow retries to account for ~10% of normal traffic (Envoy, AWS SDKs all do this). Retries must never exceed the original traffic.
4. **Circuit breaker**: open when the failure rate is high ⇒ fail fast for 30s instead of holding threads waiting.
5. **Bulkhead + client-side timeout**: one compartment per downstream, no shared threads.
6. **Backpressure toward the client**: return 429/503 with {{Retry-After}} so distributed callers slow themselves down, instead of accepting everything and queueing internally without bound.
7. **Never retry non-idempotent operations**; if you must retry, go with an idempotency key.
8. **Adaptive concurrency** (AIMD / AWS SDK client-side limiting): lower the concurrent-call limit as errors rise, like TCP congestion control.

### Detect it before the crash
- Metrics: {{retries_total}}, {{timeout_total}}, {{thread_pool_active}} / {{max}}, queue depth, p99 latency per dependency (not overall).
- Traces: one parent span with 4 identical child spans is a retry signature; unusual fan-out is an early cascade.
- Alarm on **symptoms** (error rate, p99 latency), not only on causes (CPU).

> Senior tip: the golden oncall rule — "when a service gets slow, shed its load; do not add retries". Retry is a sedative for developers and a poison for the system.`,
    follow: [`How do you compute the retry budget concretely in your code?`, `Why is a too-long timeout more dangerous than a too-short one?`, `How do you tell a retry storm apart from genuinely rising traffic in your dashboard?`]
  },
  'microservices-009': {
    q: `Explain how Kafka guarantees ordering within a partition, the consumer group mechanism, offset commits and rebalancing. Then cover delivery semantics and handling a poison pill with a DLQ.`,
    a: `**Summary:** Kafka is a **segmented distributed log**: ordering is only guaranteed **within one partition**, and each partition belongs to exactly one consumer in a group. At-least-once is the default (commit the offset after processing); exactly-once end-to-end still needs an idempotent consumer; a poison pill must be routed to a **DLQ** so it does not wedge the partition.

### Partition & ordering
- The producer hashes the key then picks a partition: {{toPositive(murmur2(key)) % numPartitions}} — same key ⇒ same partition ⇒ **ordering per key** (e.g. the same order_id).
- Increasing the partition count ⇒ the key→partition mapping changes, events of the same order may fall into a different partition ⇒ ordering for existing consumers is gone. To change it you need a strategy (a stable hash ring, or accept a move to a new key).
- Retries/reconnects can send out of order ⇒ enable {{enable.idempotence=true}} (producer sequence numbers) and {{max.in.flight.requests.per.connection ≤ 5}} with {{acks=all}} to keep ordering while staying fast.
- Across partitions there is **no ordering** — if you need global ordering, that partition is your bottleneck.

### Consumer group & rebalancing
- A group = consumers that divide the partitions among themselves: 8 partitions, 10 consumers ⇒ 8 working, 2 idle; 8 partitions, 4 consumers ⇒ 2 partitions each.
- The coordinator (the broker holding the group) tracks heartbeats; when a consumer dies or **exceeds {{max.poll.interval.ms}}** (processing takes too long between two polls) ⇒ it is removed from the group ⇒ **rebalance**.
- Eager rebalance: every consumer **releases all** partitions and they get redivided ⇒ processing pauses for a few seconds. **Cooperative-sticky** ({{partition.assignment.strategy=org.apache.kafka.clients.consumer.CooperativeStickyAssignor}}): only the partitions that must move actually move, reducing the pause.
- **Static membership** ({{group.instance.id}}): a pod that restarts and rejoins within {{session.timeout.ms}} does not trigger a rebalance — deploys stop replaying the "partitions reassigned" saga.

### Offset commits & semantics
- **Auto-commit** (the Kafka client default, every 5s) commits, while inside {{poll()}}, the offsets of the previously polled batch: processing synchronously within the poll loop is still at-least-once, but if you push messages to another thread for processing and then crash ⇒ **messages are lost**. Spring Kafka disables auto-commit by default and commits itself according to the AckMode (BATCH).
- Standard at-least-once: finish the side effect **then** {{commitSync()}}; a crash between the two steps ⇒ reprocessing ⇒ idempotency needed.
- Exactly-once inside Kafka: a transactional producer bundles "write data + commit offset" into one transaction, consumers read {{read_committed}} — but only within Kafka; side effects outside the broker still must be idempotent.

### Poison pill & DLQ
A broken message (bad data, a code bug) ⇒ processing fails forever ⇒ the offset never advances ⇒ **one partition is permanently stuck**. Spring Kafka handles it cleanly:

~~~java
var recoverer = new DeadLetterPublishingRecoverer(template,
    (rec, ex) -> new TopicPartition(rec.topic() + ".DLQ", rec.partition()));
var handler = new DefaultErrorHandler(recoverer, new FixedBackOff(1_000L, 3L)); // 3 attempts then DLQ
containerFactory.setCommonErrorHandler(handler);
~~~
- DLQ messages keep their original headers (cause, offset, exception) for replay after the fix.
- **Alert on DLQ depth** — that is business in limbo, not harmless garbage.
- After the fix, replay: read the DLQ and push back onto the original topic (still idempotent).

### Pitfall
- Using a timestamp or a random value as the key ⇒ business ordering lost.
- Long processing in the listener without raising {{max.poll.interval.ms}} ⇒ declared dead, an undeserved rebalance.
- Growing the partition count while consumers hold the old assignment.

> Senior tip: monitor **consumer lag** (highest offset − processed offset) as Kafka's number-one metric — rising lag is the first sign of both slow processing and logic bugs.`,
    follow: [`Why is increasing the partition count an ordering-breaking operation? How do you handle it?`, `When is committing the offset before processing the right choice?`, `Compare eager and cooperative rebalancing during a rolling deploy.`]
  },
  'microservices-010': {
    q: `Compare Kafka, RabbitMQ, and SQS/SNS. What do you choose for: (a) an event stream that needs replay, (b) a simple work queue on AWS, (c) pub/sub fan-out to many subscribers?`,
    a: `**Summary:** **Kafka** is a segmented, retained log built for **replay/analytics**; **RabbitMQ** is a smart broker with per-message routing and acknowledgement; **SQS/SNS** are managed AWS services — no servers to run, pay per use. Choose by requirement, not by hype.

### Quick table
| | Kafka | RabbitMQ | SQS / SNS |
|---|---|---|---|
| Model | append-only log, consumers pull by offset | queue/exchange, broker push + ACK | managed queue (SQS), pub/sub fan-out (SNS) |
| Retention | by time/size (7 days...) | until ACK (or TTL) | up to 14 days (SQS) |
| Replay | **yes** — reset the offset and re-read from the start | not with a regular queue (once ACKed it is done); RabbitMQ Streams 3.9+ does support it | no |
| Ordering | per partition/key | per queue (lost with multiple consumers/requeue) | FIFO queue: per message group |
| Throughput | very high (hundreds of MB/s) | medium, routing per message | very large, managed |
| Ops cost | **high** (cluster, monitoring, upgrades) | medium | close to zero |
| Standout features | stream processing (Kafka Streams), connect | exchange/binding, TTL, DLX, priority | SNS fan-out, FIFO, EventBridge filtering |

### The three scenarios answered
- **(a) Event stream that needs replay / analytics**: **Kafka**. You hit a bug and had to re-read 3 days of events? Only Kafka lets you reset the offset. Event sourcing, CDC (Debezium), real-time aggregation all run on Kafka. Ops note: from Kafka 4.0 it runs on **KRaft**, no more ZooKeeper, one less component to operate.
- **(b) Simple job queue on AWS**: **SQS** — poll, autoscale the workers, visibility timeout (a message "hides" while being processed and reappears if never deleted ⇒ free retry), change concurrency without touching anyone else. Use a FIFO queue when ordering per message group is a hard requirement.
- **(c) Fan-out to many subscribers**: **SNS → many SQS** (one queue per subscriber, fully isolated) or **EventBridge** when you need filtering by event pattern/schema. One event must reach 5 services ⇒ SNS is the shortest path.

### When RabbitMQ wins
- Complex routing at the broker: direct/topic/fanout exchanges, bindings by pattern — subscribers do not each filter on their own.
- You need priority queues, per-message TTL, RPC patterns (reply-to), AMQP/MQTT (IoT).
- Moderate scale, you want low delivery latency, and replay is not needed.

### Traps
- Using Kafka as a queue "just for low latency": true, but you are paying for retention/streaming you never use.
- SNS+SQS → a subscriber's queue fills up ⇒ nobody owns the problem; you still need DLQs (redrive policy) + alarms.
- RabbitMQ partition/network issues: quorum queues (instead of classic mirrored queues) to survive a node death without losing data.

> Senior tip: an experienced AWS team uses SQS/SNS for the menial work and Kafka (MSK/Confluent) when a real event-streaming need exists. Do not pick Kafka "because we will need analytics someday" — the ops cost arrives now, the benefit arrives later.`,
    follow: [`Kafka retains messages for 7 days; if you need 90 days, what do you do?`, `How does the SQS visibility timeout handle a worker dying halfway?`, `When should you add EventBridge on top of SNS instead of using SNS alone?`]
  },
});
