App.i18n.content({
  'algo-028': {
    prompt: `Given a {{grid}} of size {{m x n}} consisting of characters {{1}} (land) and {{0}} (water). An island is a group of connected land cells (4 directions: up, down, left, right). Count the number of islands.`,
    hints: [
      'Each time you encounter an unvisited land cell, it is a new island.',
      'From that cell, spread to all connected land cells to mark the entire island.',
      'You can directly modify the grid from 1 to 0 to act as visited, or use a separate visited array.'
    ],
    solution: `### Concept
Iterate through each cell. When you encounter a {{1}}, increment the counter and call DFS to "sink" the entire island by changing visited cells to {{0}}. This ensures each cell is processed only once.

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
- Recursive DFS can be up to {{m*n}} deep (90,000 for 300x300), close to the stack limit; BFS or iterative DFS are safer.
- If you are not allowed to modify the input, use a {{boolean[][] visited}} array.
- Ask: 4-way or 8-way connectivity? The standard problem uses 4-way.
- For extremely large grids, Union-Find is also a good choice, especially when data arrives incrementally.

> Senior tip: This problem is the clearest example of "visited state as modified input". In an interview, clearly state that you are modifying the input and ask if it's allowed — it's a detail that shows carefulness.`,
    follow: ['If the grid is updated dynamically (adding water/land), what structure should be used?', 'How to modify it to count the largest island area?']
  },
  'algo-029': {
    prompt: `There are {{numCourses}} courses labeled from 0 to {{numCourses - 1}}. Array {{prerequisites}} contains pairs {{[a, b]}} meaning you must take course {{b}} before course {{a}}. Check if it is possible to complete all courses (i.e., the dependency graph has no cycles).`,
    hints: [
      'Model as a directed graph: edge from b to a. Need to check for cycles.',
      'Topological sort with Kahn: start from nodes with indegree 0.',
      'If after processing, the number of nodes processed is less than numCourses, there is a cycle.'
    ],
    solution: `### Concept
Build an adjacency list and an indegree array. Put all courses with indegree 0 into a queue. Successively poll, decrease the indegree of adjacent nodes; add nodes that reach 0 to the queue. Count processed nodes; if equal to {{numCourses}}, no cycle exists.

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
- Be careful with edge direction: if reversed, the result might still be correct for "has cycle", but wrong for "order to study".
- Can use DFS with 3 colors (white/gray/black) to detect cycles; mention both approaches.
- Duplicate edges or self-loops: self-loops are forbidden by constraints, but duplicate edges can happen in real data.

> Senior tip: This is the model of dependency graphs in build systems, Spring modules, or data pipelines. When the graph is large, Kahn allows parallel processing of indegree 0 nodes — mention this idea as it shows systems thinking.`,
    follow: ['If you need to output a valid study order, how to do it?', 'How to implement cycle detection using colored DFS?']
  },
  'algo-030': {
    prompt: `There are {{n}} network nodes labeled 1..n. Array {{times}} contains triples {{[u, v, w]}} meaning the signal from {{u}} to {{v}} takes {{w}} time (directed). Starting signal from node {{k}}. Return the minimum time for all nodes to receive the signal, or -1 if any node is unreachable.`,
    hints: [
      'Need the shortest path from a single source to all nodes, non-negative weights.',
      'Dijkstra with priority queue: always expand the node with the smallest tentative distance.',
      'After calculating, the answer is the maximum distance; if any node is infinity, return -1.'
    ],
    solution: `### Concept
Use Dijkstra. Initialize {{dist[k] = 0}}, others to infinity. Priority queue contains {{(distance, node)}} pairs. When popping, if distance is stale, skip; otherwise, relax outgoing edges.

Since Java has no decrease-key, we push new records and ignore old ones when popping (lazy deletion).

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
- Dijkstra is only correct with non-negative weights. If there are negative edges, use Bellman-Ford.
- No visited array needed if using {{d > dist[u]}} check; but can be added for clarity.
- Time complexity O(E log V) with heap; for dense graphs, consider Fibonacci heap (rare in interviews).

> Senior tip: In microservices systems, Dijkstra/Bellman correspond to the problem of choosing routes with lowest latency, but latency changes continuously. Real systems often use adaptive algorithms or load balancers based on realtime data instead of running Dijkstra on every request.`,
    follow: ['If there are negative edge weights, which algorithm should be used?', 'How to find shortest paths between all pairs of nodes?']
  },
  'algo-031': {
    prompt: `Array {{stones}} represents the mass of stones. Each turn, take the two heaviest stones and smash them together:

- If equal, both shatter.
- If different, the lighter one shatters, the heavier one remains with the weight difference.

Repeat until at most one stone remains. Return the mass of the remaining stone, or 0 if none remain.`,
    hints: [
      'Each step requires taking the two largest elements — which structure supports this efficiently?',
      'Max-heap (PriorityQueue with inverted comparator) allows taking max in O(log n).',
      'After taking two stones, if the difference is non-zero, push it back to the heap; repeat until heap has 0 or 1 element.'
    ],
    solution: `### Concept
Use a max-heap containing the masses of the stones. Each turn, poll the two heaviest, calculate the difference; if non-zero, push back. Finally, return the remaining element or 0.

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
- If two stones are equal, push nothing back — many candidates forget and push 0.
- Can use an array and sort every turn, but O(n² log n) or O(n²) depending on the method; heap is the natural choice.
- Ask: is the history of smashes needed? If so, additional structure is required.

> Senior tip: This is a small problem but demonstrates correct data structure choice. In an interview, explicitly state costs: heap is O(n log n) time, O(n) space; compared to sorting each turn, heap wins when n is large.`,
    follow: ['If each smash costs an additional amount proportional to mass, what to do?', 'How to return the entire sequence of smashes?']
  },
  'algo-032': {
    prompt: `Array {{nums}} and number {{k}}, return the {{k}}-th largest element in the array (based on descending order, not the k-th distinct element). Do not need to sort the entire array.`,
    hints: [
      'Sorting entirely is O(n log n) and does unnecessary work. Only need to know the top-k largest elements.',
      'Keep a min-heap of size {{k}}: the smallest element in the heap is the boundary of the top-k.',
      'Iterate through each element, add to heap; if heap exceeds {{k}}, pop the smallest. Finally, heap top is the answer.'
    ],
    solution: `### Concept
Use a min-heap of size {{k}}. For each element, add to the heap; if the heap has more than {{k}} elements, remove the smallest. After iterating, the heap top is the {{k}}-th largest element.

This is particularly suitable for streaming as it doesn't need to store the entire array.

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
- Don't confuse min-heap with max-heap: to keep the largest top-k, the heap must be a min-heap to easily remove the weakest element.
- Quickselect has average O(n), worst O(n²); mention this trade-off if asked for further optimization.
- If {{k}} is close to {{n}}, sorting might be simpler with smaller constant factors; ask about actual constraints.

> Senior tip: For top-K in monitoring systems, a min-heap of size k is the default choice because of O(k) memory. If k is extremely large or distributed, consider Count-Min Sketch with approximate heap.`,
    follow: ['Implement Quickselect and analyze worst case.', 'If data is an infinite stream, how to design?']
  },
  'algo-033': {
    prompt: `Array of intervals {{intervals}} where {{intervals[i] = [start, end]}}. Merge all overlapping or touching intervals, return a list of non-overlapping intervals.`,
    hints: [
      'If intervals are sorted by start point, overlapping intervals will be adjacent.',
      'Sort by start; iterate and compare the current start with the end of the last interval in result.',
      'If overlapping, extend the end of the last interval to max of both ends; if not, add a new interval.'
    ],
    solution: `### Concept
Sort intervals by start point. Iterate through each: if the result list is empty or the current interval starts after the last interval ends, add as new. Otherwise, update the end of the last interval with the max of both ends.

After sorting, each interval is processed once, resulting in O(n log n) total.

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
- Touching condition {{last[1] < cur[0]}} treats {{[1,4]}} and {{[4,5]}} as overlapping; if touching is not overlapping, change to {{<=}}.
- Comparator using {{a[0] - b[0]}} can overflow if values are large; use {{Integer.compare}}.
- Sorting method directly modifies the input array — ask if this is permitted.

> Senior tip: Merge intervals is the foundation of calendar problems, resource allocation over time, and IP range compression. With streaming data, you cannot sort entirely; in that case, use interval trees or balanced structures based on start points.`,
    follow: ['If inserting an interval into an already merged list, how to do it?', 'If data arrives streaming, how to process?']
  },
  'algo-034': {
    prompt: `Array {{intervals}} where {{intervals[i] = [start, end]}} is the start and end time of meetings. Calculate the minimum number of meeting rooms required to host all, knowing a room can only be used for one meeting at a time.`,
    hints: [
      'The number of rooms required equals the number of meetings occurring simultaneously at peak time.',
      'Can separate start and end, sort them individually, then sweep with two pointers.',
      'Or use a min-heap to store end times: if the earliest room is free, reuse it; otherwise, open a new room.'
    ],
    solution: `### Concept
Separate all starts and ends, sort individually. Use two pointers: if the next meeting starts before the meeting ending earliest is finished, a new room is needed; otherwise, free up a room.

This is an O(n log n) time, O(n) space approach, easy to explain and less error-prone.

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
- If a meeting ends exactly when another starts, it's usually considered reusable (using {{<}}). Ask for the convention.
- Heap method: sort by start, push end into min-heap; if the smallest end <= current start, poll then push new end; heap size is the answer.
- Do not confuse with Merge Intervals: this only counts rooms, no need to merge intervals.

> Senior tip: This models capacity planning: number of workers, connection pools, or slots in a scheduler. In reality, you also have to account for buffers and shift transition times; note that theoretical models are only a lower bound.`,
    follow: ['Implement using min-heap and compare with the two-array approach.', 'If you need to assign each meeting to a specific room, how to do it?']
  }
});
