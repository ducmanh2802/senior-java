/*
 * English translation of js/data/q-concurrency-jvm.js — task T168, re-translated in T514. Format: js/core/i18n.js (content overlay).
 * ids: concurrency-014 concurrency-015 concurrency-016 concurrency-017 concurrency-018 concurrency-019 concurrency-020 jvm-001
 */
App.i18n.content({
  'concurrency-014': {
    q: 'ForkJoinPool and work stealing: how does it work, and why is a parallel stream sharing commonPool dangerous on a server?',
    a: `**Summary:** ForkJoinPool gives each worker its own deque: a worker pushes and pops its own tasks at one end (LIFO), and an idle worker "steals" from the other end of someone else's deque (FIFO). Thanks to that there is almost no shared lock, which fits divide-and-conquer problems very well. {{ForkJoinPool.commonPool()}} is a static pool shared by the whole JVM; the default parallelism is the number of cores minus one. Parallel streams and the {{*Async}} methods of CompletableFuture called without an executor all run on this pool, so a single blocking piece of code (JDBC, HTTP) is enough to occupy all its few workers and slow down every other feature that shares it.

### Understand quickly
Picture a kitchen with 4 cooks, each with their own stack of dish tickets. Everyone takes work from the **top** of their own stack (the freshest ticket, still "hot"). Whichever cook runs out of work walks over and steals from the **bottom** of someone else's stack — that is usually the biggest ticket, so one steal brings a lot of work. Because they rarely touch the same ticket, the kitchen barely needs a "head chef" handing out work (a shared lock). commonPool, on the other hand, is **the shared kitchen of the whole building**: it only takes one cook standing around waiting for a delivery (I/O) for the whole building to run out of cooks.

### Terms
- **ForkJoinPool**: a thread pool specialised for divide-and-conquer work where each worker keeps its own double-ended queue.
- **Deque (double-ended queue)**: a queue you can add to and take from at both ends.
- **Work stealing**: an idle worker takes a task from another worker's deque.
- **fork / join**: split a child task off to run in parallel / wait for the child task's result.
- **RecursiveTask / RecursiveAction**: a ForkJoinPool task that returns a result / one that does not.
- **commonPool**: the static ForkJoinPool shared by the whole JVM; default parallelism is cores minus one.
- **managedBlock**: the API that tells ForkJoinPool "I am about to block", so the pool may add replacement threads.
- **Parallelism**: the number of workers the pool tries to keep running at the same time.

~~~text
Worker-1 deque: [T8 T5 T1]  <- push/pop at the right end (LIFO, newest, smallest)
                 ^ left end: idle Worker-3 steals T1 (FIFO, oldest, biggest)
Worker-2 deque: [T9 T6]
Worker-3 deque: [ ]  -> picks a random other deque to steal from
~~~

### How work stealing works
1. A task calls {{fork()}}: the child task is pushed onto the deque of the worker currently running.
2. The worker takes work from its own deque in LIFO order: the task just forked is the smallest, and its data is still hot in cache.
3. A worker with nothing to do randomly picks another deque and steals from the opposite end (FIFO). The oldest task is usually the biggest, so a single steal brings a lot of work and the number of steals drops.
4. {{join()}} does not just sit and wait: the worker doing the join runs other tasks (often that very child task, or one it stole). That is why a small pool can still handle deep recursion.

Why do the owner and the thief use different ends? They only collide when the deque is nearly empty, and that spot is handled with CAS instead of a lock.

~~~java
class SumTask extends RecursiveTask<Long> {
    final long[] a; final int lo, hi;
    SumTask(long[] a, int lo, int hi) { this.a = a; this.lo = lo; this.hi = hi; }
    protected Long compute() {
        if (hi - lo <= 10_000) {                    // small enough => compute sequentially
            long s = 0; for (int i = lo; i < hi; i++) s += a[i]; return s;
        }
        int mid = (lo + hi) >>> 1;
        SumTask left = new SumTask(a, lo, mid);
        left.fork();                                 // left half into the deque, can be stolen
        long right = new SumTask(a, mid, hi).compute(); // do the right half myself
        return right + left.join();
    }
}
~~~

### Why commonPool is dangerous on a server
- **Shared by the whole JVM**: parallel streams, {{CompletableFuture.supplyAsync(fn)}} without an executor, {{Arrays.parallelSort}}, and even code inside third-party libraries all compete for a handful of workers.
- **Very small**: a 4-vCPU pod has only 3 workers. On a pod with 2 vCPU or fewer, parallelism is 1; in that case a CompletableFuture async call without an executor creates a brand-new thread per task (unbounded), while a parallel stream is barely parallel at all.
- **Not meant for blocking**: a worker blocked by JDBC/HTTP cannot do anything else. ForkJoinPool only adds replacement threads when code announces it in advance through {{ForkJoinPool.managedBlock}}, and JDBC drivers and HTTP clients do not do that.
- Typical scenario: one API calls {{parallelStream()}} and inside the lambda makes an HTTP call to core banking. At high load the workers get stuck waiting on I/O, every other CompletableFuture async in the service has to queue, and unrelated endpoints time out in a chain reaction.

### Doing it right
| Situation | Approach |
|---|---|
| Many calls in parallel (I/O) | {{supplyAsync(task, ioExecutor)}} with your own bounded ThreadPoolExecutor, or virtual threads (Java 21) |
| CPU-bound divide and conquer | Your own ForkJoinPool with a fixed parallelism |
| Parallel stream | Only for CPU-bound work over large data, no I/O inside the lambda; measure before you use it |

- A parallel stream does not accept an executor. The trick of running it inside {{customPool.submit(...)}} works because of an implementation detail (a task forks into whichever pool it is currently running in), not because it is specified behaviour. Avoid that trick in important code.
- You can tune commonPool with the system property {{java.util.concurrent.ForkJoinPool.common.parallelism}}, but that is a global knob; it does not replace separate pools.
- Virtual threads use their **own** ForkJoinPool as a scheduler, not commonPool. Even so, if a virtual thread gets pinned (for example doing I/O inside synchronized on Java 21), the carrier thread is held exactly as above.

### Common wrong answers
- "A parallel stream is always faster": for a few thousand elements the split and merge overhead is bigger than the gain. Sources like {{LinkedList}} or {{Stream.iterate}} split very badly.
- "commonPool has as many threads as cores": in reality it is cores minus one, because the calling thread also takes part in the work.

### Common mistakes
- **Calling HTTP/JDBC inside {{parallelStream()}}**: the symptom is that unrelated APIs get slow too, and a thread dump shows {{ForkJoinPool.commonPool-worker-*}} stuck in a socket read. How to avoid: a separate, bounded I/O executor, or virtual threads plus a semaphore.
- **Split threshold too small** (for example splitting down to individual elements): creating tasks costs more than the real work, and the result is slower than running sequentially. How to avoid: thresholds in the thousands to tens of thousands of elements, measured with JMH.
- **Calling {{left.join()}} before computing the other half** (fork then join immediately): you lose all the parallelism. How to avoid: fork one half, compute the other half, then join.
- **A container with 1 to 2 vCPU**: commonPool parallelism is 1, the parallel stream is not parallel, and CompletableFuture async creates a new thread per task. How to avoid: always pass an explicit executor and set sensible CPU requests and limits.

### One-minute spoken answer
"ForkJoinPool gives each worker its own deque: a worker takes its own work from one end in LIFO order to exploit the cache, while an idle worker steals from the other end in FIFO order, usually getting a big task so it does not have to steal again; join does not sit idle, it runs other work. That design is a great fit for CPU-bound divide and conquer. The problem is that commonPool is shared by the whole JVM, has only cores-minus-one workers, and both parallel streams and supplyAsync called without an executor run there. If somebody calls HTTP or JDBC inside a parallel stream, the worker gets stuck on I/O and every other feature using commonPool slows down with it. So I always move I/O to a separate executor or to virtual threads, and I only use parallel streams for pure computation over large data, after measuring."

> Senior tip: when I review code I grep for {{parallelStream}} and for {{supplyAsync}} calls that do not pass an executor, because those are the two most common ways work leaks into commonPool. Expose {{getActiveThreadCount()}} and {{getQueuedSubmissionCount()}} of commonPool as metrics: a queue that keeps growing during peak hours is the sign that somebody is blocking inside the pool.`,
    follow: [
      'Why does a worker steal from the FIFO end of the deque rather than the LIFO end?',
      'How do you choose the split threshold for a RecursiveTask?',
      'When do you need ForkJoinPool.managedBlock?'
    ]
  },
  'concurrency-015': {
    q: 'Producer-consumer with {{BlockingQueue}}: backpressure, choosing a bounded queue and the policy when it is full (reject, block, drop) — how do you decide?',
    a: `**Summary:** Producer-consumer must use a **bounded** queue, because an unbounded queue only turns the problem "slow" into "OOM". When the queue is full there are four options: block the producer ({{put}}), wait for a limited time ({{offer}} with a timeout), reject immediately ({{offer}} returns false, respond 429/503, or move the data to durable storage), and drop (only for data that is allowed to be lost, such as metrics). The choice rests on two questions: is the producer allowed to slow down, and is the data allowed to be lost?

### Understand quickly
Producer-consumer is like a packing line: the person loading items onto the conveyor belt (the producer) and the person boxing them (the consumer) work at different speeds, and the belt in the middle (the queue) means the two do not have to wait for each other item by item. If the belt were infinitely long, the loader would keep loading and the goods would pile up until the warehouse collapses (OOM). A belt of limited length forces us to decide what to do when it is full: tell the loader to **wait** (block), **wait a little and then give up** (offer with a timeout), **refuse immediately** (reject), or **throw some away** (drop). That "full, slow down" signal is called backpressure.

### Terms
- **Producer / consumer**: the side that creates work / the side that processes work.
- **BlockingQueue**: a thread-safe queue whose operations block when the queue is full (put) or empty (take).
- **Bounded queue**: a queue with a maximum capacity.
- **Backpressure**: a mechanism that pushes an overload signal back towards the producer.
- **Load shedding**: deliberately rejecting some work so the system stays alive.
- **Poison pill**: a special element put on the queue to tell consumers to stop.
- **Little's Law**: the number of items in the system equals throughput times the time each item spends inside the system.
- **Outbox table**: a table that stores events inside the same business transaction, so they can be sent durably afterwards.

### What happens as the queue fills (step by step)
1. The producer creates work at 600 tasks/s while the consumer only handles 400 tasks/s, so there is a surplus of 200 tasks every second.
2. A bounded queue of 200 elements fills in about 1 second.
3. From then on, each time the producer submits work, the when-full policy decides: block (the producer slows down to 400/s), offer with a timeout (wait a few dozen ms, then return 503), reject immediately, or drop.
4. Why this is good: overload shows up **right at the edge** as a 503 or a controlled slowdown, instead of latency creeping up and an OOM arriving a few minutes later.

~~~text
Producer 600/s --> [ queue cap 200 ] --> Consumer 400/s
                       full after ~1s
                 put()   : producer is blocked, runs at 400/s
                 offer(t): waits t, no space -> false -> return 503
                 offer() : false immediately -> drop / count a metric
~~~

### Why bounded is mandatory
- A {{LinkedBlockingQueue}} created without a capacity gets capacity {{Integer.MAX_VALUE}}; {{Executors.newFixedThreadPool}} uses exactly that kind.
- When the producer is faster than the consumer for a long time, the queue swells: the heap grows, GC runs more often, and each task waits longer in the queue. Latency breaks first; the OOM comes later. By then clients have usually timed out long ago, so most tasks sitting in the queue are pointless work.
- A bounded queue turns overload into a clear signal right at the edge of the system. That is exactly what **backpressure** means.

### API when the queue is full
| API | When full | Use it when |
|---|---|---|
| {{put(e)}} | Blocks indefinitely | Batch/ETL where the producer is an internal thread that can wait |
| {{offer(e, timeout, unit)}} | Waits at most the timeout, then returns false | Online requests: wait a short while, then fail |
| {{offer(e)}} | Returns false immediately | Fail fast, load shedding |
| {{add(e)}} | Throws IllegalStateException | A full queue is considered a bug |

The consumer side works the same way: {{take()}} blocks, while {{poll(timeout, unit)}} waits for a limited time (handy so a consumer can periodically check a shutdown flag).

### Choosing a policy by context
- **Online API (money transfer, placing an order)**: a small queue, {{offer}} with a timeout of a few dozen ms; when there is no room, return 429/503 with a Retry-After header. A deep queue only makes p99 worse; it does not add throughput.
- **Batch/ETL reading a reconciliation file**: use {{put()}}; the producer reading the file slows down to exactly the DB write speed and memory stays stable.
- **Data that must not be lost (transactions, payment events)**: do not drop in memory. Write to durable storage first (an outbox table, Kafka) and process afterwards, because an in-RAM queue vanishes completely when the pod restarts.
- **Metrics, logs, tracing**: when {{offer()}} fails, drop and count the dropped entries.

### With ThreadPoolExecutor
Do not {{offer}} straight into an executor's queue yourself, because that bypasses the pool's thread-creation logic. Call {{execute}}/{{submit}} and pick a RejectedExecutionHandler:

~~~java
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    8, 8, 0, TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(200),                  // at most 200 tasks waiting
    Thread.ofPlatform().name("stmt-", 0).factory(), // Java 21: name threads so dumps are readable
    new ThreadPoolExecutor.AbortPolicy());          // full -> RejectedExecutionException

try {
    pool.execute(() -> process(stmt));
} catch (RejectedExecutionException e) {
    metrics.counter("stmt.rejected").increment();
    return ResponseEntity.status(503).build();      // tell the client to retry later
}
~~~

| Policy | Behaviour | Consequence |
|---|---|---|
| AbortPolicy (default) | Throws an exception | Explicit; the caller decides |
| CallerRunsPolicy | The calling thread runs the task itself | Natural backpressure; but if the caller is an HTTP thread, that request becomes much slower |
| DiscardPolicy | Drops silently | Dangerous: work disappears without a trace |
| DiscardOldestPolicy | Drops the oldest task and retries | Fits data where only the latest version matters |

### Choosing the size
Use Little's Law: tasks in the system equals throughput times waiting time. If the consumer handles 400 tasks/s and only tolerates a wait of up to 0.5 s, the queue is about 200. Anything bigger only makes tasks wait past that limit.

### Common mistakes
- {{ArrayBlockingQueue}} uses a single lock for both put and take; {{LinkedBlockingQueue}} uses two separate locks, so it usually gives higher throughput with many producers and consumers, at the cost of allocating a node per element.
- Forgetting how to stop consumers: you need a poison pill or an interrupt, otherwise consumers stay stuck in {{take()}} forever.
- **A queue with no capacity** ({{new LinkedBlockingQueue<>()}}): the symptom is a heap that grows steadily during peak hours, heavy GC, rising p99, then OOM. How to avoid: always set a capacity derived from the SLA.
- **Using put() on an HTTP thread**: the symptom is requests hanging indefinitely while the consumer is slow and Tomcat threads run out. How to avoid: offer with a timeout, and return 429/503 when there is no room.
- **Dropping important data in RAM**: transactions are lost when the queue is full or the pod restarts. How to avoid: persist first (outbox, Kafka).
- **A consumer that cannot stop at shutdown**: stuck in take(), the pod gets SIGKILLed. How to avoid: poll with a timeout plus a stop flag, or a poison pill, or an interrupt.

### One-minute spoken answer
"For producer-consumer I always use a bounded queue, because an unbounded queue only turns slowness into an OOM, and the tasks sitting in it have usually expired long before. When the queue is full there are four options: put to block the producer, which suits internal batch work; offer with a timeout for online requests, returning 503 or 429 when there is no room; offer returning false immediately for load shedding; and drop only for data that is allowed to be lost, like metrics. Data that must not be lost has to be persisted first, for example in an outbox or Kafka. I size the queue with Little's Law from the maximum wait I accept, then monitor queue size and reject count to know when to scale consumers."

> Senior tip: queue size is an SLA parameter, not a performance parameter. I derive it from the maximum wait I am willing to accept, then expose {{queue.size()}} and the reject count as metrics. Alert when the queue stays above 80%: that is the moment to scale the consumer, not to grow the queue.`,
    follow: [
      'Poison pill versus interrupt: which way of stopping a consumer is safer?',
      'What problem does CallerRunsPolicy cause when the caller is a Tomcat thread?',
      'When should you use a SynchronousQueue instead of a queue with capacity?'
    ]
  },
  'concurrency-016': {
    q: 'Interrupt: handling {{InterruptedException}} correctly (restoring the flag), cancelling tasks, {{Future.cancel}} — how do you implement it?',
    a: `**Summary:** Interrupt is a **cooperative** mechanism: {{t.interrupt()}} only raises a flag. A thread blocked in {{sleep}}, {{wait}}, {{join}}, {{BlockingQueue.take}}, {{Lock.lockInterruptibly}} and similar calls will exit with an {{InterruptedException}}, and the flag is cleared. When you catch that exception there are only two correct options: throw it onward (declare throws), or, if you cannot throw, call {{Thread.currentThread().interrupt()}} to restore the flag and then finish the work. {{Future.cancel(true)}} essentially only sends an interrupt to the thread running the task; a task that does not check the flag keeps running until it finishes.

### Understand quickly
Interrupt is like knocking on a door and saying "you can stop now", not breaking the door down and dragging the person out. Someone asleep (sleep/wait/take) is woken immediately and knows somebody called. Someone deep in work has to **look up and check** for themselves whether anyone called. If you hear the knock and ignore it (swallow the exception), the manager outside (the executor) thinks you were never told and waits forever. So: if you heard it but cannot handle it, you have to "knock again" so that whoever is above you knows — that is restoring the interrupt flag.

### Terms
- **Interrupt flag**: a boolean inside every thread that {{interrupt()}} raises.
- **Cooperative cancellation**: the task checks for a stop request and stops itself; it is never killed by force.
- **Interruptible blocking**: a blocking point that exits with InterruptedException when the thread is interrupted.
- **Future**: a handle to the result of an asynchronous task; it has {{get}}, {{cancel}}, {{isDone}}.
- **CancellationException**: thrown when you fetch the result of a cancelled task.
- **Graceful shutdown**: shutting the application down in order: stop accepting work, finish or safely abandon the work in progress.
- **Checked exception**: an exception you are forced to declare with {{throws}} or to catch; InterruptedException is one.

### One task cancellation, step by step
1. The executor calls {{future.cancel(true)}} or {{shutdownNow()}}, which calls {{workerThread.interrupt()}}. Why not kill the thread: killing it halfway leaves locks held and data half-written.
2. The worker's interrupt flag goes up.
3. If the worker is in {{queue.take()}}, the JVM wakes it, **clears the flag**, and throws InterruptedException.
4. The task catches the exception: restores the flag ({{Thread.currentThread().interrupt()}}), cleans up resources in finally, returns.
5. The executor sees the task has finished, the thread is reclaimed, and {{awaitTermination}} returns true.

~~~text
cancel(true) --> interrupt() --> flag = true
                     |
   in take()/sleep()?  --yes--> InterruptedException (flag cleared)
                     |                  -> catch: interrupt() again + clean up + exit
                     no (computing)
                     -> the task must check isInterrupted() itself after each loop/batch
~~~

### Mechanism
- Each thread has an interrupt flag. {{interrupt()}} raises the flag, and if the thread sits at an "interruptible" blocking point, it wakes it up.
- Blocking points that throw InterruptedException: {{Thread.sleep}}, {{Object.wait}}, {{Thread.join}}, {{BlockingQueue.put/take}}, {{Future.get}}, {{CountDownLatch.await}}, {{Lock.lockInterruptibly}}. When they throw, the JVM **clears the flag**.

Not every kind of blocking reacts to an interrupt:

| Blocked in | When interrupted |
|---|---|
| Waiting to enter {{synchronized}}, {{Lock.lock()}} | Not interrupted, keeps waiting |
| Old-style socket I/O ({{InputStream.read}}) | Usually not interruptible; you must close the socket or set a timeout |
| NIO {{InterruptibleChannel}} | The channel is closed and {{ClosedByInterruptException}} is thrown |
| {{Selector.select()}} | Returns early without throwing |

- Pure CPU code must check {{Thread.currentThread().isInterrupted()}} itself. Note that {{Thread.interrupted()}} (static) reads and **clears** the flag at the same time.

### The two correct ways to handle it
~~~java
// 1. If you cannot handle it, declare throws and let the caller decide
public Payment next() throws InterruptedException {
    return queue.take();
}

// 2. A Runnable cannot throw a checked exception: restore the flag, then stop
public void run() {
    try {
        while (!Thread.currentThread().isInterrupted()) {
            process(queue.take());
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();   // so the executor/framework above knows
    } finally {
        releaseResources();
    }
}
~~~
Why must you restore the flag? The exception already cleared it. If you swallow it, the executor or framework above has no way to know the thread was asked to stop, and {{shutdownNow()}} "does nothing".

You do not have to both call {{interrupt()}} and rethrow InterruptedException: rethrowing already carries the message.

### Future.cancel
| Call | Task not started yet | Task running |
|---|---|---|
| {{cancel(false)}} | Never runs | Keeps running, result discarded |
| {{cancel(true)}} | Never runs | The thread running the task is interrupted |

- In both cases {{isCancelled()}} is true and {{get()}} throws {{CancellationException}} immediately.
- {{cancel}} returns false if the task already finished or was already cancelled.
- {{CompletableFuture.cancel(true)}}: the {{mayInterruptIfRunning}} argument **has no effect**, because a CompletableFuture does not know which thread is computing it. To really stop it you have to pass a cancellation flag into the task yourself, or use {{orTimeout}} plus a check inside the task.

### Cancelling a long-running CPU-bound task
Put a check after each iteration or each batch, for example {{if (Thread.currentThread().isInterrupted()) throw new CancellationException()}}. Commit per batch so you can stop halfway while the data stays consistent.

### Common wrong answers
- A catch block that only logs and keeps going: it swallows the stop request and graceful shutdown hangs until the pod is killed.
- Wrapping it in a RuntimeException without restoring the flag.
- Thinking of {{Thread.stop()}}: it is deprecated because it kills the thread halfway, leaving broken objects and half-released locks; since JDK 20, calling it throws {{UnsupportedOperationException}}.
- "interrupt() stops the thread immediately": no, it is only a request.

### Common mistakes
- **Catching {{InterruptedException}} and only logging** and then continuing: the symptom is a shutdown that hangs until the pod is killed 30 seconds later. How to avoid: rethrow, or restore the flag and exit.
- **A compute loop that never checks the flag**: {{cancel(true)}} has no effect and CPU stays at 100% after the cancel. How to avoid: check {{isInterrupted()}} after each batch.
- **Using {{Thread.interrupted()}} "just to look"**: the flag gets cleared and the layer above no longer knows. How to avoid: use {{isInterrupted()}} when you only want to read.
- **Old-style socket reads without a timeout**: an interrupt does not wake them and the thread hangs forever. How to avoid: set a read timeout, or close the socket from another thread.

### One-minute spoken answer
"Interrupt in Java is a cooperative mechanism: interrupt only raises a flag; a thread blocked in sleep, wait, join, take or lockInterruptibly exits with InterruptedException and the flag is cleared, while code that is computing must check isInterrupted itself. When I catch InterruptedException I have only two correct choices: declare throws and rethrow, or, if I am inside a Runnable, call Thread.currentThread().interrupt to restore the flag and exit, otherwise shutdownNow does nothing. Future.cancel(true) really only interrupts the thread running the task, and CompletableFuture.cancel interrupts nothing at all. For long jobs I check the flag after every batch and commit per batch, so a stop is quick and the data stays consistent."

> Senior tip: in code review I grep for {{catch (InterruptedException}}: every occurrence must either rethrow or contain {{Thread.currentThread().interrupt()}}. For reconciliation jobs that run for hours, I check the interrupt flag after every batch of 1,000 records and commit per batch. As a result, at deploy time {{shutdownNow()}} stops the job within seconds while the data stays consistent.`,
    follow: [
      'A task reading a socket through InputStream does not react to interrupt — how do you stop it?',
      'Why can CompletableFuture.cancel(true) not interrupt the task?',
      'How does Thread.interrupted() differ from isInterrupted()?'
    ]
  },
  'concurrency-017': {
    q: '{{wait}}/{{notify}} vs {{Condition}}: what is a spurious wakeup, and why must you always check the condition inside a loop?',
    a: `**Summary:** {{wait}}/{{notify}} is tied to an object's monitor and can only be called while holding {{synchronized}} on that same object; each monitor has exactly **one** wait set. {{Condition}} (obtained from {{Lock.newCondition()}}) lets a single lock own several separate waiting queues (notFull, notEmpty) and adds {{awaitUninterruptibly}}, {{awaitNanos}}, {{awaitUntil}}. Always wait inside a {{while}}, because a thread can wake up while the condition is still false: a spurious wakeup (the spec allows it), {{notifyAll}} waking several threads at once, or another thread slipping in and taking the state before you win the lock back.

### Understand quickly
Think of a waiting room at a clinic. {{wait()}} is a patient sitting down in a chair and **handing the key of the consulting room back** so that somebody else can go in. {{notify()}} is the nurse calling "there is room now" — but being called does not mean you get in right away: you have to stand up, win the key back, and somebody else may have slipped in first. That is why, once you stand up, you have to **look again whether there is still room** (the while loop). wait/notify has only **one shared waiting room** for every kind of patient; Condition lets you have several separate rooms (an "exam" room, a "pharmacy" room), so the nurse calls the right patient.

### Terms
- **Monitor**: the lock attached to every object, used by synchronized, wait and notify.
- **Wait set**: the set of threads waiting on a monitor after calling wait().
- **Condition**: a waiting queue attached to a Lock, created with {{lock.newCondition()}}; it has await/signal.
- **Spurious wakeup**: a thread wakes up even though nobody notified it — the Java specification allows this.
- **Lost wakeup**: a notify is sent while nobody is waiting, so a thread that starts waiting later sleeps forever.
- **Guarded wait**: the pattern of waiting in a loop until the condition holds.
- **Bounded buffer**: a queue with limited capacity where producers wait when it is full and consumers wait when it is empty.

### How wait/notify works
1. Thread A holds the monitor and calls {{lock.wait()}}: A releases the monitor and enters the wait set.
2. Thread B enters the synchronized block, changes the state and calls {{notify()}}: one thread moves from the wait set into the queue for the monitor. B still holds the lock until it leaves the block.
3. A has to win the monitor back before it continues after {{wait()}}. Between being notified and winning the lock, thread C may have slipped in and taken the element.
- Calling wait/notify without holding the monitor throws {{IllegalMonitorStateException}}.
- {{wait()}} throws {{InterruptedException}} if the thread is interrupted while waiting. Both mechanisms are interruptible.

### Comparison
| | wait/notify | Condition |
|---|---|---|
| Works with | synchronized | Lock (ReentrantLock and others) |
| Number of wait queues | 1 per monitor | Many per lock |
| Wait without interruption | Not available | {{awaitUninterruptibly()}} |
| Timeout | {{wait(ms)}}, tells you nothing about time left | {{awaitNanos}} returns the remaining time; {{awaitUntil(deadline)}} |
| Waking | notify / notifyAll | signal / signalAll |

### Why always use while
~~~java
// WRONG: assume that waking up means the condition is true
synchronized (lock) {
    if (queue.isEmpty()) lock.wait();
    return queue.remove();          // can throw NoSuchElementException
}
// RIGHT: check again after waking up
synchronized (lock) {
    while (queue.isEmpty()) lock.wait();
    return queue.remove();
}
~~~
The failure scenario with {{if}}: two consumers are both waiting, the producer adds one element and calls {{notifyAll()}}. Consumer 1 takes the element; consumer 2 wins the lock afterwards, does not check again, and calls {{remove()}} on an empty queue. A spurious wakeup gives the same result even without any notify. The javadoc of {{Object.wait}} requires wait to always be placed inside a loop.

### Bounded buffer with Condition
~~~java
final ReentrantLock lock = new ReentrantLock();
final Condition notFull = lock.newCondition();
final Condition notEmpty = lock.newCondition();

void put(T x) throws InterruptedException {
    lock.lock();
    try {
        while (count == items.length) notFull.await(); // only producers wait here
        enqueue(x);
        notEmpty.signal();          // wakes only consumers, not producers
    } finally {
        lock.unlock();
    }
}
~~~
With only one wait set, {{notify()}} can wake the wrong thread: another producer instead of a consumer. The wrongly woken thread goes back to sleep, the signal is effectively "lost", and the system can hang. That is why synchronized code usually has to use {{notifyAll()}} (safe, but wakes extra threads). Condition splits the queues, so {{signal()}} is enough.

### When to use it
- In most cases you should not write this yourself: use {{BlockingQueue}}, {{CountDownLatch}}, {{Semaphore}}.
- If you really must, prefer Lock + Condition when there are several waiting conditions or you need precise timeouts.

### Common wrong answers
- "Spurious wakeups are rare, so if is fine": the main reason for while is notifyAll and threads slipping in and stealing the state, and those happen all the time.
- "notify() runs the woken thread immediately": that thread still has to wait to win the monitor back.

### Common mistakes
- **Using {{if}} instead of {{while}}**: the symptom is a NoSuchElementException or wrong data that only shows up now and then under load. How to avoid: always {{while (!condition) wait()}}.
- **notify() on a monitor that has several kinds of waiter**: it wakes a producer instead of a consumer and the system hangs occasionally. How to avoid: notifyAll(), or Lock with several Conditions.
- **Changing the state outside synchronized and only then notifying**: lost wakeup, waiting threads sleep forever. How to avoid: check and change the state inside the same lock as wait/notify.
- **Calling await() but forgetting lock.unlock() in finally**: the lock gets stuck forever when an exception happens. How to avoid: the lock, try, finally unlock pattern.

### One-minute spoken answer
"wait and notify are tied to an object's monitor, can only be called while holding synchronized on that object, and each monitor has a single wait set. Condition comes from a Lock and allows several separate wait queues, for example notFull and notEmpty, so a signal wakes exactly the right kind of thread, and it also offers awaitNanos, awaitUntil and awaitUninterruptibly. I always wait inside a while loop because a thread can wake up while the condition is still false: spurious wakeups, notifyAll waking several threads, or another thread slipping in and stealing the state before I win the lock back. In practice I almost never write wait/notify myself; I use BlockingQueue, CountDownLatch or Semaphore."

> Senior tip: when I meet an "occasionally hangs" bug in old wait/notify code, I check three things in this order: is there an {{if}} instead of a {{while}}; is there a {{notify()}} on a monitor that has several kinds of waiter; is the state changed outside the synchronized block. Almost every bug of this kind falls into one of those three places.`,
    follow: [
      'notify() versus notifyAll(): when is notify() safe enough?',
      'What is a lost wakeup, and why must the state be checked inside the same lock?'
    ]
  },
  'concurrency-018': {
    q: 'Safe publication and immutability: why can an object that is not published safely be seen "half-baked"; how do {{final}} field semantics work?',
    a: `**Summary:** Publishing means making a reference to an object visible from another thread. If you publish through an ordinary field (a data race), the JMM gives no happens-before relationship between the writes inside the constructor and the reads in the other thread. The reading thread may see a non-null reference while the fields inside are still 0/null. Safe ways to publish: a static initializer, a {{volatile}}/Atomic field, writing and reading under the same lock, or passing the object through a concurrent collection/BlockingQueue. {{final}} fields have a special guarantee: if {{this}} does not escape during construction, every thread that sees the object sees the final values (and everything reachable through them) exactly as they were when the constructor finished — even when the reference itself was published through a data race.

### Understand quickly
Publishing an object is like pinning a notice on the company board. If you pin the sheet first and write the content afterwards, people walking by can read a blank sheet. "Safe publication" is any way of ensuring the reader only sees the notice once the content is written: pin it behind a locked glass case (a lock), send it through the official mail slot (volatile, a concurrent collection), or have it printed at the print shop (a static initializer). An **immutable** object is like a notice that was fully printed before it left the shop — however you pin it, the reader sees all of the content, thanks to the special guarantee for {{final}} fields.

### Terms
- **Publish**: make a reference to an object visible from another thread.
- **Safe publication**: publication with a happens-before edge between the end of initialization and the other thread's read.
- **Data race**: two threads access the same variable, at least one write, with no happens-before between them.
- **Immutable object**: an object whose state does not change after the constructor has run.
- **Final field semantics / freeze**: the JMM guarantee that the final field values at the end of the constructor are visible to every thread.
- **this escape**: leaking the {{this}} reference out while the constructor has not finished.
- **Defensive copy**: copying mutable inputs and outputs so the outside world cannot change the internal state.
- **Initialization safety**: another name for the guarantee that applies to final fields.

### Why an object can look "half-baked"
~~~java
class Rate { int bps; Rate(int bps) { this.bps = bps; } }
static Rate current;                          // ordinary field, not volatile

// Thread A
current = new Rate(150);
// Thread B
Rate r = current;
if (r != null) System.out.println(r.bps);     // the JMM allows printing 0
~~~
- {{new Rate(150)}} consists of three steps: allocate (fields = 0), run the constructor (bps = 150), assign the reference to current. Without happens-before, the JIT and the CPU are allowed to make thread B see the reference assignment before the write of bps.
- On x86 this is rare in practice because the hardware hardly ever reorders stores, but the JIT is still allowed to reorder. ARM (Graviton, Apple M) really does reorder, so code that "works fine on the dev machine" can break when it moves to Graviton.

### Safe ways to publish
1. Initialize in a static initializer, for example {{static final Rate DEFAULT = new Rate(150);}}: the JVM locks while the class is initialized.
2. Store it in a {{volatile}} field or an {{AtomicReference}}.
3. Store it in a {{final}} field of an object that was constructed properly.
4. Write and read under the same lock.
5. Pass it through a thread-safe collection: {{ConcurrentHashMap}}, {{BlockingQueue}}, {{CopyOnWriteArrayList}}.

### What final means (JSR-133, Java 5 and later)
- At the end of the constructor there is a "freeze" step for final fields. Any thread that has a reference to the object (after the constructor finished) sees the values of the final fields, **and** sees the state of the objects those final fields point to as of that freeze (for example the elements of a final array that was filled in the constructor).
- What is not guaranteed: changes made after the constructor (adding to a final list later still needs synchronization) and non-final fields.
- A mandatory condition: do not let {{this}} escape during construction (registering a listener, starting a thread, assigning to a static variable). If it escapes, another thread can see the object before the freeze and the guarantee is gone.

~~~java
public final class FxQuote {                  // immutable: safe however it is published
    private final String pair;
    private final BigDecimal rate;
    private final List<String> sources;
    public FxQuote(String pair, BigDecimal rate, List<String> sources) {
        this.pair = pair;
        this.rate = rate;
        this.sources = List.copyOf(sources);   // defensive copy, and the copy is immutable
    }
}
~~~

### Immutable objects
- Every field {{private final}}, no setters, the class {{final}}, defensive copies for mutable inputs and outputs, and {{this}} never leaked.
- A {{record}} gives you final fields but only a **shallow** kind of immutability: a record holding a mutable {{List}} can still be modified from outside, so copy in the compact constructor.
- Immutable does not mean you need nothing when replacing it: {{volatile FxQuote latest}} still needs volatile so other threads see the new reference. The content inside each version is already safe.

### Common wrong answers
- "The constructor finishes before the reference is assigned, so there is no problem": that is the order within one thread, not the order another thread observes.
- "final only means you cannot reassign it": that misses the initialization safety guarantee.
- "A final field pointing to a mutable object gives no guarantee": it does — the state at the time of the freeze is visible; only later changes are not.

### Common mistakes
- **A reloaded cache or config assigned to an ordinary field**: the symptom is another thread occasionally seeing the old config, or an object whose fields are null even though the constructor assigned them. How to avoid: a volatile field or an AtomicReference holding an immutable object.
- **Registering a listener or starting a thread inside the constructor**: another thread sees the object before initialization finishes and the final guarantee is lost too. How to avoid: use a factory method — construct first, then register or start.
- **A record holding a List and assuming it is immutable**: the outside world can still modify that list, and readers see the state changing halfway. How to avoid: {{List.copyOf}} in the compact constructor.
- **Only testing on x86**: the bug does not show on the dev machine, then appears on Graviton/ARM. How to avoid: reason with happens-before, and test with jcstress.

### One-minute spoken answer
"Publishing is handing an object's reference to another thread. If you publish through an ordinary field there is no happens-before between the writes in the constructor and the reads in the other thread, so that thread can see a non-null reference while the fields are still 0 or null, especially on ARM. The safe ways to publish are a static initializer, volatile or an AtomicReference, a lock, or a concurrent collection. Final fields have their own guarantee: if this does not escape during the constructor, every thread that sees the object sees the final values as they were when the constructor finished. So the pattern I like is an immutable object plus a volatile reference: updates replace the whole object, and readers need no lock."

> Senior tip: the pattern I use for configuration or FX rate tables that are refreshed periodically is an immutable object plus a {{volatile}} field (or an AtomicReference) holding the current version. The updating thread builds a new object and assigns it once. Readers need no lock and never see a state mixing the old and the new versions; it is both cheap and much more correct than putting a lock around a mutable object.`,
    follow: [
      'Letting this escape during construction: give a realistic example and the consequences?',
      'Why is unsafe publication rare on x86 but visible on ARM?',
      'Is a record really immutable?'
    ]
  },
  'concurrency-019': {
    q: 'False sharing, cache line, {{@Contended}}: the phenomenon, how to detect it, how to fix it — and how do you measure it with JMH?',
    a: `**Summary:** The CPU keeps caches coherent in units of a **cache line** (64 bytes on x86 and most ARM servers). When two threads write to two **different** variables that happen to share one line, every write forces the coherence protocol (MESI) to take exclusive ownership of that line and invalidate the other core's copy. The line "ping-pongs" between the cores and throughput collapses even though there is no lock and no data race. The fix is to separate the variables into different lines: {{@Contended}} (application code must run with {{-XX:-RestrictContended}}), padding, or a design where each thread writes to its own region, like {{LongAdder}}. Measure with JMH using a multi-threaded benchmark group, together with the {{perfnorm}} or {{perf c2c}} profiler.

### Understand quickly
Imagine two people writing on two different lines of **the same sheet of paper**, but the rule is that only one person may hold the sheet at a time. They never overwrite each other, yet they keep passing the sheet back and forth, so both are slow. The CPU works the same way: it does not synchronize each variable but the whole 64-byte "sheet", called a cache line. Two variables sitting on one line, each written by a different thread, is enough for the line to bounce between cores. The fix is to give each person their own sheet (separate the variables onto different lines).

### Terms
- **Cache line**: the smallest unit the CPU copies between RAM and cache, usually 64 bytes.
- **Cache coherence**: the mechanism that keeps the copies in different cores' caches consistent.
- **MESI**: a widely used coherence protocol where each line is in one of four states: Modified, Exclusive, Shared, Invalid.
- **False sharing**: threads write to different variables that share a cache line, causing hardware contention.
- **Padding**: inserting extra bytes to push variables onto different cache lines.
- **@Contended**: an internal JDK annotation that asks the JVM to pad around a field or class.
- **JMH**: the official OpenJDK benchmarking framework; it handles warm-up and JIT optimizations so the numbers mean something.
- **perf c2c**: a Linux tool that detects cache lines being shared between cores.

~~~text
Cache line 64 bytes: [ requests (8B) | errors (8B) | ... ]
Core 1 writes requests -> line is Modified on Core 1, Invalid on Core 2
Core 2 writes errors   -> pulls the line to Core 2, Core 1 becomes Invalid
Core 1 writes requests -> pulls the line back again ...   (ping-pong millions of times per second)
After splitting:  [ requests | padding ... ]  [ errors | padding ... ]  -> each core keeps its own line
~~~

### The mechanism
1. Core 1 writes {{a}}: the line holding a and b becomes Modified on core 1; the copy on core 2 becomes Invalid.
2. Core 2 writes {{b}} (same line): it must pull the line over from core 1, which costs tens to hundreds of cycles (more across sockets), and core 1 becomes Invalid again.
3. This repeats on every write: the bottleneck is coherence bandwidth, not computation.

Why "false"? The two threads share no logical data; they only share the hardware's unit of synchronization.

### Where it shows up in Java
- Adjacent fields of one object, for example a request counter and an error counter in the same class, each written by a different thread.
- Adjacent elements of an array: {{long[] perThread}} where each thread writes its own slot, while eight long slots share one line.
- The front of a queue: the head pointer (written by the consumer) and the tail pointer (written by the producer) sitting next to each other.

### How to fix it
~~~java
// JDK 9+: the annotation lives in an internal package
// Compiling needs: --add-exports java.base/jdk.internal.vm.annotation=ALL-UNNAMED
// Running needs: -XX:-RestrictContended (without it the JVM ignores the annotation outside the JDK)
import jdk.internal.vm.annotation.Contended;

class Stats {
    @Contended volatile long requests;   // each field is padded into its own region
    @Contended volatile long errors;
}
~~~
- JDK 8 used {{sun.misc.Contended}}; since JDK 9 it is {{jdk.internal.vm.annotation.Contended}}. By default the JVM pads 128 bytes ({{-XX:ContendedPaddingWidth}}) to defend against CPUs that prefetch line pairs.
- Manual padding with extra long fields in the same class is unreliable, because HotSpot reorders fields itself. The technique that holds up (used by JCTools and Disruptor) is padding through **inheritance** across several class levels, because the fields of a parent class are always laid out before the fields of a child class.
- The best option is usually a design change: {{LongAdder}} (an array of Cell objects, and the JDK's Cell class is itself marked @Contended), or a per-thread local counter that is merged at the end.

### Measuring with JMH
~~~java
@State(Scope.Group)
public class FalseSharingBench {
    volatile long a, b;                       // adjacent, most likely the same line

    @Benchmark @Group("shared") @GroupThreads(1)
    public void writeA() { a++; }

    @Benchmark @Group("shared") @GroupThreads(1)
    public void writeB() { b++; }
}
// Compare with a variant where a and b live in two different objects, or with @Contended
// Also run with -prof perfnorm (Linux) to see cache misses and cycles per operation
~~~
- The benchmark must run on a machine with at least two real cores. Results differ between x86 and ARM, so only compare variants relative to each other.
- On production Linux, {{perf c2c}} points straight at the contended cache line and at the offset inside the line.

### Common wrong answers
- "False sharing is a data race": no, the data is still correct; only performance suffers.
- "Adding volatile or synchronized solves it": neither changes the memory layout, and volatile actually makes the effect more visible.

### Common mistakes
- **A per-thread counter array** ({{long[] counts}}, thread i writes {{counts[i]}}): the symptom is that adding threads makes it slower. How to avoid: LongAdder, or a thread-local counter merged at the end.
- **Using @Contended but forgetting {{-XX:-RestrictContended}}**: the annotation is silently ignored and nothing improves. How to avoid: check the object layout with JOL (Java Object Layout) and benchmark again.
- **Padding with extra long fields in the same class**: the JVM reorders the fields, so the padding does not land where you want. How to avoid: pad through class inheritance, or use a library that already does it (JCTools, Agrona).
- **Measuring with a hand-written System.nanoTime loop**: the JIT removes the code and the result is meaningless. How to avoid: JMH with @Group and the perfnorm profiler.

### One-minute spoken answer
"The CPU keeps caches coherent by cache line, usually 64 bytes. False sharing happens when two threads write to two different variables that share one line: under the MESI protocol every write must take exclusive ownership and invalidate the other core's copy, so the line bounces back and forth and throughput collapses without any lock or data race. I suspect it when adding threads does not raise throughput, CPU stays high and there is no lock contention; I confirm with perf c2c or a JMH group benchmark. The fix is to separate the variables onto different lines with @Contended and the -XX:-RestrictContended flag, padding through inheritance, or best of all a design change such as LongAdder so each thread writes its own region."

> Senior tip: false sharing is rarely the cause in a CRUD service, because I/O and locks cost orders of magnitude more. I only think of it when adding threads does not raise throughput (or even lowers it), CPU stays high and the profiler shows no lock contention. Before reaching for @Contended (which depends on an internal API and costs memory), try LongAdder first, or redesign so that each thread writes only its own data.`,
    follow: [
      'Why is padding with extra fields in the same class unreliable while padding through inheritance works?',
      'How does LongAdder avoid false sharing and contention, and what does it trade off versus AtomicLong?'
    ]
  },
  'concurrency-020': {
    q: 'Graceful executor shutdown: {{shutdown}} vs {{shutdownNow}}, {{awaitTermination}}; {{ScheduledExecutorService}} swallows the exception and silently stops the job — how do you handle it?',
    a: `**Summary:** {{shutdown()}} stops accepting new tasks but still runs the tasks already running and the tasks in the queue. {{shutdownNow()}} stops accepting, pulls the queued tasks out and returns them (it does not run them) and **interrupts** every worker; a task that does not react to interrupts keeps running. Neither waits; to wait you must call {{awaitTermination(timeout)}}. With a {{ScheduledExecutorService}}, if one run of a {{scheduleAtFixedRate}} task throws, every later run is **silently cancelled**: the exception sits inside the ScheduledFuture and nobody logs it. The thread does not die, only the job stops. The fix: catch every exception inside the job body, log it and emit a metric.

### Understand quickly
Shutting down an executor is like closing a restaurant. {{shutdown()}} is hanging a "no new guests" sign: guests already eating and orders already placed are still served. {{shutdownNow()}} is switching on the "closing right now" light: cancel the dishes not yet cooked and ask the guests to stand up (interrupt) — but anyone determined to keep eating stays seated. {{awaitTermination}} is the manager standing at the door waiting for the last guest to leave, for at most a given time. And the ScheduledExecutorService trap is like an alarm clock: one failed ring and it switches itself off completely without telling anybody.

### Terms
- **Graceful shutdown**: stopping in order, finishing the work in progress within the allowed time.
- **ScheduledExecutorService**: an executor that runs tasks after a delay or repeats them periodically.
- **scheduleAtFixedRate / scheduleWithFixedDelay**: repeat on a fixed rhythm measured from the start of each run / measured from the end of the previous run.
- **ScheduledFuture**: the future that represents a periodic task; it holds the exception if the task fails.
- **UncaughtExceptionHandler**: the handler for an exception nobody caught that would otherwise kill a thread.
- **terminationGracePeriodSeconds**: how long Kubernetes waits for a pod to shut itself down after SIGTERM before sending SIGKILL.
- **SIGTERM / SIGKILL**: the signal that asks a process to stop (catchable) / the one that kills it immediately (not catchable).

### How a pod shuts down on Kubernetes
~~~text
t=0s   kubelet sends SIGTERM -> the JVM runs shutdown hooks / Spring closes the context
t=0s   the web server stops accepting new requests; executor.shutdown()
t=0..20s wait for requests + running tasks to finish (awaitTermination)
t=20s  out of patience: shutdownNow() -> interrupt workers
t=25s  still not done: log the error, let the process exit
t=30s  (default grace period) kubelet sends SIGKILL -> dead at once, nothing cleaned up
~~~

### Comparison
| | New tasks | Tasks in the queue | Tasks running | Returns |
|---|---|---|---|---|
| {{shutdown()}} | Rejected | Still run | Keep running | void |
| {{shutdownNow()}} | Rejected | Pulled out, not run | Interrupted | List of tasks never started |
| {{awaitTermination(t, unit)}} | No change | No change | Blocks until the pool terminates or t elapses | true if it terminated |

### The standard two-phase procedure
~~~java
void stop(ExecutorService pool) {
    pool.shutdown();                                    // 1. stop accepting new work
    try {
        if (!pool.awaitTermination(20, TimeUnit.SECONDS)) {
            List<Runnable> dropped = pool.shutdownNow(); // 2. out of patience: interrupt
            log.warn("Dropped {} tasks that never ran", dropped.size());
            if (!pool.awaitTermination(5, TimeUnit.SECONDS))
                log.error("Pool still not stopped: some task ignores interrupt");
        }
    } catch (InterruptedException e) {                  // this thread itself was interrupted while waiting
        pool.shutdownNow();
        Thread.currentThread().interrupt();
    }
}
~~~
- Since Java 19, {{ExecutorService}} is {{AutoCloseable}}: {{close()}} calls shutdown and then waits until every task finishes (it switches to shutdownNow if the calling thread is interrupted). Handy for short-lived pools in try-with-resources, but the wait has no upper bound.
- The total waiting time must be smaller than the pod's {{terminationGracePeriodSeconds}} (30 seconds by default), otherwise kubelet sends SIGKILL halfway.

### The ScheduledExecutorService trap
~~~java
scheduler.scheduleAtFixedRate(() -> {
    syncFxRates();      // ONE exception is enough to cancel every later run
}, 0, 1, TimeUnit.MINUTES);
~~~
- The task is wrapped in a {{ScheduledFutureTask}} (a kind of FutureTask). The exception is caught and stored in the future, the future moves to an abnormally completed state, so it is never rescheduled. The worker thread **does not die**, the UncaughtExceptionHandler is **not** called, and no log line appears.
- Only whoever calls {{future.get()}} sees the exception (wrapped in an ExecutionException), and for a periodic job almost nobody does.
- The same is true for ordinary executors: a task submitted with {{submit()}} keeps its exception inside the Future. Only {{execute()}} lets the exception reach the UncaughtExceptionHandler.
- If one run takes longer than the period, the next run starts late rather than running on top of the previous one.

~~~java
scheduler.scheduleAtFixedRate(() -> {
    try {
        syncFxRates();
    } catch (Exception e) {                 // note: an Error (e.g. OOM) escaping still cancels the schedule
        log.error("syncFxRates failed", e);
        metrics.counter("job.fx.error").increment();
    }
}, 0, 1, TimeUnit.MINUTES);
~~~

### In Spring Boot
- {{server.shutdown=graceful}} (the default since Spring Boot 3.4; older versions require you to enable it) together with {{spring.lifecycle.timeout-per-shutdown-phase}} (30s by default): the web server stops accepting new requests and waits for the running ones.
- Executors managed by Spring ({{ThreadPoolTaskExecutor}}, {{ThreadPoolTaskScheduler}}): configure {{spring.task.execution.shutdown.await-termination=true}} and {{await-termination-period}}; otherwise, when the context closes, Spring only calls shutdown without waiting for tasks.
- Spring's {{@Scheduled}} differs from a raw ScheduledExecutorService: for a repeating task, the default ErrorHandler logs the error and lets the schedule continue. But the error only lives in the log, so you still need a metric to notice.

### Common wrong answers
- "shutdownNow() stops every task immediately": it only interrupts; tasks must cooperate.
- "When a periodic job throws, the thread dies and the pool creates a new one that keeps running": the thread does not die, but the job stops for good.

### Common mistakes
- **A periodic job with no try/catch**: the symptom is a job that silently stops after the first error, with no log and no alert. How to avoid: wrap the entire job body in try/catch plus a "last successful run" metric.
- **Calling shutdown() without awaitTermination**: the process exits while tasks are unfinished and data is written halfway. How to avoid: the two-phase procedure above.
- **Total wait longer than the grace period**: the pod gets SIGKILLed halfway. How to avoid: keep the total timeout below {{terminationGracePeriodSeconds}}, or raise the grace period.
- **A task that swallows InterruptedException**: shutdownNow cannot stop it. How to avoid: restore the interrupt flag and exit.

### One-minute spoken answer
"shutdown stops accepting new tasks but still finishes the running ones and the queued ones; shutdownNow stops accepting, returns the tasks that never ran and interrupts the workers, and tasks that do not cooperate with interrupts keep running. Neither waits, so I use a two-phase procedure: shutdown, awaitTermination with a timeout, then shutdownNow when time is up plus a short extra wait, and the total must be below the pod grace period. For ScheduledExecutorService specifically, one failed run silently cancels every later run, the exception sits in the ScheduledFuture and nobody logs it; so every periodic job of mine has an outer try/catch, logging, metrics, and an alert when several cycles pass without a successful run."

> Senior tip: the classic incident looks like this: an FX rate sync job that runs every minute, one day a partner API returns broken JSON causing a NullPointerException, and the job stops for a whole week until a customer complains the rates are stale. Since then every periodic job I write has an outer try/catch and a "last successful run" timestamp metric, with an alert when three cycles pass without an update. An alert based on "no successful run" catches both a dead job and a hung job.`,
    follow: [
      'A task ignores interrupt during shutdownNow — what do you do so the pod still shuts down on time?',
      'How do scheduleAtFixedRate and scheduleWithFixedDelay differ when one run is slow?'
    ]
  },
  'jvm-001': {
    q: 'List the JVM memory regions (heap young/old, metaspace, stack, code cache, direct memory) and explain which region produces which symptom.',
    a: `**Summary:** A Java process splits its memory into several regions: the **heap** (young — Eden plus two Survivor spaces — and old) holds the objects your code creates; **metaspace** is native memory holding class metadata; **each thread has a stack** holding method frames; the **code cache** holds machine code produced by the JIT; **direct memory** backs NIO {{ByteBuffer}}s outside the heap. Reading the symptom tells you the region: an OOM "Java heap space" is the heap; an OOM "Metaspace" is too many classes or a classloader leak; "unable to create native thread" is threads, stacks or OS limits; RSS much higher than Xmx is native memory (direct buffers, metaspace, code cache and so on).

### Understand quickly
Think of the JVM as an office building. **Heap** is the shared warehouse where everybody leaves stuff (objects); it has a "new arrivals" area (young) that is tidied very often and a "long-term storage" area (old) that is tidied less often. **Stack** is each employee's own desk (one per thread): the paperwork being processed sits on the desk and is cleared as soon as the task is done. **Metaspace** is the filing cabinet describing the "kinds of goods" (classes). **Code cache** is the notebook of pre-optimized instructions that make work faster. **Direct memory** is rented storage outside the building, so the warehouse manager (the GC) does not see it directly. Each area reports a different error when it fills up, so reading the right message tells you which area is in trouble.

### Terms
- **Heap**: the region shared by all threads where {{new}} allocates objects, managed by the GC; capped by {{-Xmx}}.
- **Eden / Survivor**: Eden is where new objects are born; the Survivor spaces are two small regions that keep objects which survived a young GC.
- **Old generation**: where long-lived objects live after being promoted from young.
- **Metaspace**: native memory (outside the heap) holding class metadata; it replaced PermGen in Java 8.
- **Native memory**: memory the process requests directly from the OS, outside the Java heap.
- **RSS**: Resident Set Size, the real RAM the process occupies — the number Kubernetes uses to decide on an OOMKill.
- **JIT**: the just-in-time compiler that turns hot bytecode into machine code and stores it in the code cache.
- **Direct buffer**: {{ByteBuffer.allocateDirect}}, memory outside the heap so that I/O does not have to copy data back and forth.

### Summary table

| Region | Holds | Symptom when it is the problem |
|---|---|---|
| Heap: young (Eden + 2 Survivor) / old | Java objects | OOM Java heap space; frequent Full GC |
| Metaspace | class and method metadata | OOM Metaspace; grows a little with every redeploy |
| Stack per thread | method frames | StackOverflowError; "unable to create native thread" |
| Code cache | JIT compiled code | "CodeCache is full", the JIT stops compiling and CPU goes up |
| Direct memory | ByteBuffer.allocateDirect, Netty | OOM direct buffer memory; RSS higher than Xmx |

### RSS diagram of a Java process
~~~text
RSS (the process's real RAM, e.g. 1.6 GB)
+-------------------------------------------+
| Heap (-Xmx1g)    [Eden|S0|S1|   Old     ] |  ~1.0 GB
| Metaspace + compressed class space        |  ~150 MB
| Thread stacks (200 threads, used pages)   |  ~100 MB
| Code cache (JIT)                          |  ~60 MB
| Direct buffers (Netty, NIO)               |  ~150 MB
| GC data structures, symbol, malloc...     |  ~140 MB
+-------------------------------------------+
=> RSS is always larger than Xmx; a few hundred MB of difference is normal
~~~

### How each region works (and why)
1. **Young gen**: new objects land in Eden. When Eden fills up, a young (minor) GC copies the surviving objects into a Survivor space and wipes Eden clean. Why it is cheap: most objects die young, so only a few of them have to be copied.
2. **Old gen**: an object that survives several minor GCs is promoted to old. Old is collected by major or mixed GC, which is slower because many objects are still alive. The young/old ratio and the promotion rate have a direct effect on throughput.
3. **Metaspace**: every loaded class creates metadata here. It is bounded by {{-XX:MaxMetaspaceSize}}; without that flag the only ceiling is RAM, so a classloader leak can eat the whole container's memory.
4. **Stack**: every platform thread gets a stack ({{-Xss}}, 1 MB by default on Linux x64; that number is the amount of **reserved address space**, and only pages actually used cost RAM). 10,000 OS threads means roughly 10 GB of reserved address space plus a lot of kernel resources — one reason virtual threads keep their stack on the heap instead.
5. **Code cache**: it is bounded ({{-XX:ReservedCodeCacheSize}}, 240 MB by default with tiered compilation). When full, the JIT stops compiling, new code runs in the interpreter, and performance erodes — a long-running service with lots of code often hits this.
6. **Direct memory**: its default ceiling ({{-XX:MaxDirectMemorySize}}) equals the maximum heap. Netty and many HTTP clients use direct buffers to avoid copying, so RSS being somewhat above Xmx is normal.

### Sorting out a problem
- Heap OOM or high RSS: enable {{-XX:+HeapDumpOnOutOfMemoryError}} for the heap angle and {{-XX:NativeMemoryTracking=summary}} for the native angle.
- Metaspace growing with every redeploy: almost certainly a classloader leak; open the Dominator Tree of a heap dump and look for old WebappClassLoader instances.
- "unable to create native thread": not a heap shortage — count the threads, check the stack size, {{ulimit -u}} and the cgroup pids limit.

~~~bash
jcmd <pid> GC.heap_info                  # how much heap is in use
jcmd <pid> VM.native_memory summary      # NMT must be enabled at startup
jcmd <pid> VM.metaspace                  # metaspace details
~~~

### Common mistakes
- **Raising Xmx to cure every OOM**: the symptom is that OOM Metaspace or Direct buffer memory keeps coming back, and the pod may even be OOMKilled sooner because the heap eats the room native memory needs. How to avoid: read the message after the colon before changing anything.
- **Assuming RSS equals the heap**: the symptom is a 2 GB pod with a 2 GB Xmx being OOMKilled (exit 137) with no OutOfMemoryError in the log. How to avoid: leave 25 to 40 percent of the limit for native memory.
- **An unbounded thread pool**: the symptom is "unable to create native thread" even though the heap is empty. How to avoid: a bounded pool, and a metric tracking the thread count.
- **No metaspace ceiling in an app that generates classes dynamically**: the symptom is RSS climbing over several days. How to avoid: set {{MaxMetaspaceSize}} so the failure shows up early and clearly, then fix the root cause.

### One-minute spoken answer
"The JVM has a heap split into young and old for objects, metaspace for class metadata in native memory, a stack per thread, a code cache for JIT code, and direct memory for NIO buffers outside the heap. Young is collected often and cheaply because most objects die young, while old is collected rarely but expensively. When something goes wrong I read the error message to narrow it down: Java heap space means the heap, Metaspace usually means a classloader leak, unable to create native thread means too many threads, and RSS above Xmx means native memory. The key trade-off is that inside a container the heap must not take the whole limit. In practice I always enable heap dumps on OOM and Native Memory Tracking; many times RSS growth turned out to be direct buffers while the heap was perfectly clean."

> Senior tip: always enable {{-XX:NativeMemoryTracking=summary}} in important environments; take a {{jcmd VM.native_memory baseline}} and compare a later {{summary.diff}} before concluding "the heap is leaking" — many times the growth in RSS was native memory (direct buffers, metaspace) while the heap stayed clean.`,
    follow: [
      'How does Metaspace differ from PermGen (before Java 8), and why was it changed?',
      'RSS is larger than Xmx — which tool do you reach for first?'
    ]
  }
});
