/*
 * English translation of js/data/q-system-design.js — task T200. Format: js/core/i18n.js (content overlay).
 * ids: architecture-019 architecture-020 architecture-021 architecture-022 design-022 design-023 design-024
 */
App.i18n.content({
  'architecture-019': {
    q: 'A bank is building new digital channels (app, open API) but must integrate a legacy core banking system (T24, Flexcube...). How do you design an anti-corruption layer so the legacy model does not leak into the new system?',
    a: `**Summary:** The anti-corruption layer (ACL, a concept from DDD) is a translation layer between the new bounded context and the legacy system: the new domain only communicates through a port using its own language ({{holdFunds}}, {{postTransfer}}, {{Money}}, {{AccountStatus}}); the ACL handles the rest: core protocol and format, error and product code mapping, idempotency, timeout/retry, reference data caching, and handling during end-of-day closing. The goal: changing (or upgrading the version of) the core should only require fixing the ACL, not every channel.

### Problems without an ACL
- The core's fields, transaction codes, error codes appear in the app, open API, promotion services... Many teams must understand the same legacy model.
- Core-specific behaviors (date format, multi-value fields, account number with branch code, closing window) leak as if/else everywhere.
- Changing the core (core migration often takes years) becomes rewriting all channels.

### Architecture
~~~text
Mobile App / Open API / Internet Banking
                |
        Channel services (new domain: Transfer, Account, Card)
                |  port: CoreBankingPort (domain's own language)
                v
   +-------------------- Anti-Corruption Layer --------------------+
   | Facade: raw business API -> core command sequence              |
   | Translator: domain <-> legacy model, error code, product code  |
   | Adapter: core protocol (message, web service, MQ, DB view)     |
   | Idempotency store, retry/timeout, circuit breaker             |
   | Store-and-forward when core is closing at end of day           |
   +----------------------------------------------------------------+
                |
        Core banking (T24, Flexcube, ...)
~~~

### The port belongs to the new domain
~~~java
public interface CoreBankingPort {                       // domain-owned, no core data types
    HoldId holdFunds(AccountNo acc, Money amount, String reference);
    PostingResult postTransfer(TransferPosting posting);   // single reference -> idempotent
    AccountSnapshot getAccount(AccountNo acc);
}

public sealed interface PostingResult {
    record Posted(String coreRef) implements PostingResult {}
    record Rejected(RejectReason reason) implements PostingResult {}  // INSUFFICIENT_FUNDS, ACCOUNT_BLOCKED...
    record Unknown(String reference) implements PostingResult {}       // timeout: must query again
}
~~~
The {{Unknown}} result is critical: the ACL must not assume failure when the core doesn't respond; it must query again by reference before concluding.

### Translator: the most work
| Legacy | New domain |
|---|---|
| Core-specific error codes (hundreds) | Enum {{RejectReason}} with a few dozen values; unfamiliar codes -> {{UNKNOWN_CORE_ERROR}} + alert |
| Internal product/transaction codes | {{ProductType}} by business |
| Date, amount as strings in core format | {{LocalDate}}, {{Money}} |
| Account status as flags | {{AccountStatus}} (ACTIVE, DORMANT, BLOCKED) |
The mapping table should be versioned configuration with tests based on real message samples from the core test environment.

### Operational issues
- **End-of-day (COB/EOD) closing:** during the batch window, the core may reject or be slow. The ACL switches to receiving commands, storing a durable queue, and posting later (store-and-forward) for transaction types that allow it; for types that don't, it returns a clear error.
- **Protecting the core:** the core often doesn't scale horizontally. The ACL applies rate limits/bulkheads by command type and caches rarely changing reference data (branch directory, products, exchange rate version) so digital channels don't flood read queries into the core.
- **Heavy reads:** transaction history queries should go through a read model (CDC from the core DB or events/files emitted by the core) instead of calling the core for every app open.
- **Reconciliation:** every command through the ACL has a reference; reconciliation is done daily between ACL logs and core reports.

### Organizational design
- The ACL is a **separate service** owned by one team when multiple channels share it; a **module/library** when only one application uses it. A separate service centralizes core knowledge, but easily becomes an organizational bottleneck.
- The biggest pitfall: the ACL grows to contain business logic ("calculate fee in ACL for speed"). The ACL only translates and protects; business logic stays in the domain.
- Combine with **strangler fig**: new functions are written in the new domain, old functions gradually migrate; the ACL is the boundary between the two worlds.

### Trade-offs
| Benefit | Cost |
|---|---|
| Changing/upgrading the core requires fixing only one place | Adds a hop, more latency |
| New channels develop quickly with a clean model | Mapping must be continuously maintained |
| Protects the core from digital-channel load | Risk of becoming an organizational bottleneck |

> Senior tip: the measure of a good ACL is grepping the channel codebases: no core error codes, field names, or transaction codes should appear anywhere outside the ACL. I turn that into an architecture test, and require that every unfamiliar core error code trigger an alert instead of being silently mapped to "system error".`,
    follow: [
      'How does the ACL prevent double-posting when a timeout occurs if the core banking has no idempotent API?',
      'Do you build a read model for transaction history using CDC or an end-of-day file? Trade-offs?',
      'What is the migration roadmap for core banking migration (core migration) while digital channels run 24/7?'
    ],
  },
  'architecture-020': {
    q: 'Give real business code examples (not textbook examples) using Template Method, Observer, and Chain of Responsibility. What are the traps of each when used with Spring?',
    a: `**Summary:** **Template Method** fixes the process framework in a parent class, letting subclasses change individual steps (importing statement files from many banks). **Observer** allows publishing events without knowing listeners (order paid -> loyalty points, email); in Spring it's {{ApplicationEventPublisher}} + {{@EventListener}}/{{@TransactionalEventListener}}. **Chain of Responsibility** passes a request through handlers, each either handling or blocking (checks before a money transfer). Main traps: Template Method relies on inheritance so it becomes rigid; listeners run **synchronously in the same transaction** by default; the handler chain's dependency on order must be declared clearly.

### Template Method: reconciliation statement import
~~~java
public abstract class StatementImportJob {
    public final ImportReport run(Path file) {           // final: framework doesn't change
        List<RawLine> lines = read(file);
        List<StatementTxn> txns = lines.stream().map(this::parseLine).toList(); // step that changes
        validate(txns);                                    // common step
        ImportReport report = reconcile(txns);             // common step
        afterImport(report);                               // optional hook
        return report;
    }
    protected abstract StatementTxn parseLine(RawLine line); // each bank has one format
    protected void afterImport(ImportReport r) {}           // default does nothing
}
~~~
Trap: adding many hooks and flags gradually turns the parent class into a god class; subclasses override steps they shouldn't. A more modern approach is **callback/strategy** passed in (exactly as Spring's {{JdbcTemplate}}, {{TransactionTemplate}}, {{RestClient}} do): fixed framework, variable part is a lambda, no inheritance needed.

### Observer: Spring application event
~~~java
@Transactional
public void markPaid(OrderId id) {
    order.markPaid();
    publisher.publishEvent(new OrderPaid(id, order.total()));
}

@Component
class LoyaltyListener {
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)   // only runs when the order is committed
    @Transactional(propagation = Propagation.REQUIRES_NEW)              // needs a new transaction to write to DB
    public void on(OrderPaid e) { loyalty.addPoints(e.orderId(), e.total()); }
}
~~~
Real-world traps:
- {{@EventListener}} usually runs **synchronously, same thread, same transaction**: a listener exception rolls back the whole order; a slow listener slows the API down.
- {{@TransactionalEventListener}} AFTER_COMMIT: the original transaction is committed; DB writes in the listener must use a new transaction (REQUIRES_NEW), otherwise changes may not be saved.
- In-memory events are **lost when the app crashes** after commit: important work (sending money, sending to an external system) needs an outbox or Spring Modulith's Event Publication Registry.
- Adding {{@Async}} makes the listener run on a different thread, losing context (transaction, security, MDC) unless configured to propagate.

### Chain of Responsibility: checks before a money transfer
~~~java
public interface TransferCheck { void check(TransferContext ctx); }  // throws exception to block

@Component @Order(10) class AccountStatusCheck implements TransferCheck { ... }
@Component @Order(20) class DailyLimitCheck     implements TransferCheck { ... }
@Component @Order(30) class BlacklistCheck      implements TransferCheck { ... }
@Component @Order(40) class FraudScoreCheck     implements TransferCheck { ... } // calls an external service, placed last

@Service
class TransferValidator {
    private final List<TransferCheck> checks;      // Spring injects in @Order
    TransferValidator(List<TransferCheck> checks) { this.checks = checks; }
    void validate(TransferContext ctx) { checks.forEach(c -> c.check(ctx)); }
}
~~~
Add a new check = add a bean, without editing the validator. Place cheap and blocking checks early, expensive checks (network calls) at the end. Spring Security's {{SecurityFilterChain}} and Servlet {{Filter}} are the same idea (a handler can continue or stop the chain).

Traps: forgetting {{@Order}} means order isn't guaranteed; a handler with a side effect (reducing a limit) in the middle of the chain must undo if a later handler blocks. Keep handlers **pure checks**; side effects happen after the entire chain passes.

### When NOT to use
| Pattern | Don't use when |
|---|---|
| Template Method | Only one variant; or multiple independent axes (use strategy) |
| Observer | The publisher needs a result from the listener, or listener order is important |
| CoR | Only 2 fixed steps; a clear sequential if is simpler |

> Senior tip: Observer within a process is what causes the most incidents in my experience: developers think "publishing an event separates concerns", but a listener error still rolls back the main transaction, or conversely the event is lost when the pod restarts. Always ask: which transaction runs this listener, which thread, and what happens if the app dies right after commit?`,
    follow: [
      'How is the order between multiple @EventListener for the same event determined?',
      'Template Method vs Strategy: which do you choose for importing files in many formats, and why?',
      'How do you return all validation errors instead of stopping at the first one in the Chain of Responsibility?'
    ],
  },
  'architecture-021': {
    q: 'After two years, the Hexagonal architecture has "rotted": the domain imports JPA, the controller calls the repository directly, package cycles appear. How do you use ArchUnit and dependency rules to prevent architecture erosion?',
    a: `**Summary:** Architecture rules only in a wiki get violated; they must become **tests running in CI**. ArchUnit reads bytecode and lets you write rules in Java: domain must not depend on Spring/JPA, which layer can access which, no package/slice cycles, naming conventions. For a codebase already violated, use **FreezingArchRule** to record existing violations and only block new ones, then gradually reduce them. Combine with stronger boundaries (Maven/Gradle multi-module) for the most important rules.

### Why architecture rots
- Deadlines: "call repository directly from controller for speed."
- Newcomers don't know conventions; reviewers don't see imports in files outside the diff.
- IDE auto-imports the first class it finds.
Each small violation looks harmless; after 200 violations, changing persistence or splitting a module becomes impossible.

### Basic ArchUnit rules
~~~java
@AnalyzeClasses(packages = "com.bank.payment", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    @ArchTest   // pure domain: knows nothing about Spring, JPA, web
    static final ArchRule domainIsPure = noClasses().that().resideInAPackage("..domain..")
        .should().dependOnClassesThat()
        .resideInAnyPackage("org.springframework..", "jakarta.persistence..", "..adapter..");

    @ArchTest   // layers: web -> application -> domain; adapter only enters through port
    static final ArchRule layers = layeredArchitecture().consideringAllDependencies()
        .layer("Web").definedBy("..adapter.web..")
        .layer("Persistence").definedBy("..adapter.persistence..")
        .layer("Application").definedBy("..application..")
        .layer("Domain").definedBy("..domain..")
        .whereLayer("Web").mayNotBeAccessedByAnyLayer()
        .whereLayer("Persistence").mayNotBeAccessedByAnyLayer()
        .whereLayer("Application").mayOnlyBeAccessedByLayers("Web")
        .whereLayer("Domain").mayOnlyBeAccessedByLayers("Application", "Web", "Persistence");

    @ArchTest   // no dependency cycles between feature packages
    static final ArchRule noCycles = slices().matching("com.bank.payment.(*)..").should().beFreeOfCycles();
}
~~~
Domain is accessed by Application, Web, and Persistence according to dependency direction inward; the Persistence adapter implements the port owned by the domain (DIP), while domain doesn't depend back on adapter.

### Already-violated codebase: freeze then reduce
~~~java
@ArchTest
static final ArchRule domainIsPureFrozen = FreezingArchRule.freeze(domainIsPure);
~~~
The first run stores the current violation list in a "violation store" (default text file, committed to the repo). From then on the test only fails for new violations; old violations removed will disappear from the store automatically. The team can clearly see the violation count decrease over time, avoiding a "big bang."

### Other useful rules
- Controller must not access repository directly.
- Classes with {{@Transactional}} only in the application layer.
- Don't use {{java.util.Date}}, {{LocalDateTime.now()}} without Clock in the domain (so time can be tested).
- Package of partner A doesn't import package of partner B.
- Naming: classes in {{..adapter.web..}} end with {{Controller}}.

### Comparing boundary mechanisms
| Mechanism | Block level | Pros | Cons |
|---|---|---|---|
| Convention + review | Human | Free | Not durable |
| ArchUnit | CI test | Flexible, custom rules, can freeze | Only detects when tests run |
| Maven/Gradle multi-module | Compiler | Cannot violate (not on classpath) | Rigid, many modules cost build time |
| Spring Modulith verify | Test | Understands module concept, generates docs | Follows Modulith package conventions |
| JPMS (module-info) | Compiler + runtime | Strictest | Friction with reflection, frameworks |

A practical approach: the most important rule (domain must not depend on infrastructure) can be pushed to module build level; the rest uses ArchUnit.

### Pitfalls
- A badly written package pattern rule always passes (doesn't match any class). ArchUnit reports an error when the {{should}} part matches nothing; set {{archRule.failOnEmptyShould=false}} only when empty is intentional, use {{allowEmptyShould(true)}} when appropriate.
- Too many detailed rules lead to the team adding exceptions everywhere. Start with 3-5 rules with clear reasons, document the reason in {{because(...)}}.

> Senior tip: I always include {{.because("...")}} on each rule, written in business language ("domain must be testable without a DB"). When the test fails, developers read the reason instead of seeing an arbitrary bureaucratic rule and trying to work around it.`,
    follow: [
      'How do you apply ArchUnit to a codebase with 500 existing violations without discouraging the team?',
      'When should you promote an ArchUnit rule to a Maven module boundary?',
      'Write an ArchUnit rule that forbids calling LocalDateTime.now() in domain and explain why it is useful.'
    ],
  },
  'architecture-022': {
    q: 'You are building a SaaS platform (e.g., retail management software or core for credit unions) serving 2,000 business customers. Compare database-per-tenant, schema-per-tenant, and discriminator column; implement with Hibernate 6 and what are the data-leak traps?',
    a: `**Summary:** Three isolation levels trade **security/flexibility** vs **cost/operations**. Database-per-tenant has the strongest isolation, easy to serve large customers, but consumes resources and is hard to migrate thousands of DBs. Schema-per-tenant is a middle ground. Discriminator column (one {{tenant_id}} column on every table) is cheapest and easiest to scale tenant count but one query missing the condition leaks another customer's data. Hibernate 6 supports both: {{MultiTenantConnectionProvider}} for separate DB/schema, {{@TenantId}} for discriminator. In practice a **hybrid** is common: most small tenants share (discriminator + Row Level Security), large or regulated customers get their own DB.

### Comparison
| Criterion | DB per tenant | Schema per tenant | Discriminator column |
|---|---|---|---|
| Data isolation | Strongest | Fair (same instance) | Depends on code + RLS |
| Noisy neighbor | Low | Shared instance CPU/IO | Everything shared |
| Cost with 2,000 tenants | High | Medium | Low |
| Schema migration | 2,000 runs | 2,000 runs | 1 run |
| Backup/restore one tenant | Easy | Fairly easy | Hard (must filter data) |
| Connection pool | Pool per DB, connection explosion | Shared pool, switch schema | Shared |
| Per-customer customization | Easy | Fair | Hard |

Estimation of why DB-per-tenant is hard with many tenants: 2,000 DBs x minimum 5 connections = 10,000 connections per app instance; with 10 instances that's 100,000, well beyond what PostgreSQL can handle without PgBouncer and lazy pools (create on demand, close when idle).

### Identifying the current tenant
The tenant is taken from an authenticated claim or subdomain/host after verifying that the user actually has access to it; the host is data sent by the client so it must not be trusted alone. Store it in context per request:
~~~java
@Component
class TenantResolver implements CurrentTenantIdentifierResolver<String>, HibernatePropertiesCustomizer {
    @Override public String resolveCurrentTenantIdentifier() {
        return TenantContext.current().orElseThrow(() -> new IllegalStateException("Tenant context is required"));
    }
    @Override public boolean validateExistingCurrentSessions() { return true; }
    @Override public void customize(Map<String, Object> props) {
        props.put(AvailableSettings.MULTI_TENANT_IDENTIFIER_RESOLVER, this); // register with Hibernate
    }
}
// TenantContext: ThreadLocal set in a filter after authentication, cleared in finally
~~~
(The resolver has generics from Hibernate 6.4; Hibernate 6.2 uses a non-generic interface and returns {{String}}. Don't use a default tenant type like "system" to avoid missing-context errors; batch/admin must explicitly select a tenant.)

### Discriminator with @TenantId
~~~java
@Entity
class Invoice {
    @Id Long id;
    @TenantId String tenantId;   // Hibernate automatically assigns on insert and automatically adds the condition to HQL/Criteria queries
    BigDecimal amount;
}
~~~
**Does not cover native SQL** and queries via {{JdbcTemplate}}; that's a common leak point. A second defense layer: **PostgreSQL Row Level Security**: enable RLS on the table, policy comparing {{tenant_id}} with the DB session tenant. For connection pools, set the tenant in the transaction via {{SET LOCAL}} or {{set_config(..., true)}} so the state doesn't leak to the next borrowed connection; if using session settings, reset reliably. RLS doesn't apply to the table owner unless {{FORCE ROW LEVEL SECURITY}} is enabled, so the app must run with a non-owner role that doesn't have RLS bypass rights.

### Schema/DB per tenant
Configure {{MultiTenantConnectionProvider}}: for schema-per-tenant, get a connection from the shared pool then {{connection.setSchema(schema)}}, reset to the default schema when returning; only select schema from a controlled registry, don't concatenate arbitrary tenant input. For DB-per-tenant, look up tenant -> DataSource (lazy creation). Migration: run Flyway for each schema/DB in batches, tracking which tenant fails for retry.

### Data-leak traps
- **Thread pools, {{@Async}}, CompletableFuture:** ThreadLocal doesn't carry over; leftover tenant context from a previous request leaks if not cleared. Use TaskDecorator to propagate and clear context.
- **Cache:** Redis/Caffeine keys missing tenant prefix -> customer A sees customer B's data. Mandatory tenant prefix.
- **Kafka/batch:** messages must include tenant in the header; consumer sets context before processing.
- **Search index, S3 files, logs:** the same principle applies; every data store needs tenant separation.
- **Cross-system reports:** run with a separate account, audited.

### Suggested roadmap
Start with discriminator + RLS for most; design the ability to "move a large tenant to its own DB" (routing by tenant, data export/import per tenant). Customers requiring isolation (banks, regulated funds) get their own DB immediately, priced accordingly.

> Senior tip: I write an automated isolation test: create data for two tenants, call every API list/search/export with tenant A's token, and assert that no record from B appears. This test runs in CI for every new endpoint, because tenant-to-tenant leaks are the fastest way to lose SaaS customers.`,
    follow: [
      'A large tenant takes 40% of the load and slows down other tenants on the same DB: how do you handle it?',
      'How do you migrate a tenant from shared schema to its own database without downtime?',
      'How do you safely propagate tenant context through virtual threads and @Async in Spring Boot 3?'
    ],
  },
  'design-022': {
    q: 'Design a ledger for wallets with many concurrent transfers from the same account. How do you write double-entry postings, keep the balance non-negative, handle retries, and reconcile the materialized balance?',
    a: `**Summary:** The ledger is the immutable source of truth: a transfer writes balanced debit and credit in one DB transaction; the available balance is protected by row locks or conditional updates at the DB. A unique idempotency key handles retries, while the balance projection is reconciled and rebuilt from postings instead of editing history.

### Requirements and load assumptions
- Assumption: 5 million active wallets, 2 million transfers/day (23/s average), peak 1,000/s on payday. These are sizing assumptions; replace with telemetry.
- Internal transfer is all-or-nothing, total debit equals total credit per currency, must not go negative, and must have an audit trail. Read history can lag by a few seconds; confirmation and limit checks require strong consistency.
- The write API must tolerate mobile/client retries after timeout without creating a second posting.

### API and data model
- {{POST /transfers}} accepts {{Idempotency-Key}}, source, destination, amountMinor, currency; returns transferId/status. Same key + same payload returns the saved result; same key + different payload returns conflict.
- {{GET /transfers/:id}} shows status; {{GET /accounts/:id/balance}} returns posted, reserved, and available balance.
~~~text
transfer(id, client_id, idem_key, payload_hash, status)  UNIQUE(client_id, idem_key)
ledger_txn(id, transfer_id UNIQUE, currency, created_at)
posting(id, txn_id, account_id, side, amount_minor, currency)
account_balance(account_id, currency, posted, reserved, version)
~~~
Amount is integer minor units, not floating point. The idempotency key is scoped per client: a globally unique key would make two clients with the same key receive each other's result. The balance is a projection for fast reads, rebuildable. Constraints check positive amount and valid side; balancing multiple postings is ensured within the transaction boundary/service control.

### Write flow
~~~text
Client -> Transfer API -> DB transaction
                           | insert idempotency + txn
                           | lock accounts in ascending ID order
                           | conditional debit + credit postings
                           | update balance + outbox
                           v
                         COMMIT -> event relay
~~~
1. Insert idempotency record with {{INSERT ... ON CONFLICT DO NOTHING}} (unique violation usually aborts the whole PostgreSQL transaction); if it exists, compare payload hash and return the old result.
2. Lock both accounts in ascending ID order ({{SELECT ... FOR UPDATE}}) so A->B and B->A in parallel don't deadlock. Debit only succeeds if available >= amount: check on the locked row, or conditional update {{UPDATE ... WHERE posted - reserved >= :amount}} then check row count = 1. Reading balance with a plain SELECT (no lock) then checking in Java and writing later is a race: two requests see enough money at the same time.
3. Write debit, credit, balance projection, transfer state, and outbox event in the same transaction. Only report success after commit. Don't publish Kafka before committing DB or the systems can diverge.
4. Outbox relay at-least-once; consumer deduplicates event ID. For inter-bank, create a hold then call the external network; then capture or release.

### Consistency and errors
- Timeout after commit but before response: client retries with the same key; the unique constraint finds the original result. Don't create a new key when the result isn't known.
- Two simultaneous withdrawals: row lock or conditional update is the safeguard; Redis/cache only serves reads, it doesn't decide overdraft.
- A hot account serializes throughput. Shard by account keeps local ordering; cross-shard transfer needs a clear state machine/compensation, don't assume a distributed transaction.
- Reconciliation checks total debit-credit per txn and rebuilds the balance projection per account. Discrepancy creates a case; adjustments are done with a new reversal/adjustment posting with audit, not by updating old rows.
- Currency and rounding rules must be stored clearly; don't sum different currencies into one total.

### Trade-offs and deep questions
- Balance snapshot gives O(1) reads but couples writes; ledger-only reads are simpler regarding source of truth but expensive for long histories.
- Row lock is simple and easy to understand but hot accounts limit throughput. Optimistic version reduces locking when contention is low, but requires retrying the transaction and still needs exhaustion handling.
- How do you handle refunds: edit the old transfer or use a reversal posting? For a transaction with multiple accounts across different shards, how do you guarantee invariants? If the DB commits but the response is lost, what does the API retry do?

> Senior tip: monitor idempotency retries, lock wait/deadlock (or version conflict with optimistic), outbox age, and balance projection discrepancy. The ledger "balances per day" but without drill-down to the transfer it's hard to operate.`,
    follow: [
      'How do you prevent overdraft when two requests arrive at the same time?',
      'Can you edit a posting that has already been written?',
      'How do you rebuild the balance projection when the ledger is continuously being written?'
    ],
  },
  'design-023': {
    q: 'Design a 24/7 fast-transfer adapter via Napas when timeout makes it unclear whether the order completed. How do you avoid duplicate submission, manage state, and handle reconciliation?',
    a: `**Summary:** A timeout on the payment rail is {{UNKNOWN}}, not failure. Maintain a durable state machine, a stable reference, hold funds according to policy, and use inquiry/reconciliation before retrying ambiguous orders; only return the final result when there is confirming evidence.

### Requirements and sizing assumptions
- Assumption: 8 million orders/day (93/s average), peak 1,500/s. Internal systems must accept orders quickly; the rail may respond with multi-second delays. These numbers are only for sizing, not partner data.
- Assumption about the rail: it provides a message format with a unique reference for sending orders, an inquiry status message, and periodic reconciliation files. The exact message format, error codes, timeout rules, and reconciliation timelines and procedures are taken from Napas technical documentation provided to member banks; they should not be guessed.
- No double debit, don't report failure when the recipient has already received the money, don't hold funds indefinitely. Need customer-visible state, audit history, and reconciliation tools.
- Separate "order received" from "final settlement completed."

### API and model
- {{POST /bank-transfers}} accepts a unique clientRequestId, beneficiary, amountMinor, currency; returns {{ACCEPTED}} + transferId. Status endpoint and webhook provide updates afterward.
- Transfer stores the key, payload hash, rail reference, version, state, timestamps/deadline. The attempt table is append-only with provider, correlation ID, request hash, response code, and masked response payload. The ledger records hold/capture/reversal separately.
- Same key + same payload returns the same transfer; same key + different payload is a conflict. Don't log full account numbers.

### Flow and state machine
~~~text
RECEIVED -> VALIDATED -> HELD -> SUBMITTED
                                   |
                                   +-- clear success ----> COMPLETED (capture hold)
                                   +-- clear reject -----> REJECTED -> RELEASED
                                   +-- timeout/reset/error --> UNKNOWN -> INQUIRY
INQUIRY -> CONFIRMED_SUCCESS -> COMPLETED (capture hold)
INQUIRY -> CONFIRMED_FAILED  -> RELEASED
INQUIRY -> still ambiguous   -> keep hold, open reconciliation case
~~~
1. Validate limits and beneficiary; write the transfer, idempotency, and hold in a transaction.
2. Outbox creates a command for the worker. The worker calls the rail outside the transaction with a fixed reference.
3. A clear response updates the state with optimistic version. Timeout, socket reset, or corrupt response moves to UNKNOWN; keep the hold within the policy window and create an inquiry.
4. The inquiry uses the rail's status-query API or settlement file. Success captures; confirmed failure releases; still ambiguous keeps the case open, reports to the customer that it's being processed, and opens a reconciliation case.
5. Late responses, inquiry results, and reconciliation files may arrive out of order or be duplicated: verify the source, deduplicate by reference, and only allow valid state transitions; old events must not roll back a terminal state.

### Consistency, errors, and trade-offs
- There is no distributed transaction between the DB and the rail. The outbox prevents losing the command after commit; the worker is at-least-once and needs partner-side idempotency. If the rail doesn't support idempotency, don't retry blindly when the result is unknown.
- A client timeout doesn't cancel an already received order. A retry with the same request ID returns the existing transfer. A synchronous API that waits for the rail is simpler but keeps connections open and amplifies errors; an async accepted model needs UX polling/callback and state-machine operations.
- The circuit breaker reduces load when the rail is down: orders blocked when the breaker is open haven't been sent yet, so they can be safely rejected or queued; but don't use the breaker to mark SUBMITTED/UNKNOWN orders as failed. Monitor unknown count/age, held funds, and inquiry backlog, not just HTTP 5xx.
- Reconciliation compares internal reference, rail reference, amount, account, and status; classify as missing on our side/on partner side, mismatch, or duplicate. Each exception needs an owner, SLA, and evidence.
- Don't release a hold for an UNKNOWN order by timer: only release when there is confirmation of failure (inquiry or reconciliation file). If business still chooses to release after a deadline, a review process is required for cases where a late success confirmation arrives (debit could make the balance negative, recovery, reconciliation case), don't silently allow negative balances.

### Deep questions
- Without an inquiry API, when do you use the settlement file to conclude?
- How do you switch providers for an in-flight order while keeping the reference?
- Who handles a reconciliation case that exceeds its SLA and what evidence is kept?

> Senior tip: alert on UNKNOWN age and total held funds. A short timeout can create a large backlog even though most orders eventually succeed.`,
    follow: [
      'What state does the customer see when the rail is still ambiguous?',
      'How can an old callback roll back the state?',
      'How do you resolve a reconciliation case that has been open for too long?'
    ],
  },
  'design-024': {
    q: 'Design the lifecycle of Smart OTP in a banking app: device binding, transaction confirmation, changing phones, and account recovery. How do you defend against account takeover?',
    a: `**Summary:** Smart OTP is a credential tied to the device and account, not just a number. Enrollment requires strong authentication; the challenge signature must bind transaction content, prevent replay, and limit attempts; recovery/revocation must not be weaker than initial enrollment.

### Requirements and load assumptions
- Assumption: 3 million users, 1 million confirmations/day, peak 500/s. Must support enrollment, transaction signing, revocation when a device is lost, and audit.
- Offline OTP may be useful, but the transaction must still be verified server-side. Don't log secret seeds in logs/analytics.
- Prevent accidental approval of the wrong recipient/amount due to malware changing the display between the screen and the server.

### API and data
- {{POST /otp-devices/enroll}} creates a challenge; {{POST /otp-devices/confirm}} activates; {{POST /transactions/:id/challenge}} returns nonce, amount, currency, beneficiary digest, and expiry; {{POST /transactions/:id/approve}} sends proof.
- The device stores userId, PENDING/ACTIVE/REVOKED status, encrypted secret reference or public key, timestamps/version. The secret is encrypted with a KMS/HSM key; only the verifier can decrypt.
- The challenge stores nonce, transactionId, payload hash, expiry, attempt count, consumedAt. Consume with a conditional update ({{UPDATE ... SET consumed_at = now() WHERE id = :id AND consumed_at IS NULL AND expires_at > now()}}, check row count = 1), plus a unique constraint on approval(transaction_id) to prevent double approval.

### Architecture and flow
~~~text
Enrollment:  Bank App -> Auth API -> Device Registry -> KMS/HSM (wrap secret)
Transaction:   Payment API -> Challenge Store (immutable digest + nonce + expiry)
                                  |
              Bank App --proof--> OTP Verify <- Device Registry + KMS/HSM
                                  |
                                  v
              consume challenge + approval (idempotent) -> Payment API executes
~~~
1. Enrollment requires an existing factor, risk checks, pending status; confirmation through an independent channel/cooling period for high-risk operations.
2. Creating a transaction freezes the digest of amount, currency, beneficiary, and generates a one-time nonce. The app shows that content; the device creates an OTP/MAC/signature on the challenge.
3. Atomic verification: challenge not expired/not consumed, device active, proof valid, attempts below threshold; consume the challenge and create an idempotent approval within the same transaction boundary. Failed attempts must increment the attempt count with an atomic update and commit it; don't let rollback erase failed attempts (attacker tries infinitely).
4. Changing phones: revoke the old device, step-up for new enrollment, alert the old channel, and apply restrictions according to risk policy. Emergency lost-device recovery needs an audited identity verification process.

### Abuse defense and failure modes
- TOTP (RFC 6238: HMAC over time steps, default 30 seconds) only proves possession of the seed within a time window, not that the transaction content matches what the user sees. If still used, allow at most +-1 step deviation and remember the step used so the code can't be replayed. Transaction signing/challenge-response binds the transaction better, but requires device protection and a trustworthy display UX.
- Rate limit by user, device, IP, transaction, and resend; counters must be atomic. Soft lock/cooldown prevents attackers from locking accounts indefinitely.
- KMS/HSM failure: don't silently downgrade to SMS for high-risk transactions. Refuse securely or use a fallback approved by risk policy.
- Push approve is convenient but creates push fatigue; display the full transaction, limit pushes, and don't use a generic approve button for multiple requests.
- Recovery is often the weakest point: don't disable Smart OTP based only on easily guessed data; every enrollment/revocation needs notifications, audit, and abnormal review.

### Trade-offs and deep questions
- Offline TOTP is easy to deploy, but challenge response binds transactions better. Public-key signing avoids storing shared secrets server-side but requires key lifecycle management.
- Cooling period reduces takeover but blocks legitimate customers. Tune by amount, device reputation, and behavior, with a clear support process.
- If the phone has malware but the seed remains in the keystore, what threat remains? How do you revoke if the registry fails? How does a customer recover when they lose both the device and the SIM?

> Senior tip: monitor approvals followed by reversal, enrollments by channel, challenge expiry, and false-positive lockouts. Measure real customer friction together with anti-fraud effectiveness.`,
    follow: [
      'What is the risk difference between TOTP and transaction signing?',
      'How do you back up the secret without exposing it?',
      'What controls are needed for recovery to prevent social engineering?'
    ],
  }
});