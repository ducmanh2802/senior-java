/*
 * English translation of js/data/q-java.js — task T165. Format: js/core/i18n.js (content overlay).
 * ids: modern-016 core-027 core-028 core-029 core-030 core-031
 */
App.i18n.content({
  'modern-016': {
    q: 'Stream or for loop: compare performance, readability, and maintainability. When do you not use stream, and what guideline do you set for the team?',
    a: `**Summary:** For performance, with most business code (a few hundred to a few thousand elements with DB/network calls), the difference between stream and for is negligible compared to IO. Stream has fixed costs (pipeline creation, lambda) and easily hits boxing, so in hot loops over large data, for with primitives is usually faster or equal; measure with JMH instead of guessing. The main benefit of stream is **readability** with filter/map/group. I use for when complex break, checked exception, multiple variable updates, or index-based work is needed.

### Why stream isn't "automatically faster"
- Each pipeline creates a few objects (stage, spliterator, sink), and lambda capture creates objects each run. With 10-element list called millions of times/sec, fixed cost dominates.
- {{Stream<Integer>}} boxes/unboxes each element; {{IntStream}}/{{LongStream}} avoid this.
- JIT optimizes simple for loops very well (loop unrolling, vectorization). Multi-layer stream pipeline is harder to fully inline; but when JIT can inline, difference is small.
- {{parallel()}} isn't free: splits work, merges results, runs on {{ForkJoinPool.commonPool()}} shared by JVM.

~~~java
// Three ways to sum: difference is boxing, not "stream vs for"
long s1 = 0;
for (long v : amounts) s1 += v;                       // primitive, fastest stable
long s2 = Arrays.stream(amounts).sum();               // LongStream: nearly equivalent
long s3 = list.stream().reduce(0L, Long::sum);        // Stream<Long>: boxes each element
~~~

### When for is clearer than stream
~~~java
// Checked exception in lambda: must wrap, loses conciseness
List<String> contents = paths.stream().map(p -> {
    try { return Files.readString(p); }
    catch (IOException e) { throw new UncheckedIOException(e); }
}).toList();

// Multiple result variables + early stop by condition: for is more natural
BigDecimal total = BigDecimal.ZERO;
int failed = 0;
for (Txn t : txns) {
    if (t.isCutOffMarker()) break;              // early stop by business logic
    if (t.isFailed()) { failed++; continue; }
    total = total.add(t.amount());              // lambda can't reassign local variable
}
~~~

### Decision table
| Scenario | Choose | Reason |
|---|---|---|
| Filter, transform, group business data | Stream | Short, clearly states intent |
| Find first element / check existence | Stream ({{anyMatch}}, {{findFirst}}) | Short-circuit |
| Hot loop over large primitive array | For (or {{IntStream}}) | Avoid boxing and pipeline cost |
| Need index, traverse two lists in parallel | For | Stream has no natural index |
| Throw checked exception, break by many conditions | For | Lambda doesn't fit |
| Multiple accumulators at once | For (or separate collector) | Lambda only captures effectively final |
| CPU-heavy, very large data, can split | Consider parallel, with benchmark | Don't use in request handler |

### Common wrong answers
- "Stream is faster because it runs in parallel": stream is sequential by default.
- "Stream is slow, so ban it": with IO-bound code, the difference is noise; banning stream only makes code longer and more error-prone.
- "Use {{parallelStream}} for slow API": if slow due to DB/HTTP, parallel stream just consumes commonPool and can block others.

### Production pitfall
- {{parallelStream()}} calling repository inside request handler: under high load commonPool is blocked by IO, and {{CompletableFuture}} default also slows.
- Long 20-line pipeline with multi-layer lambdas: hard-to-read stack traces, hard to debug; split into named methods.
- Reusing a {{Stream}} already consumed throws {{IllegalStateException}}; stream is not a collection.

> Senior tip: guideline I often set for the team: (1) stream is default for data transformation, each lambda short, no side effects; (2) for complex control logic and hot paths shown by profiler; (3) prohibit {{parallelStream}} in request-handling code without JMH benchmark and separate review. Rule "measure before optimizing" matters more than any stream-vs-for debate.`,
    follow: [
      'How would you write a JMH benchmark to correctly compare stream and for (warmup, dead-code elimination)?',
      'Parallel stream splits work based on what? Why does {{LinkedList}} or {{Stream.iterate}} split poorly?',
      'If lambda doesn\'t capture variables, does it create new objects each time?'
    ]
  },
  'core-027': {
    q: 'A record containing {{List}} is used as a key in a cache: does the record guarantee deep immutability and a stable hash? How would you design a domain value object?',
    a: `**Summary:** A record makes its component fields final and generates equals/hashCode from the components; it does not turn a referenced object into an immutable one. If a component is a mutable collection, the caller can still change its content and change the key's hash after it has been put into the cache.

### What record guarantees
- A record is a data carrier: components are stored in final fields, and accessors plus equals/hashCode/toString are generated from the header. A compact constructor allows validating and normalizing data.
- A final reference does not mean deep immutability. {{List<String>}} can be modified; the record keeps exactly the reference it received.
- A record cannot extend another class and automatically inherits {{java.lang.Record}}; it suits closed value objects, not entities that need identity or an ORM lifecycle.

~~~java
record OrderKey(String tenant, List<String> regions) {
    OrderKey {
        // Copy so the caller cannot modify the list after creating the key.
        regions = List.copyOf(regions);
    }
}
~~~

### Record vs sealed hierarchy
- Use a record for small values whose equality is based on all data: coordinates, normalized money, immutable command.
- Use a sealed interface when the domain state has a finite set of variants, such as {{PaymentResult}} with {{Accepted}}, {{Declined}}, {{Pending}}. When adding a variant, the compiler helps check switch exhaustiveness.
- Don't force every domain object into a record: entities often need a stable identity across the lifecycle, and ORM needs proxies/lazy loading; inheritance mapping with records does not fit either.

### Pitfall
- {{List.copyOf}} creates an unmodifiable structural snapshot, but it does not deep-copy if the elements are mutable.
- Equality by all components can make a record key too broad; two logically identical versions with different metadata become different keys.
- Normalize before creating the record, such as money scale and case of codes; {{BigDecimal.equals}} distinguishes scale.

### Inside: what the record generates
With {{record Key(String tenant, List<String> tags)}}, the compiler generates a {{private final}} field, an accessor, a canonical constructor, and {{equals}}/{{hashCode}}/{{toString}} based on the **current value** of each component (the record's {{hashCode}} calls {{tags.hashCode()}} every time). "final" only locks the **reference** to the list, not the list's content. If a caller modifies the list after the record has become a key in a {{HashMap}}, the hash changes, the entry stays in the old bucket, {{get}} cannot find it, {{containsKey}} returns false, yet the entry still occupies memory (leak). A compact constructor with {{List.copyOf}} solves this: copy once, real immutability.

### Real-world example
A search-result cache used {{record SearchKey(String query, List<String> filters)}}. The controller reused one {{ArrayList}} of filters across several processing steps and added a default filter **after** the key had already been put into the cache -> cache hit rate was only 12% instead of the expected ~60%, and the heap grew steadily because the "lost" entries were never retrieved again (the cache had no size limit). Fix: compact constructor {{filters = List.copyOf(filters)}} and bound the cache with Caffeine. Hit rate rose to 58% and the heap stabilized.

### Sample interview answer
"Record guarantees only shallow immutability: components are private final and equals, hashCode, toString are generated from the current value of each component. If a component is a mutable List, the caller can still modify the list's content after the record is created, and when that record is a key in a cache, hashCode changes, the entry sits in the wrong bucket and can never be found again - both losing cache hits and leaking memory. So for domain value objects I use a compact constructor to validate and copy: List.copyOf, or an already-immutable type like String, LocalDate, BigDecimal. I like record for value objects because it is concise and equality is by value; when I need multiple variants I combine a sealed interface with records."

> Senior tip: before using a value object as a map key, check that every component is deeply immutable and test the case where the caller modifies the input data. For a JPA entity, determine equality by business identity first; don't let a generated id stay null and then change the hash after persist.`,
    follow: [
      'Why is a record not naturally suitable as a JPA entity?',
      'What benefit does a sealed interface provide when modeling a domain result with a finite set of states?'
    ]
  },
  'core-028': {
    q: 'A cache holds millions of repeated Strings and a heap dump shows many identical byte arrays. How do you weigh compact strings, String deduplication, and intern?',
    a: `**Summary:** Compact Strings reduce the bytes stored for Latin-1 content directly inside each String; GC String deduplication makes different String objects share an identical backing byte array; {{intern()}} canonicalizes the whole object and pays the cost of a table lookup. Decide from the heap profile and a benchmark of your workload; don't switch on all three out of intuition.

### Three different mechanisms
- Since Java 9, {{String}} stores its content in a {{byte[]}} plus a coder: Latin-1 content usually takes one byte per character, while content that needs UTF-16 takes two. This is the default String representation, not a flag you enable separately.
- The GC can find equal Strings (that have survived a few GC cycles) and make them share one backing array; the String objects themselves stay separate. Enable it with {{-XX:+UseStringDeduplication}}, which is off by default and costs CPU. JDK 17 supports it only with G1 and Shenandoah; from JDK 18 it also supports Serial, Parallel and ZGC.
- {{String.intern()}} returns the canonical instance from the string table. Every caller uses exactly that instance, but the lookup and pool management also cost time; with high-cardinality data it can become a contention point and retain extra structure.

### When to consider it
1. Measure retained heap: if most of the size is Latin-1 content, compact strings already help by default.
2. If many different String objects hold the same content, try dedup on staging, then measure CPU, pauses and heap after GC.
3. Use intern only for a small, highly repeated set with clear boundaries, such as schema names; avoid it for request ids or user data with high cardinality.

~~~bash
# JDK 17 + G1
-XX:+UseStringDeduplication -Xlog:gc+stringdedup=debug
# JDK 18+ (new log tag)
-XX:+UseStringDeduplication -Xlog:stringdedup*=debug
jcmd <pid> GC.heap_info
~~~

The dedup log reports how many strings were inspected and deduplicated and how many bytes were saved; compare that with throughput and p99 instead of only looking at the smaller heap.

### Operational pitfalls
- Dedup does not reduce the number of String objects, it only shares the content array; if object and reference overhead dominates, the benefit is small.
- Running dedup can add CPU load and extra GC work. A heap snapshot at one moment also easily leads to wrong conclusions if the workload is not stable.
- Don't rely on fixed object layout details across JDK versions; compressed oops, alignment and the object header affect the real size.

### Real-world example
A product-suggestion service kept 6 million attribute objects in cache; the heap dump showed 2.3GB of {{byte[]}} for Strings, of which about 70% was duplicate content (color names, sizes, brands). The team tried three approaches on a simulated load:
- Enable {{-XX:+UseStringDeduplication}} (G1): heap after GC dropped by about 1.1GB, GC CPU rose about 3%, no code change - but it only applies to Strings that survived a few GC cycles (default age 3), so the benefit accrues slowly after each cache load.
- {{intern()}} the attribute fields at parse time: reduced about 1.5GB because it deduplicates the whole String object, but cache-load time rose 18% due to StringTable lookups.
- Normalize with a **dedicated HashMap** per attribute type (self-canonicalize, bounded): reduced about 1.5GB, faster load than intern, and easier to measure.
The team chose the third option for known data, keeping String Deduplication as a safety net for the rest.

### Sample interview answer
"Three mechanisms solve three different things. Compact Strings, default since Java 9, halves memory for Latin-1 strings because each character takes one byte, with nothing to do. G1 String Deduplication lets different String objects share one byte array, runs in the background and needs no code change, but costs a little GC CPU and only applies to strings that survived a few GC cycles. intern merges whole String objects into the JVM's canonical table, reducing the most, but costs table-lookup time and the table can bloat if data is not repeated. I decide from a heap dump and benchmark: measure what percentage of strings are duplicates and how long they live. Usually I self-canonicalize known fields at parse time, or switch to an enum, and let String Deduplication be the safety net."

> Senior tip: set a measurable target, e.g. cut retained heap by 10% while CPU stays under an agreed threshold; test with representative traffic and keep a rollback path through the JVM flag.`,
    follow: [
      'What does String dedup share, and what does it not share?',
      'Why is intern not a general-purpose string cache?'
    ]
  },
  'core-029': {
    q: 'How do you design equals/hashCode for a JPA entity with a generated id so the entity does not disappear from a HashSet after persist?',
    a: `**Summary:** Entity equality must stay stable across the lifecycle transient → managed → detached. If hashCode depends on a generated id that is null and then changes after persist, an entity already inside a HashSet ends up in the wrong bucket; pick an immutable business key or a class-stable strategy with awareness of collisions.

### Two common strategies
- **Business key**: use an attribute that is unique, immutable and available from the moment the entity is created, such as a country code. Equality stays stable, but not every entity has such a key.
- **Generated id**: the obvious choice, but the id is null before persist. If equals treats two null ids as equal, or hashCode changes when the id is assigned, collections break.
- Some systems compare by id only when the id is non-null, while hashCode stays stable per class. This keeps the bucket stable, but many entities of the same class collide; measure before treating that as a problem.

### Hibernate proxy
- Hibernate's lazy proxy is a **subclass** of the entity (generated with ByteBuddy). So {{getClass() != o.getClass()}} treats a proxy and the real entity row as different objects; use {{instanceof}} or {{Hibernate.getClass(o)}} (which unwraps the proxy and returns the real class).
- In equals, read the other object's id through the **getter** ({{other.getId()}}), not the field directly: the proxy's field is not initialized, and only the getter is forwarded by the proxy.
- Avoid making a pure domain depend on the Hibernate API when {{instanceof}} is enough.

~~~java
@Override public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Account other)) return false; // proxy is a subclass, so it still matches
    return id != null && id.equals(other.getId());   // null id (not persisted yet) => equal only to itself
}
@Override public int hashCode() {
    return Account.class.hashCode(); // constant: does not change when the id is assigned
}                                     // (do not use getClass(): a proxy returns a different class)
~~~
- Do not put associations or lazy collections into equals/hashCode: it easily triggers unexpected queries, two-way recursion or N+1.

### Decision
Write tests for a new entity, after persist, with a proxy, detached, and with two instances that have the same id. Do not use mutable fields, timestamps or the whole object graph.

### Inside: why the entity "disappears" from a HashSet
{{HashSet}} places an object into a bucket based on {{hashCode()}} **at the time of add**. A new entity has {{id = null}} -> if {{hashCode()}} is based on the id, the hash is that of null (for example 0). After {{persist}} and flush, Hibernate assigns id = 42 -> {{hashCode()}} is now different, but the object is still in the old bucket. {{set.contains(entity)}} looks in the new bucket -> false; {{set.remove(entity)}} cannot remove it. With {{@OneToMany Set<Item>}}, Hibernate can add duplicates or fail to remove a child. The common approach (following Vlad Mihalcea's guidance): {{equals}} compares ids when the id is non-null, and {{hashCode()}} returns a **constant per class** ({{getClass().hashCode()}}) - all entities of the same type share one bucket (acceptable only for small collections), which is safe across the whole lifecycle. If there is an immutable business key (order code, account number), use it instead.

### Real-world example
An order had a {{Set<OrderLine>}}; {{OrderLine}} used Lombok {{@Data}} (equals/hashCode over every field, including id and associations). After adding a line and saving: after flush the hash changed; calling {{lines.remove(line)}} to delete the just-added line had no effect - customers were charged for items removed from the cart (about 90 orders in one day). Also {{@Data}} called {{toString}} on two-way associations causing {{StackOverflowError}} in logs. Fix: remove {{@Data}} from the entity, write equals/hashCode with the "id + class constant" pattern, make {{toString}} print only the id; add a test persist -> contains -> remove.

### Sample interview answer
"The problem is that a new entity has a null id, and if hashCode is based on the id, then after persist Hibernate assigns an id, hashCode changes, while the HashSet already placed the object in a bucket based on the old hash - so contains and remove cannot find it again. Entity equals and hashCode must stay stable across the whole lifecycle: transient, managed, detached. If there is an immutable business key such as an order code, I use it. Otherwise I use the common pattern: equals compares ids when the id is non-null, and hashCode returns a constant per class - safe across the whole lifecycle, at the cost of all entities of the same type sharing one bucket, which only fits small collections. Care is needed with Hibernate proxies: comparing class with getClass can be wrong for a proxy, so use instanceof or get the real class. And absolutely never use Lombok @Data on an entity."

> Senior tip: choose the rule once for the whole system and verify it with tests on a HashSet before and after persist; entity equality is an identity decision, not just boilerplate.`,
    follow: [
      'Why should a lazy association stay out of hashCode?',
      'What trade-off does a class-stable hashCode have?'
    ]
  },
  'core-030': {
    q: 'A domain has three finite result states and the team wants an exhaustive switch. How do you model it with a sealed interface and records, and how do you keep version compatibility?',
    a: `**Summary:** A sealed interface directly limits which subtypes are allowed; a record fits each immutable data variant. Sealed classes are standard since Java 17, and pattern matching for switch is standard since Java 21 (JEP 441), so the compiler can check that a switch is exhaustive without a {{default}} branch. The price: adding a variant is a breaking change for every consumer and must be managed like an API change.

### Model
- Declare a sealed interface with explicit permits, then create a record for each result such as Accepted, Rejected and Pending.
- A consumer switch over the parent type must handle every known branch; the compiler reports the missing branch when you recompile.
- Record components must be deeply immutable if the object is shared; a record only guarantees that the field reference is final.

~~~java
sealed interface Result permits Accepted, Rejected {}
record Accepted(String id) implements Result {}
record Rejected(String reason) implements Result {}

String describe(Result r) {
    return switch (r) {              // no default needed: the compiler knows both branches
        case Accepted a -> "OK " + a.id();
        case Rejected x -> "Rejected: " + x.reason();
    };
}
~~~

### Module boundaries
- Every permitted subtype must be declared {{final}}, {{sealed}} or {{non-sealed}} (records are final by default). If the sealed interface lives in a named module, the subtypes must be in the same module; if it is in the unnamed module (classpath), they must be in the same package. {{permits}} can be omitted when all subtypes are in the same file.
- When you add a subtype, recompile the consumers to catch switches missing a branch. Consumers already compiled against the old version still run, but when they meet the new variant the exhaustive switch throws {{MatchException}} at runtime; if the protocol or version can expand independently, design a fallback (for example an {{Unknown}} variant).
- Java 21 pattern matching for switch is a standard feature; StructuredTaskScope in Java 21 is still preview. Do not mix these two stability levels.

### When to use
Fits an algebraic data type with a finite set of variants inside one bounded context. Does not fit when a third-party plugin must add subtypes or the hierarchy is an open API extension.

### Real-world example
A payment result was modeled as {{sealed interface PaymentResult permits Approved, Declined, Pending}} with three records. In Java 21 the controller used a pattern-matching {{switch}} without {{default}}. When the business added {{RequiresOtp}}, the compiler reported errors at **11 switch sites** that did not handle the new state - the team fixed all of them before release. Previously, with an enum plus {{default -> throw}}, a similar addition only surfaced at runtime (2 flows threw exceptions in production). Another lesson: a different service used an older client library that did not know {{RequiresOtp}} - JSON carrying the new type failed deserialization; the team added an "Unknown" type at the API boundary so old clients would not break.

### Sample interview answer
"With a finite set of results, I use a sealed interface that declares permits for the variants, each variant being an immutable record carrying exactly its own data, e.g. Approved has the transaction code, Declined has the reason. Sealed has been standard since Java 17, pattern matching for switch since Java 21, so a switch over a sealed interface is fully checked by the compiler without needing a default. The biggest benefit is that when you add a new variant, every switch that does not handle it fails to compile, instead of falling into a default at runtime. The price is that the variants must live in the same package or module, and at system boundaries such as JSON or messages, old clients do not know the new variant, so I add an unknown variant or version the API. Inside the domain core, sealed plus record is the clearest way to model it."

> Senior tip: state clearly who owns the variant set and the versioning policy. Exhaustive switch is very useful in a synchronized codebase, but messages from external systems still need handling for unknown values.`,
    follow: [
      'How does adding a new subtype affect already compiled consumers?',
      'How do you tell a standard Java 21 feature from a preview API?'
    ]
  },
  'core-031': {
    q: 'An API returns a List but internally keeps the caller\'s mutable list. How do you design the defensive copy and the collection contract?',
    a: `**Summary:** When a class holds a {{List}} (a list) internally, if you receive a list from outside and store the reference directly, or return the internal list straight out, the caller can modify your data without you knowing. Defensive copy means: copy at the input boundary to stop the caller from changing internal state; copy or return an immutable snapshot at the output boundary. Note: a shallow copy only copies the list structure, not each element - if an element is itself mutable it can still be changed.

### What - why - how
- **Context:** in object-oriented design, an object must protect its invariants (things always true about its state, e.g. "the list of ids contains no nulls"). If internal state is modified from outside, the invariant breaks without the class knowing.
- **Copy at input (constructor/setter):** when receiving a {{List}} from the caller, call {{List.copyOf(input)}} (Java 10+) to create a separate snapshot. After that, even if the caller keeps the old reference and {{add/remove}}s, the copy inside your class does not change. {{List.copyOf}} also rejects {{null}} (throws {{NullPointerException}}), helping detect bad data early.
- **Return at output (getter):** returning the immutable snapshot itself is enough if elements are immutable (such as {{String}}, {{Long}}). If elements are mutable (for example an {{Address}} object with setters), consider deep copy (copy each element) or use an immutable element type.
- **How is {{Collections.unmodifiableList}} different?** It is only a "view" (wrapper) that blocks modification through that view, but if someone still holds a reference to the original list, modifying the original changes the view too. It is **not** an independent copy.

### Quick comparison
| Approach | Blocks caller modifying input after creation? | Blocks caller modifying output? | Note |
|---|---|---|---|
| Store original reference | No | No | Dangerous, easily breaks invariants |
| {{Collections.unmodifiableList}} (wrap original) | No | Yes (through view) | Original can still be modified -> view changes |
| {{List.copyOf}} in constructor + return it | Yes | Yes | Immutable snapshot, rejects null |
| {{new ArrayList<>(input)}} + return unmodifiable | Yes | Yes | Real copy; elements may still be mutable |

### Real-world example (production)
A batch-payment service, each batch ~5,000 {{paymentId}}. The {{PaymentBatch}} constructor received {{List<String> ids}} from the controller and stored it directly: {{this.ids = ids;}}. The controller parsed JSON into a list, passed it to the batch, then (due to reused code) continued with {{ids.addAll(debugIds)}} to log - accidentally adding 200 garbage ids into the real batch. The batch was sent to the worker: ~5,200 transactions instead of 5,000, causing ~40 duplicate/mismatched transactions and ~2 hours of reconciliation. Investigation: trace showed the batch object changed after creation; diffing heap snapshots showed the same list instance held in two places. Fix: {{this.ids = List.copyOf(ids);}} in the constructor and the getter returns {{ids}} (already immutable). Added a test: create a batch, modify the original list, assert {{batch.ids().size()}} does not change. Result: no more count mismatch; copy cost O(n) for 5,000 strings is negligible (< 1ms, a few hundred KB temporary).

~~~java
import java.util.List;
import java.util.Objects;

final class PaymentBatch {
    private final List<String> paymentIds; // immutable snapshot

    PaymentBatch(List<String> paymentIds) {
        // copy + check null elements; throws NPE if any null
        this.paymentIds = List.copyOf(Objects.requireNonNull(paymentIds));
    }

    List<String> paymentIds() {
        return paymentIds; // already immutable, safe to return directly
    }
    // NO setter -> state does not change after creation
}
~~~

### Production pitfalls
- **Shallow copy with mutable elements:** {{List.copyOf(listOfMutableOrder)}} copies the list but each {{Order}} is still the same object - the caller modifying {{order.setAmount(...)}} still affects it. Need immutable elements or a deliberate deep copy.
- **Forgetting to copy one direction:** copying only at the getter but not the constructor (or vice versa) -> still a hole.
- **O(n) cost:** for very large lists (millions of elements) copying each time costs memory/CPU; consider "ownership transfer" with a clear contract, or return a read-only stream/iterator. But don't sacrifice correctness to avoid copying without measuring.
- **{{List.copyOf}} and null:** it rejects {{null}} elements. If the business allows null, use {{new ArrayList<>(input)}} then {{Collections.unmodifiableList(...)}} but handle null yourself.

### Sample interview answer
"For a class holding a collection internally, I always treat the input boundary and output boundary as boundaries to protect. In the constructor I use List.copyOf to create an immutable snapshot: that way the caller modifying the original list afterwards does not affect internal state, and List.copyOf also blocks null elements, helping detect dirty data early. In the getter I return that snapshot directly because it is already immutable. The point to distinguish is that Collections.unmodifiableList is only a view wrapping the original list, so if anyone still holds a reference to the original, the view changes too - it is not a copy. Another trap is shallow copy: copying the list but leaving mutable elements inside is still unsafe, in which case use immutable elements or deep copy. On cost, copying is O(n), negligible for a few thousand elements; only for very large lists do I consider ownership transfer with a clear contract, but I always prioritize correctness and immutability first."

> Senior tip: write two mandatory tests: (1) modify the list passed to the constructor -> internal state must not change; (2) try {{getter().add(...)}} -> must throw {{UnsupportedOperationException}}. If elements are mutable, add a deep-mutation test. Defensive copy protects invariants, but does not replace transaction semantics - a snapshot does not guarantee multiple fields were read at the same moment.`,
    follow: [
      'How does an unmodifiable view differ from an immutable snapshot?',
      'When is a deep copy not worth the cost?'
    ]
  }
});
