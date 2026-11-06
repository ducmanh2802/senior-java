/*
 * English translation of js/data/lessons-jvm.js — task T806. Format: js/core/i18n.js (content overlay).
 * ids: lesson-jvm-007
 */
App.i18n.content({
  'lesson-jvm-007': {
    title: 'Thread dump: reading jstack, telling BLOCKED from WAITING, building the wait graph to find a deadlock',
    goals: [
      'Take a thread dump on production with jstack, jcmd or kill -3, and know what a dump can tell you and what it cannot',
      'Tell RUNNABLE, BLOCKED, WAITING and TIMED_WAITING apart, and why a thread stuck in socketRead is still RUNNABLE',
      'Read the locked / waiting to lock / waiting on / parking to wait for lines correctly, so you know who holds which lock and who is waiting for it',
      'Build the thread -> lock -> owner graph yourself and find the deadlock cycle with code, instead of eyeballing it',
    ],
    body: `### A thread dump is a photograph, not a video
A thread dump (also called jstack output) is a **full snapshot** of every thread in the JVM at one instant: which method each thread is in, which lock it holds, which lock it is waiting for. It is the number one tool when the system "hangs" while CPU is low.

~~~bash
jstack 12345 > dump.txt                          # print the dump of PID 12345 to a file
jstack -l 12345 > dump.txt                       # -l: add the Locked ownable synchronizers section
jcmd 12345 Thread.print > dump.txt               # recommended; works even when jstack reports "Unable to open socket file"
kill -3 12345                                    # SIGQUIT: the JVM prints the dump to its own stdout, not to a file
kubectl exec my-pod -- jcmd 1 Thread.print       # inside a container the app PID is usually 1
~~~

Three in-the-field notes:
- The dump is taken at a **safepoint**, so it causes a short pause (a few ms up to a few tens of ms with thousands of threads). Taking it 3 times in a row is enough for users to notice, but never take it inside a loop.
- **Take at least 2-3 dumps 5-10 seconds apart.** One dump only tells you where each thread is; two dumps tell you who is **standing still**. A thread that changes stack frame between two dumps is making progress, however slowly.
- {{jstack}} must run under the same user as the JVM process, otherwise it reports "Unable to open socket file"; when that happens use {{kill -3}} (the dump goes to stdout, i.e. the app log) or {{jcmd}}.

### Anatomy of one entry
~~~text
"http-nio-8080-exec-12" #45 daemon prio=5 os_prio=0 cpu=125.00ms elapsed=3612.44s tid=0x00007f3c7c01d800 nid=0x1a2c waiting for lock condition [0x00007f3c5a2fb000]
   java.lang.Thread.State: BLOCKED (on object monitor)
        at demo.Transfer.move(Transfer.java:57)
        - waiting to lock <0x000000076abba128> (a demo.Account)
        - locked <0x000000076abba1f0> (a demo.Account)

Locked ownable synchronizers:
        - <0x000000076abba3c0> (a java.util.concurrent.locks.ReentrantLock$NonfairSync)
~~~

| Field | How you read it |
|---|---|
| the name in double quotes | the thread name chosen by your code (Tomcat's {{http-nio-...}}, ExecutorService's {{pool-1-thread-3}}, {{kafka-coordinator...}}) |
| {{#45}}, {{daemon}} | the thread's sequence number, the daemon flag (a daemon thread does not keep the JVM alive) |
| {{cpu=125.00ms}} | total time this thread has spent **running on a CPU** since it was created |
| {{elapsed=3612.44s}} | how long the thread has existed |
| {{nid=0x1a2c}} | the kernel thread ID (LWP) in hex; convert it to decimal to match it against {{top -H -p}} |
| {{waiting for lock condition}} | the VM's own description — close to, but not exactly the same as, the State line below |
| {{java.lang.Thread.State: BLOCKED}} | the **standard state** of {{java.lang.Thread}} — this is the value to trust |
| {{- locked <0xA>}} | currently **holds** the monitor of object A |
| {{- waiting to lock <0xA>}} | wants to enter {{synchronized}} on A but A is held by someone else -> this thread is a **waiter** |
| {{- waiting on <0xA>}} | called {{A.wait()}}: it **released** the monitor and is waiting for {{notify}} — it neither holds nor waits for a lock |
| {{- parking to wait for <0xA>}} | inside {{LockSupport.park}} on A: a ReentrantLock, a Semaphore or a Condition |
| {{Locked ownable synchronizers}} | the section listing the ReentrantLocks this thread **holds**; monitors never appear here |

> What a **monitor** is: every Java object has a built-in key. The block {{synchronized (acc)}} means "take acc's key, do the work, give the key back"; since one key can be held by only one person, whoever arrives next has to stand outside. **ReentrantLock** is the library version of that key ({{java.util.concurrent.locks}}), with timeout and fairness added, and the JVM reports it in the Locked ownable synchronizers section.

### The four states you actually see, and the RUNNABLE trap
| State | Meaning | What it hints at |
|---|---|---|
| {{RUNNABLE}} | running **or** waiting for a resource at the operating-system layer | CPU is low yet many threads are RUNNABLE inside {{socketRead0}} or {{EPollArrayWrapper.epollWait}} -> they are waiting for the DB/API, not computing |
| {{BLOCKED}} | wants to enter {{synchronized}} but the monitor is held by someone else | there is a hot lock; find who currently holds that address |
| {{WAITING}} | waiting with no deadline: {{wait()}}, {{join()}}, {{park()}}, {{Future.get()}}, an empty queue | someone has to wake it up; nobody wakes it up = stuck forever |
| {{TIMED_WAITING}} | waiting with a deadline: {{sleep(t)}}, {{wait(t)}}, {{parkNanos}}, {{tryLock(t)}}, {{join(t)}} | if {{tryLock}} timeouts are everywhere, the system is protecting itself |

{{NEW}} and {{TERMINATED}} almost never appear in a dump (a thread that was never started, or one already dead).

The biggest trap for newcomers: **{{RUNNABLE}} does not mean the thread is burning CPU**. The JVM has no "waiting on a socket" state, so a thread blocked in {{InputStream.read}} on a socket still reports itself as RUNNABLE. That is why the question "CPU is 30% but the API is slow" usually has its answer right here: the whole pool is RUNNABLE and waiting on downstream (the services behind you: the DB, other APIs), not short of CPU.

### A deadlock is a cycle in the wait graph
Build the graph: every thread is a node, and you draw an edge from thread T to thread O when **T waits for lock L and O currently holds L**. Each thread waits for at most one lock, so every node has **out-degree 1** — to find a cycle you only follow the pointer and check whether you ever come back to where you started.

~~~seq
title: deadlock when two threads transfer money in opposite directions
actors: T-A | Lock-1 | T-B | Lock-2
T-A -> Lock-1: synchronized(accA)
Lock-1 --> T-A: holder = T-A
T-B -> Lock-2: synchronized(accB)
Lock-2 --> T-B: holder = T-B
T-A -> Lock-2: synchronized(accB)
Lock-2 --> T-A: no answer, T-A BLOCKED
T-B -> Lock-1: synchronized(accA)
Lock-1 --> T-B: no answer, T-B BLOCKED
note T-A..T-B: Wait cycle: T-A -> Lock-2 -> T-B -> Lock-1 -> T-A
~~~

A deadlock needs all four conditions at once: the resource cannot be shared, one thread holds something while waiting for something else, nobody can take a key back by force, and there is a wait cycle. Break one condition and it is gone: the most practical fix is **breaking the circular wait** by always taking locks in one global order (e.g. sort the account ids, then lock), or using {{tryLock(50, TimeUnit.MILLISECONDS)}} so there is a way out.

~~~java
// The same transaction, but the locks are ordered -> no wait cycle
void safeTransfer(Account from, Account to, long amount) {
    Account first = from.id() < to.id() ? from : to;    // global order by id
    Account second = first == from ? to : from;
    synchronized (first) {
        synchronized (second) {                          // everyone takes first before second
            from.debit(amount);
            to.credit(amount);
        }
    }
}
~~~

The JVM detects cycles of this kind itself and prints an extra block at the end of the dump:

~~~text
Found one Java-level deadlock:
=============================
"transfer-1":
  waiting to lock monitor 0x00007f3c3c01ad00 (object 0x000000076abba128, a demo.Account),
  which is held by "transfer-2"
"transfer-2":
  waiting to lock monitor 0x00007f3c3c01b200 (object 0x000000076abba1f0, a demo.Account),
  which is held by "transfer-1"
~~~

**The limit you must state in an interview**: the JVM only sees its own locks (monitors, ReentrantLock). It does not see a **DB row-lock queue** deadlock (MySQL detects that itself and throws error 1213), a **distributed lock in Redis/ZooKeeper**, or a **logical deadlock** (a thread waiting for a message that will never arrive). In those cases the dump only shows the symptom: the pool is out of threads, everything is {{WAITING}}, or everything is {{RUNNABLE}} inside {{socketRead}}.

### The five-step routine when the system is slow
1. Look at CPU first: {{top -H -p 12345}} — a thread burning 100% has an {{nid}} (hex {{0x1a2c}} = decimal 6700) that points straight at one entry in the dump.
2. Take dumps: {{jcmd 12345 Thread.print > dump-1.txt}}, wait 5 seconds, then take dump-2 and dump-3.
3. Count by state: {{grep "java.lang.Thread.State" dump-1.txt | sort | uniq -c | sort -rn}}. 200 threads {{BLOCKED}} is a different story from 200 threads {{WAITING}}.
4. Find the hot lock: count how many times each address appears after {{waiting to lock}} / {{parking to wait for}}, then read the entry of the **owner** of that address — if the owner is {{RUNNABLE}} inside {{socketRead0}}, someone is holding a lock across an HTTP call.
5. If everything is {{WAITING}} and CPU is low: suspect pool exhaustion or downstream latency; open JFR and look at the {{jdk.JavaMonitorWait}}, {{jdk.SocketRead}} and {{jdk.VirtualizationInformation}} events.

> Senior tip: in real life, most "API hangs, CPU 30%" incidents are not a deadlock but a **lock held across I/O**: a {{synchronized}} block that wraps {{httpClient.execute(...)}} or {{jdbcTemplate.query(...)}} as well. In a deadlock two threads are genuinely dead-stopped; with a lock held across I/O one thread holds the key while 199 threads queue up behind it — the dump looks exactly like a deadlock but {{Found one Java-level deadlock}} is not there. So always read the owner's entry before you conclude anything.

### Interview connection
Common questions: "How do you detect a deadlock from a thread dump?", "What is the difference between BLOCKED and WAITING?", "How do you investigate 100% CPU?", "Why should you not call HTTP inside a synchronized block?". Answer frame: (1) take 2-3 dumps a few seconds apart, (2) count the states and find the lock with the most waiters, (3) read the owner's entry to see what it is doing, (4) state the dump's limits with locks outside the JVM. The exercise below makes you implement exactly those first three steps on a raw dump, so you will remember precisely where {{- waiting to lock}} and {{- waiting on}} differ.`,
    exercises: [
      {
        title: 'DumpAnalyzer: build the wait graph, find the deadlock cycle and the most-contended lock',
        prompt: `Write a {{DumpAnalyzer}} class that reads **one** text thread dump (JDK 17 style) and returns three results. Use strings only ({{startsWith}}, {{indexOf}}, {{substring}}); no regex needed.

**Text structure.** Each thread begins with an **un-indented** line whose first character is a double quote: the thread name is the string between those two quotes. The next line may be {{java.lang.Thread.State: <NAME> (description)}}. Stack lines and lock lines are indented (tab or space both occur — use {{trim}} when you test the leading character). A first line such as {{Full thread dump OpenJDK ...}} and blank lines must be skipped.

**Holds and waits.** Inside the current thread's entry:
- the thread **holds** a lock when the line is {{- locked <0xA>}} (a monitor) or {{- <0xA>}} (a ReentrantLock it holds, from the {{Locked ownable synchronizers}} section);
- it **waits for** a lock when the line contains {{- waiting to lock}} or {{- parking to wait for}}, followed by {{<0xA>}};
- the line {{- waiting on <0xA>}} (the result of {{wait()}}) is **not** a hold and **not** a lock wait: skip it.
The lock address is the string between the next {{<}} and {{>}}, keeping the {{0x}} prefix. Each thread contributes only the **first** lock it waits for; each lock records only the **first** owner found.

**Example of a dump containing two deadlock cycles** (a monitor cycle and a ReentrantLock cycle):

~~~text
"transfer-1" #21 prio=5 os_prio=0 cpu=40.00ms elapsed=90.00s tid=0x1 nid=0x2b40 waiting for lock condition [0x3]
   java.lang.Thread.State: BLOCKED (on object monitor)
        at demo.Transfer.move(Transfer.java:57)
        - waiting to lock <0x000000076abba128> (a demo.Account)
        - locked <0x000000076abba1f0> (a demo.Account)
"transfer-2" #22 prio=5 os_prio=0 cpu=38.00ms elapsed=90.00s tid=0x4 nid=0x2b41 waiting for lock condition [0x5]
   java.lang.Thread.State: BLOCKED (on object monitor)
        at demo.Transfer.move(Transfer.java:57)
        - waiting to lock <0x000000076abba1f0> (a demo.Account)
        - locked <0x000000076abba128> (a demo.Account)
~~~

In this example {{transfer-1}} waits for the lock {{...128}} held by {{transfer-2}}, while {{transfer-2}} waits for the lock {{...1f0}} held by {{transfer-1}}: the two nodes form one cycle.

**The three functions to write.**
1. {{statesByThread(dump)}} -> a {{Map<String, String>}} in appearance order, key = thread name, value = the **state name without the parenthesised description** ({{WAITING}}, not {{WAITING (parking)}}). An entry with no State line is **not** in the map.
2. {{deadlockThreads(dump)}} -> a {{List<String>}} of the thread names that lie **on a cycle** of the "thread waits for a lock -> owner of that lock" edges, **sorted ascending by name**; return an empty list when there is no cycle. A thread that merely waits **into** a cycle (it walks into a node of the cycle but never comes back to itself) must **not** be listed.
3. {{topContendedLocks(dump, k)}} -> a {{List<String>}} of lock addresses, sorted by **number of waiting threads descending**, ties broken by **address ascending** (string compare), truncated to the first {{k}} elements. Only locks with at least one waiter appear. {{k < 0}} -> throw {{IllegalArgumentException}}.

One real-world note: {{- parking to wait for <0xA>}} also shows up when a thread waits on a **Condition** (a queue), not only on a ReentrantLock; in that case the address A usually has no owner in the dump, so it only adds to the contention count and cannot create a cycle.`,
        hints: [
          'Walk the file line by line and keep one {{current}} variable holding the thread name of the entry you are in: a line that opens with a double quote at column 0 starts a new entry, every other line belongs to that entry.',
          'Do not test {{startsWith("- ")}} on the raw line: stack lines are indented too. Use {{trim()}} and then compare the prefix, or {{indexOf(marker)}} for the waiting lines.',
          'Each node has only **one** outgoing edge, so finding a cycle needs no fancy algorithm: follow the pointer and record the path in a {{List}}; if you meet a node that is already on the path, the cycle is the segment from that position to the end of the path (the nodes before that segment only wait into it).',
          'Use a {{TreeSet<String>}} for the thread names on a cycle so {{deadlockThreads}} returns ascending order deterministically, and {{Map.merge(lock, 1, Integer::sum)}} to count waiters.',
          'Sorting contention: the comparator returns {{Integer.compare(counts.get(b), counts.get(a))}} first and, when that is 0, {{a.compareTo(b)}} — always provide a tie-break, otherwise the result depends on hash order.',
        ],
        explain: `This exercise is a scaled-down model of what you do on production, and each function answers one real question: {{statesByThread}} answers "what state is the system in" (mostly BLOCKED = a hot lock; mostly WAITING = waiting for somebody to wake them up; mostly RUNNABLE in {{socketRead}} = waiting on downstream). {{topContendedLocks}} answers "which lock is the bottleneck". {{deadlockThreads}} answers "is there a real death loop".

The three easiest mistakes when implementing this:

- **Confusing {{- waiting on <0xA>}} with {{- waiting to lock <0xA>}}.** The first line is {{A.wait()}}: the thread has **released** the monitor, so it is no longer the holder and is not a lock waiter either — count it as contention and you will accuse a lock that nobody is waiting for.
- **Ignoring the owners listed in {{Locked ownable synchronizers}}.** For a ReentrantLock, the lock does not show up in a {{- locked}} line but in that section, in the form {{- <0xA>}}. Forget it and you only catch {{synchronized}} deadlocks, missing exactly the kind that happens with the {{ReentrantLock}}s in business code.
- **Listing the whole waiting chain as a deadlock.** The graph has out-degree 1, so {{t-z -> t-y -> t-x -> t-y}}: {{t-z}} only **waits for a victim**, it is not a victim itself — it gets freed the moment the cycle is broken. The algorithm must mark the segment starting at the first occurrence of the node you met again, not the whole path.

Once you have the result, the decisive step is still **reading the owner's entry**: an owner {{BLOCKED}} inside a cycle = a real deadlock, you need a restart; an owner {{RUNNABLE}} in {{socketRead0}} or in {{jdbc}} = a lock held across I/O, you need a code fix (shrink the locked region, or move the HTTP call outside the lock) and a restart buys you nothing. And do not forget the limits: Redis locks, MySQL row locks and message queues never show up here — for those, the evidence has to come from the DB driver log, pool metrics, or JFR.`,
      },
    ],
    check: [
      {
        q: 'A thread shows {{java.lang.Thread.State: RUNNABLE}} with {{java.net.SocketInputStream.socketRead0}} as the top frame. Which conclusion is **most correct**?',
        options: [
          'The thread is burning CPU, check {{top -H -p}} right away',
          'The thread is waiting for data from the socket: the JVM folds both "currently running" and "blocked on I/O at the OS layer" into RUNNABLE',
          'The thread is in a deadlock and needs a restart',
          'The thread finished its work and is about to be collected',
        ],
        explain: `{{java.lang.Thread}} has no "waiting on the DB" or "waiting on a socket" state, so every thread blocked in a socket read/write still reports RUNNABLE. That is exactly why a hanging API system with 30% CPU usually has hundreds of RUNNABLE entries inside {{socketRead0}} — the problem is downstream, not in the CPU. To find out whether the thread really runs, compare {{cpu=...}} across two dumps or look at {{top -H}}.`,
      },
      {
        q: 'What does the line {{- waiting on <0x000000076abba5e0> (a java.lang.Object)}} in a stack mean?',
        options: [
          'The thread wants to enter {{synchronized}} but cannot get the monitor',
          'The thread is waiting for a ReentrantLock and might be deadlocked',
          'The thread called {{wait()}}: it **released** the monitor and is waiting for {{notify()}}, so it neither holds nor waits for a lock',
          'The thread just opened a socket connection and is doing the TCP handshake',
        ],
        explain: `{{obj.wait()}} gives the monitor back to the other threads and then sleeps on that object's own **condition queue** — which is why this thread shows {{WAITING (on object monitor)}}, not {{BLOCKED}}. Two lines to keep apart: {{- waiting to lock <0xA>}} = it has not got into {{synchronized}} yet (a lock waiter), {{- waiting on <0xA>}} = it is waiting to be woken up (it is not competing for the lock). Mixing these two lines up is the classic error when counting lock contention.`,
      },
      {
        q: 'Which kind of stall does a thread dump **not** help you detect?',
        options: [
          'Two threads each holding the monitor the other one wants, forming a cycle',
          'Every worker {{pool-1-thread-*}} {{WAITING (parking)}} on the same ReentrantLock',
          'A row-lock deadlock between two MySQL transactions, or a distributed lock in Redis',
          'A thread {{BLOCKED}} whose {{elapsed}} keeps growing while its stack never changes',
        ],
        explain: `The JVM can only build the wait graph out of monitors and ownable synchronizers that belong to **itself**. Locks managed by the DB server (InnoDB row locks) or by Redis/ZooKeeper live outside the process, so they never show up; InnoDB even detects those deadlocks itself and returns error 1213. For such cases the dump only gives a symptom (the pool is out of threads, long {{socketRead}} waits), and the evidence has to come from {{information_schema.innodb_trx}} / {{sys.innodb_lock_waits}}, the driver log, or the JFR events {{jdk.JavaMonitorWait}} and {{jdk.SocketRead}}.`,
      },
      {
        q: 'Why should you take **two or three** dumps 5-10 seconds apart instead of just one?',
        options: [
          'Because each dump can only capture the first 64 threads',
          'Because one dump is a photograph: you have to compare two to know which thread stands still (really stuck) and which one still changes stack frame (slow but progressing)',
          'Because the JVM only prints the Locked ownable synchronizers section in the second dump',
          'Because the first dump is always wrong since the JVM has not reached a safepoint yet',
        ],
        explain: `A dump is a snapshot, so it tells you nothing about direction. Two snapshots side by side answer the most important question of an incident: "is this thread making progress". A thread that keeps the same stack frame and whose {{cpu}} does not increase = stuck; a thread that still jumps frames = the system is slow, not dead. As for {{Locked ownable synchronizers}}, it depends on the {{-l}} flag or {{jcmd}}, not on the order you took the dumps, and every dump is taken at a safepoint.`,
      },
    ],
  },
});
