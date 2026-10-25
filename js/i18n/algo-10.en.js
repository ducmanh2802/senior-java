/*
 * English translation of js/data/algo.js — task T245. Format: js/core/i18n.js (content overlay).
 * ids: algo-081 algo-082 algo-083
 */
App.i18n.content({
  'algo-081': {
    prompt: `Given two sorted arrays {{nums1}} and {{nums2}}, return the median of the two sorted arrays. The overall run time complexity should be O(log(min(m,n))).

### Examples
~~~text
Input: nums1 = [1,3], nums2 = [2]  -> Output: 2.0
Input: nums1 = [1,2], nums2 = [3,4] -> Output: 2.5
~~~

### Constraints
- {{0 <= nums1.length, nums2.length <= 1000}}
- {{-10^6 <= nums1[i], nums2[i] <= 10^6}}`,
    hints: [
      'Merging both arrays and finding the median is O(m+n), which does not meet the requirements.',
      'Use binary search on the shorter array to find a partition point such that the left half and right half have equal total elements.',
      'For each partition point, check the condition {{max(leftA, leftB) <= min(rightA, rightB)}}; adjust binary search based on comparing values at the boundary.'
    ],
    solution: `### Concept
Partition both arrays into two halves such that the number of elements in the left half is equal to or one more than the right half (when total is odd). Use binary search on the shorter array to find the partition point {{i}}; the corresponding partition point on the longer array is {{(m+n+1)//2 - i}}.

If {{max(leftA, leftB) <= min(rightA, rightB)}}, the correct partition is found; otherwise, adjust binary search based on boundary values.

~~~java
class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        int m = nums1.length, n = nums2.length;
        if (m > n) { int[] tmpA = nums1; nums1 = nums2; nums2 = tmpA; m = nums1.length; n = nums2.length; }
        int left = 0, right = m, halfLen = (m + n + 1) / 2;
        while (left <= right) {
            int i = (left + right) / 2; // cut in the shorter array
            int j = halfLen - i;        // cut in the longer array
            // Sentinels avoid extra branches when a cut is at an array edge
            int maxLeftA = (i == 0) ? Integer.MIN_VALUE : nums1[i - 1];
            int minRightA = (i == m) ? Integer.MAX_VALUE : nums1[i];
            int maxLeftB = (j == 0) ? Integer.MIN_VALUE : nums2[j - 1];
            int minRightB = (j == n) ? Integer.MAX_VALUE : nums2[j];
            if (maxLeftA <= minRightB && maxLeftB <= minRightA) {
                if ((m + n) % 2 == 0) return (Math.max(maxLeftA, maxLeftB) + Math.min(minRightA, minRightB)) / 2.0;
                else return Math.max(maxLeftA, maxLeftB);
            } else if (maxLeftA > minRightB) right = i - 1; // too many from nums1 on the left
            else left = i + 1;
        }
        throw new IllegalArgumentException("invalid input");
    }
}
~~~

### Interview notes
- Always ensure searching on the shorter array for O(log(min(m,n))) time complexity.
- When the total number of elements is even, the median is the average of the two middle elements; when odd, it is the middle element.
- Be careful with overflow when calculating the average; use double from the beginning.

> Senior tip: This problem is often followed up with "if one array is an infinite stream" — the answer is to use a different structure (e.g., dual heaps) and binary search cannot be applied directly.`,
    follow: ['If one array is very long and one is very short, is binary search still efficient?', 'Can this be extended for k medians in multiple arrays?']
  },
  'algo-082': {
    prompt: `Calculate the value of a mathematical expression containing integers, plus (+), minus (-), and parentheses (). The expression may start with a minus sign. No multiplication or division is included.

### Examples
~~~text
Input: s = "(1+(4+5+2)-3)+(6+8)"
Output: 23
Input: s = "- (3 + (4 + 5))"
Output: -12
~~~

### Constraints
- {{1 <= s.length <= 3 * 10^4}}
- {{s consists of digits, '+', '-', '(', ')', and spaces}}`,
    hints: [
      'Parentheses change the signs of numbers inside. Need to store the current sign and cumulative sum for each level of parentheses.',
      'Use a stack to push the cumulative sum and current sign when encountering an opening parenthesis; when encountering a closing one, calculate the inner sum and add it to the outer sum.',
      'Spaces do not affect the result; can be skipped or handled directly by reading character by character.'
    ],
    solution: `### Concept
Traverse character by character. When a digit is encountered, calculate the full number (can be multi-digit). When '+' is encountered, add the number with the current sign; when '-' is encountered, subtract the number with the current sign; when '(' is encountered, push the current result and sign onto the stack, reset result and sign; when ')' is encountered, calculate the inner result, add it to the outer sum (popped from stack).

~~~java
class Solution {
    public int calculate(String s) {
        Stack<Integer> stack = new Stack<>();
        int result = 0, sign = 1, number = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            // Multi-digit number: keep accumulating until a non-digit appears
            if (Character.isDigit(c)) { number = number * 10 + (c - '0'); continue; }
            // Apply the pending term, then switch sign for the next one
            if (c == '+' || c == '-') { result += sign * number; sign = (c == '+') ? 1 : -1; number = 0; continue; }
            // Save the outer sum and sign, then start a fresh inner expression
            if (c == '(') { stack.push(result); stack.push(sign); result = 0; sign = 1; }
            // Close inner expression: apply its sign, then add it to the saved outer sum
            if (c == ')') { result += sign * number; number = 0; result = stack.pop() * result + stack.pop(); }
        }
        return result + sign * number;
    }
}
~~~

### Interview notes
- Ensure the number is reset after every sign or after closing a parenthesis; otherwise, the number will be multiplied by 10 incorrectly.
- The minus sign before a parenthesis must apply to the entire expression inside; the stack correctly stores both the sum and the sign.

> Senior tip: If extended to multiplication/division, you would need an additional stack for operators and operator precedence handling; this problem is much simpler because it only involves addition/subtraction.`,
    follow: ['If multiplication and division were added, how would you adjust the stack?', 'Can this be solved using recursion instead of a stack?']
  },
  'algo-083': {
    prompt: `Given a string containing only characters {{'('}} and {{')'}}, find the length of the longest valid (well-formed) parentheses substring.

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
      'Use a stack to store the indices of unmatched opening parentheses; when a closing parenthesis is encountered, calculate the length if there is a matching opening one.',
      'If the stack is empty when encountering a closing parenthesis, push the current index into the stack as a new base; the valid length is the current index minus the top of the stack.'
    ],
    solution: `### Concept
Use a stack to store indices of unmatched opening parentheses. When encountering {{')'}}:
- If the stack is not empty: calculate the length from the top of the stack (corresponding opening index) to the current position.
- If the stack is empty: push the current index into the stack as a new base for the next valid substring.

~~~java
class Solution {
    public int longestValidParentheses(String s) {
        Stack<Integer> stack = new Stack<>();
        stack.push(-1); // base index before the first valid substring
        int maxLen = 0;
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) == '(') stack.push(i);
            else {
                stack.pop();
                if (stack.isEmpty()) stack.push(i); // unmatched closing bracket: new base
                else maxLen = Math.max(maxLen, i - stack.peek());
            }
        }
        return maxLen;
    }
}
~~~

### Interview notes
- The stack is initially pushed with -1 to handle the case where the string starts with a closing bracket; this ensures the length is calculated correctly from the first base.
- Time complexity is O(n) because each character is pushed and popped from the stack at most once.

> Senior tip: Common variations include "counting the number of valid substrings" or "finding the minimum length valid substring"; it's the same stack or DP frame, just adjust how the result is calculated.`,
    follow: ['If square and curly brackets are added, how would you fix this?', 'Can DP be used instead of a stack? What is the complexity?']
  }
});
