/*
 * English translation of js/data/lessons-concurrency.js — task T689. Format: js/core/i18n.js (content overlay).
 * ids: lesson-concurrency-006
 */
App.i18n.content({
  'lesson-concurrency-006': {
    title: 'CompletableFuture from scratch: the result box, callbacks and how to wire work together',
    goals: [
      'Explain that {{CompletableFuture}} is a "box holding a result that does not exist yet", and why the callback model does not occupy a thread while waiting',
      'Write {{thenApply}} (transform) and {{thenCompose}} (chain two asynchronous jobs) correctly, without ending up with a box inside a box',
      'Fan out many parallel calls and gather them with {{thenCombine}}/{{allOf}}, then read each individual result',
      'Handle errors with {{exceptionally}}/{{handle}}, tell {{CompletionException}} apart from {{ExecutionException}}, and always pass a dedicated executor for IO work',
    ],
    body: `### The starting point: waiting costs a thread
You call an API that takes 200 ms. The classic way, with the {{Future}} of an {{ExecutorService}}:

~~~java
ExecutorService pool = Executors.newFixedThreadPool(4);
Future<String> f = pool.submit(() -> httpGet("https://api.example/price"));
String text = f.get();                 // STOPS on this line until the data arrives
int price = Integer.parseInt(text);    // only runs once text is available
~~~

{{get()}} is a **blocking** call: the thread that invokes it just stands there and does nothing for 200 ms. For a single request that is harmless, but your server sometimes handles 1,000 concurrent requests, and each request waits on 2 backends for 200 ms — that means ~1,000 threads **waiting for nothing**, and each thread is a **platform thread** (a real OS thread, with a default stack of about 1 MB), while the CPU spends time on **context switches** (saving one thread's state, loading another thread onto the core).

**CompletableFuture** (since Java 8) flips the model: instead of standing there waiting, you hand the work out and register "when the result shows up, continue with these steps". Three terms used constantly:
- **asynchronous**: dispatch the work and go do something else, instead of stopping in place to wait.
- **callback**: a function you give to somebody else; when it is their turn, they call your function back.
- **stage**: one step in the chain of work ("step 1 fetch the JSON, step 2 parse it, step 3 compute the tax").

### CompletableFuture is a box
Picture a box with three states: **empty**, **holds a value**, **holds an error**. It may only move from "empty" to one of the other two, and only once.

~~~java
CompletableFuture<Integer> box = new CompletableFuture<>();   // empty box
box.thenApply(v -> System.out.println("got " + v));           // register work for when the box is filled
box.complete(95);                                             // fill it: prints "got 95"
box.complete(99);                                             // box already full: this call is ignored, NOT an error
~~~

{{complete(value)}} fills in a value; {{completeExceptionally(error)}} fills in an error; {{cancel(true)}} fills in a {{CancellationException}}. Whoever fills it in is the **very thread that** triggers the registered work. That is the whole mechanism: each future holds its result (or error) plus the list of dependent stages, and once it is filled in, it runs those dependent stages one by one.

Because it is also a {{Future}}, you still have {{get()}} (throws the checked {{ExecutionException}}) and {{join()}} (throws the unchecked {{CompletionException}}) for the times you genuinely need the value right now.

### thenApply: turn one result into another result (map)
Like {{Stream.map}}: your function takes a value and returns a **different** value, and everything still lives inside one box.

~~~java
CompletableFuture<String> json = CompletableFuture.supplyAsync(() -> httpGet(url), ioPool);
CompletableFuture<Integer> price = json
        .thenApply(body -> parsePrice(body))     // String -> Integer
        .thenApply(p -> p + tax(p));             // Integer -> Integer
~~~

Read it as "whatever we get, do this next": get json, so parse it; get price, so add tax. Not a single line blocks.

**Which thread does the callback run on?** This is where people get it wrong most often:
- {{thenApply(f)}} (no {{Async}} suffix): runs on **the thread that completed the previous stage**. Exception: if the previous stage was **already done** at the moment you call {{thenApply}}, f runs **immediately, on the calling thread**, synchronously.
- {{thenApplyAsync(f, exec)}}: always moves {{f}} over to {{exec}}; if you do not pass an executor, it uses {{ForkJoinPool.commonPool()}}.

So the non-{{Async}} form should only be used for **fast** work (reformatting, filtering). If you do heavy computation or fire another IO call inside a {{thenApply}} that happens to run on an HTTP client thread, you occupy that thread and stall the whole client.

### thenCompose: when the next step also has to wait (flatMap)
The next step **of its own accord also returns a CompletableFuture**. Using {{thenApply}} gives you a box holding another box, which you cannot use directly:

~~~java
CompletableFuture<User> user = findUser(id);           // CompletableFuture<User>
CompletableFuture<CompletableFuture<List<Order>>> bad = user.thenApply(u -> findOrders(u));   // box inside a box: wrong
CompletableFuture<List<Order>> good = user.thenCompose(u -> findOrders(u));                   // correct: flattened
~~~

The rule that makes the choice never wrong: look at **the return type of the function inside the parentheses**. If it returns a plain value, use {{thenApply}}; if it returns a {{CompletableFuture}}, use {{thenCompose}}. Same pairing as {{map}}/{{flatMap}} in Stream and {{map}}/{{flatMap}} in Optional.

### thenCombine and allOf: when you have several independent jobs
- {{a.thenCombine(b, (va, vb) -> ...)}}: two **independent** jobs run in parallel; the merging function runs once both are finished.
- {{CompletableFuture.allOf(a, b, c)}}: waits for **all of them** and returns {{CompletableFuture<Void>}} — i.e. a "whistle", it holds no results. To get the results you must {{join()}} each future individually (by then they are all done, so {{join()}} does not block).
- {{anyOf(a, b, c)}}: completes as soon as **the first one** completes, including when it completes because of an error.

~~~text
  findUser   --+
  findCart   --+-- allOf --> thenApply(merge the 3 results) --> final future
  findPromo  --+
~~~

### Executors: do not use the default one
{{CompletableFuture.supplyAsync(supplier)}} **without an executor** runs on {{ForkJoinPool.commonPool()}} — a pool shared by the entire JVM (parallel streams included), which by default has only about "number of cores - 1" threads. Put 8 HTTP calls that each take 2 seconds in there, the commonPool runs out of threads, and **every** parallel stream and every other library using the commonPool in that same JVM grinds to a halt. Hard rule:

| Kind of work | Where it runs |
|---|---|
| Blocking waits (HTTP, JDBC, files, partner APIs) | a **dedicated** executor, sized after the resource behind it; or virtual threads (Java 21) |
| Pure CPU computation, short | commonPool is acceptable |
| Fast work (reformat, filter, merge objects) | use {{thenApply}} without Async, reusing the thread that just finished |

{{runAsync(runnable)}} is like {{supplyAsync}} except the runnable returns nothing, so the type is {{CompletableFuture<Void>}}.

### Errors travel down the chain, and the two wrappers
If one stage throws an exception, the dependent stages **skip their functions** and the final future completes with the error; the original error is wrapped in a {{CompletionException}}. The catching kit:

~~~java
findUser(id)
    .thenCompose(u -> findOrders(u))
    .exceptionally(ex -> {                      // runs only when there is an error
        Throwable root = (ex instanceof CompletionException && ex.getCause() != null) ? ex.getCause() : ex;
        if (root instanceof TimeoutException) return List.of();     // fallback: return an empty list
        throw new IllegalStateException(root);                       // other errors: let the whole request fail
    })
    .whenComplete((v, ex) -> metrics.record(ex == null));            // log/metric, does not change the result
~~~

- {{exceptionally(fn)}}: runs only on failure, returns a replacement value.
- {{handle((value, error) -> ...)}}: always runs, receives both the value and the error, returns a new result (used to "turn an error into a safe value").
- {{whenComplete((value, error) -> ...)}}: always runs and **passes the result/error through unchanged** — good for logging.
- Want "one failing branch fails the whole request"? Do not attach a handler to each branch; let the error travel to the last future and catch it there.

{{join()}} throws {{CompletionException}} (unchecked, so it propagates out of a lambda without a declaration); {{get()}} throws {{ExecutionException}} (checked, forcing try/catch). Both have {{getCause()}} pointing at the original error. In {{exceptionally}}/{{handle}} the error parameter **is already wrapped**, so do not test its type at the outermost layer.

### Timeout: the future completing does not mean the work stopped
Java 9 added {{orTimeout(t, unit)}} (on expiry the future completes with {{TimeoutException}}) and {{completeOnTimeout(value, t, unit)}} (on expiry it uses a fallback value). Two things to remember:
1. They **do not stop** the work underneath. The HTTP call keeps running until it finishes and keeps holding its pool thread. You still have to set a read timeout at the client layer (HTTP client, JDBC).
2. {{cancel(true)}} on a CompletableFuture ignores the {{mayInterruptIfRunning}} argument: there is nobody to interrupt.

### Worked example: "skip whichever source fails"
A request you meet a lot: call 5 price sources in parallel, ignore the failing ones, take the lowest price, and report an error only when **no** source is usable. This is the template for the "partial failure is normal" problem:

~~~java
List<CompletableFuture<Integer>> calls = new ArrayList<>();
for (Supplier<Integer> s : sources) {
    calls.add(CompletableFuture.supplyAsync(s, executor)
            .handle((v, e) -> e == null ? v : null));   // normalise: no source "fails" any more
}
CompletableFuture.allOf(calls.toArray(new CompletableFuture[0])).join();
// allOf always completes normally; each join() does not block because they are all done
~~~

Then filter out the nulls and take the minimum. That is exactly the exercise below.

### Production bugs you will actually meet
- Calling {{join()}} **inside** a task of that same bounded pool: task A waits for task B, the pool runs out of threads, nobody can run B — a starvation deadlock.
- Attaching no handler and having nobody {{join}} either: the exception disappears without a trace, and all you see is a request that "hangs and then times out".
- Losing MDC/traceId, SecurityContext: they are {{ThreadLocal}}s of the original thread, and the callback runs on a different thread, so they come up empty. You need an executor that wraps the context (Spring's {{TaskDecorator}}, Micrometer Context Propagation).
- Forgetting the {{return}} in a single-block lambda {{if}} with several branches: the function returns null, the future "succeeds with null", and you get an NPE somewhere completely unexpected.
- Mixing {{get()}} and {{join()}} in the same chain, catching {{ExecutionException}} while the error that actually arrives is a {{CompletionException}}.

### Interview relevance
The interviewer usually starts with "How does Future differ from CompletableFuture?" and then digs: "which thread does the callback run on?", "how does thenApply differ from thenCompose?", "you have 5 services behind you and one of them is slow — what do you do?". The answer that earns points: name the **default executor** and say what damage it does; say that a future's timeout cannot stop the call underneath, so you still need a client-side timeout; and present an explicit error strategy (fail the whole thing fast, or normalise each source to a neutral value and then gather). Lesson 4 of this track is the advanced version of exactly this material: do not block the calling thread, hand a {{CompletableFuture}} straight back to the web layer — read that one after this lesson.`,
    exercises: [
      {
        title: 'Best price from many sources: run in parallel, skip failing sources',
        prompt: `Write {{PriceAggregator.best(sources, executor)}} — the **blocking** version (used in a batch job), so you can bolt the individual CompletableFuture pieces together solidly.

Signature: {{static int best(List<Supplier<Integer>> sources, Executor executor)}}

- Dispatch **every** source (each one a {{Supplier<Integer>}}) to run **in parallel** on the {{executor}} that was passed in. No source may wait for another source before it starts.
- Wait until every source is done (succeeded, failed, or returned {{null}}), then return the **lowest** value among the valid results.
- A source that throws a {{RuntimeException}} or returns {{null}} counts as **not existing**, but it must still be called.
- No valid source at all (an empty list included): throw {{NoSuchElementException}}.
- Do not use {{ForkJoinPool.commonPool()}}. Do not {{shutdown}} the executor (the caller owns it).
- Do not catch checked exceptions ({{Supplier}} cannot throw them), do not use {{Thread.sleep}}.

The test uses a fixed pool and a {{CyclicBarrier}} to force the sources to genuinely run **at the same instant**: if you run them sequentially the barrier times out and the exercise fails. It also checks thread names to make sure you use the executor you were given.`,
        hints: [
          'The first loop **only dispatches work**, it does not collect any result yet: {{CompletableFuture.supplyAsync(source, executor)}} and push it into a {{List}}. If you call {{get()}} inside that loop then every source runs sequentially.',
          'Turn a failing source into a "returns null" source so that {{allOf}} always completes normally: {{.handle((v, e) -> e == null ? v : null)}}.',
          '{{CompletableFuture.allOf(list.toArray(new CompletableFuture[0])).join()}} waits for all of them. Afterwards {{join()}} on each individual future no longer blocks.',
          'Filter out {{null}} then {{min(Integer::compare)}}; {{Optional.orElseThrow(() -> new NoSuchElementException("no price available"))}} throws {{NoSuchElementException}} directly, because this part runs on the caller thread.',
        ],
        explain: `Four pieces in the solution:
1. {{supplyAsync(source, executor)}} for each source: all sources are dispatched **before** any wait happens, so their durations overlap. The test uses a {{CyclicBarrier(3)}} to catch sequential execution: if only one source runs at a time the barrier never reaches its party count, times out after 2 seconds, that source throws an exception and the final result is not 300.
2. {{handle}} normalises errors into {{null}}. Skip this step and one failing source makes {{allOf}} complete with an error, so you lose all the good sources too.
3. {{allOf(...).join()}}: wait until everything is in. The {{join()}} here is acceptable because this is a blocking-style exercise; in a web application return a {{CompletableFuture}} and attach {{thenApply}} instead of blocking the request thread.
4. {{join()}} on each already-completed future: it just reads the value that is already sitting in the box.

{{NoSuchElementException}} is thrown **outside** the future chain (inside a stream running on the caller thread), so whoever calls {{best}} catches it directly, unwrapped by any {{CompletionException}}. If you wrote {{allOf(...).thenApply(v -> ...orElseThrow...)}} the error would go into the future, and {{join()}}/{{get()}} would be the place it comes out — with an extra wrapper around it.

Common mistakes:
- {{for (var s : sources) results.add(supplyAsync(s, ex).get())}}: correct as a result but sequential, so total time equals the sum of every source's time.
- Using {{anyOf}} to "get the fastest source": this is a {{min}} over **price**, not over speed, and {{anyOf}} "wins" even when the source fails.
- Forgetting the executor argument: it runs on the commonPool, the thread-name test goes red, and in production you would be sharing one pool with every other component in the JVM.
- {{join()}} without normalising errors: you get a {{CompletionException}} instead of the {{NoSuchElementException}} when every source fails.
- Calling {{best}} from **inside** a task of that same {{executor}} with a bounded pool: starvation, hang. To do that you would need a different pool, or rewrite it as a callback chain.`,
      },
    ],
    check: [
      {
        q: 'What is the difference between {{CompletableFuture.supplyAsync(() -> doWork())}} and {{CompletableFuture.runAsync(() -> doWork())}}?',
        options: ['No difference, they are just two names', '{{supplyAsync}} returns a {{CompletableFuture}} holding the value {{doWork}} returns; {{runAsync}} returns a {{CompletableFuture<Void>}} because a Runnable has no value', '{{runAsync}} runs on the calling thread, {{supplyAsync}} runs on a pool', '{{supplyAsync}} is blocking, {{runAsync}} is non-blocking'],
        explain: `A {{Supplier<T>}} has a return value, so the box holds a {{T}}; a {{Runnable}} returns void, so the box is a {{CompletableFuture<Void>}}. Both are async, and both use {{ForkJoinPool.commonPool()}} when no executor is passed. Neither one is "blocking".`,
      },
      {
        q: 'Future {{f}} **completed** a long time ago. You call {{f.thenApply(x -> calc(x))}}. When does {{calc}} run, and on which thread?',
        options: ['Immediately, on the thread that just called {{thenApply}}', 'Immediately, on a {{ForkJoinPool.commonPool()}} thread', 'It waits until somebody calls {{join()}}', 'On the thread that completed {{f}}, even though that thread is dead'],
        explain: `The previous stage is already full, so there is nothing to wait for: CompletableFuture is designed to run a dependent stage **right on the thread that adds it** (the fast path, avoiding needless scheduling). To be sure the work hops to another thread, use {{thenApplyAsync(fn, executor)}}. Nothing blocks until {{join()}}, and a thread that already died cannot run anything.`,
      },
      {
        q: 'What does {{CompletableFuture.allOf(a, b, c)}} return, and how do you get the result of {{a}}?',
        options: ['A {{CompletableFuture<List<T>>}}, results already gathered', 'A {{CompletableFuture<Void>}}; after it completes, call {{a.join()}} to read a result', 'A {{CompletableFuture<Void>}}; you must call {{get()}} on each future and each call blocks for a few seconds', 'It returns the future of whichever one finishes first'],
        explain: `{{allOf}} is only a "whistle": it holds no value, hence the {{Void}} type, and it gathers nothing for you. Once it completes the member futures are **already done**, so {{join()}} merely reads a value that is there and does not block. The first option is something you have to write yourself with {{thenApply}}. "Whichever one finishes first" describes {{anyOf}}.`,
      },
      {
        q: 'A stage in the middle of the chain throws an {{IOException}} ({{HttpClient}} would wrap it in a {{RuntimeException}} in real life, but assume the root error is the {{IOException}}). The chain has no handler. The final caller uses {{join()}}. What do they get?',
        options: ['The {{IOException}}', 'A {{CompletionException}} whose {{getCause()}} is the {{IOException}}', 'An {{ExecutionException}} whose cause is the {{IOException}}', 'Nothing, the error is swallowed'],
        explain: `The error travels through the stages wrapped in one layer of {{CompletionException}}; {{join()}} throws that unchecked type and {{getCause()}} gives the original error. {{ExecutionException}} is the checked variant thrown by {{get()}}. The error is not swallowed, because the last future did complete with an error — only whoever calls {{join}}/{{get}} sees it; if nobody waits, then yes, it is... silence, which is exactly why you must always have a handler or a waiting point.`,
      },
    ],
  },
});
