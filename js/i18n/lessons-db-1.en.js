/*
 * English translation of js/data/lessons-db.js — task T278. Format: js/core/i18n.js (content overlay).
 * ids: lesson-db-001
 */
App.i18n.content({
  'lesson-db-001': {
    title: 'Interleaved schedules: dirty read, non-repeatable read, and lost update',
    goals: ['Construct an interleaved schedule of two transactions reading/writing', 'Distinguish dirty read, non-repeatable read, and lost update', 'Relate isolation to PostgreSQL MVCC'],
    body: `**Summary:** Isolation determines which data versions a transaction sees when multiple transactions run concurrently. Describe a concrete read/write schedule rather than just naming isolation levels.

### Interleaved schedule model
Databases do not necessarily run T1 completely before T2. The scheduler may interleave operations: T1 reads x=10, T2 writes x=20, T2 commits, T1 reads again. Each read receives a value according to the isolation policy; therefore we represent transactions as explicit operations and run them in a fixed order.

A dirty read occurs when T1 reads a value that T2 has written but not yet committed. If T2 rolls back, T1 has used a value that never becomes durable. A non-repeatable read is when the same transaction reads the same row twice but sees two different committed versions. A lost update often occurs with a read-modify-write sequence: both transactions read 10, both add 1, then both write 11; one increment is lost.

~~~java
int initial = 10;
int t1 = initial;       // T1 reads 10
int t2 = initial;       // T2 also reads 10
t1++;
t2++;
int stored = t1;        // T1 writes 11
stored = t2;            // T2 writes 11: lost update
~~~

This simulation is not a real database; it clarifies the schedule and conflict points. The fix depends on the business invariant: use an atomic update {{SET value = value + 1}}, row locking, or optimistic version checking. Raising isolation alone does not replace identifying which invariants need protection.

### PostgreSQL 15 and MVCC
PostgreSQL stores row versions (tuples) along with transaction information that created/deleted them. A snapshot determines which transactions have committed and are visible. At {{READ COMMITTED}} (the default), each SQL statement takes a new snapshot; two SELECTs in the same transaction may see different states. PostgreSQL does not allow dirty reads: {{READ UNCOMMITTED}} is treated as {{READ COMMITTED}}.

At {{REPEATABLE READ}}, the snapshot is taken at the first statement and remains stable for the duration of the transaction, so PostgreSQL blocks both non-repeatable reads and phantom reads (stricter than the SQL standard requires). If this transaction does UPDATE/DELETE or SELECT FOR UPDATE on a row that was modified and committed by another transaction after the snapshot was taken, PostgreSQL reports {{could not serialize access due to concurrent update}} (SQLSTATE 40001) instead of overwriting: the lost update is blocked, but the application must retry the entire transaction. This is snapshot isolation, not general serializability; write skew anomalies may still occur and may require {{SERIALIZABLE}} or appropriate constraints/locking. PostgreSQL's Serializable uses SSI to detect dangerous dependencies and may abort transactions (also SQLSTATE 40001); applications must retry serialization errors.

| Isolation level in PostgreSQL 15 | Dirty read | Non-repeatable / phantom | Lost update (read-then-write) | Write skew |
|---|---|---|---|---|
| READ COMMITTED | no | possible | possible | possible |
| REPEATABLE READ | no | no | blocked with error 40001 | possible |
| SERIALIZABLE | no | no | blocked with error 40001 | blocked with error 40001 |

| Need | Approach |
|---|---|
| Increment/decrement a counter | Atomic {{UPDATE}} in SQL |
| Update a row based on a read version | Optimistic locking with version |
| Protect multiple rows sharing an invariant | Constraints, appropriate locking, or {{SERIALIZABLE}} + retry |

### Production pitfalls
Long transactions keep old snapshots, making VACUUM harder to reclaim dead tuples and increasing bloat. Retrying an entire transaction must be idempotent; do not send emails/charge cards before commit. Do not conclude from a single sequential test run about concurrency: fix the interleaved schedule to reproduce races.

### Interview notes
Draw the T1/T2 schedule, record commit states and values for each read. Be explicit: PostgreSQL READ COMMITTED takes a snapshot per statement, while REPEATABLE READ takes a snapshot per transaction; explain the business anomaly and concrete mitigations.

> Senior tip: measure transaction duration and serialization failure rate; use retry with bounded backoff, and only retry parts of the workflow that are truly safe to retry.
`,
    exercises: [{
      title: 'Detect lost update in a fixed schedule',
      prompt: `Complete {{LostUpdate.run(initial, deltaA, deltaB)}} following the fixed schedule R(A), R(B), W(A), W(B): both transactions read the initial balance, each adds its own delta to the value it read, A writes first then B writes last (no version check). Return the final balance. Model the schedule correctly; do not use threads.`,
      hints: ['Both transactions must read before any write happens.', 'Compute both values from the same initial; the last write wins.'],
      explain: `The simulated schedule is R(A), R(B), W(A), W(B). Since both writes are based on the initial snapshot, the later write overwrites A's result without adding to it. In PostgreSQL, use atomic arithmetic UPDATEs when appropriate; if you must check previously read data, add a version and check the number of updated rows. READ COMMITTED alone does not make a sequence of application statements atomic.`
    }],
    check: [
      {q:'Does READ UNCOMMITTED in PostgreSQL 15 allow dirty reads?',options:['Yes','No, it is treated as READ COMMITTED','Only when using MVCC','Only with temporary tables'],answer:1,explain:'PostgreSQL does not expose dirty reads; READ UNCOMMITTED behaves like READ COMMITTED.'},
      {q:'When is the snapshot taken in READ COMMITTED?',options:['Per statement','Only at BEGIN','Only at COMMIT','On each Java getter call'],answer:0,explain:'Each SQL statement gets a new snapshot, so repeated SELECTs may see new commits.'}
    ]
  },
});
