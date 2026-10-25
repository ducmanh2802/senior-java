/*
 * English translation of js/data/algo.js — task T241. Format: js/core/i18n.js (content overlay).
 * ids: algo-035 algo-036 algo-037 algo-038 algo-039 algo-040 algo-041
 */
App.i18n.content({
  'algo-035': {
    prompt: `You are climbing a staircase with {{n}} steps. Each time you can climb either 1 or 2 steps. In how many distinct ways can you reach the top?

### Example
~~~text
Input:  n = 2
Output: 2
Explanation: 1+1 or 2.

Input:  n = 3
Output: 3
Explanation: 1+1+1, 1+2, 2+1.
~~~

### Constraints
- {{1 <= n <= 45}}`,
    hints: [
      'To reach step {{n}}, the last move could be from step {{n-1}} (climbing 1) or step {{n-2}} (climbing 2).',
      'Thus, the number of ways is the sum of ways to reach the two previous steps — the Fibonacci sequence.',
      'No DP array needed; just keep the two most recent values.'
    ],
    solution: `### Idea
Let {{f(n)}} be the number of ways to reach step {{n}}. We have {{f(n) = f(n-1) + f(n-2)}}, with {{f(0) = 1}} and {{f(1) = 1}}. Use two variables for iterative calculation to save memory.

~~~java
class Solution {
    public int climbStairs(int n) {
        int prev = 1;   // f(0)
        int cur = 1;    // f(1)
        for (int i = 2; i <= n; i++) {
            int next = prev + cur;
            prev = cur;
            cur = next;
        }
        return cur;
    }
}
~~~

### Interview notes
- With {{n = 45}}, the result fits in {{int}}; if {{n}} is larger, use {{long}} or BigInteger.
- Can be solved using an O(n) DP array, but the two-variable approach demonstrates better memory optimization.
- Ask back: if you could climb 1, 2, or 3 steps, how would the formula change? Sum of the three previous values.

> Senior tip: This is the gateway to DP. A point I often follow up with is "what if n = 10^9?" — the answer is using matrix exponentiation or Binet's formula, but you need to handle large numbers and precision.`,
    follow: [
      'If you can climb 1, 2, or 3 steps, how would you modify it?',
      'How to compute for very large n using matrix exponentiation?'
    ]
  },
  'algo-036': {
    prompt: `Given a sorted array of distinct integers {{nums}} and a target value {{target}}, return the index if the target is found. If not, return the index where it would be if it were inserted in order.

### Example
~~~text
Input:  nums = [1,3,5,6], target = 5
Output: 2

Input:  nums = [1,3,5,6], target = 2
Output: 1

Input:  nums = [1,3,5,6], target = 7
Output: 4
~~~

### Constraints
- {{1 <= nums.length <= 10^4}}
- {{-10^4 <= nums[i], target <= 10^4}}
- All elements are distinct and sorted.`,
    hints: [
      'This is essentially a lower bound search: find the first position with a value greater than or equal to the target.',
      'Use binary search on the half-open range {{[lo, hi)}} with {{hi = nums.length}}.',
      'When {{nums[mid] < target}}, the answer must be to the right; otherwise, narrow the range to the left.'
    ],
    solution: `### Idea
Find the first position where {{nums[pos] >= target}}. If the target is greater than all elements, the position is {{nums.length}} — which is correct for inserting at the end.

Use the half-open range {{[lo, hi)}}: {{hi}} is initially {{nums.length}}, the loop runs while {{lo < hi}}, and {{hi = mid}} is used when narrowing.

~~~java
class Solution {
    public int searchInsert(int[] nums, int target) {
        int lo = 0, hi = nums.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] < target) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        return lo;   // lower bound
    }
}
~~~

### Interview notes
- The result is correct for all three cases: found, not found in the middle, and greater than all elements.
- Do not use {{hi = nums.length - 1}} with a half-open range; if using a closed range, you must adjust the condition and update logic.
- This is the foundation for implementing {{lower_bound}}/{{ceiling}} in range search or sorted insertion tasks.

> Senior tip: In production, lower bound appears when searching time buckets, selecting Kafka partitions, or inserting into sorted configuration lists. Remember the half-open convention to avoid errors when the target is larger than the entire array.`,
    follow: [
      'How to find the upper bound (first element greater than target)?',
      'If the array has duplicate elements, how would the result change?'
    ]
  },
  'algo-037': {
    prompt: `Given an array {{coins}} representing coin denominations (unlimited supply) and an amount {{amount}}, return the fewest number of coins needed to make up that amount, or -1 if impossible.

### Example
~~~text
Input:  coins = [1,2,5], amount = 11
Output: 3
Explanation: 5 + 5 + 1.

Input:  coins = [2], amount = 3
Output: -1

Input:  coins = [1], amount = 0
Output: 0
~~~

### Constraints
- {{1 <= coins.length <= 12}}
- {{1 <= coins[i] <= 2^31 - 1}}
- {{0 <= amount <= 10^4}}`,
    hints: [
      'Greedy doesn\'t work for all coin sets. You need to consider all ways to form smaller amounts.',
      'Let {{dp[x]}} be the minimum coins to make amount x. {{dp[0] = 0}}.',
      'For each x, try every coin c <= x: {{dp[x] = min(dp[x], dp[x-c] + 1)}}.'
    ],
    solution: `### Idea
Use DP from 0 to {{amount}}. For each amount, try every coin and take the method requiring the fewest coins. Use a sentinel value larger than {{amount}} to represent "impossible".

Complexity: O(amount * number of coins), memory O(amount).

~~~java
class Solution {
    public int coinChange(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);   // sentinel: impossible
        dp[0] = 0;
        for (int x = 1; x <= amount; x++) {
            for (int c : coins) {
                if (c <= x) {
                    dp[x] = Math.min(dp[x], dp[x - c] + 1);
                }
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
}
~~~

### Interview notes
- The sentinel must be larger than {{amount}}; if using {{Integer.MAX_VALUE}}, {{+1}} might overflow.
- The order of the two loops does not affect the minimum coin count, but it would affect counting the number of combinations (where avoiding permutations is necessary).
- Greedy is only correct for certain denomination systems (like 1, 5, 10, 25 under certain conditions), not in general.

> Senior tip: This is a basic unbounded knapsack problem. In real-world currency calculations, there are often constraints on the quantity of each denomination and transaction fees; that requires DP with a quantity dimension or linear integer programming optimization.`,
    follow: [
      'How would you modify this to count the number of ways to form the amount?',
      'What if each denomination had a limited supply?'
    ]
  },
  'algo-038': {
    prompt: `Given an integer array {{nums}}, return the length of the longest strictly increasing subsequence. A subsequence is not necessarily contiguous but maintains relative order.

### Example
~~~text
Input:  nums = [10,9,2,5,3,7,101,18]
Output: 4
Explanation: [2,3,7,101] or [2,5,7,18].

Input:  nums = [7,7,7,7]
Output: 1
~~~

### Constraints
- {{1 <= nums.length <= 2500}}
- {{-10^4 <= nums[i] <= 10^4}}`,
    hints: [
      'O(n²) DP: for each i, check all j < i and append if nums[j] < nums[i].',
      'There is an O(n log n) approach: maintain a {{tails}} array where {{tails[k]}} is the smallest tail of all increasing subsequences of length {{k+1}}.',
      'For each element, binary search for the first position in {{tails}} >= element and replace; if it exceeds the end, extend.'
    ],
    solution: `### Idea
Use patience sorting. The {{tails}} array stores the smallest tail element for each length. For each {{x}}, find the first position {{pos}} where {{tails[pos] >= x}} and set {{tails[pos] = x}}. If {{pos == len}}, increment the length.

Note: {{tails}} is not the actual subsequence, only used to calculate the length.

~~~java
class Solution {
    public int lengthOfLIS(int[] nums) {
        int[] tails = new int[nums.length];
        int len = 0;
        for (int x : nums) {
            int lo = 0, hi = len;
            while (lo < hi) {
                int mid = lo + (hi - lo) / 2;
                if (tails[mid] < x) {
                    lo = mid + 1;
                } else {
                    hi = mid;
                }
            }
            tails[lo] = x;
            if (lo == len) len++;
        }
        return len;
    }
}
~~~

### Interview notes
- Use {{<}} to find the lower bound for a strictly increasing sequence; for non-decreasing, use the upper bound.
- If you need to return the actual subsequence, you must store parents/indices — {{tails}} array is insufficient.
- O(n²) DP is easier to understand and necessary if the problem requires more complex constraints.

> Senior tip: In problems finding the longest increasing sequence of versions/deploys, O(n log n) is critical because logs can have millions of entries. Remember tails is just a tool to compute the length; don\'t try to print it as the answer.`,
    follow: [
      'Implement the O(n²) DP approach and compare.',
      'How to retrieve the actual longest increasing subsequence?'
    ]
  },
  'algo-039': {
    prompt: `Given two strings {{word1}} and {{word2}}, return the minimum number of operations to transform {{word1}} to {{word2}}, using three operations: insert a character, delete a character, replace a character.

### Example
~~~text
Input:  word1 = "horse", word2 = "ros"
Output: 3
Explanation: horse -> rorse (replace h with r) -> rose (delete r) -> ros (delete e).

Input:  word1 = "intention", word2 = "execution"
Output: 5
~~~

### Constraints
- {{0 <= word1.length, word2.length <= 500}}
- Both strings consist of English lowercase letters.`,
    hints: [
      'Examine the prefixes of both strings. If the last characters match, no operation is needed for that pair.',
      'If they differ, the last operation is insertion, deletion, or replacement — each corresponds to a subproblem.',
      'Define {{dp[i][j]}} as the cost to transform the first i characters of {{word1}} into the first j characters of {{word2}}.'
    ],
    solution: `### Idea
Two-dimensional DP. {{dp[i][j]}} is the minimum operations to transform {{word1[0..i)}} into {{word2[0..j)}}.

- If the last characters are equal: {{dp[i][j] = dp[i-1][j-1]}}.
- Otherwise: {{1 + min(delete {{dp[i-1][j]}}, insert {{dp[i][j-1]}}, replace {{dp[i-1][j-1]}})}}.

Base case: transforming an empty string to j characters takes j insertions; conversely, it takes i deletions.

~~~java
class Solution {
    public int minDistance(String word1, String word2) {
        int m = word1.length(), n = word2.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 0; i <= m; i++) dp[i][0] = i;
        for (int j = 0; j <= n; j++) dp[0][j] = j;
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (word1.charAt(i - 1) == word2.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    int replace = dp[i - 1][j - 1];
                    int delete = dp[i - 1][j];
                    int insert = dp[i][j - 1];
                    dp[i][j] = 1 + Math.min(replace, Math.min(delete, insert));
                }
            }
        }
        return dp[m][n];
    }
}
~~~

### Interview notes
- You can reduce memory to O(n) using two rows; mention this if asked for optimization.
- If character transposition (Damerau-Levenshtein) is allowed, the formula needs an additional case.
- With Unicode, {{charAt}} by code unit may be incorrect for emojis; use code points if precision is required.

> Senior tip: Edit distance is the foundation of fuzzy matching, spell checkers, and diff algorithms. In production, for very long strings, one uses banded DP to reduce from O(mn) to near O(k * min(m, n)).`,
    follow: [
      'How to optimize memory to O(n)?',
      'If you only need to check if distance <= k, how to optimize?'
    ]
  },
  'algo-040': {
    prompt: `Given an integer array {{nums}} of distinct integers, return all possible subsets (power set). The solution set must not contain duplicate subsets. The result can be in any order.

### Example
~~~text
Input:  nums = [1,2,3]
Output: [[], [1], [2], [3], [1,2], [1,3], [2,3], [1,2,3]]
~~~

### Constraints
- {{1 <= nums.length <= 10}}
- {{-10 <= nums[i] <= 10}}
- All elements are distinct.`,
    hints: [
      'Each element has two choices: included in the subset or not. Total 2^n subsets.',
      'Iterate by index; at each step, decide whether to include or exclude the current element.',
      'Backtracking can be used with the current path; every state is a valid subset, so record it immediately upon entering the function.'
    ],
    solution: `### Idea
Backtracking by starting index. Each time the function is called, the current path is a valid subset, so add a copy to the result. Then try adding each element from {{start}} onwards, recurse, then remove.

The decision tree has 2^n leaves; each subset is copied when recorded, so the total cost is O(n * 2^n).

~~~java
class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        backtrack(0, new ArrayList<>(), nums, result);
        return result;
    }

    private void backtrack(int start, List<Integer> path, int[] nums,
                           List<List<Integer>> result) {
        result.add(new ArrayList<>(path));   // every state is valid
        for (int i = start; i < nums.length; i++) {
            path.add(nums[i]);
            backtrack(i + 1, path, nums, result);
            path.remove(path.size() - 1);
        }
    }
}
~~~

### Interview notes
- Must copy {{new ArrayList<>(path)}} when recording; if added directly, all elements would point to the same list and be modified.
- If the array has duplicate elements, sort and skip duplicate branches at the same level.
- Can be solved using a bitmask from 0 to {{(1 << n) - 1}}; both approaches are fine for {{n <= 10}}.

> Senior tip: This is the template for learning "backtracking". When encountering combination problems, clearly define: when to record the state, what the start parameter is, and the pruning condition. Those three questions decide if the code is correct.`,
    follow: [
      'If {{nums}} has duplicate elements, how would you modify this?',
      'How to generate subsets with a specific sum (target sum)?'
    ]
  },
  'algo-041': {
    prompt: `Given an array {{nums}} of distinct integers, return all possible permutations. The result can be in any order.

### Example
~~~text
Input:  nums = [1,2,3]
Output: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
~~~

### Constraints
- {{1 <= nums.length <= 6}}
- {{-10 <= nums[i] <= 10}}
- All elements are distinct.`,
    hints: [
      'Each position in the permutation needs to select an unused element.',
      'Use a {{used}} array to mark elements included in the current path.',
      'When the path length equals n, record it; otherwise, try all unused elements.'
    ],
    solution: `### Idea
Backtracking with a {{used}} array. At each step, try all unused elements, add to the path, recurse, then undo. When the path has {{n}} elements, it is a permutation.

There are {{n!}} permutations; copying each permutation is O(n).

~~~java
class Solution {
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        boolean[] used = new boolean[nums.length];
        backtrack(new ArrayList<>(), nums, used, result);
        return result;
    }

    private void backtrack(List<Integer> path, int[] nums, boolean[] used,
                           List<List<Integer>> result) {
        if (path.size() == nums.length) {
            result.add(new ArrayList<>(path));
            return;
        }
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            path.add(nums[i]);
            backtrack(path, nums, used, result);
            path.remove(path.size() - 1);
            used[i] = false;
        }
    }
}
~~~

### Interview notes
- If there are duplicate elements, sort and skip duplicate unused elements at the same level: {{i > 0 && nums[i] == nums[i - 1] && !used[i - 1]}}.
- Can be performed in-place by swapping, saving the {{used}} array but making duplicate handling harder.
- As n increases, the number of permutations explodes; ask if all need to be generated or just traversed in order.

> Senior tip: For small scheduling problems, permutations + constraint checking is a quick way to prototype. But in production, n > 10 is almost impossible to traverse fully; switch to heuristics or bitmask DP.`,
    follow: [
      'How to handle permutations with duplicate elements?',
      'How to generate the k-th permutation in lexicographical order?'
    ]
  }
});
