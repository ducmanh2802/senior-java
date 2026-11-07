/*
 * English translation of js/data/q-spring-data.js — task T956. Format: js/core/i18n.js (content overlay).
 * ids: spring-039 spring-040 spring-041 spring-042 spring-043 spring-044 spring-045 spring-046
 */
App.i18n.content({
  'spring-039': {
    q: 'Describe in detail the bean lifecycle from BeanDefinition to a ready bean: BeanFactoryPostProcessor, instantiate, populate, Aware, BeanPostProcessor before/after (AOP proxy is created here), init, SmartInitializingSingleton.',
    a: `**Summary:** Spring does not "create a bean" in a single step but goes through a pipeline with a fixed order: read BeanDefinition → BeanFactoryPostProcessor modifies definitions → instantiate (constructor) → populate properties (DI) → Aware callbacks → BeanPostProcessor.before → init (@PostConstruct/afterPropertiesSet/init-method) → BeanPostProcessor.after (AOP proxy wraps here) → register singleton → SmartInitializingSingleton after the context has finished refreshing. The AOP proxy is only created at the after step, because it must wait until the bean has all its dependencies.

### Pipeline step by step
1. **BeanDefinition** - metadata: class name, scope, constructor args, property values, init/destroy method, lazy flag. This is the "blueprint", not an object yet.
2. **BeanFactoryPostProcessor (BFPP)** - runs before any bean is created (except BFPP/BeanPostProcessor). It can modify BeanDefinitions (for example, PropertySourcesPlaceholderConfigurer replaces \${...}), add definitions. BFPP must be a static @Bean to avoid early init.
3. **Instantiate** - the constructor is called (Objenesis can skip the constructor for a proxy). @Bean factory methods also happen here.
4. **Populate** - inject dependencies via constructor/setter/field. AutowiredAnnotationBeanPostProcessor handles @Autowired.
5. **Aware** - if the bean implements BeanNameAware, BeanFactoryAware, or ApplicationContextAware → invoke the callback. This is how a bean "learns" about the container.
6. **BeanPostProcessor.beforeInitialization** - for example ApplicationContextAwareProcessor, CommonAnnotationBeanPostProcessor (@PostConstruct is called in the init phase by InitDestroyAnnotationBeanPostProcessor, but BPP before can prepare).
7. **Init** - @PostConstruct → InitializingBean.afterPropertiesSet → custom init-method.
8. **BeanPostProcessor.afterInitialization** - AbstractAutoProxyCreator creates the AOP proxy here (CGLIB/JDK). The bean returned to the container is the proxy, not the target.
9. **Singleton registration** - put into singletonObjects (ConcurrentHashMap). From now on getBean returns the proxy.
10. **SmartInitializingSingleton.afterSingletonsInstantiated** - runs after all non-lazy singletons have been created; used for warm-up, cache preload, listener registration.

### Why the proxy is in after, not before
The proxy needs to wrap a fully completed object (all dependencies injected, init done). If the proxy were created before init, init callbacks would run on the target but the proxy would not be wrapping yet → calls from outside would not go through interceptors. Spring chooses after to ensure every init hook has finished on the target before "packaging" it.

### Early reference & circular dependency
When there is a cycle via field/setter injection, Spring exposes an "early reference" (possibly a proxy if the bean needs AOP) before init is complete, so other beans can inject it. This is why a cycle can only be resolved with field/setter injection, not constructor injection. Boot 2.6+ disables this by default because early reference + proxy is fragile (for example, an @Async proxy does not support early reference → "raw version").

### Pitfall production
- BFPP/BeanPostProcessor beans must be static @Bean; otherwise Spring has to early-init the config class → logs "not eligible for getting processed by all BeanPostProcessors" and the BPP may be skipped.
- @PostConstruct runs while the context is still refreshing: DB may not be ready, transactions are not available → do not do heavy I/O; use ApplicationReadyEvent or CommandLineRunner for warm-up.
- Prototype beans do not go through SmartInitializingSingleton and do not invoke destroy callbacks.
- Calling getBean in @PostConstruct of bean A can trigger early creation of bean B → ordering may not be what you expect.

> Senior tip: when debugging "bean not created / proxy not running", print beanDefinitionNames and check whether the class is final, methods are private, or there is self-invocation. Understanding this pipeline is the foundation for debugging every Spring "magic" behavior.`,
    follow: [
      'What is the difference between BeanFactoryPostProcessor and BeanPostProcessor in terms of timing and scope of impact?',
      'Why must the AOP proxy be created in afterInitialization rather than before?'
    ]
  },
  'spring-040': {
    q: 'Auto-configuration in Spring Boot: the AutoConfiguration.imports file, @Conditional*, ordering, and how to read the condition evaluation report (--debug) to understand why a bean was not created.',
    a: `**Summary:** Auto-configuration is "conditional configuration": Boot reads the list of classes in META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports, then registers beans only if the @Conditional* conditions are satisfied. Debug with --debug (condition evaluation report) or /actuator/conditions. The golden rule: @ConditionalOnMissingBean to yield to the user, @ConditionalOnClass to avoid requiring a library that is not present.

### Registration file
One fully-qualified class name per line:
~~~text
META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.acme.config.FlywayAutoConfiguration
~~~
Version note: Boot 3.x uses the .imports file; before Boot 2.7, it used the EnableAutoConfiguration key in META-INF/spring.factories.

### Common conditions
| Annotation | Meaning |
|---|---|
| @ConditionalOnMissingBean | Register only if no bean of the same type is defined by the user |
| @ConditionalOnClass | Register only if the class is on the classpath |
| @ConditionalOnProperty | Enable/disable by property, matchIfMissing = true |
| @ConditionalOnBean | Register only if another bean already exists (ordering dependency) |
| @ConditionalOnWebApplication | Apply only to web applications |

### Example
~~~java
@AutoConfiguration
@ConditionalOnClass(Flyway.class)
@EnableConfigurationProperties(FlywayProperties.class)
public class FlywayAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(name = "spring.flyway.enabled", matchIfMissing = true)
    Flyway flyway(DataSource dataSource) {
        return Flyway.configure().dataSource(dataSource).load();
    }
}
~~~

### Ordering
Use @AutoConfigureBefore / @AutoConfigureAfter to force ordering, @AutoConfigureOrder to sort by number. If not declared, Boot sorts by class name (alphabetical) - it does not infer order from bean dependencies. Missing @AutoConfigureAfter → your auto-config may run before a library bean is ready.

### Debugging
1. Run the app with --debug: the startup log prints a "Condition evaluation report" listing each auto-config and whether conditions matched (matched/unmatched, with specific reasons).
2. Actuator: set management.endpoints.web.exposure.include=health,info,conditions then inspect /actuator/conditions - JSON shows exactly which condition failed.
3. /actuator/env shows how properties resolved.

### Pitfall production
- A @Bean in auto-config without @ConditionalOnMissingBean → overrides user configuration, hard to debug.
- @ConditionalOnClass(X.class) at class-level is safe (Spring reads annotations via ASM, without loading the class). But placing it on a @Bean method with a class literal can throw ClassNotFoundException/NoClassDefFoundError when X is absent. Safe approach: extract a nested @Configuration with the condition at class-level, or use name = "com.x.X" as a String.
- Missing @AutoConfigureAfter/@AutoConfigureOrder → wrong ordering.

> Senior tip: treat auto-config as a public API: every bean must have @ConditionalOnMissingBean, respect properties with sensible defaults, and have a test verifying "if the user defines their own bean, auto-config steps aside". Those are the 3 minimum tests for a production-grade auto-config.`,
    follow: [
      'What is the difference between @ConditionalOnMissingBean and @ConditionalOnMissingClass?',
      'How can you tell which auto-configurations were loaded without enabling --debug?'
    ]
  },
  'spring-041': {
    q: 'Transaction propagation in practice: REQUIRES_NEW holds 2 connections at the same time → pool exhaustion; rollback-only when an exception is swallowed (UnexpectedRollbackException).',
    a: `**Summary:** Propagation defines how a nested transaction behaves relative to an outer transaction. REQUIRES_NEW suspends the outer transaction and creates a completely new transaction with a different connection → holds 2 connections at once. When an exception is caught and swallowed inside, the outer transaction is still marked rollback-only → commit throws UnexpectedRollbackException.

### Comparison table
| Propagation | Outer tx exists | Behavior |
|---|---|---|
| REQUIRED | Yes | Join the outer tx |
| REQUIRES_NEW | Yes | Suspend outer tx, create a new tx (independent commit) |
| NESTED | Yes | Create a savepoint in the current tx |
| SUPPORTS | Yes | Join if present, do not create if absent |
| NOT_SUPPORTED | Yes | Suspend outer tx, run without a transaction |
| MANDATORY | Must exist | Error if no tx |
| NEVER | Must not exist | Error if tx exists |

### REQUIRES_NEW holds 2 connections
Writing an audit log that must survive even if the business transaction rolls back:
~~~java
@Service
public class AuditService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void writeLog(String message) { /* independent commit */ }
}
~~~
The outer tx holds connection #1, REQUIRES_NEW takes connection #2. With a small HikariCP pool, enough concurrent threads exhaust the pool → "Connection is not available". The new tx cannot see uncommitted data from the outer tx, and if it updates a row locked by the outer tx it will wait on itself (hang until lock timeout).

### Rollback-only / UnexpectedRollbackException
When method A (REQUIRED) calls method B (REQUIRED) and B throws a RuntimeException, Spring marks the outer tx rollback-only. If the code catches the exception in A and does not rethrow, A continues and tries to commit → Spring throws UnexpectedRollbackException because the tx is already marked rollback-only. This is the classic "swallowed exception" bug.

How to handle it: if you want to swallow the exception, you must separate the transaction (REQUIRES_NEW) for the part that can fail, or explicitly rollback/commit. Do not swallow exceptions within the same transaction.

### Pitfall production
- REQUIRES_NEW creates inconsistency: the inner tx commits first, the outer tx rolls back later ⇒ the written data remains. Use only when the business accepts it (log, notification).
- NESTED works only when the platform supports savepoints (PostgreSQL, MySQL InnoDB do; some databases do not). On JPA, support is limited.
- Propagation takes effect only when the call goes through the proxy - self-invocation breaks propagation.
- With REQUIRES_NEW, always check connection pool size and set a timeout for waiting on a connection.

### Real-world example
An end-of-day reconciliation job processes 10,000 transactions in **one** outer transaction; for each mismatched transaction it calls {{discrepancyService.record()}} with REQUIRES_NEW to "record it even if the job fails". One day, bad partner data causes 4,000 transactions to mismatch: 4,000 inner transactions open and close sequentially, each taking an extra connection - the job becomes 6x slower but does not crash. Worse: one transaction throws an exception in {{matchService.match()}} (REQUIRED, same transaction), the job **catches and ignores** it to continue → the outer transaction is already marked rollback-only; at the end, commit throws {{UnexpectedRollbackException}} and the **entire** reconciliation result for the day is rolled back, leaving only the discrepancy records (written by REQUIRES_NEW). Redesign: batch 500 transactions per transaction ({{TransactionTemplate}}), handle each transaction's error within its own batch transaction, write discrepancies per batch.

### Model interview answer
"Two propagation traps I see most often. First, REQUIRES_NEW suspends the outer transaction but the connection is still held, so each thread needs two connections; under load, when the thread count reaches the pool size, all threads can wait for a second connection and the system stalls. Second is rollback-only: when a REQUIRED method participating in the same transaction throws an exception through the proxy, the transaction is marked rollback-only; if the caller catches and swallows the exception and then finishes normally, Spring throws UnexpectedRollbackException at commit and everything is rolled back, which is surprising. I handle this by keeping transactions short, batching work with TransactionTemplate so a partial failure does not break a large batch, using REQUIRES_NEW sparingly or replacing it with after-commit events, and never swallowing exceptions inside a transaction."

> Senior tip: before adding REQUIRES_NEW, ask "does the inner transaction truly need to survive if the outer transaction rolls back?". If not, use REQUIRED. When you do use REQUIRES_NEW, always check pool size and set a connection timeout.`,
    follow: [
      'If an inner transaction using REQUIRES_NEW commits successfully but the outer transaction rolls back, what happens to the data?',
      'Why does NESTED not work on every database?'
    ]
  },
  'spring-042': {
    q: '@Async/@Scheduled: default executor in Boot 3, lost context (MDC, SecurityContext, transaction) and how to propagate it (TaskDecorator).',
    a: `**Summary:** @Async runs a method on a different thread managed by a TaskExecutor, relies on a proxy so it inherits AOP limitations. Three big traps: swallowed exceptions; transactions do not propagate to the new thread; ThreadLocal does not propagate (MDC, SecurityContext). Use TaskDecorator to copy context. @Scheduled uses a ThreadPoolTaskScheduler with pool size = 1 by default.

### Default executor in Boot 3
- If there is exactly one TaskExecutor bean, Spring uses it for @Async.
- Spring Boot auto-configures the applicationTaskExecutor bean (core size 8, very large queue, prefix task-).
- If no bean exists, Spring falls back to SimpleAsyncTaskExecutor: **one new thread per task, unbounded** → under load it spawns thousands of threads and can kill the machine. Always declare an explicit executor.

### Executor configuration
~~~java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {
    @Bean("reportExecutor")
    ThreadPoolTaskExecutor reportExecutor() {
        var ex = new ThreadPoolTaskExecutor();
        ex.setCorePoolSize(4);
        ex.setMaxPoolSize(8);
        ex.setQueueCapacity(500);
        ex.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        ex.setThreadNamePrefix("report-");
        ex.initialize();
        return ex;
    }
    @Override public Executor getAsyncExecutor() { return reportExecutor(); }
}
~~~

### Trap 1 - swallowed exception
void method: the exception goes to AsyncUncaughtExceptionHandler (by default only logs), the caller never knows. Method returning Future/CompletableFuture: the exception sits inside the Future; if no one reads it, it is lost. To handle errors: return CompletableFuture<Void> and use whenComplete/exceptionally, and install a custom AsyncUncaughtExceptionHandler (alert/metrics) for void methods.

### Trap 2 - transaction
Transactions are bound to the thread (via TransactionSynchronizationManager), so the new thread has no transaction. Do not expect @Transactional on the calling method to carry over. Put @Transactional on the async method itself (running in the new thread) to get its own transaction.

### Trap 3 - ThreadLocal
MDC (trace id) and SecurityContext do not propagate to the new thread automatically. Use TaskDecorator to copy context:
~~~java
ex.setTaskDecorator(runnable -> {
    var ctx = MDC.getCopyOfContextMap();
    return () -> { MDC.setContextMap(ctx); try { runnable.run(); } finally { MDC.clear(); } };
});
~~~

### @Scheduled
- Requires @EnableScheduling; 3 trigger types: fixedRate (period measured from start), fixedDelay (wait X after completion), cron.
- Timezone defaults to the machine running the app; always specify zone = "Asia/Ho_Chi_Minh" for business-schedule jobs.
- Duplicate runs across multiple instances: use ShedLock (@SchedulerLock) or run a single scheduler instance.
- A long task blocks the scheduler: pool size = 1 by default → a 2-minute task blocks the next one. Configure a larger pool or offload to an async executor.
- Exceptions: Spring wraps the task with a default error handler "log and ignore" → the next run still happens; you must catch exceptions yourself, count error metrics, and alert.

### Pitfall production
- Unbounded queue + producer faster than consumer → memory grows until OOM; always set queue capacity and a rejection policy.
- @Async on a private method or an internal call this.x() → runs synchronously, no error reported.
- Jobs must be idempotent: at-least-once + idempotent to tolerate retries, deploys, clock skew.
- Spring Boot 3.2+ can use a virtual thread executor with spring.threads.virtual.enabled=true - suitable for I/O-heavy work.

> Senior tip: define clearly in the team: @Async is only for non-critical tasks (sending email, logging, updating statistics). For business-critical tasks that must not be lost, push to a message broker with retry/dead-letter. Also add metrics for the number of pending async tasks and failed tasks.`,
    follow: [
      'How do you propagate SecurityContext or a trace id to an async thread safely?',
      'When should you use a message broker instead of @Async?'
    ]
  },
  'spring-043': {
    q: 'Fast Spring Boot startup: lazy init, CDS (Boot 3.3+), AOT + GraalVM native image, CRaC - trade-offs.',
    a: `**Summary:** Spring Boot 3 provides several ways to reduce startup time: lazy initialization (create beans on demand), CDS (Class Data Sharing - share processed class metadata), AOT + GraalVM native image (ahead-of-time compile into a binary), and CRaC (checkpoint/restore the JVM). Each approach trades off startup time, throughput, memory, and debuggability.

### Lazy init
spring.main.lazy-initialization=true: beans are created only when first requested. Reduces startup time and initial memory, but configuration errors (missing bean, wrong property) surface only at runtime instead of at startup, and the first request will be slower. Suitable for dev/local; production usually wants fail-fast.

### CDS (Boot 3.3+)
CDS lets the JVM save parsed/verified class metadata into an archive (.jsa), reused across starts → reduces class loading time. Boot 3.3 supports creating a CDS archive automatically (spring.context.checkpoint). Limitations: must run on the same JDK version and classpath; not every agent is supported; benefits are moderate (often 20-40% faster startup) but throughput does not change.

### AOT + GraalVM native image
AOT processes Spring at build time: bean definitions, proxies, and reflection metadata are generated ahead of time. GraalVM native image compiles into a native binary → extremely fast startup (ms), low memory footprint, but slow builds (minutes), large binaries, and reflection/dynamic proxies must be declared explicitly (reachability metadata). Spring Boot 3 supports native image via the spring-boot-maven-plugin (native profile). Pitfall: code that uses reflection without declaring it will fail at runtime; test coverage must be high because errors only appear when running native.

### CRaC (Coordinated Restore at Checkpoint)
CRaC allows the JVM to checkpoint its entire state (heap + threads) to a file, then restore extremely fast. Spring Boot 3.2+ supports checkpoint (spring.context.checkpoint=onRefresh or always). Unlike native image: it still runs on the JVM so throughput and compatibility are better, but the checkpoint file is large, restore must happen in the same environment, and resources (sockets, file handles) must be closed/reopened via the CRaC Resource interface.

### Trade-off table
| Method | Startup | Throughput | Build time | Compatibility |
|---|---|---|---|---|
| Lazy init | faster | unchanged | unchanged | high |
| CDS | moderately faster | unchanged | build archive | medium |
| Native image | very fast | often lower | very long | low (needs metadata) |
| CRaC | very fast | same as JVM | checkpoint at runtime | medium (resource handling) |

### Pitfall production
- Native image: missing reflection metadata → ClassNotFoundException/NoSuchMethodError at runtime; use the tracing agent to generate metadata.
- CRaC: sockets/file handles do not restore automatically; you must implement Resource and close/reopen; database connection pools must be recreated.
- Lazy init hides config errors; native image hides reflection errors.
- Measure real startup time (time to first request), not just "JVM started".

> Senior tip: do not choose native image just because "startup is fast". If the workload is serverless/short-lived (Lambda, scale-to-zero), native image/CRaC is worthwhile. If it is a long-running service, JVM tuning (G1/ZGC, heap sizing) often delivers better throughput at lower cost. Always measure on a real workload before deciding.`,
    follow: [
      'When should you choose CRaC over a GraalVM native image?',
      'How does a native image affect reflection and dynamic proxies in Spring?'
    ]
  },
  'spring-044': {
    q: 'Spring MVC on virtual threads (spring.threads.virtual.enabled) vs WebFlux: when do you still need reactive?',
    a: `**Summary:** Spring MVC is blocking (thread-per-request); WebFlux is reactive non-blocking (event loop + backpressure). For systems using JDBC/JPA (blocking), WebFlux does not help, and the modern choice is MVC + virtual threads (Java 21). WebFlux is still needed when you require backpressure, streaming/SSE/WebSocket, or fully non-blocking I/O.

### Comparison
| Criteria | Spring MVC | Spring WebFlux |
|---|---|---|
| Thread model | Thread-per-request (blocking) | Event loop + non-blocking |
| Concurrency ceiling | Limited by thread count | Very high, but only when I/O is truly non-blocking |
| DB driver | JDBC/JPA (blocking) | R2DBC (non-blocking) |
| Blocking code | Normal | Blocks the event loop → very dangerous |
| Backpressure | None (relies on thread count) | Yes, limits producer rate |
| Streaming/SSE/WebSocket | Possible (not optimal) | Very good |

### Why WebFlux is "not faster" when using JPA
WebFlux only shines when the entire I/O chain is non-blocking: R2DBC, WebClient, reactive Kafka, SSE. If you still use JPA/Hibernate in the handler, blocking queries will hold the event loop → you lose the very advantage of WebFlux while adding complexity. Combining "WebFlux + JPA" is a sign of poor design.

### Virtual threads change the picture
Java 21 (JEP 444) allows creating millions of lightweight threads. Spring Boot 3.2+ supports:
~~~yaml
spring:
  threads:
    virtual:
      enabled: true
~~~
With this, Tomcat handles each request on a virtual thread: you still write blocking code like normal MVC, but there is no longer a "thread count = concurrent request limit". This is a very reasonable default for CRUD systems using JPA.

### Pitfall production
- Thread pinning: on Java 21, a virtual thread can pin its carrier when blocking inside certain synchronized regions or native methods. Avoid holding a monitor across long blocking I/O operations. JEP 491 (Java 24) removes monitor-related pinning in these cases.
- ThreadLocal still works on virtual threads but memory scales with the number of live threads → avoid storing large data in ThreadLocal.
- With virtual threads, the connection pool should be smaller (the pool is a finite DB resource), not larger.
- Testing: MVC uses MockMvc, WebFlux uses WebTestClient - testing with the wrong type is a common source of bugs.

### When you still need WebFlux
- You need backpressure (producer faster than consumer).
- Streaming/SSE/WebSocket with many concurrent connections.
- Fully non-blocking I/O (R2DBC, WebClient, reactive Kafka).
- Gateway/proxy with very high throughput and low latency.

### Real-world example
A team is rewriting a push notification service - it must keep **50,000 SSE** connections open to the app at the same time; each connection is mostly idle, with occasional events. Experiment: Spring MVC + virtual threads worked, but each connection still occupied a virtual thread and Tomcat buffers, using about 3.2 GB of memory; WebFlux (Netty) with a {{Flux}} per connection and backpressure from a Kafka source: about 1.1 GB, 30% lower CPU. The team chose WebFlux for this service, while 14 other CRUD services moved to MVC + virtual threads because the code is simpler and uses JPA. The criterion was recorded as an ADR: "Use WebFlux when there is streaming or many long-lived open connections and the entire path is non-blocking; otherwise MVC + virtual threads".

### Model interview answer
"With Java 21, Spring MVC with virtual threads enabled solves most of the reasons people used to choose WebFlux: it can serve many concurrent requests waiting on I/O without running out of threads, while keeping blocking code that is easy to write, easy to debug, and works with JPA and JDBC. I still choose WebFlux in a few cases: streaming such as SSE or WebSocket with many long-lived open connections, when I need end-to-end backpressure from the data source to the client, or a gateway/proxy where the entire path is already non-blocking with reactive drivers. WebFlux does not make each request faster, and if the backend is blocking JDBC the benefit is mostly lost while making it easy to block the event loop. So my default is MVC with virtual threads, and WebFlux is a deliberate choice for streaming problems."

> Senior tip: do not choose WebFlux just because "reactive is the trend". If the system is bottlenecked by threads blocked on I/O (DB, HTTP client), switching to virtual threads is a small change with high impact. Switching to WebFlux means rewriting the entire I/O layer - a big cost, worth it only when you truly need backpressure and streaming.`,
    follow: [
      'Why is using WebFlux together with JPA an anti-pattern?',
      'How do virtual threads affect connection pool sizing?'
    ]
  },
  'spring-045': {
    q: 'Spring context refresh phases: prepareRefresh, obtainFreshBeanFactory, invokeBeanFactoryPostProcessors, registerBeanPostProcessors, finishBeanFactoryInitialization, finishRefresh and SmartInitializingSingleton.',
    a: `**Summary:** ApplicationContext.refresh() goes through 12 steps in a fixed order (AbstractApplicationContext.refresh). Understanding the phases helps debug "bean not created", "BPP skipped", and knowing when SmartInitializingSingleton / ApplicationReadyEvent run. Key phases: prepareRefresh → obtainFreshBeanFactory → prepareBeanFactory → postProcessBeanFactory → invokeBeanFactoryPostProcessors → registerBeanPostProcessors → initMessageSource → initApplicationEventMulticaster → onRefresh → registerListeners → finishBeanFactoryInitialization → finishRefresh.

### Main phases
1. **prepareRefresh** - mark started, validate environment, init property sources.
2. **obtainFreshBeanFactory** - create a new bean factory (DefaultListableBeanFactory), load bean definitions from XML/JavaConfig.
3. **prepareBeanFactory** - register special beans (environment, systemProperties, systemEnvironment), add BeanPostProcessor (ApplicationContextAwareProcessor), ignore dependency interfaces.
4. **postProcessBeanFactory** - hook for subclasses (for example, WebApplicationContext adds ServletContext).
5. **invokeBeanFactoryPostProcessors** - run BFPPs (ConfigurationClassPostProcessor parses @Configuration/@ComponentScan/@Import; PropertySourcesPlaceholderConfigurer resolves \${...}). This is when @Configuration classes are processed.
6. **registerBeanPostProcessors** - find and register all BeanPostProcessor beans into the bean factory (sorted by PriorityOrdered/Ordered). After this step, BPPs take effect for beans created later.
7. **initMessageSource** - i18n.
8. **initApplicationEventMulticaster** - event bus.
9. **onRefresh** - subclass hook (web: create theme resolver, etc.).
10. **registerListeners** - register ApplicationListener beans.
11. **finishBeanFactoryInitialization** - pre-instantiate all non-lazy singletons (call getBean for each definition). This is when @PostConstruct, BPPs, and AOP proxies run. SmartInitializingSingleton.afterSingletonsInstantiated runs at the end of this step.
12. **finishRefresh** - publish ContextRefreshedEvent, start SmartLifecycle (lower phase first), log startup info.

### Why this order matters
- BFPPs (phase 5) must run before BPP registration (phase 6) and before instantiation (phase 11), because BFPPs can add/modify bean definitions (for example, @ComponentScan adds definitions). If BPPs were registered before BFPPs, BPPs could be skipped for beans added by BFPPs.
- BeanPostProcessor beans must be instantiated early (in phase 6) to process later beans. This is why @Bean methods returning a BeanPostProcessor must be static.
- SmartInitializingSingleton runs after all singletons have been created → safe to do warm-up that depends on many beans.

### Pitfall production
- The error "BeanPostProcessor ... not eligible" appears when a BPP bean is created too late (after it was needed to process other beans) → usually caused by a non-static @Bean.
- ContextRefreshedEvent can fire multiple times (parent/child contexts) → listeners must be idempotent.
- finishRefresh starts SmartLifecycle in ascending phase order on start, and descending phase order on stop → shutdown order is the reverse of startup.
- ApplicationReadyEvent fires after finishRefresh (and after CommandLineRunner) → this is the safe time for warm-up and health checks.

> Senior tip: when the app starts slowly, enable spring.jmx.enabled and measure each phase, or use the startup endpoint (/actuator/startup) to view the bean timeline. Phase 11 (pre-instantiate) is usually the most expensive - lazy init can help but trades off fail-fast.`,
    follow: [
      'Why must a BeanPostProcessor bean be a static @Bean?',
      'What is the difference between ContextRefreshedEvent and ApplicationReadyEvent?'
    ]
  },
  'spring-046': {
    q: 'Spring Boot test slices (@WebMvcTest, @DataJpaTest, @JsonTest...): mechanism, @MockBean/@SpyBean, and pitfalls when used together with @SpringBootTest.',
    a: `**Summary:** Test slices are annotations that auto-configure only one "slice" of the app (web layer, JPA layer, JSON layer...) instead of the full context, making tests faster and isolated. @MockBean/@SpyBean replace real beans with mocks/spies in the context. Common pitfalls: using @MockBean in @SpringBootTest invalidates the context cache, and mixing a slice with a full context.

### Common slices
| Annotation | Slice |
|---|---|
| @WebMvcTest | Spring MVC + controllers, mock the service layer |
| @WebFluxTest | WebFlux controllers |
| @DataJpaTest | JPA + repositories + embedded DB (auto rollback) |
| @DataJdbcTest | Spring Data JDBC |
| @JsonTest | Jackson/Gson serialization |
| @RestClientTest | RestTemplate/WebClient client |
| @AutoConfigureMockMvc | Add MockMvc to @SpringBootTest |

### Mechanism
A slice annotation uses @ImportAutoConfiguration to load only auto-configs relevant to the slice, and @TypeExcludeFilters to exclude other @Components. Result: a smaller context, faster startup, and testing of exactly the right layer.

### @MockBean / @SpyBean
- @MockBean: replaces the real bean with a Mockito mock in the context; every bean depending on it receives the mock.
- @SpyBean: spy (calls the real method unless stubbed).
- Must be declared at class level or as a field; the mock is reset between test methods (Mockito.reset) but the bean definition remains a mock.
- @MockBean changes the context cache key → if multiple test classes use different @MockBeans, Spring must create new contexts → slow. Use @MockBean in a shared base class or @TestConfiguration to reduce this.

### Pitfalls when used together with @SpringBootTest
1. @SpringBootTest loads the full context; adding @MockBean invalidates the cache across test classes → the test suite slows down.
2. Slice tests do not have real @Service/@Repository beans → if a controller calls a service that is not mocked, the test fails. You must @MockBean the service.
3. @DataJpaTest uses an embedded DB by default and rolls back each test; if you use @Transactional on a test method, rollback follows the test. With @SpringBootTest + @AutoConfigureTestDatabase, configure explicitly.
4. A test slice does not scan the app's @ComponentScan → custom beans in other packages are not present; use @Import to add them.
5. @MockBean on an interface vs class: it must match the actual bean definition (proxy type).

### Pitfall production
- Too many @MockBeans make tests "pass" but do not verify real integration → you still need @SpringBootTest for smoke tests.
- Mocking the repository in @WebMvcTest and testing business logic → testing the wrong layer.
- Context cache: be careful with @DirtiesContext; overuse slows the suite.
- Flaky tests due to shared state (static, singleton) between test methods.

### Under the hood: context cache and why tests get slow
The Spring TestContext **caches** the application context by a "configuration key" (configuration classes, profiles, properties, the list of {{@MockBean}}/{{@MockitoBean}}, initializers…). Two test classes with an identical key share one context; just **one different mock** creates a new context (5-20 seconds each time). {{@DirtiesContext}} forces a rebuild. Starting with Spring Boot 3.4 / Spring Framework 6.2, {{@MockBean}}/{{@SpyBean}} are deprecated, replaced by {{@MockitoBean}}/{{@MockitoSpyBean}} from Spring Framework. Test slices ({{@WebMvcTest}}, {{@DataJpaTest}}) load only part of auto-configuration so they are faster, but beans outside the slice (services, other repositories) must be mocked or {{@Import}}ed.

### Real-world example
A suite of 900 tests took 24 minutes. Logs showed the context was initialized **63 times**: each {{@SpringBootTest}} class mocked a different combination of beans, plus 9 classes had {{@DirtiesContext}}. The team consolidated into 4 base classes with the same mock set (mocking beans even when not needed, for uniformity), moved most controller tests to {{@WebMvcTest}}, repository tests to {{@DataJpaTest}} + shared Testcontainers, and removed {{@DirtiesContext}} by cleaning data after tests. The context was initialized 7 times and the suite dropped to 6 minutes 30 seconds.

### Model interview answer
"A test slice loads only the configuration needed for one layer: WebMvcTest loads controllers, advice, converters, Jackson, and MockMvc without loading services or repositories; DataJpaTest loads JPA, repositories, and by default each test runs in a transaction that is rolled back; JsonTest only verifies serialization. Beans outside the slice are mocked with MockBean, or MockitoBean from Boot 3.4. The important part is that Spring caches the application context by the test class configuration, and each different mock combination creates a new context costing several to tens of seconds; DirtiesContext also forces a rebuild. So I group test classes to share the same configuration and mocks, prefer slices for layer tests, use SpringBootTest for only a few cross-layer flows, and monitor the number of context startups in CI."

> Senior tip: a reasonable testing strategy: slice tests for per-layer logic (fast, many), @SpringBootTest for 1-2 integration smoke tests, and Testcontainers for a real DB. Do not mock the repository and call it an "integration test" - that is just a unit test with a Spring context.`,
    follow: [
      'When should you use @MockBean instead of a manual mock in a pure unit test?',
      'How do you avoid context cache invalidation when using @MockBean across many test classes?'
    ]
  }
});
