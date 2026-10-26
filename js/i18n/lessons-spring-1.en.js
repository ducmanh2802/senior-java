/*
 * English translation of js/data/lessons-spring.js — task T273. Format: js/core/i18n.js (content overlay).
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
If {{OrderService}} calls {{new JdbcOrderRepository()}} itself, the service both holds the business logic and decides how persistence is created. Swapping in another repository means editing dependent code and makes tests hard to inject a fake. IoC reverses the control flow: the application declares components and their relationships, and the container is responsible for assembling them.

### DI and constructor injection
DI is the technique of supplying dependencies from the outside. Constructor injection makes required dependencies explicit, keeps the object valid after construction, and makes unit testing with fakes easy. Spring Boot 3 uses component scanning for stereotypes such as {{@Component}}, {{@Service}}, {{@Repository}}; {{@Bean}} is useful for manually configured objects. The container picks the appropriate constructor, resolves parameters by type and qualifier, then calls the constructor.

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
By default a bean inside a Spring ApplicationContext is a singleton: one instance is reused within that context. The container must analyze the A -> B -> C graph, create dependencies before the dependent bean, then keep the instance in a registry. Singleton does not mean thread-safe; a shared bean with mutable state still needs synchronization or a stateless design. Scope also belongs to each context — it is not a JVM-wide singleton.

| Wiring style | Strength | Risk |
|---|---|---|
| Constructor | Immutable, explicit dependencies, easy to test | Constructor cycles cannot be created directly |
| Setter/field | Can wire after construction | Object temporarily lacks dependencies; fields are hard to test |
| Service locator | Flexible lookup | Dependency hidden inside methods |

### Circular dependency and production
If A needs B in its constructor and B needs A, no complete creation order exists. Spring has some mechanisms to deal with circular references in specific situations, but a constructor cycle is a design that must be fixed — do not rely on workarounds. Extract the shared part into C, or invert the dependency through an interface or event. Common failures include multiple beans of the same type without a qualifier, a component scan missing a package, or a singleton holding request-specific state so user data leaks into another request.

### Interview notes
Be ready to explain the difference between IoC and DI with an example, then trace how the container resolves a constructor. When debugging, check bean definitions, type ambiguity, and dependency cycles before adding random annotations. With Spring Boot 3, prefer constructor injection; use setters only for genuinely optional dependencies.

> Senior tip: A singleton service should keep immutable configuration, never request data in fields. When multiple implementations exist, use a business-meaningful qualifier instead of relying on scan order.`,
    exercises: [{
      title: 'Build a MiniContainer singleton with constructor injection',
      prompt: `Complete {{MiniContainer}}. {{register(type)}} registers a class; {{get(type)}} creates the singleton exactly once and injects the constructor via reflection once its parameters are registered. No-arg constructors are supported. Throw {{IllegalStateException}} for an unregistered type and for circular dependencies; repeated {{get}} calls must return the same instance.`,
      hints: [
        'Separate the definition registry, the singleton registry, and the set of types currently being created.',
        'Mark the type before invoking the supplier; always remove the mark in finally so a bean creation failure cannot wedge the container.',
        'Check singletons with containsKey, because a null value must not be confused with "not created yet".',
      ],
      explain: `A minimal container manages the definition registry and a singleton cache. The supplier represents the bean-creation step and may call get() for dependencies. The {{creating}} set is the current DFS path; re-encountering the same type before it finishes means there is a cycle. The exercise packs constructor injection inside the supplier to focus on the registry; Spring additionally introspects constructors, selects a candidate, resolves qualifiers, and runs lifecycle callbacks. In a real application bean creation can fail halfway, so only cache after the supplier succeeds. The cycle test covers two suppliers calling into each other, and the unknown-type case confirms a clear error.`
    }],
    check: [
      { q: 'Why is constructor injection usually preferred?', options: ['It makes required dependencies explicit and allows immutable objects', 'It automatically makes the bean thread-safe', 'It skips bean creation', 'It only works with prototype scope'], answer: 0, explain: `The constructor shows which dependencies are required, and the object is only created once every collaborator is available. It does not by itself guarantee thread-safety and the container still creates the bean; constructor injection works with every scope.` },
      { q: 'In this design, which boundary makes error handling easier?', options: ['Clear boundaries by responsibility', 'One giant method', 'Swallow every exception', 'Share mutable state globally'], answer: 0, explain: `Clear boundaries by responsibility make it easier to change and test each part in isolation.` },
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
Logging, transactions, and security are concerns that span many services. If every method repeats logging or transaction code, business logic gets mixed with infrastructure and is hard to apply consistently. AOP describes pointcuts and advice; the proxy sits between the caller and the target to apply the extra behavior.

### JDK dynamic proxy
{{java.lang.reflect.Proxy}} creates a runtime object that implements the given interfaces. The InvocationHandler receives the method and arguments; it can log, invoke the method on the target, and return the result. JDK proxies require an interface; Spring can also use subclass proxies depending on configuration and bean type. A proxy does not turn an arbitrary method call into AOP: the caller must hold and call the proxy reference.

~~~java
Object proxy = Proxy.newProxyInstance(loader, interfaces, (p, method, args) -> {
    long start = System.nanoTime();
    try { return method.invoke(target, args); }
    finally { logger.accept(method.getName(), System.nanoTime() - start); }
});
~~~

### Self-invocation and @Transactional
Suppose the caller invokes {{proxy.outer()}}; the proxy delegates to target.outer(). Inside the target, {{this.inner()}} is a direct call on the same target and does not go through the proxy; therefore the advice on inner — including the transaction annotation — is not activated under the proxy model. Move the inner method to another bean so the call passes through that bean's proxy, or place the transaction boundary on the outer method where it fits the business flow. Self-injection and call-through hacks make the flow hard to follow and should be avoided.

| Proxy | How it is created | Note |
|---|---|---|
| JDK | Interface + InvocationHandler | Callers must go through the interface |
| Subclass | Generates a subclass of the target | Final classes/methods cannot be overridden |

### Production pitfalls
Private methods are usually not useful pointcuts for proxies; final methods cannot be overridden by a subclass proxy. Another common mistake is calling through a reference created with {{new}} instead of the Spring-managed bean. When measuring time, use finally so both success and failure are recorded, but avoid logging sensitive payloads. Proxies also add overhead; use metrics with controlled cardinality rather than tagging by user ID.

### Interview notes
Draw the caller -> proxy -> target flow to explain self-invocation. State clearly that this is a limitation of proxy-based AOP — not that the transaction manager fails to detect method calls. If a cross-cutting requirement must also cover self-calls, consider moving the bean boundary or choosing a suitable weaving approach.

> Senior tip: When a transaction unexpectedly does not open, check the bean reference and call path before tweaking propagation. Tracing one request through the proxy usually finds the cause faster than reading isolated annotations.`,
    exercises: [{
      title: 'Logging proxy and internal calls',
      prompt: `Use {{Proxy}} to create a proxy for {{Worker}}. The handler records the method name into the list before invoking the target. Calling {{proxy.outer()}} must log once because outer calls {{this.inner()}} directly; calling {{proxy.inner()}} separately must log one more time.`,
      hints: [
        'Proxy.newProxyInstance receives the class loader, the interfaces, and the InvocationHandler.',
        'The handler sees calls made on the proxy; target.outer() runs inner inside the target.',
        'Method.invoke wraps the target\'s exception in InvocationTargetException.',
      ],
      explain: `The first test confirms the proxy receives outer; because the target then calls inner itself, the handler runs only once. Calling inner directly through the proxy makes the handler record a second entry. This is the core pattern that explains why self-invocation does not activate {{@Transactional}} in proxy-based Spring AOP. InvocationTargetException must be unwrapped so the caller sees the original failure instead of the reflection wrapper.`
    }],
    check: [
      { q: 'In proxy-based Spring AOP, why does this.inner() usually not trigger the advice on inner?', options: ['The method is private, so the JVM does not run it', 'The call goes straight from target to target without passing through the proxy', 'The transaction manager only tracks HTTP', 'AOP only works when compiled with Java 21'], answer: 1, explain: `The proxy applies advice when a call passes through the proxy. this.inner() runs directly on the target. Visibility is not the general reason; transactions are not limited to HTTP, and Java 21 is not a requirement.` },
      { q: 'In this design, which boundary makes error handling easier?', options: ['Clear boundaries by responsibility', 'One giant method', 'Swallow every exception', 'Share mutable state globally'], answer: 0, explain: `Clear boundaries by responsibility make it easier to change and test each part in isolation.` },
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
Inside transaction T1, a REQUIRED method typically reuses T1. If the joined method marks the transaction rollback-only, the final outer commit can fail with an unexpected rollback. REQUIRES_NEW suspends T1, opens T2, and finishes T2 independently; if T2 commits but T1 rolls back, T2's data remains. With a small connection pool, the suspended transaction still holds its connection while T2 needs another one, which can exhaust the pool under load.

| Propagation | Outer transaction present | Result |
|---|---|---|
| REQUIRED | Yes | Joins the outer transaction |
| REQUIRED | No | Creates a transaction |
| REQUIRES_NEW | Yes | Suspends the outer one, runs an independent transaction |

### Rollback rules
By default Spring rolls back on {{RuntimeException}} and {{Error}}. Checked exceptions do not force a rollback by default. You can declare an appropriate rollback rule on {{@Transactional}}, but both specific and generic rules need careful design so you do not accidentally change behavior. Do not swallow an exception and expect the interceptor to know the business logic failed.

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
      title: 'Simulate transaction rollback rules',
      prompt: `Simulate rollback rules with {{TxManager.run(work)}}: successful work increments the commit counter; {{RuntimeException}} and {{Error}} roll back; a marker exception rolls back only when {{rollbackMarker}} is true. Propagate the exception to the caller. This marker exception only models a configured branch — it is not a Java checked exception.`,
      hints: [
        'Classify the exception before updating the counters.',
        'Even when the policy does not roll back, the exception must still be rethrown.',
        'MarkerFailure is a RuntimeException used only to test the configured rule; do not call it a checked exception.',
      ],
      explain: `The harness simulates rollback rules rather than opening a real database transaction. MarkerFailure extends RuntimeException so it can be passed through a Runnable; it only stands for an exception with a custom-configured policy, not for a Java checked exception. In Spring a checked exception does not roll back by default, yet it can still be thrown to the caller — rollback policy and exception propagation are two separate decisions. RuntimeException and Error roll back by default. REQUIRED/REQUIRES_NEW choose the transaction context, independent of exception classification.`
    }],
    check: [
      { q: 'What usually happens when a method runs with REQUIRED and an outer transaction already exists?', options: ['It always creates a new independent transaction', 'It joins the existing transaction', 'It turns off the outer transaction', 'It only runs with a checked exception'], answer: 1, explain: `REQUIRED reuses an existing transaction if there is one and only creates one otherwise. REQUIRES_NEW is what suspends the outer transaction and opens an independent one.` },
      { q: 'In this design, which boundary makes error handling easier?', options: ['Clear boundaries by responsibility', 'One giant method', 'Swallow every exception', 'Share mutable state globally'], answer: 0, explain: `Clear boundaries by responsibility make it easier to change and test each part in isolation.` },
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
The container creates the instance from a constructor or factory method, injects dependencies, invokes callbacks before the bean is ready, then publishes it. Spring offers many extension points such as BeanPostProcessor; the common callbacks are {{@PostConstruct}} and {{@PreDestroy}} (Jakarta). An initialization callback is a good place to validate configuration or prepare resources, but it should not run long, hard-to-retry startup work.

~~~java
@Component
class Cache {
    @PostConstruct void warmUp() { /* validate config, light setup */ }
    @PreDestroy void close() { /* release resources */ }
}
~~~

### Scope
A singleton is one instance per bean definition inside an ApplicationContext. A prototype creates a new object every time the container resolves the bean. Injecting a prototype into a singleton resolves it only once, when the singleton is created; if you need a fresh object each time, use a provider/factory or an appropriate lookup.

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
      prompt: `Write a {{BeanFactory}} that supports SINGLETON and PROTOTYPE. Every bean creation records {{init:name}}; {{close()}} destroys singletons in reverse creation order and records {{destroy:name}}. Every prototype lookup returns a new object.`,
      hints: [
        'Use LinkedHashMap to preserve singleton creation order.',
        'Prototypes never enter the singleton registry.',
        'Closing the factory a second time must not repeat the callbacks.',
      ],
      explain: `The example simulates scopes and callbacks with an event log. Singletons are cached by name; prototypes always create a new object. The factory keeps creation order so it can destroy in reverse. Spring's lifecycle is more complex thanks to post-processors and the dependency graph; destroy ordering follows bean relationships, not just registration order. Prototype cleanup belongs to the consumer, because the container does not keep ownership after handing out the instance.`
    }],
    check: [
      { q: 'What happens when a prototype bean is injected once into a singleton?', options: ['Every method call on the singleton receives a new prototype', 'The singleton keeps the instance resolved at injection time', 'The prototype becomes request-scoped', 'The container does not create the prototype'], answer: 1, explain: `The dependency is resolved when the singleton is created, so that reference stays the same. Getting a new instance each time requires a provider/factory or a lookup mechanism.` },
      { q: 'In this design, which boundary makes error handling easier?', options: ['Clear boundaries by responsibility', 'One giant method', 'Swallow every exception', 'Share mutable state globally'], answer: 0, explain: `Clear boundaries by responsibility make it easier to change and test each part in isolation.` },
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
The servlet container forwards the request to the DispatcherServlet. HandlerMapping selects the controller/method; the HandlerAdapter invokes the handler. HttpMessageConverter reads JSON into a DTO, Bean Validation checks constraints when validation is configured properly, then the controller/service runs the business logic. A converter serializes the returned object into the response. ExceptionResolvers handle exceptions across the pipeline and choose the status/body.

~~~java
record CreateUser(@NotBlank String email) {}
@PostMapping("/users")
ResponseEntity<?> create(@Valid @RequestBody CreateUser request) { ... }
~~~

### Validation boundary
Validate simple syntax and invariants right at the API boundary, for example required fields or ranges. Business rules that need current data — such as whether an email already exists — must be checked in the service/domain, and you still need a database constraint to guard against races. Never return a stack trace or internal exception content to the client.

### ProblemDetail
{{ProblemDetail}} represents an error per RFC 9457 with status, title, detail, instance, and extended properties. You can build the response in an exception handler or use Spring MVC's built-in support. Keep {{type}} stable so clients can classify errors; {{detail}} should be helpful without exposing sensitive data. Validation errors should carry a normalized list of field/message pairs, with a stable order if clients or snapshot tests depend on it.

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
      prompt: `Implement {{MiniDispatcher.dispatch(path, email)}}: {{POST /users}} is valid when the email contains exactly one @ and both sides are non-empty, returning {{Response(201,"created")}}. An invalid email returns 400 with a ProblemDetail-style body whose type is {{validation-error}}. Any other URL returns 404 with type {{not-found}}.`,
      hints: [
        'Match the route before validating the payload.',
        'A single @ must have characters on both sides.',
        'Use a stable type for the client instead of free-form error sentences.',
      ],
      explain: `The dispatcher separates routing, validation, and response mapping into three easy-to-test branches. This is a simulation of the MVC flow: Spring uses DispatcherServlet/HandlerMapping/HandlerAdapter and converters instead of a direct path if-statement. ProblemDetail normalizes error metadata; in a real API you should add structured field errors and never expose internal exceptions. The email format check in the example only illustrates the boundary — it does not replace a proper validator or business rules.`
    }],
    check: [
      { q: 'Where should validation for a not-yet-existing email live?', options: ['Only in a regex in the controller', 'In the service/domain plus a DB constraint to guard against races', 'In the JSON serializer', 'In the DispatcherServlet'], answer: 1, explain: `An existence check depends on data and is a business invariant, so it belongs in the service/domain; a DB unique constraint protects against race conditions. A regex only checks the shape.` },
      { q: 'In this design, which boundary makes error handling easier?', options: ['Clear boundaries by responsibility', 'One giant method', 'Swallow every exception', 'Share mutable state globally'], answer: 0, explain: `Clear boundaries by responsibility make it easier to change and test each part in isolation.` },
    ],
  },
});
