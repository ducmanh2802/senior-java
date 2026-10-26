/*
 * English translation of js/data/lessons-collections.js — task T262. Format: js/core/i18n.js (content overlay).
 * ids: lesson-collections-001 lesson-collections-002
 */
App.i18n.content({
  'lesson-collections-001': {
    title: 'HashMap from the inside: hashing, buckets, resize and the equals/hashCode contract',
    goals: [
      'Explain which steps a {{put}} call goes through and why it is O(1) on average',
      'Know when a bucket turns into a red-black tree and why resize is expensive',
      'Write correct {{equals}}/{{hashCode}} for a key and avoid keys getting "lost" in the map',
    ],
    body: `### HashMap is an array of buckets
Inside {{HashMap}} is an array {{table}}, each element is a **bucket**. When you call {{put(key, value)}}:

1. Compute {{key.hashCode()}} then **mix the bits**: {{h ^ (h >>> 16)}}. The reason: the bucket index only uses a few low bits, so folding the high 16 bits down helps keys that differ in the high bits from piling into the same bucket.
2. Bucket index = {{(n - 1) & hash}} where {{n}} is the array size. Because {{n}} is always a **power of 2**, this AND is equivalent to a modulo but faster.
3. If the bucket is empty: create a new node. If there is already a node: walk the nodes; if a node has the same {{hash}} **and** {{equals}} returns true, overwrite the value; otherwise append a new node at the end.

~~~java
Map<String, Integer> m = new HashMap<>();   // table not created yet: lazy, the first put allocates 16 buckets
m.put("VCB", 1);   // hash("VCB") → bucket i
m.put("TCB", 2);   // different bucket → O(1)
m.get("VCB");      // recompute the hash → correct bucket → compare equals → 1
~~~

**Why O(1) on average?** If the hash spreads evenly, each bucket holds 0–1 node, so {{get}} is just computing the hash plus one comparison. The worst case is every key sharing a single bucket.

### Collisions: linked list, then tree
Since Java 8, a bucket starts as a **linked list**. When a bucket has **8 nodes** (TREEIFY_THRESHOLD) **and** the table already has **at least 64 buckets** (MIN_TREEIFY_CAPACITY), that bucket becomes a **red-black tree**, so lookup inside the bucket drops from O(n) to O(log n). If the table is still smaller than 64, HashMap **resizes** instead of treeifying, because the collisions are most likely just the table being too crowded. Once the tree has ≤ 6 nodes (after a resize), it turns back into a list.

The tree needs keys that can be compared: if the key implements {{Comparable}} it uses {{compareTo}}, otherwise HashMap uses a tie-break order (class name, {{identityHashCode}}). This is why a system under a **HashDoS** attack (sending thousands of keys with the same hash) still copes with O(log n) instead of collapsing under O(n²).

### Resize: why it is expensive and how to avoid it
When the number of entries exceeds **threshold = capacity × loadFactor** (default 16 × 0.75 = 12), the array is **doubled** and every node is redistributed. Java 8 does not recompute the hash: it looks at the bit {{hash & oldCap}}: if it is 0 the node stays at its old index, if it is 1 it moves to old index + oldCap. Even so, resize is still O(n) and allocates a new array.

| Situation | What to do |
|---|---|
| You know there will be roughly 10,000 entries | {{new HashMap<>(14_000)}} (≈ n / 0.75), or {{HashMap.newHashMap(10_000)}} since Java 19 |
| The map is read-only after creation | {{Map.copyOf(...)}}: immutable, more compact in memory |
| Many threads writing concurrently | {{ConcurrentHashMap}}, **not** HashMap |

> HashMap is not thread-safe. In Java 7, two threads resizing concurrently could create a loop in the list that makes {{get}} run forever (100% CPU). Java 8 fixed that loop, but concurrent writes can still **lose data**.

### The equals/hashCode contract
HashMap finds the bucket via {{hashCode}} and only then compares {{equals}}, so two rules are mandatory:
- If {{a.equals(b)}} then {{a.hashCode() == b.hashCode()}}. Violate this and two "equal" keys land in different buckets, so {{get}} returns null.
- {{hashCode}} must be **stable** while the object sits in the map. If the key is a mutable object and you change a field that participates in the hash **after put**, the entry stays in the old bucket: {{get}} no longer finds it, yet the entry still occupies memory. This is a common kind of memory leak.

~~~java
final class AccountKey {                   // final class + final fields: an immutable key
    private final String bankCode, accountNo;
    AccountKey(String bankCode, String accountNo) { this.bankCode = bankCode; this.accountNo = accountNo; }
    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AccountKey k)) return false;      // pattern matching (Java 16+)
        return bankCode.equals(k.bankCode) && accountNo.equals(k.accountNo);
    }
    @Override public int hashCode() { return Objects.hash(bankCode, accountNo); }  // use EXACTLY the fields used by equals
}
~~~

Since Java 16, {{record AccountKey(String bankCode, String accountNo)}} generates {{equals}}/{{hashCode}}/{{toString}} that follow the contract, so this is the way to go for keys.

### Interview relevance
Interviewers often follow up: why capacity is a power of 2, when treeify happens, why {{ConcurrentHashMap}} disallows null keys (you cannot tell "absent" apart from "value is null" when reading concurrently), and the mutable-key-lost scenario. Finish the two exercises below and you can answer all four.`,
    exercises: [
      {
        title: 'Write equals/hashCode for an account key',
        prompt: `Class {{AccountKey}} is used as a key in {{Map<AccountKey, Long>}} storing balances by (bank code, account number). It currently does not override {{equals}}/{{hashCode}}, so two objects with the same value are treated as two different keys.

Override **equals** and **hashCode** following the contract: equal when {{bankCode}} and {{accountNo}} are the same; {{equals(null)}} and comparisons with other types return false. Assume the two fields are never null.`,
        hints: [
          'equals: check the same reference, then check the type with instanceof (instanceof on null is always false), then compare each field.',
          'hashCode must use exactly the fields that participate in equals: {{Objects.hash(bankCode, accountNo)}}.',
        ],
        explain: `Common mistake: overriding {{equals}} but forgetting {{hashCode}}. Then {{a.equals(b)}} is true while the two objects still have different default {{hashCode}} values (identity-based), so {{get(b)}} looks in a different bucket and returns null, while HashSet keeps both copies.

Using {{instanceof}} instead of {{getClass() != o.getClass()}} is fine here because the class is {{final}} (no subclass can break symmetry). In real code, {{record AccountKey(String bankCode, String accountNo)}} gives an equivalent result without hand-writing it.`,
      },
      {
        title: 'A two-line LRU cache with LinkedHashMap',
        prompt: `Write {{LruCache<K, V>}} with a fixed capacity: {{get}} returns the value (null if absent) and marks the key as **recently used**; {{put}} inserts/overwrites and, when over capacity, **evicts the least recently used key**; {{size}} returns the number of entries.

Target hint: use {{LinkedHashMap}} in **access-order** mode instead of writing your own linked list.`,
        hints: [
          'Constructor {{LinkedHashMap(initialCapacity, loadFactor, accessOrder)}}: pass {{true}} so the iteration order is access order.',
          'Override {{removeEldestEntry}} in an anonymous subclass: return {{size() > capacity}}.',
        ],
        explain: `{{LinkedHashMap}} keeps an additional doubly linked list across all entries. With {{accessOrder = true}}, every {{get}}/{{put}} moves the entry to the end, so the first entry in the list is always the least recently used one. {{put}} calls {{removeEldestEntry}} after inserting; returning true removes the first entry. All operations remain O(1).

Not thread-safe: to use it across threads, wrap it in {{Collections.synchronizedMap}} (slow under contention) or use a library such as Caffeine (W-TinyLFU algorithm, better hit rate than plain LRU). Note: with access-order, even {{get}} **changes the structure** of the map, so iterating over the map while calling {{get}} throws {{ConcurrentModificationException}}.`,
      },
    ],
    check: [
      {
        q: 'Default HashMap (capacity 16, loadFactor 0.75): when does the bucket array grow from 16 to 32?',
        options: ['When adding the 13th entry', 'When adding the 16th entry', 'When one bucket has 8 nodes', 'When adding the 17th entry'],
        answer: 0,
        explain: `Threshold = 16 × 0.75 = 12; when size exceeds 12 (that is, the 13th entry) the array doubles to 32. (The very first put also calls resize(), but only to allocate the 16-bucket array because HashMap initializes lazily.) A bucket with 8 nodes only leads to treeify (if capacity ≥ 64) or an early resize, not the normal resize condition. 16 and 17 confuse this with capacity.`,
      },
      {
        q: 'The key is a mutable object; after {{put}} you change a field that participates in {{hashCode}}. What happens?',
        options: ['HashMap moves the entry to the new bucket automatically', '{{get}} with that key usually returns null, while the entry still occupies memory', 'It throws {{ConcurrentModificationException}}', 'Nothing, because HashMap compares with equals'],
        answer: 1,
        explain: `HashMap does not know the key changed: the entry stays in the bucket computed from the old hash, while {{get}} computes the new hash and looks in a different bucket. HashMap does not move entries automatically; CME only happens when you modify the structure while iterating; and equals is only called **after** the bucket has been chosen by hash.`,
      },
      {
        q: 'When does a bucket turn into a red-black tree (Java 8+)?',
        options: ['As soon as there is a collision', 'When the bucket has 8 nodes and the table has at least 64 buckets', 'When size exceeds the threshold', 'When the key implements Comparable'],
        answer: 1,
        explain: `Both conditions are required: TREEIFY_THRESHOLD = 8 nodes in the bucket and MIN_TREEIFY_CAPACITY = 64; if the table is smaller, HashMap resizes instead of treeifying. A single collision only creates a list; exceeding the threshold triggers a resize; Comparable only helps order nodes in the tree, it does not decide treeify.`,
      },
    ],
  },
  'lesson-collections-002': {
    title: 'ArrayList from the inside: a dynamic array, 1.5x growth and the cost of removing from the middle',
    goals: [
      'Describe how {{ArrayList}} stores data and by what formula capacity grows',
      'State the complexity of {{get}}, {{add}}, {{add(index, e)}}, {{remove(index)}}, {{contains}} correctly and explain why',
      'Avoid production bugs: removing inside a loop, {{remove(int)}} with {{List<Integer>}}, and keeping a {{subList}} that leaks memory',
    ],
    body: `### ArrayList is just an Object[] plus a size field
Inside {{ArrayList}} there are exactly two important fields: the array {{Object[] elementData}} and the integer {{size}}. **Capacity** is the array length ({{elementData.length}}), while **size** is the number of entries actually in use. The slots from {{size}} onward are always {{null}}.

Because the data sits contiguously in one array, {{get(i)}} is just a bounds check followed by a read of {{elementData[i]}}: genuinely **O(1)**, and very friendly to the CPU cache (reading adjacent slots sequentially, which the CPU can prefetch). This is why in practice {{ArrayList}} is almost always faster than {{LinkedList}}, even for many operations where Big-O theory says {{LinkedList}} wins.

### Grow: why 1.5x and not +1
The no-arg constructor does **not** allocate immediately: it assigns a shared empty array. The first {{add}} creates an array of **10 slots** (DEFAULT_CAPACITY). When the array is full, {{grow()}} creates a larger array and {{Arrays.copyOf}} copies everything over:

~~~java
// JDK 17, ArrayList.grow (simplified): add half of the old capacity
int newCapacity = ArraysSupport.newLength(oldCapacity,
        minCapacity - oldCapacity,     // minimum: must have enough room
        oldCapacity >> 1);             // desired: +50%
// in effect: old + max(minGrowth, old >> 1)  →  10, 15, 22, 33, 49, 73, 109...
~~~

**Why multiply proportionally?** If you added just +1 slot each time, adding n entries would copy 1 + 2 + ... + n = O(n²) times. Multiplying by a constant factor (1.5) keeps the total copying at O(n), so the **amortized** cost of each {{add}} at the end is **O(1)**. The 1.5 factor instead of 2 is a compromise: at most about 33% wasted memory instead of 50%.

**ArrayList does not shrink on its own.** If you add 1 million entries and then call {{clear()}}, the 1-million-slot array is still there (all null). To give memory back, call {{trimToSize()}} or create a new list.

### Why removing from the middle is slow
{{remove(index)}} must **shift** every element after it up one slot to fill the gap, then set the last slot to null so the GC can reclaim the object:

~~~java
// JDK 17, ArrayList.fastRemove (simplified)
int newSize = size - 1;
if (newSize > i)
    System.arraycopy(es, i + 1, es, i, newSize - i);   // shift (size - i - 1) elements
es[size = newSize] = null;                             // not nulling = keeping the reference, leaking memory
~~~

{{System.arraycopy}} is a very fast intrinsic (close to memmove), but it is still **O(n - i)**: removing at the front of a 1-million-entry list shifts nearly 1 million slots. {{add(index, e)}} is the same, in the opposite direction. Removing at the **end**, on the other hand, shifts nothing: O(1).

| Operation | Complexity | Why |
|---|---|---|
| {{get(i)}} / {{set(i, e)}} | O(1) | index-based array access |
| {{add(e)}} at the end | O(1) amortized | an occasional O(n) grow, spread out |
| {{add(i, e)}} / {{remove(i)}} | O(n - i) | shift the elements after it |
| {{remove(size - 1)}} | O(1) | nothing to shift |
| {{contains(o)}} / {{indexOf(o)}} / {{remove(Object)}} | O(n) | linear scan, calls {{equals}} |
| {{removeIf(pred)}} | O(n) | mark then shift in one pass |

### Common production bugs
- **Removing inside a loop by index** from start to end: after removing slot i, the next element shifts into slot i and gets skipped. Removing one at a time with {{remove(0)}} in a loop is O(n²): 200 thousand entries can take seconds. Use {{list.removeIf(...)}} (O(n)).
- **Modifying the list in a for-each** throws {{ConcurrentModificationException}}: the iterator compares the list's {{modCount}} with the value it remembered at creation.
- **{{remove(int)}} vs {{remove(Object)}}** with {{List<Integer>}}: {{list.remove(1)}} removes the element at **index 1**, not the value 1. To remove a value use {{list.remove(Integer.valueOf(1))}}.
- **{{subList}} is a view**: it keeps a reference to the entire backing array. Slicing 10 elements out of a 1-million-entry list and caching the result keeps all 1 million entries in memory. To detach it use {{new ArrayList<>(list.subList(a, b))}}. If you structurally modify the backing list afterwards, using the subList throws CME.
- **{{Arrays.asList}}** returns a fixed-size list (wrapping the array directly): {{add}}/{{remove}} throw {{UnsupportedOperationException}}. {{List.of}} is fully immutable and disallows null.
- **Not knowing the size in advance**: reading 5 million lines into {{new ArrayList<>()}} grows about 30 times and creates a lot of large garbage arrays. If you know it, use {{new ArrayList<>(expected)}} or {{ensureCapacity}}.

> Memory: {{ArrayList<Integer>}} costs 4 bytes per reference (compressed oops) **plus** 16 bytes per Integer object outside the -128..127 cache. With tens of millions of numbers, {{int[]}} (4 bytes per element) is about 5 times smaller.

### Interview relevance
The classic question: "ArrayList or LinkedList?". Senior answer: almost always {{ArrayList}} (or {{ArrayDeque}} for a queue), because array locality beats LinkedList's 24 bytes per node and pointer chasing; LinkedList is only "O(1)" when you are **already standing at** the node to insert at. Interviewers also often ask: default capacity, the growth formula, why amortized O(1), and how to remove many elements safely. The exercise below makes you rewrite those mechanisms yourself.`,
    exercises: [
      {
        title: 'Write your own MiniArrayList: add, get, remove and 1.5x growth',
        prompt: `Complete {{MiniArrayList<E>}} to accurately mimic the JDK's {{ArrayList}}:

- Initially {{elementData}} is an empty array (capacity 0, lazy initialization).
- {{add(e)}}: append. If the array is full: capacity 0 creates an array of **10** slots; otherwise the new capacity is {{old + (old >> 1)}}. Copy the old data into the new array.
- {{add(index, e)}}: insert at {{index}} (allowing {{index == size}}), shifting the elements after it to the right. Grow the same way as {{add(e)}}.
- {{get(index)}}: return the element; if {{index < 0}} or {{index >= size}} throw {{IndexOutOfBoundsException}}.
- {{remove(index)}}: remove and return the element, shift the elements after it up, and **null the old last slot** so it does not leak memory. Bounds-check like {{get}}.
- Never shrink the array.

The {{size()}}, {{capacity()}}, {{slot(i)}} methods are already provided so the tests can look inside.`,
        hints: [
          'Write a helper {{growIfFull()}}: if {{size == elementData.length}} compute the new capacity (0 → 10, otherwise {{old + (old >> 1)}}) and use {{Arrays.copyOf}}.',
          'Shift elements with {{System.arraycopy(src, srcPos, dest, destPos, length)}}: it handles overlapping source and destination in the same array correctly.',
          'In {{remove}}: the number of elements to shift is {{size - index - 1}}; then {{elementData[--size] = null}}.',
        ],
        explain: `Key idea: {{add}} at the end is almost always O(1), only occasionally copying everything on grow; because capacity grows geometrically (×1.5), the total copying cost for n adds is still O(n). {{add(index, e)}} and {{remove(index)}} must shift {{size - index}} elements, so the closer to the front, the more expensive.

Common mistakes:
- Forgetting {{elementData[--size] = null}}: the last slot still points to the "removed" object, so the GC cannot reclaim it (loitering reference). The JDK nulls it out too.
- Bounds-checking with {{elementData.length}} instead of {{size}}: {{get(size)}} then returns null instead of throwing.
- Shifting with a for loop from left to right when **inserting**: you overwrite data before copying it. If you write the loop yourself, insertion must run from right to left; {{System.arraycopy}} handles overlap itself.
- Computing {{old * 1.5}} with double: slower and prone to rounding errors; the JDK uses {{old >> 1}}.`,
      },
    ],
    check: [
      {
        q: 'You call {{new ArrayList<>()}} and then add 11 elements one by one. What is the capacity of the internal array now?',
        options: ['11', '15', '20', '16'],
        answer: 1,
        explain: `The first add allocates 10 slots. The 11th element fills the array, so it grows to {{10 + (10 >> 1)}} = 15. 20 confuses this with a factor of 2 (like Vector's default), 16 confuses it with HashMap, and 11 assumes ArrayList grows by exactly 1 slot each time.`,
      },
      {
        q: '{{List<Integer> l = new ArrayList<>(List.of(5, 1, 7));}} then call {{l.remove(1)}}. What is the result?',
        options: ['[5, 7]: removes the element at index 1', '[5, 7]: removes the value 1', '[1, 7]: removes the value 5', 'Compile error because it is ambiguous'],
        answer: 0,
        explain: `There are two overloads, {{remove(int index)}} and {{remove(Object o)}}. The argument {{1}} is an {{int}}, so it matches {{remove(int)}} exactly with no autoboxing; therefore it removes **index 1**, and here that element happens to have the value 1 so the result looks the same. The "removes the value 1" option has the wrong mechanism: with {{List.of(5, 3, 7)}} it would remove 3. There is no compile error because overload resolution prefers the match that needs no boxing. To remove by value: {{l.remove(Integer.valueOf(1))}}.`,
      },
      {
        q: 'The loop {{while (!list.isEmpty()) list.remove(0);}} on a 1-million-entry ArrayList is very slow. Why?',
        options: ['Each remove(0) must shift the whole remaining part, O(n²) total', 'ArrayList shrinks the array after every remove', 'isEmpty() scans the whole list so it is O(n)', 'remove throws and catches ConcurrentModificationException on every iteration'],
        answer: 0,
        explain: `{{remove(0)}} calls {{System.arraycopy}} to shift {{size - 1}} elements, accumulating n + (n-1) + ... ≈ n²/2 shifts. ArrayList never shrinks on its own; {{isEmpty()}} only compares {{size == 0}} (O(1)); and there is no iterator so there is no CME. The right way: {{clear()}}, remove from the end, or use {{ArrayDeque}} if you need to take from the front.`,
      },
    ],
  },
});
