/*
 * English translation of js/data/quiz-java.js — task T749. Format: js/core/i18n.js (content overlay).
 * ids: qz-core-025 qz-core-026 qz-collections-025 qz-collections-026 qz-modern-025 qz-modern-026 qz-modern-027 qz-modern-028 qz-concurrency-025 qz-concurrency-026 qz-jvm-025 qz-jvm-026 qz-core-027 qz-modern-029 qz-concurrency-027
 */
App.i18n.content({
  "qz-core-025": {
    "q": `What does the following code print?
~~~java
String a = "java";
String b = new String("java");
String c = b.intern();
System.out.println((a == b) + " " + (a == c) + " " + (a.equals(b)));
~~~`,
    "options": [`true true true`, `false true true`, `false false true`, `true false true`],
    "explain": `**Correct answer: false true true.**

### What is actually in memory
{{==}} on objects compares **references** (are these two variables pointing at the very same object?), not content. {{equals}} compares **content** (do the two objects hold the same characters?). Two further pieces you need:
- The **String pool** (intern pool): a table of one canonical String object per distinct literal value. Every literal in your code, such as {{"java"}}, is resolved at class-loading time to an object in that pool, so two classes that both write {{"java"}} share one object.
- {{new String(...)}} always allocates a **fresh object on the heap**, even when an identical value already sits in the pool. It is the only way to force a duplicate.

So here: {{a}} points at the pooled object, {{b}} points at a different object that happens to carry the same characters, hence {{a == b}} is {{false}}. {{b.intern()}} looks the value up in the pool and returns the pooled instance — which is exactly the object {{a}} refers to — so {{a == c}} is {{true}}. {{a.equals(b)}} compares characters, so {{true}}.

### Why the other options are wrong
- **true true true**: {{new String}} never returns a pooled object, so {{a == b}} cannot be true.
- **false false true**: this assumes {{intern()}} gives you back the same (non-pooled) object; in fact it returns the pool's copy, and after that first call the value is pooled, so {{a == c}} is true.
- **true false true**: swaps the two cases — it treats {{new String}} as pooled and {{intern()}} as a fresh object, which is exactly backwards.

> Senior tip: {{intern()}} pays off when you read the same handful of values over and over (codes, currency, state names) from a file or the network: you save heap and you can compare with {{==}}, which is a single pointer check instead of a character scan. Interning *every* string you parse is the opposite — you burn CPU on pool lookups and inflate the pool. Since Java 7 the pool lives on the normal heap and is garbage-collected, so it no longer leaks the way it did when it sat in PermGen (Java 6, where the pool was bounded by {{-XX:MaxPermSize}} and could not be reclaimed).`
  },
  "qz-core-026": {
    "q": `What does the following code print?
~~~java
String s = "a" + "b" + 1 + 2;
System.out.println(s + " " + ("ab" + (1 + 2)));
~~~`,
    "options": [`ab12 ab3`, `ab3 ab3`, `ab12 ab12`, `ab3 ab12`],
    "explain": `**Correct answer: ab12 ab3.**

### Why that is the result
{{+}} is overloaded: with a String operand it means **concatenation**, with two numbers it means **addition**. Java evaluates a chain of the same operator **left to right**, and each step decides the meaning from the operand types it sees at that moment:
- {{"a" + "b"}} -> both are Strings -> {{"ab"}}.
- {{"ab" + 1}} -> left side is a String -> the {{int}} 1 is converted with {{String.valueOf}} -> {{"ab1"}}.
- {{"ab1" + 2}} -> same -> {{"ab12"}}.
Once the chain has become a String, every following number is *appended*, never *added*. That is why {{1 + 2}} is not 3 here: by the time the compiler reaches {{+ 2}} the left operand is already {{"ab1"}}.
- In the second expression the parentheses force {{(1 + 2)}} to be evaluated first, while both operands are still {{int}} -> {{3}}, then {{"ab" + 3}} -> {{"ab3"}}.

### Why the other options are wrong
- **ab3 ab3**: ignores the left-to-right rule and pretends the numbers in the first expression are also summed.
- **ab12 ab12**: forgets that parentheses win, so {{(1 + 2)}} really is addition.
- **ab3 ab12**: exactly the reverse of what the language does.

> Senior tip: the compiler folds constant Strings at compile time (constant folding), so {{"a" + "b" + "c"}} costs one object and no intermediate garbage. When you build a String in a loop, each iteration would otherwise allocate a new object and copy everything so far — use {{StringBuilder}}, or {{String.join}}/{{Collectors.joining}}. From Java 9 runtime concatenation goes through {{StringConcatFactory}} ({{invokedynamic}}), which the JVM optimises for you, so hand-tuning is usually unnecessary. In a real interview, also mention the classic bug this question is built on: {{log("count=" + a + b)}} prints {{count=34}} instead of {{count=7}} — fix it with {{log("count=" + (a + b))}}.`
  },
  "qz-collections-025": {
    "q": `When does a HashMap resize, and what does that cost?`,
    "options": [
      `When size > capacity * loadFactor (default 0.75); it allocates a table twice as large, rehashes every entry, O(n)`,
      `When a bucket is full, it appends a new bucket at the end of the table`,
      `When one bucket holds more than 8 elements, it resizes immediately`,
      `It never resizes if you use new HashMap<>(n)`
    ],
    "explain": `**Correct answer: resize when size > capacity * loadFactor.**

### The mechanism, step by step
A {{HashMap}} is an array of **buckets** (the *table*) whose length is always a power of two, plus a linked list — or, when the list gets long, a red-black tree — hanging off each bucket. An entry's bucket comes from {{(hashCode - 1) & (table.length - 1)}}, i.e. the low bits of the hash. Two consequences you should be able to state out loud:
- Because the index is computed with a mask on the *length*, changing the length changes the bucket of almost every key. That is why growth is not "add one slot" but a full rebuild.
- The **load factor** (default **0.75**) is the allowed fill ratio: it is the tuning knob that trades memory (a low factor = fewer collisions, more wasted slots) against CPU (a high factor = more collisions, longer chains).

Default table capacity is 16, so the **threshold** is 16 * 0.75 = 12. When the {{size}} would exceed 12 — i.e. on the 13th {{put}} — the map allocates a new table of capacity 32, new threshold 24, and **rehashes** all 13 entries into it. That is {{O(n)}} work in one single call, so the cost is not spread evenly across puts: one put can be much slower than its neighbours and can produce a visible pause in a hot path. With 1 million entries the resize touches all of them at once.

### Why the other options are wrong
- **Append a bucket at the end of the table**: the table is a fixed-size array sized to a power of two; there is no such thing as "adding a bucket to the end". Growth is always allocate-a-bigger-array-and-move-everything.
- **Resize when a bucket has 8 elements**: at 8 the map **treeifies** *that bucket* — it converts the chain into a red-black tree so lookups in it go from {{O(n)}} to {{O(log n)}} — and it only does so once the table is at least 64 slots; below that it resizes instead of treeifying. But "8 in one bucket" is a collision problem, not a load-factor problem.
- **new HashMap<>(n) never resizes**: the {{int}} argument is **capacity**, not "how many elements I plan to store". {{new HashMap<>(1000)}} gives you a 1024-slot table (threshold 768); put 769 entries in and it still resizes. Only {{HashMap.newHashMap(expectedSize)}} (Java 19+) computes capacity from the expected element count for you.

> Senior tip: in production, pre-size maps you know are large — {{HashMap.newHashMap(expectedSize)}} (Java 19+) or, on older JDKs, {{new HashMap<>((int) (expected / 0.75f) + 1)}} — so you pay the rehash once at construction instead of mid-request. Treeify threshold is 8 and untreeify is 6 (hysteresis, so a bucket oscillating around 8 does not flip structures constantly). And remember the failure mode behind all of this: {{get}} is {{O(1)}} only when {{hashCode}} is well distributed. A bad {{hashCode}} (or a map keyed by mutable objects you keep editing) turns the map into a {{O(n)}} list walk and looks, under a profiler, exactly like "the map is suddenly slow".`
  },
  "qz-collections-026": {
    "q": `How does ConcurrentHashMap.putIfAbsent differ from computeIfAbsent in terms of locking?`,
    "options": [
      `putIfAbsent takes no mapping function, so it holds no bin lock while computing; computeIfAbsent holds the bin lock for the whole function call`,
      `Both lock the entire map`,
      `putIfAbsent always calls the function, even when the key is present`,
      `computeIfAbsent is not atomic`
    ],
    "explain": `**Correct answer: putIfAbsent does not run a function under a lock; computeIfAbsent does.**

### What each one does
{{ConcurrentHashMap}} is not a single big lock: it splits the table into independently guarded slots (historically *segments*, since Java 8 *bins* — one bucket plus its chain/tree). A put protects only the bin it is touching, using {{synchronized}} on the first node of that bin, so writers on different bins run in parallel.
- {{putIfAbsent(k, v)}}: read the bin, and if the key is absent store the value {{v}} you **already built**. The expensive part (building {{v}}) happened *before* the call, outside any lock, and may have happened redundantly on several threads — the map just keeps the first one that got there. The lock is held for a very short time.
- {{computeIfAbsent(k, f)}}: if the key is absent, the map runs {{f.apply(k)}} **while holding that bin's lock**, then stores the result. Locking during the call is exactly what guarantees the function runs **at most once per key** and that two threads never get two different instances of the value. The price: no other thread can touch that bin — not even a {{get}} that hashes there — for the whole duration of your function.

Hard rule that follows: a {{computeIfAbsent}} function must be short, CPU-bound and non-blocking. A DB query, an HTTP call or a lock acquisition inside it can stall every thread mapping to the same bin, and it can even deadlock (the Javadoc forbids modifying the map from within the function).

### Why the other options are wrong
- **Both lock the whole map**: that would make it pointless; {{Hashtable}}/{{Collections.synchronizedMap}} lock the map, {{ConcurrentHashMap}} locks per bin and reads are usually lock-free (volatile table).
- **putIfAbsent always calls the function**: there is no function in the signature — only a prepared value; and if the key is present the value is simply discarded.
- **computeIfAbsent is not atomic**: it is the most atomic option; that atomicity is precisely why it holds the bin.

> Senior tip: to cache something genuinely expensive without pinning a bin, do not put the I/O inside {{computeIfAbsent}}. Store a {{CompletableFuture}} instead — {{computeIfAbsent(k, x -> CompletableFuture.supplyAsync(this::load, executor))}} — so the lock covers only the tiny "create and register the future" step and the loading happens outside; the first caller registers, everyone else joins the same future. Or let a real cache library do it: Caffeine's {{AsyncLoadingCache}} implements exactly this pattern, with expiry and per-key deduplication.`
  },
  "qz-modern-025": {
    "q": `Which properties does the following record have?`,
    "options": [
      `It is a final class, its components are private final, it has a canonical constructor, and equals/hashCode/toString are generated`,
      `It can extend another class`,
      `Its components can be reassigned`,
      `It has no constructor`
    ],
    "explain": `**Correct answer: a record is final, its components are final, and its methods are generated.**

### What a record is
{{record Point(int x, int y) {}}} (Java 16) is a compact way to declare a **named tuple of data**: a class whose whole purpose is to carry values. The compiler generates the boring parts for you:
- {{final}} class — no one can extend it, so the generated {{equals}}/{{hashCode}} cannot be broken by a subclass.
- One {{private final}} field per **component** ({{x}}, {{y}}) and a public read accessor named after the component ({{p.x()}}, not {{getX()}}).
- The **canonical constructor**, whose parameter list is exactly the components in declaration order — that is the constructor whose name and order define the record.
- {{equals}}, {{hashCode}}, {{toString}} computed from **all** components, so you get value semantics for free ({{Point(1,2).equals(Point(1,2)}} is true, and the map/set behaviour you expect follows).
You can add methods, implement interfaces, and declare static fields — but no extra instance fields.

You can also write a **compact constructor**: {{record Range(int lo, int hi) { if (lo > hi) throw new IllegalArgumentException(); } }} — no parameter list, no assignments; the compiler inserts your body *before* the implicit field assignments. Use it to validate or to normalise (e.g. replace {{null}} with an empty list).

### Why the other options are wrong
- **Can extend another class**: a record already extends {{java.lang.Record}}; a class can have only one superclass, so a record may only implement interfaces.
- **Components can be reassigned**: the fields are {{final}} — there is no setter and no way to assign to {{x}}.
- **No constructor**: there is always the canonical constructor; you may restate it explicitly ({{Point(int x, int y) { this.x = x; this.y = y; }}}, e.g. to add validation, but then you must assign every field yourself).

> Senior tip: records are the right shape for DTOs, value objects, map keys and method returns of several values — and they deconstruct nicely in {{switch}} patterns. But the immutability is **shallow**: the compiler only guarantees the *references* cannot be reassigned. {{record Order(List<Item> items)}} can still be mutated by the caller through the very same list it handed in. If you need real immutability, copy in the compact constructor: {{Order(List<Item> items) { this.items = List.copyOf(items); }}}. Also note {{toString}} of a record prints all components — fine for logs, but for a DTO carrying a password or a token you must override it before it reaches an appender. And records are transparent carriers, not business objects: behaviour belongs elsewhere, otherwise you just moved an anemic class.`
  },
  "qz-modern-026": {
    "q": `A sealed interface Payment permits Card, Wallet. When does a switch over it need no default?`,
    "options": [
      `When every permitted subtype is covered and the sealed hierarchy cannot change`,
      `Never — a default is always required`,
      `Only when the interface is not sealed`,
      `Only when you switch over an enum`
    ],
    "explain": `**Correct answer: when all subtypes of the sealed type are covered.**

### What sealed means and what the compiler gains from it
{{sealed}} (Java 17) restricts who may implement or extend a type:
~~~java
public sealed interface Payment permits Card, Wallet { }
public record Card(String last4, BigDecimal amount) implements Payment { }
public record Wallet(String email, BigDecimal amount) implements Payment { }
~~~
Each permitted subtype must itself be {{final}}, {{sealed}} or {{non-sealed}}, so at compile time the set of possible types is **closed and enumerable** — the compiler literally knows there are exactly two implementations. That is the missing precondition for *exhaustiveness checking*: with a plain interface the compiler cannot know whether a third class appears tomorrow, so it forces a {{default}}. With a sealed hierarchy it can prove you covered everything, and a {{switch}} (or {{instanceof}} pattern switch, Java 21) that handles {{Card}} and {{Wallet}} compiles without {{default}} — as an expression, the branches alone are enough to define every value.

The real payoff is refactoring safety: add {{BankTransfer}} to {{permits}} and every {{switch}} that used to be exhaustive stops compiling. The compiler sends you to exactly the places that must be updated, instead of silently routing the new type to a {{default}} that returns "unknown" in production.

### Why the other options are wrong
- **A default is always required**: writing {{default}} is legal but it defeats the point — with a catch-all present, the compiler no longer warns you when the hierarchy grows.
- **Only when the interface is not sealed**: inverted. An open interface is precisely the case where exhaustiveness cannot be proved.
- **Only when you switch over an enum**: an enum *is* a closed set, so exhaustiveness works there too — that behaviour just got generalised to sealed types. The question is about a sealed interface, and note the difference: a new enum constant requires recompiling the enum itself, whereas a sealed subtype can live in another class.

> Senior tip: a {{sealed}} hierarchy that ships as part of a library is an API promise — adding a subtype is a breaking change for every consumer that relies on exhaustive switches, so treat {{permits}} the way you treat a public method signature and say so in the interview. In business code the pattern that reads best is *sealed interface + records + switch patterns*: the sum type is the closed list of cases and each case carries only its own data. If the set of cases genuinely must be open, prefer {{Optional}}/polymorphic methods over pretending it is sealed, and do not put {{throw new IllegalStateException("unreachable")}} in a {{default}} you could have avoided.`
  },
  "qz-modern-027": {
    "q": `What does pattern matching for instanceof (Java 16) let you do?`,
    "options": [
      `Declare and bind a pattern variable in the control-flow scope without a manual cast`,
      `Check the element type of a generic`,
      `Perform automatic unboxing`,
      `Replace switch entirely`
    ],
    "explain": `**Correct answer: it binds the variable according to control flow.**

### What changed
Before Java 16 the type check and the cast were two statements repeating the same name:
~~~java
if (o instanceof String) {
    String s = (String) o;      // the value is re-read from a variable you already proved
    System.out.println(s.length());
}
~~~
Now the check carries a **pattern variable**: {{if (o instanceof String s) { ... }}}. If the test succeeds, {{s}} exists and already holds {{o}} typed as {{String}} — no cast written, and no second name to keep in sync. It is not syntactic sugar over a cast you still pay for: the compiler emits the same type check plus an assignment, and if it can prove {{o}} is already a {{String}} it can drop the test altogether.

The subtlety an interviewer probes is **flow scoping**: a pattern variable is in scope only where the compiler can prove the pattern matched.
- Inside the {{true}} branch of the {{if}} the variable is usable; in the {{else}} branch it is **not**, because that is exactly the path where the pattern did not match.
- Guard clause: {{if (!(o instanceof String s)) return;}} then {{s}} **is** usable in the code below, because the only path that reaches it came through a successful test.
- {{if (o instanceof String s && s.length() > 3)}} works, since the right operand of {{&&}} is evaluated only when the left one held.
- {{while}}/{{for}} bodies are rejected, because the compiler cannot prove the test still holds on the next iteration.

### Why the other options are wrong
- **Check generic element types**: impossible — generics are erased at compile time, so at runtime a {{List<String>}} and a {{List<Integer>}} are both plain {{List}}. {{o instanceof List<String>}} is a compile error. (You may test the raw container, or use a reifiable type.)
- **Automatic unboxing**: unrelated; that is a feature of {{Integer}}/{{int}} arithmetic from Java 5 and involves no pattern variable.
- **Replace switch**: {{instanceof}} patterns do not replace {{switch}}; pattern matching **in** {{switch}} (types, {{null}}, guards with {{when}}, deconstruction) is a separate, later feature — finalized in Java 21.

> Senior tip: this feature pays off most in {{equals}}, where it removes both the cast and the {{null}} test: {{return o instanceof Point p && p.x == x && p.y == y;}}. In Java 21 you can go one step further and destructure a record directly: {{o instanceof Point(int x, int y) && ...}}, or {{if (p instanceof Point(var x, var y))}}. Use the pattern variable immediately in the branch instead of storing it again, and keep the variable name short — it becomes part of the readability of the whole method. If you find yourself chaining many {{instanceof}}s on the same argument, that is the signal to convert the chain into a {{switch}} pattern (or, better, into polymorphism).`
  },
  "qz-modern-028": {
    "q": `Which methods do Sequenced Collections (Java 21) add to List/Deque?`,
    "options": [
      `getFirst/getLast/addFirst/addLast/removeFirst/removeLast/reversed`,
      `sort/shuffle`,
      `stream/parallelStream`,
      `of/copyOf`
    ],
    "explain": `**Correct answer: getFirst/getLast/.../reversed.**

### The gap JEP 431 filled
Java's collections grew for twenty years without a common way to say "give me the first and the last element". Before Java 21 the answer depended on the class you happened to hold:
~~~text
List        first: get(0)              last: get(size() - 1)
Deque       first: getFirst()          last: getLast()
LinkedHashSet  first: iterator().next()   last: no direct way (stream().reduce or copy to a list)
SortedSet   first: first()             last: last()
~~~
So generic code had to be written four times, and a method taking {{Collection}} could not ask for "the last element" at all. JEP 431 introduced three interfaces in {{java.util}} — {{SequencedCollection}}, {{SequencedSet}}, {{SequencedMap}} — and wired them into the existing hierarchy ({{List}}, {{Deque}}, {{LinkedHashSet}} implement {{SequencedCollection}}; {{SortedSet}} too; {{LinkedHashMap}}/{{TreeMap}} implement {{SequencedMap}}). The added operations:
- {{getFirst()}}, {{getLast()}}, {{addFirst(e)}}, {{addLast(e)}}, {{removeFirst()}}, {{removeLast()}} — defined for any ordered collection, so the same code compiles for {{ArrayList}}, {{ArrayDeque}}, {{LinkedHashSet}}.
- {{reversed()}} — a **view** traversing the elements back to front; for a mutable, modifiable collection, writes through the view go through to the backing collection ({{list.reversed().set(0, x)}} changes the real last element).
- On {{SequencedMap}}: {{putFirst}/{putLast}}, {{firstEntry}/{lastEntry}}, {{pollFirstEntry}/{pollLastEntry}}, {{reversed()}} — which finally makes an insertion-ordered map usable without subclassing {{LinkedHashMap}} and overriding {{removeEldestEntry}}.
{{getFirst}}/{{getLast}} throw {{NoSuchElementException}} on an empty collection (unlike {{peek}}, which returns {{null}}) — same convention as {{Iterator.next}}.

### Why the other options are wrong
- **sort/shuffle**: {{List.sort}} dates from Java 8 and {{Collections.shuffle}} has been there since the beginning; neither is new.
- **stream/parallelStream**: added in Java 8 via {{Collection}}, not part of this JEP.
- **of/copyOf**: those are the immutable-factory methods of {{List}}/{{Set}}/{{Map}} from Java 9/10.

> Senior tip: before Java 21, {{get(size() - 1)}} and {{peekLast()}} were the two idioms you had to memorise per type; now you can write one helper against {{SequencedCollection}}. One upgrade hazard worth mentioning: existing classes that already declared a method named {{getFirst}}/{{reversed}} with a *different* return type or signature may suddenly fail to compile, because the interface now claims those names — and a {{reversed()}} view is not a copy, so holding it after the source collection changes gives you a live, surprising view.`
  },
  "qz-concurrency-025": {
    "q": `Virtual threads in Java 21 are the best fit for which workload?`,
    "options": [
      `I/O-bound: many tasks waiting on network/DB/file`,
      `CPU-bound: encryption, compression`,
      `Tasks that need a fixed thread pool`,
      `Tasks that need a large stack`
    ],
    "explain": `**Correct answer: I/O-bound.**

### Why I/O-bound is the sweet spot
A **virtual thread** (Project Loom, final in Java 21) is a thread managed by the JVM rather than by the operating system. It is a Java object holding a continuation — its stack frames live on the **heap**, not in a fixed 1 MB OS stack — and it runs on top of an OS thread called a **carrier** (from the ForkJoinPool carrier pool, sized to the number of cores by default). The trick is what happens on a blocking call: when a virtual thread hits a supported blocking operation (socket read, {{Thread.sleep}}, {{Lock}}, queue {{take}}), the JVM **unmounts** it — it copies the frames off the carrier, parks the *continuation*, and hands the carrier to another virtual thread. So a thread waiting three seconds for a DB response costs nothing but a small heap object, instead of occupying an OS thread for three seconds.

That is precisely why the throughput of I/O-heavy code scales: with platform threads, "one request = one thread" caps you at a few hundred or a few thousand concurrent requests, because each waiting thread holds an OS thread and ~1 MB of stack. With virtual threads you can have a million requests in flight, each blocked on its own downstream call. The cost per task is roughly a few kilobytes.

### Why the other options are wrong
- **CPU-bound**: there is no waiting to hide, so nothing to unmount. You are bounded by cores either way, and creating more runnable threads than cores just adds scheduling overhead. Keep CPU-bound work on a fixed pool sized to available processors.
- **Needs a fixed thread pool**: a pool exists to *reuse scarce OS threads* and to cap concurrency. Virtual threads are cheap and meant to be created per task and discarded; pooling them is like pooling {{Runnable}}s. Use {{Executors.newVirtualThreadPerTaskExecutor()}} — and do not shrink the pool "to limit concurrency", that is what a {{Semaphore}} is for.
- **Needs a large stack**: the stack is on the heap and grows dynamically, so a deep recursion no longer needs {{-Xss}} tuning — but it still consumes heap and still hits {{StackOverflowError}} at the JVM limit. Deep, stack-hungry computation is not the reason to adopt them.

> Senior tip: two things people get wrong in production. (1) Virtual threads do **not** increase your database capacity: a million virtual threads all trying to borrow one of HikariCP's 10 connections just builds a queue. Bound the *downstream* resource (pool size, {{Semaphore}}) rather than the thread count. (2) {{synchronized}} blocks used to **pin** the carrier thread while a virtual thread blocked inside them, wasting a core; in JDK 24 this is fixed (JEP 491), but on 21–23 large {{synchronized}} regions around I/O were a real tuning item. Pinning is visible in JFR ({{jdk.VirtualThreadPinned}}) and via {{-Djdk.tracePinnedThreads=full}}. Rule of thumb: keep compute-heavy loops off virtual threads, keep the blocking calls on them.`
  },
  "qz-concurrency-026": {
    "q": `How does CompletableFuture.exceptionally receive the exception?`,
    "options": [
      `It receives a CompletionException wrapping the original cause; the thenApply stage is skipped`,
      `It receives the IllegalStateException directly`,
      `It runs alongside thenApply`,
      `It throws immediately at join`
    ],
    "explain": `**Correct answer: it receives a CompletionException.**

### What happens when a stage throws
A {{CompletableFuture}} pipeline is a chain of dependent stages. If the upstream stage completes **exceptionally**, every dependent stage that expects a value is **skipped** — {{thenApply}}, {{thenAccept}}, {{thenCompose}} do not run at all, because there is no value to hand them — and the exception travels down the chain until it meets a stage that can handle it. That handler is {{exceptionally(fn)}} (analogous to {{catch}}), {{handle}} (runs for both outcomes), or {{whenComplete}} (side effect only, re-throws afterwards).
The signature is {{Function<Throwable, T>}} — but the {{Throwable}} you actually get is normally a {{CompletionException}} whose {{getCause()}} is what your code really threw:
~~~java
CompletableFuture.supplyAsync(() -> { throw new IllegalStateException("boom"); })
    .thenApply(s -> s.length())                    // SKIPPED
    .exceptionally(t -> {
        // t is CompletionException, t.getCause() is IllegalStateException
        return "recovered";
    })
    .join();                                       // "recovered", no throw
~~~
The wrapping exists because a stage may fail inside an internal mechanism (or be composed from several futures), so the framework reports "the completion failed" and gives you the real reason in {{cause}}. In practice always unwrap: {{t instanceof CompletionException ce ? ce.getCause() : t}} — otherwise your logs and your error mapping print {{CompletionException}} for everything.
{{join()}}/{{get()}} throw a {{CompletionException}} ({{get()}}: wrapped in {{ExecutionException}}, plus checked exceptions) only when nothing recovered the failure — if {{exceptionally}} returned a value, the future is complete normally and {{join}} just returns it.

### Why the other options are wrong
- **Receives IllegalStateException directly**: no — {{exceptionally}} receives the *wrapper*; you read {{IllegalStateException}} from {{getCause()}}.
- **Runs alongside thenApply**: stages are not alternatives executed together. The value-producing stage is skipped; the handler stage then runs on the exceptional completion.
- **Throws immediately at join**: it throws only if the exception is still unhandled when you await it. Recovering upstream means {{join}} never sees it.

> Senior tip: {{supplyAsync(task, executor)}} — the overload without an executor runs on the **common ForkJoinPool**, which is sized to cores minus one and is shared with parallel streams, so a blocking HTTP call there can starve the whole JVM's CPU work. Always pass your own executor for I/O. The variants you should be able to name: {{exceptionally}} handles failure only and keeps the value path untouched; {{handle}} runs on both outcomes and can return a fallback value; {{whenComplete}} is a side-effect observer that re-throws afterwards; {{orTimeout(n, unit)}} completes the future exceptionally with {{TimeoutException}} so a stalled dependency cannot hold the chain open forever; {{complete(v)}}/{{completeExceptionally(t)}} let you settle a future from the outside, and {{completeOnTimeout(v, n, unit)}} returns a default value instead of failing. Recover with {{exceptionally}} only where you genuinely know the fallback, otherwise let the failure reach the caller and log the {{cause}}, not the wrapper.`
  },
  "qz-jvm-025": {
    "q": `Service latency p99 under 10 ms, 32 GB heap, Java 21. Which GC makes sense?`,
    "options": [
      `Generational ZGC (-XX:+UseZGC -XX:+ZGenerational)`,
      `Parallel GC`,
      `G1 with MaxGCPauseMillis=1`,
      `Serial GC`
    ],
    "explain": `**Correct answer: Generational ZGC.**

### Reading the constraints
Two numbers drive the choice. **p99 under 10 ms** means the requirement is on *pause latency*, not on throughput: a tail-latency SLA is broken by a single long stop-the-world pause, so you want a collector whose pauses do not grow with the heap. **32 GB heap** rules out the collectors that scan everything while the application is stopped, because their pause time is proportional to live-set size.
{{ZGC}} (production-ready in Java 11, generational in Java 21) does the marking, relocation and compaction **concurrently with the running application**; the world stops only for very short root-scanning points, and those stops are bounded by the number of GC roots and threads, not by how much data is live — typically well under 1 ms, essentially flat whether the heap is 8 GB or 4 TB. It reaches that with coloured pointers (metadata stored in the pointer's unused high bits) and load barriers, so the read of a reference can transparently fix up an object that was moved just now.
**Generational** ZGC (Java 21; {{-XX:+ZGenerational}}, default since Java 23) adds a young generation, so most collections scan only the small live set of young objects. That fixes ZGC's classic weakness — spending CPU re-marking the whole huge old generation — which is exactly what a 32 GB heap needs.
The trade-off you must be able to state: ZGC burns more CPU than G1, and it needs heap headroom (concurrent collection only works if the heap grows while GC runs); on a CPU-starved box those milliseconds may cost you throughput.

### Why the other options are wrong
- **Parallel GC** ({{-XX:+UseParallelGC}}): tuned for maximum throughput, all its work is stop-the-world. On a 32 GB live set a full collection is seconds of complete silence — fine for batch jobs, fatal for a 10 ms tail.
- **G1 with MaxGCPauseMillis=1**: {{MaxGCPauseMillis}} is a **soft goal**, not a promise. G1 picks how many regions to collect per pause to aim at it, but it cannot go below the unavoidable work (a humongous-object allocation, a full GC fallback, or root scanning) and it still has concurrent-mark phases; a goal of 1 ms is below the practical floor and typically ends up with a full GC. G1 at its default 200 ms is the right answer for most 32 GB services — but not for a p99 of 10 ms.
- **Serial GC**: single-threaded stop-the-world, meant for small heaps and containers of 1 core; pauses are the longest of all.

> Senior tip: never pick a collector from the requirement alone — confirm the GC is the culprit first. Look at {{-Xlog:gc*:file=gc.log}} (or JFR {{jdk.GarbageCollection}}/{{jdk.GCPhasePause}}) for actual pause durations and the ratio of collection time to allocation rate, and check **time-to-safepoint** separately, because "the app froze for 40 ms" is often not the GC phase at all. Also mention the sizing question: 32 GB is worth asking about — a live set that big is often a cache that should live in Redis, and shrinking the heap sometimes solves the latency problem more cheaply than switching collector. ZGC is not zero-tuning either: {{SoftMaxHeapSize}} and leaving enough free CPU are what make it behave predictably.`
  },
  "qz-jvm-026": {
    "q": `GC pauses are short, yet the application stalls for a long time. What could be the cause?`,
    "options": [
      `A large time-to-safepoint (TTSP)`,
      `The GC log is wrong`,
      `A concurrent phase of ZGC`,
      `A wholesale JIT deoptimization`
    ],
    "explain": `**Correct answer: a large TTSP.**

### Two different intervals people merge into one word
Every stop-the-world collection has two phases, and only the second one is what the "pause time" in a GC log usually reports:
- **Time to safepoint (TTSP)**: the JVM decides to stop the world, so it asks every Java thread to reach a **safepoint** — a point in the code where the thread's stack state is well-defined and its roots can be scanned. Threads get there only when they hit a *poll* instruction (at method returns, back edges of loops, blocking calls). The last thread to arrive determines how long everyone else waits, stopped.
- **Stop-the-world work**: the actual marking/clearing/compacting, then {{RunThreads}} releases everyone.
So a "2 ms GC" can freeze the process for 500 ms while the JVM waits for one thread stuck inside a long-running computation. {{Reaching safepoint: 498.123 ms, at safepoint: 2.004 ms, Total: 500.127 ms}} in a {{-Xlog:safepoint}} log says it plainly: the GC did not take that time, the wait did.
Classic causes of a large TTSP: a JIT-compiled loop with no safepoint poll inside it (a tight loop over primitives, {{while (i < n)}} doing arithmetic — the compiler did not have to insert a poll, and on older JDKs you could not bound it), a big array copy / {{Arrays.fill}}, {{System.gc}} from JNI or a library, page faults or swap, and long-running {{Unsafe}}/native-ish code. JDK 10+ can count iterations and force a poll ({{-XX:+UseCountedLoopSafepoints}}), and JFR exposes {{jdk.ExecuteVMOperation}} with {{safepointId}}/{{sync}} timing plus {{Reaching safepoint}}.

### Why the other options are wrong
- **The GC log is wrong**: the log measures the GC's own work accurately; it simply does not claim that "GC paused everything" started when the request froze. Trust the number, then look at the safepoint line next to it.
- **A concurrent ZGC phase**: concurrent phases run by definition *with* the application — they cost CPU, they do not stop threads. If the app is frozen, it is a stop-the-world interval or something outside the GC.
- **Wholesale deoptimization**: deopt (a compiled method falling back to the interpreter, e.g. after an unexpected branch or class hierarchy change) hurts throughput and can cause recompilation churn, but it is per-thread and gradual — it is not the reason all threads stop at the same instant.

> Senior tip: enable {{-Xlog:safepoint,gc*=info::time,uptime}} and compare {{Reaching safepoint}} with {{Total}} — if the first dominates, tuning the collector will not help; you need to find the thread that is slow to reach the safepoint (JFR {{jdk.ExecuteVMOperation}}, or a {{jstack}} taken during the stall; {{-XX:+PrintSafepointStatistics}} on older JDKs). And remember the sibling explanations for the same symptom, which an interviewer will ask about next: {{System.gc()}} from RMI/DirectByteBuffer, {{-XX:+DisableExplicitGC}} vs a growing {{-XX:MaxDirectMemorySize}}, heap dump / {{jmap -histo:live}} run by an APM agent, and class reinitialization by a retransform agent.`
  },
  "qz-core-027": {
    "q": `What does the following code print?
~~~java
List<Integer> a = new ArrayList<>(List.of(1,2,3));
List<Integer> b = a.subList(1,3);
b.set(0, 99);
System.out.println(a);
~~~`,
    "options": [`[1, 99, 3]`, `[1, 2, 3]`, `[99, 2, 3]`, `UnsupportedOperationException`],
    "explain": `**Correct answer: [1, 99, 3].**

### What subList really returns
{{a.subList(1, 3)}} does **not** copy elements. It returns a {{java.util.ArrayList.SubList}} — a lightweight object holding a reference to the backing list {{a}} plus an {{index}} offset (here 1) and a {{size}} (here 2). Its {{get}}/{{set}}/{{add}} methods translate positions: {{b.set(0, 99)}} becomes {{a.set(1 + 0, 99)}}. So element 0 of the view *is* element 1 of the original, and writing through the view writes into {{a}} — printing {{a}} afterwards shows {{[1, 99, 3]}}.
The same bidirectional coupling holds in the other direction, which is what makes {{subList}} a trap: the view reflects later changes to {{a}}, and structural changes to {{a}} (any add/remove that shifts indices) invalidate the view — the view keeps an {{expectedModCount}}, so the next operation on it throws {{ConcurrentModificationException}}, exactly like an iterator. Deleting a range is even an idiom: {{a.subList(1, 3).clear()}} removes elements 1 and 2 from {{a}}.

### Why the other options are wrong
- **[1, 2, 3]**: that would require {{subList}} to return a copy, so {{b.set}} would touch only the copy.
- **[99, 2, 3]**: index confusion — {{b}} starts at offset 1, so position 0 of the view is position **1** of the list, not 0.
- **UnsupportedOperationException**: {{set}} is fully supported by the {{ArrayList}} view. {{UnsupportedOperationException}} is what you get from *immutable* lists ({{List.of(1,2,3)}}, {{Collections.unmodifiableList}}, {{List.copyOf}}) or views whose operation would break a size contract — note the setup uses {{new ArrayList<>(List.of(...))}} precisely to make the list mutable.

> Senior tip: holding a {{subList}} long-term pins the **entire backing list**, because the view keeps a reference to it — keep a slice of a 5 million-row list alive and you keep all 5 million rows; copy explicitly with {{List.copyOf(slice)}} or {{new ArrayList<>(slice)}} if you need to keep it. Two related gotchas worth volunteering: (1) {{subList}} of a {{subList}} compounds the offsets and is the standard source of "index off by N" bugs; (2) if you need a genuinely independent window, remember the view also breaks whenever the parent is resized — the safe pattern is to materialise before returning it across a method or module boundary.`
  },
  "qz-modern-029": {
    "q": `What is the result of the following text block (Java 15)?
~~~java
String s = """
    line1
    line2
    """;
System.out.println(s.lines().count());
~~~`,
    "options": [`2`, `3`, `1`, `Compilation error`],
    "explain": `**Correct answer: 2.**

### How a text block is post-processed
{{"""} ... """}} is a **text block**: a multi-line String literal, finalized in Java 15. What sits between the delimiters is not copied verbatim — the compiler runs an indentation normalisation algorithm over it:
1. The opening {{"""}} must be followed by a line terminator, so content starts on the next line (you cannot put text on the same line as the delimiter).
2. Lines are split, then **incidental whitespace** is stripped: the algorithm computes the minimal indentation over all non-blank content lines *and* the closing-delimiter line, and removes that common prefix from every line. Here {{line1}}/{{line2}} carry 4 spaces and the closing {{"""}} also carries 4, so the common indent is 4 and everything is left-aligned; the leading spaces you typed are formatting in the source, not data.
3. {{\\n}}-style escapes are processed and a trailing line terminator is added only if the closing delimiter sits on its own line — which it does here, but the value ends right **before** the closing delimiter's line, so the string is {{"line1\\nline2\\n"}}.
{{s.lines()}} splits on line terminators and yields {{Stream<String>}}: {{"line1"}}, {{"line2"}} — the final {{\\n}} does not create a third, empty element. {{count()}} = **2**.
If you want no trailing newline at all, end the block with the delimiter right after the last character: {{"...line2"""}}.

### Why the other options are wrong
- **3**: this assumes the last line terminator produces an extra empty element. {{String.lines()}} does not emit a trailing empty line (unlike {{split}} with a negative limit, which keeps it).
- **1**: a text block does not join lines — that would be concatenation of the content, and it is explicitly what this feature avoids.
- **Compilation error**: text blocks are standard from Java 15 (preview in 13 and 14), so the code compiles. Note only the preview flag matters on 13/14, and a text block with an {{invalid escape}} (like {{\\d}}) *is* a compile error unless you double it as {{\\\\d}}.

> Senior tip: text blocks shine for JSON, SQL and GraphQL inside tests and fixtures — you keep quotes readable without a wall of backslash-escaped quotes. Two methods you should name in an interview: {{stripIndent()}} applies the same de-indentation algorithm to an ordinary string, and {{translateEscapes()}} processes {{\\n}}/{{\\t}}/{{\\u...}} without rejecting unknown escapes — the pair you need when you must build a regex-like text block ({{"\\\\d+"}} vs an escape that would otherwise fail). If you need a line to keep extra indentation, mark it with a trailing {{\\s}} escape, and remember the closing delimiter's own indentation participates in the computation — that is the least obvious part of the algorithm.`
  },
  "qz-concurrency-027": {
    "q": `When should you reach for ReentrantLock instead of synchronized?`,
    "options": [
      `When you need tryLock with a timeout, lock fairness, or interruptible locking`,
      `Always, because it is faster`,
      `When you need to lock inside a constructor`,
      `When you need to lock on a primitive`
    ],
    "explain": `**Correct answer: when you need the extra capabilities.**

### What each one actually is
{{synchronized}} is a **language-level monitor**: the JVM enters/exits it via {{monitorenter}}/{{monitorexit}} on an object, the lock is released automatically when the block ends (including by an exception), it is reentrant, and the JIT can elide or coarsen it entirely. That automatic release is its biggest advantage — you cannot forget to unlock.
{{ReentrantLock}} is a **library class** in {{java.util.concurrent.locks}}. It is also reentrant and gives the same mutual exclusion, but you hold the lock object and call {{lock()}}/{{unlock()}} yourself — which means unlocking in a {{finally}} is mandatory, and a missing {{unlock}} is a production deadlock instead of a compile-time impossibility.

What it buys you in exchange for that boilerplate:
- {{tryLock()}} / {{tryLock(timeout, unit)}}: give up instead of queueing forever. This is how you implement backpressure, "fail fast if the critical section is busy", or a bounded wait behind a slow dependency — with {{synchronized}} a blocked acquirer cannot be talked out of waiting.
- {{lockInterruptibly()}}: an acquirer that reacts to {{interrupt()}} and throws {{InterruptedException}}. Monitor acquisition is **not** interruptible — a thread stuck on {{synchronized}} ignores interrupts, so a client timeout or {{shutdownNow()}} cannot free it.
- **Fairness**: {{new ReentrantLock(true)}} grants the lock in FIFO order, so no thread starves. Fair mode costs a lot of throughput (constant context switching), so you use it only when the tail latency of an unlucky thread matters more than aggregate throughput.
- Multiple {{Condition}} objects on one lock ({{newCondition()}}), i.e. separate wait sets, which a single monitor cannot express.
- {{lock()}} around a wait that can be parked without holding a carrier thread — with virtual threads this matters, since a blocking {{Lock}} unparks cleanly. (In JDK 21 the {{synchronized}} path could pin the carrier; JDK 24 / JEP 491 removed that.)

### Why the other options are wrong
- **Always, because it is faster**: no. {{synchronized}} is heavily optimised (biased/thin/fat locks, lock elision, escape analysis) and is usually at least as fast for short critical sections; {{ReentrantLock}} wins mainly on *features*, and its uncontended cost is comparable.
- **Inside a constructor**: nothing about it needs a lock object there — and both are equally dangerous while the reference is still leaking.
- **On a primitive**: a lock needs an object to guard ({{synchronized}} takes a reference, {{ReentrantLock}} is itself an object). You cannot lock {{int count}}, and locking on {{this}}/a boxed value you hand out is a bug — use a private final lock object or a {{LongAdder}}/{{AtomicInteger}}.

> Senior tip: default to {{synchronized}} and escalate only when you need a timeout, interruptibility, fairness, or several condition queues — and say why in the interview, because "I use ReentrantLock everywhere" reads as unfamiliarity with the automatic-release guarantee. Two rules that make the escalation safe: always {{lock(); try { ... } finally { unlock(); }}} (never unlock outside the finally), and never call out (RPC, DB, logging) while holding any lock, since the critical section's duration becomes your latency floor. If what you are protecting is a single counter or a check-then-act on one variable, skip locks altogether for {{AtomicInteger}}/{{AtomicReference}}.{{compareAndSet}} — or a {{LongAdder}} under high contention.`
  },
});
