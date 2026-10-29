/*
 * English translation of js/data/quiz-java.js — task T419. Format: js/core/i18n.js (content overlay).
 * ids: qz-core-007 qz-core-008 qz-core-009 qz-core-010 qz-core-011 qz-core-012 qz-core-013 qz-core-014 qz-core-015 qz-core-016 qz-core-017 qz-core-018 qz-core-019 qz-core-020 qz-collections-007 qz-collections-008 qz-collections-009 qz-collections-010 qz-collections-011 qz-collections-012 qz-collections-013 qz-collections-014 qz-collections-015
 */
App.i18n.content({
  "qz-core-007": {
    "q": `What does the following code print?
~~~java
static int f() {
    int x = 1;
    try { return x; }
    finally { x = 2; }
}
static int g() {
    try { throw new RuntimeException("boom"); }
    finally { return 3; }
}
// main:
System.out.println(f() + " " + g());
~~~`,
    "options": [
      `1 3, and the RuntimeException "boom" is swallowed, nobody ever sees it`,
      `2 3, because finally runs last so x = 2 is what gets returned`,
      `1, and then the program throws the RuntimeException "boom"`,
      `Does not compile, because you are not allowed to write return inside finally`
    ],
    "explain": `**Correct answer: 1 3, the exception "boom" is swallowed.**

### Why it is correct
- In {{f()}}: the {{return x}} statement **evaluates the return value (1) and stores it in a temporary slot** before jumping into {{finally}}. The {{finally}} block assigning {{x = 2}} only changes the local variable, not the value already stored, so {{f()}} returns 1. (If {{x}} were a mutable object such as {{StringBuilder}} and finally called {{append}}, the caller would see the change, because the stored value is a reference.)
- In {{g()}}: a {{return}} inside {{finally}} is an "abrupt completion", so it **replaces** any previous result, including the exception currently in flight. The RuntimeException disappears completely and {{g()}} returns 3.

### Why the other options are wrong
- **2 3**: assumes finally can change a primitive return value that has already been computed.
- **1 then throws the exception**: the exception is swallowed by the return inside finally and never propagates out.
- **Does not compile**: return inside finally is legal; javac only warns when you enable {{-Xlint:finally}}.

> Senior tip: return/throw inside {{finally}} is the classic anti-pattern that loses the root exception in production (no stack trace in the log, transactions that "succeed" when they did not). Enable {{-Xlint:all -Werror}} or the Sonar/ErrorProne rules ({{FinallyThrows}}, {{ReturnFromFinallyBlock}}) to block it in CI.`
  },
  "qz-core-008": {
    "q": `What does the following code print?
~~~java
String a = "hello";
String b = "hel" + "lo";
String c = new String("hello");
final String p = "hel";
String d = p + "lo";
String q = "hel";
String e = q + "lo";
System.out.println((a == b) + " " + (a == c) + " " + (a == d)
    + " " + (a == e) + " " + (a == e.intern()));
~~~`,
    "options": [
      `true false false false true`,
      `true false true false true`,
      `true false true true true`,
      `false false false false true`
    ],
    "explain": `**Correct answer: true false true false true.**

### Why it is correct
- {{a == b}}: {{"hel" + "lo"}} is a **compile-time constant expression**, so javac folds it into the literal {{"hello"}} at compile time; both therefore point to the same object in the String pool → {{true}}.
- {{a == c}}: {{new String(...)}} always creates a new object on the heap → {{false}}.
- {{a == d}}: {{p}} is a {{final}} variable initialised with a constant, i.e. a **constant variable**, so {{p + "lo"}} is still a compile-time constant → folded into a literal → {{true}}.
- {{a == e}}: {{q}} is not final, so the concatenation runs at runtime (since Java 9 through {{invokedynamic}}/{{StringConcatFactory}}) and creates a new String → {{false}}.
- {{e.intern()}} returns the copy in the pool, which is exactly the object {{a}} points to → {{true}}.

### Why the other options are wrong
- **true false false false true**: ignores the constant-variable rule for {{final String p}}.
- **true false true true true**: assumes runtime concatenation is interned as well; in reality it is not.
- **false false false false true**: assumes every concatenation runs at runtime; javac folds constants very early.

> Senior tip: the result of {{==}} on String depends on compilation details (adding or removing {{final}} flips the outcome), so in real code always use {{equals}}. This question exists to check whether a candidate understands constant folding and the String pool, not to encourage {{==}}.`
  },
  "qz-core-009": {
    "q": `What does the following code print?
~~~java
static void change(StringBuilder sb, int n, String s) {
    sb.append("!");
    sb = new StringBuilder("new");
    n++;
    s = s + "?";
}
// main:
StringBuilder sb = new StringBuilder("hi");
int n = 1;
String s = "a";
change(sb, n, s);
System.out.println(sb + " " + n + " " + s);
~~~`,
    "options": [
      `new 2 a?`,
      `hi! 2 a`,
      `hi! 1 a`,
      `hi 1 a`
    ],
    "explain": `**Correct answer: hi! 1 a.**

### Why it is correct
Java is **always pass-by-value**. For objects, the value that gets copied is the **reference**:
- {{sb.append("!")}}: the parameter {{sb}} and the variable in main point to the same object, so the change to the object's content is visible to the caller → "hi!".
- {{sb = new StringBuilder("new")}}: this only reassigns the **copy** of the reference inside the method; the variable in main still points to the old object.
- {{n++}}: increments the copy of the primitive, so {{n}} in main stays 1.
- {{s = s + "?"}}: String is immutable, so the concatenation creates a new object that is assigned only to the local variable → {{s}} in main stays "a".

~~~text
main.sb ──┐
          ├──> [StringBuilder "hi!"]
param.sb ─┘   (afterwards param.sb points to [StringBuilder "new"], main does not know)
~~~

### Why the other options are wrong
- **new 2 a?**: assumes pass-by-reference like C++ {{&}}; Java has no such thing.
- **hi! 2 a**: primitives are copied, so incrementing inside the method does not affect the caller.
- **hi 1 a**: overlooks the fact that {{append}} modifies the shared object directly.

> Senior tip: a common real bug is a method that "returns a result" by reassigning its parameter (for example {{list = new ArrayList<>()}}), after which the caller sees nothing. A good convention: treat parameters as {{final}} (many teams enable the checkstyle {{FinalParameters}} or ParameterAssignment checks) and return results through the return value.`
  },
  "qz-core-010": {
    "q": `What does the following code print?
~~~java
class Parent {
    static { System.out.print("A"); }
    { System.out.print("B"); }
    Parent() { System.out.print("C"); }
}
class Child extends Parent {
    static { System.out.print("D"); }
    { System.out.print("E"); }
    Child() { System.out.print("F"); }
}
// main:
new Child();
new Child();
~~~`,
    "options": [
      `ABCDEFABCDEF`,
      `ADBECFBECF`,
      `DABCEFBCEF`,
      `ADBCEFBCEF`
    ],
    "explain": `**Correct answer: ADBCEFBCEF.**

### Why it is correct
1. The first time {{Child}} is used, the JVM must **initialise the class**. Initialising a subclass requires the superclass to be initialised first → Parent's static block ({{A}}), then Child's ({{D}}). A static block runs **once** per class (per ClassLoader).
2. Creating the object: the {{Child()}} constructor implicitly calls {{super()}} first. Inside Parent, the instance initialiser and field initialisers run **after super() and before the constructor body** → {{B}} then {{C}}.
3. Back in Child: instance initialiser {{E}}, then the constructor body {{F}}.
4. On the second {{new Child()}}: the class is already initialised, so only the instance part runs → {{BCEF}}.

### Why the other options are wrong
- **ABCDEFABCDEF**: assumes static blocks run on every new and interleave with instance blocks.
- **ADBECFBECF**: assumes all instance blocks (parent and child) run before any constructor; in fact the parent finishes first (B, C) and only then does the child start.
- **DABCEFBCEF**: the superclass is always initialised before the subclass.

> Senior tip: the dangerous consequence of this order: if the Parent constructor calls a method that Child overrides, that method runs while Child's fields are **still uninitialised** (null/0). This is why Effective Java advises against calling overridable methods from constructors.`
  },
  "qz-core-011": {
    "q": `You store monetary amounts in a {{HashSet}} and a {{TreeSet}}. What does the following code print?
~~~java
BigDecimal a = new BigDecimal("1.0");
BigDecimal b = new BigDecimal("1.00");
Set<BigDecimal> hs = new HashSet<>(List.of(a, b));
Set<BigDecimal> ts = new TreeSet<>(List.of(a, b));
System.out.println(a.equals(b) + " " + a.compareTo(b)
    + " " + hs.size() + " " + ts.size());
~~~`,
    "options": [
      `false 0 2 1`,
      `true 0 1 1`,
      `false 0 1 1`,
      `false 0 2 2`
    ],
    "explain": `**Correct answer: false 0 2 1.**

### Why it is correct
- {{BigDecimal.equals}} compares **both value and scale**: 1.0 (scale 1) differs from 1.00 (scale 2) → {{false}}. {{hashCode}} differs by scale too.
- {{compareTo}} compares **numeric value only** → 0.
- {{HashSet}} uses {{hashCode/equals}} → treats them as two elements → size 2.
- {{TreeSet}} uses {{compareTo}} → treats them as duplicates → size 1.

This is the classic example of {{compareTo}} being **inconsistent with equals** (the BigDecimal Javadoc says so explicitly).

### Why the other options are wrong
- **true 0 1 1**: BigDecimal's {{equals}} does take scale into account.
- **false 0 1 1**: HashSet does not use compareTo, so it keeps both elements.
- **false 0 2 2**: TreeSet relies entirely on compareTo to decide duplicates.

> Senior tip: in money-handling systems, normalise the scale as soon as the value enters the domain ({{setScale(2, RoundingMode.HALF_UP)}}) and compare with {{compareTo}}. Be careful with {{stripTrailingZeros()}}: "100" becomes 1E+2 when printed, which breaks display and serialisation. A real bug: a {{HashMap<BigDecimal, Rate>}} looked up by an amount read from the DB (scale 4) did not match the key loaded from config (scale 2).`
  },
  "qz-core-012": {
    "q": `Given the following overloads, what does the code print?
~~~java
static void m(long x)    { System.out.print("long "); }
static void m(Integer x) { System.out.print("Integer "); }
static void m(int... x)  { System.out.print("varargs "); }
// main:
int i = 5;
m(i);
Integer boxed = 5;
m(boxed);
~~~`,
    "options": [
      `Integer Integer`,
      `long Integer`,
      `varargs Integer`,
      `Compile error because the call m(i) is ambiguous`
    ],
    "explain": `**Correct answer: long Integer.**

### Why it is correct
The compiler picks an overload in **3 phases** (JLS 15.12.2) and stops at the first phase that finds a candidate:
1. **Phase 1**: only widening of primitives/references is allowed, **no boxing/unboxing, no varargs**.
2. **Phase 2**: boxing/unboxing is allowed.
3. **Phase 3**: varargs is allowed.

- {{m(i)}} with an {{int}}: phase 1 finds {{m(long)}} (widening int → long) applicable → chosen immediately, without ever considering boxing to {{Integer}}.
- {{m(boxed)}} with an {{Integer}}: phase 1 finds {{m(Integer)}}, an exact type match → chosen. {{m(long)}} needs unboxing, so it belongs to phase 2 and is ruled out.

### Why the other options are wrong
- **Integer Integer**: boxing is only considered in phase 2, after widening.
- **varargs Integer**: varargs has the lowest priority (phase 3) and is only used when the first two phases find no candidate.
- **Ambiguous**: there is no ambiguity, because phase 1 has exactly one candidate.

> Senior tip: this rule is kept so that old code (pre-Java 5) did not change behaviour when autoboxing was introduced. A real bug: {{list.remove(i)}} with a {{List<Integer>}} and an {{int i}} calls {{remove(int index)}} (phase 1) instead of {{remove(Object)}}, deleting by position instead of by value.`
  },
  "qz-core-013": {
    "q": `The parent class declares {{public void load() throws IOException}}. In a subclass, which override declarations **compile**? (Choose 2)`,
    "options": [
      `public void load() throws Exception`,
      `public void load()`,
      `protected void load() throws IOException`,
      `public void load() throws FileNotFoundException`,
      `public void load() throws IOException, SQLException`
    ],
    "explain": `**Correct answer: {{public void load()}} and {{public void load() throws FileNotFoundException}}.**

### Why it is correct
The override rule comes from **Liskov substitution**: code calling through the parent type ({{Base b = new Sub(); b.load();}}) only prepares a {{catch (IOException)}}, so a subclass:
- **must not throw a broader or new checked exception**; it may only throw fewer, narrower ones (subclasses of IOException), or nothing at all.
- **must not narrow the access modifier** (public → protected would break code calling from another package).
- is free to throw unchecked exceptions (RuntimeException).

So dropping throws entirely is legal, and {{FileNotFoundException}} is a subclass of {{IOException}}, so it is legal too.

### Why the other options are wrong
- **throws Exception**: broader than IOException, so the caller cannot catch it → compile error.
- **protected ...**: reduces access from public to protected → "attempting to assign weaker access privileges".
- **throws IOException, SQLException**: SQLException is a new checked exception and is not an IOException.

> Senior tip: this is why many modern frameworks (Spring, JPA) prefer unchecked exceptions: an interface can evolve without breaking every implementation. When designing a public interface, think carefully before adding a checked exception, because later you cannot add one without a breaking change.`
  },
  "qz-core-014": {
    "q": `You need a generic method such that both calls {{copy(List<Integer> src, List<Number> dst)}} and {{copy(List<Double> src, List<Object> dst)}} compile, and inside the method body you can read elements from {{src}} and {{add}} them to {{dst}}. Which signature is correct?`,
    "options": [
      `static <T> void copy(List<T> src, List<T> dst)`,
      `static void copy(List<? super Number> src, List<? extends Number> dst)`,
      `static <T> void copy(List<? extends T> src, List<? super T> dst)`,
      `static void copy(List<Object> src, List<Object> dst)`
    ],
    "explain": `**Correct answer: {{static <T> void copy(List<? extends T> src, List<? super T> dst)}}.**

### Why it is correct
The **PECS** rule (Producer Extends, Consumer Super):
- {{src}} **produces** the elements we read → {{? extends T}}: whatever we read is guaranteed to be a {{T}}.
- {{dst}} **consumes** the elements we write → {{? super T}}: it is guaranteed to accept a {{T}}.
For the first call, the compiler infers {{T = Integer}} (or Number): {{List<Integer>}} matches {{? extends Integer}} and {{List<Number>}} matches {{? super Integer}}. The second call works the same way with {{T = Double}}. This is exactly the signature of {{Collections.copy}}.

### Why the other options are wrong
- **List<T> src, List<T> dst**: generics are **invariant**, so {{T}} would have to be both Integer and Number → inference fails, compile error.
- **? super Number src, ? extends Number dst**: PECS reversed; reading from {{? super}} only yields {{Object}}, and you cannot {{add}} to a {{List<? extends Number>}} (except null). On top of that, {{List<Integer>}} does not match {{? super Number}}.
- **List<Object>**: {{List<Integer>}} is **not** a subtype of {{List<Object>}} (invariance), so both calls fail.

> Senior tip: put wildcards in the **parameters** of public APIs so callers stay flexible, but **not** in the return type (which forces callers to deal with wildcards). Reading the signatures of {{Stream.flatMap}} and {{Comparator.comparing}} in the JDK is the fastest way to learn PECS.`
  },
  "qz-core-015": {
    "q": `Class {{Point}} overrides {{equals}} but **forgets to override {{hashCode}}**. What does the following code usually print?
~~~java
class Point {
    final int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
    @Override public boolean equals(Object o) {
        return o instanceof Point p && p.x == x && p.y == y;
    }
}
Set<Point> s = new HashSet<>();
s.add(new Point(1, 2));
System.out.println(s.contains(new Point(1, 2)) + " "
    + List.of(new Point(1, 2)).contains(new Point(1, 2)));
~~~`,
    "options": [
      `true true`,
      `false false`,
      `Compile error, because overriding equals makes overriding hashCode mandatory`,
      `Almost always false true`
    ],
    "explain": `**Correct answer: almost always false true.**

### Why it is correct
- {{HashSet.contains}} computes {{hashCode()}} to find the bucket **first**, and only then compares {{equals}} within that bucket. Without the override, {{hashCode}} is the identity hash (usually different for two objects), so it looks in the wrong bucket and returns {{false}} (unless the hashes happen to collide, a very small probability).
- {{List.contains}} just scans sequentially and calls {{equals}} → {{true}}.

Contract: {{a.equals(b)}} ⇒ {{a.hashCode() == b.hashCode()}}. Violating it makes every hash-based structure (HashMap, HashSet, cache keys, Stream {{distinct()}}) misbehave silently.

### Why the other options are wrong
- **true true**: only correct when hashCode is consistent with equals.
- **false false**: List does not use hashCode, so it still finds the element.
- **Compile error**: the compiler does not check this contract; only IDEs and static analysis warn.

> Senior tip: use {{record}} for value objects so equals/hashCode are generated automatically and always consistent. For ordinary classes, generate them with the IDE/Lombok and add a test using EqualsVerifier. This bug typically shows up in production as "cache hit rate 0%" or "dedupe does not work".`
  },
  "qz-core-016": {
    "q": `Class {{Cache}} (holding a few hundred MB of data) creates {{Entry}} objects as a **non-static inner class**, then pushes the entries into a {{static}} registry that lives for the entire application lifetime. A heap dump shows hundreds of {{Cache}} instances that are never collected, even though the code has dropped every reference to them. What is the most likely cause?`,
    "options": [
      `Each Entry holds an implicit reference to the enclosing Cache instance (field this$0), and the static registry keeps the Entry alive, dragging the whole Cache along`,
      `The registry uses a non-thread-safe HashMap, so the GC cannot scan it`,
      `Inner classes are stored in Metaspace, so their objects are never garbage collected`,
      `The GC does not collect objects larger than a G1 region`
    ],
    "explain": `**Correct answer: the inner class holds an implicit reference to the outer instance.**

### Why it is correct
For a non-static inner class the compiler always adds a hidden field (usually named {{this$0}}) pointing to the enclosing instance, so that code inside can access the outer object's fields. The reference chain:
~~~text
GC root (static registry) -> Entry -> this$0 -> Cache (hundreds of MB)
~~~
As long as a single Entry is alive, the whole Cache cannot be collected. Fix: declare {{static class Entry}} (a static nested class has no implicit reference) and pass in only the data you actually need.

### Why the other options are wrong
- **Non-thread-safe HashMap**: thread-safety has nothing to do with collectability; the GC only looks at reachability.
- **Metaspace**: Metaspace holds **class metadata**; instances still live on the heap and are collected normally once unreachable.
- **G1 regions**: large objects are humongous objects and are still reclaimed when unreachable.

> Senior tip: anonymous classes and lambdas inside an instance method that use {{this}} (or a field) also capture the outer instance. In a heap dump (Eclipse MAT), running "Path to GC Roots" on a Cache object immediately reveals {{this$0}}. Effective Java's rule: nested classes should be {{static}} by default unless they genuinely need the outer instance.`
  },
  "qz-core-017": {
    "q": `Code-review the following class, which is claimed to be immutable. Which points make it **not truly immutable**? (Choose 3)
~~~java
public final class Order {
    private final String id;
    private final List<String> items;
    private final Date createdAt;
    public Order(String id, List<String> items, Date createdAt) {
        this.id = id;
        this.items = items;
        this.createdAt = createdAt;
    }
    public String id() { return id; }
    public List<String> items() { return Collections.unmodifiableList(items); }
    public Date createdAt() { return createdAt; }
}
~~~`,
    "options": [
      `The constructor assigns the caller's list directly; if the caller modifies the original list, items() changes too`,
      `The id field is a String and can be changed, so you must defensive-copy it with new String(id)`,
      `The constructor stores the caller's Date reference directly`,
      `Because the class is declared final, it cannot be truly immutable`,
      `The createdAt() getter returns the internal Date object itself, so the caller can call setTime()`
    ],
    "explain": `**Correct answer: the list is assigned directly, the Date is stored directly, and the getter returns a mutable Date.**

### Why it is correct
True immutability requires: a {{final}} class, {{private final}} fields, and **defensive copies on the way in and on the way out** for every mutable component.
- {{this.items = items}}: {{unmodifiableList}} is only a **view** that blocks writes through the getter, but the caller still holds the original list and can modify it → the Order's content changes. Fix: {{this.items = List.copyOf(items)}} (copies and rejects null at the same time).
- {{this.createdAt = createdAt}}: {{Date}} is mutable, so a caller calling {{setTime}} on the original object changes the Order. Fix: {{new Date(createdAt.getTime())}}, or better, use {{Instant}} (immutable).
- The getter returning {{createdAt}} directly also exposes the mutable object.

### Why the other options are wrong
- **String id**: String is immutable, no copy needed (reflection can break anything, and that is not a design criterion).
- **final class**: on the contrary, {{final}} is a **requirement** so that subclasses cannot add mutable state or override getters.

> Senior tip: {{record}} + {{List.copyOf}} in the compact constructor + {{java.time}} types is the fastest route to true immutability. Remember that records are only **shallowly** immutable: a record holding an {{ArrayList}} can still be modified from outside if you do not copy.`
  },
  "qz-core-018": {
    "q": `A job runs daily at 02:30 in {{ZoneId.of("America/New_York")}}. 2025-03-09 is the day daylight saving time starts (clocks jump from 02:00 to 03:00). What does the following call return?
~~~java
ZonedDateTime t = ZonedDateTime.of(
    LocalDate.of(2025, 3, 9), LocalTime.of(2, 30), ZoneId.of("America/New_York"));
~~~`,
    "options": [
      `Throws DateTimeException because 02:30 does not exist on that day`,
      `2025-03-09T03:30-04:00, the time is shifted forward by exactly the length of the gap`,
      `2025-03-09T02:30-05:00, keeping the winter offset`,
      `2025-03-09T03:00-04:00, rounded to the first valid instant`
    ],
    "explain": `**Correct answer: 2025-03-09T03:30-04:00.**

### Why it is correct
According to the Javadoc of {{ZonedDateTime.of}}/{{ofLocal}}: when a local date-time falls into a **gap** (a period that does not exist because the clock jumps forward), the local time is **moved later by exactly the length of the gap** (1 hour) and the summer offset is used. So 02:30 becomes 03:30 EDT (-04:00).
For an **overlap** (autumn, when 01:30 occurs twice), the default is the offset **before** the transition; you can change it with {{withLaterOffsetAtOverlap()}}.

### Why the other options are wrong
- **DateTimeException**: {{ZonedDateTime.of}} does not throw for a gap; only {{ZonedDateTime.ofStrict}} does.
- **02:30-05:00**: the -05:00 offset is not valid for that instant in New York; java.time always returns a valid combination.
- **03:00**: it does not round, it shifts by the length of the gap.

> Senior tip: a scheduler using local time will **run a job twice** or **skip** it on the day the clocks change (Spring's {{@Scheduled(cron, zone)}} has to deal with this too). For important jobs (reconciliation, interest calculation), schedule in UTC or pick a time outside the 01:00–03:00 window. Store instants in the DB as {{Instant}}/{{timestamptz}} and convert to a zone only for display.`
  },
  "qz-core-019": {
    "q": `What does the following code print?
~~~java
enum Status { NEW, PAID, SHIPPED }
Map<Status, Integer> m = new EnumMap<>(Status.class);
m.put(Status.SHIPPED, 3);
m.put(Status.NEW, 1);
m.put(Status.PAID, 2);
System.out.println(m.keySet() + " " + Status.valueOf("PAID").ordinal());
~~~`,
    "options": [
      `[SHIPPED, NEW, PAID] 1`,
      `[NEW, PAID, SHIPPED] 2`,
      `[NEW, PAID, SHIPPED] 1`,
      `Order is undefined because EnumMap is hash-based; 1`
    ],
    "explain": `**Correct answer: [NEW, PAID, SHIPPED] 1.**

### Why it is correct
- Internally, {{EnumMap}} is **an array** indexed by the enum's {{ordinal()}}, so it always iterates in the enum's **declaration order**, regardless of put order. That makes it very fast and compact (no Node objects, no hashing).
- {{ordinal()}} starts at 0: NEW = 0, PAID = 1, SHIPPED = 2.

### Why the other options are wrong
- **[SHIPPED, NEW, PAID]**: that is insertion order (like LinkedHashMap); EnumMap does not preserve insertion order.
- **ordinal 2**: ordinals are counted from 0.
- **Hash-based**: EnumMap does not use hashing; the order is deterministic.

> Senior tip: **never persist {{ordinal()}} to the DB** (JPA's {{EnumType.ORDINAL}} is the default for {{@Enumerated}}!). Someone merely inserting a new constant in the middle of the enum makes all existing rows mean something different. Use {{@Enumerated(EnumType.STRING)}} or a stable code you define yourself together with an {{AttributeConverter}}.`
  },
  "qz-core-020": {
    "q": `Class {{C}} does not compile because of a default-method conflict. Which fixes are valid? (Choose 2)
~~~java
interface A { default String hi() { return "A"; } }
interface B { default String hi() { return "B"; } }
class C implements A, B { }
~~~`,
    "options": [
      `Override hi() in C and call A.super.hi() to pick A's behaviour`,
      `Override hi() in C and call super.hi()`,
      `Make B extend A and override hi() in B; then C implements A, B and compiles, using B's hi()`,
      `Just mark C as abstract; no override is needed`,
      `Add @FunctionalInterface to A so that A takes priority`
    ],
    "explain": `**Correct answer: override and call {{A.super.hi()}}; or make B extend A and override.**

### Why it is correct
Rules for resolving default-method conflicts:
1. **Class wins over interface**: a method in the class (or a superclass) always takes priority.
2. **The more specific interface wins**: if B extends A and overrides hi(), then B is "more specific", so C uses B.hi() without error.
3. Otherwise (A and B are siblings) → the class must **override it itself** and can pick one version with the {{X.super.method()}} syntax.

### Why the other options are wrong
- **super.hi()**: {{super}} refers to the superclass ({{Object}}), which has no hi() → compile error. You must name the interface explicitly.
- **abstract class C**: the JLS still reports an error when a class (even an abstract one) inherits two conflicting default methods without overriding.
- **@FunctionalInterface**: the annotation only checks that the interface has exactly one abstract method; it does not affect priority, and here A has no abstract method at all, so it would fail.

> Senior tip: this conflict often appears when a library upgrade adds a default method with the same name and client code suddenly stops compiling (for example, Java 21 added {{getFirst()}}/{{reversed()}} to List, which clashes with hand-written interfaces). When designing an API, pick default-method names that are specific enough.`
  },
  "qz-collections-007": {
    "q": `What does the following code produce?
~~~java
List<Integer> list = new ArrayList<>(List.of(1, 2, 3, 4));
for (Integer x : list) {
    if (x == 3) list.remove(x);
}
System.out.println(list);
~~~`,
    "options": [
      `Throws ConcurrentModificationException`,
      `[1, 2, 3], because list.remove(x) with x = 3 removes the element at index 3`,
      `The loop runs forever`,
      `[1, 2, 4], no exception thrown`
    ],
    "explain": `**Correct answer: it prints [1, 2, 4] and throws no exception.**

### Why it is correct
The for-each loop uses the ArrayList's {{Iterator}}. Two mechanisms matter:
- {{hasNext()}} only checks {{cursor != size}}.
- {{next()}} is the one that checks {{modCount}} and throws {{ConcurrentModificationException}}.

The sequence: after returning 3, {{cursor = 3}}. {{list.remove(x)}} removes the element 3, leaving {{size}} = 3. On the next iteration {{hasNext()}} sees {{cursor == size}} and returns {{false}} → the loop ends and **next() is never called**, so there is no CME, and element 4 is never visited either. Removing the **second-to-last element** is the special case that slips past fail-fast.

### Why the other options are wrong
- **CME**: it would occur if you removed a different element (2, for example), but not with the second-to-last one.
- **Removes index 3**: {{x}} is an {{Integer}}, so the {{remove(Object)}} overload is called and removes by value.
- **Forever**: the cursor never moves backwards.

> Senior tip: fail-fast is **best-effort**; the Javadoc states explicitly that you must not rely on it for correctness. This code "works" in tests but will blow up with a CME when the data changes. Always use {{list.removeIf(...)}} or {{Iterator.remove()}}.`
  },
  "qz-collections-008": {
    "q": `What does the following code produce?
~~~java
String[] arr = {"a", "b", "c"};
List<String> l = Arrays.asList(arr);
arr[0] = "z";
l.set(1, "y");
System.out.println(l + " " + arr[1]);
l.add("d");
~~~`,
    "options": [
      `Prints "[z, y, c] y", then throws UnsupportedOperationException at l.add`,
      `Prints "[a, y, c] b", then add succeeds`,
      `Prints "[z, y, c] y", and add succeeds because Arrays.asList returns a java.util.ArrayList`,
      `Throws UnsupportedOperationException right at l.set`
    ],
    "explain": `**Correct answer: it prints "[z, y, c] y" and then throws UnsupportedOperationException.**

### Why it is correct
{{Arrays.asList}} returns {{Arrays$ArrayList}} (a private class with a similar name that is **not** {{java.util.ArrayList}}), a **fixed-size view** wrapping the original array directly:
- Writing to the array ({{arr[0] = "z"}}) is visible in the list immediately.
- {{set}} is supported and writes through to the array → {{arr[1]}} becomes "y".
- {{add}}/{{remove}} change the size → {{UnsupportedOperationException}} (inherited from {{AbstractList}}).

### Why the other options are wrong
- **[a, y, c] b**: the list is not a copy; changes are visible in both directions.
- **java.util.ArrayList**: similar name but a different class, and it cannot change size.
- **UOE at set**: set does not change the size, so it is allowed (unlike {{List.of}}, which blocks set too).

> Senior tip: the second trap is calling {{Arrays.asList}} with a two-element {{int[]}}; that yields a {{List<int[]>}} with **one element** (primitive arrays are not boxed). If you need a modifiable list use {{new ArrayList<>(Arrays.asList(arr))}}; if you need an immutable one use {{List.of(arr)}}.`
  },
  "qz-collections-009": {
    "q": `You know in advance that exactly 100,000 entries will be loaded into a {{HashMap}} and you want **no resize to ever happen**, keeping the default load factor. On Java 21, which declaration is correct?`,
    "options": [
      `new HashMap<>(100_000)`,
      `HashMap.newHashMap(100_000)`,
      `new HashMap<>(); then call map.ensureCapacity(100_000)`,
      `new HashMap<>(75_000), because 75,000 / 0.75 = 100,000`
    ],
    "explain": `**Correct answer: {{HashMap.newHashMap(100_000)}}.**

### Why it is correct
The {{HashMap(int)}} constructor parameter is the **table capacity**, not the number of elements. A resize happens when {{size > capacity * loadFactor}}. The factory {{newHashMap(int numMappings)}} (added in **Java 19**) pre-computes capacity = {{numMappings / 0.75}} and rounds it up to a power of two, so it holds the full number of entries without resizing. There are equivalents: {{HashSet.newHashSet}}, {{LinkedHashMap.newLinkedHashMap}}.

### Why the other options are wrong
- **new HashMap<>(100_000)**: capacity is rounded up to 131,072, threshold = 131,072 × 0.75 = 98,304 < 100,000 → it still resizes **once** at the 98,305th entry (copying the whole table).
- **ensureCapacity**: HashMap has no such method (that one belongs to ArrayList) → compile error.
- **75,000**: backwards from the formula; capacity 131,072 → threshold 98,304, still resizes. If you want to compute it yourself it must be {{100_000 / 0.75 + 1}}.

> Senior tip: before Java 19, Guava had {{Maps.newHashMapWithExpectedSize}}. Pre-sizing matters when the map is very large or created repeatedly on a hot path; for small maps the benefit is negligible. Do not set {{loadFactor = 1.0}} to "save space": collision chains get longer and lookups get slower.`
  },
  "qz-collections-010": {
    "q": `What does the following code print?
~~~java
record Emp(String name, int age) {}
Set<Emp> s = new TreeSet<>(Comparator.comparingInt(Emp::age));
s.add(new Emp("An", 30));
s.add(new Emp("Binh", 30));
s.add(new Emp("Chi", 25));
System.out.println(s.size() + " " + s.contains(new Emp("Zed", 30)));
~~~`,
    "options": [
      `3 false`,
      `3 true`,
      `2 true`,
      `2 false`
    ],
    "explain": `**Correct answer: 2 true.**

### Why it is correct
{{TreeSet}}/{{TreeMap}} **do not use equals/hashCode**; they decide "duplicate" via {{compare(a, b) == 0}}. The comparator only compares age:
- "Binh" (30) compared with "An" (30) → 0 → treated as a duplicate, {{add}} returns false and **does not insert**. Size = 2 (An, Chi).
- {{contains(new Emp("Zed", 30))}} → compare with An = 0 → {{true}}, even though the record Emp("Zed", 30) is not equal to Emp("An", 30).

### Why the other options are wrong
- **3 false / 3 true**: only correct for HashSet (which uses the record's equals, comparing both name and age).
- **2 false**: contains also uses the comparator, so it does find a match.

> Senior tip: a comparator should be **consistent with equals**; if you sort by a non-unique field, add a tie-breaker: {{comparingInt(Emp::age).thenComparing(Emp::name)}}. A real bug: using a TreeSet to "deduplicate and sort" transactions by timestamp silently dropped one of two transactions with the same millisecond, and no error was raised.`
  },
  "qz-collections-011": {
    "q": `You build an LRU cache with a capacity of 2 using {{LinkedHashMap}}. What does the following code print?
~~~java
Map<String, Integer> lru = new LinkedHashMap<>(16, 0.75f, true) {
    @Override
    protected boolean removeEldestEntry(Map.Entry<String, Integer> e) {
        return size() > 2;
    }
};
lru.put("a", 1);
lru.put("b", 2);
lru.get("a");
lru.put("c", 3);
System.out.println(lru.keySet());
~~~`,
    "options": [
      `[b, c]`,
      `[a, b, c]`,
      `[c, a]`,
      `[a, c]`
    ],
    "explain": `**Correct answer: [a, c].**

### Why it is correct
- The third parameter {{accessOrder = true}}: every {{get}}/{{put}} of a key moves that entry to the **end** of the linked list (the "most recently used" position). The head of the list is the least recently used entry.
- The sequence: put a, b → [a, b]; get a → [b, a]; put c → [b, a, c]; after the put, {{removeEldestEntry}} sees size 3 > 2 → removes the head (b) → [a, c].
- {{keySet()}} iterates from oldest to newest, so it prints [a, c].

### Why the other options are wrong
- **[b, c]**: that is the result with {{accessOrder = false}} (insertion order), where get does not change position and a gets evicted.
- **[a, b, c]**: removeEldestEntry returns true above 2, so the eldest entry is evicted.
- **[c, a]**: iteration goes from least recently used to most recently used; it is not reversed.

> Senior tip: a LinkedHashMap LRU is **not thread-safe**, and in access-order mode even {{get}} is a write operation (it relinks the list), so wrapping it in {{synchronizedMap}} becomes a bottleneck. In production, use Caffeine (W-TinyLFU, a better hit rate than LRU, with TTL and metrics).`
  },
  "qz-collections-012": {
    "q": `You need the **top 100 best-selling products** from a stream of 50 million records (read sequentially, does not fit in memory). Which approach is correct and efficient?`,
    "options": [
      `A PriorityQueue min-heap holding at most 100 elements; when it exceeds 100, poll() the smallest. Time O(n log 100), memory O(100)`,
      `A PriorityQueue max-heap holding every record, then poll() 100 times`,
      `Put them into a TreeSet ordered by units sold, keeping at most 100 elements`,
      `A PriorityQueue min-heap of size 100; at the end, iterating with iterator() yields the list sorted in descending order`
    ],
    "explain": `**Correct answer: a min-heap of size K = 100.**

### Why it is correct
The min-heap holds the **100 largest elements seen so far**, and the heap root ({{peek()}}) is the smallest element in the current top:
~~~java
PriorityQueue<Item> pq = new PriorityQueue<>(Comparator.comparingLong(Item::sold));
for (Item it : stream) {
    pq.offer(it);
    if (pq.size() > 100) pq.poll();   // drop the smallest element
}
~~~
Each operation is O(log K) → O(n log K) overall, with only O(K) memory. You can optimise further: only offer when {{it.sold() > pq.peek().sold()}}.

### Why the other options are wrong
- **Full max-heap**: O(n) memory = 50 million objects, which does not fit in RAM.
- **TreeSet**: two products with the same number sold are treated as duplicates (compare = 0) and **lost**, unless you add a tie-breaker.
- **iterator() of PriorityQueue**: it walks the heap array order, which is **not** sorted order. You must poll() one by one (which yields ascending order) and then reverse.

> Senior tip: at distributed scale (many Kafka partitions), each node computes a local top-K and then you merge the K×N candidates. If you can accept approximation over unbounded data, use Count-Min Sketch + a heap (heavy hitters).`
  },
  "qz-collections-013": {
    "q": `You need to remove every order whose status is {{CANCELLED}} from an {{ArrayList<Order>}} (accessed by a single thread). Which approaches are **correct**? (Choose 2)`,
    "options": [
      `Iterate with for-each and call list.remove(o) when you hit a CANCELLED order`,
      `list.removeIf(o -> o.status() == Status.CANCELLED)`,
      `Use an explicit Iterator and call it.remove() when you hit a CANCELLED order`,
      `for (int i = 0; i < list.size(); i++) and when order i is cancelled, call list.remove(i)`,
      `list.stream().filter(o -> o.status() == Status.CANCELLED).forEach(list::remove)`
    ],
    "explain": `**Correct answer: {{removeIf}} and {{Iterator.remove()}}.**

### Why it is correct
- ArrayList's {{removeIf}} marks the elements to remove and then **compacts the array in a single pass**: O(n), clean and safe.
- {{Iterator.remove()}} removes the element just returned and updates the iterator's {{expectedModCount}}, so it does not cause a CME. However, each remove on an ArrayList shifts the array in O(n), so the total can be O(n²) when removing many elements.

### Why the other options are wrong
- **for-each + list.remove**: modifying the list directly desynchronises {{modCount}}, and the next {{next()}} throws {{ConcurrentModificationException}}.
- **index loop + remove(i)**: after a removal the following elements shift down one position while {{i}} still increments → you **skip** the element right after it (two adjacent cancelled orders result in only one being removed). It is only correct when iterating backwards from the end.
- **stream().forEach(list::remove)**: modifies the source while the stream is traversing it (a non-interference violation); ArrayList's spliterator checks modCount and throws a CME.

> Senior tip: in code review, treat "modifying a collection while iterating it" as a red flag. If you need to filter while keeping the original list, build a new list with {{stream().filter(...).toList()}}. For maps: {{map.entrySet().removeIf(e -> ...)}} or {{map.values().removeIf(...)}}.`
  },
  "qz-collections-014": {
    "q": `In code review you see a DFS algorithm (single-threaded) using {{Stack<Node>}}. You suggest replacing it with {{ArrayDeque<Node>}}. Which arguments are **correct**? (Choose 2)`,
    "options": [
      `Stack extends Vector, so every method is synchronized, paying for useless locking; ArrayDeque is not synchronized and is faster`,
      `ArrayDeque.push()/pop() operate at the head of the deque, so it works as a LIFO stack right away`,
      `ArrayDeque allows push(null) to act as a sentinel element`,
      `Iterating a Stack with for-each gives the same order as iterating an ArrayDeque pushed with the same data`,
      `ArrayDeque is thread-safe, so sharing it across threads later is safe`
    ],
    "explain": `**Correct answer: Stack's synchronization is wasted (ArrayDeque is faster) and ArrayDeque's push/pop is LIFO.**

### Why it is correct
- {{Stack extends Vector}}: every method is {{synchronized}}, and it also exposes List methods ({{add(index)}}, {{get(i)}}) that can break stack semantics. Stack's Javadoc recommends using a {{Deque}}.
- {{ArrayDeque}} is a circular buffer; push/pop at the head are O(1) amortized, it is cache-friendly, and it is faster than LinkedList (no node allocation).

### Why the other options are wrong
- **push(null)**: ArrayDeque **forbids null** (throws NPE) because null is used to signal an empty deque ({{poll()}} returns null).
- **Same iteration order**: the Stack (Vector) iterator goes from bottom to top (push order), while the ArrayDeque iterator used as a stack goes from top to bottom. Code that prints the stack will change order after the migration, so watch out.
- **Thread-safe**: ArrayDeque is not thread-safe. If you need to share it across threads, use {{ConcurrentLinkedDeque}} or {{LinkedBlockingDeque}}.

> Senior tip: similarly, {{Vector}}, {{Hashtable}} and {{StringBuffer}} are coarse-synchronized legacy classes; in new code prefer the unsynchronised variants, and when you need concurrency pick a structure from {{java.util.concurrent}} designed for it.`
  },
  "qz-collections-015": {
    "q": `What does the following code print?
~~~java
List<String> src = new ArrayList<>(List.of("a", "b"));
List<String> view = Collections.unmodifiableList(src);
List<String> copy = List.copyOf(src);
src.add("c");
System.out.println(view.size() + " " + copy.size());
~~~`,
    "options": [
      `2 2`,
      `3 2`,
      `3 3`,
      `Throws UnsupportedOperationException at src.add because src has been wrapped as unmodifiable`
    ],
    "explain": `**Correct answer: 3 2.**

### Why it is correct
- {{Collections.unmodifiableList(src)}} is a **read-only view**: it blocks writes through the view itself, but still reflects every change to the underlying list → size 3.
- {{List.copyOf(src)}} creates a **truly immutable copy** (a snapshot) → still 2. (If the input is already an immutable list from {{List.of}}/{{copyOf}}, copyOf may return it as is, without copying.)

### Why the other options are wrong
- **2 2**: the view is not a snapshot.
- **3 3**: copyOf is not linked to the original list.
- **UOE at src.add**: wrapping in unmodifiable does not take away the original list's ability to be written; only the view is blocked.

> Senior tip: when returning a collection from an API, {{unmodifiableList}} is enough only if you control the original list; if the original list came from a caller, you need {{List.copyOf}}. Note that {{List.copyOf}}/{{List.of}} **reject null** (NPE, even for {{contains(null)}}), whereas {{unmodifiableList}} accepts null.`
  }
});
