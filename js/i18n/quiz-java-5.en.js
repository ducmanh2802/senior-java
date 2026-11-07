/*
 * English translation of js/data/quiz-java.js — task T680. Format: js/core/i18n.js (content overlay).
 * ids: qz-core-021 qz-core-022 qz-core-023 qz-core-024 qz-collections-021 qz-collections-022 qz-collections-023 qz-collections-024 qz-modern-021 qz-modern-022 qz-modern-023 qz-modern-024 qz-concurrency-021 qz-concurrency-022
 */
App.i18n.content({
  "qz-core-021": {
    "q": `What does the following code print?
~~~java
class Base {
    String name = "base";
    String describe() { return "base:" + name; }
}
class Derived extends Base {
    String name = "derived";
    @Override
    String describe() { return "derived:" + name; }
}
// main:
Base b = new Derived();
System.out.println(b.name + " " + b.describe());
~~~`,
    "options": [
      `derived derived:derived`,
      `base base:base`,
      `base derived:derived`,
      `derived base:base`
    ],
    "explain": `**Correct answer: base derived:derived.**

### Two different "binding" rules
- A **field** (an object variable) is resolved by the **static type** of the reference variable, i.e. the type you declare ({{Base b}}). The compiler looks {{name}} up in {{Base}} and emits bytecode that reads exactly that field. Java has **no concept of overriding a field**: the same-named field in {{Derived}} is merely **hidden (hiding)**, and the real object contains **two** {{name}} fields — one from {{Base}}, one from {{Derived}} (both cost heap space).
- An **instance method** is resolved by the **dynamic type** of the actual object (dynamic dispatch through the class's method table) → the JVM runs the {{describe()}} of {{Derived}}. Inside that method, {{name}} was already compiled against the class that declares it ({{Derived}}), so it reads "derived".

~~~text
b ──> Derived object: [name(Derived)="derived"] + [name(Base)="base"]
      reading b.name      : by variable type (Base)    -> "base"
      calling b.describe(): by real object   (Derived) -> "derived:derived"
~~~

### Why the other options are wrong
- **derived derived:derived**: right for the method, wrong for the field; fields do not take part in polymorphism.
- **base base:base**: only correct if the method were {{static}}, {{final}} or {{private}} — those three are "hidden" by reference type, not overridden.
- **derived base:base**: reverses both rules.

> Senior tip: a real-world bug: two levels of the class hierarchy both declare an {{id}}/{{version}} field, code reading {{parentRef.id}} gets the stale value even though the subclass reassigned it, or an object silently carries two copies of the field. Prevent it by always making fields {{private}} + a getter (then there is no direct access left to mix up), and turn on the {{FieldHidesSuperclass}} check of ErrorProne/IDE. Note also: a hidden field makes heap dumps harder to read, because MAT shows two entries with the same name.`
  },
  "qz-core-022": {
    "q": `The following class does **not** compile. Which statements are **correct**? (Choose 2)
~~~java
public class Repo {
    void save(List<String> ids)  { /* ... */ }
    void save(List<Integer> ids) { /* ... */ }

    boolean isStringList(Object o) {
        return o instanceof List<String>;
    }
}
~~~`,
    "options": [
      `Simply changing both methods' parameters to List<?> makes the clash disappear`,
      `The line instanceof List<String> is a compile error: the element type does not exist at runtime, and Java 21 with pattern matching does not allow it either`,
      `Adding @SuppressWarnings("unchecked") makes javac stop reporting the error`,
      `The two save methods count as duplicates because after erasure both have the signature save(List) — javac reports "name clash ... same erasure"`
    ],
    "explain": `**Correct answer: {{instanceof}} with a generic type is always a compile error, and the two overloads clash because of erasure.**

### What erasure is and why it exists
Generics (added in Java 5) are implemented by **type erasure**: the compiler uses the types to check at compile time, then **deletes the type information** from the bytecode. {{List<String>}} and {{List<Integer>}} both become the raw {{List}}, and elements are read out as {{Object}} plus one implicit cast. The purpose is **binary compatibility**: code written before 2005 still runs against libraries that use generics and vice versa. Consequence: the JVM cannot ask "does this list contain Strings or Integers" about a normal {{ArrayList}} object.

### Why the two statements are correct
- {{instanceof}} checks the type **of the object that is running**. An {{ArrayList}} carries no element type, so {{o instanceof List<String>}} is a meaningless question (is an empty list "a List of String"?). javac blocks it; you can only write {{o instanceof List}} or {{o instanceof List<?>}}. Java 16+ adds pattern matching ({{o instanceof List l && l.size() > 0}}), which only helps **bind a variable**, it does not unlock element-type checks.
- In bytecode, the signature of both methods is {{save(Ljava/util/List;)V}}. Two methods with the same signature in one class is a **compile-time** error ("name clash: ... have the same erasure"), not a warning.

### The right way to fix it
Rename the methods ({{saveStrings}} / {{saveInts}}), or use a single generic method {{<T> void save(List<T> ids)}}, or {{List<? extends Number>}} if you want to accept both. If you genuinely need the element type at runtime, pass an extra {{Class<T>}} (type token), or have the caller declare a generic superclass and read the {{ParameterizedType}} through reflection.

### Why the other options are wrong
- **Change to {{List<?>}}**: {{List<?>}} is also erased to {{List}} → still the same signature, still a clash.
- **{{@SuppressWarnings("unchecked")}}**: this annotation only silences **warnings** (raw types, unchecked casts); it does not turn a compile error into valid code.

> Senior tip: the consequences of erasure are frequent follow-up questions: {{new T[10]}} is illegal, there is no {{List<String>.class}}, {{List<String>}} and {{List<Integer>}} share the same {{getClass()}}, and a raw {{List}} containing mixed types throws {{ClassCastException}} at the **read** site rather than at the **add** site — that "heap pollution" kind of bug takes hours to trace. Hence the team convention: no raw types, enable {{-Xlint:unchecked}} and treat warnings as errors in CI.`
  },
  "qz-core-023": {
    "q": `What does the following code print?
~~~java
Map<String, Integer> count = new HashMap<>();
count.put("cart", null);              // key exists, value not set yet
int a = count.get("cart");            // 1
int b = count.getOrDefault("views", 0);
System.out.println(a + " " + b);
~~~`,
    "options": [
      `Throws NullPointerException on line 1, the program prints nothing`,
      `prints "null 0"`,
      `prints "0 0"`,
      `Does not compile, because an Integer may not be assigned to an int`
    ],
    "explain": `**Correct answer: NullPointerException on the line that assigns {{int a}}.**

### Autoboxing and unboxing
{{int}} is a **primitive** (just a number, no methods). {{Integer}} is a **wrapper**: an object holding that number. **Autoboxing** means the compiler wraps an {{int}} into an {{Integer}} for you; **unboxing** means it calls {{intValue()}} to get the {{int}} back. The line {{int a = count.get("cart");}} compiles to {{int a = count.get("cart").intValue();}} — that is the dangerous part: if the value fetched is {{null}}, then {{null.intValue()}} throws {{NullPointerException}}.

### Why it is correct
- {{count.put("cart", null)}} creates a **valid** entry: the key "cart" does exist, only the value is {{null}}.
- {{count.get("cart")}} → {{null}}; unboxing {{null}} → NPE right on line 1, so {{println}} never gets to run and nothing is printed.
- {{getOrDefault("views", 0)}} is never reached because the program already died on line 1; on its own it is safe, because the key "views" is **absent** from the map → it returns {{0}}.
- The trap interviewers like to add: change it to {{int b = count.getOrDefault("cart", 0);}} and it **still throws NPE**. Per the specification, the default is used only when the map **does not contain the key**; here the key is present and the value is {{null}}, so {{getOrDefault}} returns {{null}}.

### Why the other options are wrong
- **prints "null 0"**: {{System.out.println(count.get("cart"))}} does print "null" (no unboxing, because it receives an {{Object}}), but here the value is coerced to {{int}} immediately at the assignment.
- **prints "0 0"**: Java does not map {{null}} to 0; only C/C++ pointers "treat 0 as nothing".
- **Does not compile**: assigning an {{Integer}} to an {{int}} has been perfectly legal since Java 5.

> Senior tip: this error is famous because the stack trace points at business code rather than at the place that read the database — for instance a nullable {{click_count}} column flowing into a {{Map<String,Integer>}} and then being assigned to an {{int}}, or an {{Integer}} in a DTO that becomes null after a serialize/migrate step. Living with it: keep the {{Integer}} type and check for null explicitly, or use {{Objects.requireNonNullElse(v, 0)}}; for counters use {{map.merge(k, 1, Integer::sum)}} (a key that is not present yet gets a fresh value and can never be null). A sensible team rule: **never** put null into a counting map.`
  },
  "qz-core-024": {
    "q": `What does the following code print? ({{MILLIS}} is a variable, not a constant)
~~~java
int MILLIS = 1000;
long ttlMillis = 30 * 24 * 60 * 60 * MILLIS;   // expected: 30 days expressed in ms
System.out.println(ttlMillis);
~~~`,
    "options": [
      `2592000000`,
      `0, because a value beyond the limit is treated as invalid`,
      `A compile error, because the expression exceeds the range of int`,
      `-1702967296`
    ],
    "explain": `**Correct answer: -1702967296.**

### The point to understand: the type of the expression, not the type of the receiving variable
Every operand ({{30}}, {{24}}, {{60}}, {{MILLIS}}) is an {{int}}, so **the whole computation runs in {{int}}**. Assigning the result to a {{long}} is only a **widening after the computation is already done** — it does not widen the intermediate range.
{{int}} uses 32 bits in **two's complement**, its maximum value is 2,147,483,647. The correct result of 30*24*60*60*1000 is 2,592,000,000, which is above that limit → the number **wraps around**: 2,592,000,000 − 2^32 = **−1,702,967,296**. Java defines this behaviour precisely (it is not undefined behaviour as in C/C++), and **no exception** is thrown.

~~~text
2,592,000,000 (math)  >  2,147,483,647 (Integer.MAX_VALUE)
wrap: 2,592,000,000 - 4,294,967,296 = -1,702,967,296   -> fits exactly into an int
~~~

### The correct ways to write it
- Put the letter {{L}} on the **first** operand: {{long ttl = 30L * 24 * 60 * 60 * 1000;}} (from there on, every operation is {{long}}).
- Use an API that already knows the units: {{TimeUnit.DAYS.toMillis(30)}} or {{Duration.ofDays(30).toMillis()}} — these methods compute in {{long}} and check for overflow.
- If you want the failure to "explode" as soon as it overflows (so a test catches it): {{Math.multiplyExact(a, b)}} throws {{ArithmeticException}}.

### Why the other options are wrong
- **2592000000**: only right if the multiplication ran in {{long}}; here {{long}} appears only at the assignment.
- **0**: Java does not saturate, and there is no sentinel value for numeric overflow.
- **A compile error**: javac does not evaluate overflow for an expression computed from variables; this is a **logic** error that runs silently.

> Senior tip: real bugs of this shape usually involve a TTL/expiry: an expiry that comes out **negative** makes every cache entry count as already expired (100% miss rate, the database absorbs all the traffic) or an OAuth token that "expires in 1970". The tell-tale sign: logs where {{expiresAt}} is absurdly smaller than {{now}}. In CI, enable the ErrorProne checks {{IntegerDivisionInfiniteLoop}}/{{BadShiftValues}} and the Sonar rule "Make sure this value fits into the type"; also add one test that computes the value with {{Duration}} and compares it against the expectation.`
  },
  "qz-collections-021": {
    "q": `A backing cache looks up by **object instance**: every request creates a new {{Token}}, and the app declares {{static final Map<Token, String> META = new HashMap<>();}} then calls {{META.put(token, meta)}}. Only the success path calls {{META.remove(token)}}; the failure path (exception) forgets to. After 6 hours, a heap dump shows millions of {{Token}} objects that nobody uses but that are still alive. Requirement: an entry must **disappear on its own** once the key object is no longer referenced anywhere else. Which JDK option satisfies this requirement?`,
    "options": [
      `IdentityHashMap, because the cache really does look up by instance, so comparing with == makes sense`,
      `WeakHashMap, because keys are held through weak references, so an entry drops out on its own once the cache is the only thing still referencing the key`,
      `ConcurrentHashMap, because it cleans up "weak" entries by itself on every GC cycle`,
      `Collections.synchronizedMap(new HashMap<>()), because synchronisation helps the GC notice entries that are no longer used`
    ],
    "explain": `**Correct answer: {{WeakHashMap}}.**

### The three kinds of reference in the JDK (the basis for understanding this question)
- **Strong reference** — the ordinary kind: a {{Map<Token, String>}} holds its keys by strong reference, so the GC is **not allowed** to reclaim them even though the business code has already "forgotten" those objects. That is exactly the leak in the scenario above.
- **SoftReference** — cleared only when the JVM is about to run out of memory; suits a large cache that should "shrink itself" (but it causes constant GC — see the question about a 2 GB {{SoftReference}} cache).
- **WeakReference** — cleared **as soon as** no other strong reference points to the object.
- **PhantomReference** — used to learn that an object has already been reclaimed, for releasing native memory.

### Why {{WeakHashMap}} is correct
{{WeakHashMap}} wraps every key in a {{WeakReference}} and receives notifications from the {{ReferenceQueue}} when a key is collected by the GC, then removes the corresponding entry. Result: the cache no longer pins objects — a key "lives" for exactly as long as the business code still uses it.
Two limits you must be able to state in an interview:
1. The cleanup is **lazy**: an entry is only removed when you perform an operation on the map ({{get}}/{{put}}/{{size}}). No GC thread cleans actively, so "dead heap" can survive until the next access.
2. **The value must not reference the key back** (the Javadoc warns about this explicitly): if the {{String meta}} / value object holds a reference to the {{Token}}, the key always keeps one strongly reachable path through the entry → the entry is never cleared.
3. It is **not thread-safe** and has **no bound** on capacity.

### Why the other options are wrong
- **{{IdentityHashMap}}**: it differs by using {{==}} instead of {{equals}} for keys, but it still holds keys by **strong reference** → the leak stays exactly the same.
- **{{ConcurrentHashMap}}**: strong on concurrency, but it has no notion of a "weak entry"; for a weak or expiring cache you need Caffeine ({{weakKeys()}}, {{expireAfterAccess()}}).
- **{{synchronizedMap}}**: the {{synchronized}} keyword only prevents races, it does not affect GC reachability.

> Senior tip: in a real service, prefer **Caffeine** (bounded number of entries + TTL + stats + {{weakKeys}}/{{weakValues}}) over {{WeakHashMap}}, because {{WeakHashMap}} gives you exactly one mechanism, "do not hold the object", while capacity and hit-rate stay beyond your control — and because cleanup is lazy, its {{size()}} is only an estimate at the moment you call it. If you still want to stay inside the JDK: make the cache an **instance field** with a {{clear()}} tied to the lifecycle, do not make it {{static}}.`
  },
  "qz-collections-022": {
    "q": `What does the following code print?
~~~java
Map<String, Integer> hits = new HashMap<>();
hits.put("home", 1);
hits.merge("home", 5, Integer::sum);
hits.merge("cart", 3, Integer::sum);
hits.merge("home", 7, (oldValue, newValue) -> null);
System.out.println(hits);
~~~`,
    "options": [
      `{home=6, cart=3}`,
      `{home=13, cart=3}`,
      `{cart=3}`,
      `{cart=3, home=0}`
    ],
    "explain": `**Correct answer: {{cart=3}}.**

### What {{Map.merge}} does (the part most users leave out)
{{merge(key, newValue, remappingFunction)}} has three branches, determined by the state of the key:
1. The key **is not present yet** (or its current value is {{null}}): {{newValue}} is stored directly; the **remapping function is not called**.
2. The key **already has a value that is not null**: {{remappingFunction.apply(oldValue, newValue)}} is called and its result is stored.
3. The result of the remapping function is {{null}}: the key is **removed from the map** — this is specified behaviour, not a side effect.
{{newValue}} must not be {{null}} (if it is, {{merge}} throws {{NullPointerException}}).

### Line by line
- {{put("home", 1)}} → {{home=1}}.
- {{merge("home", 5, Integer::sum)}}: key present → {{1 + 5}} = 6 → {{home=6}}.
- {{merge("cart", 3, Integer::sum)}}: key absent → 3 is stored, the function never runs → {{cart=3}}.
- {{merge("home", 7, (o, n) -> null)}}: the function returns {{null}} → **home is removed**.
Exactly one entry is left, so the printed result does not depend on the iteration order of {{HashMap}}.

### Why the other options are wrong
- **{{home=6, cart=3}}**: stops at step 2, forgetting that the remapping function returns {{null}} in the last step.
- **{{home=13, cart=3}}**: treats merge as "unconditional accumulation" (1+5+7) and knows nothing about branch 3.
- **{{cart=3, home=0}}**: assumes that returning {{null}} means storing 0; merge **removes** the entry, it does not insert 0.

> Senior tip: the tidiest concurrency-safe counter is {{hits.merge(path, 1, Integer::sum)}}; on a {{ConcurrentHashMap}} that operation is atomic per key, whereas {{map.put(k, map.get(k) + 1)}} is a read-modify-write and loses updates when two threads increment at the same time. Going the other way, branch 3 is a trap: a conditional lambda that returns {{null}} **deletes the record** instead of "leaving it unchanged", so if all you want is to delete, call {{remove}} explicitly and read any {{merge}} with a complicated lambda very carefully in code review.`
  },
  "qz-collections-023": {
    "q": `What does the following code print?
~~~java
Comparator<Integer> ascending = (a, b) -> a - b;
Integer[] ids = { Integer.MAX_VALUE, -1 };
System.out.println(ascending.compare(ids[0], ids[1]) < 0);
~~~`,
    "options": [
      `true: the comparator claims that 2147483647 is smaller than -1, which means any list sorted with it can end up in the wrong order`,
      `false: because a - b always gives the correct difference for integers`,
      `Compile error: you are not allowed to use the minus sign on two Integers`,
      `Throws ArithmeticException because the subtraction goes beyond the int range`
    ],
    "explain": `**Correct answer: {{true}} — the comparator gives a wrong answer.**

### The Comparator contract
{{compare(a, b)}} must return a **negative number** if a comes before b, **0** if they are equal, and a **positive number** if a comes after. Authors like to "optimise" this into {{a - b}} because they assume the difference carries the right sign.

### Where it breaks: {{int}} overflow, and Java wrapping silently
{{Integer.MAX_VALUE - (-1)}} is 2,147,483,648 mathematically, which is larger than {{Integer.MAX_VALUE}} (2,147,483,647). {{int}} has 32 bits, so the result **wraps around** to {{Integer.MIN_VALUE}} (-2,147,483,648), i.e. a **negative** number. Therefore {{compare(MAX, -1) < 0}} is {{true}}: the comparator declares the largest positive number to be smaller than -1.
{{a - b}} is also syntactically valid because {{Integer}} is **unboxed** to {{int}} before the subtraction — no compile error, no exception: Java defines overflow as wrapping, and only {{Math.subtractExact}} throws {{ArithmeticException}}.

### Real-world consequences
- {{Arrays.sort}}/{{List.sort}} with a comparator that "lies" returns a list that **looks** sorted but is wrong for pairs of far-apart values; this kind of bug shows up very slowly, because small test data is not enough to overflow.
- TimSort checks transitivity and can throw {{IllegalStateException: Comparison method violates its general contract!}} for an inconsistent comparator.
- {{TreeMap}}/{{TreeSet}} depend entirely on the comparator, so an element can be placed on the wrong branch and {{get}}/{{contains}} return the wrong result.

### The correct way to write it
{{Integer.compare(a, b)}} (compares with relational operators, no subtraction), or {{Comparator.<Integer>naturalOrder()}}, or the field form {{Comparator.comparingInt(Order::getQuantity)}}. For distances/epoch millis use {{Long.compare}}.

> Senior tip: this is a classic code-review finding; always inspect {{-}}/{{+}} inside comparator lambdas, especially when comparing {{timestamp}}, {{id}} or {{amount}} (large values). Tests should include extreme pairs: {{Integer.MAX_VALUE}} with {{-1}}, {{Long.MIN_VALUE}} with {{1}}. Effective Java (Item 14) states exactly this: "avoid using subtraction in comparators".`
  },
  "qz-collections-024": {
    "q": `A service pushes audit events into an {{ArrayBlockingQueue}} of capacity 10,000 (currently **full**). The producer runs on the HTTP request thread and is **not allowed** to block for more than 200 ms. Which statements are **correct**? (Choose 2)`,
    "options": [
      `offer(e) on a full queue waits until there is room and only then returns true`,
      `add(e) on a full queue returns false, exactly like offer(e)`,
      `put(e) blocks the thread until there is room, and that thread can be interrupted while it waits`,
      `poll() on an empty queue throws NoSuchElementException`,
      `offer(e, 200, TimeUnit.MILLISECONDS) returns false if there is still no room after 200 ms, and throws no exception`
    ],
    "explain": `**Correct answer: {{put}} blocks (and is interruptible); the {{offer}} overload with a timeout returns {{false}} when the time is up.**

### What a {{BlockingQueue}} is
It is a {{Queue}} whose operations have **waiting semantics**: the producing side and the consuming side do not have to poll or lock by themselves. {{ArrayBlockingQueue}} is a bounded buffer (capacity fixed at construction time) that uses one shared lock for head and tail.

### The behaviour table you must know ("when full" / "when empty")
~~~text
add(e)        : throws IllegalStateException when full     |  element()  throws NoSuchElementException when empty
offer(e)      : returns false at once when full (no wait)  |  peek()     returns null when empty
offer(e,t,u)  : waits at most t, returns false on timeout  |  poll()     returns null when empty
put(e)        : waits forever until there is room (interruptible) |  take() waits forever until an element arrives (interruptible)
~~~

### Why the two statements are correct
- {{put}}: this is real **backpressure** — the producing thread stands still until a consumer frees a slot; because it waits on a {{Condition}}, {{Thread.interrupt()}} wakes it up and throws {{InterruptedException}}.
- {{offer(e, 200, MILLISECONDS)}}: waits with a bound and then **reports through its return value**, it throws no exception — that matches the "must not block for more than 200 ms" constraint in the question (in practice, if you want to be sure of ≤200 ms even when time was already spent earlier, use the non-waiting {{offer(e)}} and handle {{false}} yourself).

### Why the remaining statements are wrong
- **{{offer}} waits and then returns true**: the single-argument {{offer(e)}} **never waits**; only the overload with a timeout waits.
- **{{add}} returns false**: {{add}} inherits the {{Collection.add}} contract "always succeeds", so when the queue is full it **throws** {{IllegalStateException}} — this error usually explodes in production instead of staying silent.
- **{{poll}} throws an exception**: that describes {{remove()}}; {{poll}} is designed to return {{null}}, and because {{null}} is forbidden in a {{BlockingQueue}}, {{null}} always means "the queue is empty".

> Senior tip: choose the when-full policy consciously and **measure** it: {{offer}} + a "dropped events" counter (data loss but latency preserved), spilling to disk/DB, or {{CallerRunsPolicy}} when going through an executor (the producer suddenly runs the task itself — soft backpressure). Do not {{put}} without a bound on an HTTP thread: one slow consumer (Kafka lag, a stuck database) turns into the entire request pool standing and waiting, and the symptom is throughput dropping to 0 while CPU stays low and the thread dump is full of WAITING threads on a {{Condition}}.`
  },
  "qz-modern-021": {
    "q": `Data read from a customer's file contains Unicode whitespace at the beginning of the line ({{\\u3000}} — IDEOGRAPHIC SPACE). What does the following code print?
~~~java
String raw = "\\u3000\\torder-42  ";
boolean same = raw.trim().equals(raw.strip());
System.out.println(same + " | " + raw.trim().length() + " | " + raw.strip().length());
~~~`,
    "options": [
      `true | 8 | 8`,
      `false | 11 | 8`,
      `false | 10 | 8`,
      `false | 10 | 11`
    ],
    "explain": `**Correct answer: {{false | 10 | 8}}.**

### Two APIs, two definitions of "whitespace"
- {{trim()}} (Java 1): cuts characters off both ends as long as their code is **{{<= U+0020}}**, that is only {{space}}, {{\\t}}, {{\\n}}, {{\\r}} and ASCII control characters. When it meets {{\\u3000}} (code 12288) it **stops immediately**.
- {{strip()}} (Java 11): cuts according to **{{Character.isWhitespace(codePoint)}}**, which extends to Unicode whitespace ({{\\u3000}}, {{\\u2003 EM SPACE}}…). {{isBlank()}} uses exactly this definition too: for a string containing only {{\\u3000}}, {{isEmpty()}} is {{false}} but {{isBlank()}} is {{true}}.
- A {{String}} in Java is an array of **UTF-16 code units**, so {{\\u3000}} (which lies inside the BMP) counts as **1** character; only characters outside the BMP (emoji) count as 2.

### Counting, to eliminate the wrong options
{{raw}} has 12 code units: {{\\u3000}}, {{\\t}}, {{"order-42"}} (8), 2 {{space}}.
- {{trim()}}: the first character is {{\\u3000}} → nothing can be cut at the front; the 2 trailing {{space}} are cut → what remains is {{\\u3000\\torder-42}} = **10**.
- {{strip()}}: cuts {{\\u3000}} and {{\\t}} at the front and the 2 {{space}} at the end → what remains is {{"order-42"}} = **8**.
- The two results differ → {{equals}} = {{false}}.

### Why the other options are wrong
- **{{true | 8 | 8}}**: credits {{trim}} with the Unicode capability of {{strip}} — this is the most common mix-up, because "both names mean the same thing".
- **{{false | 11 | 8}}**: counts {{\\u3000\\t}} as 3 code units, or assumes the 2 trailing {{space}} survived.
- **{{false | 10 | 11}}**: assumes {{strip}} only cuts ASCII {{space}} and not {{\\t}}.

> Senior tip: the real trap is one level nastier: {{\\u00A0}} (NBSP — the character Excel/Word/Google Docs like to insert) is **not** whitespace according to {{Character.isWhitespace}}, so **both {{trim}} and {{strip}} leave it alone** — the string looks identical when printed, yet {{equals}}/{{HashMap.get}} do not match. The standard way to normalise incoming data:

~~~java
String normalize(String v) {
    String s = v.replace('\\u00A0', ' ').strip();   // turn NBSP into an ASCII space, then strip
    return Normalizer.normalize(s, Normalizer.Form.NFC);  // unify accent composition (precomposed vs decomposed)
}
~~~

When investigating this kind of bug, do not print the string — print {{s.codePoints()}} to see the real code of every character.`
  },
  "qz-modern-022": {
    "q": `What does the following code print? (Java 17)
~~~java
String query = """
    SELECT *
    FROM orders
    """;
System.out.print(query.length());
~~~`,
    "options": [
      `20`,
      `21`,
      `25`,
      `29`
    ],
    "explain": `**Correct answer: 21.**

### How a text block is compiled into a string (three rules are enough to work it out yourself)
A text block (formal since Java 15) lets you write multi-line strings with **three consecutive double quotes**, with no manual concatenation. javac applies three transformations **to the source**:
1. After the opening {{"""}} there may only be whitespace and then a line break; that line break does **not** go into the string.
2. **Incidental indentation**: the JVM measures the leading indentation of *each content line* **and of the line holding the closing {{"""}}**, takes the **minimum**, then removes exactly that many characters from the front of every line. Here all three lines are indented by 4 → each line loses 4 spaces.
3. **Every content line keeps its own line break** — including the last one: because the closing {{"""}} sits on a line of its own, there is a line break right before it, and that line break **is counted as part of the string**.

### Adding it up
~~~text
SELECT *        ->  8 characters
line break      ->  1
FROM orders     -> 11 characters
line break      ->  1
total           -> 21
~~~

### Why the other options are wrong
- **20**: forgets the line break before the closing {{"""}}. That result is correct if you place the closing {{"""}} right at the end of the {{FROM orders}} line, or terminate the last line with {{\\}} (the line-continuation escape).
- **25**: removes the indentation of only one line (12 + 1 + 11 + 1).
- **29**: removes no indentation at all: line 1 is 12 characters long, line 2 is 15, plus the two line breaks.

> Senior tip: two things commonly used along with it: {{stripTrailing()}} (Java 15), which removes all trailing whitespace when you do not want the extra line break, and {{formatted(args)}} to parameterise the template. To **keep** a space at the end of a line, add {{\\s}} before the line break, because trailing spaces are dropped by default. For SQL inside a text block: always keep the {{?}} placeholder and pass values through a {{PreparedStatement}}, never interpolate user variables into the string — a text block does not make SQL injection any harder.`
  },
  "qz-modern-023": {
    "q": `{{keyword}} may be {{null}} (the user left the search box empty). Which lines do **not** throw an exception at runtime? (Choose 3)
~~~java
String keyword = request.param("q");            // may be null

Optional<String> a = Optional.ofNullable(keyword);
Optional<String> b = Optional.of(keyword);
int len1 = keyword.length();
Optional<String> c = Optional.ofNullable(keyword).map(String::trim);
boolean has = Objects.nonNull(keyword);
~~~`,
    "options": [
      `The line assigning a is valid: ofNullable is designed to accept null`,
      `The line assigning b is valid: Optional will hold an empty value by itself when keyword is null`,
      `The line assigning c throws no exception because map only runs when a value is present`,
      `The line len1 throws no exception because length() exists on every String`,
      `The line has throws no exception`
    ],
    "explain": `**Correct answer: {{a}}, {{c}} and {{has}} — the three lines that use {{ofNullable}}, {{map}} on an empty Optional, and {{Objects.nonNull}}.**

### Why Optional exists
{{Optional<T>}} is a wrapper that says "the result may be **absent**", which forces the caller to handle the missing case instead of receiving {{null}}. It has only two states: it holds a value that is **not null**, or it is empty.

### Why the three lines are safe
- {{Optional.ofNullable(keyword)}}: this is precisely the API meant for a value that may be {{null}}; {{null}} → {{Optional.empty()}}.
- {{Optional.ofNullable(keyword).map(String::trim)}}: on an **empty** Optional, {{map}}/{{filter}}/{{ifPresent}} are no-ops — the inner function is **never called**, so {{String::trim}} never runs against {{null}}. This is "lazy" in the sense of a pipeline: only the part that is present is acted upon.
- {{Objects.nonNull(keyword)}}: a static method that takes an {{Object}} and only compares it with {{null}} — it dereferences nothing.

### Why the two lines throw an exception
- {{Optional.of(null)}} throws **{{NullPointerException}} right at the line that creates the Optional** (the {{Objects.requireNonNull}} contract). The idea "Optional will hold an empty value by itself" is wrong: it has **no** "holds null" state. The trap here is that the exception happens **at build time**, not when you call {{get()}}/{{isPresent()}}, so the stack trace makes it look as if null-checking code itself threw an NPE.
- {{keyword.length()}} is a direct dereference of {{null}} → {{NullPointerException}}.

> Senior tip: at system boundaries (HTTP parameter, nullable column, RPC result) convert {{null}} into an {{Optional}} **once** and then work with the {{Optional}}: {{Optional.ofNullable(v).map(...).orElse("")}} or {{.orElseThrow(() -> new BadRequestException("q is missing"))}}. Avoid three anti-patterns: {{Optional.of}} on a value that may be null; {{Optional}} as a **method parameter** or an **entity field** (it is not {{Serializable}}, it costs an extra object, and it does not work with JPA or common DTO tooling); and {{ifPresent(x -> ...)}} followed by {{else throw}} — {{ifPresentOrElse}} or {{orElseThrow}} are clearer to read. {{Objects.requireNonNullElse(keyword, "")}} is also a compact choice when you do not need an Optional.`
  },
  "qz-modern-024": {
    "q": `What does the following code print? (Java 21)
~~~java
Stream.iterate(1, x -> x < 8, x -> x * 2)
      .forEach(x -> System.out.print(x + " "));
~~~`,
    "options": [
      `1 2 4 8 (each element is emitted and only then checked against the condition)`,
      `2 4 (the seed is passed through next before being emitted)`,
      `Prints forever: 1 2 4 8 16 32 ... because iterate always creates an infinite stream`,
      `1 2 4 (each number comes with one space, so there is a trailing space)`
    ],
    "explain": `**Correct answer: {{1 2 4}} (with a trailing space).**

### What the three arguments of {{Stream.iterate}} mean
The overload {{iterate(seed, hasNext, next)}} was added in **Java 9**; the Java 8 version only had {{iterate(seed, f)}} and always created an **infinite** stream ({{limit(n)}} was mandatory). The contract of the three-argument form: {{seed}} is **checked against the condition first**, and is emitted only if it passes; then {{next}} produces a new value, and that new value is again checked before being emitted — repeat until the condition returns {{false}}.

### Step by step
~~~text
x = 1 : hasNext(1) = 1 < 8  -> true   -> emit 1
x = 2 : hasNext(2)          -> true   -> emit 2
x = 4 : hasNext(4)          -> true   -> emit 4
x = 8 : hasNext(8) = 8 < 8  -> false  -> NOT emitted, stop
~~~
Because {{forEach}} prints {{x + " "}}, the real output is "{{1 2 4 }}" — one trailing space, a detail often asked about to check whether you read carefully.

### Why the other options are wrong
- **{{1 2 4 8}}**: assumes the condition runs **after** the element is emitted (a {{do ... while}} shape); here it runs before, so 8 is excluded.
- **{{2 4}}**: the {{seed}} is not "skipped"; it is the first element that gets considered.
- **Prints forever**: only true for the two-argument overload; here {{hasNext}} is the stopping bound.

> Senior tip: {{hasNext}} is not guaranteed to return {{false}} at some point. For example {{Stream.iterate(0L, x -> x != 100L, x -> x + 3L)}} steps 0, 3, 6... and **never** reaches 100, so the stream runs forever; conditions of the "{{!=}}" kind, or ones that rely on numeric overflow, are a source of puzzling production hangs. The safe route: always add {{limit(n)}} as a "circuit breaker", or use {{IntStream.range}}/{{IntStream.rangeClosed}} when you know the count in advance. {{iterate}} also **does not parallelise well** (each element depends on the previous one, so the spliterator cannot estimate a size to split on); if you need {{parallel}}, switch to {{range}}/{{generate}}.`
  },
  "qz-concurrency-021": {
    "q": `The application starts 3 adapters in parallel and must then wait for all 3 to be ready before it accepts traffic. One adapter is missing configuration, so its {{connect()}} throws an exception. What happens?
~~~java
CountDownLatch ready = new CountDownLatch(3);
for (Adapter a : adapters) {
    pool.submit(() -> {
        try {
            a.connect();                 // throws IllegalStateException
            ready.countDown();
        } catch (Exception e) {
            log.error("adapter fail", e);
        }
    });
}
ready.await();
markReady();
~~~
`,
    "options": [
      `markReady() runs earlier than expected, because await() only needs the count to have dropped by 1 to return`,
      `The pool forwards the exception to the main thread, so await() is cancelled along with it`,
      `await() waits 60 seconds and then returns, because every latch has a default timeout`,
      `await() hangs forever: the failing adapter never calls countDown, so the count stops at 1 and never reaches 0`
    ],
    "explain": `**Correct answer: await() hangs forever because the count never reaches 0.**

### How CountDownLatch works
A latch is a **decrement-only** counter: {{countDown()}} subtracts 1, {{await()}} blocks until the count reaches 0 and then wakes every thread that is waiting. The count cannot be raised again, so a latch is used **once**. The only question it answers is "have enough of the N events happened yet?".

### Step by step
~~~text
count = 3
adapter A ok  -> countDown -> 2
adapter B ok  -> countDown -> 1
adapter C     -> connect() throws an exception -> enters catch, logs, does NOT countDown -> count still 1
main          -> await(): count != 0 -> park, nothing wakes it -> hangs forever
~~~
The bug is that {{countDown()}} sits **inside the try, after a statement that can throw**. It has to run on **every exit path** of the task:
~~~java
try { a.connect(); }
catch (Exception e) { log.error("adapter fail", e); }
finally { ready.countDown(); }   // runs even when throwing, even on an early return
~~~

### Why the other options are wrong
- **await returns as soon as the count drops by 1**: that confuses it with {{Semaphore}}/{{CyclicBarrier}}; {{await()}} only returns when the count **equals 0**.
- **The pool hands the exception to main**: {{submit()}} wraps the exception inside a {{Future}}; if nobody calls {{future.get()}}, the exception **never surfaces** — that is the second trap of this snippet (the error gets swallowed, only the log line is left).
- **There is a default timeout**: the no-argument {{await()}} waits indefinitely; to have a bound you must call {{await(10, TimeUnit.SECONDS)}}, then check {{ready.getCount()}} and fail fast.

> Senior tip: two rules: (1) {{countDown()}} always belongs in {{finally}}; (2) startup code must not contain any {{await()}} without a timeout — a hung main thread keeps the application from ever reaching {{markReady()}}, so the Kubernetes readiness probe stays red forever while the process is still "alive" and nobody restarts it. The signature when debugging: a thread dump shows main in the WAITING state inside {{CountDownLatch$Sync}}. For the problem "start N components", {{CompletableFuture.allOf(...)}} or {{invokeAll(...)}} are better than a latch, because you get the exception of **each** task and can report the configuration error right at boot.`
  },
  "qz-concurrency-022": {
    "q": `A job runs every 60 seconds to clean up expired orders. At 03:00 the database drops the connection once and {{findExpired()}} throws an exception; from then on the job **never runs again**, and the scheduler logs nothing either. Why?
~~~java
ScheduledExecutorService ses = Executors.newSingleThreadScheduledExecutor();
ScheduledFuture<?> sf = ses.scheduleAtFixedRate(
    () -> orders.findExpired().forEach(o -> rebuild(o)),
    0, 60, TimeUnit.SECONDS);
~~~
`,
    "options": [
      `Only that one run failed; the later runs are still scheduled normally, because the period is still in effect`,
      `The task is removed from the schedule permanently: every scheduled run after a run that let an exception escape is cancelled, while the exception stays unread inside the ScheduledFuture`,
      `The worker thread died, so the whole executor is disabled; every other task also fails to be submitted`,
      `The JDK retries a failing task 3 times with backoff before cancelling the schedule`
    ],
    "explain": `**Correct answer: the exception removes the task from the schedule permanently, and nobody reads the exception, so everything stays silent.**

### The mechanism
The Javadoc of {{ScheduledExecutorService}} states it plainly: "If any execution of the task encounters an uncaught exception, **subsequent executions are suppressed**". That means:
1. An exception escaping the {{Runnable}} → the {{ScheduledFuture}} completes in the **exceptionally** state.
2. The periodic task is dropped from the executor's schedule queue — there is no second run, unconditionally.
3. The exception is printed nowhere, because it is **stored inside the Future**. To look at it you have to call {{sf.get()}} (which throws {{ExecutionException}}); if you never call it, the exception just sits there until it is GC'd.
4. The thread's {{UncaughtExceptionHandler}} also does **not** run, because the exception was already caught by the executor and never propagated to the {{Thread}}.

### The fix
Wrap the **whole** task body in a try/catch on {{Throwable}} so that nothing can escape:
~~~java
ses.scheduleAtFixedRate(() -> {
    try { rebuildExpiredOrders(); }
    catch (Throwable t) {                 // Throwable, not Exception
        log.error("job failed", t);       // Errors such as NoClassDefFoundError get swallowed too
        metrics.increment("jobs.expired_rebuild.failures");
    }
}, 0, 60, TimeUnit.SECONDS);
~~~
You can turn this into a wrapper shared by every job ({{Runnable guarded = SafeRunner.wrap(task, name)}}) so that nothing depends on the discipline of each developer.

### Why the other options are wrong
- **Only one run is lost**: wrong — **all** later runs are lost.
- **The whole executor dies**: the worker thread is recreated by the pool and keeps serving other tasks; only the task that threw has its schedule cancelled.
- **Automatic 3 retries**: the executor has no notion of retrying, that is something you have to write yourself.

> Senior tip: compare the two to avoid confusion: {{java.util.Timer}} is even worse — a single exception in a {{TimerTask}} kills the **whole Timer**, and every other task loses its schedule too; while Spring {{@Scheduled}} wraps the call in try/catch and logs ERROR by default, so later runs still happen. How to recognise it outside production: a job that "disappears in silence" — which is why every periodic job needs a **heartbeat metric** ({{last_success_timestamp}}) and an alert when it goes stale for more than 2 periods; or inspect JMX {{java.util.concurrent:type=ScheduledThreadPoolExecutor}} and see {{CompletedTaskCount}} standing still. Do not use {{sf.isDone()}} as your primary liveness signal: after a failure the future really does turn to done, but a job that merely runs slowly can also make you misread that flag.`
  }
});
