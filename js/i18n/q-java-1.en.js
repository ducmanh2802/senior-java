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
    q: `How should you design an exception hierarchy for a Spring service? Checked or unchecked, when to wrap, and how do you avoid swallowing errors?`,
    a: `**Summary:** use a base **unchecked** {{BusinessException}} that carries an {{errorCode}} for business errors, leave the framework's RuntimeExceptions untouched, wrap infrastructure errors with their {{cause}}, and map them to HTTP in exactly one place ({{@RestControllerAdvice}}).

### Checked vs unchecked
- **Checked** (extends {{Exception}}): the compiler forces you to handle it. It fits conditions that are **recoverable** and that the caller must decide about, for example {{IOException}} when reading a file, or {{InterruptedException}}. Downside: it clutters method signatures, is awkward inside lambda/stream code, and easily produces empty {{catch (Exception e)}} blocks.
- **Unchecked** (extends {{RuntimeException}}): programming errors, or business errors that cannot be recovered at the call site. Most modern services choose unchecked to keep their APIs clean; errors are handled centrally at the web layer.
- **Error** ({{OutOfMemoryError}}, {{StackOverflowError}}): do not catch and do not declare them; the JVM is in a state you cannot trust.

### A suggested hierarchy
~~~java
public class BusinessException extends RuntimeException {
    private final String code;                 // "ORDER_NOT_FOUND"
    public BusinessException(String code, String msg, Throwable cause) {
        super(msg, cause);                     // always keep the cause
        this.code = code;
    }
    public String getCode() { return code; }
}

public class NotFoundException extends BusinessException {
    public NotFoundException(String code, String msg) { super(code, msg, null); }
}
~~~

- The domain layer throws {{NotFoundException("ORDER_NOT_FOUND", ...)}}; the web layer maps the code to 404, 409 or 422.
- Do not expose stack traces or table/DB names in the response; log everything on the server and return a safe message to the client.
- Validation errors should aggregate several fields (a list of errors) instead of throwing one at a time.

### When to wrap
- Wrap when you add **business context** or change the error type for an upper layer: catch {{SQLException}} and then {{throw new RepositoryException(msg, e)}} to keep the cause and add context.
- Do not wrap when nothing is added — it only makes the stack longer and harder to read.
- Always pass the {{cause}}; never {{throw new RuntimeException(e.getMessage())}}, because the original stack is lost.
- Avoid **log then rethrow**: one error logged at 3 layers creates noise and extra cost. Pick one logging location (the advice, or the consumer boundary).

### Swallowing errors and try-with-resources
- {{catch (Exception e)}} with an empty body is an anti-pattern; at the very least log with context and make an explicit decision (ignore, retry, fallback).
- {{finally}} is for cleanup; for resources that implement {{AutoCloseable}}, use try-with-resources so an exception thrown while closing is attached to {{getSuppressed()}} instead of hiding the primary error.
- In async/CompletableFuture code the error lives inside the future; you must handle it with {{exceptionally}}/{{handle}} or log it in {{whenComplete}}, otherwise it disappears silently.

> Senior tip: keep {{errorCode}} in a stable enum/constant and never change the meaning of an old code; clients and monitoring often parse it. For 5xx errors, log a correlation id (a request id shared by every log line of the same request) and do not log the full payload when it contains personal data.`,
    follow: [`Why must you call {{Thread.currentThread().interrupt()}} when you catch {{InterruptedException}}?`, `How do the default {{@Transactional}} rollback rules differ for checked and unchecked exceptions?`, `How do you keep the {{cause}} without leaking internal details into the response?`]
  },
  'core-005': {
    q: `Distinguish {{final}}, {{finally}}, {{finalize}}. Why is {{finalize}} deprecated, and how do {{Cleaner}} / try-with-resources replace it?`,
    a: `**Summary:** {{final}} is a modifier (a reference that cannot be reassigned / a method that cannot be overridden / a class that cannot be extended), {{finally}} is a block that always runs when leaving a try, and {{finalize}} is a GC hook that is deprecated because it gives no timing guarantee, runs slowly and is dangerous; replace it with try-with-resources or {{Cleaner}}.

### final
- **Variable/field**: assigned once, the reference cannot change. For an object the content can still be mutable (a {{final List}} can still be {{add}}ed to).
- **Method**: cannot be overridden.
- **Class**: cannot be extended ({{String}}, {{Integer}}).
- Important for the **memory model**: a {{final}} field is "frozen" after the constructor, so other threads that read it see the correct value if the object is published safely. This is the foundation of immutable objects.
- A {{final}} local can be used inside a lambda/anonymous class (effectively final works the same way).

### finally
- Runs when the try exits normally, when an exception is thrown, and on {{return}}, {{break}}, {{continue}}.
- **Does not run** when the JVM dies: {{System.exit}}, {{Runtime.halt}}, a native crash, kill -9.
- A {{return}} inside {{finally}} **hides** an earlier exception/return — extremely dangerous, avoid it absolutely.

### finalize
- Called by the GC **before** reclaiming the object, with no timing guarantee, possibly never called, and it runs on a single finalizer thread, so it easily becomes a bottleneck.
- It can **resurrect** the object by assigning {{this}} to a static field — breaking assumptions about the lifecycle.
- It cannot throw a useful exception; exceptions thrown inside it are swallowed.
- From Java 18, finalization is **deprecated for removal** (JEP 421) and can be switched off with {{--finalization=disabled}}; {{Cleaner}} has been official since Java 9.
- Why it still exists: backward compatibility with old code and with some native libraries.

### Replacements
- **try-with-resources**: the standard way for any {{AutoCloseable}} resource (file, socket, JDBC). It closes in reverse order and attaches close-time exceptions to {{getSuppressed()}}.
- **Cleaner** ({{java.lang.ref.Cleaner}}): registers an action that runs when the object becomes phantom-reachable, meaning the GC has proven nothing can ever read it again. It is used for native resources that have no close API, but it still **does not guarantee** timing; it is only a safety net.
- For a direct {{ByteBuffer}}, use the JDK's internal {{Cleaner}} or try to reuse the buffer.

~~~java
try (var in = Files.newInputStream(path);
     var out = Files.newOutputStream(dest)) {
    in.transferTo(out);                  // closes automatically, even on error
}
~~~

> Senior tip: never put important business logic inside {{finalize}}. If you find {{finalize}} in an old codebase, replace it with {{AutoCloseable}} + try-with-resources first; keep {{Cleaner}} only for native resources.`,
    follow: [`Why can a {{return}} inside {{finally}} swallow an exception?`, `How does a {{final}} field help publish an object safely between threads?`, `How does {{Cleaner}} differ from {{finalize}}, and what limitations remain?`]
  },
  'core-006': {
    q: `How does type erasure affect generics? Explain wildcards and the PECS rule with {{? extends}} / {{? super}}.`,
    a: `**Summary:** generics are only checked at compile time and then **erased** from the bytecode; wildcards make APIs more flexible, and PECS means **Producer Extends, Consumer Super** — use {{? extends T}} when you read values out, {{? super T}} when you write values in.

### Type erasure
- {{List<String>}} and {{List<Integer>}} are the same {{List}} in bytecode; there is no {{new T()}}, no {{instanceof T}}, no array {{new T[]}}, and no overloading that differs only by type parameter.
- The compiler inserts **casts** and **bridge methods** to preserve polymorphism. For example {{Comparable}} has a {{compareTo(Object)}} bridge method that calls {{compareTo(MyType)}}.
- Consequence: generic types cannot be checked at runtime; {{List<String>}} suffers "heap pollution" if the wrong type is inserted through a raw type. {{@SafeVarargs}} is only the programmer's promise.
- Generic types are not fully visible to reflection, but they **still exist** in metadata ({{getGenericSuperclass}}, {{ParameterizedType}}) when declared on a class/field/method. Jackson exploits this through {{TypeReference}}.

### Why wildcards are needed
- Generics are **invariant**: {{List<Integer>}} is **not** a subtype of {{List<Number>}}, even though {{Integer}} is a subtype of {{Number}}. If it were allowed, we could {{add(3.14)}} to a list of Integer.
- Wildcards extend in one safe direction:

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

- {{? extends T}}: you can only read {{T}}, you **cannot** write (except {{null}}), because the compiler does not know the concrete subtype.
- {{? super T}}: you can write {{T}}, but reading only gives {{Object}}.
- {{?}} = {{? extends Object}}: you can read Object, but you cannot write.

### Applying PECS
- {{Collections.copy(List<? super T> dest, List<? extends T> src)}} is the classic example.
- An API that takes a collection only to read it: use {{Collection<? extends T>}} so it also accepts {{List<Sub>}}.
- An API that only writes: {{Consumer<? super T>}}.
- For return types use the concrete type, not a wildcard (unless you want to hide the implementation).
- {{Comparable<? super T>}} allows comparison with a supertype.

### Pitfalls
- A raw type ({{List}} without a parameter) disables compile-time checks, produces warnings, and can blow up with {{ClassCastException}} somewhere else.
- You cannot create a generic array: {{new List<String>[10]}} is invalid; use {{List<List<String>>}} or {{Array.newInstance}} plus a controlled cast.
- {{List<Object>}} does not accept {{List<String>}}; {{List<?>}} accepts it but nothing can be added.

> Senior tip: when designing a library API, use wildcards on the **input** so callers can pass more types; do not overuse wildcards on the return type because it forces callers to deal with a useless {{?}}. And remember that generics cost 0 at runtime — only bridge methods and a small cast.`,
    follow: [`Why can you not write {{new T[]}} or {{new List<String>[10]}}?`, `What is a bridge method for, and how does it affect reflection?`, `When should you use {{List<?>}} instead of {{List<Object>}}?`]
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
    q: `Distinguish a static nested class from an inner class. Why does an inner class easily cause a memory leak?`,
    a: `**Summary:** a static nested class does **not** hold a reference to the outer instance; an inner (non-static) class implicitly keeps {{this$0}}, so as long as the inner object is alive the outer object is alive too. So default to a static nested class and use an inner class only when you truly need to access the outer state.

### Basic differences
- **Static nested**: declared as {{static class Foo}} inside the outer class. It needs no outer instance, has no {{this$0}}, and works like a top-level class (only its name scope differs).
- **Inner (non-static)**: every instance is bound to one outer instance; the compiler generates a {{final Outer this$0}} field and a constructor that takes the outer instance. It can call the outer fields/methods directly.
- **Local class**: declared inside a method; it also keeps a reference to the outer instance and captures effectively final local variables.
- **Anonymous class**: like a local class, it keeps the outer instance and the captured variables; you commonly see it in listeners/callbacks.

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

### Why the leak happens
- You register an inner listener/callback in a long-lived registry (a static list, a singleton, a thread pool, an event bus). The registry holds the inner object, the inner object holds the outer object, so the **whole service object** is never collected even though the business operation has finished.
- In desktop/Android apps, an inner class holding an Activity/Context is the classic leak; in the backend, an inner task holds the whole large service, including its caches and connection pool references.
- An anonymous class stored in a {{ThreadLocal}} or used as a scheduled task holds the outer object in the same way.
- On top of that, the inner class keeps the outer object from being GC'd even when only a tiny callback remains; the real amount of memory retained can be very large.

### How to avoid it
- Default to {{static}} for nested classes; pass the dependencies you need through the constructor instead of reaching for {{Outer.this}}.
- For listeners, keep the reference and **unregister** in {{close()}}/{{@PreDestroy}}; or use a {{WeakReference}} for short-lived callbacks.
- For periodic tasks, use a static nested class plus parameters and avoid capturing {{this}} by accident.
- Check with a heap dump (Eclipse MAT) and look for unexpected {{this$0}} references pointing back.

### When an inner class is justified
- When the child object really is part of the outer object's lifecycle and needs to read the outer object's private state, for example a collection's {{Iterator}} ({{ArrayList.Itr}} is an inner class that accesses {{elementData}} and {{modCount}}).
- When you want the {{outer.new Inner()}} API to express a tight relationship. Otherwise a static nested class is clearer and safer.

> Senior tip: in code review, a {{private class X}} that uses no field/method of the outer class is a signal to make it {{static}}; this also removes one reference and makes serialization cleaner.`,
    follow: [`What field does the compiler generate for an inner class, and how does that field affect serialization?`, `How do you detect a memory leak caused by an inner class with a heap dump?`, `Why is {{ArrayList}}'s {{Iterator}} a legitimate inner class?`]
  },
  'core-009': {
    q: `Java serialization: what is {{serialVersionUID}} for, what are the security risks of deserialization, and what should you replace it with?`,
    a: `**Summary:** {{serialVersionUID}} is the class "version" that prevents {{InvalidClassException}} when the structure changes; deserializing untrusted Java data can be exploited with a **gadget chain that leads to RCE (remote code execution)**, so modern systems prefer JSON/Protobuf/Avro, and if you are forced to use Java serialization you must add an {{ObjectInputFilter}}.

### serialVersionUID
- If you do not declare it, the JVM computes it from the class signature (fields, methods, modifiers); adding a single field changes the value and old data can no longer be read.
- Declare it explicitly: {{private static final long serialVersionUID = 1L;}} so you control compatibility.
- Bump the version when you make an **incompatible** change (removing a field, changing a type); adding a new field is usually compatible and the new field receives its default value.
- Default serialization writes the **whole object graph** by class name; renaming the package/class also breaks it.

### How it works
- {{Serializable}} is a marker; {{ObjectOutputStream}} writes metadata plus the non-{{transient}} fields; {{readObject}} restores the object **without calling the constructor** (except for non-Serializable parent classes).
- {{transient}} removes a field from the stream; {{Externalizable}} lets you control everything yourself.
- {{writeReplace}}/{{readResolve}} are used for singletons/proxies.

### Risks
- An attacker sends a byte stream containing a chain of classes that already exist on your classpath (Apache Commons Collections, Spring, ROME...), forming a **gadget chain**: each {{readObject}} executes code and eventually calls {{Runtime.exec}} (start a process). There does not need to be any bug in your own code.
- Deserialization happens **before** you can validate the data, so validating fields cannot save you.
- Famous vulnerabilities (CommonsCollections, WebLogic, JBoss) all travel through this path.

### Defenses
- **Do not accept Java serialization over the network/HTTP**, even from internal services. Use JSON (Jackson), Protobuf, Avro or CBOR.
- If you are forced to (RMI, an old session store), set an {{ObjectInputFilter}} whitelist of allowed classes and limit depth/size (JEP 290, {{jdk.serialFilter}}), and enable filters per context (JEP 415).
- Do not use {{ObjectInputStream}} on cookies/sessions controlled by the client; if you must, sign and encrypt them.
- For distributed caches (Redis), do not use Java serialization by default; use JSON/Protobuf to avoid both compatibility and security problems.

### Replacements
- DTO records plus Jackson/Protobuf give a clear schema, are easy to version and are safer.
- For sessions, store JSON or use stateless tokens (JWT) instead of serializing objects.
- For internal snapshots you can use {{Externalizable}}, but you still need to control where the bytes come from.

> Senior tip: if a legacy system still uses Java serialization for Redis/session, treat it as a **P1 security debt**; install filters first, then migrate to JSON. Do not just bump {{serialVersionUID}} and feel safe — it has nothing to do with security.`,
    follow: [`Why does deserialization not call the constructor, and how does that affect immutability?`, `Where should the {{ObjectInputFilter}} whitelist be configured in Spring Boot?`, `When is {{transient}} mandatory rather than just an optimization?`]
  },
  'core-010': {
    q: `Reflection and annotation processing: what do they cost, where do frameworks use them, and which pitfalls show up in production?`,
    a: `**Summary:** reflection lets you inspect and call classes at runtime but is slower than a direct call (method lookup, access checks, boxing, and it cannot be inlined); annotation processing runs at **compile time** and generates code, so it costs almost nothing at runtime. Spring/Hibernate/Jackson use reflection; Lombok/MapStruct use annotation processing.

### Reflection
- API: {{Class.forName}}, {{getDeclaredFields}}, {{Method.invoke}}, {{Constructor.newInstance}}, {{setAccessible}}.
- Costs:
  - **Lookup** of the method/field name on every call is very expensive; you must cache the {{Method}}/{{Field}}.
  - **Access checks** plus boxing/unboxing of primitive arguments.
  - It **cannot be inlined** by the JIT the way a direct call can; since Java 18 core reflection has been rewritten on top of {{MethodHandle}} and is faster than before, but it is still not equal to a static call.
  - Class initialization and metadata loading can increase startup time.
- {{MethodHandle}}/{{VarHandle}} are the faster choice for hot paths; {{LambdaMetafactory}} turns a reflective call into a functional interface once.
- Reflection breaks encapsulation: {{setAccessible(true)}} can be blocked by the module system ({{InaccessibleObjectException}}) since Java 9/17; you may need {{--add-opens}} (usually only as a temporary compatibility measure).

### How frameworks use it
- **Spring**: scans classes, reads annotations, creates proxies (CGLIB, a library that generates subclasses at runtime, or the JDK dynamic proxy), and injects fields/constructors. Startup is slow but at runtime it uses the proxies it already generated.
- **Hibernate**: maps entities from metadata, uses bytecode enhancement or reflection to read fields, and creates lazy proxies.
- **Jackson**: reads getters/constructors/record components to serialize; it caches a {{BeanDescription}} to reduce the cost.
- **JUnit/Mockito**: creates instances, injects mocks, verifies calls.

### Annotation processing
- Runs inside {{javac}} through a {{Processor}}; it reads annotations and **generates source code/bytecode** (or reports a compile error).
- **Lombok** manipulates the compiler's internal AST (the syntax tree javac builds while parsing) through internal javac APIs and generates getters/setters/constructors into the bytecode — convenient but fragile when the JDK changes, and controversial with tooling.
- **MapStruct** generates type-safe mappers at compile time, so runtime is as fast as hand-written code; **Dagger** generates the DI graph.
- Runtime cost = 0; build cost goes up; you need processor configuration in Maven/Gradle, and errors are sometimes hard to read when generated code is wrong.

### Production pitfalls
- Calling {{getMethods()}}/{{getDeclaredFields()}} inside a request loop without caching: CPU spikes and more GC.
- Using reflection to set private JDK fields: it breaks when you upgrade the JDK (strong encapsulation), and native image/AOT does not support it well either.
- Reflection + {{setAccessible}} loses type checking, so errors only explode at runtime.
- Slow startup because of an overly broad scan; consider AOT, CDS (class data sharing, a JVM feature that loads pre-processed classes faster) or limiting the scanned packages.
- With GraalVM native image (an ahead-of-time compiled binary), reflection needs configuration; libraries that use dynamic reflection easily fail.

> Senior tip: cache reflection metadata in a {{ConcurrentHashMap}} or use {{MethodHandle}}; measure with JMH (the Java Microbenchmark Harness) before optimizing. And do not use reflection for everyday business logic — keep it in the infrastructure/framework layer.`,
    follow: [`Why is {{Method.invoke}} slower than a direct call, and what does {{MethodHandle}} improve?`, `How does strong encapsulation since Java 17 affect older libraries?`, `How does annotation processing differ from runtime annotations?`]
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
