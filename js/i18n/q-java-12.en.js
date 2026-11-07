/*
 * English translation of js/data/q-java.js — task T652. Format: js/core/i18n.js (content overlay).
 * ids: core-014 collections-027 collections-028 modern-025 modern-026 modern-027 core-032 core-033 core-034 collections-029 collections-030 modern-028 modern-029
 */
App.i18n.content({
  'core-014': {
    q: 'Autoboxing: the Integer cache (-128..127), {{==}} on wrappers, NPE when unboxing, and the cost of boxing inside a hot loop.',
    a: `**Summary:** autoboxing converts primitive ↔ wrapper automatically; {{Integer.valueOf}} caches -128..127, so {{==}} appears to work inside the cache but is wrong outside that range; unboxing a {{null}} throws NPE; boxing inside a loop generates a large amount of GC garbage — use primitives or primitive collections.

### The Integer cache
- {{Integer.valueOf(int)}} caches [-128, 127] (the upper bound can be enlarged with {{-XX:AutoBoxCacheMax}}); {{new Integer()}} was deprecated (Java 9) and does not use the cache.
- {{Long}}, {{Short}}, {{Byte}}, {{Character}} have equivalent caches.
- {{Boolean}} caches the {{TRUE}}/{{FALSE}} singletons.

~~~java
Integer a = 127, b = 127;        // cache -> same object
Integer c = 128, d = 128;        // newly created -> different objects
System.out.println(a == b);      // true
System.out.println(c == d);      // false (comparing references!)
System.out.println(c.equals(d)); // true (comparing values)
~~~

### NPE when unboxing
~~~java
Integer wrapper = null;
int primitive = wrapper;         // NPE on this line (implicit unboxing)
~~~
- It happens when: {{map.get(key)}} returns null and the result is assigned to a primitive; the ternary operator {{condition ? 1 : null}} is coerced to a primitive type; {{reduce}} on a stream with a null identity.
- Defend with: {{Objects.requireNonNull}}, {{Optional}}, or an explicit null check before unboxing.

### Boxing cost on a hot path
- Every boxing operation creates a new object (outside the cache), which drives a high allocation rate ⇒ more young GC cycles, longer pauses.
- Example: {{Long sum = 0L; for (long v : values) sum += v;}} — {{sum}} is boxed and unboxed on every iteration.
- Fix it: use a primitive local ({{long sum = 0;}}), a primitive stream ({{LongStream}}, {{IntStream}}), or a primitive collection (fastutil, Eclipse Collections).
- The JIT can remove boxing through escape analysis when the object does not escape the method, but this is never guaranteed.

### Comparing wrappers
- Always use {{equals}} for wrappers; {{==}} only works by cache luck and is a silent bug.
- {{Comparator.naturalOrder()}} is not safe against null wrappers (it throws NPE); {{Comparator.nullsFirst}} handles null explicitly.

> Senior tip: enable {{-XX:+PrintCompilation}} and {{-XX:+PrintInlining}} to see whether the JIT actually removes the boxing; in latency-critical code, write it by hand with primitives or use a primitive collection library. Never assume "the JIT will deal with it" — measure with JMH.`,
    follow: [
      'Why does the {{Integer}} cache default to -128..127, and how do you widen it?',
      'Why does the ternary expression {{flag ? 1 : null}} throw NPE when assigned to an {{int}}?',
      'When should you use {{OptionalInt}} instead of {{Optional<Integer>}}?'
    ]
  },
  'collections-027': {
    q: 'A mutable key in a HashMap/HashSet "loses" elements: what is the mechanism, and how do you prevent it?',
    a: `**Summary:** {{HashMap}} locates an entry by the {{hashCode}} of the key at the moment of {{put()}}. If a field used by the key's {{hashCode}}/{{equals}} changes after {{put()}}, then {{get()}}/{{remove()}} computes a new hashCode and searches the wrong bucket, so the old entry is never found even though it is still in the map.

### Mechanism
- {{put(key, value)}} computes the key's {{hashCode()}} at that instant to choose a bucket, and stores the entry in that bucket.
- If the key is mutable and you modify a field that takes part in {{equals()}}/{{hashCode()}} after {{put()}}, the entry stays in the old bucket.
- {{get(key)}} and {{remove(key)}} compute the new {{hashCode()}} (from the key's current state) and search a different bucket → no match, so they return {{null}} / fail to remove the old entry.
- {{HashSet}} uses a {{HashMap}} internally, so it has exactly the same problem.

### How to prevent it
- **Use immutable keys**: the best option ({{String}}, {{Integer}}, {{Long}}, a {{record}} whose components are all immutable).
- **Never modify a field that participates in {{equals}}/{{hashCode}} once the key is inside a {{HashMap}}/{{HashSet}}**.
- **With a JPA entity as key**: extreme care is needed. If {{hashCode}} uses a mutable business key, or a generated id that is assigned after {{put()}}, "losing" the entry is easy. Generally you should not use an entity as a map key.
- **If the change is unavoidable**: {{remove()}} the key **before** touching the fields that affect {{hashCode}}/{{equals}} (same object, same state as when the old hashCode was valid), then modify, then {{put()}} it back. If you have already modified it, {{remove(key)}} with the mutated object cannot find the entry any more; sometimes the only choices are walking the buckets (impractical) or avoiding the pattern entirely.

> Senior tip: use only immutable objects as keys in {{HashMap}}/{{HashSet}}. Never modify a field that participates in {{hashCode}}/{{equals}} after put.`,
    follow: ['How does this affect HashSet?', 'Why is the entry still there but impossible to find?', 'What traps come from using a JPA entity as a key?']
  },
  'collections-028': {
    q: 'Choosing the structure for a 1 million entry in-memory cache: HashMap vs ConcurrentHashMap vs LinkedHashMap (LRU) vs Caffeine. Trade-offs and memory footprint?',
    a: `**Summary:** when you design an in-memory cache you have to weigh thread-safety, an eviction policy such as LRU/W-TinyLFU, a size bound, TTL/refresh, and the memory cost (object overhead). For a production cache today the {{Caffeine}} library is usually the most practical choice because it already handles many traps (efficient eviction, cache stampede protection, statistics). But a library is not always required — pick what the requirement actually demands.

### Comparison
| Structure | Thread-safe | Automatic eviction | Notes |
|---|---|---|---|
| {{HashMap}} | No | No | Single-thread only. Not suitable for concurrent use. |
| {{ConcurrentHashMap}} | Yes (concurrent) | Not automatic | Good concurrent reads/writes, fine-grained locking. It is still only a map: no size- or time-based eviction policy. |
| {{LinkedHashMap}} ({{accessOrder}} = {{true}}) + {{removeEldestEntry()}} | No | Can be made into a simple LRU (access order) | Easy to implement, but the whole map is not thread-safe; eviction happens synchronously inside put and can cause side effects; no TTL/refresh/statistics. |
| {{Caffeine}} | Yes | Yes (LRU, W-TinyLFU, TTL, maximum size, and so on) | Library outside the JDK. Asynchronous eviction, good cache stampede handling, statistics tracking, and a much better memory efficiency than a simple hand-rolled implementation. |

### When to choose what
- **You only need a concurrent map, with no size bound**: {{ConcurrentHashMap}}.
- **A simple LRU, single-threaded or self-synchronised**: {{LinkedHashMap}} with {{removeEldestEntry()}} (only fits very simple cases).
- **A multi-threaded production cache with a size bound and efficient eviction**: {{Caffeine}} (recommended).
- **Very simple and strictly single-threaded**: {{HashMap}}.

### Notes on footprint (memory size)
- Each entry carries overhead: key, value, and the node/hash/next references. With 1 million entries the overhead can be significant (tens of MB) depending on the structure.
- {{ConcurrentHashMap}} has node/segment overhead (in older JDK versions) but remains a plain map.
- {{Caffeine}} packs entries more tightly, and its eviction keeps the footprint below a threshold instead of letting the map grow without bound.
- Always **bound the cache size** to avoid OutOfMemoryError (OOM). Never run an unbounded cache in production.

> Senior tip: do not hand-write a complex cache on {{LinkedHashMap}} for a multi-threaded production environment. If you need eviction/LRU/TTL/statistics, {{Caffeine}} is proven to be a far more efficient and far safer solution.`,
    follow: ['Why does Caffeine use W-TinyLFU instead of plain LRU?', 'What is a cache stampede and how do you avoid it?', 'How do you estimate the memory footprint of a cache?']
  },
  'modern-025': {
    q: 'Modelling a domain with sealed interface + record + pattern matching switch (Java 21): why is it better than enum/visitor?',
    a: `**Summary:** for an Algebraic Data Type (ADT — a type made of "either/or" alternatives), {{sealed interface}} strictly controls the set of subtypes that are allowed to implement it. Combining it with {{record}} to represent immutable data, plus pattern matching switch (Java 17+, refined in Java 21), gives you an **exhaustive switch**: when the switch has no {{default}}, the compiler warns or fails if you forget to handle a newly added subtype. That turns a runtime surprise into a compile-time error.

### When to use it
- The domain has **a fixed set of kinds, but each kind carries different data** (for example PaymentMethod with CreditCard(cvv...), Wallet(token...), BankTransfer(iban...))
- You need to add **behaviour** easily (a new case in the switch) or to add **a new kind** (sealed forces the update)
- You want immutability and want to avoid changing state

### Comparison with enum
- {{enum}} holds constants only — it cannot attach different data to each case in a flexible way.
- {{sealed interface}} + {{record}} lets every subtype have its own fields, so the domain structure is modelled exactly.

### Comparison with the Visitor pattern
- **Adding an operation (a new behaviour applied to all subtypes)**: pattern matching switch is easier and needs much less boilerplate. You only edit the switch.
- **Adding a type (a new subtype)**: {{sealed interface}} + exhaustive switch makes the compiler demand that you update **every** switch handling the sealed type. With Visitor you must update the Visitor interface and all of its implementors — also safe, but with much more boilerplate.
- Rule of thumb: if the set of types is **fairly stable** and new types appear less often than new operations, switch is usually the convenient choice. If the set of types changes often, weigh it carefully.

> Senior tip: the compiler forcing an exhaustive switch to be updated when a new type joins a sealed hierarchy is exactly the "intelligence" that prevents the forgotten-case failure in production.`,
    follow: ['When would you use Visitor instead of sealed + switch?', 'What is exhaustiveness in a pattern matching switch?', 'Why is record a good fit for modelling an ADT?']
  },
  'modern-026': {
    q: 'Record as a JPA entity / DTO / Map key: what do you gain, what do you lose? Best practice?',
    a: `**Summary:** a {{record}} is immutable (its components are final, no setters), it auto-generates {{equals()}}/{{hashCode()}}/{{toString()}} from the components, and it has no default no-arg constructor. That makes it **an excellent fit** for DTOs, projections, value objects and keys in a {{Map}}/{{Set}}. Conversely a {{record}} **is a bad fit** for a JPA {{@Entity}} in most cases, because of what JPA/Hibernate requires.

### Analysis by use case
| Use case | Recommendation | Reason |
|---|---|---|
| DTO/Request/Response | Very good | Immutable, concise, safe to pass across layers. |
| JPA projection (constructor expression; interface-based is rarer) | Usually good | Hibernate/JPA can map a record constructor for projection queries. |
| Value object (domain) | Very good | Matches immutability and value-based {{equals}}. |
| Map key | Very good | Immutable {{equals}}/{{hashCode}} → safe, no risk of "losing" the entry the way a mutable key does. |
| Embeddable ({{@Embeddable}}) | Careful / provider-dependent | Some providers support it, but it is uncommon and limited. Verify carefully. |
| JPA entity ({{@Entity}}) | Not recommended | See the details below. |

### Why it does not fit a JPA entity
- **A no-arg constructor is required**: JPA/Hibernate needs a constructor without arguments to create an instance when hydrating an entity. A {{record}} has no default no-arg constructor.
- **Immutability vs dirty tracking**: an entity must change state (update fields) so Hibernate can track changes (dirty checking) and flush them. The immutability of a {{record}} does not match that model.
- **Proxies for lazy loading**: Hibernate usually creates a proxy subclass to lazy load {{@ManyToOne}}/{{@OneToMany}}. A {{record}} is {{final}} and has no suitable constructor, so proxying it is not easy.
- **Complex lifecycle**: an entity has a lifecycle (managed/detached/removed) — immutability runs against that design.

### Best practice
- **Entity = stateful, has identity and a lifecycle** (may be mutable). Use a regular class.
- **DTO/record = data transfer, immutable, no complex business identity**.
- **As a Map key**: only when every component of the record is **itself immutable**.

> Senior tip: "an entity is about lifecycle and identity; a DTO/value object is about immutable data". Do not force a record into the entity role just because it is shorter — you would trade away lazy loading, proxies and dirty tracking.`,
    follow: ['Why does JPA need a no-arg constructor?', 'Can a record be used as a projection?', 'Why is a record a good Map key?']
  },
  'modern-027': {
    q: 'Parallel streams in production: when are they slower, the shared ForkJoinPool, side effects?',
    a: `**Summary:** {{Stream.parallel()}} runs on {{ForkJoinPool.commonPool()}}, the pool shared by the whole JVM. Sharing that pool means your parallel tasks compete for threads with everything else in the process. A parallel stream is genuinely useful only when the work is **CPU-bound**, the data set is large enough, nothing blocks, there are no side effects, and strict ordering is not required. In many I/O-bound or small-data cases it can be **slower** than the sequential stream.

### When it can be slower
- **Small data**: the overhead of splitting, forking and merging tasks is larger than the computation itself.
- **Blocking I/O**: calling blocking I/O (DB, HTTP, files) inside a parallel stream blocks threads of the {{commonPool}}. Because the shared pool is bounded, other important tasks in the same application are affected too.
- **Ordered streams**: operations that must preserve order add extra overhead.
- **Tasks that do not split well**: some sources cannot be divided efficiently, so most threads sit idle.

### Important notes
- **The shared ForkJoinPool**: the entire application uses it. Do not occupy the common pool with long blocking calls.
- **Side effects**: avoid mutating variables outside the stream (mutable shared state). Parallel streams do not guarantee order and easily produce race conditions. Always favour **stateless, non-interfering, side-effect-free** lambdas.

### Recommendations
- **Use it only for CPU-bound work** (pure computation, no waiting for I/O).
- **Measure before using it** (benchmark with real data).
- **If it is blocking I/O**: use {{CompletableFuture}} with a dedicated thread pool (a custom {{ExecutorService}}), or a reactive stack — not a parallel stream.

> Senior tip: "do not use parallel streams for I/O". Blocking inside the common pool is one of the most common causes of system-wide stalls.`,
    follow: ['How is ForkJoinPool.commonPool bounded?', 'Why is blocking I/O dangerous when using parallel streams?', 'When would you use CompletableFuture instead of a parallel stream?']
  },
  'core-032': {
    q: '{{equals}}/{{hashCode}} for JPA entities and with inheritance: use {{getClass()}} or {{instanceof}}? Why is putting an entity into a {{HashSet}} before {{persist}} a real bug?',
    a: `**Summary:** for a JPA entity, equality must stay stable across the transient → managed → detached lifecycle. If hashCode depends on a generated id (null before persist), an entity already added to a HashSet becomes "lost" once the id is assigned. For inheritance, {{getClass()}} is stricter than {{instanceof}} about symmetry, but Hibernate proxies have to be taken into account.

### The problem with a generated id
- Right after {{new Entity()}} the id is null. If hashCode is based on the id, two freshly created entities share the same hashCode (null) → they are treated as duplicates inside a HashSet.
- After {{persist}} the id is assigned → hashCode changes → the entry sits in the old bucket, and {{contains()}} and {{remove()}} cannot find it.
- This is a real bug: add the entity to a Set, persist it, then try to remove it → the removal silently fails and you leak memory.

### Business key
- Use an attribute that is unique, immutable, and already available at creation time (country code, a verified email).
- Example: {{Country.equals}} compares {{code}} (ISO 3166); no persist needed.
- Not every entity has a business key → in that case you need a different strategy.

### getClass() vs instanceof
~~~java
// getClass(): equal only when both objects have the same class
@Override public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    return Objects.equals(id, ((Entity) o).id);
}
// instanceof: lets a proxy (subclass) compare equal
if (!(o instanceof Entity e)) return false;
~~~
- {{getClass()}} guarantees symmetry: if a.equals(b) then b.equals(a) always holds. With {{instanceof}}, a subclass can equal a superclass while the superclass does not equal the subclass → symmetry is violated.
- But a Hibernate lazy proxy is a subclass of the entity, so {{getClass()}} treats the proxy and the real entity as different objects. That is why you need {{instanceof}} or {{Hibernate.getClass(o)}}.

### A safe strategy
~~~java
@Override public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Account e)) return false;
    return id != null && id.equals(e.getId());   // id null -> equal only to itself
}
@Override public int hashCode() {
    return Account.class.hashCode();   // stable, does not change when the id is assigned
}
~~~
- Never put associations or lazy collections into equals/hashCode (it triggers queries, recursion, N+1).
- Write tests: transient entity, managed entity, detached entity, proxy, two instances with the same id.

### Pitfall
- {{@Data}} (Lombok) generates a hashCode over every field including the id → the entity disappears from the Set after persist.
- Putting the entity in a Set before persist and then changing a field through a {{setter}} → hashCode changes.

> Senior tip: pick one rule for the whole system and pin it down with tests that use a HashSet before and after persist. Entity equality is an identity decision, not boilerplate.`,
    follow: ['Why does Hibernate recommend a business key rather than the id in equals/hashCode?', 'How do getClass() and instanceof differ in their effect on the symmetry of equals?', 'If an entity is already inside a HashSet before persist and its hashCode changes, how do you recover?']
  },
  'core-033': {
    q: 'Generics: PECS, type erasure, heap pollution, {{@SafeVarargs}} — and what they mean when you write a library/API?',
    a: `**Summary:** generics are checked at compile time and then erased (type erasure) from the bytecode. PECS is the rule for choosing a wildcard: Producer Extends, Consumer Super. Heap pollution happens when raw types are mixed with generics, so an array ends up holding elements of the wrong type. {{@SafeVarargs}} may only be applied to static/final/private methods and is a promise made by the author — the compiler cannot verify it.

### Type erasure
- {{List<String>}} and {{List<Integer>}} are both simply {{List}} in the bytecode; you cannot write {{new T()}}, {{instanceof T}}, or overloads that differ only in the type parameter.
- The compiler inserts casts and bridge methods to keep polymorphism working. The bridge method for {{Comparable}} is {{compareTo(Object)}} which calls {{compareTo(MyType)}}.
- Consequence: generic types cannot be checked at runtime; reflection does not carry complete generic information (but {{ParameterizedType}} metadata survives when it is declared on a class/field/method — Jackson exploits exactly this).

### PECS: Producer Extends, Consumer Super
- Generics are invariant: {{List<Integer>}} is not a subtype of {{List<Number>}}. If it were allowed, you could {{add(3.14)}} into a list of Integer.
- {{? extends T}}: you may only read a {{T}}, never write (except {{null}}) — use it for a producer.
- {{? super T}}: you may write a {{T}}, but reading yields only {{Object}} — use it for a consumer.
- {{?}} = {{? extends Object}}: read {{Object}}, no writes.
- The classic example: {{Collections.copy(List<? super T> dest, List<? extends T> src)}}.

### Heap pollution
- It occurs when a generic array holds an element of the wrong type, and because of erasure the runtime does not detect it.
- Example: {{List<String>[] = new List<?>[10]}} → assigning a {{List<Integer>}} into that array is a runtime error.
- Using a raw type ({{List}} without arguments) and then adding generic elements: {{list.add(123)}} succeeds because the raw type skips the checks, but {{list.get(0)}} blows up with a {{ClassCastException}} at the cast.
- {{@SafeVarargs}} is a promise: allowed only for static/final/private methods; if the method is not final and takes varargs of a generic array, a caller can write a different array into it and cause heap pollution later.

### When writing an API
- Use wildcards on inputs so callers can pass more kinds of arguments; use concrete types for outputs.
- Do not use raw types in a new API; they switch off compile-time checking and produce warnings.
- Avoid generic varargs in public methods when you cannot prove they are safe → take a collection instead of varargs.

> Senior tip: when designing a library, always use wildcards on input (PECS) and concrete types on output. {{@SafeVarargs}} is only a promise — if the method is not final/static/private, the compiler warns. Never create a generic array {{new T[]}}; use {{List<List<T>>}} or {{Array.newInstance}} plus a controlled cast.`,
    follow: ['Why can you not create a generic array new T[]?', 'How does heap pollution occur, and how do you detect it?', 'When do you use @SafeVarargs, and why only on static/final/private methods?']
  },
  'core-034': {
    q: '{{BigDecimal}} for money: scale, precision, {{RoundingMode}}, {{equals}} vs {{compareTo}}, division, and the "off by one cent" bug?',
    a: `**Summary:** money requires {{BigDecimal}} because {{double}}/{{float}} cannot represent decimal fractions exactly (0.1 + 0.2 ≠ 0.3). {{equals}} compares both scale and value; {{compareTo}} compares only the numeric value. A division that does not terminate must be given a scale and a {{RoundingMode}}. A wrong scale or rounding mode is what produces the one-cent discrepancy.

### Why not double
- {{double}} follows binary IEEE 754: a finite decimal (0.1, 19.99) is usually an infinitely repeating fraction in binary ⇒ accumulated rounding error.
- The classic example: {{0.1 + 0.2 = 0.30000000000000004}}; interest and discount calculations drift by cents and the drift adds up into a large number across thousands of transactions.
- Accounting and banking standards (ISO 4217, PCI DSS) require exact precision; {{double}} does not provide it.

### BigDecimal basics
~~~java
// Created from String — SAFE
BigDecimal price = new BigDecimal("19.99");

// Created from double — FORBIDDEN
BigDecimal bad = new BigDecimal(0.1);   // 0.10000000000000000555...
BigDecimal good = BigDecimal.valueOf(0.1); // uses Double.toString -> "0.1"
~~~
- Always use the {{String}} constructor or {{BigDecimal.valueOf(double)}}.
- {{scale}} = the number of digits after the decimal point; a negative scale means multiplying by 10^|scale|}.

### equals vs compareTo
~~~java
new BigDecimal("1.0").equals(new BigDecimal("1.00"));  // false (different scale)
new BigDecimal("1.0").compareTo(new BigDecimal("1.00")); // 0 (same value)
~~~
- {{equals}} compares both scale and value; {{compareTo}} compares only the numeric value.
- Use {{compareTo}} for business logic (comparing prices, checking negative/positive); use {{equals}} only when you need the exact representation (serialization).
- {{signum()}} returns -1/0/1, which is convenient in conditions.

### Division and the "off by one cent" bug
- {{divide(divisor)}} without an explicit scale throws {{ArithmeticException}} when the quotient is a non-terminating decimal.
- {{divide(divisor, scale, RoundingMode.HALF_UP)}} always states both the scale and the rounding mode.
- The "off by one cent" bug appears when: an intermediate {{double}} is used, or the rounding mode is wrong ({{HALF_DOWN}} where {{HALF_UP}} was meant), or the scales differ between calculation steps.
- Summing many amounts with percentages: rounding each line separately → the error accumulates. The correct way: keep the running total in {{BigDecimal}} and round once at the end.

### Production pitfalls
- Forgetting the {{divide}} overload with scale + rounding ⇒ a runtime exception the first time you divide 10 by 3.
- Storing in the database: a {{NUMERIC(19,4)}} or {{DECIMAL}} column; never {{FLOAT}}/{{DOUBLE}}. Hibernate mapping: {{@Column(precision = 19, scale = 4)}}.
- Multiple currencies: always carry the {{Currency}} (ISO 4217); never add or subtract across currencies.
- Write your own {{Money}} wrapper (record {{Money(BigDecimal amount, Currency currency)}}) with validation in the constructor; keep rounding, conversion and comparison logic in one place.

> Senior tip: write a {{Money}} wrapper with validation in the constructor; centralise rounding, conversion and comparison so that {{RoundingMode.HALF_UP}} is not scattered throughout the codebase. For financial reporting, {{RoundingMode.HALF_EVEN}} (banker's rounding) is the accounting standard, but it must be applied consistently across the whole system.`,
    follow: ['Why does BigDecimal("1.00").equals(BigDecimal("1.0")) return false?', 'When do you use RoundingMode.HALF_EVEN instead of HALF_UP?', 'How do you avoid the off-by-one-cent bug when summing many amounts with percentages?']
  },
  'collections-029': {
    q: '{{Iterator}} fail-fast, {{ConcurrentModificationException}} in a single thread, {{removeIf}} and {{CopyOnWriteArrayList}}: when is each appropriate?',
    a: `**Summary:** a fail-fast iterator checks {{modCount}} and throws {{ConcurrentModificationException}} when the collection is modified outside the iterator. Fail-safe (weakly consistent) collections such as {{ConcurrentHashMap}}, or snapshot collections such as {{CopyOnWriteArrayList}}, do not throw, but they may show stale or incomplete data.

### How fail-fast works
- {{ArrayList}}, {{HashMap}}, {{HashSet}} and friends keep a {{modCount}} field that is incremented on every structural change.
- The iterator stores {{expectedModCount}}; each {{next()}}/{{remove()}} compares the two and throws CME immediately on a mismatch.
- This is **best-effort detection**, not a synchronisation mechanism: it does not guarantee that every case is caught, especially across threads.
- CME can occur in **a single thread**, when you combine a for-each with {{list.remove(x)}} or {{map.put}}.

### Predicting the output
~~~java
List<String> l1 = new ArrayList<>(List.of("a", "b", "c"));
for (String s : l1) {
    if (s.equals("a")) l1.remove(s);
}
// Throws ConcurrentModificationException

List<String> l2 = new ArrayList<>(List.of("a", "b", "c"));
for (String s : l2) {
    if (s.equals("b")) l2.remove(s);
}
System.out.println(l2);
// Output: [a, c]   -> NO exception thrown, and "c" is never checked
~~~
Why case 2 does not fail: after removing "b" the size is 2 and the iterator's {{cursor}} is also 2. {{hasNext()}} only checks {{cursor != size}}, so it returns false and the loop ends before {{next()}} gets a chance to check {{modCount}}. The code "runs fine" but silently skips the last element — a bug more dangerous than CME.

### removeIf — the standard solution
~~~java
orders.removeIf(Order::isExpired);
balances.entrySet().removeIf(e -> e.getValue().signum() == 0);
~~~
- {{removeIf}} (Java 8+) is O(n) overall, compacts the array once, and is safe both logically and in performance terms.
- {{Iterator.remove()}} is still the right tool when you need complex logic (audit before deleting), but each removal is O(n) for an ArrayList, so the total can become O(n²).

### CopyOnWriteArrayList
- Every write operation ({{add}}, {{set}}, {{remove}}) builds a new array and then swaps a {{volatile}} reference; reads take no lock.
- The iterator is a **snapshot**: it never throws CME, it has no {{remove}}, and it may show stale data.
- Writes cost O(n) in both time and memory; continuous writes ⇒ very heavy GC pressure.
- Fits: a listener/observer list that rarely changes, read-mostly configuration. Does not fit: caches, queues, large collections updated frequently.

### How to avoid it
- Modify through the iterator ({{it.remove()}}, {{it.set()}}).
- Use {{removeIf}}, {{replaceAll}}, {{computeIfPresent}}.
- For maps, use {{entrySet().removeIf}} or {{map.compute}} instead of removing inside a for-each.
- Across threads: use the right concurrent collection, or copy into a new list before iterating when a snapshot is enough.

### Pitfall
- Catching CME and ignoring it hides a bug; CME is a signal of wrong logic, not a transient error to retry on.
- Iterating a {{subList}} while modifying the backing list also throws CME.
- Modifying a collection inside its own {{forEach}} also throws CME (unless it is a concurrent collection).

> Senior tip: in code review, prefer {{removeIf}}/{{computeIfAbsent}} — they are shorter and CME-free; with ConcurrentHashMap, do not rely on {{size()}} to stop a loop under concurrency — use the return value of the operation or count locally. For large batches, switching from an {{Iterator.remove}} loop to {{removeIf}} can take the runtime from several seconds down to a few milliseconds.`,
    follow: ['Why can a for-each loop throw ConcurrentModificationException?', 'How does Iterator.remove() differ from collection.remove()?', 'Why does a CopyOnWriteArrayList iterator never throw CME?']
  },
  'collections-030': {
    q: 'Sorting/comparison: {{Comparator}} chaining, nullsFirst/nullsLast, "consistent with equals", and elements "disappearing" from a {{TreeMap}} when the comparator is wrong?',
    a: `**Summary:** {{TreeMap}}/{{TreeSet}} use {{compare()}} to define order; they do not use {{equals}}/{{hashCode}}. If a comparator is not consistent with equals (it returns 0 while equals is false), the map or set treats two different keys as one and loses data silently. A comparator must be symmetric, transitive, and ideally consistent with equals.

### Comparator chaining
~~~java
// Sort by: status ASC, createdAt DESC, name ASC
Comparator<Order> cmp = Comparator
    .comparing(Order::getStatus)
    .thenComparing(Order::getCreatedAt, Comparator.reverseOrder())
    .thenComparing(Order::getName, Comparator.nullsFirst(String::compareTo));
orders.sort(cmp);
~~~
- {{comparing}}: a key extractor plus an optional key comparator.
- {{thenComparing}}: appends another comparator used as a tie-breaker.
- {{nullsFirst}}/{{nullsLast}}: wrappers around a delegate comparator that treat null as the smallest/largest value.
- {{comparingInt}}/{{comparingLong}}/{{comparingDouble}} avoid boxing.

### Consistent with equals
- The rule: {{compare(a, b) == 0}} if and only if {{a.equals(b)}}.
- If the comparator returns 0 but equals is false, {{TreeMap}} considers them the same key: {{put(b, ...)}} overwrites the value of {{a}}, {{size()}} does not grow, and {{get(b)}} returns the value of a.
- Classic example: {{new TreeSet<>(Comparator.comparing(String::length))}} — "ab" and "cd" both have length 2, so only one of them is kept.
- {{BigDecimal}} is the famous trap: {{new BigDecimal("1.0").equals(new BigDecimal("1.00"))}} is false but {{compareTo}} is 0 ⇒ using them as TreeMap keys merges them.

### How TreeMap "loses" elements
- {{TreeMap}} does not use {{equals}}/{{hashCode}} to identify a key; it uses {{compare()}}.
- If the comparator is not symmetric or not transitive, the red-black tree can end up unbalanced, or searches can take a wrong path.
- Nulls: {{TreeMap}} rejects a null key unless the comparator handles null; natural ordering throws NPE.
- {{subMap}}, {{headMap}} and {{tailMap}} are views — changing a view changes the backing map.

### Pitfall
- A comparator built on nullable fields without null handling: {{a.getName().compareTo(b.getName())}} throws NPE, or breaks transitivity once nulls appear.
- Faulty comparison logic: {{(a, b) -> a.x < b.x ? -1 : 1}} (the equal case, which must return 0, was forgotten).
- Comparing float/double containing NaN: {{Double.compare}} handles NaN, but a hand-written {{a < b ? -1 : 1}} is wrong for NaN.
- Sorting primitive arrays is not stable: {{Arrays.sort(int[])}} uses quicksort; for a stable sort use {{Integer[]}} or {{List.sort}}.

> Senior tip: when you use a custom comparator, write a unit test asserting that **different** keys remain separate elements; this class of bug throws no exception, it only drops records, and it is extremely hard to find. For BigDecimal, always normalize ({{stripTrailingZeros}}) before using it as a key. For large data, use {{comparingInt}}/{{comparingLong}} to avoid boxing. Do not hand-write complex comparison logic — chain the ready-made comparators.`,
    follow: ['What is the difference between Comparable and Comparator?', 'Why does TreeMap not use equals/hashCode?', 'What problems does a comparator that is not consistent with equals cause?']
  },
  'modern-028': {
    q: 'Virtual threads (Java 21) for an I/O-bound service: when to use them, how to migrate, pinning, {{ThreadLocal}}, and bounding concurrency with a {{Semaphore}}?',
    a: `**Summary:** a virtual thread (VT) is a thread the JVM creates at extremely low cost (just an object on the heap, with its stack stored as chunks). VTs suit I/O-bound code (database calls, HTTP, files, message queues) because when a VT blocks (on {{socket.read}}, for example) the JVM can unmount its stack to the heap and reuse the carrier thread for another VT. Pinning happens when a VT runs inside a {{synchronized}} block or calls a native method — the carrier thread then cannot be released. {{ThreadLocal}} across millions of VTs costs a lot of memory. A {{Semaphore}} is still needed to bound concurrency towards downstream systems (DB connection pool, API rate limit).

### VT vs platform thread
- Platform thread: one thread corresponds to one OS thread; expensive (1 MB stack, context switch performed by the OS).
- Virtual thread: thousands or millions of VTs run on a small number of platform threads (carrier threads). A blocked VT does not block its carrier thread.
- What VTs solve: writing naturally blocking code ({{Thread.sleep}}, synchronized, blocking I/O) in the obvious way while still scaling to high concurrency.

### Migrating
- Use {{Executors.newVirtualThreadPerTaskExecutor()}} in place of {{Executors.newFixedThreadPool}}.
- Spring Boot 3.5+ supports VTs through {{spring.threads.virtual.enabled=true}} (it automatically uses VTs for {{@RestController}}).
- VTs are not faster for CPU-bound work: if the code is heavy computation, VTs add nothing; you still need to spread the work across cores.

### Pinning
- Pinning occurs when a VT runs inside a {{synchronized}} block or calls a native method: the JVM cannot unmount the VT because the stack may still be reachable from native code.
- Solution: use {{ReentrantLock}} instead of {{synchronized}} (especially in critical code paths).
- From Java 24, pinning is largely removed thanks to improvements (JEP 487: Silently absorb pinning events; JEP 491: virtual thread-friendly synchronized).

### ThreadLocal and ScopedValue
- {{ThreadLocal}} across millions of VTs creates millions of entries → heavy memory use and possible leaks.
- {{ScopedValue}} (Java 20 preview; finalized in 24) is the safer replacement: values are carried by scope rather than one entry per VT.
- If you must use ThreadLocal: restrict it to short-lived data, and clean up with {{remove()}}.

### Semaphore and bounding concurrency
- VTs do not bound their own concurrency: creating 10,000 VTs is no problem, but 10,000 database connections are.
- Use a {{Semaphore}} to limit the number of simultaneous requests to a downstream system (connection pool, rate limit).
- Example: a {{Semaphore(20)}} to allow at most 20 concurrent requests against the core banking API.

### Pitfall
- Using VTs for CPU-bound work: no benefit, only slower because of unmount/mount overhead.
- Blocking a VT inside {{synchronized}}: the carrier thread is held, and throughput drops.
- Forgetting to bound concurrency: too many database connections opened → the connection pool is exhausted.
- Debugging long stack traces, because a VT stack is a combination of the carrier stack and virtual stack chunks.

> Senior tip: use VTs for all I/O-bound code, but always measure: the number of connections/thread pools towards downstream, CPU usage, and memory. If the downstream already has a connection pool (for example HikariCP with max 20), set a matching {{Semaphore}} to avoid overflow. VTs do not replace architecture, they only make blocking code easier to write. For a service running today, enabling VTs can reduce p99 latency noticeably under load, because the thread-creation overhead disappears.`,
    follow: ['What is pinning, and when does it happen?', 'Why is ReentrantLock better than synchronized with virtual threads?', 'When do you still need to bound concurrency even with virtual threads?']
  },
  'modern-029': {
    q: '{{Optional}} used correctly and incorrectly, {{Stream}} anti-patterns in production, {{peek}}, and {{collect(toMap)}} with duplicate keys?',
    a: `**Summary:** {{Optional}} is a **return type** that forces the caller to deal with "there may be nothing"; do not use it as a field, a parameter, or a collection element. The main Stream anti-pattern is side effects (dumping results into an external list, using {{peek}} for business logic). {{peek}} is for debugging only and the JVM may skip it. {{collect(toMap)}} throws {{IllegalStateException}} on a duplicate key when no merge function is supplied.

### Optional done right
- A method whose result may be absent: {{Optional<User> findById(long id)}}.
- Processing chains: {{optional.map(User::email).filter(s -> !s.isBlank()).orElse(DEFAULT)}}.
- {{orElseThrow(() -> new NotFoundException(...))}} turns absence into an explicit error.
- {{ifPresent}}, {{ifPresentOrElse}} (Java 9), {{stream()}} (Java 9) to convert into a stream.

### Where Optional does not belong
- **Fields** of an entity/DTO: not Serializable, awkward for JPA/Jackson mapping (needs a module), adds complexity; use null plus validation.
- **Method parameters**: the caller has to wrap pointlessly in {{Optional.of(...)}}; use overloads or validate null.
- **Collections**: {{List<Optional<T>>}} is usually a sign that nulls should be filtered out; return an empty list instead of an empty Optional.
- **Primitives**: use {{OptionalInt}}/{{OptionalLong}}/{{OptionalDouble}} to avoid boxing.

### orElse vs orElseGet
~~~java
// orElse: the argument is computed IMMEDIATELY, even when the Optional holds a value
User u1 = opt.orElse(loadFromDb());       // always calls the DB -> wasteful

// orElseGet: the supplier is called only when empty
User u2 = opt.orElseGet(() -> loadFromDb());
~~~
- {{orElse}} takes a value that already exists; if producing it allocates an object or reads from the DB, use {{orElseGet}}.
- {{orElseThrow()}} (Java 10) throws {{NoSuchElementException}}; the variant with a supplier throws a custom exception.

### Stream anti-patterns
- **Side effects**: a lambda that changes state outside the stream (adding into a list, incrementing a counter, writing logs, calling the DB). It appears to work on a sequential stream but is **wrong once switched to parallel** (lost elements, wrong totals, sometimes exceptions).
- Using {{forEach(x -> list.add)}} or a one-element array {{int[] total}}: both are side effects.
- Rewrite as {{map(...).toList()}}, {{collect(...)}}, {{mapToLong(...).sum()}}, {{reduce}}.

### peek is for debugging only
- {{peek}} is an intermediate operation meant for inspecting data mid-pipeline; the JVM is allowed to skip it (for example {{count()}} on a source of known size, from Java 9 onward, does not run the pipeline).
- Do not use {{peek}} for business logic (updating state, writing to the DB) — if the terminal operation changes, that logic can disappear.

### collect(toMap) and duplicate keys
~~~java
// Wrong: duplicate key -> IllegalStateException
Map<String, User> byEmail = users.stream()
    .collect(Collectors.toMap(User::email, u -> u));

// Right: decide which record wins
Map<String, User> byEmail = users.stream()
    .collect(Collectors.toMap(
        User::email,
        u -> u,
        (a, b) -> b,              // or merge by updatedAt
        LinkedHashMap::new));     // keep order if needed
~~~
- Duplicate key: without a merge function it throws {{IllegalStateException}} ("Duplicate key ...", and from Java 9 both values are included).
- Null value: **NPE** — the two-argument form checks {{requireNonNull(value)}}, and the merge-function form uses {{Map.merge}}, which forbids null values; filter with {{filter(Objects::nonNull)}} or substitute a sentinel.
- Null key: {{HashMap}} accepts it (the hash of null is 0) but {{ConcurrentHashMap}} does not; do not rely on null keys, filter them or guarantee non-null keys.

### Production pitfalls
- {{Optional.get()}} without a check ⇒ {{NoSuchElementException}}, equivalent to a null but harder to debug. Use {{orElseThrow}} with a message.
- {{opt.isPresent()}} followed by {{get()}} is a null check in disguise; prefer {{map}}/{{ifPresent}}.
- Comparing {{opt == Optional.empty()}} is wrong; use {{isEmpty()}} (Java 11) or {{isPresent()}}.
- {{Optional}} inside a JPA entity breaks mapping; in Jackson it needs {{Jdk8Module}}.
- Reaching for {{Optional}} everywhere makes code tangled and slower; sometimes a controlled null plus {{@Nullable}} is the more pragmatic choice.

> Senior tip: use {{Optional}} at the service/repository layer, and convert it to a value or an explicit error at the controller/DTO layer. Never wrap a collection in Optional — return an empty {{List.of()}} so the caller does not have to handle two levels of "nothing". In streams, prefer {{toList()}} for an immutable result and {{toCollection(ArrayList::new)}} when the result must be mutable. With toMap, always assume keys can collide and values can be null; write an explicit merge function (for example keep the newest by timestamp) instead of letting an exception blow up in production. For reports, use {{LinkedHashMap}}/{{TreeMap}} so the ordering stays stable between runs.`,
    follow: ['Why should Optional not be used as a field?', 'Should peek() be used to mutate objects, and why or why not?', 'When does Collectors.toMap throw IllegalStateException, and how do you solve it?']
  }
});
