/*
 * English translation of js/data/q-concurrency-jvm.js — task T171/T517. Format: js/core/i18n.js (content overlay).
 * ids: concurrency-024 concurrency-025 concurrency-026 concurrency-027 jvm-019 jvm-020 jvm-021
 */
App.i18n.content({
  'concurrency-024': {
    q: `How does {{synchronized}} differ on a static method, instance method and block (class lock vs object lock)? If two threads call a static synchronized method and an instance synchronized method of the same class at the same time, do they block each other?`,
    a: `**Summary:** synchronized always locks **one specific object**. An instance method locks {{this}}; a static method locks the {{Class}} object ({{Foo.class}}); a block locks the object you name. Different locks do not block each other: static synchronized and instance synchronized of the same class can run in parallel. That is very often exactly the bug when both modify the same static field. Likewise, two different instances calling an instance synchronized method do not block each other.

### Quick intuition
Every Java object comes with its own lock, and every class also has its own lock (the lock of the {{Class}} object). {{synchronized}} on an instance method is like the door lock of **an individual flat**: two people entering two different flats never block each other. {{static synchronized}} is like the lock of the **building's front gate**: but the gate lock and the flat locks are different locks, so one person holding the gate key and another holding a flat key can still move in parallel. The bug appears when something shared by the whole building (a static field) is protected only by the key of each individual flat.

### Terms
- **Object lock (instance lock)**: the monitor of one specific object, e.g. {{this}}.
- **Class lock**: the monitor of the {{Class}} object ({{Foo.class}}), used by static synchronized.
- **Monitor**: the lock attached to every object, with an owner and a waiting queue.
- **Reentrant**: a thread that already holds a lock can take the same lock again when calls nest.
- **monitorenter / monitorexit**: the bytecode instructions that enter and exit a synchronized block.
- **ACC_SYNCHRONIZED**: the bytecode flag marking a method as synchronized.
- **Value-based class**: a class such as Integer or LocalDate whose identity should not be relied on (so do not use it as a lock).
- **Lock inflation**: the JVM upgrading a lightweight lock to a full monitor when contention appears.

### How the JVM picks the object to lock (step by step)
1. It meets a {{synchronized}} instance method -> lock = {{this}} of that particular call.
2. It meets {{static synchronized}} -> lock = the {{Foo.class}} object (one object per class loader).
3. It meets {{synchronized (x)}} -> lock = the object x points to **at the moment the block is entered**.
4. Two threads block each other only when the steps above produce **the same object**. Why: every object has its own monitor, and the JVM has no notion of "locking the whole class together with all of its instances".

~~~text
           Foo.class (class lock)      a1 (object lock)      a2 (object lock)
T1: Foo.staticSync()  -> holds
T2: a1.syncMethod()                      -> holds        (does not wait for T1)
T3: a2.syncMethod()                                           -> holds (waits for nobody)
T4: a1.otherSync()                       -> WAITS for T2
~~~

### Lock matrix
| Thread A calls | Thread B calls | Blocked? |
|---|---|---|
| a1.syncMethod() | a1.otherSyncMethod() | Yes, same lock a1 |
| a1.syncMethod() | a2.syncMethod() | No, two different objects |
| Foo.staticSync() | Foo.otherStaticSync() | Yes, same lock Foo.class |
| Foo.staticSync() | a1.syncMethod() | No, Foo.class and a1 are two different objects |
| a1.syncMethod() | a1.plainMethod() | No, an unsynchronized method needs no lock |

### Common bug: wrong lock scope
~~~java
class SequenceService {
    private static long next = 0;            // static data, shared by every instance

    public synchronized long nextId() {      // locks THIS, not the class
        return ++next;
    }
}
// As a Spring singleton (1 instance) this is temporarily fine.
// But somewhere there is new SequenceService() -> 2 different locks -> duplicate ids.
~~~
Fix: lock the right object, the one that protects the data, i.e. {{static synchronized}} or {{synchronized (SequenceService.class)}}; even better, use {{AtomicLong}}.

Rule: **the lock must have the same scope as the data it protects**. Instance data -> instance lock, static data -> static lock.

### Synchronized block and choosing the lock object
~~~java
class AccountService {
    private final Object lock = new Object();   // dedicated private final lock

    public void transfer(long from, long to, long amount) {
        validate(from, to, amount);             // outside the locked section
        synchronized (lock) {                   // lock only the segment that truly needs it
            debit(from, amount);
            credit(to, amount);
        }
        notifyCustomer(from);                   // I/O kept outside the locked section
    }
}
~~~
- A private final lock keeps outside code (or a library) from synchronizing on your object and causing a deadlock that is very hard to explain.
- Do not lock on: String literals (interned, shared across the whole JVM); small {{Integer}}/{{Long}} values (cached, shared); non-final fields (reassigning the field changes the lock); {{getClass()}} (a subclass has a different Class). Since JDK 16, javac warns when you synchronize on an instance of a value-based class such as Integer.

### Inside the JVM
- Synchronized methods carry the {{ACC_SYNCHRONIZED}} flag in bytecode; blocks use the {{monitorenter}}/{{monitorexit}} pair, plus one monitorexit in the exception branch so the lock is always released.
- Reentrant: a thread holding the lock can call another synchronized method on the same object without blocking itself.
- Biased locking has been disabled by default since JDK 15 and removed in JDK 18. JDK 21 uses a lightweight lock when there is no contention and only inflates to a full monitor when contention occurs.

### Common wrong answers
- "static synchronized and instance synchronized share one lock": wrong, they are two different objects.
- "a synchronized method locks the whole object, so every method of the object is blocked": only methods/blocks synchronized on the same object wait for each other.
- "synchronized inside the service is enough": it only works inside **one JVM**. A service running 3 pods has 3 independent locks; then you must lock at the DB or use atomic operations on the data store.

### Common mistakes
- **Instance synchronized protecting a static field**: the symptom is duplicate IDs and wrong counts once there is more than one instance (a test calling new, a prototype bean). Avoid it by locking with the scope of the data, or use AtomicLong.
- **synchronized on a String literal or an Integer**: the symptom is slowness or a "nonsensical" deadlock between two unrelated modules, because they share an interned/cached object. Avoid it with {{private final Object lock = new Object()}}.
- **Reassigning the field used as the lock**: two threads then lock two different objects and mutual exclusion is lost. Avoid it: the lock is always a final field.
- **Using synchronized to prevent duplicates across pods**: one lock per JVM, so duplicates still happen. Avoid it: a conditional UPDATE, a unique constraint, or a lock in the DB.

### One-minute spoken answer
"synchronized always locks one specific object: an instance method locks this, a static method locks the Class object, and a block locks the object I name. Two threads block each other only when they lock the same object, so static synchronized and instance synchronized of the same class can run in parallel, and two different instances do not block each other either. The usual bug is using instance synchronized to protect a static field: as soon as there are two instances you get duplicate data. My rule is that the lock must have the same scope as the data, I use a private final Object as the lock, I never lock on a String or an Integer, and I remember that synchronized only works inside one JVM, so with several pods I must lock in the DB."

> Senior tip: when I see synchronized on a public method of a Spring bean, I ask two questions: where does the protected data live, and how many instances does the service run? If the data is in the DB, the JVM lock is meaningless with several pods; if the data is a static field, locking this is the wrong scope. Those two questions catch most synchronization bugs in business code.`,
    follow: [
      `Why should you not synchronize on a String literal or an Integer?`,
      `Is synchronized reentrant, and when does that matter?`
    ]
  },
  'concurrency-025': {
    q: `{{count++}} produces wrong results when run from multiple threads: why? List the ways to fix it within one JVM, and when the service runs multiple instances (stock deduction, counting voucher usage), what do you do with the DB or Redis?`,
    a: `**Summary:** {{count++}} consists of three steps — read, add, write — and is not atomic. Two threads reading the same old value means one increment is lost (lost update). {{volatile}} does not fix it because it only guarantees visibility. Within one JVM you can use {{synchronized}}/Lock, {{AtomicInteger.incrementAndGet()}} (CAS), or {{LongAdder}} when writes are frequent and reads rare. Once you run multiple instances, every lock inside the JVM is useless: you must bring the check and the update to the place that stores the data, such as a conditional {{UPDATE}} in the DB, optimistic locking with a version, {{SELECT ... FOR UPDATE}}, or {{DECR}}/a Lua script on Redis.

### Quick intuition
{{count++}} is like two cashiers updating the same stock ledger: both see "5 left", each sells one item, and both write "4". Two items were sold but the ledger only dropped by one. On one machine (one JVM) you can make everyone queue for the ledger (a lock) or use an "automatic counter" (Atomic). But when three shops (three pods) share one warehouse, each shop having its own lock is no help at all: **the warehouse itself** (DB/Redis) must do the "check stock, then subtract" as a single step.

### Terms
- **Race condition**: the result depends on the random order in which threads happen to run.
- **Lost update**: two updates overlap and one of them is lost.
- **Read-modify-write**: read, compute, write — not atomic unless something protects it.
- **Check-then-act**: check a condition, then act; wrong if the condition changes between the two steps.
- **Optimistic locking**: do not lock up front; check the version when writing, and retry on conflict.
- **Pessimistic locking**: lock the row before reading ({{SELECT ... FOR UPDATE}}) so others wait.
- **Lua script (Redis)**: a script Redis runs atomically on the server.
- **Fencing token**: an increasing number carried with a distributed lock that lets storage reject a write from a lock holder whose lease already expired.

### Why it is wrong
~~~text
count = 5
Thread A: read 5            Thread B: read 5
Thread A: 5 + 1 = 6        Thread B: 5 + 1 = 6
Thread A: write 6            Thread B: write 6      -> one increment lost
~~~
For a single field the bytecode is {{getfield}}, {{iconst_1}}, {{iadd}}, {{putfield}}; another thread can slip in between these instructions.

~~~java
static int count = 0;
public static void main(String[] args) throws InterruptedException {
    Runnable r = () -> { for (int i = 0; i < 100_000; i++) count++; };
    Thread a = new Thread(r), b = new Thread(r);
    a.start(); b.start(); a.join(); b.join();
    System.out.println(count);   // usually less than 200000, and different on every run
}
~~~

### Fix within one JVM
| Approach | Mechanism | When to use |
|---|---|---|
| synchronized / ReentrantLock | Mutual exclusion | Updating several variables at once, where constraints between them must hold |
| AtomicInteger / AtomicLong | CAS, retry on conflict | One variable where you need the exact value right away (generating a sequence number) |
| LongAdder | Each thread adds to its own cell, sum() on read | A counter metric written very often and read rarely |
| No sharing | Each thread counts on its own, then merge | Parallel batch processing |

Check-then-act trap: {{if (stock.get() > 0) stock.decrementAndGet()}} is still wrong even with Atomic, because two threads can both see 1 and both decrement. You must merge the check and the update into one atomic operation:
~~~java
boolean tryReserve(AtomicInteger stock) {
    while (true) {
        int cur = stock.get();
        if (cur <= 0) return false;                          // out of stock
        if (stock.compareAndSet(cur, cur - 1)) return true;  // succeeds only if nobody changed it
    }
}
~~~

### Multiple instances: move atomicity into the data store
**1. Conditional UPDATE**, the simplest and fastest:
~~~sql
UPDATE voucher
SET used = used + 1
WHERE code = 'TET2026' AND used < max_uses;
-- affected rows = 1: used successfully; = 0: no uses left
~~~
The DB locks the row while it runs the UPDATE. Under READ COMMITTED (the PostgreSQL default) and with MySQL's InnoDB, the WHERE condition is re-checked against the newest version of the row, so max_uses cannot be exceeded. Under PostgreSQL's REPEATABLE READ, the later transaction gets a serialization error and must retry.

**2. Optimistic locking**: JPA's {{@Version}} generates {{UPDATE ... WHERE id = ? AND version = ?}}; a conflict throws {{OptimisticLockException}} and you retry a few times. It suits rare conflicts; for a flash sale, thousands of requests fighting over one row will retry in a stampede.

**3. Pessimistic lock**: {{SELECT ... FOR UPDATE}} inside a transaction (JPA {{PESSIMISTIC_WRITE}}) when you must read, compute something complicated, and only then write. Keep the transaction very short.

**4. Redis**, when the write volume outgrows the DB:
- {{INCR}}/{{DECR}} are atomic because Redis executes commands sequentially.
- The check plus the decrement must live in one Lua script (also atomic). Do not {{GET}} and then {{DECR}} from the app; that is check-then-act again.
~~~text
-- KEYS[1] = stock:sku123
local s = tonumber(redis.call('GET', KEYS[1]) or '0')
if s > 0 then redis.call('DECR', KEYS[1]) return 1 end
return 0
~~~
- Redis is only a place-holder counter; the real orders still go to the DB (through a queue), and you need a reconciliation job because Redis can lose data on failover.

**5. Distributed lock** (Redisson; ShedLock for scheduled jobs): use it only when the operation cannot be expressed as a single atomic action. A lock with a TTL can expire during a long GC pause, so you still need a fencing token or a condition inside the DB write.

### Common wrong answers
- "Just add volatile and it is fixed": volatile does not make count++ atomic.
- "Use synchronized inside the service": 3 pods means 3 independent locks.
- "Read the stock up, check it in Java, then UPDATE qty with the new value": a lost update between instances.

### Common mistakes
- **Read up, check in Java, then UPDATE with a new value** ({{SET qty = 4}}): the symptom is selling more than the stock during a flash sale. Avoid it: {{SET qty = qty - 1 WHERE qty > 0}} and check the affected rows.
- **Optimistic locking on a very hot row**: the symptom is a flood of OptimisticLockExceptions, retries piling up, and the DB under even more load. Avoid it: a conditional UPDATE, or reserve capacity in Redis.
- **GET then DECR on Redis from the app**: still check-then-act, so vouchers get used more times than allowed. Avoid it: one Lua script, or DECR and then check for a negative result and give it back.
- **A distributed lock without fencing**: a long GC pause lets the lock expire and two instances write at once. Avoid it: a fencing token or a version condition inside the DB write.

### One-minute spoken answer
"count++ is three steps, read, add and write, so it is not atomic: two threads both read 5, both write 6, and one increment is lost; volatile does not help because it only handles visibility. Inside one JVM I use AtomicInteger when the value must be exact, LongAdder for heavily written metrics, or a lock when several variables must change together; and I am careful with check-then-act, merging the check and the decrement into a single CAS. With multiple instances the JVM lock is useless, so I move atomicity into the DB: a conditional UPDATE such as used less than max_uses and then look at the affected rows; optimistic locking when conflicts are rare, SELECT FOR UPDATE when the logic is complex. Only when one row becomes too hot do I move the reservation to Redis Lua with a reconciliation job."

> Senior tip: for stock deduction or voucher problems I always start with a conditional UPDATE and check the affected rows: one SQL statement, no distributed lock, absolutely correct. Only when I measure a single "hot" row choking the DB (thousands of requests per second to the same SKU) do I move the reservation up to Redis Lua, with a reconciliation job against the DB.`,
    follow: [
      `Why is check-then-act still wrong even when you use AtomicInteger?`,
      `Optimistic locking vs conditional UPDATE: which one for a flash sale?`,
      `A distributed lock with a TTL expires halfway through because of a GC pause — how do you guard against that?`
    ]
  },
  'concurrency-026': {
    q: `How are livelock and starvation different from deadlock? Give a real example, how to detect each, and when do you use a fair lock ({{new ReentrantLock(true)}}) — what does it cost?`,
    a: `**Summary:** Deadlock: the threads **stand still** waiting for each other forever, CPU close to 0. Livelock: the threads **keep running**, continuously reacting to each other (back off, then retry) but nobody makes progress; CPU is high while throughput is 0. Starvation: the system still makes progress, but **some** threads are never served because they are always overtaken. A fair lock hands the lock out in waiting order (FIFO), so it prevents starvation, but throughput drops noticeably because you lose the ability to "cut in" and every handover must wake a sleeping thread. Use it only once you have actually measured starvation.

### Quick intuition
- **Deadlock** is like two cars facing each other on a one-lane bridge: both stand still, nobody backs up.
- **Livelock** is like two polite people making way for each other in a narrow corridor: both step left, then both step right, forever — very busy, and nobody gets through.
- **Starvation** is like standing in a queue where the guard's friends keep pushing in front of you: the queue keeps moving, only you never reach the front.
- **A fair lock** is a numbered-ticket counter: perfectly fair, but every time a number is called the person must walk from their seat to the counter, so fewer customers are served per hour.

### Terms
- **Livelock**: threads keep changing state in reaction to each other but none of them finishes its work.
- **Starvation**: a thread never (or only after a very long time) gets the resource it needs.
- **Fair lock**: a lock that grants ownership in waiting order (FIFO).
- **Barging**: a thread that has just arrived takes the lock immediately, skipping the threads already queued — the behaviour of a non-fair lock.
- **Backoff / jitter**: waiting a while before retrying / adding a random extra delay so the parties drift out of phase.
- **Retry storm**: a huge number of clients retrying at the same moment, making an already overloaded system even more overloaded.
- **Bulkhead**: splitting resources (pools, queues) by group so one group cannot starve another.
- **Circuit breaker**: temporarily stopping calls to a failing dependency so it has time to recover.

### Why a non-fair lock is faster (step by step)
1. Thread A releases the lock. In the wait queue, B is asleep (parked).
2. **Non-fair**: C is already running on the CPU and calls lock() right then -> the CAS succeeds immediately and C finishes its work in a few microseconds. B is woken later and may still get the lock when C releases it.
3. **Fair**: C is forced to queue behind B. The JVM must unpark B and wait for the OS to schedule it (typically microseconds up to tens of microseconds) — during that time the lock sits idle, used by nobody.
4. Why it matters: under high contention that "lock sits idle" window repeats at every handover, so the overall throughput of a fair lock can be much lower.

~~~text
Non-fair: A releases --> C (already running) takes it at once --> C releases --> B (just woken) takes it
Fair:     A releases --> [waiting to wake B ... lock idle] --> B takes it --> C must queue behind
~~~

| | Deadlock | Livelock | Starvation |
|---|---|---|---|
| Thread state | BLOCKED/WAITING forever | RUNNABLE, looping | Some wait a very long time, others run normally |
| CPU | Low | High | Normal |
| System making progress? | No (for the affected threads) | No | Yes, but unfairly |
| Thread dump | The JVM reports "Found one Java-level deadlock" | The stack changes between dumps but keeps going round a retry loop | One thread waits on the same lock across many dumps while others still get it |
| Fix | Fixed lock order, tryLock with a timeout | Random backoff, clear role separation | Fair lock, limits, separate queues |

### Livelock: example
~~~java
// Two threads transfer money in opposite directions and "politely" release the lock when the second one is unavailable
while (true) {
    if (from.lock.tryLock()) {
        try {
            if (to.lock.tryLock()) {
                try { move(from, to, amt); return; }
                finally { to.lock.unlock(); }
            }
        } finally { from.lock.unlock(); }
    }
    // No backoff: the two threads may stay out of phase forever, taking and releasing together, retrying together
}
~~~
Fix: add a random backoff ({{Thread.sleep(ThreadLocalRandom.current().nextInt(1, 10))}}) so the two sides drift out of phase and one of them can take both locks; or better, always lock in a fixed id order.

In distributed systems livelock is even more common: two consumers retry a message immediately after an optimistic-lock conflict; thousands of clients retry after a timeout (a retry storm) and keep the system busy with retries instead of real work. Fix it with exponential backoff plus jitter.

### Starvation
- {{ReentrantLock()}} is **non-fair** by default: a thread that has just arrived can cut in and take the lock the moment it is released, ahead of threads already queued, because a thread already running on the CPU is much faster than waking a sleeping one. High throughput, but in theory one thread can lose forever.
- {{synchronized}} has no fair option.
- ReadWriteLock: a continuous stream of readers can make writers wait a very long time. {{ReentrantReadWriteLock}} in non-fair mode has a mechanism that reduces this (a new reader must yield when a writer is at the head of the queue) but does not guarantee it absolutely.
- Thread priority ({{setPriority}}) is almost ignored on Linux; do not rely on it.
- Beyond locks: a thread pool can be taken over by long tasks so short tasks wait forever; one tenant sending a huge volume of requests can eat the pool meant for the others. Fix it by splitting pools (bulkhead) and setting per-tenant limits.

### Fair lock
~~~java
ReentrantLock fair = new ReentrantLock(true);   // grants the lock in queue order
Semaphore permits = new Semaphore(10, true);     // fair semaphore
~~~
- The price: every release must wake exactly the thread at the head of the queue and wait for it to be scheduled. The Javadoc states plainly that overall throughput is usually lower, sometimes much lower under high contention.
- Fairness only applies to the order of lock acquisition; it does not guarantee fair CPU scheduling. {{tryLock()}} without a timeout still barges in, even with a fair lock.
- Use it when the order of service has business meaning, or when tail latency matters more than throughput, and the numbers show starvation.

### Common wrong answers
- "Livelock is a mild deadlock": the opposite — livelock burns CPU and is harder to spot because every thread looks busy.
- "Always use a fair lock to be safe": you pay in throughput without fixing the root cause (holding the lock too long).

### Common mistakes
- **tryLock + retry with no backoff**: the symptom is high CPU while a money transfer in the opposite direction never finishes. Avoid it: lock in id order, or use a random backoff.
- **Retrying immediately when a client times out**: the symptom is that after a small incident traffic grows 3–4 times and the system collapses completely. Avoid it: exponential backoff + jitter, a retry cap, a circuit breaker.
- **One shared pool for every kind of work**: a heavy report takes all the threads and the short payment API starves. Avoid it: bulkhead, one pool/semaphore per kind of work.
- **Turning on a fair lock "to be sure"**: throughput drops sharply while the real problem (holding the lock too long) remains. Avoid it: shorten the critical section first, measure, and only then consider fairness.

### One-minute spoken answer
"Deadlock is threads standing still waiting for each other forever, with low CPU, and the JVM can detect it in a thread dump. Livelock is threads still running, continuously releasing and retrying in response to each other, with high CPU and nobody making progress; for example two opposite money transfers using tryLock without backoff, or a retry storm in a distributed system. Starvation is a system that still runs but some threads never reach the front, for example because of a non-fair lock or one tenant eating the whole pool. A fair lock hands the lock out in waiting order, so it prevents starvation, but you lose barging and every handover has to wake a sleeping thread, so throughput drops noticeably. I only use it when I have measured real starvation, after trying to shorten the time the lock is held."

> Senior tip: the livelock I run into most is not in Java code but in the retry policy: the client times out after 1 second and retries 3 times immediately, so a service that is already slow from overload gets even more overloaded. Exponential backoff with jitter plus a circuit breaker is the "fair lock" of distributed systems. Starvation inside the JVM usually shows up as a p99.9 spike for one group of requests; then I try shortening the lock hold time first, and a fair lock is the last choice.`,
    follow: [
      `Why does a non-fair lock give higher throughput than a fair lock?`,
      `Is a retry storm a livelock? How do you design retries to avoid it?`
    ]
  },
  'concurrency-027': {
    q: `Write a thread-safe singleton using eager, lazy holder and enum, then compare them. How can a singleton be broken by reflection, serialization, clone or multiple class loaders, and which approach prevents that?`,
    a: `**Summary:** There are three approaches worth using: **eager** (a {{static final}} field initialized when the class is initialized), **holder idiom** (lazy, thanks to a nested class that is only initialized on first access) and **enum** (the JVM guarantees exactly one instance and blocks reflection and serialization with no extra work). All three are thread-safe thanks to the JVM lock taken during class initialization (JLS 12.4.2), with no volatile or synchronized needed. A singleton can be broken by: reflection calling the private constructor, deserialization creating a new object, {{clone()}} if the class is Cloneable, and each class loader having its own copy of the class. Enum blocks reflection and serialization; the class loader problem cannot be blocked in code at all.

### Quick intuition
A singleton is like a company seal: the whole company is allowed to have exactly one. **Eager** is engraving the seal the moment the company is founded. **Holder** is engraving it only when someone needs to stamp for the first time, with a procedure that guarantees only one seal is made even if 10 people ask at once. **Enum** is a seal issued by the government: nobody can forge it (reflection) and nobody can photocopy it into a new seal (serialization). "Multiple class loaders" is like a company with several independent branches: each branch engraves its own seal, and no rule in the code can prevent that.

### Terms
- **Eager initialization**: create the instance as soon as the class is initialized.
- **Lazy initialization**: create the instance only on first access.
- **Holder idiom**: use a static nested class so the JVM initializes it lazily and thread-safely.
- **Class initialization lock**: the JVM lock that makes the static initializer run exactly once (JLS 12.4.2).
- **Reflection**: an API that can call private constructors and methods at runtime.
- **readResolve**: a special serialization method that replaces the object just read with another object.
- **ClassLoader**: the component that loads classes; the same class file loaded by two loaders gives two different classes.
- **ExceptionInInitializerError**: the error thrown when the static initializer itself throws.

### Class initialization lifecycle (why no lock is needed)
1. The first thread calls {{CoreBankClient.get()}} -> the JVM sees that class {{Holder}} is not initialized yet.
2. That thread takes Holder's initialization lock and runs {{static final I = new CoreBankClient()}}.
3. Another thread calls get() at the same time -> it sees Holder is being initialized -> it **waits**.
4. Initialization finishes -> the JVM marks the class "initialized" and wakes the waiting threads; the result is safely published (there is a happens-before edge).
5. Later calls -> the class is already initialized, so the field is read normally with no locking cost at all.

~~~text
T1: get() -> Holder not initialized yet -> takes the init lock -> new CoreBankClient() -> done, releases the lock
T2: get() -> Holder is being initialized by T1 -> waits .................... -> gets the same instance
T3: get() (later) -> Holder already initialized -> returns immediately, no lock
~~~

### Three approaches
~~~java
// 1. Eager: the simplest
public final class FeeTable {
    private static final FeeTable INSTANCE = new FeeTable();
    private FeeTable() { }
    public static FeeTable get() { return INSTANCE; }
}

// 2. Holder: created only when get() is called the first time
public final class CoreBankClient {
    private CoreBankClient() { }
    private static class Holder { static final CoreBankClient I = new CoreBankClient(); }
    public static CoreBankClient get() { return Holder.I; }
}

// 3. Enum
public enum IdGenerator {
    INSTANCE;
    private final AtomicLong seq = new AtomicLong();
    public long next() { return seq.incrementAndGet(); }
}
~~~

| | Lazy? | Thread-safe thanks to | Blocks reflection | Blocks serialization | Notes |
|---|---|---|---|---|---|
| Eager | At class initialization time | Class init lock | No (must check yourself) | Needs readResolve | Good enough in most cases |
| Holder | Yes | Holder's class init lock | No (must check yourself) | Needs readResolve | Lazy without paying for synchronized |
| DCL + volatile | Yes | volatile + synchronized | No | Needs readResolve | Verbose, easy to get wrong |
| Enum | At class initialization time | The enum specification | Yes | Yes | Cannot extend another class |

"Eager" is in fact lazy at the class level: the class is only initialized on first access (calling get(), reading a non-constant static field). It is only truly "early" when some other static method of the class is called first.

### Why it is thread-safe without a lock
The JVM guarantees that the static initialization of a class runs **exactly once**; any thread that wants to use the class must wait until initialization finishes, and the initialization result is safely published to every thread. Holder exploits the fact that the nested class {{Holder}} is only initialized when {{Holder.I}} is read for the first time.

Pitfall: if the constructor throws, the class falls into an error state. The first time you see {{ExceptionInInitializerError}}, later attempts give {{NoClassDefFoundError}}, and it never retries until the JVM restarts. Do not call the network or the database inside a singleton's constructor.

### Breaking and preventing
**Reflection**
~~~java
Constructor<FeeTable> c = FeeTable.class.getDeclaredConstructor();
c.setAccessible(true);
FeeTable other = c.newInstance();      // a second instance
~~~
- Partial defense: inside the constructor, if {{INSTANCE != null}} throw {{IllegalStateException}}.
- Enum: every attempt to create an enum instance through reflection is blocked; {{newInstance}} throws {{IllegalArgumentException}} ("Cannot reflectively create enum objects").
- If the class is in a named module that does not open its package, {{setAccessible(true)}} throws {{InaccessibleObjectException}}.

**Serialization**
~~~java
public final class FeeTable implements Serializable {
    // ...
    private Object readResolve() { return INSTANCE; }  // replace the deserialized object with the real instance
}
~~~
Without {{readResolve}}, every deserialization creates a new object. Enum is serialized by name and always returns the existing constant.

**Clone**: only a problem when the class (or a parent) implements Cloneable. Do not implement it, or override {{clone()}} to throw {{CloneNotSupportedException}}.

**Multiple class loaders**: a "singleton" is really one instance per (class, class loader) pair. An app server running several webapps, a plugin system, or Spring Boot DevTools restarting the class loader all create several copies. It cannot be blocked in code; put the class in a shared loader or drop the static singleton.

### Inside a Spring application
Singleton bean scope means "one instance per ApplicationContext", managed by the container: it is testable (mock it, replace the bean) and holds no global static state. A hand-written static singleton should be reserved for things that truly do not depend on the container (constant tables, utilities).

### Common mistakes
- **A singleton constructor that calls the DB/network**: one failure breaks the class permanently (ExceptionInInitializerError, then NoClassDefFoundError) until a restart. Avoid it: keep initialization light, connect lazily inside methods, add retries.
- **A Serializable singleton without readResolve**: after deserialization (distributed cache, session replication) you have two instances with diverging state. Avoid it: readResolve, or use an enum.
- **A static singleton holding mutable state inside a Spring application**: tests are hard to mock and parallel tests interfere with each other. Avoid it: use a Spring singleton bean.
- **Two instances because DevTools/app servers use several class loaders**: the "global" cache is duplicated and configuration diverges. Avoid it: put the class in a shared loader or drop the static singleton.

### One-minute spoken answer
"I use three approaches: eager with static final, holder idiom when lazy is needed, and enum when I need protection against breaking. All three are thread-safe because the JVM guarantees the class initialization runs exactly once under a lock and is safely published, so no volatile or synchronized is required. A singleton can be broken by reflection calling the private constructor, by deserialization creating a new object, by clone if the class is Cloneable, and by multiple class loaders. Enum blocks reflection and serialization; for an ordinary class I check inside the constructor and add readResolve; the class loader problem cannot be blocked in code. A practical note: if the constructor throws, the class stays broken until a restart, and in Spring I let the container manage the singleton instead of writing my own."

> Senior tip: in an interview I answer briefly: "enum if I must block reflection and serialization, holder if I need laziness, and in Spring I never write my own singleton". Interviewers often follow up on ExceptionInInitializerError; knowing that a class whose initialization failed is "permanently broken" until a restart shows you have actually debugged this in production.`,
    follow: [
      `Why can an enum singleton not be broken by reflection?`,
      `What happens on later calls if the singleton's constructor throws an exception?`,
      `How is a Spring singleton bean different from the singleton pattern?`
    ]
  },
  'jvm-019': {
    q: `How are JDK, JRE and JVM different? Describe the path from a {{.java}} file to code running at native speed: javac, bytecode, class loading, verify, interpreter, JIT.`,
    a: `**Summary:** The JVM is the virtual machine that executes bytecode (HotSpot is the most common implementation). JRE = JVM + standard library, enough to run a program. JDK = JRE + development tools ({{javac}}, {{jar}}, {{jlink}}, {{jcmd}}, {{jfr}}...). Since Java 11, Oracle no longer ships a separate JRE (some vendors such as Eclipse Temurin still offer a JRE package); usually you use the JDK or build a minimal runtime with {{jlink}}. The path: {{javac}} compiles .java into platform-independent bytecode (.class) -> the class loader loads, verifies, links and initializes the class when it is needed -> the interpreter runs the bytecode -> hot methods are JIT-compiled (C1 then C2) into machine code that replaces them.

### Quick intuition
Imagine writing a recipe in a "common kitchen language" (bytecode) instead of the language of each country. The **JVM** is a cook who can read that common language in any kitchen (Linux, Windows, ARM). The **JRE** is that cook plus a basic set of tools (the standard library) — enough to cook. The **JDK** is all of that plus the tools for the person writing recipes (javac to translate, jcmd/jstack to inspect the kitchen). At first the cook reads the recipe line by line (interpreter); any dish cooked many times he memorizes and makes very fast (JIT).

### Terms
- **Bytecode**: the intermediate instruction set inside a .class file, independent of OS and CPU.
- **Constant pool**: the table of constants and reference names (classes, methods, fields) inside a .class file.
- **Class loader**: the component that finds and loads .class files into the JVM.
- **Verify**: the step that checks the bytecode is valid and does not break type safety.
- **Interpreter**: runs bytecode one instruction at a time.
- **JIT (C1/C2)**: compiles hot methods into machine code at runtime.
- **Deoptimization**: discarding optimized machine code when an assumption turns out to be wrong, falling back to the interpreter.
- **jlink**: the tool that builds a minimal Java runtime containing only the modules you need.

### Three concepts
| | Contains | Used for |
|---|---|---|
| JVM | Class loader, execution engine (interpreter + JIT), GC, runtime memory areas | Running bytecode |
| JRE | JVM + standard library (java.base, java.sql...) | Running applications |
| JDK | JRE + javac, jar, javadoc, jlink, jcmd, jstack, jfr... | Development, packaging, diagnostics |

"Java" is a specification (JLS for the language, JVMS for the virtual machine). HotSpot and OpenJ9 are JVM implementations; Temurin, Corretto and Zulu are OpenJDK distributions.

### The path
~~~text
Fee.java --javac--> Fee.class (bytecode + constant pool)
   |
   v   the first time code needs class Fee
Loading        : class loader finds and reads the bytes (delegation: app -> platform -> boot)
Linking        : verify (bytecode valid, type-safe)
                 -> prepare (allocate space for statics, assign default values)
                 -> resolve (turn name-based references into real references, usually lazily)
Initialization : run the static initializer, exactly once
   |
   v
Interpreter runs the bytecode, counting method calls and loop iterations
   |   hot method
   v
C1 (fast compile with profiling) -> C2 (strong optimization from the profile: inlining, escape analysis)
   |   assumption broken (a new class is loaded, a branch that "never runs" starts running)
   v
Deoptimization: back to the interpreter, then compile again
~~~

### Why the two-tier design
- Bytecode makes "write once, run anywhere" work: the same .class runs on Linux x64 and on ARM Graviton.
- The interpreter starts immediately without compiling the whole program; the JIT only spends effort on the small part of the code that is genuinely hot.
- The JIT knows **the actual runtime data** (which types are really passed in, which branches run often), so in many cases it optimizes more aggressively than static compilation. Example: inlining an interface call when only one implementation ever exists in practice.
- The price is warm-up: latency is higher than normal for the first few minutes after a deploy.

### javac does less than you think
javac barely optimizes at all: it folds compile-time constants and drops branches such as {{if (false)}}. Generics are erased; a lambda compiles to {{invokedynamic}}; string concatenation since Java 9 also uses {{invokedynamic}} ({{StringConcatFactory}}). The real optimization lives in the JIT. Inspect bytecode with {{javap -c -p Fee.class}}.

### Observing the process
~~~bash
java -Xlog:class+load=info -jar app.jar      # which classes are loaded, and from where
java -XX:+PrintCompilation -jar app.jar      # which methods are JIT-compiled, at which tier
jcmd <pid> Compiler.codecache                # current code cache usage
~~~

### Common wrong answers
- "Java is an interpreted language": it is a hybrid — interpreted first, then JIT-compiled on the hot parts.
- "The JIT compiles the whole program at startup": only methods that cross the threshold are compiled.
- "All classes are loaded at startup": classes are loaded lazily, the first time they are needed.
- "A server needs a JRE installed": modern images use the JDK or a runtime built with jlink.

### Common mistakes
- **A Docker image that uses the full JDK in production**: a large image with many tools you never use. Avoid it: use a vendor's JRE image or build a runtime with {{jlink}}; remember to keep {{jcmd}} if you need diagnostics.
- **Compiling with a new JDK but running on an old JRE**: {{UnsupportedClassVersionError}}. Avoid it: set {{--release}} to the runtime version.
- **NoClassDefFoundError that only appears on a rare branch**: the dependency is missing but the tests never reach that code. Avoid it: check dependency scopes and test the error branches too.
- **Judging performance right after a deploy**: the numbers look bad because the JIT is not warm. Avoid it: measure after a few minutes, or warm up before taking traffic.

### One-minute spoken answer
"The JVM is the virtual machine that runs bytecode, the JRE is the JVM plus the standard library for running applications, and the JDK is the JRE plus tools like javac, jar, jlink and jcmd. The path is: javac compiles the java file into bytecode, and the first time the code needs a class, the class loader loads it, the JVM verifies, prepares, resolves and then runs the static initializer. Bytecode first runs in the interpreter; hot methods are compiled quickly by C1 with profiling, then strongly optimized by C2; if an assumption breaks, the code is deoptimized. The trade-off of the two-tier design is fast startup and optimization based on real data, paid for with warm-up. In practice this explains why p99 is high for a few minutes after a deploy and why images built with jlink are much smaller."

> Senior tip: understanding this path explains many production phenomena: a p99 spike after every deploy (the JIT is not warm, so warm up before taking traffic); {{NoClassDefFoundError}} that only appears when a rare branch runs (classes are loaded lazily); and why an image built with {{jlink}} containing exactly the modules you need is significantly smaller than a full JDK.`,
    follow: [
      `When does deoptimization happen and how does it affect latency?`,
      `How are ClassNotFoundException and NoClassDefFoundError different?`,
      `How does jlink help when packaging a Docker image?`
    ]
  },
  'jvm-020': {
    q: `How does the GC decide that an object is "garbage"? What belongs to the GC roots, why does the JVM not use reference counting, and why does Java have a GC yet still suffer memory leaks?`,
    a: `**Summary:** HotSpot uses **reachability analysis** (tracing): it starts from the set of GC roots and follows every strong reference to mark the live objects. An object no root can reach is garbage, even if those objects still point at each other. GC roots include: local variables and parameters in the frames of living threads, static fields of loaded classes (through the class loader), JNI references, monitors currently held, and internal JVM references. The JVM does not use reference counting because it cannot collect reference cycles (A points to B, B points to A) and because updating the counter on every assignment is expensive (and must be atomic under multithreading). A leak in Java means an object **is still reachable** but is no longer used: the GC cannot know your intention.

### Quick intuition
Think of the heap as a fairground and the GC as the organizers doing the closing-time round. They start from the **official entrances** (GC roots: running threads, static fields) and walk along every rope connecting the stalls. A stall **you can reach** is still in business; a stall no path leads to is torn down, even if two abandoned stalls are roped to each other. A leak happens when you forget to untie the rope from an official entrance to a stall nobody uses any more: the organizers can still reach it, so they do not tear it down.

### Terms
- **Reachability analysis (tracing)**: marking live objects by walking references from the GC roots.
- **GC roots**: the set of starting points that are definitely alive: variables on thread stacks, static fields, JNI references, held monitors.
- **Reference counting**: a memory-management scheme that counts references to each object and frees it when the count reaches 0.
- **Mark / sweep / compact / copy**: mark live objects / clear the gaps / move objects together / copy live objects into a new area.
- **Card table / remembered set**: structures that record references from old to young (or between regions) so the collector does not have to scan the whole heap.
- **Write barrier**: a small piece of code the JIT inserts on every reference assignment to update those structures.
- **SATB / load barrier**: techniques that let the GC mark concurrently without missing an object (G1 / ZGC).
- **reachabilityFence**: an API that keeps an object alive up to a point in the code, stopping the JIT from treating it as dead too early.

### Reachability
~~~text
GC roots
 +-- stack of thread "http-nio-8080-exec-3": local variable order -> Order -> List<Item>
 +-- static field CustomerCache.MAP -> HashMap -> ... -> Customer      (still alive)
 +-- ...

 Session A <--> Session B    (point at each other but no root reaches them) => garbage, collected
~~~
- The general steps: **mark** from the roots, then **sweep / compact / copy** depending on the collector. A young GC only scans the young generation, but it must treat references from the old generation into the young generation as extra roots. Those references are tracked in the card table / remembered set and updated through the write barrier.
- Concurrent collectors (G1 marking, ZGC) mark while the application is still running, so they need barriers to avoid missing an object that was just reassigned (SATB in G1, load barrier in ZGC).

### Specific GC roots
| Root | Typical leak example |
|---|---|
| Local variable, parameter on a living thread's stack | A worker holding a large list inside an infinite loop |
| Static field | An unbounded static Map used as a cache |
| A living thread (together with its ThreadLocalMap) | A ThreadLocal not removed in a thread pool |
| Class loader and loaded classes | An old class loader still held after a redeploy |
| JNI global reference | A native library holding an object |
| A monitor currently held | Rare |

### Why not reference counting
1. **Reference cycles**: Order and Customer pointing at each other means the counter never reaches 0 and becomes a leak. CPython needs a separate cycle collector for exactly this reason.
2. **Cost on every assignment**: the counter must be incremented/decremented on every assignment and parameter pass; under multithreading it must be atomic, which is slow and causes cache-line contention.
3. **Cascading deallocation**: when the last reference to a large structure disappears, millions of objects are freed right there on the running thread, causing an uncontrollable pause.

Tracing is the opposite: cost is proportional to the number of **live** objects (for copying collectors). Lots of garbage and few live objects is very cheap, which matches the fact that most objects die young.

### Finalize and weak references
- Objects with {{finalize()}} must go through an extra round (they are queued for the finalizer and temporarily "revived"), so they are reclaimed later. finalize is deprecated for removal (JEP 421, JDK 18).
- Soft/Weak/Phantom references do not keep an object alive the way a strong reference does; the GC handles them by separate rules.

### Why leaks still happen
~~~java
public class AuditService {
    private static final Map<String, List<Event>> PENDING = new ConcurrentHashMap<>();

    public void record(String txId, Event e) {
        PENDING.computeIfAbsent(txId, k -> new CopyOnWriteArrayList<>()).add(e);
        // forgot to remove when the transaction completes -> every Event stays reachable from the static field
    }
}
~~~
How to find it: take a heap dump and use Path to GC Roots in MAT on the suspected object; the holding chain usually looks like static field -> map -> entry -> object.

### Common wrong answers
- "Setting null collects the object immediately": setting null only cuts one reference. The object dies only when no path from any root remains, and only at the next GC.
- "A local variable that is still in scope means the object is alive": the JIT may treat a variable that is no longer used as dead, so the object can be collected earlier than you think. That is why {{Reference.reachabilityFence}} exists.
- "System.gc() frees memory immediately": it is only a hint (it can be disabled with {{-XX:+DisableExplicitGC}}), and with G1 it triggers a full GC by default.
- "Objects that point at each other in a cycle are never collected": true for reference counting, false for the JVM.

### Common mistakes
- **A static Map used as a scratchpad with no removal**: the old generation grows steadily over days. Avoid it: remove in a finally block, or use a bounded cache with a TTL.
- **A ThreadLocal not removed in a thread pool**: old request data lives on along with the thread. Avoid it: {{remove()}} in a finally block.
- **Setting null everywhere to "help the GC"**: the code gets messy and the real leak stays. Avoid it: find the root that holds the object with MAT instead of guessing.
- **Calling System.gc() to free memory**: with G1 it causes a long Full GC. Avoid it: remove the call, or use {{-XX:+ExplicitGCInvokesConcurrent}}.

### One-minute spoken answer
"The JVM identifies garbage by reachability: it starts from the GC roots, which are variables on living threads' stacks, static fields, JNI references and monitors, and walks every strong reference to mark objects; anything unreachable is garbage, even if the objects point at each other in a cycle. The JVM does not use reference counting because it cannot collect cycles, it costs an atomic counter update on every assignment, and it can free objects in cascades that cause pauses. Tracing costs proportionally to the live objects, which fits the fact that most objects die young. A leak in Java means an object is still reachable but no longer used, such as a static map you forgot to clean or a ThreadLocal in a pool. The GC collects what is unreachable, not what you no longer need."

> Senior tip: when I explain a leak to the team, I always point at the **root** taken from MAT, usually a static field, a thread pool's ThreadLocal, or a class loader. The question "we have a GC, why does it still leak" is answered in one sentence: the GC collects what is unreachable, not what you no longer need.`,
    follow: [
      `What problem do the card table / remembered set solve when only the young generation is collected?`,
      `Why does Reference.reachabilityFence exist?`
    ]
  },
  'jvm-021': {
    q: `How do minor GC, major GC and full GC differ? When is an object promoted to the old generation, and on production how do you recognise "too-early promotion" or a full GC from the GC log?`,
    a: `**Summary:** The heap is split into generations based on the hypothesis that "most objects die young". A **minor (young) GC** cleans the young generation (Eden + Survivor) when Eden fills up; it has a stop-the-world pause but is fast because only the few live objects are copied. **Major GC** is the cleaning of the old generation; the term is not standardised, and with G1 it usually means the concurrent marking cycle plus the mixed GC passes. **Full GC** cleans the whole heap (including class unloading) in a single stop-the-world pause; with G1 it is the fallback when the other mechanisms cannot keep up, the pause is long and it signals trouble. An object is promoted when it survives more minor GCs than the tenuring threshold (at most 15), when Survivor has no room for it (early promotion), and very large objects in G1 (humongous) are allocated straight into dedicated regions that belong to the old generation.

### Quick intuition
Splitting the heap into generations is like a hospital splitting its emergency ward from long-stay care. Most emergency patients (new objects) go home very quickly, so the emergency ward is cleaned often and fast (minor GC). Whoever stays longer is moved to long-stay care (the old generation), which is cleaned less often but each cleaning costs more. If the emergency ward is too cramped, patients are moved to long-stay care too early and go home the next day — the long-stay ward is full of empty beds (**too-early promotion**). A full GC is like having to close the whole hospital to rearrange everything: it should rarely happen.

### Terms
- **Generational hypothesis**: the hypothesis that most objects die young, the basis for splitting young/old.
- **Eden / Survivor**: where new objects are born / where objects that survived a young GC are kept (two areas used alternately).
- **Promotion (tenuring)**: moving an object from the young generation to the old one.
- **Tenuring threshold**: the number of young GCs survived before promotion (at most 15).
- **Premature promotion**: medium-lived objects pushed to the old generation early and then dying there.
- **Mixed GC**: a G1 collection that cleans the young generation plus a set of old regions with lots of garbage.
- **IHOP**: the heap occupancy threshold at which G1 starts concurrent marking.
- **Humongous object**: an object of half a G1 region or more, allocated straight into a dedicated region in the old generation.

### Object lifecycle
~~~text
new Order()  -> Eden
Eden full    -> Young GC: live objects are copied to Survivor, age = 1;
                Eden and the old Survivor are cleared
Later        -> live objects are copied back and forth between the two Survivors, age +1
Age reaches the threshold (max 15) or Survivor is full -> promote to Old
Old slowly fills -> G1: concurrent marking once IHOP is exceeded (45% of the heap by default)
                -> mixed GC cleans young + some old regions with lots of garbage
Cannot keep up -> Full GC (stop-the-world, whole heap)
~~~
- The age is stored in 4 bits of the object header, so {{MaxTenuringThreshold}} is at most 15. The effective threshold is adjusted dynamically based on how full Survivor is ({{TargetSurvivorRatio}}, 50% by default).
- In G1, an object half a region or larger is **humongous** and is allocated straight into a dedicated region in the old generation. Continuously creating large byte arrays (reading files, building large responses) is a source of pressure on the old generation.

### Comparison
| | Young | Mixed (G1) | Full |
|---|---|---|---|
| Scope | Eden + Survivor | Young + some old regions with lots of garbage | The entire heap |
| Trigger | Eden full | After concurrent marking | Allocation failure, evacuation failure, System.gc()... |
| Pause | Short (a few ms to a few tens of ms) | Short, within the pause goal | Long, possibly seconds with a large heap |
| Normal? | Yes, happens continuously | Yes | No, needs investigation |

### Too-early promotion
"Medium-lived" objects (a session, a response being built, a batch of 10,000 records) survive 1–2 young GCs, Survivor has no room so they are pushed into the old generation, and they die right after. The old generation fills with garbage, marking and mixed GC run more often, and in serious cases it leads to a full GC.

Usual causes: a very high allocation rate; the young generation too small (for example, setting {{MaxGCPauseMillis}} too low makes G1 shrink the young generation); a batch holding too much data at once.

### Reading the GC log (JDK 17, -Xlog:gc)
~~~text
[12.345s][info][gc] GC(41) Pause Young (Normal) (G1 Evacuation Pause) 1530M->420M(2048M) 18.214ms
[60.101s][info][gc] GC(97) Pause Young (Concurrent Start) (G1 Humongous Allocation) 1720M->980M(2048M) 25.002ms
[75.880s][info][gc] GC(120) Pause Full (G1 Compaction Pause) 2010M->1890M(2048M) 2450.317ms
~~~
- Line 1 is normal: the young GC cleared over 1 GB, leaving 420 MB.
- Line 2: marking was triggered by a humongous allocation, so you need to find who is allocating large arrays.
- Line 3: the full GC took 2.4 seconds but freed only 120 MB, meaning the old generation holds entirely **live** objects. That is a leak or a heap that is too small, not a GC tuning problem.

### Actions
- Look at the age distribution in Survivor with {{-Xlog:gc+age=trace}}.
- Old generation growing day after day after each mixed/full GC: a leak, take a heap dump. Old generation stable but full GCs still happen: the heap is too small or there are humongous allocations; increase the heap, reduce large array allocation, or let G1 start marking earlier.
- Full GC caused by {{System.gc()}} from a library or hand-written code: find and remove the call, or use {{-XX:+ExplicitGCInvokesConcurrent}}.

### Common wrong answers
- "Major GC is exactly full GC": the two terms are often used interchangeably, but with G1 cleaning the old generation is mainly concurrent marking plus mixed GC, not a full GC.
- "Minor GC does not stop the application": it does stop the world, it is just very short.
- "An object must survive 15 GCs to reach the old generation": the threshold changes dynamically, and a full Survivor causes early promotion.

### Common mistakes
- **Setting MaxGCPauseMillis too low**: G1 shrinks the young generation, objects get promoted early and mixed GCs become frequent. Avoid it: keep the 200 ms default unless you have measured otherwise.
- **A batch reading 100,000 records into a List at once**: medium-lived objects overflow Survivor and the old generation swells. Avoid it: process in small chunks and write results out right away.
- **Creating large byte arrays continuously (reading files, building responses)**: the log is full of "G1 Humongous Allocation". Avoid it: stream, and reuse buffers.
- **Increasing the heap when a Full GC frees very little**: that only delays the OOM, because it is a leak. Avoid it: look at the old generation after GC and take a heap dump.

### One-minute spoken answer
"A minor GC cleans the young generation when Eden fills up; it does stop the application but is short because only the few live objects are copied to Survivor. Major GC means cleaning the old generation, a term that is not standardised; with G1 it is concurrent marking plus mixed GC. A full GC cleans the whole heap in one long pause, and on G1 it is the fallback path and a sign of trouble. An object is promoted once it survives the tenuring threshold, at most 15 because the age lives in 4 header bits, or earlier when Survivor is full; humongous objects go straight into the old generation. In the GC log I look at the old generation after GC: a flat line is healthy, a staircase going up is a leak, and a line close to the ceiling means the heap is too small. A Pause Full line that frees very little is my signal to take a heap dump immediately."

> Senior tip: the first metric I look at is not pause time but the **old generation after GC** (the heap left after a mixed/full GC). A flat line means a healthy heap; stepping upward means a leak; flat but close to the ceiling means the heap is too small. Three shapes, three different ways to handle them.`,
    follow: [
      `Why is MaxTenuringThreshold at most 15?`,
      `What is a humongous object in G1 and why does it cause problems?`,
      `When does a full GC happen in G1, and how do you deal with it?`
    ]
  }
});
