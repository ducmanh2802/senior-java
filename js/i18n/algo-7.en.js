/*
 * English translation of js/data/algo.js — task T242. Format: js/core/i18n.js (content overlay).
 * ids: algo-042 algo-043 algo-044 algo-045 algo-046 algo-047
 */
App.i18n.content({
  'algo-042': {
    prompt: `Given an array {{candidates}} of distinct positive integers and a number {{target}}. Find all unique combinations that sum up to {{target}}. Each element can be used an unlimited number of times. The result must not contain duplicate combinations (different order is not considered different).

### Example
~~~text
Input:  candidates = [2,3,6,7], target = 7
Output: [[2,2,3],[7]]

Input:  candidates = [2,3,5], target = 8
Output: [[2,2,2,2],[2,3,3],[3,5]]
~~~

### Constraints
- {{1 <= candidates.length <= 30}}
- {{2 <= candidates[i] <= 40}}
- {{1 <= target <= 40}}`,
    hints: [
      'This is a selection problem with multiple uses from a set, need to avoid generating duplicate permutations.',
      'Sort candidates and use the {{start}} parameter to only select elements from that position onwards.',
      'When recursing, pass the same {{i}} (not {{i + 1}}) to allow reuse; if the element exceeds remain, break because it is sorted.'
    ],
    solution: `### Idea
Backtracking with {{start}} and remaining sum {{remain}}. Select {{candidates[i]}}, subtract from remain, recurse with the same {{i}} to allow reuse. If remain = 0, record; if negative, stop branch.

Sort first to break early when elements are larger than remain.

~~~java
class Solution {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        Arrays.sort(candidates);
        List<List<Integer>> result = new ArrayList<>();
        backtrack(0, target, candidates, new ArrayList<>(), result);
        return result;
    }

    private void backtrack(int start, int remain, int[] candidates,
                           List<Integer> path, List<List<Integer>> result) {
        if (remain == 0) {
            result.add(new ArrayList<>(path));
            return;
        }
        for (int i = start; i < candidates.length; i++) {
            if (candidates[i] > remain) break;   // sorted
            path.add(candidates[i]);
            backtrack(i, remain - candidates[i], candidates, path, result);
            path.remove(path.size() - 1);
        }
    }
}
~~~

### Interview notes
- Passing {{i}} instead of {{i + 1}} is key to allowing reuse; but still keep {{start}} to avoid duplicate permutations.
- If candidates has duplicate elements, need an extra step to skip duplicates at the same level: {{i > start && candidates[i] == candidates[i - 1]}}.
- Can prune branches more aggressively with remain and smallest value; breaking after sort is enough for this problem.

> Senior tip: Combination Sum is a lesson in "avoiding duplicates by ordering". Many candidates get the sum correct but return duplicate permutations; draw the recursion tree and point out how the start parameter eliminates redundant backtracking branches.`,
    follow: ['If each element can only be used once, how to modify it?', 'How to count the number of combinations instead of listing them?']
  },
  'algo-043': {
    prompt: `Given array {{nums}} where {{nums[i]}} is the maximum jump length from position {{i}}. Start from position 0, determine if you can reach the last position.

### Example
~~~text
Input:  nums = [2,3,1,1,4]
Output: true
Explanation: jump 1 step from 0 to 1, then 3 steps to the end.

Input:  nums = [3,2,1,0,4]
Output: false
Explanation: always get stuck at position 3.
~~~

### Constraints
- {{1 <= nums.length <= 10^4}}
- {{0 <= nums[i] <= 10^5}}`,
    hints: [
      'No need to try every jump; only need to know the farthest position reachable.',
      'Iterate from left to right, updating {{farthest = max(farthest, i + nums[i])}}.',
      'If at a position {{i}} where {{i > farthest}}, meaning cannot reach it — return false.'
    ],
    solution: `### Idea
Greedy: maintain the farthest position reachable. At each position within range, update the new reach. If encountering a position beyond reach, cannot continue.

This is O(n) time, O(1) space, better than DP O(n²).

~~~java
class Solution {
    public boolean canJump(int[] nums) {
        int farthest = 0;
        for (int i = 0; i < nums.length; i++) {
            if (i > farthest) return false;          // cannot reach i
            farthest = Math.max(farthest, i + nums[i]);
            if (farthest >= nums.length - 1) return true;
        }
        return true;
    }
}
~~~

### Interview notes
- {{i + nums[i]}} can overflow if constraints are large; with {{10^4 + 10^5}} it's safe, but use {{long}} if extending.
- Array with one element always returns true as it is already at the end.
- Follow-up question: find minimum number of jumps (Jump Game II) — for that, use BFS/greedy per level, not just farthest.

> Senior tip: Greedy is correct here because being able to reach a farther position is always better or equal, no reason to choose a shorter step. When encountering greedy problems, always ask yourself "is there any counter-example where choosing farther is worse?" — if not, that's a good sign.`,
    follow: ['How to find the minimum number of jumps?', 'If you can jump backwards, how does the problem change?']
  },
  'algo-044': {
    prompt: `Given array {{intervals}} where {{intervals[i] = [start, end]}}. Find the minimum number of intervals to remove so that the remaining intervals do not overlap. Two intervals touching at the boundary (end == start) are considered non-overlapping.

### Example
~~~text
Input:  intervals = [[1,2],[2,3],[3,4],[1,3]]
Output: 1
Explanation: remove [1,3], remaining [1,2],[2,3],[3,4].

Input:  intervals = [[1,2],[1,2],[1,2]]
Output: 2
~~~

### Constraints
- {{1 <= intervals.length <= 10^5}}
- {{-5 * 10^4 <= start < end <= 5 * 10^4}}`,
    hints: [
      'Need to keep as many intervals as possible. This is an activity selection problem.',
      'Sort by end time in ascending order; intervals ending early are always a good choice to make room for subsequent ones.',
      'Iterate and keep an interval if start >= end of the last kept interval; otherwise must remove.'
    ],
    solution: `### Idea
Sort by end ascending. Keep the first interval, then iterate: if current interval's start is not earlier than the last kept interval's end, keep it and update end; if it overlaps, increment removal count.

This is the standard greedy for activity selection, proven by exchange argument: choosing the earliest-finishing interval is never worse than any other choice.

~~~java
class Solution {
    public int eraseOverlapIntervals(int[][] intervals) {
        if (intervals.length == 0) return 0;
        Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));
        int removed = 0;
        int lastEnd = intervals[0][1];
        for (int i = 1; i < intervals.length; i++) {
            if (intervals[i][0] < lastEnd) {
                removed++;                 // overlaps kept interval
            } else {
                lastEnd = intervals[i][1];
            }
        }
        return removed;
    }
}
~~~

### Interview notes
- Sorting by start is the wrong direction for this problem; explain why sorting by end is optimal.
- The {{<}} condition allows touching boundaries; if the problem considers touching as overlapping, change to {{<=}}.
- Comparator using {{a[1] - b[1]}} can overflow with large values; use {{Integer.compare}}.

> Senior tip: Activity selection appears in job scheduling, room reservation, and optimizing batch windows. When there are weights (jobs have different profits), greedy is no longer correct — must switch to weighted interval scheduling with DP + binary search.`,
    follow: ['If each interval has a weight, how to solve it?', 'Find the maximum number of non-overlapping intervals instead of number to remove?']
  },
  'algo-045': {
    prompt: `Design a rate limiter using the token bucket algorithm in Java. Requirements:
- Capacity {{capacity}} tokens, refilling {{refillPerSecond}} tokens per second.
- {{tryAcquire(n)}} returns true and deducts {{n}} tokens if sufficient, otherwise returns false.
- Thread-safe for concurrent calls.
- No external libraries.

### Example
~~~text
bucket = new TokenBucket(10, 2);   // 10 tokens, refill 2 tokens/second
bucket.tryAcquire(10);             // true, 0 remaining
bucket.tryAcquire(1);              // false
wait 1 second
bucket.tryAcquire(2);              // true
~~~

### Constraints
- {{1 <= capacity <= 10^6}}
- {{0 < refillPerSecond <= 10^6}}
- {{1 <= n <= capacity}}`,
    hints: [
      'No need for a background thread to refill continuously; just calculate tokens refilled since the last check.',
      'Use {{System.nanoTime()}} to avoid effects of system clock adjustments.',
      'Wrap refill + check + deduct in a critical section (synchronized or ReentrantLock).'
    ],
    solution: `### Idea
Store current tokens and last refill time. On each call, calculate tokens to refill based on elapsed time, capped at {{capacity}}, then check and deduct.

The entire operation is within {{synchronized}} to prevent multiple threads seeing sufficient tokens and deducting simultaneously.

~~~java
public final class TokenBucket {
    private final long capacity;
    private final double tokensPerNano;
    private double tokens;
    private long lastRefillNanos;

    public TokenBucket(long capacity, double tokensPerSecond) {
        this.capacity = capacity;
        this.tokensPerNano = tokensPerSecond / 1_000_000_000.0;
        this.tokens = capacity;
        this.lastRefillNanos = System.nanoTime();
    }

    public synchronized boolean tryAcquire(int n) {
        long now = System.nanoTime();
        double refill = (now - lastRefillNanos) * tokensPerNano;
        tokens = Math.min(capacity, tokens + refill);
        lastRefillNanos = now;
        if (tokens >= n) {
            tokens -= n;
            return true;
        }
        return false;
    }
}
~~~

### Interview notes
- {{double}} has precision errors; for high precision, store tokens as micro-tokens or use {{long}} with a smaller unit.
- {{synchronized}} is enough for one instance; for very high throughput, {{ReentrantLock}} or {{LongAdder}}/CAS can reduce contention.
- Distributed rate limiter needs shared state (Redis + Lua) or sliding window algorithm; local token bucket only limits per instance.

> Senior tip: In API gateways, token bucket is often configured with burst and sustained rate. I once faced an incident using {{System.currentTimeMillis()}} and NTP adjustment caused token jumps; {{nanoTime()}} is a safer choice for intervals.`,
    follow: ['Compare token bucket with sliding window log.', 'How to implement a distributed rate limiter for multiple instances?']
  },
  'algo-046': {
    prompt: `Implement a bounded queue in Java:
- {{put(item)}} blocks when queue is full until there is space.
- {{take()}} blocks when queue is empty until there is an element.
- FIFO, thread-safe, handles interrupts correctly.
- Do not use pre-built {{ArrayBlockingQueue}} or {{LinkedBlockingQueue}}.

### Example
~~~text
BoundedBlockingQueue<String> q = new BoundedBlockingQueue<>(2);
producer: q.put("a"); q.put("b"); q.put("c"); // blocks at "c"
consumer: q.take(); // "a", producer woken up
~~~

### Constraints
- {{1 <= capacity <= 10^5}}
- Multiple producers and consumers.
- No busy-wait.`,
    hints: [
      'Need a common lock and two conditions: one for "not full" (notFull), one for "not empty" (notEmpty).',
      'Always check the condition in a {{while}} loop, not {{if}}, because of spurious wakeups.',
      'Use circular buffer with head, tail, size for FIFO and O(1).'
    ],
    solution: `### Idea
Use {{ReentrantLock}} and two {{Condition}} objects. Producer waits on {{notFull}} when full; consumer waits on {{notEmpty}} when empty. After adding/removing, signal the other condition.

Circular array helps with O(1) operations and avoids node allocation.

~~~java
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

public final class BoundedBlockingQueue<T> {
    private final Object[] items;
    private int head, tail, size;
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();

    public BoundedBlockingQueue(int capacity) {
        items = new Object[capacity];
    }

    public void put(T item) throws InterruptedException {
        lock.lock();
        try {
            while (size == items.length) notFull.await();
            items[tail] = item;
            tail = (tail + 1) % items.length;
            size++;
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    @SuppressWarnings("unchecked")
    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (size == 0) notEmpty.await();
            T item = (T) items[head];
            items[head] = null;   // avoid retaining a reference
            head = (head + 1) % items.length;
            size--;
            notFull.signal();
            return item;
        } finally {
            lock.unlock();
        }
    }
}
~~~

### Interview notes
- {{await()}} can throw {{InterruptedException}}; do not swallow the exception, let the caller handle it or restore the interrupt.
- Use {{signal()}} instead of {{signalAll()}} when only one thread needs to be woken up, but ensure it's the right condition.
- If fairness or high contention among multiple producers/consumers is needed, consider {{ReentrantLock(true)}} or separate locks for head/tail.
- Ask about shutdown: need "poison pill" or stop flag for consumers to exit safely.

> Senior tip: This is a test of true understanding of {{Condition}} and memory visibility. Do not answer with {{wait/notify}} on object if you can use {{ReentrantLock}}; code is more readable and less error-prone. In production, use {{ArrayBlockingQueue}} unless there's a specific reason to implement it yourself.`,
    follow: ['How to support timeout for put/take?', 'How to design a safe shutdown for producer-consumer?']
  },
  'algo-047': {
    prompt: `You have two lists of transactions: {{ledger}} (internal system) and {{bank}} (bank statement). Each transaction consists of {{id}} and {{amountCents}} (amount in cents, can be negative). An id can appear multiple times due to aggregation, so need to sum by id. Return list of ids with discrepant amounts, along with expected and actual amounts, sorted by id.

### Example
~~~text
ledger = [(T1, 1000), (T1, 500), (T2, 2000)]
bank   = [(T1, 1500), (T3, 700)]

Output:
T2: expected=2000, actual=0
T3: expected=0, actual=700
~~~

### Constraints
- {{0 <= number of transactions per side <= 10^6}}
- {{-10^12 <= amountCents <= 10^12}}
- {{id}} is a non-empty string, max 64 characters.`,
    hints: [
      'Need to compare sum by id between two sources.',
      'Aggregate into two {{HashMap<String, Long>}} then merge keys to compare.',
      'Do not use {{double}} for money; use {{long}} cents or {{BigDecimal}}. Careful if id is only in one side.'
    ],
    solution: `### Idea
Aggregate amount by id for each source using {{merge}}. Then merge ids, compare totals; if different, record discrepancy. Sort results for stable output.

This is basic reconciliation in fintech: idempotent, replayable, and independent of transaction order.

~~~java
class Solution {
    public List<String> reconcile(List<Txn> ledger, List<Txn> bank) {
        Map<String, Long> expected = new HashMap<>();
        for (Txn t : ledger) expected.merge(t.id, t.amountCents, Long::sum);
        Map<String, Long> actual = new HashMap<>();
        for (Txn t : bank) actual.merge(t.id, t.amountCents, Long::sum);

        Set<String> ids = new HashSet<>(expected.keySet());
        ids.addAll(actual.keySet());
        List<String> diffs = new ArrayList<>();
        for (String id : ids) {
            long e = expected.getOrDefault(id, 0L);
            long a = actual.getOrDefault(id, 0L);
            if (e != a) {
                diffs.add(id + ": expected=" + e + ", actual=" + a);
            }
        }
        Collections.sort(diffs);
        return diffs;
    }
}
~~~

### Interview notes
- {{String}} concatenation in a large loop is inefficient; in production return a {{Diff}} record instead of a string.
- Aggregate {{long}} can overflow if number of transactions is extremely large; consider {{BigInteger}} or check thresholds.
- If two sources are too large to fit in RAM, must perform external sort by id then compare streaming.
- Need to ask about rules: how are cancelled transactions, refunds, or exchange rate differences handled?

> Senior tip: Real reconciliation is more than just comparing totals; must handle transaction status, validity periods, and currencies. A trick I use: store additional checksum/version to detect edited records, and run reconciliation by time window instead of full history.`,
    follow: ['If data is too large for RAM, how to reconcile?', 'How to handle duplicate or replayed transactions (idempotency)?']
  }
});
