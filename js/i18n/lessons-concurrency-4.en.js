/*
 * English translation of js/data/lessons-concurrency.js — task T272. Format: js/core/i18n.js (content overlay).
 * ids: lesson-concurrency-004 lesson-concurrency-005
 */
App.i18n.content({
  'lesson-concurrency-004': {
    title: 'CompletableFuture: thenCompose, thenCombine, allOf, error handling and timeouts',
    goals: [
      'Distinguish {{thenApply}}, {{thenCompose}} and {{thenCombine}}, and know which thread the callbacks run on',
      'Fan many parallel calls out with {{allOf}} without blocking threads',
      'Handle errors with {{exceptionally}}/{{handle}}, and understand {{CompletionException}} and {{ExecutionException}}',
      'Add timeouts with {{orTimeout}}/{{completeOnTimeout}} and know why you always pass a dedicated executor',
    ],
    body: `### From Future to CompletableFuture
The {{Future}} of an ExecutorService has exactly one way to retrieve a result: {{get()}}, which **blocks** the calling thread. To express "when A finishes, do B" you have to keep a thread parked while waiting. {{CompletableFuture}} (Java 8) is a Future that can be **completed from the outside** ({{complete}}, {{completeExceptionally}}) and lets you **register callbacks**: once the result is available, dependent stages are activated automatically. Inside, each CompletableFuture keeps a result (or an exception) and a **stack of dependent stages**; when it is completed it activates those stages one by one.

### Which thread do the callbacks run on?
~~~java
CompletableFuture<User> user = CompletableFuture.supplyAsync(() -> userApi.get(id), ioPool); // runs on ioPool
user.thenApply(User::name);          // NOT Async: runs on the thread that completed 'user',
                                     // or right on the calling thread if 'user' is already done
user.thenApplyAsync(User::name, cpuPool);   // always hops over to cpuPool
~~~
- {{supplyAsync(supplier)}} **without an executor** uses {{ForkJoinPool.commonPool()}} (default parallelism = number of cores − 1; if parallelism is below 2, each task runs on a fresh thread). The commonPool is shared by the whole JVM, including parallel streams. Put blocking IO on it and a few slow calls will choke everything else. **Always pass a dedicated executor for IO.**
- Methods without the {{Async}} suffix run on the thread that completed the previous stage. If that is an IO thread of an HTTP client, heavy computation inside {{thenApply}} will hog an IO thread.

### Three ways to chain: map, flatMap, zip
| Method | Similar to | Use when |
|---|---|---|
| {{thenApply(f)}} | map | Synchronous transformation of the result: {{f}} returns a value |
| {{thenCompose(f)}} | flatMap | The next step is **also asynchronous**: {{f}} returns a CompletableFuture; avoids {{CompletableFuture<CompletableFuture<T>>}} |
| {{thenCombine(other, f)}} | zip | Two **independent** jobs run in parallel, results merged once both finish |
| {{allOf(cfs...)}} | | Wait for N jobs; returns {{CompletableFuture<Void>}}, so you must {{join()}} each one yourself to get its result |
| {{anyOf(cfs...)}} | | Whichever job finishes first (even if it finishes because of an error) |

~~~java
CompletableFuture<Order> order = findUser(id)                     // CF<User>
    .thenCompose(u -> findCart(u.cartId()))                         // CF<Cart>, no nesting
    .thenCombine(findPromo(id), (cart, promo) -> price(cart, promo)) // findPromo runs in parallel
    .orTimeout(800, TimeUnit.MILLISECONDS);                         // Java 9+
~~~

### Error handling: exceptions travel down the chain
If one stage throws, every dependent stage **skips its function** and completes with the same error, wrapped in {{CompletionException}}, until it meets a handler:
- {{exceptionally(ex -> fallback)}}: runs only on failure, returns a replacement value.
- {{handle((value, ex) -> ...)}}: always runs, receives both, returns a new value.
- {{whenComplete((value, ex) -> ...)}}: always runs, used for logs/metrics, does **not change** the result.

Fetching the result: {{join()}} throws {{CompletionException}} (unchecked), {{get()}} throws {{ExecutionException}} (checked); both expose {{getCause()}} as the original exception. Inside a handler, {{ex}} is usually already wrapped in a CompletionException, so check {{ex.getCause()}} before testing its type.

### Timeouts
Java 9 added {{orTimeout(t, unit)}} (on timeout the future completes with {{TimeoutException}}) and {{completeOnTimeout(value, t, unit)}} (on timeout it completes with a default value). Both use an internal scheduler thread and block nobody. But they only complete the **future** — they do not stop the work underneath: the HTTP call keeps running and keeps holding its thread. Same for {{cancel(true)}}: with CompletableFuture the {{mayInterruptIfRunning}} argument has no effect. So you still need timeouts at the client layer (connect/read timeout of the HTTP client, query timeout of JDBC).

| Situation | How to write it |
|---|---|
| Call 3 sources, need all 3 | {{allOf}} + {{orTimeout}}; a failure fails the whole request |
| Call 3 sources, skip the ones that fail | {{exceptionally(ex -> null)}} on each source before {{allOf}}, then filter out the nulls |
| Only need the fastest source | {{anyOf}} (careful: the fastest failing source also "wins") |
| Use a default value when a source is slow | {{completeOnTimeout(defaultValue, t, unit)}} |

### Production bugs you will actually meet
- Calling {{join()}} **inside** a callback that runs on the same pool: threads wait on each other, the pool runs dry, and you get a starvation deadlock.
- No error handler and nobody calls {{join}}: the exception vanishes and all you see is a request that "returns nothing".
- Losing MDC/traceId, SecurityContext, the transaction: they live in the ThreadLocal of the original thread while the callback runs on another thread. You need an executor with context wrapping (Micrometer Context Propagation, Spring's {{TaskDecorator}}).
- {{anyOf}} returns {{CompletableFuture<Object>}} and completes as soon as the first source **fails**, so it cannot be used directly for "get the first successful source".

### Interview relevance
Frequent questions: "How is thenApply different from thenCompose?", "What is the default executor of supplyAsync and why is it dangerous?", "You call 3 services in parallel — one of them is slow, what do you do?". The senior answer: a dedicated executor for IO, timeouts at both the future layer and the client layer, per-source fallbacks, and knowing that Java 21 offers another route — virtual threads with plain sequential blocking code that is easier to read (lesson 5).`,
    exercises: [
      {
        title: 'Fetch the best price from many sources in parallel, with fallback and timeout',
        prompt: `Write {{PriceAggregator}} that takes an {{Executor}} in its constructor. The method {{bestPrice(sources, timeoutMs)}}:

- Calls **every** price source ({{Supplier<Integer>}}) **in parallel** on the executor you passed in.
- Returns a {{CompletableFuture<Integer>}} **immediately** (it must not block the calling thread waiting for results).
- The result is the **lowest** price among the sources that succeeded.
- A source that throws, returns null, or has not finished after {{timeoutMs}} milliseconds is ignored.
- No source succeeds (including an empty list): the future completes **with an error** {{NoSuchElementException}} (when you call {{get()}}, the cause of the {{ExecutionException}} is a NoSuchElementException).

Hint: Java 9+ has {{completeOnTimeout}} and {{orTimeout}}.`,
        hints: [
          'For each source: {{CompletableFuture.supplyAsync(source, executor)}}. Do not forget the executor argument.',
          'Turn "failure" and "timeout" into null: {{.completeOnTimeout(null, timeoutMs, TimeUnit.MILLISECONDS).exceptionally(ex -> null)}}.',
          'Gather with {{CompletableFuture.allOf(...)}} then {{thenApply}}: inside, {{join()}} each future, filter out the nulls, take the min; if there is none, throw {{NoSuchElementException}} so the result future completes with an error.',
        ],
        explain: `The solution blocks nowhere: {{bestPrice}} only assembles a chain of callbacks and returns. Each source is "normalized" into a future that **never fails**: it has a price, or null on failure/timeout. That is why {{allOf}} always completes normally, and the final choice lives in a single place. Throwing {{NoSuchElementException}} inside {{thenApply}} makes the result future complete with an error (inside is a CompletionException wrapping the NoSuchElementException; {{get()}} unwraps that layer and throws an ExecutionException whose cause is the NoSuchElementException).

Note the order: {{completeOnTimeout}} comes **before** {{exceptionally}} and is called on the very future returned by {{supplyAsync}}; it completes that future with null when the deadline passes. The slow source keeps running on the executor until it finishes on its own: a CompletableFuture timeout cannot stop the work underneath.

Common mistakes:
- {{supplyAsync(s)}} without an executor: it runs on the commonPool; the test that checks thread names will fail.
- Calling {{join()}}/{{get()}} on each source right inside the loop: that runs sequentially and blocks the calling thread.
- Using {{anyOf}}: it returns the source that finishes **first**, not the cheapest one, and a fast failure also "wins".
- Using {{orTimeout}} with no {{exceptionally}} after it: one slow source poisons the whole result.`,
      },
    ],
    check: [
      {
        q: '{{CompletableFuture.supplyAsync(() -> callApi())}} without an executor. Where does the task run (Java 17, an 8-core machine)?',
        options: ['On a brand-new thread created just for the task', 'On {{ForkJoinPool.commonPool()}}', 'On the thread that called supplyAsync', "On Tomcat's pool"],
        answer: 1,
        explain: `The default is commonPool (parallelism 7 on an 8-core machine). Only when the commonPool's parallelism is below 2 (a 1–2 core machine) is a new thread created per task. The calling thread does not run the task (that is the behavior of {{thenApply}} when the previous stage is already done). CompletableFuture knows nothing about Tomcat.`,
      },
      {
        q: '{{findUser(id)}} returns {{CompletableFuture<User>}}, {{findOrders(user)}} returns {{CompletableFuture<List<Order>>}}. How do you chain the two steps to get {{CompletableFuture<List<Order>>}}?',
        options: ['{{findUser(id).thenApply(u -> findOrders(u))}}', '{{findUser(id).thenCompose(u -> findOrders(u))}}', '{{findUser(id).thenCombine(findOrders(u), ...)}}', '{{CompletableFuture.allOf(findUser(id), findOrders(u))}}'],
        answer: 1,
        explain: `{{thenCompose}} is flatMap: the function returns a CompletableFuture and the result is "flattened". {{thenApply}} would give you {{CompletableFuture<CompletableFuture<List<Order>>>}}. {{thenCombine}} is for two **independent** jobs, whereas here step two needs the user from step one (and {{u}} does not exist yet). {{allOf}} returns {{CompletableFuture<Void>}} and also needs the user first.`,
      },
      {
        q: 'Future {{f}} has {{f.orTimeout(1, SECONDS)}}; the HTTP call inside takes 10 seconds. What happens after 1 second?',
        options: ['The HTTP call is interrupted and stops', 'The future completes with TimeoutException while the HTTP call keeps running until it finishes', 'The thread doing the HTTP work is cancelled and the pool creates a new one', 'Nothing happens until you call get()'],
        answer: 1,
        explain: `{{orTimeout}} only completes the future with a TimeoutException; CompletableFuture does not know which thread is doing the work so it cannot interrupt it, and the pool does not kill threads. The timeout is scheduled as soon as {{orTimeout}} is called — nobody needs to call {{get()}}. That is why you still need a read timeout on the HTTP client.`,
      },
    ],
  },
  'lesson-concurrency-005': {
    title: 'Virtual threads (Java 21): mount/unmount, pinning and when they really pay off',
    goals: [
      'Explain how a virtual thread is mounted/unmounted onto a carrier thread and why it is cheap',
      'Recognize pinning (synchronized, native) on JDK 21–23, know what JEP 491 changes in JDK 24, and how to diagnose it',
      'Know when virtual threads increase throughput and when they do not (CPU-bound work, limited resources)',
      'Bound concurrency with a {{Semaphore}} instead of pool size',
    ],
    body: `### The problem virtual threads solve
The thread-per-request model (one thread per request, plain blocking code) is easy to write, easy to debug, and produces clear stack traces. But a platform thread is an OS thread: it costs stack memory, and creating it and switching contexts is expensive, so a service usually runs only a few hundred to a few thousand threads. If every request waits 100 ms for the database, 200 Tomcat threads serve only about 2.000 requests/s (Little's law), even though the CPU is almost idle. The old way past this limit is asynchronous programming (CompletableFuture, reactive), at the cost of hard-to-read code and useless stack traces.

**Virtual threads** (JEP 444, final in **Java 21**) keep the blocking code model but make threads **cheap**: you can create millions of them.

### Mount and unmount
~~~java
// Java 21: one virtual thread per task, no pool needed
try (ExecutorService ex = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 10_000; i++) {
        int id = i;
        ex.submit(() -> httpClient.send(request(id), ofString()));  // ordinary blocking code
    }
}   // close() waits for every task to finish
Thread.ofVirtual().name("vt-", 0).start(task);   // create one directly
~~~

Inside:
1. A virtual thread is a Java object on the heap, bound to a **continuation** (the execution state: stack frames, the current position).
2. The JDK has its own scheduler, a {{ForkJoinPool}} in FIFO mode; the threads of that pool are called **carrier threads**, and by default there is one carrier per core.
3. When a virtual thread runs, it is **mounted** onto a carrier: its frames execute on the carrier's stack.
4. When it hits a blocking operation that the JDK has reimplemented for virtual threads (socket reads, {{Thread.sleep}}, {{BlockingQueue.take}}, {{ReentrantLock.lock}}, {{LockSupport.park}}...), the JDK **unmounts** it: it copies the necessary frames to the heap and gives the carrier back to another virtual thread. When the data arrives (the socket is ready), the virtual thread is put back on the scheduler's queue and mounted onto some carrier.

Because the stack is allocated on the heap and grows on demand, a waiting virtual thread costs a few hundred bytes to a few KB instead of a fixed stack region.

### Pinning: when a virtual thread cannot unmount
A virtual thread is **pinned** to its carrier (blocking the carrier as well) when it blocks while:
- Inside a {{synchronized}} block or method (JDK 21, 22, 23). The monitor of a synchronized block is tracked per carrier thread, so the JDK cannot swap the carrier midway.
- A native frame or foreign function is on the stack.

Short pins are fine. Long pins (calling JDBC or HTTP inside synchronized) lose the carrier: with 8 carriers, 8 pinned requests freeze the whole application even if thousands of virtual threads are ready to run. What to do on JDK 21–23: replace the {{synchronized}} around IO with {{ReentrantLock}}, upgrade libraries (many JDBC drivers have already moved to ReentrantLock), and diagnose with the JFR event {{jdk.VirtualThreadPinned}} or the flag {{-Djdk.tracePinnedThreads=full}}.

**JEP 491 (JDK 24)** lets a virtual thread unmount even while holding or waiting for a synchronized monitor, so the most common cause of pinning disappears; the {{jdk.tracePinnedThreads}} flag was removed as well. Pinning can still happen when going through native code. Note: JDK 24 is not an LTS release; the next LTS with this change is JDK 25.

| Criterion | Platform thread | Virtual thread |
|---|---|---|
| Mapping | 1–1 with an OS thread | Many virtual threads on few carriers |
| Creation cost / memory while waiting | High (fixed stack, system call) | Very low (object on the heap) |
| Should you pool them | Yes | **No**: create one per task |
| Fits | CPU-bound work, few threads | IO-bound work: lots of concurrent jobs that spend most of their time waiting |
| Bounding concurrency | Pool size | {{Semaphore}}, rate limiter, connection pool size |

### When it pays off, when it does not
- Virtual threads increase **throughput** for waiting on IO; they do **not** make any single request faster. CPU-bound work on a virtual thread is no faster than on a platform thread, because there are still only as many carriers as cores.
- Backend resources are still limited: 10.000 virtual threads calling one database with a 20-connection pool means 9.980 of them wait for a connection (they unmount while waiting so they do not burn carriers, but connection-acquisition timeouts can explode en masse). The same goes for a neighboring partner API with a rate limit. Bound with a {{Semaphore}}, not by pooling virtual threads.
- {{ThreadLocal}} still works, but a million threads each holding a heavy object in a ThreadLocal (a cached formatter, a buffer) is a million copies. {{ScopedValue}} (preview in Java 21) is the alternative direction for passing context.
- Virtual threads are always daemon threads with a fixed priority.

### Production bugs you will actually meet
- Turning on {{spring.threads.virtual.enabled=true}} (Spring Boot 3.2+) on JDK 21 while your code or a library has {{synchronized}} around IO: under load the app freezes because every carrier gets pinned.
- Replacing a 200-thread pool with virtual threads and getting the database "knocked over" because there is no longer a natural cap on concurrent requests to it.
- Pooling virtual threads ({{newFixedThreadPool}} with a factory that creates virtual threads): you lose the benefit and still bound the wrong thing.
- Benchmarking CPU-bound work and concluding "virtual threads are no faster".

> How to measure properly: compare throughput and p99 at the same load with a realistic workload (IO dominating the time), watch the JFR {{jdk.VirtualThreadPinned}} events, and count how many carriers are busy.

### Interview relevance
Frequent questions: "How do virtual threads work?", "What is pinning and how do you fix it?", "Should we move everything to virtual threads?". The senior answer: explain mount/unmount on carriers, call out pinning with synchronized on JDK 21–23 and JEP 491 on JDK 24, stress that the bottleneck merely moves from thread count to backend resources (connection pool, rate limit), and that you do not pool virtual threads — you bound them with a Semaphore.`,
    exercises: [
      {
        title: 'Run 10.000 IO tasks on any executor, bounding concurrency with a Semaphore',
        prompt: `The exercise compiles on Java 17, so write code that does **not depend on the executor type**: on Java 21 the same method receives {{Executors.newVirtualThreadPerTaskExecutor()}}; in the test it receives a plain pool.

Write {{IoBatch.fetchAll(executor, ids, io, maxInFlight)}}:
- Each id becomes **one task** submitted to {{executor}} (thread-per-task style); inside the task call {{io.apply(id)}} (a simulated IO call).
- At any point in time **at most {{maxInFlight}}** calls to {{io}} are running (use a {{Semaphore}}: this is how you bound resources with virtual threads, since you do not pool them).
- Return the results **in the same order** as {{ids}}. A call that throws becomes {{"ERR-" + id}}.
- Do **not** shutdown the executor (the caller owns it).
- {{maxInFlight < 1}} throws {{IllegalArgumentException}}. An empty list returns an empty list.`,
        hints: [
          'Create {{new Semaphore(maxInFlight)}}; in each task: {{acquire()}}, call {{io.apply(id)}} inside a {{try}}, and {{release()}} in a {{finally}}.',
          'Submit all tasks first, keep a {{List<Future<String>>}}, then {{get()}} them one by one: parallel and in order at the same time.',
          'Catch {{RuntimeException}} around {{io.apply}} to return {{"ERR-" + id}}. Do not call {{executor.shutdown()}}.',
        ],
        explain: `This is exactly the shape of the code you write with virtual threads on Java 21:

~~~java
try (ExecutorService ex = Executors.newVirtualThreadPerTaskExecutor()) {
    List<String> out = IoBatch.fetchAll(ex, ids, partnerApi::get, 50);
}
~~~

One task per id, no need to think about pool size; what needs bounding is **the number of concurrent calls to the partner** (50), and a Semaphore does that. With virtual threads, the 9.950 tasks waiting for a permit unmount and cost almost nothing. With a plain pool like the one in the test, a thread waiting for a permit still occupies a platform thread, which is why on Java 17 people usually bound concurrency with pool size; on Java 21 with virtual threads the Semaphore is the right approach.

Why must {{release()}} be in a {{finally}}? If a call throws and does not return its permit, every failure loses one permit forever; after {{maxInFlight}} failures all remaining tasks wait forever.

Common mistakes:
- Calling {{get()}} right after each {{submit}}: that runs sequentially and throws the benefit away.
- Shutting down the caller's executor: with a shared virtual-thread executor the rest of the application gets {{RejectedExecutionException}}.
- Bounding by creating {{newFixedThreadPool(50)}} with a virtual-thread factory: that is "pooling virtual threads", against the recommendation of JEP 444.
- {{acquire()}} inside a {{synchronized}} block: on JDK 21–23 the virtual thread is pinned while waiting for the permit.`,
      },
    ],
    check: [
      {
        q: 'On JDK 21, a virtual thread calls JDBC (blocking on a socket) **inside** a {{synchronized}} method. What happens?',
        options: ['The virtual thread unmounts normally and the carrier is released', 'The virtual thread is pinned: the carrier thread is blocked along with it for the whole wait', 'The JVM throws IllegalStateException', 'synchronized is automatically rewritten as ReentrantLock'],
        answer: 1,
        explain: `On JDK 21–23, blocking inside synchronized pins the virtual thread and the carrier cannot serve other virtual threads. Only from JDK 24 (JEP 491) can it unmount in this case. The JVM throws no exception; pinning only hurts performance and is detected via JFR {{jdk.VirtualThreadPinned}}. The JVM does not rewrite synchronized into ReentrantLock for you: you must fix the code or upgrade the driver.`,
      },
      {
        q: 'Your service calls a partner API that allows 50 concurrent requests. After moving to virtual threads, how do you bound it?',
        options: ['{{Executors.newFixedThreadPool(50)}} with a ThreadFactory that creates virtual threads', '{{Semaphore(50)}} around the API call, one virtual thread per task', 'Set the number of carrier threads to 50', 'No bound needed because virtual threads are cheap'],
        answer: 1,
        explain: `Virtual threads should not be pooled; bounding a resource with a Semaphore (or a bulkhead/rate limiter) at the point of use is correct. A pool of 50 virtual threads is "pooling something cheap" and also throttles work that never touches the API. The number of carriers determines how many virtual threads **run on the CPU** at once, which has nothing to do with how many requests are waiting on IO. With no bound, the partner returns 429 or goes down.`,
      },
      {
        q: 'Which workload benefits **the least** from moving to virtual threads?',
        options: ['An API gateway that calls 3 backend services per request', 'A batch job compressing and encrypting files with the CPU always at 100%', 'A consumer that processes messages and writes to the database', 'A service that reads S3 and returns the data to the client'],
        answer: 1,
        explain: `CPU-bound work has no waiting time in which to yield the carrier, and the number of carriers equals the number of cores, so throughput does not increase. The other three options spend most of their time waiting on IO (HTTP, DB, S3): that is exactly where virtual threads let you run many jobs at once with simple blocking code.`,
      },
    ],
  },
});
