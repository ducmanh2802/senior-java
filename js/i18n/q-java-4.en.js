/*
 * English translation of js/data/q-java.js — task T529, re-translated T1184. Format: js/core/i18n.js (content overlay).
 * ids: modern-009 modern-010 core-012 core-013 core-015 core-016 core-017 core-018 core-019
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
    q: 'Handling currency with {{BigDecimal}}: scale, {{RoundingMode}}, {{equals}} vs {{compareTo}}, and why you must never use {{double}}?',
    a: `**Summary:** currency **must** use {{BigDecimal}} because {{double}}/{{float}} cannot represent decimal fractions exactly (0.1 + 0.2 != 0.3); {{BigDecimal}} lets you control scale and {{RoundingMode}}, and you should use {{compareTo}} for value comparison instead of {{equals}} (because {{equals}} also compares scale).

### Why not use double
- {{double}} follows IEEE 754 binary: decimal fractions that are finite in decimal (0.1, 0.01, 19.99) often become infinite repeating fractions in binary, so rounding errors accumulate.
- Classic example: {{0.1 + 0.2 = 0.30000000000000004}}; calculating interest, discounts, or foreign exchange drifts by cents and accumulates across thousands of transactions into large errors.
- Accounting and banking standards (ISO 4217, PCI DSS) require absolute precision; {{double}} cannot meet that.

### BigDecimal basics
~~~java
// Create from String — SAFE
BigDecimal price = new BigDecimal("19.99");

// Create from double — FORBIDDEN (keeps binary error)
BigDecimal bad = new BigDecimal(0.1);   // 0.10000000000000000555...
BigDecimal good = BigDecimal.valueOf(0.1); // uses Double.toString -> "0.1"
~~~
- Always use the constructor that takes a {{String}} or {{BigDecimal.valueOf(double)}}.
- {{scale}} is the number of digits after the decimal point; a negative scale means multiply by 10^|scale| (used for large amounts rounded to tens or hundreds).

### RoundingMode
- Required when dividing or changing scale: {{divide(divisor, scale, RoundingMode.HALF_UP)}}.
- Common modes: {{HALF_UP}} (arithmetic rounding), {{HALF_EVEN}} (banker's rounding, IEEE 754R standard), {{DOWN}}/{{UP}}/{{CEILING}}/{{FLOOR}}.
- Not specifying a scale for {{divide}} throws {{ArithmeticException}} when the decimal is non-terminating (for example 10/3).

### equals vs compareTo
~~~java
new BigDecimal("1.0").equals(new BigDecimal("1.00"));  // false (different scale)
new BigDecimal("1.0").compareTo(new BigDecimal("1.00")); // 0 (same numeric value)
~~~
- {{equals}} compares both **scale** and value; {{compareTo}} compares only the numeric value.
- Use {{compareTo}} for business logic (price comparison, checking negative/positive); use {{equals}} only when you need the exact representation (for example serialization).
- {{signum()}} returns -1/0/1 and is convenient in conditions.

### Production pitfalls
- Forgetting scale + rounding on {{divide}} causes a runtime exception when dividing 10/3.
- Using an intermediate {{double}} in a formula (for example mixing {{0.1}} as a double) then converting to {{BigDecimal}} still carries the hidden error.
- DB storage: use {{NUMERIC(19,4)}} or {{DECIMAL}}; never use {{FLOAT}}/{{DOUBLE}}. Hibernate mapping: {{@Column(precision = 19, scale = 4)}}.
- Multi-currency: always carry the {{Currency}} (ISO 4217); never add or subtract amounts in different currencies.

### Under the hood: what BigDecimal stores
{{BigDecimal}} = **unscaledValue** (a {{BigInteger}}, or an internal {{long}} when small enough) multiplied by 10 to the power of negative **scale**. For example 12.50 is (1250, scale 2); 12.5 is (125, scale 1) — same numeric value but different representation, which is why {{equals}} (compares scale too) returns false while {{compareTo}} returns 0. {{double}} stores in binary: 0.1 has no finite representation (like 1/3 in decimal), so it is always an approximation. Division {{divide(x)}} without scale/rounding throws {{ArithmeticException}} if the result is a non-terminating decimal (for example 10/3) — always pass scale and {{RoundingMode}}. Creating from {{new BigDecimal(0.1)}} carries the double's error; use {{BigDecimal.valueOf(0.1)}} or a string.

### Real-world example
An e-wallet split a 100,000 VND refund across 3 users using {{double}} and rounded each share: 33,333.33 x 3 = 99,999.99 — each transaction "lost" 0.01, and after 2 million transactions reconciliation drifted by about 20,000 VND, taking 3 days to diagnose. Fix: use {{BigDecimal}} with scale 0 (VND has no fractional unit), divide {{divide(3, 0, RoundingMode.DOWN)}} for the first two shares, and set the last share to the total minus the shares already allocated (the last person gets 33,334 VND) — the total is always exact. The logic was wrapped in a {{Money}} record with {{Currency}} so rounding uses the correct scale per currency (VND 0, USD 2).

### Sample interview answer
"For money I always use BigDecimal, never double. double stores in binary so 0.1 is only an approximation, and across many transactions that accumulates into reconciliation drift. BigDecimal stores an unscaled integer with a scale, so it represents decimal fractions exactly. I always create it from a string or valueOf, never from the double constructor because that carries the double's error. Division must specify scale and RoundingMode; otherwise 10 divided by 3 throws ArithmeticException. Banks commonly use HALF_EVEN or follow business rules. For comparison I use compareTo, because equals also compares scale so 12.5 differs from 12.50. When splitting money across parties, I compute the last share as the total minus the others so nothing is lost. And I wrap it in a Money record with Currency to round correctly per currency."

> Senior tip: write a {{Money}} wrapper (record {{Money(BigDecimal amount, Currency currency)}}) with validation in the constructor; centralize rounding, conversion, and comparison in one place to avoid scattering {{RoundingMode.HALF_UP}} across the codebase.`,
    follow: [
      'Why is {{BigDecimal("0.1")}} safe while {{new BigDecimal(0.1)}} is not?',
      'When should you use {{RoundingMode.HALF_EVEN}} instead of {{HALF_UP}}?',
      'How do you handle multi-currency amounts in one payment system?'
    ]
  },
  'core-013': {
    q: 'Java Date/Time API: distinguish {{Instant}}, {{LocalDateTime}}, {{ZonedDateTime}}, {{OffsetDateTime}}; how to store time in DB to avoid timezone bugs at midnight (bank cut-off)?',
    a: `**Summary:** {{Instant}} is a point on the timeline (UTC, no timezone), {{LocalDateTime}} is a local date-time **without** an offset, {{OffsetDateTime}} has a fixed offset, and {{ZonedDateTime}} has timezone rules (DST). Always store in DB using {{Instant}} (UTC) or {{TIMESTAMP WITH TIME ZONE}}; convert to the user's timezone **only at the display layer**.

### Four main types
| Type | Description | Use when |
|---|---|---|
| {{Instant}} | UTC nanoseconds, no timezone | Storage, logs, comparison, passing between services |
| {{LocalDateTime}} | Year-month-day-hour-minute-second, **no** offset | User interface, appointments, birthdays |
| {{OffsetDateTime}} | LocalDateTime + fixed offset (+07:00) | Communicating with external systems that send only an offset |
| {{ZonedDateTime}} | LocalDateTime + ZoneId (IANA, with DST) | Business logic tied to a timezone, daylight saving rules |

### Safe conversion
~~~java
Instant now = Instant.now();                    // UTC
ZonedDateTime vn = now.atZone(ZoneId.of("Asia/Ho_Chi_Minh")); // +07, has DST history
OffsetDateTime odt = vn.toOffsetDateTime();     // offset at that moment
LocalDateTime ldt = vn.toLocalDateTime();       // loses timezone
Instant back = vn.toInstant();                  // back to UTC
~~~
- Never use {{LocalDateTime}} to store event timestamps (logs, order time, payment time) — it loses timezone context.
- {{ZonedDateTime}} differs from {{OffsetDateTime}} because it knows **DST rules** (the day clocks change); {{OffsetDateTime}} is only a static offset.

### Bank cut-off bug (real-world)
- A system cuts off transactions at 23:59:59 **in the bank's timezone (for example +07)**.
- If you store {{LocalDateTime}} "2024-03-10 23:59:59" without an offset, on a DST change day or when the server timezone changes, the actual moment shifts by 1 hour.
- Solution: store {{Instant}} (UTC) in a DB column {{TIMESTAMP WITH TIME ZONE}} (PostgreSQL) or {{DATETIME}} (MySQL 8.0+ with {{TIMESTAMP}} auto-conversion). When querying the cut-off: {{WHERE created_at < '2024-03-11 00:00:00+07'}} (offset included).
- Spring Boot: configure {{spring.jpa.properties.hibernate.jdbc.time_zone=UTC}} and use {{@Column(columnDefinition = "TIMESTAMP WITH TIME ZONE")}}.

### Common mistakes
- {{LocalDateTime.now()}} uses the JVM default zone ({{ZoneId.systemDefault()}}); Docker containers often run in UTC, so it differs from Vietnam time.
- Parsing a string without an offset using {{LocalDateTime.parse}} and assigning it to a {{TIMESTAMP WITH TIME ZONE}} column makes the DB use the session timezone, which is unstable.
- Comparing {{ZonedDateTime}} values in different zones: convert with {{toInstant()}} before comparing; do not compare fields directly.
- {{Period}} vs {{Duration}}: {{Period}} is date-based (years/months/days), {{Duration}} is time-based (hours/minutes/seconds/nanos).

### Real-world example
A bank ran an "end-of-day settlement" job at 23:59 Vietnam time, but the server and DB column used {{TIMESTAMP}} (no timezone) storing UTC, while the code compared using {{LocalDateTime.now()}} in the container's timezone (UTC). Result: transactions from 00:00 to 07:00 Vietnam time were counted in the previous day — about 4% of transactions were assigned to the wrong period every day, producing incorrect regulatory reports. Fix: migrate the column to {{timestamptz}}, store {{Instant}} in code, compute the business day boundary explicitly as {{LocalDate.of(...).atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant()}}, inject {{Clock}} so the 23:59:59/00:00:00 boundaries are testable. Tests were added for month-end and leap years.

### Sample interview answer
"Instant is a point on the timeline in UTC with no timezone, which makes it right for storage and for passing between systems. LocalDateTime is just a calendar date and time with no location, so it does not identify a concrete moment; I only use it for concepts like 'opens at 8 AM'. OffsetDateTime has a fixed offset such as plus seven, while ZonedDateTime also carries timezone rules, including daylight saving time. In the database I store moments as Instant in a timestamptz column and convert to the user's timezone only when displaying or when computing a business boundary like 'transaction day in Vietnam time', which I compute explicitly with a ZoneId. I inject a Clock instead of calling now directly so midnight and month-end boundaries are testable. The classic bug is a container running in UTC while the code assumes local time."

> Senior tip: the golden rule — **always store UTC (Instant) in the DB**, **always display in the user's timezone at the frontend**, and **never run business logic calculations on LocalDateTime**. For batch cut-off jobs, use {{ZonedDateTime}} with the bank's fixed ZoneId to determine the day boundary.`,
    follow: [
      'Why is {{ZonedDateTime}} safer than {{OffsetDateTime}} for cut-off logic?',
      'How do you migrate an old {{TIMESTAMP}} column to {{TIMESTAMP WITH TIME ZONE}} without losing data?',
      'When should you use {{LocalDate}} instead of {{LocalDateTime}} for birthdays or expiry dates?'
    ]
  },
  'core-015': {
    q: 'try-with-resources: closing order, suppressed exceptions, and how to write {{AutoCloseable}} correctly.',
    a: `**Summary:** try-with-resources closes resources in **reverse declaration order**; an exception thrown during close is attached to {{getSuppressed()}} on the primary exception; a custom {{AutoCloseable}} must be idempotent and should not throw from {{close()}} unless the failure cannot be recovered.

### Closing order
~~~java
try (var in = new FileInputStream("a.txt");
     var out = new FileOutputStream("b.txt")) {
    // use in, out
} // out.close() runs first, then in.close()
~~~
- Resources close in LIFO order (last in, first out) — like a stack; the resource declared last closes first.
- If a later resource constructor throws, resources declared earlier are still closed (Java 9+ also supports final/effectively final resources).

### Suppressed exception
- If the try block throws **and** close() also throws: the close exception is **suppressed** (attached to {{primary.getSuppressed()}}), and the primary exception remains the one from the try block.
- Before Java 7 (manual finally), the close exception would **overwrite** the primary exception — losing the root cause.
- Always log {{getSuppressed()}} when catching exceptions so resource-close errors are not lost.

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
public final class DbResource implements AutoCloseable {
    private final Connection conn;
    private volatile boolean closed = false;

    public DbResource(Connection conn) { this.conn = conn; }

    @Override
    public void close() {
        if (closed) return;                 // idempotent
        closed = true;
        try {
            if (conn != null && !conn.isClosed()) conn.close();
        } catch (SQLException e) {
            // log and swallow, or wrap as unchecked if the caller needs to know
            // do NOT throw a new checked exception unless necessary
        }
    }
}
~~~
- **Idempotent**: calling {{close()}} multiple times is safe.
- **Do not throw** from {{close()}} unless the error is severe and cannot be ignored (for example failing to flush a critical log buffer). If it throws, callers cannot handle it easily.
- **Thread-safe** if the resource is shared: use {{volatile}} or {{synchronized}}.
- Stateful resources ({{InputStream}}, {{Connection}}) should be {{final}} classes to prevent subclasses from breaking close logic.

### Java 9+: final/effectively final resources
~~~java
var in = Files.newInputStream(path);
try (in) { ... }  // no new declaration needed inside try
~~~

### Under the hood: what the compiler turns try-with-resources into
javac translates {{try (var r = open())}} into try/catch/finally logic: if the body throws {{t}} and {{close()}} also throws {{e}} while closing the resource, the compiler calls {{t.addSuppressed(e)}} and rethrows {{t}} — the primary exception is not hidden. If the body succeeds but {{close()}} fails, the close exception is thrown. Resources declared later close first (reverse order) because they often depend on earlier ones (for example a {{PreparedStatement}} depends on a {{Connection}}). A null resource is skipped on close and does not throw NPE.

### Real-world example
An export job used a hand-written {{try/finally}}: in finally it called {{writer.close()}}; when the disk filled up, {{write}} threw an IOException "No space left", then {{close()}} (trying to flush) threw another exception and **hid** the original one. Logs showed only "Stream closed" — the team spent 2 days investigating in the wrong direction. After switching to try-with-resources, logs showed the original exception with a "Suppressed: ..." entry from close, and the full-disk cause was diagnosed in 10 minutes. In the same pass, a connection leak was found because a {{ResultSet}} was not closed on an error path — try-with-resources over {{Connection}}, {{PreparedStatement}}, and {{ResultSet}} fixed it.

### Sample interview answer
"try-with-resources automatically closes every resource that implements AutoCloseable when the block exits, even on exception, and it closes in the reverse order of declaration because a later resource often depends on an earlier one, like a statement depending on a connection. The important point is that if the body throws and close also throws, the close exception is attached to getSuppressed on the primary exception rather than hiding it, unlike hand-written try finally which often loses the root cause. When I implement AutoCloseable myself, I make close idempotent so calling it twice is safe, I release resources even if a step in the middle fails, and I declare a specific exception instead of a broad Exception. Since Java 9 I can also use an existing final variable directly in the try header."

> Senior tip: in code review, search for every manual {{close()}} in finally — convert them to try-with-resources. With pooled resources (DB connections), {{close()}} returns the connection to the pool rather than physically closing it; make sure the pool wrapper's {{AutoCloseable}} matches that semantics.`,
    follow: [
      'Why is an exception thrown in close() suppressed instead of overwriting the primary exception?',
      'Can a resource declared in try-with-resources be null?',
      'How do you write AutoCloseable for a resource that must flush before closing (for example BufferedWriter)?'
    ]
  },
  'core-016': {
    q: 'Advanced enums: {{EnumMap}}/{{EnumSet}}, enum singleton, enums as a state machine, and why you must not persist {{ordinal()}}.',
    a: `**Summary:** an enum is a final class with a fixed set of instances; {{EnumMap}}/{{EnumSet}} are faster than HashMap/HashSet thanks to array indexing by {{ordinal()}}; an enum singleton is thread-safe for free; an enum state machine is concise; **never persist ordinal()** because adding or reordering constants corrupts data — use name() or a custom code.

### EnumMap / EnumSet
- {{EnumMap<K,V>}}: keys are enums, backed by an array {{V[]}} indexed by {{key.ordinal()}}; O(1) with no hashing, no collisions, small memory, iterates in declaration order.
- {{EnumSet}}: a bitset (a single long for <= 64 constants, a long array for more); {{EnumSet.allOf}}, {{noneOf}}, {{range}}, {{complement}} are extremely fast.
- Compared to {{HashMap}}/{{HashSet}}: 2-10x faster, less GC, and no need for hashCode/equals.

~~~java
enum Status { NEW, PROCESSING, DONE, FAILED }
EnumMap<Status, Integer> counter = new EnumMap<>(Status.class);
EnumSet<Status> active = EnumSet.of(Status.NEW, Status.PROCESSING);
~~~

### Enum singleton
~~~java
enum Singleton { INSTANCE; void doWork() {} }
~~~
- Thread-safe, serialization-safe (guaranteed by the JVM), reflection-safe (private constructor), lazy init.
- The simplest and recommended approach (Effective Java Item 3).

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
- Each state is an instance; the abstract method forces every state to implement its transition.
- Easy to add validation, logging, or side effects per state.
- Not suitable for a complex state machine with many conditional transitions — use a library or a different pattern.

### Why not persist ordinal()
- {{ordinal()}} returns the declaration index (0-based). Adding a constant in the middle or reordering changes the meaning of all existing data.
- Example: {{Status.NEW=0, PROCESSING=1}}; insert {{PENDING}} in the middle and PROCESSING becomes 2, so old data stored as PROCESSING (1) is now read as PENDING.
- Solution: persist {{name()}} (String) or a custom {{code}} field (String/Int) defined on the enum.
- {{name()}} is stable unless you rename the constant; renaming still requires a migration script.

### Pitfall
- {{EnumMap}} is not thread-safe; use {{ConcurrentHashMap}} if it is shared.
- {{EnumSet}} does not serialize well with some older frameworks; test it carefully.
- Switching on enums: adding a new constant but forgetting to update a switch causes bugs; use a switch expression (exhaustive) so the compiler catches it.

### Under the hood: why EnumMap is fast
{{EnumMap}} keeps an **array** whose length equals the number of enum constants, indexed by {{ordinal()}} — {{get}}/{{put}} are just array accesses, with no hashing and no Node objects. An {{EnumSet}} with <= 64 constants uses **a single long** as a bit vector ({{RegularEnumSet}}): {{contains}} is a bitwise AND, {{addAll}} is a bitwise OR. Keeping {{ordinal}} in memory is safe because the enum and the map share the same class version; storing it in a DB or message is not, because the order can change across versions.

### Real-world example
An {{orders}} table stored status using {{@Enumerated(EnumType.ORDINAL)}} (JPA's default if not declared). A developer inserted a new status {{PENDING_REVIEW}} in the **middle** of the enum, so every existing row with an ordinal from 3 upward was read as the next status: about 180,000 "SHIPPED" orders displayed as "DELIVERED", and several hundred customers received incorrect delivery confirmation emails. Fix: rollback, migrate the column to a string, use {{@Enumerated(EnumType.STRING)}} or an {{AttributeConverter}} with a stable code ({{"SHP"}}, {{"DLV"}}); add an ArchUnit rule to forbid {{EnumType.ORDINAL}}.

### Sample interview answer
"An enum in Java is a final class with a fixed set of instances, initialized once when the class loads, so a single-element enum is a thread-safe singleton that also resists reflection and serialization creating duplicates. An enum can have fields, a constructor, and per-constant methods, which makes it a good fit for a small state machine: each state declares its valid transitions. EnumMap and EnumSet are much faster than HashMap and HashSet because they use an array indexed by ordinal and a bit vector. But I never persist ordinal to a database or message: insert one constant in the middle and all existing data is read wrong with no error at all. I store the name, or better a stable code via an AttributeConverter so I can still rename constants."

> Senior tip: in JPA, map enums with {{@Enumerated(EnumType.STRING)}} (stores the name) or an {{AttributeConverter}} for a custom code; **never** use {{EnumType.ORDINAL}}. For a complex state machine, consider a library like Squirrel or separate the transition logic into its own class.`,
    follow: [
      'Why is {{EnumMap}} faster than {{HashMap}} for enum keys?',
      'What drawback does an enum singleton have compared to the static holder pattern?',
      'How do you safely migrate data that was stored with ordinal() to a code/name?'
    ]
  },
  'core-017': {
    q: 'Interface default/static/private methods, the diamond problem, and when to choose an abstract class over an interface?',
    a: `**Summary:** Java 8+ allows default/static/private methods in interfaces; the diamond problem is resolved by the "class wins" rule and by requiring an override on conflict; choose an abstract class when you need shared state, a constructor, or non-public members; use an interface for a contract and multiple implementations.

### Default method
~~~java
default void log() { System.out.println("log"); }
~~~
- Provides a default implementation; implementing classes may override it.
- Used to **extend an old interface** without breaking binary compatibility (for example {{Collection.stream()}}, {{Iterable.forEach()}}).
- Cannot access private fields of the implementing class (only other public/protected methods).

### Static method
~~~java
static void helper() { ... }
~~~
- Handy for utility methods tied to the interface ({{Stream.of}}, {{Comparator.naturalOrder()}}).
- Not inherited; call as {{InterfaceName.helper()}}.

### Private method (Java 9)
~~~java
private void shared() { ... }
private static void util() { ... }
~~~
- Shares code between default methods without exposing it outside.

### Diamond problem
~~~java
interface A { default void m() { System.out.println("A"); } }
interface B { default void m() { System.out.println("B"); } }
class C implements A, B {
    @Override public void m() { A.super.m(); } // must override, choose A or B
}
~~~
- Rule: **class wins** — if a class (or its superclass) provides a concrete (non-abstract) method, that one is used.
- If two interfaces have a default method with the same signature and the class does not override it, it is a compile error.
- Use {{A.super.m()}} to call a specific default method.

### Interface vs Abstract class
| Criterion | Interface | Abstract class |
|---|---|---|
| Inheritance | multiple (implements) | single (extends) |
| Fields | only {{static final}} | instance fields, constructor |
| Access modifiers | public (default methods) | any (protected, package) |
| State | none | yes |
| Binary compat | adding a default method is safe | adding an abstract method breaks subclasses |

### When to choose an abstract class
- Need **shared state** (fields) or a **constructor** to initialize it.
- Need **non-public methods** (protected helpers for subclasses).
- Designing the template method pattern (a {{final}} method calling abstract hooks).
- A tight hierarchy base (entity base, handler base).

### When to choose an interface
- Define a **contract** (capability) without caring about implementation.
- Need multiple implementations ({{Comparable}}, {{Serializable}}, {{AutoCloseable}}).
- A public API that must keep binary compatibility when extended.

### Real-world example
An internal library exposed a {{PaymentGateway}} interface used by 14 services. Adding a new {{refund()}} method broke compilation for every implementing class. The team changed it to a {{default}} {{refund()}} method that throws {{UnsupportedOperationException}} with a clear message, then each service added support gradually — no coordinated release needed. Later, one service implemented both {{PaymentGateway}} and {{Auditable}}, which both had a default {{describe()}} — compile error, forcing the class to override and choose explicitly with {{PaymentGateway.super.describe()}}. The lesson was written into the guidelines: default methods are for **evolving an API**, not for stuffing in shared business logic (that belongs in a testable class).

### Sample interview answer
"Since Java 8 interfaces can have default and static methods, and since Java 9 also private methods to share code between defaults. The main purpose of a default method is API evolution: adding a method to an interface that already has many implementors without breaking them. The diamond problem is resolved by rules: a class method always wins over an interface default, a more specific subinterface wins over a parent interface, and if two interfaces at the same level both provide a default the compiler forces the class to override and choose explicitly with the interface-name dot super syntax. I choose an abstract class when I need shared state, a constructor, or non-public members and accept single inheritance. I choose an interface for a contract, to let one class play multiple roles, and because interfaces are easy to mock in tests."

> Senior tip: default to **interfaces** for new APIs; use an abstract class only when you truly need state or a constructor. If an interface accumulates many complex default methods, consider splitting into a small interface plus an abstract helper class.`,
    follow: [
      'Can a default method override an {{Object}} method (equals, hashCode, toString)?',
      'Are static methods in an interface inherited?',
      'Why does Java not allow interfaces to have non-final instance fields?'
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
