/*
 * English translation of js/data/q-concurrency-jvm.js — task T374. Format: js/core/i18n.js (content overlay).
 * ids: jvm-026 jvm-027
 */
App.i18n.content({
  'jvm-026': {
    q: 'A service has been running stably for months, then one day it dies with OutOfMemoryError right after a customer uploads a 1.5 GB log file for analysis. What "innocent-looking" code patterns commonly cause this type of OOM, and how do you read error messages to narrow down the cause?',
    a: `**Summary:** Most real-world OOMs are not gradual leaks but **allocation spikes**: one request loads too much data into memory (reading a whole file, a massive result set, a large JSON, streaming everything into a List). Code works fine with small test data but blows up with huge inputs. The message after the colon in {{OutOfMemoryError}} tells you which memory area is exhausted, so read it before doing anything else.

### 1. Why a 1.5 GB file needs more than 1.5 GB of heap
Take this familiar code:
~~~java
// "Read file and filter error lines" - works fine with a 10 MB file
List<String> lines = Files.readAllLines(path);           // (1) load entire file into List<String>
String all = String.join("\\n", lines);                   // (2) create another copy
Matcher m = Pattern.compile("ERROR.*timeout").matcher(all); // (3) regex on a massive string
~~~
Rough calculation for a 1.5 GB file, 15 million lines:
~~~text
(1) byte array of the Strings : ~1.5 GB (ASCII log, compact string 1 byte/char)
    header String + array     : 15 million x ~40 bytes = ~0.6 GB
    ArrayList holding references : 15 million x 4-8 bytes = ~0.1 GB
(2) join creates another massive string, while List is still alive
                             : adds ~1.5 GB
=> peak heap requirement is nearly 4 GB, while pod only has -Xmx2g  ->  OutOfMemoryError: Java heap space
~~~
Additionally, Java arrays have a max size of roughly 2^31 elements, so {{Files.readAllBytes}} on a file larger than ~2 GB will throw OOM with a message like "Required array size too large" even if heap is free.

### 2. Common "innocent-looking" code patterns
| Pattern | Why it blows up | How to fix |
|---|---|---|
| {{readAllLines}}, {{readAllBytes}}, {{IOUtils.toString}} | Loads entire file into heap | {{Files.lines(path)}} or {{BufferedReader}} to process line-by-line, remember to close stream |
| {{repo.findAll()}} / JDBC without fetch size | MySQL driver defaults to reading **the entire** result set into memory; PostgreSQL does too unless autocommit is off and {{fetchSize}} is set | Key-set pagination, Spring Data {{Stream}} in transaction + fetch size, or {{JdbcTemplate}} with {{RowCallbackHandler}} |
| {{objectMapper.readValue(body, List.class)}} with huge JSON | The entire object tree in heap, often several times the JSON size | Streaming {{JsonParser}} to read element-by-element |
| {{collect(Collectors.toList())}} / {{groupingBy}} on a huge source | Stream is lazy, but collect gathers everything | Batch processing (batch 1,000 elements), write to destination immediately |
| {{ByteArrayOutputStream}} to build export file | Doubles in size when full, {{toByteArray()}} copies it again | Write directly to {{OutputStream}} of response/S3 multipart |
| {{Executors.newFixedThreadPool}} | Infinite {{LinkedBlockingQueue}}, burst makes queue inflate | {{ThreadPoolExecutor}} with bounded queue + rejection policy |
| Static {{HashMap}} cache, {{ThreadLocal}} without {{remove()}} | Gradual leak (unlike spike), old gen grows daily | Caffeine with {{maximumSize}}; {{try/finally}} remove |

### 3. Regex on huge logs: two different issues
- **Catastrophic backtracking**: patterns with nested quantifiers like {{(a+)+b}} or {{(.*,)*x}} on non-matching strings cause an **exponentially** increasing number of ways to match. The main symptom is **CPU 100%, thread hanging** in {{java.util.regex.Pattern}} (visible in jstack), not OOM. This is ReDoS.
- **StackOverflowError**: JDK regex engine handles certain structures (like nested alternations {{(a|b)*}}) using recursion; long strings will cause stack overflow.
- **OOM** usually comes from **loading the whole log into a String** to run regex, as shown in section 1.

Safe approach: run regex **line-by-line**, limit line length (truncate lines > 10 KB), write patterns without nested quantifiers (use negated character classes like {{[^,]*}} instead of {{.*}}, possessive quantifiers {{*+}} or atomic groups {{(?>...)}} to block backtracking), and never compile user-provided patterns.

### 4. Reading OOM messages to isolate the area
| Message | Exhausted Area | Investigation |
|---|---|---|
| Java heap space | Heap | Heap dump: spike shows a thread holding a massive object; leak shows collections growing |
| GC overhead limit exceeded | Heap nearly full, frequent useless GC | Same as heap space, usually a leak |
| Requested array size exceeds VM limit | Requested array larger than JVM limit | Find code creating massive arrays/collections |
| Metaspace / Compressed class space | Class metadata | Classloader leak, excessive dynamic class generation (proxy, script) |
| Direct buffer memory | Off-heap NIO memory | Netty/NIO buffer, {{-XX:MaxDirectMemorySize}}, Native Memory Tracking |
| unable to create native thread | OS cannot create more threads | Count threads via jstack, look for infinite thread pools |

Note: pod **OOMKilled** (exit code 137) is **not** {{OutOfMemoryError}}. That is the kernel killing the process because total memory (heap + off-heap) exceeded the container limit, so there will be no stack trace or heap dump.

> Senior tip: Every API receiving files or returning "entire" data MUST have **size limits** ({{spring.servlet.multipart.max-file-size}}, limit on number of export lines) and be load-tested with inputs 10x larger than real data. My review rule: if I see {{readAll}}, {{findAll()}}, {{toList()}}, or {{toByteArray()}} in user data processing, I immediately ask "What's the maximum input size?". That question stops most spike-type OOMs before they hit production.`,
    follow: [
      'How can you distinguish between OOM due to spike and OOM due to leak just by looking at heap chart after GC?',
      'Spring Data returns {{Stream<Order>}}: what conditions are needed to truly stream and not keep all entities in the persistence context?',
      'How do you protect an API that allows users to input search regexes?'
    ]
  },
  'jvm-027': {
    q: 'You are on-call: a payment service on Kubernetes keeps restarting due to out of memory. Present your OOM handling playbook, from pre-incident preparation, emergency response, evidence collection to analysis and prevention.',
    a: `**Summary:** The playbook has 4 phases. **Preparation** (pre-incident): JVM flags for self-dumping and self-exit, continuous JFR, metrics + alerts on post-GC heap and container memory. **Emergency response**: determine if it's Java OOM or container OOMKilled, restore service (rollback, scale, temporarily increase limit) **without losing evidence**. **Evidence collection and analysis**: heap dump via Eclipse MAT, Native Memory Tracking for off-heap, JFR/async-profiler for allocation. **Prevention**: fix the root cause, add load tests and alerts.

### Phase 0: Preparation (DO THIS BEFORE incident)
~~~bash
-XX:MaxRAMPercentage=70                 # heap = 70% container memory limit
-XX:+HeapDumpOnOutOfMemoryError         # self-dump on JVM-thrown OOM (heap, metaspace)
-XX:HeapDumpPath=/dumps                 # persistent volume, enough space >= heap size
-XX:+ExitOnOutOfMemoryError             # exit after dump, for clean Kubernetes restart
-XX:NativeMemoryTracking=summary        # only enabled at startup
-XX:StartFlightRecording=name=blackbox,maxage=6h,maxsize=512m
~~~
Why {{ExitOnOutOfMemoryError}}: after OOM, some threads might have died mid-task (scheduler, Kafka consumer) but the process is still alive and health checks are still green. That "zombie" state is worse than being dead. Exit immediately so the orchestrator can replace the pod cleanly.

Metrics and alerts (Micrometer + Prometheus) must be in place:
| Metric | Suggested Alert | Meaning |
|---|---|---|
| Heap remaining **after GC** ({{jvm_gc_live_data_size_bytes}} vs {{jvm_gc_max_data_size_bytes}}) | > 80% for 15 mins | Early leak sign, hours before OOM |
| {{jvm_gc_pause_seconds}} | Total pause > 10% of time | GC "gasping", near OOM |
| {{container_memory_working_set_bytes}} / limit | > 90% | Risk of OOMKilled (includes off-heap) |
| Restarts, {{OOMKilled}} reason | Any | Needs human investigation |

### Phase 1: Emergency response, classification in first 5 mins
~~~text
kubectl describe pod ... -> Last State
   |
   +-- Reason: OOMKilled, exit 137  --> KERNEL kill: total RSS > limit
   |        (no heap dump; suspect off-heap: thread, direct buffer, metaspace, malloc)
   |
   +-- Error, exit 3 / log contains "java.lang.OutOfMemoryError: <message>"
        --> JVM threw OOM; read message to know memory area, find .hprof file
~~~
Restore service in order of priority:
1. Recent deploy? **Rollback** first, analyze later.
2. OOM due to one request type (huge file, export)? Block temporarily via feature flag or rate limit.
3. Temporarily increase memory limit / heap to buy time (record as temporary measure).
4. **Keep one "sick" pod** for evidence: unlabel from Service so it receives no traffic instead of deleting it.

### Phase 2: Evidence collection
~~~bash
jcmd <pid> GC.heap_info                              # how is heap used
jcmd <pid> GC.class_histogram | head -30             # top classes (fast, lightweight)
jcmd <pid> GC.heap_dump /dumps/live.hprof            # proactive dump; defaults to live objects only
jcmd <pid> VM.native_memory summary                  # off-heap: thread, class, code, GC, internal
jcmd <pid> JFR.dump name=blackbox filename=/dumps/rec.jfr  # get up to last 6 hours
~~~
- Heap dump **pauses the JVM** while writing (4 GB heap can take seconds to tens of seconds) and file size equals heap size. Do not dump a pod serving traffic.
- Heap dump contains **real data** (cards, tokens, customer info). Treat as sensitive data: store encrypted, limit access, delete after use.

### Phase 3: Analysis
- **Eclipse MAT**: open **Leak Suspects** report first. Then **Dominator Tree** sorted by retained size (memory freed if object disappears). Pick largest object, check **Path to GC Roots** to know who holds it (static field, ThreadLocal of which thread, cache).
- Spike vs leak: spikes usually show a thread handling a request holding a massive array/collection; leaks usually show collections with millions of elements hanging off a static field or cache.
- Off-heap: compare two {{VM.native_memory summary.diff}} (after running {{VM.native_memory baseline}}) 30 minutes apart to see which region grows.
- Allocation: JFR event {{jdk.ObjectAllocationSample}} or async-profiler ({{asprof -e alloc -d 60 -f alloc.html <pid>}}) for "who allocates most" flame graph, useful when you can't snap a dump at the right time.

### Phase 4: Prevention and postmortem
- Fix root cause + reproducible test (huge input, long-running load test to expose leak).
- Add limits: upload size, cache with {{maximumSize}}, queue capacity.
- **Continuous profiling** (continuous JFR or async-profiler via tools like Pyroscope) to have data right at the moment before the incident next time.

> Senior tip: measure time from alert to "having heap dump in hand" as a team metric. Many teams lose a whole day just because the dump was written to the container's temporary filesystem and lost after pod restart. Practice this: cause an OOM on staging every quarter and check if the dump is in the right place, opens in MAT, and alerts fire. An unpracticed playbook almost always fails when you need it.`,
    follow: [
      'Pod is OOMKilled but heap used is only 50%: how do you set up the process "memory budget"?',
      'ExitOnOutOfMemoryError vs CrashOnOutOfMemoryError: when to choose which?',
      'A 16 GB heap dump won\'t open on my laptop: how do you analyze it?'
    ]
  }
});