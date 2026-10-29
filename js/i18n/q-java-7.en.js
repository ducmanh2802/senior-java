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
    q: 'A record containing {{List}} is used as a key in a cache: does the record guarantee deep immutability and stable hash? How would you design a domain value object?',
    a: `**Summary:** Record makes component fields final and generates equals/hashCode from components; it does not make referenced objects immutable. If component is mutable collection, caller can still change content and change key hash after putting into cache.

### What record guarantees
- Record is data carrier: components stored in final fields, accessors and equals/hashCode/toString generated from header. Compact constructor allows validation and normalization.
- Final reference does not mean deep immutable. {{List<String>}} can be modified; record holds exactly the reference received.
- A record cannot extend another class and automatically inherits {{java.lang.Record}}; fits closed value objects, not entities needing identity/lifecycle ORM.

~~~java
record OrderKey(String tenant, List<String> regions) {
    OrderKey {
        // Copy so caller cannot modify list after creating key.
        regions = List.copyOf(regions);
    }
}
~~~

### Choosing record vs sealed hierarchy
- Use record for small values with equality by all data: coordinates, normalized money, immutable command.
- Use sealed interface when domain state has a finite set of variants, like {{PaymentResult}} with {{Accepted}}, {{Declined}}, {{Pending}}. When adding variants, compiler helps check switch exhaustiveness.
- Don't force every domain object into record: entities often need stable identity across lifecycle and ORM needs proxy/lazy loading; inheritance mapping with record also doesn't fit.

### Pitfall
- {{List.copyOf}} creates an unmodifiable structure snapshot, but if elements are mutable it doesn't create deep copy.
- Equality by all components can make record key too broad; two logically same versions with different metadata become different keys.
- Normalize before creating record, such as money scale and uppercase/lowercase codes; {{BigDecimal.equals}} distinguishes scale.

> Senior tip: before using a value object as a map key, check whether every component is deeply immutable and test the case where caller modifies input data. For JPA entities, determine equality by business identity first; don't let generated id be null then change hash after persist.`,
    follow: [
      'Why is record not naturally suitable as a JPA entity?',
      'What benefit does sealed interface provide when modeling a domain result with a finite set of states?'
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

> Senior tip: pick one rule for the whole system and verify it with HashSet tests before and after persist; entity equality is an identity decision, not just boilerplate.`,
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

> Senior tip: state clearly who owns the variant set and the versioning policy. Exhaustive switch is very useful in a synchronized codebase, but messages from external systems still need handling for unknown values.`,
    follow: [
      'How does adding a new subtype affect already compiled consumers?',
      'How do you tell a standard Java 21 feature from a preview API?'
    ]
  },
  'core-031': {
    q: 'An API returns a List but internally keeps the caller\'s mutable list. How do you design the defensive copy and the collection contract?',
    a: `**Summary:** Copy at the input boundary so the caller cannot modify internal state; if a getter returns a collection, return an immutable snapshot, or a view only when the contract says so explicitly. A shallow copy does not protect mutable objects inside the elements.

### Constructor and accessor
- The constructor receives a list, needs null/value checks, then uses List.copyOf to create a structural snapshot that also rejects null elements.
- The getter can return that immutable snapshot directly; if the elements are mutable and must be isolated deeply, copy each element or use an immutable element type.
- Collections.unmodifiableList is only a wrapper: anyone who still holds a reference to the original list can modify its content.
- {{List.copyOf}} is smart enough: if the input is already an immutable list created by {{List.of}}/{{List.copyOf}}, it returns that same instance without copying again; but an {{ArrayList}} or an unmodifiable view is always copied. Note that it throws {{NullPointerException}} if any element is null.

~~~java
final class Batch {
    private final List<String> ids;
    Batch(List<String> ids) { this.ids = List.copyOf(ids); }
    List<String> ids() { return ids; }
}
~~~

### Trade-off
- Copy costs O(n) time and memory; for large lists, consider clear ownership transfer or a streaming API.
- Don't return mutable internal state just to avoid copying; concurrency bugs and broken invariants usually cost more.
- A defensive copy does not change transaction semantics: a data snapshot does not guarantee that several fields were read at the same moment.

> Senior tip: test the collection in both directions: the caller modifies the input after the constructor, and the caller tries to modify the output. If the elements are mutable, add a test for nested mutation.`,
    follow: [
      'How does an unmodifiable view differ from an immutable snapshot?',
      'When is a deep copy not worth the cost?'
    ]
  }
});
