/*
 * English translation of js/data/q-concurrency-jvm.js — task T953. Format: js/core/i18n.js (content overlay).
 * ids: concurrency-046 concurrency-047 concurrency-048 concurrency-049 concurrency-050 concurrency-051
 */
App.i18n.content({
  'concurrency-046': {
    q: 'What is {{VarHandle}}, what are its memory access modes, and when do you use it instead of {{Unsafe}} or the {{java.util.concurrent.atomic}} classes?',
    a: `**Summary:** {{VarHandle}} (Java 9+) is the official replacement for {{sun.misc.Unsafe}} to read, write, and compare-and-swap (CAS) fields of an object directly, while controlling memory ordering. Its access modes are: volatile (both write and read establish happens-before), release/acquire (one-directional, cheaper than volatile), opaque (no ordering), and the full memory fences {{fullFence}}/{{loadFence}}/{{storeFence}}. Use it when you need CAS directly on a field or a custom memory order at lower cost than volatile; most business code should still prefer {{AtomicInteger}} or {{ConcurrentHashMap}} over hand-written VarHandle.

### Quick intuition
Think of each object field as a slot on a company whiteboard. {{AtomicInteger}} is a ready-made slot with fixed rules (only add, always read latest...). {{VarHandle}} is a torch and pen that write directly into the slot: you can read it, write it, or "if it is still value A, write value B" — and you decide whether that write must publish the work done before it, i.e. notify other threads according to a rule you choose.

### Terminology
- **VarHandle**: an object in java.lang.invoke that replaces Unsafe, operating directly on object fields with a selectable access mode.
- **Access mode**: the memory-ordering rule attached to each read/write/CAS operation.
- **Happens-before**: if A happens-before B, then B is guaranteed to see everything A wrote.
- **Reordering**: compiler, JIT, or CPU changing instruction order to run faster, as long as the result within a single thread does not change.
- **Store buffer / invalidate queue**: a CPU core's write buffer and the list of stale cache copies to invalidate — the reason a write on one core may not yet be visible on another.
- **Fence / memory barrier**: an instruction that forbids the processor from reordering across it.
- **Unsafe**: an internal JDK class with unsafe memory access, access-restricted since JDK 9; VarHandle is the public replacement.
- **CAS (compare-and-swap)**: a CPU instruction "write the new value if the current value is still what I read", atomic without locking.

### Access modes and when to use them
VarHandle offers three groups of methods per field:

1. **Volatile mode** ({{getVolatile}}/{{setVolatile}}/{{compareAndSet}} volatile): release write and acquire read, establishes happens-before both ways. Equivalent to a {{volatile}} field.
2. **Release/acquire mode** ({{setRelease}}/{{getAcquire}}): the release write ensures every prior write is flushed by the time this step completes; the acquire read ensures later reads see the latest value. One-directional, cheaper than volatile on some architectures, suited to a "data is ready, may read" flag.
3. **Opaque mode** ({{getOpaque}}/{{setOpaque}}): no ordering, only atomicity. Used for statistics counters where order does not matter.
4. **Memory fences**: {{fullFence()}} forbids reordering on both sides; {{loadFence()}} for prior reads; {{storeFence()}} for prior writes. Fences are expensive — use only when truly needed.

### Example: publish a flag with release/acquire

~~~java
import java.lang.invoke.MethodHandles;
import java.lang.invoke.VarHandle;

public class ReadyFlag {
    private static final VarHandle READY;
    private static final VarHandle VALUE;

    static {
        try {
            READY = MethodHandles.lookup()
                .findVarHandle(ReadyFlag.class, "ready", boolean.class);
            VALUE = MethodHandles.lookup()
                .findVarHandle(ReadyFlag.class, "value", int.class);
        } catch (Exception e) {
            throw new ExceptionInInitializerError(e);
        }
    }

    private boolean ready;
    private int value;

    public void publish(int v) {
        VALUE.setOpaque(v);           // write data first
        READY.setRelease(true);       // release flag: all prior writes are flushed
    }

    public boolean tryRead(int[] out) {
        if ((boolean) READY.getAcquire()) {   // acquire read: see ready => certainly see new value
            out[0] = (int) VALUE.getOpaque();
            return true;
        }
        return false;
    }
}
~~~

Reason: write {{VALUE}} first, then raise the {{READY}} flag via setRelease. A thread that reads {{READY}} via getAcquire is guaranteed to also see {{VALUE}}. With a plain field (no VarHandle, no volatile), JIT/CPU may reorder: the reading thread could see the flag set while value is still the old value.

### Mode comparison table

| Mode | Example method | Happens-before? | Cost | Use when |
|---|---|---|---|---|
| volatile | setVolatile/getVolatile | Yes, both ways | Highest | Stop flags, object publication |
| release/acquire | setRelease/getAcquire | Yes, one way | Lower than volatile | "data is ready" flag |
| opaque | setOpaque/getOpaque | No | Lowest | Statistics counters, order irrelevant |

### In production
- VarHandle is rarely needed in business code: the java.util.concurrent classes already use it correctly and are JVM-optimized.
- If you write a lock-free structure yourself, measure with async-profiler/JMH and use VarHandle only when evidence shows volatile/atomic classes are the bottleneck.
- {{sun.misc.Unsafe}} is still reachable via reflection but is deprecated and may be blocked under moduleization; VarHandle is the recommended path.

### Common mistakes
- **Confusing getAcquire with getVolatile**: getAcquire only orders relative to prior release writes, not all writes in other threads. Fix: write data with setRelease before raising the flag.
- **Using opaque for a control flag**: opaque has no ordering, so a reading thread may see the new flag but stale data. Fix: use release/acquire or volatile.
- **Forgetting VarHandle is not self-initializing**: it must be obtained via {{MethodHandles.lookup().findVarHandle(...)}} and checked exceptions are thrown in the static block.

### 1-minute interview answer
"VarHandle is the public replacement for Unsafe that operates directly on object fields, with selectable memory-ordering access modes: volatile (read/write both establish happens-before), release/acquire (one-directional, cheaper), opaque (no ordering), and the full fences fullFence/loadFence/storeFence. I use release/acquire for the 'write data then raise a flag' pattern so a reader that sees the new flag certainly sees the new data, at lower cost than volatile. Most of the time I still use AtomicInteger/ConcurrentHashMap and reach for VarHandle only when I need CAS directly on a field or have measured volatile as the bottleneck."

> Senior tip: VarHandle is not magic — it only makes explicit what the JMM already allows. When asked "volatile vs release/acquire, what is the difference", the standard answer: volatile establishes happens-before both ways (release write plus acquire read) and is more expensive on some architectures; release/acquire is one-way and sufficient for the publisher/subscriber flag pattern. Answer with a concrete example and the advice "measure before optimizing".`,
    follow: [
      'Why is release/acquire cheaper than volatile on some CPU architectures?',
      'How does VarHandle.compareAndSet differ from AtomicInteger.compareAndSet?',
      'When do you choose VarHandle over the java.util.concurrent.atomic classes?'
    ],
  },
  'concurrency-047': {
    q: '{{ConcurrentSkipListMap}}: how does it work internally — skip-list structure, levels, why no global lock, and what is its "weak" iterator?',
    a: `**Summary:** {{ConcurrentSkipListMap}} is an ordered, thread-safe map with no global lock. Internally it is a skip list: each node appears on several levels, higher levels contain fewer nodes to "skip" ahead quickly. Insert/remove use CAS on per-node links at each level, so threads can work in different regions concurrently. Its iterator is **weakly consistent**: it never throws ConcurrentModificationException, may or may not see changes made after creation, but does not skip elements already reached.

### Quick intuition
A skip list is like an exterior fire escape: the regular stairs visit every floor (slow), while the fire escape skips several floors at once (fast). ConcurrentSkipListMap keeps several such escapes; each node may appear on a few of them. When searching for a key you start at the top escape, jump while the next key is <= target, then drop one level and repeat. Many threads can search or insert in different regions without a shared lock because each node link is updated with CAS.

### Terminology
- **Skip list**: a multi-level linked structure where higher levels skip many elements, giving O(log n) average search.
- **Node / link**: each element holds an array of references to the next node at each level.
- **CAS**: atomic compare-and-swap that updates a link only if it is still as read.
- **Weakly consistent iterator**: an iterator that does not lock, reflects state at creation time or later, and never throws on concurrent modification.
- **ConcurrentModificationException**: the error single-threaded collections throw when the structure changes during traversal.
- **Global lock**: one lock protecting the whole map, a single bottleneck.

### Step by step
Search:
1. Start at the sentinel node, top level.
2. Move along links at this level while the next key <= target.
3. When the next key is larger, drop one level and repeat down to level 0.
4. The node at level 0 after the last position is the result (or absent).

Insert:
1. Find the insertion position at every level, keeping predecessor nodes.
2. Randomly decide how many levels the new node gets (~50% per level up).
3. CAS-update links from top level down to 0; on failure re-read predecessors and retry.

Delete: similar to insert — mark the node deleted then CAS to skip its links.

### When to use / not use

| | ConcurrentSkipListMap | ConcurrentHashMap |
|---|---|---|
| Order | Yes (by key) | No |
| Key lookup | O(log n) | O(1) average |
| Locking | No global lock, CAS per link | CAS on empty bin, synchronized first node |
| Use when | Need range scans in order | Only lookup, many writes |

### In production
- Use when you need range traversal (all orders from code A to B) while many threads write.
- Weak iterator: if you need a fixed snapshot, copy into a list before long processing.
- Memory: skip lists use more memory than HashMap — each node keeps an array of references per level.

### Common mistakes
- **Null comparator fallback**: a key that is not Comparable and has no Comparator throws NullPointerException on the second insert. Fix: always use Comparable or pass a Comparator.
- **Assuming the iterator sees every change**: a weak iterator may skip elements removed after creation or miss elements added later. Fix: do not rely on it for exact statistics, or snapshot first.
- **Many writes to the same region**: threads inserting nearby keys still contend on node links, lowering throughput. Fix: spread keys.

### 1-minute interview answer
"ConcurrentSkipListMap is an ordered, thread-safe map with no global lock. Internally it is a skip list: each node sits on a few levels, higher levels skip many elements for O(log n) search. Insert/remove update links with CAS per level, so threads in different regions do not block each other. Its iterator is weak: no ConcurrentModificationException, may or may not see later changes, but never skips reached elements. I use it when I need ordered range scans; for pure lookup ConcurrentHashMap is faster and lighter."

> Senior tip: the skip-list trade-off is memory: each node holds a reference array sized by its level (average under 2 but can be high), and the random level needs a thread-safe source (ThreadLocalRandom). When you need a concurrently writable ordered map, this is the JDK's official choice; when order does not matter, ConcurrentHashMap is the first option.`,
    follow: [
      'How does a skip list achieve O(log n) without a global lock?',
      'Can a weakly consistent iterator skip newly added elements, and why?',
      'ConcurrentSkipListMap vs ConcurrentHashMap: which when?'
    ],
  },
  'concurrency-048': { q: 'Placeholder', a: `**Summary:** TODO.` },
  'concurrency-049': { q: 'Placeholder', a: `**Summary:** TODO.` },
  'concurrency-050': { q: 'Placeholder', a: `**Summary:** TODO.` },
  'concurrency-051': { q: 'Placeholder', a: `**Summary:** TODO.` },
});
