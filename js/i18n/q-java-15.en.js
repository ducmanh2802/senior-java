/*
 * English translation of js/data/q-java.js — task T947. Format: js/core/i18n.js (content overlay).
 * ids: core-036 core-037 core-038 collections-031 collections-032 collections-033
 */
App.i18n.content({
  'core-036': {
    q: `How do escape analysis and scalar replacement work in the JIT? When is an object never allocated on the heap, and how do you verify it on JDK 17/21?`,
    a: `**Summary:** when JIT-compiling (C2), the JVM examines whether a reference to an object "escapes" outside the method. If it does not escape, it **removes the allocation entirely** and replaces the fields with values held in registers/the stack frame — that is scalar replacement. HotSpot does not "put the object on the stack" as the myth goes: it erases the object from the program. That is why a loop full of {{new}} can still run with nearly 0 bytes of allocation.

> Terminology: **JIT** (Just-In-Time compiler) is a compiler that runs while the program is running, turning "hot" bytecode into fast machine code; **C2** is HotSpot's heavily optimising JIT. **TLAB** (Thread-Local Allocation Buffer) is a per-thread heap area, like a "private drawer" for fast allocation without contention.

### What happens, in order
- {{new Point(3, 4)}} compiles to {{new}}, {{dup}}, {{invokespecial <init>}}. In the interpreter (the mode that executes bytecode instruction by instruction) and in C1 code (a JIT that compiles quickly with moderate optimisation), the object is genuinely allocated on the heap inside the TLAB, at the cost of just bumping a pointer.
- When the method is hot enough, C2 compiles it and runs escape analysis on the IR graph (the compiler's intermediate representation): every allocation node is classified by escape level and then kept or removed. **Inlining** (embedding the code of the called method at the call site) must happen first, because until it inlines, C2 cannot tell whether the target method lets the reference "escape".

| Escape level | Meaning | Example | What C2 does |
|---|---|---|---|
| No escape | the reference lives only inside the method | create a point then compute a distance | removes the allocation, splits fields into scalars |
| Arg escape | passed to a method that has not been inlined yet | {{helper(new Config())}} | still removed if the helper can be inlined |
| Global escape | reaches the heap, a static field, a return, or is stored into a field of another object | {{cache.put(k, new Value())}} | allocated normally |

### What scalar replacement looks like
~~~java
static int distSq(int dx, int dy) {
    Point p = new Point(dx, dy);   // Point: two int fields
    return p.x * p.x + p.y * p.y;
}
~~~
~~~text
Machine code after C2, conceptually:
    imul  eax, eax      ; p.x * p.x  (dx is already in a register)
    imul  edx, edx      ; p.y * p.y
    add   eax, edx      ; no allocation instruction, no object header, nothing for GC to collect
~~~
If the object escapes, you must add: allocation (12-16 byte header + fields), and every read of {{p.x}} is a load through a reference — a dependency chain the CPU cannot prefetch.

### Why the JDK chose this
- Heap allocation is already cheap, so the main goal of escape analysis is **not to save writes** but to eliminate loads/stores so values stay in registers (CPU registers, where computation is fastest), and to reduce the number of objects GC must collect.
- The price: analysis runs only **after inlining**, and when it infers wrongly the object must be "materialised" (recreated) again. HotSpot chooses to be conservative: if unsure, allocate.
- This is an optimisation, not a promise. The JLS (Java Language Specification — the formal definition of the Java language) promises nothing about whether an object lives on the heap.

### When escape analysis fails (more important than when it succeeds)
1. The target method is not inlined: too large, out of inlining budget, or called through an interface where the JVM sees several object types (not **monomorphic** — meaning not just a single runtime type at the call site; e.g. a {{List}} variable is sometimes an {{ArrayList}}, sometimes a {{LinkedList}}).
2. Stored into a field of another object: {{holder.p = new Point(...)}} — the holder outlives the method.
3. Placed into a collection or array, returned, assigned to a static field, or passed to another thread.
4. The object's identity is observed: {{getClass()}}, {{hashCode}}/default identityHashCode, {{==}} comparison between two local objects — the JVM must create a real object to answer correctly.
5. {{obj}} is used across loop branches with shapes different enough that C2 gives up.
6. {{synchronized (obj)}}: **lock elision** (removing the lock when the object does not escape) was once expected but is not applied widely by HotSpot/C2 as a reliable optimisation; do not write code that relies on the lock being removed. Biased locking (a lock biased to one thread) was disabled by default from JDK 15 and removed entirely in later releases.

### How to verify, not guess
~~~bash
java -XX:+PrintFlagsFinal -version | grep -i escape    # DoEscapeAnalysis = true (default)
java -XX:-DoEscapeAnalysis -jar bench.jar              # turn it off and compare two runs
~~~
- Most trustworthy: JMH (Java Microbenchmark Harness — the OpenJDK official benchmarking toolkit that helps you measure correctly when the JIT interferes) with the gc profiler ({{java -jar benchmarks.jar -prof gc}}), looking at the bytes-per-operation column. A loop that creates only local objects showing ~0 bytes/op means the allocation was removed.
- A simpler second approach: run the benchmark twice, once adding {{-XX:-DoEscapeAnalysis}}. A jump in time and allocation count proves the object was not on the heap before.
- Running with the interpreter or {{-Xint}} always allocates — do not draw conclusions from a run that has not warmed up (the phase where the JVM "warms up" so the JIT compiles hot code).

### In production
- A common symptom: high CPU, {{jcmd <pid> GC.heap_info}} shows heap churning strongly while retained size (the size of objects still referenced, so GC cannot reclaim them) stays flat — very many "die young" objects. JFR (Java Flight Recorder — the performance event recorder built into the JDK) has the sample events {{jdk.ObjectAllocationSample}} (JDK 16+) and {{jdk.ObjectAllocationInNewTLAB}} to see which object types are created most often.
- Design consequence: splitting logic into small methods and keeping value objects (2-3 field records) local inside a loop is often enough for the JIT to clean up for you; conversely, an object that goes into a map/list has a real cost.
- Pitfall: do not sacrifice readability just to avoid {{new}}, and do not trust the conclusion "Java allocation is free" — it is true for objects that do not escape, false for objects that escape through a field or collection.

> Senior tip: the answer that scores points is "the object is **not pushed down onto the stack**; the JIT **removes the allocation** when the reference does not escape the method, and it only does so after inlining". To verify, disable {{-XX:-DoEscapeAnalysis}} and compare, or measure bytes/op with JMH — do not answer by gut feeling.`,
    follow: [
      `Why does escape analysis depend on inlining, and how does a polymorphic interface call break it?`,
      `How does lock elision differ from biased locking, and what is the current status of each on JDK 17/21?`,
      `In a hot loop, should you replace a record/small object with primitives or trust the JIT? How do you measure to decide?`
    ]
  },
  'core-037': {
    q: `How is a lambda created at the bytecode level (invokedynamic + LambdaMetafactory)? How does its cost compare with an anonymous class, a MethodHandle, and reflection?`,
    a: `**Summary:** javac does **not** generate a separate class file for each lambda. It moves the lambda body into a synthetic method in the same class ({{lambda$main$0}}) and leaves behind an {{invokedynamic}} instruction (a bytecode instruction that "links" the call at runtime via a bootstrap) whose bootstrap is {{LambdaMetafactory.metafactory}}. The first execution of that instruction produces a hidden class implementing the functional interface; subsequent executions go through a fixed MethodHandle (a handle referencing a method, lighter than reflection), so the JIT can inline the lambda body like a direct call. That is why a lambda is cheaper than an anonymous class and much cheaper than {{Method.invoke}} (calling a method via reflection).

### Looking at the bytecode
~~~text
javap -p -c -v LambdaDemo.class
 0: invokedynamic #7, 0     // InvokeDynamic #0: apply
                             // descriptor: (String) -> Function

BootstrapMethods:
  0: LambdaMetafactory.metafactory(
       MethodHandles.lookup(),
       "apply",                                    // invokedName
       (String)Function,                          // invokedType
       (Object)Object,                            // samMethodType: after type erasure
       MethodHandle LambdaDemo::lambda$main$0,    // implMethod: where the real logic lives
       (String)String)                            // instantiatedMethodType: after generic inference
~~~
- {{samMethodType}}: the erased (after **type erasure** — Java removes generic information from bytecode at compile time) signature of the abstract method in the interface, e.g. {{Function.apply(Object)}} returns {{Object}}.
- {{implMethod}}: a MethodHandle pointing to the real method — either the synthetic {{lambda$0}} method, or the actual method referenced in {{String::length}}.
- {{instantiatedMethodType}}: the signature after inferring generics, so the generated class has a method returning {{String}} (a bridge method — a bridging method the compiler inserts to preserve polymorphism after erasure) even though the erased interface is {{Object}}.

### A lambda comes to life in 5 steps
1. javac creates a private method containing the lambda body right inside the calling class.
2. At the lambda expression site, javac emits {{invokedynamic}}; the descriptor takes the captured variables as parameters.
3. On the first run, the JVM calls the bootstrap: {{LambdaMetafactory}} builds a class implementing the interface, with fields for the captured variables and an {{apply}} method that calls {{implMethod}}. From JDK 15 (JEP 371 - Hidden Classes) this is a **hidden class** (a hidden class: not registered by name in the ClassLoader, cannot be created via ordinary name-based reflection, and can be unloaded so it does not bloat **Metaspace** — the native memory area that holds class metadata).
4. The bootstrap returns a {{CallSite}} (an object holding the target method for invokedynamic to call) whose target is a "factory" MethodHandle; the site is initialised so later runs **do not** run the bootstrap again.
5. Because that target is constant, C2 treats the call as a direct call and can inline the lambda body.

### Capture and this
| Form | Parameter(s) of invokedynamic | Consequence |
|---|---|---|
| {{s -> s.length()}} | none | no fields; the site returns a reused instance, the JIT can constant-fold (compute ahead of time because the value never changes) |
| {{s -> s.length() + off}} | {{off}} | each evaluation creates an object carrying {{off}} (1 million loop iterations = 1 million objects; if they do not escape, escape analysis may remove them) |
| {{s -> prefix + s}} (uses an instance field) | {{this}} as the first parameter | holds a reference to the enclosing instance — like an inner class, a real source of memory leaks (the enclosing object stays alive even when no longer needed) |
| {{String::length}} | no synthetic method | {{implMethod}} points straight at the real method, the easiest to inline |
| anonymous class | one class file on disk | always has its own class, dispatch via the interface, harder per-class profiling |

### Comparing the cost of calling the same logic
| Approach | What happens on every call |
|---|---|
| Direct call | a single invoke already devirtualised (the JIT determined the exact implementation and removed the virtual-table lookup), inlines freely |
| Lambda / method reference (site initialised) | one call to a constant MethodHandle; after inlining, the same as above |
| {{MethodHandle.invoke}} | if the signature does not match exactly, an extra type-adaptation step (converting parameter/return types); still inlinable when the handle lives in a {{static final}} |
| {{Method.invoke}} | access checks, packing arguments into an {{Object[]}}, boxing (wrapping a primitive as an object, e.g. {{int}} -> {{Integer}}) — the most expensive on a hot path (from JDK 18 core reflection runs on MethodHandle, so the gap has narrowed) |
| Anonymous class | object allocation + interface dispatch (looking up the method via the virtual/interface table) |

### In production
- Stack trace: a line like {{com.example.Foo$Lambda$14/0x...lambda$apply$0(Foo.java:57)}} tells you which class the lambda belongs to and which line. There is no .class file on disk; to read the code, open {{Foo.class}} with javap/an IDE and look at the {{lambda$...}} method.
- A lambda is **not** serialisable unless the functional interface extends {{Serializable}}; even when it is serialisable, the form depends on internal implementation details — never put a lambda into a protocol or a config file.
- A lambda has no identity: {{a.equals(b)}}/{{a == b}} between two "identical" lambdas is meaningless; do not use a lambda as a map key.
- This is the technique mapping libraries use to replace {{Method.invoke}} on hot paths: compile a getter/setter into a {{Function}} once with {{LambdaMetafactory}} and reuse it thousands of times.
- A flame graph (a flattened column chart from a sampling profiler, showing which functions consume the most CPU) with many {{java.lang.invoke.LambdaForm$}} frames means the path through MethodHandle has not been folded into a direct call — usually because the handle is not a constant.

> Senior tip: two points that separate a real senior from someone who just knows how to write a lambda: (1) a lambda **does not generate a class per execution** — the class is built only once per call site, and (2) a method reference is not "syntactic sugar" — it is an {{implMethod}} pointing straight at the real method, so it is often inlined better than a lambda with a synthetic method.`,
    follow: [
      `Why is a method reference often inlined better than an equivalent lambda, and when is the difference zero?`,
      `Which specific problem did hidden classes (JEP 371) solve for runtime-generated lambda classes?`,
      `How would you write a JMH benchmark comparing Method.invoke, MethodHandle, and LambdaMetafactory so the conclusion is trustworthy?`
    ]
  },
  'core-038': {
    q: `How does the JVM's class initialisation mechanism (static initialiser) work, and why can two classes whose static blocks call each other deadlock? How do you detect and break the cycle?`,
    a: `**Summary:** each class is initialised **exactly once, by one thread**, under a dedicated lock on the class (the initialisation lock). Static blocks ({{static}} blocks that run when the class is loaded) and static field initialisers (initial values of static fields) are merged by the compiler into the {{<clinit>}} method. That lock is both what makes the Holder singleton idiom thread-safe **without synchronised**, and what causes a deadlock (two threads waiting for each other forever) right at startup when two classes initialise each other in a cycle from two threads.

> Terminology: **ClassLoader** is the JVM component that loads bytecode (.class) into a {{Class}} object. **constant pool** is the constant table inside a .class file (strings, numbers, method/field references). **happens-before** (JMM — Java Memory Model) is a relationship guaranteeing that one thread sees another thread's writes when properly synchronised.

### The three life phases of a class
1. **Loading**: the class loader finds the bytecode and creates a {{Class}} object.
2. **Linking** (verification + preparation): preparation assigns **default values** (0, null, false) to static fields; compile-time constants already have their values in the constant pool, so reading them does not trigger initialisation.
3. **Initialization**: runs {{<clinit>}} — this is when static blocks and static field initialisers run, in the order they appear in the source file.

| Action | Runs {{<clinit>}}? |
|---|---|
| {{new X()}}, calling a static method of X, reading/writing a non-constant static field | Yes |
| Reading {{static final int MAX = 5}} (a compile-time constant) | No — the value was inlined into the calling class |
| {{Class.forName("X")}} and {{Class.forName("X", false, loader)}} | Yes / No (the initialise parameter) |
| Initialising a subclass | Yes, parent first, recursively |
| Taking {{X.class}}, comparing class names | No |
| Creating an array {{new X[3]}} | No (the array does not initialise its elements) |

### The initialisation algorithm (JLS 12.4.2, simplified)
1. The thread synchronises on the {{Class}} object of the class to initialise — HotSpot keeps a per-class mutex.
2. Class already Initialised? Return immediately. This is the fast path that keeps the static block from running again on a later {{new}}.
3. The class is **currently being initialised** by this same thread? Let it through (re-entrant) — the source of the default-value traps.
4. The class is being initialised by another thread? Wait on that lock.
5. Nobody is initialising it: mark "initialising by this thread", initialise the parent class recursively, run {{<clinit>}}, set Initialised, release the lock.
- A bonus: any thread reading a static field after the class is Initialised **sees** the values written by {{<clinit>}} without needing {{volatile}}, because the JLS defines a happens-before here. The Holder idiom is safe because of this.

### Two-thread deadlock
~~~java
class Alpha { static { Beta.prep(); } static int size = 1; static void prep() { } }
class Beta  { static { Alpha.prep(); } static int size = 1; static void prep() { } }
// T1 touches Alpha.size first; T2 touches Beta.size first
~~~
T1 holds Alpha's init lock then calls {{Beta.prep}} → needs to init Beta → blocks on the lock T2 holds. T2 holds Beta's lock then calls {{Alpha.prep}} → blocks on Alpha's lock. The lock cycle **does not appear in your code** as any {{synchronized}}, so there is no object lock to grep for.

~~~text
jstack excerpt (wording varies by JDK version):
"pool-1-thread-1" BLOCKED
   - waiting for the initialization of class Beta ... held by "pool-1-thread-2"
"pool-1-thread-2" BLOCKED
   - waiting for the initialization of class Alpha ... held by "pool-1-thread-1"
~~~

### Common traps
- {{static final int X = compute();}} is **not** a compile-time constant, so it still triggers {{<clinit>}}; only a literal like {{= 5}} is inlined.
- {{<clinit>}} throws: the first time you see {{ExceptionInInitializerError}} (with a cause), every time after you see {{NoClassDefFoundError: Could not initialize class com.x.Foo}} **with no cause**, and the class stays in the Failed state until that ClassLoader dies — it does not "heal itself".
- A static block spawns a new thread and that thread touches its own class: almost certainly a deadlock, because the new thread waits for init to finish while init waits for the new thread.
- Enum constants are created right inside the enum class's {{<clinit>}}, so an enum whose static block calls into another class is a seed for a cycle.

### In production
- Symptom: the app starts then hangs, or the first request stalls for 20-30 seconds (because {{<clinit>}} calls DNS/DB/file reads) while later requests are unusually fast.
- Investigation: {{jstack <pid>}} (a JDK tool that prints stack traces of all threads) or {{jcmd <pid> Thread.print}} to see which thread is "waiting for the initialization of class"; {{-Xlog:class+load=info}} shows the order and source of class loading. When the log shows only {{NoClassDefFoundError}}, find the **first** {{ExceptionInInitializerError}} after the deploy time.
- Breaking the cycle: extract shared constants/statics into a third class so the graph becomes a DAG (directed acyclic graph); use the Holder idiom for lazy singletons; move heavy init (drivers, config, connections) to {{@PostConstruct}}/{{InitializingBean}} (Spring lifecycle hooks that run after the bean is created) or to a supplier the application controls; in frameworks, use {{Class.forName(name, false, loader)}} to **avoid** init, then deliberately initialise in the desired order.
- Prevention: one review rule is enough — "a static block must not call into another class and must not do I/O". The compiler folds field initialisers into {{<clinit>}} too, so inspecting {{<clinit>}} covers both.

> Senior tip: if you can only answer "a static block runs once", you are at mid level. This question separates seniors on three points: the init lock is per-class and re-entrant per thread, it establishes a happens-before for static fields, and when {{<clinit>}} fails every later attempt yields only {{NoClassDefFoundError}} with no cause — the detail that determines how you read a startup-incident log.`,
    follow: [
      `Why is the Holder idiom thread-safe without {{synchronized}}? Relate it to the happens-before of class init.`,
      `After an {{ExceptionInInitializerError}}, why does {{NoClassDefFoundError}} lose the cause, and how do you recover without restarting?`,
      `How does the init/locking problem change when multiple ClassLoaders load the same class name?`
    ]
  },
  'collections-031': {
    q: `How does a {{HashMap}} resize work internally? Why is capacity always a power of two, why does Java 8 not recompute the hash when moving the table, and how does the lo/hi split work?`,
    a: `**Summary:** when {{size}} exceeds {{threshold = capacity × loadFactor}}, HashMap creates a new array **twice as large** and splits each old bucket into two lists: **lo** (the new hash bit = 0) stays at the old index, **hi** (the new bit = 1) moves to old index + old capacity. There is no need to call {{hashCode}} again, because the new index differs from the old one by exactly the single bit just added to the mask.

> Terminology: **bucket** is a cell in HashMap's {{table}} array, holding a chain (list) or a tree of entries with the same index. **hash collision** is when two different keys produce the same bucket index. **load factor** (default 0.75) is the maximum {{size/capacity}} ratio before a resize. **compressed oops** is a JVM mode that compresses object pointers to 4 bytes (instead of 8) on heaps smaller than ~32 GB.

### Why capacity is always a power of two
- The bucket index = {{(n - 1) & hash}}. When {{n = 2^k}}, {{n - 1}} is a mask of the k lowest 1-bits, so the AND gives the same result as modulo but costs just one CPU instruction.
- If {{n}} were not a power of two, many high bits of the hash would be discarded entirely and collisions would spike. The price you pay: the table cannot be "just right" — capacity jumps 16, 32, 64…, and {{new HashMap<>(100)}} actually takes a table of 128 because {{tableSizeFor}} rounds up.
- Hash spreading ({{h ^ (h >>> 16)}}) exists so the high bits still influence the result while the table is small — this is why a hand-rolled hash that only uses the first few bytes of a string collides very easily.

### Resize, step by step
~~~java
// Idea inside Node[] resize() in Java 8+
for (int j = 0; j < oldCap; ++j) {
    Node<K,V> e = oldTab[j];
    if (e == null) continue;
    oldTab[j] = null;
    if (e.next == null) {
        newTab[e.hash & (newCap - 1)] = e;      // single-node bucket: just move it
    } else if (e instanceof TreeNode) {
        // split: split the tree into lo/hi; if either side has <= 6 nodes, untreeify to a list
    } else {
        Node<K,V> loHead = null, loTail = null, hiHead = null, hiTail = null;
        for (Node<K,V> x = e; x != null; x = x.next) {
            if ((x.hash & oldCap) == 0) appendLo(x);   // new bit 0 -> stays at j
            else                         appendHi(x);  // new bit 1 -> goes to j + oldCap
        }
        newTab[j] = loHead;
        newTab[j + oldCap] = hiHead;
    }
}
~~~
- The condition {{x.hash & oldCap}}: when the table grows from {{n}} to {{2n}}, the mask gains exactly bit {{log2(n)}}. A node with that bit 0 keeps its index, bit 1 shifts it by exactly {{oldCap}} slots. This is the whole reason **the hash is not recomputed**.
- The two lists are appended, so the relative order inside each list is preserved — unlike Java 7 (which inserted at the head and reversed the list).
- Cost: one AND and a few pointer assignments per node, O(size + capacity) total.

~~~text
capacity 8 -> 16, looking at bucket index 3 (oldCap = 8, the new bit is bit 3)
oldTab[3]:  A(h=...00011) -> B(h=...00111) -> C(h=...10011) -> D(h=...10111)
newTab[3]:  A -> B            (new bit = 0, original order)
newTab[11]: C -> D            (11 = 3 + 8)
~~~

### Java 7 and the resize lesson
| | Java 7 | Java 8+ |
|---|---|---|
| How a new node is placed | recompute the index then insert at the head (reversing order) | lo/hi split, append, no hash recomputation |
| Famous bug | two threads resizing concurrently created a cycle in the list, {{get()}} ran forever and pegged CPU at 100% | no more cycle, but nodes are still lost because {{put}} is not atomic |
| Long bucket | plain list, O(n) on collision | resize if capacity < 64, treeify if already >= 64 |

### Where the 0.75 load factor sits in the math
- {{threshold = capacity * 0.75}}. To hold N elements without resizing, capacity must be the smallest power of two such that {{capacity * 0.75 >= N}}.
- Example: 100,000 elements: 131072 × 0.75 = 98304 < 100000, so the real table is 262144 slots ≈ 1 MB of reference array (4 bytes/slot with compressed oops). For 8 million elements, capacity 2^23 slots ≈ 32 MB **for the table array alone**.
- A handy initial-capacity formula: {{new HashMap<>((int)(N / 0.75f) + 1)}}; writing {{new HashMap<>(N)}} still resizes because N was not divided by the load factor.
- HashMap's Javadoc says 0.75 is the time/space trade-off for most cases: lowering it to 0.5 shortens chains but costs more memory and cache; it is worth considering only when profiling points at {{HashMap.getNode}}.

### In production
- Symptom: a thread hogs CPU, the flame graph shows {{java.util.HashMap.resize}}, plus a spike of large-array allocations. With G1, a table array larger than half a region is a **humongous allocation** (a "giant" allocation — an object too large that must be placed separately, which GC handles poorly) — visible via {{jcmd <pid> GC.heap_info}} and {{-Xlog:gc*}} logs.
- Warm-up (startup phase): a service loading a few hundred thousand entries at startup will resize ~18 times in a row if capacity is not set; setting it correctly often cuts boot time and the number of young GCs (GC of the young generation, collecting short-lived objects) noticeably.
- Pitfall: resize is **not** atomic; one thread resizing while another writes means lost data and a wrong {{size}} — Java 8 removed the cycle bug, not the synchronisation bug.
- Pitfall: if the hash distribution is poor, resizing does not help; build a bucket histogram on a sample of keys before throwing money at capacity.

> Senior tip: this question wants to hear three things: the bit mask explains why the index shifts by exactly oldCap, the order is preserved so no rehash is needed, and the Java 7 lesson to prove you understand why {{HashMap}} is still not thread-safe even though the algorithm is safer.`,
    follow: [
      `What is the exact condition that lets the lo/hi split work without recomputing hashCode?`,
      `When does untreeify happen during resize, and why does it not happen on a normal remove?`,
      `How would you set the initial capacity for a 5-million-entry map, and what is the impact on GC?`
    ]
  },
  'collections-032': {
    q: `What does a Spliterator do, and why is parallelStream on a LinkedList or on a stream built from an Iterator no faster (and sometimes slower)?`,
    a: `**Summary:** {{Spliterator}} (split + iterator) is the API for splitting a data source in two so a ForkJoinPool (a work-stealing, divide-and-conquer thread pool) can run in parallel. Each source describes its characteristics ({{SIZED}}, {{SUBSIZED}}, {{ORDERED}}, {{CONCURRENT}}, {{DISTINCT}}, {{NONNULL}}) and decides whether it can be split in {{trySplit()}}. {{ArrayList}} splits in O(1) by index; {{LinkedList}} must walk to the middle element on every split through scattered pointers (pointer chase — jumping by pointer, prone to cache misses); a source from an {{Iterator}} has {{trySplit}} return null and your "parallel" runs as exactly one task.

### How a parallel stream runs
1. {{stream.parallel()}} takes the source's {{spliterator()}}.
2. A task calls {{trySplit()}} to get half the work and hand it to another task (work stealing in {{ForkJoinPool.commonPool()}}); the remaining half keeps splitting until the pieces are small enough.
3. Each task {{tryAdvance}}s over its own piece, then results are merged with {{combine}}; with {{forEach}} there is no merge and also no ordering guarantee.
- Speed therefore depends on **three** things: the cost of splitting, the cost of combining, and the real work per element. Saying "parallel = n times faster" ignores the first two.

### Split cost of familiar sources
| Source | What trySplit does | Split cost | Typical characteristics |
|---|---|---|---|
| {{ArrayList}}, array | cuts the index range [origin, middle) | O(1) per piece | SIZED, SUBSIZED, ORDERED |
| {{HashMap}}, {{HashSet}} | scans nodes to the middle of the table | O(nodes scanned) per piece | SIZED |
| {{LinkedList}} | calls {{node(index)}} to find the middle node | O(k) per split, repeated over split levels | SIZED, ORDERED |
| {{spliteratorUnknownSize(iterator, 0)}} | returns null: cannot split | cannot split | not SIZED |
| {{Stream.iterate}}/{{generate}} without {{limit}} | no size to split on | pointless, may throw IllegalStateException | not SIZED |
| {{ConcurrentHashMap}} | splits by bucket range | cheap, safe while other threads write | CONCURRENT |

### Why parallel on LinkedList is often slower
- Splitting the list in half needs the middle node, and {{node(i)}} walks from the head or tail whichever is closer → each split costs ~k/2 pointer-chase steps.
- With p pieces, the total split cost is ~O(n log p) pointer traversals, while a sequential {{for}} loop walks the list **once** in O(n) and prefetches well.
- Put another way: every "split" on a {{LinkedList}} is a walk through the heap. Parallel pays off only when the work per element is large enough relative to the split cost, e.g. a 1 ms API call per element.
- A source built from an {{Iterator}} (JDBC stream, {{Scanner}}) never gets faster with parallel because {{trySplit}} returns null: you only pay the task-management overhead.

### Writing a correct Spliterator yourself
~~~java
final class RangeSpliterator implements Spliterator.OfLong {
    private long from, to;                       // half-open [from, to)
    RangeSpliterator(long from, long to) { this.from = from; this.to = to; }

    @Override public Spliterator.OfLong trySplit() {
        if (to - from < 1024) return null;       // stop splitting when the piece is small enough
        long mid = (from + to) >>> 1;
        long lo = from; from = mid;              // keep the AFTER half for yourself
        return new RangeSpliterator(lo, mid);    // return the BEFORE half
    }
    @Override public boolean tryAdvance(LongConsumer a) {
        if (from >= to) return false;
        a.accept(from++);
        return true;
    }
    @Override public long estimateSize() { return to - from; }
    @Override public int characteristics() { return SIZED | SUBSIZED | ORDERED | DISTINCT | NONNULL; }
}
~~~
- The most commonly broken contract: {{trySplit}} must return the **leading half** — exactly the part the original spliterator would encounter next — and keep the trailing part. Doing it the other way around makes an ordered stream's order wrong.
- Declaring {{SIZED}}/{{SUBSIZED}} is a promise that "estimateSize is exact". Breaking that promise makes the split algorithm stop in the wrong place: split too little and you get no parallelism, split too deep and you get thousands of empty tasks.
- {{CONCURRENT}} may only be declared when the source truly tolerates concurrent writes, because the stream uses it to decide whether to copy the source.

### In production
- {{ForkJoinPool.commonPool()}} is a pool shared by the **whole JVM**: a long {{parallelStream}} running on a request thread steals workers from default {{CompletableFuture.supplyAsync}} calls. Check busyness with {{commonPool().getActiveThreadCount()}}, change parallelism with {{-Djava.util.concurrent.ForkJoinPool.common.parallelism}}.
- In a container, the available CPU count follows the limit; a 1-CPU limit means "parallel" only adds overhead and worsens the p99 of other requests.
- Quick verification: change {{.parallel()}} to {{.sequential()}} and measure again on the same data — if it gets faster, the problem is splitting/combining, not a lack of CPU.
- Pitfall: accumulating into a shared {{ArrayList}}/{{HashMap}} from multiple pieces; you must use {{collect}} with a correct supplier and combiner.

> Senior tip: before turning on parallel, answer three questions: can the source be split (what does its {{trySplit}} do), how much work is each element worth, and is the combine step expensive. For in-memory data, {{ArrayList}} + a sequential for loop is often faster than parallel on a {{LinkedList}}; for large-scale parallelism, use a dedicated executor instead of hogging the common pool.`,
    follow: [
      `If you declare SIZED but estimateSize is inaccurate, how does the split algorithm break?`,
      `Why can a stream built from an Iterator/JDBC never get faster with parallel enabled?`,
      `How would you design a spliterator for an expensive-to-split source (a skip-list snapshot, a time range)?`
    ]
  },
  'collections-033': {
    q: `What is inside a HashMap bucket that has been treeified? Why does treeifying only guarantee O(log n) when the key is Comparable, and how do you detect that your map is suffering hash collisions in production?`,
    a: `**Summary:** treeifying turns a list bucket into a red-black tree (a self-balancing binary tree that guarantees O(log n) find/insert/delete) of {{TreeNode}}s, but the tree orders by **hash first, key second**. So the O(log n) guarantee is only certain when the key implements {{Comparable}} (a comparison interface, {{compareTo}}); if hashes are equal and the key is not Comparable, the JVM uses {{tieBreakOrder}} (based on identityHashCode — an object identity code, independent of the overridden {{hashCode()}}) to insert, and when searching it may have to probe both branches — the worst case is still O(n). Treeifying is a safety net, not a vaccine against HashDoS (denial-of-service by sending many keys that cause hash collisions).

### The real structure of a bin
- {{HashMap.Node}}: hash, key, value, next (4 fields, ~32 bytes with compressed oops).
- {{HashMap.TreeNode}} extends {{LinkedHashMap.Entry}} (which is already a {{Node}}), adding {{parent}}, {{left}}, {{right}}, {{prev}}, {{next}}, and the {{red}} flag → ~48-56 bytes per element, so a tree bin costs nearly twice a list bin.
- The {{prev}}/{{next}} pointers still link all nodes in the bin into a list, so iteration order is unchanged and untreeifying is cheap.

The comparison order when inserting and when searching:
~~~text
1) different hashes         : smaller hash -> left branch, larger -> right branch
2) equal hashes, key Comparable    : compareTo decides the direction
3) equal hashes, key not Comparable: tieBreakOrder(a, b) compares by System.identityHashCode
   -> step 3 only decides the INSERT position, it does not answer "found"
   -> when searching, the JVM may have to try the other branch too: it can degrade to scanning almost the whole bin
~~~

### The three thresholds and why they exist
| Threshold | Value | Meaning | When it has no effect |
|---|---|---|---|
| TREEIFY_THRESHOLD | 8 | a long enough list is considered for conversion to a tree | when capacity < 64 |
| MIN_TREEIFY_CAPACITY | 64 | below this, resizing is cheaper and spreads entries better than treeifying | always yields while the table is small |
| UNTREEIFY_THRESHOLD | 6 | when resize splits a bin and one side has <= 6 nodes, convert it back to a list | the bin is still longer than 6 |
- The number 8 comes from probability: with an ideal hash, the node count per bucket follows a Poisson distribution, and the probability of a bucket having 8 or more nodes is ~**6 × 10⁻⁸** (a figure written right in the HashMap source comment). In other words, with normal data you **never** see a tree bin; treeifying exists to tolerate a bad hash.
- Two different thresholds (8 and 6) prevent thrashing, where adding/removing around a single threshold would keep flipping the JVM between list and tree. Untreeifying happens only **during resize**, so a normal {{remove}} does not turn a bin back into a list.

### When the tree does not save you
1. A key whose {{hashCode}} returns a constant (an attacker picks strings so their hashes collide — with {{String.hashCode}} only a few characters are enough to craft colliding strings at will). When inserting a new key, {{tieBreakOrder}} still helps the tree find a position in O(log n); but when searching ({{get}}/{{containsKey}}) a non-Comparable key with equal hashes, the JVM cannot use {{compareTo}} to pick a single direction and may have to probe the other branch — the cost can degrade significantly. HashMap's Javadoc states clearly that the O(log n) guarantee requires a Comparable key.
2. Memory: if every bucket becomes a tree, the map's heap is nearly double that of list bins for the same number of elements.
3. Java does **not** randomise {{String.hashCode}} per JVM (unlike the HashDoS defence in PHP/Perl), so attacks via String keys are a real risk, not theoretical.
4. {{ConcurrentHashMap}} also treeifies with similar thresholds, but it locks on the bin's head node: the tree does not reduce contention on a hot key, and it does not turn an expensive {{computeIfAbsent}} into a cheap one.

### In production: detecting and measuring
- There is no standard metric for "bucket length". A practical approach: sample keys and build a histogram using HashMap's own formula.
~~~java
int cap  = Integer.highestOneBit(Math.max(16, (int)(expected / 0.75f)) << 1);  // power-of-two capacity
int mask = cap - 1;
Map<Integer, Integer> byBucket = new HashMap<>();
for (String k : sampleKeys) {
    int h = k.hashCode();
    byBucket.merge((h ^ (h >>> 16)) & mask, 1, Integer::sum);   // HashMap's exact hash + mask
}
int longest = byBucket.values().stream().mapToInt(Integer::intValue).max().orElse(0);
// compare longest with sampleKeys.length / cap: a big gap means a poor distribution, prone to treeifying
~~~
- Signs on the server: high CPU with no GC increase, p99 growing with map size even though "get is O(1)", a flame graph pointing at {{HashMap.getNode}}, {{HashMap.TreeNode.findTreeNode}}, and {{String.equals}}.
- Heap dump (Eclipse MAT, VisualVM): a class histogram showing many {{java.util.HashMap$TreeNode}} instances is evidence bins have become trees — and treeifying on real data almost certainly means your {{hashCode}} is poorly distributed.
- Mitigation, in order of reliability: use internal ids ({{Long}}, {{UUID}}) as keys instead of user-chosen strings; cap the entry count with eviction ({{LinkedHashMap}} with {{removeEldestEntry}}, or a dedicated cache); fix {{hashCode}} for composite keys (use a record or {{Objects.hash}} correctly); if you must use strings from input, hash them once (e.g. SHA-256 then take 8 bytes) to spread the distribution evenly and remove the ability to choose strings deliberately.

> Senior tip: this question scores on two details few people know: **the tree is only fast when the key is Comparable**, and **treeifying costs nearly twice the memory**. So do not answer "Java 8 fixed HashDoS"; answer "Java 8 turned O(n) into O(log n) conditionally, and the root of the problem is letting user input decide the keys of an unbounded map".`,
    follow: [
      `Why does UNTREEIFY happen only during resize and not during remove, and what is the consequence for a map with many deletions?`,
      `What are the prev/next list pointers on a TreeNode for?`,
      `How would you design a composite key for a 10-million-entry map to be both fast and avoid treeifying?`
    ]
  }
});
