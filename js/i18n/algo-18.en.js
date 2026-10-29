/*
 * English translation of js/data/algo.js — task T439. Format: js/core/i18n.js (content overlay).
 * ids: algo-131 algo-132 algo-133 algo-134 algo-135 algo-136 algo-137
 */
App.i18n.content({
  'algo-131': {
    prompt: `Given a string {{s}}. Find the length of the longest **subsequence** that is a palindrome. A subsequence is built by **deleting** some characters (possibly none) while keeping the remaining characters in their original order, so it does **not need to be contiguous**.

### Example
~~~text
Input:  s = "bbbab"
Output: 4
Explanation: delete the "a" to get "bbbb".

Input:  s = "cbbd"
Output: 2
Explanation: "bb".
~~~

### Constraints
- {{1 <= s.length <= 1000}}
- {{s}} consists of lowercase English letters.`,
    hints: [
      'Let {{dp[i][j]}} = the length of the longest palindromic subsequence inside the range {{s[i..j]}}. The answer is {{dp[0][n-1]}}; a single character has {{dp[i][i] = 1}}.',
      'Look at the two ends {{s[i]}} and {{s[j]}}. If they are equal: both become the two outer ends of the palindrome → {{dp[i][j] = dp[i+1][j-1] + 2}}. If they differ: at least one end must be dropped → {{max(dp[i+1][j], dp[i][j-1])}}.',
      '{{dp[i][j]}} needs the shorter ranges inside it, so iterate {{i}} from n-1 **downwards** and {{j}} from i+1 **upwards**.'
    ],
    solution: `### Approach
Distinguish two concepts: a **substring** must be contiguous; a **subsequence** may skip characters. For a subsequence we decide at the two ends of the range:
- {{s[i] == s[j]}}: use both as the outermost pair, and take the best of the middle {{s[i+1..j-1]}} → {{dp[i+1][j-1] + 2}}.
- {{s[i] != s[j]}}: these two characters cannot both be the outermost pair, so drop one of them → {{max(dp[i+1][j], dp[i][j-1])}}.

~~~java
class Solution {
    public int longestPalindromeSubseq(String s) {
        int n = s.length();
        int[][] dp = new int[n][n];           // dp[i][j] = LPS of s[i..j]
        for (int i = n - 1; i >= 0; i--) {    // i decreases: dp[i+1][..] is ready
            dp[i][i] = 1;                     // a single character
            for (int j = i + 1; j < n; j++) { // j increases: dp[i][j-1] is ready
                if (s.charAt(i) == s.charAt(j)) {
                    dp[i][j] = dp[i + 1][j - 1] + 2;   // both ends form the pair
                } else {
                    dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]); // drop one end
                }
            }
        }
        return dp[0][n - 1];
    }
}
~~~
When {{j = i + 1}} and the two characters are equal, {{dp[i+1][j-1]}} is {{dp[i+1][i]}}: the "empty range" cell keeps its default value 0, so the result 2 is correct.

### Hand trace with "cbbd"
| | c | b | b | d |
|---|---|---|---|---|
| c | 1 | 1 | 2 | 2 |
| b | | 1 | 2 | 2 |
| b | | | 1 | 1 |
| d | | | | 1 |
Cell (1,2) "bb": both ends are equal → 0 + 2 = 2. Cell (0,3) "cbbd": c ≠ d → max(dp[1][3], dp[0][2]) = 2.

### Complexity
O(n²) time (n = 1000 → 5·10^5 cells), O(n²) memory (4 MB with int). It can be reduced to O(n) because row i only needs row i + 1.

### Interview notes
- Recognition trick: the LPS of s = the **LCS** (longest common subsequence) of s and the reverse of s.
- Do not confuse it with Longest Palindromic Substring (algo-128): a substring must be contiguous, so that one expands from the centre.
- A consequence that often gets asked: the minimum number of characters to delete to make s a palindrome = {{n - LPS}}.

> Senior tip: DP over a range {{[i..j]}} (interval DP) follows a common template: the state is a range, the decision is at the two ends, and you iterate by increasing length. Once you know this template, problems like Burst Balloons or Matrix Chain Multiplication no longer feel unfamiliar.`,
    follow: [
      'How do you trace the dp table to print the actual palindromic subsequence?',
      'How do you reduce the memory to O(n)?'
    ]
  },
  'algo-132': {
    prompt: `There are {{n}} gas stations arranged on a **circle**. Station {{i}} gives you {{gas[i]}} litres of gas; travelling from station {{i}} to station {{(i + 1) % n}} costs {{cost[i]}} litres. A car starts with an **empty** tank at a station of your choice, and the tank has no capacity limit. Return the index of the starting station that lets the car drive **one full lap** back to that station, or {{-1}} if it is impossible. The problem guarantees that if an answer exists it is **unique**.

### Example
~~~text
Input:  gas = [1,2,3,4,5], cost = [3,4,5,1,2]
Output: 3
Explanation: start at station 3: fill 4 litres, the trip costs 1 → 3 left; station 4: +5 = 8, the trip costs 2 → 6;
station 0: +1 = 7, costs 3 → 4; station 1: +2 = 6, costs 4 → 2; station 2: +3 = 5, costs 5 → 0. Back at station 3.

Input:  gas = [2,3,4], cost = [3,4,3]
Output: -1
Explanation: total gas 9 < total cost 10, no station can complete the lap.
~~~

### Constraints
- {{n == gas.length == cost.length}}
- {{1 <= n <= 10^5}}
- {{0 <= gas[i], cost[i] <= 10^4}}`,
    hints: [
      'If the total {{gas}} is less than the total {{cost}}, completing the lap is definitely impossible, no matter where you start.',
      'Suppose you start at station {{start}} and the tank goes negative for the first time when leaving station {{i}}. Prove it: starting at any station between {{start}} and {{i}} would also go negative, no later than {{i}}.',
      'So a single pass is enough: keep {{tank}}; when {{tank < 0}}, set {{start = i + 1}} and reset {{tank = 0}}. If the total gas ≥ the total cost, the final {{start}} is the answer.'
    ],
    solution: `### Approach
Let {{diff[i] = gas[i] - cost[i]}}: the amount of gas you "gain" (positive) or "lose" (negative) when passing station i.

**Observation 1:** if the sum of all {{diff}} < 0 then completing the lap is impossible, because the whole lap consumes more than the gas received.

**Observation 2 (the key):** start at {{start}} and drive until the tank goes negative for the first time at station {{i}}. No station {{k}} between {{start}} and {{i}} can be a valid starting point. Why? While driving from {{start}} to {{k}}, the tank is always ≥ 0 (it has not gone negative yet). Starting directly from {{k}} means throwing away that ≥ 0 amount of gas, so the tank can only be smaller or equal, and it will certainly go negative at {{i}} as well. Therefore we jump {{start}} straight to {{i + 1}}, without retrying the stations in between.

**Observation 3:** if the total ≥ 0, the final {{start}} certainly completes the lap: the part from {{start}} to the end of the array is non-negative, and the beginning of the array (the segments that "lost" gas) is covered by the positive total.

~~~java
class Solution {
    public int canCompleteCircuit(int[] gas, int[] cost) {
        int total = 0;  // sum of (gas - cost) over the whole lap
        int tank = 0;   // gas in the tank counted from the current starting point
        int start = 0;  // candidate starting point
        for (int i = 0; i < gas.length; i++) {
            int diff = gas[i] - cost[i];
            total += diff;
            tank += diff;
            if (tank < 0) {        // from start we cannot reach station i + 1
                start = i + 1;     // every station in [start, i] is eliminated
                tank = 0;          // restart with an empty tank
            }
        }
        return total < 0 ? -1 : start; // negative total: no answer
    }
}
~~~

### Hand trace with example 1
{{diff = [-2, -2, -2, 3, 3]}}, total = 0 ≥ 0.
- i = 0: tank = -2 < 0 → start = 1, tank = 0.
- i = 1: tank = -2 → start = 2, tank = 0.
- i = 2: tank = -2 → start = 3, tank = 0.
- i = 3: tank = 3. i = 4: tank = 6.
Result: start = 3.

### Complexity
One loop over n stations → O(n) time, O(1) memory. The naive "try every station and simulate the whole lap" approach is O(n²).

### Interview notes
- {{start}} may equal {{n}} after the loop (when the last station also goes negative), but in that case the total is certainly negative, so we have already returned {{-1}}.
- The maximum total is 10^5 × 10^4 = 10^9, which still fits in {{int}}; if the limits were larger, switch to {{long}}.
- State the two arguments explicitly (negative total → -1; skip the whole segment when the tank goes negative). Interviewers often ask "why are you allowed to skip the stations in between?".

> Senior tip: The "running sum, reset when negative" pattern appears in many problems (Kadane for Maximum Subarray works the same way). Recognising the same template helps you solve faster and explain more confidently.`,
    follow: [
      'If the problem did not guarantee a unique answer and you had to list every valid starting station, how would you do it in O(n)?',
      'If the tank had a maximum capacity C, how would the algorithm change?'
    ]
  },
  'algo-133': {
    prompt: `Given a string {{s}}. Split {{s}} into **as many parts as possible** so that each letter appears in **exactly one** part. Concatenating the parts in order must give back exactly {{s}}. Return the list of part lengths in order.

### Example
~~~text
Input:  s = "ababcbacadefegdehijhklij"
Output: [9, 7, 8]
Explanation: "ababcbaca" | "defegde" | "hijhklij".
The split "ababcbacadefegde" | "hijhklij" is also valid but has fewer parts.

Input:  s = "eccbbbbdec"
Output: [10]
~~~

### Constraints
- {{1 <= s.length <= 500}}
- {{s}} consists of lowercase English letters.`,
    hints: [
      'If letter {{c}} is inside a part, that part must extend to the **last occurrence** of {{c}}. Record the last position of every letter first.',
      'Scan from left to right, keeping {{end}} = the furthest position the current part is forced to reach. Every new character can push {{end}} further to the right.',
      'When the index {{i}} equals {{end}}, every letter in the part has had its last occurrence: close the part here (the earlier you close, the more parts you get).'
    ],
    solution: `### Approach
Each letter creates an "interval" from its first occurrence to its last. Two letters whose intervals overlap must sit in the same part. So the answer is simply: merge the overlapping intervals, and each merged block is one part.

A way to do it without creating the intervals explicitly:
1. One pass to store {{last[c]}} = the last index of letter {{c}}.
2. A second pass with {{start}} (the beginning of the current part) and {{end}} (how far the part must reach). On character {{s[i]}}, set {{end = max(end, last[s[i]])}}.
3. When {{i == end}}: no letter in the part appears further to the right → close the part, record the length {{end - start + 1}}, and start a new part at {{i + 1}}.

Why does greedily closing the part as early as possible give the **maximum number of parts**? The position {{end}} is the earliest point at which a valid part can be closed; closing later only merges more characters into the part and can never increase the number of parts.

~~~java
class Solution {
    public List<Integer> partitionLabels(String s) {
        int[] last = new int[26];                 // last[c] = last position of letter c
        for (int i = 0; i < s.length(); i++) {
            last[s.charAt(i) - 'a'] = i;
        }
        List<Integer> sizes = new ArrayList<>();
        int start = 0, end = 0;
        for (int i = 0; i < s.length(); i++) {
            end = Math.max(end, last[s.charAt(i) - 'a']); // the part must reach at least this far
            if (i == end) {                        // every letter in the part is finished
                sizes.add(end - start + 1);
                start = i + 1;                     // the next part starts right after
            }
        }
        return sizes;
    }
}
~~~

### Hand trace with s = "abaccbdeffed"
{{last}}: a=2, b=5, c=4, d=11, e=10, f=9.
- i=0 'a' → end=2; i=1 'b' → end=5; i=2..4 unchanged; i=5 'b', i == end → part [0..5] of length 6.
- i=6 'd' → end=11; ... i=11 == end → part [6..11] of length 6.
Result [6, 6].

### Complexity
Two passes → O(n) time. The 26-element {{last}} array → O(1) extra memory (not counting the result).

### Interview notes
- If the alphabet is not fixed (Unicode), use {{HashMap<Character, Integer>}} instead of the 26-element array.
- Connecting it to Merge Intervals is a plus: this is exactly interval merging, except that it exploits the fact that the intervals are already "sorted" by their starting position.

> Senior tip: The "precompute the last occurrence" technique is also used when batching data so that records with the same key are not split across two batches (for example when splitting a log file by session).`,
    follow: [
      'If you added the condition that each part is at most K characters long (and a solution may not exist), how would you handle it?',
      'If the string is a very long stream that cannot be re-read, can it still be done in a single pass?'
    ]
  },
  'algo-134': {
    prompt: `There are many balloons stuck on a flat wall. Balloon {{i}} is described by the horizontal segment {{points[i] = [xStart, xEnd]}}. An arrow shot straight up at abscissa {{x}} bursts **every** balloon with {{xStart <= x <= xEnd}} (touching the exact edge counts). Find the **minimum number of arrows** needed to burst all the balloons.

### Example
~~~text
Input:  points = [[10,16],[2,8],[1,6],[7,12]]
Output: 2
Explanation: shoot at x = 6 to burst [2,8] and [1,6]; shoot at x = 11 to burst [10,16] and [7,12].

Input:  points = [[1,2],[3,4],[5,6],[7,8]]
Output: 4

Input:  points = [[1,2],[2,3],[3,4],[4,5]]
Output: 2
Explanation: shoot at x = 2 (bursts [1,2],[2,3]) and x = 4 (bursts [3,4],[4,5]).
~~~

### Constraints
- {{1 <= points.length <= 10^5}}
- {{points[i].length == 2}}
- {{-2^31 <= xStart < xEnd <= 2^31 - 1}}`,
    hints: [
      'Consider the balloon with the **smallest right edge**. There must be an arrow shot at a position ≤ that right edge. Where is the most beneficial place to shoot?',
      'Shoot exactly at that right edge: the arrow still bursts this balloon, and it is as far to the right as possible, so it can hit the most other balloons.',
      'Sort by increasing {{xEnd}}. Keep the position of the last arrow; if the next balloon has {{xStart}} greater than that position, it needs a new arrow. Watch out for overflow when comparing.'
    ],
    solution: `### Approach
Greedy on the right edges:
1. Sort the balloons by increasing {{xEnd}}.
2. Shoot the first arrow at the {{xEnd}} of the first balloon.
3. Go through the remaining balloons. If {{xStart <= arrow}}, this balloon is already burst (its {{xEnd}} is ≥ {{arrow}} thanks to the sort, so {{arrow}} lies inside the segment). Otherwise it needs a new arrow at its own {{xEnd}}.

**Why is this correct?** The balloon with the smallest right edge must be shot at some point ≤ its right edge. Pushing the shooting point as far right as possible (exactly to the right edge) loses none of the balloons the old arrow hit, and can only hit more. Repeat the argument for the remaining part.

~~~java
class Solution {
    public int findMinArrowShots(int[][] points) {
        if (points.length == 0) return 0;
        // Integer.compare: do NOT use a[1] - b[1], it can overflow near +-2^31
        Arrays.sort(points, (a, b) -> Integer.compare(a[1], b[1]));
        int arrows = 1;
        int arrowX = points[0][1];        // shoot at the right edge of the first balloon
        for (int i = 1; i < points.length; i++) {
            if (points[i][0] > arrowX) {  // the old arrow lies to the left of this balloon
                arrows++;
                arrowX = points[i][1];    // shoot a new arrow at this balloon's right edge
            }
            // otherwise: xStart <= arrowX <= xEnd, the balloon is already burst
        }
        return arrows;
    }
}
~~~

### Hand trace with example 1
After sorting by {{xEnd}}: [1,6], [2,8], [7,12], [10,16].
- Arrow 1 at x = 6. [2,8]: 2 ≤ 6 → burst. [7,12]: 7 > 6 → arrow 2 at 12. [10,16]: 10 ≤ 12 → burst.
Result 2.

### Complexity
Sorting O(n log n), scan O(n). Memory O(log n) for the sort (TimSort on an object array can reach O(n)).

### Interview notes
- **Overflow trap:** the comparator {{a[1] - b[1]}} is wrong when one value is near {{2^31 - 1}} and the other near {{-2^31}} (the difference exceeds the int range and flips sign). Always use {{Integer.compare}}.
- Balloons that touch at the edge ({{[1,2]}} and {{[2,3]}}) are burst by a single arrow, so the condition is {{>}} and not {{>=}}.
- This problem is equivalent to "the minimum number of points that stab every segment", a relative of Non-overlapping Intervals: the number of arrows = the maximum number of pairwise non-overlapping segments.

> Senior tip: Comparators of the form {{a - b}} have caused real production bugs when the data were timestamps or large IDs. Code review should catch this immediately.`,
    follow: [
      'How would you return the list of arrow coordinates instead of just the count?',
      'How does this problem relate to Non-overlapping Intervals?'
    ]
  },
  'algo-135': {
    prompt: `Place {{n}} queens on an {{n x n}} chessboard so that no two queens can attack each other (a queen attacks along its row, its column and both diagonals). Return **all** placements; each placement is a list of {{n}} strings, where string i describes row i with {{'Q'}} for a queen and {{'.'}} for an empty square. The order of the placements does not matter.

### Example
~~~text
Input:  n = 4
Output: [[".Q..",     [["..Q.",
          "...Q",       "Q...",
          "Q...",       "...Q",
          "..Q."],      ".Q.."]]
Explanation: a 4x4 board has exactly 2 placements.

Input:  n = 1
Output: [["Q"]]
~~~

### Constraints
- {{1 <= n <= 9}}`,
    hints: [
      'Every row holds **exactly one** queen (two queens in the same row would attack each other). So place the queens row by row, choosing one column per row.',
      'To know whether square {{(row, col)}} is attacked in O(1): mark the used columns; the "\\" diagonal has a constant {{row - col}}; the "/" diagonal has a constant {{row + col}}.',
      'Use three boolean arrays {{cols[n]}}, {{diag[2n-1]}} (index {{row - col + n - 1}} so it is never negative), {{anti[2n-1]}} (index {{row + col}}). Place a queen → mark → recurse into the next row → unmark.'
    ],
    solution: `### Approach
Backtracking row by row: at row {{row}}, try every column {{col}}. If the square is safe, place a queen, mark it, then handle row {{row + 1}}. After n rows we have a complete solution. When backtracking we unmark so another column can be tried.

**Recognising the diagonals in O(1):**
~~~text
row - col ("\\" diagonal)     row + col ("/" diagonal)
 0 -1 -2 -3                 0  1  2  3
 1  0 -1 -2                 1  2  3  4
 2  1  0 -1                 2  3  4  5
 3  2  1  0                 3  4  5  6
~~~
All squares on the same "\\" diagonal share the same {{row - col}}; add {{n - 1}} so the index is never negative. All squares on the same "/" diagonal share the same {{row + col}}.

~~~java
class Solution {
    private int n;
    private boolean[] cols, diag, anti;     // column / "\\" diagonal / "/" diagonal occupied
    private int[] queenCol;                 // queenCol[row] = column of the queen in row row
    private List<List<String>> result;

    public List<List<String>> solveNQueens(int n) {
        this.n = n;
        cols = new boolean[n];
        diag = new boolean[2 * n - 1];
        anti = new boolean[2 * n - 1];
        queenCol = new int[n];
        result = new ArrayList<>();
        place(0);
        return result;
    }

    private void place(int row) {
        if (row == n) {                     // all n queens placed
            result.add(board());
            return;
        }
        for (int col = 0; col < n; col++) {
            int d = row - col + n - 1, a = row + col;
            if (cols[col] || diag[d] || anti[a]) continue; // attacked square: prune
            cols[col] = diag[d] = anti[a] = true;          // place the queen
            queenCol[row] = col;
            place(row + 1);
            cols[col] = diag[d] = anti[a] = false;         // remove the queen (backtrack)
        }
    }

    private List<String> board() {
        List<String> rows = new ArrayList<>();
        for (int r = 0; r < n; r++) {
            char[] line = new char[n];
            Arrays.fill(line, '.');
            line[queenCol[r]] = 'Q';
            rows.add(new String(line));
        }
        return rows;
    }
}
~~~

### Complexity
- Time: the first row has n choices, the following rows at most n - 1... → upper bound O(n!), in practice much smaller thanks to diagonal pruning. Each solution costs an extra O(n²) to build the board.
- Memory: O(n) for the marker arrays and the recursion (not counting the result).

### Interview notes
- Number of solutions: n = 1 → 1, 2 and 3 → 0, 4 → 2, 5 → 10, 6 → 4, 8 → 92, 9 → 352.
- N-Queens II only needs the **count**: drop the board-building part; you can also use bitmasks for all three sets to go even faster.
- Do not represent the board as a 2D array and scan row/column/diagonal on every check: that costs O(n) per check instead of O(1).

> Senior tip: N-Queens is the model problem for "constraint satisfaction": choose a variable (the row), a domain (the columns), O(1) constraint checks and early pruning. The same template applies to scheduling, shift assignment or solving Sudoku.`,
    follow: [
      'If you only needed to count the solutions (N-Queens II), how would you optimise it with bitmasks?',
      'How can you exploit the symmetry of the board to halve the running time?'
    ]
  },
  'algo-136': {
    prompt: `Given a character grid {{board}} of size {{m x n}} and a string {{word}}. Determine whether {{word}} can be formed from **edge-adjacent** cells in sequence (up/down/left/right), using each cell **at most once** in a single match.

### Example
~~~text
board = [["A","B","C","E"],
         ["S","F","C","S"],
         ["A","D","E","E"]]

word = "ABCCED" → true   (A → B → C → C → E → D)
word = "SEE"    → true
word = "ABCB"   → false  (going back to "B" would use that cell twice)
~~~

### Constraints
- {{1 <= m, n <= 6}}
- {{1 <= word.length <= 15}}
- {{board}} and {{word}} consist of English letters only (case-sensitive).`,
    hints: [
      'Try starting from every cell. From one cell, DFS into the 4 adjacent cells to match the next character of {{word}}.',
      'The function {{dfs(r, c, k)}}: cell {{(r, c)}} must match {{word[k]}}. If {{k}} is the last character → found. Otherwise try the 4 directions with {{k + 1}}.',
      "To avoid reusing a cell on the **current path**, temporarily overwrite the cell with a special character (for example {{'#'}}) before moving on, and **restore** the old character when backtracking, so other paths can still use that cell."
    ],
    solution: `### Approach
Backtracking (DFS with undo) on the grid:
1. For each cell of the board, try whether {{word}} can start there.
2. {{dfs(r, c, k)}}: check that the cell is inside the board and {{board[r][c] == word[k]}}. If not → false.
3. If {{k == word.length() - 1}} → the whole word matched → true.
4. Mark the cell with {{'#'}}, try the 4 directions with {{k + 1}}, then **restore** the original character.

Why must we restore? A marked cell is only "busy" for the **current path**. When we backtrack to try another branch (or another starting point), that cell becomes valid again.

~~~java
class Solution {
    private static final int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    public boolean exist(char[][] board, String word) {
        for (int r = 0; r < board.length; r++)
            for (int c = 0; c < board[0].length; c++)
                if (dfs(board, word, r, c, 0)) return true;  // try every starting point
        return false;
    }

    // does cell (r, c) match word[k], and can the rest be matched from there
    private boolean dfs(char[][] board, String word, int r, int c, int k) {
        if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) return false;
        if (board[r][c] != word.charAt(k)) return false;  // character mismatch (or the cell is busy '#')
        if (k == word.length() - 1) return true;          // the last character matched
        char saved = board[r][c];
        board[r][c] = '#';                                 // mark: the cell is on the current path
        boolean found = false;
        for (int[] d : DIRS) {
            if (dfs(board, word, r + d[0], c + d[1], k + 1)) { found = true; break; }
        }
        board[r][c] = saved;                               // restore for the other branches
        return found;
    }
}
~~~

### Complexity
- There are m·n starting points; from each one the first step has 4 directions and later steps at most 3 (you do not go back to the cell you just left) → O(m·n·3^L) with L = the length of {{word}}.
- Memory O(L) for the recursion (marking in place, no {{visited}} array needed).

### Interview notes
- Restore the cell **before returning**, even when the word was found, so the caller's {{board}} is not corrupted.
- A pruning step that earns praise: if {{word}} is longer than {{m·n}}, or the board does not contain enough copies of some character in {{word}} → false immediately. You can reverse {{word}} if its last character is rarer than the first, to reduce the number of starting points.
- To search for **many** words at once, switch to Word Search II (algo-114) with a Trie.

> Senior tip: The "mark temporarily, restore on backtracking" technique saves memory but mutates shared data, so it is not safe when several threads read {{board}} concurrently. In multi-threaded code, use a separate {{visited}} array for each search.`,
    follow: [
      'If you needed to search for many words at once, why should you use a Trie (Word Search II)?',
      'Which pruning tricks help avoid the worst case, such as a board full of the letter A and word = "AAAAAAAAAAAAAB"?'
    ]
  },
  'algo-137': {
    prompt: `Given a string {{s}}. List **every** way to cut {{s}} into contiguous parts such that each part is a palindrome. The order of the ways in the result does not matter.

### Example
~~~text
Input:  s = "aab"
Output: [["a","a","b"], ["aa","b"]]

Input:  s = "a"
Output: [["a"]]

Input:  s = "aba"
Output: [["a","b","a"], ["aba"]]
~~~

### Constraints
- {{1 <= s.length <= 16}}
- {{s}} consists of lowercase English letters.`,
    hints: [
      'Standing at position {{start}}, the next part is {{s[start..end]}} with {{end}} running from {{start}} to the end. Only continue when that part is a palindrome.',
      'Write a recursive function {{backtrack(start, path)}}: add the part to {{path}}, recurse from {{end + 1}}, then **remove the part just added** to try a different {{end}}.',
      'When {{start == s.length()}}, {{path}} is a complete cut: add a **copy** of {{path}} to the result.'
    ],
    solution: `### Approach
Picture a decision tree: at each step we choose "how long the next part is". Every path from the root to a leaf (the whole string consumed) is one way to cut. Backtracking is simply walking that tree with recursion, **cutting off** a branch as soon as the chosen part is not a palindrome.

The tree for {{"aab"}}:
~~~text
start=0: "a" ✔ → start=1: "a" ✔ → start=2: "b" ✔ → end of string: [a,a,b]
                           "ab" ✘ (branch cut)
         "aa" ✔ → start=2: "b" ✔ → end of string: [aa,b]
         "aab" ✘ (branch cut)
~~~

~~~java
class Solution {
    public List<List<String>> partition(String s) {
        List<List<String>> result = new ArrayList<>();
        backtrack(s, 0, new ArrayList<>(), result);
        return result;
    }

    // path = the parts already chosen for s[0..start-1]
    private void backtrack(String s, int start, List<String> path, List<List<String>> result) {
        if (start == s.length()) {              // the whole string has been cut
            result.add(new ArrayList<>(path));  // MUST copy: path keeps being modified
            return;
        }
        for (int end = start; end < s.length(); end++) {
            if (!isPalindrome(s, start, end)) continue; // prune invalid branches
            path.add(s.substring(start, end + 1));      // choose the part s[start..end]
            backtrack(s, end + 1, path, result);        // cut the rest
            path.remove(path.size() - 1);               // undo the choice to try another end
        }
    }

    private boolean isPalindrome(String s, int left, int right) {
        while (left < right) {
            if (s.charAt(left++) != s.charAt(right--)) return false;
        }
        return true;
    }
}
~~~

### Why must path be copied?
{{path}} is **one** List object shared throughout the recursion. If you call {{result.add(path)}} directly, every element of {{result}} points to the same list, and that list ends up empty (everything was {{remove}}d). {{new ArrayList<>(path)}} snapshots the state at that moment.

### Complexity
- A string of length n has n-1 possible cut points → at most {{2^(n-1)}} ways to cut (for example "aaaa...a"). Each way costs O(n) to copy and to check palindromes → O(n · 2^n).
- Recursion memory O(n) (not counting the result).

### Interview notes
- Optimisation: precompute the {{isPal[i][j]}} table with DP (O(n²)) so each check is O(1). With n ≤ 16 the simple version is fast enough, but you should mention it.
- If you only need the **minimum number of cuts**, that is a different problem (Palindrome Partitioning II), solved with O(n²) DP, with no listing needed.

> Senior tip: When the output can grow exponentially, ask again what is really needed: to list, to count, or just one solution? The answer usually decides the algorithm.`,
    follow: [
      'If you only needed to count the number of ways to cut, is there a faster way than listing them?',
      'How do you precompute the isPal table with DP, and how much time does it save?'
    ]
  }
});
