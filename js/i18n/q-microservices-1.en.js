/*
 * English translation of js/data/q-microservices.js — task T190, retranslated in T534. Format: js/core/i18n.js (content overlay).
 * ids: microservices-001 microservices-002 microservices-003 microservices-004 microservices-005 microservices-006 microservices-007 microservices-008 microservices-009 microservices-010
 */
App.i18n.content({
  'microservices-001': {
    q: `Team of 5 people, an unstable domain, a 3-month deadline. Would you advise a monolith, a modular monolith, or microservices? List the situations where you would advise AGAINST splitting services.`,
    a: `**Summary:** with an unstable domain, a 5-person team and a 3-month deadline, I advise starting with a **modular monolith**: one application, one deploy, but the code is split into modules with clear boundaries. Only split into microservices when there is **real evidence**: a module needs to scale independently, needs a different resource profile, or teams start blocking each other's release schedules.

### Quick intuition
Picture a small 5-person restaurant. A classic monolith is like one kitchen with no separate areas: everyone touches everything, and after a while knives and cutting boards are all mixed up. A modular monolith is **one kitchen but with clearly separated zones**: prep area, cooking area, drinks area, each with its own shelves and only "handing things over" through a shared counter. Microservices are **opening 5 kitchens in 5 locations**: each kitchen is freer, but you need delivery vans, phones between them and separate books for each kitchen. With 5 people and a menu that changes every week, opening 5 kitchens is just making life hard for yourself.

### Glossary
- **Monolith**: the whole application is built into one artifact (one jar file) and runs in one process.
- **Modular monolith**: still one artifact, but the code is split into business modules, and modules only call each other through public APIs.
- **Bounded context**: a business area in which every concept has exactly one meaning (a DDD concept).
- **Release cadence**: the release rhythm, for example team A wants to deploy every day while team B deploys monthly.
- **Observability**: the ability to look into the system through logs, metrics and tracing to know what is happening.
- **ArchUnit**: a Java library for writing unit tests that check architecture rules (which package may depend on which).
- **Saga / outbox**: patterns for handling transactions across several services; you only need them once the DB is split.

### Quick comparison
| Criterion | Classic monolith | Modular monolith | Microservices |
|---|---|---|---|
| Operational cost | lowest | low | high: pipeline, deploy, network, monitoring per service |
| Boundary | vague, drifts over time | enforced by packages + architecture tests | enforced by API contract + separate schema |
| Scaling | the whole application | the whole application | per service |
| Transactions | ACID out of the box | ACID out of the box | you handle saga/outbox/compensation yourself |
| Team deploy independence | low | medium | high |

### Why microservices are expensive (step by step)
1. **Every service needs its own CI/CD pipeline**: build, test, image, deploy, rollback. Why: the "deploy independently" benefit only exists when the pipelines are independent.
2. **A function call becomes a network call**: one {{orderService.create()}} is now an HTTP call that can time out, fail partially and need retries. Why: the network is never 100% reliable.
3. **You lose the shared ACID transaction**: writing the order and deducting stock live in 2 different DBs, so you need a saga. Why: a single DB transaction cannot span two independent databases without 2PC.
4. **You must have observability**: one request goes through 4 services — where did it fail? You need distributed tracing and centralized logs. Why: there is no longer a single stack trace.

~~~text
Team of 5, 8 services:
  8 pipelines + 8 dashboards + 8 on-call runbooks
  => ~0.6 people per service => most of the time goes to infra, not to building features
~~~

### When NOT to split
- **The domain is still changing**: every model change also means contract changes + migrations for 2 DBs. The cost of splitting outweighs the benefit; wait until the boundary "has not changed for several months in a row".
- **Team below ~8–10 people**: a 5-person team carrying 8 services spends most of its time on infra instead of the product.
- **No CI/CD, containers or observability yet**: splitting services without a deploy/rollback pipeline, tracing and centralized logging only increases downtime.
- **The business needs strong transactions across entities**: a monolith gives you ACID for free; splitting means you take on saga, outbox and idempotency yourself.
- **No product-market fit yet**: change cost matters more than scale cost.

### Signs you ARE ready to split
- A module always changes independently and drags the whole system into every deploy.
- The module needs a different resource/profile (large memory, GPU, high blast radius such as payments).
- Two teams fight over release schedules, or one team blocks another team's release.
- Already in place: infrastructure as code, blue-green deploy, distributed tracing, centralized logs.

### A realistic modular monolith
Split packages by bounded context, let modules depend only through public interfaces, and forbid touching another module's tables. Enforce it with ArchUnit in CI:

~~~java
@AnalyzeClasses(packages = "com.shop")
class ArchitectureTest {
    @ArchTest
    static final ArchRule order_must_not_use_payment_internals =
        noClasses().that().resideInAPackage("..order..")
            // payment may only be called through the public api package
            .should().dependOnClassesThat().resideInAPackage("..payment.internal..");
}
~~~

Each module has its own schema inside one shared DB instance. When you later split into services, you migrate exactly that schema to a new DB; the code mostly just changes the connection and adds an API layer. Spring also has the **Spring Modulith** project, which supports exactly this model (module verification, events between modules).

### Common mistakes
1. **Splitting early by technical layer** (user-service, notification-service, db-service). Symptom: every feature requires changing 3–4 services at once. How to avoid: split by business (bounded context), not by layer.
2. **A modular monolith only on paper**. Symptom: the order module still JOINs the payment table directly, so the day you try to split you cannot. How to avoid: ArchUnit rules running in CI + one schema per module.
3. **A distributed monolith**. Symptom: 5 services that always have to be deployed together. How to avoid: if 2 services always change together, merge them.

### One-minute spoken answer
"With a 5-person team, a domain that is still changing and a 3-month deadline, I choose a modular monolith. That means one application and one deploy pipeline, but the code is split into modules by bounded context, modules only call each other through public APIs, each module has its own schema, and I enforce it with ArchUnit in CI. The reason: microservices turn function calls into network calls, lose the shared ACID transaction, and every service needs its own pipeline, dashboard and on-call; for 5 people that costs more than it returns. I only split when there is evidence: a module needs to scale on its own, needs different resources, or teams block each other's releases. My experience is that splitting late with the right boundary is far easier than splitting early and having to merge again."

> Senior tip: the real cost of microservices is not in the code but in ops: every service adds a dashboard, a pipeline and an on-call runbook. Split by real pain, not by CV.`,
    follow: [`If you are forced to split one module out early, which module do you pick and by what criteria?`, `How does a modular monolith differ from SOA (ESB) in terms of centralization?`, `How do you use ArchUnit/JPMS to enforce module boundaries in CI?`]
  },
  'microservices-002': {
    q: `Two teams share one database schema to avoid calling each other's APIs. Explain why this is risky and how you use DDD to determine the service boundary.`,
    a: `**Summary:** **database-per-service** is not about saving network calls but about keeping **independence**: each service owns its own data, and other services only read/write indirectly through APIs or events. Sharing one schema is hidden coupling: one team's column change takes the other team down. The right boundary in DDD is the **bounded context**: the area where each business term has exactly one meaning.

### Quick intuition
Two families sharing one fridge for convenience. Fine at first — until family A cleans the fridge and throws away the "old box" that was actually family B's food. Nobody announced it because "the fridge is shared". Database-per-service is one fridge per family: if you want something, you **knock on the door and ask** (API), or the other side **notifies you** "I just went shopping" (event). A bit more work, but nobody accidentally ruins someone else's food.

### Glossary
- **Database-per-service**: each service has its own DB/schema, and only that service connects to it directly.
- **Distributed monolith**: a system split into many services that are still so tightly coupled they must be deployed together.
- **Bounded context**: a business boundary in DDD inside which every word has a single meaning.
- **Ubiquitous language**: the shared vocabulary that developers and the business use inside one context.
- **Event storming**: a workshop where you stick notes for domain events on a wall to discover the business.
- **Anti-corruption layer (ACL)**: a layer that translates another system's model into your own, preventing concept "pollution".
- **CQRS read model**: a read-only table rebuilt from events coming out of several services.
- **Blast radius**: the scope of impact when one component fails.

### Why sharing a DB is hidden coupling
1. **The schema is a contract nobody signed**: team B renames a column, splits a table or changes a type; team A does not know, so it fails at runtime. Why it is dangerous: no compile error warns you, only runtime errors in production.
2. **Cross-service joins**: the code is compact, sure, but the two deployments must keep their schemas in sync at all times. Why: you have just rebuilt a distributed monolith at the data layer.
3. **Scaling becomes meaningless**: two services on one DB instance means the bottleneck is still that DB. Why: you split the app but not the storage, so reads/writes still pile up in one place.
4. **Shared blast radius**: one naive full-scan query from service A slows the shared DB, and service B dies along with it. Why: the DB's CPU, IO, connections and locks are shared resources.

~~~text
Order Service                   Payment Service
+------------------+            +------------------+
| orders (schema)  |  REST/evt  | payments (schema)|
+------------------+ <--------> +------------------+
   do not read each other's tables, only exchange data via API/event
~~~

### Finding boundaries with DDD
1. **Event storming** with the business people: draw the domain events (OrderPlaced, PaymentCaptured, ItemShipped), then group the related commands/events into one context. Why: events reflect what really happens and are less biased by the current table design.
2. **Ubiquitous language**: one language per context. "Customer" in Sales is the person placing the order, in Shipping it is the receiver; "Product" in Catalog is the display item, in Inventory it is the SKU in stock. Why: one word with two different meanings is a sign of two contexts.
3. **Context mapping**: determine the relationship between contexts: customer-supplier, conformist, or anti-corruption layer. Avoid a shared kernel (a shared model) because it recreates coupling; use it only when both sides keep a strict contract.

### Cross-service data access
- **Reads**: **API composition** (merge results at the application layer) or a **CQRS read model** (build a separate read table updated by events). No cross-service SQL joins.
- **Writes**: never update another service's table; call its API or publish an event so the owning service updates its own data.
- **Static reference data** (countries, catalogs): replicate it in, or extract it into a reference service, but there must be a single source of truth.

### A realistic roadmap to remove the shared DB
1. List which tables each service reads/writes (via code + DB users + audit logs).
2. Assign a single owner to every table.
3. Non-owning services switch to reading through APIs/events; temporarily they may read through a **read-only view**.
4. Give each service its own DB user, revoke rights on tables it does not own, and finally separate the databases completely.

### Common mistakes
1. **Splitting too thin**. Symptom: 30 services, every request composed across 10 hops, latency adds up and debugging is painful. How to avoid: boundaries by business, not by table; a wrong boundary hurts even more than a monolith.
2. **"We promise not to touch each other's DB"**. Symptom: a few months later somebody queries it behind your back. How to avoid: one DB user per service with rights only on its own schema; check connection metrics/audit logs.
3. **Changing the schema directly while someone still shares it**. Symptom: another service fails right after the migration. How to avoid: expand–contract (add the new column first, remove the old one after nobody reads it).

### One-minute spoken answer
"Sharing one schema between two teams is hidden coupling: the schema becomes a contract that nobody versions or tests, so changing one column breaks the other team at runtime; the two services also cannot scale independently and share the DB's blast radius. I apply database-per-service: every table has exactly one owning service, other services read through API composition or a CQRS read model and write through APIs/events. To draw boundaries I use event storming and the ubiquitous language: when the same word such as Customer carries two meanings, that is two bounded contexts. The trade-off is extra latency and eventual consistency. When removing the shared DB I go step by step: assign owners, split DB users, revoke rights, and only then separate the databases."

> Senior tip: the biggest red flag is "2 services always deploy together": in that case they really are one service; merge them instead of pretending to split.`,
    follow: [`If two bounded contexts both need customer data, do you pick shared kernel or an anti-corruption layer? Why?`, `How do API composition and a CQRS read model differ, and which costs more?`, `How do you detect a service quietly querying the DB of another service in production?`]
  },
  'microservices-003': {
    q: `When integrating with 20 other services, do you choose synchronous REST/gRPC or asynchronous messaging? Compare along three kinds of coupling: time, availability, and data.`,
    a: `**Summary:** synchronous (REST/gRPC) fits **queries that need the result now** (low latency, easy to debug); asynchronous (messaging) fits **events and tasks that must survive when the other side is down**. The real question is not "REST or Kafka" but "who needs the result immediately and who can accept waiting?". With 20 services, I keep synchronous calls for short read paths and use events for the rest to reduce availability coupling.

### Quick intuition
A phone call is synchronous communication: you must wait for the other person to pick up, and if they are busy you are stuck too. Sending a message is asynchronous: you send it and go do something else; the other person reads it when free. Want to ask "is this in stock?" so you can answer the customer right away? Call. Want to tell accounting, the warehouse and customer service "the order has shipped"? Post it in a shared group. If you phone 20 people for everything, one person not answering hangs up the whole job.

### Glossary
- **Temporal coupling**: both sides must be running at the same time for communication to succeed.
- **Availability coupling**: service A fails when service B fails.
- **Eventual consistency**: data across services converges after some time instead of matching instantly.
- **gRPC**: an RPC framework using HTTP/2 and Protocol Buffers (a binary format with a schema).
- **Protobuf field number**: the identifier of a field in a .proto file; binary data is stored by this number, not by the field name.
- **Idempotency**: processing the same message several times gives the same result as one processing.
- **202 Accepted**: an HTTP status meaning "request received, will be processed later".

### Three kinds of coupling
| | Synchronous (REST/gRPC) | Asynchronous (queue/topic) |
|---|---|---|
| **Time** | the caller waits; both processes run at the same time | the two sides are decoupled in time; the broker buffers spikes |
| **Availability** | B dies, A fails along | B dies, messages stay in the broker and B processes them when it recovers |
| **Data/format** | returns exactly the schema you asked for, tight contract | only shares already-published events; each side interprets them itself |

1. **Availability coupling is the most dangerous one**. A synchronous chain A→B→C→D has a success probability equal to the **product** of each link's probability. Why: if any single link fails, the whole request fails.
2. **Time coupling** decides how well you absorb spikes: with synchronous calls the whole load hits the downstream immediately; with asynchronous ones the broker holds it and consumers process at their own pace.
3. **Data coupling**: REST returns exactly the fields you need, so both sides must keep the contract in sync; an event only says "what happened", and each subscriber adds its own logic.

~~~text
Each service 99.9% available:
  synchronous chain 1 hop  : 99.9%
  synchronous chain 5 hops : 0.999^5  = 99.5%   (~3.6 hours of failure per month)
  synchronous chain 10 hops: 0.999^10 = 99.0%   (~7.2 hours of failure per month)
~~~

### REST or gRPC for synchronous calls
- **REST/JSON**: readable, easy to test with curl, it is the HTTP standard, fits edge/public APIs.
- **gRPC**: binary protobuf, HTTP/2 multiplexing, noticeably smaller payloads, typed codegen from {{.proto}} files, streaming support; fits internal service-to-service calls. Limitations: browsers cannot call it directly (needs gRPC-Web through a proxy such as Envoy), hard to debug by eye, and schema changes must follow protobuf's backward-compatible rules (never reuse a field number, never change a field type).
- With Spring Boot 3 there are community starters ({{net.devh}} grpc-spring-boot-starter, LogNet) and the official **Spring gRPC** project; on Kubernetes people usually use Envoy/Istio to load balance gRPC per request (because HTTP/2 keeps connections long-lived, an L4 load balancer would pile traffic onto a single pod).

### When to choose asynchronous
1. **Side tasks** (send an email, write an audit record, invalidate a cache): the caller does not need the result.
2. **Long-running business** (an order takes 30 seconds to process): return 202 Accepted + an id so the client can poll status or receive a webhook.
3. **Several consumers care about one event**, or you need to keep events for replay.

### Common mistakes
1. **Using a queue as RPC**. Symptom: push the request into a queue and wait on a reply topic — latency and complexity double. How to avoid: if you need the result now, call synchronously with a timeout.
2. **Long event chains nobody can see**. Symptom: order.created → payment.started → … events loop back and nobody knows where the order is stuck. How to avoid: for multi-step flows consider orchestration and tracing.
3. **Forgetting eventual consistency in the UI**. Symptom: the user clicks save, reloads and sees no data. How to avoid: the UI shows "processing"; never assume a successful write is immediately visible.
4. **Synchronous calls without a timeout**. Symptom: one hanging downstream drains the caller's thread pool. How to avoid: a short timeout for internal calls + a circuit breaker.

### One-minute spoken answer
"I evaluate along three kinds of coupling. Time: synchronous calls force both sides to be alive at once. Availability: a synchronous chain's success probability is the product of each link, so 10 hops at 99.9% each leaves about 99%. Data: REST forces a tight contract while events only share what happened. So I use REST or gRPC for queries that need an immediate result, gRPC for high-performance internal calls, and events for side tasks, long-running business and fan-out. The trade-off of async is eventual consistency and the need for idempotency. My experience: every synchronous call needs a timeout and a circuit breaker, and every message needs to be idempotent."

> Senior tip: synchronous calls always need a timeout (usually under 1 second for internal calls); asynchronous ones always need idempotency + an ordering strategy. Missing either one and you are not done.`,
    follow: [`If you choose gRPC, how do you handle contract versioning between client and server?`, `When does an asynchronous system still need to return a synchronous response to the user?`, `How do you set timeouts for a chain A calls B calls C so the budget is not swallowed whole?`]
  },
  'microservices-004': {
    q: `One business operation must write data in 3 different services. Why not use 2PC? How do you design a Saga with choreography and with orchestration, and how does compensation handle failures?`,
    a: `**Summary:** 2PC (two-phase commit) forces every participant to hold locks and wait for the coordinator's decision; when the network has an incident or the coordinator dies, participants are **stuck holding locks**. It trades availability and throughput for immediate consistency — far too expensive for online workloads, and many brokers/DBs do not support it. Use a **Saga** instead: a chain of local transactions, each step having a **compensation** (an offsetting action) to back out when a later step fails.

### Quick intuition
2PC is like organizing a wedding where you must wait for **all** guests to confirm before booking the restaurant; while waiting, every guest must keep their calendar free and accept no other bookings. If the organizer loses contact with one guest, the whole group waits indefinitely. A Saga is like booking a trip leg by leg: flight, then hotel, then car. If the hotel is full, you **cancel the flight** (possibly paying a fee): that is compensation. There is no magic undo button, only a sensible offsetting action.

### Glossary
- **2PC / XA**: the two-phase commit protocol; XA is the standard that lets DBs/brokers take part in 2PC.
- **Coordinator / participant**: the side driving the transaction and the sides taking part.
- **Saga**: a chain of local transactions, each step publishing an event/command that triggers the next.
- **Compensation**: a business action that reverses the effect of a step that already committed (refund, release stock).
- **Choreography**: services react to each other's events, with no central coordinator.
- **Orchestration**: one orchestrator commands each step and tracks the state.
- **Semantic lock**: marking a record as "being processed by a saga" (for example status PENDING) instead of a DB lock.
- **Pivot transaction**: the "point of no return"; after this step the saga can only move forward (retry) and no longer compensates.

### How 2PC works and where it breaks
1. **Phase 1 - PREPARE**: the coordinator asks every participant "are you ready to commit?". Each participant writes a log, **holds locks** and answers YES/NO. Why hold locks: having promised YES, it must be able to commit.
2. **Phase 2 - COMMIT/ROLLBACK**: if everyone says YES the coordinator sends COMMIT; if anyone says NO it sends ROLLBACK.
3. **The weakness**: if the coordinator dies after phase 1, participants do not know whether to commit or roll back, so they **hang holding locks**; other requests wait on those locks and the system congests in a chain.

~~~text
Coordinator: PREPARE ──► every participant holds locks, writes a log
            ◄── VOTE yes/no
            COMMIT / ROLLBACK
   (the coordinator dying here => participants hold locks forever)
~~~
- Each phase costs at least one round-trip plus a disk log write, so XA throughput is usually far lower than a local transaction.
- Under CAP, a network partition forces a choice between consistency and availability; online systems usually choose availability. On top of that, Kafka, most REST APIs and many NoSQL stores cannot take part in XA at all.

### Saga: a chain of local transactions
~~~text
ReserveStock ─► ChargePayment ─► CreateShipment ─► SendInvoice
     │ fail          │ fail            │ fail
     ▼               ▼                 ▼
 ReleaseStock ◄── RefundPayment ◄── CancelShipment   (compensation)
~~~
1. Each step: **read state → validate → write a local transaction → publish an event/command** (preferably through an outbox so the DB write and the event are atomic).
2. If step N fails unrecoverably → run compensations from N-1 back to the first step. Why backwards: compensating in order avoids half-finished states (for example a refund before the shipment is cancelled).
3. Transient errors (timeouts) → **retry** first, and only compensate once the failure is certain.

### Choreography vs Orchestration
| | Choreography (events) | Orchestration (central) |
|---|---|---|
| Coordination | nobody; each service reacts on its own | an orchestrator commands each step |
| Coupling | adding a step only adds a consumer | the orchestrator knows every step |
| Observability | the flow is hard to see, you rely on tracing | each step's state is visible immediately |
| SPOF | none | the orchestrator must be HA (state stored in a DB) |
| Fits | 3–4 services, short flows, same team | long flows, cross-team, centralized timeout/retry needed |

Java tooling: choreography uses Kafka + Spring Kafka/Spring Cloud Stream; orchestration uses Temporal (Java SDK), Camunda/Flowable, or a hand-rolled saga state table + state machine.

### Compensation: the part everyone underestimates
- **It is not a rollback**: money already debited must be offset by a business action (refund, an apology voucher), sometimes needing human approval.
- Compensation itself can fail, so it must be **idempotent + retry + DLQ + alerting for manual handling**.
- A saga **lacks isolation**: two sagas both read "1 item left" and both reserve it. Guard against it with semantic locking (status RESERVED), reservations with a TTL, or by moving the step most likely to fail ahead of the pivot transaction.

### Common mistakes
1. **Not storing a saga log**. Symptom: the orchestrator restarts and nobody knows which step the order is on; manual repair. How to avoid: write each step's state to the DB in the same transaction as the outgoing command.
2. **A non-idempotent compensation**. Symptom: a refund is retried twice and the customer gets double the money. How to avoid: every command carries a saga id + step id and the receiver deduplicates.
3. **Compensating on a mere timeout**. Symptom: the payment actually succeeded but the saga already refunded/cancelled. How to avoid: query the downstream status before deciding.

### One-minute spoken answer
"I do not use 2PC because participants must hold locks while waiting for the coordinator; the coordinator dying between the two phases leaves locks hanging, throughput is low, and Kafka or REST APIs cannot take part in XA anyway. I use a Saga: each service commits a local transaction and publishes an event through the outbox; if a step fails, compensations run in reverse, such as refund or release stock. For a short flow across 3 services in one team I use choreography; for long, cross-team flows I use orchestration with Temporal or a saga state table, so I can see the state and centralize timeouts. The trade-off is losing isolation, so I use semantic locks and reservations with a TTL. My experience: compensation must be idempotent and always have a manual path."

> Senior tip: always store the **saga log** (the state of each step) in the same DB as the orchestrator, so after a crash you know exactly which step you were in. No log = nobody dares to restart.`,
    follow: [`A saga has no isolation — how do you concretely prevent overselling in code?`, `When would you choose choreography over orchestration even with 4 services in the flow?`, `How do Temporal/Camunda differ from hand-rolling an orchestrator with Spring?`]
  },
  'microservices-005': {
    q: `Your application writes to the database and publishes an event to Kafka at the same time. Why is this the dual-write problem? How do you solve it with Transactional Outbox + CDC (Debezium)?`,
    a: `**Summary:** writing the DB and then publishing the event (or the other way around) is **two operations on two systems with no shared transaction**: a crash in between either loses the event or creates a "phantom" event for data that does not exist. That is the dual-write problem. Solution: write the business row **and** the event record into an **outbox** table **inside the same DB transaction**, then a separate process (a polling relay or CDC such as Debezium) reads the outbox and pushes the events to Kafka.

### Quick intuition
You have just closed an order and must do two things: write it in the ledger and phone the warehouse. If you write the ledger and the power goes out before the call, the warehouse never learns about the order. If you call the warehouse first and then the ledger write fails, the warehouse prepares goods for an order that does not exist. Outbox means: write the order **and** a line "call the warehouse" **on the same page of the ledger**, so one commit guarantees both. After that a dedicated clerk (the relay) reads the "call" lines and phones the warehouse, calling again if it has not gone through.

### Glossary
- **Dual write**: one business operation writes to two independent systems (DB and broker) with no shared transaction.
- **Outbox table**: a table inside the business DB holding events waiting to be sent.
- **Relay / publisher**: the process that reads the outbox, sends to the broker and marks the row as sent.
- **CDC (Change Data Capture)**: a technique that captures data changes by reading the DB log instead of querying tables.
- **WAL / binlog**: the write-ahead log of PostgreSQL / the binary log of MySQL; every change is written there first.
- **Debezium**: a set of CDC connectors running on Kafka Connect that read the WAL/binlog and emit Kafka messages.
- **Replication slot**: PostgreSQL's "bookmark" recording how far a logical replication consumer has read.
- **At-least-once**: a message is delivered at least once and may be duplicated.

### How dual-write loses data
~~~text
Wrong way A:  db.commit()  ──► crash ──► the event is NEVER sent
Wrong way B:  publish ok   ──► tx.rollback() ──► "phantom" event: announces an order that does not exist
~~~
No transaction manager coordinates a DB and Kafka in practice (Kafka does not support XA). Even {{@TransactionalEventListener(phase = AFTER_COMMIT)}} still breaks: the commit goes through, the process dies before publishing, and the event is lost forever with no log line pointing at it.

### Outbox step by step
~~~java
@Transactional
public void placeOrder(OrderCmd cmd) {
    Order agg = Order.create(cmd);
    orderRepo.save(agg);                         // same transaction as the outbox
    outboxRepo.save(OutboxEvent.of(
        "Order", agg.getId(),                    // aggregateId => use it as the Kafka key
        "order.created", toJson(agg)));          // payload
}   // commit: either both rows exist, or neither does
~~~
1. **Atomic write**: the business row and the outbox row commit together. Why: the DB guarantees ACID within one transaction, so no half-finished state is left.
2. **A relay reads the outbox**, in one of two styles. (a) **Polling**: a {{@Scheduled}} job runs {{SELECT ... FOR UPDATE SKIP LOCKED LIMIT 100}} so multiple instances do not take the same row; latency is about 100ms–1s and it adds query load to the DB. (b) **CDC (Debezium)**: reads the WAL through a replication slot (PostgreSQL) or the binlog (MySQL), so there is no extra query load, latency is low, and the domain code does not change. The Outbox Event Router (a Debezium SMT) turns the row into an event, picks the topic by aggregate type and **sets the Kafka key = aggregateId** to keep ordering per aggregate.
3. **Send to Kafka first, then mark as sent** (polling) or let the connector store its offset (CDC). Why this order: if you crash after sending but before marking, the next run sends again — a **duplicate**, not a loss.
4. **An idempotent consumer**: because step 3 may send duplicates, consumers must deduplicate by event id.

### Architecture
~~~text
App ─► [orders DB: orders + outbox] ─(WAL / logical replication)─► Debezium (Kafka Connect)
                                                                        │
                                                                        ▼
                                                              topic: order.events (key = orderId)
                                                                        │
                                                              consumer (idempotent)
~~~

### Common mistakes
1. **The outbox bloats**. Symptom: hundreds of millions of rows and polling gets slower. How to avoid: a cleanup job for sent rows (keep 7–30 days); with CDC you can insert and immediately delete in the same transaction because Debezium still reads the INSERT event from the WAL.
2. **A non-idempotent consumer**. Symptom: the connector restarts, resends an event and the consumer adds money twice. How to avoid: a processed_event table or an upsert by natural key.
3. **Wrong ordering**. Symptom: OrderCancelled is processed before OrderCreated. How to avoid: Kafka key = aggregateId so all events of one order land in one partition.
4. **An abandoned replication slot**. Symptom: the connector is stopped for a long time, PostgreSQL cannot release WAL and the disk fills up. How to avoid: alert on slot lag and cap {{max_slot_wal_keep_size}}.

### One-minute spoken answer
"Writing the DB and publishing to Kafka is a dual write because the two systems share no transaction: a crash between the steps either loses the event or publishes an event for rolled-back data, and an AFTER_COMMIT listener cannot save you. I use the Transactional Outbox: in the same transaction I write the order and an outbox row holding the event. Debezium then reads the WAL and uses the Outbox Event Router to push the event to a topic keyed by aggregateId to preserve ordering. If I do not want to run Kafka Connect, polling with SKIP LOCKED is fine too. The trade-off is at-least-once, so consumers must be idempotent. In practice I always watch connector and replication-slot lag, because a dead connector means the business is lagging too."

> Senior tip: using CDC for the outbox is normal, but it adds one more component (a Kafka Connect cluster) that must be monitored like a real service: connector lag is business lag.`,
    follow: [`Are the outbox and the event table in the domain model the same thing, and which schema should they live in?`, `Debezium publishes to the broker while the broker is down — how do you proceed?`, `How does polling the outbox with SKIP LOCKED behave when multiple app instances run?`]
  },
  'microservices-006': {
    q: `How do you achieve "efficient exactly-once" when a consumer crashes halfway? Explain client-side idempotency keys, consumer-side dedup, and why exactly-once end-to-end is impossible.`,
    a: `**Summary:** exactly-once **end-to-end** over a network is impossible, because the sender cannot distinguish "the message was lost" from "the message arrived but the ack was lost" (a variant of the Two Generals problem). What we actually do is **at-least-once + idempotent processing = exactly-once effect**: a message may arrive twice but the business effect happens once. The two main tools: an **idempotency key** sent by the client, and **dedup/upsert** at the consumer, placed in the **same transaction** as the business write.

### Quick intuition
You transfer money in an app, the network is flaky, the spinner keeps turning and then it reports an error. You do not know whether the money left, so you press again. If the bank processes naively, you lose money twice. A decent bank assigns each transfer a **ticket number** (idempotency key): the second press carries the same number, the bank checks its books, sees "this number was already processed" and returns the same receipt. That is the exactly-once effect: sent many times, the money moves once.

### Glossary
- **At-most-once / at-least-once / exactly-once**: a message is processed at most once / at least once / exactly once.
- **Idempotent**: performing it many times gives the same result as performing it once.
- **Idempotency key**: a unique code the client generates per command and sends along so the server can recognize a duplicate request.
- **Dedup table**: a table storing processed message ids so duplicates are skipped.
- **Idempotent producer** ({{enable.idempotence}}): Kafka assigns a sequence number to each message so the broker drops duplicates caused by producer retries.
- **Transactional producer**: a Kafka producer that writes several messages + commits offsets in one Kafka transaction.
- **read_committed**: a consumer mode that only reads messages from committed transactions.

### The three semantics
| Semantics | How you achieve it | Consequence |
|---|---|---|
| At-most-once | commit offset/ack first, then process | messages lost on crash |
| At-least-once | process first, then ack; retry on error | **duplicates**, the practical default of Kafka/RabbitMQ |
| Exactly-once end-to-end | the broker alone cannot deliver it | idempotency needed at both ends |

Kafka has exactly-once **within Kafka's scope**: an idempotent producer (on by default since Kafka 3.0) prevents duplicates from retries, a transactional producer writes output + offsets atomically, and a consumer uses {{isolation.level=read_committed}}. This model works for **read topic → write topic** flows (like Kafka Streams). But if the side effect is outside Kafka (a DB write, an HTTP call), Kafka knows nothing, so the loop must be closed in the application.

### Why a consumer crash causes duplicates (step by step)
1. The consumer polls message offset 41 and writes to the DB successfully.
2. The consumer crashes **before** committing offset 42.
3. A rebalance happens and another consumer reads again from the last committed offset (41).
4. Message 41 is processed a second time. Why it cannot be avoided: the DB write and the Kafka offset commit are two different systems, just like dual write.

~~~text
poll(41) ─► DB commit ─► CRASH ─╳─ commitOffset(42)
                         rebalance ─► poll(41) again ─► dedup needed!
~~~

### 1) The client-side idempotency key
The client generates a UUID and sends it in the {{Idempotency-Key}} header; the server **inserts the key first** under a unique constraint, then performs the side effect and stores the response:

~~~java
@Transactional
public Receipt charge(String key, ChargeCmd cmd) {
    Optional<IdemRecord> old = idemRepo.findByKey(key);
    if (old.isPresent()) return old.get().response();   // duplicate: return the old result
    idemRepo.insert(key, hash(cmd));   // UNIQUE(key): two parallel requests => one hits a duplicate key error
    Receipt r = payments.charge(cmd);   // side effect in our own DB
    idemRepo.saveResponse(key, r);      // same transaction
    return r;
}
~~~
- Store it **together with the response** so duplicate requests get the same old result without re-running the side effect.
- The key is **scoped per endpoint + customer** and has a TTL (for example 24h); the same key with a different payload (compare hashes) must return 422 instead of silently proceeding.
- By the HTTP spec POST is not idempotent while PUT/DELETE are; but in a distributed system you should still attach a key to every command that involves money.

### 2) The idempotent consumer
1. **Dedup by message id**: a {{processed_msg(msg_id PK)}} table; insert before processing and skip on conflict. It must live **in the same transaction** as the business write, otherwise a crash between the two steps still duplicates.
2. **Natural-key upsert**: if the business has a natural key you do not need a dedup table (see the SQL below).
3. **Commit the offset after the DB transaction commits** (Spring Kafka {{AckMode.RECORD}} or the default BATCH both commit after the listener returns).

~~~sql
INSERT INTO ledger(order_id, amount) VALUES (:id, :amt)
ON CONFLICT (order_id) DO NOTHING;   -- MySQL: INSERT IGNORE / ON DUPLICATE KEY UPDATE
~~~

### Common mistakes
1. **Retrying at several layers at once** (client + framework + broker). Symptom: the number of copies multiplies and the dedup table bloats. How to avoid: pick one layer responsible for retries.
2. **A side effect outside the DB** (a third-party API call) while the dedup flag commits afterwards. Symptom: a crash in between means a real double charge. How to avoid: pass the idempotency key to the third party, or write a PENDING state first and reconcile.
3. **A dedup TTL that is too short** compared with the maximum possible delay (retries, replays of a few hours). Symptom: duplicates come back after the key expires. How to avoid: a TTL longer than the retention/replay window.
4. **Check-then-insert without a unique constraint**. Symptom: two parallel requests both see "not there" and both run. How to avoid: rely on the DB's UNIQUE constraint, not on an if.

### One-minute spoken answer
"Exactly-once end-to-end is impossible because the sender cannot distinguish a lost message from a lost ack, so every real system is at-least-once. I turn it into an exactly-once effect with idempotency. At the API, the client sends an Idempotency-Key, the server inserts the key under a unique constraint, processes and stores the response in the same transaction, so a duplicate request gets the old response back. At the consumer I dedup by message id or upsert by natural key in the same transaction as the business write, and only then commit the offset. Kafka transactions only give exactly-once for topic-to-topic flows. My experience is to measure the number of duplicates suppressed: it is normal for it to be non-zero."

> Senior tip: metric = the number of duplicate records / "duplicate suppressed" per minute. It is never 0 in a healthy system; being 0 means you never enabled retries, not that you achieved exactly-once.`,
    follow: [`Should the idempotency key live in Redis or in the DB, and why?`, `If the side effect is a third-party REST call that supports no idempotency, what do you do?`, `Commit offsets before or after processing? What does each choice trade?`]
  },
  'microservices-007': {
    q: `How do you configure resilience for a service that calls 10 downstreams with Resilience4j (Spring Boot 3)? The order of applying timeout, retry, circuit breaker, bulkhead, fallback — and why.`,
    a: `**Summary:** an unbreakable rule: **every network call has a timeout**; retry only idempotent operations, with backoff + jitter and a bounded number of attempts; a **circuit breaker** to fail fast once the dependency is weak; a **bulkhead** so one dead dependency does not take down the whole thread pool; **fallback** is the last layer for controlled degradation. With 10 downstreams, each downstream gets its **own configuration instance** (its own name), because each has a different SLA and behavior.

### Quick intuition
Think of a call center phoning 10 partners. **Timeout**: if nobody answers within 30 seconds, hang up. **Retry**: hang up and try again, but wait a while and at most 3 times, not in a burst. **Circuit breaker**: if partner X misses 6 of 10 calls, stop calling X for 30 seconds; when a customer asks about X, say "busy" immediately. **Bulkhead**: allow at most 5 agents to call X at once, so if X's line jams the other agents still serve other partners. **Fallback**: when you cannot reach them, answer with backup information.

### Glossary
- **Timeout / TimeLimiter**: a cap on how long one call may wait; Resilience4j's TimeLimiter is used for asynchronous calls (CompletableFuture).
- **Retry with exponential backoff + jitter**: increasing waits between attempts (200ms, 400ms, 800ms) plus randomness so clients do not retry at the same moment.
- **Circuit breaker**: a switch with 3 states — CLOSED (calls flow), OPEN (blocked immediately), HALF_OPEN (a few trial calls are allowed).
- **CallNotPermittedException**: the exception Resilience4j throws while the breaker is OPEN.
- **Bulkhead**: a cap on concurrent calls to one dependency (a semaphore or a dedicated thread pool).
- **Fallback**: the replacement function that runs when the main call fails.
- **Transient error**: a temporary error (timeout, 503, connection reset) that may succeed when retried.

### Order and reasoning
With annotations, Resilience4j applies a default order (outermost → innermost):
~~~text
Retry ( CircuitBreaker ( RateLimiter ( TimeLimiter ( Bulkhead ( call ) ) ) ) )
~~~
To change it, adjust properties such as {{resilience4j.retry.retryAspectOrder}} and {{resilience4j.circuitbreaker.circuitBreakerAspectOrder}}… (a larger number = higher priority = further outside) or use the functional {{Decorators}} API.

1. **Timeout innermost, applied per attempt**. Why: no attempt may wait unbounded. For synchronous calls put the timeout directly on the HTTP client (connect + read timeout of {{RestClient}}/{{WebClient}}); {{@TimeLimiter}} is only for methods returning {{CompletableFuture}}.
2. **Circuit breaker wraps the timeout**. Why: every timeout/failure is counted toward the failure rate; once the threshold is hit the circuit opens.
3. **Retry outside the circuit breaker**. Why: every attempt goes through the breaker; while the breaker is OPEN, retry receives {{CallNotPermittedException}}, so retry must be configured to **skip** that exception and not pile more load onto a dying service.
4. **Bulkhead**: caps the number of concurrent calls. A semaphore is light and runs on the caller's thread; a thread pool isolates fully but costs threads and adds queueing latency.
5. **Fallback runs last**: return a stale cache, a default value or a "processing" state. The fallback **must not call the network** (unless it has its own timeout), otherwise it can hang too.

~~~java
@Service
class PaymentClient {
    @CircuitBreaker(name = "paymentApi", fallbackMethod = "fallback")
    @Bulkhead(name = "paymentApi")
    @Retry(name = "paymentApi")
    public Receipt charge(ChargeCmd cmd) {
        // RestClient configured with connect 300ms, read 800ms
        return rest.post().uri("/charges").body(cmd).retrieve().body(Receipt.class);
    }
    // same parameters + a trailing Throwable => Resilience4j wires the fallback automatically
    private Receipt fallback(ChargeCmd cmd, Throwable t) {
        return Receipt.pending(cmd.orderId());   // degrade, do NOT call another API
    }
}
~~~

~~~yaml
resilience4j:
  circuitbreaker:
    instances:
      paymentApi:
        slidingWindowSize: 100          # the last 100 calls (count-based)
        minimumNumberOfCalls: 20        # do not evaluate before 20 calls
        slowCallDurationThreshold: 2s   # calls slower than 2s also count as "bad"
        slowCallRateThreshold: 50
        failureRateThreshold: 50        # open the circuit above 50% failures
        waitDurationInOpenState: 30s    # rest 30s then move to HALF_OPEN
        permittedNumberOfCallsInHalfOpenState: 10
  retry:
    instances:
      paymentApi:
        maxAttempts: 3                  # 3 attempts in total, including the first
        waitDuration: 200ms
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2
        enableRandomizedWait: true      # jitter
        randomizedWaitFactor: 0.5
        ignoreExceptions:
          - io.github.resilience4j.circuitbreaker.CallNotPermittedException
  bulkhead:
    instances:
      paymentApi:
        maxConcurrentCalls: 25          # well below the service's processing thread count
~~~

### A numeric example
~~~text
Total request deadline 3s.
read timeout 800ms × 3 attempts + backoff 200ms + 400ms = 3.0s  → already at the deadline
=> lower maxAttempts to 2 or read timeout to 600ms
Tomcat 200 threads, 10 downstreams: bulkhead 25/downstream
=> one hanging downstream holds at most 25 threads; 175 threads still serve other work
~~~

### Configuration rules
- **Timeout × number of attempts < the request's overall deadline**.
- Retry only **transient** errors (connect, 503, timeout); do not retry 400/401/422, which are your own fault and retrying only adds load.
- Retry only **idempotent** operations; money-writing operations must carry an idempotency key.
- **A fallback must not hide the incident**: still record metrics/logs; a rising fallback rate must raise an alert.

### Common mistakes
1. **One shared configuration instance for all 10 downstreams**. Symptom: one failing service opens the breaker for all healthy ones. How to avoid: one instance name per downstream.
2. **Retry not skipping CallNotPermittedException**. Symptom: logs full of useless retries while the breaker is open. How to avoid: {{ignoreExceptions}} as in the config above.
3. **Calling an annotated method from within the same class**. Symptom: the annotation has no effect. Why: Resilience4j uses a Spring AOP proxy, and self-invocation bypasses the proxy. How to avoid: move the call to another bean.
4. **No HTTP timeout**. Symptom: the breaker never opens because calls never end. How to avoid: always set connect/read timeouts.

### One-minute spoken answer
"With 10 downstreams I create a separate Resilience4j instance for each. From the inside out: a timeout on the HTTP client for each attempt, a circuit breaker counting failures and slow calls to open the circuit, retry on the outside only for transient errors and idempotent operations, with exponential backoff and jitter and skipping CallNotPermittedException. A bulkhead caps concurrent calls so one hanging dependency does not eat the thread pool, and fallback returns degraded data without calling the network. The trade-off is configuration complexity, so I compute timeout × attempts to stay under the overall deadline. My experience: always alert on the fallback rate and the breaker state."

> Senior tip: run fault-injection experiments (chaos test: kill 1 pod, cut the network, add latency) before production. A resilience config reads fine but nobody trusts it until you have seen it save the cluster once.`,
    follow: [`Should retry sit outside or inside the circuit breaker? How do you defend your choice?`, `When does a semaphore bulkhead differ from a thread pool, and what are the drawbacks of each?`, `What risks does a stale-cache fallback carry with financial data?`]
  },
  'microservices-008': {
    q: `Last night one dependency slowed down, every service timed out and the cluster died with it. What does that retry storm/cascading failure look like? How do you prevent it?`,
    a: `**Summary:** this is **retry amplification** leading to **cascading failure**: with each layer retrying 3 times the dependency receives up to 4× the load exactly when it is weak; add overly long timeouts and the upstream's threads are held longer, the **thread pool drains**, and innocent services die although they are fine. Prevent it with: short timeouts inside an overall deadline, bounded retries + jitter + a retry budget, circuit breakers, bulkheads, backpressure (429/503 + Retry-After) and health checks that do not depend on downstreams.

### Quick intuition
A checkout counter is slow because the receipt printer is jammed. The queue gets impatient, and every 10 seconds someone pushes forward to ask "done yet?", and each question makes the cashier slower. The queue grows, spills into the next counter, and the whole supermarket jams. That is a retry storm. The right response: put up a sign "counter paused, come back in 5 minutes" (circuit breaker + Retry-After), limit how many people may ask again (retry budget), and separate lines per counter (bulkhead) so one jammed counter does not block the whole supermarket.

### Glossary
- **Cascading failure**: a failure spreading in a chain from one service to the services calling it.
- **Retry amplification**: load multiplied because several layers retry at once (3 layers × 3 attempts = up to 27 calls for one original request).
- **Thundering herd**: many clients waking up and calling again at the same moment.
- **Jitter**: randomness added to the retry wait so attempts are spread out.
- **Retry budget**: a cap on retries relative to original traffic (for example at most 10%).
- **Backpressure**: a mechanism where the receiver tells the sender to slow down instead of accepting everything and choking.
- **Deadline propagation**: passing the request's "remaining time" down to lower layers.
- **AIMD**: additive increase, multiplicative decrease (like TCP) when adjusting the concurrency level.

### The incident, step by step
1. **Dependency B gets slow** (GC pause, DB lock): response time goes from 200ms to 20s. Why it is dangerous: slow is worse than dead, because the caller keeps waiting.
2. **A has a 30s timeout + 3 retries**: each request holds a thread for about 90s. Why: the thread is occupied for the whole wait.
3. **A's 200-thread pool is exhausted**: new requests queue up, and A is effectively dead even though its CPU is idle.
4. **C and D call A the same way**: the failure spreads across the cluster. Why: each layer retries again and load multiplies exponentially.
5. **The liveness probe gets slow**: Kubernetes restarts pods in bulk, and the fresh pods take heavy load at startup so they die too (restart storm).

~~~text
Load B receives while B is slow:
  client ─(3 retries)─► C ─(3 retries)─► A ─(3 retries)─► B
  1 original request → at most 4 × 4 × 4 = 64 calls into B
Threads in A: 200 threads / (90s per request) = 2.2 requests/second → collapses at normal load
~~~

### Prevention
1. **Short timeout + overall deadline**: the total retry time must fit the request's budget. Past the deadline, **do not retry**, because it only consumes resources of requests arriving after you.
2. **Jitter is mandatory**: {{delay = random(0, min(cap, base * 2^attempt))}} (full jitter). Why: without jitter every client retries at the same moment, hitting B exactly as it recovers and knocking it down again.
3. **Retry budget**: retries should make up only about 10% of normal traffic (Envoy has a retry budget; AWS SDKs have a token-bucket retry quota). Why: retries must never exceed the original traffic.
4. **Retry at a single layer**: usually the layer closest to the client or closest to the dependency, not all layers.
5. **Circuit breaker**: open when the failure/slow-call rate is high, failing fast for tens of seconds instead of holding threads waiting.
6. **Bulkhead**: a separate concurrency limit per downstream, no shared threads.
7. **Backpressure**: return 429/503 with {{Retry-After}} so callers slow themselves down, instead of accepting everything and queueing internally without bound.
8. **Never retry non-idempotent operations**; if you must, include an idempotency key.
9. **Adaptive concurrency** (AIMD, or the AWS SDK's "adaptive" retry mode with client-side rate limiting): lower the concurrent-call limit as errors rise.
10. **Liveness probes that do not check downstreams**: only check that the process is alive; a dead downstream is no reason to restart the pod.

### Detect it before the crash
- Metrics: retry count, timeout count, thread pool active/max, queue depth, p99 latency **per dependency** (not only overall).
- Traces: one parent span with several identical child spans is a retry signature; unusual fan-out is an early cascade.
- Alert on **symptoms** (error rate, p99 latency), not only on causes (CPU).

### Common mistakes
1. **The default timeout unbounded or 30–60s**. Symptom: a thread dump full of threads waiting on socket read. How to avoid: set timeouts from the downstream's real p99 (for example p99 300ms → 1s timeout).
2. **Retrying at the gateway, the service and the client library**. Symptom: B receives dozens of times the load during an incident. How to avoid: agree on one retry layer and turn retries off everywhere else.
3. **Liveness probes that call the DB/downstreams**. Symptom: a slow DB makes Kubernetes restart every pod. How to avoid: check dependencies in readiness, or not at all.
4. **Autoscaling when the dependency is the bottleneck**. Symptom: adding A pods only adds load to B. How to avoid: scale on the real bottleneck and combine it with a circuit breaker.

### One-minute spoken answer
"This incident is a retry storm leading to a cascading failure. When B slows down, A with a long timeout and 3 retries holds threads for a very long time, the pool drains and A dies; services calling A also retry, so the load into B multiplies exponentially. I prevent it with short timeouts inside an overall deadline, retries at a single layer with exponential backoff and jitter and a ~10% retry budget, circuit breakers to fail fast, a separate bulkhead per downstream, and returning 429 or 503 with Retry-After so callers slow down. Liveness probes must not check downstreams. The trade-off is users seeing errors sooner, but the system survives and recovers faster."

> Senior tip: the golden on-call rule: "when a service gets slow, shed its load; do not add retries". Retry is a sedative for developers and a poison for a weak system.`,
    follow: [`How do you compute the retry budget concretely in your code?`, `Why is a too-long timeout more dangerous than a too-short one?`, `How do you tell a retry storm apart from genuinely rising traffic in your dashboard?`]
  },
  'microservices-009': {
    q: `Explain how Kafka guarantees ordering within a partition, the consumer group mechanism, offset commits and rebalancing. Then cover delivery semantics and handling a poison pill with a DLQ.`,
    a: `**Summary:** Kafka is a **distributed log split into partitions**: ordering is only guaranteed **within one partition**, and inside a consumer group each partition is assigned to exactly one consumer. At-least-once is the practical model (commit the offset after processing), so consumers must be idempotent. A permanently failing message (a poison pill) must be moved to a **DLQ** after a few retries so it does not block the whole partition.

### Quick intuition
Picture Kafka as a **numbered conveyor belt** in a factory, split into several lanes (partitions). Each crate on a lane has an increasing sequence number (offset). Each group of workers (consumer group) splits the lanes between them: one lane has only one worker standing at it, so the crates on that lane are processed in order. Each worker writes in a ledger "I have processed up to crate 41" (commit offset); if that worker leaves, the replacement reads the ledger and continues from there. A broken crate that cannot be processed is put on a **faulty-goods shelf** (DLQ) so the lane does not stop.

### Glossary
- **Topic / partition**: a topic is a named stream of events; a partition is an ordered sub-log inside the topic.
- **Offset**: the sequence number of a message inside a partition.
- **Consumer group**: a group of consumers sharing the same group.id and dividing the topic's partitions among themselves.
- **Group coordinator**: the broker that manages the group members and the partition assignment.
- **Rebalance**: the process of re-dividing partitions when a consumer joins or leaves the group.
- **Static membership**: a consumer with a fixed {{group.instance.id}} that can restart quickly without causing a rebalance.
- **Poison pill**: a message that fails on every processing attempt (bad format, invalid data).
- **DLQ / DLT**: dead letter queue/topic, where messages that cannot be processed are kept for inspection and replay.

### Partition & ordering
1. **The producer picks a partition by key**: {{toPositive(murmur2(keyBytes)) % numPartitions}}. The same key always goes to the same partition, so all events of one order_id stay in order. Messages without a key are spread by the sticky partitioner and have no business ordering.
2. **Increasing the partition count changes the key → partition mapping**: a new event for order 123 can land in a different partition while old events have not been processed in the old partition, breaking ordering. So choose enough partitions up front, or when you must increase them have a strategy (create a new topic and migrate gradually, or wait until consumers have processed everything before switching).
3. **Producer retries can reorder**: enable {{enable.idempotence=true}} (on by default since Kafka 3.0) with {{acks=all}} and {{max.in.flight.requests.per.connection}} no more than 5. The broker uses sequence numbers to drop duplicates while preserving order.
4. **There is no ordering across partitions**. If you need global ordering there is only one partition, and that is exactly the throughput bottleneck.

~~~text
Topic orders (3 partitions), key = orderId
P0: [o1-created][o1-paid][o4-created] ...
P1: [o2-created][o2-cancelled] ...
P2: [o3-created][o3-paid][o3-shipped] ...
Group "billing": consumer A ← P0, P1 ; consumer B ← P2
~~~

### Consumer group & rebalancing
1. **Partition assignment**: 8 partitions, 4 consumers → 2 partitions each; 8 partitions, 10 consumers → 2 consumers sit idle. Why: one partition belongs to only one consumer in the group to preserve ordering.
2. **Detecting a dead consumer**: a consumer sends heartbeats from a background thread; if heartbeats are missing for longer than {{session.timeout.ms}} it is removed. Also, if the gap between two {{poll()}} calls exceeds {{max.poll.interval.ms}} (default 5 minutes) the consumer leaves the group. Both cause a **rebalance**.
3. **Eager vs cooperative**: eager makes every consumer release all partitions and they are re-divided, pausing the whole group for a moment. **Cooperative-sticky** ({{CooperativeStickyAssignor}}) only moves the partitions that must move. Kafka 4.x also has the new group protocol (KIP-848, {{group.protocol=consumer}}) where the broker drives the assignment, making rebalances even lighter.
4. **Static membership**: a pod that restarts and rejoins within {{session.timeout.ms}} with the same {{group.instance.id}} does not trigger a rebalance — very useful during rolling deploys.

### Offset commits & delivery semantics
1. **Auto-commit** (the Kafka client default, every 5 seconds): while inside {{poll()}} it commits the offsets of the previously polled batch. Processing synchronously inside the poll loop is still at-least-once; but if you push messages to another thread and then crash, **messages are lost**. Spring Kafka disables auto-commit by default and commits according to the AckMode (default BATCH, after the listener finishes the batch).
2. **Standard at-least-once**: finish the side effect **then** commit; a crash between the two steps means the message is processed again, so idempotency is needed.
3. **At-most-once**: commit first, then process; only suitable for data you can afford to lose (sampled metrics).
4. **Exactly-once inside Kafka**: a transactional producer bundles "write output + commit offset" into one transaction, and consumers read {{read_committed}}; only correct when the output is also Kafka. Side effects to a DB/HTTP still must be idempotent.

### Poison pill & DLQ
A broken message makes the listener fail forever, the offset never advances and **the whole partition stalls**, with lag growing without bound. Spring Kafka handles it neatly:

~~~java
var recoverer = new DeadLetterPublishingRecoverer(template,
    // by default it sends to "<topic>.DLT" with the same partition number; here we rename it to .DLQ
    (rec, ex) -> new TopicPartition(rec.topic() + ".DLQ", rec.partition()));
// 1 initial attempt + 3 retries 1s apart; still failing => send to DLQ and commit the offset
var handler = new DefaultErrorHandler(recoverer, new FixedBackOff(1_000L, 3L));
handler.addNotRetryableExceptions(DeserializationException.class); // bad data: DLQ immediately
factory.setCommonErrorHandler(handler);
~~~
- The DLQ topic must have **at least as many partitions** as the source topic if you keep the partition as above.
- Messages in the DLQ carry the original headers (topic, partition, offset, exception) for investigation and replay.
- **Alert on the number of messages entering the DLQ**: that is business work waiting for a fix, not harmless garbage.
- After fixing the bug, replay: read the DLQ and push back onto the original topic (consumers are still idempotent).

### Common mistakes
1. **A timestamp or random key**. Symptom: events of the same order processed out of order (Cancelled before Created). How to avoid: key = the aggregate id.
2. **Long processing in the listener**. Symptom: exceeding {{max.poll.interval.ms}}, getting kicked out of the group, rebalances in a loop, messages reprocessed. How to avoid: reduce {{max.poll.records}}, raise the interval, or optimize the processing.
3. **Increasing partitions mid-flight** while the system depends on key ordering. Symptom: ordering bugs that are hard to reproduce. How to avoid: leave spare partitions from day one and plan the migration.
4. **No DLQ**. Symptom: one broken message makes one partition's lag grow forever. How to avoid: DefaultErrorHandler + DeadLetterPublishingRecoverer.

### One-minute spoken answer
"Kafka only guarantees ordering within a partition, so I key events by aggregate id so all events of one order land in the same partition. In a consumer group each partition belongs to one consumer; when consumers join or leave, or processing exceeds max.poll.interval, the group rebalances, so I use cooperative-sticky and static membership to reduce disruption during deploys. I follow at-least-once: process, then commit the offset, with idempotent consumers. Kafka transactions only give exactly-once when the output is also Kafka. For poison pills I use DefaultErrorHandler to retry a few times and then send to a DLQ, deserialization errors go straight to the DLQ, and I alert on the DLQ."

> Senior tip: monitor **consumer lag** (latest offset minus committed offset, per partition) as Kafka's number-one metric: rising lag is the first sign of both slow processing and a poison pill. Lag rising in only one partition is usually a poison pill or a hot key.`,
    follow: [`Why is increasing the partition count an ordering-breaking operation? How do you handle it?`, `When is committing the offset before processing the right choice?`, `Compare eager and cooperative rebalancing during a rolling deploy.`]
  },
  'microservices-010': {
    q: `Compare Kafka, RabbitMQ, and SQS/SNS. What do you choose for: (a) an event stream that needs replay, (b) a simple work queue on AWS, (c) pub/sub fan-out to many subscribers?`,
    a: `**Summary:** **Kafka** is an append-only log retained over time for **replay** and stream processing; **RabbitMQ** is a "smart" broker with flexible routing and per-message acknowledgement (ACK); **SQS/SNS** are managed AWS services — no servers to run, pay per use. The answer: (a) replay → Kafka, (b) a job queue on AWS → SQS, (c) fan-out → SNS → many SQS queues (or EventBridge when you need complex filtering).

### Quick intuition
**Kafka** is like a **logbook**: anyone can read it, the pages stay after reading, and you can re-read last week's pages. **RabbitMQ** is like a **post office**: letters are sorted by address, and once the recipient signs for one it leaves the post office. **SQS** is like a **work inbox** that AWS looks after: you just drop work in and take it out, without hiring anyone to mind the inbox. **SNS** is like a **loudspeaker**: it broadcasts once and every subscribed inbox receives a copy.

### Glossary
- **Retention**: how long/how much Kafka keeps messages, independent of whether consumers have read them.
- **Replay**: re-reading old messages by resetting the consumer group's offset.
- **Exchange / binding** (RabbitMQ): an exchange receives messages and routes them to queues according to binding rules.
- **Visibility timeout** (SQS): a message being processed is hidden from other consumers for a period of time.
- **Message group** (SQS FIFO): messages in a group keep their relative order, similar to a Kafka key.
- **Fan-out**: one message is copied to many subscribers.
- **DLQ / redrive policy**: a queue holding failed messages; the redrive policy defines after how many failed receives a message moves to the DLQ.
- **Quorum queue**: a RabbitMQ queue type replicated with the Raft algorithm, surviving a node death.

### Quick table
| | Kafka | RabbitMQ | SQS / SNS |
|---|---|---|---|
| Model | append-only log, consumers pull by offset | exchange → queue, broker push + ACK | managed queue (SQS), pub/sub fan-out (SNS) |
| Retention | by time/size (7 days by default) | until ACK (or TTL) | SQS: up to 14 days |
| Replay | **yes**: reset the offset and re-read | not with a regular queue; RabbitMQ Streams (3.9+) does support it | no |
| Ordering | per partition/key | per queue, lost with multiple consumers/requeue | FIFO queue: per message group |
| Throughput | very high (hundreds of MB/s per cluster) | medium–high, routing per message | very large, AWS scales it for you |
| Ops cost | **high** (cluster, monitoring, upgrades) | medium | close to zero |
| Standout features | stream processing (Kafka Streams), Kafka Connect, CDC | routing, TTL, DLX, priority, AMQP/MQTT | AWS integration, Lambda triggers, FIFO, filter policies |

### The three scenarios answered
1. **(a) An event stream that needs replay / analytics → Kafka.** Why: only Kafka keeps messages independent of whether consumers have read them. After fixing a bug, to reprocess 3 days of events you reset the offset to that point ({{kafka-consumer-groups --reset-offsets --to-datetime}}). Event sourcing, CDC (Debezium) and real-time aggregation are all built on Kafka. From Kafka 4.0 the cluster runs on **KRaft**, no more ZooKeeper, one less component to operate. On AWS you can use MSK to reduce operational work.
2. **(b) A simple job queue on AWS → SQS.** Workers poll messages; while a message is being processed it is hidden (visibility timeout); delete it once processed; if a worker dies the message reappears for another worker, which is a free retry. After N failed receives, a redrive policy moves the message to a DLQ. If you need ordering, use a FIFO queue with a message group id.
3. **(c) Fan-out to many subscribers → SNS → many SQS queues.** Each subscriber gets its own queue, so a slow or dead subscriber does not affect the others. Use SNS filter policies so each queue only receives the events it needs; for complex content filtering, a schema registry or SaaS integrations use **EventBridge**.

~~~text
            ┌──► SQS email-queue  ──► email worker
SNS order ──┼──► SQS billing-queue ──► billing worker
            └──► SQS search-queue  ──► indexer
(each queue has its own DLQ, each worker scales on its own)
~~~

### When RabbitMQ wins
- Complex routing at the broker itself: direct/topic/fanout/headers exchanges, bindings by pattern; subscribers do not have to filter on their own.
- You need priority queues, per-message TTL, RPC patterns (reply-to), or the AMQP/MQTT protocols (IoT).
- Moderate scale, low latency needed, no replay, and you are not on AWS or want to run on-premise.

### Common mistakes
1. **Using Kafka only as a job queue**. Symptom: a slow job on one partition blocks the jobs behind it, and the worker count is limited by the partition count. How to avoid: use SQS/RabbitMQ for job queues; Kafka is for event streams.
2. **SNS + SQS without DLQs and alarms**. Symptom: one subscriber fails, its queue fills with millions of messages, and nobody notices. How to avoid: a redrive policy + an alarm on {{ApproximateAgeOfOldestMessage}}.
3. **A visibility timeout shorter than the processing time**. Symptom: the job runs twice in parallel. How to avoid: set the visibility timeout above the maximum processing time, or extend it while processing; workers must be idempotent.
4. **A non-replicated RabbitMQ classic queue**. Symptom: a node dies and messages are lost. How to avoid: use quorum queues (classic mirrored queues were removed in RabbitMQ 4.0).

### One-minute spoken answer
"I distinguish the three by model. Kafka is a retention-based log where consumers manage offsets themselves, so replay is possible, throughput is very high, but operations cost effort. RabbitMQ is a smart routing broker where an ACKed message is done, strong on routing, priority and TTL. SQS and SNS are managed on AWS with almost no operational work. For a stream that needs replay I choose Kafka; for a job queue on AWS I choose SQS because of the visibility timeout, DLQs and easy worker autoscaling; for fan-out I use SNS into many SQS queues so each subscriber is isolated. My experience is not to choose Kafka just because it is popular: the operational cost arrives now while the benefit may never arrive."

> Senior tip: a team already on AWS uses SQS/SNS for everyday work and Kafka (MSK/Confluent) when there is a real event-streaming need. Do not pick Kafka "because we will need analytics someday": the ops cost arrives now, the benefit arrives later.`,
    follow: [`Kafka retains messages for 7 days; if you need 90 days, what do you do?`, `How does the SQS visibility timeout handle a worker dying halfway?`, `When should you add EventBridge on top of SNS instead of using SNS alone?`]
  },
});
