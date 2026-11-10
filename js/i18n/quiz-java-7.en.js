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
    "q": `What properties does this record have?
~~~java
public record Money(String currency, long amount) { }
~~~`,
    "options": [
      `It is a final class, its components are private final, it has a canonical constructor, and equals/hashCode/toString are generated`,
      `It can extend another class`,
      `Its components can be reassigned`,
      `It has no constructor`
    ],
    "answer": 0,
    "explain": `**Correct answer: a record is final, its components are final, and its methods are generated.**

### Why this is correct
A record (Java 16) is a **transparent carrier** for immutable data: a final class, private final components, a canonical constructor, and generated equals/hashCode/toString plus accessors. You can add a compact constructor to validate or normalise.

### Why the other options are wrong
- **Can extend another class**: a record cannot extend another class (it only implements interfaces).
- **Components can be reassigned**: components are final — there is no setter and no way to assign to them.
- **No constructor**: there is always the canonical constructor; you may restate it explicitly (compact constructor) to add validation.

> Senior tip: records fit DTOs and value objects. But immutability is **shallow**: a record holding a mutable List can still be modified from the outside unless you copy it in the constructor.`
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
    "q": `A Spring Boot service runs Java 21 in a Kubernetes container with a 2 GiB memory limit; the host has 64 GB RAM. No {{-Xmx}} or heap flags are set. What is the JVM's maximum heap?`,
    "options": [
      `About 16 GB (25% of host RAM), so the pod is easily OOMKilled`,
      `About 512 MB: the JVM reads the memory limit from cgroup and defaults to {{MaxRAMPercentage}} = 25% of 2 GiB`,
      `Exactly 2 GiB, the JVM uses the whole limit as heap`,
      `The JVM cannot start unless {{-Xmx}} is set in the container`
    ],
    "answer": 1,
    "explain": `**Correct answer: about 512 MB (25% of the limit).**

### Why this is correct
Since JDK 10 (backported to 8u191), the JVM is **container-aware**: it reads the memory limit and CPU quota from cgroup (v1 or v2) instead of the host's RAM. The default maximum heap is {{MaxRAMPercentage}} (default 25%) of the visible memory: 25% × 2 GiB = 512 MB. The rest is for metaspace, thread stacks, code cache, direct buffers, and GC's native memory.

### Why the other options are wrong
- **16 GB from host RAM**: that is the behavior of old JVMs (Java 8 before 8u191). That behavior caused mass OOMKilled incidents.
- **All 2 GiB**: the JVM needs memory outside the heap; if the heap takes the whole limit, the process's total memory exceeds the limit and the kernel kills the pod.
- **Cannot start**: the JVM always has a default value.

### Common configuration
~~~yaml
resources:
  limits:
    memory: 2Gi
env:
  - name: JAVA_TOOL_OPTIONS
    value: "-XX:MaxRAMPercentage=75"   # heap about 1.5 GiB, leaving about 512 MiB for off-heap
~~~

> Senior tip: the default 25% is usually too low for a service running a single JVM; 60–75% is common. If the pod is still OOMKilled although the heap is not full, measure off-heap memory with {{-XX:NativeMemoryTracking=summary}} and {{jcmd <pid> VM.native_memory}}.`
  },
  "qz-jvm-026": {
    "q": `An application loads Groovy scripts and creates dynamic proxies continuously. After a few days it dies with {{java.lang.OutOfMemoryError: Metaspace}} ({{-XX:MaxMetaspaceSize=512m}} is set), while the heap still has plenty free. What is the most common root cause?`,
    "options": [
      `Heap too small; increasing {{-Xmx}} fixes it`,
      `Metaspace is inside the heap, so periodic Full GC is enough`,
      `ClassLoader leak: a class is only removed from Metaspace when the ClassLoader that loaded it is garbage-collected, but a reference still holds the ClassLoader (static cache, ThreadLocal, thread not stopped)`,
      `Too many String interns`
    ],
    "answer": 2,
    "explain": `**Correct answer: the ClassLoader is held, so classes cannot be unloaded.**

### Why this is correct
Metaspace (since Java 8, replacing PermGen) holds **class metadata** and lives in native memory, outside the heap. A class is only removed from Metaspace when **the ClassLoader** that loaded it becomes garbage. Each Groovy script or proxy type usually comes with new classes, sometimes even a new ClassLoader. As long as one reference keeps an object alive, its class, that class's ClassLoader, and every class that ClassLoader loaded are all retained. That reference can be a static cache, a {{ThreadLocal}} on a pool thread, or a thread created by the loaded code that was never stopped.

### How to investigate
- {{jcmd <pid> VM.classloader_stats}} or {{jcmd <pid> VM.metaspace}}: which ClassLoader holds many classes.
- Heap dump, open in Eclipse MAT: find many instances of the same ClassLoader, then view "Path to GC Roots".
- {{-Xlog:class+unload}}: check whether classes are actually unloaded.

### Why the other options are wrong
- **Increasing {{-Xmx}}**: Metaspace is not in the heap, so a bigger heap does not help.
- **Forcing Full GC**: GC still runs, but cannot reclaim classes whose ClassLoader is still referenced.
- **String intern**: interned strings live on the heap (since Java 7), not in Metaspace.

> Senior tip: always set {{MaxMetaspaceSize}} (default is unlimited) so the error surfaces early instead of letting the process eat all RAM and get OOMKilled. For Groovy, cache compiled scripts instead of recompiling on every run.`
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
    "q": `When should you use ReentrantLock instead of synchronized?`,
    "options": [
      `When you need tryLock with a timeout, lock fairness, or locking around I/O with virtual threads`,
      `Always, because it is faster`,
      `When you need to lock in a constructor`,
      `When you need to lock on a primitive`
    ],
    "answer": 0,
    "explain": `**Correct answer: when you need the extended features.**

### Why this is correct
ReentrantLock supports {{tryLock(timeout)}}, {{lockInterruptibly()}}, fairness, and does not pin virtual threads when blocking. {{synchronized}} is simple and enough for short critical sections.

### Why the other options are wrong
- **Always faster**: {{synchronized}} is well optimized and often faster for short locks.
- **Constructor**: not relevant.
- **Primitive**: a lock must be on an object.

> Senior tip: default to {{synchronized}}; upgrade to ReentrantLock when you need timeout or backpressure.`
  },
});
