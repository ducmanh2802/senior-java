/*
 * English translation of js/data/lessons-concurrency.js — task T270. Format: js/core/i18n.js (content overlay).
 * ids: lesson-concurrency-002
 */
App.i18n.content({
  'lesson-concurrency-002': {
    title: 'synchronized, ReentrantLock and Atomic: choosing the right tool, avoiding deadlock',
    goals: [
      'Explain how {{synchronized}} and {{ReentrantLock}} work inside and when ReentrantLock-specific features are needed',
      'Know when CAS/{{AtomicLong}}/{{LongAdder}} is enough and when it is not',
      'Recognize the 4 deadlock conditions and break the "circular wait" condition with lock ordering',
      'Write a concurrent transfer function that loses no money, never goes negative, and never deadlocks',
    ],
    body: `### The problem: transferring money between two accounts
A transfer is **two writes that must go together**: debit the source account and credit the destination account, with the condition "sufficient balance". If another thread jumps in between, you may see money "disappear" (debited but not credited), or two threads both see enough balance and both debit, making the balance negative. Volatile (previous lesson) does not help, because the issue is the **atomicity of the whole group of operations**, not just visibility. We need **mutual exclusion**.

### synchronized: the lock built into every object
Every Java object can act as a monitor. {{synchronized (obj)}} compiles to a pair of bytecodes {{monitorenter}}/{{monitorexit}} (a synchronized method uses the {{ACC_SYNCHRONIZED}} flag), and the compiler emits {{monitorexit}} for exception paths too, so **never forget to release the lock**.

Under the hood, HotSpot stores the lock state in the **mark word** of the object header:

1. **Uncontended**: a thread acquires the lock with a single CAS on the header (lightweight/thin lock), without calling the OS.
2. **Contended** or a call to {{wait()}}: the lock inflates into an {{ObjectMonitor}} with a queue; a thread that cannot get the lock spins briefly and then is parked.
3. Biased locking (optimized for the case where only one thread uses the lock) has been **disabled by default since JDK 15** (JEP 374) and removed in later versions, so do not rely on it when explaining performance.

synchronized is **reentrant**: a thread that already holds the lock can re-enter a synchronized block on the same object without blocking itself (the monitor counts entries). Memory-wise: unlock happens-before the next lock on the same monitor, so every write inside the block is seen by the thread that enters after.

### ReentrantLock: same semantics, more features
{{ReentrantLock}} is built on {{AbstractQueuedSynchronizer}} (AQS): a {{volatile int state}} variable (0 = free, n = number of times the owner thread has entered) changed via CAS, plus a FIFO queue of waiting threads parked/unparked by {{LockSupport}}. Memory semantics are identical to synchronized. What you give up is having to call {{unlock()}} in a {{finally}}; what you get:

| Feature | synchronized | ReentrantLock |
|---|---|---|
| Wait for lock with timeout | No | {{tryLock(100, MILLISECONDS)}} |
| Cancel while waiting for lock (interrupt) | No | {{lockInterruptibly()}} |
| Fair (first to wait goes first) | No | {{new ReentrantLock(true)}}, lower throughput |
| Multiple condition waits | One wait-set per object | Multiple {{Condition}}s ({{notFull}}, {{notEmpty}}) |
| Release lock on exception | Automatic | Must write {{finally}} |
| Visible in thread dump / JFR | Yes | Yes ({{jstack -l}} lists "Locked ownable synchronizers") |

> **Default to synchronized** for short blocks: concise, no forgotten releases, JIT optimizes well (lock elision, lock coarsening). Only choose ReentrantLock when you need one of the table's features, or when running on JDK 21–23 virtual threads (blocking inside synchronized pins the carrier thread, see lesson 5).

### Atomic and CAS: lock-free, but for one variable only
{{AtomicLong.incrementAndGet()}} uses the CPU's **compare-and-swap** instruction (on x86 it is {{lock cmpxchg}}): read the old value, compute the new one, write only if the value in memory is still the old one; if it loses, try again. No thread is parked, so there is no deadlock. Limitation: CAS protects only **one memory location**. A transfer needs to change two locations at once, so it cannot be done with two separate AtomicLongs (there is still a gap between the two CASes). When many threads increment one counter at the same time, CAS loses repeatedly; {{LongAdder}} splits the counter into multiple cells per thread and only adds them up at {{sum()}}, so it fits metrics.

### Deadlock and lock ordering
Deadlock requires all **4 conditions** (Coffman): mutual exclusion, holding a lock while waiting for another lock (hold and wait), no preemption, and **circular wait**. Naive transfer creates the circle immediately:

~~~java
// WRONG: T1 transfers A→B locking A then waits for B; T2 transfers B→A locking B then waits for A → hangs forever
synchronized (from) { synchronized (to) { /* ... */ } }

// CORRECT: every thread always locks the account with the smaller id first → no circle possible
Account first = from.id < to.id ? from : to;
Account second = first == from ? to : from;
first.lock.lock();
try {
    second.lock.lock();
    try {
        if (from.balance < amount) return false;   // check and deduct in the SAME lock
        from.balance -= amount;
        to.balance += amount;
        return true;
    } finally {
        second.lock.unlock();
    }
} finally {
    first.lock.unlock();
}
~~~

Why does lock ordering prevent deadlock? If every thread acquires locks in the same global order, the thread holding the largest-id lock in a waiting cycle will never have to wait for a smaller-id lock, so the circle cannot close. Another way: {{tryLock}} with a timeout, on failure release everything, wait randomly, then retry (this breaks "hold and wait"); this approach needs random backoff to avoid livelock.

### Production bugs you will actually meet
- **Calling I/O while holding a lock** (HTTP, DB, Kafka send): a slow request makes every thread queue behind it, the thread pool drains, and the whole service hangs looking like deadlock.
- {{synchronized}} on a {{String}} literal or boxed {{Integer}}: two unrelated pieces of code share the same interned/cached object, so they lock each other out.
- {{lock()}} placed **inside** {{try}}: if {{lock()}} throws, {{finally}} calls {{unlock()}} on a lock not held and throws {{IllegalMonitorStateException}}, hiding the original error. Always call {{lock()}} right before {{try}}.
- Lock ordering but **in the DB**: two transactions {{UPDATE}} two rows in opposite order also deadlock; PostgreSQL/MySQL detect and abort one transaction. Same principle: update in primary-key order.
- Diagnosis: {{jstack}} prints "Found one Java-level deadlock" with the wait cycle; in code use {{ThreadMXBean.findDeadlockedThreads()}} for health checks.

### Interview relevance
The interviewer often presents the transfer code and asks "what's wrong with it?". A senior answer: (1) point out the race if there is no lock, (2) point out deadlock when nested locks follow the parameter order, (3) fix it by id order, (4) add the limitation: in distributed systems, JVM locks are not enough; you need DB transactions with {{SELECT ... FOR UPDATE}} in id order or optimistic locking using a version column.`,
    exercises: [
      {
        title: 'Concurrent bank transfer: no lost money, no deadlock',
        prompt: `Write {{Bank}} managing accounts numbered {{0..n-1}} with initial balances {{initial[i]}}. Multiple threads call concurrently:

- {{transfer(from, to, amount)}}: if the source account has enough money, debit source and credit destination, return {{true}}; not enough, change nothing, return {{false}}. Throws {{IllegalArgumentException}} when {{amount <= 0}}, {{from == to}} or id is out of range.
- {{balance(id)}}: current balance.
- {{totalBalance()}}: total balance, must be a **consistent snapshot**: called while other threads are transferring money, it must still return the correct initial total.

The test runs 8 threads transferring back and forth (0→1 and 1→0) hundreds of thousands of times: if it does not finish within 5 seconds it is a FAIL (deadlock). Balances must never go negative. Use **per-account locking** (not a single lock for the whole bank) and lock in id order.`,
        hints: [
          'Create a {{ReentrantLock[]}} array (or an array of {{Object}} monitors), one lock per account.',
          'In {{transfer}}: lock {{min(from, to)}} first, {{max(from, to)}} second; check the balance **inside** both locks.',
          'Each {{lock()}} goes right before a {{try}} whose {{finally}} calls {{unlock()}}.',
          '{{totalBalance()}}: lock all accounts in increasing id order, then sum; if you sum without locking, you may read when money has been debited from A but not yet credited to B.',
        ],
        explain: `Three decisions make the solution correct:

1. **Check-then-act inside the lock**: {{if (balances[from] < amount)}} and the deduction are in the same locked region of the source account, so two threads cannot both see "enough money". The "drain one account" test counts exactly 1000 successful transfers.

2. **Global lock order by id**: transfer(0,1) and transfer(1,0) both lock 0 then 1, so there is no circular wait. Code {{synchronized (from) synchronized (to)}} following parameter order almost certainly hangs in the 0↔1 test.

3. **totalBalance locks in the same order**: acquiring all locks in increasing id order cannot deadlock with transfer (also increasing), and while all locks are held no transaction is in progress.

Common mistakes:
- Using a single {{synchronized}} for the whole Bank: correct but every transaction runs sequentially; interviewers usually follow up "how do unrelated transactions run concurrently?".
- Using {{AtomicLong}} per account: each account is safe but the debit/credit pair is not atomic, and {{totalBalance}} can see money "fly" between two statements.
- Reading {{balance(id)}} without locking on the {{long[]}} array: a data race; here the solution locks for visibility (alternatively you could use {{AtomicLongArray}} for reads, but writes still need the lock).

Instead of lock ordering, you can use {{tryLock(timeout)}}: if the second lock is not obtained, release the first lock, sleep a random amount, then retry. That approach is more complex and can livelock without random backoff.`,
      },
    ],
    check: [
      {
        q: 'When do you **need** {{ReentrantLock}} instead of {{synchronized}}?',
        options: ['When you need higher performance in all cases', 'When you need timed lock waiting, interruptible cancellation, fair lock, or multiple Conditions', 'When you need reentrancy', 'When you need visibility between threads'],
        explain: `Those are features synchronized does not have. "Faster in all cases" is wrong: since Java 6 synchronized has been heavily optimized and is often on par with ReentrantLock. synchronized **is** reentrant too. Both create happens-before between unlock and the next lock, so visibility is the same.`,
      },
      {
        q: 'Thread T1 calls {{transfer(A, B)}}, T2 calls {{transfer(B, A)}}, both using {{synchronized (from) synchronized (to)}}. Which fix eliminates deadlock at the root?',
        options: ['Mark both balance fields as volatile', 'Use a fair lock', 'Always lock the account with the smaller id first', 'Call Thread.yield() between the two locks'],
        explain: `Global lock order breaks the circular wait condition, so deadlock cannot occur. Volatile is unrelated to locking. Fair lock only changes the order in which waiting threads **get** the lock, it does not break the circle. {{Thread.yield()}} only makes deadlock less frequent, it does not eliminate it.`,
      },
      {
        q: 'Why not implement transfer with two {{AtomicLong}}s (one per account) using {{addAndGet}}?',
        options: ['Because AtomicLong is slower than synchronized', 'Because CAS is atomic only on one variable; the debit/credit pair and the sufficient-balance condition are no longer atomic', 'Because AtomicLong does not guarantee visibility', 'Because AtomicLong can cause deadlock'],
        explain: `Each {{addAndGet}} is atomic by itself, but between the two calls there is a gap: another thread sees a wrong total, and the check-balance-then-debit is check-then-act. AtomicLong is usually **faster** than locking at moderate contention. It has volatile semantics so visibility is guaranteed. CAS does not park threads, so it does not cause deadlock.`,
      },
    ],
  },
});
