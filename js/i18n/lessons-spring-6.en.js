/*
 * English translation of js/data/lessons-spring.js — task T1015. Format: js/core/i18n.js (content overlay).
 * ids: lesson-spring-011
 */
App.i18n.content({
  'lesson-spring-011': {
    title: 'Bean circular dependencies: early references, three-level cache and redesign',
    goals: [
      'Explain why a constructor cycle is hopeless, while a field cycle can be broken by the container',
      'Describe the three-level singleton cache and why Spring stores an {{ObjectFactory}} instead of the object',
      'Four techniques to remove cycles with their trade-offs, and how to read the cycle message in Spring Boot 2.6+',
      'Write a mini container that detects a cycle and prints the exact path {{A -> B -> C -> A}}',
    ],
    body: `**Summary:** a circular dependency is a **cycle** in the bean graph: A needs B, B needs A. The container can only break the cycle by handing out an **incomplete** object (an early reference) to another bean that is still being created — something it can do only with field/setter injection. With constructor injection no valid creation order exists, so Spring fails at startup. Since Spring Boot 2.6, the ability to "break the cycle on its own" is **disabled by default**.

### Constructor cycle: a problem with no solution
The issue is not laziness but **logic**. To run {{new A(b)}} you need {{b}} **fully built first**; to have {{b}} fully built first you must run {{new B(a)}} — which needs {{a}} already finished. There is no starting point.

~~~text
getBean(A)  ->  new A(??)  needs B fully built
                      getBean(B)  ->  new B(??)  needs A fully built
                           getBean(A)  ->  A is being created, nothing to hand out   X
~~~

A real-world analogy: two people signing a form for each other, where each "only signs after seeing the other one has signed". Field/setter injection is different: {{new A()}} needs nothing, so it can be created immediately as an object **with a memory address** even while its fields are still null. Java lets two objects reference each other as long as the addresses already exist — that is the whole mechanism for breaking cycles.

### How Spring does it: three levels of cache
The bean registry of {{DefaultSingletonBeanRegistry}} has three maps, ordered by how "complete" the bean is:

| Level | Map | Holds what | Who reads it |
|---|---|---|---|
| 1 | {{singletonObjects}} | fully built beans | every normal {{getBean}} |
| 2 | {{earlySingletonObjects}} | early references, **possibly already a proxy** | another bean that needs A mid-creation |
| 3 | {{singletonFactories}} | {{ObjectFactory}} — the "recipe" for an early reference, **not yet run** | only run when someone actually asks |

The path of a single bean (simplified from {{doCreateBean}}):

1. {{getSingleton(type)}} — check level 1. Not there?
2. Mark the bean as being created ({{singletonsCurrentlyInCreation}} — this is where {{BeanCurrentlyInCreationException}} is born when a cycle is detected).
3. {{createBeanInstance}} — call the constructor (dependencies **must already be done**, so a cycle here is fatal).
4. {{addSingletonFactory}} — write into **level 3**: "if anyone needs an early reference to A, call this lambda".
5. {{populateBean}} — inject fields/setters; if it meets B and B needs A in turn, Spring calls {{getSingleton(A, true)}} → runs the level-3 factory → the bean comes out at **level 2** and is returned.
6. {{initializeBean}} ({{@PostConstruct}}, {{afterPropertiesSet}}) then push the result into **level 1**, removing levels 2 and 3.

Why level 3 (a factory) instead of putting the instance straight into level 2? A bean with AOP ({{@Transactional}}, {{@Cacheable}}...) **must not** be exposed as a raw object. Spring wants to delay creating the proxy until **someone actually asks** for an early reference. The factory at level 3 allows "no decision yet" and costs nothing; only when another bean asks does {{SmartInstantiationAwareBeanPostProcessor}} create the proxy once and store it at level 2, so every later party receives **the same** object. This connects directly to lesson-spring-010: if the early reference were a raw object and the proxy were created later, you would end up with two different identities in the graph — and the "field null, hard to explain" bug is the consequence of getting this step wrong.

~~~seq
title: Spring breaks the cycle through field injection
actors: App | Container | Order | Payment
App -> Container: getBean(Order)
Container -> Order: new Order() (fields still null)
Container -> Container: store Order's ObjectFactory
Order -> Container: populate: needs Payment
Container -> Payment: new Payment()
Payment -> Container: populate: needs Order
Container -> Order: return early reference
Payment --> Container: Payment done
Order --> App: Order done
note Order..Payment: both point to the real instances
~~~

### Spring Boot 2.6+ disables this, and why you should leave it disabled
{{SpringApplication}} has a flag {{setAllowCircularReferences(false)}} — now the default, surfaced as {{spring.main.allow-circular-references=false}}. Startup fails early and prints the **path** of the cycle, like:

~~~text
The dependencies of some of two beans in the container form a cycle;
the application context could not be started. We found the following cycle:
  Bean 'orderService' - field 'payment' with required bean 'paymentService'
  Bean 'paymentService' - field 'order' with required bean 'orderService'
Action:
  Break the cycle, or switch to constructor injection with @Lazy...
~~~

The reason for the default change is very practical: (1) an early reference is an object that has **not yet run** {{@PostConstruct}} and has not been validated, so B receives a "half-finished" A and the error shows up later, which is very hard to trace; (2) proxy/lifecycle ordering is easy to get wrong as above; (3) most importantly — a cycle is usually a sign that **class boundaries were split the wrong way**, and a flag hides the disease instead of curing it. Re-enabling the flag is legitimate when you need to keep shipping while upgrading, but treat it as a time-limited workaround.

### Four clean ways to remove a cycle
1. **Extract the shared part into a third bean.** A and B argue because both want the same logic; put that logic in C, so A → C and B → C, and the cycle is gone.
2. **Invert the dependency (Dependency Inversion).** If A only needs "read the balance" from B, make A depend on an interface {{BalanceReader}} that B implements. The business arrow flips and the graph becomes a DAG.
3. **Turn the call into an event.** A publishes {{OrderPaidEvent}}, B is the listener. The A → B edge disappears, leaving only A → publisher. Remember lesson-spring-009: {{AFTER_COMMIT}} and the outbox decide whether the event can be lost.
4. **Make the dependency lazy.** {{@Lazy}} on a **constructor parameter** injects a lazy proxy (lazy proxy): the bean is created immediately, the cycle is cut, and B is only resolved when A calls the first method. Same goal but more explicit: {{ObjectProvider<PaymentService>}}, calling {{.getObject()}} when needed.

~~~java
@Service
class OrderService {
    private final ObjectProvider<PaymentService> payments;   // not resolved at construction

    OrderService(ObjectProvider<PaymentService> payments) { this.payments = payments; }

    void refund(String id) {
        payments.getObject().refund(id);                      // resolved on first use here
    }
}
~~~

| Approach | When to choose | Trade-off |
|---|---|---|
| Extract a third bean | two services share one responsibility | one more class, but the design is genuinely clean |
| Invert via interface | "reverse-layer" dependency (service calling back into an adapter/controller) | must define a stable abstraction |
| Event | A does not need B's **result** right away | asynchronous, needs thought about lost events |
| {{@Lazy}} / {{ObjectProvider}} | cycle left over from history, cannot refactor yet | the cycle still exists in the graph; it just does not blow up at boot |

### Cycles that "sneak in" when you least expect
Adding **one** constructor parameter to a bean in the middle of A → B → C is enough to turn the graph into a cycle — so code that ran fine can fail at startup after a commit that looks harmless. Constructor injection makes you pay **at startup** (good) instead of at 2 a.m. with a {{NullPointerException}} on an uninjected field (very bad). At the architecture level, the rule "a service must not depend on another feature's repository" should be enforced with architecture tests ({{beFreeOfCycles}}) or at least code review, because the container only reports cycles **at bean level**, not cycles **at package/module level** (the thing that creates cycles between microservices when two teams call each other).

### Interview notes
A well-regarded answer structure: (1) classify the cycle — a constructor cycle is hopeless, a field/setter cycle **can** be broken with an early reference; (2) explain the three-level cache and why {{ObjectFactory}} is needed (proxy); (3) state the Boot 2.6+ default and why; (4) give at least two fixes, ranked by how "clean" they are: extract a bean / invert / event, then {{@Lazy}} as the last resort. Deep-dive questions: "what about a self-reference {{A}} injecting {{A}}?" (also a cycle; and if the goal is to call through the proxy to get {{@Transactional}}, there is a better way: {{TransactionTemplate}}); "can calling {{getBean}} manually break the cycle?" (technically yes, but that is the service-locator pattern — the dependency becomes hidden inside the method).

> Senior tip: When you see a cycle report, do not look at the two beans arguing — look at the **responsibility** that is being split between them. Nine times out of ten, the right refactor (extract a third bean or push down into the domain layer) removes the cycle and makes both classes easier to test at the same time. And in code review, be suspicious of a class with more than 6–7 dependencies in its constructor: that is usually what creates a cycle in the next commit.`,

    exercises: [{
      title: 'A mini container that reports the exact cycle path',
      prompt: `Complete {{CycleContainer}} — a simplified model of {{DefaultSingletonBeanRegistry}}. The {{allowCircularReferences}} flag in the constructor corresponds to {{spring.main.allow-circular-references}}.

API ({{type}} is always a class with **exactly one** constructor):
- {{define(Class<T> type)}}: registers a bean whose dependencies come only through the constructor (derived from the constructor parameters).
- {{define(Class<T> type, Class<?>... fieldDeps)}}: registers a bean and additionally declares the types it will receive **through fields** after the instance is created.
- {{get(Class<T> type)}}: returns the singleton — creates it if needed, and returns **the same old instance** if it already exists.

Behaviour to simulate:
1. **Constructor dependency**: resolved **before** calling the constructor. If the type is already being created (present in the "in-progress" stack) that is a constructor cycle, and **no early reference can save it** — even when {{allowCircularReferences}} is {{true}}.
2. **Field dependency**: resolved **after** the instance has been created, and that instance must be recorded as an "early reference" **before** the fields are populated. Thanks to that, a cycle **through fields** can be resolved when {{allowCircularReferences == true}}: the bean still being created is returned immediately (the same instance), and the two beans reference each other validly.
3. If {{allowCircularReferences == false}}, a field cycle is **also rejected** (matching the Spring Boot 2.6+ default).
4. An unregistered type (even when it is a dependency of another bean) → throw {{IllegalStateException}} with the message exactly {{ "Unregistered: " + simpleName }}.
5. Every cycle case → throw {{IllegalStateException}} with a message that **contains** {{ "Circular dependency: " }} followed by the path, the simple names joined by {{ " -> " }}, starting at the bean that **repeats** and ending with itself. For example {{get(Ctor1.class)}} with Ctor1 → Ctor2 → Ctor3 → Ctor1 must yield {{ "Circular dependency: Ctor1 -> Ctor2 -> Ctor3 -> Ctor1" }}; a self-reference yields {{ "Mirror -> Mirror" }}.
6. One failed {{get}} must **not** break the container: {{finally}} must remove the type from the in-progress stack so other beans can still be created, and a later {{get}} on the same cycle must report the **same** cycle again.
7. When assigning fields, only assign if the corresponding field is still {{null}} and the bean has such a field; use reflection like the {{MiniContainer}} exercise uses for constructors.

Fixture already provided: {{Audit}}, {{Ledger}} (constructor), {{Ctor1}}, {{Ctor2}}, {{Ctor3}} (constructor cycle), {{Order}}, {{Payment}} (field cycle), {{Mirror}} (self-reference through a field).`,
      hints: [
        'You need four structures: a {{Map}} from type to the list of declared field deps, a singleton map (level 1), an early-reference map (level 2), and an **ordered** set of types currently being created ({{LinkedHashSet}}) so the path can be printed. The {{create}} method should take an extra {{boolean fromField}} flag to distinguish the two kinds of cycle.',
        'Order of checks decides behaviour: {{singletons}} first, then {{creating}}, then the registration check. A constructor cycle throws at step 2 because {{fromField == false}}; a field cycle has {{fromField == true}} and returns the {{early}} instance (when {{allowCircularReferences}} is set).',
        'Record {{early}} **right after calling the constructor** and **before** populating fields — that is exactly {{addSingletonFactory}}. If you record it after population finishes, the cycle can never be broken.',
        'Path: iterate {{creating}} in insertion order, find the first element equal to the repeating type, print from there to the end, then append that name once more. {{creating.remove(type)}} and {{early.remove(type)}} must live in {{finally}}, otherwise one failure makes every later bean report a phantom cycle.',
        'Assign fields using {{getDeclaredFields()}}, filter for non-static fields whose {{getType().isAssignableFrom(dep)}} and that are currently {{null}}, then {{setAccessible(true)}} + {{set}}.',
      ],
      explain: `The exercise reproduces exactly the three decisions inside {{AbstractAutowireCapableBeanFactory.doCreateBean}}.

**Constructor vs field are two different worlds.** The "constructor cycle cannot be broken" test runs with {{allowCircularReferences == true}} and still fails: at the moment the constructor parameter is needed, the other bean **does not exist yet**, so there is nothing to hand out. The "field cycle" test passes, because the instance was created and recorded in {{early}} before population — that is the early reference. Spring Boot 2.6+ decided not to use this mechanism by default anymore, so the same graph runs on an old app and fails to start on a new one: the two assertions "field cycle rejected by default" simulate that change exactly, and the message with the **path** is what lets you locate the problem in 30 seconds.

**{{finally}} is the real lesson.** The "container still usable after one failed creation" test catches forgetting to remove {{creating}}/{{early}}. Not removing {{creating}} makes the next bean ({{Ledger}}) report a phantom cycle; clearing the whole stack instead of removing just this type breaks the caller's stack further up. Spring does the same thing: {{DefaultSingletonBeanRegistry.getSingleton}} has a {{try/finally}} that removes the "being created" mark for that bean alone.

**Identity, not copies.** The "early reference keeps the correct identity" test starts from {{Payment}} to force Order to be created as an early reference, then asserts that {{c.get(Order.class)}} **is the very same object** Payment received. If your implementation returns a new instance every time an early reference is requested, then {{o.payment != p}} — and that is exactly the "field null at 2 a.m." class of bug that early references plus proxies produce in real Spring when levels 2 and 3 are inconsistent.

Four more easy mistakes:
- Forgetting the {{fromField}} flag and treating every cycle the same way → field cycles get reported wrongly, or worse, constructor cycles "succeed" (completely wrong in principle).
- {{List.of(deps)}} with empty varargs → an empty list, which is fine; but do not pass {{null}} or you get an NPE.
- {{field.set}} on a {{final}} field ({{Ledger.audit}}): allowed on an object just created via reflection, but if you route {{Ledger.audit}} through wire, the singleton test fails — field deps are only for types that declared them.
- Reporting {{ "Circular dependency: " }} **with** both bean names but without {{ " -> " }} → the string assertion fails; the format is part of the spec, because it is exactly what you paste into a ticket.

To get closer to real Spring: change {{early}} into {{Map<Class<?>, Supplier<Object>>}} (level 3 is truly an {{ObjectFactory}}), and when a bean is "proxied" — for example it implements an interface {{Proxied}} — have the factory return a proxy of the instance rather than the raw instance. You will immediately see why level 3 is necessary rather than redundant.`,
    }],
    check: [
      { q: 'A Spring Boot 3 application has {{A(B b)}} in its constructor and {{B(A a)}}, with no extra configuration. What happens?', options: ['It runs normally because Spring always resolves cycles', 'Startup fails with a message describing the cycle path: a constructor cycle cannot be broken with an early reference', 'Spring creates two instances of each bean to break the cycle', 'It only fails when the first request goes through {{A}}'], answer: 1, explain: `{{new A(b)}} requires {{b}} to be fully built and vice versa, so no creation order exists; the container throws {{BeanCurrentlyInCreationException}} (Boot prints it as "form a cycle" with the path) while refreshing the context. The "runs normally" case only applies to cycles **through fields/setters** with {{allow-circular-references = true}} (the old default, before Boot 2.6). Spring does not duplicate beans to break cycles, and the failure happens at startup, not on the first request.` },
      { q: 'A field-injection cycle {{Order}} ↔ {{Payment}} with {{spring.main.allow-circular-references=true}}. Which statement is TRUE?', options: ['{{Payment}} receives a different copy of {{Order}}', 'One of the two beans receives a reference to an object that has **not yet run** {{@PostConstruct}} and is not fully populated', 'Spring automatically switches both beans to {{prototype}} scope', 'The bean is injected later, on the first method call'], answer: 1, explain: `The early reference is taken from level 2 **after instance creation, before initializeBean**, so the receiving bean sees fields that are still unset and initialization callbacks that have not run yet. That is precisely why the new default disables the mechanism. Both beans remain singletons (no copies), the scope does not change, and injection happens at creation time rather than waiting for the first call.` },
      { q: 'You upgrade an app from Spring Boot 2.5 to 2.7 **without changing code**, and it fails to start because of a circular reference. The most appropriate handling is:', options: ['Set {{spring.main.allow-circular-references=true}} to behave like before', 'Read the path in the message and break the cycle: extract a third bean, invert the dependency through an interface, or push it to an event; {{@Lazy}} is only a temporary fix', 'Convert all field injection to constructor injection', 'Delete one of the two beans'], answer: 1, explain: `The 2.6+ default reflects a design decision: a cycle is technical debt, and the message already points exactly where to fix it. Re-enabling the flag makes the app run but keeps the cyclic structure and the "half-finished" early references. Converting **everything** to constructor injection makes cycles surface even for loops that were previously broken — that is not a fix. Deleting a bean changes behaviour.` },
      { q: 'What do {{ObjectProvider<X>}} and {{@Lazy}} on a constructor parameter do for a circular dependency?', options: ['Make the container create an extra instance of X', 'Cut the cycle at construction time: the dependency is only resolved on **first use**, so the initial graph does not need X fully built', 'Automatically break the cycle with no need to think about initialization order', 'Move bean X into {{request}} scope'], answer: 1, explain: `{{@Lazy}} injects a proxy that is not resolved yet; {{ObjectProvider}} is a "slow knob": both defer {{getBean(X)}} until {{getObject()}} is called, which is enough for {{A}} to finish being created without {{B}} being fully built. There is no extra instance and the scope does not change. The cycle still exists in the design — the graph is only cut at construction time, so if {{B}} is not initialized yet the error can still surface later.` },
    ],
  },
});
