/*
 * English translation of js/data/algo.js — task T438. Format: js/core/i18n.js (content overlay).
 * ids: algo-118 algo-119 algo-120 algo-121 algo-122 algo-123 algo-124 algo-125 algo-126 algo-127 algo-128 algo-129 algo-130
 */
App.i18n.content({
  'algo-118': {
    prompt: `Given a list {{accounts}} where each element has the form {{[name, email1, email2, ...]}}. Two accounts that **share at least one email** definitely belong to the same person (and in that case their names are the same too). Note that this relation is **transitive**: if A shares an email with B and B shares an email with C, then A, B and C are the same person. Two accounts with the same name but no email connection may be two different people. Merge the accounts of the same person; each resulting account has the form {{[name, the emails **sorted in ascending order** with no duplicates]}}. The order of the accounts in the result does not matter.

### Example
~~~text
Input:  accounts = [["John","johnsmith@mail.com","john_newyork@mail.com"],
                    ["John","johnsmith@mail.com","john00@mail.com"],
                    ["Mary","mary@mail.com"],
                    ["John","johnnybravo@mail.com"]]
Output: [["John","john00@mail.com","john_newyork@mail.com","johnsmith@mail.com"],
         ["Mary","mary@mail.com"],
         ["John","johnnybravo@mail.com"]]
Explanation: the first two John accounts share johnsmith@mail.com so they merge. The last John is a different person.
~~~

### Constraints
- {{1 <= accounts.length <= 1000}}, {{2 <= accounts[i].length <= 10}}
- Every email is valid, at most 30 characters long.`,
    hints: [
      'Treat each **email** as a vertex. Inside one account every email belongs to the same person → connect them to each other (you only need to connect the first email with each of the remaining ones).',
      'Union-Find over the email strings ({{Map<String, String> parent}}) groups the emails. Each final group is one person.',
      'Remember the name per email ({{Map<String, String> emailToName}}). Group the emails by the root of their group, use {{TreeSet}} to sort and deduplicate at the same time, then prepend the name.'
    ],
    solution: `### Approach
"Same email means same person" plus the transitive relation is exactly **the connected components** of a graph whose vertices are emails. Union-Find finds connected components very neatly:
1. For each account: every email is an element of the Union-Find; connect the first email with the remaining emails. Record {{emailToName}}.
2. After processing everything, two emails with the same root ({{find}}) ⇔ the same person.
3. Group the emails by root into a {{TreeSet}} (sorts and deduplicates automatically). Each group becomes one account: name + list of emails.

~~~java
class Solution {
    private final Map<String, String> parent = new HashMap<>();

    public List<List<String>> accountsMerge(List<List<String>> accounts) {
        Map<String, String> emailToName = new HashMap<>();
        for (List<String> acc : accounts) {
            String name = acc.get(0), first = acc.get(1);
            for (int i = 1; i < acc.size(); i++) {
                String email = acc.get(i);
                parent.putIfAbsent(email, email);   // new email: it is its own root
                emailToName.put(email, name);
                union(first, email);                // same account -> same person
            }
        }
        Map<String, TreeSet<String>> groups = new HashMap<>(); // root -> emails (sorted)
        for (String email : parent.keySet()) {
            groups.computeIfAbsent(find(email), k -> new TreeSet<>()).add(email);
        }
        List<List<String>> result = new ArrayList<>();
        for (TreeSet<String> emails : groups.values()) {
            List<String> acc = new ArrayList<>();
            acc.add(emailToName.get(emails.first()));  // name of this person
            acc.addAll(emails);
            result.add(acc);
        }
        return result;
    }

    private String find(String x) {
        while (!parent.get(x).equals(x)) {
            parent.put(x, parent.get(parent.get(x))); // path compression
            x = parent.get(x);
        }
        return x;
    }

    private void union(String a, String b) {
        String ra = find(a), rb = find(b);
        if (!ra.equals(rb)) parent.put(rb, ra);
    }
}
~~~

### Dry run on the example
- Account 1: union(johnsmith, john_newyork). Account 2: union(johnsmith, john00) → all three share the same root.
- Mary and johnnybravo stay on their own.
- Grouping → 3 accounts, and the emails in each group are already sorted thanks to {{TreeSet}}.

### Complexity
Let E = the total number of emails. Union-Find is O(E·α(E)) (treat it as O(E)); sorting inside {{TreeSet}} is O(E log E). Memory O(E).

### Interview notes
- Never merge by **name**: two "John"s with different emails are two people.
- The same email can repeat across accounts; {{TreeSet}} handles the deduplication.
- Alternative: build an email graph and run DFS/BFS to find connected components, same complexity.

> Senior tip: This is a miniature "entity resolution" problem, which you meet for real when merging customer profiles from several systems (CRM, orders, support tickets) using a shared key such as email or phone number. Be careful with shared emails (a company email, for example) because it can wrongly "connect" thousands of people.`,
    follow: ['How would you solve it with DFS over an email graph instead of Union-Find?', 'If an email is shared by many people (a company email), how should you handle it in a real system?']
  },
  'algo-119': {
    prompt: `A tree with {{n}} nodes numbered {{1..n}} had **exactly one edge** added to it, producing an undirected graph {{edges}} with {{n}} edges (and therefore exactly one cycle). Find an edge whose removal turns the graph back into a tree. If several such edges exist, return the edge that **appears last** in {{edges}}.

### Example
~~~text
Input:  edges = [[1,2],[1,3],[2,3]]
Output: [2,3]

Input:  edges = [[1,2],[2,3],[3,4],[1,4],[1,5]]
Output: [1,4]
Explanation: the cycle is 1-2-3-4-1; removing any edge on the cycle works, and [1,4] appears last.
~~~

### Constraints
- {{3 <= n <= 1000}}, {{edges.length == n}}
- {{1 <= a < b <= n}} for each edge {{[a, b]}}; no repeated edges.
- The graph is connected.`,
    hints: [
      'Add the edges one by one to an empty graph. Any edge that joins two nodes that are **already connected** to each other closes a cycle.',
      'Union-Find answers "are they connected yet?" in almost O(1): compare {{find(a)}} and {{find(b)}}.',
      'Since there is exactly one cycle, the **first** edge that makes {{find(a) == find(b)}} is exactly the last edge (in input order) of that cycle.'
    ],
    solution: `### Approach
Scan the edges in the order they appear in {{edges}}. For each edge {{(a, b)}}:
- If {{a}} and {{b}} are **not** in the same group yet → merge the groups (a valid tree edge).
- If they **are** already in the same group → a path between a and b already exists, so this edge creates a cycle → return it.

Why is it the edge that **appears last** in the cycle? The cycle only "closes" when its last edge (in input order) is added; before that moment the edges of the cycle only form a path and nothing is detected.

~~~java
class Solution {
    public int[] findRedundantConnection(int[][] edges) {
        int n = edges.length;
        int[] parent = new int[n + 1];             // nodes numbered 1..n
        for (int i = 1; i <= n; i++) parent[i] = i;
        for (int[] e : edges) {
            int ra = find(parent, e[0]), rb = find(parent, e[1]);
            if (ra == rb) return e;                // already connected -> redundant edge
            parent[ra] = rb;                       // merge the two groups
        }
        return new int[0];                         // cannot happen with valid input
    }

    private int find(int[] parent, int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];         // path compression (halving)
            x = parent[x];
        }
        return x;
    }
}
~~~

### Dry run on example 2
[1,2] merges; [2,3] merges; [3,4] merges → {1,2,3,4} is one group. [1,4]: find(1) == find(4) → return [1,4].

### Complexity
O(n·α(n)) time (practically linear), O(n) memory.

### Interview notes
- Here we only use path compression (fast enough for n ≤ 1000); add union by rank to guarantee the α(n) bound rigorously.
- Alternative: for each edge, run DFS to check whether a and b are connected → O(n²). Mention it to show why Union-Find is better.
- Redundant Connection II (a **directed** graph) is much harder: you also have to handle a node with two parents.

> Senior tip: Detecting an "edge that creates a cycle" while adding connections one by one is the same as checking for cycles when adding a new dependency to a module system, or detecting a loop in network configuration (the job of the Spanning Tree Protocol).`,
    follow: ['If the graph is directed (Redundant Connection II), which extra cases must you consider?', 'How would you solve it without Union-Find, and what is the complexity?']
  },
  'algo-120': {
    prompt: `Given an integer array {{nums}}, every element appears **exactly 3 times** except **one** element that appears **exactly 1 time**. Find that element in O(n) time and O(1) extra space (no counting HashMap).

### Example
~~~text
Input:  nums = [2,2,3,2]
Output: 3

Input:  nums = [0,1,0,1,0,1,99]
Output: 99

Input:  nums = [-2,-2,1,1,-4,1,-2]
Output: -4
~~~

### Constraints
- {{1 <= nums.length <= 3 * 10^4}}
- {{-2^31 <= nums[i] <= 2^31 - 1}}`,
    hints: [
      'The XOR trick from Single Number I (every number appears twice) does not work here: {{x ^ x ^ x = x}}, three copies do not cancel out.',
      'Look at **each bit** separately (32 positions). At bit b, count how many elements have that bit set to 1. Numbers appearing 3 times contribute a multiple of 3; if {{count % 3 == 1}} then bit b of the answer is 1.',
      'Assemble the bits with {{res |= 1 << b}}. Bit 31 is the sign bit, so negative numbers come out right automatically (two\'s complement). Advanced: the two variables {{ones}} and {{twos}} do the same job in a single pass.'
    ],
    solution: `### Approach
Look at the array one **bit column** at a time. For example [2,2,3,2]:
~~~text
     bit1 bit0
2  =  1    0
2  =  1    0
3  =  1    1
2  =  1    0
sum   4    1
%3    1    1   → result = 11b = 3
~~~
For each bit b: numbers that appear 3 times contribute 0, 3 (or 6, 9...) units to that column, i.e. a multiple of 3. The remainder after dividing by 3 can only come from the number that appears once. So {{count % 3}} is exactly bit b of the answer.

~~~java
class Solution {
    public int singleNumber(int[] nums) {
        int res = 0;
        for (int b = 0; b < 32; b++) {           // examine each bit, including the sign bit (31)
            int count = 0;
            for (int x : nums) {
                count += (x >>> b) & 1;          // >>> is an unsigned shift: extracts bit b exactly
            }
            if (count % 3 != 0) res |= 1 << b;   // bit b belongs to the number that appears once
        }
        return res;                              // bit 31 = 1 -> res is automatically negative
    }
}
~~~

### Advanced: ones / twos (a single pass)
Keep two masks: {{ones}} = bits seen a number of times ≡ 1 (mod 3), {{twos}} = bits seen ≡ 2 (mod 3).
~~~java
int ones = 0, twos = 0;
for (int x : nums) {
    ones = (ones ^ x) & ~twos;   // add x to ones if its bit is not in twos
    twos = (twos ^ x) & ~ones;   // add x to twos if its bit just left ones
}
return ones;                     // a bit seen 3 times has been cleared from both
~~~
Shorter and faster, but hard to explain; in an interview, present the bit-counting approach first.

### Complexity
- Bit counting: O(32·n) = O(n) time, O(1) memory.
- ones/twos: O(n), O(1).

### Interview notes
- Using {{>>>}} (unsigned shift) or {{>>}} followed by {{& 1}} both read the bit correctly; what matters is assembling it back with {{1 << b}} over all 32 bits so negative numbers come out right.
- Generalisation: every number appears k times except one → {{count % k}}.

> Senior tip: "Split by bit and count" is a reusable technique (finding the maximum XOR, counting pairs whose AND is 0...). When asked for O(1) memory on integers, think of the 32 bit columns as 32 tiny counters.`,
    follow: ['Explain the ones/twos formula step by step using [2,2,3,2].', 'If every number appears twice except **two** numbers that appear once (Single Number III), how do you solve it?']
  },
  'algo-121': {
    prompt: `Given an array {{nums}} of {{n}} **distinct** numbers taken from the range {{[0, n]}} (which contains n + 1 numbers), so exactly **one** number is missing. Find the missing number in O(n) time and O(1) extra space.

### Example
~~~text
Input:  nums = [3,0,1]
Output: 2

Input:  nums = [0,1]
Output: 2   (n = 2, range [0, 2], 2 is missing)

Input:  nums = [9,6,4,2,3,5,7,0,1]
Output: 8
~~~

### Constraints
- {{n == nums.length}}, {{1 <= n <= 10^4}}
- {{0 <= nums[i] <= n}}, the numbers are distinct.`,
    hints: [
      'Approach 1 (math): the sum {{0 + 1 + ... + n = n(n+1)/2}}. Subtract the sum of the array and you get the missing number.',
      'Approach 2 (XOR): {{x ^ x = 0}} and {{x ^ 0 = x}}. XOR all the numbers {{0..n}} together with all the array elements: every number present on both sides cancels out, leaving only the missing one.',
      'Merge the two XOR loops into one: start with {{res = n}}, then for each i: {{res ^= i ^ nums[i]}}.'
    ],
    solution: `### Approach
**XOR** has three properties: {{a ^ a = 0}}, {{a ^ 0 = a}}, and the operands can be reordered freely. If you XOR **every** number in {{0..n}} together with **every** element of the array, each number that is present shows up twice and cancels itself out; the missing number appears only once and therefore remains.

Compact single loop: the index {{i}} running 0..n-1 supplies the numbers 0..n-1, and the number {{n}} is placed into {{res}} up front.

~~~java
class Solution {
    public int missingNumber(int[] nums) {
        int res = nums.length;          // the number n (index i only runs up to n-1)
        for (int i = 0; i < nums.length; i++) {
            res ^= i ^ nums[i];         // XOR index i with the value nums[i]
        }
        return res;                     // every present number cancels, the missing one remains
    }
}
~~~

### Dry run on [3,0,1]
res = 3. i=0: 3^0^3 = 0. i=1: 0^1^0 = 1. i=2: 1^2^1 = 2. Result 2.

### Comparing approaches
| Approach | Time | Memory | Notes |
|---|---|---|---|
| Sort, then look for the gap | O(n log n) | O(1)–O(n) | modifies the input array |
| HashSet | O(n) | O(n) | easiest to think of |
| Sum n(n+1)/2 | O(n) | O(1) | can overflow for large n (use {{long}}) |
| XOR | O(n) | O(1) | never overflows |

### Interview notes
- For n ≤ 10^4 the sum is only about 5·10^7, which does not overflow {{int}}; but if n reaches 10^5 then {{n(n+1)}} ≈ 10^10 already exceeds {{int}}. XOR avoids the problem entirely.
- If **several** numbers are missing you need a different approach (marking positions negative in place, or a HashSet).

> Senior tip: Checking "which code is missing from a contiguous sequence" is real work when reconciling invoice numbers or message sequence numbers. At large scale people use a bitmap instead of XOR because several numbers are usually missing at once.`,
    follow: ['If exactly two numbers are missing, how do you use XOR to find both?', 'If the array is huge and lives on disk with many missing numbers, how do you handle it?']
  },
  'algo-122': {
    prompt: `Given an integer {{n}}. Return an array {{ans}} of length {{n + 1}} where {{ans[i]}} is the **number of 1 bits** in the binary representation of {{i}} (for {{0 <= i <= n}}). Do it in O(n), without recounting the bits of every number from scratch.

### Example
~~~text
Input:  n = 2
Output: [0,1,1]
Explanation: 0 = 0, 1 = 1, 2 = 10.

Input:  n = 5
Output: [0,1,1,2,1,2]
Explanation: 3 = 11, 4 = 100, 5 = 101.
~~~

### Constraints
- {{0 <= n <= 10^5}}`,
    hints: [
      'The simple way: for each i, count the bits in a loop → O(n log n). You can reuse the result of a smaller number that is already computed.',
      'Shifting right by one bit ({{i >> 1}}) drops the last bit. So the number of 1 bits of i = the number of 1 bits of {{i >> 1}} + the last bit of i ({{i & 1}}).',
      'Since {{i >> 1 < i}}, {{ans[i >> 1]}} is already available when computing {{ans[i]}}: this is one-dimensional DP.'
    ],
    solution: `### Approach
Observation: write i in binary and drop the last bit — what remains is {{i >> 1}} (i.e. {{i / 2}}). For example:
~~~text
i = 13 = 1101
i >> 1 = 6 = 110      (drops the last bit, which is 1)
ans[13] = ans[6] + 1 = 2 + 1 = 3
~~~
Formula: {{ans[i] = ans[i >> 1] + (i & 1)}}. Because {{i >> 1}} is always smaller than i (for i ≥ 1), iterating i upwards means the value we need has already been computed.

~~~java
class Solution {
    public int[] countBits(int n) {
        int[] ans = new int[n + 1];             // ans[0] = 0
        for (int i = 1; i <= n; i++) {
            ans[i] = ans[i >> 1] + (i & 1);      // 1 bits of i/2 + the last bit of i
        }
        return ans;
    }
}
~~~

### Alternative formula
{{i & (i - 1)}} clears the **lowest** set bit of i (for example 12 = 1100 → 1000). Therefore {{ans[i] = ans[i & (i - 1)] + 1}}. Also O(n).

### Complexity
O(n) time, O(n) memory for the result array (which you must return anyway).

### Interview notes
- Java already has {{Integer.bitCount(i)}} (the JIT usually compiles it into a single CPU {{POPCNT}} instruction); do mention it, but the interviewer usually wants to see the DP formula.
- Being able to explain "why ans[i >> 1] is already available" is the key point of the DP solution.

> Senior tip: Counting 1 bits (popcount) is common in practice: measuring similarity between two bitmaps (Hamming distance), counting the permissions enabled in an authorisation bitmask, or inside structures such as HyperLogLog and Roaring Bitmap.`,
    follow: ['Prove that the formula {{ans[i & (i - 1)] + 1}} is correct.', 'If you only need the total number of 1 bits of all numbers from 0 to n (with n up to 10^18), how would you do it?']
  },
  'algo-123': {
    prompt: `Given two integers {{a}} and {{b}}. Compute {{a + b}} **without using** the {{+}} and {{-}} operators (including {{+=}} and {{++}}).

### Example
~~~text
Input:  a = 1, b = 2
Output: 3

Input:  a = 2, b = 3
Output: 5

Input:  a = -1, b = 1
Output: 0
~~~

### Constraints
- {{-1000 <= a, b <= 1000}}`,
    hints: [
      'Recall how you add by hand in binary: each column produces a **sum bit** and possibly a **carry bit** into the column on its left.',
      'The sum bit **ignoring carries** is exactly {{a ^ b}} (1+0 = 1, 1+1 = 0). A carry appears in a column where both bits are 1: {{a & b}}, and the carry is added to the column on the left, so it is {{(a & b) << 1}}.',
      'The problem becomes adding the "carry-free sum" to the "carry part". Repeat until the carry part is 0. Negative numbers still work thanks to the 32-bit two\'s complement representation.'
    ],
    solution: `### Approach
Binary addition splits into two parts:
- {{a ^ b}}: add column by column but **ignore carries**.
- {{(a & b) << 1}}: the carry bits, already shifted into the column on the left.

The real sum = (carry-free sum) + (carry part). We add these two numbers again in exactly the same way, until there is no carry left.

Example 5 + 3:
~~~text
a = 101, b = 011
round 1: xor = 110, carry = (001) << 1 = 010
round 2: a = 110, b = 010 → xor = 100, carry = (010) << 1 = 100
round 3: a = 100, b = 100 → xor = 000, carry = 1000
round 4: a = 000, b = 1000 → xor = 1000, carry = 0 → result 1000 = 8
~~~

~~~java
class Solution {
    public int getSum(int a, int b) {
        while (b != 0) {
            int carry = (a & b) << 1;   // the carry bits, shifted to the column on the left
            a = a ^ b;                  // per-column sum ignoring carries
            b = carry;                  // the carry part still has to be added
        }
        return a;
    }
}
~~~

### Why negative numbers still work, and why the loop terminates
A Java {{int}} is a 32-bit two\'s complement value, and real addition is exactly binary addition discarding the overflow past bit 31. The algorithm simulates precisely that. On each round the lowest carry bit moves at least one position to the left; after at most 32 rounds it is pushed out of the 32 bits and {{carry}} becomes 0.

### Complexity
At most 32 rounds → O(1) time, O(1) memory.

### Interview notes
- In Python (unbounded integers) you must mask with {{0xFFFFFFFF}} yourself; in Java you do not, because {{int}} truncates to 32 bits on its own. Pointing out this difference is a plus.
- Subtraction: {{a - b}} = {{getSum(a, getSum(~b, 1))}} because {{-b = ~b + 1}} in two\'s complement.

> Senior tip: This problem tests whether you understand how integers are stored (two\'s complement, overflow). That knowledge is needed when debugging real {{int}} overflow bugs, for example adding two millisecond timestamps or computing {{(low + high) / 2}} in binary search.`,
    follow: ['Write the subtraction a - b using only bit operators.', 'Why does Python need the 0xFFFFFFFF mask while Java does not?']
  },
  'algo-124': {
    prompt: `Given a square matrix {{matrix}} of size {{n x n}} representing an image. Rotate the image **90 degrees clockwise** **in place**: modify {{matrix}} directly, without allocating a second matrix.

### Example
~~~text
Input:  [[1,2,3],
         [4,5,6],
         [7,8,9]]
Output: [[7,4,1],
         [8,5,2],
         [9,6,3]]
~~~

### Constraints
- {{1 <= n <= 20}}
- {{-1000 <= matrix[i][j] <= 1000}}`,
    hints: [
      'When rotating 90° clockwise, the element at {{(i, j)}} moves to {{(j, n - 1 - i)}}. Can you accomplish that with two simple operations, each of which can be done in place?',
      'Step 1: **transpose**, swapping {{matrix[i][j]}} with {{matrix[j][i]}}, visiting only the half above the diagonal ({{j > i}}) so that nothing is swapped twice.',
      'Step 2: **reverse each row** (swap the leftmost and rightmost columns). Transpose then reverse rows = a 90° clockwise rotation.'
    ],
    solution: `### Approach
A 90° clockwise rotation sends {{(i, j)}} → {{(j, n-1-i)}}. We reach it in two steps, each of which is only an in-place swap:
1. **Transpose**: {{(i, j)}} → {{(j, i)}}.
2. **Reverse every row**: {{(j, i)}} → {{(j, n-1-i)}}.

~~~text
1 2 3      transpose      1 4 7      reverse rows      7 4 1
4 5 6     ─────────►      2 5 8     ─────────►        8 5 2
7 8 9                     3 6 9                        9 6 3
~~~

~~~java
class Solution {
    public void rotate(int[][] matrix) {
        int n = matrix.length;
        // step 1: transpose - swap only the upper half above the diagonal (j > i); otherwise each pair is swapped twice, i.e. nothing changes
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                int tmp = matrix[i][j];
                matrix[i][j] = matrix[j][i];
                matrix[j][i] = tmp;
            }
        }
        // step 2: reverse each row
        for (int[] row : matrix) {
            for (int l = 0, r = n - 1; l < r; l++, r--) {
                int tmp = row[l];
                row[l] = row[r];
                row[r] = tmp;
            }
        }
    }
}
~~~

### Alternative: rotate four elements per ring
For each "layer" from the outside in, four cells on the four sides rotate among themselves: top → right → bottom → left → top. It needs only one temporary variable and each cell moves exactly once, but the indices are easier to get wrong.

### Complexity
Each step visits roughly n²/2 cells → O(n²) time, O(1) extra space.

### Interview notes
- **Counter-clockwise** rotation: transpose then reverse each **column** (or reverse the rows first, then transpose).
- 180° rotation: reverse each row, then reverse the order of the rows.
- Common bug: the transpose loop starts {{j}} at 0, so every pair is swapped twice and the matrix ends up unchanged.

> Senior tip: Decomposing a difficult transformation into known simple operations (transpose + reverse) is an important design skill: it makes code easier to verify than deriving the index formula directly.`,
    follow: ['Rewrite it by rotating four elements per layer.', 'If the matrix is not square (m x n), can it still be rotated in place?']
  },
  'algo-125': {
    prompt: `Given a matrix {{matrix}} of size {{m x n}}. Return all elements in **spiral** order: start at the top-left corner, go right, then down, then left, then up, and keep spiralling inwards clockwise.

### Example
~~~text
Input:  [[1,2,3],
         [4,5,6],
         [7,8,9]]
Output: [1,2,3,6,9,8,7,4,5]

Input:  [[1,2,3,4],
         [5,6,7,8],
         [9,10,11,12]]
Output: [1,2,3,4,8,12,11,10,9,5,6,7]
~~~

### Constraints
- {{1 <= m, n <= 10}}
- {{-100 <= matrix[i][j] <= 100}}`,
    hints: [
      'Keep the four borders of the unvisited part: {{top}}, {{bottom}}, {{left}}, {{right}}.',
      'Each lap: traverse row {{top}} (left → right) then {{top++}}; traverse column {{right}} (top → bottom) then {{right--}}; traverse row {{bottom}} (right → left) then {{bottom--}}; traverse column {{left}} (bottom → top) then {{left++}}.',
      'Be careful when only **one row** or **one column** is left: check {{top <= bottom}} before traversing the bottom row and {{left <= right}} before traversing the left column, otherwise you take elements twice.'
    ],
    solution: `### Approach
Simulate "peeling" the matrix layer by layer. Four boundary variables describe the rectangle that is still unvisited. Whenever one side is fully traversed it is used up, so the corresponding boundary is pulled inwards.

~~~text
→ → → ↓        top    = topmost row not yet visited
↑ → ↓ ↓        bottom = bottommost row not yet visited
↑ ← ← ↓        left / right = leftmost / rightmost column not yet visited
~~~

~~~java
class Solution {
    public List<Integer> spiralOrder(int[][] matrix) {
        List<Integer> res = new ArrayList<>();
        int top = 0, bottom = matrix.length - 1;
        int left = 0, right = matrix[0].length - 1;
        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) res.add(matrix[top][c]);   // top row: left -> right
            top++;
            for (int r = top; r <= bottom; r++) res.add(matrix[r][right]); // right column: top -> bottom
            right--;
            if (top <= bottom) {                                            // is there still a row to traverse backwards?
                for (int c = right; c >= left; c--) res.add(matrix[bottom][c]); // bottom row: right -> left
                bottom--;
            }
            if (left <= right) {                                            // is there still a column to go up?
                for (int r = bottom; r >= top; r--) res.add(matrix[r][left]);   // left column: bottom -> top
                left++;
            }
        }
        return res;
    }
}
~~~

### Why are the two if statements needed?
For a single-row matrix {{[[1,2,3]]}}: traversing the top row takes 1,2,3, after which {{top = 1 > bottom = 0}}. Without the check, the "bottom row" step would take 3,2,1 again. The same happens for a single-column matrix and the "left column" step.

### Complexity
Every element is appended exactly once → O(m·n) time, O(1) extra space (not counting the result).

### Interview notes
- Alternative: a {{visited}} array plus turning whenever you hit a border or an already-visited cell; easy to come up with but uses O(m·n) memory.
- Hand-test a 1-row matrix, a 1-column matrix and a non-square rectangle before you say "done".

> Senior tip: A simulation problem like this is not hard algorithmically — it is hard because of the **boundary conditions**. The habit of testing the 1×n, n×1 and 1×1 cases before submitting is the same habit that produces good unit tests.`,
    follow: ['How do you generate an n x n matrix containing 1..n² in spiral order (Spiral Matrix II)?', 'If you only need the k-th element in spiral order, is there a faster way than traversing everything?']
  },
  'algo-126': {
    prompt: `Given a partially filled {{9 x 9}} Sudoku board ({{'.'}} is an empty cell). Check whether the **filled** cells break the rules: each digit {{1-9}} appears at most once in every **row**, every **column** and every **3x3 box**. You do not need to check whether the board is solvable.

### Example
~~~text
Input:
5 3 . | . 7 . | . . .
6 . . | 1 9 5 | . . .
. 9 8 | . . . | . 6 .
------+-------+------
8 . . | . 6 . | . . 3
4 . . | 8 . 3 | . . 1
7 . . | . 2 . | . . 6
------+-------+------
. 6 . | . . . | 2 8 .
. . . | 4 1 9 | . . 5
. . . | . 8 . | . 7 9
Output: true

If cell (0,0) changes from 5 to 8: column 0 then holds two 8s (row 0 and row 3) → false.
~~~

### Constraints
- {{board.length == 9}}, {{board[i].length == 9}}
- {{board[i][j]}} is a digit {{'1'..'9'}} or {{'.'}}.`,
    hints: [
      'Visit each cell **once**, and for each digit you want to know immediately whether it has already appeared in this row/column/box.',
      'Use three marker tables {{row[9][10]}}, {{col[9][10]}}, {{box[9][10]}}: for example {{row[i][d] = true}} means digit d already appears in row i.',
      'The box index of cell {{(i, j)}} is {{(i / 3) * 3 + j / 3}} (boxes numbered 0..8 from left to right, top to bottom).'
    ],
    solution: `### Approach
There are 27 "groups" to check for duplicates: 9 rows, 9 columns, 9 boxes. Instead of checking each group separately, we scan the board once and update all three groups that contain the current cell.

**Computing the box index:** {{i / 3}} tells which band of rows the box is in (0, 1, 2), {{j / 3}} which band of columns. Combining them gives {{(i / 3) * 3 + j / 3}}:
~~~text
box:   0 | 1 | 2
       3 | 4 | 5
       6 | 7 | 8
cell (4, 7): 4/3 = 1, 7/3 = 2 → box 1*3 + 2 = 5
~~~

~~~java
class Solution {
    public boolean isValidSudoku(char[][] board) {
        boolean[][] row = new boolean[9][10]; // row[i][d]: digit d already appears in row i
        boolean[][] col = new boolean[9][10];
        boolean[][] box = new boolean[9][10];
        for (int i = 0; i < 9; i++) {
            for (int j = 0; j < 9; j++) {
                char ch = board[i][j];
                if (ch == '.') continue;              // empty cell: skip
                int d = ch - '0';
                int b = (i / 3) * 3 + j / 3;          // 3x3 box index
                if (row[i][d] || col[j][d] || box[b][d]) return false; // duplicate
                row[i][d] = col[j][d] = box[b][d] = true;
            }
        }
        return true;
    }
}
~~~

### Complexity
The board has a fixed 81 cells → O(1) (O(N²) if generalised to an N×N board). Memory: 3 × 9 × 10 booleans → O(1).

### Interview notes
- The problem only asks whether the **current** board is valid; a valid board may still be unsolvable.
- You can use a single {{HashSet<String>}} holding strings such as "5 in row 0", "5 in col 0", "5 in box 0": short code, but slower than boolean arrays.
- Memory optimisation: use one 9-bit {{int}} per row/column/box as a bitmask.

> Senior tip: Checking a "unique across several dimensions" constraint is like validating input data (for example a shift schedule: one person must not have two shifts on the same day in the same room). Marker arrays or bitmasks are the cheapest way to check it.`,
    follow: ['How do you use a bitmask (one int per row/column/box) instead of boolean arrays?', 'Starting from this problem, how do you write a Sudoku solver with backtracking?']
  },
  'algo-127': {
    prompt: `Given an integer {{n}}. Count the **prime numbers strictly less than** {{n}} (a prime is a number > 1 divisible only by 1 and itself).

### Example
~~~text
Input:  n = 10
Output: 4
Explanation: 2, 3, 5, 7.

Input:  n = 0
Output: 0

Input:  n = 2
Output: 0   (2 is not less than 2)
~~~

### Constraints
- {{0 <= n <= 5 * 10^6}}`,
    hints: [
      'Testing each number by trial division up to its square root costs about O(n·√n) ≈ 10^10 operations for n = 5·10^6: far too slow.',
      'Sieve of Eratosthenes: instead of asking "is x prime?", **cross out** every multiple of each prime. Whatever is not crossed out is prime.',
      'For a prime p, start crossing out at {{p * p}} (smaller multiples such as 2p, 3p were already crossed out by smaller primes). You only need to sieve while {{p * p < n}}; use {{long}} or compare carefully to avoid overflow.'
    ],
    solution: `### Approach: the Sieve of Eratosthenes
1. An array {{composite[0..n-1]}}, initially all false (nothing crossed out).
2. Walk p from 2: if {{composite[p] == false}} then p is prime → count it, then cross out {{p*p, p*p + p, p*p + 2p, ...}}.
3. Why start at {{p * p}}? Every multiple {{k·p}} with {{k < p}} has a prime factor smaller than p, so it was already crossed out earlier.

Example n = 20:
~~~text
p = 2: cross out 4 6 8 10 12 14 16 18
p = 3: cross out 9 (12, 18 already crossed) 15
p = 5: 25 >= 20, nothing left to cross out
Remaining: 2 3 5 7 11 13 17 19 → 8 numbers
~~~

~~~java
class Solution {
    public int countPrimes(int n) {
        if (n < 3) return 0;                       // no prime is less than 2
        boolean[] composite = new boolean[n];      // composite[x] = true: x is composite
        int count = 0;
        for (int p = 2; p < n; p++) {
            if (composite[p]) continue;
            count++;                               // p was not crossed out by any smaller number -> prime
            if ((long) p * p >= n) continue;       // cast to long: p*p can overflow int
            for (int m = p * p; m < n; m += p) {
                composite[m] = true;               // cross out multiples of p
            }
        }
        return count;
    }
}
~~~

### Complexity
- Time O(n log log n): the total number of cross-outs is n/2 + n/3 + n/5 + ... (over the primes) ≈ n·log log n, practically linear.
- Memory O(n): n = 5·10^6 → about 5 MB with a {{boolean[]}} (1 byte per element); {{BitSet}} cuts it to roughly 625 KB.

### Interview notes
- {{p * p}} already exceeds {{Integer.MAX_VALUE}} when p is near 46341; here n ≤ 5·10^6 so the crossing loop never gets there, but casting to {{long}} is a good habit.
- Edge cases: n = 0, 1, 2 all return 0; n = 3 returns 1.
- For very large n (10^9+) use a **segmented sieve** so that memory is only O(√n).

> Senior tip: The sieve is a textbook example of trading memory for speed. When the same computation is repeated many times over the same value range, precomputing a table is usually far faster than recalculating every time.`,
    follow: ['How do you use a BitSet, or store only odd numbers, to reduce memory?', 'How does a segmented sieve work for n = 10^10?']
  },
  'algo-128': {
    prompt: `Given a string {{s}}. Find the longest **contiguous substring** that is a palindrome (reads the same forwards and backwards). If several substrings share the maximum length, return any one of them.

### Example
~~~text
Input:  s = "babad"
Output: "bab"   ("aba" is also correct)

Input:  s = "cbbd"
Output: "bb"

Input:  s = "a"
Output: "a"
~~~

### Constraints
- {{1 <= s.length <= 1000}}
- {{s}} consists of English letters and digits only.`,
    hints: [
      'Every palindrome is symmetric around a **center**. Instead of examining every substring (O(n²) substrings, each checked in O(n)), examine every center.',
      'From one center, use two pointers {{left}} and {{right}} to expand outwards as long as {{s[left] == s[right]}}.',
      'There are two kinds of center: a single character ({{left = right = i}}, an odd-length palindrome such as "aba") and the gap between two characters ({{left = i, right = i + 1}}, an even-length one such as "abba"). That makes 2n - 1 centers in total.'
    ],
    solution: `### Approach: expand around the center
The palindrome "aba" has "b" as its center; the palindrome "abba" has its center between the two "b"s. For each center we expand outwards until the two ends differ or we hit a boundary; the length reached is the longest palindrome with that center. Take the max over all centers.

~~~text
s = "babad", center i = 2 (the character 'b'):
  left=2,right=2: 'b'=='b' → expand
  left=1,right=3: 'a'=='a' → expand
  left=0,right=4: 'b'!='d' → stop → palindrome s[1..3] = "aba", length 3
~~~

~~~java
class Solution {
    public String longestPalindrome(String s) {
        int bestStart = 0, bestLen = 1;               // a single character is already a palindrome
        for (int i = 0; i < s.length(); i++) {
            int odd = expand(s, i, i);                // center at character i (odd length)
            int even = expand(s, i, i + 1);           // center between i and i+1 (even length)
            int len = Math.max(odd, even);
            if (len > bestLen) {
                bestLen = len;
                bestStart = i - (len - 1) / 2;        // recompute the start index from the center
            }
        }
        return s.substring(bestStart, bestStart + bestLen);
    }

    // expand from [left, right]; returns the longest palindrome length for this center
    private int expand(String s, int left, int right) {
        while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
            left--;
            right++;
        }
        return right - left - 1;                      // the loop stops after overshooting one step on each side
    }
}
~~~

### Why {{bestStart = i - (len - 1) / 2}}?
- Odd length, e.g. len = 3 around i: it starts at {{i - 1}} = {{i - (3 - 1) / 2}}.
- Even length, e.g. len = 4 with the center between i and i + 1: it starts at {{i - 1}} = {{i - (4 - 1) / 2}} (integer division 3 / 2 = 1). A single formula covers both cases.

### Comparing approaches
| Approach | Time | Memory |
|---|---|---|
| Try every substring | O(n³) | O(1) |
| DP table {{isPal[i][j]}} | O(n²) | O(n²) |
| Expand around center | O(n²) | O(1) |
| Manacher | O(n) | O(n) |

### Interview notes
- Forgetting even centers is the most common bug: "cbbd" would return "c" instead of "bb".
- Expanding around the center is the expected solution; for Manacher you only need to mention the name and the idea (reusing the symmetry of palindromes already found).

> Senior tip: When you see an O(n²)-memory DP-table solution, ask "does every cell really need to be stored?". Here iterating by center lets you drop the table entirely and keep O(1) memory.`,
    follow: ['If you only need the length, how does the code get shorter?', 'How does Manacher\'s algorithm achieve O(n) (the main idea)?']
  },
  'algo-129': {
    prompt: `Given a string {{s}}. Count the **contiguous substrings** that are palindromes. Two substrings at **different positions** count separately, even when their content is identical.

### Example
~~~text
Input:  s = "abc"
Output: 3
Explanation: "a", "b", "c".

Input:  s = "aaa"
Output: 6
Explanation: "a" ×3 (at 3 positions), "aa" ×2, "aaa" ×1.
~~~

### Constraints
- {{1 <= s.length <= 1000}}
- {{s}} consists of lowercase English letters only.`,
    hints: [
      'Every palindrome has exactly one center (a character or the gap between two characters). Counting palindromes center by center misses none and double-counts none.',
      'Expanding outwards from one center: **every successful expansion** adds exactly one new palindrome (2 characters longer than the previous one).',
      'Sum the results of all 2n - 1 centers: n odd centers {{(i, i)}} and n - 1 even centers {{(i, i + 1)}}.'
    ],
    solution: `### Approach
Same "expand around the center" technique as Longest Palindromic Substring (algo-128), but instead of keeping the longest one we **count**. From the center {{(left, right)}}:
- If {{s[left] == s[right]}} then {{s[left..right]}} is a palindrome → count 1, then expand {{left--}}, {{right++}}.
- Stop when they differ or we hit a boundary: a larger palindrome with the same center cannot exist (it would have to contain the smaller one in the middle).

~~~text
s = "aaa"
odd center i=0:    "a"                → 1
odd center i=1:    "a", "aaa"         → 2
odd center i=2:    "a"                → 1
even center (0,1): "aa"               → 1
even center (1,2): "aa"               → 1
total = 6
~~~

~~~java
class Solution {
    public int countSubstrings(String s) {
        int count = 0;
        for (int i = 0; i < s.length(); i++) {
            count += countFrom(s, i, i);       // odd-length palindromes, center at i
            count += countFrom(s, i, i + 1);   // even-length palindromes, center between i and i+1
        }
        return count;
    }

    // number of palindromes with center (left, right)
    private int countFrom(String s, int left, int right) {
        int c = 0;
        while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
            c++;                               // s[left..right] is a new palindrome
            left--;
            right++;
        }
        return c;
    }
}
~~~

### Complexity
2n - 1 centers, each expanding at most O(n) steps → O(n²) time (n = 1000 → about 10^6 steps). Memory O(1).

### Interview notes
- The maximum result is n(n+1)/2 ≈ 500,500 for n = 1000, which fits in {{int}}.
- DP approach: {{isPal[i][j] = s[i] == s[j] && (j - i < 2 || isPal[i+1][j-1])}}, then count the true cells. Same O(n²) time but uses O(n²) memory.

> Senior tip: Problems 128 and 129 share the same "expand around the center" function; only the way results are aggregated differs (max versus count). Recognising the common core between problems helps you solve a new one quickly in an interview.`,
    follow: ['If you need to count palindromes that are **distinct in content** (no duplicates), how would you do it?', 'Write the DP-table isPal solution and compare it with the expand-around-center approach.']
  },
  'algo-130': {
    prompt: `Given a string {{s}}. Cut {{s}} into contiguous pieces so that **every piece is a palindrome** (reads the same forwards and backwards). Return the **minimum number of cuts** (equal to the minimum number of pieces minus 1).

### Example
~~~text
Input:  s = "aab"
Output: 1
Explanation: cut into "aa" | "b", only 1 cut.

Input:  s = "a"
Output: 0
Explanation: "a" is already a palindrome, no cut needed.

Input:  s = "leet"
Output: 2
Explanation: "l" | "ee" | "t".
~~~

### Constraints
- {{1 <= s.length <= 2000}}
- {{s}} consists of lowercase English letters only.`,
    hints: [
      'First, answer the question "is s[j..i] a palindrome?" quickly for every pair (j, i). A boolean table {{isPal[j][i]}} does the job: s[j..i] is a palindrome when {{s[j] == s[i]}} and the inner part {{s[j+1..i-1]}} is also a palindrome (or the piece has length ≤ 2).',
      'Let {{cut[i]}} = the minimum number of cuts for the prefix {{s[0..i]}}. The **last** palindrome piece of that prefix starts at some position j.',
      'If {{s[0..i]}} is already a palindrome then {{cut[i] = 0}}. Otherwise {{cut[i] = min(cut[j-1] + 1)}} over every j ≥ 1 for which {{isPal[j][i]}} is true.'
    ],
    solution: `### Approach
This problem combines two DP tables:
1. {{isPal[j][i]}}: is the piece {{s[j..i]}} a palindrome? Compute it once, then look it up in O(1).
2. {{cut[i]}}: the minimum number of cuts for the prefix {{s[0..i]}}.

Why is the formula for {{cut}} correct? Consider an optimal way of cutting {{s[0..i]}}. Its last piece is a palindrome {{s[j..i]}}. The part in front, {{s[0..j-1]}}, must also be cut optimally (otherwise we could replace it with a better cut and obtain a better result, a contradiction). So we only need to try every j as the "start of the last piece":
- j = 0: the whole prefix is a palindrome, no cut needed → 0.
- j ≥ 1: cut once right before j → {{cut[j-1] + 1}}.

~~~java
class Solution {
    public int minCut(String s) {
        int n = s.length();
        // isPal[j][i] = true if s[j..i] is a palindrome
        boolean[][] isPal = new boolean[n][n];
        // j runs from right to left so that when isPal[j+1][i-1] is needed that cell is already computed
        for (int j = n - 1; j >= 0; j--) {
            for (int i = j; i < n; i++) {
                isPal[j][i] = s.charAt(j) == s.charAt(i)
                        && (i - j < 2 || isPal[j + 1][i - 1]); // piece of length 1-2, or the inner part is a palindrome
            }
        }
        int[] cut = new int[n]; // cut[i] = minimum cuts for s[0..i]
        for (int i = 0; i < n; i++) {
            if (isPal[0][i]) {          // the whole prefix is a palindrome: no cut needed
                cut[i] = 0;
                continue;
            }
            cut[i] = i;                 // worst case: cut after every character
            for (int j = 1; j <= i; j++) {
                if (isPal[j][i]) {      // the last piece s[j..i] is a palindrome
                    cut[i] = Math.min(cut[i], cut[j - 1] + 1);
                }
            }
        }
        return cut[n - 1];
    }
}
~~~

### Dry run on s = "aab"
- Palindrome table: "a"(0..0), "a"(1..1), "b"(2..2), "aa"(0..1) are true; "ab"(1..2), "aab"(0..2) are false.
- {{cut[0]}} = 0 ("a").
- {{cut[1]}} = 0 because "aa" is a palindrome.
- {{cut[2]}}: "aab" is not a palindrome. Try j = 2: "b" is a palindrome → {{cut[1] + 1 = 1}}. Try j = 1: "ab" is not. Result 1.

### Complexity
- The {{isPal}} table: n² cells, O(1) each → O(n²) time and O(n²) memory (n = 2000 → 4 million booleans ≈ 4 MB).
- The {{cut}} loop: two nested loops → O(n²).
- If you check palindromes by comparing characters each time (no table), it becomes O(n³) = 8·10^9 operations for n = 2000, which is far too slow.

### Interview notes
- The order in which the table is filled is a common mistake: {{isPal[j][i]}} needs {{isPal[j+1][i-1]}}, so j must run **downwards**.
- There is an O(n)-memory variant: for each center, "expand outwards" (expand around center) and update {{cut}} as soon as a palindrome is found. Mentioning this idea is a plus.
- Do not confuse it with Palindrome Partitioning (enumerate every way to cut, which needs backtracking): here you only need the **smallest number**, so DP is enough.

> Senior tip: When a DP problem keeps asking the same question "does this piece have property X?", precompute that table once. It is the same mindset as caching an expensive check in a real system.`,
    follow: ['If you need to return the palindrome pieces themselves (not just the number of cuts), what extra information do you store to backtrack?', 'How do you reduce memory to O(n) with expand-around-center?']
  }
});
