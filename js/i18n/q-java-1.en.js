/*
 * English translation of js/data/q-java.js — task T159. Format: js/core/i18n.js (content overlay).
 * ids: core-001 core-002 core-003 core-004 core-005 core-006 core-007 core-008 core-009 core-010 core-011 collections-001
 */
App.i18n.content({
  'core-001': {
    q: `What is the contract between {{equals()}} and {{hashCode()}}? What happens if it is violated?`,
    a: `**Summary:** two objects that are {{equals()}} must have the same {{hashCode()}}; the converse is not required (collision is allowed).

### Contract
- **Reflexive / symmetric / transitive / consistent**, and {{x.equals(null) == false}}.
- {{a.equals(b)}} ⇒ {{a.hashCode() == b.hashCode()}}.
- {{hashCode()}} must be stable when the fields participating in {{equals}} do not change.

### What if violated
- Override {{equals}} but forget {{hashCode}}: {{HashMap}}/{{HashSet}} place two "equal" objects in different buckets ⇒ {{contains()}} returns {{false}}, the set contains duplicates.
- Use a **mutable field** as a key and modify it after {{put}} ⇒ the key "disappears" from the map, causing a memory leak.

~~~java
record Point(int x, int y) {}          // record auto-generates equals/hashCode correctly

@Override public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof User u)) return false;
    return id.equals(u.id);
}
@Override public int hashCode() { return Objects.hash(id); }
~~~

> Senior tip: for JPA entities, do not use an auto-generated id in {{hashCode}} (null before persist) — use a business key or return a constant per class.`,
    follow: [`Why does {{hashCode}} returning a constant maintain the contract but is a bad idea?`, `How to implement {{equals}} for a class with inheritance without breaking symmetry?`]
  },
  'core-002': {
    q: `Why is {{String}} immutable and final? How does the String pool work, and when should {{intern()}} be used?`,
    a: `**Summary:** {{String}} is immutable for safety (thread, security, as a key), and the pool is a shared region for identical literals to save heap; {{intern()}} brings a runtime string into the pool and returns the canonical instance.

### Inside String
- The class is declared {{public final class String}}, so it cannot be subclassed to break immutability.
- From Java 9, data lives in {{private final byte[] value}} with {{byte coder}} (Compact Strings): Latin-1 strings use 1 byte/char, strings with non-Latin-1 characters use UTF-16. Before Java 9 it was {{char[]}}.
- Every "modification" such as {{concat}}, {{substring}}, {{replace}} creates a new object. No setter, no exposed internal array.

### Why immutable
- **Free thread-safety**: many threads can read the same object without a lock, because state never changes.
- **Safe as a key**: {{hashCode}} is cached in the {{hash}} field (computed once); if the string changes, the entry in {{HashMap}} is lost.
- **Security**: file paths, URLs, class names, SQL strings passed to sensitive APIs; if the receiver holds a reference and the content is modified after validation (TOCTOU), a vulnerability appears.
- **Sharing and optimization**: pool, old substring no longer shares the array (changed from Java 7u6 to prevent leaks), JIT optimizes better.

### String pool
- Literal {{"hello"}} is resolved at class load time and placed in the **string pool** (since Java 7 on the heap, not PermGen).
- {{new String("hello")}} creates a new object on the heap; the literal inside is still taken from the pool.
- {{==}} compares references, {{equals}} compares content.
- {{intern()}} checks the pool: if an equal content exists, returns the pool instance; if not, adds it and returns itself. From Java 7, strings not in the pool can be garbage-collected when unreferenced.

~~~java
String a = "hello";                  // pool
String b = new String("hello");      // heap, different reference
System.out.println(a == b);          // false
System.out.println(a == b.intern()); // true
String c = ("hel" + "lo");           // compile-time constant => pool
System.out.println(a == c);          // true
~~~

### Pitfall production
- Concatenating strings in a loop with {{+}} creates thousands of intermediate objects; use {{StringBuilder}} for loops, {{String.join}} for collections.
- Concatenating in {{toString()}} of an entity in a hot log also creates garbage; consider parameterized logging.
- {{intern()}} on non-repeating data (e.g., a UUID per request) inflates the pool; only use when the value set is small and repeats often.

> Senior tip: for services with many repeated strings, enable {{-XX:+UseStringDeduplication}} (G1) and monitor {{-XX:+PrintStringTableStatistics}}; do not call {{intern()}} extensively because it touches an internal locked table.`,
    follow: [`Why is string concatenation with {{+}} in a loop slower than {{StringBuilder}}?`, `If {{String}} allowed inheritance, which immutability guarantees would be broken?`, `When should {{intern()}} be used and when should it be avoided?`]
  },
  'core-003': {
    q: `Java is always pass-by-value — explain this when passing an object reference into a method.`,
    a: `**Summary:** Java copies the **parameter value** when calling a method. For an object, the copied value is the **reference**, so the method can modify the object's content but cannot change the reference of the caller's variable.

### What happens on the stack
- Each method call creates a new frame; parameters are local variables in that frame.
- For primitives, the copy is the numeric value. Modifying inside the method does not affect the caller.
- For objects, the caller's variable and the parameter are **two different variables** pointing to the same object on the heap. Therefore:
  - Calling a method on the object ({{list.add}}, {{sb.append}}) makes the caller see the change.
  - Reassigning the parameter ({{param = other}}) only changes the local variable; the caller still points to the old object.

~~~java
static void reassign(StringBuilder sb) {
    sb = new StringBuilder("new");     // only changes local variable
}
static void mutate(StringBuilder sb) {
    sb.append(" added");                // modifies shared object
}

StringBuilder x = new StringBuilder("orig");
reassign(x);
System.out.println(x);                 // orig
mutate(x);
System.out.println(x);                 // orig added
~~~

### Consequences in interviews
- There is no "pass-by-reference" like C++ in Java. You cannot write {{swap(a, b)}} to swap caller variables.
- To return multiple values: return an object/record, use a one-element array, or {{AtomicReference}} (but usually record is clearest).
- Passing an array is also passing a reference: if the method modifies elements, the caller sees it; if it assigns a new array, the caller does not.
- When an API receives a mutable collection/array, do a **defensive copy** at the boundary if you want to preserve immutability; otherwise the caller may modify data after validation.

### Link to immutability
- Because the reference is copied, not the object, passing an object into a method does not create a copy. This is why classes like {{String}}, {{LocalDate}}, and records should be immutable: safe sharing without copying.
- Conversely, sharing mutable {{Date}} or {{ArrayList}} across layers easily creates hard-to-reproduce "data changed itself" bugs.

> Senior tip: when reviewing code, if a public method accepts {{List}} and stores it directly in a field, that is a sign it needs {{List.copyOf}}; seeing {{param = ...}} inside a method is almost certainly a bug from misunderstanding pass-by-value.`,
    follow: [`Write a {{swap}} method for two {{Integer}} — why is it impossible?`, `If you pass a {{List}} to a method and assign {{list = new ArrayList<>()}} inside, does it affect the caller?`, `Where should defensive copy be placed: constructor, getter, or both?`]
  },
  'core-004': {
    q: `How should you design an exception hierarchy for a Spring service? Checked or unchecked, when to wrap, and how to avoid swallowing errors?`,
    a: `**Summary:** use a base **unchecked** {{BusinessException}} carrying an {{errorCode}} for business errors, leave framework RuntimeExceptions intact, wrap infrastructure errors with {{cause}}, and map to HTTP in one place only ({{@RestControllerAdvice}}).

### Checked vs unchecked
- **Checked** (extends {{Exception}}): compiler forces handling. Suitable for conditions **recoverable** and that the caller must decide, e.g., {{IOException}} when reading a file, {{InterruptedException}}. Downside: clutters signatures, hard to use in lambda/stream, easy to create empty {{catch (Exception e)}}.
- **Unchecked** (extends {{RuntimeException}}): programming errors or unrecoverable business errors. Most modern services choose unchecked to keep APIs clean; errors are handled centrally at the web layer.
- **Error** ({{OutOfMemoryError}}, {{StackOverflowError}}): never catch, never declare; the JVM is in an untrustworthy state.

### Suggested hierarchy
~~~java
public class BusinessException extends RuntimeException {
    private final String code;                 // "ORDER_NOT_FOUND"
    public BusinessException(String code, String msg, Throwable cause) {
        super(msg, cause);                     // always keep cause
        this.code = code;
    }
    public String getCode() { return code; }
}

public class NotFoundException extends BusinessException {
    public NotFoundException(String code, String msg) { super(code, msg, null); }
}
~~~

- Domain layer throws {{NotFoundException("ORDER_NOT_FOUND", ...)}}; web layer maps code to 404, 409, 422.
- Do not expose stack traces or DB/table names in responses; log fully on the server, return safe messages to clients.
- Validation errors should aggregate multiple fields (a list of errors), not throw one at a time.

### When to wrap
- Wrap when adding **business context** or changing the error type for an upper layer: catch {{SQLException}} then {{throw new RepositoryException(msg, e)}} to keep cause and add context.
- Do not wrap if nothing is added — only makes the stack longer and harder to read.
- Always pass {{cause}}; never {{throw new RuntimeException(e.getMessage())}} because the original stack is lost.
- Avoid **log then throw again**: one error logged at 3 layers causes noise and increases cost. Choose one logging location (advice or consumer boundary).

### Swallowing and try-with-resources
- {{catch (Exception e)}} with no action is an anti-pattern; at minimum log with context and decide clearly (ignore, retry, fallback).
- {{finally}} is for cleanup; for resources implementing {{AutoCloseable}}, use try-with-resources so that an exception on close is attached to {{getSuppressed()}} instead of hiding the primary error.
- In async/CompletableFuture, errors live inside the future; must handle with {{exceptionally}}/{{handle}} or log in {{whenComplete}}, otherwise they disappear silently.

> Senior tip: define {{errorCode}} as a stable enum/constant and never change the meaning of an old code; clients and monitoring often parse that code.`,
    follow: [`Why should a base exception for a service be unchecked rather than checked?`, `When is it correct to wrap a framework exception and when should you leave it?`, `How do you avoid swallowing errors in catch blocks and in async pipelines?`]
  },
  'core-005': {
    q: `Distinguish {{final}}, {{finally}}, {{finalize}}. Why is {{finalize}} deprecated, and how do {{Cleaner}} / try-with-resources replace it?`,
    a: `**Summary:** {{final}} is a modifier (immutable reference / non-overridable / non-inheritable), {{finally}} is a block that always runs when exiting try, and {{finalize}} is a GC hook that has been deprecated because it does not guarantee timing, runs slowly, and is dangerous; replaced by try-with-resources or {{Cleaner}}.

### final
- **Variable/field**: assigned once, reference cannot change. For objects, content is still mutable ({{final List}} can still {{add}}).
- **Method**: prevents override.
- **Class**: prevents inheritance ({{String}}, {{Integer}}).
- Important for the **memory model**: a {{final}} field is "frozen" after the constructor, so other threads reading it see the correct value if the object is safely published. This is the foundation of immutable objects.
- {{final}} local variables can be used in lambda/anonymous classes (effectively final also works).

### finally
- Runs when try exits normally, when an exception occurs, when {{return}}, {{break}}, {{continue}}.
- **Does not run** if the JVM dies: {{System.exit}}, {{Runtime.halt}}, native crash, kill -9.
- {{return}} inside {{finally}} **masks** an earlier exception/return — extremely dangerous, avoid absolutely.

### finalize
- Called by GC **before** reclaiming, with no timing guarantee, possibly never called, and runs on a single finalizer thread so it can block.
- Can **resurrect** the object by assigning {{this}} to a static field — breaking lifecycle assumptions.
- Exceptions thrown inside are swallowed; no useful exception can be thrown.
- From Java 18, finalization is **deprecated for removal** (JEP 421) and can be disabled via {{--finalization=disabled}}; {{Cleaner}} has been official since Java 9.
- Why it still exists: backward compatibility with old code and some native libraries.

### Replacements
- **try-with-resources**: the standard for any {{AutoCloseable}} resource (file, socket, JDBC). Closes in reverse order; exceptions on close are attached to {{getSuppressed()}}.
- **Cleaner** ({{java.lang.ref.Cleaner}}): registers an action to run when the object becomes phantom-reachable; used for native resources without a close API, but still **does not guarantee timing** — just a safety net.
- For direct {{ByteBuffer}}, use the internal JDK {{Cleaner}} or try to reuse buffers.

~~~java
try (var in = Files.newInputStream(path);
     var out = Files.newOutputStream(dest)) {
    in.transferTo(out);                  // automatic close, even on error
}
~~~

> Senior tip: never put critical business logic inside {{finalize}}. If you see {{finalize}} in old code, replace with {{AutoCloseable}} + try-with-resources first; keep {{Cleaner}} only for native resources.`,
    follow: [`Why can a {{return}} inside {{finally}} swallow an exception?`, `How does a {{final}} field help with safe publication between threads?`, `How is {{Cleaner}} different from {{finalize}}, and what limitations remain?`]
  },
  'core-006': {
    q: `How does type erasure affect generics? Explain wildcards and the PECS rule with {{? extends}} / {{? super}}.`,
    a: `**Summary:** generics are checked at compile time then **erased** from bytecode; wildcards increase flexibility, and PECS: **Producer Extends, Consumer Super** — read with {{? extends T}}, write with {{? super T}}.

### Type erasure
- {{List<String>}} and {{List<Integer>}} are both {{List}} in bytecode; no {{new T()}}, no {{instanceof T}}, no array {{new T[]}}, no overloading by type parameter alone.
- Compiler inserts **casts** and **bridge methods** to preserve polymorphism. For example, {{Comparable}} has {{compareTo(Object)}} bridge calling {{compareTo(MyType)}}.
- Consequence: generic types cannot be checked at runtime; {{List<String>}} can suffer "heap pollution" if wrongly inserted via a raw type. {{@SafeVarargs}} is just the programmer's guarantee.
- Generic type information remains in metadata ({{getGenericSuperclass}}, {{ParameterizedType}}) if declared on class/field/method. Jackson uses this via {{TypeReference}}.

### Why wildcards are needed
- Generics are **invariant**: {{List<Integer>}} is **not** a subtype of {{List<Number>}}, even though {{Integer}} is a subtype of {{Number}}. If allowed, one could {{add(3.14)}} to a List<Integer>.
- Wildcards extend safely in one direction:

~~~java
Number sum(List<? extends Number> src) {   // producer: can read Number
    double s = 0;
    for (Number n : src) s += n.doubleValue();
    return s;
}
void addInts(List<? super Integer> dst) {  // consumer: can write Integer
    dst.add(1);
}
~~~

- {{? extends T}}: can only read {{T}}, **cannot** write (except {{null}}) because the compiler does not know the specific subtype.
- {{? super T}}: can write {{T}}, but can only read {{Object}}.
- {{?}} = {{? extends Object}}, can read Object, cannot write.

### PECS application
- {{Collections.copy(List<? super T> dest, List<? extends T> src)}} is the classic example.
- API receiving a collection only for reading: use {{Collection<? extends T>}} to accept {{List<Sub>}}.
- API only for writing: {{Consumer<? super T>}}.
- Return should use the concrete type, not wildcard (except to hide implementation).
- {{Comparable<? super T>}} allows comparison with a supertype.

### Pitfalls
- Raw type ({{List}} without parameter) disables compile-time checks, causes warnings, and can trigger {{ClassCastException}} elsewhere.
- Cannot create generic arrays: {{new List<String>[10]}} is invalid; use {{List<List<String>>}} or {{Array.newInstance}} with controlled cast.
- {{List<Object>}} does not accept {{List<String>}}; {{List<?>}} accepts but nothing can be added.

> Senior tip: when designing a library API, use wildcards on **input** so users can pass more types; do not overuse wildcards on return because it forces callers to handle useless {{?}}. And remember generics cost 0 at runtime — only bridge methods and small casts.`,
    follow: [`Why is {{new T[]}} or {{new List<String>[10]}} impossible?`, `What is the bridge method for and how does it preserve polymorphism?`, `How does PECS apply to method signatures in collections?`]
  },
  'core-007': {
    q: `How do you design an immutable class correctly? Where should defensive copy be placed and why?`,
    a: `**Summary:** class {{final}}, all fields {{private final}}, no setter, **copy** all mutable parameters in the constructor and copy again when returning; do not let {{this}} leak in the constructor.

### Design steps
1. Declare {{final class}} (or use static factory + private constructor) to prevent subclassing from breaking immutability.
2. Fields {{private final}}; no state-changing methods.
3. In constructor, **validate** then **defensive copy** all mutable parameters ({{Date}}, {{List}}, {{Map}}, arrays).
4. Getters return a copy or an immutable view, not the internal reference.
5. Be careful with **leaking this**: do not call overridable methods, do not register listeners, do not expose {{this}} before the constructor finishes.
6. {{equals}}/{{hashCode}} based on immutable fields; {{toString}} should not expose sensitive data.

~~~java
public final class Period {
    private final LocalDate start;      // LocalDate is immutable, no copy needed
    private final List<String> tags;    // List mutable, must copy

    public Period(LocalDate start, List<String> tags) {
        this.start = Objects.requireNonNull(start);
        this.tags = List.copyOf(tags);  // copy + null-hostile + immutable
    }
    public List<String> tags() { return tags; }   // safe because already immutable
}
~~~

### Where defensive copy belongs
- **Constructor**: mandatory if the parameter is mutable and you want to preserve immutability. Otherwise, the caller keeps a reference and modifies it after object creation.
- **Getter**: if the field is still mutable (e.g., {{Date}}), return {{new Date(value.getTime())}}; if already using {{List.copyOf}}/{{Collections.unmodifiableList}}, no extra copy is needed.
- {{Collections.unmodifiableList}} is only a **view**: if the original list is modified, the view changes. {{List.copyOf}} creates a real immutable copy, safer for values.
- Arrays must always be copied because {{clone()}} on an array returns a new array, but a getter returning the array directly is open.

### Why it is worth it
- Thread-safe without locks; safe as a map key; easy to cache and share.
- Few "data changed itself" bugs when objects pass through many layers.
- Record reduces boilerplate but **does not auto-copy** mutable components; you must still write a compact constructor calling {{List.copyOf}}.

### Pitfalls
- Copying in constructor but not in getter: still exposed if internal methods use the original list — and costs a copy on every read.
- Using {{List.of(...)}} with a null element throws NPE; validate input first.
- A "near-immutable" class with a mutable field exposed through a getter is a common cause of hard-to-reproduce race conditions.

> Senior tip: for DTO/record received from a request, copy immediately at the boundary (controller/service) so the rest of the system works with immutable data; do not trust that the caller will not modify.`,
    follow: [`How does {{Collections.unmodifiableList}} differ from {{List.copyOf}}?`, `Does a record automatically protect against mutable components?`, `What is leaking {{this}} and how can it break invariants?`]
  },
  'core-008': {
    q: `Distinguish static nested class and inner class. Why does inner class easily cause memory leaks?`,
    a: `**Summary:** static nested class does **not** hold a reference to the outer instance; inner (non-static) implicitly keeps {{this$0}}, so the inner object lives as long as the outer. By default use static nested; only use inner when you truly need access to the outer state.

### Basic differences
- **Static nested**: declared {{static class Foo}} inside the outer. No outer instance needed, no {{this$0}}, behaves like a top-level class (only different in name scope).
- **Inner (non-static)**: each instance is tied to an outer instance; compiler generates a field {{final Outer this$0}} and a constructor taking the outer. Can call outer fields/methods directly.
- **Local class**: declared inside a method, also holds a reference to the outer and captures effectively final local variables.
- **Anonymous class**: like local, holds outer and captured variables; commonly seen in listeners/callbacks.

~~~java
public class Service {
    private final Repo repo;

    static class CacheKey {            // does not hold Service
        final String id;
        CacheKey(String id) { this.id = id; }
    }

    class Worker {                     // implicitly holds Service.this
        void run() { repo.find(); }
    }
}
~~~

### Why leaks happen
- Registering an inner listener/callback in a long-lived registry (static list, singleton, thread pool, event bus). The registry holds the inner instance, the inner holds the outer, so the **entire service object** is not collected even after the business operation is done.
- In desktop/Android apps, inner classes holding Activity/Context are classic leaks; in backend, inner tasks holding large services with caches and connection pool references.
- Anonymous classes in {{ThreadLocal}} or scheduled tasks hold the outer similarly.
- Furthermore, the inner class prevents the outer object from being GC'd even if only a small callback remains; the actual kept size can be very large.

### How to avoid
- Default to {{static}} for nested classes; pass required dependencies through the constructor instead of accessing {{Outer.this}}.
- For listeners, hold the reference and **unregister** in {{close()}}/{{@PreDestroy}}; or use {{WeakReference}} for short-lived callbacks.
- For periodic tasks, use static nested + parameters, avoid capturing {{this}} unexpectedly.
- Verify with a heap dump (Eclipse MAT) looking for abnormal {{this$0}} references.

### When to use inner
- When the child object is truly part of the outer lifecycle and needs access to private state of the outer, e.g., {{Iterator}} of a collection ({{ArrayList.Itr}} is inner, accessing {{elementData}} and {{modCount}}).
- When you want the API {{outer.new Inner()}} to express a tight relationship. Otherwise static nested is clearer and safer.

> Senior tip: in code review, if a {{private class X}} does not use any field/method of the outer class, it should be changed to {{static}}; this also reduces one reference and makes serialization cleaner.`,
    follow: [`What field does the compiler generate for an inner class, and how does it affect serialization?`, `How can you detect an inner class memory leak with a heap dump?`, `When is it justified to use a non-static inner class instead of static nested?`]
  },
  'core-009': {
    q: `Java serialization: what is {{serialVersionUID}} for, what are the security risks of deserialization, and what should replace it?`,
    a: `**Summary:** {{serialVersionUID}} is the class "version" to avoid {{InvalidClassException}} when structure changes; Java deserialization on untrusted data can lead to **gadget chains causing RCE**, so modern systems prefer JSON/Protobuf/Avro, and if forced to use it, apply {{ObjectInputFilter}}.

### serialVersionUID
- If not declared, JVM computes it from the class signature (fields, methods, modifiers); adding one field changes the value and old data becomes unreadable.
- Explicitly declare {{private static final long serialVersionUID = 1L;}} to control compatibility.
- Change the version when altering **incompatibly** (removing fields, changing types); adding a new field is usually compatible and the new field receives its default value.
- Default serialization writes the **entire object graph** by class name; changing package/class name also breaks it.

### How it works
- {{Serializable}} is a marker; {{ObjectOutputStream}} writes metadata + non-{{transient}} fields; {{readObject}} restores **without calling the constructor** (except for non-Serializable parent classes).
- {{transient}} excludes fields from the stream; {{Externalizable}} allows full self-control.
- {{writeReplace}}/{{readResolve}} are used for singletons/proxies.

### Risks
- An attacker sends a byte stream containing a chain of existing classes (Apache Commons Collections, Spring, ROME...) creating a **gadget chain**: each {{readObject}} executes code, eventually calling {{Runtime.exec}}. Your own code does not even need a vulnerability.
- Deserialization happens **before** you can validate data, so validating fields does not help.
- Famous vulnerabilities (CommonsCollections, WebLogic, JBoss) all go through this path.

### Defenses
- **Do not accept Java serialization over network/HTTP**, even from internal services. Use JSON (Jackson), Protobuf, Avro, CBOR.
- If forced (RMI, old session), set an {{ObjectInputFilter}} whitelist of classes and limit depth/size (JEP 290, {{jdk.serialFilter}}), enable filters by context (JEP 415).
- Do not use {{ObjectInputStream}} on client-controlled cookies/sessions; if unavoidable, sign and encrypt.
- For distributed caches (Redis), do not use default Java serialization; use JSON/Protobuf to avoid both compatibility and security issues.

### Replacements
- DTO record + Jackson/Protobuf with clear schema, easy versioning, safer.
- For sessions, store JSON or use stateless tokens (JWT) instead of serializing objects.
- For internal snapshots, {{Externalizable}} is possible but still requires controlling the source.

> Senior tip: if your legacy system still uses Java serialization in Redis/session, treat it as a **P1 security debt**; set filters first, then migrate to JSON. Do not just increment {{serialVersionUID}} and feel safe — it has nothing to do with security.`,
    follow: [`Why does deserialization not call the constructor, and how does that affect immutability?`, `Where should {{ObjectInputFilter}} whitelist be configured in Spring Boot?`, `Which alternatives to Java serialization are recommended for session and cache?`]
  },
  'core-010': {
    q: `Reflection and annotation processing: what are the costs, where do frameworks use them, and what production pitfalls occur?`,
    a: `**Summary:** reflection allows inspecting and calling classes at runtime but is slower than direct calls (lookup, access checks, boxing, hard to inline); annotation processing runs at **compile** time and generates code, so it has almost zero runtime cost. Spring/Hibernate/Jackson use reflection; Lombok/MapStruct use annotation processing.

### Reflection
- APIs: {{Class.forName}}, {{getDeclaredFields}}, {{Method.invoke}}, {{Constructor.newInstance}}, {{setAccessible}}.
- Costs:
  - **Lookup** of method/field names on each call is very expensive; must cache {{Method}}/{{Field}}.
  - **Access checks** and boxing/unboxing for primitive parameters.
  - **Cannot be inlined** by JIT like direct calls; from Java 18 core reflection was rewritten on {{MethodHandle}} making it faster, but still not equal to static calls.
  - Class initialization, metadata loading, can increase startup time.
- {{MethodHandle}}/{{VarHandle}} are faster choices for hot paths; {{LambdaMetafactory}} turns reflective calls into functional interfaces once.
- Reflection breaks encapsulation: {{setAccessible(true)}} can be blocked by modules ({{InaccessibleObjectException}}) from Java 9/17; may require {{--add-opens}} (usually only temporary compatibility).

### How frameworks use them
- **Spring**: scans classes, reads annotations, creates proxies (CGLIB/JDK dynamic proxy), injects fields/constructors. Slow startup but runtime uses already-generated proxies.
- **Hibernate**: maps entities via metadata, uses bytecode enhancement/reflection to read fields, lazy proxies.
- **Jackson**: reads getters/constructors/record components for serialization; caches {{BeanDescription}} to reduce cost.
- **JUnit/Mockito**: creates instances, injects mocks, verifies calls.

### Annotation processing
- Runs inside {{javac}} via {{Processor}}; reads annotations and **generates source/bytecode** (or reports compile errors).
- **Lombok** intercepts AST via internal javac APIs, generating getters/setters/constructors into bytecode — convenient but fragile when JDK changes, controversial with tooling.
- **MapStruct** generates type-safe mappers at compile time, fast at runtime like hand-written code; **Dagger** generates the DI graph.
- Runtime cost = 0; build cost increases; needs processor configuration in Maven/Gradle and sometimes errors are hard to read when generated code is wrong.

### Production pitfalls
- Calling {{getMethods()}}/{{getDeclaredFields()}} in a request loop without caching: CPU spikes, GC increases.
- Using reflection to set private JDK fields: breaks on JDK upgrade (strong encapsulation), native image/AOT also does not support well.
- Reflection + {{setAccessible}} loses type checking; errors only explode at runtime.
- Slow startup due to overly broad scanning; consider AOT, CDS, or limiting package scan.
- With GraalVM native image, reflection needs configuration; libraries using dynamic reflection easily fail.

> Senior tip: cache reflection metadata in a {{ConcurrentHashMap}} or use {{MethodHandle}}; measure with JMH before deciding.`,
    follow: [`What are the costs of reflection lookup and why does caching help?`, `How does annotation processing differ from reflection in terms of runtime performance?`, `What production issues arise from broad classpath scanning and dynamic reflection?`]
  },
  'core-011': {
    q: `List the methods of {{Object}}. Should {{clone()}} be used, and how does it compare to a copy constructor?`,
    a: `**Summary:** {{Object}} provides {{equals}}, {{hashCode}}, {{toString}}, {{getClass}}, {{clone}}, {{finalize}}, and the {{wait}}/{{notify}}/{{notifyAll}} set; {{clone()}} works via {{Cloneable}} but has many traps, so prefer **copy constructor** or static factory.

### Object methods
- {{equals(Object)}}: compares references by default; override according to contract.
- {{hashCode()}}: default hash based on identity; must stay with {{equals}}.
- {{toString()}}: default {{ClassName@hex}}; override for readable logs but hide sensitive data.
- {{getClass()}}: returns the runtime {{Class}}; cannot be overridden; used for reflection and exact type comparison.
- {{clone()}}: protected native, creates a copy; only works if the class implements {{Cloneable}}, otherwise throws {{CloneNotSupportedException}}.
- {{finalize()}}: deprecated, do not use.
- {{wait()}}, {{wait(long)}}, {{wait(long,int)}}, {{notify()}}, {{notifyAll()}}: monitor coordination; must be called inside {{synchronized}} on the correct object, otherwise {{IllegalMonitorStateException}}.

### Problems with clone()
- **Shallow copy**: object fields still share references; to make it deep you must clone each field yourself — easy to miss.
- **Does not call constructor**: immutability/validation in the constructor is skipped; with final fields it is very hard to assign.
- **{{Cloneable}} is a strange marker**: has no methods; it only changes {{Object.clone}} behavior from throwing to copying fields.
- **Inheritance**: subclass must override to return the correct type; easy to return the wrong class or break contract.
- **Not type-safe**: {{clone()}} returns {{Object}} in many places, requiring casts.
- For arrays, {{clone()}} is safe and fast (shallow copy), but for complex objects it is not.

### Copy constructor / factory
- Copy constructor {{User(User other)}} is clear, type-safe, controls deep copy and keeps validation; inside assigns {{this.tags = List.copyOf(other.tags)}}.
- Static factory {{User.copyOf(u)}} is convenient for generics/collections.
- Record has a canonical constructor; to copy, use {{new User(r.id(), r.tags())}} or a compact constructor that auto-copies.
- For complex deep copy, use a mapper (MapStruct) or serialization via JSON (slow, only when needed).

### When to still use clone
- Copy primitive/object arrays in hot paths: {{int[] copy = arr.clone()}}.
- Old code / libraries that require it; when so, override {{clone()}} public, call {{super.clone()}}, then deep-copy mutable fields, and consider {{CloneNotSupportedException}}.

> Senior tip: in new codebases, do not implement {{Cloneable}}; use copy constructor or record. If forced to keep {{clone()}} for compatibility, write unit tests asserting the copy does **not share** collections/arrays with the original — this is where hidden bugs usually occur.`,
    follow: [`Why is {{Cloneable}} considered poor design in Effective Java?`, `How does {{wait}}/{{notify}} differ from {{Condition}} of {{ReentrantLock}}?`, `What are the dangers of shallow copy in clone implementations?`]
  },
  'collections-001': {
    q: `Explain the inside of {{HashMap}}: hash spreading, bucket, resize, load factor, and treeify from Java 8.`,
    a: `**Summary:** {{HashMap}} is an array of buckets ({{Node[] table}}); index = {{(n-1) & spread(hash)}}; when element count exceeds {{capacity * loadFactor}} it resizes by doubling; from Java 8 a bucket with ≥ 8 entries is converted to a red-black tree to avoid O(n) under heavy collision.

### Structure
- Default capacity 16, load factor 0.75; the table is **lazy initialized** on the first {{put}} (before that {{table == null}}).
- Each entry is a {{Node}} with {{hash}}, {{key}}, {{value}}, {{next}}. A bucket is a linked list.
- Capacity is always a power of 2 to use {{&}} instead of modulo.

### Hash spreading
~~~java
static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}
int index = (n - 1) & hash;          // n is capacity
~~~
- XOR the high 16 bits downward so high bits also participate in the index; without this, with small capacity only low bits are used, causing collisions easily.
- {{null}} key always goes to bucket 0, only one null key allowed.

### Resize
- When {{size > threshold}} (threshold = capacity * 0.75), {{resize}} is called: create a new array double the size, redistribute nodes.
- Java 8 optimization: each old bucket splits into **low** and **hi** based on the new hash bit, preserving relative order, without recalculating hash.
- Cost is O(n) each time; repeated resizes cause latency spikes. Therefore if the size is known in advance, initialize with appropriate capacity: {{new HashMap<>((int)(expected / 0.75f) + 1)}}.

### Treeify (Java 8)
- When a bucket has ≥ {{TREEIFY_THRESHOLD = 8}} nodes **and** capacity ≥ {{MIN_TREEIFY_CAPACITY = 64}}, the bucket becomes a {{TreeNode}} (red-black tree), lookup O(log n) instead of O(n).
- If capacity < 64, HashMap **resizes** instead of treeifying, because resize may shorten the bucket.
- When node count drops to ≤ {{UNTREEIFY_THRESHOLD = 6}}, it converts back to a linked list.
- Key comparison in the tree first uses {{hashCode}}; if equal, uses {{Comparable}} if implemented, otherwise {{tieBreakOrder}} (identity comparison) to keep the tree valid.
- Why threshold 8: with correct hash distribution the probability of a bucket reaching 8 is extremely small (~6e-8 with load factor 0.75); treeify is mainly to defend against hash flooding attacks.

### Key points to ask
- {{HashMap}} is not thread-safe: concurrent {{put}} can lose data; before Java 8 resize could even create infinite loops (a famous bug).
- From Java 8, resize no longer creates loops but is still not safe — need {{ConcurrentHashMap}} or external synchronization.
- {{containsKey}} and {{get}} are O(1) average; worst case O(log n) from Java 8 (with treeify), before that O(n).
- Key must have a stable {{hashCode}}; mutable keys make entries disappear.
- {{HashMap}} allows 1 null key and many null values; {{Hashtable}}/{{ConcurrentHashMap}} do not.

> Senior tip: set initial capacity for large maps (e.g., a config map of 100k entries) to avoid 10+ resizes at startup; and if you suspect hash flooding from user input, use keys with stable hashes and consider key encoding.`,
    follow: [`How does Java 8 split a bucket during resize without recalculating hashes?`, `What is the probability of treeify and why is the threshold 8?`, `Why is HashMap not thread-safe and what is the famous pre-Java-8 resize bug?`]
  }
});
