/*
 * English translation of js/data/labs-thread.js — task T443. Format: js/core/i18n.js (content overlay).
 * ids: lab-thread-006
 */
App.i18n.content({
  'lab-thread-006': {
    title: '20:00 campaign: the quote API hangs forever, 16 quote-pool threads all waiting in join()',
    scenario: `**Context:** **PayVN Checkout** (Spring Boot 3.4, Java 21, 4 vCPU pod) exposes {{POST /checkout/quote}}, which computes the final price of a shopping cart. To "run things in parallel for speed", {{QuoteService}} does the pricing work on a dedicated executor, {{quoteExecutor = Executors.newFixedThreadPool(16)}} (its threads are named {{quote-pool-N}}). Inside the pricing task, the code submits two more child tasks (shipping fee, voucher) to **that same executor** and then {{join()}}s them. The controller waits for the result with {{future.get(3, SECONDS)}}.

**Symptoms:** On a normal day (~60 req/s) it had never failed. At **20:00:04 on 24/10/2026** the campaign opened and traffic climbed to ~900 req/s. From **20:00:06** every {{/checkout/quote}} request returned **504 after exactly 3 seconds**, even after traffic had fallen back to 50 req/s at 20:20. Pod CPU was only **2–3%**, and the database plus both downstream services (shipping fee, voucher) were completely healthy — in fact they received almost **no requests at all** from checkout after 20:00:06. There was no exception other than {{TimeoutException}}. Restarting the pod fixed it, until the next traffic spike.

**Data collected:** {{jcmd 1 Thread.print -l}} at 20:07:15, executor metrics from Micrometer, the application log and the {{QuoteService}} source.`,
    questions: [
      'Why does a pool of 16 threads hang forever while CPU is near zero and the downstream services are idle? Back it up with the dump and the metrics.',
      'Why does jstack report no deadlock even though the system is completely stuck? What is this phenomenon called?',
      'How would you fix it (short term and long term), and how would you write a test that reproduces the bug before it reaches production?'
    ],
    hints: [
      'Count the quote-pool threads and look at what all 16 are doing: they are all stopped at {{buildQuote(QuoteService.java:74)}}, i.e. they are in {{join()}} waiting for a child task.',
      'Where are the child tasks submitted? If all 16 threads are busy waiting, who is left to take the child tasks off the queue and run them?',
      'Metrics: {{active=16}}, {{queued}} climbing steadily, {{completed_total}} frozen at 1208344 since 20:00:06, and downstream receives 0 requests. This is a thread-starvation deadlock (pool-induced deadlock), not a lock deadlock.'
    ],
    answer: `**Summary:** This is a **thread-starvation deadlock** (also called a pool-induced deadlock): the parent task runs on {{quoteExecutor}}, submits its child tasks to **that very executor**, and then {{join()}}s and waits for them. At 20:00:05 the traffic spike made all 16 threads run parent tasks at the same moment; their child tasks sat at the back of the queue and **no free thread was left to run them**, so the 16 threads wait on each other forever. Fix: never block waiting for a child task on the same bounded pool — use a separate executor for child tasks (or call them synchronously), or compose the results without blocking using {{thenCombine}}, and always put a timeout on the wait.

### Understanding the root: how a fixed thread pool works

Picture a service counter with **16 clerks** (16 threads) and **an infinitely long queue** (an unbounded LinkedBlockingQueue). Customers (tasks) line up, and a free clerk calls the next customer. A clerk can only serve one customer at a time.

Now imagine every customer also asks: "I need two more supporting documents; take a ticket for them and **I will stand right here at the counter** until they are ready." The documents have to join the **same queue**, and one of the **same 16 clerks** has to process them. On a quiet day: 3 clerks are busy, 13 are idle, so the documents are handled immediately and everything flows. On campaign day: 16 customers reach the counter at the same instant, all 16 clerks stand there waiting for the documents, and those documents are sitting in the queue **behind** hundreds of other customers. Nobody is free to process them, so nobody ever finishes. That is "thread starvation" turning into a permanent hang.

~~~text
quoteExecutor (16 threads)                   LinkedBlockingQueue (unbounded)
+--------------------------------+             +----------------------------------------+
| quote-pool-1 : PARENT#1 join   |--wait--+    | PARENT#17 | PARENT#18 | ... | CHILD1#1 |
| quote-pool-2 : PARENT#2 join   |--wait--|--> | ... CHILD1#2 | CHILD2#2 ... CHILD1#16  |
| ...                            |        |    +----------------------------------------+
| quote-pool-16: PARENT#16 join  |--wait--+       ^ child tasks sit here, no one takes them out
+--------------------------------+
Stuck condition: number of PARENT tasks running = pool size (16) AND each PARENT waits for a CHILD on the same pool.
~~~

Why does it never fail on a normal day? At 60 req/s each quote takes ~60 ms, so on average only ~4 parent tasks run concurrently, and there are always idle threads for the child tasks. The failure only appears when **the number of concurrent parent tasks reaches 16** — exactly what the 900 req/s burst did. And once it is stuck it **never recovers on its own**, because {{join()}} has no timeout; traffic falling back to 50 req/s changes nothing.

### Why jstack does not report a deadlock

The JVM only detects deadlocks shaped like a **lock cycle**: thread A holds monitor/lock X and waits for Y, thread B holds Y and waits for X (a {{synchronized}} monitor, or an ownable synchronizer such as {{ReentrantLock}}). Here no thread **holds** anything another thread is waiting for: each quote-pool thread waits on its own {{CompletableFuture$Signaller}} (16 different ids), i.e. it waits for a **future event** ("the future completes"). The JVM has no idea that this future depends on a pool thread becoming free. So the dump contains no "Found one Java-level deadlock" line — yet in essence this is still a deadlock on a resource (the resource being the pool's threads). The {{ThreadPoolExecutor$Worker}} entry under "Locked ownable synchronizers" is just the worker's internal lock, held while it runs a task, and is unrelated.

One more detail: the stack shows {{ForkJoinPool.managedBlock}} → {{unmanagedBlock}}: {{CompletableFuture}} has a "tell the pool I am about to block" mechanism so that **ForkJoinPool** can create compensation threads. But the thread running here is an ordinary {{ThreadPoolExecutor}} thread, so it takes the {{unmanagedBlock}} branch: **no compensation thread is created**.

### Evidence from the artifacts

- All **16** threads {{quote-pool-1..16}} are in {{WAITING (parking)}} on a {{CompletableFuture$Signaller}}, with the stack {{join}} ← {{buildQuote(QuoteService.java:74)}} ← {{lambda$quoteAsync$0(QuoteService.java:52)}}: the thread is running a **parent task** and waiting for a **child task**. No thread in the pool is running a child task.
- Code lines 66–74: the child tasks are submitted to {{quoteExecutor}} — the same pool as the parent task; and {{join()}} has no timeout.
- Metrics: {{active_threads=16}} = pool size; {{queued_tasks}} rose from 41 (20:00:05) to **50,994** (20:07); {{completed_tasks_total}} **frozen at 1,208,344** since 20:00:06 → the pool completed no further task for 7 minutes.
- Downstream {{/shipping/fee}} and {{/voucher/best}} received **0 requests** after 20:00:06: the child tasks were never run, which rules out the "slow downstream" hypothesis.
- CPU 104m/4000m: every thread is parked and nothing is doing work. The HTTP thread ({{http-nio-8080-exec-118}}) waits in {{get(3s)}} and then returns 504 → matching the log line "quote timeout after 3000ms".
- Memory grew from 1.2Gi to 1.9Gi: the unbounded queue accumulated 50,994 tasks (each one holding an {{Order}} plus its cart) — left long enough, that turns into an OOM.

### Fix

**Short term (stop the bleeding):** restart the pod to free the 16 threads; temporarily switch the child tasks to **synchronous calls** inside the parent task (you lose parallelism but cannot get stuck), or split the executor as shown below — this is a small change that can go out as a hotfix.

**Root fix — never block waiting for a child task on the same pool:**

~~~java
// Option 1: a SEPARATE executor for the child tasks (bulkhead), bounded, with timeouts
CompletableFuture<Quote> quoteAsync(Order o) {
    CompletableFuture<Fee> fee = CompletableFuture
        .supplyAsync(() -> shippingClient.fee(o), ioExecutor)     // a different pool from quoteExecutor
        .orTimeout(800, TimeUnit.MILLISECONDS);                   // never wait indefinitely
    CompletableFuture<Voucher> voucher = CompletableFuture
        .supplyAsync(() -> voucherClient.best(o), ioExecutor)
        .completeOnTimeout(Voucher.NONE, 500, TimeUnit.MILLISECONDS); // soft fallback
    // Option 2: COMPOSE without blocking — no thread sits waiting in join()
    return fee.thenCombine(voucher, (f, v) -> Quote.of(pricing.base(o), f, v));
}
~~~

With {{thenCombine}} the parent task **no longer exists**: the callback runs only when both futures are done, on whichever thread completes the last one. No thread sits waiting, so thread starvation is impossible.

**Option 3 (Java 21):** use {{Executors.newVirtualThreadPerTaskExecutor()}} for the quote flow: one virtual thread per task, and {{join()}} only parks the virtual thread and hands its carrier back, so there is no "16 slots" resource to exhaust. But you must bound the load on downstream yourself (Semaphore, connection pool), because virtual threads do not limit concurrency on their own.

**Long term:**
- A **bounded** queue ({{ThreadPoolExecutor}} with {{ArrayBlockingQueue(500)}} plus a RejectedExecutionHandler that returns 503 fast) instead of an unbounded {{newFixedThreadPool}} — failing fast beats accumulating 50k tasks in RAM.
- Every {{join()/get()}} must have a timeout; every pool must expose {{active/queued/completed}} metrics and an alert for "completed is not increasing while queued is".

### Reproducing it in a test

Set the pool size to 2 in the test and submit two parent tasks at the same time with a {{CountDownLatch}} so that both are guaranteed to be running before either submits its child task; with the old code the test hangs — wrap it in {{assertTimeoutPreemptively(Duration.ofSeconds(2), ...)}} so the test **fails** instead of hanging CI. The general rule: starvation bugs surface when **the number of concurrent tasks ≥ pool size**, so test with a small pool.

### Comparison of the options

| Approach | Can it get stuck? | Parallel? | Notes |
|---|---|---|---|
| Child task on the same pool + join | Yes, when load ≥ pool size | Yes | The original bug |
| Synchronous call inside the parent task | No | No | Simple, ~40 ms slower |
| Separate executor for child tasks | No (if child tasks never wait back) | Yes | Needs timeouts, bulkhead |
| Non-blocking thenCombine | No | Yes | Best; async code |
| Virtual thread per task | No | Yes | Java 21, bound downstream yourself |

### Common mistakes

- Using {{ForkJoinPool.commonPool()}} (the default of {{supplyAsync}} when no executor is passed) for IO-calling tasks that join nested tasks: the commonPool only has {{number of CPUs - 1}} threads, so it gets stuck even faster.
- Raising the pool from 16 to 64 and calling it done: that only pushes the stuck threshold higher; a bigger burst still sticks it.
- Reading a jstack that has no "deadlock" section and concluding "it is not a deadlock" — you have to look at what **every** thread in the pool is waiting for.
- Using {{CallerRunsPolicy}} on a pool whose tasks wait for child tasks: the HTTP thread ends up running the parent task and can wait forever too.

### One-minute spoken answer

"All 16 quote-pool threads are in join at QuoteService line 74, waiting for child tasks that were submitted to the same pool. When the burst made 16 parent tasks run at once, the child tasks sat at the back of the queue with no free thread left, so it is stuck forever: completed frozen, queued climbing to 50 thousand, downstream receiving no requests, CPU near zero. The JVM does not report a deadlock because there is no lock cycle — this is a thread-starvation deadlock. I would fix it by giving the child tasks their own executor or composing with non-blocking thenCombine, adding timeouts to every join, bounding the queue, and alerting when completed stops increasing."

> Senior tip: When I review code that uses {{CompletableFuture}}, I always ask two questions: "Which pool does this task run on?" and "Is there any join/get inside another task on the same pool?". One very cheap alert catches this whole class of bug: {{rate(executor_completed_tasks_total[1m]) == 0 and executor_queued_tasks > 0}} for one minute. In the systems I have worked on, that alert caught starvation before customers ever reported a problem.`,
    rubric: [
      'Names it correctly and explains the mechanism: thread-starvation deadlock — the parent task on quoteExecutor joins child tasks that are also submitted to quoteExecutor; once 16 parent tasks run at the same time, no thread is left to run the child tasks.',
      'Evidence: all 16 quote-pool threads WAITING in join at QuoteService.java:74 (lambda quoteAsync at line 52), active=16, queued climbing to 50994, completed_total frozen at 1208344, downstream receiving 0 requests, CPU near zero.',
      'Explains why jstack reports no deadlock (no lock cycle; each thread waits on its own CompletableFuture$Signaller; unmanagedBlock creates no compensation thread) and why it only happens under a traffic spike and never recovers on its own.',
      'Proposes a fix: a separate executor, non-blocking thenCombine, or virtual threads; timeouts on join/get; a bounded queue with fast rejection; metrics/alerts; and a reproducing test with a small pool.'
    ]
  }
});
