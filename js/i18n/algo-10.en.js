/*
 * English translation of js/data/algo.js — task T485. Format: js/core/i18n.js (content overlay).
 * ids: algo-081 algo-082 algo-083
 */
App.i18n.content({
  'algo-081': {
    prompt: `Given two sorted arrays {{nums1}} and {{nums2}}, find the median of all their merged elements. The time complexity must be O(log(min(m,n))).

### Examples
~~~text
Input: nums1 = [1,3], nums2 = [2]  -> Output: 2.0
Input: nums1 = [1,2], nums2 = [3,4] -> Output: 2.5
~~~

### Constraints
- {{0 <= nums1.length, nums2.length <= 1000}}
- {{-10^6 <= nums1[i], nums2[i] <= 10^6}}`,
    hints: [
      'Merging the two arrays and then finding the median is O(m+n), which does not meet the requirement.',
      'Use binary search on the shorter array to find a cut point where the left half and the right half contain the same total number of elements.',
      'For each cut, check the condition {{max(leftA, leftB) <= min(rightA, rightB)}}; adjust the binary search based on the values at the boundary.'
    ],
    solution: `### Approach
**The easy way:** merge the two arrays (like Merge Sort) and take the middle element → O(m+n). Correct, but it does not meet O(log(min(m,n))).

**Reframe the question:** the median splits the merged set into two equal halves where every element of the left half ≤ every element of the right half. Look for a **cut** in each array:
- Cut nums1 at {{i}}: nums1[0..i-1] goes to the left half, nums1[i..] to the right half.
- Cut nums2 at {{j}} the same way.
- The left half must contain exactly {{half = (m + n + 1) / 2}} elements (when the total is odd, the left half has one extra), so {{j = half - i}}. Choosing i fixes j.

The cut is **correct** when the largest element on the left does not exceed the smallest element on the right. Because each array is already sorted, we only need to check the two cross boundaries:
- {{maxLeftA <= minRightB}} (nums1[i-1] ≤ nums2[j])
- {{maxLeftB <= minRightA}} (nums2[j-1] ≤ nums1[i])

If {{maxLeftA > minRightB}}: we took too many elements from nums1 → decrease i. Otherwise increase i. This is a binary search over i ∈ [0, m].

When the cut touches an edge (i = 0 or i = m) one side has no element; use {{Integer.MIN_VALUE}}/{{MAX_VALUE}} as sentinels so the comparison always holds without a separate if.

Hand-run nums1=[1,2], nums2=[3,4]: m=n=2, half=2.
~~~text
lo=0,hi=2: i=1, j=1: leftA=1, rightA=2, leftB=3, rightB=4
           leftB 3 > rightA 2 -> took too few from nums1 -> lo=2
lo=2,hi=2: i=2, j=0: leftA=2, rightA=+inf, leftB=-inf, rightB=3
           2 <= 3 and -inf <= +inf -> correct. Even total:
           (max(2,-inf) + min(+inf,3)) / 2 = (2+3)/2 = 2.5
~~~

~~~java
class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        if (nums1.length > nums2.length) {               // always binary search on the shorter array
            int[] t = nums1; nums1 = nums2; nums2 = t;
        }
        int m = nums1.length, n = nums2.length;
        int half = (m + n + 1) / 2;                      // number of elements in the left half
        int lo = 0, hi = m;
        while (lo <= hi) {
            int i = (lo + hi) / 2;                       // cut nums1: i elements go to the left
            int j = half - i;                            // nums2 fills the rest of half
            int leftA  = (i == 0) ? Integer.MIN_VALUE : nums1[i - 1];
            int rightA = (i == m) ? Integer.MAX_VALUE : nums1[i];
            int leftB  = (j == 0) ? Integer.MIN_VALUE : nums2[j - 1];
            int rightB = (j == n) ? Integer.MAX_VALUE : nums2[j];
            if (leftA <= rightB && leftB <= rightA) {    // correct cut
                if ((m + n) % 2 == 1) return Math.max(leftA, leftB);
                return ((long) Math.max(leftA, leftB) + Math.min(rightA, rightB)) / 2.0;
            } else if (leftA > rightB) {
                hi = i - 1;                              // too many elements from nums1
            } else {
                lo = i + 1;                              // too few elements from nums1
            }
        }
        throw new IllegalArgumentException("input arrays must be sorted");
    }
}
~~~

### Why is j always valid?
Because m ≤ n and 0 ≤ i ≤ m, {{j = half - i}} lies in [0, n]. If you binary search on the longer array instead, j can go negative → ArrayIndexOutOfBounds. That is why we swap so nums1 is the shorter array.

### Interview notes
- Odd total: the median is {{max(leftA, leftB)}} (the left half has one extra element). Even total: the average of max-left and min-right.
- Cast to {{long}} before adding to avoid overflow when values are near {{Integer.MAX_VALUE}}; divide by {{2.0}} to get a real number.
- This problem is very easy to get wrong at the boundaries; practice by hand with one empty array and two arrays of different lengths.

> Senior tip: If the data is a continuous stream and you need a dynamic median, use two heaps (a max-heap for the lower half and a min-heap for the upper half) kept balanced in size: insert O(log n), median O(1). In metrics systems people usually accept an approximate median (t-digest, HdrHistogram) to save memory.`,
    follow: ['If one array is very long and the other very short, is binary search still efficient?', 'Can this be extended to k medians across multiple arrays?']
  },
  'algo-082': {
    prompt: `Evaluate a mathematical expression containing integer digits, plus (+), minus (-), and parentheses ( ). The expression may start with a minus sign. There is no multiplication or division.

### Examples
~~~text
Input: s = "(1+(4+5+2)-3)+(6+8)"
Output: 23
Input: s = "- (3 + (4 + 5))"
Output: -12
~~~

### Constraints
- {{1 <= s.length <= 3 * 10^4}}
- {{s consists only of digits, '+', '-', '(', ')', and spaces}}`,
    hints: [
      'Parentheses change the signs of the numbers inside. You need to store the current sign and the accumulated sum for each level of parentheses.',
      'Use a stack to push the accumulated sum and the current sign when you meet an opening parenthesis; on a closing parenthesis, compute the inner sum and add it to the parent sum.',
      'Spaces do not matter; you can skip them or handle them naturally by reading character by character.'
    ],
    solution: `### Approach
Only addition and subtraction exist, so the value of the expression is the sum of the numbers, each carrying a **sign** (+1 or -1). The only difficulty is parentheses: {{-(3+4)}} flips the sign of every number inside.

Walk through the characters one by one and keep:
- {{result}}: the running total of the **current parenthesis level**.
- {{sign}}: the sign applied to the number being read (+1/-1).
- {{number}}: the number currently being read (it may have several digits).

Rules:
1. **Digit:** {{number = number * 10 + digit}} (reading "123" goes 1 → 12 → 123).
2. **'+' or '-':** the previous number is complete → {{result += sign * number}}; set the new sign; number = 0.
3. **'(':** a sub-expression starts. **Save** the current {{result}} and {{sign}} on the stack (to come back later), then reset result = 0, sign = +1.
4. **')':** add the last number to result (which now holds the sub-expression value). Restore the saved sign from before the parenthesis and the outer result: {{result = outerResult + signBeforeParen * result}}.
5. **Spaces:** skip them.
At the end, add the last unfinished number: {{result + sign * number}}.

A leading minus (or a minus right after '(') works naturally: at that point number = 0, so adding 0 to result and then setting sign = -1 is enough.

Hand-run "1-(-2)":
~~~text
'1'  number=1
'-'  result=1, sign=-1, number=0
'('  push result=1, push sign=-1; result=0, sign=+1
'-'  result=0+1*0=0, sign=-1
'2'  number=2
')'  result=0+(-1)*2=-2; saved sign=-1, saved result=1 -> result = 1 + (-1)*(-2) = 3
end: 3 + sign*0 = 3
~~~

~~~java
class Solution {
    public int calculate(String s) {
        Deque<Integer> stack = new ArrayDeque<>();   // stores (result, sign) of the outer level
        int result = 0, sign = 1, number = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (Character.isDigit(c)) {
                number = number * 10 + (c - '0');    // multi-digit number
            } else if (c == '+' || c == '-') {
                result += sign * number;             // commit the number just read
                sign = (c == '+') ? 1 : -1;
                number = 0;
            } else if (c == '(') {
                stack.push(result);                  // save the outer total
                stack.push(sign);                    // save the sign before '('
                result = 0;
                sign = 1;
            } else if (c == ')') {
                result += sign * number;             // value of the expression inside the parentheses
                number = 0;
                int signBefore = stack.pop();        // popping reverses the push order: sign first
                int outer = stack.pop();
                result = outer + signBefore * result;
            }
            // spaces: skipped
        }
        return result + sign * number;               // the final number is still pending
    }
}
~~~

### Interview notes
- Use {{ArrayDeque}} instead of {{java.util.Stack}} (Stack extends Vector, is synchronized, and is a legacy API).
- Common bugs: forgetting to add the final number after the loop; forgetting to reset number after ')'.
- The stack only grows as deep as the parenthesis nesting, so space is O(n) in the worst case.

> Senior tip: With multiplication/division and operator precedence, use the Shunting-yard algorithm (two stacks: numbers and operators) or a recursive descent parser. In production, do not hand-roll a parser for user-supplied expressions when a proven library exists; and always limit length/depth to prevent DoS attacks.`,
    follow: ['If multiplication and division were added, how would you adjust the stack?', 'Can this be solved with recursion instead of a stack?']
  },
  'algo-083': {
    prompt: `Given a string containing only opening and closing parentheses {{'('}} and {{')'}}, find the length of the longest valid substring (brackets properly matched and contiguous).

### Examples
~~~text
Input: s = "(()"
Output: 2
Input: s = ")()())"
Output: 4
Input: s = ""
Output: 0
~~~

### Constraints
- {{0 <= s.length <= 3 * 10^4}}`,
    hints: [
      'A valid substring must start with ( and end with ), and everything inside must also be valid.',
      'Use a stack to store the indices of unmatched opening parentheses; when you meet a closing parenthesis, compute the length if there is a matching opening one.',
      'If the stack is empty when you meet a closing parenthesis, push the current index onto the stack as a new base; the valid length is the current index minus the stack top.'
    ],
    solution: `### Approach
The stack stores **indices**, not characters. The key invariant: **the bottom of the stack is always the index of the last "barrier"**, i.e. the position right before the valid run that may be forming. Initially there is no barrier, so push {{-1}}.

Scan i from left to right:
- On {{'('}}: push i (an opening bracket waiting to be closed).
- On {{')'}}: pop one element (pair it with the nearest opening bracket).
  - If the stack is **empty** after the pop: we just popped the barrier, meaning this ')' has no '(' to pair with → it becomes the new barrier: push i.
  - If the stack is **not empty**: everything after {{stack.peek()}} up to i is valid, with length {{i - stack.peek()}}.

Why {{i - peek}}? The stack top is the index of the nearest **unpaired** character before us (an opening bracket still open, or a barrier). Everything between it and i has already been paired → the run is contiguous and valid.

Hand-run ")()())":
~~~text
init stack [-1]
i=0 ')': pop -1 -> empty -> push 0       stack [0]
i=1 '(': push 1                          stack [0,1]
i=2 ')': pop 1 -> peek 0 -> len 2-0=2    stack [0]
i=3 '(': push 3                          stack [0,3]
i=4 ')': pop 3 -> peek 0 -> len 4-0=4    stack [0]   best=4
i=5 ')': pop 0 -> empty -> push 5        stack [5]
answer 4
~~~

~~~java
class Solution {
    public int longestValidParentheses(String s) {
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(-1);                          // fake barrier: before index 0
        int best = 0;
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) == '(') {
                stack.push(i);                   // opening bracket waiting to be paired
            } else {
                stack.pop();                     // pair with the nearest '(' (or remove the barrier)
                if (stack.isEmpty()) {
                    stack.push(i);               // extra ')': becomes the new barrier
                } else {
                    best = Math.max(best, i - stack.peek()); // valid run ending at i
                }
            }
        }
        return best;
    }
}
~~~

### O(1) memory alternative
Scan left → right counting {{open}} and {{close}}: when they are equal update with 2·close; when close > open reset both. Then scan right → left with the opposite condition (to catch cases like "(()" that the first pass misses).

### Interview notes
- Every index is pushed and popped at most once → O(n).
- Use {{ArrayDeque}} instead of the legacy {{Stack}}.
- Common bug: counting only matched pairs (which gives 4 for ")()())" correctly, but gives 4 for "()(()" which is wrong — the answer is 2 because the two valid runs are not adjacent).

> Senior tip: The "stack of indices + barrier" technique is reused in many problems about contiguous runs (largest rectangle in histogram, next greater element). When explaining, state the stack invariant first; interviewers appreciate it when you can prove why the code is correct.`,
    follow: ['If square and curly brackets were added, how would you fix this?', 'Can DP be used instead of a stack? What is the complexity?']
  }
});
