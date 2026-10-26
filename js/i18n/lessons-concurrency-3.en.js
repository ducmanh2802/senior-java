/*
 * English translation of js/data/lessons-concurrency.js — task T271. Format: js/core/i18n.js (content overlay).
 * ids: lesson-concurrency-003
 */
App.i18n.content({
  'lesson-concurrency-003': {
    title: 'ExecutorService and ThreadPoolExecutor: the core → queue → max → reject order, sizing, and shutdown',
    goals: [
      'Describe precisely in which order {{ThreadPoolExecutor.execute}} decides to create a thread, queue the task, or reject it',
      'Explain why the {{Executors.newFixedThreadPool}}/{{newCachedThreadPool}} factories are dangerous in production',
      'Estimate pool size for CPU-bound and IO-bound work, and choose a suitable rejection policy',
      'Use {{invokeAll}}, handle task exceptions, and shut down the pool correctly',
    ],
    body: `### Why you need a thread pool
Creating a platform thread is expensive: each thread is an OS thread with its own stack (about 1 MB of virtual memory by default on Linux x64), and both creation and teardown require system calls. Creating one thread per request means that under a sudden load spike the thread count grows without bound until memory runs out or the CPU does nothing but context switching. A thread pool solves two problems: **reusing** threads and **bounding** the number of tasks running concurrently.

### The six parameters of ThreadPoolExecutor
~~~java
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    4,                                      // corePoolSize: number of "resident" threads
    8,                                      // maximumPoolSize: ceiling on the number of threads
    30, TimeUnit.SECONDS,                   // keepAlive: a non-core thread idle over 30s is terminated
    new ArrayBlockingQueue<>(100),          // workQueue: a BOUNDED queue
    namedFactory("order-worker"),           // ThreadFactory: name threads so thread dumps are readable
    new ThreadPoolExecutor.CallerRunsPolicy() // when everything is full: the calling thread runs the task itself
);
~~~

### The order when submitting a task (the most-asked question)
{{execute(task)}} goes through exactly three steps:
1. Number of threads **< corePoolSize**: create a new thread with this task as its first task, **even when the other core threads are idle**.
2. Otherwise: try {{workQueue.offer(task)}}. If there is room, the task goes into the queue.
3. Queue full: if the number of threads **< maximumPoolSize**, create a new thread to run **this task immediately**; if max is already reached, call the **RejectedExecutionHandler**.

Important consequences:
- Non-core threads are **only created once the queue is already full**. With an unbounded queue, {{maximumPoolSize}} is meaningless: the pool never exceeds core size and tasks just pile up in RAM.
- A task that triggers a new thread in step 3 runs **before** the tasks sitting in the queue, so execution order is not strictly FIFO.
- With a {{SynchronousQueue}} (which holds no elements at all), {{offer}} only succeeds when some thread is already waiting to take a task, so nearly every task creates a new thread up to max.

| Factory | Actual configuration inside | Production risk |
|---|---|---|
| {{newFixedThreadPool(n)}} | core = max = n, unbounded {{LinkedBlockingQueue}} | The queue swells to OOM when downstream is slow; latency rises with no error reported |
| {{newCachedThreadPool()}} | core 0, max {{Integer.MAX_VALUE}}, {{SynchronousQueue}}, keepAlive 60s | A burst of load creates thousands of threads, native memory runs out |
| {{newSingleThreadExecutor()}} | 1 thread, unbounded queue | Same as fixed: the queue swells |
| {{newScheduledThreadPool(n)}} | unbounded delay queue; max has no effect | If a task throws an exception, its periodic schedule **stops silently** |

### Rejection policy
| Policy | Behavior | When to use |
|---|---|---|
| {{AbortPolicy}} (default) | Throws {{RejectedExecutionException}} | API returns 503/429 immediately, letting the client retry |
| {{CallerRunsPolicy}} | The thread calling {{execute}} runs the task itself | Natural backpressure for internal producers (the consumer reading the queue slows down) |
| {{DiscardPolicy}} | Drops the task without saying anything | Almost never a good idea; only for "loss-tolerant" data like sampled metrics |
| {{DiscardOldestPolicy}} | Drops the oldest task in the queue and retries | Data where only the latest value matters (GPS position, price) |

Be careful: CallerRunsPolicy on a Tomcat request-accepting thread means that HTTP thread is occupied running the task, which also slows down accepting new requests; that is exactly the backpressure, but you must understand it clearly before choosing it.

### Sizing: how many threads are enough
- **CPU-bound** (computation, compression, encryption): roughly the number of cores ({{Runtime.getRuntime().availableProcessors()}}); more than that only adds context switching.
- **IO-bound**: Brian Goetz's formula: {{threads = cores × (1 + wait time / compute time)}}. Example: 8 cores, each request waits 90 ms on the DB and computes 10 ms: 8 × (1 + 9) = 80 threads.
- Verify with **Little's law**: number of concurrent tasks = throughput × latency. You need 400 requests/s at 100 ms per request → about 40 tasks running in parallel. And remember the limit downstream: an 80-thread pool in front of a DB connection pool with only 10 connections means 70 threads sit waiting for a connection.

### Exceptions, invokeAll and shutdown
- {{execute(r)}}: an exception kills the worker thread (the pool creates a replacement) and it is printed by the uncaught exception handler.
- {{submit(c)}}: the exception is **wrapped inside the Future**; if nobody calls {{get()}}, the error disappears completely, with no log.
- {{invokeAll(tasks)}}: blocks until **every** task is done, returns a list of Futures **in the same order** as the task list; {{get()}} on the Future of a failed task throws {{ExecutionException}} whose cause is the original exception.
- {{shutdown()}}: stops accepting new tasks, finishes the already-accepted ones. {{shutdownNow()}}: interrupts the threads and returns the tasks that never ran. {{awaitTermination(timeout)}}: a bounded wait. A pool that is never shut down keeps its threads alive (non-daemon) and can prevent the JVM from exiting. From **Java 19**, {{ExecutorService}} is {{AutoCloseable}}: {{close()}} calls shutdown and then waits for all tasks, so it works with try-with-resources.

### Common production incidents
- Spring Boot's auto-configured task executor defaults to core 8, an **unbounded queue**, max {{Integer.MAX_VALUE}}: max is never used, and {{@Async}} piles millions of tasks in RAM when downstream is slow. Always set {{spring.task.execution.pool.queue-capacity}}.
- Creating a new pool **inside every request** and forgetting to shut it down: the thread count creeps up until {{OutOfMemoryError: unable to create native thread}}.
- A task in the pool waits for the result of another task in the **same pool** (a 4-thread pool, 4 parent tasks each waiting on a child task still sitting in the queue): thread starvation deadlock.
- No thread naming: thread dumps full of {{pool-7-thread-3}}, with no idea which pool belongs to which module.

### Interview relevance
The classic question: "core 4, max 8, queue 100: where does task 5 run? task 105?" (task 5 goes into the queue; task 105 creates a 5th thread because the queue is full). The senior-level additions: always use a bounded queue, choose a rejection policy that fits the business, name your threads, monitor {{getActiveCount}}/{{getQueue().size()}} via Micrometer ({{ExecutorServiceMetrics}}), and shut down with a timeout when the application stops.`,
    exercises: [
      {
        title: 'Build a bounded pool and verify the core → queue → max → reject order',
        prompt: `Write {{Pools.bounded(core, max, queueCapacity, namePrefix)}} returning a {{ThreadPoolExecutor}}:

- {{corePoolSize = core}}, {{maximumPoolSize = max}}, keepAlive 30 seconds.
- A queue **bounded** to exactly {{queueCapacity}} elements ({{ArrayBlockingQueue}}).
- Threads are named {{namePrefix-1}}, {{namePrefix-2}}, ... in creation order.
- When everything is full, throw {{RejectedExecutionException}} ({{AbortPolicy}}).
- Invalid arguments ({{core > max}}, {{queueCapacity < 1}}...) throw {{IllegalArgumentException}}.

The test keeps every task blocked with a latch, then counts threads and queue size after each submit to verify the exact core → queue → max → reject order, and checks which tasks run first.`,
        hints: [
          'Use the 7-argument constructor: {{new ThreadPoolExecutor(core, max, 30, TimeUnit.SECONDS, queue, factory, handler)}}.',
          'The ThreadFactory is a lambda {{r -> new Thread(r, namePrefix + "-" + seq.incrementAndGet())}} with {{seq}} an {{AtomicInteger}} (the factory may be called from multiple threads).',
          'You do not need to validate arguments yourself: {{ArrayBlockingQueue}} and the ThreadPoolExecutor constructor already throw {{IllegalArgumentException}} for the invalid cases.',
        ],
        explain: `The first test is the entire {{execute}} algorithm written as numbers: tasks 1–2 create core threads; tasks 3–5 go into the queue (the pool stays at 2 threads even though max is 4); tasks 6–7 find the queue full, so they create the 3rd and 4th threads and run **immediately**, overtaking tasks 3–5; task 8 is rejected. This is why "max" only means something with a bounded queue.

Common mistakes:
- Using {{new LinkedBlockingQueue<>()}} (no capacity passed): the queue is never full, the pool never exceeds 2 threads, nothing is ever rejected.
- Using a {{SynchronousQueue}}: there is no room to line up, so task 3 already creates a new thread.
- Counting thread names with a plain {{int}} instead of an {{AtomicInteger}}: the pool may call the factory from several different submitting threads.

If you want the pool to grow to max **before** queueing (the Tomcat style), you must write a custom queue whose {{offer}} returns false while more threads can still be created; the standard ThreadPoolExecutor does not support this.`,
      },
      {
        title: 'Run 1,000 jobs with invokeAll and shut down correctly',
        prompt: `Write {{JobRunner.runAll(jobs, threads, factory)}}:

- Create a fixed pool of exactly {{threads}} threads, **using the {{factory}} passed in** to create threads.
- Run every job with {{invokeAll}} and return results **in the same order** as {{jobs}}.
- If a job throws an exception, the result at that position is {{-1}}; the other jobs are unaffected.
- Before returning, the pool must be **shut down** and the threads must have terminated (the test checks that every thread created by the factory has died). If interrupted while waiting, restore the interrupt flag and throw {{IllegalStateException}}.
- An empty list returns an empty list.`,
        hints: [
          '{{Executors.newFixedThreadPool(threads, factory)}} takes the ThreadFactory as its second argument.',
          '{{invokeAll}} returns a {{List<Future<Integer>>}} in the same order; iterate over it and {{get()}} each one, catching {{ExecutionException}} to record {{-1}}.',
          'Put {{shutdown()}} and {{awaitTermination}} in a {{finally}}. When catching {{InterruptedException}}, call {{Thread.currentThread().interrupt()}} before rethrowing.',
        ],
        explain: `{{invokeAll}} fits the "fan-out then gather" model: it submits every task, waits for all of them to finish, then returns Futures in exactly the input order. Each job's exception is kept inside that job's Future, so one failing job does not break the others; you decide whether to turn it into a default value, collect them for reporting, or rethrow.

Shutdown in a {{finally}} is the most commonly forgotten part. A pool that is never shut down keeps its threads alive forever; in a real application (non-daemon threads) it can even block JVM exit or leak threads on every call. On Java 19+ you can write it compactly as {{try (ExecutorService pool = Executors.newFixedThreadPool(n, f))}} because {{close()}} shuts down and waits for you.

Common mistakes:
- Calling {{submit}} yourself in a loop and {{get()}} immediately in the same loop: the jobs run **sequentially**.
- Catching {{InterruptedException}} and ignoring it: code upstream (for example the application's shutdown routine) never learns the thread was asked to stop.
- Using the no-timeout {{invokeAll}} for jobs that make network calls: one hung job hangs the whole batch. There is an overload {{invokeAll(tasks, timeout, unit)}}: when time is up, unfinished tasks are cancelled and {{get()}} throws {{CancellationException}}.`,
      },
    ],
    check: [
      {
        q: 'Pool: core 4, max 8, {{ArrayBlockingQueue(100)}}. Every task runs for a very long time. What happens to task number 50?',
        options: ['A 5th thread is created because we are still below max', 'It goes into the queue', 'It is rejected', 'It waits until a core thread is free before being accepted'],
        explain: `The first 4 tasks create 4 core threads; tasks 5 through 104 go into the queue (100 slots). Non-core threads are only created when the queue is full, i.e. from task 105; from task 109 onward tasks are rejected. "Waits for a free thread before being accepted" is wrong because {{execute}} never blocks the caller: it either queues or rejects.`,
      },
      {
        q: 'Why is {{Executors.newFixedThreadPool(20)}} dangerous when downstream (DB, external APIs) slows down?',
        options: ['Because it creates threads without limit', 'Because the {{LinkedBlockingQueue}} is unbounded: tasks pile up in RAM, latency grows, and OOM is possible', 'Because it uses ForkJoinPool.commonPool', 'Because its threads are daemon so tasks are lost on shutdown'],
        explain: `A fixed pool has exactly 20 threads but an unbounded queue, so it never rejects: tasks accumulate in RAM and there is no backpressure. Unbounded threads are the problem of {{newCachedThreadPool}}. A fixed pool uses its own ThreadPoolExecutor, not the commonPool. Its threads are non-daemon by default.`,
      },
      {
        q: 'You {{submit()}} a task that throws {{NullPointerException}} and never call {{get()}}. What happens?',
        options: ['The stack trace is printed to stderr', 'The worker thread dies and the pool creates a new one', 'The exception sits silently in the Future, with no log at all', 'The pool shuts itself down'],
        explain: `{{submit}} wraps the task in a {{FutureTask}}; the exception is stored in the Future and only surfaces when {{get()}} is called. Printing the stack trace and the worker dying are the behavior of {{execute()}} (the exception escapes {{run}} to the uncaught exception handler). The pool never shuts itself down because a task failed.`,
      },
    ],
  },
});
