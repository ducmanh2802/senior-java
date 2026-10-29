/*
 * English translation of js/data/algo.js — task T434. Format: js/core/i18n.js (content overlay).
 * ids: algo-085 algo-086 algo-087 algo-088 algo-089 algo-090 algo-091 algo-092
 */
App.i18n.content({
  'algo-085': {
    prompt: `Given an integer array {{nums}} that may contain duplicates. The array is treated as **circular** (the element after the last wraps back to the first). For each position {{i}}, return {{nextGreater[i]}} — the **first** value you meet walking to the right (in circular order) that is greater than {{nums[i]}}; if there is none, return {{-1}}.

### Example
~~~text
Input: nums = [1,2,1]
Output: [2,-1,2]
Explanation: 1 sees 2 immediately on its right; 2 sees nothing greater; 1 (last in the circle) sees 2 at the front.

Input: nums = [5,4,3,2,1]
Output: [-1,5,5,5,5]

Input: nums = [2,2,2]
Output: [-1,-1,-1]
~~~

### Constraints
- {{0 <= n <= 10^5}}, {{-10^9 <= nums[i] <= 10^9}}
- O(n) required: walking the circle twice ({{2n}}) is still O(n).`,
    hints: [
      'The classic solution uses a monotonic stack (a stack kept in sorted order): scan the array and keep a stack of the elements that have not found their NGE yet.',
      'For a circular array, iterate {{i}} from {{0}} to {{2n-1}}, but only assign the result to position {{i % n}} when that position is still empty.',
      'Inside the loop, while the stack is not empty and {{nums[stack.peek()] < nums[i]}}, pop and assign {{res[popped] = nums[i]}}; then push {{i % n}}.',
      'Only push {{i % n}} (never {{i}}) so each element enters the stack exactly once → O(n) in total.'
    ],
    solution: `### Approach
A monotonic decreasing stack: the indices in the stack always hold decreasing values. When {{nums[i]}} is greater than the stack top, {{nums[i]}} is the NGE of every element that gets popped, because we scan left to right and this is the **first** greater element.

For a circular array we iterate {{2n}} times; each index {{i}} is handled like in a normal array, but we only push {{i % n}} and only fill the result when {{res[i % n]}} has not been filled yet. After {{2n}} steps, every position that has an NGE is filled and the remaining ones stay {{-1}}.

~~~java
class Solution {
    public int[] nextGreaterElements(int[] nums) {
        int n = nums.length;
        int[] res = new int[n];
        Arrays.fill(res, -1);
        Deque<Integer> stack = new ArrayDeque<>(); // indices, monotonic decreasing
        for (int i = 0; i < 2 * n; i++) {
            int x = nums[i % n];
            // x is greater than the top → x is the NGE of every popped element
            while (!stack.isEmpty() && nums[stack.peek()] < x) {
                res[stack.pop()] = x;
            }
            stack.push(i % n); // each index is pushed only once
        }
        return res;
    }
}
~~~

### Interview notes
- Make sure you push only {{i % n}}: pushing {{i}} (up to {{2n-1}}) processes an index twice and gives a wrong answer with duplicate values.
- If the array is not circular, drop {{% n}} and run a single pass of {{n}} iterations; the complexity stays O(n).
- Duplicates: keep the strict {{<}} condition (not {{<=}}) — equal values do not "replace" each other, which matches the "greater than" wording of the problem.

> Senior tip: Monotonic stack is a very common pattern — Next Greater, Daily Temperatures, Largest Rectangle, Stock Span. I always ask candidates "why is the total number of pops at most n?" to check they understand amortized O(n): every element is pushed once and popped at most once.`,
    follow: [
      'How does the code change if the array is not circular?',
      'How does Daily Temperatures relate to this problem?'
    ]
  },
  'algo-086': {
    prompt: `On a number line there are asteroids, each with a size (absolute value) and a direction: positive means moving right, negative means moving left. Two asteroids that **head towards each other** explode: if their sizes are equal both vanish; otherwise the smaller one vanishes. Return the state that remains after all collisions have finished (in order on the line).

### Example
~~~text
Input: asteroids = [5,10,-5]
Output: [5,10]
Explanation: 10 and -5 collide, 10 is bigger so -5 explodes.

Input: asteroids = [8,-8]
Output: []

Input: asteroids = [10,2,-5]
Output: [10]

Input: asteroids = [-2,-1,1,2]
Output: [-2,-1,1,2]
Explanation: -2 and -1 move left, 1 and 2 move right; no pair heads towards each other.
~~~

### Constraints
- {{1 <= n <= 10^4}}, {{-1000 <= asteroids[i] <= 1000}}, {{asteroids[i] != 0}}`,
    hints: [
      'Scan from left to right and push asteroids moving **right** (positive) onto the stack — they cannot have collided yet, because nothing is coming towards them.',
      'When you meet an asteroid {{a < 0}} (moving left), compare it with the stack top. If the positive top is smaller than {{|a|}} the top explodes (pop) and you compare again; if they are equal both explode; if the top is bigger, {{a}} explodes immediately.',
      'A left-moving asteroid survives when the stack is empty (or its top also moves left) — push it.',
      'When you are done, the answer is the elements still in the stack from bottom to top, so you have to reverse them.'
    ],
    solution: `### Approach
The stack keeps the asteroids that are still alive, in left-to-right order; all of them move **to the right** while we process a new asteroid moving left. Two asteroids moving in the same direction never collide, so only left–right collisions matter.

~~~java
class Solution {
    public int[] asteroidCollision(int[] asteroids) {
        Deque<Integer> st = new ArrayDeque<>(); // asteroids still alive, only positive ones
        for (int a : asteroids) {
            boolean alive = true;
            // a moves left: does it hit the top (positive, moving right)?
            while (alive && a < 0 && !st.isEmpty() && st.peek() > 0) {
                int top = st.peek();
                if (top < -a) st.pop();      // top is smaller → top explodes, a keeps going
                else if (top == -a) { st.pop(); alive = false; } // equal → both explode
                else alive = false;          // top is bigger → a explodes
            }
            if (alive) st.push(a);
        }
        int[] res = new int[st.size()];
        for (int i = res.length - 1; i >= 0; i--) res[i] = st.pop(); // reverse the order
        return res;
    }
}
~~~

### Interview notes
- Case [-2,-1,1,2]: only positive elements in the stack can collide with something; the first negative asteroid survives on an empty stack, and the later negative ones hit nothing.
- If the positive top equals |a| then **both** explode — do not push {{a}} back.
- Do not write recursion; the while-pop over the stack is enough, and every element is pushed and popped at most once → O(n).

> Senior tip: This is a textbook simulation + stack problem. In interviews I often add variants such as "what if asteroids could also have value 0" or "return the number of collisions" to test how candidates separate the conditions; splitting each branch explicitly scores higher than short but hard-to-read code.`,
    follow: [
      'How would you change the solution to count the total number of collisions?',
      'Why is it enough for the stack to hold only positive asteroids?'
    ]
  },
  'algo-087': {
    prompt: `You have {{n}} ropes, each with length {{ropes[i]}}. At every step you pick two ropes, join them into one (length equal to the sum of the two) and pay **the length of the rope you just made**. Continue until exactly one rope is left. Find the **minimum** total cost.

### Example
~~~text
Input: ropes = [1,2,3,4,5]
Output: 33
Explanation: (1+2)=3 [cost 3] → [3,3,4,5]; (3+3)=6 [6] → [4,5,6]; (4+5)=9 [9] → [6,9]; (6+9)=15 [15]. Total: 3+6+9+15 = 33.

Input: ropes = [4,3,2,6]
Output: 29

Input: ropes = [5]
Output: 0
~~~

### Constraints
- {{1 <= n <= 10^4}}, {{1 <= ropes[i] <= 10^4}}
- Always join the two **shortest** ropes at every step.`,
    hints: [
      'The cost is the sum of all "intermediate joined ropes"; each original length is added to the cost exactly as many times as it takes part in a join.',
      'The optimal strategy: always take the two shortest ropes — use a min-heap (PriorityQueue) to take them and push the sum back.',
      'Loop until the heap holds 0 or 1 elements; when n = 1 the cost is 0.',
      'Complexity O(n log n): each step pops and pushes in log n, and there are n-1 steps in total.'
    ],
    solution: `### Approach
The greedy choice can be proven: joining the two shortest ropes is always optimal (the same idea as Huffman coding). Keep a min-heap of the current ropes; at each step pop the two smallest, add {{a + b}} to the cost and push {{a + b}} back.

For [1,2,3,4,5]: pop 1,2 → cost 3, push 3 → heap [3,3,4,5]; pop 3,3 → cost 6, push 6 → [4,5,6]; ... Total 33.

~~~java
class Solution {
    public int connectRopes(int[] ropes) {
        PriorityQueue<Integer> pq = new PriorityQueue<>(); // min-heap
        for (int r : ropes) pq.offer(r);
        int cost = 0;
        while (pq.size() > 1) {
            int a = pq.poll();
            int b = pq.poll();
            cost += a + b;   // cost of this step
            pq.offer(a + b); // the joined rope goes back into the heap
        }
        return cost;
    }
}
~~~

### Interview notes
- {{n == 1}}: the while loop never runs and returns 0 — correct (nothing needs joining).
- If the problem uses {{long}} (the total can overflow int), declare {{long cost}} and PriorityQueue{{<Long>}}; with the constraints above int is enough.
- Do not attempt an O(n^2) dynamic programming solution; greedy + heap is the canonical O(n log n) answer.

> Senior tip: This problem belongs to the same family as Huffman coding and "minimum cost to connect strings". Weaker candidates often suggest "sort once and join from the front" — that is only correct in some cases; the min-heap is the general solution, because newly formed ropes can land in the middle of the already sorted sequence.`,
    follow: [
      'Where is the connection to Huffman coding?',
      'If the cost of each step were the product of the two ropes, would the solution still be correct?'
    ]
  },
  'algo-088': {
    prompt: `Design a data structure for a stream of numbers that supports {{addNum}} and returns the **median** of all numbers added so far ({{findMedian}}) in O(log n) per operation.

- If the number of elements is odd: the median is the middle element (in ascending order).
- If it is even: the median is the average of the two middle elements.

### Example
~~~text
addNum(1); addNum(2); findMedian() → 1.5
addNum(3);                 findMedian() → 2.0
~~~

### Constraints
- {{1 <= total number of addNum calls <= 10^5}}
- Numbers can be negative and can repeat.
- findMedian is always called when at least one number exists.`,
    hints: [
      'Keep two halves: the lower half (small numbers) and the upper half (large numbers). The median depends only on the middle elements of the two halves.',
      'Use a max-heap for the lower half and a min-heap for the upper half: PriorityQueue{{<Integer>}} is a min-heap by default; reverse the comparator to get a max-heap.',
      'Keep the invariant: size(maxHeap) == size(minHeap) or larger by exactly 1; every element in maxHeap ≤ every element in minHeap.',
      'addNum: push into maxHeap, then "rebalance" by moving its top into minHeap (and back the other way if the sizes drift); findMedian is O(1).'
    ],
    solution: `### Approach
Two heaps: {{lower}} (max-heap) holds the smaller half, {{upper}} (min-heap) holds the larger half, and their sizes differ by at most 1.

- {{addNum(x)}}: if {{x}} ≤ the top of {{lower}}, push it into {{lower}} and move the top the other way into {{upper}} to keep the halves ordered. A simpler version: push x into lower, move the top of lower into upper, and if the sizes are off move the top of upper back to lower.
- {{findMedian}}: if the sizes differ, the top of {{lower}} is the answer; if they are equal, take the average of the two tops.

~~~java
class MedianFinder {
    private final PriorityQueue<Integer> lower = new PriorityQueue<>(Collections.reverseOrder()); // max-heap
    private final PriorityQueue<Integer> upper = new PriorityQueue<>(); // min-heap

    public void addNum(int num) {
        lower.offer(num);                 // always push into the smaller half first
        upper.offer(lower.poll());        // largest of the lower half → upper half (keeps the invariant)
        if (lower.size() < upper.size())  // keep the sizes balanced
            lower.offer(upper.poll());
    }

    public double findMedian() {
        if (lower.size() > upper.size()) return lower.peek();
        return lower.peek() / 2.0 + upper.peek() / 2.0; // avoid int overflow
    }
}
~~~

### Interview notes
- The key invariant: {{upper.peek() >= lower.peek()}} always holds because of the top-shuffling step; if you skip that step the two halves can interleave incorrectly.
- Return a double: divide by {{2.0}} when computing the average so the fractional part is not lost.
- Interview variants: allow removing elements, find the "kth largest" (just keep the size difference equal to k), or bound memory for a sliding median.

> Senior tip: Two-heap is the default pattern for an online median; in production I have seen it in monitoring (latency percentiles over a sliding window) instead of re-sorting everything on each query. If you need a sliding window, combine the heaps with a HashMap for lazy removal.`,
    follow: [
      'How would you compute the median of a sliding window?',
      'How do you prove that every x in lower is ≤ every y in upper?'
    ]
  },
  'algo-089': {
    prompt: `Given an array {{intervals}} of ranges {{[start, end]}} already sorted by {{start}} and **non-overlapping**, plus one new interval {{newInterval}}. Insert {{newInterval}}, merging ranges where needed, and return the resulting sorted array.

### Example
~~~text
Input: intervals = [[1,3],[6,9]], newInterval = [2,5]
Output: [[1,5],[6,9]]

Input: intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]
Output: [[1,2],[3,10],[12,16]]

Input: intervals = [], newInterval = [5,7]
Output: [[5,7]]
~~~

### Constraints
- {{0 <= n <= 10^4}}, {{n * start/end <= 10^6}} (coordinate values are integers)
- intervals is sorted and pairwise disjoint.`,
    hints: [
      'Split the work: intervals fully **before** {{newInterval}} (end < new.start) stay as they are; intervals fully **after** (start > new.end) stay as they are; everything in between overlaps and gets merged into newInterval.',
      'Pass 1: walk from the front and append every interval with {{end < newInterval[0]}} to the result.',
      'Pass 2: merge every still-overlapping interval: {{newInterval = [min(start), max(end)]}} until nothing overlaps anymore.',
      'Pass 3: append the merged {{newInterval}}, then the remaining intervals — O(n) overall, no re-sorting needed.'
    ],
    solution: `### Approach
Because the array is already sorted, one pass is enough: copy the intervals that lie entirely to the left, merge the ones that overlap the new interval, then copy the rest on the right. You do not need to merge the whole array — only the intervals that "touch" the new one take part in the merge.

~~~java
class Solution {
    public int[][] insert(int[][] intervals, int[] newInterval) {
        List<int[]> res = new ArrayList<>();
        int i = 0, n = intervals.length;
        // 1) intervals entirely before newInterval
        while (i < n && intervals[i][1] < newInterval[0]) {
            res.add(intervals[i++]);
        }
        // 2) merge every overlapping interval
        while (i < n && intervals[i][0] <= newInterval[1]) {
            newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
            newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
            i++;
        }
        res.add(newInterval);
        // 3) intervals entirely after
        while (i < n) res.add(intervals[i++]);
        return res.toArray(new int[0][]);
    }
}
~~~

### Interview notes
- Edge case: {{end == newStart}} (exactly touching, e.g. [1,2] and [3,5] with new [2,3]) — if the spec treats "touching" as overlapping ({{<=}}) then [1,2] and [2,3] merge into [1,3]. Ask the interviewer to make this explicit.
- newInterval is **modified in place** — if you are not allowed to modify the input, clone it first.
- Do not write a generic merge function; merge only what is needed, the code is shorter and the O(n) bound is easier to prove.

> Senior tip: In interviews I always check whether the candidate asks "do touching intervals (2,3) and (3,4) merge?" — in calendar systems two meetings [10:00-11:00] and [11:00-12:00] are usually **not** a conflict, but LeetCode's canonical interval problem does merge them. Clarifying the spec before coding is a genuine senior signal.`,
    follow: [
      'If intervals were not sorted, which solution would be best?',
      'What would you use when coordinate values are huge (10^9) and there are many intervals?'
    ]
  },
  'algo-090': {
    prompt: `Given two lists of intervals {{firstList}} and {{secondList}}, each sorted by {{start}} with **non-overlapping** intervals inside. Return the list of intersections between the two sets (each element is the intersection of one interval from one list with one interval from the other), also sorted and non-overlapping.

### Example
~~~text
Input: firstList = [[0,2],[5,10],[13,23],[24,25]], secondList = [[1,5],[8,12],[15,24],[25,26]]
Output: [[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]

Input: firstList = [[1,3],[5,9]], secondList = []
Output: []

Input: firstList = [], secondList = [[4,8],[10,12]]
Output: []
~~~

### Constraints
- {{0 <= m, n <= 10^4}}
- Each list is sorted and internally disjoint.`,
    hints: [
      'The intersection of two intervals [[a,b]] and [[c,d]] is [[max(a,c), min(b,d)]]; if max(start) > min(end) there is no intersection.',
      'Two pointers {{i}}, {{j}} over the two lists: at each step compare the ends of the current intervals and advance the pointer whose end is smaller (that interval has already "finished" and can no longer intersect any later interval of the other list).',
      'Record the intersection (if any), then do {{i++}} if {{first[i][1] < second[j][1]}}, otherwise {{j++}}.',
      'An intersection always involves exactly two intervals (one from each side), because each list is internally disjoint.'
    ],
    solution: `### Approach
Two pointers. For the current pair {{(a, b)}}, the intersection is {{[max(a0,b0), min(a1,b1)]}} when {{max(a0,b0) <= min(a1,b1)}}. Then advance the pointer of the interval with the **smaller** end, because that interval finishes earlier and cannot intersect any later interval of the other list.

~~~java
class Solution {
    public int[][] intervalIntersection(int[][] first, int[][] second) {
        List<int[]> res = new ArrayList<>();
        int i = 0, j = 0;
        while (i < first.length && j < second.length) {
            int lo = Math.max(first[i][0], second[j][0]);
            int hi = Math.min(first[i][1], second[j][1]);
            if (lo <= hi) res.add(new int[]{lo, hi}); // they intersect (touching counts)
            // advance the pointer of the interval that ends first
            if (first[i][1] < second[j][1]) i++;
            else j++;
        }
        return res.toArray(new int[0][]);
    }
}
~~~

### Interview notes
- The {{lo <= hi}} condition: does "touching" count ([[1,2]] ∩ [[2,3]] = [[2,2]])? The canonical LeetCode statement counts it; ask again if the spec differs.
- No re-sorting is needed; the problem invariant already guarantees both lists are sorted.
- Variant: replace {{max/min}} with a non-overlap check ({{first[i][1] < second[j][0]}}) and then advance the pointer with the smaller end — the same logic, but easy to get wrong when written in a hurry.

> Senior tip: The two-pointers-over-two-sorted-sequences pattern shows up in calendar merged ranges, billing windows and capacity planning. I usually also ask "what if a list had internal overlaps?" — then you must pre-merge each list (O(m log m + n log n)) and then run the two pointers, which shows you understand exactly which invariant the algorithm relies on.`,
    follow: [
      'Why do you only ever advance one of the two pointers?',
      'How would you continue if the answer had to be the **free time** instead?'
    ]
  },
  'algo-091': {
    prompt: `You are given the working schedules of {{k}} employees: {{schedule[e]}} is the list of ranges {{[start, end]}} during which employee {{e}} is **busy**, sorted by start and non-overlapping. Return the list of ranges during which **everyone** is free, sorted and non-overlapping. The result array is **non-empty** per the problem's guarantee (every pair of schedules leaves at least one free gap) — if there is no free range at all, return an empty array.

### Example
~~~text
Input: schedule = [[[1,3],[6,7]], [[2,4]], [[2,5],[9,12]]]
Output: [[5,6],[7,9]]
Explanation: All busy time merged: [1,5],[6,7],[9,12] → free is [5,6] and [7,9].

Input: schedule = [[[1,3],[5,10]], [[2,4]]]
Output: [[4,5]]

Input: schedule = [[[1,2]], [[1,2]]]
Output: []
~~~

### Constraints
- {{1 <= k <= 10^4}}, {{1 <= intervals per employee <= 10^3}}
- Start/end values are integers.`,
    hints: [
      'You do not need to compare employees pairwise — merge **all** busy intervals from every employee into one disjoint list; the free time is then the gaps between consecutive intervals.',
      'Option 1: put all intervals into one array, sort by start and merge — O(N log N) where N is the total number of intervals.',
      'Option 2 (better when k is large): a min-heap ordered by start, merging one interval at a time — still O(N log N) but it avoids sorting the whole thing up front; useful when schedules arrive incrementally (streaming).',
      'Once you have the merged busy intervals, free time is the gap between two consecutive intervals: from the end of the previous one to the start of the next (only when the previous end is smaller than the next start).'
    ],
    solution: `### Approach
**Step 1 — merge busy intervals**: collect every employee's busy intervals, sort them by start and merge them like in the classic Merge Intervals problem. **Step 2 — free time**: a free interval only exists between two adjacent busy intervals — from the {{end}} of the previous one to the {{start}} of the next (if they touch, there is no gap).

For [[[1,3],[6,7]], [[2,4]], [[2,5],[9,12]]]: collect → sort → merge → [[1,5],[6,7],[9,12]]. Gaps: [5,6] and [7,9].

~~~java
class Solution {
    public List<int[]> employeeFreeTime(int[][][] schedule) {
        // 1) collect every busy interval
        List<int[]> all = new ArrayList<>();
        for (int[][] emp : schedule)
            for (int[] iv : emp) all.add(iv);
        all.sort(Comparator.comparingInt(a -> a[0]));

        // 2) merge busy
        List<int[]> merged = new ArrayList<>();
        for (int[] iv : all) {
            if (merged.isEmpty() || merged.get(merged.size() - 1)[1] < iv[0])
                merged.add(iv); // no overlap → add as a new interval
            else
                merged.get(merged.size() - 1)[1] =
                    Math.max(merged.get(merged.size() - 1)[1], iv[1]); // overlap → extend
        }

        // 3) free = the gaps between consecutive busy intervals
        List<int[]> free = new ArrayList<>();
        for (int i = 0; i < merged.size() - 1; i++)
            if (merged.get(i)[1] < merged.get(i + 1)[0])
                free.add(new int[]{merged.get(i)[1], merged.get(i + 1)[0]});
        return free;
    }
}
~~~

### Interview notes
- Streaming variant: replace sort+merge with a min-heap (PriorityQueue ordered by start): poll one interval at a time and merge it into the "current busy" range; record free time between the current busy range and the next interval in the heap — O(N log k), where k is the number of employees currently open.
- Touching edge {{b == nextStart}}: no free interval (empty, zero length).
- If an employee's schedule might be unsorted / not pre-merged you should merge per employee first — merging globally is still correct because the global sort takes care of it.

> Senior tip: Do not optimize prematurely with heaps in an interview unless the interviewer asks; sorting everything in O(N log N) with N total intervals is enough and the code is short with few bugs. But if N ~ 10^7 and the schedules arrive as a stream, per-employee heaps are genuinely required — which shows you know when it matters.`,
    follow: [
      'How would you reduce it to O(N log k) with k employees?',
      'What if an employee may have overlapping intervals inside their own schedule?'
    ]
  },
  'algo-092': {
    prompt: `You are given a **stream** of integers and a number {{k}}. Implement a class {{KthLargest}} with {{KthLargest(int k, int[] nums)}} — {{nums}} holds the elements seen so far (it may be empty) — and a method {{add(int val)}} that adds {{val}} to the stream and returns the element that is the **{{k}}th largest** of the whole stream, counting the {{val}} just added.

### Example
~~~text
Input: k = 3, nums = [4, 5, 8, 2]
add(3) → 4
add(5) → 5
add(10) → 5
add(9) → 8
add(4) → 8
Explanation: stream [2,3,4,5,8,10] → the 3rd largest elements are 4, 5, 5, 8, 8 in order.

Input: k = 1, nums = []
add(7) → 7
add(100) → 100
~~~

### Constraints
- {{1 <= k <= 10^4}}
- {{0 <= nums.length <= 10^4}}, {{-10^4 <= nums[i], val <= 10^4}}
- {{add}} is called at most {{10^4}} times.`,
    hints: [
      'Re-sorting the whole stream after every add is correct but costs O(n log n) per call — in fact you only need to remember the {{k}} largest elements.',
      'Use a **min-heap** holding the {{k}} largest elements: the root is the smallest of that group, which is exactly the "kth largest" answer.',
      'Each {{add}}: push val into the heap and, if the heap grows past size {{k}}, {{poll()}} the root. O(log k) per call, O(k) memory.'
    ],
    solution: `### Approach
Maintain a **min-heap** of exactly size {{k}} holding the {{k}} largest elements seen so far. Because the root is the smallest element of that group, the root is exactly the {{k}}th largest element of the whole stream. When a new number arrives, if it is larger than the root it takes the root's place in the top-k group; if it is smaller it is thrown away by the {{poll}} step — no special handling needed.

~~~java
class KthLargest {
    private final int k;
    private final PriorityQueue<Integer> minHeap = new PriorityQueue<>();

    public KthLargest(int k, int[] nums) {
        this.k = k;
        for (int n : nums) add(n);   // seed the initial elements through the same add
    }

    public int add(int val) {
        minHeap.offer(val);
        if (minHeap.size() > k) minHeap.poll();   // drop the smallest of the k largest
        return minHeap.peek();                    // root = kth largest
    }
}
~~~

### Interview notes
- Distinguish this from "find the kth largest element of an **array**" (sort / quickselect): here the data is a **stream**, so you need a structure that keeps state between calls.
- What if {{nums.length < k}}? The problem guarantees at least {{k}} elements whenever {{add}} is called — but if it did not, you would have to ask the interviewer to pin down the behaviour.
- The symmetric "kth smallest" problem uses exactly the same pattern with a **max-heap**.

> Senior tip: The "heap of exactly k elements" pattern is everywhere in production — top-k sellers, top-k endpoints by latency, top-k consumers by lag. Only when the stream does not fit in memory do you need approximate sketches (Count-Min / Space-Saving); while it fits, a min-heap of size k is enough and always exact.`,
    follow: [
      'What would you do if k changed mid-stream (reconfigure)?',
      'What has to change if several threads call add concurrently?'
    ]
  }
});
