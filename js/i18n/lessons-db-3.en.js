/*
 * English translation of js/data/lessons-db.js — task T692. Format: js/core/i18n.js (content overlay).
 * ids: lesson-db-006 lesson-db-007
 */
App.i18n.content({
  'lesson-db-006': {
    title: 'Inside a connection pool: borrow, waiting timeouts and leak detection',
    goals: ['Explain why opening one connection is expensive and what a pool saves', 'Model slot borrow/release with a Semaphore and a FIFO queue', 'Distinguish connectionTimeout, statement_timeout and lock_timeout', 'Write code that borrows a connection and never forgets to return it', 'Turn on leak detection logs and read them'],
    body: `**Summary:** A connection pool keeps a small number of already-open connections to the database so that many requests can share them. You need to be clear on three things: where the real cost of opening a connection comes from, how long the app waits when no slot is free and which error it then throws, and why one connection held for too long (a leak) can bring a whole service down while the database is still perfectly healthy.

### Where the real cost of opening a connection sits
Calling {{dataSource.getConnection()}} does not merely create a Java object. Underneath it is a whole chain of work:

- A TCP handshake with the database host (one round-trip; on AWS add DNS resolution and one load balancer tier).
- The TLS handshake: sending the certificate, deriving a shared key (several round-trips, CPU on both sides).
- Authentication: PostgreSQL defaults to SCRAM-SHA-256, essentially a challenge/response sequence, one more round-trip.
- The database allocates resources for the session. PostgreSQL serves each connection with its own **backend process**; that process reserves its own {{work_mem}} and its own lock cache. SQL Server/Oracle use threads/sessions, slightly lighter but not free.
- The driver builds session state ({{search_path}}, timezone, prepared statement cache).

The total usually lands around 10-50 ms, and several hundred ms when regions differ. Meanwhile a lookup query on a primary key returns in roughly 1 ms. If every HTTP request opened and then closed a connection, you would pay a "startup" fee several times higher than the actual work, over and over. A pool exists so that fee is paid exactly N times (N = the number of connections in the pool), not once per request.

### Inside the pool: slots, permits and a FIFO queue
Picture the pool as N slots where each slot is one real connection. Borrowing means occupying a slot, releasing means freeing it. There are three parts: the connection store, a counter of free slots (exactly modelled by {{Semaphore(N)}}), and a queue of waiters served FIFO so nobody starves forever.

HikariCP has {{connectionTimeout}}, default 30000 ms: if that time passes and no slot could be taken, {{getConnection()}} throws a {{SQLTransientConnectionException}} along the lines of "request timed out after 30000 ms waiting for a connection". Note this is an **application-side** error: the database never received a single SQL statement.

~~~seq
title: Two requests competing for one slot
actors: Req B | Pool | Req A | PostgreSQL
Req A -> Pool: borrow
Pool --> Req A: slot 0, marked as borrowed
Req A -> PostgreSQL: slow SELECT, 4 seconds
Req B -> Pool: borrow
note Pool: no slot left, Req B queued, deadline = now + timeout
PostgreSQL --> Req A: result
Req A -> Pool: release slot 0
Pool -> Req B: hand over slot 0 FIFO
Req B -> PostgreSQL: UPDATE
~~~

### Three kinds of timeout, do not mix them up
| Timeout | Set where | Default | When it fires it means |
|---|---|---|---|
| {{connectionTimeout}} | HikariCP | 30000 ms | could not borrow a connection from the pool |
| {{socketTimeout}} | JDBC socket | driver-specific | the DB accepted the query but answers too slowly |
| {{statement_timeout}} | PostgreSQL | 0 (off) | the DB cancels a query that runs too long |
| {{lock_timeout}} | PostgreSQL | 0 (off) | waiting for a lock took too long |
| {{idle_in_transaction_session_timeout}} | PostgreSQL | 0 (off) | a transaction was opened and then sat idle |

The database-side timeouts are off by default, so one bad query can hang indefinitely and hold a slot forever. That is why production should set {{statement_timeout}} per tier (for example 5 seconds for OLTP).

### Why a small pool is often faster than a big one
The database has only K CPU cores. Each connection is a process; once the number of concurrently running queries exceeds K, those processes merely fight over CPU. Adding connections at that point adds no power, only context switches and memory. The well-known starting formula from the PostgreSQL wiki is {{cores * 2 + spindles}} (cores times 2, plus the number of spinning disks); on an SSD machine spindles counts as 0, so 8 cores suggest a pool around 16 for the **whole system**, not per pod.

| Sizing choice | Typical outcome |
|---|---|
| 20 pods x pool of 20 = 400 connections | DB runs out of memory, high context switching, p99 rises |
| total pool close to the core count, PgBouncer behind it | stable throughput, the queue moves to the app side |
| a big pool "to be safe" | cascading failure: every service pushes more load onto the DB |

The intuition comes from Little's Law: slots currently occupied = throughput times connection hold time. Hold a connection twice as long and you need twice as many slots, so cutting hold time is usually more effective than growing the pool.

### Leaks: borrowed and never returned
The textbook example - code that forgets to close:

~~~java
Connection c = dataSource.getConnection();
List rows = query(c);           // throws an exception here
return toDto(rows);             // the release below never runs
~~~

The correct version, safe on every path including exceptions:

~~~java
try (Connection c = dataSource.getConnection()) {
    return toDto(query(c));     // close runs automatically when the block exits
}
~~~

HikariCP has {{leakDetectionThreshold}}, default 0 (off); set to 60000 and the pool logs a message with the **stack trace of the borrow site** for any connection still unreturned after 60 seconds. The stack trace points at where the connection was taken, not at where the code is stuck, but that is enough to trace back to the method. Common enemies: HTTP/gRPC calls, Redis reads, waiting on the user, or Kafka sends made while holding a connection or while a transaction is open.

> Rule of thumb: borrow the connection as close to the SQL as possible, return it in finally or with try-with-resources, and keep the transaction as short as you can.

### idleTimeout, maxLifetime and dead connections
- {{idleTimeout}} (HikariCP default 600000 ms): a connection that sits idle for too long is closed so the database gets its resources back.
- {{maxLifetime}} (default 1800000 ms = 30 minutes): a connection is retired **before** a firewall or load balancer kills it, so the app never borrows a connection that is already dead. It must be smaller than the idle timeout of any device in between; for example the AWS NLB default kills idle connections after 350 seconds.
- When the database restarts or fails over, no old connection is usable any more; the pool notices through errors at borrow time and replaces them with new connections gradually.

### Common production mistakes
- Growing the pool to "fix" slowness while the real cause is a query holding a transaction open for 30 seconds.
- Not setting {{statement_timeout}}, so one report that runs for an hour occupies a slot.
- Forgetting to add up the pools of every replica plus background jobs and admin tools.
- Looking only at connections in use, not at how many waiters there are and how long they wait to borrow.
- Releasing connections manually without a finally, so the exception path leaks slowly until the pool runs dry.

### Interview notes
Answer in four layers: (1) opening a connection is expensive because of TCP, TLS, authentication and a separate backend process, (2) the pool is a finite resource, borrowed FIFO, and when slots run out you wait until {{connectionTimeout}} and then get {{SQLTransientConnectionException}}, (3) a bigger pool is not automatically faster because the database has limited CPU and memory - start from {{cores * 2 + spindles}} and then benchmark, (4) the fixes: move HTTP/cache calls outside the transaction, enable leak detection when you suspect a missing release, set {{idle_in_transaction_session_timeout}} on the DB so no session sits idle mid-transaction, and keep {{maxLifetime}} below the load balancer idle timeout. Then describe how you measure: active, pending, borrow wait time, transaction duration, and database wait events.

> Senior tip: when the pool runs dry, what you need to find is "who is holding a slot and for how long", not "how many slots are missing"; one {{SELECT state, now() - xact_start FROM pg_stat_activity ORDER BY 2 DESC}} usually answers it right away.
`,
    exercises: [{
      title: 'MiniPool: borrow with a timeout and detect connections held too long',
      prompt: `Implement {{MiniPool}} using {{java.util.concurrent.Semaphore}} and an injected {{java.time.Clock}} so nothing depends on the real system clock.

- The constructor {{MiniPool(size, timeoutMs, clock)}} creates exactly {{size}} slots numbered from 0; a negative {{size}} throws {{IllegalArgumentException}}.
- {{borrow()}} requests one permit but waits at most {{timeoutMs}}. If no permit can be taken, throw {{IllegalStateException}} (modelling an exhausted pool). With a permit in hand, return an unused slot with the smallest id and record the borrow time as {{clock.millis()}}.
- {{release(c)}} frees the slot and the permit. A {{null}} {{c}}, or a connection that is not currently borrowed (a double release), is ignored: no extra permit is released.
- {{leased()}} returns the number of slots currently borrowed.
- {{leakedOver(thresholdMs)}} returns the number of borrowed slots held longer than {{thresholdMs}} according to the current {{clock.millis()}}.

Do not use {{Thread.sleep}} and do not advance real time. It must work with many threads: two threads never receive the same slot.`,
      hints: ['Use {{Semaphore(size, true)}} and {{tryAcquire(timeoutMs, TimeUnit.MILLISECONDS)}}; on failure throw {{IllegalStateException}}.','Mark slots with a {{Conn}} array holding a {{leased}} flag: on borrow set {{borrowedAt = clock.millis()}}, and release must refuse to release a permit when the slot is already free.','leakedOver counts only leased slots and compares {{clock.millis() - borrowedAt}} against the threshold.','Concurrency test: {{ExecutorService}}, a {{CountDownLatch}} waiting for the start signal, and {{Future.get}} to surface exceptions.'],
      explain: `The Semaphore acts as the slot counter; {{tryAcquire}} with a timeout is exactly the real pool behaviour "wait up to {{connectionTimeout}} and then throw", while the injected Clock makes the hold-time accounting deterministic (independent of machine speed). Releasing a permit on a double release is the classic bug: the pool gains a phantom slot, two threads use one connection, and everything breaks in a very hard to predict way - so {{release}} must check state before releasing a permit. In production HikariCP does not use a Semaphore but a "ConcurrentBag" plus a FIFO queue for requests; the idea is still bounded borrowing, bounded waiting, mandatory return. {{maxLifetime}} and {{idleTimeout}} are a different concern: they close connections proactively to avoid dead ones and have nothing to do with pool exhaustion.`
    }],
    check: [
      {q:'The app reports "request timed out waiting for a connection" while the database is completely healthy. What is the most plausible cause?',options:['The database was shut down','The pool is exhausted because connections are held too long or leaked, so new requests cannot get a slot','The statement timeout is too small','An index got corrupted'],answer:1,explain:'This error is produced at the pool layer before any SQL is sent; you must find who is holding connections and for how long.'},
      {q:'Why can raising the pool from 10 to 200 make everything slower?',options:['Because JDBC does not support large pools','Because the driver has to open many connections at once','Because the database has limited CPU and memory; each extra connection is another process competing for resources and adds no power','Because PostgreSQL forbids more than 100 connections'],answer:2,explain:'Once DB CPU is saturated, extra connections only add context switches and memory; max_connections is also a hard ceiling.'},
      {q:'What does enabling HikariCP leakDetectionThreshold give you?',options:['A log with the stack trace of the borrow site for a connection still unreturned after the threshold','A list of slow queries','Automatic closing of transactions held open too long','The safe maximum number of connections'],answer:0,explain:'It prints where the connection was acquired and forgotten, which lets you trace the line missing a close or holding it across an external call.'},
      {q:'Which behaviour definitely causes a connection leak?',options:['Using try-with-resources','Borrowing a connection and returning early in one branch without a finally','Setting a low connectionTimeout','Closing the pool at shutdown'],answer:1,explain:'An early return skips the release call; try-with-resources or finally are the only safe patterns.'}
    ]
  },
  'lesson-db-007': {
    title: 'Deadlock: two transactions locking in opposite directions and how the database breaks the cycle',
    goals: ['Draw the lock schedule of two opposite-direction transfer transactions', 'Explain the wait-for graph and why a cycle means deadlock', 'State how the database picks a victim and what error code 40P01 is', 'Apply the fixed lock order rule and bounded retry'],
    body: `**Summary:** A deadlock is two (or more) transactions that each hold a lock and each wait for a lock held by the other, so nobody can make progress. The database detects the wait cycle and cancels one side so the rest can run. The main prevention is to make every transaction lock rows in the same order.

### Recap: how row locks work
When you run {{UPDATE account SET balance = balance - 100 WHERE id = 1}}, the database places a **row lock** (a lock on exactly that one row) in write mode, and under the two-phase locking rule it **keeps that lock until commit or rollback** - it never releases halfway. Another transaction that wants to write the same row has to wait. Waiting is normal; waiting in both directions is what becomes a deadlock.

### The classic scenario: opposite-direction transfers
Two requests arrive almost at the same time: T1 transfers from A to B, T2 transfers from B to A.

~~~sql
-- T1                                 -- T2
START TRANSACTION;                     START TRANSACTION;
UPDATE acc SET bal = bal - 10          UPDATE acc SET bal = bal + 10
  WHERE id = 'A';                        WHERE id = 'B';
-- holds lock on A, waiting for B        -- holds lock on B, waiting for A
UPDATE acc SET bal = bal + 10          UPDATE acc SET bal = bal - 10
  WHERE id = 'B';                        WHERE id = 'A';
COMMIT;                                COMMIT;
~~~

~~~seq
title: A lock wait cycle between two transactions
actors: T1 | DB | T2
T1 -> DB: UPDATE account A
DB --> T1: holds lock on A
T2 -> DB: UPDATE account B
DB --> T2: holds lock on B
T1 -> DB: UPDATE account B
note DB: B is held by T2, so T1 must wait
T2 -> DB: UPDATE account A
note DB: A is held by T1, so T2 must wait
note T1..T2: the cycle: T1 waits for T2 and T2 waits for T1
~~~

The wait-for graph (vertices are transactions, edges mean "is waiting for") forms a ring:

~~~text
T1 ---> T2        (T1 waits for a lock T2 currently holds)
T1 <--- T2        (T2 waits for a lock T1 currently holds)
the cycle: T1 -> T2 -> T1
~~~

T1 cannot release A because it has not committed; T2 cannot release B because it has not committed; both just keep waiting. Waiting longer never resolves on its own, so the database has to cut the cycle: this is a deadlock, formally defined as **a cycle in the wait-for graph**.

### How the database detects the cycle and breaks it
Detecting cycles is expensive, so PostgreSQL does not check on every lock wait. The parameter {{deadlock_timeout}} (default 1000 ms): only after a transaction has waited for a lock for more than 1 second does the server build the wait-for graph and look for a cycle. That is why the production symptom is usually "one transaction froze for about a second and then died".

PostgreSQL reports {{ERROR: deadlock detected}}, SQLSTATE {{40P01}}, and logs which locks each side holds and waits for. MySQL/InnoDB detects almost immediately, reports {{ERROR 1213 (HY000): Deadlock found}} and prints details into {{SHOW ENGINE INNODB STATUS}}; Oracle reports ORA-00060 and rolls back only the statement that was found in the wait cycle, so the application must still handle the error and decide whether to roll back the transaction or retry; SQL Server reports error 1205.

The side that gets cancelled is the **victim**, and each DB picks it differently: PostgreSQL cancels the transaction that needs "the least work to finish", MySQL picks the transaction with the fewest uncommitted changes (smallest undo), SQL Server picks by a preset rollback cost. No system promises "kill the youngest transaction"; the exercise below uses the youngest rule only to have one deterministic, easy to test law.

A cancelled transaction must be re-run **in full** by the application (start a new transaction, re-read the data, recompute), not just the SQL statement that died, because the earlier steps were already rolled back.

### Prevention
1. **Lock in a fixed order.** Every transaction sorts the ids it needs to lock in the same direction, for example always lock the smaller id first. This is the cheapest and most effective fix, exactly {{TransferLocks.order(a, b)}} in the exercise.
2. **Route both writes through one service that fixes the order**, instead of letting each business branch write its own two UPDATEs in its own order.
3. **Keep transactions short.** Do not call HTTP, read Redis, or wait for the user inside a transaction; every second a lock is held widens the collision window.
4. **Index the UPDATE condition.** {{UPDATE ... WHERE customer_id = ?}} without an index scans and locks more rows, which raises the odds of collisions (in PostgreSQL, locking during a scan depends on the plan and the isolation level; the general idea stands: the wider the scan, the more rows keep locks).
5. **Split the work or use a queue keyed by the lock.** Route all operations on one account to a single worker so two transactions never meet on the same row.
6. **Retry with a bound** on code 40P01 (MySQL 1213, SQL Server 1205), with backoff; deadlocks caused by a lock timeout carry SQLSTATE {{55P03}} ({{lock_not_available}}), and a serialization failure is {{40001}} - retrying may be fine, but do not confuse the causes.
7. If contention stays too high, consider redesigning: one atomic UPDATE covering both sides, keeping the balance in a single row, or optimistic locking (see the version check lesson).

| Phenomenon | Signature | Handling |
|---|---|---|
| Normal blocking | one side waits, the other commits soon | nothing to do, unless the wait is too long |
| Deadlock | a cycle, neither side can proceed | the DB kills one side, the application retries |
| Starvation | a waiter never gets its turn | a FIFO queue is not enough, check transaction priority |
| Lost update | nobody waits, one write overwrites another | version check or an atomic UPDATE (see the previous lesson) |

### Common mistakes
- Retrying only the SQL statement instead of the whole transaction: the business flow loses the debit performed in an earlier step.
- Retrying without a bound while the system is overloaded, which creates more deadlocks (load amplification).
- Two code paths for the same feature with opposite orders - someone added a feature and forgot the lock rule.
- Logs that do not print lock context, so the deadlock cannot be reproduced: keep the inputs and the two involved ids in controlled logs.

### Interview notes
Describe the cycle correctly: T1 holds A and waits for B, T2 holds B and waits for A; explain the wait-for graph and the cycle; say the DB detects it (PostgreSQL after {{deadlock_timeout}}, MySQL almost immediately) and cancels one transaction with SQLSTATE {{40P01}}; then give the three defence layers in priority order: a single lock order enforced at the service layer, short transactions, bounded retry of the whole transaction. Add how you would measure: deadlocks per minute, lock wait time, the list of id pairs that keep colliding.

> Senior tip: in a transfer flow a fixed order is usually enough; if you keep seeing deadlocks on the same pair of keys, the problem is in the model (many transactions touching the same hot rows), so change the design - one two-column UPDATE or per-account batching - instead of only adding retries.
`,
    exercises: [{
      title: 'Wait-for graph: find the cycle, pick the victim, and a safe lock order',
      prompt: `Implement {{WaitForGraph}} (a cycle in the lock wait graph) and {{TransferLocks}} (a fixed lock order).

{{WaitForGraph}}:
- {{addWait(tx, holder)}} records "tx is waiting for holder". Each transaction is numbered by its first appearance: an appearance **later** means **younger**.
- {{findCycle()}} returns the list of transactions in one cycle, following the direction "the first waits for the next, the last waits for the first"; with no cycle it returns an empty list. The result must be deterministic: try DFS from the oldest transaction, in the order edges were added, and rotate the cycle so it starts at the oldest transaction in it.
- {{victim()}} returns the **youngest** transaction in the cycle {{findCycle()}} found, or {{null}} when there is no cycle.

{{TransferLocks}}:
- {{order(a, b)}} returns the list of ids in the order they must be locked, smaller id first (string comparison); when the two ids are equal it returns a one-element list, because the row only needs to be locked once.
- {{order}} must not depend on argument order: {{order(a, b)}} and {{order(b, a)}} must be equal.

Base every comparison on insertion order ({{LinkedHashMap}} or {{ArrayList}}); do not iterate results with {{HashSet}}/{{HashMap}}, so the same input always produces the same output.`,
      hints: ['Keep edges in a {{LinkedHashMap}} and the appearance order in an {{ArrayList}} so every result is deterministic.','DFS with {{path}} and {{onPath}}: when you reach a vertex already on the path, cut {{path}} from that vertex position to get the cycle.','The victim is the transaction with the largest index in {{born}}, counting only the transactions in the cycle.','order(a, b): compare the strings then return the list in ascending order; when both ids are equal return a single element.'],
      explain: `A cycle in the wait-for graph is precisely the definition of deadlock: every vertex holds a lock the next vertex needs. Using first appearance as "age" is just a simple deterministic rule for this exercise; real PostgreSQL picks the victim by cost-to-complete and MySQL by undo volume. The two points that matter in an interview: detection has a cost, so PostgreSQL waits past {{deadlock_timeout}} (1 second) before building the graph, and the victim is rolled back as the **whole transaction**, so the application must re-read and recompute rather than resend one SQL statement. {{TransferLocks.order}} illustrates the cheapest prevention: if every transaction locks the smaller id first, the wait graph cannot close into a ring, because edges always run from "waiting for the larger id" to "holding the smaller id" and there is no way back. In real code this helper usually takes a list of many ids and sorts all of them before locking, or you use {{SELECT ... FOR UPDATE}} with an {{ORDER BY}} in one consistent order.`
    }],
    check: [
      {q:'Which invariant is enough to keep two transactions from forming a deadlock?',options:['They use two different tables','Each transaction locks exactly two rows','Every transaction locks rows in the same fixed order','They run at READ COMMITTED'],answer:2,explain:'With one global lock order the wait-for graph only has edges in one direction, so no cycle can exist.'},
      {q:'Why does PostgreSQL usually report a deadlock about a second late?',options:['Network delay between app and DB','Because it waits for deadlock_timeout before building the wait-for graph and searching for a cycle','Because locks are ranked by priority','Because MVCC needs a snapshot'],answer:1,explain:'Cycle detection is costly, so it only runs once a transaction has already held a lock wait past deadlock_timeout, 1000 ms by default.'},
      {q:'Your transaction was killed by a deadlock. What is the correct retry?',options:['Resend only the UPDATE that just died','Start a new transaction, re-read the data and recompute the whole business operation','Lower the isolation level to avoid deadlocks','Increase deadlock_timeout'],answer:1,explain:'A deadlock rollback discards every change of the transaction, so all previous steps must be redone inside a new transaction.'},
      {q:'Which factor usually makes deadlocks increase rather than decrease?',options:['Sorting the ids to be locked in ascending order','Shortening transactions','An UPDATE whose condition has no index, so it scans and locks many rows','Capping the number of retries'],answer:2,explain:'Without an index the set of touched rows is much wider, so the number of conflicting lock pairs grows sharply.'}
    ]
  }
});
