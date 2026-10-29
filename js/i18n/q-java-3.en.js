/*
 * English translation of js/data/q-java.js — task T161. Format: js/core/i18n.js (content overlay).
 * ids: collections-013 collections-014 modern-001 modern-002 modern-003 modern-004 modern-005 modern-006 modern-007 modern-008
 */
App.i18n.content({
  'collections-013': {
    q: `Sorting in Java: stable TimSort, {{Comparator.comparing().thenComparing()}}, {{nullsFirst}}, and the "Comparison method violates its general contract" error.`,
    a: `**Summary:** Java sorts objects with **TimSort** (a hybrid of merge sort and insertion sort) for {{Arrays.sort}}/{{Collections.sort}} — stable, O(n log n) worst case, O(n) for an almost-sorted array; {{Comparator.comparing}} lets you chain comparisons; {{nullsFirst}}/{{nullsLast}} make nulls safe; breaking the comparator contract (transitivity, symmetry) throws {{IllegalArgumentException}}.

### TimSort
- TimSort combines **merge sort** (stable, good at merging stretches that are already ordered) and **insertion sort** (cheap for short or nearly sorted stretches). It was designed for real data, which is rarely random.
- It scans the array for natural **runs** — maximal stretches that are already sorted (or reverse-sorted and can be flipped) — and merges them. Almost-sorted input therefore gets close to O(n) instead of O(n log n).
- **Stable**: equal elements keep their relative order. "Stable" means: if A came before B before sorting and compare(A, B) == 0, A still comes before B after sorting. This is what makes multi-key sort work — sort by the secondary key first, then by the primary key, and the second pass keeps the first ordering inside equal primary keys.
- Since Java 8: {{Arrays.sort}} on primitives uses dual-pivot quicksort (**not** stable); arrays of objects use TimSort. So {{Arrays.sort(int[])}} may reorder equal elements, while {{Arrays.sort(Integer[])}} and {{List.sort}} will not.

### Comparator chain
~~~java
// Sort by: status ASC, createdAt DESC, name ASC
Comparator<Order> cmp = Comparator
    .comparing(Order::getStatus)
    .thenComparing(Order::getCreatedAt, Comparator.reverseOrder())
    .thenComparing(Order::getName, Comparator.nullsFirst(String::compareTo));
orders.sort(cmp);
~~~
- {{comparing}}: extracts the key and compares it by its natural order (or by a comparator you pass in).
- {{thenComparing}}: adds a tie-breaker that is only consulted when the earlier comparators return 0.
- {{nullsFirst}}/{{nullsLast}}: wrap another comparator and treat null as smaller / larger than every real value, so null never reaches {{compareTo}} and never throws NPE.

### Useful static comparators
- {{Comparator.naturalOrder()}}, {{reverseOrder()}}
- {{Comparator.nullsFirst(naturalOrder())}}, {{nullsLast(...)}}
- {{comparingInt}}/{{comparingLong}}/{{comparingDouble}} compare primitive keys without **boxing** (boxing = wrapping an int into an Integer object, which allocates and adds GC pressure on hot paths).

### The error "Comparison method violates its general contract"
- TimSort throws it when it detects a comparator that is **not transitive** or **not symmetric**. A comparator must behave like a total preorder: sign(compare(a,b)) = -sign(compare(b,a)) (symmetry), and a ≤ b, b ≤ c implies a ≤ c (transitivity). The sort relies on these rules to decide where elements go, and TimSort actively verifies them.
- Common causes:
  1. **Comparator based on a nullable field** without null handling: {{a.getName().compareTo(b.getName())}} throws NPE when null is involved, and a hand-written null branch easily breaks transitivity.
  2. **Wrong hand-written comparison logic**: {{(a, b) -> a.x < b.x ? -1 : 1}} forgets the equal case (it must return 0), so "a < b" can be true in one argument order and true for the reverse order too.
  3. **Comparing float/double with NaN**: {{Double.compare}} handles NaN correctly, but a hand-written {{a < b ? -1 : 1}} does not, because every comparison with NaN is false.

~~~java
// Wrong: NPE on null, and can violate transitivity when null is mixed in
Comparator<Person> bad = (a, b) -> a.getName().compareTo(b.getName());

// Right: handle null explicitly
Comparator<Person> good = Comparator
    .comparing(Person::getName, Comparator.nullsFirst(String::compareTo));
~~~

### Pitfalls
- **Primitive array sort is not stable**: {{Arrays.sort(int[])}} uses quicksort; for a stable sort use {{Integer[]}} or {{List.sort}}.
- **Comparator not consistent with equals**: {{TreeSet}}/{{TreeMap}} use the comparator, not {{equals}} — if the comparator returns 0 for two different objects, the set treats them as duplicates and drops one.
- **Null in a stream sort**: {{stream.sorted()}} throws NPE if an element is null; use {{Comparator.nullsFirst}} or filter first.
- **Performance**: a complex comparator in a hot path is expensive — cache extracted keys and avoid capturing large objects in lambdas.

> Senior tip: always test a comparator against data with nulls and duplicates, and verify stability by sorting twice with different keys. For large data sets use {{comparingInt}}/{{comparingLong}} to avoid boxing. And do not invent comparison logic — chain the built-in comparators; they are tested and hard to get wrong.`,
    follow: [`Why is TimSort's stability important for multi-key sorting?`, `Primitive array sort ({{Arrays.sort(int[])}}) is not stable — how do you sort an int array stably?`, `How do you debug "Comparison method violates its general contract" when the stack trace does not clearly point to the wrong line?`]
  },
  'collections-014': {
    q: `Hash collision and HashDoS attack; why treeify helps; designing good {{hashCode}} for composite key.`,
    a: `**Summary:** hash collision is when two different keys share the same {{hashCode}} bucket; HashDoS exploits collisions to turn {{HashMap}} O(1) into O(n) causing DoS; Java 8 **treeify** converts buckets of length ≥ 8 into red-black trees O(log n); good {{hashCode}} for composite key uses {{Objects.hash}} or manual bit mixing (prime multiplier).

### Basic hash collision
- {{HashMap}} index = {{(n-1) & spread(hashCode())}}; capacity is power of 2 ⇒ only low bits used.
- Collision: two different keys map to same index ⇒ linked list (Java 7) or tree (Java 8+).
- Collision frequency depends on {{hashCode}} quality and capacity.

### HashDoS attack (Algorithmic Complexity Attack)
- Attacker sends many keys causing intentional collision ({{hashCode}} returns same value or same bucket).
- Example: {{String}} hash = {{s[0]*31^(n-1) + ...}}; can craft different strings with same hash.
- Result: {{put}}/{{get}} degrade to O(n) ⇒ CPU 100%, request timeout.
- Real-world: through JSON payload, form parameters, headers — server parses into {{HashMap}}.

### Treeify (Java 8) — defense against HashDoS
- Threshold: bucket size ≥ {{TREEIFY_THRESHOLD = 8}} **AND** capacity ≥ {{MIN_TREEIFY_CAPACITY = 64}} ⇒ convert linked list → {{TreeNode}} (red-black tree).
- Search in tree: O(log n) instead of O(n).
- If capacity < 64: **resize** double instead of treeify (resize redistributes buckets, can reduce collision).
- Untreeify: bucket size ≤ {{UNTREEIFY_THRESHOLD = 6}} ⇒ back to list.
- Key comparison in tree: first {{hashCode}}, then {{Comparable}} (if implemented), finally {{tieBreakOrder}} (identity hash) to ensure total order.

### Designing good hashCode for composite key
~~~java
// Way 1: Objects.hash (Java 7+) — convenient but creates varargs array
@Override public int hashCode() { return Objects.hash(id, name, category); }

// Way 2: Manual (faster, no allocation) — Effective Java
@Override public int hashCode() {
    int result = 17;
    result = 31 * result + (id == null ? 0 : id.hashCode());
    result = 31 * result + (name == null ? 0 : name.hashCode());
    result = 31 * result + (category == null ? 0 : category.hashCode());
    return result;
}

// Way 3: Record (Java 14+) — auto-generates correct contract
record Key(Long id, String name, String category) {}
~~~
- Principle: **prime multiplier** (31, 37, 1000003) to spread bits; mix high bits down ({{h ^ (h >>> 16)}} like {{HashMap.spread}}).
- {{equals}} must match: compare the same fields.
- Immutable fields for key — mutable key in map is a bug.

### Production defense against HashDoS
- Limit request size, parameter count (Spring: {{spring.mvc.max-request-parameters}}).
- Use {{ConcurrentHashMap}} (also has treeify) or keys not controlled by user (UUID, Long).
- For user input as key: hash salt (Java 9+ {{String.hashCode}} does not salt, but can wrap key).
- Monitoring: track {{HashMap}} max bucket size via JMX/heap dump.

> Senior tip: HashDoS is rare but very painful when it happens; treeify is the final safety net, not the root fix. The root is: **never use unbounded user input directly as a key in HashMap/HashSet**. Use UUID/Long IDs, limit entry count, or use Caffeine/Guava cache with eviction. For composite keys, use record — the compiler generates correct {{hashCode}}/{{equals}} and never gets it wrong.`,
    follow: [`Why is treeify threshold 8 and untreeify 6 (not using the same threshold)?`, `{{Objects.hash}} creates a varargs array — when should you write it manually?`, `How to detect HashDoS occurring in production?`]
  },
  'modern-001': {
    q: `How does Stream lazy evaluation work? What is the difference between stateful and stateless operations, and when is a parallel stream harmful?`,
    a: `**Summary:** intermediate operations only **build the pipeline** and run nothing; a terminal operation pulls the data through. Stateful operations ({{sorted}}, {{distinct}}, {{limit}}) have to keep state and may need to see all elements; a parallel stream shares the common {{ForkJoinPool.commonPool}}, so it hurts when the work does I/O, is small, or blocks.

### Lazy evaluation
~~~java
Stream<String> s = names.stream()
    .filter(n -> { System.out.println("filter " + n); return n.length() > 3; })
    .map(String::toUpperCase);       // nothing printed yet
List<String> out = s.toList();       // terminal -> runs now
~~~
- Each element travels through the whole pipeline before the next element starts (except across stateful operations). That is what makes short-circuiting efficient: "short-circuit" means an operation such as {{findFirst}} can stop the pipeline as soon as it has an answer.
- {{findFirst}}, {{anyMatch}}, {{limit}} can stop early; {{forEach}} cannot (it must consume every element).
- A stream is **single-use**: reusing it throws {{IllegalStateException}}.
- No terminal operation ⇒ nothing runs. Forgetting {{collect}}/{{forEach}} is the classic "why is my stream doing nothing?" bug.

### Stateful vs stateless
- **Stateless**: {{filter}}, {{map}}, {{flatMap}}, {{peek}}, {{mapToInt}} — each element is processed independently, so order and parallelism do not matter.
- **Stateful**: {{distinct}}, {{sorted}}, {{limit}}, {{skip}}, {{takeWhile}}/{{dropWhile}} — they need a buffer or knowledge of the whole input ({{distinct}}, for example, must remember every value seen so far).
- {{sorted}} on an infinite stream never finishes; {{distinct}} keeps a set of all values already seen.
- Stateful operations make the parallel version slower because threads must synchronize and merge state; {{limit}} in parallel is especially expensive.

### Parallel streams
- By default they use {{ForkJoinPool.commonPool()}} with CPU - 1 threads. **Every** parallel stream in the JVM shares this pool, so one stream can starve all the others.
- Harmful when:
  - The task **blocks** (DB call, HTTP call, file I/O): worker threads sit waiting, the pool runs out and other parallel streams starve; tasks that wait on each other can even deadlock.
  - The data is small: splitting, forking, and merging cost more than the work itself.
  - The source splits badly: {{LinkedList}}, a plain {{Iterator}}, {{Stream.iterate}} — the splitter cannot cut them into balanced chunks.
  - There is heavy stateful work or a non-thread-safe side effect.
  - You are already inside a request thread that belongs to another pool — easy contention.
- Beneficial when: the data is large, the work is CPU-bound, the source splits well ({{ArrayList}}, array), operations are stateless, and nothing blocks. "CPU-bound" means the work is computation rather than waiting.
- Brian Goetz's rule of thumb: N * Q > 10,000 (N = number of elements, Q = cost per element) before parallel is worth considering.
- To use a private pool, submit the task to a custom {{ForkJoinPool}}; never run {{parallelStream}} directly on a request thread.

### Pitfalls
- {{peek}} for debugging may not run if there is no terminal operation or if short-circuiting stops early.
- Side effects in {{map}}/{{forEach}} (adding to an external list) are unsafe in parallel; use {{collect}}.
- {{Stream.iterate}} infinite + {{parallel}} splits very poorly; use the three-argument {{Stream.iterate(seed, hasNext, next)}} (Java 9) or another generator.
- Forgetting to close streams that hold resources ({{Files.lines}}, {{Files.list}}) — use try-with-resources.

> Senior tip: default to sequential streams for clarity; turn on parallel only after a benchmark proves a win on realistically sized data. In web services never use {{parallelStream}} for I/O — use virtual threads (Java 21, cheap threads that are unmounted while blocking) or a bounded executor.`,
    follow: [`Why does {{sorted}} on an infinite stream never return?`, `How do {{findFirst}} and {{findAny}} differ in a parallel stream?`, `How do you run a parallel stream on a custom ForkJoinPool?`]
  },
  'modern-002': {
    q: `When should and should not {{Optional}} be used? Distinguish {{orElse}}/{{orElseGet}}, {{of}}/{{ofNullable}}, and common pitfalls.`,
    a: `**Summary:** {{Optional}} is a **return type** to force the caller to handle absence; do not use as field, parameter, or collection element; avoid bare {{get()}}, use {{orElseGet}} when default is expensive, and {{ofNullable}} when source may be null.

### Purpose
- Instead of returning {{null}} to make API self-documenting about possible absence.
- Not a replacement for every null; it is a signal at the **API boundary**, especially when there is no natural exception.
- Not designed for high performance: each {{Optional}} is an object; escape analysis may eliminate but not guarantee.

### Should use
- Method that may have no result: {{Optional<User> findById(long id)}}.
- Chain processing: {{optional.map(User::email).filter(s -> !s.isBlank()).orElse(DEFAULT)}}.
- {{orElseThrow(() -> new NotFoundException(...))}} to turn absence into a clear error.
- {{ifPresent}}, {{ifPresentOrElse}} (Java 9), {{stream()}} (Java 9) to convert to stream.

### Should not use
- **Field** of entity/DTO: not Serializable, hard for JPA/Jackson (needs module), adds complexity; use null + validation.
- **Method parameter**: caller must wrap {{Optional.of(...)}} pointlessly; use overload or null validation.
- **Collection**: {{List<Optional<T>>}} is usually a sign to filter null; return empty list instead of empty Optional.
- **Map key**: Optional does have hashCode/equals, but using as key is abuse.
- **Primitive**: use {{OptionalInt}}/{{OptionalLong}}/{{OptionalDouble}} to avoid boxing, but APIs are rarely preferred.

### orElse vs orElseGet
~~~java
// orElse: argument evaluated IMMEDIATELY, even when Optional has value
User u1 = opt.orElse(loadFromDb());       // always hits DB -> waste

// orElseGet: supplier called only when empty
User u2 = opt.orElseGet(() -> loadFromDb());
~~~
- {{orElse}} receives already-built value; if creating object / reading DB, use {{orElseGet}}.
- {{orElseThrow()}} (Java 10) throws {{NoSuchElementException}}; version with supplier allows custom exception.

### of vs ofNullable
- {{Optional.of(x)}} throws NPE if x null — use when definitely non-null.
- {{Optional.ofNullable(x)}} allows null → {{Optional.empty()}}.
- {{Optional.empty()}} is singleton, use when known empty.

### Pitfall
- {{opt.get()}} without check ⇒ {{NoSuchElementException}}, harder to debug than null. Use {{orElseThrow}} with message.
- {{opt.isPresent()}} then {{get()}} is disguised null-check; prefer {{map}}/{{ifPresent}}.
- Comparing {{opt == Optional.empty()}} is wrong; use {{isEmpty()}} (Java 11) or {{isPresent()}}.
- {{Optional}} in JPA entity causes mapping errors; in Jackson needs {{Jdk8Module}}.
- Overusing {{Optional}} for everything makes code confusing and slow; sometimes controlled null + {{@Nullable}} is more practical.

> Senior tip: use {{Optional}} at service/repository layer; at controller/DTO layer convert to a clear value or error. Do not wrap Optional around collections — return {{List.of()}} empty so caller does not handle two layers of "not present".`,
    follow: [`Why should {{Optional}} not be a JPA entity field?`, `What is {{Optional.stream()}} used for?`, `When is returning null better than {{Optional}}?`]
  },
  'modern-003': {
    q: `What are the characteristics of records? How does a compact constructor work, and can a record be used as a DTO or a JPA entity?`,
    a: `**Summary:** a record is a **final** class, immutable by construction, that auto-generates accessors/{{equals}}/{{hashCode}}/{{toString}} and has a canonical constructor; the compact constructor is where you validate and normalize; records are excellent DTOs/value objects but a poor fit for JPA entities.

### Features
- The declaration {{record Point(int x, int y)}} generates:
  - a {{private final}} field for each component;
  - accessors {{x()}}, {{y()}} (not {{getX()}});
  - {{equals}}/{{hashCode}} over all components, and {{toString}} like {{Point[x=1, y=2]}};
  - a canonical constructor that takes all components.
- It cannot extend another class (it is already final) but **can implement interfaces**; it may have static fields/methods and extra instance methods.
- There are no setters; to "change" a value you create a new record. That is what immutable means: the object's state is fixed at construction and never mutates.
- Record serialization uses the canonical constructor and the components instead of the default field mechanism; {{serialVersionUID}} is not needed (but may be declared).
- Record patterns (Java 21) let you deconstruct a record inside {{instanceof}} or a switch.

### Compact constructor
~~~java
record Range(int lo, int hi) {
    Range {                          // no parameter list
        if (lo > hi) throw new IllegalArgumentException("lo > hi");
        // fields are assigned implicitly after validation
    }
}
record Order(String id, List<Item> items) {
    Order {
        Objects.requireNonNull(id);
        items = List.copyOf(items);   // defensive copy of a mutable component
    }
}
~~~
- The compact constructor runs **before** the fields are assigned, and reassigning a parameter changes the value that will be stored (normalization).
- It cannot read {{this}} before assignment and cannot call instance methods.
- You may also declare the full canonical constructor, or an auxiliary constructor that delegates with {{this(...)}}.

### DTO
- Very good: little boilerplate, immutable, readable, correct {{equals}}. A DTO (data transfer object) is a plain carrier of data between layers or over the wire.
- Jackson supports records since 2.12; most mapping libraries do too.
- Bean Validation: annotations on components are applied (with the right configuration).
- Limits: no inheritance, no direct default values (use an auxiliary constructor), and some old frameworks still require a no-arg constructor and getters.
- For a large DTO a record is still fine; if you must build it gradually, use a builder plus a regular class.

### JPA entity
- **Not recommended**: JPA requires a no-arg constructor (it may be protected), non-final fields, subclass-based proxies for lazy loading, and dirty checking that compares field snapshots. Dirty checking means Hibernate detects what changed by comparing the loaded snapshot with the current field values — which needs mutable fields.
- A record is final, so Hibernate cannot create a proxy subclass; its accessors do not follow the getter convention; final fields cannot be populated while an object is being loaded.
- Hibernate 6 supports records in some places ({{@Embeddable}}, projections), but entities should stay regular classes.
- Records are great as **projections** in a JPQL constructor expression or an interface projection — very convenient for read-only queries.
- To build a DTO from an entity, map manually or with MapStruct (a compile-time mapping library).

### Pitfalls
- A record does not deep-copy mutable components; call {{List.copyOf}} in the compact constructor.
- {{equals}} uses every component; if you have a derived or cached field, do not put it in the record.
- Do not use a record for an object that changes many times (the builder pattern fits better).
- Old reflection/serialization frameworks may not recognize records.

> Senior tip: use records for **value objects and DTOs** and keep JPA entities as regular classes. In the compact constructor always validate and copy collections — it is the only place that can guarantee real immutability.`,
    follow: [`Why can Hibernate not create a proxy for a record?`, `What is the difference between a compact constructor and the canonical constructor?`, `How do record patterns (Java 21) help when processing nested data?`]
  },
  'modern-004': {
    q: `How do sealed classes and pattern matching for switch (Java 21) work? What does exhaustiveness guarantee, and what pitfalls are there?`,
    a: `**Summary:** {{sealed}} limits which classes may extend a type, which lets you model an **algebraic data type** (a type defined as a fixed set of alternatives); a switch pattern (Java 21) matches by type plus an optional guard, and the compiler checks that it is **exhaustive** when the hierarchy is sealed — but you still have to handle {{null}} and think about what happens when a new subtype is added.

### Sealed
~~~java
sealed interface Shape permits Circle, Square, Triangle {}
record Circle(double r) implements Shape {}
record Square(double side) implements Shape {}
record Triangle(double a, double b, double c) implements Shape {}
~~~
- Every permitted subclass must be {{final}}, {{sealed}}, or {{non-sealed}}.
- Subclasses must be in the same module as the sealed type (or in the same package when the code is on the classpath, i.e. the unnamed module).
- You can write {{permits}} explicitly or let the compiler infer it from the classes declared in the same file.
- Benefit: the set of types is closed, so the compiler can check that a switch covers everything, and the declaration documents the domain.

### Pattern matching for switch
~~~java
double area(Shape s) {
    return switch (s) {
        case Circle c            -> Math.PI * c.r() * c.r();
        case Square q            -> q.side() * q.side();
        case Triangle t          -> heron(t);
        // no default needed: Shape is sealed and fully covered
    };
}
~~~
- Java 21 allows switch on any reference type, combining type patterns, record patterns, and {{when}} guards. A guard is an extra boolean condition that must also be true for the case to match.
- {{case null}} can be declared separately; if it is not, a switch pattern throws NPE when the selector is null (the old switch on String also threw NPE, so this is not new, but it is easy to forget).
- Case order matters: a specific case must come before a general one; otherwise the compiler reports a "dominated" (unreachable) case.
- Guard example: {{case Circle c when c.r() > 10 -> ...}}.
- Nested record pattern: {{case Point(int x, int y) -> ...}} deconstructs nested data in one step.
- Exhaustiveness: with a sealed hierarchy the compiler knows every subtype and requires full coverage; with a non-sealed interface you need {{default}}.

### What exhaustiveness guarantees
- If someone adds a new subtype to the sealed interface, **every switch that is missing a case fails to compile** — a big advantage over the visitor pattern or if/else chains, and it makes refactoring safe.
- For a switch **expression**, a missing case is a compile error (unlike the old switch statement).
- The guarantee only holds while the hierarchy really is sealed and the compiler can see all subtypes; using {{non-sealed}} gives it up.

### Pitfalls
- {{null}}: forget it and you get a runtime NPE; add {{case null -> ...}} if the data may be null.
- Case order: a general pattern placed before a specific one makes the later case unreachable; the compiler reports an error, but the message can be confusing.
- Sealing does not stop reflection or unsafe tricks, but for everyday code it is enough.
- Preview history: pattern matching for switch was preview in 17-20 and **final from 21**; if you build with 17 you must enable {{--enable-preview}} and cannot ship it to production (preview features are not compatible across releases).
- From Java 21, a switch **statement** that uses patterns or {{case null}} must also be exhaustive; only old-style statements over constants (enum/String/int) may miss cases and still compile — prefer the switch expression so it is always checked.
- Do not seal every interface: only use it when the set of subtypes is truly closed and you control it.

> Senior tip: sealed + record + exhaustive switch is a compact replacement for the visitor pattern in domains that change rarely. But if the domain must stay open for external plugins, do not seal it — you would block extension.`,
    follow: [`Why does a switch pattern on a sealed type not need {{default}}?`, `When do you use {{non-sealed}}, and how does it affect exhaustiveness?`, `How does a switch pattern handle {{null}} differently from a switch on String?`]
  },
  'modern-005': {
    q: `From Java 8 to 21, which features are most valuable when upgrading a system? What should the migrate path 8 → 17/21 look like?`,
    a: `**Summary:** biggest value is **GC/performance** (G1 default, ZGC), **language** (record, sealed, pattern matching, switch expression, text block), **runtime** (virtual threads in 21, strong encapsulation), and **security/lifecycle**; migrate should go step by step 8 → 11 → 17 → 21, run tests + jdeps, handle reflection/module before changing LTS.

### Most valuable features
- **Java 9**: collection factories {{List.of}}/{{Map.of}}, {{Optional}} additions, private interface methods, try-with-resources with effectively final variables, module system (may not use immediately).
- **Java 10**: {{var}} for locals.
- **Java 11 (LTS)**: {{String.isBlank}}/{{strip}}/{{lines}}/{{repeat}}, {{Files.readString}}, standard HTTP Client, single-file {{java Foo.java}}, {{Optional.isEmpty}}.
- **Java 14-16**: switch expression, text block, record, {{instanceof}} pattern, {{helpful NullPointerException}} (very useful for debug).
- **Java 17 (LTS)**: sealed class, strong encapsulation by default, SecurityManager gradually removed, many GC improvements.
- **Java 21 (LTS)**: **virtual thread** (JEP 444), pattern matching for switch, record pattern, sequenced collections ({{getFirst}}/{{getLast}}/{{reversed}}), generational ZGC, key encapsulation API.
- **GC**: G1 default from 9; ZGC (11+) and Shenandoah for low pause; Epsilon for benchmark. From 21, generational ZGC improves throughput.
- **Others**: Compact Strings (9), AppCDS default (12+), container awareness (10+), TLS 1.3, startup improvements.

### Why upgrade
- Security: old versions no longer receive patches.
- Performance: better GC and JIT; G1/ZGC reduce pause.
- Ecosystem: Spring Boot 3 requires Java 17; many new libraries drop 8.
- Virtual threads reduce thread cost for I/O, simplify blocking code.

### Migration path
1. **Measure baseline**: test suite, JMH, heap/GC log, dependency tree.
2. **8 → 11**: run {{jdeps --jdk-internals}}, replace removed APIs (JAXB, JAX-WS, CORBA, Nashorn), update TLS, handle {{--illegal-access}} (11 still allows, 17 is strict).
3. **11 → 17**: clean reflection into JDK internals ({{--add-opens}}), upgrade Spring Boot 3 if used, check library bytecode (Lombok, CGLIB, Mockito) compatibility.
4. **17 → 21**: leverage pattern matching/record, try virtual threads where I/O-bound but **measure again** (pinning carrier thread with synchronized before Java 24; connection pool needs adjustment).
5. **CI**: run old/new JDK in parallel, integration tests, smoke test on staging with real load.
6. **Rollout**: new container image, can be blue-green; monitor GC, latency p99, memory.

### Pitfall
- Jumping straight 8 → 21 makes debugging harder; step through LTS helps isolate issues.
- Reflection/bytecode instrumentation (APM agent, old Lombok) is where most breaks happen.
- Old libraries using {{sun.misc.Unsafe}}: still run on 17/21, but memory access methods are deprecated for removal from Java 23 (JEP 471) and runtime warnings from 24 (JEP 498); plan to migrate to {{VarHandle}}/FFM API.
- Virtual threads are not faster for CPU-bound; do not replace all thread pools.
- {{--add-opens}} is temporary fix; fix code/library.
- Check TLS, certificates, and DB driver compatibility.

> Senior tip: treat JDK upgrade like a planned project, not a version change in pom. Start by running tests on new JDK in CI **before** production change; use jdeprscan to find soon-removed APIs and OpenRewrite to automate part of it.`,
    follow: [`Why go through each LTS instead of jumping straight 8 → 21?`, `What problem does virtual thread solve and not solve?`, `How does strong encapsulation from Java 17 affect old libraries?`]
  },
  'modern-006': {
    q: `{{var}}, text block and switch expression: real benefits and pitfalls to avoid?`,
    a: `**Summary:** {{var}} reduces boilerplate but only for locals and should keep meaningful names; text block writes multi-line strings easily, needs understanding of indentation stripping rules; switch expression returns a value, no fallthrough, and requires exhaustive coverage.

### var (Java 10)
- Type inferred at compile from initializer; not dynamic typing, no runtime cost.
- Only for **local variables**, including for/foreach, try-with-resources; not for fields, parameters, return type.
- Cannot use without initializer: {{var x;}} wrong; {{var x = null;}} also wrong.
- Should use when type is long and clear from right side: {{var users = new ArrayList<User>();}}, {{var entry = map.entrySet().iterator().next();}}.
- Not when type unclear: {{var result = service.process();}} — reader must jump to method. Prefer descriptive variable name or explicit type.
- Pitfall: {{var}} with anonymous class keeps anonymous type (different from diamond); {{var}} for lambda parameters (Java 11) mainly to attach annotations, e.g. {{(@NonNull var s) -> s.length()}}.
- Not affecting public API; do not overuse for shorter code that becomes harder to read.

### Text block (Java 15)
~~~java
String sql = """
        SELECT id, name
        FROM users
        WHERE active = true
        ORDER BY name
        """;
~~~
- Opens with three double quotes + mandatory newline; closes with three double quotes.
- **Incidental whitespace** (smallest common indentation + trailing whitespace) is stripped; uses {{stripIndent}} semantics.
- Final char before closing affects trailing newline; be careful when comparing.
- Escapes still work; has {{ \\s }} to keep trailing space; no need to escape single double quote.
- Has {{formatted}} or {{String.format}}; no direct interpolation (String template removed from 23).
- Great for SQL/JSON/HTML/XML; but **do not** concatenate user data into SQL text block — still use PreparedStatement.

### Switch expression (Java 14)
~~~java
String label = switch (status) {
    case ACTIVE, PENDING -> "mo";
    case CLOSED -> "dong";
    case null -> "khong ro";         // case null needs Java 21
    default -> "khac";
};
~~~
- Uses {{->}} no fallthrough, no {{break}} needed; can use block + {{yield}}.
- Must cover everything (exhaustive) for expression; enum/String must have default if not fully covered.
- Selector null: throws NPE if no {{case null}} (for switch on reference type).
- Can return directly, reducing temp variables and missing-branch errors.
- Switch statement can still use old syntax; migrate gradually to arrow to avoid fallthrough.
- For enum, adding new constant without case causes compile error in switch expression — great for safe refactoring.

### Common pitfalls
- {{var}} makes code harder to read when type is important for review; do not use in public API.
- Text block keeps unexpected indentation if closing quote placed at wrong column; use IDE format and test string.
- Switch expression on {{null}} differs from old switch; if data may be null, add {{case null}} or check before.
- Do not use text block to build dynamic SQL; that is a security bug, not a style issue.

> Senior tip: use text block for fixed SQL/JSON queries in tests or queries, but dynamic data still binds via placeholders. For {{var}}, team convention should be: use when right side clearly states type, avoid when calling method with complex return type.`,
    follow: [`Why can {{var}} not be used for fields or parameters?`, `By what rule does text block strip indentation?`, `How does switch expression handle missing enum case?`]
  },
  'modern-007': {
    q: `How do functional interface, lambda capture "effectively final" and method reference work? Any pitfalls?`,
    a: `**Summary:** functional interface has exactly **one** abstract method (SAM); lambda captures local variables only **effectively final** (not reassigned) by value; method reference is shorthand for lambda, but can cause ambiguity or boxing if not careful.

### Functional interface
- Interface with one abstract method, e.g. {{Runnable}}, {{Comparator<T>}}, {{Function<T,R>}}, {{Predicate<T>}}.
- {{@FunctionalInterface}} is compile-time check, not mandatory.
- Can have default/static methods; they do not count toward SAM.
- Lambda does not create new class per expression: compiler uses {{invokedynamic}} + {{LambdaMetafactory}} to generate implementation, usually lighter than anonymous class.
- Method reference can be used wherever functional interface is needed.

### Lambda capture
- Lambda captures local variables by **value** at creation time; variable must be **effectively final** (not reassigned after initialization).
- Enclosing object fields are not restricted; lambda holds {{this}} and reads fields through it (fields can change).
- {{this}} in lambda points to **enclosing instance**, different from anonymous class (in anonymous class {{this}} is the anonymous instance).
- Cannot use {{break}}/{{continue}} to jump out of lambda; {{return}} in lambda returns from lambda.
- Loop creating many lambdas capturing changing variable → compile error; use new local variable inside loop.

~~~java
int base = 10;                 // not reassigned -> OK
Function<Integer, Integer> f = x -> x + base;

int count = 0;
// count++;                    // reassignment makes lambda below fail compile
Runnable r = () -> System.out.println(count);

String prefix = "ID-";
List<String> ids = items.stream()
    .map(s -> prefix + s)      // capture prefix
    .toList();
~~~

### Method reference
- 4 forms: static ({{Integer::parseInt}}), instance of specific object ({{System.out::println}}), unbound instance ({{String::length}} equivalent to {{s -> s.length()}}), constructor ({{ArrayList::new}}).
- Benefit: short, clear when method has good name.
- Drawback: can be hard to understand in long chains; sometimes lambda is clearer (especially with named parameters).
- Ambiguity: overload can make method reference not compile; must specify type or use lambda.
- Boxing: {{Function<Integer,Integer> f = x -> x + 1}} still boxes; use {{IntUnaryOperator}} if need to avoid.
- Method reference does not pass extra parameters; for method needing state, bind first.

### Pitfall
- Capturing mutable variable by using single-element array or {{AtomicInteger}} — works but easy to create race; prefer redesign.
- Lambda inside loop capturing loop variable (changing) → compile error; copy to new local.
- Checked exception does not pass through standard functional interface; must wrap or write custom interface.
- Serializability: lambda is serializable only if target type is {{Serializable}}; do not rely on it.
- {{peek}}/{{forEach}} with side effect in parallel is not safe.
- Method reference to method with hidden side effect can be surprising; read carefully.

> Senior tip: use method reference when it improves readability, but do not force it; a lambda with clear parameter names can be better than {{Foo::bar}}. And for hot paths, consider primitive-specialized functional interfaces to avoid boxing.`,
    follow: [`Why must local capture be effectively final?`, `How do {{this}} in lambda and anonymous class differ?`, `When does method reference cause overload ambiguity?`]
  },
  'modern-008': {
    q: `What pitfalls do {{Collectors.groupingBy}}/{{toMap}} have (duplicate key, null value), and how do you handle them correctly?`,
    a: `**Summary:** {{toMap}} throws {{IllegalStateException}} on duplicate keys and NPE on a null value; {{groupingBy}} throws NPE when the classifier returns null; fix it by supplying a merge function, filtering nulls first, or choosing the right downstream collector.

A collector is the recipe that tells a stream how to accumulate elements into a result (a list, a map, a count...). {{toMap}} and {{groupingBy}} are two of those recipes.

### toMap
~~~java
// wrong: duplicate key -> IllegalStateException
Map<String, User> byEmail = users.stream()
    .collect(Collectors.toMap(User::email, u -> u));

// right: pick the winning record
Map<String, User> byEmail = users.stream()
    .collect(Collectors.toMap(
        User::email,
        u -> u,
        (a, b) -> b,              // or merge by updatedAt
        LinkedHashMap::new));     // keeps insertion order if needed
~~~
- Duplicate key: the version without a merge function throws {{IllegalStateException}} ("Duplicate key ..."; since Java 9 the message includes both values).
- Null value: **NPE** — the two-argument version calls {{requireNonNull(value)}}, and the merge version uses {{Map.merge}}, which also forbids null values; filter with {{filter(Objects::nonNull)}} or replace null with a sentinel value (a stand-in object that means "no value").
- Null key: {{HashMap}} accepts it (the hash of null is 0) but {{ConcurrentHashMap}} does not; do not rely on null keys — filter or guarantee non-null.
- Without a merge function there is no way to know which duplicate to keep; do not "fix" it by swallowing the exception.

### groupingBy
- {{groupingBy(classifier)}} returns {{Map<K, List<T>>}}; if the classifier returns null ⇒ NPE (the key passed to {{computeIfAbsent}} is null).
- Downstream collectors (the collector applied to each group): {{counting()}}, {{mapping()}}, {{summingInt()}}, {{averagingInt()}}, {{joining()}}, {{toSet()}}, {{collectingAndThen()}}.
- Want each group to be a {{Set}} or another type: pass {{toSet()}}, {{toMap()}}... as the downstream collector.
- Want to keep order: {{groupingBy(classifier, LinkedHashMap::new, downstream)}}.
- Want sorting: {{TreeMap::new}} — but remember that the comparator must be consistent with equals.
- {{partitioningBy}} only splits into true/false groups and always has both keys.

### Useful collectors
- {{teeing}} (Java 12): combine two collectors over the same elements, e.g. count and average in one pass.
- {{flatMapping}} (Java 9): flatten a collection inside the downstream.
- {{filtering}} (Java 9): filter before the downstream collector sees an element.
- {{collectingAndThen}}: transform the final result (e.g. wrap it as unmodifiable).

### Pitfalls
- Using {{toMap}} and being surprised that data disappeared: actually it throws, but a merge function that returns the wrong value loses data silently.
- {{groupingBy}} with a null classifier: one dirty row explodes the whole pipeline; filter first.
- A null value in a downstream {{toMap}} still throws NPE; check carefully.
- Using the default {{HashMap}} and relying on order: the result order is not specified; use {{LinkedHashMap}}/{{TreeMap}}.
- Parallel: the collector itself does **not** need a thread-safe container (each thread accumulates into its own container, then the combiner merges them), but a hand-written supplier/accumulator/combiner must be correct and must not share mutable state.
- Avoid side effects in the classifier/downstream; a collector should be a pure function (same input gives the same output, with no external mutation).

> Senior tip: when mapping rows from a database, always assume the key can repeat and the value can be null; write an explicit merge function (for example "keep the row with the latest timestamp") instead of letting an exception blow up in production. And for reports, use {{LinkedHashMap}}/{{TreeMap}} so the order is stable across runs.`,
    follow: [`Why does {{toMap}} throw NPE when the value is null?`, `How do you group by several nested criteria?`, `When would you use {{teeing}}?`]
  }
});
