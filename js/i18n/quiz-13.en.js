/*
 * English translation of js/data/quiz.js — task T410. Format: js/core/i18n.js (content overlay).
 * ids: qz-architecture-001 qz-architecture-002 qz-architecture-003 qz-architecture-004 qz-architecture-005 qz-architecture-006 qz-scenario-001 qz-scenario-002 qz-scenario-003 qz-scenario-004 qz-scenario-005 qz-scenario-006 qz-aws-001 qz-aws-002
 */
App.i18n.content({
  'qz-architecture-001': {
    q: 'You want to eliminate an if-else chain that selects a shipping fee type using the Strategy pattern in Spring. Which implementation is correct?',
    options: [
      'Make each implementation a @Component whose bean name is the lookup key, then inject Map<String, ShippingStrategy> so Spring automatically collects the beans by name',
      'Using if-else in a simple factory class is sufficient; there is no need for a pattern',
      'Use a switch expression on the shipping fee type enum',
      'Use reflection to discover the appropriate implementation by class name at runtime'
    ],
    explain: `**Correct answer: Make each implementation a @Component whose bean name is the lookup key, then inject Map<String, ShippingStrategy> so Spring automatically collects the beans by name.**

### Why this is correct
Spring supports injecting a {{Map<String, T>}} and automatically collects **all** beans of type {{T}} in the container, using the bean name as the key. As a result:
- Adding a new fee type means adding one class and one {{@Component}}; you **do not have to modify** existing code, which follows the Open/Closed Principle.
- There is no need for a manual registry, reflection, or if-else lookup logic.

~~~java
public interface ShippingStrategy {
    BigDecimal fee(Order order);
}

@Component("domestic")            // bean name = lookup key
class DomesticShipping implements ShippingStrategy { /* ... */ }

@Component("express")
class ExpressShipping implements ShippingStrategy { /* ... */ }

@Service
class ShippingService {
    private final Map<String, ShippingStrategy> strategies;   // Spring collects them automatically

    BigDecimal fee(Order order, String type) {
        ShippingStrategy s = strategies.get(type);
        if (s == null) throw new IllegalArgumentException("loại phí không hợp lệ: " + type);
        return s.fee(order);
    }
}
~~~

### Why the other options are wrong
- **if-else in a factory**: it works, but the factory must be modified whenever a new fee type is added. This violates OCP and creates a hot spot that is prone to merge conflicts.
- **switch expression**: more concise than if-else, but one place still has to be modified for every new case, and the behavior cannot be extended from another module.
- **Reflection based on class names**: brittle, difficult to maintain, creates hidden dependencies, and sacrifices type safety.

### When you should NOT use this pattern
If there are only 2–3 simple, stable if-else branches, writing them directly is clearer than adding an abstraction. The pattern is worthwhile when there are many branches, they change frequently, or different modules need to extend the behavior.

> Senior tip: for money-related business logic such as fees and prices, a missing key should **fail fast** as in the example above rather than silently falling back to a default strategy. Charging the wrong fee is worse than reporting an error. Even better, use an enum as the key and verify at startup that every enum value has a corresponding bean. A {{@SpringBootTest}} test will immediately detect duplicate bean names because the context will fail to start, as well as missing beans.`
  },
  'qz-architecture-002': {
    q: 'Which SOLID principle is violated when an interface has 20 methods, but each client actually uses only 3 methods and implementers must write throwing stubs for the rest?',
    options: [
      'Single Responsibility Principle (SRP)',
      'Dependency Inversion Principle (DIP)',
      'Liskov Substitution Principle (LSP)',
      'Interface Segregation Principle (ISP)'
    ],
    explain: `**Correct answer: Interface Segregation Principle (ISP).**

### Why this is correct
The **Interface Segregation Principle** states that clients should not be forced to depend on interfaces they do not use. When an interface has 20 methods, every implementer must implement all 20 or throw {{UnsupportedOperationException}}, and every client must be aware of 20 methods even though it calls only 3.

The practical consequences are:
- Implementers are forced to write meaningless code for the other 17 methods.
- Adding a new method to the interface is a **breaking change** for every implementer and client.
- Unit tests are harder to write because the entire interface must be mocked.

The remedy is to **split interfaces according to client roles**, creating focused interfaces so each client depends only on what it actually needs.

### Why the other options are wrong
- **SRP**: SRP states that a class should have only one reason to change. An interface with 20 methods does not necessarily violate SRP. The issue is the **number of methods clients are forced to depend on**, which is an ISP violation.
- **LSP**: LSP states that a subtype must be substitutable for its supertype without violating the contract. No substitutable inheritance relationship is being violated in this scenario.
- **DIP**: DIP states that high-level modules should not depend on concrete low-level modules but on abstractions. The interface is already an abstraction, so DIP is not the issue.

### Example of splitting interfaces
~~~java
public interface OrderReader {
    List<Order> findAll();
}

public interface OrderWriter {
    void save(Order order);
}

public interface OrderDeleter {
    void delete(Long id);
}
// A read-only client depends only on OrderReader
~~~

> Senior tip: ISP is often violated by god interfaces designed up front to cover every possible future need. Warning signs during code review include a class throwing {{UnsupportedOperationException}} from many methods, or numerous {{mock}} member variables appearing together in a test. Also note that ISP is closely related to LSP: an implementer throwing {{UnsupportedOperationException}} is itself an LSP violation. When splitting an interface, make sure all subtypes remain substitutable as before; otherwise, you will violate LSP.`
  },
  'qz-architecture-003': {
    q: 'For a Spring Boot application using hexagonal architecture (ports and adapters), which package organization is the most appropriate?',
    options: [
      'A single application package containing all controllers, services, repositories, and entities for quick access',
      'The domain package contains models and business rules; the application package contains use cases and ports (inbound/outbound interfaces); the adapter package contains controllers, consumers (which call inbound ports), and repository implementations (which implement outbound ports); all dependencies point inward',
      'Organize by technical layers such as controller, service, dao, and dto; Spring manages dependencies, so there is no need to create interfaces',
      'Organize by team, with each team owning an independent module and no shared conventions'
    ],
    explain: `**Correct answer: The domain package contains models and business rules; the application package contains use cases and ports (inbound/outbound interfaces); the adapter package contains controllers, consumers (which call inbound ports), and repository implementations (which implement outbound ports); all dependencies point inward.**

### Why this is correct
Hexagonal architecture places the **domain at the center**, with adapters on the outside. The most important rule is that **all dependencies point toward the domain**. The domain knows nothing about Spring, JPA, HTTP, or Kafka.

- **domain**: entities, value objects, domain services, and pure-Java business rules, without JPA or Spring annotations.
- **application**: defines **inbound ports** (use case interfaces such as {{PlaceOrderUseCase}}) and implements them with application services; it also defines **outbound ports** (such as {{OrderRepository}} and {{PaymentGateway}}) that infrastructure must implement.
- **adapter/inbound**: REST controllers, Kafka consumers, and schedulers **call** inbound ports, translating external requests into use case calls.
- **adapter/outbound**: repository implementations, HTTP clients, and publishers implement outbound ports.

This allows you to replace JPA with jOOQ, or switch from REST to gRPC, without touching the business logic.

### Why the other options are wrong
- **One application package containing everything**: this is simply technical-layer packaging collapsed into one package. Everything is mixed together, with tangled dependencies.
- **No interfaces are needed because Spring manages dependencies**: this misunderstands Spring's role. Spring manages *how beans are created and injected*, while hexagonal architecture governs *dependency direction* so business logic is not tied to infrastructure technologies. The two concepts complement each other; one does not replace the other.
- **Organization by team**: this is not a software architecture model but an organizational structure. Without shared architectural conventions, modules will be incompatible when they need to be integrated.

### What should you consider?
- **Apply it selectively**: do not refactor an entire legacy system at once. For a running monolith, apply it module by module or to new features.
- **Consider the cost**: every layer of abstraction adds another hop and makes debugging harder. Create ports only at boundaries that genuinely need to be replaceable, such as I/O and external systems.

> Senior tip: a sign that you are over-abstracting is having 3 interfaces and 6 classes per use case just to read one table. A pragmatic approach for a running system is to keep **domain services pure** for complex business rules, separate **repository interfaces** at data boundaries, and let Spring handle the rest. This is enough to improve testability without adding significant complexity.`
  },
  'qz-architecture-004': {
    q: 'In DDD, how do an entity, a value object, and an aggregate differ?',
    options: [
      'An entity contains only data while all business logic lives in services, and an aggregate is a set of entities stored in the same database table',
      'An aggregate is precisely a database transaction boundary, so each table is one aggregate',
      'An entity has an identity and a lifecycle, a value object only describes a value and is immutable, and an aggregate is a consistency boundary containing a root entity and its child entities',
      'Entity and value object are just two different names for the same concept'
    ],
    explain: `**Correct answer: An entity has an identity and a lifecycle, a value object only describes a value and is immutable, and an aggregate is a consistency boundary containing a root entity and its child entities.**

### Why this is correct
- **Entity**: has an **identity** that persists throughout its lifecycle. Two entities with different IDs are different things even if all their fields are identical, such as a {{Customer}} with a stable ID. An entity's attributes may change over time.
- **Value object**: has **no** identity, is defined **by its value**, and is immutable. Two instances of {{Money(100, VND)}} are equal. Changing a value means creating a new object. Examples include {{Address}}, {{Money}}, and {{DateRange}}.
- **Aggregate**: a **consistency boundary** consisting of a root entity (the aggregate root) and child entities/value objects protected together. Only the aggregate root may be used to access and modify its internal members; all changes must go through this boundary.

### Why the other options are wrong
- **Entities contain only data, and aggregates are tied to database tables**: this incorrectly describes an anemic model and confuses DDD concepts with schema design.
- **An aggregate is a transaction boundary, so each table is an aggregate**: incorrect. Business rules determine aggregate boundaries, not the number of tables. Conversely, one aggregate can span multiple tables.
- **Entity and value object are the same concept**: incorrect. They differ in identity and immutability, which is a core distinction in DDD.

### Concrete example
~~~java
// Value object: immutable and compared by value
public record Money(BigDecimal amount, String currency) {
    public Money {
        if (amount.signum() < 0) throw new IllegalArgumentException("số tiền âm không hợp lệ");
    }
    public Money add(Money other) {
        if (!currency.equals(other.currency())) throw new IllegalArgumentException("khác loại tiền");
        return new Money(amount.add(other.amount()), currency);
    }
}

// Aggregate root: maintains invariants and controls internal access
public class Order {
    private final OrderId id;
    private final List<OrderLine> lines = new ArrayList<>();
    private OrderStatus status;

    public void addLine(OrderLine line) {
        if (status != OrderStatus.NEW) throw new IllegalStateException("đơn đã xử lý không thể thêm dòng");
        lines.add(line);                 // the invariant is enforced here
    }
}
~~~

> Senior tip: overly large aggregates are a common cause of contention and poor performance because every change must lock the entire aggregate. Keep aggregate boundaries just large enough to protect invariants, usually around **one business concept**. Also avoid a misconception: immutable value objects are easy to persist in a database as a JSON column or a few simple columns, so DDD does not necessarily require a more complex data model.`
  },
  'qz-architecture-005': {
    q: 'What is an anemic domain model, and what are its consequences?',
    options: [
      'A model in which entities contain only data with getters and setters, while all business logic lives in the service layer; the consequences are bloated services, logic leaking into many places, and poor reusability',
      'A model in which entities have no fields because all data resides in DTOs',
      'A model that uses too many value objects, making the domain model cumbersome and difficult to understand',
      'A model without a repository layer, so the domain cannot access data'
    ],
    explain: `**Correct answer: A model in which entities contain only data with getters and setters, while all business logic lives in the service layer; the consequences are bloated services, logic leaking into many places, and poor reusability.**

### Why this is correct
In this model, entities become **data containers**, while services become the sole home of business rules. This is a sign that you are repeating the **transaction script** model, which predates DDD, rather than building a domain model.

The concrete consequences are:
- **Bloated services**: one service contains hundreds of lines and many intermingled business branches.
- **Duplicated rules**: the check that an order must contain at least one product may appear in 3 different services and be forgotten in a fourth.
- **Poor reusability**: when another use case or a message consumer needs the same rule, there is no natural place from which to reuse it.
- **Difficult testing**: testing a rule requires constructing the entire service and mocking every dependency instead of simply calling an entity method.

### Why the other options are wrong
- **Entities have no fields because data resides in DTOs**: this is not the definition of an anemic model. It is merely a mapping approach; it can coexist with an anemic model but is not its essence.
- **Too many value objects**: this is a consequence of overdoing DDD. It is rare and indicates an overly heavy design, not an anemic model.
- **Missing repository layer**: irrelevant. An anemic model can still have repositories as usual.

### How to improve it incrementally
~~~java
// Before: the rule lives in a service and can be bypassed from anywhere
if (order.getTotal() <= 0) throw new BusinessException("sai");

// After: the rule lives in the aggregate itself and cannot be bypassed
public void confirm() {
    if (lines.isEmpty()) throw new IllegalStateException("đơn hàng chưa có sản phẩm");
    status = OrderStatus.CONFIRMED;
}
~~~

> Senior tip: **do not refactor everything**. Start with the aggregate that has the most rules and changes most frequently, usually {{Order}} or {{Invoice}}. Gradually move rules into entities so services only orchestrate. Preserve the existing behavior and run comparison tests, because this type of refactoring is particularly easy to get wrong at the business-logic level.`
  },
  'qz-architecture-006': {
    q: 'A system has been split into 12 separate services, but they still have to be deployed together and share one database schema. What is this phenomenon called?',
    options: [
      'Pure microservices; this is precisely the goal of microservice architecture',
      'Shared kernel; this is the integration pattern DDD recommends by default between services',
      'Distributed monolith: the system has been split into multiple processes but remains tightly coupled in data and operations, so it does not gain the benefits of microservices',
      'Modular monolith; everything should immediately be merged back into a single application'
    ],
    explain: `**Correct answer: Distributed monolith: the system has been split into multiple processes but remains tightly coupled in data and operations, so it does not gain the benefits of microservices.**

### Why this is correct
True microservices require **independence** in code, data, deployment, and release cadence. When services still share one schema and must be deployed together, you get:
- Every schema change must be coordinated across 12 services, so independent deployment is impossible.
- A bug in service A can break all 11 other services during deployment, spreading the risk.
- Services cannot be scaled or fixed independently.
- Yet you still pay the costs of networking, serialization, and distributed monitoring.

In other words, you bear **all the costs** of microservices without gaining their benefits. This situation often arises when a team splits services by **technology** rather than by **business capability**.

### Why the other options are wrong
- **Pure microservices**: incorrect. Microservices require data and deployment independence.
- **Shared kernel**: this is a context-mapping pattern in DDD (Eric Evans) in which two bounded contexts deliberately share a small, carefully governed part of the domain model. It is not the default recommendation, and one database schema shared by 12 services is not a shared kernel.
- **Modular monolith, so merge everything**: merging is a reasonable option, but it is a **decision** made after analysis, not a description of the current state. Moreover, a modular monolith differs from a distributed monolith: a monolith is **one** process, whereas a distributed monolith consists of multiple coupled processes.

### How to escape this situation
1. Define clear business boundaries and **assign data ownership** to each service.
2. Replace cross-schema access with **APIs or events** between services.
3. Use **expand–contract** when separating data tables from the shared schema.
4. Separate deployment schedules: each service builds and deploys itself.

> Senior tip: measure before splitting further: how many deployments occur per month, how many releases happen simultaneously, and how often incidents spread across services. If services can never be deployed independently, that is evidence of a distributed monolith, and you should consider merging before splitting further. Costs will drop significantly, and the team will move faster.`
  },
  'qz-scenario-001': {
    q: 'An incident occurs at 22:05: the order-placement API p99 latency jumps from 200 ms to 8 seconds. What should you do first?',
    options: [
      'Immediately roll back the most recent deployment because a release has just gone to production',
      'Increase the client timeout to 30 seconds so slow requests do not report errors',
      'Increase the number of service instances to distribute the incoming traffic load',
      'Check the dashboards: error rate, dependency latency, queues, resources, and Kafka lag; then decide whether to roll back'
    ],
    explain: `**Correct answer: Check the dashboards: error rate, dependency latency, queues, resources, and Kafka lag; then decide whether to roll back.**

### Why this is correct
During an incident, time matters more than anything else, but **acting blindly is worse than acting slowly**. Rolling back when the deployment is not the cause can make things worse by losing state or persisted changes. The first step is to **gather signals** to answer three questions:
1. **Scope**: is only one endpoint affected or the whole system? One instance or all instances?
2. **Start time**: does it coincide with a deployment, a traffic spike, or an external event?
3. **Which layer is failing**: the application, a dependency, or infrastructure?

These three questions help you quickly eliminate incorrect hypotheses, especially the assumption that the deployment is responsible.

### Why the other options are wrong
- **Immediate rollback**: appropriate only when the evidence points to the new version. It is not a safely reversible action when the cause is still unknown.
- **Increase the instance count**: this adds load to an already failing system and can spread the incident by creating more connections and consuming more CPU.
- **Increase the client timeout**: this hides the symptom, keeps users waiting longer, and holds more connections open, usually making matters worse.

### Standard incident-response sequence
1. **Assess severity**: how many users are affected, and how much money is lost per minute.
2. **Mitigate**: roll back, use a feature flag to disable the broken functionality, or add capacity if the problem is purely resource exhaustion.
3. **Find the cause**: examine thread dumps, slow query logs, and traces of failed requests, and compare metrics before and after the incident.
4. **Fix and verify**: monitor metrics until they remain normal for at least several cycles.
5. **Post-mortem**: document lessons learned and add alerts for earlier detection next time.

> Senior tip: prepare **runbooks** for common scenarios such as a slow DB, cache failure, dependency failure, and connection exhaustion. Use **symptom-based alerts** rather than cause-based alerts: an alert for p99 latency > 2 seconds is more practical than one for CPU > 80%. Always record a real-time incident timeline; it is the most valuable data for the post-mortem.`
  },
  'qz-scenario-002': {
    q: 'The error log {{HikariPool-1 - Connection is not available, request timed out after 30000ms}} appears repeatedly. What are the correct cause and remedy?',
    options: [
      'Increasing maximum-pool-size to 500 is the fastest and least risky solution',
      'Pool exhaustion is usually caused by a slow query or a connection held for too long; find the query or leaking connection, set a query timeout, and enable the leak detection threshold',
      'This error always means the database has run out of disk space',
      'Simply restarting the service will resolve the problem permanently'
    ],
    explain: `**Correct answer: Pool exhaustion is usually caused by a slow query or a connection held for too long; find the query or leaking connection, set a query timeout, and enable the leak detection threshold.**

### Why this is correct
Connection pool exhaustion usually happens **not** because there are too few connections, but because **connections are held for too long**. Three common causes are:
1. **Slow queries**: a statement that runs for 30 seconds holds its connection for that entire time.
2. **Connection leaks**: a connection is borrowed but never returned because {{try-with-resources}} is missing, or manual connection-closing code has no finally block.
3. **Traffic spikes**: requests exceed processing capacity, and the pool becomes the last line of defense.

HikariCP includes a diagnostic tool: enable {{leak-detection-threshold}} to log the stack trace of the code that borrowed a connection when it is held for too long. At the same time, set a short {{connection-timeout}} of a few seconds so failures surface early instead of hanging for 30 seconds, and set a **query timeout** at the database layer.

### Why the other options are wrong
- **Increase the pool to 500**: this can make things worse. More connections mean more concurrent queries reaching the database, increasing lock and I/O contention. If slow queries are the cause, a larger pool merely increases the number of waiting requests.
- **Disk space exhaustion**: this produces errors such as "No space left on device" or "could not extend file", not a connection-exhaustion error.
- **Restarting is enough**: a restart clears the symptom, not the cause. A connection leak will recur.

### Concrete investigation steps
- Set {{leak-detection-threshold=60000}} and wait for the problem to recur so you can capture the stack trace.
- Monitor the metrics {{hikaricp.connections.pending}}, {{hikaricp.connections.active}}, and {{hikaricp.connections.idle}}.
- Enable {{spring.jpa.properties.jakarta.persistence.query.timeout}} or set a JDBC-level timeout for long-running queries.
- Inspect {{pg_stat_activity}} in PostgreSQL or {{SHOW PROCESSLIST}} in MySQL to see which statements are stuck.

> Senior tip: always keep {{maximum-pool-size}} below the database's {{max_connections}} limit, divided across the number of instances. With PostgreSQL, reserve roughly 20–30% of connections for operational tasks such as backups, migrations, and monitoring. If the application consumes them all, you will be unable to connect and diagnose the problem yourself.`
  },
  'qz-scenario-003': {
    q: 'The PM says, "Build automatic discounts for orders over 1 million." The requirement is vague. How should you handle it?',
    options: [
      'Implement your own interpretation, demo it to the PM, get feedback, and fix it afterward',
      'Wait for the PM to provide complete documentation before starting, because coding is impossible without a specification',
      'Write down the assumptions in a short specification, clarify the key points (who is eligible, the discount amount, interaction with vouchers, and refund handling), and reach agreement before coding',
      'Ask another team how they handle it and follow their approach to save time'
    ],
    explain: `**Correct answer: Write down the assumptions in a short specification, clarify the key points (who is eligible, the discount amount, interaction with vouchers, and refund handling), and reach agreement before coding.**

### Why this is correct
A vague requirement is not your fault, but **clarifying it is your responsibility**. The most professional approach is to turn the verbal request into a **short specification with explicit assumptions**, then refine it with the PM for confirmation. Questions to ask for this example include:
- Does "over 1 million" refer to the **order total** or **each product**?
- What is the discount percentage, is there a cap, and does it apply to the whole order or individual lines?
- Does it interact with vouchers or coupon codes, and which discount is applied first?
- Can it be applied retroactively to paid orders, and how are refunds handled?
- Does it apply to members or VIP customers?

This takes 30 minutes but can save days of rework.

### Why the other options are wrong
- **Implement your interpretation and demo it**: high risk, because most mistakes lie in fine-grained business rules you cannot guess. Rework is more expensive than asking first.
- **Wait for complete documentation**: in practice, documentation will never be complete unless you drive the clarification process, and waiting creates no value.
- **Ask another team**: it is difficult to know which team has relevant experience, and they only have unofficial information. Ask the actual decision-makers: the PM and business stakeholders.

### Example exchange with the PM
~~~text
Proposal: 10% off orders with a total >= 1,000,000 VND, capped at 200,000 per order.
Assumptions: (1) calculated on the order total after bulk discounts;
(2) cannot be combined with vouchers; (3) not applied retroactively to paid orders.
Please confirm these 3 assumptions before I start coding.
~~~

> Senior tip: record assumptions in **written, retrievable form**, such as a ticket, email, or business ADR. When an incident occurs, evidence that the PM agreed to an assumption protects you. Remember the classic lesson: **clarifying vague requirements is one of an engineer's most important responsibilities, not a shortcut to be avoided**.`
  },
  'qz-scenario-004': {
    q: 'You are assigned to refactor a two-year-old legacy module with no tests that is running in production for major customers. What is the best approach?',
    options: [
      'Rewrite the entire module with new technology and deploy it directly to production',
      'Start with characterization tests to lock in current behavior, add logs and metrics to understand the flows, then refactor in small steps with feature flags and a rollback path',
      'Fix only the broken parts and leave everything else unchanged because there is not enough time',
      'Ask the PM for another 6 months to rewrite it from scratch'
    ],
    explain: `**Correct answer: Start with characterization tests to lock in current behavior, add logs and metrics to understand the flows, then refactor in small steps with feature flags and a rollback path.**

### Why this is correct
With legacy code that has no tests, **the greatest risk is not knowing what you are breaking**. The correct sequence is therefore:
1. **Characterization tests** (tests describing existing behavior): write tests for behavior that *currently exists*, even strange behavior. You do not need to know whether that behavior is correct, only that it does not change. These tests are your safety net.
2. **Observe**: add logs, metrics, and tracing to understand actual flows; many code branches may never execute.
3. **Refactor in small, continuous steps**: each PR is small, runs the tests, and can be rolled back independently.
4. **Feature flags**: allow the new path to be enabled or disabled without redeploying.

### Why the other options are wrong
- **Rewrite everything and deploy directly**: this is the most common way to create a severe incident. Big-bang rewrites almost always miss deadlines and often have to be rolled back.
- **Fix only broken parts and leave the rest unchanged**: this is not an *approach* but procrastination. The risk lies in the unchanged code you do not understand, and when an incident occurs, you will not know where to start.
- **Ask for another 6 months to rewrite**: the PM will usually refuse, and even approval would not guarantee a better outcome.

### Practical experience
- **Prioritize by risk**: refactor the most frequently called code, or code involving money and data, first.
- **Safety technique**: use a **parallel run**, executing both old and new code and comparing results, for critical processing.
- **Do not refactor and change behavior at the same time**. Separate the two steps so you know whether an incident was caused by the behavior change or the refactoring.

> Senior tip: think of refactoring as a series of **small, safe, revertible PRs**. A useful personal rule is for each PR to touch only one area and contain fewer than 400 lines. Reviews and merges are faster, and if an incident occurs, bisecting will identify the exact offending PR in minutes rather than hours.`
  },
  'qz-scenario-005': {
    q: 'An integration test occasionally fails at random in CI, roughly 1 in 20 runs. What should you do?',
    options: [
      'Mark the test as @Disabled so the CI pipeline becomes green again',
      'Increase the test timeout dramatically and allow more retries',
      'Find and fix the actual root cause; temporarily mark the test as flaky in CI so it does not block deployment, but continue tracking it',
      'Delete the old test and quickly write a new one'
    ],
    explain: `**Correct answer: Find and fix the actual root cause; temporarily mark the test as flaky in CI so it does not block deployment, but continue tracking it.**

### Why this is correct
Flaky tests **undermine trust in the pipeline**: when it goes red, people ignore it, and a genuine failure will eventually be overlooked. You need **two parallel tracks**:
1. **Short term**: mark the test as flaky in the CI system, for example by declaring a list of flaky tests or retrying once and reporting separately. The pipeline stays green, but the flakiness rate is measured and alerted on rather than hidden.
2. **Long term**: find and fix the root cause.

Common causes of flaky tests include:
- **Shared data**: tests running in parallel against the same database, tables, and data cause contention.
- **Time dependencies**: using real time instead of a fake {{Clock}}.
- **Execution order**: a test depends on another test having run first.
- **Resources**: occupied ports, leftover temporary files, or containers that are not ready.

### Why the other options are wrong
- **Marking the test @Disabled**: eliminates the test's value and hides the problem; the old test will decay over time without anyone knowing.
- **Increasing the timeout and retrying many times**: usually makes matters worse. Tests become slower, CI consumes more resources, and genuine failures are hidden.
- **Deleting and rewriting**: destroys documentation of the expected behavior. For an integration test, rewriting often takes longer than finding the cause.

### Concrete approach
~~~java
@Test
void orderExpiresAfter30Minutes() {
    Clock clock = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
    orderService.placeOrder(clock, order);          // inject Clock instead of using Instant.now()
    clock = Clock.fixed(Instant.parse("2026-01-01T00:31:00Z"), ZoneOffset.UTC);
    assertThat(orderService.isExpired(clock, order)).isTrue();
}
~~~

For databases, use **Testcontainers** with a separate schema for each test worker, or roll back a transaction after each test.

> Senior tip: set an alert threshold for the flakiness rate, such as > 1% of tests, and assign an owner to address it. Without ownership, flakiness accumulates. Remember: **a flaky test hides real bugs**, which is why it deserves the time needed to fix it rather than ignore it.`
  },
  'qz-scenario-006': {
    q: 'You discover that an API key has been committed to a public git repository. What is the correct course of action?',
    options: [
      'Delete the line containing the key and commit the change, because that is sufficient',
      'Deleting the git history will remove the secret from the public repository',
      'Notify the team and wait for instructions from the security department before taking action',
      'Immediately revoke the key and issue a new one, review access logs for abuse, clean the git history if feasible, then add secret scanning to CI'
    ],
    explain: `**Correct answer: Immediately revoke the key and issue a new one, review access logs for abuse, clean the git history if feasible, then add secret scanning to CI.**

### Why this is correct
Handle a secret leak in the priority order of **containing the damage first and cleaning up afterward**:
1. **Immediately revoke** the exposed key at the provider and issue a new one. Do this **right away**, because bots scanning GitHub for secrets can find and use a key within minutes.
2. **Review the key's access logs** for abuse and check whether infrastructure has been compromised.
3. **Clean the git history** with git-filter-repo or BFG if required by policy. Remember that clones, forks, and GitHub caches may still retain the old version, so this **does not replace** step 1.
4. **Prevent recurrence**: add secret scanning such as GitGuardian, Gitleaks, or GitHub secret scanning to CI, use environment variables or a secret manager, and establish review rules that block PRs containing keys.

### Why the other options are wrong
- **Delete the line and commit again**: the old version remains in commit history, on GitHub, and in every clone. This does **not** revoke the key.
- **Delete the git history**: as noted above, cleaning history does not deactivate the key. If you only delete history without revoking it, attackers can still use it.
- **Wait for instructions from security**: this wastes valuable time. Revoking the key is unambiguously correct and harmless, so do it immediately and report afterward. If company policy requires prior notification, call or use an emergency channel rather than email.

### Preventive measures
~~~bash
# .gitignore — never commit these files
.env
*.pem
credentials.json
~~~

> Senior tip: use a **secret manager** such as AWS Secrets Manager, Vault, or encrypted Kubernetes Secrets instead of plain environment variables for sensitive secrets, and **rotate** them regularly. More importantly, apply the assume-breach principle: if a key is exposed, immediately accept the risk and act in the correct order instead of debating whether it has actually been exposed yet.`
  },
  'qz-aws-001': {
    q: 'You are choosing a compute platform for a Spring Boot API with irregular, unpredictable traffic, and cold-start latency must not exceed 1 second. Which option is the most appropriate?',
    options: [
      'AWS Lambda with a high memory configuration to optimize startup speed',
      'Amazon ECS on Fargate with a service whose min-desired-count is 1, because the container is kept warm and avoids cold starts',
      'Amazon EC2 with an Auto Scaling Group configured with min-desired-count of 0 to save costs',
      'Amazon ECS on Fargate with a desired count of 0, using EventBridge to start a task when the first request arrives'
    ],
    explain: `**Correct answer: Amazon ECS on Fargate with a service whose min-desired-count is 1, because the container is kept warm and avoids cold starts.**

### Why this is correct
The most important constraint here is a **cold start below 1 second**. For a Java application, this is a very difficult constraint for Lambda: the JVM must start, the Spring context must be created, classes must be loaded, and the JIT must warm up. Cold starts typically range from **hundreds of milliseconds to several seconds**. Even with Lambda SnapStart, the time can exceed 1 second depending on application size.

A container already running on Fargate has no first-run startup: the service always keeps at least one warm task running. EC2 instances are similar, but you must manage AMIs, patching, and scaling yourself.

### Why the other options are wrong
- **Lambda**: violates the cold-start constraint of under 1 second, especially for a large Spring Boot application. Lambda also has a maximum execution time of 15 minutes.
- **EC2 with min-desired-count of 0**: scaling from zero requires starting an instance, which takes several minutes and directly violates the constraint. A minimum of 0 is suitable for batch jobs, not latency-sensitive APIs.
- **Fargate with a desired count of 0**: scaling from zero means the first request must wait for a task to be provisioned, the image to be pulled, and Spring Boot to start. This typically takes tens of seconds to over a minute, violating the 1-second constraint. Moreover, a synchronous API cannot hold the request while EventBridge starts the task.

### Quick comparison
| Criterion | Lambda | Fargate | EC2 + ASG |
|---|---|---|---|
| Cold start | hundreds of ms to several seconds | none (task always running) | none (if min > 0) |
| Operations | none | medium | high |
| Cost at zero load | very low | medium | high |
| Portability | low (tied to the Lambda model) | high (container) | high |

> Senior tip: if you choose Lambda, use **Provisioned Concurrency**, which keeps warm instances available for a fee, or **SnapStart** for Java. Also reduce startup time with **AppCDS** (Class Data Sharing) to share loaded classes. Measure actual cold starts with a periodic measurement script rather than trusting the provider's figures.`
  },
  'qz-aws-002': {
    q: 'An application needs to upload large 2 GB files to S3 from a browser. Which implementation is best?',
    options: [
      'Read the entire file into application memory, then send a single PUT request to S3',
      'Use a presigned URL for each part of a multipart upload; parts are uploaded directly from the browser to S3 and do not pass through the application server',
      'Compress the file on the server, then upload it to S3 using the SDK',
      'Send the file through the application API, then have the application push it to SQS so S3 can receive it'
    ],
    explain: `**Correct answer: Use a presigned URL for each part of a multipart upload; parts are uploaded directly from the browser to S3 and do not pass through the application server.**

### Why this is correct
The correct architecture uses **presigned URLs**: the application server issues signed, time-limited URLs, and the browser uses them to upload directly to S3. The file **does not pass through** the application, so:
- It consumes no server bandwidth, CPU, or disk.
- Multiple parts can be uploaded in parallel using multipart upload, which is much faster.
- S3 handles the heavy load without bottlenecking the application.

For a 2 GB file, use **multipart upload** with each part at least 5 MB and at most 10,000 parts. This enables parallel uploads and allows failed parts to be **retried independently**.

### Why the other options are wrong
- **Reading the entire file into memory**: a 2 GB file will exhaust the application heap, and the request duration will exceed ALB and gateway limits.
- **Compressing on the server**: the file must still be uploaded through the server first, so the bandwidth problem remains and CPU cost increases.
- **Passing through SQS**: SQS is not a channel for transferring large data payloads; S3 is the appropriate service for large objects.

### Example flow
1. The client calls {{POST /files/upload-url}} with the file name and size.
2. The server checks permissions, then returns an {{uploadId}} and a list of presigned URLs for the parts.
3. The client uploads each part **directly to S3**, potentially in parallel.
4. The client calls {{POST /files/complete}} so the server can complete the multipart upload.
5. The server stores metadata and publishes an event through EventBridge/SNS for downstream processing such as virus scanning or image resizing.

> Senior tip: always **limit file size and part count** on the server when issuing presigned URLs, and **verify the actual size** after upload by reading {{ContentLength}} from the S3 object rather than trusting the client-supplied value. For potentially dangerous files such as user-uploaded documents and images, scan for viruses in step 5 before making the object public.`
  }
});
