/*
 * English translation of js/data/lessons-jvm.js — task T1024. Format: js/core/i18n.js (content overlay).
 * ids: lesson-jvm-008
 */
App.i18n.content({
  'lesson-jvm-008': {
    title: 'Generational GC: Eden, Survivor, object age, and premature promotion',
    goals: [
      'Describe young generation consisting of Eden and two Survivor spaces, and how objects move between them',
      'Explain how minor GC copies surviving objects to Survivor and increments their age',
      'Understand promotion to old generation when age exceeds MaxTenuringThreshold or Survivor is full',
      'Identify premature promotion and its impact on full GC',
    ],
    body: `**Summary:** Young generation in the heap is divided into Eden and two Survivor spaces. New objects are born in Eden; when Eden fills up, a minor GC copies surviving objects to Survivor and increments their "age" (number of times survived). Objects that exceed the age threshold — or when Survivor is full — are promoted to old generation. The copying mechanism makes garbage collection fast and prevents fragmentation, but if Survivor is too small it causes premature promotion, filling old generation quickly and leading to full GC / long pauses.

### 1) Concepts to understand first (explained from scratch)

- **JVM (Java Virtual Machine)**: the virtual machine that runs Java programs; it manages memory on behalf of the programmer.
- **Heap**: the region of RAM that the JVM uses to store **objects** (data entities created with {{new}}, e.g. {{new Order()}}).
- **GC / Garbage Collector**: the JVM's automatic mechanism that finds and frees the memory of objects no longer in use, so you do not have to {{free}} manually like in C/C++.
- **Root**: the starting point GC uses to decide "still in use or not" — e.g. local variables on the stack of a running thread, {{static}} fields, JNI references. An object is **reachable** if following a chain of references from a root still reaches it; an unreachable object is "garbage".
- **Pause**: the period during which the application is stopped while GC does its work (depending on the collector it may be short or near-zero, but traditional minor GC usually has a short pause).
- **Fragmentation**: free memory is split into many small scattered pieces, making it hard to allocate large contiguous objects.

### 2) Why is the heap divided into generations (generational)?

Practical observation (called the **weak generational hypothesis**): **most objects "die young"**. For example, in an HTTP request you create temporary {{DTO}}, {{String}}, {{List}} objects; when the request ends nothing holds references to them anymore -> they become garbage right away.

If GC scanned the whole heap every time, it would be very expensive, even though most newly created objects are already dead. That is why the JVM divides the heap into:

- **Young generation**: where new objects are born; GC scans this region frequently.
- **Old generation / Tenured**: holds objects that have survived many GCs (usually caches, sessions, long-lived structures).

Scanning young generation alone is fast because the region is small and the death rate is high.

### 3) Structure inside Young generation: Eden + 2 Survivors

Young generation is not one contiguous block but consists of 3 regions:

~~~text
Young Generation
+---------------------------+-----------+-----------+
|           Eden            |    S0     |    S1     |
|   (where new objects are born) | (from/to) | (from/to) |
+---------------------------+-----------+-----------+
                               ^           ^
                               |           |
        at any one time only one region holds live objects
        the other is empty
~~~

- **Eden**: "the nursery" — every new object ({{new}}) is allocated here. Allocation in Eden is usually **bump-the-pointer** (moving the allocation pointer forward by a chunk): extremely fast. To avoid contention between threads, the JVM gives each thread a small private chunk called a **TLAB (Thread-Local Allocation Buffer)** — a per-thread allocation buffer.
- **Survivor S0 and S1** (also called from-space / to-space): two regions of equal size. At any time only **one** Survivor holds surviving objects; the other is kept empty for the next GC.

### 4) How minor GC works (copy, not sweep)

**Minor GC** (also called young GC) occurs when **Eden is full**. It uses a **copying collector** strategy instead of "sweep" (scan and delete in place):

1. The JVM determines which objects are **alive** (reachable) in Eden and the active Survivor by following references from roots. Note: an object in old generation may point into young generation; the JVM uses auxiliary structures such as a **card table** (marks old-generation regions that have stored references into young) or a **remembered set** (G1 uses per-region) so it does not have to scan the whole old generation when running a minor GC.
2. Copy live objects to the **empty Survivor** (to-space). Every object has an **age** (stored in the object header) — incremented by 1 each time it survives a minor GC.
3. After copying, **all of Eden and the old Survivor** are considered empty in an instant. No need to walk each dead object -> reclamation is very fast.

Example flow (simplified):

~~~text
Before minor GC:
Eden: [A][B][C][D][E] (full)   S0(active): [F]   S1: (empty)
Roots only reach A, C, F

After minor GC:
Eden: (empty)                  S0: (empty)       S1(active): [A(age1)][C(age1)][F(age2)]
B, D, E disappear (not copied). F ages because it survived one more time.
~~~

### 5) Promotion to Old generation: when?

Objects do not stay young forever. They are **promoted** (moved) to old generation when:

- **Age exceeds threshold** {{-XX:MaxTenuringThreshold}}: on HotSpot the maximum value is 15 (because age is stored in 4 bits of the object header). Default is usually 15. "Exceeds threshold" means after incrementing age, {{age > threshold}} -> promote. (The JVM also has **adaptive tenuring** that automatically adjusts the actual threshold based on the amount of live objects in Survivor.)
- **Object too large**: some configurations or collectors allow allocating directly into old generation to avoid expensive copying (e.g. pretenuring; with G1, very large objects become "humongous regions").
- **Survivor does not have enough space** (see section 6): promotes early.

### 6) Premature promotion — common risk in production

**Premature promotion** occurs when **Survivor does not have enough space** to hold all objects that survived a minor GC. The JVM is forced to push some objects into old generation even though they might die in the next GC.

Consequence: old generation fills up faster -> triggers **major GC / old GC / full GC** (depending on the collector; simply put, GC must process the old region, which usually takes longer and causes longer pauses than minor GC) sooner -> latency spikes suddenly.

Common causes:

- Young generation or Survivor too small (mis-tuned {{-XX:NewRatio}}, {{-XX:SurvivorRatio}}, {{-Xmn}}).
- **Allocation rate** (the object allocation rate, e.g. MB per second) spikes suddenly due to traffic or code that creates many temporary objects.
- A batch of requests creates many objects that live temporarily longer than one minor GC cycle.

G1 GC has an **adaptive** mechanism that automatically adjusts the young generation size according to the pause target ({{-XX:MaxGCPauseMillis}}), but it still needs monitoring.

### 7) Why copying is good (and the trade-off)

- **Fast with lots of garbage**: it only touches live objects; dead objects cost nothing to process. After GC, Eden is empty -> reallocation via bump-pointer, very fast.
- **Fights fragmentation**: live objects are packed contiguously into Survivor / to-space.
- **Trade-off**: costs extra memory for the target region (you need an empty Survivor); every reference pointing to a moved object must be updated (forwarding).

### 8) Common mistakes / signs in production

- Old generation increases evenly after each full GC, while the **live set** (the set of objects actually still alive) does not decrease -> suspect a **memory leak** (holding unnecessary references), not just "not enough heap".
- High allocation rate but minor GC pause still low, old generation stable -> young generation is doing its job well.
- Long pauses occur even though the heap still has free space -> check premature promotion, Survivor size, or full GC caused by metaspace / explicit GC (depending on configuration).

> Senior tip: Before increasing {{-Xmx}}, check the GC log ({{-Xlog:gc*}} on JDK 9+) and the allocation rate. If old generation increases evenly across full GCs, take a heap dump and find the **retained set** (the set of objects being held) via the dominator tree; "adding RAM" only postpones the crash. If you suspect premature promotion, check the Survivor size and the per-request object creation pattern.

### Interview connection

Interviewers often ask: "How is minor GC different from major/full GC?", "When is an object promoted?", "What is premature promotion and how do you handle it?". Answering with the chain **Eden full -> copy live objects -> increment age -> promote when exceeding the threshold / Survivor full**, plus one allocation-rate example, is more convincing than listing collector names. The exercise below asks you to simulate MiniHeap with {{allocate/minorGc}} on a reference graph to understand reachability, age, and promotion correctly.`,
    exercises: [
      {
        title: 'MiniHeap simulating generational GC',
        prompt: `Complete {{MiniHeap}} simulating young generation with Eden and two Survivors.

Requirements:

- {{allocate(id)}}: creates a new object in Eden; a duplicate id throws {{IllegalArgumentException}}.
- {{addRef(from, to)}}: adds a reference; if an id does not exist, throws {{IllegalArgumentException}}.
- {{minorGc(roots, tenuringThreshold)}}: copies live objects from Eden and the current Survivor to the remaining Survivor, increments age; objects whose age exceeds tenuringThreshold are promoted to old; returns the number of objects promoted.
- {{edenSize()}} / {{survivorSize()}} / {{oldSize()}}: number of objects in each region.
- {{isInOld(id)}}: true if the object has been promoted.

Minor GC must handle cycles and shared graphs correctly, just like GC reachability.`,
        hints: [
          'Minor GC is reachability from roots: DFS/BFS on refs, skip objects already in old.',
          'Live objects are copied to the remaining Survivor: increment age; if age >= threshold then promote (inOld = true).',
          'After GC: Eden and the old Survivor are cleared; swap active and inactive Survivor.',
        ],
        explain: `Minor GC simulates the copying collector mechanism: it only follows edges from roots to find live objects, then copies them to the new Survivor. Dead objects are not copied, so they vanish instantly. Age increases each time an object survives; exceeding the threshold promotes it to old.

Common mistakes:

- Not clearing the old Survivor: dead objects remain in the list, and size reports the wrong value.
- Swapping active and inactive Survivor in the wrong order: survivorSize returns the empty region.
- Forgetting to skip objects already in old: they get promoted multiple times.
- Not handling cycles: DFS must mark visited nodes (using the live Set) to avoid infinite loops.

In a real JVM, minor GC also considers references from old generation into young generation (card table / remembered set), and very large objects may be allocated directly in old.`,
      },
    ],
    check: [
      {
        q: 'What does minor GC (young GC) mainly do in a generational collector?',
        options: [
          'Scan (sweep) the whole heap then compact every object',
          'Copy live objects from Eden / Survivor to the remaining Survivor, while incrementing age',
          'Reclaim objects in old generation',
          'Delete class metadata in metaspace',
        ],
        explain: `**Correct (B):** Minor GC only processes the **young generation** (Eden + Survivor). It finds objects that are still **reachable** (reachable from roots), then **copies** them to the empty Survivor, incrementing **age** (age — number of survivals). After that Eden and the old Survivor are considered empty, so garbage is reclaimed very quickly without walking each dead object.

**Wrong (A):** "Sweep the entire heap + compact" describes full / major GC (depending on the collector), covering the whole heap / old generation, usually taking longer and causing longer pauses than minor GC.
**Wrong (C):** Old generation is not the main target of minor GC (minor GC only needs the card table / remembered set to know old -> young references).
**Wrong (D):** Metaspace (stores class metadata) has its own reclamation mechanism; it is not the job of young-generation minor GC.`,
      },
      {
        q: 'When does premature promotion occur?',
        options: [
          'Survivor does not have enough space to hold surviving objects, so part of them is pushed into old generation early',
          'A newly created object has age equal to 0',
          'Eden is configured too large',
          'Full GC runs too frequently',
        ],
        explain: `**Correct (A):** After minor GC, every live object must be copied to the empty Survivor. If the amount of live objects exceeds Survivor capacity, the JVM has no space to copy -> it is forced to **promote early** part of them to old generation, even though those objects might die in the next minor GC. Consequence: old generation fills up fast -> full / major GC sooner -> longer pause.

**Wrong (B):** A newborn object in Eden having age 0 is normal; this is not premature promotion.
**Wrong (C):** A large Eden does not directly cause premature promotion; the issue lies in Survivor / young sizing and the amount of live objects.
**Wrong (D):** Frequent full GC is usually the **consequence** (old generation full, sometimes due to premature promotion / memory leak), not the cause of premature promotion.`,
      },
      {
        q: 'When is an object usually promoted to old generation (according to the age mechanism)?',
        options: [
          'Immediately when created with the new keyword',
          'When its age exceeds MaxTenuringThreshold after surviving multiple minor GCs',
          'When it is assigned to a static variable',
          'When minor GC cannot run due to lack of memory',
        ],
        explain: `**Correct (B):** Each time an object survives a minor GC, **age** increases by 1. When {{age > -XX:MaxTenuringThreshold}} (maximum value 15 on HotSpot because age is stored in 4 bits of the object header; default is usually 15) the object is promoted to old. This is the "live long enough, move to the old generation" mechanism.

**Wrong (A):** {{new}} allocates in Eden (young generation), not directly in old (except special cases such as very large / humongous objects depending on the collector).
**Wrong (C):** A {{static}} variable is a **root** that holds a reference, making the object likely to live long, but assigning to static itself does not auto-promote; promotion still follows the GC / age mechanism or the allocation policy.
**Wrong (D):** "Minor GC cannot run" is not a promotion rule; if GC cannot reclaim enough memory, the JVM throws {{OutOfMemoryError}} (depending on the situation).`,
      },
    ],
  },
});
