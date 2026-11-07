/*
 * English translation of js/data/q-concurrency-jvm.js — task T954. Format: js/core/i18n.js (content overlay).
 * ids: concurrency-052 concurrency-053 jvm-037 jvm-038 jvm-039 jvm-040 jvm-041
 */
App.i18n.content({
  'concurrency-052': {
    q: '{{Phaser}} is a multi-phase rendezvous point with a dynamic number of parties: arrive/arriveAndAwaitAdvance, phase numbers, the onAdvance hook, and how does it differ from CyclicBarrier?',
    a: `**Summary:** {{Phaser}} is a flexible rendezvous point: the number of parties can change between phases (register/deregister), each phase has a sequence number, a thread can call arrive() to signal that it has reached the phase and continue doing other work, or arriveAndAwaitAdvance() to wait until enough parties arrive before moving to the next phase. The onAdvance() hook runs when enough parties advance, and it is used to decide whether to continue or terminate. Compared with CyclicBarrier: the party count is fixed and all parties must wait at every rendezvous; Phaser allows parties to be slower, join late, leave early, and lets the phase continue for those that have already arrived.

### Quick intuition
Think of a tour group meeting at each rest stop. With CyclicBarrier, everyone must be present at the stop before the group moves to the next leg, and the number of people is fixed. With Phaser, the number of people can grow (you pick up friends along the way) or shrink (someone goes home early). Each person reports arriving at the stop (arrive); those who want to move on with the group wait until enough have arrived (arriveAndAwaitAdvance). The tour guide (onAdvance) decides whether the next leg continues or the tour ends.

### Terminology
- **Phaser**: a multi-phase rendezvous point with a dynamic party count.
- **Party**: a thread that has registered to participate in the phaser.
- **register()/register(int parties)**: register one or more parties.
- **arrive()**: signal arrival at the current phase without waiting; the thread continues other work.
- **arriveAndAwaitAdvance()**: signal arrival and wait until enough parties advance to the next phase.
- **arriveAndDeregister()**: signal arrival and leave the phaser.
- **onAdvance(phase, registeredParties)**: a hook that runs when enough parties advance; return true to terminate the phaser.
- **Phase number**: an integer that increases each time enough parties advance to a new phase.

### Step-by-step operation

1. Create a Phaser: {{new Phaser()}} (which has 1 party — the creating thread) or {{new Phaser(1)}}.
2. Workers call register(): the party count increases.
3. Each worker does the work for phase 1, then calls arriveAndAwaitAdvance(): it signals arrival and waits.
4. When enough parties have arrived → the phase number increases by 1, onAdvance() runs, and all workers are awakened for phase 2.
5. A worker can register() more parties (a late joiner) or call arriveAndDeregister() (leave early).
6. The phaser terminates when onAdvance returns true or the party count drops to 0.

### Code example

~~~java
import java.util.concurrent.Phaser;
import java.util.List;
import java.util.ArrayList;

public class PhaserDemo {
    public static void main(String[] args) throws InterruptedException {
        int parties = 3;
        Phaser phaser = new Phaser(1);  // 1 party is the main thread

        List<Thread> workers = new ArrayList<>();
        for (int i = 0; i < parties; i++) {
            Thread t = new Thread(() -> {
                for (int phase = 0; phase < 3; phase++) {
                    doWork();                       // do this phase's work
                    phaser.arriveAndAwaitAdvance(); // wait for everyone to move to the next phase
                }
                phaser.arriveAndDeregister();       // done, leave the phaser
            });
            workers.add(t);
            t.start();
        }

        // main also participates in each phase (created with 1 party)
        for (int phase = 0; phase < 3; phase++) {
            doWork();
            phaser.arriveAndAwaitAdvance();
        }
        phaser.arriveAndDeregister();

        for (Thread t : workers) t.join();
        System.out.println("All phases complete, last phase: " + phaser.getPhase());
    }

    static void doWork() { /* processing */ }
}
~~~

### Phaser vs CyclicBarrier

| | Phaser | CyclicBarrier |
|---|---|---|
| Party count | Dynamic (register/deregister) | Fixed at creation |
| Behavior on arrival | arrive() does not wait, arriveAndAwaitAdvance() waits | All parties await() and wait |
| Phases | Has a sequence number and onAdvance() hook | No explicit phase number |
| Termination | onAdvance returns true or party count reaches 0 | Resets for the next round |

### When to use
- Multi-stage pipelines where the number of workers changes between stages (for example, stage 1 has 5 workers but stage 2 only needs 2).
- Parties may join late or leave early without stalling the entire group.
- You need a hook to decide termination or continuation when enough parties advance (onAdvance).

### In production
- onAdvance can return true to terminate the phaser (for example, after enough iterations, or when a stop signal is received).
- getPhase() reports the current phase number, useful for tracking progress.
- If all workers use arriveAndAwaitAdvance, one slow worker makes the whole group wait at every phase — reduce the payload per phase or break the work into smaller chunks.

### Common mistakes
- **register() after the phaser has terminated**: throws IllegalStateException. Prevention: check isTerminated() before registering.
- **Using arrive() without waiting but assuming the phase has advanced**: only arriveAndAwaitAdvance() waits. Prevention: choose the method that matches your intent.
- **The phaser never terminates**: onAdvance always returns false and the party count never reaches 0 → threads block forever. Prevention: design a clear termination condition in onAdvance.

### 1-minute interview answer
"Phaser is a multi-phase rendezvous that supports a dynamic party count: register() adds parties, deregister() removes them, arrive() signals arrival without waiting, arriveAndAwaitAdvance() signals arrival and waits until enough parties advance to the next phase, and the onAdvance() hook runs when enough parties advance to decide whether to continue or terminate. Unlike CyclicBarrier, where the party count is fixed and everyone must wait, Phaser is more flexible and fits multi-stage pipelines with a changing number of workers. Watch out that arrive() does not wait, and you must design a termination condition so the phaser does not block forever."

> Senior tip: Phaser is powerful but complex. Most 'wait for N tasks to finish' needs are covered by CountDownLatch, and 'a group waits together at each phase' is covered by CyclicBarrier. Reach for Phaser only when you truly need a dynamic party count across phases or an onAdvance hook to control the lifecycle; added complexity means more room for misunderstandings during code review.`,
    follow: [
      'How does Phaser differ from CyclicBarrier, and when would you choose each?',
      'arrive() vs arriveAndAwaitAdvance(): which one waits and which one does not?',
      'How do you make a phaser terminate instead of blocking forever?'
    ]
  },

  'concurrency-053': {
    q: 'How do {{ScheduledThreadPoolExecutor}} and {{DelayQueue}} work internally: why does scheduleAtFixedRate drift and overlap when one run is slow, and how does it differ from scheduleWithFixedDelay?',
    a: `**Summary:** {{ScheduledThreadPoolExecutor}} runs periodic tasks on top of a {{DelayQueue}}: the queue orders tasks by their next execution time, a worker takes a task when it becomes due, and if the task is periodic it is reinserted into the queue with a new time after it runs. scheduleAtFixedRate computes the next execution time from the **previously scheduled time** (it can drift and overlap when one run is slow: subsequent runs may fire back-to-back to catch up). scheduleWithFixedDelay computes it from **when the previous run finished** (a fixed gap between runs). A single slow run can stall the entire periodic queue.

### Quick intuition
Imagine setting an alarm for a daily routine. scheduleAtFixedRate sets the alarm by the calendar (7:00 AM today, 7:00 AM tomorrow). If today's work takes from 7:00 to 9:00 (slow), tomorrow's alarm is still 7:00, so runs may happen close together to catch up. scheduleWithFixedDelay sets the alarm 24 hours after today's work finishes (9:00 AM today → 9:00 AM tomorrow), so there is always a gap between runs. Both use a "shelf sorted by time" (DelayQueue): whichever job is due gets taken and executed.

### Terminology
- **ScheduledThreadPoolExecutor**: an executor that runs tasks after a delay or periodically, using ScheduledFutureTask.
- **DelayQueue**: a queue ordered by expiration time (delay); take() blocks until the head element becomes due.
- **scheduleAtFixedRate**: repeats at a fixed rate computed from the previous scheduled time.
- **scheduleWithFixedDelay**: repeats with a fixed delay computed from when the previous run finished.
- **ScheduledFutureTask**: a periodic task that holds the next execution time and the repeat interval.
- **Head-of-line blocking**: one slow task stalls later tasks in the same scheduled queue.

### Step-by-step operation

scheduleAtFixedRate(task, initialDelay, period, unit):
1. Create a ScheduledFutureTask with the first execution time = now + initialDelay.
2. Insert it into the DelayQueue ordered by execution time.
3. A worker takes the task when it becomes due and runs it.
4. After it finishes, if it has not been cancelled: compute the next time = lastScheduledTime + period (based on when it was **scheduled**, not when it finished).
5. Reinsert it into the DelayQueue and repeat.

scheduleWithFixedDelay:
1. Similar, but the next time = now (when it finished) + delay.
2. There is always a {{delay}} gap after the previous run completes.

### Code example

~~~java
import java.util.concurrent.*;

public class ScheduledDemo {
    public static void main(String[] args) throws InterruptedException {
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

        // Run immediately, then every 2 seconds (computed from the previous scheduled time)
        scheduler.scheduleAtFixedRate(() -> {
            System.out.println("fixedRate: " + System.currentTimeMillis());
            longWork(); // simulate slow work
        }, 0, 2, TimeUnit.SECONDS);

        Thread.sleep(15000);
        scheduler.shutdownNow();
    }

    static void longWork() {
        try { Thread.sleep(5000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
~~~

If longWork() takes 5 seconds while the period is 2 seconds: run 2 is delayed (the worker is busy), and run 3 may fire soon after run 2 to catch up (based on lastScheduledTime + period), so two runs can execute back-to-back.

### When to use / not use

| | scheduleAtFixedRate | scheduleWithFixedDelay |
|---|---|---|
| Next run computed from | Previous scheduled time | When the previous run finished |
| Gap between runs | Can vary if the task is slow | Always fixed (delay) |
| Use when | You need cron-like timing (10:00, 10:05...) | You need a rest gap between runs |
| Risk | Back-to-back runs if the task is slow | The overall cycle becomes longer |

### In production
- A slow periodic task blocks later runs (fixedRate): reduce the task payload, split the work, or use scheduleWithFixedDelay if you need a gap.
- Separate executors by criticality: the payments job gets its own scheduler so it is not stalled by a reporting job.
- Java 21: you can use virtual threads for I/O-bound periodic tasks, but you still need to cap the number of concurrently running tasks (semaphore) so you do not exhaust downstream resources.
- shutdownNow() interrupts running tasks; a task that does not check interrupts will keep running.

### Common mistakes
- **A slow periodic task stalls later runs (fixedRate)**: a single worker (or too few workers) runs ScheduledFutureTasks sequentially. Prevention: set worker count >= the number of periodic tasks that may run concurrently, or use scheduleWithFixedDelay.
- **Future.cancel(true) does not stop the task if it ignores interrupts**: same as ExecutorService. Prevention: make the task check Thread.interrupted().
- **An exception inside a periodic task (ScheduledThreadPoolExecutor)**: the exception silently stops future executions, it is not thrown outward, and nothing is logged unless you call Future.get(). Prevention: wrap the entire task body in try/catch, and log plus emit metrics.

### 1-minute interview answer
"ScheduledThreadPoolExecutor uses a DelayQueue to order periodic tasks by their next execution time, and a worker takes a task when it becomes due. scheduleAtFixedRate computes the next run from the previous scheduled time (it can drift and overlap when one run is slow), while scheduleWithFixedDelay computes it from when the previous run finished (there is always a gap). A slow task stalls the entire periodic queue, so separate executors by criticality and always wrap tasks in try/catch with logging and metrics. If a task is slow, split it or switch to fixedDelay."

> Senior tip: In production, the important choice is not just fixedRate vs fixedDelay but **capping how many periodic tasks run concurrently** and **always wrapping tasks in try/catch with logging and metrics**. A periodic task that throws an exception silently stops repeating — nobody notices unless you measure 'last successful run time'. Use a dedicated scheduler per work tier so low-priority jobs cannot stall critical ones.`,
    follow: [
      'How do scheduleAtFixedRate and scheduleWithFixedDelay behave differently when one run becomes slow?',
      'A slow periodic task stalls later runs — how do you handle it?',
      'Are exceptions inside a ScheduledThreadPoolExecutor periodic task logged?'
    ]
  },

  'jvm-037': {
    q: 'What is a safepoint, what is time-to-safepoint (TTSP), and why can a long loop (a counted loop) stall the entire application?',
    a: `**Summary:** A safepoint is a moment when the JVM stops all Java threads to perform global work (GC, deoptimization, class redefinition). Time-to-safepoint (TTSP) is the time from when the JVM requests a stop until the last thread actually stops. A long loop with no safepoint poll (or a counted loop where the JIT does not insert a safepoint poll) prevents that thread from stopping in time, so the JVM has to wait, TTSP increases, and the whole application appears frozen while it waits.

### Quick intuition
Imagine the whole company must stop work to do a stock take. The manager shouts "everyone stop", but one employee is running on a treadmill and not looking at the clock, so they do not stop. The entire company has to wait for that employee to notice the signal. The safepoint is the stop signal; TTSP is how long everyone waits for that employee to see it.

### Mechanism
1. The JVM inserts safepoint checks into bytecode (method entry, backward branch, loop back edge) so threads can stop.
2. When a safepoint is needed, the JVM sets a flag; when a thread reaches a safepoint check it inspects the flag and stops.
3. A counted loop (a for loop with a known iteration count) can be optimized by the JIT so that no safepoint poll is inserted inside the loop body → the thread cannot stop until the loop finishes.
4. Why counted loops skip polls: to make the loop run fast, the JIT removes the poll; the trade-off is that TTSP can increase.
5. The JVM flag {{-Xlog:safepoint}} (Java 9+) prints TTSP and the total stop time.

### In production
- Symptoms: unexplained pauses, p99 spikes, and safepoint logs showing large TTSP.
- Measure: {{-Xlog:safepoint*=info:file=safepoint.log}}; inspect TTSP and total time.
- Tuning: avoid long loops with no safepoint poll; split the work; use {{-XX:+UseCountedLoopSafepoints}} (higher cost but lower TTSP); on Java 17+ it is enabled by default in some cases.

### Common mistakes
- A loop processing millions of records with no safepoint poll → large TTSP.
- JIT inlining of a large method removes safepoint polls → unexplained pauses.

### 1-minute spoken answer
"A safepoint is the moment the JVM stops all threads to do global work like GC. TTSP is the time from the stop request until the last thread actually stops. A long loop, especially a counted loop, may have no safepoint poll inside its body, so the thread cannot stop in time, the JVM has to wait, TTSP increases, and the whole app stalls. I measure it with -Xlog:safepoint and enable UseCountedLoopSafepoints when needed."

### Real-world example
A risk-scoring service occasionally saw p99 jump to 1.5 seconds even though the GC log reported GC pauses of only 20 ms. After enabling {{-Xlog:safepoint}}, some lines showed "Reaching safepoint: 1480 ms" — the JVM had to wait almost 1.5 seconds for all threads to stop. Using async-profiler in the mode that records threads slow to reach a safepoint revealed a {{for (int i = 0; i < n; i++)}} loop processing an array of 50 million elements inside an internal batch: the {{int}}-counted loop was optimized by C2 to **remove the safepoint poll** inside the body. Fix: split the batch into chunks of 100,000 elements. Since JDK 10, loop strip mining ({{-XX:+UseCountedLoopSafepoints}}, enabled by default with G1 on modern JDKs) has reduced this problem, but the service was still on JDK 8 so the fix had to be in code; after upgrading to JDK 17, maximum TTSP dropped below 5 ms.

> Senior tip: Large TTSP is often mistaken for a GC pause; safepoint logs make the distinction clear. A method with a 10-million-iteration loop and no poll can push TTSP into the hundreds of milliseconds.`,
    follow: [
      'How do you measure TTSP in production?',
      'When would you enable UseCountedLoopSafepoints?'
    ]
  },

  'jvm-038': {
    q: 'JIT tiered compilation (C1/C2, tiers 0–4): inlining (MaxInlineSize, FreqInlineSize), deoptimization on wrong assumptions (uncommon trap), and warm-up after deploy.',
    a: `**Summary:** The JVM uses tiered compilation to balance fast startup with steady-state performance: code runs from the interpreter (tier 0) to collect a profile, is compiled quickly by C1 (tiers 1–3), and then optimized aggressively by C2 (tier 4) for hot methods. Inlining merges a small method into its caller, reducing call overhead and unlocking deeper optimizations; MaxInlineSize/FreqInlineSize are the thresholds that decide this. When an optimization assumption turns out to be wrong, C2 hits an uncommon trap and safely deoptimizes back to the interpreter. After a deploy, the application needs warm-up.

### Terminology (explained on first use)
- **Bytecode**: the intermediate code in a .class file that the JVM understands; not the CPU's machine code.
- **Interpreter**: executes bytecode step by step; it starts immediately but runs slower than native code (machine code).
- **JIT (Just-In-Time compiler)**: a compiler that runs while the application is running, turning "hot" bytecode into native code.
- **Tiered compilation**: a strategy that uses multiple compilation tiers to achieve both fast startup and deep optimization later.
- **Profile**: runtime statistics collected from real execution (call counts, common branches, actual object types).
- **Hot method / hot path**: code that runs very frequently and is worth optimizing.
- **Inlining**: replacing a method call with the method body at the call site.
- **Deoptimization**: discarding optimized native code and returning to the interpreter when an assumption is no longer true.
- **Uncommon trap**: a "trap" in C2-compiled code for a rare case; when hit, the JVM triggers deoptimization.
- **Warm-up**: the period after a deploy during which the JIT collects profiles and compiles hot paths.

### Why this mechanism exists
Imagine you have just started working in a kitchen: at first you follow the recipe step by step (slow but safe), then you get faster (C1), and for the best-selling dish you optimize every motion (C2). If a rare order comes in, you go back to following the recipe carefully (deoptimize). The JVM does this because: (1) it cannot know in advance which code will be hot; (2) C2 is slow to compile so it cannot be used for everything up front; (3) the best optimizations need real runtime data; (4) when that data changes, the JVM must safely fall back.

### Compilation tiers
| Tier | Executes as | Characteristics |
|---|---|---|
| 0 | Interpreter | Starts immediately, collects profile data |
| 1 | C1 | Fast compilation, minimal optimization (simple methods) |
| 2 | C1 + light profiling | Faster than the interpreter, collects more data |
| 3 | C1 + full profiling | Prepares a good profile for C2 |
| 4 | C2 | Aggressive optimization based on the profile (deep inlining, dead-branch removal, loop optimizations) |

HotSpot enables tiered compilation by default. A method typically progresses from tier 0 up to tier 3, and then to tier 4 once it becomes hot enough.

### Inlining: MaxInlineSize and FreqInlineSize
Inlining matters because it does more than remove call overhead. When the method body sits directly in the caller, the JIT sees a bigger picture and can: eliminate dead branches, fold constants, remove unnecessary null checks, or apply escape analysis.

- **MaxInlineSize**: the bytecode-size threshold for a "regular" method to be considered for inlining.
- **FreqInlineSize**: a larger threshold for very hot call sites. Because they are called often, the benefit of inlining outweighs the cost of larger code.
- These are JVM flags of the form {{-XX:MaxInlineSize=...}} and {{-XX:FreqInlineSize=...}}. Defaults vary by version/architecture. In an interview, explaining the meaning and trade-offs matters more than memorizing the exact numbers.

~~~java
class Tax {
    int rate() { return 10; } // a small method, a good candidate for inlining
}
class PriceService {
    long total(long price, Tax tax) {
        // After inlining, the JIT can "see" that rate() returns 10
        return price + (price * tax.rate() / 100);
    }
}
~~~

### Deoptimization and uncommon trap
C2 optimizes based on assumptions (for example, this site almost always sees an {{ArrayList}}, or this branch rarely happens). When rare input violates an assumption, the native code hits an **uncommon trap**: (1) the JVM pauses the native frame; (2) it reconstructs the state into a form the interpreter understands; (3) execution continues in the interpreter; (4) new profile data is collected and the method may be compiled again. Deoptimization is safe — it is not a bug. But if it happens repeatedly (a **deopt storm**), p99 will rise noticeably.

### Real-world example
Assumptions: an order service with 8 pods, 2 vCPU each, 2 GB heap, ~1,200 req/s steady, p99 = 90 ms. At 09:00 a new version is deployed and p99 rises to 520 ms for the first 7 minutes even though CPU is only ~55%. JFR shows many {{Compilation}} and {{Deoptimization}} events on a hot controller. Root cause: a campaign made a rare branch occur much more often; C2 had compiled against the old profile and kept deoptimizing. Fix: pre-warm after the health check by sending 2,000 synthetic requests to the 5 main endpoints, including the rare case. Result: p99 rose to only ~140 ms for 90 seconds and then returned to 90 ms. The SLA was not affected.

### Common mistakes
- **Methods that are too large**: hard to inline, so the JIT optimizes poorly. Keep hot paths small.
- **Benchmarking before warm-up**: the numbers are misleading. Use JMH or do a manual warm-up.
- **A deopt storm when traffic shifts suddenly**: monitor the JFR event {{jdk.Deoptimization}}.
- **Blindly tweaking JIT flags** (changing MaxInlineSize): it can make things worse. Only change flags when you have data to prove the benefit.

### Sample interview answer
"The JVM uses tiered compilation to balance startup and performance. Code initially runs in the interpreter at tier 0 to collect a profile, then C1 compiles it quickly at tiers 1 through 3, and hot methods move to C2 at tier 4 for aggressive optimization based on real profiles. Inlining is crucial because it merges small methods into the caller, removes call overhead, and lets the JIT see a larger picture; the JIT uses MaxInlineSize for regular methods and FreqInlineSize for hot ones. When C2 relies on a wrong assumption — for example, a rare data type suddenly appears often — the native code hits an uncommon trap and the JVM safely deoptimizes back to the interpreter and recompiles. In production I always account for warm-up after deploy: pre-warm hot paths, monitor JFR for compilation and deoptimization, and keep hot methods small enough to inline."

> Senior tip: After a deploy, watch p99 minute by minute rather than only the average. A p99 that rises and then falls on its own is often warm-up or deoptimization. Avoid changing flags like {{-XX:MaxInlineSize}} or disabling tiered compilation in production unless you have JFR data proving the benefit.`,
    follow: [
      'How do you detect a deoptimization storm in production?',
      'Why is pre-warming more effective than just waiting for real traffic?'
    ]
  },

  'jvm-039': {
    q: 'G1 GC internals: regions, remembered sets, the card table, write barriers, mixed GC, and why pauses are predictable.',
    a: `**Summary:** G1 (Garbage-First) divides the heap into many small regions instead of one contiguous young/old area. To collect a region without scanning the entire heap, G1 uses a remembered set (RSet) — a record of "who points into this region", maintained with the help of the card table and write barriers. G1 prioritizes collecting the regions with the most garbage first (garbage-first) and estimates how long collection will take so it can stay within the pause goal {{-XX:MaxGCPauseMillis}}. As a result, pauses are usually short and relatively predictable.

### Terminology (explained on first use)
- **GC (Garbage Collection)**: the mechanism that automatically reclaims memory from objects that are no longer reachable.
- **Heap**: the memory area the JVM uses to allocate objects.
- **Region**: a fixed-size chunk of the heap (typically 1–32 MB, chosen automatically by the JVM based on heap size); each region can be Eden, Survivor, Old, or Humongous.
- **RSet (Remembered Set)**: a data structure that records references from other regions pointing into this region.
- **Card table**: a table that marks small "cards" (typically 512 bytes) of the heap where references have been written; used to update RSets.
- **Write barrier**: a small piece of code the JVM inserts on every reference write ({{obj.field = other}}) to update the card table/RSet.
- **Mixed GC**: a GC cycle that collects both young regions and some old regions at the same time.
- **Pause time goal**: the target maximum application stop time for each GC pause.
- **Humongous object**: an object larger than 50% of a region's size; G1 places it in dedicated humongous regions.

### Why G1 is designed this way
Classic collectors (like older-generation Parallel/Serial) often had to scan large memory areas, causing long pauses on large heaps. Think of cleaning a building: instead of inspecting the whole building every time, you divide it into rooms (regions) and each room keeps a log of "which other rooms hold keys or items related to this room" (RSet). To clean room A, you only check A's log — you do not search the entire building. G1 does exactly that to keep pauses short and controllable.

### Step-by-step operation
1. **Divide the heap into regions.** Each region plays a role (Eden/Survivor/Old/Humongous), and roles can change between GC cycles.
2. **Young GC (Evacuation Pause).** Collect Eden and Survivor regions: copy live objects to new Survivor or Old regions and free the collected young regions entirely. Pauses are usually short.
3. **Concurrent marking.** When heap usage grows, G1 runs marking concurrently with the application to find old regions with lots of garbage (low live ratio).
4. **Mixed GC.** After marking, G1 collects young regions plus some old regions with the most garbage. This is "garbage-first": reclaim the regions that yield the most free memory first.
5. **Pause prediction.** G1 tracks how long it took to collect regions in the past, estimates, and selects just enough regions so the total time stays within {{MaxGCPauseMillis}} (the default is typically 200 ms).

### RSet, card table, write barrier
To collect region A, G1 must know where live objects in A are referenced from. Scanning the whole heap would break the pause goal. Therefore:
- The **card table** divides the heap into small cards (512 bytes). When the application writes {{x.field = y}}, a **write barrier** marks {{x}}'s card as "dirty".
- At an appropriate time, G1 processes dirty cards to update the **RSet** of the region containing {{y}}: "the region of x has a reference pointing into the region of y".
- Cost: the write barrier runs very frequently (on every reference write), so it adds a small but constant overhead. RSets also consume memory (often a few percent of the heap).

~~~text
Region 1 (Old)  ----ref---->  Region 7 (Old, lots of garbage)
Region 3 (Young) ---ref--->  Region 7
=> RSet of Region 7 records: {Region 1, Region 3}
When mixed GC collects Region 7: it only scans roots + Region 1 + Region 3,
not the entire heap.
~~~

### Real-world example
Assumptions: a Java 17 API service, 8 GB heap, ~3,000 req/s, mostly short-lived objects (JSON/request context). Using G1 with {{-XX:MaxGCPauseMillis=200}}. Steady state: young GCs of 20–40 ms, 8–12 times per minute; occasional mixed GCs of 60–120 ms. One day the team noticed p99 spiking to 1–2 seconds periodically. GC logs showed humongous allocations (a ~5 MB object while regions were 4 MB) and to-space exhausted/evacuation failures. Root cause: an API built a large byte array entirely in memory. Fix: switch to streaming/chunked writes to avoid huge objects, and consider an appropriate {{-XX:G1HeapRegionSize}}. Result: humongous allocations disappeared and p99 pauses stabilized under 150 ms.

### Common mistakes
- **Humongous objects** (objects > 50% of a region): they occupy consecutive humongous regions, are harder to reclaim, and can lead to unfavorable pauses or Full GCs. Avoid creating extremely large objects; use streaming or chunking.
- **MaxGCPauseMillis set too low** (for example 20 ms) for the heap size/workload: G1 cannot meet the goal, may collect less, and memory pressure builds up. Set a realistic goal.
- **Heap too tight**: evacuation failure (no free regions to copy live objects into). Increase the heap or reduce the allocation rate.
- **Ignoring allocation rate**: GC tuning cannot save code that creates garbage too fast. Use JFR/async-profiler to inspect allocations.

### Sample interview answer
"G1 divides the heap into many regions so it can collect parts of the heap instead of scanning everything. Each region has a remembered set that records references pointing into it, and G1 maintains RSets using the card table and a write barrier on every reference write. Young GC collects Eden/Survivor by copying live objects; concurrent marking finds old regions with lots of garbage; mixed GC collects young regions plus some of the old regions with the most garbage — the garbage-first principle. Pauses are predictable because G1 measures past collection times per region and selects just enough regions to stay within MaxGCPauseMillis. In production I read GC logs/JFR, avoid humongous objects, and set a realistic pause goal instead of an overly aggressive one."

> Senior tip: If p99 rises periodically, do not rush to switch to ZGC. First check allocation rate, humongous allocations, and evacuation failures in the GC logs. Many 'slow GC' cases are really the application allocating garbage too quickly or creating objects that are too large.`,
    follow: [
      'What impact do humongous objects have on G1?',
      'When does G1 fail to meet MaxGCPauseMillis?'
    ]
  },

  'jvm-040': {
    q: 'Generational ZGC (Java 21): colored pointers, load barriers, concurrent relocation; when should you choose ZGC vs G1?',
    a: `**Summary:** Generational ZGC (JEP 439 in Java 21, the default since JDK 23) is a low-latency GC: most marking and relocation work runs concurrently with application threads, so pauses are typically very short (often sub-millisecond) even on large heaps. It uses colored pointers (GC state encoded in pointer bits), load barriers (checks when reading a reference), and concurrent relocation. Choose ZGC when you have strict tail-latency/p99 goals or very large heaps; choose G1 when you need good overall throughput, familiar operations, or a workload that is not highly latency-sensitive.

### Terminology (explained on first use)
- **GC pause (STW - Stop-The-World)**: a period when the JVM pauses application threads to do GC work.
- **Latency / p99**: latency is delay; p99 is the delay threshold that 99% of requests are faster than (the slow tail).
- **Throughput**: the total amount of work completed; high GC throughput means less CPU time spent on GC.
- **Concurrent**: running alongside application threads (not always STW).
- **Colored pointer**: a pointer (reference address) that carries GC metadata in a few bits (for example, marked or remapped).
- **Load barrier**: code the JVM inserts when the application reads a reference; used to check/fix the reference if the object has been moved.
- **Relocation**: moving an object to a new memory location to compact free space and avoid fragmentation.
- **Generational**: separating objects by age (young/old). Many young objects die quickly, so collecting the young generation is often efficient.

### Why ZGC was created
With large heaps (tens to hundreds of GB) and strict p99 requirements, traditional collectors can cause long pauses when they must scan or move lots of data. Imagine cleaning a very large warehouse while forcing all workers to stop: the larger the warehouse, the longer the stop. ZGC takes a different approach: clean while workers keep working, pausing only very briefly to synchronize roots. In return, ZGC is more complex and has overhead (barriers, extra metadata).

### Core mechanisms (at the level needed for interviews)
1. **Colored pointers.** Instead of storing only an address, a pointer carries "color" bits with GC-related state (for example, whether the reference is valid under the current mapping or needs fixing). This lets ZGC know when a reference needs handling.
2. **Load barrier.** Whenever the application loads a reference from the heap/stack in contexts where it matters, the barrier checks the metadata. If the object has been relocated, the barrier helps obtain the correct new address (self-healing/remap). Because it runs on reads, it adds a small but distributed cost.
3. **Concurrent marking.** ZGC marks live objects concurrently with the application.
4. **Concurrent relocation (compaction).** ZGC moves live objects to new regions to free memory and reduce fragmentation, still concurrently with the application. The application can read objects that are being or have been moved thanks to the load barrier.
5. **Generational (Java 21).** Generational ZGC collects the young generation frequently (short-lived objects) and the old generation less often. This improves efficiency over earlier non-generational ZGC because it matches the "most objects die young" behavior.

### ZGC vs G1: how to choose
| Criterion | G1 | Generational ZGC |
|---|---|---|
| Primary goal | Balance throughput and latency | Very low latency (short pauses) |
| Typical pause | Tens to hundreds of ms (depends on heap/workload) | Often sub-millisecond to very low (workload-dependent) |
| Large heaps | Good, but pauses may grow | Designed for large heaps with stable pauses |
| CPU/memory overhead | Usually lower and familiar | Barrier/metadata overhead; throughput may be lower for some workloads |
| Operational maturity | Very common, the default in many environments | Measure carefully; Java 21+ generational is the main choice |

Practical rule: **do not choose based on "new/cool"**. Choose based on SLOs (p99/p999 targets), heap size, allocation rate, and real benchmarks/profiling results.

### Real-world example
Assumptions: a pricing/recommendation system, Java 21, 32 GB heap, 2,500 req/s, SLO p99 < 120 ms. With G1, p99 was mostly fine, but when traffic increased and mixed GC occurred, there were pause spikes of 180–350 ms that pushed p99 above the SLO 2–3 times per hour. Allocation rate was ~1.8 GB/s, mostly short-lived objects. The team tried generational ZGC in staging with the same traffic replay: GC pauses dropped sharply (mostly observed below 1 ms), p99 stabilized around 85–95 ms; overall CPU increased by about 6–8% due to barriers/concurrent GC. The trade-off was acceptable because latency SLOs mattered more than CPU cost. Before production rollout, the team validated with JFR and a 48-hour test.

### Common mistakes
- **Expecting higher throughput when switching to ZGC**: ZGC optimizes for latency and may reduce throughput. Always measure.
- **Allocation rate too high**: any GC struggles if the application creates garbage too fast. Optimize allocations first.
- **Poor heap sizing**: a heap that is too tight makes GC run continuously. Size the heap adequately and monitor it.
- **Not measuring on a real workload**: microbenchmarks do not reflect real allocation and pause behavior.

### Sample interview answer
"Generational ZGC (Java 21+, the default since JDK 23) targets very low latency by doing most GC work concurrently with the application. It uses colored pointers to attach state metadata to pointers, load barriers to check references on reads and fix them when objects have been relocated, and concurrent relocation to move objects without long application pauses. The generational mode takes advantage of short-lived objects, making it more efficient. I choose ZGC when p99/p999 SLOs are very strict or the heap is large and G1 pauses are clearly hurting; I choose G1 when I need stable throughput, simpler operations, and current latency already meets requirements. Before switching collectors, I always measure with GC logs/JFR on a real workload to compare pause, throughput, and CPU cost."

> Senior tip: Switching a GC is a trade-off decision. Establish a baseline (p99, throughput, CPU, allocation rate) before and after; if you only look at 'lower pauses' and ignore CPU/infrastructure cost, you may optimize for the wrong goal.`,
    follow: [
      'How do load barriers affect performance?',
      'When is G1 good enough instead of ZGC?'
    ]
  },

  'jvm-041': {
    q: 'The JVM in containers: UseContainerSupport, MaxRAMPercentage, active processor count, OOMKilled vs OutOfMemoryError, and native memory.',
    a: `**Summary:** In a container, the JVM reads container limits (cgroups) thanks to UseContainerSupport (enabled by default since JDK 8u191+). MaxRAMPercentage sets the heap as a percentage of the container's RAM. The active processor count affects default thread-pool sizing. OOMKilled means the kernel killed the process (the cgroup memory limit was exceeded), while OutOfMemoryError means the JVM threw an exception because the heap was full. Native memory (metaspace, thread stacks, code cache) lives outside the Java heap and is tracked with -XX:NativeMemoryTracking + jcmd VM.native_memory.

### Quick intuition
A container is like a room with a low ceiling; the JVM must know how low the ceiling is so it does not build a cabinet that hits it. If it does not know, the JVM builds a tall cabinet → it hits the ceiling (OOMKilled).

### Mechanism
1. **UseContainerSupport**: the JVM reads cgroup memory/CPU limits.
2. **MaxRAMPercentage**: heap = a percentage of the limit (historically the default was ~25%, so in practice it is often set around ~75%).
3. **Active processor count**: the container's CPU count → affects ForkJoinPool/commonPool parallelism and GC threads.
4. **OOMKilled**: the kernel kills the process when the cgroup memory limit is exceeded; there is no Java stack trace.
5. **OutOfMemoryError**: the JVM heap is full and the JVM throws an exception.
6. **Native memory**: metaspace, thread stacks, code cache, direct buffers; tracked with NMT.

### In production
- Symptoms: pods restarting with no application log, OOMKilled in Kubernetes events; or a heap OutOfMemoryError.
- Measure: {{kubectl describe pod}}; {{jcmd <pid> VM.native_memory summary}}.
- Tuning: set MaxRAMPercentage=75, enable {{-XX:NativeMemoryTracking=summary}}, and cap threads/direct buffers.

### Common mistakes
- **Default MaxRAMPercentage too low** → the heap is small and throughput suffers.
- **Thread leaks** → native memory grows → OOMKilled.

### 1-minute spoken answer
"UseContainerSupport makes the JVM read container limits. MaxRAMPercentage sets the heap as a percentage of RAM. OOMKilled is a kernel kill, while OutOfMemoryError is a JVM exception. I track native memory with NMT and jcmd."

> Senior tip: OOMKilled leaves no stack trace; always enable NMT summary in production so you can investigate.`,
    follow: [
      'How do you distinguish OOMKilled from OutOfMemoryError?',
      'How do you read an NMT summary?'
    ]
  }
});
