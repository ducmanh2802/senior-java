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
    a: `**Summary:** Overloading means many methods with the same name but different parameter lists; the compiler chooses at **compile time** based on the **declared type** of the argument. Overriding means a subclass redefines an instance method with the same signature; the JVM chooses at **runtime** based on the **real object**. {{static}} methods cannot be overridden — only **hidden**; {{private}} and {{final}} methods cannot be overridden.

### Rules table
| Rule | Overloading | Overriding |
|---|---|---|
| When chosen | Compile time, by static type | Runtime, by dynamic type (vtable) |
| Signature | Same name, different parameter list | Same name and parameter list |
| Return type | Any, but cannot differ only by return type | Identical, or subtype (covariant) if a reference type |
| Access modifier | Any | Cannot be narrower (protected → public okay, reverse not) |
| Checked exception | Any | Cannot declare a new or wider checked exception; unchecked is free |
| static / private / final | Can overload | Cannot override (static is hidden) |

### Predict output: static hiding vs dynamic dispatch
~~~java
class Parent {
    static String who()  { return "Parent.static"; }
    String name()        { return "Parent.instance"; }
}
class Child extends Parent {
    static String who()  { return "Child.static"; }      // hiding
    @Override String name() { return "Child.instance"; } // overriding
}

Parent p = new Child();
System.out.println(p.who());   // Parent.static  (chosen by declared type Parent)
System.out.println(p.name());  // Child.instance (chosen by real object)
~~~
Why: static calls are compile-bound as {{invokestatic Parent.who}}, so the real object does not matter. Instance methods compile to {{invokevirtual}} and the JVM looks up the method table of the real class at runtime.

### Predict output: overload resolution
~~~java
static void print(Object o)  { System.out.println("Object"); }
static void print(String s)  { System.out.println("String"); }
static void print(long x)    { System.out.println("long"); }
static void print(Integer x) { System.out.println("Integer"); }

Object obj = "hello";
print(obj);   // Object: chosen by static type, not runtime type
print("hi");  // String: most specific method
print(5);     // long: widening (phase 1) beats boxing (phase 2)
// print(null); -> compile error "ambiguous": String and Integer are equal
~~~
The compiler searches in 3 phases: (1) no boxing, no varargs; (2) allowed boxing/unboxing; (3) allowed varargs. The first phase that finds a match stops, then selects the most specific method.

### private and final
- {{private}} methods are not inherited. A subclass method with the same name is a **new** method; adding {{@Override}} causes a compile error. Code in the parent that calls the method still runs the parent version.
- {{final}} methods prevent overriding and are used to lock an algorithm (e.g., a signature-check step inside a template method).

### Common wrong answers
- "Changing only the return type is still overloading": wrong, compile error.
- "Static methods can be overridden because they can be called through an instance": wrong, that is hiding and calling through an instance is just misleading syntax.
- "Overloading selects by the real object": wrong, it selects by the declared type.

### Production pitfall
- Writing {{public boolean equals(Account other)}}: this is **overloading**, not overriding {{equals(Object)}}. {{HashSet}} and {{List.contains}} call the {{Object}} version, so your method is never used. Always add {{@Override}}.
- {{List<Integer>}} has {{remove(int index)}} and {{remove(Object o)}}: calling {{list.remove(1)}} deletes the element at **index 1**, not the value 1. To remove by value use {{list.remove(Integer.valueOf(1))}}.
- Two overloads {{f(List<String>)}} and {{f(List<Integer>)}} cause a compile error "name clash" because after type erasure they have the same signature.

> Senior tip: turn on the missing-{{@Override}} warning in your IDE/Sonar and treat it as an error. For public APIs, avoid overloads with the same arity and easily-autoboxed types (int/Integer/long/Object), because callers can easily point to the wrong method without realizing it.`,
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
    a: `**Summary:** When {{try}} executes {{return expr}}, the value of {{expr}} is evaluated and saved temporarily **before** {{finally}} runs; modifying a primitive variable in {{finally}} does not change the returned value, but modifying the object the reference points to does. {{return}} or {{throw}} inside {{finally}} **replaces** the {{try}} result and swallows the original exception. {{System.exit}} stops the JVM, so {{finally}} does not run.

### 1. Execution order
~~~java
static int order() {
    try {
        System.out.println("try");
        return value("return-expr");   // return expression evaluated first
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

### 2. Modifying variables in finally
~~~java
static int primitive() {
    int x = 1;
    try {
        return x;          // value 1 copied into a temporary slot
    } finally {
        x = 2;             // changes the local variable, not the temporary slot
    }
}                          // primitive() returns 1

static StringBuilder reference() {
    StringBuilder sb = new StringBuilder("a");
    try {
        return sb;         // copies the reference, both point to same object
    } finally {
        sb.append("b");    // modifies the object itself
    }
}                          // reference() returns "ab"
~~~
Why: the compiler generates bytecode that saves the return value into a hidden local variable, runs the {{finally}} code (inlined into each exit path), then returns the hidden value with {{ireturn}} / {{areturn}}. For references, what is copied is the pointer, not the object.

### 3. return in finally swallows exception
~~~java
static int swallow() {
    try {
        throw new RuntimeException("boom");
    } finally {
        return 2;          // compiler warns: finally does not complete normally
    }
}                          // swallow() returns 2, "boom" disappears without a trace
~~~

### 4. Exception in finally replaces the original exception
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
// Output: B suppressed=0   -> "A" is lost, not in suppressed
~~~
Only try-with-resources automatically attaches the close-time exception to {{getSuppressed()}}; hand-written {{finally}} does not.

### 5. System.exit
~~~java
try {
    System.out.println("try");
    System.exit(0);
} finally {
    System.out.println("finally");   // never prints
}
// Output: try
~~~
{{System.exit}} does not return; the JVM runs shutdown hooks then stops. {{finally}} also does not run with {{Runtime.halt}}, when the process is killed with {{kill -9}}, JVM crash, or when a daemon thread is interrupted and the JVM exits.

### Common wrong answers
- "Finally runs after return, so the returned value is 2": wrong for primitives.
- "Finally always runs": wrong with {{System.exit}}, halt, kill -9.
- "Exception in finally is appended to the old exception": wrong, the old exception is fully lost.

### Production pitfall
- Calling {{conn.close()}} in {{finally}} where {{close()}} throws an exception hides the real SQL error; logs only show "connection already closed". Use try-with-resources.
- {{return}} in {{finally}} makes a method report success while the transaction has already failed, so callers do not rollback or retry. Very hard to investigate because logs are clean.
- Calling {{System.exit}} inside a library or Spring job skips {{finally}} and can leave a batch partially written.

> Senior tip: ban {{return}} / {{throw}} in {{finally}} via static analysis (Sonar has a rule "jump statements should not occur in finally blocks"). In {{finally}} only clean up, never handle business logic; if cleanup can fail, wrap it in its own try/catch and log that error — do not let it override the real error.`,
    follow: [`How does try-with-resources generate bytecode to preserve suppressed exceptions?`, `Does a shutdown hook run when the container receives SIGTERM? What about SIGKILL?`, `If {{catch}} also has {{return}} and {{finally}} also has {{return}}, which value is returned?`]
  },

  'core-024': {
    q: `Predict the output: the execution order of static block, instance block, field initializer and constructor with inheritance. Why is calling an overridable method inside a parent constructor dangerous?`,
    a: `**Summary:** Static blocks and static fields run **once**, when the class is first initialized, parent before child. Each {{new}}: the child constructor calls {{super()}} first; only after the parent constructor finishes do the field initializers and instance blocks of the child class run (in source order), then the child constructor body. Therefore an overridden method called from the parent constructor sees the child fields **not yet assigned** (null / 0).

### Predict output: basic
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
Why: to initialize {{Child}}, the JVM must initialize {{Parent}} first (JLS 12.4). The second {{new}} skips static output because the class is already initialized. The compiler copies field initializers and instance blocks into **every constructor**, right after the {{super(...)}} call, so they always run after the parent constructor.

### Trap 1: overridden method called from parent constructor
~~~java
class Base {
    Base() { init(); }                 // calls a method that may be overridden
    void init() { }
}
class Derived extends Base {
    private String name = "derived";   // assigned only AFTER Base() finishes
    private final int size = 10;       // constant variable: compiler inlines 10
    @Override void init() {
        System.out.println(name + " " + size);
    }
}
new Derived();
// Output: null 10
~~~
{{name}} is still the default null because {{Derived}} initializers have not run yet. {{size}} prints 10 because it is a {{final}} primitive assigned a compile-time constant, so every use is replaced with the literal 10. Removing {{final}} would print {{null 0}}.

### Trap 2: static field order
~~~java
class Config {
    static Config INSTANCE = new Config();   // runs first
    static int counter = 0;                  // runs second, overwrites
    Config() { counter++; }
}
System.out.println(Config.counter);          // Output: 0
~~~
When initializing the class, all static fields start at default values (counter = 0). Line 1 creates an object and increments counter to 1, then line 2 assigns counter = 0 again. Swapping the two lines makes the output 1.

### When a class is initialized
- First {{new}}, static method call, reading/writing a non-constant static field, {{Class.forName}}, or initializing a subclass.
- Reading a {{static final}} compile-time constant (e.g., {{static final int MAX = 5}}) **does not** trigger static blocks, because the value is inlined into the calling class.
- This is the foundation of the Holder pattern: a {{static class Holder}} contains a lazy singleton instance, initialized thread-safely by the JVM during class init.

### Common wrong answers
- "Instance block runs before parent constructor": wrong, it runs after {{super()}}.
- "Static block runs on every new": wrong, only once per class loader.
- Thinking {{final}} fields always have their value when called from the parent constructor: only true for compile-time constants.

### Production pitfall
- A parent class calls {{init()}} or {{validate()}} in its constructor, a child overrides it and uses unassigned fields, causing a confusing NPE. Effective Java recommends: constructors must not call overridable methods (directly or indirectly).
- Exceptions in static blocks produce {{ExceptionInInitializerError}} on the first attempt and {{NoClassDefFoundError}} afterwards. Someone reading only the latest log will think a jar is missing.
- Two classes with static init dependencies that reference each other, initialized from two different threads, can deadlock at startup.

> Senior tip: keep static blocks thin (no network/DB calls, no complex config reads). In Spring, prefer constructor injection and {{@PostConstruct}} over logic in static / instance blocks; when encountering {{NoClassDefFoundError}} in production, search for {{ExceptionInInitializerError}} first in the logs.`,
    follow: [`Why is a static nested Holder class a lazy singleton that is thread-safe without {{synchronized}}?`, `Distinguish {{ExceptionInInitializerError}} and {{NoClassDefFoundError}} when investigating startup errors.`, `Do records and enums have special initialization orders?`]
  },

  'core-025': {
    q: `Stack vs heap in the JVM: where do local variables, objects, references, static fields and the String pool live? When does {{StackOverflowError}} occur in production and how do you handle it?`,
    a: `**Summary:** Each thread has its own **JVM stack** made of frames; each method call creates a frame holding local variables (primitive and **reference**) and an operand stack; when the method returns the frame is destroyed. All **objects** (including arrays and fields inside objects) live on the shared **heap**, managed by GC. Static fields live with the {{Class}} object on the heap, class metadata lives in Metaspace, and the String pool lives on the heap since Java 7. {{StackOverflowError}} occurs when the call chain exceeds the stack size ({{-Xss}}), usually due to infinite recursion.

### Example: what lives where
~~~java
class TransferService {
    static final Map<String, BigDecimal> LIMITS = new HashMap<>(); // reference in Class mirror, map on heap

    void transfer(Account from, long amount) {   // 'from': reference, lives in frame
        int fee = 1_000;                          // primitive local: lives in frame
        Receipt r = new Receipt(amount, fee);     // 'r' in frame, Receipt object on heap
        from.debit(amount + fee);                 // new frame pushed for debit()
    }   // frame popped: fee and r disappear; Receipt becomes garbage if no reference holds it
}
~~~
Note: the {{int}} fields of an object live on the **heap** inside that object, not on the stack.

### Comparison
| | Stack (per thread) | Heap (shared) |
|---|---|---|
| Holds | Frame: local variables, references, operand stack | Objects, arrays, object fields, String pool |
| Lifetime | Method call duration (LIFO) | Until unreachable and GC collects |
| Size | {{-Xss}} (Linux 64-bit default ~1 MB) | {{-Xms}} / {{-Xmx}} |
| Error when exhausted | {{StackOverflowError}} | {{OutOfMemoryError: Java heap space}} |
| Thread-safety | Local variables are naturally thread-confined | Needs synchronization when shared |

### Why this design
- Stack allocation/deallocation is just pointer arithmetic, extremely cheap, and requires no GC; but size must be predictable per method and lives short.
- Objects have unpredictable lifetimes (returned, cached) so they must live in a shared GC-managed region.
- JIT has **escape analysis**: objects that do not escape the method can be scalar-replaced (fields turned into local variables), avoiding heap allocation. This is an optimization, not a guarantee.
- Virtual threads (Java 21): when unmounted, their stack is saved as chunk objects on the heap, allowing millions of virtual threads.

### StackOverflowError in production
- Bidirectional JPA entities ({{Order}} has a list {{OrderItem}}, {{OrderItem}} points back to {{Order}}) using Lombok {{@Data}}: {{toString()}} / {{hashCode()}} call each other infinitely. Jackson serialization of bidirectional relations is the same.
- Recursion over user-controlled data: deep category trees, deeply nested JSON, large regex backtracking.
- Handling: rewrite to loop + explicit {{ArrayDeque}} stack; exclude relationship fields from {{toString}} / {{equals}}; use {{@JsonManagedReference}} / {{@JsonBackReference}} or DTOs; limit input depth. Increasing {{-Xss}} is only temporary and costs memory multiplied by thread count.

### Common wrong answers
- "Primitives always live on the stack": wrong; primitive fields of an object live on the heap.
- "Static lives on the stack" or "String pool lives in PermGen": PermGen was removed in Java 8; String pool moved to heap in Java 7.
- "Java passes objects by reference": Java is always pass-by-value; the copied value is the reference.

> Senior tip: when you see {{StackOverflowError}}, read the stack trace to find the repeating segment (often {{toString}} or {{hashCode}} alternating between two classes). Do not try to catch {{StackOverflowError}} to continue, because state may be partially broken. For {{OutOfMemoryError: unable to create native thread}}, the cause is too many threads (each takes its own stack), not missing heap.`,
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
