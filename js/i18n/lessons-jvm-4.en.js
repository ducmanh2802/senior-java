/*
 * English translation of js/data/lessons-jvm.js — task T694. Format: js/core/i18n.js (content overlay).
 * ids: lesson-jvm-005
 */
App.i18n.content({
  'lesson-jvm-005': {
    title: 'JVM memory in a container: why the pod is OOMKilled when the heap only uses 60%',
    goals: [
      'Name the regions that add up to the real memory of a Java process: heap, metaspace, thread stacks, direct buffers, code cache, GC data structures, malloc',
      'Explain how the JVM reads the cgroup memory limit and how {{-XX:MaxRAMPercentage}} turns that limit into a heap size',
      'Use Native Memory Tracking ({{-XX:NativeMemoryTracking=summary}}, {{jcmd <pid> VM.native_memory summary}}) to find out where the memory outside the heap went',
      'Build a memory budget for a Pod and compute a safe maximum heap',
    ],
    body: `### Two kinds of "out of memory" that have nothing in common
| | OutOfMemoryError | OOMKilled |
|---|---|---|
| Who notices | The JVM: it cannot allocate in the heap, in metaspace or in direct memory | The Linux kernel: the memory used by the cgroup passes the container limit |
| What you see | An exception in the log, possibly a heap dump | The process receives {{SIGKILL}}, exit code 137, {{kubectl describe pod}} reports {{Reason: OOMKilled}} |
| Java log | A stack trace is there | Nothing at all: no shutdown hook, no heap dump |
| Usual cause | The heap is too small, or there is a leak | The total (heap + everything outside the heap) passes the limit |

The key point: **the kernel has no idea what {{-Xmx}} means**. It only counts the real memory pages that the processes inside the cgroup currently hold (mostly RSS, Resident Set Size - the pages that are actually in physical RAM). The heap is only one part of RSS. A pod with a 2 GiB limit and {{-Xmx1800m}} can die while the heap is only 60% used, because everything outside the heap has already eaten what was left.

### What the memory of a Java process is made of
| Region | Configured by | Default / typical figure |
|---|---|---|
| **Heap** | {{-Xmx}} or {{-XX:MaxRAMPercentage}} | 25% of the memory limit if you set nothing |
| **Metaspace** | {{-XX:MaxMetaspaceSize}} | Unlimited; a mid-sized Spring Boot app uses roughly 100-250 MB |
| **Thread stacks** | {{-Xss}} | 1 MB per thread on Linux x64; 300 threads is up to 300 MB |
| **Direct buffers** | {{-XX:MaxDirectMemorySize}} | If unset, equal to the maximum heap; Netty, NIO and the Kafka client use a lot of it |
| **Code cache** | {{-XX:ReservedCodeCacheSize}} | 240 MB when tiered compilation is on (50-100 MB in practice) |
| **GC data structures** | Depends on the collector | G1: remembered set, card table, mark bitmap; from a few percent to more than 10% of the heap |
| **Malloc, native libraries** | {{MALLOC_ARENA_MAX}} | glibc creates many arenas (each arena up to 64 MB of address space) when many threads allocate; JNI, zlib, SSL |

You have to separate **reserved** from **committed**. The JVM **reserves** big ranges of virtual address space (for instance 1 GB for the compressed class space, 240 MB for the code cache) but only **commits** the part it actually uses, and the kernel only hands over real RAM when a page is touched for the first time. That is why a huge reserved number does not kill a pod, while the committed number (and the pages genuinely touched) is what you should worry about. Thread stacks work the same way: 1 MB is the reservation, most threads only touch a few tens to a few hundreds of KB, but deep recursion or a framework with a thick call stack will touch considerably more.

### How the JVM sees the container
Since JDK 10 (and 8u191), {{-XX:+UseContainerSupport}} is on by default: the JVM reads the memory limit and the CPU quota from the cgroup instead of the RAM and the core count of the whole node. cgroup v2 support exists since JDK 15 (backported to 11.0.16 and 8u372); JDK 17 and 21 read both v1 and v2. Quick check inside the container:

~~~bash
java -XX:+PrintFlagsFinal -version | grep -E "MaxHeapSize|MaxRAMPercentage"
java -Xlog:os+container=info -version   # prints the memory limit and CPU quota the JVM has read
~~~

When you set no {{-Xmx}} at all, the maximum heap is {{MaxRAMPercentage}} multiplied by the memory limit, and the default is **25%**. A pod with a 2 GiB limit then gets only 512 MB of heap and the remaining 75% is wasted; this is why many teams see the GC running constantly while the pod "still has plenty of RAM free". The opposite mistake, {{-Xmx2g}} on a pod with a 2 GiB limit, almost certainly ends in OOMKilled once load arrives, because nothing is left for the regions outside the heap.

Three flags that are easy to mix up:
- {{-XX:MaxRAMPercentage=70}}: the percentage of the limit used as the maximum heap. This is the flag you want.
- {{-XX:InitialRAMPercentage}}: the initial heap (the percentage form of {{-Xms}}). Set it equal to the maximum if you want to avoid the heap stretching and shrinking while the app runs.
- {{-XX:MinRAMPercentage}}: **not** the minimum heap. It is the percentage applied when the total memory is very small (roughly below 250 MB). Lots of people set this flag believing it is the min heap.

If you give both {{-Xmx}} and {{MaxRAMPercentage}}, {{-Xmx}} wins. Pick one style and stay consistent; the percentage form is more convenient, because changing the pod limit no longer requires editing the flag.

### Native Memory Tracking: where the memory outside the heap goes
NMT must be enabled at startup (you cannot switch it on while the JVM is running). {{summary}} mode is cheap, {{detail}} costs more; the Oracle documentation puts the overhead at about 5-10% of performance, so in practice you enable it on the one pod you are investigating:

~~~bash
java -XX:NativeMemoryTracking=summary -XX:MaxRAMPercentage=70 -jar app.jar
jcmd 1 VM.native_memory summary          # current snapshot (PID 1 inside the container)
jcmd 1 VM.native_memory baseline         # take a reference point
jcmd 1 VM.native_memory summary.diff     # a few hours later: which region grew against the reference?
~~~

The output is one block per category with reserved and committed figures, for example {{Java Heap (reserved=1433600KB, committed=1433600KB)}}, {{Class (reserved=1105920KB, committed=81920KB)}}, then {{Thread}}, {{Code}}, {{GC}}, {{Internal}}, {{Other}}... Read the **committed** column and the direction of the growth:
- {{Thread}} climbing steadily: a thread leak (an unbounded pool, a new thread per request). The thread count is printed inside that very section.
- {{Class}} climbing steadily: classes being generated nonstop (proxies, script engines, Groovy).
- {{Other}} climbing: usually direct buffers, because on JDK 17 memory obtained through {{Unsafe.allocateMemory}} is counted in this category.

NMT tracks **only** the memory allocated by the JVM itself. Malloc done by third-party native libraries (JNI, some drivers) never appears. If RSS (measured with {{ps -o rss}} or with the {{container_memory_working_set_bytes}} metric) is several hundred MB above the total committed reported by NMT, suspect glibc arenas or a native library: try {{MALLOC_ARENA_MAX=2}}, or change the allocator (jemalloc). Note that {{jcmd}} needs an image containing a JDK (not just a JRE) and must run as the same user as the Java process.

### Building a memory budget for a Pod
Example: a Spring Boot service, pod limit **2048 MB**, 200 threads (Tomcat plus its pools), 1 MB stacks, 128 MB of direct buffers, 192 MB of metaspace, 240 MB of code cache:

~~~text
headroom 10%    = ceil(2048 * 10%)     = 205 MB   (GC data structures, malloc, rounding error)
thread stacks   = 200 * 1024 KB        = 200 MB
direct buffers                          = 128 MB
metaspace                               = 192 MB
code cache                              = 240 MB
------------------------------------------------------
max heap        = 2048 - 205 - 760     = 1083 MB  (about 52.8% of the limit)
~~~

This example deliberately budgets the stacks and the code cache at their reserved size (the worst case). In reality many teams land on a {{MaxRAMPercentage}} of 65-75% after measuring with NMT under real load; the correct number is the number **you measured**, not the number you copied from a blog. The rules that come with it:

- Set {{requests.memory}} equal to {{limits.memory}} so that the pod gets Guaranteed memory QoS and is less likely to be evicted when the node runs short of RAM.
- Put an explicit ceiling on the regions that have no default cap: {{-XX:MaxMetaspaceSize}}, {{-XX:MaxDirectMemorySize}}, the size of each thread pool. When something passes a ceiling you get an {{OutOfMemoryError}} that names the region (clear, with a log line) instead of a {{SIGKILL}} with no explanation at all.
- Enable {{-XX:+ExitOnOutOfMemoryError}} so the pod restarts cleanly on OOM instead of carrying on in a broken state, together with {{-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps}} on a volume.
- Monitor both the heap (Micrometer) **and** the container working set; alert when the working set goes above roughly 90% of the limit.

> Senior tip: when a pod is OOMKilled and the heap is only at 60%, do not reflexively raise {{-Xmx}}: that is the direction that makes things worse. Enable NMT on one pod, compare {{summary.diff}} after a few hours, work out which region is inflating (usually threads, direct buffers or malloc arenas), and only then decide whether to shrink the heap, cap that region, or raise the limit.

### Interview relevance
The classic question: "Your Java pod is OOMKilled but the heap only uses 60%, how do you investigate?". A good answer follows this order: separate OOMKilled (kernel, exit 137) from {{OutOfMemoryError}} (JVM) → list the regions outside the heap → enable NMT, compare the baseline with the diff, cross-check against RSS → give a concrete budget (heap around 60-75% of the limit, ceilings for metaspace, direct memory and thread count) plus alerts. The exercise below makes you write exactly that budget arithmetic, so you have real numbers when you answer.`,
    exercises: [
      {
        title: 'Compute the safe maximum heap for a Pod',
        prompt: `Write {{MemoryBudget}} with two static methods:

**{{plan(podLimitMb, threads, stackKb, directMb, metaspaceMb, codeCacheMb)}}** returns the safe maximum heap (MB):
- Validate the arguments: {{podLimitMb > 0}}, {{stackKb > 0}}, every remaining argument {{>= 0}}; throw {{IllegalArgumentException}} otherwise.
- {{headroom}} = 10% of the limit, **rounded up** (a 1001 MB pod → 101 MB).
- {{stackMb}} = {{threads × stackKb / 1024}}, **rounded up** (3 threads × 512 KB = 1.5 MB → 2 MB). Compute with {{long}} so nothing overflows.
- {{heap = podLimitMb - headroom - stackMb - directMb - metaspaceMb - codeCacheMb}}.
- If {{heap < MIN_HEAP_MB}} (64) throw {{IllegalStateException}}: the pod has not enough memory for this configuration.

**{{percentage(podLimitMb, heapMb)}}** returns the value you should set for {{-XX:MaxRAMPercentage}}: {{heapMb / podLimitMb × 100}}, **rounded down** to one decimal place (1083 / 2048 = 52.88% → 52.8). Requires {{podLimitMb > 0}} and {{0 < heapMb <= podLimitMb}}, throw {{IllegalArgumentException}} otherwise.

Example from the lesson: {{plan(2048, 200, 1024, 128, 192, 240)}} = 1083.`,
        hints: [
          'To round an unsigned integer division up: {{(a + b - 1) / b}}. Headroom is {{ceilDiv(podLimitMb, 10)}}, the stacks are {{ceilDiv((long) threads * stackKb, 1024)}}.',
          'Cast with {{(long)}} **before** the multiplication: {{(long) threads * stackKb}}. Writing {{(long) (threads * stackKb)}} has already overflowed int and only then casts.',
          'For percentage, avoid {{Math.floor}} on a real number with rounding error: compute per-mille with integer arithmetic, {{(long) heapMb * 1000 / podLimitMb}}, then divide by {{10.0}}.',
        ],
        explain: `The computation mirrors exactly how budgeting is done in the lesson: the heap is **what is left over** after subtracting every region outside the heap plus some headroom, not a percentage picked out of the air.

Why round up for headroom and for the stacks: this is a safety budget, so the error must lean towards **less heap**. Rounding 1.5 MB of stacks down to 1 MB means promising the kernel more than you actually have.

Why use {{long}}: {{threads * stackKb}} as int overflows once the product passes about 2.1 billion; a negative result makes the computed heap larger than the limit, which is exactly the kind of bug that gets a pod OOMKilled. The "no int overflow" test uses unrealistic numbers but catches this bug.

Why percentage uses integers: {{Math.floor(x * 10) / 10}} on a double is sometimes off by one step because of binary representation (the classic 0.1 + 0.2). Computing per-mille with integer division gives a deterministic result.

Common mistakes: forgetting the {{heap < MIN_HEAP_MB}} check (returning a negative heap or 5 MB); throwing {{IllegalArgumentException}} for the out-of-memory case (the input is valid, the configuration is simply not feasible, so {{IllegalStateException}} is the more honest exception); rounding the 10% headroom down.

Applied for real: run the service with NMT under load, take the committed figures of {{Thread}}, {{Class}}, {{Code}}, {{Other}} as the input, then set {{-XX:MaxRAMPercentage}} to the value {{percentage}} returns. When the pod limit changes, you only have to recompute.`,
      },
    ],
    check: [
      {
        q: 'A pod has a 2 GiB memory limit and runs JDK 17 with no heap flag at all. What is the default maximum heap?',
        options: [
          'The same as the RAM of the node',
          '2 GiB',
          '512 MiB (25% of the limit)',
          '1 GiB (50% of the limit)',
        ],
        explain: `Container support is on by default, so the JVM reads the 2 GiB limit from the cgroup, and {{MaxRAMPercentage}} defaults to 25%, which gives 512 MiB. The JVM does not use the RAM of the node (that was the behaviour of old Java 8 before 8u191). It does not take the whole limit either (that would be OOMKilled), and 50% is the default of {{MinRAMPercentage}}, which only applies when the memory is very small.`,
      },
      {
        q: 'A Java pod keeps being OOMKilled (exit 137) while the heap metric stays around 60%. What is the most reasonable first investigation step?',
        options: [
          'Raise {{-Xmx}} to give the heap more room',
          'Enable Native Memory Tracking, compare the baseline with summary.diff and cross-check against the container RSS',
          'Take a heap dump and open it in MAT',
          'Switch from G1 to ZGC',
        ],
        explain: `The heap is not full, so the culprit sits outside the heap; NMT tells you by how much each native region (thread, class, code, GC, other) grew, and comparing with RSS reveals memory allocated outside the JVM. Raising {{-Xmx}} takes even more room away from the regions outside the heap and makes things worse. A heap dump only shows the heap. Changing the GC does not deal with the region that is inflating, and ZGC has its own memory overhead.`,
      },
      {
        q: 'Which statement about NMT is **correct**?',
        options: [
          'NMT can be enabled with jcmd while the JVM is running',
          'NMT also tracks malloc done by every third-party JNI library',
          'The reserved figures in NMT are exactly the real RAM currently held',
          'NMT must be enabled at startup with {{-XX:NativeMemoryTracking}}; it only sees memory allocated by the JVM',
        ],
        explain: `NMT is a startup flag; {{jcmd VM.native_memory}} only reads the result (and can turn NMT off), it cannot enable it while the JVM is running. NMT records only memory that goes through the JVM allocator, so it never sees malloc done directly by a native library. Reserved is a range of virtual address space; real RAM is closer to committed (and to the pages actually touched), so the 1 GB reserved for the class space does not mean 1 GB spent.`,
      },
    ],
  },
});
