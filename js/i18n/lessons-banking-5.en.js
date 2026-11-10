/*
 * English translation of js/data/lessons-banking.js — task T1038. Format: js/core/i18n.js (content overlay).
 * ids: lesson-banking-008
 */
App.i18n.content({
  'lesson-banking-008': {
    title: 'Daily limits under concurrent load: check-then-act, per-account locking and catching races in tests',
    goals: [
      'Explain why "read spent amount, compare with limit, then add" lets two threads exceed the limit together (check-then-act)',
      'Choose the right lock granularity: lock the whole service, lock per account, CAS loop, or atomic Redis command when running multiple instances',
      'Write a deterministic race test: start barrier, exactly N successes, many rounds, no Thread.sleep',
      'Write {{DailyLimit.tryConsume}} that never lets the total exceed the limit and resets at midnight Vietnam time using {{Clock}}',
    ],
    body: `### Two different questions behind the same limit

Lesson 3 answers the **business** question: "should this transaction go through" per the rules (how much already spent today, velocity, strong authentication). This lesson answers the **technical** question: when twenty calls arrive *at the same instant*, how do we guarantee the total amount **never** exceeds the limit — even when both calls see "room left"?

If sequential correctness were enough, the code would be simple:

~~~java
if (spent + amount <= limit) {   // STEP 1: read and check
    spent = spent + amount;      // STEP 2: write back
    return true;
}
return false;
~~~

These two steps are nanoseconds apart, and in the gap **nothing stops** another thread from stepping in. This is the **check-then-act** bug: the decision made in step 1 is based on data that is already **stale** by step 2.

### This really happens, not just in theory

- A customer taps "Transfer" twice because the app freezes for 400 ms -> two requests hit two different instances of the same service.
- One account used concurrently via app, internet banking and QR; three channels debit the **same** shared daily limit.
- A gateway times out and **retries**, while the original request is still being processed -> two real threads run in parallel.
- A transfer rejected at the approval step but debited at the order-creation step -> two debits seconds apart.

Numbers to picture: limit 100 million, already spent 95 million, 5 million left. Two 3-million commands arrive together. Both threads read {{spent = 95}}, both see {{95 + 3 <= 100}}, both write {{spent = 98}} and both add -> the real result is **101 million**, exceeding by 1 million. The more threads wedge in, the more it exceeds; with 16 threads each demanding 3 million, the average overshoot is tens of millions.

### Interleaving diagram

~~~text
Thread A (3m)                Thread B (3m)          spent (actual)
  read spent = 95                                          95
                              read spent = 95              95
  95 + 3 <= 100  => OK                                    95
                              95 + 3 <= 100 => OK         95
  write spent = 98                                          98
                              write spent = 98              101  <-- one add lost
~~~

The last line is the essence of a **race condition**: the result depends on the interleaving order of threads, which we do not control. The result can be **correct** thousands of times then wrong once — and that wrong time is money lost in production. Crucially, each read and each write on its own is "correct"; only the **combination** of two operations is wrong. That is why {{volatile}} or {{synchronized}} wrapping each individual read/write **does not** fix it — what must be locked is the **whole read + compare + write block**, not each number.

### Four fixes, by system scale

**1. Mutex on a single object.** Whoever is inside {{synchronized}} makes others wait, so nobody sees a mid-state:

~~~java
synchronized (this) {                    // only ONE thread in here at a time
    if (amount > limitPerDay - spent) return false;   // subtract style to avoid overflow
    spent += amount;
    return true;
}
~~~

Correct, but **every account** queues behind everyone else. A bank has millions of active accounts; one hot account (a teller counter, a corporate wallet) drags the whole system slow. This is a **throughput** (operations per second) problem.

**2. Per-account lock.** Instead of locking {{this}}, each account gets its own lock object. To do that you must obtain a **stable** object for a key — use {{computeIfAbsent}} of {{ConcurrentHashMap}} (guarantees only one thread creates, others receive the same object):

~~~java
Bucket b = buckets.computeIfAbsent(account, k -> new Bucket());  // always returns the SAME Bucket for same account
synchronized (b) {                                               // different accounts => no blocking
    return b.tryAdd(amount, limitPerDay, today);
}
~~~

Deadly trap in this approach: if the code **creates a new Bucket each call** ({{new Bucket()}} then locks it), two threads lock two different objects, {{synchronized}} becomes invisible — the bug still runs, single-threaded tests stay green, and it only fails under load.

**3. CAS loop (compare-and-set)** with {{AtomicLong}}: "read old value, compute new value, only write if **nobody changed it yet**" — if it changed, read again and retry, no waiting for anyone to release a lock. "CAS" is short for compare-then-swap, a CPU instruction, so no thread can wedge in between:

~~~java
while (true) {
    long cur = spent.get();                       // read current snapshot
    if (amount > limitPerDay - cur) return false; // check on snapshot
    if (spent.compareAndSet(cur, cur + amount))   // write ONLY IF value still equals cur
        return true;                              // success => nobody wedged in
    // failed => another thread just changed it => loop, read new value
}
~~~

CAS keeps latency low under low contention, but the check + write must be **one logically atomic** operation; you must not split "{{spent.get()}} then {{spent.addAndGet()}}" because the gap remains.

**4. When running multiple instances (Kubernetes, autoscaling).** {{synchronized}} only locks threads **inside one JVM** (one Java process). Production usually runs 5–20 instances, each its own JVM with its own "spent" number -> the limit is exceeded even though each instance's code is perfect. Then the shared number must live outside the JVM: in **Redis** (an in-memory key-value store all instances read/write over the network, microsecond speed) or in the database itself with an atomic update. The key point: **option 4 must be ONE atomic operation on the data side**, e.g. a Lua script on Redis or a conditional UPDATE — not "GET then SET" across two network calls:

~~~sql
-- one UPDATE is one atomic operation in the DB: check and subtract live together
UPDATE account_limit
   SET spent_today = spent_today + :amount
 WHERE account_id = :acc AND limit_day = :today
   AND spent_today + :amount <= :daily_limit;
-- affected rows = 1 => allowed; = 0 => rejected (out of limit or new day)
~~~

Quick choice table:

| Method | Correct single-thread | Correct multi-thread | Correct multi-instance | Notes |
|---|---|---|---|---|
| if then add, no lock | yes | **no** | no | only usable in sequential tests |
| {{synchronized (this)}} | yes | yes | no | simple but global bottleneck |
| Per-account lock | yes | yes | no | fine-grained, survives a hot account |
| CAS {{AtomicLong}} | yes | yes | no | low latency under low contention |
| Redis Lua / conditional UPDATE | yes | yes | **yes** | adds network cost; must guard against Redis data loss |

> Note: {{ConcurrentHashMap}} **does not** make your "read – modify – write" sequence atomic. It only guarantees each {{get}}/{{put}}/{{computeIfAbsent}} is safe. Many devs misunderstand this and believe their counter is already thread-safe.

### Day reset and where "today" comes from

A limit is "within **one day**", and a day is a time-zone concept. Vietnam changes day at 00:00 {{Asia/Ho_Chi_Minh}} = 17:00 UTC the previous day. If the server runs UTC and code calls {{LocalDate.now()}} on the system, the limit resets at **7 AM** customer time — customers are blocked all morning because "yesterday's limit spent".

Correct approach: **inject {{Clock}}** and let Clock carry the zone, {{LocalDate.now(clock)}} then yields the right day; in tests replace with {{Clock.fixed}} or a fake Clock you can "wind forward" to test new-day behavior without waiting for midnight. The data structure should be keyed by day, not overwritten:

~~~java
Map<LocalDate, Long> byDay   // {2026-11-05: 95000000, 2026-11-06: 3000000}
~~~

This way yesterday's numbers **stay queryable** for reconciliation and fraud investigation, instead of being wiped by {{spent = 0}} at midnight.

### Testing concurrent code without luck

Three rules:

1. **Start barrier.** Use {{CountDownLatch}} so 16 threads fire at the exact same moment, instead of starting them one by one (rarely collides).
2. **The result must be an invariant, not a range.** E.g. limit 20,000, each command 3,000 -> **exactly 6** commands succeed and {{spent == 18000}}. Correct code always yields 6; broken code yields 7, 8 and {{spent = 21000}}.
3. **Run enough rounds.** A race only shows when two threads truly interleave. One round may get lucky; 30–50 rounds with 16 threads makes the chance of slipping through near zero.

Never use {{Thread.sleep}} to "create a race": it only *raises the chance* of hitting the bug, proves nothing, and differing CI machine speeds make the test pass/fail unpredictably (flaky test — the cancer that erodes trust in the whole suite).

### Common pitfalls

- {{amount <= 0}} not rejected: a **negative** number *decreases* {{spent}}, i.e. an attacker sends "-50,000,000" to buy back limit.
- Writing {{spent + amount > limit}} with huge numbers: {{long}} **overflows** into a negative, the condition is always false -> every command passes. Safe form is {{amount > limit - spent}} (right side always in 0..limit).
- Returning {{true}} to the caller **before** writing the ledger: if the write fails, the app already reported "success".
- {{synchronized}} on an object recreated each call (item 2 above).
- Using {{double}} for money: 0.1 + 0.2 = 0.30000000000000004 (see lesson 1).
- Forgetting that {{tryConsume}} is **not idempotent**: the same txId sent twice is debited twice. To prevent duplicates, check txId **before** consuming limit (see lessons 5 and 6).

> Senior tip: In an interview, don't just say "add {{synchronized}} and done". A scoring answer has three layers: (1) **per-account** lock granularity because contention only happens within one account, (2) the invariant "never exceed" is held at the **single entry point** {{tryConsume}} — business code must not read {{spent}} and add itself, (3) under multiple instances the atomic operation must be pushed down to the shared data layer (Redis Lua / conditional UPDATE) and you **accept** the added network latency, keeping system-wide P99 still fine. A detail few mention: real production limit breaches usually come from gateway retries, not two users tapping at once.

### Interview link

**Question:** "How is the daily limit checked when 16 transactions of the same account arrive concurrently?"

**Answer:** First point out the bug: {{if (spent + amount <= limit) spent += amount}} is check-then-act — two threads both read {{spent}}, both see room, both write; the total exceeds the limit even though each read/write is correct. Fix by grouping check + write into **one atomic region**, and pick lock granularity by scale: within one JVM use {{synchronized}} on the **per-account** object (obtained via {{computeIfAbsent}} so it is never recreated), or a CAS loop with {{AtomicLong.compareAndSet}} when low latency matters; with multiple instances — the default on Kubernetes because autoscaling spins up extra JVMs — the JVM lock is useless, the shared number must live in the shared data layer and the check must be **atomic on the server side** (Lua script on Redis, or {{UPDATE ... WHERE spent + :amt <= :limit}} then count affected rows). For money use {{long}} whole units or {{BigDecimal}}, avoid overflow by comparing {{amount > limit - spent}}. For the day, compute {{LocalDate.now(clock)}} with a Clock carrying {{ZoneId.of("Asia/Ho_Chi_Minh")}} and keep per-day buckets so yesterday data is not lost. Finally the test: 16 threads via a {{CountDownLatch}} barrier, assert **exactly N** successes, 30–50 rounds, no {{Thread.sleep}}.`,
    exercises: [
      {
        title: 'Thread-safe DailyLimit with 16 threads',
        prompt: `Write class {{DailyLimit}} managing a **daily money limit per account**, using {{long}} for amounts (whole currency units) and {{Clock}} to determine "which day it is".

Required signatures:
- {{DailyLimit(Clock clock, long limitPerDay)}} — {{Clock}} carries the time zone; derive the day via {{LocalDate.now(clock)}}.
- {{boolean tryConsume(String account, long amount)}} — atomic: **read and add inside the same lock region**. Returns {{true}} if the day's total still does not exceed {{limitPerDay}}, {{false}} if it would (and then **nothing** is debited).
- {{long spent(String account)}} — total spent on the **current day**.
- {{long spentOn(String account, LocalDate day)}} — total spent on a specific day (old days are not deleted).
- {{long remaining(String account)}} — how much more can be spent today, never negative.
- {{int trackedAccounts()}} — number of account buckets created.

Boundary rules (all throw {{IllegalArgumentException}}): {{account}} {{null}} or empty; {{amount <= 0}}; {{limitPerDay < 0}} (checked in the constructor).

Two conditions the tests check directly:
1. 16 threads calling {{tryConsume("CA/a", 3000)}} on a limit of 20000 => **exactly 6** return {{true}} and {{spent}} equals exactly 18000, on **every** run.
2. One account must not block another: 16 accounts, each with 4 threads spending 2500 against a limit of 10000 => each account spends exactly 10000.`,
        hints: [
          'The invariant to hold: **no gap between the read command and the write command**. Wrap {{synchronized (b)}} around **both** the comparison and the addition (folded into a {{tryAdd}} helper as suggested); wrapping only the addition still leaves check-then-act.',
          'The lock object must be **stable per account**: {{buckets.computeIfAbsent(account, k -> new Bucket())}}. If you {{new Bucket()}} on every call, two threads lock two different objects and {{synchronized}} loses all effect.',
          'Compare using {{amount > limitPerDay - spent}}, not {{spent + amount > limitPerDay}} — the latter can overflow {{long}} for huge amounts, and the overflowed value **flips sign**.',
          '{{Bucket}} should keep a {{Map<LocalDate, Long>}} instead of a single number: on a new day {{spent("CA/a")}} returns 0 automatically while yesterday data survives for reconciliation.',
          '{{tryConsume}} must reject {{amount <= 0}} **before** touching the lock: a negative amount would *add* to {{spent}} and buy back limit.',
        ],
        explain: `The tests catch four layers of bugs, each matching a real interview question.

1. **The read-modify-write chain must sit in one atomic region.** The buggy version — {{if (spent + amount <= limit) spent += amount}} with the two steps **outside** the lock — is always correct single-threaded; with 16 threads contesting 20,000 at 3,000 each, some rounds let 7–8 commands through, i.e. spending 21,000–24,000. The reference wraps {{synchronized (b)}} around {{b.tryAdd(...)}} so it **always** returns exactly 6 commands and {{spent == 18000}} across all 40 rounds. The invariant is checked by an exact number, not an "acceptable range" — that is how you write a correct concurrent test.

2. **Lock granularity decides survival.** Locking {{this}} is also correct, but one hot account turns the whole bank's limit into a single queue. Because each {{Bucket}} is created **once** via {{computeIfAbsent}} (this method of {{ConcurrentHashMap}} is itself atomic — two threads arriving first still yield only one Bucket), the "{{wrong == 0}}" in the 16 accounts × 4 threads part proves accounts do not contaminate each other in either data or progress.

3. **"Day" is data, not system time.** {{LocalDate.now(clock)}} with a Clock carrying {{Asia/Ho_Chi_Minh}} makes the instant {{2026-11-05T17:30:00Z}} (fundamentally UTC) fall on **06/11** Vietnam time, and the test asserts exactly that day. If you use {{Instant.now()}} or {{LocalDate.now()}} on the system, the same transaction lands on different days depending on the server's zone — and no test detects it.

4. **Amounts and counts must be guarded at the entry.** {{amount <= 0}} and an empty {{account}} are blocked before taking the lock, so there is no path to "add negative money" and shrink {{spent}}. The test deliberately runs a failing {{tryConsume}} then asserts {{spent}} is unchanged, because the common bug is writing {{spent}} first and only then returning {{false}}.

**Getting this exercise right is not enough**: {{tryConsume}} is not idempotent. Two requests with the same txId are debited twice, and in production that is the number-one source of limit breaches. So after the limit check there must still be a check that the txId has not already consumed limit (lessons 5, 6). If the system runs multiple instances, {{synchronized}} is only **part** of the solution — the rest is an atomic operation at the shared data layer (Redis Lua / conditional UPDATE), see the comparison section in the lesson.`,
      },
    ],
    check: [
      { q: 'What makes a limit check wrong under multiple threads?', options: ['Because reading {{spent}} is slower than writing', 'Because checking and writing are two separate steps and another thread wedges in between', 'Because {{long}} cannot be added in parallel', 'Because HashMap is not ordered'], answer: 1, explain: 'Check-then-act: the data read during the check is already stale by the time the write runs. Only locking both steps together fixes it.' },
      { q: 'Why lock per account instead of the whole service?', options: ['Because a bigger lock is always safer', 'Because an account has only one limit', 'Because contention only happens within one account; fine-grained locking keeps other accounts from waiting', 'Because {{synchronized}} cannot be used on {{this}}'], answer: 2, explain: 'Lock granularity decides parallelism: one hot account must not block thousands of other accounts.' },
      { q: 'When the service runs 10 instances on Kubernetes, is {{synchronized}} inside the JVM still enough?', options: ['Still enough, because instances share one memory', 'No, each instance is its own JVM; the atomic operation must be pushed down to Redis or the database', 'Just add {{volatile}} to the counter', 'Increase the thread pool size'], answer: 1, explain: 'A lock only works inside one JVM. Multiple instances need a shared resource with a server-side atomic operation.' },
      { q: 'Which of the following should NOT be used to test a race bug?', options: ['A CountDownLatch barrier so threads start together', 'Asserting an exact number (exactly 6 successes)', 'Running 40 rounds to increase the chance of exposing the bug', 'Thread.sleep 200 ms to make sure threads overlap'], answer: 3, explain: 'Sleep only raises the probability, it guarantees nothing; differing CI machine speeds make the test pass/fail unpredictably (flaky).' },
    ],
  },
});
