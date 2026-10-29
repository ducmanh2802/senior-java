/*
 * English translation of js/data/algo.js — task T432. Format: js/core/i18n.js (content overlay).
 * ids: algo-001 algo-002 algo-003 algo-004 algo-005 algo-006 algo-007
 */
App.i18n.content({
  'algo-001': {
    prompt: `Given an array of integers {{nums}} and an integer {{target}}, return the **indices** of the two elements whose sum equals {{target}}. The problem guarantees exactly one solution, and you may not use the same element twice.

### Example
~~~text
Input:  nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
~~~

### Constraints
- {{2 <= nums.length <= 10^4}}
- {{-10^9 <= nums[i], target <= 10^9}}`,
    hints: [
      'Brute force O(n²) checks every pair. Is there a way to remember the numbers we have already seen?',
      'For each {{x}}, the number we need is {{target - x}}. Which data structure gives an O(1) lookup?',
      'One pass: check for the complement in the map first, then {{put(x, i)}} so we never reuse the same element.'
    ],
    solution: `### Approach
**Brute force:** try every pair (i, j) → O(n²). For n = 10^4 that is 5·10^7 comparisons — slow.

**Key observation:** standing at element {{x = nums[i]}}, the number we need is the **complement** {{target - x}}. The question "has this complement appeared before, and at which index?" can be answered in O(1) if we store the numbers seen so far in a {{HashMap<value, index>}}.

Single pass:
1. Compute the complement {{target - nums[i]}} and look it up in the map.
2. Found → return {{[index of the complement, i]}}.
3. Not found → {{put(nums[i], i)}} and move on.

**Why look up before put?** So that an element is never paired with itself. For example nums=[3,...], target=6: if we put 3 first and then look up 6-3=3, we would "find" index 0 itself.

Dry run with nums=[2,7,11,15], target=9:
~~~text
i=0, x=2: need 7,  map {}      -> not there, put 2->0
i=1, x=7: need 2,  map {2:0}   -> found! return [0, 1]
~~~

~~~java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();   // value -> index seen so far
        for (int i = 0; i < nums.length; i++) {
            Integer j = seen.get(target - nums[i]);      // has the complement appeared yet?
            if (j != null) return new int[]{j, i};       // j < i so [j, i] is in increasing order
            seen.put(nums[i], i);                        // put AFTER the lookup: never reuse the same element
        }
        throw new IllegalArgumentException("no solution"); // the problem guarantees this never happens
    }
}
~~~

### Why are duplicate values still handled correctly?
nums=[3,3], target=6: i=0 looks up 3 → not present, put 3→0; i=1 looks up 3 → finds index 0 → [0,1]. If there are several equal values, {{put}} overwrites the old index, but the problem has exactly one answer so this does not matter.

### Interview notes
- Ask back: is the array already sorted? If so, use **two pointers** (left and right moving inward) to reach O(1) memory.
- With constraints of ±10^9, {{target - nums[i]}} can reach 2·10^9, still inside {{int}} (max ≈ 2,147·10^9). If the constraints were larger you would have to compute with {{long}}.
- {{seen.get}} returns {{Integer}} (which can be null); do not assign it straight to an {{int}} or the unboxing will throw NullPointerException.

> Senior tip: Two Sum is the classic hash map problem; the "store what you have seen, look up the complement" pattern shows up in transaction reconciliation (pairing debit and credit entries that match), duplicate detection… Always ask the interviewer whether the array is sorted and what the memory budget is, so you can choose between the hash map and two pointers.`,
    follow: ['What if the array is already sorted?', 'How would you return all distinct pairs (a 3Sum variation)?']
  },
  'algo-002': {
    prompt: `Given an integer array {{nums}}, return {{true}} if any value appears at least twice, otherwise return {{false}}.

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
      'The simplest approach is to sort and then compare adjacent elements. What is the complexity?',
      'We only need to know whether a value has appeared, not how many times. Which data structure fits?',
      '{{HashSet.add(x)}} returns {{false}} when {{x}} is already present — you can return immediately without scanning the whole array.'
    ],
    solution: `### Approach
Use a {{HashSet}} to remember the values seen so far. As soon as we meet a value again, return {{true}} immediately. If the whole array is scanned with no repeat, return {{false}}.

This trades O(n) memory for O(n) average time. If memory matters more, sort in place and compare neighbours: O(n log n) time, O(1) space (assuming the input array may be modified).

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
- State the trade-off clearly: a hash set is fast but uses memory; sorting saves memory but is slower and may mutate the input.
- For data too large to fit in RAM, use a bitmap if the value range is small, or a Bloom filter as a pre-filter (accepting false positives).
- Do not use {{HashSet<int[]>}} or compare arrays with {{==}} — fine for primitives, but with objects you must understand {{equals/hashCode}}.

> Senior tip: In log-ingest pipelines I usually sort and compare neighbours when a batch holds a few million IDs and the heap is tight; for realtime streams I use a hash set with a size cap or a time window to avoid OOM.`,
    follow: ['How would you do it with O(1) extra memory?', 'How do you find every duplicated value instead of just true/false?']
  },
  'algo-003': {
    prompt: `Given two strings {{s}} and {{t}}, determine whether {{t}} is an anagram of {{s}}. Two strings are anagrams when they contain the same characters with the same frequencies, only in a different order.

### Example
~~~text
Input:  s = "anagram", t = "nagaram"
Output: true

Input:  s = "rat", t = "car"
Output: false
~~~

### Constraints
- {{1 <= s.length, t.length <= 5 * 10^4}}
- {{s}} and {{t}} contain only lowercase English letters.`,
    hints: [
      'If the lengths differ they cannot be anagrams — check that early.',
      'We need to compare character frequencies. Since the alphabet has only 26 letters, use a counting array instead of a HashMap.',
      'Increment for {{s}}, decrement for {{t}}; if every slot ends at 0 they match. You can stop early when a slot goes negative.'
    ],
    solution: `### Approach
Count each character of {{s}} into a 26-slot array, then subtract while walking {{t}}. If any slot is not 0, the two strings are not anagrams.

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
- If the input can contain Unicode, 26 slots are not enough; use a {{HashMap<Character, Integer>}} or count by code point.
- You can sort both strings and compare them: O(n log n), shorter code but extra memory.
- Ask back whether case matters and whether whitespace should be ignored — real interview problems often differ from the LeetCode version.

> Senior tip: For signature matching in a search system, the 26-slot frequency count is far faster than building a sorted key; but if you need a stable key for caching, normalise it into a byte array and hash that.`,
    follow: ['How would you change it for Unicode strings?', 'How do you group a list of strings into anagram groups?']
  },
  'algo-004': {
    prompt: `Given an array of strings {{strs}}, group the strings that are anagrams of one another into the same group. The order of the groups and the order of elements within a group do not matter.

### Example
~~~text
Input:  strs = ["eat", "tea", "tan", "ate", "nat", "bat"]
Output: [["eat","tea","ate"], ["tan","nat"], ["bat"]]
~~~

### Constraints
- {{1 <= strs.length <= 10^4}}
- {{0 <= strs[i].length <= 100}}
- {{strs[i]}} contains only lowercase letters.`,
    hints: [
      'Two anagrams have the same set of characters. We need one "signature" (key) that is identical for every anagram.',
      'Sort the characters of each string to build the key, or count the 26 frequencies and encode them into a string.',
      'Use a {{HashMap<key, List<String>>>}}; each key maps to the list of strings in that group.'
    ],
    solution: `### Approach
For each string, build a key by sorting its characters. All anagrams of one another produce the same key. Keep a map from key to the list of strings.

Complexity: a string of length k costs O(k log k) to sort, so O(n * k log k) overall. If k is large you can count frequencies and encode the key in O(k); the trade-off is a longer key that can collide more easily if you concatenate carelessly.

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
- For an empty string the key is the empty string — still works normally.
- Be careful when you build a key by concatenating frequencies: you need a clear separator, otherwise {{"1,11"}} and {{"11,1"}} can collide.
- Also present the sorting option: simple and readable; the frequency-count option is faster for long strings but the code is more involved.

> Senior tip: When grouping large data in a batch job, I usually make the key a sorted byte array and hash it with a stable hash; that avoids allocating temporary Strings for tens of millions of records.`,
    follow: ['How would you optimise the key when strings are thousands of characters long?', 'How do you handle case sensitivity for anagrams?']
  },
  'algo-005': {
    prompt: `Given a string {{s}}, determine whether it is a palindrome when only alphanumeric characters are considered, ignoring spaces, punctuation and letter case.

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
- {{s}} contains only printable ASCII characters.`,
    hints: [
      'You can build a normalised string and compare it with its reverse, but that costs O(n) memory.',
      'Use two pointers at both ends; skip characters that are not letters or digits.',
      'Be careful when comparing upper and lower case, and when one pointer moves past the other.'
    ],
    solution: `### Approach
Two pointers {{left}} and {{right}} move inward. At each step, skip characters that are neither letters nor digits. Then compare the two characters after converting them to lowercase. If they differ, the string is not a palindrome.

This approach allocates no new string, which suits large inputs.

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
- The {{left < right}} guard inside the skip loops is essential; without it a string made only of punctuation would run out of bounds.
- Ask back: does Unicode (Vietnamese diacritics, emoji) need handling? {{Character}} works on code units, which is not enough for every language.
- The normalised-string approach is easier to read but costs O(n) memory; state the trade-off before you code.

> Senior tip: When checking palindromes in a high-volume text pipeline, avoid {{toLowerCase()}} on the whole string because it can double the memory; comparing characters in place as above is usually faster and produces less GC.`,
    follow: ['How would you check it if you may skip at most one character?', 'What should you watch out for with Unicode and emoji?']
  },
  'algo-006': {
    prompt: `Given an array of integers {{nums}}, find all triplets of elements at distinct indices that sum to 0. The result must not contain duplicate triplets (compared by value).

### Example
~~~text
Input:  nums = [-1, 0, 1, 2, -1, -4]
Output: [[-1,-1,2], [-1,0,1]]
~~~

### Constraints
- {{3 <= nums.length <= 3000}}
- {{-10^5 <= nums[i] <= 10^5}}`,
    hints: [
      'Sort the array first. With one element fixed, the remaining problem is finding two numbers with a given sum.',
      'That is exactly Two Sum on a sorted array — use two pointers at the two ends of the remaining range.',
      'You must skip duplicate values in the outer loop and at both pointers, otherwise the result will contain repeats.'
    ],
    solution: `### Approach
Sort the array. Fix {{nums[i]}} and use two pointers {{lo = i + 1}}, {{hi = n - 1}} to find a pair that sums to {{-nums[i]}}.

- If the sum is below 0, increment {{lo}}.
- If it is above 0, decrement {{hi}}.
- If it is 0, record the triplet, then skip every duplicate value at {{lo}} and {{hi}}.

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
- An element must not be used twice: starting both pointers at {{i + 1}} guarantees that.
- The sum of three numbers can overflow {{int}} if the constraints are larger; {{10^5}} is still safe here, but raise the question proactively.
- Explain clearly why sorting loses no solution: we search by value, not by the original order.

> Senior tip: 3Sum very often draws the follow-up "what if the array is streaming?". The answer: you cannot sort a stream; either hash pairs or accept storing the whole thing.`,
    follow: ['How would you extend it to 4Sum?', 'How do you avoid duplicates without sorting?']
  },
  'algo-007': {
    prompt: `Given an array {{height}} representing the heights of vertical lines. Choose two lines to form a container so that it holds the maximum amount of water. The area equals the distance between the two lines multiplied by the height of the shorter line.

### Example
~~~text
Input:  height = [1,8,6,2,5,4,8,3,7]
Output: 49
Explanation: pick the line at index 1 (height 8) and index 8 (height 7),
distance 7, height 7 -> 49.
~~~

### Constraints
- {{2 <= height.length <= 10^5}}
- {{0 <= height[i] <= 10^4}}`,
    hints: [
      'Trying every pair by brute force is O(n²). We need to exploit a property: the area is limited by the shorter line.',
      'Start with the two outermost lines — the largest possible distance. From there the width can only shrink.',
      'If you move the taller line, the height cannot increase while the distance decreases, so always move the shorter line.'
    ],
    solution: `### Approach
Place two pointers at both ends. The current area is {{min(height[l], height[r]) * (r - l)}}. After each step, move only the pointer that sits on the shorter line, because keeping the shorter line while shrinking the width can never give a better result.

This is the key greedy argument you must state clearly in an interview: every pair we skip has an area no larger than the current candidate.

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
- The maximum area can reach {{10^4 * 10^5 = 10^9}}, still inside {{int}}; but if the constraints were larger, use {{long}}.
- When the two lines are equal, moving either side is fine; explain that this does not lose the optimal solution.
- Do not confuse it with Trapping Rain Water: here you only choose two lines and do not count water trapped in between.

> Senior tip: The usual follow-up is "prove the greedy choice is correct". Say this: when we discard the shorter line, every pair containing it is capped in height by that line, and the distance was already at its maximum at the moment we considered it, so none of those pairs can do better.`,
    follow: ['Prove why we always move the shorter line.', 'How would you change the code to return both indices?']
  }
});
