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
    q: 'A cache holds millions of repeated Strings and a heap dump shows many identical byte arrays. How do you consider compact strings, String deduplication, and intern?',
    a: `**Summary:** Compact Strings reduce bytes for Latin-1 content directly inside each String; G1 String dedup shares backing byte arrays between different String objects; {{intern()}} canonicalizes the whole object with pool lookup cost. Choose by heap profile and benchmark for workload; don't enable all three by feeling.

### Three different mechanisms
- From Java 9, {{String}} stores content with {{byte[]}} and coder: Latin-1 content usually needs one byte per char, UTF-16 content needs two. This is the default String representation, not a separate flag.
- G1 can find equal Strings and make them share backing array; String objects remain separate. Option {{-XX:+UseStringDeduplication}} has CPU overhead and requires G1.
- {{String.intern()}} returns canonical instance from string table. Every caller uses that same instance, but lookup and pool management also cost; with high cardinality data it can become a contention point and retain extra structure.

### When to consider
1. Measure retained heap: if most capacity is Latin-1 content, compact strings already help.
2. If many different String objects share the same content, try dedup on staging, measure CPU, pause, and heap after GC.
3. Only use intern for small, highly repeated strings with clear boundaries like schema names; avoid request IDs or user data with high cardinality.

~~~bash
-Xlog:gc+stringdedup=debug
jcmd <pid> GC.heap_info
~~~

Dedup logs show number of strings inspected, deduplicated, and bytes saved; compare with throughput and p99 rather than just heap reduction.

### Production pitfalls
- Dedup doesn't reduce String object count, only shares backing content array; if object and reference overhead dominates, benefit is low.
- Running dedup can increase CPU and add GC work. A one-point heap snapshot is also easy to mislead if workload isn't stable.
- Don't rely on fixed object layout details between JDK versions; compressed oops, alignment, and header affect real size.

> Senior tip: set measurable targets, e.g., reduce retained heap 10% with CPU under agreed threshold; test with representative traffic and keep rollback via JVM flag.`,
    follow: [
      'What does String dedup share, but not share?',
      'Why is intern not a general-purpose string caching solution?'
    ]
  },
  'core-029': {
    q: 'How do you design equals/hashCode for a JPA entity with a generated id so the entity doesn\'t disappear from HashSet after persist?',
    a: `**Summary:** Entity equality must stay stable across the lifecycle transient → managed → detached. If hashCode relies on a generated id that is null and then changes after persist, the entity already in HashSet will be in the wrong bucket; choose an immutable business key or a class-stable strategy with collision awareness.

### Two common strategies
- **Business key**: use a unique, immutable attribute available at creation, like a country code. Equality is stable, but not every entity has such a key.
- **Generated id**: easy to think of, but id is null before persist. If equals treats two null ids as equal, or hashCode changes when the id is assigned, collections break.
- Some systems use equality by id only when id is non-null, with hashCode stable by class. This keeps the bucket stable but many same-class entities collide; measure before considering it a problem.

### Hibernate proxy
- Proxy may be a subclass or wrapper depending on mapping/enhancement. Checking with hard getClass() may treat proxy and entity as different.
- Use Hibernate APIs like persistentClass when needed, but avoid depending on Hibernate in pure domain if unnecessary.
- Don't include association/lazy collection in equals/hashCode: easily triggers unexpected queries, bidirectional recursion, or N+1.

### Decision
Write tests for new entities: after persist, with proxy, detached, and with two instances having the same id. Don't use mutable fields, timestamps, or the whole object graph.

> Senior tip: pick one rule for the whole system and verify with HashSet tests before and after persist; entity equality is an identity decision, not just boilerplate.`,
    follow: [
      'Why should lazy associations not be included in hashCode?',
      'What trade-off does a class-stable hashCode have?'
    ]
  },
  'core-030': {
    q: 'A domain has three finite result states and the team wants an exhaustive switch. How do you model it with sealed interface/record, and how do you maintain version compatibility?',
    a: `**Summary:** Sealed interface limits allowed subtypes directly; record fits as an immutable data variant. Pattern matching switch can check exhaustiveness by known type, but adding a variant is a source/binary change to manage, and preview features need clear support levels.

### Model
- Declare sealed interface with explicit permits, then create records for results like Accepted, Rejected, and Pending.
- Consumer switch on the parent type must handle all known branches; compiler reports missing branches when recompiled.
- Record components need deep immutability if shared; record only guarantees field reference final.

~~~java
sealed interface Result permits Accepted, Rejected {}
record Accepted(String id) implements Result {}
record Rejected(String reason) implements Result {}
~~~

### Module boundaries
- The same module can restrict subtypes by permits rules; different modules/packages require named modules and subtype modifiers.
- When adding a subtype, recompile consumers to detect missing switch branches. Old compiled consumers don't automatically know the new domain; design a fallback if the protocol/version may expand independently.
- Java 21 pattern matching for switch is a standard feature; StructuredTaskScope in Java 21 is preview. Don't mix these stability levels.

### When to use
Fits an algebraic data type with a finite variant set within a bounded context. Not suitable when a third-party plugin needs to add subtypes or the hierarchy is an open API extension.

> Senior tip: clearly document who owns the variant set and versioning policy. Exhaustive switch is very useful in synchronized codebases, but messages from external systems still need unknown-value handling.`,
    follow: [
      'How does adding a new subtype affect already compiled consumers?',
      'How do you distinguish a standard Java 21 feature from a preview API?'
    ]
  },
  'core-031': {
    q: 'An API returns List but keeps the caller\'s mutable list internally. How do you design defensive copy and collection contract?',
    a: `**Summary:** Copy at the input boundary so the caller can't modify internal state; if the getter returns a collection, return an immutable snapshot or view only when the contract clearly states it. Shallow copy doesn't protect mutable elements inside.

### Constructor and accessor
- Constructor receives a list that needs null/value checks, then uses List.copyOf to create a structural snapshot and reject null elements.
- Getter can return that immutable snapshot directly; if elements are mutable and need deep isolation, copy each element or use an immutable element type.
- Collections.unmodifiableList is just a wrapper: anyone with a reference to the original list can still modify its content.

~~~java
final class Batch {
    private final List<String> ids;
    Batch(List<String> ids) { this.ids = List.copyOf(ids); }
    List<String> ids() { return ids; }
}
~~~

### Trade-off
- Copy costs O(n) time and memory; for large lists, consider clear ownership transfer or a streaming API.
- Don't return mutable internal state just to avoid copying; concurrency bugs and invariant breaks are usually more expensive.
- Defensive copy doesn't change transaction semantics: a data snapshot doesn't guarantee multiple fields read at the same time.

> Senior tip: check the collection both ways: caller modifies input after constructor, and caller tries to modify output. If elements are mutable, add a test for nested mutation.`,
    follow: [
      'How is an unmodifiable view different from an immutable snapshot?',
      'When is deep copy not worth the cost?'
    ]
  }
});
