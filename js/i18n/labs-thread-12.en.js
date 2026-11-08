/*
 * English translation of js/data/labs-thread.js — task T1006. Format: js/core/i18n.js (content overlay).
 * ids: lab-thread-012
 */
App.i18n.content({
  'lab-thread-012': {
    title: 'Thread pool frozen because parent tasks wait for child tasks on the same fixed 8-thread pool',
    scenario: `**Context:** **PayVN Reconcile** (Java 21, Spring Boot 3.4) generates end-of-day reconciliation reports. Each report is split into multiple independently computed "chunks" (partitions). The code uses a fixed {{ExecutorService}} of **8 threads** ({{Executors.newFixedThreadPool(8)}}) with an **unbounded** {{LinkedBlockingQueue}} (a property of {{newFixedThreadPool}}). For each partition, a **parent task** is {{submit}}ted to the pool; inside the parent task it {{submit}}s several **child tasks** (computing each chunk) to **the same pool** and then calls {{future.get()}} to wait for the results.

**Background terms (quick read):** An {{ExecutorService}} is a "thread pool" — you hand in tasks ({{Runnable}}/{{Callable}}) and the pool uses idle threads to run them. {{submit()}} returns a {{Future}} — a claim ticket; {{future.get()}} **blocks** the current thread until the corresponding task finishes and returns a result. A "fixed 8-thread pool" means there are exactly 8 workers and at most 8 tasks run at the same time; extra tasks line up in the queue.

**Symptoms:** At **02:10 on 2026-11-06** (when the reconciliation job runs), report throughput drops to 0 after ~5 seconds: **no further reports complete** and the job hangs indefinitely. Pod CPU is **~1%** (doing almost nothing), heap is stable, DB shows {{active=3/30 pending=0}}, no exceptions, no OOM. The pool's queue grows (the metric counting waiting tasks keeps rising) but no task completes. Restarting the pod lets it run for a while, then it gets stuck again once the data volume is large enough.

**Data collected:** {{jcmd 1 Thread.print}} at 02:13:40, pool metrics (measured via a wrapper), and the {{ReconcileService}} code snippet.`,
    questions: [
      'Explain why all 8 threads are {{WAITING}} at {{FutureTask.get}} and no thread is running {{computeChunk}}. Why is the queue holding 137 tasks with no progress? Is this a deadlock in the sense of the JVM reporting "Found one Java-level deadlock"?',
      'Describe the conditions required for this failure to occur (relate pool size, the number of parent tasks, and parent tasks submitting child tasks then calling {{get()}} on the same pool). Why does it sometimes run for a while before getting stuck?',
      'Propose a safe fix: separate pools, use {{invokeAll}}, or remove the nesting; mention using {{get(timeout)}} / bounding the queue to reduce blast radius. Compare with {{ForkJoinPool}} + {{ManagedBlocker}} (hint).'
    ],
    hints: [
      'Count the {{reconcile-pool-*}} threads: exactly 8, matching {{pool.size=8}}, and all stopped at {{aggregatePartition(ReconcileService.java:72)}} → {{FutureTask.get}}. "Active" = 8, "completed" is frozen. So what are these 8 "workers" doing? Are they running {{computeChunk}}, or are they **sitting and waiting** for {{computeChunk}} results?',
      'Child tasks ({{computeChunk}}) are {{submit}}ted to **the same pool** (the same queue). The queue holds 137 items but **there are no idle threads** to pull a task out and run it, because all 8 threads are blocked on {{get()}}. Child tasks sit in the queue → nobody runs them → {{get()}} never returns. This is a **thread starvation deadlock** (stuck due to thread starvation), different from a circular monitor deadlock, so the JVM does **not** print "Found one Java-level deadlock".',
      'Condition: the number of concurrent parent tasks occupies every thread in the pool (= pool size) and each parent blocks waiting for children that also need a thread from that same pool. At first, with few partitions, some parents finish before the pool saturates; once enough partitions run concurrently, all 8 slots are held by parents → permanently stuck.'
    ],
    answer: `**Summary:** This is a **thread starvation deadlock** (stuck due to thread starvation / pool-induced deadlock): **parent** tasks ({{aggregatePartition}}, submitted at line 48) occupy all 8 threads of the pool and each thread calls {{FutureTask.get()}} (line 72) to wait for **child** tasks ({{computeChunk}}) — but the child tasks are also {{submit}}ted to **that same 8-thread pool**. When all 8 threads are parent tasks and all are blocking on {{get()}}, **no thread is left idle** to pull a child task out of the queue ({{queue.size=137}}). Child tasks never run → {{get()}} never returns → all 8 threads wait forever, {{completedTask}} stays frozen, CPU ~1%. The JVM does not report "Found one Java-level deadlock" because there is no **circular monitor/lock** cycle of the classic kind; this is a resource (thread) deadlock caused by an inverted dependency.

### Visualizing the mechanism (everyday analogy)

Imagine a kitchen with exactly **8 chefs** (8 threads) and a queue of order tickets (the queue). Each "combo dish" (parent task) is handled by 1 chef: that chef writes 3 "side dish" tickets (child tasks), drops them into **the same ticket queue**, then **stands still waiting** for the 3 side dishes to be done before assembling the combo ({{get()}}). If at any point all 8 chefs are working on combo dishes and all are standing around waiting for side dishes, then **nobody is free** to cook the side dishes — even though the side-dish ticket queue is full. Everyone waits forever. Nobody is fighting over anyone's knife (no monitor deadlock); there are simply no people left.

~~~seq
title: 8-thread pool - parents wait for children on the same pool (stuck)
actors: Parent1..8(thread) | Queue | ChildTasks
Parent1..8(thread) -> Queue: submit computeChunk (child task)
Parent1..8(thread) -> Parent1..8(thread): FutureTask.get() BLOCK/WAITING for child to finish
note Queue: 137 child tasks waiting, NO idle thread to pick them up
Queue -> Parent1..8(thread): (never happens) because 0 threads are idle
~~~

### Dump analysis (matching the numbers)

- **8 threads, all in the same state:** {{reconcile-pool-1}}..{{reconcile-pool-8}} (exactly the pool core=max=8, {{pool.size=8}}, {{activeCount=8}}) are all {{java.lang.Thread.State: WAITING (parking)}} at {{FutureTask.get}} (line 190) ← {{aggregatePartition(ReconcileService.java:72)}} ← lambda {{run$0}} (line 48) ← {{FutureTask.run}} ← {{ThreadPoolExecutor.runWorker}}. This means every thread **is executing a parent task** and is blocking on {{get()}} waiting for a child task.
- **What they are waiting for:** each thread shows {{- parking to wait for <0x...> (a java.util.concurrent.FutureTask)}} — the different FutureTask addresses ({{0x...0028, 0090, 00f8, 0160, 01c8, 0230, 0298, 0300}}) are the tickets for the various child tasks. No thread is running {{computeChunk}}.
- **A queue full of tasks but no execution:** {{queue.size=137}}, {{completedTask=0}} (frozen). Child tasks have been submitted (they sit in the {{LinkedBlockingQueue}}) but a {{ThreadPoolExecutor}} only pulls tasks from the queue when a worker enters the {{runWorker/getTask}} loop — and all 8 workers are stuck inside {{FutureTask.get}}, never returning to the task-fetch loop. So the queue can grow without bound while progress stays at 0.
- **Not a monitor deadlock:** the dump explicitly states "NO 'Found one Java-level deadlock' line". The JVM only detects a deadlock when there is a cycle waiting on **monitors/ownable synchronizers** ({{synchronized}}, {{ReentrantLock}}). {{FutureTask.get()}} uses {{LockSupport.park}} to wait for a task result — it does not create a monitor cycle the JVM recognizes. The {{Locked ownable synchronizers}} ({{ReentrantLock$NonfairSync}}) are internal locks of the {{ThreadPoolExecutor}} worker, not a cycle.
- **Deceptively healthy:** CPU ~1% ({{parked}} threads consume no CPU), DB is idle, heap is stable, no exceptions — easy to misdiagnose as "a slow job" or "DB hang" without looking at a jstack.

### Conditions for occurrence (why it runs for a while, then gets stuck)

- **Sufficient condition:** (1) a parent task runs **on** pool P and (2) inside the parent it {{submit}}s child tasks to **the same** pool P and then (3) {{get()/join()}} waits for the children **with no timeout**, while (4) the number of concurrent parent tasks holding threads >= the pool size. When (4) holds, every thread of P is a parent that is waiting → nobody runs the children → permanently stuck.
- **Why it recovers then sticks again:** at first the number of partitions is small, so a few parent tasks hold < 8 threads or interleave and complete (children get a chance to run in between before a parent calls {{get}} immediately), so progress continues. With a larger batch (many partitions submitted close together), 8 parent tasks manage to occupy all 8 threads before the children finish → it falls into a saturated state it cannot escape. {{newFixedThreadPool}} uses an **unbounded** {{LinkedBlockingQueue}}, so the queue grows forever (risk of OOM) instead of rejecting tasks.
- **Restart is only "firefighting":** the stuck state lives in the task-dependency structure at that moment; repeating the same data will reproduce it.

### Fix

**Principle:** a task running on pool P **must not** block waiting for another task that it itself submitted to **the same** bounded pool P. (Break the resource-dependency cycle.)

**1) Separate pools (simplest and clearest):**
~~~java
// parent (orchestration) pool and child (computation) pool are SEPARATE, both bounded
private final ExecutorService parentPool = Executors.newFixedThreadPool(4);
private final ExecutorService childPool  = Executors.newFixedThreadPool(8);

PartitionReport aggregatePartition(Partition p) throws Exception {
    List<Future<ChunkSum>> children = new ArrayList<>();
    for (Chunk c : p.chunks()) {
        children.add(childPool.submit(() -> computeChunk(c))); // children go to childPool
    }
    long total = 0;
    for (Future<ChunkSum> f : children) {
        total += f.get(30, TimeUnit.SECONDS).value(); // with a timeout (see below)
    }
    return new PartitionReport(p.id(), total);
}
~~~
Parents hold threads from {{parentPool}} and wait; children run on {{childPool}} independently → children always have threads to run. Name the threads, bound the queues, and set a {{RejectedExecutionHandler}} for both.

**2) Remove nesting — let the parent compute children sequentially and parallelize at only one level:**
~~~java
// Parallelize only by partition (1 level). Compute chunks inside a partition sequentially.
PartitionReport aggregatePartition(Partition p) {
    long total = 0;
    for (Chunk c : p.chunks()) total += computeChunk(c).value(); // no submit, no get
    return new PartitionReport(p.id(), total);
}
~~~
This loses chunk-level parallelism but eliminates the risk of getting stuck entirely; it is often fast enough if a chunk is already a sensible unit of work. Measure before adding complexity.

**3) Use {{invokeAll}} / aggregate only after completion (single-phase fork-join):** submit all child tasks at once, collect the {{Future}}s, then {{get}} — but do this **from a thread that does NOT belong to the pool running the children** (e.g. the thread calling {{run}}), or use {{invokeAll}} to run and wait according to {{ExecutorService}} semantics. Avoid the pattern "a thread of pool A submits into A and then waits on its own submissions".

**4) {{ForkJoinPool}} + {{ManagedBlocker}} (advanced):** a {{ForkJoinPool}} can compensate by adding threads when a task declares it will block ({{ForkJoinPool.managedBlock}}), so {{ForkJoinTask.join()}} / some APIs can avoid starvation within the same {{ForkJoinPool}}. But the code must use {{ForkJoinTask}} / {{ManagedBlocker}} correctly; {{Future.get()}} on an {{ExecutorService}} is generally **not** compensated. Use this only if the team understands it well.

**Reduce blast radius (recommended regardless of which approach you choose):**
- **{{get(timeout, unit)}} instead of {{get()}}:** a hang/error throws {{TimeoutException}} instead of blocking forever; catch it, cancel the task ({{future.cancel(true)}}), and log + emit a metric. Note that {{cancel(true)}} only interrupts — {{computeChunk}} must respect interruption.
- **Bound the queue:** replace {{newFixedThreadPool}} (unbounded) with {{new ThreadPoolExecutor(n,n,0,SECONDS,new ArrayBlockingQueue<>(M), handler)}} and a {{RejectedExecutionHandler}} (fail fast / {{CallerRunsPolicy}} with care). An unbounded queue hides backpressure and causes OOM.
- **Monitoring:** alert when {{activeCount == poolSize}} persists while {{completedTaskCount}} stops increasing, or when {{queueSize}} crosses a threshold; export clear pool names.

### Quick comparison

| Approach | Prevents stuck state? | Complexity | Notes |
|---|---|---|---|
| Separate parent/child pools | Yes | Low-medium | Clear, requires tuning 2 pools |
| Remove nesting (1 parallel level) | Yes | Low | Simple, may be slower |
| ForkJoinPool + ManagedBlocker | Yes (when used correctly) | High | Easy to misuse, needs deep understanding |
| Keep as-is + only add timeout | No (still starves), only avoids hanging forever | Low | Limits blast radius, not a root-cause fix |

### Common pitfalls

- Thinking "8 threads is plenty" — the stuck state depends on the **dependency structure** (parents waiting for children on the same pool), not on the absolute number; a 100-thread pool also gets stuck if 100 parents all wait for children on that pool.
- Increasing {{nThreads}}: it only delays the moment of saturation (more partitions are needed to saturate it); it does not fix the root cause.
- Using {{supplyAsync}} / {{CompletableFuture}} with defaults: these also fall back to the shared {{ForkJoinPool.commonPool()}} — the same class of problem.
- Confusing this with a monitor deadlock: searching for "lock held" cycles will find nothing; you must look at {{FutureTask.get}} + "who runs the task that {{get}} is waiting for".
- Forgetting to put a timeout on {{get()}} on production paths: one stuck occurrence = hangs forever.

> Senior tip: Anywhere you {{submit}} task A and inside A you {{submit}}+{{get/join}} task B, ask yourself: "Does B run on the **same** bounded pool as A?". If yes, that is a landmine. Code-review rules: (1) never block waiting for child tasks on the same bounded {{ExecutorService}}; (2) parallelize at **one level** unless you have measured evidence otherwise; (3) every {{Future.get}} on a production path must have a timeout; (4) pools must have a bounded queue + metrics (active, queue, completed) + an alert for "completed frozen while active==max". Drawing a parent→child dependency diagram per pool before coding is far cheaper than debugging a jstack at 2 a.m.`,
    rubric: [
      'Identifies that all 8 threads {{reconcile-pool-1..8}} are {{WAITING}} at {{FutureTask.get}} ({{aggregatePartition ReconcileService.java:72}} ← {{lambda run$0:48}}) waiting for child {{FutureTask}}s; {{activeCount=8 == pool.size}}, {{completedTask=0}}, {{queue.size=137}} holds child tasks but no thread is idle to run {{computeChunk}}. Correctly concludes: thread starvation / pool-induced deadlock, NOT a circular monitor deadlock, so the JVM does not print "Found one Java-level deadlock".',
      'Explains the condition: parent tasks running on pool P submit child tasks to the same P then block on {{get()}}; when the number of concurrent parents >= pool size, every thread of P is held waiting for children → nobody runs the children. Mentions why it runs for a while then gets stuck (not yet saturated → saturated) and that the unbounded {{LinkedBlockingQueue}} grows but does not help.',
      'Proposes a root-cause fix: separate parent/child pools or remove nesting (parallelize at 1 level) or an appropriate fork-join mechanism ({{invokeAll}} from an outside thread, hint {{ForkJoinPool+ManagedBlocker}}); plus blast-radius reduction: {{get(timeout)}}, bounded queue + {{RejectedExecutionHandler}}, metrics/alerts (completed frozen, active==max).'
    ]
  }
});
