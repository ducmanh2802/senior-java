/*
 * English translation of js/data/lessons-collections.js — task T265. Format: js/core/i18n.js (content overlay).
 * ids: lesson-collections-005
 */
App.i18n.content({
  'lesson-collections-005': {
    title: 'PriorityQueue (heap) and ArrayDeque: top-K on a data stream and the sliding window',
    goals: [
      'Describe a binary heap stored inside an array, and why {{offer}}/{{poll}} are O(log n) while {{peek}} is O(1)',
      'Solve top-K over a large data stream with a min-heap of size K, in O(n log K) time and O(K) memory',
      'Choose {{ArrayDeque}} over {{Stack}}/{{LinkedList}}, and use a monotonic deque for the O(n) sliding-window problem',
    ],
    body: `### PriorityQueue is a binary heap stored in an array
{{PriorityQueue}} does not sort all the data. It only maintains the **heap property**: every node is smaller than or equal to its two children (a min-heap under the natural ordering or a Comparator). Therefore the smallest element is always at the **root**, while the other elements are only "roughly" in order.

The heap is a **complete** binary tree, so it is stored compactly in the array {{Object[] queue}} without pointers: the node at index {{i}} has its children at {{2i + 1}} and {{2i + 2}}, and its parent at {{(i - 1) / 2}}.

~~~text
array:   [ 1 | 3 | 2 | 7 | 4 | 5 ]        tree:        1
index:    0   1   2   3   4   5                      /   \\
                                                   3     2
children of 1 (i=1): i=3 (7), i=4 (4)             / \\   /
                                                 7   4 5
~~~

- {{offer(e)}}: place {{e}} at the end of the array, then **sift-up**: compare with the parent, swap if smaller, repeat. At most the height of the tree: **O(log n)**.
- {{poll()}}: take the root, move the last element up to the root, then **sift-down**: swap with the smaller child until it lands in its place. **O(log n)**.
- {{peek()}}: read {{queue[0]}}: **O(1)**.
- {{remove(o)}} / {{contains(o)}}: require a linear scan: **O(n)**.
- {{new PriorityQueue<>(collection)}}: builds the heap bottom-up (heapify) in **O(n)**, faster than n separate {{offer}} calls.

The default capacity is 11; when it fills up, the array grows nearly 2x while it is small (below 64) and by 50% once it is large.

### Things PriorityQueue does NOT do
- **The iterator and toString are not in priority order**: printing a PriorityQueue prints the heap array. To take elements in order, {{poll}} them one by one.
- **Not stable**: two equal elements come out in arbitrary order. If you need FIFO among equals, add a sequence number to the Comparator.
- **Does not re-heapify when an element changes**: mutating a field that changes the priority of an element inside the heap breaks the heap property. You must {{remove}} it and {{offer}} it again.
- No {{null}}, not thread-safe. The concurrent variant is {{PriorityBlockingQueue}}, but it is **unbounded**: if producers are faster than consumers, the heap grows until OutOfMemoryError.
- Need a max-heap: {{new PriorityQueue<>(Comparator.reverseOrder())}}.

### Top-K over a data stream: a min-heap of size K
Need the 100 largest transactions among 100 million transactions read incrementally from Kafka or a file? Sorting everything costs O(n log n) and forces you to hold all n elements in RAM. The trick is to keep a **min-heap of only K elements**: the root is the **smallest transaction in the current top**, i.e. the "admission threshold".

~~~java
PriorityQueue<Long> heap = new PriorityQueue<>();   // min-heap: root = smallest in the top-K
for (long amount : stream) {
    if (heap.size() < k) heap.offer(amount);
    else if (amount > heap.peek()) {               // above the threshold: replace the weakest element
        heap.poll();
        heap.offer(amount);
    }                                               // below the threshold: skipped in O(1)
}
~~~

Why a **min**-heap for a problem about finding the **largest** elements? Because you need to evict the weakest element of the top quickly, and it sits right at the root. Time O(n log K), memory O(K). With K = 100, log K ≈ 7, so it is nearly linear.

### ArrayDeque: a circular array for both stack and queue
{{ArrayDeque}} is a circular array with two indices {{head}} and {{tail}}. Adding/removing at either end just moves an index modulo the array length, so it is **O(1)** (amortized, because the array has to grow occasionally). It does not accept {{null}} because null marks an empty slot.

| Structure | As a stack/queue | Drawback |
|---|---|---|
| {{Stack}} | {{push}}/{{pop}} | extends {{Vector}}: every method is {{synchronized}}, and it exposes {{get(i)}}, {{add(i, e)}} which break the stack abstraction |
| {{LinkedList}} | Full Deque | one 24-byte node per element, pointer chasing, poor cache locality |
| {{ArrayDeque}} | Full Deque | fastest for a single thread; no nulls, not thread-safe |
| {{ArrayBlockingQueue}} / {{LinkedBlockingDeque}} | producer-consumer | has locks and blocks when full/empty, for multi-threaded use |

The ArrayDeque Javadoc states it plainly: likely faster than {{Stack}} when used as a stack and faster than {{LinkedList}} when used as a queue. As a stack, call {{push}}/{{pop}}/{{peek}} (operations at the head); as a queue, {{offer}}/{{poll}}. Each operation has two variants: {{addFirst}}/{{removeFirst}} throw an exception on failure, {{offerFirst}}/{{pollFirst}} return false/null.

### Sliding window with a monotonic deque
The problem "maximum value in every window of k consecutive elements" (highest latency among the last k requests, highest price over k minutes): the naive approach is O(n·k). Use a deque holding **indices**, keeping the corresponding values **decreasing** from front to back:

1. Pop from the front of the deque any index that has slid out of the window.
2. Pop from the back of the deque every index whose value is ≤ the new value: they can never be the max again, because the new element is both larger and stays in the window longer.
3. Push the new index at the back; the front of the deque is the max of the window.

Each index enters the deque once and leaves at most once, so the total is **O(n)**.

Production bugs you will actually meet: using {{Stack}} because "the name is clearer" (paying synchronized on the hot path), logging a PriorityQueue and assuming it came out sorted, using an unbounded PriorityBlockingQueue as a job queue, and adding {{null}} to an ArrayDeque, which throws an NPE in a hard-to-guess place.

### Interview relevance
The interviewer often asks: how the heap is stored in an array and the complexity of each operation, why top-K uses a min-heap and how much memory it takes, why {{Stack}} is discouraged, and the sliding window maximum. Senior-style follow-ups: **distributed** top-K (each node computes a local top-K, then you merge the heaps, because the global top-K is guaranteed to lie within the union of the local top-Ks), and when you need a heap that supports updating priorities (Dijkstra), which PriorityQueue does not offer.`,
    exercises: [
      {
        title: 'Top-K largest transactions on a data stream',
        prompt: `Write {{TopKTracker}} that receives transactions one by one from a very long stream and always answers "the K largest transactions so far":

- Constructor {{TopKTracker(k)}}: throws {{IllegalArgumentException}} when {{k <= 0}}.
- {{offer(txn)}}: accepts one transaction. You may keep **at most k** transactions in memory (the test checks it via {{retained()}}).
- {{top()}}: the list of at most k largest transactions, sorted by **amount descending**; on equal amounts the smaller {{id}} comes first (and wins when deciding what to keep). Calling {{top()}} must **not** change the state.
- {{retained()}}: how many transactions are currently kept.

Target O(log k) per {{offer}}.`,
        hints: [
          'Use a {{PriorityQueue<Txn>}} whose root is the **weakest** transaction in the top: compare by amount ascending, and on equal amounts by id **descending**.',
          'Once the heap has k elements: only if the new transaction is better than {{heap.peek()}}, {{poll}} then {{offer}}.',
          '{{top()}}: copy the heap into an ArrayList and sort it; never {{poll}} the real heap, and never trust the iterator order.',
        ],
        explain: `The heap holds exactly k elements, and the root is the "admission threshold". A new transaction weaker than the threshold is dropped in O(1) with a single {{peek}}; a better one replaces the threshold in O(log k). Overall O(n log k) time and O(k) memory, so it works on an unbounded stream.

Defining the ordering **once** ({{BEST_FIRST}}) and then reversing it for the heap keeps the two places (heap and result) from ever disagreeing, including the id tie-breaker.

Common mistakes:
- Using a max-heap that holds every element and polling k times: correct but O(n) memory, and the {{retained()}} test will catch it.
- Returning {{new ArrayList<>(heap)}} without sorting: the PriorityQueue iterator walks the heap array, not the priority order.
- Implementing {{top()}} by polling the whole heap: the second call returns an empty list.
- Forgetting the tie-breaker: with equal amounts, which element gets kept depends on arrival order, so the result is not deterministic.`,
      },
      {
        title: 'Maximum value in a sliding window with ArrayDeque',
        prompt: `A monitoring system needs the **highest latency within every k consecutive requests**. Write {{Windows.maxInWindows(int[] values, int k)}} returning an array of {{values.length - k + 1}} values, where element i is the max of {{values[i]}} .. {{values[i + k - 1]}}.

- {{k <= 0}}: throw {{IllegalArgumentException}}.
- {{values.length < k}} (including an empty array): return an empty array.
- Requirement: **O(n)** using an {{ArrayDeque<Integer>}} of indices (a monotonic deque), not a re-scan of k elements for every window.

Example: {{[1, 3, -1, -3, 5, 3, 6, 7]}}, k = 3 → {{[3, 3, 5, 5, 6, 7]}}.`,
        hints: [
          'The deque stores **indices**, not values, so you know which element has slid out of the window (index ≤ i - k).',
          'Before adding i: pop from the back every index whose value is ≤ {{values[i]}}. That keeps the values in the deque decreasing, and the front of the deque is the max.',
          'Start writing results when {{i >= k - 1}}, into slot {{i - k + 1}}.',
        ],
        explain: `Why can you drop an element at the back of the deque when a larger-or-equal value arrives? Because the new element is both **larger or equal** and **leaves the window later**, so in every future window that contains the old element, the new one is present too and is not smaller. The old element can never be the unique answer again. Each index enters the deque once and leaves at most once, so the total is O(n) despite the while loop nested inside.

Common mistakes:
- Storing values instead of indices: you cannot tell when an element expires, especially with duplicate values.
- Using a {{PriorityQueue}}: that also produces the answer, but evicting the expired element is a {{remove(o)}} costing O(k), for O(n·k) overall; or you need lazy deletion and end up O(n log n).
- Using {{Stack}}/{{LinkedList}}: correct but slower than {{ArrayDeque}}. Note that on a {{Deque<Integer>}}, comparing {{dq.peekFirst() <= i - k}} unboxes and is safe; comparing two {{Integer}}s with {{==}} is buggy outside the -128..127 cache.`,
      },
    ],
    check: [
      {
        q: 'You {{offer}} 5, 1, 4, 2 in order into a {{PriorityQueue<Integer>}} and then {{System.out.println(pq)}}. Which statement is true?',
        options: ['It always prints [1, 2, 4, 5]', 'It prints the order of the internal heap array, e.g. [1, 2, 4, 5] or some order that is not ascending; only the first element is guaranteed to be the smallest', 'It prints insertion order [5, 1, 4, 2]', 'It throws UnsupportedOperationException because PriorityQueue does not support toString'],
        explain: `{{toString}} uses the iterator, and the iterator walks the heap array by index. The heap array only guarantees that {{queue[0]}} is the smallest; the other positions merely satisfy the heap property. In this example the result happens to be [1, 2, 4, 5] by coincidence (with 5, 1, 4, 2, 3 you get [1, 2, 4, 5, 3]). It does not preserve insertion order, and toString works normally. To get ordered output, poll repeatedly.`,
      },
      {
        q: 'Find the 100 largest transactions among 100 million transactions read one by one from a stream. Which approach is optimal and what is the complexity?',
        options: ['A max-heap holding everything, then poll 100 times: O(n) memory', 'Sort everything: O(n log n) time, O(n) memory', 'A min-heap of 100 elements: O(n log K) time, O(K) memory', 'A TreeSet holding everything: O(n log n)'],
        explain: `A min-heap of size K keeps the admission threshold at its root: a smaller element is dropped after one peek; a larger one replaces the root in O(log K). Memory is only K elements, so it runs on a stream. The other three approaches all have to hold all 100 million elements in RAM; sort and TreeSet also cost O(n log n), and a TreeSet whose comparator only looks at amount silently drops transactions with equal amounts.`,
      },
      {
        q: 'Why is {{ArrayDeque}} recommended over {{Stack}} when you need a stack?',
        options: ['Stack has no pop method', 'Stack inherits from Vector: every method is synchronized, an unnecessary cost, and it exposes index-based access methods that break the stack abstraction', 'ArrayDeque is thread-safe while Stack is not', 'ArrayDeque allows null elements while Stack does not'],
        explain: `{{Stack extends Vector}}, so every push/pop acquires a lock, and it allows {{get(i)}}, {{add(i, e)}}, {{remove(i)}} on a "stack". ArrayDeque is an unlocked circular array and faster. The reverse of the wrong options: Stack does have pop; ArrayDeque is **not** thread-safe; and ArrayDeque **forbids** null (Stack allows it).`,
      },
    ],
  },
});
