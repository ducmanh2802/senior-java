App.i18n.content({
  'qz-spring-002': {
    q: 'A {{Scope("prototype")}} bean is injected into a singleton bean. What is the lifecycle of the prototype bean?',
    options: [
      'Every time the singleton calls a method on the prototype field, Spring automatically provides a new prototype instance',
      'Spring throws an IllegalStateException because a prototype bean cannot be injected into a singleton bean',
      'Only one prototype instance is created when the singleton is initialized and it is kept for the singleton\'s entire lifetime; subsequent calls use the same instance',
      'The prototype instance is destroyed as soon as the request ends, so it cannot be used'
    ],
    explain: '**Correct answer: Only one prototype instance is created when the singleton is initialized and it is kept for the singleton\'s entire lifetime; subsequent calls use the same instance.**\n\n### Why it happens\nWhen the container creates the singleton bean, it must inject dependencies—and retrieving a prototype bean at that time creates **one** instance and injects it. The singleton holds a reference to that instance for its entire lifetime, so technically it acts like a singleton: every request shares the same object, which can lead to state leakage (e.g., this request sees data from a previous request).\n\nThe container **does not manage the lifecycle** (does not call {{@PreDestroy}}) of prototype beans.'
  },
  'qz-spring-003': {
    q: 'How is an exception handled if an {{Async}} method with a {{void}} return type throws an exception during processing?',
    options: [
      'The exception is sent to the AsyncUncaughtExceptionHandler (default is a logger), while the caller receives nothing and considers it a success',
      'The exception is re-thrown to the caller\'s thread and breaks the request being processed',
      'The exception causes the caller\'s transaction to rollback',
      'The exception is completely swallowed with no trace left'
    ],
    explain: '**Correct answer: The exception is sent to the AsyncUncaughtExceptionHandler (default is a logger), while the caller receives nothing and considers it a success.**\n\n### Why it happens\nSince the {{Async}} method returns {{void}}, the caller has no Future to catch the exception. An exception thrown inside is transferred by Spring to the {{AsyncUncaughtExceptionHandler}}, which defaults to a handler that only logs it.'
  },
  'qz-spring-004': {
    q: 'Configuration has many related properties and needs to be checked immediately upon startup. Which option is most correct?',
    options: [
      'Use @Value for each property and manually check in @PostConstruct',
      'Use @Value and re-read the value at each usage to prevent the value from being cached',
      'Use @ConfigurationProperties and catch configuration errors in the controller to return them to the client',
      'Use @ConfigurationProperties with @Validated and @NotBlank constraints on fields, so configuration errors are exposed immediately upon startup'
    ],
    explain: '**Correct answer: Use @ConfigurationProperties with @Validated and @NotBlank constraints on fields, so configuration errors are exposed immediately upon startup.**\n\n### Why it happens\n{{@ConfigurationProperties}} groups properties into a strongly typed object, supports **constructor binding** (immutable, no need for clunky {{@Value}}), and especially supports **validation**: with {{@Validated}} and constraints like {{@NotBlank}}, {{@Min}}, {{@Max}}, the application **fails fast at startup** if the configuration is incorrect.'
  },
  'qz-spring-005': {
    q: 'When upgrading from Spring Boot 2 to Spring Boot 3, which of the following is true?',
    options: [
      'Migrates to Jakarta EE (jakarta.* namespace), requires Java 17 or higher, and all libraries using javax.* must be upgraded',
      'No significant changes; Spring Boot 3 is just a version upgrade',
      'Spring Boot 3 drops support for Spring MVC, leaving only WebFlux',
      'Configuration must be migrated from properties files to yaml files'
    ],
    explain: '**Correct answer: Migrates to Jakarta EE (jakarta.* namespace), requires Java 17 or higher, and all libraries using javax.* must be upgraded.**\n\n### The three major changes\n1. **Jakarta EE 10** (Spring Framework 6 requires at least Jakarta EE 9): all APIs switch from {{javax.*}} to {{jakarta.*}}—{{javax.persistence}} → {{jakarta.persistence}}, {{javax.servlet}} → {{jakarta.servlet}}, etc.\n2. **Java 17 is the minimum level**: Spring Framework 6 and Hibernate 6 require Java 17, so Java 8 is no longer supported.\n3. **Hibernate 6**: New HQL parser (SQM) is stricter, type mapping and some APIs/annotations have changed.'
  },
  'qz-spring-006': {
    q: 'With Spring Boot 3, what is the standard way to return errors for a REST API?',
    options: [
      'Return ResponseEntity with a free-form body in each controller, no centralized handling needed',
      'Use @RestControllerAdvice with @ExceptionHandler and return ProblemDetail according to RFC 9457 so the client has a unified error structure',
      'Catch all exceptions in a filter and return an HTML error page',
      'Use @ControllerAdvice only for logging, while responses are returned with simple HTTP error codes'
    ],
    explain: '**Correct answer: Use @RestControllerAdvice with @ExceptionHandler and return ProblemDetail according to RFC 9457 so the client has a unified error structure.**\n\n### Why it happens\nSpring Framework 6 natively supports {{ProblemDetail}} according to RFC 7807, now **RFC 9457**. This is not the default format for every error: you either return {{ProblemDetail}} yourself in the handler, or enable {{spring.mvc.problemdetails.enabled=true}} for Spring Boot to use it for standard Spring MVC exceptions.'
  },
  'qz-jpa-001': {
    q: 'An endpoint returns a list of {{Order}} including {{order.getItems()}}. Hibernate logs show 1 SELECT for orders and N SELECTs for items. What is the cause and the correct fix?',
    options: [
      'Error due to transaction lasting too long; shortening the transaction time is enough',
      'Due to missing @Transactional, Hibernate cannot consolidate the queries',
      'Due to missing index on the foreign key column; creating an index is enough',
      'This is the N+1 select problem: the lazy collection is loaded per entity, requiring join fetch, EntityGraph, or @BatchSize'
    ],
    explain: '**Correct answer: This is the N+1 select problem: the lazy collection is loaded per entity, requiring join fetch, EntityGraph, or @BatchSize.**\n\n### Why it happens\nBy default in JPA, {{@OneToMany}}/{{@ManyToMany}} are **lazy**, while {{@ManyToOne}}/{{@OneToOne}} are **eager** (eager also causes N+1 when loaded with JPQL, so best practice is to declare LAZY for all relationships, then fetch intentionally).'
  },
  'qz-jpa-002': {
    q: 'In Spring Boot, {{spring.jpa.open-in-view}} defaults to {{true}}. What is the consequence?',
    options: [
      'The session is kept open throughout the request, so LazyInitializationException is rarely encountered, but JDBC connections are held for a long time and queries may occur outside of a transaction',
      'The session is closed immediately after the repository method returns, so all lazy relationships throw LazyInitializationException',
      'Disabling OSIV is mandatory because Spring Boot does not support lazy loading in the controller',
      'OSIV only affects transactions, not the session lifecycle'
    ],
    explain: '**Correct answer: The session is kept open throughout the request, so LazyInitializationException is rarely encountered, but JDBC connections are held for a long time and queries may occur outside of a transaction.**\n\n### Why it happens\nOpen Session In View keeps the {{EntityManager}} open from the beginning of the request until the end. This allows lazy relationships to be accessed in the controller (hence fewer {{LazyInitializationException}}s), but in exchange: JDBC connections are held for a long time, and queries may occur outside a transaction.'
  },
  'qz-jpa-003': {
    q: 'Why does {{@GeneratedValue(strategy = GenerationType.IDENTITY)}} disable batching when inserting multiple entities?',
    options: [
      'Because for each insert, Hibernate must run an extra SELECT query to retrieve the id',
      'Because the database generates the id using a trigger, so Hibernate does not know the id value in advance',
      'Because Hibernate needs the id immediately when persist() is called, so it must execute the INSERT immediately to retrieve the generated key; it cannot defer until flush to batch',
      'Because hibernate.jdbc.batch_size only applies to UPDATE and DELETE queries, never to INSERT'
    ],
    explain: '**Correct answer: Because Hibernate needs the id immediately when persist() is called, so it must execute the INSERT immediately to retrieve the generated key; it cannot defer until flush to batch.**\n\n### Why it happens\nWith {{IDENTITY}}, the database generates the primary key (auto-increment/identity column) and the value is only available **after** the INSERT runs. The persistence context needs the id to manage the entity (as the key for the first-level cache), so Hibernate must execute the INSERT immediately upon {{persist()}} and read back the generated key—instead of queuing the INSERTs until flush.'
  },
  'qz-jpa-004': {
    q: 'Two requests simultaneously update an entity with {{@Version}}. What will the second request receive?',
    options: [
      'The second request overwrites the data of the first request because Hibernate updates all fields',
      'Hibernate throws an OptimisticLockException (usually wrapped as ObjectOptimisticLockingFailureException) because the version does not match',
      'Nothing happens because Hibernate uses a timestamp instead of versioning to detect conflicts',
      'Hibernate automatically creates a new record and merges the two changes together'
    ],
    explain: '**Correct answer: Hibernate throws an OptimisticLockException (usually wrapped as ObjectOptimisticLockingFailureException) because the version does not match.**\n\n### Why it happens\n{{@Version}} creates a version column in the table. When Hibernate updates an entity, the UPDATE query always includes the condition {{WHERE id = ? AND version = ?}} and increments the version. Two requests read the entity when version = 0; the first request commits first, version increments to 1. The UPDATE of the second request still carries the condition {{version = 0}}, so 0 rows are affected → Hibernate throws {{OptimisticLockException}}.'
  },
  'qz-jpa-005': {
    q: 'You run a bulk update using {{@Modifying @Query}} to change the status of many orders. What issue might occur?',
    options: [
      'Bulk updates must use native SQL and therefore cannot use Hibernate HQL syntax',
      'Bulk updates are incompatible with @Transactional and will be ignored',
      'Bulk updates bypass the persistence context, so entities already loaded in the same session retain their old values and may overwrite newer data',
      'Bulk updates lock the entire table, so they cannot run concurrently with other queries'
    ],
    explain: '**Correct answer: Bulk updates bypass the persistence context, so entities already loaded in the same session retain their old values and may overwrite newer data.**\n\n### Why it happens\nBulk commands (JPQL {{UPDATE}} / {{DELETE}}) are sent directly by Hibernate to the database, **bypassing** the persistence context. Therefore, objects already loaded in the same session retain old values in memory. Even worse: if that entity is subsequently modified on another field and flushed (dirty checking, which updates all columns by default), Hibernate will write back the old value and **overwrite** the data just bulk-updated—silently losing updates.'
  },
  'qz-jpa-006': {
    q: 'What risk is caused by using Lombok {{@Data}} on a JPA entity?',
    options: [
      'Lombok @Data generates setters for every field, so it still works normally',
      'Lombok @Data makes the entity final, so it cannot be used with JPA',
      'There is no risk because equals and hashCode of an entity are always managed by the framework',
      'Lombok @Data generates equals and hashCode based on all fields, including relationship fields; with lazy loading and entity changes after loading, using the entity as a Map key or adding to a HashSet can lead to errors'
    ],
    explain: '**Correct answer: Lombok @Data generates equals and hashCode based on all fields, including relationship fields; with lazy loading and entity changes after loading, using the entity as a Map key or adding to a HashSet can lead to errors.**\n\n### Why it happens\n{{@Data}} generates {{equals}} and {{hashCode}} based on **all** non-static fields. This creates three problems:\n1. **Relationship fields**: {{equals}} will call getters → triggers lazy loading, or causes {{LazyInitializationException}}.\n2. **Entity changes**: {{hashCode}} changes based on field values → the object in a {{HashMap}} becomes unfindable.\n3. **Bidirectional relationships**: {{@OneToMany(mappedBy)}} and {{@ManyToOne}} referencing each other → infinite recursion (StackOverflow).'
  },
  'qz-db-001': {
    q: 'A table has a composite index on two columns, {{tenant_id}} and {{created_at}}. Which query CANNOT take advantage of this index?',
    options: [
      'SELECT ... WHERE tenant_id = 5 ORDER BY created_at',
      'SELECT ... WHERE tenant_id = 5 AND created_at > now()',
      'SELECT ... WHERE created_at > now()',
      'SELECT ... WHERE tenant_id = 5 AND status = 3'
    ],
    explain: '**Correct answer: SELECT ... WHERE created_at > now()**\n\n### Why it happens\nA composite B-tree index on {{(tenant_id, created_at)}} follows the principle of **leftmost prefix**: it is ordered by {{tenant_id}} first, then by {{created_at}} within each tenant. Therefore, it serves queries filtering by {{tenant_id}}, or {{tenant_id}} paired with a condition/ordering on {{created_at}}. If the first column is missing, the entries matching {{created_at}} are scattered across all tenants and cannot be narrowed down to a contiguous range in the B-tree.'
  },
  'qz-db-002': {
    q: 'At the {{READ COMMITTED}} isolation level, which phenomenon can still occur?',
    options: [
      'Dirty read: reading uncommitted data of another transaction',
      'Only happens when the table lacks a suitable index',
      'No phenomenon can occur because READ COMMITTED uses MVCC, ensuring consistency',
      'Non-repeatable read: reading the same row twice in the same transaction yields two different values'
    ],
    explain: '**Correct answer: Non-repeatable read: reading the same row twice in the same transaction yields two different values.**\n\n### Why it happens\nDifferent isolation levels block different phenomena:\n- {{READ COMMITTED}} blocks **dirty read**—uncommitted data cannot be read.\n- However, it **does not** block **non-repeatable read** or **phantom read**: each statement in a transaction sees a snapshot of data at the time that statement runs.'
  },
  'qz-db-003': {
    q: 'A node in an {{EXPLAIN ANALYZE}} (PostgreSQL) result is as follows. What does this suggest?\n~~~text\n-> Index Scan using idx_orders_created_at on orders (cost=0.43..48211.90 rows=1102 width=64) (actual time=0.051..412.330 rows=1000 loops=1)\n Index Cond: (created_at >= \'2026-03-01 00:00:00+07\'::timestamp with time zone)\n Filter: (status = \'FAILED\'::text)\n Rows Removed by Filter: 999000\n~~~',
    options: [
      'Query is optimized well because the first row is returned after only 0.051 ms',
      'The filter removed nearly 1 million rows, so the current index is inefficient and you should consider another index or rewriting the filtering condition',
      'The table is too small, so an index is not needed',
      'Execution plan is erroneous, you need to re-run the statement with ANALYZE'
    ],
    explain: '**Correct answer: The filter removed nearly 1 million rows, so the current index is inefficient and you should consider another index or rewriting the filtering condition.**\n\n### Why it happens\n{{Rows Removed by Filter}} is the number of rows read (via Index Cond) then discarded because they did not match the {{Filter}} condition. Here, the index only narrows down by {{created_at}} (1 million rows), and {{status = \'FAILED\'}} must be checked on each row in the heap: reading 1,000,000 rows to keep 1,000—99.9% of the effort is discarded.'
  },
  'qz-db-004': {
    q: 'A table has 50 million rows. Pagination with {{LIMIT 20 OFFSET 1000000}} gets slower with subsequent pages. What is the cause and correct fix?',
    options: [
      'Large offset forces the database to read then discard millions of rows; switch to keyset pagination with a condition where id is greater than the last value',
      'LIMIT 20 is too large, reduce it to 10 rows to reduce database load',
      'Need to add an index on the id column and a unique index for this column',
      'This is a PostgreSQL bug, move the entire system to use MySQL'
    ],
    explain: '**Correct answer: Large offset forces the database to read then discard millions of rows; switch to keyset pagination with a condition where id is greater than the last value.**\n\n### Why it happens\nWith {{OFFSET}}, the database must still **read and discard** the first N rows before returning the next 20. At the 50,000th page, the database reads 1,000,000 rows and discards almost all of them—linear cost based on page depth, even if you only retrieve 20 rows.'
  }
});
