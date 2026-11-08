/*
 * English translation of js/data/quiz-spring.js — task T1001. Format: js/core/i18n.js (content overlay).
 * ids: qz-spring-021 qz-spring-022 qz-spring-023 qz-spring-024 qz-jpa-021 qz-jpa-022 qz-jpa-023 qz-jpa-024 qz-db-021 qz-db-022 qz-db-023 qz-db-024 qz-api-023 qz-api-024 qz-api-025 qz-spring-025 qz-spring-026 qz-spring-027 qz-spring-028 qz-spring-029 qz-jpa-025 qz-jpa-026 qz-jpa-027 qz-jpa-028 qz-jpa-029 qz-db-025 qz-db-026 qz-db-027 qz-db-028 qz-db-029
 */
App.i18n.content({
  "qz-spring-021": {
    "q": `You call a {{@Transactional}} method of the same bean via {{this}} (self-invocation). Does the method have rollbackFor? What is the transaction result?`,
    "options": [
      `The transaction still opens and rolls back if there is an exception`,
      `No proxy, so no transaction; the exception propagates normally`,
      `Spring automatically creates a proxy for the self-call`,
      `Compile error`
    ],
    "explain": `**Correct answer: self-invocation does not go through the proxy, so there is no transaction.**

### Why it is correct
Spring AOP wraps the bean in a proxy; only calls from outside through the proxy trigger advice. Calling {{this.method()}} calls the original object directly, bypassing the proxy, so @Transactional has no effect. The exception propagates normally without rolling back.

### Why the other options are wrong
- **Still opens a transaction**: only correct if calling through the proxy (another bean).
- **Creates a proxy automatically**: Spring does not create one automatically for a self-call.
- **Compile error**: there is no compile error.

> Senior tip: avoid self-invocation; move the logic to another bean or use ApplicationEventPublisher.`
  },
  "qz-spring-022": {
    "q": `Which Spring bean scopes are the default and which create a new instance per request? (Choose 2)`,
    "options": [
      `singleton is the default`,
      `prototype creates a new instance for every getBean()`,
      `request scope creates a new instance per HTTP request`,
      `session scope creates a new instance per session`,
      `application scope creates a new instance per ServletContext`
    ],
    "explain": `**Correct answer: singleton is the default; request scope creates a new instance per HTTP request.**

### Why it is correct
- Singleton is the default scope, one instance for the whole context.
- Request scope creates a new instance for each HTTP request (in a web context).

### Why the other options are wrong
- **Prototype creates a new instance for every getBean()**: true, but not per HTTP request.
- **Session/application**: not the default for this question.

> Senior tip: use request scope carefully with proxies; inject a scoped bean into a singleton through a proxy.`
  },
  "qz-spring-023": {
    "q": `When is Spring Boot auto-configuration enabled?`,
    "options": [
      `Always enabled when a dependency is present`,
      `When the class is on the classpath and the user has not defined their own bean (@ConditionalOnMissingBean)`,
      `Only when the prod profile is active`,
      `When the property spring.boot.enable-autoconfig=true`
    ],
    "explain": `**Correct answer: when the class is on the classpath and the user has not defined their own bean.**

### Why it is correct
Auto-configuration uses @ConditionalOnClass and @ConditionalOnMissingBean so it only turns on when the dependency is present and the user has not already defined the bean.

### Why the other options are wrong
- **Always enabled**: not always; it is conditional.
- **Does not depend on the default profile**: it does not depend on the default profile either.
- **Property**: the property is not the main condition.

> Senior tip: use --debug to view the condition evaluation report.`
  },
  "qz-spring-024": {
    "q": `Which TransactionalEventListener phases run after a successful commit? (Choose 2)`,
    "options": [
      `AFTER_COMMIT`,
      `AFTER_ROLLBACK`,
      `AFTER_COMPLETION`,
      `BEFORE_COMMIT`,
      `IMMEDIATE`
    ],
    "explain": `**Correct answer: AFTER_COMMIT and AFTER_COMPLETION.**

### Why it is correct
- AFTER_COMMIT runs after a successful commit.
- AFTER_COMPLETION runs after the transaction ends (commit or rollback).

### Why the other options are wrong
- AFTER_ROLLBACK: only after rollback.
- BEFORE_COMMIT: does not exist.
- IMMEDIATE: not a phase.

> Senior tip: AFTER_COMMIT still has the dead-pod gap; use outbox for mandatory events.`
  },
  "qz-jpa-021": {
    "q": `What is the problem with batch insert using IDENTITY strategy?`,
    "options": [
      `No problem`,
      `Hibernate must INSERT immediately to get the id, breaking batching`,
      `Sequence must have allocationSize=1`,
      `Does not compile`
    ],
    "explain": `**Correct answer: Hibernate must INSERT immediately to get the id, breaking batching.**

### Why it is correct
IDENTITY forces an immediate INSERT to obtain the id, so JDBC batching cannot group inserts.

### Why the other options are wrong
- **There is clearly a problem.**
- **Sequence allocationSize**: not related to IDENTITY.
- **Compiles fine**: it compiles.

> Senior tip: use SEQUENCE with the pooled optimizer for large batch inserts.`
  },
  "qz-jpa-022": {
    "q": `What does bulk update via @Modifying do? (Choose 2)`,
    "options": [
      `Bypasses the persistence context`,
      `Updates multiple rows with a single UPDATE`,
      `Flushes automatically beforehand`,
      `Clears automatically afterwards`,
      `Rolls back automatically on error`
    ],
    "explain": `**Correct answer: bypasses the persistence context and updates multiple rows with a single UPDATE.**

### Why it is correct
@Modifying executes the bulk update directly on the DB, bypassing the persistence context; multiple rows are updated in one statement.

### Why the other options are wrong
- No automatic flush/clear/rollback by default (clearAutomatically is optional).

> Senior tip: after a bulk update, clear the persistence context to avoid stale entities.`
  },
  "qz-jpa-023": {
    "q": `What is DTO projection in Spring Data JPA?`,
    "options": [
      `Full entity`,
      `Interface or class containing only a subset of columns; the query only SELECTs those columns`,
      `Native query is required`,
      `L2 cache`
    ],
    "explain": `**Correct answer: interface or class containing only a subset of columns.**

### Why it is correct
Projection defines a subset of columns; Spring Data generates a query that only SELECTs those columns, with no managed entity.

### Why the other options are wrong
- **Not a full entity.**
- **Not necessarily a native query.**
- **Not related to caching.**

> Senior tip: use projection for read screens to reduce I/O and heap.`
  },
  "qz-jpa-024": {
    "q": `How does optimistic locking with @Version work? (Choose 2)`,
    "options": [
      `Checks the version on UPDATE`,
      `Throws OptimisticLockException on version mismatch`,
      `Locks the DB row`,
      `Retries automatically`,
      `Good for read-heavy workloads`
    ],
    "explain": `**Correct answer: checks the version on UPDATE and throws OptimisticLockException on mismatch.**

### Why it is correct
@Version adds a version column; the UPDATE includes WHERE version = ?; if no row is updated, it throws OptimisticLockException.

### Why the other options are wrong
- **Does not lock the DB row** (that is pessimistic locking).
- **Does not retry automatically.**

> Senior tip: retry at the service layer, not inside the transaction.`
  },
  "qz-db-021": {
    "q": `What does MVCC mean in PostgreSQL?`,
    "options": [
      `Each UPDATE creates a new row version; readers do not block writers`,
      `Locks the table on write`,
      `No snapshot`,
      `Only used for SELECT`
    ],
    "explain": `**Correct answer: each UPDATE creates a new version; readers do not block writers.**

### Why it is correct
MVCC keeps multiple versions; readers see a snapshot, writers create a new version, and they do not block each other.

### Why the other options are wrong
- **Does not lock the table.**
- **There is a snapshot.**
- **Applies to all operations.**

> Senior tip: autovacuum cleans up dead tuples; a hanging transaction blocks cleanup.`
  },
  "qz-db-022": {
    "q": `Which isolation levels prevent lost update? (Choose 2)`,
    "options": [
      `READ COMMITTED with SELECT FOR UPDATE`,
      `REPEATABLE READ (PostgreSQL)`,
      `READ UNCOMMITTED`,
      `SERIALIZABLE`,
      `Plain READ COMMITTED`
    ],
    "explain": `**Correct answer: REPEATABLE READ (PostgreSQL) and SERIALIZABLE.**

### Why it is correct
PostgreSQL REPEATABLE READ blocks concurrent updates on the same row; SERIALIZABLE detects conflicts.

### Why the other options are wrong
- **Plain READ COMMITTED**: can cause lost update.
- **READ UNCOMMITTED**: not safe.

> Senior tip: use an atomic UPDATE or locking to avoid lost updates.`
  },
  "qz-db-023": {
    "q": `Which index makes the query WHERE lower(email) = ? faster?`,
    "options": [
      `Regular index on email`,
      `Expression index on lower(email)`,
      `Hash index`,
      `Partial index`
    ],
    "explain": `**Correct answer: expression index on lower(email).**

### Why it is correct
An expression index stores the computed value; the query must match the expression exactly.

### Why the other options are wrong
- **Regular index**: does not contain lower().
- **Hash/partial**: do not solve the function problem.

> Senior tip: standardize data when writing to avoid functions in the WHERE clause.`
  },
  "qz-db-024": {
    "q": `When does deadlock occur? (Choose 2)`,
    "options": [
      `Two transactions wait for each other's locks`,
      `Locks are acquired in different orders`,
      `Isolation level READ COMMITTED`,
      `Missing index`,
      `Short transaction`
    ],
    "explain": `**Correct answer: two transactions waiting for each other's locks; locks acquired in different orders.**

### Why it is correct
Deadlock is a cycle of waiting; different lock orderings create cycles.

### Why the other options are wrong
- **Isolation level**: does not directly cause deadlock.
- **Short transaction**: reduces risk.

> Senior tip: always lock in the same order (ascending id).`
  },
  "qz-api-023": {
    "q": `What is an idempotency key used for?`,
    "options": [
      `Encrypting the payload`,
      `Ensuring retries of the same request do not create duplicates`,
      `Authenticating the user`,
      `Rate limiting`
    ],
    "explain": `**Correct answer: ensures retries of the same request do not create duplicates.**

### Why it is correct
An idempotency key identifies a request; the server returns the cached response for a duplicate key.

### Why the other options are wrong
- **Not encryption/authentication/rate limiting.**

> Senior tip: store the key with TTL and response for replay.`
  },
  "qz-api-024": {
    "q": `What should a 429 response include? (Choose 2)`,
    "options": [
      `Retry-After`,
      `RateLimit headers`,
      `Set-Cookie`,
      `Location`,
      `ETag`
    ],
    "explain": `**Correct answer: Retry-After and RateLimit headers.**

### Why it is correct
429 means too many requests; Retry-After says when to retry; RateLimit headers show the quota.

### Why the other options are wrong
- **Cookie/Location/ETag**: not related.

> Senior tip: client backoff with jitter to avoid spikes.`
  },
  "qz-api-025": {
    "q": `Which API versioning approach is safest and most commonly used?`,
    "options": [
      `URL path /v1/`,
      `Query parameter version`,
      `Accept header version`,
      `No versioning`
    ],
    "explain": `**Correct answer: URL path /v1/.**

### Why it is correct
URL path versioning is clear, easy to cache, easy to route; the most common.

### Why the other options are wrong
- **Query/header**: also used but less clear for caching.
- **No versioning**: causes breaking changes.

> Senior tip: use expand/contract when deprecating.`
  },
  "qz-spring-025": {
    "q": `Two @Component classes both implement {{BeanPostProcessor}} and {{Ordered}}: {{BPPA.getOrder()}} returns 10, {{BPPB.getOrder()}} returns 100. Both log in {{postProcessBeforeInitialization}} and return the bean unchanged. The target bean has {{@PostConstruct}}. What is Spring's processing order?`,
    "options": [
      `BPPA's log, then BPPB's log, then the bean's {{@PostConstruct}} runs`,
      `BPPB's log, then BPPA's log, then the bean's {{@PostConstruct}} runs`,
      `{{@PostConstruct}} runs before both logs`,
      `Order is not guaranteed; depends on class name`
    ],
    "explain": `**Correct answer: BPPA (order 10) first, then BPPB (order 100), then {{@PostConstruct}}.**

### Why it is correct
When refreshing the context, Spring registers {{BeanPostProcessor}}s in 3 groups based on **interface**: the {{PriorityOrdered}} group first, then {{Ordered}}, then the rest. Within each group, a smaller {{getOrder()}} number runs first. Bean initialization lifecycle:
~~~text
1. postProcessBeforeInitialization of each BPP, in registration order
   (@PostConstruct is invoked here, by CommonAnnotationBeanPostProcessor)
2. InitializingBean.afterPropertiesSet, then init-method
3. postProcessAfterInitialization (AOP proxies like @Transactional are created here)
~~~
{{@PostConstruct}} is not a separate step: it is invoked by {{CommonAnnotationBeanPostProcessor}}. This is an internal BPP that Spring registers **at the end of the chain**, after your BPPs, so BPPA and BPPB logs print first. {{@PostConstruct}} runs on the raw bean, **before** the AOP proxy exists. So calling a {{@Transactional}} method of the same bean from within {{@PostConstruct}} will not open a transaction.

### Why the other options are wrong
- **BPPB first**: wrong, order 100 is larger so it runs later.
- **@PostConstruct first**: wrong, the internal BPP that calls {{@PostConstruct}} is at the end of the chain.
- **Not guaranteed**: wrong when BPP implements {{Ordered}}. Note: if you only put {{@Order}} or {{@Priority}} on the BPP class **without** implementing {{Ordered}}, Spring puts it in the "unordered" group and runs it by bean definition registration order. Then this option becomes close to correct.

> Senior tip: with {{BeanPostProcessor}} and {{BeanFactoryPostProcessor}}, to be sure of the order, implement {{Ordered}} or {{PriorityOrdered}}, not rely on annotations. This is a common mistake when two libraries both wrap proxies on the same bean.`
  },
  "qz-spring-026": {
    "q": `A library's auto-configuration declares:
~~~java
@Configuration
@ConditionalOnClass(name = "org.springframework.data.redis.core.RedisTemplate")
@ConditionalOnProperty(prefix = "app.feature", name = "enabled", havingValue = "true", matchIfMissing = true)
public class FeatureAutoConfiguration {
    @Bean
    public FeatureService featureService() { return new FeatureService(); }
}
~~~
The environment **does not** have the property {{app.feature.enabled}}, but the class {{RedisTemplate}} is on the classpath. Is the {{FeatureService}} bean created?`,
    "options": [
      `No, because the missing property means @ConditionalOnProperty does not match`,
      `Yes, because {{matchIfMissing = true}} treats the missing property as a match, and class {{RedisTemplate}} is on the classpath`,
      `Yes, regardless of whether class {{RedisTemplate}} is on the classpath or not`,
      `No, because @ConditionalOnClass and @ConditionalOnProperty cannot be used together`
    ],
    "explain": `**Correct answer: it is created, because matchIfMissing = true treats the missing property as a match.**

### Why it is correct
The auto-configuration conditions are **AND**ed together: @ConditionalOnClass checks the classpath (class {{RedisTemplate}} must be present), @ConditionalOnProperty checks the environment. By default matchIfMissing = false, meaning a missing property makes the condition fail. With matchIfMissing = true, a missing property is treated as a match, so the bean is still created. If class {{RedisTemplate}} is missing, this auto-configuration is skipped entirely.

### Why the other options are wrong
- **Missing property means no match**: wrong when matchIfMissing = true; that is exactly the difference from the default.
- **Regardless of class on classpath**: wrong, @ConditionalOnClass still requires the class to be on the classpath.
- **Two conditions conflict**: wrong, they work together; if any condition fails, auto-configuration does not apply.

> Senior tip: when writing auto-configuration for your own library, combine @ConditionalOnClass (library on classpath), @ConditionalOnMissingBean (user has not defined their own bean), and @ConditionalOnProperty (enable/disable via property), so Boot can step back when the user wants manual control.`
  },
  "qz-spring-027": {
    "q": `Method {{A.placeOrder()}} has {{@Transactional}} (default REQUIRED) and calls {{B.logAudit()}} with {{@Transactional(propagation = Propagation.REQUIRES_NEW)}}. {{B}} writes the log to the same DB and commits. Which statements are true? (Choose 2)`,
    "options": [
      `{{B.logAudit}} runs in its own physical transaction; commit or rollback of {{B}} does not change the result of transaction {{A}}`,
      `When {{B}} starts, transaction {{A}} is suspended but keeps its connection; {{B}} takes a second connection from the pool`,
      `If {{B}} throws an exception and rolls back, transaction {{A}} is also marked rollback-only`,
      `{{REQUIRES_NEW}} does not need a DB connection because it only saves a log in memory`,
      `Calling this.logAudit() in the same class {{A}} still applies {{REQUIRES_NEW}}`
    ],
    "explain": `**Correct answer: B has its own physical transaction; A is suspended but keeps its connection, B uses a second connection.**

### Why it is correct
Propagation {{REQUIRES_NEW}} creates a new, separate physical transaction. Transaction {{A}} is **suspended**: Spring removes A's resource (the open connection with its transaction) from the current thread, but does **not** close or return that connection to the pool, because A still needs to commit later. {{B}} takes another connection from the pool, runs, commits, then Spring re-attaches A's connection to the thread. Commit or rollback of {{B}} does not change the result of {{A}}, and vice versa.

### Why the other options are wrong
- **If B rolls back, A is marked rollback-only**: wrong, the two transactions are independent so B's rollback does not set the rollback-only flag on A. Note: if B's exception propagates and A **does not** catch it, A still rolls back — but due to the exception, not the flag.
- **No DB connection needed**: wrong, REQUIRES_NEW still needs a JDBC connection for its own transaction.
- **this.logAudit() still REQUIRES_NEW**: wrong, calling this() bypasses the proxy, so the @Transactional advice is not triggered (self-invocation).

> Senior tip: REQUIRES_NEW is suitable for audit logs that must be saved even if the main business flow rolls back, but remember it holds **2 connections at the same time** (1 from suspended A, 1 from B). A small pool under heavy load can deadlock itself: every thread holds 1 connection while waiting for a second one.`
  },
  "qz-spring-028": {
    "q": `The following method in a service:
~~~java
@Transactional(noRollbackFor = {RuntimeException.class})
public void process() {
    orderRepo.save(new Order("PENDING"));
    throw new RuntimeException("business error");
}
~~~
The exception is caught by the caller and not rethrown. What is the order status in the DB after the method ends?`,
    "options": [
      `Rollback, order not saved, because RuntimeException always causes rollback`,
      `Commit, PENDING order saved, because noRollbackFor excludes RuntimeException from the rollback rule`,
      `Rollback, then Spring retries the method once`,
      `Does not compile, because noRollbackFor does not allow RuntimeException`
    ],
    "explain": `**Correct answer: commit, the PENDING order is saved.**

### Why it is correct
By default Spring rolls back on RuntimeException or Error. The {{noRollbackFor}} attribute overrides that rule: exceptions listed in {{noRollbackFor}} **do not** cause a rollback. Here RuntimeException is in the list, so the transaction still commits; the exception is still thrown for the caller to catch, but the data has already been saved to the DB. {{rollbackFor}} is the opposite attribute: it lists exceptions that **must** cause rollback (e.g. checked exceptions).

### Why the other options are wrong
- **RuntimeException always rolls back**: true for the default rule, but overridden by noRollbackFor here.
- **Auto retry**: Spring does not automatically retry a method when a transaction rolls back or commits.
- **Does not compile**: noRollbackFor is perfectly valid and can contain any exception class.

> Senior tip: noRollbackFor is rarely used, but useful when a business error (e.g. out of stock) is thrown as a RuntimeException yet you still want to save the order log to the DB. To roll back checked exceptions too, use {{rollbackFor = Exception.class}} as in question qz-spring-007.`
  },
  "qz-spring-029": {
    "q": `Calling the {{@Transactional}} method of the bean itself via {{this}} (self-invocation) has no transaction. Which fixes are correct? (Choose 2)`,
    "options": [
      `Move the transactional method to another bean, inject that bean into the original bean, and call it through that bean`,
      `Enable {{@EnableAspectJAutoProxy(exposeProxy = true)}} and call {{AopContext.currentProxy()}}.method() instead of this.method()`,
      `Put {{@Transactional}} on the bean's constructor`,
      `Calling this.method() inside {{@PostConstruct}} means the proxy is ready`
    ],
    "explain": `**Correct answer: move to another bean, or use AopContext.currentProxy() after enabling exposeProxy.**

### Why it is correct
Spring AOP wraps the bean in a proxy; only calls from **outside** through the proxy trigger advice. Calling {{this.method()}} calls the raw object directly, bypassing the proxy, so {{@Transactional}} has no effect. Two fixes:
- Move the logic to another bean, inject that bean, call through its proxy (the cleanest way).
- Enable {{@EnableAspectJAutoProxy(exposeProxy = true)}}, get the current proxy via {{AopContext.currentProxy()}} and call the method on it. The current class must implement {{AopContextAware}}.

### Why the other options are wrong
- **{{@Transactional}} on constructor**: the constructor runs when the object is newly created, there is no proxy yet, so the annotation means nothing.
- **this.method() in {{@PostConstruct}}**: wrong, when {{@PostConstruct}} runs the proxy has not been created yet (the proxy is created at postProcessAfterInitialization, see question qz-spring-025).

> Senior tip: prefer moving to another bean instead of AopContext.currentProxy(), because the code is clearer, easier to unit test, and does not depend on Spring's proxy mechanism.`
  },
  "qz-jpa-025": {
    "q": `Within a transaction, code saves the parent first then the child with a foreign key referencing the parent:
~~~java
Order order = new Order();
orderRepo.save(order);
OrderItem item = new OrderItem();
item.setOrder(order);
itemRepo.save(item);
// commit
~~~
Which SQL does Hibernate flush first?`,
    "options": [
      `INSERT order_item first, then INSERT order`,
      `INSERT order first, then INSERT order_item (because the foreign key must point to an existing row)`,
      `Both INSERTs in a single statement (multi-row INSERT)`,
      `Order not certain; depends on the DB driver`
    ],
    "explain": `**Correct answer: INSERT order first, then INSERT order_item.**

### Why it is correct
When flushing, Hibernate sorts the SQL statements: insert entities first, then collections. Among entity inserts, the row referenced by the foreign key (parent) is inserted before the referencing row (child), so the FK constraint is not violated when inserting the child. So the actual SQL is INSERT order then INSERT order_item. Delete is the reverse: delete entities last, collections last.

### Why the other options are wrong
- **Insert order_item first**: would violate FK if order_item.order_id must point to an existing order row.
- **Both in a single statement**: Hibernate does not merge different tables into a multi-row INSERT by default (JDBC batching with the same table is needed).
- **Not certain**: Hibernate has a fixed order that follows FK constraints.

> Senior tip: this flush order is why you can save the parent then the child without flushing in between; Hibernate handles the correct order at commit. If you use IDENTITY, Hibernate is forced to insert immediately to get the id, breaking batching (see question qz-jpa-021).`
  },
  "qz-jpa-026": {
    "q": `The following code runs within a transaction. After commit, is a new row added to the Order table?
~~~java
Order o = new Order();
o.setCode("X");
em.persist(o);
em.flush();      // o has an id after flush
em.detach(o);    // remove o from the persistence context
o.setCode("Y");  // modify after detach
~~~`,
    "options": [
      `Yes, code Y, because o is still a persisted object`,
      `No row at all, because detach cancels the persist`,
      `Yes, code X, because detach makes Hibernate stop tracking o; changes after that are not flushed`,
      `Throws Exception because you cannot modify an entity after detach`
    ],
    "explain": `**Correct answer: yes, a new row is added with code X; changes after detach are not saved.**

### Why it is correct
{{em.persist(o)}} marks o as managed and schedules an INSERT; the INSERT actually runs on flush (when flush() is called explicitly, or at commit) → the row is saved with code X. {{em.detach(o)}} removes o from the persistence context; o becomes **detached**. Hibernate does not track detached entities, so {{setCode("Y")}} generates no UPDATE, and commit does not push this change. The row in the DB keeps code X.

### Why the other options are wrong
- **Code Y**: detach has disconnected o from the persistence context; Hibernate does not know o changed.
- **No row at all**: detach only stops tracking; it does not delete the inserted row.
- **Throws Exception**: modifying a detached entity is perfectly valid, it just is not saved.

> Senior tip: to update a detached entity, use {{em.merge(o)}} (merge loads the existing row, copies the state into it, returns a managed instance) or use a managed entity throughout the transaction. detach is useful when you want to detach an object from the session, e.g. send an entity through a cache or back to the client.`
  },
  "qz-jpa-027": {
    "q": `Entity {{Order}} has {{@OneToMany(fetch = FetchType.LAZY) @BatchSize(20) List<OrderItem> items}}. A query loads 35 orders and then iterates over items of each order. How does Hibernate handle this? (Choose 2)`,
    "options": [
      `When accessing items of the first order, Hibernate loads items of exactly 20 orders at once with a SELECT ... WHERE order_id IN (...) query`,
      `@BatchSize only works with FetchType.EAGER, because EAGER already loads items along with the main query`,
      `{{hibernate.default_batch_fetch_size}} applies to entities/collections without their own @BatchSize`,
      `Batch fetch always produces fewer SQL statements than {{JOIN FETCH}} items`
    ],
    "explain": `**Correct answer: Hibernate groups ids into batches of at most 20 and loads them with SELECT ... IN; {{hibernate.default_batch_fetch_size}} is the global configuration.**

### Why it is correct
Batch fetching is used when initializing lazy collections: instead of each order running 1 SELECT for items (35 queries = N+1), Hibernate groups the ids of the orders that need loading, splits them into batches of at most 20 ids, and runs 2 SELECT ... WHERE order_id IN (...) queries (20 + 15). {{hibernate.default_batch_fetch_size}} applies to every entity/collection without its own @BatchSize.

### Why the other options are wrong
- **Only effective with EAGER**: wrong, EAGER already loads items with the main query, so there is nothing lazy left to batch fetch.
- **Always fewer SQL statements than JOIN FETCH items**: wrong, JOIN FETCH uses just one statement (but hits the Cartesian product problem when fetching multiple collections and must paginate in memory, code HHH90003004). Batch fetch runs multiple IN queries but is safer with multiple collections.

> Senior tip: place @BatchSize on large collections accessed one by one, or set hibernate.default_batch_fetch_size = 20–50 for the whole application. A value too large makes the IN clause too long and loads too much excess data into memory.`
  },
  "qz-jpa-028": {
    "q": `Property {{spring.jpa.open-in-view}} controls Open Session In View (OSIV). Which statements are true? (Choose 2)`,
    "options": [
      `Default is true: persistence context stays open until the view (Thymeleaf/HTML) finishes rendering, so lazy field access in templates still works`,
      `Set to false: accessing lazy fields after the transaction/controller ends throws {{LazyInitializationException}}`,
      `false reduces the total number of SQL statements because Hibernate cannot lazy-load more`,
      `When false, JPA automatically loads all lazy fields in the transaction to avoid errors`
    ],
    "explain": `**Correct answer: OSIV keeps the session open during view rendering; turning it off causes errors when accessing lazy fields after the transaction.**

### Why it is correct
By default true, Spring assigns the EntityManager to the request thread and only closes it after the view finishes rendering. This way, Thymeleaf templates can access lazy fields (e.g. {{order.getItems()}}) after the controller returns. With false, the persistence context closes when the transaction/controller ends, and accessing lazy fields afterward throws {{LazyInitializationException}}.

### Why the other options are wrong
- **false reduces total SQL**: wrong, OSIV does not mean fewer queries; on the contrary, lazy-loading in templates can spawn unexpected extra queries, and the DB connection is held throughout rendering (risk of exhausting the pool if the template is slow).
- **JPA automatically loads all lazy fields**: wrong, JPA does not know which fields you need; when OSIV is off, you must fetch enough data yourself in the service using {{JOIN FETCH}}, {{@EntityGraph}} or DTO/projection.

> Senior tip: OSIV on simplifies code but obscures query cost and holds connections longer. Large projects usually turn it off (spring.jpa.open-in-view=false), require explicit fetching in the service layer, and use projection for read screens.`
  },
  "qz-jpa-029": {
    "q": `Entity {{Product}} uses {{@Cache(usage = CacheConcurrencyStrategy.READ_ONLY)}} and second-level cache is enabled ({{hibernate.cache.use_second_level_cache=true}} plus a provider). {{em.find(Product.class, id)}} is called twice in two different transactions. What happens the second time?`,
    "options": [
      `It runs SELECT from DB again because second-level cache only holds data within one transaction`,
      `It can read from the second-level cache, no DB query, because the cache is at SessionFactory level shared across transactions`,
      `Throws NonUniqueRequestException because the same entity is accessed twice`,
      `Only uses cache if both transactions have the same isolation level`
    ],
    "explain": `**Correct answer: the second time it can read from the second-level cache, no DB query.**

### Why it is correct
Hibernate has two cache levels: level-1 is the persistence context (each EntityManager/transaction) and level-2 is at SessionFactory level, **shared across transactions**. The first findProduct runs a SELECT and puts it into L2. The second time (different transaction) Hibernate checks L2 first; if there is a READ_ONLY entry it returns it immediately without querying DB. READ_ONLY is suitable for reference data that barely changes, no invalidation needed.

### Why the other options are wrong
- **Only holds within one transaction**: that is level-1, not level-2.
- **NonUniqueRequestException**: not a valid error in this case.
- **Same isolation level**: isolation level relates to DB transactions, does not affect L2 reads.

> Senior tip: L2 does not automatically know the DB was modified by another application; data changed outside Hibernate will make L2 stale. Use READ_ONLY for genuinely unchanging data, or configure invalidation/TTL; avoid caching frequently changing data unless you have a synchronization mechanism.`
  },
  "qz-db-025": {
    "q": `Table {{orders}} has this index:
~~~sql
CREATE INDEX ON orders (customer_id, created_at);
~~~
Which statements are true? (Choose 2)`,
    "options": [
      `{{WHERE customer_id = ? ORDER BY created_at}} can scan the index and return results already ordered, no Sort node needed`,
      `{{WHERE created_at = ?}} can use the index as if it only had the created_at column`,
      `{{WHERE customer_id = ? AND created_at > ?}} can use the index: equality on the first column, range on the second`,
      `Column order in the index does not matter; PostgreSQL optimizes it automatically`
    ],
    "explain": `**Correct answer: equality column first, range/sort column second.**

### Why it is correct
A B-tree index is sorted in order (customer_id, created_at).
- {{WHERE customer_id = ? ORDER BY created_at}}: rows with the same customer_id are already adjacent and ordered by created_at in the index, so scanning the index is sufficient, no Sort needed.
- {{WHERE customer_id = ? AND created_at > ?}}: equality on the first column narrows to the right customer group, then the range on the second column is scanned contiguously in the index.

### Why the other options are wrong
- **WHERE created_at = ? uses index as if it were the only column**: wrong, PostgreSQL does not have efficient index skip scan; without a customer_id value it cannot locate anything in the index, usually a Seq Scan.
- **Column order does not matter**: wrong, it determines which conditions the index can serve and when to avoid Sort. Practical rule: equality column first, range or ORDER BY column second.

> Senior tip: if queries often filter on created_at alone, create a separate index (created_at) or change the index order. Check EXPLAIN to see whether there is a Sort node.`
  },
  "qz-db-026": {
    "q": `Table {{orders}} has index {{CREATE INDEX ON orders (status)}} (status has many NULL values). Query:
~~~sql
SELECT * FROM orders WHERE status IS NULL;
~~~
How does PostgreSQL handle it?`,
    "options": [
      `Cannot use index because B-tree does not store NULL values`,
      `Can use Index Scan because PostgreSQL B-tree stores NULL entries too, unlike Oracle`,
      `Must use expression index {{CREATE INDEX ON orders (status IS NULL)}}`,
      `Index only usable when the column has NOT NULL`
    ],
    "explain": `**Correct answer: PostgreSQL B-tree stores NULL entries, so WHERE status IS NULL can use Index Scan.**

### Why it is correct
Unlike Oracle, PostgreSQL B-tree indexes contain NULL entries. So both {{IS NULL}} and {{IS NOT NULL}} can use an index; ORDER BY on the column can also avoid Sort thanks to index order. By default NULLs sort last in ASC (first in DESC), so {{ORDER BY status ASC NULLS FIRST}} does not match the index order and requires a Sort node (you can create an index {{status ASC NULLS FIRST}} to match).

### Why the other options are wrong
- **B-tree does not store NULL**: true for Oracle, wrong for PostgreSQL.
- **Must use expression index**: not required; expression indexes are only needed when you wrap the column in a function (e.g. lower(status)).
- **Only with NOT NULL**: not required; the index stores NULLs normally.

> Senior tip: if the column has very few NULLs and queries often look for NULLs, a partial index {{WHERE status IS NULL}} is more compact than a full index. Note that NULL position in ORDER BY must match the index definition to avoid Sort.`
  },
  "qz-db-027": {
    "q": `A query joins tables {{orders}} (10M rows) and {{order_items}} (50M rows) on column {{order_id}}, with no suitable index on order_items. Which join method might PostgreSQL choose, and what makes it slow?`,
    "options": [
      `Hash join: builds a hash table from the smaller table, scans the larger table to probe it; if the hash table exceeds {{work_mem}}, PostgreSQL spills to disk and the query slows down noticeably`,
      `Nested loop is always chosen because both tables are large`,
      `Merge join requires both tables to already have an index on the join column, otherwise PostgreSQL errors`,
      `PostgreSQL only has nested loop, does not support hash join`
    ],
    "explain": `**Correct answer: hash join, and work_mem being too small causing disk spill slows it down.**

### Why it is correct
PostgreSQL has three join algorithms:
- **Nested loop**: takes each row from the outer table, looks it up in the inner table using an index. Effective when the outer table is small and the inner table has an index on the join column.
- **Hash join**: no index needed. Builds a hash table from the smaller input (in memory), scans the larger input and probes it. The memory limit is {{work_mem}}; exceeding the threshold causes disk spill, making the query much slower.
- **Merge join**: requires both inputs to already be sorted on the join column (a Sort node can be added if there is no index).

The planner chooses based on statistics (ANALYZE), estimated cost, and work_mem. Hash join spilling to disk is a common performance trap for large table joins.

### Why the other options are wrong
- **Nested loop always chosen**: wrong, nested loop is easily slow on two large tables without an index.
- **Merge join requires index**: wrong, it requires sorted data, which can be sorted temporarily, and does not error.
- **Only nested loop**: wrong, PostgreSQL supports all three algorithms.

> Senior tip: when joining large tables is slow, check EXPLAIN (ANALYZE, BUFFERS) to see which join the planner chose and whether there is a Sort node; if needed, increase work_mem for the session or add a suitable index for nested loop.`
  },
  "qz-db-028": {
    "q": `Index: {{CREATE INDEX ON orders (created_at ASC)}}. Query:
~~~sql
SELECT * FROM orders ORDER BY created_at ASC NULLS FIRST LIMIT 20;
~~~
Can PostgreSQL use the index to avoid Sort?`,
    "options": [
      `Yes, B-tree can scan forward or backward so NULL position does not matter`,
      `No: ASC index by default returns NULLs last (NULLS LAST), conflicting with NULLS FIRST, so PostgreSQL adds a Sort node`,
      `Yes, but only if the column is declared NOT NULL`,
      `Must create index {{created_at DESC}} to use it`
    ],
    "explain": `**Correct answer: NULL position does not match, so PostgreSQL must add a Sort node.**

### Why it is correct
PostgreSQL's default convention: an ASC index scanned forward returns NULLs last (NULLS LAST); an ASC index scanned backward (DESC) returns NULLs first. The query requires {{NULLS FIRST}} but the default ASC index is {{NULLS LAST}}, so the order does not match and the planner does not use the index for sorting, adding a Sort node. Fix: create a matching index, e.g. {{CREATE INDEX ON orders (created_at ASC NULLS FIRST)}}. Always check EXPLAIN for a Sort node.

### Why the other options are wrong
- **Forward/backward scan works**: wrong, NULL position in the sorted result must match the index.
- **Only when NOT NULL**: NOT NULL helps, but the planner does not assume the column is non-NULL unless there is a constraint.
- **Must create DESC**: not enough; the issue is NULL position, not just the ASC/DESC direction.

> Senior tip: when using ORDER BY ... NULLS FIRST/LAST, check EXPLAIN. If you see Sort only due to NULL position, create an index with the matching NULLS format.`
  },
  "qz-db-029": {
    "q": `EXPLAIN ANALYZE query on table {{orders}}:
~~~text
Index Scan using idx_orders_status on orders
  Index Cond: (status = 'NEW')
  Filter: (created_at > '2026-01-01')
~~~
What does the {{Filter}} clause do?`,
    "options": [
      `Filters rows already fetched from the heap; it does not reduce the number of index pages to scan`,
      `Merges multiple index ranges into one contiguous scan`,
      `Replaces Index Cond when the index is not selective enough`,
      `Only shown when using Index Only Scan`
    ],
    "explain": `**Correct answer: Filter filters rows already fetched from the heap; it does not reduce the number of index pages to scan.**

### Why it is correct
- **Index Cond**: condition used inside the index scan to narrow down which index entries to visit (here it only scans status = 'NEW' entries).
- **Filter**: condition applied to each row (tuple) after fetching from the heap (the main table). It does not reduce the number of index pages to read; if many entries match Index Cond but are then removed by Filter, the query still reads many heap pages and is slow.

Improvement: a composite index (status, created_at) or INCLUDE (created_at) so the created_at condition also narrows the index scan, or Index Only Scan if all needed columns are in the index and the visibility map is up to date.

### Why the other options are wrong
- **Merges index ranges**: not Filter's role.
- **Replaces Index Cond**: both coexist, each with a different role.
- **Only shown with Index Only Scan**: Filter appears on both regular Index Scan and Index Only Scan.

> Senior tip: read EXPLAIN (ANALYZE, BUFFERS): Shared Hit means read from cache, Shared Read means read from disk. If Filter removes most rows after Index Cond, consider a better index instead of hoping the current index saves the query.`
  },
});