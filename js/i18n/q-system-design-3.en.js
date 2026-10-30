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
    q: 'Design a flash sale system: 100,000 requests in 1 second for 1,000 products, each user buys at most 1, absolutely no oversell. Present both the flow and incident handling.',
    a: `**Summary:** Flash sale is a **finite resource contention under extreme load** problem. Principle: reject and decide as early as possible, deduct stock with **conditional atomic operations**, create orders asynchronously, and always have a DB layer as the final guard against oversell.

### Requirements
- **Functional:** open sale at exact time, max 1 order per user per product, hold stock for 10 minutes for payment, sold-out items go to waitlist.
- **Non-functional:** 100k req/s for a few seconds, p99 response < 500 ms, **never sell more than stock**, eventual consistency acceptable for notifications and stats.
- **Priority:** stock correctness > latency > absolute fairness.

### Quick estimation
1,000 products, 100,000 requests \u21d2 over 99% requests will fail. So **most work is rejecting fast**, not creating orders. Goal: only let ~1,000 requests reach deep into the system.

### Overall architecture
~~~text
Client -> CDN/WAF -> LB -> API gateway (rate limit, auth)
                                 |
                          Sale service
                           |         |
                   Redis (Lua)     Kafka (order created)
                   stock + user      |
                   dedup set         v
                               Order worker -> DB (conditional update)
                                                    |
                                               Payment service
~~~
Before sale: **warmup** stock and valid user list into Redis. After sale: reconcile Redis with DB.

### Layer 1 \u2014 block at gateway
- Rate limit by user/IP/device fingerprint, e.g., 5 req/s.
- Authenticate before sale service to filter unauthenticated bots.
- Optional "waiting room" issuing tokens at a controlled pace to flatten traffic; users see queue position instead of errors.

### Layer 2 \u2014 decide in Redis with Lua
This is where oversell is prevented. One script does 3 things atomically: check if user already bought, check stock, deduct and record user.

~~~text
-- KEYS[1]=stock:sku, KEYS[2]=buyers:sku ; ARGV[1]=userId
if redis.call('SISMEMBER', KEYS[2], ARGV[1]) == 1 then
  return -1                      -- already bought
end
local left = tonumber(redis.call('GET', KEYS[1]) or '0')
if left <= 0 then
  return 0                       -- out of stock
end
redis.call('DECR', KEYS[1])
redis.call('SADD', KEYS[2], ARGV[1])
return 1                         -- success, reserved
~~~

Because Redis is single-threaded and scripts are atomic, two concurrent requests cannot both read {{left = 1}}. This is a **reservation**, not the final order.

### Layer 3 \u2014 create order asynchronously
Successful requests go to Kafka with pre-generated {{orderId}} and {{reservationId}}. API returns "processing" with a tracking code immediately, without waiting for DB write. Worker consumes and creates the order.

### Layer 4 \u2014 DB as final guard
Redis can be wrong due to manual ops, backup restore, or script bugs. DB must protect itself:

~~~sql
UPDATE inventory
   SET available = available - 1, version = version + 1
 WHERE sku = 'SKU-1' AND available >= 1;
-- affected rows = 0 => out of stock, cancel reservation

ALTER TABLE orders ADD CONSTRAINT uk_user_sku UNIQUE (user_id, sku);
~~~
- Conditional UPDATE is atomic at row level, no {{SELECT ... FOR UPDATE}} then compute in app.
- Unique constraint blocks case where two requests of same user slip through Redis.
- If affected rows = 0, worker marks reservation failed and releases stock.

### Stock hold and expiry
Reservation has TTL 10 minutes (Redis key + {{expires_at}} column in DB). A job scans expired reservations to release stock. Must be **idempotent**: release only when reservation is still PENDING, using conditional update to avoid double-release.

### Oversell prevention: real incidents
| Bug | Consequence | Prevention |
|---|---|---|
| Read stock then write in app | Lost update, oversell | Conditional UPDATE or Lua |
| Trust only Redis | Redis restore causes oversell | DB constraint + reconciliation |
| Retry order creation | One user gets multiple orders | Unique (user, sku), idempotency key |
| Double stock release | Sell more than actual | Reservation state + conditional update |
| Expiry job runs before payment callback | Paid order cancelled | Callback and job both lock by orderId |

### Hot row and sharding
1,000 products but one hot SKU may get 50k req/s. That inventory row becomes a bottleneck. Two approaches:
- **Shard stock** into N buckets (each bucket 1/N quantity), request picks random bucket with stock. Increases throughput, but accepts one bucket empty while others have stock.
- **Serialize by SKU** via Kafka partition key = sku: simple, throughput ~few thousand/s per partition, easier to get right.

With 1,000 products, bucket sharding usually wins because DB still guards correctness.

### Incidents and operations
- **Redis dies before sale:** cancel sale or fall back to DB-only with very low rate limit \u2014 better slow than oversell.
- **Kafka backs up:** reservations still held, users see "processing"; alert on lag and scale consumers.
- **Reconciliation:** end of day compare {{successful orders + expired reservations}} with initial stock; mismatch = P1 incident.
- **Transparency:** showing exact remaining stock can cause contention; usually only show "in stock/out of stock".

> Senior tip: I always design flash sale so it can be **turned off in 1 minute** via feature flag returning "technical issue" instead of selling wrong. Oversell is not just a data bug, it's a PR crisis \u2014 one undelivered order costs far more than rejecting early.`,
    follow: [
      'If requirement changes to max 3 products per user, how does the Lua script change?',
      'How do you handle payment callback arriving after reservation expired?',
      'How to reconcile Redis and DB stock without blocking ongoing sales?'
    ]
  },
'architecture-005': {
    q: 'Design a payment / e-wallet system. How to ensure idempotency, ledger correctness, and reconciliation with partners?',
    a: `**Summary:** Payment is a **correctness and traceability** problem, not a speed problem. Three pillars: idempotency key for every write command, **double-entry ledger** as immutable source of truth, and daily **reconciliation** with partner statements. There is no magical "exactly-once" \u2014 only at-least-once plus idempotent handling.

### Requirements
- **Functional:** deposit/withdraw, internal transfer, pay via provider (card, wallet), refund, view balance and history.
- **Non-functional:** no lost money, no created money; every change auditable; p99 < 1s for internal commands; availability 99.99%; audit retention 7+ years.
- **Out of scope:** ML fraud, complex multi-currency (but design must have currency field).

### Data model: double-entry ledger
Every transaction consists of **multiple entries** where total debit = total credit. Never UPDATE balance directly; only **append** entries, balance is derived (or materialized view updated in same transaction).

~~~sql
CREATE TABLE ledger_entry (
  id           BIGSERIAL PRIMARY KEY,
  txn_id       UUID NOT NULL,
  account_id   BIGINT NOT NULL,
  direction    CHAR(1) NOT NULL CHECK (direction IN ('D','C')),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency     CHAR(3) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uk_idem ON ledger_entry (txn_id, account_id, direction);
~~~
- Money stored as **integer smallest unit** (VND = dong, USD = cents). No {{double}}/{{float}} due to binary floating-point errors.
- Table is **append-only**: fix mistakes with reversal entry, never delete. This is an audit requirement, not preference.
- Balance can be recomputed from ledger anytime; balance table is just a read cache and must be reconciled periodically.

### Idempotency
Client sends {{Idempotency-Key}} (UUID) per command. Server stores key with request hash and response:
1. New key: process, store response in same transaction as ledger entries.
2. Key exists, request hash matches: return **exact previous response**, no reprocessing.
3. Key exists, body differs: return 409 to detect client bug.
Network retries, timeouts, double-clicks all safe.

### Transaction state machine
~~~text
INITIATED -> AUTHORIZED -> CAPTURED -> SETTLED
     |            |            |
     +----------> FAILED <-----+
     |                         |
     +--> EXPIRED       REFUNDED (from CAPTURED/SETTLED)
~~~
Each transition is a **conditional update** ({{WHERE status = 'AUTHORIZED'}}). No arbitrary jumps; unexpected events logged and queued for investigation.

### Architecture
~~~text
Client -> Payment API -> Payment service -> Ledger DB (primary)
                               |                  |
                               |            outbox table
                               v                  |
                         Provider gateway <-- outbox relay -> Kafka
                               |                                  |
                        webhook receiver ----------------------+
                                                               v
                                                      Settlement/recon job
~~~
- **Outbox pattern:** write ledger + write event in same DB transaction; relay reads outbox and publishes Kafka. Avoids dual-write "write DB then call Kafka" \u2014 if Kafka fails, both sides drift.
- **Webhook** from provider must be idempotent by {{provider_event_id}} because providers retry.

### Distributed transaction: saga, not 2PC
Transfer between two wallets in different services: debit A, credit B. No distributed transaction. Use saga:
1. Debit A (write ledger, status PENDING).
2. Emit event to service B.
3. Credit B succeeds \u21d2 mark complete.
4. If step 3 fails after N retries \u21d2 compensating entry (credit back A).
All steps idempotent and retryable. Intermediate state shown to user ("processing"), never silent.

### Reconciliation
Daily (or hourly) fetch partner statement, match by {{provider_ref}}:
- **In us, not in partner:** stuck transaction \u2014 investigate, maybe provider timeout but not actually charged.
- **In partner, not in us:** lost webhook \u2014 actively query provider by ref.
- **Amount/fee/currency mismatch:** alert immediately, do not auto-fix.
- **Duplicate:** provider sent twice, ensure ledger has only one entry.

Reconciliation result must be stored and dashboarded; "no discrepancy" is also a result that needs proof.

### Concurrency and locking
- Balance update: use {{UPDATE ... WHERE balance >= amount}} or row lock, and **lock by ascending account_id** to avoid deadlock on two-way transfers.
- Isolation level: for ledger, prefer short transactions and DB constraints; SERIALIZABLE may cause retries, measure before wide adoption.

### Security and compliance
- Never log card numbers/CVV; tokenize via provider.
- Least privilege access; manual adjustments need 4-eyes approval.
- Immutable audit log, exportable for auditors.

> Senior tip: my most expensive lesson was **never let balance be the only source of truth**. When incidents happen, append-only ledger lets you reconstruct full history and prove to partners; a balance table with wrong UPDATE leaves no way to know when it broke.`,
    follow: [
      'How do you handle webhook arriving before API finishes creating the transaction?',
      'If provider does not offer detailed statements, what does reconciliation rely on?',
      'How to design partial refund API on ledger?'
    ]
  },
'architecture-006': {
    q: 'Design a notification service sending email/SMS/push to millions of users. How to handle retry, priority, and avoid duplicate sends?',
    a: `**Summary:** Notification service is a **fire-and-forget, accept at-least-once** system needing per-channel priority queues, retry with backoff, dedup by event, and complete separation from core business flow. User OTP must not queue behind marketing campaigns.

### Requirements
- **Functional:** send email, SMS, push, in-app; templating with variables; user preference per notification type; view send history; cancel unsent notifications.
- **Non-functional:** 1M notifications/day, peak 10k/min; OTP p99 < 3s end-to-end; never lose transactional notifications; marketing can be delayed.
- **Constraints:** third-party providers have rate limits and downtime.

### Architecture
~~~text
Service A --\
Service B ---> Notification API -> DB (notification, template)
Service C --/         |
                       v
                 Priority router
              /        |         \
         high(OTP)   normal      low(marketing)
              \        |         /
               Kafka topics (3 levels)
                     |
               Channel workers (email/sms/push)
                     |
               Provider adapters (SES, Twilio, FCM)
                     |
               Delivery status -> DB + webhook
~~~
API **only accepts and returns 202**, never calls provider synchronously. Synchronous call means provider latency and reliability become yours.

### Data model
~~~sql
CREATE TABLE notification (
  id            UUID PRIMARY KEY,
  user_id       BIGINT NOT NULL,
  channel       VARCHAR(10) NOT NULL,
  template_code VARCHAR(50) NOT NULL,
  payload       JSONB NOT NULL,
  dedup_key     VARCHAR(200) NOT NULL,
  priority      SMALLINT NOT NULL,
  status        VARCHAR(20) NOT NULL,
  attempts      INT NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uk_notif_dedup ON notification (dedup_key, channel);
~~~
{{dedup_key}} example {{order-paid:12345:email}} \u2014 same business event creates only one notification per channel.

### Priority
Three separate topics, three separate worker groups (or same worker reading topics by ratio):
- **High:** OTP, security alerts, money transactions. Never blocked by marketing.
- **Normal:** order confirmation, appointment reminders.
- **Low:** promotions, newsletters. Can delay hours.

If using single queue with priority field, marketing surge makes OTP wait \u2014 classic bug. Separate topics is cheap and guaranteed.

### Retry
- Retry only **transient** errors: timeout, 429, 5xx. Permanent errors (invalid email format, non-existent phone, 4xx) marked FAILED, no retry.
- **Exponential backoff + jitter**: 1s, 5s, 30s, 2m, 10m; jitter prevents thundering herd.
- Cap at 5\u20138 attempts then move to **DLQ**. DLQ must have monitoring and replay tool.
- For provider rate limits, worker self-throttles (token bucket) instead of letting provider return 429 repeatedly.

### Duplicate prevention
System is at-least-once, so duplicates are real. Three layers:
1. Unique {{dedup_key}} on ingestion \u2014 block duplicates at source.
2. Before calling provider, mark SENDING via conditional update; if already SENDING/SENT, skip.
3. Some providers offer their own idempotency key (some SMS APIs), use if available.
Cannot guarantee absolute dedup if provider lacks support; marketing accepts rare duplicates, OTP resend is acceptable (user enters latest code).

### Templates and content
- Templates stored in DB with version; template change needs no deploy.
- Render with validated data; **escape** user content to prevent HTML email injection.
- Multi-language by user locale.
- SMS length limits, safe truncation by Unicode graphemes.

### User preferences and regulations
- Preference table by {{user_id, channel, category}}; respect opt-out immediately.
- Quiet hours: no marketing at night per user timezone.
- Log consent (who agreed to what, when) \u2014 needed for compliance.

### Provider failover
Each channel should have at least two providers. Common adapter interface; when primary fails repeatedly (circuit breaker opens), switch to secondary. Costs and quality differ; failover must alert to avoid silently burning money.

### Observability
Must-have metrics: queue lag by priority, success rate by provider, p99 latency, DLQ size, email bounce/complaint rate. Rising bounce rate = domain reputation degrading \u2014 fix before blacklist.

> Senior tip: OTP is what I always **fully separate** from general notifications, sometimes with dedicated provider. One marketing campaign sending 2M emails by mistake can clog the queue and delay OTP by 10 minutes \u2014 that's an incident where users cannot log in, not just "slow email".`,
    follow: [
      'How do you design cancel for a notification already in queue?',
      'If primary provider triples price, how does architecture help you switch?',
      'How to measure email delivery quality without reading user content?'
    ]
  }
});
