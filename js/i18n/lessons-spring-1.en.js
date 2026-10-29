/*
 * English translation of js/data/lessons-spring.js — task T504 (re-translated after the Vietnamese source changed).
 * Format: js/core/i18n.js (content overlay).
 * ids: lesson-spring-001 lesson-spring-002 lesson-spring-003 lesson-spring-004 lesson-spring-005
 */
App.i18n.content({
  'lesson-spring-001': {
    title: 'IoC and DI: the container manages objects',
    goals: [
      'Tell IoC and DI apart',
      'Describe how the container creates singletons from the dependency graph',
      'Detect circular dependencies',
    ],
    body: `**Summary:** IoC moves the responsibility of creating and wiring objects from business code into the container; DI is how the container supplies dependencies into beans. Spring creates beans from metadata, resolves dependencies, then manages their lifecycle and scope.

### From self-wired dependencies to IoC
If {{OrderService}} calls {{new JdbcOrderRepository()}} itself, the service both holds the business logic and decides how persistence is created. Swapping in another repository means editing the dependent code and makes tests hard to substitute a fake. IoC reverses control: the application declares components and their relationships, and the container is responsible for assembling them.

### DI and constructor injection
DI is the technique of supplying dependencies from the outside. Constructor injection makes required dependencies explicit, keeps the object valid after construction, and makes unit testing with a fake easy. Spring Boot 3 uses component scanning for stereotypes such as {{@Component}}, {{@Service}}, {{@Repository}}; {{@Bean}} is useful for manually configured objects. The container picks an appropriate constructor, resolves parameters by type and qualifier, then calls the constructor. If a class has **exactly one** constructor you do not need {{@Autowired}} (since Spring 4.3); with several constructors you must mark which one should be used for injection.

~~~java
@Service
class OrderService {
    private final OrderRepository repository;
    OrderService(OrderRepository repository) { // required dependency
        this.repository = repository;
    }
}
~~~

### Singleton and the dependency graph
By default a bean inside a Spring ApplicationContext is a singleton: one instance is reused inside that context. The container must analyze the A → B → C graph, create dependencies before the bean that needs them, then keep the instance in a registry. Singleton does not mean thread-safe; a shared bean with mutable state still needs synchronization or a stateless design. Scope belongs to each context — it is not a JVM-wide singleton.

| Wiring style | Strength | Risk |
|---|---|---|
| Constructor | Immutable, explicit dependencies, easy to test | Constructor cycles cannot be created directly |
| Setter/field | Can wire after construction | Object temporarily lacks dependencies; fields are hard to test |
| Service locator | Flexible lookup | Dependency hidden inside methods |

### Circular dependencies in production
If A needs B in its constructor and B needs A, no complete creation order exists: creating A requires B, and creating B requires A. Spring throws {{BeanCurrentlyInCreationException}} as soon as the application starts. With field/setter injection Spring **can** break the loop by handing out an "early" reference to a bean that is not fully initialized (an early singleton reference), but since **Spring Boot 2.6** this behaviour is **disabled by default** ({{spring.main.allow-circular-references=false}}): every dependency cycle makes the app fail at startup. Do not switch that flag back on as a fix; a constructor cycle is a design problem to correct. Extract the shared part into C, or invert the dependency through an interface or an event. Common failures include several beans of the same type without a qualifier, a component scan that misses a package, or a singleton holding request-specific state so one user's data leaks into another request.

### Interview notes
Be ready to explain the difference between IoC and DI with an example, then trace how the container resolves a constructor. When debugging, check bean definitions, type ambiguity, and dependency cycles before adding annotations at random. With Spring Boot 3, prefer constructor injection; use setters only for genuinely optional dependencies.

> Senior tip: A singleton service should keep immutable configuration, never request data in fields. When multiple implementations exist, use a business-meaningful qualifier instead of relying on scan order.`,
    exercises: [{
      title: 'Build a MiniContainer singleton with constructor injection',
      prompt: `Complete {{MiniContainer}} — a tiny DI container that simulates how Spring creates singletons with constructor injection:
- {{register(type)}}: registers a class (like a bean definition).
- {{get(type)}}: if the instance already exists, return **that same instance** (singleton). Otherwise take the class's single constructor via reflection ({{type.getDeclaredConstructors()[0]}} — assume each class has exactly one constructor), call {{get}} recursively for each parameter type, then call the constructor. A no-arg constructor must work too.
- Throw {{IllegalStateException}} when: the type is not registered (even if it is a dependency of another bean), or there is a circular dependency (A needs B, B needs A).
- After one {{get}} fails because of a dependency cycle, the container must still be usable for other beans.`,
      hints: [
        'Use three structures: a {{Set}} of registered types, a {{Map}} from type to created instance (the singleton cache), and a {{Set}} of types **currently being created**.',
        'Add the type to the "in progress" set before resolving constructor parameters; if {{add}} returns false the type is already being created further up the call stack — that is the cycle.',
        'Always remove the type from the "in progress" set in {{finally}}; otherwise one failure makes the container report a phantom cycle on every later call.',
      ],
      explain: `The minimal container keeps three things: the list of definitions, the singleton cache, and the {{creating}} set. When {{get(Service)}} runs it marks Service as being created, sees that the constructor needs a Repo, calls {{get(Repo)}} recursively, creates the Repo, and only then calls the Service constructor — that is a depth-first traversal (DFS) of the dependency graph, where dependencies are created before the bean that uses them.

The {{creating}} set is the "current path" of the DFS: {{get(LoopA)}} marks LoopA → needs LoopB → marks LoopB → needs LoopA → LoopA is already in the set → cycle detected. Spring does exactly this and throws {{BeanCurrentlyInCreationException}}.

Common mistakes:
- Forgetting {{finally}}: after the first failure LoopA/LoopB stay stuck in {{creating}}; the "container usable after cycle failure" test catches this.
- Putting the instance into the cache **before** the constructor finishes (or after it throws): the next {{get}} returns a broken object.
- Checking registration after the cycle check: you report the wrong kind of error and it becomes hard to debug.

Real Spring does much more: it chooses a constructor when there are several, resolves by {{@Qualifier}}/{{@Primary}} when many beans share a type, and runs BeanPostProcessor (where AOP proxies are created) plus lifecycle callbacks.`
    }],
    check: [
      { q: 'Why is constructor injection usually preferred?', options: ['It makes required dependencies explicit and allows immutable objects', 'It automatically makes the bean thread-safe', 'It skips bean creation', 'It only works with prototype scope'], answer: 0, explain: `The constructor shows which dependencies are required (a final field), the object can only be created once every collaborator is available, and testing is easy with {{new Service(fakeRepo)}}. It does not make the bean thread-safe by itself — mutable state still needs synchronization. The container still creates the bean; nothing is "skipped". Constructor injection works with every scope, not only prototype.` },
      { q: 'A Spring Boot 3 app has OrderService injecting PaymentService through a field {{@Autowired}}, and PaymentService also injecting OrderService through a field. What happens at startup?', options: ['It starts normally because field injection always breaks the cycle', 'Startup fails because since Spring Boot 2.6 circular references are forbidden by default', 'Spring creates two instances of each bean', 'It only fails on the first method call'], answer: 1, explain: `Since Spring Boot 2.6, {{spring.main.allow-circular-references}} defaults to false, so every dependency cycle (including through field/setter injection) makes the context fail at startup. Option 1 was true for older Spring Boot versions or when the flag is re-enabled, but not with today's defaults. Spring does not create extra instances to break the cycle. The failure happens while the context is built, not on the first method call.` },
    ],
  },
  'lesson-spring-002': {
    title: 'AOP and proxies: internal calls bypass advice',
    goals: [
      'Describe proxy-based AOP',
      'Explain self-invocation',
      'Build a logging proxy with JDK Proxy',
    ],
    body: `**Summary:** Spring AOP usually wraps a bean in a proxy so advice runs before or after a method call. Advice only runs when the call goes through the proxy; a {{this.otherMethod()}} call inside the target does not come back to the proxy.

### Why a proxy is needed
Logging, transactions and security are behaviour that cuts across many services. If every method repeats logging or transaction code, business logic gets mixed with infrastructure and is hard to apply consistently. AOP describes pointcuts and advice; the proxy sits between the caller and the target to add the extra behaviour.

### JDK dynamic proxy
{{java.lang.reflect.Proxy}} creates a runtime object that implements the given interfaces. The InvocationHandler receives the method and arguments; it can log, invoke the method on the target, and return the result. JDK proxies require an interface. Spring also provides **CGLIB proxies**: it generates a subclass of the target class at runtime and overrides its methods to insert advice. **Spring Boot uses CGLIB by default** for every bean that needs a proxy (even beans that implement interfaces), because {{spring.aop.proxy-target-class=true}} has been the default since Boot 2.0 — which means injecting by the concrete class does not fail with a type mismatch. Whichever kind is used, a proxy does not turn an arbitrary method call into AOP: the caller must hold and call through the proxy reference (the injected bean).

~~~java
Object proxy = Proxy.newProxyInstance(loader, interfaces, (p, method, args) -> {
    long start = System.nanoTime();
    try { return method.invoke(target, args); }
    finally { logger.accept(method.getName(), System.nanoTime() - start); }
});
~~~

### Self-invocation and @Transactional
Suppose the caller invokes {{proxy.outer()}}; the proxy delegates to target.outer(). Inside the target, {{this.inner()}} is a direct call on the same object and does not pass through the proxy; therefore the advice on inner — including the transaction annotation — is not activated under the proxy model. Fix it in this order of preference: (1) move inner to another bean so the call passes through that bean's proxy; (2) put the transaction boundary on the outer method where it matches the business flow; (3) use {{TransactionTemplate}} to open the transaction in code inside the method. Tricks such as self-injection ({{@Lazy}} self-injection) or {{AopContext.currentProxy()}} (which needs {{exposeProxy}} enabled) do work, but they make the flow hard to follow, so avoid them.

| Proxy | How it is created | Note |
|---|---|---|
| JDK | Interface + InvocationHandler | Callers must go through the interface |
| Subclass | Generates a subclass of the target | Final classes/methods cannot be overridden |

### Production pitfalls
**Private** methods are never intercepted by a proxy (a subclass cannot override a private method), and **final** methods are the same with CGLIB. Since Spring Framework 6.0, {{@Transactional}} on protected/package-private methods works with CGLIB proxies, but public is still the safest and clearest choice. Another common mistake is calling through a reference created with {{new}} instead of the bean managed by Spring. When measuring time, use finally so both success and failure are recorded, but avoid logging sensitive payloads. Proxies also add overhead; use metrics with controlled cardinality instead of tagging by user ID.

### Interview notes
Draw the caller -> proxy -> target flow to explain self-invocation. State clearly that this is a limitation of proxy-based AOP — not that the transaction manager fails to detect method calls. If a cross-cutting requirement must also cover self-calls, consider moving the bean boundary or choosing a suitable weaving approach.

> Senior tip: When a transaction unexpectedly does not open, check the bean reference and call path before tweaking propagation. Tracing one request through the proxy usually finds the cause faster than reading isolated annotations.`,
    exercises: [{
      title: 'Logging proxy and internal calls',
      prompt: `Complete {{ProxyFactory.wrap(target, calls)}}: use {{java.lang.reflect.Proxy}} to build a proxy that implements the {{Worker}} interface. The InvocationHandler writes the method name into {{calls}} **before** invoking the matching method on the target, then returns the target's result.
- Calling {{proxy.outer()}} records only {{["outer"]}}, because inside the target, outer calls {{this.inner()}} directly — without going through the proxy.
- Calling {{proxy.inner()}} from the outside records {{["inner"]}}.
- If the target throws an exception (for example {{boom()}} throws {{IllegalArgumentException}}), the proxy's caller must receive **that exact exception**, not the reflection wrapper.`,
      hints: [
        'Proxy.newProxyInstance takes three arguments: a class loader (for example {{Worker.class.getClassLoader()}}), the array of interfaces to implement (only {{Worker.class}}), and an InvocationHandler (the lambda {{(proxy, method, args) -> ...}}).',
        'The handler only sees calls that go **through the proxy**. Inside {{target.outer()}}, the call to {{inner()}} is {{this.inner()}} on the target itself, so the handler never sees it.',
        '{{method.invoke(target, args)}} wraps the target\'s exception in an {{InvocationTargetException}}; catch it and rethrow {{e.getCause()}}.',
      ],
      explain: `The first test confirms the proxy receives outer; the target then calls inner itself, so the handler runs only once. Calling inner directly through the proxy makes the handler record a second entry. This is the core model that explains why self-invocation does not activate {{@Transactional}} in proxy-based Spring AOP: the annotation on inner only matters when the call to inner passes through the proxy.

Why unwrap {{InvocationTargetException}}? {{Method.invoke}} wraps every exception thrown by the target in an {{InvocationTargetException}} (a checked exception). If the handler rethrows it as is and the {{Worker}} interface does not declare that checked exception, the JVM wraps it once more into an {{UndeclaredThrowableException}} — the caller can no longer catch {{IllegalArgumentException}} the way it would when calling the target directly. Spring performs exactly this unwrap, which is why a proxy feels "transparent".

Common mistakes:
- Invoking {{method.invoke(proxy, args)}} instead of {{target}}: the proxy calls itself, recursing until {{StackOverflowError}}.
- Logging after invoke without {{finally}}: a call that throws is never recorded.`
    }],
    check: [
      { q: 'In proxy-based Spring AOP, why does this.inner() usually not trigger the advice on inner?', options: ['The method is private, so the JVM does not run it', 'The call goes straight from target to target without passing through the proxy', 'The transaction manager only tracks HTTP', 'AOP only works when compiled with Java 21'], answer: 1, explain: `The proxy applies advice when a call passes through the proxy. this.inner() runs directly on the target. Visibility is not the general reason — inner is public in the example and is still skipped; transactions are not tied to HTTP, and Spring AOP runs on every supported Java version, so Java 21 is not required.` },
      { q: 'A Spring Boot 3 bean has the method {{@Transactional private void saveAll()}}, called from a public method of the same bean. Is a transaction opened?', options: ['Yes, because Spring scans every annotated method', 'No: private cannot be intercepted by a proxy, and the internal call does not pass through the proxy', 'Yes, if CGLIB proxying is enabled', 'Only when the method returns void'], answer: 1, explain: `There are two reasons combined: a proxy (JDK or CGLIB) cannot override a private method, and the call from inside the bean is this.saveAll(), which does not go through the proxy. Spring does not "scan and run" annotations; it only inserts advice at the proxy. CGLIB is already Spring Boot's default and still cannot intercept private methods. The return type is irrelevant.` },
    ],
  },
  'lesson-spring-003': {
    title: '@Transactional: propagation and rollback',
    goals: [
      'Tell REQUIRED and REQUIRES_NEW apart',
      'Know the default rollback rules',
      'Simulate commit/rollback driven by exceptions',
    ],
    body: `**Summary:** {{REQUIRED}} joins the existing transaction or creates a new one; {{REQUIRES_NEW}} suspends the current transaction and runs an independent one. By default Spring rolls back on unchecked exceptions and {{Error}}, while checked exceptions do not roll back unless you configure it.

### Transaction boundary
A transaction interceptor wraps methods invoked through the proxy. It fetches or creates a transaction according to the propagation, runs the business logic, then commits on success or rolls back by the rules. That is why both the call path through the proxy and the transaction manager matter. The annotation is only metadata — it does not magically turn every method call into a transaction.

### REQUIRED and REQUIRES_NEW
Inside a transaction T1, a REQUIRED method reuses T1 itself (the same connection). The classic trap: an inner method (REQUIRED, called through the proxy) throws a RuntimeException → the inner interceptor marks T1 **rollback-only**; the outer method catches that exception and swallows it, believing everything is fine; when the outer method finishes and Spring tries to commit, it sees the rollback-only flag, rolls everything back and throws {{UnexpectedRollbackException}}. Catching the exception does not clear the rollback-only flag. REQUIRES_NEW suspends T1, opens T2 and finishes T2 independently; if T2 commits but T1 rolls back, T2's data remains. With a small connection pool, the suspended transaction keeps holding its connection while T2 needs another one, which can exhaust the pool under load.

| Propagation | Outer transaction present | Result |
|---|---|---|
| REQUIRED | Yes | Joins the outer transaction |
| REQUIRED | No | Creates a transaction |
| REQUIRES_NEW | Yes | Suspends the outer one, runs an independent transaction |

### Rollback rules
By default Spring rolls back on {{RuntimeException}} and {{Error}}. For a **checked exception** (for example {{IOException}}), Spring by default **commits** what was already written and only then rethrows the exception to the caller — behaviour that surprises many people (it inherits the EJB convention that a checked exception means an "expected business error"). To roll back, declare {{rollbackFor = IOException.class}}; the rule also matches **subclasses** (for example {{FileNotFoundException}}). Conversely, {{noRollbackFor}} keeps the commit for one specific unchecked exception. Do not swallow an exception and expect the interceptor to know the business logic failed: the interceptor only sees an exception leaving the method.

~~~java
@Transactional(rollbackFor = IOException.class)
public void importFile() throws IOException {
    repository.save(...); // the checked exception also rolls back by the rule
}
~~~

### Production pitfalls
A transaction is usually bound to the current thread; moving work to an executor does not carry the transaction to the new thread. In JPA, commit is also when SQL is flushed, so a constraint violation can surface at the end of the method. Calling a slow external API inside a transaction holds a connection and locks for a long time. Place the boundary around the data operations that must be atomic, keep it short, and use an outbox/idempotency when coordinating a database with a message broker.

### Interview notes
For an audit record that must survive even when the main business logic rolls back, REQUIRES_NEW can fit — but weigh consistency and pool impact. For business operations that must commit together, REQUIRED is usually right. Always ask whether the exception is checked or unchecked, whether the method goes through the proxy, and when the SQL flush happens.

> Senior tip: Do not treat REQUIRES_NEW as a fix for every transaction problem. Watch connection-pool active/pending together with transaction duration; a long boundary is usually the bottleneck before propagation becomes the issue.`,
    exercises: [{
      title: 'Simulate the rollback rules of @Transactional',
      prompt: `Simulate the "commit or rollback" part of the transaction interceptor with {{TxManager.run(rollbackFor, work)}}:
- {{work}} is a {{TxWork}} — like Runnable but allowed to throw checked exceptions.
- {{work}} finishes without an error → {{commits++}}.
- {{work}} throws a {{RuntimeException}} or an {{Error}} → {{rollbacks++}} (Spring's default).
- {{work}} throws a checked exception: if it is an instance of **one of the classes** in {{rollbackFor}} (subclasses included) → {{rollbacks++}}; otherwise → {{commits++}} (matching Spring's default: a checked exception still commits).
- In every failure case, rethrow **the original exception** to the caller (no wrapping). The method is declared {{throws Exception}}, so rethrowing anything works.`,
      hints: [
        'Use two catch blocks: {{catch (RuntimeException | Error e)}} first, then {{catch (Exception e)}} for checked exceptions.',
        '{{c.isInstance(e)}} returns true even when e is a subclass of c — exactly how Spring matches {{rollbackFor}}.',
        'Do not wrap the exception ({{new RuntimeException(e)}}): the caller and Spring need to see the original exception type.',
      ],
      explain: `The exercise reproduces the decision Spring's {{TransactionInterceptor}} makes when a method exits: no error → commit; error → ask the rule "does this exception roll back?" (default: yes for RuntimeException/Error, no for checked), then **always** rethrow the exception to the caller. Whether to roll back and whether the exception reaches the caller are two independent decisions.

A real example: {{importFile()}} has already saved 500 rows and hits an {{IOException}} reading row 501. Without {{rollbackFor}}, those 500 rows are **committed** and the caller still receives the IOException — half-written data stays in the database. This is a very common production bug.

Common mistakes:
- Writing {{catch (Exception e)}} before {{catch (RuntimeException e)}}: it does not compile (the later catch is unreachable), or if you merge them you forget to distinguish checked from unchecked.
- Matching with {{c == e.getClass()}}: this misses subclasses, and the {{FileNotFoundException}} test catches it.
- Wrapping the exception before rethrowing: the caller can no longer catch {{IOException}}.

Propagation (REQUIRED/REQUIRES_NEW) decides **which transaction** is used; the rollback rule decides **how it ends** — two different axes.`
    }],
    check: [
      { q: 'What usually happens when a method runs with REQUIRED and an outer transaction already exists?', options: ['It always creates a new independent transaction', 'It joins the existing transaction', 'It turns off the outer transaction', 'It only runs with a checked exception'], answer: 1, explain: `REQUIRED reuses an existing transaction if there is one and only creates one otherwise. REQUIRES_NEW suspends the outer transaction and opens an independent one. No propagation "turns off" the outer transaction; NOT_SUPPORTED merely suspends it. Propagation has nothing to do with the kind of exception.` },
      { q: 'The method {{@Transactional public void importFile() throws IOException}} saves 500 records and then throws {{IOException}}. Nothing else is configured. What is the result?', options: ['All 500 records are rolled back', 'The 500 records are committed and the caller still receives the IOException', 'Spring swallows the IOException and commits', 'Spring wraps it in a RuntimeException and rolls back'], answer: 1, explain: `By default Spring rolls back only on RuntimeException and Error; IOException is checked, so the transaction commits and the exception is then rethrown to the caller. To roll back you must add rollbackFor = IOException.class. Spring neither swallows the exception nor wraps it in a RuntimeException.` },
    ],
  },
  'lesson-spring-004': {
    title: 'Bean lifecycle and scopes',
    goals: [
      'State the bean initialization order',
      'Tell singleton and prototype apart',
      'Manage init/destroy resources',
    ],
    body: `**Summary:** Spring creates the bean, injects its dependencies, runs the initialization callback, then publishes the bean for use; when the context closes, the destroy callback is called for context-managed beans. Singletons are kept inside the context, while a prototype creates a new instance on every request and its destroy lifecycle is not managed by the container the way a singleton's is.

### Basic lifecycle
For a singleton, Spring goes through these steps in exactly this order:

1. **Create the instance**: call the constructor (or the {{@Bean}} factory method); constructor injection happens here.
2. **Inject fields/setters** ({{@Autowired}} on a field or setter).
3. **Aware callbacks**: for example {{BeanNameAware}}, {{ApplicationContextAware}} — the bean receives its own name and the context.
4. **BeanPostProcessor#postProcessBeforeInitialization**: {{@PostConstruct}} is invoked at this step (handled by {{CommonAnnotationBeanPostProcessor}}).
5. **Other init callbacks**: {{InitializingBean.afterPropertiesSet()}}, then the init-method declared in {{@Bean(initMethod = ...)}}.
6. **BeanPostProcessor#postProcessAfterInitialization**: this is where Spring **wraps the bean in an AOP proxy** (for {{@Transactional}}, {{@Async}}…). What goes into the context and gets injected into other beans is this proxy.
7. The bean is ready for use.

When the context closes, a singleton is destroyed in this order: {{@PreDestroy}} → {{DisposableBean.destroy()}} → destroy-method. {{@PostConstruct}}/{{@PreDestroy}} come from the {{jakarta.annotation}} package (Spring Boot 3; older versions used {{javax.annotation}}).

An important consequence of step 6: inside {{@PostConstruct}} the bean is **not yet** wrapped in a proxy, and calling one of its own methods is a self-call — so {{@Transactional}} on a method called from {{@PostConstruct}} has no effect. Work that needs a transaction at startup belongs in an {{ApplicationReadyEvent}} listener or should be called through another bean.

An initialization callback is a good place to validate configuration or prepare light resources; it should not do long-running work (warming a cache for minutes, calling external APIs) because it blocks the whole startup, and a failure there prevents the app from coming up.

~~~java
@Component
class Cache {
    @PostConstruct void warmUp() { /* validate config, light setup */ }
    @PreDestroy void close() { /* release resources */ }
}
~~~

### Scope
A singleton is one instance per bean definition inside an ApplicationContext. A prototype creates a new object every time the container resolves the bean; Spring runs the init callback for a prototype but does **not** call the destroy callback, because once the object is handed out the container no longer holds it. Injecting a prototype into a singleton resolves it only **once**, when the singleton is created; if you need a fresh object each time, inject an {{ObjectProvider<T>}} and call {{getObject()}}, or use a {{@Lookup}} method. Web apps also have the {{request}} and {{session}} scopes: injecting them into a singleton requires a scoped proxy (Spring creates one automatically when you use {{@RequestScope}}).

| Scope | Creation | Destroy callback |
|---|---|---|
| Singleton | Typically once per context | Managed by the context |
| Prototype | Every resolution | The consumer is responsible after receiving it |

### Order and dependency
If A depends on B, B must be ready before A uses it. Beans are usually destroyed in reverse order so the consumer releases before its dependency. Do not rely on ordering between two beans that have no dependency relationship; if you need startup ordering, declare the dependency explicitly.

### Production pitfalls
Do not open a thread or a connection in the constructor if initialization can fail halfway. Make sure a graceful shutdown closes executors and resources. Prototypes that hold resources leak easily because the context does not call destroy for each instance; use try/finally or AutoCloseable where the resource is owned. A singleton bean with shared mutable state causes race conditions. With web scope, a proxy lets a singleton reference a request-scoped bean, but you must understand the request lifecycle.

### Interview notes
Be ready to say who owns the lifecycle and who is responsible for closing resources. If a prototype is injected into a singleton, explain why only one injected instance is ever seen and propose a factory/provider. For shutdown, distinguish a best-effort callback from a guarantee that work finishes before the platform's stop time limit.

> Senior tip: Lifecycle callbacks should be short, idempotent, and clearly logged. Do not treat @PreDestroy as the only line of defense for critical data; the process can be killed or run out of shutdown time.`,
    exercises: [{
      title: 'Simulate scopes and lifecycle callbacks',
      prompt: `Write a {{BeanFactory}} that simulates the SINGLETON and PROTOTYPE scopes:
- {{get(name, scope)}}: SINGLETON is created only the first time, later calls return the same object; PROTOTYPE creates a new object every time. **Every real creation** of a {{Bean}} records an {{init:name}} event into {{events}}.
- {{close()}}: records {{destroy:name}} for the **singletons** in the **reverse** of creation order (beans created later are destroyed first). Prototypes are not destroyed. Calling {{close()}} a second time does nothing.
- After {{close()}}, {{get}} must throw {{IllegalStateException}}.`,
      hints: [
        'Use LinkedHashMap to preserve singleton creation order.',
        'Prototypes never enter the singleton registry.',
        'Closing the factory a second time must not repeat the callbacks.',
      ],
      explain: `The example simulates scopes and callbacks with an event log. Singletons are cached by name in a {{LinkedHashMap}} (which preserves insertion order), so on shutdown you only need to reverse the list to destroy them backwards. Prototypes never enter the cache: the container creates one, hands it out and forgets it, so it cannot call destroy on it — cleanup belongs to the code that received it.

Why destroy in **reverse** creation order? If A uses B then B was created before A. On shutdown A must stop first (it may still be flushing data through B), then B. Real Spring determines this order from the dependency graph between beans, not just creation order.

Common mistakes:
- Using {{HashMap}}: iteration order does not match creation order, so destroy order becomes random.
- Recording {{init}} before checking the cache: a singleton logs init several times even though only one object was created.
- No {{closed}} flag: calling close twice destroys twice — with a real resource (a connection pool) the second close may throw.`
    }],
    check: [
      { q: 'What happens when a prototype bean is injected once into a singleton?', options: ['Every method call on the singleton receives a new prototype', 'The singleton keeps the instance resolved at injection time', 'The prototype becomes request-scoped', 'The container does not create the prototype'], answer: 1, explain: `The dependency is resolved once when the singleton is created, so the field always points to the same object. The container does not refresh the field on each method call; a new instance every time requires {{ObjectProvider}} or {{@Lookup}}. The scope does not silently become request. The container does create the prototype — exactly once, at injection time.` },
      { q: 'A service has a method {{@Transactional void loadData()}} and calls it from its own {{@PostConstruct void init()}}. Why is no transaction opened?', options: ['Because @PostConstruct runs before the bean is wrapped in a proxy (postProcessAfterInitialization), and the call is a self-call', 'Because @PostConstruct always runs on its own thread', 'Because the transaction manager is only created after the HTTP server starts', 'Because @Transactional does not support void methods'], answer: 0, explain: `@PostConstruct runs at the postProcessBeforeInitialization step, before Spring creates the AOP proxy; moreover init() calls this.loadData() on the raw object, not through the proxy. The fix is to run it in an ApplicationReadyEvent listener or call it through another bean. @PostConstruct runs on the thread building the context, not a separate thread. The transaction manager is an ordinary bean and does not wait for the HTTP server. A void return type is fully supported.` },
    ],
  },
  'lesson-spring-005': {
    title: 'Spring MVC request flow, validation and ProblemDetail',
    goals: [
      'Trace a request through the DispatcherServlet',
      'Validate data at the boundary',
      'Return structured errors with ProblemDetail',
    ],
    body: `**Summary:** Spring MVC receives the request at the DispatcherServlet, finds the right handler, converts and validates the input, invokes the controller, then serializes the response. Validation errors should be mapped to a response with a stable schema; Spring Framework 6 supports {{ProblemDetail}} per RFC 9457.

### Request flow
Step through a {{POST /users}} request with a JSON body:

1. The servlet container (Tomcat) accepts the HTTP request, runs it through the **Filters** (for example Spring Security), then hands it to the **DispatcherServlet** — the single servlet of Spring MVC.
2. **HandlerMapping** ({{RequestMappingHandlerMapping}}) looks for a controller method that matches the URL and HTTP method. If none matches → 404 (Spring 6 throws {{NoHandlerFoundException}}/{{NoResourceFoundException}}).
3. **HandlerAdapter** prepares the method arguments. For {{@RequestBody}}, an **HttpMessageConverter** (Jackson) reads the JSON into a DTO; malformed JSON → {{HttpMessageNotReadableException}} → 400.
4. If the argument has {{@Valid}} (the {{spring-boot-starter-validation}} dependency is required), Bean Validation checks constraints such as {{@NotBlank}}, {{@Email}}; a violation → {{MethodArgumentNotValidException}} → 400. The controller is **never called**.
5. The controller calls the service and returns an object; the converter serializes that object into the JSON response.
6. An exception from any step goes to the **HandlerExceptionResolver** — which includes your {{@ExceptionHandler}} methods (usually in a {{@RestControllerAdvice}}) — to choose the status and the body.

~~~java
record CreateUser(@NotBlank String email) {}
@PostMapping("/users")
ResponseEntity<?> create(@Valid @RequestBody CreateUser request) { ... }
~~~

### Validation boundary
Validate simple syntax and invariants right at the API boundary, for example required fields or ranges. Business rules that need current data — such as whether an email already exists — must be checked in the service/domain, and you still need a database constraint to guard against races. Never return a stack trace or internal exception content to the client.

### ProblemDetail
{{ProblemDetail}} represents an error per RFC 9457 (the replacement for RFC 7807) with the fields {{type}}, {{title}}, {{status}}, {{detail}}, {{instance}} and extended properties; the response content type is {{application/problem+json}}. There are two ways to use it: return a {{ProblemDetail}} from your {{@ExceptionHandler}} method, or in Spring Boot 3 enable {{spring.mvc.problemdetails.enabled=true}} so that Spring MVC's standard exceptions (400 validation, 404, 405…) come back as ProblemDetail automatically.

~~~java
@ExceptionHandler(EmailTakenException.class)
ProblemDetail handle(EmailTakenException e) {
    ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "Email is already in use");
    pd.setType(URI.create("https://api.example.com/errors/email-taken")); // clients classify by type
    return pd;
}
~~~ Keep {{type}} stable so clients can classify errors; {{detail}} should be helpful without exposing sensitive data. Validation errors should carry a normalized list of field/message pairs, with a stable order if clients or snapshot tests depend on it.

| Error | Typical HTTP | Handling |
|---|---|---|
| Invalid JSON/validation | 400 | Return structured field errors |
| Resource not found | 404 | Consistent ProblemDetail |
| Business conflict | 409 | State the appropriate recovery |

### Production pitfalls
Do not turn every exception into a 500 or return 200 with an error object. Avoid leaking stack traces, SQL, and tokens. Controller validation does not replace database constraints under concurrent requests. Consider a correlation ID in the logs instead of stuffing the entire context into the response. API versioning and the error schema must stay stable so clients do not depend on free-form wording.

### Interview notes
Describe the request from the servlet to the handler and back through the converter. Distinguish structural validation from business invariants. When designing the error contract, pick the status, a stable type/code, field errors, and correlation information; test both malformed JSON and formally valid data that violates business rules.

> Senior tip: A good error response lets the client decide whether to retry or fix the request. Do not retry 400; for 409/5xx define clear semantics and use idempotency for operations with side effects.`,
    exercises: [{
      title: 'A mini dispatcher with validation and ProblemDetail',
      prompt: `Implement {{MiniDispatcher.dispatch(path, email)}} simulating Spring MVC's processing order for {{POST /users}} ({{Response}} only keeps {{status}} and {{type}} — the most important part of a ProblemDetail):
1. **Routing first**: a path other than {{/users}} → {{Response(404, "not-found")}}, no matter what the email is (just like HandlerMapping finding no handler means validation never runs).
2. **Validation next**: an email is valid when it is not null, contains **exactly one** {{@}}, and both the part before and the part after {{@}} are non-empty. Invalid → {{Response(400, "validation-error")}}.
3. Valid → {{Response(201, "created")}}.`,
      hints: [
        'Match the route before validating the payload.',
        'A single @ must have characters on both sides.',
        'Use a stable type for the client instead of free-form error sentences.',
      ],
      explain: `The dispatcher splits routing, validation and response creation into three steps in Spring MVC's exact order: if no handler is found, the 404 comes back immediately and the handler's arguments (and their validation) are never considered. That is why {{/orders}} with a null email is still a 404, not a 400.

The email check uses {{indexOf('@')}} and {{lastIndexOf('@')}}: the two values being equal means there is exactly one @; {{at > 0}} means the part before is non-empty; {{at < length - 1}} means the part after is non-empty. In a real project use Bean Validation's {{@Email}} instead of writing this yourself.

Common mistakes:
- Validating before routing: a request with a wrong URL gets a 400, and the client wrongly concludes the data is bad.
- Forgetting null: {{email.indexOf}} throws a {{NullPointerException}} → the server returns 500 for an error that should be a 400.
- Returning a free-form sentence as {{type}} ("Email is invalid!"): clients cannot classify it reliably; {{type}} must be a fixed code and the wording belongs in {{detail}}.`
    }],
    check: [
      { q: 'Where should validation for a not-yet-existing email live?', options: ['Only in a regex in the controller', 'In the service/domain plus a DB constraint to guard against races', 'In the JSON serializer', 'In the DispatcherServlet'], answer: 1, explain: `An existence check depends on data and is a business invariant, so it belongs in the service/domain; a DB unique constraint protects against race conditions. A regex only checks the shape. A serializer only converts JSON ↔ objects, and the DispatcherServlet only routes requests — it holds no business logic.` },
      { q: 'A controller has {{create(@Valid @RequestBody CreateUser req)}}; the client sends an empty email that violates {{@NotBlank}}. What happens?', options: ['The controller is called with an empty req.email() and checks it itself', 'Spring throws MethodArgumentNotValidException before calling the controller and returns 400 by default', 'Spring returns 500 because validation failed', 'Jackson refuses to parse the JSON and returns 415'], answer: 1, explain: `Validation runs while the HandlerAdapter prepares the arguments, so the controller is never called; the ExceptionResolver turns MethodArgumentNotValidException into a 400 (as a ProblemDetail when enabled). Option 1 only applies when @Valid or the validation starter is missing. 500 is for server-side failures. Jackson parses the valid JSON normally; 415 means the Content-Type is not supported.` },
    ],
  },
});
