/*
 * English translation of js/data/algo.js — task T239. Format: js/core/i18n.js (content overlay).
 * ids: algo-022 algo-023 algo-024 algo-025 algo-026 algo-027
 */
App.i18n.content({
  "algo-022": {
    prompt: `Design an LRU (Least Recently Used) cache with capacity {{capacity}}. Support {{get(key)}} and {{put(key, value)}} in O(1). When capacity is exceeded, remove the least recently used key. {{get}} also counts as "use" and must update the order.

### Example
~~~text
LRUCache cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
cache.get(1);    // 1
cache.put(3, 3); // removes key 2
cache.get(2);    // -1
cache.put(4, 4); // removes key 1
cache.get(1);    // -1
cache.get(3);    // 3
~~~

### Constraints
- {{1 <= capacity <= 3000}}
- {{0 <= key, value <= 10^4}}
- At most {{2 * 10^5}} operations.`,
    hints: [
      `Need O(1) lookup by key: use HashMap. Need order: use doubly linked list.`,
      `HashMap maps key -> node; node sits in a doubly linked list for O(1) deletion and insertion.`,
      `Use head and tail sentinel nodes to avoid handling nulls at ends.`
    ],
    solution: `### Idea
Combine {{HashMap}} and a doubly linked list. Nodes near the head are most recently used; nodes near the tail are least recently used. On every {{get}} or {{put}} with existing key, move the node to the head. When capacity is exceeded, remove the tail node and its corresponding key from the map.

### Interview notes
- {{get}} also updates order — many candidates miss this.
- {{put}} with existing key must update value, not increase size.
- Can use {{LinkedHashMap}} with {{accessOrder = true}} and {{removeEldestEntry}}, which is shorter but demonstrates less understanding of internal structure; mention both.
- If thread-safe is required, add locks; a simple LRU is not thread-safe.

> Senior tip: In real cache systems, pure LRU can suffer from "cache pollution" by sequential scans. Variants like LRU-K, ARC, or TinyLFU (Caffeine) are often better. Mentioning this trade-off during interviews scores points.`,
    follow: [`How to make LRU thread-safe?`, `When should we use LFU instead of LRU?`]
  },
  "algo-023": {
    prompt: `Merge {{k}} sorted singly linked lists into one sorted linked list and return the head. Do not duplicate node values.

### Example
~~~text
Input:  lists = [[1,4,5], [1,3,4], [2,6]]
Output: 1 -> 1 -> 2 -> 3 -> 4 -> 4 -> 5 -> 6

Input:  lists = []
Output: []
~~~

### Constraints
- {{0 <= k <= 10^4}}
- {{0 <= total nodes <= 10^4}}
- {{-10^4 <= Node.val <= 10^4}}

{{ListNode}} is predefined in the harness.`,
    hints: [
      `Sequential merging of lists means re-traversing merged parts — too slow.`,
      `Need a structure to always get the smallest node in {{k}} list heads: min-heap (PriorityQueue).`,
      `After popping a node, push its next node into the heap; use a dummy node to chain results.`
    ],
    solution: `### Idea
Put all non-null heads into a {{PriorityQueue}} based on value. Repeatedly pop the smallest node, append to result, then push {{node.next}} into the heap if it exists.

Each node is pushed/popped exactly once, each heap operation is O(log k), total time O(N log k) where N is the total number of nodes.

### Interview notes
- Don't use {{a.val - b.val}} in comparator to avoid overflow; use {{Integer.compare}}.
- If {{k}} is large and lists are short, divide-and-conquer merging pairs is also O(N log k) and uses less heap memory.
- Ask if lists can be empty; handle null elements before adding to heap.

> Senior tip: With external merge (files larger than RAM), you cannot keep all heads in the heap if the number of files is too large; in that case, use multi-pass merge with limited fan-in, e.g., 64 files per pass. This is a very practical follow-up.`,
    follow: [`Compare heap vs. divide-and-conquer when k is very large.`, `How to design if the total data exceeds RAM?`]
  },
  "algo-024": {
    prompt: `Return the maximum depth of a binary tree, defined as the number of nodes on the longest path from root to leaf. An empty tree has depth 0.

### Example
~~~text
Input:  root = [3,9,20,null,null,15,7]
Output: 3

Input:  root = []
Output: 0
~~~

### Constraints
- {{0 <= number of nodes <= 10^4}}
- {{-100 <= Node.val <= 100}}

{{TreeNode}} is predefined in the harness.`,
    hints: [
      `The depth of a tree is 1 plus the greater depth of its two subtrees.`,
      `This is a natural recursive definition; base case is a null node.`,
      `If stack overflow on skewed trees is a concern, use BFS by level.`
    ],
    solution: `### Idea
Recursive: empty tree has depth 0; otherwise return 1 + max(depth of left, depth of right). Each node is visited exactly once.

### Interview notes
- On fully skewed trees (like a linked list) with hundreds of thousands of nodes, recursion may overflow the stack; BFS or tail-recursive approaches are safer.
- Ask if "depth" counts nodes or edges — there's a difference of 1.
- Empty tree returns 0, not 1.

> Senior tip: In production, tree depth is often used to assess stack risk when serializing/deserializing deeply nested JSON. With untrusted data, always set depth limits rather than relying on infinite recursion.`,
    follow: [`How to calculate depth using BFS?`, `What is needed to check if a tree is balanced?`]
  },
  "algo-025": {
    prompt: `Invert a binary tree, swapping left and right subtrees for every node. Return the root after inversion.

### Example
~~~text
Input:       4
           /   \\
          2     7
         / \\   / \\
        1   3 6   9

Output:      4
           /   \\
          7     2
         / \\   / \\
        9   6 3   1
~~~

### Constraints
- {{0 <= number of nodes <= 100}}
- {{-100 <= Node.val <= 100}}

{{TreeNode}} is predefined in the harness.`,
    hints: [
      `At each node, just swap left and right pointers.`,
      `After swapping, continue inverting both subtrees — the order of inverting doesn't matter.`,
      `Base case is a null node; return null.`
    ],
    solution: `### Idea
Traverse the tree and swap {{left}} and {{right}} at each node. Can be done recursively (DFS) or BFS with a queue. Recursion is the shortest and most natural.

### Interview notes
- Must save the pointer to a temporary variable before assignment, otherwise one branch is lost.
- Can swap before recursing or after; the result is the same.
- For very deep trees, use BFS to avoid deep recursion.

> Senior tip: This is simple but frequently used to check if a candidate truly understands pointers or just memorizes code. Draw each step with a 3-node tree and clearly state the swap timing.`,
    follow: [`How to write tree inversion using BFS?`, `How to check if two trees are mirror images of each other?`]
  },
  "algo-026": {
    prompt: `Return the level-order traversal of a binary tree's nodes (from top to bottom, each level in its own list).

### Example
~~~text
Input:  root = [3,9,20,null,null,15,7]
Output: [[3], [9,20], [15,7]]
~~~

### Constraints
- {{0 <= number of nodes <= 2000}}
- {{-1000 <= Node.val <= 1000}}

{{TreeNode}} is predefined in the harness.`,
    hints: [
      `Level-order traversal is a classic BFS problem with a queue.`,
      `Need to separate levels: record {{size = queue.size()}} before processing that level.`,
      `Only add non-null children to the queue; if nulls are added, special handling is needed.`
    ],
    solution: `### Idea
Initialize queue with root. In each loop, get current queue size — this is the number of nodes at this level. Process exactly {{size}} nodes, adding their children to the queue for the next level.

### Interview notes
- If you forget to capture {{size}} before the for-loop, you'll mix levels.
- Can use a {{List}} as a queue with a head index to avoid allocations, but {{ArrayDeque}} is the standard choice.
- Ask: bottom-up traversal just requires reversing the result or adding to the front of the list.

> Senior tip: BFS by level is the foundation for many practical tasks: state propagation in a graph, shortest path calculation in unweighted graphs, or rendering hierarchical tree views. Remember that BFS needs O(width) memory, which can be much larger than DFS's O(height).`,
    follow: [`How to modify for zigzag traversal?`, `How to calculate the maximum width of a tree?`]
  },
  "algo-027": {
    prompt: `Given a binary tree and two nodes {{p}} and {{q}} (both guaranteed to exist in the tree), find their Lowest Common Ancestor (LCA). A node is also considered an ancestor of itself.

### Example
~~~text
Input:  root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1
Output: 3

Input:  root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 4
Output: 5
~~~

### Constraints
- {{2 <= number of nodes <= 10^5}}
- {{-10^9 <= Node.val <= 10^9}}
- Node values are unique.

{{TreeNode}} is predefined in the harness.`,
    hints: [
      `If p or q is found in a branch, that branch might contain the LCA.`,
      `If p and q are in different subtrees of a node, that node is the LCA.`,
      `Use DFS to return found node; if both branches return non-null, the current node is the LCA.`
    ],
    solution: `### Idea
DFS from root. If current node is null, p, or q, return it. Recursively search both branches. If both branches return non-null nodes, p and q are on opposite sides, so current node is LCA. If only one branch has a result, return that result.

### Interview notes
- This approach assumes both p and q exist. If nodes might be missing, need an extra step to count or verify after search.
- Can use parent map + set to find LCA bottom-up; O(n) memory but easy to understand.
- With BST, can leverage order to find in O(h) without searching both branches.

> Senior tip: LCA appears in problems like access control in hierarchical organizations, or finding the common prefix range of two strings in a trie. Master both the generic tree and BST variants to answer follow-up questions quickly.`,
    follow: [`How to optimize if it's a BST?`, `How to handle the case where p or q might not exist?`]
  }
});

