/*
 * English translation of js/data/q-concurrency-jvm.js — task T952. Format: js/core/i18n.js (content overlay).
 * ids: concurrency-042 concurrency-043 concurrency-044 concurrency-045
 */
App.i18n.content({
  'concurrency-042': {
    q: 'What is inside {{CompletableFuture}}: how are the result and the callback chain stored, which **thread** actually runs {{thenApply}}, how does {{thenApplyAsync}} change that structure, and why can a heavy callback stall even an HTTP client?',
    a: `**Summary:** Each CompletableFuture holds only two things: a **result** field (a value, or an {{AltResult}} wrapper carrying an error, or null = not completed) and a **linked stack** of {{Completion}} nodes — each node is a registered stage. When someone calls {{complete(v)}}, that same thread runs {{postComplete()}} and **executes the entire callback stack immediately** on its own thread. So the answer to "which thread runs the callback" is: whichever thread completes the future first, or the thread calling {{thenApply}} if the future was already done. {{thenApplyAsync(fn)}} does not change the logic; it only changes **registration**: the node is attached to an executor, and when its turn comes the task is submitted to that executor (by default {{ForkJoinPool.commonPool}}'s asyncPool). Practical consequence: putting heavy or blocking code into a callback without an executor voluntarily hijacks the IO library's thread.

### Quick intuition
Like a post-office queue where the person who just finished their own task **stops and immediately does the next step** for the person behind them, instead of dropping it into a shared queue. Fast and cheap to coordinate — but if the next step is carrying a heavy box, that person gets stuck in place, and the whole chain above them (truck, loading door) gets stuck too.

### Terminology
- **result / AltResult**: a reference field holding either a value or {{AltResult(throwable)}} to encode "completed with an error". There is no separate state enum: null = not completed.
- **Completion / callback stack**: every {{thenApply}}… call creates a node holding (function, executor, next node) and CASes it into the {{next}} field — a Treiber stack (lock-free).
- **postComplete()**: runs when state changes from "not done" to "done"; it walks the whole stack and fires each stage **using the current thread**.
- **NOW vs FUT mode**: two ways a node is fired: run immediately (NOW, on the current thread) or hand off to an executor (FUT). This is the {{thenApply}}/{{thenApplyAsync}} difference in code terms.
- **asyncPool**: the default executor for *Async methods — {{ForkJoinPool.commonPool().asyncPool(...)}}; if commonPool has parallelism 0 ({{-Djava.util.concurrent.ForkJoinPool.common.parallelism=0}}), the JDK uses an executor that creates a new thread per task so the async path still works.
- **Delayer**: an internal daemon thread ({{CompletableFutureDelayScheduler}}) that serves {{orTimeout}} and {{completeOnTimeout}}.
- **managedBlock**: how {{get}}/{{join}} "tell" ForkJoinPool they will block, so the pool can spawn spare threads instead of stalling.

### Path of a chain
~~~text
cf = CompletableFuture.supplyAsync(fetch, ioPool)
     .thenApply(parse)                // node A, executor = null
     .thenApplyAsync(save, dbPool);   // node B, executor = dbPool

1. ioPool-thread runs fetch, then calls cf.complete(value)
2. That same ioPool-thread runs postComplete():
     - takes node A: executor == null -> tryFire NOW -> runs parse() DIRECTLY on ioPool-thread
     - A completes, produces cf2; node B does not run yet because it waits on cf2 -> pushed onto cf2's stack
3. parse completes -> cf2.complete() -> the thread that ran parse (still ioPool-thread) runs cf2's postComplete
4. Node B has an executor -> dbPool.submit(save) -> save() runs on dbPool-thread.
=> parse() "weighs down" the ioPool thread; save() runs on the dbPool thread.
   If cf was ALREADY done before thenApply was called, A runs immediately on the calling thread.
~~~

### Table: API → running thread
| Form | Callback runs on |
|---|---|
| {{thenApply}} / {{thenAccept}} / {{thenCompose}} | the thread that completes the future (or the caller if already done) — **not predetermined** |
| {{thenApplyAsync(fn)}} | asyncPool (default {{ForkJoinPool.commonPool}}) |
| {{thenApplyAsync(fn, executor)}} | that executor's thread; a rejected executor completes the future with {{RejectedExecutionException}} |
| {{whenComplete}} / {{handle}} | like {{thenApply}}, with *Async variants |
| {{get}} / {{join}} | blocks the current thread (join throws {{CompletionException}}, get throws {{ExecutionException}}) |
| {{orTimeout}}, {{completeOnTimeout}} | the Delayer thread, then the CF's executor on completion |
| {{cancel(true)}} | only completes with {{CancellationException}}; it does **not** interrupt the running work |

### Why the JDK chose "whoever finishes, runs next"
- No submit + queue per stage: for a 10-stage pipeline called 100k times/second, that saves 10 scheduling operations.
- No dedicated "callback pool" — such a pool would add another thread hop and lose locality.
- Trade-off: determinism is traded for throughput. With short, non-blocking callbacks that do not depend on thread-local state, this model is excellent; otherwise it becomes a hard-to-reproduce bug because "which thread runs" depends on timing.

### In production
- **Thread-local context loss**: {{ThreadLocal}}, {{SecurityContext}}, and log MDC do not follow callbacks automatically. Symptom: downstream logs lose traceId, or {{@Transactional}} "disappears" because the transaction is bound to a thread. Fix: pass context explicitly in the pipeline, or wrap the executor with a decorator that copies context (Spring's {{TaskDecorator}}) and **always** run context-dependent stages on *Async with your pool.
- **Hijacking the IO library thread**: with NIO clients (Reactor/Netty, Kafka client, async JDBC), the thread completing the CF is often an **event-loop**. Running {{Thread.sleep}}, parsing large JSON, or calling a synchronous DB in {{thenApply}} stalls the event loop → cascading timeouts for every other request. Rule: callbacks in an API response chain must only do light computation; anything blocking moves to *Async with a named pool.
- **Separate pools by work type**: create pools with a {{ThreadFactory}} that sets clear names so dumps read quickly ("http-callback-3" instead of "ForkJoinPool.commonPool-worker-9"). Use a separate pool rather than commonPool for blocking work so you do not share a queue with another component's parallel streams.
- **Mutual "voting" deadlock**: {{pool.submit(...).thenCompose(x -> ...pool...)}} with a small pool can deadlock (every worker is blocked waiting on {{get}} for a task sitting in that same pool's queue). Symptom: "0% CPU, no errors, no timeouts".
- **Measure**: if the whole endpoint's p99 rises with a heavy callback, use async-profiler in wall-clock mode and look for {{CompletableFuture.postComplete}} / {{CompletableFuture.uniApply}} frames — they tell you which thread the callback ran on.

### Common mistakes
- Thinking {{thenApplyAsync}} means "runs in the background" in general without specifying an executor → silently lands on commonPool, where parallel streams and other async work compete.
- Omitting {{exceptionally}}/{{handle}} at the end of a chain: errors travel invisibly to {{join}} and explode in an unrelated place, or vanish entirely if nobody reads the future.
- Using {{allOf}} then {{join}}ing each stage without wrapping errors: one failure produces nested {{CompletionException}}s that are hard to read.
- Waiting on {{get()}} without a timeout on a request thread → the thread pool drains and the service hangs even if downstream is fast.

### 1-minute interview answer
"Internally a CF is a result field (with an AltResult wrapper for errors) plus a stack of Completion nodes registered lock-free. When {{complete}} is called, that same thread runs {{postComplete}} and fires the nodes: a node with no executor runs immediately NOW on the current thread, while a *Async node is submitted FUT to its executor. So the thread for {{thenApply}} is **indeterminate** — it is whatever completed the future, often an HTTP client or DB driver thread; that is exactly why I never put blocking work in a non-async callback. {{thenApplyAsync}} gives me control over where it runs; by default it uses commonPool's asyncPool, so on a server I always pass a named, bounded pool and I handle {{RejectedExecutionException}} because a rejected executor completes the future with that error."

> Senior tip: if you pick one team rule: (1) every outbound chain uses {{orTimeout}} and {{completeOnTimeout}}, (2) every heavy callback goes to {{*Async}} with its own pool, (3) never use commonPool for I/O, (4) always end the chain with {{handle}} to log once. These four rules eliminate most CompletableFuture incidents without anyone needing to understand the internals.`,
    follow: [
      'Why must {{get}} call {{ForkJoinPool.managedBlock}}, and what happens to commonPool if it does not?',
      'How do {{exceptionally}}, {{handle}}, and {{whenComplete}} differ when the error comes from the error-handling function itself?',
      'What does {{CompletableFuture}} with virtual threads change about the "which thread runs the callback" picture?',
    ],
  },

  'concurrency-043': {
    q: 'Where and why does reordering happen: how do the CPU store buffer, invalidate queue, and the JIT compiler reorder operations, which memory barrier stops each kind, and why can code that is "correct on an x86 laptop" fail on AWS Graviton?',
    a: `**Summary:** Three actors reorder memory operations: (1) the **store buffer** — the CPU does not wait for the cache line before writing again, it queues the write and moves on, so the same thread "sees the write" while others do not; (2) the **invalidate queue** — invalidation messages from other cores are queued instead of stalling the core immediately; (3) the **compiler/JIT** — C2 may reorder instructions it proves have no data/control dependency. The JMM does not describe "which instruction order runs"; it describes **happens-before edges**: what is allowed to observe what. On x86 (TSO model) the hardware forbids load-load, load-store, and store-store reordering, so the JVM only needs a fence for **StoreLoad**: a volatile write = store + fence (on x86 usually {{lock addl $0x0,(%rsp)}} — a lock-prefixed no-op, also a full fence), a volatile read = load + fence. On ARM/RISC-V (a weak model) all four kinds can happen, so the JVM must emit {{ldar}}/{{stlr}} or {{dmb}} — which is why real bugs appear when you port a service to Graviton.

### Quick intuition
Sending mail: you drop a letter into **your own house mailbox** (store buffer) and walk away — to you it is "sent", but the recipient sees nothing yet, and the letter can still go out after you check the other person's mailbox (a read). A fence is the rule "before looking in someone else's mailbox, flush every letter out of your own box".

### Terminology
- **Store buffer**: a queue of writes not yet applied to cache; it exists because writing to a cache line held by another core costs tens to hundreds of cycles.
- **Store forwarding**: the same thread reading an address it just wrote sees the new value from the store buffer; other threads do not. This is the source of StoreLoad reordering.
- **Invalidate queue**: a queue that receives "your cache copy is invalid" messages from the bus, processed later to avoid stalling.
- **Memory barrier (fence)**: an instruction that prevents memory operations before/after it from crossing in some pair: LoadLoad, StoreStore, LoadStore, **StoreLoad** (the most expensive, often {{mfence}} or a {{lock}}-prefixed instruction).
- **Acquire/Release**: the modern description — an acquire read ensures nothing after it moves above it; a release write ensures nothing before it moves below it. The JMM's volatile and locks map directly to this semantics pair.
- **TSO (Total Store Order)**: x86's memory model, which leaves only StoreLoad free.
- **JCStress**: an OpenJDK framework for finding reordering bugs (unlike JMH, it measures **outcomes**, not time).

### The classic case: two variables, two threads
~~~java
// initial values, on both x86 and ARM
int x = 0, y = 0;
// Thread 1            // Thread 2
x = 1;                  y = 1;
r1 = y;                 r2 = x;
~~~
With no lock and no volatile, {{r1 == 0 && r2 == 0}} **is legal**, even on x86. The cause is not the JIT but the store buffer: each thread writes to its own variable (sitting in the store buffer, not yet in the cache line the other thread reads), then reads from the cache line still held by the other core. Result: "each believes it wrote first". This is exactly the bug that {{Dekker's algorithm}} and every non-volatile "ready flag" hit.
~~~text
Core 1                          Core 2
  store x=1 -> [store buffer 1]     store y=1 -> [store buffer 2]
  load  y    <- cache line (y=0)    load  x    <- cache line (x=0)
  ... buffer 1 flushes, too late    ... buffer 2 flushes, too late
Conclusion: both see 0, no data race in variable logic but no happens-before.
~~~
Making x and y {{volatile}} blocks the queue: write + StoreLoad fence, and read before other reads → at least one thread sees 1.

### What the JMM guarantees (quick reference)
| Happens-before edge | Fence the JVM must emit | Notes |
|---|---|---|
| {{unlock}} → {{lock}} on the same monitor | release/acquire; on x86 the fast path often needs only a {{lock}}-prefixed instruction, a real monitor adds a fence | {{synchronized}} also "flushes" the store buffer |
| volatile write → volatile read of the same field | StoreLoad fence at the write; on x86 the read usually adds no extra fence | Most expensive path, because the fence is full |
| {{Thread.start()}} → code inside {{run()}} | one-time setup before running, not per operation | The safe way to "hand off" data to a new thread |
| code inside {{run()}} → successful {{Thread.join()}} | similar, in the return direction | No join/isAlive means no edge |
| final field → first read after correct publication | StoreStore fence at the end of the constructor ("freeze action") | Condition: {{this}} must not escape from the constructor |
| {{interrupt()}} → where {{InterruptedException}} is thrown | a JMM convention | |

### Why it "fails on ARM"
On x86, the first three rows are nearly free because TSO hardware already orders them; reordering bugs usually hide themselves. ARM allows loads and stores to move much more freely, so "hand-written lock" patterns (spin flags, sequence counters, {{Double-checked locking}} missing volatile, reading two related fields without a lock) show up immediately. A service that ran fine for 2 years on Intel then fails sporadically when moved to Graviton/Ampere — or when tests run on an ARM Mac — almost always falls into this group.

### In production
- **Do not reason from "my CPU does not reorder"**. Reason from happens-before edges: use volatile/atomic/lock, or design a **single-writer** (only one thread writes the field, others read through an immutable snapshot) — the latter is what Disruptor and ring buffers do.
- **Evidence, not debate**: JCStress ({{@JCStressTest}} + {{@Outcome(accept = ...)}}) shows the exact legal outcome combinations; run it on both x86 and ARM. This is the tool the JDK uses to test the JMM itself.
- **See what the JVM emits**: {{-XX:+UnlockDiagnosticVMOptions -XX:+PrintAssembly}} or {{-XX:+LogCompilation}} to see fences inserted around volatile access (advanced, only when truly needed).
- **ARM needs its own CI job** if you plan to run on Graviton: an ARM job (AWS Graviton instance or Docker {{--platform linux/arm64}}) running the concurrency test suite will catch most of these bugs.
- **{{final}} is not "free"**: it only guarantees safety when the object is published **correctly** (no {{this}} escape in the constructor, the reference to the immutable object published via volatile/final/lock). With bad publication, none of it holds.

### 1-minute interview answer
"Reordering has two sources: hardware — the store buffer means a write has not reached cache so the writing thread sees it while other cores do not, and the invalidate queue delays invalidating cache copies; and the compiler/JIT — C2 reorders instructions when it proves no data dependency. The JMM prevents this by defining happens-before, realized by fences: four kinds LoadLoad/StoreStore/LoadStore/StoreLoad, with StoreLoad the most expensive. On TSO x86 the first three are free in hardware, so a volatile write only needs a lock-prefixed instruction, while on weaker ARM the JVM must emit real acquire/release — which is why reordering bugs often surface when porting to Graviton. I do not argue from the CPU, I argue from happens-before edges: volatile, locks, start/join, or a single-writer design with immutable snapshots."

> Senior tip: the most valuable thing to say for a lead role is not memorizing the four fence kinds, but the **process**: code with hand-written locks/spin flags must have a JCStress test or at least run the suite on ARM in CI, and code review must ask "which happens-before edge is here". One {{volatile}} line is far cheaper than an incident that "happens 3 times in 10 million requests" that you cannot reproduce.`,
    follow: [
      'Why does a lock-prefixed instruction on x86 act as a full fence, and how does it differ from {{mfence}}?',
      'Can dependencies (data/control) be broken by reordering — why can {{load-acquire}} rely on a control dependency?',
      'If only the ready flag is {{volatile}} while the large payload is read on another thread, is that guaranteed to be visible? Which scenario still fails?',
    ],
  },

  'concurrency-044': {
    q: 'Inside a virtual thread: what do a continuation and stack chunk look like, how does mount/unmount work on a carrier thread, how is the scheduler configured, what is pinning really and what does JEP 491 (JDK 24) change?',
    a: `**Summary:** A virtual thread is **not** an OS thread: it is a {{VirtualThread}} object on the heap plus a **continuation** — the stack of the running code. When a virtual thread blocks, the JVM **freezes** frames from the carrier thread's native stack down into **stack chunks** on the heap, then **unmounts**: the carrier thread (a worker of an internal ForkJoinPool) goes back to other work. When data is ready, the scheduler picks any carrier, **thaws** the chunk back onto the native stack, and resumes exactly where it stopped — which is why 1 million virtual threads cost only heap (a few KB each) instead of 1 MB stack + one kernel thread each. **Pinning** means the carrier cannot be released because the virtual thread's stack is still "anchored" to the carrier's own resources: (1) it is inside {{synchronized}} while blocking, (2) it has a native frame (JNI, some system calls) on the stack. JEP 491 in **JDK 24** fixes case (1): monitors are now frozen with the continuation, so {{synchronized}} around blocking code no longer pins the carrier.

### Quick intuition
A restaurant has 8 staff (carriers) and 5,000 guests (virtual threads). Instead of one staff member standing by each table waiting for the kitchen — the platform-thread model — a staff member writes down "table 12 is on dish 2, paused at page 3" and moves to another table (freeze + unmount). The kitchen calls out, any staff member returns to table 12, reads the note, and continues (thaw + mount). Only when a guest needs the staff member to stand right at the table (a native frame) can they not leave.

### Terminology
- **Continuation**: an internal object ({{jdk.internal.vm.Continuation}}) representing "a run that can stop and resume": it has {{run()}}, {{yield()}}, and its own stack.
- **Stack chunk**: a piece holding frozen frames, living on the heap; it starts small and **grows / shrinks** with the actual stack depth — this is the memory you pay for "1 million threads".
- **Freeze / thaw**: moving frames between the carrier's native stack and a stack chunk (opposite directions).
- **Mount / unmount**: assigning a virtual thread to a carrier (mount) and removing it (unmount) — essentially freeze/thaw plus swapping the pointer in the current {{Thread}}.
- **Carrier thread**: a platform thread, typically a worker of the virtual-thread system's own {{ForkJoinPool}}; it is what the CPU actually sees.
- **Scheduler**: the internal ForkJoinPool. Default parallelism = {{Runtime.availableProcessors()}}, tuned via {{jdk.virtualThreadScheduler.parallelism}}; {{jdk.virtualThreadScheduler.maxPoolSize}} allows extra threads to compensate when carriers block in native code; {{jdk.virtualThreadScheduler.idleTimeout}} controls how long spare threads live.
- **Pinned**: a state where the virtual thread **cannot** unmount, so the carrier must wait with it; the real resource consumed is a carrier.
- **JEP 444 / JEP 491**: 444 = virtual threads (JDK 21); 491 = "synchronized blocks may pin carriers" fixed (JDK 24).

### What happens when a virtual thread reads a socket
~~~seq
title: Virtual thread blocks in Socket.read
actors: VirtualThread | Continuation | Carrier (FJP worker) | Poller | Kernel
VirtualThread -> Carrier: running on carrier, calls read()
Carrier -> Continuation: cannot block carrier -> freeze frames to stack chunk
Carrier -> Poller: register fd with epoll wait
Carrier -> Carrier: unmount, go pick another task from FJP queue
Poller -> Kernel: epoll_wait
Kernel -> Poller: socket has data
Poller -> VirtualThread: unpark, enqueue virtual thread into scheduler queue
Carrier -> Continuation: mount again: thaw stack chunk onto native stack
Carrier -> VirtualThread: resumes right after read(), returns result
~~~
Three important consequences: (1) execution order is no longer tied to a specific thread — your code may continue on a **different carrier** (or the same one later), so every assumption that "work A and work B run on the same thread" is wrong; (2) nothing "creates an OS thread" when you block, what waits is a task in the scheduler queue; (3) {{ThreadLocal}} and {{synchronized}} become more dangerous for performance/context because they bind to the carrier or hold the carrier.

### Why {{synchronized}} used to pin the carrier
The issue is HotSpot's ObjectMonitor (designed before Loom): when a thread blocks in a monitor, the JVM must release the monitor and **that is recorded in the monitor's data structure tied to the platform thread holding it** (the owner is the carrier). To freeze a virtual thread, the JVM must let the monitor owner "change hands" when remounting on another carrier — JDK 21 did not do that. JEP 491 fixes this by letting monitors freeze/thaw with the continuation, so {{synchronized}} is no longer a pinning reason (native frames still pin, because a native stack by definition cannot move).

### Comparison table
| | Platform thread pool | Virtual thread |
|---|---|---|
| Scheduling unit | OS thread, 1:1 | internal FJP task, M:N |
| Cost per thread | ~1 MB stack + kernel struct | a few KB heap, grows with stack |
| Blocking | occupies an OS thread, context switch | freeze + unmount, carrier freed |
| Limit | thread count (a few thousand) | nearly unlimited in count, the real limit is downstream resources |
| ThreadLocal | acceptable | remember: **one map per thread**, 1 million threads = 1 million maps |
| CPU-bound | reasonable | no help, only adds freeze/thaw |
| Needs to be fast | a large enough pool | drivers/libraries must truly be non-blocking (JDBC, socket, JNI) |

### In production
- **Enable and measure with JFR**: the {{jdk.VirtualThreadPinned}} event has a duration threshold; view it with {{jfr print --events jdk.VirtualThreadPinned recording.jfc}} or {{jcmd <pid> JFR.dump}}. On JDK 21–23 there is also {{-Djdk.tracePinnedThreads=full}} to print the stack at the pin site (this flag loses value on JDK 24 because the most common reason is removed).
- **Typical symptom**: enabling virtual threads for an I/O-bound endpoint but throughput does not rise, carrier CPU stays at 100%, latency grows with concurrent requests → look for {{synchronized}} wrapping blocking calls (old JDBC drivers, JNI calls, libraries holding {{synchronized}} during init) and pinning from native frames.
- **Carrier tuning**: if most time is unfixable pinning (native libraries), raising {{jdk.virtualThreadScheduler.parallelism}} reduces pain, but do not set it far above core count because blocked carriers still consume CPU scheduling.
- **Do not "pool" virtual threads**: {{Executors.newVirtualThreadPerTaskExecutor()}} is correct; funneling 1 million tasks through 10 virtual threads just recreates the platform-pool deadlock. Limit concurrency with a {{Semaphore}} (e.g., 200 concurrent requests to the DB) — the connection pool is still the hard ceiling, virtual threads do not multiply connections.
- **Context**: log MDC/{{SecurityContext}} and {{ThreadLocal}}-based instrumentation must be rewritten around virtual threads ({{ScopedValue}} is the direction, still preview in JDK 21–23); Spring Boot 3.2+ has {{spring.threads.virtual.enabled=true}} for the web MVC server.
- **Real KPIs**: before/after enabling, compare requests/second per core, p99, and OS thread count in the container ({{/proc}} or the {{process.threads}} metric). Virtual threads win at **serving more waiting requests on the same cores**, not at speeding up each request.

### Common mistakes
- Moving {{synchronized}} onto blocking code and forgetting JDK 21–23 still pins — verify with JFR, not by eye.
- Putting large objects (connections, buffers) in {{ThreadLocal}} expecting "a million threads means a million connections": you exhaust RAM and crush the DB pool.
- CPU-bound work (parse, compress, loops) on virtual threads: the scheduler does not help, it only adds freeze/thaw.
- Assuming {{BufferedReader.lines}}, {{Scanner}}, etc. on virtual threads are always non-blocking: paths through native code or {{synchronized}} in older JDK code can still pin.

### 1-minute interview answer
"A virtual thread is a continuation: the code's stack lives in stack chunks on the heap, and the JVM mounts/thaws it onto a carrier thread that is a worker of an internal ForkJoinPool with parallelism equal to core count. On block, frames freeze and the carrier returns to the pool, so the per-thread cost drops to a few KB and thread count stops being scarce. Pinning is when the carrier cannot be released because the stack is still anchored to carrier resources: on JDK 21 that means {{synchronized}} around blocking code and native frames; JEP 491 in JDK 24 removes the {{synchronized}} case. In practice I measure with the JFR {{jdk.VirtualThreadPinned}} event, I do not pool virtual threads, I limit concurrency with semaphores, and I always remember the connection pool is the real ceiling — the gain is throughput per core when most time is spent waiting on IO, not the speed of each request."

> Senior tip: the question that separates people who have run virtual threads in production is: "did you see {{maxPoolSize}}/pinning in JFR, and does your JDBC driver have a {{synchronized}} path?" Because if pinning remains, the whole M:N model degrades back to a platform thread pool, and the symptom is carrier CPU at 100% with p99 rising with concurrency — something a "1 million threads" benchmark never shows you.`,
    follow: [
      'How do stack chunks grow and shrink when your stack recurses deeply; what is the consequence for {{StackOverflowError}}?',
      'Why do {{LockSupport.park}}, {{ReentrantLock}}, and {{BlockingQueue}} not pin the carrier while {{synchronized}} does (before JDK 24)?',
      'What problem does {{ScopedValue}} solve for {{ThreadLocal}} in an M:N world, and what is the mechanism that is almost entirely scope-immutable?',
    ],
  },

  'concurrency-045': {
    q: 'How is {{synchronized}} implemented inside the JVM: what does an object\'s mark word contain, what happens on the uncontended fast path, when is a lock inflated to an ObjectMonitor, why was biased locking removed in JDK 18, and which flags/debug tools let you see it?',
    a: `**Summary:** Every Java object has a 64-bit **mark word** at the start of its header, holding (depending on state) the identity hash code, 4 GC "age" bits, and **2 lock-state bits**. With no lock held → "unlocked" bits, {{monitorenter}} is just a CAS that turns the mark word into a **thin lock** (stack lock): the JVM writes the old "displaced mark word" into a {{LockRecord}} in the holding thread's frame — **no object allocation**, no syscall, and reentry just bumps a counter. When a second thread truly contends, the lock is **inflated** to an **ObjectMonitor** (fat lock) with {{_owner}}, {{_EntryList}} (BLOCKED threads), and {{_WaitSet}} (threads WAITING after {{wait()}}); {{notify()}} moves a waiter from _WaitSet back to _EntryList — it does not hand over the lock. **Biased locking** — an optimization for locks ever held by only one thread — was deprecated in JDK 15 (JEP 374) and **removed in JDK 18**, because revocation cost (stopping the whole JVM at a safepoint to "revoke" the lock) and because it is useless for modern code.

### Quick intuition
A room door has a **status board** right on it (the mark word). Nobody inside: the board is blank. One person enters: they write "I'm in, the key is in my pocket" (thin lock) — no real lock installed; anyone arriving sees the board and waits. Two people want in at once: the building installs a **real lock** (ObjectMonitor) — with a queue outside (_EntryList) and a waiting room for people who ring the bell to rest (_WaitSet). If nobody waits later, the real lock can be removed (deflated) back to the lightweight state.

### Terminology
- **Mark word**: the object's 8-byte header; lock states are distinguished by low bits. The identity hash code (31 bits) also lives here — which is why it conflicts with lightweight lock modes.
- **Thin lock / stack lock**: a lock held by **one** thread, with information in the frame (LockRecord) instead of in the object.
- **Displaced mark word**: the copy of the old mark word stashed away when the lock is taken; restored on unlock.
- **Inflation / deflation**: switching thin lock → ObjectMonitor, and back (deflation happens at a safepoint when no one is waiting on the monitor).
- **ObjectMonitor**: HotSpot's native structure, using the OS mutex/condvar to put threads to sleep; it is what sits behind {{BLOCKED}} and {{WAITING}} in a thread dump.
- **Biased locking**: "biased" locking — by default writing the thread name into the mark word so the next entry only checks, no CAS; removed because revocation is expensive.
- **Lock elision / coarsening**: C2 optimizations — removing a lock when escape analysis proves the object does not escape the thread, or merging adjacent locks; both are **not a contract**.
- **{{monitorenter}} / {{monitorexit}}**: the bytecode for a {{synchronized}} block (a method has the {{ACC_SYNCHRONIZED}} flag and the JVM handles it around the whole method).

### Mark word layout (sketch, HotSpot 64-bit)
~~~text
63                              32 31        3  2  1 0
[ unused / identity hash (31 bit) ][age 4][biased][lock bits]
  lock bits = 01 : unlocked
  lock bits = 00 : thin (stack) lock  -> next 8 bytes = pointer to LockRecord
  lock bits = 10 : heavyweight        -> pointer to ObjectMonitor
  lock bits = 11 : biased             -> ( JDK <= 15, removed )
When thin-locked, the holding thread's frame has:
  LockRecord { object address | displaced mark word | owner | rec_count | ... }
Fast-path loop: CAS mark word (word swap) -> success, no allocation, no syscall.
Thread 2 contends: inflate -> ObjectMonitor { _owner, _EntryList, _WaitSet, _recursions }
~~~
Notable point: the displaced mark word lives in the thread's **stack**, so a lightweight lock has near-zero memory cost and disappears when the method returns. In contrast an ObjectMonitor is native memory, and every block is a round trip to the OS.

### Step by step for a {{synchronized}} block
1. C2 emits {{monitorenter}}; the fast path tries a "word swap" CAS on the mark word: if the object is unlocked, the CAS succeeds → thin lock, write a LockRecord.
2. If the object is already a thin lock of **this same thread** → bump {{rec_count}} (reentrant), no complex CAS.
3. If it is another thread's thin lock, or the CAS fails for another reason → **inflate**: create an ObjectMonitor, set {{_owner}}, move the current holder into the monitor, put the current thread into {{_EntryList}} and block (thread state BLOCKED in a dump).
4. Inside the block, {{lockObj.wait()}}: fully release the lock ({{recursions}} back to 0), move the thread into {{_WaitSet}}, park; thread state WAITING.
5. {{notify()}} picks one (or all) thread(s) in _WaitSet and moves them to _EntryList; it does **not** hand over the lock. The notified thread must contend for the lock again from scratch — which is why await must be in a {{while}} loop.
6. {{monitorexit}} (including the exception path, the JVM has an Exception table) → if anyone is in _EntryList transfer ownership; if not, the monitor may be deflated at the next safepoint.

### Table: modes and consequences
| State | Data lives in | Enter/exit cost | What you see in a dump |
|---|---|---|---|
| Unlocked | mark word | 0 | — |
| Thin lock | mark word + LockRecord in stack | 1 CAS, no allocation | {{- locked <0x...>}} |
| Heavyweight | native ObjectMonitor | OS mutex/condvar, context switch | {{waiting for monitor entry}}, BLOCKED |
| Biased (old) | thread name in mark word | ~0 for the same thread | removed in JDK 18 |
| Elided | lock gone from code | 0 | nothing — the JIT removed it |

### In production
- **Read dumps first**: {{jcmd <pid> Thread.print}} (several times a second apart) shows who is {{locked <0x...>}} and who is {{waiting for monitor entry on <0x...>}}; a chain "A waits for B's lock, B waits for C's lock" = deadlock, which the JVM detects and prints as "Found one Java-level deadlock".
- **Measure contention**: JFR events {{jdk.JavaMonitorEnter}} (has a duration threshold, only recorded when it actually had to wait) and {{jdk.JavaMonitorWait}}; async-profiler {{-e lock}} captures exactly those events and gives a flame graph of "who waited on which lock". This is how you get evidence instead of guessing.
- **Flags, stated accurately**: {{-XX:+UseHeavyMonitors}} forces every monitor to heavyweight (diagnosing lightweight-lock bugs, heavy performance hit, only for investigation); {{-XX:-EliminateLocks}} disables JIT lock elision when you need to be sure the lock always exists for measurement. {{-XX:BiasedLockingStartupDelay}} only has historical meaning (JDK ≤ 15/17 depending on build).
- **hashCode breaks the thin lock**: calling {{System.identityHashCode(obj)}} on an object under a thin lock forces inflation, because the mark word is already occupied. Symptom: adding {{obj.toString()}} logging (which by default prints the hash code!) inside a critical section raises latency. This is why "log the object" in a hot critical section costs more than it looks.
- **Do not lock on externally shared objects**: String literals, the {{Integer.valueOf}} cache, {{Boolean}}, {{Class}} — easy to deadlock with other code (including libraries). Always create {{private final Object lock = new Object();}}.

### Common mistakes
- Believing {{synchronized}} is "slow" and switching to ReentrantLock for no reason: in the uncontended case both are just a CAS; ReentrantLock wins when you need {{tryLock}}/timeout/fair/Condition.
- Calling {{wait()}} outside a {{while}} that checks the condition → spurious wakeup, or another thread takes the condition before you resume.
- {{notify()}} when multiple kinds of waiters share the same condition → "lost wakeup", the system waits until timeout; {{notifyAll()}} or separate {{Condition}}s per kind are safer.
- Holding the lock while calling out (HTTP, DB, log, library callbacks) → lock hold time becomes the external system's latency; this is the number-one cause of unexplained contention.
- Thinking "the JIT elides locks so I don't need to think about locking": elision is not a contract, change the input/data and the lock comes back.

### 1-minute interview answer
"{{synchronized}} is implemented by the JVM in tiers: an object has a mark word holding lock state; entering an uncontended lock is a CAS that turns the mark word into a thin lock, with the displaced header in a LockRecord on the stack — no allocation, no syscall. A second contending thread inflates the lock to an ObjectMonitor with EntryList and WaitSet; {{wait()}} moves to WaitSet, {{notify()}} moves back to EntryList without handing over the lock, so await must be in a while loop. Biased locking once optimized single-thread locks but was removed in JDK 18 because of safepoint revocation cost. To prove contention I use the JFR {{jdk.JavaMonitorEnter}} event or async-profiler {{-e lock}}, and I read {{jcmd Thread.print}} to see who is {{locked}} and who is {{waiting for monitor entry}}."

> Senior tip: three "I've seen this in production" details make the answer more credible than any theory: (1) adding a log line printing {{obj.toString()}} raised p99 because it computes the identity hash code and forces inflation; (2) {{synchronized}} in a driver/library combined with virtual threads was a pinning source before JDK 24; (3) most "lock contention" is really **holding the lock across I/O** — the fix is to shrink the critical section or move to a single-writer structure, not to change the lock type.`,
    follow: [
      'What happens when an object under a thin lock gets {{hashCode()}} called for the first time after inflation — and why is the identity hash 31 bits?',
      'When does ObjectMonitor deflation occur, why does it need a safepoint, and what is the impact on tail latency?',
      'Under what conditions does C2 remove a lock via escape analysis, and how do you verify the lock still exists?',
    ],
  },
});
