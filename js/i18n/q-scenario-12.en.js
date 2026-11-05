/*
 * English translation of js/data/q-scenario.js — task T659. Format: js/core/i18n.js (content overlay).
 * ids: scenario-087 scenario-088 scenario-089 scenario-090 scenario-091 scenario-092 scenario-093 scenario-094 scenario-095 scenario-096 scenario-097 scenario-098 scenario-099 scenario-100 scenario-101 scenario-102 scenario-103
 */
App.i18n.content({
  'scenario-087': {
    q: 'Review this PR (AI-generated code). The snippet below uses ConcurrentHashMap to count accesses per userId. Find the bugs and the fix.\n~~~java\npublic class AccessCounter {\n    private final ConcurrentHashMap<String, Integer> counts = new ConcurrentHashMap<>();\n    public void hit(String userId) {\n        if (!counts.containsKey(userId)) {\n            counts.put(userId, 1);\n        } else {\n            counts.put(userId, counts.get(userId) + 1);\n        }\n    }\n    public int get(String userId) {\n        return counts.getOrDefault(userId, 0);\n    }\n}\n~~~',
    a: `**Summary:** the snippet has two real bugs: check-then-act on ConcurrentHashMap is not atomic (two threads with the same userId can overwrite each other and lose a count), and using {{Integer}} with {{get+put}} instead of {{AtomicInteger}}/{{LongAdder}} means every increment allocates a new object and still is not atomic. Fix it with {{merge}} or {{compute}} holding a {{LongAdder}}; if you only need a global total, a single {{LongAdder}} is enough.

### Bugs by severity

**1. Critical — lost counts because of a race condition (check-then-act).**
Two threads hit the same userId: both see {{containsKey == false}}, or both {{get}} and then {{put}}, so one hit is overwritten. Under heavy traffic the counter ends up lower than reality — it fails silently, which makes it very hard to notice.

**2. Major — immutable Integer + get/put instead of an atomic counter.**
{{counts.get(userId) + 1}} creates a new Integer object every single time; under load that produces GC pressure. At the same time it does not solve the race at all.

**3. Minor — get() can return null when you do not use getOrDefault (fine here), and there is no safe snapshot for reporting.**

### The fix
~~~java
public class AccessCounter {
    private final ConcurrentHashMap<String, LongAdder> counts = new ConcurrentHashMap<>();
    public void hit(String userId) {
        counts.computeIfAbsent(userId, k -> new LongAdder()).increment();
    }
    public long get(String userId) {
        LongAdder a = counts.get(userId);
        return a == null ? 0 : a.sum();
    }
}
~~~
{{computeIfAbsent}} + {{LongAdder}}: atomic, low contention (LongAdder splits its value into per-thread cells), no allocation per increment.

### How to phrase it in a review
"This logic is correct single-threaded, but production runs many threads. Two issues: check-then-act is not atomic, and Integer is immutable so every increment allocates. I suggest LongAdder + computeIfAbsent — it is both correct and fast. If we only need a global total, one shared LongAdder is simpler."

### When to use what
- Counting per key with many threads: {{ConcurrentHashMap<String, LongAdder>}}.
- Only a global total: a single {{LongAdder}}.
- A consistent snapshot across many keys: copy the map and then sum, or use {{AtomicLongMap}} (Guava).

> Senior tip: when reviewing AI-generated code I always ask "can this run concurrently?" — AI tends to write code that is only correct single-threaded. ConcurrentHashMap protects the map itself, not your check-then-act logic; you have to use compute/merge/Atomic* to be safe.`,
    follow: [
      'How does LongAdder differ from AtomicLong, and when do you pick which one?',
      'If the counter must reset every day, how do you design it so no count is lost?'
    ],
  },

  'scenario-088': {
    q: 'Review this PR (AI-generated code). The order service creates an order and calls the payment gateway inside @Transactional. Find the bugs.\n~~~java\n@Service\npublic class OrderService {\n    @Transactional\n    public Order createOrder(Cart cart) {\n        Order order = orderRepo.save(new Order(cart));\n        paymentClient.charge(order.getId(), cart.total());\n        order.setStatus(PAID);\n        return orderRepo.save(order);\n    }\n}\n~~~',
    a: `**Summary:** two serious bugs: (1) calling HTTP inside the transaction keeps the DB connection busy for a long time, which easily exhausts the pool and holds locks; (2) if the payment succeeds but the second save fails, the money has already been captured while the order is not PAID (inconsistency). Fix it with the outbox pattern: write the order as PENDING inside the transaction, publish an event after commit, and let a worker call the payment and update the status.

### Bugs by severity

**1. Critical — an HTTP call inside the transaction.**
The transaction holds the DB connection for the whole duration of the charge (a few hundred milliseconds up to several seconds). Under load: connection pool exhaustion, the order row locked for a long time, deadlock with other flows.

**2. Critical — inconsistent state when the payment succeeds but the DB fails.**
paymentClient.charge already captured the money, then the second save throws → the transaction rolls back → the order is gone but the money is gone too. There is no compensation mechanism at all.

**3. Major — not idempotent.**
If createOrder is retried (because of a client timeout), the charge runs again → the customer is debited twice. An idempotency key is needed.

**4. Minor — @Transactional by default only rolls back on RuntimeException; if charge throws a checked exception there is no rollback.**

### The fix (outbox)
~~~java
@Transactional
public Order createOrder(Cart cart) {
    Order order = orderRepo.save(new Order(cart, PENDING));
    outboxRepo.save(new OutboxEvent("OrderCreated", order.getId()));
    return order; // commit the tx, the connection goes back to the pool
}
// an AFTER_COMMIT listener calls the payment asynchronously and sets PAID/FAILED
~~~
The payment client uses idempotency key = orderId.

### How to phrase it in a review
"I see two production-critical problems: HTTP inside the transaction holds a connection for a long time, and the money/order state can diverge. I suggest outbox: write the PENDING order + the event inside the transaction, and let a worker call the payment after commit with an idempotency key. The HTTP call moves outside the transaction."

> Senior tip: when reviewing AI-generated code that touches the DB/transactions, I always look for "is there any network call inside @Transactional?" — AI tends to put everything into one transactional method to keep it "simple", which is the classic source of pool exhaustion and data inconsistency.`,
    follow: [
      'How does the outbox pattern work, and why not use @TransactionalEventListener directly?',
      'How do you design an idempotency key for a payment gateway?'
    ],
  },

  'scenario-089': {
    q: 'Review this PR (AI-generated code). It reads a config file and makes an HTTP call, and the exception is swallowed. Find the bugs.\n~~~java\npublic String loadConfig(String url) {\n    InputStream in = null;\n    HttpURLConnection c = null;\n    try {\n        c = (HttpURLConnection) new URL(url).openConnection();\n        in = c.getInputStream();\n        return new String(in.readAllBytes(), UTF_8);\n    } catch (Exception e) {\n        log.warn("load failed");\n        return null;\n    }\n}\n~~~',
    a: `**Summary:** three bugs: (1) the InputStream/HttpURLConnection are never closed → connection leak; (2) the exception is swallowed (only a warn log, then it returns null) → the caller has no idea a failure happened and debugging becomes very hard; (3) readAllBytes() loads the whole response into RAM, so a large response causes OOM. Fix it with try-with-resources, throw an exception that carries context, and stream the response with a size limit.

### Bugs by severity

**1. Critical — connection leak.**
{{InputStream}} and {{HttpURLConnection}} are never closed. Every call leaks one connection; after a few thousand calls the pool is exhausted and requests hang.

**2. Major — swallowed exception.**
{{catch (Exception e)}} only logs a warning and returns null. The caller cannot tell "there is no data" apart from "the network failed", and the stack trace is lost. Debugging this in production is extremely hard.

**3. Major — readAllBytes loads the whole body into RAM.**
If the response is large (or the endpoint is attacked and returns a huge payload), you get OOM. You need a size limit and timeouts.

**4. Minor — no connect/read timeout is set → the call can hang forever.**

### The fix
~~~java
public String loadConfig(String url) throws IOException {
    HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
    c.setConnectTimeout(5000);
    c.setReadTimeout(5000);
    try (InputStream in = c.getInputStream()) {
        byte[] buf = in.readNBytes(1 << 20); // cap the read at 1MB
        return new String(buf, StandardCharsets.UTF_8);
    } finally {
        c.disconnect();
    }
}
~~~

### How to phrase it in a review
"I see a connection leak (the stream is never closed), a swallowed exception (returning null hides the failure), and the whole response loaded into RAM. I suggest try-with-resources, setting timeouts, capping the size, and propagating the exception or wrapping it with context. The current warn log is not good enough for production."

> Senior tip: when reviewing AI-generated code that does I/O, I always check "are the resources closed, does the exception propagate, are there timeouts" — these three questions catch most production network/file bugs.`,
    follow: [
      'When should an HTTP client retry, and when should it fail fast?',
      'How do you limit the response size to protect against OOM?'
    ],
  },

  'scenario-090': {
    q: 'Review this PR (AI-generated code). It uses an object as a key in a HashSet. Find the bugs.\n~~~java\npublic class UserKey {\n    private String name;\n    public UserKey(String name) { this.name = name; }\n    public String getName() { return name; }\n    public void setName(String name) { this.name = name; }\n    @Override\n    public boolean equals(Object o) {\n        return o instanceof UserKey && ((UserKey)o).name.equals(name);\n    }\n}\nSet<UserKey> set = new HashSet<>();\nset.add(new UserKey("a"));\nSystem.out.println(set.contains(new UserKey("a")));\n~~~',
    a: `**Summary:** two bugs: (1) {{equals}} is overridden but {{hashCode}} is not → the contract is broken and HashSet lookup fails (it prints false) because the bucket differs; (2) the key is mutable (setName) → if you mutate it after adding, the hash bucket is wrong and the object "disappears" from the set/map. Fix: override hashCode as well, and make the key immutable.

### Bugs by severity

**1. Critical — equals without hashCode.**
The Object contract says equal objects must return the same hashCode. HashSet uses hashCode to choose the bucket; two equal objects with different hashCodes land in different buckets → contains returns false (it prints false). This is a textbook bug.

**2. Critical — mutable key.**
{{setName}} allows changing name after the object has already been added to the set. The bucket was chosen from the old hashCode; after the mutation the hashCode changes → the object can never be found again (it is "lost" inside the collection). Keys used in HashMap/HashSet must be immutable.

**3. Minor — equals is not null-safe (a null name throws NPE) and does not use Objects.equals.**

### The fix
~~~java
public final class UserKey {
    private final String name;
    public UserKey(String name) { this.name = Objects.requireNonNull(name); }
    public String getName() { return name; }
    @Override public boolean equals(Object o) {
        return o instanceof UserKey && Objects.equals(name, ((UserKey)o).name);
    }
    @Override public int hashCode() { return Objects.hash(name); }
}
~~~

### How to phrase it in a review
"I see an equals/hashCode contract violation: overriding equals without hashCode makes HashSet lookups wrong. And the key is mutable: mutating it after add makes the object disappear from the collection. I suggest an immutable key plus overriding both methods, using Objects.equals/hashCode."

> Senior tip: when reviewing AI-generated code that uses an object as a Map/Set key, I always check "are both equals and hashCode overridden, and is the key mutable?" — AI often overrides only one of them or leaves the setter in.`,
    follow: [
      'Why does a Java 16+ record solve this problem automatically?',
      'If the key really has to be mutable, how do you handle it?'
    ],
  },

  'scenario-091': {
    q: 'Review this PR (AI-generated code). Retry when calling the payment gateway. Find the bugs.\n~~~java\npublic PaymentResult charge(String orderId, BigDecimal amount) {\n    int attempts = 0;\n    while (attempts < 3) {\n        try {\n            return gateway.charge(orderId, amount);\n        } catch (Exception e) {\n            attempts++;\n            if (attempts == 3) throw e;\n        }\n    }\n    throw new IllegalStateException("unreachable");\n}\n~~~',
    a: `**Summary:** retry with no backoff/jitter → thundering herd when the gateway gets slow; retrying every exception (including 4xx / insufficient funds) → the customer is charged wrongly again; not idempotent → a retried charge can debit twice. Fix: retry only transient errors (5xx, timeout, 429), exponential backoff + jitter, and idempotency key = orderId.

### Bugs by severity

**1. Critical — not idempotent.**
A retried charge can debit twice if the first attempt was actually processed by the gateway but the response timed out. You need an idempotency key (orderId) sent along so the gateway can deduplicate the request.

**2. Critical — retrying every exception.**
Retrying a wrong amount or insufficient funds (4xx) is useless and can still cause side effects. Only retry transient failures: 5xx, timeout, connection refused, 429.

**3. Major — no backoff/jitter.**
Retrying immediately → when the gateway slows down, every client retries at the same moment → thundering herd, and the gateway becomes even slower.

**4. Minor — no per-attempt logging, no metrics, and no bound on total elapsed time.**

### The fix
~~~java
public PaymentResult charge(String orderId, BigDecimal amount) {
    for (int i = 0; i < 3; i++) {
        try {
            return gateway.charge(orderId, amount, orderId); // idempotency key
        } catch (TransientPaymentException e) {
            if (i == 2) throw e;
            long backoff = (long)(Math.pow(2, i) * 100 + Math.random() * 100);
            sleep(backoff);
        }
    }
    throw new IllegalStateException("unreachable");
}
~~~

### How to phrase it in a review
"The retry is missing three production-critical things: an idempotency key (prevents charging twice), exception classification (retry only transient errors), and backoff+jitter (prevents a thundering herd). I suggest fixing all three; for payments, idempotency is mandatory."

> Senior tip: when reviewing AI-generated code that contains retry, I always ask "is the retry idempotent, does it have backoff+jitter, and which exceptions does it retry?" — these three questions decide whether a retry is safe or just amplifies the incident.`,
    follow: [
      'How do you design an idempotency key for a payment gateway?',
      'Exponential backoff with jitter: full jitter vs decorrelated jitter?'
    ],
  },

  'scenario-092': {
    q: 'Review this PR (AI-generated code). A static cache and date formatting. Find the bugs.\n~~~java\npublic class UserCache {\n    private static final Map<String, User> cache = new HashMap<>();\n    private static final SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");\n    public User get(String id) {\n        return cache.computeIfAbsent(id, k -> loadFromDb(k));\n    }\n    public String formatDate(Date d) {\n        return sdf.format(d);\n    }\n}\n~~~',
    a: `**Summary:** three bugs: (1) a static HashMap is not thread-safe and has no size limit → race condition plus memory leak (the cache keeps growing); (2) SimpleDateFormat is not thread-safe and is shared as a static field → corrupted date output when several threads use it; (3) the cache has no TTL/eviction → stale data and eventual OOM. Fix: ConcurrentHashMap + Caffeine (size + TTL), and DateTimeFormatter (immutable, thread-safe) instead of SimpleDateFormat.

### Bugs by severity

**1. Critical — SimpleDateFormat shared between threads.**
SimpleDateFormat is not thread-safe. Several threads formatting at the same time → wrong, nondeterministic results, sometimes even ArrayIndexOutOfBounds. This is a textbook production bug.

**2. Critical — static HashMap that is not thread-safe.**
{{computeIfAbsent}} on a HashMap is not atomic → race condition, lost entries, or an infinite loop (Java 7) / data corruption. You must use ConcurrentHashMap.

**3. Major — unbounded cache with no TTL.**
The cache grows with the number of users → memory leak; and the data goes stale (a user renames themselves but the cache keeps the old value). You need a size limit + TTL + eviction.

**4. Minor — loadFromDb runs inside computeIfAbsent and holds the map lock → if the DB is slow it blocks every other thread on the same map (with CHM this is the lock on that bin/stripe).**

### The fix
~~~java
public class UserCache {
    private static final Cache<String, User> cache = Caffeine.newBuilder()
        .maximumSize(10_000).expireAfterWrite(5, java.util.concurrent.TimeUnit.MINUTES).build();
    private static final DateTimeFormatter FMT =
        DateTimeFormatter.ofPattern("yyyy-MM-dd");
    public User get(String id) { return cache.get(id, k -> loadFromDb(k)); }
    public String formatDate(LocalDate d) { return FMT.format(d); }
}
~~~

### How to phrase it in a review
"I see three problems: a thread-unsafe SimpleDateFormat shared as a static field (corrupts dates), a HashMap that is not thread-safe, and a cache with no size limit and no TTL (leak + stale). I suggest Caffeine (size+TTL) and the immutable DateTimeFormatter. If we cannot add a library, use ConcurrentHashMap + manual eviction."

> Senior tip: when reviewing AI-generated code that has a cache/static field, I always ask "is it thread-safe, is it size-bounded, does it have a TTL, can it go stale?" — these four questions catch most production cache bugs.`,
    follow: [
      'How does Caffeine differ from Guava Cache?',
      'When should you cache locally vs in a distributed cache (Redis)?'
    ],
  },

  'scenario-093': {
    q: 'In your first week you inherit a Java 8 monolith with old Struts/Spring, Oracle, and no tests, and the person who wrote it has quit. How do you start without breaking anything?',
    a: `**Summary:** do not change anything yet — prioritize observing, stand up a safe environment, draw a map of the system, find the people who still remember, and write everything down. The goal is to understand enough to change things safely, not to understand the whole system immediately.

### Clarify the requirements
- What is the system used for (which business functions matter), is there an SLA?
- How do dev/test/staging/prod differ, and what access rights do you have?
- Who can still answer questions (former PM, BA, DBA, support)? Is any documentation left over?

### Step-by-step investigation
- **Step 1: Quick map** — list the main modules, entry points (web.xml/servlet, old Spring config), dependencies, and the most important business flows.
- **Step 2: Stand up the environment** — find the {{README}}, the old {{build.xml}}/{{pom.xml}}, startup scripts, DB config; recreate local/staging as closely as you can. If you cannot get it running immediately, read code instead of guessing.
- **Step 3: Observe reality** — look at recent logs, slow queries, production-like configuration, and test data (if any exist). Pay attention to the batches/cron jobs that run overnight.
- **Step 4: Find the "survivors"** — ask support/ops about recent incidents, recurring errors, and which modules "not to touch".
- **Step 5: Take notes** — create a short {{runbook.md}}: how to start/stop, the important config, the main flows, who to contact.

### A concrete example
Suppose you find a Struts Action that handles "fund transfer". Instead of editing it right away, you trace it: Action → Service → DAO → Oracle Procedure. Write down the call order, the transaction boundaries, and the rollback conditions.

### Pitfalls
- **Reading the code top to bottom** — inefficient. Prioritize the business flows you will actually have to change later.
- **Blindly changing configuration** — one old property can affect an entire batch.
- **Trusting old comments** — the code has drifted far away from its comments.

> Senior tip: in the first week, the most valuable outcome is not "fixing a bug" but "a trustworthy map". One page of diagrams plus a list of "dangerous modules" will save you many times later on.`,
    follow: [
      'How do you decide which module matters most and should be read first?',
      'When there is nobody left to ask and no tests, how do you reduce the risk of a change?'
    ],
  },

  'scenario-094': {
    q: 'You receive a production support ticket: a customer reports a wrong balance/transaction. Following ITIL, how do you handle it (incident → problem → change), and how do the P1-P4 SLAs matter?',
    a: `**Summary:** classify the severity (P1-P4) by impact and urgency, acknowledge the ticket and limit the damage first (containment), investigate safely (never edit production directly), find the root cause, turn it into a Problem if it recurs, and propose a Change that gets approved through the proper process.

### Clarify the requirements
- What priority is it: P1 (whole system / a critical banking service) needs a response within minutes, while P4 can be handled on a normal schedule.
- Do you have access to production logs and a read-only DB? Who is allowed to make changes?
- Is there a hotline/on-call rota and an escalation procedure?

### Step-by-step process
- **Incident** — record it: ticket ID, time reported, who reported it, symptoms, number of transactions affected. Set P1-P4 according to the SLA.
- **Containment** — the priority is to stop it spreading: temporarily disable the affected feature, publish a fallback instruction, notify the right people (on-call, DBA, security).
- **Investigation (safe)** — read-only only: logs (app/log server), traces, read-only DB queries, APM. Never run UPDATE/DELETE on production without approval.
- **Root cause & workaround** — narrow the cause down (time, user, ref_no). Provide a temporary workaround if one exists and state clearly when it was applied.
- **Problem** — if the issue recurs several times or the impact is large, open a Problem ticket, collect the evidence, and propose a long-term solution.
- **Change** — raise a Change Request (description, impact, rollback plan, test plan), take it to the CAB (Change Advisory Board) if required, and only implement it inside an approved change window.

### SLA example
| Level | Impact | Response | Recovery target |
|---|---|---|---|
| P1 | All critical transactions stopped | Immediately (within minutes) | Very fast, per the committed SLA |
| P2 | Many users affected | Quick | High priority |
| P3 | Few users / not critical | Within business hours | Scheduled |
| P4 | Small request | Scheduled | Scheduled |

### Pitfalls
- **Fixing first and recording later** — the investigation trail must be complete (who, when, which query).
- **Skipping the Problem** — hand-fixing forever without a real fix means the incident keeps coming back.
- **Changing outside the change window** — most large companies forbid it, except a documented P1 emergency process.

> Senior tip: the strong interview answer is "I prioritize containment first, investigate read-only, record every piece of evidence, and only fix through an approved Change (or the documented emergency process)".`,
    follow: [
      'What is the difference between an Incident and a Problem in ITIL?',
      'When is an emergency hotfix allowed outside the change window?'
    ],
  },

  'scenario-095': {
    q: 'You have to ship an urgent bug fix (hotfix) in code that has no tests. What do you do to stay as safe as possible?',
    a: `**Summary:** write a characterization test (a test that describes the current behavior, without touching the code), understand the intended behavior versus the actual behavior, make the smallest possible change, add a rollback plan, test carefully, then add a regression test.

### Clarify the requirements
- What does the bug affect (money/customers), and how urgent is it?
- Can you reproduce it locally or on staging?
- Is someone available to review it quickly?

### Step-by-step process
- **Step 1: Reproduce** — recreate the bug with data as close to production as possible. Record the input, the wrong output, and the expected output.
- **Step 2: Characterization test** — write a test that "locks in" the current behavior (even when it is wrong, you need to know its boundaries). The purpose is to detect whether you accidentally changed something else.
- **Step 3: Find the cause** — trace the code, examine the conditions, the transaction boundaries, the side effects. It is usually a missing condition, a null, or a wrong format.
- **Step 4: Smallest change** — fix exactly the spot that causes the bug and avoid refactoring "while I am in here". Add the if/guard carefully.
- **Step 5: Verify** — run the characterization test plus the related tests, and manually walk through the bug scenario.
- **Step 6: Rollback plan** — prepare the revert script or a feature flag so you can switch the change off immediately if something goes wrong.
- **Step 7: Add a regression test** — after the fix, write a proper test for the buggy case so it cannot come back.

### A simple example
Before the fix: write a test that calls the method with the case that triggers the bug and run it to see pass/fail against the current behavior. After the fix, the new test must pass while the characterization tests still pass for all the other cases.

### Pitfalls
- **Making large changes under pressure** — the more you change, the harder the rollback.
- **No rollback plan** — you must already know "if this gets worse, what do I do in the next 5 minutes?".
- **Testing only the bug case** — side effects get missed easily.

> Senior tip: my rule is "test first, change small, rollback ready". In a hotfix, safety matters more than elegance.`,
    follow: [
      'How does a characterization test differ from a normal unit test?',
      'How do you make sure the rollback plan is actually usable?'
    ],
  },

  'scenario-096': {
    q: 'The release process at a large company: Change Request, CAB approval, a nightly release window, a year-end freeze. How do you prepare?',
    a: `**Summary:** prepare a complete Change Request (description, impact, testing, rollback), submit it to CAB on time, respect the window and the freeze, notify everyone affected, execute against a checklist, verify after the release, and close the change.

### Clarify the requirements
- When is the release window, and who has the right to deploy?
- What are the rules during the freeze period (usually year-end / important business dates)?
- Is a signed-off UAT still required?

### Preparation checklist
- **Change Request (CR)** — summary of the change, the reason, the impact (users/modules), the risk, and the mitigation.
- **Test plan** — unit/integration/regression already executed, UAT signed off by the business (if required).
- **Rollback plan** — how to revert quickly, who has the authority, and the estimated duration.
- **Deployment plan** — deploy order, config changes needed, scripts, and who is responsible for each step.
- **Communication** — notify support/ops/BA before the release.

### Process
- **Before** — open the CR, attach the documents, register with CAB (when mandatory). During a freeze period you normally need a special justification and higher-level approval.
- **Inside the window** — deploy only what the approved CR says. Log every step. Have someone monitoring.
- **After** — run the critical smoke tests, check logs/errors, confirm with business/support. Update the CR status.

### Notes
- **CAB** — it exists not to "ask permission for the code" but to review cross-system impact (many systems depend on each other).
- **Nightly release window** — usually chosen to reduce user impact, and a backup must already be in place.
- **Freeze period** — non-emergency releases are banned. Emergency hotfixes still have their own process.

> Senior tip: a good CR is one where someone who never reads the code still understands "what will be affected and how we get back". If the rollback plan is vague, CAB will very likely ask for more detail.`,
    follow: [
      'What is the difference between a normal, a standard, and an emergency change?',
      'How do you argue for a release during a freeze period?'
    ],
  },

  'scenario-097': {
    q: 'The nightly batch job/cron (EOD, reconciliation, reports) has been getting slower year after year. How do you investigate and optimize it without corrupting data?',
    a: `**Summary:** do not optimize in a hurry — measure a baseline, find the bottleneck (SQL, I/O, locks), optimize safely (index, partitioning, cursor), parallelize under control, and always back up and verify the reconciliation figures.

### Clarify the requirements
- What does the job process, what does it depend on, and is there a deadline it must finish before the market opens?
- How does the data volume grow, and is the table partitioned?
- Can you test on a copy of the data?

### Investigation
- **Time** — measure each step, log the start/end time of every phase.
- **SQL** — run {{EXPLAIN (ANALYZE)}} on the main queries: are the indexes actually used, are the statistics stale?
- **Resources** — CPU/IO/wait, locks/blocks, temp tablespace usage.
- **Data** — row counts across the years, dead rows, fragmentation.

### Safe solutions
- **The right indexes** — add indexes for the filter/join conditions the batch uses (the UI does not need them).
- **Process in small batches** — instead of one huge transaction, commit per chunk (e.g. 1000-10000 rows) to shorten lock holding.
- **Cursor/streaming** — avoid loading everything into a List.
- **Partitioning** — process month/year partitions separately.
- **Controlled parallelism** — split by ID range and bound the number of threads.
- **Reconciliation** — compare the totals before and after (row counts, sum of money); this is mandatory.

### Pitfalls
- **Changing the logic directly against production data** — you must test on a copy.
- **One giant transaction** — a rollback then takes a long time and locks are held for a long time.
- **No reconciliation** — finishing the optimization with wrong data is a disaster.

> Senior tip: the safest way to optimize a batch is "measure → hypothesize → try small → measure again". Always have reconciliation figures both before and after the run.`,
    follow: [
      'When should a batch run in parallel vs sequentially?',
      'How do you guarantee data integrity after the optimization?'
    ],
  },

  'scenario-098': {
    q: 'You must upgrade a library that has a CVE (Log4Shell-style) across dozens of legacy services. How do you organize the work?',
    a: `**Summary:** inventory everything, assess blast radius and exploitability, prioritize the highest risk, upgrade with regression testing, coordinate the rollout, and keep a rollback plan.

### Clarify the requirements
- CVE severity (Critical/High), CVSS score, is there a public exploit?
- Does it affect runtime or only compile time?
- Can you patch quickly, or does it require a major version upgrade?

### Process
- **Inventory** — list every service, its pom.xml/build file and dependency tree ({{mvn dependency:tree}}, {{gradle dependencies}}). Include transitive dependencies.
- **Assessment** — determine which services actually use the affected library, whether an exploitable code path exists, and whether the environment is public or internal.
- **Prioritization** — Critical + public/exposed first, internal ones afterwards.
- **Remediation** — prefer the fixed version, or exclude the transitive dependency and add a safe version, or apply temporary mitigations (WAF/config) when you cannot upgrade immediately.
- **Testing** — build, unit tests, smoke tests, and the important regression tests.
- **Deployment** — coordinate inside the change window and roll out progressively (canary) where possible.
- **Verification** — scan again (dependency check) and confirm no vulnerable version remains anywhere.

### Pitfalls
- **Fixing only one place** — transitive dependencies are easy to miss.
- **A major upgrade with breaking changes** — read the changelog and test thoroughly.
- **Scanning without fixing** — there has to be a clear timeline.
- **Forgetting container images** — the base image may carry the old library too.

> Senior tip: for a Critical CVE, "patch fast and safe" matters more than "patch perfectly". If you cannot upgrade right away, apply a temporary mitigation and keep a plan for the full upgrade.`,
    follow: [
      'How do you find the affected transitive dependencies?',
      'When the upgrade causes dependency conflicts, how do you resolve them?'
    ],
  },

  'scenario-099': {
    q: 'Persuading management to pay down technical debt: measuring it, proposing it step by step instead of rewriting everything. How do you go about it?',
    a: `**Summary:** do not say "rewrite it", say "reduce risk and save cost". Measure the impact, pick the single worst pain point, propose a strangler fig, and prove the value with small numbers before scaling up.

### Clarify the requirements
- Which tech debt costs the most (bugs, slowness, difficulty of making changes)?
- Is there time for it, or a refactor budget?
- How do you measure ROI?

### How to persuade
- **Measure** — time to fix a bug, time to add a feature, number of incidents tied to the old module, on-call cost.
- **Pick one "pain point"** — only the single module that hurts the most; do not list 100 things.
- **Propose incremental work** — Strangler Fig: wrap the old module behind a facade, replace it piece by piece, while everything keeps running normally.
- **Prove it small** — run a 1-2 week POC and measure before/after (for example how much faster a feature ships).
- **Do the math** — "we spend X hours every month on fixes for this; cutting that by 50% saves Y per year".

### Strangler Fig in short
1. Identify a clear boundary (API/interface)
2. Build the new module next to it
3. Route traffic to the new module gradually (feature flag)
4. Switch the old module off step by step

### Pitfalls
- **"A cleaner rewrite"** — unconvincing on its own.
- **Big bang rewrite** — very high risk, and almost always late and more expensive.
- **Not measuring** — then you cannot prove the value.

> Senior tip: managers understand "business risk" better than "clean code". Say "less outage time", "lower on-call cost", "features ship faster" instead of "it violates SOLID".`,
    follow: [
      'How does Strangler Fig differ from a big bang rewrite?',
      'How do you measure the ROI of a refactor objectively?'
    ],
  },

  'scenario-100': {
    q: 'Working with many teams and vendors (an external core banking vendor, a DBA team, the infrastructure team): who is responsible for what, and how do you write a request so it actually gets handled?',
    a: `**Summary:** be explicit about RACI (Responsible/Accountable/Consulted/Informed), write a short request that carries context and impact, provide evidence, follow up on the correct channel, and respect the authority of the other teams.

### Clarify the requirements
- What is each party's scope, and what is their response SLA?
- What is the official communication channel (ticket system)?
- Who gives the approval?

### How to write an effective request
- **Context** — why it is needed (incident/feature) and what is affected.
- **Concrete description** — the exact action required, not "please take a look for me".
- **Evidence** — logs, screenshots, trace ID, SQL plan.
- **Impact/Urgency** — P1/P2 when it is urgent.
- **Acceptance criteria** — when is the work considered done?
- **Env** — prod/staging, and the time window needed.

### A good example
"DBA team, please create an index CONCURRENTLY on the TRANSACTIONS table (prod) using the attached script. Impact: the list API is slow, from 5s down to a target of <500ms. I need review/approval inside the release window 22:00-02:00."

### Pitfalls
- **A vague request** — "fix performance" is not enough.
- **Sending it to several channels at once** — creates confusion about who owns it.
- **Not following RACI** — you ask the wrong person.
- **Skipping the process** — every team has its own process for a reason.

> Senior tip: write the request as if you were the person receiving it after a role swap. Give enough information that they do not have to ask back three times.`,
    follow: [
      'When should you escalate instead of waiting?',
      'How do you handle it when the vendor refuses with "out of scope"?'
    ],
  },

  'scenario-101': {
    q: 'You need to document and hand over a system so that you do not become "the only person who knows it". What do you do?',
    a: `**Summary:** focus on what people actually use (runbook, a simple architecture diagram, ADRs, a contact list) rather than writing a 100-page document. Prioritize by asking "if I were away for a week, what could somebody else do?".

### Clarify the requirements
- Who is taking over, and at what experience level?
- How long is the handover period?
- Which parts matter most?

### Documents worth writing
- **Runbook** — how to start/stop, health checks, common issues + fixes, rollback, escalation.
- **System overview** — a simple diagram (components, DB, external systems) plus the main flows.
- **Architecture Decision Record (ADR)** — the important decisions + the reasons + the trade-offs.
- **Config & secrets** — where the config lives, how to retrieve it, who has access.
- **Batch/cron** — schedule, dependencies, how to debug it.
- **Contacts** — who to contact per module.
- **Known gotchas** — "do not touch this part", old workarounds still in use.

### Process
- **Shadow** — let the successor watch you handle real tickets together with you.
- **Pair** — do it together 2-3 times.
- **Handover review** — walk through the runbook and try hypothetical scenarios.
- **Document as you go** — write it down while handling an issue, do not save it for the end.

### Pitfalls
- **Writing too much detail** — it becomes outdated quickly.
- **Describing only the code** — describe "how the system is operated" instead.
- **Never updating it** — stale documentation is more dangerous than none.

> Senior tip: the goal is "bus factor > 1". If only one person understands the system, that is an organizational risk, not "personal knowledge".`,
    follow: [
      'What is the difference between a runbook and a design doc?',
      'How do you make sure the documentation is really used?'
    ],
  },

  'scenario-102': {
    q: 'Interview question: "Tell me about your experience maintaining a legacy system" — how do you answer so it shows Senior capability without putting other people down?',
    a: `**Summary:** use STAR (Situation/Task/Action/Result) with concrete numbers, focus on how you reduced risk and helped the team operate better, not merely on "fixing bugs". Avoid criticizing the old code; emphasize what you learned and how you improved things safely.

### STAR structure
- **S (Situation)** — brief: the legacy system, the context
- **T (Task)** — your responsibility in it
- **A (Action)** — the concrete actions (observation, characterization tests, small changes, rollback plan...)
- **R (Result)** — measurable outcome (time reduced, incidents reduced, knowledge shared...)

### Example answer
*"When I joined the team there was an EOD batch that had been getting slower for years, losing an extra 15-20 minutes every day (S). My task was to guarantee it finished before the market opened (T). I measured a baseline, added the right indexes, processed the work in chunks instead of one big transaction, and added data reconciliation (A). Result: runtime dropped from 2h15 to 35 minutes, there were no data discrepancies, and I wrote a runbook so other people can operate it (R)."*

### Advice
- **Use numbers** — time, ticket counts, percentage reduced, how many people were trained.
- **Focus on actions** — "what I did", not "how bad the system was".
- **Show the mindset** — safety, measurement, knowledge sharing.
- **Avoid negativity** — say "an opportunity to improve" instead of "bad code".
- **Connect it to Senior** — reducing risk, protecting production, helping the team.

### Pitfalls
- **Only saying "I fixed bugs"** — far too shallow.
- **Badmouthing the previous team** — it creates a negative impression.
- **No result** — there is no impact.

> Senior tip: what recruiters want to know is "how do you handle a legacy system so the whole team feels safe". Tell a story about reducing risk and enabling other people — that is a clear Senior signal.`,
    follow: [
      'How do you turn "I fixed a bug" into a story with impact?',
      'What should you emphasize most when telling a maintenance story?'
    ],
  },

  'scenario-103': {
    q: 'First week on a new project: how do you quickly understand the business flows instead of only reading code?',
    a: `**Summary:** do not try to read the whole codebase immediately. Follow one real business flow from beginning to end (end-to-end), combining documentation, the people who know the domain, and real data, to build a mental map of the flows. The goal of week one is understanding the "why" rather than "all of the how".

### The real situation
When joining a banking project about money transfers, many new developers try to read the entire service layer and get overwhelmed. A more effective approach is to pick one example flow: "internal transfer", from the mobile app screen → API → validation → source account → destination account → ledger posting → notification. From that single flow you learn both the business and the technology.

### A 5-day roadmap
1. **Day 1 - Orientation**: read the README, the high-level architecture diagram, and the business glossary (the terminology dictionary). Get to know the team and who the BA/PO/main business contact is.
2. **Day 2 - Observe a real user**: sit with the BA/business users and run the flow for real in the UAT/staging environment in the role of a user. Write down every screen, every button click, and each failure situation.
3. **Day 3 - Trace end-to-end**: pick one concrete request (e.g. a successful transfer). Follow the logs with the {{traceId}} or {{correlationId}} from API Gateway → service → database → message broker. Draw a simple sequence diagram.
4. **Day 4 - Understand the business rules**: read the {{status}} column and the status history (audit/history table). Ask why states such as PENDING/APPROVED/REJECTED/CANCELLED exist. Find the validation rules, the transfer limits, and the time cut-offs.
5. **Day 5 - Synthesize**: draw the business map (main flows + exceptions), write your personal glossary, and list the questions that are still unclear so you can discuss them.

### A real trace example
~~~text
[User] App → POST /transfers {from, to, amount}
  → API Gateway (authN/Z) 
    → TransferService.validate() (transfer limit, balance)
      → AccountService.checkBalance() (DB: accounts)
        → LedgerService.postEntries() (DB: ledger_entries + balance update)
          → NotificationService.publish(TransferCompleted)
            → SMS/Push
DB audit: transfer_id, status, actor, timestamp
~~~

### Common mistakes
- **Reading code before understanding the business**: you easily go the wrong direction and never know why the code has to be the way it is.
- **Asking too generally**: "What does this system do?" is hard to answer. Instead, "Why was this transaction rejected with this error code?" is far more effective.
- **Looking only at the happy path**: the exception flows (insufficient balance, over the limit, cut-off time) are usually the most important ones for maintenance.

### How to answer in the interview
*"I focus on tracing one real business flow end-to-end first - from UI to DB. I shadow the BA, read the audit/history tables to understand state transitions, and map exceptions. That way I learn the business rules and the system together, not in isolation."*

> Senior tip: the golden rule is "follow the data". Do not wander through call stacks at random — take one real transaction in the DB (find a transfer_id) and trace backwards which services it passed through. That is 3-5 times faster than reading the whole service layer.`,
    follow: [
      'When tracing, how do you tell the main flows apart from the exception flows?',
      'When should you ask the BA, and when should you trace through the logs/code yourself?'
    ],
  },
});
