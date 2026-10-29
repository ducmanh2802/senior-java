/*
 * English translation of js/data/quiz-java.js — task T420. Format: js/core/i18n.js (content overlay).
 * ids: qz-collections-016 qz-collections-017 qz-collections-018 qz-collections-019 qz-collections-020 qz-modern-007 qz-modern-008 qz-modern-009 qz-modern-010 qz-modern-011 qz-modern-012 qz-modern-013 qz-modern-014 qz-modern-015 qz-modern-016 qz-modern-017 qz-modern-018 qz-modern-019 qz-modern-020 qz-concurrency-007 qz-concurrency-008 qz-concurrency-009 qz-concurrency-010
 */
App.i18n.content({
  "qz-collections-016": {
    "q": `The input data may contain {{null}}. Which operations run **without throwing an exception**? (Choose 3)`,
    "options": [
      `new HashMap<String, Integer>().put(null, 1)`,
      `new ConcurrentHashMap<String, Integer>().put("k", null)`,
      `new TreeMap<String, Integer>().put(null, 1)`,
      `new ArrayList<String>().add(null)`,
      `new ArrayDeque<String>().offer(null)`,
      `new LinkedHashSet<String>().add(null)`
    ],
    "explain": `**Correct answer: HashMap.put(null, …), ArrayList.add(null), LinkedHashSet.add(null).**

### Why it is correct
- {{HashMap}} allows **one null key** (the hash of null is defined to be 0, so it sits in bucket 0) and any number of null values.
- {{ArrayList}} accepts null like any other element.
- {{LinkedHashSet}} is backed by a LinkedHashMap, so it accepts one null element.

### Why the other options are wrong
- **ConcurrentHashMap**: forbids both null keys and null values (NPE). The design reason: in a concurrent environment {{get(k) == null}} must have exactly one meaning, "there is no such key"; if null values were allowed you could not tell the two cases apart, and you could not do check-then-act atomically.
- **TreeMap.put(null)** with natural ordering: it has to call {{compareTo}} on the key → NPE (even when the map is empty, because TreeMap calls compare(key, key) to check the key type).
- **ArrayDeque.offer(null)**: forbids null because {{poll()}}/{{peek()}} use null to signal that the deque is empty.

> Senior tip: when you migrate a {{HashMap}} to a {{ConcurrentHashMap}} to "fix a thread-safety bug", any old code doing {{put(k, null)}} will blow up with an NPE in production. Grep for puts that can receive null first, then switch to {{Optional}} or a sentinel object.`
  },
  "qz-collections-017": {
    "q": `A service needs to keep **10 million long ids** in memory to check existence (64-bit JVM, compressed oops). Roughly how much heap does a {{HashSet<Long>}} take, and what is the better choice?`,
    "options": [
      `About 80 MB, because each long is 8 bytes and HashSet adds almost nothing on top`,
      `About 160 MB; switch to LinkedList<Long> to reduce the overhead`,
      `Around 600 MB (node + boxed Long + bucket array); use a sorted long[] plus Arrays.binarySearch (about 80 MB) or a primitive collection library`,
      `Around 600 MB; switch to TreeSet<Long> because a tree is more compact than a hash table`
    ],
    "explain": `**Correct answer: around 600 MB; use a sorted long[] + binarySearch or a primitive collection.**

### Why it is correct
Estimate of each element in a {{HashSet<Long>}} (a HashSet wraps a HashMap):
| Component | Approximate size |
|---|---|
| {{HashMap.Node}} (header 12 + hash 4 + key/value/next 3×4) | 32 bytes |
| The {{Long}} object (header 12 + long 8, padded to 8) | 24 bytes |
| Slot in the table array (capacity ~16M × 4 bytes / 10M) | ~6–7 bytes |
Total ~62 bytes × 10 million ≈ **600 MB**, about 7× the real data (80 MB). A sorted {{long[]}} is only 80 MB with O(log n) ≈ 24 probes; or use {{LongOpenHashSet}} (fastutil), Eclipse Collections, or a RoaringBitmap when the ids are dense.

### Why the other options are wrong
- **80 MB**: ignores boxing and the node/hash-table overhead.
- **LinkedList<Long>**: 24 bytes per node + 24 bytes per Long, and lookup becomes O(n) — worse on every axis.
- **TreeSet<Long>**: each {{TreeMap.Entry}} (key, value, left, right, parent, color) is about 40 bytes, even more expensive than HashSet.

> Senior tip: this number shows up in heap dumps all the time: {{java.lang.Long}} and {{HashMap$Node}} sit at the top of the histogram. Before raising {{-Xmx}}, ask "can this be stored as a primitive?". For an id set that must be shared between several instances, consider a Redis set or a Bloom filter (accepting false positives).`
  },
  "qz-collections-018": {
    "q": `A leaderboard screen must sort by score descending, with people who **have no score (null)** placed last. What does the following code print?
~~~java
record P(String name, Integer score) {}
List<P> ps = new ArrayList<>(List.of(
    new P("An", 8), new P("Binh", null), new P("Chi", 9)));
ps.sort(Comparator.comparing(P::score,
        Comparator.nullsLast(Comparator.reverseOrder())));
System.out.println(ps.stream().map(P::name).toList());
~~~`,
    "options": [
      `[Binh, Chi, An]`,
      `NullPointerException, because Comparator.comparing cannot handle a null key`,
      `[An, Chi, Binh]`,
      `[Chi, An, Binh]`
    ],
    "explain": `**Correct answer: [Chi, An, Binh].**

### Why it is correct
{{Comparator.comparing(keyExtractor, keyComparator)}} extracts the key (score) and then compares it with {{keyComparator}}. Here the keyComparator is {{nullsLast(reverseOrder())}}: null sorts last, and non-null values are compared in reversed (descending) order. Result: Chi (9), An (8), Binh (null).

### Why the other options are wrong
- **[Binh, Chi, An]**: that is {{nullsFirst}}.
- **NPE**: this happens with the single-argument {{Comparator.comparing(P::score)}} (it calls {{compareTo}} on null), or with {{comparing(P::score).reversed()}}. The two-argument version with nullsLast handles null.
- **[An, Chi, Binh]**: ascending order, ignoring reverseOrder.

> Senior tip: the classic trap is {{comparing(P::score).reversed().thenComparing(P::name)}} versus {{comparing(P::score, reverseOrder()).thenComparing(P::name)}}: {{reversed()}} reverses **the whole comparator chain in front of it**, so it is easy to reverse the secondary criteria by accident. {{List.sort}} uses TimSort, which is stable, so sorting several times by different criteria keeps the relative order of equal elements.`
  },
  "qz-collections-019": {
    "q": `A unit test compares {{Set.of("a", "b", "c").toString()}} with the fixed string {{"[a, b, c]"}}. It passes on the dev machine, but on CI it passes and fails intermittently without any code change. Why?`,
    "options": [
      `Set.of/Map.of deliberately shuffle the iteration order with a random salt chosen at each JVM start`,
      `String.hashCode() returns different results between JVM runs`,
      `The GC moves objects around, so the order inside the hash table changes`,
      `Set.of is a view over the argument array, so it depends on the order in which the compiler arranges the arguments`
    ],
    "explain": `**Correct answer: Set.of/Map.of use a random salt at each JVM run.**

### Why it is correct
The immutable collections created by {{Set.of}}/{{Map.of}} (Java 9+) compute element positions from a hash combined with a **SALT** generated randomly when the JVM starts. The purpose is deliberate: **to stop code from depending on iteration order**, which is not specified anywhere. So the order is stable within one run but changes between runs.

### Why the other options are wrong
- **String.hashCode**: it is a deterministic formula ({{s[0]*31^(n-1) + ...}}), identical on every run.
- **The GC moves objects**: the position in the hash table depends on the hashCode, not on the memory address; the identity hash is also kept stable when an object moves.
- **A view of an array**: Set.of copies the elements into its own structure; it is not a view.

> Senior tip: HashMap/HashSet usually give a stable order, so such a test "accidentally" passes and then breaks when you upgrade the JDK or change the capacity. Tests should compare by meaning: {{assertEquals(Set.of(...), actual)}}, JSONAssert/AssertJ {{containsExactlyInAnyOrder}}; when order matters, use {{LinkedHashMap}}/{{TreeMap}} or Jackson {{ORDER_MAP_ENTRIES_BY_KEYS}}.`
  },
  "qz-collections-020": {
    "q": `A service reads 1 million rows into an {{ArrayList<Row>}}, then stores {{bigList.subList(0, 10)}} in a long-lived cache to display the "10 newest rows". The heap keeps growing after every load. Why?`,
    "options": [
      `subList copies the 10 elements, but the original ArrayList never calls trimToSize`,
      `subList is a view that keeps a reference to the original list, so all 1 million Rows can never be garbage collected`,
      `subList creates a new array with the same capacity as the original list`,
      `subList keeps an open iterator, which prevents the ArrayList from being freed`
    ],
    "explain": `**Correct answer: subList is a view that keeps a reference to the original list.**

### Why it is correct
{{ArrayList.subList}} returns a {{SubList}} object that holds a reference to the original list plus an offset and a size; every read/write goes straight down into the original array. The cache keeps the SubList → keeps the original ArrayList → keeps the 1-million-element array and every Row. Each load adds another ~1 million "leaked" objects.
Fix: {{cache.put(key, List.copyOf(bigList.subList(0, 10)))}} or {{new ArrayList<>(...)}}.

### Why the other options are wrong
- **Copies the 10 elements**: subList does not copy.
- **A new array with the same capacity**: it does not create any array at all.
- **An open iterator**: Java iterators do not hold "open/closed" resources; the problem is the reference, not an iterator.

> Senior tip: the same phenomenon appears with {{String.substring}} before Java 7u6 (it shared the original char array), {{ByteBuffer.slice()}}, {{Arrays.asList}}, and {{Map.keySet()}}. In a heap dump, a SubList whose retained size is huge compared to its 10 elements is the giveaway. Also, structurally modifying the original list after taking a subList view throws a CME when the view is used again.`
  },
  "qz-modern-007": {
    "q": `What does the following code print?
~~~java
Stream.of("a", "bb", "ccc", "dddd")
      .peek(s -> System.out.print("p:" + s + " "))
      .filter(s -> s.length() > 1)
      .map(String::toUpperCase)
      .findFirst()
      .ifPresent(s -> System.out.print("r:" + s));
~~~`,
    "options": [
      `p:a p:bb p:ccc p:dddd r:BB`,
      `r:BB p:a p:bb`,
      `p:a p:bb r:BB`,
      `Nothing from peek, because peek only runs in debug mode`
    ],
    "explain": `**Correct answer: p:a p:bb r:BB.**

### Why it is correct
A stream is **lazy** and pushes **one element at a time through the whole pipeline** (vertical), not one step at a time over the entire list (horizontal):
1. "a" → peek prints {{p:a}} → the filter rejects it.
2. "bb" → peek prints {{p:bb}} → passes the filter → mapped to "BB" → {{findFirst}} has a result.
3. {{findFirst}} is a **short-circuiting** terminal operation, so it stops; "ccc" and "dddd" are never pulled from the source.
Then {{ifPresent}} prints {{r:BB}}.

### Why the other options are wrong
- **Prints all 4 elements**: that assumes each step processes the whole list before moving on to the next step (like several separate loops).
- **r:BB first**: ifPresent runs only after the terminal operation returns the Optional.
- **peek only runs in debug**: peek runs normally whenever an element flows through; the true statement is that peek **may not run** if the implementation can skip elements (for example {{count()}} on a source whose size is known, since Java 9).

> Senior tip: never put important side effects (audit logging, state updates) inside {{peek}}/{{map}}: how many times they run depends on short-circuiting and on JDK optimizations. For example {{List.of(1,2,3).stream().peek(log::info).count()}} prints nothing on Java 9+ because count is computed directly from the size.`
  },
  "qz-modern-008": {
    "q": `The following record uses a compact constructor to normalize its data. What does the code print?
~~~java
record Range(int lo, int hi) {
    Range {
        if (lo > hi) { int t = lo; lo = hi; hi = t; }
    }
}
// main:
System.out.println(new Range(5, 1) + " " + new Range(1, 5).equals(new Range(5, 1)));
~~~`,
    "options": [
      `Compile error: you are not allowed to reassign the parameters in a compact constructor`,
      `Range[lo=5, hi=1] false`,
      `Range[lo=1, hi=5] false, because a record's equals compares references`,
      `Range[lo=1, hi=5] true`
    ],
    "explain": `**Correct answer: Range[lo=1, hi=5] true.**

### Why it is correct
A compact constructor does not declare a parameter list; {{lo}} and {{hi}} inside it are **implicit parameters**, and reassigning them is allowed. The compiler inserts {{this.lo = lo; this.hi = hi;}} **at the end** of the constructor, so the values after the swap are what get stored in the fields. That is why {{new Range(5, 1)}} stores lo=1, hi=5.
The generated record {{equals}} compares **each component** → two Ranges (1, 5) are equal → {{true}}. The generated {{toString}} has the form {{Range[lo=1, hi=5]}}.

### Why the other options are wrong
- **Compile error**: reassigning the parameters is legal; what is forbidden is assigning directly to {{this.lo = ...}} inside a compact constructor.
- **[lo=5, hi=1]**: ignores the fact that the fields are assigned after the compact constructor body runs.
- **equals compares references**: a record generates an equals that compares component values.

> Senior tip: the compact constructor is the place for validation and normalization ({{Objects.requireNonNull}}, {{List.copyOf}} for collection components, trimming strings). But avoid silently swapping values the way the example does in business code: throwing {{IllegalArgumentException}} is usually clearer than "self-correcting" bad data.`
  },
  "qz-modern-009": {
    "q": `Module A declares {{sealed interface Payment permits Card, Wallet}}. Module B has a **switch** with pattern matching that is **exhaustive and has no default** over Payment. The team adds {{record Crypto}} to the permits list, then builds and redeploys A but **does not recompile B** (it keeps using the old jar). When B receives a Crypto at runtime (Java 21), what happens?`,
    "options": [
      `B throws MatchException, because the compiler inserted an implicit branch for the "no match" case`,
      `The switch returns null for the unmatched type`,
      `The JVM refuses to load the Crypto class, because B does not know about it`,
      `The first case branch is chosen as the default`
    ],
    "explain": `**Correct answer: it throws MatchException.**

### Why it is correct
Exhaustiveness is checked **at compile time** against the permits list as it exists at that moment. Because the hierarchy can change after compilation (separate compilation), javac always adds an extra **implicit** default branch that throws if no case matches at runtime. With a pattern switch (Java 21), that error is {{java.lang.MatchException}}. (Before Java 21, a switch expression over an enum threw {{IncompatibleClassChangeError}} in this situation; JEP 441 unified it into MatchException.)
If B is recompiled, the compiler reports "the switch expression does not cover all possible input values" — that is the main benefit of sealed: the compiler points out every place that needs updating.

### Why the other options are wrong
- **Returns null**: a switch expression never silently returns null when nothing matches.
- **Refuses to load Crypto**: class loading has nothing to do with whether a switch in another module knows the subtype.
- **Picks the first case**: there is no such fallback mechanism.

> Senior tip: this is why a sealed hierarchy exposed across a module/library boundary is an **API commitment**: adding a subtype is a breaking change for every consumer that has an exhaustive switch. In microservices, do not share a sealed type through a common library if the services deploy independently; use a DTO with a type field and a safe default.`
  },
  "qz-modern-010": {
    "q": `What does the following code print?
~~~java
Optional<String> name = Optional.of("  ");
String r = name.filter(s -> !s.isBlank())
               .map(String::trim)
               .or(() -> Optional.of("guest"))
               .orElseThrow();
System.out.println("[" + r + "]");
~~~`,
    "options": [
      `[  ]`,
      `[guest]`,
      `[]`,
      `Throws NoSuchElementException at orElseThrow`
    ],
    "explain": `**Correct answer: [guest].**

### Why it is correct
1. {{Optional.of("  ")}}: it has a value (a string of two spaces, not null).
2. {{filter(s -> !s.isBlank())}}: {{isBlank()}} (Java 11) returns true for a whitespace-only string, so the predicate is false → the Optional becomes **empty**.
3. {{map}} on an empty Optional does not run.
4. {{or(...)}} (Java 9) returns a replacement Optional when this one is empty → {{Optional.of("guest")}}.
5. {{orElseThrow()}} (Java 10, no arguments) returns the value → "guest".

### Why the other options are wrong
- **[  ]**: the filter has already rejected the blank string.
- **[]**: map(trim) never runs because the Optional is already empty after the filter.
- **NoSuchElementException**: {{or}} has already supplied a replacement value before orElseThrow.

> Senior tip: distinguish {{or}} (returns an Optional, used to chain sources: cache → DB → default) from {{orElse}}/{{orElseGet}} (returns a value). Optional is a good **return type**; it should not be an entity field, a method parameter, or a collection element.`
  },
  "qz-modern-011": {
    "q": `What does the following code print?
~~~java
record Order(String customer, int amount) {}
List<Order> os = List.of(new Order("B", 5), new Order("A", 10), new Order("A", 7));
Map<String, Integer> m = os.stream().collect(Collectors.groupingBy(
        Order::customer, TreeMap::new, Collectors.summingInt(Order::amount)));
System.out.println(m);
~~~`,
    "options": [
      `{A=[10, 7], B=[5]}`,
      `Compile error: groupingBy does not accept a map factory argument`,
      `{A=17, B=5}`,
      `IllegalStateException: Duplicate key A`
    ],
    "explain": `**Correct answer: {A=17, B=5}.**

### Why it is correct
{{groupingBy}} has a 3-argument overload: {{classifier}}, {{mapFactory}} (here {{TreeMap::new}}, so the keys are sorted: A before B), and a **downstream collector** that combines the elements of each group. {{summingInt}} adds the amount within each group: A = 10 + 7 = 17, B = 5.

### Why the other options are wrong
- **{A=[10, 7], B=[5]}**: that is the result with the default downstream ({{toList()}}); here the downstream is summingInt.
- **Does not accept a map factory**: the overload {{groupingBy(classifier, mapFactory, downstream)}} has existed since Java 8.
- **Duplicate key**: that is the behaviour of {{Collectors.toMap}} without a merge function; groupingBy is designed to combine elements that share a key.

> Senior tip: the downstream collector is where you save memory: {{groupingBy(.., counting())}}, {{summingLong}}, {{mapping(Order::id, toSet())}}, {{maxBy}} avoid building an intermediate List only to compute something from it. For large data that lives in a database, GROUP BY in SQL is still cheaper than pulling the whole table up and running groupingBy.`
  },
  "qz-modern-012": {
    "q": `How does the following code behave (Java 17)?
~~~java
List<String> a = Stream.of("x", null).toList();
List<String> b = Stream.of("x", null).collect(Collectors.toList());
b.add("y");
a.add("y");
~~~`,
    "options": [
      `Stream.toList() throws NullPointerException because of the null element`,
      `Both add calls work because both lists are ArrayLists`,
      `b.add throws UnsupportedOperationException because Collectors.toList returns an unmodifiable list`,
      `Both a and b contain null; b.add works; a.add throws UnsupportedOperationException`
    ],
    "explain": `**Correct answer: both contain null, b.add works, a.add throws UnsupportedOperationException.**

### Why it is correct
- {{Stream.toList()}} (Java 16) returns an **unmodifiable list** that **allows null** (unlike {{List.of}}/{{Collectors.toUnmodifiableList()}}, which forbid null).
- {{Collectors.toList()}}: the Javadoc gives **no guarantee** about the type or mutability, but the current implementation returns an {{ArrayList}}, so {{add}} works.

| Method | Modifiable? | Allows null? |
|---|---|---|
| {{Stream.toList()}} | No | Yes |
| {{Collectors.toList()}} | Yes (in practice, not guaranteed) | Yes |
| {{Collectors.toUnmodifiableList()}} | No | No (NPE) |

### Why the other options are wrong
- **toList throws NPE**: that is the behaviour of toUnmodifiableList, not Stream.toList.
- **Both are ArrayLists**: Stream.toList returns an immutable list.
- **b.add throws UOE**: in practice Collectors.toList returns an ArrayList.

> Senior tip: when you mass-refactor {{collect(Collectors.toList())}} into {{.toList()}} (as the IDE suggests), any later code that calls {{add}}/{{sort}}/{{removeIf}} on the result will blow up with a UOE **at runtime**. Review those call sites, or use {{Collectors.toCollection(ArrayList::new)}} when you really do need to modify the result.`
  },
  "qz-modern-013": {
    "q": `Which snippets **compile**? (Choose 2)`,
    "options": [
      `int count = 0; list.forEach(x -> count++);`,
      `int[] count = {0}; list.forEach(x -> count[0]++);`,
      `String prefix = "a"; prefix = "b"; list.forEach(x -> System.out.println(prefix + x));`,
      `AtomicInteger c = new AtomicInteger(); list.forEach(x -> c.incrementAndGet());`,
      `for (int i = 0; i < 3; i++) { executor.submit(() -> System.out.println(i)); }`
    ],
    "explain": `**Correct answer: the single-element array and the AtomicInteger.**

### Why it is correct
A lambda may only use local variables that are **final or effectively final** (not reassigned after initialization). The reason: a lambda **captures the value** of the variable (a copy), it may run on another thread, after the method has already returned and its stack frame is gone; allowing reassignment would create confusion between the copy and the original variable.
- {{count}} of type {{int[]}} and {{c}} of type AtomicInteger: the **reference** never changes, only the contents of the object do → legal.

### Why the other options are wrong
- **count++**: reassigns the local variable inside the lambda → "local variables referenced from a lambda expression must be final or effectively final".
- **prefix = "b"**: it was reassigned earlier, so it is no longer effectively final, even though the lambda only reads it.
- **for (int i ...)**: the variable {{i}} is changed by {{i++}}. (With an enhanced for, {{for (int v : arr)}}, each iteration gets a fresh variable, so it works.)

> Senior tip: the {{int[]}} trick compiles, but it is **not thread-safe** if the stream/forEach runs in parallel. If you want to count, use {{stream().filter(...).count()}} or reduce and avoid side effects; only reach for AtomicInteger/LongAdder when several threads really need to count.`
  },
  "qz-modern-014": {
    "q": `What does the following code (Java 17) produce?
~~~java
static void print(Object o) {
    if (!(o instanceof String s)) {
        return;
    }
    System.out.println(s.length());
}
// main:
print("abc");
~~~`,
    "options": [
      `It compiles and prints 3, thanks to the flow scoping of the pattern variable`,
      `Compile error: the variable s only exists inside the if block`,
      `Compile error: you are not allowed to negate an instanceof pattern`,
      `Prints 3, but only with --enable-preview`
    ],
    "explain": `**Correct answer: it compiles and prints 3.**

### Why it is correct
Pattern variables have **flow scoping**: the variable {{s}} exists everywhere the compiler can prove the pattern **definitely matched**. Here, when the pattern does not match the method {{return}}s; so after the if block, {{o instanceof String s}} is definitely true and {{s}} can be used. Pattern matching for instanceof has been a final feature since **Java 16** (JEP 394).

### Why the other options are wrong
- **Only inside the if block**: the scope follows control flow, not blocks; the code would only fail if you removed the {{return}}.
- **Cannot negate**: negation is legal; it simply means {{s}} is in scope on the else branch / after it.
- **--enable-preview**: that was needed only on Java 14–15 (preview); since Java 16 it is standard.

> Senior tip: this "guard clause" form removes manual casts and reduces nested ifs. Combined with {{&&}} it works: {{if (o instanceof String s && !s.isBlank())}} is valid, while {{||}} is not ({{s}} is not guaranteed to be assigned). In {{equals}}: {{return o instanceof Point p && x == p.x && y == p.y;}}.`
  },
  "qz-modern-015": {
    "q": `What does the following code (Java 21) print?
~~~java
List<Integer> list = new ArrayList<>(List.of(1, 2, 3));
List<Integer> rev = list.reversed();
list.add(4);
rev.addFirst(0);
System.out.println(list + " " + rev.getFirst());
~~~`,
    "options": [
      `[1, 2, 3, 4] 4, because reversed() returns a copy`,
      `[1, 2, 3, 4, 0] 0`,
      `[0, 1, 2, 3, 4] 0`,
      `Throws UnsupportedOperationException because the reversed view is read-only`
    ],
    "explain": `**Correct answer: [1, 2, 3, 4, 0] 0.**

### Why it is correct
Java 21 added **Sequenced Collections** (JEP 431): {{List}}, {{Deque}}, {{LinkedHashSet}}, {{SortedSet}}... gain {{getFirst/getLast/addFirst/addLast/removeFirst/removeLast/reversed}}.
- {{reversed()}} returns a reversed **view** that writes straight down into the original list (as long as the original list is modifiable).
- {{list.add(4)}} → list = [1, 2, 3, 4], and the view now shows [4, 3, 2, 1].
- {{rev.addFirst(0)}}: the front of the view is the **end** of the original list → list = [1, 2, 3, 4, 0].
- {{rev.getFirst()}} = the last element of the original list = 0.

### Why the other options are wrong
- **A copy**: reversed() is a view and sees changes made after it was created.
- **[0, 1, 2, 3, 4]**: confuses addFirst on the view with addFirst on the original list.
- **Read-only**: the view inherits the mutability of the original list; it only throws UOE when the original is immutable ({{List.of}}).

> Senior tip: before Java 21 you had to write {{list.get(list.size() - 1)}} or {{deque.peekLast()}}, {{linkedHashMap.entrySet().iterator().next()}}... a different idiom for every type. When upgrading, watch out for hand-written classes implementing List that already have a {{getFirst()}} method with a different return type — they may no longer compile.`
  },
  "qz-modern-016": {
    "q": `Which statements are **true** about the following method (Java 21)? (Choose 2)
~~~java
static String classify(Object o) {
    return switch (o) {
        case null -> "null";
        case Integer i when i > 100 -> "big";
        case Integer i -> "int";
        case String s -> "str:" + s.length();
        default -> "other";
    };
}
~~~`,
    "options": [
      `classify(null) returns the string "null" instead of throwing NullPointerException`,
      `classify(500) returns "big"`,
      `Swapping the cases so that case Integer i comes before case Integer i when i > 100 still compiles`,
      `The default branch can be removed because the switch is already exhaustive`,
      `classify(150L) returns "big"`
    ],
    "explain": `**Correct answer: classify(null) returns "null" and classify(500) returns "big".**

### Why it is correct
- By default a switch throws an NPE when the selector is null; Java 21 allows an explicit **{{case null}}** to handle it.
- Cases are tried **from top to bottom**; {{Integer i when i > 100}} is a guarded pattern and matches 500.

### Why the other options are wrong
- **Swapping the cases**: {{case Integer i}} (without a guard) **dominates** the guarded case below it (every Integer has already been caught), and the compiler reports "this case label is dominated by a preceding case label".
- **Removing default**: {{Object}} is not a sealed type, so only default (or {{case Object o}}) makes the switch exhaustive; removing it is a compile error.
- **150L**: {{Long}} is not {{Integer}}, and patterns do not convert between numeric types → it falls into default, "other".

> Senior tip: with patterns, case order is semantics, not just presentation: put specific/guarded cases first and general cases later. When the selector is a sealed interface, **avoid default** so the compiler catches new subtypes.`
  },
  "qz-modern-017": {
    "q": `What does the following code produce?
~~~java
Stream<String> s = names.stream().filter(n -> n.startsWith("A"));
long c = s.count();
List<String> l = s.toList();
~~~`,
    "options": [
      `l contains the names that start with A`,
      `l is an empty list because the stream has already been consumed`,
      `Throws IllegalStateException at s.toList()`,
      `Compile error because you cannot assign a stream to a variable`
    ],
    "explain": `**Correct answer: it throws IllegalStateException at s.toList().**

### Why it is correct
A stream can **be used only once**: after a terminal operation ({{count()}}) runs, the stream is marked "linked or consumed". Calling any further operation throws {{IllegalStateException: stream has already been operated upon or closed}}. A stream stores no data; it is a pipeline that describes how to pull data from a source.

### Why the other options are wrong
- **Contains the A names**: a stream does not "replay" its data.
- **An empty list**: the JDK deliberately throws instead of returning a misleading empty result.
- **Compile error**: assigning a stream to a variable is perfectly legal; the error only shows up at runtime.

> Senior tip: if you need to reuse a pipeline, store a {{Supplier<Stream<String>>}} and call {{get()}} each time, or collect into a List once and compute {{size()}} from the list. Do not return a {{Stream}} from a repository/service for several places to consume; and streams from {{Files.lines}}/JPA {{getResultStream}} must be closed with try-with-resources.`
  },
  "qz-modern-018": {
    "q": `You compute a "one month later" due date for a loan disbursed on 31/01/2024. What does the following code print?
~~~java
LocalDate d = LocalDate.of(2024, 1, 31);
System.out.println(d.plusMonths(1) + " "
    + d.plusMonths(1).plusMonths(1) + " " + d.plusMonths(2));
~~~`,
    "options": [
      `2024-03-02 2024-04-02 2024-03-31`,
      `2024-02-29 2024-03-31 2024-03-31`,
      `Throws DateTimeException because 31/02 does not exist`,
      `2024-02-29 2024-03-29 2024-03-31`
    ],
    "explain": `**Correct answer: 2024-02-29 2024-03-29 2024-03-31.**

### Why it is correct
{{plusMonths}} adds the months and then, if the day is invalid, **clamps to the last valid day of that month** (2024 is a leap year, so 31/02 → 29/02).
- {{d.plusMonths(1)}} = 2024-02-29.
- {{.plusMonths(1)}} again, starting from 29/02 → 2024-03-29 (the original day 31 is already lost).
- {{d.plusMonths(2)}} from 31/01 → 2024-03-31.
Month addition is **not associative**: adding 1 twice is different from adding 2 once.

### Why the other options are wrong
- **03-02 / 04-02**: that is the "roll over into the next month" behaviour of lenient {{java.util.Calendar}} or of some other libraries, not java.time.
- **03-31 for the chained addition**: the second addition starts from 29/02 and has no memory of the original 31.
- **DateTimeException**: java.time clamps the day itself; plusMonths does not throw.

> Senior tip: a monthly repayment schedule must be computed **from the original date**: {{start.plusMonths(k)}} for period k, not accumulated from the previous period, otherwise the due day drifts (31 → 29 → 29…). Write this rule down in the business spec and test with 31/01, 29/02, and 30/11.`
  },
  "qz-modern-019": {
    "q": `You plan to upgrade 20 services from Java 17 to Java 21 (Spring Boot 3.2+). Which statements are **true**? (Choose 3)`,
    "options": [
      `Virtual threads are a final feature in Java 21 (JEP 444); Spring Boot 3.2+ enables them with spring.threads.virtual.enabled=true`,
      `Generational ZGC is available in Java 21, enabled with -XX:+UseZGC -XX:+ZGenerational`,
      `Java 21 removed the Security Manager completely, so code that calls System.setSecurityManager no longer compiles`,
      `Sequenced Collections add getFirst()/getLast()/reversed() to List; hand-written classes implementing List with a method of the same name but a different return type may no longer compile`,
      `Record patterns and pattern matching for switch are still preview in Java 21 and require --enable-preview`
    ],
    "explain": `**Correct answer: virtual threads are final, Generational ZGC behind the ZGenerational flag, and the Sequenced Collections clash risk.**

### Why it is correct
- **JEP 444** made virtual threads final in Java 21; Spring Boot 3.2 adds the {{spring.threads.virtual.enabled}} property so that Tomcat/Jetty, {{@Async}}, and the scheduler use virtual threads.
- **JEP 439** (Java 21) added Generational ZGC, which needs {{-XX:+UseZGC -XX:+ZGenerational}}. From Java 23 the generational mode became the default, and Java 24 removed the non-generational mode entirely.
- **JEP 431** adds default methods to List/Deque/...; this is one of the few source-incompatibility points when upgrading (for example a class with a {{getFirst()}} that returns {{Optional}}).

### Why the other options are wrong
- **Security Manager**: deprecated for removal since Java 17 (JEP 411); in Java 21 the API still exists and compiles (with a warning). It is JEP 486 (Java 24) that permanently disables it.
- **Preview**: record patterns (JEP 440) and pattern matching for switch (JEP 441) are **final** in Java 21.

> Senior tip: upgrade LTS step by step: build with the new JDK using {{--release 17}} first, run the whole test suite, then switch the runtime, and only after that move to {{--release 21}} and use the new features. Check the libraries that touch bytecode (Lombok, Mockito/ByteBuddy, Jacoco, APM agents) because they must support class file version 65.`
  },
  "qz-modern-020": {
    "q": `What does the following code produce?
~~~java
class Counter { int n; int next() { return ++n; } }
// main:
Counter c = new Counter();
Supplier<Integer> s = c::next;
c = new Counter();
System.out.println(s.get() + " " + s.get() + " " + c.next());
~~~`,
    "options": [
      `Prints "1 2 1", because a bound method reference fixes its receiver as soon as it is created`,
      `Compile error: c must be final or effectively final`,
      `Prints "1 1 1"`,
      `Prints "1 2 3", because s calls on whatever object c points to at the moment get() runs`
    ],
    "explain": `**Correct answer: it compiles and prints "1 2 1".**

### Why it is correct
With a **bound method reference** {{c::next}}, the receiver expression {{c}} is **evaluated when the reference is created** and that object is stored. Therefore:
- The JLS does **not** require {{c}} to be effectively final (unlike with a lambda).
- {{s}} always calls on the first Counter: 1, then 2.
- {{c}} now points to a new Counter: {{c.next()}} → 1.

If you wrote it as a lambda, {{() -> c.next()}}, it would be a compile error, because the lambda captures the **variable** {{c}} and that variable is reassigned.

### Why the other options are wrong
- **Must be effectively final**: that rule applies to local variables referenced by a lambda/inner class, not to the receiver of a method reference.
- **1 1 1**: the same Counter is incremented twice through s.
- **1 2 3**: s does not track the variable c; it holds the old object.

> Senior tip: this difference in evaluation timing also affects NPEs: {{Supplier<String> s = obj::toString}} throws an NPE **immediately when it is created** if obj is null, while {{() -> obj.toString()}} throws only when called. Knowing this helps you read a stack trace at the right place.`
  },
  "qz-concurrency-007": {
    "q": `On HotSpot, how can the following program behave?
~~~java
static boolean stop = false;
public static void main(String[] args) throws Exception {
    Thread t = new Thread(() -> {
        while (!stop) { }          // busy loop, calls no method
        System.out.println("done");
    });
    t.start();
    Thread.sleep(100);
    stop = true;
}
~~~`,
    "options": [
      `It always prints "done" after about 100 ms because main has written stop = true`,
      `It may run forever, because there is no happens-before edge, so the JIT is allowed to hoist the read of stop out of the loop`,
      `Throws IllegalMonitorStateException because it reads a static variable from another thread`,
      `It always stops, because Thread.sleep establishes happens-before with every other thread`
    ],
    "explain": `**Correct answer: it may run forever.**

### Why it is correct
According to the Java Memory Model, there is **no happens-before relationship** between the write {{stop = true}} in main and the read in thread t, so the JMM does not force t to see the new value. In practice, once the loop becomes hot, the JIT (C2) sees that the loop body never writes {{stop}}, so it **hoists** the read out of the loop and turns the code into:
~~~java
if (!stop) { while (true) { } }
~~~
Thread t spins forever even though the CPU cache already holds the new value. Fix: declare {{volatile boolean stop}} (or use an {{AtomicBoolean}}): every volatile read must really read memory, and a volatile write happens-before subsequent reads.

### Why the other options are wrong
- **Always prints done**: only "usually" true in interpreter mode; the JMM does not guarantee it.
- **IllegalMonitorStateException**: thrown only when calling {{wait/notify}} without holding the monitor; reading a variable has nothing to do with it.
- **Thread.sleep establishes happens-before**: sleep has **no** synchronization semantics (JLS 17.3 says so explicitly).

> Senior tip: this kind of bug usually shows up only in production (where the JIT has optimized the code) and cannot be reproduced in the debugger. Always use volatile/Atomic for a stop flag shared between threads, or better, use interrupt/{{ExecutorService.shutdownNow()}}.`
  },
  "qz-concurrency-008": {
    "q": `{{new ThreadPoolExecutor(2, 4, 60, SECONDS, new ArrayBlockingQueue<>(10))}} (default rejection policy). Almost simultaneously you submit **20 long-running tasks**. What is the outcome?`,
    "options": [
      `2 threads run, 10 tasks sit in the queue, 8 tasks are rejected because new threads are only created when the queue is empty`,
      `4 threads run, 16 tasks queue up because the queue grows automatically when it is full`,
      `4 threads run, 10 tasks sit in the queue, 6 tasks are rejected with RejectedExecutionException`,
      `2 threads run, 18 tasks wait, none are rejected because maximumPoolSize is only a hint`
    ],
    "explain": `**Correct answer: 4 run, 10 queue, 6 are rejected.**

### Why it is correct
The order of steps when you {{execute}} a task:
1. Fewer threads than **corePoolSize** → create a new thread (tasks 1–2).
2. Core full → **put the task in the queue** (tasks 3–12, the queue holds 10).
3. Queue full and fewer threads than **maximumPoolSize** → create more threads (tasks 13–14, 4 threads in total).
4. Queue full and already at max → **rejection policy**; the default {{AbortPolicy}} throws {{RejectedExecutionException}} (tasks 15–20, 6 tasks).

### Why the other options are wrong
- **8 rejected**: skips step 3; threads beyond core are created when the queue is **full**, not when it is empty.
- **The queue grows automatically**: {{ArrayBlockingQueue}} has a fixed capacity.
- **Nothing rejected**: true only with an unbounded queue (such as the default {{LinkedBlockingQueue()}}), where max is effectively disabled and you never get more than 2 threads.

> Senior tip: the "core → queue → max" order surprises many people. With {{Executors.newFixedThreadPool}} (unbounded queue), maximumPoolSize is meaningless and the queue can grow until OOM. In production: use a bounded queue, name threads via a ThreadFactory, use {{CallerRunsPolicy}} to create backpressure, and expose metrics (active, queue size, rejected).`
  },
  "qz-concurrency-009": {
    "q": `What does the following code print?
~~~java
CompletableFuture<Integer> f = CompletableFuture
    .<Integer>supplyAsync(() -> { throw new IllegalStateException("x"); })
    .thenApply(v -> v + 1)
    .exceptionally(ex -> -1);
System.out.println(f.join());
~~~`,
    "options": [
      `Throws CompletionException at join()`,
      `Throws IllegalStateException at join()`,
      `Prints 0 because thenApply is skipped and v defaults to 0`,
      `Prints -1; thenApply is skipped and exceptionally receives a CompletionException wrapping the IllegalStateException`
    ],
    "explain": `**Correct answer: it prints -1.**

### Why it is correct
- {{supplyAsync}} completes **exceptionally**. Dependent stages such as {{thenApply}} **do not run**; they simply pass the exception on (wrapped in a {{CompletionException}}).
- {{exceptionally}} runs only when the previous stage failed, and it turns the failure into a normal value (-1). The final future completes normally → {{join()}} returns -1.
- Note that {{ex}} here is usually a {{CompletionException}} whose {{getCause()}} is the IllegalStateException; error-handling code of this kind often needs to unwrap it.

### Why the other options are wrong
- **CompletionException at join**: only if there is no exceptionally/handle stage to recover.
- **IllegalStateException at join**: {{join}} wraps failures in CompletionException and {{get}} wraps them in ExecutionException; neither throws the original exception directly.
- **Prints 0**: there is no default value; thenApply is skipped entirely.

> Senior tip: {{supplyAsync}} without an executor runs on {{ForkJoinPool.commonPool()}}; for I/O always pass a dedicated executor. Use {{handle}}/{{whenComplete}} to log failures with context, and {{orTimeout}}/{{completeOnTimeout}} (Java 9) to avoid hanging forever when calling an external service.`
  },
  "qz-concurrency-010": {
    "q": `A Java 21 service enables virtual threads. One method wraps a slow (200 ms) JDBC call in a {{synchronized}} block. Under high load throughput collapses, and a thread dump shows all carrier threads busy even though CPU usage is low. What is the cause and the most reasonable fix?`,
    "options": [
      `Pinning: a virtual thread that blocks inside synchronized cannot unmount from its carrier (Java 21–23); replace it with ReentrantLock or upgrade to Java 24+ (JEP 491)`,
      `Virtual threads do not support JDBC; you must switch to R2DBC`,
      `The number of virtual threads is capped by the number of cores; you need to increase -Xss`,
      `synchronized on a virtual thread causes a deadlock, so the JVM automatically switches to a platform thread`
    ],
    "explain": `**Correct answer: pinning caused by synchronized.**

### Why it is correct
Virtual threads run on a small number of **carrier threads** (by default one per core, in a dedicated ForkJoinPool). When it hits a blocking operation (socket I/O, a lock), a virtual thread normally **unmounts** so the carrier can serve another thread. But on Java 21–23, if it holds a {{synchronized}} monitor it becomes **pinned**: the carrier is taken for the whole 200 ms. With 8 carriers, the system can handle only ~8 I/O requests at a time → throughput collapses even though the CPU is idle.
Fix: replace the {{synchronized}} around the I/O with {{ReentrantLock}} (which does not pin), or upgrade to **Java 24 (JEP 491)**, where synchronized no longer pins in most cases. Detect it with the JFR event {{jdk.VirtualThreadPinned}}.

### Why the other options are wrong
- **JDBC not supported**: JDBC works fine on virtual threads; the problem is the lock (some older drivers use synchronized internally, so you need an updated version).
- **Increase -Xss**: virtual threads are not capped by the number of cores, and -Xss only changes platform thread stacks, which is unrelated.
- **Automatically switches to a platform thread**: the JVM does not do that; pinning is not a deadlock.

> Senior tip: virtual threads do not raise the limit of the resources behind them: a connection pool of 20 connections still allows only 20 concurrent queries. Keep the pool sensible, measure with JFR, and remember that heavy ThreadLocals across millions of virtual threads cost memory.`
  }
});
