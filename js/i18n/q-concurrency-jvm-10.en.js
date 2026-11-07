/*
 * English translation of js/data/q-concurrency-jvm.js — task T951. Format: js/core/i18n.js (content overlay).
 * ids: concurrency-038 concurrency-039 concurrency-040 concurrency-041
 */
App.i18n.content({
  'concurrency-038': {
    q: 'Deep dive into AbstractQueuedSynchronizer: state, the CLH queue, and park/unpark. What happens **step by step** when two threads call {{ReentrantLock.lock()}} at once, and where exactly does a fair lock differ from the default lock in code?',
    a: `**Summary:** AQS is the backbone of almost every lock in {{java.util.concurrent}}: ReentrantLock, Semaphore, CountDownLatch, ReadWriteLock. It holds only two things: one **state** int changed with CAS, and a **FIFO doubly-linked queue** (a CLH variant) of nodes wrapping waiting threads. Callers only write a few tryAcquire/tryRelease methods (read/write state per their own semantics); AQS handles the rest: trying, enqueueing, sleeping ({{LockSupport.park}}), waking (unpark), and abandoning on timeout. ReentrantLock is **non-fair** by default: a just-arrived thread may CAS-capture the lock the moment state is empty (barging); the fair version adds exactly one condition {{hasQueuedPredecessors()}} before the CAS, and that is the entire difference — which is also why fair is slower.

### Quick intuition
A ticket counter has one pen (**state**). A late customer does not shout at the counter: they write their name in the **waiting book** then go drink coffee (**park**); when the previous customer returns the pen, the clerk calls exactly one person up (**unpark**). The waiting book is the CLH queue, the pen is state.

### Terminology
- **state**: volatile int of AQS, changed by **CAS** (write succeeds only if the value is still what you just read — atomic without a lock). ReentrantLock uses it to count reentrant depth; Semaphore = remaining permits; CountDownLatch = remaining countDown calls.
- **CLH queue**: variant of the OS spin-lock queue — a FIFO doubly-linked list whose head node is a dummy representing the current owner.
- **Node.waitStatus**: SIGNAL (-1) = "when I release, wake the next"; CANCELLED (1) = gave up due to timeout/interrupt; CONDITION (-2) = sitting in an await() condition queue; PROPAGATE (-3) = signal-propagation flag in shared mode (Semaphore, readLock).

### Step by step: two threads lock() together
~~~text
T1: lock() -> CAS state 0->1 OK -> owner = T1 -> work
T2: lock() -> CAS state 0->1 FAIL (state already 1)
    addWaiter(Node.EXCLUSIVE): node = new Node(T2); CAS tail -> node (if lost, re-read tail and retry)
    node.prev = old tail      (only prev is set; next not yet linked)
    acquireQueued(node):
      - if node.prev == head -> tryAcquire once more (still allowed to barge)
      - shouldParkAfterFailedAcquire: CAS prev.waitStatus 0 -> SIGNAL
        first time returns false to loop back to tryAcquire; next time really sleeps
      - LockSupport.park(this)  -> T2 WAITING, uses no CPU
T1: unlock() -> tryRelease: state - 1 == 0 -> clear owner -> true
    unparkSuccessor(head): clear head.waitStatus, SCAN FROM TAIL BACKWARD
      find first node with waitStatus <= 0 (skip CANCELLED) -> unpark(node.thread)
T2: wakes -> back in acquireQueued -> prev == head -> tryAcquire CAS 0->1 OK -> becomes new head
~~~
Two design details worth stating: (1) a woken thread must still **grab** state itself via CAS — the queue only decides "who gets to try early", AQS never holds the lock for anyone; (2) scanning from the tail is necessary because CAS only guarantees the **prev** pointer, not the **next** of the previous node — walking from the tail keeps the chain intact. Here {{LockSupport.park}}/{{unpark}} sit below Object.wait: no monitor needed, and unpark is a "visa" — if unpark runs **before** the park, the later park returns immediately, so there is no "missed wakeup" race like notify.

### Fair vs non-fair: exactly one line
~~~java
// NonfairSync — default
public void lock() {
    if (compareAndSetState(0, 1)) setExclusiveOwnerThread(Thread.currentThread());
    else acquire(1);            // only queue if we lost
}
// FairSync: no shortcut at the door, and tryAcquire adds one condition:
if (c == 0) {
    if (!hasQueuedPredecessors() &&        // "is anyone queued ahead of me?"
        compareAndSetState(0, 1)) { ... }
}
~~~
{{hasQueuedPredecessors()}} checks whether any valid node stands ahead of the current thread in the queue. Non-fair allows **barging**: the moment the lock is released, a thread already running on the CPU may CAS-capture it before the just-unparked thread. This helps throughput (the winner skips the unpark + context switch, microseconds) at the cost of no ordering guarantee — one thread can be skipped repeatedly (starvation). Pick {{new ReentrantLock(true)}} only when you have **measured** starvation, and accept lower throughput.

### Condition queue — the second queue
Each {{Condition}} has its own queue (node waitStatus = CONDITION). {{await()}} sets state = 0 (releases the lock fully, including reentrant depth), moves the node into the condition queue, then parks; {{signal()}} does **not** hand over the lock — it only moves the node back to the sync queue, and the just-woken thread must still compete for CAS state.

### On production
- Thread dumps ({{jcmd <pid> Thread.print}}) name AQS directly: frames {{LockSupport.park}}, {{AbstractQueuedSynchronizer.acquireQueued}} and the line {{- parking to wait for <0x00007f...> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)}} — that address matches the object in the {{- locked <0x...>}} frame of the thread holding the lock.
- Count waiters via the public API {{ReentrantLock.getQueueLength()}} / {{hasQueuedThreads()}} (JDK docs state plainly: for **monitoring**, not for controlling logic). Exporting {{getQueueLength()}} as a metric is the fastest way to prove "p99 is high because of lock waiting".
- JFR {{jdk.JavaMonitorEnter}} only catches monitors of {{synchronized}}; AQS locks need async-profiler {{-e lock}} or wall-clock flame graphs.
- Symptoms to fix in code, not with a flag: {{getQueueLength()}} > 0 for long, low CPU, high p99 → critical section too long (HTTP/DB/JSON serialization inside the lock). Enabling fair only changes ordering, it does not shorten hold time.
- Forgetting {{unlock()}} in {{finally}}: unlike {{synchronized}}, ReentrantLock never releases itself → everything behind it stalls. And await() must be inside a {{while}} loop checking the condition, never an {{if}}.
- Read dumps correctly: a thread waiting in AQS is WAITING (park), whereas BLOCKED belongs to {{synchronized}} monitors — two different investigation paths.

> Senior tip: the three keywords that score in a senior interview are **state – SIGNAL – unparkSuccessor**. Adding the two details "a woken thread still must CAS-grab the lock itself" and "scan from the tail because next may not be linked yet" shows you read the source or debugged real dumps, not just {{lock()}}/{{unlock()}}. When answering verbally, follow this exact order: CAS state → append node to tail → mark SIGNAL → park → unpark successor → compete again for CAS.`,
    follow: [
      'Why did AQS choose park/unpark over Object.wait/notify or spinning with {{Thread.onSpinWait()}}?',
      'How do Semaphore and CountDownLatch use AQS in shared mode versus exclusive, and what is PROPAGATE for?',
      'Recent OpenJDK collapsed the node flags into one long field — what does that improve over separate waitStatus + prev + next?',
    ]
  },
  'concurrency-039': {
    q: 'In Java 8+ {{ConcurrentHashMap}}, what happens at the node and cache-line level when inserting one element: why CAS in some places and {{synchronized}} in others, why lock the head node instead of the whole bucket, and when does a bucket become a tree?',
    a: `**Summary:** {{ConcurrentHashMap}} locks neither the whole table nor the 16 segments of Java 7. Each bucket is a chain of nodes: an empty bucket is inserted with CAS (no one to contend with), a non-empty bucket is {{synchronized}} on exactly the first node of the chain — that node becomes the bucket's lock. Reads ({{get}}) take no lock at all, relying on volatile fields of the table array and of {{node.next}}. When a chain reaches 8 nodes **and** the table has at least 64 slots, the bucket is treeified into a red-black tree; if the table is still small, it resizes first to split the chain. To understand this map's performance you must understand three things: how the hash is mixed, why a hot bucket is the bottleneck, and why the {{computeIfAbsent}} mapping function runs **while holding the lock**.

### Quick intuition
A library splits books across 64 small shelves. The librarian locks neither the whole library nor a section: returning a book to an empty shelf is a quick single move (no one contends). A shelf already holding books is guarded by the person standing in front of it; other shelves stay free. Readers never wait at all — every shelf has a continuously updated signpost. If a shelf piles up to 8 books and the library has grown enough, that shelf becomes a two-tier shelf (search by branch) so you never walk past all 8 books.

### Terminology
- **bucket / bin**: one slot of the {{table}} array, holding a reference to the first node of the chain (or the root node of the tree).
- **Node**: the internal {{Map.Entry}} object, with a volatile {{next}} field so reads see updates without locking.
- **spread hash**: {{(h ^ (h >>> 16)) & HASH_BITS}} — folds the high 16 bits into the low bits because the bucket index uses only the last few bits; the sign bit is cleared so negative hashes become special flags.
- **MOVED (-2)**: hash value of a {{ForwardingNode}}, marking "this bucket has been moved to the new table during resize".
- **TREEIFY_THRESHOLD = 8**, **MIN_TREEIFY_CAPACITY = 64**, **UNTREEIFY_THRESHOLD = 6**: thresholds for chain↔tree conversion.
- **sizeCtl**: an int controlling init/resize (negative = initializing/resizing, positive = fill threshold).
- **ReservationNode**: placeholder node {{computeIfAbsent}} uses to "reserve" a bucket and detect recursion.

### Path of a put (step by step)
~~~text
1. check key/value non-null -> null throws NullPointerException by design (map forbids null)
2. h = spread(key.hashCode())
3. tab = table (read volatile once, used as a consistent "snapshot" for the loop)
   - if tab == null -> initTable(): CAS sizeCtl 0 -> -1; winner allocates a 16-slot array,
     loser loops back and re-reads table (no one allocates twice)
4. i = (tab.length - 1) & h        -> because table size is always a power of two
5. f = tabAt(tab, i)               -> volatile read of the array element (not of the whole array)
   a) f == null  -> CAS tab[i] null -> new Node(h, key, value)
        success -> done (fast path: no lock at all)
        failure -> someone just inserted; loop back to step 3 and re-read
   b) f.hash < 0 -> special node: TreeBin / ReservationNode / ForwardingNode
        ForwardingNode -> call helpTransfer() to help resize, then write
   c) f is a normal node -> synchronized (f) {   // LOCKING HEAD NODE = LOCKING THE BUCKET
        walk the chain, count binCount
        duplicate key (equals) -> replace value
        not found -> append node to end of chain (or into tree)
        if binCount >= 8 -> treeifyBin(tab, i)
      }
      when updating an existing key, the new node is linked BEFORE the old value is overwritten,
      so another thread's get() never sees a node with a null value
6. addCount(1L, binCount): bump the counter, and may trigger a table resize
~~~

### Why two modes: CAS vs synchronized
- CAS only wins when there is **no contention**. An empty bucket has exactly one contention — "who gets to set the head node" — and CAS resolves it cleanly with no wakeup.
- Once a bucket holds a chain, the work is "read-walk-modify-append" — a CAS retry loop would be expensive (every failure means re-walking from the head). Doug Lea chose {{synchronized}} on the head node because the JVM already optimizes uncontended monitors (CAS into the mark word), and because it keeps the chain invariants readable.
- Locking the head node rather than a table-wide lock means the number of locks equals the number of hot buckets, not one for the whole map. Two threads writing two different buckets barely touch each other — that is the entire meaning of "concurrent".
- Cache line: two keys hashing to the same bucket land on the same head node, and every operation ping-pongs that line. This is why a poor hashCode makes the map slow non-linearly, even with no global lock.

### How reads work
{{get}}: read the volatile table once, read the volatile node at {{tab[i]}}, then walk the chain via volatile {{next}}; no lock, no CAS. With a TreeBin it reads the volatile root and only {{synchronized}}s when needed. Consequence: you see a **consistent snapshot** (never a half-torn chain), but there is no contract "I see the exact state at the moment I called".

### Comparison table
| Approach | Lock granularity | Consequence |
|---|---|---|
| {{Hashtable}} | one lock for the whole table | only one writer at a time |
| {{Collections.synchronizedMap}} | one lock for the whole map + external iterator | as above; iterator must be synchronized by caller |
| {{ConcurrentHashMap}} Java 7 | 16 segments | at most 16 regions, unevenly distributed by key |
| {{ConcurrentHashMap}} Java 8+ | CAS on empty bucket, lock head node per bucket | number of locked regions = number of buckets, grows with the table |

### On production
- A constant hashCode (class does not override {{hashCode}}, or hash derived from an unchanging field) is the classic accident: all keys pile into one bucket, every write contends on one lock, CPU lock time is high while {{size()}} stays correct. Verify: build a temporary map counting nodes per bucket (debug/unit test), or compare put times for random String keys vs real keys.
- {{computeIfAbsent}} runs the mapping function **while holding the bucket lock**: if it calls HTTP/DB, every key in that bucket is blocked; if it mutates this same map in the same bucket, the map throws {{IllegalStateException}} "Recursive update". Rule: the mapping function must be pure and fast; for loading data use a separate single-flight outside the map.
- Construct {{new ConcurrentHashMap<>(expectedSize)}} to reduce resizes for large maps (resize internals are covered in the next question).
- Iterators are **weakly consistent**: no ConcurrentModificationException, but may skip elements or see removed ones. Do not use them to "snapshot the whole consistent state" — do that manually or use a different structure.
- Measuring contention: async-profiler {{-e lock}} or JFR event {{jdk.JavaMonitorEnter}} show frames {{ConcurrentHashMap.putVal}} and the monitor of the head node — a sign of a hot bucket, not of a "slow map".

### How to answer in an interview
Speak in three beats: (1) empty bucket = CAS, non-empty bucket = {{synchronized}} on the head node, read = lock-free via volatile; (2) therefore parallelism equals bucket count, and the only bottleneck is a hot bucket; (3) trees appear only when chain ≥ 8 **and** table ≥ 64 slots, otherwise resize happens instead. Add that {{size()}} is a snapshot (not an instant linear count) and {{computeIfAbsent}} holds the lock while running its function — those two show you have used this map on real production.

> Senior tip: when {{ConcurrentHashMap}} is suspected as the bottleneck, 90% of the time it is the **key's hash** or the **function inside {{computeIfAbsent}}/{{compute}} calling I/O**, not the map's internals. Before replacing the map with a lock-free queue or an external cache, print the distribution of bucket chain lengths — if one bucket carries 70% of traffic, the problem is in the key, not the map.`,
    follow: [
      'Why does {{ConcurrentHashMap}} forbid null key/value while {{HashMap}} allows them?',
      'How do {{get}} and {{put}} change once a chain is treeified, what is the cost versus a chain, and why the threshold 8?',
      '{{computeIfAbsent}} versus "check then put" — where is the difference in atomicity, and can {{putIfAbsent}} save you from a race?',
    ]
  },
  'concurrency-040': {
    q: 'How does {{ConcurrentHashMap}} resize run **in parallel**: where is a resizing table locked, why can other threads still write, how does "many threads help transfer" work, and why is {{size()}} computed from an array of cells instead of one variable?',
    a: `**Summary:** Resize never closes the table. The thread that notices the table is full uses CAS on {{sizeCtl}} to **claim** the resize (encoding a resizeStamp to identify which resize pass is underway), allocates a doubled table, then splits the old table into consecutive **chunks**; any thread that happens to hit a bucket already moved (node hash = MOVED) can **take a chunk to work on** ({{helpTransfer}}) — even a thread that only called {{get}} or {{size}}. A moved bucket leaves a {{ForwardingNode}} pointing at the new table, so reads stay correct during resize. Counting is also divide-and-conquer: {{baseCount}} plus an array of {{CounterCell}} padded to cache lines (the LongAdder/Striped64 model), so {{size()}}/{{mappingCount()}} is the sum of cells at a point in time, **not** one atomic linear read.

### Quick intuition
A supermarket moves to a larger premises without closing. The person who notices it is full posts a "moving" sign on the door, then hauls shelves one aisle at a time. Staff walking by (even customers asking directions) who see an aisle marked "moved to the other side" are handed that aisle to haul. Aisles not yet moved are sold from normally; moved aisles carry a sign "now at slot 137 in the new building", so customers still find the goods.

### Terminology
- **sizeCtl**: int controlling the table lifecycle. {{0}} = not initialized (will be 16); {{-1}} = initializing; other negatives = resizing, with the high bits holding the **resizeStamp** identifying the pass and the low bits counting helper threads; positive = next **threshold** = {{n - (n >>> 2)}} (load factor 0.75).
- **resizeStamp(n)**: a number derived from the old table size, acting as the "job number of this move"; a later thread reads {{sizeCtl}}, and a matching stamp proves it is helping the same pass, not a finished one.
- **ForwardingNode**: special node with {{hash = MOVED (-2)}}, holding a {{nextTable}} reference — meaning "this bucket now lives in the new table".
- **transferIndex / stride**: cursor that splits the old table into segments; each CAS takes one segment, at least a few slots (JDK computes {{n >>> 3}} divided by {{NCPU + 1}}, floor 2) so even a few threads do real work instead of fighting over single slots.
- **CounterCell**: a separate counter padded with the internal {{jdk.internal.vm.annotation.Contended}} annotation so each thread writes its own cache line.
- **sumCount / mappingCount**: {{baseCount}} plus all existing cells.

### What happens in order
~~~seq
title: put() hits the sizeCtl threshold with 8 threads writing
actors: Writer A | sizeCtl | Old table | New table | Writer B
Writer A -> sizeCtl: CAS read old -> (resizeStamp | 1) to claim resize
Writer A -> New table: allocate doubled array
Writer A -> Old table: set ForwardingNode (MOVED) on the segment it handles
Writer A -> Old table: copy nodes to New table, bump sizeCtl to 2 (helper count)
Writer B -> Old table: hits a bucket with hash = MOVED
Writer B -> sizeCtl: bump helper count, take next segment via transferIndex
Writer B -> New table: write its part
Writer A -> sizeCtl: SET sizeCtl = new threshold (n - n/4), publish New table as table
Writer B -> New table: keep writing normally after resize done
~~~
Three invariants make this correct:
1. **No table-wide lock.** Each bucket is touched by exactly one thread at a time — either the owner of its segment or the writer that locked the head node.
2. **Reads are never blocked.** {{get}} encountering a ForwardingNode jumps to {{nextTable}}; so throughout resize reads still answer correctly, just one extra hop slower.
3. **Writes are deferred, not lost.** {{putVal}} seeing {{f.hash < 0}} calls {{helpTransfer}} then loops back to the top — no one writes into an already-abandoned old table.

### Why split the counter into cells
If one volatile {{count}} were CAS-incremented by every thread, all writes would fight over the same cache line (false sharing + CAS failure storm, exactly like AtomicLong under high contention). Striped64/LongAdder solves this with {{baseCount}} for the uncontended path and an array of cells that grows up to roughly CPU count; each thread picks a cell by its own **probe** (the internal {{threadLocalRandomProbe}} field of Thread), so two threads rarely land on the same slot. The trade-off: {{sum()}} adds all cells while they keep changing, so the result is an approximate snapshot.

### Table: practical consequences
| Situation | What happens |
|---|---|
| {{if (map.size() < MAX) map.put(...)}} | Cannot prevent overshoot: two threads both see size = MAX-1. Use {{compute}}/{{merge}} with limiting logic, or a different structure |
| 5M-entry map, constant adds | Multiple resizes; each allocates a doubled table → peak memory and GC pressure for seconds |
| {{new ConcurrentHashMap<>(1000, 0.75f, 64)}} | The third parameter {{concurrencyLevel}} has been **ignored** since Java 8 (API docs say so) — do not expect it to set lock count |
| {{putAll}} / {{Collectors.toConcurrentMap}} bulk load | JDK uses {{ReservationNode}} and per-bucket reduce/accumulate so many threads write in parallel with no global lock |
| {{mappingCount()}} vs {{size()}} | {{mappingCount()}} returns {{long}}, use it when the map can exceed 2 billion entries; {{size()}} returns {{int}} and becomes Integer.MAX_VALUE on overflow |

### On production
- **Pre-size.** For a cache with millions of keys, construct with the expected capacity (JDK runs {{tableSizeFor(expected / loadFactor)}}) to avoid resize storms; or load all data on a single thread at startup before opening to traffic.
- **Recognize the evidence.** RTT spikes that track map growth, plus rising allocation rate in the GC log ({{-Xlog:gc*}}, or JFR events {{jdk.JavaHeapOperation}}/{{jdk.ObjectAllocationInNewTLAB}}), are usually resize rather than "slow map".
- **Peak memory** during resize ≈ old table + new table coexisting; if the pod is near its limit, a resize during peak traffic can OOMKill. This is why services with large in-heap caches set {{-XX:MaxRAMPercentage}} with headroom (combined with heap tuning in the jvm topic).
- **Tree unbundling:** resize also **untreeifies** when chains shorten, so tree overhead can vanish after the table grows.
- **Do not call {{size()}} in a hot loop** to "probe" each element; if periodic stats are needed, read {{mappingCount()}} once and export it as a metric.

### 1-minute verbal answer
"ConcurrentHashMap resize is a coordinated parallel algorithm: the first thread CASes {{sizeCtl}} to claim the pass with a resizeStamp, allocates a doubled table, then splits the old table into segments via {{transferIndex}}. A moved bucket leaves a {{ForwardingNode}} with hash MOVED, so {{get}} jumps to the new table while {{put}} calls {{helpTransfer}} to take a segment — resize is therefore spread across every thread walking by, with no table-wide lock. The counter is striped too: {{baseCount}} plus a {{CounterCell}} array padded to cache lines LongAdder-style, so writes do not fight over one line, but {{size()}} is only a sum at a point in time, not linear. Practical consequences: pre-size the map to avoid resize storms, use {{mappingCount()}} for large maps, and do not treat {{size()}} as an atomic check."

> Senior tip: the two details that separate source readers from blog readers are: {{concurrencyLevel}} has been ignored since Java 8, and {{size()}} is {{sumCount()}} rather than an atomic counter. Adding "RTT spikes track resize cadence, not QPS" is a sign you have handled an in-heap cache growing too large in production.`,
    follow: [
      'What guarantees {{get}} during resize does not return a false negative (null)?',
      'Why does CounterCell pick its slot by thread probe rather than round-robin, and how does LongAdder share this idea?',
      'When do you proactively use {{mappingCount()}} + pre-sizing instead of letting the map resize itself, and what threshold is reasonable?',
    ]
  },
  'concurrency-041': {
    q: 'How does {{StampedLock}} optimistic read work internally: what does the stamp contain, what does {{validate}} check, how does upgrading from optimistic to a write lock work, and why is it **not** the default choice over {{ReadWriteLock}}?',
    a: `**Summary:** Optimistic read is a read mode that leaves **no trace at all** on the lock state. You take a **stamp** (a long carrying the lock's version), read your data, then call {{validate(stamp)}}: if no writer passed in between, the version is unchanged → the data you read is a valid snapshot and you use it; if a writer did pass, {{validate}} returns false → only then do you actually take {{readLock()}} and re-read. The whole mechanism lives in how StampedLock encodes state: one long holds the reader count, a writer bit, and version bits; a writer flips the bit and bumps the version, so every old stamp is invalidated automatically. The price: no reentrancy, no Condition, no fairness, and the read code must be "clean" — no callbacks and no touching state outside the lock.

### Quick intuition
A tamper seal on a document box. You write down the seal code, peek inside quickly, then check the code: an intact seal means no one touched the box while you looked, so what you saw is trustworthy; a changed seal means someone just opened it — you must formally request to view it again. Optimistic read is "peek then check the seal"; {{readLock()}} is "ask permission before opening".

### Terminology
- **stamp**: long returned by {{tryOptimisticRead()}}, {{readLock()}}, {{writeLock()}}. It is both the "seal" for optimistic mode and the **key** for unlocking in read/write mode (hence {{unlockRead(stamp)}} needs the exact stamp you took).
- **validate(stamp)**: compares the version/reader bits of the stamp with current state, locking nothing. Returns true = "no writer intervened during my read".
- **tryConvertToWriteLock(stamp)**: tries to upgrade from optimistic (or read) to write **without blocking**; on failure you must call {{writeLock()}}.
- **AQS Sync inside**: when it really must wait (blocked writeLock, readLock with a waiting writer), StampedLock falls back to an AQS queue like any other lock; only the uncontended optimistic and read paths avoid the queue.
- **Hold counter (versus ReadWriteLock)**: ReentrantReadWriteLock splits one int state into 16 write bits + 16 read bits, and to avoid every reader CAS-ing the same variable it keeps {{firstReader}} plus {{cachedReads}} plus a {{ThreadLocalHoldCounter}} — that is why RRWL's read lock is cheaper than a naive RW lock but still more expensive than StampedLock's optimistic path.

### Standard pattern
~~~java
public class Point {
    private final StampedLock sl = new StampedLock();
    private volatile int x, y;          // volatile: a read in optimistic mode must see the last write

    public int distanceFromOrigin() {
        long stamp = sl.tryOptimisticRead();          // locks nothing
        int curX = x, curY = y;                       // copy everything needed into locals
        if (!sl.validate(stamp)) {                    // did a writer intervene?
            stamp = sl.readLock();                    // fall back to a real read
            try {
                curX = x;
                curY = y;
            } finally {
                sl.unlockRead(stamp);
            }
        }
        return Math.abs(curX) + Math.abs(curY);
    }

    public void move(int dx, int dy) {
        long stamp = sl.writeLock();                  // sole writer, excludes all readers/writers
        try {
            x += dx; y += dy;
        } finally {
            sl.unlockWrite(stamp);
        }
    }
}
~~~
The key point of the pattern: **read everything into locals before validating**, because after a failed validate you hold no rights to keep reading without taking the lock. And because the optimistic path creates no happens-before edge between write and read, the fields read in that mode should be volatile (or the data must be an immutable object published through a volatile reference) — this is the subtle trap the JDK docs warn about.

### Comparison table
| | ReentrantReadWriteLock | StampedLock |
|---|---|---|
| Reentrant | yes | **no** (locking twice on the same thread blocks itself) |
| Condition / await | yes | **no** |
| Fairness | selectable | none |
| Uncontended read lock | CAS on state (made cheap by hold counter) | writes nothing at all (cheapest) |
| Optimistic → write upgrade | none | {{tryConvertToWriteLock}} |
| Safety on misuse | JVM throws a clear IllegalMonitorStateException | wrong stamp usually **silent**, bug only surfaces when a write occurs |
| When it wins | many reads, occasional writes, familiar API | **very** many reads + profile showing contention on the read lock |

### On production
- **Measure first, change later.** Enable JFR {{jdk.JavaMonitorEnter}} or async-profiler {{-e lock}}/wall-clock, find frames {{ReentrantReadWriteLock$Sync.tryAcquireShared}} / {{park}} repeating. If the read lock is only 1% of samples, StampedLock saves nothing.
- **Heavy writes make StampedLock worse**: every write invalidates all old stamps, readers fall back to readLock — a longer path than RRWL.
- **Addiction to "lock-free reads" breeds hard-to-see bugs**: a small writer running between two field reads can mix half-old half-new values into the snapshot. Tests must include a real writing thread (see the concurrent-testing question), not just reads.
- **Consider the simpler option**: for rarely-changing config/lists, a {{volatile}} reference to an **immutable** object (copy-on-write) gives the same "zero-lock read" benefit with no stamp, no validate, and no misuse — that is what I pick when writes are under ~1% and the snapshot fits in memory.
- If you must use it: fully encapsulate the lock inside a small class, never leak stamps, and unit-test both the validate-true and validate-false branches (by injecting a writer at the right moment).

### Common mistakes
- Forgetting {{unlockRead(stamp)}} or passing the wrong stamp → lock "leaks", other readers wait forever.
- Calling {{readLock()}} then, inside the read section, calling something that takes {{writeLock()}} on the same thread → instant deadlock (not reentrant).
- Using optimistic read and then **writing** based on it: optimistic mode grants no write rights; you must convert to a write lock successfully first.
- Believing {{validate}} true means "my data is the latest as of right now" — it only means "no write happened in between"; a writer can change it the very next instant.

### 1-minute verbal answer
"StampedLock optimistic read takes a stamp encoding the lock version, reads data into locals, then validates: if no writer passed, the stamp is still valid and the data is usable; if one did, fall back to {{readLock()}}. It is cheap because the uncontended read path **writes nothing to state**, so no cache-line ping-pong between readers. But it is not reentrant, has no Condition, no fairness, fails silently on misuse, and the fields read must be volatile for correct visibility. So I only use it when profiling points clearly at read-lock contention in a read-heavy, write-light structure; otherwise {{ReadWriteLock}} or an immutable snapshot behind a {{volatile}} reference is the safer choice."

> Senior tip: the real story of StampedLock is not speed but **ease of getting it wrong**. It is faster in micro-benchmarks, but every bug is silent and only surfaces when a write happens. Before switching, try copy-on-write ({{volatile}} reference to an immutable object): same "zero-lock read" effect, and code review does not need to understand stamps.`,
    follow: [
      'Why must ReentrantReadWriteLock use a hold counter and {{firstReader}} instead of just CAS-ing one read-count variable?',
      'Optimistic read creates no happens-before edge — concrete consequence for a non-volatile field, and is volatile enough in both directions?',
      'What happens to a writer when an optimistic reader runs for a long time (reading 500MB inside the optimistic region)? Is there starvation?',
    ]
  },
});
