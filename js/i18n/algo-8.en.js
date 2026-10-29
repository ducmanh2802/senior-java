/*
 * English translation of js/data/algo.js — task T490. Format: js/core/i18n.js (content overlay).
 * ids: algo-048 algo-049 algo-050 algo-051 algo-052 algo-053 algo-054 algo-055 algo-056 algo-057 algo-058 algo-059 algo-060 algo-061 algo-062 algo-063 algo-064 algo-065 algo-066
 */
App.i18n.content({
  'algo-048': {
    prompt: `Given a log stream (each line is a string) and a number {{k}}. Return the {{k}} values that appear most often, sorted by frequency in descending order; if frequencies are equal, sort them in ascending order by value so the result is stable.

### Example
~~~text
logs = ["ERROR db", "ERROR db", "WARN cache", "ERROR db", "INFO ok"]
k = 2
Output: ["ERROR db", "INFO ok"]
Explanation: "ERROR db" appears 3 times; the remaining values
appear once each, so they are taken in ascending lexicographic order.
~~~

### Constraints
- {{1 <= number of lines <= 10^7}}
- {{1 <= k <= number of distinct values}}
- Each line is at most 256 characters long.`,
    hints: [
      'Count frequencies with a {{HashMap}} first, and only then pick the top-k.',
      'Keep a min-heap of size {{k}} ordered by frequency so the weakest element is evicted.',
      'When frequencies tie you need a secondary criterion (for example lexicographic order) so the result is stable and easy to test.'
    ],
    solution: `### Approach
Counting and selecting are two separate steps.

**Step 1, count.** {{merge}} is the shortest way to build a frequency table: {{freq.merge(key, 1, Integer::sum)}} means "put 1 if the key is absent, otherwise add 1 to the stored value". A {{HashMap}} (a dictionary from key to value) gives O(1) average lookup per line, so counting costs O(n).

**Step 2, select the top-k.** Use a min-heap of size {{k}}. A heap is a tree-shaped structure that always hands you the smallest element in O(log size) without keeping the whole collection sorted. Here "smallest" is defined by our comparator: lower frequency first and, on a tie, the **lexicographically larger** key. So the heap root is the **weakest** candidate among the k best seen so far; when a {{k + 1}}-th element arrives we poll the root and evict exactly that weakest one. At the end the elements come out in ascending order of quality, so reverse the list.

Space O(number of distinct values), time O(n + u log k), where u is the number of distinct values.

~~~java
class Solution {
    public List<String> topK(Stream<String> logs, int k) {
        Map<String, Integer> freq = new HashMap<>();
        logs.forEach(s -> freq.merge(s, 1, Integer::sum));

        PriorityQueue<Map.Entry<String, Integer>> heap =
            new PriorityQueue<>((a, b) -> {
                int byCount = Integer.compare(a.getValue(), b.getValue());
                if (byCount != 0) return byCount;
                return b.getKey().compareTo(a.getKey());   // larger key is evicted first
            });

        for (Map.Entry<String, Integer> e : freq.entrySet()) {
            heap.add(e);
            if (heap.size() > k) heap.poll();
        }

        List<String> result = new ArrayList<>(k);
        while (!heap.isEmpty()) result.add(heap.poll().getKey());
        Collections.reverse(result);
        return result;
    }
}
~~~

### Interview notes
- If the number of distinct values (cardinality — how many different values there are) is huge (tens of millions), the {{HashMap}} itself may throw OutOfMemoryError; then use Count-Min Sketch (a compact approximate counter) or split the work into batches/MapReduce.
- On an infinite stream, an exact top-k requires keeping every frequency; if an approximation is acceptable, use heavy-hitters algorithms.
- Never write {{a.getValue() - b.getValue()}} inside a comparator: the subtraction can overflow and silently reverse the order. Use {{Integer.compare}}.
- Ask back: does "log entry" mean the whole line or a parsed field? Splitting a line into fields changes the cardinality a lot.

> Senior tip: In real logging systems top-k usually runs per time window (last 5 minutes, last hour) and per dimension (service, endpoint). Say clearly that you would partition by service before counting, so no single node has to hold the whole cardinality.`,
    follow: ['If the data does not fit in RAM, how would you design a MapReduce job?', 'How do you find the top-k per time window?']
  },
  'algo-049': {
    prompt: `Systems receive transaction IDs from many sources in inconsistent formats. Write a normalize function: for each ID, strip leading and trailing whitespace and convert it to uppercase; an ID that is empty after trimming is dropped. Keep the original order and keep duplicates (each row is a real transaction).

### Example
~~~text
Input:  [" ab1 ", "", "Xy2", "  "]
Output: ["AB1", "XY2"]
~~~

### Constraints
- {{0 <= ids.size() <= 10^5}}
- Each ID is at most 64 characters long and contains ASCII letters, digits, and leading/trailing spaces or tabs.`,
    hints: [
      'Walk the list once and build a new result List (do not modify the input list).',
      'For each ID: {{trim()}} first, skip it if the result is empty, and only then convert to uppercase.',
      'Do not use a Set to "clean" the data: two transactions with the same ID are still two rows that must be audited.'
    ],
    solution: `### Approach
This problem checks whether you handle strings carefully; it does not need a clever algorithm. Walk the elements in order:

1. {{trim()}} removes every whitespace character (space, tab, ...) at both ends. It returns a **new** string, because Java strings are immutable (they can never change after creation).
2. If what remains is empty ({{isEmpty()}}), the row carries no ID: skip it.
3. Otherwise convert it to uppercase with {{toUpperCase(Locale.ROOT)}} and append it to the result.

Because we only append to the end of the result list in traversal order, the original order is preserved, and a duplicate ID appears exactly as many times as it did in the input.

Small detail: create the list as {{new ArrayList<>(ids.size())}} so the internal array is allocated once instead of being reallocated (and copied) several times while growing.

~~~java
class Solution {
    public List<String> normalize(List<String> ids) {
        List<String> out = new ArrayList<>(ids.size()); // pre-size: avoid repeated resizing
        for (String id : ids) {
            String value = id.trim();                    // strip spaces/tabs at both ends
            if (value.isEmpty()) continue;               // blank row: drop it
            out.add(value.toUpperCase(Locale.ROOT));     // Locale.ROOT: same result on every machine
        }
        return out;
    }
}
~~~

### Why Locale.ROOT?
{{toUpperCase()}} with no argument uses the JVM default locale. On a machine configured for Turkish ({{tr-TR}}), lowercase {{i}} uppercases to {{İ}} (dotted capital I), so {{"txid"}} becomes {{"TXİD"}} and no longer matches {{"TXID"}} stored in the database. {{Locale.ROOT}} gives the same result everywhere, which is what identifiers and protocol values need.

### Interview notes
- Ask back: are IDs case-sensitive? Is deduplication allowed? This statement explicitly says **no**.
- Time is O(n·m) where m is the average ID length, because {{trim}} and {{toUpperCase}} both walk every character and build a new string.

> Senior tip: Normalize data once at the "front door" of the system (the controller or the message consumer). If every service normalizes in its own way, joins between systems silently stop matching.`,
    follow: ['If IDs were case-sensitive, which normalization step would you change?', 'If the input is a 50 GB file, how do you process it without running out of memory?']
  },
  'algo-050': {
    prompt: `Each transaction is a pair {{[day, amount]}} of strings, for example {{["Mon", "5"]}}. The amount is an integer and may be negative (a refund). Return a Map with the total amount per day, keeping the days in the order they first appear.

### Example
~~~text
Input:  [["Mon","5"], ["Tue","4"], ["Mon","-2"]]
Output: {Mon=3, Tue=4}
~~~

### Constraints
- {{0 <= rows.length <= 10^6}}
- Each amount fits in {{int}}, but the **total** can exceed {{int}}, so return {{Long}}.`,
    hints: [
      'Each day is a key in the Map and the value is the running total.',
      'Map.merge(key, value, Long::sum) inserts a new key and accumulates an existing one in a single call.',
      'Use LinkedHashMap to keep the order of first appearance; parse the amount with Long.parseLong so the total cannot overflow.'
    ],
    solution: `### Approach
This is a "group by + sum" problem, the same shape as the SQL statement {{SELECT day, SUM(amount) ... GROUP BY day}}. Use a Map (a dictionary from key to value) where the key is the day and the value is the current total.

Walk each row:
1. Read {{row[0]}} as the day and parse {{row[1]}} into a {{long}}.
2. {{merge(day, amount, Long::sum)}}: if the day is not in the map yet the value becomes amount; if it is already there the value becomes the old value plus amount.

Hand run with the example: Mon=5, then Tue=4, then Mon=5+(-2)=3. The result is Mon=3, Tue=4.

Why {{LinkedHashMap}}? A plain {{HashMap}} does not promise any iteration order (the order looks arbitrary and can change when the map resizes). {{LinkedHashMap}} keeps the keys in the order they were first inserted, which is exactly what the statement asks for.

~~~java
class Solution {
    public Map<String, Long> totals(String[][] rows) {
        // LinkedHashMap keeps the keys in first-insertion order (HashMap does not)
        Map<String, Long> out = new LinkedHashMap<>();
        for (String[] row : rows) {
            long amount = Long.parseLong(row[1]);   // long: summing many ints can exceed 2^31-1
            out.merge(row[0], amount, Long::sum);    // absent -> put; present -> add
        }
        return out;
    }
}
~~~

### Why long?
{{Integer.MAX_VALUE}} is about 2.1 billion. Three transactions of 2 billion summed as {{int}} wrap around into a negative number and **no** error is raised. For money a silent wrong answer is more dangerous than an exception. Real systems store money as {{long}} in the smallest unit (for example cents) or as {{BigDecimal}}, and never as {{double}}, because binary floating point cannot represent values such as 0.10 exactly.

### Interview notes
- {{merge}} is equivalent to {{put(key, getOrDefault(key, 0L) + amount)}} but looks the map up only once.
- If days must be sorted chronologically, parse them into {{LocalDate}} and use a {{TreeMap}} instead of comparing strings: alphabetically "Fri" comes before "Mon", which is not calendar order.

> Senior tip: When the data does not fit in RAM, work like MapReduce: read it in batches, aggregate each batch locally, then merge the partial results; or push the aggregation into the database with {{GROUP BY}} on an indexed date column.`,
    follow: ['How do you process data that exceeds RAM, batch by batch?', 'If amounts had decimals, which data type would you use, and why not double?']
  },
  'algo-051': {
    prompt: `Given a string {{s}} containing only lowercase letters {{a..z}}, return the **index** of the first character that appears exactly once; if there is none, return {{-1}}.

### Example
~~~text
"swiss"  -> 1   (s appears 3 times; 'w' is the first character appearing once)
"aabb"   -> -1
~~~

### Constraints
- {{0 <= s.length() <= 2 * 10^5}}
- {{s}} contains only lowercase ASCII letters.`,
    hints: [
      'When standing on a character you do not know yet whether it repeats later. So you need the frequency of every character first.',
      'Pass 1: count frequencies. Pass 2: walk again in order; the first character with frequency 1 is the answer. Two passes are still O(n).',
      'The alphabet has only 26 characters, so use {{int[26]}} instead of a HashMap: faster and no boxing.'
    ],
    solution: `### Approach
Two passes:

1. **Count:** {{count[ch - 'a']++}}. The expression {{ch - 'a'}} turns a character into a number 0..25 ('a' becomes 0, 'b' becomes 1, ...) that can be used as an array index. This works because a Java {{char}} is an integer type underneath.
2. **Find:** walk the string again from left to right and return the first index whose count is 1.

Why can this not be done in one pass? For {{"swiss"}}, when you meet the first {{s}} at index 0 you do not know yet that two more {{s}} appear later. Only after counting do you know.

Hand run {{"swiss"}}: count[s]=3, count[w]=1, count[i]=1. Second pass: index 0 {{s}} (3) skip; index 1 {{w}} (1) return **1**.

~~~java
class Solution {
    public int firstUnique(String s) {
        int[] count = new int[26];                   // count[0] for 'a', count[25] for 'z'
        for (int i = 0; i < s.length(); i++) {
            count[s.charAt(i) - 'a']++;               // pass 1: count frequencies
        }
        for (int i = 0; i < s.length(); i++) {
            if (count[s.charAt(i) - 'a'] == 1) return i; // pass 2: original order decides
        }
        return -1;                                   // no character appears exactly once
    }
}
~~~

### Why is space O(1)?
The array always holds 26 counters regardless of the string length. If the alphabet were not limited (Unicode), you would need a {{HashMap<Integer, Integer>}} and space would become O(k), where k is the number of distinct characters.

### Interview notes
- A Java {{char}} is one UTF-16 code unit. An emoji or some CJK characters occupy **two** chars (a surrogate pair), so a Unicode version must iterate with {{s.codePoints()}} and count code points.
- Ask back whether "character" is case-sensitive.

> Senior tip: If the question becomes an infinite character stream ("first character that has not repeated so far"), keep a {{LinkedHashMap}} of counts or a count array plus a queue of candidates; each new character then costs O(1).`,
    follow: ['If Unicode code points must be supported, how does the counting change?', 'If characters arrive as a stream and you must answer after every character, what would you do?']
  },
  'algo-052': {
    prompt: `Two systems send back two arrays of transaction values, each array already sorted in ascending order. Merge them into a single ascending array, keeping duplicates.

### Example
~~~text
a = [1, 4], b = [2, 4]  -> [1, 2, 4, 4]
a = [],     b = [-2, 0] -> [-2, 0]
~~~

### Constraints
- {{0 <= a.length, b.length <= 10^5}}; either array may be empty; values may be negative.
- Requirement: O(n + m). Concatenating both arrays and sorting again is not allowed.`,
    hints: [
      'Put one pointer at the start of each array. The smallest untaken element is always at one of the two pointers.',
      'Each step compares a[i] with b[j], copies the smaller one to the result, and advances that pointer.',
      'When one array runs out, the rest of the other is already sorted: copy it straight to the end.'
    ],
    solution: `### Approach
This is exactly the "merge" step of Merge Sort (the divide-and-conquer algorithm that sorts two halves and then merges them). Three pointers: {{i}} on {{a}}, {{j}} on {{b}}, and {{k}} as the next write position in {{out}}.

Because both arrays are already ascending, the smallest element **not yet taken** must be {{a[i]}} or {{b[j]}}. Compare the two values, copy the smaller one, advance that pointer. Repeat until one array is exhausted, then copy the rest.

Hand run a=[1,4], b=[2,4]:
~~~text
i=0,j=0: 1 vs 2 -> take 1    out=[1]
i=1,j=0: 4 vs 2 -> take 2    out=[1,2]
i=1,j=1: 4 vs 4 -> take a    out=[1,2,4]   (<= takes a first: stable merge)
a exhausted -> copy the rest of b   out=[1,2,4,4]
~~~

~~~java
class Solution {
    public int[] merge(int[] a, int[] b) {
        int[] out = new int[a.length + b.length];
        int i = 0, j = 0, k = 0;
        while (i < a.length && j < b.length) {
            if (a[i] <= b[j]) out[k++] = a[i++];   // <= : on a tie take a first (stable)
            else out[k++] = b[j++];
        }
        while (i < a.length) out[k++] = a[i++];     // only one of these two loops really runs
        while (j < b.length) out[k++] = b[j++];
        return out;
    }
}
~~~

### Why O(n + m)?
Every iteration writes exactly one element into {{out}} and increments {{k}}; {{out}} has n + m cells, so there are exactly n + m iterations. Concatenating the arrays and calling {{Arrays.sort}} costs O((n+m) log(n+m)) and throws away the information that both parts were already sorted.

### Interview notes
- Ask whether duplicates must be kept (here: yes).
- Use {{<=}} to make the merge **stable**: this matters when the elements are objects (transactions with the same timestamp keep their source order).

> Senior tip: To merge K sorted streams (Kafka partitions, sorted log files), keep a {{PriorityQueue}} holding the head of each stream: O(N log K) time and only K elements in RAM, instead of loading everything into one array.`,
    follow: ['Which structure would you use to merge K sorted streams, and what is the complexity?', 'If a has enough free space at its end, how do you merge in place without an extra array?']
  },
  'algo-053': {
    prompt: `{{prices[i]}} is the stock price on day {{i}}. You may buy **at most once** and sell on a day **after** the buying day. Return the maximum profit; if no profitable trade exists return {{0}} (do not trade).

### Example
~~~text
[7, 1, 5, 3, 6, 4] -> 5   (buy day 1 at 1, sell day 4 at 6)
[7, 6, 4, 3, 1]    -> 0   (prices only fall, do not trade)
~~~

### Constraints
- {{0 <= prices.length <= 2 * 10^5}}
- {{0 <= prices[i] <= 10^4}}`,
    hints: [
      'Brute force over every pair (buy i, sell j > i) is O(n²). Fix the selling day instead of the pair.',
      'If you sell on day j, the best buying price is the **lowest** price on any day before j.',
      'One pass: keep {{minPrice}} seen so far and {{best}} profit; update the minimum first, then compute {{price - minPrice}}.'
    ],
    solution: `### Approach
Change the point of view: instead of trying every (buy, sell) pair, ask "if I **sell today**, what is the best profit?". The answer is today's price minus the lowest price seen before today. Taking the maximum of that answer over all days solves the problem.

Hand run [7,1,5,3,6,4]:
~~~text
price: 7   1   5   3   6   4
min:   7   1   1   1   1   1
gain:  0   0   4   2   5   3     -> best = 5
~~~

~~~java
class Solution {
    public int maxProfit(int[] prices) {
        int minPrice = Integer.MAX_VALUE; // cheapest buying price seen so far
        int best = 0;                     // 0 = do not trade, so the answer is never negative
        for (int price : prices) {
            minPrice = Math.min(minPrice, price);          // we could "buy" today
            best = Math.max(best, price - minPrice);        // profit if we sell today
        }
        return best;
    }
}
~~~

### Why is updating the minimum first still correct?
If today is the new lowest price, {{price - minPrice = 0}}, that is "buy and sell on the same day" with zero profit, which cannot make {{best}} wrong. Thanks to that the code needs no special case for the first day or for an empty array.

### Interview notes
- Ask back: may I trade many times? Is there a fee? A cooldown? Each variant is a different problem (many trades: add every rising segment; at most k trades: DP).
- To return the buying and selling days, also store the index of the minimum and the index where best was updated.

> Senior tip: The "keep the extreme of the part already scanned" pattern (running min/max) appears everywhere: maximum drawdown of a portfolio, the biggest latency increase against a baseline, and so on. Recognizing it turns O(n²) into O(n).`,
    follow: ['If you must return both the buying and selling days, how do you break ties?', 'If unlimited transactions were allowed, how would the solution change?']
  },
  'algo-054': {
    prompt: `Given a string {{s}} made only of the bracket characters ( ) [ ] and { }. The string is valid when every opening bracket is closed by the **right type** and in the **right order** (the bracket opened later must close first). The empty string is valid.

### Example
~~~text
"{[()]}" -> true
"([)]"   -> false   ( '[' is still open when ')' arrives )
"(("     -> false   (missing closing brackets)
~~~

### Constraints
- {{0 <= s.length <= 2 * 10^5}}`,
    hints: [
      'A closing bracket must match the **most recent bracket that is still open**. Which structure gives you "last in, first out"?',
      'Opening bracket: push it. Closing bracket: empty stack means failure; otherwise pop and check the type.',
      'If the stack is not empty after the walk, some opening bracket was never closed, so the string is invalid.'
    ],
    solution: `### Approach
Brackets nest as "opened last, closed first" (LIFO — last in, first out), which is exactly what a **stack** does. Picture a stack of plates: you always take the plate you put on top last. The stack holds opening brackets waiting to be closed; its top is the most recent opening bracket.

Three ways to fail:
1. A closing bracket arrives while the stack is empty (closed without opening), for example {{")("}}.
2. The closing bracket does not match the type on top, for example {{"([)]"}}: {{)}} arrives but the top is {{[}}.
3. The string ends while the stack still has elements, for example {{"(("}}.

Hand run "{[()]}":
~~~text
{  push      stack: {
[  push      stack: { [
(  push      stack: { [ (
)  pop ( OK  stack: { [
]  pop [ OK  stack: {
}  pop { OK  stack: (empty) -> true
~~~

~~~java
class Solution {
    public boolean balanced(String s) {
        Deque<Character> stack = new ArrayDeque<>(); // faster than the legacy Stack (synchronized)
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '[' || c == '{') {
                stack.push(c);                        // opening: waiting to be closed
            } else {
                if (stack.isEmpty()) return false;    // closing with nothing to close
                char open = stack.pop();              // most recent opening bracket
                if (c == ')' && open != '(') return false;
                if (c == ']' && open != '[') return false;
                if (c == '}' && open != '{') return false;
            }
        }
        return stack.isEmpty();                       // leftover openings -> invalid
    }
}
~~~

### Interview notes
- Use {{Deque}}/{{ArrayDeque}}, not {{java.util.Stack}}: {{Stack}} extends the legacy {{Vector}} and every method is synchronized (takes a lock), so it is slow and it is an old API.
- Small optimization: an odd-length string can never be balanced, so you can return false immediately.
- The chain of ifs can be replaced by a {{Map<Character, Character>}} mapping each closing bracket to its opener, which stays readable when there are many bracket types.

> Senior tip: The same stack idea validates nested JSON/XML, pairs BEGIN/COMMIT in a transaction log, and drives expression parsers. Always cap the allowed depth on untrusted input to prevent a "nesting bomb" (a tiny input that makes your stack grow without bound).`,
    follow: ['If the string also contains ordinary characters that must be ignored, what changes?', 'How would you return the position of the first offending character so the user can be told?']
  },
  'algo-055': {
    prompt: `Given an array of daily costs {{a}} (all elements **non-negative**) and a budget, find the length of the longest **consecutive** run of days whose total cost is {{<= budget}}. If no run fits, return {{0}}.

### Example
~~~text
a = [2, 1, 3, 2], budget = 4 -> 2   ([2,1] sums to 3, [1,3] sums to 4)
a = [5, 6],       budget = 2 -> 0
~~~

### Constraints
- {{0 <= a.length <= 2 * 10^5}}
- {{0 <= a[i] <= 10^4}}, {{0 <= budget <= 10^9}}`,
    hints: [
      'Brute force over every pair (l, r) is O(n²). Exploit the fact that every element is non-negative.',
      'Keep a window [l, r] and its sum. Each step extends r; if the sum exceeds the budget, raise l (drop elements on the left) until it fits again.',
      'Because elements are non-negative, dropping from the left can only keep or decrease the sum, so l never has to move back: each element enters and leaves the window at most once.'
    ],
    solution: `### Approach
Use a **sliding window** (a window that slides across the array) with two pointers {{l}} and {{r}}:
1. Increase {{r}} to bring {{a[r]}} into the window and add it to {{sum}}.
2. While {{sum > budget}}: remove {{a[l]}} from the window and increase {{l}}.
3. The window [l, r] is now valid, so update {{best = max(best, r - l + 1)}}.

**Why is it correct?** All elements are non-negative, so the sum is **monotone**: growing the window can only increase the sum and shrinking it can only decrease it. If [l, r] already exceeds the budget, every window [l, r'] with r' > r also exceeds it, so dropping l completely can never lose a valid answer.

Hand run a=[2,1,3,2], budget=4:
~~~text
r=0: sum=2          [2]        best=1
r=1: sum=3          [2,1]      best=2
r=2: sum=6 > 4 -> drop 2, sum=4  [1,3]  best=2
r=3: sum=6 > 4 -> drop 1, sum=5 > 4 -> drop 3, sum=2  [2]  best=2
~~~

~~~java
class Solution {
    public int longest(int[] a, int budget) {
        int l = 0, best = 0;
        long sum = 0;                          // long: 2*10^5 * 10^4 = 2*10^9 exceeds int
        for (int r = 0; r < a.length; r++) {
            sum += a[r];                       // extend the window to the right
            while (sum > budget) {             // over budget -> shrink from the left
                sum -= a[l];
                l++;
            }
            best = Math.max(best, r - l + 1);  // [l, r] is valid (may be empty when l = r + 1)
        }
        return best;
    }
}
~~~

### Why O(n) although a while loop sits inside the for?
{{l}} only moves forward and at most n times in the **whole** run, not n times for each r. The total number of steps of both pointers is at most 2n.

### Interview notes
- With negative numbers the sum is no longer monotone, so the sliding window is **wrong**; then use prefix sums plus a search structure (for example prefix sums with a monotonic deque or a TreeMap).
- When a single element is larger than the budget, the window shrinks to empty (l = r + 1) with length 0; the code stays correct without any special case.

> Senior tip: Sliding windows are common in real systems: time-based rate limiting, rolling latency averages, burst detection in transactions. The precondition is always the same: growing or shrinking the window must change the measured quantity monotonically.`,
    follow: ['If costs could be negative, which approach would you choose?', 'If you had to count how many runs fit the budget instead of the longest, what would you change?']
  },
  'algo-056': {
    prompt: `Given an integer array {{a}} (it may contain **negative** numbers and zeros) and {{target}}, count the **consecutive, non-empty** subarrays whose sum equals {{target}}.

### Example
~~~text
a = [1, 1, 1],      target = 2 -> 2   ([1,1] at positions 0-1 and 1-2)
a = [1, -1, 1, -1], target = 0 -> 4
~~~

### Constraints
- {{0 <= a.length <= 2 * 10^5}}
- {{-10^4 <= a[i] <= 10^4}}; the answer can be very large, so return {{long}}.`,
    hints: [
      'A sliding window does not work here because of the negative numbers (the sum is not monotone). Think of prefix sums.',
      'Let P(j) be the sum of a[0..j]. The sum of (i, j] is P(j) - P(i). The segment sums to target when P(i) = P(j) - target.',
      'Walk left to right with a HashMap counting how often each prefix value has appeared; start the map with prefix 0 seen once (a segment starting at index 0).'
    ],
    solution: `### Approach
**Prefix sum** means {{P(j) = a[0] + ... + a[j]}}, with the convention {{P(-1) = 0}}. The sum of the segment from i+1 to j is {{P(j) - P(i)}} — the difference of two prefix sums.

A segment ending at j has sum target exactly when {{P(i) = P(j) - target}} for some i < j. So, standing at j, the number of valid segments ending at j equals **how many times the value {{P(j) - target}} has already appeared** among the earlier prefixes. A HashMap (a dictionary from key to value) answers that question in O(1).

The order matters: **count first, then record the current prefix**, so a prefix is never paired with itself (that would create an empty segment).

Hand run a=[1,1,1], target=2 (the map starts as {0:1}):
~~~text
j=0: sum=1, need 1-2=-1 -> 0 segments  map {0:1, 1:1}
j=1: sum=2, need 0      -> 1 segment   map {0:1, 1:1, 2:1}
j=2: sum=3, need 1      -> 1 segment   map {..., 3:1}      total = 2
~~~

~~~java
class Solution {
    public long count(int[] a, int target) {
        Map<Long, Long> seen = new HashMap<>(); // prefix value -> how many times it occurred
        seen.put(0L, 1L);                       // P(-1) = 0: segments may start at index 0
        long sum = 0, ans = 0;
        for (int v : a) {
            sum += v;                                       // sum = P(j)
            ans += seen.getOrDefault(sum - target, 0L);     // earlier i with P(i) = P(j) - target
            seen.merge(sum, 1L, Long::sum);                 // record P(j) AFTER counting
        }
        return ans;
    }
}
~~~

### Why is the result a long?
With an all-zero array and target = 0, **every** segment is valid: n(n+1)/2 is about 2*10^10 when n = 2*10^5, which overflows {{int}}.

### Interview notes
- This is the classic "prefix sum + hash map" pattern (LeetCode 560). Recognize it when counting subarrays whose sum (or XOR) equals K, especially when the array has negative numbers.
- The map key is {{Long}}: remember {{0L}}, not {{0}}; otherwise {{get(0)}} looks up an Integer key and always returns null.

> Senior tip: The same "difference of two prefixes" idea answers range questions over accumulated data instantly: the balance between two moments is the difference of two cumulative balance snapshots, so you do not replay every transaction.`,
    follow: ['Why is the sliding window not generally applicable with negative numbers?', 'To find the LONGEST segment summing to target, what would the map store?']
  },
  'algo-057': {
    prompt: `A room-booking system has an unsorted list of time intervals {{[start, end]}} (a **closed** interval, start <= end). Merge every pair of intervals that **overlap or touch** (for example [1,3] and [3,5]) and return the list sorted by start.

### Example
~~~text
[[1,3],[3,5],[8,9]] -> [[1,5],[8,9]]
[[7,9],[1,2],[2,4]] -> [[1,4],[7,9]]
~~~

### Constraints
- {{0 <= intervals.length <= 10^5}}
- {{0 <= start <= end <= 10^9}}`,
    hints: [
      'When the intervals are in random order it is hard to tell which ones belong together. Sort by start first.',
      'After sorting, a new interval can only merge with the **last** interval in the result.',
      'If the new start <= the last end, extend the last end to max(last end, new end); otherwise append the new interval.'
    ],
    solution: `### Approach
1. Sort by {{start}} ascending.
2. Walk through the intervals keeping the result list {{out}}. Let {{last}} be the final interval of {{out}}.
   - If {{cur.start <= last.end}}: they overlap or touch, so merge: {{last.end = max(last.end, cur.end)}}.
   - Otherwise: no overlap, so append a copy of {{cur}} to {{out}}.

**Why compare only with the last interval?** After sorting, every interval in {{out}} except the last one ends before {{last.start}}, which is <= {{cur.start}}, so it cannot overlap {{cur}}.

Why {{max}}? A new interval can sit **completely inside** an older one, for example [1,10] then [2,3]: the end must stay 10, not become 3.

~~~java
class Solution {
    public int[][] merge(int[][] intervals) {
        int[][] a = intervals.clone();                     // do not sort the caller's array
        Arrays.sort(a, Comparator.comparingInt(x -> x[0])); // sort by start
        List<int[]> out = new ArrayList<>();
        for (int[] cur : a) {
            if (out.isEmpty() || cur[0] > out.get(out.size() - 1)[1]) {
                out.add(new int[]{cur[0], cur[1]});        // no overlap: open a new interval (copy)
            } else {
                int[] last = out.get(out.size() - 1);
                last[1] = Math.max(last[1], cur[1]);       // overlap/touch: extend the end
            }
        }
        return out.toArray(new int[0][]);
    }
}
~~~

### Interview notes
- **Ask whether intervals are closed or half-open.** For meeting schedules {{[start, end)}}, [1,3) and [3,5) do not overlap; whether to merge is a business decision. This statement treats touching as a merge (hence {{>}} instead of {{>=}}).
- {{intervals.clone()}} copies only the outer array (a shallow copy); that is enough to sort without changing the caller's order, and because we create a {{new int[]}} when appending to {{out}} we never modify the inner arrays either.
- The comparator uses {{Integer.compare}}/{{comparingInt}}, never {{x[0] - y[0]}}, because the subtraction can overflow with large negative values.

> Senior tip: In a real booking system the overlap check belongs in the database to avoid race conditions: PostgreSQL offers an exclusion constraint on the tsrange type ({{EXCLUDE USING gist}}), which rejects two intersecting bookings even when two requests run at the same time.`,
    follow: ['If meeting schedules use [start, end), how does the merge condition change?', 'If bookings are inserted continuously, which structure lets you insert and merge faster than re-sorting every time?']
  },
  'algo-058': {
    prompt: `Given meetings as {{[start, end)}} (half-open: a meeting that ends at 10 frees the room for one starting at 10), find the **minimum number of rooms** so that no two meetings in the same room overlap.

### Example
~~~text
[[0,30],[5,10],[15,20]] -> 2
[[0,2],[2,4],[4,5]]     -> 1   (back to back, one room is enough)
~~~

### Constraints
- {{0 <= meetings.length <= 10^5}}
- {{0 <= start < end <= 10^9}}`,
    hints: [
      'Process meetings in increasing start time, as if time were flowing forward.',
      'When a meeting starts you only need to know which room **frees up earliest**: if that room is already free you can reuse it. Which structure returns the minimum quickly?',
      'A min-heap holds the end times of busy rooms. Before adding a new meeting, poll every room whose end <= start. The largest heap size seen is the answer.'
    ],
    solution: `### Approach
Simulate time moving forward:
1. Sort meetings by {{start}}.
2. A min-heap {{busy}} holds the end times of rooms that are **currently occupied**. The root is the room that frees up soonest.
3. For each meeting: poll every room with {{end <= start}} (that meeting is over, the room is free). Then push the new meeting's {{end}}.
4. {{busy.size()}} is the number of rooms in use at that moment; the answer is the largest value it reaches.

Hand run [[0,30],[5,10],[15,20]]:
~~~text
[0,30):  heap empty            -> push 30   heap={30}     size 1
[5,10):  root 30 > 5, busy     -> push 10   heap={10,30}  size 2
[15,20): root 10 <= 15, free   -> poll 10, push 20 heap={20,30} size 2
answer = 2
~~~

~~~java
class Solution {
    public int rooms(int[][] meetings) {
        int[][] a = meetings.clone();                         // do not modify the caller's array
        Arrays.sort(a, Comparator.comparingInt(m -> m[0]));   // by start time
        PriorityQueue<Integer> busy = new PriorityQueue<>();  // min-heap of end times
        int best = 0;
        for (int[] m : a) {
            while (!busy.isEmpty() && busy.peek() <= m[0]) {
                busy.poll();                                  // <= because half-open: end == start is reusable
            }
            busy.offer(m[1]);                                 // the new meeting occupies one room
            best = Math.max(best, busy.size());               // rooms in use at this moment
        }
        return best;
    }
}
~~~

### Another approach: sweep events
Split into two arrays {{starts}} and {{ends}}, sort both, and use two pointers: a start adds one room, an end that is <= the current start releases one. Also O(n log n) and no heap, but it is harder to extend when you need to know which meeting uses which room.

### Interview notes
- Whether the condition is {{<=}} or {{<}} depends on whether intervals are half-open or closed; always ask back.
- To assign concrete rooms, store {{[end, roomId]}} in the heap and reuse the roomId when polling.

> Senior tip: This is exactly the "maximum number of concurrent connections/threads" problem computed from request logs (start, end). Use it to size a connection pool or the number of pods: the real concurrency peak matters more than the average.`,
    follow: ['How would you return the schedule that assigns each meeting to a room?', 'If meetings are added and cancelled all day long, which data structure fits better?']
  },
  'algo-059': {
    prompt: `An ascending array with **no duplicates** has been rotated at an unknown position (for example [0,1,2,4,5,6,7] becomes [4,5,6,7,0,1,2]). Return the index of {{x}}, or {{-1}} if it is absent. Required complexity: **O(log n)**.

### Example
~~~text
a = [4,5,6,7,0,1,2], x = 0 -> 4
a = [4,5,6,7,0,1,2], x = 3 -> -1
~~~

### Constraints
- {{0 <= a.length <= 10^5}}, all elements distinct.`,
    hints: [
      'A linear scan is O(n). Binary search needs to know "which half is x in", but a rotated array is not ascending as a whole.',
      'Cut at mid: **at least one half** [l..m] or [m..r] is still ascending. Compare a[l] with a[m] to see which one.',
      'For the ascending half, just check whether x lies inside [first, last) of that half; if yes search there, otherwise search the other half.'
    ],
    solution: `### Approach
A rotated array is two ascending runs joined together. Cutting at any {{m}} leaves **at least one half ascending** (the "break" point lies on one side only).
- If {{a[l] <= a[m]}}: the left half [l..m] is ascending. Then if {{a[l] <= x < a[m]}} x can only be on the left, otherwise on the right.
- Otherwise the right half [m..r] is ascending: if {{a[m] < x <= a[r]}} go right, else go left.

Because an ascending half has its minimum and maximum at the two ends, the "is x inside this range" test is exact. Each step still discards one half, so O(log n).

Hand run a=[4,5,6,7,0,1,2], x=0:
~~~text
l=0,r=6,m=3: a[m]=7. a[0]=4<=7 -> left half ascending [4..7]; 0 not in [4,7) -> l=4
l=4,r=6,m=5: a[m]=1. a[4]=0<=1 -> left half ascending [0..1]; 0 in [0,1) -> r=4
l=4,r=4,m=4: a[m]=0 == x -> return 4
~~~

~~~java
class Solution {
    public int search(int[] a, int x) {
        int l = 0, r = a.length - 1;
        while (l <= r) {
            int m = l + (r - l) / 2;              // avoids the overflow of (l + r) / 2
            if (a[m] == x) return m;
            if (a[l] <= a[m]) {                   // left half [l..m] is ascending
                if (a[l] <= x && x < a[m]) r = m - 1;
                else l = m + 1;
            } else {                              // right half [m..r] is ascending
                if (a[m] < x && x <= a[r]) l = m + 1;
                else r = m - 1;
            }
        }
        return -1;
    }
}
~~~

### Interview notes
- Use {{<=}} in {{a[l] <= a[m]}}: when l == m (one or two elements left) the left half has a single element, which counts as ascending.
- **With duplicates** (for example [1,1,1,0,1]): if a[l] == a[m] == a[r] you cannot tell which half is ascending; the only option is {{l++}}, which makes the worst case O(n).
- An array that is not rotated still works (the left branch is always taken).

> Senior tip: Binary search usually fails at the boundaries (infinite loop, skipping an element). In an interview, hand-run one-element and two-element arrays before declaring victory; that is where interviewers probe.`,
    follow: ['How do you handle duplicates, and how does the worst case change?', 'How do you find the rotation point (the smallest element) in O(log n)?']
  },
  'algo-060': {
    prompt: `There are jobs with a workload of {{a[i]}} units. A machine runs at {{rate}} units per hour and processes **one** job per hour; when a job has less than {{rate}} units left it finishes and the rest of that hour is wasted. So job {{a[i]}} takes {{ceil(a[i] / rate)}} hours. Find the **smallest integer** {{rate}} that finishes every job within {{h}} hours.

### Example
~~~text
a = [3,6,7,11], h = 8 -> 4
  rate=4: 1 + 2 + 2 + 3 = 8 hours  (feasible)
  rate=3: 1 + 2 + 3 + 4 = 10 hours (not feasible)
~~~

### Constraints
- {{1 <= a.length <= 10^4}}, {{a.length <= h <= 10^9}}
- {{1 <= a[i] <= 2^31 - 1}}`,
    hints: [
      'Trying rate = 1, 2, 3, ... until it works is far too slow (the rate can reach 2 billion). Observe: if rate r works, every rate above r also works.',
      'The feasible/not-feasible property is monotone in rate, so binary search on the **answer**: lo = 1, hi = max(a) (rate = max(a) always works because each job then takes one hour and h >= the number of jobs).',
      'To test a rate m: is the sum of ceil(a[i]/m) <= h? Compute ceil as (a[i] + m - 1) / m on long so it cannot overflow.'
    ],
    solution: `### Approach
**Binary search on the answer**: do not search inside the array, search inside the range of possible answers [1, max(a)].

The function {{hours(m)}} (total hours needed at rate m) **decreases** as m grows. So the sequence of "does it work?" answers looks like {{F F F ... F T T T ... T}}. We need the first T, and binary search finds it in O(log max).

The pattern for "first T":
- {{m}} works: the answer is m or smaller, so {{hi = m}} (keep m).
- {{m}} does not work: the answer is bigger than m, so {{lo = m + 1}}.
- Stop when {{lo == hi}}.

~~~java
class Solution {
    public int minRate(int[] a, int h) {
        int lo = 1, hi = 0;
        for (int x : a) hi = Math.max(hi, x);       // rate = max(a) always works
        while (lo < hi) {
            int m = lo + (hi - lo) / 2;             // not (lo+hi)/2: that can overflow int
            if (hours(a, m) <= h) hi = m;           // works: try a smaller rate, keep m
            else lo = m + 1;                        // does not work: need a bigger rate
        }
        return lo;
    }

    private long hours(int[] a, int rate) {
        long total = 0;
        for (int x : a) {
            total += (x + (long) rate - 1) / rate;  // ceil(x / rate); cast to long before adding
        }
        return total;                               // long: the sum can exceed int
    }
}
~~~

### Why is the long cast necessary?
With {{x = 2147483647}} and {{rate = 2}}, {{x + rate - 1}} computed on int overflows into a negative number, so the ceiling is wrong. Casting to {{(long) rate}} makes the whole expression use long arithmetic.

### Complexity
Each feasibility check is O(n) and there are O(log M) checks with M = max(a), about 31 for values up to 2^31. Total O(n log M).

### Interview notes
- Recognize the pattern: "find the smallest/largest value that satisfies a condition" plus a monotone condition gives binary search on the answer (Koko Eating Bananas, split an array to minimize the maximum, ship packages within D days).
- If h were smaller than the number of jobs, no rate can work; this statement excludes that case, but you should ask what the API should return.

> Senior tip: This pattern is used in real capacity planning: "the minimum number of consumers to drain a Kafka backlog in one hour", "the minimum throughput so the nightly batch finishes before 6 am". Write a feasibility function and binary search it, instead of guessing configuration numbers.`,
    follow: ['If H is smaller than the number of jobs, what should the API return?', 'If the machine could process several jobs per hour (no wasted remainder), would binary search still be needed?']
  },
  'algo-061': {
    prompt: `There are {{n}} vertices numbered {{0..n-1}} and a list of **undirected** edges {{edges}}. Count the **connected components** (groups of vertices where you can walk from any vertex to any other vertex in the group). A vertex with no edges is a component by itself.

### Example
~~~text
n = 5, edges = [[0,1],[1,2],[3,4]] -> 2   ({0,1,2} and {3,4})
n = 4, edges = []                  -> 4
~~~

### Constraints
- {{0 <= n <= 10^5}}, {{0 <= edges.length <= 2 * 10^5}}
- Edges may be self-loops ({{[v, v]}}).`,
    hints: [
      'Build an adjacency list: for each edge [u, v], add v to the neighbour list of u and the other way round (undirected).',
      'Visit every vertex. Reaching an unvisited one means a new component: increment the count, then run DFS/BFS to mark every reachable vertex.',
      'Use an explicit stack/queue instead of recursion: a chain graph with 10^5 vertices would blow the call stack with StackOverflowError.'
    ],
    solution: `### Approach
Picture vertices as people and edges as "knows each other"; a connected component is one "friend group". How to count:
1. Build the **adjacency list** {{g}}: {{g.get(v)}} is the list of vertices adjacent to v.
2. Loop i = 0..n-1. If i is **unvisited**, this is a new group: {{count++}}, then flood from i (DFS) to mark the whole group as visited.
3. The next time a vertex of that group is reached it is already marked, so it is not counted twice.

Each flood marks **exactly one** component, so the number of floods equals the number of components.

~~~java
class Solution {
    public int components(int n, int[][] edges) {
        List<List<Integer>> g = new ArrayList<>();
        for (int i = 0; i < n; i++) g.add(new ArrayList<>());
        for (int[] e : edges) {                  // undirected: add both directions
            g.get(e[0]).add(e[1]);
            g.get(e[1]).add(e[0]);
        }
        boolean[] seen = new boolean[n];
        int count = 0;
        for (int i = 0; i < n; i++) {
            if (seen[i]) continue;               // already part of a counted group
            count++;                             // new group
            Deque<Integer> stack = new ArrayDeque<>();
            stack.push(i);
            seen[i] = true;                      // mark when pushing, so nothing is pushed twice
            while (!stack.isEmpty()) {           // DFS with an explicit stack
                int v = stack.pop();
                for (int w : g.get(v)) {
                    if (!seen[w]) { seen[w] = true; stack.push(w); }
                }
            }
        }
        return count;
    }
}
~~~

### Why O(V + E)?
Every vertex is pushed and popped exactly once (thanks to {{seen}}); every edge is examined twice, once from each endpoint. A self-loop {{[1,1]}} only adds one entry to its own neighbour list, and {{seen[1]}} is already true so it is ignored.

### Another approach: Union-Find
Start with count = n. For each edge, if {{find(u) != find(v)}} then {{union}} them and {{count--}}. Almost O(E) and **no adjacency list is needed**, which suits edges arriving as a stream.

### Interview notes
- Ask: is the graph directed or undirected? For a directed graph the corresponding concept is strongly connected components (Tarjan/Kosaraju), which is considerably harder.
- Recursive DFS 10^5 levels deep overflows the default stack (about 512KB-1MB); use an explicit stack as above.

> Senior tip: For graphs with tens of millions of vertices, {{List<List<Integer>>}} costs a lot of memory because every Integer is an object (about 16 bytes) plus the header of every ArrayList. The CSR layout (two int arrays: offsets and targets) cuts memory several times.`,
    follow: ['If edges were directed, which component concept applies?', 'If edges are added over time and you must report the component count after each addition, what would you use?']
  },
  'algo-062': {
    prompt: `An **undirected, unweighted** graph has {{n}} vertices {{0..n-1}} and an edge list {{e}}. Return the fewest edges needed to travel from {{src}} to {{dst}}; if it is unreachable return {{-1}}. If {{src == dst}} return {{0}}.

### Example
~~~text
n = 4, edges 0-1, 1-2, 0-3, 3-2; src = 0, dst = 2 -> 2   (0-1-2 or 0-3-2)
n = 3, edges 0-1;               src = 0, dst = 2 -> -1
~~~

### Constraints
- {{1 <= n <= 10^5}}, {{0 <= e.length <= 2 * 10^5}}, {{0 <= src, dst < n}}`,
    hints: [
      'Unweighted graph: "shortest path" means the fewest edges. BFS visits in layers of distance 0, 1, 2, ...',
      'Keep a dist[] array filled with -1 (unvisited). When v leaves the queue, every unvisited neighbour w gets dist[w] = dist[v] + 1.',
      'Set dist (mark visited) at **enqueue** time, not at dequeue time, so no vertex enters the queue more than once.'
    ],
    solution: `### Approach
**BFS** (breadth-first search) works like a stone dropped into water: ripples spread in rings. Ring 0 is {{src}}, ring 1 is the neighbours of src, ring 2 is the unvisited neighbours of ring 1, and so on.

A queue (FIFO: first in, first out) makes sure ring k is fully processed before ring k+1. Therefore the **first time** a vertex is reached is through the fewest edges, and its {{dist}} never needs to be corrected.

Hand run example 1:
~~~text
queue=[0]     dist: 0=0
take 0 -> visit 1, 3          dist 1=1, 3=1   queue=[1,3]
take 1 -> visit 2             dist 2=2        queue=[3,2]
take 3 -> 2 already visited, skip             queue=[2]
take 2 == dst -> return 2
~~~

~~~java
class Solution {
    public int shortest(int n, int[][] e, int src, int dst) {
        List<List<Integer>> g = new ArrayList<>();
        for (int i = 0; i < n; i++) g.add(new ArrayList<>());
        for (int[] x : e) { g.get(x[0]).add(x[1]); g.get(x[1]).add(x[0]); }

        int[] dist = new int[n];
        Arrays.fill(dist, -1);                   // -1 = unvisited
        Queue<Integer> q = new ArrayDeque<>();
        q.offer(src);
        dist[src] = 0;
        while (!q.isEmpty()) {
            int v = q.poll();
            if (v == dst) return dist[v];        // dst leaving the queue for the first time = shortest
            for (int w : g.get(v)) {
                if (dist[w] == -1) {             // unvisited
                    dist[w] = dist[v] + 1;       // mark AT enqueue time
                    q.offer(w);
                }
            }
        }
        return -1;                               // queue drained without meeting dst: unreachable
    }
}
~~~

### Interview notes
- **Do not use DFS** for shortest paths: DFS may reach dst through a long detour first.
- Non-negative weights: **Dijkstra** (PriorityQueue). Weights only 0 or 1: 0-1 BFS with a deque.
- To print the path, store {{parent[w] = v}} when enqueueing and then walk backwards from dst.

> Senior tip: When the graph is huge and both ends are known, **bidirectional BFS** (flood from src and dst at the same time, stop when they meet) reduces the vertices visited from roughly b^d to 2·b^(d/2), which is how social networks compute "friends of friends".`,
    follow: ['How would you answer many source-target queries on the same graph?', 'If edges have non-negative weights, which algorithm do you switch to, and why does BFS fail?']
  },
  'algo-063': {
    prompt: `Given an array of transaction codes (strings) and {{k}}, return the {{k}} codes that appear most often, sorted by **frequency descending**; when frequencies tie, the **lexicographically smaller** code comes first.

### Example
~~~text
["b","a","b","a","c"], k = 2 -> ["a","b"]   (a and b both appear 2 times, "a" < "b")
["z","z","z","a","a","b"], k = 2 -> ["z","a"]
~~~

### Constraints
- {{1 <= codes.length <= 10^5}}
- {{1 <= k <=}} number of distinct codes.`,
    hints: [
      'Step 1: count how often each code appears with a HashMap.',
      'Step 2: sort the distinct codes by two criteria: frequency descending, and on a tie the string ascending. Write the Comparator in exactly that order.',
      'Sorting everything is O(u log u) with u distinct codes. When k is much smaller than u, a min-heap of size k gives O(u log k).'
    ],
    solution: `### Approach
Two steps:
1. **Count:** {{freq.merge(code, 1, Integer::sum)}}.
2. **Sort** the list of distinct codes with a two-level Comparator, then take the first k elements.

Write the Comparator with the Java 8+ {{Comparator}} API so the intent is readable:
- {{comparing(freq::get, reverseOrder())}}: frequency **descending**.
- {{.thenComparing(naturalOrder())}}: on a tie the string **ascending**.

Hand run ["b","a","b","a","c"]: freq = {a=2, b=2, c=1}. Sort: a(2), b(2), c(1) (a before b because "a" < "b"). Take 2 -> [a, b].

~~~java
class Solution {
    public List<String> top(String[] codes, int k) {
        Map<String, Integer> freq = new HashMap<>();
        for (String c : codes) freq.merge(c, 1, Integer::sum);   // count frequencies

        List<String> keys = new ArrayList<>(freq.keySet());       // the distinct codes
        keys.sort(Comparator
                .comparing((String key) -> freq.get(key), Comparator.reverseOrder()) // frequency desc
                .thenComparing(Comparator.naturalOrder()));       // tie: lexicographic asc
        return new ArrayList<>(keys.subList(0, k));               // copy: subList is only a view
    }
}
~~~

### When should you use a heap?
If u = 10 million codes and k = 10, sorting all of them costs O(u log u). A min-heap of size k keeps "the k best candidates"; its root is the **weakest** candidate (lowest frequency, and on a tie the largest string), and it is pushed out whenever the heap exceeds k. Total O(u log k). Finally reverse the order in which the heap is drained. See the Top K Frequent Log Entries problem for the heap code.

### Interview notes
- **Tie-breaking must be defined** if the output has to be stable for tests; always ask the interviewer.
- Never write the comparator {{(x, y) -> freq.get(y) - freq.get(x)}}: the subtraction can overflow with large values. Use {{Integer.compare}} or {{Comparator.comparing}}.
- {{subList}} returns a view backed by the original list; copy it with {{new ArrayList<>(...)}} so the caller can modify it freely.

> Senior tip: For streams too large for RAM (top error codes across a whole system), use an approximate algorithm such as Count-Min Sketch plus a heap, or delegate to a dedicated system (Elasticsearch terms aggregation, Redis TopK). Stating the accuracy/memory trade-off explicitly is a plus.`,
    follow: ['How would you limit memory if the number of distinct codes is very large?', 'How would you get the top-k over just the last 5 minutes?']
  },
  'algo-064': {
    prompt: `An ATM holds four denominations {{[100, 50, 20, 10]}} with {{stock[i]}} notes of each. For a withdrawal of {{amount}}, return an array of 4 numbers: **how many notes of each denomination**, so that the total equals amount exactly, no stock limit is exceeded, and the **total number of notes is minimal**. If that is impossible return {{null}}. The function **must not modify** the {{stock}} array.

### Example
~~~text
amount = 180, stock = [1,2,5,10] -> [1,1,1,1]   (100+50+20+10, 4 notes)
amount = 60,  stock = [0,1,3,0]  -> [0,0,3,0]   (three 20s; taking 50 leaves 10 but no 10s exist)
amount = 15,  stock = [1,1,1,1]  -> null
~~~

### Constraints
- {{0 <= amount <= 10^6}}, {{0 <= stock[i] <= 10^4}}`,
    hints: [
      'Try plain greedy "largest denomination first" on example 2: take 50, 10 is left, no 10s available, so it fails, although 20 x 3 is the answer. Greedy alone is not enough when stock is limited.',
      'Observation: 100, 20 and 10 form a divisibility chain (100 = 5 x 20, 20 = 2 x 10). For denominations shaped like that, greedy (take as many of the largest as possible) always finds the fewest-note solution if one exists. Only the 50 breaks the chain.',
      'So try every possible count of 50s (c50 from the maximum down to 0), split the remainder amount - 50 x c50 greedily over 100, 20, 10, and keep the plan with the fewest notes.'
    ],
    solution: `### Approach
**Why is plain greedy wrong?** amount = 60, stock = [0,1,3,0]: greedy takes one 50, 10 remains but there are no 10s, so it reports failure, although three 20s is a valid answer.

**The key observation:** the denominations 100, 20, 10 divide each other in a chain (10 | 20 | 100). For such a system, taking **as many large notes as possible** (within stock) is always optimal: one 100 replaces five 20s and uses fewer notes, and if greedy cannot make the amount, nothing can (whatever remains after the large notes must be paid with smaller ones, which also combine as multiples of each other).

Only the 50 sits outside the chain: 50 is not a multiple of 20, so how many 50s you pick changes whether the remainder is payable. Therefore:
1. Try every {{c50}} from {{min(stock[1], amount/50)}} down to 0.
2. For the remainder {{rest = amount - 50*c50}}: greedy over 100, then 20, then 10.
3. If rest reaches 0, count the notes; keep the plan with the fewest notes (on a tie keep the one with more 50s, because it is visited first).

At most amount/50 + 1 tries, each O(1) -> O(amount/50).

~~~java
class Solution {
    private static final int[] DENOM = {100, 50, 20, 10};

    public int[] withdraw(int amount, int[] stock) {
        int[] best = null;
        int bestNotes = Integer.MAX_VALUE;
        int max50 = Math.min(stock[1], amount / 50);
        for (int c50 = max50; c50 >= 0; c50--) {          // try every number of 50s
            int[] use = new int[4];                         // new array: stock stays untouched
            use[1] = c50;
            int rest = amount - 50 * c50;
            for (int i : new int[]{0, 2, 3}) {              // greedy over the chain 100 -> 20 -> 10
                use[i] = Math.min(stock[i], rest / DENOM[i]); // take as many as possible
                rest -= use[i] * DENOM[i];
            }
            if (rest != 0) continue;                        // this c50 cannot make the amount
            int notes = use[0] + use[1] + use[2] + use[3];
            if (notes < bestNotes) { bestNotes = notes; best = use; }
        }
        return best;                                        // null when no plan works
    }
}
~~~

### Interview notes
- Ask what the objective is: fewest notes? Keep small notes for the next customer's change? Each objective gives a different answer.
- With an **arbitrary denomination set** the general solution is bounded-knapsack DP (like Coin Change with a limited number of each coin). Here we exploit the structure of the denominations to get a simple, fast solution.
- Do not modify {{stock}} inside the planning function: compute the plan first and only deduct stock after the hardware has successfully dispensed the money.

> Senior tip: In real payment systems, separate "planning" (a pure function, easy to test) from "execution" (has side effects, needs transactions/compensation). If a cassette jams halfway, write a journal of the notes actually dispensed so reconciliation uses reality, not the plan.`,
    follow: ['If the goal were to keep as many small notes as possible for later withdrawals, how would the criterion change?', 'How do you make sure stock is not deducted wrongly if the cassette hardware fails midway?']
  },
  'algo-065': {
    prompt: `Given an array {{a}}, return the length of the longest **strictly increasing subsequence**. A subsequence takes elements in their original order but they do **not** have to be adjacent.

### Example
~~~text
[10,9,2,5,3,7,101,18] -> 4   (for example 2,3,7,18 or 2,5,7,101)
[2,2,2]               -> 1   (strictly increasing: equal values do not count)
~~~

### Constraints
- {{0 <= a.length <= 2 * 10^5}} (O(n²) is too slow)
- {{-10^9 <= a[i] <= 10^9}}`,
    hints: [
      'Basic version: dp[i] = length of the LIS ending at i = 1 + max(dp[j]) over j < i with a[j] < a[i]. Correct but O(n²).',
      'Fast version: keep an array tails, where tails[len-1] is the **smallest ending value** of any increasing run of length len. The tails array is always ascending.',
      'For each x, binary search the first position in tails whose value is >= x (lower bound). Overwrite x there; if that position equals size, the run got one longer.'
    ],
    solution: `### Approach
**Step 1, understand the O(n²) version:** {{dp[i]}} is the length of the longest increasing run ending at i. To append a[i] after a run, that run must end with a smaller value. Correct, but every i has to look back at every j < i.

**Step 2, the observation that speeds it up:** among runs of the same length, the one whose **last element is smaller** is always "better", because it is easier to extend. So for each length len we only need to remember the smallest possible last element: {{tails[len-1]}}.

The {{tails}} array is always **ascending** (a longer run must end with a larger value), so we can search it with binary search. For each x:
- Find the first position {{pos}} with {{tails[pos] >= x}}.
- If {{pos == size}}: x is larger than every ending value, so the longest run becomes one longer, {{size++}}.
- Otherwise: write {{tails[pos] = x}}, so the run of length pos+1 now ends with a smaller (better) value.

Hand run [10,9,2,5,3,7,101,18]:
~~~text
x=10  tails=[10]
x=9   tails=[9]          (replace 10)
x=2   tails=[2]
x=5   tails=[2,5]        (extend)
x=3   tails=[2,3]        (replace 5)
x=7   tails=[2,3,7]
x=101 tails=[2,3,7,101]
x=18  tails=[2,3,7,18]   -> size = 4
~~~
Note: {{tails}} is **not necessarily** a real subsequence, but its **length** is always exactly the LIS length.

~~~java
class Solution {
    public int lis(int[] a) {
        int[] tails = new int[a.length];
        int size = 0;                          // number of slots currently used in tails
        for (int x : a) {
            int lo = 0, hi = size;             // search inside tails[0..size)
            while (lo < hi) {                  // lower bound: first pos with tails[pos] >= x
                int mid = (lo + hi) >>> 1;
                if (tails[mid] < x) lo = mid + 1;
                else hi = mid;
            }
            tails[lo] = x;                     // replace or extend
            if (lo == size) size++;            // x beats every ending value: LIS grows by one
        }
        return size;
    }
}
~~~

### Interview notes
- For **strictly increasing** use lower bound ({{tails[mid] < x}}); if the statement allows **non-decreasing** (equals are allowed), use upper bound ({{tails[mid] <= x}}).
- Present the O(n²) version first, then optimize: interviewers want to see the reasoning process.
- To print the actual subsequence, also store the ending index for each length plus a {{parent}} array, then walk backwards.

> Senior tip: LIS shows up in practice in diff/patience sorting (git diff --patience uses this idea) and in the "nested boxes/envelopes" problem. Spotting an LIS model behind a "business" statement is a skill that interviewers value.`,
    follow: ['How do you rebuild the actual subsequence, not just its length?', 'If equal elements were allowed (non-decreasing), which line would you change?']
  },
  'algo-066': {
    prompt: `Given daily stock prices {{p}} and a maximum number of trades {{k}}. One trade means buy and then sell; you **never hold two positions at once** (you must sell before buying again). Buying and selling on the same day is allowed for different trades. Return the maximum profit.

### Example
~~~text
k = 2, p = [3,2,6,5,0,3] -> 7   (buy 2 sell 6: +4; buy 0 sell 3: +3)
k = 1, p = [1,2,3,0,6]   -> 6   (buy 0 sell 6)
~~~

### Constraints
- {{0 <= p.length <= 1000}}, {{0 <= k <= 100}}, {{0 <= p[i] <= 1000}}`,
    hints: [
      'At any moment your state consists of: how many trades you have completed (j), and whether you are holding a stock or holding cash.',
      'cash[j] = best profit while holding cash after selling j times; hold[j] = best profit while holding a stock for trade j. Each day: cash[j] = max(cash[j], hold[j] + price), hold[j] = max(hold[j], cash[j-1] - price).',
      'If k >= n/2 the limit no longer matters: add every rising step p[i] - p[i-1] > 0.'
    ],
    solution: `### Approach
This is DP over **states**. Each day you can only be in one of two situations for every j = 1..k:
- {{hold[j]}}: **holding a stock** for trade j (bought j times, sold j-1 times). The value is the best profit (buying decreases profit).
- {{cash[j]}}: **holding cash**, having finished j sells.

Transitions for one day at {{price}}:
- {{cash[j] = max(cash[j], hold[j] + price)}}: either do nothing, or sell today.
- {{hold[j] = max(hold[j], cash[j-1] - price)}}: either keep holding, or buy today after finishing j-1 trades.

Initialization: {{cash[j] = 0}} (nothing done yet), {{hold[j] = -infinity}} (you cannot hold a stock without buying). The answer is {{cash[k]}} (cash does not decrease with j because "at most k" also includes trading less).

**Update order:** iterate j from k down to 1 so that the {{cash[j-1]}} used in {{hold[j]}} is still **yesterday's** value. In fact buying and selling on the same day creates no profit, so any order gives the same result, but iterating downwards makes the argument clean.

**Shortcut when k is large:** n days contain at most n/2 separate rising runs. If k >= n/2 treat it as unlimited: add every positive difference between consecutive days. This branch avoids O(nk) when k is huge.

~~~java
class Solution {
    public long profit(int k, int[] p) {
        int n = p.length;
        if (n == 0 || k == 0) return 0;
        if (k >= n / 2) {                          // effectively unlimited: take every rising run
            long sum = 0;
            for (int i = 1; i < n; i++) sum += Math.max(0, p[i] - p[i - 1]);
            return sum;
        }
        long[] cash = new long[k + 1];             // cash[j]: holding cash, sold j times
        long[] hold = new long[k + 1];             // hold[j]: holding the stock of trade j
        Arrays.fill(hold, Long.MIN_VALUE / 4);     // "-infinity" that survives adding a price
        for (int price : p) {
            for (int j = k; j >= 1; j--) {
                cash[j] = Math.max(cash[j], hold[j] + price);     // sell today
                hold[j] = Math.max(hold[j], cash[j - 1] - price); // buy today
            }
        }
        return cash[k];
    }
}
~~~

### Hand run k=2, p=[3,2,6,5,0,3] (only hold1, cash1, hold2, cash2)
~~~text
3: h1=-3 c1=0  h2=-3 c2=0
2: h1=-2 c1=0  h2=-2 c2=0
6: h1=-2 c1=4  h2=-2 c2=4
5: h1=-2 c1=4  h2=-1 c2=4
0: h1= 0 c1=4  h2= 4 c2=4
3: h1= 0 c1=4  h2= 4 c2=7   -> answer 7
~~~

### Interview notes
- Use {{Long.MIN_VALUE / 4}} instead of {{Long.MIN_VALUE}}: {{MIN_VALUE + price}} is fine, but {{MIN_VALUE - price}} overflows into a huge positive number and breaks the DP.
- To add a transaction fee: subtract the fee when selling. To add a one-day cooldown: hold[j] must buy from the cash of **two days ago**, which needs one more array.

> Senior tip: This "states + transitions" modeling is the state machine you already use every day (order status, sagas). In an interview, drawing the state diagram before writing the DP formula lets you and the interviewer verify correctness together.`,
    follow: ['Which extra states do a transaction fee and a cooldown need?', 'If you had to print the buy/sell days, what would you store?']
  }
});