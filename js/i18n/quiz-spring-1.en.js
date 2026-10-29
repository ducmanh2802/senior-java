/*
 * English translation of js/data/quiz-spring.js — task T423. Format: js/core/i18n.js (content overlay).
 * ids: qz-spring-007 qz-spring-008 qz-spring-009 qz-spring-010 qz-spring-011 qz-spring-012 qz-spring-013 qz-spring-014 qz-spring-015 qz-spring-016 qz-spring-017 qz-spring-018 qz-spring-019 qz-spring-020 qz-jpa-007 qz-jpa-008 qz-jpa-009 qz-jpa-010 qz-jpa-011 qz-jpa-012
 */
App.i18n.content({
  "qz-spring-007": {
    "q": `The method below is called from another bean (so it goes through a proxy). The file does not exist, so {{Files.readAllBytes}} throws {{IOException}} after {{orderRepo.save}} has already run. What is the outcome for the saved data?
~~~java
@Transactional
public void importOrder(Path file) throws IOException {
    orderRepo.save(new Order("PENDING"));
    byte[] data = Files.readAllBytes(file); // throws IOException
}
~~~`,
    "options": [
      `The transaction still commits, the PENDING order is saved, because by default Spring only rolls back on RuntimeException or Error`,
      `The transaction rolls back, because every exception that escapes a @Transactional method causes a rollback`,
      `Spring wraps the IOException into UnexpectedRollbackException and then rolls back`,
      `It does not compile, because a @Transactional method may not declare a checked exception with throws`
    ],
    "explain": `**Correct answer: the transaction still commits, because by default Spring only rolls back on RuntimeException and Error.**

### Why it is correct
When {{TransactionInterceptor}} catches an exception it asks {{TransactionAttribute.rollbackOn(ex)}}. The default configuration ({{DefaultTransactionAttribute}}) returns {{true}} only when the exception is **unchecked** ({{RuntimeException}} or {{Error}}). {{IOException}} is a checked exception, so the interceptor **commits** the transaction and only then rethrows the exception to the caller. Result: the caller sees an error, but the PENDING order is already in the DB — a "half-done" state that is very hard to notice.

This convention is inherited from EJB: a checked exception is treated as an "expected business outcome", not a system failure.

### Why the other options are wrong
- **Every exception rolls back**: wrong, this is the most common misunderstanding. Only unchecked exceptions roll back by default.
- **Wrapped into UnexpectedRollbackException**: that exception only appears when the transaction has already been marked rollback-only but the code still tries to commit; not relevant here.
- **Does not compile**: wrong, declaring {{throws}} on a method annotated with {{@Transactional}} is perfectly legal.

### How to fix
~~~java
@Transactional(rollbackFor = Exception.class) // roll back checked exceptions too
public void importOrder(Path file) throws IOException { ... }
~~~

> Senior tip: many teams adopt the convention "always declare {{rollbackFor = Exception.class}}" or wrap checked exceptions into unchecked ones right at the I/O boundary. Also, read the file **before** opening the transaction: holding a transaction (and a DB connection) while doing slow I/O is the fastest way to exhaust the connection pool.`
  },
  "qz-spring-008": {
    "q": `{{OrderService.place()}} has {{@Transactional}} and calls {{auditService.log()}} (another bean, also {{@Transactional}} with the default propagation, REQUIRED). {{log()}} throws {{RuntimeException}}, and {{place()}} catches that exception with try/catch and returns normally. What happens?`,
    "options": [
      `Only the audit part is rolled back; the order part is still committed as usual`,
      `When place() finishes and Spring tries to commit, it sees the transaction has been marked rollback-only, rolls everything back and throws UnexpectedRollbackException`,
      `Both commit normally because the exception was caught inside place()`,
      `Spring automatically creates a savepoint for log(), so only that savepoint is rolled back`
    ],
    "explain": `**Correct answer: the transaction is marked rollback-only, so when it tries to commit Spring rolls everything back and throws UnexpectedRollbackException.**

### Why it is correct
With REQUIRED, {{log()}} **joins** the physical transaction of {{place()}}; it does not get a transaction of its own. When the exception travels through the proxy of {{auditService}}, the interceptor cannot roll back immediately (it does not own the transaction), so it only **marks the shared transaction rollback-only**. {{place()}} swallows the exception and returns, the proxy of {{place()}} calls commit, {{AbstractPlatformTransactionManager}} sees the rollback-only flag, performs a real rollback and throws {{UnexpectedRollbackException}} to tell the caller "you thought you committed, but you did not".

~~~text
place() [opens TX] -> log() [joins TX] -> RuntimeException
                      proxy of log(): setRollbackOnly()
place() catch -> return -> commit() -> sees rollback-only -> rollback + UnexpectedRollbackException
~~~

### Why the other options are wrong
- **Only audit is rolled back**: for that you need {{REQUIRES_NEW}} (a separate physical transaction) or {{NESTED}}.
- **Both commit**: catching the exception in the caller does not clear the rollback-only flag already set on the shared transaction.
- **Creates a savepoint automatically**: only the {{NESTED}} propagation uses savepoints; REQUIRED does not.

> Senior tip: audit logging is often isolated with {{REQUIRES_NEW}} so an audit failure does not kill the main business flow, but remember that REQUIRES_NEW holds **2 connections** at the same time. Under heavy load a small pool can deadlock itself (every thread holds 1 connection while waiting for a second one).`
  },
  "qz-spring-009": {
    "q": `Which statements about the {{@PostConstruct}} method of a singleton bean are true? (Choose 2)`,
    "options": [
      `It runs before the constructor in order to prepare data for the constructor`,
      `It runs after the constructor has finished and every dependency (field, setter) has been injected`,
      `It is called again every time getBean() returns that bean`,
      `If it calls this.method() where that method has @Transactional, no transaction is opened at all`,
      `It always runs after the bean's own AOP proxy has been created, so the advices are already in effect`
    ],
    "explain": `**Correct answer: it runs after all dependencies have been injected; calling this.method() with @Transactional from inside it opens no transaction.**

### Why it is correct
The initialisation order of a bean:
~~~text
1. constructor (injection through the constructor)
2. field / setter injection (@Autowired)
3. BeanPostProcessor.postProcessBeforeInitialization  -> @PostConstruct runs here
4. InitializingBean.afterPropertiesSet(), init-method
5. BeanPostProcessor.postProcessAfterInitialization   -> the AOP proxy (transactions, async...) is created here
~~~
- At step 3 every dependency is already available, so {{@PostConstruct}} can use them.
- Calling {{this.method()}} calls the raw object directly (self-invocation), not through the proxy. Moreover the proxy does not even exist yet at that point (step 5). So {{@Transactional}} has no effect.

### Why the other options are wrong
- **Runs before the constructor**: impossible, the object must exist first before there is a method to call.
- **Called again on every getBean()**: a singleton is instantiated once, {{@PostConstruct}} runs exactly once.
- **Proxy already created**: the opposite, the proxy is created later (step 5).

> Senior tip: startup logic that needs a transaction (warming a cache from the DB, seeding data) belongs in an {{ApplicationReadyEvent}} listener or an {{ApplicationRunner}} of another bean, where all proxies are ready. Avoid heavy work in {{@PostConstruct}}: it blocks startup and makes the readiness probe on Kubernetes fail.`
  },
  "qz-spring-010": {
    "q": `In Spring Boot 3, {{AService}} receives {{BService}} through its constructor, and {{BService}} likewise receives {{AService}} through its constructor. Nothing else is configured. What happens when the application starts?`,
    "options": [
      `Spring resolves it by itself by creating an intermediary proxy for one of the two beans`,
      `The application starts normally but one of the two fields will be null`,
      `The application fails to start; Spring reports a circular dependency (BeanCurrentlyInCreationException, with a cycle diagram)`,
      `Spring creates two instances of each bean to break the cycle`
    ],
    "explain": `**Correct answer: the application fails to start and reports a circular dependency.**

### Why it is correct
To create A, Spring must call the constructor of A, and that constructor needs a fully built B; to create B it needs A again. With constructor injection there is never a moment when an object "exists but is not finished" that could be handed out early, so Spring cannot break the cycle. Spring throws {{BeanCurrentlyInCreationException}} and Spring Boot prints the report "The dependencies of some of the beans in the application context form a cycle" together with a diagram.

From Spring Boot 2.6, even cycles that rely on field/setter injection (which Spring can resolve with an early reference) are **forbidden by default** ({{spring.main.allow-circular-references=false}}).

### Why the other options are wrong
- **Creates an intermediary proxy automatically**: Spring only does that when you put {{@Lazy}} on a constructor parameter; not by default.
- **One field is null**: Spring never silently injects null for a required dependency; it fails fast.
- **Creates two instances**: a singleton is never duplicated to break a cycle.

### How to fix
- Best: extract the shared part into a third service, or use events ({{ApplicationEventPublisher}}) to invert the dependency.
- Temporary: {{@Lazy}} on one constructor parameter.

> Senior tip: a circular dependency is a symptom of design (two services owning the same responsibility). When reviewing, do not re-enable {{allow-circular-references=true}} just to "make it run" — it is technical debt that makes both testing and later module extraction harder.`
  },
  "qz-spring-011": {
    "q": `The property {{spring.datasource.url}} is declared in 4 places: {{application.yml}}, {{application-prod.yml}} (the prod profile is active), the environment variable {{SPRING_DATASOURCE_URL}} and the command-line argument {{--spring.datasource.url=...}}. Which value is used?`,
    "options": [
      `The value in application-prod.yml, because profile-specific files always have the highest priority`,
      `The value in application.yml, because it is loaded first`,
      `The environment variable SPRING_DATASOURCE_URL, because the OS environment always wins`,
      `The command-line argument --spring.datasource.url`
    ],
    "explain": `**Correct answer: the command-line argument.**

### Why it is correct
Spring Boot orders its {{PropertySource}}s by priority; a later source overrides an earlier one. Simplified from lowest to highest:
~~~text
application.yml (inside the jar)
application-{profile}.yml (inside the jar)
application.yml / application-{profile}.yml outside the jar
OS environment variables
Java system properties (-D...)
SPRING_APPLICATION_JSON
command-line arguments (--key=value)   <- highest of the 4 sources in this question
(test: @TestPropertySource, @DynamicPropertySource rank even higher)
~~~
The variable {{SPRING_DATASOURCE_URL}} is mapped to {{spring.datasource.url}} by relaxed binding, but it still loses to the command-line argument.

### Why the other options are wrong
- **application-prod.yml wins**: a profile file only beats a non-profile file; every config file loses to environment variables and the command line.
- **application.yml because it is loaded first**: being loaded first means the **lowest** priority.
- **The environment variable always wins**: it beats config files but loses to system properties and command-line arguments.

> Senior tip: when debugging "why is my config not taking effect", call {{/actuator/env/spring.datasource.url}} (you need to expose the env endpoint and only enable it in a safe environment) to see the final value and which property source it came from. On Kubernetes a good convention is to keep defaults in the file and put environment-specific differences into env/ConfigMap/Secret.`
  },
  "qz-spring-012": {
    "q": `You declare a {{@Bean}} returning {{new ObjectMapper()}} inside a {{@Configuration}} class. Afterwards the {{spring.jackson.*}} properties in application.yml "no longer take effect". Why?`,
    "options": [
      `Because this hand-created ObjectMapper replaces the auto-configuration bean (a @ConditionalOnMissingBean condition), so the spring.jackson.* settings are no longer applied to it`,
      `Because Spring Boot 3 dropped support for spring.jackson.* and now requires configuring it in code`,
      `Because there are two ObjectMapper beans and Spring picks one at random`,
      `Because spring.jackson.* only applies to WebFlux, not to Spring MVC`
    ],
    "explain": `**Correct answer: the auto-configuration "backs off" because you defined an ObjectMapper bean yourself.**

### Why it is correct
{{JacksonAutoConfiguration}} declares its ObjectMapper bean with {{@ConditionalOnMissingBean}}: it only creates one when the context **does not already have** an ObjectMapper. Boot's bean is built from {{Jackson2ObjectMapperBuilder}}, and that builder is exactly where {{spring.jackson.*}} is read (date format, naming strategy, JavaTimeModule...). When you call {{new ObjectMapper()}} yourself, Boot's bean is not created and your object never goes through the builder, so you lose all of that configuration, including the default modules. Typical symptom: {{LocalDateTime}} is serialised as an array or throws an error.

### Why the other options are wrong
- **Boot 3 dropped spring.jackson.***: wrong, these properties are still fully supported in Boot 3.x.
- **Picks one of two beans at random**: there are no two beans; Boot's bean is simply not created. And Spring never picks at random — with two candidates it fails with {{NoUniqueBeanDefinitionException}} unless one has {{@Primary}}.
- **Only for WebFlux**: wrong, it applies to the ObjectMapper shared by both MVC and WebFlux.

### The right way
~~~java
@Bean
Jackson2ObjectMapperBuilderCustomizer customizer() {
    // only adjust, keep every Boot setting intact
    return b -> b.featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
}
~~~

> Senior tip: the general rule with auto-configuration is **customise, don't replace**. Most starters provide a Customizer or a property. To understand why an auto-configuration is on or off, run the app with {{--debug}} to print the Condition Evaluation Report.`
  },
  "qz-spring-013": {
    "q": `A service uses {{@Async}} to send email, relying on the default executor auto-configured by Spring Boot 3 (virtual threads not enabled). At peak it receives 5,000 calls per second, and each send takes 300 ms. What happens?`,
    "options": [
      `Spring keeps growing the number of threads without limit, so every email is sent immediately`,
      `The default pool has 8 core threads and an unbounded queue: tasks pile up in the queue, latency keeps growing and the heap can fill up`,
      `When the pool is full, @Async automatically falls back to running synchronously on the caller thread`,
      `Each @Async call creates a new platform thread and then destroys it`
    ],
    "explain": `**Correct answer: 8 core threads + an unbounded queue, tasks pile up, latency and heap grow.**

### Why it is correct
Boot auto-configures a {{ThreadPoolTaskExecutor}} named {{applicationTaskExecutor}} with these defaults: core size 8, queue capacity {{Integer.MAX_VALUE}}, max size {{Integer.MAX_VALUE}}. With {{ThreadPoolExecutor}}, threads beyond the core are **only created when the queue is full**, and the queue is almost never full, so in practice there are always just 8 threads.

Quick maths: 8 threads / 0.3 s = about 27 emails per second, while 5,000 per second arrive. The queue grows by almost 5,000 tasks every second, emails are delivered hours late, and each task holds a reference to its data so the heap keeps swelling until OOM.

### Why the other options are wrong
- **Grows threads without limit**: max size is large but meaningless when the queue never fills.
- **Falls back to synchronous execution**: that is the behaviour of {{CallerRunsPolicy}}, and only when you configure a bounded queue and that policy yourself.
- **One new thread per call**: that is {{SimpleAsyncTaskExecutor}}, the executor Boot uses when {{spring.threads.virtual.enabled=true}} (with virtual threads), not the default.

### A sensible configuration
~~~yaml
spring.task.execution.pool:
  core-size: 16
  max-size: 64
  queue-capacity: 1000   # bounded, so backpressure can kick in
~~~

> Senior tip: bulk email/notification sending should go through a message queue (SQS, Kafka) instead of in-memory {{@Async}}: restarting a pod loses every task in the queue. If you still use {{@Async}}, expose the {{executor.queued}} metric through Micrometer and set an alert.`
  },
  "qz-spring-014": {
    "q": `With Spring Boot 3 + Hibernate ({{JpaTransactionManager}}), what does putting {{@Transactional(readOnly = true)}} on a data-reading method actually give you? (Choose 2)`,
    "options": [
      `The isolation level is automatically raised to SERIALIZABLE for consistent reads`,
      `Hibernate skips dirty checking and flushing at the end (the session is read-only, flush mode MANUAL), saving CPU and snapshot memory`,
      `Every query inside the method is automatically stored in the second-level cache`,
      `The method can run in parallel without taking a connection from the pool`,
      `The JDBC connection is marked read-only, letting the driver/DB optimise or a routing datasource switch to a read replica`
    ],
    "explain": `**Correct answer: Hibernate skips dirty checking/flushing; the connection is marked read-only (and can be routed to a replica).**

### Why it is correct
- When the transaction is read-only, {{HibernateJpaDialect}} puts the session into default read-only mode and flush mode MANUAL. Entities loaded do not need a snapshot kept for comparison, and at commit there is no dirty-checking pass over every entity. For a method that reads thousands of entities this saves a significant amount of CPU and heap.
- Spring calls {{Connection.setReadOnly(true)}}. The driver may optimise (the PostgreSQL JDBC driver switches the transaction to {{READ ONLY}}), and an {{AbstractRoutingDataSource}} can use {{TransactionSynchronizationManager.isCurrentTransactionReadOnly()}} to choose a replica.

### Why the other options are wrong
- **Raised to SERIALIZABLE**: readOnly does not change isolation; for that you must set {{isolation}} explicitly.
- **Uses the second-level cache automatically**: the L2 and query caches must be enabled and configured per entity/query.
- **No connection needed**: a read-only transaction still takes a connection from the pool and holds it until the method ends.

> Senior tip: a common pattern is to put {{@Transactional(readOnly = true)}} at the service class level and override it with plain {{@Transactional}} on write methods. When routing to replicas, remember replication lag: a "write then immediately read back" flow must read from the primary, otherwise users see stale data.`
  },
  "qz-spring-015": {
    "q": `Inside a {{@Transactional}} method that creates an order, the code calls {{publisher.publishEvent(new OrderCreated(id))}}. The listener looks like this. Which statement is correct?
~~~java
@TransactionalEventListener
public void sendEmail(OrderCreated e) { mailClient.send(e.id()); }
~~~`,
    "options": [
      `The listener runs as soon as publishEvent is called, before the transaction commits`,
      `The listener runs even when the transaction rolls back, so it can report the error to the customer`,
      `The listener only runs after the transaction commits successfully (the default phase, AFTER_COMMIT); on rollback the email is not sent`,
      `The listener runs inside the same transaction, so if sending the mail fails the order is rolled back`
    ],
    "explain": `**Correct answer: the listener only runs after a successful commit (AFTER_COMMIT).**

### Why it is correct
{{@TransactionalEventListener}} does not invoke the listener immediately. Spring registers a {{TransactionSynchronization}} bound to the current transaction; the default phase is {{AFTER_COMMIT}}, so the listener only runs when the commit succeeds. This is exactly how the classic bug "send the order-confirmation email and then the transaction rolls back" is avoided.

### Why the other options are wrong
- **Runs right at publish time**: that is the behaviour of a plain {{@EventListener}} (synchronous, inside the transaction).
- **Runs on rollback too**: only when you declare {{phase = AFTER_ROLLBACK}} or {{AFTER_COMPLETION}}.
- **A mail failure rolls back the order**: by the time the listener runs the transaction has already committed; the listener's exception can no longer roll back data.

### Traps to remember
- If you publish **with no transaction**, the listener is skipped by default (unless {{fallbackExecution = true}}).
- Inside AFTER_COMMIT, further DB writes are not committed unless you open a new transaction ({{REQUIRES_NEW}}).

> Senior tip: AFTER_COMMIT still has a gap: the commit succeeds but the pod dies before the email is sent, and the event is lost. When an event must be delivered (payments, inventory), use the **transactional outbox**: write the event into an outbox table in the same transaction, and a relay (polling or Debezium CDC) pushes it to the broker.`
  },
  "qz-spring-016": {
    "q": `You add {{spring-boot-starter-actuator}} to a Spring Boot 3 application and configure nothing else. Which endpoints are reachable over HTTP?`,
    "options": [
      `All endpoints: env, beans, heapdump, metrics... because actuator is meant for operations`,
      `health and info`,
      `None; you must enable each one manually`,
      `Only /actuator/health (and the /actuator index page that lists it)`
    ],
    "explain": `**Correct answer: only health is exposed over HTTP.**

### Why it is correct
Actuator separates two concepts: an endpoint being **enabled** (it exists) and being **exposed** (reachable over web or JMX). By default most endpoints are enabled, but over HTTP only {{health}} is exposed ({{management.endpoints.web.exposure.include=health}}). To add more you must declare them, for example:
~~~yaml
management.endpoints.web.exposure.include: health,info,prometheus
~~~

### Why the other options are wrong
- **All endpoints**: that would make {{/actuator/env}} and {{/actuator/heapdump}} leak secrets and in-memory data, a serious security risk; Boot deliberately does not do that.
- **health and info**: that was the default in Boot 2.0 through 2.4; since 2.5 {{info}} has been removed from the default expose list.
- **No endpoints at all**: health is available on purpose, to serve load balancers and Kubernetes probes.

> Senior tip: move actuator to its own port ({{management.server.port=8081}}) and never expose that port to the internet. On Kubernetes use {{/actuator/health/liveness}} and {{/actuator/health/readiness}} (automatically enabled when running on k8s); do not put a DB check in liveness, otherwise a slow DB makes k8s restart the whole fleet of pods.`
  },
  "qz-spring-017": {
    "q": `A Spring Boot 3 application runs on Kubernetes and has {{server.shutdown=graceful}} set. When a pod receives SIGTERM while processing requests, what happens?`,
    "options": [
      `The web server stops accepting new requests, waits for in-flight requests to finish for at most spring.lifecycle.timeout-per-shutdown-phase (30 seconds by default), then closes the context`,
      `The JVM stops immediately and in-flight requests are cut off`,
      `Spring waits indefinitely until every request is done, regardless of Kubernetes`,
      `Spring moves the in-flight requests to another pod`
    ],
    "explain": `**Correct answer: stop accepting new requests, wait for in-flight ones for at most timeout-per-shutdown-phase (30 seconds by default), then close the context.**

### Why it is correct
SIGTERM triggers the JVM shutdown hook and Spring closes the {{ApplicationContext}}. With graceful shutdown, the web server (Tomcat, Jetty, Undertow, Netty) stops accepting new connections and then waits for in-flight requests. This phase is bounded by {{spring.lifecycle.timeout-per-shutdown-phase}}; once it expires, Spring moves on and closes the remaining beans (connection pool, Kafka consumer...).

### Why the other options are wrong
- **Stops immediately**: that only happens with SIGKILL (kill -9), or when Kubernetes runs out of {{terminationGracePeriodSeconds}} (30 seconds by default) and sends SIGKILL.
- **Waits indefinitely**: there is Spring's timeout and, above all, Kubernetes' grace period.
- **Moves requests to another pod**: an in-flight request cannot "move"; routing **new** requests to other pods is the job of the Service/Ingress.

### A real-world trap
Kubernetes removes the pod from Endpoints **in parallel** with sending SIGTERM, so for the first few seconds new requests still hit the shutting-down pod and fail. The fix: add a {{preStop}} sleep of 5–10 seconds and set {{terminationGracePeriodSeconds}} larger than preStop + Spring's timeout combined.

> Senior tip: with Kafka consumers or background jobs, the web server's graceful shutdown is not enough; check that the listener container also shuts down properly (after committing offsets) within the same window, otherwise every deployment replays some messages.`
  },
  "qz-spring-018": {
    "q": `When reviewing code, you propose moving from field injection ({{@Autowired private X x;}}) to constructor injection. Which benefits are true? (Choose 2)`,
    "options": [
      `Beans are created lazily so the application starts faster`,
      `Dependencies can be declared final, so the object is always in a complete state right after creation`,
      `The constructor must be annotated with @Autowired, which makes the code clearer`,
      `It helps Spring resolve circular dependencies between beans`,
      `Unit tests can create the object with new and pass mocks in, without Spring or reflection`
    ],
    "explain": `**Correct answer: final dependencies and always-complete objects; unit tests become easy with new + mocks.**

### Why it is correct
- Constructor injection allows {{final}} fields: you cannot forget to inject, you cannot reassign, and the object never exists in a "missing dependency" state.
- A plain unit test needs no Spring context:
~~~java
var service = new OrderService(mock(OrderRepository.class), fixedClock);
~~~
With field injection you must use {{@InjectMocks}} or reflection to push the mock into a private field.

### Why the other options are wrong
- **Lazy creation**: the injection style does not affect when a bean is created; lazy means {{@Lazy}} or {{spring.main.lazy-initialization}}.
- **@Autowired is required**: since Spring 4.3, a class with a **single** constructor does not need {{@Autowired}}.
- **Resolves circular dependencies**: the opposite, constructor injection makes a cycle surface at startup (unresolvable); that is the "fail fast" benefit, not a resolution.

> Senior tip: a constructor with more than 5–6 parameters signals that the class is doing too much. Field injection hides that signal; constructor injection makes it painfully visible, which is the real reason to prefer constructor injection.`
  },
  "qz-spring-019": {
    "q": `A {{@WebMvcTest(OrderController.class)}} test fails while loading the context with "No qualifying bean of type OrderService". {{OrderController}} receives {{OrderService}} through its constructor. What is the cause and the correct fix?`,
    "options": [
      `You must use @SpringBootTest because @WebMvcTest does not support controllers with constructor injection`,
      `@WebMvcTest only loads web components (controller, advice, filter, converter...), not @Service beans; provide a mock with @MockitoBean (Spring 6.2+) or @MockBean`,
      `OrderService is missing @Component so Spring cannot scan it, even in the real application`,
      `You need to add @ComponentScan to the test class so it scans the whole package`
    ],
    "explain": `**Correct answer: @WebMvcTest is a test slice that only loads the web layer, so OrderService must be mocked.**

### Why it is correct
A test slice builds a **trimmed-down** context: with {{@WebMvcTest}} you only get {{@Controller}}, {{@ControllerAdvice}}, {{Filter}}, {{WebMvcConfigurer}}, converters, Jackson... and {{MockMvc}}. {{@Service}} and {{@Repository}} beans are excluded on purpose, so tests run fast and check only mapping, validation, serialization and status codes.
~~~java
@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean OrderService orderService; // Spring Framework 6.2+ (Boot 3.4+)
}
~~~
Boot's {{@MockBean}} still works but has been deprecated since Boot 3.4.

### Why the other options are wrong
- **Constructor injection is not supported**: wrong, constructor injection works fine; the bean is simply missing.
- **Missing @Component**: the error only happens in the test slice while the real app works, so it is not a missing annotation.
- **Add @ComponentScan**: this defeats the purpose of the slice (it loads services, repositories, then demands a DataSource); tests become slow and brittle.

> Senior tip: the Spring test pyramid is many plain unit tests (no context), a layer of slice tests ({{@WebMvcTest}}, {{@DataJpaTest}} + Testcontainers), and few {{@SpringBootTest}}. Every different combination of {{@MockitoBean}} creates its own context cache entry, so standardise the mock set so the context can be reused across tests.`
  },
  "qz-spring-020": {
    "q": `A service has two {{@Scheduled}} methods: {{syncInventory()}} (fixedRate 1 minute, occasionally taking 5 minutes) and {{sendReminders()}} (cron every minute). The application runs on 3 pods, Spring Boot 3, with no scheduler configuration. Which statements are true? (Choose 2)`,
    "options": [
      `Spring automatically elects one pod as leader, so each job runs on only one pod`,
      `Each job runs on all 3 pods, so a reminder can be sent 3 times unless there is a distributed lock (for example ShedLock)`,
      `While syncInventory() runs for 5 minutes, Spring starts 4 more syncInventory() runs in parallel to keep the 1-minute rhythm`,
      `The default scheduler has only 1 thread, so while syncInventory() runs long, sendReminders() is delayed accordingly`,
      `Each @Scheduled method gets its own thread, so they never affect each other`
    ],
    "explain": `**Correct answer: jobs run on every pod; the default scheduler has 1 thread, so a slow job delays the others.**

### Why it is correct
- {{@Scheduled}} is entirely local to the JVM. Three pods mean three independent schedulers, so each job runs three times. You need a distributed lock (ShedLock, backed by a DB table or Redis), or move the job to a single execution point (a Kubernetes CronJob, a dedicated worker).
- Boot auto-configures a {{ThreadPoolTaskScheduler}} with {{spring.task.scheduling.pool.size=1}}. All jobs queue on a single thread, so {{syncInventory()}} taking 5 minutes blocks {{sendReminders()}} for those 5 minutes.

### Why the other options are wrong
- **Elects a leader automatically**: Spring core has no leader election (Spring Integration does, but you must configure it yourself).
- **Runs overlapping in parallel**: with fixedRate a task does not overlap itself; the next run only starts (late) after the previous one finishes.
- **One thread per method**: wrong, by default there is only one shared thread.

~~~yaml
spring.task.scheduling.pool.size: 4   # so independent jobs do not block each other
~~~

> Senior tip: for important jobs, a lock is not enough — you also need **idempotency** (mark the reminder as sent in the DB) because the lock has a TTL: if a run takes longer than {{lockAtMostFor}}, another pod can start it anyway. Add metrics for run duration and the last successful run so you notice a job that "dies silently".`
  },
  "qz-jpa-007": {
    "q": `The {{Order}} entity uses a SEQUENCE id and already exists in the DB. How many SQL statements does the following method produce (ignoring the sequence fetch)?
~~~java
@Transactional
public void addNote(Long id) {
    Order o = orderRepo.findById(id).orElseThrow();
    o.setNote("Delivery during office hours");
    orderRepo.save(o);
}
~~~`,
    "options": [
      `3 statements: SELECT, SELECT (because save calls merge), UPDATE`,
      `1 statement: only UPDATE, because findById reads from the cache`,
      `2 statements: one SELECT in findById and one UPDATE at the flush during commit`,
      `2 statements: SELECT and UPDATE right at the save() line`
    ],
    "explain": `**Correct answer: 2 statements, the SELECT when findById runs and the UPDATE when the flush happens at commit.**

### Why it is correct
1. {{findById}} calls {{em.find}}: the persistence context does not contain the entity, so it runs a SELECT; the entity becomes **managed** and Hibernate keeps a snapshot.
2. {{setNote}} only changes a field in memory.
3. {{save(o)}}: {{SimpleJpaRepository}} sees the entity is not new, so it calls {{em.merge(o)}}. Because {{o}} is already managed, merge simply returns it, **without** any extra query.
4. At commit, Hibernate flushes: dirty checking compares against the snapshot, sees that {{note}} changed, and generates one UPDATE.

### Why the other options are wrong
- **3 statements (merge adds a SELECT)**: merge only runs a SELECT when the entity is **detached** and not yet in the persistence context.
- **1 statement (reads from cache)**: the persistence context starts empty; the L2 cache is off by default.
- **UPDATE right at save()**: save does not flush; the UPDATE only runs at flush (at commit, or before a query that needs fresh data).

> Senior tip: {{save()}} on a managed entity is redundant — delete it and the code behaves exactly the same thanks to dirty checking. Enable {{spring.jpa.properties.hibernate.generate_statistics=true}} in dev or use datasource-proxy to assert the query count in integration tests: this is how you catch N+1s and redundant queries before they reach production.`
  },
  "qz-jpa-008": {
    "q": `When adding an {{OrderItem}} to an order whose id you already know, you only need to set the foreign key, not the {{Order}} data itself. Which approach avoids the unnecessary SELECT on the order?`,
    "options": [
      `orderRepo.findById(orderId).get(), because Hibernate removes the SELECT on its own when it sees only the id is used`,
      `Create new Order(), setId(orderId), assign it to the item and call save(order) first`,
      `Use a native INSERT query for every case`,
      `item.setOrder(orderRepo.getReferenceById(orderId)), because it returns a proxy holding only the id and runs no SELECT`
    ],
    "explain": `**Correct answer: getReferenceById (em.getReference) returns an uninitialised proxy and runs no SELECT.**

### Why it is correct
{{getReferenceById}} calls {{EntityManager.getReference}}: Hibernate creates a proxy that only knows the id. When you assign it with {{item.setOrder(...)}} and persist the item, Hibernate only needs the id to write the {{order_id}} column, so there is just one INSERT. The proxy only runs a SELECT when you call a getter other than the id.

### Why the other options are wrong
- **findById**: always runs a SELECT (if the entity is not already in the persistence context); Hibernate does not reason "only the id is needed".
- **new Order() + setId + save**: a new object with an existing id is treated as detached, so save performs a merge, i.e. a SELECT and then possibly an UPDATE that overwrites the other columns with null. Very dangerous.
- **Native INSERT for every case**: it works but skips lifecycle, cascades and the persistence context; a sledgehammer for something JPA already supports.

### Pitfall
If the id does not exist, getReference does not fail immediately; the failure appears at flush (FK violation) or when the proxy is accessed ({{EntityNotFoundException}}). Using the proxy outside a transaction leads to {{LazyInitializationException}}.

> Senior tip: in a batch import of millions of child rows, switching findById to getReference can halve the number of round trips to the DB. It is a simple optimisation that is often missed in code review.`
  },
  "qz-jpa-009": {
    "q": `According to the JPA specification, which statements about the default FetchType are true? (Choose 2)`,
    "options": [
      `@ManyToOne defaults to EAGER`,
      `@OneToOne defaults to LAZY`,
      `@ElementCollection defaults to EAGER`,
      `@OneToMany defaults to LAZY`,
      `Every association defaults to LAZY`
    ],
    "explain": `**Correct answer: @ManyToOne defaults to EAGER; @OneToMany defaults to LAZY.**

### Why it is correct
The easy-to-remember rule from the JPA specification: **the "to-one" side defaults to EAGER, the "to-many" side defaults to LAZY**.

| Annotation | Default |
|---|---|
| @ManyToOne, @OneToOne | EAGER |
| @OneToMany, @ManyToMany, @ElementCollection | LAZY |

### Why the other options are wrong
- **@OneToOne LAZY**: wrong, it is to-one so it is EAGER.
- **@ElementCollection EAGER**: wrong, it is a collection so it is LAZY.
- **Every association LAZY**: wrong, to-one is EAGER. This misconception is behind the most hidden N+1 problems.

### Why it matters
EAGER on {{@ManyToOne}} means the JPQL query {{select i from OrderItem i}} returning 100 items may pull in up to 100 order SELECTs (if the orders differ), because JPQL does not join EAGER associations automatically and Hibernate has to load them afterwards.

~~~java
@ManyToOne(fetch = FetchType.LAZY) // declare it explicitly
private Order order;
~~~

> Senior tip: the safe convention in most large projects is **every association LAZY**, then fetch exactly what each use case needs with {{JOIN FETCH}} or {{@EntityGraph}}. Note that the non-owning (mappedBy) side of {{@OneToOne}} is usually still loaded eagerly even when declared LAZY, because Hibernate needs to know whether it is null.`
  },
  "qz-jpa-010": {
    "q": `A repository has {{@Query("select o from Order o join fetch o.items")}} with a {{Pageable}} parameter (page size 20). The table has 200,000 orders. How does Hibernate 6 handle this?`,
    "options": [
      `Hibernate logs the warning HHH90003004 (firstResult/maxResults specified with collection fetch; applying in memory): it loads the entire result set and then slices the page in memory`,
      `Hibernate adds LIMIT 20 to the SQL, so it returns exactly 20 orders with all their items`,
      `Hibernate throws an exception as soon as the application starts`,
      `Hibernate automatically rewrites it into two queries: fetch the paginated ids first, then fetch the items`
    ],
    "explain": `**Correct answer: Hibernate warns with HHH90003004 and paginates in memory.**

### Why it is correct
A JOIN FETCH of a collection produces **one row per item**, not one row per order. If Hibernate put LIMIT 20 into the SQL, it would cut in the middle of an order's items and return orders with missing items. So Hibernate removes LIMIT from the SQL, loads the **entire** join result (200,000 orders times the number of items) into memory, and only then takes 20 orders. The data is correct but slow and can cause OOM.

### Why the other options are wrong
- **Adds LIMIT 20 to the SQL**: that is exactly what Hibernate avoids doing because it would return wrong results.
- **Throws at startup**: only when {{hibernate.query.fail_on_pagination_over_collection_fetch=true}} is enabled, and even then the failure happens when the query runs, not at startup. You should enable this flag to turn the warning into an error.
- **Splits into two queries automatically**: Hibernate does not do that; you have to write it.

### The right way: two steps
~~~java
Page<Long> ids = repo.findIds(pageable);               // select o.id ... order by ... (with LIMIT)
List<Order> orders = repo.findWithItems(ids.getContent()); // join fetch ... where o.id in :ids
~~~
Or use {{@BatchSize}}/{{hibernate.default_batch_fetch_size}} to load items in batches.

> Senior tip: grep production logs for HHH90003004 (HHH000104 in Hibernate 5) — this is a "time bomb" that usually only goes off once the table is big enough.`
  },
  "qz-jpa-011": {
    "q": `The {{Post}} entity has two collections, {{List<Comment> comments}} and {{List<Tag> tags}}. The query {{select p from Post p join fetch p.comments join fetch p.tags}} throws an exception as soon as it runs. What is it and why?`,
    "options": [
      `LazyInitializationException because fetching two collections needs two transactions`,
      `MultipleBagFetchException: Hibernate does not allow fetching several "bags" (Lists without an index) at once, because the Cartesian product creates duplicate elements that cannot be told apart`,
      `NonUniqueResultException because the result has several rows with the same Post`,
      `QuerySyntaxException because JPQL allows only one JOIN FETCH per query`
    ],
    "explain": `**Correct answer: MultipleBagFetchException.**

### Why it is correct
A {{List}} without an {{@OrderColumn}} is mapped by Hibernate as a **bag** (duplicates allowed, no positions). Fetching two collections at once produces a Cartesian product: a post with 10 comments and 5 tags generates 50 rows. With a bag, Hibernate cannot tell whether a comment appearing 5 times is caused by the join or by genuinely duplicated data, so it refuses outright.

### Why the other options are wrong
- **LazyInitializationException**: only happens when you touch a lazy association outside a session; unrelated.
- **NonUniqueResultException**: happens when getSingleResult is called and there are several results; here the failure occurs earlier.
- **Only one JOIN FETCH allowed**: wrong, JPQL allows several JOIN FETCHes (for example several to-one, or to-one plus one collection).

### How to fix
1. **Fetch each collection with its own query** (recommended): query 1 fetches comments, query 2 fetches tags for the same list of posts; the persistence context stitches them together.
2. Switch to {{Set}}: the exception goes away, but you **still** get the 50-row Cartesian product, which is extremely slow with large data.

> Senior tip: switching List to Set just to "make the error go away" is the most common wrong fix. 1,000 posts x 50 comments x 20 tags = 1 million rows returned from the DB. Two separate queries return only 70,000 rows.`
  },
  "qz-jpa-012": {
    "q": `An entity uses a generated id and a hand-written {{equals/hashCode}} based on {{id}}. What is the result of the last line?
~~~java
Set<Item> set = new HashSet<>();
Item item = new Item("Pen");   // id = null
set.add(item);
em.persist(item);              // id is assigned, for example 101
em.flush();
System.out.println(set.contains(item));
~~~`,
    "options": [
      `true, because it is the same object`,
      `Throws NullPointerException at set.add because the id is null`,
      `false, because hashCode changes after the id is assigned, so HashSet looks in the wrong bucket`,
      `true, because Hibernate rehashes any collection holding an entity when it persists it`
    ],
    "explain": `**Correct answer: false.**

### Why it is correct
At {{add}} time, hashCode is computed from a null id (for example {{Objects.hashCode(null) = 0}}), so the object lands in the bucket for 0. After persist the id is 101, so hashCode changes. {{contains}} computes the new hashCode, looks in a different bucket, finds nothing, and returns false even though the object is still in the set. This violates the contract: the hashCode of an object inside a HashSet must not change.

### Why the other options are wrong
- **true because it is the same object**: HashSet checks hashCode (the bucket) before comparing with equals/==, so the wrong bucket means it is not found.
- **NullPointerException**: {{Objects.hashCode(null)}} returns 0 and {{Objects.equals}} handles null safely; no NPE is thrown (unless you call id.hashCode() directly).
- **Hibernate rehashes**: Hibernate never touches your own HashSet.

### How to write it safely
~~~java
@Override public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Item other)) return false;
    return id != null && id.equals(other.getId());   // new entities are never equal
}
@Override public int hashCode() { return getClass().hashCode(); } // constant, never changes
~~~
Or use an immutable natural/business key (an SKU code, a UUID generated in the constructor).

> Senior tip: this bug shows up often with a cascaded {{@OneToMany Set<Item>}}: add a new item to the set, save, and then {{remove(item)}} silently fails. Note that using {{getClass()}} can be wrong when compared with a Hibernate proxy, so many teams compare {{Hibernate.getClass(this)}} instead.`
  }
});
