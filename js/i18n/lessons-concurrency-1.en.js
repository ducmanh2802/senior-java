/*
 * English translation of js/data/lessons-concurrency.js — task T269. Format: js/core/i18n.js (content overlay).
 * ids: lesson-concurrency-001
 */
App.i18n.content({
  'lesson-concurrency-001': {
    title: 'Java Memory Model: visibility, volatile and happens-before',
    goals: [
      'Explain why one thread may **never** see a value that another thread has already written',
      'List the key happens-before rules and use them to prove whether a piece of code is correct or broken',
      'Know what {{volatile}} guarantees (visibility, ordering) and what it does not (the atomicity of {{count++}})',
      'Write a correct thread stop flag and correct double-checked locking',
    ],
    body: `### The problem: written, but another thread never sees it
The code below looks harmless but can run **forever**:

~~~java
class Poller {
    private boolean running = true;          // plain field, NOT volatile
    void loop() { while (running) { /* poll */ } }   // thread A
    void stop() { running = false; }         // called by thread B
}
~~~

There are three layers that can "hide" thread B's write from thread A:

1. **JIT compiler**: seeing that the loop body never writes {{running}}, C2 is allowed to read the field **once** and turn the loop into {{if (running) while (true)}} (hoisting). From that point on thread A never reads memory again.
2. **CPU**: each core has its own store buffer and caches; a write can sit in the store buffer for a while, and reads/writes may be reordered.
3. **Compiler/CPU reordering**: two writes to two different variables can be observed by another thread in the opposite order.

Java does not ask you to understand every CPU. Instead, the **Java Memory Model** (JLS chapter 17) gives you a contract: if two actions stand in a **happens-before** relationship, the result of the first is guaranteed to be visible to the second. Without that relationship every outcome is legal, including "never sees it". That is what we call a **data race**.

### The happens-before rules you must know by heart
| Rule | What it means in practice |
|---|---|
| Program order | Within **one** thread, an earlier action happens-before a later one |
| Monitor lock | {{unlock}} of a monitor happens-before every {{lock}} **of that same** monitor **afterwards** |
| Volatile | A write to a volatile field happens-before every later read of **that same** field |
| Thread start | {{t.start()}} happens-before every action in thread {{t}} |
| Thread join | Every action in {{t}} happens-before {{t.join()}} returns (or {{isAlive()}} returns false) |
| Interrupt | {{t.interrupt()}} happens-before the moment {{t}} detects it was interrupted |
| Final field | A write to a {{final}} field in a constructor is correctly seen by any thread that receives the reference after the constructor finishes (provided {{this}} is not leaked) |
| Transitivity | A hb B and B hb C implies A hb C |

The **transitivity** rule is what makes every synchronization tool work. Example of "piggybacking" on a volatile:

~~~java
int data;                    // plain field
volatile boolean ready;      // "gate" field

// Thread A
data = 42;                   // (1) program order: (1) hb (2)
ready = true;                // (2) volatile write

// Thread B
if (ready) {                 // (3) volatile read sees true: (2) hb (3)
    System.out.println(data);   // (4) chains (1) hb (4): guaranteed to print 42
}
~~~

Note the condition: B must **read that exact volatile field** and **see the value A wrote**. Reading a different volatile field gives you no relationship at all.

### What volatile actually does underneath
- **Visibility**: every read of a volatile must fetch the newest value with synchronized ordering; the JIT may not cache it in a register nor hoist it out of the loop.
- **Ordering**: an ordinary write **before** a volatile write must not be moved after it; an ordinary read **after** a volatile read must not be moved before it. On x86, HotSpot inserts a barrier (usually an instruction with the {{lock}} prefix) after the volatile write; reading a volatile is nearly free.
- **Atomicity for long/double**: the JLS allows a plain {{long}}/{{double}} write to be split into two 32-bit halves; declaring it volatile removes that.

But volatile does **not** turn a compound action into an atomic one. {{count++}} is three steps — read, add, write; if two threads both read 5 and then both write 6, one increment is lost even though {{count}} is volatile.

| Need | The right tool |
|---|---|
| One thread writes a flag, another thread reads it (stop flag, config reload) | {{volatile boolean}} |
| Counting/accumulating from many threads | {{AtomicLong}}, {{LongAdder}} |
| Check-then-act, updating several fields at once | {{synchronized}} / {{Lock}} |
| Publishing an object once it is fully built | a {{final}} field, or a volatile, or via {{ConcurrentHashMap}}/{{BlockingQueue}} |

### Double-checked locking and why it needs volatile
~~~java
private volatile Config cfg;               // missing volatile is a bug
Config get() {
    Config c = cfg;                        // read the volatile once (fast)
    if (c == null) {
        synchronized (this) {
            c = cfg;                       // re-check inside the lock
            if (c == null) cfg = c = new Config();
        }
    }
    return c;
}
~~~
{{new Config()}} consists of: allocation, running the constructor, assigning the reference. Without volatile, the reference assignment can be observed by another thread **before** the fields written in the constructor are observed, so a thread taking the fast path (never entering synchronized) receives a half-built object. Volatile creates a happens-before edge between the write of {{cfg}} and the read of {{cfg}}, so every field written inside the constructor is visible. If all you need is a static singleton, the **holder idiom** ({{static class Holder}} with a static final field) is simpler, because the JVM already guarantees class initialization runs exactly once and is safe.

### Production bugs you will actually meet
- **A non-volatile stop flag** inside a Spring bean or a hand-written Kafka consumer: you call {{shutdown()}} but the thread never stops, the pod gets killed after the grace period and in-flight messages are lost. This bug usually only shows up once the JIT has finished optimizing (i.e. after a long run), so short tests on a dev laptop still pass.
- Using {{volatile int counter}} together with {{counter++}}: your metrics undercount when load is high.
- **Leaking {{this}} in a constructor** (registering a listener, starting a thread inside it): another thread can see the object while the {{final}} fields are not guaranteed to be written yet.
- Believing "x86 has a strong memory model so we are fine": JIT reordering and hoisting still happen on x86, and the same code also runs on ARM (Graviton, Apple Silicon) with a weaker memory model.
- Fixing a data race with {{Thread.sleep}}: sleep creates no happens-before relationship whatsoever.

> To check whether a piece of code has a data race, never rely on "I ran it and it looked right". Point to the **happens-before chain** from the write to the read. If you cannot point to one, the code is wrong even if the tests pass.

### Interview relevance
The classic questions: "How is volatile different from synchronized?", "Is volatile count++ thread-safe?", "Why does DCL need volatile?" and "Is it possible that this thread never stops?". A senior answer always names the exact happens-before rule in play (volatile write/read, unlock/lock, start/join) instead of vaguely saying "volatile reads straight from RAM", because that phrasing is technically wrong: CPU cache coherence still works — the real problem is the JIT, store buffers and reordering.`,
    exercises: [
      {
        title: 'Fix the thread stop flag and publish the result safely',
        prompt: `{{StopFlagWorker}} runs on its own thread, calling {{unitOfWork.run()}} in a loop until another thread calls {{requestStop()}}. When it stops, it publishes the number of iterations it ran so other threads can read it.

Requirements:
- {{run()}}: loop **while no stop has been requested**: each iteration calls {{unitOfWork.run()}} and counts. Check the flag **before** each iteration (a stop requested before the loop starts means zero iterations run). When leaving the loop: write the count into {{iterations}} and then set {{finished}}.
- {{requestStop()}}: request a stop; called from another thread.
- {{isFinished()}}: true after {{run()}} has finished writing the result.
- {{iterations()}}: the number of iterations that ran; another thread reads it right after it sees {{isFinished()}} is true (without joining) and must see the **exact** value.

Constraint verified by reflection: **every field of type {{boolean}} must be {{volatile}}** (or use {{AtomicBoolean}}). The test does not depend on whether the JIT hoists the loop: a thread that does not stop within 2 seconds is a FAIL.`,
        hints: [
          'The {{stopRequested}} flag is written in this thread and read in another thread: declare it {{volatile}}.',
          'Count in a local variable inside {{run()}}, and only write it into the {{iterations}} field after the loop exits.',
          'Order matters: write {{iterations}} **first**, then write {{finished = true}} (volatile). A thread that sees {{finished}} is true will then see {{iterations}} as well, thanks to transitivity.',
        ],
        explain: `Two happens-before edges make the solution correct:
- {{requestStop()}} performs a volatile write of {{stopRequested}} and the loop performs a volatile read every iteration, so a read **after** the write is guaranteed to see true. The JIT may not turn the loop into {{while (true)}}.
- {{iterations = n}} precedes {{finished = true}} in program order; a thread that checks and finds {{isFinished()}} is true takes the volatile write/read edge and chains across to the write of {{iterations}}. This is the "piggyback" technique: a single volatile field acting as the gate for many plain fields.

Common mistakes:
- Getting the order backwards: writing {{finished = true}} before {{iterations}}: the reader may see finished while iterations is still 0.
- Making the flag {{static}}: stopping one worker stops every worker.
- Not fixing the flag but adding {{Thread.sleep}} or {{System.out.println}} into the loop "to be safe": on HotSpot, println contains synchronized internally and so often **happens** to run correctly, but the JMM guarantees nothing; remove the log line and the bug comes back.
- Using {{Thread.interrupt()}} instead of volatile is also a legitimate way to stop, and it additionally wakes a thread that is in {{sleep}}/{{wait}}; a volatile flag cannot do that.`,
      },
      {
        title: 'Lazy initialization with double-checked locking',
        prompt: `Write {{Lazy<T>}}: it holds a {{Supplier<T>}} and only calls it the first time {{get()}} is invoked. Many threads may call {{get()}} concurrently.

Requirements:
- The supplier is called **exactly once** even when 16 threads call {{get()}} at the same time; every thread receives the **same** instance.
- If the supplier throws an exception: {{get()}} rethrows that exception and has **not** cached anything, so the next call tries the supplier again.
- Once initialized, {{get()}} no longer enters the synchronized block (double-checked locking).
- Assume the supplier never returns null.

Constraint verified by reflection: **every non-final field must be {{volatile}}**.`,
        hints: [
          'Declare {{private volatile T value}}.',
          'Check for null twice: once outside the lock (the fast path) and once inside {{synchronized (this)}}, because another thread may already have initialized the value while you were waiting for the lock.',
          'Read the volatile field into a local {{v}} and use {{v}}: that both reduces the number of volatile reads and avoids reading twice and getting two different values.',
        ],
        explain: `The second check is what guarantees the supplier runs only once: all 16 threads see null at check 1, queue up on the lock, the first one initializes, and the 15 that follow enter the lock and find the value already there. Remove the second check and the 16-thread test will see the supplier run many times.

Volatile is required for the **fast path**: that thread never enters synchronized, so there is no unlock/lock edge connecting it to the thread that initialized the value. Without volatile, the JMM allows it to see a non-null reference while the fields inside the object have not been written yet. This bug is rare on x86, so tests usually fail to catch it — which is why this exercise checks it with reflection.

Common mistakes: assigning {{value = supplier.get()}} and then reading {{value}} again to return it (one extra volatile read — not wrong, just redundant); caching the exception as well, which leaves the system permanently "dead" after a single flaky DB blip. In real code a static singleton should use the holder idiom; on Java 17+ consider an existing library (for example Guava's {{Suppliers.memoize}}) instead of writing it yourself.`,
      },
    ],
    check: [
      {
        q: 'Thread A: {{data = 42; ready = true;}} ({{ready}} is volatile, {{data}} is a plain field). Thread B: {{if (ready) print(data);}}. What does B print if it enters the if branch?',
        options: ['Always 42', 'Possibly 0, because data is not volatile', 'Possibly 0 or 42 depending on the CPU', 'Undefined, because there is no synchronized'],
        explain: `The write to {{data}} comes before the volatile write to {{ready}} (program order); B reads {{ready}} as true, so the volatile write/read edge applies; transitivity chains {{data = 42}} happens-before {{print(data)}}. "data is not volatile" is wrong because data is piggybacked through ready. The result does not depend on the CPU: the JMM guarantees it on every platform. synchronized is not required: volatile also creates happens-before.`,
      },
      {
        q: '{{volatile int count}} is incremented with {{count++}} by 4 threads, 1,000 times each. What is the final result?',
        options: ['Always 4000, because volatile guarantees visibility', 'Possibly less than 4000', 'Possibly more than 4000', 'Throws ConcurrentModificationException'],
        explain: `{{count++}} is read, add, write: two threads both read 10 and then both write 11, so one increment is lost. Volatile only guarantees that each read sees the newest value **at the moment of that read**; it does not lock the whole three-step sequence. It cannot be greater than 4000, because each increment only adds 1 to a value that already existed. CME only concerns collections. Use {{AtomicInteger.incrementAndGet()}} or {{LongAdder}}.`,
      },
      {
        q: 'Which happens-before rule guarantees that the main thread sees every write of thread {{t}} after calling {{t.join()}}?',
        options: ['Program order', 'The volatile rule', 'The thread termination rule: every action in t happens-before join() returns', 'None of them; you need an extra volatile'],
        explain: `The JLS defines it: every action in a thread happens-before another thread detecting that it has finished (join returns, or isAlive returns false). Program order only applies within **one** thread. The volatile rule needs a volatile field that is written and read, and there is none here. No extra volatile is needed: join is already enough.`,
      },
    ],
  },
});
