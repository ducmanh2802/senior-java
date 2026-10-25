/*
 * English translation of js/data/q-system-design.js — task T199. Format: js/core/i18n.js (content overlay).
 * ids: architecture-012 architecture-013 architecture-014 architecture-015 architecture-016 architecture-017 architecture-018
 */
App.i18n.content({
  'architecture-012': {
    q: 'What is the Proxy pattern and how does Spring use it for @Transactional, @Async, @Cacheable, @Lazy? Why does calling a @Transactional method from within the same class not trigger a transaction?',
    a: `**Summary:** A proxy is an object placed in front of the real object with the **same interface**, intercepting the call to add behavior (open a transaction, run async, read cache, lazy initialization) and then forwarding. Spring creates the proxy at bean creation time (BeanPostProcessor), using **JDK dynamic proxy** when following an interface or **CGLIB subclass** (default in Spring Boot). Because the proxy is **outside** the object, a call like {{this.method()}} inside the class goes straight to the real object, bypassing the proxy, so the annotation has no effect.

### Hand-written proxy to understand the mechanism
~~~java
public interface TransferService { void transfer(String from, String to, BigDecimal amt); }

TransferService target = new TransferServiceImpl();
TransferService proxy = (TransferService) Proxy.newProxyInstance(
    TransferService.class.getClassLoader(),
    new Class<?>[] { TransferService.class },
    (p, method, args) -> {
        long start = System.nanoTime();
        try {
            return method.invoke(target, args);           // call the real object
        } finally {
            log.info("{} took {} us", method.getName(), (System.nanoTime() - start) / 1000);
        }
    });
~~~
{{@Transactional}} works the same way: the interceptor opens a transaction before {{invoke}}, commits if successful, rolls back on a RuntimeException (default), then returns the result.

### Where Spring uses proxies
| Feature | What the proxy does |
|---|---|
| {{@Transactional}} | TransactionInterceptor: begin, commit/rollback |
| {{@Async}} | Pushes the call to an executor, returns immediately |
| {{@Cacheable}} | Looks up the cache by key; on a hit it doesn't call the method |
| {{@Lazy}} at injection point | Injects a proxy; the real bean is only created on the first call |
| {{@Configuration}} | The class is CGLIB-enhanced so that calling {{@Bean}} methods multiple times still returns the same singleton |
| Spring Data repository | The interface has no implementation class; the proxy generates the query |
| Hibernate lazy loading | {{getReferenceById}} and LAZY relationships return a proxy; access triggers the query |

### JDK proxy vs CGLIB
| | JDK dynamic proxy | CGLIB |
|---|---|---|
| How it works | Implements the interface | Generates a subclass of the class |
| Requirement | Bean has an interface | Class and methods are not {{final}} |
| Inject by implementation class | Fails (proxy is not that type) | Works |
Spring Boot defaults to {{spring.aop.proxy-target-class=true}}, so CGLIB is used even when there is an interface, avoiding injection errors by class type.

### Self-invocation
~~~java
@Service
public class StatementService {
    public void importAll(List<File> files) {
        for (File f : files) importOne(f);    // this.importOne -> does NOT go through the proxy, no separate transaction
    }
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void importOne(File f) { ... }
}
~~~
Fixes, in priority order:
1. Move {{importOne}} to a separate bean (usually the better design).
2. Use {{TransactionTemplate}} to manage transactions with explicit code.
3. Self-inject via {{@Lazy}} or {{ObjectProvider}} (works but is hard to read).
4. AspectJ weaving (compile/load time) doesn't use proxies, avoiding the issue, but increases build complexity.

### Other traps with the same root cause
- {{private}} methods are never intercepted by the proxy. Starting with Spring 6, with class-based proxy, protected/package-private methods are also supported for {{@Transactional}}, but public is still the safest approach.
- {{final}} methods (or final classes, e.g. Kotlin default) can't be overridden by CGLIB: the annotation silently doesn't run.
- Calling a method in the constructor or {{@PostConstruct}}: at that point the proxy hasn't been wrapped yet, or the call is on the real object.
- Manually creating {{new MyService()}}: it's not a bean, so there is no proxy.

### Common wrong answers
- "Spring modifies my class's bytecode to add transactions." Not true — by default it's a proxy wrapping from the outside (unless configured with AspectJ).
- "Putting {{@Transactional}} on a private method works." It has no effect and produces no error.

> Senior tip: when debugging "transaction didn't roll back" or "cache isn't working", I check the class of the injected bean: a name containing {{$$SpringCGLIB$$}} confirms there's a proxy. Then I check whether the call goes through that bean reference. Nine times out of ten the problem is self-invocation or a swallowed exception.`,
    follow: [
      'Does a checked exception cause @Transactional rollback? How is rollbackFor configured?',
      'What is the proxy ordering when a method has both @Transactional and @Cacheable?',
      'Why does @Async on a method that returns void make exceptions disappear, and how do you handle it?'
    ],
  },
  'architecture-013': {
    q: 'Distinguish Adapter, Facade and Decorator in a partner integration scenario: the system calls an e-wallet SDK, adds retry/metrics, and provides a public account-opening API that calls 4 backend systems.',
    a: `**Summary:** The distinction is by **intent and interface**. **Adapter** converts the interface of an existing component (partner SDK) into the interface our code expects. **Decorator** keeps the same interface and wraps it to add behavior (retry, metrics, logging), and can be stacked. **Facade** creates a new, simpler interface in front of multiple subsystems (eKYC, core banking, card issuance, notification). Proxy also keeps the same interface like Decorator, but its purpose is access control (lazy, security, remote), not adding features.

### Adapter: partner SDK to our port
~~~java
public interface WalletGateway {                       // port defined by our domain
    PaymentResult charge(PaymentCommand cmd);
}

@Component
class AcmeWalletAdapter implements WalletGateway {    // AcmeWalletSdk: partner SDK
    private final AcmeWalletSdk sdk;
    AcmeWalletAdapter(AcmeWalletSdk sdk) { this.sdk = sdk; }

    public PaymentResult charge(PaymentCommand cmd) {
        AcmeRequest req = new AcmeRequest(cmd.orderId(), cmd.amount().longValueExact()); // VND -> long
        AcmeResponse res = sdk.createPayment(req);
        return switch (res.code()) {                    // translate partner error codes to our language
            case "0"  -> PaymentResult.success(res.transId());
            case "9"  -> PaymentResult.pending(res.transId());
            default   -> PaymentResult.failed(res.code(), res.message());
        };
    }
}
~~~
Benefit: the partner's data types, error codes, and exceptions don't leak into our domain. Changing the partner means writing a new adapter.

### Decorator: add behavior, keep the interface
~~~java
class MeteredWalletGateway implements WalletGateway {
    private final WalletGateway inner;            // wraps any WalletGateway
    private final MeterRegistry registry;
    MeteredWalletGateway(WalletGateway inner, MeterRegistry registry) { this.inner = inner; this.registry = registry; }

    public PaymentResult charge(PaymentCommand cmd) {
        return Timer.builder("wallet.charge").register(registry)
                    .record(() -> inner.charge(cmd));   // adds measurement, doesn't change result
    }
}
// Stack: new MeteredWalletGateway(new RetryingWalletGateway(adapter), registry)
~~~
**Stacking order matters:** metrics wrapping the outside measures total time including retries; wrapping inside measures each individual call. Retry is only safe when the partner supports idempotency (the same orderId doesn't deduct twice). In practice, decorators like this are often implemented with libraries such as Resilience4j rather than written by hand.

### Facade: one API for multiple systems
~~~java
@Service
public class AccountOpeningFacade {
    // eKyc, coreBanking, cardIssuing, notifier: 4 clients to 4 systems
    public OpeningResult open(OpeningRequest req) {
        KycResult kyc = eKyc.verify(req.idCard(), req.selfie());
        String cif = coreBanking.createCustomer(kyc);
        String accountNo = coreBanking.openAccount(cif, req.product());
        cardIssuing.requestDebitCard(cif, accountNo);
        notifier.welcome(req.phone(), accountNo);
        return new OpeningResult(cif, accountNo);
    }
}
~~~
Clients (mobile app, BFF) only know {{open()}}. A facade doesn't prevent calling subsystems directly; it only provides a simpler path. Note: a facade calling 4 systems sequentially must think about partial failures (CIF created but card issuance fails) → needs saga/compensation steps or a process state to resume.

### Comparison table
| | Adapter | Decorator | Facade | Proxy |
|---|---|---|---|---|---|
| Interface | Converts to a different one | Keeps the same | Creates a new, simpler one | Keeps the same |
| Wraps how many | One object | One object, stackable | Multiple subsystems | One object |
| Purpose | Compatibility | Add behavior | Hide complexity | Control access |
| JDK/Spring examples | {{InputStreamReader}}, {{HandlerAdapter}} | {{BufferedInputStream}} | {{JdbcTemplate}} hides raw JDBC | Proxy of {{@Transactional}} |

### Common wrong answers
- "Adapter and Facade are both wrappers, so they're the same." Different in number and purpose: adapter makes one interface match, facade simplifies a whole system.
- "Decorator uses inheritance." Decorator uses **composition**; inheritance for adding behavior explodes the number of subclasses for each combination (retry + metrics, metrics only, etc.).
- Facade becomes a god service that contains business logic: a facade should only orchestrate.

> Senior tip: in banking integrations, I require that adapters are the **only** place that knows the partner's error codes, and every mapping must have a test with real sandbox responses from the partner. When the partner adds a new error code, the bug stays contained to one class instead of spreading across the codebase.`,
    follow: [
      'Where do you place retry: in the decorator, in the HTTP client, or in the message queue? What are the selection criteria?',
      'When the facade fails at step 3, how do you design it so the customer can continue instead of starting over?',
      'Does Spring have a clean way to declare a decorator chain without nested new statements?'
    ],
  },
  'architecture-014': {
    q: 'How are IoC, Dependency Injection, and Dependency Inversion Principle different? Can you use DI and still violate DIP?',
    a: `**Summary:** **IoC** (Inversion of Control) is a broad idea: the framework controls the flow and calls your code ("don't call me, I'll call you"). **DI** is a concrete technique to implement IoC for providing dependencies: the object receives its dependencies from the outside instead of creating them with {{new}}. **DIP** is a design principle (the "D" in SOLID): high-level modules should not depend on low-level modules; both should depend on abstractions, and **the abstraction belongs to the high-level side**. You can use DI and still violate DIP: injecting a concrete lower-level class directly into the domain.

### IoC: broader than DI
Examples of IoC that don't involve DI:
- A Servlet container calls your {{doGet}}; you don't write a loop to accept requests.
- {{@KafkaListener}}: the framework polls and calls your method.
- Template Method: the parent class calls the subclass hook.
The common point: flow control belongs to the framework/framework structure, and your code is just "plugged in".

### DI: technique for providing dependencies
~~~java
// No DI: creates dependency itself, can't change in tests
class TransferService {
    private final AccountRepository repo = new JdbcAccountRepository(dataSource);
}

// DI via constructor: whoever creates TransferService decides which repo
class TransferService {
    private final AccountRepository repo;
    TransferService(AccountRepository repo) { this.repo = repo; }
}
~~~
DI **doesn't require a container**: wiring it yourself in {{main}} or in a test with {{new TransferService(fakeRepo)}} is still DI. Spring just automates it.

Prefer constructor injection: the field is {{final}}, dependencies are mandatory and visible, and no container is needed for testing. Field injection ({{@Autowired}} on a field) hides dependencies and only works inside the container. Starting with Spring Boot 2.6, circular references between beans are forbidden by default ({{spring.main.allow-circular-references=false}}); encountering this error means you should fix the design rather than turning it back on.

### DIP: direction of dependency
~~~text
VIOLATES DIP (even with DI):                 FOLLOWS DIP:
domain.TransferService                       domain.TransferService
   | inject                                     | depends on
   v                                            v
infra.JdbcAccountRepository                domain.AccountRepository (interface, owned by domain)
                                              ^
                                              | implements
                                           infra.JdbcAccountRepository
~~~
On the left, Spring still injects (there is DI), but the domain imports the infrastructure package: changing JDBC to JPA requires changing the domain. On the right, the dependency arrow points **into** the domain from infrastructure — that's the "inversion". A critical detail many miss: the interface lives in the **domain package** and is named according to domain needs ({{AccountRepository.findForUpdate}}), not a generic interface defined by infrastructure.

### Comparison table
| | IoC | DI | DIP |
|---|---|---|---|---|
| Type | Principle / framework architecture style | Technique | Design principle |
| Answers the question | Who controls the flow? | Where do dependencies come from? | Which direction do dependencies point? |
| Needs a container | No | No | No |
| Examples | Servlet, listener, template method | Constructor injection | Port in domain, adapter in infra |

### Common wrong answers
- "IoC and DI are the same thing — they're Spring." Spring is an IoC container that uses DI; the concepts predate Spring and are independent.
- "Having an interface achieves DIP." Not true: if the interface lives in the infrastructure layer and the domain imports it, the dependency direction is still wrong.
- "Every service needs an interface." DIP applies at **boundaries** (domain with infrastructure, with partners); internal services with a single implementation don't need interfaces.

> Senior tip: the fastest DIP check is to look at the imports in the domain package: seeing {{org.springframework.jdbc}}, {{jakarta.persistence}}, or a partner SDK is a red flag. I put this rule into an architecture test (ArchUnit) so no one has to remember it.`,
    follow: [
      'A service constructor has 9 parameters: how do you handle it?',
      'Why is field injection harder to test, and what risk does it have with null beans?',
      'In Hexagonal Architecture, how do ports and adapters relate to DIP?'
    ],
  },
  'architecture-015': {
    q: 'What does "Composition over inheritance" mean in practice? Give an example of an inheritance tree that hurts in business code and how you would refactor it.',
    a: `**Summary:** Inheritance tightly couples the subclass to the **implementation details** of the parent (fragile base class) and can only extend in one dimension; when business needs change along multiple independent axes (product type × fee × limit × channel), the number of subclasses explodes. Composition separates each dimension of change into its own object (policy/strategy) that is assembled together, allowing runtime changes and independent testing. Inheritance is still appropriate when there is a true "is-a" relationship and the parent class is **designed to be inherited**; Java 17 sealed interfaces + records are a safe way to model data-variant trees.

### Harmful example: deposit product inheritance tree
~~~text
AbstractAccount
 |-- SavingsAccount
 |    |-- OnlineSavingsAccount          (different fee)
 |    |-- OnlineSavingsWithdrawAnytime  (allows early withdrawal)
 |-- CurrentAccount
      |-- CurrentAccountOverdraft
      |-- CurrentAccountOverdraftPremium (free + overdraft)
~~~
Each product is a combination of: interest calculation method, fee schedule, withdrawal rules, limits. Inheritance only lets you choose **one** axis; the other axes get copied or stuffed into the parent with boolean flags like {{if (isPremium)}}. Changing {{AbstractAccount.withdraw()}} for one product can break five others.

### Fragile base class: classic example
~~~java
class CountingSet<E> extends HashSet<E> {
    int added = 0;
    @Override public boolean add(E e) { added++; return super.add(e); }
    @Override public boolean addAll(Collection<? extends E> c) { added += c.size(); return super.addAll(c); }
}
// addAll(3 elements) -> added = 6, because HashSet.addAll internally calls the overridden add()
~~~
The subclass depends on the parent calling which internal method, something not in the public contract and that can change between versions.

### Refactoring to composition
~~~java
public interface InterestPolicy { BigDecimal monthlyInterest(BigDecimal balance); }
public interface FeePolicy      { Money withdrawalFee(Money amount, Channel channel); }
public interface WithdrawalRule { void check(Account acc, Money amount); }   // throws exception if violated

public final class Account {                       // final: inheritance no longer needed
    private final InterestPolicy interest;
    private final FeePolicy fee;
    private final WithdrawalRule withdrawalRule;
    private Money balance;

    public void withdraw(Money amount, Channel ch) {
        withdrawalRule.check(this, amount);          // each axis of change is its own object
        balance = balance.minus(amount).minus(fee.withdrawalFee(amount, ch));
    }
}
// Product = assembled configuration: new Account(new TieredInterest(...), new FreeOnline(), new AnytimeWithdrawal())
~~~
Benefits: a new product is mostly a **configuration** (read from a product table), policies are tested independently, and changing one policy doesn't affect others.

### When inheritance is still appropriate
- A true "is-a" relationship that is stable and the subclass fully honors the parent's contract (LSP).
- The parent is **designed for inheritance**: it documents which hooks can be overridden, and the rest are {{final}} (Template Method).
- Modeling a closed set of data variants: {{sealed interface PaymentMethod permits Card, Wallet, BankTransfer}} with {{record}}s, handled via switch pattern matching (Java 21). Here there is no shared mutable state or overridden behavior, so no fragile base class.
- Framework extension points ({{OncePerRequestFilter}}, {{AbstractRoutingDataSource}}).

### Comparison
| | Inheritance | Composition |
|---|---|---|
| Changing along multiple independent axes | Subclass explosion | Assembled objects |
| Changing behavior at runtime | Not possible | Possible |
| Dependence on parent internals | Yes (fragile) | Only through interfaces |
| Initial code amount | Less | Slightly more |
| Reusing common code | Natural | Requires delegation |

### Common wrong answers
- "Never use inheritance." Too extreme; records + sealed, template methods, framework hooks are appropriate inheritance.
- Using inheritance only to **reuse code** (e.g. a {{BaseService}} with logging and mapper utilities): that's a sign to use helpers/composition.

> Senior tip: the earliest warning sign of a bad inheritance tree is a parent class that starts accumulating boolean flags or protected methods used by only one subclass. When I see both signals in a review, I suggest extracting change axes into policies before adding the next subclass; the longer it's left, the more expensive splitting becomes.`,
    follow: [
      "How do sealed interfaces with records differ from traditional inheritance, and why don't they suffer from fragile base class?",
      'How do you refactor an inheritance tree running in production with JPA inheritance without corrupting stored data?',
      'Is delegation overhead in composition significant for performance?'
    ],
  },
  'architecture-016': {
    q: 'What code smells do you most often encounter during code review (long method, primitive obsession, feature envy...)? For each smell, how do you refactor without introducing production errors?',
    a: `**Summary:** A code smell is a surface signal that the design is hard to change, not a bug. The smells most commonly seen in Java business code: **long method**, **large class**, **primitive obsession** (money as separate {{BigDecimal}} + {{String}} currency), **feature envy** (method uses another class's data more than its own), **long parameter list / data clumps**, **shotgun surgery**, and boolean flags passed to methods. Safe refactoring: write characterization tests first, use automated IDE refactoring, take small steps, and **separate the refactor PR from the behavior-change PR**.

### Smells and fixes
| Smell | Signs | Refactoring |
|---|---|---|
| Long method | More than ~50 lines, comments like "// step 1" | Extract Method by step, name by business action |
| Large class | Thousands of lines, unrelated field groups | Extract Class from common field/method groups |
| Primitive obsession | {{String accountNo}}, separate {{BigDecimal}} + {{String}} for currency | Value object ({{record}}) with validation |
| Feature envy | {{a.getB().getC()...}} then compute | Move Method to the class that owns the data |
| Data clumps / long params | (fromDate, toDate) or (amount, currency) always together | Introduce Parameter Object |
| Shotgun surgery | Adding one fee requires editing 7 files | Gather logic into one place (Move Method, Strategy) |
| Divergent change | One class changes for many unrelated reasons | Split by reason for change (SRP) |
| Flag argument | {{transfer(cmd, true, false)}} | Split into named methods, or use an enum |
| Repeating switch by type | Same switch in many places | Polymorphism or centralized sealed + switch |
| Speculative generality | Parameters or interfaces "for future use" | Remove (YAGNI) |

### Primitive obsession: the most valuable fix
~~~java
// Before: easy to mix VND with USD, forget rounding, allow negatives
BigDecimal fee = amount.multiply(rate);
if (currency.equals("VND")) fee = fee.setScale(0, RoundingMode.HALF_UP);

// After: invariant lives in one place, protected everywhere
public record Money(BigDecimal amount, Currency currency) {
    public Money {
        Objects.requireNonNull(currency);
        if (amount.signum() < 0) throw new IllegalArgumentException("Negative amount");
        amount = amount.setScale(currency.getDefaultFractionDigits(), RoundingMode.HALF_UP); // VND: 0 fraction digits
    }
    public Money plus(Money o) {
        if (!currency.equals(o.currency)) throw new IllegalArgumentException("Different currencies");
        return new Money(amount.add(o.amount), currency);
    }
}
~~~
{{java.util.Currency.getInstance("VND").getDefaultFractionDigits()}} returns 0, so rounding is correct by currency.

### Feature envy
~~~java
// Before: service "envies" Loan's data
BigDecimal remaining = loan.getPrincipal().subtract(loan.getPaid());
bool overdue = loan.getDueDate().isBefore(today) && remaining.signum() > 0;

// After: behavior moves to where the data lives
bool overdue = loan.isOverdue(today);
~~~
This is also how to gradually cure an anemic domain model without a full rewrite.

### Safe production refactoring
1. **Characterization test:** before touching old code, write a test that captures current behavior (even strange behavior), using real input from masked logs.
2. **Use IDE automated refactoring** (Extract Method, Rename, Change Signature, Move): it updates all call sites more precisely than hand edits.
3. **Small steps, small commits**, green tests after each step.
4. **Separate PRs:** the refactor PR changes no behavior; reviewers confirm equivalence; the feature PR comes after.
5. For risky changes (e.g. how fees are calculated), run the old and new versions in parallel, compare results, and log differences before fully switching.

### Common wrong answers
- Listing smell names without saying **why** they are harmful (hard to change, hard to test, bugs repeat).
- "Refactor as soon as you see a smell." Refactoring has a cost; prioritize code that changes often and has many bugs (hotspots); leave untouched code alone.
- Mixing a large refactor into a feature PR: reviewers can't verify it, and the risk is high.

> Senior tip: I prioritize refactoring by data: combine file change frequency ({{git log}}) with bug count; files at the top of both lists usually yield the most value from refactoring. The "boy scout rule" (leave the code a little cleaner each time you touch it) is more effective than a big refactor project that no one dares to merge.`,
    follow: [
      'How do you write characterization tests for a 500-line method that depends on DB and external services?',
      'What numbers do you show a PM to justify time spent on refactoring?',
      'Which smells does static analysis (Sonar, PMD) catch, and which ones only a reviewer can see?'
    ],
  },
  'architecture-017': {
    q: 'Compare event notification and event-carried state transfer in event-driven architecture. Why is an event-driven system hard to debug, and what do you do to mitigate the risk?',
    a: `**Summary:** **Event notification** only says "something happened" with an ID; the consumer must call back to the source service to get details. **Event-carried state transfer** sends enough data so the consumer can store its own copy and doesn't need to call back. The first creates less schema coupling but introduces runtime coupling; the second decouples at runtime but makes the event schema a public contract and creates data duplication in many places. EDA is hard to debug because the business flow **isn't in one place** in the code: it's spread across consumers, asynchronous, with duplicates and out-of-order events. Mitigate with trace IDs across everything, managed schemas, idempotent consumers, DLQ with clear ownership, and orchestration for long processes that need visible state.

### Three event usage patterns (per Martin Fowler's classification)
| Pattern | Payload | What the consumer does | Risk |
|---|---|---|---|
| Event notification | {{orderId}}, event type | Calls source API for details | Source unavailable blocks consumer; request storm |
| Event-carried state transfer | Full required state | Stores its own local copy | Schema becomes a public contract; stale data |
| Event sourcing | Event sequence is the source of truth | Rebuilds state from events | Complex, hard to change old event schemas |

Example in e-commerce: {{OrderPlaced}} as notification makes inventory, promotions, and notifications all call the Order Service at peak load, multiplying load. As state transfer, it carries items, address, total price; the Order Service being slow doesn't affect consumers. The trade-off is that adding/removing fields requires considering every consumer.

### Event-carried state transfer: payload design
~~~json
{
  "eventId": "9f1c...", "type": "OrderPlaced", "version": 2,
  "occurredAt": "2026-10-23T09:15:02Z",
  "orderId": "ORD-1001", "customerId": "C-77",
  "items": [{"sku": "SKU-1", "qty": 2, "price": 150000}],
  "total": 300000, "currency": "VND"
}
~~~
{{eventId}} for deduplication, {{version}} for schema evolution, {{occurredAt}} for late-arriving events, {{orderId}} as Kafka key to preserve order per order.

### Why debugging is hard
- **Hidden flow:** reading the Order Service code doesn't reveal who is listening to {{OrderPlaced}}; adding a new consumer can change the whole system's behavior.
- **Asynchronous and eventual consistency:** the user sees the order is placed but loyalty points haven't been added — is that a bug or just a delay?
- **Duplicates and wrong order:** at-least-once delivery means events may arrive twice; different partitions have no ordering guarantee.
- **Reaction chain:** event A triggers B, B triggers C; an error in C is hard to trace back to A.
- **Poison message:** one malformed event can block a partition if the consumer retries infinitely.

### Mitigation measures
1. **Trace ID in headers** across Kafka, connecting HTTP → producer → consumer. Spring Boot 3 + Micrometer Tracing supports this when observation is enabled ({{spring.kafka.template.observation-enabled}}, {{spring.kafka.listener.observation-enabled}}).
2. **Managed schema:** Schema Registry with backward-compatibility rules; only add optional fields; document events with AsyncAPI or an event catalog so anyone knows who produces and consumes.
3. **Outbox** for consistency between DB and events; **idempotent consumers** ({{processed_event}} table with unique {{eventId}}).
4. **Limited retries + DLQ** (Spring Kafka {{DefaultErrorHandler}} with {{DeadLetterPublishingRecoverer}}), with a dashboard and an owner who handles DLQ.
5. **Orchestration for long flows:** multi-step processes with compensation (open account, refund) should have an orchestrator that holds state so you can answer "what step is this application at?". Choreography fits independent reactions with few steps.

### When NOT to use event-driven
- You need an immediate result to reply to the user (check balance before transfer): use synchronous calls.
- Small team, single service: in-process events ({{ApplicationEventPublisher}}) are enough; Kafka isn't needed yet.

> Senior tip: the rule I apply to every event: must answer "what if this event arrives twice, arrives 1 hour late, or never arrives?". If the team can't answer the third question, the system lacks reconciliation, and that's where money or data will silently diverge.`,
    follow: [
      'How do you evolve an event schema (rename a field, split a field) with 6 consumers from 4 teams?',
      'A consumer needs the latest customer data but only receives event-carried state: how do you handle stale data?',
      'How do you build a "track order status" screen in a choreography-based system?'
    ],
  },
  'architecture-018': {
    q: 'The team wants to move from a messy monolith to microservices. You propose a modular monolith with Spring Modulith: how are module boundaries defined and checked, how do modules communicate, and when should a module actually become a service?',
    a: `**Summary:** A modular monolith is a single deployable but divided into modules by bounded context, with **automatically verified boundaries**. Spring Modulith treats each direct sub-package of the application root package as a module; only the root package of the module is the public API, internal sub-packages are internal. The {{ApplicationModules.verify()}} test reports errors when there are dependency cycles or access to internal classes from other modules. Modules communicate via public APIs or through **durable application events** stored with the event publication registry. Only split a module into a service when there is a measurable reason: different scaling needs, independent deployment cadence, separate team ownership, or isolation requirements (security, compliance).

### Structure
~~~text
com.bank.lending                  <- root package (@SpringBootApplication)
 |-- application/                 <- module "application": loan applications
 |    |-- LoanApplicationService  (public API of the module)
 |    |-- internal/               (used only within this module)
 |-- scoring/                     <- module "scoring"
 |    |-- ScoringService
 |    |-- internal/
 |-- disbursement/                <- module "disbursement": disbursement
~~~

### Boundary verification
~~~java
class ModularityTests {
    ApplicationModules modules = ApplicationModules.of(LendingApplication.class);

    @Test
    void verifiesModularStructure() {
        modules.verify();      // fails if cycles exist or another module accesses internal classes
    }

    @Test
    void writesDocumentation() {
        new Documenter(modules).writeDocumentation();   // generates PlantUML/C4 diagram and docs
    }
}
~~~
You can tighten rules with {{@ApplicationModule(allowedDependencies = ...)}} in {{package-info.java}}, or expose additional sub-packages as APIs with {{@NamedInterface}}. The test runs in CI, blocking violations at PR time rather than relying on reviewer memory.

### Module communication via events
~~~java
// application module: publishes in the same transaction as the data save
@Transactional
public void approve(LoanId id) {
    loan.approve();
    events.publishEvent(new LoanApproved(id, loan.amount()));
}

// disbursement module
@ApplicationModuleListener                         // = @Async + @Transactional(REQUIRES_NEW) + @TransactionalEventListener
void on(LoanApproved event) { disbursementService.schedule(event.loanId(), event.amount()); }
~~~
With a storage starter (e.g. {{spring-modulith-starter-jpa}}), each publish writes to an event publication table in the same transaction; the listener runs only after the event is fully persisted. If the app crashes, unfinished publications are resent (configured to resend on startup or actively). This is the internal outbox pattern. When needed, events can be pushed to Kafka ({{@Externalized}}) without changing module code — a natural intermediate step before splitting into a service.

### Testing per module
{{@ApplicationModuleTest}} only starts beans from one module (and allowed dependencies), making tests faster and exposing hidden dependencies.

### Comparison
| | Messy monolith | Modular monolith | Microservices |
|---|---|---|---|
| Boundaries | None | Package + automatic verification | Network + API |
| Transactions | One DB, arbitrary | One DB, recommend separate table per module | Distributed, saga |
| Operations | Simple | Simple | Complex (deploy, observability, network) |
| Boundary refactoring cost | Expensive | Cheap (change package) | Very expensive |
| Independent scaling | No | No | Yes |

### When to split a module into a service
- The module needs very different scaling from the rest (scoring uses heavy CPU at month-end).
- A separate team wants independent releases and the module has a stable API (few changes).
- Isolation requirements: PCI DSS for card data, different technology.
If the module doesn't have clean internal dependencies in the monolith, splitting it will only create a distributed monolith.

### Pitfalls
- Splitting by technical layer (controller, service, repository) instead of by business domain: Modulith can't save that.
- Modules joining each other's tables in queries: code boundaries are clean but data boundaries are still entangled.
- Events carrying JPA entities instead of immutable records.

> Senior tip: I only agree to split a microservice when the modular monolith has been running for several months with {{verify()}} passing green and the modules only talk through public APIs or events. At that point splitting is mechanical. If you can't maintain boundaries within a single codebase, you won't maintain them across the network.`,
    follow: [
      "Module A needs data from module B to render a screen: call B's API, join tables, or keep a copy via events?",
      'An event publication stays in an unfinished state: how do you monitor and fix it?',
      'What is the roadmap to bring a 300,000-line monolith with no boundaries to a modular monolith?'
    ],
  }
});
