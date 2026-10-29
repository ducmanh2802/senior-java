/*
 * English translation of js/data/algo.js — task T433. Format: js/core/i18n.js (content overlay).
 * ids: algo-028 algo-029 algo-030 algo-031 algo-032 algo-033 algo-034 algo-084
 */
App.i18n.content({
  'algo-028': {
    prompt: `Given a {{grid}} of size {{m x n}} made of the characters {{1}} (land) and {{0}} (water). An island is a group of land cells connected in 4 directions (up, down, left, right). Count the number of islands.

### Example
~~~text
Input:
11110
11010
11000
00000
Output: 1

Input:
11000
11000
00100
00011
Output: 3
~~~

### Constraints
- {{1 <= m, n <= 300}}
- {{grid[i][j]}} is {{0}} or {{1}}.`,
    hints: [
      'Every time you hit a land cell you have not visited yet, that is a new island.',
      'From that cell, spread to every land cell next to it to mark the whole island.',
      'You can change the grid in place from 1 to 0 and use it as visited, or keep a separate visited array.'
    ],
    solution: `### Approach
Walk over every cell. When you hit a {{1}}, increment the counter and call DFS to "sink" the entire island by turning visited cells into {{0}}. This way each cell is processed only once.

~~~java
class Solution {
    public int numIslands(char[][] grid) {
        int count = 0;
        for (int i = 0; i < grid.length; i++) {
            for (int j = 0; j < grid[0].length; j++) {
                if (grid[i][j] == '1') {
                    count++;
                    sink(grid, i, j);
                }
            }
        }
        return count;
    }

    private void sink(char[][] grid, int i, int j) {
        if (i < 0 || i >= grid.length || j < 0 || j >= grid[0].length) return;
        if (grid[i][j] != '1') return;
        grid[i][j] = '0';   // mark visited
        sink(grid, i + 1, j);
        sink(grid, i - 1, j);
        sink(grid, i, j + 1);
        sink(grid, i, j - 1);
    }
}
~~~

### Interview notes
- Recursive DFS can go as deep as {{m*n}} (90,000 for a 300x300 grid), which comes close to the stack limit; BFS or an iterative DFS is safer.
- If you are not allowed to modify the input, use a {{boolean[][] visited}} array.
- Ask back: 4 directions or 8? The standard problem uses 4.
- For extremely large grids, Union-Find is also a good option, especially when the data arrives incrementally.

> Senior tip: This problem is the clearest example of "visited is the input, mutated". In an interview, say explicitly that you are modifying the input and ask whether that is allowed — that detail is what shows your care.`,
    follow: ['If the grid is updated dynamically (water or land added), which structure would you use?', 'How would you change it to count the island with the largest area?']
  },
  'algo-029': {
    prompt: `There are {{numCourses}} courses numbered from 0 to {{numCourses - 1}}. The array {{prerequisites}} holds pairs {{[a, b]}}, meaning that to take course {{a}} you must have finished course {{b}} first. Determine whether it is possible to complete all the courses (that is, the dependency graph has no cycle).

### Example
~~~text
Input:  numCourses = 2, prerequisites = [[1,0]]
Output: true

Input:  numCourses = 2, prerequisites = [[1,0],[0,1]]
Output: false
~~~

### Constraints
- {{1 <= numCourses <= 2000}}
- {{0 <= prerequisites.length <= 5000}}
- Every pair {{[a, b]}} has {{a != b}}.`,
    hints: [
      'Model it as a directed graph: an edge from b to a. You need to check for a cycle.',
      'Topological sort with Kahn: start from the nodes with indegree 0.',
      'If the number of nodes taken is smaller than numCourses after processing, a cycle is left over.'
    ],
    solution: `### Approach
Build an adjacency list and an indegree array. Put every course with indegree 0 into a queue. Repeatedly poll one, decrement the indegree of its neighbours; any node that reaches 0 goes into the queue. Count the processed nodes; if the count equals {{numCourses}}, there is no cycle.

~~~java
class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
        int[] indegree = new int[numCourses];
        for (int[] p : prerequisites) {
            adj.get(p[1]).add(p[0]);   // take p[1] before p[0]
            indegree[p[0]]++;
        }
        Queue<Integer> queue = new ArrayDeque<>();
        for (int i = 0; i < numCourses; i++) {
            if (indegree[i] == 0) queue.add(i);
        }
        int processed = 0;
        while (!queue.isEmpty()) {
            int cur = queue.poll();
            processed++;
            for (int next : adj.get(cur)) {
                if (--indegree[next] == 0) queue.add(next);
            }
        }
        return processed == numCourses;
    }
}
~~~

### Interview notes
- Be careful about the edge direction: if you reverse it, the result can still be right for "is there a cycle" but wrong when you need the study order.
- You can also use DFS with 3 colours (white/gray/black) to detect a cycle; present both options.
- Duplicate edges or self-loops: self-loops are forbidden by the constraints, but duplicate edges can still show up in real data.

> Senior tip: This is the model behind the dependency graph of a build system, Spring modules, or a data pipeline. With a large graph, Kahn lets you process all the zero-indegree nodes in parallel — bring this idea up, because it shows systems thinking.`,
    follow: ['How would you print one valid study order?', 'How do you implement cycle detection with coloured DFS?']
  },
  'algo-030': {
    prompt: `There are {{n}} network nodes numbered 1..n. The array {{times}} holds triples {{[u, v, w]}}, meaning a signal from {{u}} to {{v}} takes {{w}} units of time (directed). A signal starts at node {{k}}. Return the minimum time for every node to receive the signal, or -1 if some node cannot be reached.

### Example
~~~text
Input:  times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2
Output: 2

Input:  times = [[1,2,1]], n = 2, k = 2
Output: -1
~~~

### Constraints
- {{1 <= k <= n <= 100}}
- {{1 <= times.length <= 6000}}
- {{1 <= u, v <= n}}, {{u != v}}, {{0 <= w <= 100}}`,
    hints: [
      'You need the shortest distance from a single source to every node, with non-negative weights.',
      'Dijkstra with a priority queue: always expand the node with the smallest tentative distance.',
      'Once the computation is done, the answer is the largest distance; if any node is still at infinity, return -1.'
    ],
    solution: `### Approach
Use Dijkstra. Initialise {{dist[k] = 0}} and every other node to infinity. The priority queue holds pairs {{(distance, node)}}. On every pop, skip the entry if its distance is stale; otherwise relax the outgoing edges.

Because Java has no decrease-key, we push a new record and ignore the old one when it is popped (lazy deletion).

~~~java
class Solution {
    public int networkDelayTime(int[][] times, int n, int k) {
        List<List<int[]>> adj = new ArrayList<>();
        for (int i = 0; i <= n; i++) adj.add(new ArrayList<>());
        for (int[] t : times) adj.get(t[0]).add(new int[]{t[1], t[2]});
        int[] dist = new int[n + 1];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[k] = 0;
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        pq.add(new int[]{0, k});
        while (!pq.isEmpty()) {
            int[] cur = pq.poll();
            int d = cur[0], u = cur[1];
            if (d > dist[u]) continue;   // stale entry
            for (int[] edge : adj.get(u)) {
                int v = edge[0], w = edge[1];
                if (d + w < dist[v]) {
                    dist[v] = d + w;
                    pq.add(new int[]{dist[v], v});
                }
            }
        }
        int answer = 0;
        for (int i = 1; i <= n; i++) {
            if (dist[i] == Integer.MAX_VALUE) return -1;
            answer = Math.max(answer, dist[i]);
        }
        return answer;
    }
}
~~~

### Interview notes
- Dijkstra is only correct with non-negative weights. If there are negative edges, you must use Bellman-Ford.
- You do not need a visited array when you check {{d > dist[u]}}, but you can add one for clarity.
- Complexity is O(E log V) with a heap; on dense graphs you may consider a Fibonacci heap (rarely used in interviews).

> Senior tip: In microservice systems, Dijkstra/Bellman map to picking the path with the lowest latency, but latency keeps changing. Real systems usually use adaptive algorithms or a load balancer driven by real-time metrics instead of running Dijkstra on every request.`,
    follow: ['If there are negative-weight edges, which algorithm would you use?', 'What about finding the shortest path between every pair of nodes?']
  },
  'algo-031': {
    prompt: `Given an array {{stones}} holding the weights of some stones. On each turn, take the two heaviest stones and smash them together:

- If they are equal, both are destroyed.
- If they differ, the lighter one is destroyed and the heavier one is left with the difference.

Repeat until at most one stone remains. Return the weight of the remaining stone, or 0 if none is left.

### Example
~~~text
Input:  stones = [2,7,4,1,8,1]
Output: 1
Explanation: 8-7=1, 4-2=2, 2-1=1, 1-1=0, 1 is left.

Input:  stones = [1]
Output: 1
~~~

### Constraints
- {{1 <= stones.length <= 30}}
- {{1 <= stones[i] <= 1000}}`,
    hints: [
      'Each step needs the two largest elements — which structure supports that efficiently?',
      'A max-heap (PriorityQueue with a reversed comparator) lets you extract the max in O(log n).',
      'After taking two stones, if the difference is non-zero push it back into the heap; repeat until the heap has 0 or 1 elements.'
    ],
    solution: `### Approach
Use a max-heap holding the stone weights. Each round take the two heaviest out, compute the difference; if it is non-zero, push it back. At the end return the element left over, or 0.

~~~java
class Solution {
    public int lastStoneWeight(int[] stones) {
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
        for (int s : stones) maxHeap.add(s);
        while (maxHeap.size() > 1) {
            int a = maxHeap.poll();   // heaviest
            int b = maxHeap.poll();   // second heaviest
            if (a != b) maxHeap.add(a - b);
        }
        return maxHeap.isEmpty() ? 0 : maxHeap.poll();
    }
}
~~~

### Interview notes
- If the two stones are equal, push nothing into the heap — many candidates forget this and push 0.
- You could use an array and sort it again every round, but that is O(n² log n) or O(n²) depending on the approach; the heap is the natural choice.
- Ask back: do you need to keep a history of the smashes? If so, you need an extra structure.

> Senior tip: This problem is small, yet it shows exactly the thinking behind choosing a data structure. In an interview, state the costs clearly: heap O(n log n) time, O(n) space; compared with sorting every round, the heap wins when the number of elements is large.`,
    follow: ['What if each smash also costs an amount proportional to the weight?', 'How would you return the whole sequence of smashes?']
  },
  'algo-032': {
    prompt: `Given an integer array {{nums}} and a number {{k}}, return the {{k}}th largest element in the array (in descending sorted order, not the kth distinct element). You do not need to sort the whole array.

### Example
~~~text
Input:  nums = [3,2,1,5,6,4], k = 2
Output: 5

Input:  nums = [3,2,3,1,2,4,5,5,6], k = 4
Output: 4
~~~

### Constraints
- {{1 <= k <= nums.length <= 10^5}}
- {{-10^4 <= nums[i] <= 10^4}}`,
    hints: [
      'Sorting everything is O(n log n) and does work you do not need. You only have to know the k largest elements.',
      'Keep a min-heap of size {{k}}: the smallest element in the heap is the boundary of the top-k.',
      'Walk over each element and push it into the heap; if the heap grows past {{k}}, pop the smallest element. At the end the top of the heap is the answer.'
    ],
    solution: `### Approach
Use a min-heap of size {{k}}. For each element, add it to the heap; if the heap holds more than {{k}} elements, remove the smallest one. After the full scan, the top of the heap is the {{k}}th largest element.

This approach suits streams especially well, because it does not need to store the whole array.

~~~java
class Solution {
    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        for (int x : nums) {
            minHeap.add(x);
            if (minHeap.size() > k) {
                minHeap.poll();   // remove smallest
            }
        }
        return minHeap.peek();
    }
}
~~~

### Interview notes
- Do not confuse the min-heap with the max-heap: to keep the top-k largest, the heap must be a min-heap so the weakest element is the easy one to evict.
- Quickselect is average O(n), worst O(n²); mention the trade-off if you are asked for a better optimisation.
- If {{k}} is close to n, sorting can be simpler with a smaller constant; ask about the real constraints.

> Senior tip: For top-K in monitoring systems, a min-heap of size k is the default choice because memory is O(k). If k is very large or distributed, consider a Count-Min Sketch together with an approximate heap.`,
    follow: ['Implement quickselect and analyse the worst case.', 'How would you design this for an infinite stream?']
  },
  'algo-033': {
    prompt: `Given an array of intervals {{intervals}} where {{intervals[i] = [start, end]}}, merge every interval that overlaps or touches another one and return the list of non-overlapping intervals.

### Example
~~~text
Input:  intervals = [[1,3],[2,6],[8,10],[15,18]]
Output: [[1,6],[8,10],[15,18]]

Input:  intervals = [[1,4],[4,5]]
Output: [[1,5]]
~~~

### Constraints
- {{1 <= intervals.length <= 10^4}}
- {{0 <= start <= end <= 10^4}}`,
    hints: [
      'If the intervals are sorted by start point, overlapping intervals end up next to each other.',
      'Sort by start; iterate and compare the current start with the end of the last interval in the result.',
      'If they overlap, extend the end of the last interval to the max of both ends; if not, append a new interval.'
    ],
    solution: `### Approach
Sort the intervals by start point. Walk through them: if the result list is empty, or the current interval starts after the end of the last interval, append it. Otherwise, update the end of the last interval to the max of both ends.

After sorting, each interval is processed only once, so the total is O(n log n).

~~~java
class Solution {
    public int[][] merge(int[][] intervals) {
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> merged = new ArrayList<>();
        for (int[] cur : intervals) {
            if (merged.isEmpty() || merged.get(merged.size() - 1)[1] < cur[0]) {
                merged.add(cur);
            } else {
                int[] last = merged.get(merged.size() - 1);
                last[1] = Math.max(last[1], cur[1]);
            }
        }
        return merged.toArray(new int[0][]);
    }
}
~~~

### Interview notes
- The touching condition {{last[1] < cur[0]}} treats {{[1,4]}} and {{[4,5]}} as overlapping; if the problem does not consider touching as overlap, change it to {{<=}}.
- A comparator using {{a[0] - b[0]}} can overflow for large values; use {{Integer.compare}}.
- The sort mutates the input array — ask whether that is allowed.

> Senior tip: Merge intervals is the foundation of calendar problems, time-based resource allocation, and IP range compression. With streaming data you cannot sort everything; in that case use an interval tree or a balanced structure keyed by start.`,
    follow: ['How would you insert one interval into an already merged list?', 'How would you handle data that arrives as a stream?']
  },
  'algo-034': {
    prompt: `Given an array {{intervals}} where {{intervals[i] = [start, end]}} are the start and end times of meetings, compute the minimum number of meeting rooms needed to host all of them, knowing that a room can be used by only one meeting at a time.

### Example
~~~text
Input:  intervals = [[0,30],[5,10],[15,20]]
Output: 2

Input:  intervals = [[7,10],[2,4]]
Output: 1
~~~

### Constraints
- {{1 <= intervals.length <= 10^4}}
- {{0 <= start < end <= 10^6}}`,
    hints: [
      'The number of rooms needed equals the number of meetings running at the same time at the peak moment.',
      'You can split starts and ends, sort them separately, then sweep with two pointers.',
      'Or use a min-heap of end times: if the room that frees up earliest is already done, reuse it; otherwise open a new room.'
    ],
    solution: `### Approach
Split all the starts and all the ends and sort them separately. Use two pointers: if the next meeting starts before the meeting that ends earliest is over, you need one more room; otherwise you free a room.

This is O(n log n) time and O(n) space, easy to explain and hard to get wrong.

~~~java
class Solution {
    public int minMeetingRooms(int[][] intervals) {
        int n = intervals.length;
        int[] starts = new int[n];
        int[] ends = new int[n];
        for (int i = 0; i < n; i++) {
            starts[i] = intervals[i][0];
            ends[i] = intervals[i][1];
        }
        Arrays.sort(starts);
        Arrays.sort(ends);
        int rooms = 0, best = 0, e = 0;
        for (int s : starts) {
            if (s < ends[e]) {
                rooms++;            // no free room
            } else {
                e++;                // reuse a finished room
            }
            best = Math.max(best, rooms);
        }
        return best;
    }
}
~~~

### Interview notes
- If one meeting ends exactly when another starts, that is usually treated as reusable (use {{<}}). Ask about the convention.
- Heap approach: sort by start, push the ends into a min-heap; if the smallest end <= the current start, poll it and then push the new end; the heap size is the answer.
- Do not confuse this with Merge Intervals: here you only count rooms, and you never merge intervals.

> Senior tip: This problem models capacity planning: the number of workers, the size of a connection pool, or the slots in a scheduler. In practice you also have to account for buffers and handover time; say that the theoretical model is only a lower bound.`,
    follow: ['Implement it with a min-heap and compare it with the two-array approach.', 'How would you assign each meeting to a specific room?']
  },
  'algo-084': {
    prompt: `Given an array of strings {{tokens}} representing an expression in RPN (Reverse Polish Notation). Each element is an operator (+, -, *, /) or an integer. Return the value of the expression.

### Example
~~~text
Input: tokens = ["2","1","+","3","*"]
Output: 9
Explanation: ((2 + 1) * 3) = 9

Input: tokens = ["4","13","5","/","+"]
Output: 6
~~~

### Constraints
- {{1 <= tokens.length <= 10^4}}
- Each operator applies to the two operands before it; division takes the integer part and always truncates toward zero.
- There is no division by zero.`,
    hints: [
      'Use a stack: push a number when you see one; on an operator, take the two elements on top.',
      'Mind the order: the operator pops the second element first, then the first element, computes, and pushes the result.',
      'Integer division: use Math.trunc or cast to int after dividing as a double; it always truncates toward zero.'
    ],
    solution: `### Approach
Walk the tokens from left to right. If it is a number, push it onto the stack. If it is an operator, pop two operands, compute them in the right order, and push the result back. At the end the stack holds exactly one element — that is the answer.

~~~java
class Solution {
    public int evalRPN(String[] tokens) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (String t : tokens) {
            if (t.equals("+")) {
                int b = stack.pop(), a = stack.pop();
                stack.push(a + b);
            } else if (t.equals("-")) {
                int b = stack.pop(), a = stack.pop();
                stack.push(a - b);
            } else if (t.equals("*")) {
                int b = stack.pop(), a = stack.pop();
                stack.push(a * b);
            } else if (t.equals("/")) {
                int b = stack.pop(), a = stack.pop();
                stack.push(a / b);
            } else {
                stack.push(Integer.parseInt(t));
            }
        }
        return stack.pop();
    }
}
~~~

### Interview notes
- Division with negative numbers in Java: -3 / 2 = -1 (truncation toward zero), which is exactly what the standard problem asks for.
- With many operators of the same kind, prefer a switch or a map; avoid a tangled chain of if-else.
- The problem guarantees the expression is valid, so you do not need to check that the stack is non-empty before popping.

> Senior tip: RPN is common in compilers or in configuration expressions; when a minus sign appears in front of an operand, you have to tell a negative number from the subtraction operator by checking the token length or by using a prefix.`,
    follow: ['How would you handle division by zero?', 'How would you detect an invalid expression?']
  }
});
