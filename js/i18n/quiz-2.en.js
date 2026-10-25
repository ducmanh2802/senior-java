(function () {
  'use strict';
  App.i18n.content({
    'qz-modern-005': {
      q: 'In Java 21, when writing a switch expression on a sealed interface, which of the following is true?',
      options: [
        'A default branch is always mandatory, even if all permitted subclasses are already listed',
        'Switch expressions only support String, Enum, and primitive types; they do not support sealed types',
        'Switch must be exhaustive: if there is no default branch, the compiler requires a branch for every permitted subclass, and missing one causes a build failure',
        'The exhaustiveness of branches is checked by the IDE, not the compiler'
      ],
      explain: `**Correct answer: Switch must be exhaustive: if there is no default branch, the compiler requires a branch for every permitted subclass, and missing one causes a build failure.**

### Explanation
Sealed classes/interfaces limit the set of allowed subclasses (via {{permits}}), so the compiler knows all possible states. Switch expressions (and switch with patterns) must be **exhaustive**: if there is no {{default}} branch and a subclass is missing, the compiler reports a compilation error. Once all branches are covered, you **do not need** a {{default}} branch; the compiler automatically inserts an hidden branch that throws {{MatchException}} (Java 21) in case a new subclass is compiled separately without recompiling the switch. This is a major advantage over traditional switches: adding a new subclass will break the build and force you to update the logic—which is safer than if-else.

~~~java
sealed interface Payment permits Card, Bank, Wallet {}

int fee(Payment p) {
    return switch (p) {
        case Card c   -> 2;
        case Bank b   -> 1;
        case Wallet w -> 0;
    };                                   // adding a new subclass -> build fail if branch is missing
}
~~~

### Why the other options are wrong
- **A default branch is always mandatory**: Incorrect. With sealed types where all subclasses are listed, {{default}} is unnecessary—and **should not** be added, as it would "swallow" new subclasses, causing the loss of compile-time warnings. {{default}} is only mandatory when the selector has an open type like {{Object}}.
- **Only support String, Enum, and primitive types**: True for traditional {{switch}}, but Java 21 supports pattern matching for all reference types.
- **Checked by the IDE**: Incorrect; this is a language feature: the compiler enforces exhaustiveness.

> Senior tip: sealed types + switch pattern are tools to **eliminate if-else at the language level**, and they are especially useful for state machines (e.g., order states: placed, processing, completed, cancelled). Remember that when adding a new state, the compiler forcing you to update all switch statements is a feature, not an annoyance.`
    },
    'qz-modern-006': {
      q: 'Regarding {{var}} in Java 10+, which statement is correct?',
      options: [
        'var cannot be used for fields, and cannot be used for lambda parameters',
        'var cannot be used if an initializer is missing or is null, and cannot be used as a return type or parameter type for methods',
        'var cannot be used with primitive arrays, so the type must be explicitly declared for all arrays',
        'None of the above are correct, as var can be used everywhere a variable is declared'
      ],
      explain: `**Correct answer: var cannot be used if an initializer is missing or is null, and cannot be used as a return type or parameter type for methods.**

### Explanation
{{var}} is **local variable type inference**: the compiler reads the initializer to infer the type. Without an initializer, there is nothing to infer; if the initializer is {{null}}, there is no specific type. Furthermore, {{var}} is not a real type, so it cannot be used as a method return type, parameter type, or type argument like {{List<var>}}.

### Why the other options are wrong
- **Cannot be used for fields and lambda parameters**: Only partially correct, making the whole statement wrong. {{var}} indeed **cannot** be used for fields ({{private var count = 0;}} is a compilation error), but from Java 11 onwards, it can be used for lambda parameters: {{(var a, var b) -> ...}} (useful when annotations like {{@NonNull var a}} are needed).
- **Cannot be used with primitive arrays**: Incorrect. {{var arr = new int[5];}} is valid and infers the type {{int[]}} (only array initializers, i.e., {{var arr = {1, 2};}}, are invalid).
- **Can be used everywhere**: Incorrect, as stated above.

### When to use, when not to
Use when the type is obvious but the variable declaration is long and noisy: {{var order = orderService.create(request);}}. Do not use when the inferred type is a broad interface but you need a specific type, and do not use in public APIs because readers cannot see the type.

> Senior tip: {{var}} makes code concise but can reduce readability when reading code far from its declaration (especially in web reviews without IDE type hints). A personal rule that works well: only use {{var}} when the type can be inferred from the variable name itself, for example {{var order = orderService.create(request);}}.`
    },
    'qz-concurrency-001': {
      q: 'With {{volatile int counter}} incremented by multiple threads in a loop, which statement is true?',
      options: [
        'volatile ensures that each ++ operation is atomic, so the final counter is correct',
        'volatile ensures write ordering between different variables, so the final sum is always correct',
        'volatile forces the CPU to not cache the value in a register, so the result is always correct',
        'volatile only ensures visibility when reading, not the atomicity of read-modify-write operations'
      ],
      explain: `**Correct answer: volatile only ensures visibility when reading, not the atomicity of read-modify-write operations.**

### Explanation
{{counter++}} consists of three operations: reading the value, incrementing, and writing back. {{volatile}} only ensures that read operations always see the latest value written by other threads, but it does not make the three operations an atomic command. Two threads can both read the value 5, both calculate 6, and both write 6—losing one increment. This is a **lost update** error, not a visibility error.

### Why the other options are wrong
- **++ is atomic**: Only true for {{AtomicInteger}} and other atomic classes, not for {{volatile}}.
- **CPU does not cache the value**: This is an intuitive explanation for visibility, but it does not address atomicity; two threads can still both read an old value and overwrite it.
- **Ensures write ordering**: {{volatile}} does create a happens-before relationship (any write before a volatile write is visible to a thread reading that volatile variable afterwards), but ordering and visibility do not transform {{++}} into an atomic operation, so updates are still lost.

### The correct way
~~~java
private final AtomicLong counter = new AtomicLong();
counter.incrementAndGet();          // atomic
// or when contending heavily:
// private final LongAdder counter = new LongAdder();  // higher throughput
~~~

> Senior tip: quick rule of thumb: need **visibility**? Use {{volatile}}. Need **atomicity**? Use {{Atomic*}} or {{synchronized}}. Need **both plus multi-state consistency**? Use locks. For counters heavily contended (metrics, request counts), {{LongAdder}} is better than {{AtomicLong}} because it uses multiple cells to reduce contention on cache lines.`
    },
    'qz-concurrency-002': {
      q: 'Two threads acquire lock A then lock B, but in reverse order. What is this phenomenon and which solution is correct?',
      options: [
        'Race condition, solution is to declare the variable volatile',
        'Starvation, solution is to use ReentrantLock instead of synchronized',
        'Deadlock, solution is to unify lock order or use tryLock with timeout',
        'Lost update, solution is to use AtomicInteger'
      ],
      explain: `**Correct answer: Deadlock, solution is to unify lock order or use tryLock with timeout.**

### Explanation
Deadlock occurs when each thread holds a resource that the other thread is waiting for, creating a circular wait condition. The JVM **does not** automatically break deadlocks and throws no exception: the two threads hang indefinitely, consuming thread pool resources and eventually hanging the service. You can only **detect** it: {{jstack}}/{{jcmd Thread.print}} prints "Found one Java-level deadlock", or {{ThreadMXBean.findDeadlockedThreads()}}—both identify deadlocks for both {{synchronized}} monitors and {{ReentrantLock}}.

### Why the other options are wrong
- **Race condition + volatile**: {{volatile}} does not resolve deadlock because this is a locking order issue, not a visibility issue.
- **Starvation + ReentrantLock**: Starvation is when a thread never gets the lock while the system makes progress; here, both threads stand still indefinitely. Switching to {{ReentrantLock}} (using {{lock()}}) does not break the circular wait—you must use {{tryLock}} with a timeout.
- **Lost update + AtomicInteger**: Describes an entirely different error, unrelated to waiting for locks.

### Two practical prevention methods
1. **Unify lock order**: Everywhere, lock A before B; with dynamic locks (e.g., transferring money between two accounts), always lock by increasing ID order.
2. **Limit wait time**: {{if (!lock2.tryLock(1, TimeUnit.SECONDS)) throw ...}} and the {{finally}} block must {{unlock}} in reverse order.

~~~java
lock1.lock();
try {
    if (!lock2.tryLock(1, TimeUnit.SECONDS)) {
        throw new IllegalStateException("cannot acquire lock, skipping to avoid hang");
    }
    try {
        doWork();
    } finally {
        lock2.unlock();
    }
} finally {
    lock1.unlock();
}
~~~

> Senior tip: Another approach is to eliminate nested locks by changing the design—use lock-free data structures, or move the logic that needs locking to a single thread via a queue. In production, {{tryLock}} with a timeout and logging warnings is generally safer than hanging a request.`
    },
    'qz-concurrency-003': {
      q: 'With {{ExecutorService}}, when should you call {{shutdown}} and when should you call {{shutdownNow}}?',
      options: [
        'shutdown stops accepting new tasks but runs pending and running tasks, shutdownNow tries to interrupt running tasks and returns pending tasks',
        'shutdown stops all running tasks immediately, shutdownNow stops accepting new tasks',
        'They are completely equivalent, only the names differ',
        'shutdownNow returns completed tasks, shutdown returns currently running tasks'
      ],
      explain: `**Correct answer: shutdown stops accepting new tasks but runs pending and running tasks, shutdownNow tries to interrupt running tasks and returns pending tasks.**

### Explanation
{{shutdown}} transitions the executor to a state where it accepts no new tasks (submits will be rejected), but tasks already submitted—including those in the queue—run to completion. Note that {{shutdown}} **is not blocking**: if you want to wait, call {{awaitTermination}}. This is the correct choice for a graceful shutdown process: closing reports, flushing queues, closing connections before shutting down. {{shutdownNow}} stops accepting new tasks, attempts to stop running tasks via {{Thread.interrupt}}, and returns a list of tasks that did not get to run. Tasks that do not respond to interrupt (e.g., stuck in non-cancellable I/O) continue to run.

### Why the other options are wrong
- **shutdown stops immediately**: This is the behavior of {{shutdownNow}}.
- **They are equivalent**: Incorrect, they differ in waiting vs. cutting across.
- **shutdownNow returns completed tasks**: Incorrect, it returns a list of tasks **not yet run** (those in the queue).

### Standard shutdown for Spring Boot
~~~java
@PreDestroy
void stop() throws InterruptedException {
    pool.shutdown();                       // stop accepting new work
    if (!pool.awaitTermination(30, TimeUnit.SECONDS)) {
        pool.shutdownNow();                // interrupt if timed out
    }
}
~~~

> Senior tip: Always wrap resource closing in {{try/finally}}, and remember that {{shutdown}} **does not** wait for threads to die. For threads that don't respond to interrupt, add {{awaitTermination}} with a timeout before calling {{shutdownNow}}, and always log the number of hung tasks to detect resource leaks early.`
    },
    'qz-concurrency-004': {
      q: 'You store user info in {{ThreadLocal}} within a filter of an app running on a fixed thread pool. What is the main risk?',
      options: [
        'ThreadLocal cannot read values from other threads, so the next request might not see the data',
        'Threads hold a reference to the value through ThreadLocalMap; if remove is not called, the value is retained, causing memory leaks for long-lived threads',
        'Reading ThreadLocal always requires synchronization across the entire thread pool, causing contention',
        'ThreadLocal only works with threads you create yourself, not with executor threads'
      ],
      explain: `**Correct answer: Threads hold a reference to the value through ThreadLocalMap; if remove is not called, the value is retained, causing memory leaks for long-lived threads.**

### Explanation
The value of a {{ThreadLocal}} resides in the {{ThreadLocalMap}} of that specific thread. The entry of the map holds the key ({{ThreadLocal}}) via a **WeakReference**, but holds the value via a **strong reference**—so even if the ThreadLocal is GC'd, the value remains until the thread dies or the entry is cleaned up. In a thread pool, threads live almost for the lifetime of the application, so if you set a value and do not {{remove()}}, the old value stays and holds a reference to large objects (session, user context, buffers). This is a very common cause of memory leaks even when the heap has plenty of RAM.

### Why the other options are wrong
- **Cannot read values from other threads**: Technically correct, but that is a **feature** of ThreadLocal, not a memory leak risk. The real risk is the value being retained.
- **Requires synchronization across the pool**: Incorrect, {{ThreadLocal.get()}} only reads the map of the current thread, so no locks are needed.
- **Only works with self-created threads**: Incorrect, executor threads work perfectly fine—and that is exactly why the memory leak risk is dangerous.

### The correct way
~~~java
try {
    MDC.put("requestId", requestId);        // MDC in logback also uses ThreadLocal
    chain.doFilter(request, response);
} finally {
    MDC.remove("requestId");                // always remove in finally
    CONTEXT.remove();                       // clean up context of the request
}
~~~

> Senior tip: Java 21 introduced {{ScopedValue}} (preview) to replace {{ThreadLocal}} with better structural safety, but the principle remains: request-scoped data must be cleaned up in {{finally}}, and if you are passing data through {{@Async}}, {{ThreadLocal}} will **not** be passed to the new thread—it must be passed as a task parameter.`
    },
    'qz-concurrency-005': {
      q: 'Regarding {{CompletableFuture}}, which statement is true?',
      options: [
        'thenApply and thenApplyAsync always run on the same default executor of ForkJoinPool',
        'thenApplyAsync requires an explicit executor, otherwise it throws IllegalArgumentException',
        'exceptionally returns the value of the original future, so it cannot be used for error handling',
        'thenApply runs the callback on the thread that completed the future, while thenApplyAsync runs on ForkJoinPool.commonPool or a provided executor'
      ],
      explain: `**Correct answer: thenApply runs the callback on the thread that completed the future, while thenApplyAsync runs on ForkJoinPool.commonPool or a provided executor.**

### Explanation
{{thenApply}} runs the function immediately on the thread that completed the previous future—if the future is already complete, the callback runs synchronously on the current thread. {{thenApplyAsync}} offloads the execution to another executor: if none is provided, it uses {{ForkJoinPool.commonPool()}}; if one is provided, it uses that executor. This distinction determines whether the callback runs on the request thread (fast but blocks I/O) or runs in the background.

### Why the other options are wrong
- **Always same executor**: Incorrect, {{thenApply}} runs on the thread of the preceding future.
- **thenApplyAsync requires an explicit executor**: Incorrect, the executor parameter is optional.
- **exceptionally returns the original future's value**: Incorrect, {{exceptionally}} receives a function that returns a replacement value when an error occurs; this is the standard way to handle errors.

### Chaining multiple parallel calls
~~~java
CompletableFuture<User> user  = userService.find(id);
CompletableFuture<Order> order = orderService.find(id);

CompletableFuture<Summary> both = user.thenCombine(order, Summary::new);  // wait for both
both.exceptionally(ex -> { log.error("error", ex); return null; })
    .thenAccept(summary -> render(summary));
~~~

> Senior tip: Do not use {{commonPool}} for I/O tasks because it is shared with other libraries in the JVM, easily leading to congestion, and the effective number of CPUs is usually {{nCPU - 1}}. Create a dedicated executor with a clear name, set an {{UncaughtExceptionHandler}}, and always have {{exceptionally}} or {{handle}} at the end of the chain; otherwise, exceptions will be swallowed silently.`
    },
    'qz-concurrency-006': {
      q: 'You need to limit the concurrency to 10 threads, and know when the entire group is done. Which tool is best?',
      options: [
        'CountDownLatch, because it limits concurrent threads and signals when all are done',
        'CyclicBarrier, because it supports blocking concurrent threads and signaling group completion',
        'Semaphore, because it limits concurrent permits and can wait for the entire group',
        'None of the above, you must manually manage with AtomicInteger and busy wait'
      ],
      explain: `**Correct answer: Semaphore, because it limits concurrent permits and can wait for the entire group.**

### Explanation
A {{Semaphore}} manages a number of permits: each task needs one permit, {{acquire}} blocks when no permits remain, automatically limiting concurrent tasks. To wait for the whole group, after submitting all tasks, you call {{acquire(10)}}: this call only returns when all 10 permits have been released, meaning no tasks are currently running. Alternatively, add a {{CountDownLatch}} to count completed tasks. {{CountDownLatch}} alone only counts down; it cannot limit concurrency.

### Why the other options are wrong
- **CountDownLatch**: Only provides a signal that "all are done", it cannot limit the number of threads running concurrently. If you want to limit concurrency, you must manually manage a pool.
- **CyclicBarrier**: It waits for a set number of threads to arrive at a point before letting them proceed—the opposite of "limiting concurrent threads".
- **Must manually manage with busy wait**: Unnecessary, and busy wait is the worst approach because it burns CPU.

### Practical implementation
~~~java
// method declares throws InterruptedException
Semaphore slots = new Semaphore(10);          // max 10 tasks running concurrently
for (Task t : tasks) {
    slots.acquire();                          // block submitting thread when 10 tasks are running
    pool.execute(() -> {
        try {
            t.run();
        } finally {
            slots.release();                  // always release in finally
        }
    });
}
slots.acquire(10);                            // wait for all tasks to return permits = group done
~~~

> Senior tip: In practice, a cleaner way is often a {{ThreadPoolExecutor}} with exactly 10 threads and a bounded queue, then use {{invokeAll}} or {{CompletableFuture.allOf}} to wait for the group—this limits concurrency, has a rejection strategy ({{CallerRunsPolicy}}) instead of letting the queue grow indefinitely. Semaphore is appropriate when you must limit concurrency on a shared pool where you cannot create your own.`
    },
    'qz-jvm-001': {
      q: 'Spring Boot service hit {{OutOfMemoryError}} with "unable to create new native thread". What is the cause and correct solution?',
      options: [
        'Heap not sufficient, need to increase -Xmx',
        'Metaspace overflow due to too many classes, need to increase -XX:MaxMetaspaceSize',
        'Hit OS or container thread limit, need to reduce threads or increase the limit',
        'Direct memory exhausted, need to increase -XX:MaxDirectMemorySize'
      ],
      explain: `**Correct answer: Hit OS or container thread limit, need to reduce threads or increase the limit.**

### Explanation
{{OutOfMemoryError}} has many types, and the message indicates the type. "unable to create new native thread" is a failure at the **OS level**: JVM cannot create a new thread because it reached the process limit (ulimit -u, {{pids.max}} in container) or exhausted resources. Often encountered when a thread pool is configured too large, or when each request creates a new thread (e.g., in RestTemplate, async executors, or JDBC libraries creating connections).

### Why the other options are wrong
- **Increase -Xmx**: Incorrect. This error is unrelated to heap; increasing heap might make it worse.
- **Metaspace overflow**: Would show "Metaspace" or "Compressed Class Space" message, not thread creation error.
- **Direct memory exhausted**: Would report "Direct buffer memory" and usually only occurs with NIO/Netty.

### Diagnosis in container
~~~bash
# In container, view the pid limit
cat /sys/fs/cgroup/pids.max 2>/dev/null || cat /sys/fs/cgroup/pids/pids.max
# Actual thread count of the Java process
ls /proc/1/task | wc -l
~~~

If the ceiling is hit, reduce pool threads, use {{Executors.newVirtualThreadPerTaskExecutor()}} for I/O-heavy tasks, and check for pools configured too large (Tomcat max-threads, HikariCP maximum-pool-size, async executors).

> Senior tip: {{OutOfMemoryError: unable to create new native thread}} is often a symptom of a thread leak rather than lack of resources. Heap dump helps little here (the error is not in the heap); take a thread dump with {{jcmd <pid> Thread.print}}, group by thread name (pool-N-thread-M, executor name) to find the pool creating threads without closing them, and monitor the {{jvm.threads.live}} metric over time.`
    },
    'qz-jvm-002': {
      q: 'On Java 17, the default GC is G1. Which description correctly describes G1 characteristics?',
      options: [
        'G1 divides the heap into regions, prioritizes collecting the regions with the most garbage (Garbage-First) to meet pause time goals, and still has short stop-the-world (STW) phases',
        'G1 collects the entire young generation and major GC, same as Parallel GC',
        'G1 never stops the world, so it never affects request latency',
        'G1 only works when the heap is larger than 32 GB; otherwise, the JVM automatically switches to SerialGC'
      ],
      explain: `**Correct answer: G1 divides the heap into regions, prioritizes collecting the regions with the most garbage (Garbage-First) to meet pause time goals, and still has short stop-the-world (STW) phases.**

### Explanation
G1 organizes the heap into **regions** of the same size (1–32 MB on Java 17, selected based on heap size) instead of contiguous areas; each region is assigned a role: eden, survivor, old, or humongous. G1 tracks the amount of live data in each region; during **mixed collections**, it selects old regions with the most garbage (least live data to copy)—this is the meaning of "Garbage-First". The number of regions included in the collection set is calculated so the pause does not exceed {{MaxGCPauseMillis}}, so the pause depends primarily on the amount of **live data** to evacuate, not proportionally to heap size. G1 **does** have stop-the-world phases (young/mixed evacuation pause, remark, cleanup), while marking runs concurrently with the application.

### Why the other options are wrong
- **Same as Parallel GC**: Incorrect. That is the model of Parallel GC (prioritizing throughput). G1 attempts to avoid Full GC through concurrent marking + mixed collection; Full GC (multi-threaded since JDK 10) is only a fallback when evacuation fails, and its occurrence is a signal for tuning.
- **Never stops the world**: Incorrect. G1 has STW phases as noted above. The goal is to keep STW short and predictable, not to eliminate them.
- **Only with heap > 32 GB**: Incorrect. G1 is the default GC since Java 9 and works well with heaps from a few hundred MB to tens of GB. It only switches to SerialGC if the JVM determines the machine is not "server-class" (less than 2 CPUs or less than ~1792 MB RAM)—the condition is CPU/RAM, not a 32 GB heap threshold.

### Comparison table
| GC | Priority | Best for |
|---|---|---|
| SerialGC | save CPU, small heap | containers ≤ 512 MB |
| ParallelGC | high throughput | batch processing |
| G1 | balanced latency and throughput | web services, heaps of a few to tens of GB |
| ZGC / Shenandoah | very low latency, extreme STW | strict p99 requirements, large heaps |

> Senior tip: Don't choose a GC based on intuition. Measure {{-Xlog:gc}} and set a p99 goal, then compare G1 throughput with ZGC on your own workload. Note that the default value for {{MaxGCPauseMillis}} is 200 ms and G1 will adjust to that goal, sometimes causing throughput lower than expected.`
    },
    'qz-jvm-003': {
      q: 'The Java app is hanging and CPU is at 100%. You only have JDK tools. Which toolset is best for diagnosis?',
      options: [
        'javac to recompile and compare bytecode',
        'jpackage to repackage and compare artifact size',
        'javadoc to generate API docs and compare with logs',
        'jstack for thread dump and deadlock detection, jcmd for heap dump, jstat to monitor GC'
      ],
      explain: `**Correct answer: jstack for thread dump and deadlock detection, jcmd for heap dump, jstat to monitor GC.**

### Explanation
The JVM diagnostic toolset bundled with the JDK solves production scenarios:

- **{{jstack <pid>}}**: prints thread dump. Find threads in RUNNABLE state occupying CPU (deadlocks, infinite loops, busy-wait).
- **{{jcmd <pid> GC.heap_dump /tmp/heap.hprof}}**: takes a heap dump; same tool also has {{GC.heap_info}}, {{GC.class_histogram}}, {{Thread.print}} (equivalent to jstack), and {{JFR.start}} for profiling CPU/allocation.
- **{{jstat -gcutil <pid> 1000}}**: monitors GC time percentage, number of full GCs, and memory area sizes over time.
- **{{jmap -dump:live,format=b,file=heap.hprof <pid>}}**: older way to export heap dump; analyze with Eclipse MAT.

### Why the other options are wrong
- **javac**: only compiles, does not analyze a running process state.
- **javadoc**: generates API docs, unrelated to runtime diagnosis.
- **jpackage**: packages the app for distribution, also not a diagnostic tool.

### Standard procedure when hanging
1. Take **multiple** thread dumps 5–10 seconds apart: one is not enough; compare them to see which thread is running and at which line.
2. For 100% CPU: use {{top -H -p <pid>}} to find the thread ID (TID) consuming the most CPU, then match it with the {{nid}} in the thread dump (JDK 18+ prints nid in decimal; JDK 8–17 prints in hex, so convert to hex first) to know where that thread is running.
3. For increasing heap: take a heap dump and analyze dominator tree and retained objects.

> Senior tip: Enable {{-XX:+HeapDumpOnOutOfMemoryError}} and {{-XX:+ExitOnOutOfMemoryError}} in staging, and prioritize {{jcmd}} as it aggregates all diagnostic commands recommended by Oracle. Remember that thread dump needs a safepoint (usually a few ms), whereas a heap dump stops the application much longer (seconds to tens of seconds with a large heap)—don't take a heap dump on an instance receiving traffic without pulling it from the load balancer first. In containerized environments, enable {{shareProcessNamespace}} or use platform tools (CloudWatch, Grafana) to take metrics continuously instead of just dumping when the incident has already happened.`
    },
    'qz-jvm-004': {
      q: 'Regarding class loading per parent-delegation, which statement is true?',
      options: [
        'Each classloader defines a class first, only asks parent if not found',
        'Classloader only loads classes from JVM classpath, cannot load classes in external JARs',
        'The mechanism applies only to interfaces, not concrete classes',
        'Each classloader asks parent first, only defines if parent fails, so java.lang.Object is always the same class'
      ],
      explain: `**Correct answer: Each classloader asks parent first, only defines if parent fails, so java.lang.Object is always the same class.**

### Explanation
The typical classloader chain since Java 9: {{Bootstrap}} → {{Platform}} → {{Application}} (also called system class loader), followed by custom loaders for frameworks. Each loader first calls {{loadClass}} of the parent loader; only if the parent fails does the child read the class from its own source (classpath, JARs, module path). This ensures {{java.lang.Object}} is loaded only by the bootstrap loader, and all other classes share the same definition—avoiding "same class name but different type" {{ClassCastException}} issues.

### Why the other options are wrong
- **Defines class first**: That is the child-first strategy, opposite to the standard model. It exists (Tomcat uses it to isolate libraries for webapps) but must delegate {{java.*}} to the parent; it is not the default behavior.
- **Only from JVM classpath**: Incorrect, {{URLClassLoader}} and embedded containers (Tomcat, Spring Boot fat jar) load classes from specific JARs and folders.
- **Applies only to interfaces**: Incorrect, applies to all classes.

### Practical application
Parent-first **does not** resolve version conflicts: within the same loader, there is only one version of each class, and the one that appears first on the classpath wins (the source of {{NoSuchMethodError}} when two libraries need two different versions). To truly isolate, use a separate classloader for each plugin/webapp (like Tomcat, OSGi). When doing so, beware of classloader leaks: a single object held by a parent loader (ThreadLocal, static cache, registered JDBC driver) referencing a class from the child loader prevents the entire child loader and all its classes from being GC'd after redeployment.

> Senior tip: When discovering an "irrational" {{ClassCastException}} (impossible via logic), think about the same class loaded by two different classloaders. Print {{obj.getClass().getClassLoader()}} and {{obj.getClass().getName()}} to compare. With Spring Boot, check the {{spring-boot-loader}} configuration and avoid mixing "provided" jars with packaged jars.`
    },
    'qz-jvm-005': {
      q: 'Regarding JIT compiler of HotSpot, which statement is true?',
      options: [
        'JIT compiles all bytecode immediately when class is loaded so warm-up is unnecessary',
        'C2 only optimizes final methods, other methods are never optimized',
        'C1 compiles fast, C2 compiles slower but optimizes deeper; tiered compilation combines both and can deoptimize if assumptions are wrong',
        'Deoptimization only occurs when the app stops completely, so it does not affect operations'
      ],
      explain: `**Correct answer: C1 compiles fast, C2 compiles slower but optimizes deeper; tiered compilation combines both and can deoptimize if assumptions are wrong.**

### Explanation
HotSpot uses **tiered compilation**: frequently called methods are compiled with C1 (client compiler, light optimization, fast compilation) so runnable code is available early. Once a method is called frequently enough, the JVM switches to C2 (server compiler) for deeper optimization based on execution profiles: which branch is usually taken, which data types actually appear, which call sites are polymorphic.

**Deoptimization** occurs when C2's assumptions are falsified—e.g., C2 assumes an interface has only one implementer, then a second one appears. The JVM discards the compiled code, falls back to interpreted mode, collects a new profile, and recompiles. This is why code that "seems" simple can become slow halfway through.

### Why the other options are wrong
- **Compile immediately on load**: Incorrect, HotSpot uses an interpreter first, then JITs based on profiles.
- **C2 only optimizes final methods**: Incorrect, {{final}} often makes code *easier* to optimize (devirtualization), not a requirement.
- **Deoptimization only on stop**: Incorrect, it happens during execution and is a cause of latency "spikes".

### Impact in operations
- **Warm-up**: JVM is faster after a few minutes of running; that's why load tests must have a separate warm-up phase.
- **Profile pollution**: A shared method called with different data types (e.g., warm-up with data unlike production) makes the profile megamorphic, preventing C2 from inlining/devirtualizing, and code becomes slower.

> Senior tip: For systems with tight latency (p99 < 50 ms), do not expect JIT to solve everything—reduce object allocation, avoid megamorphic call sites, and consider {{-XX:+UseZGC}} if pause time is the main issue. Always benchmark with JVM flags identical to the production environment, because different configurations yield different results.`
    },
    'qz-jvm-006': {
      q: 'According to Java Memory Model, after a constructor ends, what is guaranteed for {{final}} fields?',
      options: [
        'No guarantee for final values, all fields must be volatile to be safe',
        'Final values are frozen at constructor end, so threads reading the reference after constructor ends see correct values',
        'Only primitive fields are guaranteed, reference fields still need volatile',
        'The guarantee only applies within the same thread that created the object'
      ],
      explain: `**Correct answer: Final values are frozen at constructor end, so threads reading the reference after constructor ends see correct values.**

### Explanation
JSR-133 (Java 5) defines **final field semantics**: at the moment the constructor ends, the object's {{final}} values are "frozen" and guaranteed to be visible to all other threads, even if the object is published without other happens-before relationships. This is the basis for immutable objects like {{String}} or {{java.time}} to be safely shared without {{volatile}}.

### Why the other options are wrong
- **Must be volatile**: Incorrect, that is an unnecessary restriction. {{final}} is sufficient for this case.
- **Only primitive fields guaranteed**: Incorrect, final field semantics apply to reference fields as well.
- **Only within same thread**: Incorrect, that behavior applies to cases without final field semantics.

### Limits of this guarantee
- **Constructor must not "escape this"**: If you expose {{this}} (register listener, call callback, save to another collection) *inside* the constructor, other threads might see the object before fields are assigned → the guarantee is invalidated.
- **Final fields ≠ immutable object**: JMM guarantees other threads see the state of an object pointed to by a final field **as it was when the constructor ended**; but any changes **after** that (e.g., contents of a {{List}}) are no longer guaranteed—for that, synchronization is needed ({{synchronized}}, concurrent collections...).

> Senior tip: This is why the "safe publication" rule (publish via {{final}} fields, {{volatile}}, locks, or concurrent collections) is recommended. The safest way is to make objects completely immutable: {{final}} fields pointing to immutable data ({{List.copyOf}}, records)—then no further synchronization is needed.`
    },
    'qz-spring-001': {
      q: 'Why does calling a {{@Transactional}} method from another method in the same class not start a transaction?',
      options: [
        'Spring only supports transactions on public methods; private methods cannot be proxied',
        '@Transactional must be declared on the class interface',
        'Transactions only work when the request goes through an HTTP controller',
        '@Transactional is applied through a proxy; internal calls do not go through the proxy, so the advice does not trigger'
      ],
      explain: `**Correct answer: @Transactional is applied through a proxy; internal calls do not go through the proxy, so the advice does not trigger.**

### Explanation
Spring creates a proxy (JDK dynamic proxy for interfaces, CGLIB for classes) around the bean. When code calls {{orderService.placeOrder(...)}} from outside, the call goes through the proxy, which opens a transaction before calling the actual method. But when called from inside the same class, {{this.placeOrder(...)}} calls the actual object directly—there is no proxy in the middle—so the {{TransactionInterceptor}} never runs.

Two practical consequences:
1. **Internally called methods skip all {{@Transactional}} configuration**: If the calling method already has a transaction, it runs in that one; otherwise, it runs with none. This easily causes bugs when expecting "separate rollback".
2. **Propagation {{REQUIRES_NEW}}**, {{readOnly}}, {{timeout}}, {{rollbackFor}} have no effect on that method, as they are handled by the proxy advice.

### Why the other options are wrong
- **Only public methods**: Not the cause here—even for public methods, internal calls bypass the proxy. (Since Spring 6.0, with CGLIB proxy, {{@Transactional}} applies to protected and package-private methods; private methods are never proxied.)
- **Only works through HTTP controller**: Incorrect, transactions work at all layers when going through a proxy.
- **Must be on interface**: Incorrect, declaring on a class is perfectly valid.

### Ways to fix
~~~java
// Fix 1: separate into another bean
@Service
class OrderService {
    private final PaymentService paymentService;   // separate bean, called via proxy
    void placeOrder() { paymentService.charge(); }
}

// Fix 2: use AopContext.currentProxy() (needs exposeProxy = true)
// Fix 3: use TransactionTemplate instead of annotation
~~~

> Senior tip: Don't choose the proxy because it's "convenient" only to fall into the self-invocation trap. The safe rule: **each transactional boundary should be a public method of a separate bean**. If sure self-invocation must work, use {{TransactionTemplate}}—it calls directly, does not depend on proxies, and is easier to read when propagation and timeout must be clearly specified.`
    }
  });
})();
