/*
 * English translation of js/data/lessons-jvm.js — task T456. Format: js/core/i18n.js (content overlay).
 * ids: lesson-jvm-001 lesson-jvm-002
 */
App.i18n.content({
  'lesson-jvm-001': {
    title: 'Heap and four kinds of references: why a static Map keeps objects forever',
    goals: [
      'Describe which regions the heap is divided into and how an object travels through them',
      'Distinguish strong, soft, weak and phantom references and know which kind to use for a cache',
      'Explain how {{WeakHashMap}} works and why a value that points back to the key keeps the entry from ever being removed',
      'Recognise memory leaks through static collections, {{ThreadLocal}} and classloaders',
    ],
    body: `### The heap is not one flat block
HotSpot divides the heap into regions by object **age**. Knowing which region holds what helps you read GC logs and size the heap instead of guessing.

- **Young generation** consists of **Eden** and two **Survivor** spaces (S0, S1). Most objects are born in Eden by bumping a pointer inside a **TLAB** (Thread-Local Allocation Buffer), which is almost free. When Eden fills up, a **minor GC** copies the surviving objects into a Survivor space and increments their age; objects that survive several collections are **promoted** to the old generation.
- **Old generation** holds long-lived objects: caches, singletons, connection pools. This is where **major/full GC** does its work, and also where memory leaks show up most clearly: heap usage keeps growing across full GCs without going down.
- **Metaspace** (since Java 8, replacing PermGen) holds class metadata (method structures, bytecode, constant pool). It is **not** part of the Java heap but native process memory, so {{-Xmx}} does not limit it (use {{-XX:MaxMetaspaceSize}} instead). Loading too many classes produced by proxies, script engines or hot reload can fill up metaspace.

The important point: **GC does not count references; it finds objects with no path from a GC root**. An object still referenced from a live local variable, a static field, JNI or a held monitor stays alive even if nobody uses it any more. That is the root of every memory leak in Java.

### The four "strengths" of a reference
| Kind | When it is cleared | Used for |
|---|---|---|
| **Strong** | When there is no path from a GC root | Default; local variables, ordinary fields |
| **Soft** | Up to the GC's decision under memory pressure; **guaranteed** to be cleared before an {{OutOfMemoryError}} is thrown | Memory-sensitive caches |
| **Weak** | At the **next GC that scans the region holding the object** if only a weak reference remains | {{WeakHashMap}}, canonical maps, metadata |
| **Phantom** | Does not keep the object alive; enqueued once the object is unreachable in every other way | Knowing for sure the object is dead so native resources can be cleaned up via {{ReferenceQueue}} |

A strong reference is just a normal variable. The other three are classes in {{java.lang.ref}}, all with a {{get()}} method that returns the object again (null if it has been cleared) — except {{phantom.get()}}, which **always** returns null per the spec. The reason: a phantom is used to know the object is **completely dead**, not to get it back. The JDK uses this mechanism for the {{Cleaner}} of {{DirectByteBuffer}} to release off-heap memory.

~~~java
Object strong = new Object();                         // never cleared while the variable is alive
SoftReference<byte[]> soft = new SoftReference<>(new byte[10_000_000]);
WeakReference<Object> weak = new WeakReference<>(new Object());
ReferenceQueue<Object> queue = new ReferenceQueue<>();
PhantomReference<Object> phantom = new PhantomReference<>(new Object(), queue);
~~~

A point that comes up very often in interviews: **a soft reference does not guarantee your cache still has data**. The spec promises only one thing: every soft reference is cleared before the JVM throws OOM. When it is cleared is up to the GC. HotSpot uses an LRU-like policy: a soft reference that has not been {{get()}} within {{SoftRefLRUPolicyMSPerMB}} (default 1000 ms) times the number of free heap MB is cleared. The consequence: the fuller the heap, the earlier soft references are cleared — exactly when the system is under load; conversely, a large soft cache makes each GC do more work and the heap always looks nearly full. That is why production caches use a library such as Caffeine with an explicit **maximum size** and **expiry**, instead of relying on soft references.

### WeakHashMap on the inside
{{WeakHashMap}} looks like {{HashMap}} but the keys are **weak**. Each entry extends {{WeakReference}} pointing at the key, and the map holds a {{ReferenceQueue}}. When the key has no more strong references, the GC clears the referent and pushes the entry into the queue. Before every {{get}}/{{put}}/{{size}} operation the map calls {{expungeStaleEntries()}} to clean up dead entries. That is why you can see the map shrink itself without calling any remove method.

Two deadly traps:

1. **The key must really have no outside holders.** If another field, another list or another cache still points at the key, the entry is never cleaned up. The subtlest case: the key is a String literal ({{"abc"}} is interned and lives as long as the class) or a small {{Integer}} from {{Integer.valueOf}} (cache -128..127). These keys never die, so using them as keys of a {{WeakHashMap}} is pointless.
2. **The value points back to the key.** The map holds the value by strong reference. If the value has a field pointing at the key, the key is always reachable along map → entry → value → key, so the weak reference is never cleared. The extreme case is {{map.put(session, session)}}: the value is the key, and the entry lives forever. This is a very hard bug to spot when the value is a large object that keeps a reference to the key for logging or callbacks. The {{WeakHashMap}} javadoc suggests: if the value must know its key, wrap the value in a {{WeakReference}}.

{{WeakHashMap}} is **not thread-safe**, has no size bound and no hit/miss stats, and whether an entry disappears depends on the GC, so it is not suitable as a primary cache. It fits **canonical maps**: mapping a temporary object to metadata without keeping the object alive.

### Why a static Map is the classic memory leak
A {{static}} field is a **GC root**: it lives as long as the classloader, usually for the whole application lifetime. Therefore:

~~~java
class SessionRegistry {
    // static + HashMap + strong key = every logged-out Session stays here
    private static final Map<String, Session> SESSIONS = new HashMap<>();

    static void register(Session s) { SESSIONS.put(s.id(), s); }
    // missing remove on logout or session expiry
}
~~~

After a few days {{SESSIONS}} holds every session ever created, dragging along the user, permissions and connections. The heap grows steadily, full GC frees nothing, and eventually {{java.lang.OutOfMemoryError: Java heap space}}. The same mechanism applies to:

- {{ThreadLocal}} in a thread pool: threads are long-lived, values in the {{ThreadLocalMap}} are never removed unless you call {{remove()}}.
- Listeners/callbacks registered without unregistering: a static subject holds the listener, the listener holds the view/activity.
- Classloader leaks: a static field holds a class of the old webapp, so the whole classloader cannot be unloaded.

The fix is not "use weak for everything" but **lifetime management**: bounded caches with a TTL, symmetric register/unregister, {{try/finally}} calling {{remove()}} for ThreadLocals, and inspecting the heap with {{jcmd <pid> GC.heap_info}}, {{jmap -histo:live}}, and heap dumps with {{-XX:+HeapDumpOnOutOfMemoryError}}. In MAT, look at the **dominator tree** and **retained size** to find which object really holds a whole tree.

> A trick for reading a heap dump: find the class with an abnormal instance count, then look at "Path to GC Roots". If the path goes through a static field of a business class, it is almost certainly a leak, not a GC bug.

### Interview relevance
Interviewers often ask: "Why does memory still grow when I use WeakHashMap as a cache?", "What is the difference between SoftReference and WeakReference?", "Tell me about a memory leak you have encountered". A good answer talks about **reachability from a GC root**, not just reciting definitions. The exercise below has you build a cache using weak values + a {{ReferenceQueue}}, exactly the mechanism {{WeakHashMap}} uses internally.`,
    exercises: [
      {
        title: 'A weak-value cache that cleans itself up with ReferenceQueue',
        prompt: `Complete {{WeakValueCache<K, V>}}: values are held by **weak reference**, so when nobody uses a value any more the GC can reclaim it and the cache cleans up the entry by itself.

Requirements:
- {{get(key)}}: call {{drain()}} first; if the entry still has a value, return that value (do not call the loader). If there is no entry or the value has been cleared, call {{loader.apply(key)}}; if the loader returns null, do **not** store anything and return null; otherwise create a new entry, increment {{loads}}, and return the value.
- {{drain()}}: take every reference the GC has pushed into the queue, remove exactly the matching entry from the map (using the {{key}} stored in the entry), and return the number of entries removed. It must not remove a new entry by mistake if the key has been reloaded.
- {{size()}}: call {{drain()}} then return the number of entries.
- {{loads()}}: the number of times the loader was actually called and returned a non-null value.
- {{ref(key)}}: return the entry so a test can call {{enqueue()}} manually.

{{Entry}} is already declared: it extends {{WeakReference<V>}} and also stores {{key}}.`,
        hints: [
          'In {{get}}, {{drain()}} must run before reading the map so a dead entry is not reused.',
          'The queue returns {{Reference<? extends V>}}; cast it to {{Entry<?, ?>}} to get {{key}} back, then use {{entries.remove(key, entry)}} — the two-argument remove so a new entry is not removed by mistake.',
          'Only increment {{loads}} when the loader returns a non-null value, because null means nothing was cached.',
        ],
        explain: `The key point is the **two-way link**: the map holds keys strongly for lookup, but values are only held weakly. When nobody uses a value any more, the GC clears it and pushes the {{Entry}} into the {{ReferenceQueue}}. On the next {{get}}/{{size}}, {{drain}} takes the entry out and removes it from the map. This is exactly the mechanism {{WeakHashMap}} uses for **keys**, only with the weak direction reversed.

Common mistakes:
- Using one-argument {{entries.remove(e.key)}}: if the key has been reloaded with a new entry, you delete the new entry. {{remove(key, value)}} only removes when the key-entry pair matches.
- Forgetting {{drain}} in {{get}}: the value is dead but the map still holds the entry, so {{size}} lies and the entry memory (not the value) keeps accumulating.
- Thinking weak values make a good-enough cache: entries can vanish at any time and the hit rate is unstable. Production uses caches with a **max size + TTL**; weak is only for avoiding retention of unneeded objects.

About the test: the test calls {{enqueue()}} manually to simulate the GC clearing the value and pushing the entry into the queue (since Java 9, {{enqueue()}} also clears the referent). Calling {{System.gc()}} would be nondeterministic, because the JVM is not required to run GC immediately. The last test simulates a real situation: the GC clears the value, the cache reloads a new entry for the same key, and only then does the old entry reach the queue; if {{drain}} removed by key, the new entry would be lost.

A note symmetrical to {{WeakHashMap}}: here the weak side is the **value**, so if anyone holds the value strongly (for example the key or another object pointing at the value), the value is never cleared. Always look at the whole reference graph, not just the reference type.`,
      },
    ],
    check: [
      {
        q: 'Which kind of reference makes the JVM clear the object at the next GC if that is the only reference left to it?',
        options: ['SoftReference', 'WeakReference', 'PhantomReference', 'Strong reference'],
        answer: 1,
        explain: `A weak reference is cleared as soon as the object is only weakly reachable; no memory pressure is needed. SoftReference is only cleared when the JVM is about to run out of heap; PhantomReference does not keep the object alive and {{get()}} is always null; with a strong reference the object lives as long as a path from a GC root exists.`,
      },
      {
        q: 'You put {{map.put(session, session)}} into a {{WeakHashMap}}. What happens?',
        options: [
          'The entry is removed right after the first GC',
          'The map throws {{IllegalArgumentException}}',
          'The key is removed but the value stays in the map',
          'The entry lives forever because the value in the map keeps the key strongly',
        ],
        answer: 3,
        explain: `The map holds the value by strong reference and the value is the key, so there is always the path map → value → key. The key stays strongly reachable, so the weak reference is never cleared and the entry is never cleaned up. This is a very common variant of a memory leak: it is not the weak key that is wrong, but the value accidentally keeping the key.`,
      },
      {
        q: 'Why does a {{static final Map}} keep objects forever?',
        options: [
          'Because a static field lives in Metaspace and is not scanned by GC',
          'Because HashMap caches every key by itself',
          'Because a static field is a GC root, so every object the map points to is reachable',
          'Because the map uses soft references for values',
        ],
        answer: 2,
        explain: `The static field of a live class is a GC root. Map reachable → key/value reachable → the object is not reclaimed even after the business flow is over. Since JDK 7, static fields are stored by the JVM in the {{java.lang.Class}} object on the Java heap (Metaspace only holds class metadata), so they are definitely scanned by GC — the static reference acting as a root until the class is unloaded is the real reason objects are not reclaimed. HashMap does not cache anything by itself, and soft references must be declared explicitly.`,
      },
      {
        q: 'When should you choose SoftReference over WeakReference?',
        options: [
          'When you need to cache data that can be recreated and tolerate losing it when the JVM is short of memory',
          'When you need to guarantee the object is never reclaimed',
          'When you need a notification after the object is completely dead',
          'When the key is a String and must be compared with equals',
        ],
        answer: 0,
        explain: `A soft reference fits a "soft" cache: the JVM tries to keep it but clears it before throwing OOM, so the data must be recreatable. No reference guarantees keeping an object forever except strong. A notification after the object dies is PhantomReference + ReferenceQueue. Comparing keys with equals is map semantics, unrelated to reference strength.`,
      },
    ],
  },
  'lesson-jvm-002': {
    title: 'GC mark-and-sweep from scratch: reachability, tri-color and why compaction is needed',
    goals: [
      'List the GC roots correctly and explain why GC only reclaims unreachable objects',
      'Simulate the mark and sweep phases on an object graph, including cycles',
      'Understand tri-color marking, write barriers and why concurrent GC needs SATB or incremental update',
      'Read basic GC logs and know when to tune the pause target, region size or heap',
    ],
    body: `### GC answers one question only: can this object still be reached from a root?
Every tracing GC algorithm starts from a small set of **GC roots** and follows reference edges. Any object with no path from a root is garbage, no matter how many other objects point at it. This is why **cycles** do not leak memory in Java, unlike reference counting.

GC roots are:
- local variables and parameters in the stack frames of live threads;
- static fields of already loaded classes;
- objects currently holding a monitor (inside synchronized);
- JNI references from native code;
- classloaders, thread objects, and some internal JVM structures.

If someone says "the object leaks because it is still referenced", the next question must be: **is that reference on a path from a root?** An object in the garbage list can still point at other objects, but the whole cluster is reclaimed.

### The mark phase: walking the graph
Mark starts by marking the roots, then follows the edges. You can use DFS, BFS or an explicit stack to avoid overflowing the call stack on deep graphs. Each object has a mark bit; at the end of the phase, a set bit means the object is alive.

~~~java
// Minimal simulation: mark every object reachable from roots
void mark(Set<Integer> roots) {
    Deque<Integer> stack = new ArrayDeque<>(roots);
    while (!stack.isEmpty()) {
        int id = stack.pop();
        Obj o = objects.get(id);
        if (o == null || o.marked) continue;
        o.marked = true;
        for (int next : o.refs) stack.push(next);   // push the unvisited edges
    }
}
~~~

### The sweep phase: return dead objects to the free pool
Sweep walks the whole heap and frees every unmarked object. There are two ways to manage the memory afterwards:

- **Free-list**: record the free ranges in a list and allocate again by matching the requested size. Objects are not moved, but it easily **fragments**: many free bytes remain but no single contiguous block is big enough.
- **Compaction** (mark-compact): slide live objects to one end and update every reference. Fragmentation is gone, allocation becomes a very fast bump-pointer, but objects must be moved, which is expensive and needs a longer stop-the-world pause.

This is why modern collectors do not use plain mark-sweep (CMS was the last concurrent mark-sweep collector, removed starting with Java 14 partly because of fragmentation): G1, ZGC and Shenandoah all have **evacuation** (copying live objects to a new region) or per-region compaction. Copying both cleans garbage and prevents fragmentation, at the cost of memory for the destination region and the need to update pointers.

### Tri-color: how GC runs alongside the application
To reduce pauses, GC marks **concurrently** while the application keeps running. It splits objects into three colors:

- **White**: not visited yet, a candidate for reclamation.
- **Grey**: visited but its child edges have not all been scanned.
- **Black**: visited and all children scanned.

The invariant to preserve: **a black object must not point to a white object**. If the application adds an edge from black to white while GC is running, the white object could be swept by mistake. Two families of barriers handle this in different ways:

- **Incremental update** (CMS): when a write into a black object is detected, shade that object grey again so GC rescans it. An extra remark phase may be needed.
- **SATB — snapshot-at-the-beginning** (G1): when an edge is overwritten, record the **old** value in a buffer, treating it as a snapshot taken when marking began. That way an object that was alive at the start is kept, even though the application just dropped the reference.

Both need a **write barrier**: a small piece of code inserted on every reference store. The barrier slows the application a little, but buys much shorter pauses.

### Generational: exploiting "most objects die young"
The weak generational hypothesis: most objects die very early. So GC splits the heap and **only scans the young part** in a minor GC. Objects that survive are promoted to old. To find references from the old generation into the young one without scanning all of old, the JVM uses a **card table** (in HotSpot each card covers 512 bytes of heap, each card is 1 byte in the table) and G1 adds a **remembered set** per region. When an old → young reference is written, the write barrier marks the card dirty; a minor GC scans only dirty cards.

G1 divides the heap into equally sized **regions** that do not need contiguous young/old areas. Region size is a power of 2 from 1 MB to 32 MB (up to 512 MB since JDK 18); the JVM picks it so that the heap has about 2048 regions, or you set it with {{-XX:G1HeapRegionSize}}. Each region can be Eden, Survivor, Old or **Humongous** (an object larger than 50% of a region). G1 chooses the set of regions to collect according to a **pause target** ({{-XX:MaxGCPauseMillis}}, default 200ms) instead of a fixed split. ZGC and Shenandoah go further: marking and relocation are almost entirely concurrent, with pauses usually under 1 ms (ZGC) to a few ms, at the cost of somewhat lower throughput and the need for spare heap/CPU. ZGC has a generational mode since Java 21 ({{-XX:+UseZGC -XX:+ZGenerational}}) and since Java 23 that is the default mode.

| Collector | Strength | When to choose |
|---|---|---|
| Serial | Simple, low overhead | Small containers, heap of a few hundred MB; the JVM picks Serial automatically when the machine has fewer than 2 CPUs or less than about 1.8 GB RAM |
| Parallel | High throughput | Batch jobs with little concern for pauses |
| G1 | Balanced, the default since Java 9 | Most services |
| ZGC / Shenandoah | Very low pauses | Large heaps, strict latency SLAs |

### Reading GC logs and avoiding blind tuning
Unified logging since Java 9: {{-Xlog:gc*:file=gc.log:time,uptime,level,tags}}. Look at **allocation rate**, **live set after full GC**, and **pause distribution**, not just "GC runs a lot". If the live set after a full GC keeps growing over time, that is a leak, not a heap that is too small. If pauses are high but the live set is small, the allocation rate may be too high or the region/young space too small.

Three common tuning mistakes:
- Setting {{-Xms}} much lower than {{-Xmx}}: during warm-up the heap has to grow, GC runs more often and latency wobbles. Production services usually set {{-Xms}} equal to {{-Xmx}} (in containers they often use {{-XX:MaxRAMPercentage}}).
- Setting {{-Xmn}} too large shrinks the old generation and causes constant full GCs; too small promotes objects early. With G1, a hard-coded {{-Xmn}} also disables the ability to resize the young generation to meet the pause target, so it is usually best left unset.
- Calling {{System.gc()}} in business code: it triggers a full GC (stop-the-world by default with G1) and usually only makes things worse. You can block it with {{-XX:+DisableExplicitGC}}, but be careful: the JDK calls {{System.gc()}} when direct memory for {{ByteBuffer.allocateDirect}} is exhausted (Netty, NIO), so disabling it can lead to {{OutOfMemoryError: Direct buffer memory}}.

> Do not optimise GC by making the heap unbounded. A large heap makes every full GC more expensive and hides leaks. Find the retained set first, then adjust the collector.

### Interview relevance
Classic questions: "How does GC find garbage?", "Why do cycles not leak in Java?", "How does G1 differ from CMS?", "When is an object promoted?". Answering with **reachability + generational + barriers** is more convincing than listing collector names. The exercise below has you implement mark-and-sweep yourself, so you will remember exactly why sweep has to look at the **whole** heap while mark only follows edges.`,
    exercises: [
      {
        title: 'Simulate mark-and-sweep on an object graph',
        prompt: `Implement {{GcHeap}} to simulate a minimal mark-and-sweep collector.

Each object has a unique {{id}} and a list of {{refs}} pointing to other objects. API:
- {{allocate(id)}}: create a new object; throw {{IllegalArgumentException}} if the id already exists.
- {{get(id)}}: return the object or null.
- {{addEdge(from, to)}}: add an edge; throw {{IllegalArgumentException}} if either id does not exist.
- {{mark(roots)}}: **reset all marks**, then mark every object reachable from {{roots}}. Throw {{IllegalArgumentException}} for an unknown root. Return the set of marked ids (a {{TreeSet}} for a stable order).
- {{collect(roots)}}: run {{mark(roots)}}, remove every unmarked object, reset the marks of live objects, and return the set of reclaimed ids.
- {{size()}}: number of remaining objects.

Traverse with an explicit stack/queue, not recursion, so a deep graph does not overflow the stack.`,
        hints: [
          'Mark phase: reset all {{marked}} flags first, push the roots into an {{ArrayDeque}}, then loop pop → if not marked yet, mark it and push its children.',
          'Sweep phase: use an {{Iterator}} over the {{entrySet}} and {{it.remove()}} for unmarked objects; for live objects set {{marked = false}} so the next collect can reuse the flags.',
          'Use a {{TreeSet}} for the result set so the tests compare deterministically, independent of traversal order.',
        ],
        explain: `Mark only follows edges, so its cost is proportional to the **number of live objects**, while sweep has to walk the **whole heap** to find dead objects. That is why tracing GC needs no reference counts and handles cycles: the whole cluster 10 → 11 → 12 → 10 has no root, so all three are white.

A few details that are easy to get wrong:
- Not resetting marks before marking again: the second run returns an empty set because every object looks alive already.
- Removing while iterating with for-each over {{objects.values()}} throws {{ConcurrentModificationException}}; use {{Iterator.remove()}}.
- Pushing objects onto the stack without checking {{marked}} can blow up the stack on graphs with many edges, but it is still correct. Checking early reduces redundant work.
- In a real JVM, mark and sweep are not necessarily separate: G1 evacuates live objects to a new region and then treats the whole old region as garbage, so it reclaims and prevents fragmentation at the same time.`,
      },
    ],
    check: [
      {
        q: 'Which object is **not** a GC root?',
        options: [
          'A local variable in the stack frame of a running thread',
          'A static field of an already loaded class',
          'An object that is only pointed to by another object which is itself unreachable',
          'A JNI reference from native code',
        ],
        answer: 2,
        explain: `Roots are the starting points of the walk: stacks, static fields, JNI, monitors, threads. An object only pointed to by an unreachable object is itself unreachable, so it is garbage. That is exactly the difference between reachability and "someone points at it".`,
      },
      {
        q: 'What is the main limitation of mark-sweep without compaction?',
        options: [
          'It cannot reclaim cycles',
          'It cannot run concurrently',
          'It cannot handle large objects',
          'Heap fragmentation: plenty of free space but no contiguous block big enough',
        ],
        answer: 3,
        explain: `Sweep leaves holes between live objects; over time the free-list fragments and allocating a large object may fail even though the total free size is enough. Mark-sweep handles cycles fine (unlike reference counting). Concurrency or large objects are separate concerns, not a necessary consequence of missing compaction.`,
      },
      {
        q: 'In tri-color marking, which invariant must hold so a live object is not reclaimed by mistake?',
        options: [
          'A white object must not point to a black object',
          'A black object must not point to a white object',
          'Grey objects must always outnumber black ones',
          'Every white object must be pointed to by a root',
        ],
        answer: 1,
        explain: `If a black object (already scanned) grows a new edge to a white object while the application runs, GC might sweep that white object even though it has just been referenced. Incremental update (CMS) preserves the invariant by shading the written black object grey again; SATB (G1) solves it differently — it records the old value of every overwritten reference to keep the snapshot from the start of marking, so no object alive at the start is lost. The other options do not reflect tri-color marking logic.`,
      },
      {
        q: 'What is an object larger than 50% of a region size in G1 called?',
        options: ['Humongous object', 'Tenured object', 'TLAB object', 'Phantom object'],
        answer: 0,
        explain: `G1 allocates a humongous object in one or more contiguous regions because it does not fit in a single region. Tenured refers to objects in the old generation in general; TLAB is a per-thread allocation buffer; phantom is a kind of reference. Humongous allocation can cause unusual pauses if the application creates many large arrays.`,
      },
    ],
  },
});
