/*
 * English translation of js/data/quiz-design.js — task T427. Format: js/core/i18n.js (content overlay).
 * ids: qz-architecture-012 qz-architecture-013 qz-architecture-014 qz-architecture-015 qz-architecture-016 qz-architecture-017 qz-architecture-018 qz-architecture-019 qz-architecture-020 qz-microservices-007 qz-microservices-008 qz-microservices-009 qz-microservices-010 qz-microservices-011 qz-microservices-012 qz-microservices-013 qz-microservices-014 qz-microservices-015 qz-microservices-016
 */
App.i18n.content({
  'qz-architecture-012': {
    q: 'The codebase represents money with {{double amount}} and {{String currency}} scattered everywhere; you have already had bugs from 0.1 + 0.2 drift and from adding VND to USD by mistake. How do you redesign it?',
    options: [
      'Change {{double}} to {{float}} to save memory and round only when displaying',
      'Create a {{Money}} entity with its own id in the DB and setters to update the amount',
      'Use {{long}} to store the amount multiplied by 100 for every currency and drop the currency field',
      'Create an immutable {{Money}} value object (e.g., a Java {{record}}) holding {{BigDecimal}} and {{Currency}}; add/subtract check that the currencies match, equality is by value, and the scale is normalised'
    ],
    explain: `**Correct answer: an immutable Money value object with BigDecimal + Currency.**

### Why it is correct
- **Value object**: it has no identity, so two Money instances with the same amount and currency are equal; being immutable means it can be shared safely between threads.
- It encapsulates the business rules in one place, removing "primitive obsession":
~~~java
record Money(BigDecimal amount, Currency currency) {
  Money {
    amount = amount.setScale(currency.getDefaultFractionDigits(), RoundingMode.HALF_EVEN);
  }
  Money plus(Money o) {
    if (!currency.equals(o.currency)) throw new IllegalArgumentException("Currency mismatch");
    return new Money(amount.add(o.amount), currency);
  }
}
~~~
- Normalising the scale in the constructor is essential: {{BigDecimal.equals}} compares the scale too ({{2.0}} is not equal to {{2.00}}), so without normalisation the record's equals would be wrong.

### Why the other options are wrong
- **float**: still a binary floating-point number, and even less precise than double.
- **Entity with id and setters**: money has no identity; setters make the object mutable and easy to modify by accident once it is shared.
- **long x 100, no currency**: not every currency has 2 decimal places (VND has 0, some currencies have 3), and dropping currency is exactly what caused the VND-vs-USD bug.

> Senior tip: store it in the DB as {{NUMERIC(19,4)}} with a currency column, and map it with {{@Embeddable}} in JPA. Always specify a {{RoundingMode}} when dividing; otherwise {{divide}} can throw {{ArithmeticException}} on a non-terminating decimal.`
  },
  'qz-architecture-013': {
    q: 'The {{Product}} class shared by Catalog, Inventory, and Shipping now has 60 fields; every team\'s change breaks another team. What is the DDD way out?',
    options: [
      'Split into bounded contexts: each context gets its own Product model containing only the fields it needs (Catalog: description, images; Inventory: stock per warehouse; Shipping: weight, dimensions), linked by productId and translated via context mapping',
      'Keep a single canonical Product model for the whole company and set up a committee to approve every change',
      'Switch Product to inheritance: {{CatalogProduct extends Product}}, {{InventoryProduct extends Product}}',
      'Change every field to {{Map<String, Object>}} so no team has to modify the class'
    ],
    explain: `**Correct answer: split into bounded contexts, one model per context.**

### Why it is correct
- The same word "Product" has **different meanings** in each context. A bounded context is a boundary inside which a term has exactly one meaning (ubiquitous language).
- Each context keeps a small model that changes only when its own business rules change, so the teams become independent.
- Shared data (productId, name) is synchronised through events or APIs; when integrating with a foreign model, an anti-corruption layer does the translation.

### Why the other options are wrong
- **Company-wide canonical model**: that is the current situation plus a slower process; every change still affects everyone.
- **Inheritance**: the Product superclass is still a shared point that every team edits, and inheritance creates tighter coupling; the three subclasses are not really "is-a" relationships but different points of view.
- **Map<String, Object>**: loses type safety, moves errors from compile time to runtime, and nobody knows which fields are actually used.

> Senior tip: draw the context map (Customer/Supplier, Conformist, ACL, Shared Kernel) before splitting services. Bounded-context boundaries are usually good candidates for microservice or module boundaries.`
  },
  'qz-architecture-014': {
    q: 'The team chooses a modular monolith with Spring Modulith. How do you detect early when the {{order}} module calls classes inside the internal package of the {{inventory}} module directly, or when a circular dependency is introduced?',
    options: [
      'Review the code very carefully; no tooling is needed',
      'Write a test that calls {{ApplicationModules.of(Application.class).verify()}}; Spring Modulith treats each direct sub-package of the root package as a module, only the module\'s root package is public API, and the test fails on any access to internal packages or on dependency cycles',
      'Split each module into its own microservice so the compiler enforces it',
      'Mark every class {{public}} so cross-calls are easy'
    ],
    explain: `**Correct answer: verify the structure with {{ApplicationModules.verify()}} in a test.**

### Why it is correct
- Spring Modulith derives modules from the package structure: each direct sub-package of the package containing the {{@SpringBootApplication}} class is a module. Types in the module's root package are API; sub-packages inside it are internal by default.
- {{verify()}} uses ArchUnit to check that there are no dependency cycles between modules and no access to another module's internal types. It runs in CI, so a violation is blocked right at the PR.
~~~java
@Test
void verifiesModularStructure() {
  ApplicationModules.of(Application.class).verify();
}
~~~
- Modules communicate through public APIs or through events ({{@ApplicationModuleListener}}), which makes it easier to extract a service later.

### Why the other options are wrong
- **Review only**: humans miss things, especially in a large codebase with many teams; the architecture rots gradually and nobody notices.
- **Split into microservices right away**: you trade in all the operational cost of distribution (network, deploys, distributed data) just to get boundaries, while the modular monolith exists precisely to get boundaries without paying that cost yet.
- **Mark everything public**: this destroys Java's encapsulation entirely.

> Senior tip: Spring Modulith also generates module documentation (C4/PlantUML) and supports {{@ApplicationModuleTest}} to test each module in isolation, which is very useful when you need to show the team that the boundaries are being respected.`
  },
  'qz-architecture-015': {
    q: 'You are leading the migration of a 500k-line monolith to a new architecture using the strangler fig pattern; the system must keep running and ship features every month. Which approaches follow the spirit of the strangler fig? (Choose 2)',
    options: [
      'Put a routing layer (API gateway/reverse proxy) in front and move endpoints or business flows over to the new system one at a time, with the ability to fall back to the old system on failure',
      'Freeze features for 12 months to rewrite everything and then cut over in one go',
      'Use an anti-corruption layer between the new system and the monolith so the new system\'s model is not polluted by the old model',
      'Let the new services and the monolith write to the same old tables indefinitely, with no ownership of the data',
      'Start with the most complex and riskiest core (e.g., pricing) to prove the new architecture'
    ],
    explain: `**Correct answer: incremental routing; and an anti-corruption layer.**

### Why it is correct
- **Incremental routing**: the strangler fig "strangles" the old system bit by bit. A proxy in front lets you move {{/catalog/**}} to the new service, measure the result, and keep going; if something breaks, you route back. Each step is small, reversible, and delivers value continuously.
- **ACL**: the new system calls the monolith (or consumes its events) through a translation layer. The new model is designed cleanly around the domain and does not carry the old system's distorted concepts.

### Why the other options are wrong
- **Freeze for 12 months, one-shot cutover**: this is a big-bang rewrite, the highest-risk option; the business cannot wait, and the new system has to chase the old one's features anyway.
- **Writing to the old tables indefinitely**: two systems writing the same data means coupling at the DB layer remains; you need to transfer data ownership to the new system (temporarily synchronising via CDC) with a clear end date.
- **Starting with the riskiest core**: start with a part that has few dependencies, clear value, and low risk (e.g., notifications, catalog reads) so the team can learn the process and build the infrastructure first.

> Senior tip: define a metric for "percentage of traffic already served by the new system" and milestone dates for switching off each part of the monolith. Without those switch-off dates, strangler projects very easily turn into two systems running in parallel forever.`
  },
  'qz-architecture-016': {
    q: 'The Order service publishes {{OrderUpdated(orderId)}}. Eight consumer services receive the event and each calls back {{GET /orders/:id}} to fetch the details, adding 10,000 RPS to the Order service at peak. What is a reasonable fix?',
    options: [
      'Add a Redis cache in front of the Order service API and you are done; the event does not need to change',
      'Switch to synchronous REST calls from Order to the eight services instead of events',
      'Switch to event-carried state transfer: the event carries everything consumers need (state, total amount, items...) plus a version; consumers keep a local copy and no longer call back',
      'Reduce the number of consumers to 2 services'
    ],
    explain: `**Correct answer: event-carried state transfer.**

### Why it is correct
- An event that only contains an id is the **event notification** style: lightweight, but every consumer has to call the producer again, creating load proportional to the number of consumers and **runtime coupling** (if Order is down, the eight services cannot process anything either).
- An event that carries state lets consumers be self-sufficient: they store a copy (a read model) and can keep processing even while Order is failing. A version or sequence number in the event lets them discard stale events that arrive late.
- Trade-off: events are bigger, the event schema becomes a contract you must manage (Schema Registry, compatibility), and consumers must accept eventual consistency.

### Why the other options are wrong
- **Just add a cache**: it reduces the Order DB load, but the 10,000 RPS still hits the service; cached data can be older than the event (a consumer may read a value from before the update), and the runtime coupling remains.
- **Synchronous REST from Order to the eight services**: Order would have to know every consumer, and one slow service slows Order down; it works against the benefits of event-driven design.
- **Reduce consumers**: those services need the data for their business logic; removing them is a requirements change, not a solution.

> Senior tip: do not stuff the entire entity into the event. Design events around the consumers' needs and the domain language ({{OrderPaid}}, {{OrderShipped}}) instead of one generic {{OrderUpdated}}, and consumers will understand the intent much more easily.`
  },
  'qz-architecture-017': {
    q: 'A loan approval flow has 8 checks (KYC, blacklist, credit score, credit limit...). Each step can stop the flow and return a rejection reason; the order and the set of steps vary by loan product. Which pattern fits best?',
    options: [
      'A Singleton with one long method containing 8 if blocks',
      'Observer: publish an event to 8 listeners that run in parallel',
      'Template Method: the superclass fixes the 8 steps and subclasses override each step',
      'Chain of Responsibility: each rule is a handler with the same interface, the chain is assembled from each product\'s configuration, and a handler can stop the chain and return a reason'
    ],
    explain: `**Correct answer: Chain of Responsibility.**

### Why it is correct
~~~java
interface LoanRule { Optional<String> check(LoanApplication app); } // empty = pass

class RuleChain {
  private final List<LoanRule> rules; // assembled from product configuration
  Optional<String> evaluate(LoanApplication app) {
    for (LoanRule r : rules) {
      Optional<String> reject = r.check(app);
      if (reject.isPresent()) return reject; // stop early, return the reason
    }
    return Optional.empty();
  }
}
~~~
- Each rule is small and testable in isolation; adding a new rule does not modify existing rules (Open/Closed).
- The list and the order can be assembled from configuration (in Spring you can inject {{List<LoanRule>}} and filter/sort per product). Put cheap rules (blacklist) before expensive ones (calling a credit bureau) to save money.

### Why the other options are wrong
- **One long method with 8 ifs**: hard to test, hard to reorder per product, and every change touches the same place.
- **Observer**: listeners run independently and have no notion of "stopping the chain" or dependent ordering; it is hard to gather a single approval result.
- **Template Method**: fixes the algorithm skeleton in the superclass, which is good when the steps are always the same; here the list of steps varies by product, so inheritance would spawn many subclasses.

> Senior tip: if business users change the rules frequently, consider a rule engine or storing rules as data; but with 8–15 stable rules, plain Java + Chain of Responsibility is far easier to debug and review.`
  },
  'qz-architecture-018': {
    q: 'After two years on a hexagonal project, classes in the {{domain}} package have started importing {{jakarta.persistence}} and {{org.springframework}}. What is the most durable way to keep the boundary?',
    options: [
      'Write an ArchUnit test, e.g. {{noClasses().that().resideInAPackage("..domain..").should().dependOnClassesThat().resideInAnyPackage("jakarta.persistence..", "org.springframework..")}}, and run it in CI',
      'Write the rule in the README and repeat it in team meetings',
      'Merge domain and adapters into the same package so there are no more violations',
      'Switch to layered architecture because hexagonal is too hard to maintain'
    ],
    explain: `**Correct answer: enforce the boundary with an ArchUnit test in CI.**

### Why it is correct
- The architectural rule becomes an **automated test**: any violation turns the build red right at the PR, with a message naming which class depends on which. This is a "fitness function" for an evolving architecture.
- A framework-free domain lets you test the domain in plain Java (fast, no Spring context), and changing the persistence layer does not affect the business logic.
- You can add more rules: adapters must not call each other, controllers must not call repositories directly, and there must be no dependency cycles between slices.

### Why the other options are wrong
- **README and reminders**: rules that are not enforced will eventually be violated when a deadline is tight or a newcomer joins.
- **Merging the packages**: it removes the violation by removing the architecture itself.
- **Dropping hexagonal**: that can be a reasonable decision for a simple project, but it does not answer the question of "keeping the boundary"; layered architecture also needs rules (no calls back up the layers) and also rots when unchecked.

> Senior tip: when applying ArchUnit to a codebase that already has violations, use {{FreezingArchRule}} to record the existing violations and block only new ones, then pay down the debt gradually instead of having to fix everything at once.`
  },
  'qz-architecture-019': {
    q: 'A SaaS with 2,000 small tenants uses a shared table with a {{tenant_id}} column and PostgreSQL Row-Level Security (a policy comparing {{tenant_id}} to {{current_setting(\'app.tenant_id\')}}). Which statements are correct? (Choose 2)',
    options: [
      'Schema-per-tenant with 2,000 schemas has the same migration cost as a single schema',
      'With a connection pool, the tenant must be set with {{SET LOCAL}} (or {{set_config(..., true)}}) inside each transaction; otherwise the old value may still be left over on the connection for another tenant\'s request',
      'RLS costs nothing at all and no index on tenant_id is needed',
      'The table owner bypasses RLS by default; you need {{ALTER TABLE ... FORCE ROW LEVEL SECURITY}} (and the app must not run as a superuser or a role with BYPASSRLS) for the policy to apply to that user',
      'Database-per-tenant is the cheapest option for 2,000 small tenants'
    ],
    explain: `**Correct answer: use SET LOCAL per transaction; and owner/superuser bypass RLS unless FORCE is set.**

### Why it is correct
- **SET LOCAL**: connections in a pool are reused across requests. {{SET app.tenant_id = ...}} (without LOCAL) lives until the connection closes, so a later request from a different tenant can "inherit" the old value if the code forgets to set it again; this is a serious data-leak bug. {{SET LOCAL}} automatically expires when the transaction ends.
- **The owner bypasses RLS**: per the PostgreSQL documentation, superusers and roles with BYPASSRLS always bypass RLS; the table owner also bypasses it unless the table has FORCE ROW LEVEL SECURITY enabled. Many teams test with the migration user (which is the owner), so they believe RLS is running when it is not.

### Why the other options are wrong
- **Schema-per-tenant migration cost unchanged**: every migration must run 2,000 times; a schema that fails midway creates drift; the catalog grows large and slows down.
- **RLS costs nothing, no index needed**: a policy is really just an extra WHERE condition appended to every query; without an index (usually a composite index starting with tenant_id) queries will scan a lot.
- **Database-per-tenant is cheapest**: 2,000 databases means 2,000 times the backup, monitoring, and connection pooling; it is the most expensive to operate and only fits a few large tenants that need strong isolation.

> Senior tip: the common model is a hybrid: shared schema + RLS for small tenants, and a dedicated database for a few enterprise tenants that pay for isolation. Write an integration test proving tenant A cannot read tenant B's data.`
  },
  'qz-architecture-020': {
    q: 'In code review you see a lazy singleton using double-checked locking: {{private static Config instance;}} (without {{volatile}}), a null check, into {{synchronized}}, a second null check, then {{instance = new Config()}}. What is the problem and the cleanest fix?',
    options: [
      'There is no problem; synchronized already guarantees complete safety',
      'Without volatile, another thread (reading at the first check, outside synchronized) can see a non-null reference pointing to an object that is not fully initialised; fix it with volatile, or more cleanly with the holder idiom / enum singleton',
      'The problem is that synchronized is too slow; drop synchronized entirely and check for null only once',
      'The problem is that the GC can reclaim a static instance at any time'
    ],
    explain: `**Correct answer: the missing volatile leaks a partially initialised object; use volatile or the holder idiom.**

### Why it is correct
- {{instance = new Config()}} consists of: allocating memory, running the constructor, and assigning the reference. Under the Java Memory Model, without a happens-before relationship between the writing thread (inside synchronized) and the reading thread at the first check (outside synchronized), the reader can see the reference already assigned while the fields inside are still at their default values.
- {{volatile}} establishes happens-before between the write and the read and fixes the bug. Even cleaner:
~~~java
class Config {
  private Config() { /* load */ }
  private static class Holder { static final Config INSTANCE = new Config(); }
  static Config get() { return Holder.INSTANCE; } // the JVM guarantees lazy, thread-safe initialisation
}
~~~
An enum singleton also prevents extra instances from being created through reflection and serialization.

### Why the other options are wrong
- **synchronized is enough**: only true if **every** read happens inside synchronized; the first check is outside, so it is unprotected.
- **Drop synchronized**: two threads both see null and create two instances.
- **GC reclaims statics**: an object referenced by a static field of a loaded class is not reclaimed while the class loader is alive.

> Senior tip: in a Spring application you almost never need to write a singleton yourself: beans are singleton-scoped by default and managed by the container, which also makes them easy to replace with mocks in tests.`
  },
  'qz-microservices-007': {
    q: 'Call chain: client -> A -> B -> C. The client retries up to 3 times, A calls B up to 3 times, and B calls C up to 3 times (counting the first attempt). When C dies completely, how many calls to C can a single user action produce at most?',
    options: [
      '3',
      '9',
      '27',
      '81'
    ],
    explain: `**Correct answer: 27 calls (3 x 3 x 3).**

### Why it is correct
Retries at multiple layers **multiply**:
~~~text
client: 3 calls to A
  each A: 3 calls to B          -> 9 calls to B
    each B: 3 calls to C        -> 27 calls to C
~~~
Just when C is overloaded or has just restarted, it receives 27x the load: this is a **retry storm**, which turns a small incident into a cascading failure. On top of that, each layer waits for its own timeout, so the client waits a very long time for a result that is guaranteed to fail.

### Why the other options are wrong
- **3**: counts retries at only one layer.
- **9**: forgets retries at the client (or at one service layer).
- **81**: multiplies by a layer that does not exist.

### How to design it correctly
- Retry at **one layer only** (usually the one closest to the failure, or at the edge); other layers fail fast.
- Retry with exponential backoff + jitter and a **retry budget** (e.g., retry at most 10% of requests).
- A circuit breaker to stop calling C when the error rate is high.
- **Deadline propagation**: pass the remaining deadline in a header; a downstream layer that sees the time is up does not call further.

> Senior tip: also check for hidden retries in libraries: HTTP clients, AWS SDKs, DB drivers, and service meshes (Istio) can all retry on their own. Many retry-storm incidents happen because two retry layers were enabled and nobody knew.`
  },
  'qz-microservices-008': {
    q: 'A Kafka consumer uses the default settings ({{max.poll.records=500}}, {{max.poll.interval.ms=300000}}). Processing each record requires an API call that takes about 1 second. The log keeps reporting that the consumer is leaving the group, rebalancing, and that many records are being processed again. What is the most likely cause?',
    options: [
      'session.timeout.ms is too small so heartbeats are not sent in time',
      'The topic has too many partitions',
      'The broker ran out of disk space',
      'Processing 500 records takes about 500 seconds, exceeding the 5-minute max.poll.interval.ms between two {{poll()}} calls, so the consumer is considered dead and kicked out of the group; the offset was not committed, so the batch is processed again'
    ],
    explain: `**Correct answer: the time to process one batch exceeds max.poll.interval.ms.**

### Why it is correct
- Since Kafka 0.10.1, heartbeats are sent by a background thread, while **max.poll.interval.ms** independently checks whether the app keeps calling {{poll()}}. 500 records x 1 second = 500 seconds > 300 seconds, so the consumer voluntarily leaves the group and its partitions are assigned to another consumer.
- The offset of the batch being processed was not committed, so the new consumer reads again from the old offset: duplicate processing, then another timeout, creating a rebalance loop.

Fixes (pick one or combine):
- Reduce {{max.poll.records}} (e.g., 50) so a batch finishes in about 50 seconds.
- Increase {{max.poll.interval.ms}} if processing genuinely takes that long.
- Process in parallel within a partition, carefully, or increase the number of partitions and consumers.
- The consumer must be idempotent, because reprocessing will certainly happen.

### Why the other options are wrong
- **session.timeout.ms too small**: heartbeats run on their own thread, so slow processing does not block them; the "slow processing gets you kicked" symptom is characteristic of max.poll.interval.ms.
- **Too many partitions**: does not cause a consumer to leave the group.
- **Broker out of disk**: the failure is on the producer/broker side (writes fail) and does not cause consumer rebalances.

> Senior tip: monitor the consumer's {{time-between-poll-avg}}/{{time-between-poll-max}} metrics and log the reason for leaving the group. Set max.poll.records using this formula: p99 processing time per record x number of records should stay below about 50% of max.poll.interval.ms.`
  },
  'qz-microservices-009': {
    q: 'A Kafka 3.x producer keeps the default configuration. The broker leader is slow to return the ACK, and the producer automatically retries, resending the same batch. Will the message be written twice into the partition?',
    options: [
      'No: since Kafka 3.0 the default is {{enable.idempotence=true}} and {{acks=all}}, and the broker uses the producer id + sequence number to discard retried batches; but if the application calls {{send()}} again itself (e.g., after a restart), duplicates are still possible',
      'Yes: Kafka always writes duplicates on retry; only transactions can prevent it',
      'No, because the default is acks=0 so the producer never retries',
      'Yes, because idempotence is only enabled when max.in.flight.requests.per.connection=1'
    ],
    explain: `**Correct answer: the idempotent producer blocks duplicates caused by internal retries by default, but not when the app resends.**

### Why it is correct
- KIP-679 (Kafka 3.0) changed the producer defaults to {{enable.idempotence=true}} and {{acks=all}}.
- Each producer gets a producer id (PID); every batch sent to a partition carries an increasing sequence number. The broker remembers the latest sequence per (PID, partition); if a resent batch has a sequence it has already seen, the broker returns success without writing it again.
- Limitation: a new PID is assigned when the producer restarts. If the app crashes and sends the message again from scratch, that is a new {{send()}}, and the broker cannot tell it is a duplicate. End-to-end deduplication requires idempotency on the consumer side (by business key) or a transactional producer.

### Why the other options are wrong
- **Always duplicates, need transactions**: transactions are for atomically writing to multiple partitions and for consume-transform-produce; duplicates from internal retries are already handled by idempotence.
- **Default is acks=0**: wrong; the default has been acks=all since 3.0 (it was 1 before).
- **Requires max.in.flight=1**: idempotence preserves ordering with up to 5 in-flight requests per connection; there is no need to reduce it to 1.

> Senior tip: if you set a conflicting option yourself (e.g., {{acks=1}}), idempotence will not be enabled as you expect; check the producer configuration log at startup instead of trusting "the default".`
  },
  'qz-microservices-010': {
    q: 'Order-placement saga (orchestration): step 1 reserves inventory successfully, step 2 charges the card and fails because the card has expired. What must the orchestrator do, and what properties must the compensating action have?',
    options: [
      'Roll back the distributed Inventory transaction with 2PC',
      'Call the "release inventory" compensating action for step 1; compensation must be idempotent and retryable because the call may be repeated or time out; the saga state is persisted durably so it can continue after the orchestrator restarts',
      'Do nothing and let the end-of-day cleanup job release the inventory',
      'Delete the inventory reservation record directly in the Inventory service database'
    ],
    explain: `**Correct answer: run idempotent compensation for the steps that already succeeded, with durable saga state.**

### Why it is correct
- A saga is a chain of **local transactions**, each already committed in its own service. There is no real rollback, only a business-level compensating action: "release inventory" compensates for "reserve inventory".
- Compensation may be invoked multiple times (the orchestrator times out and retries, messages are duplicated), so it must be idempotent: for example, release by {{reservationId}}, and on the second call see that it is already released and return OK.
- The orchestrator stores the state machine (STARTED, INVENTORY_RESERVED, PAYMENT_FAILED, COMPENSATING, CANCELLED) in a DB; if it crashes midway, on restart it still knows which step to do next.

### Why the other options are wrong
- **2PC**: sagas exist precisely because 2PC does not suit microservices (resources stay locked while waiting, the coordinator is a single point of failure, many systems do not support XA). Step 1 is already committed, so there is nothing left for 2PC to roll back.
- **Wait for the end-of-day job**: inventory stays reserved uselessly for hours and other customers cannot buy it; run compensation immediately, with the cleanup job only as a safety net.
- **Write directly into the Inventory DB**: it breaks data ownership and bypasses the Inventory service's business logic and events.

> Senior tip: design the step most likely to fail (payment) to run as early as possible, and the steps that cannot be compensated (shipping, sending email) to run last. A good step order dramatically reduces how often you have to compensate.`
  },
  'qz-microservices-011': {
    q: 'A Spring Boot 3 service on Kubernetes takes about 90 seconds to start (cache warm-up). When the DB is flaky for 2 minutes, every pod is restarted repeatedly. Which probe configurations are correct? (Choose 2)',
    options: [
      'The liveness probe should reflect only the app\'s internal state ({{/actuator/health/liveness}}) and must not check the DB or external services',
      'Use a single endpoint that checks the DB for both liveness and readiness to keep it simple',
      'When the liveness probe fails, the pod is only removed from the Service endpoints and is not restarted',
      'Use a startupProbe (e.g., {{failureThreshold: 30}}, {{periodSeconds: 5}}) for the 90-second startup phase instead of setting a large initialDelaySeconds on liveness',
      'Set the liveness probe timeoutSeconds to 0 for the fastest checks'
    ],
    explain: `**Correct answer: liveness checks only internal state; startupProbe covers the startup phase.**

### Why it is correct
- **Liveness** answers the question "is the process broken in a way it cannot recover from (deadlock, failed state)?". If liveness checks the DB, a flaky DB makes **every pod restart**; restarting does not fix the DB and also loses the 90-second warm-up cache, prolonging the incident. Spring Boot provides {{/actuator/health/liveness}} and {{/actuator/health/readiness}} out of the box (enabled automatically when running on Kubernetes).
- **startupProbe**: until it succeeds, liveness and readiness do not run. 30 x 5 seconds = 150 seconds allows a slow start, while after that liveness can still detect a hang quickly.

### Why the other options are wrong
- **Shared endpoint including the DB**: that is exactly what causes the mass restarts. The DB (if it must be checked at all) should only affect **readiness**, so the pod temporarily stops receiving traffic instead of being killed.
- **Liveness failure only removes the pod from the endpoints**: that is readiness behaviour; when liveness fails, the kubelet restarts the container.
- **timeoutSeconds of 0**: the minimum value is 1 second; an overly short timeout causes false failures during a GC pause.

> Senior tip: even for readiness, think twice before including the DB: if every pod is not-ready at once, the Service has no endpoints left and clients get connection errors instead of a meaningful error response. Many teams keep readiness to "the app is ready to serve" and handle DB failures with a circuit breaker.`
  },
  'qz-microservices-012': {
    q: 'Avro events on Kafka use a Schema Registry with BACKWARD compatibility (the Confluent Schema Registry default). You need to add {{voucherCode}} information to the {{OrderPlaced}} event. Which change is accepted, and in what deployment order?',
    options: [
      'Add a {{voucherCode}} field of type string with no default; deploy the producer first',
      'Rename the {{note}} field to {{voucherCode}} without declaring an alias',
      'Add a {{voucherCode}} field with a default value (e.g., the union {{["null","string"]}} with default null); with BACKWARD, upgrade consumers first and producers afterwards',
      'Change the type of the {{amount}} field from long to string so it can also hold the voucher code'
    ],
    explain: `**Correct answer: add the field with a default and upgrade consumers first.**

### Why it is correct
- **BACKWARD** means: a consumer using the new schema must be able to read data written with the old schema. Old data has no {{voucherCode}}, so the reader needs a default value to fill in. A field with a default (usually a union with null) satisfies this.
- Order: roll consumers onto the new schema first (they can still read old events), then the producer starts writing the new field.

### Why the other options are wrong
- **Add a field without a default**: a new consumer reading an old event does not know what to put in the new field, and the Schema Registry rejects registering the schema.
- **Rename without an alias**: in Avro, a rename is equivalent to deleting the old field and adding a new one without a default, which is incompatible.
- **Change long to string**: Avro has no promotion rule from long to string, so the reader cannot read old data; and changing a field's meaning is a design mistake anyway.

### Quick-reference table
| Mode | Checks | Upgrade first |
|---|---|---|
| BACKWARD | the new schema can read old data | consumer |
| FORWARD | the old schema can read new data | producer |
| FULL | both directions | either order |

> Senior tip: for a topic with many consumers across many teams, BACKWARD_TRANSITIVE or FULL_TRANSITIVE is safer because it checks against **all** old versions, not just the immediately previous one, which matters when replaying years-old data.`
  },
  'qz-microservices-013': {
    q: 'The {{payments}} topic has 12 partitions, the consumer group currently has 12 pods, and lag keeps growing at peak. The team scales to 20 pods but lag does not go down. Why, and what should they do?',
    options: [
      'Kafka needs a few hours to rebalance; just wait and the lag will drop',
      'You must switch to a different consumer group so all 20 pods receive all the messages',
      'The broker limits a topic to 12 consumers; raise that limit on the broker',
      'Within a group, each partition is assigned to at most one consumer, so 8 extra pods sit idle; increase the number of partitions (note the impact on key distribution) or make each consumer faster (batching, controlled parallel processing per key)'
    ],
    explain: `**Correct answer: the partition count is the ceiling on parallelism within a consumer group.**

### Why it is correct
- Kafka assigns each partition to exactly one consumer in the group to preserve per-partition ordering. With 12 partitions, at most 12 consumers do work; the other 8 pods are idle (they only serve as standbys for when another pod dies).
- Options:
  - Increase partitions (e.g., to 24 or 48). Note: keys are mapped with {{hash(key) % number of partitions}}, so increasing partitions sends the same key to a different partition, and per-key ordering can be disrupted during the transition.
  - Optimise processing: batch DB writes, reduce synchronous I/O, or process in parallel inside a consumer while still preserving per-key ordering (e.g., the Confluent Parallel Consumer library).

### Why the other options are wrong
- **Wait a few hours**: rebalancing takes seconds; there is no mechanism that assigns extra partitions to surplus pods.
- **Switch to another group**: each group receives **all** messages, so a new group means duplicate processing rather than load sharing.
- **Broker limits to 12 consumers**: there is no such limit; the limit comes from the partition count.

> Senior tip: when creating a topic, estimate partitions from the expected peak throughput over 1–2 years divided by what one consumer can process, then add headroom. Increasing partitions is easy; decreasing them is not possible.`
  },
  'qz-microservices-014': {
    q: 'A mobile app needs one screen that aggregates data from 5 services, with a compact payload because it runs on 3G; the admin web app needs fuller data in a different format. The shared API gateway is bloating with client-specific logic. What should you do?',
    options: [
      'Backend for Frontend (BFF): one BFF for mobile and one for web, each owned by the corresponding frontend team, aggregating and trimming data for that client\'s needs; the API gateway keeps only shared concerns (auth, rate limit, routing)',
      'Let the mobile app call the 5 services directly and aggregate the data itself',
      'Add aggregation logic for every client type to the existing API gateway',
      'Merge the 5 services into one so there is nowhere to fan out'
    ],
    explain: `**Correct answer: a Backend for Frontend split by client type.**

### Why it is correct
- Each client type has different needs (payload size, pagination style, fields to display). Putting everything into one gateway turns it into a "God service" that every team has to queue up to change.
- The BFF calls the 5 services in parallel inside the internal network (low latency) and returns one compact response to mobile, reducing the number of round-trips over a slow mobile network.
- The frontend team owns its own BFF, so changing a screen does not require waiting for the backend team.

### Why the other options are wrong
- **Mobile calls the 5 services directly**: 5 round-trips over 3G, internal structure exposed to the outside, and every service change requires an app release (users update slowly).
- **Add logic to the shared gateway**: that is exactly the problem you already have; the gateway should stay thin and handle cross-cutting concerns (auth, TLS, rate limit, routing).
- **Merge the 5 services**: it solves a presentation problem by changing domain boundaries, which is disproportionate and breaks the teams' ownership.

> Senior tip: BFFs carry risks too: business logic gradually drifts into the BFF and gets duplicated across BFFs. Keep the rule: a BFF only aggregates, trims, and transforms data; business rules belong in the domain services.`
  },
  'qz-microservices-015': {
    q: 'You are building distributed tracing for 30 Spring Boot 3 services. Which statements are correct? (Choose 3)',
    options: [
      'Spring Cloud Sleuth does not support Spring Boot 3; use Micrometer Tracing instead (bridging to OpenTelemetry or Brave)',
      'Trace context is propagated between services through headers; the Micrometer Tracing default is the W3C standard {{traceparent}}',
      'Recording 100% of traces at 50,000 RPS is always cheap, so no sampling is needed',
      'When work is handed off to another thread pool (e.g., {{@Async}} or {{CompletableFuture}} with its own executor), the trace context can be lost if the executor is not wrapped to propagate the context',
      'A timestamp in the logs is enough to stitch a request flow together across 30 services; no trace id is needed'
    ],
    explain: `**Correct answer: Micrometer Tracing replaces Sleuth; W3C traceparent; and context can be lost when switching threads.**

### Why it is correct
- Sleuth stopped at the Spring Boot 2.x line; from Boot 3, tracing moved to **Micrometer Tracing** with the bridge {{micrometer-tracing-bridge-otel}} or {{micrometer-tracing-bridge-brave}}, combined with the Observation API.
- The default propagation is W3C Trace Context: the {{traceparent}} header carries the trace id, span id, and sampled flag, which makes it compatible with other systems using OpenTelemetry.
- The trace context is kept in a ThreadLocal; when work runs on another thread and the executor is not wrapped with a context-propagation mechanism (e.g., {{ContextPropagatingTaskDecorator}} or {{ContextSnapshot}}), the new span becomes a separate trace and the chain breaks.

### Why the other options are wrong
- **Recording 100% is always cheap**: at 50,000 RPS, with a few dozen spans per request, that is millions of spans per second, and storage and network costs are enormous. Usually you use head sampling of a few percent, or tail sampling (keeping all error and slow traces) in the OpenTelemetry Collector.
- **A timestamp is enough**: with thousands of concurrent requests you cannot stitch logs together by time; you need a trace id (put it in the MDC so logs and traces can be correlated).

> Senior tip: put the {{traceId}} on every log line and in the error response header returned to the client. When a customer sends a screenshot of an error that includes the trace id, you go straight to the trace instead of searching for a needle in a haystack.`
  },
  'qz-microservices-016': {
    q: 'You need to rename the {{full_name}} column to {{display_name}} while the service runs a canary (10% of pods on the new version, 90% on the old, both sharing one database) and you must be able to roll back at any time. What is the right approach?',
    options: [
      'Run {{ALTER TABLE ... RENAME COLUMN}} in the new version\'s migration; the old version will adapt automatically',
      'Expand–contract: add the new column; the new version writes both columns and reads the new one; backfill the old data; once every pod runs the new version and is stable, stop writing the old column; finally drop the old column in a later release',
      'Stop the entire service, rename the column, deploy the new version, then start it again',
      'Create a view with the old name pointing at the new column, then drop the old column immediately in the same release'
    ],
    explain: `**Correct answer: expand–contract (parallel change) across several releases.**

### Why it is correct
During a canary, **two code versions run at the same time against the same schema**, so every schema change step must be compatible with both the old and the new code:
~~~text
Release 1 (expand):  ADD COLUMN display_name; the new code writes both, reads display_name (fallback full_name)
Backfill:            UPDATE in small batches: display_name = full_name where still null
Release 2:           every pod is on the new version -> read/write only display_name
Release 3 (contract): DROP COLUMN full_name
~~~
At any step, rolling the code back to the previous version still works because the old column is still there and is still being updated.

### Why the other options are wrong
- **RENAME immediately**: the 90% of old pods break instantly because {{full_name}} no longer exists; rolling the code back does not help either because the schema has changed.
- **Stop the whole service**: there is downtime, which contradicts the canary and zero-downtime goals.
- **View then drop the old column right away**: old code usually writes to the table, not through the view; dropping the column in the same release removes the ability to roll back.

> Senior tip: separate migrations from app startup (run them as a standalone job before deploying) and watch for locks: ADD COLUMN with a constant default on PostgreSQL 11+ only changes metadata, but a large backfill must be batched to avoid long locks and a WAL spike.`
  }
});
