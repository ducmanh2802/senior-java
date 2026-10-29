/*
 * English translation of js/data/quiz.js — task T408. Format: js/core/i18n.js (content overlay).
 * ids: qz-modern-005 qz-modern-006 qz-concurrency-001 qz-concurrency-002 qz-concurrency-003 qz-concurrency-004 qz-concurrency-005 qz-concurrency-006 qz-jvm-001 qz-jvm-002 qz-jvm-003 qz-jvm-004 qz-jvm-005 qz-jvm-006 qz-spring-001
 */
App.i18n.content({
  'qz-modern-005': {
    q: 'In Java 21, what is true when writing a switch expression over a sealed interface?',
    options: [
      'A default branch is always required, even when every permitted subclass has been listed',
      'Switch expressions only support String, Enum, and primitive types; sealed types are not supported',
      'The switch must be exhaustive: without a default branch, the compiler requires a branch for every permitted subclass, and the build fails if one is missing',
      'Branch exhaustiveness is checked only by the IDE, not by the compiler'
    ],
    explain: `**Correct answer: The switch must be exhaustive: without a default branch, the compiler requires a branch for every permitted subclass, and the build fails if one is missing.**

### Why this is correct
A sealed class/interface restricts the set of subclasses allowed to extend/implement it, so the compiler knows every possible state in advance. A switch expression (and a switch with patterns) must be **exhaustive**: if there is no {{default}} and a subclass is missing, the compiler reports a compilation error. When all branches are present, you **do not need** {{default}}; the compiler inserts a hidden branch that throws {{MatchException}} (Java 21) in case a new subclass is compiled separately without recompiling the switch. This is a major advantage over a regular switch: adding a new subclass breaks the build and forces you to update the logic — much safer than if-else.

~~~java
sealed interface Payment permits Card, Bank, Wallet {}

int fee(Payment p) {
    return switch (p) {
        case Card c   -> 2;
        case Bank b   -> 1;
        case Wallet w -> 0;
    };                                   // adding a new subclass -> build fails if a branch is missing
}
~~~

### Why the other options are incorrect
- **A default branch is always required**: incorrect. With a sealed type whose subclasses are all listed, default is unnecessary — and **should not** be added, because default would "swallow" a new subclass and eliminate the compile-time warning. Default is only required when the selector has an open type such as {{Object}}.
- **Only String, Enum, and primitives are supported**: that was true of the old {{switch}}, but Java 21 supports pattern matching for all reference types.
- **Only the IDE checks this**: incorrect; this is a language strength: the compiler enforces exhaustive coverage.

> Senior tip: sealed types + pattern switches are a tool for **eliminating if-else through the language**, and are especially useful for an order state machine (placed, processing, completed, cancelled). Remember that when you add a new state, the compiler forcing you to update every switch is a feature, not an inconvenience.`
  },
  'qz-modern-006': {
    q: 'Which statement about {{var}} in Java 10+ is correct?',
    options: [
      'var cannot be used for fields or for lambda parameters',
      'var cannot be used without an initializer or when the initializer is null, and it cannot be a method return type or parameter type',
      'var cannot be used with primitive arrays, so every array must have an explicit type declaration',
      'None of the above is correct, because var can be used anywhere a variable is declared'
    ],
    explain: `**Correct answer: var cannot be used without an initializer or when the initializer is null, and it cannot be a method return type or parameter type.**

### Why this is correct
{{var}} provides **local variable type inference**: the compiler reads the initializer to infer the type. Without an initializer, there is nothing from which to infer it; with a {{null}} initializer, there is no concrete type. Furthermore, {{var}} is not an actual type, so it cannot be used as a method return type, a parameter type, or a type argument such as {{List<var>}}.

### Why the other options are incorrect
- **It cannot be used for fields or lambda parameters**: only half true, so the whole statement is incorrect. {{var}} indeed **cannot** be used for fields ({{private var count = 0;}} is a compilation error), but since Java 11 it can be used for lambda parameters: {{(var a, var b) -> ...}} (useful when an annotation is needed, such as {{@NonNull var a}}).
- **It cannot be used with primitive arrays**: incorrect. {{var arr = new int[5];}} is valid and infers {{int[]}} (only a bare array initializer, such as var arr = followed by braces, is invalid).
- **It can be used everywhere**: incorrect, as explained above.

### When to use it and when not to
Use it when the type is clear but verbose and creates noise: {{var order = orderService.create(request);}}. Do not use it when the inferred type is a broad interface but you need a concrete type, and do not use it in a public API because readers cannot see the type.

> Senior tip: {{var}} makes code more concise but can reduce readability when code is read far from the declaration (especially during web-based reviews without IDE type hints). A sound personal rule is to use {{var}} only when the type can be inferred from the variable name itself, for example {{var order = orderService.create(request);}}.`
  },
  'qz-concurrency-001': {
    q: 'When multiple threads increment a {{volatile int counter}} in a loop, what is true?',
    options: [
      'volatile makes each ++ operation atomic, so counter ultimately equals the total number of increments',
      'volatile guarantees write ordering across different variables, so the final total always matches',
      'volatile prevents the CPU from caching the value in registers, so the result is always correct',
      'volatile only guarantees read consistency (visibility); it does not guarantee that read-modify-write is atomic'
    ],
    explain: `**Correct answer: volatile only guarantees read consistency (visibility); it does not guarantee that read-modify-write is atomic.**

### Why this is correct
{{counter++}} consists of three operations: read the value, add 1, and write it back. {{volatile}} only ensures that a read sees the latest value written by another thread; it does not combine those three operations into one atomic operation. Two threads can both read 5, both compute 6, and both write 6 — losing one increment. This is a **lost update**, not a visibility problem.

### Why the other options are incorrect
- **++ is atomic**: this is only true for {{AtomicInteger}} and other atomic classes, not for {{volatile}}.
- **The CPU does not cache the value**: this is an intuitive explanation of visibility, but it says nothing about atomicity; two threads can still read the same old value and overwrite each other.
- **Write ordering guarantees the total always matches**: {{volatile}} does establish a happens-before relationship (all writes before a volatile write are visible to a thread that subsequently reads that volatile variable), but ordering and visibility do not make {{++}} atomic, so updates are still lost.

### The correct approach
~~~java
private final AtomicLong counter = new AtomicLong();
counter.incrementAndGet();          // atomic
// or when counting writes from many threads:
// private final LongAdder counter = new LongAdder();  // higher throughput under heavy contention
~~~

> Senior tip: a quick rule of thumb: use {{volatile}} for **visibility**, {{Atomic*}} or {{synchronized}} for **atomicity**, and locking for **both across multiple related pieces of state**. For heavily contended counters (metrics, request counts), {{LongAdder}} is better than {{AtomicLong}} because it uses multiple counter cells to reduce cache-line contention.`
  },
  'qz-concurrency-002': {
    q: 'Two threads acquire lock A and then lock B respectively, but in opposite orders. What is this phenomenon, and what is the correct solution?',
    options: [
      'A race condition caused by two threads reading and writing the same variable; declare the variable volatile',
      'Starvation caused by one thread holding a lock for too long; use ReentrantLock instead of synchronized',
      'A deadlock in which two threads wait for each other; establish a consistent lock order or use tryLock with a timeout',
      'A lost update caused by two threads updating the same value; use AtomicInteger'
    ],
    explain: `**Correct answer: A deadlock in which two threads wait for each other; establish a consistent lock order or use tryLock with a timeout.**

### Why this is correct
A deadlock occurs when each thread holds a resource that the other thread is waiting for, creating a closed wait cycle. The JVM does **not** automatically break a deadlock or throw an exception: both threads hang indefinitely, gradually consuming pool threads and eventually bringing down the service. You can only **detect** it: {{jstack}}/{{jcmd Thread.print}} prints a "Found one Java-level deadlock" section, or you can use {{ThreadMXBean.findDeadlockedThreads()}} — both detect deadlocks involving {{synchronized}} monitors as well as {{ReentrantLock}}.

### Why the other options are incorrect
- **Race condition + volatile**: volatile cannot resolve a deadlock because this is a lock-ordering problem, not a visibility problem.
- **Starvation + ReentrantLock**: starvation means one thread never acquires a lock while the system as a whole continues making progress; here both threads remain blocked forever. Merely switching to {{ReentrantLock}} (using {{lock()}}) does not break the wait cycle — you must use {{tryLock}} with a timeout.
- **Lost update + AtomicInteger**: this describes a completely different problem unrelated to waiting for locks.

### Two practical prevention techniques
1. **Establish a consistent lock order**: everywhere locks A before B; for dynamic locks (for example, transferring money between two accounts), always lock in ascending id order.
2. **Bound the waiting time**: {{if (!lock2.tryLock(1, TimeUnit.SECONDS)) throw ...}}, and {{finally}} must {{unlock}} in the correct reverse order.

~~~java
lock1.lock();
try {
    if (!lock2.tryLock(1, TimeUnit.SECONDS)) {
        throw new IllegalStateException("could not acquire lock; abort to avoid hanging");
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

> Senior tip: another option is to eliminate nested locks by changing the design — use a data structure that does not require locking, or route the lock-protected work to a single thread through a queue. In production, {{tryLock}} with a timeout and warning logs is usually safer than hanging a request.`
  },
  'qz-concurrency-003': {
    q: 'With an {{ExecutorService}}, when should you call {{shutdown}} and when should you call {{shutdownNow}}?',
    options: [
      'shutdown stops accepting new tasks but still runs all running and queued tasks, whereas shutdownNow attempts to interrupt running tasks and returns the tasks that have not started',
      'shutdown immediately stops all running tasks, whereas shutdownNow only stops accepting new tasks',
      'The two calls are completely equivalent and differ only in name',
      'shutdownNow returns a list of completed tasks, whereas shutdown returns a list of tasks that are still running'
    ],
    explain: `**Correct answer: shutdown stops accepting new tasks but still runs all running and queued tasks, whereas shutdownNow attempts to interrupt running tasks and returns the tasks that have not started.**

### Why this is correct
{{shutdown}} moves the executor into a state that accepts no new tasks (submit will be rejected), but tasks already submitted — including those still queued — continue running to completion. Note that {{shutdown}} **does not block**: to wait, you must call {{awaitTermination}}. This is the right choice for graceful shutdown: finish reports, flush queues, close connections, and only then stop. {{shutdownNow}} stops accepting new tasks, attempts to stop running tasks using {{Thread.interrupt}}, and returns a list of tasks that never started. A task that does not respond to interruption (for example, one stuck in non-cancellable I/O) continues running.

### Why the other options are incorrect
- **shutdown immediately stops every task**: that describes {{shutdownNow}}.
- **The two calls are equivalent**: incorrect; they differ in whether they wait or interrupt.
- **shutdownNow returns completed tasks**: incorrect; it returns a list of tasks that **have not run** (those waiting in the queue).

### Standard shutdown pattern for Spring Boot
~~~java
@PreDestroy
void stop() throws InterruptedException {
    pool.shutdown();                       // stop accepting new work
    if (!pool.awaitTermination(30, TimeUnit.SECONDS)) {
        pool.shutdownNow();                // interrupt after the deadline
    }
}
~~~

> Senior tip: always wrap resource cleanup in {{try/finally}} and remember that {{shutdown}} does **not** wait for threads to die. For threads that do not respond to interruption, add {{awaitTermination}} with a timeout before calling {{shutdownNow}}, and always log the number of tasks still stuck so resource leaks are detected early.`
  },
  'qz-concurrency-004': {
    q: 'You store user information in a {{ThreadLocal}} in a filter of an application running on a fixed thread pool. What is the main risk?',
    options: [
      'ThreadLocal cannot read a value from another thread, so the next request might not see the data',
      'The thread holds a reference to the value through ThreadLocalMap; without remove, the value is retained and causes a memory leak with long-lived threads',
      'Every ThreadLocal read must synchronize across the entire thread pool, creating a bottleneck',
      'ThreadLocal only works with threads you create yourself, not with executor threads'
    ],
    explain: `**Correct answer: The thread holds a reference to the value through ThreadLocalMap; without remove, the value is retained and causes a memory leak with long-lived threads.**

### Why this is correct
The value of a {{ThreadLocal}} resides in the {{ThreadLocalMap}} of that thread. A map entry holds the key ({{ThreadLocal}}) with a **WeakReference**, but holds the value with a **strong reference** — so even if the ThreadLocal is garbage-collected, the value remains until the thread dies or the entry is cleaned up. With a thread pool, threads live for almost the entire application lifetime, so if you set a value without calling {{remove()}}, the old value remains and retains references to large objects (session, user context, buffer). This is a very common cause of memory leaks even when the heap still has plenty of RAM.

### Why the other options are incorrect
- **It cannot read a value from another thread**: technically true, but that is a **feature** of ThreadLocal, not a memory-leak risk. The actual risk is that the value is retained.
- **Every read requires synchronization**: incorrect; {{ThreadLocal.get()}} only reads the current thread map, so no lock is needed.
- **It only works with self-created threads**: incorrect; executor threads work perfectly well — which is exactly why the memory-leak risk is dangerous.

### The correct approach
~~~java
try {
    MDC.put("requestId", requestId);        // Logback MDC also uses ThreadLocal
    chain.doFilter(request, response);
} finally {
    MDC.remove("requestId");                // always remove in finally
    CONTEXT.remove();                       // completely clear the request context
}
~~~

> Senior tip: Java 21 has {{ScopedValue}} (preview) as a structurally safer replacement for {{ThreadLocal}}, but the principle remains: request-scoped data must be cleaned up in {{finally}}, and if you pass data through {{@Async}}, {{ThreadLocal}} will **not** propagate it to the new thread — pass it through task parameters instead.`
  },
  'qz-concurrency-005': {
    q: 'Which statement about {{CompletableFuture}} is correct?',
    options: [
      'thenApply and thenApplyAsync always run on the same default ForkJoinPool executor',
      'thenApplyAsync requires a separate executor argument; otherwise it throws IllegalArgumentException',
      'exceptionally returns the value of the original future, so it cannot be used for error handling',
      'thenApply runs the callback on the thread that completed the future, whereas thenApplyAsync runs on ForkJoinPool.commonPool or the supplied executor'
    ],
    explain: `**Correct answer: thenApply runs the callback on the thread that completed the future, whereas thenApplyAsync runs on ForkJoinPool.commonPool or the supplied executor.**

### Why this is correct
{{thenApply}} runs the function on the thread that completed the preceding future — if the future is already complete, the callback runs synchronously on the current thread. {{thenApplyAsync}} moves execution to another executor: without an argument it uses {{ForkJoinPool.commonPool()}}, and with an argument it uses that executor. This difference determines whether the callback runs on the request thread (fast but blocks I/O) or in the background.

### Why the other options are incorrect
- **Always the same executor**: incorrect; {{thenApply}} runs on the thread of the preceding future.
- **thenApplyAsync requires an executor argument**: incorrect; the executor parameter is optional.
- **exceptionally returns the original future value**: incorrect; {{exceptionally}} accepts a function that returns a fallback value when an error occurs, which is exactly the standard way to handle errors.

### Chaining multiple parallel calls
~~~java
CompletableFuture<User> user  = userService.find(id);
CompletableFuture<Order> order = orderService.find(id);

CompletableFuture<Summary> both = user.thenCombine(order, Summary::new);  // wait for both
both.exceptionally(ex -> { log.error("error", ex); return null; })
    .thenAccept(summary -> render(summary));
~~~

> Senior tip: do not use {{commonPool}} for I/O tasks because it is shared with other libraries in the JVM, can easily become congested, and usually has {{nCPU - 1}} effective CPUs. Create a separate, clearly named executor, set {{setUncaughtExceptionHandler}}, and always end the chain with {{exceptionally}} or {{handle}}; otherwise exceptions can be silently swallowed.`
  },
  'qz-concurrency-006': {
    q: 'You need to limit processing to at most 10 concurrent threads and also know when the entire group has finished. Which tool is most suitable?',
    options: [
      'CountDownLatch, because it both limits concurrent threads and signals when everything has finished',
      'CyclicBarrier, because it supports both limiting concurrent threads and signaling group completion',
      'Semaphore, because it limits concurrent permits and an additional acquire call can be used to wait for group completion',
      'No tool can do both; you must manage it yourself with AtomicInteger and busy waiting'
    ],
    explain: `**Correct answer: Semaphore, because it limits concurrent permits and an additional acquire call can be used to wait for group completion.**

### Why this is correct
A {{Semaphore}} manages a number of permits: each task needs one permit, and {{acquire}} blocks when no permits remain, automatically limiting the number of tasks running in parallel. To wait for the whole group, after submitting every task you call {{acquire(10)}}: this call returns only when all 10 permits have been released, meaning no task is still running. An equivalent approach is to add a {{CountDownLatch}} that counts completed tasks. A {{CountDownLatch}} alone only counts down; it does not limit concurrency.

### Why the other options are incorrect
- **CountDownLatch**: it only provides an "all finished" signal and cannot limit the number of threads running in parallel. To impose a limit, you would have to manage a pool yourself.
- **CyclicBarrier**: it waits until a required number of threads reach a point before letting them continue — the opposite of the need to "limit concurrent threads".
- **You must manage it with busy waiting**: unnecessary, and busy waiting is the worst approach because it burns CPU.

### A practical approach
~~~java
// method declares throws InterruptedException
Semaphore slots = new Semaphore(10);          // at most 10 tasks running in parallel
for (Task t : tasks) {
    slots.acquire();                          // submitting thread blocks when 10 tasks are running
    pool.execute(() -> {
        try {
            t.run();
        } finally {
            slots.release();                  // always release in finally
        }
    });
}
slots.acquire(10);                            // wait for every task to return its permit = group finished
~~~

> Senior tip: in practice, a cleaner approach is often a dedicated {{ThreadPoolExecutor}} with exactly 10 threads and a bounded queue, then {{invokeAll}} or {{CompletableFuture.allOf}} to wait for the group — limiting concurrency while providing a rejection strategy ({{CallerRunsPolicy}}) instead of allowing an unbounded queue to grow. Semaphore is suitable when you must limit concurrency on a shared pool without creating a dedicated pool.`
  },
  'qz-jvm-001': {
    q: 'A Spring Boot service throws {{OutOfMemoryError}} with the message "unable to create new native thread". What are the cause and the correct solution?',
    options: [
      'The heap is insufficient; increase -Xmx for the application',
      'Metaspace is exhausted because too many classes were loaded; increase -XX:MaxMetaspaceSize',
      'The operating system or container thread limit has been reached; reduce the number of threads created or increase the limit',
      'Direct memory is exhausted; increase -XX:MaxDirectMemorySize'
    ],
    explain: `**Correct answer: The operating system or container thread limit has been reached; reduce the number of threads created or increase the limit.**

### Why this is correct
There are several kinds of {{OutOfMemoryError}}, and the message identifies which one occurred. "unable to create new native thread" is an **OS-level** error: the JVM cannot create a new thread because a process limit (ulimit -u, container {{pids.max}}) has been reached or resources have been exhausted. This commonly happens when a thread pool is configured too large, or each request creates additional threads (for example in RestTemplate, an async executor, or a JDBC library creating a connection).

### Why the other options are incorrect
- **Increase -Xmx**: incorrect. This error is unrelated to the heap; increasing the heap can even make matters worse.
- **Metaspace exhaustion**: this produces a "Metaspace" or "Compressed Class Space" message, not a thread-creation error.
- **Direct memory exhaustion**: this reports "Direct buffer memory" and usually occurs only with NIO/Netty.

### Diagnosing it in a container
~~~bash
# Inside the container, inspect the allocated pids limit
cat /sys/fs/cgroup/pids.max 2>/dev/null || cat /sys/fs/cgroup/pids/pids.max
# Actual thread count of the Java process
ls /proc/1/task | wc -l
~~~

If the limit has been reached, reduce the thread count of each pool, use {{Executors.newVirtualThreadPerTaskExecutor()}} for I/O-bound tasks with substantial waiting, and check for oversized pools (Tomcat max-threads, HikariCP maximum-pool-size, async executor).

> Senior tip: {{OutOfMemoryError: unable to create new native thread}} is often a symptom of a thread leak rather than insufficient resources. A heap dump is of little help here (the error is not in the heap); take a thread dump with {{jcmd <pid> Thread.print}}, group threads by name (pool-N-thread-M, executor name) to find a pool that creates threads without ever shutting down, and monitor the {{jvm.threads.live}} metric over time.`
  },
  'qz-jvm-002': {
    q: 'On Java 17, the default GC is G1. Which description accurately characterizes G1?',
    options: [
      'G1 divides the heap into regions, prioritizes collecting the regions with the most garbage (Garbage-First) to meet a pause-time goal, and still has short stop-the-world (STW) phases',
      'G1 collects the entire young generation and performs full major GC exactly like Parallel GC',
      'G1 never stops the world, so it never affects request latency',
      'G1 only works with heaps larger than 32 GB; otherwise the JVM automatically switches to SerialGC'
    ],
    explain: `**Correct answer: G1 divides the heap into regions, prioritizes collecting the regions with the most garbage (Garbage-First) to meet a pause-time goal, and still has short stop-the-world (STW) phases.**

### Why this is correct
G1 organizes the heap into equally sized **regions** (1–32 MB on Java 17, selected according to heap size) instead of contiguous spaces; each region is assigned an eden, survivor, old, or humongous role. G1 tracks the amount of live data in each region; during **mixed collections**, it selects old regions with the most garbage (the least live data to copy) — hence the name "Garbage-First". The number of regions included in the collection set is calculated so the pause does not exceed {{MaxGCPauseMillis}}, so the pause depends mainly on the amount of **live** data to evacuate rather than scaling directly with heap size. G1 **does** stop the world (young/mixed evacuation pauses, remark, cleanup), while marking runs concurrently with the application.

### Why the other options are incorrect
- **Full major GC exactly like Parallel GC**: that is the Parallel GC model (throughput-oriented). G1 tries to avoid Full GC through concurrent marking + mixed collections; Full GC (multi-threaded since JDK 10) is only a fallback when evacuation fails, and its occurrence is a sign that tuning is needed.
- **It never stops the world**: incorrect. G1 has the STW phases described above. The goal is to keep STW short and predictable, not eliminate it entirely.
- **Only for heaps above 32 GB**: incorrect. G1 has been the default GC since Java 9 and works well with heaps from a few hundred MB to tens of GB. Only when the JVM determines that a machine is not "server-class" (fewer than 2 CPUs or less than approximately 1792 MB RAM) does ergonomics select SerialGC — the condition is CPU/RAM, not a 32 GB heap threshold.

### Quick comparison
| GC | Priority | Best suited for |
|---|---|---|
| SerialGC | low CPU usage, small heap | containers up to 512 MB |
| ParallelGC | high throughput | batch and bulk processing |
| G1 | balance latency and throughput | web services, heaps from a few GB to tens of GB |
| ZGC / Shenandoah | very low latency, extremely short pauses | strict p99 requirements, large heaps |

> Senior tip: do not choose a GC based on intuition. Measure with {{-Xlog:gc}}, set a p99 goal, then compare G1 throughput with ZGC on your own workload. Note that the default {{MaxGCPauseMillis}} value is 200 ms and G1 tunes itself toward that goal, sometimes producing lower throughput than expected.`
  },
  'qz-jvm-003': {
    q: 'A Java application hangs and CPU usage reaches 100%. You can only use tools bundled with the JDK. Which toolset is most suitable for diagnosis?',
    options: [
      'javac to recompile the source and compare bytecode before and after the patch',
      'jpackage to repackage the application and compare artifact sizes',
      'javadoc to generate documentation, then compare it with application logs to find the cause',
      'jstack to capture thread dumps and detect deadlocks, jcmd to capture heap dumps, and jstat to monitor GC activity'
    ],
    explain: `**Correct answer: jstack to capture thread dumps and detect deadlocks, jcmd to capture heap dumps, and jstat to monitor GC activity.**

### Why this is correct
The JVM diagnostic tools bundled with the JDK address exactly these production scenarios:

- **{{jstack <pid>}}**: prints a thread dump. Look for RUNNABLE threads consuming CPU (deadlock, infinite loop, busy-wait).
- **{{jcmd <pid> GC.heap_dump /tmp/heap.hprof}}**: captures a heap dump; the same tool also provides {{GC.heap_info}}, {{GC.class_histogram}}, {{Thread.print}} (equivalent to jstack), and {{JFR.start}} to record CPU/allocation profiles.
- **{{jstat -gcutil <pid> 1000}}**: tracks GC time percentage, full GC counts, and memory-region sizes over time.
- **{{jmap -dump:live,format=b,file=heap.hprof <pid>}}**: the older way to export a heap dump; analyze it with Eclipse MAT.

### Why the other options are incorrect
- **javac**: it only compiles and cannot analyze the state of a running process.
- **javadoc**: it generates API documentation and has nothing to do with runtime diagnosis.
- **jpackage**: it packages an application for distribution and is not a diagnostic tool either.

### Standard procedure when an application hangs
1. Capture **multiple** thread dumps 5–10 seconds apart: one is not enough; compare them to see which threads are running and on which lines.
2. With 100% CPU: use {{top -H -p <pid>}} to find the most CPU-intensive thread id, then match it to the {{nid}} field in the thread dump (JDK 18+ prints nid in decimal; JDK 8–17 prints it in hex, so convert to hex first) to see where that thread is running (or check the cpu= column in dumps from newer JDKs).
3. With a growing heap: capture a heap dump and analyze the dominator tree and retained objects.

> Senior tip: enable {{-XX:+HeapDumpOnOutOfMemoryError}} and {{-XX:+ExitOnOutOfMemoryError}} in advance in staging, and prefer {{jcmd}} because it combines all diagnostic commands into one Oracle-recommended tool. Remember that a thread dump needs a safepoint (usually only a few ms), while a heap dump stops the application for much longer (several seconds to tens of seconds with a large heap) — do not capture a heap dump on an instance receiving traffic without first removing it from the load balancer. When the application runs in a container, enable {{shareProcessNamespace}} or use platform tools (CloudWatch, Grafana) to collect metrics continuously instead of only capturing dumps after an incident has occurred.`
  },
  'qz-jvm-004': {
    q: 'Which statement about parent-delegation class loading is correct?',
    options: [
      'Each classloader defines a class itself first and only asks its parent classloader if it cannot find the class',
      'A classloader only loads classes from the JVM classpath; it cannot load classes from external JARs',
      'This mechanism applies only to interfaces, not concrete classes',
      'Each classloader asks its parent first and defines the class itself only if the parent cannot find it, ensuring java.lang.Object is always the same class'
    ],
    explain: `**Correct answer: Each classloader asks its parent first and defines the class itself only if the parent cannot find it, ensuring java.lang.Object is always the same class.**

### Why this is correct
The typical classloader chain since Java 9 is {{Bootstrap}} → {{Platform}} → {{Application}} (also called the system class loader), followed by framework-specific custom loaders. Each loader first calls {{loadClass}} on its parent; only if the parent cannot find the class does the child read the class from its own source (classpath, JAR, module path). As a result, {{java.lang.Object}} is loaded only by the bootstrap loader, and every other class shares the same definition → avoiding the confusing "same class name but different type" situation that causes {{ClassCastException}}.

### Why the other options are incorrect
- **Define it itself first**: that is the child-first strategy, the reverse of the standard model. It does exist (Tomcat uses it for each webapp's classes to isolate libraries), but {{java.*}} must still be delegated to the parent; it is not the default JVM behavior.
- **Only loads from the classpath**: incorrect; {{URLClassLoader}} and embedded containers (Tomcat, Spring Boot fat jar) load classes from separate JARs and directories.
- **Only applies to interfaces**: incorrect; it applies to every class.

### Practical implications
Parent-first does **not** resolve version conflicts: within a single loader there is only one version of each class, and whichever version appears first on the classpath wins (the origin of {{NoSuchMethodError}} when two libraries require different versions). True isolation requires a separate classloader for each plugin/webapp (as in Tomcat or OSGi). Watch for classloader leaks: if just one object held by the parent loader (ThreadLocal, static cache, registered JDBC driver) references a class from the child loader, the entire child loader and all its classes cannot be garbage-collected after redeployment.

> Senior tip: when you encounter an "inexplicable" {{ClassCastException}} (one that logic cannot explain), consider that the same class was loaded by two different classloaders. Print {{obj.getClass().getClassLoader()}} and {{obj.getClass().getName()}} to compare them. With Spring Boot, inspect the {{spring-boot-loader}} configuration and avoid mixing "provided" jars with packaged jars.`
  },
  'qz-jvm-005': {
    q: 'Which statement about the HotSpot JIT compiler is correct?',
    options: [
      'JIT compiles all bytecode as soon as a class is loaded, so the application needs no warm-up',
      'C2 only optimizes methods marked final; other methods are never optimized',
      'C1 compiles quickly, while C2 compiles more slowly but optimizes more aggressively; tiered compilation combines both and can deoptimize when an assumption proves false',
      'Deoptimization only happens when the application stops completely, so it does not affect operations'
    ],
    explain: `**Correct answer: C1 compiles quickly, while C2 compiles more slowly but optimizes more aggressively; tiered compilation combines both and can deoptimize when an assumption proves false.**

### Why this is correct
HotSpot uses **tiered compilation**: methods are usually compiled first by C1 (the client compiler, with limited optimization and fast compilation) so executable code is available quickly. Once a method has been invoked enough times, the JVM moves to C2 (the server compiler) for deeper optimization based on the execution profile: which branches are usually taken, which data types actually appear, and which call sites are polymorphic.

**Deoptimization** occurs when a C2 assumption is invalidated — for example, C2 assumes an interface has only one implementer, and then a second implementer appears. The JVM discards the compiled code, returns to the interpreter, collects a new profile, and recompiles. This is why seemingly simple code can become slow partway through execution.

### Why the other options are incorrect
- **Compiles as soon as the class is loaded**: incorrect; HotSpot uses the interpreter first and only then applies JIT according to the profile.
- **C2 only optimizes final methods**: completely incorrect; final usually makes code *easier* to optimize (devirtualization), rather than being a prerequisite for optimization.
- **Deoptimization only when the application stops**: incorrect; it happens at runtime and causes latency "spikes".

### Operational consequences
- **Warm-up**: the JVM becomes faster after a few minutes of running, which is why a load test needs a separate warm-up phase.
- **Profile pollution**: a shared method called with many different data types (for example, warm-up data unlike production data) makes the profile megamorphic, preventing C2 from inlining/devirtualizing and making the code slower.

> Senior tip: for a system with strict latency requirements (p99 < 50 ms), do not expect JIT to solve everything — reduce object allocation, avoid megamorphic call sites, and consider {{-XX:+UseZGC}} if pauses are the main problem. Also always measure with exactly the same JVM flags as production, because different configurations produce different results.`
  },
  'qz-jvm-006': {
    q: 'According to the Java Memory Model, what is guaranteed about the {{final}} fields of an object after its constructor completes?',
    options: [
      'There is no guarantee for final values; every field must be declared volatile to be safe',
      'Final values are frozen at the end of the constructor, so another thread reading the reference after construction sees the correct values',
      'Only primitive fields are guaranteed; reference fields still need to be declared volatile',
      'The guarantee applies only within the same thread that created the object'
    ],
    explain: `**Correct answer: Final values are frozen at the end of the constructor, so another thread reading the reference after construction sees the correct values.**

### Why this is correct
JSR-133 (Java 5) defines **final field semantics**: when the constructor completes, the object's final values are "frozen" and guaranteed to be visible to every other thread, even if the object is published without any other happens-before relationship. This is the basis for safely sharing immutable objects such as {{String}} or {{java.time}} without {{volatile}}.

### Why the other options are incorrect
- **They must be declared volatile**: incorrect; that is an unnecessary restriction. {{final}} alone is sufficient in this case.
- **Only primitives are guaranteed**: incorrect; final field semantics apply to reference fields as well.
- **It only applies within the same thread**: incorrect; that describes behavior without final field semantics.

### Limits of this guarantee
- **The constructor must not "escape this"**: if you expose {{this}} (register a listener, invoke a callback, store it in another collection) *inside* the constructor, another thread can see the object before its fields are assigned → the guarantee is voided.
- **A final field does not make the object immutable**: the JMM guarantees that another thread sees the state of the object referenced by a final field (for example, the contents of a {{List}}) **as it was when the constructor completed**; however, any **subsequent** changes to the List have no visibility guarantee — synchronization is then required ({{synchronized}}, concurrent collections, etc.).

> Senior tip: this is exactly why "safe publication" (publishing through a {{final}} field, {{volatile}}, a lock, or a concurrent collection) is recommended. The safest approach is to make the object completely immutable: {{final}} fields referencing immutable data ({{List.copyOf}}, records) — then no additional synchronization is needed.`
  },
  'qz-spring-001': {
    q: 'Why does calling an {{@Transactional}} method from another method in the same class fail to create a transaction?',
    options: [
      'Because Spring only supports transactions on public methods; private methods cannot be proxied',
      'Because @Transactional must be declared on the class interface',
      'Because transactions only work when a request passes through an HTTP controller',
      'Because @Transactional is applied through a proxy; an internal call bypasses the proxy, so the advice is not triggered'
    ],
    explain: `**Correct answer: Because @Transactional is applied through a proxy; an internal call bypasses the proxy, so the advice is not triggered.**

### Why this is correct
Spring creates a proxy (a JDK dynamic proxy for an interface, CGLIB for a class) around the bean. When external code calls {{orderService.placeOrder(...)}}, the call passes through the proxy, which starts a transaction before invoking the real method. But when code inside that class calls {{this.placeOrder(...)}}, the real object is invoked directly — with no proxy in between — so {{TransactionInterceptor}} never runs.

There are two practical consequences:
1. **An internally called method ignores its entire {{@Transactional}} configuration**: if the calling method already has a transaction, it runs in that transaction; otherwise it runs without one. This easily causes bugs when a "separate rollback" is expected.
2. **Propagation {{REQUIRES_NEW}}**, {{readOnly}}, {{timeout}}, and {{rollbackFor}} on that method also have no effect, because they are all handled by proxy advice.

### Why the other options are incorrect
- **Only public methods are supported**: that is not the cause here — even a public method bypasses the proxy during an internal call. (Since Spring 6.0, with CGLIB proxies, {{@Transactional}} also applies to protected and package-private methods; private methods can never be proxied.)
- **It only works through an HTTP controller**: incorrect; transactions work at any layer when the call passes through a proxy.
- **It must be declared on an interface**: incorrect; declaring it on a class is perfectly valid.

### Solutions
~~~java
// Option 1: move it to another bean
@Service
class OrderService {
    private final PaymentService paymentService;   // separate bean, called through a proxy
    void placeOrder() { paymentService.charge(); }
}

// Option 2: use AopContext.currentProxy() (requires exposeProxy = true)
// Option 3: use TransactionTemplate instead of the annotation
~~~

> Senior tip: do not choose proxies for "convenience" and then fall into the self-invocation trap. A safe rule is: **each transaction boundary should be a public method on a separate bean**. If self-invocation must work reliably, use {{TransactionTemplate}} — it invokes directly without depending on a proxy, and is easier to read when propagation and timeout need to be explicit.`
  }
});
