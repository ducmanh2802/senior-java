/*
 * English translation of js/data/q-spring-data.js — task T173. Format: js/core/i18n.js (content overlay).
 * ids: spring-001 spring-002 spring-003 spring-004 spring-005 spring-006 spring-007 spring-008 spring-009 spring-010 spring-011
 */
App.i18n.content({
  'spring-001': {
    q: `How does IoC/DI work in Spring? What is the difference between constructor injection and field injection, and when should you choose each?`,
    a: `**Summary:** IoC (Inversion of Control) reverses the creation authority: instead of a class creating its dependencies itself, the Spring container (ApplicationContext) is responsible for creating objects and "injecting" dependencies. DI (Dependency Injection) is the concrete implementation of IoC. In Spring, **constructor injection is the default choice**: dependencies are explicit, testable with {{new}}, and missing dependencies fail at app startup rather than in production.

### Three dependency injection styles
1. **Constructor injection** – Spring selects the constructor; since Spring Framework 4.3, no {{@Autowired}} is needed if the class has only one constructor.
2. **Setter injection** – for non-mandatory dependencies, or when reassignment is needed after creation.
3. **Field injection** – Spring assigns directly into the field via reflection, without going through the constructor.

### Comparison
| Criterion | Constructor | Field |
|---|---|---|
| Mandatory dependency | Yes, missing fails at startup | No, may be null |
| Unit test | Easy: pass mock via constructor | Requires reflection / framework mock |
| Circular dependency | Detected early | Hidden, easy to create loops |
| Final field | Can be used | Cannot be used |
| Immutability | Clear | Easy to modify unintentionally |

### Example
~~~java
@Service
@RequiredArgsConstructor          // Lombok generates constructor for final fields
public class OrderService {
    private final OrderRepository repo;      // mandatory
    private final PaymentGateway gateway;
}

// This approach is poor
@Service
public class BadOrderService {
    @Autowired private OrderRepository repo;  // hidden dependency, not final, hard to test
}
~~~

### When to still use field/setter injection
- Bean from a third-party library requires a setter (some framework properties).
- Optional dependency: {{@Autowired(required = false)}} or {{Optional<T>}}.
- Case forced to avoid circular dependency with {{@Lazy}} – this is technical debt and should be refactored.

### Pitfall production
- A constructor with 10–15 parameters is a sign that the class violates SRP. Fix by splitting the service by use case, or grouping related properties into a command object.
- Using Lombok {{@Data}} generates both {{@RequiredArgsConstructor}} and {{equals}}/{{hashCode}} based on **all** fields → with JPA entities it causes N+1 and logic errors (see the question on entity equals/hashCode).
- Inject **interface** when you have one implementation, so it's easy to switch to a mock or a second implementation without changing the call site.

> Senior tip: the practical rule for team code review: forbid {{@Autowired}} on fields, enforce constructor injection. The reason is not just "style" – field injection hides the dependency list when reading code and is the most common source of circular dependency that Spring must hide with proxies. A repo can enforce this with a Checkstyle {{IllegalAnnotation}} rule or an ArchUnit test.`,
    follow: [
      'Why did Spring Framework 4.3 remove the {{@Autowired}} requirement when a class has only one constructor?',
      'Does constructor injection make the app start slower, and why?'
    ],
  },
  'spring-002': {
    q: `Describe the lifecycle of a Spring container bean: when do {{@PostConstruct}}, {{BeanPostProcessor}}, {{InitializingBean}} and {{SmartLifecycle}} run?`,
    a: `**Summary:** Bean lifecycle follows this order: read {{BeanDefinition}} → instantiate instance → inject dependencies → {{BeanPostProcessor.postProcessBeforeInitialization}} → {{@PostConstruct}} → {{InitializingBean.afterPropertiesSet}} → init-method → {{BeanPostProcessor.postProcessAfterInitialization}} (this is when Spring wraps the AOP proxy) → bean is ready → {{SmartLifecycle.start}} when context refreshes. At shutdown: {{SmartLifecycle.stop}} runs first (in reverse phase order), then bean destruction: {{@PreDestroy}} → {{DisposableBean.destroy}} → destroy-method.

### Different hooks
| Hook | Timing | Purpose |
|---|---|---|
| {{BeanFactoryPostProcessor}} | Before bean creation, sees only {{BeanDefinition}} | Modify/add definitions, read properties |
| {{BeanPostProcessor}} | Every time a bean is created | Transform bean after initialization (proxy AOP, metrics) |
| {{@PostConstruct}} | After injection is done, once | Prepare resources, validate |
| {{InitializingBean}} | After {{@PostConstruct}} | Equivalent to init-method |
| {{SmartLifecycle}} | After context refresh | Enable/disable according to app lifecycle, ordered by phase |

### Example
~~~java
@Component
class CacheWarmup implements InitializingBean, DisposableBean {
    @PostConstruct
    void init() { /* injected, runs once */ }

    @Override public void afterPropertiesSet() { /* like init-method */ }

    @PreDestroy
    void shutdown() { /* release resources */ }

    @Override public void destroy() { }
}

@Component
class ServerLifecycle implements SmartLifecycle {
    private volatile boolean running;
    @Override public void start() { running = true; }    // ready to serve
    @Override public void stop()  { running = false; }   // stop accepting work
    @Override public boolean isRunning() { return running; }
}
~~~

### Why AOP proxy is at postProcessAfterInitialization
Features based on proxies such as {{@Transactional}}, {{@Async}}, {{@Cacheable}} all need a "wrapper" around the bean. Spring creates that wrapper in {{postProcessAfterInitialization}} (class {{AbstractAutoProxyCreator}}), because only at that point does the bean have all its dependencies to be packaged.

### Pitfall production
- Do not perform heavy DB writes in {{@PostConstruct}}: it runs during context initialization, transactions are not ready, and it slows app startup and may fail. If data warm-up is needed, use {{ApplicationReadyEvent}} or {{CommandLineRunner}}.
- {{@Bean}} that returns {{BeanPostProcessor}} must be **static**, otherwise Spring must create the configuration class early and logs a warning "not eligible for getting processed by all BeanPostProcessors".
- Bean must be singleton for destroy to occur exactly once; prototype beans are not managed this way.

> Senior tip: when debugging Spring, enable {{--debug}} to see auto-config conditions, and use {{ApplicationContext}} + {{getBeanDefinitionNames()}} to understand why a bean is not created. Remember the lifecycle principle: **everything you write in {{@PostConstruct}} must be idempotent**, because app restart / devtools reload will call it again.`,
    follow: [
      'What is the difference between {{BeanFactoryPostProcessor}} and {{BeanPostProcessor}} in terms of timing and scope?',
      'Why does {{@PostConstruct}} not run on a bean created manually with {{new}}?'
    ],
  },
  'spring-003': {
    q: `How do bean scopes differ in Spring? What problem does injecting a {{prototype}} bean into a {{singleton}} bean cause, and how can it be fixed?`,
    a: `**Summary:** {{singleton}} is the default (1 instance per ApplicationContext), {{prototype}} creates a new instance each time it is requested, and {{request}}/{{session}}/{{application}} are tied to web scopes. The classic problem: a singleton holds **one** reference to the prototype, so every use gets back the same first instance – violating the "new instance each time" semantics. The standard fix is {{ObjectProvider<T>}} or {{@Lookup}}.

### Scope table
| Scope | Instance count | Lifecycle managed by Spring |
|---|---|---|
| {{singleton}} | 1 / context | Yes, {{@PreDestroy}} is called |
| {{prototype}} | New each request | No, no automatic destroy callback |
| {{request}} | 1 / HTTP request | Yes, tied to request |
| {{session}} | 1 / HTTP session | Yes |
| {{application}} | 1 / ServletContext | Yes |

### Why prototype inside singleton is a bug
Spring creates the prototype **only once** – at the time the singleton is initialized. From then on the singleton holds that reference for life, so the "prototype" behaves like a singleton. A typical example: a task bean that needs **clean state** each time (counter, buffer) but shares the same instance.

### Fixes
~~~java
@Service
public class ReportRunner {
    // ObjectProvider: gets a NEW instance each time getObject() is called
    private final ObjectProvider<ReportTask> tasks;

    public ReportRunner(ObjectProvider<ReportTask> tasks) { this.tasks = tasks; }

    public void run() {
        ReportTask task = tasks.getObject();  // new prototype each time
        task.execute();
    }
}
~~~

Other options:
- {{jakarta.inject.Provider<T>}} (JSR-330 standard): equivalent to {{ObjectProvider}} but does not depend on Spring API; call {{get()}} to get a new instance.
- {{@Lookup}}: method that returns the prototype type, Spring generates a proxy so each call creates a new instance (requires the host bean to be proxyable).
- {{@Scope(value = "prototype", proxyMode = ScopedProxyMode.TARGET_CLASS)}}: inject a **proxy**, each method call on the proxy creates the real instance.

### Pitfall production
- Prototype beans are **not** managed by Spring lifecycle like singletons: {{@PreDestroy}} does not run by default, connections/threads opened in them will leak. If cleanup is needed, manage it yourself (try-with-resources) or use Spring 6 destroy callback registration.
- A prototype that contains singleton dependencies is safe; the opposite (singleton containing prototype) requires {{ObjectProvider}}.
- Singleton with state (counter, non-synchronized cache) is the source of many race condition bugs – every bean should be stateless by default.

> Senior tip: in code review, inspect which beans hold state and which are injected into singletons. The simple rule: **default beans must be stateless and thread-safe**; if state is needed, use a narrower scope (request/session) or a thread-safe shared structure (Atomic, ConcurrentHashMap).`,
    follow: [
      'Why does Spring not call {{@PreDestroy}} for prototype beans? How do you handle resources in that case?',
      'What is the difference between {{ObjectProvider}} and {{@Lookup}}? When should you use each?'
    ],
  },
  'spring-004': {
    q: `How does {{@Transactional}} work through proxies? Why does calling a {{@Transactional}} method from within the same class fail to create a transaction, and what is the rollback rule for checked exceptions?`,
    a: `**Summary:** {{@Transactional}} does not "label and then auto-activate" – Spring creates a **proxy** around the bean, and {{TransactionInterceptor}} only runs when the method is called **through the proxy**. So self-invocation ({{this.method()}}) does not go through the proxy → no transaction. For rollback: by default only {{RuntimeException}} and {{Error}} trigger rollback; checked exceptions will **commit** unless {{rollbackFor}} is declared.

### Proxy mechanism
1. Container creates the target bean (usually the real class, no annotations).
2. Because of {{@Transactional}}, {{AbstractAutoProxyCreator}} wraps the target in a proxy (CGLIB by default in Spring Boot, JDK proxy by default in Spring Framework).
3. When code calls {{service.placeOrder()}}, the call enters the proxy → interceptor opens or joins a transaction → delegates to the real method → commit/rollback.

### Self-invocation – the most common error
~~~java
@Service
public class OrderService {
    public void placeOrder() {     // NO @Transactional
        saveOrder();               // WRONG: actually this.saveOrder() -> does not go through proxy
    }                              // -> saveOrder runs WITHOUT a transaction

    @Transactional
    public void saveOrder() { /* ... */ }
}
// Similarly: placeOrder with @Transactional(REQUIRED) calls this.audit() with
// @Transactional(REQUIRES_NEW) -> REQUIRES_NEW is skipped, audit runs inside the outer tx.
~~~
Fixes:
- Split into **another service** (best – one service per responsibility).
- Inject the service into itself via {{@Lazy}} to get the proxy: {{private final OrderService self;}} → call {{self.saveOrder()}}.
- Use {{TransactionTemplate}} when manual control is needed.

### Rollback rules
| Exception type | Default | What to declare for rollback |
|---|---|---|
| {{RuntimeException}}, {{Error}} | Rollback | — |
| Checked exception (e.g. {{IOException}}) | **Commit** | {{rollbackFor = Exception.class}} |
| SQL/Hibernate errors | Rollback | already {{RuntimeException}} |

~~~java
@Transactional(rollbackFor = Exception.class)
public void importFile(InputStream in) throws IOException { /* ... */ }
~~~

### Pitfall production
- The exception must **escape** the method to trigger rollback. Catching and swallowing it (no rethrow) causes the transaction to commit despite an error.
- {{private}}, {{final}} or {{static}} methods cannot be proxied → {{@Transactional}} is silently ignored.
- Place {{@Transactional}} at the service layer, not on controllers or repositories (repositories usually have a default transaction).
- {{readOnly = true}} helps Hibernate avoid dirty-checking and can be optimized by the DB; use it for queries.
- If the proxy uses interface-based (JDK proxy), you must inject via the interface, not by concrete class.

> Senior tip: when debugging transactions, check 3 things in order: (1) is the method {{public}} and the class not {{final}}?, (2) is the call going through a proxy or is it self-invocation?, (3) is the exception being swallowed? Add {{logging.level.org.springframework.transaction=DEBUG}} to see transactions starting/committing or rolling back.`,
    follow: [
      'Why is {{@Transactional}} on a {{private}} method silently ignored?',
      'When should you use {{TransactionTemplate}} instead of {{@Transactional}}?'
    ],
  },
  'spring-005': {
    q: `Compare {{@Transactional}} propagation levels ({{REQUIRED}}, {{REQUIRES_NEW}}, {{NESTED}}...): how does each behave when a parent transaction already exists, and when should each be used?`,
    a: `**Summary:** Propagation defines how a nested transaction behaves inside another. {{REQUIRED}} (default) – joins the existing transaction; if none exists, creates a new one. {{REQUIRES_NEW}} – **suspends** the outer transaction, creates a completely new transaction with a different connection, commits independently. {{NESTED}} – creates a **savepoint** inside the current transaction; rollback only rolls back to the savepoint, not the whole transaction.

### Comparison table
| Propagation | Parent tx exists | Behavior |
|---|---|---|
| {{REQUIRED}} | Yes | Joins parent tx |
| {{REQUIRES_NEW}} | Yes | Suspends parent tx, creates new tx (independent commit) |
| {{NESTED}} | Yes | Creates savepoint inside current tx |
| {{SUPPORTS}} | Yes | Joins if exists, does not create if missing |
| {{NOT_SUPPORTED}} | Yes | Temporarily suspends parent tx, runs without transaction |
| {{MANDATORY}} | Must exist | Throws error if no tx |
| {{NEVER}} | Must not exist | Throws error if tx exists |

### REQUIRES_NEW example
~~~java
// Write audit log: must survive even if the business transaction rolls back
@Service
public class AuditService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void writeLog(String message) { /* independent commit */ }
}
~~~

### When to use which
- **REQUIRED**: default, correct for most service methods. Parent and child are one transaction – success means everything succeeds.
- **REQUIRES_NEW**: write audit/log that must exist regardless; or independent work. Note: the inner transaction does **not** see uncommitted data from the outer transaction, and if it updates a row that the outer transaction locks, it will wait on itself (lock timeout).
- **NESTED**: partial rollback is needed but other work must be kept. Only works when the platform supports **savepoint** (PostgreSQL, MySQL InnoDB yes; some others no). JPA support is limited.

### Pitfall production
- {{REQUIRES_NEW}} needs **an additional connection** from the pool (parent holds 1). With a small HikariCP pool, concurrent requests can exhaust the pool → "Connection is not available" error.
- {{REQUIRES_NEW}} creates inconsistency: inner commits before outer rolls back ⇒ the written data remains. Use only when the business accepts this (log, notification).
- {{NESTED}} may not work as expected with JPA due to limited provider support; test on your actual DB.
- Propagation only works when called **through a proxy** – self-invocation will break it too.

> Senior tip: before adding {{REQUIRES_NEW}}, ask: "Does the child transaction really need to survive when the parent rolls back?" If the answer is no, use {{REQUIRED}}. Once you use {{REQUIRES_NEW}}, always check the connection pool size and set a timeout for connection waits.`,
    follow: [
      'What happens when a child transaction uses {{REQUIRES_NEW}} and commits successfully but the parent rolls back?',
      'Why does {{NESTED}} not work on every database?'
    ],
  },
  'spring-006': {
    q: `How does Spring AOP create proxies using JDK dynamic proxy and CGLIB? What limitations of AOP do you often encounter in production?`,
    a: `**Summary:** Spring creates proxies at bean initialization time via {{BeanPostProcessor}}. There are two mechanisms: **JDK dynamic proxy** (proxy by interface) and **CGLIB** (generate a subclass). Spring Framework defaults to JDK proxy if the class has an interface; Spring Boot defaults to CGLIB ({{spring.aop.proxy-target-class=true}}). Both **cannot** proxy {{private}}, {{final}} and {{static}} methods, and both are "disabled" by self-invocation.

### Comparison
| Feature | JDK dynamic proxy | CGLIB |
|---|---|---|
| Mechanism | Interface proxy, real class as target | Subclass of concrete class |
| Method scope | Only methods declared in interface | All public/protected class methods |
| Final class / final method | Not affected | **Cannot proxy** |
| Private/static method | Not proxied | Not proxied |
| Injection style | Must inject via interface | Can inject by concrete class |
| Constructor requirement | None | None (Spring uses Objenesis to create proxy without calling constructor) |

### Configuration example
~~~java
@Aspect
@Component
public class LoggingAspect {
    @Around("execution(* com.acme.service..*.*(..))")
    public Object log(ProceedingJoinPoint pjp) throws Throwable {
        long t = System.currentTimeMillis();
        try { return pjp.proceed(); }
        finally { log.info("{} took {}ms", pjp.getSignature(), System.currentTimeMillis() - t); }
    }
}
~~~

### Production limitations
1. **Self-invocation**: {{this.method()}} does not go through proxy → advice, {{@Transactional}}, {{@Async}}, {{@Cacheable}} do not run.
2. **Private/final/static methods**: cannot be intercepted by proxy.
3. **Final class** when using CGLIB → must remove {{final}} or switch to interface-based proxy.
4. **Many aspects**: Spring stacks proxies into a chain; order is decided by {{@Order}}, and {{@Around}} advice must call {{pjp.proceed()}} exactly once.
5. **Proxy + equals/hashCode**: CGLIB proxy can make {{equals}} compare differently from the real entity.

### When not to use AOP
When the logic needs to run in many places but is not a "cross-cutting concern" (e.g. specific business logic), use composition – one service calling another service – which is clearer and easier to test.

> Senior tip: AOP easily creates a "magic" feeling. Safe team rules: use AOP only for clearly defined **cross-cutting concerns** (logging, metrics, retry, security, audit), always declare {{@Order}} to avoid ambiguous ordering, and write tests that prove the advice actually runs (many AOP bugs slip through review only because no test touches it).`,
    follow: [
      'When should you choose JDK proxy over CGLIB in a Spring Boot project?',
      'Why do {{@Async}} and {{@Cacheable}} suffer from the same self-invocation limitation as AOP?'
    ],
  },
  'spring-007': {
    q: `How does Spring Boot auto-configuration work? How do you register your own auto-config and debug conditions when a bean is not created?`,
    a: `**Summary:** Auto-configuration is a "configure when conditions are met" mechanism: Spring Boot reads the list of classes in {{META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports}}, then registers beans only if the {{@Conditional...}} conditions are satisfied. The golden formula: **{{@ConditionalOnMissingBean}}** so you don't override user configuration, **{{@ConditionalOnClass}}** so you don't require a library not present in the classpath. Debug with the {{--debug}} flag or the {{/actuator/conditions}} endpoint.

### Three most common conditions
| Annotation | Meaning |
|---|---|
| {{@ConditionalOnMissingBean}} | Register only if no user-defined bean of the same type exists |
| {{@ConditionalOnClass}} | Register only if the class is in the classpath |
| {{@ConditionalOnProperty}} | Enable/disable by property, e.g. {{matchIfMissing = true}} |
| {{@ConditionalOnBean}} | Register only if another bean already exists (dependency order) |
| {{@ConditionalOnWebApplication}} | Only applies to web applications |

### Example auto-configuration
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

And the registration file (one fully qualified class name per line):
~~~text
META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.acme.config.FlywayAutoConfiguration
~~~

**Note:** Spring Boot 3.x uses the {{.imports}} file; before Boot 2.7 it used the {{EnableAutoConfiguration}} key in {{META-INF/spring.factories}}.

### Auto-configuration order
Use {{@AutoConfigureBefore}} / {{@AutoConfigureAfter}} to enforce order, and {{@AutoConfigureOrder}} to sort by number. Without declaration, Boot sorts by class name (alphabetical) – it does **not** infer order from bean dependencies.

### Debug
1. Run app with {{--debug}}: startup logs print a "Condition evaluation report" listing each auto-config and whether conditions matched.
2. Actuator: add {{management.endpoints.web.exposure.include=health,info,conditions}} then check {{/actuator/conditions}} – JSON showing exactly which condition failed.
3. {{/actuator/env}} shows how properties resolved.

### Pitfall production
- Adding {{@Bean}} in auto-configuration without {{@ConditionalOnMissingBean}} → overrides user config, making debugging hard.
- {{@ConditionalOnClass(X.class)}} at **class level** is safe (Spring reads annotations via ASM without loading the class). But on a **method {{@Bean}}** with a class literal, it can throw {{ClassNotFoundException}}/{{NoClassDefFoundError}} when X is absent. Safe approach: separate nested {{@Configuration}} with class-level conditions, or use {{name = "com.x.X"}} as a String.
- Missing {{@AutoConfigureAfter}} / {{@AutoConfigureOrder}} → your auto-config may run before other library beans are ready.

> Senior tip: when writing an internal starter, treat it as a **public API**: every bean must have {{@ConditionalOnMissingBean}}, must respect properties with sensible defaults, and must include tests verifying "if the user defines their own bean, the auto-config steps back". These are the three minimum tests for a production-ready auto-config.`,
    follow: [
      'What is the difference between {{@ConditionalOnMissingBean}} and {{@ConditionalOnMissingClass}}?',
      'How can you know which auto-configs were loaded without enabling {{--debug}}?'
    ],
  },
  'spring-008': {
    q: `Why does Spring Boot 2.6+ disallow circular dependency by default? How would you analyze and refactor an A → B → A dependency cycle?`,
    a: `**Summary:** Circular dependency (A depends on B, B depends on A) is blocked by default in Spring Boot 2.6+ with {{spring.main.allow-circular-references=false}} (Boot 3 keeps it). The reason: Spring **can only** resolve cycles via "early reference" + proxy (only with field/setter injection), while constructor-based cycles are a true deadlock. More importantly, a cycle is a design smell – it makes classes mutually dependent, hard to test independently, and difficult to extend.

### How Spring handles cycles
With field/setter injection, the container can: create A (without injecting B) → pass an "early reference" of A to B → inject B into A → then replace the early reference with a proxy. This **does not** work with constructor injection (the constructor needs B immediately), and breaks easily with proxies that don't support early reference such as {{@Async}} (error "has been injected into other beans in its raw version"); standard AOP proxies usually still allow it.

### Why Boot blocks it
- Hides design smell: two classes know each other, violating SRP and DIP.
- Depends on implementation detail (early reference + proxy) – breaks when adding {{@Async}}, {{@Transactional}} or when the class becomes final.
- Before Boot 2.6, the default was **allowed**, so many old projects unknowingly relied on early reference. Upgrading to Boot 2.6+/3.x causes the app to **fail at startup** – this is a common unexpected upgrade break.

### Analysis process when encountering the error
1. Read the error chain: Boot prints the full dependency path (A → B → A) with numbers. Identify the **intersection point** – usually an interface implemented by both, or a service that both calls and is called by.
2. Redraw the dependency diagram and ask: "Does A really need B at initialization time, or only when processing a request?".
3. Check where {{@Lazy}} is being used to "hide" the cycle.

### Refactoring approaches (ordered by priority)
1. **Extract abstraction**: make B depend on an interface defined by A (Dependency Inversion). The cycle usually disappears when the interface ownership is reversed.
2. **Invert dependency by use case**: a "higher-level" service (application service) calls both "lower-level" services – the mediator doesn't need logic, just coordination.
3. **Event-driven**: replace direct calls with {{ApplicationEventPublisher}} + {{@TransactionalEventListener}} on the receiver side. Note: events with {{@TransactionalEventListener}} run **after commit**, so data must be re-read.
4. **Lazy injection** ({{@Lazy}} or {{ObjectProvider<T>}}): create a deferred proxy, breaking the cycle technically. This is a **workaround**, use only for quick fixes on legacy systems.
5. **Split module/service**: if the cycle crosses module boundaries, it signals a missing event bus or a missing shared module.

### Pitfall production
- {{@Lazy}} hides the problem: bean creation errors (if any) only appear at the first call through the lazy proxy at runtime, not at startup.
- Event-driven: if you publish an event inside the same transaction and the listener uses {{@EventListener}} (not {{@TransactionalEventListener}}), the listener runs **before commit** – it reads uncommitted data and can cause deadlocks.
- Prototype-scoped cycles are not solved; cycles between third-party library beans cannot be fixed – you must change the integration approach.

> Senior tip: treat circular dependency as a **design warning**, not a configuration error. In review, ask: "Is this module knowing too much about the other module?" In banking systems with many layers (controller → service → repository → integration), cycles usually appear where a lower layer tries to call back to an upper layer – the correct fix is to extract an abstraction or use an event bus.`,
    follow: [
      'Are there cases where accepting a circular dependency with {{@Lazy}} is acceptable?',
      'How do you detect cycles in a large project besides waiting for the app to fail at startup?'
    ],
  },
  'spring-009': {
    q: `In Spring Security, how does the filter chain work? How do you configure stateless JWT authentication for a REST API and set up an OAuth2 Resource Server?`,
    a: `**Summary:** Spring Security is a **filter-based** architecture: each request passes through {{FilterChainProxy}}, sequentially through filters (read token, build {{SecurityContext}}, check authorization, handle errors). For stateless JWT APIs: disable session, disable CSRF, and authenticate with {{BearerTokenAuthenticationFilter}}. Spring Boot configures almost automatically when you add the {{oauth2-resource-server}} starter and declare {{spring.security.oauth2.resourceserver.jwt.issuer-uri}}.

### Important filter order
| Filter | Role |
|---|---|
| {{SecurityContextHolderFilter}} | Loads {{SecurityContext}} (does not store session by default) |
| {{CsrfFilter}} | CSRF protection for cookie-based requests |
| {{BearerTokenAuthenticationFilter}} | Reads {{Authorization: Bearer ...}} header, validates token |
| {{UsernamePasswordAuthenticationFilter}} | Form login (usually not used for REST) |
| {{ExceptionTranslationFilter}} | Converts 401/403 errors to entry points |
| {{AuthorizationFilter}} | Checks permissions by configured rules |

### Stateless API configuration
~~~java
@Bean
SecurityFilterChain apiChain(HttpSecurity http, JwtAuthenticationConverter converter)
        throws Exception {
    return http
        .csrf(AbstractHttpConfigurer::disable)          // no cookie -> no CSRF needed
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(a -> a
            .requestMatchers("/actuator/health", "/api/public/**").permitAll()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated())
        .oauth2ResourceServer(o -> o
            .jwt(j -> j.jwtAuthenticationConverter(converter)))
        .build();
}
~~~

### JWT authentication mechanism (Resource Server)
- The resource server **does not** issue tokens, it only validates tokens issued by the Authorization Server (Keycloak, Spring Authorization Server, Cognito).
- Declaring {{issuer-uri}} lets Boot fetch {{/.well-known/openid-configuration}}, download the **JWK Set** to verify signatures, and cache with {{NimbusJwtDecoder}}.
- Token must be checked: valid signature, correct {{iss}}, {{exp}} not expired (default 60s clock skew allowed), correct {{aud}} for your API (must configure an {{audience}} validator).
- Authorities: default scope {{read:orders}} → {{SCOPE_read:orders}}. If the token carries a {{roles}} claim, you must declare a custom {{JwtAuthenticationConverter}}.

### Pitfall production
- Disabling CSRF must be paired with **no cookie/session** authentication. If the app has both web session and API, separate filter chains for each.
- Relying only on {{exp}} without checking {{aud}} is a classic vulnerability: a token issued for another service can still be used.
- Refresh token: needs rotation, server-side hash storage, reuse detection.
- Never log the token / {{Authorization}} header; redact in log filters.
- Rate limiting and brute-force blocking are needed at the gateway layer.

> Senior tip: when splitting a system into multiple services, the most common standard is **OAuth2 Resource Server + asymmetric JWT** (RS256/ES256, service holds only the public key from JWKS – not HS256 shared secret, because any service holding the secret can sign tokens): each service verifies independently without calling the auth server per request (latency + single point of failure). Remember this is a **trust boundary**: only services that actually need it receive tokens, and always verify {{aud}} and minimum required scopes.`,
    follow: [
      'What is the difference between a Resource Server and an Authorization Server in OAuth2?',
      'How can you support both token-less (public) and token-required APIs in the same application?'
    ],
  },
  'spring-010': {
    q: `What traps does {{@Async}} have: swallowed exceptions, default executor, transaction and thread-local not propagated?`,
    a: `**Summary:** {{@Async}} runs the method in a different thread managed by a {{TaskExecutor}}. It is also proxy-based, so it suffers the same AOP limitations: self-invocation, {{private}}/{{final}} methods → async does not run. The three biggest traps: (1) **exceptions are swallowed** – the background task errors are not returned to the caller; (2) **transactions are not propagated** to the new thread; (3) **ThreadLocal is not propagated** (MDC, {{SecurityContext}}).

### Enabling and configuring an executor
~~~java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Bean("reportExecutor")
    ThreadPoolTaskExecutor reportExecutor() {
        var ex = new ThreadPoolTaskExecutor();
        ex.setCorePoolSize(4);
        ex.setMaxPoolSize(8);
        ex.setQueueCapacity(500);          // provides backpressure
        ex.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        ex.setThreadNamePrefix("report-");
        ex.initialize();
        return ex;
    }

    @Override public Executor getAsyncExecutor() { return reportExecutor(); }
}
~~~

### What is the default executor?
- If there is **exactly one** {{TaskExecutor}} bean, Spring uses it for {{@Async}}.
- Spring Boot auto-configures {{applicationTaskExecutor}} (core size 8, very large queue, prefix {{task-}}).
- If **no** bean exists, Spring falls back to {{SimpleAsyncTaskExecutor}}: **a new thread per task, no limit** → under high load it creates thousands of threads and kills the machine. Always declare an explicit executor.

### Trap 1 – swallowed exceptions
Method {{void}}: exception goes to {{AsyncUncaughtExceptionHandler}} (default only logs), the caller never knows. Method returning {{Future}}/{{CompletableFuture}}: the exception stays inside the Future, if nobody reads it, it is lost. To handle errors: return {{CompletableFuture<Void>}} and use {{whenComplete}} / {{exceptionally}}, and configure a custom {{AsyncUncaughtExceptionHandler}} (alert/metrics) for void methods.

### Trap 2 – transaction
Transaction is bound to the thread (via {{TransactionSynchronizationManager}}), so the new thread **does not have** it. Do not expect {{@Transactional}} on the calling method to be inherited. Place {{@Transactional}} directly on the async method (running in the new thread) to have its own transaction.

### Trap 3 – ThreadLocal
{{MDC}} (trace id) and {{SecurityContext}} are not automatically propagated to the new thread. Use {{TaskDecorator}} to copy context:
~~~java
ex.setTaskDecorator(runnable -> {
    var ctx = MDC.getCopyOfContextMap();
    return () -> { MDC.setContextMap(ctx); try { runnable.run(); } finally { MDC.clear(); } };
});
~~~

### Pitfall production
- Unlimited queue + faster producer than consumer → memory grows until OOM; always set queue capacity and a rejection policy.
- {{@Async}} on {{private}} or an internal {{this.x()}} call → runs synchronously without error.
- Don't use {{@Async}} to hide an important business flow: if the task fails, there is nothing to retry. Use a durable message broker (RabbitMQ/Kafka/SQS) when delivery must be guaranteed.
- Spring Boot 3.2+ supports a **virtual thread executor** with {{spring.threads.virtual.enabled=true}} – suitable for I/O-heavy tasks.

> Senior tip: define clearly within the team: {{@Async}} is only for **non-critical tasks** (sending email, writing logs, updating statistics). For business-critical tasks that must not be lost, push to a message broker with retry/dead-letter mechanisms. Always add metrics counting pending async tasks and failed tasks – without visibility, silently dead tasks are very hard to detect.`,
    follow: [
      'How do you safely propagate {{SecurityContext}} or a trace id to an async thread?',
      'When should you use a message broker instead of {{@Async}}?'
    ],
  },
  'spring-011': {
    q: `What should be noted about {{@Scheduled}}: timezone, multiple instances running at the same time, long-running tasks, and exception handling?`,
    a: `**Summary:** {{@Scheduled}} requires {{@EnableScheduling}} and has 3 trigger types: {{fixedRate}} (periodic from start), {{fixedDelay}} (wait X after previous finishes) and {{cron}}. Four big traps: default timezone follows the server, duplicate runs when deployed on multiple instances, long tasks block other tasks, and tasks die silently due to exceptions.

### Three trigger types
~~~java
@Scheduled(fixedRate = 60_000)                 // every minute, counted from start
@Scheduled(fixedDelay = 60_000)                // wait 60s after previous finishes
@Scheduled(cron = "0 0 2 * * *", zone = "Asia/Ho_Chi_Minh")
public void rebuildReport() { }
~~~

### Trap 1 – timezone
The default cron uses the **machine's timezone**. If the server is UTC but the Vietnamese business expects 02:00 local time, the job runs at 09:00 local. Always specify {{zone = "Asia/Ho_Chi_Minh"}} for business-time jobs.

### Trap 2 – duplicate runs on multiple instances
When deploying 3 pods, the job runs 3 times simultaneously. Solutions:
- **ShedLock** (popular library): DB-based lock, only one instance runs.
~~~java
@Scheduled(cron = "0 0 2 * * *")
@SchedulerLock(name = "rebuildReport", lockAtMostFor = "30m", lockAtLeastFor = "5m")
public void rebuildReport() { }
~~~
- Separate a single "scheduler instance", or push jobs to a message broker / batch framework.

### Trap 3 – long tasks block the scheduler
Spring uses {{ThreadPoolTaskScheduler}} with default **pool size = 1** → a 2-minute task blocks the next one for 2 minutes. Solution: configure a larger pool, separate a dedicated scheduler for heavy jobs, or have the method delegate to an async executor.

### Trap 4 – exceptions
For repeating tasks ({{fixedRate}}/{{fixedDelay}}/{{cron}}), Spring wraps the task with an error handler that "logs and skips" by default → the next run still happens, the job does not die. But the error is only in the log at ERROR level with no alert → catch exceptions yourself, count error metrics, and alert to avoid losing visibility.

### Pitfall production
- Job must be **idempotent**: it can run again due to retry, deployment interruption, or clock skew.
- Use {{Clock}} bean instead of {{LocalDateTime.now()}} so it is testable and not dependent on machine timezone.
- For long jobs: separate "fetch data" and "write result", write in batches so the transaction does not stay open too long.
- Job writing files/reports: write to a temporary file then rename, so nobody reads an incomplete file.

> Senior tip: treat every scheduled job as a **mini distributed system**: it may run concurrently (multiple instances), re-run (retry), and run late (deployment, GC pause). Design with "at-least-once + idempotent" so the system survives all three. If the job is important, use a batch framework (Quartz, Spring Batch) instead of {{@Scheduled}}.`,
    follow: [
      'Why can {{fixedRate}} cause tasks to pile up compared to {{fixedDelay}}?',
      'How do you ensure a scheduled job is idempotent?'
    ],
  }
});
