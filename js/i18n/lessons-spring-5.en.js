/*
 * English translation of js/data/lessons-spring.js — task T1014. Format: js/core/i18n.js (content overlay).
 * ids: lesson-spring-010
 */
App.i18n.content({
  'lesson-spring-010': {
    title: '@Transactional does not run on internal calls: the proxy diagram and how to fix it',
    goals: [
      'Tell apart the three things: the target you write, the proxy Spring creates, and the reference you hold',
      'Explain step by step why {{this.method()}} never runs the advice',
      'List five ways to fix self-invocation and the trade-off of each',
      'Build a transaction proxy yourself with {{java.lang.reflect.Proxy}} and count begin/join/commit',
    ],
    body: `**Summary:** {{@Transactional}} does not open a transaction by itself when code runs. It is only **metadata** for Spring to decide whether to wrap the bean in a **proxy** (an object in the middle that adds behaviour before and after a call). The bean you inject elsewhere is actually the proxy; the instance of the class you wrote (**target**) is hidden inside. When code inside the target calls {{this.saveOther()}}, the call goes straight from target to target, never touching the proxy, so the advice's "open transaction - commit - rollback" never gets a chance to run.

### Three objects, but you only hold one
At startup, Spring does three separate things for a bean with a {{@Transactional}} method:

1. **Create the target**: call the {{OrderService}} constructor to get **one** instance. This instance is the raw object, with nothing wrapped around it yet.
2. **Wrap in a proxy**: a {{BeanPostProcessor}} (short for "auto proxy creator" — the machine that scans annotations and generates proxies) sees this bean has a transaction annotation, so it creates a proxy pointing at the target.
3. **Put the proxy into the bean cache**: from now on, every {{@Autowired OrderService}} in the application receives the **proxy**, not the target.

~~~text
   caller                PROXY (the one you inject)          TARGET (the instance you wrote)
     │  service.create()      │                              │
     ├──────────────────────▶ │ TxInterceptor:               │
     │                        │   begin tx                   │
     │                        ├────────────────────────────▶ │ create(): ...
     │                        │                              │   this.saveOther()  ✗
     │                        │   ◀── return ────────────────┤   (stays inside the target, never returns to the proxy)
     │  ◀── return ────────── │ commit tx                    │
~~~

**The key:** {{this}} is always the target, while the advice lives in the proxy. The target does not know it is wrapped, so Java has no way to "jump back" to the proxy by itself. This is not a Spring bug — the official documentation treats it as a natural limitation of the proxy AOP model.

### JDK proxy and CGLIB: two ways to create, one limitation
{{java.lang.reflect.Proxy}} (JDK dynamic proxy) generates a class that **implements the interfaces** you list; every call goes through an {{InvocationHandler}}. CGLIB/ByteBuddy generates a **subclass** of the target class and overrides its methods to insert advice. **Spring Boot uses CGLIB by default** ({{spring.aop.proxy-target-class=true}}), so injecting by the concrete class still works.

| Way | Condition | Result of internal call |
|---|---|---|
| JDK proxy | the bean must have an interface; the caller injects through the interface | same: advice only runs on the proxy |
| CGLIB (subclass) | the class and the method must not be **final** | same; private and static methods cannot be overridden |
| AspectJ weaving | modifies the target's own **bytecode** (at compile or load time) | self-call **does** get advice inserted — but the build is more complex |

Easy to misunderstand: CGLIB creates a subclass, so beginners think "the proxy is the object itself, {{this}} is the proxy". Not so: Spring still creates the target separately and lets the proxy **delegate** to the target. Only with AspectJ weaving does an internal call go through the advice.

### Why "no transaction" is more dangerous than "the wrong transaction"
- {{REQUIRES_NEW}} on the inner method + self-call: inner runs **inside** the outer transaction. An audit log that should survive after the business transaction rolls back gets rolled away with it.
- {{readOnly = true}} on a read method + self-call: the connection is not marked read-only, read queries still go to the primary, and are not routed to a replica.
- Only the inner method has the annotation, the outer one does not, and the call is internal: **no transaction at all**. Each {{repository.save()}} is a separate auto-commit. A loop of 10,000 rows becomes 10,000 commits — tens of times slower — and if row 7,000 fails, the first 6,999 rows remain in the DB.
- Same mechanism, so {{@Cacheable}}, {{@Async}}, {{@Retryable}}, {{@PreAuthorize}} break just the same on internal calls. One bug, four consequences.

### Diagnosis in five minutes
~~~java
@Transactional
public void handle(Command c) {
    // log right at the start of the method: false means this call does not go through the proxy
    log.info("tx active = {}, bean = {}",
        TransactionSynchronizationManager.isActualTransactionActive(),  // "is there a transaction open on this thread?"
        AopUtils.isAopProxy(this));                                     // this is the target, so always false
}
~~~

Three practical tips: turn on TRACE logging for {{org.springframework.transaction.interceptor}} to see whether the interceptor runs; call {{TransactionAspectSupport.currentTransactionStatus()}} — it throws {{NoTransactionException}} when there is no transaction; and check whether the bean really is a proxy via {{bean.getClass().getName()}} (the name contains "{{$$SpringCGLIB$$0}}"). The most common case: a service created with {{new ...}} in a test or in hand-written code, not as a Spring bean — a raw object never gets advice.

### Five ways to fix, in recommended order
1. **Move the inner method to another bean** (recommended): the call path leaves the bean, so it goes through the other bean's proxy. It also forces you to reconsider responsibility boundaries.
2. **Put the boundary on the outermost method**: if inner is just a helper, do not annotate it. The outer transaction is enough.
3. **{{TransactionTemplate}}** — open the transaction in code, no proxy needed:

~~~java
@Service
class ImportService {
    private final TransactionTemplate tx;          // Boot configures this automatically when a PlatformTransactionManager is present
    ImportService(TransactionTemplate tx) { this.tx = tx; }

    void run(List<Row> rows) {
        for (Row r : rows) {
            tx.executeWithoutResult(status -> repository.save(r));  // a REAL transaction, one per row
        }
    }
}
~~~

Trap: {{TransactionTemplate}} is a **mutable** object and is usually a shared bean. Calling {{tx.setPropagationBehavior(...)}} changes behaviour everywhere else that uses the same template. If you need REQUIRES_NEW in one place, declare a separate template (a {{@Bean}}) or create {{new TransactionTemplate(transactionManager)}} in the constructor.
4. **Ask for your own proxy**: {{@Lazy OrderService self}} ({{@Lazy}} = "a lazy proxy, resolved only on first use"), or {{ObjectProvider<OrderService>.getObject()}}, or {{AopContext.currentProxy()}} with {{exposeProxy = true}}. It works, but the call graph becomes obscure, and a unit test calling {{new OrderService(...)}} gets {{self}} null.
5. **AspectJ weaving** when the requirement "every call must be wrapped" is legitimate (rare). Trade-off: a build/load-time agent, hard to debug, and it is no longer Spring AOP.

### Interview notes
Answer in four beats to show you understand the mechanism, not just the symptoms: (1) describe the three objects and draw the caller → proxy → target path; (2) say why {{this}} being the target means the advice is skipped; (3) state the real consequences (REQUIRES_NEW, readOnly, batch auto-commit) and how to diagnose with {{isActualTransactionActive()}}; (4) give two or three fixes with reasons for choosing, and proactively mention that {{@Cacheable}}/{{@Async}} share the same problem. Common follow-up questions: "does an annotation on an interface work?" (yes — Spring also looks for the annotation on the interface-declared method), "what about a private method?" (the proxy cannot intercept it, even when called from outside), "how to prove it in a test?" (use {{@SpringBootTest}} and assert the transaction state, or like the exercise below).

> Senior tip: In code review, if you see a {{@Transactional}} method called from another method **in the same class**, ask straight away: where is the business boundary? Put the boundary at the use-case layer, not at the helper. On production, the two fastest signs of self-invocation are **commits per second spiking** during bulk imports and **half-written data** after a mid-way error — while the outer method's transaction log still looks "normal".`,
    exercises: [{
      title: 'Build a transaction proxy with JDK Proxy: count begin/join/commit and see self-invocation skipped',
      prompt: `Rewrite the core of Spring's transaction mechanism with {{java.lang.reflect.Proxy}}. {{TxSim.wrap(target, iface, log)}} returns a proxy implementing {{iface}} that delegates to {{target}}. {{log}} (type {{TxLog}} provided) is the place to record metrics **and** plays the role of "transaction currently open on the thread" ({{log.active}}), shared by every proxy in the same test — like {{TransactionSynchronizationManager}}.

Rules the handler must follow, simulating {{TransactionInterceptor}}:
- **Transaction attribute**: a method is considered transactional if {{@Tx}} is on the method of the **target class** *or* on the method **declared in the interface**. If neither → just call the target, return the result, and write nothing to {{log}}.
- **Outermost transaction** ({{log.active == false}}): {{begins++}}, set {{active = true}} and {{rollbackOnly = false}}, log event {{"begin:" + method name}}. Then run the target:
  - returns normally: if {{rollbackOnly}} was already turned on by a nested call then {{rollbacks++}} and log {{"rollback:" + name}}, otherwise {{commits++}} and log {{"commit:" + name}};
  - throws {{RuntimeException}} or {{Error}}: {{rollbacks++}}, log {{"rollback:" + name}}, **rethrow the original exception**;
  - throws a checked {{Exception}}: still counts as success per Spring's default ({{commits++}}, {{"commit:" + name}}) then rethrow.
  - Whether success or failure, before exiting you must set {{active = false}} (and clear {{rollbackOnly}}).
- **Join an open transaction** ({{log.active == true}}, i.e. REQUIRED): {{joins++}}, log {{"join:" + name}}, run the target, **do not** begin/commit/rollback at this level. If the target throws {{RuntimeException}} or {{Error}}: turn on {{rollbackOnly = true}} and rethrow — the outermost transaction decides.
- The call {{method.invoke(target, args)}} wraps the target's exception in an {{InvocationTargetException}}; the handler must rethrow {{getCause()}}.

Fixtures already in the file: {{TxWorker}}, {{WorkerImpl}} ({{outer()}} calls {{this.inner()}} — self-invocation; {{delegated()}} and {{swallow()}} call through {{Helper}} **already wrapped in a proxy**), {{MarkedApi}}, {{MarkedImpl}} ({{@Tx}} only on the interface). You do not need to fix the fixture.`,
      hints: [
        'Proxy.newProxyInstance(loader, interfaces, handler): the loader comes from iface.getClassLoader(), interfaces is an array containing only iface, and the handler is a lambda returning the result of the call. Inside the handler, method is the interface\'s method, not the target class\'s method.',
        'The handler only sees calls that go through the proxy. target.outer() calling inner() means this.inner() on the target itself, so the handler is never asked about inner.',
        'Treat {{log.active}} like {{TransactionSynchronizationManager}}: turned on when entering the outermost transaction, not allowing a second outermost transaction to stack on top, and always lowered in {{finally}}. {{rollbackOnly}} is the flag that a nested call turns on when it errors; the one finishing the outermost transaction reads that flag.',
        'Do not catch {{Exception}} and throw {{new RuntimeException(e)}}: the test compares the **exact instance** of the original exception. Forgetting to unwrap {{InvocationTargetException}} means the caller receives a strange exception instead of {{IllegalStateException}}.'
      ],
      explain: `This exercise reproduces verbatim three Spring decisions in {{TransactionInterceptor}} + {{AbstractPlatformTransactionManager}}.

**One: advice only runs on the proxy.** The "self-invocation" test asserts {{outer}} produces exactly {{["begin:outer", "commit:outer"]}} even though {{inner}}'s business logic still runs (result is "outer|inner"). In real Spring, {{inner}} then has no transaction of its own: it runs thanks to {{outer}}'s transaction, and every annotation on it ({{REQUIRES_NEW}}, {{readOnly}}, {{Propagation}}...) is ignored completely. The test "calling the same inner method from outside" shows the problem is not the annotation or the method, but the **call path**.

**Two: REQUIRED joins, does not open a second time.** The "delegated" test has {{begins == 1}} but {{joins == 1}}: one connection, one commit. That is exactly the propagation table from lesson-spring-003, except now you look at it through numbers. It is also why "splitting into another bean" (fix 1) works: it does not change propagation; it only makes the call **go through the proxy** so the advice can be consulted.

**Three: rollback-only and exception.** The "swallow" test correctly models the {{UnexpectedRollbackException}} bug: a nested call reports an error, its interceptor marks the transaction "rollback-only", the outer method catches and swallows the exception believing all is well — but at commit, Spring sees the flag, rolls everything back and throws an error to the caller. {{commits == 0}} here is the most valuable lesson of the exercise: swallowing an exception does not save the transaction.

Four easy mistakes in this exercise:
- Forgetting to look for the annotation on the **interface**: the "annotation declared on the interface" test fails. Spring also does both steps.
- Setting {{active = false}} without {{finally}}: one failure makes every later call treated as a new outermost transaction.
- Increasing {{commits}} in the nested branch: two commits for one transaction, which does not match the tests.
- Wrapping the exception when rethrowing: the caller cannot catch the original exception type, and an outer transaction (if any) does not see the correct error type.

To get closer to real Spring: let {{wrap}} support {{REQUIRES_NEW}} by saving the old {{active}}, setting {{active = false}} temporarily, and restoring it in {{finally}} (Spring calls this "suspend"); or give {{@Tx}} a {{rollbackFor}} attribute so the behaviour matches lesson-spring-003. You will then see for yourself: the problem with self-invocation is **not** the transaction manager, but that the proxy has only one entry point.`,
    }],
    check: [
      { q: '{{ImportService.run()}} has {{@Transactional}} and calls {{this.saveOther()}}; {{saveOther()}} has {{@Transactional(propagation = REQUIRES_NEW)}}. What happens in practice?', options: ['{{saveOther}} runs in a new independent transaction because it has its own annotation', '{{saveOther}} runs inside the transaction of {{run}}: an internal call does not go through the proxy, so its interceptor is never called', 'Spring throws an error because {{REQUIRES_NEW}} cannot be nested', 'No transaction is opened at all, not even {{run}}\'s'], answer: 1, explain: `The annotation only has effect when the call goes through the **proxy**. {{this.saveOther()}} is an internal call on the target, so its interceptor never runs and {{run}}\'s transaction still covers everything — {{REQUIRES_NEW}} is silently ignored. {{run}} itself still has a transaction because the caller calls {{run}} through the proxy. There is no nesting error; this is exactly the kind of error that "looks perfectly correct in code" and is the most dangerous.` },
      { q: 'You need an inner method to really open its own transaction, but you do not want to split the bean. Which way **least** surprises the reader?', options: ['Use {{TransactionTemplate}} to open the transaction in code right inside the method', 'Enable {{exposeProxy = true}} and call {{((ImportService) AopContext.currentProxy()).saveOther()}}', 'Mark {{saveOther}} as private so Spring handles it internally', 'Put {{@Transactional}} at class level and hope Spring intercepts every call'], answer: 0, explain: `{{TransactionTemplate}} says straight out "there is a transaction here" right where it is needed, without depending on the proxy, and unit tests still work. {{AopContext.currentProxy}} works but brings Spring\'s **mechanism** into business code, and throws {{IllegalStateException}} when the object is not a proxy (for example in a test). Private cannot be intercepted by a proxy. A class-level annotation still only applies to calls through the proxy.` },
      { q: 'What is the fastest way to **prove** a method has no transaction?', options: ['Read the build log to see if it says "Created proxy"', 'Print {{TransactionSynchronizationManager.isActualTransactionActive()}} right at the start of the method, or call {{TransactionAspectSupport.currentTransactionStatus()}} and see whether it throws {{NoTransactionException}}', 'Change the method to {{REQUIRED}} and run the tests again', 'Check {{spring.datasource.autocommit}} in application.yaml'], answer: 1, explain: `{{isActualTransactionActive()}} answers exactly "does this thread currently have a transaction" at the very line of code — if it is false inside a {{@Transactional}} method, the call is not going through the proxy. {{currentTransactionStatus()}} throws {{NoTransactionException}} in the same situation. The log "Created proxy" only says the bean **has** a proxy, not whether this particular call goes through it; changing propagation does not fix self-invocation; autocommit is about the connection, not Spring transactions.` },
      { q: 'The method {{@Transactional private void flush()}} is called from a public method of the same bean. Is a transaction opened?', options: ['Yes, because Spring scans the bytecode of every method', 'No: a private method cannot be intercepted by a proxy, and the internal call does not go through the proxy', 'Yes, if you switch to JDK proxy', 'Only when {{flush}} returns non-void'], answer: 1, explain: `Two layers of error add up: a CGLIB subclass cannot override a private method (JDK proxy even less so), so even calling from another bean is useless; on top of that this is an internal call, so no proxy stands between. Spring does not "scan and run" annotations. JDK proxy is no better — it additionally requires an interface. The return type is irrelevant.` },
    ],
  },
});
