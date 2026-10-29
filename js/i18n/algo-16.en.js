/*
 * English translation of js/data/algo.js — task T437. Format: js/core/i18n.js (content overlay).
 * ids: algo-109 algo-110 algo-111 algo-112 algo-113 algo-114 algo-115 algo-116 algo-117
 */
App.i18n.content({
  'algo-109': {
    prompt: `Given a directed graph with {{V}} vertices numbered {{0..V-1}} and an edge list {{edges}}, where each edge {{[u, v]}} means there is an arrow {{u → v}}. Return **any topological order**: an array that contains every vertex exactly once such that for every edge {{u → v}}, {{u}} comes before {{v}}. If the graph has a cycle (including a self-loop {{[x, x]}}) then no topological order exists — return an empty array.

### Example
~~~text
Input:  V = 4, edges = [[0,1],[1,2],[2,3]]
Output: [0,1,2,3]

Input:  V = 4, edges = [[0,1],[0,2],[1,3],[2,3]]
Output: [0,1,2,3] or [0,2,1,3] (both valid)

Input:  V = 3, edges = [[0,1],[1,2],[2,0]]
Output: []   (cycle 0 → 1 → 2 → 0)
~~~

### Constraints
- {{1 <= V <= 10^4}}
- {{0 <= edges.length <= 10^4}}, {{0 <= u, v < V}}`,
    hints: [
      'A vertex with **no incoming arrow** (in-degree = 0) is not waiting for anybody, so it can go first.',
      "Kahn's algorithm: put every vertex with in-degree 0 into a queue. Take one vertex out, append it to the result, then \"delete\" the edges leaving it (decrement the in-degree of the destination vertices). Any vertex that drops to 0 goes into the queue.",
      'If at the end the number of recorded vertices is less than {{V}}, the remaining vertices are inside a cycle (they always still have an incoming arrow) → return an empty array.'
    ],
    solution: `### Approach
A topological order is like scheduling tasks with dependencies: whatever depends on nothing gets done first, and finishing it "removes" the dependency of the tasks that come after it.

**Kahn's algorithm** (BFS over in-degrees):
1. Build the adjacency list {{adj}} and the array {{indeg[v]}} = number of edges entering {{v}}.
2. Put every vertex with {{indeg == 0}} into the queue.
3. Take vertex {{u}} out and append it to the result. For each edge {{u → v}}: decrement {{indeg[v]}}; if it reaches 0 then {{v}} is ready → enqueue it.
4. If the number of recorded vertices is {{< V}} → there is a cycle.

Why does this detect cycles? Inside a cycle, every vertex always has at least one incoming edge from another vertex **in the same cycle**; no vertex of the cycle is recorded first, so its in-degree never drops to 0.

~~~java
class Solution {
    public int[] topoSort(int V, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < V; i++) adj.add(new ArrayList<>());
        int[] indeg = new int[V];                 // number of edges entering each vertex
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            indeg[e[1]]++;
        }
        Deque<Integer> q = new ArrayDeque<>();
        for (int v = 0; v < V; v++) if (indeg[v] == 0) q.add(v); // depends on nobody
        int[] order = new int[V];
        int idx = 0;
        while (!q.isEmpty()) {
            int u = q.poll();
            order[idx++] = u;
            for (int v : adj.get(u)) {
                if (--indeg[v] == 0) q.add(v);    // v has no dependencies left -> ready
            }
        }
        return idx == V ? order : new int[0];     // missing vertices -> there is a cycle
    }
}
~~~

### Hand trace with V = 4, edges = [[0,1],[0,2],[1,3],[2,3]]
- indeg = [0,1,1,2]. Queue: [0].
- Take 0 → indeg[1]=0, indeg[2]=0 → queue [1,2].
- Take 1 → indeg[3]=1. Take 2 → indeg[3]=0 → queue [3]. Take 3.
- Result [0,1,2,3], all 4 vertices.

### Complexity
Each vertex enters and leaves the queue once, each edge is examined once → O(V + E) time, O(V + E) memory.

### Interview notes
- Many orders are valid; if you need the lexicographically smallest one, replace the queue with a {{PriorityQueue}} (O((V + E) log V)).
- Alternative: DFS — push a vertex onto a stack once it **finishes**; reversing the stack gives the topological order. Detect cycles with 3 colours (unvisited / visiting / done).
- This problem is almost **the same algorithm as algo-110 (Course Schedule II)**, only the way the edges are expressed differs.

> Senior tip: Topological sort is the core of build tools (Maven/Gradle order their modules), of Spring creating beans by dependency, and of DB migrations. The "circular dependency" error you have run into is exactly step 4 of Kahn.`,
    follow: [
      'How do you write the topological order with DFS and detect cycles using 3 colour states?',
      'What do you change to get the lexicographically smallest topological order?'
    ]
  },
  'algo-110': {
    prompt: `There are {{numCourses}} courses numbered {{0..numCourses-1}}. {{prerequisites[i] = [a, b]}} means that to take course {{a}} you must have finished course {{b}} first. Return **one** ordering in which you can take every course while satisfying all the prerequisites; if that is impossible (a circular prerequisite) return an empty array.

### Example
~~~text
Input:  numCourses = 2, prerequisites = [[1,0]]
Output: [0,1]

Input:  numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]
Output: [0,1,2,3] or [0,2,1,3]

Input:  numCourses = 2, prerequisites = [[1,0],[0,1]]
Output: []   (0 needs 1, and 1 needs 0)
~~~

### Constraints
- {{1 <= numCourses <= 2000}}
- {{0 <= prerequisites.length <= numCourses * (numCourses - 1)}}
- All pairs {{[a, b]}} are distinct and {{a != b}}.`,
    hints: [
      'Draw each prerequisite {{[a, b]}} as an arrow {{b → a}} ("finish b before a"). The problem becomes finding a topological order.',
      'A course with no prerequisite (in-degree 0) is taken first. Once a course is taken, decrement the in-degree of the courses that depend on it (Kahn\'s algorithm).',
      'If you can take fewer than {{numCourses}} courses then there is a dependency cycle → return an empty array.'
    ],
    solution: `### Approach
Reformulate the problem as a graph: each course is a vertex, and the prerequisite {{[a, b]}} is the edge {{b → a}}. A valid study order is exactly a **topological order**. Use Kahn's algorithm:
1. {{indeg[a]}} = number of prerequisites of {{a}}.
2. Initial queue = the courses with {{indeg == 0}} (can be taken right away).
3. Take course {{b}} out and add it to the schedule. For every course {{a}} that requires {{b}}: {{indeg[a]--}}; when it reaches 0, {{a}} is fully unlocked → enqueue it.
4. Schedule contains all {{numCourses}} courses → return it; otherwise there is a cycle → empty array.

~~~java
class Solution {
    public int[] findOrder(int numCourses, int[][] prerequisites) {
        List<List<Integer>> next = new ArrayList<>();  // next[b] = courses that require b
        for (int i = 0; i < numCourses; i++) next.add(new ArrayList<>());
        int[] indeg = new int[numCourses];             // prerequisites still missing
        for (int[] p : prerequisites) {
            next.get(p[1]).add(p[0]);                  // edge b -> a
            indeg[p[0]]++;
        }
        Deque<Integer> q = new ArrayDeque<>();
        for (int c = 0; c < numCourses; c++) if (indeg[c] == 0) q.add(c);
        int[] order = new int[numCourses];
        int taken = 0;
        while (!q.isEmpty()) {
            int b = q.poll();
            order[taken++] = b;                        // take course b
            for (int a : next.get(b)) {
                if (--indeg[a] == 0) q.add(a);         // a now has all prerequisites
            }
        }
        return taken == numCourses ? order : new int[0];
    }
}
~~~

### Hand trace with example 2
indeg = [0,1,1,2]. Queue [0] → take 0, courses 1 and 2 drop to 0 → take 1 (course 3 still has 1) → take 2 (course 3 drops to 0) → take 3. Result [0,1,2,3].

### Complexity
O(V + E) time and memory, where V = number of courses, E = number of prerequisites.

### Interview notes
- People often get the edge direction wrong: {{[a, b]}} means "a needs b", so the edge goes **from b to a**. Say this out loud in the interview.
- Course Schedule I (algo-029, algo-073) only asks "can all courses be finished" → same code, just return {{taken == numCourses}}.
- This problem uses the same algorithm as algo-109 (Topological Sort).

> Senior tip: CI/CD systems that run pipeline jobs with dependencies, and Kubernetes/Helm installing charts that have dependencies, all need a topological order and must report a clear error when there is a cycle. In practice, print the **remaining vertices** (exactly the ones caught in the cycle) so the user can fix the configuration.`,
    follow: [
      'If there is a dependency cycle, how do you print the courses that are actually inside it?',
      'If you may take at most k courses per semester, what is the minimum number of semesters?'
    ]
  },
  'algo-111': {
    prompt: `An alien language uses the letters {{a-z}} but in a **different order**. You are given a list {{words}} that is already sorted according to that language's dictionary order. Infer a possible ordering of the letters and return it as a string containing **every letter that appears** in {{words}}, each letter exactly once. If several answers exist, return any of them. If the data is inconsistent, return {{""}}. Two kinds of inconsistency exist: a cycle in the ordering (a before b, b before a), or a word that comes before **a prefix of itself** (for example {{"abc"}} before {{"ab"}}).

### Example
~~~text
Input:  words = ["wrt","wrf","er","ett","rftt"]
Output: "wertf"
Explanation: "wrt" < "wrf" gives t < f; "wrf" < "er" gives w < e; "er" < "ett" gives r < t; "ett" < "rftt" gives e < r.

Input:  words = ["z","x","z"]
Output: ""   (z < x and x < z: contradiction)

Input:  words = ["abc","ab"]
Output: ""   (the longer word comes before its prefix)
~~~

### Constraints
- {{1 <= words.length <= 100}}
- {{1 <= words[i].length <= 100}}
- {{words[i]}} contains lowercase letters {{a-z}} only.`,
    hints: [
      'Compare **two adjacent words**: the **first** character that differs gives you exactly one piece of information, "letter c1 comes before letter c2". The characters after it give no information.',
      'Each piece of information is an edge {{c1 → c2}} in a graph with 26 vertices. The letter order we need is the topological order of that graph (Kahn\'s algorithm).',
      'Two cases return {{""}}: (1) the topological sort does not collect every letter (there is a cycle); (2) two adjacent words have no differing character but the earlier word is longer.'
    ],
    solution: `### Approach
A normal dictionary compares two words by their **first differing character**. Reverse it: look at two adjacent words; the first differing character tells you which letter comes first. For example, {{"wrt" < "wrf"}}: the first differing characters are {{t}} and {{f}} → {{t}} comes before {{f}}.

Steps:
1. Record every letter that appears (letters with no relation at all must still be in the result).
2. For each pair of adjacent words, find the first differing character → edge {{c1 → c2}} (use a Set so duplicated edges are not counted twice). If there is no differing character and the earlier word is longer → contradiction, return {{""}}.
3. Kahn: letters with in-degree 0 come out first. If fewer letters come out than the number of letters that appear → there is a cycle → {{""}}.

~~~java
class Solution {
    public String alienOrder(String[] words) {
        Map<Character, Set<Character>> adj = new HashMap<>();
        Map<Character, Integer> indeg = new HashMap<>();
        for (String w : words)
            for (char c : w.toCharArray()) {          // every letter that appears is a vertex
                adj.putIfAbsent(c, new HashSet<>());
                indeg.putIfAbsent(c, 0);
            }
        for (int i = 0; i + 1 < words.length; i++) {
            String a = words[i], b = words[i + 1];
            int len = Math.min(a.length(), b.length());
            int j = 0;
            while (j < len && a.charAt(j) == b.charAt(j)) j++; // find the first differing character
            if (j == len) {
                if (a.length() > b.length()) return "";        // "abc" before "ab": impossible
                continue;                                       // no new information
            }
            char from = a.charAt(j), to = b.charAt(j);
            if (adj.get(from).add(to)) indeg.merge(to, 1, Integer::sum); // new edge: increment in-degree
        }
        Deque<Character> q = new ArrayDeque<>();
        for (Map.Entry<Character, Integer> e : indeg.entrySet()) if (e.getValue() == 0) q.add(e.getKey());
        StringBuilder order = new StringBuilder();
        while (!q.isEmpty()) {
            char c = q.poll();
            order.append(c);
            for (char nx : adj.get(c)) {
                if (indeg.merge(nx, -1, Integer::sum) == 0) q.add(nx);
            }
        }
        return order.length() == indeg.size() ? order.toString() : ""; // missing letters -> there is a cycle
    }
}
~~~

### Hand trace with example 1
Edges: t→f, w→e, r→t, e→r. In-degrees: w=0, e=1, r=1, t=1, f=1.
Kahn: w → (e drops to 0) e → r → t → f. Result "wertf".

### Complexity
Let C = total number of characters across all words. The comparison step is O(C); the graph has at most 26 vertices and 26·25 edges, so the topological sort is effectively O(1). Total O(C) time, O(1) extra memory (fixed alphabet).

### Interview notes
- **Only** the first differing character carries information; comparing the characters after it is wrong.
- The prefix trap: {{["abc","ab"]}} cannot be a valid dictionary in any language.
- A letter that appears but has no relation must still be in the result (for example {{["z"]}} → {{"z"}}).
- Do not add the same edge twice to {{indeg}}, otherwise the in-degree is miscounted and the algorithm reports a cycle that is not there.

> Senior tip: This problem tests **modelling**: turn string data into a graph, then apply a standard algorithm. When you meet an unfamiliar problem, ask "what is a vertex and what is an edge?". A lot of real dependency problems are solved this way.`,
    follow: [
      'How do you know whether the inferred order is **unique**?',
      'If the word list is huge and arrives as a stream, how do you build the graph?'
    ]
  },
  'algo-112': {
    prompt: `Given an array {{org}} that is a permutation of {{1..n}} and a list of sequences {{seqs}}. Each sequence in {{seqs}} states an order: an element that comes earlier must appear before an element that comes later. Is {{org}} the **unique** sequence of length n satisfying every sequence in {{seqs}} (each sequence being a subsequence of it)? Return {{false}} if {{seqs}} contains a number outside {{1..n}}, or does not mention every number {{1..n}}.

### Example
~~~text
Input:  org = [1,2,3], seqs = [[1,2],[1,3]]
Output: false
Explanation: both [1,2,3] and [1,3,2] satisfy the constraints, so it is not unique.

Input:  org = [1,2,3], seqs = [[1,2],[2,3]]
Output: true

Input:  org = [4,1,5,2,6,3], seqs = [[5,2,6,3],[4,1,5,2]]
Output: true
~~~

### Constraints
- {{1 <= n <= 10^4}}, {{org}} is a permutation of {{1..n}}
- {{1 <= seqs[i].length}}, the total length of the sequences is {{<= 10^5}}`,
    hints: [
      'Each pair of **adjacent** elements inside a sequence {{seqs[i]}} gives an edge {{u → v}}. The sequence we are looking for is a topological order of that graph.',
      'The topological order is **unique** if and only if at every step of Kahn the queue holds **exactly one** vertex (if two vertices are ready at the same time, you can swap them).',
      'Walk in lockstep with {{org}}: the vertex taken out at step i must equal {{org[i]}}. Do not forget to check for out-of-range numbers and missing numbers.'
    ],
    solution: `### Approach
1. **Build the graph:** for each sequence, every adjacent pair {{(u, v)}} is an edge {{u → v}} (use a Set so duplicates are not counted twice). At the same time check that every number lies in {{1..n}} and mark which numbers appeared.
2. **Kahn with a uniqueness check:** if the queue holds ≥ 2 vertices then there are at least two different orders → {{false}}. The vertex taken out must equal {{org[idx]}}.
3. At the end all n vertices must have been processed (no cycle).

Why is "the queue always holds exactly one element" ⇔ unique? If at some point two vertices {{x, y}} both have in-degree 0, there is no constraint between them, so swapping x and y is still valid → at least 2 answers. Conversely, if there is always only one choice, every step is forced → the answer is unique.

~~~java
class Solution {
    public boolean sequenceReconstruction(int[] org, int[][] seqs) {
        int n = org.length;
        List<Set<Integer>> adj = new ArrayList<>();
        for (int i = 0; i <= n; i++) adj.add(new HashSet<>());
        int[] indeg = new int[n + 1];
        boolean[] seen = new boolean[n + 1];
        for (int[] seq : seqs) {
            for (int i = 0; i < seq.length; i++) {
                if (seq[i] < 1 || seq[i] > n) return false;    // out-of-range number
                seen[seq[i]] = true;
                if (i > 0 && adj.get(seq[i - 1]).add(seq[i])) indeg[seq[i]]++; // new edge
            }
        }
        for (int v = 1; v <= n; v++) if (!seen[v]) return false; // missing number -> cannot be determined
        Deque<Integer> q = new ArrayDeque<>();
        for (int v = 1; v <= n; v++) if (indeg[v] == 0) q.add(v);
        int idx = 0;
        while (!q.isEmpty()) {
            if (q.size() > 1) return false;        // 2 choices -> not unique
            int u = q.poll();
            if (org[idx++] != u) return false;     // differs from org
            for (int v : adj.get(u)) if (--indeg[v] == 0) q.add(v);
        }
        return idx == n;                           // missing vertices -> there is a cycle
    }
}
~~~

### Hand trace with org = [1,2,3], seqs = [[1,2],[1,3]]
Edges 1→2, 1→3. Queue [1] → take 1 (= org[0]) → both 2 and 3 drop to 0 → the queue holds 2 elements → {{false}}.

### Complexity
O(n + L) where L = total length of the sequences (each adjacent pair creates at most one edge).

### Interview notes
- The edge u → u (two equal adjacent numbers) is a self-loop: the solution above returns {{false}} automatically because the in-degree of u never drops to 0.
- An alternative without Kahn: check that every adjacent pair {{(org[i], org[i+1])}} appears adjacent in some sequence (and every edge respects the order of org). This is also O(n + L).

> Senior tip: The question "is there only one valid ordering?" shows up when you verify whether a pipeline configuration is deterministic. A non-unique order means results can differ between runs — the source of bugs that are hard to reproduce.`,
    follow: [
      'How do you solve it by checking the adjacent pairs of org (without Kahn)?',
      'If seqs contains numbers outside org and you want to ignore them instead of returning false, what do you change?'
    ]
  },
  'algo-113': {
    prompt: `Implement the class {{Trie}} (a prefix tree) with these operations:
- {{Trie()}}: initialise an empty tree.
- {{void insert(String word)}}: add the word {{word}}.
- {{boolean search(String word)}}: {{true}} if **exactly the word** {{word}} has been inserted before.
- {{boolean startsWith(String prefix)}}: {{true}} if at least one inserted word starts with {{prefix}}.

### Example
~~~text
Trie trie = new Trie();
trie.insert("apple");
trie.search("apple");   // true
trie.search("app");     // false  ("app" is only a prefix, it was not inserted as a word)
trie.startsWith("app"); // true
trie.insert("app");
trie.search("app");     // true
~~~

### Constraints
- {{1 <= word.length, prefix.length <= 2000}}
- Lowercase letters {{a-z}} only.
- At most {{3 * 10^4}} calls in total.`,
    hints: [
      'Each node represents one prefix. A node has up to 26 children; child number {{c - \'a\'}} corresponds to appending the letter {{c}}.',
      'You need an extra {{isEnd}} flag on the node: whether this prefix is **a complete word** that has been inserted. That is exactly the difference between {{search}} and {{startsWith}}.',
      'Write a helper {{find(s)}} that walks from the root character by character and returns the last node (or {{null}} if the path breaks). {{search}} = the node is not null and {{isEnd}}; {{startsWith}} = the node is not null.'
    ],
    solution: `### Approach
A Trie stores words as a tree, and words that share a prefix **share** the leading nodes. For example "app" and "apple" both go through a → p → p:
~~~text
(root)
  └─ a
     └─ p
        └─ p  [isEnd: "app"]
           └─ l
              └─ e  [isEnd: "apple"]
~~~
- **insert:** walk from the root character by character, creating missing nodes; at the last character turn on {{isEnd}}.
- **search:** walk character by character; if the path breaks → false; if you get all the way, you need {{isEnd == true}}.
- **startsWith:** the same as search but {{isEnd}} is not required.

~~~java
class Trie {
    private static class Node {
        Node[] children = new Node[26]; // children[c - 'a'] = child node for the extra letter c
        boolean isEnd;                  // this prefix is a word that was inserted
    }

    private final Node root = new Node();

    public void insert(String word) {
        Node cur = root;
        for (int i = 0; i < word.length(); i++) {
            int k = word.charAt(i) - 'a';
            if (cur.children[k] == null) cur.children[k] = new Node(); // create the child if missing
            cur = cur.children[k];
        }
        cur.isEnd = true;                   // mark the end of a word
    }

    public boolean search(String word) {
        Node node = find(word);
        return node != null && node.isEnd;  // must be a complete word
    }

    public boolean startsWith(String prefix) {
        return find(prefix) != null;        // only the path needs to exist
    }

    // walk s from the root; return the last node, or null if the path breaks
    private Node find(String s) {
        Node cur = root;
        for (int i = 0; i < s.length() && cur != null; i++) {
            cur = cur.children[s.charAt(i) - 'a'];
        }
        return cur;
    }
}
~~~

### Complexity
- Each operation is O(L) where L = length of the word/prefix, **independent of** how many words are stored.
- Memory: at most one node per inserted character (O(total length)), and each node holds an array of 26 references.

### Comparison with HashSet
| | Trie | HashSet<String> |
|---|---|---|
| exact word search | O(L) | O(L) (hashing) |
| startsWith | O(L) | must scan every word, O(N·L) |
| Memory | wasteful when few prefixes are shared | more compact |

### Interview notes
- For a large alphabet (Unicode), replace the 26-slot array with a {{HashMap<Character, Node>}}.
- Deleting a word: turn off {{isEnd}}, then (optionally) walk back and delete nodes that have no children left and are not the end of another word.
- People often forget the "prefix of an existing word" case ({{search("app")}} after inserting only "apple") → it must be false.

> Senior tip: Tries (and compressed variants such as radix trees) are used in autocomplete, in IP routing by longest-prefix match, and in the router of many web frameworks to match URL paths quickly.`,
    follow: [
      'How do you implement {{delete(word)}} so it does not break other words that share a prefix?',
      'To return the top 3 most popular words starting with a prefix (autocomplete), what extra data do you store in each node?'
    ]
  },
  'algo-114': {
    prompt: `Given a letter grid {{board}} of size {{m x n}} and a list of words {{words}}. A word "exists in the grid" if it can be assembled from **edge-adjacent** cells in sequence (up/down/left/right), with each cell used **at most once** within the same word. Return every word in {{words}} that exists in the grid, each word **once**, in any order.

### Example
~~~text
Input:  board = [["o","a","a","n"],
                 ["e","t","a","e"],
                 ["i","h","k","r"],
                 ["i","f","l","v"]]
        words = ["oath","pea","eat","rain"]
Output: ["eat","oath"]

Input:  board = [["a","b"],["c","d"]], words = ["abcb"]
Output: []   (going back to the "b" cell would use it twice)
~~~

### Constraints
- {{1 <= m, n <= 12}}
- {{1 <= words.length <= 3 * 10^4}}, {{1 <= words[i].length <= 10}}
- Lowercase letters only; {{words}} may contain duplicates.`,
    hints: [
      'Running Word Search (DFS) separately for each word costs O(number of words × m × n × 4^L): far too slow for 3·10^4 words. You need to find **all words in one DFS**.',
      'Put every word into a Trie. While DFS-ing the grid, walk the Trie in parallel: if the next cell character is not among the children of the current Trie node, prune the branch immediately, because no word starts with that prefix.',
      'Store the word itself at its final node. When you find it, add it to the result and set it to {{null}} so it is not added twice. You can also delete a leaf node that has "no work left" to make later DFS runs faster.'
    ],
    solution: `### Approach
Combine a **Trie** with **backtracking**:
1. Build a Trie from {{words}}; the node that ends a word also stores that string ({{node.word}}).
2. From each cell of the grid, DFS: only move to a cell whose character matches a child of the current Trie node. This way we explore **all words at once**, and any branch that is not a prefix of some word stops immediately.
3. When you reach a node with {{word != null}} → add it to the result and set {{word = null}} (duplicate prevention).
4. Mark the cell in use with {{'#'}}, recurse in 4 directions, then restore the old character (backtrack).
5. Optimisation: after DFS through a child node, if that node has no children left and no word → remove it from the Trie.

~~~java
class Solution {
    private static class TrieNode {
        TrieNode[] next = new TrieNode[26];
        String word;                        // non-null if a word ends here
    }

    public List<String> findWords(char[][] board, String[] words) {
        TrieNode root = new TrieNode();
        for (String w : words) {            // build the Trie from the word list
            TrieNode cur = root;
            for (char ch : w.toCharArray()) {
                int k = ch - 'a';
                if (cur.next[k] == null) cur.next[k] = new TrieNode();
                cur = cur.next[k];
            }
            cur.word = w;
        }
        List<String> found = new ArrayList<>();
        for (int r = 0; r < board.length; r++)
            for (int c = 0; c < board[0].length; c++)
                dfs(board, r, c, root, found);
        return found;
    }

    private void dfs(char[][] b, int r, int c, TrieNode parent, List<String> found) {
        if (r < 0 || r >= b.length || c < 0 || c >= b[0].length) return;
        char ch = b[r][c];
        if (ch == '#') return;                       // cell is on the current path
        TrieNode node = parent.next[ch - 'a'];
        if (node == null) return;                    // no word has this prefix: prune
        if (node.word != null) {                     // found a word
            found.add(node.word);
            node.word = null;                        // avoid duplicates
        }
        b[r][c] = '#';                               // mark as used
        dfs(b, r + 1, c, node, found);
        dfs(b, r - 1, c, node, found);
        dfs(b, r, c + 1, node, found);
        dfs(b, r, c - 1, node, found);
        b[r][c] = ch;                                // backtrack: restore the old character
        if (node.word == null && isLeaf(node)) parent.next[ch - 'a'] = null; // branch has no more work
    }

    private boolean isLeaf(TrieNode node) {
        for (TrieNode t : node.next) if (t != null) return false;
        return true;
    }
}
~~~

### Complexity
- Building the Trie: O(total length of the words).
- DFS: each cell is a starting point, and each step has at most 3 new directions (you do not step back into the cell you just came from) → upper bound O(m·n·4·3^(L-1)) with L ≤ 10 being the length of the longest word. Thanks to Trie pruning, it is much faster in practice.
- Memory: O(total length of the words) for the Trie, O(L) for the recursion.

### Interview notes
- Storing {{word}} at the node instead of passing a {{StringBuilder}} along the path keeps the code short and avoids building intermediate strings.
- Setting {{word = null}} after a hit is the cheapest way to prevent duplicates (no {{Set}} needed).
- The leaf-deletion step is an important optimisation when many words share a prefix; without it the solution is still correct but slower on large grids.

> Senior tip: The pattern "combine many queries into one structure and traverse it once" (here 3·10^4 words combined into a Trie) is the same idea as multi-pattern matching (Aho-Corasick), used in keyword filtering, WAFs, or scanning logs for many error patterns at once.`,
    follow: [
      'Why do you need to set {{word = null}} after finding a word, and is there another way?',
      'If the grid is very large but the word list is small, should you build the Trie from the words or from the grid?'
    ]
  },
  'algo-115': {
    prompt: `Given a list of **root words** {{dictionary}} and a sentence {{sentence}} whose words are separated by **exactly one** space. Replace each word in the sentence with the **shortest root** that is a prefix of it; a word with no matching root stays unchanged. Return the sentence after the replacement.

### Example
~~~text
Input:  dictionary = ["cat","bat","rat"]
        sentence   = "the cattle was rattled by the battery"
Output: "the cat was rat by the bat"

Input:  dictionary = ["a","b","c"]
        sentence   = "aadsfasf absbs bbab cadsfafs"
Output: "a a b c"
~~~

### Constraints
- {{1 <= dictionary.length <= 1000}}, {{1 <= dictionary[i].length <= 100}}
- {{1 <= sentence.length <= 10^6}}
- Lowercase letters and spaces only; no extra spaces at the start, at the end, or in the middle.`,
    hints: [
      'The crude way: for each word, try every root to see whether it is a prefix: O(number of words × number of roots × length). This can be done better.',
      'Put the roots into a Trie (mark the last node of each root). For each word in the sentence, walk down the Trie character by character.',
      'The first node you meet with the end flag is the **shortest root**: stop right there. If the path breaks, or the word ends before you meet one, keep the word unchanged.'
    ],
    solution: `### Approach
1. Build a Trie from the roots; the last node of each root has {{isRoot = true}}.
2. Split the sentence into words. For each word, walk from the Trie root character by character:
   - There is no child for this character → the word has no root → keep it unchanged.
   - You reach a node with {{isRoot}} → the prefix walked so far is the **shortest root** (because we walk from short to long) → use it.
3. Join the results with a {{StringBuilder}} (never concatenate strings inside a loop).

~~~java
class Solution {
    private static class Node {
        Node[] next = new Node[26];
        boolean isRoot;                         // a root word ends here
    }

    public String replaceWords(List<String> dictionary, String sentence) {
        Node trie = new Node();
        for (String root : dictionary) {        // build the Trie from the roots
            Node cur = trie;
            for (char ch : root.toCharArray()) {
                int k = ch - 'a';
                if (cur.next[k] == null) cur.next[k] = new Node();
                cur = cur.next[k];
            }
            cur.isRoot = true;
        }
        StringBuilder out = new StringBuilder();
        for (String word : sentence.split(" ")) {
            if (out.length() > 0) out.append(' ');
            out.append(shortestRoot(trie, word));
        }
        return out.toString();
    }

    // the shortest root that is a prefix of word, or word itself if there is none
    private String shortestRoot(Node trie, String word) {
        Node cur = trie;
        for (int i = 0; i < word.length(); i++) {
            cur = cur.next[word.charAt(i) - 'a'];
            if (cur == null) return word;          // path breaks: no root
            if (cur.isRoot) return word.substring(0, i + 1); // first root met = shortest
        }
        return word;                               // word exhausted without meeting a root
    }
}
~~~

### Hand trace with "rattled"
The Trie holds c-a-t, b-a-t, r-a-t. Walk r → a → t: the node "rat" has {{isRoot}} → return "rat" without looking at the "tled" part.

### Complexity
- Building the Trie: O(total length of the roots).
- Each word stops after at most {{min(word length, longest root length)}} steps → O(sentence length) in total.
- Memory: O(total length of the roots) for the Trie, O(sentence length) for the output.

### Interview notes
- With roots "a" and "aa", "a" always wins (shortest), thanks to stopping at the first {{isRoot}}.
- Alternative: put the roots into a {{HashSet}} and try prefixes of length 1, 2, 3... for each word; simple, but every {{substring}} creates a new string, which is slower than a Trie for long words.

> Senior tip: This is "longest/shortest prefix match": the same model as IP routing tables or choosing a config rule by URL path. A Trie turns it into a walk of O(key length) that does not depend on the number of rules.`,
    follow: [
      'If you needed the **longest** root instead of the shortest, what would you change?',
      'Compare the Trie solution with the HashSet that tries every prefix, in time and in memory.'
    ]
  },
  'algo-116': {
    prompt: `Given an array of product names {{products}} and a search word {{searchWord}}. The user types {{searchWord}} one character at a time. After **each** character, the system suggests up to **3** products whose prefix matches what has been typed so far; if there are more than 3, take the 3 lexicographically smallest. Return a list of {{searchWord.length()}} suggestion lists (a list may be empty).

### Example
~~~text
Input:  products = ["mobile","mouse","moneypot","monitor","mousepad"], searchWord = "mouse"
Output: [["mobile","moneypot","monitor"],
         ["mobile","moneypot","monitor"],
         ["mouse","mousepad"],
         ["mouse","mousepad"],
         ["mouse","mousepad"]]
Explanation: after sorting: mobile, moneypot, monitor, mouse, mousepad.
"m" and "mo" match all 5 → take the first 3. "mou", "mous", "mouse" match mouse, mousepad.

Input:  products = ["havana"], searchWord = "tatiana"
Output: [[],[],[],[],[],[],[]]
~~~

### Constraints
- {{1 <= products.length <= 1000}}, {{1 <= products[i].length <= 3000}}
- {{1 <= searchWord.length <= 1000}}
- Lowercase letters only; all {{products[i]}} are distinct.`,
    hints: [
      'After **sorting** {{products}}, all products sharing a prefix form one **contiguous run**. The three suggestions are the first three elements of that run.',
      'Find the start of the run with binary search: the first element {{>= prefix}} (lower bound). The longer the prefix, the further right this position can move, so you can keep searching from the previous position.',
      'From that position take at most 3 elements, stopping as soon as you meet an element that does not start with {{prefix}}. Alternative: a Trie where every node pre-stores the 3 smallest words that pass through it.'
    ],
    solution: `### Approach
Sort {{products}}. Strings that share a prefix P sit next to each other, and the smallest of them is the first string {{>= P}} (because every string starting with P is {{>= P}}, and any string {{>= P}} that is smaller than the first one of the run would itself be before the run).

For each prefix {{searchWord[0..i]}}:
1. Binary search for {{start}} = the first index with {{products[start] >= prefix}}.
2. Take {{products[start]}}, {{products[start+1]}}, {{products[start+2]}} as long as they start with {{prefix}}.

~~~java
class Solution {
    public List<List<String>> suggestedProducts(String[] products, String searchWord) {
        String[] sorted = products.clone();        // do not mutate the caller's array
        Arrays.sort(sorted);
        List<List<String>> result = new ArrayList<>();
        StringBuilder prefix = new StringBuilder();
        int start = 0;
        for (char ch : searchWord.toCharArray()) {
            prefix.append(ch);
            String p = prefix.toString();
            start = lowerBound(sorted, p, start);  // longer prefix -> the position only moves forward
            List<String> suggestions = new ArrayList<>();
            for (int i = start; i < sorted.length && suggestions.size() < 3; i++) {
                if (!sorted[i].startsWith(p)) break; // end of the run sharing the prefix
                suggestions.add(sorted[i]);
            }
            result.add(suggestions);
        }
        return result;
    }

    // first index in [from, n) with a[i] >= key
    private int lowerBound(String[] a, String key, int from) {
        int lo = from, hi = a.length;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (a[mid].compareTo(key) < 0) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}
~~~

### Hand trace with example 1
After sorting: [mobile, moneypot, monitor, mouse, mousepad].
- "m": lower bound = 0 → mobile, moneypot, monitor.
- "mo": still 0 → same as above.
- "mou": "monitor" < "mou" < "mouse" → start = 3 → mouse, mousepad.

### Complexity
- Sorting: O(n log n) comparisons, each costing up to O(string length).
- Each typed character: binary search O(log n) comparisons + taking 3 elements → O(L · log n) comparisons in total, L = length of searchWord.
- Memory: O(n) for the sorted array (not counting the result).

### Interview notes
- Compared with a Trie: binary search is simpler and uses less memory; a Trie that pre-stores the top 3 at every node answers each keystroke in O(1), which suits services handling millions of queries over a product set that rarely changes.
- Remember the case where the prefix matches nothing: you still have to append an empty list for that step.

> Senior tip: Real autocomplete usually ranks by popularity rather than dictionary order; then each Trie node stores the top-k by score, and the update runs offline on a schedule instead of on every keystroke.`,
    follow: [
      'If products are constantly added and removed, should you pick a Trie or a sorted array? Why?',
      'How do you rank the suggestions by popularity instead of lexicographic order?'
    ]
  },
  'algo-117': {
    prompt: `Given {{n}} nodes numbered {{0..n-1}} and a list of **undirected** edges {{edges}}. Check whether these edges form **a single tree**: that is, the graph is **connected** (you can travel between every pair of nodes) and has **no cycle**.

### Example
~~~text
Input:  n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]
Output: true

Input:  n = 5, edges = [[0,1],[1,2],[2,3],[1,3],[1,4]]
Output: false   (cycle 1-2-3-1)

Input:  n = 4, edges = [[0,1],[2,3]]
Output: false   (two separate pieces)
~~~

### Constraints
- {{1 <= n <= 2000}}
- {{0 <= edges.length <= 5000}}
- No self-loops and no duplicate edges.`,
    hints: [
      'A tree with n nodes has **exactly n - 1 edges**. A different edge count → definitely not a tree.',
      'If there are exactly n - 1 edges, then "no cycle" is equivalent to "connected". So you only need to check one of the two.',
      'Union-Find: process each edge {{(u, v)}}. If {{find(u) == find(v)}} then u and v were already connected, so adding this edge creates a cycle → false.'
    ],
    solution: `### Approach
Properties of a tree with n nodes: connected, acyclic, and exactly n - 1 edges. Any two of these three imply the third. So:
1. If {{edges.length != n - 1}} → false.
2. Check for cycles with **Union-Find** (Disjoint Set Union): every node starts in its own group. For each edge, if the two ends are already in the same group then this edge closes a loop → false; otherwise merge the two groups.
3. If everything passes → n - 1 edges, no cycle → connected → it is a tree.

**How does Union-Find work?** Each group is a small tree, {{parent[x]}} points to the parent, and the root is the group representative. {{find(x)}} walks up to the root. Two techniques keep the trees shallow: **path compression** (make nodes point straight at, or much closer to, the root as you walk through) and **union by rank** (attach the shorter tree under the taller one).

~~~java
class Solution {
    private int[] parent, rank;

    public boolean validTree(int n, int[][] edges) {
        if (edges.length != n - 1) return false;   // a tree must have exactly n-1 edges
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i; // each node starts as its own group
        for (int[] e : edges) {
            if (!union(e[0], e[1])) return false;  // both ends already in one group -> cycle
        }
        return true;                               // n-1 edges + no cycle = connected
    }

    private int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];         // path compression (halving)
            x = parent[x];
        }
        return x;
    }

    // merge the two groups; return false if they are already the same group
    private boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (rank[ra] < rank[rb]) { int t = ra; ra = rb; rb = t; } // ra is the taller tree
        parent[rb] = ra;                           // attach the shorter tree under the taller one
        if (rank[ra] == rank[rb]) rank[ra]++;
        return true;
    }
}
~~~

### Hand trace with example 2
5 nodes, 5 edges ≠ 4 → false right at step 1. Without step 1: union(0,1), union(1,2), union(2,3), then edge (1,3): find(1) == find(3) → cycle → false.

### Complexity
O(n + E·α(n)) time, where α is the inverse Ackermann function (≤ 4 in practice, treat it as a constant). O(n) memory.

### Interview notes
- Do not forget the case {{n = 1, edges = []}}: a single node is a valid tree.
- Alternative: BFS/DFS from node 0 and count the nodes reached; tree ⇔ exactly n - 1 edges and all n nodes reached.
- Being able to explain why checking two of the three conditions is enough earns you points.

> Senior tip: Union-Find is the standard tool for "dynamic connectivity" problems: Kruskal's minimum spanning tree algorithm, merging duplicate accounts, or detecting a loop while edges are added to a network over time.`,
    follow: [
      'If you solved it with BFS/DFS instead of Union-Find, what would you check?',
      'What do path compression and union by rank buy you, and what is the worst-case complexity without both?'
    ]
  }
});
