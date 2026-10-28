/*
 * English translation of js/data/lessons-collections.js — task T263. Format: js/core/i18n.js (content overlay).
 * ids: lesson-collections-003
 */
App.i18n.content({
  'lesson-collections-003': {
    title: 'ConcurrentHashMap: CAS, bin locks, atomic compute/merge, and why null is forbidden',
    goals: [
      'Explain when a {{put}} on {{ConcurrentHashMap}} (Java 8+) uses CAS, when it locks, and what exactly it locks',
      'Recognize check-then-act and read-modify-write bugs and fix them with {{merge}}/{{compute}}/{{putIfAbsent}}',
      'Know the limits: {{size()}} is only an estimate while writes are in flight, functions inside {{compute}} run while holding the lock, and null is forbidden',
    ],
    body: `### The problem: HashMap loses data when many threads write
{{HashMap}} has no synchronization at all. Two threads putting into the same empty bucket can both see the bucket as null and both write their node: the later write overwrites the earlier one and an entry disappears. Two threads resizing together can corrupt the table structure. And counting with {{map.put(k, map.get(k) + 1)}} almost certainly loses updates under contention.

The old fix was to wrap it: {{Hashtable}} and {{Collections.synchronizedMap}} use **one lock for the whole map**, so even 32 threads can only write strictly one after another. {{ConcurrentHashMap}} solves this by taking **the smallest lock possible**.

### Java 8+: CAS for empty bins, synchronized on the bin head node
Java 7 split the map into 16 **Segments** (each segment a ReentrantLock). Java 8 rewrote it completely: only a single {{Node[] table}} array like HashMap remains, and every {{put}} follows these steps:

1. Compute the hash (mixed bits, same as HashMap) and the bin index. The table is lazily allocated, also via CAS.
2. **Empty bin**: write the new node with **CAS** (compare-and-swap) into the array slot, **locking nothing**. If CAS loses (another thread just wrote), the loop retries.
3. **Bin being transferred during resize** (head node is {{ForwardingNode}}, hash = MOVED): this thread **helps** move data to the new table before putting. Resize is shared by many threads; each takes a range of bins.
4. **Bin already has nodes**: {{synchronized}} on **that bin's head node**, then walk the list (or the red-black tree if the bin has been treeified, same 8/64 thresholds as HashMap) to overwrite or append the node.
5. Bump the element counter with CAS; under high contention it counts across many {{CounterCell}} slots (like {{LongAdder}}).

~~~java
// Sketch of putVal (simplified from the JDK, not the full code)
if ((f = tabAt(tab, i)) == null) {
    if (casTabAt(tab, i, null, new Node<>(hash, key, value))) break;  // no lock
} else if (f.hash == MOVED) {
    tab = helpTransfer(tab, f);                                     // help resize
} else {
    synchronized (f) { /* locks only bin i: other bins still write in parallel */ }
}
~~~

**Why this design?** With a well-distributed hash, most bins hold 0–1 nodes, so the majority of puts take the cheap CAS branch. Two threads only block each other when writing to the **same bin**. And {{get}} takes **no lock**: the Node's {{val}} and {{next}} fields are {{volatile}}, so a read always sees fully written data.

### size() is only an estimate
{{size()}} adds {{baseCount}} to every CounterCell. While another thread is writing, the result may already be stale by the time it returns. For counts above {{Integer.MAX_VALUE}} use {{mappingCount()}}. The iterator is **weakly consistent**: it never throws {{ConcurrentModificationException}}, and it may or may not see changes made after traversal started.

### Atomic operations: never stitch get and put yourself
Each individual method is thread-safe, but **stitching two calls together is not**:

~~~java
// WRONG: two threads both read 5 and both write 6 → one increment lost
counts.put(word, counts.getOrDefault(word, 0L) + 1);
// RIGHT: read-modify-write in one operation, locking the bin while the function runs
counts.merge(word, 1L, Long::sum);

// WRONG: check-then-act, both threads see "absent" → two lists created, one lost
if (!byUser.containsKey(u)) byUser.put(u, new CopyOnWriteArrayList<>());
// RIGHT
byUser.computeIfAbsent(u, k -> new CopyOnWriteArrayList<>()).add(order);
~~~

| Method | What it does atomically | Notes |
|---|---|---|
| {{putIfAbsent(k, v)}} | insert if absent | {{v}} is always created first, even when unused |
| {{computeIfAbsent(k, f)}} | call {{f}} only when absent | for caches, multimaps |
| {{compute(k, f)}} | read-modify-write; null from {{f}} removes the key | the most flexible |
| {{merge(k, v, f)}} | absent → set {{v}}, present → {{f(old, v)}} | counting, accumulating |
| {{replace(k, old, new)}} / {{remove(k, v)}} | compare-and-set by value | optimistic update |

### Why null is forbidden
{{ConcurrentHashMap}} throws {{NullPointerException}} for a null key or value. The reason: if null were allowed, {{get(k) == null}} would mean two things ("no such key" or "the value is null"). With HashMap you can call {{containsKey}} to tell them apart, but in a concurrent setting another thread may add or remove the key between those two calls, so the result is no longer trustworthy. Banning null removes the ambiguity entirely: null always means "absent". It also lets {{compute}} use null to mean "remove the key".

### Common production bugs
- **Functions inside {{compute}}/{{computeIfAbsent}} run while holding the bin lock**: making an HTTP call or querying the DB there blocks every other thread writing to the same bin. Worse, mutating **the map itself** inside the function (e.g. nested computeIfAbsent) can throw {{IllegalStateException: Recursive update}} or hang.
- **One extremely hot key** (every thread merging into key "total") queues every thread on a single lock. Use a {{LongAdder}} value instead: {{map.computeIfAbsent(k, x -> new LongAdder()).increment()}}.
- **Mutable values that are not thread-safe**: a thread-safe map does not make the {{ArrayList}} inside it safe. Mutate the value inside {{compute}}, or use a thread-safe value such as {{ConcurrentHashMap.newKeySet()}}.
- Basing business decisions on {{size()}} or {{isEmpty()}} while the map is being written.

> Performance: on Java 8, {{computeIfAbsent}} locks the bin even when the key is already present, so read-heavy caches suffer contention; JDK 9 added a fast path that checks the bin head node before locking. On Java 8 the common pattern is to {{get}} first and only call {{computeIfAbsent}} on null.

### Interview notes
Interviewers often ask: the Java 7 (Segment) vs Java 8 (CAS + synchronized on the bin) design, why {{get}} needs no lock, why {{size()}} is not exact, why null is banned, and "is this counting code thread-safe?" over a get-then-put snippet on ConcurrentHashMap. A senior answer always includes: pick the right atomic operation, keep functions inside compute short, and use LongAdder for hot keys.`,
    exercises: [
      {
        title: 'Count word frequencies from many threads with merge',
        prompt: `Write {{WordCounter}} that many threads call concurrently:

- {{add(word)}}: increase the count of {{word}} by 1. Must be exactly correct when 8 threads each call it hundreds of thousands of times. A null {{word}} must throw {{NullPointerException}}.
- {{count(word)}}: the number of occurrences so far; 0 if never seen.
- {{snapshot()}}: return a **copy** (later changes to the counter do not affect the copy).

The starter uses {{HashMap}}; if you write {{put(w, get(w) + 1)}} even on a ConcurrentHashMap, the concurrent test will report lost updates.`,
        hints: [
          'Switch the field to {{ConcurrentHashMap<String, Long>}}. Changing the map alone is not enough: {{get}} then {{put}} is still two separate operations.',
          'Use {{counts.merge(word, 1L, Long::sum)}}: a single call, atomic per key.',
          'Snapshot: {{new HashMap<>(counts)}} creates an independent copy.',
        ],
        explain: `{{merge}} runs the whole "read old value, add, write back" while holding the lock of the bin containing the key (or via a CAS if the bin is still empty), so no thread can slip in between. With a plain HashMap, the concurrent test can lose updates, produce wrong counts, or even lose keys when two threads resize at the same time.

Common mistakes:
- Switching to ConcurrentHashMap but still writing {{counts.put(w, counts.getOrDefault(w, 0L) + 1)}}: two threads both read 41 and both write 42, losing one increment. The test with 4 hot keys and 8 threads will report a number below 200000.
- Wrapping everything in {{synchronized}} on the whole object: correct, but every thread queues on one lock, defeating ConcurrentHashMap.
- Returning the live map from {{snapshot()}}: the caller sees data keep changing and can even corrupt internal state.

When a few keys are extremely hot (millions of updates per second), even {{merge}} contends on a single bin lock; then use {{ConcurrentHashMap<String, LongAdder>}} with {{computeIfAbsent(w, k -> new LongAdder()).increment()}}: LongAdder spreads the count across multiple cells so threads do not collide.`,
      },
      {
        title: 'Session registry: a concurrent multimap with compute',
        prompt: `A user may have many login sessions (web, mobile...). Write {{SessionRegistry}} that many threads call concurrently:

- {{login(userId, sessionId)}}: add a session for the user.
- {{logout(userId, sessionId)}}: remove the session; if the user has no sessions left, **remove the user's key** from the map as well (no empty set left behind leaking memory).
- {{sessions(userId)}}: a copy of the current session set; an empty set for an unknown user.
- {{activeUsers()}}: the number of users with at least one session.

Login and logout of the **same user** may run in parallel; no session may be lost. Hint: make every change to the set **inside** {{compute}}/{{computeIfPresent}}.`,
        hints: [
          'The map should be {{ConcurrentHashMap<String, Set<String>>}} with values from {{ConcurrentHashMap.newKeySet()}} so {{sessions()}} can read safely.',
          'Logout: {{computeIfPresent(userId, (k, set) -> ...)}} removes the session then returns null when the set is empty: returning null means remove the key.',
          'Login: do not write {{computeIfAbsent(...).add(...)}}: the add runs **after** the lock is released, and a logout may have just removed that set from the map. Do the {{add}} inside {{compute}}.',
        ],
        explain: `The key point is that every change to a user's set happens **inside** {{compute}}/{{computeIfPresent}}, i.e. while holding the bin lock for that key. That way "add a session" and "remove a session, and drop the user when the set is empty" can never interleave.

Why is {{byUser.computeIfAbsent(u, k -> newKeySet()).add(s)}} (the common multimap pattern) wrong here? {{computeIfAbsent}} returns the set and **releases the lock**, and only then calls {{add}}. If at exactly that moment a logout thread removes the last session and deletes the user key, the {{add}} writes into a set that has been detached from the map: the new session is silently lost. The computeIfAbsent-then-add pattern is only safe when keys are **never** removed.

Other common mistakes: using a {{HashSet}} as the value and handing it straight out (readers see the set being mutated), leaving an empty set after logout (the map slowly grows, memory leaks), or {{if (set.isEmpty()) byUser.remove(userId)}} outside the compute (can delete a user who just logged back in).`,
      },
    ],
    check: [
      {
        q: 'How does {{ConcurrentHashMap}} (Java 8+) handle a {{put}} into an empty bin?',
        options: ['Lock the containing Segment with a ReentrantLock', 'synchronized on the whole map', 'Write the node with CAS, taking no lock', 'synchronized on the table array'],
        answer: 2,
        explain: `An empty bin is written with a CAS into the array slot; a lost CAS just retries the loop. Only when the bin already has a node does it {{synchronized}} on the **bin head node**. Segment + ReentrantLock was the Java 7 design, dropped in Java 8. Locking the whole map is what Hashtable/synchronizedMap do. Locking the entire table array would block every thread, the opposite of ConcurrentHashMap's goal.`,
      },
      {
        q: 'Why does {{ConcurrentHashMap}} forbid null keys and null values?',
        options: ['Because the hash of null cannot be computed', 'Because {{get}} returning null would be ambiguous between "absent" and "null value", and containsKey cannot restore the distinction atomically', 'Because CAS cannot compare against null', 'Because null unbalances the red-black tree'],
        answer: 1,
        explain: `In a concurrent map, {{containsKey}} followed by {{get}} is two separate operations; another thread may change the map in between, so there is no reliable way to tell the two meanings of null apart. HashMap does compute a hash for null (it uses 0), so "cannot be computed" is wrong. CAS compares references and null is a valid value (an empty bin is exactly null). The red-black tree is unrelated.`,
      },
      {
        q: 'The snippet {{map.put(k, map.get(k) + 1)}} on a {{ConcurrentHashMap<String, Integer>}} with key k present. 2 threads run it once each. What can happen?',
        options: ['It always increments by exactly 2 because ConcurrentHashMap is thread-safe', 'It may increment only by 1 because get and put are two separate operations', 'It always throws ConcurrentModificationException', 'Deadlock because put waits for get to release its lock'],
        answer: 1,
        explain: `Each method on its own is thread-safe, but both threads can {{get}} 5 and then both {{put}} 6: one increment is lost. Fix it with {{merge(k, 1, Integer::sum)}} or {{compute}}. ConcurrentHashMap never throws CME, and {{get}} takes no lock, so there is no deadlock.`,
      },
    ],
  },
});
