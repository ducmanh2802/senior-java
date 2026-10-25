/*
 * English translation of js/data/q-system-design.js — task T196. Format: js/core/i18n.js (content overlay).
 * ids: architecture-001 architecture-002 architecture-003 architecture-004 architecture-005 architecture-006
 */
App.i18n.content({
  'architecture-001': {
    q: 'Apply SOLID in practice: show a Java code snippet that violates multiple principles and refactor it. What problem does each principle solve?',
    a: `**Summary:** SOLID is a set of principles that helps code become **easy to change** when requirements change. It is not a goal in itself: do not create an interface for every class. Its real value is reducing dependencies, reducing the domino effect when editing, and enabling unit testing of each part.

### Violating code
~~~java
public class OrderService {
    public void checkout(Order order, String paymentType) {
        // SRP: calculates payment, saves to DB, and sends email all at once
        if (paymentType.equals("CARD")) {
            cardClient.charge(order.total());
        } else if (paymentType.equals("WALLET")) {
            walletClient.debit(order.total());
        } else if (paymentType.equals("COD")) {
            // does nothing
        }
        jdbcTemplate.update("INSERT INTO orders ...");
        mailSender.send(order.email(), "Order placed successfully");
    }
}
~~~
Issues:
- **SRP:** one class has 3 reasons to change (business logic, persistence, notification).
- **OCP:** adding a new payment method requires editing the {{if/else}} chain.
- **DIP:** depends directly on concrete clients {{jdbcTemplate}}, {{mailSender}}.
- **ISP:** if everything is bundled into one large interface, clients depend on methods they do not use.
- **LSP:** creating a subclass that pretends to support payment but throws {{UnsupportedOperationException}} violates LSP.

### Refactor: separate responsibilities + abstraction dependency
~~~java
public interface PaymentGateway {
    boolean supports(String type);
    void charge(Money amount);
}

@Component
class CardGateway implements PaymentGateway {
    public boolean supports(String type) { return "CARD".equals(type); }
    public void charge(Money amount) { cardClient.charge(amount); }
}

public interface OrderRepository { void save(Order order); }
public interface Notifier { void orderConfirmed(Order order); }

@Service
public class OrderService {
    private final List<PaymentGateway> gateways;
    private final OrderRepository repository;
    private final Notifier notifier;

    public OrderService(List<PaymentGateway> gateways,
                        OrderRepository repository,
                        Notifier notifier) {
        this.gateways = gateways;
        this.repository = repository;
        this.notifier = notifier;
    }

    public void checkout(Order order, String type) {
        PaymentGateway gateway = gateways.stream()
            .filter(g -> g.supports(type))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Unsupported: " + type));
        gateway.charge(order.total());   // OCP: adding a new gateway does not change this line
        repository.save(order);
        notifier.orderConfirmed(order);
    }
}
~~~
Note: there is still a place that "knows" the list of types, but it lives inside each gateway, not in a central {{if/else}}. With a fixed set of types, Java 21 allows {{sealed interface}} + {{switch}} pattern matching — concise and the compiler verifies all branches; it is a good choice when the value set is truly fixed.

### Each principle, understood correctly
| Principle | Check question | Violation sign |
|---|---|---|
| **SRP** | How many reasons to change does the class have? | Class name contains "And", 1,000-line file, imports many layers |
| **OCP** | Does adding a feature require editing old code? | Long {{if/else}} or switch by "type" |
| **LSP** | Can the subclass replace the parent? | Throws {{UnsupportedOperationException}}, weakens postcondition |
| **ISP** | Does the interface have methods the client does not use? | 20-method interface, many empty implementations |
| **DIP** | Does it depend on abstraction or concrete details? | {{new HttpClient()}} inside service, DB driver import |

### LSP example
~~~java
class ReadOnlyList extends ArrayList<String> {
    @Override public boolean add(String s) {
        throw new UnsupportedOperationException();  // breaks the List contract
    }
}
~~~
Any function that receives {{List}} and calls {{add}} will break when passed {{ReadOnlyList}}. Fix by splitting a {{ReadableList}} interface that only has read methods, or using {{List.copyOf}} / {{Collections.unmodifiableList}} — returning a type that does not promise write capability.

### When NOT to apply heavy SOLID
- Small scripts, simple CRUD, prototypes: adding interfaces only makes reading harder.
- With DTO/record, value objects: keep it simple.
- Practical rule: **abstract when there is a second variant or when testing requires it**. Do not create {{PaymentGateway}} if the system will forever have only one gateway.
- SOLID makes change easier, but each abstraction layer is something that must be read and understood. Balance through experience and real requirements.

> Senior tip: in code review, I do not ask "does this class follow SOLID"; I ask "if we change the payment provider tomorrow, how many files must change?". That measurable answer is more useful than any theoretical definition.`,
    follow: [
      'How do you handle conflicts between two principles in a specific design?',
      'How do you convince the team not to overuse interfaces for every class?',
      'Give an example of ISP violation in a real repository interface and how to split it.'
    ],
  },
  'architecture-002': {
    q: 'Which design patterns appear inside Spring that developers often use without realizing? Explain the internal mechanism of each.',
    a: `**Summary:** Spring is a runnable set of design patterns: **Proxy** for AOP/transaction, **Template Method** for JDBC/REST, **Factory** for beans, **Strategy** for HandlerMapping, **Observer** for events. Understanding the mechanism helps avoid very hard-to-debug bugs such as self-invocation making {{@Transactional}} disappear.

### Pattern table and where they appear
| Pattern | In Spring | Why it is used |
|---|---|---|
| Singleton | Default bean scope | One shared instance, saves memory |
| Factory | {{BeanFactory}}, {{FactoryBean}}, {{@Bean}} | Hides complex initialization logic |
| Proxy | AOP, {{@Transactional}}, {{@Cacheable}}, {{@Async}} | Adds behavior without modifying original code |
| Template Method | {{JdbcTemplate}}, {{TransactionTemplate}}, {{RestTemplate}} | Fixes the framework, allows passing callbacks |
| Strategy | {{HandlerMapping}}, converter selection | Chooses algorithm by context |
| Observer | {{ApplicationEventPublisher}} + {{@EventListener}} | Separates publisher from subscriber |
| Adapter | {{HandlerAdapter}} | Many handler types, one common interface |
| Decorator | {{BeanPostProcessor}}, wrapper bean | Wraps additional responsibilities |

### Proxy: most important and most bug-prone
When you annotate {{@Transactional}}, Spring creates a **proxy** wrapping the real bean. External calls go through the proxy; the proxy opens the transaction and then calls the real method.
~~~java
@Service
public class OrderService {
    @Transactional
    public void create(Order o) {
        save(o);
        sendEvent(o);       // if this is {{this.sendEvent()}} it does NOT go through the proxy
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendEvent(Order o) { ... }
}
~~~
- Calling {{this.sendEvent()}} inside the same class is **self-invocation**: it bypasses the proxy, so {{REQUIRES_NEW}} has no effect. This is a very common production bug.
- Fix: extract to another bean, inject the proxy itself (self-injection), or use {{TransactionTemplate}} explicitly.
- Spring Boot uses **CGLIB** by default (proxy via subclass), so class/method cannot be {{final}}; if the class implements an interface, JDK dynamic proxy can be used. Neither proxies {{private}} methods.

### Template Method
{{JdbcTemplate}} fixes the entire process: get connection, create statement, handle exceptions, close resources. You only provide the changing part via a callback:
~~~java
jdbcTemplate.query(
    "SELECT id, name FROM users WHERE age > ?",
    (rs, rowNum) -> new User(rs.getLong("id"), rs.getString("name")),
    18
);
~~~
This is exactly Template Method: the algorithm framework is in the parent class; the specific step is decided by the callback/subclass. The benefit is you cannot forget to close the connection — something raw JDBC code easily misses.

### Factory
- {{BeanFactory}} is the container that creates and manages beans.
- {{FactoryBean}} allows complex creation logic: for example creating a {{DataSource}} from multiple sources and returning a proxy.
- {{@Bean}} inside {{@Configuration}} is also a factory method; Spring ensures it is called once and returns the same instance (CGLIB proxy on the configuration class).

### Strategy
{{HandlerMapping}} selects the appropriate handler for a request; there are many implementations (RequestMappingHandlerMapping, SimpleUrlHandlerMapping). This is Strategy: a common interface, multiple algorithms, selected by input data. In business code, this is the pattern to eliminate {{if/else}} (see Strategy + Map injection question).

### Observer
~~~java
publisher.publishEvent(new OrderPaidEvent(orderId));
@Component
class MailListener {
    @EventListener
    void on(OrderPaidEvent e) { mailService.sendReceipt(e.orderId()); }
}
~~~
By default events are **synchronous** in the same thread; a slow listener slows the publisher. To make it asynchronous, configure {{@Async}} + executor. An error in a synchronous listener can roll back the publisher's transaction — something to consider carefully.

### Adapter
{{HandlerAdapter}} allows {{DispatcherServlet}} to process many handler types (annotation-based, Controller interface, HttpRequestHandler) through a common interface. This is how Spring extends the servlet core without modifying it.

### Decorator and BeanPostProcessor
Spring allows wrapping a bean after initialization. For example, writing a custom {{BeanPostProcessor}} to replace a bean with a logging proxy. Be careful: too much interference in the bean lifecycle makes the system harder to understand and debug.

### Combined pitfalls
- Proxy does not apply to self-invocation, private methods, or final classes.
- {{@Transactional}} on a method called from the same class does not work.
- {{@Async}} should return {{void}} or {{Future}}/{{CompletableFuture}}; if it returns another type, the method still runs asynchronously but the caller always receives {{null}}.
- Singleton beans must be **thread-safe**; do not store request state in fields.
- Synchronous event listeners can hide latency and errors.

> Senior tip: when debugging "transaction does not roll back" or "async does not run", the first thing I check is whether the call goes through the proxy. Nine out of ten times the cause is self-invocation, not a wrong Spring configuration.`,
    follow: [
      'How do you prove a bean is being proxied during debugging?',
      'When should you use ApplicationEvent instead of calling a service directly?',
      'Spring Boot 3 uses CGLIB by default; how does that affect class design?'
    ],
  },
  'architecture-003': {
    q: 'How do you use Strategy together with Spring to eliminate long if-else chains? Show the {{Map<String, Strategy>}} injection approach and common traps.',
    a: `**Summary:** Define a Strategy interface with an identifying method, create multiple {{@Component}} implementations, then inject {{List<Strategy>}} or {{Map<String, Strategy>}} into the service. Spring automatically collects all beans of the same type; the service performs O(1) lookup instead of an {{if/else}} chain. The main traps are duplicate keys, bean ordering, and handling unsupported types.

### If/else code to replace
~~~java
public BigDecimal fee(String channel, BigDecimal amount) {
    if ("CARD".equals(channel)) return amount.multiply(new BigDecimal("0.029"));
    if ("WALLET".equals(channel)) return amount.multiply(new BigDecimal("0.01"));
    if ("BANK".equals(channel)) return new BigDecimal("2000");
    throw new IllegalArgumentException("Unknown channel");
}
~~~
Adding a new channel requires editing the method, retesting everything, and easily missing a branch.

### Strategy + Spring
~~~java
public interface FeeStrategy {
    String channel();
    BigDecimal fee(BigDecimal amount);
}

@Component
class CardFeeStrategy implements FeeStrategy {
    public String channel() { return "CARD"; }
    public BigDecimal fee(BigDecimal amount) {
        return amount.multiply(new BigDecimal("0.029"));
    }
}

@Component
class WalletFeeStrategy implements FeeStrategy {
    public String channel() { return "WALLET"; }
    public BigDecimal fee(BigDecimal amount) {
        return amount.multiply(new BigDecimal("0.01"));
    }
}

@Service
public class FeeService {
    private final Map<String, FeeStrategy> strategies;

    public FeeService(List<FeeStrategy> list) {
        this.strategies = list.stream().collect(
            Collectors.toUnmodifiableMap(FeeStrategy::channel, Function.identity()));
    }

    public BigDecimal fee(String channel, BigDecimal amount) {
        FeeStrategy s = strategies.get(channel);
        if (s == null) throw new IllegalArgumentException("Unknown channel: " + channel);
        return s.fee(amount);
    }
}
~~~
Key points:
- {{Collectors.toUnmodifiableMap}} **throws an exception if keys collide** — good, because a duplicate channel is a configuration bug that should be caught at startup, not at runtime.
- Injecting {{List<FeeStrategy>}} ensures all implementations are fetched; injecting {{Map<String, FeeStrategy>}} directly uses the **bean name** as the key, not the channel — easy to confuse.
- {{@Order}} can be used for priority, but with a map keyed by channel it is unnecessary.

### How Spring Map injection works
Spring finds all beans matching the type and injects:
- {{List<T>}}: list, can be ordered by {{@Order}} / {{Ordered}}.
- {{Map<String, T>}}: key is the **bean name**, value is the bean. If you name the class {{cardFeeStrategy}}, the key is {{cardFeeStrategy}} — not "CARD".
That is why I usually inject a List and build the map by business key manually: it is clearer and controls duplicates.

### Handling unsupported types
- Throw a clear exception; do not silently return null or zero.
- If the business allows a default, add a {{DefaultFeeStrategy}} with a special channel; but document it clearly.
- For public APIs, map the error to 400 with a list of valid values.

### Strategy vs switch expression (Java 21)
For a **fixed** value set and short logic, {{switch}} on enum/sealed type is a good choice:
~~~java
sealed interface Channel permits Card, Wallet, Bank {}
BigDecimal fee(Channel c, BigDecimal amount) {
    return switch (c) {
        case Card card -> amount.multiply(new BigDecimal("0.029"));
        case Wallet w -> amount.multiply(new BigDecimal("0.01"));
        case Bank b -> new BigDecimal("2000");
    };
}
~~~
The compiler reports if a branch is missing; the code is short and does not need DI. Strategy wins when:
- The set of types is **open** (plugin, tenant-configured).
- Each strategy has its own dependencies (client, config, repository).
- You need independent testing or feature-flag activation per type.
Do not turn every switch into Strategy — that is over-engineering.

### Real-world traps
| Trap | Consequence | Avoidance |
|---|---|---|
| Two beans with same channel | Map throws or silently overwrites | {{toUnmodifiableMap}}, startup test |
| Forgetting to register a bean | Unknown channel at runtime | Integration test for every channel |
| Using bean name as key | Wrong lookup | Build map by business key |
| Strategy holds state | Race condition | Strategy must be stateless |
| Overusing for 2 branches | More complex code | Compare with switch |

### Testing
- Unit test each strategy with specific numbers.
- Test {{FeeService}} with a mock strategy list to verify lookup and error handling.
- Test Spring context startup to catch duplicate keys — a cheap test that catches configuration errors.

> Senior tip: I always require the map to be built in the constructor and **fail fast** on duplicate keys. In one project, two teams added a "MOMO" strategy; the map silently overwrote the value, causing a partner's fee to be calculated incorrectly for two weeks — the error only appeared during financial reconciliation.`,
    follow: [
      'How do you make a strategy toggle per tenant without deploying?',
      'If each strategy needs priority, how do you design it?',
      'When do you choose enum + switch instead of Strategy?'
    ],
  },
  'architecture-004': {
    q: 'Present the package structure for Clean/Hexagonal Architecture in Spring Boot. What are the advantages and disadvantages compared to layered architecture?',
    a: `**Summary:** Clean/Hexagonal places **domain at the center**; dependencies only point inward: domain knows nothing about Spring, JPA, or HTTP. Application contains use cases and defines **ports**; adapters (web, persistence, messaging) implement ports. In exchange for clarity and testability, you pay with more mapping layers and longer code.

### Package structure
~~~text
com.example.order
+-- domain
|   +-- model          Order, OrderLine, Money (record)
|   +-- event          OrderPaid
|   +-- exception      DomainException
|   +-- port
|       +-- in         PlaceOrderUseCase (interface)
|       +-- out        OrderRepository, PaymentPort (interface)
+-- application
|   +-- service        PlaceOrderService (implements in-port)
|   +-- dto            PlaceOrderCommand
+-- adapter
|   +-- in.web         OrderController, mapper
|   +-- in.messaging   OrderEventConsumer
|   +-- out.persistence JpaOrderRepository, OrderJpaEntity, mapper
|   +-- out.payment    StripePaymentAdapter
+-- config             Spring wiring, bean configuration
~~~
There is a variant that places ports inside application rather than domain; what matters is the **dependency direction**, not the folder name.

### Dependency rule
~~~text
adapter in --> application/domain <-- adapter out
                    ^
                    |
                 config (Spring)
~~~
- Domain does not import {{org.springframework}}, {{jakarta.persistence}}, {{com.fasterxml.jackson}}.
- Application only depends on domain + port interfaces.
- Adapters depend on domain/application; never the reverse.
If domain imports JPA annotations, you have tied domain to infrastructure and lost most of the benefit.

### Example use case
~~~java
public interface PlaceOrderUseCase {
    OrderId place(PlaceOrderCommand cmd);
}

@Service
public class PlaceOrderService implements PlaceOrderUseCase {
    private final OrderRepository orders;      // out-port
    private final PaymentPort payments;        // out-port
    private final DomainEventPublisher events; // out-port

    public PlaceOrderService(OrderRepository orders,
                             PaymentPort payments,
                             DomainEventPublisher events) {
        this.orders = orders;
        this.payments = payments;
        this.events = events;
    }

    @Override
    public OrderId place(PlaceOrderCommand cmd) {
        Order order = Order.create(cmd.customerId(), cmd.lines());
        payments.authorize(order.total());     // calls outward through port
        orders.save(order);
        events.publishAll(order.pullEvents());
        return order.id();
    }
}
~~~
The service does not know whether payment is Stripe or Momo, nor whether persistence is JPA or MongoDB. Changing adapters does not require modifying the use case.

### Mapping between layers
- Web DTO → Command: validates format, does not validate business rules.
- Command → Domain: builds entity/value object; domain enforces its own invariants.
- Domain → JPA entity: separate mapper. Many people skip this by using JPA entities as domain — faster but ties domain to JPA and makes testing harder.
- Domain → Response DTO: do not expose entities externally (lazy loading, leaking internal fields, coupling API to DB).

### Advantages
- **Test domain without Spring**: fast, stable, no DB needed.
- **Easy infrastructure swap**: change payment provider, DB, or message broker by adding a new adapter.
- **Clear boundaries**: business rules live in one place, not scattered across controllers/services/JPA listeners.
- **Supports modularization**: each module has its own ports, making future service extraction easy.
- **Legacy migration**: write a new adapter while keeping domain clean.

### Disadvantages
- **More code**: mappers, DTOs, interfaces. For simple CRUD, this cost is not worth it.
- **Harder trace for newcomers**: controller → use case → port → adapter path is longer.
- **Pressure to use JPA entity as domain** for convenience; without discipline, architecture degrades into layered with a different name.
- **Transaction boundary** must be placed correctly: usually in the application service, not in domain (domain knows nothing about transactions).
- **Over-engineering** when domain is simple: 3 tables, no complex rules.

### Comparison with layered
| Criterion | Layered | Clean/Hexagonal |
|---|---|---|
| Dependency | Service calls repository, controller calls service; domain often depends on JPA | Only points inward |
| Domain test | Needs many mocks, sometimes DB | Pure unit tests |
| Initial speed | Fast | Slower |
| Complex business rules | Rules scattered, invariants hard to protect | Domain centralized |
| Simple CRUD | Fits well | Overkill |

### Practical adoption
- Start with **modular monolith**: package by business module, each module has internal domain/application/adapter.
- Only create ports when there is real variation or when a testing seam is needed. Do not create a port for every repository if you accept DB-based testing.
- Keep domain clean for important modules (billing, pricing); allow simplicity in auxiliary modules (admin CRUD).
- Use ArchUnit to **automatically enforce dependency direction** in CI; without automation, architecture will be broken within a few sprints.

> Senior tip: I once saw a project claiming "Clean Architecture" where domain imported JPA and controllers returned entities directly — the architecture existed only on a diagram. If you decide to adopt it, write an ArchUnit test on day one; automated discipline is more reliable than human discipline.`,
    follow: [
      'Where do you place the transaction boundary in hexagonal architecture and why?',
      'How do you avoid domain/JPA entity mapping becoming a burden?',
      'What ArchUnit rules should be enforced for this structure?'
    ],
  },
  'architecture-005': {
    q: 'DDD: distinguish entity vs value object, aggregate vs domain event. How do you choose aggregate boundaries and manage transactions across aggregates?',
    a: `**Summary:** **Entity** has identity over time; **value object** has no id, is immutable, and equality is by value. **Aggregate** is a cluster of entities/value objects protected by a root; it is the **consistency and transaction unit**. Between aggregates, reference by id only and maintain eventual consistency through **domain events**. Rule: one transaction modifies only one aggregate.

### Entity vs Value Object
| Criterion | Entity | Value Object |
|---|---|---|
| Identity | Has id, exists over time | No id, describes value |
| Equality | By id | By all attributes |
| Mutability | State can change | Should be immutable; create a new one to change |
| Example | Order, Customer, Account | Money, Email, Address, DateRange |
| DB storage | Separate table or inside aggregate | Usually embedded |

~~~java
public record Money(long amountMinor, String currency) {
    public Money {
        if (amountMinor < 0) throw new IllegalArgumentException("negative");
        if (currency == null || currency.length() != 3) throw new IllegalArgumentException("currency");
    }
    public Money plus(Money other) {
        if (!currency.equals(other.currency)) throw new IllegalArgumentException("currency mismatch");
        return new Money(amountMinor + other.amountMinor, currency);
    }
}
~~~
{{Money}} has no id, validates invariants on creation, and addition returns a new instance. Comparing {{new Money(100, "USD").equals(new Money(100, "USD"))}} is true — correct value semantics.

### Aggregate
An aggregate is a consistency boundary. All changes go through the **aggregate root**; outsiders must not modify child entities directly.
~~~java
public class Order {                    // aggregate root
    private final OrderId id;
    private final List<OrderLine> lines;
    private OrderStatus status;
    private long version;               // optimistic locking

    public void addLine(ProductId productId, Money price, int qty) {
        if (status != OrderStatus.DRAFT) throw new IllegalStateException("locked");
        if (qty <= 0) throw new IllegalArgumentException("qty");
        lines.add(new OrderLine(productId, price, qty));
        // invariant: total is always derived from lines, not stored separately
    }

    public Money total() {
        return lines.stream().map(OrderLine::subtotal)
                    .reduce(Money.zero("USD"), Money::plus);
    }
}
~~~
- Invariants are protected in the root: for example, "do not add a line when the order is locked", "total matches the lines".
- Child entities ({{OrderLine}}) have no separate repository; modifications must go through Order.
- The smaller the aggregate, the better: less contention, less data loaded, easier caching.

### Choosing aggregate boundaries
Questions to decide:
1. **What must be immediately consistent?** If two things must be correct together in one transaction, they may share an aggregate.
2. **What changes independently?** If frequency and actors differ, split them.
3. **Is there high write contention?** Grouping too much creates long locks and reduces throughput.
4. **Is the full set needed for work?** If only a part is needed, the boundary may be wrong.

Examples:
- **Order + OrderLine**: same aggregate. Total and status must be consistent with lines.
- **Order and Customer**: different aggregates. Order references {{CustomerId}}, not the full Customer object. Changing a customer's address does not lock Order.
- **Order and Inventory**: different aggregates, often different services. Decrease inventory through event/saga, not shared transaction.
- **Product + Price**: depends on business rules; if price must be fixed at order time, OrderLine stores a **copy of the price** (value object) rather than referencing Product.

### Domain event
A domain event is something that happened in the domain, named in the past tense: {{OrderPlaced}}, {{PaymentCaptured}}. It separates side effects from the aggregate:
- The aggregate only records the event in an internal list.
- The application service publishes after the transaction commits.
- Consumers handle email, update read models, adjust inventory.

**Do not publish events directly to a broker while the aggregate is processing** — if the transaction rolls back, the event will be wrong. Use the **outbox pattern**: write the event into an outbox table in the same transaction, and a relay reads and publishes afterward.

~~~sql
CREATE TABLE outbox (
  id BIGSERIAL PRIMARY KEY,
  aggregate_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);
~~~
The relay reads {{published_at IS NULL}} in batches, publishes, and marks it. At-least-once delivery requires idempotent consumers.

### Transaction across aggregates
Rule: **one transaction = one aggregate**. If consistency is needed between two aggregates:
1. **Saga/process manager**: a sequence of steps, each in its own transaction, with compensation on failure.
2. **Eventual consistency with domain events**: aggregate A writes + emits event; aggregate B updates later.
3. **Accept an intermediate state** and show it to the user ("processing").

Example order placement: Order is created as PENDING, emits {{OrderPlaced}}; Inventory reserves; if failure, emit {{OrderCancelled}} and Order becomes CANCELLED. Do not combine Order and Inventory in one transaction — that creates coupling and cross-locks.

### Aggregate and JPA
- Use {{@Version}} for optimistic locking; handle {{OptimisticLockException}} with retry or conflict reporting.
- Avoid {{@OneToMany(cascade = ALL, orphanRemoval = true)}} on huge collections: loading an aggregate with 100k lines is a disaster. Keep aggregate size bounded.
- Do not inject repositories into entities. Entities should not call the DB; the application service coordinates.
- Lazy loading outside a transaction causes {{LazyInitializationException}}; fix by fetching only what is needed or using DTO projections, not by opening sessions arbitrarily.

### Pitfalls
| Pitfall | Consequence | Avoidance |
|---|---|---|
| Aggregate too large | Slow load, long locks | Split by real invariant |
| Referencing objects instead of ids | Cascade load, coupling | Only keep ids between aggregates |
| Calling repository inside entity | Domain depends on infrastructure | Move coordination to service |
| Publishing event before commit | Wrong event on rollback | Outbox, publish after commit |
| Multiple aggregates in one transaction | Cross-lock, deadlock | Saga/eventual |
| Anemic domain | Invariants scattered | Put behavior inside aggregate |

### When DDD is not needed
Simple CRUD, reporting, admin tools: entity + service is enough. DDD has high cognitive cost; invest only when business rules are complex, there are many invariants, many actors, and frequent changes. Do not turn every table into an aggregate.

> Senior tip: the question I use to test DDD understanding is "if two people order the same last product at the same time, where is the transaction?". Answering "combine Order and Inventory in one transaction" shows lack of boundary understanding; answering "two aggregates, reserve via saga/event and DB constraint" is the answer from someone who has actually operated a real system.`,
    follow: [
      'How do you choose aggregate size when there is a very large collection?',
      'How do you handle optimistic lock conflict without showing an error to the user?',
      'When should you use a process manager instead of choreography with events?'
    ],
  },
  'architecture-006': {
    q: 'How do you manage technical debt and refactor a running production legacy codebase without causing incidents?',
    a: `**Summary:** Technical debt must be **visible, measurable, and paid down gradually** — not through a rewrite campaign. Main tools: characterization tests before fixing, strangler fig / branch by abstraction for gradual replacement, feature flags for control, and small PRs. Big-bang rewrites are the most common way to fail.

### Making debt visible
- **Debt register**: each item records description, risk, estimated cost, impact, and owner. Attach to backlog; do not keep it in heads only.
- **Hotspot analysis**: combine complexity (cyclomatic, cognitive) with change frequency (git churn). Files that are both complex and frequently edited are top priority.
- **SonarQube/SpotBugs**: code smells, duplication, coverage. Do not turn them into rigid KPIs — that creates gaming.
- **Production incidents**: link each incident to contributing debt; this is the most convincing evidence for the business.
- **Onboarding time**: where new people lose days is real debt.

### Before fixing: build a safety net
Legacy code often lacks tests. Write **characterization tests** (golden master) to capture current behavior — including bad behavior, if it is a contract with clients.
~~~java
@Test
void goldenMaster_pricing() {
    // record current output for 200 representative inputs
    for (TestCase tc : fixtures()) {
        assertEquals(tc.expected, legacyPricer.price(tc.input));
    }
}
~~~
- This test does not claim the behavior is **correct**, only that it **does not change** during refactoring.
- For code hard to test due to static/global state, create a **seam**: add an interface or parameter for injection.
- If testing is impossible, refactor in very small steps with rollback capability.

### Replacement strategies
| Strategy | How | When to use |
|---|---|---|
| Boy scout rule | Small improvement in the code you are already editing | Default, continuous |
| Strangler fig | Build new path in parallel, shift traffic gradually, turn off old path | Replace large module, rewrite part by part |
| Branch by abstraction | Create interface, two implementations, switch by flag | Replace algorithm/library |
| Dark launch / shadow | Run new code in parallel, compare results, not serving yet | High risk, needs verification |
| Freeze + refactor | Stop adding features to the module, clean up completely | Small, well-scoped debt |

### Strangler fig in practice
1. Place a **facade/proxy** in front of the old module, route by traffic % or tenant.
2. Build the new module with full tests.
3. Shift 1% → 10% → 50% → 100%, tracking error rate, latency, and business metrics.
4. Keep rollback capability via flag throughout the process.
5. Once stable, delete old code and temporary facade.

Do not move everything at once; each step must have success criteria and observation time.

### Branch by abstraction
~~~java
public interface TaxCalculator { Money tax(Order o); }

@Component
class LegacyTaxCalculator implements TaxCalculator { ... }

@Component
class NewTaxCalculator implements TaxCalculator { ... }

@Component
class TaxCalculatorRouter implements TaxCalculator {
    private final TaxCalculator legacy;
    private final TaxCalculator modern;
    private final FeatureFlags flags;

    public Money tax(Order o) {
        // flag per tenant, can be turned off instantly if error
        return flags.newTax(o.tenantId()) ? modern.tax(o) : legacy.tax(o);
    }
}
~~~
This is the seam to run in parallel and compare. Log both results in shadow mode to detect differences before switching traffic.

### Small and safe PRs
- One PR does one thing: rename, extract method, add test, or move code. Do not mix refactoring with new features.
- Separate mechanical refactoring (rename, extract) commits from behavioral changes for easier review.
- Run automated tests + careful review of behavior-changing parts.
- Avoid "refactor the whole package" in a giant PR — nobody can review it.

### Measuring results
- Lead time, deploy frequency, change failure rate, MTTR.
- Bugs related to the module, onboarding time.
- Module coverage after refactoring (not total repo coverage).
- Latency/resource if refactoring for performance.
Without measurement, debt will be cut when there is a deadline — always.

### When to rewrite
Only rewrite when:
1. Long-term maintenance cost exceeds rewrite cost **including risk**.
2. Parallel operation and gradual migration are possible.
3. The team has enough capacity and time, without feature pressure.
4. There is a data plan: migration, dual-write, backfill, rollback.
Big-bang rewrites usually take 2–3 times the estimate and miss hidden business rules — rules that no one wrote down but customers depend on.

> Senior tip: I always talk to stakeholders in risk language, not code language: "this module caused 40% of incidents in 6 months, each incident costs 2 hours and affects 5,000 users". With numbers, getting time for refactoring is much easier than saying "the code is bad".`,
    follow: [
      'How do you persuade a product owner to sacrifice 20% capacity for refactoring?',
      'How do you write characterization tests for code that depends heavily on time and randomness?',
      'When do you decide to fully delete the old module after traffic migration?'
    ],
  }
});
