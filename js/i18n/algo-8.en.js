/*
 * English translation of js/data/algo.js — task T243. Format: js/core/i18n.js (content overlay).
 * ids: algo-048 algo-049 algo-050 algo-051 algo-052 algo-053 algo-054 algo-055 algo-056 algo-057 algo-058 algo-059 algo-060 algo-061 algo-062 algo-063 algo-064 algo-065 algo-066
 */
App.i18n.content({
  'algo-048': {
    prompt: `Given a log stream (each line is a string) and an integer {{k}}. Return the {{k}} most frequent entries, sorted in descending order of frequency; if frequencies are equal, sort in ascending order of the entry string to ensure stable results.

### Example
~~~text
logs = ["ERROR db", "ERROR db", "WARN cache", "ERROR db", "INFO ok"]
k = 2
Output: ["ERROR db", "INFO ok"]
Explanation: "ERROR db" appears 3 times; the remaining entries appear 1 time each, so they are taken in lexicographical ascending order.
~~~

### Constraints
- {{1 <= number of lines <= 10^7}}
- {{1 <= k <= number of distinct entries}}
- Each line is at most 256 characters long.`,
    hints: [
      'Count frequencies using a {{HashMap}} first, then select the top-k.',
      'Maintain a min-heap of size {{k}} based on frequency to evict the least frequent element.',
      'When frequencies are equal, use a secondary criterion (e.g., lexicographical order) to ensure stable and testable results.'
    ],
    solution: `### Idea
Count frequencies using {{merge}}. Use a min-heap of size {{k}}; the comparator compares frequencies in ascending order, and if equal, prioritizes evicting keys that are lexicographically larger. Finally, retrieve elements from the heap and reverse to get descending order.

Time complexity: O(n + u log k), where u is the number of distinct entries. Space complexity: O(u).

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
- If the number of distinct entries (cardinality) is huge (tens of millions), {{HashMap}} might lead to OOM; in that case, use Count-Min Sketch or batching/MapReduce.
- For an infinite streaming dataset, exact top-k requires keeping track of all frequencies; for approximate results, use heavy hitters algorithms.
- Avoid {{a.getValue() - b.getValue()}} in comparators as it can overflow; use {{Integer.compare}}.
- Clarify: is a "log entry" the entire line or a parsed field? Parsing significantly affects cardinality.`,
    follow: ['If data does not fit in RAM, how would you design a MapReduce approach?', 'How can you find top-k per time window?']
  },
  'algo-049': {
    prompt: `Normalize a list of transaction IDs: remove leading/trailing spaces, convert to uppercase, and remove empty IDs. Keep the original order and duplicate entries.

### Example
~~~text
[" ab1 ", "", "Xy2"] -> ["AB1", "XY2"]
~~~

### Constraints
0 ≤ n ≤ 100000; IDs contain only ASCII letters and numbers.`,
    hints: [
      'Iterate once, creating a new result list.',
      'Trim and check if the string is empty before converting to uppercase.',
      'Do not use a Set, as duplicate transactions are still significant.'
    ],
    solution: `### Idea
Iterate through the input in order; discard empty strings after trimming, and add the uppercase version to the output.

~~~java
class Solution {
    public List<String> normalize(List<String> ids) {
        List<String> out = new ArrayList<>();
        for (String id : ids) {
            String value = id.trim();
            if (!value.isEmpty()) out.add(value.toUpperCase(Locale.ROOT));
        }
        return out;
    }
}
~~~

### Interview notes
Use {{Locale.ROOT}} to avoid locale-dependent character case rules; do not remove duplicates if the business requirement needs auditing each individual transaction.`,
    follow: ['If IDs are case-sensitive, which normalization step would you change?']
  },
  'algo-050': {
    prompt: `Aggregate transaction amounts by date. Each transaction is [date, amount]; return a map of totals per date.

### Example
~~~text
[["Mon", 5], ["Tue", 4], ["Mon", -2]] -> {Mon=3, Tue=4}
~~~

### Constraints
Amounts are within int; use long for the total.`,
    hints: [
      'Each date is a key.',
      'Use {{merge}} for accumulation.',
      'The total value should be {{long}} to prevent int overflow.'
    ],
    solution: `### Idea
The map maintains the cumulative total; update the correct key for each row.

~~~java
class Solution {
    public Map<String, Long> totals(String[][] rows) {
        Map<String, Long> out = new LinkedHashMap<>();
        for (String[] row : rows) out.merge(row[0], Long.parseLong(row[1]), Long::sum);
        return out;
    }
}
~~~

### Interview notes
Choose {{LinkedHashMap}} if the result needs to follow the date order of appearance; if dates must be sorted chronologically, parse to {{LocalDate}} and sort.`,
    follow: ['How would you handle datasets exceeding RAM using batching?']
  },
  'algo-051': {
    prompt: `Return the index of the first character that appears only once in the string; if none, return -1.

### Example
~~~text
"swiss" -> 1
~~~

### Constraints
String consists of lowercase ASCII letters; maximum length 200000.`,
    hints: [
      'Need to know frequency before selecting the index.',
      'Two passes are still O(n).',
      'Use an array of size 26 for the limited alphabet.'
    ],
    solution: `### Idea
Count frequencies, then iterate again in the original order.

~~~java
class Solution {
    public int firstUnique(String s) {
        int[] count = new int[26];
        for (char ch : s.toCharArray()) count[ch - 'a']++;
        for (int i = 0; i < s.length(); i++) if (count[s.charAt(i) - 'a'] == 1) return i;
        return -1;
    }
}
~~~

### Interview notes
If Unicode graphemes are considered a single character, {{char}} is insufficient because Java {{char}} is a UTF-16 code unit; clarify the definition of a character.`,
    follow: ['If you need to support Unicode code points, how does the counting method change?']
  },
  'algo-052': {
    prompt: `Merge two sorted arrays of numbers into one sorted array, keeping duplicates.

### Example
~~~text
[1, 4] + [2, 4] -> [1, 2, 4, 4]
~~~

### Constraints
Both inputs can be empty; values can be negative.`,
    hints: [
      'Keep one pointer for each array.',
      'Take the smaller element at each step.',
      'When one array is exhausted, copy the rest of the other.'
    ],
    solution: `### Idea
Each iteration consumes at least one element, so total time is linear.

~~~java
class Solution {
    public int[] merge(int[] a, int[] b) {
        int[] out = new int[a.length + b.length]; int i=0,j=0,k=0;
        while(i<a.length && j<b.length) out[k++]=a[i]<=b[j]?a[i++]:b[j++];
        while(i<a.length) out[k++]=a[i++];
        while(j<b.length) out[k++]=b[j++];
        return out;
    }
}
~~~

### Interview notes
If data arrives as a stream, you can emit elements one by one, but consider backpressure if the consumer is slow.`,
    follow: ['If two streams are sorted only by timestamp, how should you merge them?']
  },
  'algo-053': {
    prompt: `Given stock prices by day, pick at most one buy and one subsequent sell for maximum profit; if no transaction is profitable, profit is 0.

### Example
~~~text
[7, 1, 5, 3, 6, 4] -> 5
~~~

### Constraints
0 ≤ n ≤ 200000; prices are non-negative.`,
    hints: [
      'At the sell day, need to know the lowest buy price seen so far.',
      'Update min before calculating profit.',
      'No need to store the full history besides the lowest price and the best profit.'
    ],
    solution: `### Idea
Traverse left to right, comparing each sell price with the minimum seen so far.

~~~java
class Solution {
    public int maxProfit(int[] prices) {
        int low = Integer.MAX_VALUE, best = 0;
        for (int price : prices) { low = Math.min(low, price); best = Math.max(best, price - low); }
        return best;
    }
}
~~~

### Interview notes
If multiple transactions are allowed, this becomes a different problem; clarify fee and cooldown requirements.`,
    follow: ['If you need to return both the buy and sell day, how do you handle ties?']
  },
  'algo-054': {
    prompt: `Verify if a string consisting only of (), [], {} is balanced. Empty strings are considered valid.

### Example
~~~text
{[()]} -> true; ([)] -> false
~~~

### Constraints
Maximum length 200000.`,
    hints: [
      'When encountering an opening character, store the bracket type.',
      'Closing characters must match the most recently opened, unclosed bracket.',
      'If the stack is not empty after the loop, the string has missing closing brackets.'
    ],
    solution: `### Idea
Stack models brackets waiting to be closed in LIFO order.

~~~java
class Solution {
    public boolean balanced(String s) {
        Deque<Character> st = new ArrayDeque<>();
        for(char c:s.toCharArray()) {
            if(c=='('||c=='['||c=='{') st.push(c);
            else { if(st.isEmpty()) return false; char o=st.pop();
                if((c==')'&&o!='(')||(c==']'&&o!='[')||(c=='}'&&o!='{')) return false; }
        }
        return st.isEmpty();
    }
}
~~~

### Interview notes
{{ArrayDeque}} does not accept null; only push valid characters here.`,
    follow: ['If the string contains regular characters that should be ignored, what changes?']
  },
  'algo-055': {
    prompt: `Given non-negative costs and a budget B, return the length of the longest continuous segment with sum ≤ B.

### Example
~~~text
[2,1,3,2], B=4 -> 2
~~~

### Constraints
0 ≤ n ≤ 200000; costs are non-negative.`,
    hints: [
      'Use a sliding window.',
      'Expand right, shrink left if budget is exceeded.',
      'Non-negative property ensures shrinking the left does not unexpectedly decrease the sum.'
    ],
    solution: `### Idea
The window maintains a valid total sum; each element enters and leaves the window at most once.

~~~java
class Solution { public int longest(int[] a,int budget){ int l=0,best=0; long sum=0; for(int r=0;r<a.length;r++){sum+=a[r]; while(sum>budget) sum-=a[l++]; best=Math.max(best,r-l+1);} return best;} }
~~~

### Interview notes
This sliding window approach is incorrect if there are negative numbers because the sum is no longer monotonic.`,
    follow: ['If negative costs appear, what structure do you choose?']
  },
  'algo-056': {
    prompt: `Count the number of continuous subarrays with sum equal to target; the array can contain negative numbers.

### Example
~~~text
[1,1,1], target=2 -> 2
~~~

### Constraints
n ≤ 200000.`,
    hints: [
      'Use prefix sums.',
      'For current prefix sum P, need the frequency of prefix P-target seen so far.',
      'Map stores frequencies, initialize with prefix sum 0 once.'
    ],
    solution: `### Idea
If prefix[j]-prefix[i]=target, then subarray (i,j] is valid; count required prefixes before recording the current prefix.

~~~java
class Solution { public long count(int[] a,int target){ Map<Long,Long> f=new HashMap<>(); f.put(0L,1L); long sum=0,ans=0; for(int v:a){sum+=v; ans+=f.getOrDefault(sum-target,0L); f.merge(sum,1L,Long::sum);} return ans;} }
~~~

### Interview notes
Use {{long}} for sum and count; the number of subarrays can be approximately n(n+1)/2.`,
    follow: ['Why is the sliding window not generally applicable for negative numbers?']
  },
  'algo-057': {
    prompt: `Merge overlapping or touching intervals; return the list sorted by start point.

### Example
~~~text
[[1,3],[3,5],[8,9]] -> [[1,5],[8,9]]
~~~

### Constraints
Each interval has start ≤ end.`,
    hints: [
      'Sort by start.',
      'Maintain the current interval and extend end if they overlap.',
      'Clone data if input modification is not allowed.'
    ],
    solution: `### Idea
After sorting, only the last interval in the result can overlap with a new interval.

~~~java
class Solution { public int[][] merge(int[][] a){ Arrays.sort(a,Comparator.comparingInt(x->x[0])); List<int[]> out=new ArrayList<>(); for(int[] v:a){if(out.isEmpty()||v[0]>out.get(out.size()-1)[1]) out.add(new int[]{v[0],v[1]}); else out.get(out.size()-1)[1]=Math.max(out.get(out.size()-1)[1],v[1]);} return out.toArray(new int[out.size()][]);} }
~~~

### Interview notes
Clarify if intervals are closed or half-open; overlap conditions depend on time contracts.`,
    follow: ['If meetings use [start, end) intervals, how does the overlap condition change?']
  },
  'algo-058': {
    prompt: `Given meetings [start, end), find the minimum number of rooms required so that no meetings overlap in the same room.

### Example
~~~text
[[0,30],[5,10],[15,20]] -> 2
~~~

### Constraints
start < end; n ≤ 100000.`,
    hints: [
      'Sort by start time.',
      'Use a min-heap to store the earliest end time of each busy room.',
      'If the earliest room has ended, reuse it.'
    ],
    solution: `### Idea
Heap size represents the number of rooms needed; end time equal to start time is reused per the half-open interval definition.

~~~java
class Solution { public int rooms(int[][] a){ Arrays.sort(a,Comparator.comparingInt(v->v[0])); PriorityQueue<Integer> q=new PriorityQueue<>(); int best=0; for(int[] m:a){while(!q.isEmpty()&&q.peek()<=m[0])q.poll(); q.offer(m[1]); best=Math.max(best,q.size());} return best;} }
~~~

### Interview notes
If specific room assignment is needed, the heap should store both roomId and end time; complexity remains O(n log n).`,
    follow: ['How would you return the meeting schedule assigned to each room?']
  },
  'algo-059': {
    prompt: `An ascending array is rotated at an unknown position, find index of target or -1; elements are unique.

### Example
~~~text
[4,5,6,7,0,1,2], target=0 -> 4
~~~

### Constraints
O(log n) time complexity.`,
    hints: [
      'At each step, at least one half is sorted.',
      'Identify the sorted half and check if target lies within that range.',
      'Shrink bounds based on the including range.'
    ],
    solution: `### Idea
Binary search still discards half each turn by identifying the ordered half.

~~~java
class Solution { public int search(int[] a,int x){int l=0,r=a.length-1;while(l<=r){int m=l+(r-l)/2;if(a[m]==x)return m;if(a[l]<=a[m]){if(a[l]<=x&&x<a[m])r=m-1;else l=m+1;}else{if(a[m]<x&&x<=a[r])l=m+1;else r=m-1;}}return -1;} }
~~~

### Interview notes
Duplicate elements make identifying the sorted half ambiguous; worst case can degrade to O(n).`,
    follow: ['Under what conditions would duplicates still allow for a correct result?']
  },
  'algo-060': {
    prompt: `The machine processes at most rate units per hour; only one job is processed per hour, ignoring remaining time in the hour. Find the minimum integer rate {{k}} to complete all volumes within H hours.

### Example
~~~text
[3,6,7,11], H=8 -> 4
~~~

### Constraints
Volume is positive; H ≥ number of jobs.`,
    hints: [
      'The minimum rate is 1, maximum is the largest pile (consuming one pile per hour).',
      'Check rate by sum of {{ceil(work/rate)}}.',
      'Calculate {{ceil}} using safe integer division.'
    ],
    solution: `### Idea
Feasibility is monotonic with respect to rate, so binary search on the answer.

~~~java
class Solution { public int minRate(int[] a,int h){int lo=1,hi=0;for(int x:a)hi=Math.max(hi,x);while(lo<hi){int m=lo+(hi-lo)/2;long hours=0;for(int x:a)hours+=(x+(long)m-1)/m;if(hours<=h)hi=m;else lo=m+1;}return lo;} }
~~~

### Interview notes
Cast to long before addition to avoid overflow when x is near Integer.MAX_VALUE.`,
    follow: ['If H is less than the number of jobs, what should the API return?']
  },
  'algo-061': {
    prompt: `Given n vertices 0..n-1 and a list of undirected edges, count connected components.

### Example
~~~text
n=5, edges=[[0,1],[1,2],[3,4]] -> 2
~~~

### Constraints
Graph has no duplicate edges; n ≤ 100000.`,
    hints: [
      'Create an adjacency list.',
      'For each unvisited vertex, increase count and perform DFS/BFS to mark the entire component.',
      'Use iterative stack for DFS to avoid call stack overflow on deep graphs.'
    ],
    solution: `### Idea
Each DFS pass marks exactly one connected component.

~~~java
class Solution { public int components(int n,int[][] edges){List<List<Integer>> g=new ArrayList<>();for(int i=0;i<n;i++)g.add(new ArrayList<>());for(int[]e:edges){g.get(e[0]).add(e[1]);g.get(e[1]).add(e[0]);}boolean[] seen=new boolean[n];int count=0;for(int i=0;i<n;i++)if(!seen[i]){count++;Deque<Integer> q=new ArrayDeque<>();q.push(i);seen[i]=true;while(!q.isEmpty()){int v=q.pop();for(int w:g.get(v))if(!seen[w]){seen[w]=true;q.push(w);}}}return count;} }
~~~

### Interview notes
With very large graphs in production, adjacency lists have object overhead; consider CSR or primitive arrays.`,
    follow: ['If edges are directed, which component concept is applicable?']
  },
  'algo-062': {
    prompt: `Find the minimum number of edges from source to target in an unweighted undirected graph; if unreachable, return -1.

### Example
~~~text
0-1, 1-2, 0-3, 3-2: 0 to 2 -> 2
~~~

### Constraints
Vertices numbered 0..n-1.`,
    hints: [
      'BFS visits in layers of distance.',
      'Mark as visited when enqueuing to avoid adding to queue repeatedly.',
      'Can return immediately when target is dequeued.'
    ],
    solution: `### Idea
BFS guarantees the first visit to a vertex is via the shortest path.

~~~java
class Solution { public int shortest(int n,int[][] e,int src,int dst){List<List<Integer>>g=new ArrayList<>();for(int i=0;i<n;i++)g.add(new ArrayList<>());for(int[]x:e){g.get(x[0]).add(x[1]);g.get(x[1]).add(x[0]);}int[]d=new int[n];Arrays.fill(d,-1);Queue<Integer>q=new ArrayDeque<>();q.offer(src);d[src]=0;while(!q.isEmpty()){int v=q.poll();if(v==dst)return d[v];for(int w:g.get(v))if(d[w]<0){d[w]=d[v]+1;q.offer(w);}}return -1;} }
~~~

### Interview notes
For weighted edges, use Dijkstra (non-negative weights), not standard BFS.`,
    follow: ['How would you handle multiple source-target queries on the same graph?']
  },
  'algo-063': {
    prompt: `Return k codes appearing most frequently; if frequencies are equal, the lexicographically smaller code comes first.

### Example
~~~text
["b","a","b","a","c"], k=2 -> ["a","b"]
~~~

### Constraints
1 ≤ k ≤ number of distinct codes.`,
    hints: [
      'Count frequency using a Map.',
      'Comparator must sort frequency descending, then key ascending.',
      'Can sort all unique keys or use a heap when k is small.'
    ],
    solution: `### Idea
Sort unique keys according to the defined rule and take the first k elements.

~~~java
class Solution { public List<String> top(String[] a,int k){Map<String,Integer>m=new HashMap<>();for(String s:a)m.merge(s,1,Integer::sum);List<String>r=new ArrayList<>(m.keySet());r.sort((x,y)->m.get(x).equals(m.get(y))?x.compareTo(y):Integer.compare(m.get(y),m.get(x)));return new ArrayList<>(r.subList(0,k));} }
~~~

### Interview notes
Tie-break must be defined if test output needs to be deterministic. If k is close to u, sorting all may be simpler than a heap.`,
    follow: ['How to limit memory usage if unique keys are very large?']
  },
  'algo-064': {
    prompt: `ATM has denominations [100,50,20,10] and stock for each. For withdrawal amount, return vector of bills used, preferring largest denominations; if amount not achievable or stock insufficient, return null.

### Example
~~~text
amount=180, stock=[1,2,5,10] -> [1,1,1,1]
~~~

### Constraints
Do not modify the input stock if the transaction fails.`,
    hints: [
      'Try denominations from largest to smallest.',
      'Limit number of bills by stock and amount/denomination.',
      'Only commit result if remainder is 0.'
    ],
    solution: `### Idea
Take as many bills as possible for the current denomination; temporary results do not change stock.

~~~java
class Solution { public int[] withdraw(int amount,int[] stock){int[]d={100,50,20,10},out=new int[4];for(int i=0;i<4;i++){out[i]=Math.min(stock[i],amount/d[i]);amount-=out[i]*d[i];}return amount==0?out:null;} }
~~~

### Interview notes
Greedy minimizes bill count with this specific denomination set given inventory constraints; it does not always work with arbitrary denominations, which would require DP or backtracking.`,
    follow: ['How to ensure money is not dispensed if hardware cassette fails mid-transaction?']
  },
  'algo-065': {
    prompt: `Return the length of the longest strictly increasing subsequence; does not need to be continuous.

### Example
~~~text
[10,9,2,5,3,7,101,18] -> 4
~~~

### Constraints
n ≤ 200000.`,
    hints: [
      'DP O(n²) is basic but slow for large input.',
      'Maintain tails: position i is the smallest ending value of a subsequence of length i+1.',
      'For each number, use lower_bound to find the first position ≥ the number.'
    ],
    solution: `### Idea
{{tails}} is not always the actual subsequence, but its length is the exact answer.

~~~java
class Solution { public int lis(int[] a){int[]t=new int[a.length];int size=0;for(int x:a){int l=0,r=size;while(l<r){int m=(l+r)/2;if(t[m]<x)l=m+1;else r=m;}t[l]=x;if(l==size)size++;}return size;} }
~~~

### Interview notes
Use {{<}} in lower_bound for strictly increasing; non-decreasing uses upper_bound.`,
    follow: ['How to recover the actual subsequence, not just the length?']
  },
  'algo-066': {
    prompt: `Given prices by day and maximum number of trades k. Each trade consists of buying and then selling; cannot hold multiple positions simultaneously. Return maximum profit.

### Example
~~~text
prices=[3,2,6,5,0,3], k=2 -> 7
~~~

### Constraints
n ≤ 1000, k ≤ 100.`,
    hints: [
      'DP based on the number of trades sold and hold/cash state.',
      'Use old prices each day to avoid buying and selling on the same day in the same transition.',
      'If k ≥ n/2, the problem reduces to the sum of all price increases.'
    ],
    solution: `### Idea
DP maintains the best profit after at most j sales in cash or hold state.

~~~java
class Solution { public long profit(int k,int[] p){if(p.length==0||k==0)return 0;if(k>=p.length/2){long a=0;for(int i=1;i<p.length;i++)a+=Math.max(0L,(long)p[i]-p[i-1]);return a;}long[] cash=new long[k+1],hold=new long[k+1];Arrays.fill(hold,Long.MIN_VALUE/4);for(int price:p)for(int j=k;j>=1;j--){cash[j]=Math.max(cash[j],hold[j]+price);hold[j]=Math.max(hold[j],cash[j-1]-price);}return cash[k];} }
~~~

### Interview notes
If there are fees/cooldowns, state transitions need to be adjusted; clarify update order so states from the same day are not used incorrectly.`,
    follow: ['What additional states are needed for transaction fees and cooldowns?']
  }
});