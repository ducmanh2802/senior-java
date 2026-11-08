/*
 * English translation of js/data/q-java.js — task T160. Format: js/core/i18n.js (content overlay).
 * ids: collections-002 collections-003 collections-004 collections-005 collections-006 collections-007 collections-008 collections-009 collections-010 collections-011 collections-012
 */
App.i18n.content({
  'collections-002': {
    q: "How does {{ConcurrentHashMap}} work in Java 8 (CAS + synchronized on the bin)? Why is {{size()}} not exactly accurate and why are null keys/values forbidden?",
    a: `**Summary:** Java 8 drops segments; it uses **CAS** for insertion into an empty bucket and **synchronized on the first node** on collision; the counter uses {{baseCount}} + {{CounterCell}}, so {{size()}} is a concurrently updated estimate; null is banned to avoid ambiguity between "key absent" and "key present with null value" and to keep lock-free reads simple.

### From Java 7 to Java 8
- Java 7: divided into {{Segment}} (default 16), each segment is a separate locked table; concurrency level is fixed.
- Java 8: a single {{Node[] table}}, no segments.
  - Empty bucket: {{casTabAt}} to set the first node, no lock.
  - Non-empty bucket: {{synchronized (f)}} on the first node, update list/tree inside that bucket.
  - Read: {{get}} is lock-free because {{val}} and {{next}} are {{volatile}}.
- Result: concurrency is per-bucket, far better than 16 fixed segments.

### Write and read
~~~java
// conceptual idea of putVal
if (tabAt(tab, i) == null) {
    if (casTabAt(tab, i, null, new Node(hash, key, value)))
        return;                        // insertion without lock
}
synchronized (f) {                     // f = first node of bucket
    // traverse list, update or append; treeify if long
}
~~~
- Resize supports **multi-threading**: threads help migrate buckets ({{transfer}}), using {{ForwardingNode}} to mark moved buckets.
- {{computeIfAbsent}} / {{compute}} / {{merge}} are atomic per key, but the mapping function runs **inside the bucket lock** — never call I/O or slow operations inside it, and never update the same map recursively (deadlock or loop possible).
- Iterator is **weakly consistent**: does not throw {{ConcurrentModificationException}}, reflects state at a point in time, may or may not see new updates.

### Why null is forbidden
- If value null were allowed, {{get(key)}} returning null could not distinguish "key absent" from "key present with value null"; to distinguish you need {{containsKey}}, creating a race between the two calls.
- Forbidding null lets the implementation stay simpler: the presence of a node already means the key exists.
- {{ConcurrentHashMap}} also forbids null keys; to represent "none", use a sentinel value or {{Optional}} (but consider cost).

### Pitfall
- Using {{computeIfAbsent}} to cache DB results: the lock is held long, other threads on the same bucket are blocked; prefer a loading cache (Caffeine) or a future per key.
- {{putIfAbsent}} + later check is not atomic; use {{computeIfAbsent}} / {{merge}} correctly.
- Initial capacity: {{new ConcurrentHashMap<>(expected)}} to reduce resize.

> Senior tip: CHM is excellent for config/registry maps with many reads, but it is not a replacement for a cache with eviction. For hot keys, consider {{LongAdder}} / {{striped lock}} instead of {{compute}} on the same key, because all threads will queue on the same bucket.`,
    follow: [
      "Why can {{computeIfAbsent}} cause deadlock if the mapping function updates the same map?",
      "What does {{ConcurrentHashMap}} guarantee for its iterator and {{size()}}?",
      "When should {{Collections.synchronizedMap}} be preferred over CHM?"
    ]
  },
  'collections-003': {
    q: "{{ArrayList}} vs {{LinkedList}}: how does cache locality affect performance, and when does {{LinkedList}} actually win?",
    a: `**Summary:** {{ArrayList}} stores elements in a contiguous array, so sequential iteration is extremely fast thanks to cache locality and random access is O(1); {{LinkedList}} is a chain of scattered nodes, each paying for an object header + 2 references, making iteration slow and memory-heavy. {{LinkedList}} almost never wins in real workloads; {{ArrayDeque}} is usually better for queue/stack.

### Internals
- {{ArrayList}}: {{Object[] elementData}} + {{size}}. Appending is amortized O(1); inserting/removing in the middle is O(n) because {{System.arraycopy}} shifts elements. When full it grows by ~1.5x ({{oldCapacity + (oldCapacity >> 1)}}).
- {{LinkedList}}: nodes {{prev, item, next}}; each node is a separate object. {{get(i)}} is O(n) (walks from head or tail); add/remove at the ends is O(1); remove via an {{Iterator}} is O(1) because the node is already known.

### Cache locality
- The CPU reads memory in cache lines (typically 64 bytes). The {{Object[]}} array is contiguous, so sequential iteration almost always hits the cache; the JIT also optimizes array loops well.
- Each LinkedList node is a separate object on the heap and may be scattered; following {{next}} is **pointer chasing**, and each step can be a cache miss. Iterating 1 million elements can be many times slower than ArrayList despite the same O(n).
- Memory: a LinkedList node costs an object header (~16 bytes) + 3 references (~12-24 bytes depending on compressed oops) ≈ 32-40 bytes/element; ArrayList only costs a reference inside the array (4-8 bytes) + array overhead.

### When LinkedList makes sense
- You need both {{List}} and {{Deque}}, with many insertions/removals at both ends, and **no** index access. But {{ArrayDeque}} does this faster and with less memory.
- Removing an element in the middle when you already hold a {{ListIterator}} at that exact position (the removal itself is O(1)), but the cost to **reach** that position is still O(n), and locality is still poor.
- A very large list with continuous middle insert/remove and no index needs — rare in backend code; a different structure (skip list, tree, queue) is usually better.

### In practice
- Most backend code uses {{ArrayList}}; queue/stack use {{ArrayDeque}}; priority uses {{PriorityQueue}}; concurrent queues use {{ArrayBlockingQueue}}/{{LinkedBlockingQueue}}.
- {{LinkedList}} still appears as a {{Deque}} in some older code, but {{ArrayDeque}} is ~a few times faster in benchmarks.
- Do not choose a collection by Big-O alone; constants and memory dominate in practice.

### Real-world example
A product-ranking service kept 300,000 candidates in a {{LinkedList}} because it "often removes eliminated items". The actual code called {{list.get(i)}} in an index-based for loop, so each get walked from the head for O(n²) total; ranking requests took 4-9 seconds. Switching to {{ArrayList}} and filtering with {{removeIf}} (a single array shift, O(n)) brought it down to ~35 ms. Heap for the list also dropped from ~12 MB (nodes + headers) to ~1.5 MB for the reference array.

### Sample interview answer
"ArrayList stores references in a contiguous array, so index access is O(1) and sequential iteration is very fast because the CPU reads 64-byte cache lines and adjacent elements usually hit the cache. Appending is amortized O(1), while inserting or removing in the middle shifts the array. LinkedList gives each element its own node with prev and next, so each element costs about 24 to 32 extra bytes and iteration is pointer chasing where each step can miss the cache; index access is O(n). In theory LinkedList wins for middle insert/remove when you already have an iterator at the spot, but reaching that spot is still O(n). So I almost always use ArrayList, ArrayDeque for queues and stacks, and if I am unsure I measure with JMH on real data."

> Senior tip: if you see {{LinkedList}} in code, ask immediately "is middle insert/remove with an iterator actually needed?"; in 90% of cases switching to {{ArrayList}} or {{ArrayDeque}} is faster and cuts heap. Measure with JMH on real data instead of trusting intuition.`,
    follow: [
      "Why can {{ArrayDeque}} usually replace {{LinkedList}} as a queue/stack?",
      "How does ArrayList growing by 1.5x affect memory?",
      "When should you initialize an {{ArrayList}} with a preset capacity?"
    ]
  },
  'collections-004': {
    q: "How do fail-fast and fail-safe iterators differ? When does {{ConcurrentModificationException}} occur and how do you avoid it?",
    a: `**Summary:** a fail-fast iterator checks {{modCount}} and throws {{ConcurrentModificationException}} if the collection is structurally modified outside the iterator; fail-safe (weakly consistent) iterators like {{ConcurrentHashMap}} or snapshot-based ones like {{CopyOnWriteArrayList}} do not throw but may see stale/incomplete data.

### Fail-fast
- {{ArrayList}}, {{HashMap}}, {{HashSet}}... keep a {{modCount}} field that increments on every structural change.
- The iterator stores {{expectedModCount}}; on each {{next()}}/{{remove()}} it compares, and throws CME immediately if they differ.
- This is **best-effort detection**, not a synchronization mechanism: it does not guarantee detection in every case, especially across threads.
- CME can happen even in a **single thread** when you for-each and also call {{list.remove(x)}} or {{map.put}}.

~~~java
for (String s : list) {
    if (s.isEmpty()) list.remove(s);   // CME
}
// correct:
Iterator<String> it = list.iterator();
while (it.hasNext()) if (it.next().isEmpty()) it.remove();
// or concise:
list.removeIf(String::isEmpty);
~~~

- {{list.remove(int)}} is different from {{it.remove()}}; only the iterator knows to update {{expectedModCount}}.
- {{for (int i...)}} followed by {{remove(i)}} does not throw but **skips** an element because indexes shift — a silent bug worse than CME.

### Fail-safe / weakly consistent
- {{ConcurrentHashMap}}: the iterator does not throw CME and reflects state at some point in time; it may or may not see concurrent changes. {{size()}} is also only an estimate.
- {{CopyOnWriteArrayList}}: the iterator works on a **snapshot** of the array taken at creation; mutating the list does not affect the iterator, but the iterator does not support {{remove}}.
- {{Collections.synchronizedList}}: the iterator is **still fail-fast**; to iterate safely you must hold {{synchronized (list)}} around the whole loop (per the Javadoc).
- {{ConcurrentSkipListMap}} is weakly consistent in a similar way.

### How to avoid
- Mutate through the iterator ({{it.remove()}}, {{it.set()}}).
- Use {{removeIf}}, {{replaceAll}}, {{computeIfPresent}}.
- With maps, use {{entrySet().removeIf}} or {{map.compute}} instead of removing in a for-each.
- Multi-threaded: use the right concurrent collection, or copy to a new list before iterating if you only need a snapshot.
- Do not assume {{Collections.synchronizedList}} makes iteration safe.

### Pitfalls
- Catching CME and ignoring it hides a bug; CME signals broken logic, not a transient error to retry.
- Iterating a {{subList}} and mutating the backing list also causes CME.
- Mutating the collection inside its own {{forEach}} also throws CME (except concurrent collections).

### Internals: where modCount lives
{{modCount}} is a plain {{int}} field (not {{volatile}}) in {{AbstractList}}/{{HashMap}}; it increments on **structural** changes (add, remove, resize), not on an in-place {{set}}. Because there is no synchronization, another thread in a concurrent setting may **not see** the new value, so CME is not guaranteed; data can be corrupted with no exception at all. That is why the Javadoc calls it "best-effort" — useful to detect bugs, not to rely on for correctness.

### Real-world example
A scheduler shared an {{ArrayList<Job>}} between a scheduling thread and an API thread that "cancels jobs". Occasionally (about 3 times/day) the scheduler died with CME; once nothing was thrown but a job ran twice. The fix was {{CopyOnWriteArrayList}} (small list, many reads, few writes) for the job list, and cancellation switched to setting a {{cancelled}} flag on the job instead of removing it from the list while iterating. No CME or duplicate runs in the 6 months after.

### Sample interview answer
"Regular collections like ArrayList and HashMap have a modCount field that increments on every structural change. An iterator records that value at creation and checks it on each next; if it differs it throws ConcurrentModificationException. This happens even in one thread, for example removing inside a for-each. The right fix is iterator.remove, or removeIf, replaceAll, compute. Note that an index-based for with remove does not throw but silently skips elements. This mechanism is only best-effort: modCount is not volatile so with multiple threads you might get no detection while data is still corrupted. With multiple threads I use concurrent collections: ConcurrentHashMap gives a weakly consistent iterator that does not throw, CopyOnWriteArrayList iterates over a snapshot. A synchronizedList still has a fail-fast iterator, so you must hold synchronized around the whole loop yourself."

> Senior tip: in code review, prefer {{removeIf}}/{{computeIfAbsent}} because they are concise and avoid CME; with CHM, do not rely on {{size()}} to stop a loop in a concurrent setting — use the operation's return value or a local counter.`,
    follow: [
      "Why can {{Collections.synchronizedList}} still throw CME during iteration?",
      "Does a {{CopyOnWriteArrayList}} iterator support {{remove}}, and why?",
      "In a multi-threaded app, is CME always caused by multiple threads?"
    ]
  },
  'collections-005': {
    q: "How do you use {{LinkedHashMap}} as an LRU cache? How do {{removeEldestEntry}} and access-order work, and should you use it in production?",
    a: `**Summary:** enable {{accessOrder = true}} so each {{get}}/{{put}} moves the entry to the end of the list, override {{removeEldestEntry}} to return {{size() > capacity}} to auto-remove the eldest; simple but **not thread-safe** and lacking stats/expiry, so production usually uses Caffeine.

### Mechanism
- {{LinkedHashMap}} extends {{HashMap}} and links entries with a doubly-linked list ({{before}}/{{after}}).
- Default is **insertion-order**; the constructor {{LinkedHashMap(int capacity, float loadFactor, boolean accessOrder)}} with {{accessOrder = true}} switches to **access-order**.
- In access-order, {{get}} and {{put}} (including {{getOrDefault}}, {{compute}}) count as access and move the entry to the end.
- {{removeEldestEntry(Map.Entry)}} is called after each insertion; returning {{true}} removes the **first** entry (least recently used).

~~~java
class LruCache<K, V> extends LinkedHashMap<K, V> {
    private final int max;
    LruCache(int max) {
        super(16, 0.75f, true);      // accessOrder = true
        this.max = max;
    }
    @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > max;
    }
}
~~~

- You can override {{removeEldestEntry}} to return false for certain keys (pin an entry) or log on eviction.

### Limitations
- **Not thread-safe**: concurrent {{get}} calls still mutate the linked list (access-order), so you must wrap with {{synchronized}} or {{Collections.synchronizedMap}}; but then every operation becomes sequential, losing the benefit.
- **No TTL**: evicts only by size, not by time.
- **No statistics**: hit rate and eviction count must be tracked manually.
- **No policy better than LRU**: LRU is vulnerable to "cache pollution" from a single sequential scan (each new item pushes the whole cache out).
- **Memory overhead**: 2 extra references per entry compared to HashMap; significant for large caches with small entries.
- In access-order, {{get}} is a **structural modification** in terms of iteration: iterating and calling {{get}} at the same time can cause CME in the same thread.

### Production
- Use **Caffeine**: {{Caffeine.newBuilder().maximumSize(10_000).expireAfterWrite(...).recordStats().build()}}, with W-TinyLFU (better than LRU), async loading, stats, and thread safety.
- Or Guava Cache (simpler, fewer features than Caffeine).
- Redis/Memcached for distributed caching; define a clear invalidation policy.
- For in-JVM caches, always set **maximumSize** to avoid OOM; an unbounded cache is a time bomb.

### Real-world example
A currency-rate lookup service used an access-order {{LinkedHashMap}} LRU of 10,000 entries wrapped in {{Collections.synchronizedMap}}. Under 2,000 requests/second, p99 rose to 300 ms: every {{get}} is a write (moving the entry to the end of the list) so they all take the same lock and hundreds of threads queue up. After switching to Caffeine ({{maximumSize(10_000)}}, {{expireAfterWrite(5 minutes)}}, {{recordStats()}}): p99 dropped to 4 ms and hit rate measured 97%. Stats also revealed a nightly job scanning all currency codes that had been wiping the old LRU every night — Caffeine's W-TinyLFU kept the hot keys through that scan.

### Sample interview answer
"LinkedHashMap links entries with a doubly-linked list. Initialized with accessOrder true, every get or put moves that entry to the end, so the head is always the least recently used. Override removeEldestEntry to return size greater than the limit and the head is removed after each insert — that gives you an LRU in a few lines. But I do not use it in production for a shared cache. It is not thread-safe, and because get also mutates the list, wrapping with synchronized turns every read into a serialized operation. It has no TTL, no stats, and LRU is easily polluted by a single scan. In production I use Caffeine: thread-safe, with maximumSize, expiry, hit-rate stats, and the W-TinyLFU policy which beats LRU."

> Senior tip: do not hand-roll an LRU with LinkedHashMap in a production service unless the cache is tiny and accessed by a single thread. Caffeine is not only faster but also avoids scan-induced cache eviction and provides metrics to know whether the cache is effective.`,
    follow: [
      "Why can an access-order {{get}} cause CME while iterating the map?",
      "What drawbacks does LRU have compared to LFU/W-TinyLFU?",
      "How would you add TTL to a hand-written LinkedHashMap cache?"
    ]
  },
  'collections-006': {
    q: "When should you use {{TreeMap}}/{{NavigableMap}}? Why must the comparator be consistent with {{equals}}, and what happens if it is not?",
    a: `**Summary:** {{TreeMap}} is a red-black tree that keeps keys in order, supporting range/floor/ceiling queries in O(log n); the comparator (or {{compareTo}}) must be consistent with {{equals}}, otherwise the map/set will treat two different keys as one and **silently lose data**.

### NavigableMap
- {{firstKey}}, {{lastKey}}, {{floorKey(k)}} (<= k), {{ceilingKey(k)}} (>= k), {{lowerKey}}, {{higherKey}}.
- {{headMap(k, inclusive)}}, {{tailMap}}, {{subMap(from, to)}} are **views** — mutating a view affects the backing map.
- {{pollFirstEntry}}, {{pollLastEntry}} are handy for a priority queue with removal.
- {{descendingMap}} reverses order; {{TreeSet}} is the set counterpart.

### Use cases
- In-memory range queries: find a time window, price bucket, or version >= X.
- Small leaderboards or simple schedulers (but in production prefer a heap/Redis sorted set).
- Grouping by intervals: {{subMap(from, true, to, false)}}.
- Finding the nearest neighbor (1 dimension).

### Comparator and equals
- {{TreeMap}} does **not** use {{equals}}/{{hashCode}} to identify keys; it uses {{compare()}}.
- If {{compare(a, b) == 0}} but {{a.equals(b)}} is false, the map treats them as the **same key**: {{put(b, ...)}} overwrites a's value, {{size()}} does not grow, {{get(b)}} returns a's value. This violates the {{Map}} contract.
- Classic example: {{new TreeSet<>(Comparator.comparing(String::length))}} — "ab" and "cd" both have length 2, so only one is kept.
- The comparator must also be **transitive** and **consistent**: otherwise the red-black tree can lose balance or search incorrectly.
- For keys with a natural {{compareTo}}: ensure {{compareTo == 0}} ⇔ {{equals == true}}. {{BigDecimal}} is the famous trap: {{new BigDecimal("1.0").equals(new BigDecimal("1.00"))}} is false but {{compareTo}} is 0, so using it as a TreeMap key will merge them.
- Null: {{TreeMap}} does not allow null keys unless the comparator handles null; natural ordering throws NPE.

### Difference from HashMap
- {{TreeMap}}: O(log n), ordered, higher memory, no null key by default.
- {{HashMap}}: O(1) average, unordered; {{LinkedHashMap}} keeps insertion/access order.
- If you only need sorting at output time, using HashMap and sorting on demand is faster for write-heavy workloads.

### Real-world example
A tiered-fee system used {{TreeMap<BigDecimal, Fee>}} with amount thresholds as keys and looked up tiers via {{floorEntry(amount)}}. The configuration imported from Excel had two rows, "1000000" and "1000000.00", with different fee rates (a data-entry error); because {{compareTo}} considers them equal, the later row **overwrote** the earlier one with no error — ~1.2% of transactions were charged the wrong fee for 6 weeks. Fix: normalize keys with {{setScale(2)}} on load, **error out** if {{put}} returns a non-null previous value (duplicate detection), and add a test for the config. {{floorEntry}} was still the cleanest way to look up tiers — switching to a sorted list + linear scan had been 20x slower with 5,000 tiers.

### Sample interview answer
"TreeMap is a red-black tree that keeps keys ordered, with O(log n) operations. I use it when I need range queries or nearest-element lookups: floorKey, ceilingKey, subMap, headMap, for example finding a fee tier by amount or a time window. The key point is that TreeMap does not use equals and hashCode; it uses compareTo or the comparator to identify keys. If the comparator returns 0 for two keys that equals considers different, the map treats them as the same key, the later put overwrites the earlier one, and there is no error. Examples are a comparator by string length, or BigDecimal 1.0 and 1.00 where compareTo is 0 but equals differs. So the comparator must be consistent with equals; I normalize BigDecimal scale before using it as a key and check the return value of put to detect duplicates."

> Senior tip: when using a custom comparator, write a unit test asserting that **different** keys remain separate entries; this is the kind of bug that throws no exception and only silently drops records, making it very hard to detect. With BigDecimal, always normalize ({{stripTrailingZeros}}) before using as a key, e.g. {{bd.stripTrailingZeros().toPlainString()}} — {{toPlainString}} alone does not normalize ("1.0" and "1.00" stay different).`,
    follow: [
      "Why is {{BigDecimal}} a trap as a {{TreeMap}} key?",
      "Is {{subMap}} a view or a copy, and what does that imply?",
      "When should you use {{TreeMap}} instead of sorting a {{HashMap}} on demand?"
    ]
  },
  'collections-007': {
    q: "When should {{CopyOnWriteArrayList}} and {{BlockingQueue}} be used? Compare {{ArrayBlockingQueue}}, {{LinkedBlockingQueue}}, {{SynchronousQueue}}.",
    a: `**Summary:** {{CopyOnWriteArrayList}} copies the entire array on every write, reads without locking — suitable for listener lists that are **read-heavy, write-very-rare**; {{BlockingQueue}} is for producer-consumer patterns; choose by bounded/unbounded, throughput, and handoff mechanism.

### CopyOnWriteArrayList
- Every write operation ({{add}}, {{set}}, {{remove}}) creates a new array and updates the {{volatile}} reference; reads use the current array without locking.
- Iterator is a **snapshot**: no CME, no {{remove}}; may see old data.
- Write cost is O(n) in both time and memory; continuous writes ⇒ heavy GC pressure.
- Good for: listener / observer lists that change rarely, read-mostly config, event bus subscribers.
- Not good for: caches, queues, large collections updated frequently.
- {{CopyOnWriteArraySet}} is similar for small sets.

### BlockingQueue
- Supports {{put}} (waits when full), {{take}} (waits when empty), timeout variants {{offer(e, t, unit)}}, {{poll(t, unit)}}.
- Used by thread pools ({{ThreadPoolExecutor}} uses a queue), processing pipelines, backpressure.

| Queue | Bound | Features | Use when |
|---|---|---|---|
| {{ArrayBlockingQueue}} | yes | array, lock + condition, fairness optional | need strict limit, medium throughput, predictable memory |
| {{LinkedBlockingQueue}} | optional | node, 2 locks (put/take) | high throughput; **defaults to unbounded** so easy OOM |
| {{SynchronousQueue}} | 0 | direct handoff, no storage | cached thread pool, hand off to consumer immediately |
| {{PriorityBlockingQueue}} | unbounded | heap, priority | tasks with priority, accept unbounded |
| {{DelayQueue}} | unbounded | elements only available after delay | retry, light scheduler |
| {{LinkedTransferQueue}} | unbounded | transfer, high performance | high-performance producer-consumer |

### How to choose
- Always set a **bound** for production queues; unbounded queues just delay OOM rather than prevent it.
- Need backpressure: use a small {{ArrayBlockingQueue}} + {{CallerRunsPolicy}} or block the producer.
- Need high throughput with many producers/consumers: {{LinkedBlockingQueue}} with a reasonable bound.
- Need immediate handoff with no backlog: {{SynchronousQueue}}.
- Need priority: {{PriorityBlockingQueue}} but remember it is unbounded and does not guarantee FIFO for equal priority.
- With virtual threads (Java 21), {{SynchronousQueue}} / {{ArrayBlockingQueue}} still work well; avoid overly large queues that lose backpressure benefits.

### Pitfall
- {{LinkedBlockingQueue}} defaults to {{Integer.MAX_VALUE}} — one of the most common causes of OOM when using {{Executors.newFixedThreadPool}} (unbounded queue).
- {{CopyOnWriteArrayList}} inside a loop with thousands of writes: O(n²).
- Not handling {{InterruptedException}}: must restore interrupt or exit gracefully.
- Poison pill to shut down consumers needs the exact consumer count, otherwise it hangs.

> Senior tip: for thread pools, always create your own {{ThreadPoolExecutor}} with a bounded queue and named threads; don't use {{Executors.newFixedThreadPool}} defaults because the unbounded queue hides overload until OOM. Monitor {{queue.size()}} and {{take}} wait times to detect bottlenecks early.`,
    follow: [
      "Why can {{Executors.newFixedThreadPool}} cause OOM when load increases?",
      "How does {{SynchronousQueue}} work when no consumer is waiting?",
      "When is {{CopyOnWriteArrayList}} a bad choice despite many reads?"
    ]
  },
  'collections-008': {
    q: "Need to store 10 million elements in memory — which collection to choose? Analyze memory footprint, boxing and primitive collections.",
    a: `**Summary:** with 10 million elements, **boxing and node overhead** decide hundreds of MB; prefer primitive arrays ({{int[]}}) or primitive collections (Eclipse Collections, fastutil) over {{ArrayList<Integer>}} or {{HashMap<Integer, ...>}}; if objects must be used, pick continuous arrays and presize.

### Quick memory math
- {{int[]}} 10M: 40 MB + array header.
- {{ArrayList<Integer>}} 10M: reference array ~40-80 MB (depends on compressed oops) **plus** 10M {{Integer}} objects ~16 bytes each ≈ 160 MB, total often 200-300 MB. If values are outside the cache {{-128..127}}, they won't be shared.
- {{LinkedList<Integer>}}: each node ~32-40 bytes + Integer ⇒ can exceed 500 MB and traverse very slowly.
- {{HashMap<Integer, Integer>}} 10M entries: bucket array + nodes + 2 Integer objects; in practice can be 700 MB to over 1 GB, and depends on load factor. A poor choice if the key is a continuous integer.
- {{String}} keys are even worse: each String ~40+ bytes + byte array.

### Root causes
- **Boxing**: each primitive becomes an object with header (12-16 bytes) + fields; Integer cache only covers -128..127.
- **Object header + alignment**: objects on HotSpot are typically 8-byte aligned; even small nodes cost ~16 bytes for the header.
- **References**: each element in an array / Object[] costs 4 bytes (heap < 32 GB with compressed oops) or 8 bytes.
- **Over-allocation**: ArrayList grows by 1.5x, HashMap capacity is a power of 2 plus load factor 0.75.

### Choice by need
- Only integer / primitive values: {{int[]}}, {{long[]}}; if dynamic, use {{IntArrayList}} (fastutil), {{IntArrayList}} / {{IntHashSet}} (Eclipse Collections), HPPC.
- Map int key → object value: {{Int2ObjectOpenHashMap}} (fastutil) or Eclipse {{IntObjectHashMap}}; avoid {{HashMap<Integer, V>}}.
- Map int → int: {{IntIntHashMap}} — huge savings.
- Need a set: {{IntOpenHashSet}} instead of {{HashSet<Integer>}}.
- Need sort / range: primitive array + {{Arrays.sort}} + {{Arrays.binarySearch}} is usually fastest and lightest.
- Data too large: consider off-heap (Chronicle Map), embedded database, or streaming instead of holding everything.
- If key is a continuous integer 0..N: use a direct array instead of a map — O(1) and smallest memory.

### Measure and verify
- Use JOL (Java Object Layout) to measure exact footprint.
- Keep {{-XX:+UseCompressedOops}} (default when heap < 32 GB) and {{-XX:+UseCompressedClassPointers}}.
- Set {{-Xmx}} and monitor GC; caching 10M objects often needs 1-2 GB of heap just for the structure, before load.
- Use JMH to measure throughput; don't optimize by feeling.

### Pitfall
- Thinking {{HashMap}} O(1) is fast enough while ignoring memory: 10M entries can cause strong GC pauses.
- Using {{ArrayList<Integer>}} and sorting: boxed comparator is much slower than {{Arrays.sort(int[])}}.
- Keeping a large collection in a static field / singleton ⇒ leak for the lifetime of the app.
- Forgetting that {{Integer.valueOf}} cache only helps for small values; real data is usually outside that range.

> Senior tip: before choosing a collection, estimate memory with a simple formula and check with JOL; if it exceeds ~30-40% of expected heap, redesign (primitive collection, chunking, or don't hold everything in RAM). This is an architecture decision, not just micro-optimization.`,
    follow: [
      "Why does {{HashMap<Integer, V>}} use much more memory than a naive calculation suggests?",
      "When should you choose a primitive array instead of a primitive collection?",
      "How do you measure exact footprint of a collection with JOL?"
    ]
  },
  'collections-009': {
    q: "{{PriorityQueue}}: internal heap, the top-K problem on large data streams, and complexity.",
    a: `**Summary:** {{PriorityQueue}} is a min-heap (binary heap) backed by an array, O(log n) for offer/poll and O(1) for peek; use it for top-K (keep the K largest/smallest elements) over a large stream with O(K) memory; it is not thread-safe, disallows null, and its iterator does not guarantee order.

### Heap structure
- Array {{Object[] queue}}; parent at i, children at 2i+1, 2i+2.
- {{offer}}: append, sift-up (bubble up) comparing with the parent.
- {{poll}}: take the root, move the last element to the root, sift-down (trickle down).
- {{peek}}: return the root without removing it.
- Not a BST — it only guarantees parent <= children (min-heap), not a total order.

### Top-K on a large stream
- Problem: find the K largest elements from a stream of N elements (N >> K, e.g. N=1 billion, K=100).
- Solution: a min-heap of size K. Scan the stream:
  - Heap size < K: {{offer}} directly.
  - Heap size = K: if the new element > root (the minimum), {{poll}} then {{offer}} the new element.
- Result: the heap holds the K largest elements, and the root is the smallest among the top-K.
- Complexity: O(N log K) time, O(K) memory — better than sorting O(N log N) when K << N.

~~~java
// Top 100 largest numbers
PriorityQueue<Long> minHeap = new PriorityQueue<>(100);
for (long v : stream) {
    if (minHeap.size() < 100) minHeap.offer(v);
    else if (v > minHeap.peek()) { minHeap.poll(); minHeap.offer(v); }
}
List<Long> top100 = minHeap.stream().sorted(Comparator.reverseOrder()).toList();
~~~

### Complexity
| Operation | Complexity |
|---|---|
| {{offer}}/{{add}} | O(log n) |
| {{poll}}/{{remove}} | O(log n) |
| {{peek}} | O(1) |
| {{contains}} | O(n) (array scan) |
| {{size}}/{{isEmpty}} | O(1) |
| Build heap from a collection | O(n) (heapify) |

### Pitfalls
- **No null**: throws NPE immediately on {{offer(null)}}.
- **Not thread-safe**: use {{PriorityBlockingQueue}} for multi-threading.
- **Iterator not sorted**: {{iterator()}} walks the heap array, not in priority order; to get sorted output use {{stream().sorted()}} or poll everything.
- **Slow comparator**: if the comparator is expensive, log n is multiplied by a large constant; consider pre-computing the key.
- **Memory**: the array doubles when full; presize with {{new PriorityQueue<>(initialCapacity)}} if K is known.

### Internals: why top-K uses a min-heap
To keep the **K largest** elements, use a **min-heap** of size K: the heap root is the smallest of the K elements currently kept — the "threshold" to enter the top. A new element larger than the root replaces the root via {{poll}} + {{offer}} (O(log K)); a smaller one is discarded (O(1)). Total cost O(n log K), memory O(K). The heap lives in an array: children of index i are at 2i+1 and 2i+2, so no per-element node objects and very cache-friendly. Building a heap from an existing array (heapify) is O(n) — faster than inserting elements one by one.

~~~java
PriorityQueue<Item> top = new PriorityQueue<>(k, Comparator.comparingLong(Item::score));
for (Item it : stream) {
    if (top.size() < k) top.offer(it);
    else if (it.score() > top.peek().score()) { top.poll(); top.offer(it); }
}
~~~

### Real-world example
A "top 100 merchants by revenue in 5 minutes" dashboard originally sorted all 2 million records on each refresh (O(n log n), allocating a large list) — 1.8 seconds and a lot of garbage. Switching to a min-heap of 100 elements during the scan: 120 ms with almost no extra allocation. When the system was split across 8 nodes, each node computed its local top 100 and sent them to an aggregator that merged 800 elements — correct because the global top-K must lie within the union of local top-K sets (with per-merchant revenue pre-aggregated).

### Sample interview answer
"PriorityQueue is a binary heap backed by an array, a min-heap by default using natural ordering or a comparator. offer and poll are log n because they sift an element up or down the tree, peek is O(1). Its iterator is not in priority order; to get sorted output you must poll elements out. For top K over a large data stream I keep a min-heap of exactly K elements: the root is the threshold to enter the top, a new element larger than the root replaces it, a smaller one is dropped. That costs n log K time and only O(K) memory, instead of sorting all the data. With distributed data, each node computes a local top K and they are merged. PriorityQueue is not thread-safe; for concurrent use there is PriorityBlockingQueue."

> Senior tip: for real-world top-K (log analytics, monitoring), use {{PriorityQueue}} + stream processing; for distributed top-K, each node computes a local top-K and merges. For very large K, consider {{TreeSet}} (O(log n) but higher memory) or an approximate algorithm (Count-Min Sketch, t-Digest).`,
    follow: [
      "Why does {{PriorityQueue}} use a min-heap for the largest top-K problem?",
      "How does {{PriorityBlockingQueue}} differ from {{PriorityQueue}}?",
      "When should you use {{TreeSet}} instead of {{PriorityQueue}}?"
    ]
  },
  'collections-010': {
    q: "{{ArrayDeque}} vs {{Stack}}/{{LinkedList}} as a stack/queue; why is {{Stack}} discouraged?",
    a: `**Summary:** {{ArrayDeque}} is the modern choice for stack/queue: a circular array, O(1) amortized push/pop/offer/poll, cache-friendly, unsynchronized, no nulls; {{Stack}} extends {{Vector}} (synchronized, legacy), {{LinkedList}} is memory-heavy and cache-miss prone — both are discouraged.

### Stack — legacy, do not use
- Extends {{Vector}}: every method is {{synchronized}}, paying an unnecessary lock cost in single-threaded code.
- Inherits {{Vector}} and thus exposes {{get}}, {{set}}, {{insert}} in the middle — breaking stack (LIFO) semantics.
- {{push}}/{{pop}} are synchronized per method, with no atomic batch support.
- The JavaDoc recommends: **"A more complete and consistent set of LIFO stack operations is provided by the Deque interface and its implementations."**

### LinkedList — expensive as a stack/queue
- Separate node objects: header + 2 references + data ≈ 32-40 bytes/entry (vs 4-8 bytes for a reference in an array).
- Pointer chasing: each {{pop}}/{{poll}} follows {{next}}/{{prev}} — many cache misses.
- Implements both {{List}} and {{Deque}}; used as a {{Deque}} it carries unnecessary {{get(i)}} and {{add(i, e)}} O(n) methods.
- Only preferable when you need a {{ListIterator}} to remove in the middle in O(1) **and** you already hold the pointer at that position.

### ArrayDeque — the standard choice
- Circular array {{Object[] elements}} + {{head}}, {{tail}} indexes.
- {{push}}/{{addFirst}}/{{offerFirst}}: decrement head, write.
- {{pop}}/{{removeFirst}}/{{pollFirst}}: read head, increment head.
- {{offerLast}}/{{pollLast}} work similarly for a queue.
- Resize: the array doubles when full (copies in two segments because it is circular).
- **No nulls allowed** (to distinguish an empty slot from a null value).
- **Not thread-safe**: use {{ConcurrentLinkedDeque}} or external synchronization if needed.
- Implements {{Deque}}, {{Queue}}, {{Cloneable}}, {{Serializable}}.

### Quick comparison
| | Stack | LinkedList | ArrayDeque |
|---|---|---|---|
| Push/Pop | O(1) sync | O(1) | O(1) amortized |
| Memory/entry | ~40 bytes (Vector) | ~32-40 bytes | 4-8 bytes (ref) |
| Cache locality | Good (array) | Poor (nodes) | Very good (array) |
| Null allowed | Yes | Yes | **No** |
| Thread-safe | Yes (sync) | No | No |

### When to use what
- Single-thread stack/queue: **ArrayDeque**.
- Multi-thread bounded queue: **ArrayBlockingQueue**.
- Multi-thread unbounded queue: **LinkedBlockingQueue** (with a bound!).
- Need priority: **PriorityQueue** / **PriorityBlockingQueue**.
- Need blocking + priority: **PriorityBlockingQueue**.
- Direct handoff: **SynchronousQueue**.

### Internals: ArrayDeque's circular array
{{ArrayDeque}} keeps an array and two indexes, {{head}} and {{tail}}. {{addFirst}} moves head back (wrapping to the end of the array when it goes below 0), {{addLast}} moves tail forward; when head meets tail the array doubles and elements are rearranged. No per-element node, no lock, so push/pop is nearly just an assignment and an index increment. {{Stack}} inherits {{Vector}}: **every** method is {{synchronized}}, and as a {{Vector}} it also exposes {{get(i)}} and {{add(i, x)}} — you can insert into the middle of a "stack", breaking the data structure's meaning.

### Real-world example
A fee-expression parser (used on every pricing request) used a {{Stack<Token>}}. The profiler showed ~6% of service CPU spent in unnecessary {{synchronized}} calls of {{Vector}}, plus {{Integer}} boxing. Switching to {{ArrayDeque<Token>}} (and a self-managed {{int[]}} for the numeric stack): parse time dropped ~40% and service CPU dropped 4%. A later code review added an ArchUnit rule banning {{java.util.Stack}}.

### Sample interview answer
"For a stack or queue I use ArrayDeque. It is a circular array with head and tail indexes, add and remove at both ends are O(1) amortized, it creates no per-element node so it saves memory and is cache-friendly, and it has no lock. Stack is a legacy class extending Vector: every method is synchronized so it pays an unnecessary lock cost, and because it inherits Vector it exposes index-based methods, so you can insert into the middle of a stack, which is wrong by design. LinkedList can act as a Deque but each element is a node, so it uses more memory and is slower to iterate. Note that ArrayDeque does not allow nulls and is not thread-safe; for concurrent use pick ConcurrentLinkedDeque or a BlockingQueue."

> Senior tip: in code review, seeing {{new Stack()}} or {{new LinkedList()}} used as a stack/queue is a refactoring opportunity to {{ArrayDeque}} — faster, lighter, and a modern API ({{push}}/{{pop}}/{{peek}} for stack, {{offer}}/{{poll}}/{{peek}} for queue).`,
    follow: [
      "Why does {{ArrayDeque}} disallow null while {{LinkedList}} allows it?",
      "How does {{ArrayDeque}} resize when the circular array is full?",
      "When is {{ConcurrentLinkedDeque}} more appropriate than {{ArrayBlockingQueue}}?"
    ]
  },
  'collections-011': {
    q: "{{List.of}} vs {{Collections.unmodifiableList}} vs copy: truly immutable or just a view; null and NPE.",
    a: `**Summary:** {{List.of}} (Java 9+) creates a **truly immutable** list (no add/remove/set, no nulls); {{Collections.unmodifiableList}} is only a **view** over the original list (mutating the original changes the view); a manual copy ({{new ArrayList<>(src)}}) creates a mutable copy. Choose by need: immutable API uses {{List.of}}/{{List.copyOf}}, defensive copy uses {{new ArrayList<>}}, read-only view uses {{unmodifiableList}}.

### List.of / List.copyOf (Java 9/10)
- {{List.of(a, b, c)}}: immutable, fixed-size, **no nulls** (throws NPE), does not support {{add}}/{{remove}}/{{set}}/{{sort}}.
- {{List.copyOf(list)}}: copies the source into an immutable list; if the source is already immutable it may return it directly (optimization).
- Internally uses {{ImmutableCollections.ListN}} (compact, no extra fields), with serialization support.
- Null: any null element throws NPE at creation — catching bad data early.

### Collections.unmodifiableList
~~~java
List<String> mutable = new ArrayList<>(List.of("a", "b"));
List<String> view = Collections.unmodifiableList(mutable);
mutable.add("c");           // OK
System.out.println(view);   // [a, b, c] — the view sees the change!
~~~
- Only **wraps** the original list, no copy; mutating methods ({{add}}, {{set}}, {{remove}}, {{sort}}) throw {{UnsupportedOperationException}}.
- The original stays mutable, so the view is unsafe if the original is shared and mutated.
- Allows null if the original allows it.
- Use when: you want to expose a read-only view to callers but still need to mutate internally; or to temporarily wrap a legacy API.

### Manual copy
~~~java
List<String> copy = new ArrayList<>(source);   // shallow copy, mutable
List<String> copy = List.copyOf(source);       // immutable copy (Java 10)
~~~
- {{new ArrayList<>(source)}}: shallow copy, fully independent, mutable, allows null.
- Use for a defensive copy in a constructor/setter when you need to own the data.

### Quick comparison
| Property | List.of/copyOf | unmodifiableList | new ArrayList() |
|---|---|---|---|
| Immutable | **Yes** | View (source mutable) | No |
| Null allowed | **No** | Follows source | Yes |
| Copy or view | Copy | View | Copy |
| Memory | Optimized (compact) | Lightweight wrapper | New array + refs |
| Serialization | Supported | Supported | Supported |

### Pitfalls
- Using {{List.of}} for a DTO/response whose data may contain null throws NPE at runtime; filter nulls first or use {{new ArrayList<>}}.
- Passing {{unmodifiableList}} to an external API while forgetting the original is still mutated internally means the caller sees "immutable" data that changes.
- {{List.copyOf(null)}} throws NPE; {{Collections.unmodifiableList(null)}} throws NPE.
- {{List.of}} does not implement {{RandomAccess}} (evaluated sequentially), but index access is O(1) because it is array-backed.

### Internals: what List.of returns
{{List.of(a, b)}} returns internal classes optimized by size ({{ImmutableCollections.List12}} for 1-2 elements, {{ListN}} for more) — no spare array, no modCount. Every mutating method throws {{UnsupportedOperationException}}. {{List.copyOf(x)}} does **not copy** if x is already an immutable list of this kind (it returns it directly), otherwise it copies — so calling {{copyOf}} repeatedly across layers is nearly free. {{contains(null)}} on {{List.of}} throws NPE (nulls are banned entirely), unlike {{ArrayList}}. {{Collections.unmodifiableList}} is just a wrapper that forwards calls to the original list.

### Real-world example
An access-control service returned {{Collections.unmodifiableList(roles)}} to other modules, believing it was "immutable". Another module kept that list to check permissions; meanwhile the service **cleared and reloaded** {{roles}} when configuration changed, so for a few milliseconds the list was empty and some requests were randomly rejected with 403 (about 50 errors per reload). Fix: create a new list and swap the reference ({{this.roles = List.copyOf(newRoles)}}, volatile field) — readers see either the old list or the new one, never a half-empty state.

### Sample interview answer
"List.of creates a truly immutable list: you cannot add, remove, or set elements, it disallows nulls, and it is optimized by size. List.copyOf creates an immutable copy, and if the input is already an immutable list it returns it directly so it is cheap. Collections.unmodifiableList is only a read-only view wrapping the original: the holder cannot mutate it, but if the original is mutated the view sees the change immediately. new ArrayList from another list is a mutable copy. I choose by purpose: public APIs return List.copyOf for true immutability, defensive copies in constructors also use copyOf, and unmodifiableList only when I intentionally want readers to see the latest updates. Note that List.of throws NPE on nulls, including contains(null), so data that may contain null must be handled first."

> Senior tip: a public API returning a collection should **always use {{List.copyOf}}/{{Set.copyOf}}/{{Map.copyOf}}** (Java 10+) to guarantee true immutability; internally use mutable {{ArrayList}}/{{HashMap}}. Do not use {{unmodifiableList}} for a public API unless there is a strong reason (extreme performance, huge list, want to avoid a copy).`,
    follow: [
      "Why does {{List.of}} disallow null while {{ArrayList}} allows it?",
      "Does {{List.copyOf}} optimize when the source is already immutable?",
      "How would you create an immutable list that can contain null (if truly needed)?"
    ]
  },
  'collections-012': {
    q: "{{WeakHashMap}}, {{IdentityHashMap}}: mechanism and real use cases (class-key cache, graph traversal).",
    a: `**Summary:** {{WeakHashMap}} uses {{WeakReference}} for keys — entries disappear when the key has no strong reference (good for metadata cache by class / object); {{IdentityHashMap}} uses {{==}} instead of {{equals}} / {{hashCode}} (good for graph traversal, object identity). Neither is thread-safe.

### WeakHashMap
- Entry: key wrapped in {{WeakReference}}, value is a strong reference.
- GC: when the key only has a weak reference (no strong references to it), GC clears the weak reference ⇒ entry removed on the next access (or via {{expungeStaleEntries}}).
- **Not** cleaned up immediately; {{size()}} may count entries waiting for cleanup.
- Value must **not** be weak — if the value holds a strong reference back to the key, the key will never be GC'd.

~~~java
// Cache metadata for Class (ClassLoader may unload)
Map<Class<?>, Meta> cache = new WeakHashMap<>();
Meta getMeta(Class<?> clazz) {
    return cache.computeIfAbsent(clazz, Meta::new);
}
~~~

### WeakHashMap use cases
- **Class / ClassLoader metadata cache**: when the class unloads, the entry cleans itself.
- **Observer / listener registry**: listener is the key, value is the callback; listener GC ⇒ entry disappears automatically (prevents memory leaks).
- **Short-lived object cache**: key is an object managed by the caller's lifecycle.
- **Not for**: shared data cache (value may hold the key), heavy caching (use Caffeine / Guava).

### IdentityHashMap
- Compares keys by **{{==}}** (identity), not {{equals}} / {{hashCode}}.
- Hash uses {{System.identityHashCode(key)}} (usually based on address).
- Violates {{Map}} contract (equals / hashCode) — used intentionally.
- Iterator order is undefined but stable within a single traversal.

### IdentityHashMap use cases
- **Graph traversal**: visited set for object graphs (cycle detection), key is the node object — identity needed because nodes may be {{equals}} but different instances.
- **Object-to-metadata mapping**: attach metadata to objects where {{equals}} / {{hashCode}} is not controlled (third-party libraries, JPA proxy entities).
- **Serialization / deep copy**: tracking already-processed objects.
- **Proxy / wrapper**: key is a proxy instance, {{equals}} delegates but identity is different.

### Comparison
| | WeakHashMap | IdentityHashMap |
|---|---|---|---|
| Key equality | {{equals}} (on referent) | **{{==}}** (identity) |
| Key reference | {{WeakReference}} | Strong |
| Auto cleanup | When key GC'd | No |
| Thread-safe | No | No |
| Null key | Allowed | Allowed |

### Pitfall
- {{WeakHashMap}} {{size()}} is not accurate (counts stale entries); use {{expungeStaleEntries}} if needed.
- {{WeakHashMap}} value holding reference back to key ⇒ leak (circular reference); use {{WeakReference}} for value if necessary.
- {{IdentityHashMap}} violates Map contract — don't use for keys with business {{equals}} / {{hashCode}} logic.
- Both are not thread-safe; wrap with {{Collections.synchronizedMap}} or use concurrent alternatives.

> Senior tip: {{WeakHashMap}} is a "safety net" for lightweight metadata caches, not a replacement for production caches (Caffeine). {{IdentityHashMap}} is rare but irreplaceable when identity semantics are needed — don't try to hack {{equals}} / {{hashCode}} to achieve the same thing.`,
    follow: [
      "Why should a {{WeakHashMap}} value not hold a reference back to the key?",
      "How does {{IdentityHashMap}} use {{System.identityHashCode}} — how are collisions handled?",
      "When should you use {{WeakHashMap}} instead of manually managing {{ReferenceQueue}} + {{WeakReference}}?"
    ]
  }
});
