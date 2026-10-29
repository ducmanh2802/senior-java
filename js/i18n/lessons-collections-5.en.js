/* 
 * English translation of js/data/lessons-collections.js - task T451. Format: js/core/i18n.js (content overlay).
 * ids: lesson-collections-005
 */
App.i18n.content({
  'lesson-collections-005': {
    title: 'PriorityQueue (heap) and ArrayDeque: top-K over data streams and sliding windows',
    goals: [
      'Describe the binary heap stored inside an array, and why {{offer}}/{{poll}} are O(log n) while {{peek}} is O(1)',
      'Solve top-K over a huge data stream with a size-K min-heap in O(n log K) time and O(K) memory',
      'Choose {{ArrayDeque}} instead of {{Stack}}/{{LinkedList}}, and use a monotonic deque for the O(n) sliding-window problem',
    ],
    body: `### PriorityQueue is a binary heap stored in an array
{{PriorityQueue}} does not sort all of its data. It only maintains the **heap property**: every node is less than or equal to both of its children (a min-heap under natural ordering or a Comparator). So the smallest element is always at the **root**, while the other elements are only "roughly" ordered.

A heap tree is a **complete** binary tree, so it is stored compactly in the {{Object[] queue}} array with no pointers: the node at index {{i}} has its children at {{2i + 1}} and {{2i + 2}}, and its parent at {{(i - 1) / 2}}.

~~~text
array: [ 1 | 3 | 2 | 7 | 4 | 5 ]      tree:       1
index:   0   1   2   3   4   5                /   \\
                                             3     2
children of 1 (i=1): i=3 (7), i=4 (4)       / \\   /
                                           7   4 5
~~~

- {{offer(e)}}: append {{e}} at the end of the array, then **sift-up**: compare it with its parent and swap when it is smaller, repeating. At most the height of the tree: **O(log n)**.
- {{poll()}}: take the root, move the last element to the root, then **sift-down**: swap it with the smaller child until it is in the right place. **O(log n)**.
- {{peek()}}: read {{queue[0]}}: **O(1)**.
- {{remove(o)}} / {{contains(o)}}: must scan linearly: **O(n)**.
- {{new PriorityQueue<>(collection)}}: builds the heap bottom-up (heapify) in **O(n)**, n times faster than n separate {{offer}} calls.

The default capacity is 11; when full, the array grows to nearly double while it is small (under 64) and by 50% once it is large.

### Things PriorityQueue does NOT do
- **Iterator and toString are not in priority order**: printing a PriorityQueue prints the heap array. To get priority order, {{poll}} repeatedly.
- **Not stable**: two equal elements come out in arbitrary order. If you need FIFO for ties, add a sequence number to the Comparator.
- **It does not re-sort when an element changes**: changing a field that affects the priority of an element already in the heap breaks the heap property. You must {{remove}} it and {{offer}} it again.
- It does not allow {{null}} and is not thread-safe. The concurrent version is {{PriorityBlockingQueue}}, but it is **unbounded**: if a producer outruns the consumer, the heap grows until OutOfMemoryError.
- For a max-heap: {{new PriorityQueue<>(Comparator.reverseOrder())}}.

### Top-K over a data stream: a min-heap of size K
Need the 100 largest transactions out of 100 million read incrementally from Kafka or a file? Sorting everything costs O(n log n) and requires keeping all n elements in RAM. The trick is to keep a **min-heap of only K elements**: its root is the **smallest transaction in the current top**, i.e. the "entry threshold for the top".

~~~java
PriorityQueue<Long> heap = new PriorityQueue<>();   // min-heap: root = smallest in the top-K
for (long amount : stream) {
    if (heap.size() < k) heap.offer(amount);
    else if (amount > heap.peek()) {               // greater than the threshold: replace the smallest element
        heap.poll();
        heap.offer(amount);
    }                                               // below the threshold: skip in O(1)
}
~~~

Why use a **min**-heap to find the **largest** elements? Because we need to quickly discard the weakest element in the top, and it sits right at the root. Time O(n log K), memory O(K). With K = 100, log K is about 7, so it is almost linear.

### ArrayDeque: a circular array for both a stack and a queue
{{ArrayDeque}} is a circular array with two indices, {{head}} and {{tail}}. Adding or removing at either end is just moving an index modulo the array length, so it is **O(1)** (amortized, because the array occasionally has to grow). It does not allow {{null}} because it uses null to mark empty slots.

| Structure | Works as stack/queue | Problem |
|---|---|---|
| {{Stack}} | {{push}}/{{pop}} | extends {{Vector}}: every method is {{synchronized}}, and it exposes {{get(i)}}, {{add(i, e)}}, breaking the stack abstraction |
| {{LinkedList}} | full Deque | a 24-byte node per element, pointer chasing, poor cache locality |
| {{ArrayDeque}} | full Deque | fastest for single-threaded use; no null, not thread-safe |
| {{ArrayBlockingQueue}} / {{LinkedBlockingDeque}} | producer-consumer | locking and blocking when full/empty, for multi-threaded use |

The ArrayDeque Javadoc says explicitly: it is likely faster than {{Stack}} when used as a stack and faster than {{LinkedList}} when used as a queue. As a stack, call {{push}}/{{pop}}/{{peek}} (operations at the front); as a queue, call {{offer}}/{{poll}}. Every operation has two variants: {{addFirst}}/{{removeFirst}} throw an exception on failure, while {{offerFirst}}/{{pollFirst}} return false/null.

### Sliding window with a monotonic deque
The "maximum value in every window of k consecutive elements" problem (highest latency across the last k requests, highest price over the last k minutes): the naive approach is O(n·k). Use a deque of **indices**, keeping the corresponding values **decreasing** from front to back:

1. Remove from the front of the deque any index that has slid out of the window.
2. Remove from the back of the deque every index whose value is ≤ the new value: it can never be the max again, because the new element is both larger and leaves the window later.
3. Append the new index at the back; the front of the deque is the max of the window.

Each index enters the deque once and leaves at most once, so the total is **O(n)**.

> Common production mistakes: using {{Stack}} because "the name is easy to understand" (paying for synchronized on a hot path), printing a PriorityQueue to the log and assuming it is sorted, using an unbounded PriorityBlockingQueue as a job queue, and adding {{null}} to an ArrayDeque, which causes an NPE in a hard-to-guess place.

### Interview relevance
Interviewers often ask: how the heap is stored in an array and the complexity of each operation, why top-K uses a min-heap and how much memory it costs, why {{Stack}} is discouraged, and the sliding window maximum problem. Senior-level follow-ups: **distributed** top-K (each node computes its local top-K, then the heaps are merged, because the global top-K is guaranteed to lie in the union of the local top-Ks), and when you need a heap that supports updating an element's priority (Dijkstra), which PriorityQueue does not.
`,
    exercises: [
      {
        title: 'Top-K largest transactions over a data stream',
        prompt: `Write {{TopKTracker}} that receives transactions one by one from a very long stream and can always answer "the K largest transactions so far":

- Constructor {{TopKTracker(k)}}: {{k <= 0}} throws {{IllegalArgumentException}}.
- {{offer(txn)}}: accept one transaction. It must keep **at most k** transactions in memory (the tests check this via {{retained()}}).
- {{top()}}: the list of the at most k largest transactions, sorted **descending by amount**; for equal amounts the smaller {{id}} comes first (and is preferred for retention). Calling {{top()}} **must not** change the state.
- {{retained()}}: the number of transactions currently retained.

Target O(log k) per {{offer}}.`,
        hints: [
          'Use a {{PriorityQueue<Txn>}} whose root is the **worst** transaction in the top: compare by ascending amount, and for equal amounts by **descending** id.',
          'Once the heap has k elements: only when the new transaction is better than {{heap.peek()}} do you {{poll}} and then {{offer}}.',
          '{{top()}}: copy the heap into an ArrayList and sort it; do not {{poll}} the real heap, and do not trust the iterator order.',
        ],
        explain: `The heap holds exactly k elements, with the "entry threshold for the top" at the root. A new transaction worse than the threshold is rejected in O(1) with a single {{peek}}; a better one replaces the threshold in O(log k). Total O(n log k) time and O(k) memory, so it runs on an infinite stream.

Defining the order **once** ({{BEST_FIRST}}) and then reversing it for the heap keeps the two places (heap and result) from ever disagreeing, including the id tie-break rule.

Common mistakes:
- Using a max-heap that holds every element and polling k times: correct but O(n) memory, and the {{retained()}} test will catch it.
- Returning {{new ArrayList<>(heap)}} without sorting: the PriorityQueue iterator walks the heap array, not priority order.
- Implementing {{top()}} by polling the whole heap: the second call returns an empty list.
- Forgetting the tie-break: with equal amounts, which element is retained depends on arrival order and the result becomes nondeterministic.`,
      },
      {
        title: 'Maximum value in each sliding window using ArrayDeque',
        prompt: `A monitoring system needs the **highest latency across every k consecutive requests**. Write {{Windows.maxInWindows(int[] values, int k)}} returning an array of {{values.length - k + 1}} values where element i is the max of {{values[i]}} .. {{values[i + k - 1]}}.

- {{k <= 0}}: throw {{IllegalArgumentException}}.
- {{values.length < k}} (including an empty array): return an empty array.
- Require **O(n)** using an {{ArrayDeque<Integer>}} of indices (a monotonic deque); do not re-scan k elements per window.

Example: {{[1, 3, -1, -3, 5, 3, 6, 7]}}, k = 3 → {{[3, 3, 5, 5, 6, 7]}}.`,
        hints: [
          'The deque stores **indices**, not values, so you know which element has slid out of the window (index ≤ i - k).',
          'Before adding i: remove from the back every index whose value is ≤ {{values[i]}}. That way the values in the deque are always decreasing and the front of the deque is the max.',
          'Start writing results when {{i >= k - 1}}, into slot {{i - k + 1}}.',
        ],
        explain: `Why can the elements at the back of the deque be discarded when a value greater than or equal to them arrives? Because the new element is both **larger or equal** and **leaves the window later**, so in every future window that contains the old element the new one is also present and is no smaller. The old element can never be the sole answer again. Each index enters the deque once and leaves at most once, so the total is O(n) despite the nested while loop.

Common mistakes:
- Storing values instead of indices: you cannot tell when an element expires, especially with duplicate values.
- Using a {{PriorityQueue}}: it also produces the result, but removing an expired element is {{remove(o)}} at O(k), O(n·k) overall; or you need lazy deletion and O(n log n).
- Using {{Stack}}/{{LinkedList}}: correct but slower than {{ArrayDeque}}. Note that on a {{Deque<Integer>}}, the comparison {{dq.peekFirst() <= i - k}} unboxes because the right-hand side is an int, so it is safe; but comparing two {{Integer}}s with {{==}} is wrong outside the -128..127 cache range.`,
      },
    ],
    check: [
      {
        q: 'You {{offer}} 5, 1, 4, 2 in that order into a {{PriorityQueue<Integer>}} and then call {{System.out.println(pq)}}. Which statement is correct?',
        options: ['Always prints [1, 2, 4, 5]', 'It prints in the internal heap-array order, e.g. [1, 2, 4, 5] or not in ascending order; only the first element is guaranteed to be the smallest', 'It prints in insertion order [5, 1, 4, 2]', 'It throws UnsupportedOperationException because PriorityQueue does not support toString'],
        explain: `{{toString}} uses the iterator, and the iterator walks the heap array by index. The heap array only guarantees that {{queue[0]}} is the smallest; the other positions merely satisfy the heap property. In this example the output happens to be [1, 2, 4, 5] (with 5, 1, 4, 2, 3 you get [1, 2, 4, 5, 3]). It does not preserve insertion order, and toString works normally. To get ordered output, poll repeatedly.`,
      },
      {
        q: 'Find the 100 largest transactions out of 100 million transactions read incrementally from a stream. Which approach is optimal, and what is its complexity?',
        options: ['Max-heap holding everything, then poll 100 times: O(n) memory', 'Sort everything: O(n log n) time, O(n) memory', 'Min-heap holding 100 elements: O(n log K) time, O(K) memory', 'TreeSet holding everything: O(n log n)'],
        explain: `A size-K min-heap has the entry threshold for the top at its root: a smaller element is rejected after one peek, a larger one replaces the root in O(log K). Memory holds only K elements, so it works on a stream. The other three options all keep 100 million elements in RAM; sorting and TreeSet also cost O(n log n), and a TreeSet with a comparator that only looks at the amount would even lose transactions that share the same amount.`,
      },
      {
        q: 'Why is {{ArrayDeque}} recommended over {{Stack}} for implementing a stack?',
        options: ['Stack has no pop method', 'Stack extends Vector: every method is synchronized, which is unnecessary overhead, and it exposes index-based access methods that break the stack abstraction', 'ArrayDeque is thread-safe while Stack is not', 'ArrayDeque allows null elements while Stack does not'],
        explain: `{{Stack extends Vector}}, so every push/pop takes a lock, and it exposes {{get(i)}}, {{add(i, e)}}, {{remove(i)}} on the "stack". ArrayDeque is a lock-free circular array and is faster. The wrong options: Stack does have pop; ArrayDeque is **not** thread-safe; and ArrayDeque **forbids** null (Stack allows it).`,
      },
    ],
  },
});
