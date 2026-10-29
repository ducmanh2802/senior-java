/*
 * English translation of js/data/q-java.js — task T371. Format: js/core/i18n.js (content overlay).
 * ids: collections-019 collections-020 collections-021 collections-022 collections-023 collections-024 collections-025 collections-026 modern-017
 */
App.i18n.content({
  'collections-019': {
    q: 'You need to count orders by status and group orders by customer using a {{HashMap}}. How do you implement this using {{getOrDefault}}, {{putIfAbsent}}, {{computeIfAbsent}}, and {{merge}}? What are the common pitfalls for each?',
    a: `**Summary:** Use {{map.merge(key, 1, Integer::sum)}} for counting frequencies; use {{map.computeIfAbsent(key, k -> new ArrayList<>()).add(value)}} for grouping. These replace the "get-check-put" pattern, which is verbose and error-prone. Main pitfalls: {{merge}} removes the key if the function returns {{null}}, {{computeIfAbsent}} doesn't store anything if the function returns {{null}}, and {{HashMap}} throws {{ConcurrentModificationException}} if the mapping function modifies the map itself.

### Quick Understanding
Think of a notebook: each page is a customer. The old way is "find the page, if not found, tear out a new page, then write". Java 8 gives you powerful shortcuts: "write to customer X's page, if not found, create it automatically" ({{computeIfAbsent}}), or "add 1 to X's count, if not found, start at 1" ({{merge}}).

### Terminology
- **getOrDefault(k, d)**: Returns value if mapping exists, otherwise returns {{d}}; doesn't modify the map.
- **putIfAbsent(k, v)**: Puts {{v}} only if the key is missing (or mapped to {{null}}); always creates {{v}} even if not used.
- **computeIfAbsent(k, f)**: If key is missing, calls {{f}} to create value, stores it, and returns it.
- **merge(k, v, f)**: If key is missing, stores {{v}}; if key exists, stores {{f(old, v)}}.

### Implementation Steps
~~~java
Map<Status, Integer> countByStatus = new EnumMap<>(Status.class);
Map<Long, List<Order>> byCustomer = new HashMap<>();
for (Order o : orders) {
    // 1. merge: stores 1 on first time, calls Integer.sum(old, 1) thereafter
    countByStatus.merge(o.status(), 1, Integer::sum);
    // 2. computeIfAbsent: creates ArrayList only when the customer is new, then adds
    byCustomer.computeIfAbsent(o.customerId(), k -> new ArrayList<>()).add(o);
}
int pending = countByStatus.getOrDefault(Status.PENDING, 0);
~~~
1. {{merge}} searches the bucket by hash **exactly once**, making it faster than {{get}} + {{put}} (which search twice).
2. {{computeIfAbsent}} only calls the lambda when a key is truly missing. Crucially, {{putIfAbsent(k, new ArrayList<>())}} creates a new list in **every** loop iteration, wasting memory and increasing GC pressure.
3. The return value of {{computeIfAbsent}} is the value **now in the map**, so you can call {{.add(o)}} directly on it.

### Common Pitfalls
1. **Returning null from merge removes the key**: {{map.merge(k, -1, (a, b) -> a + b == 0 ? null : a + b)}} removes the key when the count hits 0. This might be desired or might cause data loss. Also, passing {{v = null}} to {{merge}} throws NPE.
2. **getOrDefault doesn't handle null values**: If the key maps to {{null}}, it returns {{null}}, not the default value.
3. **Modifying the map inside the lambda**: Since Java 9, {{HashMap.computeIfAbsent}} detects structural modifications within the mapping function and throws {{ConcurrentModificationException}} (e.g., recursive calls).
4. **Thinking it's thread-safe**: These methods on {{HashMap}} are not atomic across threads; use {{ConcurrentHashMap}}, and do not perform I/O within the lambda as it holds a lock on the bucket.

### Interview Summary
"For counting, I use {{merge}} with {{Integer::sum}}; for grouping, I use {{computeIfAbsent}} then {{add}}. They are faster by searching the bucket once and avoid creating redundant objects like {{putIfAbsent}}. I watch out for three pitfalls: {{merge}} returns null to remove the key, {{getOrDefault}} still returns null if the value is null, and the lambda must not modify the map. If concurrency is needed, I switch to {{ConcurrentHashMap}}, where these methods are atomic per key."

> Senior tip: If data is already in a collection, {{Collectors.groupingBy}} is often cleaner; use {{merge}}/{{computeIfAbsent}} when processing data streams (Kafka, file lines). For Enum keys, use {{EnumMap}} for speed and natural ordering.`,
    follow: ['Why is putIfAbsent(k, new ArrayList<>()) costlier in large loops than computeIfAbsent?', 'Are merge operations on ConcurrentHashMap atomic, and what are the risks of slow lambdas?', 'Rewrite the counting example using Collectors.groupingBy.']
  },
  'collections-020': {
    q: 'Class {{Employee}} needs to be sorted by ID in most places, but the report screen needs it sorted by salary descending and then by name. Do you use {{Comparable}} or {{Comparator}} for each case, and how do you write {{compareTo}} correctly?',
    a: `**Summary:** {{Comparable}} defines the **natural ordering**, which is unique and resides within the class ({{compareTo}}). Use it for ID sorting. {{Comparator}} defines **external orderings**, allowing multiple variations, which fits the "salary descending, then name" report. When writing comparisons, use {{Integer.compare}}/{{Long.compare}} or {{Comparator.comparing}}, and never subtract values directly due to overflow risks.

### Quick Understanding
{{Comparable}} is like the "ID number" printed on a student ID card: everyone agrees on it, and there's only one. {{Comparator}} is like a slip of paper the teacher holds: today we sort by height, tomorrow by score. Each slip is a separate rule, and you don't need to change the ID card.

### Terminology
- **compareTo(o)**: Returns a negative number if this < o, 0 if equal, and positive if this > o.
- **Natural ordering**: The order used by {{TreeMap}}, {{TreeSet}}, and {{Collections.sort(list)}} when no comparator is provided.
- **Consistent with equals**: {{compareTo == 0}} if and only if {{equals}} is true.

### Implementation
~~~java
record Employee(long id, String name, BigDecimal salary) implements Comparable<Employee> {
    @Override
    public int compareTo(Employee o) {
        return Long.compare(id, o.id);     // DO NOT use (int) (id - o.id)
    }
}
// Report: salary descending, then name ascending
Comparator<Employee> report = Comparator
        .comparing(Employee::salary, Comparator.reverseOrder())
        .thenComparing(Employee::name);
list.sort(report);              // list.sort() does not modify Employee
Collections.sort(list);          // uses natural ordering: by id
~~~
When {{list.sort(report)}} compares two employees: (1) it extracts salary and compares in reverse; (2) if different, it returns immediately; (3) if equal (returns 0), it moves to {{thenComparing}} for the name. This chain is safe because each step only runs if the previous one tied.

### Why subtraction is a trap
{{a - b}} with {{int}} can overflow: {{Integer.MIN_VALUE - 1}} becomes {{Integer.MAX_VALUE}} (positive), meaning the smallest number is sorted **after** the largest. With {{long}} cast to {{int}}, it's even worse. This bug only appears with extreme values, often slipping past tests.

### When to choose which
| Situation | Choose |
|---|---|
| Class has one obvious ordering (id, date, amount) | {{Comparable}} |
| Multiple ways to sort, dependent on context | {{Comparator}} |
| Class cannot be modified (library, external code) | {{Comparator}} |
| Key for {{TreeMap}}/{{TreeSet}} | {{Comparable}} or pass {{Comparator}} to constructor |

### Common Pitfalls
1. **compareTo inconsistent with equals**: {{TreeSet}} considers two objects with {{compareTo == 0}} as duplicates and **discards one**, even if {{equals}} returns false.
2. **Type inference issues with reversed()**: {{Comparator.comparing(e -> e.salary()).reversed()}} fails to compile because the lambda type inference is {{Object}}. Use method references {{Employee::salary}} or explicit types.
3. **Null values**: fields being null make {{compareTo}} throw NPE; use {{Comparator.nullsLast(...)}}.

### Interview Summary
"{{Comparable}} is the natural order in the class, unique, used by {{TreeMap}} and {{Collections.sort}} by default; I use it here for ID sorting. {{Comparator}} is for external orders; for the report, I use {{comparing}} with {{reverseOrder}} then {{thenComparing}}. I avoid subtraction due to overflow risks, and I keep {{compareTo}} consistent with {{equals}} to prevent {{TreeSet}} from losing elements."

> Senior tip: Don't implement {{Comparable}} just because one screen needs sorting; business requirements change. Keep ordering as named {{Comparator}} constants ({{Employee.BY_SALARY_DESC}}) and write unit tests covering duplicate values, nulls, and extreme values.`,
    follow: ['Why can TreeSet lose elements when compareTo is inconsistent with equals?', 'Does Comparator.comparing(...).reversed() reverse the entire chain or just the first key?', 'Is BigDecimal compareTo consistent with equals?']
  },
  'collections-021': {
    q: 'Given 5 scenarios: look up product by ID, list of IDs already processed (no duplicates), history of actions in chronological order, leaderboard of scores always kept sorted, job queue. Which collection do you choose for each and why?',
    a: `**Summary:** Choose collections by asking 3 questions: **look up by what** (index, key, or just existence), **allow duplicates?**, and **what order needed** (none, insertion order, or sorted)? For the 5 scenarios: {{HashMap}}, {{HashSet}}, {{ArrayList}}, {{TreeMap}}/{{TreeSet}}, {{ArrayDeque}} (or {{PriorityQueue}} if priority exists).

### Quick Understanding
Collections are like different types of storage in a warehouse: numbered shelves ({{List}}, indexed lookup), cabinets with name labels ({{Map}}, keyed lookup), bags holding items ({{Set}}, no duplicates), and pipes ({{Queue}}/{{Deque}}, FIFO/LIFO). Choosing the wrong one still works, but makes finding items extremely slow.

### Terminology
- **O(1)**: Time remains constant regardless of data size; **O(log n)**: Grows slowly (1 million items take only ~20 steps); **O(n)**: Must scan everything.
- **Insertion order**: Iterates in the same order as items were added.
- **Sorted order**: Iterates based on comparison (Comparable/Comparator).

### Decision Tree
~~~text
Lookup by key?  ── yes ──> Map: need sorted? TreeMap : need insertion order? LinkedHashMap : HashMap
       │ no
Only existence check, no duplicates? ── yes ──> Set: TreeSet / LinkedHashSet / HashSet
       │ no
FIFO/LIFO? ── yes ──> ArrayDeque (if priority: PriorityQueue)
       │ no
By position ──> ArrayList
~~~

### Application to the 5 scenarios
| Scenario | Choice | Why |
|---|---|---|
| Product lookup | {{HashMap<String, Product>}} | O(1) avg lookup by key |
| Processed IDs | {{HashSet<String>}} | O(1) contains, automatically eliminates duplicates |
| Action history | {{ArrayList<Action>}} | O(1) amortized append, maintains insertion order |
| Leaderboard | {{TreeMap<Integer, List<Player>>}} | Always sorted, allows range queries (floor/ceiling), O(log n) |
| Job queue | {{ArrayDeque<Job>}} | O(1) offer/poll at both ends |

For the leaderboard, use {{TreeMap}} by score where the value is a {{List<Player>}} because multiple players can have the same score; if you used {{TreeSet<Player>}}, you'd need the comparator to also distinguish by ID, or players with the same score would be considered identical and lost.

### Common Pitfalls
1. **Using List to check existence**: {{list.contains(x)}} is O(n); in a 100k loop, this becomes 10 billion comparisons. Switch to {{HashSet}}.
2. **Relying on iteration order of HashMap/HashSet**: Order is not guaranteed and can change on resize. Use {{LinkedHashMap}}/{{LinkedHashSet}} if order is needed.
3. **Using Stack or LinkedList as a queue in single-thread**: {{ArrayDeque}} is faster and creates less garbage.
4. **HashMap key is mutable** or missing {{equals}}/{{hashCode}}: lookup fails.
5. **Using regular collections between threads**: Use concurrent versions instead.

### Interview Summary
"I ask three questions: lookup method, duplicate policy, and order requirement. Lookup by ID uses {{HashMap}}, existence uses {{HashSet}}, history uses {{ArrayList}}, leaderboard uses {{TreeMap}} (for sorted range queries), and job queue uses {{ArrayDeque}} or {{PriorityQueue}} if priority is involved. For multithreaded cases, I switch to the concurrent counterparts."

> Senior tip: In code review, seeing {{contains}}, {{indexOf}}, or {{remove(Object)}} on a {{List}} inside a loop is suspicious; switching to {{Set}} has once reduced a reconciliation job from tens of minutes to seconds. For truly massive leaderboards shared across instances, move the logic to Redis Sorted Sets.`,
    follow: ['If the leaderboard needs top 10 lookups frequently but updates scores constantly, what would you choose?', 'When is LinkedHashMap better than TreeMap?', 'When to choose PriorityQueue over TreeSet?']
  },
  'collections-022': {
    q: 'A job reconciling 100,000 transactions against 100,000 bank records takes 40 minutes, and the profiler points to {{ArrayList.contains}}. Explain why it is slow and how to fix it. State the complexity of key operations for ArrayList, LinkedList, HashMap, and TreeMap.',
    a: `**Summary:** {{ArrayList.contains}} scans sequentially and calls {{equals}} for every element, which is O(n). Calling it inside a loop n times results in O(n²): 100,000 × 100,000 = 10 billion comparisons. Fix it by putting one side into a {{HashSet}}/{{HashMap}} (O(1) average), reducing total complexity to O(n), usually taking less than a second.

### Quick Understanding
Finding a name in an **unsorted** class list requires reading from start to finish. If you need to find 100,000 names this way, you re-read the entire list 100,000 times. {{HashSet}} is like a filing cabinet with letter tabs: if you know the name, you open directly to that section, no need to read other sections.

### Terminology
- **Big-O**: How time grows as data grows, ignoring constants.
- **Average vs. Worst**: {{HashMap.get}} is O(1) average, O(log n) worst case in Java 8 due to treeification.
- **Amortized**: {{ArrayList.add}} occasionally copies, but on average it's O(1).

### Step-by-step
~~~java
// Slow: O(n * m)
List<String> bankIds = loadBankIds();          // 100k items
for (Txn t : txns) {                           // 100k loops
    if (!bankIds.contains(t.ref())) missing.add(t);  // scans up to 100k
}
// Fast: O(n + m)
Set<String> bankSet = new HashSet<>(bankIds);  // build once: O(m)
for (Txn t : txns) {
    if (!bankSet.contains(t.ref())) missing.add(t);  // O(1) average
}
~~~
1. {{new HashSet<>(bankIds)}} computes {{hashCode}} for every string and puts it in buckets: 100,000 operations.
2. Each {{contains}} computes the hash, jumps to the bucket, and compares {{equals}} only with a few items.
3. Total operations ~200,000 instead of 10 billion. Why the massive difference: n² explodes, doubling data makes O(n²) 4x slower, while O(n) is only 2x slower.

### Complexity Table
| Operation | ArrayList | LinkedList | HashMap/HashSet | TreeMap/TreeSet |
|---|---|---|---|---|
| get by index | O(1) | O(n) | - | - |
| find by value/key | O(n) | O(n) | O(1) avg | O(log n) |
| add to end | O(1) amortized | O(1) | O(1) avg | O(log n) |
| insert/delete middle | O(n) | O(n) find + O(1) link | - | - |
| ordered iteration | insertion order | insertion order | no guarantee | sorted |

Note: {{LinkedList}} is only O(1) for insert/delete **after** you are at the node (via iterator); {{list.add(i, x)}} requires walking to index i, making it O(n).

### Common Pitfalls
1. **{{list.remove(Object)}} and {{indexOf}} in loops**: also O(n), causing O(n²) performance.
2. **{{stream().filter(x -> other.contains(x))}}** where {{other}} is a List: same bug, just prettier code.
3. **Key missing {{equals}}/{{hashCode}}**: lookup fails when switched to {{HashSet}}. Use {{record}} or correct overrides.
4. **{{removeAll(list)}}**: {{ArrayList.removeAll}} calls {{contains}} on the argument, so pass a {{HashSet}} there too.

### Interview Summary
"ArrayList.contains scans sequentially O(n), so inside an n-loop it becomes O(n²), resulting in 10 billion comparisons. I build a HashSet from the bank records once, making lookup O(1), reducing overall complexity to O(n), from 40 minutes to under a second. Also, I keep in mind the complexity table for other collections."

> Senior tip: For massive datasets larger than heap (millions of rows), don't load both sides into Java; push matching to the database using {{JOIN}}/{{EXCEPT}} on indexed columns, or sort two files and merge sequentially. Correct Big-O won't save you if you run out of heap.`,
    follow: ['When does HashMap.get degrade, and how does Java 8 improve it?', 'Why is LinkedList.add(index, x) not O(1)?', 'How do you reconcile 50 million records?']
  },
  'collections-023': {
    q: 'Unit tests comparing JSON from a {{HashMap}} (or {{Set.of}}) pass sometimes and fail other times, and fail consistently after a JDK upgrade. Why? How do you iterate over a Map correctly and effectively?',
    a: `**Summary:** {{HashMap}}, {{HashSet}}, {{Set.of}}, and {{Map.of}} **do not guarantee iteration order**. The order depends on hash values, current capacity (changes on resize), JDK version, and {{Set.of}}/{{Map.of}} also use a random "salt" (randomizing order per JVM run). Tests must not rely on this order. Use {{LinkedHashMap}} (insertion order) or {{TreeMap}} (sorted) if order matters. When iterating, use {{entrySet()}} or {{forEach((k, v) -> ...)}}, not {{keySet()}} then {{get(k)}}.

### Quick Understanding
{{HashMap}} is like a parking lot partitioned by license plate number: cars are parked in spots determined by formula, not arrival time. When the lot expands (resize), the formula changes, and cars shift spots. Reading license plates from entrance to exit will yield different sequences every time.

### Terminology
- **Iteration order**: The sequence returned by for-each.
- **Resize/rehash**: When size exceeds {{capacity × 0.75}}, HashMap doubles bucket array and redistributes nodes.
- **Entry**: The key-value pair, of type {{Map.Entry<K, V>}}.

### Why order changes
1. Bucket index = {{(hash ^ (hash >>> 16)) & (capacity - 1)}}. If capacity changes, {{&}} mask takes one more bit, causing elements to split, changing order.
2. Hash algorithms may differ between JDK versions; upgrading JDK can change order.
3. {{Set.of}}/{{Map.of}} (Java 9+) intentionally shuffle order using a random "salt" so you don't accidentally rely on iteration order. Result: flaky tests.

### Iterating correctly
~~~java
Map<String, Integer> stock = new LinkedHashMap<>(); // need stable order
// Best: iterate once, both key and value available
for (Map.Entry<String, Integer> e : stock.entrySet()) {
    System.out.println(e.getKey() + "=" + e.getValue());
}
stock.forEach((sku, qty) -> System.out.println(sku + "=" + qty)); // cleaner
// Bad: double lookup; with TreeMap it's O(log n) per lookup
for (String sku : stock.keySet()) {
    Integer qty = stock.get(sku);
}
~~~

### Fixing tests
| Approach | When to use |
|---|---|
| {{assertEquals(expectedMap, actualMap)}} | {{Map.equals}} ignores order |
| Semantic JSON comparison (JSONAssert, AssertJ {{containsExactlyInAnyOrderEntriesOf}}) | API testing |
| Use {{LinkedHashMap}}/{{TreeMap}} in code | If order is a business requirement |
| Jackson {{ORDER_MAP_ENTRIES_BY_KEYS}} | JSON output needs stability for comparison/caching |

### Common Pitfalls
1. **Returning {{Set.of(...)}} or {{HashSet}} to API**: frontend displays list in different order after every deployment.
2. **Creating signatures/hashes by concatenating HashMap entries**: servers produce different signatures for the same data.
3. **Taking "first element" of HashSet** as a default value: undefined result.

### Interview Summary
"HashMap and Set.of don't guarantee order: it depends on hash, capacity, JDK, and Set.of adds randomness to avoid dependencies, causing flaky tests. I update tests to compare content-wise, or use LinkedHashMap/TreeMap if order is a requirement. I use entrySet or forEach to iterate to avoid double lookups."

> Senior tip: Flaky tests like this appear right after JDK upgrades or changing {{List}} to {{Set}}. Before upgrading, grep for serializations of {{HashMap}}/{{HashSet}} that rely on order and fix them to use stable JSON comparators or stable HMAC signatures. From Java 21, {{LinkedHashMap}}/{{LinkedHashSet}} are also {{SequencedMap}}/{{SequencedSet}}, making access to first/last elements very convenient.`,
    follow: ['Can Map.equals compare different map types (HashMap and TreeMap)?', 'Why does Set.of intentionally shuffle order?', 'How do you generate a stable HMAC signature for a Map-based payload?']
  },
  'collections-024': {
    q: 'A colleague uses {{map.keySet().remove(k)}}, modifies {{entry.setValue()}}, and returns {{bigList.subList(0, 10)}} for caching. Data is unexpectedly modified, and heap is bloated. How do "views" work in collections, and how do you handle them?',
    a: `**Summary:** {{keySet()}}, {{values()}}, {{entrySet()}}, {{subList()}}, {{headMap()}}, etc., are not copies but **views**: a window into the original collection. Writing to a view modifies the original, modifying the original updates the view, and since the view holds a reference to the original, a tiny sublist can keep a massive list in heap. If you need independent data, copy it: {{new ArrayList<>(list.subList(0, 10))}} or {{List.copyOf(...)}}.

### Quick Understanding
A view is like a window into a warehouse: you see the real goods, and reaching through the window (if allowed) changes the real warehouse inventory. Copying is like taking a photo: the photo doesn't change when the warehouse changes, but it takes physical space.

### Terminology
- **View**: An object implementing Collection/Map but with no data of its own; all operations forward to the original.
- **Write-through**: Writing to a view updates the underlying collection.
- **Structural modification**: Changing the number of elements (add/remove), distinguished from just updating values ({{set}}).

### Step-by-step
~~~java
Map<String, Integer> stock = new HashMap<>(Map.of("A", 1, "B", 0));
stock.values().removeIf(q -> q == 0);    // removes entry "B" from original map
stock.keySet().remove("A");              // map is now empty
// stock.keySet().add("C");              // UnsupportedOperationException: view doesn't know the value

List<Integer> big = new ArrayList<>(bigData);   // 1 million elements
List<Integer> top = big.subList(0, 10);         // holds reference to big
big.add(42);                                    // structural change to original
top.get(0);                                     // ConcurrentModificationException
~~~
1. {{ArrayList.subList}} stores {{parent}}, {{offset}}, {{size}}, and {{modCount}} at creation. Every operation checks the original's {{modCount}}; if it mismatches, it throws CME. Why: after the original adds/removes elements, the old offset no longer points to the correct element.
2. Because it holds {{parent}}, GC cannot reclaim the large list: caching 10,000 small sublists can keep 10,000 large lists in heap.
3. {{entry.setValue(v)}} on {{HashMap.entrySet()}} writes directly to the map node, safe during iteration; whereas {{Map.of(...)}} or {{Map.entry(k, v)}} are immutable and throw {{UnsupportedOperationException}}.

### Useful View tricks
- Delete a range: {{list.subList(from, to).clear()}} is faster than looping.
- Filter map in-place: {{map.entrySet().removeIf(e -> e.getValue() == 0)}}.

### Comparison Table
| | View | Copy |
|---|---|---|
| Creation cost | O(1) | O(n) |
| Sees original changes | yes | no |
| Keeps original in heap | yes | no |
| Safe for caching/API return | no | yes |

### Common Pitfalls
1. **Caching {{subList}}** or returning it from a method: memory leaks and hard-to-repro CME.
2. **Passing {{map.keySet()}} to other code** which then runs {{removeAll}}, losing data.
3. **Thinking {{Collections.unmodifiableList(list)}} is a snapshot**: it is a view; the original list changing updates the unmodifiable view.

### Interview Summary
"keySet, values, entrySet, subList, headMap are views, not copies. Modifying them affects the original, modifying the original causes subList to throw CME, and views hold references, causing memory leaks. I use views for in-place updates like entrySet().removeIf or subList().clear(), but I copy using List.copyOf for storage or API returns."

> Senior tip: I once investigated a production issue where heap dumps showed thousands of 200k-element {{ArrayLists}} held by {{ArrayList$SubList}} in a "top 20" cache. In MAT, look at the dominator tree; if {{SubList}} or {{KeySet}} retains massive size, someone cached the view instead of the copy.`,
    follow: ['Why is keySet().add() forbidden, but keySet().remove() allowed?', 'Does List.copyOf copy again if input is already immutable?', 'How do you detect subList memory leaks in a heap dump?']
  },
  'collections-025': {
    q: 'You know you will load 100,000 items into a {{HashMap}} and {{ArrayList}}. Should you declare initial capacity, and how to calculate it? Why does {{new HashMap<>(100_000)}} not guarantee no resizing, and what does {{HashMap.newHashMap}} (Java 19) solve?',
    a: `**Summary:** Declare initial capacity when size is known and data is large (tens of thousands or more, or in hot code). For {{ArrayList}}, {{new ArrayList<>(n)}} is sufficient. For {{HashMap}}, the constructor parameter is **number of buckets**, not number of elements; map resizes when exceeding {{capacity × 0.75}}, so pass approximately {{n / 0.75}}. Java 19 introduced {{HashMap.newHashMap(n)}}, {{HashSet.newHashSet(n)}}, {{LinkedHashMap.newLinkedHashMap(n)}}, which accept the **expected number of elements** and calculate the bucket capacity automatically.

### Quick Understanding
Setting a dinner reservation for 100 people: the restaurant rule is "tables are only filled to 75% for comfort". If you reserve 100 seats, at the 76th customer, they must move to a larger room (resize) and rearrange everyone. Reserving ~134 seats avoids resizing.

### Terminology
- **Capacity**: Number of buckets (HashMap) or array length (ArrayList).
- **Load factor**: Fill ratio before resize, default 0.75.
- **Threshold**: {{capacity × loadFactor}}; resizing triggers above this.

### Step-by-step
1. **ArrayList**: starts empty, allocates 10 on first add, expands ~1.5x each time, copying everything to a new array. 10 to 100k takes ~23 copies, creating massive garbage.
2. **HashMap**: capacity is power of 2. {{new HashMap<>(100)}} rounds up to 128, threshold 96, so 97th item triggers resize to 256: all entries rehashed.
3. **newHashMap(100)**: calculates {{ceil(100 / 0.75) = 134}}, rounds up to 256, threshold 192, holding 100 items without resize.

~~~java
List<Order> orders = new ArrayList<>(rows.size());      // correct
Map<Long, Order> byId = HashMap.newHashMap(rows.size()); // Java 19+
// Java 17: calculate manually to avoid resize
Map<Long, Order> byId17 = new HashMap<>((int) Math.ceil(rows.size() / 0.75));
~~~

### Illustrative data
| Size | Default | Declared Correctly |
|---|---|---|
| ArrayList 100k | ~23 array allocations | 1 |
| HashMap 100k | resize 14 times (16 → ... → 262,144) | 0 |

Actual performance gain is usually tens of percent in load time and less garbage, not massive speedups. Worth it for hot code or large batches, not for a map of 5 items.

### When not to declare
- Unknown size: guessing too high wastes memory (empty bucket array takes space).
- Small collections: code is cleaner without it; no measurable gain.
- Don't increase load factor to 1.0 to "save space": more collisions, slower lookup.

### Common Pitfalls
1. **{{new HashMap<>(n)}} with n as element count**: still resizes once as shown in the example.
2. **Thinking {{new ArrayList<>(n)}} creates a list of n items**: {{size()}} is still 0, {{set(5, x)}} throws {{IndexOutOfBoundsException}}.
3. **Declaring massive capacity "just in case"** for maps created per request: each request allocates large arrays, GC suffers.

### Interview Summary
"For ArrayList, pass n. For HashMap, it takes bucket count; map resizes at 75% fill, so pass n / 0.75; new HashMap(100) still resizes at 97. Java 19 added HashMap.newHashMap(n), taking expected elements. I only do this for large batches or hot code, after measuring."

> Senior tip: In a batch job loading 5 million entries into {{HashMap}}, calculating capacity correctly significantly reduces load time and GC spikes, but even bigger gains usually come from not boxing 5 million objects in heap from the start. Benchmark with JMH or check GC logs before concluding.`,
    follow: ['Why must HashMap capacity be a power of 2?', 'What are pros/cons of increasing load factor to 1.0?', 'When to use ArrayList.trimToSize?']
  },
  'collections-026': {
    q: 'You review a team\'s code and want to set guidelines for collections use across the project. What collection anti-patterns causing production issues do you see, and how do you turn them into rules (including automated checks)?',
    a: `**Summary:** The most common collection issues aren't complex algorithms but simple habits: **caching with static Map without eviction** (memory leaks), **loading entire tables into List** (OOM), **O(n²) due to contains on List**, **sharing non-thread-safe collections**, **returning null instead of empty collections**, and **leaking mutable internal collections**. Good guidelines are short, provide context/examples, and are checked by tools (static analysis, ArchUnit, load tests) instead of relying on memory.

### Quick Understanding
Collections are like containers in a warehouse: bugs rarely come from "picking the wrong container type", but from "container has no lid so it overflows", "two people reaching for the same container", or "giving the warehouse key to a customer". Guidelines are warehouse rules; automated tools are security cameras.

### Terminology
- **Unbounded**: Grows indefinitely as the app runs.
- **Static analysis**: Tools that read code looking for bugs (Sonar, Error Prone, SpotBugs).
- **ArchUnit**: Library to test architectural rules in Java code.

### Anti-patterns and Rules
| Anti-pattern | Production consequence | Rule |
|---|---|---|
| {{static Map}} cache, no eviction | heap grows, Full GC, OOM | Use Caffeine/Spring Cache with max size + TTL |
| {{findAll()}} and filter in Java | OOM on large tables | Pagination, streams, or filter in SQL |
| {{list.contains}} in loop | Slow job proportional to n² | Use Set/Map for lookup |
| HashMap/ArrayList shared across threads | Data loss, CPU spikes | Use concurrent collections or keep immutable |
| Returning {{null}} for lists | NPE at caller | Return {{List.of()}} |
| Getter returns mutable field | Caller modifies internal state | {{List.copyOf}} in constructor |
| Key is mutable or missing equals/hashCode | Lookup fails, "missing" items | Use record or immutable value as key |
| Relying on iteration order | Flaky tests, inconsistent output | Use LinkedHashMap/TreeMap |

### Guideline adoption process
1. **Gather Evidence**: Collect postmortems, heap dumps, slow jobs from 6-12 months; only include rules based on real issues. People remember stories.
2. **Keep it Short**: One line per rule, example of wrong/right code, link to incident.
3. **Automate**: Enable Sonar/Error Prone rules; add ArchUnit to ban mutable static maps in service packages; add load tests with production-sized data.
4. **Runtime Monitoring**: Cache size metrics ({{cache.size}}, hit ratio), alert on heap increasing after Full GC.
5. **Periodic Review**: Drop obsolete rules, add rules from new incidents.

~~~java
// Wrong: unbounded cache, lives for app lifecycle
private static final Map<String, Rate> RATES = new HashMap<>();
// Right: bounded, expiring, thread-safe (Caffeine)
private final Cache<String, Rate> rates = Caffeine.newBuilder()
        .maximumSize(10_000)
        .expireAfterWrite(Duration.ofMinutes(10))
        .recordStats()                      // for hit ratio metrics
        .build();
~~~

### Common Pitfalls
1. **Too long, too generic** ("use appropriate collection"): ignored by everyone.
2. **Absolute bans** (no LinkedList, no streams): causes pointless debates; prefer "default" with "exceptions allowed with justification".
3. **No tools**: rules die in reviewers' minds, bugs return when they go on vacation.

### Interview Summary
"Production collection issues usually stem from unbounded static maps, findAll followed by Java filtering, contains in loops, shared HashMaps, returning null, or leaking mutable state. I draft short guidelines based on real incidents, then automate enforcement with Sonar, ArchUnit, load tests, and runtime metrics, reviewing them periodically."

> Senior tip: My most valuable guideline rule is "every Map used as a cache MUST have a limit and metrics". One payment service had continuous Full GCs after 5 days uptime due to a {{static HashMap}} storing tokens; after switching to Caffeine with {{maximumSize}} and hit-ratio dashboards, the heap flattened and the issue disappeared.`,
    follow: ['How do you write ArchUnit rules to ban static mutable Maps?', 'How to detect unbounded caches from a heap dump?', 'When are static Maps still acceptable?']
  },
  'modern-017': {
    q: 'You review this code: {{orders.stream().filter(...).forEach(o -> result.add(o.id()))}} and another place using a single-element array {{int[] total}} for accumulation in a lambda. What is wrong/risky about this code, and how do you rewrite it in the spirit of Stream API?',
    a: `**Summary:** Lambdas in streams should be **pure functions**: take input and return output, not modify external variables (side-effects). Adding results to a list or accumulating in {{total[0]}} works for sequential streams but **fails for parallel streams** (missing elements, wrong total, possible exceptions), is hard to read and hard to test. Rewrite using built-in operations: {{map(...).toList()}}, {{collect(...)}}, {{mapToLong(...).sum()}}, {{reduce}}.

### Quick Understanding
A stream is like a factory assembly line: each station (filter, map) takes a product, processes it, and passes it on; at the end is a bin to collect goods. Side-effects are like a worker in the middle of the line grabbing products and putting them in their own bag. If there's only one line, it might work; if you open many lines in parallel (parallel stream), many people grabbing from the same bag makes a mess.

### Terminology
- **Side-effect**: Lambda changes state outside itself (add to list, increment counter, logging, DB call).
- **Stateless / non-interfering**: Stream API requirement: lambda doesn't depend on changing state and doesn't modify the source data being traversed.
- **Reduction**: Combining multiple elements into one result (sum, list, map) using {{reduce}}/{{collect}}.

### Why side-effects are dangerous
1. {{ArrayList}} is not thread-safe. In parallel streams, multiple threads call {{add}} simultaneously; two threads write to the same array slot, resulting in missing elements or {{ArrayIndexOutOfBoundsException}} during resizing.
2. The single-element array {{int[] total = new int[1]}} is a trick to bypass the "effectively final" rule (array reference doesn't change, but content does). In parallel, {{total[0] += x}} is a read-modify-write operation that isn't atomic, so the total is incorrect.
3. Even sequentially, readers have to find where {{result}} is declared. {{collect}} shows clearly "what the output is".
4. Streams are lazy: if you forget the terminal operation, lambdas with side-effects **never run**.

### Rewriting
~~~java
// Before: side-effect
List<Long> result = new ArrayList<>();
orders.stream().filter(o -> o.paid()).forEach(o -> result.add(o.id()));
// After: expression returning result
List<Long> ids = orders.stream()
        .filter(Order::paid)
        .map(Order::id)
        .toList();                         // Java 16+, unmodifiable list

long total = orders.stream()
        .filter(Order::paid)
        .mapToLong(Order::amountCents)     // avoids boxing Long
        .sum();                            // safe reduction even for parallel

Map<String, Long> countByCity = orders.stream()
        .collect(Collectors.groupingBy(Order::city, Collectors.counting()));
~~~

### When forEach is actually correct
{{forEach}} is a valid terminal operation when the **main purpose** is external action: sending events, logging, writing to files. In such cases, use it, or even a plain for-loop for readability, and avoid parallel streams if the destination is not thread-safe.

| Purpose | Use |
|---|---|
| Create new list/set/map | {{toList()}}, {{collect(...)}} |
| Calculate sum, count, min/max | {{sum}}, {{count}}, {{max}}, {{reduce}} |
| Send/write elements externally | {{forEach}} or plain for-loop |

### Common Pitfalls
1. **Using {{peek}} for business logic**: {{peek}} is for debug; JDK may skip it (e.g., {{count()}} on known sizes from Java 9).
2. **Modifying source collection in lambda** ({{list.stream().forEach(x -> list.remove(x))}}): {{ConcurrentModificationException}}.
3. **Using {{Collections.synchronizedList}} to "fix" parallel**: works, but threads fight for one lock, killing parallelism; {{collect}} keeps thread-local results and merges them, which is faster.

### Interview Summary
"Lambdas in streams should be pure functions. Adding results to an external list or int[] works sequentially but breaks in parallel because ArrayList and addition are not thread-safe, and it makes code hard to read. I rewrite using map/toList, mapToLong/sum, and groupingBy/counting. I only use forEach for external actions like sending events."

> Senior tip: In code review, I look for {{forEach(x -> list.add}}, {{new int[1]}}, {{AtomicInteger}} inside lambdas, and {{peek()}}: most can be rewritten using {{collect}}/{{reduce}}. Sonar has rules for these; enable them so reviewers don't have to repeat themselves.`,
    follow: ['Why is collect safe in parallel streams while forEach + add is not?', 'When does the JDK skip peek?', 'Is using AtomicLong in lambda a good solution?']
  }
});
