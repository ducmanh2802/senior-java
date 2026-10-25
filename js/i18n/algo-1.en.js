App.i18n.content({
  'algo-001': {
    prompt: `Given an array of integers {{nums}} and an integer {{target}}, return the **indices** of the two numbers such that they add up to {{target}}. You may assume that each input would have exactly one solution, and you may not use the same element twice.

### Example
~~~text
Input:  nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
~~~

### Constraints
- {{2 <= nums.length <= 10^4}}
- {{-10^9 <= nums[i], target <= 10^9}}`,
    hints: [
      'Brute force O(n²) checks every pair. Is there a way to remember numbers we have already seen?',
      'For each {{x}}, the number we need is {{target - x}}. Which data structure allows O(1) lookup?',
      'One-pass: check for the complement in the map first, then {{put(x, i)}} to avoid using the same element twice.'
    ],
    solution: `### Approach
One-pass traversal, using a {{HashMap<value, index>}} to store numbers seen so far. For each element, check if the complement {{target - x}} is already in the map.

~~~java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            Integer j = seen.get(target - nums[i]);
            if (j != null) return new int[]{j, i};
            seen.put(nums[i], i);
        }
        throw new IllegalArgumentException("no solution");
    }
}
~~~

### Interview notes
- Ask: is the array already sorted? If so, use **two pointers** for O(1) space.
- Watch out for overflow when calculating {{target - nums[i]}} if constraints are larger (use {{long}}).`,
    follow: ['What if the array is already sorted?', 'How to return all non-duplicate pairs (3Sum variation)?']
  },
  'algo-002': {
    prompt: `Given an integer array {{nums}}, return {{true}} if any value appears at least twice in the array, and return {{false}} if every element is distinct.

### Example
~~~text
Input:  nums = [1, 2, 3, 1]
Output: true

Input:  nums = [1, 2, 3, 4]
Output: false
~~~

### Constraints
- {{1 <= nums.length <= 10^5}}
- {{-10^9 <= nums[i] <= 10^9}}`,
    hints: [
      'The simplest approach is to sort and compare adjacent elements. What is the time complexity?',
      'We only need to know if a value has appeared before, not how many times. Which data structure is suitable?',
      '{{HashSet.add(x)}} returns {{false}} if {{x}} already exists — return immediately, no need to traverse the whole array.'
    ],
    solution: `### Approach
Use a {{HashSet}} to remember values encountered so far. When a value is encountered again, return {{true}} immediately. If traversal finishes without duplicates, return {{false}}.

This trades O(n) memory for average O(n) time. For space priority, sort in-place and compare adjacent elements: O(n log n) time, O(1) space (if input array can be modified).

~~~java
class Solution {
    public boolean containsDuplicate(int[] nums) {
        Set<Integer> seen = new HashSet<>();
        for (int x : nums) {
            if (!seen.add(x)) {   // add returns false if already present
                return true;
            }
        }
        return false;
    }
}
~~~

### Interview notes
- Clearly state trade-offs: hash set is fast but memory intensive; sorting saves memory but is slower and may modify input.
- For extremely large data that doesn't fit in RAM, consider a bitmap if value range is small, or a Bloom filter for pre-filtering (accepting false positives).
- Don't use {{HashSet<int[]>}} or compare arrays with {{==}} — for primitives it's fine, but for objects ensure you understand {{equals/hashCode}}.

> Senior tip: In log ingestion pipelines, I often use the sort + compare adjacent approach when batching a few million IDs to save heap; for realtime streams, use a hash set with size limits or a sliding window to avoid OOM.`,
    follow: ['How to do this with O(1) space?', 'How to find all duplicate values instead of just true/false?']
  },
  'algo-003': {
    prompt: `Given two strings {{s}} and {{t}}, write a function to determine if {{t}} is an anagram of {{s}}. An anagram is a string formed by rearranging the letters of a different string, typically using all the original letters exactly once.

### Example
~~~text
Input:  s = "anagram", t = "nagaram"
Output: true

Input:  s = "rat", t = "car"
Output: false
~~~

### Constraints
- {{1 <= s.length, t.length <= 5 * 10^4}}
- {{s}} and {{t}} consist of lowercase English letters.`,
    hints: [
      'If lengths differ, they cannot be anagrams — check this early.',
      'We need to compare character frequencies. Since the alphabet has only 26 characters, use a counting array instead of a HashMap.',
      'Increment counts for {{s}}, decrement for {{t}}; if all entries return to 0, it is a match. Early exit if any count becomes negative.'
    ],
    solution: `### Approach
Count character frequencies of {{s}} in a 26-element array, then decrement based on {{t}}. If any element is non-zero, they are not anagrams.

~~~java
class Solution {
    public boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        int[] count = new int[26];
        for (int i = 0; i < s.length(); i++) {
            count[s.charAt(i) - 'a']++;
            count[t.charAt(i) - 'a']--;
        }
        for (int c : count) {
            if (c != 0) return false;
        }
        return true;
    }
}
~~~

### Interview notes
- If input has Unicode, an array of 26 won't suffice; use {{HashMap<Character, Integer>}} or count by code point.
- Sorting both strings and comparing is O(n log n), code is shorter but uses more memory.
- Ask if case-sensitivity matters and if whitespace should be ignored — real-world requirements often differ from LeetCode.

> Senior tip: For signature matching in search systems, counting frequencies in 26 cells is much faster than creating a sorted key; but if a persistent key for caching is needed, normalize to a byte array and hash.`,
    follow: ['How to handle Unicode strings?', 'How to group a list of strings into anagram groups?']
  },
  'algo-004': {
    prompt: `Given an array of strings {{strs}}, group the anagrams together. The order of the groups or elements within groups does not matter.

### Example
~~~text
Input:  strs = ["eat", "tea", "tan", "ate", "nat", "bat"]
Output: [["eat","tea","ate"], ["tan","nat"], ["bat"]]
~~~

### Constraints
- {{1 <= strs.length <= 10^4}}
- {{0 <= strs[i].length <= 100}}
- {{strs[i]}} consists of lowercase English letters.`,
    hints: [
      'Anagrams share the same character set. Need a consistent "signature" (key) for all anagrams.',
      'Sort characters of each string to create a key, or count frequency of 26 chars then encode to string.',
      'Use {{HashMap<key, List<String>>>}}; each key maps to a list of strings in that group.'
    ],
    solution: `### Approach
For each string, create a key by sorting characters. All anagrams will produce the same key. Use a map from key to list of strings.

Complexity: each string of length k needs O(k log k) to sort, total O(n * k log k). If k is large, frequency counting and key encoding is O(k), but keys are longer and collision risk exists if concatenation is sloppy.

~~~java
class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        Map<String, List<String>> groups = new HashMap<>();
        for (String s : strs) {
            char[] chars = s.toCharArray();
            Arrays.sort(chars);
            String key = new String(chars);
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }
        return new ArrayList<>(groups.values());
    }
}
~~~

### Interview notes
- If the string is empty, the key is an empty string — still works fine.
- Be careful when generating keys by concatenating frequencies: must use a clear separator, otherwise {{"1,11"}} and {{"11,1"}} might collide.
- Present the sorting approach: simple, readable; frequency counting approach is faster for long strings but code is more complex.

> Senior tip: When grouping large data in batch jobs, I often choose a sorted byte array as the key then hash it using a stable hash; this avoids temporary String allocations for tens of millions of records.`,
    follow: ['How to optimize the key for strings thousands of characters long?', 'How to handle case-sensitive anagrams?']
  },
  'algo-005': {
    prompt: `Given a string {{s}}, determine if it is a palindrome, considering only alphanumeric characters and ignoring cases.

### Example
~~~text
Input:  s = "A man, a plan, a canal: Panama"
Output: true

Input:  s = "race a car"
Output: false

Input:  s = " "
Output: true
~~~

### Constraints
- {{1 <= s.length <= 2 * 10^5}}
- {{s}} consists of printable ASCII characters.`,
    hints: [
      'Can create a normalized string then compare with reversed version, but costs O(n) memory.',
      'Use two pointers at both ends; skip non-alphanumeric characters.',
      'Be careful with case comparison and when one pointer passes the other.'
    ],
    solution: `### Approach
Two pointers {{left}} and {{right}} move towards center. Each step, skip non-alphanumeric characters. Then compare characters after converting to lowercase. If they mismatch, it is not a palindrome.

This approach allocates no new strings, suitable for large input.

~~~java
class Solution {
    public boolean isPalindrome(String s) {
        int left = 0, right = s.length() - 1;
        while (left < right) {
            while (left < right && !Character.isLetterOrDigit(s.charAt(left))) left++;
            while (left < right && !Character.isLetterOrDigit(s.charAt(right))) right--;
            if (Character.toLowerCase(s.charAt(left)) !=
                Character.toLowerCase(s.charAt(right))) {
                return false;
            }
            left++;
            right--;
        }
        return true;
    }
}
~~~

### Interview notes
- The condition {{left < right}} in the skipping loops is critical, otherwise it will overflow with strings full of punctuation.
- Ask: does it need to handle Unicode (accents, emojis)? {{Character}} only handles code units, insufficient for all languages.
- Creating a normalized string is more readable but takes O(n) memory; state trade-offs before coding.

> Senior tip: For palindrome checking in large text processing streams, avoid {{toLowerCase()}} on the whole string as it can double memory; comparing characters in-place as shown above is usually faster and generates less GC.`,
    follow: ['How to check if it becomes a palindrome by removing at most one character?', 'What to keep in mind for Unicode and emoji support?']
  },
  'algo-006': {
    prompt: `Given an integer array {{nums}}, return all the triplets {{[nums[i], nums[j], nums[k]]}} such that {{i != j}}, {{i != k}}, and {{j != k}}, and {{nums[i] + nums[j] + nums[k] == 0}}. The solution set must not contain duplicate triplets.

### Example
~~~text
Input:  nums = [-1, 0, 1, 2, -1, -4]
Output: [[-1,-1,2], [-1,0,1]]
~~~

### Constraints
- {{3 <= nums.length <= 3000}}
- {{-10^5 <= nums[i] <= 10^5}}`,
    hints: [
      'Sort the array first. With one element fixed, the problem reduces to finding two numbers that sum to a target.',
      'This is Two Sum on a sorted array — use two pointers at both ends of the remaining subarray.',
      'Must skip duplicate values for the outer element and both pointers, otherwise results will be duplicated.'
    ],
    solution: `### Approach
Sort the array. Fix {{nums[i]}}, use two pointers {{lo = i + 1}}, {{hi = n - 1}} to find a pair with sum {{-nums[i]}}.

- If sum < 0, increment {{lo}}.
- If > 0, decrement {{hi}}.
- If == 0, record the triplet and skip all duplicate values for {{lo}} and {{hi}}.

~~~java
class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> res = new ArrayList<>();
        for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;   // skip duplicate outer values
            int lo = i + 1, hi = nums.length - 1;
            while (lo < hi) {
                int sum = nums[i] + nums[lo] + nums[hi];
                if (sum < 0) {
                    lo++;
                } else if (sum > 0) {
                    hi--;
                } else {
                    res.add(List.of(nums[i], nums[lo], nums[hi]));
                    int a = nums[lo], b = nums[hi];
                    while (lo < hi && nums[lo] == a) lo++;
                    while (lo < hi && nums[hi] == b) hi--;
                }
            }
        }
        return res;
    }
}
~~~

### Interview notes
- Cannot use the same element twice: pointers starting from {{i + 1}} ensure that.
- Sum of three numbers can overflow {{int}} if constraints are larger; here {{10^5}} is still safe but proactively ask.
- Clearly explain why sorting doesn't lose solutions: we are looking for values, not original indices.

> Senior tip: 3Sum is a classic "what if streaming?" question. Answer: streaming arrays cannot be sorted; must use hash-based pairing or accept storing the entire dataset.`,
    follow: ['How to extend this for 4Sum?', 'How to avoid duplicates without sorting?']
  },
  'algo-007': {
    prompt: `You are given an integer array {{height}} of length n. There are n vertical lines drawn such that the two endpoints of the {{i}}-th line are {{(i, 0)}} and {{(i, height[i])}}. Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.

### Example
~~~text
Input:  height = [1,8,6,2,5,4,8,3,7]
Output: 49
Explanation: lines at index 1 (height 8) and index 8 (height 7),
distance 7, height 7 -> 49.
~~~

### Constraints
- {{2 <= height.length <= 10^5}}
- {{0 <= height[i] <= 10^4}}`,
    hints: [
      'Brute force trying all pairs is O(n²). Need to leverage: area is limited by the shorter line.',
      'Start with two lines at the ends — maximum distance. Then can only narrow down.',
      'If you move the taller line, height won\'t increase but distance decreases, so always move the shorter line.'
    ],
    solution: `### Approach
Place two pointers at the ends. Current area is {{min(height[l], height[r]) * (r - l)}}. In each step, move the pointer pointing to the shorter line, because holding the shorter line and narrowing distance can never yield a better result.

This is a critical greedy argument to state clearly: all skipped pairs have an area not larger than the current candidate.

~~~java
class Solution {
    public int maxArea(int[] height) {
        int left = 0, right = height.length - 1;
        int best = 0;
        while (left < right) {
            int h = Math.min(height[left], height[right]);
            best = Math.max(best, h * (right - left));
            if (height[left] < height[right]) {
                left++;
            } else {
                right--;
            }
        }
        return best;
    }
}
~~~

### Interview notes
- Maximum area can reach {{10^4 * 10^5 = 10^9}}, still within {{int}}; but if constraints are larger, use {{long}}.
- When two lines are equal, moving either is fine; explain it doesn't lose the optimal solution.
- Don't confuse with Trapping Rain Water: this one only chooses two lines, doesn't calculate water trapped in between.

> Senior tip: A common follow-up is "prove the greedy approach is correct". Say: when dropping the shorter line, all pairs containing it have a maximum height equal to it, and the distance was already maximized at the point of consideration, so it cannot be better.`,
    follow: ['Prove why always move the shorter line.', 'How to return both indices if required?']
  }
});
