/*
 * English translation of js/data/algo.js — task T436. Format: js/core/i18n.js (content overlay).
 * ids: algo-101 algo-102 algo-103 algo-104 algo-105 algo-106 algo-107 algo-108
 */
App.i18n.content({
  'algo-101': {
    prompt: `Given an array of non-negative integers {{nums}} and a number {{target}}. For **each** element you put a {{+}} or a {{-}} sign in front of it. Return the number of sign assignments for which the expression evaluates exactly to {{target}}.

### Example
~~~text
Input: nums = [1, 1, 1, 1, 1], target = 3
Output: 5
Explanation: add four numbers and subtract one; there are 5 ways to pick which number is subtracted → 5 expressions.

Input: nums = [1], target = 1
Output: 1

Input: nums = [1], target = 2
Output: 0
~~~

### Constraints
- {{1 <= nums.length <= 20}}
- {{0 <= nums[i] <= 1000}}
- {{-1000 <= target <= 1000}}`,
    hints: [
      'Call the sum of the numbers that get {{+}} {{P}} and the sum of the numbers that get {{-}} {{N}}. We have {{P - N = target}} and {{P + N = sum}}.',
      'From those two equations: {{P = (sum + target) / 2}} — the problem reduces to **counting subsets** with sum {{P}} (this is exactly Count of Subset Sum).',
      'If {{abs(target) > sum}} or {{(sum + target)}} is odd there is no way to do it — return 0 early. A 0 in the array doubles the result naturally.'
    ],
    solution: `### Approach
{{P - N = target}} and {{P + N = sum}} → {{P = (sum + target) / 2}}. The problem becomes: count the subsets whose sum is {{P}} — reuse the Count of Subset Sum DP. Early checks: {{abs(target) > sum}} or {{(sum + target)}} odd → 0 ways. A 0 in the array is handled naturally: when {{x = 0}} the loop {{dp[s] += dp[s]}} doubles the number of ways — correct, because {{+0}} and {{-0}} are two different expressions.

~~~java
class Solution {
    public int findTargetSumWays(int[] nums, int target) {
        int sum = 0;
        for (int x : nums) sum += x;
        if (Math.abs(target) > sum || (sum + target) % 2 != 0) return 0;
        int p = (sum + target) / 2;   // sum of the numbers that get a PLUS
        int[] dp = new int[p + 1];
        dp[0] = 1;
        for (int x : nums) {
            for (int s = p; s >= x; s--) {
                dp[s] += dp[s - x];
            }
        }
        return dp[p];
    }
}
~~~

### Interview notes
- This is the "do the algebra before you code" problem: remember that {{P = (sum + target) / 2}} is the key; if you cannot reduce it to subset sum you have to fall back to a DFS over {{2^n}} branches (still feasible for {{n <= 20}}, but slower and longer to write).
- After checking {{abs(target) <= sum}} we know {{sum + target >= 0}}, so the modulo-2 check is safe and never negative.
- Zeros: the array [0] with target 0 → 2 ({{+0}}, {{-0}}) — the DP produces the right answer on its own, do not "special-case" it and break it.

> Senior tip: Target sum is a textbook example of **transforming the problem into one you already know** — that analytical skill matters more than writing the DP. In a real interview, when you see "put +/- in front of every element", say right away: it reduces to subset sum with target {{(sum + target) / 2}}; the rest is mechanical.`,
    follow: [
      'How would a memoised DFS solve this problem?',
      'What changes in the code if you must return one concrete sign assignment?'
    ]
  },
  'algo-102': {
    prompt: `You are a thief planning a row of {{n}} houses lined up along a straight street; house {{i}} holds {{nums[i]}} in cash. The security cameras enforce one rule: **you may not rob two adjacent houses**. Return the maximum amount of money you can rob.

### Example
~~~text
Input: nums = [1, 2, 3, 1]
Output: 4
Explanation: rob house 1 and house 3 → 1 + 3 = 4 (skip houses 2 and 4).

Input: nums = [2, 7, 9, 3, 1]
Output: 12
Explanation: 2 + 9 + 1 = 12.

Input: nums = [5]
Output: 5
~~~

### Constraints
- {{1 <= nums.length <= 100}}
- {{0 <= nums[i] <= 400}}`,
    hints: [
      'For each house there are only two choices: **rob** it (add its money to the best result that skipped the previous house) or **skip** it (keep the best result up to the previous house).',
      'Let {{dp[i]}} be the maximum amount considering the first {{i}} houses: {{dp[i] = max(dp[i-1], dp[i-2] + nums[i])}}.',
      'Two variables {{prev1, prev2}} are enough instead of the whole array — this problem is exactly where you practise collapsing a DP array the Fibonacci way.'
    ],
    solution: `### Approach
Last house: if you rob it you get {{nums[n-1] + best result for [0, n-2]}}; if you skip it you get {{best result for [0, n-1]}}. Formula: {{dp[i] = max(dp[i-1], dp[i-2] + nums[i])}}. Collapse it to two variables: {{prev2}} = the best result two houses back, {{prev1}} = the best result one house back.

~~~java
class Solution {
    public int rob(int[] nums) {
        int prev2 = 0;   // best result two houses back
        int prev1 = 0;   // best result one house back
        for (int x : nums) {
            int cur = Math.max(prev1, prev2 + x);   // skip this house or rob it
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }
}
~~~

### Interview notes
- {{nums.length = 1}}: the loop runs once → {{cur = max(0, 0 + x) = x}} — correct.
- Circular variant (House Robber II): the first and last houses are adjacent → run it twice, dropping the first house or dropping the last one, and take the max.
- The "rob more but pay a penalty" variant: first ask exactly how the penalty is added or subtracted before writing the formula — that is a communication trap, not a coding trap.

> Senior tip: House Robber is Fibonacci applied to data — in an interview, recognise that they are testing whether you see {{dp[i] = f(dp[i-1], dp[i-2])}}. Every one-dimensional DP shaped like "decide to take / not take element i" looks like this; House Robber II, Delete and Earn and Minimum Cost Climbing Stairs are all close siblings.`,
    follow: [
      'How do you solve House Robber II (first and last houses adjacent)?',
      'What extra state would you store to print the list of robbed houses?'
    ]
  },
  'algo-103': {
    prompt: `Same as House Robber: {{n}} houses arranged in a **circle** (house 1 and house {{n}} are adjacent); house {{i}} holds {{nums[i]}}; you may not rob two adjacent houses. Return the maximum amount you can rob.

### Example
~~~text
Input: nums = [2, 3, 2]
Output: 3
Explanation: you cannot rob both house 1 and house 3 (they are adjacent in the circle) → you can only take house 2.

Input: nums = [1, 2, 3, 1]
Output: 4
Explanation: house 1 + house 3 = 4.

Input: nums = [1, 2, 3]
Output: 3
~~~

### Constraints
- {{1 <= nums.length <= 100}}
- {{0 <= nums[i] <= 400}}`,
    hints: [
      'The first house and the last house cannot both be chosen — split the problem into two linear sub-problems: one that **drops the last house** and one that **drops the first house**.',
      'Run plain House Robber on the range [0 .. n-2] and on the range [1 .. n-1], then take the max of the two results.',
      '{{n = 1}} is a special corner case: both sub-problems are empty → return {{nums[0]}}.'
    ],
    solution: `### Approach
The only circular constraint is "house 1 and house n cannot both be robbed". Eliminate both conflicting cases by running **two passes of linear House Robber**: pass A over {{[0, n-2]}} (drop the last house) and pass B over {{[1, n-1]}} (drop the first house). Answer = {{max(A, B)}}. For {{n = 1}} return {{nums[0]}} directly.

~~~java
class Solution {
    public int rob(int[] nums) {
        int n = nums.length;
        if (n == 1) return nums[0];   // special case
        return Math.max(linear(nums, 0, n - 2), linear(nums, 1, n - 1));
    }

    // linear house robber over the range [lo, hi]
    private int linear(int[] nums, int lo, int hi) {
        int prev2 = 0, prev1 = 0;
        for (int i = lo; i <= hi; i++) {
            int cur = Math.max(prev1, prev2 + nums[i]);
            prev2 = prev1;
            prev1 = cur;
        }
        return prev1;
    }
}
~~~

### Interview notes
- {{n = 2}}: the two sub-problems are [nums[0]] and [nums[1]] → take the max — correct (you can rob only one house).
- Do not try to "merge" the two sub-problems into one complicated DP: two linear O(n) passes are already optimal, and the code is shorter and far less error-prone.
- Hard variant "rob at most k consecutive houses": needs a two-dimensional DP {{dp[i][j]}} — mentioning that direction is a big plus.

> Senior tip: The "split into cases because of a circular constraint" pattern also shows up outside algorithms: rotating sales windows, picking transactions in a batch where you cannot take both the first and the last. Interviewers watch whether you handle {{n = 1}} and {{n = 2}} up front, because that reveals how seriously you think about corner cases.`,
    follow: [
      'Why do the two linear sub-problems cover every case?',
      'If the houses were on a straight line (problem I), which part of the code could be reused?'
    ]
  },
  'algo-104': {
    prompt: `Each stair {{i}} of a staircase has a cost {{cost[i]}} — you pay this fee when you **step on** that stair. From stair {{i}} you may climb 1 or 2 stairs up. You may start at stair 0 or stair 1 (for free). The "top" is the position **after** the last stair. Return the minimum cost to reach the top.

### Example
~~~text
Input: cost = [10, 15, 20]
Output: 15
Explanation: start at stair 1 → pay 15 to jump 2 stairs up to the top.

Input: cost = [1, 100, 1, 1, 1, 100, 1]
Output: 4
Explanation: start at stair 0 → 0 → 2 → 4 → 6 → top, cost 1 + 1 + 1 + 1 = 4.

Input: cost = [1, 2]
Output: 1
~~~

### Constraints
- {{2 <= cost.length <= 1000}}
- {{0 <= cost[i] <= 999}}`,
    hints: [
      'To stand on stair {{i}} the last step came from {{i-1}} or {{i-2}} — a Fibonacci relation.',
      '{{dp[i] = cost[i] + min(dp[i-1], dp[i-2])}}: the minimum cost to **stand on** stair {{i}}.',
      'The top is past the last stair: the answer is {{min(dp[n-1], dp[n-2])}} — or append a 0 to {{cost}} to keep it tidy.'
    ],
    solution: `### Approach
{{dp[i] = cost[i] + min(dp[i-1], dp[i-2])}} — the minimum cost to stand on stair {{i}}. The top is one position past the last stair, so you can only reach it from {{n-1}} or {{n-2}}: the answer is {{min(dp[n-1], dp[n-2])}}. Collapse it to two variables like House Robber.

~~~java
class Solution {
    public int minCostClimbingStairs(int[] cost) {
        int prev2 = cost[0];   // minimum cost to stand on stair i-2
        int prev1 = cost[1];   // minimum cost to stand on stair i-1
        for (int i = 2; i < cost.length; i++) {
            int cur = cost[i] + Math.min(prev1, prev2);
            prev2 = prev1;
            prev1 = cur;
        }
        return Math.min(prev1, prev2);   // the top can be reached from n-1 or n-2
    }
}
~~~

### Interview notes
- House Robber is "maximise value without taking adjacent items"; this problem is "minimise cost while moving 1-2 steps" — the same skeleton {{dp[i] = f(dp[i-1], dp[i-2])}}, only max/min and the base condition differ.
- The "insert extra expensive stairs" variant: just add elements and rerun the DP — ask the interviewer first before coding.
- {{cost.length = 2}}: the loop does not run and it returns {{min(cost[0], cost[1])}} — correct.

> Senior tip: This problem belongs to ByteByteGo's "Fibonacci numbers" group — when you see "move 1 or 2 steps", call up {{dp[i] = cost[i] + min(dp[i-1], dp[i-2])}} in your head first, then ask about the details. A senior is judged on **recognising the pattern within 10 seconds**, not on writing the loop.`,
    follow: [
      'Compare the formula with House Robber: what is the same and what differs?',
      'If negative costs were allowed, would the algorithm still be correct?'
    ]
  },
  'algo-105': {
    prompt: `A letter message is encoded into a string of digits using {{A = 1, B = 2, ..., Z = 26}}. Given a string {{s}} containing digits only, count the **number of ways** to decode the whole string back into letters. Each code is 1 or 2 digits long; a code with a leading {{0}} (such as {{"06"}}) is invalid, and {{"0"}} on its own does not map to any letter.

### Example
~~~text
Input:  s = "12"
Output: 2
Explanation: "AB" (1, 2) and "L" (12).

Input:  s = "226"
Output: 3
Explanation: "BZ" (2, 26), "VF" (22, 6), "BBF" (2, 2, 6).

Input:  s = "06"
Output: 0
Explanation: "0" is not a valid code and neither is "06" (unlike "6").
~~~

### Constraints
- {{1 <= s.length <= 100}}
- {{s}} contains only the digits {{'0'..'9'}}.
- The statement guarantees the result fits in an {{int}}.`,
    hints: [
      'Look at the **last code** of a decoding: either it is a single digit {{s[i]}} (allowed only when it is not {{0}}), or it is two digits {{s[i-1..i]}} (allowed only when it lies in 10..26).',
      'Let {{ways[i]}} = the number of ways to decode the first {{i}} characters. Then {{ways[i] = (s[i-1] != 0 ? ways[i-1] : 0) + (10 <= s[i-2..i-1] <= 26 ? ways[i-2] : 0)}}, with {{ways[0] = 1}} (an empty string has exactly one decoding: do nothing).',
      'Each step only needs the two previous values, just like Fibonacci: keep two variables {{prev2}}, {{prev1}} instead of the whole array to get O(1) memory.'
    ],
    solution: `### Approach
This is "Fibonacci with conditions". In Climbing Stairs every move climbs 1 or 2 steps, so {{ways[i] = ways[i-1] + ways[i-2]}}. Here "climb 1 step" = use one digit and "climb 2 steps" = use two digits, but each option is allowed only when the code is valid:
- One digit {{s[i-1]}}: valid when that digit is not {{'0'}}.
- Two digits {{s[i-2..i-1]}}: valid when the value lies in [10, 26] (this automatically rejects "05", "27" and so on).

Let {{ways[i]}} be the number of ways to decode the **first i characters**. Set {{ways[0] = 1}}: the empty string has one decoding (the empty one). That value makes the formula correct for a two-digit code at the very start, for example {{"12"}}: using "12" corresponds to {{ways[0] = 1}} way.

~~~java
class Solution {
    public int numDecodings(String s) {
        int prev2 = 1;                                   // ways[i-2], initially ways[0] = 1 (empty string)
        int prev1 = s.charAt(0) == '0' ? 0 : 1;          // ways[i-1], initially ways[1]
        for (int i = 2; i <= s.length(); i++) {
            int cur = 0;
            char one = s.charAt(i - 1);                  // last character of the length-i prefix
            if (one != '0') cur += prev1;                // use one digit as the last code
            int two = (s.charAt(i - 2) - '0') * 10 + (one - '0');
            if (two >= 10 && two <= 26) cur += prev2;    // use two digits as the last code
            prev2 = prev1;                               // slide the window right
            prev1 = cur;
        }
        return prev1;                                    // ways[n]
    }
}
~~~

### Dry run with s = "226"
| i | prefix | 1 digit | 2 digits | ways[i] |
|---|---|---|---|---|
| 0 | "" | | | 1 |
| 1 | "2" | '2' ✔ → 1 | | 1 |
| 2 | "22" | '2' ✔ → 1 | "22" ✔ → 1 | 2 |
| 3 | "226" | '6' ✔ → 2 | "26" ✔ → 1 | 3 |

### Zero cases (often asked)
- {{"10"}} → 1 (only "J"). {{"100"}} → 0: the trailing "0" cannot stand alone and "00" is invalid.
- {{"30"}} → 0: "0" cannot stand alone, and "30" > 26.
- {{"101"}} → 1: only (10, 1).
- Once {{ways[i] = 0}} and {{ways[i-1] = 0}}, every later value is 0 too. You may stop early, but that is not required.

### Complexity
One loop → O(n) time, O(1) memory.

### Interview notes
- Explain clearly what {{ways[0] = 1}} means: this is exactly where candidates get stuck.
- Write the memoised recursive version first if that is easier for you, then move to bottom-up and shrink it to two variables.

> Senior tip: Most "count the ways" problems that walk position by position have the shape {{ways[i]}} depending on a few previous values. Find the "last decision" (here: is the final code 1 or 2 digits long) and the formula appears.`,
    follow: [
      'What if you had to print one (or every) decoding instead of counting them?',
      'In the Decode Ways II variant the character {{*}} stands for 1–9: how does the formula change?'
    ]
  },
  'algo-106': {
    prompt: `Given any node of a **connected undirected graph**. Each node has a value {{val}} (unique) and a list of {{neighbors}}. Create a **deep copy** of the whole graph and return the copy node that corresponds to the node given. The copy must consist entirely of **new** nodes and must not reuse any node of the original graph; if the input is {{null}} return {{null}}.

### Example
~~~text
Input:  adjList = [[2,4],[1,3],[2,4],[1,3]]
        (node 1 is connected to 2 and 4; node 2 to 1 and 3; node 3 to 2 and 4; node 4 to 1 and 3)
Output: [[2,4],[1,3],[2,4],[1,3]]  (same structure, but all nodes are new)

Input:  adjList = [[]]   (a single node with no edges)
Output: [[]]
~~~

### Constraints
- {{0 <= number of nodes <= 100}}, {{1 <= Node.val <= 100}}, all {{val}} are distinct.
- There are no self-loops and no repeated edges.

> {{Node}} is already defined, with a {{public int val}} field, a {{public List<Node> neighbors}} field and a constructor {{Node(int val)}} (which initialises {{neighbors}} as empty).`,
    hints: [
      'The graph has cycles (1 → 2 → 1). If you create a new node every time you see a neighbour you will loop forever. You need to remember which original nodes **have already been copied**.',
      'Use a {{Map<Node, Node>}} mapping original node → copy node. That map is both your "visited" set and the way to wire edges to the right existing copy.',
      'Create the copy and **put it in the map first**, then walk the neighbours. If you insert into the map only after the walk finishes, a cycle will recurse back into the same node forever.'
    ],
    solution: `### Approach
Traverse the original graph (DFS or BFS). For each original node create exactly **one** copy node and record it in {{Map<Node, Node> copies}}.
- Node not in the map yet: create the copy, put it in the map, then copy each neighbour and add it to the copy's {{neighbors}}.
- Node already in the map: return the existing copy, do not create another. This is what keeps cycles from looping forever and makes every edge point to the same copy node.

~~~java
class Solution {
    private final Map<Node, Node> copies = new HashMap<>(); // original node -> copy node

    public Node cloneGraph(Node node) {
        if (node == null) return null;
        Node existing = copies.get(node);
        if (existing != null) return existing;      // already copied: reuse the copy
        Node copy = new Node(node.val);
        copies.put(node, copy);                     // put in the map BEFORE walking the neighbours
        for (Node nb : node.neighbors) {
            copy.neighbors.add(cloneGraph(nb));     // copy (or fetch) each neighbour
        }
        return copy;
    }
}
~~~

### Dry run on the square graph 1-2-3-4
1. {{clone(1)}}: create 1', map {1→1'}. Walk neighbour 2.
2. {{clone(2)}}: create 2', add 2→2' to the map. Neighbour 1 already exists → return 1'. Neighbour 3 → {{clone(3)}}.
3. {{clone(3)}}: create 3'. Neighbour 2 already exists → 2'. Neighbour 4 → {{clone(4)}}: create 4', neighbours 1 and 3 both already exist.
4. Back in 1: neighbour 4 already exists → 4'. Done — every original node has exactly one copy.

### Complexity
Each node is created once and each edge is traversed twice (undirected) → O(V + E) time, O(V) memory for the map and the recursion stack.

### Interview notes
- Very deep graphs (a chain of thousands of nodes) can make recursive DFS throw {{StackOverflowError}}; use BFS with an {{ArrayDeque}} instead.
- Using {{Node}} as a map key relies on the default {{equals/hashCode}} (reference comparison), which is exactly what we want. If {{val}} is unique you could also use {{Map<Integer, Node>}}.
- The copy's {{neighbors}} order should match the original's.

> Senior tip: The same "map from original object to copy" pattern is used to deep-copy object graphs with cyclic references (for example a bidirectional JPA entity). Missing that map is the classic cause of {{StackOverflowError}} during serialisation or cloning.`,
    follow: [
      'Rewrite it with BFS using a queue: how does it differ from DFS?',
      'What would you change if the graph were directed and not connected (given the list of all nodes)?'
    ]
  },
  'algo-107': {
    prompt: `A rectangular island is divided into an {{m x n}} grid, where {{heights[r][c]}} is the height of cell {{(r, c)}}. The **Pacific Ocean** touches the top and left edges of the island; the **Atlantic Ocean** touches the bottom and right edges. Rain water flows from a cell to an adjacent cell (up/down/left/right) if that neighbour's height is **less than or equal to** the current cell's height; cells on the island's border flow straight into the ocean touching that border. Return the coordinates {{[r, c]}} of every cell from which water can reach **both** oceans, ordered row by row then column by column (row-major).

### Example
~~~text
Input:  heights = [[1,2,2,3,5],
                   [3,2,3,4,4],
                   [2,4,5,3,1],
                   [6,7,1,4,5],
                   [5,1,1,2,4]]
Output: [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]
Explanation: for example cell (2,2) with height 5:
  (2,2)=5 → (1,2)=3 → (0,2)=2 → top edge → Pacific
  (2,2)=5 → (2,3)=3 → (2,4)=1 → right edge → Atlantic

Input:  heights = [[1]]
Output: [[0,0]]
~~~

### Constraints
- {{1 <= m, n <= 200}}
- {{0 <= heights[r][c] <= 10^5}}`,
    hints: [
      'Trying every cell and checking whether water escapes costs O((mn)²) overall. Reverse the question: **walk upstream from the ocean** — which cells can be reached?',
      'Walking upstream means moving from the current cell to an adjacent cell with a height **greater than or equal to** the current one. Start a BFS/DFS from every cell on the Pacific-facing border and mark {{pacific[r][c]}}; do the same for the Atlantic.',
      'The answer is the cells where both {{pacific}} and {{atlantic}} are true. Scan the grid row by row, then column by column, so the result is in the required order.'
    ],
    solution: `### Approach
The original question is: "does water flow from cell X to the sea?". Asking that for every cell costs O(mn) each time, O((mn)²) in total = 1.6·10^9 for a 200×200 grid — far too slow.

Invert it: "which cells can the ocean reach **walking upstream**?". Water flows from A down to B when {{h[B] <= h[A]}}, so we walk backwards from B up to A when {{h[A] >= h[B]}}. Two **multi-source BFS** runs are enough:
1. Sources = every cell in row 0 and column 0 → mark {{pacific}}.
2. Sources = every cell in row m-1 and column n-1 → mark {{atlantic}}.
3. Cells in both sets are the answer.

~~~java
class Solution {
    private static final int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public List<List<Integer>> pacificAtlantic(int[][] heights) {
        int m = heights.length, n = heights[0].length;
        boolean[][] pacific = new boolean[m][n], atlantic = new boolean[m][n];
        Deque<int[]> pq = new ArrayDeque<>(), aq = new ArrayDeque<>();
        for (int r = 0; r < m; r++) {
            mark(pq, pacific, r, 0);          // left column touches the Pacific
            mark(aq, atlantic, r, n - 1);     // right column touches the Atlantic
        }
        for (int c = 0; c < n; c++) {
            mark(pq, pacific, 0, c);          // top row
            mark(aq, atlantic, m - 1, c);     // bottom row
        }
        bfs(heights, pq, pacific);
        bfs(heights, aq, atlantic);
        List<List<Integer>> res = new ArrayList<>();
        for (int r = 0; r < m; r++)           // rows first, then columns -> row-major result
            for (int c = 0; c < n; c++)
                if (pacific[r][c] && atlantic[r][c]) res.add(Arrays.asList(r, c));
        return res;
    }

    private void mark(Deque<int[]> q, boolean[][] seen, int r, int c) {
        if (!seen[r][c]) { seen[r][c] = true; q.add(new int[]{r, c}); }
    }

    // walk upstream: move to a neighbour with height >= the current cell
    private void bfs(int[][] h, Deque<int[]> q, boolean[][] seen) {
        while (!q.isEmpty()) {
            int[] cur = q.poll();
            for (int[] d : DIRS) {
                int nr = cur[0] + d[0], nc = cur[1] + d[1];
                if (nr < 0 || nr >= h.length || nc < 0 || nc >= h[0].length) continue;
                if (seen[nr][nc] || h[nr][nc] < h[cur[0]][cur[1]]) continue;
                mark(q, seen, nr, nc);
            }
        }
    }
}
~~~

### Dry run on the 2×2 grid [[1,2],[4,3]]
- Pacific: sources (0,0),(0,1),(1,0). From (0,1)=2 upstream to (1,1)=3 (3 ≥ 2) → all four cells.
- Atlantic: sources (1,0),(1,1),(0,1). From there to (0,0)=1? 1 < 2 and 1 < 4 → no. So three cells.
- Intersection: (0,1),(1,0),(1,1).

### Complexity
Each cell enters the queue at most once per ocean → O(m·n) time and memory.

### Interview notes
- Recursive DFS also works, but a 200×200 grid can produce a path of 40,000 cells → risk of {{StackOverflowError}}; BFS is safer.
- The condition is **≥** (cells of equal height still let water flow). Using {{>}} gives wrong answers on flat regions.
- Mark {{seen}} **when you enqueue**, not when you dequeue, so a cell is not added several times.

> Senior tip: "Reverse the search from the destination" is a common optimisation trick: instead of asking whether N sources can reach the target, flood once from the target. The same idea applies when computing "which services are affected if database X goes down" on a dependency graph.`,
    follow: [
      'What is the risk of recursive DFS on a 200x200 grid, and how do you mitigate it?',
      'If the grid changes (one cell is raised), do you have to recompute everything?'
    ]
  },
  'algo-108': {
    prompt: `Given a grid {{grid}} of size {{m x n}}, where each cell is {{0}} (empty), {{1}} (fresh orange) or {{2}} (rotten orange). Every minute, every fresh orange **edge-adjacent** (up/down/left/right) to a rotten orange becomes rotten. Return the **minimum** number of minutes until no fresh orange is left. If some orange can never rot, return {{-1}}; if there were no fresh oranges at the start, return {{0}}.

### Example
~~~text
Input:  grid = [[2,1,1],
                [1,1,0],
                [0,1,1]]
Output: 4

Input:  grid = [[2,1,1],
                [0,1,1],
                [1,0,1]]
Output: -1
Explanation: the orange at the bottom-left corner (2,0) has no neighbour, so it never rots.

Input:  grid = [[0,2]]
Output: 0
~~~

### Constraints
- {{1 <= m, n <= 10}}
- {{grid[r][c]}} is {{0}}, {{1}} or {{2}}.`,
    hints: [
      'All initially rotten oranges spread **at the same time**. Put all of them into the queue right away (multi-source BFS); do not run a separate BFS from each one.',
      'Process the BFS **layer by layer**: take exactly the {{q.size()}} elements currently in the queue = the oranges rotting in the current minute; the oranges they infect rot in the next minute.',
      'Count the fresh oranges at the start and decrement the counter each time one rots. If fresh oranges remain at the end, return {{-1}}.'
    ],
    solution: `### Approach
This is the classic "spread over time" problem, and the solution is **multi-source BFS**:
1. Scan the grid: put every rotten orange into the queue and count the fresh ones in {{fresh}}.
2. If {{fresh == 0}} → return 0.
3. Loop minute by minute: take out **exactly the number of elements currently in the queue** (the current layer). Each orange rots its fresh neighbours, turns them into 2 (which doubles as the visited mark), decrements {{fresh}} and enqueues them for the next minute.
4. If the loop ends with {{fresh > 0}} → {{-1}}, otherwise return the number of minutes.

Why does BFS give the **minimum** number of minutes? BFS visits cells in increasing order of distance from the nearest source. The moment an orange rots is exactly the shortest distance from it to an initially rotten orange.

~~~java
class Solution {
    public int orangesRotting(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        Deque<int[]> q = new ArrayDeque<>();
        int fresh = 0;
        for (int r = 0; r < m; r++)
            for (int c = 0; c < n; c++) {
                if (grid[r][c] == 2) q.add(new int[]{r, c}); // every source starts at minute 0
                else if (grid[r][c] == 1) fresh++;
            }
        int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        int minutes = 0;
        while (fresh > 0 && !q.isEmpty()) {
            int size = q.size();                 // number of oranges rotting in the current minute
            for (int k = 0; k < size; k++) {
                int[] cur = q.poll();
                for (int[] d : dirs) {
                    int r = cur[0] + d[0], c = cur[1] + d[1];
                    if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] != 1) continue;
                    grid[r][c] = 2;              // make it rotten = mark as visited
                    fresh--;
                    q.add(new int[]{r, c});      // it will spread next minute
                }
            }
            minutes++;                           // one layer finished = one minute passed
        }
        return fresh == 0 ? minutes : -1;
    }
}
~~~

### Dry run on example 1
- Minute 0: rotten {(0,0)}, fresh = 6.
- Minute 1: (0,1),(1,0) rot. Minute 2: (0,2),(1,1). Minute 3: (2,1). Minute 4: (2,2). fresh = 0 → 4.

### Complexity
Each cell enters the queue at most once → O(m·n) time and memory.

### Interview notes
- The {{fresh > 0}} condition in the {{while}} matters: without it, the final layer (which rots nothing new) would still add one extra minute.
- The solution above mutates the caller's {{grid}}. If you are not allowed to modify the input, use a separate {{visited}} array or copy the grid. Ask the interviewer.
- Running a BFS from each rotten orange and taking the minimum is the wrong model (the sources spread simultaneously) and is slower.

> Senior tip: Multi-source BFS models "simultaneous spread" well: forest fires, infections, or computing the distance from every point to the nearest warehouse. Recognising "many starting points at the same time" is the key.`,
    follow: [
      'What changes in the code if you may not modify the input grid?',
      'Why is DFS unsuitable for computing the minimum number of minutes?'
    ]
  }
});