/*
 * English translation of js/data/algo.js — task T435. Format: js/core/i18n.js (content overlay).
 * ids: algo-093 algo-094 algo-095 algo-096 algo-097 algo-098 algo-099 algo-100
 */
App.i18n.content({
  'algo-093': {
    prompt: `Given an array {{points}} where {{points[i] = [xi, yi]}} is the coordinate of a point on the plane. Return the {{k}} points **closest to the origin (0, 0)**. The order inside the result does not matter.

### Example
~~~text
Input: points = [[1, 3], [-2, 2]], k = 1
Output: [[-2, 2]]

Input: points = [[3, 3], [5, -1], [-2, 4]], k = 2
Output: [[3, 3], [-2, 4]]
~~~

### Constraints
- {{1 <= k <= points.length <= 10^4}}
- {{-10^4 <= xi, yi <= 10^4}}`,
    hints: [
      'The distance to the origin is {{sqrt(x^2 + y^2)}} — for comparison you only need the **square**, no sqrt (faster, and it avoids floating-point rounding error).',
      'Straightforward approach: sort by squared distance and take the first k elements — O(n log n).',
      'Better: a max-heap holding exactly the k closest points, comparing every new element against the root — O(n log k); or a quickselect partition for O(n) on average.'
    ],
    solution: `### Approach
Compare squared distances, no sqrt needed. Use a **max-heap** ordered by squared distance that keeps exactly the {{k}} smallest elements: push every point, and whenever the heap grows past k, {{poll()}} removes the farthest point (the root). The heap always holds the k points closest to the origin, and because the order does not matter we can return it as is.

~~~java
class Solution {
    public int[][] kClosest(int[][] points, int k) {
        // max-heap by squared distance: the root is the FARTHEST of the k closest points
        PriorityQueue<int[]> heap = new PriorityQueue<>(
            (a, b) -> Integer.compare(b[0] * b[0] + b[1] * b[1],
                                      a[0] * a[0] + a[1] * a[1]));
        for (int[] p : points) {
            heap.offer(p);
            if (heap.size() > k) heap.poll();   // drop the FARTHEST point
        }
        return heap.toArray(new int[0][]);
    }
}
~~~

### Interview notes
- Use {{Integer.compare(a, b)}} instead of {{a - b}}: with these constraints the squared distance does not overflow int, but the habit keeps you safe with larger coordinates (use {{long}}).
- If the interviewer asks for O(n) on average: **quickselect** partition by squared distance — longer code, be careful with the O(n^2) worst case on dense data; you can add a random pivot.
- If {{k = n}} then sorting the whole array is optimal (nothing gets discarded); if {{k}} is small the heap wins.

> Senior tip: In real systems "k nearest points" (nearest-neighbour) is the core problem of a location service: find the k closest branches or restaurants to a user. Beyond the algorithm you also need spatial indexes (R-tree, geohash) — nobody scans all {{10^7}} points on every request; the algorithm is only the last step after the index has already filtered the candidates.`,
    follow: [
      'Explain how to write quickselect for this problem and when its worst case happens.',
      'If each point had a weight, how would "closest" be defined?'
    ]
  },
  'algo-094': {
    prompt: `Given an {{n x n}} square matrix where every **row** and every **column** is sorted in ascending order (elements may repeat). Return the **{{k}}th smallest** element ({{k}} starts at 1) when the matrix is read in non-decreasing order.

### Example
~~~text
Input: matrix = [[1, 5, 9],
                 [10, 11, 13],
                 [12, 13, 15]], k = 8
Output: 13
Explanation: the ascending sequence is [1, 5, 9, 10, 11, 12, 13, 13, 15] → the 8th element is 13.

Input: matrix = [[-5]], k = 1
Output: -5
~~~

### Constraints
- {{1 <= n <= 300}}
- {{-10^9 <= matrix[i][j] <= 10^9}}
- The matrix is sorted as described, and {{1 <= k <= n^2}}.`,
    hints: [
      'The smallest element is {{matrix[0][0]}} and the largest is {{matrix[n-1][n-1]}} — the answer lies inside this range of values.',
      'Flatten and sort is O(n^2 log n^2): correct but wasteful. Do a **binary search on the value** instead: for each {{mid}}, count how many elements are <= {{mid}}.',
      'Counting elements <= {{x}} in O(n): start from the **bottom-left** corner (the first column is sorted); if {{m[r][c] <= x}} then all {{r+1}} elements above it in this column are <= x, so add them and move to the next column; otherwise move up one row.'
    ],
    solution: `### Approach
**Binary search over the value space** from {{lo = matrix[0][0]}} to {{hi = matrix[n-1][n-1]}}. For each {{mid}} compute {{countLE(mid)}} — the number of elements less than or equal to {{mid}} — by walking up from the bottom-left corner: each column is sorted, so if {{m[r][c] <= mid}} then all {{r+1}} elements above it qualify; add them and move to the next column, otherwise decrease {{r}}. That is O(n) per count.

If {{countLE(mid) < k}} the answer is > mid (raise {{lo}}); otherwise the answer is <= mid ({{hi = mid}}). {{lo == hi}} is the answer — the kth smallest element **is** the smallest value that has at least k elements <= it.

~~~java
class Solution {
    public int kthSmallest(int[][] matrix, int k) {
        int n = matrix.length;
        int lo = matrix[0][0], hi = matrix[n - 1][n - 1];
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (countLE(matrix, mid) < k) lo = mid + 1;   // too small, the answer is to the right
            else hi = mid;                                 // large enough, the answer lies in [lo, mid]
        }
        return lo;
    }

    // count elements <= x, walking up from the bottom-left corner
    private int countLE(int[][] m, int x) {
        int n = m.length, r = n - 1, c = 0, cnt = 0;
        while (r >= 0 && c < n) {
            if (m[r][c] <= x) { cnt += r + 1; c++; }   // this whole column is <= x
            else r--;                                   // this column has an element > x, move up
        }
        return cnt;
    }
}
~~~

### Interview notes
- The classic trap: mid may be a value that **does not exist** in the matrix and that is still fine — we only count, mid does not have to be an actual element. The search converges to the real kth smallest value (this also handles duplicates).
- Heap approach: n rows, a min-heap initially holding the first element of each row, {{poll}} k times — O(k log n), **better** when {{k << n^2}}. Mentioning both approaches is a plus.
- {{lo + (hi - lo) / 2}} avoids overflow compared with {{(lo + hi) / 2}} when values are close to {{10^9}}.

> Senior tip: "Binary search on the answer + count how many elements satisfy the condition" is the shared template of many hard problems (koko eating bananas, split array, magnetic force). In a senior interview you should recognise this pattern straight from the wording "find the kth element in a structure sorted in two dimensions".`,
    follow: [
      'Compare with the min-heap approach: when does the heap beat binary search?',
      'What if the matrix were sorted by rows only, not by columns?'
    ]
  },
  'algo-095': {
    prompt: `Given a string {{s}}. Rearrange its characters so that **identical characters sit next to each other** and characters with a **higher frequency come first**. If several characters share the same frequency, their relative order is arbitrary.

### Example
~~~text
Input:  s = "tree"
Output: "eert"   (or "eetr" — e appears 2 times so it goes first)

Input:  s = "cccaaa"
Output: "cccaaa" (or "aaaccc" — both are correct)

Input:  s = "Aabb"
Output: "bbAa"   (or "bbaA" — b: 2, a: 1, A: 1)
~~~

### Constraints
- {{1 <= s.length <= 5 * 10^4}}; {{s}} contains upper-case letters, lower-case letters and digits.`,
    hints: [
      'Count the frequency of every character first — O(n) with a HashMap or an array of 128 slots.',
      'Option 1: put the (character, frequency) pairs into a **max-heap** ordered by frequency, then pop one pair at a time and append the character the right number of times.',
      'Option 2 (O(n)): group the characters into **buckets** by frequency — bucket[i] holds the characters that appear i times — then walk the buckets from the highest frequency down.'
    ],
    solution: `### Approach
Count the frequencies, then order the (character, frequency) pairs by decreasing frequency with a max-heap; each time you pop a pair, append that character the right number of times with a StringBuilder. All characters with the same frequency form one contiguous group, so the "identical characters side by side" requirement is satisfied automatically.

~~~java
class Solution {
    public String frequencySort(String s) {
        Map<Character, Integer> freq = new HashMap<>();
        for (char c : s.toCharArray()) freq.merge(c, 1, Integer::sum);

        // max-heap by decreasing frequency
        PriorityQueue<Map.Entry<Character, Integer>> heap =
            new PriorityQueue<>((a, b) -> Integer.compare(b.getValue(), a.getValue()));
        heap.addAll(freq.entrySet());

        StringBuilder sb = new StringBuilder();
        while (!heap.isEmpty()) {
            Map.Entry<Character, Integer> e = heap.poll();
            for (int i = 0; i < e.getValue(); i++) sb.append(e.getKey());
        }
        return sb.toString();
    }
}
~~~

### Interview notes
- Because the statement allows any order among equal frequencies, the answer **does not** need to be uniquely determined — the interviewer may ask "how do you make the result deterministic?" → add a secondary sort by alphabetical order.
- Bucket sort O(n) is usually mentioned as the optimal answer: the maximum frequency is {{n}}, so there are at most {{n}} buckets; no comparisons, no log.
- Do not write {{b.getValue() - a.getValue()}} as the comparator if frequencies can be large: {{Integer.compare}} is safer; with these constraints it does not overflow yet, but it is a good habit.

> Senior tip: "Frequency sort" is the shell of many real problems: log compression (RLE), top-k query suggestion, or "most active user in a window". After covering heap/bucket, a senior should also discuss the **window** part: counting frequencies over the last 5 minutes needs a sliding window + map, it is no longer a single static count.`,
    follow: [
      'Explain how to do the O(n) bucket sort for this problem.',
      'What would you do if you were only allowed O(1) extra memory (besides the result)?'
    ]
  },
  'algo-096': {
    prompt: `You have {{n}} items; item {{i}} has weight {{weights[i]}} and value {{values[i]}}. The bag can carry at most {{capacity}}. Each item may be taken **at most once** or not at all (0/1). Return the maximum value you can fit into the bag.

### Example
~~~text
Input: weights = [1, 2, 3], values = [6, 10, 12], capacity = 5
Output: 22
Explanation: take item 2 (weight 2, value 10) + item 3 (weight 3, value 12) = 22.

Input: weights = [10], values = [5], capacity = 5
Output: 0
Explanation: the item is heavier than the bag, nothing can be taken.

Input: weights = [2, 3, 4, 5], values = [3, 4, 5, 6], capacity = 8
Output: 10
Explanation: item 2 (weight 3, value 4) + item 4 (weight 5, value 6).
~~~

### Constraints
- {{1 <= n <= 100}}
- {{1 <= weights[i], values[i] <= 100}}
- {{1 <= capacity <= 1000}}`,
    hints: [
      'Brute force: each item has 2 choices → {{2^n}} — far too slow. Which state is being recomputed over and over?',
      'Let {{dp[w]}} be the maximum value that fits in a bag of capacity {{w}}. For each item, how do you update it so that the item is used only once?',
      'Iterate {{w}} **downwards** from {{capacity}} down to {{weights[i]}}: when you update {{dp[w]}}, the cells {{dp[w - weights[i]]}} to its left do not contain the current item yet → the item is used only once.'
    ],
    solution: `### Approach
1-D DP: {{dp[w]}} = the maximum value that fits in a bag of capacity {{w}}. For each item (weight {{wt}}, value {{val}}), iterate {{w}} from {{capacity}} down to {{wt}}:

{{dp[w] = max(dp[w], dp[w - wt] + val)}}

Because {{w}} goes downwards, {{dp[w - wt]}} is still the state **before** the current item was considered → each item is used at most once. Iterating upwards would let the item be reused an unlimited number of times — that is unbounded knapsack, the classic trap.

~~~java
class Solution {
    public int knapsack(int[] weights, int[] values, int capacity) {
        int[] dp = new int[capacity + 1];
        for (int i = 0; i < weights.length; i++) {
            // iterate backwards: each item is used at most ONCE
            for (int w = capacity; w >= weights[i]; w--) {
                dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
            }
        }
        return dp[capacity];
    }
}
~~~

### Interview notes
- Expand to two dimensions {{dp[i][w]}} (considering the first {{i}} items) to explain the idea more easily; collapse to one dimension only once you can justify the backward iteration.
- If the interviewer asks "count the number of subsets whose value is exactly the target" → the Count of Subset Sum variant; "split into two equal halves" → Equal Partition.
- Large {{capacity}} ({{10^6}}) with a small {{n}} → consider meet-in-the-middle or branch & bound instead of {{O(n * capacity)}}.

> Senior tip: Knapsack is the root of many real problems: batch sizing that maximises revenue under RAM/CPU constraints, choosing features for a model under an inference budget, choosing a log sampling rate. Make the problem feel production-like by adding a second constraint (for example a limit on the number of items) — that is multidimensional knapsack, and senior interviewers often push you there.`,
    follow: [
      'Why must w be iterated downwards for 0/1 knapsack?',
      'If each item type had a limited quantity, which algorithm would you use?'
    ]
  },
  'algo-097': {
    prompt: `Given an array of positive integers {{nums}} and a number {{target}}. Return {{true}} if some **subset** (the elements do not need to be contiguous) of {{nums}} sums to exactly {{target}}, otherwise {{false}}.

### Example
~~~text
Input: nums = [1, 2, 3, 7], target = 6
Output: true
Explanation: 1 + 2 + 3 = 6.

Input: nums = [1, 2, 3, 7], target = 15
Output: false
Explanation: the whole array sums to only 13, less than 15.

Input: nums = [1, 2, 5], target = 4
Output: false
~~~

### Constraints
- {{1 <= nums.length <= 100}}
- {{1 <= nums[i] <= 100}}
- {{1 <= target <= 10^4}}`,
    hints: [
      'Let {{dp[s]}} mean "can we already make the sum s from the elements considered so far?". {{dp[0]}} is always {{true}} (choose nothing).',
      'For each element {{x}}, if {{dp[s - x]}} is already true then adding {{x}} makes {{dp[s]}} true.',
      'Iterate {{s}} downwards so each element is used only once — the same template as 0/1 knapsack; the only difference is that the value is a boolean instead of a number.'
    ],
    solution: `### Approach
1-D boolean DP: {{dp[s]}} = the sum {{s}} can be made from the elements considered so far. {{dp[0] = true}}. For each {{x}} in {{nums}}, iterate {{s}} from {{target}} down to {{x}}: {{dp[s] = dp[s] || dp[s - x]}}. The downward iteration guarantees each element is used at most once.

~~~java
class Solution {
    public boolean canPartition(int[] nums, int target) {
        boolean[] dp = new boolean[target + 1];
        dp[0] = true;   // the empty subset sums to 0
        for (int x : nums) {
            for (int s = target; s >= x; s--) {
                dp[s] = dp[s] || dp[s - x];   // take x or don't take x
            }
        }
        return dp[target];
    }
}
~~~

### Interview notes
- If {{target = 0}} → always {{true}} (the empty subset); if the whole array sums to less than target, cut it off right away and skip a pointless DP run.
- Negative numbers in {{nums}}? This problem has positive integers only; with negatives the boolean array of size {{target + 1}} is no longer enough — you need a map from sum to boolean, or shift the indices.
- Subset sum leads directly to two variants: **Equal Partition** ({{target = sum / 2}}) and **Count Subset Sum** (counting instead of existence).

> Senior tip: Subset sum shows up in practice as splitting a bill within a group, packing orders into boxes, and anti-money-laundering (finding a set of transactions whose total matches a suspicious amount). In production with a large {{n}} you do not run the full DP: you approximate with sketches, or use meet-in-the-middle when {{n ~ 40}}.`,
    follow: [
      'How would you change the solution to return the actual subset instead of only true/false?',
      'If nums contained negative numbers, where exactly would the algorithm above go wrong?'
    ]
  },
  'algo-098': {
    prompt: `Given an array of positive integers {{nums}}. Return {{true}} if {{nums}} can be **partitioned** into two subsets whose sums are equal, otherwise {{false}}.

### Example
~~~text
Input: nums = [1, 5, 11, 5]
Output: true
Explanation: {1, 5, 5} and {11} — both sum to 11.

Input: nums = [1, 2, 3, 5]
Output: false
Explanation: the total is 11, an odd number, so it cannot be split in half.

Input: nums = [2, 2, 2, 2]
Output: true
Explanation: {2, 2} and {2, 2}.
~~~

### Constraints
- {{1 <= nums.length <= 100}}
- {{1 <= nums[i] <= 100}}`,
    hints: [
      'If the two halves are equal then each half must be exactly {{sum / 2}}. If {{sum}} is odd, reject immediately.',
      'The remaining problem: does any subset sum to {{sum / 2}}? That is exactly Subset Sum.',
      'Use a boolean array {{dp[s]}} and iterate downwards for each element — O(n * sum) time, O(sum) memory.'
    ],
    solution: `### Approach
Two equal subsets ⇔ each subset sums to {{sum / 2}}. If {{sum}} is odd → impossible. What is left is just **Subset Sum** with target {{sum / 2}}: a boolean array {{dp[s]}}, and for each {{x}} iterate {{s}} downwards with {{dp[s] = dp[s] || dp[s - x]}}.

~~~java
class Solution {
    public boolean canPartition(int[] nums) {
        int sum = 0;
        for (int x : nums) sum += x;
        if (sum % 2 != 0) return false;   // an odd total cannot be split in two
        int target = sum / 2;
        boolean[] dp = new boolean[target + 1];
        dp[0] = true;
        for (int x : nums) {
            for (int s = target; s >= x; s--) {
                dp[s] = dp[s] || dp[s - x];
            }
        }
        return dp[target];
    }
}
~~~

### Interview notes
- Check for an odd {{sum}} first: an early exit that avoids a wasted DP run.
- If {{nums.length <= 20}} (small {{n}}, large values): meet-in-the-middle O({{2^(n/2)}}) beats O({{n * sum}}) when {{sum}} is huge.
- Reconstructing one of the two subsets: store an extra bit or run a 2-D DP and walk backwards — interviewers sometimes ask for this part.

> Senior tip: Equal partition is the classic problem for testing whether you recognise "this is subset sum in disguise". A good candidate says immediately: odd total is out, everything else reduces to subset sum with target half. In production it is tied to load balancing such as "split N jobs into two groups with nearly equal run times" — NP-hard, so in practice you use a heuristic (greedy longest-processing-time-first) rather than running DP when {{sum}} is too large.`,
    follow: [
      'How would you go on to return one concrete partition?',
      'How does meet-in-the-middle work when n <= 40?'
    ]
  },
  'algo-099': {
    prompt: `Split an array of positive integers {{nums}} into two subsets {{S1}} and {{S2}} (every element must be assigned to exactly one subset). Return the smallest possible value of {{|sum(S1) - sum(S2)|}}.

### Example
~~~text
Input: nums = [1, 6, 11, 5]
Output: 1
Explanation: {6, 5} and {1, 11} → |11 - 12| = 1.

Input: nums = [1, 2, 3]
Output: 0
Explanation: {1, 2} and {3} → |3 - 3| = 0.

Input: nums = [1]
Output: 1
Explanation: {1} and {} → |1 - 0| = 1.
~~~

### Constraints
- {{1 <= nums.length <= 100}}
- {{1 <= nums[i] <= 100}}`,
    hints: [
      'Let {{s1 + s2 = sum}}. Then {{|s1 - s2| = |sum - 2 * s1|}} — the difference is smallest when {{s1}} is closest to {{sum / 2}}.',
      'Find the reachable sums with a Subset Sum DP (boolean array); you only need to consider up to {{sum / 2}}.',
      'Find the largest {{s}} ≤ {{sum / 2}} with {{dp[s]}} true; the answer is {{sum - 2 * s}}.'
    ],
    solution: `### Approach
{{|s1 - s2| = |sum - 2 * s1|}} → the difference is smallest when one subset sums as close as possible to {{sum / 2}}. Run the subset sum DP to learn which sums are reachable, then scan down from {{sum / 2}} to 0 for the largest reachable sum {{s}}; the answer is {{= sum - 2 * s}} (the gap between the two sides, always non-negative).

~~~java
class Solution {
    public int minSubsetDiff(int[] nums) {
        int sum = 0;
        for (int x : nums) sum += x;
        boolean[] dp = new boolean[sum / 2 + 1];
        dp[0] = true;
        for (int x : nums) {
            for (int s = sum / 2; s >= x; s--) {
                dp[s] = dp[s] || dp[s - x];
            }
        }
        // find the largest reachable sum s <= sum/2
        for (int s = sum / 2; s >= 0; s--) {
            if (dp[s]) return sum - 2 * s;   // sum - 2*s = |s - (sum - s)|
        }
        return sum;   // nothing but the empty subset is reachable
    }
}
~~~

### Interview notes
- Scan downwards from {{sum / 2}} so you find the **largest** reachable sum ≤ half — that makes the difference the smallest. Scanning upwards would pick a smaller sum and give a wrong (larger) result.
- The main problem is the same shape: if a partition exists the answer is 0 — Equal Subset Sum Partition is a special case.
- Negative numbers in {{nums}}? The formula {{sum - 2*s}} no longer holds directly; you need a DP over sums that can go negative (shift the indices).

> Senior tip: This is the "one-line variant" DP of subset sum — the value lies in the formula transformation {{|s1 - s2| = |sum - 2*s1|}} before you write any code. Real applications: splitting data into two batches for two workers so their run times are as close as possible, balancing partitions when sharding a database across two nodes. At large scale you go back to greedy + local search, no more DP.`,
    follow: [
      'If the two subsets must both be non-empty, which case needs special handling?',
      'Many elements but small values (n = 10^5, num <= 100) — what optimisation would you use?'
    ]
  },
  'algo-100': {
    prompt: `Given an array of positive integers {{nums}} and a number {{target}}. Count the **subsets** of {{nums}} whose sum is exactly {{target}}. Two equal elements at different positions are treated as different elements (counting by index).

### Example
~~~text
Input: nums = [1, 1, 2, 3], target = 4
Output: 3
Explanation: {1, 3} (choosing the first 1), {1, 3} (choosing the second 1), {1, 1, 2}.

Input: nums = [1, 2, 3], target = 3
Output: 2
Explanation: {3} and {1, 2}.

Input: nums = [1], target = 2
Output: 0
~~~

### Constraints
- {{0 <= nums.length <= 200}}
- {{1 <= nums[i] <= 100}}
- {{1 <= target <= 10^4}}`,
    hints: [
      'Like Subset Sum, but replace the boolean array with a **counting** array: {{dp[s]}} = the number of ways to make the sum {{s}}.',
      '{{dp[0] = 1}} — there is exactly one way to make the sum 0: choose no element.',
      'For each {{x}} iterate {{s}} downwards: {{dp[s] += dp[s - x]}} — every way of making {{s - x}} gives one new way of making {{s}} by adding {{x}}.'
    ],
    solution: `### Approach
1-D counting DP: {{dp[s]}} = the number of subsets that sum to {{s}}. {{dp[0] = 1}} (the empty subset). For each {{x}}, iterate {{s}} from {{target}} down to {{x}} and accumulate {{dp[s] += dp[s - x]}}. The downward iteration guarantees {{x}} takes part in each choice at most once.

~~~java
class Solution {
    public int countSubsets(int[] nums, int target) {
        int[] dp = new int[target + 1];
        dp[0] = 1;   // exactly one way to make the sum 0: choose nothing
        for (int x : nums) {
            for (int s = target; s >= x; s--) {
                dp[s] += dp[s - x];   // every new way of taking x adds to the ways of s - x
            }
        }
        return dp[target];
    }
}
~~~

### Interview notes
- Overflow: the number of ways can exceed {{int}} — ask the interviewer whether a modulo is needed (usually mod {{10^9 + 7}}); then use {{long}} and take the modulo on every addition.
- If the statement wants subsets **by value** ({1, 2} and {2, 1} counted once, two 1s treated as one) then the index-based DP over-counts — you need to sort and handle duplicate groups differently.
- {{target = 0}}: {{dp[0] = 1}} counts the empty subset too; some problem statements define "subset" as non-empty, in which case you must subtract 1.

> Senior tip: Count subset sum underlies "how many product combos fit a customer's budget" or "how many transaction sets match an anomaly pattern" in billing/AML. The interview value lies in recognising that **switching boolean to accumulation** is all it takes, and in proactively raising overflow/modulo — a sign you think about production rather than just solving the puzzle.`,
    follow: [
      'If the result must be modulo 10^9 + 7, how does the code change?',
      'How would you count the subsets whose sum lies in the range [lo, hi]?'
    ]
  }
});
