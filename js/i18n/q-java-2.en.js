/*
 * English translation of js/data/q-java.js — task T160. Format: js/core/i18n.js (content overlay).
 * ids: collections-002 collections-003 collections-004 collections-005 collections-006 collections-007 collections-008 collections-009 collections-010 collections-011 collections-012
 */
App.i18n.content({
  'collections-002': {
    q: `How does {{ConcurrentHashMap}} work in Java 8 (CAS + synchronized on the bin)? Why is {{size()}} not exactly accurate and why are null keys/values forbidden?`,
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
      `Why can {{computeIfAbsent}} cause deadlock if the mapping function updates the same map?`,
      `What does {{ConcurrentHashMap}} guarantee for its iterator and {{size()}}?`,
      `When should {{Collections.synchronizedMap}} be preferred over CHM?`
    ]
  },
  'collections-003': {
    q: `{{ArrayList}} vs {{LinkedList}}: how does cache locality affect them, and when does {{LinkedList}} really win?`,
    a: `**Summary:** {{ArrayList}} stores elements in a contiguous array, so sequential traversal is extremely fast thanks to cache locality and random access O(1); {{LinkedList}} uses scattered nodes, each with a header + 2 references, so traversal is slow and memory-heavy. {{LinkedList}} almost never wins in real workloads; {{ArrayDeque}} is usually better for queue/stack.

### Inside
- {{ArrayList}}: {{Object[] elementData}} + {{size}}. Append amortized O(1); insert/delete middle O(n) due to {{System.arraycopy}} shifting elements. When full, grow by ~1.5x ({{oldCapacity + (oldCapacity >> 1)}}).
- {{LinkedList}}: node {{prev, item, next}}; each node is a separate object. {{get(i)}} O(n) (traverse from head or tail); add/remove at ends O(1); remove via {{Iterator}} O(1) because the node is already known.

### Cache locality
- CPU reads by cache line (typically 64 bytes). The {{Object[]}} array is contiguous, so sequential access almost always hits cache; JIT also optimizes array loops well.
- Each LinkedList node lives on the heap and may be scattered; accessing {{next}} is **pointer chasing**, and each step can cause a cache miss. Traversing 1 million elements can be many times slower than ArrayList despite the same O(n).
- Memory: LinkedList node costs object header (~16 bytes) + 3 references (~12-24 bytes depending on compressed oops) ≈ 32-40 bytes per element; ArrayList only stores references inside the array (4-8 bytes) plus array overhead.

### When LinkedList makes sense
- Need both {{List}} and {{Deque}}, many insertions/removals at both ends, and **no** index access. But {{ArrayDeque}} can do this faster and with less memory.
- Remove in the middle when you already have a {{ListIterator}} at the exact position (O(1) for the removal operation), but the cost to **reach** that position is still O(n), and locality is poor.
- Very large lists with continuous middle insertions/deletions and no index need — rare in backend; usually a different structure (skip list, tree, queue) is better.

### Real world
- Most backend code uses {{ArrayList}}; queue/stack uses {{ArrayDeque}}; priority uses {{PriorityQueue}}; concurrent queue uses {{ArrayBlockingQueue}} / {{LinkedBlockingQueue}}.
- {{LinkedList}} is sometimes used as a {{Deque}} in older code, but {{ArrayDeque}} is ~several times faster in benchmarks.
- Don't pick a collection based on pure Big-O; constants and memory matter a lot.

> Senior tip: if you see {{LinkedList}} in code, ask immediately "is middle insertion/removal with an iterator truly needed?"; 90% of cases switching to {{ArrayList}} or {{ArrayDeque}} will be faster and reduce heap. Measure with JMH on real data instead of gut feeling.`,
    follow: [
      `Why does {{ArrayDeque}} usually replace {{LinkedList}} as queue/stack?`,
      `What is the memory impact of ArrayList's 1.5x growth?`,
      `When should you initialize {{ArrayList}} with a preset capacity?`
    ]
  },
  'collections-004': {
    q: `Fail-fast and fail-safe iterators: how are they different? When does {{ConcurrentModificationException}} occur and how to avoid it?`,
    a: `**Summary:** fail-fast iterator checks {{modCount}} and throws {{ConcurrentModificationException}} if the collection is modified outside the iterator; fail-safe (weakly consistent) such as {{ConcurrentHashMap}} or snapshot such as {{CopyOnWriteArrayList}} does not throw but may see old/incomplete data.

### Fail-fast
- {{ArrayList}}, {{HashMap}}, {{HashSet}}... have a {{modCount}} field that increases on every structural change.
- Iterator stores {{expectedModCount}}; each {{next()}} / {{remove()}} compares it, and any mismatch throws CME immediately.
- This is **best-effort detection**, not a synchronization mechanism: it does not guarantee detection of every case, especially multi-threaded.
- CME can happen even in **a single thread** when using for-each and calling {{list.remove(x)}} or {{map.put}} concurrently.

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
- {{list.remove(int)}} differs from {{it.remove()}}; only the iterator knows to update {{expectedModCount}}.
- {{for (int i...)}} followed by {{remove(i)}} does not throw but **skips** an element due to index shift — a silent bug worse than CME.

### Fail-safe / weakly consistent
- {{ConcurrentHashMap}}: iterator does not throw CME, reflects state at a point in time; may or may not see ongoing changes. {{size()}} is also only an estimate.
- {{CopyOnWriteArrayList}}: iterator works on a **snapshot** of the array at creation time; modifications to the list do not affect the iterator, but the iterator does not support {{remove}}.
- {{Collections.synchronizedList}}: iterator is **still fail-fast**; to traverse safely you must wrap the entire loop in {{synchronized (list)}} (per Javadoc).
- {{ConcurrentSkipListMap}} is weakly consistent similarly.

### How to avoid
- Modify through the iterator ({{it.remove()}}, {{it.set()}}).
- Use {{removeIf}}, {{replaceAll}}, {{computeIfPresent}}.
- For maps, use {{entrySet().removeIf}}, {{map.compute}} instead of removing in for-each.
- Multi-threaded: use the correct concurrent collection, or copy to a new list before iterating if only a snapshot is needed.
- Do not assume {{Collections.synchronizedList}} makes the iterator safe.

### Pitfall
- Catching CME and ignoring it hides a bug; CME signals a logic error, not a temporary failure to retry.
- Iterating over {{subList}} and then modifying the parent list also causes CME.
- Modifying the collection inside its own {{forEach}} also throws CME (except for concurrent collections).

> Senior tip: in code review, prefer {{removeIf}} / {{computeIfAbsent}} because they are concise and avoid CME; with CHM, don't rely on {{size()}} to exit a loop in concurrent environments — use the operation result or count locally.`,
    follow: [
      `Why can {{Collections.synchronizedList}} still throw CME during iteration?`,
      `Does {{CopyOnWriteArrayList}} iterator support {{remove}}, and why?`,
      `In a multi-threaded app is CME always caused by multi-threading?`
    ]
  },
  'collections-005': {
    q: `How do you use {{LinkedHashMap}} as an LRU cache? How do {{removeEldestEntry}} and access-order work, and should it be used in production?`,
    a: `**Summary:** enable {{accessOrder = true}} so that each {{get}} / {{put}} moves the entry to the end of the list, override {{removeEldestEntry}} to return {{size() > capacity}} to auto-remove the oldest entry; simple but **not thread-safe** and without stats/expiry, so production usually uses Caffeine.

### Mechanism
- {{LinkedHashMap}} extends {{HashMap}} and links entries with a doubly-linked list ({{before}} / {{after}}).
- By default **insertion-order**; constructor {{LinkedHashMap(int capacity, float loadFactor, boolean accessOrder)}} with {{accessOrder = true}} switches to **access-order**.
- In access-order, {{get}} and {{put}} (including {{getOrDefault}}, {{compute}}) count as "access" and move the entry to the end.
- {{removeEldestEntry(Map.Entry)}} is called after each insertion; return {{true}} and the entry at the **head** (least recently used) is removed.

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

- You can override {{removeEldestEntry}} to return false for certain keys (pinning) or log on eviction.

### Limits
- **Not thread-safe**: concurrent {{get}} changes the linked list (access-order) ⇒ must wrap with {{synchronized}} or use {{Collections.synchronizedMap}}; but then all operations are sequential, losing the benefit.
- **No TTL**: only evicts by size, not by time.
- **No statistics**: hit rate, eviction count must be counted manually.
- **No better policy than LRU**: LRU is vulnerable to "cache pollution" from a sequential scan (each new item pushes out old cache).
- **Memory overhead**: adds 2 references per entry compared to HashMap; for large caches with small entries the overhead is significant.
- {{get}} in access-order is a **structural modification** for iterator purposes: iterating and calling {{get}} concurrently can cause CME in the same thread.

### Production
- Use **Caffeine**: {{Caffeine.newBuilder().maximumSize(10_000).expireAfterWrite(...).recordStats().build()}}, supports W-TinyLFU (better than LRU), async loading, stats, thread-safe.
- Or Guava Cache (simpler, fewer features than Caffeine).
- Redis / Memcached if distributed cache; need clear invalidation policy.
- For in-JVM caches always set **maximumSize** to avoid OOM; an unlimited cache is a timed bomb.

> Senior tip: don't write an LRU with LinkedHashMap in a production service unless the cache is very small and only one thread accesses it. Caffeine is not only faster but also avoids the scan-cleaning pattern, and provides metrics to know if the cache is effective.`,
    follow: [
      `Why can access-order {{get}} cause CME when iterating over the map?`,
      `What are the drawbacks of LRU compared to LFU / W-TinyLFU?`,
      `How do you add TTL to a custom LinkedHashMap cache?`
    ]
  },
  'collections-006': {
    q: `When should {{TreeMap}} / {{NavigableMap}} be used? Why must the comparator be consistent with {{equals}} and what happens if it isn't?`,
    a: `**Summary:** {{TreeMap}} is a red-black tree that keeps keys in order, allowing range / floor / ceiling queries in O(log n); the comparator (or {{compareTo}}) must be consistent with {{equals}}, otherwise the map/set will treat two different keys as one and **silently lose data**.

### NavigableMap
- {{firstKey}}, {{lastKey}}, {{floorKey(k)}} (≤ k), {{ceilingKey(k)}} (≥ k), {{lowerKey}}, {{higherKey}}.
- {{headMap(k, inclusive)}}, {{tailMap}}, {{subMap(from, to)}} are **views** — changes to the view affect the parent map.
- {{pollFirstEntry}}, {{pollLastEntry}} are convenient for priority queues with removal.
- {{descendingMap}} reverses order; {{TreeSet}} is similar for sets.

### Use case
- Range queries in memory: find time windows, price buckets, versions ≥ X.
- Small leaderboard, simple scheduler (but production should use a heap / Redis sorted set).
- Group by intervals: {{subMap(from, true, to, false)}}.
- Find nearest neighbor (1D).

### Comparator and equals
- {{TreeMap}} does **not use** {{equals}} / {{hashCode}} to identify keys; it uses {{compare()}}.
- If {{compare(a, b) == 0}} but {{a.equals(b)}} is false, the map treats them as the **same key**: {{put(b, ...)}} overwrites the value of {{a}}, {{size()}} does not increase, {{get(b)}} returns a's value. This violates the {{Map}} contract.
- Classic example: {{new TreeSet<>(Comparator.comparing(String::length))}} — "ab" and "cd" have the same length 2, so only one is kept.
- The comparator must also be **transitive** and **consistent**: otherwise the red-black tree can become unbalanced or searches can fail.
- For keys with natural {{compareTo}}: ensure {{compareTo == 0}} ⇔ {{equals == true}}. {{BigDecimal}} is a famous trap: {{new BigDecimal("1.0").equals(new BigDecimal("1.00"))}} is false but {{compareTo}} is 0 ⇒ using it as a TreeMap key will merge them.
- Null: {{TreeMap}} does not allow null keys unless the comparator handles it; natural ordering throws NPE.

### Difference from HashMap
- {{TreeMap}}: O(log n), ordered, higher memory, no null key by default.
- {{HashMap}}: O(1) average, unordered; {{LinkedHashMap}} preserves insertion / access order.
- If sorting is only needed for output, use HashMap and sort when needed — faster for write-heavy workloads.

> Senior tip: when using a custom comparator, write unit tests asserting that **different** keys remain separate elements; this is the kind of bug that throws no exception but silently loses records and is extremely hard to detect. With BigDecimal, always normalize ({{stripTrailingZeros}}) before using as a key, e.g. {{bd.stripTrailingZeros().toPlainString()}} — note {{toPlainString}} alone does not normalize ("1.0" and "1.00" remain different).`,
    follow: [
      `Why is {{BigDecimal}} a trap when used as a TreeMap key?`,
      `Is {{subMap}} a view or a copy, and how does that affect behavior?`,
      `When should you use {{TreeMap}} instead of sorting a {{HashMap}} when needed?`
    ]
  },
  'collections-007': {
    q: `When should {{CopyOnWriteArrayList}} and {{BlockingQueue}} be used? Compare {{ArrayBlockingQueue}}, {{LinkedBlockingQueue}}, {{SynchronousQueue}}.`,
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
      `Why can {{Executors.newFixedThreadPool}} cause OOM when load increases?`,
      `How does {{SynchronousQueue}} work when no consumer is waiting?`,
      `When is {{CopyOnWriteArrayList}} a bad choice despite many reads?`
    ]
  },
  'collections-008': {
    q: `Need to store 10 million elements in memory — which collection to choose? Analyze memory footprint, boxing and primitive collections.`,
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
      `Why does {{HashMap<Integer, V>}} use much more memory than a naive calculation suggests?`,
      `When should you choose a primitive array instead of a primitive collection?`,
      `How do you measure exact footprint of a collection with JOL?`
    ]
  },
  'collections-009': {
    q: `{{PriorityQueue}}: internal heap, top-K on large data streams, complexity.`,
    a: `**Summary:** {{PriorityQueue}} is a min-heap (binary heap) backed by an array, O(log n) for offer/poll, O(1) peek; used for top-K (keep K largest / smallest elements) on large streams with O(K) memory; not thread-safe, no null allowed, iterator does not guarantee order.

### Heap structure
- Array {{Object[] queue}}; parent at i, children at 2i+1, 2i+2.
- {{offer}}: add at end, sift-up (bubble up) comparing with parent.
- {{poll}}: take root, move last to root, sift-down (trickle down).
- {{peek}}: return root without removal.
- Not a BST — only guarantees parent ≤ children (min-heap), not full ordering.

### Top-K on large streams
- Problem: find K largest elements from a stream of N elements (N >> K, e.g. N=1B, K=100).
- Solution: min-heap of size K. Iterate stream:
  - Heap size < K: {{offer}} directly.
  - Heap size = K: if new element > root (min), {{poll}} then {{offer}} new.
- Result: heap holds the K largest elements, root is the smallest in top-K.
- Complexity: O(N log K) time, O(K) memory — better than sort O(N log N) when K << N.

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
| {{offer}} / {{add}} | O(log n) |
| {{poll}} / {{remove}} | O(log n) |
| {{peek}} | O(1) |
| {{contains}} | O(n) (scan array) |
| {{size}} / {{isEmpty}} | O(1) |
| Build heap from collection | O(n) (heapify) |

### Pitfall
- **No null allowed**: throws NPE immediately on {{offer(null)}}.
- **Not thread-safe**: use {{PriorityBlockingQueue}} for multi-threading.
- **Iterator not sorted**: {{iterator()}} scans the heap array, not in priority order; to get sorted output use {{stream().sorted()}} or poll all.
- **Slow comparator**: if the comparator is slow, log n multiplies by a large constant; consider pre-computing a sort key.
- **Memory**: array doubles when full; presize with {{new PriorityQueue<>(initialCapacity)}} if K is known.

> Senior tip: for real-world top-K (log analytics, monitoring), use {{PriorityQueue}} + stream processing; if distributed top-K is needed, each node computes local top-K then merges. For very large K, consider {{TreeSet}} (O(log n) but higher memory) or approximate algorithms (Count-Min Sketch, t-Digest).`,
    follow: [
      `Why does {{PriorityQueue}} use a min-heap for the largest-top-K problem?`,
      `How does {{PriorityBlockingQueue}} differ from {{PriorityQueue}}?`,
      `When should you use {{TreeSet}} instead of {{PriorityQueue}}?`
    ]
  },
  'collections-010': {
    q: `{{ArrayDeque}} vs {{Stack}} / {{LinkedList}} as stack / queue; why is {{Stack}} discouraged?`,
    a: `**Summary:** {{ArrayDeque}} is the modern choice for stack / queue: circular array, O(1) amortized push/pop/offer/poll, cache-friendly, unsynchronized, no null allowed; {{Stack}} extends {{Vector}} (synced, legacy), {{LinkedList}} is memory-heavy and cache-missing — both should be avoided.

### Stack — legacy, don't use
- Extends {{Vector}}: every method is {{synchronized}} ⇒ unnecessary lock cost for single-thread use.
- Inherits {{Vector}} methods like {{get}}, {{set}}, {{insert}} at arbitrary positions — breaks the LIFO stack semantics.
- {{push}} / {{pop}} are synchronized individually, not atomic batches.
- JavaDoc recommends: **"A more complete and consistent set of LIFO stack operations is provided by the Deque interface and its implementations."**

### LinkedList — expensive for stack / queue
- Separate node objects: header + 2 references + data ≈ 32-40 bytes per entry (vs 4-8 bytes for a reference in an array).
- Pointer chasing: each {{pop}} / {{poll}} accesses {{next}} / {{prev}} — many cache misses.
- Implements both {{List}} and {{Deque}}; used as {{Deque}} it carries unnecessary methods like {{get(i)}}, {{add(i, e)}} O(n).
- Only preferred when you need a {{ListIterator}} to remove in the middle O(1) **and** you already have the pointer at that position.

### ArrayDeque — the standard choice
- Circular array {{Object[] elements}} + {{head}}, {{tail}} indexes.
- {{push}} / {{addFirst}} / {{offerFirst}}: decrement head, write.
- {{pop}} / {{removeFirst}} / {{pollFirst}}: read head, increment head.
- {{offerLast}} / {{pollLast}} similarly for queue.
- Resize: array doubles when full (copy 2 arrays due to circular layout).
- **No null allowed** (to distinguish empty slot from null value).
- **Not thread-safe**: use {{ConcurrentLinkedDeque}} or external sync if needed.
- Implements {{Deque}}, {{Queue}}, {{Cloneable}}, {{Serializable}}.

### Quick comparison
| | Stack | LinkedList | ArrayDeque |
|---|---|---|---|
| Push/Pop | O(1) sync | O(1) | O(1) amortized |
| Memory/entry | ~40 bytes (Vector) | ~32-40 bytes | 4-8 bytes (ref) |
| Cache locality | Good (array) | Bad (node) | Very good (array) |
| Null allowed | Yes | Yes | **No** |
| Thread-safe | Yes (sync) | No | No |

### When to use what
- Stack / Queue single-thread: **ArrayDeque**.
- Bounded multi-thread queue: **ArrayBlockingQueue**.
- Unbounded multi-thread queue: **LinkedBlockingQueue** (with a bound!).
- Need priority: **PriorityQueue** / **PriorityBlockingQueue**.
- Need blocking + priority: **PriorityBlockingQueue**.
- Direct handoff: **SynchronousQueue**.

> Senior tip: in code review, seeing {{new Stack()}} or {{new LinkedList()}} used as stack / queue is a refactoring opportunity to {{ArrayDeque}} — faster, lighter, modern API ({{push}} / {{pop}} / {{peek}} for stack, {{offer}} / {{poll}} / {{peek}} for queue).`,
    follow: [
      `Why does {{ArrayDeque}} not allow null while {{LinkedList}} does?`,
      `How does {{ArrayDeque}} resize when the circular array is full?`,
      `When is {{ConcurrentLinkedDeque}} more appropriate than {{ArrayBlockingQueue}}?`
    ]
  },
  'collections-011': {
    q: `{{List.of}} vs {{Collections.unmodifiableList}} vs copy: truly immutable or just a view; null and NPE.`,
    a: `**Summary:** {{List.of}} (Java 9+) creates a **truly immutable** list (cannot add/remove/set, no null allowed); {{Collections.unmodifiableList}} is only a **view** over the source list (source changes reflect in the view); manual copy ({{new ArrayList<>(src)}}) creates a mutable copy. Choose by need: immutable API uses {{List.of}} / {{List.copyOf}}, defensive copy uses {{new ArrayList<>}}, read-only view uses {{unmodifiableList}}.

### List.of / List.copyOf (Java 9/10)
- {{List.of(a, b, c)}}: immutable, fixed-size, **no null** (throws NPE), does not support {{add}} / {{remove}} / {{set}} / {{sort}}.
- {{List.copyOf(list)}}: copies the source into an immutable list; if the source is already immutable it may return itself (optimization).
- Internally: uses {{ImmutableCollections.ListN}} (compact, no extra fields), supports serialization.
- Null: any null element ⇒ NPE immediately upon creation — catches bugs early.

### Collections.unmodifiableList
~~~java
List<String> mutable = new ArrayList<>(List.of("a", "b"));
List<String> view = Collections.unmodifiableList(mutable);
mutable.add("c");           // OK
System.out.println(view);   // [a, b, c] — view sees change!
~~~
- Only **wraps** the source list, does not copy; mutating methods ({{add}}, {{set}}, {{remove}}, {{sort}}) throw {{UnsupportedOperationException}}.
- Source remains mutable ⇒ view is not safe if the source is shared and modified.
- Allows null if the source allows it.
- Use when: you want to expose a read-only view to callers but need to mutate internally; or temporarily wrap legacy APIs.

### Manual copy
~~~java
List<String> copy = new ArrayList<>(source);   // shallow copy, mutable
List<String> copy = List.copyOf(source);       // immutable copy (Java 10)
~~~
- {{new ArrayList<>(source)}}: shallow copy, fully independent, mutable, allows null.
- Use for defensive copy in constructors / setters when you need ownership.

### Quick comparison
| Property | List.of / copyOf | unmodifiableList | new ArrayList() |
|---|---|---|---|
| Immutable | **Yes** | View (source mutable) | No |
| Null allowed | **No** | Per source | Yes |
| Copy or view | Copy | View | Copy |
| Memory | Optimized (compact) | Lightweight wrapper | New array + refs |
| Serialization | Supported | Supported | Supported |

### Pitfall
- Using {{List.of}} for DTO / response when data may contain null ⇒ NPE at runtime; filter null first or use {{new ArrayList<>}}.
- Passing {{unmodifiableList}} to external APIs while forgetting the source can still be mutated internally ⇒ caller sees "immutable" data that changes.
- {{List.copyOf(null)}} throws NPE; {{Collections.unmodifiableList(null)}} throws NPE.
- {{List.of}} does not implement {{RandomAccess}} (sequential access is evaluated), but index access is O(1) due to array backing.

> Senior tip: public APIs returning collections should **always use {{List.copyOf}} / {{Set.copyOf}} / {{Map.copyOf}}** (Java 10+) to guarantee true immutability; internally use mutable {{ArrayList}} / {{HashMap}}. Don't use {{unmodifiableList}} for public APIs unless there is a strong reason (extreme performance, huge list, don't want to copy).`,
    follow: [
      `Why does {{List.of}} forbid null while {{ArrayList}} allows it?`,
      `Does {{List.copyOf}} optimize when the source is already immutable?`,
      `How do you create an immutable list that allows null (if truly needed)?`
    ]
  },
  'collections-012': {
    q: `{{WeakHashMap}}, {{IdentityHashMap}}: mechanism and real use cases (class-key cache, graph traversal).`,
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
      `Why should a {{WeakHashMap}} value not hold a reference back to the key?`,
      `How does {{IdentityHashMap}} use {{System.identityHashCode}} — how are collisions handled?`,
      `When should you use {{WeakHashMap}} instead of manually managing {{ReferenceQueue}} + {{WeakReference}}?`
    ]
  }
});