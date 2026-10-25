/*
 * English translation of js/data/labs-thread.js — task T251. Format: js/core/i18n.js (content overlay).
 * ids: lab-thread-005
 */
App.i18n.content({
  'lab-thread-005': {
    title: 'CPU at 200% but API only slows down — find hot threads using top -H and nid',
    scenario: `**Context:** **PayVN Transfer** (Java 21, Spring Boot 3.4) just released a feature allowing merchants to configure their own **reference patterns** ({{reference pattern}}) for transfers. The pattern is stored in the DB as a regex string and compiled using {{Pattern.compile}} every time it is validated. The pod is limited to 2 vCPUs.

**Symptoms:** Since **11:20 on October 22, 2026**, CPU usage on the pod has climbed to **~199%** (exactly 2 cores) and remained there; API latency has increased from 80ms to over 8 seconds, and requests are queueing up. {{/actuator/health}} still returns {{UP}}, and the liveness probe does not restart. There are no exceptions, no deadlocks, and heap usage is stable (using 38% and not increasing). A new merchant (MC-8841) configured a very "creative" pattern and began sending a large batch of reconciliation requests.

**Data collected:** {{top}} and {{top -H -b -n 1 -p 1}} on the container; the on-call engineer, following old habits, converted the hot TID to hex to grep in the thread dump (with no results), then grepped again with the decimal number; accompanied by a 10-second CPU profile using async-profiler. The batch is being processed by the {{transfer-verify}} pool ({{BatchVerifyJob}}).`,
    questions: [
      'How did you identify the thread burning CPU? Present the top -H process and map the TID to the nid in the thread dump with specific numbers. Why did the command to grep by hex in the artifact return 0 rows?',
      'Why is /actuator/health still UP and the liveness probe not restarting when CPU is at 200%? What does this say about relying solely on health checks?',
      'What is the root cause of the CPU loop and how do you fix it both in the short and long term, even when patterns are configured by users (untrusted input)?'
    ],
    hints: [
      'TIDs in top are decimal. Until JDK 17, nids in jstack were printed in hex (14872 = 0x3a18, 14888 = 0x3a28), so you had to convert them; from JDK 18 (JDK-8268425), nids are printed in decimal, and the header has an additional [TID] after #N. The pod is running Java 21 — compare the hex grep command (0 results) with the decimal grep command.',
      'Look at the stack: no IO, no locks, no DB — just a chain of Pattern$Loop / GroupHead / CharPropertyGreedy / GroupTail frames repeating above Matcher.matches. This is a sign of regex backtracking, not a while loop in the code.',
      'The pattern for merchant MC-8841 is ^(([0-9]+)+)?[A-Z]$ and the input is a 42-digit string without a trailing letter. Try counting the ways to divide 42 digits into nested groups.'
    ],
    answer: `**Summary:** Two threads {{transfer-verify-3}} (TID/nid **14872**) and {{transfer-verify-7}} (TID/nid **14888**) are running a **catastrophic regex backtracking** from the pattern {{^(([0-9]+)+)?[A-Z]$}} belonging to merchant MC-8841. Each thread consumes a full core (99.7% and 98.9%), so the 2-vCPU pod reaches ~199% in total. This is a **ReDoS** (Regular Expression Denial of Service), not a deadlock, memory leak, or slow DB. Java's regex has no timeout and cannot be interrupted, so the only way to stop it is to restart the process.

### Hot thread identification process (correct order)
1. {{top -b -n 1 -p 1}} shows the process at 198.6%; {{top -H -b -n 1 -p 1}} — {{-H}} shows individual **threads** (TID) instead of the process, and the COMMAND column is the Java thread name, truncated to 15 characters. Result: TID {{14872}} = 99.7% CPU, TID {{14888}} = 98.9% (both are {{transfer-verify}}). The 4-core host has %Cpu(s) ~50% user, meaning exactly 2 cores are being burned — meaning high CPU inside Java, not waiting for IO.
2. Map TID to {{nid}} in the dump. **Version Trap:** until JDK 17, {{nid}} was printed in hex, so you had to {{printf '0x%x\\\\n' 14872 14888}} → {{0x3a18}} / {{0x3a28}}; from JDK 18 (JDK-8268425), {{nid}} is printed in **decimal** with {{[14872]}} right after {{#88}}. The pod is running Java 21, so grepping hex returns 0 rows — as seen in the artifact.
3. Grep the dump using decimal numbers: {{jcmd 1 Thread.print | grep 'nid=14872 '}} → correct thread {{transfer-verify-3}}, state {{RUNNABLE}}, cpu=354 880ms ≈ 5:54 CPU minutes, matching TIME+ {{5:52.88}} of top a few seconds earlier; {{nid=14888}} is {{transfer-verify-7}}.
4. Take 3–5 samples a few seconds apart: if the same TID is still {{RUNNABLE}} at the same frame group, it is a truly hot loop, not a coincidence.
5. Confirm with a profiler: ~98% of samples have the top frame {{java.util.regex.Pattern$Loop.match}}, call trace goes through {{Matcher.matches}} ← {{TransferValidator.isValidReference}} ← {{BatchVerifyJob.verifyItem}} — there is no doubt.

Reading tip: the hot thread stack repeats the cycle {{Loop.match}} → {{GroupHead.match}} → {{CharPropertyGreedy.match}} → {{GroupTail.match}}; depth is constrained by input length (a few frames per character) and fluctuates between samples, not growing indefinitely like an infinite recursion (which would end with {{StackOverflowError}}). If it were a lock wait, you would see {{BLOCKED}} + {{waiting to lock}} — this dump does not have any such thread. {{http-nio-8080-exec-11}} is just a victim: RUNNABLE but contending for CPU with the two hot threads, so the request is slow.

### Root cause — catastrophic backtracking

Merchant-configured pattern:

~~~text
^(([0-9]+)+)?[A-Z]$
~~~

With input {{202610220000001234567890123456789012345678}} (42 digits, no letter at the end):

- The outer group {{(...)+}} repeats, and inside {{[0-9]+}} also repeats → the same 42-digit sequence can be divided into groups in **billions of ways** (every position is a group boundary or not).
- Java's regex engine is NFA backtracking: when {{[A-Z]}} fails at the end of the string, it tries every way to divide the preceding groups before concluding no match. The number of steps is exponential with respect to input length, approximately {{2^(n-1)}}.
- Important point for interviews: since JDK 9, {{java.util.regex}} has memoization for **outermost** greedy loops — {{^([0-9]+)+[A-Z]$}} stripped down returns almost instantly on Java 17/21. But simply wrapping it in an optional group {{(...)?}} as in the merchant's pattern means the loop is no longer outermost, memoization does not apply, and complexity returns to exponential (measured on JDK 17: 24 digits ~0.4–1s, 28 digits ~8s, each additional digit roughly doubles the time). Therefore, you cannot rely on "JDK optimizations".
- 42 characters → about {{2^41 ≈ 2.2 × 10^12}} steps, i.e., hours to days for one request. Thus, two threads are "stuck" at 100% CPU, never actually returning a result.

The pattern is compiled and matched in {{TransferValidator.isValidReference}} line 57, called from the {{transfer-verify}} pool handling reconciliation batches ({{BatchVerifyJob.verifyItem}} line 73); single transfers via API also use the same validator. There is no length limit on input before matching, and the pattern comes from the DB configured by the merchant — i.e., **untrusted regex**, a classic ReDoS vulnerability. Recompiling every time also increases cost but is not the root cause.

### Why health check is still UP

{{/actuator/health}} only checks {{HealthIndicator}}s (DB, disk, ping) and not CPU saturation or request queue length. The thread pool still receives new tasks (the 2 hot threads do not hold a global lock), so the probe still returns 200 OK. Result: Kubernetes does not restart, and autoscaler based on CPU might scale but every new pod is also poisoned when receiving that same request. Lesson: need to add **CPU throttling**, **latency SLO**, and **queue depth** to criteria for alerts/scaling, not just health checks.

### How to fix

**Short term (15 minutes):**
1. Confirm merchant MC-8841 and disable/block their pattern in the DB (or feature flag), then **restart the pod** to free up the 2 threads spinning. Cannot stop threads manually: {{Thread.interrupt()}} does not affect {{Matcher.matches}} (it does not check interrupt), and {{Thread.stop()}} throws {{UnsupportedOperationException}} since JDK 20.
2. Block/rate-limit requests from that merchant at the gateway to prevent new pods from being poisoned.
3. Check if their transfers are stuck/unresponsive to handle business logic (reconciliation, returning timeout results).

**Long term:**
- Fix pattern: remove redundant nested groups, rewrite linearly {{^[0-9]*[A-Z]$}} (same meaning: zero or many digits followed by one letter). For normal regex, consider **RE2/J** (library {{com.google.re2j}}) — linear time engine, no backtracking, safe for untrusted input. Trade-off: RE2/J does not support backreferences and lookarounds.
- If {{java.util.regex}} must be used, **limit input length** before matching and use **allowlist patterns**: only allow merchants to choose from approved pattern sets, do not allow arbitrary regex entry.
- Cache {{Pattern.compile}} by pattern id (compile once), and validate patterns when saving using tests against backtracking (try bad input, measure time).
- Run validation in a **separate process/thread pool with limits** so a bad pattern cannot burn all cores of the main API; or switch to a validator written in code (check characters, length) instead of regex.
- Add real timeout for regex: wrap the input with a custom {{CharSequence}}, in {{charAt()}} check the deadline (or interrupt flag) and throw an exception when it exceeds 50ms — the engine calls {{charAt()}} continuously during backtracking, so it will be cut in time. Putting {{Future.get(timeout)}} in a separate worker is not enough: the caller stops waiting but the thread still spins burning CPU.

| Measure | Blocks ReDoS | Cost |
|---|---|---|
| Rewrite linear regex | Yes, if done correctly | Low |
| Limit input length | Reduces heavily, not absolute | Very Low |
| Allowlist patterns | Yes | Medium (operation) |
| RE2/J | Yes (linear time) | Change library, lose lookarounds |
| Separate worker + timeout logic | Yes, isolation | Higher |

### Prevention
- Alert on **CPU throttling** ({{container_cpu_cfs_throttled_seconds_total}}) and **p99 latency**, not just average CPU; 199% CPU on 2 vCPUs is a sign of absolute saturation.
- Enable JFR or async-profiler periodically; 10s of CPU samples are enough to point to the top regex frame.
- Add ReDoS tests to CI for all user-configured patterns: run with 40–50 character input and assert < 50ms.
- Update runbooks: the process {{top -H}} → map TID to {{nid}} in {{jcmd Thread.print}} is a required skill for on-call, with version notes: JDK ≤ 17 converts TID to hex ({{printf '0x%x'}}), JDK 18+ greps decimal directly.

> Senior tip: In interviews, don't just answer "add more threads" or "use ConcurrentHashMap" when seeing 100% CPU — that's the story of JDK 7, while JDK 8+ rarely loops like that, and the stack will be completely different ({{HashMap.resize}} / {{putVal}}). Let the stack decide. A practical tip: take 2–3 thread dumps 5–10 seconds apart — if the same lock is held and a BLOCKED queue waits for it in every dump, but the holder is RUNNABLE, changes hands, or changes frames and CPU time increases, that is contention (it is progressing, just sequential); deadlock means the holder is stuck forever at the same frame, CPU does not increase, and JVM automatically prints {{Found one Java-level deadlock}}. And remember that regex from users is **untrusted input**, just like SQL injection — treat it with allowlists, not faith.`,
    rubric: [
      'Demonstrate correct procedure for top -H taking TID 14872/14888 and mapping to nid=14872/14888 (decimal on Java 21; hex 0x3a18/0x3a28 only used for JDK ≤ 17) in jstack, identifying threads transfer-verify-3/7.',
      'Identify the root cause as catastrophic backtracking of regex ^(([0-9]+)+)?[A-Z]$ with a 42-digit input, explaining exponential complexity (nested repeating groups) and why the thread is RUNNABLE burning 100% CPU.',
      'Explain why health check is still UP because it doesn\'t measure CPU saturation/latency, and suggest alerting on throttling/p99/queue depth.',
      'Propose fixes: allowlist/length limit, rewrite linear regex or RE2/J, disable pattern and restart pod, including JFR ReDoS testing prevention.'
    ]
  }
});