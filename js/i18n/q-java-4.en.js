/*
 * English translation of js/data/q-java.js — task T162. Format: js/core/i18n.js (content overlay).
 * ids: modern-009 modern-010 core-012 core-013 core-014 core-015 core-016 core-017 core-018 core-019
 */
App.i18n.content({
  'modern-009': {
    q: '{{SequencedCollection}} / {{SequencedMap}} (Java 21): what problem do they solve, and {{getFirst}} / {{getLast}} / {{reversed}}?',
    a: `**Summary:** Java 21 adds the {{SequencedCollection}} and {{SequencedMap}} interfaces to unify API access to first/last elements and reversal for ordered collections ({{List}}, {{Deque}}, {{LinkedHashSet}}, {{LinkedHashMap}}, {{TreeSet}}, {{TreeMap}}); previously each type had its own methods ({{getFirst}} / {{getLast}}, {{first}} / {{last}}, {{peekFirst}} / {{peekLast}}).

### Problem before Java 21
| Collection | First | Last | Reversed |
|---|---|---|---|
| {{List}} | {{get(0)}} | {{get(size-1)}} | {{Collections.reverse}} (mutates) or {{ListIterator}} |
| {{Deque}} | {{getFirst}} / {{peekFirst}} | {{getLast}} / {{peekLast}} | {{descendingIterator}} |
| {{LinkedHashSet}} | None | None | None |
| {{SortedSet}} / {{TreeSet}} | {{first}} | {{last}} | {{descendingSet}} |
| {{LinkedHashMap}} | None | None | None |
| {{SortedMap}} / {{TreeMap}} | {{firstKey}} | {{lastKey}} | {{descendingMap}} |

- API was not unified, making it hard to write generic code for "ordered collections".
- {{Collections.reverse}} mutates the original list; to view reversed you had to write a wrapper yourself.

### SequencedCollection (extends Collection)
- {{getFirst()}} / {{getLast()}}: get first / last element (throws {{NoSuchElementException}} if empty).
- {{addFirst(E)}} / {{addLast(E)}}: add at first / last (optional, throws {{UnsupportedOperationException}} if immutable).
- {{removeFirst()}} / {{removeLast()}}: remove from first / last (optional).
- {{reversed()}}: returns a **view** (read-only, no copy; changes to the original affect the view).

~~~java
List<String> list = new ArrayList<>(List.of("a", "b", "c"));
list.getFirst();           // "a"
list.getLast();            // "c"
for (String s : list.reversed()) { ... }  // c, b, a
~~~

### SequencedMap (extends Map)
- {{firstEntry()}} / {{lastEntry()}}: first / last {{Map.Entry}}.
- {{firstKey()}} / {{lastKey()}}: first / last key.
- {{putFirst}}, {{putLast}}: insert at first / last (optional).
- {{reversed()}}: reversed view (entry set reversed).
- {{sequencedKeySet()}}, {{sequencedValues()}}, {{sequencedEntrySet()}}: ordered views.

~~~java
LinkedHashMap<String, Integer> map = new LinkedHashMap<>();
map.put("a", 1); map.put("b", 2);
map.firstKey();           // "a"
map.lastEntry();          // b=2
for (var e : map.reversed().entrySet()) { ... }  // b=2, a=1
~~~

### Main implementers
- {{List}}, {{ArrayList}}, {{LinkedList}}, {{Vector}}, {{Stack}}
- {{Deque}}, {{ArrayDeque}}, {{LinkedList}}, {{ConcurrentLinkedDeque}}
- {{LinkedHashSet}}, {{LinkedHashMap}}
- {{SortedSet}} / {{NavigableSet}}, {{TreeSet}}
- {{SortedMap}} / {{NavigableMap}}, {{TreeMap}}
- **Not implemented by**: {{HashSet}}, {{HashMap}}, {{ConcurrentHashMap}}, {{CopyOnWriteArrayList}} (because they do not guarantee stable order).

### Pitfall
- {{reversed()}} returns a **view**, not a copy — editing the original collection changes the view, and vice versa (if mutable).
- {{getFirst}} throws if empty; check {{isEmpty()}} first or use {{stream().findFirst()}}.
- {{SequencedCollection}} does not extend {{Deque}} — no {{push}} / {{pop}}.
- Immutable collections ({{List.of}}, {{Set.of}}) implement {{SequencedCollection}} but {{addFirst}} / {{removeFirst}} throw {{UnsupportedOperationException}}.

> Senior tip: when writing a method that accepts an ordered collection, use {{SequencedCollection}} as parameter instead of {{List}} / {{Deque}} — it accepts more types and provides a unified API. {{reversed()}} view is very convenient for reverse iteration without index math.`,
    follow: [
      'Why do {{HashSet}} / {{HashMap}} not implement {{SequencedCollection}} / {{SequencedMap}}?',
      'Is the {{reversed()}} view thread-safe?',
      'How to write generic code that prints an ordered collection before Java 21?'
    ]
  },
  'modern-010': {
    q: 'Record patterns and nested deconstruction in switch (Java 21), guard {{when}}.',
    a: `**Summary:** Java 21 lets you use **record pattern** destructuring directly inside {{instanceof}} and {{switch}}; nested patterns to extract deep data; {{when}} guard adds a boolean condition to a case — replacing visitor pattern and complex if-else chains.

### Basic record pattern
~~~java
record Point(int x, int y) {}
record Rectangle(Point topLeft, Point bottomRight) {}

Object obj = new Rectangle(new Point(0, 0), new Point(10, 10));

if (obj instanceof Rectangle(Point(int x1, int y1), Point(int x2, int y2))) {
    System.out.println(x1 + "," + y1 + " -> " + x2 + "," + y2); // 0,0 -> 10,10
}
~~~
- Pattern: {{Rectangle(Point(int x1, int y1), Point(int x2, int y2))}} matches type and destructures nested components.
- Pattern variables ({{int x1}}) are declared within the pattern; scope is the {{if}} / {{case}} block.

### Nested deconstruction in switch
~~~java
sealed interface Expr permits Const, Add, Mul {}
record Const(int value) implements Expr {}
record Add(Expr left, Expr right) implements Expr {}
record Mul(Expr left, Expr right) implements Expr {}

int eval(Expr e) {
    return switch (e) {
        case Const(int v)            -> v;
        case Add(Expr l, Expr r)     -> eval(l) + eval(r);
        case Mul(Expr l, Expr r)     -> eval(l) * eval(r);
    };
}
~~~
- {{Add(Expr l, Expr r)}}: destructures 2 components that are {{Expr}}, recursive processing.
- No visitor pattern needed, no casting, compiler checks exhaustiveness (because {{Expr}} is sealed).

### Guard {{when}}
~~~java
String classify(Object o) {
    return switch (o) {
        case String s when s.length() > 10 -> "long string";
        case String s                       -> "short string";
        case Integer i when i > 0           -> "positive int";
        case Integer i                      -> "non-positive int";
        case null                           -> "null";
        default                             -> "other";
    };
}
~~~
- {{when}}: boolean expression after the pattern; matches only if true.
- Case order matters: specific cases with guards must come **before** general cases of the same type (compiler reports "dominated" if reversed).
- {{case null}} is separate — it does not match {{default}}.

### Combining record pattern + guard
~~~java
record Order(String id, Customer customer, List<Item> items) {}
record Customer(String name, boolean vip) {}

String vipName(Order o) {
    return switch (o) {
        case Order(String id, Customer(var name, true), List<Item> items) when items.size() > 5
            -> name + " (VIP, large order)";
        case Order(String id, Customer(var name, boolean vip), var items)
            -> vip ? name + " (VIP)" : name;
    };
}
~~~
- Pattern variables ({{var name}}) use type inference; guard operates on variables already bound by the pattern.
- Sealed hierarchy is required for exhaustive switch without {{default}}.

### Pitfall
- Sealed hierarchy is mandatory: if not sealed, need {{default}} and lose exhaustive check.
- Guard {{when}} cannot access pattern variables from other cases.
- Unnamed pattern {{_}} is Java 22+ preview; Java 21 uses {{var _}} or a variable name you ignore.

> Senior tip: record pattern + sealed switch eliminates boilerplate visitor code and makes the compiler enforce exhaustiveness. For production APIs, prefer sealed interfaces over open inheritance; it pays off when new operations or types are added.`,
    follow: [
      'Why is record pattern + sealed switch safer than visitor pattern?',
      'How does unnamed pattern {{_}} differ from {{var _}}?',
      'When should you avoid record patterns (e.g., hierarchy that changes often)?'
    ]
  },
  'core-012': {
    q: 'Handling currency with {{BigDecimal}}: scale, {{RoundingMode}}, {{equals}} vs {{compareTo}}, and why absolutely never use {{double}}?',
    a: `**Summary:** Currency **must** use {{BigDecimal}} because {{double}} / {{float}} cannot represent decimal fractions exactly (0.1 + 0.2 ≠ 0.3); {{BigDecimal}} lets you control scale and {{RoundingMode}}, and you should use {{compareTo}} for comparison instead of {{equals}} (because {{equals}} also compares scale).

### Why not use double
- {{double}} follows IEEE 754 binary: decimal fractions that are finite in decimal (0.1, 0.01, 19.99) often become infinite binary fractions ⇒ accumulated rounding error.
- Classic example: {{0.1 + 0.2 = 0.30000000000000004}}; calculating interest, discounts, foreign currencies will drift by cents and accumulate over thousands of transactions into large errors.
- Accounting / banking standards (ISO 4217, PCI DSS) require absolute precision; {{double}} does not meet it.

### BigDecimal basics
~~~java
// Create from String — SAFE
BigDecimal price = new BigDecimal("19.99");

// Create from double — FORBIDDEN (keeps binary error)
BigDecimal bad = new BigDecimal(0.1);   // 0.10000000000000000555...
BigDecimal good = BigDecimal.valueOf(0.1); // uses Double.toString -> "0.1"
~~~
- Always use constructor with {{String}} or {{BigDecimal.valueOf(double)}}.
- {{scale}} = digits after decimal point; negative means multiply by 10^|scale| (used for large rounded values like hundreds/thousands).

### RoundingMode
- Required when dividing or changing scale: {{divide(divisor, scale, RoundingMode.HALF_UP)}}.
- Common modes: {{HALF_UP}} (arithmetic), {{HALF_EVEN}} (banker's rounding, IEEE 754R standard), {{DOWN}} / {{UP}} / {{CEILING}} / {{FLOOR}}.
- Do not omit scale for {{divide}} — it throws {{ArithmeticException}} on non-terminating decimals.

### equals vs compareTo
~~~java
new BigDecimal("1.0").equals(new BigDecimal("1.00"));  // false (different scale)
new BigDecimal("1.0").compareTo(new BigDecimal("1.00")); // 0 (same numeric value)
~~~
- {{equals}} compares both **scale** and value; {{compareTo}} compares only numeric value.

### Pitfall
- Never use {{double}} for money calculations; even intermediate stages must stay in {{BigDecimal}}.
- When storing in DB, use {{DECIMAL(p,s)}} or {{NUMERIC}}, never {{DOUBLE}} / {{FLOAT}}.
- Be careful with {{divide}} without explicit scale — silent failure is not the issue; it throws, which is good, but always specify it.

> Senior tip: define a utility method like {{Money.of(String amount)}} that always validates input format and uses {{BigDecimal.valueOf}} for double sources. In multi-currency systems, always pair amount with currency code and never mix scales implicitly.`,
    follow: [
      'Why is {{BigDecimal("0.1")}} safe but {{new BigDecimal(0.1)}} not?',
      'When to use {{RoundingMode.HALF_EVEN}} instead of {{HALF_UP}}?',
      'How to handle multi-currency amounts correctly in one system?'
    ]
  },
  'core-013': {
    q: 'Java Date/Time API: distinguish {{Instant}}, {{LocalDateTime}}, {{ZonedDateTime}}, {{OffsetDateTime}}; how to store time in DB to avoid timezone bugs at midnight cut-off?',
    a: `**Summary:** {{Instant}} is a point on the timeline (UTC, no timezone), {{LocalDateTime}} is local date-time **without** offset, {{OffsetDateTime}} has a fixed offset, {{ZonedDateTime}} has timezone rules (DST). Always store in DB using {{Instant}} (UTC) or {{TIMESTAMP WITH TIME ZONE}}; convert to user timezone **only at display layer**.

### Four main types
| Type | Description | Use when |
|---|---|---|
| {{Instant}} | UTC nanoseconds, no timezone | Storage, logs, comparison, inter-service transmission |
| {{LocalDateTime}} | Year-month-day-hour-minute-second, **no** offset | User interface, appointment calendar, birthdays |
| {{OffsetDateTime}} | LocalDateTime + fixed offset (+07:00) | Communication with external systems that send only offset |
| {{ZonedDateTime}} | LocalDateTime + ZoneId (IANA, with DST) | Business logic tied to timezone, summer-time rules |

### Safe conversion
~~~java
Instant now = Instant.now();                    // UTC
ZonedDateTime vn = now.atZone(ZoneId.of("Asia/Ho_Chi_Minh")); // +07, has DST history
OffsetDateTime odt = vn.toOffsetDateTime();     // offset at that moment
LocalDateTime ldt = vn.toLocalDateTime();       // loses timezone
Instant back = vn.toInstant();                  // back to UTC
~~~
- Never use {{LocalDateTime}} to store event timestamps (logs, order time, payment time) — you lose timezone context.
- {{ZonedDateTime}} differs from {{OffsetDateTime}} because it knows **DST rules** (day of summer-time change); {{OffsetDateTime}} is only a static offset.

### Production cut-off bug (real-world)
- Transaction cut-off is at 23:59:59 **according to the bank timezone (e.g., +07)**.
- If you store {{LocalDateTime}} "2024-03-10 23:59:59" without offset, on DST change day or when server timezone changes, the real moment shifts by 1 hour.
- Solution: store {{Instant}} (UTC) in DB column {{TIMESTAMP WITH TIME ZONE}} (PostgreSQL) or {{DATETIME}} (MySQL 8.0+ with {{TIMESTAMP}} auto-convert). Query cut-off: {{WHERE created_at < '2024-03-11 00:00:00+07'}} (already with offset).
- Spring Boot: configure {{spring.jpa.properties.hibernate.jdbc.time_zone=UTC}} and use {{@Column(columnDefinition = "TIMESTAMP WITH TIME ZONE")}}.

### Common errors
- {{LocalDateTime.now()}} takes JVM default zone ({{ZoneId.systemDefault()}}); Docker containers often set UTC ⇒ wrong vs Vietnam timezone.
- Parsing strings without offset with {{LocalDateTime.parse}} then assigning to {{TIMESTAMP WITH TIME ZONE}} ⇒ DB uses session timezone, unstable.

> Senior tip: always persist timestamps in UTC and format at the edge (API / UI). If you need to query by local time, use DB functions that apply zone conversion (e.g., {{AT TIME ZONE}} in PostgreSQL) rather than storing local values.`,
    follow: [
      'Why is {{ZonedDateTime}} safer than {{OffsetDateTime}} for cut-off logic?',
      'How to migrate old {{TIMESTAMP}} columns to {{TIMESTAMP WITH TIME ZONE}} without data loss?',
      'When should you use {{LocalDateTime}} vs {{Instant}} for business rules?'
    ]
  },
  'core-014': {
    q: 'Autoboxing: Integer cache (-128..127), {{==}} on wrapper, NPE on unboxing, and boxing cost in hot loops.',
    a: `**Summary:** Autoboxing automatically converts primitive ↔ wrapper; {{Integer.valueOf}} caches -128..127 so {{==}} works on cache but fails outside the range; unboxing {{null}} throws NPE; boxing inside hot loops creates GC garbage — use primitive or primitive collections.

### Integer cache
- {{Integer.valueOf(int)}} caches [-128, 127] (can be extended with {{-XX:AutoBoxCacheMax}}); {{new Integer()}} is deprecated (Java 9) and skips cache.
- {{Long}}, {{Short}}, {{Byte}}, {{Character}} have similar caches.
- {{Boolean}} caches {{TRUE}} / {{FALSE}} singletons.

~~~java
Integer a = 127, b = 127;        // cache -> same object
Integer c = 128, d = 128;        // new objects -> different
System.out.println(a == b);      // true
System.out.println(c == d);      // false (reference comparison!)
System.out.println(c.equals(d)); // true (value comparison)
~~~

### NPE on unboxing
~~~java
Integer wrapper = null;
int primitive = wrapper;         // NPE at this line (implicit unboxing)
~~~
- Happens when: {{map.get(key)}} returns null then assigned to primitive; ternary {{condition ? 1 : null}} forces primitive; stream {{reduce}} with null identity.
- Defense: use {{Objects.requireNonNull}}, {{Optional}}, or check null before unboxing.

### Boxing cost in hot path
- Each boxing creates a new object (except cache), causing high allocation rate ⇒ frequent young GC, pauses increase.
- Example: {{Long sum = 0L; for (long v : values) sum += v;}} — {{sum}} is boxed/unboxed each iteration.
- Fix: use primitive local ({{long sum = 0;}}), primitive streams ({{LongStream}}, {{IntStream}}), or primitive collections (fastutil / Eclipse Collections).
- JIT can use escape analysis to eliminate boxing if the object does not escape the method, but it is not guaranteed.

### Wrapper comparison

> Senior tip: treat wrapper equality as a code smell. If you need identity comparison (e.g., enum-like singleton), use {{==}} intentionally; for values always use {{equals}}. Never assume cache behavior outside [-128, 127].`,
    follow: [
      'Why does Integer cache default to -128..127 and how to extend it?',
      'Why does ternary {{flag ? 1 : null}} throw NPE when assigned to {{int}}?',
      'When should {{OptionalInt}} be used instead of {{Integer}}?'
    ]
  },
  'core-015': {
    q: 'try-with-resources: closing order, suppressed exception, and writing correct {{AutoCloseable}}.',
    a: `**Summary:** try-with-resources closes resources in **reverse declaration order**; exceptions during close are attached to {{getSuppressed()}} of the primary exception; writing {{AutoCloseable}} must be idempotent, and {{close()}} should not throw unless unrecoverable.

### Closing order
~~~java
try (var in = new FileInputStream("a.txt");
     var out = new FileOutputStream("b.txt")) {
    // use in, out
} // out.close() runs first, then in.close()
~~~
- Closed LIFO (last in, first out) — like a stack; the resource declared last closes first.
- If a resource constructor throws, previously declared resources are still closed (Java 9+ supports effectively final resources).

### Suppressed exception
- If try block throws **and** close() also throws: the close exception is **suppressed** (attached to {{primary.getSuppressed()}}); the primary exception from try is preserved.
- Before Java 7 (using finally), the close exception would **overwrite** the primary exception — losing root cause.
- Always log {{getSuppressed()}} when catching exceptions so closing errors are not lost.

~~~java
try (var rs = stmt.executeQuery()) {
    // process
} catch (SQLException e) {
    for (Throwable s : e.getSuppressed()) {
        log.warn("Suppressed: {}", s.getMessage());
    }
    throw e;
}
~~~

### Writing AutoCloseable correctly
~~~java
public class ConnectionWrapper implements AutoCloseable {
    private boolean closed = false;
    private final Connection conn;

    public ConnectionWrapper(Connection conn) { this.conn = conn; }

    @Override
    public void close() throws Exception {
        if (!closed) {
            closed = true;
            conn.close();
        }
    }
}
~~~
- {{close()}} should be idempotent: calling multiple times should be safe.
- Do not throw from {{close()}} for routine cleanup errors; log them instead. Only throw for unrecoverable states.

> Senior tip: prefer try-with-resources over manual finally; it handles suppressed exceptions correctly and eliminates boilerplate. For resources that need lifecycle management (connection pools), wrap them explicitly rather than relying on implicit close.`,
    follow: [
      'Why is the close exception suppressed rather than overwriting the primary one?',
      'Can a resource declared in try-with-resources be null?',
      'How to write {{AutoCloseable}} correctly for a pooled resource?'
    ]
  },
  'core-016': {
    q: 'Advanced enum: {{EnumMap}} / {{EnumSet}}, enum singleton, enum as state machine, and why never persist {{ordinal()}}.',
    a: `**Summary:** Enum is a final class with fixed instances; {{EnumMap}} / {{EnumSet}} are faster than HashMap / HashSet thanks to array indexing by {{ordinal()}}; enum singleton is thread-safe for free; enum state machine is concise; **do not persist {{ordinal()}}** because adding / reordering enums corrupts data — use {{name()}} or a custom code.

### EnumMap / EnumSet
- {{EnumMap<K,V>}}: key is enum, backing is array {{V[]}} index = {{key.ordinal()}}; O(1) with no hashing, no collision, small memory, iterates in declaration order.
- {{EnumSet}}: bitset (long for ≤ 64 enums, long array for > 64); {{EnumSet.allOf}}, {{noneOf}}, {{range}}, {{complement}} are extremely fast.
- Compared to {{HashMap}} / {{HashSet}}: 2–10x faster, less GC, no need for hashCode / equals.

~~~java
enum Status { NEW, PROCESSING, DONE, FAILED }
EnumMap<Status, Integer> counter = new EnumMap<>(Status.class);
EnumSet<Status> active = EnumSet.of(Status.NEW, Status.PROCESSING);
~~~

### Enum singleton
~~~java
enum Singleton { INSTANCE; void doWork() {} }
~~~
- Thread-safe, serialization-safe (JVM guarantees), reflection-safe (private constructor), lazy init.
- Simplest and recommended approach (Effective Java Item 3).

### Enum state machine
~~~java
enum OrderState {
    CREATED { @Override OrderState next() { return PAID; } },
    PAID { @Override OrderState next() { return SHIPPED; } },
    SHIPPED { @Override OrderState next() { return DELIVERED; } },
    DELIVERED { @Override OrderState next() { return this; } };
    abstract OrderState next();
}
~~~
- Each state defines its own transition; adding a new state requires adding a case, compiler enforces abstract method.

### Pitfall
- Never persist {{ordinal()}} — inserting a new enum value between existing ones shifts ordinals and corrupts stored data.
- Always use {{name()}} or a custom {{String}} / {{int}} code field for DB storage.
- Enum comparison with {{==}} is safe because instances are singletons; never use {{equals}} unless integrating with external APIs.

> Senior tip: use enums for fixed domain values (status, type, category) but not for frequently changing lists (user roles that grow weekly). If the set is dynamic, use reference tables with foreign keys instead.`,
    follow: [
      'Why is {{EnumMap}} faster than {{HashMap}} for enum keys?',
      'What is the downside of enum singleton compared to static holder?',
      'How to migrate data stored with {{ordinal()}} safely to code / name?'
    ]
  },
  'core-017': {
    q: 'Interface default / static / private method, diamond problem, and when to choose abstract class over interface?',
    a: `**Summary:** Java 8+ allows default / static / private methods in interfaces; diamond problem is solved by "class wins" rules and mandatory override on conflict; choose abstract class when shared state, constructor, or non-public members are needed; interfaces define contracts and multiple implementations.

### Default method
~~~java
default void log() { System.out.println("log"); }
~~~
- Provides a default implementation; implementing classes can override.
- Used to **extend old interfaces** without breaking binary compatibility (e.g., {{Collection.stream()}}, {{Iterable.forEach()}}).
- Cannot access private fields of the implementing class (only public / protected methods from other interfaces).

### Static method
~~~java
static void helper() { ... }
~~~
- Convenient for utility methods attached to the interface ({{Stream.of}}, {{Comparator.naturalOrder()}}).
- Not inherited; call via {{InterfaceName.helper()}}.

### Private method (Java 9)
~~~java
private void shared() { ... }
private static void util() { ... }
~~~
- Shares code between default methods without exposing outside.

### Diamond problem
~~~java
interface A { default void m() { System.out.println("A"); } }
interface B { default void m() { System.out.println("B"); } }
class C implements A, B { 
    @Override public void m() { A.super.m(); } // must override, choose A or B
}
~~~
- If a class implements two interfaces with the same default method, it **must override**; the compiler forces resolution.
- If a class and interface both provide the method, the class wins (even if the class method is inherited).

### When to choose abstract class over interface
- Need shared **state** (fields) or a **constructor**.
- Need **non-public** members (protected methods / fields).
- Need to enforce inheritance hierarchy (final methods, template method).
- Interface is for contracts, multiple inheritance of behavior, and polymorphism without forcing a base class.

> Senior tip: when designing APIs, prefer interfaces for public contracts; use abstract classes for internal framework templates that need state. Never mix state into public interfaces — it leaks implementation details.`,
    follow: [
      'Can a default method override {{Object}} methods (equals, hashCode, toString)?',
      'Are static methods in interfaces inherited?',
      'Why does Java not allow interfaces to have instance fields?'
    ]
  },
  'core-018': {
    q: 'Java I/O vs NIO: buffer, channel, {{Files}} API, reading large files via stream, zero-copy {{transferTo}}.',
    a: `**Summary:** Traditional I/O (stream) is blocking, byte-by-byte; NIO (New I/O) uses **buffer + channel**, non-blocking, memory-mapped, zero-copy. {{Files}} API (Java 7+) is convenient for file-system operations; read large files using {{Files.lines}} / {{Files.newInputStream}} + stream; {{transferTo}} moves data kernel-to-kernel without copying through user space.

### Traditional I/O vs NIO
| Feature | java.io (Stream) | java.nio (Buffer / Channel) |
|---|---|---|
| Model | Blocking, byte / char stream | Buffer + Channel, non-blocking (Selector) |
| Read / write unit | Byte / char individually or array | Buffer ({{ByteBuffer}}, {{CharBuffer}}...) |
| Memory-mapped | No | {{FileChannel.map}} ({{MappedByteBuffer}}) |
| Zero-copy | No | {{transferTo}} / {{transferFrom}} |
| File system | {{File}} (limited) | {{Path}}, {{Files}} (full API) |

### Buffer basics
~~~java
ByteBuffer buf = ByteBuffer.allocateDirect(8192); // off-heap, zero-copy ready
buf.put(data);        // write mode
buf.flip();           // switch to read mode (limit=position, position=0)
channel.read(buf);    // read into buffer
buf.compact();        // move unread data to start, prepare for more
~~~
- {{allocateDirect}}: off-heap, used for zero-copy, less GC but slower allocation.
- {{flip()}}, {{clear()}}, {{compact()}}, {{rewind()}} manage position / limit / capacity.

### Files API (Java 7+)
- {{Files.readAllLines}}, {{Files.write}}, {{Files.copy}}, {{Files.move}}, {{Files.delete}}, {{Files.walk}}.
- {{Files.lines(path)}} returns {{Stream<String>}} lazy, auto-closes when done (try-with-resources).
- {{Files.newInputStream}} / {{newOutputStream}} returns standard streams, usable with NIO channels.

### Reading large files (GB) without OOM
~~~java
// Option 1: Files.lines + stream processing (line by line)
try (Stream<String> lines = Files.lines(Paths.get("huge.log"))) {
    lines.filter(l -> l.contains("ERROR"))
         .forEach(this::process);
}

// Option 2: FileChannel + ByteBuffer (low-level, zero-copy possible)
try (FileChannel ch = FileChannel.open(path)) {
    ByteBuffer buf = ByteBuffer.allocateDirect(8192);
    while (ch.read(buf) > 0) {
        buf.flip();
        process(buf);
        buf.clear();
    }
}
~~~
- For GB-scale files, always use streaming, not {{Files.readAllBytes}} or {{Files.readString}}.
- {{transferTo}} between channels avoids user-space buffers entirely.

### Pitfall
- {{allocateDirect}} buffers require explicit cleanup (GC can delay); prefer {{allocate}} for short-lived buffers.
- {{MappedByteBuffer}} is powerful but can cause resource leaks if not unmapped; Java has no public {{unmap}} until newer APIs.
- Non-blocking channels need a {{Selector}} loop; do not mix blocking stream reads with non-blocking channels on the same thread.

> Senior tip: for high-throughput file transfer between sockets and files, combine {{FileChannel.transferTo}} with {{SocketChannel}} — this avoids copying data into JVM memory entirely. Monitor with {{jstat -gc}} to verify reduced allocation rate when switching to NIO.`,
    follow: [
      'Why is {{transferTo}} faster than reading into buffer then writing?',
      'When to use {{ByteBuffer.allocateDirect}} instead of {{allocate}}?',
      'What are the drawbacks of {{MappedByteBuffer}} and how to unmap safely?'
    ]
  },
  'core-019': {
    q: 'String concat with {{+}} after Java 9 (invokedynamic), {{StringBuilder}} when truly needed, how slow is {{String.format}}?',
    a: `**Summary:** Since Java 9, {{+}} uses {{invokedynamic}} + {{StringConcatFactory}} to generate optimized bytecode at runtime, as fast as {{StringBuilder}} for simple concatenations; {{StringBuilder}} is still needed for loops, conditional concatenation, or custom capacity; {{String.format}} is slow due to parsing format strings and creating {{Formatter}} each time.

### String concat after Java 9 (JEP 280)
- Before Java 9: {{a + b + c}} compiled to {{new StringBuilder().append(a).append(b).append(c).toString()}}.
- Java 9+: compiler emits {{invokedynamic}} bootstrap method {{StringConcatFactory.makeConcatWithConstants}}; runtime selects optimal strategy ({{StringBuilder}}, {{String.join}}, {{Arrays.copyOf}}, even {{StringConcatHelper}}).
- Benefit: JIT can inline, optimize based on actual profile; no intermediate {{StringBuilder}} in static bytecode.
- Result: {{s1 + s2 + s3}} is as fast as manual {{StringBuilder}}, code is more readable.

### When StringBuilder is still needed
- **Loops**: concatenation inside a loop creates separate {{invokedynamic}} calls that cannot be merged.
~~~java
// Slow: one invokedynamic per iteration
String s = "";
for (String part : parts) s += part; 

// Fast: single StringBuilder
StringBuilder sb = new StringBuilder(estimatedSize);
for (String part : parts) sb.append(part);
String s = sb.toString();
~~~
- **Conditional / branched concatenation**: complex logic that bootstrap method cannot merge.
- **Need capacity control**: avoid internal resize ({{new StringBuilder(1024)}}).
- **Thread-local buffer**: reuse {{StringBuilder}} in hot path (careful with thread-safety).

### How slow is String.format
- Parses format string ({{%d}}, {{%s}}, {{%.2f}}...) on every call — regex / internal parser.
- Creates new {{Formatter}} object each call (allocation).
- Boxing / unboxing for primitive arguments.
- Default locale handling overhead.

### Pitfall
- Do not assume {{+}} is always slow; since Java 9 it is optimized for simple cases. Only avoid it in loops or when concatenating many variable parts.
- {{StringBuilder}} with default capacity (16) resizes exponentially (2x); estimate size up front for large builds.
- {{String.format}} is convenient for readability but should not be used in hot paths (logging, parsing); prefer manual append or pre-formatted constants.

> Senior tip: profile with {{jmh}} or {{async-profiler}} before optimizing concat. Often the bottleneck is not string building but unnecessary allocations elsewhere. Use {{StringBuilder}} only where profiling confirms it matters.`,
    follow: [
      'Why does {{invokedynamic}} make concat faster than static bytecode?',
      'How does {{String.join}} differ from {{Collectors.joining}}?',
      'When is thread-local {{StringBuilder}} a good idea?'
    ]
  }
});
