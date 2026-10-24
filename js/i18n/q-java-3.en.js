/*
 * English translation of js/data/q-java.js — task T161. Format: js/core/i18n.js (content overlay).
 * ids: collections-013 collections-014 modern-001 modern-002 modern-003 modern-004 modern-005 modern-006 modern-007 modern-008
 */
App.i18n.content({
  'collections-013': {
    q: `Sort in Java: TimSort is stable, {{Comparator.comparing().thenComparing()}}, {{nullsFirst}}, error "Comparison method violates its general contract".`,
    a: `**Summary:** Java uses **TimSort** (hybrid merge/insertion) for {{Arrays.sort}}/{{Collections.sort}} — stable, O(n log n) worst-case, O(n) for nearly sorted arrays; {{Comparator.comparing}} allows chain comparison; {{nullsFirst}}/{{nullsLast}} handle null safely; violating contract (transitivity, symmetry) throws {{IllegalArgumentException}}.

### TimSort
- Combines **merge sort** (stable, good for existing runs) and **insertion sort** (good for small / nearly sorted arrays).
- Finds natural "run" (sorted sequence), merges them; benefits from nearly sorted data ⇒ O(n) best case.
- **Stable**: equal elements keep relative order — important for multi-key sort (sort by secondary key first, then primary).
- Since Java 8: {{Arrays.sort}} for primitives uses dual-pivot quicksort (not stable); object arrays use TimSort.

### Comparator chain
~~~java
// Sort: status ASC, createdAt DESC, name ASC
Comparator<Order> cmp = Comparator
    .comparing(Order::getStatus)
    .thenComparing(Order::getCreatedAt, Comparator.reverseOrder())
    .thenComparing(Order::getName, Comparator.nullsFirst(String::compareTo));
orders.sort(cmp);
~~~
- {{comparing}}: key extractor + optional key comparator.
- {{thenComparing}}: chain additional comparator for tie-break.
- {{nullsFirst}}/{{nullsLast}}: wrapper for child comparator, treats null as smallest / largest.

### Useful static comparators
- {{Comparator.naturalOrder()}}, {{reverseOrder()}}
- {{Comparator.nullsFirst(naturalOrder())}}, {{nullsLast(...)}}
- {{comparingInt}}/{{comparingLong}}/{{comparingDouble}} avoid boxing.

### Error "Comparison method violates its general contract"
- Thrown when TimSort detects comparator that is **not transitive** or **not symmetric**.
- Common causes:
  1. **Comparator based on nullable field** without null handling: {{a.getName().compareTo(b.getName())}} throws NPE or violates transitivity when null is mixed in.
  2. **Incorrect complex comparison logic**: {{(a, b) -> a.x < b.x ? -1 : 1}} (forgets the equal case returning 0).
  3. **Comparing float/double with NaN**: {{Double.compare}} handles NaN, but self-written {{a < b ? -1 : 1}} fails with NaN.

~~~java
// Wrong: violates transitivity when null is present
Comparator<Person> bad = (a, b) -> a.getName().compareTo(b.getName());

// Correct: handle null explicitly
Comparator<Person> good = Comparator
    .comparing(Person::getName, Comparator.nullsFirst(String::compareTo));
~~~

### Pitfall
- **Primitive array sort is not stable**: {{Arrays.sort(int[])}} uses quicksort; for stable sort use {{Integer[]}} or {{List.sort}}.
- **Comparator not consistent with equals**: {{TreeSet}}/{{TreeMap}} use comparator, not {{equals}} — if comparator returns 0 for two different objects, TreeSet treats them as duplicates and removes one.
- **Null in stream sort**: {{stream.sorted()}} throws NPE if elements are null; use {{Comparator.nullsFirst}} or filter first.
- **Performance**: complex comparator in hot path — cache key extractor, avoid lambda capture.

> Senior tip: always test comparator with {{Collections.sort}} on data with null, duplicates, and verify stability by sorting twice with different keys. For large data, use {{comparingInt}}/{{comparingLong}} to avoid boxing. Do not write complex comparison logic — chain existing comparators.`,
    follow: [`Why is TimSort stable (stable) important for multi-key sort?`, `Primitive array sort ({{Arrays.sort(int[])}}) is not stable — how to sort int arrays stably?`, `How to debug "Comparison method violates its general contract" when the stack trace does not clearly point to the wrong line?`]
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
    q: `How does Stream lazy evaluation work? Distinguish stateful/stateless operations and when parallel stream is harmful?`,
    a: `**Summary:** intermediate operations only **build the pipeline**, nothing runs yet; terminal operation pulls data through. Stateful ops ({{sorted}}, {{distinct}}, {{limit}}) must hold state and may need to scan everything; parallel stream shares common {{ForkJoinPool.commonPool}} so it is harmful with I/O, small data, or blocking tasks.

### Lazy evaluation
~~~java
Stream<String> s = names.stream()
    .filter(n -> { System.out.println("filter " + n); return n.length() > 3; })
    .map(String::toUpperCase);       // no output yet
List<String> out = s.toList();       // terminal -> runs now
~~~
- Each element passes through the full pipeline before the next one starts (except stateful ops), so short-circuit works efficiently.
- {{findFirst}}, {{anyMatch}}, {{limit}} can stop early; {{forEach}} does not.
- Stream is **single-use**: reuse throws {{IllegalStateException}}.
- No terminal operation ⇒ nothing runs; a common mistake when forgetting {{collect}}/{{forEach}}.

### Stateful vs stateless
- **Stateless**: {{filter}}, {{map}}, {{flatMap}}, {{peek}}, {{mapToInt}} — process each element independently.
- **Stateful**: {{distinct}}, {{sorted}}, {{limit}}, {{skip}}, {{takeWhile}}/{{dropWhile}} — need buffer or full data knowledge.
- {{sorted}} on infinite stream never finishes; {{distinct}} must remember all seen values.
- Stateful ops make parallel less efficient due to synchronization/merge; {{limit}} in parallel is especially expensive.

### Parallel stream
- Default uses {{ForkJoinPool.commonPool()}} with threads = CPU - 1. All parallel streams in JVM **share** this pool.
- Harmful when:
  - Task is **blocking** (DB, HTTP, file): thread pool drains, other streams starve; even deadlock if tasks wait on each other.
  - Data is small: split/merge/fork overhead exceeds benefit.
  - Source is hard to split: {{LinkedList}}, {{Iterator}}, {{Stream.iterate}} — splitting is poor.
  - Heavy stateful op or non-thread-safe side effect.
  - Running inside environment with its own thread pool (web request) — easy contention.
- Beneficial when: large data, CPU-bound, good split source (ArrayList, array), stateless ops, no blocking.
- Brian Goetz estimation rule: N * Q > 10,000 (N = elements, Q = cost per element) before considering parallel.
- Custom pool: submit to custom {{ForkJoinPool}}, do not place {{parallelStream}} directly in request thread.

### Pitfall
- {{peek}} for debugging may not run without terminal op or due to short-circuit.
- Side effect in {{map}}/{{forEach}} (add to external list) is unsafe in parallel; use {{collect}}.
- {{Stream.iterate}} infinite + {{parallel}} splits very poorly; use {{Stream.iterate(seed, hasNext, next)}} (Java 9) or appropriate generator.
- Forgetting to close streams holding resources ({{Files.lines}}, {{Files.list}}) — use try-with-resources.

> Senior tip: default to sequential stream for clarity; only enable parallel after benchmark proves benefit and data is large enough. In web services, never call {{parallelStream}} for I/O — use virtual threads (Java 21) or a bounded executor.`,
    follow: [`Why does {{sorted}} on an infinite stream never return?`, `How do {{findFirst}} and {{findAny}} differ in parallel?`, `How to use a custom ForkJoinPool for parallel stream?`]
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
    q: `What are the characteristics of Record? How does compact constructor work, and can record be used as DTO / JPA entity?`,
    a: `**Summary:** record is a **final** class, immutable by declaration, auto-generates accessors/{{equals}}/{{hashCode}}/{{toString}}, has canonical constructor; compact constructor is used for validation/normalization; record is great for DTO/value object but **not** suitable for JPA entity.

### Features
- Declaration {{record Point(int x, int y)}} generates:
  - {{private final}} field for each component.
  - Accessor {{x()}}, {{y()}} (not {{getX()}}).
  - {{equals}}/{{hashCode}} by all components; {{toString}} like {{Point[x=1, y=2]}}.
  - Canonical constructor taking all components.
- Cannot extend another class (already final), but **implements interface**; can have static fields/methods, extra instance methods.
- No setter; "modify" by creating new record.
- Record serialization uses canonical constructor and components, not default field mechanism; no {{serialVersionUID}} needed (but can declare).
- Record pattern (Java 21) allows destructure in {{instanceof}}/switch.

### Compact constructor
~~~java
record Range(int lo, int hi) {
    Range {                          // no parameter list
        if (lo > hi) throw new IllegalArgumentException("lo > hi");
        // implicit assignment after validation
    }
}
record Order(String id, List<Item> items) {
    Order {
        Objects.requireNonNull(id);
        items = List.copyOf(items);   // defensive copy for mutable component
    }
}
~~~
- Compact constructor runs **before** fields are assigned; can reassign parameters to normalize.
- Cannot access {{this}} before assignment; cannot call instance method.
- Can declare full canonical constructor if needed, or auxiliary constructor calling {{this(...)}}.

### DTO
- Excellent: little boilerplate, immutable, readable, correct {{equals}}.
- Jackson supports record since 2.12 (needs {{jackson-databind}}); most mapping libraries support.
- Bean Validation: annotation on component applies (need proper config).
- Limit: no inheritance, no direct default values (must use auxiliary constructor), some older frameworks require no-arg constructor/getter.
- For large DTO, record is fine; if need to build gradually, use builder + regular class.

### JPA entity
- **Not recommended**: JPA requires no-arg constructor (can be protected), fields not final, proxy for lazy loading needs subclass (Hibernate creates proxy), dirty checking relies on mutable field snapshot.
- Record is final so Hibernate cannot create proxy; accessor not standard getter; final field cannot be set during load.
- Hibernate 6 supports record for some cases ({{@Embeddable}}, projection) but entity should still be regular class.
- Can use record for **projection** in JPQL constructor expression or interface projection; very convenient for read-only.
- For DTO from entity, manual mapping or MapStruct.

### Pitfall
- Record does not deep-copy mutable components automatically; must {{List.copyOf}} in compact constructor.
- {{equals}} uses all components; if derived/cached field should not be included, do not add to record.
- Do not use record for objects that change many times (builder pattern fits better).
- Reflection/serialization frameworks may not recognize record.

> Senior tip: use record for **value objects and DTOs**, keep JPA entities as regular classes. In compact constructor, always validate and copy collections; this is the only place to guarantee true immutability.`,
    follow: [`Why can Hibernate not create proxy for record?`, `What is the difference between compact constructor and canonical constructor?`, `How does record pattern (Java 21) help with nested data processing?`]
  },
  'modern-004': {
    q: `How do sealed class and pattern matching for switch (Java 21) work? What does exhaustiveness guarantee, and what pitfalls exist?`,
    a: `**Summary:** {{sealed}} limits permitted subclasses, helping model **algebraic data type**; switch pattern (Java 21) allows match by type + guard and compiler checks **exhaustive** if hierarchy is sealed, but must handle {{null}} and be careful when adding new subtype.

### Sealed
~~~java
sealed interface Shape permits Circle, Square, Triangle {}
record Circle(double r) implements Shape {}
record Square(double side) implements Shape {}
record Triangle(double a, double b, double c) implements Shape {}
~~~
- Subclass must be {{final}}, {{sealed}}, or {{non-sealed}}.
- Subclass must be in same module (or same package if unnamed module) as sealed type.
- Can use explicit {{permits}} or let compiler infer from classes in same file.
- Benefit: closes the type set, allows compiler to check completeness, documents domain.

### Pattern matching for switch
~~~java
double area(Shape s) {
    return switch (s) {
        case Circle c            -> Math.PI * c.r() * c.r();
        case Square q            -> q.side() * q.side();
        case Triangle t          -> heron(t);
        // no default needed because Shape is sealed and fully covered
    };
}
~~~
- Java 21 allows switch on any reference type, combining type pattern, record pattern, guard {{when}}.
- {{case null}} can be declared separately; if omitted, switch pattern throws NPE when selector is null (unlike old switch on String also NPE).
- Case order matters: specific case before general case; otherwise compiler reports "dominated".
- {{when}} guard: {{case Circle c when c.r() > 10 -> ...}}.
- Nested record pattern: {{case Point(int x, int y) -> ...}}; can destructure deeply.
- Exhaustiveness: with sealed hierarchy, compiler knows all subtypes and requires full coverage; with unsealed interface, needs {{default}}.

### What exhaustiveness guarantees
- If a new subtype is added to sealed interface, **every switch missing a case will be a compile error** — a major benefit over visitor/if-else, making refactoring safe.
- For switch expression, missing case is compile error (unlike old switch statement).
- However, exhaustiveness is only correct when hierarchy is truly sealed and compiler sees all subtypes; if {{non-sealed}} is used, property is lost.

### Pitfall
- {{null}}: forgetting to handle ⇒ runtime NPE; add {{case null -> ...}} if data may be null.
- Case order: general pattern before specific makes later case unreachable, compiler reports error but message can be confusing.
- Sealed does not prevent reflection/unsafe use, but for everyday code it is sufficient.
- Preview: pattern matching switch was preview in 17-20, **final from 21**; if building with 17 must enable {{--enable-preview}} and cannot use in production (preview is not compatible).
- From Java 21, switch **statement** using pattern or {{case null}} is also required to be exhaustive; only old-style statement (enum/String/int constants) can miss cases and still compile — prefer switch expression for always-checked behavior.
- Do not overuse sealed for every interface: only when subtype set is truly closed and you control it.

> Senior tip: sealed + record + exhaustive switch is a trio that replaces visitor pattern very concisely for domains that change little. But if domain is open for external plugins, do not seal — you will block extension.`,
    follow: [`Why does switch pattern on sealed type not need {{default}}?`, `When to use {{non-sealed}} and how does it affect exhaustiveness?`, `How does switch pattern handle {{null}} differently from String switch?`]
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
    q: `What pitfalls do {{Collectors.groupingBy}}/{{toMap}} have (duplicate key, null value) and how to handle correctly?`,
    a: `**Summary:** {{toMap}} throws {{IllegalStateException}} for duplicate keys and NPE for null value; {{groupingBy}} throws NPE when classifier returns null; fix by providing merge function, filtering null first, or using appropriate downstream.

### toMap
~~~java
// wrong: duplicate key -> IllegalStateException
Map<String, User> byEmail = users.stream()
    .collect(Collectors.toMap(User::email, u -> u));

// correct: choose winning record
Map<String, User> byEmail = users.stream()
    .collect(Collectors.toMap(
        User::email,
        u -> u,
        (a, b) -> b,              // or merge by updatedAt
        LinkedHashMap::new));     // keep order if needed
~~~
- Duplicate key: version without merge function throws {{IllegalStateException}} ("Duplicate key ...", from Java 9 includes both values).
- Null value: **NPE** — 2-argument version checks {{requireNonNull(value)}}; version with merge uses {{Map.merge}} which forbids null value; filter with {{filter(Objects::nonNull)}} or replace with sentinel.
- Null key: {{HashMap}} accepts (hash of null is 0) but {{ConcurrentHashMap}} does not; do not rely on null key, filter or ensure non-null.
- Without merge function you cannot know which to keep; do not suppress exception blindly.

### groupingBy
- {{groupingBy(classifier)}} returns {{Map<K, List<T>>}}; classifier returns null ⇒ NPE (due to {{computeIfAbsent}}/key null).
- Downstream: {{counting()}}, {{mapping()}}, {{summingInt()}}, {{averagingInt()}}, {{joining()}}, {{toSet()}}, {{collectingAndThen()}}.
- Want child map to be {{Set}} or different type: pass downstream {{toSet()}}, {{toMap()}}...
- Want to keep order: {{groupingBy(classifier, LinkedHashMap::new, downstream)}}.
- Want sorted: {{TreeMap::new}}; but remember comparator/equals consistency.
- {{partitioningBy}} only splits into two groups true/false, always has both keys.

### Useful collectors
- {{teeing}} (Java 12): combine two collectors, e.g. count and average together.
- {{flatMapping}} (Java 9): flatten collection inside downstream.
- {{filtering}} (Java 9): filter before collecting downstream.
- {{collectingAndThen}}: transform final result (e.g. wrap unmodifiable).

### Pitfall
- Using {{toMap}} then surprised by lost data: actually throws exception, but if merge function returns wrong result data is lost silently.
- {{groupingBy}} with null classifier: dirty data explodes whole pipeline; filter first.
- Null value in downstream {{toMap}} still NPE; check carefully.
- Using default {{HashMap}} and relying on order: result not guaranteed; use {{LinkedHashMap}}/{{TreeMap}}.
- Parallel: collector does **not** need thread-safe container (each thread has own container then merged by combiner), but self-written supplier/accumulator/combiner must be correct and not use shared state.
- Avoid side effects in classifier/downstream; collector should be pure.

> Senior tip: when mapping data from DB, always assume key may duplicate and value may be null; write explicit merge function (e.g. keep latest by timestamp) rather than letting exception blow up in production. And for reports, use {{LinkedHashMap}}/{{TreeMap}} for stable order across runs.`,
    follow: [`Why does {{toMap}} throw NPE when value is null?`, `How to group by multiple nested criteria?`, `When to use {{teeing}}?`]
  }
});
