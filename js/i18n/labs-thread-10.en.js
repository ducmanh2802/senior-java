/*
 * English translation of js/data/labs-thread.js — task T1004. Format: js/core/i18n.js (content overlay).
 * ids: lab-thread-009 lab-thread-010
 */
App.i18n.content({
  'lab-thread-009': {
    title: `Switched to virtual threads but the lookup API still stalls: pinning due to synchronized wrapping JDBC`,
    scenario: `**Context:** **FinOne Lookup** (Spring Boot 3.3, Java 21, PostgreSQL 15, HikariCP) is a customer-record lookup service. Previously Tomcat used 200 platform threads (OS threads — each a real OS "worker", ~1MB stack and context-switch cost). Under load, requests queued waiting for a free thread.

**Change:** The team enabled {{spring.threads.virtual.enabled=true}} to use **virtual threads** (JVM virtual threads, very light — a few KB, the JVM schedules millions of them on a small number of OS threads called **carrier threads**). Expectation: when a virtual thread waits on I/O (DB or HTTP) it "yields" its carrier to another virtual thread, boosting throughput.

**Symptoms:** After deploy, throughput **did not rise**, slightly fell: before 820 req/s, after **790 req/s**; p99 from 95ms to **640ms**. Pod CPU 2 vCPU only ~40%. No DB errors, no deadlock. Odd: a classic thread dump shows almost no request running.

**Data collected:**
- Run {{jcmd 1 Thread.dump_to_file -format=text /tmp/vt-dump.txt}} (JDK 21 text format lists virtual threads too, unlike plain {{Thread.print}} which only shows platform threads).
- Enabled {{-Djdk.tracePinnedThreads=full}} on the canary pod (JDK 21-23 option, prints stack when a virtual thread is **pinned** — "stuck" to its carrier and cannot yield).
- Prometheus metrics before/after deploy (same 800 req/s load).`,
    questions: [
      'Why did throughput not rise and p99 rise after enabling virtual threads? Explain the "pinning" mechanism and cite evidence from the artifact.',
      'What are the two carrier threads doing and why must the other 214 virtual threads wait? Distinguish "normal I/O wait" from "pinned".',
      'How will you fix it (short and long term)? How to detect pinning in CI/production?'
    ],
    hints: [
      'In {{trace-pinned.log}}: what does the line {{<== monitors:1}} mean? When a virtual thread holds a monitor ({{synchronized}}) and hits a blocking operation (reading the JDBC socket), can it "yield" its carrier? What is a carrier thread versus a virtual thread?',
      'In {{vt-dump.txt}}: {{worker-1}} is {{Carrying virtual thread #812}} and reading the DB socket but still shows {{RUNNABLE}} and holds {{locked <0x000000070f2a1c40>}}. Meanwhile #417/#418/#419 are {{virtual WAITING}}. How many carriers serve 216 in-flight requests?',
      'Compare three approaches: drop {{synchronized}} and use {{ReentrantLock}} (JDK 21+ does not pin when parking on {{ReentrantLock}}), shrink the {{synchronized}} region so it does not wrap JDBC, or use a semaphore to bound concurrency. Note pinning also happens in native/foreign calls — but here the cause is the monitor.'
    ],
    answer: `**Summary:** Enabling virtual threads did not help because the code uses {{synchronized}} wrapping the JDBC call (reading data from PostgreSQL over the network). When a virtual thread holds a {{synchronized}} monitor and then waits on I/O, it becomes **pinned** (stuck) to its carrier thread — it cannot yield. Only 2 carriers exist (2 vCPU), so at most 2 requests truly run concurrently; the other 214 queue for carrier/monitor. The result resembles 2 platform threads, but worse due to virtual-thread scheduling overhead; hence ~790 req/s, p99 640ms, CPU only 40%.

### Background terms

- **Thread:** a sequential execution flow; the OS interleaves many threads.
- **Platform thread:** the traditional thread, mapped 1-1 to an OS thread. Heavy (~1MB stack), costly to create/context-switch. Everyday analogy: each worker is a real person; hiring more is expensive.
- **Virtual thread (Java 21):** a JVM-managed, very light thread (a few KB). Thousands/millions of virtual threads run on a handful of **carrier threads** (real OS threads, usually equal to CPU count). When a virtual thread hits a waiting operation (I/O, sleep) it *unmounts* from its carrier so the carrier runs another virtual thread — like a few real staff rotating through many waiting tickets.
- **Carrier thread:** the OS thread currently "carrying" a virtual thread. In the dump these are {{ForkJoinPool-1-worker-1}} and {{worker-2}} (2 carriers = 2 vCPU).
- **Monitor / synchronized:** {{synchronized}} takes a "lock" (monitor) attached to an object; only one thread holds it at a time; others wait.
- **Pinning:** state where a virtual thread **cannot unmount** from its carrier while performing a blocking operation. The carrier is occupied and cannot run other virtual threads. Common causes: (1) holding a {{synchronized}} monitor and parking/blocking, (2) being in a native/foreign function (JNI, Panama).
- **JDBC:** the Java API for running SQL over a network connection to a database (here PostgreSQL).

### Pinning mechanism — why the virtual thread does not yield

When things go well, a virtual thread calls I/O (e.g. socket read) → JVM detaches it from the carrier → carrier runs other threads → when I/O completes it remounts. But if the virtual thread is **holding a {{synchronized}} monitor** ({{monitors:1}} in the trace) at that moment, the JVM **dares not** unmount: if it yielded the carrier, the monitor would still be held by the suspended virtual thread and the {{synchronized}} mechanism (tied to the OS thread) would break. So the JVM keeps the virtual thread on the carrier — that is **pinning**.

~~~text
Normal (no synchronized):                  When pinned (synchronized + I/O):
  VT-A waits for DB -> unmount              VT-A waits for DB -> PINNED on carrier-1
  carrier-1 runs VT-B, VT-C...              carrier-1 waits on socket (does nothing else)
  DB returns -> remount VT-A                VT-B, VT-C... queue for carrier/monitor
~~~

### Evidence from the artifact

**1) trace-pinned.log:** The stack shows {{onPinned}} → {{park}} → {{SocketChannelImpl.implRead}} (reading the PostgreSQL socket). Two lines {{<== monitors:1}} at {{CustomerRepository.findById}} (line 37) and {{CustomerLookupService.lookup}} (line 29) prove the virtual thread holds 2 {{synchronized}} monitors exactly while waiting on JDBC. This is direct evidence of pinning.

**2) vt-dump.txt (jcmd Thread.dump_to_file -format=text):** Both carriers {{worker-1}} (nid 0x3f) and {{worker-2}} (nid 0x40) are {{java.lang.Thread.State: RUNNABLE}} but actually **waiting on the DB socket** ({{implRead}}). Each records {{Carrying virtual thread #812/#819}} and holds {{locked <0x000000070f2a1c40>}} / {{<0x000000070f2a1c90>}}. The pod has 2 vCPU → exactly 2 carriers → exactly 2 requests run concurrently; the rest are helpless.

**3) 214 virtual threads WAITING:** {{#417, #418, #419}} (and 214 total) are {{virtual WAITING}} at {{VirtualThread.park}} from {{CustomerRepository.findById}} / {{CustomerLookupService.lookup}}. They are not waiting on the DB — they wait to be mounted on a carrier or to acquire a monitor. Requests keep arriving but no carrier is free to run them.

**4) Metrics:** Before (200 platform threads) ~140 busy threads each wait on their own OS thread I/O → 798 req/s. After (virtual threads) only 2 carriers truly run; DB still 35ms/query → at most ~57 req/s per carrier if sequential, a bit more with interleaving, but the total ~790 req/s is a low ceiling and p99 spikes because of queuing. CPU 40% because 2 cores busy waiting on I/O (idle scheduling time included); importantly **no carrier is free**.

### Why plain {{Thread.print}} shows almost nothing

{{jcmd 1 Thread.print}} (traditional format) mainly lists **platform threads**. Virtual threads only appear fully with {{Thread.dump_to_file -format=text}} (JDK 21+) or {{-format=json}}. This is a diagnostic trap: an "empty" dump does not mean no requests are stuck.

### Normal I/O wait vs pinned

| Situation | Virtual thread | Carrier | Consequence |
|---|---|---|---|
| Waits on I/O, **no** {{synchronized}} | unmount, park | runs other VT | Intended virtual-thread benefit |
| Waits on I/O, **holding** {{synchronized}} (this case) | pinned, park | waits on I/O, runs no other VT | Carrier exhaustion, throughput collapse |
| Waits on {{ReentrantLock.lock()}} (JDK 21+) | unmount, park | runs other VT | No pin ({{ReentrantLock}} uses {{LockSupport.park}} compatible with VT) |

### Fix

**Short term (safe, do now):**
1. **Remove {{synchronized}} from the I/O path**, replace with {{ReentrantLock}} or make the repository stateless so no instance lock is needed:
~~~java
public class CustomerRepository {
    // BEFORE: synchronized wraps all of JDBC -> pin
    public synchronized Customer findById(String id) { return jdbc.query(...); }
}
// AFTER (option 1): drop synchronized if repository holds no shared state needing protection
public class CustomerRepository {
    public Customer findById(String id) { return jdbc.query(...); } // JDBC + pool are thread-safe
}
// AFTER (option 2): if locking truly needed, use ReentrantLock (no pin when await/park)
public class CustomerRepository {
    private final ReentrantLock lock = new ReentrantLock();
    public Customer findById(String id) {
        lock.lock();
        try { return jdbc.query(...); } finally { lock.unlock(); }
    } // Note: still holds lock across I/O (blocks other threads) but does NOT pin the carrier — an important difference
}
~~~
Note: {{ReentrantLock}} avoids pinning but still holds the lock during DB wait, so other virtual threads entering the same repository still wait on each other — better than pinning (carrier freed) but not optimal. Best is **no lock around I/O**.

2. **Shrink the lock region:** if only a small state-update needs protection, lock exactly that, keep JDBC outside.
3. **Temporarily revert to platform threads** for this endpoint (or disable virtual threads globally) if no time to fix, to restore SLA.

**Long term:**
- Use JDBC driver / libraries verified with virtual threads; size the pool sensibly (virtual threads are many but DB connections are still finite).
- Code-review rule: "no I/O may live inside {{synchronized}}". Add ArchUnit/static checks where possible.
- For operations needing bounded concurrency (instead of locking), use {{Semaphore}} ({{acquire}} is virtual-thread compatible when used correctly).

### Detecting pinning in CI/production

- **JDK 21-23:** run load tests with {{-Djdk.tracePinnedThreads=full}} (or {{short}}). Any {{onPinned}} line is a warning to handle.
- **JDK 24+:** JFR event {{jdk.VirtualThreadPinned}} is still useful; combine with {{jdk.VirtualThreadSubmitFailed}} and monitor carrier queue length.
- **Production:** keep JFR profiling on, dashboard count of {{jdk.VirtualThreadPinned}} by endpoint/stack; alert when > 0 on hot paths.
- **Unit/integration tests:** run with {{-Djdk.tracePinnedThreads=full}} and fail the test if stderr contains {{onPinned}} (or use the JFR stream API).

### Common pitfalls

- Thinking "enable virtual threads and done" without auditing {{synchronized}} in your code and dependencies (old SDKs, old drivers).
- Misunderstanding {{ReentrantLock}}: it avoids pinning but holding the lock across I/O still causes logical contention — not a magic wand.
- Looking at {{Thread.print}} and seeing few threads → concluding "nothing"; you must use {{Thread.dump_to_file -format=text}}.
- Raising the connection pool to "fix" p99: the pool is not the bottleneck here ({{pending=0}}); the bottleneck is pinned carriers.

> Senior tip: Virtual threads solve "thousands of I/O-bound tasks" (I/O-bound), not "lock contention" or "CPU-bound". Before enabling globally, run a canary with {{-Djdk.tracePinnedThreads=full}} and JFR, and inspect dependencies too: a logging/metrics/SDK using {{synchronized}} around a network call is enough to pin carriers. Golden rule: {{synchronized}} may only wrap short CPU-only sections; anything touching I/O must live outside the monitor.`,
    rubric: [
      'Correctly explain the pinning mechanism: the virtual thread holds a {{synchronized}} monitor (monitors:1) and on blocking JDBC I/O it cannot unmount from the carrier; the carrier is occupied and 214 virtual threads queue. Cite trace-pinned (onPinned, SocketChannelImpl.implRead, monitors:1 at Repository:37/Service:29) and vt-dump (worker-1/2 Carrying #812/#819, locked 0x000000070f2a1c40/0x000000070f2a4e10).',
      'Explain why throughput did not rise: only 2 carriers run (2 vCPU pod) serving ~2 requests concurrently while waiting 35ms on DB; Hikari pending=0 so the pool is not the bottleneck. Distinguish I/O wait without pin from pinned.',
      'Propose the fix: remove/shrink {{synchronized}} off the JDBC path (preferred), or use {{ReentrantLock}} (avoids pinning but still logical lock), with trade-offs; detection via tracePinnedThreads (JDK21-23), JFR VirtualThreadPinned, and text-format dump.'
    ]
  },
  'lab-thread-010': {
    title: `parallelStream and supplyAsync without an executor: commonPool blocked by I/O, whole system sluggish`,
    scenario: `**Context:** **ShopCore Pricing** (Spring Boot 3.3, Java 17, 8 vCPU pod) computes promotional prices for shopping carts. Each request calls:
- {{CompletableFuture.supplyAsync(() -> taxClient.quote(...))}} to get tax from the tax service (HTTP, ~300ms).
- {{cart.getItems().parallelStream().map(p -> inventoryClient.stock(p))}} to get stock per product (HTTP, ~200ms/call).

The dev team uses {{supplyAsync}} and {{parallelStream}} because "running in parallel is faster" and passes no {{Executor}} (uses defaults).

**Symptoms:** At low traffic latency is fine. When traffic doubled at **14:05 on 03/11/2026**, p99 of {{/pricing/quote}} rose from 420ms to **18s**, but pod CPU only **11%** (almost idle). Upstream tax and inventory services stay healthy (upstream p99 < 250ms). Heap normal, no heavy GC. After the spike p99 recovers on its own.

**Data collected:** {{jstack <pid>}} at 14:08:30, latency/CPU metrics, and thread-pool logs (no custom pool configured).`,
    questions: [
      'Why is CPU only 11% while p99 hits 18 seconds? Explain what ForkJoinPool.commonPool is, who shares it, and the starvation mechanism here.',
      'Why are upstreams healthy (p99 < 250ms) while Pricing is slow? Use the 7 workers and ~260 req/s to estimate the bottleneck.',
      'How will you fix it to isolate blocking I/O from commonPool? List options and trade-offs (dedicated thread pool, virtual threads, true async).'
    ],
    hints: [
      'Read {{PricingService.java}}: {{supplyAsync(...)}} with no second argument runs where? {{parallelStream()}} runs where? Do the two share **one** pool? In jstack how many workers are there and what are they all doing?',
      '{{ForkJoinPool.commonPool()}} defaults to {{availableProcessors - 1}} threads = 7 (see metrics). Each worker is {{RUNNABLE}} but actually waiting in {{Net.poll}} (reading a socket) — an OS thread occupied waiting on I/O, not computing. When all 7 "workers" wait on the network, how do new tasks (from other requests, or elsewhere in the JVM) get served?',
      'Compare: (1) pass a dedicated {{Executor}} to {{supplyAsync(supplier, ioExecutor)}} and replace {{parallelStream}} with submit to the I/O pool; (2) use a virtual-thread executor (Java 21) for I/O tasks; (3) use a truly async HTTP client (WebClient/non-blocking). Note the I/O pool must be bounded to avoid overloading upstreams.'
    ],
    answer: `**Summary:** {{parallelStream()}} and {{CompletableFuture.supplyAsync(...)}} (without an {{Executor}}) both use the shared **{{ForkJoinPool.commonPool()}}** — one thread pool for the whole JVM. By default it has only {{CPU_count - 1 = 7}} workers. The code uses that pool to make blocking HTTP calls (waiting on the network 200-300ms), so all 7 workers get stuck in {{Net.poll}} (socket read). When traffic rises, every new task (even from other requests) must queue for the 7 workers to free up → p99 18s even though CPU is only 11% (threads are "waiting", not computing). Upstreams stay fast; the bottleneck is Pricing itself exhausting its workers.

### Background terms

- **Thread pool:** a set of pre-created, reused threads to run many tasks, avoiding repeated thread-creation cost. Everyday analogy: 7 shared staff for a whole shop — if all 7 stand waiting at the kitchen (I/O), no new customer is served.
- **{{ForkJoinPool.commonPool()}}:** a pool shared **across the entire JVM**. Default size = {{Runtime.getRuntime().availableProcessors() - 1}} (here 8 - 1 = 7). Anyone in the process can inadvertently use it.
- **{{parallelStream()}}:** runs stream elements in parallel using {{commonPool}}.
- **{{CompletableFuture.supplyAsync(supplier)}}** (one arg): runs {{supplier}} asynchronously on {{commonPool}}. The two-arg {{supplyAsync(supplier, executor)}} is the one that lets you choose a pool.
- **Blocking I/O:** an operation waiting for external data (network, disk). The calling thread sits idle waiting — the OS thread is occupied but CPU is idle.
- **Starvation:** tasks wait a very long time (or never run) because the resource they need (here, worker threads) is held by other tasks.

### Who shares commonPool? (the big trap)

~~~text
ForkJoinPool.commonPool()  (7 workers, shared across the WHOLE JVM)
  +-- PricingService.lambda$quote$0  (supplyAsync -> TaxClient HTTP)      [from request A]
  +-- PricingService.lambda$quote$2  (parallelStream -> Inventory HTTP)   [from requests A, B, C...]
  +-- (possibly) any library that calls parallelStream/supplyAsync
All of them compete for the same 7 workers.
~~~

Each pricing request creates 1 tax future + N stock tasks (parallel). At 260 req/s with a few items per cart, the number of blocking-I/O tasks generated is **far larger** than 7 workers — the queue grows and latency rises with queue depth.

### Evidence from the artifact

**1) {{PricingService.java}}:** {{CompletableFuture.supplyAsync(() -> taxClient.quote(cart))}} passes no executor → {{commonPool}}. {{cart.getItems().parallelStream()}} → {{commonPool}}. Both call blocking HTTP clients ({{HttpURLConnection.getInputStream}}).

**2) {{jstack-pricing.txt}}:** All 7 {{ForkJoinPool.commonPool-worker-1}} through {{worker-7}} are {{java.lang.Thread.State: RUNNABLE}} but the stack stops at {{sun.nio.ch.Net.poll}} / {{NioSocketImpl.implRead}} / {{Socket$SocketInputStream.read}} — i.e. **waiting on the network**. {{worker-2}} runs {{CompletableFuture$AsyncSupply}} calling {{TaxClient.quote}}; the other workers run {{AbstractTask.compute}} (tasks from {{parallelStream}}) calling {{InventoryClient.stock}}. **No worker is free.** Tomcat threads ({{http-nio-8080-exec-*}}) are {{WAITING}} on {{future.join()}} / stream completion.

**3) {{metrics-14h.txt}}:** {{availableProcessors=8}} → commonPool parallelism = 7. CPU 11%, loadavg 0.4, upstream p99 < 250ms, DB pool pending=0: everything outside is healthy. The only bottleneck can be the 7 shared workers held by blocking I/O.

**4) Quick estimate:** 7 workers, each network wait ~200-250ms → at most ~28-35 I/O tasks complete per second across the whole pool (if each task is one call). But 260 req/s * (1 tax call + ~3 stock calls) = 1000+ calls/s needed. Shortage of workers by tens of times → queue grows linearly → p99 18s.

### Why {{RUNNABLE}} still means "stuck"

In Java, a thread waiting on I/O via native poll/read is often still reported {{RUNNABLE}} (it is executing native code waiting on the OS), not {{WAITING/TIMED_WAITING}} like waiting on a lock. Do not read "RUNNABLE = computing". Read the stack: if you see {{Net.poll}}, {{Socket.read}}, {{EPoll.wait}}, that is **I/O wait**.

### Flow diagram

~~~seq
title: 7 commonPool workers held by I/O, requests queue
actors: Client | Tomcat | CommonPool(7) | Tax/Inventory
Client -> Tomcat: GET /pricing/quote (260 req/s)
Tomcat -> CommonPool(7): supplyAsync(tax) + parallelStream(stock)
CommonPool(7) -> Tax/Inventory: HTTP blocking (200-300ms)
note CommonPool(7): 7/7 workers RUNNABLE @ Net.poll (waiting on socket)
Tomcat -> Tomcat: join() WAITING on future
CommonPool(7) --> Tomcat: result (very late, due to queuing)
Tomcat --> Client: response p99 18s
~~~

### Fix

**Principle:** **Blocking I/O** tasks must run on an executor dedicated to I/O (sized by upstream bandwidth/capacity, bounded), never occupying commonPool (commonPool is for short CPU-bound tasks).

**Option 1 — Dedicated I/O executor (Java 8+, recommended before Java 21):**
~~~java
@Configuration
class ExecutorsConfig {
    @Bean
    ExecutorService ioExecutor() {
        // Bound to avoid overloading upstreams; set per upstream capacity
        return new ThreadPoolExecutor(32, 64, 60, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(500),
            new ThreadPoolExecutor.CallerRunsPolicy()); // overload -> Tomcat thread runs (back-pressure)
    }
}

@Service
public class PricingService {
    private final ExecutorService ioExecutor;
    public Quote quote(Cart cart) {
        CompletableFuture<Tax> taxFuture =
            CompletableFuture.supplyAsync(() -> taxClient.quote(cart), ioExecutor); // pass executor
        // Replace parallelStream with per-item submit to the I/O pool, then gather
        List<CompletableFuture<Stock>> fs = cart.getItems().stream()
            .map(it -> CompletableFuture.supplyAsync(() -> inventoryClient.stock(it.getSku()), ioExecutor))
            .toList();
        List<Stock> stocks = fs.stream().map(CompletableFuture::join).toList();
        Tax tax = taxFuture.join();
        return Quote.of(cart, stocks, tax);
    }
}
~~~

**Option 2 — Virtual threads for I/O (Java 21+, fits Spring Boot 3.2+):**
~~~java
ExecutorService vt = Executors.newVirtualThreadPerTaskExecutor();
CompletableFuture.supplyAsync(() -> taxClient.quote(cart), vt);
~~~
Virtual threads yield their carrier while waiting on I/O (as long as not pinned — see the pinning lab), so I/O task counts can scale large. Still must **bound concurrency** to upstreams (use {{Semaphore}}) to avoid shooting down tax/inventory services.

**Option 3 — Truly async HTTP client (WebClient/reactive):** no thread occupied while waiting on the network. Strong but a big programming-model change; pick only when the team is comfortable with reactive.

| Option | Pros | Cons | When |
|---|---|---|---|
| Dedicated I/O thread pool | Simple, explicit concurrency control | OS threads, must tune size/queue | Java 8-17, blocking client already in use |
| Virtual-thread executor | Blocking code but good I/O scaling | Needs Java 21; still rate-limit; watch for pinning | Java 21+, I/O-bound paths |
| Non-blocking (WebClient) | Few threads, good back-pressure | Complex, hard to debug, spreads across stack | Reactive systems, very high throughput |

### Common pitfalls

- Using {{supplyAsync}} "for speed" while forgetting the {{executor}} argument — silently uses commonPool.
- Using {{parallelStream}} on I/O tasks — {{parallelStream}} is meant for CPU-bound splitting of collections, not network waits.
- Creating an **unbounded** I/O pool ({{newCachedThreadPool}} / unlimited virtual threads firing at upstreams) → cascading outage for tax/inventory services.
- Seeing {{RUNNABLE}} in jstack and assuming the thread is busy computing; read further down the stack for {{Net.poll/read}}.
- Thinking "more CPU" will save it: 11% CPU proves extra cores are useless; the bottleneck is worker count and I/O wait.

> Senior tip: Rule for the team: {{commonPool}} is only for short CPU-bound tasks with **no blocking I/O**. Every {{supplyAsync}} in the codebase must have an {{executor}} argument; every {{parallelStream}} must be reviewed (default to {{stream()}} unless CPU benefit is measured). Put metrics on each I/O executor's queue size and wait time — early warning before p99 explodes. And remember commonPool is shared: another module abusing it can kill Pricing too.`,
    rubric: [
      'Correctly identify commonPool shared by {{supplyAsync}} (no executor) and {{parallelStream}} (PricingService.java), parallelism=7 workers; all 7 workers RUNNABLE but waiting on {{Net.poll/Socket.read}} (blocking I/O to tax/inventory) causing starvation at 260 req/s generating ~1000 calls/s.',
      'Explain why CPU is 11% but p99 18s (I/O wait, not CPU-bound), upstreams healthy so bottleneck is Pricing; distinguish RUNNABLE polling I/O from computing.',
      'Propose isolating I/O: pass a dedicated executor to supplyAsync and replace parallelStream with submit to a bounded I/O pool with back-pressure, or a virtual-thread executor (Java 21) + Semaphore rate-limiting upstream; state trade-offs and the rule of not using commonPool for blocking I/O.'
    ]
  }
});
