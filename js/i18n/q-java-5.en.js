/*
 * English translation of js/data/q-java.js — task T163. Format: js/core/i18n.js (content overlay).
 * ids: core-020 core-021 core-022 core-023 core-024 core-025 core-026 collections-015
 */
App.i18n.content({

  'core-020': {
    q: `Explain the 4 OOP properties with a real business code example you have written (not just definitions). Which one do you see misused most often?`,
    a: `**Summary:** Encapsulation hides state and only allows changes through methods that preserve invariants (e.g. {{Account.withdraw}} prevents negative balance). Abstraction lets the caller know only "what" through the interface ({{PaymentProcessor.pay}}), not "how". Inheritance reuses behavior only when there is a true "is-a" relationship. Polymorphism means the same call runs different implementations based on the actual object, so adding a new payment gateway does not require changing if/else. The most misused is inheritance: inheriting only to reuse code.

### Encapsulation: protect invariants, not "getter/setter for every field"
~~~java
public class Account {
    private BigDecimal balance;                 // no one modifies directly
    private final List<Txn> history = new ArrayList<>();

    public void withdraw(BigDecimal amount) {
        if (amount.signum() <= 0) throw new IllegalArgumentException("amount <= 0");
        if (balance.compareTo(amount) < 0) throw new InsufficientFundsException();
        balance = balance.subtract(amount);     // invariant: balance >= 0 always true
        history.add(Txn.debit(amount));         // state changes together, never diverges
    }
    public BigDecimal getBalance() { return balance; }   // no setBalance
    public List<Txn> history() { return List.copyOf(history); } // never exposes internal list
}
~~~
Why it matters: if there were a {{setBalance}}, any service could write a negative balance or forget to record history. When business rules are scattered, no one can control them.

### Abstraction + Polymorphism: drop the if/else chain by type
~~~java
public interface PaymentProcessor {             // abstraction: just says "pay"
    PaymentMethod method();
    PaymentResult pay(Order order);
}

@Service
public class CheckoutService {
    private final Map<PaymentMethod, PaymentProcessor> processors;

    public CheckoutService(List<PaymentProcessor> all) {  // Spring injects all beans
        this.processors = all.stream()
            .collect(Collectors.toMap(PaymentProcessor::method, p -> p));
    }
    public PaymentResult checkout(Order o) {
        return processors.get(o.method()).pay(o); // dynamic dispatch by real object
    }
}
~~~
Adding VNPay, MoMo or ZaloPay only requires a new {{@Component}} class; {{CheckoutService}} stays unchanged (Open/Closed). That is the real benefit of polymorphism — far more meaningful than a Dog/Cat example.

### Inheritance: use only when there is a real "is-a" and a common framework
A valid example is the template method: {{AbstractStatementExporter}} has a {{final export()}} method that calls {{header()}}, {{rows()}}, {{footer()}} in sequence; PDF and Excel subclasses only override each step. Wrong inheritance is {{class OrderService extends BaseDao}} just to get {{save()}}: it couples the two classes tightly, exposes unwanted methods and violates Liskov. Use composition (inject {{OrderRepository}}) instead.

| Property | Question it answers | Sign of misuse |
|---|---|---|
| Encapsulation | Who may change state, under what rule? | Entity has public setters for everything; rules live in services |
| Abstraction | What is the minimum the caller must know? | Interface leaks provider details (HTTP status, SQL) |
| Inheritance | Is it really "is-a"? | Inheriting to reuse helpers; tree deeper than 2–3 levels |
| Polymorphism | Can the implementation be swapped? | {{instanceof}} / switch by type scattered everywhere |

### Common wrong answers
- Memorizing textbook definitions and using Animal/Dog examples with no connection to real code.
- Confusing encapsulation with "private fields + full getters/setters". Having a setter for every field still breaks encapsulation.
- Confusing abstraction (design-level concept, interface) with encapsulation (hiding data and protecting invariants).
- Talking only about runtime polymorphism (overriding) and forgetting that overloading is compile-time polymorphism.

> Senior tip: when answering, pick one continuous example (payments, accounts) and highlight the trade-off: "I prefer composition; I inherit only when a clear template framework exists." Banking interviewers often follow up with SOLID and the Strategy pattern, so prepare an example like {{Map<Type, Strategy>}} above.`,
    follow: [`Composition over inheritance: give an example where you refactored from inheritance to composition.`, `How can a JPA entity keep a no-arg constructor and setters yet still preserve encapsulation?`, `In which case have you seen the Liskov Substitution Principle violated?`]
  },

  'core-021': {
    q: `Overloading vs overriding: what are the rules with {{static}}, {{private}}, {{final}}, covariant return types and exceptions? Predict the output when calling a static method through a parent-type reference.`,
    a: `**Summary:** Overloading means several methods with the same name but different parameter lists; the **compiler** chooses one at **compile time**, based on the **declared type** of the argument (the type written in the variable declaration, not the type of the object stored inside it). Overriding means a subclass redefines an instance method with the same signature; the **JVM** chooses the implementation at **runtime**, from the **real object**. {{static}} methods cannot be overridden — they are only **hidden**; {{private}} and {{final}} methods cannot be overridden at all.

### The rules in one table
| Rule | Overloading | Overriding |
|---|---|---|
| When chosen | Compile time, by the declared (static) type | Runtime, by the real (dynamic) type, through the vtable |
| Signature | Same name, different parameter list | Same name and parameter list |
| Return type | Anything, but you cannot differentiate only by return type | Identical, or a subtype (covariant) if it is a reference type |
| Access modifier | Anything | Cannot be narrower (protected to public is fine, the reverse is a compile error) |
| Checked exception | Anything | Cannot add a new or broader checked exception; unchecked is free |
| static / private / final | Can be overloaded | Cannot be overridden (static is hidden; private and final are blocked) |

- **Signature** = method name + parameter types. The return type and {{throws}} are not part of it; that is why two methods that differ only in return type do not compile — the compiler sees the same signature declared twice.
- **Covariant return** = the override returns a subtype of the parent return type: {{Object.clone()}} returns {{Object}}, and a class may override it to return its own type. Callers that expect an {{Object}} still compile, because the subclass instance is also an {{Object}}.
- **Checked exception** = an exception the compiler forces you to declare with {{throws}} or to catch (a subclass of {{Exception}} but not of {{RuntimeException}}, e.g. {{IOException}}). Unchecked means {{RuntimeException}} and its subclasses, which the compiler does not track.
- **vtable** = "virtual method table": one array per loaded class with a slot per overridable method. A subclass starts by copying the parent table, then points the overridden slots at its own code.

### Predict the output: static hiding vs dynamic dispatch
~~~java
class Parent {
    static String who()  { return "Parent.static"; }
    String name()        { return "Parent.instance"; }
}
class Child extends Parent {
    static String who()  { return "Child.static"; }      // hiding, not overriding
    @Override String name() { return "Child.instance"; } // a real override
}

Parent p = new Child();
System.out.println(p.who());   // Parent.static  (chosen by the declared type Parent)
System.out.println(p.name());  // Child.instance (chosen by the real object)
~~~
What happens, step by step:
1. {{p.who()}} compiles to the instruction {{invokestatic Parent.who}} — the class name is baked into the instruction, so the object inside {{p}} is never consulted. Static methods do not sit in the vtable at all, which is why {{Child.who()}} only **hides** {{Parent.who()}} instead of overriding it.
2. {{p.name()}} compiles to {{invokevirtual Parent.name}}. At runtime the JVM reads the real class of the object ({{Child}}), looks up the slot for {{name()}} in {{Child}}'s vtable, and jumps to {{Child.name}}. That lookup — "which implementation do I actually run?" — is what people call **dynamic dispatch**. The JIT usually removes it once it has seen only one receiver type (devirtualization), so in a hot loop it costs nothing.
3. Calling a static method through an instance ({{p.who()}}) or through the subclass name ({{Child.who()}}) only changes what the reader thinks is happening; the compiled call is always the one from the declared type.

### Predict the output: overload resolution
~~~java
static void print(Object o)  { System.out.println("Object"); }
static void print(String s)  { System.out.println("String"); }
static void print(long x)    { System.out.println("long"); }
static void print(Integer x) { System.out.println("Integer"); }

Object obj = "hello";
print(obj);   // Object: chosen by the static type, not the runtime type
print("hi");  // String: the most specific method wins
print(5);     // long: widening (phase 1) beats boxing (phase 2)
// print(null); -> compile error "ambiguous": String and Integer are equally specific
~~~
The compiler resolves overloads in 3 phases and stops at the first phase where any method applies:
1. **No boxing, no varargs** — exact types plus widening primitive conversions ({{int}} to {{long}} is widening: the value fits, no object is created).
2. **Boxing allowed** — boxing = wrapping a primitive into its wrapper object ({{int}} to {{Integer}}), which allocates.
3. **Varargs allowed** — the arguments may be packed into an array.

Inside the winning phase it picks the **most specific** method (the one whose parameter type is a subtype of the others). So {{print(5)}} picks {{print(long)}} in phase 1, and {{print(Integer)}} is never even considered. With {{print(null)}}, both {{String}} and {{Integer}} apply and neither is more specific, so the call is ambiguous.

### private and final
- {{private}} methods are not inherited and are not in the vtable. A call inside the parent compiles to {{invokespecial}}, a direct call with no lookup, so it always runs the parent code even when the object is a subclass. A same-name method in the child is a **new** method unrelated to the parent one; adding {{@Override}} makes the compiler reject it ("method does not override or implement a method from a supertype").
- {{final}} methods cannot be overridden, which is how an algorithm is frozen (for example the signature-check step inside a template method). A subclass declaring the same method gets a compile error instead of silently hiding it.
- Hiding a static method with an access modifier narrower than the parent's is also a compile error, the same visibility rule as overriding.

### Common wrong answers
- "Changing only the return type is still overloading": wrong. In the same class it is a compile error ("method is already defined"); in a subclass with the same parameters it is either covariant overriding (the new type is a subtype) or an error.
- "Static methods are overridden because you can call them through an instance": wrong, that is hiding, and {{p.who()}} is just {{Parent.who()}} written in a misleading way.
- "Overloading selects by the real object": wrong — the choice was fixed by the compiler from the declared types, and the runtime object only matters when the JVM executes {{invokevirtual}}.
- "An override may throw any exception": wrong — it may throw fewer or narrower checked exceptions, never a new or broader one.

### Production pitfall
- Writing {{public boolean equals(Account other)}}: that is an **overload**, not an override of {{equals(Object)}}. {{HashSet}}, {{HashMap}} and {{List.contains}} call the {{Object}} version, so your method is never used and duplicates silently slip through. Always add {{@Override}} and let the compiler check.
- {{List<Integer>}} has both {{remove(int index)}} and {{remove(Object o)}}. {{list.remove(1)}} deletes the element at **index 1**, because {{int}} is an exact match while boxing to {{Integer}} only happens in phase 2. To remove a value use {{list.remove(Integer.valueOf(1))}}.
- Two overloads {{f(List<String>)}} and {{f(List<Integer>)}} do not compile ("name clash"): generics are erased to their raw type at compile time (type erasure), so both signatures become {{f(List)}}.

> Senior tip: turn on the "missing @Override" warning in your IDE/Sonar and treat it as an error — it costs nothing and catches the {{equals(Account)}} family of bugs. For public APIs, avoid overloads with the same arity whose types convert into each other automatically (int/Integer/long/Object), because callers aim at the wrong method without noticing. In an interview, say the rule first — "overloading is compile time on the declared type, overriding is runtime on the real object" — and then walk through the two predictions above; that answer is short, correct and hard to poke holes in.`,
    follow: [`Why do fields not have polymorphism? What does {{p.field}} return when {{p}} is declared with the parent type?`, `Why is calling an overridable method from a parent constructor dangerous?`, `What is the bridge method that the compiler generates when overriding a generic method?`]
  },

  'core-022': {
    q: `Predict the output: compare {{==}} and {{equals}} with String literals, {{new String}}, runtime concatenation and {{Integer}}. Why does comparing {{Long}} IDs with {{==}} work in dev but break in production?`,
    a: `**Summary:** {{==}} compares **references** (do both variables point to the same object), while {{equals}} compares **content**, provided the class overrides it. String literals and compile-time constants go into the String pool, so {{==}} accidentally returns true; strings created at runtime do not. {{Integer}} / {{Long}} cache from -128 to 127, so {{==}} works for small IDs in dev and fails when IDs exceed 127 in production.

### Predict output: String
~~~java
String a = "hello";
String b = "hello";
String c = new String("hello");
String d = "hel" + "lo";         // compile-time constant: compiler folds to "hello"
String part = "hel";
String e = part + "lo";          // part is not constant: concatenated at runtime, new object
final String fpart = "hel";
String f = fpart + "lo";         // fpart is a constant variable: folded again

System.out.println(a == b);          // true
System.out.println(a == c);          // false
System.out.println(a.equals(c));     // true
System.out.println(a == d);          // true
System.out.println(a == e);          // false
System.out.println(a == e.intern()); // true
System.out.println(a == f);          // true
~~~
Why:
- Every identical literal in the same JVM shares one object in the String pool, so {{a == b}}.
- {{new String(...)}} always creates a new heap object, even when the pool already has "hello".
- {{"hel" + "lo"}} and {{fpart + "lo"}} are **constant expressions** (JLS 15.29), computed at compile time and interned like a literal. Removing {{final}} makes {{part + "lo"}} a runtime operation (via {{StringConcatFactory}}) producing a new object.
- {{intern()}} returns the pool object with the same content.

### Predict output: wrapper
~~~java
Integer x = 127, y = 127;
Integer m = 128, n = 128;
Long id = 127L;
System.out.println(x == y);         // true: same cached object
System.out.println(m == n);         // false: outside cache, different objects
System.out.println(m.equals(n));    // true
System.out.println(m == 128);       // true: m is unboxed, compares int value
System.out.println(x.equals(127L)); // false: 127L boxes to Long, different class
System.out.println(id.equals(127)); // false: 127 boxes to Integer
~~~
These results assume the default settings; the flag {{-XX:AutoBoxCacheMax}} can expand the {{Integer}} cache, making {{==}} even less trustworthy.

### equals is not always content comparison
{{Object.equals}} defaults to {{==}}. {{StringBuilder}} **does not** override {{equals}}, so {{new StringBuilder("a").equals(new StringBuilder("a"))}} returns false. For content comparison use {{sb1.compareTo(sb2) == 0}} (Java 11+) or compare {{toString()}}. {{BigDecimal.equals}} compares scale too: {{2.0}} differs from {{2.00}}.

### Common wrong answers
- "For String, {{==}} compares value": only accidentally when both are literals.
- "{{equals}} always compares content": only when the class overrides it.
- Forgetting that {{Integer.equals(Long)}} is always false even with the same value.

### Production pitfall
- {{if (order.getUserId() == currentUser.getId())}} with {{Long}}: tests with user IDs 1, 2, 3 pass; in production with ID 10523 it fails, causing authorization errors "not the order owner". Use {{Objects.equals(a, b)}} (null-safe) or compare primitives.
- {{status == "ACTIVE"}} when status comes from DB or JSON: the string is created at runtime, so it is always false. Use {{"ACTIVE".equals(status)}} to avoid NPE, or better yet an enum (enum comparison with {{==}} is correct and fast).

> Senior tip: enable the Sonar / ErrorProne rule "reference comparison of boxed types / strings" at blocker level. The {{Long ==}} bug is the kind that only appears when data is large enough, so unit tests with small IDs never catch it; write tests deliberately using IDs greater than 127.`,
    follow: [`How many objects does {{new String("hello")}} create? What does it depend on?`, `Why is comparing enums with {{==}} safe, even after deserialization?`, `How does {{switch}} on String work internally ({{hashCode}} then {{equals}})?`]
  },

  'core-023': {
    q: `Predict the output: {{return}} inside {{try}} then modifying the variable in {{finally}}, {{return}} inside {{finally}}, exceptions inside {{finally}}, and {{System.exit}} inside {{try}}. How do these situations cause production bugs?`,
    a: `**Summary:** When {{try}} executes {{return expr}}, the value of {{expr}} is computed and copied into a hidden local variable **before** {{finally}} runs; changing a primitive variable in {{finally}} therefore does not change what is returned, but mutating the object that a reference points to does. {{return}} or {{throw}} inside {{finally}} **replaces** the result of the {{try}} and silently swallows the original exception. {{System.exit}} shuts the JVM down immediately (after running shutdown hooks), so {{finally}} never runs.

### 0. How the compiler lays this out
{{finally}} is not a block that "runs later". At compile time the compiler **copies the finally code into every exit path** of the try/catch: the normal exit, every catch block, every return and every throw. That single fact explains all the answers below.

### 1. Execution order
~~~java
static int order() {
    try {
        System.out.println("try");
        return value("return-expr");   // the return expression is evaluated first
    } finally {
        System.out.println("finally");
    }
}
static int value(String s) { System.out.println(s); return 1; }
// Output:
// try
// return-expr
// finally
~~~
The JVM (a) evaluates {{value("return-expr")}}, (b) stores 1 in a hidden local slot, (c) runs the copied finally code, (d) loads the slot and returns it. So the expression is evaluated before {{finally}}, but the method only returns after it.

### 2. Modifying variables in finally
~~~java
static int primitive() {
    int x = 1;
    try {
        return x;          // the value 1 is copied into a temporary slot
    } finally {
        x = 2;             // changes the local variable, not the temporary slot
    }
}                          // primitive() returns 1

static StringBuilder reference() {
    StringBuilder sb = new StringBuilder("a");
    try {
        return sb;         // the reference is copied, both point to the same object
    } finally {
        sb.append("b");    // mutates the object itself
    }
}                          // reference() returns "ab"
~~~
Memory picture for the primitive case:
~~~text
x = 1
return x        -> hidden slot = 1     (copy of the value)
finally         -> x = 2               (the hidden slot is still 1)
return          -> pushes 1
~~~
For a reference the copy is the pointer, not the object:
~~~text
sb -----------> [StringBuilder: "a"]
hidden slot = sb                       (same pointer)
finally: sb.append("b")
               [StringBuilder: "ab"]
return hidden  -> the same object, now "ab"
~~~
In bytecode these are {{ireturn}} (return an int) and {{areturn}} (return an object reference); the value in the hidden slot is what they consume.

### 3. return inside finally swallows the exception
~~~java
static int swallow() {
    try {
        throw new RuntimeException("boom");
    } finally {
        return 2;          // javac warns: finally block does not complete normally
    }
}                          // swallow() returns 2 and "boom" disappears without a trace
~~~
The {{athrow}} instruction for "boom" is never reached, because the copy of {{finally}} on the exception path ends with {{ireturn 2}} instead. Nothing is logged and nothing is chained: the caller sees an ordinary return value and the stack trace of "boom" is dropped with it.

### 4. Exception inside finally replaces the original exception
~~~java
try {
    try {
        throw new IllegalStateException("A");
    } finally {
        throw new RuntimeException("B");
    }
} catch (RuntimeException e) {
    System.out.println(e.getMessage() + " suppressed=" + e.getSuppressed().length);
}
// Output: B suppressed=0   -> "A" is gone, and it is not even in suppressed
~~~
Only **try-with-resources** attaches the exception thrown by {{close()}} to the primary exception, readable through {{getSuppressed()}}. A hand-written {{finally}} has no such mechanism: the new throw simply replaces the pending one and the original exception is lost.

### 5. System.exit
~~~java
try {
    System.out.println("try");
    System.exit(0);
} finally {
    System.out.println("finally");   // never printed
}
// Output: try
~~~
{{System.exit}} does not return. It starts the shutdown sequence (shutdown hooks run, then the JVM halts), so the copied finally code is never reached. The same happens with {{Runtime.getRuntime().halt()}}, a process killed with {{kill -9}} (SIGKILL cannot be caught), a JVM crash, or the JVM exiting while a daemon thread is still working.

### Common wrong answers
- "Finally runs after return, so the method returns 2": wrong for primitives — the return value was already copied.
- "Finally always runs": wrong with {{System.exit}}, {{Runtime.halt()}}, SIGKILL and crashes.
- "The exception thrown in finally is attached to the original one": wrong, the original is lost completely; only try-with-resources keeps it as suppressed.
- "Mutating the object in finally cannot matter because the value was copied": wrong — what was copied is the reference, so both the caller and finally see the same object.

### Production pitfall
- Closing a connection in {{finally}} when {{close()}} itself throws hides the real SQL error: the log only shows "connection already closed". Use try-with-resources and read {{e.getSuppressed()}} if you need both errors.
- {{return}} inside {{finally}} makes a method report success while the transaction has already failed, so the caller neither rolls back nor retries — and because the logs look clean, this bug is very expensive to investigate.
- {{System.exit}} inside a library or a scheduled job skips {{finally}} and can leave a batch half-written or a lock file on disk.

> Senior tip: ban {{return}} and {{throw}} inside {{finally}} with static analysis (Sonar has the rule "jump statements should not occur in finally blocks"). Keep {{finally}} for cleanup only; if cleanup can fail, wrap it in its own try/catch and log that error instead of letting it overwrite the main error. When someone reports "the exception disappeared", look for a return in finally first — it is almost always there.`,
    follow: [`How does try-with-resources generate bytecode to preserve suppressed exceptions?`, `Does a shutdown hook run when the container receives SIGTERM? What about SIGKILL?`, `If {{catch}} also has {{return}} and {{finally}} also has {{return}}, which value is returned?`]
  },

  'core-024': {
    q: `Predict the output: the execution order of static block, instance block, field initializer and constructor with inheritance. Why is calling an overridable method inside a parent constructor dangerous?`,
    a: `**Summary:** Static blocks and static field initializers run **once**, when the class is initialized for the first time, parent before child. On every {{new}}: the child constructor calls {{super()}} first; only after the parent constructor finishes do the child's field initializers and instance blocks run (in the order they appear in the source), then the child constructor body. Therefore an overridden method called from the parent constructor sees the child fields **not yet assigned** (null / 0).

### The vocabulary first
- **Static initializer** = a {{static { ... }}} block, or a static field with an initial value. It runs once per class loader.
- **Instance initializer** = a {{ { ... } }} block inside the class body. The compiler copies it into **every constructor**, right after {{super(...)}}.
- **Field initializer** = the {{= value}} part of a field declaration; it behaves exactly like an instance initializer snippet at that position.
- Before any constructor runs, the JVM has already allocated the object and filled every field with its **default value**: {{null}}, {{0}}, {{0.0}}, {{false}}.

### Predict the output: basic
~~~java
class Parent {
    static { System.out.println("Parent static"); }
    { System.out.println("Parent instance block"); }
    Parent() { System.out.println("Parent constructor"); }
}
class Child extends Parent {
    static { System.out.println("Child static"); }
    { System.out.println("Child instance block"); }
    Child() { System.out.println("Child constructor"); }
}
new Child();
new Child();
~~~
~~~text
Parent static
Child static
Parent instance block
Parent constructor
Child instance block
Child constructor
Parent instance block
Parent constructor
Child instance block
Child constructor
~~~
What happens, step by step:
1. The first {{new Child()}} triggers initialization of Child. JLS 12.4 says a class is initialized only after its superclass, so Parent's static block runs first, then Child's; inside one class the static initializers run top to bottom.
2. The JVM allocates the object with all fields set to their default values.
3. {{Child()}} starts with an implicit {{super()}}, so Parent's instance initializer runs, then Parent's constructor body.
4. Back in Child, its instance initializers run in source order, then its constructor body.
5. The second {{new}} prints no static lines: a class is initialized only once per class loader, however many objects you create.

### Trap 1: an overridden method called from the parent constructor
~~~java
class Base {
    Base() { init(); }                 // calls a method that may be overridden
    void init() { }
}
class Derived extends Base {
    private String name = "derived";   // assigned only AFTER Base() finishes
    private final int size = 10;       // constant variable: the compiler inlines 10
    @Override void init() {
        System.out.println(name + " " + size);
    }
}
new Derived();
// Output: null 10
~~~
Why {{null 10}}:
- When {{init()}} runs (inside {{Base()}}), the object is already a {{Derived}}, but {{Derived}}'s field initializers have not run yet, so {{name}} still holds the default null.
- {{size}} prints 10 because {{private final int size = 10}} is a **constant variable**: a final field of a primitive or String type initialized with a compile-time constant. The compiler replaces every use with the literal 10, so nothing is read from the object at all.
- Remove {{final}}, or initialize the field with a method call, and the output becomes {{null 0}}.
- This is exactly why Effective Java says constructors must not call overridable methods: the subclass sees a half-built object.

### Trap 2: static field order
~~~java
class Config {
    static Config INSTANCE = new Config();   // runs first
    static int counter = 0;                  // runs second, overwrites
    Config() { counter++; }
}
System.out.println(Config.counter);          // Output: 0
~~~
When the class is initialized, every static field first receives its default value (counter = 0). Then the static initializers run in textual order: line 1 creates an object, whose constructor increments counter to 1; line 2 then assigns counter = 0 again, overwriting the increment. Swap the two lines and the output is 1.

### When is a class initialized
- First {{new}}, a static method call, a read or write of a non-constant static field, {{Class.forName}}, or initialization of a subclass.
- Reading a {{static final}} **compile-time constant** (e.g. {{static final int MAX = 5}}) does **not** trigger initialization, because the value was inlined into the calling class at compile time (JLS 12.4.1). The downside: changing such a constant requires recompiling every class that uses it.
- Initialization is guarded by a per-class lock, so two threads that touch the class at the same moment still see exactly one execution. That is the base of the Holder pattern ({{static class Holder}} holds the singleton instance) and of lazy enum singletons.

### Common wrong answers
- "The instance block runs before the parent constructor": wrong, it runs after {{super()}}.
- "The static block runs on every new": wrong, once per class loader.
- "{{final}} fields always already have their value when called from the parent constructor": only true for compile-time constants.
- "The parent's field initializers run before the parent constructor": wrong, initializers and the constructor body run together in source order, after {{super()}}.

### Production pitfall
- A parent class calls {{init()}} or {{validate()}} in its constructor, a child overrides it and uses unassigned fields, producing a confusing NPE. Keep constructors free of overridable calls.
- An exception inside a static block produces {{ExceptionInInitializerError}} on the first attempt and {{NoClassDefFoundError}} afterwards, with the real cause usually hidden inside the first log line. Someone reading only the latest log will think a jar is missing.
- Two classes whose static initializers reference each other, initialized from two different threads, can deadlock at startup: each thread holds one class lock and waits for the other.

> Senior tip: keep static blocks thin — no network, no DB, no complex config reads. In Spring, prefer constructor injection and {{@PostConstruct}} over logic in static or instance blocks. When you see {{NoClassDefFoundError}} in production, search the logs for {{ExceptionInInitializerError}} first: it is almost always the real root cause.`,
    follow: [`Why is a static nested Holder class a lazy singleton that is thread-safe without {{synchronized}}?`, `Distinguish {{ExceptionInInitializerError}} and {{NoClassDefFoundError}} when investigating startup errors.`, `Do records and enums have special initialization orders?`]
  },

  'core-025': {
    q: `Stack vs heap in the JVM: where do local variables, objects, references, static fields and the String pool live? When does {{StackOverflowError}} occur in production and how do you handle it?`,
    a: `**Summary:** Every thread has its own **JVM stack** made of frames; each method call pushes one frame holding the local variables (primitives and **references**) and an operand stack, and the frame is destroyed when the method returns. All **objects** — including arrays and the fields inside objects — live on the shared **heap**, which the garbage collector manages. Static fields live inside the {{Class}} object on the heap, class metadata lives in Metaspace, and the String pool has been on the heap since Java 7. {{StackOverflowError}} happens when the call chain is deeper than the stack size ({{-Xss}}), usually because of recursion that never stops.

### What a frame really is
- A frame has two parts: an array of **local variables** ({{this}}, the parameters and the locals; each slot holds a primitive value or a reference) and an **operand stack**, a scratch area where bytecode pushes and pops intermediate values (push a, push b, add, store the result into a local).
- A **reference** is a small value, about the size of a pointer, that tells the JVM where an object is. The reference sits in the frame; the object it points to sits on the heap.
- Frames are allocated LIFO — the last call is the first to be destroyed. That is why recursion grows the stack while a plain loop does not.

### Example: what lives where
~~~java
class TransferService {
    static final Map<String, BigDecimal> LIMITS = new HashMap<>(); // reference in Class mirror, map on heap

    void transfer(Account from, long amount) {   // 'from': reference, lives in frame
        int fee = 1_000;                          // primitive local: lives in frame
        Receipt r = new Receipt(amount, fee);     // 'r' in frame, Receipt object on heap
        from.debit(amount + fee);                 // a new frame is pushed for debit()
    }   // frame popped: fee and r disappear; Receipt becomes garbage if nothing references it
}
~~~
~~~text
Thread A stack (private)                Heap (shared, GC-managed)
+--------------------------+            +-------------------------------+
| transfer() frame         |            | Account object                |
|  from   = ref -----------+----------->|   balance = 900000            |
|  amount = 100000         |            |   ...                         |
|  fee    = 1000           |            +-------------------------------+
|  r      = ref -----------+----------->| Receipt object                |
+--------------------------+            |   amount = 100000             |
| debit() frame            |            |   fee = 1000                  |
|  this   = same ref ------+----------->+-------------------------------+
|  x      = 101000         |            | String pool: "VND" ...        |
+--------------------------+            | Class<Account> mirror         |
                                        |   static LIMITS -> HashMap    |
                                        +-------------------------------+
~~~
Note: the {{int}} field of an object lives on the **heap**, inside that object, not on the stack. Only the reference to the object is in the frame.

### Comparison
| | Stack (per thread) | Heap (shared) |
|---|---|---|
| Holds | Frames: local variables, references, operand stack | Objects, arrays, object fields, String pool |
| Lifetime | Duration of the method call (LIFO) | Until unreachable and collected by the GC |
| Size | {{-Xss}} (Linux 64-bit default around 1 MB per thread) | {{-Xms}} / {{-Xmx}} |
| Error when exhausted | {{StackOverflowError}} | {{OutOfMemoryError: Java heap space}} |
| Thread-safety | Local variables are thread-confined by nature | Needs synchronization when shared |

### Why the JVM splits memory this way
- Stack allocation and release is just moving a pointer: extremely cheap and needing no GC. But the lifetime must be short and the size must be known per method.
- Objects have unpredictable lifetimes (returned, cached, shared between threads), so they belong in a shared region that the GC can trace.
- **Escape analysis**: the JIT can prove that an object never leaves a method and then apply **scalar replacement** — it splits the object into plain local variables and never allocates it on the heap. This is an optimization, not a guarantee; verify with {{-XX:+PrintEscapeAnalysis}} or a profiler before relying on it.
- **Metaspace** replaced PermGen in Java 8: class metadata (bytecode, constant pool, method info) moved from the heap to native memory and grows on demand up to {{-XX:MaxMetaspaceSize}}.
- **Virtual threads** (Java 21) keep their stack as ordinary heap objects and, when they block, are unmounted from the carrier thread — that is how millions of them can exist. A virtual thread blocked inside a {{synchronized}} block stays pinned to its carrier and cannot be unmounted (the pinning problem).

### StackOverflowError in production
- Bidirectional JPA entities ({{Order}} has a list of {{OrderItem}}, each {{OrderItem}} points back to its {{Order}}) with Lombok {{@Data}}: the generated {{toString()}} and {{hashCode()}} call each other forever. Jackson serializing the same two-way relation does the same.
- Recursion over user-controlled data: deep category trees, JSON nested thousands of levels, catastrophic regex backtracking.
- Handling: rewrite the recursion as a loop with an explicit {{ArrayDeque}} used as a stack; remove relation fields from {{toString}}/{{equals}}; use {{@JsonManagedReference}}/{{@JsonBackReference}} or DTOs; cap the input depth. Raising {{-Xss}} only buys time and costs memory multiplied by the number of threads.

### Common wrong answers
- "Primitives always live on the stack": wrong; a primitive field of an object lives on the heap inside that object.
- "Static lives on the stack" or "the String pool lives in PermGen": PermGen was removed in Java 8, and the String pool moved to the heap in Java 7.
- "Java passes objects by reference": Java is always pass-by-value; what is copied is the reference.

> Senior tip: on {{StackOverflowError}}, read the stack trace and find the repeating segment — it is usually {{toString}} or {{hashCode}} alternating between two classes. Do not catch {{StackOverflowError}} and continue, because the state may be partially broken. And {{OutOfMemoryError: unable to create native thread}} means too many threads (each reserves its own stack), not a missing heap — lowering thread count or switching to virtual threads fixes it, increasing {{-Xmx}} does not.`,
    follow: [`How does escape analysis and scalar replacement work? How can you tell if it is happening?`, `How is Metaspace different from PermGen? When do you get {{OutOfMemoryError: Metaspace}}?`, `Why can a virtual thread still be pinned to a carrier thread in Java 21?`]
  },

  'core-026': {
    q: `Access modifiers: how do {{protected}} and package-private really work (including the trap when accessing through a parent-type reference)? Why should fields be {{private}}, and how do you use visibility to enforce module boundaries in a large codebase?`,
    a: `**Summary:** There are 4 levels: {{private}} (class only), package-private / no modifier (same package), {{protected}} (same package **plus** subclasses in other packages, but the subclass can only access via its own type reference), {{public}} (everywhere, if the module exports the package). Fields should be {{private}} so the class can preserve its invariant and change storage representation without breaking other code. At the architecture level, package-private is the cheapest tool to hide a business module’s implementation.

### Access table
| Modifier | Same class | Same package | Subclass other package | Elsewhere |
|---|---|---|---|---|
| private | Yes | No | No | No |
| (package-private) | Yes | Yes | No | No |
| protected | Yes | Yes | Yes (via its own type) | No |
| public | Yes | Yes | Yes | Yes |

Many people do not know: {{protected}} is **wider** than package-private because it also includes the same package.

### Protected trap with different package (JLS 6.6.2)
~~~java
package com.bank.core;
public class Account {
    protected long balance;
    void audit() { }                         // package-private
}

package com.bank.saving;
public class SavingAccount extends Account {
    void applyInterest(Account other, SavingAccount same) {
        this.balance += 10;                  // OK: through this object
        same.balance += 10;                  // OK: reference typed SavingAccount
        // other.balance += 10;              // COMPILATION ERROR: Account is not my type
        // audit();                          // COMPILATION ERROR: package-private, different package
    }
}
~~~
Why: {{protected}} means "the subclass may use the inherited part **of itself**", not "may read protected fields of any parent-typed object". Otherwise anyone could write a fake subclass just to read another object’s state.

### Why fields should be private
- **Invariant**: only the class’s methods can change state, so validation is in one place (e.g., {{balance >= 0}}).
- **Representation change**: changing from {{long cents}} to {{BigDecimal}} does not break callers.
- **Thread-safety**: a class cannot guarantee synchronization or visibility for fields that anyone can write directly.
- **Hibernate proxy**: in {{equals}} reading {{other.id}} directly, if {{other}} is a lazy proxy the proxy’s field is null; calling {{other.getId()}} is correct. This is a real bug when comparing entities.

### Using visibility as module boundaries (Lead perspective)
- Organize by **package-by-feature** ({{payment}}, {{loan}}, {{customer}}) instead of package-by-layer ({{controller}}, {{service}}, {{repository}}). Then only facade/API classes are {{public}}; repositories, mappers and helpers stay package-private, so other modules cannot shortcut into your repository.
- Spring can still inject package-private beans, and tests in the same package can still access them.
- Use ArchUnit (or Spring Modulith) to write CI tests enforcing rules like "the loan module must not depend on payment’s internal package".
- Java 9 JPMS: {{public}} no longer means everyone sees it; the package must be {{exports}} in {{module-info.java}}. From Java 16/17 the JDK blocks reflection into internal APIs by default (JEP 403), so old libraries using {{setAccessible}} on {{sun.*}} may break when upgrading.

### Common wrong answers
- "Protected is only for subclasses": wrong, same package can also access.
- "No modifier means private" (confused with C# / C++ class members): wrong.
- "Private field + public getter/setter is enough encapsulation": a setter for every field still breaks invariants.

### Pitfall in Spring
- {{@Transactional}} or {{@Cacheable}} on a {{private}} method never work because proxies cannot intercept it; calling through {{this}} also skips the proxy. From Spring 6, class-based proxies (CGLIB) support protected and package-private methods better, but {{private}} still fails.

> Senior tip: in code review, make every new class package-private by default and promote to {{public}} only with justification. Before splitting a monolith into microservices, tightening visibility with package-by-feature is the cheapest step to reveal cross-dependencies and prepare module cuts.`,
    follow: [`Package-by-feature vs package-by-layer: which do you choose and why?`, `How do you test a package-private method without making it public?`, `How do Spring Modulith or ArchUnit help enforce module boundaries?`]
  },

  'collections-015': {
    q: `Compare {{HashMap}}, {{Hashtable}}, {{Collections.synchronizedMap}} and {{ConcurrentHashMap}}. In concurrent services which one do you choose, and why can "already thread-safe" still be wrong?`,
    a: `**Summary:** {{HashMap}} is not thread-safe, allows one null key and multiple null values. {{Hashtable}} is a legacy class from Java 1.0, every method {{synchronized}} on the object itself, no nulls allowed. {{synchronizedMap}} is a wrapper around any map, locks one mutex for all operations; essentially the same as {{Hashtable}}. {{ConcurrentHashMap}} locks per bin (CAS + {{synchronized}} on the first node), reads without locking, has atomic operations {{compute}} / {{merge}}, and disallows null. In new code prefer {{ConcurrentHashMap}}; but thread-safe per method does not mean your compound check-then-act sequence is safe.

### Comparison table
| | HashMap | Hashtable | synchronizedMap | ConcurrentHashMap |
|---|---|---|---|---|
| Thread-safe | No | Yes (1 lock) | Yes (1 lock) | Yes (per-bin lock) |
| Null key/value | 1 null key, many null values | No | Depends on backing map | No |
| Concurrent read | Unsafe | Blocked | Blocked | Not blocked |
| Iterator | Fail-fast | Enumeration / fail-fast | Fail-fast, must self-sync | Weakly consistent, no CME |
| Atomic operations | None | None (per-method only) | None | {{putIfAbsent}}, {{compute}}, {{merge}} |
| Notes | Default for single-threaded code | Legacy, avoid | Wrap TreeMap / LinkedHashMap when needed | Default for multi-threaded |

### Why HashMap shared between threads is dangerous
Two threads calling {{put}} can overwrite each other’s nodes (data loss), or see an incorrect {{size}} during resize. In Java 7, concurrent resize could even create a loop in the linked list and drive CPU to 100%. Java 8 changed the node transfer approach so that loop is no longer possible, but data loss remains.

### "Thread-safe" can still be wrong: compound actions
~~~java
Map<String, Integer> counts = Collections.synchronizedMap(new HashMap<>());

// WRONG: both threads see missing key, both put 1 -> one count lost
if (!counts.containsKey(user)) counts.put(user, 1);
else counts.put(user, counts.get(user) + 1);

// CORRECT: one atomic operation on ConcurrentHashMap
ConcurrentMap<String, Integer> safe = new ConcurrentHashMap<>();
safe.merge(user, 1, Integer::sum);

// Iterating synchronizedMap: must lock on the wrapper itself
synchronized (counts) {
    for (var e : counts.entrySet()) { /* ... */ }
}
~~~
Each individual method is locked, but between {{containsKey}} and {{put}} another thread can still intervene.

### Why ConcurrentHashMap disallows null
If {{get(k)}} returns null, in a concurrent environment we cannot distinguish "key absent" from "key present with null value" (calling {{containsKey}} afterwards may already see a different result). Banning null removes this ambiguity.

### Common wrong answers
- "ConcurrentHashMap splits into 16 segments": that was Java 7; since Java 8 it locks per bin.
- "synchronizedMap is faster than Hashtable": both use a single global lock, so performance is similar.
- "Using ConcurrentHashMap eliminates all race conditions": still wrong if you use {{get}} then {{put}} instead of {{compute}} / {{merge}}.

### Production pitfall
- Calling an external API or DB query inside {{computeIfAbsent}}: the bin is locked for the entire duration, blocking other threads writing to the same bin. Heavy caches should use Caffeine.
- In the mapping function of {{computeIfAbsent}} modifying the same map can throw {{IllegalStateException: Recursive update}} or hang.
- {{size()}} is only an estimate during writes; use {{mappingCount()}} for large maps and do not rely on it for business decisions.

> Senior tip: when reviewing code and seeing {{Collections.synchronizedMap}} or {{Hashtable}} in new code, it is almost always replaceable with {{ConcurrentHashMap}} and {{merge}} / {{compute}}. If you need a sorted concurrent map, use {{ConcurrentSkipListMap}} instead of wrapping {{TreeMap}} with a global lock.`,
    follow: [`Why does ConcurrentHashMap’s iterator not throw ConcurrentModificationException? What data does it see?`, `When is ConcurrentHashMap not enough and you still need external locking or a cache like Caffeine?`, `Counting requests per user at high throughput: merge or LongAdder inside a map?`]
  },
});
