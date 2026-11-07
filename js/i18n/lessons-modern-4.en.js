/*
 * English translation of js/data/lessons-modern.js — task T802. Format: js/core/i18n.js (content overlay).
 * ids: lesson-modern-007
 */
App.i18n.content({
  'lesson-modern-007': {
    title: 'Fan-out: calling several services in parallel with CompletableFuture, timeout, fallback and virtual threads',
    goals: [
      'Know why calling 3 services sequentially adds their times up, while fan-out shrinks the total to the slowest service',
      'Use supplyAsync with a dedicated executor, allOf to wait, and exceptionally/completeOnTimeout for fallback and timeout',
      'Explain what virtual threads and structured concurrency change compared to CompletableFuture',
    ],
    body: `**Summary:** One screen needs data from 3 independent services. Called sequentially, the response time is the **sum** of the three calls (600 ms for three calls of 200 ms). Fan-out means starting all three at the same time and only then waiting: the time drops to the **slowest** call (200 ms). In Java 8+ the plain-Java way is {{CompletableFuture}} with {{supplyAsync}} + {{allOf}} + {{orTimeout}}/{{completeOnTimeout}} plus {{exceptionally}} for fallback. From Java 21, virtual threads let you write sequential code that is still parallel, and structured concurrency (preview) manages child tasks as a tree.

### The problem: three calls, 200 ms each
~~~seq
title: Home page calls 3 services
actors: Web | Profile | Orders | Score
Web -> Profile: GET /profile
Web -> Orders: GET /orders
Web -> Score: GET /score
note Web..Score: all three are started at the same time
Profile --> Web: 200 ms
Orders --> Web: 200 ms
Score --> Web: 200 ms
note Web..Score: total time about 200 ms, not 600 ms
~~~

Sequential code (very common in freshly written services):

~~~java
Profile p = profileClient.get(id);      // 200 ms
List<Order> o = orderClient.list(id);   // 200 ms
Score s = scoreClient.of(id);           // 200 ms
// total: 600 ms, even though the three calls do not depend on each other
~~~

These three calls are **independent**: none of them needs the result of the one before. That is the precondition for fan-out. If the second call needs an id that comes out of the first one, you cannot parallelise them (that is a dependency — use {{thenCompose}}).

### What CompletableFuture is, explained from the ground up
The plain {{java.util.concurrent.Future}} (what {{ExecutorService.submit}} returns) only offers {{get()}}, which **blocks**, and you cannot attach follow-up work to it. {{CompletableFuture}} (Java 8) is both a box holding the result and the place where you register the steps to run once the result exists. It has three states: not finished yet, finished normally (has a value), finished with an error (has an exception).

Starting a piece of work on a different executor:

~~~java
Executor io = Executors.newFixedThreadPool(32);
CompletableFuture<Profile> f = CompletableFuture.supplyAsync(() -> profileClient.get(id), io);
// f returns IMMEDIATELY, nothing is awaited yet. The web thread is not held.
~~~

**Always pass an executor.** Without one, {{supplyAsync}} runs on {{ForkJoinPool.commonPool()}}, and that pool by default has only about "number of CPUs - 1" threads and is **shared by the whole JVM** (parallel streams use it too). An I/O call blocks: 7 concurrent requests fill the pool and every other parallel computation in the process starves. So: a dedicated pool for I/O (name its threads so jstack is readable), and leave the common pool for CPU work.

### Chaining work and combining work
| Method | Use when | Result |
|---|---|---|
| {{thenApply(fn)}} | turn a result into another result (same step) | {{CF<U>}} |
| {{thenCompose(fn)}} | the next step **itself returns a CF** (avoids CF nested in CF) | {{CF<U>}} |
| {{thenAccept}} / {{thenRun}} | just consume the result / just do work with no value | {{CF<Void>}} |
| {{thenCombine(other, fn)}} | merge two **independent** tasks once both are done | {{CF<V>}} |
| {{exceptionally(fn)}} | build a fallback when the branch fails | {{CF<T>}} |
| {{handle(fn)}} | runs for success and for failure alike | {{CF<U>}} |
| {{whenComplete(fn)}} | observe / clean up (measure time, log) and then rethrow | {{CF<T>}} |

{{thenApply}} and {{thenCompose}} are the {{map}} and {{flatMap}} of the async world: if your function returns a {{CompletableFuture}}, using {{thenApply}} gives you {{CompletableFuture<CompletableFuture<X>>}} — useless.

### Fan out, then wait: allOf
{{CompletableFuture.allOf(a, b, c)}} returns a {{CompletableFuture<Void>}}: it only announces "everything is done", it **carries no values**. So you must keep the list of futures around and read each one afterwards:

~~~java
List<CompletableFuture<Item>> calls = sources.stream()
    .map(s -> CompletableFuture.supplyAsync(s, io))
    .toList();
CompletableFuture<Void> done = CompletableFuture.allOf(calls.toArray(new CompletableFuture[0]));
// done.join() only says "all finished"; the values come from calls
List<Item> items = calls.stream().map(CompletableFuture::join).toList();
~~~

Once {{allOf}} has completed every future is already done, so {{join}} in the next step **does not block**. That is the standard pattern: start everything, attach fallback/timeout, {{allOf}}, then combine.

### Timeout: orTimeout and completeOnTimeout (Java 9+)
~~~java
// error if it takes longer than 200 ms: the future completes with TimeoutException
f.orTimeout(200, TimeUnit.MILLISECONDS);
// or use a default value if it takes longer than 200 ms:
g.completeOnTimeout("N/A", 200, TimeUnit.MILLISECONDS);
~~~

Two points that are often misunderstood:
- A timeout does **not stop** the work underneath. It only completes the future with {{TimeoutException}}; the thread doing the HTTP call keeps calling until it finishes. To really stop it you need a **read timeout in the HTTP client** ({{RestClient}}, {{HttpClient.newBuilder().connectTimeout/connectTimeout}}) or {{Future.cancel(true)}} on a {{submit}} result.
- {{orTimeout}} breaks the whole chain if you do not handle the error downstream; {{completeOnTimeout}} is handy for fallback but hides the information "this source was slow".

{{join()}} throws {{CompletionException}} (unchecked) while {{get()}} throws {{ExecutionException}} (checked); both **wrap** the original error, so to know what really failed look at {{getCause()}}.

### Per-branch fallback before combining
If one branch fails and nothing handles it, {{allOf}} completes **with that error** and you lose the results of all the healthy branches too. The fix: "normalise" every branch into a future that never fails.

~~~java
CompletableFuture<String> safe = CompletableFuture.supplyAsync(scoreClient::fetch, io)
        .orTimeout(200, TimeUnit.MILLISECONDS)
        .exceptionally(ex -> "N/A");     // failing or slow source -> default value
~~~

After {{exceptionally}} the error has been "consumed"; put it at the end of the chain. If you want to know which source had to fall back (for logging/metrics), use {{handle((v, ex) -> ...)}} instead of {{exceptionally}}.

### Virtual threads (Java 21): same problem, sequential code
A virtual thread is a thread the JVM schedules on top of a few OS carrier threads. When it blocks in {{sleep}}, {{read}}, {{await}}, it is **removed from** the carrier (unmounted) and the carrier goes to run another thread, so blocking becomes nearly free. The result: you keep readable sequential code and still get fan-out.

~~~java
try (var pool = Executors.newVirtualThreadPerTaskExecutor()) {
    var p = pool.submit(() -> profileClient.get(id));
    var o = pool.submit(() -> orderClient.list(id));
    var s = pool.submit(() -> scoreClient.of(id));
    // you still need a timeout: get(timeout) or a deadline
    return new Page(p.get(200, TimeUnit.MILLISECONDS),
                    o.get(200, TimeUnit.MILLISECONDS),
                    s.get(200, TimeUnit.MILLISECONDS));
}   // close() waits until every task is done; close() can be interrupted -> catch IOException
~~~

It is not a silver bullet: it does not speed up CPU-bound work, you still need to **cap concurrency** towards the DB (a Semaphore or a DB pool), and on Java 21 code inside a long-held {{synchronized}} block can **pin** the carrier thread (improved in JDK 24; use {{-Djdk.tracePinnedThreads=full}} to see it). With Spring Boot 3.2+ it is enough to set {{spring.threads.virtual.enabled=true}} for MVC.

### Structured concurrency (preview, Java 21+)
The problem that remains: whether you fan out with {{CompletableFuture}} or with virtual threads, the child tasks are still "fog" — the calling thread does not know how many tasks it spawned, one failing task lets the others keep running, and a timeout cannot cancel them. Structured concurrency gathers child tasks into a scoped tree:

~~~java
// ONLY to know about it: preview, the API may change between JDKs; needs --enable-preview
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    StructuredTaskScope.SubTask<Profile> p = scope.fork(() -> profileClient.get(id));
    StructuredTaskScope.SubTask<List<Order>> o = scope.fork(() -> orderClient.list(id));
    StructuredTaskScope.SubTask<Score> s = scope.fork(() -> scoreClient.of(id));
    scope.joinUntil(Instant.now().plusMillis(250)).throwIfFailed();
    return new Page(p.get(), o.get(), s.get());
}   // closing the scope cancels every child task
~~~

{{ShutdownOnFailure}}: if one branch fails it cancels the remaining branches and throws an {{ExecutionException}} whose cause is the **original error** (not wrapped two levels deep like {{CompletionException}}). The companion idea is {{ScopedValue}} replacing {{ThreadLocal}} (immutable, scoped, cheap). Status: still preview/incubating — **do not enable it in production** until you are sure the team's JDK is stable.

### Choosing an approach
| Approach | Code | Timeout/fallback | Cancel when one branch fails | Usable JDK |
|---|---|---|---|---|
| Sequential | simplest | easy | not applicable | 8 |
| CompletableFuture fan-out | verbose but fully controllable | {{orTimeout}}, {{exceptionally}} | not automatic | 8 (timeout: 9+) |
| Virtual threads + submit | sequential, readable | you set it yourself | when you cancel the Future | 21 |
| StructuredTaskScope | sequential, with a tree | {{joinUntil}} | yes, by default | 21+ preview |

### Failures seen on production
- Not passing an executor → {{I/O}} runs on the {{commonPool}} and congests the whole JVM.
- {{join()}} on each future inside a loop → it becomes sequential (you wait for the next one every iteration).
- No fallback before {{allOf}} → one broken source destroys the whole page.
- Believing a timeout stops the HTTP call → you still pay for it and still hold the thread.
- No **overall deadline**: three 200 ms branches plus the downstream steps can exceed the caller's SLA.
- Silently swallowing errors in {{exceptionally}} → metrics never tell you which source is broken.
- Firing too many concurrent requests at the DB: fan-out raises concurrency, so keep the DB pool/Semaphore in place.

> Senior tip: give the whole request a time budget (say the caller allows 300 ms): each branch timeout must be smaller than the budget, and prefer an absolute deadline ({{joinUntil(Instant)}} or {{get(deadline - now)}}) over a relative per-branch timeout, because queueing time in the executor has to be counted too. Always emit a {{source=profile,status=ok|timeout|error}} metric so that when one source gets slow you see it immediately on the dashboard instead of only noticing "the page is slow".

### Interview relevance
The interviewer asks: why is sequential calling slow, does {{allOf}} return values, how does {{thenApply}} differ from {{thenCompose}}, can a timeout cancel the call underneath, how do you handle one failing branch, which executor should you use and why not the commonPool, what do virtual threads replace in CompletableFuture, what leftover problem does structured concurrency solve. The exercises below have you write a 3-source aggregator with timeout and fallback, and prove it really runs in parallel.`,
    exercises: [
      {
        title: '3-source aggregator: parallel, timeout, fallback, never hangs',
        prompt: `Write a class {{Aggregator}} that takes a {{java.util.concurrent.Executor}} in its constructor. Method {{Map<String, String> fetchAll(List<Source> sources, long timeoutMs)}}:

- {{record Source(String name, String fallback, java.util.function.Supplier<String> call)}}.
- **Start every source at the same time** on the executor you were given (do not run them sequentially, do not use the commonPool).
- Wait until every source has reached a conclusion (success, error, or past {{timeoutMs}}), then return a {{Map}} keyed by source name.
- A source that throws an exception, returns {{null}}, or is still unfinished after {{timeoutMs}} uses that source's own {{fallback}}. You must **never let an exception escape**, and you must never hang.
- The key order in the map must follow the order of the {{sources}} list exactly.

The tests control time with {{CountDownLatch}}: a source only returns its result when the test releases the latch, so if your code runs sequentially or waits per source, the test will catch it.`,
        hints: [
          'The first loop ONLY starts work: {{CompletableFuture.supplyAsync(s.call(), executor)}} and add it to the list. Do not call join/get inside this loop (that would make the run sequential).',
          'Turn the error into a default value: {{.orTimeout(timeoutMs, TimeUnit.MILLISECONDS).exceptionally(ex -> s.fallback())}}.',
          'Wait for everything with {{CompletableFuture.allOf(calls.toArray(new CompletableFuture[0])).join()}}, then read each future with {{join()}} (they are already done, so nothing blocks further).',
          'Use a {{LinkedHashMap}} and iterate in the order of {{sources}} so the keys come out in order; {{HashMap}} will fail test 1.',
        ],
        explain: `Three clearly separated steps are the whole lesson: **start** → **wait** → **combine**. Beginners write a {{for}} loop and {{join()}} right inside it, i.e. they wait for source A to finish before starting B: the elapsed time is then a sum, not a max. Splitting it into two loops makes {{supplyAsync}} return almost instantly, so all three sources overlap.

Each branch is "normalised" into a future that **can never fail**: {{orTimeout}} turns a slow source into a {{TimeoutException}}, {{exceptionally}} turns every exception (timeout included) into the fallback, and the last {{thenApply}} turns {{null}} into the fallback. Thanks to that, {{allOf}} always completes normally without caring which source broke, and the result always contains every key. {{join()}} in step 3 does not block because the futures are already done — that is why {{allOf}} followed by {{join}} is cheaper than {{join}} on each one separately.

Why the relative order of {{orTimeout}} and {{exceptionally}} matters: {{orTimeout}} goes first so it pushes a {{TimeoutException}} down the chain, and {{exceptionally}} goes after so it catches both the original error and the timeout error. Reversed, {{exceptionally}} would run first, the later timeout would have nobody to handle it, and {{allOf}} would complete with an error.

Common mistakes:
- {{supplyAsync}} without an executor → it runs on the commonPool; the thread-name test will go red, and I/O congests the shared pool.
- Forgetting {{exceptionally}} → one failing source makes {{allOf}} fail and you lose every healthy result.
- {{join}}/{{get}} inside the starting loop → the calls run sequentially.
- Using {{HashMap}} → the key order is scrambled, and the report/JSON changes positions between runs.
- Believing a timeout stops the HTTP call: it only completes the future, the call keeps holding its thread until it finishes. The test here keeps a source hanging for 30 seconds while fetchAll must return after roughly the timeout.`,
      },
      {
        title: 'The non-blocking version: return a CompletableFuture for the whole page',
        prompt: `Write {{PageBuilder}}, taking a {{java.util.concurrent.Executor}} in its constructor. Method {{CompletableFuture<Page> page(List<Source> sources, long timeoutMs)}}:

- {{record Page(Map<String, String> values)}} and {{record Source(String name, String fallback, java.util.function.Supplier<String> call)}} (same as the exercise above).
- Start every source **in parallel** on the executor, each with a fallback when it fails or exceeds {{timeoutMs}}.
- Return the {{CompletableFuture<Page>}} **immediately**: you may not call {{join}}/{{get}} (the method must not block the calling thread).
- The future completes once every source has reached a conclusion, and {{Page.values}} contains every key in the order of {{sources}}.
- No source is allowed to make the resulting future fail: a failing or slow source gets its {{fallback}}.
- Empty list: the future returns a {{Page}} with an empty map.`,
        hints: [
          'Use {{completeOnTimeout(fallback, timeoutMs, TimeUnit.MILLISECONDS)}} to turn a slow source into the default value without throwing an error.',
          'Add {{.handle((v, ex) -> ex != null || v == null ? s.fallback() : v)}} so a failing or null source also yields the fallback.',
          'Return {{CompletableFuture.allOf(...).thenApply(...)}}: inside that thenApply you are allowed to join, because by then every future is done.',
          'The loop over sources must NOT call join/get — only assemble the callback chain and return it.',
        ],
        explain: `This is what a real aggregator in a reactive/async web app looks like: the method returns a future immediately and does not make a Tomcat/Netty thread sit and wait. All the waiting lives in the {{thenApply}} attached after {{allOf}}, and that callback runs on whichever thread finished the last step (or on {{ForkJoinPool.commonPool()}} if you did not give {{thenApplyAsync}} an executor) — which is why the combining step has to be very light.

Difference from exercise 1: here {{completeOnTimeout}} is used instead of {{orTimeout}}. {{orTimeout}} throws a {{TimeoutException}} down the chain, so you must have an {{exceptionally}} behind it; {{completeOnTimeout}} completes the future with the fallback instead, so an error never appears at all — tidier when your strategy for a slow source is simply "use the default value". {{handle}} receives both {{(value, exception)}}, so it covers the two cases in one lambda, whereas {{exceptionally}} only runs when there is an error.

Because {{allOf}} returns a {{CompletableFuture<Void>}}, the values must be read from the {{calls}} list you kept. If you do not keep that list, there is no way left to read each source's result.

Common mistakes:
- Calling {{join()}}/{{get()}} inside {{page()}} "to keep it simple": you throw away the entire benefit of fan-out and you hold on to the web thread.
- A failing source without {{handle}}/{{exceptionally}} → the resulting future fails and the whole page is lost.
- Attaching {{thenApply}} on each future and then running {{allOf}} over the original futures: {{allOf}} only waits for the futures you hand it, not for the extra work you grafted on.
- Using {{anyOf}} to "take the fastest one": the fastest failing source wins too.`,
      },
    ],
    check: [
      {
        q: 'Three independent {{CompletableFuture.supplyAsync}} calls, 200 ms each, then {{allOf}} and {{join()}}. Roughly what is the total time?',
        options: ['600 ms', '200 ms', '400 ms', 'It depends on the number of CPU cores'],
        explain: 'Fan-out: the three tasks start almost at the same instant, so the elapsed time is the max of the three, about 200 ms (plus small overhead). You would only get 600 ms if the code joined each future right inside the loop, or if the executor had a single thread.',
      },
      {
        q: 'What does {{CompletableFuture.allOf(f1, f2, f3)}} return?',
        options: ['A {{CF<List<Object>}}> holding the three results', '{{CF<Void>}}: it only signals that everything is done', 'The result of whichever future finished first', 'A {{Map}} of name → value'],
        explain: '{{allOf}} returns a {{CompletableFuture<Void>}}. To get the values you must keep the original list of futures and join them after allOf completes (joining then does not block). "The one that finished first" is the behaviour of anyOf.',
      },
      {
        q: '{{f.orTimeout(200, MILLISECONDS)}} while the HTTP call inside takes 5 seconds. What happens?',
        options: [
          'The future completes with TimeoutException while the HTTP request keeps running until it finishes',
          'The thread doing the HTTP call is interrupted and the request is cancelled',
          'Nothing happens until somebody calls get()',
          'The executor creates a replacement thread',
        ],
        explain: 'CompletableFuture does not know which thread is doing the work, so it cannot interrupt it; orTimeout only completes the future with TimeoutException exactly 200 ms later, while the request below still holds its connection and its thread. That is why the HTTP client must have a read timeout. The timeout is scheduled when orTimeout is called, it does not wait for get().',
      },
      {
        q: 'Why should you pass a dedicated {{Executor}} to {{supplyAsync}} when doing I/O?',
        options: [
          'A dedicated executor runs faster than the commonPool',
          'The commonPool has few threads and is shared by the whole JVM, so blocking I/O congests everything else',
          'Without an executor the code does not compile',
          'To avoid leaking CompletableFuture objects',
        ],
        explain: 'The commonPool has roughly (number of CPUs − 1) threads shared by both parallel streams and CompletableFuture in the process; every blocking I/O request takes one slot, so it fills up very fast. Passing a dedicated executor also lets you set limits (pool size, thread names for reading stack dumps, the queue and the rejection policy).',
      },
    ],
  },
});
