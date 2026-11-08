/*
 * English translation of js/data/lessons-concurrency.js — task T1013. Format: js/core/i18n.js (content overlay).
 * ids: lesson-concurrency-010 lesson-concurrency-011
 */
App.i18n.content({
  'lesson-concurrency-010': {
    title: 'Building an AQS-style lock: state, CAS, queues, and reentrancy',
    goals: [
      'Understand the internal mechanics of AQS (AbstractQueuedSynchronizer) in the JDK: the state variable, CAS operations, the wait queue, and park/unpark',
      'Build a simplified MiniLock that models the core ideas: mutual exclusion, reentrancy, tryLock, and owner-checked unlock',
      'Distinguish an educational hand-rolled lock from java.util.concurrent.locks.ReentrantLock (a real, optimized implementation with optional fairness)',
      'Explain why unlock must verify the owner and why CAS is the foundation of high-performance locks',
    ],
    body: `### What it is: what is a lock, and why understand its internals?
A **lock** is a mechanism that ensures only one thread (a thread of execution — the smallest unit of parallel work inside a process) enters a critical section at a time (a critical section is code that accesses shared data; if multiple threads enter together, it causes bugs). Everyday analogy: a public restroom has a single key — only the person holding the key can enter, everyone else lines up and waits.

In Java you typically use {{synchronized}} or {{java.util.concurrent.locks.ReentrantLock}}. But senior interviews often ask: "How does ReentrantLock work internally?" The answer is **AQS**.

**AQS (AbstractQueuedSynchronizer — an abstract queued synchronizer)** is the base class in {{java.util.concurrent.locks}} (since Java 5) that {{ReentrantLock}}, {{Semaphore}} (counts the number of permits/entries), {{CountDownLatch}}, and {{ReentrantReadWriteLock}} are all built on. You do not use AQS directly every day, but understanding it helps you reason correctly about lock performance, starvation (a thread waits forever and never gets to run), and concurrency bugs (bugs that occur when multiple threads run at the same time).

### How it really works in the JDK (ReentrantLock/AQS)
AQS manages three main things:

1. **state**: a {{volatile int}}. For an exclusive lock: 0 = free, > 0 = held (the value represents the reentrant hold count). {{volatile}} guarantees visibility (other threads see the new value immediately) under the Java Memory Model (JMM — Java's rules for how threads see each other's data).
2. **CAS (Compare-And-Swap)**: an operation of the form "if the current value is the expected value, set it to the update, all in one indivisible step." In Java, CAS is available in {{java.util.concurrent.atomic}} ({{AtomicInteger.compareAndSet}}, {{AtomicReference.compareAndSet}}). CAS lets a thread acquire a lock without immediately taking a heavyweight lock.
3. **Wait queue (CLH-style queue)**: threads that fail to acquire the lock are placed in a queue (each node holds thread information). AQS uses {{LockSupport.park(thread)}} to suspend a thread (yielding the CPU) and {{LockSupport.unpark(thread)}} to wake it when the lock is released. This avoids "spinning" (repeatedly checking in a tight loop), which wastes CPU when waiting for a long time.

The flow for acquiring an exclusive lock (simplified, illustrating the idea):
~~~java
// Core idea (NOT the real AQS source code)
int c = getState();
if (c == 0) {                        // lock is free
    if (compareAndSetState(0, 1)) {  // CAS: acquire the lock atomically
        setExclusiveOwnerThread(Thread.currentThread());
        return;                      // success, enter the critical section
    }
}
// failure: enqueue, park() and wait, retry when unparked
~~~

**Reentrant**: the same thread that holds the lock can lock it again without blocking itself (for example, method A calls method B and both need the lock). AQS checks: if the owner is the current thread, it does {{state++}}. On unlock, {{state--}}; only when {{state == 0}} is the lock actually released and the next thread woken.

| Aspect | {{synchronized}} (JVM monitor) | {{ReentrantLock}} (AQS-based) |
|---|---|---|
| Acquire/release | Automatic with the block | {{lock()}} / {{unlock()}} (must use {{finally}}) |
| Try without waiting | Not available | {{tryLock()}} |
| Timed/interruptible wait | Limited | {{tryLock(time)}}, {{lockInterruptibly()}} |
| Fairness (FIFO) | Not guaranteed | Optional {{new ReentrantLock(true)}} |
| Wait conditions | {{wait/notify}} | {{Condition}} (multiple conditions) |

> **Configuration/reality (JDK 17/21):** {{ReentrantLock}} lives in {{java.util.concurrent.locks}}. The default is **unfair** because throughput is usually higher; a fair lock reduces starvation but is slower. Always put {{unlock()}} in {{finally}}. Since Java 21 there are virtual threads, but {{ReentrantLock}} remains an important tool.

### The MiniLock simulation: where do we simplify?
The exercise asks you to write a {{MiniLock}} using {{AtomicInteger}} (for the reentrant state count) and {{AtomicReference<Thread>}} (for the owner — the thread holding the lock). This is an **educational simulation**, NOT for production use.

- **Similar to AQS ideas:** uses CAS ({{compareAndSet}}) to acquire state, stores the owner, supports reentrancy (counting state), provides non-waiting {{tryLock}}, and only allows the owner to {{unlock}}.
- **Simplifications:** there is no real CLH queue and no {{LockSupport.park/unpark}}. When {{lock()}} cannot acquire, we use **spin-wait** (loop and retry) with {{Thread.onSpinWait()}} (a CPU hint to reduce power while spinning, Java 9+). Spinning wastes CPU on long waits — real AQS switches to park to avoid that.
- **Why acceptable:** for short tests with a tiny critical section, spinning is enough to demonstrate correctness (mutual exclusion — only 1 thread enters + reentrancy) without building a complex queue.

~~~java
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

class MiniLock {
    private final AtomicInteger state = new AtomicInteger(0);       // 0=free, >0=reentrant hold count
    private final AtomicReference<Thread> owner = new AtomicReference<>(null);

    void lock() {
        Thread me = Thread.currentThread();
        // if me is already the owner -> state++; if free -> CAS state 0->1 and set owner; otherwise -> spin and retry
    }
    boolean tryLock() {
        Thread me = Thread.currentThread();
        throw new UnsupportedOperationException("TODO");
    }
    void unlock() {
        Thread me = Thread.currentThread();
        // if not the owner -> throw IllegalMonitorStateException; decrement state; when 0 clear the owner
        throw new UnsupportedOperationException("TODO");
    }
}
~~~

> **Note:** in this educational simulation, a common pattern is: {{if (state.decrementAndGet() == 0) owner.set(null);}}. {{unlock}} is only called by the owner (already checked), so the logic is safe enough for the exercise.

### Real-world production pitfalls
- **Forgetting {{unlock()}} in {{finally}}:** the lock is held forever and other threads hang. {{synchronized}} releases automatically when leaving the block, so it is safer in this regard.
- **Unlocking from the wrong thread:** AQS/ReentrantLock throws {{IllegalMonitorStateException}}.
- **Hand-rolled spin locks for long waits:** they burn CPU and drive latency up. Use JDK primitives.
- **Assuming fairness:** ReentrantLock is unfair by default.

### Interview relevance
Common questions: "What is AQS? How does ReentrantLock use it? What is CAS? How does {{tryLock}} differ from {{lock}}? Why must {{unlock}} be in {{finally}}? Fair vs. unfair lock?" Answer with the framework: **state + CAS to acquire + queue + park/unpark**, mention reentrancy via the state count, and emphasize always using the JDK APIs instead of writing your own lock (except for learning).
`,
    exercises: [
      {
        title: 'MiniLock: mutual exclusion, reentrancy, tryLock, and owner checks',
        prompt: `Complete the {{MiniLock}} class that simulates AQS ideas (simplified): use {{AtomicInteger state}} (0=free, >0=hold count) and {{AtomicReference<Thread> owner}}.

Requirements:
- {{lock()}}: if the current thread is already the owner, increment {{state}} (reentrant). If the lock is free (state 0), acquire it via CAS {{0 -> 1}} and set the owner. If it is held by another thread, spin-wait (call {{Thread.onSpinWait()}} in the loop) until acquired.
- {{tryLock()}}: attempt to acquire **once**, without waiting. Return {{true}} on success (including reentrant acquisition), {{false}} if held by another thread.
- {{unlock()}}: if the current thread is **not** the owner, throw {{IllegalMonitorStateException}}. If it is the owner: decrement state; when state reaches 0, clear the owner.

The tests: 8 threads × 10,000 increments under {{lock/unlock}} (result 80,000); correct reentrancy; {{tryLock}} fails while held; unlock by another thread throws {{IllegalMonitorStateException}}.`,
        hints: [
          'Use {{state.compareAndSet(0, 1)}} as the atomic gate to acquire the lock. Only set {{owner}} after a successful CAS.',
          'Reentrancy: if {{owner.get() == Thread.currentThread()}} then {{state.incrementAndGet()}}.',
          'In {{unlock}}, check the owner first; decrement state; if it reaches 0 then {{owner.set(null)}}; throw {{IllegalMonitorStateException}} for the wrong owner.',
        ],
        explain: `**CAS on state is the gate** for mutual exclusion. Reentrancy uses the state count when the owner matches. Real AQS adds a queue + {{LockSupport.park/unpark}} so long waits do not burn CPU, and supports fairness; MiniLock uses spinning, so it is only suitable for extremely short critical sections in an exercise.`,
      },
    ],
    check: [
      {
        q: 'What does CAS (Compare-And-Swap) guarantee?',
        options: [
          'It is always faster than synchronized in every case',
          'The check and update happen as one atomic step: the value changes only if the current value matches the expected value',
          'It automatically enqueues the thread to wait',
          'It completely removes the need for volatile',
        ],
        answer: 1,
        explain: 'CAS is atomic for the compare-then-swap pattern. It does not enqueue by itself (AQS does that with a queue/park).',
      },
      {
        q: 'What does it mean for a lock to be reentrant?',
        options: [
          'Multiple threads hold the lock at the same time',
          'The same thread that holds the lock can acquire it again without blocking itself; state counts the number of holds',
          'The lock releases itself after a period of time',
          'The lock can only be used once',
        ],
        answer: 1,
        explain: 'A thread that locks the owner N times must unlock N times before the lock is truly free. AQS/ReentrantLock implement this by incrementing/decrementing state.',
      },
      {
        q: 'Why does real AQS use LockSupport.park/unpark instead of spinning forever?',
        options: [
          'Because CAS cannot be used in Java',
          'Continuous spinning wastes CPU on long waits; park lets the thread yield the CPU and unpark wakes it when it is its turn',
          'Because park is faster than CAS',
          'Because spinning does not work on multi-core CPUs',
        ],
        answer: 1,
        explain: 'Spinning is fine for very short waits. On long waits, spinning wastes CPU. AQS tries fast, then enqueues and parks; unlock unparks.',
      },
    ],
  },
  'lesson-concurrency-011': {
    title: 'Lock-free Treiber stack and the ABA problem (AtomicStampedReference)',
    goals: [
      'Understand lock-free data structures and how the Treiber stack uses CAS on head to push/pop',
      'Explain the ABA problem: CAS succeeds even though the state changed "under the hood", causing a logic error',
      'Use AtomicStampedReference (a stamp/version) to detect ABA in scenarios where nodes/values may be reused',
      'Distinguish when lock-free is appropriate and when a simple lock is safer in production',
    ],
    body: `### What it is: lock-free and the Treiber stack
**Lock-free** is a style of concurrent programming (multiple threads running at the same time) where the system always makes progress on at least one thread, without relying on an exclusive lock. Instead of "only whoever holds the key may enter," threads use **CAS** to race on updating a shared pointer/state; if they lose (the value changed), they retry.

The **Treiber stack** (1986) is the classic lock-free stack (LIFO — last in, first out, like a stack of plates): elements form a singly linked list with a {{head}} variable pointing to the top. Both push and pop are CAS loops on {{head}}.

Everyday analogy: instead of locking the whole stack of plates, each person looks at the top, prepares a new plate, and then "CASes" the new plate in as the top if the top is still what they saw; if someone else changed the top, they look again and retry.

### How it works: push/pop with CAS
~~~java
class Node { int value; Node next; Node(int v, Node n){ value=v; next=n; } }
AtomicReference<Node> head = new AtomicReference<>(null);

// push: create a new node -> next points to the old head -> CAS head: old -> new
void push(int v) {
    while (true) {
        Node old = head.get();
        Node n = new Node(v, old);
        if (head.compareAndSet(old, n)) return;  // success
        // failure: head changed, retry
    }
}

// pop: read head -> read next -> CAS head: head -> next
Integer pop() {
    while (true) {
        Node old = head.get();
        if (old == null) return null;
        Node next = old.next;
        if (head.compareAndSet(old, next)) return old.value;
    }
}
~~~

Each operation succeeds only when {{head}} is still exactly as observed — optimistic with an atomic check.

### What is the ABA problem? Why can CAS be "fooled"?
The **ABA problem**: CAS only asks "is the current value equal to A?" — it does **not** know the value may have changed A -> B -> A. If, between the read and the CAS, the state changed and then changed back to A, the CAS still succeeds but intermediate assumptions (for example {{next}} of node A) may now be wrong.

The classic scenario (with node reuse so A returns with the same identity — the same object):
1. Thread T1 reads {{head = A}} and computes {{next = A.next = B}} (planning to pop A).
2. T1 is paused. Thread T2 pops A, pops B, then pushes A back (head is A again).
3. T1 resumes: sees {{head == A}}, so the CAS succeeds and sets {{head = B}}. But B is **no longer** in the stack in the correct sense. The stack is corrupted.

| Step | head (top -> ...) | Actor |
|---|---|---|
| initial | A -> B -> C | |
| T1 reads old=A, next=B | A -> B -> C | T1 (paused) |
| pop A, pop B | C | T2 |
| push A (reuse A) | A -> C | T2 |
| T1 CAS(A,B) succeeds | B -> ? | **bug: B already left the stack** |

> ABA is dangerous when there is **memory/node reuse** (an object pool — a pool that reuses objects) or when the algorithm depends on the history of changes.

### The fix: AtomicStampedReference (version stamping)
**AtomicStampedReference<V>** ({{java.util.concurrent.atomic}}, Java 5+) holds a pair {{(reference, int stamp)}} and supports CAS on **both**. Each time we change head we increment the stamp. T1 reads (A, stamp=1); after the A->B->A sequence the stamp has become (A, 3); T1's CAS demands (A,1), so it **fails** — ABA is detected.

~~~java
import java.util.concurrent.atomic.AtomicStampedReference;
AtomicStampedReference<Node> head = new AtomicStampedReference<>(null, 0);
// CAS: compareAndSet(expectedRef, newRef, expectedStamp, newStamp)
~~~

There is also {{AtomicMarkableReference}} (a boolean mark, for example to mark a node as deleted). In Java, the GC (garbage collector — the runtime that automatically frees memory) reduces the risk of use-after-free, but it does **not** solve logical ABA.

### The simulation in the exercise: where do we simplify?
- Exercise 1 builds a correct lock-free **Treiber stack** for basic concurrent operations using {{AtomicReference}} + a CAS loop, returning {{null}} when empty. We do **not** create ABA with a complex object pool — the goal is to understand the CAS pattern.
- Exercise 2 **simulates ABA with a deterministic scenario**: instead of relying on the scheduler (the thread scheduler, which is not deterministic), we use {{AtomicStampedReference<Integer>}} and perform the steps sequentially to force the exact order A->B->A, then prove that a CAS using the old stamp fails while a CAS using the current stamp succeeds. This is a controlled simulation, not a reproduction of stack corruption under random racing.

### Real-world production pitfalls
- **Lock-free is hard to get right:** rare races often do not show up in tests. In production, prefer {{java.util.concurrent.ConcurrentLinkedDeque}} / JDK-proven structures.
- **Spinning under high contention:** can lead to livelock (everyone keeps retrying). Backoff or an appropriate structure is needed.
- **Mistaking ABA for only a reference issue:** it is really "same observation, wrong history."

### Interview relevance
Common questions: "How does the Treiber stack work? What is ABA, and how do you fix it with {{AtomicStampedReference}}? When would you use lock-free?" Answer: CAS on head (push/pop), describe the A->B->A scenario, mention the stamp/version, and conclude: use JDK concurrent structures unless you have a very clear reason not to.
`,
    exercises: [
      {
        title: 'Lock-free Treiber stack (CAS)',
        prompt: `Complete {{LockFreeStack}} using {{AtomicReference<Node> head}} and the Treiber algorithm:

- {{push(int v)}}: create a new node whose {{next}} is the current head, CAS head from the old head to the new node; retry if the CAS fails.
- {{pop()}}: return the value at the top, or {{null}} if the stack is empty. Read head; if null return null; CAS head from head to {{head.next}}; retry if it fails.

The {{Node}} class is provided. The tests run multiple threads pushing/popping and verify correctness (no lost or duplicated elements).`,
        hints: [
          'Common pattern: read a snapshot {{old = head.get()}}, compute the new state, then {{head.compareAndSet(old, newState)}}; if false, loop again.',
          'Push: {{new Node(v, old)}} then CAS head {{old -> n}}. Pop: if {{old==null}} return {{null}}, otherwise CAS head {{old -> old.next}} and return {{old.value}}.',
        ],
        explain: `CAS succeeds only if {{head}} has not changed since {{old}} was read. If another thread acted, the loop retries with the new head. In production prefer {{ConcurrentLinkedDeque}}; ABA is demonstrated in exercise 2 using a stamp.`,
      },
      {
        title: 'Detecting ABA with AtomicStampedReference (deterministic scenario)',
        prompt: `Simulate a controlled ABA: use {{AtomicStampedReference<Integer> ref}} with initial value {{A}} and initial stamp {{1}}. Force the sequence **A(stamp1) -> B(stamp2) -> A(stamp3)** with sequential (deterministic) steps, then prove:

1. A "stale" CAS (expectedRef=A, expectedStamp=1, wanting to set C) must **fail** even though the current reference is A again — because the stamp changed (ABA detected).
2. A CAS with the current stamp (expected ref A, expected current stamp -> C, stamp+1) succeeds.

Complete {{AbaDemo}}: the constructor takes {{int a,b,c}}; {{runScenario()}} performs A->B->A (incrementing the stamp on each change) and returns {{true}} if the stale CAS fails **and** the correctly-stamped CAS then succeeds with final value C; otherwise {{false}}.`,
        hints: [
          'Use {{compareAndSet(expectedRef, newRef, expectedStamp, newStamp)}}. Sequentially: (a,1)->(b,2) then (b,2)->(a,3).',
          'Trying the stale CAS {{compareAndSet(a, c, 1, 4)}} must return {{false}} because the current stamp is 3. Get the current stamp with {{get(stampHolder)}} then CAS with the correct stamp.',
        ],
        explain: `**An equal reference is not enough** — you must compare the stamp too. The stale CAS fails even though it sees {{a}} again because the stamp went 1->2->3 — ABA is detected. In a real lock-free stack, increment the stamp on every head change and CAS on both (ref, stamp).`,
      },
    ],
    check: [
      {
        q: 'What is the ABA problem in CAS?',
        options: [
          'CAS always fails when multiple threads run',
          'The value changes A -> B -> A so CAS only sees that A matches and succeeds, even though intermediate state/assumptions changed',
          'A deadlock among three threads A, B, A',
          'An overflow error when incrementing a counter',
        ],
        answer: 1,
        explain: 'CAS does not keep history; it only compares the current value with the expected value. If the value returns to A, CAS is blind to the changes in between.',
      },
      {
        q: 'What does AtomicStampedReference provide over AtomicReference in the context of ABA?',
        options: [
          'It makes CAS faster',
          'It pairs a version number (stamp) and CASes on both (reference, stamp), so it can detect a reference that returned to an old value after changes',
          'It automatically uses an internal lock',
          'It can only be used with String',
        ],
        answer: 1,
        explain: 'The stamp increases on each change; CAS requires both the reference and the stamp to match, so A with the old stamp does not match A with the new stamp.',
      },
      {
        q: 'In production Java, when you need a concurrent stack/queue, what is usually the most pragmatic choice?',
        options: [
          'Always write your own lock-free Treiber stack',
          'Prefer proven structures in java.util.concurrent (for example ConcurrentLinkedQueue/Deque) unless you have a very clear reason',
          'Always use synchronized on every operation',
          'Use a shared ArrayList across threads',
        ],
        answer: 1,
        explain: 'Hand-rolled lock-free code is hard to get right (ABA, livelock). The JDK provides thoroughly tested concurrent structures.',
      },
    ],
  },
});
