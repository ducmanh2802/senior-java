/*
 * English translation of js/data/quiz-java.js — task T422. Format: js/core/i18n.js (content overlay).
 * ids: qz-jvm-019 qz-jvm-020
 */
App.i18n.content({
  "qz-jvm-019": {
    "q": `When analyzing "Path to GC Roots" in a heap dump, which of the following are **GC roots** in HotSpot? (Choose 3)`,
    "options": [
      `Local variables and parameters in the stack frames of live threads`,
      `Static fields of loaded classes (while the class and its ClassLoader are still alive)`,
      `Every object that overrides finalize()`,
      `Objects referenced only by a WeakReference`,
      `JNI global references created by native code`,
      `Every object that lives in the old generation`
    ],
    "explain": `**Correct answer: variables on thread stacks, static fields, JNI global references.**

### Why it is correct
GC uses **reachability**: it starts from the set of GC roots and follows strong references; any object that cannot be reached is garbage. Roots include:
- Stack frames of live threads (local variables, parameters, temporary values).
- Static fields of loaded classes (the class is kept alive by a live ClassLoader).
- JNI global/local references, monitors that are currently held, internal objects of the JVM.
Because it walks from the roots instead of counting references, reference cycles (A ↔ B) that nobody holds anymore are still collected.

### Why the other options are wrong
- **Objects that override finalize()**: only their collection is delayed (they are put on the finalizer queue); they are not roots.
- **Referenced only by a WeakReference**: that is precisely the definition of "weakly reachable"; they will be cleared in the next GC cycle.
- **Old generation**: a generation is just a memory-organisation strategy; objects in the old gen are still collected when they are unreachable (during a minor GC, the card table/remembered set only helps find old → young references, it does not turn the old gen into a root in the reachability sense).

> Senior tip: real leaks almost always come from a **static field** (cache, registry, listener list) or a **long-lived thread** (ThreadLocal in a thread pool). In MAT, the root type is shown next to the path ("System Class", "Thread", "JNI Global"), which quickly tells you the kind.`
  },
  "qz-jvm-020": {
    "q": `The GC log reports pauses of only about 5 ms, but the application freezes for almost 800 ms. The {{-Xlog:safepoint}} log has the line:
~~~text
Safepoint "G1CollectForAllocation", Time since last: 1803221340 ns, Reaching safepoint: 791204113 ns, Cleanup: 112034 ns, At safepoint: 5120771 ns, Total: 796436918 ns
~~~
Which statement is the most accurate?`,
    "options": [
      `The GC log records the pause time incorrectly; the real GC pause is 800 ms`,
      `JIT deoptimizes all the code, so every thread runs in the interpreter again`,
      `ZGC is running its concurrent phase and saturating the CPU`,
      `Time-to-safepoint is large: the JVM waits ~790 ms for every thread to stop at a safepoint (one thread was running a JIT-compiled stretch of code with no safepoint poll, copying a large array, or was stalled by swap/page fault); GC only starts after that`
    ],
    "explain": `**Correct answer: large time-to-safepoint (TTSP).**

### Why it is correct
To run a stop-the-world GC, the JVM requires **every Java thread to stop at a safepoint**. A running thread must check for itself (safepoint poll) and stop. The log line clearly separates the parts:
- {{Reaching safepoint: 791204113 ns}} ≈ **791 ms** spent waiting for the last thread to reach the safepoint. During that time, all the threads that have already stopped are frozen.
- {{At safepoint: 5120771 ns}} ≈ 5 ms is the time GC actually does its work, which matches the GC log.
Common causes: a loop that has been JIT-optimized so the poll was removed (recent JDKs use loop strip mining to mitigate this), {{System.arraycopy}}/initialization of a very large array, or a thread stalled by swap or page faults because the heap has not been touched yet ({{-XX:+AlwaysPreTouch}} helps).

### Why the other options are wrong
- **The GC log is wrong**: the GC log is correct; it only measures the part where GC runs, not the time spent waiting to reach the safepoint.
- **Deoptimize everything**: deoptimization also needs a safepoint, but the log clearly states the reason is G1CollectForAllocation.
- **ZGC**: the log line belongs to G1, and a concurrent phase does not freeze application threads.

> Senior tip: when a latency spike does not match the GC pause, always enable {{-Xlog:safepoint}} and compare "Total" with "At safepoint". JFR has the {{jdk.SafepointBegin}} event, and async-profiler has a ttsp mode that points to the code that is blocking the safepoint.`
  }
});
