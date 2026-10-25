/*
 * English translation of js/data/algo.js — task T238. Format: js/core/i18n.js (content overlay).
 * ids: algo-015 algo-016 algo-017 algo-018 algo-019 algo-020 algo-021
 */
App.i18n.content({
  'algo-015': {
    prompt: `Given an array {{temperatures}} representing daily temperatures. For each day, determine how many days you have to wait until a warmer day; if none, record 0.

### Example
~~~text
Input:  temperatures = [73,74,75,71,69,72,76,73]
Output: [1,1,4,2,1,1,0,0]
~~~

### Constraints
- {{1 <= temperatures.length <= 10^5}}
- {{30 <= temperatures[i] <= 100}}`,
    hints: [
      'For each day, we need the closest next day with a higher temperature. This is a "next greater element" problem.',
      'Use a stack to store indices of days for which we haven\'t found a warmer day yet, keeping temperatures in descending order.',
      'When encountering a higher temperature, pop the stack and record the distance; repeat until the top is greater or equal.'
    ],
    solution: `### Idea
Maintain a decreasing monotonic stack: indices in the stack have temperatures in descending order from bottom to top. When day {{i}} is warmer than the top, it is the nearest warmer day for the top; record {{i - j}} and pop.

Each index is pushed and popped at most once, making the total time O(n).

~~~java
class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int n = temperatures.length;
        int[] answer = new int[n];
        Deque<Integer> stack = new ArrayDeque<>();   // indices, temperatures decreasing
        for (int i = 0; i < n; i++) {
            while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {
                int j = stack.pop();
                answer[j] = i - j;
            }
            stack.push(i);
        }
        return answer;
    }
}
~~~

### Interview notes
- Use {{>}} or {{>=}}? Since the requirement is "warmer" (strictly greater), use {{>}}; if "warmer or equal", change the condition.
- The stack stores indices, not temperatures, because we need to calculate the distance between days.
- You could iterate from right to left with "next greater"; choose one direction and explain it consistently.

> Senior tip: Monotonic stack is a pattern that appears frequently in financial problems (times when prices exceed previous highs) and observability (times when latency exceeds thresholds). Remember the stack invariant rather than memorizing the code.`,
    follow: ['What if we needed to find the nearest warmer day in both directions?', 'If the array is updated in a streaming fashion, what data structure would be appropriate?']
  },
  'algo-016': {
    prompt: `Given an array {{heights}} representing the heights of bars with width 1. Find the largest rectangle area contained within the histogram.

### Example
~~~text
Input:  heights = [2,1,5,6,2,3]
Output: 10
Explanation: select bars 5 and 6, height 5, width 2.

Input:  heights = [2,4]
Output: 4
~~~

### Constraints
- {{1 <= heights.length <= 10^5}}
- {{0 <= heights[i] <= 10^4}}`,
    hints: [
      'For each bar, if you know the nearest shorter bar on the left and right, you can calculate the maximum width of the rectangle with that bar\'s height.',
      'Use an increasing monotonic stack to find the nearest smaller boundaries on both sides in one pass.',
      'Add a sentinel bar with height 0 at the end to ensure all remaining bars in the stack are popped and processed.'
    ],
    solution: `### Idea
Maintain a stack of indices with increasing heights. When bar {{i}} is shorter than the bar at the top of the stack, the top bar can no longer extend to the right. Pop it; the width is from the index immediately after the new top to {{i - 1}}.

Use a sentinel {{i == n}} with height 0 to process the remainder after the loop.

~~~java
class Solution {
    public int largestRectangleArea(int[] heights) {
        int n = heights.length;
        Deque<Integer> stack = new ArrayDeque<>();
        int best = 0;
        for (int i = 0; i <= n; i++) {
            int cur = (i == n) ? 0 : heights[i];   // sentinel
            while (!stack.isEmpty() && heights[stack.peek()] > cur) {
                int h = heights[stack.pop()];
                int left = stack.isEmpty() ? 0 : stack.peek() + 1;
                best = Math.max(best, h * (i - left));
            }
            if (i < n) stack.push(i);
        }
        return best;
    }
}
~~~

### Interview notes
- When heights are equal, using {{>}} keeps the left bar and still calculates the width correctly; using {{>=}} also works but requires explanation.
- The area might exceed {{int}} if height and width are large; consider {{long}}.
- Don\'t forget bars with height 0 — they are still valid boundaries.

> Senior tip: This problem often appears as "largest rectangle in binary matrix". In that case, each row is a histogram and you accumulate heights column-wise; the stack pattern remains the same, just with an additional outer loop.`,
    follow: ['Extend this to a binary matrix to find the largest rectangle.', 'If we needed to return the coordinates of the rectangle, how would we modify this?']
  },
  'algo-017': {
    prompt: `Given a sorted array {{nums}} in ascending order and an integer {{target}}. Return the index of {{target}} in the array, or -1 if not found. Requires O(log n) complexity.

### Example
~~~text
Input:  nums = [-1,0,3,5,9,12], target = 9
Output: 4

Input:  nums = [-1,0,3,5,9,12], target = 2
Output: -1
~~~

### Constraints
- {{1 <= nums.length <= 10^4}}
- {{-10^4 < nums[i], target < 10^4}}
- All elements in {{nums}} are unique.`,
    hints: [
      'With each comparison with the middle element, one half of the array definitely does not contain the target.',
      'Use a closed interval {{[lo, hi]}} and the condition {{while (lo <= hi)}} to avoid missing boundary elements.',
      'Calculate mid as {{lo + (hi - lo) / 2}} to avoid overflow with large indices.'
    ],
    solution: `### Idea
Maintain the search interval {{[lo, hi]}}. Compare {{nums[mid]}} with target: if smaller, target is on the right; if larger, it is on the left; if equal, return immediately.

Choose a clear interval convention and stay consistent. Here, we use a closed interval, so {{lo = mid + 1}} and {{hi = mid - 1}}.

~~~java
class Solution {
    public int search(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) {
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }
        return -1;
    }
}
~~~

### Interview notes
- Avoid {{(lo + hi) / 2}} with huge arrays as it can overflow {{int}}.
- If using a half-open interval {{[lo, hi)}}, the condition is {{lo < hi}} and the update is {{hi = mid}}; do not mix these two conventions.
- Ask if the array contains duplicate elements; if it does, the problem might require finding the left/right bound.

> Senior tip: Binary search is where off-by-one errors appear most frequently in interviews. I always ask candidates to write out the invariant "target is in [lo, hi] if it exists" and check with 1-element and 2-element arrays before concluding.`,
    follow: ['How would you modify this to find the insertion position (lower bound)?', 'If there are duplicate elements, how do you find the left and right boundaries?']
  },
  'algo-018': {
    prompt: `The array {{nums}} was initially sorted in ascending order and contained unique elements, then it was rotated at some unknown pivot. Given {{target}}, return its index or -1 if not present. Requires O(log n).

### Example
~~~text
Input:  nums = [4,5,6,7,0,1,2], target = 0
Output: 4

Input:  nums = [4,5,6,7,0,1,2], target = 3
Output: -1
~~~

### Constraints
- {{1 <= nums.length <= 5000}}
- {{-10^4 <= nums[i], target <= 10^4}}
- All elements are unique.`,
    hints: [
      'Despite being rotated, at each step, at least one half of the array is sorted.',
      'Compare {{nums[lo]}} with {{nums[mid]}} to determine which half is sorted.',
      'If the target lies within that sorted half, search there, otherwise search in the other half.'
    ],
    solution: `### Idea
Still use binary search. At each step, identify whether the left or right half is sorted:

- If {{nums[lo] <= nums[mid]}}: the left half is sorted. Check if target lies within {{[nums[lo], nums[mid])}}.
- Otherwise: the right half is sorted. Check if target lies within {{(nums[mid], nums[hi]]}}.

This allows us to discard half at each step, maintaining O(log n).

~~~java
class Solution {
    public int search(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return mid;
            if (nums[lo] <= nums[mid]) {              // left half sorted
                if (target >= nums[lo] && target < nums[mid]) {
                    hi = mid - 1;
                } else {
                    lo = mid + 1;
                }
            } else {                                   // right half sorted
                if (target > nums[mid] && target <= nums[hi]) {
                    lo = mid + 1;
                } else {
                    hi = mid - 1;
                }
            }
        }
        return -1;
    }
}
~~~

### Interview notes
- Must use {{<=}} in the condition {{nums[lo] <= nums[mid]}} to handle arrays with only 1-2 elements.
- If the array contains duplicate elements, identifying the sorted half can be ambiguous; worst case is O(n), which should be noted.
- Quickly test with non-rotated arrays, arrays rotated by 1 element, and targets at both ends.

> Senior tip: This problem tests the ability to maintain an invariant under complex conditions. In practice, "sorted then appended" data is very common (logs by time, ring buffers); understanding this problem helps you choose the right structure instead of resorting to linear search.`,
    follow: ['How does the complexity change if the array contains duplicate elements?', 'How do you find the minimum element in a rotated array?']
  },
  'algo-019': {
    prompt: `There are {{n}} piles of bananas with {{piles[i]}} bananas. Each hour, Koko chooses a pile and eats at most {{k}} bananas; if the pile has fewer than {{k}}, she eats them all and does not eat from another pile in that hour. Find the minimum speed {{k}} to eat all bananas within {{h}} hours.

### Example
~~~text
Input:  piles = [3,6,7,11], h = 8
Output: 4

Input:  piles = [30,11,23,4,20], h = 5
Output: 30
~~~

### Constraints
- {{1 <= piles.length <= 10^4}}
- {{piles.length <= h <= 10^9}}
- {{1 <= piles[i] <= 10^9}}`,
    hints: [
      'If eating at speed {{k}} works, then any higher speed also works. This monotonicity allows binary search on {{k}}.',
      'The lower bound is 1, the upper bound is the largest pile (eating each pile in 1 hour).',
      'Check function: sum of {{ceil(pile / k)}} over piles must be <= h. Use integer division {{(pile + k - 1) / k}}.'
    ],
    solution: `### Idea
Binary search on the value of {{k}}, not on the index. For each {{k}}, calculate the required hours. If <= h, try a smaller {{k}}; otherwise, increase {{k}}.

This is a form of "binary search on answer": the result space is monotonic, and each check takes O(n).

~~~java
class Solution {
    public int minEatingSpeed(int[] piles, int h) {
        int lo = 1, hi = 0;
        for (int p : piles) hi = Math.max(hi, p);
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (canFinish(piles, mid, h)) {
                hi = mid;
            } else {
                lo = mid + 1;
            }
        }
        return lo;
    }

    private boolean canFinish(int[] piles, int speed, int h) {
        long hours = 0;
        for (int p : piles) {
            hours += (p + (long) speed - 1) / speed;   // ceil(p / speed)
            if (hours > h) return false;
        }
        return true;
    }
}
~~~

### Interview notes
- Total hours might exceed {{int}}; use {{long}} and exit early if it exceeds {{h}}.
- The bound {{lo < hi}} with update {{hi = mid}} is standard for "find minimum that satisfies"; do not use {{lo <= hi}} as it can lead to infinite loops.
- Clarify: can she leave off in the middle of an hour after eating a pile? The standard problem states she can only eat from one pile per hour, and the remainder does not carry over to other piles.

> Senior tip: "Binary search on answer" is very useful for tuning: finding the minimum batch size to maintain throughput, finding the minimum timeout that still keeps error rates acceptable. The prerequisite is always monotonicity — prove it before coding.`,
    follow: ['How does the problem change if she can eat multiple piles per hour?', 'How do you find both the minimum speed and the list of optimal speeds?']
  },
  'algo-020': {
    prompt: `Given the head of a singly linked list, reverse the list and return the new head. Do not create a new list with copied values; you must change the links between nodes.

### Example
~~~text
Input:  1 -> 2 -> 3 -> 4 -> 5
Output: 5 -> 4 -> 3 -> 2 -> 1
~~~

### Constraints
- {{0 <= number of nodes <= 5000}}
- {{-5000 <= Node.val <= 5000}}

{{ListNode}} is pre-defined in the harness (along with helpers to build and compare lists).`,
    hints: [
      'We need to reverse each {{next}} pointer. But if you reverse it immediately, you will lose the rest of the list.',
      'Use three pointers: {{prev}}, {{cur}}, {{next}}; save {{next}} before reversing {{cur.next}}.',
      'After traversing, {{prev}} is the new head; {{cur}} is null.'
    ],
    solution: `### Idea
Traverse the list once. At each node, save the next node, point {{cur.next}} to {{prev}}, then advance both pointers. When finished, {{prev}} is the new head.

This is an in-place operation, no new nodes are allocated.

~~~java
class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode cur = head;
        while (cur != null) {
            ListNode next = cur.next;   // keep the rest
            cur.next = prev;            // reverse link
            prev = cur;
            cur = next;
        }
        return prev;
    }
}
~~~

### Interview notes
- An empty list returns null; a single node list returns itself — the loop handles both correctly.
- If asked for recursion, the code is shorter but takes O(n) stack, which can overflow with very long lists.
- Ask: is it allowed to change values instead of links? Usually the problem requires changing links to demonstrate pointer understanding.

> Senior tip: In production code, reversing a linked list appears when reversing event history or handling reverse recursion. However, for very large lists, consider arrays or structures with random access instead of linked lists, as cache locality is poor.`,
    follow: ['How do you reverse the segment from position m to n?', 'How do you check for a palindrome on a linked list?']
  },
  'algo-021': {
    prompt: `Given two sorted singly linked lists in ascending order. Merge them into a new sorted list, by connecting the existing nodes (do not create new nodes with values). Return the head of the resulting list.

### Example
~~~text
Input:  l1 = 1 -> 2 -> 4, l2 = 1 -> 3 -> 4
Output: 1 -> 1 -> 2 -> 3 -> 4 -> 4

Input:  l1 = null, l2 = 0
Output: 0
~~~

### Constraints
- {{0 <= nodes per list <= 50}}
- {{-100 <= Node.val <= 100}}
- Both lists are sorted in ascending order.

{{ListNode}} is pre-defined in the harness (along with helpers to build and compare lists).`,
    hints: [
      'Similar to the merge step in merge sort: compare the heads of both lists and take the smaller node.',
      'Use a dummy node to avoid special handling for the first element.',
      'After one list is exhausted, connect the remainder of the other list — no need to copy.'
    ],
    solution: `### Idea
Create {{dummy}} and pointer {{tail}}. At each step, compare {{l1.val}} and {{l2.val}}, connect the smaller node after {{tail}}, then advance the corresponding pointer. When one list is exhausted, connect the remainder of the other.

~~~java
class Solution {
    public ListNode mergeTwoLists(ListNode l1, ListNode l2) {
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        while (l1 != null && l2 != null) {
            if (l1.val <= l2.val) {
                tail.next = l1;
                l1 = l1.next;
            } else {
                tail.next = l2;
                l2 = l2.next;
            }
            tail = tail.next;
        }
        tail.next = (l1 != null) ? l1 : l2;
        return dummy.next;
    }
}
~~~

### Interview notes
- Use {{<=}} to maintain stability when values are equal — important if nodes contain auxiliary data.
- No need to traverse the remainder; pointer connection is sufficient, saving O(n).
- Ask if the list is allowed to be modified in-place; the standard problem allows connecting nodes.

> Senior tip: Merging two sorted lists is the foundation of external merge sort. When merging sorted log files, this same logic applies using iterators/buffers instead of nodes, but the principle "take the smaller, connect the remainder" remains unchanged.`,
    follow: ['How can we optimize merging k sorted lists?', 'What if the list is very long and does not fit in RAM?']
  }
});
