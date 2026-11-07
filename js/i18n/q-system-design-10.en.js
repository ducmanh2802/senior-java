/*
 * English translation of js/data/q-system-design.js — task T657. Format: js/core/i18n.js (content overlay).
 * ids: architecture-023 architecture-024 architecture-025 architecture-026 architecture-027 architecture-028
 */
App.i18n.content({
  'architecture-023': {
    q: 'Your team is choosing a messaging platform for the system: Kafka or RabbitMQ. How do you write an Architecture Decision Record (ADR) to capture the decision, when do you need an ADR at all, and give an example ADR structure for this case?',
    a: `**Summary:** An ADR (Architecture Decision Record) is a short document stored next to the source code that captures **one significant architecture decision, its context, the options considered, and why one was chosen and the others dropped**. You need an ADR when the decision is hard to reverse, expensive to change later, affects several teams, or when several options are reasonable enough that the debate will be reopened. An ADR is not a detailed design document; it answers "why did we choose this at the time" so that a newcomer (or you, six months later) does not relitigate the old argument.

### What an ADR is and why you need one
- **What:** each ADR is a single sequentially numbered file (usually Markdown), for example {{0007-use-kafka-for-order-events.md}}. It is immutable in this sense: the content of an old decision is never edited; if you change direction you create a new ADR and mark the old one "Superseded" (replaced).
- **Why you need it:**
  - **Organisational memory:** people who leave the team take the reasoning with them; ADRs keep it. A new dev reading 10 ADRs understands the backbone of the architecture faster than someone reading 200 tickets.
  - **No repeated debates:** "why are we not using RabbitMQ?" — read ADR 0007. If the context changed (throughput is now only 50 msg/s and replay is not needed), a new ADR can supersede it.
  - **Transparent decision-making:** it forces the proposer to state trade-offs explicitly instead of choosing by habit or by trend.
  - **Audit/compliance:** some sectors (finance, healthcare) must trace technical reasoning back.

### When you DO need an ADR, and when you do not
| Needs an ADR | Does not need an ADR |
|---|---|
| Choosing a foundational technology (DB, message broker, cloud) | Choosing a variable name, a small package layout |
| Deciding service/module boundaries | Refactoring the inside of one class |
| Auth strategy, multi-tenancy, data residency | Bumping a patch version of a library |
| A cross-cutting pattern (sync vs async, event sourcing yes/no) | How to implement one specific feature (a pattern already exists) |
| A decision that costs serious money or is hard to reverse | A temporary experiment (spike) — but the spike's conclusion should become an ADR |

Rule of thumb: if reversing this decision costs more than 2 weeks of work or affects more than 1 team, write an ADR.

### The common ADR structure (MADR / Nygard)
~~~text
# ADR-0007: Use Kafka for the order event stream

- Status: Accepted (2026-08-15)
- Deciders: An (Tech Lead), Binh (Architect), Chi (SRE)
- Date: 2026-08-15

## Context
The e-commerce system has 5 services (Order, Inventory, Payment,
Notification, Analytics) that must react when an order changes state.
Measurable requirements:
- ~3,000 events/second at peak, 3x higher during sales.
- 4 independent consumers (Inventory, Notification, Analytics, Fraud) read
  the same event, each processing at a different speed.
- 7-day replay is needed to rebuild Analytics reports when the logic changes.
- Acceptable latency < 2 seconds (sub-millisecond is not required).
- Team of 8 devs, 1 SRE; nobody has run Kafka in production.

## Options Considered
1. Kafka
2. RabbitMQ
3. AWS SNS + SQS

## Decision
Choose **Kafka** (managed: Amazon MSK) for the order event stream.

## Rationale
- **Many consumers + replay:** Kafka keeps a log according to retention; 4
  independent groups read the same topic with their own offsets. 7-day replay
  meets the Analytics requirement. RabbitMQ deletes a message after ack — you
  would have to store your own copy.
- **Throughput:** 3,000 msg/s (peaks of 9,000) is comfortably inside what Kafka
  handles with 6 partitions; RabbitMQ can do it too, but operating it at this
  level gets more complex once durability + many queues are required.
- **Trade-off accepted:** running Kafka is harder. Risk is reduced by using
  MSK (managed), limiting initial scope to 1 cluster and 1 topic domain, and 2
  weeks of team training; the SRE owns the runbook.

## Why not others
- **RabbitMQ:** strong at complex routing, per-message ack, delayed delivery —
  but replay and independent multi-consumer are not its natural strengths; you
  must duplicate queues or use the stream plugin (added complexity).
- **SNS+SQS:** simple and managed; but replay requires your own storage
  (S3/Kinesis), cost grows with the number of consumers (one queue + fan-out
  per consumer), and AWS vendor lock-in runs deeper than the team wants at
  this layer.

## Consequences
- Conventions needed: event schema (Avro/JSON Schema + Schema Registry),
  partition key (orderId), idempotent consumer, DLQ topic.
- MSK cost ~\$X/month (estimate) + storage for 7 days.
- Next step: a 1-week spike (ADR-0008) proving consumer idempotency
  and replay; review again after 3 months of real operation.
~~~

### A quick comparison inside the ADR (trade-off table)
| Criterion | Kafka (MSK) | RabbitMQ | SNS+SQS |
|---|---|---|---|
| Event replay | Yes (retention) | Not naturally | You must store it yourself |
| Many independent consumers | Consumer group | Duplicate queues | Fan-out |
| Per-message retry/DLQ | Build it (extra topic) | Built in | Built in |
| Target throughput | Very comfortable | Achievable, more work | Achievable |
| Operations (current team) | Hard → use managed | Medium | Low |
| Latency | ms–s | sub-ms–ms | ms–s |

### Production pitfalls
- **Writing the ADR after the work is already done:** it loses its value because the real reasons get rationalised backwards. Write it while you are still deciding, and close it before the big implementation.
- **An ADR as long as a design document:** nobody reads it. 1–2 pages is enough; put technical detail in the design doc and link it.
- **Not recording "Consequences" and review conditions:** the decision looks correct forever. State explicitly "review if throughput drops below 500 msg/s or the team can no longer operate Kafka".
- **ADRs living outside the repo (Confluence, Google Doc):** they drift away from the code and are hard to find. Store them under {{docs/adr/}} in the repo and review them through pull requests like code.

> Senior tip: the best ADR is the one that makes even the person who disagreed feel their argument was recorded in the "Why not others" section. If an ADR only praises the option that was chosen, it is a sales pitch, not an engineering decision. When I review an ADR, I look for the trade-off that was accepted — if there is none, I ask for it to be added before approving.`,
    follow: [
      'When the context changes (for example traffic drops sharply), how do you update the old ADR while still keeping the history?',
      'How does an ADR differ from an RFC (Request for Comments) and from a design doc? When do you use which?',
      'How do you get the team to actually keep writing ADRs instead of abandoning the habit after two months?'
    ],
  },
  'architecture-024': {
    q: 'What is a modular monolith? How do you place module boundaries, enforce those boundaries with ArchUnit, and decide when to split a module into its own service?',
    a: `**Summary:** A modular monolith is an application deployed as **one unit** (one artifact, one process) but divided internally into **modules** with clear boundaries: each module owns its own data and logic, other modules may only interact with it through a public API (interface/method) or through events, and never poke directly at its internal tables or classes. It keeps the operational simplicity of a monolith (one deploy, in-process method calls, easier transactions) while preparing an exit path to microservices for when you truly need one. ArchUnit turns boundaries from "a verbal convention" into an automated test.

### What → why → how it works
- **What:** picture an office building. A messy monolith is one open floor where anyone can walk past anyone else's desk. Microservices are separate buildings on different streets — to exchange anything you send mail (network). A modular monolith is one building where every department has a door, a nameplate and a receptionist: to ask Accounting something you go through their front desk, you do not open their filing cabinet yourself.
- **Why it is needed:**
  - Many teams jump straight to microservices before they need them → they pay for network costs, distributed data consistency, complex deploy and observability, while still getting the boundaries wrong (a distributed monolith — worse than a monolith).
  - A modular monolith lets you move fast and refactor boundaries cheaply (changing a package or an interface is far cheaper than changing a network API plus a data migration), and you only pay distributed-systems cost when there is a real reason.
- **How it works:** each module is a root package (for example {{com.shop.order}}, {{com.shop.catalog}}, {{com.shop.payment}}). The rule: the root package is the public API; sub-packages ({{.internal}}, {{.persistence}}) are private. Module A calls module B through an interface in {{com.shop.catalog.api}} and never imports {{com.shop.catalog.internal.*}}.

### Module structure (example)
~~~text
com.shop
  +-- order
  |    +-- api                (public: OrderFacade, OrderPlaced event)
  |    +-- internal           (private: OrderService, rules)
  |    +-- persistence        (private: OrderRepository, entities)
  +-- catalog
  |    +-- api                (public: CatalogFacade, ProductView)
  |    +-- internal
  |    +-- persistence
  +-- payment
       +-- api
       +-- internal
       +-- persistence
~~~
The data rule: the {{orders}} table is owned only by the {{order}} module. Does {{payment}} need to know the amount due? It calls {{OrderFacade.getPayableAmount(orderId)}} or consumes the {{OrderPlaced}} event — it never joins the {{orders}} table directly.

### Enforcing boundaries with ArchUnit
~~~java
@AnalyzeClasses(packages = "com.shop")
class ModuleBoundaryTest {
    @ArchTest
    static final ArchRule noInternalAccess = noClasses()
        .that().resideInAPackage("..order..")
        .should().dependOnClassesThat()
        .resideInAPackage("..catalog.internal..");

    @ArchTest
    static final ArchRule noCycles = slices()
        .matching("com.shop.(*)..").namingSlices("$1")
        .should().beFreeOfCycles();

    @ArchTest
    static final ArchRule persistenceIsolated = noClasses()
        .that().resideOutsideOfPackage("..order.persistence..")
        .should().dependOnClassesThat()
        .resideInAPackage("..order.persistence..");
}
~~~
These tests run in CI ({{mvn test}}). A boundary violation = build failure. For an old codebase that already violates many rules, use {{FreezingArchRule.freeze(...)}} to block new violations and pay the debt down gradually (see also architecture-021). Spring Modulith provides the same approach with {{ApplicationModules.verify()}} and adds support for events between modules.

### Communication between modules
| Mechanism | When | Pros | Cons |
|---|---|---|---|
| Public interface call (in-process) | You need the result right now (a query) | Simple, fast, easy to debug | Synchronous coupling; the caller inherits the callee's failures |
| Application event (Spring {{@TransactionalEventListener}}) | Side reactions (send an email after checkout) | Lower coupling; easy to add consumers | Harder to trace the flow; ordering and error handling need care |
| Event + outbox table (same DB) | You must guarantee the event matches the DB commit | Consistency without a broker | Extra complexity; consumers are still in-process |

### When do you split a module into its own service?
Split only for a **measurable reason**, never "to look tidy":
- **Different scale:** the Search module needs 20 instances during a sale while the rest need 3 — split so it can scale independently. If everything scales the same way, splitting only burns money.
- **Different deploy cadence:** the Fraud team needs to deploy 5 times a day, Order once a week and is blocked by a change-control process — splitting removes the conflict (but first try splitting the pipeline and ownership).
- **Isolation requirements:** sensitive data (PCI) must have its own network/DB, or one module that keeps crashing drags the whole system down with it.
- **Genuinely independent teams:** more than 2 teams constantly touching the same module creates conflicts — and the module boundary is already clear. With a blurry boundary, splitting into a service = distributed monolith.

Signs you should NOT split yet: fewer than 10 people on the team, no good observability yet, module boundaries still change often, no bottleneck you have actually measured.

### Production pitfalls
- **"Modular" only on paper:** the packages look clean, but module A injects module B's repository directly. Without ArchUnit or Spring Modulith verification, the boundary will rot.
- **A shared DB schema with no owner:** everyone runs {{ALTER TABLE}} on each other's tables. Convention: each module has its own schema or table prefix; cross-module access goes through the API.
- **Splitting a service too early, with the wrong boundary:** you either merge back or live with clumsy network APIs plus a complex saga. Fixing a boundary across the network costs many times more than fixing it inside a monolith.
- **A transaction spanning modules:** {{@Transactional}} wrapping calls into two modules looks atomic — true in a monolith, but it is hidden coupling, and it breaks the day you split them into services. Identify those points and redesign them for eventual consistency.

> Senior tip: I treat the modular monolith as "the good default state" for small and medium teams. The interview question most often answered badly is the one asking for microservice benefits, because people forget the costs; the strong answer is: "I keep a modular monolith, add ArchUnit from day one, and only split a service when numbers on scale, deploy cadence or isolation prove that module needs to live on its own." Always attach the concrete numbers you have actually seen.`,
    follow: [
      'How do you handle a transaction that must write into two modules (for example Order + Inventory) inside a modular monolith?',
      'How does Spring Modulith differ from writing your own ArchUnit rules? When do you choose which?',
      'You discover module A calls into module B internals from 40 places — what is your step-by-step plan?',
    ],
  },
  'architecture-025': {
    q: 'You must replace a legacy system (an old monolith nobody dares to touch) with a new one without stopping the service. You apply the Strangler Fig pattern: routing, two-way data synchronisation, and when to switch the old system off. Illustrate the flow with ~~~seq.',
    a: `**Summary:** Strangler Fig (named after the fig tree that grows wrapped around its host tree and gradually replaces it) is an incremental migration strategy: put a **routing/facade** layer in front of the old system, move one capability at a time to the new system, let both run in parallel, and finally switch the old one off. The hardest part is not writing new code but **two-way data synchronisation** while both systems are alive, and deciding the **cut-over point** safely. There is no big-bang rewrite here — every step must be rollbackable.

### What → why
- **What:** instead of shutting the old system down, building the new one and switching it on in one moment (big bang — extremely risky), you strangle it gradually: move capability A to the new system, verify it, move B, ... the old system shrinks until it can be turned off.
- **Why it is needed:** a legacy system is usually a black box that keeps the business running: no tests, logic scattered everywhere, but real money flows through it. Big-bang rewrites fail because (1) you misunderstand hidden business rules, (2) 18 months pass with nothing shipped, (3) one buggy cutover night is a disaster. Strangler reduces blast radius: each step moves only a small slice.
- **Everyday example:** repairing a motorway while traffic is running — you do not close the whole road and rebuild it; you work lane by lane, divert cars into a temporary lane, finish that lane, then move to the next.

### Step 1: the routing layer (facade/proxy)
Put a single entry point (API Gateway, reverse proxy, or a facade service) that decides whether a request goes to the old system or the new one:
~~~text
General flow:
Client -> [Routing Facade] --(migrated)--> [New system]
                           --(not yet)----> [Legacy system]
~~~
Route by feature (URL/endpoint), by percentage (canary), or by tenant. Start at 0% to the new system and increase gradually.

~~~seq
title: Strangler Fig - moving GET /orders gradually
actors: Client | Facade | NewSvc | Legacy
Client -> Facade: GET /orders/123
Facade -> Facade: rule: orders READ is migrated
Facade -> NewSvc: GET /orders/123
NewSvc --> Facade: 200 order
Facade --> Client: 200 order
note Client..Legacy: endpoints not yet migrated still go to Legacy
~~~

### Step 2: two-way data synchronisation (the hardest part)
While both systems run, the data must be consistent enough to be usable. There are three strategies (usually combined):
| Strategy | How | Pros | Cons | When |
|---|---|---|---|---|
| **Single source of truth (one writer)** | Only the new (or only the old) system may write; the other reads through an API or receives a copy | Simple, no write conflicts | The reader may lag; depends on the writer | Preferred whenever achievable |
| **CDC (Change Data Capture)** | Read changes from the DB log (for example Debezium reads binlog/WAL) and push them to the other side | No change to legacy code | Latency; schema mapping; loops if bidirectional | Legacy cannot be modified |
| **Controlled two-way sync** | Both write, synchronised via events/CDC with explicit conflict-resolution rules | Flexible during the transition | **Complex, easy to create loops and conflicts** | Only temporarily, narrow scope |

~~~seq
title: CDC one-way sync (Legacy -> New)
actors: Legacy | LegacyDB | CDC | NewSvc | NewDB
Legacy -> LegacyDB: UPDATE orders
LegacyDB -> CDC: read changes from WAL
CDC -> NewSvc: event OrderUpdated
NewSvc -> NewDB: upsert orders (idempotent)
NewSvc --> CDC: ack
~~~

Rules of survival for two-way sync: (1) **Idempotent** — receiving the same event again must not create a duplicate record (use a natural key/upsert). (2) **Loop prevention** — an event produced by the sync must carry a {{source=sync}} flag so the CDC on the other side ignores it, otherwise A->B->A->B forever. (3) **One field, one owner** — each field has exactly one system as its source of truth; never let both sides edit the same field. (4) **Periodic reconciliation** — a job compares both sides and reports drift.

### Step 3: migrate by slice
Do not migrate by technical layer ("move the entire DB first") but by **vertical business capability**:
1. Pick a small slice with clear value and few dependencies (for example "view order detail" first, "create order + payment" later).
2. Build it in the new system, migrate that slice's historical data (backfill), then enable routing (canary 1% → 10% → 100%).
3. Compare the results (shadow/parallel run if possible): call both systems, return the old result to the user, log the differences.
4. Freeze writes for the migrated part in the old system (read-only or blocked).

### Step 4: when do you switch the old system off?
Switch it off when **all** of these are true:
- 100% of traffic for those capabilities is routed to the new system and has stayed stable (for example 2–4 weeks) with no rollback.
- No consumer left reads or writes the legacy DB directly (check connections, CDC, batch jobs, reports).
- Historical data worth keeping has been backfilled/archived; checksum and row counts reconcile.
- The rollback runbooks are no longer valid (nobody needs to go back) and the operations team has signed off.
- Contracts/compliance allow the shutdown (keep audit archives if required).

Decommission piece by piece: revoke access, disable routes, stop CDC, put the legacy DB read-only for a while, and only then decommission. Keep a snapshot/backup before deleting anything permanently.

### Production pitfalls
- **Two-way sync without loop prevention:** CDC pushes A->B, B writes to its DB which triggers CDC pushing B->A — an event storm and data that flickers back and forth. Always attach source metadata and ignore events generated by the sync.
- **Migrating a "layer" instead of a "slice":** you migrate the whole DB but the logic stays in legacy → the two systems are welded together through a shared DB and neither can be turned off.
- **Forgetting hidden consumers of the legacy DB:** reports, accounting scripts, partner integrations reading the old DB directly. You must audit every connection before shutdown.
- **No shadow comparison:** you believe the new system is correct, but tax or promotion logic differs — and you find out when customers complain. Run both in parallel and diff on real traffic (with PII masked) before cutover.

> Senior tip: the success criterion of a strangler is not "the new system is finished" but "each month we switch off one more measurable part of the legacy". Keep a table: which endpoints still live on legacy, their % of traffic, and the target off-date. If that table has not moved in 3 months, you are building a new system in parallel, not strangling — go back to smaller slices.`,
    follow: [
      'How do you handle the case where legacy and the new system have different data models (for example one old table split into three new tables)?',
      'Shadow traffic shows different results — how do you classify a difference as "acceptable" versus a "bug"?',
      'When is strangler NOT suitable, and what alternatives do you have to consider?',
    ],
  },
  'architecture-026': {
    q: 'You are designing multi-tenancy for a B2B SaaS product (many customer companies share one system). Compare shared schema, schema-per-tenant and DB-per-tenant; how do you handle noisy neighbours and data isolation?',
    a: `**Summary:** Multi-tenancy means one software system serves many customers (tenants — for example each company is one tenant) on shared infrastructure, while their data must remain isolated from each other. The three main models: **shared schema** (common tables with a {{tenant_id}} column) is the cheapest and scales to the largest number of tenants, but carries the highest leak risk if code forgets to filter; **schema-per-tenant** separates schemas inside the same database; **DB-per-tenant** gives the strongest isolation and is the most expensive and hardest to operate as tenant count grows. In practice teams use a **hybrid**: small tenants share, while large/high-paying tenants or those with compliance requirements get their own database. A noisy neighbour (one tenant consuming so many resources that other tenants slow down) is handled with resource limits, fair queues, and moving tiers when needed.

### The three models compared
| Criterion | Shared schema ({{tenant_id}}) | Schema per tenant | DB per tenant |
|---|---|---|---|
| Data isolation | Weakest (depends on code) | Fair (separate namespace) | Strongest |
| Leak risk from a bug | High (forgot {{WHERE tenant_id}}) | Medium | Low |
| Cost per tenant | Lowest | Medium | Highest |
| Scaling tenant count | Excellent (thousands) | Medium (limits on schemas/connections) | Poor with too many databases |
| Schema migration | Once | N times (per schema) | N times (per DB) |
| Custom schema/version per tenant | Hard | Possible | Easy |
| Backup/restore one tenant | Hard (must filter rows) | Easier | Easy |
| Contract flexibility (data stored in a specific country) | Hard | Hard | Easy (place the DB in that region) |

### Shared schema: how to do it safely
- Every business table carries {{tenant_id}} (NOT NULL, indexed). Use a composite primary key, or a unique constraint that includes {{tenant_id}}, to avoid collisions.
- **Enforce tenant filtering at the infrastructure layer; do not rely on developers remembering it:** use a Hibernate filter/{{@TenantId}} (Hibernate 6), PostgreSQL Row Level Security (RLS), or a repository wrapper that injects the predicate automatically. RLS is a second line of defence: even a raw SQL statement that forgets the condition is still blocked by the database.
~~~sql
-- PostgreSQL RLS: the DB filters automatically by the tenant set in the session
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_iso ON orders
  USING (tenant_id = current_setting('app.tenant_id')::bigint);
~~~
~~~java
// Set the tenant per request (after authentication), clear it in finally
jdbc.execute("SET LOCAL app.tenant_id = '" + tenantId + "'");
// SET LOCAL only lives inside the transaction — it cannot leak into another request
~~~
- Take the tenant from a **validated claim** in the token; never trust a value the client sends freely (a header {{X-Tenant}} must be checked against the caller's permissions).

### Noisy neighbour
- **What:** tenant A runs a heavy report or imports 10 million rows, DB CPU hits 100%, and tenant B — who also pays — slows down with it. Like an apartment block: one flat opening the water at full blast drops the pressure for the whole floor.
- **Handle it layer by layer:**
  - **Per-tenant rate limiting:** requests per second, payload size, number of concurrent jobs. Answer 429/503 with a {{Retry-After}}.
  - **Fair queues:** heavy jobs (export, import) go through a queue; workers pick tasks round-robin (fair scheduling) so a big tenant cannot occupy every slot.
  - **DB resource isolation:** cap {{statement_timeout}} per tenant/role, use a separate connection pool for heavy tasks, send reports to read replicas. On PostgreSQL you can use {{ALTER ROLE tenant_a SET statement_timeout = '5s'}}.
  - **A separate tier for "whale" tenants:** a very large tenant or a strict SLA → move it to DB-per-tenant or a dedicated cluster (the hybrid model). This is exactly why real systems must be designed so that **a tenant can be moved**.
  - **Per-tenant observability:** latency, error and query CPU metrics tagged with {{tenant_id}} so you can see who generates the load.

### How to choose in practice
1. Early-stage SaaS, many small tenants, limited budget: **shared schema** + RLS + rate limiting. Invest in making the tenant-context layer really tight.
2. A medium number of tenants, light per-tenant customisation needed: **schema-per-tenant** (watch the connection and migration limits).
3. Few but large tenants, compliance/data-residency requirements, or high contract value: **DB-per-tenant**.
4. Mature product: **hybrid** — shared by default, promote special tenants to their own database. Design {{TenantRouter}} (choosing the datasource per tenant) from day one so that promotion is not a rewrite.

### Production pitfalls
- **Tenant leak from a missing filter:** one admin query, one batch job, one export API that forgot {{tenant_id}} returns cross-tenant data. Defend in depth: {{@TenantId}}/filter + RLS + an automated test that scans for queries without a tenant condition + review.
- **A shared cache whose keys have no tenant:** {{cache.get("product:123")}} returns tenant A's product to tenant B. Always include {{tenant_id}} in the cache key.
- **Connection pool explosion with schema/DB-per-tenant:** 500 tenants × 5 connections × 10 instances = 25,000 connections. You need a pooler (PgBouncer), lazy pools, or a cap on simultaneously active tenants.
- **A migration that runs N times and fails halfway:** 200 of 500 schemas migrated, number 201 errors → an inconsistent state. You need a per-tenant migration tool with version tracking and the ability to re-run (idempotent).

> Senior tip: in an interview, do not simply pick one model — say "I start with a shared schema but design TenantContext + TenantRouter so that I can move large tenants out later, because isolation requirements tend to grow with contract value". And always mention the two defence layers (code + RLS): an application bug must never be able to become a customer data breach.`,
    follow: [
      'How do you move one tenant from shared schema to its own database with almost no downtime?',
      'How do automated tests detect a query that is missing the tenant_id condition?',
      'A tenant requires its data to be stored in the EU (data residency) — how does the architecture change?',
    ],
  },
  'architecture-027': {
    q: 'What is event sourcing? When is it worth using and when is it over-engineering? How do you handle snapshots and event schema evolution?',
    a: `**Summary:** Event sourcing stores an **immutable chain of events** describing every change ("Order created", "Item added", "Order paid") instead of storing only the current state. The current state is derived by replaying the events. You get a natural audit log, the ability to rebuild past states, and easy event emission for integration — in exchange for a different way of thinking, harder querying (you usually need projections/read models), and events whose schema is hard to change. **Worth using** when history, audit or replay is a core requirement (accounting ledger, financial transactions, dispute-prone processes). **Over-engineering** for ordinary CRUD (catalogue management, simple profiles) where you only need the current state.

### What → everyday example
- **State-based (the usual way):** an account balance is 500,000 VND — you know the present but not the reason.
- **Event sourcing:** you store the chain {{AccountOpened(+0)}} → {{MoneyDeposited(+1,000,000)}} → {{MoneyWithdrawn(-500,000)}} → the current balance = replay = 500,000 VND. You know the whole history and can answer "what was the balance at the end of the 15th?" by replaying events up to the 15th. It is the difference between a bank statement (a list of transactions) and only looking at the balance.
- **Immutable events:** once written, never edited or deleted (append-only). A mistake is corrected with a compensating event ({{MoneyWithdrawnReversed}}), never by overwriting the old one — that is what preserves the audit trail.

### Storage structure (simplified)
~~~text
Event Store (append-only table, for example grouped by aggregate)
| aggregate_id | version | type              | data (JSON)                 | occurred_at |
| ord-123      | 1       | OrderCreated      | {customer:7, items:[...]}   | 10:00:01    |
| ord-123      | 2       | ItemAdded         | {sku:"A1", qty:2}           | 10:00:15    |
| ord-123      | 3       | OrderPaid         | {amount:200000, txn:"T9"}   | 10:05:00    |
Current state = fold/replay events 1..3 in version order.
~~~
~~~java
// Derive the state: apply each event onto an empty aggregate
Order order = Order.empty();
for (Event e : store.load("ord-123")) order.apply(e);
// order is now in the "Paid" state with the correct items
~~~
- **Optimistic concurrency:** a new event is written together with {{expectedVersion}}. If somebody already wrote version 4, a write with expected 3 fails (conflict) — this prevents overwriting and silently losing an event.

### When it IS worth using
- **Audit/mandatory traceability:** finance, accounting ledgers, insurance, healthcare — you must prove "who changed what, when, with before/after values". Event sourcing gives you the audit log "for free" because it is a log by nature.
- **Rebuilding the past / what-if:** "what was the order state at the moment of the dispute?", replaying new logic over old events to fix reports.
- **A behaviour-rich domain where events are natural:** multi-step workflows, domain experts who speak in events ("when the customer cancels after delivery...").
- **Event-driven integration:** internal events can be published outward (usually through an outbox) for other services.

### When it IS over-engineering
- **Pure CRUD:** product catalogue, configuration — you only need current values, nobody asks "what was this product name 3 months ago?". Adding an event store, projections and replay = a large cost with no value back.
- **A team not used to it:** a different mental model (thinking in events instead of setting state), harder debugging ("which event produced this state?"), less tooling than traditional ORM work.
- **Strong ad-hoc query needs:** asking "all orders over 1 million, delivered in Hanoi, last month" against a raw event store is very awkward → you are forced to build read models/projections (CQRS). If everything is a complex query, projection cost becomes large.
- **Large data domains with long lifetimes:** an aggregate with 100,000 events → slow replay (you need snapshots, see below).

### Snapshots
- **Problem:** an aggregate alive for 5 years accumulates 50,000 events; every load replays 50,000 events → slow.
- **Solution:** periodically store a **snapshot** = the state at version N. Load = read the most recent snapshot + replay only the events after it.
~~~text
Load ord-123 (50,000 events, snapshot at version 49,000):
1. Read snapshot @ 49,000 -> state available immediately.
2. Replay events 49,001..50,000 (1,000 events) -> current state.
~~~
- A snapshot is an **optimisation**, not the source of truth; it can be deleted and rebuilt from events. Store one every K events (for example 500) or on a time schedule. A snapshot must carry its version so you know where to resume replay.

### Event schema evolution
Events live forever (append-only) while code changes — this is the biggest challenge:
- **Golden rule:** a released event is an **immutable contract**. Never change the meaning of a field, never reuse a type for another purpose.
- **Compatible change (safe):** add an optional field with a default value; add a new event type (old code ignores it). Like forward-compatible JSON.
- **Incompatible change:** renaming, retyping or deleting a required field, or changing its meaning. Do **not** edit old events in the store. Ways to handle it:
  - **Upcasting:** on read, translate the old event version into the new structure in code ({{v1 -> v2}}) before applying it. The store still keeps the original.
  - **Explicit versioning:** {{OrderCreated_v2}}, or a {{schemaVersion}} field in the payload.
  - **Copy-and-transform (rare, be careful):** migrate into a new stream — only when truly necessary, and you must keep the trace.
- Avoid vague payloads: use clear names and clear units ({{amountCents}}, {{currency}}); do not stuff in a giant object when you only need a few fields.

### Production pitfalls
- **Using event sourcing and then querying the event store directly for the UI:** slow and awkward. You need a **projection/read model** (an ordinary table updated from events) for queries — that means accepting CQRS (separating read and write).
- **Editing or deleting events in the store "because it is convenient":** it destroys the audit trail and can make replay produce the wrong state. To satisfy "delete" under GDPR → use crypto-shredding (encrypt the personal data inside events with a per-user key, then delete the key) instead of deleting events.
- **Events that are too large or too granular:** storing a blob or image inside an event → the store balloons; or an event for "every keystroke" → no business meaning. An event should be a **meaningful business fact**.
- **Not versioning events from the start:** six months later you change the schema and there is no way up. Introduce {{schemaVersion}} and the upcast mechanism from the very first event.

> Senior tip: the senior answer is not "event sourcing is great" but "I use event sourcing for the parts that need audit and replay (for example the transaction ledger) and keep plain CRUD for the rest, inside the same system". Event sourcing is a tool for the right problem, not a default architecture for everything. If the interviewer asks "when would you NOT use it" and you cannot name a case, that is a sign you have not used it in production.`,
    follow: [
      'How does event sourcing differ from just keeping an audit log, or from using CDC/outbox? When is an audit log enough?',
      'A projection breaks or must change — how do you rebuild the read model on production?',
      'How do you satisfy a "delete user data" request (GDPR) when the event store is append-only?',
    ],
  },
  'architecture-028': {
    q: 'What is cell-based architecture? How does it limit blast radius, and how do you design routing, cell assignment and global state?',
    a: `**Summary:** Cell-based architecture divides the system into many similar **cells**, where each cell is a complete, independent cluster (compute + storage + the dependencies it needs) serving a **subset** of users/tenants. A failure, a bad deploy, or an overload only affects that cell — **blast radius is bounded** by the size of a cell instead of bringing the whole system down. The price is a **cell router** layer (routing tenant → cell), a strategy for splitting and moving tenants, and accepting that some global state and data is hard to partition.

### What → why
- **What:** instead of one giant cluster serving everyone (shared-everything), you build N smaller copies of the stack: {{cell-1}} serves tenants 1–1000, {{cell-2}} tenants 1001–2000... Each cell has its own app, database (or shard) and cache. One dead cell = 1000 tenants affected, while the other 9000 keep running.
- **Everyday example:** a ship with several watertight compartments. One compartment holed floods only that compartment, and the ship still floats because the others stay sealed. With a single hull, one hole can sink the whole ship.
- **Why it is needed:**
  - **Blast radius:** a bad deploy, a query that exhausts connections, or a bug triggered only by tenant X's data → only the cell containing X dies. In a single cluster, 100% of users are affected.
  - **Scaling in units:** add a new cell as tenants grow, instead of bloating one huge cluster (which hits DB connection limits, cluster size limits, failover duration).
  - **Bounded failure domain:** experiment and roll out per cell (canary by cell).

### Main components
~~~seq
title: Cell-based routing
actors: Client | Router | Cell1 | Cell2 | Global
Client -> Router: request (tenant=1500)
Router -> Router: map tenant 1500 -> cell-2
Router -> Cell2: forward request
Cell2 --> Router: response
Router --> Client: response
note Client..Global: Global keeps only tenant->cell mapping
~~~

| Component | Role | Notes |
|---|---|---|
| **Cell router** | Receives the request, looks up {{tenant -> cell}}, forwards it | Must be extremely simple and highly available; a broken router = everything down (that becomes the new blast radius) — so keep it a thin, stateless layer, multi-AZ/region |
| **Cell** | A full stack for the assigned set of tenants | As self-contained as possible: app, DB, cache, queue. Minimise cross-cell dependencies |
| **Tenant→cell mapping table** | The source of truth for "where is this tenant" | Stored in a durable global tier (replicated), cached at the router; changes when a tenant moves |
| **Control plane (global)** | Create/delete cells, assign tenants, move tenants, deploy | Separate from the data plane; a slow control plane must never kill the data plane |

### Splitting into cells and size limits
- Choose cell size so that losing one cell stays acceptable (for example each cell holds ≤ 5% of all tenants, or ≤ 5% of revenue). This is exactly the **target blast radius**.
- Assigning tenants: hash/mod (simple, fixed) or a lookup table (flexible, movable). In practice prefer the **mapping table**, because tenants are uneven in size and you need to move them.
- Moving a tenant between cells (when a cell fills up, or to rebalance): you need a mechanism to migrate the tenant's data plus switch the mapping, usually with a short write-freeze window or a temporary dual-write.

### Global state — the hard part
Not everything splits along cell lines:
- **Tenant data (that tenant's orders and users):** inside the cell — good.
- **Shared catalogue, global configuration, cross-tenant search (admin):** hard to place inside a cell. Ways to handle it: (1) a separate global service pushing read-only replicas down into cells; (2) accept that global queries take a different path (not through the cell router); (3) duplicate reference data into every cell (eventual consistency).
- **Identity:** {{tenant_id}}/IDs must be globally unique (no collisions between cells) — use UUID/ULID or reserved ID ranges.

### Quick comparison with other approaches
| Approach | Blast radius | Complexity | Fits |
|---|---|---|---|
| One big cluster + autoscale | 100% | Low | Small/medium, no wide-impact incidents yet |
| DB sharding (DB only) | DB split, app still shared | Medium | The bottleneck is the database |
| **Cell-based (full stack)** | Bounded per cell | High | Very large systems needing strong failure-domain isolation |
| Multi-region active-active | Per region + cell | Very high | Global, DR requirements |

### Production pitfalls
- **The router becomes a single point of failure:** a router that is complex, stateful, or dependent on a slow DB — when it dies, everything dies. Keep the router stateless, cache the mapping locally, and have a safe fallback mechanism.
- **Hidden global dependencies inside a cell:** the cell calls one single global service (shared auth, config service) — when that service dies, every cell dies. Audit dependencies: a cell must survive degraded global services (cache credentials and configuration).
- **Uneven cells (hot cell):** a few "whale" tenants land in one cell → that cell overloads. Monitor per cell, put large tenants in a dedicated cell, or rebalance.
- **Operating N cells:** deploys, schema migrations and observability multiply by N. Automation is mandatory (IaC, deployment in waves across cells) — doing it by hand does not scale.

> Senior tip: cell-based architecture is not the first step. Say: "I only adopt cells once I have seen one tenant or one deploy affect the whole system, and once the cost of that incident exceeds the cost of operating N cells." Emphasise the two points interviewers always probe: the router must be extremely simple (it is the blast radius you have left), and cell size = target blast radius must be measured in numbers, not picked by feel.`,
    follow: [
      'How do you deploy a new version safely across 50 cells (rollout strategy)?',
      'A tenant needs aggregated data across other tenants (an admin report) — which path does that take in a cell architecture?',
      'The router cache of tenant→cell mapping goes stale while a tenant is being moved — how do you handle it?',
    ],
  },
});
