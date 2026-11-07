/*
 * English translation of js/data/lessons-jvm.js — task T693. Format: js/core/i18n.js (content overlay).
 * ids: lesson-jvm-004
 */
App.i18n.content({
  'lesson-jvm-004': {
    title: 'Memory leaks in Java: why the GC cannot save you and how to track down the culprit with a heap dump',
    goals: [
      'Explain why Java still leaks even though it has a GC: an object is still **reachable** from a GC root but the program never uses it again',
      'Recognise the five leak patterns you meet most: an unbounded cache, a listener that is never unregistered, {{ThreadLocal}} in a thread pool, an inner class implicitly holding {{this}}, a key whose {{hashCode}} changes',
      'Read the floor of the heap after GC, compare class histograms, take a heap dump and find the culprit with the dominator tree, retained size and path to GC roots',
      'Write a bounded LRU cache and a listener registry whose subscribe call returns a handle that unregisters',
    ],
    body: `### What a leak means in Java
In C, a leak is a region you {{malloc}} and nobody {{free}}s: no pointer points at it any more, yet the memory is still occupied. Java does not have that kind of leak, because the GC reclaims every object **with no remaining path from a GC root** (a local variable of a running thread, a static field, a JNI reference, a held monitor...). A leak in Java is the opposite pattern: the object **still has a path** from a GC root, so the GC is forced to keep it, but the program **never uses it again**.

The GC does not read your intentions. It only answers one question: "does anything still point at this object?". If a static {{HashMap}} still points at 2 million orders that finished last week, the answer is "yes", and those 2 million orders live forever, dragging along everything they point at:

~~~text
GC root: static field OrderCache.MAP
   └── HashMap                 shallow 48 B, retained 1.6 GB
         └── Node[] table      4 194 304 slots
               ├── Node → Order#1 → List<OrderLine> → Product ...
               ├── Node → Order#2 → ...
               └── ... 2 million Node objects, nobody reads them again
~~~

### The symptom: the floor of the heap climbs
The used heap of a normal service looks like a sawtooth: it goes up as memory is allocated and drops after each GC. The thing to look at is **the heap level right after GC** (the bottom of each tooth, also called the live set), not the peak:

- Healthy service: the floor oscillates around one level, for example about 600 MB after each GC, for days on end.
- Leaking service: the floor rises steadily 600 MB → 900 MB → 1.3 GB day by day; GC runs more often, the CPU spent on GC grows, p99 grows; in the end you get {{java.lang.OutOfMemoryError: Java heap space}}. With Parallel GC you may hit {{GC overhead limit exceeded}} first: the JVM gives up when more than 98% of the time goes to GC while less than 2% of the heap is reclaimed.

In a G1 GC log ({{-Xlog:gc}}), the line {{Pause Young (Normal) (G1 Evacuation Pause) 1450M->1210M(2048M)}} tells you the heap before and after GC. Plot the number after the arrow over time and the shape is obvious immediately. One caveat: a **legitimately large cache** also lifts the floor, but the floor goes **flat** once the cache is full; a leak never goes flat.

### The five leak patterns you meet most on production
**1. A home-grown cache with no bound.** A {{Map}} used as a cache that only has {{put}}, with no size limit and no lifetime. Every new key (a user id, a query string, a URL with parameters) adds one entry. A key with high cardinality, for example a URL containing {{?ts=1730700000}}, is a disaster: every request produces a brand new key. The fix: a cache with a **maxSize** and a **TTL** (Caffeine, or {{LinkedHashMap}} with {{removeEldestEntry}} like exercise 1).

**2. A listener/callback registered but never removed.** A long-lived subject (a singleton event bus) keeps its listeners through strong references. Each request creates a handler and {{subscribe}}s it, but nobody ever {{unsubscribe}}s. The handler holds the request context, the context holds a 200 KB body; 1 million requests is 200 GB of potential garbage. The rule: **whoever registers must unregister**, and the registration API should return a handle with {{close()}} so it works with try-with-resources (exercise 2).

**3. {{ThreadLocal}} in a thread pool.** Every {{Thread}} has a {{ThreadLocalMap}}; the key of an entry is a weak reference to the {{ThreadLocal}} object, but the **value is a strong reference**. The threads of Tomcat or of an {{ExecutorService}} live for the whole lifetime of the application, so the value lives with them if you forget {{remove()}}. A real number: each thread keeps a 2 MB buffer, so 200 Tomcat threads is 400 MB that is never released. Worse than the leak itself: the next request running on the same thread can read the previous user's data by mistake.

~~~java
CONTEXT.set(userCtx);
try {
    handle(request);
} finally {
    CONTEXT.remove();   // mandatory with a thread pool, even if handle throws
}
~~~

**4. Inner (non-static) classes and lambdas holding {{this}} implicitly.** A non-static inner class always has a hidden field pointing at the enclosing object. If you hand an anonymous class instance to something long-lived — for example pass it to {{scheduler.scheduleAtFixedRate}} or register it as a global callback — then the whole enclosing object (possibly a service that holds hundreds of MB of data) cannot be reclaimed. A lambda captures {{this}} only when its body uses a field or an instance method. The good habit: declare nested classes {{static}} by default, unless you really need the enclosing object.

**5. A key whose {{hashCode}} changes.** You {{put}} a mutable object as a key into a {{HashMap}}/{{HashSet}}, and later modify a field that participates in {{hashCode}}. The entry stays in the old bucket, while {{remove(key)}} looks in the new bucket and finds nothing: the entry is stuck forever. Keys must be **immutable** ({{record}}, {{String}}, {{Long}}).

Besides these there are ClassLoader leaks during hot redeploy (a static field or a thread of the old deployment keeps the classloader alive, which drags along every class it loaded) and leaks of resources outside the heap (streams, connections that are not closed). Those two have their own mechanism, but the way you track them down is the same.

### Is WeakReference the cure?
Weak and soft references only suit a few cases: a canonical map ({{WeakHashMap}} attaching metadata to an object whose lifetime somebody else controls), or a weak listener when you **cannot control** the side that registers. But they trade the bug "kept too long" for the bug "vanishes unexpectedly": a listener wrapped in a weak reference is reclaimed as soon as nobody else holds the lambda, and events simply stop arriving with no error at all. A soft reference keeps the object until the heap is nearly full, which makes GC work hardest exactly when the load is highest. The proper cure remains an **explicit lifetime**: a size bound, a TTL, symmetric unregistration, {{try/finally}}.

### The procedure for finding a leak in a real environment
1. **Confirm that it is a leak**: watch the heap level after GC over hours or days (the GC log, or the {{jvm_memory_used_bytes}} metric from Micrometer with the tag {{area=heap}}). A floor that rises steadily is a strong signal.
2. **Compare class histograms** at two moments 30 minutes apart: {{jcmd <pid> GC.class_histogram}}. By default this command only counts live objects, so it triggers a full GC (a few hundred ms up to a few seconds). Any class whose instance count grows linearly ({{HashMap$Node}}, {{byte[]}}, a business class such as {{OrderDto}}) is a suspect.
3. **Take a heap dump**: {{jcmd <pid> GC.heap_dump /dumps/app.hprof}}. Dumping is stop-the-world and the file is almost as big as the used heap (3 GB used means roughly a 3 GB file), so take it on a pod that has already been pulled out of the load balancer, and write it to a volume with enough room. Always keep {{-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps}} switched on so you have evidence at the very moment the pod dies.
4. **Analyse with Eclipse MAT** (or VisualVM, the IntelliJ profiler):
   - **Leak Suspects report**: MAT points at the object that holds most of the heap for you.
   - **Dominator tree**: X dominates Y if **every** path from a GC root to Y goes through X. When X is reclaimed, everything X dominates is reclaimed too.
   - **Shallow size** is the size of the object itself (a {{HashMap}} is only about 48 bytes); **retained size** is the total memory freed if that object disappeared (that very {{HashMap}} can retain 1.6 GB). Always sort by retained size.
   - **Path to GC Roots** (exclude weak and soft references): it shows exactly which chain of fields keeps the object alive, for example {{OrderCache.MAP → table → [12345] → value}}. That is the line of code you need to change.
5. **A slow leak that is hard to reproduce**: use JFR with the {{jdk.OldObjectSample}} event and dump with {{jcmd <pid> JFR.dump filename=leak.jfr path-to-gc-roots=true}}. JFR samples long-lived objects together with the stack trace of where they were allocated and the path to a GC root; it is far cheaper than a heap dump, so you can keep it running on production.

> A production heap dump contains user data (tokens, emails, phone numbers). Treat the {{.hprof}} file as sensitive data: encrypt it, restrict who may read it, delete it once the analysis is done.

### Interview relevance
Questions you get often: "Java has a GC, so how can it still leak?", "Tell me about a memory leak you dealt with", "How does shallow size differ from retained size?". A good answer follows a structure: **symptom** (the heap after GC keeps rising, GC gets denser, OOM) → **evidence** (compared histograms, heap dump, dominator tree, path to GC roots) → **root cause** (for example a listener that was never unregistered) → **fix and prevention** (a bounded cache, a registration API that returns a handle, an alert on the post-GC heap). The two exercises below are the two most common fixes: a bounded LRU cache and an event bus with an unregister function.`,
    exercises: [
      {
        title: 'A bounded LRU cache built on LinkedHashMap',
        prompt: `A service uses a {{HashMap}} as its cache and the heap keeps growing. Write {{BoundedCache<K, V>}} that keeps **at most** {{maxSize}} entries and evicts the **least recently used** entry (LRU) when the limit is exceeded.

Requirements:
- Constructor: {{maxSize < 1}} throws {{IllegalArgumentException}}.
- {{put(key, value)}}: add or update. If the number of entries exceeds {{maxSize}} after the insert, remove the eldest entry and increment the {{evictions}} counter. Updating a key that is already present must not evict anything.
- {{get(key)}}: return the value or null; when there is a value, that entry becomes the **most recently used**.
- {{size()}}, {{evictions()}}.
- {{keysEldestFirst()}}: the list of keys ordered from the eldest (next to be evicted) to the most recently used. It must not change the order.

Hint about the mechanism: {{new LinkedHashMap<>(16, 0.75f, true)}} (the third parameter is {{accessOrder = true}}) and override {{removeEldestEntry}}.`,
        hints: [
          'The three-argument constructor {{LinkedHashMap(initialCapacity, loadFactor, accessOrder)}} with {{accessOrder = true}} keeps entries ordered by their most recent access: the first entry in the list is the least recently used one.',
          '{{removeEldestEntry(eldest)}} is called by {{put}} after an entry has been added; returning true makes the map remove the first entry itself. Compare {{size() > maxSize}} and increment {{evictions}} right there.',
          'Use an anonymous subclass {{new LinkedHashMap<>(16, 0.75f, true) ...}}; copy {{maxSize}} into a local final variable so you can use it inside the anonymous class. {{keysEldestFirst}} returns {{new ArrayList<>(map.keySet())}}.',
        ],
        explain: `{{LinkedHashMap}} is a {{HashMap}} with an extra doubly linked list running through all its entries. With {{accessOrder = true}}, every {{get}} or every {{put}} on a key that already exists moves that entry to the **end** of the list, so the **head** of the list is always the entry that has gone longest without being used. After each newly added entry, {{put}} calls the hook {{removeEldestEntry(eldest)}}; return true and the map removes the head entry. All of it is O(1), you do not manage any list yourself.

Common mistakes:
- Using the default constructor ({{accessOrder = false}}): the map then keeps **insertion** order, which gives you a FIFO cache. The "get refreshes the order" and "put an existing key" tests fail, because an entry you just read is still evicted.
- Counting evictions outside {{removeEldestEntry}} by comparing the size before and after {{put}}: easy to get wrong when a key already present is put again.
- Iterating with {{map.get}} inside {{keysEldestFirst}}: every {{get}} changes the order, so the result is wrong and you also wreck the LRU ordering.
- {{LinkedHashMap}} is **not thread-safe**; in access-order mode even a {{get}} is a write operation (it mutates the linked list). Sharing it between threads means wrapping it in {{synchronized}} or using Caffeine.

On production you should use Caffeine ({{maximumSize}}, {{expireAfterWrite}}, hit-rate statistics) rather than writing your own. But understanding this mechanism lets you explain why a cache **with a bound** stops the leak: the floor of the heap goes flat at roughly maxSize times the entry size.`,
      },
      {
        title: 'An event bus whose registration returns a handle',
        prompt: `Leaks caused by listeners that are never removed are extremely common. Write an {{EventBus}} where **every registration returns a {{Registration}}**; calling {{close()}} on that handle removes exactly that registration.

Requirements:
- {{subscribe(listener)}}: a null listener throws {{NullPointerException}}. Returns a {{Registration}}.
- {{Registration.close()}}: removes **exactly** the registration that produced it. Calling it several times stays safe and must not remove a different registration, even when the same listener was subscribed twice.
- {{publish(event)}}: call every listener in registration order, return the number of listeners that were called.
- A listener is allowed to {{close()}} itself (or to register more) **while** a {{publish}} is running, without causing {{ConcurrentModificationException}} and without making any other listener get skipped.
- {{listenerCount()}}: the number of registrations still in effect.

{{Registration}} extends {{AutoCloseable}}, but its {{close()}} throws no checked exception, so it can be used in try-with-resources.`,
        hints: [
          'Do not store the bare {{Consumer}} in a list and then call {{remove(listener)}}: when the same listener is subscribed twice, closing twice removes both. Wrap each registration in its own object.',
          '{{Registration}} is a functional interface (it only has {{close()}}), so you can return the lambda {{() -> subs.remove(sub)}}. Removing an object that is no longer in the list simply returns false, which is naturally idempotent.',
          'Use a {{CopyOnWriteArrayList}}: its iterator walks a snapshot, so a listener removing itself while publish is running neither throws {{ConcurrentModificationException}} nor makes later listeners get skipped.',
        ],
        explain: `Three design decisions are what make this event bus leak-free:

1. **Return a handle instead of forcing the caller to keep the listener around in order to remove it.** An API shaped like {{unsubscribe(listener)}} requires the caller to hold the exact lambda instance that was registered; writing {{bus.unsubscribe(e -> log(e))}} creates a new lambda, so nothing is removed, and that is where the leak starts. A {{Registration}} handle extends {{AutoCloseable}}, which enables try-with-resources, or it can be tied to the bean lifecycle (for example calling {{close()}} in {{@PreDestroy}}).
2. **Each registration is its own object.** {{Subscription}} does not override {{equals}}, so {{remove(sub)}} compares by identity and removes exactly that element. A second close finds nothing and {{remove}} returns false: idempotent without any flag.
3. **{{CopyOnWriteArrayList}}.** Every write builds a new array; the iterator walks the old one. With an {{ArrayList}}, a listener removing itself while the list is being iterated either throws {{ConcurrentModificationException}} or (when the removal makes the size equal the cursor) **silently skips** the next listener. The "self-remove during publish" test catches exactly that second failure. The price: every subscribe/close is an O(n) copy, which is fine when reads (publish) vastly outnumber writes, true for any listener registry. It is also safe when several threads publish at the same time.

This is the same pattern as Spring's {{ApplicationEventMulticaster}}, Micrometer, Reactor ({{Disposable}}): registering returns something you can cancel. When reviewing code, an {{addListener}} with no matching {{removeListener}} in the same lifetime is a leak signal.`,
      },
    ],
    check: [
      {
        q: 'In MAT, a {{HashMap}} has a shallow size of 48 B but a retained size of 1.6 GB. What does that mean?',
        options: [
          'MAT is wrong, a HashMap cannot be that big',
          'If that HashMap were no longer reachable, roughly 1.6 GB of objects kept only through it would be freed',
          'The HashMap itself occupies 1.6 GB because its table array is too large',
          'That is native memory, it does not belong to the heap',
        ],
        explain: `Shallow size is the size of the HashMap object itself (a handful of fields). Retained size is the total of the objects the HashMap **dominates**: every path from a GC root to them goes through the HashMap, so when it disappears they get reclaimed too. MAT is not wrong; the {{table}} array is only a small part of that number (most of it is the keys and values); and these are heap objects, not native memory.`,
      },
      {
        q: 'Why does {{ThreadLocal}} leak in a thread pool even though the key of the {{ThreadLocalMap}} is a weak reference?',
        options: [
          'Because ThreadLocal stores its data in a static field of the ThreadLocal class',
          'Because GC never scans ThreadLocalMap',
          'Because a weak reference is only cleared at full GC',
          'Because the value is a strong reference and the pool threads live for the whole application lifetime unless you call remove()',
        ],
        explain: `The map lives inside the {{Thread}} object itself; the key is weak but the **value is strong**. Threads of the pool never die, so the value lives forever if you do not call {{remove()}} (stale entries are only cleaned up gradually as the map keeps being operated on, which is no guarantee). The data is not in a static field of {{ThreadLocal}}; GC scans the map like any other object; a weak reference is cleared at any GC that collects the region holding its referent, not only at full GC.`,
      },
      {
        q: 'Which signal on a heap chart most clearly indicates a memory leak?',
        options: [
          'The heap level right after each GC rises steadily over many hours and never flattens out',
          'The heap peak reaches 90% before each GC',
          'The heap has a sawtooth shape',
          'Minor GC runs several times per second',
        ],
        explain: `The level after GC is the live set; if it keeps growing, there are objects that are still reachable and never released. A 90% peak before GC is normal: GC runs when a region fills up. A sawtooth is the shape of every healthy application. Frequent minor GC only tells you the allocation rate is high, which is not yet a leak.`,
      },
    ],
  },
});
