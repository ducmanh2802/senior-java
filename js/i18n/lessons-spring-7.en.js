/*
 * English translation of js/data/lessons-spring.js — task T1016. Format: js/core/i18n.js (content overlay).
 * ids: lesson-spring-012 lesson-spring-013
 */
App.i18n.content({
  'lesson-spring-012': {
    title: 'AOP: interceptor chain, @Order and the clash between @Transactional and @Retryable',
    goals: [
      'Explain the AOP proxy, MethodInterceptor and the role of proceed() in the call chain',
      'State the advisor ordering rule from @Order/Ordered: a smaller value runs more outward, and the consequence when transaction meets retry',
      'Build a proxy by hand with java.lang.reflect.Proxy and an ordered interceptor chain, then observe the log order and retry behaviour',
    ],
    body: `**Summary:** AOP (Aspect-Oriented Programming — adding cross-cutting behaviour such as logging, transactions and security without editing business code) in Spring runs through a **proxy** (an object standing between the caller and the real bean). Each behaviour is an **interceptor/advice** (a component that intercepts the call) arranged into a chain; calling {{proceed()}} (continue) hands control to the next link and eventually the real method. Ordering decides who wraps whom: an advisor with a **smaller order** has higher priority and is usually placed **more outward**, so it runs before entry and after exit. Therefore "does {{@Transactional}} wrap {{@Retryable}} or the other way around" is not a riddle — it depends on each advisor's order.

### Proxy and the interceptor chain: step by step
1. **You call a method on a bean.** If the bean uses AOP, the reference you hold is usually a proxy, not the object you {{new}}ed.
2. **The proxy builds the interceptor chain** matching that method (transaction, retry, cache, security...).
3. **Link 1 runs its "before" part**, then calls {{proceed()}}.
4. **{{proceed()}} jumps into link 2**, ... until the real method.
5. **The result/exception travels back outward**: link 2 runs its "after" part, then link 1. Like wrapping a gift in several layers: the outermost layer is opened first and closed last.

~~~text
caller -> [Interceptor A, low order, outer]
            before A
              -> [Interceptor B, high order, inner]
                   before B
                     -> real method
                   after B
            after A
       <- result
~~~

In pure Spring AOP the core contract is {{org.aopalliance.intercept.MethodInterceptor}} with {{Object invoke(MethodInvocation mi)}}; inside it you **must** call {{mi.proceed()}} for the real method to run. If you forget {{proceed()}}, the chain stalls and the real method is never called — a silent bug that is hard to see. (Spring also has {{@Aspect}} with {{@Around}}/{{ProceedingJoinPoint}}; the proceed concept is identical.)

### @Order/Ordered: who is on the outside?
Spring sorts advisors by {{Ordered.getOrder()}} (or {{@Order}}). **Rule of thumb:** a smaller value = higher priority = usually placed **more outward** in the advice chain. The default value when nothing is declared is "lowest priority" ({{Ordered.LOWEST_PRECEDENCE}}). Because different advice types have their own sorting logic, the safest approach is to set an **explicit order** on the advisors you control and never guess.

The classic consequence: **{{@Transactional}} (open/close a DB transaction — a group of operations that either all succeed or all roll back) meets {{@Retryable}} (retry on failure, usually from Spring Retry)**.

| Order (outer → inner) | What happens | When it fits |
|---|---|---|
| Transaction **outer**, Retry **inner** | Open 1 transaction → run method → on failure retry **inside that same transaction** (a new transaction is not opened unless propagation is configured otherwise) → if all retries fail the outer transaction rolls back everything | Rarely used; retrying inside a "dirty"/rollback-only transaction is usually meaningless for the DB |
| Retry **outer**, Transaction **inner** | Each attempt runs in a **fresh transaction**: attempt 1 fails → roll back tx1 → retry opens tx2 → ... | Common when the failure is transient (deadlock, timeout) and you want each attempt to be a clean transaction |

~~~seq
title: Retry outer, Transaction inner (each attempt = new tx)
actors: Caller | Retry | Tx | DB
Caller -> Retry: call method
Retry -> Tx: attempt 1
Tx -> DB: begin + SQL
DB --> Tx: transient error
Tx --> Retry: rollback tx1
Retry -> Tx: attempt 2
Tx -> DB: begin + SQL
DB --> Tx: OK
Tx --> Retry: commit tx2
Retry --> Caller: result
note Retry,Tx: Retry wraps Tx outside: each attempt has its own transaction
~~~

Practical note: the default order between {{TransactionInterceptor}} and Spring Retry's advice depends on version/configuration (Spring Retry uses {{@EnableRetry(order=...)}}; {{@Transactional}} uses {{@EnableTransactionManagement(order=...)}}). **Do not rely on the default when correctness depends on order** — set explicit orders and verify with tests/logs.

### Conceptual example (illustrating order)
~~~java
// Illustrates: interceptor before/after and calling proceed()
class LoggingInterceptor implements MethodInterceptor { // aopalliance
  public Object invoke(MethodInvocation mi) throws Throwable {
    System.out.println("log: before " + mi.getMethod().getName());
    try { return mi.proceed(); }               // FORWARD: mandatory
    finally { System.out.println("log: after"); }
  }
}
// RetryInterceptor similar: loop calling mi.proceed(), catch exception, retry
~~~

### Common pitfalls
- **Forgetting {{proceed()}}**: the real method never runs, returns {{null}} or silently drops logic — hard to debug because there is no clear stack trace.
- **Calling a method within the same class** ({{this.other()}}): the internal call goes straight to the real object and **bypasses the proxy**, so AOP (transaction, retry, cache) is not triggered. Fix: split into a separate bean, self-inject via the proxy, or use AopContext (rare, needs configuration).
- **Retry inside a dirty transaction**: a transaction that has already failed may be marked rollback-only (depending on DB/driver/JPA) — retrying inside the same tx will fail even though the logic "should" be retriable.
- **Swallowing exceptions in an interceptor**: retry/transaction rely on exceptions to decide; swallowing an error makes the system think it succeeded.
- **Guessing the default order**: changing version/config can change the order; always set {{@Order}}/{{order}} explicitly when it matters.

### Interview notes
Answer concisely: "Spring AOP uses a proxy wrapping the bean; each advice is an interceptor that calls {{proceed()}} to move forward. A smaller order has higher priority and sits more outward. With transaction and retry you usually want **retry outer, transaction inner** so each attempt is a fresh transaction; if transaction wraps retry outside, all attempts share one transaction — often not what you want for a clean rollback between attempts." Add the self-invocation pitfall to score senior points.

> Senior tip: When "sometimes commits, sometimes rolls back strangely" shows up together with retry, log the advisor order (debug AOP or enable logging for {{org.springframework.aop}}) and check propagation. Do not fix it by stacking {{@Transactional}} before you understand which interceptor is outermost.`,
    exercises: [
      {
        title: 'Build a JDK proxy with an ordered interceptor chain and retry',
        prompt: `Given interface {{CounterOps}} and class {{CounterImpl}} (each call to {{work()}} increments {{CounterImpl.calls}}; if {{failTimes > 0}} it throws {{RuntimeException("boom")}} and decrements {{failTimes}}). Write {{Aop.wrap(target, iface, interceptors)}} using {{java.lang.reflect.Proxy}} to wrap {{target}}: when a method is called, run the {{interceptors}} chain in **the exact list order** (element 0 is **outermost**), each interceptor calling {{inv.proceed()}} to continue; only at the end call the real method on {{target}}. You may use the helper types provided in the starter: {{Around}} (interceptor) and {{Invocation}} (holds target/method/args/list/index and {{proceed()}}). Tests check the before/after log order and an interceptor that retries (up to N attempts on {{RuntimeException}}).`,
        hints: [
          '{{Invocation.proceed()}}: if {{index < chain.size()}} take {{chain.get(index++)}} and call {{next.invoke(this)}}; if the chain is exhausted then {{method.invoke(target, args)}}. Use {{index++}} to advance to the next link.',
          'In Aop.wrap, create an InvocationHandler: for business methods, create a new Invocation and return inv.proceed(). Use Proxy.newProxyInstance.',
          'Element 0 of the list is outermost: it is called first by the first {{proceed()}}, so the "A-before" log appears before "B-before". The retry interceptor loops calling {{inv.proceed()}} — each time it reruns the rest of the chain up to the target.',
        ],
        explain: `The solution captures the two core ideas of a Spring AOP proxy. (1) **Static chain, dynamic pointer:** {{Invocation}} keeps {{index}}; each {{proceed()}} jumps to the next interceptor, and only when the chain is exhausted does it reflectively invoke the real method. Because element 0 runs first, it naturally "wraps outside" element 1 — so before/after form a U shape: {{A-before, B-before, (target), B-after, A-after}}. (2) **Retry = calling {{proceed()}} again:** the retry interceptor sits in the chain; when it calls {{proceed()}} a second time it reruns the rest of the chain (and reaches the target) — that is why {{calls == 3}}. If retry sits **inside** a transaction interceptor (transaction outer, retry inner) and that transaction opens only once on the outside, all retries share the same context — which models the "{{@Transactional}} wraps {{@Retryable}}" problem. Moving retry outside the transaction interceptor (at framework level) gives each attempt its own transaction.`,
      }
    ],
    check: [
      { q: 'In a Spring AOP chain, what happens if a {{MethodInterceptor}} does not call {{proceed()}}?', options: ['The target method still runs but without after-advice', 'The target method does not run and the inner interceptors are also skipped', 'Spring calls {{proceed()}} automatically', 'It only affects logging, not transactions'], answer: 1, explain: '{{proceed()}} is the mechanism that forwards the chain. Not calling it means neither the real method nor the inner links run — it can deliberately block a call (useful for security/cache), but forgetting it is a bug.' },
      { q: 'To have every {{@Retryable}} attempt run in a **fresh transaction** (clean rollback then retry), which advisor ordering fits better?', options: ['@Transactional wrapping @Retryable outside (retry runs inside the same transaction)', '@Retryable wrapping @Transactional outside (each attempt opens a new transaction inside)', 'Order does not matter because each annotation manages itself', 'Just set propagation = REQUIRED'], answer: 1, explain: 'Retry on the outside calls the whole inner part again, including the transaction interceptor — so each attempt goes through open transaction / commit or rollback separately. If transaction wraps retry outside, all attempts share one transaction. In practice you must configure explicit orders (Spring Retry {{@EnableRetry(order)}}, transaction management {{order}}) because defaults may differ from expectations.' },
      { q: 'Why does calling {{this.internal()}} (which has {{@Transactional}}) from another method in the same class often **not** open a transaction?', options: ['Because {{@Transactional}} only applies to public static methods', 'Because the internal call goes straight to the real object, bypassing the AOP proxy', 'Because Java does not allow calling a method on itself', 'Because a transaction only opens with {{@Autowired}}'], answer: 1, explain: 'Spring AOP (proxy-based by default) only intervenes when the call goes **through the proxy**. Calling {{this...}} directly does not go through the proxy, so the transaction/retry interceptor never runs. This is the classic self-invocation trap.' }
    ],
  },
  'lesson-spring-013': {
    title: 'Bean lifecycle and BeanPostProcessor: From instantiation to proxy',
    goals: [
      'State the bean lifecycle steps in order: instantiate → populate → Aware → BPP before → init → BPP after',
      'Explain BeanPostProcessor before/after and why the AOP proxy is usually created in afterInitialization',
      'Write a mini container that records callback order and returns a proxy from a BPP, then verify the bean received is a proxy',
    ],
    body: `**Summary:** Spring creates a singleton bean through several ordered steps. Two important hooks are **BeanPostProcessor** (BPP — a post-processor that runs for *every* bean) with {{postProcessBeforeInitialization}} and {{postProcessAfterInitialization}}. The AOP proxy ({{@Transactional}}, {{@Async}}, {{@Cacheable}}...) is usually attached in **afterInitialization** by returning a different wrapping object — so code running in {{@PostConstruct}} (the init step) may **not yet** go through the proxy.

### Lifecycle order (simplified, enough for debugging)
1. **Instantiate** (create the object): call the constructor → you have a "raw" instance.
2. **Populate properties** (inject dependencies): assign {{@Autowired}} fields/setters and configuration values.
3. **Aware callbacks** (know the context): if the bean implements {{BeanNameAware}}, {{BeanFactoryAware}}, {{ApplicationContextAware}}... Spring calls the corresponding setters.
4. **{{BeanPostProcessor.postProcessBeforeInitialization}}**: runs before init — may modify or replace the bean.
5. **Initialization** (init logic): in order {{@PostConstruct}} → {{InitializingBean.afterPropertiesSet()}} → {{init-method}} (declared in configuration).
6. **{{BeanPostProcessor.postProcessAfterInitialization}}**: runs after init — **may return a proxy** wrapping the original bean. This is where many AOP features "attach".
7. **Bean ready** to be placed in the context (and for a singleton, stored in the cache). On context shutdown: {{@PreDestroy}} → {{DisposableBean.destroy()}} → {{destroy-method}}. {{@PostConstruct}}/{{@PreDestroy}} belong to the {{jakarta.annotation}} package (Spring Boot 3; older versions use {{javax.annotation}}).

~~~seq
title: Bean lifecycle simplified (singleton)
actors: Container | Bean | BPP
Container -> Bean: 1. new (instantiate)
Container -> Bean: 2. inject dependencies
Container -> Bean: 3. Aware callbacks
Container -> BPP: 4. postProcessBeforeInitialization(bean)
BPP --> Container: bean (or modified)
Container -> Bean: 5. @PostConstruct / init
Container -> BPP: 6. postProcessAfterInitialization(bean)
BPP --> Container: proxy (may replace bean)
note Container,BPP: after step 6 the reference in the context may be a proxy
~~~

### BeanPostProcessor: "runs for every bean"
~~~java
public interface BeanPostProcessor {
  // called BEFORE init (@PostConstruct)
  default Object postProcessBeforeInitialization(Object bean, String beanName) { return bean; }
  // called AFTER init: return bean or a PROXY wrapping bean
  default Object postProcessAfterInitialization(Object bean, String beanName) { return bean; }
}
~~~
**Practical meaning:** frameworks use BPP to "attach capability" without modifying your class. A typical example: the AOP processor scans annotations ({{@Transactional}}, {{@Async}}) and returns a proxy in step 6. If the bean implements an interface, Spring usually uses a **JDK dynamic proxy**; otherwise **CGLIB** (creates a subclass) — but with modern Spring Boot proxy-target-class is usually enabled by default for consistency; what matters when debugging is whether you are calling through a proxy or directly.

### Important consequences (common in interviews and production)
- **{{@PostConstruct}} runs in step 5, the proxy often appears in step 6:** if you call a {{@Transactional}}/{{@Async}} method of *the same bean* from inside {{@PostConstruct}}, the internal call may **not** go through the proxy → transaction/async is not applied. Handling: move the logic elsewhere, call through an injected bean proxy, or use {{ApplicationReadyEvent}}/{{SmartInitializingSingleton}} depending on the goal.
- **Self-invocation (calling within the same class)** bypasses the proxy — same root cause as AOP.
- **A proxy usually only intercepts public methods** (with the default proxy); calling private/protected/package or internal methods will not trigger advice.
- **Constructor injection vs field injection** affects steps 1–2: constructor dependencies are available from step 1; field injection assigns them in step 2. A constructor dependency cycle can prevent the context from starting.

### Interview notes
Emphasise: "instantiate → populate → Aware → BPP before → init ({{@PostConstruct}}) → BPP after (proxy usually here)". A common question: "Why doesn't {{@Transactional}} work inside {{@PostConstruct}}?" → because init runs before BPP after attaches the proxy and/or because of self-invocation; essentially the call has not gone through the proxy. Mention self-invocation and non-public methods to show debugging experience.

> Senior tip: When you suspect AOP "is not running", check three things in order: (1) are you calling through a proxy (inject the bean, do not {{new}} it; avoid self-invocation), (2) is the method {{public}} and intercepted by the proxy, (3) is the call happening before the proxy is attached (such as in the constructor or {{@PostConstruct}} during initialisation). Enabling AOP debug or logging the actual class ({{bean.getClass()}}) usually gives a faster answer than guessing.`,
    exercises: [
      {
        title: 'Mini container: callback order and a BPP returning a proxy',
        prompt: `Write {{MiniContainer}} simulating the simplified lifecycle. {{createBean(Class<?> clazz, List<String> log)}} must run in the correct order and log: (1) {{instantiate:<SimpleName>}} after creating the instance with the no-arg constructor; (2) if the instance implements {{NamedAware}}, call {{setBeanName("<SimpleName>")}} and log {{aware:<name>}} (Aware step); (3) call each {{BeanPostProcessor}} in {{this.bpps}} in list order: log {{bpp-before:<bppSimpleName>:<beanSimpleName>}} then assign {{bean = bpp.postProcessBeforeInitialization(bean, name)}}; (4) if the original instance implements {{Init}}, call {{afterPropertiesSet()}} and log {{init:<name>}}; (5) call each BPP: log {{bpp-after:<bppSimpleName>:<beanSimpleName>}} then {{bean = bpp.postProcessAfterInitialization(bean, name)}}; (6) log {{ready:<SimpleName>}} and **return** the final {{bean}} (which may be a proxy). {{MiniContainer}} has {{addBpp(BeanPostProcessor bpp)}} adding to {{this.bpps}}. {{WrapBpp}} wraps the bean with {{java.lang.reflect.Proxy}} when it implements {{Work}} (simulating AOP attaching a proxy in "after"). Fixtures are provided in the starter/tests.`,
        hints: [
          'Order: new instance → log instantiate → Aware ({{instanceof NamedAware}}) → BPP before loop (log then assign {{bean = ...before...}}) → init ({{instanceof Init}}) → BPP after loop (log then assign {{bean = ...after...}}) → log ready → return bean.',
          'Always reassign {{bean}} to whatever the BPP returns: BPP after may return a proxy replacing the original object. The Aware/Init checks in this spec apply to the original instance you just created.',
          'Use {{clazz.getDeclaredConstructor().newInstance()}} to instantiate. Log names use {{clazz.getSimpleName()}} and {{bpp.getClass().getSimpleName()}}.',
        ],
        explain: `The solution follows the simplified Spring chain: Aware comes after populate (here only Aware is illustrated), BPP before runs before init, init (afterPropertiesSet, equivalent to {{@PostConstruct}}) runs, then BPP after — and **the result of BPP after becomes the final bean**. {{WrapBpp}} returns a {{Proxy}} wrapping {{Work}}, so {{createBean}} returns a proxy, just like Spring AOP attaching transaction/async: callers receive the proxy while the init logic already ran on the original instance in the previous step. This is why calling a transactional method from {{@PostConstruct}} easily bypasses the proxy: step 5 happens before step 6 (and self-invocation even after a proxy exists).`,
      }
    ],
    check: [
      { q: 'At which lifecycle step is the AOP proxy (for example for {{@Transactional}}) usually created/applied?', options: ['Instantiate (inside the constructor)', 'Populate properties', '{{postProcessBeforeInitialization}}', '{{postProcessAfterInitialization}}'], answer: 3, explain: 'A BPP can replace the bean in {{postProcessAfterInitialization}} by returning a proxy wrapping the original bean — this is the typical point where AOP attaches. Init ({{@PostConstruct}}) runs before this step.' },
      { q: 'Which order is correct (simplified) for a Spring singleton bean?', options: ['init → populate → Aware → instantiate → BPP', 'instantiate → populate → Aware → BPP before → init → BPP after', 'instantiate → init → populate → Aware → BPP after', 'populate → instantiate → BPP before → init → BPP after'], answer: 1, explain: 'Create the object, inject dependencies, Aware callbacks, BPP before, initialisation ({{@PostConstruct}}/afterPropertiesSet/init-method), BPP after (usually creating the proxy), then the bean is ready.' },
      { q: 'Calling a {{@Transactional}} method of the same bean from inside {{@PostConstruct}} may not run in a transaction. The most common cause is:', options: ['{{@PostConstruct}} only runs for prototype beans', 'Init runs before BPP after (where the proxy is usually attached) and/or the internal call bypasses the proxy', 'JPA does not support {{@PostConstruct}}', 'Because populate has not finished at the init step'], answer: 1, explain: 'Transactions are applied through proxy/advice (usually attached in BPP after). Calling inside {{@PostConstruct}} (the init step) or calling {{this.method()}} directly easily bypasses the proxy, so the advice does not run. Redesign the initialisation flow (event, call through the proxy, split responsibilities).' }
    ],
  }
});
