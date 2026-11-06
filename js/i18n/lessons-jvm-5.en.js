/*
 * English translation of js/data/lessons-jvm.js — task T805. Format: js/core/i18n.js (content overlay).
 * ids: lesson-jvm-006
 */
App.i18n.content({
  'lesson-jvm-006': {
    title: 'Reading a JDK 17 GC log: what one line says, how to compute throughput and p99 pause, short heap or leak',
    goals: [
      'Read a single unified-logging GC line for G1 on JDK 17 and name every field correctly',
      'Tell Pause Young (Normal), Concurrent Start, Mixed and Pause Full apart; why Full GC is expensive on JDK 17',
      'Compute throughput % and p99 pause from the log with code, not by eyeballing it',
      'Decide between raising the heap and going to fix a leak from just two numbers: the live set after Full GC and the pause cadence',
    ],
    body: `### Turning GC logging on in JDK 17: unified logging
JDK 9 merged every log source of the JVM into one single mechanism called **unified logging**, controlled with the {{-Xlog}} flag. Before that, each log source had its own flag ({{-XX:+PrintGCDetails}}, {{-verbose:gc}}), so the formats were inconsistent and very hard to parse. The three forms people actually use:

~~~bash
# print to the console
java -Xlog:gc -jar app.jar

# every tag starting with gc, write to a file and rotate it automatically (5 files, 20 MB each)
java -Xlog:gc*:file=/var/log/jvm/gc.log:time,uptime,level,tags:filecount=5,filesize=20m -jar app.jar
~~~

{{gc*}} means "every tag that starts with gc" ({{gc}}, {{gc+heap}}, {{gc+phases}}, {{gc+age}}...); the {{time,uptime,level,tags}} part is the list of **decorations** — the pieces of information printed at the head of each line. In a container people write to a file and mount a volume for it, or leave the output on {{stdout}} so that {{kubectl logs}} can pick it up.

### The anatomy of one G1 log line
~~~text
[2026-11-06T09:12:03.441+0700][12.345s][info][gc] GC(7) Pause Young (Normal) (G1 Evacuation Pause) 512M->128M(1024M) 8.123ms
~~~

| Field | What it reads as |
|---|---|
| {{12.345s}} | uptime: 12.345 seconds since the JVM started |
| {{info}} | the log level of this line |
| {{[gc]}} | the log source tag (only printed when the {{tags}} decoration is enabled) |
| {{GC(7)}} | the sequence number of the collection cycle; the lines that open and close one cycle carry the same number |
| {{Pause Young (Normal)}} | the **kind** of pause |
| {{(G1 Evacuation Pause)}} | the **reason** G1 chose to collect at exactly this moment |
| {{512M->128M(1024M)}} | the heap was using 512 MiB, 128 MiB left after GC, total capacity 1024 MiB |
| {{8.123ms}} | the stop-the-world duration of this pause |

**stop-the-world (STW)** means the JVM halts **every** application thread at a **safepoint** (a safe spot where the JVM is allowed to scan that thread's stack, so all threads must be sitting at such a position), performs the collection work, and only then lets the threads run again. It is like a workshop stopping its machines to clean the warehouse: while the cleaning is going on, not a single product is made. The {{ms}} number at the end of the line is exactly how long customers were kept waiting, and it is the only figure in the whole log that a user can actually feel.

### The four pause labels of G1 and one label that is not a pause
- {{Pause Young (Normal)}}: clears Eden and Survivor only. Objects that died young disappear, surviving objects are copied into Survivor. Usually a few ms.
- {{Pause Young (Concurrent Start)}}: still a young pause, but at the same time it **kicks off** a marking cycle for the old generation. The cycle starts once occupancy of the old generation passes {{-XX:InitiatingHeapOccupancyPercent}} (IHOP, 45% of the heap by default).
- {{Concurrent Mark Cycle}}: the summary line of the marking phase that runs in parallel with the application — **there is no pause here**, it must not be counted into stop-the-world time. The marking cycle does come with the short pauses {{Pause Remark}} and {{Pause Cleanup}} (stop-the-world), but the {{Concurrent Mark Cycle}} summary line is not itself a pause.
- {{Pause Young (Mixed)}}: a young pause that additionally clears some old regions whose marking has finished. This is where the "after GC" number starts to reflect the memory that is genuinely still alive.
- {{Pause Full}}: G1 has run out of options, usually because there was no room left to copy live objects into ({{To-space exhausted}}) or because some code called {{System.gc()}}. Full GC works mark-compact and stops the entire application; since JDK 10 it runs in parallel (JEP 307), but on a large heap (several GB) the pause can still stretch to a few seconds — "a few seconds on an 8 GB heap" is entirely possible, not a printing bug.

The second parenthesised label is the cause. Frequent ones: {{G1 Evacuation Pause}} (normal), {{G1 Humongous Allocation}} (object too big), {{Metadata GC Threshold}} (metaspace full), {{G1 Periodic Collection}} (scheduled clean-up), {{System.gc()}} (someone called it by hand).

> Terms a newcomer must own: **evacuation** = copying live objects into a new region instead of cleaning where they stand; **promotion** = moving long-lived objects from young up to old; **live set** = the total size of objects still alive after a clean-up; **allocation rate** = how many MB the application allocates per second; **humongous** = an object larger than 50% of a region, so G1 has to allocate it separately; **region** = a slice of the heap that G1 manages (typically 1-32 MB).

### Throughput and p99: two numbers you compute, never guess
- **throughput %** = the share of the window's time in which the application actually got to run: throughput = (1 − total pause / window time) × 100.
- **p99 pause** = 99% of pauses are faster than or equal to this number. p50 (the median) and p99 differ only in which element you select, not in units.

Example: in 100 seconds there are 6 pauses totalling 130 ms, so throughput = (100000 - 130) / 100000 * 100 = **99.87%**. Saying **the average pause is 21.7 ms** sounds perfectly fine, but that is a lie: five pauses of only 4-8 ms, and one Full GC of 100 ms drags the whole average up. The real information is "p99 = 100 ms and there was one Full GC".

The **nearest-rank** way to take a percentile (no interpolation, easy to implement and easy to explain in an interview): sort the n values ascending, k = ceil(p / 100 * n), the answer is the k-th element counting from 1. p99 of 6 values: k = ceil(0.99 * 6) = 6 → exactly the largest value.

~~~java
// only a line carrying a Pause label plus an ms number is a pause event
Double ms = pauseMs(line);                 // cut the numeric run sitting right before the "ms" at the end of the line
if (ms != null) pauses.add(Math.round(ms * 1000.0));   // work in microseconds: integers, no rounding error
Collections.sort(pauses);
int k = (int) Math.ceil(p / 100.0 * pauses.size());
double p99 = pauses.get(k - 1) / 1000.0;
~~~

### From numbers to decisions
| What you observe in the log | What it reads as | What to do |
|---|---|---|
| {{Pause Young}} lines are sparse, p99 under 50 ms, the live set after Full GC is stable | a healthy system | change nothing |
| Young GC back to back, each run reclaiming almost the whole heap | high allocation rate | inspect the allocating code (String, JSON, byte[] per request), look at the JFR event {{jdk.ObjectAllocationSample}} |
| {{Pause Young (Mixed)}} lines growing over time, the live set after Mixed stays flat | long-lived objects are piling up in old | raise the heap if that is real data, investigate if it keeps climbing |
| {{Pause Full}} repeating every few minutes, {{100M->95M(1024M)}} | the heap is far too tight for the live set | raise {{-Xmx}} and measure again |
| {{Pause Full}} {{700M->650M(1024M)}}, the next Full pass {{760M->710M(1024M)}} | leak: live objects climbing in steps | heap dump + MAT to find the retained set, do not tune the GC |
| {{To-space exhausted}}, {{Concurrent Mark Abort To-space Exhausted}} | marking cannot keep up with the allocation rate | lower IHOP, raise the heap, reduce humongous objects |

~~~text
Live set measured after each Pause Full (MiB), heap fixed at 1024 MiB

  710 |                                                    *
  650 |                          *              *
  520 |              *
  420 |      *
      +-------------------------------------------------------------
          Full GC 1   Full GC 2   Full GC 3   Full GC 4   ->  time
      (a) a step up after every full sweep = LEAK, growing the heap only postpones the OOM
~~~

> Senior tip: only take the live set **as measured by Pause Full**. Young GC does not scan the old generation, so in the {{512M->128M(1024M)}} of a Young pause, the 128 MiB still includes an old generation that has not been examined in any way. The pragmatic rule for a service: once the live set passes roughly 60% of {{-Xmx}}, no collector configuration will rescue you — that is a capacity problem or a code problem, not a GC problem.

### Three mistakes people often make when reading the log
- Counting the {{Concurrent Mark Cycle}} line (or {{Pause Remark}}, {{Pause Cleanup}}) into the total pause → throughput drops by magic.
- Comparing logs between two JDK builds or two heap sizes: the same application prints more detail on JDK 21 and runs Full GC in parallel, so the numbers look completely different; "it used to be faster" is a comparison against the wrong subject.
- Treating {{-XX:MaxGCPauseMillis=200}} (the default) as a contract: it is a **desire**. G1 resizes the young generation to try to reach it, but when the live set is large it still breaks the promise — and the price paid is a smaller young generation, GC running more often, and promotion happening earlier.

### Interview relevance
The questions that come up all the time: "Which flags do you use to get a GC log?", "What is throughput?", "Why does p99 matter more than the average?", "Full GC showed up — what does that mean and how do you handle it?". Answering with a four-step frame keeps you short and complete: (1) turn on {{-Xlog:gc*:file=...}}, (2) read each field of one line correctly, (3) compute throughput and p99, (4) conclude from the live set after Full GC instead of from a feeling. The exercise below makes you write the parser yourself, so you will never again confuse a pause line with a concurrent line.`,
    exercises: [
      {
        title: 'Write your own GC log parser: pause count per type, total pause, p99 and throughput',
        prompt: `Write the class {{GcLogStats}} that reads a JDK 17 G1 log (unified logging format) and computes the aggregate metrics. Use strings only ({{contains}}, {{indexOf}}, {{substring}}), no regex needed.

**What counts as a pause event.** A line counts when it contains **exactly one** of the four labels below **and** has a number sitting right before the {{ms}} at the end of the line:

~~~text
Pause Young (Normal)
Pause Young (Concurrent Start)
Pause Young (Mixed)
Pause Full
~~~

Every other line is ignored, including {{Using G1}}, {{GC(2) Concurrent Mark Cycle}}, {{Pause Remark}}, {{Pause Cleanup}} (those two labels belong to the marking phase, outside the scope of this exercise). A heap part such as {{512M->128M(1024M)}} contains no {{ms}}, so it cannot cause confusion. A line may end with {{\\r}} (a Windows log) — ignore the {{\\r}}.

Sample log and the expected result:

~~~text
[12.000s][info][gc] GC(0) Pause Young (Normal) (G1 Evacuation Pause) 64M->16M(256M) 4.000ms
[14.000s][info][gc] GC(2) Pause Young (Concurrent Start) (G1 Humongous Allocation) 96M->40M(256M) 6.000ms
[14.500s][info][gc] GC(2) Concurrent Mark Cycle
[15.000s][info][gc] GC(3) Pause Young (Mixed) (G1 Evacuation Pause) 120M->48M(256M) 7.000ms
[17.000s][info][gc] GC(5) Pause Full (G1 Compaction Pause) 240M->60M(256M) 100.000ms
~~~

With the full sample of 6 pauses (4.000, 5.000, 6.000, 7.000, 8.000, 100.000 ms): total pause 130.0 ms, p50 = 6.0, p99 = 100.0, throughput over a 100 second window = 99.87%.

**The four functions to write.**
1. {{pausesByType(log)}} → a {{Map<String, Integer>}} with **exactly four keys** {{young-normal}}, {{young-concurrent-start}}, {{young-mixed}}, {{full}} in that exact order; a type that never appears is still present with the value 0.
2. {{totalPauseMs(log)}} → the total pause time, **rounded to 3 decimal places**; no pause at all → {{0.0}}.
3. {{pausePercentileMs(log, p)}} → nearest-rank: sort the n values ascending, k = ceil(p / 100 * n) (clamp k into {{1..n}}), take the k-th element counting from 1. {{p}} must lie in the interval (0, 100], anything outside → throw {{IllegalArgumentException}}. No pause at all → {{0.0}}.
4. {{throughputPct(log, windowSeconds)}} → (windowSeconds * 1000 - total pause ms) / (windowSeconds * 1000) * 100, **rounded down** to 2 decimal places and never negative (if the pause exceeds the window, return {{0.0}}). {{windowSeconds <= 0}} → throw {{IllegalArgumentException}}.`,
        hints: [
          'Split lines with {{split("\\n")}} and then drop the trailing {{\\r}}. A line is a pause event when it contains one of the four labels and has the numeric part right before the {{ms}} at the end of the line; with no {{ms}} the whole line is skipped (even if it carries a pause label).',
          'Do not add real numbers up and then compare. Convert every pause to an **integer microsecond** with {{Math.round(ms * 1000.0)}}, sum those {{long}}s, and only divide by {{1000.0}} in the final step.',
          'Round down to 2 decimal places without using {{Math.floor}} on a double: compute {{(windowMicros - pauseMicros) * 10000L / windowMicros}} and then divide by {{100.0}}. {{95.67}} in binary can be {{95.669999...}}, so {{Math.floor(95.67 * 100)}} yields 9566.',
          'Keep the key order of the map with {{LinkedHashMap}}; initialise all four keys to 0 before you start counting, so a type that never appears is still present.',
        ],
        explain: `The four numbers in this exercise are precisely the four numbers people ask each other for during an incident review, and they answer four different questions: **how often each pause type happens** (is the system running young GC, or has it had to touch old/Full), **total pause** and **p99** (how long customers were kept waiting), **throughput** (what share of the time was actual work).

The most error-prone point is not the parsing but **the rounding arithmetic**. {{p99}} under nearest-rank is an element that really exists in the sample, not an interpolated value, so with 6 pauses p95, p99 and p100 all give back 100 ms — that is why a long-tailed distribution vanishes when you only look at the average. Likewise, total pause and throughput should be computed on **integer microseconds**: {{4.000 + 5.000}} is still exact as a double, but with {{1.234}} and thousands of lines the accumulated error is enough to turn {{99.87}} into {{99.86999...}} and then {{Math.floor}} produces {{99.86}}.

The logic error people make when parsing: using {{indexOf("ms")}} instead of {{lastIndexOf("ms")}} — some lines have {{ms}} inside a label or inside the heap part and get cut at the wrong place; or counting {{Pause Remark}}/{{Concurrent Mark Cycle}} as well because you saw the word "Pause". Conversely, do not call {{Double.parseDouble}} on the whole tail of the line: the tail includes the "ms" text too.

In an interview, once you have the four numbers the next question is always "and then what do you do?". Answer from the live set: young pauses tell you the **cadence** of allocation, only Full pauses and mixed pauses tell you the **amount of memory that is truly alive**. Raise {{-Xmx}} when the live set is flat but close to capacity; go hunting for the retained set when the live set creeps up after every full sweep.`,
      },
    ],
    check: [
      {
        q: 'On JDK 17, which log line shows that G1 has just cleared **the entire old generation**?',
        options: [
          '{{Pause Young (Mixed)}}',
          '{{Pause Young (Normal)}}',
          '{{GC(7) Concurrent Mark Cycle}}',
          '{{Using G1}}',
        ],
        explain: `Mixed = a young pause plus some old regions whose marking was finished, so the "after GC" number of that line starts to reflect the memory that is truly alive. Normal clears only Eden/Survivor. Concurrent Mark Cycle is the summary line of the phase that runs in parallel, it does not stop the world. Using G1 is printed once at startup, and it is not a pause either.`,
      },
      {
        q: 'The live set measured after each Pause Full on a heap fixed at 1024 MiB is 420, 470, 520, 590 MiB. Which conclusion is **most correct**?',
        options: [
          'Not enough heap; raise {{-Xmx}} to 2 GB and the Full GCs stop',
          'A leak: the live set climbs in steps even though each pass just emptied everything, so find the retained set before tuning',
          'The young generation is too small; raise {{-Xmn}}',
          'Perfectly normal, just give GC more CPU',
        ],
        explain: `Full GC is the only pass in which the old generation gets cleaned completely, so the number after it is the real amount of live objects. It creeping up after every clean sweep means more and more objects never die — that is the definition of a leak. Raising the heap only postpones the moment of OOM and makes every Full GC longer (Full GC stops the whole application; the bigger the heap, the longer the pause). With G1, hard-pinning {{-Xmn}} also switches off the automatic young resizing driven by {{-XX:MaxGCPauseMillis}}, so it is usually the wrong choice.`,
      },
      {
        q: 'Throughput of a service: 6 pauses totalling 130 ms inside a 3 second window. Computing {{130 / 3000 x 100 = 4.33}}% and reporting "throughput 4.33%" — what is wrong there?',
        options: [
          'Wrong units: convert ms into seconds before dividing',
          'Wrong formula: throughput is the share of time **spent running**, the correct answer is 95.66% (rounded down to 2 decimals)',
          'Wrong because pauses must be doubled: G1 also counts the concurrent phase',
          'Nothing wrong; that is exactly the throughput',
        ],
        explain: `Throughput = {{(1 - total pause / window) x 100}} = {{(3000 - 130) / 3000 x 100 = 95.666...}}%, and the convention is to round down to 2 decimals so you never over-promise → 95.66%. The 4.33% figure is the share of time spent in GC (GC overhead), a different metric, and reporting it as throughput makes the listener think the system is badly broken.`,
      },
    ],
  },
});
