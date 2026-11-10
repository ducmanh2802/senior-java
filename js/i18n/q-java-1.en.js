/*
 * English translation of js/data/q-java.js — task T159 (updated T1175). Format: js/core/i18n.js (content overlay).
 * ids: core-001 core-002 core-003 core-004 core-005 core-006 core-007 core-008 core-009 core-010 core-011 collections-001
 */
App.i18n.content({
  'core-001': {
    q: `What is the contract between {{equals()}} and {{hashCode()}}? What happens if it is violated?`,
    a: `**Summary:** {{equals()}} answers "should two objects be considered equal?" while {{hashCode()}} returns an integer used to place the object into a "bucket" in a hash table (a fast lookup data structure such as {{HashMap}}/{{HashSet}}). Contract: if {{a.equals(b)}} is {{true}}, then {{a.hashCode() == b.hashCode()}} must hold; the reverse is not required - equal {{hashCode}} values do not imply {{equals}} (this is called a collision). Violating the contract makes {{HashMap}}/{{HashSet}} look in the wrong place, return {{false}} even when an element exists, or contain duplicates.

### What, why, and how it works internally
- **What is {{equals()}}?** A method in {{java.lang.Object}} that compares two objects for business equality. By default (in {{Object}}) it compares reference identity (like {{==}}), so a class that defines equality by meaning (for example, two {{User}} objects with the same id) must override it.
- **What is {{hashCode()}}?** It returns an {{int}}. {{HashMap}} uses this number to compute the bucket index, typically {{index = (n - 1) & hash}} where {{n}} is the number of buckets. Objects whose hash maps to the same index land in the same bucket; inside the bucket {{HashMap}} then calls {{equals()}} to distinguish them.
- **Why must they go together?** {{HashMap.get(key)}} does two steps: (1) use the key's {{hashCode}} to jump directly to a bucket - very fast, O(1) on average; (2) a bucket may contain several colliding entries, so it scans and calls {{equals}} to find the exact key. If you override {{equals}} but forget {{hashCode}}, two keys that are "equal" by {{equals}} may return different hashes -> they land in two different buckets -> step (1) looks in the wrong place -> {{get}}/{{contains}} return {{null}}/{{false}} even though the entry is actually in the map.

### Contract details (remember when overriding)
| Rule | Meaning |
|---|---|
| Reflexive | {{x.equals(x)}} is always {{true}} |
| Symmetric | {{x.equals(y)}} == {{y.equals(x)}} |
| Transitive | if x=y and y=z then x=z |
| Consistent | multiple calls return the same result if data does not change |
| Null comparison | {{x.equals(null)}} is always {{false}} |
| Hash relation | {{equals}} true => {{hashCode}} values are equal |

### Real-world production example
Assume a login-session service uses {{HashSet<SessionToken>}} (a set with no duplicates) to check active tokens, ~50,000 tokens and ~3,000 lookups per second. A developer creates {{SessionToken}} with a {{value}} field and overrides {{equals}} to compare {{value}}, but forgets to override {{hashCode}} (so it uses the {{Object}} default based on memory address). Result: the same token string becomes two different Java objects -> default {{hashCode}} differs -> {{set.contains(newToken)}} returns {{false}} even though the valid token is already in the set. Symptoms: users are logged out randomly and the 401 error rate rises from ~0.1% to ~8% after deployment. Investigation: logs show the token "not found" but a DB query confirms it is still valid; a unit test {{set.add(t1); assert set.contains(new Token(t1.value));}} fails. Fix: add {{hashCode()}} using {{Objects.hash(value)}} (the same fields as {{equals}}), or switch to {{record SessionToken(String value)}} (Java 16+, records generate a correct {{equals}}/{{hashCode}} pair). Outcome: 401 errors return to normal, token lookup p99 stays < 1 ms.

~~~java
// BAD: overrides equals, forgets hashCode -> violates contract
class UserKey {
    final String id;
    UserKey(String id) { this.id = id; }
    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserKey k)) return false;
        return Objects.equals(id, k.id);
    }
    // missing hashCode!
}
// GOOD: record (Java 16+) - generates both, immutable
record UserKey(String id) {}
// GOOD: manual, use the same fields as equals
@Override public int hashCode() { return Objects.hash(id); }
~~~

### Production pitfalls
- **Mutable key:** use an object with changeable fields as a {{HashMap}} key and modify it after {{put}} -> {{hashCode}} changes, the entry "disappears" (cannot {{get}} it and it is hard to {{remove}}), causing a logical leak. Only use **immutable** keys such as {{String}}, {{Integer}}, or a {{record}} whose components are immutable.
- **{{hashCode}} returns a constant:** still satisfies the contract but every key lands in one bucket -> lookups become O(n) and performance collapses on large data.
- **Wrong fields:** {{equals}} compares {{id}} but {{hashCode}} uses {{name}} -> two keys with the same {{id}} (equals true) may have different hashes.

### Sample interview answer
"Equals and hashCode are a mandatory contract pair when using HashMap or HashSet. Equals decides whether two objects are business-equal, while hashCode returns an integer that HashMap uses to compute the bucket - basically choosing a slot for a fast lookup. The most important rule is: if two objects are equal by equals, their hashCodes must be equal, because HashMap searches by hashCode first and only then calls equals inside the bucket. If I override equals but forget hashCode, two equal keys can land in different buckets, so contains returns false even though the element is in the map - I have seen this cause users to be logged out randomly because a valid token was not found in the set. The safest approach is to use a record so Java generates both, or to use Objects.hash on exactly the fields that participate in equals. One more point: a key put into a HashMap must be immutable; if you change a field that affects hashCode, the entry will disappear."

> Senior tip: for JPA entities, do not use a generated id ({{@GeneratedValue}}) in {{hashCode}} because the id is {{null}} before persist - the hashCode changes after save and the entity gets "lost" in a {{HashSet}}. Use a stable business key, or return a constant per class (accepting more collisions in exchange for correctness). Always write a test: {{add}} then {{contains(new SameKey(...))}} must be {{true}}.`,
    follow: [`Why does {{hashCode}} returning a constant satisfy the contract but remain a bad idea?`, `How do you implement {{equals}} for a class with inheritance without breaking symmetry?`]
  },
  'core-002': {
    q: `Why is {{String}} immutable and final? How does the String pool work, and when should {{intern()}} be used?`,
    a: `**Summary:** {{String}} is immutable for safety (threading, security, use as a key), and the pool is a shared memory area for identical literals to save heap; {{intern()}} moves a runtime string into the pool and returns the canonical instance.

### Inside String
- The class is declared {{public final class String}}, so it cannot be subclassed to break immutability.
- From Java 9, data lives in {{private final byte[] value}} with a {{byte coder}} (Compact Strings): Latin-1 strings use 1 byte per character, strings with non-Latin-1 characters use UTF-16. Before Java 9 it was {{char[]}}.
- Every "change" such as {{concat}}, {{substring}}, or {{replace}} creates a new object. There is no setter and no exposed internal array.

### Why it must be immutable
- **Free thread-safety:** many threads can read the same object without a lock because its state never changes.
- **Safe as a key:** {{hashCode}} is cached in the {{hash}} field (computed on first use); if the string could change, an entry in a {{HashMap}} would be lost.
- **Security:** file paths, URLs, class names, and SQL strings are passed to sensitive APIs; if the receiver keeps a reference and the content is modified after validation (TOCTOU - time-of-check to time-of-use), a vulnerability appears.
- **Sharing and optimization:** the pool, the old {{substring}} behavior no longer shares the backing array (changed from Java 7u6 to prevent leaks), and the JIT can optimize better.

### String pool
- A literal {{"hello"}} is resolved at class load time and placed in the **string pool** (from Java 7 it lives on the heap, not in PermGen).
- {{new String("hello")}} creates a new object on the heap; the literal inside is still taken from the pool.
- {{==}} compares references, {{equals}} compares content.
- {{intern()}} looks up the pool: if an equal string exists it returns the pool instance, otherwise it adds the string and returns it. From Java 7, strings not in the pool can be garbage-collected when nothing references them.

~~~java
String a = "hello";                  // pool
String b = new String("hello");      // heap, different reference
System.out.println(a == b);          // false
System.out.println(a == b.intern()); // true
String c = ("hel" + "lo");           // compile-time constant => pool
System.out.println(a == c);          // true
~~~

### Production pitfalls
- Concatenating strings in a loop with {{+}} creates thousands of intermediate objects; use {{StringBuilder}} for loops and {{String.join}} for collections.
- Concatenating in {{toString()}} of an entity in hot logs also creates garbage; consider parameterized logging.
- {{intern()}} on non-repeating data (for example, a UUID per request) inflates the pool; only use it when you know the value set is small and repeats often.

### Inside the String pool: a fixed-bucket hash table
The String pool is an **internal JVM hash table** (StringTable) with a fixed number of buckets set at startup ({{-XX:StringTableSize}}, default 65,536 from Java 11). Each {{intern()}} call must compute a hash and scan strings in the bucket. Putting millions of different strings into the pool makes each bucket longer, {{intern()}} gets slower, and the GC must scan this table. That is why {{intern()}} only fits a **small, frequently repeated** value set (currency codes, country codes, status names).
G1's **String Deduplication** is a different approach: the GC detects Strings with identical {{byte[]}} arrays and makes them **share the array** (the String objects remain separate), without code changes, running in the background.

### Real-world production example
A service aggregating transactions loads 8 million records into a cache, each with {{currency}}, {{status}}, and {{channel}} fields read from JSON -> each parse creates new Strings even though there are only a few dozen distinct values. A heap dump (Eclipse MAT) shows about 1.4 GB of byte arrays with duplicate content. The team maps those three fields to **enums** during parsing (best option), and for {{merchantCategory}} (about 600 values) uses {{intern()}}. Heap after GC drops from 4.1 GB to 2.5 GB and hourly Full GCs disappear. Another team tried to {{intern()}} {{transactionId}} (unique per record) -> StringTable ballooned and parse time increased 30% - it had to be removed.

### Sample interview answer
"String is immutable for several reasons. It is widely shared, so immutability makes it thread-safe without locks. Its hashCode is cached, so String is safe as a HashMap key. For security, a validated path or SQL string cannot be modified afterwards. And immutability is what makes sharing through the string pool possible. The class is final so nobody can subclass it to break immutability. From Java 9, String stores data in a byte array with a coder, so Latin-1 strings use one byte per character. Literals go into the pool, an internal JVM hash table on the heap; intern returns the canonical pool instance. I only use intern for small, repeated value sets; when the heap has many duplicate strings, I prefer enums or enabling G1 String Deduplication instead of calling intern broadly."

> Senior tip: for services with many repeated strings, enable {{-XX:+UseStringDeduplication}} (G1) and monitor {{-XX:+PrintStringTableStatistics}}; do not call {{intern()}} excessively because it touches an internally locked table.`,
    follow: [`Why is string concatenation with {{+}} in a loop slower than {{StringBuilder}}?`, `If {{String}} allowed inheritance, which immutability guarantees would be broken?`, `Does {{substring()}} still keep the original array from Java 7 onward, and why does that change matter?`]
  },
  'core-003': {
    q: `Java is always pass-by-value - explain this when passing an object reference into a method.`,
    a: `**Summary:** Java copies the **parameter value** when calling a method. For an object, the copied value is the **reference**, so the method can modify the object's contents but cannot change which object the caller's variable points to.

### What happens on the stack
- Each method call creates a new frame; parameters are local variables in that frame.
- For primitives, the copy is the numeric value. Modifying it inside the method does not affect the caller.
- For objects, the caller's variable and the parameter are **two different variables** pointing to the same object on the heap. Therefore:
  - Calling a method on the object ({{list.add}}, {{sb.append}}) lets the caller see the change.
  - Reassigning the parameter ({{param = other}}) only changes the local variable; the caller still points to the old object.

~~~java
static void reassign(StringBuilder sb) {
    sb = new StringBuilder("new");     // only changes the local variable
}
static void mutate(StringBuilder sb) {
    sb.append(" added");                // modifies the shared object
}

StringBuilder x = new StringBuilder("orig");
reassign(x);
System.out.println(x);                 // orig
mutate(x);
System.out.println(x);                 // orig added
~~~

### Interview consequences
- There is no "pass-by-reference" like C++ in Java. You cannot write {{swap(a, b)}} to swap the caller's variables.
- To return multiple values: return an object/record, use a one-element array, or {{AtomicReference}} (but a record is usually clearest).
- Passing an array is also passing a reference: if the method modifies elements, the caller sees it; if it assigns a new array, the caller does not.
- When an API receives a mutable collection/array/date, make a **defensive copy** at the boundary if you want to preserve immutability; otherwise the caller can modify data after you validate it.

### Link to immutability
- Because the reference is copied, not the object, passing an object into a method does not create a copy. This is why classes like {{String}}, {{LocalDate}}, and records should be immutable: safe sharing without copying.
- Conversely, sharing mutable {{Date}} or {{ArrayList}} across layers easily creates hard-to-trace "data changed by itself" bugs.

### Inside: how the JVM passes parameters
When calling a method, the JVM creates a **new frame** on the thread's stack and **copies** the arguments into that frame's local-variable array (bytecodes like {{aload}}/{{iload}} read from it). For an object, what gets copied is the **reference** - a pointer to the object on the heap (4 bytes with compressed oops). Two frames hold two different variables containing the same pointer. Therefore:
- {{param.setX()}} follows the pointer to the heap object -> the caller sees it.
- {{param = new X()}} overwrites only the local-variable slot in the new frame -> the caller's frame is untouched.
This is why Java cannot have {{swap(a, b)}} like C++ (which passes a reference to the variable itself), and why lambdas may only capture **effectively final** variables: the lambda receives a copy of the value, so if the original changed later, the two would diverge.

### Real-world production example
A pricing service has {{applyRules(List<Item> items)}} - a developer "filters" by calling {{items.removeIf(...)}} inside the method, thinking they are working on a copy. The original cart list (kept by the controller to compute the total afterwards) loses items that did not receive a promotion -> invoices were short by about 0.7% of orders in one day before reconciliation found it. Fix: the method accepts data and returns a **new list** ({{items.stream().filter(...).toList()}}), cart DTOs become records with {{List.copyOf}} in the constructor. Code review adds a rule: do not modify a collection received as a parameter unless the method name makes that explicit.

### Sample interview answer
"Java always passes by value. When a method is called, the JVM creates a new frame and copies the parameter values into the local variables of that frame. For primitives it copies the number. For objects it copies the reference - the pointer to the object on the heap. So if the method calls something that mutates the object, like adding to a list, the caller sees it because both point to the same object. But if the method assigns the parameter to a different object, only the local variable changes and the caller still points to the old one. The practical consequence is to be careful with mutable collections or objects: I do not modify a caller's collection, and at class boundaries I use List.copyOf or immutable records to avoid data changing unexpectedly."

> Senior tip: in code review, a public method that takes a {{List}} and stores it directly in a field is a sign it needs {{List.copyOf}}; seeing {{param = ...}} inside a method is almost certainly a bug from misunderstanding pass-by-value.`,
    follow: [`Write a {{swap}} method for two {{Integer}} values - why is it impossible?`, `If you pass a {{List}} to a method and do {{list = new ArrayList<>()}} inside, does it affect the caller?`, `Should defensive copy go in the constructor, the getter, or both?`]
  },
  'core-004': {
    q: `How should you design an exception hierarchy for a Spring service? Checked or unchecked, when to wrap, and how do you avoid swallowing errors?`,
    a: `**Summary:** use a base **unchecked** {{BusinessException}} carrying an {{errorCode}} for business errors, leave framework RuntimeExceptions alone, wrap infrastructure errors while keeping the {{cause}}, and map to HTTP in a single place ({{@RestControllerAdvice}}).

### Checked vs unchecked
- **Checked** (extends {{Exception}}): the compiler forces handling. Fits **recoverable** conditions that the caller must decide about, for example {{IOException}} when reading a file or {{InterruptedException}}. Downsides: pollutes signatures, is awkward in lambdas/streams, and encourages empty {{catch (Exception e)}} blocks.
- **Unchecked** (extends {{RuntimeException}}): programming errors or business errors that cannot be recovered at the call site. Most modern services choose unchecked to keep APIs clean; errors are handled centrally at the web layer.
- **Error** ({{OutOfMemoryError}}, {{StackOverflowError}}): do not catch or declare; the JVM is in an untrustworthy state.

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

- The domain layer throws {{NotFoundException("ORDER_NOT_FOUND", ...)}}; the web layer maps the code to 404, 409, or 422.
- Do not expose stack traces or table/DB names in responses; log full details on the server and return a safe message to the client.
- Validation errors should aggregate multiple fields (a list of errors), not throw one by one.

### When to wrap
- Wrap when you add **business context** or change the error type for an upper layer: catch {{SQLException}} then {{throw new RepositoryException(msg, e)}} to keep the cause and add context.
- Do not wrap if you add no information - it only makes the stack longer and harder to read.
- Always pass the {{cause}}; do not {{throw new RuntimeException(e.getMessage())}} because it loses the original stack.
- Avoid **log-and-rethrow**: the same error logged at 3 layers creates noise and cost. Pick one logging location (the advice or the consumer boundary).

### Swallowing errors and try-with-resources
- {{catch (Exception e)}} that does nothing is an anti-pattern; at minimum log with context and make an explicit decision (ignore, retry, fallback).
- {{finally}} is for cleanup; for resources implementing {{AutoCloseable}} use try-with-resources so a close-time exception is attached to {{getSuppressed()}} instead of hiding the main error.
- In async/CompletableFuture code the error lives inside the future; you must {{exceptionally}}/{{handle}} or log in {{whenComplete}}, otherwise it disappears silently.

### Inside: the cost of exceptions
Creating an exception is expensive mainly at **{{fillInStackTrace()}}** - the JVM walks the entire stack (often 100-200 frames in a Spring app) to record the trace. Throwing and catching is much cheaper. Therefore:
- Use exceptions for **exceptional** flows, not for normal control flow (for example, throwing {{NotFoundException}} on every cache miss in a hot loop).
- For a business error that occurs very frequently and does not need a stack trace, you can use {{RuntimeException(msg, cause, enableSuppression, writableStackTrace=false)}} - but only after measuring and only when truly needed.
- Spring {{@Transactional}} by default **rolls back on unchecked** and **does not roll back on checked** - a practical reason to make business errors unchecked, or to declare {{rollbackFor}} explicitly.

### Real-world production example
A booking service returned 500 "Internal Server Error" for every case - including "slot already taken" - because {{SlotTakenException extends Exception}} (checked) was wrapped as {{RuntimeException(e.getMessage())}} across 4 layers. Consequences: the mobile app could not distinguish errors to show the right UI, logs lost the original stack, and in one branch a checked exception did not trigger rollback, leaving ~300 orphan "hold" rows per day. Redesign: an unchecked {{BusinessException}} with a {{code}}, a single {{@RestControllerAdvice}} mapping to 409/422 with ProblemDetail, logging once at the advice with a traceId. 500 errors dropped 85% (the rest were real failures) and orphan rows went to 0.

### Sample interview answer
"In a Spring service I use a base unchecked exception, for example BusinessException carrying a stable error code, for business errors like not found or conflict. I choose unchecked because signatures stay clean, it works in lambdas, and Spring rolls back transactions on unchecked by default. Infrastructure errors like SQLException are wrapped only when I can add context, always keeping the cause. All HTTP mapping lives in a single @RestControllerAdvice that returns a ProblemDetail with the code and never exposes stack traces or table names. To avoid swallowing errors, I ban empty catches, log only once at the boundary with a traceId instead of logging and rethrowing at every layer, and for CompletableFuture I always handle errors with handle or exceptionally."

> Senior tip: keep {{errorCode}} stable in an enum/constant and never change the meaning of an old code; clients and monitoring often parse it. For 5xx errors, log a correlation id and do not log the full payload if it contains personal data.`,
    follow: [`Why must you call {{Thread.currentThread().interrupt()}} when catching {{InterruptedException}}?`, `How do {{@Transactional}} default rollback rules differ for checked and unchecked exceptions?`, `How do you keep the {{cause}} without leaking internal details in the response?`]
  },
  'core-005': {
    q: `Distinguish {{final}}, {{finally}}, and {{finalize}}. Why is {{finalize}} deprecated, and how do {{Cleaner}}/try-with-resources replace it?`,
    a: `**Summary:** {{final}} is a modifier (a reference that cannot change / a method that cannot be overridden / a class that cannot be extended), {{finally}} is a block that always runs when leaving a try, and {{finalize}} is a GC hook deprecated because it has no timing guarantee, runs slowly, and is dangerous; replace it with try-with-resources or {{Cleaner}}.

### final
- **Variable/field:** assigned once, the reference cannot change. For an object, the contents can still be mutable (a {{final List}} can still be {{add}}ed to).
- **Method:** cannot be overridden.
- **Class:** cannot be extended ({{String}}, {{Integer}}).
- Important for the **memory model:** a {{final}} field is "frozen" after the constructor, so other threads see the correct value if the object is published safely. This is the foundation of immutable objects.
- A {{final}} local variable can be used in a lambda/anonymous class (effectively final works the same way).

### finally
- Runs when the try exits normally, on an exception, and on {{return}}, {{break}}, or {{continue}}.
- **Does not run** when the JVM dies: {{System.exit}}, {{Runtime.halt}}, a native crash, or kill -9.
- A {{return}} inside {{finally}} **hides** a previous exception/return - extremely dangerous, avoid it absolutely.

### finalize
- Called by the GC **before** reclaiming the object, with no timing guarantee, possibly never, and it runs on a single finalizer thread so it easily becomes a bottleneck.
- It can **resurrect** an object by assigning {{this}} to a static field - breaking lifecycle assumptions.
- It cannot throw useful exceptions; exceptions are swallowed.
- From Java 18, finalization is **deprecated for removal** (JEP 421) and can be disabled with {{--finalization=disabled}}; {{Cleaner}} has been the official alternative since Java 9.
- Why it still exists: backward compatibility with old code and some native libraries.

### Replacements
- **try-with-resources:** the standard way for any {{AutoCloseable}} resource (file, socket, JDBC). It closes in reverse order and attaches close-time exceptions to {{getSuppressed()}}.
- **Cleaner** ({{java.lang.ref.Cleaner}}): registers an action that runs when the object becomes phantom-reachable; used for native resources with no close API, but it still **does not guarantee** timing - it is only a safety net.
- For a direct {{ByteBuffer}}, use the JDK's internal {{Cleaner}} or try to reuse the buffer.

~~~java
try (var in = Files.newInputStream(path);
     var out = Files.newOutputStream(dest)) {
    in.transferTo(out);                  // closes automatically, even on error
}
~~~

### Inside: why finalize slows the GC
An object with a non-trivial {{finalize()}} is registered by the JVM at **creation** time (a {{Finalizer}} reference). When the object becomes unreachable, the GC **does not reclaim it immediately** but enqueues it; a single **finalizer thread** calls {{finalize()}} sequentially; only after the **next** GC cycle can the memory be freed. Consequences: the object survives at least two GC cycles and is often promoted to Old Gen; if {{finalize()}} is slow (closing sockets, logging), the queue grows and the heap fills even though "nobody uses it".
{{Cleaner}} uses a **PhantomReference**: the object cannot be resurrected, the action runs on the Cleaner's thread and **must not** reference the object itself (otherwise the object would never become unreachable).

### Real-world production example
An image-processing service used an old library wrapping native memory and released it in {{finalize()}}. Under load, the container RSS kept growing until it was OOMKilled after about 6 hours, while Java heap was only 40%. A heap dump showed over 200,000 objects queued in {{java.lang.ref.Finalizer}} - the single finalizer thread could not keep up. Fix: wrap the resource with {{AutoCloseable}}, use try-with-resources everywhere, keep {{Cleaner}} as a safety net and log a warning if Cleaner has to run (meaning someone forgot to close). Native memory stabilized with no more OOMKills; the warnings revealed 2 more missed close sites.

### Sample interview answer
"final is a modifier: a variable is assigned once, a method cannot be overridden, a class cannot be extended; a final field also has a memory-model guarantee that other threads see its initialized value after the constructor. finally is a block that always runs when leaving a try, unless the JVM dies, and I never return inside finally because it hides exceptions. finalize is a GC hook, deprecated for removal since Java 18. It is bad because it has no timing guarantee, runs on a single finalizer thread, forces objects to survive at least two GC cycles, and can even resurrect objects. The standard replacement is AutoCloseable with try-with-resources for deterministic cleanup; Cleaner is only a safety net for native resources, and I usually have it log a warning to detect missed closes."

> Senior tip: never put important business logic in {{finalize}}. If you find {{finalize}} in an old codebase, replace it with {{AutoCloseable}} + try-with-resources first; keep {{Cleaner}} only for native resources.`,
    follow: [`Why can a {{return}} inside {{finally}} swallow an exception?`, `How does a {{final}} field help publish an object safely across threads?`, `How does {{Cleaner}} differ from {{finalize}}, and what limitations remain?`]
  },
  'core-006': {
    q: `How does type erasure affect generics? Explain wildcards and the PECS rule with {{? extends}} / {{? super}}.`,
    a: `**Summary:** generics are checked only at compile time and then **erased** from bytecode; wildcards add flexibility, and PECS means **Producer Extends, Consumer Super** - read with {{? extends T}}, write with {{? super T}}.

### Type erasure
- {{List<String>}} and {{List<Integer>}} are both {{List}} in bytecode; there is no {{new T()}}, no {{instanceof T}}, no {{new T[]}} array, and no overloading that differs only by type parameter.
- The compiler inserts **casts** and **bridge methods** to preserve polymorphism. For example, {{Comparable}} gets a {{compareTo(Object)}} bridge that calls {{compareTo(MyType)}}.
- Consequence: generic type cannot be checked at runtime; a {{List<String>}} suffers "heap pollution" if the wrong type is inserted via a raw type. {{@SafeVarargs}} is only the programmer's promise.
- Generic information is not fully available via reflection, but it **still exists** in declaration metadata ({{getGenericSuperclass}}, {{ParameterizedType}}) on classes/fields/methods. Jackson uses this via {{TypeReference}}.

### Why wildcards are needed
- Generics are **invariant**: {{List<Integer>}} is **not** a subtype of {{List<Number>}}, even though {{Integer}} extends {{Number}}. If it were allowed, you could {{add(3.14)}} into an Integer list.
- Wildcards open one safe direction:

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

- {{? extends T}}: you can read {{T}} but **cannot** write (except {{null}}) because the compiler does not know the concrete subtype.
- {{? super T}}: you can write {{T}}, but reading gives only {{Object}}.
- {{?}} = {{? extends Object}}: you can read Object, not write.

### Applying PECS
- {{Collections.copy(List<? super T> dest, List<? extends T> src)}} is the classic example.
- An API that takes a collection only to read: use {{Collection<? extends T>}} so it also accepts {{List<Sub>}}.
- An API that only writes: {{Consumer<? super T>}}.
- For return types, use a concrete type, not a wildcard (unless hiding the implementation).
- {{Comparable<? super T>}} allows comparison with a supertype.

### Pitfalls
- A raw type ({{List}} with no parameter) disables compile-time checks, produces warnings, and can throw {{ClassCastException}} elsewhere.
- You cannot create a generic array: {{new List<String>[10]}} is invalid; use {{List<List<String>>}} or {{Array.newInstance}} with a controlled cast.
- {{List<Object>}} does not accept {{List<String>}}; {{List<?>}} accepts it but you cannot add.

### Inside: what the compiler does with generics
For {{List<String> list; String s = list.get(0);}}, the bytecode is effectively {{(String) list.get(0)}} - {{get}} returns {{Object}} and the compiler inserts a **checkcast**. For {{class Money implements Comparable<Money>}}, the compiler generates a **bridge method** {{compareTo(Object)}} that calls {{compareTo(Money)}} so polymorphism still works after erasure. Generic information **remains in declaration metadata** (fields, methods, superclass) - that is how Jackson (via an anonymous subclass of {{TypeReference<List<Order>>}}), Spring ({{ResolvableType}}), and Gson recover element types: the anonymous subclass captures the generic type in its superclass.
Why Java chose erasure: so generic code (Java 5) could **run with old libraries and old JVMs** without changing bytecode - at the cost of losing runtime type information.

### Real-world production example
An internal HTTP client had {{<T> T get(String url, Class<T> type)}}. The team called {{get(url, List.class)}} for an API returning a list of orders; Jackson did not know the element type and created {{List<LinkedHashMap>}}, which worked until someone called {{order.getAmount()}} -> {{ClassCastException}} in production, far from the root cause. Fix: add an overload taking {{ParameterizedTypeReference<T>}} (Spring) and ban raw types with compiler warnings {{-Xlint:unchecked -Werror}} in that module. The build revealed 11 more raw-type sites to fix.

### Sample interview answer
"Java generics are checked at compile time and then erased from bytecode: List of String and List of Integer are both List at runtime, the compiler inserts casts on reads and generates bridge methods to preserve polymorphism. Java chose erasure for backward compatibility with older JVMs and libraries. The consequences are no new T, no instanceof List of String, no generic arrays, and heap pollution through raw types. Generic info still exists in declaration metadata, so Jackson uses TypeReference to recover element types. Generics are invariant - List of Integer is not a List of Number - so we need wildcards following PECS: a source you only read from uses extends, a destination you only write to uses super, like Collections.copy. When designing APIs, I use wildcards on input parameters for flexibility and keep return types concrete."

> Senior tip: in library APIs, use wildcards on **inputs** so callers can pass more types; do not overuse wildcards on returns because it forces callers to deal with a useless {{?}}. And remember generic cost at runtime is 0 - only bridge methods and small casts.`,
    follow: [`Why can you not write {{new T[]}} or {{new List<String>[10]}}?`, `What is a bridge method for, and how does it affect reflection?`, `When should you use {{List<?>}} instead of {{List<Object>}}?`]
  },
  'core-007': {
    q: `How do you design an immutable class correctly? Where should defensive copies go, and why?`,
    a: `**Summary:** make the class {{final}}, every field {{private final}}, no setters, **copy** all mutable parameters in the constructor and copy again when returning them; never let {{this}} escape from the constructor.

### Design steps
1. Declare {{final class}} (or use a static factory + private constructor) so subclasses cannot break immutability.
2. Fields {{private final}}; no state-changing methods.
3. In the constructor, **validate** then **defensive-copy** all mutable parameters ({{Date}}, {{List}}, {{Map}}, arrays).
4. Getters return a copy or an immutable view, not the internal reference.
5. Beware of **leaking this**: do not call overridable methods, do not register listeners, and do not publish {{this}} before the constructor finishes.
6. {{equals}}/{{hashCode}} based on immutable fields; {{toString}} must not expose sensitive data.

~~~java
public final class Period {
    private final LocalDate start;      // LocalDate is immutable, no copy needed
    private final List<String> tags;    // List is mutable, must copy

    public Period(LocalDate start, List<String> tags) {
        this.start = Objects.requireNonNull(start);
        this.tags = List.copyOf(tags);  // copy + null-hostile + immutable
    }
    public List<String> tags() { return tags; }   // safe because already immutable
}
~~~

### Where defensive copies belong
- **Constructor:** required if the parameter is mutable and you want to preserve immutability. Otherwise the caller keeps a reference and can modify it after the object is created.
- **Getter:** if the field is still mutable (for example {{Date}}), return {{new Date(value.getTime())}}; if you already use {{List.copyOf}}/{{Collections.unmodifiableList}}, no extra copy is needed.
- {{Collections.unmodifiableList}} is only a **view**: if the original list changes, the view changes too. {{List.copyOf}} creates a real immutable copy, safer for value objects.
- Arrays must always be copied because returning the array directly is an open door.

### Why it is worth it
- Thread-safe without locks; safe as a map key; easy to cache and share.
- Fewer "data changed by itself" bugs when objects pass through many layers.
- Records reduce boilerplate but **do not auto-copy** mutable components; you still need a compact constructor calling {{List.copyOf}}.

### Pitfalls
- Copy in the constructor but not in the getter (or vice versa) can still leak state, and copying on every read has a cost.
- {{List.of(...)}} with a null element throws NPE; validate input first.
- A "mostly immutable" class with a mutable field exposed via a getter is a common cause of hard-to-reproduce race conditions.

### Inside: why final fields matter with multiple threads
The Java Memory Model has a special rule for {{final}} fields: after the constructor finishes, any thread that sees a reference to the object **sees the correct values** of its final fields (and of what they pointed to at that time), even if the object is shared via a non-{{volatile}} variable. Without {{final}}, the JIT and CPU may reorder instructions and another thread could see a "half-constructed" object (fields still null/0). That is why true immutability needs **both** {{final}} and not letting {{this}} escape in the constructor - if {{this}} is published before the constructor completes, the guarantee is lost.

### Real-world production example
A fee-calculation service stored a {{FeeSchedule}} object in a shared cache; the class had {{getTiers()}} returning the internal {{ArrayList}} directly. A reporting job called {{getTiers().sort(...)}} to print in a different order -> the tier order in the cache changed, and the pricing API picked the wrong tier for about 2% of transactions over 40 minutes until the cache refreshed. Fix: make {{FeeSchedule}} a record with a compact constructor calling {{List.copyOf}}, sort once in the constructor; the reporting job makes its own copy when it needs a different order. Added a test: calling the getter then trying {{add}} must throw {{UnsupportedOperationException}}.

### Sample interview answer
"To design an immutable class, I declare the class final or use a private constructor with a factory, make every field private final, and provide no setters. In the constructor I validate and then defensive-copy every mutable parameter, for example List.copyOf, so the caller cannot change it later through a retained reference. Getters return already-immutable values or copies if a field must remain mutable like Date. I avoid letting this escape from the constructor, because final fields have a memory-model guarantee that other threads always see the initialized values - but that guarantee is lost if the object is published early. I also remember unmodifiableList is only a view while copyOf is a real copy. With records I still have to copy in a compact constructor because records do not do it automatically."

> Senior tip: for DTOs/records received from a request, copy immediately at the boundary (controller/service) so the rest of the system works with immutable data; do not trust that the caller will not modify it.`,
    follow: [`How does {{Collections.unmodifiableList}} differ from {{List.copyOf}}?`, `Does a record automatically protect against mutable components?`, `How can leaking {{this}} in a constructor break things with polymorphism?`]
  },
  'core-008': {
    q: `Distinguish a static nested class from an inner class. Why can an inner class easily cause a memory leak?`,
    a: `**Summary:** a static nested class does **not** hold a reference to the outer instance; an inner (non-static) class implicitly keeps {{this$0}}, so as long as the inner object lives, the outer object lives too. Therefore default to a static nested class and use an inner class only when you truly need to access outer state.

### Basic differences
- **Static nested:** declared {{static class Foo}} inside the outer class. It needs no outer instance, has no {{this$0}}, and behaves like a top-level class (only name scope differs).
- **Inner (non-static):** each instance is tied to one outer instance; the compiler generates a {{final Outer this$0}} field and a constructor that takes the outer instance. It can call outer fields/methods directly.
- **Local class:** declared inside a method; it also holds a reference to the outer instance and captures effectively-final local variables.
- **Anonymous class:** like a local class, it holds the outer instance and captured variables; commonly seen in listeners/callbacks.

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
- You register an inner listener/callback in a long-lived registry (static list, singleton, thread pool, event bus). The registry holds the inner object, the inner object holds the outer, so the **entire service object** is never collected even though the business work is done.
- In desktop/Android apps, an inner class holding an Activity/Context is the classic leak; in backends, an inner task can hold a large service including caches and connection-pool references.
- An anonymous class in a {{ThreadLocal}} or a scheduled task also retains the outer instance the same way.
- Even if only a small callback remains, the outer object cannot be GC'd and the retained size can be very large.

### How to avoid it
- Default to {{static}} for nested classes; pass required dependencies via the constructor instead of accessing {{Outer.this}}.
- For listeners, keep the reference and **unregister** in {{close()}}/{{@PreDestroy}}; or use {{WeakReference}} for short-lived callbacks.
- For periodic tasks, use a static nested class plus parameters and avoid capturing {{this}} accidentally.
- Verify with a heap dump (Eclipse MAT) by looking for unexpected {{this$0}} back-references.

### When an inner class is appropriate
- When the child object is truly part of the outer object's lifecycle and needs access to its private state, for example a collection's {{Iterator}} ({{ArrayList.Itr}} is inner and accesses {{elementData}} and {{modCount}}).
- When the {{outer.new Inner()}} API expresses a tight relationship. Otherwise, a static nested class is clearer and safer.

### Inside: what the compiler generates for an inner class
For a non-static {{class Worker}} inside {{Service}}, javac produces {{Service$Worker}} with a {{final Service this$0}} field and a hidden constructor taking {{Service}} as its first argument; {{new Worker()}} inside Service is really {{new Service$Worker(this)}}. Lambdas are different: a lambda **only** captures {{this}} if its body uses an instance field/method - a lambda that uses nothing from the outer does not hold it. An anonymous class **always** holds the outer when created in an instance context, even if unused (before Java 18; from JDK 18 javac can drop an unused outer reference in some cases, but do not rely on it).

### Real-world production example
A report service created an anonymous {{TimerTask}} to clean temp files and registered it in a shared static {{Timer}}, but never canceled it. Each report run left one {{ReportJob}} instance (with a ~15 MB data buffer) retained via {{this$0}}. After about 2 days the heap filled and Full GCs ran continuously. A heap dump (MAT, "Path to GC Roots") showed {{Timer -> TaskQueue -> ReportJob$1 -> this$0 -> ReportJob -> byte[]}}. Fix: use a shared {{ScheduledExecutorService}}, make the task a static nested class that takes only the file path, and cancel it when the job ends. Heap stabilized at 1.2 GB.

### Sample interview answer
"A static nested class is not tied to an outer instance and works like a top-level class with a different name scope. An inner class has each instance implicitly holding a reference to the outer: the compiler generates a this$0 field and a constructor that takes the outer. So if an inner object, anonymous class, or callback is placed somewhere long-lived like a static registry, timer, or thread pool, the entire outer object and everything it holds cannot be garbage-collected. A lambda only captures this if it uses an instance member. My rule is static nested by default, pass dependencies through the constructor, and use an inner class only when it truly needs outer state, like a collection Iterator. For listeners I always unregister on close. When I suspect a leak, I take a heap dump in MAT and follow the path to GC roots to find this$0 back-references."

> Senior tip: in code review, a {{private class X}} that uses no outer field/method is a signal to make it {{static}}; it also removes one reference and makes serialization cleaner.`,
    follow: [`What field does the compiler generate for an inner class, and how does it affect serialization?`, `How do you detect a memory leak caused by an inner class using a heap dump?`, `Why is {{ArrayList}}'s {{Iterator}} a reasonable inner class?`]
  },
  'core-009': {
    q: `Java serialization: what is {{serialVersionUID}} for, what are the security risks of deserialization, and what should replace it?`,
    a: `**Summary:** {{serialVersionUID}} is the class "version" used to avoid {{InvalidClassException}} when the structure changes; Java deserialization of untrusted data can be exploited via a **gadget chain leading to RCE (remote code execution)**, so modern systems prefer JSON/Protobuf/Avro, and if you must use it you need an {{ObjectInputFilter}}.

### serialVersionUID
- If you do not declare it, the JVM computes it from the class signature (fields, methods, modifiers); adding a single field changes the value and old data can no longer be read.
- Declare it explicitly as {{private static final long serialVersionUID = 1L;}} to control compatibility.
- Bump the version on **incompatible** changes (removing a field, changing a type); adding a new field is usually compatible and the new field gets its default value.
- Default serialization writes the **entire object graph** by class name; renaming a package/class also breaks it.

### How it works
- {{Serializable}} is a marker; {{ObjectOutputStream}} writes metadata plus non-{{transient}} fields; {{readObject}} restores the object **without calling the constructor** (except for non-Serializable parents).
- {{transient}} excludes a field from the stream; {{Externalizable}} lets you control everything.
- {{writeReplace}}/{{readResolve}} are used for singletons/proxies.

### Risks
- An attacker sends a byte stream containing a chain of classes already on your classpath (Apache Commons Collections, Spring, ROME...) forming a **gadget chain**: each {{readObject}} executes code and can end up calling {{Runtime.exec}}. There does not need to be a bug in your code.
- Deserialization happens **before** you can validate data, so field validation cannot save you.
- Famous vulnerabilities (CommonsCollections, WebLogic, JBoss) all went through this path.

### Defenses
- **Do not accept Java serialization over the network/HTTP**, even from internal services. Use JSON (Jackson), Protobuf, Avro, or CBOR.
- If forced (RMI, old sessions), set an {{ObjectInputFilter}} allowlist of classes and limit depth/size (JEP 290, {{jdk.serialFilter}}), and enable per-context filters (JEP 415).
- Do not use {{ObjectInputStream}} on client-controlled cookies/sessions; if you must, sign and encrypt.
- For distributed caches (Redis), do not use default Java serialization; use JSON/Protobuf to avoid both compatibility and security issues.

### Replacements
- Record DTOs + Jackson/Protobuf give clear schemas, easier versioning, and better safety.
- For sessions, store JSON or use stateless tokens (JWT) instead of serializing objects.
- For internal snapshots, {{Externalizable}} is possible but you still must control the source.

### Inside: why deserialization can execute code
{{ObjectInputStream.readObject()}} reads a class name from the byte stream, **loads that class** from the classpath, creates an instance **without a constructor**, assigns fields, then calls "magic" methods if defined: {{readObject}}, {{readResolve}}, and indirectly {{hashCode}}/{{equals}}/{{compareTo}} when rebuilding {{HashMap}}, {{TreeMap}}, or {{PriorityQueue}}. An attacker needs no bug in your code: only classes on the classpath whose call chain, with attacker-chosen data, reaches {{Method.invoke}} or {{Runtime.exec}} (a **gadget chain** - tools like ysoserial provide ready-made chains for common libraries). Validating data after reading is too late.

### Real-world production example
An internal system stored Spring Session data in Redis using the JDK's default serializer. A library upgrade changed the structure of a session class -> all users were logged out at once due to {{InvalidClassException}}, about 9,000 sessions lost in 5 minutes. A review also found an old endpoint accepting {{application/x-java-serialized-object}} from a partner system - the classpath had an old commons-collections version sufficient for a gadget chain. Fix: switch sessions to {{GenericJackson2JsonRedisSerializer}} with an allowed-type list, remove the endpoint, and set a global {{jdk.serialFilter}} allowing only internal packages and denying by default. The next upgrade did not lose sessions.

### Sample interview answer
"serialVersionUID is the class version for Java serialization; if you do not declare it, the JVM computes it from the class structure, so adding a single field breaks reading old data. The bigger issue is security: readObject reads a class name from the data, loads the class, creates an object without a constructor, and calls methods like readObject or hashCode when rebuilding a HashMap. An attacker chains classes already on the classpath into a gadget chain to run arbitrary commands, and validating after reading is too late. So I never accept Java serialization from untrusted sources; I use JSON with Jackson, Protobuf, or Avro with clear schemas. Legacy systems that must use it get an ObjectInputFilter allowlist with depth and size limits, then a migration plan - including sessions and caches in Redis."

> Senior tip: if a legacy system still uses Java serialization in Redis/sessions, treat it as **P1 security debt**; add filters first, then migrate to JSON. Just bumping {{serialVersionUID}} does nothing for safety.`,
    follow: [`Why does deserialization not call the constructor, and how does that affect immutability?`, `Where should the {{ObjectInputFilter}} allowlist be configured in Spring Boot?`, `When is {{transient}} mandatory rather than just an optimization?`]
  },
  'core-010': {
    q: `Reflection and annotation processing: what are the costs, where do frameworks use them, and what pitfalls appear in production?`,
    a: `**Summary:** reflection lets you inspect and call classes at runtime but is slower than direct calls (lookup, access checks, boxing, hard to inline); annotation processing runs at **compile time** and generates code so it has near-zero runtime cost. Spring/Hibernate/Jackson use reflection; Lombok/MapStruct use annotation processing.

### Reflection
- API: {{Class.forName}}, {{getDeclaredFields}}, {{Method.invoke}}, {{Constructor.newInstance}}, {{setAccessible}}.
- Costs:
  - **Lookup** of method/field names on every call is expensive; you must cache {{Method}}/{{Field}}.
  - **Access checks** and boxing/unboxing for primitive arguments.
  - **Hard for the JIT to inline** compared to direct calls; from Java 18 core reflection was rewritten on {{MethodHandle}} and is faster than before, but still not equal to a static call.
  - Class initialization and metadata loading can increase startup time.
- {{MethodHandle}}/{{VarHandle}} are faster choices for hot paths; {{LambdaMetafactory}} turns a reflective call into a functional interface once.
- Reflection breaks encapsulation: {{setAccessible(true)}} can be blocked by modules ({{InaccessibleObjectException}}) from Java 9/17; you may need {{--add-opens}} (usually only a temporary compatibility measure).

### How frameworks use it
- **Spring:** scans classes, reads annotations, creates proxies (CGLIB/JDK dynamic proxy), injects fields/constructors. Startup is slower but runtime uses generated proxies.
- **Hibernate:** maps entities via metadata, uses bytecode enhancement/reflection to read fields, lazy proxies.
- **Jackson:** reads getters/constructors/record components to serialize; caches {{BeanDescription}} to reduce cost.
- **JUnit/Mockito:** creates instances, injects mocks, verifies calls.

### Annotation processing
- Runs inside {{javac}} via a {{Processor}}; reads annotations and **generates source/bytecode** (or reports compile errors).
- **Lombok** manipulates the AST via internal javac APIs and generates getters/setters/constructors into bytecode - convenient but fragile across JDK changes and controversial with tooling.
- **MapStruct** generates type-safe mappers at compile time so runtime is as fast as hand-written code; **Dagger** generates the DI graph.
- Runtime cost = 0; build cost increases; you need processor configuration in Maven/Gradle and errors can be hard to read when generated code is wrong.

### Production pitfalls
- Calling {{getMethods()}}/{{getDeclaredFields()}} in a request loop without caching: CPU spikes and more GC.
- Using reflection to set private JDK fields: breaks when upgrading the JDK (strong encapsulation), and native image/AOT support is poor.
- Reflection + {{setAccessible}} loses type checking; errors surface only at runtime.
- Slow startup due to overly broad scanning; consider AOT, CDS, or limiting scanned packages.
- With GraalVM native image, reflection needs configuration; libraries using dynamic reflection fail easily.

### Inside: Method.invoke from Java 18
Before Java 18, {{Method.invoke}} initially went through JNI (slow), and after ~15 calls the JVM generated a bytecode "accessor" class for faster calls ("inflation"). From Java 18 (JEP 416), core reflection was rewritten on **{{MethodHandle}}**: if a {{Method}} is held in a {{static final}} field, the JIT can treat it as constant and inline close to a direct call; if the {{Method}} is looked up each time or stored in a regular variable, the cost remains high. That is why "cache metadata in a final field" matters more than choosing reflection vs MethodHandle.
Annotation processors run in **rounds**: each round processes new source files generated in the previous round, until no new files appear - which is how MapStruct can generate mappers that use code produced by other processors.

### Real-world production example
A service wrote a "generic mapper" using reflection: on every entity-to-DTO conversion it called {{getDeclaredFields()}} and {{setAccessible(true)}}. At 3,000 requests/second, a profiler (async-profiler) showed 22% of CPU in reflection and in allocating new {{Field[]}} arrays each call (that method returns a copy). Replacing it with MapStruct (compile-time code generation): CPU dropped 18%, p99 fell from 140 ms to 95 ms, and mapping errors (renamed fields) moved from runtime failures to **compile errors**. When upgrading to Java 17 the old mapper also broke because {{setAccessible}} into JDK internals was blocked by strong encapsulation - another reason to remove it.

### Sample interview answer
"Reflection lets you inspect and invoke classes at runtime, and Spring, Hibernate, and Jackson all rely on it. The cost comes from method or field lookup, access checks, argument boxing, and the difficulty for the JIT to inline. From Java 18 reflection runs on MethodHandle, so if a Method is cached in a static final field the JIT can optimize it well, but looking it up every time is still expensive; getDeclaredFields also returns a new array on each call. Annotation processing runs at compile time and generates code, like MapStruct or Lombok, so runtime cost is near zero and errors show up early at build time. Pitfalls I see: uncached reflection on hot paths, setAccessible into JDK internals breaking on Java 17 upgrades, and dynamic reflection hurting native image. I keep reflection in infrastructure layers and measure with a profiler before optimizing."

> Senior tip: cache reflection metadata in a {{ConcurrentHashMap}} or use {{MethodHandle}}; measure with JMH before optimizing. And do not use reflection for everyday business logic - keep it in the infrastructure/framework layer.`,
    follow: [`Why is {{Method.invoke}} slower than a direct call, and what does {{MethodHandle}} improve?`, `How does strong encapsulation from Java 17 affect older libraries?`, `How does annotation processing differ from runtime annotations?`]
  },
  'core-011': {
    q: `List the methods of {{Object}}. Should {{clone()}} be used, and how does it compare to a copy constructor?`,
    a: `**Summary:** {{Object}} provides {{equals}}, {{hashCode}}, {{toString}}, {{getClass}}, {{clone}}, {{finalize}}, and the {{wait}}/{{notify}}/{{notifyAll}} set; {{clone()}} works via {{Cloneable}} but has many traps, so prefer a **copy constructor** or a static factory.

### Methods of Object
- {{equals(Object)}}: reference comparison by default; override according to the contract.
- {{hashCode()}}: default hash based on identity; must stay consistent with {{equals}}.
- {{toString()}}: default {{ClassName@hex}}; override for readable logs but hide sensitive data.
- {{getClass()}}: returns the runtime {{Class}}; cannot be overridden; used for reflection and exact type checks.
- {{clone()}}: protected native, creates a copy; works only if the class implements {{Cloneable}}, otherwise throws {{CloneNotSupportedException}}.
- {{finalize()}}: deprecated, do not use.
- {{wait()}}, {{wait(long)}}, {{wait(long,int)}}, {{notify()}}, {{notifyAll()}}: monitor coordination; must be called inside {{synchronized}} on the correct object, otherwise {{IllegalMonitorStateException}}.

### What is wrong with clone()
- **Shallow copy:** object fields still share references; to get a deep copy you must clone each field yourself - easy to miss.
- **Does not call the constructor:** invariants/validation in the constructor are skipped; very hard to assign final fields correctly.
- **{{Cloneable}} is a strange marker:** it has no methods; it only changes {{Object.clone}} behavior from throwing to copying fields.
- **Inheritance:** subclasses must override to return the correct type; easy to return the wrong class or break the contract.
- **Not type-safe:** {{clone()}} returns {{Object}} in many places, requiring casts.
- For arrays, {{clone()}} is safe and fast (shallow copy), but for complex objects it is not.

### Copy constructor / factory
- A copy constructor {{User(User other)}} is clear, type-safe, controls deep copying, and preserves validation; inside you assign {{this.tags = List.copyOf(other.tags)}}.
- A static factory {{User.copyOf(u)}} is convenient for generics/collections.
- A record has a canonical constructor; to copy, use {{new User(r.id(), r.tags())}} or a compact constructor that copies.
- For complex deep copies, use a mapper (MapStruct) or JSON serialization (slow, only when needed).

### When clone() is still used
- Copying primitive/object arrays in hot paths: {{int[] copy = arr.clone()}}.
- Legacy code/libraries that require it; if so, override {{clone()}} as public, call {{super.clone()}}, deep-copy mutable fields, and consider {{CloneNotSupportedException}}.

### Inside: what Object.clone does
{{Object.clone()}} is a native method: it checks whether the class implements {{Cloneable}} (throws {{CloneNotSupportedException}} if not), then allocates a new object of the **same runtime class** and **bitwise-copies** every field - no constructor call, no field initializers. For reference fields, only the pointer is copied (shallow). Because it bypasses the constructor, a {{final}} field pointing to a mutable object cannot be reassigned to a deep copy inside your {{clone()}} - which is why {{clone}} conflicts with immutable design. In contrast, **array** {{clone()}} is highly optimized by the JVM and returns the correct array type (no cast needed since Java 5) - the most reasonable use case.

### Real-world production example
An insurance quoting engine copied a "template policy" for each customer using {{clone()}}; {{Policy}} had a {{List<Rider> riders}} field. When an agent added an extra rider for one customer, that rider appeared on **every** quote created from the same template in that session - because the list was shared. 64 incorrect quotes were sent before it was found. Fix: remove {{Cloneable}}, write a copy constructor that creates a new list and copies each {{Rider}}; add a test asserting that changing the copy does not affect the original. Later the team made {{Rider}} an immutable record so deep copying was no longer needed.

### Sample interview answer
"Object has equals, hashCode, toString, getClass, clone, finalize, and wait, notify, notifyAll. I avoid clone because of its traps. Object.clone is a native method that checks Cloneable and then bitwise-copies every field without calling the constructor, so constructor validation is skipped, final fields cannot be reassigned, and by default it is only a shallow copy - lists or child objects are still shared with the original. Cloneable is a strange marker interface with no methods, and inheritance makes it worse. I use a copy constructor or a static factory: clear, type-safe, I control how deep the copy goes, and validation is preserved. With immutable records I often do not need to copy at all. The one case where I use clone is copying arrays, because it is fast and returns the correct type."

> Senior tip: in new codebases, do not implement {{Cloneable}}; use a copy constructor or a record. If you must keep {{clone()}} for compatibility, write a unit test asserting the copy does **not share** collections/arrays with the original - that is where bugs hide.`,
    follow: [`Why is {{Cloneable}} considered poor design in Effective Java?`, `How does {{wait}}/{{notify}} differ from {{Condition}} in {{ReentrantLock}}?`, `How do you deep-copy an object graph that contains reference cycles?`]
  },
  'collections-001': {
    q: `Explain the internals of {{HashMap}}: hash spreading, buckets, resize, load factor, and treeify from Java 8.`,
    a: `**Summary:** {{HashMap}} is an array of buckets ({{Node[] table}}); index = {{(n-1) & spread(hash)}}; when the number of elements exceeds {{capacity * loadFactor}} it resizes to double; from Java 8 a bucket with >= 8 entries becomes a red-black tree to avoid O(n) under heavy collisions.

### Structure
- Default capacity 16, load factor 0.75; the table is **lazily initialized** on the first {{put}} (before that {{table == null}}).
- Each entry is a {{Node}} with {{hash}}, {{key}}, {{value}}, and {{next}}. A bucket is a linked list.
- Capacity is always a power of 2 so it can use {{&}} instead of modulo.

### Hash spreading
~~~java
static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}
int index = (n - 1) & hash;          // n is the capacity
~~~
- It XORs the high 16 bits into the low 16 so high bits also influence the index; otherwise, with small capacity only low bits are used and collisions increase.
- A {{null}} key always goes to bucket 0, and only one null key is allowed.

### Resize
- When {{size > threshold}} (threshold = capacity * 0.75), {{resize}} creates a new array twice as large and redistributes nodes.
- Java 8 optimization: each old bucket splits into **lo** and **hi** based on the new hash bit, preserving relative order, without recomputing hashes.
- Cost is O(n) per resize; repeated resizes cause latency spikes. If you know the expected size, set capacity appropriately: {{new HashMap<>((int)(expected / 0.75f) + 1)}}.

### Treeify (Java 8)
- When a bucket has >= {{TREEIFY_THRESHOLD = 8}} nodes **and** capacity >= {{MIN_TREEIFY_CAPACITY = 64}}, the bucket becomes a {{TreeNode}} (red-black tree) with O(log n) lookup instead of O(n).
- If capacity < 64, HashMap **resizes** instead of treeifying, because resizing may shorten the bucket.
- When the node count drops to <= {{UNTREEIFY_THRESHOLD = 6}}, it converts back to a linked list.
- Key comparison in the tree uses {{hashCode}} first; if equal, it uses {{Comparable}} if implemented, otherwise {{tieBreakOrder}} (identity comparison) to keep the tree valid.
- Why threshold 8: with a good hash distribution the probability of a bucket reaching length 8 is extremely small (about 6e-8 at load factor 0.75); treeify mainly defends against hash-flooding attacks.

### Common interview points
- {{HashMap}} is not thread-safe: concurrent {{put}} can lose data; before Java 8 resize could even create an infinite loop (a famous bug).
- From Java 8 resize no longer creates loops but it is still unsafe - use {{ConcurrentHashMap}} or external synchronization.
- {{containsKey}} and {{get}} are O(1) on average; worst case O(log n) from Java 8 (with treeify), O(n) before.
- Keys must have a stable {{hashCode}}; mutable keys make entries "disappear".
- {{HashMap}} allows 1 null key and multiple null values; {{Hashtable}}/{{ConcurrentHashMap}} do not.

### Real-world production example
A reconciliation service loaded 2 million transactions into {{HashMap<TxKey, Tx>}} each night. The job slowed from 4 to 25 minutes even though data grew only 30%. A profiler showed most time in {{TxKey.equals}}. Cause: {{TxKey}}'s custom {{hashCode()}} used only {{bankCode}} (~40 values) -> 2 million keys packed into ~40 buckets; the key did not implement {{Comparable}}, so the red-black tree had to rely on {{tieBreakOrder}} and traversed many branches. Fix: compute {{hashCode}} with {{Objects.hash(bankCode, txId, date)}} (or make {{TxKey}} a record), and initialize capacity for the expected size: the job dropped to 2 minutes 40 seconds, and heap also decreased because there were no longer thousands of {{TreeNode}} objects (each nearly twice as heavy as a Node).

### Sample interview answer
"HashMap is an array of buckets. On put, it takes the key's hashCode, mixes the high 16 bits down into the low 16 with XOR so high bits influence the position, then computes the index with n minus 1 AND hash because capacity is always a power of two. Each bucket is a linked list; from Java 8, when a bucket reaches 8 entries and the table has at least 64 buckets it becomes a red-black tree so the worst case is log n instead of n, mainly to defend against hash flooding. When the number of elements exceeds capacity times load factor 0.75, the table doubles and each bucket splits into two groups based on one hash bit without recomputing hashes. In practice I watch three things: the key hashCode must be well distributed and stable, the key must not change after put, and I set the initial capacity for large maps. HashMap is not thread-safe, so for concurrent use I pick ConcurrentHashMap."

> Senior tip: set the initial capacity for large maps (for example a 100k-entry config map) to avoid 10+ resizes at startup; and if you suspect hash flooding from user input, use keys with stable hashes and consider limiting request size.`,
    follow: [`Why must capacity be a power of 2 and why is the load factor 0.75?`, `Treeify threshold is 8 and untreeify is 6 - why not the same threshold?`, `How did HashMap change from Java 7 to Java 8 in handling collisions?`]
  }
});
